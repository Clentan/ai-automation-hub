import { useState, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { Search, ChevronDown, Check, Zap, Users, Play, Clock, ArrowRight, KeyRound, Lightbulb } from 'lucide-react';
import { MOCK_TEMPLATES, CATEGORIES, isComingSoon, Template } from '@/lib/data';
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
import { RequestTemplateDialog } from '@/components/request-template-dialog';

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
      title: "Flow created successfully!",
      description: `"${selectedTemplate.name}" has been added to your workspace.`,
    });
    setLocation('/my-flows');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Header Area */}
      <div className="border-b border-border/60 bg-background sticky top-0 z-10">
        <div className="p-6 md:py-10 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="space-y-2 max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Template Gallery</h1>
              <p className="text-muted-foreground text-lg">
                Discover and launch proven automations in seconds.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto md:items-center">
              <div className="flex-shrink-0 w-full sm:w-auto relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search templates, apps, or tasks..." 
                  className="pl-12 h-12 w-full sm:w-[320px] rounded-full bg-secondary/30 border-transparent focus-visible:bg-background focus-visible:border-primary/30 transition-all text-base shadow-sm hover:bg-secondary/50"
                />
              </div>
              <RequestTemplateDialog
                trigger={
                  <Button variant="outline" className="h-12 rounded-full px-5 gap-2 shadow-sm shrink-0">
                    <Lightbulb className="h-4 w-4 text-primary" /> Request a template
                  </Button>
                }
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <ScrollArea className="w-full whitespace-nowrap pb-3 -mb-3">
              <div className="flex w-max space-x-1.5 p-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                      activeCategory === cat 
                        ? "bg-primary text-primary-foreground shadow-md" 
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
                <Button variant="outline" className="shrink-0 h-10 rounded-full border-border bg-background shadow-sm px-4">
                  Sort: {sortBy} <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px] rounded-xl">
                {(['Popularity', 'Newest', 'Name'] as SortOption[]).map((option) => (
                  <DropdownMenuItem 
                    key={option} 
                    onClick={() => setSortBy(option)}
                    className="flex items-center justify-between rounded-lg cursor-pointer"
                  >
                    {option}
                    {sortBy === option && <Check className="h-4 w-4 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Grid Area */}
      <div className="flex-1 overflow-auto bg-secondary/10 relative">
        <div className="p-6 max-w-7xl mx-auto w-full pb-20">
          {filteredAndSorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-300">
              <div className="h-20 w-20 bg-card border shadow-sm rounded-3xl flex items-center justify-center mb-6">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">No templates found</h3>
              <p className="text-muted-foreground max-w-md">
                We couldn't find any templates matching "{search}" in the {activeCategory} category. Try a different search term.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button 
                  variant="outline" 
                  className="rounded-full px-6 shadow-sm"
                  onClick={() => { setSearch(''); setActiveCategory('All'); }}
                >
                  Clear filters
                </Button>
                <RequestTemplateDialog
                  trigger={
                    <Button className="rounded-full px-6 gap-2 shadow-sm">
                      <Lightbulb className="h-4 w-4" /> Request this as a template
                    </Button>
                  }
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSorted.map((template, i) => (
                <div 
                  key={template.id}
                  onClick={() => !isComingSoon(template) && setSelectedTemplate(template)}
                  className={cn(
                    "group relative flex flex-col bg-card rounded-2xl border border-border/60 p-5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4",
                    isComingSoon(template)
                      ? "opacity-60 grayscale cursor-not-allowed"
                      : "hover:shadow-lg hover:border-primary/30 cursor-pointer"
                  )}
                  style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
                  data-testid={`card-template-${template.id}`}
                >
                  {isComingSoon(template) && (
                    <Badge className="absolute -top-2.5 right-4 z-20 rounded-full bg-amber-500 hover:bg-amber-500 text-white border-0 shadow-sm px-3">
                      Coming soon
                    </Badge>
                  )}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex -space-x-2">
                      {template.services.map((serviceId, index) => (
                        <div 
                          key={`${template.id}-${serviceId}-${index}`} 
                          className="h-10 w-10 rounded-full bg-white border-2 border-card shadow-sm flex items-center justify-center relative z-10 transition-transform group-hover:-translate-y-1"
                          style={{ zIndex: 10 - index, transitionDelay: `${index * 40}ms` }}
                        >
                          <ServiceIcon serviceId={serviceId} className="h-5 w-5" />
                        </div>
                      ))}
                    </div>
                    <Badge variant="secondary" className="bg-secondary/60 font-medium border-0 text-[10px] uppercase tracking-wider gap-1 px-2.5 py-1">
                      {template.type === 'Automated' && <Zap className="h-3 w-3 text-primary" />}
                      {template.type === 'Scheduled' && <Clock className="h-3 w-3 text-amber-500" />}
                      {template.type === 'Instant' && <Play className="h-3 w-3 text-green-500" />}
                      {template.type}
                    </Badge>
                  </div>
                  
                  <div className="flex-1 mb-6">
                    <h3 className="font-semibold text-base leading-tight mb-2 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground pt-4 border-t border-border/50">
                    <span className="truncate mr-2 text-foreground/70">By {template.author}</span>
                    <div className="flex items-center gap-1.5 shrink-0 bg-secondary/50 px-2 py-1 rounded-md">
                      <Users className="h-3.5 w-3.5" />
                      <span>{(template.usageCount / 1000).toFixed(1)}k</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isComingSoon(template)}
                    className="mt-4 w-full rounded-full gap-2 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-colors font-semibold disabled:opacity-70"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isComingSoon(template)) setLocation(`/api-access?template=${template.id}`);
                    }}
                  >
                    {isComingSoon(template) ? (
                      <><Clock className="h-3.5 w-3.5" /> Coming soon</>
                    ) : (
                      <><KeyRound className="h-3.5 w-3.5" /> Request API key</>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Template Detail Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        {selectedTemplate && (
          <DialogContent className="sm:max-w-[640px] p-0 overflow-hidden gap-0 rounded-3xl border-border/50 shadow-2xl">
            <div className="bg-primary/5 p-8 md:p-10 border-b relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                <ServiceIcon serviceId={selectedTemplate.services[0]} className="w-64 h-64 grayscale" />
              </div>
              <div className="relative z-10">
                <div className="flex gap-3 mb-6">
                  {selectedTemplate.services.map((serviceId, i) => (
                    <div key={i} className="h-14 w-14 rounded-2xl bg-white shadow-sm border flex items-center justify-center">
                      <ServiceIcon serviceId={serviceId} className="h-7 w-7" />
                    </div>
                  ))}
                </div>
                <DialogTitle className="text-2xl md:text-3xl font-bold mb-3 leading-tight">
                  {selectedTemplate.name}
                </DialogTitle>
                <DialogDescription className="text-base md:text-lg text-muted-foreground/90 max-w-lg">
                  {selectedTemplate.description}
                </DialogDescription>
              </div>
            </div>
            
            <div className="p-8 md:p-10 bg-card max-h-[50vh] overflow-y-auto">
              <div className="flex flex-wrap items-center gap-6 mb-10 text-sm border-b pb-6">
                <div>
                  <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider font-medium">Type</span>
                  <span className="font-semibold flex items-center gap-1.5">
                    {selectedTemplate.type === 'Automated' && <Zap className="h-4 w-4 text-primary" />}
                    {selectedTemplate.type === 'Scheduled' && <Clock className="h-4 w-4 text-amber-500" />}
                    {selectedTemplate.type === 'Instant' && <Play className="h-4 w-4 text-green-500" />}
                    {selectedTemplate.type}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider font-medium">Author</span>
                  <span className="font-semibold">{selectedTemplate.author}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider font-medium">Usage</span>
                  <span className="font-semibold">{(selectedTemplate.usageCount / 1000).toFixed(1)}k runs</span>
                </div>
              </div>

              <h4 className="font-semibold mb-6 text-sm uppercase tracking-wider text-muted-foreground">Automation Pipeline</h4>
              <div className="space-y-0 relative">
                {selectedTemplate.steps.map((step, index) => (
                  <div key={index} className="flex gap-5 relative pb-8 last:pb-0">
                    {index !== selectedTemplate.steps.length - 1 && (
                      <div className="absolute left-[23px] top-12 bottom-[-8px] w-[2px] bg-border/80" />
                    )}
                    <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 border border-border/60 z-10">
                      <ServiceIcon serviceId={step.serviceId} className="h-6 w-6" />
                    </div>
                    <div className="pt-2.5 pb-2">
                      <p className="font-semibold text-[15px] leading-none mb-1.5">{step.title}</p>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-5 flex items-start gap-4">
                <div className="bg-primary/20 text-primary p-2.5 rounded-xl shrink-0 mt-0.5">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-foreground mb-1 text-base">Connect via API</p>
                  <p className="text-muted-foreground leading-relaxed">
                    This automation runs securely on our managed n8n infrastructure. Trigger it directly from
                    your own applications using this template's dedicated API key. Check the{' '}
                    <Link href="/api-access" className="text-primary font-semibold hover:underline inline-flex items-center gap-0.5">
                      API Access <ArrowRight className="h-3 w-3" />
                    </Link>{' '}
                    page for connection details.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 md:p-8 sm:justify-between border-t bg-secondary/10">
              <Button
                variant="outline"
                onClick={() => {
                  const id = selectedTemplate.id;
                  setSelectedTemplate(null);
                  setLocation(`/api-access?template=${id}`);
                }}
                className="rounded-full px-6 gap-2 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <KeyRound className="h-4 w-4" /> Request API key
              </Button>
              <Button onClick={handleCreateFlow} size="lg" className="rounded-full px-8 font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all gap-2">
                <Zap className="h-4 w-4" /> Use this template
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
