import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { trpc } from "@/providers/trpcClient";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  CreditCard,
  Check,
  Clock,
  AlertTriangle,
  Calendar,
  PoundSterling,
  Shield,
  Heart,
} from "lucide-react";
import { SubscriptionPricingGBPPence, SUBSCRIPTION_PRICE_PER_MONTH_GBP_PENCE, ContributionLimits } from "@contracts/constants";

export default function Subscriptions() {
  useAuth();
  const { data: children } = trpc.child.list.useQuery();
  const { data: ageGroups } = trpc.ageGroup.list.useQuery();
  const { data: subs } = trpc.subscription.list.useQuery();
  const [searchParams, setSearchParams] = useSearchParams();
  const checkoutResult = searchParams.get("checkout");

  const [selectedChild, setSelectedChild] = useState("");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("");
  const [selectedDuration, setSelectedDuration] = useState<string>("1");
  const [autoRenew, setAutoRenew] = useState(false);
  const [contribution, setContribution] = useState("");

  const utils = trpc.useUtils();
  const createSub = trpc.subscription.create.useMutation({
    onSuccess: (data) => {
      toast.success("Redirecting you to secure checkout…");
      window.location.assign(data.checkoutUrl);
    },
    onError: (e) => toast.error(e.message),
  });
  // Stays true through the redirect so the button can't be pressed twice.
  const redirecting = createSub.isPending || createSub.isSuccess;

  // A child already belongs to an age group, so picking the child pre-fills
  // it (the parent can still change it explicitly).
  const handleChildChange = (value: string) => {
    setSelectedChild(value);
    const child = children?.find((c) => c.id.toString() === value);
    if (child) setSelectedAgeGroup(child.ageGroupId.toString());
  };
  const cancelSub = trpc.subscription.cancel.useMutation({
    onSuccess: () => {
      utils.subscription.list.invalidate();
      toast.success("Subscription cancelled.");
    },
    onError: (e) => toast.error(e.message),
  });

  const durations = [
    { value: 1, label: "1 Month" },
    { value: 2, label: "2 Months" },
    { value: 3, label: "3 Months" },
    { value: 6, label: "6 Months" },
    { value: 12, label: "12 Months" },
  ] as const;

  const pricePerMonth = SUBSCRIPTION_PRICE_PER_MONTH_GBP_PENCE / 100;
  const durationNum = parseInt(selectedDuration) as keyof typeof SubscriptionPricingGBPPence;
  const selectedPrice = SubscriptionPricingGBPPence[durationNum] / 100;

  const contributionGBPPence = contribution ? Math.round(parseFloat(contribution) * 100) : 0;
  const contributionError =
    contribution && (contributionGBPPence < ContributionLimits.minGBPPence || contributionGBPPence > ContributionLimits.maxGBPPence)
      ? `Enter an amount between £${(ContributionLimits.minGBPPence / 100).toFixed(2)} and £${(ContributionLimits.maxGBPPence / 100).toFixed(2)}`
      : undefined;

  const missing = [
    !selectedChild && "choose a child",
    !selectedAgeGroup && "choose an age group",
    contributionError && "fix the contribution amount",
  ].filter(Boolean) as string[];
  const durationLabel = `${durationNum} month${durationNum === 1 ? "" : "s"}`;
  const dueTodayGBP = selectedPrice + (contributionGBPPence > 0 && !contributionError ? contributionGBPPence / 100 : 0);

  const handleSubscribe = () => {
    if (missing.length > 0) return;
    createSub.mutate({
      childId: parseInt(selectedChild),
      ageGroupId: parseInt(selectedAgeGroup),
      duration: durationNum,
      isAutoRenew: autoRenew,
      ...(contributionGBPPence > 0 ? { contributionGBPPence } : {}),
    });
  };

  const dismissCheckoutBanner = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("checkout");
    setSearchParams(next, { replace: true });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Check className="h-4 w-4 text-success" />;
      case "pending":
        return <Clock className="h-4 w-4 text-warning" />;
      case "expired":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">Subscriptions</h1>
            <p className="text-muted-foreground">Manage your children's access</p>
          </div>

          {checkoutResult && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={`mb-6 border-2 ${checkoutResult === "success" ? "border-success/30 bg-success/5" : "border-border bg-muted/40"}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <p className={`text-sm ${checkoutResult === "success" ? "text-success" : "text-muted-foreground"}`}>
                    {checkoutResult === "success"
                      ? "Payment received — your subscription will activate shortly."
                      : "Checkout was cancelled. No payment was taken."}
                  </p>
                  <Button variant="ghost" size="sm" onClick={dismissCheckoutBanner}>
                    Dismiss
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* New Subscription */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-success" />
                    New Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {children !== undefined && children.length === 0 && (
                    <div className="p-3 rounded-lg border border-warning/30 bg-warning/5 text-sm">
                      <p className="font-medium text-foreground">Add a child first</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Subscriptions are linked to a child profile and their age group.{" "}
                        <Link to="/dashboard" className="text-primary font-medium hover:underline">
                          Add a child on your dashboard
                        </Link>
                        , then come back here. Just want to donate?{" "}
                        <Link to="/donate" className="text-primary font-medium hover:underline">
                          Make a donation
                        </Link>
                        .
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium mb-2 block">1. Child</label>
                    <Select value={selectedChild} onValueChange={handleChildChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select child" />
                      </SelectTrigger>
                      <SelectContent>
                        {children?.map((child) => (
                          <SelectItem key={child.id} value={child.id.toString()}>
                            {child.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">2. Age Group</label>
                    <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select age group" />
                      </SelectTrigger>
                      <SelectContent>
                        {ageGroups?.map((ag) => (
                          <SelectItem key={ag.id} value={ag.id.toString()}>
                            {ag.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">3. Duration</label>
                    <div className="grid grid-cols-2 gap-2">
                      {durations.map((d) => (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => setSelectedDuration(d.value.toString())}
                          className={`p-3 rounded-lg border text-center transition-colors ${
                            selectedDuration === d.value.toString()
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-muted-foreground/30"
                          }`}
                        >
                          <p className="font-medium text-sm">{d.label}</p>
                          <p className="text-xs text-muted-foreground">£{(SubscriptionPricingGBPPence[d.value] / 100).toFixed(2)}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 p-3 border border-border rounded-lg">
                    <div>
                      <label htmlFor="auto-renew" className="text-sm font-medium">
                        4. Auto-renew <span className="text-muted-foreground font-normal">({autoRenew ? "on" : "off"})</span>
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {autoRenew
                          ? `Renews every ${durationLabel} at £${selectedPrice.toFixed(2)} until you cancel.`
                          : `One payment for ${durationLabel}. Access ends after that — you won't be charged again.`}
                      </p>
                    </div>
                    <Switch id="auto-renew" checked={autoRenew} onCheckedChange={setAutoRenew} />
                  </div>

                  <div>
                    <label htmlFor="contribution" className="text-sm font-medium mb-2 flex items-center gap-1.5">
                      <Heart className="h-4 w-4 text-destructive" />
                      5. Optional contribution
                    </label>
                    <div className="relative">
                      <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="contribution"
                        type="number"
                        min={ContributionLimits.minGBPPence / 100}
                        max={ContributionLimits.maxGBPPence / 100}
                        step="0.01"
                        placeholder="0.00"
                        value={contribution}
                        onChange={(e) => setContribution(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add a one-time donation to support Chindela Storybook — completely optional. Leave blank to skip. It is charged once
                      and never repeats with renewals.
                    </p>
                    {contributionError && <p className="text-xs text-destructive mt-1">{contributionError}</p>}
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Due today</span>
                      <span className="text-2xl font-bold text-foreground flex items-center gap-1">
                        <PoundSterling className="h-5 w-5" />
                        {dueTodayGBP.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground/80 mt-1">
                      {`£${selectedPrice.toFixed(2)} for ${durationLabel} (£${pricePerMonth.toFixed(2)}/month)`}
                      {autoRenew ? `, then £${selectedPrice.toFixed(2)} every ${durationLabel} until cancelled` : ", no automatic renewal"}
                      {contributionGBPPence > 0 && !contributionError ? ` + £${(contributionGBPPence / 100).toFixed(2)} one-time contribution` : ""}
                    </p>
                  </div>

                  <Button onClick={handleSubscribe} disabled={missing.length > 0 || redirecting} className="w-full rounded-full">
                    {redirecting ? "Redirecting to secure checkout…" : "Continue to Payment"}
                  </Button>
                  {missing.length > 0 && !redirecting && (
                    <p className="text-xs text-muted-foreground">To continue, please {missing.join(", ")}.</p>
                  )}
                  {createSub.error && <p className="text-sm text-destructive">{createSub.error.message}</p>}
                </CardContent>
              </Card>

              {/* Info Card */}
              <Card className="mt-4">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-info mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Secure Payments</p>
                      <p className="text-xs text-muted-foreground">
                        All payments are processed securely. Subscription access is granted immediately after payment.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Active Subscriptions */}
            <div className="lg:col-span-2">
              <h2 className="font-display text-xl font-semibold mb-4">Your Subscriptions</h2>
              <div className="space-y-4">
                {subs === undefined ? (
                  <Skeleton className="h-32 rounded-xl" />
                ) : subs.length === 0 ? (
                  <Empty className="border-2 border-dashed border-border rounded-2xl">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <CreditCard className="h-6 w-6" />
                      </EmptyMedia>
                      <EmptyTitle>No subscriptions yet</EmptyTitle>
                      <EmptyDescription>Create your first subscription to unlock content for your child.</EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent />
                  </Empty>
                ) : (
                  subs.map((sub) => (
                    <Card key={sub.id} className="overflow-hidden">
                      <div
                        className={`h-1 ${
                          sub.status === "active" ? "bg-success" : sub.status === "pending" ? "bg-warning" : "bg-muted"
                        }`}
                      />
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(sub.status)}
                            <div>
                              <p className="font-medium">
                                {sub.child?.name} - {sub.ageGroup?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">{sub.duration} months subscription</p>
                            </div>
                          </div>
                          <Badge variant={sub.status === "active" ? "default" : sub.status === "pending" ? "secondary" : "outline"}>
                            {sub.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Price</p>
                            <p className="font-medium">£{sub.totalPrice}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Start Date</p>
                            <p className="font-medium flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {sub.startDate ? new Date(sub.startDate).toLocaleDateString() : "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">End Date</p>
                            <p className="font-medium flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : "N/A"}
                            </p>
                          </div>
                        </div>

                        {sub.status === "active" && !sub.stripeSubscriptionId && (
                          <p className="mt-3 text-xs text-muted-foreground">
                            Doesn't auto-renew — access ends on {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : "the end date"}.
                          </p>
                        )}
                        {(sub.status === "pending" || (sub.status === "active" && sub.stripeSubscriptionId)) && (
                          <div className="mt-4 pt-4 border-t border-border flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={cancelSub.isPending}
                              onClick={() => cancelSub.mutate({ id: sub.id })}
                            >
                              Cancel subscription
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
