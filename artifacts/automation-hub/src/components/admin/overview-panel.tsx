import { useEffect, useState, useCallback } from 'react';
import { Activity, Inbox, KeyRound, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { adminFetch, AdminAuthError, type AdminStats } from '@/lib/admin-api';
import { formatDate } from './requests-panel';

function StatCard({ icon: Icon, label, value, sub }: { icon: typeof Users; label: string; value: number; sub?: string }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <span className="bg-primary/10 text-primary p-2.5 rounded-xl">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-bold leading-tight">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
        {sub && <p className="text-xs text-muted-foreground mt-3">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function breakdown(map: Record<string, number>): string {
  const entries = Object.entries(map);
  if (entries.length === 0) return 'none yet';
  return entries.map(([k, v]) => `${v} ${k}`).join(' · ');
}

export function OverviewPanel({ token, onAuthError }: { token: string | null; onAuthError: () => void }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setStats(await adminFetch<AdminStats>('/admin/stats', token));
    } catch (e) {
      if (e instanceof AdminAuthError) {
        onAuthError();
      } else {
        // Transient failure (network/server): show it instead of locking the user out.
        setLoadError(e instanceof Error ? e.message : 'Could not load the overview.');
      }
    }
  }, [token, onAuthError]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loadError) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="py-12 text-center">
          <p className="font-medium text-foreground mb-1">Couldn't load the overview</p>
          <p className="text-sm text-muted-foreground mb-4">{loadError}</p>
          <Button variant="outline" className="rounded-full" onClick={() => void load()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Users} label="Registered users" value={stats.registeredUsers ?? 0} />
        <StatCard icon={KeyRound} label="Clients with keys" value={stats.clients} />
        <StatCard
          icon={KeyRound}
          label="API keys issued"
          value={stats.keysIssued}
          sub={`${stats.templatesWithKeys} template${stats.templatesWithKeys === 1 ? '' : 's'} in use`}
        />
        <StatCard
          icon={Activity}
          label="Template runs"
          value={stats.runsTotal}
          sub={breakdown(stats.runsByStatus)}
        />
        <StatCard
          icon={Inbox}
          label="Template requests"
          value={stats.requestsTotal}
          sub={breakdown(stats.requestsByStatus)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Most-run templates</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.runsByTemplate).length === 0 ? (
              <p className="text-sm text-muted-foreground">No runs yet.</p>
            ) : (
              <ul className="space-y-2">
                {Object.entries(stats.runsByTemplate).map(([tpl, count]) => (
                  <li key={tpl} className="flex items-center justify-between text-sm">
                    <span className="font-mono">{tpl}</span>
                    <Badge variant="secondary" className="rounded-full">
                      {count} run{count === 1 ? '' : 's'}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Recent runs</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentRuns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No runs yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentRuns.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.template_id}</TableCell>
                      <TableCell className="capitalize">{r.status}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(r.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
