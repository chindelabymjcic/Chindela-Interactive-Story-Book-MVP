import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";

const moods = [
  { key: "happy", label: "Happy", icon: Smile, color: "bg-yellow-100 text-yellow-600 border-yellow-300" },
  { key: "excited", label: "Excited", icon: Zap, color: "bg-orange-100 text-orange-600 border-orange-300" },
  { key: "calm", label: "Calm", icon: Wind, color: "bg-blue-100 text-blue-600 border-blue-300" },
  { key: "loved", label: "Loved", icon: Heart, color: "bg-red-100 text-red-600 border-red-300" },
  { key: "sad", label: "Sad", icon: Frown, color: "bg-gray-100 text-gray-600 border-gray-300" },
] as const;

export default function ChildDiary() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [selectedMood, setSelectedMood] = useState<"happy" | "excited" | "calm" | "loved" | "sad">("happy");
  const [submitted, setSubmitted] = useState(false);

  const childSession = trpc.auth.childMe.useQuery(undefined, { retry: false });
  const entries = trpc.diary.childEntries.useQuery(undefined, { enabled: !!childSession.data });
  const logout = trpc.auth.childLogout.useMutation({ onSuccess: () => navigate("/child-login") });
  useEffect(() => {
    if (!childSession.isLoading && !childSession.data) navigate("/child-login", { replace: true });
  }, [childSession.data, childSession.isLoading, navigate]);

  const createEntry = trpc.diary.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setText("");
      entries.refetch();
    },
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

  const handleLogout = () => {
    logout.mutate();
  };

  const streakDays = childSession.data?.streakDays ?? 0;
  const totalEntries = childSession.data?.totalEntries ?? entries.data?.length ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-emerald-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-green-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/child">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center">
              <PenLine className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">My Diary</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-amber-50 text-amber-700">
              <Trophy className="h-3 w-3 mr-1" />
              {streakDays} day streak
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <Card className="text-center border-2 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <Star className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900">{totalEntries}</p>
              <p className="text-xs text-gray-500">Entries</p>
            </CardContent>
          </Card>
          <Card className="text-center border-2 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <Trophy className="h-6 w-6 text-orange-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900">{streakDays}</p>
              <p className="text-xs text-gray-500">Day Streak</p>
            </CardContent>
          </Card>
          <Card className="text-center border-2 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <Calendar className="h-6 w-6 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900">
                {new Date().toLocaleDateString("en", { weekday: "short" })}
              </p>
              <p className="text-xs text-gray-500">Today</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Entry Form */}
        {!submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-4 border-green-200 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400" />
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  What good deed did you do today?
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Write about something kind you did, or something that made you feel proud!
                </p>

                {/* Mood Selector */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">How are you feeling?</p>
                  <div className="flex gap-2 flex-wrap">
                    {moods.map((mood) => (
                      <button
                        key={mood.key}
                        onClick={() => setSelectedMood(mood.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                          selectedMood === mood.key
                            ? mood.color + " scale-105"
                            : "bg-white border-gray-200 hover:border-gray-300"
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
                  className="min-h-[120px] text-base border-2 border-gray-200 focus:border-green-300 rounded-xl resize-none"
                />

                <Button
                  onClick={handleSubmit}
                  disabled={!text.trim() || createEntry.isPending}
                  className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-full h-12 text-lg font-bold gap-2"
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
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring" }}
            >
              {/* Success Message */}
              <Card className="border-4 border-amber-200 overflow-hidden mb-6">
                <div className="h-2 bg-gradient-to-r from-amber-400 to-orange-400" />
                <CardContent className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 to-orange-300 flex items-center justify-center mx-auto mb-4">
                      <Star className="h-10 w-10 text-white" />
                    </div>
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Amazing Job!
                  </h2>
                  <p className="text-gray-600">
                    Your good deed has been recorded! Your parent can view it in their diary dashboard.
                  </p>
                  <Button
                    onClick={() => setSubmitted(false)}
                    variant="outline"
                    className="mt-4 rounded-full"
                  >
                    Write Another Entry
                  </Button>
                </CardContent>
              </Card>

            </motion.div>
          </AnimatePresence>
        )}

        {/* Previous Entries */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-500" />
            Previous Entries
          </h2>
          <div className="space-y-3">
            {entries.data?.map((entry) => {
              const moodData = moods.find((m) => m.key === entry.mood) || moods[0];
              return (
                <Card key={entry.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${moodData.color.split(" ")[0]}`}>
                        <moodData.icon className={`h-4 w-4 ${moodData.color.split(" ")[1]}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-700 text-sm">{entry.textContent || "Diary entry"}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(entry.entryDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {entries.data?.length === 0 && <p className="text-sm text-gray-500">No diary entries yet.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
