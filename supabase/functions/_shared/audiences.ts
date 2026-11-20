// Live-audience rehearsal: one "room" per speech type.
// Used by rehearsal-start (to brief the AI audience) and rehearsal-feedback
// (target length and what good looks like for this occasion).

export interface Audience {
  /** Short description of the occasion, for the prompt. */
  occasion: string;
  /** Who is in the room and the mood. */
  room: string;
  /** How the room reacts, and what it never does. */
  reactions: string;
  /** How the AI opens: setting the scene before the speaker begins. */
  opening: string;
  /** Target delivery length in minutes [min, max]. */
  targetMinutes: [number, number];
  /** Laughter is part of this occasion. */
  humourWelcome: boolean;
}

const weddingReception = (who: string, extra = ""): Audience => ({
  occasion: `a wedding reception, where the speaker is giving the ${who}`,
  room: `About a hundred guests at round tables after dinner: the couple at the top table, both families, old friends, a few colleagues, and an elderly relative or two near the front. Glasses are half full and the room is warm and on the speaker's side.${extra}`,
  reactions: `Laughter that builds when a story lands, groans at good-natured teasing, a hush and the odd "aww" for the heartfelt lines, someone at the friends' table shouting a one-word heckle when a story involves them, the couple's reactions (the groom covering his face, the bride laughing). If a joke is too crude or too private, show it honestly: a few awkward looks, gran's eyebrows going up, polite silence. If a section drags, the room gets restless (chairs shift, someone checks the time).`,
  opening: `Set the scene in one or two sentences: the best man has tapped a glass, the room has quietened, all eyes are on the speaker. Then hand over, e.g. "Whenever you're ready."`,
  targetMinutes: [4, 7],
  humourWelcome: true,
});

const parentReception = (who: string): Audience => ({
  occasion: `a wedding reception, where the speaker is giving the ${who}`,
  room: `About a hundred guests after dinner: the couple at the top table, both families, friends of all ages. This is a warm, sentimental room, many of whom have known the couple since childhood.`,
  reactions: `Gentle, affectionate laughter at family stories, visible emotion at the tender lines (someone reaching for a tissue, the couple holding hands), warm applause after the toast. Teasing that goes too far draws an uncomfortable silence. If it becomes a list of thank-yous or drags, attention drifts.`,
  opening: `Set the scene in one or two sentences: dinner is cleared, the room hushes as the speaker stands, the couple look over. Then hand over.`,
  targetMinutes: [3, 6],
  humourWelcome: true,
});

const coupleReception = (who: string): Audience => ({
  occasion: `a wedding reception, where the speaker is giving the ${who}`,
  room: `About a hundred guests: both families, friends, colleagues. They are delighted for the couple and keen to hear from them directly.`,
  reactions: `Warm cheers at the first mention of their new spouse, laughter at self-deprecating lines, an "aww" for the romantic moments, quiet attention during thank-yous (which lose the room if they become a long list of names).`,
  opening: `Set the scene in one or two sentences: the newlywed stands up to cheers, a few people bang the table. Then hand over.`,
  targetMinutes: [3, 6],
  humourWelcome: true,
});

const party = (occasion: string, room: string, target: [number, number]): Audience => ({
  occasion,
  room,
  reactions: `Friendly laughter, cheers for in-jokes, warmth for sincere lines, a toast at the end. Long rambling sections lose people; inside jokes nobody else gets fall flat with most of the room.`,
  opening: `Set the scene in one or two sentences: glasses are topped up, someone hushes the room, and the speaker has the floor. Then hand over.`,
  targetMinutes: target,
  humourWelcome: true,
});

const corporate = (occasion: string, room: string, target: [number, number]): Audience => ({
  occasion,
  room,
  reactions: `More restrained than a party: nods and murmurs of agreement, polite laughter that is genuine when a line is sharp, attention visibly sharpening at a strong story or number, and drifting (phones, glances at the time) when it gets generic, overlong or full of jargon. Applause at a strong close.`,
  opening: `Set the scene in one or two sentences: the speaker has been introduced, the lights are on the stage, the room settles. Then hand over.`,
  targetMinutes: target,
  humourWelcome: true,
});

export const AUDIENCES: Record<string, Audience> = {
  "best-man": weddingReception("best man speech"),
  "maid-of-honour": weddingReception("maid of honour speech", " The bride's friends are at one table and very vocal."),
  "brother-of-bride": weddingReception("brother of the bride speech"),
  "father-of-bride": parentReception("father of the bride speech"),
  "mother-of-bride": parentReception("mother of the bride speech"),
  "father-of-groom": parentReception("father of the groom speech"),
  "mother-of-groom": parentReception("mother of the groom speech"),
  "groom": coupleReception("groom's speech"),
  "bride": coupleReception("bride's speech"),
  "wedding-vows": {
    occasion: "a wedding ceremony, where the speaker is reading their own vows to their partner",
    room: "A hushed ceremony: their partner standing opposite them, the celebrant, family in the front rows, friends behind. Nobody is eating or drinking; it is very quiet.",
    reactions: "Almost no noise. React through stillness and small things: their partner's eyes filling up, a squeeze of the hand, a soft collective 'aww', a gentle ripple of laughter at a light line, someone sniffing in the front row. Never loud laughter or cheering until the very end. If the vows sound generic or rushed, the moment feels flat and people shift slightly.",
    opening: "Set the scene in one sentence: the celebrant nods, the room falls silent, and their partner is looking at them. Then a very gentle hand-over.",
    targetMinutes: [1, 3],
    humourWelcome: true,
  },
  "eulogy": {
    occasion: "a funeral or memorial service, where the speaker is giving the eulogy",
    room: "A full room of family and friends who loved this person. The atmosphere is quiet, sad and respectful.",
    reactions: "Reactions are quiet and dignified: stillness, people visibly moved, a soft murmur of recognition, gentle smiles and the occasional warm, quiet laugh at a fond memory. NEVER describe loud laughter, cheering, heckling or applause. NEVER make jokes or treat it lightly. If a section is rushed or sounds like a CV, say so gently (attention drifts slightly). Be especially kind: the speaker may be grieving.",
    opening: "Set the scene in one quiet sentence: the room is still and everyone who loved this person has gathered. Then: 'Take a breath. Whenever you're ready.'",
    targetMinutes: [3, 6],
    humourWelcome: false,
  },
  "birthday": party("a birthday celebration", "Friends and family at a party, drinks in hand, the birthday person front and centre and slightly embarrassed.", [2, 5]),
  "anniversary": party("an anniversary celebration", "Family and old friends of the couple, several generations in the room, sentimental and proud.", [3, 6]),
  "graduation": party("a graduation celebration", "Family, friends and fellow graduates, proud and in a good mood.", [3, 6]),
  "baby-shower": party("a baby shower", "Close friends and family of the parents-to-be, relaxed and affectionate.", [2, 4]),
  "engagement-party": party("an engagement party", "Friends and family of the newly engaged couple, celebratory and lively.", [2, 5]),
  "retirement": corporate("a retirement party", "Colleagues past and present, family, and the retiree in the front row, warm and nostalgic, in a function room or office.", [3, 7]),
  "farewell": corporate("a farewell or leaving do", "Colleagues and friends gathered to say goodbye, drinks in hand, fond and slightly emotional.", [2, 5]),
  "corporate-event": corporate("a corporate event", "Colleagues, clients and senior leadership, professional but open to a good speech.", [5, 12]),
  "awards-ceremony": corporate("an awards ceremony", "A ballroom of industry peers in evening dress, between courses and awards.", [2, 5]),
  "keynote": corporate("a conference keynote", "A conference audience of several hundred professionals, attentive but quick to judge anything generic.", [10, 25]),
  "charity-gala": corporate("a charity gala dinner", "Supporters, donors and guests in evening dress, generous but needing to be moved to give.", [4, 8]),
  "golf-club": {
    ...corporate("a golf club or sports dinner", "Club members and guests after a long dinner and a few drinks, a lively, teasing crowd that loves a story about a terrible shot.", [5, 10]),
    reactions: "Loud laughter and table-banging when a story lands, cheerful heckles from the members, groans at golf puns, restlessness if it drags or becomes a list of results.",
  },
};

export const DEFAULT_AUDIENCE: Audience = weddingReception("speech");

export function audienceFor(speechType: string): Audience {
  return AUDIENCES[speechType] ?? DEFAULT_AUDIENCE;
}
