import { UnifiedCampaignAnalytics, AnalyticsHistoryPoint, PostMetric, AIInsight } from "../types";
import { supabase } from "../utils/supabaseClient";
import { MockGenerator } from "../utils/mockGenerator";

const isRealSupabase = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return !!url && !url.includes("placeholder-marketing-os");
};

const isUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export const AnalyticsRepository = {
  getCampaignAnalytics: async (campaignId: string): Promise<UnifiedCampaignAnalytics> => {
    if (isRealSupabase()) {
      if (!campaignId || !isUUID(campaignId)) {
        return MockGenerator.getCampaignAnalytics(campaignId); 
      }

      // In production, we query normalized_metrics for the latest snapshot
      const { data, error } = await supabase
        .from("analytics_snapshots")
        .select(`
          id,
          normalized_metrics (
            metric_name,
            metric_value
          )
        `)
        .eq("campaign_id", campaignId)
        .order("snapshot_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        // If snapshot doesn't exist yet, return empty analytics to avoid dummy data
        return {
          followers: 0,
          reach: 0,
          impressions: 0,
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          saves: 0,
          engagementRate: 0,
          profileVisits: 0,
          websiteClicks: 0,
          posts: 0,
          ctr: 0,
          cpm: 0,
          cpc: 0,
          cpa: 0,
          estimatedSpend: 0,
          estimatedConversions: 0,
          estimatedRevenue: 0,
          roas: 0,
          growthRate: 0,
          sentimentScore: 0,
        };
      }
      
      // Map to UnifiedCampaignAnalytics model with robust fallback defaults to prevent NaN displays
      const defaultMetrics = {
        followers: 0,
        reach: 0,
        impressions: 0,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        engagementRate: 0,
        profileVisits: 0,
        websiteClicks: 0,
        posts: 0,
        ctr: 0,
        cpm: 0,
        cpc: 0,
        cpa: 0,
        estimatedSpend: 0,
        estimatedConversions: 0,
        estimatedRevenue: 0,
        roas: 0,
        growthRate: 0,
        sentimentScore: 0,
      };

      const metrics: any = { ...defaultMetrics };
      (data as any).normalized_metrics.forEach((item: any) => {
        metrics[item.metric_name] = Number(item.metric_value);
      });
      return metrics as UnifiedCampaignAnalytics;
    } else {
      return MockGenerator.getCampaignAnalytics(campaignId);
    }
  },

  getCampaignHistory: async (campaignId: string): Promise<AnalyticsHistoryPoint[]> => {
    if (isRealSupabase()) {
      if (!campaignId || !isUUID(campaignId)) return [];

      // Query historical snapshot points from Postgres
      const { data, error } = await supabase
        .from("analytics_snapshots")
        .select(`
          snapshot_date,
          normalized_metrics (
            metric_name,
            metric_value
          )
        `)
        .eq("campaign_id", campaignId)
        .order("snapshot_date", { ascending: true });

      if (error) return [];

      // Map back to structural timeline lists
      return (data as any).map((snap: any) => {
        const metricsMap: any = {};
        snap.normalized_metrics.forEach((item: any) => {
          metricsMap[item.metric_name] = Number(item.metric_value);
        });
        return {
          date: new Date(snap.snapshot_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          reach: metricsMap.reach || 0,
          impressions: metricsMap.impressions || 0,
          likes: metricsMap.likes || 0,
          followers: metricsMap.followers || 0,
          comments: metricsMap.comments || 0,
        };
      });
    } else {
      return MockGenerator.getCampaignHistory(campaignId);
    }
  },

  getTopPosts: async (campaignId: string): Promise<PostMetric[]> => {
    if (isRealSupabase()) {
      if (!campaignId || !isUUID(campaignId)) return [];

      // Fetch instagram scraping records matching top metrics
      const { data, error } = await supabase
        .from("knowledge_items")
        .select("content, metadata")
        .eq("campaign_id", campaignId)
        .eq("source", "apify_payload");

      if (error) return [];

      const posts = (data as any).map((item: any, idx: number) => {
        const content = JSON.parse(item.content);
        return {
          id: item.id,
          caption: content.caption || "",
          imageUrl: content.displayUrl || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&h=400&fit=crop",
          publishedAt: content.timestamp || item.created_at,
          likes: content.likesCount || 0,
          comments: content.commentsCount || 0,
          shares: content.sharesCount || 0,
          saves: content.savesCount || 0,
          engagementRate: Number((((content.likesCount || 0) + (content.commentsCount || 0)) / 1000).toFixed(2)),
          sentiment: (idx % 2 === 0 ? "positive" : "neutral") as "positive" | "neutral" | "negative",
          url: content.url || content.original_url || "",
          ownerUsername: content.ownerUsername || content.owner_username || "",
          audioName: content.audioName || content.audio_name || "",
          audioArtistName: content.audioArtistName || content.audio_artist_name || "",
          hook: content.hook || "",
        };
      });
      return posts.sort((a: any, b: any) => b.engagementRate - a.engagementRate);
    } else {
      return MockGenerator.getTopPosts(campaignId);
    }
  },

  getCampaignAIInsight: async (campaignId: string): Promise<AIInsight> => {
    if (isRealSupabase()) {
      if (!campaignId || !isUUID(campaignId)) {
        return MockGenerator.getCampaignAIInsight(campaignId);
      }

      const { data, error } = await supabase
        .from("llm_insights")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        // Return blank content if no database insight exists yet
        return {
          executiveSummary: "Scraper sync in progress or no posts analyzed yet. Please wait...",
          chartConfig: null,
          comparativeAnalysis: {
            clientWeaknesses: [],
            competitorStrengths: [],
            detailedComparison: "No data available yet.",
          },
          contentScript: {
            platform: "N/A",
            captionDraft: "N/A",
            visualProps: [],
            videoScript: { hook: "N/A", body: "N/A", cta: "N/A" },
            hashtags: []
          },
          growthOpportunities: []
        };
      }

      return {
        executiveSummary: data.executive_summary,
        timelineAnalysis: (data.structured_data as any).timelineAnalysis,
        chartConfig: (data.structured_data as any).chartConfig || null,
        comparativeAnalysis: (data.structured_data as any).comparativeAnalysis || { clientWeaknesses: [], competitorStrengths: [], detailedComparison: "" },
        contentScript: (data.structured_data as any).contentScript || { platform: "", captionDraft: "", visualProps: [], videoScript: { hook: "", body: "", cta: "" }, hashtags: [] },
        growthOpportunities: (data.structured_data as any).growthOpportunities || [],
      };
    } else {
      return MockGenerator.getCampaignAIInsight(campaignId);
    }
  },

  getCompetitorPosts: async (campaignId: string): Promise<PostMetric[]> => {
    if (isRealSupabase()) {
      if (!campaignId || !isUUID(campaignId)) return [];

      const { data, error } = await supabase
        .from("knowledge_items")
        .select("content, metadata")
        .eq("campaign_id", campaignId)
        .eq("source", "competitor_payload");

      if (error) return [];

      const posts = (data as any[]).map((item: any, idx: number) => {
        const content = JSON.parse(item.content);
        return {
          id: item.id,
          caption: content.caption || "",
          imageUrl: content.displayUrl || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&h=400&fit=crop",
          publishedAt: content.timestamp || item.created_at,
          likes: content.likesCount || 0,
          comments: content.commentsCount || 0,
          shares: content.sharesCount || 0,
          saves: content.savesCount || 0,
          engagementRate: Number((((content.likesCount || 0) + (content.commentsCount || 0)) / 1000).toFixed(2)),
          sentiment: (idx % 2 === 0 ? "positive" : "neutral") as "positive" | "neutral" | "negative",
          url: content.url || content.original_url || "",
          ownerUsername: content.ownerUsername || content.owner_username || "",
          audioName: content.audioName || content.audio_name || "",
          audioArtistName: content.audioArtistName || content.audio_artist_name || "",
          hook: content.hook || "",
        };
      });
      return posts.sort((a: any, b: any) => b.engagementRate - a.engagementRate);
    } else {
      return MockGenerator.getCompetitorPosts(campaignId);
    }
  },

  regenerateViralScript: async (campaignId: string, currentInsights: AIInsight, platform: string): Promise<AIInsight> => {
    const scriptStructure = `{
      "contentScript": {
        "platform": "${platform}",
        "captionDraft": "[Generate the exact text for the caption, including emojis]",
        "visualProps": ["[Generate prop 1]", "[Generate prop 2]", "[Generate lighting requirement]"],
        "videoScript": {
          "hook": "[Generate exactly what to say or show in the first 3 seconds]",
          "body": "[Generate the core message and visual actions]",
          "cta": "[Generate exactly what to say or show at the end to drive action]"
        },
        "hashtags": ["#[Generate hashtag 1]", "#[Generate hashtag 2]"]
      }
    }`;

    const promptText = `
You are an expert viral content strategist.
The previous viral script you generated for ${platform} was rejected by the client.
Based on the following analysis of our brand and competitors, generate a COMPLETELY NEW and FRESH highly viral content idea for ${platform}. Do NOT repeat the previous idea. Make it unique and highly engaging.

Analysis: ${currentInsights.executiveSummary}
Weaknesses to fix: ${JSON.stringify(currentInsights.comparativeAnalysis?.clientWeaknesses || [])}
Strengths to mimic: ${JSON.stringify(currentInsights.comparativeAnalysis?.competitorStrengths || [])}

Your output must be a valid JSON object matching this EXACT structure:
${scriptStructure}
`;

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';

    const res = await fetch("/api/jobs/cerebras/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: promptText }],
        temperature: 0.7,
      }),
    });

    if (!res.ok) throw new Error("Failed to generate new script");
    const data = await res.json();
    let rawContent = data.choices[0].message.content;
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) rawContent = jsonMatch[0];
    const parsed = JSON.parse(rawContent);

    if (isRealSupabase()) {
      const { data: latestInsight } = await supabase
        .from("llm_insights")
        .select("id, structured_data")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (latestInsight) {
        const updatedStructuredData = {
          ...(latestInsight.structured_data as any),
          contentScript: parsed.contentScript
        };
        await supabase
          .from("llm_insights")
          .update({ structured_data: updatedStructuredData })
          .eq("id", latestInsight.id);
      }
    }

    return {
      ...currentInsights,
      contentScript: parsed.contentScript
    };
  }
};
