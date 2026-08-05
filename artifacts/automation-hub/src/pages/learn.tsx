import { motion } from 'framer-motion';
import {
  BookOpen,
  Rocket,
  KeyRound,
  Zap,
  PlayCircle,
  HelpCircle,
  Home,
  LayoutGrid,
  CheckSquare,
  Activity,
  Workflow,
  Send,
  Server,
  BellRing,
  Settings,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const GUIDES = [
  {
    icon: Rocket,
    title: 'Getting started',
    tag: 'Beginner',
    content:
      'AI Automation Hub is a gallery of ready-made automations built with n8n and run on our infrastructure. Open the Templates page, browse or search the gallery, and press "Use template" on any automation to activate it as one of your flows. Nothing to install, nothing to build — your first automation can be running in under a minute.',
  },
  {
    icon: KeyRound,
    title: 'Connecting with API keys',
    tag: 'Essential',
    content:
      'Every template has its own dedicated API key. Press "Request API key" on a template and a key is issued that works only with that automation. Use it in the Authorization header of an HTTP request to trigger the template from your own apps and scripts. You can copy, regenerate, or revoke each key at any time — revoking one never affects your other connections.',
  },
  {
    icon: Zap,
    title: 'Understanding templates',
    tag: 'Beginner',
    content:
      'Templates come in three types. Automated templates react to events on their own (e.g. a new email arrives). Scheduled templates run at fixed times (e.g. a daily briefing). Instant templates run the moment you trigger them — by hand or via their API key. Every template card shows its type, the services it connects, and a step-by-step breakdown of what it does.',
  },
  {
    icon: PlayCircle,
    title: 'Managing your flows',
    tag: 'Guide',
    content:
      'When you activate a template it becomes a flow in "My flows". There you can switch flows on or off, rename them, or delete them when you no longer need them. Every action is recorded with a timestamp in Activity, so you always have a complete history of what happened and when.',
  },
];

const APP_SECTIONS = [
  {
    icon: Home,
    title: 'Home',
    description:
      'Your dashboard. See active flows, total runs, the most popular templates, and your latest activity at a glance.',
  },
  {
    icon: LayoutGrid,
    title: 'Templates',
    description:
      'The full gallery of ready-made automations built with n8n. Search, filter by category, and open any template to see exactly what it does step by step. Each template has a "Request API key" button, and you can submit your own ideas with "Request a template".',
  },
  {
    icon: CheckSquare,
    title: 'My flows',
    description:
      'Every template you have activated becomes a flow here. Turn flows on or off, rename them, or remove them when you no longer need them.',
  },
  {
    icon: Activity,
    title: 'Activity',
    description:
      'A complete history of what happened: flows created, switched on or off, renamed, or deleted — with timestamps.',
  },
  {
    icon: KeyRound,
    title: 'API Access',
    description:
      'Reached via the "Request API key" button on any template. Manage your template API keys — each automation has its own dedicated key. Copy, regenerate, or revoke keys, see the connection example, and check your plan (everyone is on the Free plan during early access).',
  },
  {
    icon: Settings,
    title: 'Settings',
    description:
      'Open it with the gear icon next to your profile at the bottom of the sidebar. Update your name and email, switch between light and dark theme, manage notifications, and clear your local data.',
  },
];

const PIPELINE_STEPS = [
  {
    icon: LayoutGrid,
    title: '1. Pick a template',
    description:
      'Browse the gallery and choose an automation. Each template is a complete workflow already built and tested in n8n — you never have to build anything yourself.',
  },
  {
    icon: KeyRound,
    title: '2. Request the template\'s API key',
    description:
      'Press "Request API key" on the template. You get a dedicated key that only works with that automation — revoking it never affects your other connections.',
  },
  {
    icon: Send,
    title: '3. Connect & trigger',
    description:
      'Send a simple HTTP request from your app, script, or tool — with the template\'s key in the header — to trigger it. Automated and Scheduled templates can also start on their own.',
  },
  {
    icon: Server,
    title: '4. Runs on our infrastructure',
    description:
      'The n8n workflow behind the template executes on our servers: it talks to the connected services (Gmail, Slack, Sheets, AI models, etc.) and performs each step securely in order.',
  },
  {
    icon: BellRing,
    title: '5. Results & tracking',
    description:
      'The outcome is delivered wherever the template sends it (your inbox, Slack, a spreadsheet…), and every run is logged so you can follow it in Activity.',
  },
];

const FAQS = [
  {
    q: 'What is AI Automation Hub?',
    a: 'A hub of ready-made automations built with n8n. You pick a template, connect it with its API key, and it runs on our infrastructure — no setup on your side.',
  },
  {
    q: 'Do I need to know n8n to use it?',
    a: 'No. The templates are already built and maintained for you. You only choose which automation to use and connect it via the API.',
  },
  {
    q: 'How do I connect a template?',
    a: 'Press "Request API key" on any template to get a key dedicated to that automation, then trigger it from your own tools using a simple HTTP request. Each key only works with its own template, so revoking one never affects the others.',
  },
  {
    q: 'How much does it cost?',
    a: 'Nothing right now — everyone is on the Free plan during early access. Paid Pro and Team plans are coming later.',
  },
  {
    q: 'Can I request a custom automation?',
    a: 'Yes — open the Templates page and press "Request a template" to describe the workflow you need and the tools involved. We review every request, and popular ideas are built and published to the gallery.',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

export default function Learn() {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="border-b border-border/60 bg-background sticky top-0 z-10 px-6 py-8 md:py-10">
        <div className="max-w-4xl mx-auto w-full flex items-start gap-4">
          <div className="bg-primary/10 text-primary p-3 rounded-2xl shrink-0">
            <BookOpen className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-foreground">Documentation</h1>
            <p className="text-muted-foreground text-lg">Everything you need to get the most out of AI Automation Hub.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-secondary/10">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="p-6 md:p-8 max-w-4xl mx-auto w-full space-y-12 pb-20"
        >
          {/* Guides */}
          <motion.div variants={item} className="space-y-5">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Quick Guides</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {GUIDES.map((guide) => (
                <Card key={guide.title} className="h-full bg-card border-border/60">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
                        <guide.icon className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary" className="bg-secondary/60 text-[10px] uppercase tracking-wider font-bold">{guide.tag}</Badge>
                    </div>
                    <div>
                      <p className="font-bold text-lg mb-1.5 text-foreground">{guide.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed font-medium">{guide.content}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Connecting via API */}
          <motion.div variants={item} className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                <KeyRound className="h-6 w-6 text-primary" /> Connecting via API
              </h2>
              <p className="text-muted-foreground text-base mt-1 font-medium max-w-2xl">
                Each template's key goes in the Authorization header, and the template id goes in the URL. A connection looks like this:
              </p>
            </div>
            <Card className="bg-card border-border/60 shadow-sm">
              <CardContent className="p-6">
                <pre className="bg-[#0d1117] dark:bg-black text-blue-300 rounded-xl p-5 text-[13px] md:text-sm font-mono overflow-x-auto border border-[#30363d] shadow-inner">
  <span className="text-purple-400">curl</span> -X POST https://api.aiautomationhub.dev/v1/templates/<span className="text-orange-300">&#123;template_id&#125;</span>/run \
    -H <span className="text-green-300">"Authorization: Bearer &#123;template_api_key&#125;"</span> \
    -H <span className="text-green-300">"Content-Type: application/json"</span> \
    -d <span className="text-green-300">'&#123; "inputs": &#123; &#125; &#125;'</span>
                </pre>
                <p className="text-sm text-muted-foreground mt-4 font-medium">
                  Because each key is bound to one template, a key can never trigger any automation other than its own. Endpoints are illustrative — live API access is rolling out with early access.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* The application */}
          <motion.div variants={item} className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">App Concepts</h2>
              <p className="text-muted-foreground text-base mt-1 max-w-2xl font-medium">
                AI Automation Hub is where ready-made n8n automations are published. Here is what each part of the app does:
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {APP_SECTIONS.map((section) => (
                <Card key={section.title} className="bg-card border-border/60">
                  <CardContent className="p-5 flex items-start gap-5">
                    <div className="bg-primary/10 text-primary p-3 rounded-xl shrink-0">
                      <section.icon className="h-6 w-6" />
                    </div>
                    <div className="pt-0.5">
                      <p className="font-bold text-base text-foreground mb-1">{section.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed font-medium">{section.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Pipeline */}
          <motion.div variants={item} className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                <Workflow className="h-6 w-6 text-primary" /> How the pipeline works
              </h2>
              <p className="text-muted-foreground text-base mt-1 font-medium">
                From choosing a template to getting results — this is the full journey of an automation.
              </p>
            </div>
            <Card className="bg-card border-border/60 shadow-sm overflow-hidden">
              <CardContent className="p-8 md:p-10">
                <div className="space-y-0">
                  {PIPELINE_STEPS.map((step, index) => (
                    <div key={step.title} className="flex gap-6 relative pb-10 last:pb-0">
                      {index !== PIPELINE_STEPS.length - 1 && (
                        <div className="absolute left-6 top-14 bottom-[-8px] w-px bg-border/80" />
                      )}
                      <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 z-10 border border-primary/20 shadow-sm">
                        <step.icon className="h-5 w-5" />
                      </div>
                      <div className="pt-3">
                        <p className="font-bold text-[17px] mb-2 text-foreground">{step.title}</p>
                        <p className="text-[15px] text-muted-foreground leading-relaxed font-medium">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* FAQ */}
          <motion.div variants={item} className="space-y-5">
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <HelpCircle className="h-6 w-6 text-primary" /> Frequently asked questions
            </h2>
            <Card className="bg-card border-border/60 shadow-sm">
              <CardContent className="px-6 py-2">
                <Accordion type="single" collapsible className="w-full">
                  {FAQS.map((faq, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className={i === FAQS.length - 1 ? 'border-b-0' : 'border-border/50'}>
                      <AccordionTrigger className="text-left text-[15px] font-bold text-foreground hover:text-primary transition-colors py-5">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-[15px] text-muted-foreground leading-relaxed font-medium pb-5">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
