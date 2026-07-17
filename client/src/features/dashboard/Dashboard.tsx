import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Users,
  FileText,
  Activity,
  Plus,
  ArrowUpRight,
  RefreshCw,
  Building,
  Heart,
  MessageSquare,
  Share2,
  Bookmark
} from "lucide-react";
import { useDBStore } from "../../store/dbStore";
import { useFilterStore } from "../../store/filterStore";
import { ClientService } from "../../services/clientService";
import { CampaignService } from "../../services/campaignService";
import { AnalyticsService } from "../../services/analyticsService";
import { CreateClientModal } from "../clients/CreateClientModal";
import { CreateCampaignModal } from "../campaigns/CreateCampaignModal";
import { BrandDirectoryCard } from "../../components/ui/BrandDirectoryCard";
import { ClientProfileHeader } from "../../components/ui/ClientProfileHeader";
import { BrandfetchService } from "../../services/brandfetchService";
import { supabase } from "../../utils/supabaseClient";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { ChartWrapper } from "../../components/ui/ChartWrapper";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { UnifiedCampaignAnalytics, AnalyticsHistoryPoint, PostMetric, Campaign, Client } from "../../types";

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { clients, campaigns, isDemoSeeded, loadFromDatabase, currentUser } = useDBStore();
  const { selectedClientId, selectedCampaignId, dateRange } = useFilterStore();

  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);

  // Loading & Data States
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<UnifiedCampaignAnalytics | null>(null);
  const [history, setHistory] = useState<AnalyticsHistoryPoint[]>([]);
  const [topPosts, setTopPosts] = useState<PostMetric[]>([]);
  const [brandDirectory, setBrandDirectory] = useState<any>(null);

  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const currentUser = useDBStore.getState().currentUser;
    if (currentUser?.role === 'client' && currentUser.clientId) {
      const fetchBrandDirectory = async () => {
        try {
          const { data } = await supabase.from("brand_directories").select("*").eq("client_id", currentUser.clientId).maybeSingle();
          if (data) {
             setBrandDirectory(data);
          } else {
             // Repair: Find client website from the local store since they are a client
             const myClientData = useDBStore.getState().clients.find(c => c.id === currentUser.clientId);
             if (myClientData?.website) {
                await BrandfetchService.syncBrandDirectory(currentUser.clientId!, currentUser.organizationId || "default_org", myClientData.website);
                const { data: newData } = await supabase.from("brand_directories").select("*").eq("client_id", currentUser.clientId).maybeSingle();
                if (newData) setBrandDirectory(newData);
             }
          }
        } catch (e) {
          console.error("Failed to fetch brand directory", e);
        }
      };
      fetchBrandDirectory();
    }
  }, []);

  useEffect(() => {
    // Check if we have clients and campaigns
    if (clients.length === 0 || campaigns.length === 0) {
      setAnalytics(null);
      setHistory([]);
      setTopPosts([]);
      return;
    }

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        // If specific campaign is selected
        let targetCampaignId = selectedCampaignId;
        if (selectedCampaignId === "all") {
          // Find first campaign for selected client, or just use camp_1
          const clientCampaigns = campaigns.filter(
            (c) => selectedClientId === "all" || c.clientId === selectedClientId
          );
          targetCampaignId = clientCampaigns[0]?.id || "camp_1";
        }

        const [analyticsData, historyData, postsData] = await Promise.all([
          AnalyticsService.getCampaignAnalytics(targetCampaignId),
          AnalyticsService.getCampaignHistory(targetCampaignId),
          AnalyticsService.getTopPosts(targetCampaignId),
        ]);

        setAnalytics(analyticsData);
        setHistory(historyData);
        setTopPosts(postsData);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [clients, campaigns, selectedClientId, selectedCampaignId, dateRange, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const formatNum = (val: number) => {
    return new Intl.NumberFormat("en-US").format(val);
  };

  const formatCompact = (val: number) => {
    return new Intl.NumberFormat("en-US", { notation: "compact" }).format(val);
  };

  // ECharts visual configurations
  const reachChartOption = {
    title: { text: "Audience Reach & Impressions", textStyle: { color: "#9ca3af", fontSize: 13, fontWeight: "600" } },
    tooltip: { trigger: "axis" },
    legend: { data: ["Reach", "Impressions"], right: 10, top: 0, textStyle: { color: "#9ca3af" } },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: history.map((h) => h.date),
      axisLine: { lineStyle: { color: "rgba(150, 150, 150, 0.3)" } },
      axisLabel: { color: "#9ca3af" },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      splitLine: { lineStyle: { color: "rgba(150, 150, 150, 0.15)" } },
      axisLabel: { color: "#9ca3af" },
    },
    series: [
      {
        name: "Reach",
        type: "line",
        smooth: true,
        data: history.map((h) => h.reach),
        areaStyle: { opacity: 0.05 },
        lineStyle: { width: 3 },
        color: "#8b5cf6", // violet 500 (works in dark and light)
      },
      {
        name: "Impressions",
        type: "line",
        smooth: true,
        data: history.map((h) => h.impressions),
        areaStyle: { opacity: 0.05 },
        lineStyle: { width: 3 },
        color: "#06b6d4", // cyan 500
      },
    ],
  };

  const followerChartOption = {
    title: { text: "Follower Growth Rate", textStyle: { color: "#9ca3af", fontSize: 13, fontWeight: "600" } },
    tooltip: { trigger: "axis" },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: {
      type: "category",
      data: history.map((h) => h.date),
      axisLine: { lineStyle: { color: "rgba(150, 150, 150, 0.3)" } },
      axisLabel: { color: "#9ca3af" },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      splitLine: { lineStyle: { color: "rgba(150, 150, 150, 0.15)" } },
      axisLabel: { color: "#9ca3af" },
    },
    series: [
      {
        name: "Followers",
        type: "line",
        smooth: true,
        data: history.map((h) => h.followers),
        lineStyle: { width: 2 },
        color: "#10b981", // emerald 500
      },
    ],
  };

  // State A: Empty state (No clients created yet)
  if (clients.length === 0) {
    const isClientRole = currentUser?.role === "client";
    return (
      <div className="space-y-6 animate-fadeIn">
        {brandDirectory && <BrandDirectoryCard brandDirectory={brandDirectory} />}
        <div className="flex flex-col items-center justify-center min-h-[50vh] max-w-lg mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center border border-border">
            <Building className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">
              {isClientRole ? "Your profile is being set up." : "You don't have any clients yet."}
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              {isClientRole 
                ? "Your agency hasn't linked your client profile yet. Please check back later or contact your account manager."
                : "Marketing OS organizes your campaigns and performance analytics underneath client profiles. Register your first client to unlock the system dashboard."}
            </p>
          </div>
          {!isClientRole && (
            <Button onClick={() => setIsClientModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Create Client
            </Button>
          )}
          {!isClientRole && (
            <CreateClientModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} />
          )}
        </div>
      </div>
    );
  }

  // State B: Has clients, but no campaigns linked yet
  if (campaigns.length === 0) {
    const isClient = useDBStore.getState().currentUser?.role === "client";
    const currentClientObj = isClient ? clients.find((c) => c.id === currentUser?.clientId) : null;
    return (
      <div className="space-y-6 animate-fadeIn">
        {isClient && currentClientObj && (
          <ClientProfileHeader client={currentClientObj} />
        )}
        {brandDirectory && <BrandDirectoryCard brandDirectory={brandDirectory} />}
        <div className="flex flex-col items-center justify-center min-h-[50vh] max-w-lg mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center border border-border">
            <Activity className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">No campaigns yet.</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              {isClient
                ? "You haven't linked any marketing campaigns yet. Create a campaign to start monitoring metrics."
                : "You've added clients, but you haven't linked any Instagram marketing campaigns yet. Create a campaign to start monitoring metrics."}
            </p>
          </div>
          <Button onClick={() => setIsCampaignModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create Campaign
          </Button>
          <CreateCampaignModal isOpen={isCampaignModalOpen} onClose={() => setIsCampaignModalOpen(false)} onSuccess={() => loadFromDatabase()} />
        </div>
      </div>
    );
  }

  const isClient = currentUser?.role === "client";
  const currentClientObj = isClient ? clients.find((c) => c.id === currentUser?.clientId) : null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Dashboard Page Title Header */}
      {isClient && currentClientObj ? (
        <div className="flex flex-col xl:flex-row justify-between items-start gap-4">
          <div className="flex-1 w-full xl:w-auto">
            <ClientProfileHeader client={currentClientObj} />
          </div>
          <div className="flex gap-2 w-full xl:w-auto justify-end">
            <Button variant="outline" size="sm" onClick={handleRefresh} className="h-9 gap-1.5 cursor-pointer">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setIsCampaignModalOpen(true)} className="h-9 gap-1.5 cursor-pointer">
              <Plus className="h-4 w-4" /> Launch Campaign
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
            <p className="text-sm text-muted-foreground">
              Monitor client acquisition health and dynamic campaign performance.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-background border border-border rounded-md px-3 py-1.5 shadow-sm">
              <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Client:</span>
              <select
                value={selectedClientId}
                onChange={(e) => useFilterStore.getState().setSelectedClientId(e.target.value)}
                className="bg-transparent border-none outline-none font-medium cursor-pointer text-sm"
              >
                <option value="all">All Clients</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="h-9 gap-1.5 cursor-pointer">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button size="sm" onClick={() => setIsCampaignModalOpen(true)} className="h-9 gap-1.5 cursor-pointer">
              <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Launch Campaign</span>
            </Button>
          </div>
        </div>
      )}


      {/* Loading Skeletons */}
      {loading && !analytics ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 lg:col-span-2" />
            <Skeleton className="h-96" />
          </div>
        </div>
      ) : (
        <>
          {/* Brand Directory */}
          {brandDirectory && (
            <div className="mb-6">
              <BrandDirectoryCard brandDirectory={brandDirectory} />
            </div>
          )}

          {/* KPI Widget Cards Grid */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Reach</span>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold">{formatNum(analytics.reach)}</div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center mt-1">
                    +{analytics.growthRate}% growth rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg. Engagement</span>
                  <Activity className="h-4 w-4 text-cyan-500" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold">{analytics.engagementRate}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across {analytics.posts} posts monitored
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Followers</span>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold">{formatNum(analytics.followers)}</div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center mt-1">
                    +{(analytics.growthRate * 0.8).toFixed(1)}% growth rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Budget & Efficiency</span>
                  <FileText className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold">{analytics.roas}x ROAS</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Spend: ${formatNum(analytics.estimatedSpend)} | Rev: ${formatNum(analytics.estimatedRevenue)}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Visual Graphs Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                <ChartWrapper option={reachChartOption} height="320px" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <ChartWrapper option={followerChartOption} height="320px" />
              </CardContent>
            </Card>
          </div>

          {/* Bottom Grid: Top Posts & Campaigns List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Top Performing Posts list */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base font-bold">Top Performing Posts</CardTitle>
                <CardDescription>Highest engagement rate creatives this month.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPosts.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No top posts recorded.</p>
                  ) : (
                    topPosts.map((post) => (
                      <div key={post.id} className="flex gap-3 text-xs border-b border-border pb-3 last:border-none last:pb-0">
                        <img
                          src={post.displayUrl || `https://ui-avatars.com/api/?name=${post.ownerUsername || 'Post'}&background=random`}
                          alt="creative placeholder"
                          className="w-12 h-12 object-cover rounded bg-neutral-100"
                        />
                        <div className="flex-grow space-y-1 min-w-0">
                          <p className="font-medium text-foreground line-clamp-1">
                            {post.caption}
                          </p>
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <span className="flex items-center gap-0.5">
                              <Heart className="h-3 w-3 text-rose-500 fill-rose-500" /> {formatNum(post.likes)}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <MessageSquare className="h-3 w-3 text-blue-500" /> {formatNum(post.comments)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Campaigns Table List summary */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base font-bold">Monitored Campaigns</CardTitle>
                  <CardDescription>Overview of active social integrations.</CardDescription>
                </div>
                {useDBStore.getState().currentUser?.role !== "client" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/clients")}
                    className="h-8 text-xs gap-1 cursor-pointer"
                  >
                    Manage Clients <ArrowUpRight className="h-3 w-3" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Campaign Name</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Client ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="pr-6 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const currentUser = useDBStore.getState().currentUser;
                      const isClient = currentUser?.role === 'client';
                      const displayCampaigns = isClient 
                        ? campaigns.filter(c => c.clientId === currentUser.clientId).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                        : [...campaigns].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
                      
                      return displayCampaigns.slice(0, 5).map((c) => {
                        const clientName = clients.find((client) => client.id === c.clientId)?.name || "Unknown";
                        return (
                        <TableRow key={c.id}>
                          <TableCell className="pl-6 font-semibold text-foreground">
                            {c.name}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xxs font-bold uppercase bg-pink-100 dark:bg-pink-950/20 text-pink-700 dark:text-pink-400">
                              {c.platform}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground truncate max-w-[120px]">
                            {clientName}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xxs font-semibold capitalize ${
                                c.status === "active"
                                  ? "bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
                                  : c.status === "paused"
                                  ? "bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400"
                                  : "bg-neutral-100 dark:bg-neutral-800 text-muted-foreground"
                              }`}
                            >
                              {c.status}
                            </span>
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs cursor-pointer"
                              onClick={() => {
                                const isClient = useDBStore.getState().currentUser?.role === 'client';
                                navigate(isClient ? `/campaigns/${c.id}` : `/clients/${c.clientId}`);
                              }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

          </div>
        </>
      )}

      {/* Floating modals */}
      <CreateCampaignModal 
        isOpen={isCampaignModalOpen} 
        onClose={() => setIsCampaignModalOpen(false)}
        onSuccess={() => loadFromDatabase()}
      />
    </div>
  );
};
