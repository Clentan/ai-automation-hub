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
import { MOCK_TEMPLATES, isComingSoon } from '@/lib/data';
import { useFlowsContext } from '@/lib/flows-context';
import { ServiceIcon } from '@/components/icons/service-icons';
import { formatDistanceToNow } from 'date-fns';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="flex-1 overflow-auto bg-secondary/10">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="px-6 py-6 md:px-10 [@media(min-height:820px)]:py-8 md:[@media(min-height:820px)]:py-12 max-w-7xl 2xl:max-w-[1500px] w-full mx-auto space-y-8 [@media(min-height:820px)]:space-y-12"
        >
          {/* Hero */}
          <motion.section variants={item} className="space-y-5 max-w-3xl">
            <h1 className="text-3xl md:text-4xl [@media(min-height:820px)]:md:text-5xl font-bold tracking-tight text-foreground leading-tight">
              Automate the busywork. <br />
              <span className="text-primary">Focus on the work.</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
              Connect your favorite tools in seconds. Start from a proven template, 
              switch it on, and let it run reliably in the background.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/templates">
                <Button size="lg" className="rounded-full shadow-md gap-2 px-6">
                  <LayoutGrid className="h-4 w-4" />
                  Browse templates
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/my-flows">
                <Button size="lg" variant="outline" className="rounded-full gap-2 px-6 bg-background">
                  <CheckSquare className="h-4 w-4" />
                  My active flows
                </Button>
              </Link>
            </div>
          </motion.section>

          {/* Stats */}
          <motion.section variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <Card className="bg-card shadow-sm border-border/50 hover:border-primary/20 transition-colors">
              <CardContent className="p-6 flex items-center gap-5">
                <div className="bg-primary/10 text-primary p-3.5 rounded-2xl">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">{activeFlows}</div>
                  <div className="text-sm font-medium text-muted-foreground mt-0.5">Active flows</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card shadow-sm border-border/50 hover:border-primary/20 transition-colors">
              <CardContent className="p-6 flex items-center gap-5">
                <div className="bg-primary/10 text-primary p-3.5 rounded-2xl">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">{formatCount(totalRuns)}</div>
                  <div className="text-sm font-medium text-muted-foreground mt-0.5">Total runs executed</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card shadow-sm border-border/50 hover:border-primary/20 transition-colors">
              <CardContent className="p-6 flex items-center gap-5">
                <div className="bg-primary/10 text-primary p-3.5 rounded-2xl">
                  <LayoutGrid className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">{MOCK_TEMPLATES.length}</div>
                  <div className="text-sm font-medium text-muted-foreground mt-0.5">Templates available</div>
                  <div className="text-xs font-medium mt-1 flex items-center gap-2">
                    <span className="text-primary">{MOCK_TEMPLATES.filter((t) => !isComingSoon(t)).length} active</span>
                    <span className="text-muted-foreground/60">·</span>
                    <span className="text-muted-foreground">{MOCK_TEMPLATES.filter(isComingSoon).length} coming soon</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Popular templates */}
          <motion.section variants={item} className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Popular templates</h2>
              <Link href="/templates">
                <Button variant="ghost" className="gap-1.5 text-primary rounded-full hover:bg-primary/10">
                  View all <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {popular.map((t) => (
                <Link key={t.id} href="/templates">
                  <Card className={`h-full cursor-pointer transition-all duration-300 group rounded-2xl bg-card border-border/60 relative ${isComingSoon(t) ? 'opacity-60 grayscale' : 'hover:shadow-md hover:border-primary/30'}`}>
                    {isComingSoon(t) && (
                      <Badge className="absolute -top-2.5 right-4 z-20 rounded-full bg-amber-500 hover:bg-amber-500 text-white border-0 shadow-sm px-3">
                        Coming soon
                      </Badge>
                    )}
                    <CardContent className="p-5 flex flex-col gap-4 h-full">
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {t.services.slice(0, 3).map((s, index) => (
                            <div
                              key={s}
                              className="bg-white border-2 border-card rounded-full h-8 w-8 flex items-center justify-center shadow-sm relative transition-transform group-hover:-translate-y-0.5"
                              style={{ zIndex: 10 - index, transitionDelay: `${index * 50}ms` }}
                            >
                              <ServiceIcon serviceId={s} className="h-4 w-4" />
                            </div>
                          ))}
                        </div>
                        <Badge variant="secondary" className="text-[10px] font-medium uppercase tracking-wider bg-secondary/60">
                          {t.type}
                        </Badge>
                      </div>
                      <div className="font-semibold leading-tight line-clamp-2 text-[15px] group-hover:text-primary transition-colors">{t.name}</div>
                      <div className="mt-auto flex items-center gap-1.5 text-xs font-medium text-muted-foreground pt-3 border-t border-border/50">
                        By {t.author}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.section>

          {/* Recent activity */}
          <motion.section variants={item} className="space-y-5 pb-10">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Recent activity</h2>
              <Link href="/activity">
                <Button variant="ghost" className="gap-1.5 text-primary rounded-full hover:bg-primary/10">
                  View all <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            {recentActivity.length === 0 ? (
              <Card className="border-dashed border-border/60 bg-transparent">
                <CardContent className="p-10 flex flex-col items-center text-center gap-4">
                  <div className="bg-primary/5 p-4 rounded-full">
                    <Activity className="h-8 w-8 text-primary/60" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-foreground">No activity yet</div>
                    <p className="text-sm text-muted-foreground max-w-sm mt-1">
                      Create a flow from a template and turn it on — its execution logs will show up here.
                    </p>
                  </div>
                  <Link href="/templates">
                    <Button variant="outline" className="gap-2 mt-2 rounded-full bg-background shadow-sm">
                      Browse templates <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card shadow-sm border-border/50 rounded-2xl overflow-hidden">
                <CardContent className="p-0 divide-y divide-border/50">
                  {recentActivity.map((a) => (
                    <div key={a.id} className="flex items-center gap-4 px-6 py-4 hover:bg-secondary/20 transition-colors">
                      <div className="relative flex items-center justify-center shrink-0">
                        <div className={`h-2.5 w-2.5 rounded-full ${a.status === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_theme(colors.emerald.500)]' : 'bg-red-500 shadow-[0_0_8px_theme(colors.red.500)]'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-medium truncate text-foreground">{a.flowName}</div>
                        <div className="text-xs font-medium text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                      <Badge
                        variant={a.status === 'success' ? 'secondary' : 'destructive'}
                        className={`text-xs font-medium ${a.status === 'success' ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' : ''}`}
                      >
                        {a.status === 'success' ? 'Succeeded' : 'Failed'}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
}
