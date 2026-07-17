import React, { useState } from "react";
import { User, Lock, Eye, EyeOff, Bell, Link2, BrainCircuit, Check, Moon, Sun, Monitor } from "lucide-react";
import { useDBStore } from "../../store/dbStore";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/Tabs";
import { toast } from "sonner";
import { UserManagement } from "./UserManagement";

export const Settings: React.FC = () => {
  const { currentUser, setCurrentUser } = useDBStore();

  // Profile forms
  const [firstName, setFirstName] = useState(currentUser?.firstName || "Alex");
  const [lastName, setLastName] = useState(currentUser?.lastName || "Mercer");
  const [email, setEmail] = useState(currentUser?.email || "alex@marketingos.com");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password forms
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Notifications
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [slackAlerts, setSlackAlerts] = useState(false);

  // Integrations Placeholders
  const [igClientId, setIgClientId] = useState("489582959281");
  const [igClientSecret, setIgClientSecret] = useState("••••••••••••••••••••••••••••");
  
  // LLM Config Placeholders
  const [llmProvider, setLlmProvider] = useState("gemini-1.5-pro");
  const [llmApiKey, setLlmApiKey] = useState("••••••••••••••••••••••••••••");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are an expert Social Media Marketing Analyst. Analyze the following Instagram campaign metrics and output key wins, funnel issues, actionable recommendations, and next content recommendations."
  );

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setTimeout(() => {
      setCurrentUser({
        id: currentUser?.id || "usr_123",
        firstName,
        lastName,
        email,
      });
      setIsSavingProfile(false);
      toast.success("Profile information updated.");
    }, 600);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setIsSavingPassword(true);
    setTimeout(() => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsSavingPassword(false);
      toast.success("Account password changed successfully.");
    }, 800);
  };

  const handleSavePreferences = () => {
    toast.success("Notification preferences saved.");
  };

  const handleSaveIntegrations = () => {
    toast.success("API credentials stored. Re-initiating webhook hooks.");
  };

  const handleSaveLLM = () => {
    toast.success("LLM analyzer configurations updated.");
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fadeIn">
      {/* Header title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your user profile credentials, API credentials, and LLM integrations.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="api">API Connections</TabsTrigger>
          <TabsTrigger value="llm">LLM Config</TabsTrigger>
        </TabsList>

        {/* 1. PROFILE SETTINGS */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Workspace Profile Details</CardTitle>
              <CardDescription>Configure your identification and display metadata.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveProfile}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <Input
                    label="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
                <Input
                  label="Registered Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-border mt-4 pt-4">
                <Button type="submit" isLoading={isSavingProfile}>
                  Save Profile
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* 2. PASSWORD SETTINGS */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Account Authentication</CardTitle>
              <CardDescription>Ensure your account is protected by updating credentials regularly.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSavePassword}>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Current Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-border mt-4 pt-4">
                <Button type="submit" isLoading={isSavingPassword}>
                  Update Password
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* 3. NOTIFICATIONS SETTINGS */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Webhook & Digest Deliveries</CardTitle>
              <CardDescription>Select which reports and sync summaries arrive in your inbox.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="space-y-0.5">
                  <p className="font-semibold text-foreground">Immediate Error Alerts</p>
                  <p className="text-xs text-muted-foreground">Notify me via email if an Instagram OAuth token expires.</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-gray-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="space-y-0.5">
                  <p className="font-semibold text-foreground">Weekly Agency Digests</p>
                  <p className="text-xs text-muted-foreground">Send a consolidated report of all active campaign reach gains every Monday.</p>
                </div>
                <input
                  type="checkbox"
                  checked={weeklyDigest}
                  onChange={(e) => setWeeklyDigest(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-gray-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pb-1">
                <div className="space-y-0.5">
                  <p className="font-semibold text-foreground">Slack Workspace Notifications</p>
                  <p className="text-xs text-muted-foreground">Push report generation logs and insights summaries directly to agency Slack channel.</p>
                </div>
                <input
                  type="checkbox"
                  checked={slackAlerts}
                  onChange={(e) => setSlackAlerts(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-gray-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-border mt-4 pt-4">
              <Button onClick={handleSavePreferences}>Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* 4. USERS & ROLES SETTINGS */}
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        {/* 5. API CONNECTIONS */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Instagram Graph API OAuth</CardTitle>
              <CardDescription>Integrate Instagram credentials to support campaign syncing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Instagram Client App ID"
                value={igClientId}
                onChange={(e) => setIgClientId(e.target.value)}
              />
              <Input
                label="Instagram Client Secret Key"
                value={igClientSecret}
                onChange={(e) => setIgClientSecret(e.target.value)}
              />
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t border-border mt-4 pt-4">
              <Button onClick={handleSaveIntegrations}>Save Credentials</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* 5. LLM CONFIGURATION */}
        <TabsContent value="llm">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">AI Analytics Insights Model</CardTitle>
              <CardDescription>Configure custom models and system prompt scripts to analyze campaign numbers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="AI Core Model Provider"
                value={llmProvider}
                onChange={(e) => setLlmProvider(e.target.value)}
                options={[
                  { value: "gemini-1.5-pro", label: "Google Gemini 1.5 Pro (Recommended)" },
                  { value: "gemini-1.5-flash", label: "Google Gemini 1.5 Flash" },
                  { value: "gpt-4o", label: "OpenAI GPT-4o" },
                  { value: "claude-3-5-sonnet", label: "Anthropic Claude 3.5 Sonnet" },
                ]}
              />

              <Input
                label="AI Provider API Access Key"
                value={llmApiKey}
                onChange={(e) => setLlmApiKey(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  AI Interpreter System Prompt
                </label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t border-border mt-4 pt-4">
              <Button onClick={handleSaveLLM}>Save LLM Config</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
