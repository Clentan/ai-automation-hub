import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import { adminFetch, AdminAuthError, type AdminKeyRow } from '@/lib/admin-api';
import { formatDate } from './requests-panel';

export function KeysPanel({ token, onAuthError }: { token: string | null; onAuthError: () => void }) {
  const [keys, setKeys] = useState<AdminKeyRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setKeys(await adminFetch<AdminKeyRow[]>('/admin/keys', token));
    } catch (e) {
      if (e instanceof AdminAuthError) {
        onAuthError();
      } else {
        setLoadError(e instanceof Error ? e.message : 'Could not load API keys.');
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
          <p className="font-medium text-foreground mb-1">Couldn't load API keys</p>
          <p className="text-sm text-muted-foreground mb-4">{loadError}</p>
          <Button variant="outline" className="rounded-full" onClick={() => void load()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (keys === null) {
    return <Skeleton className="h-64 rounded-2xl" />;
  }

  if (keys.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="py-12 text-center text-muted-foreground">
          No API keys issued yet.
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
              <TableHead>Client</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Issued</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((k) => (
              <TableRow key={`${k.clientId}-${k.templateId}`}>
                <TableCell className="font-mono text-xs">{k.clientId}</TableCell>
                <TableCell className="font-mono text-xs">{k.templateId}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">…{k.keySuffix}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(k.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground mt-4">
          Full key values are never shown here — only the last 6 characters, for identification.
        </p>
      </CardContent>
    </Card>
  );
}
