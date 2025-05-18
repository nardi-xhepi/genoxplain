'use client';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  // Mock data for previous analyses
  const previousAnalyses = [
    { id: "patient_15648", date: "2024-07-20", status: "Completed", variants: 120 },
    { id: "patient_32104", date: "2024-07-18", status: "Completed", variants: 85 },
    { id: "patient_14974", date: "2024-07-15", status: "Failed", variants: 200 },
  ];

  const handleViewResults = (analysisId: string) => {
    router.push(`/analysis/${analysisId}`);
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl neon-text animate-fadeInUp text-black">
          Welcome to GenoXplain
        </h1>
        <p className="mt-4 text-lg text-muted-foreground animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          Upload your genetic variant data to receive an interpretable analysis
          of their impact on cancer signaling pathways.
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <Card variant="neon" className="animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          <CardHeader>
            <CardTitle>Upload VCF File</CardTitle>
            <CardDescription>
              Select a VCF (.vcf, .vcf.gz) file from your computer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="vcf-file">VCF File</Label>
              <Input id="vcf-file" type="file" variant="neon" />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="neon" onClick={() => alert('VCF upload and analysis not yet implemented. Please use pasted variants or previous analyses for now.')}>Upload and Analyze</Button>
          </CardFooter>
        </Card>

        <Card variant="neon" className="animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          <CardHeader>
            <CardTitle>Paste Variants</CardTitle>
            <CardDescription>
              Or, paste a list of variants (e.g., chr:pos:ref:alt). One per line.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="chr1:12345:G:A\nchr7:54321:C:T"
              rows={5}
              className="neon-border focus:neon-glow-primary transition-all duration-300"
            />
          </CardContent>
          <CardFooter>
            <Button variant="neon" onClick={() => alert('Pasted variant analysis not yet implemented. Please use previous analyses for now.')}>Submit and Analyze</Button>
          </CardFooter>
        </Card>
      </div>

      <section className="mt-16 animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
        <h2 className="mb-6 text-2xl font-semibold tracking-tight neon-text">
          Previous Analyses
        </h2>
        <Card variant="glow">
          <CardContent className="pt-6">
            <Table>
              <TableCaption>A list of your recent analyses.</TableCaption>
              <TableHeader>
                <TableRow className="border-b border-primary/30">
                  <TableHead className="w-[200px]">Analysis ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Variants</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previousAnalyses.map((analysis) => (
                  <TableRow key={analysis.id} className="border-b border-primary/10 hover:bg-primary/5 transition-colors">
                    <TableCell className="font-medium">{analysis.id}</TableCell>
                    <TableCell>{analysis.date}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        analysis.status === "Completed" 
                          ? "bg-accent/20 text-accent" 
                          : "bg-destructive/20 text-destructive"
                      }`}>
                        {analysis.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {analysis.variants}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="hover:neon-glow-accent"
                        onClick={() => handleViewResults(analysis.id)}
                      >
                        View Results
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
