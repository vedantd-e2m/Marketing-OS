import { UnifiedCampaignAnalytics, AnalyticsHistoryPoint, PostMetric, AIInsight } from "../types";
import { AnalyticsRepository } from "../repositories/analyticsRepository";

export const AnalyticsService = {
  getCampaignAnalytics: async (campaignId: string): Promise<UnifiedCampaignAnalytics> => {
    return AnalyticsRepository.getCampaignAnalytics(campaignId);
  },

  getCampaignHistory: async (campaignId: string): Promise<AnalyticsHistoryPoint[]> => {
    return AnalyticsRepository.getCampaignHistory(campaignId);
  },

  getTopPosts: async (campaignId: string): Promise<PostMetric[]> => {
    return AnalyticsRepository.getTopPosts(campaignId);
  },

  getCampaignAIInsight: async (campaignId: string): Promise<AIInsight> => {
    return AnalyticsRepository.getCampaignAIInsight(campaignId);
  },

  getCompetitorPosts: async (campaignId: string): Promise<PostMetric[]> => {
    return AnalyticsRepository.getCompetitorPosts(campaignId);
  },

  regenerateViralScript: async (campaignId: string, currentInsights: AIInsight, platform: string): Promise<AIInsight> => {
    return AnalyticsRepository.regenerateViralScript(campaignId, currentInsights, platform);
  },
};
