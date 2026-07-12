import { useState } from "react";
import { useSearchParams } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import {
  CreditCard,
  Check,
  Clock,
  AlertTriangle,
  Calendar,
  PoundSterling,
  Shield,
} from "lucide-react";

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

  const utils = trpc.useUtils();
  const createSub = trpc.subscription.create.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    },
  });
  const cancelSub = trpc.subscription.cancel.useMutation({
    onSuccess: () => utils.subscription.list.invalidate(),
  });

  const durations = [
    { value: 1, label: "1 Month", price: 1 },
    { value: 3, label: "3 Months", price: 3 },
    { value: 6, label: "6 Months", price: 6 },
    { value: 12, label: "12 Months", price: 12 },
  ];

  const selectedPrice = durations.find(
    (d) => d.value === parseInt(selectedDuration)
  )?.price || 1;

  const handleSubscribe = () => {
    if (!selectedChild || !selectedAgeGroup) return;
    createSub.mutate({
      childId: parseInt(selectedChild),
      ageGroupId: parseInt(selectedAgeGroup),
      duration: parseInt(selectedDuration) as 1 | 3 | 6 | 12,
      isAutoRenew: autoRenew,
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
        return <Check className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "expired":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
            <p className="text-gray-500">Manage your children's access</p>
          </div>

          {checkoutResult && (
            <Card
              className={`mb-6 border-2 ${checkoutResult === "success" ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <p className={`text-sm ${checkoutResult === "success" ? "text-green-700" : "text-gray-600"}`}>
                  {checkoutResult === "success"
                    ? "Payment received — your subscription will activate shortly."
                    : "Checkout was cancelled. No payment was taken."}
                </p>
                <Button variant="ghost" size="sm" onClick={dismissCheckoutBanner}>
                  Dismiss
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* New Subscription */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-emerald-500" />
                    New Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Child</label>
                    <Select value={selectedChild} onValueChange={setSelectedChild}>
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
                    <label className="text-sm font-medium mb-2 block">Age Group</label>
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
                    <label className="text-sm font-medium mb-2 block">Duration</label>
                    <div className="grid grid-cols-2 gap-2">
                      {durations.map((d) => (
                        <button
                          key={d.value}
                          onClick={() => setSelectedDuration(d.value.toString())}
                          className={`p-3 rounded-lg border text-center transition-colors ${
                            selectedDuration === d.value.toString()
                              ? "border-amber-500 bg-amber-50 text-amber-700"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <p className="font-medium text-sm">{d.label}</p>
                          <p className="text-xs text-gray-500">£{d.price}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <label htmlFor="auto-renew" className="text-sm font-medium">Auto-renew</label>
                      <p className="text-xs text-gray-500">Bill £1/month automatically until cancelled</p>
                    </div>
                    <Switch id="auto-renew" checked={autoRenew} onCheckedChange={setAutoRenew} />
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Total Price</span>
                      <span className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                        <PoundSterling className="h-5 w-5" />
                        {selectedPrice}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      £1 per month{autoRenew ? ", billed monthly until cancelled" : ` for ${selectedDuration} month(s), then stops automatically`}
                    </p>
                  </div>

                  <Button
                    onClick={handleSubscribe}
                    disabled={!selectedChild || !selectedAgeGroup || createSub.isPending}
                    className="w-full bg-amber-500 hover:bg-amber-600"
                  >
                    {createSub.isPending ? "Redirecting to checkout..." : "Subscribe Now"}
                  </Button>
                  {createSub.error && <p className="text-sm text-red-600">{createSub.error.message}</p>}
                </CardContent>
              </Card>

              {/* Info Card */}
              <Card className="mt-4">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Secure Payments</p>
                      <p className="text-xs text-gray-500">
                        All payments are processed securely. Subscription access is
                        granted immediately after payment.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Active Subscriptions */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Your Subscriptions</h2>
              <div className="space-y-4">
                {subs?.map((sub) => (
                  <Card key={sub.id} className="overflow-hidden">
                    <div
                      className={`h-1 ${
                        sub.status === "active"
                          ? "bg-green-500"
                          : sub.status === "pending"
                          ? "bg-amber-500"
                          : "bg-gray-300"
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
                            <p className="text-xs text-gray-500">
                              {sub.duration} months subscription
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            sub.status === "active"
                              ? "default"
                              : sub.status === "pending"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {sub.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs">Price</p>
                          <p className="font-medium">£{sub.totalPrice}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Start Date</p>
                          <p className="font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {sub.startDate
                              ? new Date(sub.startDate).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">End Date</p>
                          <p className="font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {sub.endDate
                              ? new Date(sub.endDate).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>

                      {(sub.status === "active" || sub.status === "pending") && (
                        <div className="mt-4 pt-4 border-t flex justify-end">
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
                )) || (
                  <Card className="p-8 text-center">
                    <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No subscriptions yet</h3>
                    <p className="text-gray-500">
                      Create your first subscription to unlock content for your child.
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
