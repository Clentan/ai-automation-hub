import { useFlowsContext } from '@/lib/flows-context';
import { formatDistanceToNow } from 'date-fns';
import { Activity, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function ActivityLog() {
  const { activity } = useFlowsContext();
  const [, setLocation] = useLocation();

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="border-b bg-background sticky top-0 z-10 px-6 py-8">
        <div className="max-w-4xl mx-auto w-full">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Run Activity</h1>
          <p className="text-muted-foreground">Monitor the execution history of your automated flows.</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-secondary/10">
        <div className="p-6 max-w-4xl mx-auto w-full">
          {activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-16 w-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No activity yet</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                When your flows run, their execution history will appear here.
              </p>
              <Button onClick={() => setLocation('/')} variant="outline" className="rounded-full">
                Go to Gallery
              </Button>
            </div>
          ) : (
            <div className="space-y-4 relative">
              <div className="absolute left-6 top-8 bottom-8 w-px bg-border hidden md:block" />
              
              {activity.map((log, i) => (
                <div 
                  key={log.id}
                  className="flex gap-4 relative animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
                >
                  <div className="hidden md:flex shrink-0 w-12 items-center justify-center pt-1 z-10">
                    <div className="h-4 w-4 rounded-full bg-background border-2 border-border shadow-sm flex items-center justify-center">
                      <div className={`h-2 w-2 rounded-full ${log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                    </div>
                  </div>
                  
                  <div className="flex-1 bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        {log.status === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-medium text-foreground">{log.flowName}</span>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-3">
                        <span>{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {log.durationMs}ms
                        </span>
                      </div>
                    </div>
                    
                    <div className="shrink-0 text-sm">
                      {log.status === 'success' ? (
                        <span className="text-green-600 font-medium bg-green-500/10 px-2.5 py-1 rounded-md">Succeeded</span>
                      ) : (
                        <span className="text-red-600 font-medium bg-red-500/10 px-2.5 py-1 rounded-md">Failed</span>
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
