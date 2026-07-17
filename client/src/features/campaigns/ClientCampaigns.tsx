import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, LayoutGrid, Layers, Activity, Search } from "lucide-react";
import { useDBStore } from "../../store/dbStore";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { CreateCampaignModal } from "./CreateCampaignModal";
import { CampaignService } from "../../services/campaignService";
import { toast } from "sonner";

export const ClientCampaigns: React.FC = () => {
  const navigate = useNavigate();
  const { campaigns, clients, currentUser, loadFromDatabase } = useDBStore();
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this campaign? This action is permanent and will delete it for administrators as well.")) {
      try {
        await CampaignService.deleteCampaign(id);
        toast.success("Campaign deleted");
        loadFromDatabase();
      } catch (err) {
        toast.error("Failed to delete campaign");
      }
    }
  };

  const handleToggleArchive = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "archived" ? "active" : "archived";
      await CampaignService.updateCampaign(id, { status: newStatus as any });
      toast.success(`Campaign ${newStatus} successfully`);
      loadFromDatabase();
    } catch (err) {
      toast.error("Failed to update campaign status");
    }
  };

  // Only show campaigns belonging to this client
  const clientCampaigns = campaigns.filter((c) => c.clientId === currentUser?.clientId);

  const filteredCampaigns = clientCampaigns.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Campaigns</h1>
          <p className="text-sm text-muted-foreground">Manage your marketing campaigns and track their performance.</p>
        </div>
        <Button onClick={() => setIsCampaignModalOpen(true)} className="gap-2 cursor-pointer shadow-md bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="h-4 w-4" /> Launch Campaign
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 bg-background border border-border p-3 rounded-lg">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-secondary/50 focus:bg-background border border-input rounded-md pl-9 pr-4 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* Campaigns Grid */}
      {filteredCampaigns.length === 0 ? (
        <Card className="border-dashed border-2 bg-neutral-50/50 dark:bg-neutral-900/10">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-2">
              <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">No campaigns found</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {searchQuery
                  ? `No campaigns match your search "${searchQuery}".`
                  : "You haven't launched any marketing campaigns yet. Click the button above to get started."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((camp) => (
            <Card key={camp.id} className="group hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                  <CardTitle className="text-base font-bold line-clamp-1">{camp.name}</CardTitle>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xxs font-bold capitalize whitespace-nowrap ${
                      camp.status === "active"
                        ? "bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
                        : camp.status === "paused"
                        ? "bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400"
                        : "bg-neutral-100 dark:bg-neutral-800 text-muted-foreground"
                    }`}
                  >
                    {camp.status}
                  </span>
                </div>
                <CardDescription className="line-clamp-2 text-xs mt-1.5 min-h-[32px]">
                  {camp.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 bg-neutral-50 dark:bg-neutral-900/40 p-3 rounded-lg border border-border">
                    <div>
                      <div className="text-xxs font-bold text-muted-foreground uppercase tracking-wider mb-1">Platform</div>
                      <div className="text-sm font-medium capitalize flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                        {camp.platform}
                      </div>
                    </div>
                    <div>
                      <div className="text-xxs font-bold text-muted-foreground uppercase tracking-wider mb-1">Last Sync</div>
                      <div className="text-sm font-medium">
                        {camp.lastSyncAt ? new Date(camp.lastSyncAt).toLocaleDateString() : "Pending"}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-muted-foreground font-medium">
                      Created {new Date(camp.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                      {currentUser?.role !== 'client' && (
                        <>
                          <Button 
                            onClick={() => handleToggleArchive(camp.id, camp.status)} 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs cursor-pointer h-8 px-2"
                            title={camp.status === "archived" ? "Unarchive" : "Archive"}
                          >
                            {camp.status === "archived" ? "Unarchive" : "Archive"}
                          </Button>
                          <Button 
                            onClick={() => handleDelete(camp.id)} 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs cursor-pointer text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 px-2"
                            title="Delete"
                          >
                            Delete
                          </Button>
                        </>
                      )}
                      <Button 
                        onClick={() => navigate(`/campaigns/${camp.id}`)} 
                        variant="secondary" 
                        size="sm" 
                        className="text-xs cursor-pointer font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50"
                      >
                        View Analytics
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateCampaignModal 
        isOpen={isCampaignModalOpen} 
        onClose={() => setIsCampaignModalOpen(false)} 
        onSuccess={() => loadFromDatabase()}
      />
    </div>
  );
};
