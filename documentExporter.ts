// Document Exporter - Word and PDF export for JAMA format manuscripts
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  convertInchesToTwip,
  PageBreak,
  ExternalHyperlink,
  Footer,
  Header,
  PageNumber,
  NumberFormat,
} from "docx";
import type { JAMAManuscriptData } from "./jamaTemplate";

// JAMA style configuration
const JAMA_STYLES = {
  titleFont: "Times New Roman",
  bodyFont: "Times New Roman",
  fontSize: {
    title: 28,
    heading1: 24,
    heading2: 20,
    body: 24, // 12pt = 24 half-points
    caption: 20,
    footnote: 18,
  },
  lineSpacing: 480, // Double spacing (240 = single)
  margins: {
    top: convertInchesToTwip(1),
    bottom: convertInchesToTwip(1),
    left: convertInchesToTwip(1),
    right: convertInchesToTwip(1),
  },
};

// Helper to create styled text run
function createTextRun(text: string, options: {
  bold?: boolean;
  italic?: boolean;
  superScript?: boolean;
  size?: number;
  font?: string;
} = {}): TextRun {
  return new TextRun({
    text,
    bold: options.bold || false,
    italics: options.italic || false,
    superScript: options.superScript || false,
    size: options.size || JAMA_STYLES.fontSize.body,
    font: options.font || JAMA_STYLES.bodyFont,
  });
}

// Helper to create paragraph with JAMA styling
function createParagraph(text: string, options: {
  heading?: typeof HeadingLevel[keyof typeof HeadingLevel];
  bold?: boolean;
  italic?: boolean;
  alignment?: typeof AlignmentType[keyof typeof AlignmentType];
  spacing?: { before?: number; after?: number };
  indent?: { left?: number; firstLine?: number };
} = {}): Paragraph {
  return new Paragraph({
    children: [createTextRun(text, { bold: options.bold, italic: options.italic })],
    heading: options.heading,
    alignment: options.alignment || AlignmentType.JUSTIFIED,
    spacing: {
      before: options.spacing?.before || 0,
      after: options.spacing?.after || 200,
      line: JAMA_STYLES.lineSpacing,
    },
    indent: options.indent,
  });
}

// Generate Figure Legend
export function generateFigureLegend(figure: {
  number: number;
  title: string;
  legend?: string;
  rCode?: string;
}): string {
  let legend = `**Figure ${figure.number}.** ${figure.title}`;
  
  if (figure.legend) {
    legend += `\n\n${figure.legend}`;
  }
  
  // Add standard figure legend components
  legend += `\n\nAbbreviations: HR, hazard ratio; CI, confidence interval; OS, overall survival; CSS, cancer-specific survival.`;
  
  if (figure.rCode) {
    legend += `\n\nNote: Figure generated using R statistical software. Complete R code available in supplementary materials.`;
  }
  
  return legend;
}

// Export to Word document
export async function exportToWord(data: JAMAManuscriptData): Promise<Buffer> {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: JAMA_STYLES.bodyFont,
            size: JAMA_STYLES.fontSize.body,
          },
          paragraph: {
            spacing: { line: JAMA_STYLES.lineSpacing },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: JAMA_STYLES.margins,
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  createTextRun(data.title.substring(0, 50) + "...", { size: 18 }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  createTextRun("Page ", { size: 18 }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                  }),
                  createTextRun(" of ", { size: 18 }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [
          // Title Page
          new Paragraph({
            children: [createTextRun(data.title, { bold: true, size: JAMA_STYLES.fontSize.title })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 400 },
          }),
          
          // Authors
          new Paragraph({
            children: [
              createTextRun(
                data.authors.map(a => `${a.name}, ${a.degrees}`).join("; "),
                { size: JAMA_STYLES.fontSize.body }
              ),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          
          // Affiliations
          ...data.authors.flatMap((author, idx) =>
            author.affiliations.map((aff, affIdx) =>
              new Paragraph({
                children: [
                  createTextRun(`${idx + 1}. `, { superScript: true, size: 18 }),
                  createTextRun(aff, { size: 20 }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
              })
            )
          ),
          
          // Corresponding Author
          new Paragraph({
            children: [
              createTextRun("Corresponding Author: ", { bold: true }),
              createTextRun(
                `${data.articleInfo.correspondingAuthor.name}, ${data.articleInfo.correspondingAuthor.department}, ${data.articleInfo.correspondingAuthor.institution}, ${data.articleInfo.correspondingAuthor.address}. Email: ${data.articleInfo.correspondingAuthor.email}`,
                {}
              ),
            ],
            spacing: { before: 400, after: 400 },
          }),
          
          // Page break before Key Points
          new Paragraph({ children: [new PageBreak()] }),
          
          // Key Points Box
          new Paragraph({
            children: [createTextRun("Key Points", { bold: true, size: JAMA_STYLES.fontSize.heading1 })],
            spacing: { before: 200, after: 200 },
          }),
          new Paragraph({
            children: [
              createTextRun("Question: ", { bold: true }),
              createTextRun(data.keyPoints.question),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              createTextRun("Findings: ", { bold: true }),
              createTextRun(data.keyPoints.findings),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              createTextRun("Meaning: ", { bold: true }),
              createTextRun(data.keyPoints.meaning),
            ],
            spacing: { after: 400 },
          }),
          
          // Abstract
          new Paragraph({
            children: [createTextRun("Abstract", { bold: true, size: JAMA_STYLES.fontSize.heading1 })],
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              createTextRun("Importance: ", { bold: true }),
              createTextRun(data.abstract.importance),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              createTextRun("Objective: ", { bold: true }),
              createTextRun(data.abstract.objective),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              createTextRun("Design, Setting, and Participants: ", { bold: true }),
              createTextRun(data.abstract.designSettingParticipants),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              createTextRun("Exposures: ", { bold: true }),
              createTextRun(data.abstract.exposure),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              createTextRun("Main Outcomes and Measures: ", { bold: true }),
              createTextRun(data.abstract.mainOutcomes),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              createTextRun("Results: ", { bold: true }),
              createTextRun(data.abstract.results),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              createTextRun("Conclusions and Relevance: ", { bold: true }),
              createTextRun(data.abstract.conclusionsRelevance),
            ],
            spacing: { after: 400 },
          }),
          
          // Page break before Introduction
          new Paragraph({ children: [new PageBreak()] }),
          
          // Introduction
          new Paragraph({
            children: [createTextRun("Introduction", { bold: true, size: JAMA_STYLES.fontSize.heading1 })],
            spacing: { before: 400, after: 200 },
          }),
          ...data.introduction.split('\n\n').filter(p => p.trim()).map(para =>
            createParagraph(para, { indent: { firstLine: convertInchesToTwip(0.5) } })
          ),
          
          // Methods
          new Paragraph({
            children: [createTextRun("Methods", { bold: true, size: JAMA_STYLES.fontSize.heading1 })],
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [createTextRun("Data Sources", { bold: true, size: JAMA_STYLES.fontSize.heading2 })],
            spacing: { before: 200, after: 100 },
          }),
          ...data.methods.dataSources.split('\n\n').filter(p => p.trim()).map(para =>
            createParagraph(para, { indent: { firstLine: convertInchesToTwip(0.5) } })
          ),
          new Paragraph({
            children: [createTextRun("Study Population", { bold: true, size: JAMA_STYLES.fontSize.heading2 })],
            spacing: { before: 200, after: 100 },
          }),
          ...data.methods.studyPopulation.split('\n\n').filter(p => p.trim()).map(para =>
            createParagraph(para, { indent: { firstLine: convertInchesToTwip(0.5) } })
          ),
          new Paragraph({
            children: [createTextRun("Statistical Analysis", { bold: true, size: JAMA_STYLES.fontSize.heading2 })],
            spacing: { before: 200, after: 100 },
          }),
          ...data.methods.statisticalAnalysis.split('\n\n').filter(p => p.trim()).map(para =>
            createParagraph(para, { indent: { firstLine: convertInchesToTwip(0.5) } })
          ),
          
          // Results
          new Paragraph({
            children: [createTextRun("Results", { bold: true, size: JAMA_STYLES.fontSize.heading1 })],
            spacing: { before: 400, after: 200 },
          }),
          ...data.results.split('\n\n').filter(p => p.trim()).map(para =>
            createParagraph(para, { indent: { firstLine: convertInchesToTwip(0.5) } })
          ),
          
          // Discussion
          new Paragraph({
            children: [createTextRun("Discussion", { bold: true, size: JAMA_STYLES.fontSize.heading1 })],
            spacing: { before: 400, after: 200 },
          }),
          ...data.discussion.split('\n\n').filter(p => p.trim()).map(para =>
            createParagraph(para, { indent: { firstLine: convertInchesToTwip(0.5) } })
          ),
          
          // Limitations
          new Paragraph({
            children: [createTextRun("Limitations", { bold: true, size: JAMA_STYLES.fontSize.heading2 })],
            spacing: { before: 200, after: 100 },
          }),
          createParagraph(data.limitations, { indent: { firstLine: convertInchesToTwip(0.5) } }),
          
          // Conclusions
          new Paragraph({
            children: [createTextRun("Conclusions", { bold: true, size: JAMA_STYLES.fontSize.heading1 })],
            spacing: { before: 400, after: 200 },
          }),
          createParagraph(data.conclusions, { indent: { firstLine: convertInchesToTwip(0.5) } }),
          
          // Page break before Article Information
          new Paragraph({ children: [new PageBreak()] }),
          
          // Article Information
          new Paragraph({
            children: [createTextRun("Article Information", { bold: true, size: JAMA_STYLES.fontSize.heading1 })],
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              createTextRun("Accepted for Publication: ", { bold: true }),
              createTextRun(data.articleInfo.acceptedDate),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              createTextRun("Published: ", { bold: true }),
              createTextRun(data.articleInfo.publishedDate),
            ],
            spacing: { after: 200 },
          }),
          
          // Author Contributions
          new Paragraph({
            children: [createTextRun("Author Contributions: ", { bold: true })],
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              createTextRun("Concept and design: ", { italic: true }),
              createTextRun(data.articleInfo.authorContributions.conceptDesign.join(", ")),
            ],
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [
              createTextRun("Acquisition, analysis, or interpretation of data: ", { italic: true }),
              createTextRun(data.articleInfo.authorContributions.acquisitionAnalysis.join(", ")),
            ],
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [
              createTextRun("Drafting of the manuscript: ", { italic: true }),
              createTextRun(data.articleInfo.authorContributions.drafting.join(", ")),
            ],
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [
              createTextRun("Critical review of the manuscript: ", { italic: true }),
              createTextRun(data.articleInfo.authorContributions.criticalReview.join(", ")),
            ],
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [
              createTextRun("Statistical analysis: ", { italic: true }),
              createTextRun(data.articleInfo.authorContributions.statisticalAnalysis.join(", ")),
            ],
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [
              createTextRun("Supervision: ", { italic: true }),
              createTextRun(data.articleInfo.authorContributions.supervision.join(", ")),
            ],
            spacing: { after: 200 },
          }),
          
          // Conflict of Interest
          new Paragraph({
            children: [
              createTextRun("Conflict of Interest Disclosures: ", { bold: true }),
              createTextRun(data.articleInfo.conflictOfInterest),
            ],
            spacing: { after: 200 },
          }),
          
          // Funding
          new Paragraph({
            children: [
              createTextRun("Funding/Support: ", { bold: true }),
              createTextRun(data.articleInfo.fundingSupport),
            ],
            spacing: { after: 200 },
          }),
          
          // Role of Funder
          new Paragraph({
            children: [
              createTextRun("Role of the Funder/Sponsor: ", { bold: true }),
              createTextRun(data.articleInfo.roleOfFunder),
            ],
            spacing: { after: 200 },
          }),
          
          // Data Sharing
          new Paragraph({
            children: [
              createTextRun("Data Sharing Statement: ", { bold: true }),
              createTextRun(data.articleInfo.dataSharingStatement),
            ],
            spacing: { after: 400 },
          }),
          
          // Page break before References
          new Paragraph({ children: [new PageBreak()] }),
          
          // References
          new Paragraph({
            children: [createTextRun("References", { bold: true, size: JAMA_STYLES.fontSize.heading1 })],
            spacing: { before: 400, after: 200 },
          }),
          ...data.references.map((ref, idx) =>
            new Paragraph({
              children: [
                createTextRun(`${idx + 1}. `, { bold: true }),
                createTextRun(`${ref.authors}. ${ref.title}. `, {}),
                createTextRun(`${ref.journal}. `, { italic: true }),
                createTextRun(`${ref.year};${ref.volume}:${ref.pages}. `),
                createTextRun(`doi:${ref.doi}`, {}),
              ],
              spacing: { after: 100 },
              indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.5) },
            })
          ),
          
          // Page break before Tables
          new Paragraph({ children: [new PageBreak()] }),
          
          // Tables
          new Paragraph({
            children: [createTextRun("Tables", { bold: true, size: JAMA_STYLES.fontSize.heading1 })],
            spacing: { before: 400, after: 200 },
          }),
          ...data.tables.flatMap((table, idx) => [
            new Paragraph({
              children: [
                createTextRun(`Table ${table.number}. `, { bold: true }),
                createTextRun(table.title),
              ],
              spacing: { before: 300, after: 200 },
            }),
            new Paragraph({
              children: [createTextRun(table.content || "[Table content to be inserted]", { size: 20 })],
              spacing: { after: 300 },
            }),
          ]),
          
          // Page break before Figures
          new Paragraph({ children: [new PageBreak()] }),
          
          // Figure Legends
          new Paragraph({
            children: [createTextRun("Figure Legends", { bold: true, size: JAMA_STYLES.fontSize.heading1 })],
            spacing: { before: 400, after: 200 },
          }),
          ...data.figures.flatMap((figure, idx) => {
            const legend = generateFigureLegend(figure);
            return [
              new Paragraph({
                children: [
                  createTextRun(`Figure ${figure.number}. `, { bold: true }),
                  createTextRun(figure.title),
                ],
                spacing: { before: 300, after: 100 },
              }),
              new Paragraph({
                children: [createTextRun(figure.legend || "", { size: 20 })],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  createTextRun("Abbreviations: ", { bold: true, size: 20 }),
                  createTextRun("HR, hazard ratio; CI, confidence interval; OS, overall survival; CSS, cancer-specific survival.", { size: 20 }),
                ],
                spacing: { after: 200 },
              }),
            ];
          }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

// Export to HTML for PDF printing
export function exportToHTML(data: JAMAManuscriptData): string {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Source+Serif+Pro:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    @page {
      size: letter;
      margin: 1in;
    }
    
    @media print {
      body { font-size: 12pt; }
      .page-break { page-break-before: always; }
      .no-print { display: none; }
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Source Serif Pro', 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 2;
      color: #000;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 1in;
      background: #fff;
    }
    
    h1 {
      font-size: 18pt;
      font-weight: 700;
      margin: 24pt 0 12pt;
      text-align: center;
    }
    
    h2 {
      font-size: 14pt;
      font-weight: 700;
      margin: 18pt 0 9pt;
    }
    
    h3 {
      font-size: 12pt;
      font-weight: 600;
      margin: 12pt 0 6pt;
    }
    
    p {
      margin-bottom: 12pt;
      text-align: justify;
      text-indent: 0.5in;
    }
    
    p.no-indent {
      text-indent: 0;
    }
    
    .title-page {
      text-align: center;
      margin-bottom: 48pt;
    }
    
    .title-page h1 {
      font-size: 24pt;
      margin-bottom: 24pt;
    }
    
    .authors {
      font-size: 12pt;
      margin-bottom: 12pt;
    }
    
    .affiliations {
      font-size: 10pt;
      color: #333;
      margin-bottom: 24pt;
    }
    
    .key-points {
      border: 2px solid #c00;
      padding: 16pt;
      margin: 24pt 0;
      background: #fff5f5;
    }
    
    .key-points h2 {
      color: #c00;
      text-align: center;
      margin-bottom: 12pt;
    }
    
    .key-points p {
      text-indent: 0;
      margin-bottom: 8pt;
    }
    
    .abstract {
      margin: 24pt 0;
    }
    
    .abstract p {
      text-indent: 0;
    }
    
    .abstract strong {
      font-weight: 600;
    }
    
    .section {
      margin: 24pt 0;
    }
    
    .article-info {
      margin: 24pt 0;
      font-size: 10pt;
      line-height: 1.6;
    }
    
    .article-info p {
      text-indent: 0;
      margin-bottom: 6pt;
    }
    
    .references {
      margin: 24pt 0;
    }
    
    .references ol {
      padding-left: 24pt;
    }
    
    .references li {
      margin-bottom: 6pt;
      text-indent: -24pt;
      padding-left: 24pt;
    }
    
    .references em {
      font-style: italic;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12pt 0;
      font-size: 10pt;
      line-height: 1.4;
    }
    
    table caption {
      text-align: left;
      font-weight: 600;
      margin-bottom: 6pt;
    }
    
    th, td {
      padding: 6pt 8pt;
      text-align: left;
      border-bottom: 1px solid #ccc;
    }
    
    th {
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      font-weight: 600;
    }
    
    tbody tr:last-child td {
      border-bottom: 2px solid #000;
    }
    
    .figure-legend {
      margin: 24pt 0;
    }
    
    .figure-legend h3 {
      font-weight: 600;
    }
    
    .figure-legend p {
      text-indent: 0;
      font-size: 10pt;
      line-height: 1.6;
    }
    
    sup {
      font-size: 8pt;
      vertical-align: super;
    }
  </style>
</head>
<body>
  <div class="title-page">
    <h1>${data.title}</h1>
    <p class="authors no-indent">${data.authors.map(a => `${a.name}, ${a.degrees}`).join("; ")}</p>
    <p class="affiliations no-indent">${data.authors.flatMap((a, i) => a.affiliations.map(aff => `<sup>${i + 1}</sup>${aff}`)).join("; ")}</p>
    <p class="no-indent"><strong>Corresponding Author:</strong> ${data.articleInfo.correspondingAuthor.name}, ${data.articleInfo.correspondingAuthor.department}, ${data.articleInfo.correspondingAuthor.institution}. Email: ${data.articleInfo.correspondingAuthor.email}</p>
  </div>
  
  <div class="key-points">
    <h2>Key Points</h2>
    <p><strong>Question:</strong> ${data.keyPoints.question}</p>
    <p><strong>Findings:</strong> ${data.keyPoints.findings}</p>
    <p><strong>Meaning:</strong> ${data.keyPoints.meaning}</p>
  </div>
  
  <div class="abstract">
    <h2>Abstract</h2>
    <p><strong>Importance:</strong> ${data.abstract.importance}</p>
    <p><strong>Objective:</strong> ${data.abstract.objective}</p>
    <p><strong>Design, Setting, and Participants:</strong> ${data.abstract.designSettingParticipants}</p>
    <p><strong>Exposures:</strong> ${data.abstract.exposure}</p>
    <p><strong>Main Outcomes and Measures:</strong> ${data.abstract.mainOutcomes}</p>
    <p><strong>Results:</strong> ${data.abstract.results}</p>
    <p><strong>Conclusions and Relevance:</strong> ${data.abstract.conclusionsRelevance}</p>
  </div>
  
  <div class="page-break"></div>
  
  <div class="section">
    <h2>Introduction</h2>
    ${data.introduction.split('\n\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('\n')}
  </div>
  
  <div class="section">
    <h2>Methods</h2>
    <h3>Data Sources</h3>
    ${data.methods.dataSources.split('\n\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('\n')}
    <h3>Study Population</h3>
    ${data.methods.studyPopulation.split('\n\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('\n')}
    <h3>Statistical Analysis</h3>
    ${data.methods.statisticalAnalysis.split('\n\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('\n')}
  </div>
  
  <div class="section">
    <h2>Results</h2>
    ${data.results.split('\n\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('\n')}
  </div>
  
  <div class="section">
    <h2>Discussion</h2>
    ${data.discussion.split('\n\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('\n')}
    <h3>Limitations</h3>
    <p>${data.limitations}</p>
  </div>
  
  <div class="section">
    <h2>Conclusions</h2>
    <p>${data.conclusions}</p>
  </div>
  
  <div class="page-break"></div>
  
  <div class="article-info">
    <h2>Article Information</h2>
    <p><strong>Accepted for Publication:</strong> ${data.articleInfo.acceptedDate}</p>
    <p><strong>Published:</strong> ${data.articleInfo.publishedDate}</p>
    <p><strong>Author Contributions:</strong></p>
    <p><em>Concept and design:</em> ${data.articleInfo.authorContributions.conceptDesign.join(", ")}</p>
    <p><em>Acquisition, analysis, or interpretation of data:</em> ${data.articleInfo.authorContributions.acquisitionAnalysis.join(", ")}</p>
    <p><em>Drafting of the manuscript:</em> ${data.articleInfo.authorContributions.drafting.join(", ")}</p>
    <p><em>Critical review of the manuscript:</em> ${data.articleInfo.authorContributions.criticalReview.join(", ")}</p>
    <p><em>Statistical analysis:</em> ${data.articleInfo.authorContributions.statisticalAnalysis.join(", ")}</p>
    <p><em>Supervision:</em> ${data.articleInfo.authorContributions.supervision.join(", ")}</p>
    <p><strong>Conflict of Interest Disclosures:</strong> ${data.articleInfo.conflictOfInterest}</p>
    <p><strong>Funding/Support:</strong> ${data.articleInfo.fundingSupport}</p>
    <p><strong>Role of the Funder/Sponsor:</strong> ${data.articleInfo.roleOfFunder}</p>
    <p><strong>Data Sharing Statement:</strong> ${data.articleInfo.dataSharingStatement}</p>
  </div>
  
  <div class="page-break"></div>
  
  <div class="references">
    <h2>References</h2>
    <ol>
      ${data.references.map(ref => `<li>${ref.authors}. ${ref.title}. <em>${ref.journal}</em>. ${ref.year};${ref.volume}:${ref.pages}. doi:${ref.doi}</li>`).join('\n')}
    </ol>
  </div>
  
  <div class="page-break"></div>
  
  <h2>Tables</h2>
  ${data.tables.map(table => `
    <div class="table-container">
      <p class="no-indent"><strong>Table ${table.number}.</strong> ${table.title}</p>
      <div>${table.content || '[Table content]'}</div>
    </div>
  `).join('\n')}
  
  <div class="page-break"></div>
  
  <h2>Figure Legends</h2>
  ${data.figures.map(figure => `
    <div class="figure-legend">
      <h3>Figure ${figure.number}. ${figure.title}</h3>
      <p>${figure.legend || ''}</p>
      <p><strong>Abbreviations:</strong> HR, hazard ratio; CI, confidence interval; OS, overall survival; CSS, cancer-specific survival.</p>
    </div>
  `).join('\n')}
  
</body>
</html>`;

  return html;
}

// Count words in text
export function countWordsInText(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}
