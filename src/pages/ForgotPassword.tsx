import { useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/providers/trpcClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MailCheck, KeyRound } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const requestReset = trpc.auth.requestPasswordReset.useMutation({
    onError: (e) => toast.error(e.message),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    requestReset.mutate({ email });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-secondary/30 via-background to-background">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Card className="shadow-lifted">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <KeyRound className="h-6 w-6" />
            </div>
            <CardTitle className="font-display text-2xl">Reset your password</CardTitle>
          </CardHeader>
          <CardContent>
            {requestReset.isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-3"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                  <MailCheck className="h-6 w-6" />
                </div>
                <p className="text-sm text-muted-foreground">
                  If an account exists for that email, we've sent a password reset link. Check your inbox.
                </p>
              </motion.div>
            ) : (
              <form className="space-y-4" onSubmit={submit}>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Email"
                  autoComplete="email"
                  required
                />
                <Button className="w-full rounded-full" disabled={requestReset.isPending}>
                  {requestReset.isPending ? "Sending…" : "Send reset link"}
                </Button>
              </form>
            )}
            <Button variant="link" className="w-full mt-2" asChild>
              <Link to="/login">Back to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
