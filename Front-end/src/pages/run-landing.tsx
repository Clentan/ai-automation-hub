import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight, Code2, MousePointerClick, KeyRound, Terminal, UploadCloud, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { setUiMode, type UiMode } from '@/lib/ui-mode';
import { BrandLoadingOverlay } from '@/components/brand-loader';

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function RunLanding() {
  const [, setLocation] = useLocation();
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  // Branded loading transition before entering the chosen side.
  const choose = (mode: UiMode, to: string, label: string) => {
    if (loadingLabel) return;
    setUiMode(mode);
    setLoadingLabel(label);
    timer.current = window.setTimeout(() => setLocation(to), 5000);
  };

  return (
    <div className="h-[100dvh] overflow-y-auto bg-secondary/10 flex flex-col">
      {/* Minimal brand header — no app navigation on this page */}
      <header className="flex items-center px-5 sm:px-8 py-3 [@media(min-height:820px)]:py-4 shrink-0">
        <div className="flex items-center gap-2.5" data-testid="brand-mark">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md shadow-sm">
            <Zap className="h-5 w-5" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight">AI Automation Hub</span>
        </div>
      </header>
      <div className="flex-1 flex flex-col justify-center max-w-5xl w-full mx-auto px-4 sm:px-6 py-4 [@media(min-height:820px)]:py-12">
        <motion.div
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.08 }}
          variants={{ hidden: {}, show: {} }}
        >
          <motion.div variants={item} className="text-center mb-5 [@media(min-height:820px)]:mb-12">
            <h1 className="text-2xl md:text-3xl [@media(min-height:820px)]:md:text-4xl font-bold tracking-tight text-foreground">
              How do you want to use your automations?
            </h1>
            <p className="text-muted-foreground text-base [@media(min-height:820px)]:text-lg mt-2 [@media(min-height:820px)]:mt-3 max-w-2xl mx-auto">
              Pick the side that fits you — you can always switch later.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            {/* Non-technical side */}
            <motion.div variants={item}>
              <Link href="/run/all" onClick={(e) => { e.preventDefault(); choose('simple', '/run/all', 'Setting up your simple workspace\u2026'); }} className="block group h-full" data-testid="card-choose-simple">
                <div className="h-full bg-card rounded-3xl border border-border/60 p-5 [@media(min-height:820px)]:p-8 transition-all duration-300 group-hover:shadow-xl group-hover:border-primary/40 group-hover:-translate-y-1">
                  <div className="bg-primary/10 text-primary p-3 [@media(min-height:820px)]:p-4 rounded-2xl w-fit mb-4 [@media(min-height:820px)]:mb-6">
                    <MousePointerClick className="h-6 w-6 [@media(min-height:820px)]:h-8 [@media(min-height:820px)]:w-8" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">I just want results</h2>
                  <p className="text-muted-foreground mb-4 [@media(min-height:820px)]:mb-6">
                    No coding needed. Browse the automations, pick the one you need, and get results
                    right on the page — in a few clicks.
                  </p>
                  <ul className="space-y-2 [@media(min-height:820px)]:space-y-2.5 text-sm text-muted-foreground mb-5 [@media(min-height:820px)]:mb-8">
                    <li className="flex items-center gap-2.5">
                      <UploadCloud className="h-4 w-4 text-primary shrink-0" /> Each automation guides you step by step
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Sparkles className="h-4 w-4 text-primary shrink-0" /> Results in plain language, in seconds
                    </li>
                    <li className="flex items-center gap-2.5">
                      <MousePointerClick className="h-4 w-4 text-primary shrink-0" /> Nothing to install or configure
                    </li>
                  </ul>
                  <Button className="rounded-full px-6 gap-2 shadow-md pointer-events-none">
                    Run automations <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </div>
              </Link>
            </motion.div>

            {/* Developer side */}
            <motion.div variants={item}>
              <Link href="/api-access" onClick={(e) => { e.preventDefault(); choose('full', '/api-access', 'Opening the developer workspace\u2026'); }} className="block group h-full" data-testid="card-choose-dev">
                <div className="h-full bg-card rounded-3xl border border-border/60 p-5 [@media(min-height:820px)]:p-8 transition-all duration-300 group-hover:shadow-xl group-hover:border-primary/40 group-hover:-translate-y-1">
                  <div className="bg-foreground/5 text-foreground p-3 [@media(min-height:820px)]:p-4 rounded-2xl w-fit mb-4 [@media(min-height:820px)]:mb-6">
                    <Code2 className="h-6 w-6 [@media(min-height:820px)]:h-8 [@media(min-height:820px)]:w-8" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">I'm a developer</h2>
                  <p className="text-muted-foreground mb-4 [@media(min-height:820px)]:mb-6">
                    Integrate automations into your own apps and scripts with a personal API key and a
                    simple POST request.
                  </p>
                  <ul className="space-y-2 [@media(min-height:820px)]:space-y-2.5 text-sm text-muted-foreground mb-5 [@media(min-height:820px)]:mb-8">
                    <li className="flex items-center gap-2.5">
                      <KeyRound className="h-4 w-4 text-foreground/70 shrink-0" /> Personal API keys, revocable anytime
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Terminal className="h-4 w-4 text-foreground/70 shrink-0" /> Ready-made curl examples
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Code2 className="h-4 w-4 text-foreground/70 shrink-0" /> JSON responses with run history
                    </li>
                  </ul>
                  <Button variant="outline" className="rounded-full px-6 gap-2 shadow-sm pointer-events-none">
                    Get API access <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </div>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
      {loadingLabel && <BrandLoadingOverlay label={loadingLabel} />}
    </div>
  );
}
