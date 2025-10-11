'use client';
import { motion} from 'framer-motion';
import { Zap, Brain, ChevronRight, Globe } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Landing() {
  const [mounted, setMounted] = useState(false);
  

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1, type: 'spring' }}
            className="relative inline-block mb-8"
          >
            <motion.div
              animate={{ 
                y: [-10, 10, -10],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="text-9xl filter drop-shadow-2xl"
            >
              🧄
            </motion.div>
            <div className="absolute inset-0 blur-3xl bg-purple-500/30 animate-pulse" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-7xl md:text-9xl font-black mb-6 leading-none">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 animate-gradient">
                Garliq
              </span>
            </h1>
            
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-purple-500" />
              <p className="text-xl md:text-2xl text-gray-400 font-mono uppercase tracking-wider">
                Vibe Coding Protocol
              </p>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-pink-500" />
            </div>

            <h2 className="text-3xl md:text-5xl font-bold mb-8 text-gray-300 max-w-4xl mx-auto leading-tight">
              Where Software Creation Becomes{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                A Social Experience
              </span>
            </h2>

            <p className="text-lg md:text-xl text-gray-500 mb-12 max-w-3xl mx-auto">
              Every scroll reveals a new interactive universe. AI agents craft full-stack applications 
              while you watch. Share living websites, not static code. Discover, interact, remix. 
              The camera revolutionized visual content—we're doing it for software.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link href="/auth">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-bold text-lg overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Launch Console
                    <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                </motion.button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-8 border-t border-gray-800">
              {[
                { value: '100K+', label: 'Apps Generated' },
                { value: '<2s', label: 'Deploy Time' },
                { value: 'Live', label: 'Multi-Page Apps' }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <div className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500 font-mono">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h3 className="text-5xl md:text-6xl font-black mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                Built Different
              </span>
            </h3>
            <p className="text-xl text-gray-500">The only platform where posts are actual running applications</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: 'AI Agent Orchestration',
                desc: 'CrewAI-powered agents build multi-page applications with navigation, state management, and database integration - not just single HTML files',
                gradient: 'from-purple-500 to-pink-500'
              },
              {
                icon: Zap,
                title: 'Git-Style Version Control',
                desc: 'Commit changes, push updates live, roll back versions. Every iteration is tracked. One-click deployment updates all shared instances instantly',
                gradient: 'from-pink-500 to-orange-500'
              },
              {
                icon: Globe,
                title: 'Social Software Marketplace',
                desc: 'Share live apps to feed. Users interact with actual websites, not previews. Like, comment, fork, purchase. Software discovery meets social engagement',
                gradient: 'from-orange-500 to-purple-500'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                whileHover={{ y: -10 }}
                className="group relative p-8 rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 hover:border-purple-500/50 transition-all"
              >
                <div className={`inline-block p-4 rounded-xl bg-gradient-to-br ${feature.gradient} mb-6`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-2xl font-bold mb-3">{feature.title}</h4>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section - NEW */}
      <div className="relative py-32 px-6 bg-gradient-to-b from-black via-purple-950/10 to-black">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h3 className="text-5xl md:text-6xl font-black mb-4">
              From Thought to{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                Live Application
              </span>
            </h3>
            <p className="text-xl text-gray-500">In seconds, not hours</p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 opacity-20" />
            
            {[
              { step: '01', title: 'Describe Your Vision', desc: 'Natural language prompts. No code required. Tell us what you want to build.' },
              { step: '02', title: 'AI Agents Build', desc: 'Multi-agent orchestration creates pages, navigation, styling, and logic in real-time.' },
              { step: '03', title: 'Version & Iterate', desc: 'Commit changes. Make updates. AI maintains context. Full history tracked like Git.' },
              { step: '04', title: 'Share & Monetize', desc: 'Publish to feed. Users interact live. Fork for remixes. Set price for premium features.' }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                <div className="relative z-10 bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 h-full">
                  <div className="text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 opacity-20">
                    {item.step}
                  </div>
                  <h4 className="text-xl font-bold mb-3">{item.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Tech Stack Section */}
      <div className="relative py-32 px-6 bg-gradient-to-b from-black to-purple-950/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h3 className="text-5xl md:text-6xl font-black mb-4">
              Enterprise-Grade
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400"> Infrastructure</span>
            </h3>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Llama 3.3 70B', desc: 'Meta AI Model' },
              { name: 'Groq LPU™', desc: 'AI Inference Chip' },
              { name: 'CrewAI', desc: 'Agent Orchestration' },
              { name: 'Next.js 15', desc: 'React Framework' },
              { name: 'Supabase', desc: 'Realtime Backend' },
              { name: 'PostgreSQL', desc: 'Database Engine' },
              { name: 'Vercel Edge', desc: 'Global CDN' },
              { name: 'Tailwind CSS', desc: 'Styling System' }
            ].map((tech, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-xl bg-black/50 border border-gray-800 backdrop-blur-sm hover:border-purple-500/50 transition-colors"
              >
                <div className="text-2xl font-black mb-2 text-purple-400">{tech.name}</div>
                <div className="text-sm text-gray-500 font-mono">{tech.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-12 rounded-3xl bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 backdrop-blur-xl"
          >
            <h3 className="text-5xl font-black mb-6">The Future Doesn't Wait</h3>
            <p className="text-xl text-gray-400 mb-8">
              Join thousands creating the next generation of web experiences. 
              Where every idea becomes an instant reality.
            </p>
            <Link href="/auth">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-bold text-lg"
              >
                Start Creating Free
              </motion.button>
            </Link>
            <p className="text-sm text-gray-600 mt-4">No credit card required • Deploy in seconds</p>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative border-t border-gray-900 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-gray-600 text-sm">
          <p>© 2025 Garliq. Built with 🧄 for the vibe coders.</p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}