'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SubscriptionModal from '@/components/SubscriptionModal';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/lib/supabase';
import { LogOut } from 'lucide-react';

export default function SubscribePage() {
  const router = useRouter();
  const { subscription, loading, refetch } = useSubscription();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!loading && subscription?.is_active) {
      router.push('/feed');
    }
  }, [loading, subscription, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      {/* Background gradient with visible text */}
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 flex items-center justify-center p-4 text-gray-100 relative">
        {/* Logout button - positioned at bottom right */}
        <button
          onClick={handleLogout}
          className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-full transition-all shadow-lg border border-gray-700 hover:border-gray-600"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Logout</span>
        </button>

        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Choose Your Plan
            </h1>
            <p className="text-lg text-gray-300">
              Get unlimited access to all platform features
            </p>
          </div>

          {/* Pricing card */}
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12 border border-gray-700">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Plan details */}
              <div className="flex-1">
                <div className="inline-block px-3 py-1 bg-blue-900/40 text-blue-300 text-sm font-semibold rounded-full mb-4">
                  {subscription?.status === 'trial' ? 'Upgrade from Trial' : 'Monthly Plan'}
                </div>

                <h2 className="text-3xl font-bold mb-4 text-white">
                  $3 <span className="text-lg font-normal text-gray-400">/ month</span>
                </h2>

                <div className="space-y-3 mb-8">
                  {[
                    { title: 'Full Platform Access', desc: 'Browse and view all posts in the feed' },
                    { title: 'Create & Publish', desc: 'Create new projects and publish content' },
                    { title: 'Studio Access', desc: 'Full access to creation studio tools' },
                    { title: 'Community Features', desc: 'Like, comment, and interact with others' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <p className="font-medium text-white">{item.title}</p>
                        <p className="text-sm text-gray-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <p className="text-sm text-gray-300">
                    <span className="font-medium text-white">Note:</span> AI generations require tokens,
                    which are purchased separately. The subscription gives you access to the platform.
                  </p>
                </div>
              </div>

              {/* Subscribe button */}
              <div className="w-full md:w-auto">
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full md:w-auto px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Subscribe Now
                </button>

                {subscription?.status === 'trial' && (
                  <p className="text-center text-sm text-gray-400 mt-3">
                    {subscription.days_remaining} days left in your trial
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="text-center mt-8 text-sm text-gray-400">
            <p>Cancel anytime. No hidden fees.</p>
          </div>
        </div>
      </div>

      {/* Modal */}
      <SubscriptionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          refetch();
          router.push('/feed');
        }}
      />
    </>
  );
}