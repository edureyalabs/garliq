'use client';
import { motion } from 'framer-motion';
import { FileText, Scale, AlertTriangle, Shield, UserX, DollarSign, Mail, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function TermsOfService() {
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
            <Scale className="w-12 h-12 text-purple-400" />
          </motion.div>
          
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            Terms of <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">Service</span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-8">
            Please read these terms carefully before using Garliq. By accessing our platform, you agree to be bound by these terms.
          </p>
          
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Last Updated: October 15, 2025
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Effective Date: October 15, 2025
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="relative py-8 px-6 border-y border-gray-900">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-gray-500 mb-4 font-semibold">QUICK NAVIGATION</p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: FileText, label: 'Acceptance of Terms', href: '#acceptance' },
              { icon: Shield, label: 'User Accounts', href: '#accounts' },
              { icon: DollarSign, label: 'Payment Terms', href: '#payment' },
              { icon: AlertTriangle, label: 'Prohibited Uses', href: '#prohibited' },
              { icon: UserX, label: 'Termination', href: '#termination' },
              { icon: Mail, label: 'Contact Us', href: '#contact' }
            ].map((item, i) => (
              <a
                key={i}
                href={item.href}
                className="flex items-center gap-3 p-4 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-purple-500/50 transition-colors group"
              >
                <item.icon className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm text-gray-300">{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-invert prose-purple max-w-none">
            
            {/* Introduction */}
            <section className="mb-16">
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-8 mb-8">
                <h2 className="text-3xl font-bold mb-4 text-white">Agreement to Terms</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  These Terms of Service ("Terms") constitute a legally binding agreement between you and ParaSync Technologies 
                  ("Garliq," "we," "us," or "our") governing your access to and use of the Garliq micro-application generation 
                  platform, including our website, services, and applications (collectively, the "Service").
                </p>
                <p className="text-gray-300 leading-relaxed">
                  <strong className="text-white">BY ACCESSING OR USING THE SERVICE, YOU AGREE TO BE BOUND BY THESE TERMS.</strong> 
                  If you do not agree to these Terms, do not access or use the Service.
                </p>
              </div>
            </section>

            {/* Acceptance of Terms */}
            <section id="acceptance" className="mb-16 scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <FileText className="w-8 h-8 text-purple-400" />
                1. Acceptance of Terms
              </h2>
              
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <p className="text-gray-300 mb-4">
                  By creating an account, accessing, or using the Service, you represent and warrant that:
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>You are at least 13 years old (or 16 in the European Economic Area)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>You have the legal capacity to enter into binding contracts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>You will comply with these Terms and all applicable laws</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>All information you provide is accurate, current, and complete</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Service Description */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6">2. Description of Service</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-3 text-purple-300">2.1 Platform Features</h3>
                  <p className="text-gray-300 mb-3">
                    Garliq is a micro-application generation platform that enables users to create fully-functional, 
                    interactive web applications through natural language conversation with AI. Features include:
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>AI-powered micro-app generation from natural language descriptions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Real-time interactive application creation (typically 25-35 seconds)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Instant sharing via unique URLs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Fork and customize functionality for existing micro-apps</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Version control and iteration capabilities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Collaboration and multi-user access features</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-3 text-purple-300">2.2 Service Availability</h3>
                  <p className="text-gray-300">
                    We strive to provide continuous availability but do not guarantee uninterrupted access. 
                    The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control. 
                    We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time.
                  </p>
                </div>
              </div>
            </section>

            {/* User Accounts */}
            <section id="accounts" className="mb-16 scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Shield className="w-8 h-8 text-pink-400" />
                3. User Accounts and Security
              </h2>
              
              <div className="space-y-6">
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-3 text-pink-300">3.1 Account Registration</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-pink-400 mt-1">•</span>
                      <span>You must create an account to access certain features</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-400 mt-1">•</span>
                      <span>Provide accurate and complete registration information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-400 mt-1">•</span>
                      <span>Maintain and promptly update your account information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-400 mt-1">•</span>
                      <span>One person or legal entity may maintain only one account</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-3 text-pink-300">3.2 Account Security</h3>
                  <p className="text-gray-300 mb-3">You are responsible for:</p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-pink-400 mt-1">•</span>
                      <span>Maintaining the confidentiality of your password and account credentials</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-400 mt-1">•</span>
                      <span>All activities that occur under your account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-400 mt-1">•</span>
                      <span>Immediately notifying us of unauthorized access or security breaches</span>
                    </li>
                  </ul>
                  <p className="text-gray-400 text-sm mt-3">
                    We are not liable for losses resulting from unauthorized use of your account.
                  </p>
                </div>
              </div>
            </section>

            {/* Payment Terms */}
            <section id="payment" className="mb-16 scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-orange-400" />
                4. Payment Terms and Subscriptions
              </h2>
              
              <div className="space-y-6">
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-3 text-orange-300">4.1 Free and Paid Services</h3>
                  <p className="text-gray-300 mb-3">
                    Garliq offers both free and paid subscription tiers. Free tier limitations and paid tier features 
                    are described on our pricing page and may change at our discretion.
                  </p>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-3 text-orange-300">4.2 Subscription Terms</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-1">•</span>
                      <span><strong>Billing:</strong> Subscriptions are billed in advance on a recurring basis (monthly or annually)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-1">•</span>
                      <span><strong>Auto-Renewal:</strong> Subscriptions automatically renew unless cancelled before the renewal date</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-1">•</span>
                      <span><strong>Payment Methods:</strong> We accept payment via Razorpay and other designated payment processors</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-1">•</span>
                      <span><strong>Price Changes:</strong> We may change subscription prices with 30 days' advance notice</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-3 text-orange-300">4.3 Refund Policy</h3>
                  <p className="text-gray-300 mb-3">
                    Refunds are provided at our sole discretion. Generally:
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-1">•</span>
                      <span>No refunds for partial subscription periods</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-1">•</span>
                      <span>Technical issues may qualify for pro-rated refunds</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-1">•</span>
                      <span>Request refunds within 14 days of charge via email to team@parasync.in</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-3 text-orange-300">4.4 Taxes</h3>
                  <p className="text-gray-300">
                    You are responsible for all applicable taxes. Prices displayed do not include taxes unless specified. 
                    We will add applicable taxes to your invoice where required by law.
                  </p>
                </div>
              </div>
            </section>

            {/* User Content and Ownership */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6">5. User Content and Intellectual Property</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-3 text-purple-300">5.1 Your Content</h3>
                  <p className="text-gray-300 mb-3">
                    You retain ownership of all content you create, upload, or generate using the Service ("User Content"), including:
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Prompts and descriptions provided to the AI</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Micro-applications generated through the platform</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Modifications, customizations, and iterations</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-3 text-purple-300">5.2 License to Garliq</h3>
                  <p className="text-gray-300 mb-3">
                    By creating or uploading User Content, you grant Garliq a worldwide, non-exclusive, royalty-free license to:
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Host, store, and display your User Content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Process and transmit User Content as necessary to provide the Service</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Use anonymized and aggregated data to improve our AI models</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Display publicly shared micro-apps in our gallery and marketplace</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-3 text-purple-300">5.3 Garliq's Intellectual Property</h3>
                  <p className="text-gray-300">
                    The Service, including its software, design, trademarks, and underlying technology, is owned by Garliq 
                    and protected by intellectual property laws. You may not copy, modify, distribute, or reverse engineer 
                    any part of the Service without express written permission.
                  </p>
                </div>
              </div>
            </section>

            {/* Prohibited Uses */}
            <section id="prohibited" className="mb-16 scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-red-400" />
                6. Prohibited Uses and Conduct
              </h2>
              
              <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl p-6">
                <p className="text-gray-300 mb-4">You agree NOT to:</p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>Violate any applicable laws, regulations, or third-party rights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>Create micro-apps that contain illegal, harmful, or offensive content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>Harass, abuse, or harm other users</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>Impersonate any person or entity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>Distribute malware, viruses, or malicious code</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>Attempt to gain unauthorized access to the Service or other users' accounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>Scrape, data mine, or use automated tools to access the Service</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>Interfere with or disrupt the Service or servers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>Use the Service to create spam, phishing, or deceptive content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>Circumvent any usage limits or restrictions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>Resell or redistribute the Service without authorization</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* DMCA and Copyright */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6">7. Copyright and DMCA Policy</h2>
              
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <p className="text-gray-300 mb-4">
                  We respect intellectual property rights. If you believe content on our platform infringes your copyright, 
                  please send a DMCA notice to <a href="mailto:team@parasync.in" className="text-purple-400 hover:text-purple-300 underline">team@parasync.in</a> including:
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Identification of the copyrighted work</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Location of the infringing material (URL)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Your contact information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>A statement of good faith belief</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Electronic or physical signature</span>
                  </li>
                </ul>
                <p className="text-gray-400 text-sm mt-4">
                  We will investigate and remove infringing content in accordance with the Digital Millennium Copyright Act (DMCA).
                </p>
              </div>
            </section>

            {/* Termination */}
            <section id="termination" className="mb-16 scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <UserX className="w-8 h-8 text-pink-400" />
                8. Termination and Suspension
              </h2>
              
              <div className="space-y-6">
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-3 text-pink-300">8.1 Your Right to Terminate</h3>
                  <p className="text-gray-300">
                    You may terminate your account at any time by contacting us at team@parasync.in or using account settings. 
                    Termination does not entitle you to a refund of any fees already paid.
                  </p>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-3 text-pink-300">8.2 Our Right to Terminate</h3>
                  <p className="text-gray-300 mb-3">
                    We reserve the right to suspend or terminate your account and access to the Service immediately, 
                    without prior notice, for:
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-pink-400 mt-1">•</span>
                      <span>Violation of these Terms</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-400 mt-1">•</span>
                      <span>Suspected fraudulent, abusive, or illegal activity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-400 mt-1">•</span>
                      <span>Non-payment of fees</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-400 mt-1">•</span>
                      <span>Extended periods of inactivity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-400 mt-1">•</span>
                      <span>At our sole discretion for any reason</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-pink-500/10 to-red-500/10 border border-pink-500/30 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-3 text-pink-300">8.3 Effect of Termination</h3>
                  <p className="text-gray-300">
                    Upon termination, your right to access the Service ceases immediately. We may delete your account 
                    and User Content, though publicly shared micro-apps may remain accessible. Provisions of these Terms 
                    that should survive termination will remain in effect.
                  </p>
                </div>
              </div>
            </section>

            {/* Disclaimers */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6">9. Disclaimers and Warranties</h2>
              
              <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6">
                <p className="text-gray-300 mb-4 uppercase font-bold">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND.
                </p>
                <p className="text-gray-300 mb-3">
                  To the fullest extent permitted by law, we disclaim all warranties, express or implied, including:
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-1">•</span>
                    <span>Merchantability, fitness for a particular purpose, and non-infringement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-1">•</span>
                    <span>Uninterrupted, secure, or error-free operation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-1">•</span>
                    <span>Accuracy, reliability, or quality of content generated by AI</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-1">•</span>
                    <span>Freedom from viruses or harmful components</span>
                  </li>
                </ul>
                <p className="text-gray-400 text-sm mt-4">
                  You use the Service at your own risk. We do not guarantee specific results or outcomes.
                </p>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6">10. Limitation of Liability</h2>
              
              <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl p-6">
                <p className="text-gray-300 mb-4 uppercase font-bold">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW:
                </p>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>
                      <strong>No Liability for Damages:</strong> Garliq shall not be liable for any indirect, incidental, 
                      special, consequential, or punitive damages, including lost profits, data loss, or business interruption.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>
                      <strong>Maximum Liability:</strong> Our total liability for all claims related to the Service 
                      shall not exceed the amount you paid us in the 12 months preceding the claim, or $100, whichever is greater.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>
                      <strong>Third-Party Content:</strong> We are not responsible for content created by users or 
                      generated by AI models.
                    </span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Indemnification */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6">11. Indemnification</h2>
              
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <p className="text-gray-300">
                  You agree to indemnify, defend, and hold harmless Garliq, its affiliates, officers, directors, employees, 
                  and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
                </p>
                <ul className="space-y-2 text-gray-300 mt-4">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Your use or misuse of the Service</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Your User Content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Violation of these Terms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Violation of any law or third-party rights</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Dispute Resolution */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6">12. Dispute Resolution and Governing Law</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-3 text-purple-300">12.1 Governing Law</h3>
                  <p className="text-gray-300">
                    These Terms are governed by and construed in accordance with the laws of India, 
                    without regard to conflict of law principles.
                  </p>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-3 text-purple-300">12.2 Dispute Resolution</h3>
                  <p className="text-gray-300 mb-3">
                    For any disputes, you agree to first contact us at team@parasync.in to seek informal resolution. 
                    If unresolved within 30 days:
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Disputes shall be resolved through binding arbitration in Bengaluru, Karnataka, India</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>The arbitration shall be conducted in English</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Each party bears its own costs unless otherwise awarded</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Miscellaneous */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6">13. Miscellaneous Provisions</h2>
              
              <div className="space-y-4">
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-2 text-purple-300">13.1 Entire Agreement</h3>
                  <p className="text-gray-300 text-sm">
                    These Terms, along with our Privacy Policy, constitute the entire agreement between you and Garliq.
                  </p>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-2 text-purple-300">13.2 Modifications</h3>
                  <p className="text-gray-300 text-sm">
                    We may modify these Terms at any time. Material changes will be notified via email or platform notice. 
                    Continued use after changes constitutes acceptance.
                  </p>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-2 text-purple-300">13.3 Severability</h3>
                  <p className="text-gray-300 text-sm">
                    If any provision is found unenforceable, the remaining provisions remain in full effect.
                  </p>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-2 text-purple-300">13.4 Waiver</h3>
                  <p className="text-gray-300 text-sm">
                    Failure to enforce any provision does not constitute a waiver of that provision.
                  </p>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-2 text-purple-300">13.5 Assignment</h3>
                  <p className="text-gray-300 text-sm">
                    You may not transfer your rights under these Terms. We may assign our rights without restriction.
                  </p>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section id="contact" className="mb-16 scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Mail className="w-8 h-8 text-purple-400" />
                14. Contact Information
              </h2>
              
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-8">
                <p className="text-gray-300 mb-6">
                  For questions, concerns, or notices regarding these Terms of Service:
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-purple-400 mt-1" />
                    <div>
                      <p className="font-semibold text-white">Email</p>
                      <a href="mailto:team@parasync.in" className="text-purple-400 hover:text-purple-300 underline">
                        team@parasync.in
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-purple-400 mt-1" />
                    <div>
                      <p className="font-semibold text-white">Legal Entity</p>
                      <p className="text-gray-400">ParaSync Technologies</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-purple-400 mt-1" />
                    <div>
                      <p className="font-semibold text-white">Response Time</p>
                      <p className="text-gray-400">We aim to respond within 48-72 hours</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </div>
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
              <Link href="/contact" className="hover:text-purple-400 transition-colors">
                Contact
              </Link>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-900 text-center text-gray-600 text-sm">
            <p>© 2025 Garliq by ParaSync Technologies. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}