import { Report } from "../types";
import { ReportRepository } from "../repositories/reportRepository";
import { AnalyticsRepository } from "../repositories/analyticsRepository";
import { CampaignRepository } from "../repositories/campaignRepository";

export const ReportService = {
  getReports: async (): Promise<Report[]> => {
    return ReportRepository.getAll();
  },

  getReportsByClientId: async (clientId: string): Promise<Report[]> => {
    return ReportRepository.getByClientId(clientId);
  },

  generateReport: async (data: {
    name: string;
    clientId: string;
    campaignId: string;
    platform: string;
    dateRange: { start: string; end: string };
  }): Promise<Report> => {
    // Fetch current metrics using repositories
    const campaign = await CampaignRepository.getById(data.campaignId);
    const analytics = await AnalyticsRepository.getCampaignAnalytics(data.campaignId);
    const aiInsight = await AnalyticsRepository.getCampaignAIInsight(data.campaignId);

    const newReport: Omit<Report, "id" | "createdAt"> = {
      clientId: data.clientId,
      campaignId: data.campaignId,
      name: data.name,
      dateRange: data.dateRange,
      platform: data.platform as any,
      status: "generated",
      executiveSummary: `This executive review summarizes the performance of campaign "${campaign?.name || "Campaign"}" for the selected window. ${aiInsight.executiveSummary}`,
      kpis: {
        reach: analytics.reach,
        impressions: analytics.impressions,
        engagementRate: analytics.engagementRate,
        followersGained: Math.round(analytics.followers * (analytics.growthRate / 100)),
      },
      recommendations: aiInsight.growthOpportunities?.slice(0, 3) || [],
      comparativeAnalysis: aiInsight.comparativeAnalysis,
      contentScript: aiInsight.contentScript,
    };

    return ReportRepository.create(newReport);
  },

  deleteReport: async (id: string): Promise<void> => {
    return ReportRepository.delete(id);
  },
};
