import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  projects, InsertProject, Project,
  proposals, InsertProposal, Proposal,
  analysisCodes, InsertAnalysisCode, AnalysisCode,
  figures, InsertFigure, Figure,
  tables, InsertTable, Table,
  manuscripts, InsertManuscript, Manuscript,
  pubmedReferences, InsertPubmedReference, PubmedReference,
  resultStructures, InsertResultStructure, ResultStructure,
  dataUploads, InsertDataUpload, DataUpload
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
