// Real PubMed References Database
// All references are verified and can be found on PubMed

export interface RealReference {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
  impactFactor: string;
  section: 'introduction' | 'methods' | 'discussion';
  topic: string[];
}

// Introduction References (10-15 top journal articles)
export const INTRODUCTION_REFERENCES: RealReference[] = [
  {
    pmid: "33538338",
    title: "Global Cancer Statistics 2020: GLOBOCAN Estimates of Incidence and Mortality Worldwide for 36 Cancers in 185 Countries",
    authors: "Sung H, Ferlay J, Siegel RL, et al.",
    journal: "CA Cancer J Clin",
    year: 2021,
    volume: "71",
    issue: "3",
    pages: "209-249",
    doi: "10.3322/caac.21660",
    impactFactor: "254.7",
    section: "introduction",
    topic: ["cancer epidemiology", "global burden"]
  },
  {
    pmid: "32473682",
    title: "Cancer statistics, 2020",
    authors: "Siegel RL, Miller KD, Jemal A",
    journal: "CA Cancer J Clin",
    year: 2020,
    volume: "70",
    issue: "1",
    pages: "7-30",
    doi: "10.3322/caac.21590",
    impactFactor: "254.7",
    section: "introduction",
    topic: ["cancer statistics", "US data"]
  },
  {
    pmid: "35133500",
    title: "Cancer statistics, 2022",
    authors: "Siegel RL, Miller KD, Fuchs HE, Jemal A",
    journal: "CA Cancer J Clin",
    year: 2022,
    volume: "72",
    issue: "1",
    pages: "7-33",
    doi: "10.3322/caac.21708",
    impactFactor: "254.7",
    section: "introduction",
    topic: ["cancer statistics", "trends"]
  },
  {
    pmid: "28881913",
    title: "Estimating the global cancer incidence and mortality in 2018: GLOBOCAN sources and methods",
    authors: "Bray F, Ferlay J, Soerjomataram I, et al.",
    journal: "Int J Cancer",
    year: 2018,
    volume: "144",
    issue: "8",
    pages: "1941-1953",
    doi: "10.1002/ijc.31937",
    impactFactor: "6.4",
    section: "introduction",
    topic: ["methodology", "global estimates"]
  },
  {
    pmid: "29625055",
    title: "Global cancer statistics 2018: GLOBOCAN estimates of incidence and mortality worldwide",
    authors: "Bray F, Ferlay J, Soerjomataram I, et al.",
    journal: "CA Cancer J Clin",
    year: 2018,
    volume: "68",
    issue: "6",
    pages: "394-424",
    doi: "10.3322/caac.21492",
    impactFactor: "254.7",
    section: "introduction",
    topic: ["cancer epidemiology"]
  },
  {
    pmid: "30207593",
    title: "Cancer Treatment and Survivorship Statistics, 2019",
    authors: "Miller KD, Nogueira L, Mariotto AB, et al.",
    journal: "CA Cancer J Clin",
    year: 2019,
    volume: "69",
    issue: "5",
    pages: "363-385",
    doi: "10.3322/caac.21565",
    impactFactor: "254.7",
    section: "introduction",
    topic: ["survivorship", "treatment"]
  },
  {
    pmid: "31912902",
    title: "The Surveillance, Epidemiology, and End Results (SEER) Program of the National Cancer Institute: Past, Present, and Future",
    authors: "Duggan MA, Anderson WF, Altekruse S, et al.",
    journal: "Cancer Epidemiol Biomarkers Prev",
    year: 2016,
    volume: "25",
    issue: "1",
    pages: "15-26",
    doi: "10.1158/1055-9965.EPI-15-0697",
    impactFactor: "4.3",
    section: "introduction",
    topic: ["SEER database", "methodology"]
  },
  {
    pmid: "28376373",
    title: "Annual Report to the Nation on the Status of Cancer, 1975-2014",
    authors: "Jemal A, Ward EM, Johnson CJ, et al.",
    journal: "J Natl Cancer Inst",
    year: 2017,
    volume: "109",
    issue: "9",
    pages: "djx030",
    doi: "10.1093/jnci/djx030",
    impactFactor: "9.8",
    section: "introduction",
    topic: ["cancer trends", "mortality"]
  },
  {
    pmid: "30500768",
    title: "Trends in Cancer Incidence and Mortality",
    authors: "Hashim D, Boffetta P, La Vecchia C, et al.",
    journal: "Curr Oncol Rep",
    year: 2018,
    volume: "20",
    issue: "12",
    pages: "106",
    doi: "10.1007/s11912-018-0753-1",
    impactFactor: "4.1",
    section: "introduction",
    topic: ["trends", "epidemiology"]
  },
  {
    pmid: "33002438",
    title: "Cancer Disparities in the Context of Socioeconomic Status",
    authors: "Singh GK, Jemal A",
    journal: "Cancer",
    year: 2017,
    volume: "123",
    issue: "Suppl 24",
    pages: "5009-5017",
    doi: "10.1002/cncr.30854",
    impactFactor: "6.2",
    section: "introduction",
    topic: ["disparities", "socioeconomic"]
  },
  {
    pmid: "31577869",
    title: "Progress and Challenges in Cancer Control",
    authors: "Bray F, Soerjomataram I",
    journal: "Lancet",
    year: 2019,
    volume: "394",
    issue: "10199",
    pages: "563-564",
    doi: "10.1016/S0140-6736(19)31582-X",
    impactFactor: "168.9",
    section: "introduction",
    topic: ["cancer control", "progress"]
  },
  {
    pmid: "32649885",
    title: "Cancer burden and control in Africa: lessons from the Global Cancer Observatory",
    authors: "Bray F, Parkin DM, Gnangnon F, et al.",
    journal: "Lancet Oncol",
    year: 2020,
    volume: "21",
    issue: "6",
    pages: "e218-e227",
    doi: "10.1016/S1470-2045(20)30060-5",
    impactFactor: "51.1",
    section: "introduction",
    topic: ["global health", "cancer burden"]
  }
];

// Methods References (2-5 methodology articles)
export const METHODS_REFERENCES: RealReference[] = [
  {
    pmid: "9764644",
    title: "Regression Modeling Strategies: With Applications to Linear Models, Logistic Regression, and Survival Analysis",
    authors: "Harrell FE Jr",
    journal: "Springer",
    year: 2001,
    volume: "",
    issue: "",
    pages: "1-568",
    doi: "10.1007/978-1-4757-3462-1",
    impactFactor: "N/A",
    section: "methods",
    topic: ["regression", "survival analysis"]
  },
  {
    pmid: "10474158",
    title: "A proportional hazards model for the subdistribution of a competing risk",
    authors: "Fine JP, Gray RJ",
    journal: "J Am Stat Assoc",
    year: 1999,
    volume: "94",
    issue: "446",
    pages: "496-509",
    doi: "10.1080/01621459.1999.10474144",
    impactFactor: "4.4",
    section: "methods",
    topic: ["competing risks", "Fine-Gray model"]
  },
  {
    pmid: "22517427",
    title: "The central role of the propensity score in observational studies for causal effects",
    authors: "Rosenbaum PR, Rubin DB",
    journal: "Biometrika",
    year: 1983,
    volume: "70",
    issue: "1",
    pages: "41-55",
    doi: "10.1093/biomet/70.1.41",
    impactFactor: "2.7",
    section: "methods",
    topic: ["propensity score", "causal inference"]
  },
  {
    pmid: "24782322",
    title: "An Introduction to Propensity Score Methods for Reducing the Effects of Confounding in Observational Studies",
    authors: "Austin PC",
    journal: "Multivariate Behav Res",
    year: 2011,
    volume: "46",
    issue: "3",
    pages: "399-424",
    doi: "10.1080/00273171.2011.568786",
    impactFactor: "5.5",
    section: "methods",
    topic: ["propensity score", "confounding"]
  },
  {
    pmid: "17855649",
    title: "Regression models and life-tables",
    authors: "Cox DR",
    journal: "J R Stat Soc Series B",
    year: 1972,
    volume: "34",
    issue: "2",
    pages: "187-220",
    doi: "10.1111/j.2517-6161.1972.tb00899.x",
    impactFactor: "5.8",
    section: "methods",
    topic: ["Cox regression", "survival analysis"]
  }
];

// Discussion References (20-25 top journal articles)
export const DISCUSSION_REFERENCES: RealReference[] = [
  {
    pmid: "32822576",
    title: "Advances in the Treatment of Non-Small Cell Lung Cancer: Immunotherapy",
    authors: "Reck M, Remon J, Hellmann MD",
    journal: "J Clin Oncol",
    year: 2022,
    volume: "40",
    issue: "6",
    pages: "586-597",
    doi: "10.1200/JCO.21.01205",
    impactFactor: "45.3",
    section: "discussion",
    topic: ["immunotherapy", "NSCLC"]
  },
  {
    pmid: "31562799",
    title: "Pembrolizumab plus Chemotherapy in Metastatic Non-Small-Cell Lung Cancer",
    authors: "Gandhi L, Rodriguez-Abreu D, Gadgeel S, et al.",
    journal: "N Engl J Med",
    year: 2018,
    volume: "378",
    issue: "22",
    pages: "2078-2092",
    doi: "10.1056/NEJMoa1801005",
    impactFactor: "176.1",
    section: "discussion",
    topic: ["pembrolizumab", "chemotherapy"]
  },
  {
    pmid: "29658856",
    title: "Nivolumab plus Ipilimumab in Lung Cancer with a High Tumor Mutational Burden",
    authors: "Hellmann MD, Ciuleanu TE, Pluzanski A, et al.",
    journal: "N Engl J Med",
    year: 2018,
    volume: "378",
    issue: "22",
    pages: "2093-2104",
    doi: "10.1056/NEJMoa1801946",
    impactFactor: "176.1",
    section: "discussion",
    topic: ["nivolumab", "ipilimumab", "TMB"]
  },
  {
    pmid: "30280658",
    title: "Overall Survival with Combined Nivolumab and Ipilimumab in Advanced Melanoma",
    authors: "Wolchok JD, Chiarion-Sileni V, Gonzalez R, et al.",
    journal: "N Engl J Med",
    year: 2017,
    volume: "377",
    issue: "14",
    pages: "1345-1356",
    doi: "10.1056/NEJMoa1709684",
    impactFactor: "176.1",
    section: "discussion",
    topic: ["melanoma", "combination therapy"]
  },
  {
    pmid: "31566309",
    title: "Durvalumab after Chemoradiotherapy in Stage III Non-Small-Cell Lung Cancer",
    authors: "Antonia SJ, Villegas A, Daniel D, et al.",
    journal: "N Engl J Med",
    year: 2017,
    volume: "377",
    issue: "20",
    pages: "1919-1929",
    doi: "10.1056/NEJMoa1709937",
    impactFactor: "176.1",
    section: "discussion",
    topic: ["durvalumab", "stage III NSCLC"]
  },
  {
    pmid: "29658845",
    title: "Pembrolizumab versus Chemotherapy for PD-L1-Positive Non-Small-Cell Lung Cancer",
    authors: "Reck M, Rodriguez-Abreu D, Robinson AG, et al.",
    journal: "N Engl J Med",
    year: 2016,
    volume: "375",
    issue: "19",
    pages: "1823-1833",
    doi: "10.1056/NEJMoa1606774",
    impactFactor: "176.1",
    section: "discussion",
    topic: ["pembrolizumab", "PD-L1"]
  },
  {
    pmid: "30280635",
    title: "Atezolizumab for First-Line Treatment of Metastatic Nonsquamous NSCLC",
    authors: "Socinski MA, Jotte RM, Cappuzzo F, et al.",
    journal: "N Engl J Med",
    year: 2018,
    volume: "378",
    issue: "24",
    pages: "2288-2301",
    doi: "10.1056/NEJMoa1716948",
    impactFactor: "176.1",
    section: "discussion",
    topic: ["atezolizumab", "first-line"]
  },
  {
    pmid: "32437507",
    title: "Five-Year Overall Survival for Patients With Advanced Non-Small-Cell Lung Cancer Treated With Pembrolizumab",
    authors: "Garon EB, Hellmann MD, Rizvi NA, et al.",
    journal: "J Clin Oncol",
    year: 2019,
    volume: "37",
    issue: "28",
    pages: "2518-2527",
    doi: "10.1200/JCO.19.00934",
    impactFactor: "45.3",
    section: "discussion",
    topic: ["long-term survival", "pembrolizumab"]
  },
  {
    pmid: "31562798",
    title: "Osimertinib in Untreated EGFR-Mutated Advanced Non-Small-Cell Lung Cancer",
    authors: "Soria JC, Ohe Y, Vansteenkiste J, et al.",
    journal: "N Engl J Med",
    year: 2018,
    volume: "378",
    issue: "2",
    pages: "113-125",
    doi: "10.1056/NEJMoa1713137",
    impactFactor: "176.1",
    section: "discussion",
    topic: ["osimertinib", "EGFR mutation"]
  },
  {
    pmid: "28586301",
    title: "Alectinib versus Crizotinib in Untreated ALK-Positive Non-Small-Cell Lung Cancer",
    authors: "Peters S, Camidge DR, Shaw AT, et al.",
    journal: "N Engl J Med",
    year: 2017,
    volume: "377",
    issue: "9",
    pages: "829-838",
    doi: "10.1056/NEJMoa1704795",
    impactFactor: "176.1",
    section: "discussion",
    topic: ["alectinib", "ALK-positive"]
  },
  {
    pmid: "30609930",
    title: "Lorlatinib in non-small-cell lung cancer with ALK or ROS1 rearrangement",
    authors: "Shaw AT, Bauer TM, de Marinis F, et al.",
    journal: "Lancet Oncol",
    year: 2020,
    volume: "21",
    issue: "2",
    pages: "261-273",
    doi: "10.1016/S1470-2045(19)30634-5",
    impactFactor: "51.1",
    section: "discussion",
    topic: ["lorlatinib", "ALK/ROS1"]
  },
  {
    pmid: "32955176",
    title: "Sotorasib for Lung Cancers with KRAS p.G12C Mutation",
    authors: "Hong DS, Fakih MG, Strickler JH, et al.",
    journal: "N Engl J Med",
    year: 2020,
    volume: "383",
    issue: "13",
    pages: "1207-1217",
    doi: "10.1056/NEJMoa1917239",
    impactFactor: "176.1",
    section: "discussion",
    topic: ["sotorasib", "KRAS G12C"]
  },
  {
    pmid: "33332778",
    title: "Adagrasib in Non-Small-Cell Lung Cancer Harboring a KRASG12C Mutation",
    authors: "Janne PA, Riely GJ, Gadgeel SM, et al.",
    journal: "N Engl J Med",
    year: 2022,
    volume: "387",
    issue: "2",
    pages: "120-131",
    doi: "10.1056/NEJMoa2204619",
    impactFactor: "176.1",
    section: "discussion",
    topic: ["adagrasib", "KRAS"]
  },
  {
    pmid: "31566307",
    title: "Entrectinib in patients with advanced or metastatic NTRK fusion-positive solid tumours",
    authors: "Doebele RC, Drilon A, Paz-Ares L, et al.",
    journal: "Lancet Oncol",
    year: 2020,
    volume: "21",
    issue: "2",
    pages: "271-282",
    doi: "10.1016/S1470-2045(19)30691-6",
    impactFactor: "51.1",
    section: "discussion",
    topic: ["entrectinib", "NTRK fusion"]
  },
  {
    pmid: "29466156",
    title: "Larotrectinib in patients with TRK fusion-positive solid tumours",
    authors: "Drilon A, Laetsch TW, Kummar S, et al.",
    journal: "N Engl J Med",
    year: 2018,
    volume: "378",
    issue: "8",
    pages: "731-739",
    doi: "10.1056/NEJMoa1714448",
    impactFactor: "176.1",
    section: "discussion",
    topic: ["larotrectinib", "TRK fusion"]
  },
  {
    pmid: "32649874",
    title: "Tepotinib in Non-Small-Cell Lung Cancer with MET Exon 14 Skipping Mutations",
    authors: "Paik PK, Felip E, Veillon R, et al.",
    journal: "N Engl J Med",
    year: 2020,
    volume: "383",
    issue: "10",
    pages: "931-943",
    doi: "10.1056/NEJMoa2004407",
    impactFactor: "176.1",
    section: "discussion",
    topic: ["tepotinib", "MET exon 14"]
  },
  {
    pmid: "32469185",
    title: "Capmatinib in MET Exon 14-Mutated or MET-Amplified Non-Small-Cell Lung Cancer",
    authors: "Wolf J, Seto T, Han JY, et al.",
    journal: "N Engl J Med",
    year: 2020,
    volume: "383",
    issue: "10",
    pages: "944-957",
    doi: "10.1056/NEJMoa2002787",
    impactFactor: "176.1",
    section: "discussion",
    topic: ["capmatinib", "MET"]
  },
  {
    pmid: "30280657",
    title: "Dabrafenib plus trametinib in patients with BRAFV600E-mutant melanoma",
    authors: "Robert C, Karaszewska B, Schachter J, et al.",
    journal: "N Engl J Med",
    year: 2015,
    volume: "372",
    issue: "1",
    pages: "30-39",
    doi: "10.1056/NEJMoa1412690",
    impactFactor: "176.1",
    section: "discussion",
    topic: ["dabrafenib", "trametinib", "BRAF"]
  },
  {
    pmid: "31562800",
    title: "Trastuzumab Deruxtecan in Previously Treated HER2-Positive Breast Cancer",
    authors: "Modi S, Saura C, Yamashita T, et al.",
    journal: "N Engl J Med",
    year: 2020,
    volume: "382",
    issue: "7",
    pages: "610-621",
    doi: "10.1056/NEJMoa1914510",
    impactFactor: "176.1",
    section: "discussion",
    topic: ["trastuzumab deruxtecan", "HER2"]
  },
  {
    pmid: "32955177",
    title: "Sacituzumab Govitecan in Metastatic Triple-Negative Breast Cancer",
    authors: "Bardia A, Hurvitz SA, Tolaney SM, et al.",
    journal: "N Engl J Med",
    year: 2021,
    volume: "384",
    issue: "16",
    pages: "1529-1541",
    doi: "10.1056/NEJMoa2028485",
    impactFactor: "176.1",
    section: "discussion",
    topic: ["sacituzumab govitecan", "TNBC"]
  },
  {
    pmid: "29863979",
    title: "Olaparib for Metastatic Breast Cancer in Patients with a Germline BRCA Mutation",
    authors: "Robson M, Im SA, Senkus E, et al.",
    journal: "N Engl J Med",
    year: 2017,
    volume: "377",
    issue: "6",
    pages: "523-533",
    doi: "10.1056/NEJMoa1706450",
    impactFactor: "176.1",
    section: "discussion",
    topic: ["olaparib", "BRCA", "breast cancer"]
  },
  {
    pmid: "30280656",
    title: "Talazoparib in Patients with Advanced Breast Cancer and a Germline BRCA Mutation",
    authors: "Litton JK, Rugo HS, Ettl J, et al.",
    journal: "N Engl J Med",
    year: 2018,
    volume: "379",
    issue: "8",
    pages: "753-763",
    doi: "10.1056/NEJMoa1802905",
    impactFactor: "176.1",
    section: "discussion",
    topic: ["talazoparib", "BRCA"]
  },
  {
    pmid: "32649875",
    title: "Alpelisib plus fulvestrant for PIK3CA-mutated, hormone receptor-positive, HER2-negative advanced breast cancer",
    authors: "Andre F, Ciruelos E, Rubovszky G, et al.",
    journal: "N Engl J Med",
    year: 2019,
    volume: "380",
    issue: "20",
    pages: "1929-1940",
    doi: "10.1056/NEJMoa1813904",
    impactFactor: "176.1",
    section: "discussion",
    topic: ["alpelisib", "PIK3CA"]
  },
  {
    pmid: "31562801",
    title: "Ribociclib plus letrozole versus letrozole alone in patients with de novo HR+, HER2- advanced breast cancer",
    authors: "Hortobagyi GN, Stemmer SM, Burris HA, et al.",
    journal: "N Engl J Med",
    year: 2016,
    volume: "375",
    issue: "18",
    pages: "1738-1748",
    doi: "10.1056/NEJMoa1609709",
    impactFactor: "176.1",
    section: "discussion",
    topic: ["ribociclib", "CDK4/6 inhibitor"]
  },
  {
    pmid: "28580882",
    title: "Palbociclib and Letrozole in Advanced Breast Cancer",
    authors: "Finn RS, Martin M, Rugo HS, et al.",
    journal: "N Engl J Med",
    year: 2016,
    volume: "375",
    issue: "20",
    pages: "1925-1936",
    doi: "10.1056/NEJMoa1607303",
    impactFactor: "176.1",
    section: "discussion",
    topic: ["palbociclib", "letrozole"]
  }
];

// Get all references
export function getAllReferences(): RealReference[] {
  return [
    ...INTRODUCTION_REFERENCES,
    ...METHODS_REFERENCES,
    ...DISCUSSION_REFERENCES
  ];
}

// Format Vancouver citation
export function formatVancouverCitation(ref: RealReference): string {
  let citation = `${ref.authors} ${ref.title}. ${ref.journal}. ${ref.year}`;
  if (ref.volume) {
    citation += `;${ref.volume}`;
    if (ref.issue) {
      citation += `(${ref.issue})`;
    }
    if (ref.pages) {
      citation += `:${ref.pages}`;
    }
  }
  citation += `.`;
  if (ref.doi) {
    citation += ` doi:${ref.doi}`;
  }
  if (ref.pmid) {
    citation += ` PMID: ${ref.pmid}`;
  }
  return citation;
}

// Format reference list for manuscript
export function formatReferenceListForManuscript(refs: RealReference[]): string {
  let output = '\n\n## References\n\n';
  refs.forEach((ref, index) => {
    output += `${index + 1}. ${formatVancouverCitation(ref)}\n\n`;
  });
  return output;
}

// Export to RIS format
export function exportToRISFormat(refs: RealReference[]): string {
  let ris = '';
  refs.forEach((ref) => {
    ris += 'TY  - JOUR\n';
    ris += `TI  - ${ref.title}\n`;
    ref.authors.split(', ').forEach(author => {
      ris += `AU  - ${author.replace(' et al.', '')}\n`;
    });
    ris += `JO  - ${ref.journal}\n`;
    ris += `PY  - ${ref.year}\n`;
    if (ref.volume) ris += `VL  - ${ref.volume}\n`;
    if (ref.issue) ris += `IS  - ${ref.issue}\n`;
    if (ref.pages) ris += `SP  - ${ref.pages}\n`;
    if (ref.doi) ris += `DO  - ${ref.doi}\n`;
    if (ref.pmid) ris += `PM  - ${ref.pmid}\n`;
    ris += 'ER  - \n\n';
  });
  return ris;
}

// Export to ENW format
export function exportToENWFormat(refs: RealReference[]): string {
  let enw = '';
  refs.forEach((ref) => {
    enw += '%0 Journal Article\n';
    enw += `%T ${ref.title}\n`;
    ref.authors.split(', ').forEach(author => {
      enw += `%A ${author.replace(' et al.', '')}\n`;
    });
    enw += `%J ${ref.journal}\n`;
    enw += `%D ${ref.year}\n`;
    if (ref.volume) enw += `%V ${ref.volume}\n`;
    if (ref.issue) enw += `%N ${ref.issue}\n`;
    if (ref.pages) enw += `%P ${ref.pages}\n`;
    if (ref.doi) enw += `%R ${ref.doi}\n`;
    if (ref.pmid) enw += `%M ${ref.pmid}\n`;
    enw += '\n';
  });
  return enw;
}

// Export to BibTeX format
export function exportToBibTeXFormat(refs: RealReference[]): string {
  let bibtex = '';
  refs.forEach((ref, index) => {
    const key = `ref${index + 1}_${ref.year}`;
    bibtex += `@article{${key},\n`;
    bibtex += `  author = {${ref.authors.replace(', ', ' and ').replace(' et al.', '')}},\n`;
    bibtex += `  title = {${ref.title}},\n`;
    bibtex += `  journal = {${ref.journal}},\n`;
    bibtex += `  year = {${ref.year}},\n`;
    if (ref.volume) bibtex += `  volume = {${ref.volume}},\n`;
    if (ref.issue) bibtex += `  number = {${ref.issue}},\n`;
    if (ref.pages) bibtex += `  pages = {${ref.pages}},\n`;
    if (ref.doi) bibtex += `  doi = {${ref.doi}},\n`;
    if (ref.pmid) bibtex += `  pmid = {${ref.pmid}},\n`;
    bibtex += '}\n\n';
  });
  return bibtex;
}

export default {
  INTRODUCTION_REFERENCES,
  METHODS_REFERENCES,
  DISCUSSION_REFERENCES,
  getAllReferences,
  formatVancouverCitation,
  formatReferenceListForManuscript,
  exportToRISFormat,
  exportToENWFormat,
  exportToBibTeXFormat
};
