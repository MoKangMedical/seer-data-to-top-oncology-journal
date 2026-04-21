// Data Parser for SEER Research Data
// Handles CSV and Excel file parsing with real statistical analysis

import * as XLSX from 'xlsx';

export interface DataColumn {
  name: string;
  type: 'numeric' | 'categorical' | 'date' | 'text';
  missing: number;
  unique: number;
  values?: (string | number)[];
  stats?: {
    mean?: number;
    median?: number;
    std?: number;
    min?: number;
    max?: number;
    q1?: number;
    q3?: number;
    frequencies?: Record<string, number>;
  };
}

export interface ParsedData {
  totalRows: number;
  totalColumns: number;
  columnNames: string[];
  columns: DataColumn[];
  rawData: Record<string, unknown>[];
  preview: Record<string, unknown>[];
}

export interface BaselineStats {
  variable: string;
  overall: string;
  group1: string;
  group2: string;
  pValue: string;
}

export interface SurvivalData {
  time: number;
  event: number;
  group?: string;
}

// Parse CSV content
export function parseCSV(content: string): ParsedData {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rawData: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row: Record<string, unknown> = {};
      headers.forEach((h, idx) => {
        row[h] = parseValue(values[idx]);
      });
      rawData.push(row);
    }
  }

  return analyzeData(headers, rawData);
}

// Parse a single CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Parse Excel content from buffer
export function parseExcel(buffer: Buffer): ParsedData {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

  if (jsonData.length < 2) {
    throw new Error('Excel file must have at least a header row and one data row');
  }

  const headers = (jsonData[0] as string[]).map(h => String(h).trim());
  const rawData: Record<string, unknown>[] = [];

  for (let i = 1; i < jsonData.length; i++) {
    const row: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      row[h] = parseValue(jsonData[i][idx]);
    });
    rawData.push(row);
  }

  return analyzeData(headers, rawData);
}

// Parse value to appropriate type
function parseValue(value: unknown): unknown {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const strValue = String(value).trim();
  if (strValue === '' || strValue.toLowerCase() === 'na' || strValue.toLowerCase() === 'n/a') {
    return null;
  }
  const numValue = Number(strValue);
  if (!isNaN(numValue)) {
    return numValue;
  }
  return strValue;
}

// Analyze data and compute statistics
function analyzeData(headers: string[], rawData: Record<string, unknown>[]): ParsedData {
  const columns: DataColumn[] = headers.map(name => {
    const values = rawData.map(row => row[name]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined);
    const missing = values.length - nonNullValues.length;
    const uniqueValues = Array.from(new Set(nonNullValues));

    // Determine type
    const numericValues = nonNullValues.filter(v => typeof v === 'number') as number[];
    const isNumeric = numericValues.length > nonNullValues.length * 0.8;

    const column: DataColumn = {
      name,
      type: isNumeric ? 'numeric' : 'categorical',
      missing,
      unique: uniqueValues.length,
    };

    if (isNumeric && numericValues.length > 0) {
      const sorted = numericValues.sort((a, b) => a - b);
      const sum = numericValues.reduce((a, b) => a + b, 0);
      const mean = sum / numericValues.length;
      const variance = numericValues.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / numericValues.length;

      column.stats = {
        mean: Math.round(mean * 100) / 100,
        median: sorted[Math.floor(sorted.length / 2)],
        std: Math.round(Math.sqrt(variance) * 100) / 100,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        q1: sorted[Math.floor(sorted.length * 0.25)],
        q3: sorted[Math.floor(sorted.length * 0.75)],
      };
    } else if (!isNumeric) {
      // Compute frequencies for categorical variables
      const frequencies: Record<string, number> = {};
      nonNullValues.forEach(v => {
        const key = String(v);
        frequencies[key] = (frequencies[key] || 0) + 1;
      });
      column.stats = { frequencies };
      column.values = uniqueValues.slice(0, 20).map(v => String(v)); // Store up to 20 unique values
    }

    return column;
  });

  return {
    totalRows: rawData.length,
    totalColumns: headers.length,
    columnNames: headers,
    columns,
    rawData,
    preview: rawData.slice(0, 10),
  };
}

// Generate baseline characteristics table from parsed data
export function generateBaselineTable(
  data: ParsedData,
  groupColumn: string,
  variables: string[]
): { markdown: string; html: string; stats: BaselineStats[] } {
  const groupValues = Array.from(new Set(data.rawData.map(r => r[groupColumn]))).filter(v => v !== null);
  if (groupValues.length !== 2) {
    throw new Error('Group column must have exactly 2 unique values for comparison');
  }

  const group1Data = data.rawData.filter(r => r[groupColumn] === groupValues[0]);
  const group2Data = data.rawData.filter(r => r[groupColumn] === groupValues[1]);

  const stats: BaselineStats[] = [];

  // Total N row
  stats.push({
    variable: 'N',
    overall: String(data.totalRows),
    group1: String(group1Data.length),
    group2: String(group2Data.length),
    pValue: '-',
  });

  for (const varName of variables) {
    const column = data.columns.find(c => c.name === varName);
    if (!column) continue;

    if (column.type === 'numeric') {
      // Continuous variable - report mean (SD) or median (IQR)
      const allValues = data.rawData.map(r => r[varName]).filter(v => typeof v === 'number') as number[];
      const g1Values = group1Data.map(r => r[varName]).filter(v => typeof v === 'number') as number[];
      const g2Values = group2Data.map(r => r[varName]).filter(v => typeof v === 'number') as number[];

      const formatMeanSD = (values: number[]) => {
        if (values.length === 0) return '-';
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const std = Math.sqrt(values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length);
        return `${mean.toFixed(1)} (${std.toFixed(1)})`;
      };

      // Simple t-test approximation for p-value
      const pValue = calculateTTestPValue(g1Values, g2Values);

      stats.push({
        variable: `${varName}, mean (SD)`,
        overall: formatMeanSD(allValues),
        group1: formatMeanSD(g1Values),
        group2: formatMeanSD(g2Values),
        pValue: pValue < 0.001 ? '<0.001' : pValue.toFixed(3),
      });
    } else {
      // Categorical variable - report n (%)
      const frequencies = column.stats?.frequencies || {};
      const categories = Object.keys(frequencies).slice(0, 10); // Limit to 10 categories

      stats.push({
        variable: varName,
        overall: '',
        group1: '',
        group2: '',
        pValue: '',
      });

      for (const cat of categories) {
        const allCount = data.rawData.filter(r => r[varName] === cat).length;
        const g1Count = group1Data.filter(r => r[varName] === cat).length;
        const g2Count = group2Data.filter(r => r[varName] === cat).length;

        const formatPercent = (count: number, total: number) => {
          if (total === 0) return '-';
          return `${count} (${((count / total) * 100).toFixed(1)}%)`;
        };

        // Chi-square test approximation
        const pValue = calculateChiSquarePValue(g1Count, group1Data.length - g1Count, g2Count, group2Data.length - g2Count);

        stats.push({
          variable: `  ${cat}`,
          overall: formatPercent(allCount, data.totalRows),
          group1: formatPercent(g1Count, group1Data.length),
          group2: formatPercent(g2Count, group2Data.length),
          pValue: pValue < 0.001 ? '<0.001' : pValue.toFixed(3),
        });
      }
    }
  }

  // Generate markdown table
  const markdown = generateMarkdownTable(stats, groupValues as string[]);
  const html = generateHTMLTable(stats, groupValues as string[]);

  return { markdown, html, stats };
}

function generateMarkdownTable(stats: BaselineStats[], groupValues: string[]): string {
  let md = `| Characteristic | Overall | ${groupValues[0]} | ${groupValues[1]} | P value |\n`;
  md += `|:---|:---:|:---:|:---:|:---:|\n`;

  for (const row of stats) {
    md += `| ${row.variable} | ${row.overall} | ${row.group1} | ${row.group2} | ${row.pValue} |\n`;
  }

  return md;
}

function generateHTMLTable(stats: BaselineStats[], groupValues: string[]): string {
  let html = `<table class="baseline-table">
<thead>
<tr>
<th>Characteristic</th>
<th>Overall</th>
<th>${groupValues[0]}</th>
<th>${groupValues[1]}</th>
<th>P value</th>
</tr>
</thead>
<tbody>`;

  for (const row of stats) {
    html += `
<tr>
<td>${row.variable}</td>
<td>${row.overall}</td>
<td>${row.group1}</td>
<td>${row.group2}</td>
<td>${row.pValue}</td>
</tr>`;
  }

  html += `
</tbody>
</table>`;

  return html;
}

// Simple t-test p-value calculation
function calculateTTestPValue(group1: number[], group2: number[]): number {
  if (group1.length < 2 || group2.length < 2) return 1;

  const mean1 = group1.reduce((a, b) => a + b, 0) / group1.length;
  const mean2 = group2.reduce((a, b) => a + b, 0) / group2.length;
  const var1 = group1.reduce((acc, v) => acc + Math.pow(v - mean1, 2), 0) / (group1.length - 1);
  const var2 = group2.reduce((acc, v) => acc + Math.pow(v - mean2, 2), 0) / (group2.length - 1);

  const pooledSE = Math.sqrt(var1 / group1.length + var2 / group2.length);
  if (pooledSE === 0) return 1;

  const t = Math.abs(mean1 - mean2) / pooledSE;
  const df = group1.length + group2.length - 2;

  // Approximate p-value using normal distribution for large samples
  return 2 * (1 - normalCDF(t));
}

// Simple chi-square p-value calculation
function calculateChiSquarePValue(a: number, b: number, c: number, d: number): number {
  const total = a + b + c + d;
  if (total === 0) return 1;

  const row1 = a + b;
  const row2 = c + d;
  const col1 = a + c;
  const col2 = b + d;

  const expected = [
    (row1 * col1) / total,
    (row1 * col2) / total,
    (row2 * col1) / total,
    (row2 * col2) / total,
  ];

  const observed = [a, b, c, d];
  let chiSquare = 0;

  for (let i = 0; i < 4; i++) {
    if (expected[i] > 0) {
      chiSquare += Math.pow(observed[i] - expected[i], 2) / expected[i];
    }
  }

  // Approximate p-value for chi-square with df=1
  return 1 - chiSquareCDF(chiSquare, 1);
}

// Normal CDF approximation
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

// Chi-square CDF approximation
function chiSquareCDF(x: number, df: number): number {
  if (x <= 0) return 0;
  // Using Wilson-Hilferty approximation
  const z = Math.pow(x / df, 1 / 3) - (1 - 2 / (9 * df));
  const se = Math.sqrt(2 / (9 * df));
  return normalCDF(z / se);
}

// Generate flow chart data
export function generateFlowChartData(
  totalRecords: number,
  exclusionSteps: { reason: string; excluded: number }[]
): { mermaidCode: string; finalN: number } {
  let remaining = totalRecords;
  let mermaidCode = `flowchart TD
    A[SEER Database<br/>Total Records: ${totalRecords.toLocaleString()}] --> B{Inclusion Criteria}`;

  let nodeId = 'C';
  for (let i = 0; i < exclusionSteps.length; i++) {
    const step = exclusionSteps[i];
    const prevNode = i === 0 ? 'B' : String.fromCharCode(65 + i + 1);
    const currNode = String.fromCharCode(65 + i + 2);
    const excludeNode = `E${i + 1}`;

    remaining -= step.excluded;

    mermaidCode += `
    ${prevNode} --> ${excludeNode}[Excluded: ${step.excluded.toLocaleString()}<br/>${step.reason}]
    ${prevNode} --> ${currNode}[Remaining: ${remaining.toLocaleString()}]`;
  }

  mermaidCode += `
    ${String.fromCharCode(65 + exclusionSteps.length + 1)} --> F[Final Cohort<br/>N = ${remaining.toLocaleString()}]`;

  return { mermaidCode, finalN: remaining };
}

// Kaplan-Meier survival analysis
export function calculateKaplanMeier(
  survivalData: SurvivalData[]
): { times: number[]; survival: number[]; atRisk: number[]; events: number[] } {
  // Sort by time
  const sorted = [...survivalData].sort((a, b) => a.time - b.time);

  const times: number[] = [0];
  const survival: number[] = [1];
  const atRisk: number[] = [sorted.length];
  const events: number[] = [0];

  let currentSurvival = 1;
  let currentAtRisk = sorted.length;
  let i = 0;

  while (i < sorted.length) {
    const currentTime = sorted[i].time;
    let eventsAtTime = 0;
    let censoredAtTime = 0;

    // Count events and censored at this time
    while (i < sorted.length && sorted[i].time === currentTime) {
      if (sorted[i].event === 1) {
        eventsAtTime++;
      } else {
        censoredAtTime++;
      }
      i++;
    }

    if (eventsAtTime > 0) {
      currentSurvival *= (currentAtRisk - eventsAtTime) / currentAtRisk;
      times.push(currentTime);
      survival.push(currentSurvival);
      atRisk.push(currentAtRisk);
      events.push(eventsAtTime);
    }

    currentAtRisk -= (eventsAtTime + censoredAtTime);
  }

  return { times, survival, atRisk, events };
}

// Generate R code for Kaplan-Meier plot
export function generateKMRCode(
  timeVar: string,
  eventVar: string,
  groupVar?: string
): string {
  let code = `# Kaplan-Meier Survival Analysis
library(survival)
library(survminer)

# Create survival object
surv_obj <- Surv(time = data$${timeVar}, event = data$${eventVar})

`;

  if (groupVar) {
    code += `# Fit survival curves by group
fit <- survfit(surv_obj ~ ${groupVar}, data = data)

# Create Kaplan-Meier plot
p <- ggsurvplot(
  fit,
  data = data,
  pval = TRUE,
  conf.int = TRUE,
  risk.table = TRUE,
  risk.table.col = "strata",
  linetype = "strata",
  surv.median.line = "hv",
  ggtheme = theme_bw(),
  palette = c("#003366", "#CC0000"),
  xlab = "Time (months)",
  ylab = "Survival Probability",
  legend.title = "${groupVar}",
  legend.labs = levels(factor(data$${groupVar})),
  font.main = c(14, "bold"),
  font.x = c(12, "plain"),
  font.y = c(12, "plain"),
  font.tickslab = c(10, "plain")
)

# Print plot
print(p)

# Log-rank test
survdiff(surv_obj ~ ${groupVar}, data = data)
`;
  } else {
    code += `# Fit overall survival curve
fit <- survfit(surv_obj ~ 1, data = data)

# Create Kaplan-Meier plot
p <- ggsurvplot(
  fit,
  data = data,
  conf.int = TRUE,
  risk.table = TRUE,
  surv.median.line = "hv",
  ggtheme = theme_bw(),
  palette = "#003366",
  xlab = "Time (months)",
  ylab = "Survival Probability",
  font.main = c(14, "bold"),
  font.x = c(12, "plain"),
  font.y = c(12, "plain"),
  font.tickslab = c(10, "plain")
)

# Print plot
print(p)
`;
  }

  return code;
}

// Generate R code for Cox regression
export function generateCoxRCode(
  timeVar: string,
  eventVar: string,
  covariates: string[]
): string {
  const covarStr = covariates.join(' + ');

  return `# Cox Proportional Hazards Regression
library(survival)
library(forestplot)

# Fit Cox model
cox_model <- coxph(Surv(${timeVar}, ${eventVar}) ~ ${covarStr}, data = data)

# Model summary
summary(cox_model)

# Check proportional hazards assumption
cox.zph(cox_model)

# Forest plot for hazard ratios
hr <- exp(coef(cox_model))
ci <- exp(confint(cox_model))

forest_data <- data.frame(
  Variable = names(hr),
  HR = hr,
  Lower = ci[, 1],
  Upper = ci[, 2]
)

# Create forest plot
forestplot(
  labeltext = forest_data$Variable,
  mean = forest_data$HR,
  lower = forest_data$Lower,
  upper = forest_data$Upper,
  zero = 1,
  xlog = TRUE,
  col = fpColors(box = "#003366", line = "#003366"),
  txt_gp = fpTxtGp(label = gpar(fontsize = 10)),
  title = "Hazard Ratios with 95% CI"
)
`;
}

export default {
  parseCSV,
  parseExcel,
  generateBaselineTable,
  generateFlowChartData,
  calculateKaplanMeier,
  generateKMRCode,
  generateCoxRCode,
};
