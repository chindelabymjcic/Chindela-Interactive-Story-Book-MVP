import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/providers/trpcClient";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check, Heart, HeartHandshake, PoundSterling, Shield, Sprout } from "lucide-react";
import { DonationLimits, DonationPresetsGBPPence } from "@contracts/constants";

const formatGBP = (pence: number) => `£${(pence / 100).toFixed(pence % 100 === 0 ? 0 : 2)}`;

export default function Donate() {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const donationResult = searchParams.get("donation");

  const [preset, setPreset] = useState<number | null>(DonationPresetsGBPPence[1]);
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");

  const amountGBPPence = preset ?? (customAmount ? Math.round(parseFloat(customAmount) * 100) : 0);
  const amountError =
    preset === null && customAmount && (Number.isNaN(amountGBPPence) || amountGBPPence < DonationLimits.minGBPPence || amountGBPPence > DonationLimits.maxGBPPence)
      ? `Enter an amount between ${formatGBP(DonationLimits.minGBPPence)} and ${formatGBP(DonationLimits.maxGBPPence)}`
      : undefined;
  const canDonate = amountGBPPence >= DonationLimits.minGBPPence && amountGBPPence <= DonationLimits.maxGBPPence && !amountError;

  const createCheckout = trpc.donation.createCheckout.useMutation({
    onSuccess: (data) => {
      toast.success("Redirecting you to secure checkout…");
      window.location.assign(data.checkoutUrl);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleDonate = () => {
    if (!canDonate) return;
    createCheckout.mutate({
      amountGBPPence,
      ...(donorName.trim() ? { donorName: donorName.trim() } : {}),
      ...(donorEmail.trim() ? { donorEmail: donorEmail.trim() } : {}),
    });
  };

  const dismissResult = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("donation");
    setSearchParams(next, { replace: true });
  };

  // Stays "pending" through the redirect so the button can't be pressed twice.
  const redirecting = createCheckout.isPending || createCheckout.isSuccess;

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-background to-background">
      {isAuthenticated ? (
        <Navbar />
      ) : (
        <header className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Sprout className="h-6 w-6 text-primary" />
            <span className="font-display text-xl font-bold text-foreground">Chindela</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Button>
          </Link>
        </header>
      )}

      <div className="container mx-auto px-4 py-8 max-w-xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-1.5 text-sm font-medium text-destructive mb-4">
              <HeartHandshake className="h-4 w-4" />
              Support Chindela
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Make a Donation</h1>
            <p className="text-muted-foreground">
              Chindela by MJ CIC is a non-profit project for the welfare and bright future of children. No account needed.
            </p>
          </div>

          {donationResult && (
            <Card className={`mb-6 border-2 ${donationResult === "success" ? "border-success/30 bg-success/5" : "border-border bg-muted/40"}`}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <p className={`text-sm flex items-center gap-2 ${donationResult === "success" ? "text-success" : "text-muted-foreground"}`}>
                  {donationResult === "success" && <Check className="h-4 w-4 shrink-0" />}
                  {donationResult === "success"
                    ? "Thank you! Your donation was received. A receipt has been sent to your email."
                    : "Donation was cancelled. No payment was taken."}
                </p>
                <Button variant="ghost" size="sm" onClick={dismissResult}>
                  Dismiss
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-destructive" />
                Choose an amount
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DonationPresetsGBPPence.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setPreset(value);
                      setCustomAmount("");
                    }}
                    className={`p-3 rounded-lg border text-center font-display font-semibold transition-colors ${
                      preset === value ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    {formatGBP(value)}
                  </button>
                ))}
              </div>

              <div>
                <label htmlFor="custom-amount" className="text-sm font-medium mb-2 block">
                  Or enter your own amount
                </label>
                <div className="relative">
                  <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="custom-amount"
                    type="number"
                    inputMode="decimal"
                    min={DonationLimits.minGBPPence / 100}
                    max={DonationLimits.maxGBPPence / 100}
                    step="0.01"
                    placeholder="Other amount"
                    value={customAmount}
                    onFocus={() => setPreset(null)}
                    onChange={(e) => {
                      setPreset(null);
                      setCustomAmount(e.target.value);
                    }}
                    className="pl-8"
                  />
                </div>
                {amountError && <p className="text-xs text-destructive mt-1">{amountError}</p>}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="donor-name" className="text-sm font-medium mb-2 block">
                    Name <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <Input id="donor-name" maxLength={100} value={donorName} onChange={(e) => setDonorName(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="donor-email" className="text-sm font-medium mb-2 block">
                    Email <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <Input id="donor-email" type="email" maxLength={255} value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                Your receipt is sent to the email you enter here or on the secure payment page.
              </p>

              <Button onClick={handleDonate} disabled={!canDonate || redirecting} size="lg" className="w-full rounded-full gap-2">
                <Heart className="h-4 w-4" />
                {redirecting ? "Redirecting to secure checkout…" : canDonate ? `Donate ${formatGBP(amountGBPPence)}` : "Donate"}
              </Button>
              {createCheckout.error && <p className="text-sm text-destructive">{createCheckout.error.message}</p>}

              <div className="flex items-start gap-3 pt-2 border-t border-border">
                <Shield className="h-5 w-5 text-info mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  One-time payment processed securely by Stripe. We never see or store your card details. This is a donation only — it does not
                  create an account or a subscription.
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Looking to give your child access to the storybook?{" "}
            <Link to="/subscriptions" className="text-primary font-medium hover:underline">
              Subscribe for a child
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
