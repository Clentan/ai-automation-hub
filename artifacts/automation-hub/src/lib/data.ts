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

export const MOCK_TEMPLATES: Template[] = [
  {
    id: 't-1',
    name: 'Draft email replies using AI and save as drafts',
    description: 'Automatically analyzes incoming emails and generates draft replies using OpenAI, saving them in Gmail.',
    author: 'AI Automation Hub',
    type: 'Automated',
    categories: ['Top picks', 'AI', 'Email'],
    usageCount: 142050,
    services: ['gmail', 'openai'],
    createdAt: '2023-10-01T12:00:00Z',
    steps: [
      { title: 'When a new email arrives', description: 'Triggers on new messages in Inbox', serviceId: 'gmail' },
      { title: 'Generate reply', description: 'Creates contextual response', serviceId: 'openai' },
      { title: 'Save draft', description: 'Saves the AI response as a draft', serviceId: 'gmail' }
    ]
  },
  {
    id: 't-2',
    name: 'Notify Slack when an important Notion page is updated',
    description: 'Keep your team in the loop by sending a Slack notification whenever specific Notion databases are modified.',
    author: 'AI Automation Hub',
    type: 'Automated',
    categories: ['Notifications', 'Top picks'],
    usageCount: 89040,
    services: ['notion', 'slack'],
    createdAt: '2023-10-05T10:00:00Z',
    steps: [
      { title: 'Watch Notion page', description: 'Triggers when page properties change', serviceId: 'notion' },
      { title: 'Send channel message', description: 'Posts update to #general', serviceId: 'slack' }
    ]
  },
  {
    id: 't-3',
    name: 'Summarize weekly Jira issues and email report',
    description: 'Every Friday, compile all resolved Jira issues for the week into an email report.',
    author: 'AI Automation Hub',
    type: 'Scheduled',
    categories: ['Email', 'Data collection', 'Calendar'],
    usageCount: 54300,
    services: ['jira', 'gmail'],
    createdAt: '2023-11-01T08:00:00Z',
    steps: [
      { title: 'Run on schedule', description: 'Executes every Friday at 4 PM', serviceId: 'jira' },
      { title: 'Query resolved issues', description: 'Fetches sprint data', serviceId: 'jira' },
      { title: 'Send email report', description: 'Emails project manager', serviceId: 'gmail' }
    ]
  },
  {
    id: 't-4',
    name: 'Sync GitHub issues to Trello cards',
    description: 'Automatically create a Trello card when a new GitHub issue is opened with specific labels.',
    author: 'AI Automation Hub',
    type: 'Automated',
    categories: ['Data collection', 'Top picks'],
    usageCount: 204500,
    services: ['github', 'trello'],
    createdAt: '2023-09-15T09:00:00Z',
    steps: [
      { title: 'New issue opened', description: 'Listens for GitHub issues', serviceId: 'github' },
      { title: 'Create Trello card', description: 'Adds card to backlog list', serviceId: 'trello' }
    ]
  },
  {
    id: 't-5',
    name: 'Auto-approve low risk expense reports',
    description: 'Uses AI to analyze expense reports and automatically approves them if they fall under the low-risk threshold.',
    author: 'AI Automation Hub',
    type: 'Automated',
    categories: ['Approval', 'AI'],
    usageCount: 32100,
    services: ['google-drive', 'openai', 'slack'],
    createdAt: '2023-12-10T14:00:00Z',
    steps: [
      { title: 'New spreadsheet row', description: 'Triggered on new expense submission', serviceId: 'google-drive' },
      { title: 'Evaluate risk', description: 'AI categorizes expense risk', serviceId: 'openai' },
      { title: 'Notify on approval', description: 'Messages the submitter', serviceId: 'slack' }
    ]
  },
  {
    id: 't-6',
    name: 'Push Discord announcements from Notion',
    description: 'When a new announcement is drafted and marked as "Published" in Notion, send it to Discord.',
    author: 'AI Automation Hub',
    type: 'Automated',
    categories: ['Notifications'],
    usageCount: 15600,
    services: ['notion', 'discord'],
    createdAt: '2024-01-05T11:00:00Z',
    steps: [
      { title: 'Status changed to Published', description: 'Watches Notion database', serviceId: 'notion' },
      { title: 'Send Discord message', description: 'Posts to #announcements', serviceId: 'discord' }
    ]
  },
  {
    id: 't-7',
    name: 'Save email attachments to Google Drive',
    description: 'Automatically extracts attachments from incoming emails and organizes them into Google Drive folders by sender.',
    author: 'AI Automation Hub',
    type: 'Automated',
    categories: ['Data collection', 'Email', 'Top picks'],
    usageCount: 412000,
    services: ['gmail', 'google-drive'],
    createdAt: '2023-05-12T08:30:00Z',
    steps: [
      { title: 'On new email with attachment', description: 'Filters emails with files', serviceId: 'gmail' },
      { title: 'Upload file', description: 'Saves to designated Drive folder', serviceId: 'google-drive' }
    ]
  },
  {
    id: 't-8',
    name: 'Send daily reminders from your Calendar',
    description: 'Get a morning briefing in Slack outlining your meetings for the day.',
    author: 'AI Automation Hub',
    type: 'Scheduled',
    categories: ['Calendar', 'Notifications', 'Mobile'],
    usageCount: 89000,
    services: ['microsoft', 'slack'],
    createdAt: '2023-06-20T07:00:00Z',
    steps: [
      { title: 'Every morning at 8 AM', description: 'Scheduled trigger', serviceId: 'microsoft' },
      { title: 'Fetch today events', description: 'Gets Outlook calendar events', serviceId: 'microsoft' },
      { title: 'Send daily digest', description: 'Posts list to personal Slack channel', serviceId: 'slack' }
    ]
  },
  {
    id: 't-9',
    name: 'Generate meeting summaries using AI',
    description: 'When a meeting recording is uploaded to Drive, generate a summary and action items.',
    author: 'AI Automation Hub',
    type: 'Automated',
    categories: ['AI', 'Data collection'],
    usageCount: 67500,
    services: ['google-drive', 'openai', 'notion'],
    createdAt: '2023-08-11T13:45:00Z',
    steps: [
      { title: 'New file in folder', description: 'Watches Recordings folder', serviceId: 'google-drive' },
      { title: 'Transcribe and summarize', description: 'AI extracts key points', serviceId: 'openai' },
      { title: 'Create meeting notes', description: 'Saves summary to Notion', serviceId: 'notion' }
    ]
  },
  {
    id: 't-10',
    name: 'Request approval for new GitHub PRs',
    description: 'Sends an interactive Slack message requesting code review approval when a PR is marked ready.',
    author: 'AI Automation Hub',
    type: 'Automated',
    categories: ['Approval', 'Notifications'],
    usageCount: 45000,
    services: ['github', 'slack'],
    createdAt: '2023-11-22T09:15:00Z',
    steps: [
      { title: 'PR Ready for Review', description: 'Triggers on GitHub PR state change', serviceId: 'github' },
      { title: 'Request Approval', description: 'Sends Slack message with Approve/Reject buttons', serviceId: 'slack' }
    ]
  },
  {
    id: 't-11',
    name: 'Extract data from invoices using AI',
    description: 'Process incoming invoice PDFs, extract line items and totals, and append them to a spreadsheet.',
    author: 'AI Automation Hub',
    type: 'Automated',
    categories: ['AI', 'Data collection', 'Email'],
    usageCount: 112000,
    services: ['gmail', 'openai', 'google-drive'],
    createdAt: '2024-02-14T10:00:00Z',
    steps: [
      { title: 'Email with Invoice', description: 'Filters incoming emails', serviceId: 'gmail' },
      { title: 'Extract Data', description: 'AI reads PDF contents', serviceId: 'openai' },
      { title: 'Add Spreadsheet Row', description: 'Logs data to finance sheet', serviceId: 'google-drive' }
    ]
  },
  {
    id: 't-12',
    name: 'Weekly team mood check-in',
    description: 'Sends a quick poll to Slack every Friday and records the results.',
    author: 'AI Automation Hub',
    type: 'Scheduled',
    categories: ['Data collection', 'Calendar'],
    usageCount: 23400,
    services: ['slack', 'google-drive'],
    createdAt: '2023-04-18T15:00:00Z',
    steps: [
      { title: 'Friday at 3 PM', description: 'Scheduled trigger', serviceId: 'slack' },
      { title: 'Send Poll', description: 'Posts interactive poll to Slack', serviceId: 'slack' },
      { title: 'Record Responses', description: 'Saves answers to Sheets', serviceId: 'google-drive' }
    ]
  },
  {
    id: 't-13',
    name: 'Trigger a build from a Slack command',
    description: 'Type a slash command in Slack to instantly trigger a GitHub Actions build.',
    author: 'AI Automation Hub',
    type: 'Instant',
    categories: ['Mobile', 'Top picks'],
    usageCount: 88000,
    services: ['slack', 'github'],
    createdAt: '2023-07-30T12:00:00Z',
    steps: [
      { title: 'Slack command invoked', description: '/build command used', serviceId: 'slack' },
      { title: 'Dispatch workflow', description: 'Triggers repository dispatch', serviceId: 'github' }
    ]
  },
  {
    id: 't-14',
    name: 'Draft blog posts from Trello ideas',
    description: 'When a Trello card is moved to "Drafting", use AI to generate an outline.',
    author: 'AI Automation Hub',
    type: 'Automated',
    categories: ['AI', 'Data collection'],
    usageCount: 19500,
    services: ['trello', 'openai', 'notion'],
    createdAt: '2024-01-20T16:20:00Z',
    steps: [
      { title: 'Card moved to list', description: 'Watches Drafting list', serviceId: 'trello' },
      { title: 'Generate outline', description: 'AI expands on card description', serviceId: 'openai' },
      { title: 'Create Notion doc', description: 'Saves draft for editing', serviceId: 'notion' }
    ]
  },
  {
    id: 't-15',
    name: 'Sync Microsoft To Do with Notion tasks',
    description: 'Keep your personal Microsoft tasks in sync with your team\'s Notion database.',
    author: 'AI Automation Hub',
    type: 'Automated',
    categories: ['Data collection', 'Mobile'],
    usageCount: 56000,
    services: ['microsoft', 'notion'],
    createdAt: '2023-09-05T08:45:00Z',
    steps: [
      { title: 'New Task created', description: 'Triggers on To Do item', serviceId: 'microsoft' },
      { title: 'Create Database Item', description: 'Adds task to Notion', serviceId: 'notion' }
    ]
  },
  {
    id: 't-16',
    name: 'Auto-triage Jira tickets with AI',
    description: 'Reads incoming bug reports and automatically assigns priority and components.',
    author: 'AI Automation Hub',
    type: 'Automated',
    categories: ['AI', 'Data collection'],
    usageCount: 72000,
    services: ['jira', 'openai'],
    createdAt: '2024-03-01T11:30:00Z',
    steps: [
      { title: 'New Issue created', description: 'Listens for unassigned bugs', serviceId: 'jira' },
      { title: 'Analyze report', description: 'AI assesses severity', serviceId: 'openai' },
      { title: 'Update Issue', description: 'Sets labels and priority', serviceId: 'jira' }
    ]
  },
  {
    id: 't-17',
    name: 'Post daily metrics to Discord',
    description: 'Fetches stats from a spreadsheet and posts a beautiful summary to Discord every morning.',
    author: 'AI Automation Hub',
    type: 'Scheduled',
    categories: ['Notifications', 'Calendar'],
    usageCount: 29000,
    services: ['google-drive', 'discord'],
    createdAt: '2023-10-15T09:00:00Z',
    steps: [
      { title: 'Daily at 9 AM', description: 'Scheduled trigger', serviceId: 'google-drive' },
      { title: 'Get Cell Values', description: 'Reads KPIs from Sheets', serviceId: 'google-drive' },
      { title: 'Send Embed Message', description: 'Formats and posts to Discord', serviceId: 'discord' }
    ]
  },
  {
    id: 't-18',
    name: 'Onboard new team members',
    description: 'When a new user is added to Slack, create their Trello board and send a welcome email.',
    author: 'AI Automation Hub',
    type: 'Automated',
    categories: ['Notifications', 'Email'],
    usageCount: 41000,
    services: ['slack', 'trello', 'gmail'],
    createdAt: '2023-11-11T10:00:00Z',
    steps: [
      { title: 'New User Joined', description: 'Triggers on Slack workspace join', serviceId: 'slack' },
      { title: 'Create Board', description: 'Duplicates onboarding template', serviceId: 'trello' },
      { title: 'Send Welcome Email', description: 'Emails onboarding guide', serviceId: 'gmail' }
    ]
  },
  {
    id: 't-19',
    name: 'Instant bug report from mobile',
    description: 'Tap a button on your phone to instantly create a Jira ticket with pre-filled context.',
    author: 'AI Automation Hub',
    type: 'Instant',
    categories: ['Mobile', 'Data collection'],
    usageCount: 15400,
    services: ['microsoft', 'jira'],
    createdAt: '2024-02-28T14:00:00Z',
    steps: [
      { title: 'Button pressed', description: 'Fired from Power Automate app', serviceId: 'microsoft' },
      { title: 'Create Issue', description: 'Logs bug with current timestamp', serviceId: 'jira' }
    ]
  },
  {
    id: 't-20',
    name: 'Summarize long emails on demand',
    description: 'Forward a long email to a specific address to get a quick AI summary sent back.',
    author: 'AI Automation Hub',
    type: 'Automated',
    categories: ['AI', 'Email', 'Mobile'],
    usageCount: 95000,
    services: ['gmail', 'openai'],
    createdAt: '2023-12-05T08:00:00Z',
    steps: [
      { title: 'Email received', description: 'Filters to specific alias', serviceId: 'gmail' },
      { title: 'Summarize content', description: 'AI condenses the thread', serviceId: 'openai' },
      { title: 'Reply with summary', description: 'Sends back the short version', serviceId: 'gmail' }
    ]
  }
];
