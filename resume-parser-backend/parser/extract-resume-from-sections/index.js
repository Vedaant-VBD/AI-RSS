const { extractEducation } = require('./extract-education');
const { extractWorkExperience } = require('./extract-work-experience');
const { extractProject } = require('./extract-project');
const { extractSkills } = require('./extract-skills');

/**
 * Step 4. Extract resume from sections.
 *
 * This is the core of the resume parser to resume information from the sections.
 *
 * The gist of the extraction engine is a feature scoring system. Each resume attribute
 * to be extracted has a custom feature sets, where each feature set consists of a
 * feature matching function and a feature matching score if matched (feature matching
 * score can be a positive or negative number). To compute the final feature score of
 * a text item for a particular resume attribute, it would run the text item through
 * all its feature sets and sum up the matching feature scores. This process is carried
 * out for all text items within the section, and the text item with the highest computed
 * feature score is identified as the extracted resume attribute.
 */
const extractResumeFromSections = (sections) => {
  return {
    education: extractEducation(sections),
    workExperience: extractWorkExperience(sections),
    skills: extractSkills(sections),
    projects: extractProject(sections),
  };
};

module.exports = { extractResumeFromSections }; 