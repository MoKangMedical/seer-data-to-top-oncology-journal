import { describe, it, expect } from 'vitest';
import { generateFigureLegend, exportToHTML } from './documentExporter';

describe('Document Exporter', () => {
  describe('generateFigureLegend', () => {
    it('should generate complete figure legend with all components', () => {
      const figure = {
        number: 1,
        title: 'Kaplan-Meier Survival Curves',
        legend: 'Overall survival analysis',
        rCode: 'library(survival)\nsurvfit(Surv(time, status) ~ group, data=df)'
      };
      
      const legend = generateFigureLegend(figure);
      
      expect(legend).toContain('Figure 1');
      expect(legend).toContain('Kaplan-Meier Survival Curves');
      expect(legend).toContain('Overall survival analysis');
      expect(legend).toContain('Abbreviations:');
      expect(legend).toContain('CI, confidence interval');
    });

    it('should handle figure without R code', () => {
      const figure = {
        number: 2,
        title: 'Flow Diagram',
        legend: 'Patient selection flow',
        rCode: ''
      };
      
      const legend = generateFigureLegend(figure);
      
      expect(legend).toContain('Figure 2');
      expect(legend).toContain('Flow Diagram');
    });
  });

  describe('exportToHTML', () => {
    it('should generate valid HTML with JAMA styling', () => {
      const jamaData = {
        title: 'Test Study Title',
        authors: [{ name: 'Test Author', degrees: 'MD', affiliations: ['Test Institution'], isCorresponding: true, email: 'test@test.com' }],
        keyPoints: { question: 'Test question?', findings: 'Test findings', meaning: 'Test meaning' },
        abstract: { importance: 'Test importance', objective: 'Test objective', designSettingParticipants: 'Test design', exposure: 'Test exposure', mainOutcomes: 'Test outcomes', results: 'Test results', conclusionsRelevance: 'Test conclusions' },
        introduction: 'Test introduction paragraph.',
        methods: { dataSources: 'Test data sources', studyPopulation: 'Test population', statisticalAnalysis: 'Test analysis' },
        results: 'Test results paragraph.',
        discussion: 'Test discussion paragraph.',
        limitations: 'Test limitations.',
        conclusions: 'Test conclusions.',
        articleInfo: { acceptedDate: '2025-01-01', publishedDate: '2025-01-15', doi: '10.1001/test', correspondingAuthor: { name: 'Test', department: 'Test', institution: 'Test', address: 'Test', email: 'test@test.com' }, authorContributions: { conceptDesign: ['Author'], acquisitionAnalysis: ['Author'], drafting: ['Author'], criticalReview: ['Author'], statisticalAnalysis: ['Author'], supervision: ['Author'] }, conflictOfInterest: 'None', fundingSupport: 'None', roleOfFunder: 'N/A', dataSharingStatement: 'Available' },
        references: [{ id: 1, authors: 'Test A', title: 'Test Reference', journal: 'Test Journal', year: 2024, volume: '1', pages: '1-10', doi: '10.1000/test' }],
        tables: [{ number: 1, title: 'Test Table', content: '| Col1 | Col2 |\n|------|------|\n| A | B |' }],
        figures: [{ number: 1, title: 'Test Figure', legend: 'Test legend', rCode: 'plot(1:10)' }]
      };
      
      const html = exportToHTML(jamaData);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Test Study Title');
      expect(html).toContain('Key Points');
      expect(html).toContain('Abstract');
      expect(html).toContain('Introduction');
      expect(html).toContain('Methods');
      expect(html).toContain('Results');
      expect(html).toContain('Discussion');
      expect(html).toContain('References');
      expect(html).toContain('Figure 1');
      expect(html).toContain('Table 1');
    });

    it('should include proper JAMA styling', () => {
      const jamaData = {
        title: 'Test',
        authors: [],
        keyPoints: { question: '', findings: '', meaning: '' },
        abstract: { importance: '', objective: '', designSettingParticipants: '', exposure: '', mainOutcomes: '', results: '', conclusionsRelevance: '' },
        introduction: '',
        methods: { dataSources: '', studyPopulation: '', statisticalAnalysis: '' },
        results: '',
        discussion: '',
        limitations: '',
        conclusions: '',
        articleInfo: { acceptedDate: '', publishedDate: '', doi: '', correspondingAuthor: { name: '', department: '', institution: '', address: '', email: '' }, authorContributions: { conceptDesign: [], acquisitionAnalysis: [], drafting: [], criticalReview: [], statisticalAnalysis: [], supervision: [] }, conflictOfInterest: '', fundingSupport: '', roleOfFunder: '', dataSharingStatement: '' },
        references: [],
        tables: [],
        figures: []
      };
      
      const html = exportToHTML(jamaData);
      
      // Check for JAMA-specific styling
      expect(html).toContain('Source Serif Pro');
      expect(html).toContain('font-family');
      expect(html).toContain('@media print');
    });
  });
});
