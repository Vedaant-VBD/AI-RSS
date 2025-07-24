const { getSectionLinesByKeywords } = require("./lib/get-section-lines");
const { DATE_FEATURE_SETS, isBold } = require("./lib/common-features");
const { divideSectionIntoSubsections } = require("./lib/subsections");
const { getTextWithHighestFeatureScore } = require("./lib/feature-scoring-system");
const { getBulletPointsFromLines, getDescriptionsLineIdx } = require("./lib/bullet-points");

// prettier-ignore
const WORK_EXPERIENCE_KEYWORDS_LOWERCASE = ['work', 'experience', 'employment', 'history', 'job'];
// prettier-ignore
const JOB_TITLES = ['Accountant', 'Administrator', 'Advisor', 'Agent', 'Analyst', 'Apprentice', 'Architect', 'Assistant', 'Associate', 'Auditor', 'Bartender', 'Biologist', 'Bookkeeper', 'Buyer', 'Carpenter', 'Cashier', 'CEO', 'Clerk', 'Co-op', 'Co-Founder', 'Consultant', 'Coordinator', 'CTO', 'Developer', 'Designer', 'Director', 'Driver', 'Editor', 'Electrician', 'Engineer', 'Extern', 'Founder', 'Freelancer', 'Head', 'Intern', 'Janitor', 'Journalist', 'Laborer', 'Lawyer', 'Lead', 'Manager', 'Mechanic', 'Member', 'Nurse', 'Officer', 'Operator', 'Operation', 'Photographer', 'President', 'Producer', 'Recruiter', 'Representative', 'Researcher', 'Sales', 'Server', 'Scientist', 'Specialist', 'Supervisor', 'Teacher', 'Technician', 'Trader', 'Trainee', 'Treasurer', 'Tutor', 'Vice', 'VP', 'Volunteer', 'Webmaster', 'Worker'];

const hasJobTitle = (item) =>
  JOB_TITLES.some((jobTitle) =>
    item.text.split(/\s/).some((word) => word === jobTitle)
  );
const hasMoreThan5Words = (item) => item.text.split(/\s/).length > 5;
const JOB_TITLE_FEATURE_SET = [
  [hasJobTitle, 4],
  [hasMoreThan5Words, -2],
];

function getHasText(text) {
  return (item) => item.text === text;
}

function extractWorkExperienceFallback(sections) {
  // Try to find work experience info anywhere in the text if not found in the standard section
  const allLines = Object.values(sections).flat(2);
  const companyRegex = /(GDSC|IIT|Lab|Club|Institute|University|Company|Project|Team|Ambassador|Developer|Engineer|Manager|Lead|Intern|Research|Game|Campus|Metaverse|Delhi|Noida|GGSIPU|GGSIPU-EDC|GGSIPUEDC)/i;
  const dateRegex = /(\d{4}|Current|Present|\d{2} [A-Za-z]{3,9} \d{4})/i;
  let found = [];
  for (const item of allLines) {
    const text = item.text || '';
    if (companyRegex.test(text)) {
      found.push({
        company: text.match(companyRegex)[0],
        jobTitle: '',
        date: dateRegex.test(text) ? text.match(dateRegex)[0] : '',
        descriptions: [text],
      });
    }
  }
  return found;
}

const COMPANY_REGEX = /(GDSC|IIT|Lab|Club|Institute|University|Company|Project|Team|Ambassador|Developer|Engineer|Manager|Lead|Intern|Research|Game|Campus|Metaverse|Delhi|Noida|GGSIPU|GGSIPU-EDC|GGSIPUEDC|School|College|Microsoft|Google|Amazon|Inc|Ltd|LLC|Chapter|Committee|Society|Council|Association|Foundation|Trust|Startup|Labs|Solutions|Systems|Technologies|Consulting|Services|Corporation|Corp|Group|Partners|Club|Chapter|Chapter-TIET|TIET|TIET-)/i;
const DATE_REGEX = /(\d{4}|Current|Present|\d{2} [A-Za-z]{3,9} \d{4}|\w+ \d{4}|\d{4} – \w+ \d{4}|\w+ \d{4} – (Present|\w+ \d{4}))/i;
const JOB_TITLE_REGEX = /(Secretary|Executive|Manager|Lead|Member|Intern|Developer|Engineer|President|Chair|Head|Director|Consultant|Coordinator|Analyst|Specialist|Assistant|Officer|Founder|Co-Founder|Mentor|Tutor|Teacher|Trainer|Researcher|Designer|Producer|Editor|Writer|Technician|Operator|Supervisor|Administrator|Advisor|Agent|Architect|Auditor|Buyer|Cashier|Clerk|Driver|Janitor|Laborer|Lawyer|Mechanic|Nurse|Photographer|Recruiter|Representative|Sales|Scientist|Server|Supervisor|Teacher|Technician|Trader|Trainee|Treasurer|Tutor|Vice|VP|Volunteer|Webmaster|Worker|Committee Member|Joint Secretary|Technical Executive|Technical Mentor|Technical Head|Technical Lead|Technical Coordinator|Technical Director|Technical Consultant|Technical Analyst|Technical Specialist|Technical Assistant|Technical Officer|Technical Founder|Technical Co-Founder|Technical Mentor|Technical Tutor|Technical Teacher|Technical Trainer|Technical Researcher|Technical Designer|Technical Producer|Technical Editor|Technical Writer|Technical Technician|Technical Operator|Technical Supervisor|Technical Administrator|Technical Advisor|Technical Agent|Technical Architect|Technical Auditor|Technical Buyer|Technical Cashier|Technical Clerk|Technical Driver|Technical Janitor|Technical Laborer|Technical Lawyer|Technical Mechanic|Technical Nurse|Technical Photographer|Technical Recruiter|Technical Representative|Technical Sales|Technical Scientist|Technical Server|Technical Supervisor|Technical Teacher|Technical Technician|Technical Trader|Technical Trainee|Technical Treasurer|Technical Tutor|Technical Vice|Technical VP|Technical Volunteer|Technical Webmaster|Technical Worker)/i;

const extractWorkExperience = (sections) => {
  const workExperiences = [];
  const lines = getSectionLinesByKeywords(sections, WORK_EXPERIENCE_KEYWORDS_LOWERCASE).flat();
  let current = null;
  let expectJobTitle = false;
  for (let i = 0; i < lines.length; i++) {
    const text = lines[i].text.trim();
    const isCompany = COMPANY_REGEX.test(text);
    const isDate = DATE_REGEX.test(text);
    const isJobTitle = JOB_TITLE_REGEX.test(text);
    if (isCompany || isDate) {
      if (current) workExperiences.push(current);
      current = { company: '', jobTitle: '', date: '', descriptions: [] };
      if (isCompany) current.company = text;
      if (isDate) current.date = text.match(DATE_REGEX)[0];
      expectJobTitle = true;
    } else if (expectJobTitle && isJobTitle) {
      current.jobTitle = text;
      expectJobTitle = false;
    } else if (current) {
      if (!current.jobTitle && isJobTitle) current.jobTitle = text;
      if (!current.date && DATE_REGEX.test(text)) current.date = text.match(DATE_REGEX)[0];
      current.descriptions.push(text);
    }
  }
  if (current) workExperiences.push(current);
  return workExperiences;
};

module.exports = { extractWorkExperience }; 