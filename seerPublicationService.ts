/**
 * SEER Publication Service
 * Fetches latest SEER research from PubMed, generates summaries, and learns patterns
 */

import { getDb } from "./db";
import { seerPublications, seerResearchPatterns, seerLearningInsights, publicationFetchLogs } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

// PubMed E-utilities base URL
const PUBMED_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

// Search query for SEER-related publications
const SEER_SEARCH_QUERY = "(SEER[Title/Abstract] OR \"Surveillance Epidemiology and End Results\"[Title/Abstract]) AND cancer[Title/Abstract]";

/**
 * Fetch publication details from PubMed
 */
export async function fetchPubMedDetails(pmids: string[]): Promise<any[]> {
  if (pmids.length === 0) return [];
  
  try {
    const url = `${PUBMED_BASE_URL}/efetch.fcgi?db=pubmed&id=${pmids.join(",")}&retmode=xml&rettype=abstract`;
    const response = await fetch(url);
    const xmlText = await response.text();
    
    // Parse XML to extract publication details
    const publications = parsePublicationXML(xmlText);
    return publications;
  } catch (error) {
    console.error("Error fetching PubMed details:", error);
    return [];
  }
}

/**
 * Parse PubMed XML response
 */
function parsePublicationXML(xmlText: string): any[] {
  const publications: any[] = [];
  
  // Simple XML parsing for PubMed articles
  const articleMatches = xmlText.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];
  
  for (const articleXml of articleMatches) {
    try {
      const pmid = extractXMLValue(articleXml, "PMID");
      const title = extractXMLValue(articleXml, "ArticleTitle");
      const abstractText = extractXMLValue(articleXml, "AbstractText") || extractAllAbstractText(articleXml);
      const journal = extractXMLValue(articleXml, "Title");
      const journalAbbrev = extractXMLValue(articleXml, "ISOAbbreviation");
      const year = extractXMLValue(articleXml, "Year");
      const month = extractXMLValue(articleXml, "Month");
      const volume = extractXMLValue(articleXml, "Volume");
      const issue = extractXMLValue(articleXml, "Issue");
      const pages = extractXMLValue(articleXml, "MedlinePgn");
      const doi = extractDOI(articleXml);
      const authors = extractAuthors(articleXml);
      
      if (pmid && title) {
        publications.push({
          pmid,
          title: cleanXMLText(title),
          authors,
          journal: cleanXMLText(journal),
          journalAbbrev: cleanXMLText(journalAbbrev),
          year: year ? parseInt(year) : null,
          month,
          volume,
          issue,
          pages,
          doi,
          abstractText: cleanXMLText(abstractText),
        });
      }
    } catch (error) {
      console.error("Error parsing article:", error);
    }
  }
  
  return publications;
}

function extractXMLValue(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? match[1].trim() : null;
}

function extractAllAbstractText(xml: string): string {
  const matches = xml.match(/<AbstractText[^>]*>[\s\S]*?<\/AbstractText>/gi) || [];
  return matches.map(m => {
    const label = m.match(/Label="([^"]+)"/i)?.[1];
    const text = m.replace(/<[^>]+>/g, "").trim();
    return label ? `${label}: ${text}` : text;
  }).join(" ");
}

function extractDOI(xml: string): string | null {
  const match = xml.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/i);
  return match ? match[1] : null;
}

function extractAuthors(xml: string): string {
  const authorMatches = xml.match(/<Author[^>]*>[\s\S]*?<\/Author>/gi) || [];
  const authors = authorMatches.slice(0, 10).map(authorXml => {
    const lastName = extractXMLValue(authorXml, "LastName") || "";
    const initials = extractXMLValue(authorXml, "Initials") || "";
    return `${lastName} ${initials}`.trim();
  });
  
  if (authorMatches.length > 10) {
    authors.push("et al");
  }
  
  return authors.join(", ");
}

function cleanXMLText(text: string | null): string {
  if (!text) return "";
  return text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Search PubMed for latest SEER publications
 */
export async function searchLatestSEERPublications(maxResults: number = 50): Promise<string[]> {
  try {
    const url = `${PUBMED_BASE_URL}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(SEER_SEARCH_QUERY)}&retmax=${maxResults}&sort=date&retmode=json`;
    const response = await fetch(url);
    const data = await response.json();
    
    return data.esearchresult?.idlist || [];
  } catch (error) {
    console.error("Error searching PubMed:", error);
    return [];
  }
}

/**
 * Generate AI summary for a publication
 */
export async function generatePublicationSummary(publication: any): Promise<{
  summary: string;
  keyFindings: string[];
  cancerType: string;
  studyDesign: string;
  statisticalMethods: string[];
  sampleSize: string;
  methodologyScore: number;
  innovationScore: number;
  clinicalRelevanceScore: number;
}> {
  const prompt = `Analyze this SEER cancer research publication and provide a comprehensive summary.

Title: ${publication.title}
Authors: ${publication.authors}
Journal: ${publication.journal}
Year: ${publication.year}

Abstract:
${publication.abstractText}

Please provide:
1. A 500-word summary in English that covers:
   - Background and research question
   - Study design and methodology
   - Key findings and results
   - Clinical implications and significance
   - Limitations and future directions

2. Extract key information:
   - Cancer type studied
   - Study design (cohort, case-control, survival analysis, etc.)
   - Statistical methods used
   - Sample size
   - 3-5 key findings

3. Score the publication (1-100):
   - Methodology quality
   - Innovation level
   - Clinical relevance

Respond in JSON format.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert oncology researcher analyzing SEER database publications. Provide detailed, accurate analysis in English." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "publication_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: { type: "string", description: "500-word summary in English" },
              keyFindings: { type: "array", items: { type: "string" }, description: "3-5 key findings" },
              cancerType: { type: "string", description: "Cancer type studied" },
              studyDesign: { type: "string", description: "Study design type" },
              statisticalMethods: { type: "array", items: { type: "string" }, description: "Statistical methods used" },
              sampleSize: { type: "string", description: "Sample size" },
              methodologyScore: { type: "integer", description: "Methodology quality score 1-100" },
              innovationScore: { type: "integer", description: "Innovation level score 1-100" },
              clinicalRelevanceScore: { type: "integer", description: "Clinical relevance score 1-100" }
            },
            required: ["summary", "keyFindings", "cancerType", "studyDesign", "statisticalMethods", "sampleSize", "methodologyScore", "innovationScore", "clinicalRelevanceScore"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (content && typeof content === 'string') {
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error generating summary:", error);
  }

  return {
    summary: publication.abstractText || "Summary not available.",
    keyFindings: ["Key findings not available"],
    cancerType: "Various",
    studyDesign: "Observational",
    statisticalMethods: ["Statistical analysis"],
    sampleSize: "Not specified",
    methodologyScore: 70,
    innovationScore: 70,
    clinicalRelevanceScore: 70
  };
}

/**
 * Fetch and store latest SEER publications
 */
export async function fetchAndStoreLatestPublications(maxResults: number = 20): Promise<{
  total: number;
  new: number;
  updated: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const startTime = Date.now();
  let newCount = 0;
  let updatedCount = 0;

  try {
    // Search for latest publications
    const pmids = await searchLatestSEERPublications(maxResults);
    
    if (pmids.length === 0) {
      await db.insert(publicationFetchLogs).values({
        fetchType: "manual",
        query: SEER_SEARCH_QUERY,
        totalResults: 0,
        newPublications: 0,
        updatedPublications: 0,
        status: "success",
        duration: Date.now() - startTime
      });
      return { total: 0, new: 0, updated: 0 };
    }

    // Fetch details for all PMIDs
    const publications = await fetchPubMedDetails(pmids);

    for (const pub of publications) {
      // Check if publication already exists
      const existing = await db.select().from(seerPublications).where(eq(seerPublications.pmid, pub.pmid)).limit(1);

      if (existing.length === 0) {
        // Generate AI summary for new publications
        const analysis = await generatePublicationSummary(pub);

        await db.insert(seerPublications).values({
          pmid: pub.pmid,
          title: pub.title,
          authors: pub.authors,
          journal: pub.journal,
          journalAbbrev: pub.journalAbbrev,
          year: pub.year,
          month: pub.month,
          volume: pub.volume,
          issue: pub.issue,
          pages: pub.pages,
          doi: pub.doi,
          abstractText: pub.abstractText,
          summary: analysis.summary,
          keyFindings: analysis.keyFindings,
          cancerType: analysis.cancerType,
          studyDesign: analysis.studyDesign,
          statisticalMethods: analysis.statisticalMethods,
          sampleSize: analysis.sampleSize,
          methodologyScore: analysis.methodologyScore,
          innovationScore: analysis.innovationScore,
          clinicalRelevanceScore: analysis.clinicalRelevanceScore,
          publishedDate: pub.year ? new Date(pub.year, 0, 1) : null,
          analyzedAt: new Date()
        });
        newCount++;
      } else {
        // Update existing publication if needed
        updatedCount++;
      }
    }

    // Log the fetch
    await db.insert(publicationFetchLogs).values({
      fetchType: "manual",
      query: SEER_SEARCH_QUERY,
      totalResults: publications.length,
      newPublications: newCount,
      updatedPublications: updatedCount,
      status: "success",
      duration: Date.now() - startTime
    });

    return { total: publications.length, new: newCount, updated: updatedCount };
  } catch (error) {
    console.error("Error fetching publications:", error);
    
    await db.insert(publicationFetchLogs).values({
      fetchType: "manual",
      query: SEER_SEARCH_QUERY,
      totalResults: 0,
      newPublications: 0,
      updatedPublications: 0,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime
    });

    throw error;
  }
}

/**
 * Get latest SEER publications for display
 */
export async function getLatestPublications(limit: number = 10): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(seerPublications)
    .orderBy(desc(seerPublications.publishedDate), desc(seerPublications.fetchedAt))
    .limit(limit);
}

/**
 * Get featured publications
 */
export async function getFeaturedPublications(limit: number = 5): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(seerPublications)
    .where(eq(seerPublications.isFeatured, true))
    .orderBy(desc(seerPublications.publishedDate))
    .limit(limit);
}

/**
 * Analyze research patterns from stored publications
 */
export async function analyzeResearchPatterns(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Get all publications for analysis
  const publications = await db.select().from(seerPublications);
  
  if (publications.length < 5) {
    console.log("Not enough publications to analyze patterns");
    return;
  }

  const prompt = `Analyze these ${publications.length} SEER cancer research publications and identify patterns.

Publications summary:
${publications.slice(0, 20).map((p: any) => `- ${p.title} (${p.journal}, ${p.year}) - Cancer: ${p.cancerType}, Design: ${p.studyDesign}`).join("\n")}

Identify:
1. Most common statistical methods used
2. Popular study designs
3. Trending cancer types being studied
4. Common SEER variables utilized
5. Outcome measurement patterns
6. Publication trends (journals, topics)

For each pattern, provide:
- Pattern name
- Description
- Frequency (how common)
- Recommendations for researchers

Respond in JSON format.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert in oncology research methodology, analyzing patterns in SEER database publications." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "research_patterns",
          strict: true,
          schema: {
            type: "object",
            properties: {
              patterns: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    patternType: { type: "string", enum: ["methodology", "study_design", "cancer_type", "variable_usage", "outcome_measure", "publication_trend"] },
                    patternName: { type: "string" },
                    description: { type: "string" },
                    frequency: { type: "integer" },
                    recommendations: { type: "string" },
                    confidence: { type: "integer" }
                  },
                  required: ["patternType", "patternName", "description", "frequency", "recommendations", "confidence"],
                  additionalProperties: false
                }
              }
            },
            required: ["patterns"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (content && typeof content === 'string') {
      const { patterns } = JSON.parse(content);
      
      // Store patterns in database
      for (const pattern of patterns) {
        const existing = await db.select()
          .from(seerResearchPatterns)
          .where(and(
            eq(seerResearchPatterns.patternType, pattern.patternType as any),
            eq(seerResearchPatterns.patternName, pattern.patternName)
          ))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(seerResearchPatterns).values({
            patternType: pattern.patternType as any,
            patternName: pattern.patternName,
            description: pattern.description,
            frequency: pattern.frequency,
            recommendations: pattern.recommendations,
            confidence: pattern.confidence
          });
        } else {
          await db.update(seerResearchPatterns)
            .set({
              frequency: pattern.frequency,
              recommendations: pattern.recommendations,
              confidence: pattern.confidence,
              lastUpdated: new Date()
            })
            .where(eq(seerResearchPatterns.id, existing[0].id));
        }
      }
    }
  } catch (error) {
    console.error("Error analyzing patterns:", error);
  }
}

/**
 * Generate learning insights from publications
 */
export async function generateLearningInsights(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const publications = await db.select().from(seerPublications).limit(30);
  const patterns = await db.select().from(seerResearchPatterns);

  if (publications.length < 5) {
    console.log("Not enough data to generate insights");
    return;
  }

  const prompt = `Based on analysis of ${publications.length} SEER cancer research publications and identified patterns, generate actionable insights for researchers.

Top publications:
${publications.slice(0, 10).map((p: any) => `- ${p.title} (Score: Method ${p.methodologyScore}, Innovation ${p.innovationScore})`).join("\n")}

Identified patterns:
${patterns.map((p: any) => `- ${p.patternName}: ${p.description}`).join("\n")}

Generate 5-8 insights covering:
1. Best practices for SEER research
2. Common pitfalls to avoid
3. Emerging trends in methodology
4. Journal preferences for different topics
5. Tips for improving publication success

Each insight should be actionable and evidence-based.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert mentor helping researchers publish SEER-based cancer studies in top journals." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "learning_insights",
          strict: true,
          schema: {
            type: "object",
            properties: {
              insights: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    insightType: { type: "string", enum: ["best_practice", "common_pitfall", "emerging_trend", "method_comparison", "journal_preference"] },
                    title: { type: "string" },
                    content: { type: "string" },
                    applicableCancerTypes: { type: "array", items: { type: "string" } },
                    applicableStudyDesigns: { type: "array", items: { type: "string" } },
                    priority: { type: "string", enum: ["low", "medium", "high"] }
                  },
                  required: ["insightType", "title", "content", "applicableCancerTypes", "applicableStudyDesigns", "priority"],
                  additionalProperties: false
                }
              }
            },
            required: ["insights"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (content && typeof content === 'string') {
      const { insights } = JSON.parse(content);
      
      for (const insight of insights) {
        await db.insert(seerLearningInsights).values({
          insightType: insight.insightType as any,
          title: insight.title,
          content: insight.content,
          applicableCancerTypes: insight.applicableCancerTypes,
          applicableStudyDesigns: insight.applicableStudyDesigns,
          priority: insight.priority as any
        });
      }
    }
  } catch (error) {
    console.error("Error generating insights:", error);
  }
}

/**
 * Get research patterns
 */
export async function getResearchPatterns(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(seerResearchPatterns)
    .orderBy(desc(seerResearchPatterns.frequency));
}

/**
 * Get learning insights
 */
export async function getLearningInsights(limit: number = 10): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(seerLearningInsights)
    .where(eq(seerLearningInsights.isActive, true))
    .orderBy(desc(seerLearningInsights.priority), desc(seerLearningInsights.createdAt))
    .limit(limit);
}

/**
 * Get publication statistics
 */
export async function getPublicationStats(): Promise<{
  totalPublications: number;
  thisMonth: number;
  topCancerTypes: { type: string; count: number }[];
  topJournals: { journal: string; count: number }[];
  avgScores: { methodology: number; innovation: number; clinicalRelevance: number };
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalPublications: 0,
      thisMonth: 0,
      topCancerTypes: [],
      topJournals: [],
      avgScores: { methodology: 0, innovation: 0, clinicalRelevance: 0 }
    };
  }
  
  const allPubs = await db.select().from(seerPublications);
  
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const thisMonthPubs = allPubs.filter((p: any) => p.fetchedAt >= monthStart);
  
  // Count cancer types
  const cancerTypeCounts: Record<string, number> = {};
  allPubs.forEach((p: any) => {
    if (p.cancerType) {
      cancerTypeCounts[p.cancerType] = (cancerTypeCounts[p.cancerType] || 0) + 1;
    }
  });
  
  // Count journals
  const journalCounts: Record<string, number> = {};
  allPubs.forEach((p: any) => {
    if (p.journal) {
      journalCounts[p.journal] = (journalCounts[p.journal] || 0) + 1;
    }
  });
  
  // Calculate average scores
  const avgMethodology = allPubs.reduce((sum: number, p: any) => sum + (p.methodologyScore || 0), 0) / (allPubs.length || 1);
  const avgInnovation = allPubs.reduce((sum: number, p: any) => sum + (p.innovationScore || 0), 0) / (allPubs.length || 1);
  const avgClinical = allPubs.reduce((sum: number, p: any) => sum + (p.clinicalRelevanceScore || 0), 0) / (allPubs.length || 1);
  
  return {
    totalPublications: allPubs.length,
    thisMonth: thisMonthPubs.length,
    topCancerTypes: Object.entries(cancerTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count })),
    topJournals: Object.entries(journalCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([journal, count]) => ({ journal, count })),
    avgScores: {
      methodology: Math.round(avgMethodology),
      innovation: Math.round(avgInnovation),
      clinicalRelevance: Math.round(avgClinical)
    }
  };
}
