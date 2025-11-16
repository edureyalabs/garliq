'use client';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Sparkles, ArrowRight, CheckCircle2, Brain, Cpu, Play, Code, BarChart3, BookOpen, Zap, Globe2, Users, MessageCircle, X, Linkedin, Mail } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

// ============================================
// INTERACTIVE DEMO COMPONENTS
// ============================================

// Live Course Generation Demo
const LiveCourseDemo = () => {
  const [step, setStep] = useState(0);
  const steps = [
    { text: "Describe what you want to learn", icon: "💭", color: "from-purple-500 to-pink-500" },
    { text: "AI analyzes optimal learning path", icon: "🧠", color: "from-blue-500 to-cyan-500" },
    { text: "Generating interactive content with visuals", icon: "✨", color: "from-green-500 to-emerald-500" },
    { text: "Course ready in HTML with embedded AI tutor", icon: "🎉", color: "from-orange-500 to-red-500" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black/40 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
      <div className="space-y-4">
        {steps.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.4 }}
            animate={{ 
              opacity: i === step ? 1 : 0.4,
              scale: i === step ? 1.02 : 1,
              x: i === step ? 4 : 0
            }}
            transition={{ duration: 0.3 }}
            className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
              i === step ? 'bg-gradient-to-r ' + s.color + '/10 border border-gray-700' : 'bg-gray-900/30'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
              i === step ? 'bg-gradient-to-br ' + s.color : 'bg-gray-800'
            }`}>
              {s.icon}
            </div>
            <p className={`text-sm font-medium ${i === step ? 'text-white' : 'text-gray-500'}`}>
              {s.text}
            </p>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Generation time</span>
          <span className="text-purple-400 font-bold">~3 minutes</span>
        </div>
      </div>
    </div>
  );
};

// Simulation Controls Demo
const SimulationDemo = () => {
  const [force, setForce] = useState(50);
  const [mass, setMass] = useState(50);
  const acceleration = (force / mass).toFixed(2);

  return (
    <div className="bg-black/40 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
      <div className="text-center mb-6">
        <h4 className="text-sm font-bold text-cyan-400 mb-1">Interactive Physics Simulation</h4>
        <p className="text-xs text-gray-500">Newton's Second Law: F = ma</p>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-medium text-gray-400">Force (N)</label>
            <span className="text-sm font-bold text-white">{force}</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={force}
            onChange={(e) => setForce(Number(e.target.value))}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-medium text-gray-400">Mass (kg)</label>
            <span className="text-sm font-bold text-white">{mass}</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={mass}
            onChange={(e) => setMass(Number(e.target.value))}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>

        <motion.div
          key={acceleration}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4 text-center"
        >
          <p className="text-xs text-purple-300 mb-1">Acceleration</p>
          <p className="text-3xl font-black text-white">{acceleration} m/s²</p>
        </motion.div>

        <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-800">
          <Cpu className="w-3 h-3" />
          <span>AI available to explain this simulation</span>
        </div>
      </div>
    </div>
  );
};

// Feature Showcase Card
const FeatureCard = ({ icon, title, description, delay = 0 }: { icon: React.ReactNode, title: string, description: string, delay?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all"
    >
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
  );
};

// Testimonial Card
const TestimonialCard = ({ name, role, content, delay = 0 }: { name: string, role: string, content: string, delay?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6"
    >
      <p className="text-sm text-gray-300 leading-relaxed mb-4">"{content}"</p>
      <div>
        <p className="text-sm font-bold text-white">{name}</p>
        <p className="text-xs text-gray-500">{role}</p>
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN LANDING PAGE COMPONENT
// ============================================

export default function Landing() {
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Subtle Grid Background */}
      <div className="fixed inset-0 bg-black">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Garliq" width={40} height={40} />
            <span className="text-xl font-bold">Garliq</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth">
              <button className="px-5 py-2 bg-white text-black rounded-lg font-semibold text-sm hover:bg-gray-200 transition-colors">
                Start Free Trial
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        style={{ opacity }}
        className="relative px-6 pt-24 pb-32"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-6">
              <span className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-sm font-semibold text-purple-400">
                AI-Powered Learning Infrastructure
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              AI generates complete
              <br />
              courses in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                3 minutes
              </span>
            </h1>

            <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              Describe any topic. Get a fully interactive course with embedded videos, graphs, simulations, 
              and an AI tutor that answers questions instantly. Built for modern learners who demand more.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 bg-white text-black rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-200 transition-colors"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
              <a href="#how-it-works">
                <button className="px-8 py-4 bg-transparent border border-gray-800 text-white rounded-lg font-semibold hover:border-gray-700 transition-colors">
                  See How It Works
                </button>
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gray-600" />
                7-day free trial
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gray-600" />
                500K tokens included
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gray-600" />
                $3/month after trial
              </div>
            </div>
          </motion.div>


        </div>
      </motion.section>

      {/* Core Features Section */}
      <section id="features" className="relative px-6 py-32 border-t border-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Built for serious learning
            </h2>
            <p className="text-xl text-gray-400">
              Every feature designed to accelerate understanding and retention
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Sparkles className="w-8 h-8 text-purple-400" />}
              title="AI Course Generation"
              description="Describe any topic and get a structured course with lessons, visuals, and interactive elements—all generated in minutes."
              delay={0}
            />
            <FeatureCard
              icon={<Cpu className="w-8 h-8 text-cyan-400" />}
              title="Live Simulations"
              description="Create interactive simulations with controllable parameters. Perfect for understanding complex systems through experimentation."
              delay={0.1}
            />
            <FeatureCard
              icon={<Brain className="w-8 h-8 text-pink-400" />}
              title="AI Chatbot Everywhere"
              description="Every course and simulation includes an intelligent AI chatbot that answers your questions instantly with context-aware explanations. Never get stuck again."
              delay={0.2}
            />
            <FeatureCard
              icon={<Globe2 className="w-8 h-8 text-green-400" />}
              title="Share & Collaborate"
              description="Share your created courses with anyone. Access and learn from courses created by the community."
              delay={0.3}
            />
          </div>

          {/* Technical Details */}
          <div className="mt-20 grid md:grid-cols-3 gap-6">
            <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <Code className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-lg font-bold mb-2">HTML Course Viewer</h3>
              <p className="text-sm text-gray-400">
                Courses render in a modern HTML iframe with embedded media, interactive elements, and responsive design.
              </p>
            </div>

            <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <BarChart3 className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-lg font-bold mb-2">Rich Media Integration</h3>
              <p className="text-sm text-gray-400">
                AI automatically embeds relevant videos, graphs, diagrams, and interactive visualizations into your courses.
              </p>
            </div>

            <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <Zap className="w-8 h-8 text-yellow-400 mb-4" />
              <h3 className="text-lg font-bold mb-2">Token-Based System</h3>
              <p className="text-sm text-gray-400">
                Pay only for what you create. Generate unlimited courses and simulations with flexible token packages.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative px-6 py-32 border-t border-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              From idea to mastery
            </h2>
            <p className="text-xl text-gray-400">
              Three simple steps to personalized, interactive learning
            </p>
          </div>

          <div className="space-y-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row gap-8 items-center"
            >
              <div className="flex-1">
                <div className="text-sm font-bold text-purple-400 mb-2">STEP 01</div>
                <h3 className="text-2xl font-bold mb-3">Describe what you want to learn</h3>
                <p className="text-gray-400 leading-relaxed">
                  Type a simple description: "Teach me quantum computing basics" or "I want to understand options trading strategies." 
                  Be as specific or broad as you want—the AI adapts to your level.
                </p>
              </div>
              <div className="flex-1 bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <div className="font-mono text-sm text-gray-400">
                  <div className="mb-2">→ Input:</div>
                  <div className="bg-gray-900/50 rounded p-3 text-purple-400">
                    "Create a course on machine learning fundamentals with practical examples"
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row-reverse gap-8 items-center"
            >
              <div className="flex-1">
                <div className="text-sm font-bold text-cyan-400 mb-2">STEP 02</div>
                <h3 className="text-2xl font-bold mb-3">AI builds your course</h3>
                <p className="text-gray-400 leading-relaxed">
                  Our AI analyzes the topic, structures the optimal learning path, generates interactive content, 
                  embeds relevant media, and wraps everything in a beautiful HTML viewer—all in about 3 minutes.
                </p>
              </div>
              <div className="flex-1 bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-gray-400">Analyzing learning objectives</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-gray-400">Structuring curriculum</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-gray-400">Generating interactive content</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                    <span className="text-gray-400">Embedding AI tutor</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row gap-8 items-center"
            >
              <div className="flex-1">
                <div className="text-sm font-bold text-pink-400 mb-2">STEP 03</div>
                <h3 className="text-2xl font-bold mb-3">Learn, experiment, master</h3>
                <p className="text-gray-400 leading-relaxed">
                  Work through interactive lessons, run simulations with adjustable parameters, ask the AI tutor anything, 
                  and track your progress. Share your courses or learn from the community's creations.
                </p>
              </div>
              <div className="flex-1 bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-purple-400">∞</div>
                    <div className="text-xs text-gray-500 mt-1">Course Access</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-cyan-400">24/7</div>
                    <div className="text-xs text-gray-500 mt-1">AI Tutor</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-400">∞</div>
                    <div className="text-xs text-gray-500 mt-1">Simulations</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-pink-400">100%</div>
                    <div className="text-xs text-gray-500 mt-1">Your Pace</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Use Cases / Who It's For */}
      <section className="relative px-6 py-32 border-t border-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Powering every learning journey
            </h2>
            <p className="text-xl text-gray-400">
              From students to professionals, creators to educators
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <div className="text-3xl mb-4">🎓</div>
              <h3 className="text-lg font-bold mb-3">Students & Self-Learners</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Master difficult concepts with interactive simulations and on-demand AI tutoring. 
                Learn at your own pace without expensive courses or rigid schedules.
              </p>
            </div>

            <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <div className="text-3xl mb-4">💼</div>
              <h3 className="text-lg font-bold mb-3">Professionals & Career Changers</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Quickly upskill in new domains. Generate focused courses on specific technologies, 
                frameworks, or business concepts you need to master.
              </p>
            </div>

            <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <div className="text-3xl mb-4">👨‍🏫</div>
              <h3 className="text-lg font-bold mb-3">Educators & Course Creators</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Create and share professional courses instantly. Let AI handle the content generation 
                while you focus on teaching and engaging with students.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Pricing Section */}
      <section id="pricing" className="relative px-6 py-32 border-t border-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-400">
              Start free, scale as you learn
            </p>
          </div>

          <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left: Pricing */}
              <div>
                <div className="inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-sm font-semibold text-purple-400 mb-6">
                  Platform Access
                </div>
                <div className="text-6xl font-bold mb-2">
                  $3<span className="text-2xl text-gray-500">/month</span>
                </div>
                <p className="text-gray-400 mb-8">Unlimited access to the platform</p>

                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 mb-8">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white mb-1">Token System</p>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        Purchase additional tokens as needed to generate courses and simulations. 
                        Flexible packages starting at $5. No expiration.
                      </p>
                    </div>
                  </div>
                </div>

                <Link href="/auth">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-8 py-4 bg-white text-black rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                  >
                    Start Your Free Trial
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </Link>

                <p className="text-center text-sm text-gray-500 mt-4">
                  No credit card required • Cancel anytime
                </p>
              </div>

              {/* Right: Features */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">7-day free trial</p>
                    <p className="text-sm text-gray-500">500,000 tokens included to create courses and simulations</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Unlimited course access</p>
                    <p className="text-sm text-gray-500">Learn from all community-created courses</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">AI chatbot in every course & simulation</p>
                    <p className="text-sm text-gray-500">Get instant answers to your questions while learning</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Share your creations</p>
                    <p className="text-sm text-gray-500">Publish and share courses with anyone</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Interactive simulations</p>
                    <p className="text-sm text-gray-500">Create and tinker with parameter-based simulations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative px-6 py-32 border-t border-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Start learning anything
              <br />
              in the next{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                3 minutes
              </span>
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Join thousands of learners using AI to master new skills faster than ever
            </p>
            <Link href="/auth">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-white text-black rounded-lg font-semibold flex items-center gap-2 mx-auto hover:bg-gray-200 transition-colors"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-gray-900 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Garliq" width={40} height={40} />
              <div>
                <p className="font-bold">Garliq</p>
                <p className="text-sm text-gray-600">AI-powered learning infrastructure</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 text-sm text-gray-500">
              <Link href="/auth" className="hover:text-white transition-colors">
                Get Started
              </Link>
              <a href="#features" className="hover:text-white transition-colors">
                Features
              </a>
              <a href="#pricing" className="hover:text-white transition-colors">
                Pricing
              </a>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contact
              </Link>
              <Link href="/privacy-policy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <a 
                href="https://x.com/garliq_ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-gray-900 hover:bg-gray-800 flex items-center justify-center transition-colors"
              >
                <span className="text-lg font-bold">𝕏</span>
              </a>
              <a 
                href="https://www.linkedin.com/company/garliq-ai/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-gray-900 hover:bg-gray-800 flex items-center justify-center transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a 
                href="mailto:team@parasync.in"
                className="w-10 h-10 rounded-lg bg-gray-900 hover:bg-gray-800 flex items-center justify-center transition-colors"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-900 text-center text-sm text-gray-600">
            <p>© 2025 Garliq by Parasync Technologies. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}