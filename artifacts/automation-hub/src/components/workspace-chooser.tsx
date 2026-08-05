import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useUser } from '@clerk/react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShieldCheck, User } from 'lucide-react';
import { adminFetch, AdminAuthError } from '@/lib/admin-api';

const SHOWN_FLAG = 'aah-workspace-chooser-shown';

function isAuthRoute(path: string) {
  return path.startsWith('/sign-in') || path.startsWith('/sign-up');
}

/**
 * After an admin account signs in, ask once (per tab session) whether they
 * want the user side or the admin dashboard. Non-admin accounts never see it.
 */
export function WorkspaceChooser() {
  const { user, isLoaded } = useUser();
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    // Wait until the user has left Clerk's sign-in/sign-up screens.
    if (isAuthRoute(location)) return;
    const flag = `${SHOWN_FLAG}:${user.id}`;
    if (sessionStorage.getItem(flag)) return;
    if (location.startsWith('/admin')) {
      // Already on the admin side — no need to ask.
      sessionStorage.setItem(flag, '1');
      return;
    }
    let cancelled = false;
    // Probe an admin endpoint with the session cookie; 404 (AdminAuthError) = not admin.
    adminFetch('/admin/stats', null)
      .then(() => {
        if (cancelled) return;
        sessionStorage.setItem(flag, '1');
        setOpen(true);
      })
      .catch((err) => {
        // Only a definitive denial marks the account as non-admin;
        // transient errors leave the flag unset so we can retry later.
        if (!cancelled && err instanceof AdminAuthError) sessionStorage.setItem(flag, '1');
      });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user?.id, location]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const choose = (dest: 'user' | 'admin') => {
    setOpen(false);
    setLocation(dest === 'admin' ? '/admin' : '/');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-workspace-chooser">
        <DialogHeader>
          <DialogTitle>Welcome back</DialogTitle>
          <DialogDescription>Your account has owner access. Where would you like to go?</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => choose('user')}
            data-testid="button-choose-user"
            className="flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
          >
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div className="font-semibold">User side</div>
            <div className="text-sm text-muted-foreground">Browse templates, manage your flows and API keys.</div>
          </button>
          <button
            type="button"
            onClick={() => choose('admin')}
            data-testid="button-choose-admin"
            className="flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
          >
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="font-semibold">Admin side</div>
            <div className="text-sm text-muted-foreground">Usage metrics, template requests, and issued keys.</div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
