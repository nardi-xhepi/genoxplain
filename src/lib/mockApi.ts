export interface PCSA_Score {
  name: string; // e.g., deogen2_score_api, mvp_score_api
  value: number | null;
}

export interface LIME_Contribution {
  pcsaScoreName: string;
  contribution: number; // positive or negative
}

export interface LIME_Explanation {
  contributions: LIME_Contribution[];
  mostInfluentialPositive?: LIME_Contribution;
  mostInfluentialNegative?: LIME_Contribution;
}

export interface Variant {
  id: string;
  genomicPosition: string; // e.g., chr1:123456:G:A
  gene: string;
  pathogenicityScore: number; // 0.0 to 1.0
  pcsaScores: PCSA_Score[];
  limeExplanation: LIME_Explanation;
  interpretation: string; // Brief biological interpretation
  // Additional detailed variant information
  variantType: string; // SNV, indel, CNV, etc.
  chromosome: string;
  position: number;
  refAllele: string;
  altAllele: string;
  alleleFrequency: number; // Population frequency
  readDepth: number; // Coverage depth
  geneRegion: string; // exonic, intronic, etc.
  proteinChange?: string; // Amino acid change if applicable
  clinicalSignificance?: string; // Classification if known (pathogenic, likely pathogenic, etc)
  evidenceLevel?: string; // Supporting evidence level
}

export interface Gene {
  id: string;
  name: string;
  variants: Variant[]; // Variants affecting this gene from the user's list
  vulnerabilityProfile?: string; // Aggregated profile text
}

export interface Pathway {
  id: string;
  name: string;
  genes: string[]; // List of gene names in this pathway
  description?: string;
}

// --- Mock Data and Functions ---

const MOCK_PCSA_SCORE_NAMES = [
  "deogen2_score_api",
  "mvp_score_api",
  "polyphen2_hdiv_score_api",
  "gerp++_rs_api",
  "cadd_phred_api",
  "revel_score_api",
];

const MOCK_GENES = [
  { id: "gene_tp53", name: "TP53" },
  { id: "gene_brca1", name: "BRCA1" },
  { id: "gene_brca2", name: "BRCA2" },
  { id: "gene_pten", name: "PTEN" },
  { id: "gene_pik3ca", name: "PIK3CA" },
  { id: "gene_akt1", name: "AKT1" },
  { id: "gene_mapk1", name: "MAPK1" },
  { id: "gene_egfr", name: "EGFR" },
  { id: "gene_esr1", name: "ESR1" },
  { id: "gene_ccnd1", name: "CCND1" },
  { id: "gene_cdh1", name: "CDH1" },
  { id: "gene_mdm2", name: "MDM2" },
  { id: "gene_chek2", name: "CHEK2" },
  { id: "gene_erbb2", name: "ERBB2" },
  { id: "gene_pgr", name: "PGR" },
  { id: "gene_palb2", name: "PALB2" },
];

export const MOCK_PATHWAYS: Pathway[] = [
  {
    id: "pathway_pi3k_akt",
    name: "PI3K-Akt Signaling Pathway",
    genes: ["PTEN", "PIK3CA", "AKT1"],
    description: "The PI3K-Akt pathway is crucial in regulating cell survival, proliferation, and growth. Mutations in this pathway are common in breast cancer, particularly in ER+ and Luminal subtypes."
  },
  {
    id: "pathway_mapk",
    name: "MAPK Signaling Pathway",
    genes: ["MAPK1", "EGFR"],
    description: "The MAPK pathway is involved in cell proliferation, differentiation, and apoptosis. Alterations may affect response to targeted therapies in breast cancer."
  },
  {
    id: "pathway_dna_repair",
    name: "DNA Repair Pathway",
    genes: ["BRCA1", "BRCA2", "TP53", "CHEK2", "PALB2"],
    description: "The DNA repair pathway maintains genomic integrity. Germline mutations in these genes increase breast cancer risk and may predict response to PARP inhibitors and platinum chemotherapy."
  },
  {
    id: "pathway_hormone_signaling",
    name: "Hormone Receptor Signaling",
    genes: ["ESR1", "PGR", "ERBB2"],
    description: "Hormone receptor signaling is a key driver in most breast cancers. Expression and alterations affect endocrine therapy response and prognosis."
  },
  {
    id: "pathway_cell_cycle",
    name: "Cell Cycle Regulation",
    genes: ["CCND1", "TP53", "MDM2"],
    description: "Cell cycle control is frequently dysregulated in breast cancer. CDK4/6 inhibitors target this pathway in ER+ disease."
  }
];

const getRandomPCSA_Value = (): number | null => {
  if (Math.random() < 0.1) return null; // 10% chance of being null
  return parseFloat(Math.random().toFixed(3));
};

const generateMockLIME = (pcsaScores: PCSA_Score[]): LIME_Explanation => {
  const contributions: LIME_Contribution[] = pcsaScores
    .filter(score => score.value !== null)
    .map((score) => ({
      pcsaScoreName: score.name,
      contribution: parseFloat((Math.random() * 2 - 1).toFixed(3)), // Random contribution between -1 and 1
    }));

  contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  
  let mostInfluentialPositive: LIME_Contribution | undefined;
  let mostInfluentialNegative: LIME_Contribution | undefined;

  for (const c of contributions) {
    if (c.contribution > 0 && (!mostInfluentialPositive || c.contribution > mostInfluentialPositive.contribution)) {
        mostInfluentialPositive = c;
    }
    if (c.contribution < 0 && (!mostInfluentialNegative || c.contribution < mostInfluentialNegative.contribution)) {
        mostInfluentialNegative = c;
    }
  }
  // If all contributions are same sign, pick the largest absolute for the other
  if (contributions.length > 0) {
    if (!mostInfluentialPositive && mostInfluentialNegative) {
        const positiveCandidates = contributions.filter(c => c.contribution > 0);
        if (positiveCandidates.length > 0) {
            mostInfluentialPositive = positiveCandidates.sort((a,b) => b.contribution - a.contribution)[0];
        } else {
            // This case means all are negative or zero, which is fine, mostInfluentialPositive remains undefined
        }
    }
    if (!mostInfluentialNegative && mostInfluentialPositive) {
        const negativeCandidates = contributions.filter(c => c.contribution < 0);
        if (negativeCandidates.length > 0) {
            mostInfluentialNegative = negativeCandidates.sort((a,b) => a.contribution - b.contribution)[0];
        } else {
             // This case means all are positive or zero
        }
    }
  }

  return { contributions, mostInfluentialPositive, mostInfluentialNegative };
};

export const getMockInterpretation = (lime: LIME_Explanation): string => {
    const topPositive = lime.mostInfluentialPositive;
    // const topNegative = lime.mostInfluentialNegative; // Not used in this simplified example, but available

    if (topPositive) {
        let reason = "unknown factor";
        if (topPositive.pcsaScoreName.includes("gerp")) reason = "high evolutionary conservation (GERP++)";
        else if (topPositive.pcsaScoreName.includes("polyphen")) reason = "predicted structural impact (PolyPhen)";
        else if (topPositive.pcsaScoreName.includes("deogen")) reason = "potential impact on protein function/interaction (DEOGEN2)";
        else if (topPositive.pcsaScoreName.includes("mvp")) reason = "high regional deleteriousness (MVP)";
        else if (topPositive.pcsaScoreName.includes("cadd")) reason = "high deleteriousness score (CADD)";
        else if (topPositive.pcsaScoreName.includes("revel")) reason = "high ensemble score (REVEL)";
        return `Pathogenicity likely driven by ${reason}.`;
    }
    return "Pathogenicity factors are mixed or unclear from LIME contributions.";
};

export const generateMockVariant = (id: number, geneName?: string): Variant => {
  let selectedGene = geneName ? MOCK_GENES.find(g => g.name === geneName) : MOCK_GENES[id % MOCK_GENES.length];
  if (!selectedGene) { // Fallback if provided geneName is not found
    selectedGene = MOCK_GENES[id % MOCK_GENES.length];
  }
  const chr = `chr${(id % 22) + 1}`;
  const pos = Math.floor(Math.random() * 10000000);
  const ref = ["A", "C", "G", "T"][id % 4];
  let alt = ["A", "C", "G", "T"][(id + 1) % 4];
  if (alt === ref) alt = ["A", "C", "G", "T"][(id + 2) % 4];

  const pcsaScores: PCSA_Score[] = MOCK_PCSA_SCORE_NAMES.map((name) => ({
    name,
    value: getRandomPCSA_Value(),
  }));

  const limeExplanation = generateMockLIME(pcsaScores);
  const interpretation = getMockInterpretation(limeExplanation);
  
  // Generate variant type with bias toward SNVs
  const variantTypeOptions = ["SNV", "insertion", "deletion", "CNV"];
  const variantTypeWeights = [0.7, 0.1, 0.1, 0.1]; // 70% SNVs, 10% each for others
  const variantType = weightedRandomChoice(variantTypeOptions, variantTypeWeights);
  
  // Determine gene region
  const geneRegionOptions = ["exonic", "intronic", "splice_site", "promoter", "3'UTR", "5'UTR"];
  const geneRegionWeights = [0.6, 0.2, 0.1, 0.05, 0.025, 0.025]; // Most variants in exons
  const geneRegion = weightedRandomChoice(geneRegionOptions, geneRegionWeights);
  
  // Generate allele frequency (most pathogenic variants are rare)
  let alleleFrequency = 0;
  const freqRand = Math.random();
  if (freqRand < 0.7) {
    // 70% chance of rare variant (<0.01)
    alleleFrequency = parseFloat((Math.random() * 0.01).toFixed(4));
  } else if (freqRand < 0.9) {
    // 20% chance of low frequency (0.01-0.05) 
    alleleFrequency = parseFloat((0.01 + Math.random() * 0.04).toFixed(4));
  } else {
    // 10% chance of common (>0.05)
    alleleFrequency = parseFloat((0.05 + Math.random() * 0.45).toFixed(4));
  }
  
  // Generate read depth between 30-500
  const readDepth = Math.floor(30 + Math.random() * 470);
  
  // Generate protein change if exonic
  let proteinChange = undefined;
  if (geneRegion === "exonic") {
    const aminoAcids = ["Ala", "Arg", "Asn", "Asp", "Cys", "Gln", "Glu", "Gly", "His", "Ile", "Leu", "Lys", "Met", "Phe", "Pro", "Ser", "Thr", "Trp", "Tyr", "Val"];
    const aa1 = aminoAcids[Math.floor(Math.random() * aminoAcids.length)];
    let aa2 = aminoAcids[Math.floor(Math.random() * aminoAcids.length)];
    while (aa1 === aa2 && variantType === "SNV") {
      aa2 = aminoAcids[Math.floor(Math.random() * aminoAcids.length)];
    }
    const position = Math.floor(Math.random() * 1000) + 1;
    
    if (variantType === "SNV") {
      proteinChange = `p.${aa1}${position}${aa2}`;
    } else if (variantType === "insertion") {
      proteinChange = `p.${aa1}${position}_${position+1}ins${aa2}`;
    } else if (variantType === "deletion") {
      proteinChange = `p.${aa1}${position}del`;
    } else if (variantType === "CNV") {
      // For CNVs, usually no specific protein change
      proteinChange = undefined;
    }
  }
  
  // Generate clinical significance based on pathogenicity score
  let clinicalSignificance = undefined;
  if (parseFloat(Math.random().toFixed(2)) > 0.85) {
    const pathScore = parseFloat(Math.random().toFixed(2));
    if (pathScore > 0.8) {
      clinicalSignificance = "Pathogenic";
    } else if (pathScore > 0.6) {
      clinicalSignificance = "Likely pathogenic";
    } else if (pathScore > 0.4) {
      clinicalSignificance = "Uncertain significance";
    } else if (pathScore > 0.2) {
      clinicalSignificance = "Likely benign";
    } else {
      clinicalSignificance = "Benign";
    }
  }
  
  // Generate evidence level
  let evidenceLevel = undefined;
  if (clinicalSignificance) {
    const evidenceLevels = ["Strong", "Moderate", "Supporting", "Limited"];
    evidenceLevel = evidenceLevels[Math.floor(Math.random() * evidenceLevels.length)];
  }

  return {
    id: `variant_${id}`,
    genomicPosition: `${chr}:${pos}:${ref}:${alt}`,
    gene: selectedGene.name,
    pathogenicityScore: parseFloat(Math.random().toFixed(2)),
    pcsaScores,
    limeExplanation,
    interpretation,
    // Additional detailed fields
    variantType,
    chromosome: chr,
    position: pos,
    refAllele: ref,
    altAllele: alt,
    alleleFrequency,
    readDepth,
    geneRegion,
    proteinChange,
    clinicalSignificance,
    evidenceLevel
  };
};

// Helper function for weighted random choices
function weightedRandomChoice(options: string[], weights: number[]): string {
  const cumulativeWeights: number[] = [];
  let sum = 0;
  
  for (const weight of weights) {
    sum += weight;
    cumulativeWeights.push(sum);
  }
  
  const random = Math.random() * sum;
  for (let i = 0; i < cumulativeWeights.length; i++) {
    if (random < cumulativeWeights[i]) {
      return options[i];
    }
  }
  
  return options[0]; // Fallback
}

export const getMockAnalysisData = (analysisId: string, numVariants: number = 20): Variant[] => {
  const variants: Variant[] = [];
  for (let i = 0; i < numVariants; i++) {
    variants.push(generateMockVariant(i + 1));
  }
  
  // Override with specific breast cancer variants for our BRCA case
  if (numVariants > 10) {
    // BRCA2 pathogenic variant (germline)
    variants[0] = {
      ...generateMockVariant(1, "BRCA2"),
      id: "variant_BRCA2_c.5946delT",
      genomicPosition: "chr13:32915005:CT:C",
      chromosome: "chr13",
      position: 32915005,
      refAllele: "CT",
      altAllele: "C",
      variantType: "deletion",
      geneRegion: "exonic",
      proteinChange: "p.Ser1982fs",
      pathogenicityScore: 0.92,
      alleleFrequency: 0.001,
      readDepth: 124,
      clinicalSignificance: "Pathogenic",
      evidenceLevel: "Strong",
      interpretation: "Frameshift mutation in BRCA2 affecting DNA repair and homologous recombination."
    };
    
    // PIK3CA H1047R mutation (somatic)
    variants[1] = {
      ...generateMockVariant(2, "PIK3CA"),
      id: "variant_PIK3CA_H1047R",
      genomicPosition: "chr3:178952085:A:G",
      chromosome: "chr3",
      position: 178952085,
      refAllele: "A",
      altAllele: "G",
      variantType: "SNV",
      geneRegion: "exonic",
      proteinChange: "p.His1047Arg",
      pathogenicityScore: 0.88,
      alleleFrequency: 0.002,
      readDepth: 283,
      clinicalSignificance: "Pathogenic",
      evidenceLevel: "Strong",
      interpretation: "Activating mutation in PIK3CA leading to increased PI3K pathway signaling and cell growth/survival."
    };
    
    // TP53 R175H mutation (somatic)
    variants[2] = {
      ...generateMockVariant(3, "TP53"),
      id: "variant_TP53_R175H",
      genomicPosition: "chr17:7578406:G:A",
      chromosome: "chr17",
      position: 7578406,
      refAllele: "G",
      altAllele: "A",
      variantType: "SNV",
      geneRegion: "exonic",
      proteinChange: "p.Arg175His",
      pathogenicityScore: 0.89,
      alleleFrequency: 0.001,
      readDepth: 197,
      clinicalSignificance: "Pathogenic",
      evidenceLevel: "Strong",
      interpretation: "Common TP53 hotspot mutation disrupting DNA-binding and transcriptional regulation, compromising tumor suppressor function."
    };
    
    // PTEN loss (somatic)
    variants[3] = {
      ...generateMockVariant(4, "PTEN"),
      id: "variant_PTEN_deletion",
      genomicPosition: "chr10:89623000-89728000",
      chromosome: "chr10",
      position: 89623000,
      refAllele: "Complex",
      altAllele: "Deletion",
      variantType: "CNV",
      geneRegion: "gene-wide",
      proteinChange: "p.0",
      pathogenicityScore: 0.85,
      alleleFrequency: 0.001,
      readDepth: 42,
      clinicalSignificance: "Pathogenic",
      evidenceLevel: "Strong",
      interpretation: "Complete loss of PTEN leading to unregulated PI3K/AKT signaling and increased cellular proliferation."
    };
    
    // ESR1 amplification (somatic)
    variants[4] = {
      ...generateMockVariant(5, "ESR1"),
      id: "variant_ESR1_amplification",
      genomicPosition: "chr6:151690000-152103000",
      chromosome: "chr6",
      position: 151690000,
      refAllele: "Normal",
      altAllele: "Amplification",
      variantType: "CNV",
      geneRegion: "gene-wide",
      pathogenicityScore: 0.75,
      alleleFrequency: 0.003,
      readDepth: 356,
      clinicalSignificance: "Likely pathogenic",
      evidenceLevel: "Moderate",
      interpretation: "Amplification of ESR1 resulting in increased estrogen receptor expression and signaling."
    };

    // Add EGFR mutation (not in clinical data, but interesting for treatment options)
    variants[5] = {
      ...generateMockVariant(6, "EGFR"),
      id: "variant_EGFR_exon20ins",
      genomicPosition: "chr7:55242415:GAAGCGTC:GAAGCCACGTC",
      chromosome: "chr7",
      position: 55242415,
      refAllele: "GAAGCGTC",
      altAllele: "GAAGCCACGTC",
      variantType: "insertion",
      geneRegion: "exonic",
      proteinChange: "p.Val769_Asp770insGlyHis",
      pathogenicityScore: 0.72,
      alleleFrequency: 0.0005,
      readDepth: 189,
      clinicalSignificance: "Likely pathogenic",
      evidenceLevel: "Moderate",
      interpretation: "Insertion in EGFR exon 20 resulting in constitutive activation of receptor tyrosine kinase and MAPK signaling."
    };
    
    // Add CCND1 amplification (common in breast cancer)
    variants[6] = {
      ...generateMockVariant(7, "CCND1"),
      id: "variant_CCND1_amplification",
      genomicPosition: "chr11:69455000-69469000",
      chromosome: "chr11",
      position: 69455000,
      refAllele: "Normal",
      altAllele: "Amplification",
      variantType: "CNV",
      geneRegion: "gene-wide",
      pathogenicityScore: 0.68,
      alleleFrequency: 0.004,
      readDepth: 279,
      clinicalSignificance: "Likely pathogenic",
      evidenceLevel: "Moderate",
      interpretation: "Amplification of Cyclin D1 leading to dysregulated cell cycle control and cellular proliferation."
    };
    
    // Add CDH1 mutation (common in lobular breast cancer)
    variants[7] = {
      ...generateMockVariant(8, "CDH1"),
      id: "variant_CDH1_splice",
      genomicPosition: "chr16:68842325:G:T",
      chromosome: "chr16",
      position: 68842325,
      refAllele: "G",
      altAllele: "T",
      variantType: "SNV",
      geneRegion: "splice_site",
      pathogenicityScore: 0.78,
      alleleFrequency: 0.0003,
      readDepth: 156,
      clinicalSignificance: "Likely pathogenic",
      evidenceLevel: "Moderate",
      interpretation: "Splice site mutation in CDH1 likely resulting in aberrant E-cadherin expression and cellular adhesion."
    };
    
    // Add MDM2 amplification (relevant to TP53 pathway)
    variants[8] = {
      ...generateMockVariant(9, "MDM2"),
      id: "variant_MDM2_amplification",
      genomicPosition: "chr12:69201000-69240000",
      chromosome: "chr12",
      position: 69201000,
      refAllele: "Normal",
      altAllele: "Amplification",
      variantType: "CNV",
      geneRegion: "gene-wide",
      pathogenicityScore: 0.65,
      alleleFrequency: 0.002,
      readDepth: 204,
      clinicalSignificance: "Likely pathogenic",
      evidenceLevel: "Moderate",
      interpretation: "Amplification of MDM2 leading to degradation of p53 protein and compromised tumor suppression."
    };
    
    // Add CHEK2 mutation (germline)
    variants[9] = {
      ...generateMockVariant(10, "CHEK2"),
      id: "variant_CHEK2_1100delC",
      genomicPosition: "chr22:29091857:TC:T",
      chromosome: "chr22",
      position: 29091857,
      refAllele: "TC",
      altAllele: "T",
      variantType: "deletion",
      geneRegion: "exonic",
      proteinChange: "p.Thr367fs",
      pathogenicityScore: 0.82,
      alleleFrequency: 0.002,
      readDepth: 145,
      clinicalSignificance: "Pathogenic",
      evidenceLevel: "Strong",
      interpretation: "Truncating mutation in CHEK2 affecting cell cycle checkpoints and DNA damage response."
    };
  }
  
  return variants;
};

// --- Gene-Level Mock Functions ---
export const getGeneDetails = (geneName: string, allVariants: Variant[]): Gene | undefined => {
    const gene = MOCK_GENES.find(g => g.name === geneName);
    if (!gene) return undefined;

    const variantsInGene = allVariants.filter(v => v.gene === geneName);
    
    // Simplified vulnerability profile based on dominant LIME interpretation for this example
    let profile = `Gene ${geneName} is impacted by variants.`;
    const interpretations = variantsInGene.map(v => v.interpretation).filter(interp => interp.startsWith("Pathogenicity likely driven by"));
    if (interpretations.length > 0) {
        const commonReasons: Record<string, number> = {};
        interpretations.forEach(interp => {
            const reason = interp.replace("Pathogenicity likely driven by ", "").replace(".", "");
            commonReasons[reason] = (commonReasons[reason] || 0) + 1;
        });
        const dominantReason = Object.entries(commonReasons).sort((a,b) => b[1] - a[1])[0]?.[0];
        if (dominantReason) {
            profile = `Gene ${geneName} is primarily impacted by variants affecting ${dominantReason.toLowerCase()}.`;
        }
    }

    return {
        ...gene,
        variants: variantsInGene,
        vulnerabilityProfile: profile,
    };
}

// --- Pathway-Level Mock Functions ---
export const getPathwayDetails = (pathwayId: string, allVariants: Variant[]): Pathway & { affectedGenes: Gene[] } | undefined => {
    const pathway = MOCK_PATHWAYS.find(p => p.id === pathwayId);
    if (!pathway) return undefined;

    const affectedGenes: Gene[] = [];
    pathway.genes.forEach(geneName => {
        const geneDetail = getGeneDetails(geneName, allVariants);
        if (geneDetail && geneDetail.variants.length > 0) {
            affectedGenes.push(geneDetail);
        }
    });

    return {
        ...pathway,
        affectedGenes,
    };
} 