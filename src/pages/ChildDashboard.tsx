import { useNavigate, Link } from "react-router";
import { trpc } from "@/providers/trpcClient";
import { useChildAuth } from "@/hooks/useChildAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { motion } from "framer-motion";
import {
  BookOpen,
  PenLine,
  Star,
  Sparkles,
  LogOut,
  Shield,
  RotateCw,
  Bookmark,
  Trophy,
  Sprout,
} from "lucide-react";

export default function ChildDashboard() {
  const navigate = useNavigate();
  const { data: characters } = trpc.character.list.useQuery();
  const { data: safetyHeaders } = trpc.safety.active.useQuery();
  const childSession = useChildAuth();
  const stories = trpc.story.list.useQuery(undefined, { enabled: !!childSession.data, retry: false });
  const { data: progress } = trpc.progress.myProgress.useQuery(undefined, { enabled: !!childSession.data });
  const { data: bookmarks } = trpc.progress.myBookmarks.useQuery(undefined, { enabled: !!childSession.data });
  const logout = trpc.auth.childLogout.useMutation({ onSuccess: () => navigate("/child-login") });

  const continueReading = progress?.filter((p) => !p.isCompleted).slice(0, 3) ?? [];
  const completedCount = progress?.filter((p) => p.isCompleted).length ?? 0;
  const streakDays = childSession.data?.streakDays ?? 0;

  const handleLogout = () => {
    logout.mutate();
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.4 },
    }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-background to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sprout className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-primary">
              Chindela
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
              <Star className="h-3 w-3 mr-1" />
              Child Mode
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Safety Header */}
      {safetyHeaders && safetyHeaders.length > 0 && (
        <div className="bg-info/10 border-b border-info/20 px-4 py-2">
          <div className="container mx-auto flex items-center gap-2">
            <Shield className="h-4 w-4 text-info flex-shrink-0" />
            <p className="text-xs text-info">
              {safetyHeaders[0]?.message}
            </p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          custom={0}
          className="text-center mb-8"
        >
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Hello, Little Explorer! 🌿
          </h1>
          <p className="text-muted-foreground">What would you like to do today?</p>
        </motion.div>

        {/* My Adventure stats */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          custom={0.5}
          className="grid grid-cols-3 gap-3 max-w-xl mx-auto mb-10"
        >
          <div className="rounded-2xl border-2 border-border bg-card text-center p-3 shadow-xs">
            <Trophy className="h-5 w-5 text-warning mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{streakDays}</p>
            <p className="text-[11px] text-muted-foreground">Day streak</p>
          </div>
          <div className="rounded-2xl border-2 border-border bg-card text-center p-3 shadow-xs">
            <BookOpen className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{completedCount}</p>
            <p className="text-[11px] text-muted-foreground">Stories finished</p>
          </div>
          <div className="rounded-2xl border-2 border-border bg-card text-center p-3 shadow-xs">
            <Bookmark className="h-5 w-5 text-accent mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{bookmarks?.length ?? 0}</p>
            <p className="text-[11px] text-muted-foreground">Bookmarks</p>
          </div>
        </motion.div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-12">
          <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={1}>
            <Link
              to={stories.data?.[0] ? `/child/read/${stories.data[0].id}` : "/child"}
              aria-disabled={!stories.data?.[0]}
              onClick={(event) => {
                if (!stories.data?.[0]) event.preventDefault();
              }}
            >
              <Card className="overflow-hidden hover:shadow-lifted transition-all cursor-pointer group border-4 border-primary/20 hover:border-primary/40">
                <div className="h-32 bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-primary-foreground group-hover:scale-110 transition-transform" />
                </div>
                <CardContent className="p-6 text-center">
                  <h2 className="font-display text-xl font-bold text-foreground mb-2">Read Stories</h2>
                  <p className="text-sm text-muted-foreground">
                    {stories.isLoading
                      ? "Finding your stories…"
                      : stories.data?.length
                      ? "Explore your available stories!"
                      : "Ask your parent to activate a subscription to unlock stories."}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={2}>
            <Link to="/child/diary">
              <Card className="overflow-hidden hover:shadow-lifted transition-all cursor-pointer group border-4 border-accent/20 hover:border-accent/40">
                <div className="h-32 bg-gradient-to-br from-accent to-warning flex items-center justify-center">
                  <PenLine className="h-16 w-16 text-white group-hover:scale-110 transition-transform" />
                </div>
                <CardContent className="p-6 text-center">
                  <h2 className="font-display text-xl font-bold text-foreground mb-2">My Diary</h2>
                  <p className="text-sm text-muted-foreground">
                    Write about your good deeds and get feedback!
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </div>

        {/* Continue Reading */}
        {continueReading.length > 0 && (
          <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={2.3} className="max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
              <RotateCw className="h-5 w-5 text-primary" />
              Continue Reading
            </h2>
            <div className="space-y-3">
              {continueReading.map((p) => (
                <Link key={p.id} to={`/child/read/${p.storyId}`}>
                  <Card className="hover:shadow-soft transition-shadow">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{p.story?.title ?? "Story"}</p>
                        <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                          <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{p.progress}%</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Bookmarks */}
        {bookmarks && bookmarks.length > 0 && (
          <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={2.6} className="max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-accent fill-accent" />
              Your Bookmarks
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {bookmarks.map((b) => (
                <Link key={b.id} to={`/child/read/${b.storyId}`}>
                  <Card className="hover:shadow-soft transition-shadow">
                    <CardContent className="p-4">
                      <p className="font-medium text-sm truncate">{b.story?.title ?? "Story"}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Characters */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={3} className="mb-12">
          <h2 className="font-display text-2xl font-bold text-center mb-6">
            <Sparkles className="h-6 w-6 inline text-accent mr-2" />
            Meet Your Friends
          </h2>
          {characters === undefined ? (
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : characters.length === 0 ? (
            <Empty className="max-w-md mx-auto border-2 border-dashed border-border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Sparkles className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>No friends yet</EmptyTitle>
                <EmptyDescription>Characters will appear here once stories are added.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
              {characters.map((char, i) => (
                <motion.div
                  key={char.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="text-center overflow-hidden hover:shadow-lifted transition-all cursor-pointer">
                    {char.imageUrl ? (
                      <img src={char.imageUrl} alt={char.name} className="w-full h-24 object-cover" />
                    ) : (
                      <div
                        className="w-full h-24 flex items-center justify-center text-white text-2xl font-bold"
                        style={{ backgroundColor: char.color || "hsl(var(--primary))" }}
                      >
                        {char.name?.[0]}
                      </div>
                    )}
                    <CardContent className="p-3">
                      <p className="font-bold text-sm">{char.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {char.catchphrase}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
