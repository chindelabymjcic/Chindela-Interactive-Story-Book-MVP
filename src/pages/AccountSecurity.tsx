import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpcClient";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ShieldCheck, Monitor, LogOut, MailCheck } from "lucide-react";

export default function AccountSecurity() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: sessions } = trpc.auth.mySessions.useQuery();

  const resendVerification = trpc.auth.resendVerification.useMutation({
    onSuccess: () => toast.success("Verification email sent — check your inbox."),
    onError: (e) => toast.error(e.message),
  });
  const revokeSession = trpc.auth.revokeSession.useMutation({
    onSuccess: () => {
      utils.auth.mySessions.invalidate();
      toast.success("Device signed out.");
    },
    onError: (e) => toast.error(e.message),
  });
  const logoutAll = trpc.auth.logoutAll.useMutation({
    onSuccess: () => (window.location.href = "/login"),
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Account &amp; Security</h1>
            <p className="text-muted-foreground">Manage your login sessions and account safety</p>
          </div>

          {user && !user.emailVerifiedAt && (
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <MailCheck className="h-5 w-5 text-warning" />
                  <div>
                    <p className="text-sm font-medium text-warning">Your email isn't verified yet</p>
                    <p className="text-xs text-warning/80">Check your inbox, or resend the verification link.</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={resendVerification.isPending || resendVerification.isSuccess}
                  onClick={() => resendVerification.mutate()}
                >
                  {resendVerification.isSuccess ? "Sent!" : resendVerification.isPending ? "Sending…" : "Resend"}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                Active sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions === undefined ? (
                <Skeleton className="h-16 rounded-lg" />
              ) : sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No active sessions found.</p>
              ) : (
                <AnimatePresence initial={false}>
                  {sessions.map((s) => (
                    <motion.div
                      key={s.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium flex items-center gap-2 flex-wrap">
                          {s.userAgent ? s.userAgent.slice(0, 60) : "Unknown device"}
                          {s.isCurrent && <Badge className="bg-success">This device</Badge>}
                          {s.rememberMe && <Badge variant="outline">Remembered</Badge>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.ipAddress ?? "Unknown IP"} · last active {new Date(s.lastSeenAt).toLocaleString()}
                        </p>
                      </div>
                      {!s.isCurrent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeSession.mutate({ id: s.id })}
                          disabled={revokeSession.isPending}
                          aria-label="Sign out this device"
                        >
                          Sign out
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Sign out everywhere
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                This will sign you out of every device, including this one. You'll need to sign in again.
              </p>
              <Button variant="destructive" onClick={() => logoutAll.mutate()} disabled={logoutAll.isPending}>
                <LogOut className="h-4 w-4 mr-2" />
                {logoutAll.isPending ? "Signing out…" : "Sign out of all devices"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
