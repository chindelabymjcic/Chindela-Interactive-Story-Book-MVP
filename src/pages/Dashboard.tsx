import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpcClient";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Link } from "react-router";
import {
  Users,
  BookOpen,
  TrendingUp,
  Sparkles,
  Plus,
  CreditCard,
  Bell,
  ArrowRight,
  Star,
  Calendar,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

const ageGroupGradient: Record<string, string> = {
  "3-4 years": "from-destructive/70 to-accent/70",
  "5-7 years": "from-primary/80 to-success/70",
  "8-10 years": "from-info/80 to-primary/60",
  "11-13 years": "from-secondary to-info/70",
  "14-16 years": "from-warning/80 to-accent/70",
  "18+": "from-muted-foreground/60 to-foreground/50",
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { data: children } = trpc.child.list.useQuery();
  const { data: ageGroups } = trpc.ageGroup.list.useQuery();
  const { data: subs } = trpc.subscription.list.useQuery();
  const { data: notifications } = trpc.notification.list.useQuery();
  const utils = trpc.useUtils();

  const [isOpen, setIsOpen] = useState(false);
  const [childForm, setChildForm] = useState({
    name: "",
    pin: "",
    ageGroupId: "",
    age: "",
  });

  const createChild = trpc.child.create.useMutation({
    onSuccess: (child) => {
      utils.child.list.invalidate();
      setIsOpen(false);
      setChildForm({ name: "", pin: "", ageGroupId: "", age: "" });
      toast.success(`${child?.name ?? "Child"} was added! Login ID: ${child?.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const activeSubs = subs?.filter((s) => s.status === "active") || [];
  const unreadNotifs = notifications?.filter((n) => !n.isRead) || [];

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">
              {greeting()}, {user?.name?.split(" ")[0] || "Parent"} 🌿
            </h1>
            <p className="text-muted-foreground mt-1">Let's see what your explorers discovered today.</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Children" value={children?.length || 0} icon={Users} color="text-info" bg="bg-info/10" />
            <StatCard label="Active Subscriptions" value={activeSubs.length} icon={CreditCard} color="text-success" bg="bg-success/10" />
            <StatCard label="Unread Notifications" value={unreadNotifs.length} icon={Bell} color="text-warning" bg="bg-warning/10" />
            <StatCard
              label="Total Entries"
              value={children?.reduce((sum, c) => sum + (c.totalEntries || 0), 0) || 0}
              icon={BookOpen}
              color="text-accent"
              bg="bg-accent/10"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Children Cards */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold">Your Children</h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="rounded-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Child
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add a Child</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Child's Name</Label>
                        <Input
                          value={childForm.name}
                          onChange={(e) => setChildForm({ ...childForm, name: e.target.value })}
                          placeholder="e.g., Emma"
                        />
                      </div>
                      <div>
                        <Label>4-Digit PIN</Label>
                        <Input
                          type="password"
                          maxLength={4}
                          value={childForm.pin}
                          onChange={(e) => setChildForm({ ...childForm, pin: e.target.value.replace(/\D/g, "") })}
                          placeholder="****"
                        />
                      </div>
                      <div>
                        <Label>Age</Label>
                        <Input
                          type="number"
                          min={3}
                          max={99}
                          value={childForm.age}
                          onChange={(e) => setChildForm({ ...childForm, age: e.target.value })}
                          placeholder="Age in years"
                        />
                      </div>
                      <div>
                        <Label>Age Group</Label>
                        <Select
                          value={childForm.ageGroupId}
                          onValueChange={(v) => setChildForm({ ...childForm, ageGroupId: v })}
                        >
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
                      <Button
                        onClick={() =>
                          createChild.mutate({
                            name: childForm.name,
                            pin: childForm.pin,
                            ageGroupId: parseInt(childForm.ageGroupId),
                            age: parseInt(childForm.age),
                          })
                        }
                        disabled={
                          !childForm.name || childForm.pin.length !== 4 || !childForm.ageGroupId || !childForm.age || createChild.isPending
                        }
                        className="w-full rounded-full"
                      >
                        {createChild.isPending ? "Adding…" : "Add Child"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {children === undefined ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <Skeleton className="h-48 rounded-2xl" />
                  <Skeleton className="h-48 rounded-2xl" />
                </div>
              ) : children.length === 0 ? (
                <Empty className="border-2 border-dashed border-border rounded-2xl">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Users className="h-6 w-6" />
                    </EmptyMedia>
                    <EmptyTitle>Add your first explorer</EmptyTitle>
                    <EmptyDescription>Create a child profile to start their learning journey.</EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button onClick={() => setIsOpen(true)} className="rounded-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Child
                    </Button>
                  </EmptyContent>
                </Empty>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {children.map((child) => (
                    <ChildCard key={child.id} child={child} />
                  ))}
                </div>
              )}

              {/* Recent Activity */}
              <div className="mt-8">
                <h2 className="font-display text-xl font-semibold mb-4">Recent Notifications</h2>
                <div className="space-y-3">
                  {notifications === undefined ? (
                    <Skeleton className="h-20 rounded-xl" />
                  ) : notifications.length === 0 ? (
                    <Empty className="border-2 border-dashed border-border rounded-2xl py-8">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Bell className="h-6 w-6" />
                        </EmptyMedia>
                        <EmptyTitle>You're all caught up!</EmptyTitle>
                        <EmptyDescription>Notifications about your children's activity will show up here.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    notifications.slice(0, 5).map((notif) => (
                      <Card key={notif.id} className={notif.isRead ? "opacity-70" : ""}>
                        <CardContent className="p-4 flex items-start gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              notif.type === "diary_entry"
                                ? "bg-secondary/20"
                                : notif.type === "ai_feedback"
                                ? "bg-info/10"
                                : notif.type === "subscription_expiry"
                                ? "bg-warning/10"
                                : "bg-muted"
                            }`}
                          >
                            <Bell
                              className={`h-4 w-4 ${
                                notif.type === "diary_entry"
                                  ? "text-secondary-foreground"
                                  : notif.type === "ai_feedback"
                                  ? "text-info"
                                  : notif.type === "subscription_expiry"
                                  ? "text-warning"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{notif.title}</p>
                            <p className="text-xs text-muted-foreground">{notif.message}</p>
                          </div>
                          {!notif.isRead && <Badge className="bg-accent text-white">New</Badge>}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link to="/stories">
                    <Button variant="outline" className="w-full justify-between rounded-full">
                      Browse Stories
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/diary">
                    <Button variant="outline" className="w-full justify-between rounded-full">
                      View Diary
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/subscriptions">
                    <Button variant="outline" className="w-full justify-between rounded-full">
                      Manage Subscriptions
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/account-security">
                    <Button variant="outline" className="w-full justify-between rounded-full">
                      Account &amp; Security
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5 text-warning" />
                    Subscriptions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {subs?.length === 0 || subs === undefined ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-3">No active subscriptions</p>
                      <Link to="/subscriptions">
                        <Button size="sm" className="rounded-full">
                          Subscribe Now
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {subs.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/60">
                          <div>
                            <p className="text-sm font-medium">{sub.child?.name}</p>
                            <p className="text-xs text-muted-foreground">{sub.ageGroup?.name}</p>
                          </div>
                          <Badge variant={sub.status === "active" ? "default" : "secondary"}>{sub.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bg: string;
}

function StatCard({ label, value, icon: Icon, color, bg }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ChildCardProps {
  id: number;
  name: string;
  avatar?: string | null;
  age: number;
  isActive: boolean;
  totalEntries?: number | null;
  streakDays?: number | null;
  ageGroup?: { name: string } | null;
}

function ChildCard({ child }: { child: ChildCardProps }) {
  const { data: progress } = trpc.progress.byChild.useQuery({ childId: child.id });
  const completedStories = progress?.filter((p) => p.isCompleted).length ?? 0;
  const gradient = ageGroupGradient[child.ageGroup?.name ?? ""] ?? "from-primary to-secondary";

  return (
    <Card className="overflow-hidden hover:shadow-lifted transition-shadow">
      <div className={`h-2 bg-gradient-to-r ${gradient}`} />
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {child.avatar ? (
              <img src={child.avatar} alt={child.name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg`}>
                {child.name?.[0]}
              </div>
            )}
            <div>
              <h3 className="font-display font-semibold">{child.name}</h3>
              <p className="text-xs text-muted-foreground">
                {child.ageGroup?.name} | {child.age} years old
              </p>
              <p className="text-xs text-muted-foreground/80 mt-0.5">
                Child Login ID: <span className="font-mono font-semibold text-foreground">{child.id}</span>
              </p>
            </div>
          </div>
          <Badge className={child.isActive ? "bg-success" : "bg-muted text-muted-foreground"}>
            {child.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center p-2 rounded-lg bg-muted/60">
            <BookOpen className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold">{child.totalEntries || 0}</p>
            <p className="text-[10px] text-muted-foreground">Entries</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/60">
            <TrendingUp className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold">{child.streakDays || 0}</p>
            <p className="text-[10px] text-muted-foreground">Streak</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/60">
            <Star className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold">{completedStories}</p>
            <p className="text-[10px] text-muted-foreground">Stories</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/60">
            <Calendar className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold">{child.age}</p>
            <p className="text-[10px] text-muted-foreground">Age</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link to={`/diary?child=${child.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full rounded-full">
              View Diary
            </Button>
          </Link>
          <Link to="/subscriptions" className="flex-1">
            <Button size="sm" className="w-full rounded-full">
              Subscribe
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
