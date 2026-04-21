import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  Users, 
  MapPin, 
  Calendar, 
  Activity,
  TrendingUp,
  FileText,
  BarChart3,
  ArrowRight,
  Globe,
  Building2
} from "lucide-react";

// SEER数据库统计数据
const seerStats = [
  {
    icon: Users,
    value: "48%",
    label: "美国人口覆盖",
    description: "覆盖美国近一半人口的癌症数据",
    color: "text-blue-600",
    bgColor: "bg-blue-100"
  },
  {
    icon: Calendar,
    value: "1973-2021",
    label: "数据时间跨度",
    description: "近50年的癌症发病和生存数据",
    color: "text-green-600",
    bgColor: "bg-green-100"
  },
  {
    icon: FileText,
    value: "1200万+",
    label: "癌症病例",
    description: "超过1200万例癌症病例记录",
    color: "text-purple-600",
    bgColor: "bg-purple-100"
  },
  {
    icon: Activity,
    value: "100+",
    label: "癌症类型",
    description: "涵盖所有主要癌症类型",
    color: "text-orange-600",
    bgColor: "bg-orange-100"
  }
];

// 癌症类型分布数据
const cancerDistribution = [
  { name: "乳腺癌", percentage: 15.3, color: "#ec4899" },
  { name: "肺癌", percentage: 12.4, color: "#6366f1" },
  { name: "前列腺癌", percentage: 11.6, color: "#3b82f6" },
  { name: "结直肠癌", percentage: 8.2, color: "#22c55e" },
  { name: "黑色素瘤", percentage: 5.5, color: "#f59e0b" },
  { name: "膀胱癌", percentage: 4.6, color: "#14b8a6" },
  { name: "其他", percentage: 42.4, color: "#94a3b8" }
];

// SEER注册处地理分布
const seerRegistries = [
  { name: "加利福尼亚", regions: ["旧金山", "洛杉矶", "圣何塞-蒙特利"] },
  { name: "东北部", regions: ["康涅狄格", "新泽西", "纽约"] },
  { name: "中西部", regions: ["底特律", "爱荷华", "犹他"] },
  { name: "东南部", regions: ["亚特兰大", "肯塔基", "路易斯安那"] },
  { name: "西部", regions: ["西雅图", "新墨西哥", "夏威夷", "阿拉斯加"] }
];

export function SEERDataIntro() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 mb-4">
            <Database className="w-4 h-4 mr-2" />
            SEER 数据库
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            什么是 SEER 数据库？
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg">
            SEER（Surveillance, Epidemiology, and End Results）是美国国家癌症研究所（NCI）维护的
            <span className="font-semibold text-[#dc2626]">权威癌症统计数据库</span>，
            是全球癌症流行病学研究的金标准数据源
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {seerStats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <div className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center mx-auto mb-3`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-gray-700 mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-gray-500">
                  {stat.description}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content: Flow Chart and Distribution */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* SEER Data Flow Chart */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  SEER 数据收集流程
                </h3>
              </div>
              <div className="p-6">
                {/* Flow Chart SVG */}
                <div className="relative">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold text-blue-900">医疗机构</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          医院、诊所、病理实验室报告新诊断的癌症病例
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  <div className="flex justify-center mb-4">
                    <ArrowRight className="w-6 h-6 text-gray-400 rotate-90" />
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-green-900">SEER 注册处</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          22个地区注册处收集、验证和标准化癌症数据
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center mb-4">
                    <ArrowRight className="w-6 h-6 text-gray-400 rotate-90" />
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="w-5 h-5 text-purple-600" />
                          <span className="font-semibold text-purple-900">NCI SEER 数据库</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          国家癌症研究所整合所有数据，进行质量控制
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center mb-4">
                    <ArrowRight className="w-6 h-6 text-gray-400 rotate-90" />
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#dc2626] text-white flex items-center justify-center font-bold shrink-0">
                      4
                    </div>
                    <div className="flex-1">
                      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Globe className="w-5 h-5 text-[#dc2626]" />
                          <span className="font-semibold text-red-900">研究者访问</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          全球研究者可申请访问数据进行癌症研究
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cancer Distribution Chart */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-[#dc2626] to-[#b91c1c] text-white p-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  SEER 癌症类型分布
                </h3>
              </div>
              <div className="p-6">
                {/* Bar Chart */}
                <div className="space-y-4">
                  {cancerDistribution.map((cancer, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700">{cancer.name}</span>
                        <span className="text-gray-500">{cancer.percentage}%</span>
                      </div>
                      <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(cancer.percentage / 42.4) * 100}%`,
                            backgroundColor: cancer.color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 text-center">
                    数据来源：SEER Cancer Statistics Review 2021
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Geographic Coverage */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                SEER 注册处地理分布
              </h3>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-5 gap-4">
                {seerRegistries.map((region, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#dc2626]" />
                      {region.name}
                    </h4>
                    <ul className="space-y-1">
                      {region.regions.map((r, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Map Placeholder - 可以替换为实际地图 */}
              <div className="mt-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-8 text-center">
                <div className="inline-flex items-center gap-2 text-blue-700 mb-2">
                  <Globe className="w-6 h-6" />
                  <span className="font-semibold">覆盖美国 22 个州/地区</span>
                </div>
                <p className="text-sm text-blue-600">
                  SEER 数据代表了美国约 48% 人口的癌症发病和生存情况
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Variables */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            SEER 数据库包含的关键变量
          </h3>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              {
                title: "人口统计学",
                items: ["年龄", "性别", "种族/民族", "婚姻状况"],
                color: "blue"
              },
              {
                title: "肿瘤特征",
                items: ["原发部位", "组织学类型", "分级", "分期"],
                color: "green"
              },
              {
                title: "治疗信息",
                items: ["手术", "放疗", "化疗", "治疗顺序"],
                color: "purple"
              },
              {
                title: "预后数据",
                items: ["生存时间", "死亡原因", "随访状态", "第二原发癌"],
                color: "orange"
              }
            ].map((category, index) => (
              <Card key={index} className={`border-0 shadow-sm bg-${category.color}-50`}>
                <CardContent className="p-4">
                  <h4 className={`font-semibold text-${category.color}-900 mb-3`}>
                    {category.title}
                  </h4>
                  <ul className="space-y-2">
                    {category.items.map((item, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full bg-${category.color}-500`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default SEERDataIntro;
