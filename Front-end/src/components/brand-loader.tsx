import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Branded loader: the AI Automation Hub logo mark with pulsing rings. */
export function BrandLoader({ className }: { className?: string }) {
  return (
    <div className={cn('relative flex items-center justify-center h-12 w-12 shrink-0', className)}>
      {/* expanding ping ring */}
      <span className="absolute inset-0 rounded-xl bg-primary/30 animate-ping" style={{ animationDuration: '1.6s' }} />
      {/* soft glow */}
      <span className="absolute -inset-1.5 rounded-2xl bg-primary/10 animate-pulse" />
      {/* logo mark */}
      <div className="relative bg-primary text-primary-foreground p-2.5 rounded-xl shadow-md">
        <Zap className="h-5 w-5 animate-pulse" style={{ animationDuration: '1s' }} />
      </div>
    </div>
  );
}

/** Full-screen branded transition shown while "opening" an automation. */
export function BrandLoadingOverlay({ label }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center gap-6 animate-in fade-in duration-300">
      <BrandLoader className="h-16 w-16" />
      <div className="text-center">
        <p className="font-bold text-lg text-foreground tracking-tight">AI Automation Hub</p>
        <p className="text-sm text-muted-foreground mt-1">{label ?? 'Preparing your automation…'}</p>
      </div>
      <div className="w-48 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className="h-full w-full rounded-full bg-primary origin-left animate-[brand-progress_5s_ease-in-out_forwards]" />
      </div>
    </div>
  );
}
