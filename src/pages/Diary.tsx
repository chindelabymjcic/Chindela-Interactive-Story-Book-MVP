import { useState } from "react";
import { useSearchParams } from "react-router";
import { trpc } from "@/providers/trpcClient";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  MessageSquare,
  Sparkles,
  Calendar,
  Smile,
  Frown,
  Zap,
  Heart,
  Wind,
  Users,
} from "lucide-react";

export default function Diary() {
  useAuth();
  const { data: children } = trpc.child.list.useQuery();
  const [searchParams] = useSearchParams();
  const initialChild = searchParams.get("child");

  const [selectedChild, setSelectedChild] = useState<string>(initialChild || "all");

  const { data: entries } = trpc.diary.list.useQuery(
    { childId: parseInt(selectedChild) },
    { enabled: selectedChild !== "all" }
  );

  const { data: feedback } = trpc.diary.feedback.useQuery(
    { childId: parseInt(selectedChild) },
    { enabled: selectedChild !== "all" }
  );

  const moodIcons: Record<string, LucideIcon> = {
    happy: Smile,
    sad: Frown,
    excited: Zap,
    calm: Wind,
    loved: Heart,
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">Diary Entries</h1>
            <p className="text-muted-foreground">View your children's daily good deeds</p>
          </div>

          <div className="mb-6">
            <Select value={selectedChild} onValueChange={setSelectedChild}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Select a child" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Children</SelectItem>
                {children?.map((child) => (
                  <SelectItem key={child.id} value={child.id.toString()}>
                    {child.name} ({child.ageGroup?.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedChild === "all" ? (
            <Empty className="border-2 border-dashed border-border rounded-2xl">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>Select a child to view their diary</EmptyTitle>
                <EmptyDescription>Choose a child from the dropdown above.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Entries */}
              <div>
                <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Entries ({entries?.length || 0})
                </h2>
                <div className="space-y-4">
                  {entries === undefined ? (
                    <Skeleton className="h-24 rounded-xl" />
                  ) : entries.length === 0 ? (
                    <Empty className="border-2 border-dashed border-border rounded-2xl py-8">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <BookOpen className="h-6 w-6" />
                        </EmptyMedia>
                        <EmptyTitle>No diary entries yet</EmptyTitle>
                        <EmptyDescription>Your child's good deeds will appear here.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    entries.map((entry) => {
                      const MoodIcon = moodIcons[entry.mood || "happy"] || Smile;
                      const entryFeedback = feedback?.find((f) => f.entryId === entry.id);

                      return (
                        <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                          <Card className="overflow-hidden">
                            <CardContent className="p-5">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <MoodIcon className="h-5 w-5 text-primary" />
                                  <span className="text-sm font-medium capitalize">{entry.mood || "happy"}</span>
                                </div>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {entry.entryDate ? new Date(entry.entryDate).toLocaleDateString() : "N/A"}
                                </span>
                              </div>

                              {entry.textContent && <p className="text-foreground/90 mb-3">{entry.textContent}</p>}

                              {entry.imageUrl && (
                                <img src={entry.imageUrl} alt="Diary entry" className="w-full max-h-48 object-cover rounded-lg mb-3" />
                              )}

                              {entryFeedback && (
                                <div className="mt-3 p-3 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-primary/15">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium text-primary">
                                      {entryFeedback.characterName || "Chindela"} says:
                                    </span>
                                  </div>
                                  <p className="text-sm text-foreground/90">{entryFeedback.positiveFeedback}</p>
                                </div>
                              )}

                              {entry.story && (
                                <Badge variant="outline" className="mt-3">
                                  From: {entry.story.title}
                                </Badge>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* AI Feedback Summary */}
              <div>
                <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  AI Feedback Summary
                </h2>
                <div className="space-y-4">
                  {feedback === undefined ? (
                    <Skeleton className="h-24 rounded-xl" />
                  ) : feedback.length === 0 ? (
                    <Empty className="border-2 border-dashed border-border rounded-2xl py-8">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Sparkles className="h-6 w-6" />
                        </EmptyMedia>
                        <EmptyTitle>No AI feedback yet</EmptyTitle>
                        <EmptyDescription>Feedback appears once your child submits a diary entry.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    feedback.map((fb) => (
                      <Card key={fb.id} className="overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-secondary to-accent" />
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-secondary-foreground" />
                              <span className="font-medium text-secondary-foreground">{fb.characterName || "Chindela"}</span>
                            </div>
                            <Badge variant="outline">Attempt {fb.attemptNumber}</Badge>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Positive Feedback</p>
                              <p className="text-sm text-foreground/90">{fb.positiveFeedback}</p>
                            </div>

                            {fb.mistakesExplained && (
                              <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                                <p className="text-xs font-medium text-warning uppercase tracking-wide">What to fix, and why</p>
                                <p className="text-sm text-foreground/90">{fb.mistakesExplained}</p>
                              </div>
                            )}

                            {fb.hints && (
                              <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                                <p className="text-xs font-medium text-accent uppercase tracking-wide">Hint</p>
                                <p className="text-sm text-foreground/90">{fb.hints}</p>
                              </div>
                            )}

                            {fb.reflectionGuidance && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reflection</p>
                                <p className="text-sm text-foreground/90">{fb.reflectionGuidance}</p>
                              </div>
                            )}

                            {fb.encouragement && (
                              <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                                <p className="text-xs font-medium text-success uppercase tracking-wide">Encouragement</p>
                                <p className="text-sm text-foreground/90">{fb.encouragement}</p>
                              </div>
                            )}

                            {fb.safeSuggestions && (
                              <div className="p-3 bg-info/10 rounded-lg border border-info/20">
                                <p className="text-xs font-medium text-info uppercase tracking-wide">Suggestion</p>
                                <p className="text-sm text-foreground/90">{fb.safeSuggestions}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
