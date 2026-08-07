import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { KeyRound, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminFetch, AdminAuthError, type AdminUserRow } from '@/lib/admin-api';

function formatWhen(value: string | number | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function UsersPanel({ token, onAuthError }: { token: string | null; onAuthError: () => void }) {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUserRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      setUsers(await adminFetch<AdminUserRow[]>('/admin/users', token));
    } catch (e) {
      if (e instanceof AdminAuthError) {
        onAuthError();
      } else {
        // Transient failure (e.g. the sign-in service is unreachable) — show
        // an error instead of pretending there are no users.
        setUsers(null);
        setLoadError(e instanceof Error && e.message ? e.message : 'Could not load users. Try again.');
      }
    }
  }, [token, onAuthError]);

  useEffect(() => {
    void load();
  }, [load]);

  const revoke = async (userId: string, templateId: string, label: string) => {
    const id = `${userId}:${templateId}`;
    const confirmed = window.confirm(
      `Revoke the ${templateId} API key for ${label}?\n\nTheir integrations using this key will stop working immediately. This cannot be undone (they can request a new key themselves).`,
    );
    if (!confirmed) return;
    setRevoking(id);
    try {
      await adminFetch(`/admin/users/${encodeURIComponent(userId)}/keys/${encodeURIComponent(templateId)}`, token, {
        method: 'DELETE',
      });
      toast({ title: 'Key revoked', description: `${label} can no longer use ${templateId}.` });
      await load();
    } catch {
      toast({ title: 'Could not revoke key', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setRevoking(null);
    }
  };

  if (loadError) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="py-12 text-center space-y-4">
          <p className="text-muted-foreground">{loadError}</p>
          <Button variant="outline" className="rounded-full" onClick={() => void load()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (users === null) {
    return <Skeleton className="h-64 rounded-2xl" />;
  }

  if (users.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="py-12 text-center text-muted-foreground">
          No registered users yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Signed up</TableHead>
              <TableHead>Last sign-in</TableHead>
              <TableHead>Runs</TableHead>
              <TableHead>API keys</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const label = u.email ?? u.name ?? u.id;
              return (
                <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                  <TableCell>
                    <div className="font-medium">{u.name ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">{u.email ?? 'account deleted'}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatWhen(u.createdAt)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatWhen(u.lastSignInAt)}</TableCell>
                  <TableCell>{u.runsTotal}</TableCell>
                  <TableCell>
                    {u.keys.length === 0 ? (
                      <span className="text-xs text-muted-foreground">none</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {u.keys.map((k) => {
                          const id = `${u.id}:${k.templateId}`;
                          return (
                            <Badge
                              key={id}
                              variant="secondary"
                              className="gap-1.5 rounded-full pl-2 pr-1 py-1 font-normal"
                            >
                              <KeyRound className="h-3 w-3" />
                              <span className="font-mono text-xs">{k.templateId}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                title={`Revoke ${k.templateId} key`}
                                disabled={revoking === id}
                                onClick={() => revoke(u.id, k.templateId, label)}
                                data-testid={`button-revoke-${id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground mt-4">
          Revoking a key immediately stops that user's API access for the template — they can request
          a new key themselves if needed.
        </p>
      </CardContent>
    </Card>
  );
}
