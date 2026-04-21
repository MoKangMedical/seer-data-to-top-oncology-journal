import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft,
  FileText, 
  Code2, 
  Table2, 
  LineChart, 
  BookOpen,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Download,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Upload,
  Database,
  FileSpreadsheet,
  Trash2,
  Play,
  Zap
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Streamdown } from 'streamdown';
import { SectionEditor } from '@/components/SectionEditor';
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type CodeType = "r" | "stata";
type AnalysisType = "data_cleaning" | "descriptive" | "kaplan_meier" | "cox_regression" | "fine_gray" | "psm" | "subgroup" | "sensitivity" | "forest_plot" | "rcs_curve" | "calibration";
type TableType = "baseline_characteristics" | "regression_results" | "subgroup_analysis" | "sensitivity_analysis";
type FigureType = "kaplan_meier" | "forest_plot" | "competing_risk" | "rcs_curve" | "calibration_curve" | "flowchart";
type ManuscriptSection = "title" | "abstract" | "what_is_known" | "what_this_adds" | "introduction" | "methods" | "results" | "discussion" | "full";

const analysisTypeLabels: Record<AnalysisType, string> = {
  data_cleaning: "数据清洗",
  descriptive: "描述性统计 (Table 1)",
  kaplan_meier: "Kaplan-Meier生存分析",
  cox_regression: "Cox回归分析",
  fine_gray: "Fine-Gray竞争风险模型",
  psm: "倾向得分匹配",
  subgroup: "亚组分析",
  sensitivity: "敏感性分析",
  forest_plot: "森林图",
  rcs_curve: "限制性立方样条",
  calibration: "校准曲线",
};

const tableTypeLabels: Record<TableType, string> = {
  baseline_characteristics: "Table 1 基线特征表",
  regression_results: "回归结果表",
  subgroup_analysis: "亚组分析表",
  sensitivity_analysis: "敏感性分析表",
};

const figureTypeLabels: Record<FigureType, string> = {
  kaplan_meier: "Kaplan-Meier生存曲线",
  forest_plot: "森林图",
  competing_risk: "竞争风险累积发生率曲线",
  rcs_curve: "限制性立方样条曲线",
  calibration_curve: "校准曲线",
  flowchart: "研究流程图",
};

const sectionLabels: Record<ManuscriptSection, string> = {
  title: "标题",
  abstract: "结构化摘要",
  what_is_known: "What is already known",
  what_this_adds: "What this study adds",
  introduction: "Introduction",
  methods: "Methods",
  results: "Results",
  discussion: "Discussion",
  full: "完整论文",
};

// 工作流程步骤
const workflowSteps = [
  { id: "proposal", label: "研究方案", icon: FileText, description: "解析PICO框架" },
  { id: "data", label: "数据上传", icon: Upload, description: "上传SEER数据" },
  { id: "analysis", label: "数据分析", icon: Code2, description: "生成分析代码" },
  { id: "figures", label: "图表生成", icon: LineChart, description: "生成6个图表" },
  { id: "manuscript", label: "论文撰写", icon: BookOpen, description: "5000字论文" },
  { id: "submission", label: "投稿准备", icon: Download, description: "下载投稿" },
];

export default function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const projectId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [proposalText, setProposalText] = useState("");
  const [selectedCodeType, setSelectedCodeType] = useState<CodeType>("r");
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<AnalysisType>("data_cleaning");
  const [selectedTableType, setSelectedTableType] = useState<TableType>("baseline_characteristics");
  const [selectedFigureType, setSelectedFigureType] = useState<FigureType>("kaplan_meier");
  const [selectedSection, setSelectedSection] = useState<ManuscriptSection>("title");
  const [activeTab, setActiveTab] = useState("proposal");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Queries
  const { data: project, isLoading: projectLoading } = trpc.project.get.useQuery({ id: projectId });
  const { data: proposal, refetch: refetchProposal } = trpc.proposal.get.useQuery({ projectId });
  const { data: analysisCodes, refetch: refetchCodes } = trpc.analysisCode.list.useQuery({ projectId });
  const { data: tables, refetch: refetchTables } = trpc.table.list.useQuery({ projectId });
  const { data: figures, refetch: refetchFigures } = trpc.figure.list.useQuery({ projectId });
  const { data: manuscript, refetch: refetchManuscript } = trpc.manuscript.get.useQuery({ projectId });
  const { data: references } = trpc.pubmed.list.useQuery({ projectId });
  const { data: dataUploads, refetch: refetchDataUploads } = trpc.dataUpload.list.useQuery({ projectId });

  // Mutations
  const parseProposal = trpc.proposal.parse.useMutation({
    onSuccess: () => {
      toast.success("研究方案解析完成");
      refetchProposal();
    },
    onError: (error) => toast.error("解析失败: " + error.message),
  });

  const generateBlueprint = trpc.proposal.generateBlueprint.useMutation({
    onSuccess: () => {
      toast.success("方法学蓝图生成完成");
      refetchProposal();
    },
    onError: (error) => toast.error("生成失败: " + error.message),
  });

  const generateCode = trpc.analysisCode.generate.useMutation({
    onSuccess: () => {
      toast.success("代码生成完成");
      refetchCodes();
    },
    onError: (error) => toast.error("生成失败: " + error.message),
  });

  const generateTable = trpc.table.generate.useMutation({
    onSuccess: () => {
      toast.success("表格生成完成");
      refetchTables();
    },
    onError: (error) => toast.error("生成失败: " + error.message),
  });

  const generateFigure = trpc.figure.generate.useMutation({
    onSuccess: () => {
      toast.success("图形代码生成完成");
      refetchFigures();
    },
    onError: (error) => toast.error("生成失败: " + error.message),
  });

  const generateSection = trpc.manuscript.generateSection.useMutation({
    onSuccess: () => {
      toast.success("论文章节生成完成");
      refetchManuscript();
    },
    onError: (error) => toast.error("生成失败: " + error.message),
  });

  const generateReferences = trpc.pubmed.generateAll.useMutation({
    onSuccess: (data) => {
      toast.success(`文献生成完成: Introduction ${data.introduction}篇, Methods ${data.methods}篇, Discussion ${data.discussion}篇`);
    },
    onError: (error) => toast.error("生成失败: " + error.message),
  });

  const createDataUpload = trpc.dataUpload.create.useMutation({
    onSuccess: () => {
      toast.success("数据上传成功");
      refetchDataUploads();
    },
    onError: (error) => toast.error("上传失败: " + error.message),
  });

  const analyzeData = trpc.dataUpload.analyze.useMutation({
    onSuccess: () => {
      toast.success("数据分析完成");
      refetchDataUploads();
    },
    onError: (error) => toast.error("分析失败: " + error.message),
  });

  const deleteDataUpload = trpc.dataUpload.delete.useMutation({
    onSuccess: () => {
      toast.success("数据已删除");
      refetchDataUploads();
    },
    onError: (error) => toast.error("删除失败: " + error.message),
  });

  const generateAllFiguresAndTables = trpc.autoGenerate.generateAllFiguresAndTables.useMutation({
    onSuccess: () => {
      toast.success("图表自动生成完成");
      refetchTables();
      refetchFigures();
    },
    onError: (error) => toast.error("生成失败: " + error.message),
  });

  const generateFullManuscript = trpc.autoGenerate.generateFullManuscript.useMutation({
    onSuccess: () => {
      toast.success("完整论文生成完成");
      refetchManuscript();
    },
    onError: (error) => toast.error("生成失败: " + error.message),
  });

  useEffect(() => {
    if (proposal?.rawProposal) {
      setProposalText(proposal.rawProposal);
    }
  }, [proposal]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  // 模拟文件上传（实际应该使用S3）
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    // 模拟上传进度
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // 模拟上传延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 创建数据上传记录
      await createDataUpload.mutateAsync({
        projectId,
        fileName: file.name,
        fileUrl: `https://storage.example.com/${file.name}`,
        fileKey: `uploads/${projectId}/${file.name}`,
        fileSize: file.size,
        mimeType: file.type,
      });

      setUploadProgress(100);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      clearInterval(interval);
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // 计算当前步骤
  const getCurrentStep = () => {
    if (!proposal) return 0;
    if (!dataUploads || dataUploads.length === 0) return 1;
    if (!analysisCodes || analysisCodes.length === 0) return 2;
    if (!tables || tables.length === 0 || !figures || figures.length === 0) return 3;
    if (!manuscript) return 4;
    return 5;
  };

  const currentStep = getCurrentStep();

  if (projectLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">项目不存在</h2>
          <Button variant="outline" onClick={() => setLocation("/dashboard")}>
            返回项目列表
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{project.title}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {project.cancerType && <span className="text-primary font-medium">{project.cancerType}</span>}
              {project.cancerType && project.description && " · "}
              {project.description}
            </p>
          </div>
        </div>

        {/* Workflow Progress */}
        <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              {workflowSteps.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div 
                      className={`flex flex-col items-center cursor-pointer transition-all ${
                        isCurrent ? 'scale-110' : ''
                      }`}
                      onClick={() => setActiveTab(step.id === "analysis" ? "code" : step.id === "figures" ? "figures" : step.id)}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                        isCompleted 
                          ? 'bg-green-500 text-white' 
                          : isCurrent 
                            ? 'bg-primary text-white ring-4 ring-primary/20' 
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          <StepIcon className="h-6 w-6" />
                        )}
                      </div>
                      <span className={`text-xs font-medium ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                        {step.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {step.description}
                      </span>
                    </div>
                    {index < workflowSteps.length - 1 && (
                      <div className={`w-16 h-0.5 mx-2 ${
                        index < currentStep ? 'bg-green-500' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="proposal" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">研究方案</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">数据上传</span>
            </TabsTrigger>
            <TabsTrigger value="code" className="gap-2">
              <Code2 className="h-4 w-4" />
              <span className="hidden sm:inline">分析代码</span>
            </TabsTrigger>
            <TabsTrigger value="tables" className="gap-2">
              <Table2 className="h-4 w-4" />
              <span className="hidden sm:inline">表格</span>
            </TabsTrigger>
            <TabsTrigger value="figures" className="gap-2">
              <LineChart className="h-4 w-4" />
              <span className="hidden sm:inline">图形</span>
            </TabsTrigger>
            <TabsTrigger value="manuscript" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">论文</span>
            </TabsTrigger>
            <TabsTrigger value="submission" className="gap-2" onClick={() => setLocation(`/project/${projectId}/submission`)}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">投稿</span>
            </TabsTrigger>
          </TabsList>

          {/* Proposal Tab */}
          <TabsContent value="proposal" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">研究方案输入</CardTitle>
                  <CardDescription>
                    粘贴或输入您的研究方案，AI将自动解析PICO框架和研究设计
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="请输入您的研究方案，例如：&#10;&#10;研究目的：探讨接受手术治疗的早期非小细胞肺癌患者中，术后辅助化疗与单纯手术相比对总生存期的影响。&#10;&#10;研究人群：2010-2018年SEER数据库中诊断为I-II期非小细胞肺癌并接受手术治疗的患者。&#10;&#10;暴露因素：术后辅助化疗&#10;对照组：单纯手术&#10;主要结局：总生存期(OS)&#10;次要结局：癌症特异性生存期(CSS)"
                    value={proposalText}
                    onChange={(e) => setProposalText(e.target.value)}
                    rows={12}
                    className="resize-none"
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => parseProposal.mutate({ projectId, rawProposal: proposalText })}
                      disabled={parseProposal.isPending || !proposalText.trim()}
                      className="flex-1"
                    >
                      {parseProposal.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      解析研究方案
                    </Button>
                    {proposal && (
                      <Button 
                        variant="outline"
                        onClick={() => generateBlueprint.mutate({ projectId })}
                        disabled={generateBlueprint.isPending}
                      >
                        {generateBlueprint.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        生成方法学蓝图
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Parsed Result */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    解析结果
                    {proposal && <Badge variant="secondary" className="bg-green-100 text-green-700">已解析</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {proposal ? (
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4">
                        {/* PICO Framework */}
                        <div className="p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
                          <h4 className="font-semibold mb-3">PICO/PECO 框架</h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Population:</span>
                              <p className="font-medium">{proposal.population}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Intervention/Exposure:</span>
                              <p className="font-medium">{proposal.intervention || proposal.exposure}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Comparator:</span>
                              <p className="font-medium">{proposal.comparator}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Outcome:</span>
                              <p className="font-medium">{proposal.outcome}</p>
                            </div>
                          </div>
                        </div>

                        {/* Study Design */}
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm text-muted-foreground">研究设计：</span>
                          <Badge className="ml-2">{proposal.studyDesign}</Badge>
                        </div>

                        {/* Inclusion/Exclusion */}
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium text-green-600">纳入标准：</span>
                            <p className="text-sm mt-1">{proposal.inclusionCriteria}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-red-600">排除标准：</span>
                            <p className="text-sm mt-1">{proposal.exclusionCriteria}</p>
                          </div>
                        </div>

                        {/* Statistical Model */}
                        <div>
                          <span className="text-sm font-medium">推荐统计模型：</span>
                          <p className="text-sm mt-1">{proposal.statisticalModel}</p>
                        </div>

                        {/* Potential Biases */}
                        {Array.isArray(proposal.potentialBiases) && proposal.potentialBiases.length > 0 && (
                          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              潜在偏倚风险
                            </h4>
                            <div className="space-y-2">
                              {(proposal.potentialBiases as Array<{type: string; description: string; mitigation: string}>).map((bias, i) => (
                                <div key={i} className="text-sm">
                                  <span className="font-medium text-yellow-700">{bias.type}:</span>
                                  <span className="text-yellow-600 ml-1">{bias.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mb-4 opacity-50" />
                      <p>输入研究方案后点击解析</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Data Upload Tab */}
          <TabsContent value="data" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Upload Area */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    数据上传
                  </CardTitle>
                  <CardDescription>
                    上传您的SEER数据文件（支持CSV、Excel格式）
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isUploading ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                    }`}
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {isUploading ? (
                      <div className="space-y-4">
                        <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                        <div className="space-y-2">
                          <p className="text-sm font-medium">正在上传...</p>
                          <Progress value={uploadProgress} className="w-48 mx-auto" />
                          <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-sm font-medium mb-2">点击或拖拽文件到此处上传</p>
                        <p className="text-xs text-muted-foreground">支持 CSV, Excel (.xlsx, .xls) 格式</p>
                      </>
                    )}
                  </div>

                  {/* Auto Generate Button */}
                  {dataUploads && dataUploads.length > 0 && proposal && (
                    <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary" />
                            一键生成图表和论文
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            自动生成6个图表（含Flow Chart和Table 1）+ 5000字论文
                          </p>
                        </div>
                        <Button 
                          onClick={async () => {
                            await generateAllFiguresAndTables.mutateAsync({ projectId });
                            await generateFullManuscript.mutateAsync({ projectId });
                          }}
                          disabled={generateAllFiguresAndTables.isPending || generateFullManuscript.isPending}
                        >
                          {(generateAllFiguresAndTables.isPending || generateFullManuscript.isPending) ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                          )}
                          一键生成
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Uploaded Files */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    已上传数据
                    {dataUploads && dataUploads.length > 0 && (
                      <Badge variant="secondary">{dataUploads.length} 个文件</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dataUploads && dataUploads.length > 0 ? (
                    <div className="space-y-4">
                      {dataUploads.map((upload) => (
                        <div key={upload.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <FileSpreadsheet className="h-8 w-8 text-green-600" />
                              <div>
                                <p className="font-medium">{upload.fileName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {upload.fileSize ? `${(upload.fileSize / 1024).toFixed(1)} KB` : '未知大小'}
                                  {upload.status && ` · ${upload.status === 'analyzed' ? '已分析' : upload.status === 'processing' ? '分析中' : '待分析'}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {upload.status !== 'analyzed' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => analyzeData.mutate({ id: upload.id, projectId })}
                                  disabled={analyzeData.isPending}
                                >
                                  {analyzeData.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Play className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => deleteDataUpload.mutate({ id: upload.id, projectId })}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>

                          {/* Data Summary */}
                          {upload.status === 'analyzed' && upload.totalRows && (
                            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                              <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                                <div>
                                  <span className="text-muted-foreground">总行数:</span>
                                  <span className="ml-2 font-medium">{upload.totalRows?.toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">总列数:</span>
                                  <span className="ml-2 font-medium">{upload.totalColumns}</span>
                                </div>
                                <div>
                                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    已分析
                                  </Badge>
                                </div>
                              </div>
                              {Array.isArray(upload.columnNames) && upload.columnNames.length > 0 && (
                                <div>
                                  <span className="text-xs text-muted-foreground">列名:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {(upload.columnNames as string[]).slice(0, 10).map((col: string, i: number) => (
                                      <Badge key={i} variant="outline" className="text-xs">{col}</Badge>
                                    ))}
                                    {upload.columnNames.length > 10 && (
                                      <Badge variant="outline" className="text-xs">+{upload.columnNames.length - 10} more</Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Database className="h-12 w-12 mb-4 opacity-50" />
                      <p>暂无上传的数据文件</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Code Tab */}
          <TabsContent value="code" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">分析代码生成</CardTitle>
                    <CardDescription>
                      生成R/Stata分析代码，包括数据清洗、统计分析、图形绑定
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedCodeType} onValueChange={(v) => setSelectedCodeType(v as CodeType)}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="r">R</SelectItem>
                        <SelectItem value="stata">Stata</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedAnalysisType} onValueChange={(v) => setSelectedAnalysisType(v as AnalysisType)}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(analysisTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={() => generateCode.mutate({ projectId, codeType: selectedCodeType, analysisType: selectedAnalysisType })}
                      disabled={generateCode.isPending || !proposal}
                    >
                      {generateCode.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      生成代码
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {analysisCodes && analysisCodes.length > 0 ? (
                  <div className="space-y-4">
                    {analysisCodes.map((code) => (
                      <div key={code.id} className="border rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{code.codeType?.toUpperCase()}</Badge>
                            <Badge>{analysisTypeLabels[code.analysisType as AnalysisType]}</Badge>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(code.code || "")}>
                            <Copy className="h-4 w-4 mr-1" />
                            复制代码
                          </Button>
                        </div>
                        <ScrollArea className="h-64">
                          <pre className="code-block text-xs">{code.code}</pre>
                        </ScrollArea>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Code2 className="h-12 w-12 mb-4 opacity-50" />
                    <p>{proposal ? "选择代码类型和分析类型后生成" : "请先解析研究方案"}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tables Tab */}
          <TabsContent value="tables" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">顶刊标准表格</CardTitle>
                    <CardDescription>
                      生成符合顶刊规范的统计表格
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedTableType} onValueChange={(v) => setSelectedTableType(v as TableType)}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(tableTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={() => generateTable.mutate({ projectId, tableType: selectedTableType })}
                      disabled={generateTable.isPending || !proposal}
                    >
                      {generateTable.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      生成表格
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {tables && tables.length > 0 ? (
                  <div className="space-y-6">
                    {tables.map((table) => (
                      <div key={table.id} className="border rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{tableTypeLabels[table.tableType as TableType]}</Badge>
                            <span className="font-medium text-sm">{table.title}</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(table.markdownContent || "")}>
                            <Copy className="h-4 w-4 mr-1" />
                            复制Markdown
                          </Button>
                        </div>
                        <ScrollArea className="max-h-96">
                          <div className="p-4 prose-bmj" dangerouslySetInnerHTML={{ __html: table.htmlContent || "" }} />
                        </ScrollArea>
                        {table.footnotes && (
                          <div className="px-4 py-2 bg-muted/30 text-xs text-muted-foreground">
                            {table.footnotes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Table2 className="h-12 w-12 mb-4 opacity-50" />
                    <p>{proposal ? "选择表格类型并生成" : "请先解析研究方案"}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Figures Tab */}
          <TabsContent value="figures" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">顶刊风格图形</CardTitle>
                    <CardDescription>
                      生成符合顶刊配色规范的统计图形R代码
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedFigureType} onValueChange={(v) => setSelectedFigureType(v as FigureType)}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(figureTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={() => generateFigure.mutate({ projectId, figureType: selectedFigureType })}
                      disabled={generateFigure.isPending || !proposal}
                    >
                      {generateFigure.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      生成图形代码
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {figures && figures.length > 0 ? (
                  <div className="space-y-6">
                    {figures.map((figure) => (
                      <div key={figure.id} className="border rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{figureTypeLabels[figure.figureType as FigureType]}</Badge>
                            <span className="font-medium text-sm">{figure.title}</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(figure.rCode || "")}>
                            <Copy className="h-4 w-4 mr-1" />
                            复制R代码
                          </Button>
                        </div>
                        <ScrollArea className="h-64">
                          <pre className="code-block text-xs">{figure.rCode}</pre>
                        </ScrollArea>
                        {figure.legend && (
                          <div className="px-4 py-2 bg-muted/30 text-sm">
                            <span className="font-medium">图例说明：</span>
                            <span className="text-muted-foreground">{figure.legend}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <LineChart className="h-12 w-12 mb-4 opacity-50" />
                    <p>{proposal ? "选择图形类型并生成" : "请先解析研究方案"}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manuscript Tab */}
          <TabsContent value="manuscript" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">顶刊标准论文</CardTitle>
                    <CardDescription>
                      生成符合顶刊投稿标准的论文（约5000字，含6个图表）。点击各章节可编辑、扩增或润色。
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedSection} onValueChange={(v) => setSelectedSection(v as ManuscriptSection)}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(sectionLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={() => generateSection.mutate({ projectId, section: selectedSection })}
                      disabled={generateSection.isPending || !proposal}
                    >
                      {generateSection.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      生成章节
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => generateFullManuscript.mutate({ projectId })}
                      disabled={generateFullManuscript.isPending || !proposal}
                    >
                      {generateFullManuscript.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      一键生成完整论文
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {manuscript ? (
                  <div className="space-y-4">
                    {/* Title Section */}
                    {manuscript.title && (
                      <SectionEditor
                        projectId={projectId}
                        section="title"
                        title="Title"
                        content={manuscript.title}
                        onSave={() => refetchManuscript()}
                      />
                    )}

                    {/* Abstract Section */}
                    {manuscript.abstractObjective && (
                      <SectionEditor
                        projectId={projectId}
                        section="abstract"
                        title="Abstract"
                        content={[
                          manuscript.abstractObjective && `Objective: ${manuscript.abstractObjective}`,
                          manuscript.abstractDesign && `Design: ${manuscript.abstractDesign}`,
                          manuscript.abstractSetting && `Setting: ${manuscript.abstractSetting}`,
                          manuscript.abstractParticipants && `Participants: ${manuscript.abstractParticipants}`,
                          manuscript.abstractMainOutcome && `Main outcome measures: ${manuscript.abstractMainOutcome}`,
                          manuscript.abstractResults && `Results: ${manuscript.abstractResults}`,
                          manuscript.abstractConclusions && `Conclusions: ${manuscript.abstractConclusions}`,
                        ].filter(Boolean).join('\n\n')}
                        onSave={() => refetchManuscript()}
                      />
                    )}

                    {/* What is known Section */}
                    {Array.isArray(manuscript.whatIsKnown) && manuscript.whatIsKnown.length > 0 && (
                      <SectionEditor
                        projectId={projectId}
                        section="what_is_known"
                        title="What is already known on this topic"
                        content={(manuscript.whatIsKnown as string[]).join('\n')}
                        onSave={() => refetchManuscript()}
                      />
                    )}

                    {/* What this adds Section */}
                    {Array.isArray(manuscript.whatThisAdds) && manuscript.whatThisAdds.length > 0 && (
                      <SectionEditor
                        projectId={projectId}
                        section="what_this_adds"
                        title="What this study adds"
                        content={(manuscript.whatThisAdds as string[]).join('\n')}
                        onSave={() => refetchManuscript()}
                      />
                    )}

                    {/* Introduction Section */}
                    {manuscript.introduction && (
                      <SectionEditor
                        projectId={projectId}
                        section="introduction"
                        title="Introduction"
                        content={manuscript.introduction}
                        onSave={() => refetchManuscript()}
                      />
                    )}

                    {/* Methods Section */}
                    {manuscript.methodsDataSource && (
                      <SectionEditor
                        projectId={projectId}
                        section="methods"
                        title="Methods"
                        content={manuscript.methodsDataSource}
                        onSave={() => refetchManuscript()}
                      />
                    )}

                    {/* Embedded Tables */}
                    {tables && tables.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Tables</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {tables.slice(0, 3).map((table, i) => (
                              <div key={table.id} className="border rounded-lg overflow-hidden">
                                <div className="px-3 py-2 bg-muted/50 text-sm font-medium">
                                  Table {i + 1}: {table.title}
                                </div>
                                <div className="p-3 text-xs" dangerouslySetInnerHTML={{ __html: table.htmlContent || "" }} />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Results Section */}
                    {manuscript.results && (
                      <SectionEditor
                        projectId={projectId}
                        section="results"
                        title="Results"
                        content={manuscript.results}
                        onSave={() => refetchManuscript()}
                      />
                    )}

                    {/* Embedded Figures */}
                    {figures && figures.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Figures</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {figures.slice(0, 3).map((figure, i) => (
                              <div key={figure.id} className="border rounded-lg overflow-hidden">
                                <div className="px-3 py-2 bg-muted/50 text-sm font-medium">
                                  Figure {i + 1}: {figure.title}
                                </div>
                                <div className="p-3 text-xs text-muted-foreground">
                                  {figure.legend}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Discussion Section */}
                    {manuscript.discussionPrincipal && (
                      <SectionEditor
                        projectId={projectId}
                        section="discussion"
                        title="Discussion"
                        content={manuscript.discussionPrincipal}
                        onSave={() => refetchManuscript()}
                      />
                    )}

                    {/* Full Manuscript Section */}
                    {manuscript.fullManuscript && (
                      <SectionEditor
                        projectId={projectId}
                        section="full"
                        title="完整论文"
                        content={manuscript.fullManuscript}
                        onSave={() => refetchManuscript()}
                      />
                    )}

                    {/* References */}
                    {references && references.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">References</CardTitle>
                          <CardDescription>{references.length} references</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-[300px]">
                            <ol className="list-decimal list-inside text-sm space-y-1">
                              {references.map((ref, i) => (
                                <li key={ref.id} className="text-muted-foreground">
                                  {ref.vancouverCitation}
                                </li>
                              ))}
                            </ol>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mb-4 opacity-50" />
                    <p>{proposal ? "选择章节并生成论文内容，或点击一键生成完整论文" : "请先解析研究方案"}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
