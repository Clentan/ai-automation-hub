import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSearch, Link } from 'wouter';
import { KeyRound, Copy, RefreshCw, Check, Sparkles, Lock, Zap, Trash2, LayoutGrid } from 'lucide-react';
import { MOCK_TEMPLATES } from '@/lib/data';
import { ServiceIcon } from '@/components/icons/service-icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useApiKeys } from '@/lib/use-api-keys';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    description: 'Full access while we are in early access',
    features: ['All templates', 'One key per template', 'Unlimited connections'],
    current: true,
  },
  {
    name: 'Pro',
    price: 'Coming soon',
    description: 'Higher limits and priority runs',
    features: ['Everything in Free', 'Priority execution', 'Usage analytics'],
    current: false,
  },
  {
    name: 'Team',
    price: 'Coming soon',
    description: 'Shared keys and team management',
    features: ['Everything in Pro', 'Team workspaces', 'Dedicated support'],
    current: false,
  },
];

function maskKey(key: string) {
  return `${key.slice(0, 12)}${'•'.repeat(12)}${key.slice(-4)}`;
}

export default function ApiAccess() {
  const { toast } = useToast();
  const { keys, loading, getKeyFor, requestKeyFor, regenerateKeyFor, revokeKeyFor } = useApiKeys();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const search = useSearch();
  const requestedTemplate = useMemo(() => {
    const id = new URLSearchParams(search).get('template');
    return id ? MOCK_TEMPLATES.find((t) => t.id === id) ?? null : null;
  }, [search]);

  const requestedKey = requestedTemplate ? getKeyFor(requestedTemplate.id) : null;

  const handleRequest = async (templateId: string, templateName: string) => {
    try {
      await requestKeyFor(templateId);
      toast({
        title: 'API key issued',
        description: `Your key for "${templateName}" is ready. It only works with this automation.`,
      });
    } catch {
      toast({ title: 'Could not issue key', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const handleRegenerate = async (templateId: string, templateName: string) => {
    try {
      await regenerateKeyFor(templateId);
      toast({
        title: 'API key regenerated',
        description: `The old key for "${templateName}" no longer works.`,
      });
    } catch {
      toast({ title: 'Could not regenerate key', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const handleRevoke = async (templateId: string, templateName: string) => {
    try {
      await revokeKeyFor(templateId);
      toast({
        title: 'API key revoked',
        description: `Access to "${templateName}" has been removed.`,
        variant: 'destructive',
      });
    } catch {
      toast({ title: 'Could not revoke key', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const copyKey = async (templateId: string, key: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedId(templateId);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const exampleKey = requestedKey?.key ?? keys[0]?.key ?? 'YOUR_TEMPLATE_KEY';
  const exampleTemplateId = requestedTemplate?.id ?? keys[0]?.templateId ?? '{template_id}';

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="border-b border-border/60 bg-background sticky top-0 z-10 px-6 py-8 md:py-10">
        <div className="max-w-4xl mx-auto w-full flex items-start gap-4">
          <div className="bg-primary/10 text-primary p-3 rounded-2xl shrink-0">
            <KeyRound className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">API Access</h1>
              <Badge className="gap-1 bg-primary text-primary-foreground uppercase tracking-wider text-[10px] font-bold"><Sparkles className="h-3 w-3" /> Free plan</Badge>
            </div>
            <p className="text-muted-foreground text-lg">
              Each automation has its own API key. Request a key per template — it only unlocks that automation.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-secondary/10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 md:p-8 max-w-4xl mx-auto w-full space-y-8 pb-20"
        >
          {/* Requested template context */}
          {requestedTemplate && (
            <Card className="shadow-sm border-primary/30 bg-primary/5 rounded-2xl">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex -space-x-2 shrink-0">
                  {requestedTemplate.services.slice(0, 3).map((serviceId, i) => (
                    <div key={i} className="h-10 w-10 rounded-full bg-white border-2 border-card shadow-sm flex items-center justify-center" style={{ zIndex: 10 - i }}>
                      <ServiceIcon serviceId={serviceId} className="h-5 w-5" />
                    </div>
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">{requestedTemplate.name}</span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {requestedKey
                      ? 'You already have a key for this automation — it is listed below.'
                      : 'Request a dedicated key to connect this automation to your tools.'}
                  </p>
                </div>
                {!requestedKey && (
                  <Button
                    onClick={() => handleRequest(requestedTemplate.id, requestedTemplate.name)}
                    className="rounded-full px-6 gap-2 shrink-0 shadow-md"
                  >
                    <KeyRound className="h-4 w-4" /> Request key
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Keys list */}
          <Card className="shadow-sm border-border/60 rounded-2xl overflow-hidden">
            <CardHeader className="bg-secondary/20 border-b border-border/40 pb-5">
              <CardTitle className="flex items-center gap-2 text-xl">
                <KeyRound className="h-5 w-5 text-primary" /> Your template keys
              </CardTitle>
              <CardDescription className="text-[15px]">
                One key per automation. Revoking a key disconnects only that automation — everything else keeps running.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">Loading your keys…</span>
                </div>
              ) : keys.length === 0 ? (
                <div className="flex flex-col items-center text-center gap-4 py-12 px-6">
                  <div className="h-16 w-16 rounded-2xl bg-secondary/50 border flex items-center justify-center">
                    <KeyRound className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">No keys yet</p>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Browse the template gallery and press "Request API key" on any automation you want to connect.
                    </p>
                  </div>
                  <Button asChild variant="outline" className="rounded-full px-6 gap-2 mt-1">
                    <Link href="/templates"><LayoutGrid className="h-4 w-4" /> Browse templates</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {keys.map((entry) => {
                    const template = MOCK_TEMPLATES.find((t) => t.id === entry.templateId);
                    if (!template) return null;
                    return (
                      <div key={entry.templateId} className="p-5 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2 shrink-0">
                            {template.services.slice(0, 3).map((serviceId, i) => (
                              <div key={i} className="h-8 w-8 rounded-full bg-white border-2 border-card shadow-sm flex items-center justify-center" style={{ zIndex: 10 - i }}>
                                <ServiceIcon serviceId={serviceId} className="h-4 w-4" />
                              </div>
                            ))}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground truncate">{template.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Issued {new Date(entry.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <code className="flex-1 bg-secondary/30 rounded-lg px-4 py-2.5 text-sm font-mono truncate border border-border/50 text-foreground">
                            {maskKey(entry.key)}
                          </code>
                          <div className="flex gap-2 shrink-0">
                            <Button variant="outline" size="sm" onClick={() => copyKey(entry.templateId, entry.key)} className="gap-1.5 rounded-lg h-auto">
                              {copiedId === entry.templateId ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                              {copiedId === entry.templateId ? 'Copied' : 'Copy'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleRegenerate(entry.templateId, template.name)} className="gap-1.5 rounded-lg h-auto">
                              <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleRevoke(entry.templateId, template.name)} className="gap-1.5 rounded-lg h-auto text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50">
                              <Trash2 className="h-3.5 w-3.5" /> Revoke
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* How to connect */}
          <Card className="shadow-sm border-border/60 rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">How to connect</CardTitle>
              <CardDescription className="text-[15px]">
                Trigger an automation from your own tools using its dedicated key — the key only works with its own template.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/0 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <pre className="relative bg-[#0d1117] dark:bg-black text-blue-300 rounded-xl p-5 text-[13px] md:text-sm font-mono overflow-x-auto border border-[#30363d] shadow-inner">
  <span className="text-purple-400">curl</span> -X POST {typeof window !== 'undefined' ? window.location.origin : ''}{import.meta.env.BASE_URL}api/v1/templates/<span className="text-orange-300">{exampleTemplateId}</span>/run \
    -H <span className="text-green-300">"Authorization: Bearer {exampleKey}"</span> \
    -H <span className="text-green-300">"Content-Type: application/json"</span> \
    -d <span className="text-green-300">'&#123; "inputs": &#123; &#125; &#125;'</span>
                </pre>
              </div>
              <p className="text-sm text-muted-foreground mt-4 font-medium">
                This endpoint is live: it validates your key, checks that it matches the template, and queues a run.
              </p>
            </CardContent>
          </Card>

          {/* Plans */}
          <div className="space-y-5 pt-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Available Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {PLANS.map((plan) => (
                <Card key={plan.name} className={`rounded-2xl transition-all ${plan.current ? 'border-primary/50 shadow-md ring-1 ring-primary/10 relative overflow-hidden' : 'opacity-80 bg-card/50 border-border/50'}`}>
                  {plan.current && <div className="absolute top-0 left-0 w-full h-1 bg-primary" />}
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-lg text-foreground">{plan.name}</span>
                      {plan.current ? (
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0 uppercase tracking-wider text-[10px] font-bold">Current</Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 uppercase tracking-wider text-[10px] font-bold"><Lock className="h-3 w-3" /> Soon</Badge>
                      )}
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">{plan.price}</div>
                    <p className="text-sm text-muted-foreground font-medium pb-2">{plan.description}</p>
                    <ul className="text-sm space-y-3 pt-2 border-t border-border/50">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 font-medium text-foreground/80">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
