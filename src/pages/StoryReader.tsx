import { useParams } from "react-router";
import { trpc } from "@/providers/trpcClient";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Volume2,
  Shield,
  User,
  Calendar,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router";

interface StorySummary {
  title: string;
  dayNumber: number;
  theme?: string | null;
}

interface CharacterSummary {
  name: string;
  imageUrl?: string | null;
  color?: string | null;
  description?: string | null;
  personality?: string | null;
  catchphrase?: string | null;
}

interface LessonSummary {
  pageNumber: number;
  title: string;
  content: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  characterDialogue?: string | null;
  interactiveElement?: string | null;
}

export default function StoryReader() {
  const { id } = useParams<{ id: string }>();
  const storyId = parseInt(id || "0");
  const { data: story } = trpc.story.byId.useQuery({ id: storyId });
  const { data: lessons } = trpc.story.lessons.useQuery({ storyId });
  const { data: safetyHeaders } = trpc.safety.active.useQuery();

  const [currentPage, setCurrentPage] = useState(0);
  // Deterministic (not Math.random) so it stays stable across re-renders
  // without needing an effect -- still rotates day to day.
  const safetyHeaderIndex = safetyHeaders && safetyHeaders.length > 0 ? new Date().getDate() % safetyHeaders.length : 0;

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const allPages = [
    // Cover page
    {
      type: "cover" as const,
      title: story.title,
      description: story.description,
      coverImage: story.coverImage,
      character: story.character,
    },
    // Character intro page
    ...(story.character
      ? [{
          type: "character" as const,
          character: story.character,
        }]
      : []),
    // Lesson pages
    ...(lessons || []).map((lesson) => ({
      type: "lesson" as const,
      lesson,
    })),
    // Moral lesson page
    ...(story.moralLesson
      ? [{
          type: "moral" as const,
          moralLesson: story.moralLesson,
        }]
      : []),
  ];

  const totalPages = allPages.length;
  const currentData = allPages[currentPage];

  const nextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage((p) => p + 1);
  };

  const prevPage = () => {
    if (currentPage > 0) setCurrentPage((p) => p - 1);
  };

  // A4 aspect ratio container
  const a4Style = {
    aspectRatio: "210/297",
    maxHeight: "80vh",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/stories">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Library
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {story.ageGroup?.name}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Day {story.dayNumber}
            </Badge>
          </div>
        </div>

        {/* Safety Header */}
        {safetyHeaders && safetyHeaders.length > 0 && (
          <div className="mb-4 p-3 bg-info/10 border border-info/20 rounded-lg flex items-center gap-3">
            <Shield className="h-5 w-5 text-info flex-shrink-0" />
            <p className="text-sm text-info">
              {safetyHeaders[safetyHeaderIndex]?.message}
            </p>
          </div>
        )}

        {/* Storybook Container - A4 Aspect Ratio */}
        <div className="flex justify-center">
          <div
            className="w-full max-w-2xl bg-card rounded-xl shadow-lifted border-8 border-primary/10 overflow-hidden relative"
            style={a4Style}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 p-8 overflow-y-auto"
              >
                {currentData?.type === "cover" && (
                  <CoverPage data={currentData} story={story} />
                )}
                {currentData?.type === "character" && (
                  <CharacterPage character={currentData.character} />
                )}
                {currentData?.type === "lesson" && (
                  <LessonPage lesson={currentData.lesson} />
                )}
                {currentData?.type === "moral" && (
                  <MoralPage moralLesson={currentData.moralLesson} story={story} />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-card via-card/95 to-transparent">
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={prevPage} disabled={currentPage === 0} className="rounded-full">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                </div>

                <Button variant="outline" size="sm" onClick={nextPage} disabled={currentPage === totalPages - 1} className="rounded-full">
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {/* Page dots */}
              <div className="flex justify-center gap-1.5 mt-3">
                {allPages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    aria-label={`Go to page ${i + 1}`}
                    className={`h-2 rounded-full transition-all ${i === currentPage ? "bg-primary w-5" : "bg-muted w-2 hover:bg-muted-foreground/30"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CoverPageData {
  title: string;
  description?: string | null;
  coverImage?: string | null;
  character?: { name: string } | null;
}

function CoverPage({ data, story }: { data: CoverPageData; story: StorySummary }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      {data.coverImage ? (
        <img src={data.coverImage} alt="" className="w-48 h-48 object-cover rounded-xl mb-6 shadow-soft" />
      ) : (
        <div className="w-48 h-48 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 shadow-soft">
          <BookOpen className="h-20 w-20 text-white/70" />
        </div>
      )}
      <h1 className="font-display text-3xl font-bold text-foreground mb-4">{data.title}</h1>
      <p className="text-muted-foreground mb-6 max-w-md">{data.description}</p>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          Day {story.dayNumber}
        </span>
        {data.character && (
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            Featuring {data.character.name}
          </span>
        )}
      </div>
      {story.theme && <Badge className="mt-4 bg-primary">{story.theme}</Badge>}
    </div>
  );
}

function CharacterPage({ character }: { character: CharacterSummary }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      {character.imageUrl ? (
        <img
          src={character.imageUrl}
          alt={character.name}
          className="w-40 h-40 object-cover rounded-full mb-6 border-4 shadow-soft"
          style={{ borderColor: character.color || "hsl(var(--primary))" }}
        />
      ) : (
        <div
          className="w-40 h-40 rounded-full flex items-center justify-center text-white text-4xl font-bold mb-6 border-4 shadow-soft"
          style={{ backgroundColor: character.color || "hsl(var(--primary))", borderColor: character.color || "hsl(var(--primary))" }}
        >
          {character.name?.[0]}
        </div>
      )}
      <h2 className="font-display text-2xl font-bold text-foreground mb-2">Meet {character.name}</h2>
      <p className="text-muted-foreground mb-4 max-w-md">{character.description}</p>
      <p className="text-sm text-muted-foreground mb-4">
        <strong>Personality:</strong> {character.personality}
      </p>
      <blockquote className="italic text-primary text-lg">"{character.catchphrase}"</blockquote>
    </div>
  );
}

function LessonPage({ lesson }: { lesson: LessonSummary }) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline">Page {lesson.pageNumber}</Badge>
        {lesson.audioUrl && (
          <Badge variant="outline" className="text-info">
            <Volume2 className="h-3 w-3 mr-1" />
            Audio
          </Badge>
        )}
      </div>

      <h2 className="font-display text-xl font-bold text-foreground mb-4">{lesson.title}</h2>

      {lesson.imageUrl && <img src={lesson.imageUrl} alt="" className="w-full max-h-40 object-cover rounded-lg mb-4" />}

      <div className="prose prose-sm max-w-none flex-1">
        <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{lesson.content}</p>
      </div>

      {lesson.characterDialogue && (
        <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/15">
          <p className="text-sm text-foreground/90 italic">"{lesson.characterDialogue}"</p>
        </div>
      )}

      {lesson.interactiveElement && (
        <div className="mt-4 p-4 bg-info/10 rounded-lg border border-info/20">
          <p className="text-sm text-info font-medium">Interactive Activity: {lesson.interactiveElement}</p>
        </div>
      )}
    </div>
  );
}

function MoralPage({ moralLesson, story }: { moralLesson: string; story: StorySummary }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6">
        <Sparkles className="h-12 w-12 text-white" />
      </div>
      <h2 className="font-display text-2xl font-bold text-foreground mb-4">The Moral of the Story</h2>
      <blockquote className="text-xl text-foreground/80 italic mb-6 max-w-md">"{moralLesson}"</blockquote>
      <p className="text-sm text-muted-foreground">Thank you for reading "{story.title}"!</p>
      <div className="mt-6">
        <Link to="/diary">
          <Button className="rounded-full">View Diary</Button>
        </Link>
      </div>
    </div>
  );
}
