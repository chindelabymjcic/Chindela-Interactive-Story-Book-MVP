import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { trpc } from "@/providers/trpcClient";
import { useChildAuth } from "@/hooks/useChildAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Celebration } from "@/components/shared/Celebration";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Home,
  PenLine,
  Send,
  Sparkles,
  Smile,
  Frown,
  Zap,
  Heart,
  Wind,
  Star,
  Calendar,
  Trophy,
  BookOpen,
  LogOut,
  Lightbulb,
  RotateCcw,
  ThumbsUp,
  Compass,
  Search,
  Leaf,
  ShieldAlert,
} from "lucide-react";

const moods = [
  { key: "happy", label: "Happy", icon: Smile, color: "bg-warning/15 text-warning border-warning/40" },
  { key: "excited", label: "Excited", icon: Zap, color: "bg-accent/15 text-accent border-accent/40" },
  { key: "calm", label: "Calm", icon: Wind, color: "bg-info/15 text-info border-info/40" },
  { key: "loved", label: "Loved", icon: Heart, color: "bg-destructive/15 text-destructive border-destructive/40" },
  { key: "sad", label: "Sad", icon: Frown, color: "bg-muted text-muted-foreground border-border" },
] as const;

export default function ChildDiary() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [selectedMood, setSelectedMood] = useState<"happy" | "excited" | "calm" | "loved" | "sad">("happy");
  const [submitted, setSubmitted] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState<number | null>(null);
  const [isRevising, setIsRevising] = useState(false);
  const [revisedText, setRevisedText] = useState("");
  const [celebrate, setCelebrate] = useState(false);

  const childSession = useChildAuth();
  const entries = trpc.diary.childEntries.useQuery(undefined, { enabled: !!childSession.data });
  const logout = trpc.auth.childLogout.useMutation({ onSuccess: () => navigate("/child-login") });
  const utils = trpc.useUtils();

  const entryFeedback = trpc.diary.entryFeedback.useQuery(
    { entryId: activeEntryId ?? 0 },
    { enabled: activeEntryId !== null }
  );
  const attempts = entryFeedback.data ?? [];
  const latestFeedback = attempts.at(-1);

  const createEntry = trpc.diary.create.useMutation({
    onSuccess: (entry) => {
      setSubmitted(true);
      setText("");
      setActiveEntryId(entry!.id);
      setCelebrate(true);
      toast.success("Your good deed was submitted!");
      entries.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const resubmitEntry = trpc.diary.resubmit.useMutation({
    onSuccess: () => {
      setIsRevising(false);
      utils.diary.entryFeedback.invalidate({ entryId: activeEntryId ?? 0 });
      entries.refetch();
      toast.success("Nice work — your tutor is looking at your update!");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!text.trim()) return;
    createEntry.mutate({
      childId: childSession.data!.id,
      textContent: text,
      mood: selectedMood,
      entryDate: new Date().toISOString(),
    });
  };

  const handleResubmit = () => {
    if (!activeEntryId || !revisedText.trim()) return;
    resubmitEntry.mutate({ entryId: activeEntryId, textContent: revisedText });
  };

  const handleLogout = () => {
    logout.mutate();
  };

  const streakDays = childSession.data?.streakDays ?? 0;
  const totalEntries = childSession.data?.totalEntries ?? entries.data?.length ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-primary/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/child">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <PenLine className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">My Diary</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
              <Trophy className="h-3 w-3 mr-1" />
              {streakDays} day streak
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl relative">
        <Celebration trigger={celebrate} />

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-4 mb-8">
          <Card className="text-center border-2 border-warning/30 bg-warning/5">
            <CardContent className="p-4">
              <Star className="h-6 w-6 text-warning mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{totalEntries}</p>
              <p className="text-xs text-muted-foreground">Entries</p>
            </CardContent>
          </Card>
          <Card className="text-center border-2 border-accent/30 bg-accent/5">
            <CardContent className="p-4">
              <Trophy className="h-6 w-6 text-accent mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{streakDays}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
          <Card className="text-center border-2 border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <Calendar className="h-6 w-6 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">
                {new Date().toLocaleDateString("en", { weekday: "short" })}
              </p>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Entry Form */}
        {!submitted ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-4 border-primary/20 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent" />
              <CardContent className="p-6">
                <h2 className="font-display text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  What good deed did you do today?
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Write about something kind you did, or something that made you feel proud!
                </p>

                {/* Mood Selector */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-foreground mb-2">How are you feeling?</p>
                  <div className="flex gap-2 flex-wrap">
                    {moods.map((mood) => (
                      <button
                        key={mood.key}
                        onClick={() => setSelectedMood(mood.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                          selectedMood === mood.key
                            ? mood.color + " scale-105"
                            : "bg-card border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <mood.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{mood.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Input */}
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Today I helped my friend by..."
                  className="min-h-[120px] text-base border-2 border-border focus-visible:border-primary rounded-xl resize-none"
                />

                <Button
                  onClick={handleSubmit}
                  disabled={!text.trim() || createEntry.isPending}
                  className="w-full mt-4 bg-gradient-to-r from-primary to-secondary hover:opacity-90 rounded-full h-12 text-lg font-bold gap-2"
                >
                  {createEntry.isPending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Submit My Good Deed!
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring" }}>
              {/* Success Message */}
              <Card className="border-4 border-warning/30 overflow-hidden mb-6">
                <div className="h-2 bg-gradient-to-r from-warning to-accent" />
                <CardContent className="p-8 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-warning to-accent flex items-center justify-center mx-auto mb-4">
                      <Star className="h-10 w-10 text-white" />
                    </div>
                  </motion.div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-2">Amazing Job!</h2>
                  <p className="text-muted-foreground">
                    Your good deed has been recorded! Your parent can view it in their diary dashboard.
                  </p>
                </CardContent>
              </Card>

              {/* Attempt timeline */}
              {attempts.length > 1 && (
                <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                  {attempts.map((a, i) => (
                    <div key={a.id} className="flex items-center gap-2">
                      <Badge
                        variant={i === attempts.length - 1 ? "default" : "outline"}
                        className={i === attempts.length - 1 ? "bg-primary" : ""}
                      >
                        Attempt {a.attemptNumber}
                      </Badge>
                      {i < attempts.length - 1 && <span className="text-muted-foreground text-xs">→</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Tutor feedback */}
              {entryFeedback.isLoading && (
                <div className="flex items-center justify-center gap-2 mb-6 text-sm text-muted-foreground">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                    className="inline-flex"
                  >
                    <Sparkles className="h-4 w-4 text-accent" />
                  </motion.span>
                  Chindela is thinking about what you wrote…
                </div>
              )}
              {latestFeedback && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <Card className="border-4 border-secondary/40 overflow-hidden mb-6 relative">
                    <div className="h-2 bg-gradient-to-r from-secondary via-primary to-accent" />
                    <CardContent className="p-6 space-y-4">
                      {/* Speech-bubble style tutor header */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 shadow-soft">
                          <Sparkles className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div className="flex-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5">
                          <span className="font-display font-bold text-foreground">
                            {latestFeedback.characterName || "Chindela"} says:
                          </span>
                        </div>
                      </div>

                      <FeedbackSection
                        icon={ThumbsUp}
                        label="What you did well"
                        text={latestFeedback.positiveFeedback}
                        tone="success"
                        delay={0.05}
                      />
                      {latestFeedback.reflectionGuidance && (
                        <FeedbackSection
                          icon={Compass}
                          label="Let's think about this"
                          text={latestFeedback.reflectionGuidance}
                          tone="info"
                          delay={0.1}
                        />
                      )}
                      {latestFeedback.mistakesExplained && (
                        <FeedbackSection
                          icon={Search}
                          label="Something to improve"
                          text={latestFeedback.mistakesExplained}
                          tone="warning"
                          delay={0.15}
                        />
                      )}
                      {latestFeedback.hints && (
                        <FeedbackSection
                          icon={Lightbulb}
                          label="Try this next"
                          text={latestFeedback.hints}
                          tone="accent"
                          delay={0.2}
                        />
                      )}
                      {latestFeedback.encouragement && (
                        <FeedbackSection
                          icon={Leaf}
                          label="Encouragement"
                          text={latestFeedback.encouragement}
                          tone="success"
                          delay={0.25}
                        />
                      )}
                      {latestFeedback.safeSuggestions && (
                        <FeedbackSection
                          icon={ShieldAlert}
                          label="Safety tip"
                          text={latestFeedback.safeSuggestions}
                          tone="info"
                          delay={0.3}
                        />
                      )}

                      {isRevising ? (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3 pt-2">
                          <Textarea
                            value={revisedText}
                            onChange={(e) => setRevisedText(e.target.value)}
                            className="min-h-[100px] border-2 border-border rounded-xl resize-none"
                            placeholder="Update your entry based on the hint above..."
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={handleResubmit}
                              disabled={!revisedText.trim() || resubmitEntry.isPending}
                              className="flex-1 bg-secondary text-secondary-foreground hover:opacity-90 rounded-full"
                            >
                              {resubmitEntry.isPending ? "Sending…" : "Resubmit"}
                            </Button>
                            <Button variant="outline" className="rounded-full" onClick={() => setIsRevising(false)}>
                              Cancel
                            </Button>
                          </div>
                        </motion.div>
                      ) : (
                        <Button
                          variant="outline"
                          className="rounded-full"
                          onClick={() => {
                            setRevisedText(latestFeedback.submittedText);
                            setIsRevising(true);
                          }}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Try again with this hint
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              <Button
                onClick={() => {
                  setSubmitted(false);
                  setActiveEntryId(null);
                  setIsRevising(false);
                  setCelebrate(false);
                }}
                variant="outline"
                className="rounded-full"
              >
                Write Another Entry
              </Button>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Previous Entries */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8">
          <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Previous Entries
          </h2>
          <div className="space-y-3">
            {entries.data?.map((entry) => {
              const moodData = moods.find((m) => m.key === entry.mood) || moods[0];
              return (
                <Card key={entry.id} className="overflow-hidden hover:shadow-soft transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${moodData.color.split(" ")[0]}`}>
                        <moodData.icon className={`h-4 w-4 ${moodData.color.split(" ")[1]}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-foreground/90 text-sm">{entry.textContent || "Diary entry"}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(entry.entryDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {entries.data?.length === 0 && (
              <Empty className="border-2 border-dashed border-border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <PenLine className="h-6 w-6" />
                  </EmptyMedia>
                  <EmptyTitle>Your good deeds will appear here</EmptyTitle>
                  <EmptyDescription>Write your first entry above to get started!</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const toneClasses: Record<string, { bg: string; text: string; icon: string }> = {
  success: { bg: "bg-success/10 border-success/20", text: "text-success", icon: "text-success" },
  info: { bg: "bg-info/10 border-info/20", text: "text-info", icon: "text-info" },
  warning: { bg: "bg-warning/10 border-warning/20", text: "text-warning", icon: "text-warning" },
  accent: { bg: "bg-accent/10 border-accent/20", text: "text-accent", icon: "text-accent" },
};

function FeedbackSection({
  icon: Icon,
  label,
  text,
  tone,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  text: string;
  tone: keyof typeof toneClasses;
  delay: number;
}) {
  const colors = toneClasses[tone];
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`p-3 rounded-xl border ${colors.bg}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${colors.icon}`} />
        <p className={`text-xs font-semibold uppercase tracking-wide ${colors.text}`}>{label}</p>
      </div>
      <p className="text-sm text-foreground/90">{text}</p>
    </motion.div>
  );
}
