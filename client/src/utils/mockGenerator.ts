import { UnifiedCampaignAnalytics, AnalyticsHistoryPoint, PostMetric, AIInsight } from "../types";

// In-memory registries for custom mock campaigns simulated via the Apify / Cerebras post pipelines
const customMockAnalytics = new Map<string, UnifiedCampaignAnalytics>();
const customMockAIInsights = new Map<string, AIInsight>();
const customMockHistory = new Map<string, AnalyticsHistoryPoint[]>();
const customMockPosts = new Map<string, PostMetric[]>();
const customMockCompetitors = new Map<string, PostMetric[]>();

export const MockGenerator = {
  // Registers a simulated post scrape and LLM analysis in local storage memory
  saveMockCampaignData: (
    campaignId: string,
    metrics: UnifiedCampaignAnalytics,
    insights: AIInsight,
    posts: PostMetric[] = [],
    history: AnalyticsHistoryPoint[] = [],
    competitorPosts: PostMetric[] = []
  ) => {
    customMockAnalytics.set(campaignId, metrics);
    customMockAIInsights.set(campaignId, insights);
    customMockPosts.set(campaignId, posts);
    customMockHistory.set(campaignId, history);
    customMockCompetitors.set(campaignId, competitorPosts);
  },

  getCampaignAnalytics: async (campaignId: string): Promise<UnifiedCampaignAnalytics> => {
    // If the campaign has been synced and holds post data, return it
    if (customMockAnalytics.has(campaignId)) {
      return customMockAnalytics.get(campaignId)!;
    }

    if (campaignId === "camp_1") {
      return {
        followers: 24500,
        reach: 125430,
        impressions: 245900,
        views: 89300,
        likes: 12450,
        comments: 680,
        shares: 1120,
        saves: 950,
        engagementRate: 5.82,
        profileVisits: 4320,
        websiteClicks: 1480,
        posts: 24,
        ctr: 2.15,
        cpm: 12.5,
        cpc: 0.58,
        cpa: 4.8,
        estimatedSpend: 1200,
        estimatedConversions: 250,
        estimatedRevenue: 4500,
        roas: 3.75,
        growthRate: 12.4,
        sentimentScore: 84.5,
      };
    } else if (campaignId === "camp_2") {
      return {
        followers: 18200,
        reach: 98120,
        impressions: 175400,
        views: 62100,
        likes: 8560,
        comments: 420,
        shares: 610,
        saves: 780,
        engagementRate: 4.25,
        profileVisits: 3100,
        websiteClicks: 950,
        posts: 16,
        ctr: 1.85,
        cpm: 14.2,
        cpc: 0.77,
        cpa: 6.2,
        estimatedSpend: 950,
        estimatedConversions: 153,
        estimatedRevenue: 2850,
        roas: 3.0,
        growthRate: 8.9,
        sentimentScore: 78.2,
      };
    } else {
      // Empty default analytics
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
  },

  getCampaignHistory: async (campaignId: string): Promise<AnalyticsHistoryPoint[]> => {
    if (customMockHistory.has(campaignId)) {
      return customMockHistory.get(campaignId)!;
    }

    if (campaignId !== "camp_1" && campaignId !== "camp_2") {
      return [];
    }

    const history: AnalyticsHistoryPoint[] = [];
    const baseReach = campaignId === "camp_1" ? 15000 : 10000;
    const baseFollowers = campaignId === "camp_1" ? 22000 : 16000;

    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const variance = 1 + Math.sin(i) * 0.15;
      
      history.push({
        date: dateStr,
        reach: Math.round(baseReach * (7 - i) * variance),
        impressions: Math.round(baseReach * 1.8 * (7 - i) * variance),
        likes: Math.round(baseReach * 0.1 * (7 - i) * variance),
        followers: Math.round(baseFollowers + (7 - i) * 150 * variance),
        comments: Math.round(baseReach * 0.01 * (7 - i) * variance),
      });
    }
    return history;
  },

  getTopPosts: async (campaignId: string): Promise<PostMetric[]> => {
    if (customMockPosts.has(campaignId)) {
      return customMockPosts.get(campaignId)!;
    }

    if (campaignId === "camp_1") {
      return [
        {
          id: "post_1",
          caption: "Ready to elevate your training? The Apex Summer Core Collection drops this Friday. Recycled materials, maximum breathability. 🌿💪 #sustainablefashion #fitness",
          imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&h=400&fit=crop",
          publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          likes: 4200,
          comments: 245,
          shares: 512,
          saves: 480,
          engagementRate: 6.8,
          sentiment: "positive",
        },
        {
          id: "post_2",
          caption: "Performance meets sustainability. Take a look behind the scenes of how we source our post-consumer fabrics. 🧵♻️ #mindfulliving #gogreen",
          imageUrl: "https://images.unsplash.com/photo-1532384748853-8f54a8f476e2?w=400&h=400&fit=crop",
          publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          likes: 3100,
          comments: 189,
          shares: 410,
          saves: 290,
          engagementRate: 5.2,
          sentiment: "positive",
        },
        {
          id: "post_3",
          caption: "Sizing is running a bit small on the new launch. Check our updated guides or DM us for direct support! We want you to have the perfect fit. 📏⭐",
          imageUrl: "https://images.unsplash.com/photo-1483721310020-03333e577078?w=400&h=400&fit=crop",
          publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          likes: 1850,
          comments: 142,
          shares: 98,
          saves: 110,
          engagementRate: 3.4,
          sentiment: "neutral",
        }
      ];
    } else if (campaignId === "camp_2") {
      return [
        {
          id: "post_gen_1",
          caption: "Transforming skincare routines one step at a time. The results speak for themselves. ✨ #glowup #cleanbeauty",
          imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
          publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          likes: 1200,
          comments: 88,
          shares: 110,
          saves: 95,
          engagementRate: 4.5,
          sentiment: "positive",
        },
        {
          id: "post_gen_2",
          caption: "What ingredients are you putting on your face? Let's break down the science of hydration. 💧🧪 #skincareeducation #scienceofbeauty",
          imageUrl: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=400&h=400&fit=crop",
          publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          likes: 950,
          comments: 72,
          shares: 85,
          saves: 120,
          engagementRate: 3.8,
          sentiment: "positive",
        }
      ];
    } else {
      return [];
    }
  },

  getCompetitorPosts: async (campaignId: string): Promise<PostMetric[]> => {
    if (customMockCompetitors.has(campaignId)) {
      return customMockCompetitors.get(campaignId)!;
    }

    if (campaignId === "camp_1" || campaignId === "camp_2") {
      return [
        {
          id: "comp_post_1",
          caption: "Elevating our sportswear performance with the new design launch. Breathable fabric and lightweight comfort. 👟🔥 #sustainablefashion #fitness",
          imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
          publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          likes: 55952,
          comments: 110,
          shares: 4210,
          saves: 5310,
          engagementRate: 9.35,
          sentiment: "positive",
          ownerUsername: "adidas",
          audioName: "Summer Beat Mix",
          audioArtistName: "DJ Peak",
          hook: "Meet your next workout companion.",
        },
        {
          id: "comp_post_2",
          caption: "Why visual consistency is the #1 growth driver in sustainable skincare. Here's our weekly routine. 🧴🌿 #cleanbeauty #routine",
          imageUrl: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=400&h=400&fit=crop",
          publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          likes: 11481,
          comments: 92,
          shares: 890,
          saves: 1430,
          engagementRate: 6.82,
          sentiment: "positive",
          ownerUsername: "cerave",
          audioName: "Lofi Focus Chill",
          audioArtistName: "Lofi Beats",
          hook: "3 ingredients you need to avoid.",
        }
      ];
    }
    return [];
  },

  getCampaignAIInsight: async (campaignId: string): Promise<AIInsight> => {
    if (customMockAIInsights.has(campaignId)) {
      return customMockAIInsights.get(campaignId)!;
    }

    if (campaignId === "camp_1") {
      return {
        executiveSummary: "Apex Summer Launch 2026 exhibits high audience traction, outperforming historical benchmarks by 18% in organic reach. The core growth vector is video content (Reels), which yields a 2.5x higher share-rate compared to static carousel posts. Ad efficiency is high, but conversion drop-offs on the landing page represent a minor bottleneck.",
        chartConfig: null,
        comparativeAnalysis: {
          clientWeaknesses: ["CPC remains low ($0.58), but the shop checkout funnel has a 12% drop-off at the shipping options stage.", "Instagram stories have seen a 15% decline in completion rate over the last 5 days."],
          competitorStrengths: ["Competitors leverage raw outdoor imagery which yields 2.4x higher organic shares."],
          detailedComparison: "Your content outperforms local competitors in video-completion rates (+15%), but lags behind hashtag leaders like @natgeo in terms of visual thumbnail hook retention. Competitors leverage raw outdoor imagery which yields 2.4x higher organic shares."
        },
        contentScript: {
          platform: "instagram",
          captionDraft: "Elevating our sportswear performance with the new design launch. Breathable fabric and lightweight comfort. 👟🔥 #sustainablefashion",
          visualProps: ["Breathable fabric", "Lightweight comfort"],
          videoScript: {
            hook: "Meet your next workout companion.",
            body: "Show the new design launch.",
            cta: "Shop now in bio."
          },
          hashtags: ["#sustainablefashion", "#fitness"]
        },
        growthOpportunities: [
          "Launch a customer referral program via Instagram DM automation.",
          "Collate top positive customer comments into a 'Customer Love' carousel ad targeting cart abandoners.",
          "Redirect 15% of budget from static carousel ads to story-based Q&A video sessions hosted by brand partners.",
          "Optimize shop checkout flow: simplify shipping fields and introduce express checkout options (Apple Pay/Shop Pay)."
        ]
      };
    } else if (campaignId === "camp_2") {
      return {
        executiveSummary: "The active campaign is performing steadily, showing solid baseline reach and strong brand affinity. Sentiment is positive, centering on ingredient transparency. There is a noticeable opportunity to grow engagement by hosting educational Q&As to address common concerns about skincare layering.",
        chartConfig: null,
        comparativeAnalysis: {
          clientWeaknesses: ["Reach volume is slightly lower than targeted, indicating a need for broader audience distribution.", "Static post comments show user confusion around layering the Glow Serum with other skincare acids."],
          competitorStrengths: ["Similar reels in the educational domain (@nasawebb) achieve 4.2x higher views due to interactive caption storytelling."],
          detailedComparison: "Comparative metrics show similar reels in the educational domain (@nasawebb) achieve 4.2x higher views due to interactive caption storytelling. While your engagement rate is strong, expanding focus to trending hashtags like #skincareeducation will boost organic discovery."
        },
        contentScript: {
          platform: "instagram",
          captionDraft: "Why visual consistency is the #1 growth driver in sustainable skincare. Here's our weekly routine. 🧴🌿 #cleanbeauty #routine",
          visualProps: ["Skincare products", "Clean aesthetic"],
          videoScript: {
            hook: "3 ingredients you need to avoid.",
            body: "Demonstrating the exact order of skincare application (Cleanser -> Toner -> Serum -> Moisturizer).",
            cta: "Shop now in bio."
          },
          hashtags: ["#cleanbeauty", "#routine", "#skincareeducation"]
        },
        growthOpportunities: [
          "Incorporate user-generated reviews into product layouts to increase conversion rates.",
          "Run a giveaway contest demanding users tag two friends, expanding organic reach and brand discoverability.",
          "Adopt a video-first approach for product demonstrations to improve visibility on the Instagram Reels feed.",
          "Produce a detailed skincare layering grid/graphic and pin it to the top of the Instagram profile.",
          "Partner with a certified dermatologist to host an Instagram Live event answering skincare combination questions."
        ]
      };
    } else {
      return {
        executiveSummary: "No post insights generated yet. The analytics pipeline is waiting for an Instagram post or reel link.",
        chartConfig: null,
        comparativeAnalysis: {
          clientWeaknesses: [],
          competitorStrengths: [],
          detailedComparison: "Provide a valid Instagram handle to run competitive comparisons."
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
  },
};
