import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Database,
  TrendingUp,
  Users,
  Calendar,
  FileText,
  ExternalLink,
  BarChart3,
  Activity,
  MapPin,
  BookOpen,
  Award
} from "lucide-react";

// 数据库信息
const databases = {
  gbd: {
    name: "GBD",
    fullName: "Global Burden of Disease",
    organization: "Institute for Health Metrics and Evaluation (IHME)",
    icon: Globe,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
    borderColor: "border-blue-200",
    description: "Global Burden of Disease (GBD) 研究是由华盛顿大学健康指标与评估研究所（IHME）主导的全球最全面的流行病学研究项目。该研究系统性地量化了全球204个国家和地区的疾病负担，涵盖369种疾病和伤害、87种风险因素。GBD数据库提供了从1990年至今的长期趋势数据，是评估全球健康状况变化的金标准。",
    metrics: [
      { label: "发病率 (Incidence)", desc: "新发病例数及年龄标准化发病率" },
      { label: "患病率 (Prevalence)", desc: "现患病例数及比例" },
      { label: "死亡率 (Mortality)", desc: "死亡人数及年龄标准化死亡率" },
      { label: "伤残调整生命年 (DALYs)", desc: "综合衡量疾病负担的指标" },
      { label: "风险因素归因", desc: "各风险因素对疾病负担的贡献" },
    ],
    stats: [
      { value: "204", label: "国家和地区", icon: MapPin },
      { value: "30+", label: "癌症类型", icon: Activity },
      { value: "1990-2023", label: "时间跨度", icon: Calendar },
    ],
    papers: { total: 10, lancet: 5, ca: 0 },
    url: "https://vizhub.healthdata.org/gbd-results/",
  },
  globocan: {
    name: "GLOBOCAN",
    fullName: "Global Cancer Observatory",
    organization: "International Agency for Research on Cancer (IARC)",
    icon: BarChart3,
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-600",
    borderColor: "border-emerald-200",
    description: "GLOBOCAN 是由世界卫生组织国际癌症研究机构（IARC）开发和维护的全球癌症统计数据库。该数据库提供了185个国家和地区36种癌症类型的发病率、死亡率和患病率估计。GLOBOCAN每两年更新一次，是全球癌症流行病学研究的重要参考来源，被广泛应用于政策制定和资源分配。",
    metrics: [
      { label: "全球覆盖", desc: "185个国家和地区的癌症数据" },
      { label: "多维度分析", desc: "按性别、年龄、癌症类型分层" },
      { label: "标准化方法", desc: "统一的估算方法确保数据可比性" },
      { label: "交互式可视化", desc: "在线工具支持自定义数据查询" },
      { label: "定期更新", desc: "每两年发布最新全球癌症统计" },
    ],
    stats: [
      { value: "20.0M", label: "新发癌症病例", icon: Users },
      { value: "9.7M", label: "癌症死亡人数", icon: Activity },
      { value: "185", label: "国家和地区", icon: MapPin },
    ],
    papers: { total: 9, lancet: 1, ca: 3 },
    url: "https://gco.iarc.fr/",
  },
  ci5: {
    name: "CI5",
    fullName: "Cancer Incidence in Five Continents",
    organization: "International Agency for Research on Cancer (IARC)",
    icon: Database,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    textColor: "text-purple-600",
    borderColor: "border-purple-200",
    description: "Cancer Incidence in Five Continents (CI5) 是IARC自1966年以来持续发布的权威癌症登记数据汇编。该系列数据库收集了全球高质量人群基础癌症登记处的详细发病率数据，是研究全球癌症发病率地理差异和时间趋势的金标准数据源。CI5数据以其严格的质量控制标准和详细的分层数据而闻名。",
    metrics: [
      { label: "高质量数据", desc: "仅纳入符合严格质量标准的登记处数据" },
      { label: "详细分层", desc: "按性别、年龄组、癌症部位分层" },
      { label: "长期趋势", desc: "跨越60多年的历史数据" },
      { label: "国际可比", desc: "统一的编码标准（ICD-O）" },
      { label: "开放获取", desc: "CI5plus提供免费数据查询下载" },
    ],
    stats: [
      { value: "XII", label: "最新卷册", icon: BookOpen },
      { value: "600+", label: "癌症登记处", icon: Database },
      { value: "60+年", label: "时间跨度", icon: Calendar },
    ],
    papers: { total: 5, lancet: 1, ca: 0 },
    url: "https://ci5.iarc.fr/",
  },
};

// 数据库对比表格数据
const comparisonData = [
  { feature: "数据类型", gbd: "发病、死亡、DALYs、风险归因", globocan: "发病、死亡、患病", ci5: "发病率（详细分层）" },
  { feature: "地理覆盖", gbd: "204个国家/地区", globocan: "185个国家/地区", ci5: "600+癌症登记处" },
  { feature: "时间范围", gbd: "1990-2023", globocan: "2022（每2年更新）", ci5: "1960s-2017" },
  { feature: "数据来源", gbd: "综合估算（多源数据建模）", globocan: "估算（基于登记和建模）", ci5: "实际登记数据" },
  { feature: "适用场景", gbd: "疾病负担、风险因素分析", globocan: "全球癌症概况、国家比较", ci5: "详细发病率、时间趋势" },
  { feature: "数据质量", gbd: "建模估算，覆盖全面", globocan: "标准化估算", ci5: "高质量实测数据" },
];

export default function GlobalDatabasesIntro() {
  const [activeTab, setActiveTab] = useState("gbd");

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 px-4 py-1.5 text-[#dc2626] border-[#dc2626]/30 bg-red-50">
            <Database className="w-3.5 h-3.5 mr-1.5" />
            全球权威数据源
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            三大全球癌症数据库
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            整合GBD、GLOBOCAN、CI5三大权威数据源，为您的流行病学研究提供全面支撑
          </p>
        </div>

        {/* Database Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            {Object.entries(databases).map(([key, db]) => (
              <TabsTrigger
                key={key}
                value={key}
                className={`data-[state=active]:${db.textColor} data-[state=active]:shadow-sm`}
              >
                <db.icon className="w-4 h-4 mr-2" />
                {db.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(databases).map(([key, db]) => (
            <TabsContent key={key} value={key} className="mt-0">
              <Card className={`border-2 ${db.borderColor} overflow-hidden`}>
                {/* Header with gradient */}
                <div className={`bg-gradient-to-r ${db.color} p-6 text-white`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <db.icon className="w-8 h-8" />
                        <div>
                          <h3 className="text-2xl font-bold">{db.fullName}</h3>
                          <p className="text-white/80 text-sm">{db.organization}</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/20 hover:bg-white/30 text-white border-0"
                      onClick={() => window.open(db.url, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      访问数据库
                    </Button>
                  </div>
                </div>

                <CardContent className="p-6">
                  {/* Description */}
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {db.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {db.stats.map((stat, index) => (
                      <div
                        key={index}
                        className={`${db.bgColor} rounded-xl p-4 text-center`}
                      >
                        <stat.icon className={`w-5 h-5 ${db.textColor} mx-auto mb-2`} />
                        <div className={`text-2xl font-bold ${db.textColor}`}>
                          {stat.value}
                        </div>
                        <div className="text-sm text-gray-600">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Metrics */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <TrendingUp className={`w-4 h-4 ${db.textColor}`} />
                      核心指标与特点
                    </h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {db.metrics.map((metric, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${db.textColor.replace('text', 'bg')} mt-2`} />
                          <div>
                            <span className="font-medium text-gray-900">{metric.label}</span>
                            <span className="text-gray-500 text-sm ml-1">- {metric.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Papers */}
                  <div className={`${db.bgColor} rounded-xl p-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className={`w-5 h-5 ${db.textColor}`} />
                        <span className="font-medium text-gray-900">代表性论文</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`${db.borderColor} ${db.textColor}`}>
                          共 {db.papers.total} 篇
                        </Badge>
                        <Badge className={`bg-gradient-to-r ${db.color} text-white border-0`}>
                          <Award className="w-3 h-3 mr-1" />
                          {db.papers.lancet} 篇 Lancet
                        </Badge>
                        {db.papers.ca > 0 && (
                          <Badge variant="outline" className="border-amber-300 text-amber-600 bg-amber-50">
                            {db.papers.ca} 篇 CA期刊
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Comparison Table */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
            数据库对比
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-4 font-semibold text-gray-700 border-b-2 border-gray-200">
                    特征
                  </th>
                  <th className="text-center p-4 font-semibold text-blue-600 border-b-2 border-blue-200 bg-blue-50">
                    <div className="flex items-center justify-center gap-2">
                      <Globe className="w-4 h-4" />
                      GBD
                    </div>
                  </th>
                  <th className="text-center p-4 font-semibold text-emerald-600 border-b-2 border-emerald-200 bg-emerald-50">
                    <div className="flex items-center justify-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      GLOBOCAN
                    </div>
                  </th>
                  <th className="text-center p-4 font-semibold text-purple-600 border-b-2 border-purple-200 bg-purple-50">
                    <div className="flex items-center justify-center gap-2">
                      <Database className="w-4 h-4" />
                      CI5
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="p-4 font-medium text-gray-700 border-b border-gray-200">
                      {row.feature}
                    </td>
                    <td className="p-4 text-center text-gray-600 border-b border-gray-200 text-sm">
                      {row.gbd}
                    </td>
                    <td className="p-4 text-center text-gray-600 border-b border-gray-200 text-sm">
                      {row.globocan}
                    </td>
                    <td className="p-4 text-center text-gray-600 border-b border-gray-200 text-sm">
                      {row.ci5}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Card className="text-center border-2 border-[#dc2626]/20 bg-gradient-to-br from-red-50 to-white">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-[#dc2626] mb-2">24</div>
              <div className="text-gray-600">代表性论文总数</div>
              <div className="text-sm text-gray-500 mt-1">覆盖多个顶级期刊</div>
            </CardContent>
          </Card>
          <Card className="text-center border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-amber-600 mb-2">7</div>
              <div className="text-gray-600">Lancet系列论文</div>
              <div className="text-sm text-gray-500 mt-1">最权威的医学期刊</div>
            </CardContent>
          </Card>
          <Card className="text-center border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">250K+</div>
              <div className="text-gray-600">总引用次数</div>
              <div className="text-sm text-gray-500 mt-1">GLOBOCAN 2018单篇超10万</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
