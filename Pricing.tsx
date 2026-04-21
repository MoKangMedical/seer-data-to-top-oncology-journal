import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Check, 
  Crown, 
  Sparkles, 
  FileText, 
  Database, 
  Image as ImageIcon,
  Zap,
  Info,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

// Plus会员订阅方案
const plusPlans = [
  {
    id: 1,
    duration: 3,
    durationText: "3个月",
    price: 268,
    originalPrice: 297,
    monthlyPrice: 89.4,
    originalMonthlyPrice: 99,
    discount: "9.1折",
    discountColor: "bg-amber-100 text-amber-700",
    isPopular: false,
    isHot: false,
  },
  {
    id: 2,
    duration: 6,
    durationText: "6个月",
    price: 428,
    originalPrice: 594,
    monthlyPrice: 71.4,
    originalMonthlyPrice: 99,
    discount: "7.3折",
    discountColor: "bg-amber-100 text-amber-700",
    isPopular: false,
    isHot: false,
  },
  {
    id: 3,
    duration: 12,
    durationText: "12个月",
    price: 698,
    originalPrice: 1188,
    monthlyPrice: 58.2,
    originalMonthlyPrice: 99,
    discount: "5.9折",
    discountColor: "bg-amber-100 text-amber-700",
    isPopular: true,
    isHot: false,
  },
  {
    id: 4,
    duration: 24,
    durationText: "24个月",
    price: 1188,
    originalPrice: 2376,
    monthlyPrice: 49.5,
    originalMonthlyPrice: 99,
    discount: "5折",
    discountColor: "bg-red-500 text-white",
    isPopular: false,
    isHot: true,
  },
];

// 积分购买方案
const creditPlans = [
  {
    id: 101,
    credits: 100,
    price: 10,
    bonus: 0,
    discount: null,
  },
  {
    id: 102,
    credits: 500,
    price: 45,
    bonus: 50,
    discount: "9折",
  },
  {
    id: 103,
    credits: 1000,
    price: 80,
    bonus: 200,
    discount: "8折",
  },
  {
    id: 104,
    credits: 5000,
    price: 350,
    bonus: 1500,
    discount: "7折",
  },
];

// Plus会员权益
const plusBenefits = [
  {
    icon: Sparkles,
    title: "每月 5000 研究积分",
    subtitle: "（每月为固定 31 天）",
    hasInfo: true,
  },
  {
    icon: FileText,
    title: "购买积分优惠低至 5 折起",
    subtitle: null,
    hasInfo: false,
  },
  {
    icon: Database,
    title: "可创建自定义 AI 表格列 15 个",
    subtitle: null,
    hasInfo: false,
  },
  {
    icon: Zap,
    title: "每月综述减免 1600 积分 2 次",
    subtitle: null,
    badge: "限时优惠",
  },
  {
    icon: Crown,
    title: "综述 AI Max「Deep」（100 篇文献）",
    subtitle: null,
    hasInfo: true,
    badgeNew: true,
  },
  {
    icon: FileText,
    title: "AI 表格可展示列数不限",
    subtitle: null,
    hasInfo: false,
  },
  {
    icon: FileText,
    title: "每月对照翻译减免 100 积分 3 次",
    subtitle: null,
    badge: "限时优惠",
  },
  {
    icon: Database,
    title: "文献存储上限 2000 篇",
    subtitle: null,
    hasInfo: false,
  },
  {
    icon: ImageIcon,
    title: "支持 50 页图片型文献解析",
    subtitle: null,
    badgeNew: true,
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("plus");
  const [selectedPlan, setSelectedPlan] = useState<number>(plusPlans[0].id);

  const { data: subscription } = trpc.pricing.getSubscription.useQuery(undefined, {
    enabled: !!user,
  });

  const subscribeMutation = trpc.pricing.subscribe.useMutation({
    onSuccess: () => {
      toast.success("订阅成功", { description: "您的订阅已激活！" });
    },
    onError: (error: { message: string }) => {
      toast.error("订阅失败", { description: error.message });
    },
  });

  const handleSubscribe = (planId: number) => {
    if (!user) {
      toast.error("请先登录", { description: "您需要登录后才能订阅" });
      return;
    }
    subscribeMutation.mutate({ planId, paymentMethod: "wechat" });
  };

  const selectedPlusPlan = plusPlans.find(p => p.id === selectedPlan) || plusPlans[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white">
      {/* Header */}
      <div className="container py-6">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>
      </div>

      <div className="container pb-16">
        {/* Current Subscription */}
        {subscription && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-amber-600" />
                <div>
                  <h3 className="font-semibold text-amber-800">当前订阅</h3>
                  <p className="text-sm text-amber-600">
                    剩余下载次数: {subscription.downloadQuotaRemaining} / {subscription.downloadQuotaTotal}
                  </p>
                </div>
              </div>
              {subscription.endDate && (
                <p className="text-sm text-amber-600">
                  到期时间: {new Date(subscription.endDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-gray-100 p-1 rounded-full">
              <TabsTrigger 
                value="plus" 
                className="rounded-full px-8 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Crown className="w-4 h-4 mr-2 text-amber-600" />
                Plus 会员
              </TabsTrigger>
              <TabsTrigger 
                value="credits"
                className="rounded-full px-8 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                按需买积分
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Plus会员 Tab */}
          <TabsContent value="plus" className="mt-0">
            {/* Subtitle */}
            <p className="text-center text-gray-600 mb-8">
              开启更强专业 AI 能力，享受更多优惠
            </p>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {plusPlans.map((plan) => (
                <Card
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative cursor-pointer transition-all duration-200 ${
                    selectedPlan === plan.id
                      ? "border-2 border-amber-500 shadow-lg bg-amber-50/30"
                      : "border-2 border-gray-200 hover:border-amber-300"
                  }`}
                >
                  {/* Discount Badge */}
                  <div className="absolute -top-3 right-4">
                    <Badge className={`${plan.discountColor} font-medium px-2 py-0.5`}>
                      {plan.isHot && <Sparkles className="w-3 h-3 mr-1" />}
                      {plan.discount}
                    </Badge>
                  </div>

                  <CardContent className="pt-6 pb-4">
                    {/* Duration */}
                    <div className="text-xl font-medium text-gray-700 mb-2">
                      {plan.durationText}
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-amber-700 text-lg">¥</span>
                      <span className="text-4xl font-bold text-amber-700">
                        {plan.price}
                      </span>
                    </div>

                    {/* Monthly Price */}
                    <div className="text-sm text-gray-500">
                      <span className="text-amber-600">¥{plan.monthlyPrice}/月</span>
                      <span className="ml-2 line-through">¥{plan.originalMonthlyPrice}/月</span>
                    </div>

                    {/* Selection Indicator */}
                    {selectedPlan === plan.id && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                        <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-amber-500"></div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Benefits Card */}
            <Card className="border-2 border-amber-200 bg-white mb-8">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-4">
                  {plusBenefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-gray-700">{benefit.title}</span>
                        {benefit.subtitle && (
                          <span className="text-gray-400 text-sm">{benefit.subtitle}</span>
                        )}
                        {benefit.hasInfo && (
                          <Info className="w-4 h-4 text-gray-400" />
                        )}
                        {benefit.badge && (
                          <Badge variant="outline" className="text-xs border-amber-300 text-amber-600 bg-amber-50">
                            {benefit.badge}
                          </Badge>
                        )}
                        {benefit.badgeNew && (
                          <Badge className="text-xs bg-red-100 text-red-600 border-0">
                            <Sparkles className="w-3 h-3 mr-0.5" />
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-gray-400 text-sm">
                  ... 更多新权益请敬请期待！
                </div>
              </CardContent>
            </Card>

            {/* Payment Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-6">
                {/* QR Code Placeholder */}
                <div className="w-32 h-32 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-400">微信支付二维码</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-amber-700 text-xl">¥</span>
                    <span className="text-5xl font-bold text-amber-700">
                      {selectedPlusPlan.price}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <span>使用</span>
                    <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-0.5 rounded text-sm">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.007-.27-.018-.407-.032zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
                      </svg>
                      微信App
                    </div>
                    <span>扫码支付</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    购买即表示接受
                    <a href="#" className="text-amber-600 hover:underline">《付款服务条款》</a>
                    支持开具电子普通发票
                    <Info className="w-4 h-4 inline ml-1 text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-sm text-gray-500">
                  Plus 会员时长每月为 31 天。
                </div>
                <a href="#" className="text-amber-600 hover:underline text-sm">
                  了解更多
                </a>
              </div>
            </div>
          </TabsContent>

          {/* 积分购买 Tab */}
          <TabsContent value="credits" className="mt-0">
            {/* Subtitle */}
            <p className="text-center text-gray-600 mb-8">
              按需购买研究积分，灵活使用
            </p>

            {/* Credit Plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {creditPlans.map((plan) => (
                <Card
                  key={plan.id}
                  className="relative border-2 border-gray-200 hover:border-amber-300 transition-all cursor-pointer"
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {plan.discount && (
                    <div className="absolute -top-3 right-4">
                      <Badge className="bg-amber-100 text-amber-700 font-medium px-2 py-0.5">
                        {plan.discount}
                      </Badge>
                    </div>
                  )}

                  <CardContent className="pt-6 pb-4 text-center">
                    {/* Credits */}
                    <div className="text-3xl font-bold text-gray-800 mb-1">
                      {plan.credits.toLocaleString()}
                      <span className="text-lg font-normal text-gray-500 ml-1">积分</span>
                    </div>

                    {/* Bonus */}
                    {plan.bonus > 0 && (
                      <div className="text-sm text-amber-600 mb-2">
                        +赠送 {plan.bonus} 积分
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-baseline justify-center gap-1 mt-4">
                      <span className="text-amber-700">¥</span>
                      <span className="text-3xl font-bold text-amber-700">
                        {plan.price}
                      </span>
                    </div>

                    <Button 
                      className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubscribe(plan.id);
                      }}
                    >
                      立即购买
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Credits Info */}
            <Card className="border-2 border-gray-200 bg-gray-50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-800 mb-4">积分使用说明</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>积分可用于论文生成、数据分析、图表制作等所有AI功能</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>积分永久有效，不会过期</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Plus会员购买积分享受额外折扣</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>支持微信支付、支付宝支付</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">常见问题</h2>
          <div className="space-y-6">
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2 text-gray-800">什么是研究积分？</h3>
              <p className="text-gray-600">
                研究积分是平台的通用货币，可用于论文生成、数据分析、图表制作、文献翻译等所有AI功能。不同功能消耗的积分不同，详情请查看各功能页面。
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2 text-gray-800">Plus会员和积分有什么区别？</h3>
              <p className="text-gray-600">
                Plus会员每月自动获得5000积分，并享受更多专属权益（如更高的存储上限、更多AI功能等）。按需购买积分适合偶尔使用的用户，更加灵活。
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2 text-gray-800">支持哪些支付方式？</h3>
              <p className="text-gray-600">
                我们支持微信支付和支付宝支付，所有交易均通过安全加密通道处理。支持开具电子普通发票。
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2 text-gray-800">订阅可以退款吗？</h3>
              <p className="text-gray-600">
                订阅后7天内如未使用任何会员权益，可申请全额退款。超过7天或已使用权益的，不支持退款但可继续使用至到期。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
