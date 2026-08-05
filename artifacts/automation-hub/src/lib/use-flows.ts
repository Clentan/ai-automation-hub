import { useState, useEffect, useCallback } from 'react';
import { MOCK_TEMPLATES, Template } from './data';

export type FlowStatus = 'on' | 'off';

export interface Flow {
  id: string;
  templateId: string;
  name: string;
  status: FlowStatus;
  runCount: number;
  lastRun: string | null;
  createdAt: string;
  template: Template; // Snapshot or reference
}

export interface ActivityLog {
  id: string;
  flowId: string;
  flowName: string;
  status: 'success' | 'failed';
  timestamp: string;
  durationMs: number;
}

const FLOWS_STORAGE_KEY = 'ai-automation-hub-flows';
const ACTIVITY_STORAGE_KEY = 'ai-automation-hub-activity';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

export function useFlows() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage
  useEffect(() => {
    try {
      const storedFlows = localStorage.getItem(FLOWS_STORAGE_KEY);
      if (storedFlows) {
        setFlows(JSON.parse(storedFlows));
      }

      const storedActivity = localStorage.getItem(ACTIVITY_STORAGE_KEY);
      if (storedActivity) {
        setActivity(JSON.parse(storedActivity));
      }
    } catch (error) {
      console.error('Failed to load data from localStorage', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save flows
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(flows));
    }
  }, [flows, isLoaded]);

  // Save activity
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activity));
    }
  }, [activity, isLoaded]);

  const createFlow = useCallback((templateId: string) => {
    const template = MOCK_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return null;

    const newFlow: Flow = {
      id: `f-${generateId()}`,
      templateId,
      name: `My ${template.name}`,
      status: 'on',
      runCount: 0,
      lastRun: null,
      createdAt: new Date().toISOString(),
      template
    };

    setFlows((prev) => [newFlow, ...prev]);
    
    // Simulate initial activity
    const newActivity: ActivityLog = {
      id: `a-${generateId()}`,
      flowId: newFlow.id,
      flowName: newFlow.name,
      status: 'success',
      timestamp: new Date().toISOString(),
      durationMs: Math.floor(Math.random() * 2000) + 500,
    };
    setActivity((prev) => [newActivity, ...prev].slice(0, 100));

    return newFlow;
  }, []);

  const toggleFlow = useCallback((id: string) => {
    setFlows((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: f.status === 'on' ? 'off' : 'on' } : f))
    );
  }, []);

  const renameFlow = useCallback((id: string, newName: string) => {
    setFlows((prev) => prev.map((f) => (f.id === id ? { ...f, name: newName } : f)));
    setActivity((prev) => prev.map((a) => (a.flowId === id ? { ...a, flowName: newName } : a)));
  }, []);

  const deleteFlow = useCallback((id: string) => {
    setFlows((prev) => prev.filter((f) => f.id !== id));
    // Optional: clear activity for deleted flow, or keep it for history. Let's keep it.
  }, []);

  return {
    flows,
    activity,
    isLoaded,
    createFlow,
    toggleFlow,
    renameFlow,
    deleteFlow
  };
}
