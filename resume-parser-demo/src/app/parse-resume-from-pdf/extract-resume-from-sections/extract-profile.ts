import type { TextItem, ResumeSectionToLines, FeatureSet } from "../types";
import { getSectionLinesByKeywords } from "./lib/get-section-lines";
import { isBold, hasNumber, hasComma, hasLetter, hasLetterAndIsAllUpperCase } from "./lib/common-features";
import { getTextWithHighestFeatureScore } from "./lib/feature-scoring-system";

// Name: allow hyphens, apostrophes, and letters (including accented characters)
export const matchOnlyNameLike = (item: TextItem) =>
  item.text.match(/^[a-zA-ZÀ-ÿ\s\.\-\'\u2019]+$/);

// Email
// Simple email regex: xxx@xxx.xxx (xxx = anything not space)
export const matchEmail = (item: TextItem) => item.text.match(/\S+@\S+\.\S+/);
const hasAt = (item: TextItem) => item.text.includes("@");

// Phone: accept more formats (spaces, dashes, dots, no parentheses)
export const matchFlexiblePhone = (item: TextItem) =>
  item.text.match(/(\+\d{1,3}[\s.-]?)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/);
const hasParenthesis = (item: TextItem) => /\([0-9]+\)/.test(item.text);

// Location
// Simple location regex that matches "<City>, <ST>"
export const matchCityAndState = (item: TextItem) =>
  item.text.match(/[A-Z][a-zA-Z\s]+, [A-Z]{2}/);

// Url
// Simple url regex that matches "xxx.xxx/xxx" (xxx = anything not space)
export const matchUrl = (item: TextItem) => item.text.match(/\S+\.[a-z]+\/\S+/);
// Match https://xxx.xxx where s is optional
const matchUrlHttpFallback = (item: TextItem) =>
  item.text.match(/https?:\/\/\S+\.\S+/);
// Match www.xxx.xxx
const matchUrlWwwFallback = (item: TextItem) =>
  item.text.match(/www\.\S+\.\S+/);
const hasSlash = (item: TextItem) => item.text.includes("/");

// Summary
const has4OrMoreWords = (item: TextItem) => item.text.split(" ").length >= 4;

/**
 *              Unique Attribute
 * Name         Bold or Has all uppercase letter
 * Email        Has @
 * Phone        Has ()
 * Location     Has ,    (overlap with summary)
 * Url          Has slash
 * Summary      Has 4 or more words
 */

/**
 * Name -> contains only letters/space/period, e.g. Leonardo W. DiCaprio
 *         (it isn't common to include middle initial in resume)
 *      -> is bolded or has all letters as uppercase
 */
const NAME_FEATURE_SETS: FeatureSet[] = [
  [matchOnlyNameLike, 3, true],
  [isBold, 2],
  [hasLetterAndIsAllUpperCase, 2],
  // Match against other unique attributes
  [hasAt, -4], // Email
  [hasNumber, -4], // Phone
  [hasParenthesis, -4], // Phone
  [hasComma, -4], // Location
  [hasSlash, -4], // Url
  [has4OrMoreWords, -2], // Summary
];

// Email -> match email regex xxx@xxx.xxx
const EMAIL_FEATURE_SETS: FeatureSet[] = [
  [matchEmail, 4, true],
  [isBold, -1], // Name
  [hasLetterAndIsAllUpperCase, -1], // Name
  [hasParenthesis, -4], // Phone
  [hasComma, -4], // Location
  [hasSlash, -4], // Url
  [has4OrMoreWords, -4], // Summary
];

const PHONE_FEATURE_SETS: FeatureSet[] = [
  [matchFlexiblePhone, 4, true],
  [hasLetter, -4],
];

// Location -> match location regex <City>, <ST>
const LOCATION_FEATURE_SETS: FeatureSet[] = [
  [matchCityAndState, 4, true],
  [isBold, -1], // Name
  [hasAt, -4], // Email
  [hasParenthesis, -3], // Phone
  [hasSlash, -4], // Url
];

// URL -> match url regex xxx.xxx/xxx
const URL_FEATURE_SETS: FeatureSet[] = [
  [matchUrl, 4, true],
  [matchUrlHttpFallback, 3, true],
  [matchUrlWwwFallback, 3, true],
  [isBold, -1], // Name
  [hasAt, -4], // Email
  [hasParenthesis, -3], // Phone
  [hasComma, -4], // Location
  [has4OrMoreWords, -4], // Summary
];

// Summary -> has 4 or more words
const SUMMARY_FEATURE_SETS: FeatureSet[] = [
  [has4OrMoreWords, 4],
  [isBold, -1], // Name
  [hasAt, -4], // Email
  [hasParenthesis, -3], // Phone
  [matchCityAndState, -4, false], // Location
];

export const extractProfile = (sections: ResumeSectionToLines) => {
  // Aggregate all possible profile-related sections
  const profileSectionNames = [
    "profile", "about me", "personal information", "contact", "contacts", "bio data", "summary", "objective", "about"
  ];
  let lines: any[] = [];
  for (const key of profileSectionNames) {
    if (sections[key]) lines = lines.concat(sections[key]);
  }
  const textItems = lines.flat();

  const [name, nameScores] = getTextWithHighestFeatureScore(
    textItems,
    NAME_FEATURE_SETS,
    false // fallback: accept zero/negative if nothing else
  );
  const [email, emailScores] = getTextWithHighestFeatureScore(
    textItems,
    EMAIL_FEATURE_SETS,
    false
  );
  const [phone, phoneScores] = getTextWithHighestFeatureScore(
    textItems,
    PHONE_FEATURE_SETS,
    false
  );
  const [location, locationScores] = getTextWithHighestFeatureScore(
    textItems,
    LOCATION_FEATURE_SETS,
    false
  );
  const [url, urlScores] = getTextWithHighestFeatureScore(
    textItems,
    URL_FEATURE_SETS,
    false
  );
  const [summary, summaryScores] = getTextWithHighestFeatureScore(
    textItems,
    SUMMARY_FEATURE_SETS,
    false,
    true
  );

  // Also check for dedicated summary/objective sections
  const summaryLines = getSectionLinesByKeywords(sections, ["summary"]);
  const summarySection = summaryLines
    .flat()
    .map((textItem: TextItem) => textItem.text)
    .join(" ");
  const objectiveLines = getSectionLinesByKeywords(sections, ["objective"]);
  const objectiveSection = objectiveLines
    .flat()
    .map((textItem: TextItem) => textItem.text)
    .join(" ");

  return {
    profile: {
      name,
      email,
      phone,
      location,
      url,
      // Dedicated section takes higher precedence over profile summary
      summary: summarySection || objectiveSection || summary,
    },
    // For debugging
    profileScores: {
      name: nameScores,
      email: emailScores,
      phone: phoneScores,
      location: locationScores,
      url: urlScores,
      summary: summaryScores,
    },
  };
};
