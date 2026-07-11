import { useParams, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Shield,
  Sparkles,
  Home,
  PenLine,
} from "lucide-react";
import { Link } from "react-router";

export default function ChildReader() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const storyId = parseInt(id || "1");
  const { data: story } = trpc.story.byId.useQuery({ id: storyId });
  const { data: lessons } = trpc.story.lessons.useQuery({ storyId });
  const { data: safetyHeaders } = trpc.safety.active.useQuery();

  const [currentPage, setCurrentPage] = useState(0);

  const childSession = trpc.auth.childMe.useQuery(undefined, { retry: false });
  useEffect(() => {
    if (!childSession.isLoading && !childSession.data) navigate("/child-login", { replace: true });
  }, [childSession.data, childSession.isLoading, navigate]);

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      </div>
    );
  }

  // Build pages array
  const pages: any[] = [
    { type: "cover", story },
  ];

  if (story.character) {
    pages.push({ type: "character", character: story.character });
  }

  (lessons || []).forEach((lesson) => {
    pages.push({ type: "lesson", lesson });
  });

  if (story.moralLesson) {
    pages.push({ type: "moral", moralLesson: story.moralLesson, story });
  }

  const goNext = () => {
    if (currentPage < pages.length - 1) setCurrentPage(p => p + 1);
  };

  const goPrev = () => {
    if (currentPage > 0) setCurrentPage(p => p - 1);
  };

  const page = pages[currentPage];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b px-4 py-2">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/child">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
            <span className="font-medium text-sm hidden sm:inline">{story.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {currentPage + 1} / {pages.length}
            </span>
          </div>
        </div>
      </div>

      {/* Safety Banner */}
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

      {/* A4 Storybook */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center">
          <div
            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border-8 border-amber-100 overflow-hidden relative"
            style={{ aspectRatio: "210/297", maxHeight: "78vh" }}
          >
            {/* Decorative corner elements */}
            <div className="absolute top-3 left-3 w-8 h-8 border-t-4 border-l-4 border-amber-200 rounded-tl-lg z-10" />
            <div className="absolute top-3 right-3 w-8 h-8 border-t-4 border-r-4 border-amber-200 rounded-tr-lg z-10" />
            <div className="absolute bottom-3 left-3 w-8 h-8 border-b-4 border-l-4 border-amber-200 rounded-bl-lg z-10" />
            <div className="absolute bottom-3 right-3 w-8 h-8 border-b-4 border-r-4 border-amber-200 rounded-br-lg z-10" />

            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="absolute inset-0 p-8 sm:p-10 overflow-y-auto"
              >
                {page.type === "cover" && <CoverPage story={story} />}
                {page.type === "character" && <CharacterPage character={page.character} />}
                {page.type === "lesson" && <LessonPage lesson={page.lesson} />}
                {page.type === "moral" && <MoralPage moralLesson={page.moralLesson} story={page.story} />}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/95 to-transparent z-20">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goPrev}
                  disabled={currentPage === 0}
                  className="rounded-full"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex gap-1.5">
                  {pages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        i === currentPage
                          ? "bg-amber-500 w-6"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                    />
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goNext}
                  disabled={currentPage === pages.length - 1}
                  className="rounded-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CoverPage({ story }: { story: any }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {story.coverImage ? (
          <img
            src={story.coverImage}
            alt=""
            className="w-40 h-40 sm:w-48 sm:h-48 object-cover rounded-2xl mb-6 shadow-lg"
          />
        ) : (
          <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl bg-gradient-to-br from-amber-300 via-orange-300 to-rose-300 flex items-center justify-center mb-6 shadow-lg">
            <BookOpen className="h-20 w-20 text-white/80" />
          </div>
        )}
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3"
      >
        {story.title}
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-gray-600 mb-4 max-w-sm text-sm sm:text-base"
      >
        {story.description || "An exciting adventure awaits!"}
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex gap-2 flex-wrap justify-center"
      >
        <Badge variant="outline" className="text-xs">
          Day {story.dayNumber}
        </Badge>
        <Badge className="bg-amber-500 text-xs">{story.ageGroup?.name}</Badge>
        {story.theme && (
          <Badge variant="outline" className="text-xs">
            {story.theme}
          </Badge>
        )}
      </motion.div>

      {story.character && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 text-sm text-gray-500"
        >
          Featuring <span className="font-medium text-amber-600">{story.character.name}</span>
        </motion.p>
      )}
    </div>
  );
}

function CharacterPage({ character }: { character: any }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        {character.imageUrl ? (
          <img
            src={character.imageUrl}
            alt={character.name}
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover mb-6 border-4 shadow-xl"
            style={{ borderColor: character.color || "#FFB347" }}
          />
        ) : (
          <div
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center text-white text-4xl sm:text-5xl font-bold mb-6 border-4 shadow-xl"
            style={{
              backgroundColor: character.color || "#FFB347",
              borderColor: character.color || "#FFB347",
            }}
          >
            {character.name?.[0]}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Meet {character.name}
        </h2>
        <p className="text-gray-600 mb-4 max-w-sm text-sm sm:text-base">
          {character.description}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          <strong>Personality:</strong> {character.personality}
        </p>
        <blockquote className="text-lg sm:text-xl italic text-amber-600 font-medium">
          "{character.catchphrase}"
        </blockquote>
      </motion.div>
    </div>
  );
}

function LessonPage({ lesson }: { lesson: any }) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline" className="text-xs">
          Page {lesson.pageNumber}
        </Badge>
        {lesson.audioUrl && (
          <Badge variant="outline" className="text-xs text-blue-500">
            <Sparkles className="h-3 w-3 mr-1" />
            Listen
          </Badge>
        )}
      </div>

      <motion.h2
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-xl sm:text-2xl font-bold text-gray-900 mb-4"
      >
        {lesson.title}
      </motion.h2>

      {lesson.imageUrl && (
        <motion.img
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          src={lesson.imageUrl}
          alt=""
          className="w-full max-h-36 object-cover rounded-xl mb-4 shadow-md"
        />
      )}

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1"
      >
        <p className="text-gray-700 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
          {lesson.content}
        </p>
      </motion.div>

      {lesson.characterDialogue && (
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200"
        >
          <Sparkles className="h-4 w-4 text-amber-500 mb-1" />
          <p className="text-sm text-amber-800 italic">
            "{lesson.characterDialogue}"
          </p>
        </motion.div>
      )}
    </div>
  );
}

function MoralPage({ moralLesson, story }: { moralLesson: string; story: any }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-amber-300 via-orange-300 to-rose-300 flex items-center justify-center mb-6 shadow-xl"
      >
        <Sparkles className="h-12 w-12 text-white" />
      </motion.div>

      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl sm:text-2xl font-bold text-gray-900 mb-4"
      >
        The Moral of the Story
      </motion.h2>

      <motion.blockquote
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-lg sm:text-xl text-gray-700 italic mb-6 max-w-sm"
      >
        "{moralLesson}"
      </motion.blockquote>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-sm text-gray-500 mb-6"
      >
        Thank you for reading "{story.title}"!
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Link to="/child/diary">
          <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 gap-2 rounded-full px-6">
            <PenLine className="h-4 w-4" />
            Write in Your Diary
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
