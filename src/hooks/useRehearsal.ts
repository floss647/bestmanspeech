import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Live-audience rehearsal over OpenAI Realtime (WebRTC).
 *
 * The speaker taps to start a section and taps again when they want the room
 * to react. Their mic is only live while a section is being spoken, so the
 * room never interrupts mid-sentence and never hears itself.
 *
 *   start()       mint a session via the rehearsal-start edge function, open mic + WebRTC
 *   startSection  un-mute and clear the input buffer
 *   endSection    mute, commit the audio and ask the room to react
 *   finish()      hang up and return the turns for the coaching report
 */

export type RehearsalStatus = "idle" | "connecting" | "ready" | "speaking" | "reacting" | "ended" | "error";
export type Turn = { role: "speaker" | "audience"; text: string; ms?: number };

type StartResponse = {
  rehearsalId?: string;
  clientSecret?: string;
  model?: string;
  remaining?: number;
  speechText?: string;
  error?: string;
  code?: string;
};

export function useRehearsal(speechId: string | null, accessToken: string | null, versionIndex: number) {
  const [status, setStatus] = useState<RehearsalStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [liveReaction, setLiveReaction] = useState("");
  const [rehearsalId, setRehearsalId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [sectionStartedAt, setSectionStartedAt] = useState<number | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedAtRef = useRef<number>(0);
  const sectionStartRef = useRef<number | null>(null);
  const turnsRef = useRef<Turn[]>([]);
  const pendingSpeakerIdx = useRef<number[]>([]);
  const awaitingResponse = useRef(false);

  const setTurnsBoth = (next: Turn[]) => {
    turnsRef.current = next;
    setTurns(next);
  };

  const teardown = useCallback(() => {
    try { dcRef.current?.close(); } catch { /* noop */ }
    try { pcRef.current?.close(); } catch { /* noop */ }
    dcRef.current = null;
    pcRef.current = null;
    micRef.current?.getTracks().forEach((t) => t.stop());
    micRef.current = null;
    if (audioRef.current) {
      try { audioRef.current.pause(); audioRef.current.srcObject = null; } catch { /* noop */ }
      audioRef.current = null;
    }
  }, []);

  useEffect(() => () => teardown(), [teardown]);

  const send = (evt: unknown) => {
    const dc = dcRef.current;
    if (dc && dc.readyState === "open") dc.send(JSON.stringify(evt));
  };

  const handleEvent = useCallback((evt: { type: string; [k: string]: unknown }) => {
    switch (evt.type) {
      case "response.created":
        setStatus((s) => (s === "speaking" ? s : "reacting"));
        return;
      case "response.output_audio_transcript.delta":
      case "response.audio_transcript.delta":
        if (typeof evt.delta === "string") setLiveReaction((p) => p + evt.delta);
        return;
      case "response.output_audio_transcript.done":
      case "response.audio_transcript.done": {
        const text = typeof evt.transcript === "string" ? evt.transcript.trim() : "";
        if (text) setTurnsBoth([...turnsRef.current, { role: "audience", text }]);
        return;
      }
      case "response.done":
        awaitingResponse.current = false;
        setStatus((s) => (s === "speaking" ? s : "ready"));
        return;
      case "conversation.item.input_audio_transcription.completed": {
        const text = typeof evt.transcript === "string" ? evt.transcript.trim() : "";
        const idx = pendingSpeakerIdx.current.shift();
        if (idx === undefined) return;
        const next = [...turnsRef.current];
        if (next[idx]) next[idx] = { ...next[idx], text };
        setTurnsBoth(next);
        return;
      }
      case "error": {
        const msg = (evt.error as { message?: string } | undefined)?.message ?? "";
        // Benign: cancelling when nothing is playing, committing an empty buffer.
        if (/no active response|buffer too small|empty/i.test(msg)) return;
        console.warn("[rehearsal] realtime error", evt);
        return;
      }
      default:
        return;
    }
  }, []);

  const start = useCallback(async () => {
    if (!speechId || !accessToken) return;
    setError(null);
    setStatus("connecting");
    teardown();
    setTurnsBoth([]);
    setLiveReaction("");
    pendingSpeakerIdx.current = [];

    try {
      const { data, error: fnErr } = await supabase.functions.invoke<StartResponse>("rehearsal-start", {
        body: { speechId, accessToken, versionIndex },
      });
      let payload: StartResponse | null = data ?? null;
      if (fnErr) {
        // supabase-js puts non-2xx bodies on error.context
        try {
          const ctx = (fnErr as unknown as { context?: Response }).context;
          payload = ctx ? await ctx.json() : null;
        } catch { /* noop */ }
        throw new Error(payload?.error || "We couldn't open the rehearsal room. Please try again.");
      }
      if (!payload?.clientSecret || !payload.rehearsalId) {
        throw new Error(payload?.error || "We couldn't open the rehearsal room. Please try again.");
      }
      setRehearsalId(payload.rehearsalId);
      setRemaining(payload.remaining ?? null);

      const mic = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      micRef.current = mic;
      mic.getAudioTracks().forEach((t) => { t.enabled = false; });

      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" && pcRef.current === pc) {
          setError("The connection dropped. Tap Finish for notes on what you've done, or start again.");
          setStatus("error");
        }
      };

      const audio = new Audio();
      audio.autoplay = true;
      audio.setAttribute("playsinline", "");
      audioRef.current = audio;
      pc.ontrack = (e) => {
        if (audio.srcObject !== e.streams[0]) {
          audio.srcObject = e.streams[0];
          audio.play().catch(() => { /* noop */ });
        }
      };
      mic.getTracks().forEach((t) => pc.addTrack(t, mic));

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onmessage = (e) => {
        try { handleEvent(JSON.parse(e.data)); } catch { /* noop */ }
      };
      const opened = new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Connecting timed out. Check your connection and try again.")), 25_000);
        dc.onopen = () => { clearTimeout(timer); resolve(); };
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const sdpRes = await fetch(`https://api.openai.com/v1/realtime/calls?model=${encodeURIComponent(payload.model || "")}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${payload.clientSecret}`, "Content-Type": "application/sdp" },
        body: offer.sdp,
      });
      if (!sdpRes.ok) throw new Error("We couldn't connect the rehearsal room. Please try again.");
      await pc.setRemoteDescription({ type: "answer", sdp: await sdpRes.text() });
      await opened;

      startedAtRef.current = Date.now();
      // The room sets the scene before they begin.
      setLiveReaction("");
      awaitingResponse.current = true;
      send({ type: "response.create" });
      setStatus("reacting");
    } catch (e) {
      teardown();
      const err = e as Error;
      const denied = err?.name === "NotAllowedError" || /permission/i.test(err?.message || "");
      setError(denied
        ? "We need your microphone to hear your speech. Please allow microphone access and try again."
        : err?.message || "We couldn't open the rehearsal room. Please try again.");
      setStatus("error");
    }
  }, [speechId, accessToken, versionIndex, teardown, handleEvent]);

  const startSection = useCallback(() => {
    const mic = micRef.current;
    if (!mic || !dcRef.current) return;
    if (awaitingResponse.current) send({ type: "response.cancel" });
    if (audioRef.current) audioRef.current.muted = true;
    send({ type: "input_audio_buffer.clear" });
    mic.getAudioTracks().forEach((t) => { t.enabled = true; });
    const now = Date.now();
    sectionStartRef.current = now;
    setSectionStartedAt(now);
    setLiveReaction("");
    setStatus("speaking");
  }, []);

  const endSection = useCallback((askForReaction = true) => {
    const mic = micRef.current;
    if (!mic) return;
    mic.getAudioTracks().forEach((t) => { t.enabled = false; });
    const began = sectionStartRef.current;
    sectionStartRef.current = null;
    setSectionStartedAt(null);
    if (began === null) return;
    const ms = Date.now() - began;
    if (ms < 800) {
      send({ type: "input_audio_buffer.clear" });
      setStatus("ready");
      return;
    }
    const next = [...turnsRef.current, { role: "speaker" as const, text: "", ms }];
    pendingSpeakerIdx.current.push(next.length - 1);
    setTurnsBoth(next);
    if (audioRef.current) audioRef.current.muted = false;
    send({ type: "input_audio_buffer.commit" });
    if (askForReaction) {
      awaitingResponse.current = true;
      send({ type: "response.create" });
      setStatus("reacting");
    } else {
      setStatus("ready");
    }
  }, []);

  /** Hang up. Waits briefly for the last transcript, then returns the turns. */
  const finish = useCallback(async (): Promise<{ turns: Turn[]; totalMs: number }> => {
    if (sectionStartRef.current !== null) endSection(false);
    const deadline = Date.now() + 6000;
    while (pendingSpeakerIdx.current.length > 0 && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 250));
    }
    const totalMs = startedAtRef.current ? Date.now() - startedAtRef.current : 0;
    teardown();
    setStatus("ended");
    return { turns: turnsRef.current.filter((t) => t.text.trim()), totalMs };
  }, [endSection, teardown]);

  return {
    status, error, turns, liveReaction, rehearsalId, remaining, sectionStartedAt,
    start, startSection, endSection, finish,
  };
}
