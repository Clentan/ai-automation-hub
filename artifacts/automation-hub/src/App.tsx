import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FlowsProvider } from '@/lib/flows-context';
import { Shell } from '@/components/layout/shell';
import { ThemeProvider } from '@/components/theme-provider';

import Home from '@/pages/home';
import Gallery from '@/pages/gallery';
import MyFlows from '@/pages/my-flows';
import ActivityLog from '@/pages/activity';
import ApiAccess from '@/pages/api-access';
import Learn from '@/pages/learn';
import Settings from '@/pages/settings';
import Admin from '@/pages/admin';
import NotFound from '@/pages/not-found';
import { useEffect, useRef } from 'react';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { ClerkProvider, SignIn, SignUp, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { resetKeysStore } from '@/lib/use-api-keys';
import { WorkspaceChooser } from '@/components/workspace-chooser';

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
function Router() {
  return (
    <Switch>
      {/* REQUIRED — the /*? optional wildcard matches both the bare URL and
          Clerk's OAuth sub-paths (e.g. /sign-in/sso-callback). */}
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route>
        <Shell>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/templates" component={Gallery} />
            <Route path="/my-flows" component={MyFlows} />
            <Route path="/activity" component={ActivityLog} />
            <Route path="/api-access" component={ApiAccess} />
            <Route path="/learn" component={Learn} />
            <Route path="/settings" component={Settings} />
            <Route path="/admin">{() => <Admin />}</Route>
            <Route path="/admin/requests">{() => <Admin initialTab="requests" />}</Route>
            <Route component={NotFound} />
          </Switch>
        </Shell>
      </Route>
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: 'Welcome back',
            subtitle: 'Sign in to manage your automations and API keys',
          },
        },
        signUp: {
          start: {
            title: 'Create your account',
            subtitle: 'Your API keys will work on any device',
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkSessionSync />
        <FlowsProvider>
          <TooltipProvider>
            <Router />
            <WorkspaceChooser />
            <Toaster />
          </TooltipProvider>
        </FlowsProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkSessionSync() {
  const { addListener } = useClerk();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
        resetKeysStore();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener]);

  return null;
}

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: 'hsl(243 75% 59%)',
    colorForeground: 'hsl(222.2 47.4% 11.2%)',
    colorMutedForeground: 'hsl(220 9% 46%)',
    colorDanger: 'hsl(0 72% 51%)',
    colorBackground: 'hsl(0 0% 100%)',
    colorInput: 'hsl(220 33% 98%)',
    colorInputForeground: 'hsl(222.2 47.4% 11.2%)',
    colorNeutral: 'hsl(220 13% 46%)',
    fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-[hsl(220_13%_91%)]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[hsl(222.2_47.4%_11.2%)] font-bold tracking-tight',
    headerSubtitle: 'text-[hsl(220_9%_46%)]',
    socialButtonsBlockButtonText: 'text-[hsl(222.2_47.4%_11.2%)] font-medium',
    formFieldLabel: 'text-[hsl(222.2_47.4%_11.2%)] font-medium',
    footerActionLink: 'text-[hsl(243_75%_59%)] font-semibold hover:text-[hsl(243_75%_50%)]',
    footerActionText: 'text-[hsl(220_9%_46%)]',
    dividerText: 'text-[hsl(220_9%_46%)]',
    identityPreviewEditButton: 'text-[hsl(243_75%_59%)]',
    formFieldSuccessText: 'text-emerald-600',
    alertText: 'text-[hsl(222.2_47.4%_11.2%)]',
    logoBox: 'justify-center',
    logoImage: 'h-10',
    socialButtonsBlockButton: 'border border-[hsl(220_13%_91%)] hover:bg-[hsl(220_33%_98%)]',
    formButtonPrimary: 'bg-[hsl(243_75%_59%)] hover:bg-[hsl(243_75%_52%)] text-white font-semibold rounded-full',
    formFieldInput: 'rounded-lg border-[hsl(220_13%_87%)]',
    footerAction: 'justify-center',
    dividerLine: 'bg-[hsl(220_13%_91%)]',
    alert: 'rounded-xl',
    otpCodeFieldInput: 'rounded-lg',
    formFieldRow: 'gap-2',
    main: 'gap-5',
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      {/* path must be the full browser path — Clerk reads window.location.pathname directly */}
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}
