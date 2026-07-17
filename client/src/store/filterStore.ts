import { create } from "zustand";

interface FilterState {
  selectedClientId: string; // 'all' or specific client ID
  selectedCampaignId: string; // 'all' or specific campaign ID
  dateRange: {
    start: string;
    end: string;
  };
  setSelectedClientId: (id: string) => void;
  setSelectedCampaignId: (id: string) => void;
  setDateRange: (range: { start: string; end: string }) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  selectedClientId: "all",
  selectedCampaignId: "all",
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  },
  setSelectedClientId: (id) => set({ selectedClientId: id, selectedCampaignId: "all" }),
  setSelectedCampaignId: (id) => set({ selectedCampaignId: id }),
  setDateRange: (range) => set({ dateRange: range }),
}));
