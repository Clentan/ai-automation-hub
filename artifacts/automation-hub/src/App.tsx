import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
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
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/templates" component={Gallery} />
        <Route path="/my-flows" component={MyFlows} />
        <Route path="/activity" component={ActivityLog} />
        <Route path="/api-access" component={ApiAccess} />
        <Route path="/learn" component={Learn} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <FlowsProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </FlowsProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
