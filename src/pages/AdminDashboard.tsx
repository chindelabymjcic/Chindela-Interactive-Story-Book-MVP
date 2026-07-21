import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpcClient";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  BookOpen,
  Users,
  CreditCard,
  Shield,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  MessageSquare,
  Layers,
  Calendar,
  Image as ImageIcon,
  Music,
  Video,
  FileText,
  File as FileIcon,
  Heart,
  ChevronLeft,
  ChevronRight,
  PoundSterling,
  RefreshCw,
  Loader2,
  LayoutDashboard,
  Sparkles,
  IdCard,
} from "lucide-react";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { uploadToPresignedPost } from "@/lib/s3Upload";
import { MediaCategories, SUBSCRIPTION_PRICE_PER_MONTH_GBP_PENCE, type MediaCategory } from "@contracts/constants";

const TABS = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "stories", label: "Stories", icon: BookOpen },
  { value: "lessons", label: "Lessons", icon: Layers },
  { value: "characters", label: "Characters", icon: Sparkles },
  { value: "media", label: "Media", icon: ImageIcon },
  { value: "ageGroups", label: "Age Groups", icon: Users },
  { value: "safety", label: "Safety", icon: Shield },
  { value: "years", label: "Years", icon: Calendar },
  { value: "subscriptions", label: "Billing", icon: CreditCard },
  { value: "users", label: "Users", icon: IdCard },
] as const;

export default function AdminDashboard() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage content, users, and platform settings</p>
            </div>
            <Badge className="bg-primary">Admin</Badge>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 sm:grid-cols-5 lg:grid-cols-10 lg:w-auto h-auto">
              {TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 py-2">
                  <tab.icon className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview">
              <OverviewTab />
            </TabsContent>
            <TabsContent value="stories">
              <StoriesTab />
            </TabsContent>
            <TabsContent value="lessons">
              <LessonsTab />
            </TabsContent>
            <TabsContent value="characters">
              <CharactersTab />
            </TabsContent>
            <TabsContent value="media">
              <MediaTab />
            </TabsContent>
            <TabsContent value="ageGroups">
              <AgeGroupsTab />
            </TabsContent>
            <TabsContent value="safety">
              <SafetyTab />
            </TabsContent>
            <TabsContent value="years">
              <YearsTab />
            </TabsContent>
            <TabsContent value="subscriptions">
              <BillingTab />
            </TabsContent>
            <TabsContent value="users">
              <UsersTab />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}

// ============== OVERVIEW TAB ==============
function OverviewTab() {
  const { data: stats } = trpc.admin.stats.useQuery();

  const statCards = [
    { label: "Users", value: stats?.users ?? 0, icon: Users, color: "text-info", bg: "bg-info/10" },
    { label: "Children", value: stats?.children ?? 0, icon: Users, color: "text-success", bg: "bg-success/10" },
    { label: "Stories", value: stats?.stories ?? 0, icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
    { label: "Lessons", value: stats?.lessons ?? 0, icon: Layers, color: "text-accent", bg: "bg-accent/10" },
    { label: "Diary Entries", value: stats?.diaryEntries ?? 0, icon: MessageSquare, color: "text-secondary-foreground", bg: "bg-secondary/20" },
    { label: "Active Subs", value: stats?.activeSubscriptions ?? 0, icon: CreditCard, color: "text-success", bg: "bg-success/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <RecentActivity />
        <SubscriptionOverview />
      </div>
    </div>
  );
}

function RecentActivity() {
  const { data: activity } = trpc.admin.recentActivity.useQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activity === undefined ? (
            <Skeleton className="h-16 rounded-lg" />
          ) : activity.recentDiaryEntries?.length ? (
            activity.recentDiaryEntries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <MessageSquare className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm font-medium">{entry.child?.name} submitted a diary entry</p>
                  <p className="text-xs text-muted-foreground">{entry.textContent?.substring(0, 80)}...</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SubscriptionOverview() {
  const { data: activity } = trpc.admin.recentActivity.useQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-success" />
          Recent Subscriptions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activity === undefined ? (
            <Skeleton className="h-16 rounded-lg" />
          ) : activity.recentSubscriptions?.length ? (
            activity.recentSubscriptions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">
                    {sub.child?.name} - {sub.ageGroup?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sub.duration} months - £{sub.totalPrice}
                  </p>
                </div>
                <Badge variant={sub.status === "active" ? "default" : "secondary"}>{sub.status}</Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No subscriptions yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============== STORIES TAB ==============
function StoriesTab() {
  const { data: stories } = trpc.story.list.useQuery();
  const { data: ageGroups } = trpc.ageGroup.list.useQuery();
  const { data: characters } = trpc.character.list.useQuery();
  const { data: years } = trpc.contentYear.list.useQuery();
  const utils = trpc.useUtils();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    ageGroupId: "",
    contentYearId: "",
    characterId: "",
    dayNumber: "1",
    theme: "",
    moralLesson: "",
    coverImage: "",
  });

  const createMutation = trpc.story.create.useMutation({
    onSuccess: () => {
      utils.story.list.invalidate();
      setIsDialogOpen(false);
      resetForm();
      toast.success("Story created!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.story.update.useMutation({
    onSuccess: () => {
      utils.story.list.invalidate();
      setIsDialogOpen(false);
      setEditingId(null);
      resetForm();
      toast.success("Story updated!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.story.delete.useMutation({
    onSuccess: () => {
      utils.story.list.invalidate();
      toast.success("Story deleted.");
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      ageGroupId: "",
      contentYearId: "",
      characterId: "",
      dayNumber: "1",
      theme: "",
      moralLesson: "",
      coverImage: "",
    });
  };

  const handleSubmit = () => {
    const data = {
      title: form.title,
      description: form.description || undefined,
      ageGroupId: parseInt(form.ageGroupId),
      contentYearId: parseInt(form.contentYearId),
      characterId: form.characterId ? parseInt(form.characterId) : undefined,
      dayNumber: parseInt(form.dayNumber),
      theme: form.theme || undefined,
      moralLesson: form.moralLesson || undefined,
      coverImage: form.coverImage || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const startEdit = (story: {
    id: number;
    title: string;
    description?: string | null;
    ageGroupId?: number | null;
    contentYearId?: number | null;
    characterId?: number | null;
    dayNumber?: number | null;
    theme?: string | null;
    moralLesson?: string | null;
    coverImage?: string | null;
  }) => {
    setEditingId(story.id);
    setForm({
      title: story.title,
      description: story.description || "",
      ageGroupId: story.ageGroupId?.toString() || "",
      contentYearId: story.contentYearId?.toString() || "",
      characterId: story.characterId?.toString() || "",
      dayNumber: story.dayNumber?.toString() || "1",
      theme: story.theme || "",
      moralLesson: story.moralLesson || "",
      coverImage: story.coverImage || "",
    });
    setIsDialogOpen(true);
  };

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl font-semibold">Stories</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingId(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Story
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Story" : "Create Story"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Story title"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description"
                />
              </div>
              <MediaUploader
                category="image"
                label="Cover Image"
                value={form.coverImage}
                onChange={(url) => setForm({ ...form, coverImage: url })}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Age Group</Label>
                  <Select
                    value={form.ageGroupId}
                    onValueChange={(v) => setForm({ ...form, ageGroupId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
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
                  <Label>Content Year</Label>
                  <Select
                    value={form.contentYearId}
                    onValueChange={(v) => setForm({ ...form, contentYearId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {years?.map((y) => (
                        <SelectItem key={y.id} value={y.id.toString()}>
                          {y.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Character</Label>
                  <Select
                    value={form.characterId}
                    onValueChange={(v) => setForm({ ...form, characterId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {characters?.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Day Number (1-365)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={form.dayNumber}
                    onChange={(e) => setForm({ ...form, dayNumber: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Theme</Label>
                <Input
                  value={form.theme}
                  onChange={(e) => setForm({ ...form, theme: e.target.value })}
                  placeholder="e.g., Kindness, Courage"
                />
              </div>
              <div>
                <Label>Moral Lesson</Label>
                <Textarea
                  value={form.moralLesson}
                  onChange={(e) => setForm({ ...form, moralLesson: e.target.value })}
                  placeholder="What lesson does this story teach?"
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!form.title || !form.ageGroupId || !form.contentYearId || pending}
                className="w-full"
              >
                {pending ? "Saving…" : editingId ? "Update Story" : "Create Story"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Age Group</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stories === undefined ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-4">
                    <Skeleton className="h-24 rounded-lg" />
                  </TableCell>
                </TableRow>
              ) : stories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <BookOpen className="h-6 w-6" />
                        </EmptyMedia>
                        <EmptyTitle>No stories yet</EmptyTitle>
                        <EmptyDescription>Create your first story to get started.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                stories.map((story) => (
                  <TableRow key={story.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {story.coverImage ? (
                          <img src={story.coverImage} alt="" className="h-8 w-8 rounded object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                          </div>
                        )}
                        {story.title}
                      </div>
                    </TableCell>
                    <TableCell>{story.ageGroup?.name}</TableCell>
                    <TableCell>Day {story.dayNumber}</TableCell>
                    <TableCell>
                      <Badge variant={story.isActive ? "default" : "secondary"}>
                        {story.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(story)} aria-label={`Edit ${story.title}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate({ id: story.id })}
                        disabled={deleteMutation.isPending}
                        aria-label={`Delete ${story.title}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ============== CHARACTERS TAB ==============
function CharactersTab() {
  const { data: characters } = trpc.character.list.useQuery();
  const utils = trpc.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", personality: "", catchphrase: "", color: "#FFB347", imageUrl: "",
  });

  const createMutation = trpc.character.create.useMutation({
    onSuccess: () => {
      utils.character.list.invalidate();
      setIsOpen(false);
      resetForm();
      toast.success("Character created!");
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.character.update.useMutation({
    onSuccess: () => {
      utils.character.list.invalidate();
      setIsOpen(false);
      setEditingId(null);
      toast.success("Character updated!");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.character.delete.useMutation({
    onSuccess: () => {
      utils.character.list.invalidate();
      toast.success("Character deleted.");
    },
    onError: (e) => toast.error(e.message),
  });
  const resetForm = () => setForm({ name: "", slug: "", description: "", personality: "", catchphrase: "", color: "#FFB347", imageUrl: "" });
  const edit = (character: {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    personality?: string | null;
    catchphrase?: string | null;
    color?: string | null;
    imageUrl?: string | null;
  }) => {
    setEditingId(character.id);
    setForm({ name: character.name, slug: character.slug, description: character.description || "", personality: character.personality || "", catchphrase: character.catchphrase || "", color: character.color || "#FFB347", imageUrl: character.imageUrl || "" });
    setIsOpen(true);
  };

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl font-semibold">Characters</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingId(null); }}><Plus className="h-4 w-4 mr-2" />Add Character</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Edit Character" : "Create Character"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Slug (e.g., chindela)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Textarea placeholder="Personality" value={form.personality} onChange={(e) => setForm({ ...form, personality: e.target.value })} />
              <Input placeholder="Catchphrase" value={form.catchphrase} onChange={(e) => setForm({ ...form, catchphrase: e.target.value })} />
              <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              <MediaUploader category="image" label="Character Image" value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
              <Button onClick={() => editingId ? updateMutation.mutate({ id: editingId, ...form }) : createMutation.mutate(form)} disabled={!form.name || !form.slug || pending} className="w-full">
                {pending ? "Saving…" : editingId ? "Save Character" : "Create Character"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {characters === undefined ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : characters.length === 0 ? (
        <Empty className="border-2 border-dashed border-border rounded-2xl">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Sparkles className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>No characters yet</EmptyTitle>
            <EmptyDescription>Create a character to feature in your stories.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((char) => (
            <Card key={char.id} className="overflow-hidden">
              <div className="h-2" style={{ backgroundColor: char.color || "#FFB347" }} />
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  {char.imageUrl ? (
                    <img src={char.imageUrl} alt={char.name} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: char.color || "#FFB347" }}>
                      {char.name?.[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="font-display font-semibold text-lg">{char.name}</h3>
                    <p className="text-sm text-muted-foreground">@{char.slug}</p>
                  </div>
                </div>
                <p className="text-sm text-foreground/80 mb-2">{char.description}</p>
                <p className="text-sm text-muted-foreground italic">"{char.catchphrase}"</p>
                <Badge className="mt-3" variant={char.isActive ? "default" : "secondary"}>
                  {char.isActive ? "Active" : "Inactive"}
                </Badge>
                <div className="mt-3 flex justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => edit(char)} aria-label={`Edit ${char.name}`}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate({ id: char.id })} disabled={deleteMutation.isPending} aria-label={`Delete ${char.name}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============== SAFETY TAB ==============
function SafetyTab() {
  const { data: headers } = trpc.safety.list.useQuery();
  const utils = trpc.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isGlobal] = useState(true);

  const createMutation = trpc.safety.create.useMutation({
    onSuccess: () => {
      utils.safety.list.invalidate();
      setIsOpen(false);
      setMessage("");
      toast.success("Safety header created!");
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.safety.update.useMutation({
    onSuccess: () => utils.safety.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.safety.delete.useMutation({
    onSuccess: () => {
      utils.safety.list.invalidate();
      toast.success("Safety header deleted.");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl font-semibold">Safety Headers</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Header</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Safety Header</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea
                placeholder="Safety message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button onClick={() => createMutation.mutate({ message, isGlobal })} disabled={!message || createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Creating…" : "Create Header"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {headers === undefined ? (
        <Skeleton className="h-16 rounded-lg" />
      ) : headers.length === 0 ? (
        <Empty className="border-2 border-dashed border-border rounded-2xl">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Shield className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>No safety headers yet</EmptyTitle>
            <EmptyDescription>Add a message to display to children while reading.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4">
          {headers.map((header) => (
            <Card key={header.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-info" />
                  <p className="text-sm">{header.message}</p>
                </div>
                <div className="flex gap-2 items-center">
                  {header.isGlobal && <Badge variant="outline">Global</Badge>}
                  <Badge variant={header.isActive ? "default" : "secondary"}>
                    {header.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Switch checked={header.isActive} onCheckedChange={(isActive) => updateMutation.mutate({ id: header.id, isActive })} aria-label={`Toggle ${header.message}`} />
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate({ id: header.id })} disabled={deleteMutation.isPending} aria-label="Delete safety header"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============== YEARS TAB ==============
function YearsTab() {
  const { data: years } = trpc.contentYear.list.useQuery();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [year, setYear] = useState("");
  const [label, setLabel] = useState("");
  const utils = trpc.useUtils();

  const createMutation = trpc.contentYear.create.useMutation({
    onSuccess: () => {
      utils.contentYear.list.invalidate();
      setIsOpen(false);
      setEditingId(null);
      setYear("");
      setLabel("");
      toast.success("Content year created!");
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.contentYear.update.useMutation({
    onSuccess: () => {
      utils.contentYear.list.invalidate();
      toast.success("Content year updated.");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.contentYear.delete.useMutation({
    onSuccess: () => utils.contentYear.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl font-semibold">Content Years</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); setYear(""); setLabel(""); }}><Plus className="h-4 w-4 mr-2" />Add Year</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Edit Content Year" : "Create Content Year"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <Input type="number" placeholder="Year (e.g., 2025)" value={year} onChange={(e) => setYear(e.target.value)} />
              <Input placeholder="Label (e.g., 2025 - Year of Kindness)" value={label} onChange={(e) => setLabel(e.target.value)} />
              <Button onClick={() => editingId ? updateMutation.mutate({ id: editingId, year: parseInt(year), label }) : createMutation.mutate({ year: parseInt(year), label })} disabled={!year || !label || createMutation.isPending || updateMutation.isPending} className="w-full">
                {createMutation.isPending || updateMutation.isPending ? "Saving…" : editingId ? "Save Year" : "Create Year"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {years === undefined ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : years.length === 0 ? (
        <Empty className="border-2 border-dashed border-border rounded-2xl">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Calendar className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>No content years yet</EmptyTitle>
            <EmptyDescription>Create a content year to organize stories by theme.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {years.map((y) => (
            <Card key={y.id}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="font-display font-semibold">{y.label}</h3>
                </div>
                <p className="text-sm text-foreground/80 mb-3">{y.description}</p>
                <Badge variant={y.isActive ? "default" : "secondary"}>
                  {y.isActive ? "Active" : "Inactive"}
                </Badge>
                <div className="mt-3 flex items-center justify-between">
                  <Switch checked={y.isActive} onCheckedChange={(isActive) => updateMutation.mutate({ id: y.id, isActive })} aria-label={`Toggle ${y.label}`} />
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingId(y.id); setYear(String(y.year)); setLabel(y.label); setIsOpen(true); }} aria-label={`Edit ${y.label}`}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate({ id: y.id })} disabled={deleteMutation.isPending} aria-label={`Delete ${y.label}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
                {deleteMutation.error && deleteMutation.variables?.id === y.id && (
                  <p className="text-xs text-destructive mt-2">{deleteMutation.error.message}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============== USERS TAB ==============
function UsersTab() {
  const { data: children } = trpc.admin.allChildren.useQuery();

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold">All Children</h2>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Age Group</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Entries</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {children === undefined ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-4">
                    <Skeleton className="h-24 rounded-lg" />
                  </TableCell>
                </TableRow>
              ) : children.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <IdCard className="h-6 w-6" />
                        </EmptyMedia>
                        <EmptyTitle>No children registered yet</EmptyTitle>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                children.map((child) => (
                  <TableRow key={child.id}>
                    <TableCell className="font-mono text-muted-foreground">{child.id}</TableCell>
                    <TableCell className="font-medium">{child.name}</TableCell>
                    <TableCell>{child.parent?.name || "Unknown"}</TableCell>
                    <TableCell>{child.ageGroup?.name}</TableCell>
                    <TableCell>{child.age} years</TableCell>
                    <TableCell>{child.totalEntries}</TableCell>
                    <TableCell>
                      <Badge variant={child.isActive ? "default" : "secondary"}>
                        {child.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ============== MEDIA TAB ==============
const mediaTypeIcons: Record<MediaCategory, typeof ImageIcon> = {
  image: ImageIcon,
  audio: Music,
  video: Video,
  pdf: FileText,
  document: FileIcon,
};

function MediaTab() {
  const [type, setType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [uploadCategory, setUploadCategory] = useState<MediaCategory>("image");
  const pageSize = 12;
  const utils = trpc.useUtils();

  const { data } = trpc.media.list.useQuery({
    type: type === "all" ? undefined : (type as MediaCategory),
    search: search || undefined,
    page,
    pageSize,
  });
  const deleteMutation = trpc.media.delete.useMutation({
    onSuccess: () => {
      utils.media.list.invalidate();
      toast.success("Media deleted.");
    },
    onError: (e) => toast.error(e.message),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold">Media Library</h2>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-40">
              <Label className="text-xs">Upload as</Label>
              <Select value={uploadCategory} onValueChange={(v) => setUploadCategory(v as MediaCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MediaCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[240px]">
              {/* key resets the uploader's internal preview after each successful upload */}
              <MediaUploader
                key={uploadCategory}
                category={uploadCategory}
                onChange={() => {
                  utils.media.list.invalidate();
                  toast.success("File uploaded!");
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3 items-center">
        <Select
          value={type}
          onValueChange={(v) => {
            setType(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {MediaCategories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Search filename..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
      </div>

      {data === undefined ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <Empty className="border-2 border-dashed border-border rounded-2xl">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ImageIcon className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>No media uploaded yet</EmptyTitle>
            <EmptyDescription>Upload an image, audio, or video file above to get started.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.items.map((item) => {
            const Icon = mediaTypeIcons[item.type as MediaCategory] ?? FileIcon;
            return (
              <Card key={item.id} className="overflow-hidden">
                <div className="h-28 bg-muted flex items-center justify-center">
                  {item.type === "image" ? (
                    <img src={item.url} alt={item.originalName} className="h-full w-full object-cover" />
                  ) : item.type === "video" ? (
                    <video src={item.url} className="h-full w-full object-cover" muted />
                  ) : (
                    <Icon className="h-10 w-10 text-muted-foreground/50" />
                  )}
                </div>
                <CardContent className="p-3 space-y-2">
                  <p className="text-xs font-medium truncate" title={item.originalName}>
                    {item.originalName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {item.size ? `${(item.size / 1024).toFixed(0)} KB` : ""} · {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                  {item.type === "audio" && <audio src={item.url} controls className="w-full h-8" />}
                  <div className="flex justify-between items-center pt-1">
                    <ReplaceMediaButton item={item} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate({ id: item.id })}
                      disabled={deleteMutation.isPending}
                      aria-label={`Delete ${item.originalName}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {data && data.total > pageSize && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function ReplaceMediaButton({ item }: { item: { id: number; type: MediaCategory; originalName: string } }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const utils = trpc.useUtils();
  const requestUpload = trpc.media.requestUpload.useMutation();
  const replaceMutation = trpc.media.replace.useMutation({
    onSuccess: () => {
      utils.media.list.invalidate();
      toast.success("File replaced!");
    },
  });

  const handleFile = async (file: File) => {
    setIsUploading(true);
    try {
      const { uploadUrl, fields, key } = await requestUpload.mutateAsync({
        category: item.type,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      });
      await uploadToPresignedPost(uploadUrl, fields, file);
      await replaceMutation.mutateAsync({
        id: item.id,
        key,
        category: item.type,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to replace file.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <Button
        variant="ghost"
        size="sm"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        aria-label={`Replace ${item.originalName}`}
      >
        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
      </Button>
    </>
  );
}

// ============== LESSONS TAB ==============
function LessonsTab() {
  const { data: stories } = trpc.story.list.useQuery();
  const [selectedStoryId, setSelectedStoryId] = useState<string>("");
  const { data: lessons } = trpc.story.lessons.useQuery(
    { storyId: parseInt(selectedStoryId) },
    { enabled: !!selectedStoryId }
  );
  const utils = trpc.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    content: "",
    pageNumber: "1",
    imageUrl: "",
    audioUrl: "",
    characterDialogue: "",
    interactiveElement: "",
  });

  const invalidateLessons = () => utils.story.lessons.invalidate({ storyId: parseInt(selectedStoryId) });

  const createMutation = trpc.story.createLesson.useMutation({
    onSuccess: () => {
      invalidateLessons();
      setIsOpen(false);
      resetForm();
      toast.success("Lesson created!");
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.story.updateLesson.useMutation({
    onSuccess: () => {
      invalidateLessons();
      setIsOpen(false);
      setEditingId(null);
      resetForm();
      toast.success("Lesson updated!");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.story.deleteLesson.useMutation({
    onSuccess: () => {
      invalidateLessons();
      toast.success("Lesson deleted.");
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () =>
    setForm({ title: "", content: "", pageNumber: "1", imageUrl: "", audioUrl: "", characterDialogue: "", interactiveElement: "" });

  const handleSubmit = () => {
    const data = {
      title: form.title,
      content: form.content,
      pageNumber: parseInt(form.pageNumber),
      imageUrl: form.imageUrl || undefined,
      audioUrl: form.audioUrl || undefined,
      characterDialogue: form.characterDialogue || undefined,
      interactiveElement: form.interactiveElement || undefined,
    };
    if (editingId) updateMutation.mutate({ id: editingId, ...data });
    else createMutation.mutate({ storyId: parseInt(selectedStoryId), ...data });
  };

  const edit = (lesson: {
    id: number;
    title: string;
    content: string;
    pageNumber: number;
    imageUrl?: string | null;
    audioUrl?: string | null;
    characterDialogue?: string | null;
    interactiveElement?: string | null;
  }) => {
    setEditingId(lesson.id);
    setForm({
      title: lesson.title,
      content: lesson.content,
      pageNumber: String(lesson.pageNumber),
      imageUrl: lesson.imageUrl || "",
      audioUrl: lesson.audioUrl || "",
      characterDialogue: lesson.characterDialogue || "",
      interactiveElement: lesson.interactiveElement || "",
    });
    setIsOpen(true);
  };

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
        <h2 className="font-display text-xl font-semibold">Lessons</h2>
        <div className="flex gap-3 items-center flex-wrap">
          <Select value={selectedStoryId} onValueChange={setSelectedStoryId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a story" />
            </SelectTrigger>
            <SelectContent>
              {stories?.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  {s.title} (Day {s.dayNumber})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                disabled={!selectedStoryId}
                onClick={() => {
                  resetForm();
                  setEditingId(null);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Lesson
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Lesson" : "Create Lesson"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <Label>Page Number</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.pageNumber}
                    onChange={(e) => setForm({ ...form, pageNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Content</Label>
                  <Textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="Page content"
                  />
                </div>
                <div>
                  <Label>Character Dialogue</Label>
                  <Textarea
                    value={form.characterDialogue}
                    onChange={(e) => setForm({ ...form, characterDialogue: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Interactive Element</Label>
                  <Select value={form.interactiveElement} onValueChange={(v) => setForm({ ...form, interactiveElement: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="activity">Activity</SelectItem>
                      <SelectItem value="reflection">Reflection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <MediaUploader
                  category="image"
                  label="Page Image"
                  value={form.imageUrl}
                  onChange={(url) => setForm({ ...form, imageUrl: url })}
                />
                <MediaUploader
                  category="audio"
                  label="Narration Audio"
                  value={form.audioUrl}
                  onChange={(url) => setForm({ ...form, audioUrl: url })}
                />
                <Button onClick={handleSubmit} disabled={!form.title || !form.content || pending} className="w-full">
                  {pending ? "Saving…" : editingId ? "Update Lesson" : "Create Lesson"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!selectedStoryId ? (
        <Empty className="border-2 border-dashed border-border rounded-2xl">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Layers className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>Select a story</EmptyTitle>
            <EmptyDescription>Choose a story above to manage its lessons.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : lessons === undefined ? (
        <Skeleton className="h-16 rounded-lg" />
      ) : lessons.length === 0 ? (
        <Empty className="border-2 border-dashed border-border rounded-2xl">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Layers className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>No lessons yet</EmptyTitle>
            <EmptyDescription>Add the first page of this story.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-3">
          {[...lessons]
            .sort((a, b) => a.pageNumber - b.pageNumber)
            .map((lesson) => (
              <Card key={lesson.id}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {lesson.imageUrl ? (
                      <img src={lesson.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        Page {lesson.pageNumber}: {lesson.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{lesson.content}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => edit(lesson)} aria-label={`Edit ${lesson.title}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate({ id: lesson.id })}
                      disabled={deleteMutation.isPending}
                      aria-label={`Delete ${lesson.title}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}

// ============== AGE GROUPS TAB ==============
function AgeGroupsTab() {
  const { data: ageGroups } = trpc.ageGroup.list.useQuery();
  const utils = trpc.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", minAge: "", maxAge: "", description: "", color: "#FFB347" });

  const createMutation = trpc.ageGroup.create.useMutation({
    onSuccess: () => {
      utils.ageGroup.list.invalidate();
      setIsOpen(false);
      resetForm();
      toast.success("Age group created!");
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.ageGroup.update.useMutation({
    onSuccess: () => {
      utils.ageGroup.list.invalidate();
      setIsOpen(false);
      setEditingId(null);
      resetForm();
      toast.success("Age group updated!");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.ageGroup.delete.useMutation({
    onSuccess: () => utils.ageGroup.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => setForm({ name: "", minAge: "", maxAge: "", description: "", color: "#FFB347" });
  const edit = (ag: {
    id: number;
    name: string;
    minAge: number;
    maxAge: number;
    description?: string | null;
    color?: string | null;
  }) => {
    setEditingId(ag.id);
    setForm({
      name: ag.name,
      minAge: String(ag.minAge),
      maxAge: String(ag.maxAge),
      description: ag.description || "",
      color: ag.color || "#FFB347",
    });
    setIsOpen(true);
  };
  const handleSubmit = () => {
    const data = {
      name: form.name,
      minAge: parseInt(form.minAge),
      maxAge: parseInt(form.maxAge),
      description: form.description || undefined,
      color: form.color,
    };
    if (editingId) updateMutation.mutate({ id: editingId, ...data });
    else createMutation.mutate(data);
  };

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl font-semibold">Age Groups</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setEditingId(null);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Age Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Age Group" : "Create Age Group"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input placeholder="Name (e.g., 5-7 years)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <Input type="number" placeholder="Min Age" value={form.minAge} onChange={(e) => setForm({ ...form, minAge: e.target.value })} />
                <Input type="number" placeholder="Max Age" value={form.maxAge} onChange={(e) => setForm({ ...form, maxAge: e.target.value })} />
              </div>
              <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              <Button onClick={handleSubmit} disabled={!form.name || !form.minAge || !form.maxAge || pending} className="w-full">
                {pending ? "Saving…" : editingId ? "Save Age Group" : "Create Age Group"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-sm text-muted-foreground -mt-2">
        Subscription pricing is flat across every age group (£{(SUBSCRIPTION_PRICE_PER_MONTH_GBP_PENCE / 100).toFixed(2)}/month) —
        age groups control content targeting only, not price.
      </p>

      {ageGroups === undefined ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : ageGroups.length === 0 ? (
        <Empty className="border-2 border-dashed border-border rounded-2xl">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>No age groups yet</EmptyTitle>
            <EmptyDescription>Create an age group to target content.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ageGroups.map((ag) => (
            <Card key={ag.id} className="overflow-hidden">
              <div className="h-2" style={{ backgroundColor: ag.color || "#FFB347" }} />
              <CardContent className="p-6">
                <h3 className="font-display font-semibold text-lg">{ag.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Ages {ag.minAge}-{ag.maxAge}
                </p>
                <p className="text-sm text-foreground/80">{ag.description}</p>
                <div className="mt-3 flex justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => edit(ag)} aria-label={`Edit ${ag.name}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate({ id: ag.id })} disabled={deleteMutation.isPending} aria-label={`Delete ${ag.name}`}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                {deleteMutation.error && deleteMutation.variables?.id === ag.id && (
                  <p className="text-xs text-destructive mt-2">{deleteMutation.error.message}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============== BILLING TAB (SUBSCRIPTIONS, PAYMENTS, CONTRIBUTIONS) ==============
function BillingTab() {
  const { data: subs } = trpc.admin.allSubscriptions.useQuery();
  const { data: contributions } = trpc.admin.allContributions.useQuery();
  const { data: stats } = trpc.admin.contributionStats.useQuery();

  const activeCount = subs?.filter((s) => s.status === "active").length ?? 0;
  const totalRevenue = subs?.reduce((sum, s) => sum + Number(s.totalPrice), 0) ?? 0;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold">Billing</h2>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Active Subscriptions</p>
            <p className="text-3xl font-bold mt-1">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Subscription Revenue</p>
            <p className="text-3xl font-bold mt-1 flex items-center gap-1">
              <PoundSterling className="h-6 w-6" />
              {totalRevenue.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Heart className="h-4 w-4 text-destructive" />
              Total Contributions
            </p>
            <p className="text-3xl font-bold mt-1 flex items-center gap-1">
              <PoundSterling className="h-6 w-6" />
              {(stats?.totalAmount ?? 0).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground/70">{stats?.count ?? 0} contribution(s)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Subscriptions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parent</TableHead>
                <TableHead>Child</TableHead>
                <TableHead>Age Group</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subs === undefined ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-4">
                    <Skeleton className="h-20 rounded-lg" />
                  </TableCell>
                </TableRow>
              ) : subs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No subscriptions yet.
                  </TableCell>
                </TableRow>
              ) : (
                subs.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.parent?.name || s.parent?.email}</TableCell>
                    <TableCell>{s.child?.name}</TableCell>
                    <TableCell>{s.ageGroup?.name}</TableCell>
                    <TableCell>{s.duration} mo</TableCell>
                    <TableCell>£{s.totalPrice}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5 text-destructive" />
            Contribution History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parent</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contributions === undefined ? (
                <TableRow>
                  <TableCell colSpan={4} className="p-4">
                    <Skeleton className="h-20 rounded-lg" />
                  </TableCell>
                </TableRow>
              ) : contributions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No contributions yet.
                  </TableCell>
                </TableRow>
              ) : (
                contributions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.parent?.name || c.parent?.email}</TableCell>
                    <TableCell>£{c.amount}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "completed" ? "default" : "secondary"}>{c.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
