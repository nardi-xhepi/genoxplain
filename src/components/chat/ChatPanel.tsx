'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from '@/contexts/ChatContext';
import { Variant } from '@/lib/mockApi';
import { PCSA_SCORE_DEFINITIONS } from '@/lib/scoreDefinitions';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizonal, X, User, Bot, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  variantSummary?: Variant[];
  isLoading?: boolean;
}

// Add a utility function to preprocess markdown text
// const preprocessMarkdown = (text: string): string => {
//   if (!text) return '';
//   
//   // Replace escaped asterisks with actual asterisks
//   let processed = text.replace(/\\\*/g, '*');
//   
//   // Ensure proper spacing around strong/emphasis markers
//   processed = processed.replace(/(\w)\*\*(\w)/g, '$1 **$2');
//   processed = processed.replace(/(\w)\*(\w)/g, '$1 *$2');
//   
//   // Fix broken line breaks and escape sequences
//   processed = processed.replace(/\\n\\n/g, '\n\n');
//   processed = processed.replace(/\\n/g, '\n');
//   processed = processed.replace(/\\t/g, '  ');
//   
//   // Fix consecutive spaces that might be lost in HTML rendering
//   processed = processed.replace(/  +/g, (match) => {
//     return match.split('').map(() => '&nbsp;').join('');
//   });
//   
//   // Fix common markdown syntax issues
//   processed = processed.replace(/\*\*(\w+)\*\*/g, ' **$1** '); // Fix bold
//   processed = processed.replace(/\*(\w+)\*/g, ' *$1* '); // Fix italic
//   
//   // Fix spacing between sentences
//   processed = processed.replace(/(\w)\.(\w)/g, '$1. $2');
//   
//   return processed;
// };

export const ChatPanel = () => {
  const { currentAnalysisVariants, isChatPanelOpen, setIsChatPanelOpen } = useChat();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [hasSentFirstUserMessage, setHasSentFirstUserMessage] = useState(false);

  const initialContextForAPI = useMemo(() => {
    if (!currentAnalysisVariants || currentAnalysisVariants.length === 0) return null;

    const topVariants = [...currentAnalysisVariants]
      .sort((a, b) => b.pathogenicityScore - a.pathogenicityScore)
      .slice(0, 10);

    let context = "## Context: TCGA BRCA (Breast Cancer) Analysis\n";
    context += "The Cancer Genome Atlas (TCGA) Breast Cancer (BRCA) dataset contains comprehensive genomic data from breast cancer patients, including somatic mutations, gene expression, copy number alterations, and clinical information. Breast cancer is a heterogeneous disease with several molecular subtypes (Luminal A, Luminal B, HER2-enriched, Basal-like/Triple-negative) that differ in genetic alterations, treatment response, and prognosis.\n\n";
    
    context += "## Patient Context\n";
    context += "The user is a 38-year-old female patient recently diagnosed with breast cancer. The variants being analyzed are simulated genomic data based on the patient's tumor sample. This early-onset breast cancer case may have genetic and prognostic implications that differ from typical later-onset cases.\n\n";
    
    context += "### Simulated Clinical Data\n";
    context += "- Diagnosis: Invasive ductal carcinoma (IDC), Grade 2\n";
    context += "- Tumor Size: 2.8 cm (T2)\n";
    context += "- Lymph Node Status: 2 positive nodes out of 15 sampled (N1)\n";
    context += "- Metastasis: None detected (M0)\n";
    context += "- Stage: IIB (T2N1M0)\n";
    context += "- Receptor Status: ER+ (90%), PR+ (70%), HER2- (IHC 1+)\n";
    context += "- Ki-67: 18% (intermediate proliferation index)\n";
    context += "- Family History: Mother diagnosed with breast cancer at age 61, maternal aunt with ovarian cancer at age 58\n";
    context += "- Molecular Subtype: Luminal B\n\n";
    
    context += "### Simulated Genomic Testing\n";
    context += "- Germline Testing: Heterozygous BRCA2 pathogenic variant (c.5946delT)\n";
    context += "- Somatic Mutations: PIK3CA (H1047R), TP53 (R175H), PTEN (loss), ESR1 amplification\n";
    context += "- Genomic Signatures: Intermediate Oncotype DX recurrence score (26)\n";
    context += "- Tumor Mutational Burden: 3.1 mutations/Mb (low)\n";
    context += "- Microsatellite Status: MSS (stable)\n";
    context += "- Homologous Recombination Deficiency: HRD-positive score (42)\n\n";
    
    context += "## Top 10 Variants Summary:\n";
    topVariants.forEach(v => {
      context += `- ${v.id} (Gene: ${v.gene}, Path. Score: ${v.pathogenicityScore.toFixed(2)}): ${v.interpretation}\n`;
    });

    context += "\n## PCSA Score Definitions:\n";
    PCSA_SCORE_DEFINITIONS.forEach(def => {
      context += `- ${def.scoreName} (${def.fullName}): ${def.definition} ${def.interpretationGuide ? '('+def.interpretationGuide+')' : ''}\n`;
    });
    return context;
  }, [currentAnalysisVariants]);

  useEffect(() => {
    if (isChatPanelOpen && currentAnalysisVariants && currentAnalysisVariants.length > 0 && messages.length === 0) {
      const topVariants = [...currentAnalysisVariants]
        .sort((a, b) => b.pathogenicityScore - a.pathogenicityScore)
        .slice(0, 10);
      
      setMessages([
        {
          id: 'ai-initial-summary',
          sender: 'ai',
          text: `Hello! I'm your GenoXplain AI assistant. I'll help you understand your personal breast cancer genomic data. As a 38-year-old patient with Stage IIB Luminal B breast cancer and a BRCA2 pathogenic variant, you have a unique genomic profile. Here's a summary of the top ${topVariants.length} most pathogenic variants identified in your simulated tumor sample:`,
          variantSummary: topVariants
        },
        {
            id: 'ai-prompt-initial',
            sender: 'ai',
            text: "What would you like to know about your breast cancer variants? With your Luminal B subtype, BRCA2 mutation, and additional somatic alterations (like PIK3CA H1047R and TP53 R175H), there are several treatment considerations to discuss. You might ask about targeted therapies, PARP inhibitors, immunotherapy potential, or how your HRD-positive status might influence treatment options. Remember that this analysis uses simulated data for educational purposes, and any clinical decisions should involve your healthcare team."
        }
      ]);
    } else if (!isChatPanelOpen) {
        setHasSentFirstUserMessage(false);
    }
  }, [isChatPanelOpen, currentAnalysisVariants, messages.length]);

  useEffect(() => {
    const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollViewport) {
        setTimeout(() => {
            scrollViewport.scrollTo({ top: scrollViewport.scrollHeight, behavior: 'smooth' });
        }, 100);
    }
  }, [messages]);

  const handleClose = () => {
    setIsChatPanelOpen(false);
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isLoading) return;

    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: inputValue.trim(),
    };

    const aiPlaceholderId = `ai-${Date.now()}`;
    const aiPlaceholderMessage: ChatMessage = {
      id: aiPlaceholderId,
      sender: 'ai',
      text: '',
      isLoading: true,
    };

    setMessages(prev => [...prev, newUserMessage, aiPlaceholderMessage]);
    setInputValue('');
    setIsLoading(true);

    const apiPayloadMessages = [...messages, newUserMessage].map(msg => ({
      sender: msg.sender,
      text: msg.text
    }));
    
    let contextToSend = null;

    if (!hasSentFirstUserMessage && initialContextForAPI) {
      contextToSend = initialContextForAPI;
      setHasSentFirstUserMessage(true);
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: apiPayloadMessages, 
          context: contextToSend,
          stream: true // Request streaming response
        }),
      });

      if (!response.ok) {
        let errorText = "Sorry, I encountered an API error.";
        try {
            const errorData = await response.json(); // Try to parse error as JSON
            console.error("API Error (JSON):", errorData);
            errorText = `Sorry, I encountered an error: ${errorData.error || 'Unknown error'}. Details: ${errorData.details || 'N/A'}`;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) { // Changed e to _e to mark as intentionally unused or handle if needed
            const rawErrorText = await response.text(); // Fallback to text if error isn't JSON
            console.error("API Error (Raw Text):", rawErrorText);
            errorText = `Sorry, I encountered an API error: ${rawErrorText.substring(0,100)}`;
        }
        setMessages(prev => prev.map(msg => msg.id === aiPlaceholderId ? { ...msg, text: errorText, isLoading: false } : msg));
        setIsLoading(false);
        return;
      }

      // START OF NEW STREAMING LOGIC
      if (!response.body) {
        const errorText = "Sorry, the response from the server was empty.";
        setMessages(prev => prev.map(msg => msg.id === aiPlaceholderId ? { ...msg, text: errorText, isLoading: false } : msg));
        setIsLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = "";
      // Ensure placeholder is 'isLoading' and text is empty initially for streaming
      setMessages(prev => prev.map(msg => msg.id === aiPlaceholderId ? { ...msg, text: "", isLoading: true } : msg));

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Stream has finished
            setMessages(prev => prev.map(m =>
              m.id === aiPlaceholderId ? { ...m, text: accumulatedResponse, isLoading: false } : m
            ));
            setIsLoading(false); // Overall loading state for the input
            break;
          }

          const chunkString = decoder.decode(value, { stream: true });
          // Attempt to parse the chunk string. The backend sends complete JSON objects per enqueue.
          // These objects can be { token: "..." }, { error: "..." }, or { done: true }.
          try {
            // It's possible a chunk might contain multiple independent JSON objects if they were buffered.
            // e.g. {"token":"Hello"}{"token":" world"}
            // We'll process them by finding JSON object boundaries.
            // A simple way: split by '}' and re-add it, then try to parse.
            // More robust: accumulate in a buffer and parse iteratively.
            // For now, let's assume chunks are mostly one JSON, or handle multiple if they are clearly delimited.
            // The backend sends JSON.stringify(obj1) then JSON.stringify(obj2), not newline delimited.
            // So they might arrive as '{"k":"v1"}{"k":"v2"}'
            // This requires a more robust parsing strategy if chunks are not guaranteed to be single JSONs.

            // Strategy: Split by "}{" which indicates end of one JSON and start of another.
            const potentialJsons = chunkString.replace(/}{/g, "}\n{").split('\n');
            
            for (const pJson of potentialJsons) {
              if (pJson.trim() === "") continue;
              
              const parsedChunk = JSON.parse(pJson);

              if (parsedChunk.token) {
                accumulatedResponse += parsedChunk.token;
                setMessages(prev => prev.map(m =>
                  m.id === aiPlaceholderId ? { ...m, text: accumulatedResponse, isLoading: true } : m
                ));
              } else if (parsedChunk.error) {
                console.error("Error message from stream content:", parsedChunk.error);
                accumulatedResponse += `\n[Stream Error: ${parsedChunk.error}]`;
                setMessages(prev => prev.map(m =>
                  m.id === aiPlaceholderId ? { ...m, text: accumulatedResponse, isLoading: false } : m
                ));
                setIsLoading(false);
                reader.cancel(parsedChunk.error); // Cancel the stream
                return; // Exit while loop and function
              } else if (parsedChunk.done) {
                // This is an explicit 'done' from the backend before closing stream.
                // The main `if (done)` block handles actual stream end.
                console.log("Received explicit 'done' marker in stream content.");
              }
            }
          } catch (e) {
            // This implies the chunkString (or part of it) was not valid JSON.
            // This could happen if a single JSON object got split across `reader.read()` calls,
            // or if there's non-JSON data.
            console.error("Failed to parse JSON from stream chunk:", e, "Chunk string:", chunkString);
            // If it's a parsing error, it's safer to stop and show what we have plus an error.
            // accumulatedResponse += " [Error parsing stream data] "; // Add to displayed text
            // setMessages(prev => prev.map(m =>
            //     m.id === aiPlaceholderId ? { ...m, text: accumulatedResponse + `\n[Error: Malformed stream data]`, isLoading: false } : m
            // ));
            // setIsLoading(false);
            // reader.cancel("Malformed stream data");
            // break; // Exit while loop
            // For now, just log and continue, hoping next chunk is better or `done` arrives.
            // This might lead to incomplete messages if a chunk is truly corrupt.
          }
        }
      } catch (streamProcessingError: unknown) {
        // This catches errors from reader.read() itself, or if we threw an error above.
        console.error("Error during stream processing:", streamProcessingError);
        setMessages(prev => prev.map(msg => msg.id === aiPlaceholderId ? { ...msg, text: accumulatedResponse + `\n[Stream Error: ${(streamProcessingError as Error).message}]`, isLoading: false } : msg));
        setIsLoading(false);
      }
      // END OF NEW STREAMING LOGIC

    } catch (error) {
      console.error("Failed to send message (Network or other error):", error);
      const errorText = "Sorry, I couldn't connect to the server. Please check your connection and try again.";
      setMessages(prev => prev.map(m => 
        m.id === aiPlaceholderId ? { ...m, text: errorText, isLoading: false } : m
      ));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isChatPanelOpen) {
    return null;
  }

  return (
    <Drawer open={isChatPanelOpen} onClose={handleClose} direction="right">
      <DrawerContent 
        className={cn(
          "w-[800px] max-w-[800px] mr-[50px] flex flex-col rounded-l-xl shadow-xl border-l border-primary/20 bg-card/95 backdrop-blur-sm",
          "h-[70vh] my-[15vh]" 
        )}
        style={{ width: '800px', maxWidth: '800px' }}
      >
        <DrawerHeader className="border-b border-primary/10 pb-4">
          <DrawerTitle className="text-center text-primary">GenoXplain AI Assistant</DrawerTitle>
          <DrawerDescription className="text-center">
            Ask questions about your genetic variants and analysis results
          </DrawerDescription>
          <DrawerClose 
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground hover:text-primary" 
            onClick={handleClose}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex-1 px-4">
          <ScrollArea className="h-[calc(70vh-180px)]" ref={scrollAreaRef}>
            <div className="space-y-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex w-full gap-3 animate-fadeInUp",
                    message.sender === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.sender === 'ai' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/30 neon-glow-primary">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-xl px-4 py-3 max-w-[85%] shadow-sm",
                      message.sender === 'user'
                        ? "bg-primary text-primary-foreground neon-glow-primary"
                        : "bg-white border border-primary/20 hover:neon-glow-accent transition-all duration-300"
                    )}
                  >
                    {message.isLoading && !message.text && ( 
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Thinking...</span>
                      </div>
                    )}
                    
                    {(message.text || !message.isLoading) && ( 
                      <>
                        <div className={cn(
                          "prose dark:prose-invert prose-sm",
                          "prose-headings:font-semibold prose-headings:tracking-tight",
                          "prose-a:text-primary prose-a:hover:opacity-80",
                          "prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:pl-4 prose-blockquote:italic"
                        )}>
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm, remarkBreaks]} 
                            rehypePlugins={[rehypeSanitize, rehypeRaw]}
                            skipHtml={false}
                            components={{
                              p: ({children, ...props}) => <p className="mb-4 whitespace-pre-wrap" {...props}>{children}</p>,
                              h1: ({children, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4 text-primary" {...props}>{children}</h1>,
                              h2: ({children, ...props}) => <h2 className="text-xl font-semibold mt-5 mb-3 text-primary" {...props}>{children}</h2>,
                              h3: ({children, ...props}) => <h3 className="text-lg font-medium mt-4 mb-2 text-primary" {...props}>{children}</h3>,
                              h4: ({children, ...props}) => <h4 className="text-base font-medium mt-3 mb-2" {...props}>{children}</h4>,
                              h5: ({children, ...props}) => <h5 className="text-sm font-medium mt-3 mb-1" {...props}>{children}</h5>,
                              h6: ({children, ...props}) => <h6 className="text-sm font-medium mt-2 mb-1" {...props}>{children}</h6>,
                              ul: ({children, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props}>{children}</ul>,
                              ol: ({children, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props}>{children}</ol>,
                              li: ({children, ...props}) => <li className="mb-1" {...props}>{children}</li>,
                              blockquote: ({children, ...props}) => <blockquote className="border-l-4 border-primary/30 pl-4 italic my-4" {...props}>{children}</blockquote>,
                              a: ({href, children, ...props}) => <a href={href} className="text-primary hover:underline" {...props}>{children}</a>,
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              code: ({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode; [key: string]: any }) => {
                                const codeText = String(children).replace(/\n$/, '');

                                if (inline) {
                                  return (
                                    <code className="bg-primary/10 text-primary px-1 py-0.5 rounded-sm font-mono text-sm" {...props}>
                                      {codeText}
                                    </code>
                                  );
                                }
                                
                                return (
                                  <code className={`${className || ''} font-mono text-sm`} {...props}>
                                    {codeText}
                                  </code>
                                );
                              },
                              strong: ({ children, ...props }) => {
                                return <strong className="font-semibold" {...props}>{children}</strong>;
                              },
                              em: ({ children, ...props }) => {
                                return <em className="italic" {...props}>{children}</em>;
                              },
                              pre: ({children, ...props}) => <pre className="bg-muted/50 p-3 rounded-md overflow-x-auto mb-4 font-mono text-sm" {...props}>{children}</pre>,
                            }}
                          >
                            {message.text}
                          </ReactMarkdown>
                        </div>

                        {message.isLoading && message.text && (
                          <div className="flex justify-end opacity-50 text-xs pt-1 items-center">
                            <Loader2 className="h-3 w-3 animate-spin mr-1" /> 
                            <span>streaming...</span>
                          </div>
                        )}

                        {!message.isLoading && message.variantSummary && (
                          <div className="mt-4 space-y-2">
                            {message.variantSummary.map((variant) => (
                              <div
                                key={variant.id}
                                className="rounded-md bg-muted/50 p-3 border border-primary/20 hover:neon-border transition-all duration-300"
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="font-semibold text-primary">{variant.gene}: {variant.id}</div>
                                    <div className="text-sm text-muted-foreground">{variant.interpretation}</div>
                                  </div>
                                  <Badge 
                                    className={cn(
                                      "ml-2",
                                      variant.pathogenicityScore > 0.7 ? "bg-destructive hover:bg-destructive/80 text-white" :
                                      variant.pathogenicityScore > 0.4 ? "bg-amber-500 hover:bg-amber-500/80 text-black" :
                                      "bg-accent hover:bg-accent/80 text-accent-foreground"
                                    )}
                                  >
                                    Score: {variant.pathogenicityScore.toFixed(2)}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {message.sender === 'user' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 border border-accent/30 neon-glow-accent">
                      <User className="h-4 w-4 text-accent" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DrawerFooter className="border-t border-primary/10 pt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about your genetic variants..."
              className="min-h-[50px] max-h-[200px] overflow-y-auto resize-none border-primary/20 focus:border-primary focus:ring-primary/20 transition-all duration-300"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button 
              type="submit" 
              disabled={inputValue.trim() === '' || isLoading}
              variant="default"
              className="shrink-0 bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizonal className="h-4 w-4" />
              )}
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}; 