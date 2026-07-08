/** Fire Google Ads "Start Speech" button conversion */
export function trackStartSpeech() {
  const w = window as any;
  if (typeof w.gtag === "function") {
    w.gtag("event", "conversion", {
      send_to: "AW-670106207/6s_pCNrhjrAZEN-ExL8C",
    });
  }
}
