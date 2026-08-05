import { Link, useLocation } from 'wouter';
import { LayoutGrid, CheckSquare, Zap, Activity, Home, Search, BookOpen, User, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/', label: 'Templates', icon: LayoutGrid },
  { href: '/my-flows', label: 'My flows', icon: CheckSquare },
  { href: '/activity', label: 'Activity', icon: Activity },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="flex h-full w-[240px] flex-col border-r bg-sidebar">
      <div className="p-4 md:p-6 flex items-center gap-3">
        <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
          <Zap className="h-5 w-5" />
        </div>
        <span className="font-semibold text-lg tracking-tight">AI Automation Hub</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                  isActive 
                    ? "bg-sidebar-primary/10 text-sidebar-primary" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50")} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-sidebar-foreground/70 cursor-pointer hover:bg-sidebar-accent rounded-md">
          <BookOpen className="h-4 w-4 text-sidebar-foreground/50" />
          Documentation
        </div>
      </div>
    </div>
  );
}

export function MobileNav() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[240px] p-0 flex flex-col">
        <div className="p-4 md:p-6 flex items-center gap-3 border-b">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
            <Zap className="h-5 w-5" />
          </div>
          <span className="font-semibold text-lg tracking-tight">AI Automation Hub</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                    isActive 
                      ? "bg-sidebar-primary/10 text-sidebar-primary" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50")} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
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
