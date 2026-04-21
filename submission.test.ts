import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  TOP_ONCOLOGY_JOURNALS, 
  formatJournalListMarkdown, 
  formatJournalListHTML,
  generateSubmissionChecklist 
} from './submissionService';

describe('Submission Service', () => {
  describe('TOP_ONCOLOGY_JOURNALS', () => {
    it('should have exactly 10 journals', () => {
      expect(TOP_ONCOLOGY_JOURNALS).toHaveLength(10);
    });

    it('should have all required fields for each journal', () => {
      TOP_ONCOLOGY_JOURNALS.forEach((journal) => {
        expect(journal).toHaveProperty('rank');
        expect(journal).toHaveProperty('name');
        expect(journal).toHaveProperty('abbreviation');
        expect(journal).toHaveProperty('impactFactor');
        expect(journal).toHaveProperty('publisher');
        expect(journal).toHaveProperty('submissionUrl');
        expect(journal).toHaveProperty('scope');
        expect(journal).toHaveProperty('acceptanceRate');
        expect(journal).toHaveProperty('turnaround');
      });
    });

    it('should have valid submission URLs', () => {
      TOP_ONCOLOGY_JOURNALS.forEach((journal) => {
        expect(journal.submissionUrl).toMatch(/^https:\/\//);
      });
    });

    it('should be ranked from 1 to 10', () => {
      TOP_ONCOLOGY_JOURNALS.forEach((journal, index) => {
        expect(journal.rank).toBe(index + 1);
      });
    });

    it('should include top oncology journals', () => {
      const journalNames = TOP_ONCOLOGY_JOURNALS.map(j => j.name);
      expect(journalNames).toContain('CA: A Cancer Journal for Clinicians');
      expect(journalNames).toContain('The Lancet Oncology');
      expect(journalNames).toContain('Journal of Clinical Oncology');
      expect(journalNames).toContain('JAMA Oncology');
    });
  });

  describe('formatJournalListMarkdown', () => {
    it('should return a markdown table', () => {
      const markdown = formatJournalListMarkdown();
      
      expect(markdown).toContain('# Recommended Oncology Journals');
      expect(markdown).toContain('| Rank | Journal | IF |');
      expect(markdown).toContain('|------|---------|-----|');
    });

    it('should include all journals in the table', () => {
      const markdown = formatJournalListMarkdown();
      
      TOP_ONCOLOGY_JOURNALS.forEach((journal) => {
        expect(markdown).toContain(journal.name);
        expect(markdown).toContain(journal.impactFactor);
      });
    });

    it('should include submission links', () => {
      const markdown = formatJournalListMarkdown();
      
      expect(markdown).toContain('[Submit]');
    });
  });

  describe('formatJournalListHTML', () => {
    it('should return valid HTML', () => {
      const html = formatJournalListHTML();
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('</html>');
      expect(html).toContain('<table>');
      expect(html).toContain('</table>');
    });

    it('should include all journals', () => {
      const html = formatJournalListHTML();
      
      TOP_ONCOLOGY_JOURNALS.forEach((journal) => {
        expect(html).toContain(journal.name);
      });
    });

    it('should include submission links', () => {
      const html = formatJournalListHTML();
      
      TOP_ONCOLOGY_JOURNALS.forEach((journal) => {
        expect(html).toContain(journal.submissionUrl);
      });
    });
  });

  describe('generateSubmissionChecklist', () => {
    it('should generate a checklist for a journal', () => {
      const checklist = generateSubmissionChecklist('JAMA Oncology');
      
      expect(checklist).toContain('# Submission Checklist for JAMA Oncology');
      expect(checklist).toContain('## Required Files');
      expect(checklist).toContain('## Manuscript Requirements');
      expect(checklist).toContain('## Author Information');
      expect(checklist).toContain('## Declarations');
    });

    it('should include all required items', () => {
      const checklist = generateSubmissionChecklist('Test Journal');
      
      expect(checklist).toContain('Manuscript');
      expect(checklist).toContain('Cover Letter');
      expect(checklist).toContain('Figures');
      expect(checklist).toContain('Tables');
      expect(checklist).toContain('References');
    });

    it('should use checkbox format', () => {
      const checklist = generateSubmissionChecklist('Test Journal');
      
      expect(checklist).toContain('- [ ]');
    });
  });
});
