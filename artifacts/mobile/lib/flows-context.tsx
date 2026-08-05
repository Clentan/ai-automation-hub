import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/expo';
import { TEMPLATES, Template } from '@/lib/data';

export type FlowStatus = 'on' | 'off';

export interface Flow {
  id: string;
  templateId: string;
  name: string;
  status: FlowStatus;
  createdAt: string;
}

export interface LocalActivity {
  id: string;
  flowId: string;
  flowName: string;
  status: 'success' | 'failed';
  timestamp: string;
  durationMs: number;
}

// Storage is scoped per Clerk user so accounts on a shared device never see
// each other's flows. Signed-out browsing gets its own separate bucket.
const flowsKey = (userId: string | null | undefined) =>
  `aah-mobile-flows:${userId ?? 'anon'}`;
const activityKey = (userId: string | null | undefined) =>
  `aah-mobile-activity:${userId ?? 'anon'}`;

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 9);

interface FlowsContextValue {
  flows: Flow[];
  activity: LocalActivity[];
  isLoaded: boolean;
  createFlow: (templateId: string) => Flow | null;
  toggleFlow: (id: string) => void;
  deleteFlow: (id: string) => void;
  templateFor: (flow: Flow) => Template | undefined;
}

const FlowsContext = createContext<FlowsContextValue | null>(null);

export function FlowsProvider({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded: authLoaded } = useAuth();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [activity, setActivity] = useState<LocalActivity[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Reload storage whenever the signed-in user changes (sign-in/out included)
  // so one account's local data never leaks into another's session.
  useEffect(() => {
    if (!authLoaded) return;
    let cancelled = false;
    setIsLoaded(false);
    setFlows([]);
    setActivity([]);
    (async () => {
      try {
        const [f, a] = await Promise.all([
          AsyncStorage.getItem(flowsKey(userId)),
          AsyncStorage.getItem(activityKey(userId)),
        ]);
        if (cancelled) return;
        if (f) {
          const parsed = JSON.parse(f);
          if (Array.isArray(parsed)) setFlows(parsed as Flow[]);
        }
        if (a) {
          const parsed = JSON.parse(a);
          if (Array.isArray(parsed)) setActivity(parsed as LocalActivity[]);
        }
      } catch (e) {
        console.error('Failed to load flows from storage', e);
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, authLoaded]);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(flowsKey(userId), JSON.stringify(flows)).catch(() => {});
    }
  }, [flows, isLoaded, userId]);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(activityKey(userId), JSON.stringify(activity)).catch(() => {});
    }
  }, [activity, isLoaded, userId]);

  const createFlow = useCallback((templateId: string): Flow | null => {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (!template) return null;
    const newFlow: Flow = {
      id: `f-${generateId()}`,
      templateId,
      name: `My ${template.name}`,
      status: 'on',
      createdAt: new Date().toISOString(),
    };
    setFlows((prev) => [newFlow, ...prev]);
    const entry: LocalActivity = {
      id: `a-${generateId()}`,
      flowId: newFlow.id,
      flowName: newFlow.name,
      status: 'success',
      timestamp: new Date().toISOString(),
      durationMs: Math.floor(Math.random() * 2000) + 500,
    };
    setActivity((prev) => [entry, ...prev].slice(0, 100));
    return newFlow;
  }, []);

  const toggleFlow = useCallback((id: string) => {
    setFlows((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status: f.status === 'on' ? 'off' : 'on' } : f,
      ),
    );
  }, []);

  const deleteFlow = useCallback((id: string) => {
    setFlows((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const templateFor = useCallback(
    (flow: Flow) => TEMPLATES.find((t) => t.id === flow.templateId),
    [],
  );

  const value = useMemo(
    () => ({ flows, activity, isLoaded, createFlow, toggleFlow, deleteFlow, templateFor }),
    [flows, activity, isLoaded, createFlow, toggleFlow, deleteFlow, templateFor],
  );

  return <FlowsContext.Provider value={value}>{children}</FlowsContext.Provider>;
}

export function useFlows(): FlowsContextValue {
  const ctx = useContext(FlowsContext);
  if (!ctx) throw new Error('useFlows must be used within FlowsProvider');
  return ctx;
}
