import { useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  BookOpen,
  PenLine,
  Star,
  Sparkles,
  LogOut,
  Shield,
} from "lucide-react";

export default function ChildDashboard() {
  const navigate = useNavigate();
  const { data: characters } = trpc.character.list.useQuery();
  const { data: safetyHeaders } = trpc.safety.active.useQuery();
  const childSession = trpc.auth.childMe.useQuery(undefined, { retry: false });
  const stories = trpc.story.list.useQuery(undefined, { enabled: !!childSession.data, retry: false });
  const logout = trpc.auth.childLogout.useMutation({ onSuccess: () => navigate("/child-login") });
  useEffect(() => {
    if (!childSession.isLoading && !childSession.data) navigate("/child-login", { replace: true });
  }, [childSession.data, childSession.isLoading, navigate]);

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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-amber-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              Chindela
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-amber-50 text-amber-700">
              <Star className="h-3 w-3 mr-1" />
              Child Mode
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Safety Header */}
      {safetyHeaders && safetyHeaders.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
          <div className="container mx-auto flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <p className="text-xs text-blue-600">
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
          className="text-center mb-10"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hello, Little Explorer!
          </h1>
          <p className="text-gray-500">What would you like to do today?</p>
        </motion.div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-12">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            custom={1}
          >
            <Link to={stories.data?.[0] ? `/child/read/${stories.data[0].id}` : "/child"} aria-disabled={!stories.data?.[0]} onClick={(event) => { if (!stories.data?.[0]) event.preventDefault(); }}>
              <Card className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group border-4 border-amber-200 hover:border-amber-300">
                <div className="h-32 bg-gradient-to-br from-amber-300 to-orange-300 flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-white group-hover:scale-110 transition-transform" />
                </div>
                <CardContent className="p-6 text-center">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Read Stories</h2>
                  <p className="text-sm text-gray-500">{stories.isLoading ? "Finding your stories…" : stories.data?.length ? "Explore your available stories!" : "Ask your parent to activate a subscription to unlock stories."}</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            custom={2}
          >
            <Link to="/child/diary">
              <Card className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group border-4 border-green-200 hover:border-green-300">
                <div className="h-32 bg-gradient-to-br from-green-300 to-emerald-300 flex items-center justify-center">
                  <PenLine className="h-16 w-16 text-white group-hover:scale-110 transition-transform" />
                </div>
                <CardContent className="p-6 text-center">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">My Diary</h2>
                  <p className="text-sm text-gray-500">
                    Write about your good deeds and get feedback!
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </div>

        {/* Characters */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          custom={3}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-center mb-6">
            <Sparkles className="h-6 w-6 inline text-amber-500 mr-2" />
            Meet Your Friends
          </h2>
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {characters?.map((char, i) => (
              <motion.div
                key={char.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <Card className="text-center overflow-hidden hover:shadow-lg transition-all cursor-pointer">
                  {char.imageUrl ? (
                    <img
                      src={char.imageUrl}
                      alt={char.name}
                      className="w-full h-24 object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-24 flex items-center justify-center text-white text-2xl font-bold"
                      style={{ backgroundColor: char.color || "#FFB347" }}
                    >
                      {char.name?.[0]}
                    </div>
                  )}
                  <CardContent className="p-3">
                    <p className="font-bold text-sm">{char.name}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {char.catchphrase}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
