import { trpc } from "@/providers/trpcClient";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Bell,
  BookOpen,
  Sparkles,
  CreditCard,
  Shield,
  Trophy,
  Settings,
  Check,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

const typeConfig: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  diary_entry: { icon: BookOpen, color: "text-secondary-foreground", bg: "bg-secondary/20" },
  ai_feedback: { icon: Sparkles, color: "text-info", bg: "bg-info/10" },
  subscription_expiry: { icon: CreditCard, color: "text-warning", bg: "bg-warning/10" },
  safety_alert: { icon: Shield, color: "text-destructive", bg: "bg-destructive/10" },
  milestone: { icon: Trophy, color: "text-success", bg: "bg-success/10" },
  system: { icon: Settings, color: "text-muted-foreground", bg: "bg-muted" },
  payment_succeeded: { icon: Check, color: "text-success", bg: "bg-success/10" },
  payment_failed: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
};

export default function Notifications() {
  useAuth();
  const { data: notifications } = trpc.notification.list.useQuery();
  const utils = trpc.useUtils();

  const markRead = trpc.notification.markRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      utils.notification.unreadCount.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const markAllRead = trpc.notification.markAllRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      utils.notification.unreadCount.invalidate();
      toast.success("All notifications marked as read.");
    },
    onError: (e) => toast.error(e.message),
  });

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Notifications</h1>
              <p className="text-muted-foreground">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                  : "All caught up!"}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
                <Check className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            )}
          </div>

          <div className="space-y-3 max-w-3xl">
            {notifications === undefined ? (
              <>
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </>
            ) : notifications.length === 0 ? (
              <Empty className="border-2 border-dashed border-border rounded-2xl">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Bell className="h-6 w-6" />
                  </EmptyMedia>
                  <EmptyTitle>You're all caught up!</EmptyTitle>
                  <EmptyDescription>You'll receive notifications about your child's activity here.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <AnimatePresence initial={false}>
                {notifications.map((notif, i) => {
                  const config = typeConfig[notif.type] || typeConfig.system;
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={notif.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Card className={`transition-colors ${!notif.isRead ? "bg-card border-l-4 border-l-accent" : "opacity-70"}`}>
                        <CardContent className="p-4 flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${config.bg} flex-shrink-0`}>
                            <Icon className={`h-5 w-5 ${config.color}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm">{notif.title}</p>
                              {!notif.isRead && <Badge className="bg-accent text-[10px] h-5">New</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{notif.message}</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ""}
                            </p>
                          </div>

                          {!notif.isRead && (
                            <Button variant="ghost" size="sm" onClick={() => markRead.mutate({ id: notif.id })} aria-label="Mark as read">
                              <Check className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
