'use client';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, UserCheck, Mail, Clock, AlertCircle, X, Linkedin } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function PrivacyPolicy() {
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
          
          <Link href="/auth">
            <button className="px-5 py-2 bg-white text-black rounded-lg font-semibold text-sm hover:bg-gray-200 transition-colors">
              Get Started
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl mb-6"
          >
            <Shield className="w-10 h-10 text-purple-400" />
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Privacy Policy
          </h1>
          
          <p className="text-base text-gray-400 mb-6 max-w-2xl mx-auto">
            Your privacy is important to us. This policy outlines how we collect, use, and protect your information.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Last Updated: October 15, 2025
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Effective Date: October 15, 2025
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="relative py-8 px-6 border-y border-gray-900">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-gray-500 mb-4 font-semibold uppercase tracking-wider">Quick Navigation</p>
          <div className="grid md:grid-cols-3 gap-3">
            {[
              { icon: Database, label: 'Information We Collect', href: '#collection' },
              { icon: Lock, label: 'How We Use Your Data', href: '#usage' },
              { icon: Shield, label: 'Data Protection', href: '#protection' },
              { icon: Eye, label: 'Your Rights', href: '#rights' },
              { icon: UserCheck, label: 'Third-Party Services', href: '#third-party' },
              { icon: Mail, label: 'Contact Us', href: '#contact' }
            ].map((item, i) => (
              <a
                key={i}
                href={item.href}
                className="flex items-center gap-3 p-3 bg-black/30 backdrop-blur-sm border border-gray-800 rounded-lg hover:border-gray-700 transition-colors group"
              >
                <item.icon className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                <span className="text-sm text-gray-300">{item.label}</span>
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
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 mb-8">
              <h2 className="text-2xl font-bold mb-3 text-white">Welcome to Garliq</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                Garliq ("we," "our," or "us") operates the Garliq AI learning platform (the "Service"). 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use 
                our Service. By accessing or using Garliq, you agree to this Privacy Policy.
              </p>
            </div>
          </section>

          {/* Information We Collect */}
          <section id="collection" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Database className="w-6 h-6 text-purple-400" />
              1. Information We Collect
            </h2>
            
            <div className="space-y-4">
              <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-5">
                <h3 className="text-lg font-bold mb-3 text-purple-300">1.1 Information You Provide</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span><strong>Account Information:</strong> Name, email address, username, password, and profile information when you create an account.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span><strong>Course Content:</strong> Descriptions, prompts, and content you provide to generate courses and simulations.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span><strong>Communication Data:</strong> Messages, feedback, and support requests you send to us.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span><strong>Payment Information:</strong> Billing details and payment information processed securely through our payment processors (Razorpay).</span>
                  </li>
                </ul>
              </div>

              <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-5">
                <h3 className="text-lg font-bold mb-3 text-purple-300">1.2 Automatically Collected Information</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span><strong>Usage Data:</strong> Information about how you interact with our Service, including courses created, pages viewed, features used, and time spent.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers, and mobile network information.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span><strong>Cookies and Tracking:</strong> We use cookies, web beacons, and similar technologies to track activity and enhance user experience.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span><strong>Analytics Data:</strong> Performance metrics, error logs, and diagnostic data to improve our Service.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-5">
                <h3 className="text-lg font-bold mb-3 text-purple-300">1.3 Information from Third Parties</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span><strong>Social Media:</strong> If you connect via social media accounts, we may receive profile information according to your privacy settings.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span><strong>Integration Partners:</strong> Data from third-party services you integrate with your courses.</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section id="usage" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Lock className="w-6 h-6 text-pink-400" />
              2. How We Use Your Information
            </h2>
            
            <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-5">
              <p className="text-sm text-gray-300 mb-4">We use your information for the following purposes:</p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-pink-400 mt-1">•</span>
                  <span><strong>Provide and Maintain the Service:</strong> Generate courses and simulations, process requests, and deliver core functionality.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-400 mt-1">•</span>
                  <span><strong>Improve Our Service:</strong> Analyze usage patterns, optimize AI models, and enhance user experience.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-400 mt-1">•</span>
                  <span><strong>Personalization:</strong> Customize content, recommendations, and features based on your preferences.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-400 mt-1">•</span>
                  <span><strong>Communication:</strong> Send service updates, notifications, newsletters, and respond to your inquiries.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-400 mt-1">•</span>
                  <span><strong>Security and Fraud Prevention:</strong> Detect, prevent, and address security threats, fraudulent activity, and violations of our Terms of Service.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-400 mt-1">•</span>
                  <span><strong>Legal Compliance:</strong> Comply with legal obligations, enforce our policies, and protect our rights.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-400 mt-1">•</span>
                  <span><strong>Analytics and Research:</strong> Conduct research, generate anonymized statistics, and improve AI capabilities.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Data Protection and Security */}
          <section id="protection" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Shield className="w-6 h-6 text-orange-400" />
              3. Data Protection and Security
            </h2>
            
            <div className="space-y-4">
              <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-5">
                <h3 className="text-lg font-bold mb-3 text-orange-300">3.1 Security Measures</h3>
                <p className="text-sm text-gray-300 mb-3">
                  We implement industry-standard security measures to protect your information:
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-1">•</span>
                    <span><strong>Encryption:</strong> Data transmission is encrypted using SSL/TLS protocols. Sensitive data at rest is encrypted.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-1">•</span>
                    <span><strong>Access Controls:</strong> Strict authentication and authorization mechanisms limit data access to authorized personnel only.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-1">•</span>
                    <span><strong>Regular Audits:</strong> We conduct security assessments and vulnerability testing regularly.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-1">•</span>
                    <span><strong>Secure Infrastructure:</strong> Our service is hosted on secure, enterprise-grade cloud infrastructure (Vercel, Supabase).</span>
                  </li>
                </ul>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-5">
                <h3 className="text-lg font-bold mb-3 text-orange-300">3.2 Data Retention</h3>
                <p className="text-sm text-gray-300">
                  We retain your information for as long as necessary to provide the Service and fulfill the purposes outlined in this Privacy Policy. 
                  You may request deletion of your account and associated data at any time. Some information may be retained for legal or legitimate business purposes.
                </p>
              </div>
            </div>
          </section>

          {/* Sharing and Disclosure */}
          <section id="third-party" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-purple-400" />
              4. Information Sharing and Disclosure
            </h2>
            
            <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-5">
              <p className="text-sm text-gray-300 mb-3">We may share your information in the following circumstances:</p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span><strong>With Your Consent:</strong> When you explicitly authorize us to share information.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span><strong>Service Providers:</strong> Third-party vendors who assist with hosting (Vercel), database services (Supabase), AI processing (Groq, Meta Llama), payment processing (Razorpay), and analytics.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span><strong>Public Content:</strong> Courses you choose to make public are accessible to other users and may be indexed by search engines.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span><strong>Legal Requirements:</strong> To comply with legal obligations, court orders, or government requests.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span><strong>Protection of Rights:</strong> To enforce our Terms of Service, protect our rights, and ensure user safety.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Your Rights */}
          <section id="rights" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Eye className="w-6 h-6 text-pink-400" />
              5. Your Privacy Rights
            </h2>
            
            <div className="space-y-4">
              <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-5">
                <p className="text-sm text-gray-300 mb-3">Depending on your location, you may have the following rights:</p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-pink-400 mt-1">•</span>
                    <span><strong>Access:</strong> Request a copy of the personal information we hold about you.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-400 mt-1">•</span>
                    <span><strong>Correction:</strong> Request correction of inaccurate or incomplete information.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-400 mt-1">•</span>
                    <span><strong>Deletion:</strong> Request deletion of your personal information, subject to legal exceptions.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-400 mt-1">•</span>
                    <span><strong>Portability:</strong> Request transfer of your data in a machine-readable format.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-400 mt-1">•</span>
                    <span><strong>Opt-Out:</strong> Unsubscribe from marketing communications at any time.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-400 mt-1">•</span>
                    <span><strong>Restrict Processing:</strong> Request limitation of how we use your information.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-400 mt-1">•</span>
                    <span><strong>Object:</strong> Object to processing based on legitimate interests.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-5">
                <p className="text-sm text-gray-300">
                  <strong>To exercise these rights, contact us at:</strong> <a href="mailto:team@parasync.in" className="text-purple-400 hover:text-purple-300 underline">team@parasync.in</a>
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  We will respond to your request within 30 days of verification.
                </p>
              </div>
            </div>
          </section>

          {/* Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">6. Cookies and Tracking Technologies</h2>
            
            <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-5">
              <p className="text-sm text-gray-300 mb-3">We use cookies and similar technologies to:</p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span><strong>Essential Cookies:</strong> Required for authentication and basic functionality.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span><strong>Analytics Cookies:</strong> Track usage patterns and performance metrics.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span><strong>Preference Cookies:</strong> Remember your settings and preferences.</span>
                </li>
              </ul>
              <p className="text-xs text-gray-400 mt-3">
                You can manage cookie preferences through your browser settings. Note that disabling certain cookies may affect functionality.
              </p>
            </div>
          </section>

          {/* International Transfers */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">7. International Data Transfers</h2>
            
            <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-5">
              <p className="text-sm text-gray-300">
                Your information may be transferred to and processed in countries outside your country of residence. 
                We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy 
                and applicable data protection laws.
              </p>
            </div>
          </section>

          {/* Children's Privacy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">8. Children's Privacy</h2>
            
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5">
              <p className="text-sm text-gray-300 mb-2">
                Our Service is not intended for users under 13 years of age (or 16 in the European Economic Area). 
                We do not knowingly collect personal information from children.
              </p>
              <p className="text-xs text-gray-400">
                If you believe we have collected information from a child, please contact us immediately at <a href="mailto:team@parasync.in" className="text-red-400 hover:text-red-300 underline">team@parasync.in</a>.
              </p>
            </div>
          </section>

          {/* Changes to Policy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">9. Changes to This Privacy Policy</h2>
            
            <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-5">
              <p className="text-sm text-gray-300 mb-3">
                We may update this Privacy Policy from time to time. We will notify you of material changes by:
              </p>
              <ul className="space-y-2 text-sm text-gray-300 mb-3">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Posting the updated policy on this page with a new "Last Updated" date</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Sending an email notification to registered users</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Displaying a prominent notice on our Service</span>
                </li>
              </ul>
              <p className="text-xs text-gray-400">
                Your continued use of the Service after changes become effective constitutes acceptance of the updated Privacy Policy.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section id="contact" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Mail className="w-6 h-6 text-purple-400" />
              10. Contact Us
            </h2>
            
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
              <p className="text-sm text-gray-300 mb-5">
                If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">Email</p>
                    <a href="mailto:team@parasync.in" className="text-sm text-purple-400 hover:text-purple-300 underline">
                      team@parasync.in
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">Data Protection Officer</p>
                    <p className="text-sm text-gray-400">ParaSync Technologies</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">Response Time</p>
                    <p className="text-sm text-gray-400">We aim to respond within 48 hours</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* GDPR/CCPA Notice */}
          <section className="mb-12">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 text-blue-300">Additional Information for EU and California Residents</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div>
                  <p className="font-semibold text-white mb-1">GDPR (European Union)</p>
                  <p>
                    If you are located in the European Economic Area, you have additional rights under the General Data Protection Regulation (GDPR), 
                    including the right to lodge a complaint with your local data protection authority.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">CCPA (California)</p>
                  <p>
                    California residents have specific rights under the California Consumer Privacy Act (CCPA), including the right to know 
                    what personal information is collected and the right to opt-out of the sale of personal information. 
                    We do not sell personal information.
                  </p>
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
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contact
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
          
          <div className="mt-8 pt-8 border-t border-gray-900 text-center text-gray-600 text-sm">
            <p>© 2025 Garliq by Parasync Technologies. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}