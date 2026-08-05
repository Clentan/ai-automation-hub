import { useState } from 'react';
import { Lightbulb, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { submitTemplateRequest } from '@/lib/use-api-keys';

export function RequestTemplateDialog({ trigger }: { trigger?: React.ReactNode }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [tools, setTools] = useState('');
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await submitTemplateRequest({
        title: title.trim(),
        tools: tools.trim(),
        description: description.trim(),
      });
      setOpen(false);
      setTitle('');
      setTools('');
      setDescription('');
      toast({
        title: 'Request submitted',
        description: 'Thanks! We review every request — popular ideas become new templates in the gallery.',
      });
    } catch (e) {
      if (e instanceof Error && e.message === 'sign-in-required') {
        toast({
          title: 'Sign in to submit',
          description: 'Please sign in so we can follow up on your template idea.',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Could not submit request', description: 'Please try again.', variant: 'destructive' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="rounded-full px-5 gap-2 shadow-sm">
            <Lightbulb className="h-4 w-4" /> Request a template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="bg-primary/10 text-primary p-2 rounded-xl">
              <Lightbulb className="h-5 w-5" />
            </span>
            Request a custom template
          </DialogTitle>
          <DialogDescription className="text-[15px] pt-1">
            Tell us what you'd like to automate. We review every request, and popular ideas are built and published to the gallery.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="request-title">What should it do?</Label>
            <Input
              id="request-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summarize new support tickets with AI"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="request-tools">
              Which tools are involved? <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="request-tools"
              value={tools}
              onChange={(e) => setTools(e.target.value)}
              placeholder="e.g. Zendesk, Slack, OpenAI"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="request-description">Describe the workflow</Label>
            <Textarea
              id="request-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="When a new ticket arrives, generate an AI summary and post it to our #support Slack channel..."
              className="rounded-xl min-h-[110px] resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} className="rounded-full px-6 gap-2">
            <Send className="h-4 w-4" /> Submit request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
