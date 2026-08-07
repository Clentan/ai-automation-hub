import { useRef, useState } from 'react';
import { Link, useParams } from 'wouter';
import {
  Play,
  UploadCloud,
  FileText,
  Lock,
  LogIn,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowLeft,
  Zap,
  Clock,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import { useUser } from '@clerk/react';
import { useFlowsContext } from '@/lib/flows-context';
import { isComingSoon } from '@/lib/data';
import { useTemplates } from '@/lib/use-templates';
import { ServiceIcon } from '@/components/icons/service-icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BrandLoader } from '@/components/brand-loader';

const API_BASE = `${import.meta.env.BASE_URL}api`;

type RunState =
  | { phase: 'idle' }
  // uploading: sending the file (percent known); processing: waiting on the automation
  | { phase: 'running'; stage: 'uploading' | 'processing'; percent: number }
  | { phase: 'done'; result: unknown; runId: string }
  | { phase: 'error'; message: string };

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
  const [copied, setCopied] = useState(false);

  const copyText = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

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
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm font-semibold text-foreground">Extracted text</p>
            {text ? (
              <Button
                variant="outline"
                size="sm"
                onClick={copyText}
                className="gap-1.5 rounded-full h-8"
                data-testid="button-copy-text"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            ) : null}
          </div>
          {text ? (
            <pre className="text-sm bg-secondary/40 rounded-xl p-4 whitespace-pre-wrap break-words max-h-96 overflow-auto">
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
        <pre className="mt-2 bg-secondary/40 rounded-xl p-4 overflow-auto max-h-64">
          {JSON.stringify(result, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export default function RunDetail() {
  const { user, isLoaded } = useUser();
  const { recordRun } = useFlowsContext();
  const params = useParams<{ templateId: string }>();
  const { templates, isLoading: templatesLoading } = useTemplates();
  const template = templates.find((t) => t.id === params.templateId);

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [state, setState] = useState<RunState>({ phase: 'idle' });
  const inputRef = useRef<HTMLInputElement>(null);

  if (isLoaded && !user) return <SignInPrompt />;

  if (templatesLoading && !template) {
    return (
      <div className="flex-1 flex items-center justify-center bg-secondary/10 p-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!template || isComingSoon(template)) {
    return (
      <div className="flex-1 flex items-center justify-center bg-secondary/10 p-6">
        <div className="text-center">
          <p className="font-semibold text-foreground mb-1">
            {template ? 'This automation is coming soon' : 'Automation not found'}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {template
              ? "It isn't ready to run yet — check back soon."
              : "The link may be outdated."}
          </p>
          <Button asChild variant="outline" className="rounded-full gap-2">
            <Link href="/run/all"><ArrowLeft className="h-4 w-4" /> Back to automations</Link>
          </Button>
        </div>
      </div>
    );
  }

  const acceptFile = (f: File | undefined | null) => {
    if (!f) return;
    setFile(f);
    setState({ phase: 'idle' });
  };

  const run = () => {
    if (!file) return;
    const startedAt = Date.now();
    setState({ phase: 'running', stage: 'uploading', percent: 0 });
    const form = new FormData();
    form.append('file', file, file.name);

    // XMLHttpRequest instead of fetch so we can report real upload progress.
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/templates/${encodeURIComponent(template.id)}/run`);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setState(
          percent >= 100
            ? { phase: 'running', stage: 'processing', percent: 100 }
            : { phase: 'running', stage: 'uploading', percent },
        );
      }
    };
    xhr.upload.onload = () => {
      // File fully sent; now the automation is working on it.
      setState({ phase: 'running', stage: 'processing', percent: 100 });
    };
    xhr.onload = () => {
      let body: any = null;
      try { body = JSON.parse(xhr.responseText); } catch { /* non-JSON */ }
      if (xhr.status >= 200 && xhr.status < 300) {
        setState({ phase: 'done', result: body?.result ?? body, runId: body?.runId ?? '' });
        recordRun(template.id, 'success', Date.now() - startedAt);
      } else {
        const message =
          (body && typeof body.detail === 'string' && body.detail) ||
          'Something went wrong. Please try again.';
        setState({ phase: 'error', message });
        recordRun(template.id, 'failed', Date.now() - startedAt);
      }
    };
    xhr.onerror = () => {
      setState({ phase: 'error', message: 'Could not reach the server. Check your connection and try again.' });
    };
    xhr.send(form);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-secondary/10">
      {/* Hero header */}
      <div className="bg-primary/5 border-b border-border/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <ServiceIcon serviceId={template.services[0]} className="w-80 h-80 grayscale" />
        </div>
        <div className="max-w-3xl xl:max-w-4xl mx-auto px-4 sm:px-6 py-4 [@media(min-height:820px)]:py-8 relative">
          <Link
            href="/run/all"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-medium mb-3 [@media(min-height:820px)]:mb-5"
          >
            <ArrowLeft className="h-4 w-4" /> All automations
          </Link>
          <div className="flex -space-x-2 mb-2.5 [@media(min-height:820px)]:mb-4">
            {template.services.map((serviceId, index) => (
              <div
                key={`${template.id}-${serviceId}-${index}`}
                className="h-10 w-10 [@media(min-height:820px)]:h-12 [@media(min-height:820px)]:w-12 rounded-full bg-white border-2 border-card shadow-sm flex items-center justify-center"
                style={{ zIndex: 10 - index }}
              >
                <ServiceIcon serviceId={serviceId} className="h-5 w-5 [@media(min-height:820px)]:h-6 [@media(min-height:820px)]:w-6" />
              </div>
            ))}
          </div>
          <h1 className="text-xl md:text-2xl [@media(min-height:820px)]:md:text-3xl font-bold tracking-tight text-foreground mb-1.5">
            {template.name}
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm [@media(min-height:820px)]:text-base">{template.description}</p>
          <div className="flex items-center gap-2 mt-3 [@media(min-height:820px)]:mt-4">
            <Badge variant="secondary" className="bg-background/70 font-medium border-0 text-[10px] uppercase tracking-wider gap-1 px-2.5 py-1">
              {template.type === 'Automated' && <Zap className="h-3 w-3 text-primary" />}
              {template.type === 'Scheduled' && <Clock className="h-3 w-3 text-amber-500" />}
              {template.type === 'Instant' && <Play className="h-3 w-3 text-green-500" />}
              {template.type}
            </Badge>
            <Badge variant="secondary" className="bg-background/70 font-medium border-0 text-[10px] uppercase tracking-wider gap-1 px-2.5 py-1">
              <ShieldCheck className="h-3 w-3 text-green-600" /> Private to your account
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-3xl xl:max-w-4xl mx-auto px-4 sm:px-6 py-5 [@media(min-height:820px)]:py-8 md:[@media(min-height:820px)]:py-10 pb-16">
        {state.phase === 'done' ? (
          <Card className="rounded-2xl border-green-500/30 bg-green-500/5 shadow-sm">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-2 mb-5">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <p className="font-bold text-lg text-foreground">Done!</p>
              </div>
              <ResultSummary result={state.result} />
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button variant="outline" className="rounded-full gap-1.5" onClick={() => { setFile(null); setState({ phase: 'idle' }); }}>
                  <RotateCcw className="h-4 w-4" /> Run another file
                </Button>
                <Button asChild variant="ghost" className="rounded-full text-primary">
                  <Link href="/activity">View in Activity</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5 [@media(min-height:820px)]:space-y-8">
            {/* Step 1 */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">1</div>
                <div>
                  <p className="font-semibold text-foreground">Add your PDF</p>
                  <p className="text-sm text-muted-foreground">Drop it below or click to browse your files</p>
                </div>
              </div>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); acceptFile(e.dataTransfer.files?.[0]); }}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  'rounded-3xl border-2 border-dashed p-6 [@media(min-height:820px)]:p-10 md:[@media(min-height:820px)]:p-14 text-center cursor-pointer transition-all',
                  dragOver
                    ? 'border-primary bg-primary/5 scale-[1.01]'
                    : file
                      ? 'border-green-500/50 bg-green-500/5'
                      : 'border-border/70 bg-card hover:border-primary/40 hover:bg-primary/[0.02]',
                )}
                data-testid="dropzone-upload"
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => acceptFile(e.target.files?.[0])}
                />
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-green-500/10 text-green-600 p-4 rounded-2xl">
                      <FileText className="h-8 w-8" />
                    </div>
                    <div className="min-w-0 max-w-full">
                      <p className="font-semibold text-foreground truncate">{file.name}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {(file.size / 1024).toFixed(0)} KB · click to choose a different file
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-primary/10 text-primary p-4 rounded-2xl">
                      <UploadCloud className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Drop a PDF here, or click to browse</p>
                      <p className="text-sm text-muted-foreground mt-0.5">Only PDF files are supported</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2 */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors',
                  file ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground',
                )}>2</div>
                <div>
                  <p className="font-semibold text-foreground">Run it</p>
                  <p className="text-sm text-muted-foreground">Results appear right here — usually within seconds</p>
                </div>
              </div>
              {state.phase === 'running' ? (
                <div className="rounded-2xl border border-primary/20 bg-card p-5 shadow-sm max-w-lg" data-testid="progress-run">
                  <div className="flex items-center gap-4 mb-4">
                    <BrandLoader />
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {state.stage === 'uploading'
                          ? `Uploading ${file?.name ?? 'your file'}… ${state.percent}%`
                          : 'AI Automation Hub is working on it…'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {state.stage === 'uploading' ? 'Sending your file securely' : 'Almost there'}
                      </p>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full bg-primary transition-all duration-300',
                        state.stage === 'processing' && 'animate-pulse',
                      )}
                      style={{ width: `${state.stage === 'processing' ? 100 : state.percent}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    This usually takes just a few seconds.
                  </p>
                </div>
              ) : (
                <Button
                  onClick={run}
                  disabled={!file}
                  size="lg"
                  className="rounded-full px-10 gap-2 shadow-md"
                  data-testid="button-run"
                >
                  <Sparkles className="h-5 w-5" /> Run automation
                </Button>
              )}
            </div>

            {state.phase === 'error' && (
              <Card className="rounded-2xl border-destructive/30 bg-destructive/5 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-5 w-5 text-destructive" />
                    <p className="font-semibold text-foreground">That didn't work</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{state.message}</p>
                  <Button variant="outline" size="sm" className="rounded-full gap-1.5 mt-4" onClick={() => setState({ phase: 'idle' })}>
                    <RotateCcw className="h-3.5 w-3.5" /> Try again
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
