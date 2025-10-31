"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { BackgroundPaths } from "@/components/ui/background-paths";
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";
import NavigationDock from "@/components/navigation-dock";
import DisplayCards from "@/components/ui/display-cards";
import { CyberneticBentoGrid } from "@/components/ui/cybernetic-bento-grid";
import { subjects } from "@/lib/subjects";
import { BookOpen, Target,  Zap, Brain, Trophy, CheckCircle2, Users, Star, ArrowRight, BarChart3, Filter,  Cpu, Database, Network, Settings, Calculator, Layers,  Sparkles, ChevronDown } from "lucide-react";
// Icon mapping for subjects
const iconMap: Record<string, React.ElementType> = {
  "⚡": Zap,
  "🗂️": Layers,
  "💻": Cpu,
  "🗄️": Database,
  "🌐": Network,
  "🖥️": Settings,
  "📐": Calculator,
  "🔧": Settings,
  "⚙️": Settings,
  "📊": BarChart3,
  "🎯": Target,
};

// Shortened names mapping
const shortNameMap: Record<string, string> = {
  "Computer Organization and Architecture": "COA",
  "General Aptitude": "GA",
  "Programming and Data Structures": "DS",
  "Computer Networks": "CN",
  "Operating System": "OS",
  "Theory of Computation": "TOC",
  "Compiler Design": "CD",
  "Digital Logic": "DL",
  "Engineering Mathematics": "EM",

};

// Transform subjects to timeline data
const transformSubjectsToTimeline = () => {
  return subjects.map((subject, index) => ({
    id: index + 1,
    title: shortNameMap[subject.name] || subject.name,
    fullTitle: subject.name, // Keep full title for tooltips/cards
    date: `Subject ${index + 1}`,
    content: subject.description,
    category: "Computer Science",
    icon: iconMap[subject.icon] || BookOpen,
    relatedIds: [], // Could add related subjects later
    status: "completed" as const,
    energy: Math.floor(60 + Math.random() * 40), // Random energy between 60-100
    fileName: subject.fileName,
  }));
};

export default function Home() {
  const router = useRouter();
  const timelineData = transformSubjectsToTimeline();

  const handleNavigate = (subjectSlug: string) => {
    router.push(`/questions/${encodeURIComponent(subjectSlug)}`);
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Hero Section */}
      <section className="relative w-full overflow-hidden">
        <BackgroundPaths title="Master Your GATE Journey" />
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-6xl mx-auto text-center space-y-10">
            {/* Badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
                <Star className="h-4 w-4 fill-current" />
                <span>Trusted by 10,000+ students</span>
              </div>
            </div>

            {/* Hero Content with Side-by-Side Layout */}
            <div className="grid lg:grid-cols-2 gap-12 items-center pt-8">
              {/* Left Side - Text Content */}
              <div className="space-y-8 text-left">
                <div className="space-y-6">
                  <div>
                    <p className="text-lg md:text-2xl text-muted-foreground leading-relaxed font-light">
                      Comprehensive question bank with <span className="text-foreground font-semibold">thousands of previous year questions</span> across all Computer Science subjects.
                    </p>
                    <p className="text-lg md:text-xl text-primary font-semibold mt-3 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Practice smart, excel in your exams.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Button size="lg" asChild className="h-14 px-8 bg-primary text-primary-foreground text-lg font-semibold">
                    <Link href="#subjects" className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Start Practicing Now
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="h-14 px-8 border-2 text-lg">
                    <Link href="#features" className="flex items-center gap-2">
                      Learn More
                      <ChevronDown className="h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Right Side - Animated Cards */}
              <div className="flex justify-center lg:justify-end">
                <DisplayCards 
                  animationInterval={4000}
                  cards={[
                    {
                      icon: <BookOpen className="size-4 text-red-300" />,
                      title: "10+",
                      description: "CS Subjects",
                      date: "Comprehensive",
                      iconClassName: "text-red-500",
                      titleClassName: "text-red-500",
                    },
                    {
                      icon: <Target className="size-4 text-blue-300" />,
                      title: "1000+",
                      description: "Questions",
                      date: "Practice ready",
                      iconClassName: "text-red-500",
                      titleClassName: "text-red-500",
                    },
                    {
                      icon: <Zap className="size-4 text-blue-300" />,
                      title: "24/7",
                      description: "Access",
                      date: "Always available",
                      iconClassName: "text-red-500",
                      titleClassName: "text-red-500",
                    },
                    {
                      icon: <Users className="size-4 text-blue-300" />,
                      title: "10K+",
                      description: "Students",
                      date: "Trusted by many",
                      iconClassName: "text-red-500",
                      titleClassName: "text-red-500",
                    },
                  ]} 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-4">
              <Sparkles className="h-4 w-4" />
              <span>Features</span>
            </div>
            <h3 className="text-4xl md:text-6xl font-black text-foreground">
              Why Choose Us?
            </h3>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-light">
              Everything you need to ace your GATE examination in one comprehensive platform
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Filter,
                title: 'Advanced Smart Filtering',
                description: 'Filter questions by year, marks, subtopic, and question type. Search through thousands of questions instantly to focus on specific topics and difficulty levels.',
                highlights: ['Year-wise filtering', 'Marks-based sorting', 'Subtopic categorization', 'Real-time search']
              },
              {
                icon: Brain,
                title: 'AI-Powered Assistance',
                description: 'Get instant help with any question through our integrated AI chat. Ask for explanations, hints, or step-by-step solutions powered by Google Gemini.',
                highlights: ['Instant explanations', 'Step-by-step solutions', 'Concept clarification', '24/7 availability']
              },
              {
                icon: BarChart3,
                title: 'Comprehensive Analytics',
                description: 'Track your progress with detailed statistics and visualizations. Analyze question patterns, subject distribution, and performance trends across years.',
                highlights: ['Performance tracking', 'Visual analytics', 'Pattern analysis', 'Progress insights']
              }
            ].map((feature, index) => (
              <div key={index} className="relative h-full">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={80}
                  inactiveZone={0.01}
                  borderWidth={2}
                />
                <Card className="h-full border-border bg-card relative">
                  <CardHeader className="text-center space-y-6 p-8">
                    <div className="w-20 h-20 mx-auto bg-primary rounded-3xl flex items-center justify-center">
                      <feature.icon className="h-10 w-10 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed text-muted-foreground mb-6">
                      {feature.description}
                    </CardDescription>
                    <div className="space-y-2">
                      {feature.highlights.map((highlight, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-primary">
                          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                          <span>{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </CardHeader>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cybernetic Features Showcase */}
      <section className="py-24">
        <CyberneticBentoGrid />
      </section>

      {/* Subjects Section */}
      <section id="subjects" className="py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-4">
              <Brain className="h-4 w-4" />
              <span>Subjects</span>
            </div>
            <h3 className="text-4xl md:text-6xl font-black text-foreground">
              Choose Your Subject
            </h3>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-light">
              Explore our comprehensive collection of Computer Science subjects in an interactive timeline
            </p>
          </div>
          <div className="h-screen w-full">
            <RadialOrbitalTimeline timelineData={timelineData} onNavigate={handleNavigate} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-5xl mx-auto text-center">
          <Card className="border-border bg-card">
            <CardHeader className="space-y-6 py-12">
              <div className="w-20 h-20 mx-auto bg-primary rounded-3xl flex items-center justify-center">
                <Trophy className="h-10 w-10 text-primary-foreground" />
              </div>
              <CardTitle className="text-4xl md:text-5xl font-black text-foreground">
                Ready to Ace Your GATE?
              </CardTitle>
              <CardDescription className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed text-muted-foreground">
                Join <span className="text-primary font-bold">10,000+ students</span> who trust our platform for their GATE preparation.
                Start your journey towards success today.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-12">
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" asChild className="h-14 px-8 bg-primary text-primary-foreground text-lg font-semibold">
                  <Link href="#subjects" className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Get Started Now
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>Free Forever</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>No Credit Card</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>Instant Access</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-16 bg-muted/20">
        <div className="container mx-auto px-4 py-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">
              GATE Question Bank
            </span>
          </div>
          <p className="text-muted-foreground mb-2">
            © 2025 GATE Question Bank. All rights reserved.
          </p>
          <p className="text-primary font-semibold">
            Practice smart, excel in your exams.
          </p>
        </div>
      </footer>

      {/* Navigation Dock */}
      <NavigationDock />
    </div>
  );
}
