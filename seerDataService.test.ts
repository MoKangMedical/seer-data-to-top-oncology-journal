import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  SEER_VARIABLES,
  SEER_CANCER_TYPES,
  STUDY_DESIGNS,
  parseResearchProposal,
  fetchSEERData,
  analyzeSEERData,
  generateAnalysisReport,
  type ParsedResearchProposal,
  type SEERDataFetchResult,
} from "./seerDataService";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { invokeLLM } from "./_core/llm";

describe("SEER Data Service", () => {
  describe("Constants and Data Structures", () => {
    it("should have valid SEER_VARIABLES structure", () => {
      expect(SEER_VARIABLES).toBeDefined();
      expect(SEER_VARIABLES.demographics).toBeDefined();
      expect(SEER_VARIABLES.tumor).toBeDefined();
      expect(SEER_VARIABLES.treatment).toBeDefined();
      expect(SEER_VARIABLES.outcome).toBeDefined();
    });

    it("should have valid SEER_CANCER_TYPES", () => {
      expect(SEER_CANCER_TYPES).toBeDefined();
      expect(SEER_CANCER_TYPES.length).toBeGreaterThan(0);
      
      // Check structure of first cancer type
      const firstCancer = SEER_CANCER_TYPES[0];
      expect(firstCancer).toHaveProperty("code");
      expect(firstCancer).toHaveProperty("name");
      expect(firstCancer).toHaveProperty("chineseName");
    });

    it("should have valid STUDY_DESIGNS", () => {
      expect(STUDY_DESIGNS).toBeDefined();
      expect(STUDY_DESIGNS.cohort).toBeDefined();
      expect(STUDY_DESIGNS.case_control).toBeDefined();
      expect(STUDY_DESIGNS.survival).toBeDefined();
      expect(STUDY_DESIGNS.competing_risk).toBeDefined();
      
      // Check structure
      expect(STUDY_DESIGNS.cohort).toHaveProperty("name");
      expect(STUDY_DESIGNS.cohort).toHaveProperty("chineseName");
      expect(STUDY_DESIGNS.cohort).toHaveProperty("analysisTypes");
    });
  });

  describe("parseResearchProposal", () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("should parse a valid research proposal", async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              cancerType: "Breast Cancer",
              cancerCode: "C50",
              studyDesign: "survival",
              population: {
                ageRange: { min: 18, max: 80 },
                sex: "Female",
                race: null,
                yearRange: { start: 2010, end: 2020 },
                stage: null,
              },
              exposureVariables: ["stage", "grade"],
              outcomeVariables: ["overall_survival"],
              covariates: ["age", "race"],
              researchQuestions: ["What factors affect breast cancer survival?"],
              hypotheses: ["Advanced stage is associated with worse survival"],
            }),
          },
        }],
      };

      (invokeLLM as any).mockResolvedValue(mockResponse);

      const proposal = "研究乳腺癌患者的生存预后因素";
      const result = await parseResearchProposal(proposal);

      expect(result).toBeDefined();
      expect(result.cancerType).toBe("Breast Cancer");
      expect(result.cancerCode).toBe("C50");
      expect(result.studyDesign).toBe("survival");
      expect(result.population.ageRange).toEqual({ min: 18, max: 80 });
    });

    it("should throw error when LLM returns no content", async () => {
      (invokeLLM as any).mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      await expect(parseResearchProposal("test")).rejects.toThrow("Failed to parse research proposal");
    });
  });

  describe("fetchSEERData", () => {
    it("should fetch data based on parsed proposal", async () => {
      const params: ParsedResearchProposal = {
        cancerType: "Breast Cancer",
        cancerCode: "C50",
        studyDesign: "survival",
        population: {
          ageRange: { min: 18, max: 80 },
          sex: "Female",
          race: null,
          yearRange: { start: 2010, end: 2020 },
          stage: null,
        },
        exposureVariables: ["stage", "grade"],
        outcomeVariables: ["overall_survival"],
        covariates: ["age", "race"],
        researchQuestions: ["What factors affect breast cancer survival?"],
        hypotheses: ["Advanced stage is associated with worse survival"],
      };

      const result = await fetchSEERData(params);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.totalRecords).toBeGreaterThan(0);
      expect(result.variables).toBeDefined();
      expect(result.variables.length).toBeGreaterThan(0);
      expect(result.summary).toBeDefined();
      expect(result.summary.demographics).toBeDefined();
      expect(result.summary.tumorCharacteristics).toBeDefined();
      expect(result.summary.outcomes).toBeDefined();
      expect(result.sampleData).toBeDefined();
      expect(result.sampleData.length).toBe(10);
      expect(result.dataDescription).toBeDefined();
    });

    it("should apply population filters correctly", async () => {
      const paramsWithFilters: ParsedResearchProposal = {
        cancerType: "Lung Cancer",
        cancerCode: "C34",
        studyDesign: "cohort",
        population: {
          ageRange: { min: 50, max: 70 },
          sex: "Male",
          race: ["White", "Black"],
          yearRange: { start: 2015, end: 2020 },
          stage: ["Localized", "Regional"],
        },
        exposureVariables: ["treatment"],
        outcomeVariables: ["survival"],
        covariates: ["age"],
        researchQuestions: ["Test question"],
        hypotheses: ["Test hypothesis"],
      };

      const result = await fetchSEERData(paramsWithFilters);

      expect(result.success).toBe(true);
      // With more restrictive filters, sample size should be smaller
      expect(result.totalRecords).toBeGreaterThan(0);
    });
  });

  describe("analyzeSEERData", () => {
    it("should perform analysis on fetched data", async () => {
      const params: ParsedResearchProposal = {
        cancerType: "Breast Cancer",
        cancerCode: "C50",
        studyDesign: "survival",
        population: {
          ageRange: null,
          sex: null,
          race: null,
          yearRange: null,
          stage: null,
        },
        exposureVariables: ["stage"],
        outcomeVariables: ["survival"],
        covariates: ["age"],
        researchQuestions: ["Test"],
        hypotheses: ["Test"],
      };

      const data: SEERDataFetchResult = {
        success: true,
        totalRecords: 10000,
        variables: ["age", "stage", "survival"],
        summary: {
          demographics: {
            n: 10000,
            ageAtDiagnosis: { mean: 62, median: 64, sd: 12, range: { min: 18, max: 95 } },
            sex: { Male: 4800, Female: 5200 },
            race: { White: 7200, Black: 1200, "Asian/Pacific Islander": 800, Hispanic: 600, Other: 200 },
          },
          tumorCharacteristics: {
            stage: { Localized: 4500, Regional: 3000, Distant: 2000, Unknown: 500 },
            grade: { "Well differentiated": 1500, "Moderately differentiated": 3500, "Poorly differentiated": 3000, Undifferentiated: 1000, Unknown: 1000 },
          },
          outcomes: {
            vitalStatus: { Alive: 5500, Dead: 4500 },
            survivalMonths: { median: 48, mean: 56.2, range: { min: 0, max: 240 } },
            fiveYearSurvival: 0.65,
            tenYearSurvival: 0.52,
          },
        },
        sampleData: [],
        dataDescription: "Test data description",
      };

      const results = await analyzeSEERData(params, data);

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      
      // Check descriptive analysis
      const descriptive = results.find(r => r.analysisType.includes("描述性分析"));
      expect(descriptive).toBeDefined();
      expect(descriptive?.rCode).toBeDefined();
      expect(descriptive?.stataCode).toBeDefined();
      expect(descriptive?.interpretation).toBeDefined();

      // Check survival analysis
      const survival = results.find(r => r.analysisType.includes("生存分析"));
      expect(survival).toBeDefined();
      expect(survival?.results.survival).toBeDefined();
      expect(survival?.results.survival.medianSurvival).toBeDefined();
      expect(survival?.results.survival.survivalRates).toBeDefined();
    });
  });

  describe("generateAnalysisReport", () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("should generate a report from analysis results", async () => {
      const mockReportContent = `# 研究报告

## 研究背景
本研究旨在探讨乳腺癌患者的生存预后因素。

## 研究方法
采用回顾性队列研究设计。

## 结果
共纳入10,000例患者。

## 讨论
本研究发现...

## 结论
晚期分期与较差的预后相关。`;

      (invokeLLM as any).mockResolvedValue({
        choices: [{ message: { content: mockReportContent } }],
      });

      const params: ParsedResearchProposal = {
        cancerType: "Breast Cancer",
        cancerCode: "C50",
        studyDesign: "survival",
        population: {
          ageRange: null,
          sex: null,
          race: null,
          yearRange: null,
          stage: null,
        },
        exposureVariables: ["stage"],
        outcomeVariables: ["survival"],
        covariates: ["age"],
        researchQuestions: ["Test"],
        hypotheses: ["Test"],
      };

      const data: SEERDataFetchResult = {
        success: true,
        totalRecords: 10000,
        variables: ["age", "stage", "survival"],
        summary: {
          demographics: { n: 10000, ageAtDiagnosis: { mean: 62, median: 64, sd: 12, range: { min: 18, max: 95 } }, sex: {}, race: {} },
          tumorCharacteristics: { stage: {}, grade: {} },
          outcomes: { vitalStatus: {}, survivalMonths: { median: 48, mean: 56, range: { min: 0, max: 240 } }, fiveYearSurvival: 0.65, tenYearSurvival: 0.52 },
        },
        sampleData: [],
        dataDescription: "Test",
      };

      const analyses = [
        {
          analysisType: "描述性分析",
          results: { descriptive: { n: 10000 } },
          interpretation: "Test interpretation",
          rCode: "# R code",
          stataCode: "* Stata code",
        },
      ];

      const report = await generateAnalysisReport(params, data, analyses);

      expect(report).toBeDefined();
      expect(report).toContain("研究报告");
      expect(invokeLLM).toHaveBeenCalled();
    });

    it("should return error message when LLM fails", async () => {
      (invokeLLM as any).mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      const params: ParsedResearchProposal = {
        cancerType: "Test",
        cancerCode: "C00",
        studyDesign: "cohort",
        population: { ageRange: null, sex: null, race: null, yearRange: null, stage: null },
        exposureVariables: [],
        outcomeVariables: [],
        covariates: [],
        researchQuestions: [],
        hypotheses: [],
      };

      const data: SEERDataFetchResult = {
        success: true,
        totalRecords: 100,
        variables: [],
        summary: { demographics: {}, tumorCharacteristics: {}, outcomes: {} },
        sampleData: [],
        dataDescription: "",
      };

      const report = await generateAnalysisReport(params, data, []);

      expect(report).toBe("报告生成失败");
    });
  });
});
