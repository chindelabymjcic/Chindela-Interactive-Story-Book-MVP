import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
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
} from "lucide-react";

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  diary_entry: { icon: BookOpen, color: "text-purple-500", bg: "bg-purple-50" },
  ai_feedback: { icon: Sparkles, color: "text-blue-500", bg: "bg-blue-50" },
  subscription_expiry: { icon: CreditCard, color: "text-amber-500", bg: "bg-amber-50" },
  safety_alert: { icon: Shield, color: "text-red-500", bg: "bg-red-50" },
  milestone: { icon: Trophy, color: "text-green-500", bg: "bg-green-50" },
  system: { icon: Settings, color: "text-gray-500", bg: "bg-gray-50" },
  payment_succeeded: { icon: Check, color: "text-green-500", bg: "bg-green-50" },
  payment_failed: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
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
  });

  const markAllRead = trpc.notification.markAllRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      utils.notification.unreadCount.invalidate();
    },
  });

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-500">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                  : "All caught up!"}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllRead.mutate()}
              >
                <Check className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            )}
          </div>

          <div className="space-y-3 max-w-3xl">
            {notifications?.map((notif, i) => {
              const config = typeConfig[notif.type] || typeConfig.system;
              const Icon = config.icon;

              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className={`transition-colors ${
                      !notif.isRead ? "bg-white border-l-4 border-l-amber-400" : "opacity-70"
                    }`}
                  >
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${config.bg} flex-shrink-0`}>
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{notif.title}</p>
                          {!notif.isRead && (
                            <Badge variant="default" className="bg-amber-500 text-[10px] h-5">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notif.createdAt
                            ? new Date(notif.createdAt).toLocaleString()
                            : ""}
                        </p>
                      </div>

                      {!notif.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markRead.mutate({ id: notif.id })}
                        >
                          <Check className="h-4 w-4 text-gray-400" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            }) || (
              <Card className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No notifications</h3>
                <p className="text-gray-500">
                  You'll receive notifications about your child's activity here.
                </p>
              </Card>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
