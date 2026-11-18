// British → American English for visitors in the US and Canada.
// Whole words only, and the capitalisation of the original word is kept
// ("Honour" → "Honor", "HONOUR" → "HONOR").

const WORDS: Record<string, string> = {
  // -ise / -isation
  personalise: "personalize", personalised: "personalized", personalises: "personalizes", personalising: "personalizing",
  personalisation: "personalization",
  organise: "organize", organised: "organized", organises: "organizes", organising: "organizing", organiser: "organizer",
  organisers: "organizers", organisation: "organization", organisations: "organizations",
  recognise: "recognize", recognised: "recognized", recognises: "recognizes", recognising: "recognizing",
  realise: "realize", realised: "realized", realises: "realizes", realising: "realizing",
  specialise: "specialize", specialised: "specialized", specialises: "specializes", specialising: "specializing",
  apologise: "apologize", apologised: "apologized", apologising: "apologizing",
  customise: "customize", customised: "customized", customising: "customizing",
  finalise: "finalize", finalised: "finalized", finalising: "finalizing",
  memorise: "memorize", memorised: "memorized", memorising: "memorizing",
  emphasise: "emphasize", emphasised: "emphasized", emphasising: "emphasizing",
  prioritise: "prioritize", prioritised: "prioritized",
  summarise: "summarize", summarised: "summarized", summarising: "summarizing",
  categorise: "categorize", categorised: "categorized",
  minimise: "minimize", maximise: "maximize", optimise: "optimize", optimised: "optimized",
  authorised: "authorized", unauthorised: "unauthorized", authorise: "authorize",
  anonymised: "anonymized", capitalisation: "capitalization", utilise: "utilize",
  criticise: "criticize", criticised: "criticized", sympathise: "sympathize",
  analyse: "analyze", analysed: "analyzed", analysing: "analyzing",
  // -our
  honour: "honor", honours: "honors", honoured: "honored", honouring: "honoring", honourable: "honorable",
  humour: "humor", humorous: "humorous", humourous: "humorous",
  favourite: "favorite", favourites: "favorites", favour: "favor", favours: "favors", favourable: "favorable",
  colour: "color", colours: "colors", colourful: "colorful",
  behaviour: "behavior", behaviours: "behaviors",
  neighbour: "neighbor", neighbours: "neighbors",
  labour: "labor", savour: "savor", flavour: "flavor", flavours: "flavors", rumour: "rumor", endeavour: "endeavor",
  // -re
  centre: "center", centres: "centers", theatre: "theater", metre: "meter", metres: "meters",
  // doubled l
  travelling: "traveling", travelled: "traveled", traveller: "traveler", travellers: "travelers",
  cancelled: "canceled", cancelling: "canceling", modelling: "modeling", marvellous: "marvelous",
  jewellery: "jewelry", fulfil: "fulfill", enrol: "enroll",
  // other
  programme: "program", programmes: "programs", catalogue: "catalog", dialogue: "dialog",
  defence: "defense", grey: "gray", practise: "practice", practised: "practiced", practising: "practicing",
  mum: "mom", mums: "moms", "mum's": "mom's",
  enthralments: "enthrallments",
};

const PATTERN = new RegExp(`\\b(${Object.keys(WORDS).join("|")})\\b`, "gi");

/** Convert British spellings in a piece of text to American ones. */
export function toAmerican(text: string): string {
  if (!text) return text;
  return text.replace(PATTERN, (match) => {
    const us = WORDS[match.toLowerCase()];
    if (!us) return match;
    if (match.length > 1 && match === match.toUpperCase()) return us.toUpperCase();
    if (match[0] === match[0].toUpperCase()) return us[0].toUpperCase() + us.slice(1);
    return us;
  });
}

const SKIP = "script,style,textarea,input,select,code,pre,[contenteditable],[data-no-localize]";
const ATTRS = ["placeholder", "aria-label", "title", "alt"];

function fixAttrs(el: Element) {
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (v) {
      const u = toAmerican(v);
      if (u !== v) el.setAttribute(a, u);
    }
  }
}

function fixText(n: Node) {
  const before = n.nodeValue ?? "";
  const after = toAmerican(before);
  if (after !== before) n.nodeValue = after;
}

function localizeNode(node: Node) {
  const parent = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  if (!parent || parent.closest(SKIP)) return;
  if (node.nodeType === Node.TEXT_NODE) return fixText(node);
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  fixAttrs(node as Element);
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode: (n) =>
      n.nodeType === Node.ELEMENT_NODE && (n as Element).matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) fixText(n);
    else fixAttrs(n as Element);
  }
}

/** Keep the whole page in American English, including text that appears later. Returns a stop function. */
export function startUsEnglish(): () => void {
  localizeNode(document.body);
  document.title = toAmerican(document.title);
  const obs = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === "characterData") localizeNode(r.target);
      else if (r.type === "attributes") localizeNode(r.target);
      else r.addedNodes.forEach(localizeNode);
    }
    const t = toAmerican(document.title);
    if (t !== document.title) document.title = t;
  });
  obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  return () => obs.disconnect();
}
