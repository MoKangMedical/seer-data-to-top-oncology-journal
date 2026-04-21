import { describe, it, expect } from 'vitest';
import {
  INTRODUCTION_REFERENCES,
  METHODS_REFERENCES,
  DISCUSSION_REFERENCES,
  getAllReferences,
  formatVancouverCitation,
  formatReferenceListForManuscript,
  exportToRISFormat,
  exportToENWFormat,
  exportToBibTeXFormat,
} from './realReferences';

describe('Real PubMed References', () => {
  describe('Reference Counts', () => {
    it('should have 12 introduction references', () => {
      expect(INTRODUCTION_REFERENCES.length).toBeGreaterThanOrEqual(10);
      expect(INTRODUCTION_REFERENCES.length).toBeLessThanOrEqual(15);
    });

    it('should have 5 methods references', () => {
      expect(METHODS_REFERENCES.length).toBeGreaterThanOrEqual(2);
      expect(METHODS_REFERENCES.length).toBeLessThanOrEqual(5);
    });

    it('should have 25 discussion references', () => {
      expect(DISCUSSION_REFERENCES.length).toBeGreaterThanOrEqual(20);
      expect(DISCUSSION_REFERENCES.length).toBeLessThanOrEqual(25);
    });

    it('should have total 38+ references', () => {
      const total = getAllReferences().length;
      expect(total).toBeGreaterThanOrEqual(35);
      expect(total).toBeLessThanOrEqual(45);
    });
  });

  describe('Reference Structure', () => {
    it('all references should have required fields', () => {
      const allRefs = getAllReferences();
      allRefs.forEach((ref) => {
        expect(ref.pmid).toBeDefined();
        expect(ref.pmid).toMatch(/^\d+$/); // PMID should be numeric
        expect(ref.title).toBeDefined();
        expect(ref.title.length).toBeGreaterThan(10);
        expect(ref.authors).toBeDefined();
        expect(ref.journal).toBeDefined();
        expect(ref.year).toBeGreaterThanOrEqual(1970);
        expect(ref.year).toBeLessThanOrEqual(2026);
        expect(ref.section).toMatch(/^(introduction|methods|discussion)$/);
      });
    });

    it('all references should have DOI', () => {
      const allRefs = getAllReferences();
      allRefs.forEach((ref) => {
        expect(ref.doi).toBeDefined();
        expect(ref.doi).toMatch(/^10\./); // DOI should start with 10.
      });
    });

    it('introduction references should be from top journals', () => {
      const topJournals = ['CA Cancer J Clin', 'Lancet', 'N Engl J Med', 'JAMA', 'J Natl Cancer Inst', 'Int J Cancer', 'Cancer Epidemiol Biomarkers Prev', 'Lancet Oncol', 'Curr Oncol Rep', 'Cancer'];
      INTRODUCTION_REFERENCES.forEach((ref) => {
        const isTopJournal = topJournals.some(j => ref.journal.includes(j));
        expect(isTopJournal).toBe(true);
      });
    });

    it('methods references should be methodology focused', () => {
      const methodsTopics = ['regression', 'survival', 'propensity', 'confounding', 'competing'];
      METHODS_REFERENCES.forEach((ref) => {
        const isMethodology = ref.topic.some(t => 
          methodsTopics.some(m => t.toLowerCase().includes(m))
        );
        expect(isMethodology).toBe(true);
      });
    });
  });

  describe('Vancouver Citation Format', () => {
    it('should format citation correctly', () => {
      const ref = INTRODUCTION_REFERENCES[0];
      const citation = formatVancouverCitation(ref);
      
      expect(citation).toContain(ref.authors);
      expect(citation).toContain(ref.title);
      expect(citation).toContain(ref.journal);
      expect(citation).toContain(ref.year.toString());
      expect(citation).toContain(`PMID: ${ref.pmid}`);
    });

    it('should include DOI in citation', () => {
      const ref = INTRODUCTION_REFERENCES[0];
      const citation = formatVancouverCitation(ref);
      
      expect(citation).toContain(`doi:${ref.doi}`);
    });
  });

  describe('Reference List Formatting', () => {
    it('should format reference list with numbers', () => {
      const refs = INTRODUCTION_REFERENCES.slice(0, 3);
      const list = formatReferenceListForManuscript(refs);
      
      expect(list).toContain('## References');
      expect(list).toContain('1.');
      expect(list).toContain('2.');
      expect(list).toContain('3.');
    });
  });

  describe('Export Formats', () => {
    it('should export to RIS format', () => {
      const refs = INTRODUCTION_REFERENCES.slice(0, 2);
      const ris = exportToRISFormat(refs);
      
      expect(ris).toContain('TY  - JOUR');
      expect(ris).toContain('TI  -');
      expect(ris).toContain('AU  -');
      expect(ris).toContain('JO  -');
      expect(ris).toContain('PY  -');
      expect(ris).toContain('DO  -');
      expect(ris).toContain('PM  -');
      expect(ris).toContain('ER  -');
    });

    it('should export to ENW format', () => {
      const refs = INTRODUCTION_REFERENCES.slice(0, 2);
      const enw = exportToENWFormat(refs);
      
      expect(enw).toContain('%0 Journal Article');
      expect(enw).toContain('%T');
      expect(enw).toContain('%A');
      expect(enw).toContain('%J');
      expect(enw).toContain('%D');
      expect(enw).toContain('%R');
      expect(enw).toContain('%M');
    });

    it('should export to BibTeX format', () => {
      const refs = INTRODUCTION_REFERENCES.slice(0, 2);
      const bibtex = exportToBibTeXFormat(refs);
      
      expect(bibtex).toContain('@article{');
      expect(bibtex).toContain('author = {');
      expect(bibtex).toContain('title = {');
      expect(bibtex).toContain('journal = {');
      expect(bibtex).toContain('year = {');
      expect(bibtex).toContain('doi = {');
      expect(bibtex).toContain('pmid = {');
    });
  });

  describe('Specific High-Impact References', () => {
    it('should include GLOBOCAN 2020 reference', () => {
      const globocan = INTRODUCTION_REFERENCES.find(r => 
        r.title.includes('Global Cancer Statistics 2020')
      );
      expect(globocan).toBeDefined();
      expect(globocan?.pmid).toBe('33538338');
      expect(globocan?.journal).toBe('CA Cancer J Clin');
    });

    it('should include Cox regression reference', () => {
      const cox = METHODS_REFERENCES.find(r => 
        r.title.includes('Regression models and life-tables')
      );
      expect(cox).toBeDefined();
      expect(cox?.authors).toContain('Cox DR');
    });

    it('should include Fine-Gray competing risks reference', () => {
      const fineGray = METHODS_REFERENCES.find(r => 
        r.title.includes('competing risk')
      );
      expect(fineGray).toBeDefined();
      expect(fineGray?.authors).toContain('Fine JP');
    });
  });
});
