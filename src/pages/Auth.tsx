import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

type AuthMode = "login" | "signup" | "forgot";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "Success!",
          description: "Please check your email to verify your account.",
        });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        toast({
          title: "Success!",
          description: "Please check your email for password reset instructions.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">
            {mode === "login"
              ? "Sign in to your account"
              : mode === "signup"
              ? "Create a new account"
              : "Reset your password"}
          </h2>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {mode !== "forgot" && (
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={mode !== "forgot"}
                minLength={6}
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : mode === "login"
              ? "Sign in"
              : mode === "signup"
              ? "Sign up"
              : "Reset password"}
          </Button>
        </form>

        <div className="space-y-4">
          {mode === "login" && (
            <>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setMode("signup")}
              >
                Don't have an account? Sign up
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setMode("forgot")}
              >
                Forgot your password?
              </Button>
            </>
          )}

          {mode === "signup" && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setMode("login")}
            >
              Already have an account? Sign in
            </Button>
          )}

          {mode === "forgot" && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setMode("login")}
            >
              Back to sign in
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}