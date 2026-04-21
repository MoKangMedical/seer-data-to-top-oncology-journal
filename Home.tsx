import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SEERDataIntro from "@/components/SEERDataIntro";
import LatestSEERResearch from "@/components/LatestSEERResearch";
import GlobalDatabasesIntro from "@/components/GlobalDatabasesIntro";
import { 
  ArrowRight, 
  Zap, 
  Database, 
  FileText, 
  BarChart3, 
  Sparkles, 
  BookOpen, 
  Download,
  ExternalLink,
  ChevronRight,
  FileSearch,
  Menu
} from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { useState } from "react";

// 肿瘤顶级期刊数据 - 按影响因子排序
const oncologyJournals = [
  { 
    name: "CA: A Cancer Journal for Clinicians", 
    impactFactor: "254.7", 
    category: "Oncology",
    url: "https://acsjournals.onlinelibrary.wiley.com/journal/15424863",
    color: "#dc2626"
  },
  { 
    name: "JAMA", 
    impactFactor: "120.7", 
    category: "General Medicine",
    url: "https://jamanetwork.com/journals/jama",
    color: "#1e40af"
  },
  { 
    name: "The Lancet", 
    impactFactor: "98.4", 
    category: "General Medicine",
    url: "https://www.thelancet.com/",
    color: "#b91c1c"
  },
  { 
    name: "NEJM", 
    impactFactor: "96.2", 
    category: "General Medicine",
    url: "https://www.nejm.org/",
    color: "#0d9488"
  },
  { 
    name: "Lancet Oncology", 
    impactFactor: "51.1", 
    category: "Oncology",
    url: "https://www.thelancet.com/journals/lanonc/home",
    color: "#b91c1c"
  },
  { 
    name: "Cancer Cell", 
    impactFactor: "50.3", 
    category: "Cancer Biology",
    url: "https://www.cell.com/cancer-cell/home",
    color: "#7c3aed"
  },
  { 
    name: "Journal of Clinical Oncology", 
    impactFactor: "45.3", 
    category: "Clinical Oncology",
    url: "https://ascopubs.org/journal/jco",
    color: "#0891b2"
  },
  { 
    name: "Nature Cancer", 
    impactFactor: "38.7", 
    category: "Cancer Research",
    url: "https://www.nature.com/natcancer/",
    color: "#dc2626"
  },
  { 
    name: "Annals of Oncology", 
    impactFactor: "32.0", 
    category: "Clinical Oncology",
    url: "https://www.annalsofoncology.org/",
    color: "#0d9488"
  },
  { 
    name: "Cancer Discovery", 
    impactFactor: "29.7", 
    category: "Cancer Research",
    url: "https://aacrjournals.org/cancerdiscovery",
    color: "#ea580c"
  },
  { 
    name: "JAMA Oncology", 
    impactFactor: "28.4", 
    category: "Oncology",
    url: "https://jamanetwork.com/journals/jamaoncology",
    color: "#1e40af"
  },
  { 
    name: "Clinical Cancer Research", 
    impactFactor: "11.5", 
    category: "Clinical Oncology",
    url: "https://aacrjournals.org/clincancerres",
    color: "#16a34a"
  },
];

// SEER研究案例数据 - 已验证的真实论文，按影响因子从高到低排列
const seerResearchCases = [
  // JAMA (IF: 120.7)
  {
    journal: "JAMA",
    year: "2020",
    impactFactor: "120.7",
    title: "Association of First Primary Cancer With Risk of Subsequent Primary Cancers Among Survivors in the United States, 2000 to 2016",
    authors: "Sung H, Hyun N, Leach CR, Yabroff KR, Jemal A",
    doi: "10.1001/jama.2020.23130",
    url: "https://jamanetwork.com/journals/jama/fullarticle/2774406",
    citations: "211+",
  },
  // Lancet Oncology (IF: 51.1)
  {
    journal: "Lancet Oncology",
    year: "2011",
    impactFactor: "51.1",
    title: "Proportion of second cancers attributable to radiotherapy treatment in adults: a cohort study in the US SEER cancer registries",
    authors: "de Gonzalez AB, Curtis RE, Kry SF, et al.",
    doi: "10.1016/S1470-2045(11)70061-4",
    url: "https://www.thelancet.com/journals/lanonc/article/PIIS1470-2045(11)70061-4/fulltext",
    citations: "628+",
  },
  // JAMA Oncology (IF: 28.4)
  {
    journal: "JAMA Oncology",
    year: "2025",
    impactFactor: "28.4",
    title: "A SEER Registry–Based Analysis of Pediatric Colorectal Adenocarcinomas",
    authors: "Emile SH, Horesh N, Garoufalia Z, et al.",
    doi: "10.1001/jamaoncol.2024.5223",
    url: "https://jamanetwork.com/journals/jamaoncology/fullarticle/2826671",
    citations: "1+",
  },
  {
    journal: "JAMA Oncology",
    year: "2023",
    impactFactor: "28.4",
    title: "Prevalence of Prior Cancer Among Patients With Newly Diagnosed Cancer in the US",
    authors: "Murphy CC, Gerber DE, Pruitt SL",
    doi: "10.1001/jamaoncol.2023.2158",
    url: "https://jamanetwork.com/journals/jamaoncology/fullarticle/2806272",
    citations: "10+",
  },
  {
    journal: "JAMA Oncology",
    year: "2022",
    impactFactor: "28.4",
    title: "Incidence Trends of Primary Cutaneous T-Cell Lymphoma in the US From 2000-2018",
    authors: "Cai ZR, Chen ML, Weinstock MA, Kim YH, Novoa RA, Lachance K",
    doi: "10.1001/jamaoncol.2022.4077",
    url: "https://jamanetwork.com/journals/jamaoncology/fullarticle/2795982",
    citations: "74+",
  },
  // Journal of Clinical Oncology (IF: 45.3) - ASCO会议摘要
  {
    journal: "JCO",
    year: "2019",
    impactFactor: "45.3",
    title: "Genetic Testing and Results in a Population-Based Cohort of Breast Cancer Patients and Ovarian Cancer Patients",
    authors: "Kurian AW, Ward KC, Howlader N, et al.",
    doi: "10.1200/JCO.18.01854",
    url: "https://pubmed.ncbi.nlm.nih.gov/30964716/",
    citations: "417+",
  },
  // BMJ Open (IF: 3.0) - 保留部分高引用论文
  {
    journal: "BMJ Open",
    year: "2025",
    impactFactor: "3.0",
    title: "Examining the relationship between incidence and mortality for commonly diagnosed cancers in the USA: an observational study using population-based SEER database",
    authors: "Adamson AS, Patel VR, Welch HG",
    doi: "10.1136/bmjopen-2024-084955",
    url: "https://bmjopen.bmj.com/content/15/2/e084955",
    citations: "1+",
  },
  {
    journal: "BMJ Open",
    year: "2015",
    impactFactor: "3.0",
    title: "Do US thyroid cancer incidence rates increase with socioeconomic status among people with health insurance? An observational study using SEER population-based data",
    authors: "Altekruse S, Das A, Cho H, Petkov V, Yu M",
    doi: "10.1136/bmjopen-2015-009843",
    url: "https://bmjopen.bmj.com/content/5/12/e009843",
    citations: "50+",
  },
];

// 按影响因子排序
const sortedResearchCases = [...seerResearchCases].sort((a, b) => 
  parseFloat(b.impactFactor) - parseFloat(a.impactFactor)
);

// 核心功能数据
const coreFeatures = [
  {
    icon: Database,
    title: "SEER 数据管理",
    description: "内置 SEER 数据集或上传自定义数据",
    color: "text-[#dc2626]",
    bgColor: "bg-[#dc2626]/10",
  },
  {
    icon: FileSearch,
    title: "研究方案解析",
    description: "自动识别 PICO/PECO、研究设计类型",
    color: "text-[#dc2626]",
    bgColor: "bg-[#dc2626]/10",
  },
  {
    icon: BarChart3,
    title: "统计分析引擎",
    description: "执行回归分析，生成期刊标准表格",
    color: "text-[#dc2626]",
    bgColor: "bg-[#dc2626]/10",
  },
  {
    icon: Sparkles,
    title: "AI 论文撰写",
    description: "自动生成完整顶刊格式论文",
    color: "text-[#dc2626]",
    bgColor: "bg-[#dc2626]/10",
  },
  {
    icon: BookOpen,
    title: "参考文献管理",
    description: "PubMed 自动检索与格式化引用",
    color: "text-[#dc2626]",
    bgColor: "bg-[#dc2626]/10",
  },
  {
    icon: Download,
    title: "一键下载",
    description: "打包下载论文、图表、声明等附件",
    color: "text-[#dc2626]",
    bgColor: "bg-[#dc2626]/10",
  },
];

// 工作流程步骤
const workflowSteps = [
  { number: 1, title: "上传研究方案", description: "粘贴或上传研究设计文档" },
  { number: 2, title: "数据分析", description: "AI 执行统计分析并生成表格" },
  { number: 3, title: "图表生成", description: "生成顶刊风格专业图表" },
  { number: 4, title: "论文撰写", description: "AI 自动撰写完整论文初稿" },
  { number: 5, title: "下载投稿", description: "一键下载并连接期刊投稿系统" },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Navigation - 肿瘤红色主题 */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo Text Only */}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-[#dc2626]">SEER</span>
              <span className="text-gray-400">→</span>
              <span className="text-xl font-bold text-gray-900">Oncology</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#seer-intro" className="text-gray-600 hover:text-[#dc2626] transition-colors">
                SEER数据
              </a>
              <a href="#global-databases" className="text-gray-600 hover:text-[#dc2626] transition-colors">
                全球数据库
              </a>
              <a href="#journals" className="text-gray-600 hover:text-[#dc2626] transition-colors">
                期刊列表
              </a>
              <a href="#workflow" className="text-gray-600 hover:text-[#dc2626] transition-colors">
                工作流程
              </a>
              <a href="#features" className="text-gray-600 hover:text-[#dc2626] transition-colors">
                核心功能
              </a>
              <Link href="/pricing" className="text-gray-600 hover:text-[#dc2626] transition-colors">
                定价
              </Link>
            </div>

            {/* CTA Button */}
            <div className="flex items-center gap-4">
              <button 
                className="md:hidden p-2 text-gray-600"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="h-6 w-6" />
              </button>
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button className="bg-[#dc2626] hover:bg-[#b91c1c] text-white">
                    进入工作台
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button className="bg-[#dc2626] hover:bg-[#b91c1c] text-white">
                    登录 / 注册
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col gap-4">
                <a href="#seer-intro" className="text-gray-600 hover:text-[#dc2626]">SEER数据</a>
                <a href="#global-databases" className="text-gray-600 hover:text-[#dc2626]">全球数据库</a>
                <a href="#journals" className="text-gray-600 hover:text-[#dc2626]">期刊列表</a>
                <a href="#workflow" className="text-gray-600 hover:text-[#dc2626]">工作流程</a>
                <a href="#features" className="text-gray-600 hover:text-[#dc2626]">核心功能</a>
                <Link href="/pricing" className="text-gray-600 hover:text-[#dc2626]">定价</Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section - 肿瘤红色主题 */}
      <section className="relative py-20 md:py-32 bg-gradient-to-b from-[#dc2626]/5 to-white overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          {/* Badge */}
          <Badge className="bg-[#dc2626]/10 text-[#dc2626] hover:bg-[#dc2626]/20 mb-6 px-4 py-2">
            <Zap className="w-4 h-4 mr-2" />
            AI 驱动 · 一键生成 · 顶刊标准
          </Badge>

          {/* Main Title */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-black text-[#dc2626] tracking-tight mb-4">
              SEER Data
            </h1>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-16 bg-gray-300"></div>
              <ArrowRight className="w-8 h-8 text-gray-400" />
              <div className="h-px w-16 bg-gray-300"></div>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight">
              Oncology Top Journal
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            从 SEER 数据到 <span className="text-[#dc2626] font-semibold">肿瘤顶级期刊</span>，AI 全流程辅助您完成高质量癌症研究
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-10">
            <Card className="bg-white/80 backdrop-blur border-gray-100">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-[#dc2626]">12+</div>
                <div className="text-sm text-gray-500">肿瘤顶级期刊</div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur border-gray-100">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-[#dc2626]">254.7</div>
                <div className="text-sm text-gray-500">最高影响因子</div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur border-gray-100">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-[#dc2626]">5min</div>
                <div className="text-sm text-gray-500">论文生成时间</div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur border-gray-100">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-[#dc2626]">100%</div>
                <div className="text-sm text-gray-500">顶刊标准合规</div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" className="bg-[#dc2626] hover:bg-[#b91c1c] text-white shadow-lg px-8">
                  进入工作台
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="bg-[#dc2626] hover:bg-[#b91c1c] text-white shadow-lg px-8">
                  免费开始使用
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            )}
            <a href="#journals">
              <Button size="lg" variant="outline" className="border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626]/10 px-8">
                浏览肿瘤顶刊
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* SEER Data Introduction Section */}
      <div id="seer-intro">
        <SEERDataIntro />
      </div>

      {/* Global Cancer Databases Section */}
      <div id="global-databases">
        <GlobalDatabasesIntro />
      </div>

      {/* Latest SEER Research Section */}
      <LatestSEERResearch />

      {/* Oncology Journals Section */}
      <section id="journals" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-[#dc2626]/10 text-[#dc2626] hover:bg-[#dc2626]/20 mb-4">
              肿瘤顶刊
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              肿瘤学顶级期刊
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              覆盖综合医学顶刊和肿瘤学专科顶刊，按影响因子排序
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {oncologyJournals.map((journal, index) => (
              <a 
                key={index}
                href={journal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
                  {/* Journal Cover */}
                  <div 
                    className="h-32 flex items-center justify-center relative"
                    style={{ backgroundColor: journal.color }}
                  >
                    <span className="text-white font-bold text-sm text-center px-3 leading-tight">
                      {journal.name}
                    </span>
                    <div className="absolute top-2 right-2 bg-white/90 rounded px-2 py-1">
                      <span className="text-xs font-bold" style={{ color: journal.color }}>
                        IF: {journal.impactFactor}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-[#dc2626] transition-colors line-clamp-2">
                      {journal.name}
                    </h3>
                    <p className="text-xs text-gray-500">{journal.category}</p>
                    <div className="mt-2 flex items-center text-xs text-[#dc2626] opacity-0 group-hover:opacity-100 transition-opacity">
                      访问期刊 <ExternalLink className="ml-1 h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>

          <div className="text-center mt-8">
            <a 
              href="https://www.scimagojr.com/journalrank.php?category=2730" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-[#dc2626] hover:underline"
            >
              查看更多肿瘤学期刊排名 <ExternalLink className="ml-1 h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-20 bg-gray-50/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-[#dc2626]/10 text-[#dc2626] hover:bg-[#dc2626]/20 mb-4">
              工作流程
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              五步完成顶刊论文
            </h2>
            <p className="text-gray-600">简单高效的研究流程</p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2">
            {workflowSteps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center text-center w-40">
                  <div className="w-16 h-16 rounded-full bg-[#dc2626] text-white flex items-center justify-center text-2xl font-bold mb-3 shadow-md">
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
                {index < workflowSteps.length - 1 && (
                  <ChevronRight className="hidden md:block w-6 h-6 text-gray-300 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-[#dc2626]/10 text-[#dc2626] hover:bg-[#dc2626]/20 mb-4">
              核心功能
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              一站式研究解决方案
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              从数据上传到论文投稿，AI 全程辅助您完成高质量癌症研究
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreFeatures.map((feature, index) => (
              <Card key={index} className="border border-gray-100 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SEER Research Cases Section - 按影响因子排序 */}
      <section id="cases" className="py-20 bg-gray-50/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-[#dc2626]/10 text-[#dc2626] hover:bg-[#dc2626]/20 mb-4">
              SEER 研究案例
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              已发表的 SEER 研究
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              基于 SEER 数据在肿瘤顶级期刊发表的高影响力研究（按影响因子排序）
            </p>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            {sortedResearchCases.map((research, index) => (
              <Card key={index} className="border border-gray-100 hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <Badge className="bg-[#dc2626] text-white hover:bg-[#b91c1c]">
                      {research.journal}
                    </Badge>
                    <Badge variant="outline" className="text-[#dc2626] border-[#dc2626] font-bold">
                      IF: {research.impactFactor}
                    </Badge>
                    <span className="text-sm text-gray-500">{research.year}</span>
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      {research.citations} 引用
                    </Badge>
                  </div>
                  
                  <a 
                    href={research.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-[#dc2626] transition-colors">
                      {research.title}
                    </h3>
                  </a>
                  
                  <p className="text-sm text-gray-600 mb-3">{research.authors}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">DOI: {research.doi}</span>
                    <div className="flex gap-2">
                      <a 
                        href={research.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="outline" className="text-[#dc2626] border-[#dc2626] hover:bg-[#dc2626] hover:text-white">
                          原文 <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </a>
                      <a 
                        href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(research.doi)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white">
                          PubMed <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <a 
              href="https://pubmed.ncbi.nlm.nih.gov/?term=SEER+database+cancer" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-[#dc2626] hover:underline"
            >
              在 PubMed 搜索更多 SEER 研究 <ExternalLink className="ml-1 h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#dc2626] via-[#b91c1c] to-[#991b1b] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            准备好开始您的 SEER 研究了吗？
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            加入我们，让 AI 帮助您更高效地完成高质量癌症研究，冲击肿瘤顶级期刊
          </p>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="lg" className="bg-white text-[#dc2626] hover:bg-gray-100 shadow-lg px-8">
                进入工作台
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button size="lg" className="bg-white text-[#dc2626] hover:bg-gray-100 shadow-lg px-8">
                免费开始使用
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-[#dc2626]">SEER</span>
              <span className="text-gray-500">→</span>
              <span className="text-xl font-bold text-white">Oncology Top Journal</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="https://seer.cancer.gov/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                SEER Database
              </a>
              <a href="https://pubmed.ncbi.nlm.nih.gov/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                PubMed
              </a>
              <a href="https://www.cancer.gov/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                NCI
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>© 2026 SEER to Oncology Top Journal Platform. All rights reserved.</p>
            <p className="mt-2 text-gray-500">
              本平台仅提供研究辅助工具，不代表任何期刊或 NCI 官方立场
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
