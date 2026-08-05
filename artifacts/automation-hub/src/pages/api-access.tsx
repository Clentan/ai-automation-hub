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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 px-6 py-8 md:px-10 md:py-10 max-w-4xl w-full mx-auto space-y-8"
    >
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">API Access</h1>
          <Badge className="gap-1"><Sparkles className="h-3 w-3" /> Free plan</Badge>
        </div>
        <p className="text-muted-foreground text-lg">
          Connect your tools to any published automation using your personal API key.
        </p>
      </div>

      {/* API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="h-5 w-5 text-primary" /> Your API key
          </CardTitle>
          <CardDescription>
            Use this key to authenticate requests. Every automation you connect runs under this key.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiKey ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <code className="flex-1 bg-secondary rounded-md px-4 py-3 text-sm font-mono truncate">
                {maskedKey}
              </code>
              <div className="flex gap-2">
                <Button variant="outline" onClick={copyKey} className="gap-2">
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button variant="outline" onClick={createKey} className="gap-2">
                  <RefreshCw className="h-4 w-4" /> Regenerate
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">
                You don't have an API key yet. Generate one to start connecting.
              </p>
              <Button onClick={createKey} className="gap-2">
                <KeyRound className="h-4 w-4" /> Generate API key
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How to connect */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to connect</CardTitle>
          <CardDescription>
            Pick a template, then trigger it from your own tools with a single request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-foreground text-background rounded-lg p-4 text-xs sm:text-sm font-mono overflow-x-auto">
{`curl -X POST https://api.aiautomationhub.dev/v1/templates/{template_id}/run \\
  -H "Authorization: Bearer ${apiKey ?? 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{ "inputs": { } }'`}
          </pre>
          <p className="text-xs text-muted-foreground mt-3">
            Endpoints are illustrative — live API access is rolling out with early access.
          </p>
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <Card key={plan.name} className={plan.current ? 'border-primary shadow-sm' : 'opacity-80'}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{plan.name}</span>
                  {plan.current ? (
                    <Badge>Current</Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1"><Lock className="h-3 w-3" /> Soon</Badge>
                  )}
                </div>
                <div className="text-2xl font-bold">{plan.price}</div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                <ul className="text-sm space-y-1.5 pt-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
