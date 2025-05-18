'use client';

import React, { useState, useMemo } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList
} from "@/components/ui/command";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Variant, Gene as GeneType, getGeneDetails, LIME_Contribution } from "@/lib/mockApi";
import { ChevronsUpDown, Check, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

// Re-using or adapting a simplified LIME bar chart from VariantLevelView
const LimeBarChartSmall = ({ contributions }: { contributions: LIME_Contribution[] }) => {
    if (!contributions || contributions.length === 0) {
      return <p className="text-xs text-muted-foreground">No LIME data.</p>;
    }
    const maxAbsContribution = Math.max(...contributions.map(c => Math.abs(c.contribution)), 0.001);
  
    return (
      <div className="space-y-1 p-1 border rounded-md bg-muted/30 w-full max-w-[200px]">
        {contributions.slice(0, 3).map((item) => { // Show top 3 contributions for brevity
          const barWidthPercentage = (Math.abs(item.contribution) / maxAbsContribution) * 100;
          const isPositive = item.contribution >= 0;
          return (
            <div key={item.pcsaScoreName} className="text-[10px]">
              <div className="flex justify-between items-center mb-0.5">
                <span className="truncate max-w-[80px]" title={item.pcsaScoreName}>{item.pcsaScoreName.replace("_score_api","").replace("gerp++_rs_api", "gerp++")}</span>
                <span className={`font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>{item.contribution.toFixed(2)}</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded relative">
                <div className="h-full w-1/2 absolute left-0 border-r border-gray-400 dark:border-gray-500"></div>
                {isPositive ? (
                  <div style={{ width: `${barWidthPercentage / 2}%`, left: '50%' }} className={`h-full absolute bg-green-500 rounded-r-xs`}></div>
                ) : (
                  <div style={{ width: `${barWidthPercentage / 2}%`, right: '50%' }} className={`h-full absolute bg-red-500 rounded-l-xs`}></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

interface GeneLevelViewProps {
  variants: Variant[];
  onView3D?: (geneName: string, proteinChange?: string) => void;
}

export const GeneLevelView = ({ variants, onView3D }: GeneLevelViewProps) => {
  const [selectedGeneName, setSelectedGeneName] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedVariantForDialog, setSelectedVariantForDialog] = useState<Variant | null>(null);

  const uniqueGenes = useMemo(() => {
    const geneNames = new Set(variants.map(v => v.gene));
    return Array.from(geneNames).sort().map(name => ({ value: name, label: name }));
  }, [variants]);

  const selectedGeneDetails: GeneType | undefined = useMemo(() => {
    if (!selectedGeneName) return undefined;
    return getGeneDetails(selectedGeneName, variants);
  }, [selectedGeneName, variants]);

  const handleOpenVariantDialog = (variant: Variant) => {
    setSelectedVariantForDialog(variant);
  };

  const handleCloseVariantDialog = () => {
    setSelectedVariantForDialog(null);
  };

  const handleView3D = (geneName: string, proteinChange?: string) => {
    if (onView3D) {
      onView3D(geneName, proteinChange);
    }
  };

  if (variants.length === 0) {
    return (
        <div className="h-full flex items-center justify-center">
            <p>No variants available to analyze at the gene level.</p>
        </div>
    );
  }
  
  return (
    // Root div is h-full, flex-col to manage its children cards
    <TooltipProvider delayDuration={100}>
      <div className="h-full flex flex-col space-y-6 overflow-hidden">
        {/* Gene selection card - does not grow */}
        <Card className="shrink-0">
          <CardHeader>
            <CardTitle>Select Gene for Detailed Analysis</CardTitle>
            <CardDescription>
              Choose a gene from the list to view its vulnerability profile and associated variants.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className="w-[250px] justify-between"
                >
                  {selectedGeneName
                    ? uniqueGenes.find((gene) => gene.value === selectedGeneName)?.label
                    : "Select a gene..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0">
                <Command>
                  <CommandInput placeholder="Search gene..." />
                  <CommandList>
                    <CommandEmpty>No gene found.</CommandEmpty>
                    <CommandGroup>
                      {uniqueGenes.map((gene) => (
                        <CommandItem
                          key={gene.value}
                          value={gene.value}
                          onSelect={(currentValue) => {
                            setSelectedGeneName(currentValue === selectedGeneName ? null : currentValue);
                            setPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedGeneName === gene.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {gene.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {onView3D && selectedGeneName && (
              <Button 
                variant="outline" 
                className="ml-2" 
                onClick={() => handleView3D(selectedGeneName)}
              >
                <Layers className="mr-2 h-4 w-4" />
                View in 3D
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Gene details card - grows to fill remaining space and has internal flex for scrolling */}
        {selectedGeneDetails && (
          <Card className="flex-grow min-h-0 flex flex-col overflow-hidden">
            <CardHeader className="shrink-0">
              <CardTitle>Gene Vulnerability Profile: <Badge variant="destructive">{selectedGeneDetails.name}</Badge></CardTitle>
              {selectedGeneDetails.vulnerabilityProfile && (
                <CardDescription className="pt-2 text-base">
                  {selectedGeneDetails.vulnerabilityProfile}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex-grow min-h-0 flex flex-col p-0 md:p-0">
              <h3 className="text-lg font-semibold mb-3 mt-2 px-4 md:px-6 shrink-0">Variants in {selectedGeneDetails.name}</h3>
              {selectedGeneDetails.variants.length > 0 ? (
                // ScrollArea now grows within this CardContent
                <ScrollArea className="h-[400px] px-4 md:px-6 pb-4 md:pb-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px] sticky top-0 bg-card z-10">Position</TableHead>
                        <TableHead className="text-center w-[100px] sticky top-0 bg-card z-10">Path Score</TableHead>
                        <TableHead className="sticky top-0 bg-card z-10">Interpretation</TableHead>
                        <TableHead className="w-[220px] sticky top-0 bg-card z-10">LIME (Top 3)</TableHead>
                        <TableHead className="text-right sticky top-0 bg-card z-10">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedGeneDetails.variants.map((variant) => (
                        <TableRow key={variant.id} className="hover:bg-muted/50">
                          <TableCell className="font-mono text-xs p-2 md:p-3">{variant.genomicPosition.split(':').slice(1).join(':')}</TableCell>
                          <TableCell className="text-center p-2 md:p-3">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={`font-semibold cursor-default ${variant.pathogenicityScore > 0.7 ? 'text-red-500' : variant.pathogenicityScore > 0.4 ? 'text-orange-500' : 'text-green-600'}`}>
                                  {variant.pathogenicityScore.toFixed(2)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent><p>Path. Score: {variant.pathogenicityScore.toFixed(3)}</p></TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[250px] truncate p-2 md:p-3">
                            <Tooltip>
                                <TooltipTrigger asChild><span className="cursor-default">{variant.interpretation}</span></TooltipTrigger>
                                <TooltipContent className="max-w-sm"><p>{variant.interpretation}</p></TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="p-2 md:p-3">
                            <LimeBarChartSmall contributions={variant.limeExplanation.contributions} />
                          </TableCell>
                          <TableCell className="text-right p-2 md:p-3">
                            <div className="flex justify-end space-x-1">
                              <Button variant="ghost" size="sm" onClick={() => handleOpenVariantDialog(variant)}>
                                  Details
                              </Button>
                              {onView3D && variant.proteinChange && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleView3D(variant.gene, variant.proteinChange || undefined)}
                                >
                                  <Layers className="mr-1 h-3 w-3" />
                                  3D
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="vertical" />
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              ) : (
                <div className="flex-grow flex items-center justify-center">
                    <p className="text-muted-foreground p-4 md:p-6">No variants from your input list affect this gene.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {!selectedGeneDetails && variants.length > 0 && (
             <div className="flex-grow flex items-center justify-center">
                <p className="text-muted-foreground">Select a gene to see details.</p>
            </div>
        )}
      </div>
      {/* Dialog for variant details remains the same */}
      {selectedVariantForDialog && (
        <Dialog open={!!selectedVariantForDialog} onOpenChange={(isOpen) => { if (!isOpen) handleCloseVariantDialog(); }}>
          <DialogContent className="sm:max-w-xl lg:max-w-2xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Variant: <span className="font-mono text-primary">{selectedVariantForDialog.genomicPosition}</span></DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-2">
                Gene: <Badge variant="outline">{selectedVariantForDialog.gene}</Badge> | Pathogenicity: <span className={`font-semibold ${selectedVariantForDialog.pathogenicityScore > 0.7 ? 'text-red-500' : selectedVariantForDialog.pathogenicityScore > 0.4 ? 'text-orange-500' : 'text-green-600'}`}>{selectedVariantForDialog.pathogenicityScore.toFixed(3)}</span>
                {onView3D && selectedVariantForDialog.proteinChange && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      handleCloseVariantDialog();
                      handleView3D(selectedVariantForDialog.gene, selectedVariantForDialog.proteinChange);
                    }}
                    className="ml-auto"
                  >
                    <Layers className="mr-2 h-4 w-4" />
                    View in 3D
                  </Button>
                )}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-grow pr-5 mt-2">
                <div className="grid gap-x-6 gap-y-4 py-2 md:grid-cols-5">
                    <div className="space-y-2 md:col-span-2">
                        <h4 className="font-semibold text-sm">PCSA Scores</h4>
                        <ScrollArea className="h-[180px] border rounded p-2 bg-muted/20">
                            <ul className="text-xs space-y-1">
                            {selectedVariantForDialog.pcsaScores.map(score => (
                                <li key={score.name} className="flex justify-between items-center">
                                <Tooltip>
                                    <TooltipTrigger asChild><span className="truncate max-w-[100px] cursor-default">{score.name.replace("_api", "").replace("_score","").replace("++","pp")}:</span></TooltipTrigger>
                                    <TooltipContent><p>{score.name}</p></TooltipContent>
                                </Tooltip>
                                <Badge variant={score.value === null ? "outline" : "default"} className={`font-mono text-[11px] ${score.value === null ? '' : score.value > 0.5 ? 'bg-sky-600' : 'bg-sky-400' }`}>
                                    {score.value !== null ? score.value.toFixed(3) : "N/A"}
                                </Badge>
                                </li>
                            ))}
                            </ul>
                            <ScrollBar orientation="vertical" />
                        </ScrollArea>
                    </div>
                    <div className="space-y-2 md:col-span-3">
                        <h4 className="font-semibold text-sm">LIME Explanation</h4>
                        {/* Using the more detailed LimeBarChart from VariantLevelView for consistency if desired, or keep small one */}
                        {/* For now, let's imagine a slightly more detailed small one or reuse the imported one */}
                        <LimeBarChartSmall contributions={selectedVariantForDialog.limeExplanation.contributions} /> 
                    </div>
                </div>
                <div className="mt-3 p-2.5 border bg-muted/20 rounded">
                    <h4 className="font-semibold text-sm mb-1">Interpretation:</h4>
                    <p className="text-xs text-muted-foreground leading-normal">{selectedVariantForDialog.interpretation}</p>
                </div>
            </ScrollArea>
            <DialogFooter className="mt-auto pt-3">
              <Button onClick={handleCloseVariantDialog} variant="outline" size="sm">Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </TooltipProvider>
  );
}; 