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
import { adminFetch, type AdminKeyRow } from '@/lib/admin-api';
import { formatDate } from './requests-panel';

export function KeysPanel({ token, onAuthError }: { token: string | null; onAuthError: () => void }) {
  const [keys, setKeys] = useState<AdminKeyRow[] | null>(null);

  const load = useCallback(async () => {
    try {
      setKeys(await adminFetch<AdminKeyRow[]>('/admin/keys', token));
    } catch {
      onAuthError();
    }
  }, [token, onAuthError]);

  useEffect(() => {
    void load();
  }, [load]);

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
