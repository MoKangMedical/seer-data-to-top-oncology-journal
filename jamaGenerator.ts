  md += `${manuscript.discussion.implications.content}\n\n`;
  
  // Conclusions
  md += `## Conclusions\n\n${manuscript.conclusions.content}\n\n`;
  
  // References
  if (references.length > 0) {
    md += `## References\n\n`;
    references.forEach((ref, i) => {
      md += `${i + 1}. ${ref.citation}\n\n`;
    });
  }
  
  // Word count summary
  md += `---\n\n`;
  md += `**Word Count:** ${manuscript.totalWordCount} words (excluding abstract, tables, figures, and references)\n\n`;
  md += `**Tables:** ${manuscript.tableCount} | **Figures:** ${manuscript.figureCount} | **References:** ${manuscript.referenceCount}\n`;
  
  return md;
}

// Export to Word-compatible HTML
export function formatJAMAToHTML(manuscript: JAMAManuscript, references: { citation: string }[]): string {
  let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${manuscript.title}</title>
<style>
body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 2; max-width: 8.5in; margin: 1in auto; }
h1 { font-size: 14pt; text-align: center; margin-bottom: 24pt; }
h2 { font-size: 12pt; font-weight: bold; margin-top: 18pt; }
h3 { font-size: 12pt; font-weight: bold; margin-top: 12pt; }
p { text-indent: 0.5in; margin: 0 0 12pt 0; }
.no-indent { text-indent: 0; }
.key-points { border: 1px solid #000; padding: 12pt; margin: 18pt 0; }
.abstract { margin: 18pt 0; }
.abstract p { text-indent: 0; }
.references p { text-indent: -0.5in; padding-left: 0.5in; }
.word-count { font-size: 10pt; color: #666; margin-top: 24pt; }
</style>
</head>
<body>

<h1>${manuscript.title}</h1>

<div class="key-points">
<h2>Key Points</h2>
<p class="no-indent"><strong>Question:</strong> ${manuscript.keyPoints.question}</p>
<p class="no-indent"><strong>Findings:</strong> ${manuscript.keyPoints.findings}</p>