import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Search, ChevronDown, Check, Zap, Users, Play, Clock } from 'lucide-react';
import { MOCK_TEMPLATES, CATEGORIES, Template } from '@/lib/data';
import { ServiceIcon } from '@/components/icons/service-icons';
import { useFlowsContext } from '@/lib/flows-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type SortOption = 'Popularity' | 'Newest' | 'Name';

export default function Gallery() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('Popularity');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  const { createFlow } = useFlowsContext();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const filteredAndSorted = useMemo(() => {
    let result = MOCK_TEMPLATES;

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.services.some(s => s.toLowerCase().includes(q))
      );
    }

    // Filter by category
    if (activeCategory !== 'All') {
      result = result.filter((t) => t.categories.includes(activeCategory));
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'Popularity') return b.usageCount - a.usageCount;
      if (sortBy === 'Newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'Name') return a.name.localeCompare(b.name);
      return 0;
    });

    return result;
  }, [search, activeCategory, sortBy]);

  const handleCreateFlow = () => {
    if (!selectedTemplate) return;
    const flow = createFlow(selectedTemplate.id);
    setSelectedTemplate(null);
    toast({
      title: "Flow created!",
      description: `"${selectedTemplate.name}" has been added to your flows.`,
    });
    setLocation('/my-flows');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header Area */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="p-6 md:py-8 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
            <div className="space-y-1 max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Template Gallery</h1>
              <p className="text-muted-foreground text-lg">
                Discover and launch automations in seconds to connect your favorite tools.
              </p>
            </div>
            
            <div className="flex-shrink-0 w-full md:w-auto relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates, apps, or tasks..." 
                className="pl-10 h-12 w-full md:w-[320px] rounded-full bg-secondary/50 border-transparent focus-visible:bg-background transition-colors text-base"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <ScrollArea className="w-full whitespace-nowrap pb-3 -mb-3">
              <div className="flex w-max space-x-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all",
                      activeCategory === cat 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="hidden" />
            </ScrollArea>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0 h-10 rounded-full border-border bg-background">
                  Sort: {sortBy} <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px]">
                {(['Popularity', 'Newest', 'Name'] as SortOption[]).map((option) => (
                  <DropdownMenuItem 
                    key={option} 
                    onClick={() => setSortBy(option)}
                    className="flex items-center justify-between"
                  >
                    {option}
                    {sortBy === option && <Check className="h-4 w-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Grid Area */}
      <ScrollArea className="flex-1 bg-secondary/20">
        <div className="p-6 max-w-7xl mx-auto w-full">
          {filteredAndSorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-300">
              <div className="h-16 w-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No templates found</h3>
              <p className="text-muted-foreground max-w-md">
                We couldn't find any templates matching "{search}" in the {activeCategory} category. Try a different search term.
              </p>
              <Button 
                variant="outline" 
                className="mt-6 rounded-full"
                onClick={() => { setSearch(''); setActiveCategory('All'); }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSorted.map((template, i) => (
                <div 
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className="group relative flex flex-col bg-card rounded-2xl border border-card-border p-5 hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex -space-x-2">
                      {template.services.map((serviceId, index) => (
                        <div 
                          key={`${template.id}-${serviceId}-${index}`} 
                          className="h-10 w-10 rounded-full bg-white border border-border shadow-sm flex items-center justify-center relative z-10 transition-transform group-hover:-translate-y-1"
                          style={{ zIndex: 10 - index, transitionDelay: `${index * 50}ms` }}
                        >
                          <ServiceIcon serviceId={serviceId} className="h-5 w-5" />
                        </div>
                      ))}
                    </div>
                    <Badge variant="secondary" className="bg-secondary/50 font-normal border-0 text-xs gap-1.5 px-2.5 py-1">
                      {template.type === 'Automated' && <Zap className="h-3 w-3 text-primary" />}
                      {template.type === 'Scheduled' && <Clock className="h-3 w-3 text-amber-500" />}
                      {template.type === 'Instant' && <Play className="h-3 w-3 text-green-500" />}
                      {template.type}
                    </Badge>
                  </div>
                  
                  <div className="flex-1 mb-6">
                    <h3 className="font-semibold text-[15px] leading-tight mb-2 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
                    <span className="font-medium text-foreground/70 truncate mr-2">By {template.author}</span>
                    <div className="flex items-center gap-1.5 shrink-0 bg-secondary/50 px-2 py-1 rounded-md">
                      <Users className="h-3.5 w-3.5" />
                      <span>{(template.usageCount / 1000).toFixed(1)}k</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Template Detail Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        {selectedTemplate && (
          <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0 rounded-3xl">
            <div className="bg-primary/5 p-8 border-b relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                <ServiceIcon serviceId={selectedTemplate.services[0]} className="w-64 h-64" />
              </div>
              <div className="relative z-10">
                <div className="flex gap-3 mb-6">
                  {selectedTemplate.services.map((serviceId, i) => (
                    <div key={i} className="h-14 w-14 rounded-2xl bg-white shadow-sm border flex items-center justify-center">
                      <ServiceIcon serviceId={serviceId} className="h-7 w-7" />
                    </div>
                  ))}
                </div>
                <DialogTitle className="text-2xl font-bold mb-2 leading-tight">
                  {selectedTemplate.name}
                </DialogTitle>
                <DialogDescription className="text-base text-muted-foreground">
                  {selectedTemplate.description}
                </DialogDescription>
              </div>
            </div>
            
            <div className="p-8">
              <div className="flex items-center gap-6 mb-8 text-sm border-b pb-6">
                <div>
                  <span className="text-muted-foreground block mb-1">Type</span>
                  <span className="font-medium flex items-center gap-1.5">
                    {selectedTemplate.type === 'Automated' && <Zap className="h-4 w-4 text-primary" />}
                    {selectedTemplate.type === 'Scheduled' && <Clock className="h-4 w-4 text-amber-500" />}
                    {selectedTemplate.type === 'Instant' && <Play className="h-4 w-4 text-green-500" />}
                    {selectedTemplate.type}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Author</span>
                  <span className="font-medium">{selectedTemplate.author}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Usage</span>
                  <span className="font-medium">{(selectedTemplate.usageCount / 1000).toFixed(1)}k runs</span>
                </div>
              </div>

              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Automation Steps</h4>
              <div className="space-y-4">
                {selectedTemplate.steps.map((step, index) => (
                  <div key={index} className="flex gap-4 relative">
                    {index !== selectedTemplate.steps.length - 1 && (
                      <div className="absolute left-5 top-10 bottom-[-16px] w-[2px] bg-border" />
                    )}
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border/50 z-10">
                      <ServiceIcon serviceId={step.serviceId} className="h-5 w-5" />
                    </div>
                    <div className="pt-2 pb-2">
                      <p className="font-medium text-sm leading-none mb-1">{step.title}</p>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="p-6 pt-0 sm:justify-between border-t bg-secondary/10 mt-4">
              <Button variant="ghost" onClick={() => setSelectedTemplate(null)} className="rounded-full">
                Cancel
              </Button>
              <Button onClick={handleCreateFlow} size="lg" className="rounded-full px-8 font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all">
                Use this template
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
