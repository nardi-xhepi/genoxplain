'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as NGL from 'ngl';

interface Protein3DViewProps {
  initialGeneName?: string;
  initialProteinChange?: string; // e.g., p.Lys76Asn or p.K76N
  initialUniprotId?: string; // Optional: pass if already known
}

// Parse residue number from protein change string
// Examples: "p.Lys76Asn" -> 76, "p.K76N" -> 76
const parseResidueNumber = (proteinChange: string): number | null => {
  if (!proteinChange) return null;
  const match = proteinChange.match(/^p\.([A-Za-z]{3}|[A-Za-z])(\d+)([A-Za-z]{3}|[A-Za-z])/i);
  if (match) {
    return parseInt(match[2]);
  }
  return null;
};

// Function to fetch UniProt ID from gene name
async function fetchUniprotId(geneName: string): Promise<string | null> {
  console.warn('fetchUniprotId for ' + geneName + ' is using mock data. Replace with actual API call.');
  // Mock data for demo purposes
  if (geneName.toUpperCase() === 'TP53') return 'P04637';
  if (geneName.toUpperCase() === 'EGFR') return 'P00533';
  if (geneName.toUpperCase() === 'BRCA1') return 'P38398';
  if (geneName.toUpperCase() === 'BRCA2') return 'P51587';
  if (geneName.toUpperCase() === 'KRAS') return 'P01116';
  if (geneName.toUpperCase() === 'PIK3CA') return 'P42336';
  // Add more common genes as needed
  return null;
}

// Check if NGL is loaded properly
const isNGLAvailable = typeof NGL !== 'undefined' && NGL && typeof NGL.Stage === 'function';

const AVAILABLE_GENES = ['TP53', 'EGFR', 'BRCA1', 'BRCA2', 'KRAS', 'PIK3CA'];

const Protein3DView: React.FC<Protein3DViewProps> = ({ initialGeneName, initialProteinChange, initialUniprotId }) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const nglStageRef = useRef<NGL.Stage | null>(null);

  const [selectedGene, setSelectedGene] = useState<string | null>(initialGeneName || null);
  const [currentProteinChange, setCurrentProteinChange] = useState<string | null>(initialProteinChange || null);
  const [currentUniprotId, setCurrentUniprotId] = useState<string | null>(initialUniprotId || null);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Effect to handle gene selection changes
  useEffect(() => {
    if (initialGeneName) {
      setSelectedGene(initialGeneName);
      setCurrentProteinChange(initialProteinChange || null);
      setCurrentUniprotId(initialUniprotId || null);
      setIsLoading(true); // Trigger loading when initial props change
    }
  }, [initialGeneName, initialProteinChange, initialUniprotId]);

  // Check if NGL is available, set error if not
  useEffect(() => {
    if (!isNGLAvailable) {
      setError('Failed to load 3D visualization library (NGL). Please try refreshing the page.');
      setIsLoading(false);
    }
  }, []);

  // Fetch UniProt ID if not provided or if selectedGene changes
  useEffect(() => {
    if (!isNGLAvailable) return;
    
    let mounted = true;
    
    const getUniprotId = async () => {
      // If Uniprot ID is already set (e.g. from initial props or previous fetch for the current gene), don't re-fetch
      if (currentUniprotId && selectedGene) { // Ensure it's for the current selected gene
         // Check if currentUniprotId was from an initial prop for a *different* gene.
         // This logic might need refinement if initialUniprotId is meant to stick even after gene changes.
         // For now, if selectedGene has changed and initialUniprotId was for a previous gene, it should be cleared.
         // The state update from gene selection (handleGeneSelect) should handle clearing currentUniprotId.
        setIsLoading(false); 
        setError(null);
        return;
      }
      
      if (selectedGene) {
        setIsLoading(true);
        setError(null);
        try {
          console.log(`Fetching UniProt ID for: ${selectedGene}`);
          const id = await fetchUniprotId(selectedGene);
          if (mounted) {
            if (id) {
              setCurrentUniprotId(id);
              // setIsLoading(false); // Loading will be set to false after structure load
            } else {
              setError('Could not find UniProt ID for gene: ' + selectedGene);
              setCurrentUniprotId(null); // Clear ID if not found
              setIsLoading(false);
            }
          }
        } catch (err) {
          if (mounted) {
            console.error('Error fetching UniProt ID:', err);
            setError('Error fetching UniProt ID for ' + selectedGene);
            setCurrentUniprotId(null);
            setIsLoading(false);
          }
        }
      } else {
        // No gene selected, clear UniProt ID and stop loading
        setCurrentUniprotId(null);
        setError(null); // No error, just no gene selected
        setIsLoading(false);
      }
    };

    if (selectedGene) {
      getUniprotId();
    } else {
      // If no gene is selected, ensure viewer is cleared or shows initial message
      setCurrentUniprotId(null);
      setIsLoading(false);
      setError(null);
       if (nglStageRef.current) {
        try {
          nglStageRef.current.dispose();
        } catch (e) { console.warn('Error disposing NGL stage on gene deselect:', e); }
        nglStageRef.current = null;
      }
    }
    
    return () => { mounted = false; };
  }, [selectedGene]); // Removed isNGLAvailable, kept currentUniprotId out

  // Initialize NGL viewer and load structure
  useEffect(() => {
    if (!isNGLAvailable || !stageRef.current || !currentUniprotId) {
      // If currentUniprotId is null but a gene is selected, it means it's fetching or failed to fetch.
      // isLoading or error state should cover this. If no gene is selected, this effect shouldn't run.
      if (!selectedGene && nglStageRef.current) { // Clear stage if no gene selected
          try {
            nglStageRef.current.dispose();
          } catch (e) { console.warn('Error disposing NGL stage on unipid clear:', e); }
          nglStageRef.current = null;
      }
      return;
    }
    
    // If there's an error, don't proceed with NGL setup
    if (error && !isLoading) return; // Allow loading to complete even if an error is set during fetching
                                  // but prevent re-init if error is already definitively set.

    // Clean up previous stage if it exists
    if (nglStageRef.current) {
      try {
        nglStageRef.current.dispose();
      } catch (e) {
        let message = 'Unknown error during NGL stage disposal';
        if (e instanceof Error) {
          message = e.message;
        } else if (typeof e === 'string') {
          message = e;
        } else {
          try {
            message = String(e);
          } catch { // Removed unused stringifyError
            // message remains 'Unknown error during NGL stage disposal'
          }
        }
        console.warn('Error disposing previous NGL stage: ' + message);
      }
      nglStageRef.current = null;
    }
    
    try {
      // Make sure the DOM is ready before creating the stage
      if (!stageRef.current.parentElement) {
        console.warn('NGL STAGE INIT: Container element not ready for NGL Stage initialization');
        return;
      }
      console.log('NGL STAGE INIT: stageRef.current dimensions:', stageRef.current.clientWidth, stageRef.current.clientHeight);

      const stage = new NGL.Stage(stageRef.current, { backgroundColor: 'white' });
      nglStageRef.current = stage;
      console.log('NGL STAGE INIT: Stage created. MouseObserver:', stage.mouseObserver);
      console.log('NGL STAGE INIT: Stage created. ViewerControls:', stage.viewerControls);
      
      // Set stage settings
      stage.setParameters({
        backgroundColor: 'white',
        quality: 'medium', // Use medium quality for better performance
        impostor: true,
      });
      
      // Handle window resize
      const handleResize = () => {
        if (stage) {
          // Check if stage has been disposed without using .disposed property
          try {
            stage.handleResize();
          } catch (e) {
            console.warn('Error handling resize:', e);
          }
        }
      };
      window.addEventListener('resize', handleResize);
      
      // Determine structure URL based on UniProt ID
      let structureUrl;
      if (currentUniprotId === 'P51587') { // BRCA2
        // Use RCSB PDB download for BRCA2
        structureUrl = 'https://files.rcsb.org/download/AF_AFP51587F5.pdb';
      } else {
        // Standard AlphaFold URL pattern
        structureUrl = `https://alphafold.ebi.ac.uk/files/AF-${currentUniprotId}-F1-model_v4.pdb`;
      }
      
      console.log(`Loading protein structure for ${selectedGene} (${currentUniprotId}) from ${structureUrl}`);
      
      // Load the structure with error handling
      stage.loadFile(structureUrl, { defaultRepresentation: false })
        .then((component: NGL.Component | void) => {
          if (!component) {
            console.error(`Failed to load structure for ${currentUniprotId}`);
            setError(`Failed to load structure for ${selectedGene}`);
            setIsLoading(false);
            return;
          }

          if (!(component instanceof NGL.StructureComponent)) {
            console.warn("Loaded component is not a StructureComponent:", component);
            setError(`Loaded structure for ${selectedGene} is not of a recognized type.`);
            setIsLoading(false);
            return;
          }
          
          // Now component is safely NGL.StructureComponent
          try {
            // Add representation for the entire protein
            component.addRepresentation('cartoon', {
              color: 'residueindex',
              opacity: 0.9,
              smoothSheet: true,
            });
            
            // Add representation for all atoms
            component.addRepresentation('ball+stick', {
              sele: 'hetero and not water',
              opacity: 0.9,
            });

            // Auto-view the whole component to establish a general view
            component.autoView(1000);
            
            // Check if we need to highlight a specific residue
            const residueNumber = currentProteinChange ? parseResidueNumber(currentProteinChange) : null;
            if (residueNumber !== null) {
              // Highlight the mutated residue
              component.addRepresentation('ball+stick', {
                sele: `${residueNumber}`,
                color: 'red',
                radiusScale: 1.5,
                aspectRatio: 1.2,
              });
              
              // Add label for the highlighted residue
              component.addRepresentation("label", {
                sele: `${residueNumber} and .CA`,
                labelType: "format",
                labelFormat: `%{resname}${residueNumber}`,
                color: "black",
                yOffset: 0.5,
                zOffset: 2.0,
                radiusScale: 0.8,
                backgroundColor: "white",
                backgroundOpacity: 0.5,
              });
              // No separate autoView for the residue; it's highlighted within the context of the whole protein view.
            } 
          } catch (loadError) {
            let message = 'Error setting up NGL representation';
            if (loadError instanceof Error) message = loadError.message;
            else if (typeof loadError === 'string') message = loadError;
            else { try {message = String(loadError)} catch {} }

            console.error(message, loadError);
            setError(`Error visualizing structure for ${selectedGene}: ${message}`);
          } finally {
            setIsLoading(false);
          }
        })
        .catch(err => {
          let message = 'Error loading PDB file';
          if (err instanceof Error) message = err.message;
          else if (typeof err === 'string') message = err;
          else { try {message = String(err)} catch {} }
          
          console.error('NGL stage.loadFile error:', message, err);
          setError(`Failed to load PDB for ${selectedGene}: ${message}`);
          setIsLoading(false);
        });
        
      return () => {
        window.removeEventListener('resize', handleResize);
        if (stage) {
          try {
            stage.dispose();
          } catch (e) { console.warn("Error disposing NGL stage on cleanup: ", e); }
        }
        nglStageRef.current = null;
      };
    } catch (stageError) {
      let message = 'Failed to initialize NGL stage';
      if (stageError instanceof Error) message = stageError.message;
      else if (typeof stageError === 'string') message = stageError;
      else { try {message = String(stageError)} catch {} }

      console.error(message, stageError);
      setError(`${message}. Try refreshing.`);
      setIsLoading(false);
    }
  }, [currentUniprotId, currentProteinChange]); // Refined dependencies

  const handleGeneSelect = (gene: string) => {
    if (gene) {
      setSelectedGene(gene);
      setCurrentProteinChange(null); // Reset protein change for new gene
      setCurrentUniprotId(null);     // Reset UniProt ID to trigger fetch
      setError(null);
      setIsLoading(true);
    } else {
      setSelectedGene(null);
      setCurrentProteinChange(null);
      setCurrentUniprotId(null);
      setError(null);
      setIsLoading(false);
      if (nglStageRef.current) {
        try {
          nglStageRef.current.dispose();
        } catch (e) {
          console.warn('Error disposing NGL stage on gene deselect (handleGeneSelect):', e);
        }
        nglStageRef.current = null;
      }
    }
  };

  if (!isNGLAvailable && !error) { // Show NGL load error first if it occurred
     return <div className="flex h-full w-full items-center justify-center rounded-md border border-gray-300 bg-gray-50 p-4 text-gray-500">
      Failed to load 3D visualization library (NGL). Please try refreshing the page.
    </div>;
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2 p-2 rounded-md border border-gray-300 bg-gray-50">
        <label htmlFor="geneSelect" className="text-sm font-medium text-gray-700">
          Select Gene:
        </label>
        <select
          id="geneSelect"
          value={selectedGene || ''}
          onChange={(e) => handleGeneSelect(e.target.value)}
          className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
        >
          <option value="">-- Select a Gene --</option>
          {AVAILABLE_GENES.map((gene) => (
            <option key={gene} value={gene}>
              {gene}
            </option>
          ))}
        </select>
      </div>

      {!selectedGene && !isLoading && !error && (
         <div className="flex h-[480px] w-full items-center justify-center rounded-md border border-gray-300 bg-gray-50 p-4 text-gray-500">
          Please select a gene to view its 3D structure.
        </div>
      )}

      {(selectedGene || isLoading || error) && (
        <div 
          key={currentUniprotId || 'ngl-view-wrapper'}
          className="relative h-[480px] w-full rounded-md border border-gray-470 bg-white"
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                <div className="mt-4 text-gray-700">Loading structure...</div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="max-w-lg p-4 text-center text-red-600">
                <h3 className="text-xl font-semibold mb-2">Error loading 3D view:</h3>
                <p>{error}</p>
              </div>
            </div>
          )}
          
          <div 
            ref={stageRef} 
            className="h-full w-full"
            style={{ 
              pointerEvents: (isLoading || error || !selectedGene) ? 'none' : 'auto',
              visibility: (isLoading || error || !selectedGene) ? 'hidden' : 'visible' // Restore visibility for proper layout hiding
            }}
          ></div>

          {!isLoading && !error && selectedGene && (
            <div 
              className='absolute bottom-6 left-6 z-20 pointer-events-none'
              style={{ width: 75, height: 75 }}
              role="img"
              aria-label='XYZ axes orientation guide: X (red, right), Y (green, up), Z (blue dot, out of screen)'
            >
              <svg width={75} height={75} viewBox={`0 0 75 75`} xmlns="http://www.w3.org/2000/svg">
                {
                  (() => {
                    const size = 75;
                    const strokeWidth = 2.5;
                    const halfSize = size / 2;
                    const arrowLength = size / 2.8;
                    const arrowHeadWidth = strokeWidth * 2.5;
                    const arrowHeadLength = strokeWidth * 3;
                    const textOffset = arrowHeadLength * 0.8;
                    const labelFontSize = Math.max(10, size / 7);

                    return (
                      <>
                        {/* Y-axis (Green) - pointing up from center */}
                        <line 
                          x1={halfSize} y1={halfSize} 
                          x2={halfSize} y2={halfSize - arrowLength} 
                          stroke="#22c55e"
                          strokeWidth={strokeWidth} 
                        />
                        <polygon 
                          points={`${halfSize},${halfSize - arrowLength - arrowHeadLength/3} ${halfSize - arrowHeadWidth / 2},${halfSize - arrowLength + arrowHeadLength*2/3} ${halfSize + arrowHeadWidth / 2},${halfSize - arrowLength + arrowHeadLength*2/3}`} 
                          fill="#22c55e" 
                        />
                        <text x={halfSize + textOffset} y={halfSize - arrowLength - textOffset} fontSize={labelFontSize} fill="#166534" fontWeight="bold" dominantBaseline="middle" textAnchor="start">Y</text>

                        {/* X-axis (Red) - pointing right from center */}
                        <line 
                          x1={halfSize} y1={halfSize} 
                          x2={halfSize + arrowLength} y2={halfSize} 
                          stroke="#ef4444"
                          strokeWidth={strokeWidth} 
                        />
                        <polygon 
                           points={`${halfSize + arrowLength + arrowHeadLength/3},${halfSize} ${halfSize + arrowLength - arrowHeadLength*2/3},${halfSize - arrowHeadWidth / 2} ${halfSize + arrowLength - arrowHeadLength*2/3},${halfSize + arrowHeadWidth / 2}`} 
                          fill="#ef4444" 
                        />
                        <text x={halfSize + arrowLength + textOffset - (arrowHeadLength*0.4) } y={halfSize - textOffset} fontSize={labelFontSize} fill="#991b1b" fontWeight="bold" dominantBaseline="middle" textAnchor="end">X</text>
                        
                        {/* Z-axis (Blue) - represented by a dot at the center */}
                        <circle cx={halfSize} cy={halfSize} r={strokeWidth * 2} fill="#3b82f6" stroke="#60a5fa" strokeWidth={strokeWidth/1.5} />
                        <text x={halfSize + textOffset * 0.9} y={halfSize + textOffset + (strokeWidth * 2)} fontSize={labelFontSize} fill="#1e3a8a" fontWeight="bold" dominantBaseline="middle" textAnchor="start">Z</text>
                      </>
                    );
                  })()
                }
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Protein3DView; 