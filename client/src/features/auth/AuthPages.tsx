import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail, User as UserIcon } from "lucide-react";
import { loginSchema, signupSchema, forgotPasswordSchema } from "../../schemas";
import { AuthService } from "../../services/authService";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { toast } from "sonner";
import { z } from "zod";
import { useDBStore } from "../../store/dbStore";

type AuthMode = "login" | "signup" | "forgot";

export const AuthPages: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser, isAuthLoading } = useDBStore((state) => state);

  // If they are already logged in and try to visit /login, bounce them back to the dashboard
  React.useEffect(() => {
    if (!isAuthLoading && currentUser) {
      navigate("/");
    }
  }, [currentUser, isAuthLoading, navigate]);

  // 1. Form hooks setup
  const loginForm = useForm<any>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const signupForm = useForm<any>({
    resolver: zodResolver(signupSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" },
  });

  const forgotForm = useForm<any>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  // 2. Submit Handlers
  const onLoginSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      await AuthService.login(data);
      toast.success("Welcome back! Login successful.");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const onSignupSubmit = async (data: z.infer<typeof signupSchema>) => {
    setIsLoading(true);
    try {
      const result = await AuthService.signup(data);
      if (result && result.requiresEmailVerification) {
        toast.success("Account created! Please check your email to verify your account.", { duration: 10000 });
        setMode("login");
      } else {
        toast.success("Account created successfully! Welcome to Marketing OS.");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotSubmit = async (data: z.infer<typeof forgotPasswordSchema>) => {
    setIsLoading(true);
    try {
      await AuthService.forgotPassword(data.email);
      toast.success("Reset link sent! Please check your email inbox.");
      setMode("login");
    } catch (err: any) {
      toast.error(err.message || "Could not send reset link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-950 transition-colors">
      <div className="w-full max-w-md">
        
        {/* Branding header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex w-10 h-10 rounded bg-primary items-center justify-center mb-1 shadow-sm">
            <span className="text-primary-foreground font-bold text-xl">M</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Marketing OS
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login" && "Sign in to manage your agency clients"}
            {mode === "signup" && "Create your agency workspace"}
            {mode === "forgot" && "Reset your portal access password"}
          </p>
        </div>

        {/* Auth form card */}
        <Card className="border border-border">
          {mode !== "forgot" && (
            <div className="flex border-b border-border">
              <button
                className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  mode === "login"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => {
                  setMode("login");
                  loginForm.reset();
                }}
              >
                Sign In
              </button>
              <button
                className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  mode === "signup"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => {
                  setMode("signup");
                  signupForm.reset();
                }}
              >
                Create Account
              </button>
            </div>
          )}

          <CardContent className="pt-6">
            {/* LOGIN FORM */}
            {mode === "login" && (
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <Input
                  label="Work Email"
                  placeholder="name@agency.com"
                  error={loginForm.formState.errors.email?.message}
                  {...loginForm.register("email")}
                />
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-foreground hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pr-10 ${
                        loginForm.formState.errors.password ? "border-destructive focus-visible:ring-destructive" : ""
                      }`}
                      {...loginForm.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-xs text-destructive font-medium">{loginForm.formState.errors.password.message?.toString()}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    className="h-4 w-4 rounded border-gray-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                    {...loginForm.register("rememberMe")}
                  />
                  <label htmlFor="rememberMe" className="text-sm font-medium leading-none cursor-pointer">
                    Remember me on this device
                  </label>
                </div>

                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Sign In to Workspace
                </Button>
              </form>
            )}

            {/* SIGNUP FORM */}
            {mode === "signup" && (
              <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="First Name"
                    placeholder="Alex"
                    error={signupForm.formState.errors.firstName?.message}
                    {...signupForm.register("firstName")}
                  />
                  <Input
                    label="Last Name"
                    placeholder="Mercer"
                    error={signupForm.formState.errors.lastName?.message}
                    {...signupForm.register("lastName")}
                  />
                </div>
                
                <Input
                  label="Work Email"
                  placeholder="name@agency.com"
                  error={signupForm.formState.errors.email?.message}
                  {...signupForm.register("email")}
                />

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pr-10 ${
                        signupForm.formState.errors.password ? "border-destructive focus-visible:ring-destructive" : ""
                      }`}
                      {...signupForm.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {signupForm.formState.errors.password && (
                    <p className="text-xs text-destructive font-medium">{signupForm.formState.errors.password.message?.toString()}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      signupForm.formState.errors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""
                    }`}
                    {...signupForm.register("confirmPassword")}
                  />
                  {signupForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive font-medium">{signupForm.formState.errors.confirmPassword.message?.toString()}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Create Workspace
                </Button>
              </form>
            )}

            {/* FORGOT PASSWORD FORM */}
            {mode === "forgot" && (
              <form onSubmit={forgotForm.handleSubmit(onForgotSubmit)} className="space-y-4">
                <CardHeader className="p-0 pb-2">
                  <CardTitle className="text-base font-bold">Trouble Logging In?</CardTitle>
                  <CardDescription>
                    Enter your email address and we'll send a password recovery reset link to restore access.
                  </CardDescription>
                </CardHeader>

                <Input
                  label="Work Email"
                  placeholder="name@agency.com"
                  error={forgotForm.formState.errors.email?.message}
                  {...forgotForm.register("email")}
                />

                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Send Recovery Link
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      loginForm.reset();
                    }}
                    className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-foreground hover:underline cursor-pointer"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
