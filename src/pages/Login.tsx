import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { trpc } from "@/providers/trpcClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Sprout } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isBootstrap = searchParams.get("admin") === "1";
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const onSuccess = (user: { role: string }) => navigate(user.role === "admin" ? "/admin" : "/dashboard");
  const onError = (e: { message: string }) => {
    setError(e.message);
    toast.error(e.message);
  };
  const login = trpc.auth.login.useMutation({ onSuccess, onError });
  const register = trpc.auth.register.useMutation({ onSuccess, onError });
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (isRegistering) register.mutate({ name, email, password, adminToken: isBootstrap ? adminToken : undefined });
    else login.mutate({ email, password, rememberMe });
  };
  const pending = login.isPending || register.isPending;

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 bg-gradient-to-b from-secondary/30 via-background to-background">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute top-10 left-[10%] h-32 w-32 rounded-full bg-primary/10 blur-3xl"
          animate={{ y: [0, 16, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-10 right-[10%] h-40 w-40 rounded-full bg-accent/10 blur-3xl"
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-sm">
        <Card className="shadow-lifted border-border/60">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sprout className="h-6 w-6" />
            </div>
            <CardTitle className="font-display text-2xl">
              {isRegistering ? "Create parent account" : "Welcome back"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              {isRegistering && (
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" required />
              )}
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" autoComplete="email" required />
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Password (12+ characters)"
                autoComplete={isRegistering ? "new-password" : "current-password"}
                minLength={12}
                required
              />
              {isRegistering && isBootstrap && (
                <Input
                  value={adminToken}
                  onChange={(e) => setAdminToken(e.target.value)}
                  placeholder="Admin bootstrap token"
                  autoComplete="off"
                />
              )}
              {!isRegistering && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox checked={rememberMe} onCheckedChange={(v) => setRememberMe(v === true)} />
                    Remember me
                  </label>
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full rounded-full" disabled={pending}>
                {pending ? "Please wait…" : isRegistering ? "Create account" : "Sign in"}
              </Button>
            </form>
            <Button
              variant="link"
              className="w-full mt-2"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError("");
              }}
            >
              {isRegistering ? "Already have an account? Sign in" : "New parent? Create an account"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
