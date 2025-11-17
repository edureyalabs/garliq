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
    <aside className="w-56 bg-black/40 backdrop-blur-sm border-r border-gray-800 overflow-y-auto flex-shrink-0 flex flex-col">
      <div className="flex-1 p-3 space-y-1">
        {/* FEED SECTION */}
        <div className="mb-4">
          <div className="flex items-center gap-2 px-2 py-1 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">
            <TrendingUp size={11} />
            Feed
          </div>
          
          <button
            onClick={() => onSectionChange('feed')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
              activeSection === 'feed'
                ? 'bg-white text-black'
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
            }`}
          >
            <span>Trending Courses</span>
          </button>
        </div>

        {/* COURSES SECTION */}
        <div className="mb-4">
          <div className="flex items-center gap-2 px-2 py-1 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">
            <Code2 size={11} />
            Courses
          </div>
          
          <button
            onClick={() => onSectionChange('course-projects')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
              activeSection === 'course-projects'
                ? 'bg-white text-black'
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
            }`}
          >
            <span>My Courses</span>
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
              activeSection === 'course-projects' ? 'bg-black/10' : 'bg-gray-800 text-gray-500'
            }`}>
              {stats.projects}
            </span>
          </button>

          <button
            onClick={() => onSectionChange('course-posts')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
              activeSection === 'course-posts'
                ? 'bg-white text-black'
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
            }`}
          >
            <span>Shared Courses</span>
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
              activeSection === 'course-posts' ? 'bg-black/10' : 'bg-gray-800 text-gray-500'
            }`}>
              {stats.posts}
            </span>
          </button>
        </div>

        {/* SIMULATIONS SECTION */}
        <div className="mb-4">
          <div className="flex items-center gap-2 px-2 py-1 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">
            <Beaker size={11} />
            Simulations
          </div>
          
          {isOwnProfile && (
            <button
              onClick={() => onSectionChange('sim-labs')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                activeSection === 'sim-labs'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <span>My Simulations</span>
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                activeSection === 'sim-labs' ? 'bg-black/10' : 'bg-gray-800 text-gray-500'
              }`}>
                {stats.myLabs}
              </span>
            </button>
          )}

          <button
            onClick={() => onSectionChange('sim-shared')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
              activeSection === 'sim-shared'
                ? 'bg-white text-black'
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
            }`}
          >
            <span>Shared Simulations</span>
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
              activeSection === 'sim-shared' ? 'bg-black/10' : 'bg-gray-800 text-gray-500'
            }`}>
              {stats.sharedSimulations}
            </span>
          </button>
        </div>

        {/* SAVED SECTION */}
        {isOwnProfile && (
          <div className="mb-4">
            <div className="flex items-center gap-2 px-2 py-1 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">
              <Bookmark size={11} />
              Saved
            </div>
            
            <button
              onClick={() => onSectionChange('saved-courses')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                activeSection === 'saved-courses'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <span>Courses</span>
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                activeSection === 'saved-courses' ? 'bg-black/10' : 'bg-gray-800 text-gray-500'
              }`}>
                {stats.savedCourses}
              </span>
            </button>

            <button
              onClick={() => onSectionChange('saved-labs')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                activeSection === 'saved-labs'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <span>Simulations</span>
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                activeSection === 'saved-labs' ? 'bg-black/10' : 'bg-gray-800 text-gray-500'
              }`}>
                {stats.savedLabs}
              </span>
            </button>
          </div>
        )}

        {/* ACCOUNT SECTION */}
        {isOwnProfile && (
          <div className="mb-4">
            <div className="flex items-center gap-2 px-2 py-1 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">
              <Crown size={11} />
              Account
            </div>
            
            <button
              onClick={() => onSectionChange('subscription')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                activeSection === 'subscription'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <span>Subscription</span>
            </button>

            <button
              onClick={() => router.push('/edit-profile')}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all text-gray-400 hover:bg-gray-800/50 hover:text-white mt-1"
            >
              <span>Edit Profile</span>
              <Edit size={11} />
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM SECTION: Branding + Logout */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center justify-between px-2 py-1.5">
          {/* Logo + Brand Name */}
          <div className="flex items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="Garliq" 
              width={28} 
              height={28}
            />
            <span className="text-sm font-bold">Garliq</span>
          </div>
          
          {/* Logout Icon */}
          {isOwnProfile && (
            <button
              onClick={handleLogout}
              className="p-1 hover:bg-gray-800/50 rounded-lg transition-colors group"
              title="Logout"
            >
              <LogOut size={14} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}