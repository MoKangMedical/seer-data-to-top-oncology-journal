import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  RefreshCw, 
  ExternalLink,
  Calendar,
  Users,
  Loader2,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Star
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Publication {
  id: number;
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  summary: string;
  keyFindings: string[];
  cancerType: string;
  studyDesign: string;
  methodologyScore: number;
  innovationScore: number;
  clinicalRelevanceScore: number;
  doi: string;
  isFeatured: boolean;
}

export function LatestSEERResearch() {
  const [selectedPub, setSelectedPub] = useState<Publication | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: publications, isLoading, refetch } = trpc.seerPublication.getLatest.useQuery({ limit: 6 });
  const { data: stats } = trpc.seerPublication.getStats.useQuery();
  
  const fetchLatestMutation = trpc.seerPublication.fetchLatest.useMutation({
    onSuccess: () => {
      refetch();
    }
  });

  const handleViewDetail = (pub: Publication) => {
    setSelectedPub(pub);
    setIsDialogOpen(true);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-gray-600 bg-gray-100";
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge className="bg-[#dc2626]/10 text-[#dc2626] hover:bg-[#dc2626]/20 mb-4">
            <Sparkles className="w-4 h-4 mr-2" />
            AI 实时更新
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            全球最新 SEER 研究动态
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            AI 自动从 PubMed 抓取最新 SEER 数据库相关研究，并生成智能摘要
          </p>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">{stats.totalPublications}</span>
              <span className="text-blue-600 text-sm">篇研究</span>
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full">
              <Calendar className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-900">{stats.thisMonth}</span>
              <span className="text-green-600 text-sm">本月新增</span>
            </div>
            <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-900">{stats.avgScores?.methodology || 0}%</span>
              <span className="text-purple-600 text-sm">平均方法学评分</span>
            </div>
            <Button 
              onClick={() => fetchLatestMutation.mutate({ maxResults: 20 })}
              disabled={fetchLatestMutation.isPending}
              variant="outline"
              size="sm"
              className="gap-2 border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white"
            >
              {fetchLatestMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              更新研究
            </Button>
          </div>
        )}

        {/* Publications Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-[#dc2626]" />
          </div>
        ) : publications && publications.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publications.map((pub: Publication) => (
              <Card 
                key={pub.id} 
                className="border border-gray-100 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => handleViewDetail(pub)}
              >
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-[#dc2626] text-white text-xs">
                        {pub.journal}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {pub.year}
                      </Badge>
                    </div>
                    {pub.isFeatured && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#dc2626] transition-colors">
                    {pub.title}
                  </h3>

                  {/* Authors */}
                  <p className="text-sm text-gray-500 mb-3 line-clamp-1">
                    <Users className="w-3 h-3 inline mr-1" />
                    {pub.authors}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {pub.cancerType}
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      {pub.studyDesign}
                    </Badge>
                  </div>

                  {/* Scores */}
                  <div className="flex gap-2 mb-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${getScoreColor(pub.methodologyScore)}`}>
                      方法 {pub.methodologyScore}%
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getScoreColor(pub.innovationScore)}`}>
                      创新 {pub.innovationScore}%
                    </span>
                  </div>

                  {/* View More */}
                  <div className="flex items-center text-[#dc2626] text-sm font-medium group-hover:underline">
                    查看 AI 摘要
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">暂无研究数据</p>
            <Button 
              onClick={() => fetchLatestMutation.mutate({ maxResults: 20 })}
              disabled={fetchLatestMutation.isPending}
              className="bg-[#dc2626] hover:bg-[#b91c1c]"
            >
              {fetchLatestMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              获取最新研究
            </Button>
          </div>
        )}

        {/* View More Link */}
        {publications && publications.length > 0 && (
          <div className="text-center mt-10">
            <a 
              href="https://pubmed.ncbi.nlm.nih.gov/?term=SEER+database+cancer" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-[#dc2626] hover:underline font-medium"
            >
              在 PubMed 查看更多 SEER 研究 
              <ExternalLink className="ml-1 h-4 w-4" />
            </a>
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedPub && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl leading-tight pr-8">
                    {selectedPub.title}
                  </DialogTitle>
                  <DialogDescription className="flex flex-wrap gap-2 pt-2">
                    <Badge className="bg-[#dc2626] text-white">
                      {selectedPub.journal}
                    </Badge>
                    <Badge variant="outline">{selectedPub.year}</Badge>
                    <Badge variant="outline" className="text-blue-600 border-blue-300">
                      {selectedPub.cancerType}
                    </Badge>
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      {selectedPub.studyDesign}
                    </Badge>
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                  {/* Authors */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      作者
                    </h4>
                    <p className="text-sm text-gray-600">{selectedPub.authors}</p>
                  </div>

                  {/* Scores */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">AI 评分</h4>
                    <div className="flex gap-3">
                      <div className={`px-3 py-2 rounded-lg ${getScoreColor(selectedPub.methodologyScore)}`}>
                        <div className="text-lg font-bold">{selectedPub.methodologyScore}%</div>
                        <div className="text-xs">方法学</div>
                      </div>
                      <div className={`px-3 py-2 rounded-lg ${getScoreColor(selectedPub.innovationScore)}`}>
                        <div className="text-lg font-bold">{selectedPub.innovationScore}%</div>
                        <div className="text-xs">创新性</div>
                      </div>
                      <div className={`px-3 py-2 rounded-lg ${getScoreColor(selectedPub.clinicalRelevanceScore)}`}>
                        <div className="text-lg font-bold">{selectedPub.clinicalRelevanceScore}%</div>
                        <div className="text-xs">临床相关性</div>
                      </div>
                    </div>
                  </div>

                  {/* AI Summary */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#dc2626]" />
                      AI 智能摘要
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed">
                      {selectedPub.summary || "正在生成摘要..."}
                    </div>
                  </div>

                  {/* Key Findings */}
                  {selectedPub.keyFindings && selectedPub.keyFindings.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">关键发现</h4>
                      <ul className="space-y-2">
                        {selectedPub.keyFindings.map((finding, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="w-5 h-5 rounded-full bg-[#dc2626] text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
                              {index + 1}
                            </span>
                            {finding}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Links */}
                  <div className="flex gap-3 pt-4 border-t">
                    {selectedPub.pmid && (
                      <a 
                        href={`https://pubmed.ncbi.nlm.nih.gov/${selectedPub.pmid}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" className="gap-2">
                          <BookOpen className="w-4 h-4" />
                          PubMed
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </a>
                    )}
                    {selectedPub.doi && (
                      <a 
                        href={`https://doi.org/${selectedPub.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" className="gap-2">
                          原文
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}

export default LatestSEERResearch;
