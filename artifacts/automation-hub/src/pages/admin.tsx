import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/react';
import { Link } from 'wouter';
import { KeyRound, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  adminFetch,
  clearAdminToken,
  getAdminToken,
  setAdminToken,
} from '@/lib/admin-api';
import { OverviewPanel } from '@/components/admin/overview-panel';
import { RequestsPanel } from '@/components/admin/requests-panel';
import { KeysPanel } from '@/components/admin/keys-panel';

export default function Admin({ initialTab = 'overview' }: { initialTab?: string }) {
  const { toast } = useToast();
  const { isLoaded, isSignedIn, user } = useUser();
  const [token, setToken] = useState<string | null>(() => getAdminToken());
  const [tokenInput, setTokenInput] = useState('');
  const [checking, setChecking] = useState(false);
  // null = still probing; true = the signed-in account has admin access
  const [sessionAdmin, setSessionAdmin] = useState<boolean | null>(null);

  // If the user is signed in, check whether their account email unlocks admin.
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setSessionAdmin(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await adminFetch('/admin/stats', null);
        if (!cancelled) setSessionAdmin(true);
      } catch {
        if (!cancelled) setSessionAdmin(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  const unlock = async () => {
    const tok = tokenInput.trim();
    if (!tok) return;
    setChecking(true);
    try {
      await adminFetch('/admin/stats', tok);
      setAdminToken(tok);
      setToken(tok);
      setTokenInput('');
    } catch {
      toast({
        title: 'Access denied',
        description: 'That admin token was not accepted.',
        variant: 'destructive',
      });
    } finally {
      setChecking(false);
    }
  };

  const handleAuthError = useCallback(() => {
    clearAdminToken();
    setToken(null);
  }, []);

  const unlocked = sessionAdmin === true || Boolean(token);
  const probing = !isLoaded || (isSignedIn && sessionAdmin === null && !token);

  if (probing) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center text-muted-foreground">
        Checking access…
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 space-y-4">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary p-2 rounded-xl">
                <ShieldCheck className="h-5 w-5" />
              </span>
              Owner access
            </CardTitle>
            <CardDescription>
              {isSignedIn
                ? `You're signed in as ${user?.primaryEmailAddress?.emailAddress ?? 'this account'}, but it doesn't have admin access.`
                : 'Sign in with the owner account to open the dashboard: usage metrics, template requests, and issued API keys.'}
            </CardDescription>
          </CardHeader>
          {!isSignedIn && (
            <CardContent>
              <Link href="/sign-in">
                <Button className="w-full rounded-full gap-2">
                  <LogIn className="h-4 w-4" /> Sign in
                </Button>
              </Link>
            </CardContent>
          )}
        </Card>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="bg-muted text-muted-foreground p-2 rounded-xl">
                <KeyRound className="h-4 w-4" />
              </span>
              Or use an admin token
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-token">Admin token</Label>
              <Input
                id="admin-token"
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void unlock();
                }}
                placeholder="Paste your ADMIN_TOKEN"
                className="rounded-xl"
              />
            </div>
            <Button
              className="w-full rounded-full"
              disabled={!tokenInput.trim() || checking}
              onClick={() => void unlock()}
            >
              {checking ? 'Checking…' : 'Unlock dashboard'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" /> Owner dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Usage metrics, user template requests, and issued API keys.
          </p>
        </div>
        {token && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full gap-2"
            onClick={handleAuthError}
          >
            <LogOut className="h-4 w-4" /> Lock
          </Button>
        )}
      </div>

      <Tabs defaultValue={initialTab}>
        <TabsList className="rounded-full">
          <TabsTrigger value="overview" className="rounded-full">Overview</TabsTrigger>
          <TabsTrigger value="requests" className="rounded-full">Requests</TabsTrigger>
          <TabsTrigger value="keys" className="rounded-full">API keys</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <OverviewPanel token={token} onAuthError={handleAuthError} />
        </TabsContent>
        <TabsContent value="requests" className="mt-6">
          <RequestsPanel token={token} onAuthError={handleAuthError} />
        </TabsContent>
        <TabsContent value="keys" className="mt-6">
          <KeysPanel token={token} onAuthError={handleAuthError} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
