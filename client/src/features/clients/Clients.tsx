import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Building, Mail, Phone, Globe, Edit2, Trash2, Archive, ArrowRight, ExternalLink } from "lucide-react";
import { useDBStore } from "../../store/dbStore";
import { ClientService } from "../../services/clientService";
import { CreateClientModal } from "./CreateClientModal";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema } from "../../schemas";
import { toast } from "sonner";
import { Client } from "../../types";
import { z } from "zod";

export const Clients: React.FC = () => {
  const navigate = useNavigate();
  const { clients, campaigns, loadFromDatabase } = useDBStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Filter clients based on search query
  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCampaignCount = (clientId: string) => {
    return campaigns.filter((c) => c.clientId === clientId).length;
  };

  const handleDeleteClient = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete client "${name}"? This deletes all associated campaigns and reports.`)) {
      await ClientService.deleteClient(id);
      toast.success(`Client "${name}" was deleted successfully.`);
      loadFromDatabase();
    }
  };

  const handleArchiveClient = async (id: string, name: string) => {
    await ClientService.archiveClient(id);
    toast.success(`Client "${name}" archived successfully.`);
    loadFromDatabase();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients Registry</h1>
          <p className="text-sm text-muted-foreground">
            Manage your client profiles, contacts, and linked active campaigns.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-1.5 cursor-pointer">
          <Plus className="h-4 w-4" /> Create Client
        </Button>
      </div>

      {/* Filter and Search actions */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Filter clients by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-background border border-input rounded-md pl-9 pr-4 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
        />
      </div>

      {/* Grid of client cards */}
      {filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-lg bg-neutral-50/50 dark:bg-neutral-900/5 mt-8 space-y-4">
          <Building className="h-10 w-10 text-muted-foreground" />
          <div className="space-y-1">
            <h3 className="font-semibold text-base">No clients matched.</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {searchQuery ? "Try refining your search keyword." : "Click below to register your very first client."}
            </p>
          </div>
          {!searchQuery && (
            <Button onClick={() => setIsCreateOpen(true)} size="sm">
              Register Client
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => {
            const campCount = getCampaignCount(client.id);

            return (
              <Card
                key={client.id}
                className={`relative flex flex-col justify-between ${
                  client.status === "archived" ? "opacity-60 bg-neutral-50/50" : ""
                }`}
              >
                <div>
                  <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-bold text-foreground">
                          {client.name}
                        </CardTitle>
                        {client.status === "archived" && (
                          <span className="text-xxs px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-muted-foreground font-medium uppercase">
                            Archived
                          </span>
                        )}
                      </div>
                      <a
                        href={`https://${client.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {client.website} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    
                    {/* Count badge */}
                    <div className="px-2 py-1 rounded bg-secondary text-xxs font-bold text-foreground border border-border">
                      {campCount} {campCount === 1 ? "Campaign" : "Campaigns"}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pb-4">
                    {/* Notes preview */}
                    {client.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2 italic bg-neutral-50 dark:bg-neutral-900/40 p-2.5 rounded border border-border">
                        "{client.notes}"
                      </p>
                    )}
                    
                    {/* Contacts block */}
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{client.contactName} ({client.contactEmail})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{client.contactPhone}</span>
                      </div>
                    </div>

                    {/* Discovered Competitors */}
                    {client.competitors && (
                      <div className="space-y-1.5 pt-2 border-t border-dashed border-border mt-2">
                        <span className="text-xxs font-bold uppercase tracking-wider text-muted-foreground block">
                          Discovered Competitors
                        </span>
                        <div className="flex flex-wrap gap-1">
                           {(() => {
                            let list: any[] = [];
                            try {
                              let raw = client.competitors.trim();
                              let parsed = raw;
                              for (let i = 0; i < 4; i++) {
                                if (typeof parsed === "string") {
                                  const trimmed = parsed.trim();
                                  if (trimmed.startsWith("[") || trimmed.startsWith("{") || trimmed.startsWith('"') || trimmed.startsWith('\\"')) {
                                    parsed = JSON.parse(trimmed);
                                  } else {
                                    break;
                                  }
                                }
                              }
                              
                              if (!Array.isArray(parsed)) {
                                const sanitized = raw.replace(/'/g, '"');
                                parsed = sanitized;
                                for (let i = 0; i < 4; i++) {
                                  if (typeof parsed === "string") {
                                    const trimmed = parsed.trim();
                                    if (trimmed.startsWith("[") || trimmed.startsWith("{") || trimmed.startsWith('"') || trimmed.startsWith('\\"')) {
                                      parsed = JSON.parse(trimmed);
                                    } else {
                                      break;
                                    }
                                  }
                                }
                              }

                              if (Array.isArray(parsed)) {
                                list = parsed;
                              }
                            } catch {}
                            
                            if (list.length === 0 && !client.competitors.includes("{") && !client.competitors.includes("[")) {
                              list = client.competitors.split(",").map((c: string) => ({ name: c.trim() }));
                            }
                            
                            return list.slice(0, 4).map((comp: any, idx: number) => (
                              <span 
                                key={idx}
                                className="inline-flex items-center text-xxs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 font-semibold border border-blue-100 dark:border-blue-900/30"
                              >
                                {comp.name}
                              </span>
                            ));
                          })()}
                          {(() => {
                            try {
                              let raw = client.competitors.trim();
                              let parsed = raw;
                              for (let i = 0; i < 4; i++) {
                                if (typeof parsed === "string") {
                                  const trimmed = parsed.trim();
                                  if (trimmed.startsWith("[") || trimmed.startsWith("{") || trimmed.startsWith('"') || trimmed.startsWith('\\"')) {
                                    parsed = JSON.parse(trimmed);
                                  } else {
                                    break;
                                  }
                                }
                              }
                              if (!Array.isArray(parsed)) {
                                const sanitized = raw.replace(/'/g, '"');
                                parsed = sanitized;
                                for (let i = 0; i < 4; i++) {
                                  if (typeof parsed === "string") {
                                    const trimmed = parsed.trim();
                                    if (trimmed.startsWith("[") || trimmed.startsWith("{") || trimmed.startsWith('"') || trimmed.startsWith('\\"')) {
                                      parsed = JSON.parse(trimmed);
                                    } else {
                                      break;
                                    }
                                  }
                                }
                              }
                              if (Array.isArray(parsed) && parsed.length > 4) {
                                return (
                                  <span className="text-xxs text-muted-foreground self-center font-medium">
                                    +{parsed.length - 4} more
                                  </span>
                                );
                              }
                            } catch {}
                            return null;
                          })()}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </div>

                <CardFooter className="flex justify-between items-center py-3 bg-secondary/30 dark:bg-neutral-900/10 border-t border-border mt-0 rounded-b-lg">
                  {/* Actions buttons */}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-background cursor-pointer"
                      onClick={() => setEditingClient(client)}
                    >
                      <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </Button>
                    
                    {client.status !== "archived" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-background cursor-pointer"
                        onClick={() => handleArchiveClient(client.id, client.name)}
                      >
                        <Archive className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-destructive/10 cursor-pointer"
                      onClick={() => handleDeleteClient(client.id, client.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs gap-1 hover:bg-background cursor-pointer"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    Open Profile <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Client Modal */}
      <CreateClientModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadFromDatabase}
      />

      {/* Edit Client Modal */}
      {editingClient && (
        <EditClientModal
          isOpen={!!editingClient}
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onSuccess={loadFromDatabase}
        />
      )}
    </div>
  );
};

// Sub-component for Editing Client Details
interface EditClientModalProps {
  isOpen: boolean;
  client: Client;
  onClose: () => void;
  onSuccess?: () => void;
}

const EditClientModal: React.FC<EditClientModalProps> = ({ isOpen, client, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client.name,
      contactName: client.contactName,
      contactEmail: client.contactEmail,
      contactPhone: client.contactPhone,
      website: client.website,
      notes: client.notes,
      industry: client.industry,
      competitors: client.competitors,
    },
  });

  const onSubmit = async (data: z.infer<typeof clientSchema>) => {
    setIsLoading(true);
    try {
      await ClientService.updateClient(client.id, data);
      toast.success("Client information updated successfully.");
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to update client details");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Client Details — ${client.name}`} size="md">
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
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            {...register("notes")}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border mt-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
