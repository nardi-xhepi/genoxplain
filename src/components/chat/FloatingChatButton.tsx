'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ChatPanel } from "./ChatPanel"; // Import ChatPanel
import { useChat } from '@/contexts/ChatContext';
import { Dna } from 'lucide-react'; // Only keeping Dna icon
import { cn } from '@/lib/utils';

const FloatingChatButton = () => {
  const { isChatPanelOpen, setIsChatPanelOpen } = useChat();
  const [pulseEffect, setPulseEffect] = useState(false);
  
  // Subtle pulse animation effect every few seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseEffect(true);
      setTimeout(() => setPulseEffect(false), 1000);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Button
        onClick={() => setIsChatPanelOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-xl z-50",
          "flex items-center justify-center overflow-hidden", 
          // Neon color scheme for light theme
          "bg-primary text-primary-foreground",
          "transform transition-all duration-300 ease-out",
          "neon-glow-primary neon-pulse",
          "hover:scale-110 hover:shadow-[0_0_15px_oklch(0.55_0.28_290),0_0_25px_oklch(0.55_0.28_290,0.7)]", 
          "active:scale-95",
          pulseEffect && "animate-pulse"
        )}
        size="icon"
        aria-label="Open Genomics Assistant"
      >
        <div className="absolute inset-0 bg-primary-foreground/10 opacity-30 animate-pulse-slow rounded-full"></div>
        <div className="w-full h-full flex items-center justify-center">
          <Dna className="dna-icon text-primary-foreground drop-shadow-md" strokeWidth={1.5} />
        </div>
      </Button>
      {isChatPanelOpen && <ChatPanel />}
      
      {/* Add this to your global.css or create a style tag in your layout */}
      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.5; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        /* Direct CSS control for the DNA icon size */
        .dna-icon {
          width: 46px !important; 
          height: 46px !important;
          min-width: 46px;
          min-height: 46px;
          filter: drop-shadow(0 0 5px oklch(0.55 0.28 290)) 
                 drop-shadow(0 0 10px oklch(0.55 0.28 290, 0.5));
        }
        
        /* Override any SVG constraints from Lucide */
        .dna-icon svg {
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </>
  );
};

export default FloatingChatButton; 