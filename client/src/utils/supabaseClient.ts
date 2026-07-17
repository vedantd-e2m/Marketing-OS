import { createClient, SupabaseClient } from "@supabase/supabase-js";

export let supabase: SupabaseClient;

export let appConfig: any = {};

export const initSupabase = async () => {
  try {
    const res = await fetch("/api/config");
    if (!res.ok) throw new Error("Failed to fetch configuration");
    const config = await res.json();
    appConfig = config;
    
    supabase = createClient(
      config.supabaseUrl || "https://placeholder-marketing-os.supabase.co", 
      config.supabaseAnonKey || "placeholderKeyGoesHere"
    );
  } catch (err) {
    console.error("Initialization error:", err);
    // Fallback or handle failure
    supabase = createClient(
      "https://placeholder-marketing-os.supabase.co", 
      "placeholderKeyGoesHere"
    );
  }
};
