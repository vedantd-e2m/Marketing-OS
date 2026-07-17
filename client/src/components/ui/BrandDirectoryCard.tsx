import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "./Card";

interface BrandDirectoryCardProps {
  brandDirectory: any;
  clientCompetitors?: string;
}

export const BrandDirectoryCard: React.FC<BrandDirectoryCardProps> = ({ brandDirectory, clientCompetitors }) => {
  if (!brandDirectory) return null;

  let parsedCompetitors: any[] = [];
  if (clientCompetitors) {
    try {
      parsedCompetitors = JSON.parse(clientCompetitors);
    } catch (e) {}
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-bold">Brand Directory</CardTitle>
        <CardDescription>Comprehensive brand identity extracted via Brandfetch.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Descriptions */}
          <div className="space-y-4">
            {parsedCompetitors.length > 0 && (
              <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                <h4 className="text-sm font-semibold mb-3 text-blue-800 dark:text-blue-300">Discovered Competitors</h4>
                <div className="flex gap-2 flex-wrap">
                  {parsedCompetitors.map((comp: any, i: number) => (
                    <span key={i} className="px-3 py-1 bg-white dark:bg-neutral-800 text-blue-700 dark:text-blue-400 font-medium text-xs rounded shadow-sm border border-blue-200 dark:border-blue-800">
                      {comp.name || comp.domain || comp}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {brandDirectory.tagline && brandDirectory.tagline !== "N/A" && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Tagline / Title</h4>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{brandDirectory.tagline}</p>
              </div>
            )}
            {brandDirectory.description && brandDirectory.description !== "N/A" && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Short Description</h4>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{brandDirectory.description}</p>
              </div>
            )}
            {brandDirectory.long_description && brandDirectory.long_description !== "N/A" && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Long Description</h4>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4 hover:line-clamp-none transition-all">{brandDirectory.long_description}</p>
              </div>
            )}
            {brandDirectory.industries && brandDirectory.industries.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Industries & Tags</h4>
                <div className="flex gap-1.5 flex-wrap">
                  {brandDirectory.industries.map((tag: any, i: number) => {
                     const tagName = typeof tag === "string" ? tag : tag.name || "";
                     if (!tagName) return null;
                     return (
                       <span key={i} className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-[10px] font-medium text-muted-foreground uppercase">{tagName}</span>
                     );
                  })}
                </div>
              </div>
            )}
            
            {/* New Company Details */}
            {brandDirectory.company_size && brandDirectory.company_size !== "N/A" && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Company Size</h4>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{brandDirectory.company_size}</p>
              </div>
            )}
            {brandDirectory.founded_year && brandDirectory.founded_year !== "N/A" && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Founded</h4>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{brandDirectory.founded_year}</p>
              </div>
            )}
            {brandDirectory.company_kind && brandDirectory.company_kind !== "N/A" && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Company Type</h4>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{brandDirectory.company_kind}</p>
              </div>
            )}
            {brandDirectory.company_location && brandDirectory.company_location !== "N/A" && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Location</h4>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{typeof brandDirectory.company_location === 'object' ? `${brandDirectory.company_location.city || ''} ${brandDirectory.company_location.country || ''}` : brandDirectory.company_location}</p>
              </div>
            )}

            {brandDirectory.mission && brandDirectory.mission !== "N/A" && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Mission</h4>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{brandDirectory.mission}</p>
              </div>
            )}
            {brandDirectory.products && brandDirectory.products !== "N/A" && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Products / Offerings</h4>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{brandDirectory.products}</p>
              </div>
            )}
            {brandDirectory.target_audience && brandDirectory.target_audience !== "N/A" && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Target Audience</h4>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{brandDirectory.target_audience}</p>
              </div>
            )}
            {brandDirectory.value_proposition && brandDirectory.value_proposition !== "N/A" && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Value Proposition</h4>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{brandDirectory.value_proposition}</p>
              </div>
            )}
          </div>

          {/* Identity & Visuals */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-3">Brand Colors</h4>
              <div className="flex gap-4 flex-wrap">
                {brandDirectory.colors && brandDirectory.colors.length > 0 ? (
                  brandDirectory.colors.map((c: any, i: number) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <div className="w-12 h-12 rounded-full border shadow-sm ring-1 ring-border" style={{ backgroundColor: c.hex }} title={c.hex}></div>
                      <span className="text-[10px] text-muted-foreground uppercase font-mono">{c.hex}</span>
                    </div>
                  ))
                ) : <span className="text-xs text-muted-foreground">None</span>}
              </div>
            </div>

            {/* Typography / Fonts */}
            {brandDirectory.fonts && brandDirectory.fonts.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Typography & Fonts</h4>
                <div className="flex gap-2 flex-wrap">
                  {brandDirectory.fonts.map((f: any, i: number) => (
                    <div key={i} className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-md border border-border flex flex-col">
                      <span className="text-xs font-bold text-foreground">{f.name || f.family || "Unknown Font"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {brandDirectory.logos && brandDirectory.logos.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Logos</h4>
                <div className="flex gap-4 items-center flex-wrap">
                  {brandDirectory.logos.map((logo: any, i: number) => {
                    if (!logo.formats || logo.formats.length === 0) return null;
                    const format = logo.formats.find((f: any) => f.format === "svg") || logo.formats[0];
                    const isLight = logo.theme === "light";
                    const bgClass = isLight ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200";
                    return (
                      <div key={i} className={`p-4 rounded-md border shadow-sm flex items-center justify-center ${bgClass}`}>
                        <img src={format.src} alt="Brand Logo" className="h-12 object-contain hover:scale-105 transition-transform" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {brandDirectory.images && brandDirectory.images.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Brand Imagery</h4>
                <div className="flex gap-2 items-center flex-wrap">
                  {brandDirectory.images.slice(0, 4).map((img: any, i: number) => (
                     img.formats && img.formats.length > 0 && (
                       <img key={i} src={img.formats[0].src} alt="Brand Imagery" className="h-16 w-24 object-cover rounded-md border" />
                     )
                  ))}
                </div>
              </div>
            )}
            {brandDirectory.brand_voice_attributes && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Brand Voice (DO)</h4>
                <div className="flex gap-1.5 flex-wrap">
                  {Array.isArray(brandDirectory.brand_voice_attributes) ? brandDirectory.brand_voice_attributes.map((attr: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded text-[10px] font-medium uppercase">{attr}</span>
                  )) : <p className="text-xs text-muted-foreground">{brandDirectory.brand_voice_attributes}</p>}
                </div>
              </div>
            )}
            {brandDirectory.brand_voice_avoid && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Brand Voice (AVOID)</h4>
                <div className="flex gap-1.5 flex-wrap">
                  {Array.isArray(brandDirectory.brand_voice_avoid) ? brandDirectory.brand_voice_avoid.map((attr: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 rounded text-[10px] font-medium uppercase">{attr}</span>
                  )) : <p className="text-xs text-muted-foreground">{brandDirectory.brand_voice_avoid}</p>}
                </div>
              </div>
            )}
            {brandDirectory.brand_style && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Brand Style</h4>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{brandDirectory.brand_style}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
