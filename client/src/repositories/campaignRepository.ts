import { Campaign } from "../types";
import { supabase, appConfig } from "../utils/supabaseClient";
import { useDBStore } from "../store/dbStore";

const isRealSupabase = () => {
  const url = appConfig?.supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
  return !!url && !url.includes("placeholder-marketing-os");
};

const isUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export const CampaignRepository = {
  getAll: async (): Promise<Campaign[]> => {
    if (isRealSupabase()) {
      const currentUser = useDBStore.getState().currentUser;
      let data: any[] | null = null;
      let error: any = null;

      if (currentUser?.role === "client") {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const res = await fetch("/api/admin/me/campaigns", {
            headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
          });
          if (!res.ok) throw new Error("Failed to fetch from backend API");
          data = await res.json();
        } catch (err) {
          console.warn("Backend fetch failed, falling back to Supabase direct:", err);
          const response = await supabase
            .from("campaigns")
            .select("*")
            .order("created_at", { ascending: false });
          data = response.data;
          error = response.error;
        }
      } else {
        const response = await supabase
          .from("campaigns")
          .select("*")
          .order("created_at", { ascending: false });
        data = response.data;
        error = response.error;
      }

      if (error) throw new Error(error.message);
      if (!data) return [];
      return (data as any[]).map((d) => ({
        id: d.id,
        clientId: d.client_id,
        name: d.name,
        platform: d.platform,
        platformClientId: d.platform_client_id,
        description: d.description,
        status: d.status,
        createdAt: d.created_at,
        lastSyncAt: d.last_sync_at,
      }));
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(useDBStore.getState().campaigns);
        }, 300);
      });
    }
  },

  getByClientId: async (clientId: string): Promise<Campaign[]> => {
    if (isRealSupabase()) {
      if (!clientId || !isUUID(clientId)) return [];

      const currentUser = useDBStore.getState().currentUser;
      if (currentUser?.role === 'client') {
        if (currentUser.clientId !== clientId) return [];
        return useDBStore.getState().campaigns.filter(c => c.clientId === clientId);
      }

      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return (data as any[]).map((d) => ({
        id: d.id,
        clientId: d.client_id,
        name: d.name,
        platform: d.platform,
        platformClientId: d.platform_client_id,
        description: d.description,
        status: d.status,
        createdAt: d.created_at,
        lastSyncAt: d.last_sync_at,
      }));
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          const campaigns = useDBStore.getState().campaigns.filter(
            (c) => c.clientId === clientId
          );
          resolve(campaigns);
        }, 200);
      });
    }
  },

  getById: async (id: string): Promise<Campaign | undefined> => {
    if (isRealSupabase()) {
      if (!id || !isUUID(id)) return undefined;

      const currentUser = useDBStore.getState().currentUser;
      if (currentUser?.role === 'client') {
        // For clients, ensure they can only access campaigns that were fetched in their local store 
        // (which is securely fetched via backend GET /api/me/campaigns)
        const allowedCampaign = useDBStore.getState().campaigns.find(c => c.id === id);
        if (!allowedCampaign) return undefined;
        return allowedCampaign;
      }

      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw new Error(error.message);
      return {
        id: data.id,
        clientId: data.client_id,
        name: data.name,
        platform: data.platform,
        platformClientId: data.platform_client_id,
        description: data.description,
        status: data.status,
        createdAt: data.created_at,
        lastSyncAt: data.last_sync_at,
      };
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          const campaign = useDBStore.getState().campaigns.find((c) => c.id === id);
          resolve(campaign);
        }, 200);
      });
    }
  },

  create: async (
    campaign: Omit<Campaign, "id" | "createdAt" | "lastSyncAt">
  ): Promise<Campaign> => {
    if (isRealSupabase()) {
      const orgId = useDBStore.getState().currentUser?.organizationId;
      if (!orgId) throw new Error("No active organization session found.");

      const dbCampaignRow = {
        organization_id: orgId,
        client_id: campaign.clientId,
        name: campaign.name,
        platform: campaign.platform,
        platform_client_id: campaign.platformClientId,
        description: campaign.description || "",
        status: campaign.status || "active",
      };

      const { data, error } = await supabase
        .from("campaigns")
        .insert([dbCampaignRow])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return {
        id: data.id,
        clientId: data.client_id,
        name: data.name,
        platform: data.platform,
        platformClientId: data.platform_client_id,
        description: data.description,
        status: data.status,
        createdAt: data.created_at,
        lastSyncAt: data.last_sync_at,
      };
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          const newCampaign = useDBStore.getState().addCampaign(campaign);
          resolve(newCampaign);
        }, 300);
      });
    }
  },

  update: async (id: string, campaignData: Partial<Campaign>): Promise<void> => {
    if (isRealSupabase()) {
      if (!id || !isUUID(id)) return;

      const dbUpdate: any = {};
      if (campaignData.name !== undefined) dbUpdate.name = campaignData.name;
      if (campaignData.description !== undefined) dbUpdate.description = campaignData.description;
      if (campaignData.status !== undefined) dbUpdate.status = campaignData.status;
      if (campaignData.lastSyncAt !== undefined) dbUpdate.last_sync_at = campaignData.lastSyncAt;

      const { error } = await supabase
        .from("campaigns")
        .update(dbUpdate)
        .eq("id", id);

      if (error) throw new Error(error.message);
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          useDBStore.getState().updateCampaign(id, campaignData);
          resolve();
        }, 250);
      });
    }
  },

  delete: async (id: string): Promise<void> => {
    if (isRealSupabase()) {
      if (!id || !isUUID(id)) return;

      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          useDBStore.getState().deleteCampaign(id);
          resolve();
        }, 300);
      });
    }
  },
};
