import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const onSuccess = (user: { role: string }) => navigate(user.role === "admin" ? "/admin" : "/dashboard");
  const login = trpc.auth.login.useMutation({ onSuccess, onError: (e) => setError(e.message) });
  const register = trpc.auth.register.useMutation({ onSuccess, onError: (e) => setError(e.message) });
  const submit = (event: React.FormEvent) => {
    event.preventDefault(); setError("");
    if (isRegistering) register.mutate({ name, email, password }); else login.mutate({ email, password });
  };
  const pending = login.isPending || register.isPending;
  return <div className="min-h-screen flex items-center justify-center p-4 bg-amber-50">
    <Card className="w-full max-w-sm"><CardHeader className="text-center"><CardTitle>{isRegistering ? "Create parent account" : "Welcome back"}</CardTitle></CardHeader>
      <CardContent><form className="space-y-4" onSubmit={submit}>
        {isRegistering && <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" required />}
        <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" autoComplete="email" required />
        <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password (12+ characters)" autoComplete={isRegistering ? "new-password" : "current-password"} minLength={12} required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button className="w-full" disabled={pending}>{pending ? "Please wait…" : isRegistering ? "Create account" : "Sign in"}</Button>
      </form><Button variant="link" className="w-full mt-2" onClick={() => { setIsRegistering(!isRegistering); setError(""); }}>
        {isRegistering ? "Already have an account? Sign in" : "New parent? Create an account"}
      </Button></CardContent>
    </Card>
  </div>;
}
