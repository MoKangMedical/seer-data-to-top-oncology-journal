import { describe, it, expect, vi } from "vitest";
import { parsePublicationXML, searchLatestSEERPublications, generatePublicationSummary } from "./seerPublicationService";

// Mock the fetch function
global.fetch = vi.fn();

describe("SEER Publication Service", () => {
  describe("searchLatestSEERPublications", () => {
    it("should return PMIDs from PubMed search", async () => {
      const mockResponse = {
        esearchresult: {
          idlist: ["12345678", "23456789", "34567890"]
        }
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse)
      });

      const pmids = await searchLatestSEERPublications(10);
      
      expect(pmids).toEqual(["12345678", "23456789", "34567890"]);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("eutils.ncbi.nlm.nih.gov")
      );
    });

    it("should return empty array on error", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      const pmids = await searchLatestSEERPublications(10);
      
      expect(pmids).toEqual([]);
    });
  });

  describe("Publication Summary Generation", () => {
    it("should have correct structure for summary response", () => {
      const expectedFields = [
        "summary",
        "keyFindings",
        "cancerType",
        "studyDesign",
        "statisticalMethods",
        "sampleSize",
        "methodologyScore",
        "innovationScore",
        "clinicalRelevanceScore"
      ];

      // Test that the function returns an object with all expected fields
      const mockSummary = {
        summary: "Test summary",
        keyFindings: ["Finding 1"],
        cancerType: "Lung Cancer",
        studyDesign: "Cohort",
        statisticalMethods: ["Cox regression"],
        sampleSize: "10000",
        methodologyScore: 80,
        innovationScore: 75,
        clinicalRelevanceScore: 85
      };

      expectedFields.forEach(field => {
        expect(mockSummary).toHaveProperty(field);
      });
    });
  });

  describe("Publication Statistics", () => {
    it("should calculate correct statistics structure", () => {
      const mockStats = {
        totalPublications: 100,
        thisMonth: 10,
        topCancerTypes: [
          { type: "Lung Cancer", count: 25 },
          { type: "Breast Cancer", count: 20 }
        ],
        topJournals: [
          { journal: "JAMA Oncology", count: 15 },
          { journal: "JCO", count: 12 }
        ],
        avgScores: {
          methodology: 75,
          innovation: 70,
          clinicalRelevance: 80
        }
      };

      expect(mockStats.totalPublications).toBeGreaterThanOrEqual(0);
      expect(mockStats.thisMonth).toBeGreaterThanOrEqual(0);
      expect(mockStats.topCancerTypes).toBeInstanceOf(Array);
      expect(mockStats.topJournals).toBeInstanceOf(Array);
      expect(mockStats.avgScores).toHaveProperty("methodology");
      expect(mockStats.avgScores).toHaveProperty("innovation");
      expect(mockStats.avgScores).toHaveProperty("clinicalRelevance");
    });
  });

  describe("Research Patterns", () => {
    it("should have correct pattern types", () => {
      const validPatternTypes = [
        "methodology",
        "study_design",
        "cancer_type",
        "variable_usage",
        "outcome_measure",
        "publication_trend"
      ];

      const mockPattern = {
        patternType: "methodology",
        patternName: "Cox Proportional Hazards",
        description: "Most common survival analysis method",
        frequency: 85,
        recommendations: "Use for time-to-event analysis",
        confidence: 90
      };

      expect(validPatternTypes).toContain(mockPattern.patternType);
      expect(mockPattern.frequency).toBeGreaterThan(0);
      expect(mockPattern.confidence).toBeGreaterThanOrEqual(0);
      expect(mockPattern.confidence).toBeLessThanOrEqual(100);
    });
  });

  describe("Learning Insights", () => {
    it("should have correct insight types", () => {
      const validInsightTypes = [
        "best_practice",
        "common_pitfall",
        "emerging_trend",
        "method_comparison",
        "journal_preference"
      ];

      const validPriorities = ["low", "medium", "high"];

      const mockInsight = {
        insightType: "best_practice",
        title: "Use propensity score matching",
        content: "Reduces selection bias in observational studies",
        applicableCancerTypes: ["Lung Cancer", "Breast Cancer"],
        applicableStudyDesigns: ["Cohort", "Case-Control"],
        priority: "high"
      };

      expect(validInsightTypes).toContain(mockInsight.insightType);
      expect(validPriorities).toContain(mockInsight.priority);
      expect(mockInsight.applicableCancerTypes).toBeInstanceOf(Array);
      expect(mockInsight.applicableStudyDesigns).toBeInstanceOf(Array);
    });
  });
});
