import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Sprout, Delete, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/providers/trpcClient";

export default function ChildLogin() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [childId, setChildId] = useState("");
  const login = trpc.auth.childLogin.useMutation({
    onSuccess: () => navigate("/child"),
    onError: () => {
      setError("That child ID or PIN is not correct.");
      setPin("");
    },
  });

  const handlePin = (digit: string) => {
    if (pin.length < 4 && !login.isPending) {
      const newPin = pin + digit;
      setPin(newPin);
      setError("");

      if (newPin.length === 4) {
        const id = Number(childId);
        if (!Number.isInteger(id) || id < 1) {
          setError("Enter your child ID first.");
          setPin("");
          return;
        }
        login.mutate({ childId: id, pin: newPin });
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError("");
  };

  const handleClear = () => {
    setPin("");
    setError("");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-secondary/40 via-background to-background flex items-center justify-center p-4">
      {/* decorative floating shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-accent/20 blur-2xl"
          animate={{ y: [0, 16, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-primary/15 blur-3xl"
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-sm"
      >
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 rounded-full">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>

        <Card className="border-4 border-primary/20 shadow-lifted">
          <CardHeader className="text-center pb-2">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 shadow-soft"
            >
              <Sprout className="h-8 w-8 text-primary-foreground" />
            </motion.div>
            <CardTitle className="font-display text-2xl text-foreground">Child Login</CardTitle>
            <p className="text-sm text-muted-foreground">Enter your 4-digit PIN</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-1.5">
              <Label htmlFor="child-id">Child ID</Label>
              <Input
                id="child-id"
                type="number"
                min="1"
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
                placeholder="Ask your parent"
                aria-label="Child ID"
                disabled={login.isPending}
              />
            </div>

            {/* PIN Display */}
            <motion.div
              className="flex justify-center gap-3"
              animate={error ? { x: [0, -8, 8, -8, 8, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                    i < pin.length
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground/40"
                  }`}
                >
                  {i < pin.length ? "•" : ""}
                </div>
              ))}
            </motion.div>

            <AnimatePresence mode="wait">
              {login.isPending ? (
                <motion.p
                  key="pending"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking your PIN…
                </motion.p>
              ) : error ? (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-sm text-destructive"
                >
                  {error}
                </motion.p>
              ) : null}
            </AnimatePresence>

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-3">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handlePin(digit)}
                  disabled={login.isPending}
                  className="h-14 rounded-xl bg-gradient-to-b from-card to-muted border-2 border-border text-xl font-bold text-foreground shadow-xs hover:shadow-soft hover:border-primary/40 transition-all active:scale-95 disabled:opacity-50"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={handleClear}
                disabled={login.isPending}
                className="h-14 rounded-xl bg-muted text-sm font-medium text-muted-foreground hover:bg-muted/70 transition-all disabled:opacity-50"
              >
                Clear
              </button>
              <button
                onClick={() => handlePin("0")}
                disabled={login.isPending}
                className="h-14 rounded-xl bg-gradient-to-b from-card to-muted border-2 border-border text-xl font-bold text-foreground shadow-xs hover:shadow-soft hover:border-primary/40 transition-all active:scale-95 disabled:opacity-50"
              >
                0
              </button>
              <button
                onClick={handleDelete}
                disabled={login.isPending}
                className="h-14 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/70 transition-all disabled:opacity-50"
                aria-label="Delete last digit"
              >
                <Delete className="h-5 w-5" />
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Ask your parent for your PIN
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
