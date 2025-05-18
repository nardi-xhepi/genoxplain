'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { VariantLevelView } from '@/components/analysis/VariantLevelView';
import { GeneLevelView } from '@/components/analysis/GeneLevelView';
import { PathwayLevelView } from '@/components/analysis/PathwayLevelView';
import Protein3DView from '@/components/analysis/Protein3DView';
import { getMockAnalysisData, Variant } from "@/lib/mockApi";
import { Skeleton } from "@/components/ui/skeleton";
import { useChat } from '@/contexts/ChatContext';

const LoadingSkeleton = () => (
    <div className="space-y-4 p-4 md:p-8">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
        <div className="mt-8 space-y-6">
            <Skeleton className="h-10 w-full" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3 mb-2"/>
                    <Skeleton className="h-4 w-2/3"/>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </CardContent>
            </Card>
        </div>
    </div>
);

export default function AnalysisResultsPage() {
  const params = useParams();
  const analysisId = params.id as string;
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setCurrentAnalysisVariants } = useChat();

  // State for selected gene/variant for 3D view
  const [selectedGeneFor3D, setSelectedGeneFor3D] = useState<string | null>(null);
  const [selectedProteinChangeFor3D, setSelectedProteinChangeFor3D] = useState<string | null>(null);
  
  // Reference to the tab component to programmatically change tabs
  const [activeTab, setActiveTab] = useState('variant-level');

  useEffect(() => {
    if (analysisId) {
      setIsLoading(true);
      setError(null);
      try {
        setTimeout(() => {
          const data = getMockAnalysisData(analysisId, 50);
          setVariants(data);
          setCurrentAnalysisVariants(data);
          setIsLoading(false);

          // Automatically select a gene/variant for 3D view, prioritizing TP53
          if (data && data.length > 0) {
            const tp53Variant = data.find(v => v.gene === 'TP53');
            if (tp53Variant) {
              setSelectedGeneFor3D(tp53Variant.gene);
              setSelectedProteinChangeFor3D(tp53Variant.proteinChange || null);
            } else {
              const variantWithProteinChange = data.find(v => v.proteinChange);
              if (variantWithProteinChange) {
                setSelectedGeneFor3D(variantWithProteinChange.gene);
                setSelectedProteinChangeFor3D(variantWithProteinChange.proteinChange || null);
              } else {
                setSelectedGeneFor3D(data[0].gene);
                setSelectedProteinChangeFor3D(null);
              }
            }
          } else {
            setSelectedGeneFor3D(null);
            setSelectedProteinChangeFor3D(null);
          }

        }, 1000);
      } catch (e) {
        console.error("[AnalysisPage Effect] Failed to load analysis data:", e);
        setError("Failed to load analysis data. Please try again.");
        setCurrentAnalysisVariants(null);
        setIsLoading(false);
      }
    } 
    return () => {
        setCurrentAnalysisVariants(null);
    };
  }, [analysisId, setCurrentAnalysisVariants]);

  // Function to handle 3D view selection from the GeneLevelView
  const handleView3D = (geneName: string, proteinChange?: string) => {
    console.log(`Switching to 3D view for ${geneName}${proteinChange ? ` with variant ${proteinChange}` : ''}`);
    setSelectedGeneFor3D(geneName);
    setSelectedProteinChangeFor3D(proteinChange || null);
    setActiveTab('protein-3d-view'); // Switch to the 3D tab
  };

  const containerClasses = "h-full flex flex-col overflow-hidden container mx-auto";

  if (!analysisId || error) {
    return (
        <div className={`${containerClasses} items-center justify-center text-center p-4 md:p-8`}>
            <h1 className="text-2xl font-semibold text-destructive">Error</h1>
            <p className="text-muted-foreground">{error || "Analysis ID is missing."}</p>
        </div>
    );
  }
  
  if (isLoading) {
    return (
        <div className={containerClasses}>
            <LoadingSkeleton />
        </div>
    );
  }

  return (
    <div className={containerClasses}>
      <header className="mb-8 p-4 md:p-8 md:pb-4 shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">
          Analysis Results: <span className="text-primary font-mono">{analysisId}</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Explore the impact of {variants.length} genetic variants on cancer signaling pathways.
        </p>
      </header>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full flex-grow min-h-0 flex flex-col px-4 md:px-8 pb-4"
      >
        <TabsList className="grid w-full grid-cols-4 shrink-0">
          <TabsTrigger value="variant-level">Variant-Level</TabsTrigger>
          <TabsTrigger value="gene-level">Gene-Level</TabsTrigger>
          <TabsTrigger value="pathway-level">Pathway-Level</TabsTrigger>
          <TabsTrigger value="protein-3d-view">3D Protein</TabsTrigger>
        </TabsList>
        
        <TabsContent value="variant-level" className="mt-6 flex-grow min-h-0 overflow-hidden">
          <VariantLevelView variants={variants} />
        </TabsContent>
        <TabsContent value="gene-level" className="mt-6 flex-grow min-h-0 overflow-hidden">
          <GeneLevelView variants={variants} onView3D={handleView3D} />
        </TabsContent>
        <TabsContent value="pathway-level" className="mt-6 flex-grow min-h-0 overflow-hidden">
          <PathwayLevelView variants={variants} />
        </TabsContent>
        <TabsContent value="protein-3d-view" className="mt-6 flex-grow min-h-0 overflow-hidden">
          {selectedGeneFor3D ? (
            <Protein3DView 
              initialGeneName={selectedGeneFor3D}
              initialProteinChange={selectedProteinChangeFor3D || undefined}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No suitable gene or variant selected/available for 3D view.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 