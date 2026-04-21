import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen, 
  TrendingUp, 
  Lightbulb, 
  RefreshCw, 
  ExternalLink,
  Calendar,
  Users,
  BarChart3,
  Star,
  ChevronRight,
  Loader2
} from "lucide-react";

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

interface Pattern {
  id: number;
  patternType: string;
  patternName: string;
  description: string;
  frequency: number;
  recommendations: string;
  confidence: number;
}

interface Insight {
  id: number;
  insightType: string;
  title: string;
  content: string;
  applicableCancerTypes: string[];
  applicableStudyDesigns: string[];
  priority: string;
}

export function SEERPublications() {
  const [selectedPub, setSelectedPub] = useState<Publication | null>(null);
  
  const { data: publications, isLoading: pubLoading, refetch: refetchPubs } = trpc.seerPublication.getLatest.useQuery({ limit: 10 });
  const { data: stats } = trpc.seerPublication.getStats.useQuery();
  const { data: patterns } = trpc.seerPublication.getPatterns.useQuery();
  const { data: insights } = trpc.seerPublication.getInsights.useQuery({ limit: 8 });
  
  const fetchLatestMutation = trpc.seerPublication.fetchLatest.useMutation({
    onSuccess: () => {
      refetchPubs();
    }
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "best_practice": return <Star className="h-4 w-4 text-yellow-500" />;
      case "common_pitfall": return <TrendingUp className="h-4 w-4 text-red-500" />;
      case "emerging_trend": return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case "method_comparison": return <BarChart3 className="h-4 w-4 text-purple-500" />;
      case "journal_preference": return <BookOpen className="h-4 w-4 text-green-500" />;
      default: return <Lightbulb className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700";
      case "medium": return "bg-yellow-100 text-yellow-700";
      case "low": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Latest SEER Research</h2>
          <p className="text-gray-600 mt-1">
            AI-curated publications from top oncology journals
          </p>
        </div>
        <Button 
          onClick={() => fetchLatestMutation.mutate({ maxResults: 20 })}
          disabled={fetchLatestMutation.isPending}
          variant="outline"
          className="gap-2"
        >
          {fetchLatestMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Update Publications
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#AD002B]" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalPublications}</p>
                  <p className="text-xs text-gray-500">Total Publications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.thisMonth}</p>
                  <p className="text-xs text-gray-500">This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.avgScores.methodology}%</p>
                  <p className="text-xs text-gray-500">Avg Methodology</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.avgScores.innovation}%</p>
                  <p className="text-xs text-gray-500">Avg Innovation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="publications" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="publications" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Publications
          </TabsTrigger>
          <TabsTrigger value="patterns" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Research Patterns
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        {/* Publications Tab */}
        <TabsContent value="publications" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Publication List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Publications</CardTitle>
                <CardDescription>Click to view 500-word summary</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  {pubLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : publications && publications.length > 0 ? (
                    <div className="space-y-3">
                      {publications.map((pub: Publication) => (
                        <div
                          key={pub.id}
                          onClick={() => setSelectedPub(pub)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedPub?.id === pub.id
                              ? "border-[#AD002B] bg-red-50"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm line-clamp-2">{pub.title}</h4>
                            {pub.isFeatured && (
                              <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <span>{pub.journal}</span>
                            <span>•</span>
                            <span>{pub.year}</span>
                          </div>
                          <div className="flex gap-1 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {pub.cancerType}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {pub.studyDesign}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No publications yet</p>
                      <p className="text-sm">Click "Update Publications" to fetch latest research</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Publication Detail */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Publication Summary</CardTitle>
                <CardDescription>AI-generated 500-word analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  {selectedPub ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg">{selectedPub.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          <Users className="h-3 w-3 inline mr-1" />
                          {selectedPub.authors}
                        </p>
                        <p className="text-sm text-gray-500">
                          {selectedPub.journal} ({selectedPub.year})
                        </p>
                      </div>

                      {/* Scores */}
                      <div className="flex gap-2">
                        <Badge className={getScoreColor(selectedPub.methodologyScore)}>
                          Method: {selectedPub.methodologyScore}%
                        </Badge>
                        <Badge className={getScoreColor(selectedPub.innovationScore)}>
                          Innovation: {selectedPub.innovationScore}%
                        </Badge>
                        <Badge className={getScoreColor(selectedPub.clinicalRelevanceScore)}>
                          Clinical: {selectedPub.clinicalRelevanceScore}%
                        </Badge>
                      </div>

                      {/* Summary */}
                      <div>
                        <h4 className="font-medium mb-2">Summary</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {selectedPub.summary}
                        </p>
                      </div>

                      {/* Key Findings */}
                      <div>
                        <h4 className="font-medium mb-2">Key Findings</h4>
                        <ul className="space-y-1">
                          {selectedPub.keyFindings?.map((finding, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                              <ChevronRight className="h-4 w-4 text-[#AD002B] flex-shrink-0 mt-0.5" />
                              {finding}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Links */}
                      {selectedPub.doi && (
                        <a
                          href={`https://doi.org/${selectedPub.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-[#AD002B] hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Full Article
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <BookOpen className="h-12 w-12 mb-2 opacity-50" />
                      <p>Select a publication to view details</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="mt-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patterns && patterns.length > 0 ? (
              patterns.map((pattern: Pattern) => (
                <Card key={pattern.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{pattern.patternType}</Badge>
                      <span className="text-sm text-gray-500">
                        Freq: {pattern.frequency}
                      </span>
                    </div>
                    <CardTitle className="text-base mt-2">{pattern.patternName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">{pattern.description}</p>
                    <div className="bg-blue-50 p-2 rounded text-xs text-blue-700">
                      <strong>Recommendation:</strong> {pattern.recommendations}
                    </div>
                    <div className="mt-2 flex items-center gap-1">
                      <span className="text-xs text-gray-500">Confidence:</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#AD002B] h-2 rounded-full" 
                          style={{ width: `${pattern.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{pattern.confidence}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No patterns analyzed yet</p>
                <p className="text-sm">Patterns will be generated after fetching publications</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {insights && insights.length > 0 ? (
              insights.map((insight: Insight) => (
                <Card key={insight.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getInsightIcon(insight.insightType)}
                        <Badge variant="outline" className="capitalize">
                          {insight.insightType.replace("_", " ")}
                        </Badge>
                      </div>
                      <Badge className={getPriorityColor(insight.priority)}>
                        {insight.priority}
                      </Badge>
                    </div>
                    <CardTitle className="text-base mt-2">{insight.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
(Content truncated due to size limit. Use line ranges to read remaining content)