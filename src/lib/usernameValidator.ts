/**
 * Advanced username and text moderation system to detect inappropriate words and bypass attempts.
 * Features:
 * - Predefined blacklist of inappropriate words in English/Polish/Global profanity.
 * - Leetspeak normalizer (e.g., 1=i, 3=e, 4=a, 5=s, 0=o, @=a, $=s, !=i).
 * - Spacing and special character removal (e.g. "n i g g a" or "n!gg@" or "n*gga").
 * - False positive protection (e.g. "document" containing "cum", "class" containing "ass").
 */

const BLACKLIST: string[] = [
  // English profanities & inappropriate terms
  "fuck", "fucking", "fucker", "shit", "shiting", "ass", "asshole", "bitch", "bastard", "cunt", "dick", "pussy", "cock", "dyke", "vagina", "penis", "faggot", "nigger", "retard", "slut", "whore", "dumbass", "wanker", "twat", "prick", "clit", "cum", "bollocks", "motherfucker", "milf", "porn", "xxx", "sex", "rape", "weed", "cocaine", "heroin", "meth", "hitler", "nazi",

  // Polish profanities & inappropriate terms
  "kurwa", "kurwy", "chuj", "chuja", "chujem", "pierdol", "jebac", "jebać", "pizda", "pizdem", "cwel", "suka", "fiut", "dupa", "skurwysyn", "huj", "ciul", "odbyt", "jeb", "pierd", "cipa", "kutas", "gowno", "gówno", "szmata", "dziwka",

  // Generic inappropriate/hateful/insult terms
  "pedophile", "terrorist", "suicide", "murder", "kill", "abuse", "scum", "moron", "idiot", "cretin"
];

const RESERVED: string[] = [
  "admin", 
  "moderator", 
  "support", 
  "staff", 
  "system", 
  "administrator",
  "owner"
];

/**
 * Normalizes input text: convert to lowercase, convert leetspeak, remove spaces and non-alphanumeric.
 */
export function normalizeText(text: string): string {
  if (!text) return "";
  
  // 1. Convert to lowercase
  let normalized = text.toLowerCase();

  // 2. Convert leetspeak numbers/symbols to letters
  const leetMap: { [key: string]: string } = {
    '1': 'i',
    '2': 'z',
    '3': 'e',
    '4': 'a',
    '5': 's',
    '0': 'o',
    '7': 't',
    '8': 'b',
    '@': 'a',
    '$': 's',
    '!': 'i',
  };

  let substituted = "";
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    substituted += leetMap[char] !== undefined ? leetMap[char] : char;
  }

  // 3. Remove all spaces and non-alphanumeric characters
  const cleaned = substituted.replace(/[^a-z0-9]/g, "");

  return cleaned;
}

/**
 * Checks if the normalized string represents a false positive for known short bad words.
 * This prevents blocking normal words like "class" (containing "ass") or "document" (containing "cum").
 */
function isFalsePositive(fullyNormalized: string, normBadWord: string): boolean {
  if (normBadWord === 'ass') {
    const allowedPatterns = [
      'class', 'glass', 'compass', 'mass', 'embarrass', 'asset', 'assign', 'assist', 
      'assemble', 'passion', 'passive', 'grass', 'brass', 'chassis', 'assur', 'assert', 
      'assault', 'assessment', 'associate', 'association', 'bypassed', 'embassy', 'canvass', 
      'harass', 'molass', 'sass', 'vessel', 'glasses'
    ];
    return allowedPatterns.some(pat => fullyNormalized.includes(pat));
  }
  if (normBadWord === 'cum') {
    const allowedPatterns = [
      'document', 'cucumber', 'cumulus', 'accumulat', 'circum', 'incumb'
    ];
    return allowedPatterns.some(pat => fullyNormalized.includes(pat));
  }
  if (normBadWord === 'sex') {
    const allowedPatterns = [
      'essex', 'sussex'
    ];
    return allowedPatterns.some(pat => fullyNormalized.includes(pat));
  }
  return false;
}

/**
 * Moderates freeform text. Returns true if inappropriate words or bypass patterns are discovered.
 */
export function containsBadWord(text: string): boolean {
  if (!text) return false;

  // Normalize the user's text
  const normalizedText = normalizeText(text);

  // Check against the blacklist
  for (const badWord of BLACKLIST) {
    const normalizedBadWord = normalizeText(badWord);
    if (!normalizedBadWord) continue;

    if (normalizedText.includes(normalizedBadWord)) {
      // Check if this specific match is categorized as a safe false positive
      if (isFalsePositive(normalizedText, normalizedBadWord)) {
        continue;
      }
      return true;
    }
  }

  return false;
}

/**
 * Validates a username based on custom Instagram-style criteria and advanced bad word checks.
 * @param username The username candidate to validate
 * @returns true if valid, false if invalid/blocked
 */
export function validateUsername(username: string): boolean {
  const normalized = (username || "").trim();

  // 1. Length rule (3-20 characters long)
  if (normalized.length < 3 || normalized.length > 20) {
    return false;
  }

  // 2. Character set rule (letters, numbers, underscores only)
  const regex = /^[a-zA-Z0-9_]+$/;
  if (!regex.test(normalized)) {
    return false;
  }

  const lower = normalized.toLowerCase();

  // 3. Reserved words check
  for (const res of RESERVED) {
    if (lower === res || lower.includes(res)) {
      return false;
    }
  }

  // 4. Advanced bad word check
  if (containsBadWord(normalized)) {
    return false;
  }

  return true;
}
