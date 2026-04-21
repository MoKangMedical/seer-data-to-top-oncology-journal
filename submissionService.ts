// Submission Service - Journal recommendations, Cover Letter generation, and file packaging
// Provides complete submission package for oncology top journals

import { invokeLLM } from "./_core/llm";

// Top 10 Oncology Journals for SEER-based research
export const TOP_ONCOLOGY_JOURNALS = [
  {
    rank: 1,
    name: "CA: A Cancer Journal for Clinicians",
    abbreviation: "CA Cancer J Clin",
    impactFactor: "254.7",
    publisher: "Wiley/American Cancer Society",
    submissionUrl: "https://mc.manuscriptcentral.com/cacancerjournal",
    scope: "Comprehensive cancer reviews, statistics, and guidelines",
    acceptanceRate: "~5%",
    turnaround: "4-6 weeks",
  },
  {
    rank: 2,
    name: "The Lancet Oncology",
    abbreviation: "Lancet Oncol",
    impactFactor: "51.1",
    publisher: "Elsevier",
    submissionUrl: "https://www.editorialmanager.com/thelancetoncology/",
    scope: "Clinical oncology, cancer epidemiology, health policy",
    acceptanceRate: "~8%",
    turnaround: "2-4 weeks",
  },
  {
    rank: 3,
    name: "Journal of Clinical Oncology",
    abbreviation: "J Clin Oncol",
    impactFactor: "45.3",
    publisher: "ASCO/Wolters Kluwer",
    submissionUrl: "https://submit-jco.asco.org/",
    scope: "Clinical trials, translational research, cancer care",
    acceptanceRate: "~15%",
    turnaround: "4-6 weeks",
  },
  {
    rank: 4,
    name: "Annals of Oncology",
    abbreviation: "Ann Oncol",
    impactFactor: "32.0",
    publisher: "Oxford/ESMO",
    submissionUrl: "https://mc.manuscriptcentral.com/annonc",
    scope: "Medical oncology, clinical research, ESMO guidelines",
    acceptanceRate: "~12%",
    turnaround: "3-5 weeks",
  },
  {
    rank: 5,
    name: "JAMA Oncology",
    abbreviation: "JAMA Oncol",
    impactFactor: "28.4",
    publisher: "AMA",
    submissionUrl: "https://mc.manuscriptcentral.com/jamaoncology",
    scope: "Clinical oncology, epidemiology, health services",
    acceptanceRate: "~10%",
    turnaround: "3-4 weeks",
  },
  {
    rank: 6,
    name: "Clinical Cancer Research",
    abbreviation: "Clin Cancer Res",
    impactFactor: "11.5",
    publisher: "AACR",
    submissionUrl: "https://submit.aacrjournals.org/submission/",
    scope: "Translational research, biomarkers, clinical trials",
    acceptanceRate: "~18%",
    turnaround: "4-6 weeks",
  },
  {
    rank: 7,
    name: "Cancer Research",
    abbreviation: "Cancer Res",
    impactFactor: "11.2",
    publisher: "AACR",
    submissionUrl: "https://submit.aacrjournals.org/submission/",
    scope: "Basic and translational cancer research",
    acceptanceRate: "~15%",
    turnaround: "4-8 weeks",
  },
  {
    rank: 8,
    name: "European Journal of Cancer",
    abbreviation: "Eur J Cancer",
    impactFactor: "8.4",
    publisher: "Elsevier",
    submissionUrl: "https://www.editorialmanager.com/ejca/",
    scope: "Clinical oncology, cancer epidemiology",
    acceptanceRate: "~20%",
    turnaround: "4-6 weeks",
  },
  {
    rank: 9,
    name: "British Journal of Cancer",
    abbreviation: "Br J Cancer",
    impactFactor: "7.6",
    publisher: "Nature/Cancer Research UK",
    submissionUrl: "https://mts-bjc.nature.com/cgi-bin/main.plex",
    scope: "Cancer research, epidemiology, clinical studies",
    acceptanceRate: "~25%",
    turnaround: "3-5 weeks",
  },
  {
    rank: 10,
    name: "International Journal of Cancer",
    abbreviation: "Int J Cancer",
    impactFactor: "6.4",
    publisher: "Wiley/UICC",
    submissionUrl: "https://mc.manuscriptcentral.com/ijc",
    scope: "Cancer epidemiology, etiology, prevention",
    acceptanceRate: "~30%",
    turnaround: "4-6 weeks",
  },
];

// Cover Letter template generator
export interface CoverLetterParams {
  journalName: string;
  journalAbbreviation: string;
  editorName?: string;
  manuscriptTitle: string;
  manuscriptType: string;
  authors: string[];
  correspondingAuthor: {
    name: string;
    email: string;
    institution: string;
  };
  studyHighlights: string[];
  wordCount: number;
  tableCount: number;
  figureCount: number;
  referenceCount: number;
}

// Journal-specific editor information and requirements
const JOURNAL_EDITORS: Record<string, { editor: string; title: string; requirements: string[] }> = {
  "CA: A Cancer Journal for Clinicians": {
    editor: "Dr. Ahmedin Jemal",
    title: "Editor-in-Chief",
    requirements: [
      "Emphasize the public health significance and broad readership appeal",
      "Highlight the use of authoritative cancer statistics",
      "Mention relevance to cancer prevention and control"
    ]
  },
  "The Lancet Oncology": {
    editor: "Dr. David Collingridge",
    title: "Editor-in-Chief",
    requirements: [
      "Emphasize clinical relevance and practice-changing potential",
      "Highlight the global health implications",
      "Mention the large sample size and robust methodology"
    ]
  },
  "Journal of Clinical Oncology": {
    editor: "Dr. Daniel F. Hayes",
    title: "Editor-in-Chief",
    requirements: [
      "Emphasize clinical applicability and patient outcomes",
      "Highlight the translational aspects of the research",
      "Mention ASCO guideline relevance if applicable"
    ]
  },
  "Annals of Oncology": {
    editor: "Dr. Fabrice André",
    title: "Editor-in-Chief",
    requirements: [
      "Emphasize European and global relevance",
      "Highlight ESMO guideline implications",
      "Mention the methodological rigor"
    ]
  },
  "JAMA Oncology": {
    editor: "Dr. Mary L. Disis",
    title: "Editor",
    requirements: [
      "Emphasize the population-based approach",
      "Highlight health services and policy implications",
      "Mention the SEER database's representativeness"
    ]
  },
  "Clinical Cancer Research": {
    editor: "Dr. Michael B. Atkins",
    title: "Editor-in-Chief",
    requirements: [
      "Emphasize translational significance",
      "Highlight biomarker or therapeutic implications",
      "Mention potential for clinical trial development"
    ]
  },
  "Cancer Research": {
    editor: "Dr. Chi Van Dang",
    title: "Editor-in-Chief",
    requirements: [
      "Emphasize mechanistic insights",
      "Highlight novel findings and scientific impact",
      "Mention implications for cancer biology"
    ]
  },
  "European Journal of Cancer": {
    editor: "Dr. Alexander M.M. Eggermont",
    title: "Editor-in-Chief",
    requirements: [
      "Emphasize European clinical relevance",
      "Highlight epidemiological significance",
      "Mention implications for cancer care in Europe"
    ]
  },
  "British Journal of Cancer": {
    editor: "Dr. Nicola Valeri",
    title: "Editor-in-Chief",
    requirements: [
      "Emphasize clinical and translational relevance",
      "Highlight the robust study design",
      "Mention implications for UK and global cancer care"
    ]
  },
  "International Journal of Cancer": {
    editor: "Dr. Rengaswamy Sankaranarayanan",
    title: "Editor-in-Chief",
    requirements: [
      "Emphasize epidemiological significance",
      "Highlight cancer prevention implications",
      "Mention global cancer burden relevance"
    ]
  }
};

// Generate Cover Letter for a specific journal
export function generateCoverLetterTemplate(params: CoverLetterParams): string {
  const journalInfo = JOURNAL_EDITORS[params.journalName] || {
    editor: "The Editor",
    title: "Editor-in-Chief",
    requirements: ["Emphasize the significance of the findings"]
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const highlights = params.studyHighlights.map((h, i) => `${i + 1}. ${h}`).join('\n');

  return `${dateStr}

${journalInfo.editor}, ${journalInfo.title}
${params.journalName}

Dear ${journalInfo.editor},

We are pleased to submit our manuscript entitled "${params.manuscriptTitle}" for consideration for publication in ${params.journalName} as an Original Article.

This retrospective cohort study utilizes data from the Surveillance, Epidemiology, and End Results (SEER) database, which covers approximately 48% of the United States population. Our study addresses an important clinical question with significant implications for cancer care and patient outcomes.

Key findings of our study include:
${highlights}

We believe this manuscript is particularly well-suited for ${params.journalName} because:
${journalInfo.requirements.map((r, i) => `- ${r}`).join('\n')}

The manuscript contains ${params.wordCount.toLocaleString()} words in the main text, ${params.tableCount} tables, ${params.figureCount} figures, and ${params.referenceCount} references. All authors have contributed significantly to this work and have approved the final version of the manuscript.

We confirm that this manuscript has not been published elsewhere and is not under consideration by another journal. All authors have disclosed any potential conflicts of interest. This study was conducted using publicly available, de-identified data from the SEER database and was exempt from institutional review board approval.

We appreciate your consideration of our manuscript and look forward to your response.

Sincerely,

${params.correspondingAuthor.name}
${params.correspondingAuthor.institution}
Email: ${params.correspondingAuthor.email}

On behalf of all authors:
${params.authors.join(', ')}
`;
}

export async function generateCoverLetter(params: CoverLetterParams): Promise<string> {
  // Use template-based generation for consistency
  return generateCoverLetterTemplate(params);
}

// Generate cover letters for all recommended journals
export async function generateAllCoverLetters(params: Omit<CoverLetterParams, 'journalName' | 'journalAbbreviation'>): Promise<{
  journal: typeof TOP_ONCOLOGY_JOURNALS[0];
  coverLetter: string;
}[]> {
  const results = [];
  
  for (const journal of TOP_ONCOLOGY_JOURNALS) {
    const coverLetter = await generateCoverLetter({
      ...params,
      journalName: journal.name,
      journalAbbreviation: journal.abbreviation,
    });
    results.push({ journal, coverLetter });
  }
  
  return results;
}

// Format journal list as markdown table
export function formatJournalListMarkdown(): string {
  let md = `# Recommended Oncology Journals for Submission\n\n`;
  md += `| Rank | Journal | IF | Submission URL | Acceptance Rate | Turnaround |\n`;
  md += `|------|---------|-----|----------------|-----------------|------------|\n`;
  
  for (const j of TOP_ONCOLOGY_JOURNALS) {
    md += `| ${j.rank} | ${j.name} | ${j.impactFactor} | [Submit](${j.submissionUrl}) | ${j.acceptanceRate} | ${j.turnaround} |\n`;
  }
  
  return md;
}

// Format journal list as HTML
export function formatJournalListHTML(): string {
  let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Recommended Oncology Journals</title>
<style>
body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
h1 { color: #333; }
table { width: 100%; border-collapse: collapse; margin-top: 20px; }
th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
th { background-color: #DC2626; color: white; }
tr:hover { background-color: #f5f5f5; }
a { color: #DC2626; text-decoration: none; }
a:hover { text-decoration: underline; }
.if { font-weight: bold; color: #DC2626; }
</style>
</head>
<body>
<h1>Recommended Oncology Journals for SEER-based Research</h1>
<table>
<thead>
<tr>
<th>Rank</th>
<th>Journal</th>
<th>Impact Factor</th>
<th>Publisher</th>
<th>Submission</th>
<th>Acceptance Rate</th>
<th>Turnaround</th>
</tr>
</thead>
<tbody>`;

  for (const j of TOP_ONCOLOGY_JOURNALS) {
    html += `
<tr>
<td>${j.rank}</td>
<td><strong>${j.name}</strong><br><small>${j.scope}</small></td>
<td class="if">${j.impactFactor}</td>
<td>${j.publisher}</td>
<td><a href="${j.submissionUrl}" target="_blank">Submit Manuscript</a></td>
<td>${j.acceptanceRate}</td>
<td>${j.turnaround}</td>
</tr>`;
  }

  html += `
</tbody>
</table>
</body>
</html>`;

  return html;
}

// Generate submission checklist
export function generateSubmissionChecklist(journalName: string): string {
  return `# Submission Checklist for ${journalName}

## Required Files
- [ ] Manuscript (Word/PDF format)
- [ ] Title Page (separate file with author information)
- [ ] Cover Letter
- [ ] Figures (high resolution, 300 DPI minimum)
- [ ] Tables (editable format)
- [ ] Supplementary Materials (if applicable)

## Manuscript Requirements
- [ ] Title ≤150 characters
- [ ] Structured Abstract ≤350 words
- [ ] Main text ~5000 words
- [ ] References in Vancouver format
- [ ] Figure legends included
- [ ] Table footnotes included

## Author Information
- [ ] All authors listed with affiliations
- [ ] ORCID IDs for all authors
- [ ] Corresponding author contact details
- [ ] Author contributions statement

## Declarations
- [ ] Conflict of Interest statement
- [ ] Funding sources disclosed
- [ ] Ethics approval (if applicable)
- [ ] Data availability statement
- [ ] Patient consent (if applicable)

## Formatting
- [ ] Double-spaced text
- [ ] Line numbers included
- [ ] Page numbers included
- [ ] Continuous line numbering

## Before Submission
- [ ] All co-authors have approved the manuscript
- [ ] Manuscript has been proofread
- [ ] All references are complete and accurate
- [ ] Figures and tables are cited in order
`;
}

export default {
  TOP_ONCOLOGY_JOURNALS,
  generateCoverLetter,
  generateAllCoverLetters,
  formatJournalListMarkdown,
  formatJournalListHTML,
  generateSubmissionChecklist,
};
