import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Client, Campaign, Report, User } from "../types";

interface DBState {
  clients: Client[];
  campaigns: Campaign[];
  reports: Report[];
  currentUser: User | null;
  isAuthLoading: boolean;
  isDemoSeeded: boolean;
  
  // Auth actions
  setCurrentUser: (user: User | null) => void;
  setAuthLoading: (isLoading: boolean) => void;
  
  // Client CRUD
  addClient: (client: Omit<Client, "id" | "createdAt" | "status">) => Client;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  archiveClient: (id: string) => void;
  
  // Campaign CRUD
  addCampaign: (campaign: Omit<Campaign, "id" | "createdAt" | "lastSyncAt">) => Campaign;
  updateCampaign: (id: string, campaign: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  
  // Report CRUD
  addReport: (report: Omit<Report, "id" | "createdAt">) => Report;
  deleteReport: (id: string) => void;
  
  // Helpers
  seedDemoData: () => void;
  clearAllData: () => void;
  loadFromDatabase: () => Promise<void>;
}

export const useDBStore = create<DBState>()(
  persist(
    (set, get) => ({
      clients: [],
      campaigns: [],
      reports: [],
      currentUser: null,
      isAuthLoading: true,
      isDemoSeeded: false,

      setCurrentUser: (user) => set({ currentUser: user }),
      setAuthLoading: (isLoading) => set({ isAuthLoading: isLoading }),

      addClient: (clientData) => {
        const newClient: Client = {
          ...clientData,
          id: `client_${Math.random().toString(36).substr(2, 9)}`,
          status: "active",
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          clients: [newClient, ...state.clients],
        }));
        return newClient;
      },

      updateClient: (id, updatedFields) => {
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === id ? { ...c, ...updatedFields } : c
          ),
        }));
      },

      deleteClient: (id) => {
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
          campaigns: state.campaigns.filter((camp) => camp.clientId !== id),
          reports: state.reports.filter((r) => r.clientId !== id),
        }));
      },

      archiveClient: (id) => {
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === id ? { ...c, status: "archived" as const } : c
          ),
        }));
      },

      addCampaign: (campaignData) => {
        const newCampaign: Campaign = {
          ...campaignData,
          id: `camp_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          lastSyncAt: new Date().toISOString(),
        };
        set((state) => ({
          campaigns: [newCampaign, ...state.campaigns],
        }));
        return newCampaign;
      },

      updateCampaign: (id, updatedFields) => {
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === id ? { ...c, ...updatedFields, lastSyncAt: new Date().toISOString() } : c
          ),
        }));
      },

      deleteCampaign: (id) => {
        set((state) => ({
          campaigns: state.campaigns.filter((c) => c.id !== id),
          reports: state.reports.filter((r) => r.campaignId !== id),
        }));
      },

      addReport: (reportData) => {
        const newReport: Report = {
          ...reportData,
          id: `rep_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          reports: [newReport, ...state.reports],
        }));
        return newReport;
      },

      deleteReport: (id) => {
        set((state) => ({
          reports: state.reports.filter((r) => r.id !== id),
        }));
      },

      seedDemoData: () => {
        const mockClients: Client[] = [
          {
            id: "client_1",
            name: "Apex Athletica",
            contactName: "Marcus Vance",
            contactEmail: "marcus@apexathletica.com",
            contactPhone: "+1 (555) 234-5678",
            website: "apexathletica.com",
            notes: "Premium fitness apparel brand focusing on sustainable materials. Heavy focus on influencer partnerships.",
            industry: "fitness apparel",
            competitors: "nike, adidas",
            status: "active",
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "client_2",
            name: "Solas Skincare",
            contactName: "Helena Rostova",
            contactEmail: "helena@solasskincare.co",
            contactPhone: "+1 (555) 987-6543",
            website: "solasskincare.co",
            notes: "D2C organic skincare. Clean aesthetics, minimalist packaging. Instagram is their primary sales driver.",
            industry: "skincare",
            competitors: "cerave, ordinary",
            status: "active",
            createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "client_3",
            name: "Velo Roasters",
            contactName: "Jeremy Thorne",
            contactEmail: "jeremy@veloroasters.com",
            contactPhone: "+1 (555) 456-7890",
            website: "veloroasters.com",
            notes: "Specialty coffee roastery with subscription model. Focus on local community stories.",
            industry: "coffee subscription",
            competitors: "bluebottle, starbucks",
            status: "active",
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          }
        ];

        const mockCampaigns: Campaign[] = [
          {
            id: "camp_1",
            clientId: "client_1",
            name: "Apex Summer Launch 2026",
            platform: "instagram",
            platformClientId: "apex_athletica_ig",
            description: "Promoting our eco-friendly summer workout line through high-energy video content and stories.",
            status: "active",
            createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            lastSyncAt: new Date().toISOString(),
          },
          {
            id: "camp_2",
            clientId: "client_2",
            name: "Glow Serum Awareness",
            platform: "instagram",
            platformClientId: "solas_skincare_ig",
            description: "Educational carousel series explaining the science behind our active hyaluronic acid ingredients.",
            status: "active",
            createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            lastSyncAt: new Date().toISOString(),
          },
          {
            id: "camp_3",
            clientId: "client_3",
            name: "Subscription Drive 2026",
            platform: "instagram",
            platformClientId: "velo_coffee_ig",
            description: "Direct response campaign showcasing coffee roasting process and subscription unboxing.",
            status: "active",
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            lastSyncAt: new Date().toISOString(),
          }
        ];

        const mockReports: Report[] = [
          {
            id: "rep_1",
            clientId: "client_1",
            campaignId: "camp_1",
            name: "Apex Summer Campaign Mid-Way Report",
            dateRange: {
              start: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              end: new Date().toISOString().split("T")[0],
            },
            platform: "instagram",
            status: "generated",
            createdAt: new Date().toISOString(),
            executiveSummary: "The Apex Summer Launch 2026 campaign is performing exceptionally well. Follower growth has exceeded expectations by 15%, driven by organic Reels sharing. Cost metrics (CPA, CPC) are well within the target KPIs, showing high audience affinity.",
            kpis: {
              reach: 125430,
              impressions: 245900,
              engagementRate: 5.82,
              followersGained: 1450,
            },
            recommendations: [
              "Allocate 20% more budget to Reels formatting, as they account for 70% of total engagement.",
              "Optimize the custom profile bio link to point directly to the summer collection landing page to improve CTA conversion.",
              "Initiate micro-influencer product seedings to maintain social proof after the initial launch spike."
            ]
          }
        ];

        set({
          clients: mockClients,
          campaigns: mockCampaigns,
          reports: mockReports,
          isDemoSeeded: true,
        });
      },

      clearAllData: () => {
        set({
          clients: [],
          campaigns: [],
          reports: [],
          isDemoSeeded: false,
        });
      },

      loadFromDatabase: async () => {
        try {
          const { ClientRepository } = await import("../repositories/clientRepository");
          const { CampaignRepository } = await import("../repositories/campaignRepository");
          const { ReportRepository } = await import("../repositories/reportRepository");

          const [dbClients, dbCampaigns, dbReports] = await Promise.all([
            ClientRepository.getAll(),
            CampaignRepository.getAll(),
            ReportRepository.getAll(),
          ]);

          console.log("DEBUG: Fetched campaigns:", dbCampaigns);
          
          set({
            clients: dbClients,
            campaigns: dbCampaigns,
            reports: dbReports,
          });
        } catch (err) {
          console.error("Failed to load data from database", err);
        }
      },
    }),
    {
      name: "marketing_os_db",
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => !['currentUser', 'isAuthLoading'].includes(key))
        ),
    }
  )
);
