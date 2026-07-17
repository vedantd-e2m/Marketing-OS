import { supabase } from "../utils/supabaseClient";

export interface BrandfetchData {
  logos: any;
  colors: any;
  fonts: any;
  description?: string;
  long_description?: string;
  mission?: string;
  products?: string;
  images?: any;
  industries?: any;
  tagline?: string;
  social_links: any;
  value_proposition?: string;
  target_audience?: string;
  brand_voice_attributes?: any;
  brand_voice_avoid?: any;
  brand_style?: string;
  company_size?: string;
  founded_year?: string;
  company_kind?: string;
  company_location?: any;
}

export const BrandfetchService = {
  fetchBrandData: async (domain: string): Promise<BrandfetchData | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const response = await fetch(`/api/jobs/brandfetch/v2/brands/${domain}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        console.warn(`Brandfetch API failed: ${response.statusText}`);
        return null;
      }
      const data = await response.json();
      
      // Map Brandfetch data to our structure
      const logos = data.logos || [];
      const colors = data.colors || [];
      const fonts = data.fonts || [];
      const links = data.links || [];
      const images = data.images || [];
      const industries = data.tags || data.industries || [];
      
      return {
        logos,
        colors,
        fonts,
        social_links: links,
        description: data.description || "",
        long_description: data.longDescription || data.long_description || "",
        mission: data.mission || "",
        products: data.products || "",
        images,
        industries,
        tagline: data.title || data.tagline || "",
        value_proposition: data.valueProposition || data.value_proposition || "",
        target_audience: data.targetAudience || data.target_audience || "",
        brand_voice_attributes: data.brandVoiceAttributes || data.brandVoice?.attributes || data.brand_voice_attributes || "",
        brand_voice_avoid: data.brandVoiceAvoid || data.brandVoice?.avoid || data.brand_voice_avoid || "",
        brand_style: data.brandStyle || data.brand_style || "",
        company_size: data.companySize || data.company?.employees || data.employees || "",
        founded_year: data.foundedYear || data.company?.foundedYear || "",
        company_kind: data.companyKind || data.company?.kind || data.kind || "",
        company_location: data.companyLocation || data.company?.location || data.location || "",
      };
    } catch (error) {
      console.error("Error fetching from Brandfetch:", error);
      return null;
    }
  },

  syncBrandDirectory: async (clientId: string, orgId: string, domain: string): Promise<void> => {
    try {
      // Basic domain extraction
      let cleanDomain = domain;
      try {
        cleanDomain = new URL(domain.startsWith("http") ? domain : `https://${domain}`).hostname;
      } catch (e) {
        // Fallback
      }

      const brandData = await BrandfetchService.fetchBrandData(cleanDomain);
      if (!brandData) return;

      const { error } = await supabase.from("brand_directories").upsert({
        client_id: clientId,
        organization_id: orgId,
        logos: brandData.logos,
        colors: brandData.colors,
        fonts: brandData.fonts,
        description: brandData.description,
        long_description: brandData.long_description,
        mission: brandData.mission,
        products: brandData.products,
        images: brandData.images,
        industries: brandData.industries,
        tagline: brandData.tagline,
        social_links: brandData.social_links,
        value_proposition: brandData.value_proposition,
        target_audience: brandData.target_audience,
        brand_voice_attributes: brandData.brand_voice_attributes,
        brand_voice_avoid: brandData.brand_voice_avoid,
        brand_style: brandData.brand_style,
        company_size: brandData.company_size,
        founded_year: brandData.founded_year,
        company_kind: brandData.company_kind,
        company_location: brandData.company_location,
      }, { onConflict: 'client_id' });
      
      if (error) {
        console.error("Error saving brand directory to Supabase:", error);
      }
    } catch (error) {
      console.error("Error in syncBrandDirectory:", error);
    }
  }
};
