import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

type AuthMode = "login" | "signup" | "forgot";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("login");
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        toast({
          title: "Check your email",
          description: "We've sent you a password reset link.",
        });
      } else {
        const { error } = mode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });
        
        if (error) throw error;

        if (mode === "signup") {
          toast({
            title: "Check your email",
            description: "We've sent you a confirmation link.",
          });
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center">
          {mode === "login" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset password"}
        </h2>
        <form onSubmit={handleAuth} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {mode !== "forgot" && (
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          )}
          <Button type="submit" className="w-full">
            {mode === "login" ? "Sign in" : mode === "signup" ? "Sign up" : "Send reset link"}
          </Button>
        </form>
        <div className="flex justify-center gap-4 text-sm">
          {mode === "login" ? (
            <>
              <button
                onClick={() => setMode("signup")}
                className="text-primary hover:underline"
              >
                Create account
              </button>
              <button
                onClick={() => setMode("forgot")}
                className="text-primary hover:underline"
              >
                Forgot password?
              </button>
            </>
          ) : (
            <button
              onClick={() => setMode("login")}
              className="text-primary hover:underline"
            >
              Back to login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;