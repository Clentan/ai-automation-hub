import { useState, useEffect, useCallback } from 'react';
import { Template } from './data';
import { getCachedTemplate } from './use-templates';

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
        const parsed = JSON.parse(storedFlows);
        if (Array.isArray(parsed)) {
          setFlows(
            parsed.filter(
              (f: unknown): f is Flow =>
                !!f &&
                typeof f === 'object' &&
                typeof (f as Flow).id === 'string' &&
                typeof (f as Flow).name === 'string' &&
                !!(f as Flow).template &&
                typeof (f as Flow).template === 'object'
            )
          );
        }
      }

      const storedActivity = localStorage.getItem(ACTIVITY_STORAGE_KEY);
      if (storedActivity) {
        const parsed = JSON.parse(storedActivity);
        if (Array.isArray(parsed)) {
          setActivity(
            parsed.filter(
              (a: unknown): a is ActivityLog =>
                !!a &&
                typeof a === 'object' &&
                typeof (a as ActivityLog).id === 'string' &&
                typeof (a as ActivityLog).flowName === 'string' &&
                typeof (a as ActivityLog).timestamp === 'string'
            )
          );
        }
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
    const template = getCachedTemplate(templateId);
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

  /**
   * Record a real template run (from the Run pages) so Home stats,
   * My flows counters, and the Activity log all stay in sync.
   * Creates a flow for the template automatically if the user doesn't have one yet.
   */
  const recordRun = useCallback(
    (templateId: string, status: 'success' | 'failed', durationMs: number) => {
      const now = new Date().toISOString();
      setFlows((prev) => {
        const existing = prev.find((f) => f.templateId === templateId);
        if (existing) {
          const updated = prev.map((f) =>
            f.templateId === templateId
              ? { ...f, runCount: f.runCount + (status === 'success' ? 1 : 0), lastRun: now }
              : f
          );
          setActivity((a) =>
            [
              {
                id: `a-${generateId()}`,
                flowId: existing.id,
                flowName: existing.name,
                status,
                timestamp: now,
                durationMs,
              },
              ...a,
            ].slice(0, 100)
          );
          return updated;
        }
        const template = getCachedTemplate(templateId);
        if (!template) return prev;
        const newFlow: Flow = {
          id: `f-${generateId()}`,
          templateId,
          name: `My ${template.name}`,
          status: 'on',
          runCount: status === 'success' ? 1 : 0,
          lastRun: now,
          createdAt: now,
          template,
        };
        setActivity((a) =>
          [
            {
              id: `a-${generateId()}`,
              flowId: newFlow.id,
              flowName: newFlow.name,
              status,
              timestamp: now,
              durationMs,
            },
            ...a,
          ].slice(0, 100)
        );
        return [newFlow, ...prev];
      });
    },
    []
  );

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
    recordRun,
    toggleFlow,
    renameFlow,
    deleteFlow
  };
}
