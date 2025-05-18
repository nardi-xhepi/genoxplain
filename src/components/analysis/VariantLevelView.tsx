'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Variant, LIME_Contribution } from "@/lib/mockApi";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowUpDown } from 'lucide-react';

interface VariantLevelViewProps {
  variants: Variant[];
}

// Simple Bar Chart for LIME contributions (mock)
const LimeBarChart = ({ contributions }: { contributions: LIME_Contribution[] }) => {
  if (!contributions || contributions.length === 0) {
    return <p className="text-sm text-muted-foreground">No LIME contributions available.</p>;
  }
  // Adjusted to handle cases where all contributions are 0 or very small
  const maxAbsContribution = Math.max(...contributions.map(c => Math.abs(c.contribution)), 0.001); 

  return (
    <div className="space-y-2 p-2 border rounded-md bg-muted/50">
      <h4 className="text-sm font-semibold mb-2">LIME Contributions:</h4>
      <ScrollArea className="h-[150px]">
        <div className="space-y-2 pr-3">
            {contributions.map((item) => {
                const absContribution = Math.abs(item.contribution);
                const barWidthPercentage = (absContribution / maxAbsContribution) * 100;
                const isPositive = item.contribution >= 0;

                return (
                <div key={item.pcsaScoreName} className="text-xs">
                    <div className="flex justify-between items-center mb-0.5">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="truncate max-w-[120px] cursor-default" title={item.pcsaScoreName}>{item.pcsaScoreName}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{item.pcsaScoreName}</p>
                        </TooltipContent>
                    </Tooltip>
                    <span className={`font-medium ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {item.contribution.toFixed(3)}
                    </span>
                    </div>
                    <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-700 rounded relative overflow-hidden">
                    {/* Centered bar implementation */}
                    <div className="h-full w-1/2 absolute left-0 border-r border-gray-400 dark:border-gray-500"></div> {/* Center line */}
                    {isPositive ? (
                        <div
                        style={{ width: `${barWidthPercentage / 2}%`, left: '50%' }}
                        className={`h-full absolute bg-green-500 rounded-r-sm`}
                        ></div>
                    ) : (
                        <div
                        style={{ width: `${barWidthPercentage / 2}%`, right: '50%' }}
                        className={`h-full absolute bg-red-500 rounded-l-sm`}
                        ></div>
                    )}
                    </div>
                </div>
                );
            })}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
};

export const VariantLevelView = ({ variants: initialVariants }: VariantLevelViewProps) => {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof Variant | null>('pathogenicityScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleOpenDialog = (variant: Variant) => {
    setSelectedVariant(variant);
  };

  const handleCloseDialog = () => {
    setSelectedVariant(null);
  };

  const sortedVariants = useMemo(() => {
    if (!initialVariants) return [];
    if (!sortColumn) return initialVariants;

    const sorted = [...initialVariants].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      // Add more type checks if sorting other columns
      return 0;
    });
    return sorted;
  }, [initialVariants, sortColumn, sortDirection]);

  const handleSort = (column: keyof Variant) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  if (!initialVariants || initialVariants.length === 0) {
    return (
        <Card className="h-full flex flex-col items-center justify-center">
            <CardHeader>
                <CardTitle>Variant-Level Details</CardTitle>
            </CardHeader>
            <CardContent>
                <p>No variant data to display for this analysis.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Card className="h-full flex flex-col overflow-hidden">
        <CardHeader className="shrink-0">
          <CardTitle>Variant-Level Details</CardTitle>
          <CardDescription>
            Individual variants with pathogenicity scores and LIME explanations. Click &apos;Details&apos; for more.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow min-h-0 flex flex-col p-0 md:p-0">
          <ScrollArea className="h-[350px] w-full">
            <Table>
              <TableHeader>
                <TableRow className="sticky top-0 bg-card z-10 hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
                  <TableHead className="w-[170px]">Genomic Position</TableHead>
                  <TableHead>Gene</TableHead>
                  <TableHead 
                    className="text-center cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleSort('pathogenicityScore')}
                  >
                    <div className="flex items-center justify-center">
                      Pathogenicity
                      {sortColumn === 'pathogenicityScore' && (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Interpretation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedVariants.map((variant) => (
                  <TableRow key={variant.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-xs p-2 md:p-3">{variant.genomicPosition}</TableCell>
                    <TableCell className="p-2 md:p-3">
                        <Badge variant="secondary">{variant.gene}</Badge>
                    </TableCell>
                    <TableCell className="text-center p-2 md:p-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={`font-semibold cursor-default ${variant.pathogenicityScore > 0.7 ? 'text-red-500 dark:text-red-400' : variant.pathogenicityScore > 0.4 ? 'text-orange-500 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                            {variant.pathogenicityScore.toFixed(2)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Predicted Pathogenicity Score: {variant.pathogenicityScore.toFixed(3)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate p-2 md:p-3">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="cursor-default">{variant.interpretation}</span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md p-2">
                                <p className="text-sm">{variant.interpretation}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TableCell>
                    <TableCell className="text-right p-2 md:p-3">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(variant)}>
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      {selectedVariant && (
        <Dialog open={!!selectedVariant} onOpenChange={(isOpen) => { if (!isOpen) handleCloseDialog(); }}>
          <DialogContent className="sm:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Variant Details: <span className="font-mono text-primary">{selectedVariant.genomicPosition}</span></DialogTitle>
              <DialogDescription>
                Gene: <Badge variant="outline">{selectedVariant.gene}</Badge> | Pathogenicity: <span className={`font-semibold ${selectedVariant.pathogenicityScore > 0.7 ? 'text-red-500' : selectedVariant.pathogenicityScore > 0.4 ? 'text-orange-500' : 'text-green-600'}`}>{selectedVariant.pathogenicityScore.toFixed(3)}</span>
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-grow pr-6">
                <div className="grid gap-6 py-4 md:grid-cols-2">
                    <div className="space-y-3">
                        <h3 className="font-semibold text-md">PCSA Scores</h3>
                        <ScrollArea className="h-[220px] border rounded-md p-3 bg-muted/20">
                            <ul className="text-sm space-y-1.5">
                            {selectedVariant.pcsaScores.map(score => (
                                <li key={score.name} className="flex justify-between items-center">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="truncate max-w-[180px] cursor-default">{score.name}:</span>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{score.name}</p></TooltipContent>
                                </Tooltip>
                                <Badge variant={score.value === null ? "outline" : "default"} className={`font-mono text-xs ${score.value === null ? '' : score.value > 0.5 ? 'bg-sky-600 hover:bg-sky-700' : 'bg-sky-400 hover:bg-sky-500' }`}>
                                    {score.value !== null ? score.value.toFixed(3) : "N/A"}
                                </Badge>
                                </li>
                            ))}
                            </ul>
                            <ScrollBar orientation="vertical" />
                        </ScrollArea>
                    </div>
                    <div className="space-y-3">
                        <h3 className="font-semibold text-md">LIME Explanation</h3>
                        <LimeBarChart contributions={selectedVariant.limeExplanation.contributions} />
                    </div>
                </div>
                <div className="mt-4 p-3 border bg-muted/20 rounded-md">
                    <h4 className="font-semibold text-md mb-1.5">Interpretation</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedVariant.interpretation}</p>
                </div>
            </ScrollArea>
            <DialogFooter className="mt-auto pt-4">
              <Button onClick={handleCloseDialog} variant="outline">Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </TooltipProvider>
  );
}; 