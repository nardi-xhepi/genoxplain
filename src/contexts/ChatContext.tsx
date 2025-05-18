'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { Variant } from '@/lib/mockApi'; // Import Variant type

interface ChatContextType {
  currentAnalysisVariants: Variant[] | null;
  setCurrentAnalysisVariants: (variants: Variant[] | null) => void;
  isChatPanelOpen: boolean;
  setIsChatPanelOpen: (isOpen: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [currentAnalysisVariants, setCurrentAnalysisVariantsState] = useState<Variant[] | null>(null);
  const [isChatPanelOpen, setIsChatPanelOpenState] = useState(false);

  const setCurrentAnalysisVariants = useCallback((variants: Variant[] | null) => {
    setCurrentAnalysisVariantsState(variants);
  }, []);

  const memoizedSetIsChatPanelOpen = useCallback((isOpen: boolean) => {
    setIsChatPanelOpenState(isOpen);
  }, []);

  return (
    <ChatContext.Provider value={{
      currentAnalysisVariants,
      setCurrentAnalysisVariants,
      isChatPanelOpen,
      setIsChatPanelOpen: memoizedSetIsChatPanelOpen
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}; 