import { Campaign } from "../types";
import { CampaignRepository } from "../repositories/campaignRepository";

export const CampaignService = {
  getCampaigns: async (): Promise<Campaign[]> => {
    return CampaignRepository.getAll();
  },

  getCampaignsByClientId: async (clientId: string): Promise<Campaign[]> => {
    return CampaignRepository.getByClientId(clientId);
  },

  getCampaignById: async (id: string): Promise<Campaign | undefined> => {
    return CampaignRepository.getById(id);
  },

  createCampaign: async (
    campaignData: Omit<Campaign, "id" | "createdAt" | "lastSyncAt">
  ): Promise<Campaign> => {
    return CampaignRepository.create(campaignData);
  },

  updateCampaign: async (id: string, campaignData: Partial<Campaign>): Promise<void> => {
    return CampaignRepository.update(id, campaignData);
  },

  deleteCampaign: async (id: string): Promise<void> => {
    return CampaignRepository.delete(id);
  },
};
