import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, Copy, RefreshCw, Check, Sparkles, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const API_KEY_STORAGE = 'ai-automation-hub-api-key';

function generateKey() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < 32; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `aah_live_${s}`;
}

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    description: 'Full access while we are in early access',
    features: ['All templates', 'Personal API key', 'Unlimited connections'],
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

export default function ApiAccess() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setApiKey(localStorage.getItem(API_KEY_STORAGE));
  }, []);

  const createKey = () => {
    const key = generateKey();
    localStorage.setItem(API_KEY_STORAGE, key);
    setApiKey(key);
    toast({ title: 'API key generated', description: 'Keep it secret — it identifies your account.' });
  };

  const copyKey = async () => {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const maskedKey = apiKey
    ? `${apiKey.slice(0, 13)}${'•'.repeat(16)}${apiKey.slice(-4)}`
    : null;

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
              Connect your tools to any published automation using your personal API key.
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
          {/* API Key */}
          <Card className="shadow-sm border-border/60 rounded-2xl overflow-hidden">
            <CardHeader className="bg-secondary/20 border-b border-border/40 pb-5">
              <CardTitle className="flex items-center gap-2 text-xl">
                <KeyRound className="h-5 w-5 text-primary" /> Your API key
              </CardTitle>
              <CardDescription className="text-[15px]">
                Use this key to authenticate requests. Every automation you connect runs under this key.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {apiKey ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 bg-secondary/30 rounded-xl px-5 py-3 border border-border/50">
                    <code className="text-base font-mono truncate block text-foreground">
                      {maskedKey}
                    </code>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" onClick={copyKey} className="gap-2 rounded-xl h-auto shadow-sm">
                      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Copied' : 'Copy key'}
                    </Button>
                    <Button variant="secondary" onClick={createKey} className="gap-2 rounded-xl h-auto bg-secondary hover:bg-secondary/80">
                      <RefreshCw className="h-4 w-4" /> Regenerate
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-start gap-4">
                  <p className="text-muted-foreground text-[15px]">
                    You don't have an API key yet. Generate one to start connecting automations to your external tools.
                  </p>
                  <Button onClick={createKey} size="lg" className="gap-2 rounded-full px-6 shadow-md">
                    <KeyRound className="h-4 w-4" /> Generate API key
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* How to connect */}
          <Card className="shadow-sm border-border/60 rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">How to connect</CardTitle>
              <CardDescription className="text-[15px]">
                Pick a template, then trigger it from your own tools with a single request.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/0 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <pre className="relative bg-[#0d1117] dark:bg-black text-blue-300 rounded-xl p-5 text-[13px] md:text-sm font-mono overflow-x-auto border border-[#30363d] shadow-inner">
  <span className="text-purple-400">curl</span> -X POST https://api.aiautomationhub.dev/v1/templates/<span className="text-orange-300">&#123;template_id&#125;</span>/run \
    -H <span className="text-green-300">"Authorization: Bearer {apiKey ?? 'YOUR_API_KEY'}"</span> \
    -H <span className="text-green-300">"Content-Type: application/json"</span> \
    -d <span className="text-green-300">'&#123; "inputs": &#123; &#125; &#125;'</span>
                </pre>
              </div>
              <p className="text-sm text-muted-foreground mt-4 font-medium">
                Endpoints are illustrative — live API access is rolling out with early access.
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
