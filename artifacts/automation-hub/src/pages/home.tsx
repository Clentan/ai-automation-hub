import { Link } from 'wouter';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  LayoutGrid,
  Activity,
  CheckSquare,
  Zap,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MOCK_TEMPLATES } from '@/lib/data';
import { useFlowsContext } from '@/lib/flows-context';
import { ServiceIcon } from '@/components/icons/service-icons';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function formatCount(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export default function Home() {
  const { flows, activity } = useFlowsContext();

  const activeFlows = flows.filter((f) => f.status === 'on').length;
  const totalRuns = flows.reduce((sum, f) => sum + f.runCount, 0);
  const recentActivity = activity.slice(0, 4);
  const popular = [...MOCK_TEMPLATES]
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 4);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex-1 px-6 py-8 md:px-10 md:py-10 max-w-6xl w-full mx-auto space-y-10"
    >
      {/* Hero */}
      <motion.section variants={item} className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Welcome to AI Automation Hub
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Automate the busywork between your favorite tools. Start from a
          template, switch it on, and let it run.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/templates">
            <Button className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Browse templates
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/my-flows">
            <Button variant="outline" className="gap-2">
              <CheckSquare className="h-4 w-4" />
              My flows
            </Button>
          </Link>
        </div>
      </motion.section>

      {/* Stats */}
      <motion.section variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-primary/10 text-primary p-2.5 rounded-md">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{activeFlows}</div>
              <div className="text-sm text-muted-foreground">Active flows</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-primary/10 text-primary p-2.5 rounded-md">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{formatCount(totalRuns)}</div>
              <div className="text-sm text-muted-foreground">Total runs</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-primary/10 text-primary p-2.5 rounded-md">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{MOCK_TEMPLATES.length}</div>
              <div className="text-sm text-muted-foreground">Templates available</div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Popular templates */}
      <motion.section variants={item} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Popular templates</h2>
          <Link href="/templates">
            <Button variant="ghost" size="sm" className="gap-1 text-primary">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {popular.map((t) => (
            <Link key={t.id} href="/templates">
              <Card className="h-full cursor-pointer hover-elevate transition-shadow">
                <CardContent className="p-5 flex flex-col gap-3 h-full">
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-1.5">
                      {t.services.slice(0, 3).map((s) => (
                        <div
                          key={s}
                          className="bg-background border rounded-md p-1.5 shadow-sm"
                        >
                          <ServiceIcon serviceId={s} className="h-4 w-4" />
                        </div>
                      ))}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {t.type}
                    </Badge>
                  </div>
                  <div className="font-medium leading-snug line-clamp-2">{t.name}</div>
                  <div className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {formatCount(t.usageCount)} uses
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* Recent activity */}
      <motion.section variants={item} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Recent activity</h2>
          <Link href="/activity">
            <Button variant="ghost" size="sm" className="gap-1 text-primary">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        {recentActivity.length === 0 ? (
          <Card>
            <CardContent className="p-8 flex flex-col items-center text-center gap-3">
              <div className="bg-muted p-3 rounded-full">
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="font-medium">No activity yet</div>
              <p className="text-sm text-muted-foreground max-w-sm">
                Create a flow from a template and turn it on — its runs will show
                up here.
              </p>
              <Link href="/templates">
                <Button size="sm" variant="outline" className="gap-2 mt-1">
                  Browse templates <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0 divide-y">
              {recentActivity.map((a) => (
                <div key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span
                    className={
                      a.status === 'success'
                        ? 'h-2 w-2 rounded-full bg-emerald-500'
                        : 'h-2 w-2 rounded-full bg-red-500'
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.flowName}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(a.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <Badge
                    variant={a.status === 'success' ? 'secondary' : 'destructive'}
                    className="text-xs capitalize"
                  >
                    {a.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </motion.section>
    </motion.div>
  );
}
