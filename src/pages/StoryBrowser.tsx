import { useState } from "react";
import { trpc } from "@/providers/trpcClient";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { motion } from "framer-motion";
import { Link } from "react-router";
import { BookOpen, Search, Calendar, User } from "lucide-react";

const ageGroupGradient: Record<string, string> = {
  "3-4 years": "from-destructive/70 to-accent/70",
  "5-7 years": "from-primary/80 to-success/70",
  "8-10 years": "from-info/80 to-primary/60",
  "11-13 years": "from-secondary to-info/70",
  "14-16 years": "from-warning/80 to-accent/70",
  "18+": "from-muted-foreground/60 to-foreground/50",
};

export default function StoryBrowser() {
  const { data: stories } = trpc.story.list.useQuery();
  const { data: ageGroups } = trpc.ageGroup.list.useQuery();
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered =
    stories?.filter((s) => {
      const matchAge = selectedAgeGroup === "all" || s.ageGroupId?.toString() === selectedAgeGroup;
      const matchSearch = !search || s.title?.toLowerCase().includes(search.toLowerCase());
      return matchAge && matchSearch && s.isActive;
    }) || [];

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">Story Library</h1>
            <p className="text-muted-foreground">Browse all available stories</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Age Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Age Groups</SelectItem>
                {ageGroups?.map((ag) => (
                  <SelectItem key={ag.id} value={ag.id.toString()}>
                    {ag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {stories === undefined ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((story, i) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Link to={`/stories/${story.id}`}>
                    <Card className="overflow-hidden hover:shadow-lifted transition-all cursor-pointer group h-full">
                      <div className={`h-32 bg-gradient-to-br ${ageGroupGradient[story.ageGroup?.name ?? ""] ?? "from-primary to-secondary"} relative`}>
                        {story.coverImage ? (
                          <img src={story.coverImage} alt="" className="w-full h-full object-cover opacity-80" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="h-12 w-12 text-white/60" />
                          </div>
                        )}
                        <div className="absolute bottom-3 left-3">
                          <Badge className="bg-card/90 text-foreground hover:bg-card">{story.ageGroup?.name}</Badge>
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                          {story.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {story.description || "An interactive story for children."}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Day {story.dayNumber}
                          </span>
                          {story.character && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {story.character.name}
                            </span>
                          )}
                        </div>
                        {story.theme && (
                          <Badge variant="outline" className="mt-3 text-xs">
                            {story.theme}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {stories !== undefined && filtered.length === 0 && (
            <Empty className="border-2 border-dashed border-border rounded-2xl mt-6">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BookOpen className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>Your next adventure is waiting</EmptyTitle>
                <EmptyDescription>No stories found matching your search or filter.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </motion.div>
      </div>
    </div>
  );
}
