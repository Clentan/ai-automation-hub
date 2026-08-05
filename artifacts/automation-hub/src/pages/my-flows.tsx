import { useState } from 'react';
import { useLocation } from 'wouter';
import { Play, MoreVertical, Pencil, Trash2, Zap, Clock, CalendarDays, Activity } from 'lucide-react';
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
    toast({ variant: "destructive", description: "Flow deleted" });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="border-b bg-background sticky top-0 z-10 px-6 py-8">
        <div className="max-w-5xl mx-auto w-full">
          <h1 className="text-3xl font-bold tracking-tight mb-2">My flows</h1>
          <p className="text-muted-foreground">Manage and monitor your active automations.</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-secondary/10">
        <div className="p-6 max-w-5xl mx-auto w-full space-y-4">
          {flows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed rounded-3xl bg-background">
              <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Zap className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">No flows yet</h3>
              <p className="text-muted-foreground max-w-md mb-8">
                You haven't created any automations yet. Head over to the gallery to find a template and get started.
              </p>
              <Button onClick={() => setLocation('/')} size="lg" className="rounded-full shadow-md">
                Browse Templates
              </Button>
            </div>
          ) : (
            flows.map((flow, i) => (
              <div 
                key={flow.id} 
                className="group flex flex-col md:flex-row md:items-center justify-between gap-6 p-5 bg-card border border-border rounded-2xl shadow-sm hover:border-primary/30 transition-colors animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
              >
                <div className="flex items-start md:items-center gap-4">
                  <div className="flex -space-x-2 shrink-0">
                    {flow.template.services.slice(0, 3).map((serviceId, index) => (
                      <div 
                        key={index} 
                        className="h-12 w-12 rounded-full bg-white border-2 border-card shadow-sm flex items-center justify-center relative z-10"
                        style={{ zIndex: 10 - index }}
                      >
                        <ServiceIcon serviceId={serviceId} className="h-6 w-6" />
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg leading-tight mb-1 text-foreground">{flow.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        {flow.template.type === 'Automated' && <Zap className="h-3.5 w-3.5" />}
                        {flow.template.type === 'Scheduled' && <Clock className="h-3.5 w-3.5" />}
                        {flow.template.type === 'Instant' && <Play className="h-3.5 w-3.5" />}
                        {flow.template.type}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5" />
                        {flow.runCount > 0 ? `${flow.runCount} runs` : 'Never run'}
                      </span>
                      {flow.lastRun && (
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Last run {formatDistanceToNow(new Date(flow.lastRun), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 shrink-0 pl-16 md:pl-0 border-t md:border-0 pt-4 md:pt-0">
                  <Badge variant={flow.status === 'on' ? 'default' : 'secondary'} className={flow.status === 'on' ? 'bg-green-500 hover:bg-green-600' : ''}>
                    {flow.status === 'on' ? 'Active' : 'Paused'}
                  </Badge>
                  
                  <Switch 
                    checked={flow.status === 'on'} 
                    onCheckedChange={() => {
                      toggleFlow(flow.id);
                      toast({ description: `Flow ${flow.status === 'on' ? 'paused' : 'activated'}` });
                    }} 
                  />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setRenameId(flow.id);
                        setNewName(flow.name);
                      }}>
                        <Pencil className="h-4 w-4 mr-2" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(flow.id)} className="text-destructive focus:text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
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
        <DialogContent className="sm:max-w-[425px] rounded-3xl">
          <DialogHeader>
            <DialogTitle>Rename flow</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)} 
              placeholder="Flow name"
              autoFocus
              className="rounded-xl"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameId(null)} className="rounded-full">Cancel</Button>
            <Button onClick={handleRename} className="rounded-full">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
