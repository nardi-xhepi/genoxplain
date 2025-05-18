'use client';

import React, { useState, useMemo } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Variant, Gene as GeneType, MOCK_PATHWAYS, getPathwayDetails, getGeneDetails } from "@/lib/mockApi";
import { AlertCircle, Sigma, Zap, Dna, HelpCircle } from 'lucide-react'; // Icons for perturbation types

interface PathwayLevelViewProps {
  variants: Variant[];
}

// Helper to determine primary LIME impact type for a gene
const getPrimaryLIMEImpact = (gene: GeneType): string => {
    if (!gene.variants || gene.variants.length === 0) return "None";
    
    const impactCounts: Record<string, number> = {};
    gene.variants.forEach(variant => {
        const interp = variant.interpretation;
        if (interp.includes("structural impact")) impactCounts["Structural"] = (impactCounts["Structural"] || 0) + 1;
        else if (interp.includes("evolutionary conservation")) impactCounts["Conservation"] = (impactCounts["Conservation"] || 0) + 1;
        else if (interp.includes("protein function/interaction")) impactCounts["Function/Interaction"] = (impactCounts["Function/Interaction"] || 0) + 1;
        else if (interp.includes("regional deleteriousness")) impactCounts["Regional Impact"] = (impactCounts["Regional Impact"] || 0) + 1;
        else impactCounts["Other"] = (impactCounts["Other"] || 0) + 1;
    });

    const dominantImpact = Object.entries(impactCounts).sort((a,b) => b[1] - a[1])[0]?.[0];
    return dominantImpact || "Mixed";
};

const ImpactIcon = ({ impactType }: { impactType: string}) => {
    switch(impactType) {
        case "Structural": return <Sigma size={16} className="text-blue-500 mr-1" />;
        case "Conservation": return <Dna size={16} className="text-green-500 mr-1" />;
        case "Function/Interaction": return <Zap size={16} className="text-orange-500 mr-1" />;
        case "Regional Impact": return <AlertCircle size={16} className="text-purple-500 mr-1" />;
        default: return <HelpCircle size={16} className="text-gray-500 mr-1" />;
    }
}

export const PathwayLevelView = ({ variants }: PathwayLevelViewProps) => {
  const [selectedPathwayId, setSelectedPathwayId] = useState<string | null>(MOCK_PATHWAYS[0]?.id || null);
  const [selectedGeneInPathway, setSelectedGeneInPathway] = useState<GeneType | null>(null);

  const pathwayDetails = useMemo(() => {
    if (!selectedPathwayId) return null;
    return getPathwayDetails(selectedPathwayId, variants);
  }, [selectedPathwayId, variants]);

  const pathwayPerturbationSignature = useMemo(() => {
    if (!pathwayDetails || !pathwayDetails.affectedGenes || pathwayDetails.affectedGenes.length === 0) {
      return "No significant perturbation detected in this pathway for the given variants.";
    }
    const impactTypes = pathwayDetails.affectedGenes.map(getPrimaryLIMEImpact);
    const impactCounts: Record<string, number> = {};
    impactTypes.forEach(type => { impactCounts[type] = (impactCounts[type] || 0) + 1; });
    
    const dominantImpact = Object.entries(impactCounts).sort((a,b) => b[1] - a[1])[0]?.[0];
    if (dominantImpact && dominantImpact !== "None" && dominantImpact !== "Other" && dominantImpact !== "Mixed") {
      return `${pathwayDetails.name} is predominantly perturbed by variants causing ${dominantImpact.toLowerCase()} issues.`;
    }
    return `${pathwayDetails.name} shows mixed perturbation impacts.`;
  }, [pathwayDetails]);

  if (variants.length === 0) {
    return <p>No variants available to analyze at the pathway level.</p>;
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="h-full flex flex-col md:flex-row gap-6 overflow-hidden p-1">
        {/* Left Panel: Pathway Selection and Info */}
        <ScrollArea className="md:w-1/3 md:h-full md:flex-shrink-0">
          <div className="space-y-4 pr-2">
            <Card>
              <CardHeader>
                <CardTitle>Select Pathway</CardTitle>
              </CardHeader>
              <CardContent>
                <Select onValueChange={setSelectedPathwayId} defaultValue={selectedPathwayId || undefined}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a pathway" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_PATHWAYS.map(pw => (
                      <SelectItem key={pw.id} value={pw.id}>{pw.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {pathwayDetails && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>{pathwayDetails.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {pathwayDetails && (
               <Card>
                  <CardHeader>
                      <CardTitle className="text-lg">Pathway Perturbation</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                          {pathwayPerturbationSignature}
                      </p>
                  </CardContent>
               </Card>
            )}
          </div>
        </ScrollArea>

        {/* Right Panel: Pathway Diagram (Mock) and Gene Details */}
        <ScrollArea className="md:w-2/3 flex-grow min-h-0">
         <div className="space-y-4 pr-2">
          {pathwayDetails ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle>Pathway Explorer: {pathwayDetails.name}</CardTitle>
                <CardDescription>Genes in the pathway are listed below. Affected genes are highlighted. Click a gene for details.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow min-h-0 flex flex-col">
                <div className="p-4 border rounded-lg bg-muted/30 min-h-[150px]">
                  <h4 className="font-semibold mb-3">Genes in Pathway:</h4>
                  <ScrollArea className="max-h-[200px]">
                    <div className="flex flex-wrap gap-3">
                      {pathwayDetails.genes.map(geneName => {
                        const geneDetail = pathwayDetails.affectedGenes.find(ag => ag.name === geneName) || 
                                           getGeneDetails(geneName, []); // Get basic gene info even if not affected
                        const isAffected = pathwayDetails.affectedGenes.some(ag => ag.name === geneName);
                        const primaryImpact = isAffected && geneDetail ? getPrimaryLIMEImpact(geneDetail) : "None";

                        return (
                          <Tooltip key={geneName}>
                            <TooltipTrigger asChild>
                              <Button
                                variant={isAffected ? "destructive" : "outline"}
                                size="sm"
                                className={`flex items-center ${selectedGeneInPathway?.name === geneName ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                                onClick={() => setSelectedGeneInPathway(isAffected && geneDetail ? geneDetail : null)}
                              >
                                {isAffected && <ImpactIcon impactType={primaryImpact} />}
                                {geneName}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{geneName}{isAffected ? ` (${primaryImpact} Impact)` : " (Not affected by input variants)"}</p>
                              {isAffected && geneDetail && <p className="text-xs">{geneDetail.variants.length} variant(s)</p>}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                    <ScrollBar orientation="vertical" />
                  </ScrollArea>
                </div>

                {selectedGeneInPathway && (
                  <div className="mt-6 p-4 border rounded-lg flex-grow min-h-0 flex flex-col">
                    <h4 className="font-semibold text-lg mb-2 flex-shrink-0">Selected Gene: <Badge>{selectedGeneInPathway.name}</Badge></h4>
                    <p className="text-sm text-muted-foreground mb-1 flex-shrink-0">Primary LIME-inferred impact: <span className="font-medium"><ImpactIcon impactType={getPrimaryLIMEImpact(selectedGeneInPathway)} />{getPrimaryLIMEImpact(selectedGeneInPathway)}</span></p>
                    <p className="text-sm text-muted-foreground mb-3 flex-shrink-0">{selectedGeneInPathway.vulnerabilityProfile}</p>
                    
                    <h5 className="font-semibold text-md mb-2 flex-shrink-0">Variants in {selectedGeneInPathway.name}:</h5>
                    {selectedGeneInPathway.variants.length > 0 ? (
                        <ScrollArea className="h-[400px] pr-2">
                        <ul className="space-y-2">
                            {selectedGeneInPathway.variants.map(variant => (
                            <li key={variant.id} className="p-2 border rounded-md bg-background text-xs">
                                <p className="font-mono">{variant.genomicPosition}</p>
                                <p>Path. Score: <span className="font-semibold">{variant.pathogenicityScore.toFixed(2)}</span></p>
                                <p className="truncate">{variant.interpretation}</p>
                                {/* Could add a mini LIME chart here or a button for full variant dialog */}
                            </li>
                            ))}
                        </ul>
                        <ScrollBar orientation='vertical' />
                        </ScrollArea>
                    ) : (
                        <p className="text-sm text-muted-foreground">No variants listed for this gene (this shouldn&apos;t happen if selected).</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader><CardTitle>Pathway Explorer</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Select a pathway to explore its components and how they are affected by the variants.</p>
              </CardContent>
            </Card>
          )}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}; 