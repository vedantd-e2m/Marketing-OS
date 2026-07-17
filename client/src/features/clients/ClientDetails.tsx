import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import {
  Building,
  Mail,
  Phone,
  Globe,
  Plus,
  ArrowLeft,
  Calendar,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Settings,
  Trash2
} from "lucide-react";
import { useDBStore } from "../../store/dbStore";
import { ClientService } from "../../services/clientService";
import { CampaignService } from "../../services/campaignService";
import { CreateCampaignModal } from "../campaigns/CreateCampaignModal";
import { BrandDirectoryCard } from "../../components/ui/BrandDirectoryCard";
import { ClientProfileHeader } from "../../components/ui/ClientProfileHeader";
import { BrandfetchService } from "../../services/brandfetchService";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../../components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Skeleton } from "../../components/ui/Skeleton";
import { toast } from "sonner";
import { Client, Campaign } from "../../types";

export const ClientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { clients, campaigns, loadFromDatabase } = useDBStore();

  const [client, setClient] = useState<Client | null>(null);
  const [clientCampaigns, setClientCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [openDropdownIdx, setOpenDropdownIdx] = useState<number | null>(null);
  const [brandDirectory, setBrandDirectory] = useState<any>(null);

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const fetchedClient = await ClientService.getClientById(id);
      const campaignsData = await CampaignService.getCampaignsByClientId(id);
      
      if (fetchedClient) {
        setClient(fetchedClient);
        setClientCampaigns(campaignsData);
        
        // Fetch brand directory
        try {
          const { data: bdData } = await supabase.from("brand_directories").select("*").eq("client_id", id).maybeSingle();
          if (bdData) {
            setBrandDirectory(bdData);
          } else if (fetchedClient?.website) {
            // Repair missing brand directory
            const orgId = useDBStore.getState().currentUser?.organizationId || "default_org";
            await BrandfetchService.syncBrandDirectory(id, orgId, fetchedClient.website);
            const { data: newBdData } = await supabase.from("brand_directories").select("*").eq("client_id", id).maybeSingle();
            if (newBdData) setBrandDirectory(newBdData);
          }
        } catch (e) {
          console.error("Failed to fetch brand directory", e);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load client details");
      navigate("/clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id, clients, campaigns]);

  const handleDeleteCampaign = async (campaignId: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete campaign "${name}"?`)) {
      await CampaignService.deleteCampaign(campaignId);
      toast.success(`Campaign "${name}" deleted.`);
      fetchDetails();
      loadFromDatabase();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-44" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Breadcrumbs and back actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/clients")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Clients
        </button>
        <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" /> Registered: {new Date(client.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Top Section: Client Profile Details Card */}
      <ClientProfileHeader client={client} />

      {/* Brand Directory Section */}
      {brandDirectory && (
        <BrandDirectoryCard brandDirectory={brandDirectory} />
      )}

      {/* Bottom Section: Campaigns list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold">Campaigns Registry</CardTitle>
            <CardDescription>Launch and oversee platforms campaigns for this client profile.</CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsCampaignModalOpen(true)} className="gap-1.5 cursor-pointer">
            <Plus className="h-4 w-4" /> Create Campaign
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {clientCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
              <p className="text-sm text-muted-foreground">No campaigns yet for {client.name}.</p>
              <Button variant="outline" size="sm" onClick={() => setIsCampaignModalOpen(true)}>
                Launch First Campaign
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Campaign Name</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Platform Handle/ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientCampaigns.map((camp) => (
                  <TableRow key={camp.id}>
                    <TableCell className="pl-6 font-semibold text-foreground">
                      {camp.name}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xxs font-bold uppercase ${
                        camp.platform === "twitter"
                          ? "bg-blue-100 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400"
                          : camp.platform === "linkedin"
                          ? "bg-blue-100 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300"
                          : camp.platform === "reddit"
                          ? "bg-orange-100 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400"
                          : "bg-pink-100 dark:bg-pink-950/20 text-pink-700 dark:text-pink-400"
                      }`}>
                        {camp.platform}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {camp.platformClientId}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xxs font-semibold capitalize ${
                          camp.status === "active"
                            ? "bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
                            : camp.status === "paused"
                            ? "bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400"
                            : "bg-neutral-100 dark:bg-neutral-800 text-muted-foreground"
                        }`}
                      >
                        {camp.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {camp.lastSyncAt ? new Date(camp.lastSyncAt).toLocaleString('en-US', {month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'}) : new Date(camp.createdAt).toLocaleString('en-US', {month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'})}
                    </TableCell>
                    <TableCell className="pr-6 text-right flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs gap-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                        onClick={() => navigate(`/campaigns/${camp.id}`)}
                      >
                        Analytics <ChevronRight className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-destructive/10 cursor-pointer text-destructive"
                        onClick={() => handleDeleteCampaign(camp.id, camp.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Floating modals */}
      <CreateCampaignModal
        isOpen={isCampaignModalOpen}
        clientId={client.id}
        onClose={() => setIsCampaignModalOpen(false)}
        onSuccess={() => {
          fetchDetails();
          loadFromDatabase();
        }}
      />
    </div>
  );
};
