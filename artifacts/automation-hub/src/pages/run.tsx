import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Play,
  Search,
  Lock,
  LogIn,
  Clock,
  Zap,
  ChevronDown,
  Check,
  SlidersHorizontal,
} from 'lucide-react';
import { useUser } from '@clerk/react';
import { MOCK_TEMPLATES, CATEGORIES, isComingSoon, Template } from '@/lib/data';
import { ServiceIcon } from '@/components/icons/service-icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { BrandLoadingOverlay } from '@/components/brand-loader';

const API_BASE = `${import.meta.env.BASE_URL}api`;

function SignInPrompt() {
  return (
    <div className="flex-1 flex items-center justify-center bg-secondary/10 p-6">
      <Card className="shadow-sm border-border/60 rounded-2xl max-w-md w-full">
        <CardContent className="flex flex-col items-center text-center gap-4 py-12 px-8">
          <div className="bg-primary/10 text-primary p-4 rounded-2xl">
            <Lock className="h-8 w-8" />
          </div>
          <div>
            <p className="font-bold text-xl text-foreground mb-2">Sign in to run automations</p>
            <p className="text-sm text-muted-foreground">
              Running an automation is tied to your account so you can see your results and history
              on any device.
            </p>
          </div>
          <Button asChild className="rounded-full px-8 gap-2 shadow-md mt-2">
            <Link href="/sign-in"><LogIn className="h-4 w-4" /> Sign in</Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            New here? <Link href="/sign-up" className="text-primary font-semibold">Create an account</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/** Renders the automation's output in plain language where we can. */
function ResultSummary({ result }: { result: unknown }) {
  const r = result as Record<string, unknown> | null;
  const pages = r && typeof r.numpages === 'number' ? r.numpages : null;
  const text = r && typeof r.text === 'string' ? (r.text as string).trim() : null;

  return (
    <div className="space-y-4">
      {pages !== null && (
        <p className="text-sm text-muted-foreground">
          Processed <span className="font-semibold text-foreground">{pages}</span>{' '}
          {pages === 1 ? 'page' : 'pages'}.
        </p>
      )}
      {text !== null && (
        <div>
          <p className="text-sm font-semibold text-foreground mb-1.5">Extracted text</p>
          {text ? (
            <pre className="text-sm bg-secondary/40 rounded-xl p-4 whitespace-pre-wrap break-words max-h-72 overflow-auto">
              {text}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No selectable text found in this PDF (it may be a scanned image).
            </p>
          )}
        </div>
      )}
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer font-medium hover:text-foreground">Full details</summary>
        <pre className="mt-2 bg-secondary/40 rounded-xl p-4 overflow-auto max-h-56">
          {JSON.stringify(result, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export default function RunPage() {
  const { user, isLoaded } = useUser();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [, setLocation] = useLocation();
  const [launching, setLaunching] = useState<Template | null>(null);
  const launchTimer = useRef<number | null>(null);

  useEffect(() => () => { if (launchTimer.current) window.clearTimeout(launchTimer.current); }, []);

  // Branded 5s transition before opening the automation's page.
  const launch = (template: Template) => {
    if (launching) return;
    setLaunching(template);
    launchTimer.current = window.setTimeout(() => setLocation(`/run/${template.id}`), 5000);
  };

  const filtered = useMemo(() => {
    let result = MOCK_TEMPLATES;
    if (activeCategory !== 'All') {
      result = result.filter((t) => t.categories.includes(activeCategory));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
      );
    }
    // Runnable first, then coming soon.
    return [...result].sort((a, b) => Number(isComingSoon(a)) - Number(isComingSoon(b)));
  }, [search, activeCategory]);

  if (isLoaded && !user) return <SignInPrompt />;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Header Area — mirrors the Template Gallery */}
      <div className="bg-background sticky top-0 z-10">
        <div className="px-6 py-5 [@media(min-height:820px)]:py-8 md:[@media(min-height:820px)]:py-10 max-w-7xl 2xl:max-w-[1600px] mx-auto w-full">
          <div className="flex flex-col gap-6 mb-8">
            <div className="space-y-2 max-w-2xl">
              <h1 className="text-2xl md:text-3xl [@media(min-height:820px)]:md:text-4xl font-bold tracking-tight text-foreground">Run an automation</h1>
              <p className="text-muted-foreground text-lg">
                No coding needed — pick an automation, follow the steps, and get results right here.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:items-center">
              <div className="w-full sm:flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search automations..."
                  className="pl-12 h-12 w-full rounded-full bg-secondary/30 border-transparent focus-visible:bg-background focus-visible:border-primary/30 transition-all text-base shadow-sm hover:bg-secondary/50"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0 h-10 rounded-full border-border bg-background shadow-sm px-4">
                  <SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground" />
                  Filter: {activeCategory} <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px] rounded-xl">
                {CATEGORIES.map((cat) => (
                  <DropdownMenuItem
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className="flex items-center justify-between rounded-lg cursor-pointer"
                  >
                    {cat}
                    {activeCategory === cat && <Check className="h-4 w-4 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Grid Area — same card layout as the gallery */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 pt-2 max-w-7xl 2xl:max-w-[1600px] mx-auto w-full pb-16">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-semibold text-foreground mb-1">Nothing found</p>
              <p className="text-sm text-muted-foreground">
                No automations match "{search}" in the {activeCategory} category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((template, i) => (
                <div
                  key={template.id}
                  onClick={() => !isComingSoon(template) && launch(template)}
                  className={cn(
                    'group relative flex flex-col bg-card rounded-2xl border border-border/60 p-5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4',
                    isComingSoon(template)
                      ? 'opacity-60 grayscale cursor-not-allowed'
                      : 'hover:shadow-lg hover:border-primary/30 cursor-pointer',
                  )}
                  style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
                  data-testid={`card-run-${template.id}`}
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

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isComingSoon(template)}
                    className="mt-auto w-full rounded-full gap-2 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-colors font-semibold disabled:opacity-70"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isComingSoon(template)) launch(template);
                    }}
                  >
                    {isComingSoon(template) ? (
                      <><Clock className="h-3.5 w-3.5" /> Coming soon</>
                    ) : (
                      <><Play className="h-3.5 w-3.5" /> Run now</>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {launching && <BrandLoadingOverlay label={`Opening “${launching.name}”…`} />}
    </div>
  );
}
