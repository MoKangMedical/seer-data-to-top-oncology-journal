import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Download, Eye, Printer, FileType, File } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface JAMAPreviewProps {
  projectId: number;
}

export function JAMAPreview({ projectId }: JAMAPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const exportJAMA = trpc.manuscript.exportJAMA.useMutation();
  const exportWord = trpc.manuscript.exportWord.useMutation();
  const exportPDF = trpc.manuscript.exportPDF.useMutation();

  const handleExport = async () => {
    const result = await exportJAMA.mutateAsync({ projectId });
    return result;
  };

  const handleDownloadHTML = async () => {
    const result = await handleExport();
    if (result?.html) {
      const blob = new Blob([result.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'manuscript_jama_format.html';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadWord = async () => {
    try {
      const result = await exportWord.mutateAsync({ projectId });
      if (result?.base64) {
        // Convert base64 to blob
        const byteCharacters = atob(result.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename || 'manuscript_jama_format.docx';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to download Word document:', error);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const result = await exportPDF.mutateAsync({ projectId });
      if (result?.html) {
        // Open HTML in new window for printing to PDF
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(result.html);
          printWindow.document.close();
          // Add print instructions
          printWindow.document.title = result.filename?.replace('.html', '.pdf') || 'manuscript_jama_format.pdf';
          setTimeout(() => {
            printWindow.print();
          }, 500);
        }
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    }
  };

  const handlePrint = async () => {
    const result = await handleExport();
    if (result?.html) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(result.html);
        printWindow.document.close();
        printWindow.onload = () => { printWindow.print(); };
      }
    }
  };

  const isLoading = exportJAMA.isPending || exportWord.isPending || exportPDF.isPending;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          JAMA Format Export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Export your manuscript in JAMA Network Open format with complete Figure Legends, ready for submission.
        </p>
        
        {/* Preview Dialog */}
        <div className="flex flex-wrap gap-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" onClick={async () => { await handleExport(); setIsOpen(true); }} disabled={isLoading}>
                <Eye className="h-4 w-4" />
                {exportJAMA.isPending ? 'Loading...' : 'Preview'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  JAMA Format Preview
                </DialogTitle>
              </DialogHeader>
              <div className="h-[70vh] overflow-auto">
                {exportJAMA.data?.html && (
                  <iframe srcDoc={exportJAMA.data.html} className="w-full h-full border rounded-lg" title="JAMA Preview" />
                )}
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Word Count: <span className="font-bold text-primary">{exportJAMA.data?.wordCount || 0}</span> | 
                  References: <span className="font-bold text-primary">{exportJAMA.data?.jamaData?.references?.length || 0}</span> |
                  Tables: <span className="font-bold text-primary">{exportJAMA.data?.jamaData?.tables?.length || 0}</span> |
                  Figures: <span className="font-bold text-primary">{exportJAMA.data?.jamaData?.figures?.length || 0}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handlePrint} className="gap-2"><Printer className="h-4 w-4" />Print</Button>
                  <Button variant="secondary" onClick={handleDownloadHTML} className="gap-2"><Download className="h-4 w-4" />HTML</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Download Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button 
            variant="default" 
            className="gap-2 h-auto py-3 flex-col" 
            onClick={handleDownloadWord} 
            disabled={isLoading}
          >
            <FileType className="h-5 w-5" />
            <span className="text-xs">
              {exportWord.isPending ? 'Generating...' : 'Download Word (.docx)'}
            </span>
          </Button>
          
          <Button 
            variant="secondary" 
            className="gap-2 h-auto py-3 flex-col" 
            onClick={handleDownloadPDF} 
            disabled={isLoading}
          >
            <File className="h-5 w-5" />
            <span className="text-xs">
              {exportPDF.isPending ? 'Generating...' : 'Download PDF'}
            </span>
          </Button>
          
          <Button 
            variant="outline" 
            className="gap-2 h-auto py-3 flex-col" 
            onClick={handleDownloadHTML} 
            disabled={isLoading}
          >
            <Download className="h-5 w-5" />
            <span className="text-xs">
              {exportJAMA.isPending ? 'Generating...' : 'Download HTML'}
            </span>
          </Button>
        </div>

        {/* Features List */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p>✓ JAMA Network Open format with Key Points Box</p>
          <p>✓ Structured Abstract (Importance, Objective, Design, Results, Conclusions)</p>
          <p>✓ Complete Figure Legends with abbreviations</p>
          <p>✓ Vancouver-style references with DOI</p>
          <p>✓ Article Information section (Author Contributions, COI, Funding)</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default JAMAPreview;
