import { Client } from "../types";
import { supabase } from "../utils/supabaseClient";
import { useDBStore } from "../store/dbStore";
import { BrandfetchService } from "../services/brandfetchService";

const isRealSupabase = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return !!url && !url.includes("placeholder-marketing-os");
};

const isUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const parseNotesMetadata = (rawNotes: string | null) => {
  if (!rawNotes) {
    return { industry: "general", competitors: "", notes: "" };
  }
  
  // 1. Try secure custom tags format to avoid brackets parser issues
  if (rawNotes.includes("__INDUSTRY__:") && rawNotes.includes("__COMPETITORS__:")) {
    try {
      const indParts = rawNotes.split("__INDUSTRY__:");
      const compParts = indParts[1].split("__COMPETITORS__:");
      const notesParts = compParts[1].split("__NOTES__:");
      return {
        industry: compParts[0] || "general",
        competitors: notesParts[0] || "",
        notes: notesParts[1] || "",
      };
    } catch (err) {
      console.error("Failed to parse custom tags client metadata:", err);
    }
  }

  // 2. Fallback to legacy brackets format
  const indMatch = rawNotes.match(/^\[Industry:\s*([^\]]*)\]/);
  const compMatch = rawNotes.match(/\[Competitors:\s*([^\]]*)\]/);
  
  let industry = indMatch ? indMatch[1] : "general";
  let competitors = compMatch ? compMatch[1] : "";
  
  let notes = rawNotes
    .replace(/^\[Industry:\s*([^\]]*)\]/, "")
    .replace(/\[Competitors:\s*([^\]]*)\]/, "")
    .trim();

  return { industry, competitors, notes };
};

export const ClientRepository = {
  getAll: async (): Promise<Client[]> => {
    if (isRealSupabase()) {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw new Error(error.message);
      return (data as any[]).map((d) => {
        const { industry, competitors, notes } = parseNotesMetadata(d.notes);
        return {
          id: d.id,
          name: d.name,
          contactName: d.contact_name,
          contactEmail: d.contact_email,
          contactPhone: d.contact_phone,
          website: d.website,
          notes,
          industry,
          competitors,
          status: d.status,
          createdAt: d.created_at,
        };
      });
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(useDBStore.getState().clients);
        }, 300);
      });
    }
  },

  getById: async (id: string): Promise<Client | undefined> => {
    if (isRealSupabase()) {
      if (!id || !isUUID(id)) return undefined;

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw new Error(error.message);
      const { industry, competitors, notes } = parseNotesMetadata(data.notes);

      return {
        id: data.id,
        name: data.name,
        contactName: data.contact_name,
        contactEmail: data.contact_email,
        contactPhone: data.contact_phone,
        website: data.website,
        notes,
        industry,
        competitors,
        status: data.status,
        createdAt: data.created_at,
      };
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          const client = useDBStore.getState().clients.find((c) => c.id === id);
          resolve(client);
        }, 200);
      });
    }
  },

  create: async (client: Omit<Client, "id" | "createdAt" | "status">): Promise<Client> => {
    if (isRealSupabase()) {
      const orgId = useDBStore.getState().currentUser?.organizationId;
      if (!orgId) throw new Error("No active organization found. Please log in again.");

      const packedNotes = `__INDUSTRY__:${client.industry}__COMPETITORS__:${client.competitors || ""}__NOTES__:${client.notes || ""}`;

      const dbClientRow = {
        organization_id: orgId,
        name: client.name,
        contact_name: client.contactName,
        contact_email: client.contactEmail,
        contact_phone: client.contactPhone,
        website: client.website,
        notes: packedNotes,
        status: "active",
      };

      const { data, error } = await supabase
        .from("clients")
        .insert([dbClientRow])
        .select()
        .single();

      if (error) throw new Error(error.message);

      if (client.website) {
        BrandfetchService.syncBrandDirectory(data.id, orgId, client.website).catch(console.error);
      }

      const { industry, competitors, notes } = parseNotesMetadata(data.notes);

      return {
        id: data.id,
        name: data.name,
        contactName: data.contact_name,
        contactEmail: data.contact_email,
        contactPhone: data.contact_phone,
        website: data.website,
        notes,
        industry,
        competitors,
        status: data.status,
        createdAt: data.created_at,
      };
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          const newClient = useDBStore.getState().addClient(client);
          resolve(newClient);
        }, 300);
      });
    }
  },

  update: async (id: string, clientData: Partial<Client>): Promise<void> => {
    if (isRealSupabase()) {
      if (!id || !isUUID(id)) return;

      const { data: current } = await supabase.from("clients").select("notes").eq("id", id).single();
      const currentMeta = parseNotesMetadata(current?.notes || "");

      const nextIndustry = clientData.industry !== undefined ? clientData.industry : currentMeta.industry;
      const nextCompetitors = clientData.competitors !== undefined ? clientData.competitors : currentMeta.competitors;
      const nextNotes = clientData.notes !== undefined ? clientData.notes : currentMeta.notes;

      const dbUpdate: any = {};
      if (clientData.name !== undefined) dbUpdate.name = clientData.name;
      if (clientData.contactName !== undefined) dbUpdate.contact_name = clientData.contactName;
      if (clientData.contactEmail !== undefined) dbUpdate.contact_email = clientData.contactEmail;
      if (clientData.contactPhone !== undefined) dbUpdate.contact_phone = clientData.contactPhone;
      if (clientData.website !== undefined) dbUpdate.website = clientData.website;
      dbUpdate.notes = `__INDUSTRY__:${nextIndustry}__COMPETITORS__:${nextCompetitors}__NOTES__:${nextNotes}`;
      if (clientData.status !== undefined) dbUpdate.status = clientData.status;

      const { error } = await supabase
        .from("clients")
        .update(dbUpdate)
        .eq("id", id);

      if (error) throw new Error(error.message);
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          useDBStore.getState().updateClient(id, clientData);
          resolve();
        }, 250);
      });
    }
  },

  delete: async (id: string): Promise<void> => {
    if (isRealSupabase()) {
      if (!id || !isUUID(id)) return;

      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete client and associated user account");
      }
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          useDBStore.getState().deleteClient(id);
          resolve();
        }, 300);
      });
    }
  },

  archive: async (id: string): Promise<void> => {
    if (isRealSupabase()) {
      if (!id || !isUUID(id)) return;

      const { error } = await supabase
        .from("clients")
        .update({ status: "archived" })
        .eq("id", id);

      if (error) throw new Error(error.message);
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          useDBStore.getState().archiveClient(id);
          resolve();
        }, 250);
      });
    }
  },
};
