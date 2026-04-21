import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Edit3, 
  Expand, 
  Sparkles, 
  RefreshCw, 
  Save, 
  X, 
  Check,
  Loader2,
  Copy,
  Undo,
  History,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';

type SectionType = 
  | 'title'
  | 'abstract'
  | 'what_is_known'
  | 'what_this_adds'
  | 'introduction'
  | 'methods'
  | 'results'
  | 'discussion'
  | 'full';

type PolishStyle = 'academic' | 'concise' | 'detailed' | 'jama' | 'lancet';

interface SectionEditorProps {
  projectId: number;
  section: SectionType;
  title: string;
  content: string;
  onContentChange?: (content: string) => void;
  onSave?: () => void;
  readOnly?: boolean;
}

const styleDescriptions: Record<PolishStyle, string> = {
  academic: 'Formal academic language with precise terminology',
  concise: 'More concise while preserving key information',
  detailed: 'Add more detail and depth',
  jama: 'JAMA style: clear, direct, clinical focus',
  lancet: 'Lancet style: elegant prose, global health focus',
};

export function SectionEditor({
  projectId,
  section,
  title,
  content: initialContent,
  onContentChange,
  onSave,
  readOnly = false,
}: SectionEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [originalContent, setOriginalContent] = useState(initialContent);
  const [history, setHistory] = useState<string[]>([initialContent]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Dialog states
  const [showExpandDialog, setShowExpandDialog] = useState(false);
  const [showPolishDialog, setShowPolishDialog] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  
  // Form states
  const [expandInstruction, setExpandInstruction] = useState('');
  const [polishStyle, setPolishStyle] = useState<PolishStyle>('academic');
  const [regenerateInstruction, setRegenerateInstruction] = useState('');
  const [keepParts, setKeepParts] = useState('');

  // Mutations
  const updateSection = trpc.manuscript.updateSection.useMutation({
    onSuccess: () => {
      toast.success('Section saved successfully');
      setOriginalContent(content);
      setIsEditing(false);
      onSave?.();
    },
    onError: (error) => {
      toast.error('Failed to save: ' + error.message);
    },
  });

  const expandContent = trpc.manuscript.expandContent.useMutation({
    onSuccess: (data) => {
      addToHistory(data.expandedContent);
      setContent(data.expandedContent);
      onContentChange?.(data.expandedContent);
      setShowExpandDialog(false);
      setExpandInstruction('');
      toast.success('Content expanded successfully');
    },
    onError: (error) => {
      toast.error('Failed to expand: ' + error.message);
    },
  });

  const polishContent = trpc.manuscript.polishContent.useMutation({
    onSuccess: (data) => {
      addToHistory(data.polishedContent);
      setContent(data.polishedContent);
      onContentChange?.(data.polishedContent);
      setShowPolishDialog(false);
      toast.success('Content polished successfully');
    },
    onError: (error) => {
      toast.error('Failed to polish: ' + error.message);
    },
  });

  const regenerateSection = trpc.manuscript.regenerateSection.useMutation({
    onSuccess: (data) => {
      addToHistory(data.regeneratedContent);
      setContent(data.regeneratedContent);
      onContentChange?.(data.regeneratedContent);
      setShowRegenerateDialog(false);
      setRegenerateInstruction('');
      setKeepParts('');
      toast.success('Section regenerated successfully');
    },
    onError: (error) => {
      toast.error('Failed to regenerate: ' + error.message);
    },
  });

  useEffect(() => {
    setContent(initialContent);
    setOriginalContent(initialContent);
    setHistory([initialContent]);
    setHistoryIndex(0);
  }, [initialContent]);

  const addToHistory = (newContent: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newContent);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setContent(history[newIndex]);
      onContentChange?.(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setContent(history[newIndex]);
      onContentChange?.(history[newIndex]);
    }
  };

  const handleSave = () => {
    updateSection.mutate({
      projectId,
      section,
      content,
    });
  };

  const handleCancel = () => {
    setContent(originalContent);
    setIsEditing(false);
  };

  const handleExpand = () => {
    expandContent.mutate({
      projectId,
      section,
      content,
      instruction: expandInstruction || undefined,
    });
  };

  const handlePolish = () => {
    polishContent.mutate({
      projectId,
      section,
      content,
      style: polishStyle,
    });
  };

  const handleRegenerate = () => {
    if (section === 'full') return; // Full section not supported for regenerate
    regenerateSection.mutate({
      projectId,
      section: section as Exclude<SectionType, 'full'>,
      instruction: regenerateInstruction || undefined,
      keepParts: keepParts || undefined,
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('Content copied to clipboard');
  };

  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  const hasChanges = content !== originalContent;

  return (
    <Card className={`transition-all ${isExpanded ? 'col-span-full' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {wordCount} words
            </Badge>
            {hasChanges && (
              <Badge variant="secondary" className="text-xs">
                Unsaved
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <CardDescription>
          {section === 'introduction' && 'Background, knowledge gap, and study objectives'}
          {section === 'methods' && 'Data source, study population, and statistical analysis'}
          {section === 'results' && 'Baseline characteristics, main findings, and subgroup analysis'}
          {section === 'discussion' && 'Principal findings, comparison with literature, and limitations'}
          {section === 'abstract' && 'Structured abstract with objectives, methods, results, and conclusions'}
          {section === 'title' && 'Paper title (max 150 characters)'}
          {section === 'what_is_known' && 'Key points summarizing existing knowledge'}
          {section === 'what_this_adds' && 'Key points highlighting study contributions'}
          {section === 'full' && 'Complete manuscript'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              onContentChange?.(e.target.value);
            }}
            className="min-h-[200px] font-mono text-sm"
            placeholder="Enter content..."
          />
        ) : (
          <div 
            className={`prose prose-sm max-w-none ${isExpanded ? 'max-h-none' : 'max-h-[200px] overflow-hidden'}`}
            onClick={() => !readOnly && setIsEditing(true)}
          >
            <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground cursor-text hover:bg-muted/50 p-2 rounded transition-colors">
              {content || 'Click to edit...'}
            </pre>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
          {isEditing ? (
            <>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateSection.isPending || !hasChanges}
              >
                {updateSection.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </>
          ) : (
            !readOnly && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )
          )}

          {/* Undo/Redo */}
          <div className="flex items-center gap-1 border-l pl-2 ml-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo"
            >
              <Undo className="h-4 w-4 rotate-180" />
            </Button>
          </div>

          {/* AI Actions */}
          {!readOnly && (
            <div className="flex items-center gap-1 border-l pl-2 ml-2">
              {/* Expand Dialog */}
              <Dialog open={showExpandDialog} onOpenChange={setShowExpandDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" title="AI Expand">
                    <Expand className="h-4 w-4 mr-1" />
                    Expand
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>AI Expand Content</DialogTitle>
                    <DialogDescription>
                      AI will expand the current content with more details, examples, and supporting evidence.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Additional Instructions (Optional)</Label>
                      <Textarea
                        placeholder="E.g., Focus on clinical implications, add more statistics..."
                        value={expandInstruction}
                        onChange={(e) => setExpandInstruction(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowExpandDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleExpand} disabled={expandContent.isPending}>
                      {expandContent.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      Expand
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Polish Dialog */}
              <Dialog open={showPolishDialog} onOpenChange={setShowPolishDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" title="AI Polish">
                    <Sparkles className="h-4 w-4 mr-1" />
                    Polish
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>AI Polish Content</DialogTitle>
                    <DialogDescription>
                      AI will improve the language, fix grammar, and enhance the writing style.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Writing Style</Label>
                      <Select value={polishStyle} onValueChange={(v) => setPolishStyle(v as PolishStyle)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(styleDescriptions).map(([key, desc]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex flex-col">
                                <span className="font-medium capitalize">{key}</span>
                                <span className="text-xs text-muted-foreground">{desc}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowPolishDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handlePolish} disabled={polishContent.isPending}>
                      {polishContent.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      Polish
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Regenerate Dialog */}
              {section !== 'full' && (
                <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" title="Regenerate">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Regenerate
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Regenerate Section</DialogTitle>
                      <DialogDescription>
                        AI will generate a completely new version of this section based on your study data.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Additional Instructions (Optional)</Label>
                        <Textarea
                          placeholder="E.g., Focus more on survival outcomes, emphasize clinical relevance..."
                          value={regenerateInstruction}
                          onChange={(e) => setRegenerateInstruction(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Keep These Elements (Optional)</Label>
                        <Textarea
                          placeholder="E.g., Keep the first paragraph, preserve the statistics mentioned..."
                          value={keepParts}
                          onChange={(e) => setKeepParts(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowRegenerateDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleRegenerate} disabled={regenerateSection.isPending}>
                        {regenerateSection.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                        Regenerate
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}

          {/* Copy button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="ml-auto"
            title="Copy to clipboard"
          >
            <Copy className="h-4 w-4" />
          </Button>

          {/* History Dialog */}
          {history.length > 1 && (
            <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" title="View history">
                  <History className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit History</DialogTitle>
                  <DialogDescription>
                    View and restore previous versions of this section.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {history.map((item, index) => (
                    <Card key={index} className={index === historyIndex ? 'border-primary' : ''}>
                      <CardHeader className="py-2">
                        <div className="flex items-center justify-between">
                          <Badge variant={index === historyIndex ? 'default' : 'outline'}>
                            Version {index + 1}
                            {index === historyIndex && ' (Current)'}
                          </Badge>
                          {index !== historyIndex && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setHistoryIndex(index);
                                setContent(history[index]);
                                onContentChange?.(history[index]);
                                setShowHistoryDialog(false);
                              }}
                            >
                              Restore
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="py-2">
                        <pre className="whitespace-pre-wrap font-sans text-xs text-muted-foreground max-h-[100px] overflow-hidden">
                          {item.slice(0, 500)}
                          {item.length > 500 && '...'}
                        </pre>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default SectionEditor;
