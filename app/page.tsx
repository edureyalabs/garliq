'use client';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Sparkles, Zap, Share2, ArrowRight, CheckCircle2, BookOpen, GraduationCap, Brain, Clock, Users, Trophy, Globe2, Rocket, Heart, PlayCircle, Award, Target, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

// ============================================
// INTERACTIVE LEARNING DEMO WIDGETS
// ============================================

// 1. INTERACTIVE QUIZ - Learning Demo
const InteractiveQuizWidget = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const questions = [
    {
      question: "What is a bull market in trading?",
      options: ["Market decline", "Market growth", "Sideways market", "Market crash"],
      correct: 1,
      explanation: "A bull market is characterized by rising prices and optimism!"
    },
    {
      question: "What does 'diversification' mean in investing?",
      options: ["Buying one stock", "Spreading investments", "Day trading", "Selling everything"],
      correct: 1,
      explanation: "Diversification reduces risk by spreading investments across different assets!"
    },
    {
      question: "What is compound interest?",
      options: ["Simple interest", "Interest on interest", "Bank fees", "Stock dividends"],
      correct: 1,
      explanation: "Compound interest means earning interest on your initial amount AND previous interest!"
    }
  ];

  const handleAnswer = (index: number) => {
    setSelectedAnswer(index);
    
    setTimeout(() => {
      if (index === questions[currentQuestion].correct) {
        setScore(score + 1);
      }
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        setShowResult(true);
      }
    }, 1000);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
    setSelectedAnswer(null);
  };

  if (showResult) {
    return (
      <div className="space-y-4 text-center">
        <div className="text-5xl mb-4">
          {score === questions.length ? '🎉' : score >= questions.length / 2 ? '👏' : '💪'}
        </div>
        <h3 className="text-xl font-bold">Quiz Complete!</h3>
        <div className="text-3xl font-black text-green-400">
          {score} / {questions.length}
        </div>
        <p className="text-sm text-gray-400">
          {score === questions.length ? "Perfect! You're mastering this!" :
           score >= questions.length / 2 ? "Great progress! Keep learning!" :
           "Good start! Review and try again!"}
        </p>
        <button
          onClick={resetQuiz}
          className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-purple-400">
          Question {currentQuestion + 1}/{questions.length}
        </span>
        <span className="text-xs font-bold text-green-400">
          Score: {score}
        </span>
      </div>

      <div className="bg-gray-900/50 rounded-xl p-4 mb-4">
        <p className="text-sm font-semibold text-white leading-relaxed">
          {question.question}
        </p>
      </div>

      <div className="space-y-2">
        {question.options.map((option, index) => (
          <motion.button
            key={index}
            onClick={() => selectedAnswer === null && handleAnswer(index)}
            disabled={selectedAnswer !== null}
            whileHover={selectedAnswer === null ? { scale: 1.02 } : {}}
            whileTap={selectedAnswer === null ? { scale: 0.98 } : {}}
            className={`w-full px-4 py-3 rounded-lg text-sm font-medium text-left transition-all ${
              selectedAnswer === null
                ? 'bg-gray-800 hover:bg-gray-700'
                : selectedAnswer === index
                ? index === question.correct
                  ? 'bg-green-600 text-white'
                  : 'bg-red-600 text-white'
                : index === question.correct
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 opacity-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                {String.fromCharCode(65 + index)}
              </span>
              {option}
            </div>
          </motion.button>
        ))}
      </div>

      {selectedAnswer !== null && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-lg text-xs ${
            selectedAnswer === question.correct
              ? 'bg-green-500/20 border border-green-500/30 text-green-300'
              : 'bg-red-500/20 border border-red-500/30 text-red-300'
          }`}
        >
          {question.explanation}
        </motion.div>
      )}
    </div>
  );
};

// 2. FLASHCARD SYSTEM - Study Tool Demo
const FlashcardWidget = () => {
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const cards = [
    { 
      front: "Bull vs Bear Market", 
      back: "Bull = prices rising (optimism). Bear = prices falling (pessimism). Remember: Bulls charge up, bears swipe down!" 
    },
    { 
      front: "Risk Tolerance", 
      back: "Your ability to handle investment losses without panic. High risk = volatile assets. Low risk = stable, slower growth." 
    },
    { 
      front: "Dollar-Cost Averaging", 
      back: "Investing fixed amounts regularly, regardless of price. Reduces impact of market volatility over time." 
    }
  ];

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCard((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCard((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs">
        <span className="text-purple-400 font-bold">
          Card {currentCard + 1} / {cards.length}
        </span>
        <span className="text-gray-500">
          Tap to flip
        </span>
      </div>

      <motion.div
        onClick={() => setIsFlipped(!isFlipped)}
        className="relative h-48 cursor-pointer perspective-1000"
        style={{ perspective: '1000px' }}
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.4 }}
          className="w-full h-full relative preserve-3d"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 flex items-center justify-center backface-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="text-center">
              <div className="text-sm font-bold text-purple-200 mb-3">CONCEPT</div>
              <p className="text-xl font-black text-white leading-relaxed">
                {cards[currentCard].front}
              </p>
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-6 flex items-center justify-center backface-hidden"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className="text-center">
              <div className="text-sm font-bold text-blue-200 mb-3">EXPLANATION</div>
              <p className="text-sm text-white leading-relaxed">
                {cards[currentCard].back}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="flex gap-2">
        <button
          onClick={prevCard}
          className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-semibold transition-colors"
        >
          ← Previous
        </button>
        <button
          onClick={nextCard}
          className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-semibold transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

// 3. PROGRESS TRACKER - Learning Analytics Demo
const ProgressTrackerWidget = () => {
  const subjects = [
    { name: "Trading Basics", progress: 87, color: "from-blue-500 to-cyan-500", icon: "📈" },
    { name: "Risk Management", progress: 65, color: "from-green-500 to-emerald-500", icon: "🛡️" },
    { name: "Market Analysis", progress: 92, color: "from-purple-500 to-pink-500", icon: "🔍" }
  ];

  return (
    <div className="space-y-4">
      {subjects.map((subject, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{subject.icon}</span>
              <span className="text-sm font-bold">{subject.name}</span>
            </div>
            <span className="text-sm font-bold text-green-400">
              {subject.progress}%
            </span>
          </div>
          
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${subject.progress}%` }}
              transition={{ duration: 1, delay: i * 0.2 }}
              className={`h-full bg-gradient-to-r ${subject.color} rounded-full`}
            />
          </div>
        </motion.div>
      ))}

      <div className="pt-4 mt-4 border-t border-gray-800">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Overall Progress</span>
          <span className="font-bold text-green-400">81%</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          🎯 You're mastering trading fundamentals!
        </p>
      </div>
    </div>
  );
};

// Floating Card Component
const FloatingLearningCard = ({ delay = 0, children, className = "" }: { delay?: number, children: React.ReactNode, className?: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      className={className}
    >
      <motion.div
        animate={{ 
          y: [-5, 5, -5],
          rotate: [-1, 1, -1]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay * 0.5
        }}
        className="relative"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

// Animated Course Showcase
const AnimatedCourseShowcase = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const courses = [
    {
      title: "Stock Market Fundamentals",
      description: "From basic concepts to portfolio building",
      gradient: "from-blue-500 to-cyan-500",
      icon: "📈",
      category: "Finance"
    },
    {
      title: "Digital Photography Mastery",
      description: "Composition, lighting, and editing techniques",
      gradient: "from-purple-500 to-pink-500",
      icon: "📸",
      category: "Creative"
    },
    {
      title: "Italian Cooking Essentials",
      description: "Authentic recipes and culinary techniques",
      gradient: "from-red-500 to-orange-500",
      icon: "🍝",
      category: "Lifestyle"
    },
    {
      title: "Python for Beginners",
      description: "Code your first program in interactive lessons",
      gradient: "from-green-500 to-emerald-500",
      icon: "💻",
      category: "Technology"
    },
    {
      title: "Stoic Philosophy Guide",
      description: "Ancient wisdom for modern challenges",
      gradient: "from-amber-500 to-yellow-500",
      icon: "🏛️",
      category: "Philosophy"
    },
    {
      title: "Guitar Music Theory",
      description: "Scales, chords, and composition basics",
      gradient: "from-indigo-500 to-purple-500",
      icon: "🎸",
      category: "Music"
    }
  ];

  return (
    <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-opacity duration-300" />
          
          <div className="relative bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 h-full overflow-hidden">
            {/* Category Badge */}
            <div className="absolute top-4 right-4">
              <span className="text-xs px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-gray-400 border border-white/10">
                {course.category}
              </span>
            </div>

            {/* Icon */}
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${course.gradient} flex items-center justify-center text-3xl mb-4 shadow-lg`}>
              {course.icon}
            </div>

            {/* Content */}
            <h3 className="text-xl font-bold mb-2 text-white">{course.title}</h3>
            <p className="text-sm text-gray-400 mb-4">{course.description}</p>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-gray-500 pt-4 border-t border-gray-800">
              <span className="flex items-center gap-1">
                <Sparkles size={12} className="text-purple-400" />
                AI-Generated
              </span>
              <span className="flex items-center gap-1">
                <Trophy size={12} className="text-yellow-400" />
                Interactive
              </span>
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-purple-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Course Creation Demo
const CourseCreationDemo = () => {
  const [step, setStep] = useState(0);
  const steps = [
    { text: "I want to learn options trading strategies...", icon: "💭" },
    { text: "Analyzing best learning path...", icon: "🧠" },
    { text: "Generating interactive lessons with simulations...", icon: "✨" },
    { text: "Your personalized course is ready!", icon: "🎉" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <div className="bg-black/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
        <div className="space-y-6">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.3, x: -20 }}
              animate={{ 
                opacity: i === step ? 1 : i < step ? 0.5 : 0.3,
                x: i === step ? 0 : -20,
                scale: i === step ? 1.05 : 1
              }}
              transition={{ duration: 0.5 }}
              className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                i === step ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30' : 'bg-gray-900/30'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                i === step ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg' : 'bg-gray-800'
              }`}>
                {s.icon}
              </div>
              <p className={`text-sm font-medium ${i === step ? 'text-white' : 'text-gray-500'}`}>
                {s.text}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mt-6 h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: "0%" }}
            animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          Average course generation: <span className="text-purple-400 font-bold">3 Minutes</span>
        </p>
      </div>
    </div>
  );
};

export default function Landing() {
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
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
        className="relative min-h-screen flex items-center justify-center px-6 pt-20 pb-32"
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-20">
            {/* Logo with Animation */}
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
                className="relative"
              >
                <Image 
                  src="/logo.png" 
                  alt="Garliq" 
                  width={120} 
                  height={120}
                  className="filter drop-shadow-2xl"
                />
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
              <div className="inline-block mb-6">
                <span className="px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full text-sm font-bold text-purple-300 backdrop-blur-sm">
                  ✨ Your Personal AI Learning Architect
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-7xl font-black mb-8 leading-none">
                Turn Curiosity Into
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
                  Structured Mastery
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed">
                Want to learn <span className="text-white font-bold">trading, photography, or philosophy?</span> Just describe what you're curious about. 
                Our AI instantly crafts a <span className="text-white font-bold">personalized, interactive course</span> with quizzes, simulations, and a 24/7 AI tutor.
              </p>

              {/* Primary CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                <Link href="/auth">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(147, 51, 234, 0.6)' }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-lg overflow-hidden shadow-2xl"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      Start Learning Anything Today
                      <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </span>
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </motion.button>
                </Link>
              </div>

              {/* Trust Signals */}
              <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  $3/month unlimited access
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  AI Tutor Included
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Learn At Your Pace
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Any Topic, Any Time
                </div>
              </div>
            </motion.div>
          </div>

          {/* Live Learning Demos */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="relative max-w-7xl mx-auto"
          >
            <div className="text-center mb-12">
              <p className="text-sm text-purple-400 font-bold mb-2">👇 TRY THESE LIVE DEMOS</p>
              <h3 className="text-2xl md:text-3xl font-black text-white">
                This Is How You'll <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Actually Learn</span>
              </h3>
              <p className="text-gray-500 mt-2">Interactive quizzes, flashcards, and progress tracking in every course</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Demo 1: Interactive Quiz */}
              <FloatingLearningCard delay={0.1}>
                <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl overflow-hidden shadow-2xl hover:border-purple-500/50 transition-all group">
                  <div className="p-4 border-b border-gray-800 bg-black/50 backdrop-blur-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-xl font-bold">
                        🎯
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Interactive Quiz</h4>
                        <p className="text-xs text-gray-500">Trading Fundamentals</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30 font-semibold">
                      LIVE
                    </span>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-purple-900/20 to-black">
                    <InteractiveQuizWidget />
                  </div>

                  <div className="p-4 border-t border-gray-800 flex items-center justify-between text-xs bg-black/50 backdrop-blur-sm">
                    <span className="text-gray-500">Test your knowledge as you learn</span>
                  </div>
                </div>
              </FloatingLearningCard>

              {/* Demo 2: Flashcards */}
              <FloatingLearningCard delay={0.2}>
                <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl overflow-hidden shadow-2xl hover:border-blue-500/50 transition-all group">
                  <div className="p-4 border-b border-gray-800 bg-black/50 backdrop-blur-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-xl font-bold">
                        📚
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Smart Flashcards</h4>
                        <p className="text-xs text-gray-500">Key Concepts Review</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30 font-semibold">
                      LIVE
                    </span>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-blue-900/20 to-black">
                    <FlashcardWidget />
                  </div>

                  <div className="p-4 border-t border-gray-800 flex items-center justify-between text-xs bg-black/50 backdrop-blur-sm">
                    <span className="text-gray-500">Memorize faster with spaced repetition</span>
                  </div>
                </div>
              </FloatingLearningCard>

              {/* Demo 3: Progress Tracker */}
              <FloatingLearningCard delay={0.3}>
                <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl overflow-hidden shadow-2xl hover:border-green-500/50 transition-all group">
                  <div className="p-4 border-b border-gray-800 bg-black/50 backdrop-blur-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center text-xl font-bold">
                        📊
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Progress Tracking</h4>
                        <p className="text-xs text-gray-500">Your Learning Journey</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30 font-semibold">
                      LIVE
                    </span>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-green-900/20 to-black">
                    <ProgressTrackerWidget />
                  </div>

                  <div className="p-4 border-t border-gray-800 flex items-center justify-between text-xs bg-black/50 backdrop-blur-sm">
                    <span className="text-gray-500">Watch yourself improve every day</span>
                  </div>
                </div>
              </FloatingLearningCard>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* How It Works Section */}
      <div className="relative py-32 px-6 bg-gradient-to-b from-black via-purple-950/10 to-black">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-block mb-6">
              <span className="px-6 py-3 bg-gradient-to-r from-pink-500/20 to-orange-500/20 border border-pink-500/30 rounded-full text-sm font-bold text-pink-300 backdrop-blur-sm">
                ⚡ From Curiosity to Mastery
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              How Garliq Works
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              No more scattered YouTube videos or overpriced courses. Get structured, personalized learning in minutes.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="space-y-6">
                {[
                  {
                    step: "01",
                    title: "Tell Us What You're Curious About",
                    description: "Type anything: 'I want to learn options trading,' 'Teach me Italian cooking,' or 'Help me understand stoic philosophy.' Be as specific or broad as you want.",
                    icon: "💭"
                  },
                  {
                    step: "02",
                    title: "AI Crafts Your Perfect Course",
                    description: "Our AI analyzes the best learning path, creates structured lessons, adds interactive elements (quizzes, simulations, flashcards), and embeds a 24/7 AI tutor.",
                    icon: "🤖"
                  },
                  {
                    step: "03",
                    title: "Learn By Doing",
                    description: "Dive into interactive lessons at your own pace. Ask your AI tutor questions anytime. Track your progress. Master the skill. All in one place.",
                    icon: "🚀"
                  }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2 }}
                    className="flex gap-6 group"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
                        {item.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-purple-400 mb-2">STEP {item.step}</div>
                      <h4 className="text-2xl font-bold mb-3">{item.title}</h4>
                      <p className="text-gray-400 leading-relaxed">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-bold text-white mb-2">Course Ready In</p>
                    <p className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                      ~3 Minutes
                    </p>
                    <p className="text-xs text-gray-500 mt-2">While you grab coffee, your personalized course is being built</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <CourseCreationDemo />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Sample Courses Section */}
      <div className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-block mb-6">
              <span className="px-6 py-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-full text-sm font-bold text-orange-300 backdrop-blur-sm">
                🌍 Learn Absolutely Anything
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              What Will You
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                Master Next?
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              From career skills to creative hobbies. From philosophy to finance. If you're curious, we'll build it.
            </p>
          </motion.div>

          <AnimatedCourseShowcase />

          {/* Topic Categories */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20"
          >
            <h3 className="text-2xl font-bold text-center mb-8 text-gray-400">Popular Learning Paths</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "📈 Stock Trading", 
                "💻 Programming", 
                "📸 Photography", 
                "🍳 Cooking",
                "🎸 Music",
                "✍️ Writing",
                "🗣️ Languages",
                "🎨 Digital Art",
                "🧠 Philosophy",
                "🏋️ Fitness",
                "🎬 Video Editing",
                "🌱 Gardening",
                "♟️ Chess Strategy",
                "💼 Business Skills",
                "🎭 Public Speaking"
              ].map((topic, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.1 }}
                  className="px-5 py-2.5 bg-gray-900/50 hover:bg-gray-800/80 border border-gray-800 hover:border-purple-500/50 rounded-full text-sm font-medium transition-all cursor-pointer backdrop-blur-sm"
                >
                  {topic}
                </motion.div>
              ))}
            </div>
            <p className="text-center text-sm text-gray-500 mt-8">
              ...or literally anything else. Just ask.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Killer Feature: Embedded AI Tutor */}
      <div className="relative py-32 px-6 bg-gradient-to-b from-black via-purple-950/10 to-black">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-block mb-6">
              <span className="px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-full text-sm font-bold text-cyan-300 backdrop-blur-sm flex items-center gap-2 mx-auto w-fit">
                <Sparkles size={16} />
                Never Learn Alone Again
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              Every Course Includes
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
                A Personal AI Tutor
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Stuck at 2 AM? Confused by a concept? Your AI tutor is always there—answering questions, explaining differently, and guiding you to breakthroughs.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg flex-shrink-0">
                    🤖
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Your 24/7 Learning Companion</h3>
                    <p className="text-gray-400 text-sm">Understands your course, adapts to your pace, never judges your questions</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-white">Instant Answers</p>
                      <p className="text-sm text-gray-500">No waiting for office hours or forum replies</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-white">Explains Concepts Multiple Ways</p>
                      <p className="text-sm text-gray-500">If you don't understand, it tries a different approach</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-white">Guides, Doesn't Spoonfeed</p>
                      <p className="text-sm text-gray-500">Asks questions to help you discover answers yourself</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-white">Adapts To Your Learning Style</p>
                      <p className="text-sm text-gray-500">Visual learner? Prefers examples? It adapts</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Lightbulb className="w-6 h-6 text-yellow-400" />
                  <p className="font-bold text-white">Learning Philosophy</p>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  The AI uses Socratic method—asking guiding questions instead of giving direct answers. This builds deeper understanding and critical thinking skills.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-gray-900 to-black border-2 border-cyan-500/30 rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Mock Course UI with AI Chat */}
              <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-4 flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-white" />
                <div>
                  <p className="font-bold text-white text-sm">Trading 101: Options Strategies</p>
                  <p className="text-xs text-cyan-100">Lesson 5: Risk Management</p>
                </div>
              </div>

              <div className="grid grid-cols-2">
                {/* Left: Course Content */}
                <div className="p-6 border-r border-gray-800 bg-gray-900/50">
                  <h4 className="text-sm font-bold mb-3 text-purple-400">📖 Lesson Content</h4>
                  <div className="space-y-3 text-xs text-gray-400">
                    <p>Put options give you the right to sell at a strike price.</p>
                    <div className="bg-gray-800 rounded p-3">
                      <p className="text-white font-mono text-[10px]">Example: SPY $450 Put</p>
                    </div>
                    <p>Use protective puts to hedge your portfolio against downside risk.</p>
                  </div>
                </div>

                {/* Right: AI Tutor Chat */}
                <div className="p-6 bg-black/50">
                  <h4 className="text-sm font-bold mb-3 text-cyan-400 flex items-center gap-2">
                    <Brain size={14} />
                    AI Tutor
                  </h4>
                  <div className="space-y-2 text-xs mb-3">
                    <div className="bg-gray-800 rounded-lg p-2 text-gray-300">
                      <p className="font-semibold text-white mb-1">You:</p>
                      <p>Why would I buy a put if I think the price will fall?</p>
                    </div>
                    <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-lg p-2 text-gray-200">
                      <p className="font-semibold text-cyan-300 mb-1">Tutor:</p>
                      <p>Great question! Think about insurance. You buy it hoping you'll never need it, right? How is a put option similar?</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <input 
                      type="text" 
                      placeholder="Ask anything..."
                      className="flex-1 px-2 py-1 bg-gray-800 rounded text-[10px] text-gray-400 border border-gray-700"
                      disabled
                    />
                    <button className="px-2 py-1 bg-cyan-600 rounded text-[10px] text-white">Send</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Who It's For Section */}
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
                Curious Minds
              </span>
            </h2>
            <p className="text-xl text-gray-400">
              Whether you're 18 or 80, changing careers or exploring hobbies—Garliq adapts to you
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                emoji: "🚀",
                title: "Career Changers",
                description: "Learning new skills to pivot careers. Master coding, marketing, data analysis, or design at your own pace."
              },
              {
                emoji: "💡",
                title: "Lifelong Learners",
                description: "Curious about everything. Explore philosophy, art history, astronomy, or quantum physics—just because."
              },
              {
                emoji: "💼",
                title: "Entrepreneurs",
                description: "Building businesses and need to learn fast. Sales, finance, leadership, and growth strategies on demand."
              },
              {
                emoji: "🎨",
                title: "Hobbyists & Creators",
                description: "Pursuing passions outside work. Learn guitar, photography, cooking, chess, gardening—whatever sparks joy."
              }
            ].map((persona, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all"
              >
                <div className="text-5xl mb-4">{persona.emoji}</div>
                <h3 className="text-xl font-bold mb-3">{persona.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{persona.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-8 text-center"
          >
            <p className="text-lg text-gray-300 mb-4">
              <span className="font-bold text-white">Teachers & Educators?</span> You're covered too.
            </p>
            <p className="text-sm text-gray-500">
              Create courses for your students, share via link, and track their progress—all with the same $3/month subscription.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="relative py-32 px-6 bg-gradient-to-b from-black via-purple-950/10 to-black">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="inline-block mb-6">
              <span className="px-6 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full text-sm font-bold text-green-300 backdrop-blur-sm">
                💰 Transparent, Fair Pricing
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              Learn Everything
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                For $3 Per Month
              </span>
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto">
              Unlimited access to all courses. Create your own courses with tokens. No hidden fees. Cancel anytime.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
                <div className="text-4xl mb-4">🎓</div>
                <h3 className="text-2xl font-bold mb-2">Access All Courses</h3>
                <div className="text-5xl font-black text-purple-400 mb-4">$3<span className="text-lg text-gray-500">/mo</span></div>
                <p className="text-sm text-gray-400 mb-6">Unlock unlimited learning</p>
                <div className="text-left space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-400" />
                    <span>Unlimited access to ALL courses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-400" />
                    <span>Learn at your own pace</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-400" />
                    <span>AI tutor included in every course</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-400" />
                    <span>Track your progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-400" />
                    <span>Share courses with friends</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-2 border-purple-500/50 rounded-2xl p-8 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-4 py-1 rounded-full font-bold">
                  FOR CREATORS
                </div>
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-2xl font-bold mb-2">Create Your Own</h3>
                <div className="text-3xl font-black text-purple-400 mb-4">Buy Tokens</div>
                <p className="text-sm text-gray-400 mb-6">Pay only for what you create</p>
                <div className="text-left space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-400" />
                    <span>Everything in Access plan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-400" />
                    <span>Create unlimited courses with tokens</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-400" />
                    <span>Share your courses with others</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-400" />
                    <span>Build your own learning library</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-400" />
                    <span>Customize course content</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-6 max-w-3xl mx-auto">
              <div className="flex items-start gap-4">
                <Lightbulb className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                <div className="text-left">
                  <p className="font-bold text-white mb-2">How Tokens Work</p>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Your $3/month subscription gives you access to all existing courses. To create your own personalized courses, 
                    you'll need tokens (one-time purchase). Average course creation costs vary based on complexity and length. 
                    Buy tokens in flexible packages as needed.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="relative py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl"
          >
            <motion.div 
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 opacity-20 blur-3xl"
              style={{ backgroundSize: '200% 200%' }}
            />
            
            <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 border border-purple-500/30 backdrop-blur-xl p-16 text-center">
              <div className="mb-8">
                <Image 
                  src="/logo.png" 
                  alt="Garliq" 
                  width={80} 
                  height={80}
                  className="mx-auto filter drop-shadow-2xl"
                />
              </div>

              <h2 className="text-5xl md:text-6xl font-black mb-6">
                What Will You
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                  Learn Today?
                </span>
              </h2>
              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                Stop dreaming about learning. Stop wasting time on scattered resources. Start mastering skills that matter to you—right now.
              </p>
              
              <Link href="/auth">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-12 py-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-xl overflow-hidden shadow-2xl"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Start Learning for $3/Month
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
                  Cancel anytime
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Start learning in 30 seconds
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Unlimited courses
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
              <Image 
                src="/logo.png" 
                alt="Garliq" 
                width={48} 
                height={48}
              />
              <div>
                <p className="font-bold text-white">Garliq</p>
                <p className="text-sm text-gray-600">Your Personal AI Learning Architect</p>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <Link href="/auth" className="hover:text-purple-400 transition-colors">
                Get Started
              </Link>
              <Link href="/contact" className="hover:text-purple-400 transition-colors">
                Contact & Support
              </Link>
              <Link href="/privacy-policy" className="hover:text-purple-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-purple-400 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-900 text-center text-gray-600 text-sm">
            <p className="mb-2">© 2025 Garliq by Parasync Technologies. Empowering lifelong learners everywhere.</p>
            <p>
              Need help? <a href="mailto:team@parasync.in" className="text-purple-400 hover:text-purple-300 underline">team@parasync.in</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}