import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  Download,
  FileText,
  ExternalLink,
  Copy,
  Loader2,
  BookOpen,
  FileCheck,
  Mail,
  Package,
  CheckCircle2,
  ArrowLeft,
  Archive
} from "lucide-react";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Submission() {
  const params = useParams<{ id: string }>();
  const projectId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const [selectedJournal, setSelectedJournal] = useState<number | null>(null);
  const [coverLetterContent, setCoverLetterContent] = useState<string>("");
  const [checklistContent, setChecklistContent] = useState<string>("");
  const [allCoverLetters, setAllCoverLetters] = useState<Array<{
    journal: { name: string; abbreviation: string; impactFactor: string; submissionUrl: string };
    coverLetter: string;
    checklist: string;
  }>>([]);

  // Fetch data
  const { data: project } = trpc.project.get.useQuery({ id: projectId });
  const { data: journals } = trpc.submission.getJournals.useQuery();
  const { data: submissionPackage, isLoading: packageLoading } = trpc.submission.getSubmissionPackage.useQuery({ projectId });
  const { data: references } = trpc.pubmed.list.useQuery({ projectId });

  // Mutations
  const generateCoverLetter = trpc.submission.generateCoverLetter.useMutation({
    onSuccess: (data) => {
      setCoverLetterContent(data.coverLetter);
      setChecklistContent(data.checklist);
      toast.success(`Cover Letter for ${data.journal.name} generated`);
    },
    onError: (error) => toast.error("生成失败: " + error.message),
  });

  const generateReferences = trpc.pubmed.generateAll.useMutation({
    onSuccess: (data) => {
      toast.success(`References generated: Introduction ${data.introduction}, Methods ${data.methods}, Discussion ${data.discussion}`);
    },
    onError: (error) => toast.error("Generation failed: " + error.message),
  });

  const generateAllCoverLettersMutation = trpc.submission.generateAllCoverLetters.useMutation({
    onSuccess: (data) => {
      setAllCoverLetters(data);
      if (data.length > 0) {
        setSelectedJournal(0);
        setCoverLetterContent(data[0].coverLetter);
        setChecklistContent(data[0].checklist);
      }
      toast.success(`Generated ${data.length} Cover Letters for all recommended journals`);
    },
    onError: (error) => toast.error("Generation failed: " + error.message),
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} 已复制到剪贴板`);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${filename} 下载成功`);
  };

  const downloadAllFiles = async () => {
    if (!submissionPackage) return;

    const zip = new JSZip();
    const projectName = project?.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'submission';

    // Add manuscript
    if (submissionPackage.manuscript?.content) {
      zip.file('01_Manuscript/manuscript.md', submissionPackage.manuscript.content);
    }

    // Add references in different formats
    if (submissionPackage.references) {
      zip.file('02_References/references_vancouver.txt', submissionPackage.references.vancouver);
      zip.file('02_References/references.ris', submissionPackage.references.ris);
      zip.file('02_References/references.enw', submissionPackage.references.enw);
      zip.file('02_References/references.bib', submissionPackage.references.bibtex);
    }

    // Add all cover letters (10 journals)
    if (allCoverLetters.length > 0) {
      allCoverLetters.forEach((item, index) => {
        const journalName = item.journal.abbreviation.replace(/[^a-zA-Z0-9]/g, '_');
        zip.file(`03_CoverLetters/${String(index + 1).padStart(2, '0')}_${journalName}_cover_letter.txt`, item.coverLetter);
        zip.file(`03_CoverLetters/${String(index + 1).padStart(2, '0')}_${journalName}_checklist.md`, item.checklist);
      });
    } else if (coverLetterContent) {
      const journalName = selectedJournal !== null && journals 
        ? journals[selectedJournal].abbreviation.replace(/[^a-zA-Z0-9]/g, '_')
        : 'general';
      zip.file(`03_CoverLetters/cover_letter_${journalName}.txt`, coverLetterContent);
    }

    // Add tables
    if (submissionPackage.tables && submissionPackage.tables.length > 0) {
      submissionPackage.tables.forEach((table, index) => {
        if (table.markdown) {
          zip.file(`04_Tables/Table_${index + 1}_${table.type}.md`, table.markdown);
        }
        if (table.html) {
          zip.file(`04_Tables/Table_${index + 1}_${table.type}.html`, table.html);
        }
      });
    }

    // Add figures R code
    if (submissionPackage.figures && submissionPackage.figures.length > 0) {
      submissionPackage.figures.forEach((figure, index) => {
        if (figure.rCode) {
          zip.file(`05_Figures/Figure_${index + 1}_${figure.type}.R`, figure.rCode);
        }
      });
    }

    // Add journal list
    if (journals) {
      let journalList = '# Recommended Journals for Submission\n\n';
      journals.forEach((j, i) => {
        journalList += `## ${i + 1}. ${j.name}\n`;
        journalList += `- **Abbreviation:** ${j.abbreviation}\n`;
        journalList += `- **Impact Factor:** ${j.impactFactor}\n`;
        journalList += `- **Publisher:** ${j.publisher}\n`;
        journalList += `- **Submission URL:** ${j.submissionUrl}\n`;
        journalList += `- **Acceptance Rate:** ${j.acceptanceRate}\n`;
        journalList += `- **Turnaround:** ${j.turnaround}\n\n`;
      });
      zip.file('06_JournalInfo/recommended_journals.md', journalList);
    }

    // Add checklist
    if (checklistContent) {
      zip.file('00_Checklist/submission_checklist.md', checklistContent);
    }

    // Generate and download ZIP
    try {
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${projectName}_submission_package.zip`);
      toast.success('投稿包下载成功');
    } catch (error) {
      toast.error('打包失败');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation(`/project/${projectId}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回项目
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{project?.title || "投稿准备"}</h1>
              <p className="text-muted-foreground">准备投稿材料并选择目标期刊</p>
            </div>
          </div>
          <Button onClick={downloadAllFiles} disabled={!submissionPackage}>
            <Archive className="h-4 w-4 mr-2" />
            一键打包下载 (ZIP)
          </Button>
        </div>

        <Tabs defaultValue="journals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="journals">
              <BookOpen className="h-4 w-4 mr-2" />
              推荐期刊
            </TabsTrigger>
            <TabsTrigger value="references">
              <FileText className="h-4 w-4 mr-2" />
              参考文献
            </TabsTrigger>
            <TabsTrigger value="coverletter">
              <Mail className="h-4 w-4 mr-2" />
              Cover Letter
            </TabsTrigger>
            <TabsTrigger value="download">
              <Download className="h-4 w-4 mr-2" />
              下载中心
            </TabsTrigger>
          </TabsList>

          {/* Journals Tab */}
          <TabsContent value="journals">
            <Card>
              <CardHeader>
                <CardTitle>推荐投稿期刊 Top 10</CardTitle>
                <CardDescription>
                  基于SEER数据研究的肿瘤顶级期刊，按影响因子排序
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">排名</TableHead>
                      <TableHead>期刊名称</TableHead>
                      <TableHead className="text-center">影响因子</TableHead>
                      <TableHead className="text-center">接收率</TableHead>
                      <TableHead className="text-center">审稿周期</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {journals?.map((journal, index) => (
                      <TableRow key={journal.name} className={selectedJournal === index ? "bg-muted/50" : ""}>
                        <TableCell className="font-medium">{journal.rank}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{journal.name}</div>
                            <div className="text-xs text-muted-foreground">{journal.abbreviation} · {journal.publisher}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="destructive" className="font-bold">{journal.impactFactor}</Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm">{journal.acceptanceRate}</TableCell>
                        <TableCell className="text-center text-sm">{journal.turnaround}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedJournal(index);
                                generateCoverLetter.mutate({ projectId, journalIndex: index });
                              }}
                              disabled={generateCoverLetter.isPending}
                            >
                              {generateCoverLetter.isPending && selectedJournal === index ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Mail className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => window.open(journal.submissionUrl, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              投稿
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* References Tab */}
          <TabsContent value="references">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>参考文献列表</CardTitle>
                      <CardDescription>
                        共 {references?.length || 0} 篇参考文献
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => generateReferences.mutate({ projectId })}
                      disabled={generateReferences.isPending}
                    >
                      {generateReferences.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      生成文献
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {submissionPackage?.references && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-primary">{submissionPackage.references.bySection.introduction}</div>
                          <div className="text-xs text-muted-foreground">Introduction</div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-primary">{submissionPackage.references.bySection.methods}</div>
                          <div className="text-xs text-muted-foreground">Methods</div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-primary">{submissionPackage.references.bySection.discussion}</div>
                          <div className="text-xs text-muted-foreground">Discussion</div>
                        </div>
                      </div>
                      <Separator />
                      <ScrollArea className="h-[400px]">
                        <pre className="text-xs whitespace-pre-wrap font-mono">
                          {submissionPackage.references.vancouver}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>导出格式</CardTitle>
                  <CardDescription>选择适合您文献管理软件的格式</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => submissionPackage?.references && downloadFile(submissionPackage.references.vancouver, 'references_vancouver.txt', 'text/plain')}
                      disabled={!submissionPackage?.references}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Vancouver格式 (.txt)
                      <Badge variant="secondary" className="ml-auto">可直接复制</Badge>
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => submissionPackage?.references && downloadFile(submissionPackage.references.ris, 'references.ris', 'application/x-research-info-systems')}
                      disabled={!submissionPackage?.references}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      RIS格式 (.ris)
                      <Badge variant="secondary" className="ml-auto">EndNote/Zotero</Badge>
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => submissionPackage?.references && downloadFile(submissionPackage.references.enw, 'references.enw', 'application/x-endnote-refer')}
                      disabled={!submissionPackage?.references}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      ENW格式 (.enw)
                      <Badge variant="secondary" className="ml-auto">EndNote专用</Badge>
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => submissionPackage?.references && downloadFile(submissionPackage.references.bibtex, 'references.bib', 'application/x-bibtex')}
                      disabled={!submissionPackage?.references}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      BibTeX格式 (.bib)
                      <Badge variant="secondary" className="ml-auto">LaTeX</Badge>
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <Button
                    className="w-full"
                    onClick={() => submissionPackage?.references && copyToClipboard(submissionPackage.references.vancouver, "参考文献")}
                    disabled={!submissionPackage?.references}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    复制全部文献 (Vancouver格式)
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Cover Letter Tab */}
          <TabsContent value="coverletter">
            <div className="space-y-6">
              {/* Generate All Button */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Cover Letters for All 10 Journals</CardTitle>
                      <CardDescription>
                        Generate customized cover letters for each recommended journal
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => generateAllCoverLettersMutation.mutate({ projectId })}
                      disabled={generateAllCoverLettersMutation.isPending}
                      size="lg"
                    >
                      {generateAllCoverLettersMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4 mr-2" />
                      )}
                      Generate All 10 Cover Letters
                    </Button>
                  </div>
                </CardHeader>
                {allCoverLetters.length > 0 && (
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {allCoverLetters.map((item, index) => (
                        <Button
                          key={item.journal.name}
                          variant={selectedJournal === index ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setSelectedJournal(index);
                            setCoverLetterContent(item.coverLetter);
                            setChecklistContent(item.checklist);
                          }}
                        >
                          {index + 1}. {item.journal.abbreviation}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Cover Letter</CardTitle>
                    <CardDescription>
                      {selectedJournal !== null && allCoverLetters[selectedJournal]
                        ? `For ${allCoverLetters[selectedJournal].journal.name} (IF: ${allCoverLetters[selectedJournal].journal.impactFactor})`
                        : "Click 'Generate All 10 Cover Letters' to start"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {coverLetterContent ? (
                      <div className="space-y-4">
                        <ScrollArea className="h-[500px] border rounded-lg p-4">
                          <pre className="text-sm whitespace-pre-wrap font-serif">
                            {coverLetterContent}
                          </pre>
                        </ScrollArea>
                        <div className="flex gap-2">
                          <Button onClick={() => copyToClipboard(coverLetterContent, "Cover Letter")}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                          <Button variant="outline" onClick={() => {
                            const journalName = selectedJournal !== null && allCoverLetters[selectedJournal]
                              ? allCoverLetters[selectedJournal].journal.abbreviation.replace(/[^a-zA-Z0-9]/g, '_')
                              : 'cover_letter';
                            downloadFile(coverLetterContent, `cover_letter_${journalName}.txt`, 'text/plain');
                          }}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          {selectedJournal !== null && allCoverLetters[selectedJournal] && (
                            <Button variant="outline" onClick={() => window.open(allCoverLetters[selectedJournal].journal.submissionUrl, '_blank')}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Submit to Journal
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Mail className="h-12 w-12 mb-4 opacity-50" />
                        <p>Generate cover letters to see them here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Submission Checklist</CardTitle>
                    <CardDescription>Ensure all materials are ready</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {checklistContent ? (
                      <ScrollArea className="h-[500px]">
                        <pre className="text-sm whitespace-pre-wrap">
                          {checklistContent}
                        </pre>
                      </ScrollArea>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span>Manuscript</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span>References</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span>Figures & Tables</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          {allCoverLetters.length > 0 ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <div className="h-5 w-5 border-2 rounded-full" />
                          )}
                          <span>Cover Letters ({allCoverLetters.length}/10)</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Download Tab */}
          <TabsContent value="download">
            <Card>
              <CardHeader>
                <CardTitle>下载中心</CardTitle>
                <CardDescription>下载所有投稿所需文件</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Manuscript */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        论文正文
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-3">
                        {submissionPackage?.manuscript 
                          ? `${submissionPackage.manuscript.wordCount} 字`
                          : "未生成"}
                      </div>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => submissionPackage?.manuscript?.content && downloadFile(submissionPackage.manuscript.content, 'manuscript.md', 'text/markdown')}
                        disabled={!submissionPackage?.manuscript}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        下载 Markdown
                      </Button>
                    </CardContent>
                  </Card>

                  {/* References */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        参考文献
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-3">
                        {submissionPackage?.references 
                          ? `${submissionPackage.references.count} 篇`
                          : "未生成"}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => submissionPackage?.references && downloadFile(submissionPackage.references.ris, 'references.ris', 'application/x-research-info-systems')}
                          disabled={!submissionPackage?.references}
                        >
                          RIS
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => submissionPackage?.references && downloadFile(submissionPackage.references.enw, 'references.enw', 'application/x-endnote-refer')}
                          disabled={!submissionPackage?.references}
                        >
                          ENW
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cover Letter */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Cover Letter
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-3">
                        {coverLetterContent ? "已生成" : "未生成"}
                      </div>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => coverLetterContent && downloadFile(coverLetterContent, 'cover_letter.txt', 'text/plain')}
                        disabled={!coverLetterContent}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        下载
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Figures */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileCheck className="h-5 w-5" />
                        图表
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-3">
                        {submissionPackage?.figures?.length || 0} 个图表
                      </div>
                      <Button
                        className="w-full"
                        variant="outline"
                        disabled={!submissionPackage?.figures?.length}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        下载 R代码
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Tables */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileCheck className="h-5 w-5" />
                        表格
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-3">
                        {submissionPackage?.tables?.length || 0} 个表格
                      </div>
                      <Button
                        className="w-full"
                        variant="outline"
                        disabled={!submissionPackage?.tables?.length}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        下载 HTML
                      </Button>
                    </CardContent>
                  </Card>

                  {/* All Files */}
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2 text-primary">
                        <Package className="h-5 w-5" />
                        完整投稿包
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-3">
                        包含所有投稿文件
                      </div>
                      <Button
                        className="w-full"
                        onClick={downloadAllFiles}
                        disabled={!submissionPackage}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        一键下载全部
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
