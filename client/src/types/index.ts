export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organizationId?: string;
  clientId?: string;
  role?: "owner" | "admin" | "editor" | "viewer" | "client";
}

export interface AuthSession {
  user: User | null;
  token: string | null;
}

export type Platform = "instagram" | "twitter" | "linkedin" | "reddit";

export type CampaignStatus = "active" | "paused" | "completed" | "archived";

export interface Client {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  notes: string;
  industry: string;
  competitors: string;
  status: "active" | "archived";
  createdAt: string;
}

export interface BrandDirectory {
  id: string;
  clientId: string;
  organizationId: string;
  logos?: any;
  colors?: any;
  fonts?: any;
  description?: string;
  longDescription?: string;
  images?: any;
  industries?: any;
  tagline?: string;
  mission?: string;
  products?: string;
  valueProposition?: string;
  targetAudience?: string;
  brandStyle?: string;
  brandVoiceAttributes?: any;
  brandVoiceAvoid?: any;
  socialLinks?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  clientId: string;
  name: string;
  platform: Platform;
  platformClientId: string;
  description: string;
  status: CampaignStatus;
  createdAt: string;
  lastSyncAt: string;
}

export interface UnifiedCampaignAnalytics {
  followers: number;
  reach: number;
  impressions: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
  profileVisits: number;
  websiteClicks: number;
  posts: number;
  ctr: number;
  cpm: number;
  cpc: number;
  cpa: number;
  estimatedSpend: number;
  estimatedConversions: number;
  estimatedRevenue: number;
  roas: number;
  growthRate: number;
  sentimentScore: number;
}

export interface AnalyticsHistoryPoint {
  date: string;
  reach: number;
  impressions: number;
  likes: number;
  followers: number;
  comments: number;
}

export interface PostMetric {
  id: string;
  caption: string;
  imageUrl: string;
  displayUrl?: string;
  publishedAt: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
  sentiment: "positive" | "neutral" | "negative";
  url?: string;
  ownerUsername?: string;
  audioName?: string;
  audioArtistName?: string;
  hook?: string;
}

export interface AIInsight {
  executiveSummary: string;
  timelineAnalysis?: string;
  chartConfig?: any;
  comparativeAnalysis: {
    clientWeaknesses: string[];
    competitorStrengths: string[];
    detailedComparison: string;
  };
  contentScript: {
    platform: string;
    captionDraft: string;
    visualProps: string[];
    videoScript: {
      hook: string;
      body: string;
      cta: string;
    };
    hashtags: string[];
  };
  growthOpportunities: string[];
}

export interface Report {
  id: string;
  clientId: string;
  campaignId: string;
  name: string;
  dateRange: {
    start: string;
    end: string;
  };
  platform: Platform;
  status: "draft" | "generated" | "archived";
  createdAt: string;
  // Summary contents
  executiveSummary: string;
  kpis: {
    reach: number;
    impressions: number;
    engagementRate: number;
    followersGained: number;
  };
  recommendations: string[];
  comparativeAnalysis?: {
    clientWeaknesses: string[];
    competitorStrengths: string[];
    detailedComparison: string;
  };
  contentScript?: {
    platform: string;
    captionDraft: string;
    visualProps: string[];
    videoScript: {
      hook: string;
      body: string;
      cta: string;
    };
    hashtags: string[];
  };
}
