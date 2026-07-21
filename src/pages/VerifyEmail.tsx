import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import { trpc } from "@/providers/trpcClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MailCheck, Loader2, XCircle } from "lucide-react";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const verifyEmail = trpc.auth.verifyEmail.useMutation();
  const attempted = useRef(false);

  useEffect(() => {
    if (token && !attempted.current) {
      attempted.current = true;
      verifyEmail.mutate({ token });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-secondary/30 via-background to-background">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Card className="shadow-lifted">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MailCheck className="h-6 w-6" />
            </div>
            <CardTitle className="font-display text-2xl">Email verification</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {!token && <p className="text-sm text-muted-foreground">This link is missing its verification token.</p>}
            {token && verifyEmail.isPending && (
              <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying your email…
              </p>
            )}
            {verifyEmail.isSuccess && (
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-2 text-sm text-success"
              >
                <MailCheck className="h-4 w-4" />
                Your email has been verified. Thank you!
              </motion.p>
            )}
            {verifyEmail.isError && (
              <p className="flex items-center justify-center gap-2 text-sm text-destructive">
                <XCircle className="h-4 w-4" />
                {verifyEmail.error.message}
              </p>
            )}
            <Button asChild className="w-full rounded-full">
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
