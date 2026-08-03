const people = [['Silvia Leon','Assistant Vice President','Americas'],['Cheng Saa','Vice President','Asia-Pacific'],['Michele Gomez','Officer','Asia-Pacific'],['Vera Woo','Intern','Europe'],['John Martin','Assistant Vice President','Americas'],['Anastasia Adams','Officer','Asia-Pacific'],['Priya Shah','Associate','Europe'],['Daniel Reed','Director','Americas'],['Nina Patel','Analyst','Asia-Pacific'],['Marcus King','Vice President','Europe']];
const businesses = ['Investment Banking','Markets','Corporate Banking','Wealth Management'];
const types = ['Company Research','Industry Research','Market Research','Deal Research','Adverse News','Quick Request'];
const companies = ['Arbor Holdings','Northstar Energy','Helix Capital','Meridian Foods','Silverline Group','Altair Systems','Crestview Partners'];
const descriptions = ['Please share latest industry report.','Financials and ratio analysis required.','Peer comparison and benchmarking.','Credit profile and outlook update.','Latest trend and forecast report.','Share ownership and key ratios.'];
export const researcherProfiles = [
  { name:'Alan', signoffs:['Quick Request'], qc:'Priya' },
  { name:'Aatish', signoffs:['Company Research','Market Research'], qc:'Priya' },
  { name:'Rahul', signoffs:['Company Research','Industry Research','Market Research','Deal Research'], qc:'Priya' },
  { name:'Sneha', signoffs:['Industry Research','Market Research','Adverse News'], qc:'Amit' },
  { name:'Amit', signoffs:['Company Research','Deal Research'], qc:'Priya' },
  { name:'Neha', signoffs:['Company Research','Industry Research','Market Research'], qc:'Amit' }
];
export const researchers = researcherProfiles.map(profile => profile.name);
export function createRequest(id) { const n = id % people.length; const [requester, designation, region] = people[n]; const priority = ['Critical','High','Medium','Low'][id % 4]; const offset = (id % 8) + 1; return { id, submitted:new Date(Date.UTC(2027,0,14,8 + (id % 11), (id * 7) % 60)).toISOString(), requester, designation, region, business:businesses[id % businesses.length], company:companies[id % companies.length], type:types[id % types.length], description:descriptions[id % descriptions.length], eta:90 + (id % 5) * 30, deadline:new Date(Date.UTC(2027,0,14 + offset,5 + (id % 5),30)).toISOString(), priority, researcher:'', qc:'', staffer:'', status:'New', comments:[], attachments:[], audit:[{ action:'Request submitted', at:new Date().toISOString() }], workMinutes:0, timerStartedAt:null, requiresQC:false, workflowStage:'unassigned' }; }
export const createInitialQueue = () => Array.from({length:35}, (_,i) => createRequest(262700 + i * 731));
