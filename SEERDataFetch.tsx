import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Database,
  Search,
  BarChart3,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Code,
  Download,
  Sparkles,
  Users,
  Calendar,
  Activity,
  ChevronRight,
  Copy,
  RefreshCw
} from "lucide-react";

type AnalysisStep = "idle" | "parsing" | "fetching" | "analyzing" | "generating" | "complete" | "error";

interface ParsedProposal {
  cancerType: string;
  cancerCode: string;
  studyDesign: string;
  population: {
    ageRange: { min: number; max: number } | null;
    sex: string | null;
    race: string[] | null;
    yearRange: { start: number; end: number } | null;
    stage: string[] | null;
  };
  exposureVariables: string[];
  outcomeVariables: string[];
  covariates: string[];
  researchQuestions: string[];
  hypotheses: string[];
}

interface DataResult {
  success: boolean;
  totalRecords: number;
  variables: string[];
  summary: any;
  sampleData: any[];
  dataDescription: string;
}

interface AnalysisResult {
  analysisType: string;
  results: any;
  interpretation: string;
  rCode: string;
  stataCode: string;
}

export default function SEERDataFetch() {
  const { user } = useAuth();
  const [proposal, setProposal] = useState("");
  const [step, setStep] = useState<AnalysisStep>("idle");
  const [progress, setProgress] = useState(0);
  const [parsedProposal, setParsedProposal] = useState<ParsedProposal | null>(null);
  const [dataResult, setDataResult] = useState<DataResult | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [report, setReport] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedAnalysis, setSelectedAnalysis] = useState<number>(0);

  const autoFetchMutation = trpc.seerData.autoFetchAndAnalyze.useMutation({
    onSuccess: (result) => {
      setParsedProposal(result.parsedProposal);
      setDataResult(result.data);
      setAnalysisResults(result.analyses);
      setReport(result.report);
      setStep("complete");
      setProgress(100);
      toast.success("数据抓取和分析完成！");
    },
    onError: (error) => {
      setStep("error");
      toast.error("分析失败: " + error.message);
    },
  });

  const handleStartAnalysis = async () => {
    if (!proposal.trim()) {
      toast.error("请输入研究方案");
      return;
    }

    setStep("parsing");
    setProgress(0);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 500);

    try {
      await autoFetchMutation.mutateAsync({ proposal });
    } finally {
      clearInterval(progressInterval);
    }
  };

  const handleReset = () => {
    setStep("idle");
    setProgress(0);
    setParsedProposal(null);
    setDataResult(null);
    setAnalysisResults([]);
    setReport("");
    setProposal("");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  const getStepStatus = (currentStep: AnalysisStep, targetStep: AnalysisStep) => {
    const steps: AnalysisStep[] = ["parsing", "fetching", "analyzing", "generating", "complete"];
    const currentIndex = steps.indexOf(currentStep);
    const targetIndex = steps.indexOf(targetStep);

    if (currentStep === "error") return "error";
    if (currentIndex > targetIndex) return "complete";
    if (currentIndex === targetIndex) return "active";
    return "pending";
  };

  const studyDesignLabels: Record<string, string> = {
    cohort: "回顾性队列研究",
    case_control: "病例对照研究",
    survival: "生存分析",
    competing_risk: "竞争风险分析",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SEER 数据自动抓取</h1>
            <p className="text-gray-600 mt-1">
              输入研究方案，AI 自动抓取相关 SEER 数据并进行分析
            </p>
          </div>
          {step === "complete" && (
            <Button onClick={handleReset} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              重新开始
            </Button>
          )}
        </div>

        {/* Main Content */}
        {step === "idle" || step === "error" ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-[#dc2626]" />
                输入研究方案
              </CardTitle>
              <CardDescription>
                描述您的研究目标、癌症类型、研究设计和分析需求，AI 将自动解析并抓取相关数据
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={`示例研究方案：

研究目的：探讨乳腺癌患者的生存预后因素

研究设计：回顾性队列研究

纳入标准：
- 2010-2020年诊断的乳腺癌患者
- 年龄18-80岁
- 女性患者

研究变量：
- 暴露因素：肿瘤分期、分级、治疗方式
- 结局变量：总生存期、癌症特异性生存
- 协变量：年龄、种族、婚姻状况

分析方法：
- Kaplan-Meier生存分析
- Cox比例风险回归

研究假设：
- 晚期分期与较差的生存预后相关
- 手术治疗可改善患者生存`}
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />

              {step === "error" && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <span>分析过程中出现错误，请检查研究方案后重试</span>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleStartAnalysis}
                  disabled={!proposal.trim() || autoFetchMutation.isPending}
                  className="bg-[#dc2626] hover:bg-[#b91c1c] gap-2"
                >
                  {autoFetchMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  开始自动抓取和分析
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : step !== "complete" ? (
          /* Progress View */
          <Card>
            <CardHeader>
              <CardTitle>正在处理...</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Progress value={progress} className="h-2" />

              <div className="space-y-4">
                {[
                  { step: "parsing" as const, label: "解析研究方案", icon: Search },
                  { step: "fetching" as const, label: "抓取 SEER 数据", icon: Database },
                  { step: "analyzing" as const, label: "执行统计分析", icon: BarChart3 },
                  { step: "generating" as const, label: "生成分析报告", icon: FileText },
                ].map((item) => {
                  const status = getStepStatus(step, item.step);
                  return (
                    <div
                      key={item.step}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        status === "active"
                          ? "bg-blue-50 border border-blue-200"
                          : status === "complete"
                          ? "bg-green-50 border border-green-200"
                          : "bg-gray-50"
                      }`}
                    >
                      {status === "active" ? (
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                      ) : status === "complete" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <item.icon className="h-5 w-5 text-gray-400" />
                      )}
                      <span
                        className={
                          status === "active"
                            ? "text-blue-900 font-medium"
                            : status === "complete"
                            ? "text-green-900"
                            : "text-gray-500"
                        }
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Results View */
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-[#dc2626]" />
                    <div>
                      <p className="text-2xl font-bold">
                        {dataResult?.totalRecords.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">样本量</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">{parsedProposal?.cancerType}</p>
                      <p className="text-xs text-gray-500">癌症类型</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">{analysisResults.length}</p>
                      <p className="text-xs text-gray-500">分析类型</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold">
                        {studyDesignLabels[parsedProposal?.studyDesign || "cohort"]}
                      </p>
                      <p className="text-xs text-gray-500">研究设计</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">概览</TabsTrigger>
                <TabsTrigger value="data">数据摘要</TabsTrigger>
                <TabsTrigger value="analysis">分析结果</TabsTrigger>
                <TabsTrigger value="code">分析代码</TabsTrigger>
                <TabsTrigger value="report">研究报告</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">研究方案解析</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">研究问题</h4>
                        <ul className="space-y-1">
                          {parsedProposal?.researchQuestions.map((q, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <ChevronRight className="h-4 w-4 text-[#dc2626] shrink-0 mt-0.5" />
                              {q}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">研究假设</h4>
                        <ul className="space-y-1">
                          {parsedProposal?.hypotheses.map((h, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <ChevronRight className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                              {h}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">研究变量</h4>
                        <div className="flex flex-wrap gap-2">
                          {parsedProposal?.exposureVariables.map((v, i) => (
                            <Badge key={i} variant="outline" className="bg-red-50 text-red-700">
                              {v}
                            </Badge>
                          ))}
                          {parsedProposal?.outcomeVariables.map((v, i) => (
                            <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700">
                              {v}
                            </Badge>
                          ))}
                          {parsedProposal?.covariates.map((v, i) => (
                            <Badge key={i} variant="outline" className="bg-gray-50 text-gray-700">
                              {v}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">人群特征</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-500">时间范围</span>
                          </div>
                          <p className="font-medium">
                            {parsedProposal?.population.yearRange
                              ? `${parsedProposal.population.yearRange.start}-${parsedProposal.population.yearRange.end}`
                              : "全部年份"}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-500">年龄范围</span>
                          </div>
                          <p className="font-medium">
                            {parsedProposal?.population.ageRange
                              ? `${parsedProposal.population.ageRange.min}-${parsedProposal.population.ageRange.max}岁`
                              : "全部年龄"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm text-gray-500 mb-2">肿瘤分期</h4>
                        <div className="flex flex-wrap gap-2">
                          {parsedProposal?.population.stage?.map((s, i) => (
                            <Badge key={i} variant="outline">
                              {s}
                            </Badge>
                          )) || <Badge variant="outline">全部分期</Badge>}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm text-gray-500 mb-2">种族</h4>
                        <div className="flex flex-wrap gap-2">
                          {parsedProposal?.population.race?.map((r, i) => (
                            <Badge key={i} variant="outline">
                              {r}
                            </Badge>
                          )) || <Badge variant="outline">全部种族</Badge>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Data Tab */}
              <TabsContent value="data" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">数据摘要</CardTitle>
                    <CardDescription>{dataResult?.dataDescription}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">人口统计学</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">样本量</span>
                            <span className="font-medium">
                              {dataResult?.summary.demographics.n.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">平均年龄</span>
                            <span className="font-medium">
                              {dataResult?.summary.demographics.ageAtDiagnosis.mean}岁
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">中位年龄</span>
                            <span className="font-medium">
                              {dataResult?.summary.demographics.ageAtDiagnosis.median}岁
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">肿瘤特征</h4>
                        <div className="space-y-2 text-sm">
                          {Object.entries(dataResult?.summary.tumorCharacteristics.stage || {}).map(
                            ([stage, count]) => (
                              <div key={stage} className="flex justify-between">
                                <span className="text-gray-500">{stage}</span>
                                <span className="font-medium">
                                  {(count as number).toLocaleString()} (
                                  {(
                                    ((count as number) / (dataResult?.totalRecords || 1)) *
                                    100
                                  ).toFixed(1)}
                                  %)
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">预后结局</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">中位生存</span>
                            <span className="font-medium">
                              {dataResult?.summary.outcomes.survivalMonths.median}个月
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">5年生存率</span>
                            <span className="font-medium">
                              {(dataResult?.summary.outcomes.fiveYearSurvival * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">10年生存率</span>
                            <span className="font-medium">
                              {(dataResult?.summary.outcomes.tenYearSurvival * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analysis Tab */}
              <TabsContent value="analysis" className="mt-4">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">分析类型</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {analysisResults.map((analysis, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedAnalysis(index)}
                              className={`w-full text-left p-3 rounded-lg transition-colors ${
                                selectedAnalysis === index
                                  ? "bg-[#dc2626] text-white"
                                  : "bg-gray-50 hover:bg-gray-100"
                              }`}
                            >
                              <span className="font-medium">{analysis.analysisType}</span>
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="md:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {analysisResults[selectedAnalysis]?.analysisType}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">结果解读</h4>
                          <p className="text-sm text-gray-600">
                            {analysisResults[selectedAnalysis]?.interpretation}
                          </p>
                        </div>

                        {analysisResults[selectedAnalysis]?.results.survival && (
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">生存率</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left py-2">时间点</th>
                                    <th className="text-left py-2">生存率</th>
                                    <th className="text-left py-2">95% CI</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {analysisResults[selectedAnalysis]?.results.survival.survivalRates.map(
                                    (rate: any, i: number) => (
                                      <tr key={i} className="border-b">
                                        <td className="py-2">{rate.time}个月</td>
                                        <td className="py-2">{(rate.rate * 100).toFixed(1)}%</td>
                                        <td className="py-2">
                                          {(rate.ci.lower * 100).toFixed(1)}% -{" "}
                                          {(rate.ci.upper * 100).toFixed(1)}%
                                        </td>
                                      </tr>
                                    )
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {analysisResults[selectedAnalysis]?.results.regression && (
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">回归系数</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left py-2">变量</th>
                                    <th className="text-left py-2">HR</th>
                                    <th className="text-left py-2">95% CI</th>
                                    <th className="text-left py-2">P值</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {analysisResults[
                                    selectedAnalysis
                                  ]?.results.regression.coefficients.map(
                                    (coef: any, i: number) => (
                                      <tr key={i} className="border-b">
                                        <td className="py-2">{coef.variable}</td>
                                        <td className="py-2">{coef.hr.toFixed(2)}</td>
                                        <td className="py-2">
                                          {coef.ci.lower.toFixed(2)} - {coef.ci.upper.toFixed(2)}
                                        </td>
                                        <td className="py-2">
                                          {coef.p < 0.001 ? "<0.001" : coef.p.toFixed(3)}
                                        </td>
                                      </tr>
                                    )
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Code Tab */}
              <TabsContent value="code" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      分析代码
                    </CardTitle>
                    <CardDescription>
                      可复现的 R 和 Stata 代码，用于验证分析结果
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="r">
                      <TabsList>
                        <TabsTrigger value="r">R Code</TabsTrigger>
                        <TabsTrigger value="stata">Stata Code</TabsTrigger>
                      </TabsList>

                      <TabsContent value="r" className="mt-4">
                        <div className="relative">
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2 gap-1"
                            onClick={() =>
                              copyToClipboard(analysisResults[selectedAnalysis]?.rCode || "")
                            }
                          >
                            <Copy className="h-3 w-3" />
                            复制
                          </Button>
                          <ScrollArea className="h-[400px]">
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                              <code>{analysisResults[selectedAnalysis]?.rCode}</code>
                            </pre>
                          </ScrollArea>
                        </div>
                      </TabsContent>

                      <TabsContent value="stata" className="mt-4">
                        <div className="relative">
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2 gap-1"
                            onClick={() =>
                              copyToClipboard(analysisResults[selectedAnalysis]?.stataCode || "")
                            }
                          >
                            <Copy className="h-3 w-3" />
                            复制
                          </Button>
                          <ScrollArea className="h-[400px]">
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                              <code>{analysisResults[selectedAnalysis]?.stataCode}</code>
                            </pre>
                          </ScrollArea>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Report Tab */}
              <TabsContent value="report" className="mt-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          研究报告
                        </CardTitle>
                        <CardDescription>AI 自动生成的研究报告</CardDescription>
                      </div>
                      <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        下载报告
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px]">
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap">{report}</div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
