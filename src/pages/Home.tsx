import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import {
  BookOpen,
  Heart,
  Sparkles,
  Shield,
  Users,
  Star,
  ArrowRight,
  Sprout,
} from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === "admin";

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5 },
    }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-background to-background overflow-x-hidden">
      {isAuthenticated && <Navbar />}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
        {/* floating decorative shapes */}
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            className="absolute top-10 left-[8%] h-24 w-24 rounded-full bg-primary/10 blur-2xl"
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/3 right-[10%] h-32 w-32 rounded-full bg-accent/10 blur-3xl"
            animate={{ y: [0, -18, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-10 left-[20%] h-20 w-20 rounded-full bg-info/10 blur-2xl"
            animate={{ y: [0, 14, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} custom={0}>
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent mb-6">
                <Sparkles className="h-4 w-4" />
                Interactive Storybook Platform
              </div>
              <h1 className="font-display text-4xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                Where Stories <span className="text-accent">Come Alive</span> and Children{" "}
                <span className="text-primary">Grow</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                Chindela is an interactive storybook platform that helps children
                learn valuable life lessons through engaging stories, AI-powered
                feedback, and a daily good deeds diary.
              </p>
              <div className="flex flex-wrap gap-4">
                {isAuthenticated ? (
                  <Link to={isAdmin ? "/admin" : "/dashboard"}>
                    <Button size="lg" className="gap-2 rounded-full shadow-soft">
                      Go to Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/login">
                    <Button size="lg" className="gap-2 rounded-full shadow-soft">
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <Link to="/child-login">
                  <Button size="lg" variant="outline" className="gap-2 rounded-full border-primary/40 text-primary hover:bg-primary/5">
                    <Sprout className="h-4 w-4" />
                    Child Login
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-lifted border-4 border-primary/15">
                <img
                  src="/hero-storybook.jpg"
                  alt="Chindela Storybook"
                  className="w-full h-[400px] object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-white font-medium text-lg font-display">
                    "Every story is a journey of discovery"
                  </p>
                  <p className="text-white/80 text-sm">- Chindela the Wise Lion</p>
                </div>
              </div>
              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 bg-card rounded-xl p-3 shadow-lifted border border-warning/20"
              >
                <Star className="h-6 w-6 text-warning" />
              </motion.div>
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -left-4 bg-card rounded-xl p-3 shadow-lifted border border-destructive/20"
              >
                <Heart className="h-6 w-6 text-destructive" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            custom={0}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">Why Chindela?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform combines storytelling with interactive learning to help
              children develop important life skills.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: "Interactive Stories",
                description:
                  "Beautiful A4-format storybooks with characters, audio, and engaging visuals for every age group.",
                color: "bg-primary/10 text-primary",
              },
              {
                icon: Heart,
                title: "Daily Good Deeds Diary",
                description:
                  "Children record their kind acts through text, voice, or pictures, building positive habits.",
                color: "bg-destructive/10 text-destructive",
              },
              {
                icon: Sparkles,
                title: "AI-Powered Feedback",
                description:
                  "Our friendly AI characters provide encouraging feedback and reflection guidance.",
                color: "bg-accent/10 text-accent",
              },
              {
                icon: Shield,
                title: "Safe Environment",
                description:
                  "Built-in safety headers, content moderation, and parent notifications keep children safe.",
                color: "bg-info/10 text-info",
              },
              {
                icon: Users,
                title: "Parent Dashboard",
                description: "Track your child's progress, view AI feedback, and manage subscriptions easily.",
                color: "bg-success/10 text-success",
              },
              {
                icon: Star,
                title: "Age-Appropriate Content",
                description: "Stories and lessons tailored for ages 3-4, 5-7, 8-10, 11-13, 14-16, and 18+.",
                color: "bg-warning/10 text-warning",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                custom={i}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-border bg-background p-6 shadow-xs hover:shadow-soft transition-shadow"
              >
                <div className={`inline-flex rounded-lg p-3 ${feature.color} mb-4`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Age Groups Section */}
      <section className="py-20 bg-gradient-to-b from-secondary/20 to-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            custom={0}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">Stories for Every Age</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Carefully curated content for each stage of childhood development.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { age: "3-4", label: "Early Childhood", color: "from-destructive/70 to-accent/70" },
              { age: "5-7", label: "Early Readers", color: "from-primary/80 to-success/70" },
              { age: "8-10", label: "Growing Readers", color: "from-info/80 to-primary/60" },
              { age: "11-13", label: "Pre-Teens", color: "from-secondary/90 to-info/70" },
              { age: "14-16", label: "Teens", color: "from-warning/80 to-accent/70" },
              { age: "18+", label: "Adults", color: "from-muted-foreground/60 to-foreground/50" },
            ].map((group, i) => (
              <motion.div
                key={group.age}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className={`rounded-xl bg-gradient-to-br ${group.color} p-6 text-white text-center shadow-soft`}
              >
                <div className="font-display text-2xl font-bold mb-1">{group.age}</div>
                <div className="text-xs opacity-90">years</div>
                <div className="text-sm font-medium mt-2 opacity-90">{group.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            custom={0}
            className="rounded-2xl bg-gradient-to-r from-primary to-secondary p-12 text-center text-primary-foreground shadow-lifted"
          >
            <h2 className="font-display text-3xl font-bold mb-4">Start Your Child's Journey Today</h2>
            <p className="opacity-90 max-w-xl mx-auto mb-8">
              Join families using Chindela to inspire kindness, creativity, and learning in their children.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {isAuthenticated ? (
                <Link to={isAdmin ? "/admin" : "/dashboard"}>
                  <Button size="lg" variant="secondary" className="gap-2 rounded-full">
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button size="lg" variant="secondary" className="gap-2 rounded-full">
                    Sign Up Now
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-primary" />
              <span className="font-display font-bold text-foreground">Chindela</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Chindela Interactive Storybook Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
