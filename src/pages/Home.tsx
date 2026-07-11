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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {isAuthenticated && <Navbar />}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              custom={0}
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-700 mb-6">
                <Sparkles className="h-4 w-4" />
                Interactive Storybook Platform
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6">
                Where Stories{" "}
                <span className="text-amber-500">Come Alive</span> and
                Children <span className="text-green-500">Grow</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-lg">
                Chindela is an interactive storybook platform that helps children
                learn valuable life lessons through engaging stories, AI-powered
                feedback, and a daily good deeds diary.
              </p>
              <div className="flex flex-wrap gap-4">
                {isAuthenticated ? (
                  <Link to={isAdmin ? "/admin" : "/dashboard"}>
                    <Button size="lg" className="gap-2 bg-amber-500 hover:bg-amber-600">
                      Go to Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/login">
                    <Button size="lg" className="gap-2 bg-amber-500 hover:bg-amber-600">
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <Link to="/child-login">
                  <Button size="lg" variant="outline" className="gap-2 border-green-500 text-green-600 hover:bg-green-50">
                    <BookOpen className="h-4 w-4" />
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
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-amber-200">
                <img
                  src="/hero-storybook.jpg"
                  alt="Chindela Storybook"
                  className="w-full h-[400px] object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-white font-medium text-lg">
                    "Every story is a journey of discovery"
                  </p>
                  <p className="text-white/80 text-sm">- Chindela the Wise Lion</p>
                </div>
              </div>
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl p-3 shadow-lg border border-amber-100">
                <Star className="h-6 w-6 text-amber-500" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-3 shadow-lg border border-green-100">
                <Heart className="h-6 w-6 text-red-400" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Chindela?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
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
                color: "bg-amber-100 text-amber-600",
              },
              {
                icon: Heart,
                title: "Daily Good Deeds Diary",
                description:
                  "Children record their kind acts through text, voice, or pictures, building positive habits.",
                color: "bg-red-100 text-red-500",
              },
              {
                icon: Sparkles,
                title: "AI-Powered Feedback",
                description:
                  "Our friendly AI characters provide encouraging feedback and reflection guidance.",
                color: "bg-purple-100 text-purple-500",
              },
              {
                icon: Shield,
                title: "Safe Environment",
                description:
                  "Built-in safety headers, content moderation, and parent notifications keep children safe.",
                color: "bg-blue-100 text-blue-500",
              },
              {
                icon: Users,
                title: "Parent Dashboard",
                description:
                  "Track your child's progress, view AI feedback, and manage subscriptions easily.",
                color: "bg-green-100 text-green-500",
              },
              {
                icon: Star,
                title: "Age-Appropriate Content",
                description:
                  "Stories and lessons tailored for ages 3-4, 5-7, 8-10, 11-13, 14-16, and 18+.",
                color: "bg-orange-100 text-orange-500",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                custom={i}
                className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`inline-flex rounded-lg p-3 ${feature.color} mb-4`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Age Groups Section */}
      <section className="py-20 bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Stories for Every Age
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Carefully curated content for each stage of childhood development.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { age: "3-4", label: "Early Childhood", color: "from-pink-400 to-rose-400" },
              { age: "5-7", label: "Early Readers", color: "from-green-400 to-emerald-400" },
              { age: "8-10", label: "Growing Readers", color: "from-blue-400 to-cyan-400" },
              { age: "11-13", label: "Pre-Teens", color: "from-purple-400 to-violet-400" },
              { age: "14-16", label: "Teens", color: "from-amber-400 to-orange-400" },
              { age: "18+", label: "Adults", color: "from-gray-400 to-slate-400" },
            ].map((group, i) => (
              <motion.div
                key={group.age}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-xl bg-gradient-to-br ${group.color} p-6 text-white text-center shadow-lg`}
              >
                <div className="text-2xl font-bold mb-1">{group.age}</div>
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
            className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-12 text-center text-white"
          >
            <h2 className="text-3xl font-bold mb-4">
              Start Your Child's Journey Today
            </h2>
            <p className="text-white/90 max-w-xl mx-auto mb-8">
              Join thousands of families using Chindela to inspire kindness,
              creativity, and learning in their children.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {isAuthenticated ? (
                <Link to={isAdmin ? "/admin" : "/dashboard"}>
                  <Button size="lg" variant="secondary" className="gap-2">
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button size="lg" variant="secondary" className="gap-2">
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
      <footer className="border-t bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-amber-500" />
              <span className="font-bold text-gray-900">Chindela</span>
            </div>
            <p className="text-sm text-gray-500">
              Chindela Interactive Storybook Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
