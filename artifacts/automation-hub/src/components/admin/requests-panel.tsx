import { useEffect, useState, useCallback } from 'react';
import { Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminFetch, type TemplateRequest } from '@/lib/admin-api';

const STATUSES = ['new', 'reviewed', 'planned', 'done'] as const;

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-primary/10 text-primary',
  reviewed: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  planned: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  done: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

export function formatDate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function RequestsPanel({ token, onAuthError }: { token: string; onAuthError: () => void }) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<TemplateRequest[] | null>(null);

  const load = useCallback(async () => {
    try {
      setRequests(await adminFetch<TemplateRequest[]>('/template-requests', token));
    } catch {
      onAuthError();
    }
  }, [token, onAuthError]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    const prev = requests;
    setRequests((rs) => (rs ?? []).map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      await adminFetch(`/template-requests/${id}`, token, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch {
      setRequests(prev);
      toast({ title: 'Could not update status', description: 'Please try again.', variant: 'destructive' });
    }
  };

  if (requests === null) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="py-12 text-center text-muted-foreground">
          No template requests yet. When users submit ideas from the gallery, they'll show up here.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((r) => (
        <Card key={r.id} className="rounded-2xl">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold text-lg">{r.title}</h2>
                  <Badge className={`${STATUS_STYLES[r.status] ?? ''} border-0 capitalize`} variant="outline">
                    {r.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{formatDate(r.created_at)}</p>
              </div>
              <Select value={r.status} onValueChange={(v) => void updateStatus(r.id, v)}>
                <SelectTrigger className="w-[140px] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {r.tools && (
              <p className="text-sm flex items-center gap-2 text-muted-foreground">
                <Wrench className="h-4 w-4 shrink-0" />
                {r.tools}
              </p>
            )}
            <p className="text-[15px] whitespace-pre-wrap">{r.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
