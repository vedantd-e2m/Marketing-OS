import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Plus, Calendar, Building, Activity, Download, Eye, Trash2, Printer } from "lucide-react";
import { useDBStore } from "../../store/dbStore";
import { ReportService } from "../../services/reportService";
import { clientSchema, reportSchema } from "../../schemas";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "../../components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { toast } from "sonner";
import { z } from "zod";
import { Report } from "../../types";

type ReportFormInput = z.infer<typeof reportSchema>;

export const Reports: React.FC = () => {
  const { clients, campaigns, reports, loadFromDatabase, currentUser } = useDBStore();

  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Set first report as active by default if available
  useEffect(() => {
    if (reports.length > 0 && !activeReport) {
      setActiveReport(reports[0]);
    }
  }, [reports, activeReport]);

  const handleDeleteReport = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      await ReportService.deleteReport(id);
      toast.success("Report deleted.");
      if (activeReport?.id === id) {
        setActiveReport(null);
      }
      loadFromDatabase();
    }
  };

  const handleExportPDF = () => {
    if (!activeReport) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeReport, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${activeReport.name.replace(/\s+/g, '_')}_report.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success("Report data exported as JSON successfully.");
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date(dateString));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports Portal</h1>
          <p className="text-sm text-muted-foreground">
            Generate and export PDF analytics digests for clients.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-1.5 cursor-pointer">
          <Plus className="h-4 w-4" /> Generate Report
        </Button>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-lg bg-neutral-50/50 dark:bg-neutral-900/5 mt-8 space-y-4">
          <FileText className="h-10 w-10 text-muted-foreground" />
          <div className="space-y-1">
            <h3 className="font-semibold text-base">No reports generated.</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Select clients and campaign date ranges to compile an analytical report.
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} size="sm">
            Generate First Report
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT COLUMN: REPORTS TABLE LIST */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Generated Documents</CardTitle>
                <CardDescription>Select a row to preview page details.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 max-h-[70vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Report Name</TableHead>
                      <TableHead className="pr-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((rep) => {
                      const isSelected = activeReport?.id === rep.id;
                      return (
                        <TableRow
                          key={rep.id}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? "bg-secondary font-medium" : ""
                          }`}
                          onClick={() => setActiveReport(rep)}
                        >
                          <TableCell className="pl-4 py-3">
                            <div className="space-y-0.5">
                              <p className="text-sm text-foreground line-clamp-1">{rep.name}</p>
                              <p className="text-xxs text-muted-foreground font-mono">
                                {rep.dateRange.start} to {rep.dateRange.end}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="pr-4 py-3 text-right">
                            {currentUser?.role !== 'client' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-destructive/10 text-destructive shrink-0 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteReport(rep.id);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: ACTIVE REPORT VIEW PORT (PDF LOOKALIKE) */}
          <div className="lg:col-span-3">
            {activeReport ? (
              <Card className="border-border shadow-sm h-full flex flex-col justify-between">
                <div>
                  {/* Top report actions bar */}
                  <div className="px-6 py-3 border-b border-border bg-neutral-50 dark:bg-neutral-900/20 flex justify-between items-center rounded-t-lg">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                      Report Document ID: {activeReport.id}
                    </span>
                    <Button variant="outline" size="sm" onClick={handleExportPDF} className="h-8 text-xs gap-1.5 cursor-pointer hidden md:flex">
                      <Download className="h-3.5 w-3.5" /> Raw JSON
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="h-8 text-xs gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90">
                      <Printer className="h-3.5 w-3.5" /> Download PDF Report
                    </Button>
                  </div>

                  {/* Simulated Paper Sheets */}
                  <div className="p-6 md:p-8 space-y-6 bg-white dark:bg-neutral-950 font-sans text-neutral-900 dark:text-neutral-100 min-h-[500px]">
                    
                    {/* Header Block */}
                    <div className="border-b-2 border-primary pb-4 flex justify-between items-start">
                      <div className="space-y-1.5">
                        <h2 className="text-xl font-bold tracking-tight uppercase">Campaign Performance Review</h2>
                        <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
                          {activeReport.name}
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" /> Reporting Window: {activeReport.dateRange.start} to {activeReport.dateRange.end}
                        </p>
                      </div>
                      <div className="text-right text-xs space-y-0.5 text-muted-foreground">
                        <p className="font-bold text-foreground">Marketing OS V1</p>
                        <p>Platform: Instagram</p>
                        <p>Compiled: {formatDateTime(activeReport.createdAt)}</p>
                      </div>
                    </div>

                    {/* Metadata Context */}
                    <div className="grid grid-cols-2 gap-4 text-xs bg-neutral-50 dark:bg-neutral-900/30 p-3.5 rounded border border-border">
                      <div className="space-y-1">
                        <p className="font-semibold text-muted-foreground uppercase text-xxs">Client Account</p>
                        <p className="font-semibold text-foreground">
                          {clients.find((c) => c.id === activeReport.clientId)?.name || "Unknown client"}
                        </p>
                        <p className="text-muted-foreground">
                          {clients.find((c) => c.id === activeReport.clientId)?.website}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-muted-foreground uppercase text-xxs">Marketing Campaign</p>
                        <p className="font-semibold text-foreground">
                          {campaigns.find((c) => c.id === activeReport.campaignId)?.name || "Unknown campaign"}
                        </p>
                        <p className="text-muted-foreground">
                          Platform Handle: @{campaigns.find((c) => c.id === activeReport.campaignId)?.platformClientId}
                        </p>
                      </div>
                    </div>

                    {/* KPI Numbers Grid */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Key Metrics Aggregations</h4>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 border border-border rounded text-center min-w-0 flex flex-col justify-center">
                          <div className="text-[10px] sm:text-xxs text-muted-foreground uppercase truncate" title="Reach">Reach</div>
                          <div className="text-sm sm:text-base font-bold mt-0.5 truncate" title={new Intl.NumberFormat("en-US").format(activeReport.kpis.reach)}>
                            {new Intl.NumberFormat("en-US").format(activeReport.kpis.reach)}
                          </div>
                        </div>
                        <div className="p-2 sm:p-3 border border-border rounded text-center min-w-0 flex flex-col justify-center">
                          <div className="text-[10px] sm:text-xxs text-muted-foreground uppercase truncate" title="Impressions">Impressions</div>
                          <div className="text-sm sm:text-base font-bold mt-0.5 truncate" title={new Intl.NumberFormat("en-US").format(activeReport.kpis.impressions)}>
                            {new Intl.NumberFormat("en-US").format(activeReport.kpis.impressions)}
                          </div>
                        </div>
                        <div className="p-2 sm:p-3 border border-border rounded text-center min-w-0 flex flex-col justify-center">
                          <div className="text-[10px] sm:text-xxs text-muted-foreground uppercase truncate" title="Engagement">Engagement</div>
                          <div className="text-sm sm:text-base font-bold mt-0.5 truncate" title={activeReport.kpis.engagementRate + "%"}>
                            {activeReport.kpis.engagementRate}%
                          </div>
                        </div>
                        <div className="p-2 sm:p-3 border border-border rounded text-center min-w-0 flex flex-col justify-center">
                          <div className="text-[10px] sm:text-xxs text-muted-foreground uppercase truncate" title="Followers Gained">Followers Gained</div>
                          <div className="text-sm sm:text-base font-bold mt-0.5 truncate" title={"+" + new Intl.NumberFormat("en-US").format(activeReport.kpis.followersGained)}>
                            +{new Intl.NumberFormat("en-US").format(activeReport.kpis.followersGained)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Executive Summary paragraph */}
                    <div className="space-y-1.5 text-xs">
                      <h4 className="font-bold uppercase tracking-wider text-muted-foreground">Executive Summary</h4>
                      <p className="leading-relaxed text-muted-foreground text-justify">
                        {activeReport.executiveSummary}
                      </p>
                    </div>

                    {/* Recommendations bullet list */}
                    <div className="space-y-2 text-xs">
                      <h4 className="font-bold uppercase tracking-wider text-muted-foreground">Tactical Directives</h4>
                      <ol className="list-decimal pl-5 text-muted-foreground space-y-1.5 leading-relaxed">
                        {activeReport.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ol>
                    </div>

                    {/* Comparative Analysis */}
                    {activeReport.comparativeAnalysis && (
                      <div className="space-y-2 text-xs pt-4 border-t border-border">
                        <h4 className="font-bold uppercase tracking-wider text-muted-foreground">Competitor Analysis</h4>
                        <p className="leading-relaxed text-muted-foreground text-justify">
                          {activeReport.comparativeAnalysis.detailedComparison}
                        </p>
                      </div>
                    )}

                    {/* Content Script */}
                    {activeReport.contentScript && (
                      <div className="space-y-2 text-xs pt-4 border-t border-border">
                        <h4 className="font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Next Viral Script ({activeReport.contentScript.platform})</h4>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-md border border-purple-100 dark:border-purple-800">
                          <div className="space-y-3">
                            <div>
                              <span className="font-bold text-foreground">Visual Hook:</span> <span className="text-muted-foreground">{activeReport.contentScript.videoScript.hook}</span>
                            </div>
                            <div>
                              <span className="font-bold text-foreground">Body/Message:</span> <span className="text-muted-foreground">{activeReport.contentScript.videoScript.body}</span>
                            </div>
                            <div>
                              <span className="font-bold text-foreground">Call to Action:</span> <span className="text-muted-foreground">{activeReport.contentScript.videoScript.cta}</span>
                            </div>
                            <div className="pt-2 border-t border-purple-200 dark:border-purple-800">
                              <span className="font-bold text-foreground block mb-1">Caption Draft:</span> 
                              <p className="text-muted-foreground whitespace-pre-wrap">{activeReport.contentScript.captionDraft}</p>
                              <p className="text-purple-600 dark:text-purple-400 mt-2 font-mono text-xxs">{(activeReport.contentScript.hashtags || []).join(" ")}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                <CardFooter className="bg-neutral-50 dark:bg-neutral-900/10 border-t border-border flex justify-between text-xxs text-muted-foreground items-center py-3">
                  <span>Confidential Agency Report</span>
                  <span>Marketing OS PDF Engine v1.0</span>
                </CardFooter>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center border border-dashed border-border rounded-lg bg-neutral-50/50 dark:bg-neutral-900/5 h-[350px] text-center p-6">
                <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Select a report from the table to preview page details.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compile Report Modal */}
      <CreateReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(newRep) => {
          setActiveReport(newRep);
          loadFromDatabase();
        }}
      />
    </div>
  );
};

// Sub-component: Compile Report Modal
interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (report: Report) => void;
}

const CreateReportModal: React.FC<CreateReportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { clients, campaigns } = useDBStore();
  const [loading, setLoading] = useState(false);

  // Form Hooks
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      name: "",
      clientId: clients[0]?.id || "",
      campaignId: "",
      platform: "instagram",
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        end: new Date().toISOString().split("T")[0],
      },
    },
  });

  const selectedClient = watch("clientId");
  const filteredCampaigns = campaigns.filter((c) => c.clientId === selectedClient);

  // Automatically update campaignId if client changes
  useEffect(() => {
    if (filteredCampaigns.length > 0) {
      setValue("campaignId", filteredCampaigns[0].id);
    } else {
      setValue("campaignId", "");
    }
  }, [selectedClient, campaigns]);

  const onSubmit = async (data: ReportFormInput) => {
    setLoading(true);
    try {
      const generated = await ReportService.generateReport({
        name: data.name,
        clientId: data.clientId,
        campaignId: data.campaignId,
        platform: data.platform,
        dateRange: data.dateRange,
      });

      toast.success(`Report "${data.name}" compiled successfully.`);
      onSuccess(generated);
      reset();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const clientOptions = clients.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const campaignOptions = filteredCampaigns.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Compile Performance Report"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <Input
          label="Document Report Name"
          placeholder="e.g. Apex Q2 Review Digest"
          error={errors.name?.message}
          {...register("name")}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Client Account"
            options={clientOptions}
            error={errors.clientId?.message}
            {...register("clientId")}
          />

          <Select
            label="Instagram Campaign"
            options={campaignOptions}
            error={errors.campaignId?.message}
            disabled={campaignOptions.length === 0}
            {...register("campaignId")}
          />
        </div>

        {campaignOptions.length === 0 && selectedClient && (
          <p className="text-xxs text-amber-500 font-semibold">
            * This client has no campaigns. Please create a campaign for them first.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Reporting Start"
            type="date"
            error={(errors.dateRange as any)?.start?.message}
            {...register("dateRange.start")}
          />
          <Input
            label="Reporting End"
            type="date"
            error={(errors.dateRange as any)?.end?.message}
            {...register("dateRange.end")}
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
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={loading} disabled={campaignOptions.length === 0}>
            Compile Report
          </Button>
        </div>
      </form>
    </Modal>
  );
};
