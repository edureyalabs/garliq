'use client';
import { motion } from 'framer-motion';
import { MessageCircle, FileQuestion, Clock, Send, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        setError(result.error || 'Failed to submit. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to submit. Please try emailing us directly at team@parasync.in');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-sm font-semibold text-purple-400 mb-6">
              We're here to help
            </div>
          </motion.div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Get in Touch
          </h1>
          
          <p className="text-xl text-gray-400">
            Have questions? Need support? Reach out and we'll respond within 24-48 hours.
          </p>
        </div>
      </div>

      {/* Contact Form and Quick Help */}
      <div className="relative py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
                <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:border-gray-700 focus:outline-none transition-colors text-white"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      maxLength={200}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:border-gray-700 focus:outline-none transition-colors text-white"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">
                      Subject
                    </label>
                    <select
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:border-gray-700 focus:outline-none transition-colors text-white"
                    >
                      <option value="">Select a subject</option>
                      <option value="support">Technical Support</option>
                      <option value="billing">Billing & Payments</option>
                      <option value="feature">Feature Request</option>
                      <option value="bug">Bug Report</option>
                      <option value="partnership">Partnership Inquiry</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">
                      Message
                    </label>
                    <textarea
                      required
                      maxLength={1000}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:border-gray-700 focus:outline-none transition-colors text-white resize-none"
                      placeholder="Tell us how we can help..."
                    />
                    <p className="text-xs text-gray-600 mt-1">{formData.message.length}/1000 characters</p>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
                    >
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <p className="text-sm text-red-400">{error}</p>
                    </motion.div>
                  )}

                  {submitted ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
                    >
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <p className="text-sm text-green-400">Message sent! We'll respond within 24-48 hours.</p>
                    </motion.div>
                  ) : (
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                      className="w-full py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </motion.button>
                  )}

                  <p className="text-xs text-gray-500 text-center">
                    Or email us directly at{' '}
                    <a href="mailto:team@parasync.in" className="text-white hover:text-gray-300 underline">
                      team@parasync.in
                    </a>
                  </p>
                </form>
              </div>
            </motion.div>

            {/* Quick Help & FAQs */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
                <h2 className="text-2xl font-bold mb-6">Common Questions</h2>

                <div className="space-y-6">
                  {[
                    {
                      question: 'How do I create my first course?',
                      answer: 'Sign up, describe what you want to learn in natural language, and our AI will generate a complete course in about 3 minutes.'
                    },
                    {
                      question: 'What does the free trial include?',
                      answer: '7 days of full platform access plus 500,000 tokens to create courses and simulations. No credit card required.'
                    },
                    {
                      question: 'Can I share my courses?',
                      answer: 'Yes! Every course gets a unique URL. Share it with anyone and they can access it instantly.'
                    },
                    {
                      question: 'How does the AI chatbot work?',
                      answer: 'Every course and simulation includes an embedded AI that answers questions about the content in real-time.'
                    },
                    {
                      question: 'How do I report a bug?',
                      answer: 'Use the contact form with "Bug Report" as the subject, or email us with detailed steps to reproduce the issue.'
                    }
                  ].map((faq, i) => (
                    <div
                      key={i}
                      className="border-b border-gray-800 pb-6 last:border-0"
                    >
                      <h3 className="font-bold text-white mb-2 text-sm">{faq.question}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Support Hours */}
              <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  Support Hours
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center text-gray-400">
                    <span>Monday - Friday</span>
                    <span className="font-semibold text-white">9:00 AM - 6:00 PM IST</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-400">
                    <span>Saturday</span>
                    <span className="font-semibold text-white">10:00 AM - 4:00 PM IST</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-400">
                    <span>Sunday</span>
                    <span className="font-semibold text-gray-600">Closed</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-800">
                    Email support available 24/7. We respond to all inquiries within 24-48 hours.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

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
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
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
          </div>

          <div className="mt-8 pt-8 border-t border-gray-900 text-center text-sm text-gray-600">
            <p>© 2025 Garliq by Parasync Technologies. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}