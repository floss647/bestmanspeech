/** Map speech type IDs to human-readable titles — shared between frontend & dashboard */
export const SPEECH_TITLES: Record<string, string> = {
  "best-man": "Best Man Speech",
  "groom": "Groom's Speech",
  "bride": "Bride's Speech",
  "father-of-bride": "Father of the Bride",
  "mother-of-bride": "Mother of the Bride",
  "brother-of-bride": "Brother of the Bride",
  "maid-of-honour": "Maid of Honour Speech",
  "father-of-groom": "Father of the Groom",
  "mother-of-groom": "Mother of the Groom",
  "birthday": "Birthday Speech",
  "anniversary": "Anniversary Speech",
  "retirement": "Retirement Speech",
  "eulogy": "Eulogy",
  "graduation": "Graduation Speech",
  "baby-shower": "Baby Shower Speech",
  "engagement-party": "Engagement Party Speech",
  "corporate-event": "Corporate Event Speech",
  "awards-ceremony": "Awards Ceremony Speech",
  "farewell": "Farewell Speech",
  "golf-club": "Golf Club / Sports Dinner",
  "charity-gala": "Charity Gala Speech",
  "keynote": "Keynote / Conference Speech",
  "wedding-vows": "Wedding Vows",
};

export const getSpeechTitle = (type: string): string =>
  SPEECH_TITLES[type] || "Speech";
