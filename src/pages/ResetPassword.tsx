import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/providers/trpcClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, CheckCircle2 } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const resetPassword = trpc.auth.resetPassword.useMutation({
    onError: (e) => {
      setError(e.message);
      toast.error(e.message);
    },
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    resetPassword.mutate({ token, password });
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-secondary/30 via-background to-background">
        <Card className="w-full max-w-sm shadow-lifted">
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            This reset link is missing its token. Please use the link from your email, or{" "}
            <Link to="/forgot-password" className="text-primary hover:underline">
              request a new one
            </Link>
            .
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-secondary/30 via-background to-background">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Card className="shadow-lifted">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <KeyRound className="h-6 w-6" />
            </div>
            <CardTitle className="font-display text-2xl">Choose a new password</CardTitle>
          </CardHeader>
          <CardContent>
            {resetPassword.isSuccess ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="text-sm text-muted-foreground">Your password has been reset. Please sign in again.</p>
                <Button className="w-full rounded-full" onClick={() => navigate("/login")}>
                  Go to sign in
                </Button>
              </motion.div>
            ) : (
              <form className="space-y-4" onSubmit={submit}>
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="New password (12+ characters)"
                  autoComplete="new-password"
                  minLength={12}
                  required
                />
                <Input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  minLength={12}
                  required
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button className="w-full rounded-full" disabled={resetPassword.isPending}>
                  {resetPassword.isPending ? "Resetting…" : "Reset password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
