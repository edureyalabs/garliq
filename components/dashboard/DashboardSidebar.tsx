'use client';
import { TrendingUp, Code2, Beaker, Bookmark, Crown, LogOut, Edit } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ActiveSection, DashboardStats } from './types';

interface DashboardSidebarProps {
  activeSection: ActiveSection;
  stats: DashboardStats;
  userId: string;
  isOwnProfile: boolean;
  onSectionChange: (section: ActiveSection) => void;
}

export default function DashboardSidebar({ 
  activeSection, 
  stats, 
  userId,
  isOwnProfile,
  onSectionChange 
}: DashboardSidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <aside className="w-56 bg-gray-900/50 border-r border-gray-800 overflow-y-auto flex-shrink-0 flex flex-col">
      <div className="flex-1 p-3 space-y-1">
        {/* FEED SECTION */}
        <div className="mb-3">
          <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            <TrendingUp size={12} />
            Feed
          </div>
          
          <button
            onClick={() => onSectionChange('feed')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeSection === 'feed'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span>Trending Courses</span>
          </button>
        </div>

        {/* COURSES SECTION */}
        <div className="mb-3">
          <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            <Code2 size={12} />
            Courses
          </div>
          
          <button
            onClick={() => onSectionChange('course-projects')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeSection === 'course-projects'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span>My Courses</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeSection === 'course-projects' ? 'bg-white/20' : 'bg-gray-800'
            }`}>
              {stats.projects}
            </span>
          </button>

          <button
            onClick={() => onSectionChange('course-posts')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeSection === 'course-posts'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span>Shared Courses</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeSection === 'course-posts' ? 'bg-white/20' : 'bg-gray-800'
            }`}>
              {stats.posts}
            </span>
          </button>
        </div>

        {/* SIMULATIONS SECTION */}
        <div className="mb-3">
          <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            <Beaker size={12} />
            Simulations
          </div>
          
          {isOwnProfile && (
            <button
              onClick={() => onSectionChange('sim-labs')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeSection === 'sim-labs'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>My Simulations</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeSection === 'sim-labs' ? 'bg-white/20' : 'bg-gray-800'
              }`}>
                {stats.myLabs}
              </span>
            </button>
          )}

          <button
            onClick={() => onSectionChange('sim-shared')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeSection === 'sim-shared'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span>Shared Simulations</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeSection === 'sim-shared' ? 'bg-white/20' : 'bg-gray-800'
            }`}>
              {stats.sharedSimulations}
            </span>
          </button>
        </div>

        {/* SAVED SECTION */}
        {isOwnProfile && (
          <div className="mb-3">
            <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <Bookmark size={12} />
              Saved
            </div>
            
            <button
              onClick={() => onSectionChange('saved-courses')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeSection === 'saved-courses'
                  ? 'bg-pink-600 text-white shadow-lg'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>Courses</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeSection === 'saved-courses' ? 'bg-white/20' : 'bg-gray-800'
              }`}>
                {stats.savedCourses}
              </span>
            </button>

            <button
              onClick={() => onSectionChange('saved-labs')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeSection === 'saved-labs'
                  ? 'bg-pink-600 text-white shadow-lg'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>Simulations</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeSection === 'saved-labs' ? 'bg-white/20' : 'bg-gray-800'
              }`}>
                {stats.savedLabs}
              </span>
            </button>
          </div>
        )}

        {/* ACCOUNT SECTION */}
        {isOwnProfile && (
          <div className="mb-3">
            <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <Crown size={12} />
              Account
            </div>
            
            <button
              onClick={() => onSectionChange('subscription')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeSection === 'subscription'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>Subscription</span>
            </button>

            <button
              onClick={() => router.push('/edit-profile')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-gray-400 hover:bg-gray-800 hover:text-white mt-1"
            >
              <span>Edit Profile</span>
              <Edit size={12} />
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM SECTION: Branding + Logout - ✅ UPDATED */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center justify-between px-2 py-2">
          {/* Logo + Brand Name */}
          <div className="flex items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="Garliq" 
              width={32} 
              height={32}
            />
            <span className="text-base font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Garliq
            </span>
          </div>
          
          {/* Logout Icon */}
          {isOwnProfile && (
            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors group"
              title="Logout"
            >
              <LogOut size={16} className="text-gray-400 group-hover:text-red-400 transition-colors" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
