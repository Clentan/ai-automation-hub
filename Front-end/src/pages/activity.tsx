import { useFlowsContext } from '@/lib/flows-context';
import { formatDistanceToNow } from 'date-fns';
import { Activity, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function ActivityLog() {
  const { activity } = useFlowsContext();
  const [, setLocation] = useLocation();

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="bg-background sticky top-0 z-10 px-6 py-5 [@media(min-height:820px)]:py-8 md:[@media(min-height:820px)]:py-10">
        <div className="max-w-7xl 2xl:max-w-[1500px] mx-auto w-full flex items-start gap-4">
          <div className="bg-primary/10 text-primary p-3 rounded-2xl shrink-0">
            <Activity className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl [@media(min-height:820px)]:md:text-4xl font-bold tracking-tight mb-2 text-foreground">Run Activity</h1>
            <p className="text-muted-foreground text-lg">Monitor the execution history of your automated flows.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-secondary/10">
        <div className="p-6 md:p-8 max-w-7xl 2xl:max-w-[1500px] mx-auto w-full pb-10 [@media(min-height:820px)]:pb-20">
          {activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border/60 rounded-3xl bg-card shadow-sm animate-in fade-in duration-500">
              <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Activity className="h-10 w-10 text-primary/70" />
              </div>
              <h3 className="text-2xl font-bold mb-3">No activity yet</h3>
              <p className="text-muted-foreground max-w-sm mb-8 text-lg">
                When your flows run, their execution history will appear here. Turn on a flow to get started.
              </p>
              <Button onClick={() => setLocation('/templates')} className="rounded-full shadow-md px-8 gap-2">
                <Zap className="h-4 w-4" /> Go to Gallery
              </Button>
            </div>
          ) : (
            <div className="space-y-5 relative">
              <div className="absolute left-6 top-8 bottom-8 w-px bg-border/80 hidden md:block" />
              
              {activity.map((log, i) => (
                <div 
                  key={log.id}
                  className="flex gap-6 relative animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
                >
                  <div className="hidden md:flex shrink-0 w-12 items-center justify-center pt-3 z-10">
                    <div className="h-5 w-5 rounded-full bg-card border-2 border-border shadow-sm flex items-center justify-center">
                      <div className={`h-2.5 w-2.5 rounded-full ${log.status === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_theme(colors.emerald.500)]' : 'bg-red-500 shadow-[0_0_8px_theme(colors.red.500)]'}`} />
                    </div>
                  </div>
                  
                  <div className="flex-1 bg-card border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-5 group">
                    <div>
                      <div className="flex items-center gap-2.5 mb-2">
                        {log.status === 'success' ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{log.flowName}</span>
                      </div>
                      <div className="text-sm font-medium text-muted-foreground flex items-center gap-4 pl-7.5">
                        <span>{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {log.durationMs}ms
                        </span>
                      </div>
                    </div>
                    
                    <div className="shrink-0 text-sm">
                      {log.status === 'success' ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/20">Succeeded</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 font-semibold bg-red-500/10 px-3 py-1.5 rounded-md border border-red-500/20">Failed</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
