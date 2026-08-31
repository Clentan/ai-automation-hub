import { useCallback, useEffect, useState } from 'react';
import { LayoutGrid, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { adminFetch, type AdminTemplate } from '@/lib/admin-api';
import { invalidateTemplatesCache } from '@/lib/use-templates';

const TEMPLATE_TYPES = ['Automated', 'Scheduled', 'Instant'] as const;

interface StepDraft {
  title: string;
  description: string;
  serviceId: string;
}

interface Draft {
  id: string;
  name: string;
  description: string;
  type: string;
  categories: string;
  services: string;
  documentation: string;
  webhookUrl: string;
  available: boolean;
  steps: StepDraft[];
}

const EMPTY_DRAFT: Draft = {
  id: '',
  name: '',
  description: '',
  type: 'Automated',
  categories: '',
  services: '',
  documentation: '',
  webhookUrl: '',
  available: false,
  steps: [],
};

function toDraft(t: AdminTemplate): Draft {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    type: t.type,
    categories: t.categories.join(', '),
    services: t.services.join(', '),
    documentation: t.documentation,
    webhookUrl: t.webhookUrl,
    available: t.available,
    steps: t.steps.map((s) => ({ ...s })),
  };
}

function splitList(v: string): string[] {
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function TemplatesPanel({ token, onAuthError }: { token: string | null; onAuthError: () => void }) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<AdminTemplate[] | null>(null);
  // editing: null = closed; '' = creating; otherwise the id being edited
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setTemplates(await adminFetch<AdminTemplate[]>('/admin/templates', token));
    } catch {
      onAuthError();
    }
  }, [token, onAuthError]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setDraft(EMPTY_DRAFT);
    setEditing('');
  };

  const openEdit = (t: AdminTemplate) => {
    setDraft(toDraft(t));
    setEditing(t.id);
  };

  const setField = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const setStep = (i: number, key: keyof StepDraft, value: string) =>
    setDraft((d) => ({
      ...d,
      steps: d.steps.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)),
    }));

  const save = async () => {
    if (!draft.name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    const payload = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      type: draft.type,
      categories: splitList(draft.categories),
      services: splitList(draft.services),
      steps: draft.steps.filter((s) => s.title.trim()),
      available: draft.available,
      documentation: draft.documentation,
      webhookUrl: draft.webhookUrl.trim(),
    };
    setSaving(true);
    try {
      if (editing === '') {
        await adminFetch<AdminTemplate>('/admin/templates', token, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: draft.id.trim() || undefined }),
        });
        toast({ title: 'Template created' });
      } else {
        await adminFetch<AdminTemplate>(`/admin/templates/${editing}`, token, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        toast({ title: 'Template updated' });
      }
      invalidateTemplatesCache();
      setEditing(null);
      await load();
    } catch (e) {
      toast({
        title: 'Could not save template',
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailable = async (t: AdminTemplate) => {
    const prev = templates;
    setTemplates((ts) =>
      (ts ?? []).map((x) => (x.id === t.id ? { ...x, available: !t.available } : x)),
    );
    try {
      await adminFetch(`/admin/templates/${t.id}`, token, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !t.available }),
      });
      invalidateTemplatesCache();
    } catch {
      setTemplates(prev);
      toast({ title: 'Could not update template', variant: 'destructive' });
    }
  };

  if (templates === null) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {templates.length} templates · {templates.filter((t) => t.available).length} live
        </p>
        <Button className="rounded-full gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> New template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center text-muted-foreground">
            No templates yet. Create your first one.
          </CardContent>
        </Card>
      ) : (
        templates.map((t) => (
          <Card key={t.id} className="rounded-2xl">
            <CardContent className="pt-6 flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <LayoutGrid className="h-4 w-4 text-primary shrink-0" />
                  <h2 className="font-semibold">{t.name}</h2>
                  <Badge variant="outline" className="border-0 bg-muted text-muted-foreground">
                    {t.type}
                  </Badge>
                  {t.available ? (
                    <Badge className="border-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" variant="outline">
                      Live
                    </Badge>
                  ) : (
                    <Badge className="border-0 bg-amber-500/10 text-amber-600 dark:text-amber-400" variant="outline">
                      Coming soon
                    </Badge>
                  )}
                  {t.webhookUrl && (
                    <Badge className="border-0 bg-primary/10 text-primary" variant="outline">
                      Webhook set
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>
                <p className="text-xs text-muted-foreground/70 font-mono">{t.id}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Live</span>
                  <Switch checked={t.available} onCheckedChange={() => void toggleAvailable(t)} />
                </div>
                <Button variant="outline" size="sm" className="rounded-full gap-2" onClick={() => openEdit(t)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing === '' ? 'New template' : 'Edit template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editing === '' && (
              <div className="space-y-2">
                <Label htmlFor="tpl-id">ID (optional — auto-generated if blank)</Label>
                <Input
                  id="tpl-id"
                  value={draft.id}
                  onChange={(e) => setField('id', e.target.value)}
                  placeholder="t-22"
                  className="rounded-xl font-mono"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="tpl-name">Name</Label>
              <Input
                id="tpl-name"
                value={draft.name}
                onChange={(e) => setField('name', e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpl-desc">Description</Label>
              <Textarea
                id="tpl-desc"
                value={draft.description}
                onChange={(e) => setField('description', e.target.value)}
                rows={2}
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={draft.type} onValueChange={(v) => setField('type', v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map((ty) => (
                      <SelectItem key={ty} value={ty}>
                        {ty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-3 pb-1">
                <Switch
                  id="tpl-available"
                  checked={draft.available}
                  onCheckedChange={(v) => setField('available', v)}
                />
                <Label htmlFor="tpl-available">Live (not "coming soon")</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpl-cats">Categories (comma-separated)</Label>
              <Input
                id="tpl-cats"
                value={draft.categories}
                onChange={(e) => setField('categories', e.target.value)}
                placeholder="Top picks, AI, Email"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpl-services">Service ids (comma-separated)</Label>
              <Input
                id="tpl-services"
                value={draft.services}
                onChange={(e) => setField('services', e.target.value)}
                placeholder="gmail, openai, slack"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpl-docs">Documentation</Label>
              <Textarea
                id="tpl-docs"
                value={draft.documentation}
                onChange={(e) => setField('documentation', e.target.value)}
                rows={5}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpl-webhook">n8n webhook URL (server-side only)</Label>
              <Input
                id="tpl-webhook"
                value={draft.webhookUrl}
                onChange={(e) => setField('webhookUrl', e.target.value)}
                placeholder="https://…/webhook/…"
                className="rounded-xl font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Runs are proxied to this URL. Callers never see it.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Steps</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-1"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      steps: [...d.steps, { title: '', description: '', serviceId: '' }],
                    }))
                  }
                >
                  <Plus className="h-3.5 w-3.5" /> Add step
                </Button>
              </div>
              {draft.steps.map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_120px_auto] gap-2 items-center">
                  <Input
                    value={s.title}
                    onChange={(e) => setStep(i, 'title', e.target.value)}
                    placeholder="Step title"
                    className="rounded-xl"
                  />
                  <Input
                    value={s.description}
                    onChange={(e) => setStep(i, 'description', e.target.value)}
                    placeholder="Description"
                    className="rounded-xl"
                  />
                  <Input
                    value={s.serviceId}
                    onChange={(e) => setStep(i, 'serviceId', e.target.value)}
                    placeholder="service"
                    className="rounded-xl font-mono"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() =>
                      setDraft((d) => ({ ...d, steps: d.steps.filter((_, idx) => idx !== i) }))
                    }
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button className="rounded-full" disabled={saving} onClick={() => void save()}>
              {saving ? 'Saving…' : editing === '' ? 'Create template' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
