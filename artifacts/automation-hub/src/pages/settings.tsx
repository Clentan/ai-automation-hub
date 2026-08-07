import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Bell, Monitor, AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/lib/use-settings';
import { revokeAllKeys } from '@/lib/use-api-keys';
import { useUser } from '@clerk/react';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Settings() {
  const { settings, updateSettings, isLoaded: settingsLoaded, unauthorized: settingsUnauthorized } = useSettings();
  const { user, isLoaded } = useUser();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const email = user?.primaryEmailAddress?.emailAddress ?? '';

  useEffect(() => {
    if (isLoaded && user) {
      setName(user.fullName ?? '');
    }
  }, [isLoaded, user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    const trimmed = name.trim();
    const [firstName, ...rest] = trimmed.split(/\s+/);
    setSaving(true);
    try {
      await user.update({ firstName: firstName ?? '', lastName: rest.join(' ') });
      setName(user.fullName ?? trimmed);
      toast({
        title: "Profile updated",
        description: "Your account name has been saved successfully.",
      });
    } catch (e) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : "Could not update your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClearData = async () => {
    // Revoke server-issued API keys before dropping this browser's identity,
    // otherwise the keys stay active but become unmanageable.
    try {
      await revokeAllKeys();
    } catch {
      // Best effort — still clear local data.
    }
    localStorage.removeItem('ai-automation-hub-flows');
    localStorage.removeItem('ai-automation-hub-activity');
    localStorage.removeItem('ai-automation-hub-api-key');
    localStorage.removeItem('ai-automation-hub-template-keys');
    localStorage.removeItem('ai-automation-hub-template-requests');
    localStorage.removeItem('ai-automation-hub-client-id');
    localStorage.removeItem('ai-automation-hub-settings'); // legacy local-only preference
    toast({
      title: "Data cleared",
      description: "All local flows, activity, and API keys have been deleted.",
      variant: "destructive"
    });
    // Hard refresh to reset context, respecting the app's base path
    window.location.href = import.meta.env.BASE_URL;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="bg-background sticky top-0 z-10 px-6 py-5 [@media(min-height:820px)]:py-8">
        <div className="max-w-3xl xl:max-w-5xl mx-auto w-full flex items-center gap-3">
          <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
            <SettingsIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your account preferences and application data.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-secondary/10">
        <div className="p-6 max-w-3xl xl:max-w-5xl mx-auto w-full space-y-8 pb-10 [@media(min-height:820px)]:pb-20">
          
          {/* Profile Section */}
          <motion.section 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" /> Profile
                </CardTitle>
                <CardDescription>
                  Your account information from your sign-in profile.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isLoaded ? (
                  <p className="text-sm text-muted-foreground">Loading your account…</p>
                ) : !user ? (
                  <p className="text-sm text-muted-foreground">Sign in to manage your profile.</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className="max-w-md"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={email} 
                        readOnly
                        disabled
                        className="max-w-md"
                      />
                      <p className="text-xs text-muted-foreground">
                        Your email is managed by your sign-in account and can't be changed here.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="border-t bg-secondary/20 pt-4">
                <Button onClick={handleSaveProfile} disabled={!user || saving} className="rounded-full shadow-sm">
                  {saving ? 'Saving…' : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>
          </motion.section>

          {/* Preferences Section */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Monitor className="h-5 w-5 text-primary" /> Preferences
                </CardTitle>
                <CardDescription>
                  Customize how the application looks and behaves.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <Label className="text-base">Theme</Label>
                    <p className="text-sm text-muted-foreground">Select your preferred color scheme.</p>
                  </div>
                  <Select value={theme || 'system'} onValueChange={setTheme}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between gap-3 pt-4 border-t">
                  <div className="space-y-0.5 min-w-0">
                    <Label className="text-base flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" /> Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {settingsUnauthorized
                        ? 'Sign in to receive weekly digests of your automation runs.'
                        : 'Receive weekly digests of your automation runs at your account email.'}
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    disabled={!settingsLoaded || settingsUnauthorized}
                    onCheckedChange={(checked) => {
                      updateSettings({ notifications: checked }).catch((e) => {
                        toast({
                          title: 'Could not save preference',
                          description: e instanceof Error ? e.message : 'Please try again.',
                          variant: 'destructive',
                        });
                      });
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Danger Zone Section */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-red-500/20 shadow-sm bg-red-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" /> Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions that affect your data and integrations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-red-200 dark:border-red-900/50 rounded-xl bg-background">
                  <div>
                    <h4 className="font-semibold text-foreground">Clear Local Data</h4>
                    <p className="text-sm text-muted-foreground max-w-sm mt-1">
                      Permanently delete all your flows, activity logs, and API key from this browser. Your sign-in account is not affected. This cannot be undone.
                    </p>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="shrink-0 gap-2 rounded-full">
                        <Trash2 className="h-4 w-4" /> Clear Data
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete your active flows, clear your activity history, and remove your API key from this browser. Your account and sign-in are not affected. Any connected tools will stop working until you generate a new key and update them.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearData} className="bg-red-600 hover:bg-red-700 text-white rounded-full">
                          Yes, clear everything
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </motion.section>

        </div>
      </div>
    </div>
  );
}
