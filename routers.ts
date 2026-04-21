import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { parseCSV, parseExcel, generateBaselineTable, generateFlowChartData, generateKMRCode, generateCoxRCode } from "./dataParser";
import { generateJAMAManuscript, formatJAMAToMarkdown, formatJAMAToHTML } from "./jamaGenerator";
import { generateAllReferences, exportToRIS, exportToENW, exportToBibTeX, formatReferenceList, REFERENCE_TARGETS } from "./pubmedService";
import { storageGet, storagePut } from "./storage";
import { TOP_ONCOLOGY_JOURNALS, generateCoverLetter, formatJournalListMarkdown, formatJournalListHTML, generateSubmissionChecklist } from "./submissionService";
import { generateKMPlotCode, generateForestPlotCode, generateFlowChartSVG, generateBaselineTableHTML, generateAllFiguresCode } from "./chartGenerator";
import { generateTemplateManuscript, type FullManuscriptParams } from "./fullManuscriptGenerator";
import { INTRODUCTION_REFERENCES, METHODS_REFERENCES, DISCUSSION_REFERENCES, formatVancouverCitation, exportToRISFormat, exportToENWFormat, exportToBibTeXFormat } from "./realReferences";
import { generateJAMAHtml, JAMA_COLORS, countWords, type JAMAManuscriptData } from "./jamaTemplate";
import * as notificationService from "./notificationService";
import * as seerPublicationService from "./seerPublicationService";
import * as pricingService from "./pricingService";
import * as seerDataService from "./seerDataService";

// ============ Project Router ============
const projectRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getProjectsByUserId(ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const project = await db.getProjectById(input.id, ctx.user.id);
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }
      return project;
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(255),
      description: z.string().optional(),
      cancerType: z.string().optional(),
      studyDesign: z.enum(["cohort", "case_control", "survival", "competing_risk"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.createProject({
        userId: ctx.user.id,
        title: input.title,
        description: input.description || null,