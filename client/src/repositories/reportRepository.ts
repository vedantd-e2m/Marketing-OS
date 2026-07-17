import { Report } from "../types";
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

const mapReportFromDB = (rep: any): Report => {
  const sections = rep.report_sections || [];
  const summarySec = sections.find((s: any) => s.section_type === "summary");
  const metricsSec = sections.find((s: any) => s.section_type === "metrics");
  const insightsSec = sections.find((s: any) => s.section_type === "insights");

  return {
    id: rep.id,
    clientId: rep.client_id,
    campaignId: rep.campaign_id,
    name: rep.name,
    dateRange: {
      start: rep.start_date,
      end: rep.end_date,
    },
    platform: "instagram", // default platform
    status: rep.status,
    createdAt: rep.created_at,
    executiveSummary: summarySec?.content?.text || "",
    kpis: metricsSec?.content || { reach: 0, impressions: 0, engagementRate: 0, followersGained: 0 },
    recommendations: insightsSec?.content?.list || [],
  };
};

export const ReportRepository = {
  getAll: async (): Promise<Report[]> => {
    if (isRealSupabase()) {
      const { data, error } = await supabase
        .from("reports")
        .select("*, report_sections(*)")
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return (data as any[]).map(mapReportFromDB);
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(useDBStore.getState().reports);
        }, 300);
      });
    }
  },

  getByClientId: async (clientId: string): Promise<Report[]> => {
    if (isRealSupabase()) {
      if (!clientId || !isUUID(clientId)) return [];

      const { data, error } = await supabase
        .from("reports")
        .select("*, report_sections(*)")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return (data as any[]).map(mapReportFromDB);
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          const reports = useDBStore.getState().reports.filter(
            (r) => r.clientId === clientId
          );
          resolve(reports);
        }, 200);
      });
    }
  },

  create: async (report: Omit<Report, "id" | "createdAt">): Promise<Report> => {
    if (isRealSupabase()) {
      const orgId = useDBStore.getState().currentUser?.organizationId;
      if (!orgId) throw new Error("No active organization found. Please log in again.");

      // 1. Insert parent report row
      const { data: repData, error: repError } = await supabase
        .from("reports")
        .insert([{
          organization_id: orgId,
          client_id: report.clientId,
          campaign_id: report.campaignId,
          name: report.name,
          start_date: report.dateRange.start,
          end_date: report.dateRange.end,
          status: report.status,
        }])
        .select()
        .single();

      if (repError) throw new Error(repError.message);

      // 2. Insert child sections for content split
      const sections = [
        {
          report_id: repData.id,
          title: "Executive Summary",
          section_type: "summary",
          sort_order: 1,
          content: { text: report.executiveSummary },
        },
        {
          report_id: repData.id,
          title: "Key Performance Indicators",
          section_type: "metrics",
          sort_order: 2,
          content: report.kpis,
        },
        {
          report_id: repData.id,
          title: "Recommendations",
          section_type: "insights",
          sort_order: 3,
          content: { list: report.recommendations },
        },
      ];

      const { error: secError } = await supabase
        .from("report_sections")
        .insert(sections);

      if (secError) throw new Error(secError.message);

      return {
        ...report,
        id: repData.id,
        createdAt: repData.created_at,
      };
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          const newReport = useDBStore.getState().addReport(report);
          resolve(newReport);
        }, 300);
      });
    }
  },

  delete: async (id: string): Promise<void> => {
    if (isRealSupabase()) {
      if (!id || !isUUID(id)) return;

      const { error } = await supabase
        .from("reports")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          useDBStore.getState().deleteReport(id);
          resolve();
        }, 250);
      });
    }
  },
};
