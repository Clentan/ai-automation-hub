import React, { createContext, useContext } from 'react';
import { useFlows, Flow, ActivityLog } from '@/lib/use-flows';

interface FlowsContextType {
  flows: Flow[];
  activity: ActivityLog[];
  isLoaded: boolean;
  createFlow: (templateId: string) => Flow | null;
  toggleFlow: (id: string) => void;
  renameFlow: (id: string, newName: string) => void;
  deleteFlow: (id: string) => void;
}

const FlowsContext = createContext<FlowsContextType | null>(null);

export function FlowsProvider({ children }: { children: React.ReactNode }) {
  const flowsState = useFlows();
  return <FlowsContext.Provider value={flowsState}>{children}</FlowsContext.Provider>;
}

export function useFlowsContext() {
  const context = useContext(FlowsContext);
  if (!context) {
    throw new Error('useFlowsContext must be used within a FlowsProvider');
  }
  return context;
}
