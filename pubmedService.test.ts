import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  formatVancouverCitation, 
  exportToRIS, 
  exportToENW, 
  exportToBibTeX,
  formatReferenceList,
  REFERENCE_TARGETS 
} from './pubmedService';

// Mock LLM for generateSectionReferences tests
vi.mock('./_core/llm', () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          references: [
            {
              pmid: "38123456",
              title: "Test Article Title",
              authors: "Smith AB, Jones CD, et al.",
              journal: "JAMA Oncol",
              year: 2024,
              volume: "10",
              issue: "3",
              pages: "123-130",
              doi: "10.1001/jamaoncol.2024.0001",
              impactFactor: "28.4"
            }
          ]
        })
      }
    }]
  })
}));

describe('PubMed Service', () => {
  describe('formatVancouverCitation', () => {
    it('should format a complete reference correctly', () => {
      const ref = {
        authors: "Smith AB, Jones CD, et al.",
        title: "Test Article Title",
        journal: "JAMA Oncol",
        year: 2024,
        volume: "10",
        issue: "3",
        pages: "123-130",
        doi: "10.1001/jamaoncol.2024.0001"
      };
      
      const citation = formatVancouverCitation(ref);
      
      expect(citation).toContain("Smith AB, Jones CD, et al.");
      expect(citation).toContain("Test Article Title");
      expect(citation).toContain("JAMA Oncol");
      expect(citation).toContain("2024");
      expect(citation).toContain("10(3)");
      expect(citation).toContain("123-130");
      expect(citation).toContain("doi:10.1001/jamaoncol.2024.0001");
    });

    it('should handle missing optional fields', () => {
      const ref = {
        authors: "Smith AB",
        title: "Test Title",
        journal: "JAMA",
        year: 2023,
        volume: "330",
        pages: "100-105"
      };
      
      const citation = formatVancouverCitation(ref);
      
      expect(citation).toContain("Smith AB");
      expect(citation).toContain("JAMA");
      expect(citation).toContain("2023");
      expect(citation).not.toContain("undefined");
    });
  });

  describe('exportToRIS', () => {
    it('should export references to RIS format', () => {
      const refs = [{
        pmid: "38123456",
        title: "Test Article",
        authors: "Smith AB, Jones CD",
        journal: "JAMA Oncol",
        year: 2024,
        volume: "10",
        issue: "3",
        pages: "123-130",
        doi: "10.1001/test",
        vancouverCitation: "",
        isVerified: false
      }];
      
      const ris = exportToRIS(refs);
      
      expect(ris).toContain("TY  - JOUR");
      expect(ris).toContain("TI  - Test Article");
      expect(ris).toContain("JO  - JAMA Oncol");
      expect(ris).toContain("PY  - 2024");
      expect(ris).toContain("PM  - 38123456");
      expect(ris).toContain("ER  -");
    });
  });

  describe('exportToENW', () => {
    it('should export references to EndNote format', () => {
      const refs = [{
        pmid: "38123456",
        title: "Test Article",
        authors: "Smith AB, Jones CD",
        journal: "JAMA Oncol",
        year: 2024,
        volume: "10",
        issue: "3",
        pages: "123-130",
        doi: "10.1001/test",
        vancouverCitation: "",
        isVerified: false
      }];
      
      const enw = exportToENW(refs);
      
      expect(enw).toContain("%0 Journal Article");
      expect(enw).toContain("%T Test Article");
      expect(enw).toContain("%J JAMA Oncol");
      expect(enw).toContain("%D 2024");
      expect(enw).toContain("%M 38123456");
    });
  });

  describe('exportToBibTeX', () => {
    it('should export references to BibTeX format', () => {
      const refs = [{
        pmid: "38123456",
        title: "Test Article",
        authors: "Smith AB, Jones CD",
        journal: "JAMA Oncol",
        year: 2024,
        volume: "10",
        issue: "3",
        pages: "123-130",
        doi: "10.1001/test",
        vancouverCitation: "",
        isVerified: false
      }];
      
      const bibtex = exportToBibTeX(refs);
      
      expect(bibtex).toContain("@article{ref1_2024");
      expect(bibtex).toContain("author = {Smith AB and Jones CD}");
      expect(bibtex).toContain("title = {Test Article}");
      expect(bibtex).toContain("journal = {JAMA Oncol}");
      expect(bibtex).toContain("year = {2024}");
    });
  });

  describe('formatReferenceList', () => {
    it('should format numbered reference list', () => {
      const refs = [
        {
          pmid: "1",
          title: "First Article",
          authors: "Smith A",
          journal: "JAMA",
          year: 2024,
          volume: "1",
          issue: "1",
          pages: "1-10",
          doi: "10.1001/1",
          vancouverCitation: "Smith A. First Article. JAMA. 2024;1(1):1-10.",
          isVerified: false
        },
        {
          pmid: "2",
          title: "Second Article",
          authors: "Jones B",
          journal: "Lancet",
          year: 2023,
          volume: "2",
          issue: "2",
          pages: "20-30",
          doi: "10.1016/2",
          vancouverCitation: "Jones B. Second Article. Lancet. 2023;2(2):20-30.",
          isVerified: false
        }
      ];
      
      const list = formatReferenceList(refs);
      
      expect(list).toContain("1. Smith A. First Article");
      expect(list).toContain("2. Jones B. Second Article");
    });
  });

  describe('REFERENCE_TARGETS', () => {
    it('should have correct target counts for each section', () => {
      expect(REFERENCE_TARGETS.introduction.min).toBe(10);
      expect(REFERENCE_TARGETS.introduction.max).toBe(15);
      expect(REFERENCE_TARGETS.methods.min).toBe(2);
      expect(REFERENCE_TARGETS.methods.max).toBe(5);
      expect(REFERENCE_TARGETS.discussion.min).toBe(20);
      expect(REFERENCE_TARGETS.discussion.max).toBe(25);
    });
  });
});
