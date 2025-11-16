'use client';
import { motion } from 'framer-motion';
import { FileText, Scale, AlertTriangle, Shield, UserX, DollarSign, Mail, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function TermsOfService() {
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
            <a href="/#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="/#how-it-works" className="text-gray-400 hover:text-white transition-colors">How It Works</a>
            <a href="/#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a>
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
      <div className="relative px-6 pt-20 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block mb-6"
          >
            <span className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-sm font-semibold text-purple-400">
              Legal Information
            </span>
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Terms of Service
          </h1>
          
          <p className="text-base text-gray-400 mb-6 max-w-2xl mx-auto">
            Please read these terms carefully before using Garliq. By accessing our platform, you agree to be bound by these terms.
          </p>
          
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Last Updated: October 15, 2025
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-3 h-3" />
              Effective Date: October 15, 2025
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="relative px-6 py-8 border-y border-gray-900">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-gray-500 mb-4 font-semibold tracking-wider">QUICK NAVIGATION</p>
          <div className="grid md:grid-cols-3 gap-3">
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
                className="flex items-center gap-3 p-3 bg-black/30 backdrop-blur-sm border border-gray-800 rounded-lg hover:border-gray-700 transition-colors group"
              >
                <item.icon className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span className="text-xs text-gray-300">{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative py-16 px-6">
        <div className="max-w-4xl mx-auto">
          
          {/* Introduction */}
          <section className="mb-12">
            <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-6">
              <h2 className="text-2xl font-bold mb-3 text-white">Agreement to Terms</h2>
              <p className="text-sm text-gray-300 leading-relaxed mb-3">
                These Terms of Service ("Terms") constitute a legally binding agreement between you and Parasync Technologies 
                ("Garliq," "we," "us," or "our") governing your access to and use of the Garliq AI-powered learning platform, 
                including our website, services, and applications (collectively, the "Service").
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">
                <strong className="text-white">BY ACCESSING OR USING THE SERVICE, YOU AGREE TO BE BOUND BY THESE TERMS.</strong> 
                If you do not agree to these Terms, do not access or use the Service.
              </p>
            </div>
          </section>

          {/* Acceptance of Terms */}
          <section id="acceptance" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <FileText className="w-6 h-6 text-purple-400" />
              1. Acceptance of Terms
            </h2>
            
            <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <p className="text-sm text-gray-300 mb-3">
                By creating an account, accessing, or using the Service, you represent and warrant that:
              </p>
              <ul className="space-y-2 text-sm text-gray-300">
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
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
            
            <div className="space-y-4">
              <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <h3 className="text-base font-bold mb-3 text-purple-300">2.1 Platform Features</h3>
                <p className="text-sm text-gray-300 mb-3">
                  Garliq is an AI-powered learning platform that enables users to create personalized courses and interactive simulations. Features include:
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>AI-generated courses with embedded videos, graphs, and interactive elements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Interactive simulations with controllable parameters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>AI chatbot embedded in every course and simulation for instant Q&A</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Course sharing and community access features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>HTML iframe-based course viewer with rich media integration</span>
                  </li>
                </ul>
              </div>

              <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <h3 className="text-base font-bold mb-3 text-purple-300">2.2 Service Availability</h3>
                <p className="text-sm text-gray-300">
                  We strive to provide continuous availability but do not guarantee uninterrupted access. 
                  The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control. 
                  We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time.
                </p>
              </div>
            </div>
          </section>

          {/* User Accounts */}
          <section id="accounts" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Shield className="w-6 h-6 text-pink-400" />
              3. User Accounts and Security
            </h2>
            
            <div className="space-y-4">
              <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <h3 className="text-base font-bold mb-3 text-pink-300">3.1 Account Registration</h3>
                <ul className="space-y-2 text-sm text-gray-300">
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

              <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <h3 className="text-base font-bold mb-3 text-pink-300">3.2 Account Security</h3>
                <p className="text-sm text-gray-300 mb-3">You are responsible for:</p>
                <ul className="space-y-2 text-sm text-gray-300">
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
              </div>
            </div>
          </section>

          {/* Payment Terms */}
          <section id="payment" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-green-400" />
              4. Payment Terms and Subscriptions
            </h2>
            
            <div className="space-y-4">
              <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <h3 className="text-base font-bold mb-3 text-green-300">4.1 Subscription Model</h3>
                <p className="text-sm text-gray-300 mb-3">
                  Garliq offers a subscription-based service at $3/month with a 7-day free trial including 500,000 tokens.
                </p>
              </div>

              <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <h3 className="text-base font-bold mb-3 text-green-300">4.2 Subscription Terms</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span><strong>Billing:</strong> Subscriptions are billed monthly in advance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span><strong>Auto-Renewal:</strong> Subscriptions automatically renew unless cancelled before the renewal date</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span><strong>Token System:</strong> Additional tokens can be purchased as needed for course and simulation generation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span><strong>Price Changes:</strong> We may change subscription prices with 30 days' advance notice</span>
                  </li>
                </ul>
              </div>

              <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <h3 className="text-base font-bold mb-3 text-green-300">4.3 Refund Policy</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span>Refunds are provided at our sole discretion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span>No refunds for partial subscription periods</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span>Request refunds within 14 days via email to team@parasync.in</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* User Content and Ownership */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">5. User Content and Intellectual Property</h2>
            
            <div className="space-y-4">
              <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <h3 className="text-base font-bold mb-3 text-purple-300">5.1 Your Content</h3>
                <p className="text-sm text-gray-300 mb-3">
                  You retain ownership of all content you create, including courses, simulations, and learning materials generated using the Service.
                </p>
              </div>

              <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <h3 className="text-base font-bold mb-3 text-purple-300">5.2 License to Garliq</h3>
                <p className="text-sm text-gray-300 mb-3">
                  By creating content, you grant Garliq a worldwide, non-exclusive, royalty-free license to:
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Host, store, and display your content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Process content to provide the Service</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Use anonymized data to improve AI models</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Display publicly shared courses in our platform</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Prohibited Uses */}
          <section id="prohibited" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              6. Prohibited Uses and Conduct
            </h2>
            
            <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <p className="text-sm text-gray-300 mb-3">You agree NOT to:</p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Violate any applicable laws or third-party rights</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Create courses containing illegal, harmful, or offensive content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Harass, abuse, or harm other users</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Distribute malware or malicious code</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Attempt unauthorized access to the Service</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Use automated tools to scrape or data mine</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Circumvent usage limits or restrictions</span>
                </li>
              </ul>
            </div>
          </section>

          {/* DMCA */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">7. Copyright and DMCA Policy</h2>
            
            <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <p className="text-sm text-gray-300 mb-3">
                We respect intellectual property rights. For copyright infringement claims, contact <a href="mailto:team@parasync.in" className="text-purple-400 hover:text-purple-300 underline">team@parasync.in</a> with:
              </p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Identification of the copyrighted work</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Location of infringing material (URL)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Your contact information and signature</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Termination */}
          <section id="termination" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <UserX className="w-6 h-6 text-pink-400" />
              8. Termination and Suspension
            </h2>
            
            <div className="space-y-4">
              <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <h3 className="text-base font-bold mb-3 text-pink-300">8.1 Your Right to Terminate</h3>
                <p className="text-sm text-gray-300">
                  You may terminate your account at any time by contacting team@parasync.in. Termination does not entitle you to refunds.
                </p>
              </div>

              <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <h3 className="text-base font-bold mb-3 text-pink-300">8.2 Our Right to Terminate</h3>
                <p className="text-sm text-gray-300 mb-3">
                  We may suspend or terminate your account for:
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-pink-400 mt-1">•</span>
                    <span>Violation of these Terms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-400 mt-1">•</span>
                    <span>Suspected fraudulent or illegal activity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-400 mt-1">•</span>
                    <span>Non-payment of fees</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Disclaimers */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">9. Disclaimers and Warranties</h2>
            
            <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <p className="text-sm text-gray-300 mb-3 font-bold">
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.
              </p>
              <p className="text-sm text-gray-300">
                We disclaim all warranties including merchantability, fitness for a particular purpose, and accuracy of AI-generated content. 
                You use the Service at your own risk.
              </p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">10. Limitation of Liability</h2>
            
            <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <p className="text-sm text-gray-300 mb-3">
                Garliq shall not be liable for indirect, incidental, or consequential damages. Our total liability shall not exceed 
                the amount you paid in the 12 months preceding the claim, or $100, whichever is greater.
              </p>
            </div>
          </section>

          {/* Dispute Resolution */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">11. Dispute Resolution and Governing Law</h2>
            
            <div className="space-y-4">
              <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <h3 className="text-base font-bold mb-3 text-purple-300">11.1 Governing Law</h3>
                <p className="text-sm text-gray-300">
                  These Terms are governed by the laws of India.
                </p>
              </div>

              <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <h3 className="text-base font-bold mb-3 text-purple-300">11.2 Dispute Resolution</h3>
                <p className="text-sm text-gray-300">
                  Contact team@parasync.in for informal resolution. Unresolved disputes shall be resolved through arbitration in Bengaluru, India.
                </p>
              </div>
            </div>
          </section>

          {/* Miscellaneous */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">12. Miscellaneous Provisions</h2>
            
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-bold mb-2 text-purple-300">Entire Agreement</h3>
                <p className="text-xs text-gray-300">
                  These Terms constitute the entire agreement between you and Garliq.
                </p>
              </div>

              <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-bold mb-2 text-purple-300">Modifications</h3>
                <p className="text-xs text-gray-300">
                  We may modify these Terms with notice. Continued use constitutes acceptance.
                </p>
              </div>

              <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-bold mb-2 text-purple-300">Severability</h3>
                <p className="text-xs text-gray-300">
                  If any provision is unenforceable, remaining provisions remain in effect.
                </p>
              </div>

              <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-bold mb-2 text-purple-300">Assignment</h3>
                <p className="text-xs text-gray-300">
                  You may not transfer your rights. We may assign ours without restriction.
                </p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section id="contact" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Mail className="w-6 h-6 text-purple-400" />
              13. Contact Information
            </h2>
            
            <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <p className="text-sm text-gray-300 mb-4">
                For questions or concerns regarding these Terms:
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-purple-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white">Email</p>
                    <a href="mailto:team@parasync.in" className="text-sm text-purple-400 hover:text-purple-300 underline">
                      team@parasync.in
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-purple-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white">Legal Entity</p>
                    <p className="text-sm text-gray-400">Parasync Technologies</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

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
              <Link href="/auth" className="hover:text-white transition-colors">
                Get Started
              </Link>
              <a href="/#features" className="hover:text-white transition-colors">
                Features
              </a>
              <a href="/#pricing" className="hover:text-white transition-colors">
                Pricing
              </a>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contact
              </Link>
              <Link href="/privacy-policy" className="hover:text-white transition-colors">
                Privacy
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