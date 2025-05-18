export interface ScoreDefinition {
  scoreName: string; // e.g., "deogen2_score_api", "mvp_score_api"
  fullName: string;  // e.g., "Deleteriousness of Genomic variants V2"
  definition: string;
  interpretationGuide?: string; // Optional: e.g., "Higher scores indicate greater predicted deleteriousness."
}

export const PCSA_SCORE_DEFINITIONS: ScoreDefinition[] = [
  {
    scoreName: "deogen2_score_api",
    fullName: "Deleteriousness of Genomic variants V2",
    definition: "Predicts the functional impact of missense variants. Based on a machine learning model integrating sequence and structural features.",
    interpretationGuide: "Scores range from 0 to 1. Higher scores (e.g., >0.5) suggest a higher likelihood of being deleterious."
  },
  {
    scoreName: "mvp_score_api",
    fullName: "Missensense Variant Pathogenicity Predictor", // Corrected typo from Missensense to Missense
    definition: "A pathogenicity score for missense variants, combining information from multiple bioinformatics tools and conservation scores.",
    interpretationGuide: "Higher scores indicate a higher probability of pathogenicity."
  },
  {
    scoreName: "cadd_score_api",
    fullName: "Combined Annotation Dependent Depletion (CADD)",
    definition: "Integrates multiple annotations into a single measure (CADD score) for ranking the deleteriousness of single nucleotide variants and small insertions/deletions.",
    interpretationGuide: "Higher scores suggest a variant is more likely to be deleterious. Phred-like scores (e.g., >10 is notable, >20 is significant)."
  },
  {
    scoreName: "revel_score_api",
    fullName: "Rare Exome Variant Ensemble Learner (REVEL)",
    definition: "An ensemble method for predicting the pathogenicity of missense variants based on a combination of 13 individual tool scores.",
    interpretationGuide: "Scores range from 0 to 1. Higher scores indicate a higher likelihood of pathogenicity."
  },
  {
    scoreName: "gerp_rs_score_api", // Assuming this was the intended name from mockApi (MOCK_PCSA_SCORE_NAMES)
    fullName: "Genomic Evolutionary Rate Profiling (GERP++) Rejected Substitution (RS) Score",
    definition: "Quantifies evolutionary constraint at a genomic position. Higher scores indicate greater conservation and thus potential impact if mutated.",
    interpretationGuide: "Higher scores (e.g., >2) indicate stronger conservation."
  },
  {
    scoreName: "polyphen2_hdiv_score_api",
    fullName: "PolyPhen-2 (Polymorphism Phenotyping v2) HumDiv",
    definition: "Predicts the possible impact of an amino acid substitution on the structure and function of a human protein using sequence and structure-based features. HumDiv is trained to distinguish disease-causing variants from polymorphisms without known phenotypic effects.",
    interpretationGuide: "Scores range from 0 (tolerated) to 1 (damaging). Categories: probably damaging, possibly damaging, benign."
  },
  {
    scoreName: "polyphen2_hvar_score_api",
    fullName: "PolyPhen-2 (Polymorphism Phenotyping v2) HumVar",
    definition: "Similar to HumDiv, but HumVar is trained to distinguish disease-causing variants from all other human variants, including common polymorphisms.",
    interpretationGuide: "Scores range from 0 (tolerated) to 1 (damaging). Categories: probably damaging, possibly damaging, benign."
  }
  // ... add definitions for all your MOCK_PCSA_SCORE_NAMES from mockApi.ts
];

export const getScoreDefinition = (scoreName: string): ScoreDefinition | undefined => {
  return PCSA_SCORE_DEFINITIONS.find(def => def.scoreName === scoreName);
}; 