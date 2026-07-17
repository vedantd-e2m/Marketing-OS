import { useState, useEffect } from "react";
import { JobRepository, ImportJob } from "../repositories/jobRepository";
import { supabase } from "../utils/supabaseClient";
import { toast } from "sonner";

const isRealSupabase = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return !!url && !url.includes("placeholder-marketing-os");
};

export const useImportJobs = (campaignId: string) => {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [activeJob, setActiveJob] = useState<ImportJob | null>(null);

  const fetchJobs = async () => {
    try {
      const allJobs = await JobRepository.getImportJobs(campaignId);
      setJobs(allJobs);
      const runningOrQueued = allJobs.find((j) => {
        if (j.status !== "queued" && j.status !== "running") return false;
        const jobDate = new Date(j.createdAt).getTime();
        const now = Date.now();
        // If the job has been running for more than 5 minutes (300,000 ms), consider it a zombie/failed job
        if (now - jobDate > 300000) return false;
        return true;
      });
      setActiveJob(runningOrQueued || null);
    } catch (err) {
      console.error("Failed to fetch import jobs", err);
    }
  };

  useEffect(() => {
    fetchJobs();

    // Setup real-time listener
    if (isRealSupabase()) {
      // Subscribing to Supabase Realtime channel changes
      const channel = supabase
        .channel("platform_import_jobs_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "platform_import_jobs",
            filter: `campaign_id=eq.${campaignId}`,
          },
          (payload: any) => {
            console.log("Realtime Import Job change received", payload);
            fetchJobs();
            
            // Show toast on status completions
            if (payload.new && payload.new.status === "completed") {
              toast.success("Background import completed. Analytics refreshed.");
            } else if (payload.new && payload.new.status === "failed") {
              toast.error(`Background import failed: ${payload.new.error_message}`);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      // Fallback local event listener for V1 demo worker simulation
      const handleLocalJobUpdate = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        fetchJobs();
        if (detail.status === "completed") {
          toast.success("Background import completed. Mock metrics refreshed.");
        }
      };

      window.addEventListener("import_job_updated", handleLocalJobUpdate);
      return () => {
        window.removeEventListener("import_job_updated", handleLocalJobUpdate);
      };
    }
  }, [campaignId]);

  const triggerSync = async () => {
    if (activeJob) {
      toast.warning("A campaign import is already in progress.");
      return;
    }

    try {
      toast.info("Queueing background Instagram scraping job...");
      const newJob = await JobRepository.createImportJob(campaignId);
      setActiveJob(newJob);
      setJobs((prev) => [newJob, ...prev]);
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger sync job");
    }
  };

  return {
    jobs,
    activeJob,
    isSyncing: !!activeJob,
    triggerSync,
  };
};
