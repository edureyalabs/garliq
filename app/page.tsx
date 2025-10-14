'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Sparkles, Zap, Share2, GitFork, Clock, Users, ArrowRight, Play, CheckCircle2, Layers, Globe2, Rocket, Heart, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';

// Live Demo Micro-App Component
const LiveMicroApp = () => {
  const [tripBudget, setTripBudget] = useState(5000);
  const [days, setDays] = useState(7);
  
  const breakdown = {
    flights: Math.round(tripBudget * 0.35),
    hotels: Math.round(tripBudget * 0.40),
    food: Math.round(tripBudget * 0.15),
    activities: Math.round(tripBudget * 0.10)
  };

  return (
    <div className="w-full max-w-md bg-gradient-to-br from-gray-900 to-black border border-purple-500/30 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-lg font-bold text-white">Trip Budget Planner</h4>
          <p className="text-xs text-gray-500 font-mono">Generated in 28 seconds</p>
        </div>
        <div className="flex gap-2">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 bg-purple-500/20 rounded-lg hover:bg-purple-500/30 transition-colors">
            <Heart className="w-4 h-4 text-purple-400" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 bg-pink-500/20 rounded-lg hover:bg-pink-500/30 transition-colors">
            <Share2 className="w-4 h-4 text-pink-400" />
          </motion.button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Total Budget: ${tripBudget}</label>
          <input 
            type="range" 
            min="1000" 
            max="20000" 
            step="500"
            value={tripBudget}
            onChange={(e) => setTripBudget(Number(e.target.value))}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-2 block">Trip Duration: {days} days</label>
          <input 
            type="range" 
            min="3" 
            max="30"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        <div className="space-y-2 pt-4 border-t border-gray-800">
          {Object.entries(breakdown).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-sm text-gray-400 capitalize">{key}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(value / tripBudget) * 100}%` }}
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  />
                </div>
                <span className="text-sm font-bold text-white w-16 text-right">${value}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-800 flex gap-2">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-sm font-semibold text-white"
          >
            Save Plan
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 bg-gray-800 rounded-lg text-sm font-semibold text-white flex items-center gap-2"
          >
            <GitFork className="w-4 h-4" />
            Fork
          </motion.button>
        </div>
      </div>
    </div>
  );
};

// Generation Animation Component
const GenerationAnimation = () => {
  const [step, setStep] = useState(0);
  const steps = [
    { label: 'Analyzing your request...', icon: Sparkles },
    { label: 'Designing interface...', icon: Layers },
    { label: 'Connecting data sources...', icon: Globe2 },
    { label: 'Optimizing experience...', icon: Zap },
    { label: 'Your app is ready!', icon: CheckCircle2 }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-md bg-black/50 border border-gray-800 rounded-2xl p-8 backdrop-blur-sm">
      <div className="space-y-6">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isComplete = i < step;
          
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0.3 }}
              animate={{ 
                opacity: isActive ? 1 : isComplete ? 0.7 : 0.3,
                scale: isActive ? 1.02 : 1
              }}
              className="flex items-center gap-4"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isActive ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 
                isComplete ? 'bg-green-500/20' : 'bg-gray-800'
              }`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : isComplete ? 'text-green-400' : 'text-gray-600'}`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-500'}`}>
                  {s.label}
                </p>
                {isActive && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.2 }}
                    className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-2"
                  />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
          {step === steps.length - 1 ? '✓' : `${Math.round((step / (steps.length - 1)) * 100)}%`}
        </p>
        <p className="text-xs text-gray-600 mt-1">Average time: 28 seconds</p>
      </div>
    </div>
  );
};

export default function Landing() {
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.15),transparent_50%)]" />
        <motion.div 
          animate={{ 
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute inset-0 bg-[linear-gradient(to_right,rgba(147,51,234,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(147,51,234,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]" 
        />
      </div>

      {/* Hero Section */}
      <motion.div 
        ref={heroRef}
        style={{ opacity, scale }}
        className="relative min-h-screen flex items-center justify-center px-6 pt-20"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: 'spring', bounce: 0.5 }}
              className="relative inline-block mb-8"
            >
              <motion.div
                animate={{ 
                  y: [-8, 8, -8],
                  rotate: [0, 3, -3, 0]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="text-8xl md:text-9xl filter drop-shadow-2xl"
              >
                🧄
              </motion.div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 blur-3xl bg-purple-500/40"
              />
            </motion.div>

            {/* Main Headline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <h1 className="text-6xl md:text-7xl font-black mb-6 leading-none">
                Create Powerful Micro-Apps
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
                  In Just Minutes
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
                Turn your requirements and ideas into a fully-functional, interactive application through natural conversation. 
                No coding required.
              </p>

              {/* Primary CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Link href="/auth">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(147, 51, 234, 0.6)' }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-lg overflow-hidden shadow-2xl"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      Create Your First Micro-App
                      <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </span>
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      animate={{ backgroundPosition: ['0%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                    />
                  </motion.button>
                </Link>
                
                {/* <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-5 bg-black/50 border-2 border-gray-700 hover:border-purple-500 rounded-2xl font-bold text-lg backdrop-blur-sm transition-colors flex items-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Watch 30-Second Demo
                </motion.button> */}
              </div>

              {/* Trust Signals */}
              <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  An app for all your utilities
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Explore millions of other apps
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Powerful Intelligence at your service
                </div>
              </div>
            </motion.div>
          </div>

          {/* Live Demo Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col lg:flex-row gap-8 items-center justify-center"
          >
            <div className="flex-1 max-w-xl">
              <div className="mb-4">
                <span className="inline-block px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm font-semibold text-purple-300 mb-4">
                  ✨ LIVE INTERACTIVE DEMO
                </span>
              </div>
              <h3 className="text-3xl font-bold mb-4">
                This Wasn't a Mockup.
                <br />
                <span className="text-gray-500">It's a Real Micro-App.</span>
              </h3>
              <p className="text-gray-400 leading-relaxed mb-6">
                Created in <span className="text-purple-400 font-bold">28 seconds</span> from the prompt: 
                <span className="italic text-gray-300"> "Help me plan my trip budget with interactive sliders."</span>
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Real Calculations</p>
                    <p className="text-sm text-gray-500">Dynamic computations, not static numbers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Share2 className="w-5 h-5 text-pink-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Instant Sharing</p>
                    <p className="text-sm text-gray-500">One link, anyone can use it</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <GitFork className="w-5 h-5 text-orange-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Forkable & Remixable</p>
                    <p className="text-sm text-gray-500">Customize for your needs</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex justify-center">
              <LiveMicroApp />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <div className="relative py-20 px-6 border-y border-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '12,000+', label: 'Micro-Apps Created', icon: Sparkles },
              { value: '28s', label: 'Average Generation Time', icon: Clock },
              { value: '4.8/5', label: 'User Rating', icon: Heart },
              { value: '85%', label: 'Share to Fork Rate', icon: GitFork }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="inline-block p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl mb-3">
                  <stat.icon className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="inline-block px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-full text-sm font-semibold text-orange-300 mb-6">
              HOW IT WORKS
            </span>
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              From Idea to App
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                In Three Simple Steps
              </span>
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              No coding knowledge. No design skills. Just describe what you need.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12 mb-20">
            {[
              {
                step: '01',
                title: 'Describe What You Need',
                description: 'Use natural language. "Create a mortgage calculator" or "Build a study guide generator." The AI understands your intent.',
                icon: MessageCircle,
                color: 'from-purple-500 to-purple-600'
              },
              {
                step: '02',
                title: 'AI Generates Your App',
                description: 'Watch as AI analyzes your request, designs the interface, connects data sources, and builds a fully-functional application in seconds.',
                icon: Sparkles,
                color: 'from-pink-500 to-pink-600'
              },
              {
                step: '03',
                title: 'Use, Share, Iterate',
                description: 'Your app is live instantly. Share via link, let others fork and customize, or iterate with follow-up requests.',
                icon: Rocket,
                color: 'from-orange-500 to-orange-600'
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative"
              >
                <div className="relative z-10">
                  <div className={`inline-block p-5 rounded-2xl bg-gradient-to-br ${item.color} mb-6 shadow-2xl`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-7xl font-black text-gray-900 mb-4">{item.step}</div>
                  <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Generation Animation Demo */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col lg:flex-row gap-12 items-center bg-gradient-to-br from-gray-900/50 to-black border border-gray-800 rounded-3xl p-12"
          >
            <div className="flex-1">
              <h3 className="text-3xl font-bold mb-4">Watch the Magic Happen</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Garliq's AI Infra doesn't just generate code—it architects complete applications. From analyzing your intent to optimizing the user experience, every step happens in seconds.
              </p>
              <ul className="space-y-3">
                {[
                  'Intelligent UI design based on your use case',
                  'Automatic API integration for live data',
                  'Responsive layouts that work on any device',
                  'Error handling and edge case management',
                  'Performance optimization built-in'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 flex justify-center">
              <GenerationAnimation />
            </div>
          </motion.div>
        </div>
      </div>

      {/* What Makes Us Different */}
      <div className="relative py-32 px-6 bg-gradient-to-b from-black via-purple-950/10 to-black">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="inline-block px-4 py-2 bg-pink-500/20 border border-pink-500/30 rounded-full text-sm font-semibold text-pink-300 mb-6">
              WHY GARLIQ
            </span>
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              Not a Website Builder.
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                A Micro-App Platform.
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Traditional Tools */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-red-500/5 border-2 border-red-500/20 rounded-2xl p-8"
            >
              <div className="text-red-400 text-sm font-bold mb-4">❌ TRADITIONAL TOOLS</div>
              <h3 className="text-2xl font-bold mb-6 text-gray-400">Website Builders & No-Code Platforms</h3>
              <ul className="space-y-4 text-gray-500">
                <li className="flex gap-3">
                  <span className="text-red-400">•</span>
                  <span>Multi-page complexity for simple tasks</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-400">•</span>
                  <span>Static content, limited interactivity</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-400">•</span>
                  <span>Steep learning curve, drag-and-drop friction</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-400">•</span>
                  <span>Days to weeks to launch</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-400">•</span>
                  <span>Expensive hosting and maintenance</span>
                </li>
              </ul>
            </motion.div>

            {/* Garliq */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-2xl p-8"
            >
              <div className="text-purple-400 text-sm font-bold mb-4">✓ GARLIQ MICRO-APPS</div>
              <h3 className="text-2xl font-bold mb-6">Purpose-Built Applications</h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Single-purpose, focused functionality</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Fully interactive with real calculations</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Natural conversation—no interface to learn</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Just Minutes from idea to live app</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Zero hosting costs, instant sharing</span>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Power Despite Simplicity */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 text-center max-w-4xl mx-auto"
          >
            <p className="text-xl text-gray-400 leading-relaxed">
              Garliq's micro-apps deliver <span className="text-purple-400 font-bold">instant functionality</span> users need for specific tasks—
              rivaling expensive SaaS tools but <span className="text-pink-400 font-bold">easy, affordable, and customizable</span>.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              Built for{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                Everyone
              </span>
            </h2>
            <p className="text-xl text-gray-500">
              From individuals to teams, solve problems instantly
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                category: 'Individuals',
                examples: [
                  'Personal budget trackers',
                  'Study guide generators',
                  'Habit tracking dashboards',
                  'Recipe cost calculators',
                  'Travel planners'
                ],
                icon: Users,
                gradient: 'from-purple-500 to-purple-600'
              },
              {
                category: 'Creators',
                examples: [
                  'Audience engagement tools',
                  'Custom calculators for followers',
                  'Interactive quizzes',
                  'Portfolio showcases',
                  'Monetized utilities'
                ],
                icon: Sparkles,
                gradient: 'from-pink-500 to-pink-600'
              },
              {
                category: 'Teams',
                examples: [
                  'Internal workflow tools',
                  'Client proposal calculators',
                  'Data visualization dashboards',
                  'Form builders',
                  'Project trackers'
                ],
                icon: Globe2,
                gradient: 'from-orange-500 to-orange-600'
              }
            ].map((useCase, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                whileHover={{ y: -10 }}
                className="group bg-gradient-to-br from-gray-900 to-black border border-gray-800 hover:border-purple-500/50 rounded-2xl p-8 transition-all"
              >
                <div className={`inline-block p-4 rounded-xl bg-gradient-to-br ${useCase.gradient} mb-6`}>
                  <useCase.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-6">{useCase.category}</h3>
                <ul className="space-y-3">
                  {useCase.examples.map((example, j) => (
                    <li key={j} className="flex items-start gap-3 text-gray-400">
                      <Zap className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Social Proof / Testimonials
      <div className="relative py-32 px-6 bg-gradient-to-b from-black via-purple-950/10 to-black">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              Trusted by{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                Thousands
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "I built a mortgage calculator in 30 seconds that my clients actually use. It's better than the $50/month tool I was paying for.",
                author: "Sarah Chen",
                role: "Real Estate Agent",
                avatar: "👩‍💼"
              },
              {
                quote: "As a teacher, I create custom study tools for each lesson. My students love the interactive quizzes. Game changer.",
                author: "Marcus Johnson",
                role: "High School Teacher",
                avatar: "👨‍🏫"
              },
              {
                quote: "I made a wedding budget tracker and shared it with my fiancé. We both update it in real-time. So much easier than spreadsheets.",
                author: "Emily Rodriguez",
                role: "Bride-to-Be",
                avatar: "👰"
              }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="bg-black/50 border border-gray-800 rounded-2xl p-8 backdrop-blur-sm"
              >
                <div className="text-4xl mb-4">{testimonial.avatar}</div>
                <p className="text-gray-300 mb-6 leading-relaxed italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-bold text-white">{testimonial.author}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div> */}

      {/* Final CTA */}
      <div className="relative py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl"
          >
            {/* Animated gradient background */}
            <motion.div 
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 opacity-20 blur-3xl"
              style={{ backgroundSize: '200% 200%' }}
            />
            
            <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 border border-purple-500/30 backdrop-blur-xl p-16 text-center">
              <h2 className="text-5xl md:text-6xl font-black mb-6">
                Your First Micro-App
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                  Awaits
                </span>
              </h2>
              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                Join thousands creating custom tools for their exact needs. From idea to live app in 30 seconds. No coding required.
              </p>
              
              <Link href="/auth">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-12 py-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-xl overflow-hidden shadow-2xl"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Create Your First Micro-App — Free
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-6 h-6" />
                    </motion.div>
                  </span>
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.button>
              </Link>

              <div className="flex items-center justify-center gap-8 mt-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Free to start
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Instant Generations
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  30-second setup
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative border-t border-gray-900 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🧄</span>
              <div>
                <p className="font-bold text-white">Garliq</p>
                <p className="text-sm text-gray-600">Micro-App Generation Platform</p>
              </div>
            </div>
            
            <div className="flex gap-8 text-sm text-gray-500">
              <Link href="/auth" className="hover:text-purple-400 transition-colors">
                Get Started
              </Link>
              <a href="#" className="hover:text-purple-400 transition-colors">
                Documentation
              </a>
              <a href="#" className="hover:text-purple-400 transition-colors">
                Examples
              </a>
              <a href="#" className="hover:text-purple-400 transition-colors">
                Support
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-900 text-center text-gray-600 text-sm">
            <p>© 2025 Garliq. Crafting the future of micro-applications.</p>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }

        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(147, 51, 234, 0.5);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(147, 51, 234, 0.5);
        }
      `}</style>
    </div>
  );
}