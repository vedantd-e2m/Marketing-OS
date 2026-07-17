import React, { useState } from "react";
import { Building, Globe, Mail, Phone, ExternalLink } from "lucide-react";
import { Card, CardContent } from "./Card";

interface ClientProfileHeaderProps {
  client: any;
}

export const ClientProfileHeader: React.FC<ClientProfileHeaderProps> = ({ client }) => {
  const [openDropdownIdx, setOpenDropdownIdx] = useState<number | null>(null);

  if (!client) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
              <span
                className={`text-xxs px-2 py-0.5 rounded font-bold uppercase ${
                  client.status === "active"
                    ? "bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
                    : "bg-neutral-200 dark:bg-neutral-800 text-muted-foreground"
                }`}
              >
                {client.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {client.notes || "No notes captured for this client. Click edit on the registry list to add client details."}
            </p>

            {/* Top Competitors Dropdowns Row */}
            {client.competitors && (
              <div className="space-y-2 pt-4 border-t border-border mt-4">
                <h3 className="text-sm font-bold tracking-tight text-foreground mb-3">
                  Top Competitors
                </h3>
                
                {/* Backdrop overlay to close open dropdowns */}
                {openDropdownIdx !== null && (
                  <div 
                    className="fixed inset-0 z-30 cursor-default" 
                    onClick={() => setOpenDropdownIdx(null)}
                  />
                )}

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

                  return (
                    <div className="flex flex-wrap gap-2.5 relative z-20">
                      {list.map((comp: any, idx: number) => {
                        if (!comp.name) return null;
                        const isOpen = openDropdownIdx === idx;
                        
                        const btnColors = [
                          "bg-blue-600 hover:bg-blue-700 text-white",
                          "bg-indigo-600 hover:bg-indigo-700 text-white",
                          "bg-slate-600 hover:bg-slate-700 text-white",
                          "bg-purple-600 hover:bg-purple-700 text-white"
                        ];
                        const colorClass = btnColors[idx % btnColors.length];

                        const linksList: { label: string; url: string; hover: string }[] = [];
                        if (comp.instagram && comp.instagram.trim() !== "" && comp.instagram !== "instagram_link") {
                          linksList.push({ label: "Instagram", url: comp.instagram, hover: "hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-pink-950/20 dark:hover:text-pink-400" });
                        }
                        if (comp.twitter && comp.twitter.trim() !== "") {
                          linksList.push({ label: "Twitter (X)", url: comp.twitter, hover: "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-200" });
                        }
                        if (comp.linkedin && comp.linkedin.trim() !== "") {
                          linksList.push({ label: "LinkedIn", url: comp.linkedin, hover: "hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/20 dark:hover:text-blue-400" });
                        }
                        if (comp.reddit && comp.reddit.trim() !== "") {
                          linksList.push({ label: "Reddit", url: comp.reddit, hover: "hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-950/20 dark:hover:text-orange-400" });
                        }
                        if (comp.youtube && comp.youtube.trim() !== "") {
                          linksList.push({ label: "YouTube", url: comp.youtube, hover: "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400" });
                        }
                        if (comp.facebook && comp.facebook.trim() !== "") {
                          linksList.push({ label: "Facebook", url: comp.facebook, hover: "hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-500" });
                        }
                        if (comp.domain && comp.domain.trim() !== "" && comp.domain.includes(".")) {
                          linksList.push({ label: "Website", url: comp.domain.startsWith("http") ? comp.domain : `https://${comp.domain}`, hover: "hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800" });
                        }

                        const hasLinks = linksList.length > 0;

                        return (
                          <div key={idx} className="relative inline-block text-left">
                            <button
                              type="button"
                              disabled={!hasLinks}
                              onClick={() => setOpenDropdownIdx(isOpen ? null : idx)}
                              className={`inline-flex items-center justify-between gap-1.5 px-3.5 py-2 rounded-md font-bold text-xs shadow-sm transition-all hover:scale-[1.02] ${
                                hasLinks ? "cursor-pointer" : "opacity-75 cursor-default"
                              } ${colorClass}`}
                            >
                              <span>{comp.name}</span>
                              {hasLinks && <span className="text-[10px] opacity-90 select-none">▼</span>}
                            </button>

                            {isOpen && hasLinks && (
                              <div className="absolute left-0 mt-1.5 w-48 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg focus:outline-none z-50 animate-fadeIn overflow-hidden">
                                <div className="py-1">
                                  {linksList.map((lnk, lidx) => (
                                    <a
                                      key={lidx}
                                      href={lnk.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={() => setOpenDropdownIdx(null)}
                                      className={`block px-4 py-2 text-xs font-semibold transition-colors ${lnk.hover}`}
                                    >
                                      {lnk.label}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Contacts details column */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2.5 text-sm md:border-l border-border md:pl-6 min-w-[240px]">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-4 w-4 shrink-0" />
              <a
                href={`https://${client.website}`}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-foreground hover:underline flex items-center gap-0.5 truncate"
              >
                {client.website} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{client.contactName} ({client.contactEmail})</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{client.contactPhone}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
