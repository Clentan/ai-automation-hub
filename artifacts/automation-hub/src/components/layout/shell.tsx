import { Link, useLocation } from 'wouter';
import { LayoutGrid, CheckSquare, Zap, Activity, Home, BookOpen, Menu, Settings as SettingsIcon, LogIn, LogOut, KeyRound, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useClerk } from '@clerk/react';
import { useEffect, useState } from 'react';
import { probeAdminAccess, clearAdminProbe } from '@/lib/admin-api';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/templates', label: 'Templates', icon: LayoutGrid },
  { href: '/my-flows', label: 'My flows', icon: CheckSquare },
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/api-access', label: 'API access', icon: KeyRound },
  { href: '/learn', label: 'Learn', icon: BookOpen },
];

const ADMIN_NAV_ITEM = { href: '/admin', label: 'Admin', icon: ShieldCheck };

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

// Hidden by default; the link only appears after the admin probe returns 200,
// so non-owners never see a flicker of the Admin item. The probe is cached
// per account, so signing in re-checks even if an anonymous visit happened first.
export function useIsAdmin(): boolean {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? null;
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    if (isLoaded && userId) {
      probeAdminAccess(userId).then((result) => {
        if (active) setIsAdmin(result);
      });
    } else {
      setIsAdmin(false);
    }
    return () => {
      active = false;
    };
  }, [isLoaded, userId]);

  return isAdmin;
}

function useNavItems() {
  const isAdmin = useIsAdmin();
  return isAdmin ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;
}

function useAccount() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const name = user?.fullName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || '';
  const email = user?.primaryEmailAddress?.emailAddress || '';
  const initials =
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'AA';
  return {
    isLoaded,
    signedIn: !!user,
    name,
    email,
    initials,
    imageUrl: user?.imageUrl,
    signOut: () => {
      clearAdminProbe();
      return signOut({ redirectUrl: basePath || '/' });
    },
  };
}

function AccountFooter({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const account = useAccount();

  if (!account.isLoaded) return <div className="h-12" />;

  if (!account.signedIn) {
    return (
      <Link href="/sign-in">
        <Button
          onClick={onNavigate}
          className={cn('w-full gap-2 rounded-full shadow-sm', collapsed && 'px-0')}
          title="Sign in"
        >
          <LogIn className="h-4 w-4 shrink-0" />
          {!collapsed && 'Sign in'}
        </Button>
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      <Link href="/settings">
        <div
          onClick={onNavigate}
          title={collapsed ? 'Settings' : undefined}
          className={cn(
            'flex items-center rounded-lg cursor-pointer hover:bg-sidebar-accent transition-all duration-300',
            collapsed ? 'justify-center py-2' : 'px-3 py-2 -mx-3',
          )}
        >
          <Avatar className="h-8 w-8 border border-border shrink-0">
            {account.imageUrl && <AvatarImage src={account.imageUrl} alt={account.name} />}
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{account.initials}</AvatarFallback>
          </Avatar>
          <div
            className={cn(
              'flex flex-1 items-center gap-3 overflow-hidden transition-all duration-300 ease-in-out min-w-0',
              collapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[180px] opacity-100 ml-3',
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{account.name}</div>
              <div className="text-xs text-muted-foreground truncate">{account.email}</div>
            </div>
            <SettingsIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => account.signOut()}
        title="Sign out"
        className={cn(
          'flex w-full items-center rounded-lg py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors cursor-pointer',
          collapsed ? 'justify-center px-0' : 'px-3 -mx-3 gap-3',
        )}
      >
        <LogOut className="h-4 w-4 shrink-0 text-sidebar-foreground/50" />
        {!collapsed && 'Sign out'}
      </button>
    </div>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const navItems = useNavItems();

  return (
    <div className={cn(
      "flex h-full flex-col border-r bg-sidebar transition-all duration-300",
      collapsed ? "w-[68px]" : "w-[240px]"
    )}>
      <div className={cn("flex items-center p-3 transition-all duration-300", collapsed ? "px-3.5 py-4" : "md:py-5")}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed((c) => !c)}
          className="shrink-0 text-sidebar-foreground/70 hover:text-sidebar-foreground"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className={cn(
          "flex items-center gap-2 overflow-hidden transition-all duration-300 ease-in-out",
          collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-[180px] opacity-100 ml-2"
        )}>
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md shadow-sm shrink-0">
            <Zap className="h-5 w-5" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight leading-tight whitespace-nowrap">AI Automation Hub</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 px-3 py-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-300 cursor-pointer",
                  collapsed ? "justify-center px-0" : "px-3",
                  isActive 
                    ? "bg-primary/10 text-primary shadow-sm" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-sidebar-foreground/50")} />
                <span className={cn(
                  "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
                  collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-[160px] opacity-100 ml-3"
                )}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className={cn("border-t border-sidebar-border/50 transition-all duration-300", collapsed ? "p-2" : "p-4")}>
        <AccountFooter collapsed={collapsed} />
      </div>
    </div>
  );
}

export function MobileNav() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const navItems = useNavItems();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
        <div className="p-4 md:p-6 flex items-center gap-3 border-b">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md shadow-sm">
            <Zap className="h-5 w-5" />
          </div>
          <span className="font-semibold text-lg tracking-tight">AI Automation Hub</span>
        </div>
        <nav className="flex-1 space-y-1.5 px-3 py-4">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer",
                    isActive 
                      ? "bg-primary/10 text-primary shadow-sm" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-sidebar-foreground/50")} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-sidebar-border/50">
          <AccountFooter onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col md:flex-row bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block shrink-0 h-[100dvh] sticky top-0">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header (Visible on Mobile) */}
        <header className="md:hidden sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4">
          <MobileNav />
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1 rounded-md">
              <Zap className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">AI Automation Hub</span>
          </div>
        </header>
        
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
