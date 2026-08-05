import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { BookOpen, Rocket, KeyRound, Zap, ArrowRight, PlayCircle, HelpCircle } from 'lucide-react';
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
    description: 'What AI Automation Hub is and how to run your first automation in minutes.',
    tag: 'Beginner',
    href: '/templates',
  },
  {
    icon: KeyRound,
    title: 'Connecting with your API key',
    description: 'Generate your personal API key and trigger automations from your own tools.',
    tag: 'Essential',
    href: '/api-access',
  },
  {
    icon: Zap,
    title: 'Understanding templates',
    description: 'Automated, Scheduled, and Instant templates — which type fits your workflow.',
    tag: 'Beginner',
    href: '/templates',
  },
  {
    icon: PlayCircle,
    title: 'Managing your flows',
    description: 'Turn flows on and off, rename them, and track every run in Activity.',
    tag: 'Guide',
    href: '/my-flows',
  },
];

const FAQS = [
  {
    q: 'What is AI Automation Hub?',
    a: 'A hub of ready-made automations built with n8n. You pick a template, connect it with your API key, and it runs on our infrastructure — no setup on your side.',
  },
  {
    q: 'Do I need to know n8n to use it?',
    a: 'No. The templates are already built and maintained for you. You only choose which automation to use and connect it via the API.',
  },
  {
    q: 'How do I connect a template?',
    a: 'Go to API Access and generate your personal API key, then trigger any template from your own tools using a simple HTTP request with that key.',
  },
  {
    q: 'How much does it cost?',
    a: 'Nothing right now — everyone is on the Free plan during early access. Paid Pro and Team plans are coming later.',
  },
  {
    q: 'Can I request a custom automation?',
    a: 'Custom template requests are planned. For now, browse the template gallery — new automations are added regularly.',
  },
];

export default function Learn() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 px-6 py-8 md:px-10 md:py-10 max-w-4xl w-full mx-auto space-y-10"
    >
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
            <BookOpen className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Learn</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Everything you need to get the most out of AI Automation Hub.
        </p>
      </div>

      {/* Guides */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Guides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GUIDES.map((guide) => (
            <Link key={guide.title} href={guide.href}>
              <Card className="h-full cursor-pointer transition-all hover:shadow-md hover:border-primary/40 group">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="bg-primary/10 text-primary p-2 rounded-lg">
                      <guide.icon className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary">{guide.tag}</Badge>
                  </div>
                  <div>
                    <p className="font-semibold mb-1 flex items-center gap-1.5">
                      {guide.title}
                      <ArrowRight className="h-4 w-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                    </p>
                    <p className="text-sm text-muted-foreground">{guide.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" /> Frequently asked questions
        </h2>
        <Card>
          <CardContent className="px-5 py-1">
            <Accordion type="single" collapsible>
              {FAQS.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className={i === FAQS.length - 1 ? 'border-b-0' : ''}>
                  <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
