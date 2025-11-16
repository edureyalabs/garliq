'use client';
import { motion } from 'framer-motion';
import { Sparkles, Beaker, Zap } from 'lucide-react';
import Link from 'next/link';
import { Profile } from './types';

interface DashboardHeaderProps {
  profile: Profile;
  tokenBalance: number;
  onBuyTokens: () => void;
}

export default function DashboardHeader({ profile, tokenBalance, onBuyTokens }: DashboardHeaderProps) {
  return (
    <div className="flex-shrink-0 bg-black/95 backdrop-blur-xl border-b border-gray-800 z-50">
      <div className="px-6 py-3 flex items-start justify-between gap-6">
        {/* LEFT: Profile Info - Top Aligned Avatar */}
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{profile.display_name[0].toUpperCase()}</span>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <h1 className="text-xs font-bold truncate">{profile.display_name}</h1>
            <p className="text-[10px] text-gray-500 truncate">@{profile.username}</p>
            {profile.bio && (
              <p className="text-[9px] text-gray-400 truncate mt-0.5">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* CENTER-LEFT: Token Section - Compact Horizontal */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900/80 rounded-xl border border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-1">
            <Zap size={12} className="text-yellow-400" />
            <span className="text-[10px] font-bold">{tokenBalance.toLocaleString()}</span>
          </div>
          
          <div className="w-px h-4 bg-gray-700" />
          
          <motion.button
            onClick={onBuyTokens}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-2 py-0.5 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-md font-semibold text-[11px]"
          >
            Buy
          </motion.button>
        </div>

        {/* RIGHT: Create Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/create">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow-lg"
            >
              <Sparkles size={13} />
              Course
            </motion.button>
          </Link>

          <Link href="/create-simulation">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow-lg"
            >
              <Beaker size={13} />
              Simulation
            </motion.button>
          </Link>
        </div>
      </div>
    </div>
  );
}