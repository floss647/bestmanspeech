export const CORE_METHODOLOGY = `You are a world-class speechwriter. Your speeches are written to be SPOKEN, not read. Every line earns its place.

CRITICAL RULE — NAMES AND FACTS:
- ONLY use names, places, dates, and facts that are explicitly provided in the user details below
- NEVER invent, guess, or hallucinate any names, stories, or details that were not supplied
- If a detail is missing, write around it naturally — do not fabricate placeholder content
- If a name field is empty or not provided, do NOT insert a made-up name — instead restructure the sentence to work without it

UNIVERSAL RULE — SENSITIVE FAMILY SITUATIONS:
- NEVER use the words "divorce", "divorced", "separation", or "separated" in any speech
- If the speaker's parents are no longer together, navigate this subtly without labelling it — simply adjust the welcome or acknowledgement naturally
- Never draw attention to difficult family dynamics; handle them with grace, warmth, and discretion
- The audience should never feel uncomfortable about anyone's family situation`;

export interface SpeechPromptConfig {
  context: string;
  systemPrompt: string;
  minWordCount: number;
  userPromptTemplate: (details: Record<string, any>) => string;
}

export const SPEECH_PROMPTS: Record<string, SpeechPromptConfig> = {
  "best-man": {
    context: "This is a best man speech at a wedding. Balance humour with genuine emotion. The audience wants to laugh AND feel something.",
    systemPrompt: buildBestManPrompt(),
    minWordCount: 1400,
    userPromptTemplate: (details) => buildBestManUserPrompt(details),
  },

  "groom": {
    context: "This is the groom's speech. Open with gratitude that doesn't feel like a roll call, honour key people, declare love without cliché, close with a unifying toast.",
    systemPrompt: buildGroomPrompt(),
    minWordCount: 1400,
    userPromptTemplate: (details) => buildGroomUserPrompt(details),
  },

  "bride": {
    context: "This is the bride's speech. Surprise the room by speaking from the heart. Acknowledge those who matter, celebrate the partnership, leave them moved.",
    systemPrompt: buildBridePrompt(),
    minWordCount: 1400,
    userPromptTemplate: (details) => buildBrideUserPrompt(details),
  },

  "father-of-bride": {
    context: "This is a father of the bride speech — one of the most emotional moments. Balance pride with humour, sincerity with brevity. It should feel like a gift.",
    systemPrompt: buildFatherOfBridePrompt(),
    minWordCount: 1350,
    userPromptTemplate: (details) => buildFatherOfBrideUserPrompt(details),
  },

  "mother-of-bride": {
    context: "This is a mother of the bride speech. Fill it with love, wisdom, and memories. It should feel like a warm embrace in words.",
    systemPrompt: buildMotherOfBridePrompt(),
    minWordCount: 1350,
    userPromptTemplate: (details) => buildMotherOfBrideUserPrompt(details),
  },

  "brother-of-bride": {
    context: "This is a brother of the bride speech. Celebrate your sister with warmth, wit, and genuine pride.",
    systemPrompt: buildBrotherOfBridePrompt(),
    minWordCount: 1350,
    userPromptTemplate: (details) => buildBrotherOfBrideUserPrompt(details),
  },

  "maid-of-honour": {
    context: "This is a maid of honour speech. Lead with warmth and celebration of the bride. Make it feel intimate — like a letter read aloud to a dear friend.",
    systemPrompt: buildMaidOfHonourPrompt(),
    minWordCount: 1350,
    userPromptTemplate: (details) => buildMaidOfHonourUserPrompt(details),
  },

  "father-of-groom": {
    context: "This is a father of the groom speech. Welcome a new family member with warmth and pride. Share what makes your son special.",
    systemPrompt: buildFatherOfGroomPrompt(),
    minWordCount: 1350,
    userPromptTemplate: (details) => buildFatherOfGroomUserPrompt(details),
  },

  "mother-of-groom": {
    context: "This is a mother of the groom speech. Celebrate your son's journey and welcome his bride with warmth and grace.",
    systemPrompt: buildMotherOfGroomPrompt(),
    minWordCount: 1350,
    userPromptTemplate: (details) => buildMotherOfGroomUserPrompt(details),
  },
  "birthday": {
    context: "This is a birthday speech. It may be the speaker's own birthday or a speech about someone else. Celebrate the person with warmth, humour, and heart.",
    systemPrompt: buildBirthdayPrompt(),
    minWordCount: 1200,
    userPromptTemplate: (details) => buildBirthdayUserPrompt(details),
  },

  "retirement": {
    context: "This is a retirement speech. It may be the speaker's own retirement or a tribute to someone else retiring. Honour the career and the person behind it.",
    systemPrompt: buildRetirementPrompt(),
    minWordCount: 1300,
    userPromptTemplate: (details) => buildRetirementUserPrompt(details),
  },

  "anniversary": {
    context: "This is an anniversary speech. It may be the speaker celebrating their own marriage or honouring another couple. Celebrate enduring love.",
    systemPrompt: buildAnniversaryPrompt(),
    minWordCount: 1300,
    userPromptTemplate: (details) => buildAnniversaryUserPrompt(details),
  },

  "eulogy": {
    context: "This is a eulogy. Honour the deceased with dignity, warmth, and authentic storytelling. It should comfort the living while celebrating the life of the departed.",
    systemPrompt: buildEulogyPrompt(),
    minWordCount: 1400,
    userPromptTemplate: (details) => buildEulogyUserPrompt(details),
  },

  "graduation": {
    context: "This is a graduation speech. Celebrate achievement, growth, and the excitement of what lies ahead.",
    systemPrompt: buildGraduationPrompt(),
    minWordCount: 1200,
    userPromptTemplate: (details) => buildGraduationUserPrompt(details),
  },

  "baby-shower": {
    context: "This is a baby shower speech. Celebrate the joy of a new arrival with warmth, humour, and heart.",
    systemPrompt: buildBabyShowerPrompt(),
    minWordCount: 1000,
    userPromptTemplate: (details) => buildBabyShowerUserPrompt(details),
  },

  "engagement-party": {
    context: "This is an engagement party speech. Celebrate the couple and kick off the excitement of their journey to marriage.",
    systemPrompt: buildEngagementPartyPrompt(),
    minWordCount: 1100,
    userPromptTemplate: (details) => buildEngagementPartyUserPrompt(details),
  },

  "corporate-event": {
    context: "This is a corporate event speech. Be polished, engaging, and audience appropriate.",
    systemPrompt: buildCorporateEventPrompt(),
    minWordCount: 1200,
    userPromptTemplate: (details) => buildCorporateEventUserPrompt(details),
  },

  "awards-ceremony": {
    context: "This is an awards ceremony speech. It may be accepting or presenting an award. Deliver with charisma and gratitude.",
    systemPrompt: buildAwardsCeremonyPrompt(),
    minWordCount: 1000,
    userPromptTemplate: (details) => buildAwardsCeremonyUserPrompt(details),
  },

  "farewell": {
    context: "This is a farewell speech. Say goodbye with warmth, gratitude, and class.",
    systemPrompt: buildFarewellPrompt(),
    minWordCount: 1200,
    userPromptTemplate: (details) => buildFarewellUserPrompt(details),
  },

  "golf-club": {
    context: "This is a golf club or sports dinner speech. Be witty, warm, and entertaining for the clubhouse crowd.",
    systemPrompt: buildGolfClubPrompt(),
    minWordCount: 1200,
    userPromptTemplate: (details) => buildGolfClubUserPrompt(details),
  },

  "charity-gala": {
    context: "This is a charity gala speech. Inspire generosity and move the room to action.",
    systemPrompt: buildCharityGalaPrompt(),
    minWordCount: 1200,
    userPromptTemplate: (details) => buildCharityGalaUserPrompt(details),
  },

  "keynote": {
    context: "This is a keynote or conference speech. Open or close an event with impact, authority, and insight.",
    systemPrompt: buildKeynotePrompt(),
    minWordCount: 1300,
    userPromptTemplate: (details) => buildKeynoteUserPrompt(details),
  },

  "wedding-vows": {
    context: "These are personalised wedding vows. Intimate, authentic, and deeply personal. They should sound like a love letter spoken aloud.",
    systemPrompt: buildWeddingVowsPrompt(),
    minWordCount: 500,
    userPromptTemplate: (details) => buildWeddingVowsUserPrompt(details),
  },
};

// ============= BEST MAN =============
function buildBestManPrompt(): string {
  return `${CORE_METHODOLOGY}

Context: This is a best man speech at a wedding. Balance humour with genuine emotion. The audience wants to laugh AND feel something.

CRITICAL CONSTRAINTS:
- ABSOLUTE MINIMUM 1400 words
- Chronological story flow (not the order answers are given)
- NO hyphens of any kind
- NO sentences starting with "Now"
- NO phrase "and speaking of" (use different transitions)
- NO phrase "picture this"
- NO word "folks"
- NO word "union" (when talking about marriage)
- NO word "stunning" (use "beautiful" instead)
- NO surnames
- DO NOT mention any difficulties in the bride and groom's relationship
- The best man does not talk about himself
- British spelling

Use the conditional template structure below. Fill in sections with supplied content. The placeholders in curly braces should be replaced with actual content derived from user answers.

TEMPLATE STRUCTURE:

[GROOM'S NAME]'s Speech

[IF BEST MAN IS A FRIEND]
Good afternoon everyone, my name is [BEST MAN NAME], and it is my very great pleasure and privilege to be [GROOM]'s best man for today's celebrations.
[/IF BEST MAN IS A FRIEND]

[IF BEST MAN IS A BROTHER]
Good afternoon everyone, my name is [BEST MAN NAME], I'm [GROOM]'s brother, and it is my very great pleasure and privilege to be his best man for today's celebrations.
[/IF BEST MAN IS A BROTHER]

[IF BEST MAN IS A TWIN]
Good afternoon everyone, my name is [BEST MAN NAME], I'm [GROOM]'s twin brother, and it is my very great pleasure and privilege to be his best man for today's celebrations.
[/IF BEST MAN IS A TWIN]

When it came to writing this speech I have to say I was a little worried. After all, how do you describe a guy whose favourite hobby is [SOMETHING SARCASTIC OR FUNNY FROM HIS ANSWERS, THINGS THAT DEFINITELY ARE NOT HOBBIES]...and who counts [SOMETHING FUNNY OR SARCASTIC FROM HIS ANSWERS, THINGS THAT DEFINITELY ARE NOT ACHIEVEMENTS] ...as two of his greatest ever lifetime achievements?

You have to start at the beginning....

[IF BEST MAN IS A FRIEND]
I first met [GROOM] in [WHENEVER/WHEREVER]. [DESCRIBE WITH COMEDY - USE CHARACTER OR APPEARANCE TRAITS]. I realised he really needed some kind of support, and so I agreed to become his friend. I'm pleased to say this is a decision that has largely worked out for the best...however, what I didn't realise at the time was how much looking after [GROOM] was going to require....[FUNNY STORY/STORIES ABOUT THE GROOM TOLD ORIGINALLY. USE MAXIMUM DETAIL]

This was obviously a challenging time for [GROOM], but maybe not as challenging as when [FUNNY STORY/STORIES TOLD ORIGINALLY WITH DETAIL]

....Proving this wasn't just a one off lapse of judgement...[FUNNY STORY/STORIES WITH DETAIL]
[/IF BEST MAN IS A FRIEND]

[IF BEST MAN IS BROTHER - INCLUDE CHILDHOOD MEMORIES AND CHARACTER DEVELOPMENT WITH FUNNY ANECDOTES]

So, what is the journey that has brought [GROOM] here today marrying the very beautiful [BRIDE]?

I think it's fair to say that [GROOM] was much like any other teenager, dreaming of the future. But his main talents were [SOMETHING SILLY FROM ANSWERS] and [HOBBIES/INTERESTS]...and he was struggling to see how he could combine them to find someone special.

[IF SCHOOL INFO PROVIDED]
At the time, [GROOM] absolutely loved school...especially the holidays...lunch times...and the bit where you get to go home at the end of the day. The pinnacle of his academic achievements was [SOMETHING FUNNY FROM SCHOOL DAYS OR "REMEMBERING TO GO EVERY NOW AND AGAIN"]
[/IF SCHOOL INFO PROVIDED]

[IF UNIVERSITY = YES]
But seriously, [GROOM] is a bright guy. After successfully completing his school days he went off to university. His university days proved to be a real journey of discovery, mainly discovering how much daytime TV you could watch...which as it turns out, was quite a lot.

After he graduated, [GROOM] knew he had to think of something that would earn him a living. He sensed he needed some direction and purpose in life, so decided to write down all the things he was good at and enjoyed...and went from there.
[/IF UNIVERSITY = YES]

[IF UNIVERSITY = NO]
But seriously, [GROOM] is a bright guy. After successfully completing his education he started his journey into the working world. He knew he had to think of something for the future that would earn him a living. He sensed he needed some direction and purpose in life.
[/IF UNIVERSITY = NO]

[HERE HAVE FUN WITH HIS JOB/CAREER. The guys who interviewed him for his first job loved [GROOM] as they'd been looking for someone with [FUNNY CHARACTERISTIC], and so they snapped him up.]

Well, I'm pleased to say that his career is going from strength to strength. But of course [GROOM] hasn't been on this journey alone...he did indeed find that special someone.

Yes, dating was to be interesting for [GROOM], and he eventually realised that trying to get girls to like you is almost impossible if [SOMETHING ABOUT HIS CHARACTER LIKE 'IT LOOKS LIKE YOU GOT DRESSED IN THE DARK'].

[IF THEY MET AT WORK]
So, he came up with a plan that involved trying to talk to women at work, in the hope that contractually they might have to talk back to him...and unbelievably it worked.
[/IF THEY MET AT WORK]

[IF THEY MET IN A PUB OR NIGHTCLUB]
So, he came up with a plan that involved trying to talk to women in local nightclubs, in the hope that with the aid of alcohol and low lighting they might be more likely to talk back to him...and unbelievably it worked.
[/IF THEY MET IN A PUB OR NIGHTCLUB]

[IF THEY MET ON THE INTERNET]
But luckily somebody really clever had invented the internet, and somebody even cleverer had invented internet dating. Suddenly [GROOM] was in with a chance...and unbelievably it worked.
[/IF THEY MET ON THE INTERNET]

[IF THEY MET THROUGH FRIENDS]
So, he came up with a plan that involved trying to talk to friends of friends in the hope that they might be more likely to talk back to him...and unbelievably it worked.
[/IF THEY MET THROUGH FRIENDS]

[IF THEY MET AT UNIVERSITY]
So, he came up with a plan that involved trying to juggle his drinking with talking normally to girls that were at university with him, in the hope that they might talk back to him...and unbelievably it worked.
[/IF THEY MET AT UNIVERSITY]

[IF NOTHING ELSE APPLIES]
So, he came up with a plan that involved trying to be himself and talk normally to girls in the hope that they might talk back to him...and unbelievably it worked.
[/IF NOTHING ELSE APPLIES]

Yes, somebody this special was always going to meet someone equally special, and one day [GROOM] met the very beautiful [BRIDE], and so we find ourselves here today.

Rumour has it that [BRIDE] was completely bowled over by [GROOM]'s [SOMETHING FUNNY FROM HIS CHARACTER], and in turn [GROOM] just couldn't believe somebody this pretty was willing to take him on as a project.

Seriously [BRIDE], I know everyone here will agree with me when I say you look absolutely beautiful. [GROOM] really is a very lucky guy. I know just what a great couple you make, and I couldn't be any happier for you both, standing here today as his best man. Everyone can see just how complete you've made him. With your love and support, he's an even better version of the man we know and love. For that, I cannot thank you enough.

[IF GROOM IS A BROTHER]
[BRIDE], on behalf of all of us I would just like to say...welcome to the family!
[/IF GROOM IS A BROTHER]

[IF THE GROOM IS A FRIEND]
[GROOM], how do I sum up all these years of friendship in just a few sentences? Well, you've always been a great friend and good fun since the very beginning. We've shared a lot of good times together and made many happy memories, especially...[ADD ANYTHING HERE THAT HASN'T BEEN MENTIONED BEFORE]
[/IF THE GROOM IS A FRIEND]

[IF THE GROOM IS A BROTHER]
[GROOM], how do I sum up all these years of being your brother and what you mean to us in just a few sentences? Well, you've always been a great mate and a good laugh since the very beginning. We've shared a lot of good times together and made many happy memories, especially...[ADD ANYTHING HERE THAT HASN'T BEEN MENTIONED BEFORE]
[/IF THE GROOM IS A BROTHER]

But you're more than just a guy for the good times. You've always been there to help, support and encourage others no matter what. For all those times that's included me, I will be forever grateful.

It's all these things and more that make not just me, but so many others count themselves lucky to have you in their lives.

So, thanks for making the tough times not so tough and the good times really good times. Here's to many more of those in the years to come.

All that remains is for me to wish you both a long, happy and healthy married life together and all the luck in the world.

I would like to propose a toast: To [GROOM] and [BRIDE]!`;
}

function buildBestManUserPrompt(details: Record<string, any>): string {
  const d = details;
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const v = d[key];
      if (typeof v === "string" && v.trim().length > 0) return v;
    }
    return "";
  };
  const lines = [
    pick("firstName") && `Speaker's name: ${pick("firstName")}`,
    pick("surname") && `Speaker's surname: ${pick("surname")}`,
    pick("howKnowGroom", "bestManRelationship") && `Relationship to groom: ${pick("howKnowGroom", "bestManRelationship")}`,
    pick("aboutYou") && `About the speaker: ${pick("aboutYou")}`,
    pick("groomName") && `Groom's name: ${pick("groomName")}`,
    pick("brideName") && `Bride's name: ${pick("brideName")}`,
    pick("groomJob") && `Groom's job: ${pick("groomJob")}`,
    pick("firstMet") && `First time they met: ${pick("firstMet")}`,
    pick("passions") && `Groom's passions: ${pick("passions")}`,
    pick("dislikes") && `What he doesn't like: ${pick("dislikes")}`,
    pick("youngerCharacter") && `Character when younger: ${pick("youngerCharacter")}`,
    pick("grownCharacter") && `Character grown into: ${pick("grownCharacter")}`,
    pick("wantedToBe") && `What he wanted to be: ${pick("wantedToBe")}`,
    pick("stories") && `Key stories/anecdotes: ${pick("stories")}`,
    pick("likeSchool") && `Did he like school: ${d.likeSchool}`,
    pick("university") && `Did he go to university: ${d.university}`,
    pick("biggestDisaster") && `His biggest disaster: ${pick("biggestDisaster")}`,
    d.hasChildren === "Yes" && pick("childrenNames") && `Children's names: ${pick("childrenNames")}`,
    pick("howTheyMet") && `How the couple met: ${pick("howTheyMet")}`,
    pick("brideEffect") && `Effect she's had on him: ${pick("brideEffect")}`,
    pick("helpedYou") && `Ways he's helped the speaker: ${pick("helpedYou")}`,
  ].filter(Boolean).join("\n");

  return `Write a complete best man speech using these details:\n${lines}\n\nMake it personal, specific, and authentic. Use the groom's first name and bride's first name naturally throughout (including early in the speech). Follow the template structure. Aim for 1400+ words.`;
}

// ============= GROOM =============
function buildGroomPrompt(): string {
  return `${CORE_METHODOLOGY}

Context: This is the groom's speech. Open with gratitude that doesn't feel like a roll call, honour key people, declare love without cliché, close with a unifying toast.

CRITICAL CONSTRAINTS:
- ABSOLUTE MINIMUM 1400 words
- British spelling
- NO hyphens of any kind
- SPECIFIC OPENING FORMULA: "Good afternoon, everyone…firstly on behalf of my wife and I…I would like to welcome you all here today, it really does mean so much to us both to be able to celebrate with the people that we love and care about…"
- The groom must NOT introduce himself
- Chronological story flow
- NO word "folks"
- NO word "union"
- NO word "stunning" (use "beautiful" instead)
- NO surnames
- NO phrase "where do I even begin?"
- Structural order: Welcome/FOB thanks, travellers, Absent Friends toast (if yes), Groom's parents, Bride's parents, Parent toast, Best Man joke, Groomsmen, Bridesmaids, Bridesmaid toast, The Bride (met/first date/passions), Proposal summary, Future toast

Build the speech with genuine emotion, authentic gratitude, and a clear toast at the end. Use the supplied details to craft a narrative that flows naturally through time.`;
}

function buildGroomUserPrompt(details: Record<string, any>): string {
  const d = details;
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const v = d[key];
      if (typeof v === "string" && v.trim().length > 0) return v;
    }
    return "";
  };
  const lines = [
    pick("firstName") && `Groom's first name: ${pick("firstName")}`,
    pick("surname") && `Groom's surname: ${pick("surname")}`,
    pick("brideName") && `Bride's name: ${pick("brideName")}`,
    pick("howMet", "whereMet") && `How they met: ${pick("howMet", "whereMet")}`,
    pick("firstImpression") && `First impression of her: ${pick("firstImpression")}`,
    pick("whenKnew") && `When he knew she was the one: ${pick("whenKnew")}`,
    pick("whatLove") && `What he loves most about her: ${pick("whatLove")}`,
    pick("proposal", "proposalStory") && `How he proposed: ${pick("proposal", "proposalStory")}`,
    pick("herFamily") && `Her family: ${pick("herFamily")}`,
    pick("herParentsNames", "brideParents") && `Her parents' names: ${pick("herParentsNames", "brideParents")}`,
    pick("thankHerParents") && `Thanks for her parents: ${pick("thankHerParents")}`,
    pick("yourParentsNames", "parentsNames") && `His parents' names: ${pick("yourParentsNames", "parentsNames")}`,
    pick("thankYourParents") && `Thanks for his parents: ${pick("thankYourParents")}`,
    pick("bestManName") && `Best man's name: ${pick("bestManName")}`,
    pick("thankBestMan", "bestManDetails") && `About the best man: ${pick("thankBestMan", "bestManDetails")}`,
    pick("bridesmaids", "bridesmaidsInfo") && `Bridesmaids: ${pick("bridesmaids", "bridesmaidsInfo")}`,
    pick("specialMentions", "weddingHelpers") && `Special mentions: ${pick("specialMentions", "weddingHelpers")}`,
    d.hasChildren === "Yes" && pick("childrenNames", "childrenInfo") && `Children: ${pick("childrenNames", "childrenInfo")}`,
    pick("absentFriends", "absentFriendsToast") && `Toast to absent friends: ${pick("absentFriends", "absentFriendsToast")}`,
    pick("absentFriendsDetails", "absentFriendDetails") && `About them: ${pick("absentFriendsDetails", "absentFriendDetails")}`,
    pick("futurePlans") && `Future plans: ${pick("futurePlans")}`,
    pick("funnyStory") && `Funny story: ${pick("funnyStory")}`,
    pick("weddingVenue") && `Wedding venue: ${pick("weddingVenue")}`,
    pick("honeymoon") && `Honeymoon: ${pick("honeymoon")}`,
    pick("closingMessage") && `Closing message: ${pick("closingMessage")}`,
  ].filter(Boolean).join("\n");

  return `Write a complete groom's speech using these details:\n${lines}\n\nMake it personal, authentic, and emotionally honest. Use the bride's first name naturally throughout (including early in the speech). Aim for 1400+ words. Follow the structural order provided in the constraints.`;
}

// ============= BRIDE =============
function buildBridePrompt(): string {
  return `${CORE_METHODOLOGY}

Context: This is the bride's speech. Surprise the room by speaking from the heart. Acknowledge those who matter, celebrate the partnership, leave them moved.

CRITICAL CONSTRAINTS:
- ABSOLUTE MINIMUM 1400 words
- British spelling
- NO hyphens of any kind
- SPECIFIC OPENING FORMULA: "Good afternoon, everyone…firstly on behalf of my husband and I…I would like to welcome you all here today, it really does mean so much to us both to be able to celebrate with the people that we love and care about…"
- The bride must NOT introduce herself
- MUST contain 400+ words about the groom alone
- Chronological story flow
- NO word "folks"
- NO word "stunning" (use "beautiful" instead)
- NO surnames
- NO phrase "where do I even begin?"
- Structural order: Welcome/father thanks, travellers, Absent Friends toast (if yes), Groom's parents, Bride's parents, Parent toast, Best Man joke, Groomsmen/ushers, Bridesmaids, Bridesmaid toast, The Groom (first meeting/personality), Proposal summary, Future toast

Build an intimate, authentic speech that celebrates the partnership and honours those who matter. Make the audience feel the love and gratitude.`;
}

function buildBrideUserPrompt(details: Record<string, any>): string {
  const d = details;
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const v = d[key];
      if (typeof v === "string" && v.trim().length > 0) return v;
    }
    return "";
  };
  const lines = [
    pick("firstName") && `Bride's first name: ${pick("firstName")}`,
    pick("surname") && `Bride's surname: ${pick("surname")}`,
    pick("groomName") && `Groom's name: ${pick("groomName")}`,
    pick("howMet", "whereMet") && `How they met: ${pick("howMet", "whereMet")}`,
    pick("firstImpression") && `First impression of him: ${pick("firstImpression")}`,
    pick("whenKnew") && `When she knew he was the one: ${pick("whenKnew")}`,
    pick("whatLove") && `What she loves most about him: ${pick("whatLove")}`,
    pick("proposal", "proposalStory") && `How he proposed: ${pick("proposal", "proposalStory")}`,
    pick("hisFamily") && `His family: ${pick("hisFamily")}`,
    pick("hisParentsNames", "groomParents") && `His parents' names: ${pick("hisParentsNames", "groomParents")}`,
    pick("thankHisParents") && `Thanks for his parents: ${pick("thankHisParents")}`,
    pick("yourParentsNames", "parentsNames") && `Her parents' names: ${pick("yourParentsNames", "parentsNames")}`,
    pick("thankYourParents") && `Thanks for her parents: ${pick("thankYourParents")}`,
    pick("maidOfHonour", "maidOfHonourDetails") && `Maid of honour's name: ${pick("maidOfHonour", "maidOfHonourDetails")}`,
    pick("thankMaidOfHonour", "whyChoseMOH") && `About the maid of honour: ${pick("thankMaidOfHonour", "whyChoseMOH")}`,
    pick("specialMentions") && `Special mentions: ${pick("specialMentions")}`,
    d.hasChildren === "Yes" && pick("childrenNames", "childrenInfo") && `Children: ${pick("childrenNames", "childrenInfo")}`,
    pick("absentFriends", "absentFriendsToast") && `Toast to absent friends: ${pick("absentFriends", "absentFriendsToast")}`,
    pick("absentFriendsDetails", "absentFriendDetails") && `About them: ${pick("absentFriendsDetails", "absentFriendDetails")}`,
    pick("futurePlans") && `Future plans: ${pick("futurePlans")}`,
    pick("funnyStory") && `Funny story: ${pick("funnyStory")}`,
    pick("closingMessage") && `Closing message: ${pick("closingMessage")}`,
  ].filter(Boolean).join("\n");

  return `Write a complete bride's speech using these details:\n${lines}\n\nMake it deeply personal and authentic. Use the groom's first name naturally throughout (including early in the speech). Spend significant time (400+ words) on the groom. Aim for 1400+ words.`;
}

// ============= FATHER OF BRIDE =============
function buildFatherOfBridePrompt(): string {
  return `${CORE_METHODOLOGY}

Context: This is a father of the bride speech — one of the most emotional moments. Balance pride with humour, sincerity with brevity. It should feel like a gift.

CRITICAL CONSTRAINTS:
- ABSOLUTE MINIMUM 1350 words
- British spelling
- NO hyphens of any kind
- Chronological story flow (not the order answers are given)
- NO surnames
- NO word "folks"
- NO word "stunning" (use "beautiful" instead)
- NO mention of the wedding date
- NEVER reference the parents' relationship status in any way — no "no longer married", "separated", "although we", "on my own", etc.
- The opening is ONLY about welcoming guests and celebrating the couple — nothing else
- Do NOT thank or acknowledge the bride's mother in the opening lines — she can be mentioned later in the speech body naturally
- If the father has a current partner, they can be mentioned warmly later in the speech — NOT in the opening
- If the bride's mother and the current partner share the same first name, distinguish them clearly throughout
- MUST include toast to absent friends (if requested) around third paragraph
- Never highlight difficult family situations
- Build from birth memories through to present day
- Emotional without being maudlin
- Toast to the couple at the end

OPENING TEMPLATE (use this exact structure):
[IF STILL MARRIED]
Good afternoon everyone, my name is [FATHER'S NAME], and on behalf of myself and [WIFE'S NAME], I would like to welcome you all here today to celebrate the marriage of [DAUGHTER'S NAME] and [GROOM'S NAME].
[/IF STILL MARRIED]

[IF NOT STILL MARRIED]
Good afternoon everyone, my name is [FATHER'S NAME], and I would like to welcome you all here today to celebrate the marriage of [DAUGHTER'S NAME] and [GROOM'S NAME].
[/IF NOT STILL MARRIED]

After the opening, move straight into your story — the journey of your daughter from birth to today. Do NOT list acknowledgements. Weave mentions of key people into the narrative naturally as the story unfolds.

Create a speech that feels like a proud father sharing his journey with his daughter, celebrating her growth, and welcoming her new partner with warmth and grace.`;
}

function buildFatherOfBrideUserPrompt(details: Record<string, any>): string {
  const d = details;

  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = d[key];
      if (typeof value === "string" && value.trim().length > 0) return value;
      if (typeof value === "boolean") return value;
    }
    return "";
  };

  const daughterName = pick("daughterName", "brideName");
  const groomName = pick("groomName");
  const motherName = pick("wifeName", "motherName");
  const partnerName = pick("partnerName");

  const lines = [
    pick("firstName") && `Father's first name: ${pick("firstName")}`,
    pick("surname") && `Father's surname: ${pick("surname")}`,
    motherName && `Bride's mother's name: ${motherName}`,
    pick("motherDeceased") && `Is bride's mother deceased: ${pick("motherDeceased")}`,
    pick("marriedUntilDemise") && `Were you married until her demise: ${pick("marriedUntilDemise")}`,
    pick("stillMarried") && `Are you still married: ${pick("stillMarried")}`,
    pick("hasPartner") && `Do you have a long term partner: ${pick("hasPartner")}`,
    partnerName && `Partner's name: ${partnerName}`,
    daughterName && `Bride's name: ${daughterName}`,
    pick("howDecidedName", "nameDecision") && `How you decided upon that name: ${pick("howDecidedName", "nameDecision")}`,
    pick("dayBorn", "birthMemory") && `What you remember about the day she was born: ${pick("dayBorn", "birthMemory")}`,
    pick("earliestMemory") && `Your earliest memory of her: ${pick("earliestMemory")}`,
    pick("characterYoung", "childCharacter") && `Her character when little: ${pick("characterYoung", "childCharacter")}`,
    pick("characterNow", "characterContinued") && `Has she continued to be that character: ${pick("characterNow", "characterContinued")}`,
    pick("passionsGrowingUp", "youngPassions") && `Her passions when growing up: ${pick("passionsGrowingUp", "youngPassions")}`,
    pick("passionsNow", "currentPassions") && `Her passions now: ${pick("passionsNow", "currentPassions")}`,
    pick("thingsTogether") && `Things you did together: ${pick("thingsTogether")}`,
    pick("traitsFromYou", "inheritedFromYou") && `Traits she inherited from you: ${pick("traitsFromYou", "inheritedFromYou")}`,
    pick("traitsFromMother", "inheritedFromMother") && `What she inherited from her mother: ${pick("traitsFromMother", "inheritedFromMother")}`,
    pick("firstTriumphs", "triumphs") && `Her first big triumphs and successes: ${pick("firstTriumphs", "triumphs")}`,
    pick("childhoodStory") && `One story from her childhood that sticks out: ${pick("childhoodStory")}`,
    pick("excelledAtSchool", "schoolExcellence") && `What she excelled at at school: ${pick("excelledAtSchool", "schoolExcellence")}`,
    pick("notEnjoySchool", "schoolDisliked") && `What she really didn't enjoy at school: ${pick("notEnjoySchool", "schoolDisliked")}`,
    pick("wentToUni", "university") && `Did she go to university or college: ${pick("wentToUni", "university")}`,
    pick("uniDetails", "universityDetails") && `Which university and what course: ${pick("uniDetails", "universityDetails")}`,
    pick("career") && `What career did she embark on: ${pick("career")}`,
    pick("adultAchievements") && `Her biggest achievements as an adult: ${pick("adultAchievements")}`,
    groomName && `Her husband-to-be's name: ${groomName}`,
    pick("groomParents") && `Names of his parents: ${pick("groomParents")}`,
    pick("firstMeetingGroom") && `Your first meeting with him: ${pick("firstMeetingGroom")}`,
    pick("groomCharacter") && `What sort of character he is: ${pick("groomCharacter")}`,
    pick("howTheyMet") && `How they met: ${pick("howTheyMet")}`,
    pick("suitableCouple", "whySuitable") && `What makes them such a suitable couple: ${pick("suitableCouple", "whySuitable")}`,
    pick("hasChildren") === "Yes" && pick("childrenNames") && `Children's names: ${pick("childrenNames")}`,
    pick("engagementFeelings") && `Your feelings when they announced their engagement: ${pick("engagementFeelings")}`,
    pick("absentFriends", "absentFriendsToast") && `Would you like to make a toast to absent friends: ${pick("absentFriends", "absentFriendsToast")}`,
    pick("absentFriendsDetails", "absentFriendDetails") && `Tell me about them: ${pick("absentFriendsDetails", "absentFriendDetails")}`,
  ].filter(Boolean).join("\n");

  return `Write a complete father of the bride speech using these details:\n${lines}\n\nMake it deeply personal and authentic. Balance pride with humour. Build chronologically from her birth through to today. Aim for 1350+ words. Use the daughter's first name and groom's first name naturally throughout the speech (including early in the speech), not generic placeholders like “my daughter” only.`;
}

// ============= MOTHER OF BRIDE =============
function buildMotherOfBridePrompt(): string {
  return `${CORE_METHODOLOGY}

Context: This is a mother of the bride speech. Fill it with love, wisdom, and memories. It should feel like a warm embrace in words.

CRITICAL CONSTRAINTS:
- ABSOLUTE MINIMUM 1350 words
- British spelling
- NO hyphens of any kind
- Chronological story flow
- NO surnames
- NO word "folks"
- NO word "stunning" (use "beautiful" instead)
- NO mention of the wedding date
- NEVER reference the parents' relationship status — no "no longer together", "separated", "although we", etc.
- The opening is ONLY about welcoming guests and celebrating the couple — nothing else
- Do NOT thank or acknowledge the bride's father in the opening lines — he can be mentioned later in the speech body naturally as an amazing father
- MUST include toast to absent friends (if requested) around third paragraph
- Build from pregnancy/birth memories through present
- Never highlight difficult family situations
- Emotional, intimate, celebratory tone
- Toast to the couple at the end

OPENING TEMPLATE (use this exact structure):
[IF STILL MARRIED]
Good afternoon everyone, my name is [MOTHER'S NAME], and on behalf of myself and [HUSBAND'S NAME], I would like to welcome you all here today to celebrate the marriage of [DAUGHTER'S NAME] and [GROOM'S NAME].
[/IF STILL MARRIED]

[IF NOT STILL MARRIED]
Good afternoon everyone, my name is [MOTHER'S NAME], and I would like to welcome you all here today to celebrate the marriage of [DAUGHTER'S NAME] and [GROOM'S NAME].
[/IF NOT STILL MARRIED]

After the opening, move straight into your story. Do NOT list acknowledgements. Weave mentions of key people into the narrative naturally.

Create a speech that celebrates motherhood, the journey with your daughter, and the joy of this moment. Make it feel like a mother's love expressed through words.`;
}

function buildMotherOfBrideUserPrompt(details: Record<string, any>): string {
  const d = details;
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const v = d[key];
      if (typeof v === "string" && v.trim().length > 0) return v;
    }
    return "";
  };
  const lines = [
    pick("firstName") && `Mother's first name: ${pick("firstName")}`,
    pick("surname") && `Mother's surname: ${pick("surname")}`,
    pick("husbandName", "fatherName") && `Bride's father's name: ${pick("husbandName", "fatherName")}`,
    pick("fatherDeceased") && `Is bride's father deceased: ${pick("fatherDeceased")}`,
    pick("marriedUntilDemise") && `Were you married until his demise: ${pick("marriedUntilDemise")}`,
    pick("stillMarried") && `Are you still married: ${pick("stillMarried")}`,
    pick("hasPartner") && `Do you have a long term partner: ${pick("hasPartner")}`,
    pick("partnerName") && `Partner's name: ${pick("partnerName")}`,
    pick("daughterName", "brideName") && `Bride's name: ${pick("daughterName", "brideName")}`,
    pick("howDecidedName", "nameDecision") && `How you decided upon that name: ${pick("howDecidedName", "nameDecision")}`,
    pick("dayBorn", "birthMemory") && `What you remember about the day she was born: ${pick("dayBorn", "birthMemory")}`,
    pick("earliestMemory") && `Your earliest memory of her: ${pick("earliestMemory")}`,
    pick("characterYoung", "childCharacter") && `Her character when little: ${pick("characterYoung", "childCharacter")}`,
    pick("characterNow", "characterContinued") && `Has she continued to be that character: ${pick("characterNow", "characterContinued")}`,
    pick("passionsGrowingUp", "youngPassions") && `Her passions when growing up: ${pick("passionsGrowingUp", "youngPassions")}`,
    pick("passionsNow", "currentPassions") && `Her passions now: ${pick("passionsNow", "currentPassions")}`,
    pick("thingsTogether") && `Things you did together: ${pick("thingsTogether")}`,
    pick("traitsFromYou", "inheritedFromYou") && `Traits she inherited from you: ${pick("traitsFromYou", "inheritedFromYou")}`,
    pick("traitsFromFather", "inheritedFromFather") && `What she inherited from her father: ${pick("traitsFromFather", "inheritedFromFather")}`,
    pick("firstTriumphs", "triumphs") && `Her first big triumphs: ${pick("firstTriumphs", "triumphs")}`,
    pick("childhoodStory") && `One story from her childhood: ${pick("childhoodStory")}`,
    pick("excelledAtSchool", "schoolExcellence") && `What she excelled at at school: ${pick("excelledAtSchool", "schoolExcellence")}`,
    pick("notEnjoySchool", "schoolDisliked") && `What she didn't enjoy at school: ${pick("notEnjoySchool", "schoolDisliked")}`,
    pick("wentToUni", "university") && `Did she go to university: ${pick("wentToUni", "university")}`,
    pick("uniDetails", "universityDetails") && `Which university and course: ${pick("uniDetails", "universityDetails")}`,
    pick("career") && `What career did she embark on: ${pick("career")}`,
    pick("adultAchievements") && `Her biggest achievements as an adult: ${pick("adultAchievements")}`,
    pick("groomName") && `Her husband-to-be's name: ${pick("groomName")}`,
    pick("groomParents") && `Names of his parents: ${pick("groomParents")}`,
    pick("firstMeetingGroom") && `Your first meeting with him: ${pick("firstMeetingGroom")}`,
    pick("groomCharacter") && `What sort of character he is: ${pick("groomCharacter")}`,
    pick("howTheyMet") && `How they met: ${pick("howTheyMet")}`,
    pick("suitableCouple", "whySuitable") && `What makes them a suitable couple: ${pick("suitableCouple", "whySuitable")}`,
    d.hasChildren === "Yes" && pick("childrenNames") && `Children's names: ${pick("childrenNames")}`,
    pick("engagementFeelings") && `Feelings about the engagement: ${pick("engagementFeelings")}`,
    pick("absentFriends", "absentFriendsToast") && `Toast to absent friends: ${pick("absentFriends", "absentFriendsToast")}`,
    pick("absentFriendsDetails", "absentFriendDetails") && `About them: ${pick("absentFriendsDetails", "absentFriendDetails")}`,
  ].filter(Boolean).join("\n");

  return `Write a complete mother of the bride speech using these details:\n${lines}\n\nMake it deeply personal, warm, and celebratory. Use the daughter's first name and groom's first name naturally throughout (including early in the speech). Build chronologically from her birth through to today. Aim for 1350+ words.`;
}

// ============= BROTHER OF BRIDE =============
function buildBrotherOfBridePrompt(): string {
  return `${CORE_METHODOLOGY}

Context: This is a brother of the bride speech. Celebrate your sister with warmth, wit, and genuine pride.

CRITICAL CONSTRAINTS:
- ABSOLUTE MINIMUM 1350 words
- British spelling
- NO hyphens of any kind
- Chronological story flow
- NO surnames
- NO word "folks"
- NO word "stunning" (use "beautiful" instead)
- NO mention of the wedding date
- Warm acknowledgement of your parents
- MUST include toast to absent friends (if requested) around third paragraph
- Build from childhood memories through present
- Balance humour with genuine emotion
- Never highlight difficult family situations
- Should feel intimate, like speaking to close friends
- Toast to the couple at the end

Create a speech that celebrates your sister's journey, shares meaningful stories, and welcomes her new partner with genuine warmth.`;
}

function buildBrotherOfBrideUserPrompt(details: Record<string, any>): string {
  const d = details;
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const v = d[key];
      if (typeof v === "string" && v.trim().length > 0) return v;
    }
    return "";
  };
  const lines = [
    pick("firstName") && `Brother's first name: ${pick("firstName")}`,
    pick("surname") && `Brother's surname: ${pick("surname")}`,
    pick("aboutYou") && `About the speaker: ${pick("aboutYou")}`,
    pick("sisterName", "brideName") && `Sister's name: ${pick("sisterName", "brideName")}`,
    pick("olderOrYounger") && `Older or younger: ${pick("olderOrYounger")}`,
    pick("childhoodMemory", "earliestMemory") && `Favourite childhood memory: ${pick("childhoodMemory", "earliestMemory")}`,
    pick("sisterCharacter", "childCharacter") && `Her character: ${pick("sisterCharacter", "childCharacter")}`,
    pick("funnyStory", "childhoodStory") && `Funny story: ${pick("funnyStory", "childhoodStory")}`,
    pick("whatAdmire") && `What he admires about her: ${pick("whatAdmire")}`,
    pick("groomName") && `The groom's name: ${pick("groomName")}`,
    pick("firstMeetingGroom") && `First meeting with the groom: ${pick("firstMeetingGroom")}`,
    pick("howTheyMet") && `How they met: ${pick("howTheyMet")}`,
    pick("whatMakesThemGreat", "whySuitable") && `What makes them great together: ${pick("whatMakesThemGreat", "whySuitable")}`,
    pick("groomEffect") && `Effect the groom has had on her: ${pick("groomEffect")}`,
    pick("closingWish") && `Closing wish: ${pick("closingWish")}`,
  ].filter(Boolean).join("\n");

  return `Write a complete brother of the bride speech using these details:\n${lines}\n\nMake it warm, witty, and heartfelt. Use the sister's first name and groom's first name naturally throughout (including early in the speech). Aim for 1350+ words.`;
}

// ============= MAID OF HONOUR =============
function buildMaidOfHonourPrompt(): string {
  return `${CORE_METHODOLOGY}

Context: This is a maid of honour speech. Lead with warmth and celebration of the bride. Make it feel intimate — like a letter read aloud to a dear friend.

CRITICAL CONSTRAINTS:
- ABSOLUTE MINIMUM 1350 words
- British spelling
- NO hyphens of any kind
- Chronological story flow
- NO surnames
- NO word "folks"
- NO word "stunning" (use "beautiful" instead)
- NO mention of the wedding date
- Build from first memory of the bride through present
- Warm acknowledgement of the bride's parents
- MUST include toast to absent friends (if requested) around third paragraph
- Never highlight difficult family situations
- Should feel intimate and celebratory
- Balance humour with genuine emotion
- Toast to the couple at the end

Create a speech that celebrates your friendship, shares meaningful memories, and honours the bride with warmth and authenticity.`;
}

function buildMaidOfHonourUserPrompt(details: Record<string, any>): string {
  const d = details;
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const v = d[key];
      if (typeof v === "string" && v.trim().length > 0) return v;
    }
    return "";
  };
  const lines = [
    pick("firstName") && `Maid of honour's first name: ${pick("firstName")}`,
    pick("surname") && `Maid of honour's surname: ${pick("surname")}`,
    pick("aboutYou", "characterDescription") && `About the speaker: ${pick("aboutYou", "characterDescription")}`,
    pick("brideName") && `The bride's name: ${pick("brideName")}`,
    pick("howKnowBride") && `How she knows the bride: ${pick("howKnowBride")}`,
    pick("firstMet", "firstMemory") && `First time they met: ${pick("firstMet", "firstMemory")}`,
    pick("brideCharacter") && `The bride's character: ${pick("brideCharacter")}`,
    pick("passions", "bridePassions") && `The bride's passions: ${pick("passions", "bridePassions")}`,
    pick("funnyStory") && `Funny stories about the bride: ${pick("funnyStory")}`,
    pick("groomName") && `The groom's name: ${pick("groomName")}`,
    pick("howTheyMet") && `How the couple met: ${pick("howTheyMet")}`,
    pick("groomEffect") && `Effect he's had on her: ${pick("groomEffect")}`,
    pick("whatMakesThemGreat") && `What makes them a great couple: ${pick("whatMakesThemGreat")}`,
    pick("brideHelpedYou", "waysHelped") && `Ways the bride has helped the speaker: ${pick("brideHelpedYou", "waysHelped")}`,
    pick("favouriteMemory") && `Favourite memory together: ${pick("favouriteMemory")}`,
    pick("whatAdmire") && `What she admires about the bride: ${pick("whatAdmire")}`,
    d.hasChildren === "Yes" && pick("childrenNames") && `Children's names: ${pick("childrenNames")}`,
    pick("closingWish") && `Closing wish: ${pick("closingWish")}`,
  ].filter(Boolean).join("\n");

  return `Write a complete maid of honour speech using these details:\n${lines}\n\nMake it warm, intimate, and celebratory. Use the bride's first name and groom's first name naturally throughout (including early in the speech). Aim for 1350+ words.`;
}

// ============= FATHER OF GROOM =============
function buildFatherOfGroomPrompt(): string {
  return `${CORE_METHODOLOGY}

Context: This is a father of the groom speech. Welcome a new family member with warmth and pride. Share what makes your son special.

CRITICAL CONSTRAINTS:
- ABSOLUTE MINIMUM 1350 words
- British spelling
- NO hyphens of any kind
- Chronological story flow
- NO surnames
- NO word "folks"
- NO word "stunning" (use "beautiful" instead)
- NO mention of the wedding date
- NEVER reference the parents' relationship status — no "no longer married", "separated", "although we", etc.
- The opening is ONLY about welcoming guests and celebrating the couple — nothing else
- Do NOT thank or acknowledge the groom's mother in the opening lines — she can be mentioned later in the speech body naturally as an amazing mother
- MUST include toast to absent friends (if requested) around third paragraph
- Build from birth memories through present
- Never highlight difficult family situations
- Welcome the bride and her family with genuine warmth
- Balance pride with humour
- Toast to the couple at the end

OPENING TEMPLATE (use this exact structure):
[IF STILL MARRIED]
Good afternoon everyone, my name is [FATHER'S NAME], and on behalf of myself and [WIFE'S NAME], I would like to welcome you all here today to celebrate the marriage of [SON'S NAME] and [BRIDE'S NAME].
[/IF STILL MARRIED]

[IF NOT STILL MARRIED]
Good afternoon everyone, my name is [FATHER'S NAME], and I would like to welcome you all here today to celebrate the marriage of [SON'S NAME] and [BRIDE'S NAME].
[/IF NOT STILL MARRIED]

After the opening, move straight into your story. Do NOT list acknowledgements. Weave mentions of key people into the narrative naturally.

Create a speech that celebrates your son's journey, honours his mother's role in his life, and welcomes his bride with grace and warmth.`;
}

function buildFatherOfGroomUserPrompt(details: Record<string, any>): string {
  const d = details;
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const v = d[key];
      if (typeof v === "string" && v.trim().length > 0) return v;
    }
    return "";
  };
  const lines = [
    pick("firstName") && `Father's first name: ${pick("firstName")}`,
    pick("surname") && `Father's surname: ${pick("surname")}`,
    pick("wifeName", "motherName") && `Groom's mother's name: ${pick("wifeName", "motherName")}`,
    pick("stillMarried") && `Are you still married: ${pick("stillMarried")}`,
    pick("hasPartner") && `Do you have a long term partner: ${pick("hasPartner")}`,
    pick("partnerName") && `Partner's name: ${pick("partnerName")}`,
    pick("sonName", "groomName") && `Your son's name: ${pick("sonName", "groomName")}`,
    pick("howDecidedName", "nameDecision") && `How you decided upon that name: ${pick("howDecidedName", "nameDecision")}`,
    pick("dayBorn", "birthMemory") && `What you remember about the day he was born: ${pick("dayBorn", "birthMemory")}`,
    pick("earliestMemory") && `Your earliest memory of him: ${pick("earliestMemory")}`,
    pick("characterYoung", "childCharacter") && `His character when little: ${pick("characterYoung", "childCharacter")}`,
    pick("characterNow", "characterContinued") && `Has he continued to be that character: ${pick("characterNow", "characterContinued")}`,
    pick("passionsGrowingUp", "youngPassions") && `His passions when growing up: ${pick("passionsGrowingUp", "youngPassions")}`,
    pick("passionsNow", "currentPassions") && `His passions now: ${pick("passionsNow", "currentPassions")}`,
    pick("thingsTogether") && `Things you did together: ${pick("thingsTogether")}`,
    pick("traitsFromYou", "inheritedFromYou") && `Traits he inherited from you: ${pick("traitsFromYou", "inheritedFromYou")}`,
    pick("traitsFromMother", "inheritedFromMother") && `What he inherited from his mother: ${pick("traitsFromMother", "inheritedFromMother")}`,
    pick("firstTriumphs", "triumphs") && `His first big triumphs: ${pick("firstTriumphs", "triumphs")}`,
    pick("childhoodStory") && `One story from his childhood: ${pick("childhoodStory")}`,
    pick("excelledAtSchool", "schoolExcellence") && `What he excelled at at school: ${pick("excelledAtSchool", "schoolExcellence")}`,
    pick("notEnjoySchool", "schoolDisliked") && `What he didn't enjoy at school: ${pick("notEnjoySchool", "schoolDisliked")}`,
    pick("wentToUni", "university") && `Did he go to university: ${pick("wentToUni", "university")}`,
    pick("uniDetails", "universityDetails") && `Which university and course: ${pick("uniDetails", "universityDetails")}`,
    pick("career") && `What career did he embark on: ${pick("career")}`,
    pick("adultAchievements") && `His biggest achievements as an adult: ${pick("adultAchievements")}`,
    d.hasChildren === "Yes" && pick("childrenNames") && `Children's names: ${pick("childrenNames")}`,
    pick("brideName") && `His wife-to-be's name: ${pick("brideName")}`,
    pick("brideParents") && `Her parents' names: ${pick("brideParents")}`,
    pick("firstMeetingBride") && `Your first meeting with her: ${pick("firstMeetingBride")}`,
    pick("brideCharacter") && `What sort of character she is: ${pick("brideCharacter")}`,
    pick("howTheyMet") && `How they met: ${pick("howTheyMet")}`,
    pick("suitableCouple", "whySuitable") && `What makes them a suitable couple: ${pick("suitableCouple", "whySuitable")}`,
    pick("engagementFeelings") && `Feelings about the engagement: ${pick("engagementFeelings")}`,
    pick("absentFriends", "absentFriendsToast") && `Toast to absent friends: ${pick("absentFriends", "absentFriendsToast")}`,
    pick("absentFriendsDetails", "absentFriendDetails") && `About them: ${pick("absentFriendsDetails", "absentFriendDetails")}`,
  ].filter(Boolean).join("\n");

  return `Write a complete father of the groom speech using these details:\n${lines}\n\nMake it deeply personal and authentic. Use the son's first name and bride's first name naturally throughout (including early in the speech). Build chronologically from his birth through to today. Aim for 1350+ words.`;
}

// ============= MOTHER OF GROOM =============
function buildMotherOfGroomPrompt(): string {
  return `${CORE_METHODOLOGY}

Context: This is a mother of the groom speech. Celebrate your son's journey and welcome his bride with warmth and grace.

CRITICAL CONSTRAINTS:
- ABSOLUTE MINIMUM 1350 words
- British spelling
- NO hyphens of any kind
- Chronological story flow
- NO surnames
- NO word "folks"
- NO word "stunning" (use "beautiful" instead)
- NO mention of the wedding date
- NEVER reference the parents' relationship status — no "no longer together", "separated", "although we", etc.
- The opening is ONLY about welcoming guests and celebrating the couple — nothing else
- Do NOT thank or acknowledge the groom's father in the opening lines — he can be mentioned later in the speech body naturally as an amazing father
- MUST include toast to absent friends (if requested) around third paragraph
- Build from pregnancy/birth memories through present
- Never highlight difficult family situations
- Welcome the bride with genuine warmth
- Emotional, celebratory, and intimate tone
- Toast to the couple at the end

OPENING TEMPLATE (use this exact structure):
[IF STILL MARRIED]
Good afternoon everyone, my name is [MOTHER'S NAME], and on behalf of myself and [HUSBAND'S NAME], I would like to welcome you all here today to celebrate the marriage of [SON'S NAME] and [BRIDE'S NAME].
[/IF STILL MARRIED]

[IF NOT STILL MARRIED]
Good afternoon everyone, my name is [MOTHER'S NAME], and I would like to welcome you all here today to celebrate the marriage of [SON'S NAME] and [BRIDE'S NAME].
[/IF NOT STILL MARRIED]

After the opening, move straight into your story. Do NOT list acknowledgements. Weave mentions of key people into the narrative naturally.

Create a speech that celebrates motherhood, your son's journey, and the joy of this moment. Make it feel like a mother's love expressed through words.`;
}

function buildMotherOfGroomUserPrompt(details: Record<string, any>): string {
  const d = details;
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const v = d[key];
      if (typeof v === "string" && v.trim().length > 0) return v;
    }
    return "";
  };
  const lines = [
    pick("firstName") && `Mother's first name: ${pick("firstName")}`,
    pick("surname") && `Mother's surname: ${pick("surname")}`,
    pick("husbandName", "fatherName") && `Groom's father's name: ${pick("husbandName", "fatherName")}`,
    pick("fatherDeceased") && `Is groom's father deceased: ${pick("fatherDeceased")}`,
    pick("marriedUntilDemise") && `Were you married until his demise: ${pick("marriedUntilDemise")}`,
    pick("stillMarried") && `Are you still married: ${pick("stillMarried")}`,
    pick("hasPartner") && `Do you have a long term partner: ${pick("hasPartner")}`,
    pick("partnerName") && `Partner's name: ${pick("partnerName")}`,
    pick("sonName", "groomName") && `Your son's name: ${pick("sonName", "groomName")}`,
    pick("howDecidedName", "nameDecision") && `How you decided upon that name: ${pick("howDecidedName", "nameDecision")}`,
    pick("dayBorn", "birthMemory") && `What you remember about the day he was born: ${pick("dayBorn", "birthMemory")}`,
    pick("earliestMemory") && `Your earliest memory of him: ${pick("earliestMemory")}`,
    pick("characterYoung", "childCharacter") && `His character when little: ${pick("characterYoung", "childCharacter")}`,
    pick("characterNow", "characterContinued") && `Has he continued to be that character: ${pick("characterNow", "characterContinued")}`,
    pick("passionsGrowingUp", "youngPassions") && `His passions when growing up: ${pick("passionsGrowingUp", "youngPassions")}`,
    pick("passionsNow", "currentPassions") && `His passions now: ${pick("passionsNow", "currentPassions")}`,
    pick("thingsTogether") && `Things you did together: ${pick("thingsTogether")}`,
    pick("traitsFromYou", "inheritedFromYou") && `Traits he inherited from you: ${pick("traitsFromYou", "inheritedFromYou")}`,
    pick("traitsFromFather", "inheritedFromFather") && `What he inherited from his father: ${pick("traitsFromFather", "inheritedFromFather")}`,
    pick("firstTriumphs", "triumphs") && `His first big triumphs: ${pick("firstTriumphs", "triumphs")}`,
    pick("childhoodStory") && `One story from his childhood: ${pick("childhoodStory")}`,
    pick("excelledAtSchool", "schoolExcellence") && `What he excelled at at school: ${pick("excelledAtSchool", "schoolExcellence")}`,
    pick("notEnjoySchool", "schoolDisliked") && `What he didn't enjoy at school: ${pick("notEnjoySchool", "schoolDisliked")}`,
    pick("wentToUni", "university") && `Did he go to university: ${pick("wentToUni", "university")}`,
    pick("uniDetails", "universityDetails") && `Which university and course: ${pick("uniDetails", "universityDetails")}`,
    pick("career") && `What career did he embark on: ${pick("career")}`,
    pick("adultAchievements") && `His biggest achievements as an adult: ${pick("adultAchievements")}`,
    pick("brideName") && `His wife-to-be's name: ${pick("brideName")}`,
    pick("brideParents") && `Her parents' names: ${pick("brideParents")}`,
    pick("firstMeetingBride") && `Your first meeting with her: ${pick("firstMeetingBride")}`,
    pick("brideCharacter") && `What sort of character she is: ${pick("brideCharacter")}`,
    pick("howTheyMet") && `How they met: ${pick("howTheyMet")}`,
    pick("suitableCouple", "whySuitable") && `What makes them a suitable couple: ${pick("suitableCouple", "whySuitable")}`,
    d.hasChildren === "Yes" && pick("childrenNames") && `Children's names: ${pick("childrenNames")}`,
    pick("engagementFeelings") && `Feelings about the engagement: ${pick("engagementFeelings")}`,
    pick("absentFriends", "absentFriendsToast") && `Toast to absent friends: ${pick("absentFriends", "absentFriendsToast")}`,
    pick("absentFriendsDetails", "absentFriendDetails") && `About them: ${pick("absentFriendsDetails", "absentFriendDetails")}`,
  ].filter(Boolean).join("\n");

  return `Write a complete mother of the groom speech using these details:\n${lines}\n\nMake it deeply personal, warm, and celebratory. Use the son's first name and bride's first name naturally throughout (including early in the speech). Build chronologically from his birth through to today. Aim for 1350+ words.`;
}

// ============= BIRTHDAY =============
function buildBirthdayPrompt(): string {
  return `${CORE_METHODOLOGY}

Context: This is a birthday speech. It may be the speaker's own birthday speech or a speech celebrating someone else's birthday. Make it warm, fun, and personal.

CRITICAL CONSTRAINTS:
- ABSOLUTE MINIMUM 1200 words
- British spelling
- NO hyphens of any kind
- NO word "folks"
- NO word "stunning" (use "beautiful" instead)
- NO surnames
- Balance humour with genuine warmth
- If the speech is ABOUT THE SPEAKER (their own birthday): celebrate gratitude, milestones, the people around them, and hopes for the year ahead. Make it feel like a heartfelt thank-you with personality.
- If the speech is ABOUT SOMEONE ELSE: celebrate the person's character, share stories and memories, highlight what makes them special. Make the birthday person feel truly seen and appreciated.
- Use anecdotes and specific details to make it feel authentic
- Close with a warm toast or wish for the year ahead
- The tone should feel like someone speaking naturally to close friends and family`;
}

function buildBirthdayUserPrompt(details: Record<string, any>): string {
  const d = details;
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const v = d[key];
      if (typeof v === "string" && v.trim().length > 0) return v;
    }
    return "";
  };
  const lines = [
    pick("firstName") && `Speaker's name: ${pick("firstName")}`,
    pick("birthdayPersonName") && `Birthday person: ${pick("birthdayPersonName")}`,
    pick("relationship") && `Relationship: ${pick("relationship")}`,
    pick("age") && `Age turning: ${pick("age")}`,
    pick("characterDescription") && `Their character: ${pick("characterDescription")}`,
    pick("favouriteMemory") && `Favourite memory: ${pick("favouriteMemory")}`,
    pick("funnyStory") && `Funny story: ${pick("funnyStory")}`,
    pick("achievements") && `Proudest moments: ${pick("achievements")}`,
    pick("passions") && `Passions and interests: ${pick("passions")}`,
    pick("wish") && `Wish for the year ahead: ${pick("wish")}`,
    pick("tone") && `Preferred tone: ${pick("tone")}`,
  ].filter(Boolean).join("\n");

  return `Write a complete birthday speech using these details:\n${lines}\n\nMake it personal, warm, and fun. Use the birthday person's name naturally throughout (including early in the speech). Use specific anecdotes. Aim for 1200+ words.`;
}

// ============= RETIREMENT =============
function buildRetirementPrompt(): string {
  return `${CORE_METHODOLOGY}

Context: This is a retirement speech. It may be the speaker's own retirement or a tribute from a colleague. Honour the career, the relationships built, and the legacy left behind.

CRITICAL CONSTRAINTS:
- ABSOLUTE MINIMUM 1300 words
- British spelling
- NO hyphens of any kind
- NO word "folks"
- NO word "stunning"
- NO surnames
- If SELF: Reflect on the career journey with gratitude, humour, and warmth. Thank colleagues, highlight milestones, share what the job meant. Close with hopes for retirement and well wishes.
- If SOMEONE ELSE: Celebrate their achievements, character, and impact. Share stories that illustrate who they are. Express what they'll be missed for. Close with a warm send-off.
- Use specific anecdotes and details
- Balance professionalism with personal warmth
- The tone should feel genuine and conversational, not like a corporate memo`;
}

function buildRetirementUserPrompt(details: Record<string, any>): string {
  const d = details;
  const lines = [
    d.firstName && `Speaker's name: ${d.firstName}`,
    d.retireeName && `Person retiring: ${d.retireeName}`,
    d.relationship && `Relationship: ${d.relationship}`,
    d.yearsWorked && `Years worked: ${d.yearsWorked}`,
    d.role && `Their role: ${d.role}`,
    d.characterDescription && `Their character: ${d.characterDescription}`,
    d.achievements && `Biggest achievements: ${d.achievements}`,
    d.funnyStory && `Funny story: ${d.funnyStory}`,
    d.impact && `Impact on colleagues: ${d.impact}`,
    d.retirementPlans && `Retirement plans: ${d.retirementPlans}`,
    d.closingWish && `Closing wish: ${d.closingWish}`,
  ].filter(Boolean).join("\n");

  return `Write a complete retirement tribute speech using these details:\n${lines}\n\nMake it personal, warm, and authentic. Use the retiree's name naturally throughout (including early in the speech). Aim for 1300+ words.`;
}

// ============= ANNIVERSARY =============
function buildAnniversaryPrompt(): string {
  return `${CORE_METHODOLOGY}

Context: This is an anniversary speech. It may be the speaker celebrating their own marriage or honouring another couple's anniversary. Celebrate enduring love with warmth, humour, and sincerity.

CRITICAL CONSTRAINTS:
- ABSOLUTE MINIMUM 1300 words
- British spelling
- NO hyphens of any kind
- NO word "folks"
- NO word "stunning" (use "beautiful" instead)
- NO surnames
- If SELF (own anniversary): Speak directly and lovingly about the journey with your partner. Share how you met, how love grew, the milestones, the laughter, the challenges overcome. Thank those who supported the relationship. Close with a declaration of love and a toast.
- If SOMEONE ELSE: Celebrate the couple's story from the outside. Share what makes their love special, key moments you've witnessed, how they've inspired others. Close with a warm toast.
- Use specific memories and details — avoid generic sentiments
- Balance romantic sincerity with light humour
- Should feel conversational and heartfelt`;
}

function buildAnniversaryUserPrompt(details: Record<string, any>): string {
  const d = details;
  const lines = [
    d.firstName && `Speaker's name: ${d.firstName}`,
    d.coupleName && `Couple: ${d.coupleName}`,
    d.relationship && `Relationship: ${d.relationship}`,
    d.yearsMarried && `Years celebrating: ${d.yearsMarried}`,
    d.howTheyMet && `How they met: ${d.howTheyMet}`,
    d.whatMakesThemGreat && `What makes them great: ${d.whatMakesThemGreat}`,
    d.favouriteMemory && `Favourite memory: ${d.favouriteMemory}`,
    d.funnyStory && `Funny story: ${d.funnyStory}`,
    d.challenges && `Challenges overcome: ${d.challenges}`,
    d.closingWish && `Closing wish: ${d.closingWish}`,
  ].filter(Boolean).join("\n");

  return `Write a complete anniversary speech using these details:\n${lines}\n\nMake it romantic, warm, and authentic. Use the couple's names naturally throughout. Aim for 1300+ words.`;
}

// ============= EULOGY =============
function buildEulogyPrompt(): string {
  return `${CORE_METHODOLOGY}

Context: This is a eulogy — a tribute to someone who has passed away. It should honour their life with dignity, warmth, and authentic storytelling. The goal is to comfort those grieving while celebrating the life that was lived.

CRITICAL CONSTRAINTS:
- ABSOLUTE MINIMUM 1400 words
- British spelling
- NO hyphens of any kind
- NO word "folks"
- NO surnames
- Tone: Warm, dignified, and hopeful — not maudlin or excessively sorrowful
- Open with a gentle introduction that sets the tone
- Build chronologically through the person's life: early years, family, career/passions, character, relationships, legacy
- Weave in specific anecdotes and quotes/sayings they were known for
- Celebrate what made them unique — their qualities, passions, and the way they made others feel
- Acknowledge the grief in the room but focus on celebration of life
- Include moments of gentle humour where appropriate — the deceased would want people to smile
- Close with the speaker's chosen closing sentiment
- Make it feel deeply personal — this should sound like it could only be about THIS person
- Never use generic platitudes. Every line should earn its place.`;
}

function buildEulogyUserPrompt(details: Record<string, any>): string {
  const d = details;
  const lines = [
    d.firstName && `Speaker's name: ${d.firstName}`,
    d.deceasedName && `Who the eulogy is for: ${d.deceasedName}`,
    d.relationship && `Relationship: ${d.relationship}`,
    d.age && `Their age: ${d.age}`,
    d.characterDescription && `Their character: ${d.characterDescription}`,
    d.whatTheyLovedDoing && `What they loved doing: ${d.whatTheyLovedDoing}`,
    d.favouriteMemory && `Favourite memory: ${d.favouriteMemory}`,
    d.funnyStory && `Funny story: ${d.funnyStory}`,
    d.lifeAchievements && `Achievements: ${d.lifeAchievements}`,
    d.lessonsLearned && `Lessons they taught: ${d.lessonsLearned}`,
    d.whatYoullMiss && `What will be missed most: ${d.whatYoullMiss}`,
    d.favouriteSaying && `Favourite saying: ${d.favouriteSaying}`,
    d.closingMessage && `Closing message: ${d.closingMessage}`,
  ].filter(Boolean).join("\n");

  return `Write a complete eulogy using these details:\n${lines}\n\nHonour this person's life with dignity and warmth. Use their name naturally throughout (including early). Aim for 1400+ words.`;
}

// ============= GRADUATION =============
function buildGraduationPrompt(): string {
  return `${CORE_METHODOLOGY}

Context: This is a graduation speech. It may be the speaker's own graduation or a speech celebrating someone else's achievement. Celebrate growth, resilience, and the excitement of what's next.

CRITICAL CONSTRAINTS:
- ABSOLUTE MINIMUM 1200 words
- British spelling
- NO hyphens of any kind
- NO word "folks"
- NO word "stunning"
- NO surnames
- If SELF: Reflect on the journey with gratitude and humour. Thank mentors, friends, family. Share what you learned and your hopes for the future.
- If SOMEONE ELSE: Celebrate their achievement, the challenges they overcame, and the person they've become. Express pride and share your hopes for them.
- Use specific anecdotes and memories
- Balance sincerity with warmth and light humour
- Close with an inspiring or heartfelt message`;
}

function buildGraduationUserPrompt(details: Record<string, any>): string {
  const d = details;
  const lines = [
    d.firstName && `Speaker's name: ${d.firstName}`,
    d.graduateName && `Graduate: ${d.graduateName}`,
    d.relationship && `Relationship: ${d.relationship}`,
    d.institution && `Institution: ${d.institution}`,
    d.courseOrField && `Course/field: ${d.courseOrField}`,
    d.proudMoment && `Proudest moment: ${d.proudMoment}`,
    d.challenges && `Challenges overcome: ${d.challenges}`,
    d.funnyStory && `Funny story: ${d.funnyStory}`,
    d.advice && `Advice: ${d.advice}`,
    d.closingWish && `Closing wish: ${d.closingWish}`,
  ].filter(Boolean).join("\n");

  return `Write a complete graduation speech using these details:\n${lines}\n\nMake it personal, warm, and inspiring. Use names naturally throughout. Aim for 1200+ words.`;
}

// ============= BABY SHOWER =============
function buildBabyShowerPrompt(): string {
  return `${CORE_METHODOLOGY}

Context: This is a baby shower speech. Celebrate the joy of a new arrival with warmth, humour, and genuine heart.

CRITICAL CONSTRAINTS:
- ABSOLUTE MINIMUM 1000 words
- British spelling
- NO hyphens of any kind
- NO word "folks"
- NO word "stunning"
- NO surnames
- Celebrate the parents and the excitement of the new arrival
- Use specific anecdotes about the parents
- Balance humour with genuine warmth
- Close with a heartfelt wish for baby and parents`;
}

function buildBabyShowerUserPrompt(details: Record<string, any>): string {
  const d = details;
  const lines = [
    d.firstName && `Speaker's name: ${d.firstName}`,
    d.parentNames && `Expectant parent(s): ${d.parentNames}`,
    d.relationship && `Relationship: ${d.relationship}`,
    d.babyGender && `Baby gender: ${d.babyGender}`,
    d.babyName && `Baby name: ${d.babyName}`,
    d.whatKindOfParent && `What kind of parent: ${d.whatKindOfParent}`,
    d.favouriteMemory && `Favourite memory: ${d.favouriteMemory}`,
    d.funnyStory && `Funny story: ${d.funnyStory}`,
    d.advice && `Advice: ${d.advice}`,
    d.closingWish && `Closing wish: ${d.closingWish}`,
  ].filter(Boolean).join("\n");

  return `Write a complete baby shower speech using these details:\n${lines}\n\nMake it joyful, warm, and personal. Use names naturally throughout. Aim for 1000+ words.`;
}

// ============= ENGAGEMENT PARTY =============
function buildEngagementPartyPrompt(): string {
  return `${CORE_METHODOLOGY}

Context: This is an engagement party speech. Celebrate the couple's love story and the excitement of their upcoming marriage.

CRITICAL CONSTRAINTS:
- ABSOLUTE MINIMUM 1100 words
- British spelling
- NO hyphens of any kind
- NO word "folks"
- NO word "stunning" (use "beautiful" instead)
- NO surnames
- Celebrate the couple's story with warmth and humour
- Use specific anecdotes and memories
- Close with a warm toast to the couple's future`;
}

function buildEngagementPartyUserPrompt(details: Record<string, any>): string {
  const d = details;
  const lines = [
    d.firstName && `Speaker's name: ${d.firstName}`,
    d.coupleNames && `Couple: ${d.coupleNames}`,
    d.relationship && `Relationship: ${d.relationship}`,
    d.howTheyMet && `How they met: ${d.howTheyMet}`,
    d.proposalStory && `Proposal story: ${d.proposalStory}`,
    d.whatMakesThemGreat && `What makes them great: ${d.whatMakesThemGreat}`,
    d.funnyStory && `Funny story: ${d.funnyStory}`,
    d.closingWish && `Closing wish: ${d.closingWish}`,
  ].filter(Boolean).join("\n");

  return `Write a complete engagement party speech using these details:\n${lines}\n\nMake it celebratory, warm, and fun. Use names naturally throughout. Aim for 1100+ words.`;
}

// ============= CORPORATE EVENT =============
function buildCorporateEventPrompt(): string {
  return `${CORE_METHODOLOGY}

Context: This is a corporate event speech. Be confident, engaging, and appropriate for a professional audience while remaining human and personable.

CRITICAL CONSTRAINTS:
- ABSOLUTE MINIMUM 1200 words
- British spelling
- NO hyphens of any kind
- NO word "folks"
- NO word "stunning"
- NO surnames
- Open with something that grabs attention
- Deliver the main message with clarity and conviction
- Use anecdotes to bring the message to life
- Balance professionalism with genuine personality
- Close with a clear call to action or inspiring conclusion`;
}

function buildCorporateEventUserPrompt(details: Record<string, any>): string {
  const d = details;
  const lines = [
    d.firstName && `Speaker's name: ${d.firstName}`,
    d.surname && `Surname: ${d.surname}`,
    d.jobTitle && `Job title: ${d.jobTitle}`,
    d.companyName && `Company: ${d.companyName}`,
    d.eventType && `Event type: ${d.eventType}`,
    d.audienceDescription && `Audience: ${d.audienceDescription}`,
    d.mainMessage && `Main message: ${d.mainMessage}`,
    d.achievements && `Achievements to highlight: ${d.achievements}`,
    d.challenges && `Challenges overcome: ${d.challenges}`,
    d.futureVision && `Future vision: ${d.futureVision}`,
    d.thankPeople && `People to thank: ${d.thankPeople}`,
    d.anecdote && `Anecdote: ${d.anecdote}`,
    d.tonePreference && `Preferred tone: ${d.tonePreference}`,
    d.callToAction && `Call to action: ${d.callToAction}`,
  ].filter(Boolean).join("\n");

  return `Write a complete corporate event speech using these details:\n${lines}\n\nMake it polished, engaging, and authentic. Aim for 1200+ words.`;
}

// ============= AWARDS CEREMONY =============
function buildAwardsCeremonyPrompt(): string {
  return `${CORE_METHODOLOGY}

Context: This is an awards ceremony speech. It may be accepting an award or presenting one. Deliver with charisma, gratitude, and authenticity.

CRITICAL CONSTRAINTS:
- ABSOLUTE MINIMUM 1000 words
- British spelling
- NO hyphens of any kind
- NO word "folks"
- NO word "stunning"
- NO surnames
- If ACCEPTING: Express genuine gratitude, share the journey, thank the people who helped, add a moment of humour.
- If PRESENTING: Build up the recipient with warmth, share their achievements, explain why they deserve recognition, make them feel celebrated.
- Use specific anecdotes
- Close with impact`;
}

function buildAwardsCeremonyUserPrompt(details: Record<string, any>): string {
  const d = details;
  const isPresenting = d.presenting === "Yes";

  const lines = isPresenting ? [
    d.firstNamePresenter && `Speaker's name: ${d.firstNamePresenter}`,
    d.surnamePresenter && `Surname: ${d.surnamePresenter}`,
    d.awardNamePresenter && `Award name: ${d.awardNamePresenter}`,
    d.recipientName && `Recipient: ${d.recipientName}`,
    d.whyTheyDeserveIt && `Why they deserve it: ${d.whyTheyDeserveIt}`,
    d.recipientAchievements && `Achievements: ${d.recipientAchievements}`,
    d.recipientCharacter && `Character: ${d.recipientCharacter}`,
    d.anecdoteAboutRecipient && `Anecdote: ${d.anecdoteAboutRecipient}`,
    d.impactOnOthers && `Impact on others: ${d.impactOnOthers}`,
  ].filter(Boolean).join("\n") : [
    d.firstName && `Speaker's name: ${d.firstName}`,
    d.surname && `Surname: ${d.surname}`,
    d.awardName && `Award: ${d.awardName}`,
    d.whatItMeans && `What it means: ${d.whatItMeans}`,
    d.journeyToAward && `Journey: ${d.journeyToAward}`,
    d.thankPeople && `People to thank: ${d.thankPeople}`,
    d.challenges && `Challenges: ${d.challenges}`,
    d.inspiredBy && `Inspired by: ${d.inspiredBy}`,
    d.funnyMoment && `Funny moment: ${d.funnyMoment}`,
    d.futureGoals && `Future goals: ${d.futureGoals}`,
  ].filter(Boolean).join("\n");

  const type = isPresenting ? "award presentation" : "award acceptance";
  return `Write a complete ${type} speech using these details:\n${lines}\n\nMake it memorable, genuine, and impactful. Aim for 1000+ words.`;
}

// ============= FAREWELL =============
function buildFarewellPrompt(): string {
  return `${CORE_METHODOLOGY}

Context: This is a farewell speech. It may be the speaker leaving or a tribute to someone departing. Say goodbye with warmth, gratitude, and class.

CRITICAL CONSTRAINTS:
- ABSOLUTE MINIMUM 1200 words
- British spelling
- NO hyphens of any kind
- NO word "folks"
- NO word "stunning"
- NO surnames
- If SELF: Reflect on your time with gratitude and warmth. Thank colleagues, share favourite memories, express what you've learned. Close with optimism about the future.
- If SOMEONE ELSE: Celebrate their contribution, share stories, express what they meant to the team. Close with warm wishes.
- Use specific anecdotes and details
- Balance nostalgia with forward-looking optimism`;
}

function buildFarewellUserPrompt(details: Record<string, any>): string {
  const d = details;
  const isSelf = d.forSelf === "Yes";

  const lines = isSelf ? [
    d.firstName && `Speaker's name: ${d.firstName}`,
    d.surname && `Surname: ${d.surname}`,
    d.companyName && `Company: ${d.companyName}`,
    d.howLongThere && `Time there: ${d.howLongThere}`,
    d.whyLeaving && `Why leaving: ${d.whyLeaving}`,
    d.bestMemories && `Best memories: ${d.bestMemories}`,
    d.colleaguesThank && `Colleagues to thank: ${d.colleaguesThank}`,
    d.funnyMoments && `Funny stories: ${d.funnyMoments}`,
    d.whatYouLearned && `What they learned: ${d.whatYouLearned}`,
    d.willMissMost && `Will miss most: ${d.willMissMost}`,
    d.nextChapter && `Next chapter: ${d.nextChapter}`,
    d.closingMessage && `Closing message: ${d.closingMessage}`,
  ].filter(Boolean).join("\n") : [
    d.firstNameOther && `Speaker's name: ${d.firstNameOther}`,
    d.surnameOther && `Surname: ${d.surnameOther}`,
    d.leaverName && `Person leaving: ${d.leaverName}`,
    d.howLongThereOther && `Time at company: ${d.howLongThereOther}`,
    d.whatTheyDid && `Their role: ${d.whatTheyDid}`,
    d.standoutQualities && `Standout qualities: ${d.standoutQualities}`,
    d.bestMemoriesOther && `Best memories: ${d.bestMemoriesOther}`,
    d.funnyMomentsOther && `Funny stories: ${d.funnyMomentsOther}`,
    d.impactOnTeam && `Impact on team: ${d.impactOnTeam}`,
    d.whatTeamWillMiss && `What team will miss: ${d.whatTeamWillMiss}`,
    d.whereTheyreGoing && `Where they're going: ${d.whereTheyreGoing}`,
    d.partingMessage && `Parting message: ${d.partingMessage}`,
  ].filter(Boolean).join("\n");

  const type = isSelf ? "own farewell" : "farewell tribute for a colleague";
  return `Write a complete ${type} speech using these details:\n${lines}\n\nMake it warm, genuine, and memorable. Aim for 1200+ words.`;
}

// ============= GOLF CLUB / SPORTS DINNER =============
function buildGolfClubPrompt(): string {
  return `${CORE_METHODOLOGY}

Context: This is a golf club or sports dinner speech. Be witty, engaging, and entertaining. The audience wants to laugh, feel proud of the club, and enjoy a great evening.

CRITICAL CONSTRAINTS:
- ABSOLUTE MINIMUM 1200 words
- British spelling
- NO hyphens of any kind
- NO word "folks"
- NO word "stunning"
- NO surnames
- Open with something that gets the room laughing
- Weave in club highlights and achievements with humour
- Thank the right people without making it a boring list
- Include funny anecdotes from the season
- Close with a toast or rallying message for the year ahead`;
}

function buildGolfClubUserPrompt(details: Record<string, any>): string {
  const d = details;
  const lines = [
    d.firstName && `Speaker's name: ${d.firstName}`,
    d.surname && `Surname: ${d.surname}`,
    d.roleAtClub && `Role: ${d.roleAtClub}`,
    d.clubName && `Club: ${d.clubName}`,
    d.eventOccasion && `Occasion: ${d.eventOccasion}`,
    d.audienceDescription && `Audience: ${d.audienceDescription}`,
    d.seasonHighlights && `Season highlights: ${d.seasonHighlights}`,
    d.achievementsToMention && `Achievements: ${d.achievementsToMention}`,
    d.funnyStories && `Funny stories: ${d.funnyStories}`,
    d.thankPeople && `People to thank: ${d.thankPeople}`,
    d.clubHistory && `Club history: ${d.clubHistory}`,
    d.newMembers && `New/departing members: ${d.newMembers}`,
    d.lookingAhead && `Looking ahead: ${d.lookingAhead}`,
    d.closingToast && `Closing: ${d.closingToast}`,
  ].filter(Boolean).join("\n");

  return `Write a complete golf club/sports dinner speech using these details:\n${lines}\n\nMake it witty, warm, and entertaining. Aim for 1200+ words.`;
}

// ============= CHARITY GALA =============
function buildCharityGalaPrompt(): string {
  return `${CORE_METHODOLOGY}

Context: This is a charity gala speech. Inspire the room to give generously by connecting them emotionally to the cause.

CRITICAL CONSTRAINTS:
- ABSOLUTE MINIMUM 1200 words
- British spelling
- NO hyphens of any kind
- NO word "folks"
- NO word "stunning"
- NO surnames
- Open with a compelling hook
- Share a real impact story that illustrates the mission
- Explain what the charity has achieved
- Make the audience feel personally connected to the cause
- Include a clear call to action
- Close with hope and inspiration`;
}

function buildCharityGalaUserPrompt(details: Record<string, any>): string {
  const d = details;
  const lines = [
    d.firstName && `Speaker's name: ${d.firstName}`,
    d.surname && `Surname: ${d.surname}`,
    d.roleAtCharity && `Role: ${d.roleAtCharity}`,
    d.charityName && `Charity: ${d.charityName}`,
    d.missionDescription && `Mission: ${d.missionDescription}`,
    d.whyItMatters && `Why it matters personally: ${d.whyItMatters}`,
    d.impactStory && `Impact story: ${d.impactStory}`,
    d.achievements && `Recent achievements: ${d.achievements}`,
    d.audienceDescription && `Audience: ${d.audienceDescription}`,
    d.thankPeople && `People to thank: ${d.thankPeople}`,
    d.fundsNeeded && `What funds go towards: ${d.fundsNeeded}`,
    d.callToAction && `Call to action: ${d.callToAction}`,
    d.futureVision && `Future vision: ${d.futureVision}`,
    d.closingMessage && `Closing message: ${d.closingMessage}`,
  ].filter(Boolean).join("\n");

  return `Write a complete charity gala speech using these details:\n${lines}\n\nMake it inspiring, emotional, and compelling. Aim for 1200+ words.`;
}

// ============= KEYNOTE / CONFERENCE =============
function buildKeynotePrompt(): string {
  return `${CORE_METHODOLOGY}

Context: This is a keynote or conference speech. Deliver authority, insight, and impact. The audience should leave feeling informed, inspired, and energised.

CRITICAL CONSTRAINTS:
- ABSOLUTE MINIMUM 1300 words
- British spelling
- NO hyphens of any kind
- NO word "folks"
- NO word "stunning"
- NO surnames
- Open with a bold statement, question, or story that hooks the room
- Build the argument with clarity and evidence
- Use personal stories to make abstract ideas tangible
- Reference industry trends where relevant
- Close with a powerful call to action or memorable takeaway`;
}

function buildKeynoteUserPrompt(details: Record<string, any>): string {
  const d = details;
  const lines = [
    d.firstName && `Speaker's name: ${d.firstName}`,
    d.surname && `Surname: ${d.surname}`,
    d.jobTitle && `Job title: ${d.jobTitle}`,
    d.eventName && `Event: ${d.eventName}`,
    d.audienceDescription && `Audience: ${d.audienceDescription}`,
    d.mainTopic && `Main topic: ${d.mainTopic}`,
    d.keyMessage && `Key message: ${d.keyMessage}`,
    d.personalStory && `Personal story: ${d.personalStory}`,
    d.expertiseBackground && `Expertise background: ${d.expertiseBackground}`,
    d.industryTrends && `Industry trends: ${d.industryTrends}`,
    d.challengesInField && `Audience challenges: ${d.challengesInField}`,
    d.solutionsOffered && `Solutions: ${d.solutionsOffered}`,
    d.callToAction && `Call to action: ${d.callToAction}`,
    d.tonePreference && `Preferred tone: ${d.tonePreference}`,
    d.closingMessage && `Closing: ${d.closingMessage}`,
  ].filter(Boolean).join("\n");

  return `Write a complete keynote speech using these details:\n${lines}\n\nMake it authoritative, engaging, and memorable. Aim for 1300+ words.`;
}

// ============= WEDDING VOWS =============
function buildWeddingVowsPrompt(): string {
  return `${CORE_METHODOLOGY}

Context: These are personalised wedding vows. They should sound like a love letter spoken aloud to the person you love most. Intimate, authentic, and deeply personal.

CRITICAL CONSTRAINTS:
- Target 500 to 700 words (approximately 2 to 3 minutes spoken)
- British spelling
- NO hyphens of any kind
- NO clichés like "you complete me" or "my other half" or "soulmate"
- NO word "journey" (overused in vows)
- NO word "stunning"
- NO surnames
- First person throughout, spoken directly to the partner
- Open with a moment, memory, or feeling, not "I stand here today"
- Weave specific details and memories throughout
- Include at least one moment of gentle humour or levity
- Include concrete promises, not just abstract ones
- Build emotionally toward the close
- End with a powerful, intimate promise or declaration
- These are vows, not a speech. No "ladies and gentlemen" or addressing the audience
- Every line should feel like it could only be said by this person to their partner`;
}

function buildWeddingVowsUserPrompt(details: Record<string, any>): string {
  const d = details;
  const lines = [
    d.firstName && `Speaker's name: ${d.firstName}`,
    d.partnerName && `Partner's name: ${d.partnerName}`,
    d.howMet && `How they met: ${d.howMet}`,
    d.firstImpression && `First impression: ${d.firstImpression}`,
    d.whenKnew && `When they knew: ${d.whenKnew}`,
    d.whatLoveMost && `What they love most: ${d.whatLoveMost}`,
    d.howTheyMakeYouFeel && `How partner makes them feel: ${d.howTheyMakeYouFeel}`,
    d.sharedMemory && `Favourite memory: ${d.sharedMemory}`,
    d.hardTimes && `Tough times together: ${d.hardTimes}`,
    d.whatYouPromise && `What they want to promise: ${d.whatYouPromise}`,
    d.futureDreams && `Future dreams: ${d.futureDreams}`,
    d.insideJoke && `Inside jokes/quirks: ${d.insideJoke}`,
    d.theirQuirks && `Little things they adore: ${d.theirQuirks}`,
    d.tone && `Preferred tone: ${d.tone}`,
  ].filter(Boolean).join("\n");

  return `Write personalised wedding vows using these details:\n${lines}\n\nMake them intimate, specific, and deeply personal. These should sound like they could only come from this person. Aim for 500 to 700 words.`;
}
