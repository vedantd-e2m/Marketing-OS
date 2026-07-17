import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { campaignSchema } from "../../schemas";
import { CampaignService } from "../../services/campaignService";
import { JobRepository } from "../../repositories/jobRepository";
import { useDBStore } from "../../store/dbStore";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { toast } from "sonner";
import { z } from "zod";

type CampaignFormInput = z.infer<typeof campaignSchema>;

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: string; // Preselected client ID if launched from detail page
  onSuccess?: () => void;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
  clientId,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { clients, currentUser } = useDBStore();
  const isClientRole = currentUser?.role === "client";

  const [selectedClient, setSelectedClient] = useState(clientId || (clients[0]?.id || ""));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      platform: "instagram",
      platformClientId: "",
      description: "",
      status: "active",
    },
  });

  const onSubmit = async (data: CampaignFormInput) => {
    let finalClientId = clientId || selectedClient;
    
    // If the user is a client, force the campaign to belong to their client profile
    if (isClientRole && currentUser?.clientId) {
      finalClientId = currentUser.clientId;
    }

    if (!finalClientId) {
      toast.error("Please select a client for this campaign");
      return;
    }

    setIsLoading(true);
    try {
      const createdCampaign = await CampaignService.createCampaign({
        ...data,
        clientId: finalClientId,
      });

      // Automatically trigger the scraping and LLM analysis pipeline for the post
      await JobRepository.createImportJob(createdCampaign.id, createdCampaign);

      toast.success(`Campaign "${data.name}" added & sync job started successfully.`);
      reset();
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to create campaign");
    } finally {
      setIsLoading(false);
    }
  };

  const clientOptions = clients.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const platformOptions = [
    { value: "instagram", label: "Instagram" },
    { value: "twitter", label: "Twitter / X" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "reddit", label: "Reddit" },
  ];

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "paused", label: "Paused" },
    { value: "completed", label: "Completed" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Launch New Campaign"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        {/* Render client picker if not launched within client context and user is not a client */}
        {!clientId && !isClientRole && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select Client
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none cursor-pointer pr-10"
            >
              {clientOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <Input
          label="Campaign Name"
          placeholder="e.g. Apex Summer Launch 2026"
          error={errors.name?.message}
          {...register("name")}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Target Platform"
            options={platformOptions}
            error={errors.platform?.message}
            {...register("platform")}
          />
          <Input
            label="Social Media Profile Link"
            placeholder="e.g. Paste the brand's profile URL..."
            error={errors.platformClientId?.message}
            {...register("platformClientId")}
            {...register("platformClientId")}
          />
        </div>

        <Select
          label="Initial Campaign Status"
          options={statusOptions}
          error={errors.status?.message}
          {...register("status")}
        />

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Campaign Description & Objectives
          </label>
          <textarea
            placeholder="Outline objectives, key metrics targets, hashtag strategies..."
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register("description")}
          />
          {errors.description && (
            <p className="text-xs text-destructive font-medium">{errors.description.message?.toString()}</p>
          )}
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
            Launch Campaign
          </Button>
        </div>
      </form>
    </Modal>
  );
};
