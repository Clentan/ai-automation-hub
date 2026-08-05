import { useState } from 'react';
import { useLocation } from 'wouter';
import { Play, MoreVertical, Pencil, Trash2, Zap, Clock, CalendarDays, Activity, CheckSquare } from 'lucide-react';
import { useFlowsContext } from '@/lib/flows-context';
import { ServiceIcon } from '@/components/icons/service-icons';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export default function MyFlows() {
  const { flows, toggleFlow, deleteFlow, renameFlow } = useFlowsContext();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [renameId, setRenameId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const handleRename = () => {
    if (renameId && newName.trim()) {
      renameFlow(renameId, newName.trim());
      setRenameId(null);
      toast({ description: "Flow renamed successfully" });
    }
  };

  const handleDelete = (id: string) => {
    deleteFlow(id);
    toast({ variant: "destructive", description: "Flow deleted from your workspace" });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="border-b border-border/60 bg-background sticky top-0 z-10 px-6 py-8 md:py-10">
        <div className="max-w-5xl mx-auto w-full flex items-start gap-4">
          <div className="bg-primary/10 text-primary p-3 rounded-2xl shrink-0">
            <CheckSquare className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-foreground">My Active Flows</h1>
            <p className="text-muted-foreground text-lg">Manage and monitor the automations running in your workspace.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-secondary/10">
        <div className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-4 pb-20">
          {flows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border/60 rounded-3xl bg-card shadow-sm animate-in fade-in duration-500">
              <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Zap className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">No active flows yet</h3>
              <p className="text-muted-foreground max-w-md mb-8 text-lg">
                You haven't activated any automations yet. Head over to the gallery to find a template and get started.
              </p>
              <Button onClick={() => setLocation('/templates')} size="lg" className="rounded-full shadow-md px-8 gap-2">
                <Zap className="h-4 w-4" /> Browse Templates
              </Button>
            </div>
          ) : (
            flows.map((flow, i) => (
              <div 
                key={flow.id} 
                className="group flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-card border border-border/60 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
              >
                <div className="flex items-start md:items-center gap-5">
                  <div className="flex -space-x-3 shrink-0">
                    {flow.template.services.slice(0, 3).map((serviceId, index) => (
                      <div 
                        key={index} 
                        className="h-14 w-14 rounded-full bg-white border-4 border-card shadow-sm flex items-center justify-center relative z-10 transition-transform group-hover:scale-105"
                        style={{ zIndex: 10 - index }}
                      >
                        <ServiceIcon serviceId={serviceId} className="h-7 w-7" />
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-1 md:pt-0">
                    <h3 className="font-bold text-lg md:text-xl leading-tight mb-2 text-foreground group-hover:text-primary transition-colors">{flow.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-muted-foreground">
                      <span className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md">
                        {flow.template.type === 'Automated' && <Zap className="h-3.5 w-3.5 text-primary" />}
                        {flow.template.type === 'Scheduled' && <Clock className="h-3.5 w-3.5 text-amber-500" />}
                        {flow.template.type === 'Instant' && <Play className="h-3.5 w-3.5 text-green-500" />}
                        {flow.template.type}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Activity className="h-4 w-4" />
                        {flow.runCount > 0 ? `${flow.runCount} total runs` : 'Never run'}
                      </span>
                      {flow.lastRun && (
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-4 w-4" />
                          Last run {formatDistanceToNow(new Date(flow.lastRun), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-5 shrink-0 pl-16 md:pl-0 border-t border-border/50 md:border-0 pt-5 md:pt-0">
                  <div className="flex items-center gap-3 bg-secondary/30 px-4 py-2 rounded-full border border-border/50">
                    <Badge variant={flow.status === 'on' ? 'default' : 'secondary'} className={flow.status === 'on' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : ''}>
                      {flow.status === 'on' ? 'Active' : 'Paused'}
                    </Badge>
                    <Switch 
                      checked={flow.status === 'on'} 
                      onCheckedChange={() => {
                        toggleFlow(flow.id);
                        toast({ description: `Flow ${flow.status === 'on' ? 'paused' : 'activated'}` });
                      }} 
                    />
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary">
                        <MoreVertical className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-xl">
                      <DropdownMenuItem onClick={() => {
                        setRenameId(flow.id);
                        setNewName(flow.name);
                      }} className="cursor-pointer py-2.5">
                        <Pencil className="h-4 w-4 mr-2" /> Rename Flow
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(flow.id)} className="text-red-600 focus:text-red-600 cursor-pointer py-2.5">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete Flow
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={!!renameId} onOpenChange={(open) => !open && setRenameId(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl">Rename Flow</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)} 
              placeholder="E.g., Production Slack Alerts"
              autoFocus
              className="rounded-xl h-12 text-base shadow-sm focus-visible:ring-primary/20"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
              }}
            />
          </div>
          <DialogFooter className="mt-6 sm:justify-between">
            <Button variant="ghost" onClick={() => setRenameId(null)} className="rounded-full">Cancel</Button>
            <Button onClick={handleRename} className="rounded-full px-6 shadow-sm">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
