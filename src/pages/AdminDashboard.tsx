import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
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
import { useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { useNavigate } from "react-router";

export default function AdminDashboard() {
  const { user, isLoading } = useAuth({ redirectOnUnauthenticated: true });
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-500 mb-4">You need admin privileges to access this page.</p>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-500">Manage content, users, and platform settings</p>
            </div>
            <Badge variant="default" className="bg-amber-500">Admin</Badge>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 lg:w-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="stories">Stories</TabsTrigger>
              <TabsTrigger value="characters">Characters</TabsTrigger>
              <TabsTrigger value="safety">Safety</TabsTrigger>
              <TabsTrigger value="years">Years</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OverviewTab />
            </TabsContent>
            <TabsContent value="stories">
              <StoriesTab />
            </TabsContent>
            <TabsContent value="characters">
              <CharactersTab />
            </TabsContent>
            <TabsContent value="safety">
              <SafetyTab />
            </TabsContent>
            <TabsContent value="years">
              <YearsTab />
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
    { label: "Users", value: stats?.users ?? 0, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Children", value: stats?.children ?? 0, icon: Users, color: "text-green-500", bg: "bg-green-50" },
    { label: "Stories", value: stats?.stories ?? 0, icon: BookOpen, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Lessons", value: stats?.lessons ?? 0, icon: Layers, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Diary Entries", value: stats?.diaryEntries ?? 0, icon: MessageSquare, color: "text-pink-500", bg: "bg-pink-50" },
    { label: "Active Subs", value: stats?.activeSubscriptions ?? 0, icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
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
          <TrendingUp className="h-5 w-5 text-amber-500" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activity?.recentDiaryEntries?.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
              <MessageSquare className="h-4 w-4 text-gray-400 mt-1" />
              <div>
                <p className="text-sm font-medium">
                  {entry.child?.name} submitted a diary entry
                </p>
                <p className="text-xs text-gray-500">
                  {entry.textContent?.substring(0, 80)}...
                </p>
              </div>
            </div>
          )) || (
            <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
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
          <CreditCard className="h-5 w-5 text-emerald-500" />
          Recent Subscriptions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activity?.recentSubscriptions?.map((sub) => (
            <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div>
                <p className="text-sm font-medium">
                  {sub.child?.name} - {sub.ageGroup?.name}
                </p>
                <p className="text-xs text-gray-500">
                  {sub.duration} months - £{sub.totalPrice}
                </p>
              </div>
              <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                {sub.status}
              </Badge>
            </div>
          )) || (
            <p className="text-sm text-gray-500 text-center py-4">No subscriptions yet</p>
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
  });

  const createMutation = trpc.story.create.useMutation({
    onSuccess: () => {
      utils.story.list.invalidate();
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = trpc.story.update.useMutation({
    onSuccess: () => {
      utils.story.list.invalidate();
      setIsDialogOpen(false);
      setEditingId(null);
      resetForm();
    },
  });

  const deleteMutation = trpc.story.delete.useMutation({
    onSuccess: () => utils.story.list.invalidate(),
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
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const startEdit = (story: any) => {
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
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Stories</h2>
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
                disabled={!form.title || !form.ageGroupId || !form.contentYearId}
                className="w-full"
              >
                {editingId ? "Update" : "Create"} Story
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
              {stories?.map((story) => (
                <TableRow key={story.id}>
                  <TableCell className="font-medium">{story.title}</TableCell>
                  <TableCell>{story.ageGroup?.name}</TableCell>
                  <TableCell>Day {story.dayNumber}</TableCell>
                  <TableCell>
                    <Badge variant={story.isActive ? "default" : "secondary"}>
                      {story.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(story)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate({ id: story.id })}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) || (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    No stories yet. Create your first story!
                  </TableCell>
                </TableRow>
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
    name: "", slug: "", description: "", personality: "", catchphrase: "", color: "#FFB347",
  });

  const createMutation = trpc.character.create.useMutation({
    onSuccess: () => {
      utils.character.list.invalidate();
      setIsOpen(false);
      setForm({ name: "", slug: "", description: "", personality: "", catchphrase: "", color: "#FFB347" });
    },
  });
  const updateMutation = trpc.character.update.useMutation({ onSuccess: () => { utils.character.list.invalidate(); setIsOpen(false); setEditingId(null); } });
  const deleteMutation = trpc.character.delete.useMutation({ onSuccess: () => utils.character.list.invalidate() });
  const resetForm = () => setForm({ name: "", slug: "", description: "", personality: "", catchphrase: "", color: "#FFB347" });
  const edit = (character: any) => {
    setEditingId(character.id);
    setForm({ name: character.name, slug: character.slug, description: character.description || "", personality: character.personality || "", catchphrase: character.catchphrase || "", color: character.color || "#FFB347" });
    setIsOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Characters</h2>
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
              <Button onClick={() => editingId ? updateMutation.mutate({ id: editingId, ...form }) : createMutation.mutate(form)} disabled={!form.name || !form.slug || createMutation.isPending || updateMutation.isPending} className="w-full">
                {editingId ? "Save Character" : "Create Character"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters?.map((char) => (
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
                  <h3 className="font-semibold text-lg">{char.name}</h3>
                  <p className="text-sm text-gray-500">@{char.slug}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{char.description}</p>
              <p className="text-sm text-gray-500 italic">"{char.catchphrase}"</p>
              <Badge className="mt-3" variant={char.isActive ? "default" : "secondary"}>
                {char.isActive ? "Active" : "Inactive"}
              </Badge>
              <div className="mt-3 flex justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => edit(char)} aria-label={`Edit ${char.name}`}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate({ id: char.id })} aria-label={`Delete ${char.name}`}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </CardContent>
          </Card>
        )) || (
          <p className="text-gray-500 col-span-3 text-center py-8">No characters yet.</p>
        )}
      </div>
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
    },
  });
  const updateMutation = trpc.safety.update.useMutation({ onSuccess: () => utils.safety.list.invalidate() });
  const deleteMutation = trpc.safety.delete.useMutation({ onSuccess: () => utils.safety.list.invalidate() });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Safety Headers</h2>
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
              <Button onClick={() => createMutation.mutate({ message, isGlobal })} disabled={!message} className="w-full">
                Create Header
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {headers?.map((header) => (
          <Card key={header.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-500" />
                <p className="text-sm">{header.message}</p>
              </div>
              <div className="flex gap-2">
                {header.isGlobal && <Badge variant="outline">Global</Badge>}
                <Badge variant={header.isActive ? "default" : "secondary"}>
                  {header.isActive ? "Active" : "Inactive"}
                </Badge>
                <Switch checked={header.isActive} onCheckedChange={(isActive) => updateMutation.mutate({ id: header.id, isActive })} aria-label={`Toggle ${header.message}`} />
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate({ id: header.id })} aria-label="Delete safety header"><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </CardContent>
          </Card>
        )) || (
          <p className="text-gray-500 text-center py-8">No safety headers yet.</p>
        )}
      </div>
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
    },
  });
  const updateMutation = trpc.contentYear.update.useMutation({ onSuccess: () => utils.contentYear.list.invalidate() });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Content Years</h2>
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
                {editingId ? "Save Year" : "Create Year"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {years?.map((y) => (
          <Card key={y.id}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold">{y.label}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">{y.description}</p>
              <Badge variant={y.isActive ? "default" : "secondary"}>
                {y.isActive ? "Active" : "Inactive"}
              </Badge>
              <div className="mt-3 flex items-center justify-between">
                <Switch checked={y.isActive} onCheckedChange={(isActive) => updateMutation.mutate({ id: y.id, isActive })} aria-label={`Toggle ${y.label}`} />
                <Button variant="ghost" size="sm" onClick={() => { setEditingId(y.id); setYear(String(y.year)); setLabel(y.label); setIsOpen(true); }} aria-label={`Edit ${y.label}`}><Pencil className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )) || (
          <p className="text-gray-500 col-span-3 text-center py-8">No content years yet.</p>
        )}
      </div>
    </div>
  );
}

// ============== USERS TAB ==============
function UsersTab() {
  const { data: children } = trpc.admin.allChildren.useQuery();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">All Children</h2>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Age Group</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Entries</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {children?.map((child) => (
                <TableRow key={child.id}>
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
              )) || (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No children registered yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
