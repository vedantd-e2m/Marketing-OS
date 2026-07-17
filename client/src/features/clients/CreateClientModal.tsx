import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema } from "../../schemas";
import { ClientService } from "../../services/clientService";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "../../utils/supabaseClient";

type ClientFormInput = z.infer<typeof clientSchema>;

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateClientModal: React.FC<CreateClientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      website: "",
      notes: "",
      industry: "",
      competitors: "",
    },
  });

  const onSubmit = async (data: ClientFormInput) => {
    setIsLoading(true);
    try {
      let finalCompetitors = data.competitors?.trim();
      
      if (!finalCompetitors) {
        const cleanWebsite = data.website.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
        
        let competitorDomains: string[] = [];

        // Step 1: Discover competitor website domains using Cerebras semantic lookup
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token || '';
          
          const compPrompt = `You are a market intelligence agent. Given the client website "${cleanWebsite}" (industry: "${data.industry}"), return a simple comma-separated list of the top 5 competitor domains (e.g. puma.com, underarmour.com, nike.com, reebok.com, newbalance.com). Do NOT include "${cleanWebsite}" in the list. Return only the comma-separated domains, nothing else.`;
          const response = await fetch("/api/jobs/cerebras/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              model: "gemma-4-31b",
              messages: [{ role: "user", content: compPrompt }],
              temperature: 0.1,
            }),
          });
          if (response.ok) {
            const resJson = await response.json();
            const text = resJson.choices[0].message.content.trim();
            competitorDomains = text.split(",")
              .map((d: string) => d.trim().toLowerCase())
              .filter((d: string) => d && !d.includes(cleanWebsite) && !cleanWebsite.includes(d));
          }
        } catch (llmErr) {
          console.error("Cerebras domain lookup failed, using fallback:", llmErr);
        }

        if (competitorDomains.length === 0) {
          competitorDomains = ["puma.com", "underarmour.com", "nike.com", "reebok.com", "newbalance.com"];
        }

        // Step 2: Query Brandfetch Details API for each discovered domain to extract verified social links
        const competitorsList: any[] = [];
        for (const domain of competitorDomains) {
          let brandData: any = null;
          try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || '';

            const bfRes = await fetch(`/api/jobs/brandfetch/v2/brands/${domain}`, {
              headers: {
                "Authorization": `Bearer ${token}`
              }
            });
              if (bfRes.ok) {
                const dataJson = await bfRes.json();
                const links = dataJson.links || [];
                const getLink = (name: string) => links.find((l: any) => l.name === name)?.url || "";
                const baseName = domain.split(".")[0];
                const cleanName = dataJson.name ? 
                  (dataJson.name.toLowerCase() === baseName.toLowerCase() ? baseName.charAt(0).toUpperCase() + baseName.slice(1) : dataJson.name) 
                  : baseName.charAt(0).toUpperCase() + baseName.slice(1);
                  
                brandData = {
                  name: cleanName,
                  domain: domain,
                  instagram: getLink("instagram"),
                  linkedin: getLink("linkedin"),
                  reddit: getLink("reddit"),
                  twitter: getLink("twitter"),
                  facebook: getLink("facebook"),
                  youtube: getLink("youtube")
                };
              }
            } catch (bfErr) {
              console.error(`Brandfetch details failed for ${domain}:`, bfErr);
            }

          // Fallback if Brandfetch key is missing or down
          if (!brandData) {
            const baseName = domain.split(".")[0];
            brandData = {
              name: baseName.charAt(0).toUpperCase() + baseName.slice(1),
              domain: domain,
              instagram: `https://www.instagram.com/${baseName}/`,
              linkedin: `https://www.linkedin.com/company/${baseName}/`,
              reddit: `https://www.reddit.com/r/${baseName}/`,
              twitter: `https://twitter.com/${baseName}`,
              facebook: `https://facebook.com/${baseName}`,
              youtube: `https://youtube.com/${baseName}`
            };
          }
          competitorsList.push(brandData);
        }

        finalCompetitors = JSON.stringify(competitorsList);
      }

      const newClient = await ClientService.createClient({
        ...data,
        competitors: finalCompetitors,
      });

      // Send Invite Email to Client
      try {
        const nameParts = data.contactName.trim().split(" ");
        const firstName = nameParts[0] || "Client";
        const lastName = nameParts.slice(1).join(" ") || "User";

        const authHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };
        
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          authHeaders["Authorization"] = `Bearer ${session.access_token}`;
        }

        const inviteRes = await fetch("/api/admin/invite-client", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            email: data.contactEmail,
            firstName,
            lastName,
            clientId: newClient.id,
            redirectTo: window.location.origin,
          })
        });

        if (!inviteRes.ok) {
          const errData = await inviteRes.json().catch(() => ({}));
          console.error("Invite client error:", errData);
          toast.warning("Client created, but failed to generate invite link.");
        } else {
          const resData = await inviteRes.json();
          if (resData.action_link) {
            toast.success("Client account created! Invite link generated.", {
              description: `Share this link with the client: ${resData.action_link}`,
              duration: 30000,
              action: {
                label: "Copy Link",
                onClick: () => {
                  navigator.clipboard.writeText(resData.action_link);
                  toast.success("Invite link copied to clipboard!");
                }
              }
            });
          }
        }
      } catch (inviteErr) {
        console.error("Invite client request failed:", inviteErr);
        toast.warning("Client created, but failed to connect to invite service.");
      }

      // Display clean names in toast summary
      let competitorsBrief = finalCompetitors;
      try {
        const parsed = JSON.parse(finalCompetitors);
        if (Array.isArray(parsed)) {
          competitorsBrief = parsed.map((c: any) => c.name).join(", ");
        }
      } catch {}

      if (!competitorsBrief.includes("[")) {
        toast.success(`Client "${data.name}" created. Discovered competitors: ${competitorsBrief}`);
      }
      reset();
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to create client");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Create New Client"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <Input
          label="Client Company Name"
          placeholder="e.g. Apex Athletica"
          error={errors.name?.message}
          {...register("name")}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Industry / Domain"
            placeholder="e.g. sneakers, skincare"
            error={errors.industry?.message}
            {...register("industry")}
          />
          <Input
            label="Competitor IG Handles (Comma separated)"
            placeholder="e.g. adidas, puma, underarmour"
            error={errors.competitors?.message}
            {...register("competitors")}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Contact Person Name"
            placeholder="Marcus Vance"
            error={errors.contactName?.message}
            {...register("contactName")}
          />
          <Input
            label="Website Address"
            placeholder="apexathletica.com"
            error={errors.website?.message}
            {...register("website")}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Contact Email"
            placeholder="marcus@company.com"
            error={errors.contactEmail?.message}
            {...register("contactEmail")}
          />
          <Input
            label="Contact Phone"
            placeholder="+1 (555) 234-5678"
            error={errors.contactPhone?.message}
            {...register("contactPhone")}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Internal Notes (Optional)
          </label>
          <textarea
            placeholder="Describe client goals, context, and focus areas..."
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register("notes")}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset();
              onClose();
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create Client
          </Button>
        </div>
      </form>
    </Modal>
  );
};
