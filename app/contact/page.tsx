'use client';
import { motion } from 'framer-motion';
import { Mail, MessageCircle, FileQuestion, Clock, MapPin, Send, CheckCircle, AlertCircle } from 'lucide-react';
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
        setFormData({ name: '', email: '', subject: '', message: '' }); // Clear form
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
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* Header */}
      <header className="relative border-b border-gray-900 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="group-hover:scale-110 transition-transform">
              <Image 
                src="/logo.png" 
                alt="Garliq" 
                width={48} 
                height={48}
              />
            </div>
            <div>
              <p className="font-bold text-white text-xl">Garliq</p>
              <p className="text-xs text-gray-500">Micro-App Platform</p>
            </div>
          </Link>
          <Link href="/auth">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold text-sm"
            >
              Get Started
            </motion.button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl mb-6"
          >
            <MessageCircle className="w-12 h-12 text-purple-400" />
          </motion.div>
          
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            Get in <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">Touch</span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-8">
            Have questions? Need support? We're here to help. Reach out to our team and we'll respond as soon as possible.
          </p>
        </div>
      </div>

      {/* Contact Methods */}
      <div className="relative py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: Mail,
                title: 'Email Support',
                description: 'Get help from our support team',
                contact: 'team@parasync.in',
                action: 'mailto:team@parasync.in',
                gradient: 'from-purple-500 to-purple-600'
              },
              {
                icon: Clock,
                title: 'Response Time',
                description: 'We typically respond within',
                contact: '24-48 hours',
                action: null,
                gradient: 'from-pink-500 to-pink-600'
              },
              {
                icon: MapPin,
                title: 'Location',
                description: 'Based in',
                contact: 'Bengaluru, India',
                action: null,
                gradient: 'from-orange-500 to-orange-600'
              }
            ].map((method, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 text-center group hover:border-purple-500/50 transition-all"
              >
                <div className={`inline-block p-4 rounded-xl bg-gradient-to-br ${method.gradient} mb-6 group-hover:scale-110 transition-transform`}>
                  <method.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{method.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{method.description}</p>
                {method.action ? (
                  <a
                    href={method.action}
                    className="text-lg font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {method.contact}
                  </a>
                ) : (
                  <p className="text-lg font-semibold text-white">{method.contact}</p>
                )}
              </motion.div>
            ))}
          </div>

          {/* Contact Form and Quick Help */}
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  <Send className="w-8 h-8 text-purple-400" />
                  Send us a Message
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">
                      Your Name * <span className="text-xs text-gray-600">({formData.name.length}/100)</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl focus:border-purple-500 focus:outline-none transition-colors text-white"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">
                      Email Address * <span className="text-xs text-gray-600">({formData.email.length}/200)</span>
                    </label>
                    <input
                      type="email"
                      required
                      maxLength={200}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl focus:border-purple-500 focus:outline-none transition-colors text-white"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">
                      Subject *
                    </label>
                    <select
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl focus:border-purple-500 focus:outline-none transition-colors text-white"
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
                      Message * <span className="text-xs text-gray-600">({formData.message.length}/1000)</span>
                    </label>
                    <textarea
                      required
                      maxLength={1000}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl focus:border-purple-500 focus:outline-none transition-colors text-white resize-none"
                      placeholder="Tell us how we can help..."
                    />
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                    >
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <p className="text-red-400 font-semibold">{error}</p>
                    </motion.div>
                  )}

                  {submitted ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl"
                    >
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <p className="text-green-400 font-semibold">Message sent! We'll respond within 24-48 hours.</p>
                    </motion.div>
                  ) : (
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                      className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </motion.button>
                  )}

                  <p className="text-xs text-gray-600 text-center">
                    Or email us directly at{' '}
                    <a href="mailto:team@parasync.in" className="text-purple-400 hover:text-purple-300 underline">
                      team@parasync.in
                    </a>
                  </p>
                </form>
              </div>
            </motion.div>

            {/* Quick Help & FAQs */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 mb-8">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  <FileQuestion className="w-8 h-8 text-pink-400" />
                  Common Questions
                </h2>

                <div className="space-y-6">
                  {[
                    {
                      question: 'How do I create my first micro-app?',
                      answer: 'Simply sign up, describe what you want to build in natural language, and our AI will generate your micro-app in about 30 seconds.'
                    },
                    {
                      question: 'Is Garliq free to use?',
                      answer: 'Yes! We offer a free tier with generous limits. Premium features are available through paid subscriptions.'
                    },
                    {
                      question: 'Can I share my micro-apps?',
                      answer: 'Absolutely! Every micro-app gets a unique URL that you can share instantly. Others can view and even fork your apps.'
                    },
                    {
                      question: 'What if I need help with my account?',
                      answer: 'Email us at team@parasync.in and we\'ll respond within 24-48 hours. Include your account details for faster assistance.'
                    },
                    {
                      question: 'How do I report a bug?',
                      answer: 'Use the contact form above with "Bug Report" as the subject, or email us with detailed steps to reproduce the issue.'
                    }
                  ].map((faq, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="border-b border-gray-800 pb-6 last:border-0"
                    >
                      <h3 className="font-bold text-white mb-2">{faq.question}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">{faq.answer}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Support Hours */}
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                  <Clock className="w-6 h-6 text-purple-400" />
                  Support Hours
                </h3>
                <div className="space-y-3 text-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Monday - Friday</span>
                    <span className="text-sm font-semibold">9:00 AM - 6:00 PM IST</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Saturday</span>
                    <span className="text-sm font-semibold">10:00 AM - 4:00 PM IST</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Sunday</span>
                    <span className="text-sm font-semibold text-gray-500">Closed</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-800">
                    * Email support is available 24/7. We respond to all inquiries within 24-48 hours.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Additional Contact Info */}
      <div className="relative py-16 px-6 border-t border-gray-900">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 text-center"
          >
            <h2 className="text-3xl font-bold mb-4">Looking for Something Else?</h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Browse our documentation, check out our blog, or join our community to connect with other Garliq users.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/auth">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold"
                >
                  Get Started Free
                </motion.button>
              </Link>
              <a href="https://docs.garliq.com" target="_blank" rel="noopener noreferrer">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gray-800 border border-gray-700 hover:border-purple-500 rounded-xl font-semibold transition-colors"
                >
                  Documentation
                </motion.button>
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-gray-900 py-12 px-6">
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
                <p className="text-sm text-gray-600">Micro-App Generation Platform</p>
              </div>
            </div>
            
            <div className="flex gap-8 text-sm text-gray-500">
              <Link href="/" className="hover:text-purple-400 transition-colors">
                Home
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
            <p>© 2025 Garliq by ParaSync Technologies. All rights reserved.</p>
            <p className="mt-2">
              <a href="mailto:team@parasync.in" className="hover:text-purple-400 transition-colors">
                team@parasync.in
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}