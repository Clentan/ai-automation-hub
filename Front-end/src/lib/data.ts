export type TemplateType = 'Automated' | 'Scheduled' | 'Instant';

export interface AutomationStep {
  title: string;
  description: string;
  serviceId: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  author: string;
  type: TemplateType;
  categories: string[];
  usageCount: number;
  services: string[];
  steps: AutomationStep[];
  createdAt: string;
  /** Live template — usable even while TEMPLATES_COMING_SOON is on. */
  available?: boolean;
  /** Longer documentation shown in the template detail dialog. */
  documentation?: string;
}

/** True when this template should show as "Coming soon" and be unusable. */
export function isComingSoon(t: Template): boolean {
  return TEMPLATES_COMING_SOON && !t.available;
}

// When true, every template shows as "Coming soon" and can't be used yet.
export const TEMPLATES_COMING_SOON = true;

export const CATEGORIES = [
  'All',
  'Top picks',
  'AI',
  'Email',
  'Data collection',
  'Approval',
  'Notifications',
  'Calendar',
  'Mobile'
];
