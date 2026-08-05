import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { FlowsProvider } from '@/lib/flows-context';
import { Shell } from '@/components/layout/shell';

import Gallery from '@/pages/gallery';
import MyFlows from '@/pages/my-flows';
import ActivityLog from '@/pages/activity';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={Gallery} />
        <Route path="/my-flows" component={MyFlows} />
        <Route path="/activity" component={ActivityLog} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
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
  );
}

export default App;
