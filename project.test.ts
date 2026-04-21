import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  createProject: vi.fn(),
  getProjectsByUserId: vi.fn(),
  getProjectById: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  getProposalByProjectId: vi.fn(),
  createProposal: vi.fn(),
  updateProposal: vi.fn(),
  getAnalysisCodesByProjectId: vi.fn(),
  createAnalysisCode: vi.fn(),
  getTablesByProjectId: vi.fn(),
  createTable: vi.fn(),
  getFiguresByProjectId: vi.fn(),
  createFigure: vi.fn(),
  getManuscriptByProjectId: vi.fn(),
  createManuscript: vi.fn(),
  updateManuscript: vi.fn(),
  getPubmedReferencesByProjectId: vi.fn(),
  createPubmedReference: vi.fn(),
}));

// Import the mocked module
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Project Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("project.list", () => {
    it("returns projects for authenticated user", async () => {
      const ctx = createAuthContext();
      const mockProjects = [
        {
          id: 1,
          userId: 1,
          title: "Test Project",
          description: "A test project",
          cancerType: "Lung Cancer",
          studyDesign: "cohort",
          status: "draft",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.getProjectsByUserId).mockResolvedValue(mockProjects);

      const caller = appRouter.createCaller(ctx);
      const result = await caller.project.list();

      expect(result).toEqual(mockProjects);
      expect(db.getProjectsByUserId).toHaveBeenCalledWith(1);
    });
  });

  describe("project.create", () => {
    it("creates a new project", async () => {
      const ctx = createAuthContext();
      const mockProject = {
        id: 1,
        userId: 1,
        title: "New Project",
        description: "A new project",
        cancerType: "Breast Cancer",
        studyDesign: "survival",
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.createProject).mockResolvedValue(mockProject);

      const caller = appRouter.createCaller(ctx);
      const result = await caller.project.create({
        title: "New Project",
        description: "A new project",
        cancerType: "Breast Cancer",
        studyDesign: "survival",
      });

      expect(result).toEqual(mockProject);
      expect(db.createProject).toHaveBeenCalledWith({
        userId: 1,
        title: "New Project",
        description: "A new project",
        cancerType: "Breast Cancer",
        studyDesign: "survival",
      });
    });

    it("creates a project with minimal data", async () => {
      const ctx = createAuthContext();
      const mockProject = {
        id: 2,
        userId: 1,
        title: "Minimal Project",
        description: null,
        cancerType: null,
        studyDesign: null,
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.createProject).mockResolvedValue(mockProject);

      const caller = appRouter.createCaller(ctx);
      const result = await caller.project.create({
        title: "Minimal Project",
      });

      expect(result.title).toBe("Minimal Project");
    });
  });

  describe("project.get", () => {
    it("returns a project by id", async () => {
      const ctx = createAuthContext();
      const mockProject = {
        id: 1,
        userId: 1,
        title: "Test Project",
        description: "A test project",
        cancerType: "Lung Cancer",
        studyDesign: "cohort",
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getProjectById).mockResolvedValue(mockProject);

      const caller = appRouter.createCaller(ctx);
      const result = await caller.project.get({ id: 1 });

      expect(result).toEqual(mockProject);
      expect(db.getProjectById).toHaveBeenCalledWith(1, 1);
    });

    it("throws NOT_FOUND for non-existent project", async () => {
      const ctx = createAuthContext();
      vi.mocked(db.getProjectById).mockResolvedValue(undefined);

      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.project.get({ id: 999 })).rejects.toThrow("Project not found");
    });
  });

  describe("project.delete", () => {
    it("deletes a project", async () => {
      const ctx = createAuthContext();
      vi.mocked(db.deleteProject).mockResolvedValue(true);

      const caller = appRouter.createCaller(ctx);
      const result = await caller.project.delete({ id: 1 });

      expect(result).toEqual({ success: true });
      expect(db.deleteProject).toHaveBeenCalledWith(1, 1);
    });

    it("throws NOT_FOUND when delete fails", async () => {
      const ctx = createAuthContext();
      vi.mocked(db.deleteProject).mockResolvedValue(false);

      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.project.delete({ id: 999 })).rejects.toThrow("Project not found");
    });
  });
});

describe("Proposal Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("proposal.get", () => {
    it("returns proposal for a project", async () => {
      const ctx = createAuthContext();
      const mockProject = {
        id: 1,
        userId: 1,
        title: "Test Project",
        description: null,
        cancerType: null,
        studyDesign: null,
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockProposal = {
        id: 1,
        projectId: 1,
        population: "Early stage NSCLC patients",
        intervention: "Adjuvant chemotherapy",
        comparator: "Surgery alone",
        outcome: "Overall survival",
        exposure: null,
        studyDesign: "Retrospective cohort",
        inclusionCriteria: "Stage I-II NSCLC",
        exclusionCriteria: "Prior cancer history",
        primaryOutcome: "OS",
        secondaryOutcomes: "CSS",
        covariates: "Age, sex, stage",
        seerVariableMapping: null,
        statisticalModel: "Cox regression",
        subgroupAnalysis: null,
        sensitivityAnalysis: null,
        methodologicalBlueprint: null,
        potentialBiases: null,
        seerLimitations: null,
        rawProposal: "Test proposal text",
        parsedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getProjectById).mockResolvedValue(mockProject);
      vi.mocked(db.getProposalByProjectId).mockResolvedValue(mockProposal);

      const caller = appRouter.createCaller(ctx);
      const result = await caller.proposal.get({ projectId: 1 });

      expect(result).toEqual(mockProposal);
    });

    it("throws NOT_FOUND for non-existent project", async () => {
      const ctx = createAuthContext();
      vi.mocked(db.getProjectById).mockResolvedValue(undefined);

      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.proposal.get({ projectId: 999 })).rejects.toThrow("Project not found");
    });
  });
});

describe("Analysis Code Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("analysisCode.list", () => {
    it("returns analysis codes for a project", async () => {
      const ctx = createAuthContext();
      const mockProject = {
        id: 1,
        userId: 1,
        title: "Test Project",
        description: null,
        cancerType: null,
        studyDesign: null,
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockCodes = [
        {
          id: 1,
          projectId: 1,
          codeType: "r",
          analysisType: "kaplan_meier",
          code: "library(survival)\n...",
          description: "KM survival analysis",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.getProjectById).mockResolvedValue(mockProject);
      vi.mocked(db.getAnalysisCodesByProjectId).mockResolvedValue(mockCodes);

      const caller = appRouter.createCaller(ctx);
      const result = await caller.analysisCode.list({ projectId: 1 });

      expect(result).toEqual(mockCodes);
    });
  });
});

describe("Table Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("table.list", () => {
    it("returns tables for a project", async () => {
      const ctx = createAuthContext();
      const mockProject = {
        id: 1,
        userId: 1,
        title: "Test Project",
        description: null,
        cancerType: null,
        studyDesign: null,
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockTables = [
        {
          id: 1,
          projectId: 1,
          tableType: "baseline_characteristics",
          title: "Table 1. Baseline Characteristics",
          htmlContent: "<table>...</table>",
          markdownContent: "| Variable | Value |",
          footnotes: "Values are n (%) or mean (SD)",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.getProjectById).mockResolvedValue(mockProject);
      vi.mocked(db.getTablesByProjectId).mockResolvedValue(mockTables);

      const caller = appRouter.createCaller(ctx);
      const result = await caller.table.list({ projectId: 1 });

      expect(result).toEqual(mockTables);
    });
  });
});

describe("Figure Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("figure.list", () => {
    it("returns figures for a project", async () => {
      const ctx = createAuthContext();
      const mockProject = {
        id: 1,
        userId: 1,
        title: "Test Project",
        description: null,
        cancerType: null,
        studyDesign: null,
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockFigures = [
        {
          id: 1,
          projectId: 1,
          figureType: "kaplan_meier",
          title: "Figure 1. Kaplan-Meier Survival Curves",
          rCode: "library(survminer)\n...",
          legend: "Survival curves with 95% CI",
          imageUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.getProjectById).mockResolvedValue(mockProject);
      vi.mocked(db.getFiguresByProjectId).mockResolvedValue(mockFigures);

      const caller = appRouter.createCaller(ctx);
      const result = await caller.figure.list({ projectId: 1 });

      expect(result).toEqual(mockFigures);
    });
  });
});

describe("Manuscript Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("manuscript.get", () => {
    it("returns manuscript for a project", async () => {
      const ctx = createAuthContext();
      const mockProject = {
        id: 1,
        userId: 1,
        title: "Test Project",
        description: null,
        cancerType: null,
        studyDesign: null,
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockManuscript = {
        id: 1,
        projectId: 1,
        title: "Association between...",
        abstractObjective: "To investigate...",
        abstractDesign: "Retrospective cohort study",
        abstractSetting: "SEER database",
        abstractParticipants: "Patients with...",
        abstractMainOutcome: "Overall survival",
        abstractResults: "We found...",
        abstractConclusions: "In conclusion...",
        whatIsKnown: ["Point 1", "Point 2"],
        whatThisAdds: ["Point 1", "Point 2"],
        introduction: "Cancer is...",
        methodsDataSource: "We used SEER...",
        methodsStudyPopulation: null,
        methodsVariables: null,
        methodsStatistical: null,
        results: "A total of...",
        discussionPrincipal: "Our study found...",
        discussionComparison: null,
        discussionStrengths: null,
        discussionLimitations: null,
        discussionConclusions: null,
        fullManuscript: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getProjectById).mockResolvedValue(mockProject);
      vi.mocked(db.getManuscriptByProjectId).mockResolvedValue(mockManuscript);

      const caller = appRouter.createCaller(ctx);
      const result = await caller.manuscript.get({ projectId: 1 });

      expect(result).toEqual(mockManuscript);
    });
  });
});
