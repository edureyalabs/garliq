'use client';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Sparkles, Zap, Share2, GitFork, ArrowRight, CheckCircle2, Code2, Globe2, Rocket, Heart, Layers, Terminal, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

// ============================================
// FUNCTIONAL MICRO-APP WIDGETS
// ============================================

// 1. TIC TAC TOE GAME - Fully Functional
const TicTacToeGame = () => {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);

  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];
    for (let [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const handleClick = (index: number) => {
    if (board[index] || winner) return;
    
    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);
    
    const gameWinner = calculateWinner(newBoard);
    if (gameWinner) setWinner(gameWinner);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">
          {winner ? (
            <span className="text-green-400">🎉 {winner} Wins!</span>
          ) : board.every(cell => cell) ? (
            <span className="text-yellow-400">Draw!</span>
          ) : (
            <span className="text-purple-400">Turn: {isXNext ? 'X' : 'O'}</span>
          )}
        </div>
        <button
          onClick={resetGame}
          className="text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, i) => (
          <motion.button
            key={i}
            onClick={() => handleClick(i)}
            whileHover={{ scale: cell ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`aspect-square rounded-xl flex items-center justify-center text-2xl font-bold transition-all ${
              cell 
                ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg' 
                : 'bg-gray-800 hover:bg-gray-700 text-gray-600'
            }`}
          >
            {cell}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// 2. CRYPTO TRACKER - Real-time prices
const CryptoTrackerWidget = () => {
  const [prices, setPrices] = useState({
    BTC: { price: 97234, change: 2.4, trend: 'up' },
    ETH: { price: 3642, change: -1.2, trend: 'down' },
    SOL: { price: 198, change: 5.7, trend: 'up' }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => ({
        BTC: {
          price: prev.BTC.price + (Math.random() - 0.5) * 500,
          change: prev.BTC.change + (Math.random() - 0.5) * 0.5,
          trend: Math.random() > 0.5 ? 'up' : 'down'
        },
        ETH: {
          price: prev.ETH.price + (Math.random() - 0.5) * 50,
          change: prev.ETH.change + (Math.random() - 0.5) * 0.3,
          trend: Math.random() > 0.5 ? 'up' : 'down'
        },
        SOL: {
          price: prev.SOL.price + (Math.random() - 0.5) * 10,
          change: prev.SOL.change + (Math.random() - 0.5) * 0.4,
          trend: Math.random() > 0.5 ? 'up' : 'down'
        }
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const cryptos = [
    { symbol: 'BTC', name: 'Bitcoin', color: 'from-orange-500 to-yellow-500', icon: '₿' },
    { symbol: 'ETH', name: 'Ethereum', color: 'from-blue-500 to-cyan-500', icon: 'Ξ' },
    { symbol: 'SOL', name: 'Solana', color: 'from-purple-500 to-pink-500', icon: '◎' }
  ];

  return (
    <div className="space-y-3">
      {cryptos.map((crypto) => {
        const data = prices[crypto.symbol as keyof typeof prices];
        const isPositive = data.change > 0;

        return (
          <motion.div
            key={crypto.symbol}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${crypto.color} flex items-center justify-center text-xl font-bold`}>
                  {crypto.icon}
                </div>
                <div>
                  <div className="font-bold text-sm">{crypto.symbol}</div>
                  <div className="text-xs text-gray-500">{crypto.name}</div>
                </div>
              </div>
              <div className="text-right">
                <motion.div 
                  key={data.price}
                  initial={{ scale: 1.2, color: isPositive ? '#10b981' : '#ef4444' }}
                  animate={{ scale: 1, color: '#ffffff' }}
                  className="font-bold"
                >
                  ${data.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </motion.div>
                <div className={`text-xs font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? '↑' : '↓'} {Math.abs(data.change).toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Mini Chart */}
            <div className="h-8 flex items-end gap-1">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ 
                    height: `${20 + Math.random() * 80}%`,
                  }}
                  transition={{ 
                    duration: 0.5,
                    delay: i * 0.02,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                  className={`flex-1 rounded-sm ${
                    isPositive ? 'bg-green-500/50' : 'bg-red-500/50'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// 3. AI CHATBOT WIDGET - Interactive
const AIChatbotWidget = () => {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I\'m your AI assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickReplies = ['Tell me a joke', 'What\'s the weather?', 'Help me learn', 'Random fact'];

  const simulateResponse = (userMessage: string) => {
    setIsTyping(true);
    
    setTimeout(() => {
      const responses: { [key: string]: string } = {
        'tell me a joke': '🤣 Why did the developer go broke? Because they used up all their cache!',
        'what\'s the weather?': '☀️ It\'s sunny and 72°F in San Francisco! Perfect coding weather.',
        'help me learn': '📚 I can help you learn anything! What topic interests you?',
        'random fact': '🌟 Did you know? Honey never spoils. Archaeologists found 3000-year-old honey that was still edible!',
        'default': '🤖 That\'s interesting! I\'m a demo AI, but imagine what a real Garliq Card could do!'
      };

      const responseKey = userMessage.toLowerCase();
      const response = responses[responseKey] || responses['default'];

      setMessages(prev => [...prev, { role: 'bot', text: response }]);
      setIsTyping(false);
    }, 1000);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text: input }]);
    simulateResponse(input);
    setInput('');
  };

  const handleQuickReply = (reply: string) => {
    setMessages(prev => [...prev, { role: 'user', text: reply }]);
    simulateResponse(reply);
  };

  return (
    <div className="space-y-3">
      {/* Chat Messages */}
      <div className="h-40 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-gray-800 text-gray-200'
              }`}
            >
              {msg.text}
            </div>
          </motion.div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-800 px-3 py-2 rounded-xl flex items-center gap-1">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                className="w-1.5 h-1.5 bg-gray-400 rounded-full"
              />
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                className="w-1.5 h-1.5 bg-gray-400 rounded-full"
              />
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                className="w-1.5 h-1.5 bg-gray-400 rounded-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Replies */}
      <div className="flex flex-wrap gap-2">
        {quickReplies.map((reply, i) => (
          <button
            key={i}
            onClick={() => handleQuickReply(reply)}
            className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {reply}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 bg-gray-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-500"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
        >
          Send
        </button>
      </div>
    </div>
  );
};

// Floating Garliq Card Component
const FloatingGarliqCard = ({ delay = 0, children, className = "" }: { delay?: number, children: React.ReactNode, className?: string }) => {
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

// Animated Card Showcase Component
const AnimatedCardShowcase = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const cards = [
    {
      title: "Crypto Portfolio Tracker",
      description: "Real-time crypto prices with alerts",
      gradient: "from-orange-500 to-pink-500",
      icon: "₿",
      category: "Finance"
    },
    {
      title: "Quiz Master",
      description: "Interactive quizzes with scoring",
      gradient: "from-purple-500 to-blue-500",
      icon: "🎯",
      category: "Education"
    },
    {
      title: "Workout Timer",
      description: "Custom interval training tool",
      gradient: "from-green-500 to-teal-500",
      icon: "💪",
      category: "Health"
    },
    {
      title: "Budget Calculator",
      description: "Smart expense tracking",
      gradient: "from-yellow-500 to-orange-500",
      icon: "💰",
      category: "Finance"
    },
    {
      title: "Recipe Scaler",
      description: "Adjust ingredient portions instantly",
      gradient: "from-red-500 to-pink-500",
      icon: "🍳",
      category: "Lifestyle"
    },
    {
      title: "Meeting Assistant",
      description: "Agenda and notes organizer",
      gradient: "from-indigo-500 to-purple-500",
      icon: "📅",
      category: "Productivity"
    }
  ];

  return (
    <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-opacity duration-300" 
               style={{ background: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }} />
          
          <div className="relative bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 h-full overflow-hidden">
            {/* Category Badge */}
            <div className="absolute top-4 right-4">
              <span className="text-xs px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-gray-400 border border-white/10">
                {card.category}
              </span>
            </div>

            {/* Icon */}
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-3xl mb-4 shadow-lg`}>
              {card.icon}
            </div>

            {/* Content */}
            <h3 className="text-xl font-bold mb-2 text-white">{card.title}</h3>
            <p className="text-sm text-gray-400 mb-4">{card.description}</p>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-gray-500 pt-4 border-t border-gray-800">
              <span className="flex items-center gap-1">
                <Heart size={12} className="text-pink-400" />
                {Math.floor(Math.random() * 900) + 100}
              </span>
              <span className="flex items-center gap-1">
                <GitFork size={12} className="text-purple-400" />
                {Math.floor(Math.random() * 50) + 10}
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

// Thought to Execution Animation
const ThoughtToExecutionDemo = () => {
  const [step, setStep] = useState(0);
  const steps = [
    { text: "I need a tip calculator for my restaurant...", icon: "💭" },
    { text: "Analyzing your request...", icon: "🤖" },
    { text: "Designing interface...", icon: "🎨" },
    { text: "Your Garliq Card is ready!", icon: "✨" }
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
          Average creation time: <span className="text-purple-400 font-bold">3 Minutes</span>
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
                  ✨ World's First Micro-Application Creation Platform
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-none">
                Turn Your Thoughts Into
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
                  Instant Utilities
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed">
                Introducing <span className="text-white font-bold">Garliq Cards</span> — living, shareable micro-applications 
                that bring your ideas to life in minutes. No coding. No complexity. Just pure creation.
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
                      Create Your Garliqs Now
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
                  Free to Start
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Pay as you Go
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Explore Other Garliq Cards
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Powerful Agentic Orchestration
                </div>
              </div>
            </motion.div>
          </div>

          {/* Floating Cards Preview - REAL FUNCTIONAL DEMOS */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="relative max-w-7xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1: Real Interactive Game - Tic Tac Toe */}
              <FloatingGarliqCard delay={0.1}>
                <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl overflow-hidden shadow-2xl hover:border-purple-500/50 transition-all group">
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-800 bg-black/50 backdrop-blur-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-xl font-bold">
                        🎮
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Tic Tac Toe</h4>
                        <p className="text-xs text-gray-500">by @sarah_codes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30 font-semibold">
                        LIVE
                      </span>
                    </div>
                  </div>

                  {/* Actual Functional Game */}
                  <div className="p-6 bg-gradient-to-br from-purple-900/20 to-black">
                    <TicTacToeGame />
                  </div>

                  {/* Card Footer */}
                  <div className="p-4 border-t border-gray-800 flex items-center justify-between text-xs bg-black/50 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-gray-400 hover:text-pink-400 transition-colors cursor-pointer">
                        <Heart size={14} className="text-pink-400" /> 1.2K
                      </span>
                      <span className="flex items-center gap-1 text-gray-400 hover:text-purple-400 transition-colors cursor-pointer">
                        <GitFork size={14} className="text-purple-400" /> 234
                      </span>
                    </div>
                    <span className="text-gray-500">Built in 24s</span>
                  </div>
                </div>
              </FloatingGarliqCard>

              {/* Card 2: Real Crypto Price Tracker */}
              <FloatingGarliqCard delay={0.2}>
                <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl overflow-hidden shadow-2xl hover:border-blue-500/50 transition-all group">
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-800 bg-black/50 backdrop-blur-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-xl font-bold">
                        ₿
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Crypto Tracker</h4>
                        <p className="text-xs text-gray-500">by @cryptoking</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30 font-semibold">
                        LIVE
                      </span>
                    </div>
                  </div>

                  {/* Actual Functional Crypto Tracker */}
                  <div className="p-6 bg-gradient-to-br from-blue-900/20 to-black">
                    <CryptoTrackerWidget />
                  </div>

                  {/* Card Footer */}
                  <div className="p-4 border-t border-gray-800 flex items-center justify-between text-xs bg-black/50 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-gray-400 hover:text-pink-400 transition-colors cursor-pointer">
                        <Heart size={14} className="text-pink-400" /> 3.4K
                      </span>
                      <span className="flex items-center gap-1 text-gray-400 hover:text-purple-400 transition-colors cursor-pointer">
                        <GitFork size={14} className="text-purple-400" /> 567
                      </span>
                    </div>
                    <span className="text-gray-500">Built in 31s</span>
                  </div>
                </div>
              </FloatingGarliqCard>

              {/* Card 3: Real AI Chatbot */}
              <FloatingGarliqCard delay={0.3}>
                <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl overflow-hidden shadow-2xl hover:border-green-500/50 transition-all group">
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-800 bg-black/50 backdrop-blur-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center text-xl font-bold">
                        🤖
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">AI Assistant</h4>
                        <p className="text-xs text-gray-500">by @ai_builder</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30 font-semibold">
                        LIVE
                      </span>
                    </div>
                  </div>

                  {/* Actual Functional AI Chatbot */}
                  <div className="p-6 bg-gradient-to-br from-green-900/20 to-black">
                    <AIChatbotWidget />
                  </div>

                  {/* Card Footer */}
                  <div className="p-4 border-t border-gray-800 flex items-center justify-between text-xs bg-black/50 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-gray-400 hover:text-pink-400 transition-colors cursor-pointer">
                        <Heart size={14} className="text-pink-400" /> 2.8K
                      </span>
                      <span className="flex items-center gap-1 text-gray-400 hover:text-purple-400 transition-colors cursor-pointer">
                        <GitFork size={14} className="text-purple-400" /> 423
                      </span>
                    </div>
                    <span className="text-gray-500">Built in 28s</span>
                  </div>
                </div>
              </FloatingGarliqCard>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* What Are Garliq Cards */}
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
                🎴 Introducing Garliq Cards
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              Not Apps. Not Websites.
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                Living Utilities.
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Garliq Cards are micro-applications that exist as self-contained, shareable utilities. 
              They're born from your thoughts, run instantly, and evolve through community collaboration.
            </p>
          </motion.div>

          {/* Three Core Principles */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {[
              {
                icon: Sparkles,
                title: "Instant Manifestation",
                description: "Describe what you need in plain language. Your Garliq Card materializes in ~3 minutes, ready to use immediately.",
                gradient: "from-purple-500 to-purple-600"
              },
              {
                icon: Share2,
                title: "Social by Design",
                description: "Every card can be shared, forked, and remixed. Solutions spread like ideas but work like software.",
                gradient: "from-pink-500 to-pink-600"
              },
              {
                icon: Rocket,
                title: "Forever Evolving",
                description: "Cards improve over time through community forks and iterations. The best versions naturally rise to the top.",
                gradient: "from-orange-500 to-orange-600"
              }
            ].map((principle, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                whileHover={{ y: -10 }}
                className="relative group"
              >
                <div className="relative z-10 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 h-full hover:border-purple-500/50 transition-all">
                  <div className={`inline-block p-5 rounded-2xl bg-gradient-to-br ${principle.gradient} mb-6 shadow-2xl`}>
                    <principle.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{principle.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{principle.description}</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 rounded-2xl blur-xl transition-opacity" 
                     style={{ background: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }} />
              </motion.div>
            ))}
          </div>

          {/* Visual Comparison */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="inline-block px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full text-sm font-semibold text-red-300 mb-4">
                ❌ THE OLD WAY
              </div>
              <h3 className="text-3xl font-bold mb-6 text-gray-400">Traditional Software</h3>
              <div className="space-y-4">
                {[
                  "Search for the right tool online",
                  "Sign up for yet another account",
                  "Pay monthly subscription fees",
                  "Learn complex interface",
                  "Wait for features you need",
                  "Start over when requirements change"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-gray-500">
                    <span className="text-red-400 mt-1">✕</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="inline-block px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-sm font-semibold text-green-300 mb-4">
                ✓ THE GARLIQ WAY
              </div>
              <h3 className="text-3xl font-bold mb-6">Garliq Cards</h3>
              <div className="space-y-4">
                {[
                  "Describe what you need in one prompt",
                  "Your Garliq Card is created instantly",
                  "Use it immediately, Enjoy the Experience",
                  "Share with anyone via simple link",
                  "Fork and customize as needs evolve",
                  "Explore & Use Garliqs of Other Creators"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* From Thought to Execution */}
      <div className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-block mb-6">
              <span className="px-6 py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full text-sm font-bold text-purple-300 backdrop-blur-sm">
                ⚡ THE MAGIC HAPPENS INSTANTLY
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              Bring Your Thoughts
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                To Life
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              The gap between imagination and execution? Gone. Your thoughts become running, shareable utilities in seconds.
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
                    title: "Think It",
                    description: "Describe your need naturally: 'I need a calculator that splits bills including tip percentages'",
                    icon: "💭"
                  },
                  {
                    step: "02",
                    title: "Watch It Form",
                    description: "AI understands your intent and crafts a perfect micro-application in real-time",
                    icon: "✨"
                  },
                  {
                    step: "03",
                    title: "Use & Share",
                    description: "Your Garliq Card is live. Use it instantly, share it with anyone, watch others fork and improve it",
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
                  <Zap className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-bold text-white mb-2">Average Creation Time</p>
                    <p className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                      3 Minutes
                    </p>
                    <p className="text-xs text-gray-500 mt-2">From idea to running application</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <ThoughtToExecutionDemo />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Use Cases Showcase */}
      <div className="relative py-32 px-6 bg-gradient-to-b from-black via-purple-950/10 to-black">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-block mb-6">
              <span className="px-6 py-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-full text-sm font-bold text-orange-300 backdrop-blur-sm">
                🎯 Infinite Possibilities
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              From Simple Games to
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                Complex Applications
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Every Garliq Card solves a real problem. Create utilities for yourself, share with your community, or discover what others have built.
            </p>
          </motion.div>

          <AnimatedCardShowcase />

          {/* Category Pills */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-3 mt-16"
          >
            {[
              "🎮 Games", 
              "💰 Finance Tools", 
              "📚 Education", 
              "🏋️ Health & Fitness",
              "🎨 Creative Tools",
              "⏱️ Productivity",
              "🤖 AI Assistants",
              "📊 Data Visualizers",
              "🔐 Utilities",
              "🌐 Web Tools"
            ].map((category, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.1 }}
                className="px-5 py-2.5 bg-gray-900/50 hover:bg-gray-800/80 border border-gray-800 hover:border-purple-500/50 rounded-full text-sm font-medium transition-all cursor-pointer backdrop-blur-sm"
              >
                {category}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Who It's For */}
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
            <p className="text-xl text-gray-400">
              No matter your role or technical skill, Garliq empowers you to create
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                emoji: "👨‍🏫",
                title: "Teachers",
                description: "Create interactive quizzes, flashcards, and learning games instantly"
              },
              {
                emoji: "💼",
                title: "Business Owners",
                description: "Build custom calculators, booking forms, and client tools"
              },
              {
                emoji: "🎨",
                title: "Creators",
                description: "Design audience engagement tools, polls, and interactive content"
              },
              {
                emoji: "👤",
                title: "Everyone Else",
                description: "From students to hobbyists — if you have a need, create a card"
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
                Start Creating
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                  Your First Card
                </span>
              </h2>
              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                Join the new era of software creation. Turn your thoughts into utilities. Share them with the world. Watch them evolve.
              </p>
              
              <Link href="/auth">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-12 py-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-xl overflow-hidden shadow-2xl"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Create Free Garliq Card Now
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
                  Pay per Token Usage Only
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Vast Library of Free Garliq Cards
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Start creating in seconds
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
                <p className="text-sm text-gray-600">Micro-Application Creation Platform</p>
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
            <p className="mb-2">© 2025 Garliq by Parasync Technologies. Building the future of micro-applications.</p>
            <p>
              Need help? <a href="mailto:team@parasync.in" className="text-purple-400 hover:text-purple-300 underline">team@parasync.in</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}