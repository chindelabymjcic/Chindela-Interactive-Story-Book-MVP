import { useParams } from "react-router";
import { trpc } from "@/providers/trpcClient";
import { useChildAuth } from "@/hooks/useChildAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Celebration } from "@/components/shared/Celebration";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Shield,
  Sparkles,
  Home,
  PenLine,
  Bookmark,
} from "lucide-react";
import { Link } from "react-router";

interface ReaderStory {
  title: string;
  description?: string | null;
  coverImage?: string | null;
  dayNumber: number;
  theme?: string | null;
  ageGroup?: { name: string } | null;
  character?: { name: string } | null;
}

interface ReaderCharacter {
  name: string;
  imageUrl?: string | null;
  color?: string | null;
  description?: string | null;
  personality?: string | null;
  catchphrase?: string | null;
}

interface ReaderLesson {
  id: number;
  pageNumber: number;
  title: string;
  content: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  characterDialogue?: string | null;
}

type ReaderPage =
  | { type: "cover"; story: ReaderStory }
  | { type: "character"; character: ReaderCharacter }
  | { type: "lesson"; lesson: ReaderLesson }
  | { type: "moral"; moralLesson: string; story: ReaderStory };

export default function ChildReader() {
  const { id } = useParams<{ id: string }>();
  const storyId = parseInt(id || "1");
  const { data: story } = trpc.story.byId.useQuery({ id: storyId });
  const { data: lessons } = trpc.story.lessons.useQuery({ storyId });
  const { data: safetyHeaders } = trpc.safety.active.useQuery();
  const { data: myProgress } = trpc.progress.myProgress.useQuery();
  const utils = trpc.useUtils();

  const [currentPage, setCurrentPage] = useState(0);
  const [resumedForStoryId, setResumedForStoryId] = useState<number | null>(null);
  const [reachedEnd, setReachedEnd] = useState(false);

  useChildAuth();

  const existingProgress = myProgress?.find((p) => p.storyId === storyId);
  const saveProgress = trpc.progress.save.useMutation({
    onSuccess: () => utils.progress.myProgress.invalidate(),
  });
  const toggleBookmark = trpc.progress.toggleBookmark.useMutation({
    onSuccess: () => utils.progress.myProgress.invalidate(),
  });

  const pages: ReaderPage[] = useMemo(() => {
    if (!story) return [];
    const built: ReaderPage[] = [{ type: "cover", story }];
    if (story.character) built.push({ type: "character", character: story.character });
    for (const lesson of lessons ?? []) built.push({ type: "lesson", lesson });
    if (story.moralLesson) built.push({ type: "moral", moralLesson: story.moralLesson, story });
    return built;
  }, [story, lessons]);

  // Resume from the last saved page exactly once per story, as soon as
  // progress has loaded. Adjusting state directly during render (rather than
  // in an effect) is the React-recommended pattern for "sync state from a
  // prop/data change" -- see https://react.dev/learn/you-might-not-need-an-effect.
  if (resumedForStoryId !== storyId && myProgress && existingProgress && !existingProgress.isCompleted && pages.length > 0) {
    setResumedForStoryId(storyId);
    const resumeIndex = Math.min(existingProgress.lastPageIndex, pages.length - 1);
    if (resumeIndex > 0) setCurrentPage(resumeIndex);
  }

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-secondary/30 to-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const saveCurrentProgress = (pageIndex: number) => {
    const target = pages[pageIndex];
    const lessonId = target?.type === "lesson" ? target.lesson.id : undefined;
    saveProgress.mutate({ storyId, lessonId, pageIndex, totalPages: pages.length });
  };

  const gotoPage = (index: number) => {
    setCurrentPage(index);
    saveCurrentProgress(index);
    if (index === pages.length - 1 && pages.length > 1) setReachedEnd(true);
  };

  const goNext = () => {
    if (currentPage < pages.length - 1) gotoPage(currentPage + 1);
  };

  const goPrev = () => {
    if (currentPage > 0) setCurrentPage((p) => p - 1);
  };

  const handleBookmarkToggle = () => {
    const willBookmark = !existingProgress?.isBookmarked;
    toggleBookmark.mutate(
      { storyId },
      {
        onSuccess: () => {
          toast.success(willBookmark ? "Saved to your bookmarks!" : "Removed from bookmarks");
        },
      }
    );
  };

  const page = pages[currentPage];

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-background to-background">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/60 px-4 py-2">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/child">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
            <span className="font-display font-medium text-sm hidden sm:inline">{story.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmarkToggle}
              aria-label={existingProgress?.isBookmarked ? "Remove bookmark" : "Bookmark this story"}
            >
              <motion.span whileTap={{ scale: 1.3 }} className="flex">
                <Bookmark
                  className={`h-4 w-4 transition-colors ${
                    existingProgress?.isBookmarked ? "fill-accent text-accent" : "text-muted-foreground"
                  }`}
                />
              </motion.span>
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentPage + 1} / {pages.length}
            </span>
          </div>
        </div>
      </div>

      {/* Safety Banner */}
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

      {/* A4 Storybook */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center">
          <div
            className="w-full max-w-xl bg-card rounded-2xl shadow-lifted border-8 border-primary/10 overflow-hidden relative"
            style={{ aspectRatio: "210/297", maxHeight: "78vh" }}
          >
            {/* Decorative corner elements */}
            <div className="absolute top-3 left-3 w-8 h-8 border-t-4 border-l-4 border-primary/20 rounded-tl-lg z-10" />
            <div className="absolute top-3 right-3 w-8 h-8 border-t-4 border-r-4 border-primary/20 rounded-tr-lg z-10" />
            <div className="absolute bottom-3 left-3 w-8 h-8 border-b-4 border-l-4 border-primary/20 rounded-bl-lg z-10" />
            <div className="absolute bottom-3 right-3 w-8 h-8 border-b-4 border-r-4 border-primary/20 rounded-br-lg z-10" />

            <Celebration trigger={reachedEnd && page?.type === "moral"} />

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
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-card via-card/95 to-transparent z-20">
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
                      onClick={() => gotoPage(i)}
                      aria-label={`Go to page ${i + 1}`}
                      className={`h-2.5 rounded-full transition-all ${
                        i === currentPage ? "bg-primary w-6" : "bg-muted w-2.5 hover:bg-muted-foreground/30"
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

function CoverPage({ story }: { story: ReaderStory }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
        {story.coverImage ? (
          <img
            src={story.coverImage}
            alt=""
            className="w-40 h-40 sm:w-48 sm:h-48 object-cover rounded-2xl mb-6 shadow-lifted"
          />
        ) : (
          <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center mb-6 shadow-lifted">
            <BookOpen className="h-20 w-20 text-white/80" />
          </div>
        )}
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-3"
      >
        {story.title}
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground mb-4 max-w-sm text-sm sm:text-base"
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
        <Badge className="bg-primary text-xs">{story.ageGroup?.name}</Badge>
        {story.theme && (
          <Badge variant="outline" className="text-xs">
            {story.theme}
          </Badge>
        )}
      </motion.div>

      {story.character && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-4 text-sm text-muted-foreground">
          Featuring <span className="font-medium text-primary">{story.character.name}</span>
        </motion.p>
      )}
    </div>
  );
}

function CharacterPage({ character }: { character: ReaderCharacter }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200 }}>
        {character.imageUrl ? (
          <img
            src={character.imageUrl}
            alt={character.name}
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover mb-6 border-4 shadow-xl"
            style={{ borderColor: character.color || "hsl(var(--primary))" }}
          />
        ) : (
          <div
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center text-white text-4xl sm:text-5xl font-bold mb-6 border-4 shadow-xl"
            style={{
              backgroundColor: character.color || "hsl(var(--primary))",
              borderColor: character.color || "hsl(var(--primary))",
            }}
          >
            {character.name?.[0]}
          </div>
        )}
      </motion.div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Meet {character.name}
        </h2>
        <p className="text-muted-foreground mb-4 max-w-sm text-sm sm:text-base">{character.description}</p>
        <p className="text-sm text-muted-foreground mb-4">
          <strong>Personality:</strong> {character.personality}
        </p>
        <blockquote className="text-lg sm:text-xl italic text-primary font-medium">
          "{character.catchphrase}"
        </blockquote>
      </motion.div>
    </div>
  );
}

function LessonPage({ lesson }: { lesson: ReaderLesson }) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline" className="text-xs">
          Page {lesson.pageNumber}
        </Badge>
        {lesson.audioUrl && (
          <Badge variant="outline" className="text-xs text-info">
            <Sparkles className="h-3 w-3 mr-1" />
            Listen
          </Badge>
        )}
      </div>

      <motion.h2
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="font-display text-xl sm:text-2xl font-bold text-foreground mb-4"
      >
        {lesson.title}
      </motion.h2>

      {lesson.imageUrl && (
        <motion.img
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          src={lesson.imageUrl}
          alt=""
          className="w-full max-h-36 object-cover rounded-xl mb-4 shadow-soft"
        />
      )}

      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex-1">
        <p className="text-foreground/90 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
          {lesson.content}
        </p>
      </motion.div>

      {lesson.characterDialogue && (
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border-2 border-primary/20"
        >
          <Sparkles className="h-4 w-4 text-primary mb-1" />
          <p className="text-sm text-foreground/90 italic">"{lesson.characterDialogue}"</p>
        </motion.div>
      )}
    </div>
  );
}

function MoralPage({ moralLesson, story }: { moralLesson: string; story: ReaderStory }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center mb-6 shadow-xl"
      >
        <Sparkles className="h-12 w-12 text-white" />
      </motion.div>

      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="font-display text-xl sm:text-2xl font-bold text-foreground mb-4"
      >
        Adventure Complete!
      </motion.h2>

      <motion.blockquote
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-lg sm:text-xl text-foreground/80 italic mb-6 max-w-sm"
      >
        "{moralLesson}"
      </motion.blockquote>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-sm text-muted-foreground mb-2">
        Thank you for reading "{story.title}"!
      </motion.p>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="text-sm text-muted-foreground mb-6">
        Tomorrow, another adventure awaits.
      </motion.p>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
        <Link to="/child/diary">
          <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 gap-2 rounded-full px-6">
            <PenLine className="h-4 w-4" />
            Write in Your Diary
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
