// Chart Generator Service
// Generates publication-ready charts and figures from data analysis

import { invokeLLM } from "./_core/llm";

// Chart types for oncology research
export type ChartType = 
  | 'flowchart'           // Patient selection flow chart
  | 'kaplan_meier'        // Survival curves
  | 'forest_plot'         // Subgroup analysis
  | 'baseline_table'      // Table 1
  | 'cox_table'           // Regression results
  | 'cumulative_incidence' // Competing risks
  | 'rcs_curve'           // Restricted cubic spline
  | 'calibration'         // Model calibration
  | 'roc_curve';          // ROC/AUC analysis

// Top journal (Lancet/JAMA) style color palette
export const PUBLICATION_COLORS = {
  primary: '#DC2626',      // Red (Lancet style)
  secondary: '#1E40AF',    // Blue
  tertiary: '#059669',     // Green
  quaternary: '#7C3AED',   // Purple
  gray: '#6B7280',
  lightGray: '#E5E7EB',
  background: '#FFFFFF',
  text: '#1F2937',
};

// Generate R code for Kaplan-Meier survival curve
export function generateKMPlotCode(params: {
  dataFile: string;
  timeVar: string;
  eventVar: string;
  groupVar: string;
  groupLabels: string[];
  title: string;
  xLabel?: string;
  yLabel?: string;
}): string {
  return `# Kaplan-Meier Survival Curve
# Publication-ready figure following Lancet/JAMA style

library(survival)
library(survminer)
library(ggplot2)

# Load data
data <- read.csv("${params.dataFile}")

# Create survival object
surv_obj <- Surv(time = data$${params.timeVar}, event = data$${params.eventVar})

# Fit survival curves by group
fit <- survfit(surv_obj ~ ${params.groupVar}, data = data)

# Create publication-ready plot
km_plot <- ggsurvplot(
  fit,
  data = data,
  pval = TRUE,
  pval.method = TRUE,
  conf.int = TRUE,
  risk.table = TRUE,
  risk.table.col = "strata",
  risk.table.height = 0.25,
  linetype = "strata",
  palette = c("${PUBLICATION_COLORS.primary}", "${PUBLICATION_COLORS.secondary}"),
  legend.labs = c(${params.groupLabels.map(l => `"${l}"`).join(', ')}),
  legend.title = "",
  xlab = "${params.xLabel || 'Time (months)'}",
  ylab = "${params.yLabel || 'Survival Probability'}",
  title = "${params.title}",
  font.main = c(14, "bold"),
  font.x = c(12, "plain"),
  font.y = c(12, "plain"),
  font.tickslab = c(10, "plain"),
  ggtheme = theme_classic() +
    theme(
      plot.title = element_text(hjust = 0.5),
      legend.position = "bottom",
      panel.grid.major = element_blank(),
      panel.grid.minor = element_blank()
    )
)

# Save figure
ggsave("Figure_KM_Survival.png", km_plot$plot, width = 10, height = 8, dpi = 300)
ggsave("Figure_KM_Survival.pdf", km_plot$plot, width = 10, height = 8)

# Print summary statistics
summary(fit)
`;
}

// Generate R code for Forest Plot
export function generateForestPlotCode(params: {
  subgroups: { name: string; hr: number; lower: number; upper: number; pValue: number }[];
  title: string;
}): string {
  const subgroupData = params.subgroups.map(s => 
    `  c("${s.name}", ${s.hr}, ${s.lower}, ${s.upper}, ${s.pValue})`
  ).join(',\n');

  return `# Forest Plot for Subgroup Analysis
# Publication-ready figure following Lancet/JAMA style

library(forestplot)
library(ggplot2)
library(dplyr)

# Subgroup analysis data
subgroup_data <- data.frame(
  Subgroup = c(${params.subgroups.map(s => `"${s.name}"`).join(', ')}),
  HR = c(${params.subgroups.map(s => s.hr).join(', ')}),
  Lower = c(${params.subgroups.map(s => s.lower).join(', ')}),
  Upper = c(${params.subgroups.map(s => s.upper).join(', ')}),
  P_value = c(${params.subgroups.map(s => s.pValue).join(', ')})
)

# Create forest plot
forest_plot <- ggplot(subgroup_data, aes(x = HR, y = reorder(Subgroup, HR))) +
  geom_vline(xintercept = 1, linetype = "dashed", color = "gray50") +
  geom_errorbarh(aes(xmin = Lower, xmax = Upper), height = 0.2, color = "${PUBLICATION_COLORS.secondary}") +
  geom_point(size = 3, color = "${PUBLICATION_COLORS.primary}") +
  scale_x_log10() +
  labs(
    title = "${params.title}",
    x = "Hazard Ratio (95% CI)",
    y = ""
  ) +
  theme_classic() +
  theme(
    plot.title = element_text(hjust = 0.5, face = "bold", size = 14),
    axis.text = element_text(size = 10),
    axis.title = element_text(size = 12)
  )

# Save figure
ggsave("Figure_Forest_Plot.png", forest_plot, width = 10, height = 8, dpi = 300)
ggsave("Figure_Forest_Plot.pdf", forest_plot, width = 10, height = 8)

print(forest_plot)
`;
}

// Generate SVG Flow Chart
export function generateFlowChartSVG(params: {
  initialN: number;
  exclusions: { reason: string; n: number }[];
  finalGroups: { name: string; n: number }[];
}): string {
  const totalExcluded = params.exclusions.reduce((sum, e) => sum + e.n, 0);
  const afterExclusion = params.initialN - totalExcluded;
  
  let y = 30;
  const boxHeight = 50;
  const boxWidth = 280;
  const spacing = 80;
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 ${200 + params.exclusions.length * 60 + 150}" width="800">
  <style>
    .box { fill: white; stroke: #DC2626; stroke-width: 2; }
    .exclusion-box { fill: #FEE2E2; stroke: #DC2626; stroke-width: 1; }
    .text { font-family: Arial, sans-serif; font-size: 14px; fill: #1F2937; }
    .title { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #1F2937; }
    .number { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #DC2626; }
    .arrow { stroke: #6B7280; stroke-width: 2; fill: none; marker-end: url(#arrowhead); }
  </style>
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
    </marker>
  </defs>
  
  <!-- Initial Population -->
  <rect class="box" x="260" y="${y}" width="${boxWidth}" height="${boxHeight}" rx="5"/>
  <text class="title" x="400" y="${y + 25}" text-anchor="middle">SEER Database</text>
  <text class="number" x="400" y="${y + 42}" text-anchor="middle">N = ${params.initialN.toLocaleString()}</text>
`;

  y += boxHeight + 20;
  
  // Arrow down
  svg += `  <line class="arrow" x1="400" y1="${y - 20}" x2="400" y2="${y + 10}"/>
`;
  
  y += 30;
  
  // Exclusion boxes
  let currentN = params.initialN;
  for (const exclusion of params.exclusions) {
    svg += `
  <!-- Exclusion: ${exclusion.reason} -->
  <rect class="exclusion-box" x="500" y="${y}" width="250" height="40" rx="3"/>
  <text class="text" x="625" y="${y + 18}" text-anchor="middle">${exclusion.reason}</text>
  <text class="number" x="625" y="${y + 34}" text-anchor="middle">n = ${exclusion.n.toLocaleString()}</text>
  <line class="arrow" x1="400" y1="${y + 20}" x2="495" y2="${y + 20}"/>
`;
    currentN -= exclusion.n;
    y += 50;
    
    // Intermediate box
    svg += `
  <rect class="box" x="260" y="${y}" width="${boxWidth}" height="${boxHeight}" rx="5"/>
  <text class="text" x="400" y="${y + 25}" text-anchor="middle">After Exclusion</text>
  <text class="number" x="400" y="${y + 42}" text-anchor="middle">N = ${currentN.toLocaleString()}</text>
  <line class="arrow" x1="400" y1="${y - 30}" x2="400" y2="${y}"/>
`;
    y += boxHeight + 20;
  }
  
  // Final groups
  const groupWidth = 200;
  const totalWidth = params.finalGroups.length * groupWidth + (params.finalGroups.length - 1) * 30;
  let groupX = 400 - totalWidth / 2;
  
  svg += `  <line class="arrow" x1="400" y1="${y - 20}" x2="400" y2="${y + 10}"/>
`;
  y += 30;
  
  for (let i = 0; i < params.finalGroups.length; i++) {
    const group = params.finalGroups[i];
    svg += `
  <rect class="box" x="${groupX}" y="${y}" width="${groupWidth}" height="${boxHeight}" rx="5"/>
  <text class="title" x="${groupX + groupWidth/2}" y="${y + 25}" text-anchor="middle">${group.name}</text>
  <text class="number" x="${groupX + groupWidth/2}" y="${y + 42}" text-anchor="middle">N = ${group.n.toLocaleString()}</text>
`;
    if (i < params.finalGroups.length - 1) {
      svg += `  <line class="arrow" x1="400" y1="${y - 20}" x2="${groupX + groupWidth/2}" y2="${y}"/>
`;
    }
    groupX += groupWidth + 30;
  }
  
  svg += `</svg>`;
  return svg;
}

// Generate baseline characteristics table HTML
export function generateBaselineTableHTML(params: {
  title: string;
  groups: { name: string; n: number }[];
  variables: {
    name: string;
    type: 'continuous' | 'categorical';
    values: { group: string; value: string }[];
    pValue?: number;
  }[];
}): string {
  let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${params.title}</title>
<style>
body { font-family: 'Times New Roman', Times, serif; }
table { border-collapse: collapse; width: 100%; margin: 20px 0; }
th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #ddd; }
th { background-color: #f8f9fa; font-weight: bold; }
.header-row { border-top: 2px solid #000; border-bottom: 2px solid #000; }
.footer-row { border-bottom: 2px solid #000; }
.p-value { text-align: center; }
.significant { font-weight: bold; }
caption { font-weight: bold; margin-bottom: 10px; text-align: left; }
</style>
</head>
<body>
<table>
<caption>${params.title}</caption>
<thead>
<tr class="header-row">
<th>Characteristic</th>
${params.groups.map(g => `<th>${g.name}<br>(N=${g.n.toLocaleString()})</th>`).join('\n')}
<th class="p-value">P Value</th>
</tr>
</thead>
<tbody>
`;

  for (const variable of params.variables) {
    const pClass = variable.pValue && variable.pValue < 0.05 ? 'significant' : '';
    html += `<tr>
<td>${variable.name}</td>
${variable.values.map(v => `<td>${v.value}</td>`).join('\n')}
<td class="p-value ${pClass}">${variable.pValue ? variable.pValue.toFixed(3) : '-'}</td>
</tr>
`;
  }

  html += `</tbody>
</table>
<p><small>Values are presented as mean ± SD for continuous variables and n (%) for categorical variables.</small></p>
</body>
</html>`;

  return html;
}

// Generate all figures R code
export async function generateAllFiguresCode(params: {
  studyDesign: string;
  population: string;
  exposure: string;
  outcome: string;
  covariates: string[];
}): Promise<{
  kmCode: string;
  forestCode: string;
  flowchartSVG: string;
  baselineTableHTML: string;
}> {
  // Generate mock data for demonstration
  const kmCode = generateKMPlotCode({
    dataFile: 'seer_data.csv',
    timeVar: 'survival_months',
    eventVar: 'vital_status',
    groupVar: 'treatment_group',
    groupLabels: ['Control', 'Treatment'],
    title: `Overall Survival by ${params.exposure}`,
  });

  const forestCode = generateForestPlotCode({
    subgroups: [
      { name: 'Overall', hr: 0.75, lower: 0.65, upper: 0.87, pValue: 0.001 },
      { name: 'Age <65', hr: 0.72, lower: 0.58, upper: 0.89, pValue: 0.003 },
      { name: 'Age ≥65', hr: 0.78, lower: 0.64, upper: 0.95, pValue: 0.012 },
      { name: 'Male', hr: 0.74, lower: 0.61, upper: 0.90, pValue: 0.002 },
      { name: 'Female', hr: 0.77, lower: 0.62, upper: 0.96, pValue: 0.018 },
      { name: 'Stage I-II', hr: 0.68, lower: 0.52, upper: 0.89, pValue: 0.005 },
      { name: 'Stage III-IV', hr: 0.82, lower: 0.68, upper: 0.99, pValue: 0.041 },
    ],
    title: `Subgroup Analysis: ${params.exposure} and ${params.outcome}`,
  });

  const flowchartSVG = generateFlowChartSVG({
    initialN: 125000,
    exclusions: [
      { reason: 'Missing survival data', n: 15000 },
      { reason: 'Unknown stage', n: 8500 },
      { reason: 'Prior malignancy', n: 12000 },
      { reason: 'Age <18 years', n: 500 },
    ],
    finalGroups: [
      { name: 'Treatment Group', n: 45000 },
      { name: 'Control Group', n: 44000 },
    ],
  });

  const baselineTableHTML = generateBaselineTableHTML({
    title: 'Table 1. Baseline Characteristics of Study Population',
    groups: [
      { name: 'Treatment', n: 45000 },
      { name: 'Control', n: 44000 },
    ],
    variables: [
      { name: 'Age, years (mean ± SD)', type: 'continuous', values: [{ group: 'Treatment', value: '62.3 ± 12.5' }, { group: 'Control', value: '63.1 ± 13.2' }], pValue: 0.042 },
      { name: 'Male sex, n (%)', type: 'categorical', values: [{ group: 'Treatment', value: '24,750 (55.0)' }, { group: 'Control', value: '23,760 (54.0)' }], pValue: 0.321 },
      { name: 'Race, n (%)', type: 'categorical', values: [{ group: 'Treatment', value: '' }, { group: 'Control', value: '' }] },
      { name: '  White', type: 'categorical', values: [{ group: 'Treatment', value: '36,000 (80.0)' }, { group: 'Control', value: '35,200 (80.0)' }], pValue: 0.892 },
      { name: '  Black', type: 'categorical', values: [{ group: 'Treatment', value: '5,400 (12.0)' }, { group: 'Control', value: '5,280 (12.0)' }] },
      { name: '  Other', type: 'categorical', values: [{ group: 'Treatment', value: '3,600 (8.0)' }, { group: 'Control', value: '3,520 (8.0)' }] },
      { name: 'Stage, n (%)', type: 'categorical', values: [{ group: 'Treatment', value: '' }, { group: 'Control', value: '' }] },
      { name: '  I', type: 'categorical', values: [{ group: 'Treatment', value: '13,500 (30.0)' }, { group: 'Control', value: '13,200 (30.0)' }], pValue: 0.156 },
      { name: '  II', type: 'categorical', values: [{ group: 'Treatment', value: '11,250 (25.0)' }, { group: 'Control', value: '10,560 (24.0)' }] },
      { name: '  III', type: 'categorical', values: [{ group: 'Treatment', value: '12,600 (28.0)' }, { group: 'Control', value: '12,320 (28.0)' }] },
      { name: '  IV', type: 'categorical', values: [{ group: 'Treatment', value: '7,650 (17.0)' }, { group: 'Control', value: '7,920 (18.0)' }] },
      { name: 'Grade, n (%)', type: 'categorical', values: [{ group: 'Treatment', value: '' }, { group: 'Control', value: '' }] },
      { name: '  Well differentiated', type: 'categorical', values: [{ group: 'Treatment', value: '9,000 (20.0)' }, { group: 'Control', value: '8,800 (20.0)' }], pValue: 0.234 },
      { name: '  Moderately differentiated', type: 'categorical', values: [{ group: 'Treatment', value: '18,000 (40.0)' }, { group: 'Control', value: '17,600 (40.0)' }] },
      { name: '  Poorly differentiated', type: 'categorical', values: [{ group: 'Treatment', value: '18,000 (40.0)' }, { group: 'Control', value: '17,600 (40.0)' }] },
    ],
  });

  return {
    kmCode,
    forestCode,
    flowchartSVG,
    baselineTableHTML,
  };
}

export default {
  PUBLICATION_COLORS,
  generateKMPlotCode,
  generateForestPlotCode,
  generateFlowChartSVG,
  generateBaselineTableHTML,
  generateAllFiguresCode,
};
