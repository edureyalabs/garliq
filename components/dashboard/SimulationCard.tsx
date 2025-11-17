'use client';
import { motion } from 'framer-motion';
import { Heart, Bookmark, Share2, Eye, Trash2, RotateCcw, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { SimulationPost, Simulation } from './types';

interface SimulationCardProps {
  item: SimulationPost | Simulation;
  type: 'post' | 'lab';
  index: number;
  isOwnProfile?: boolean;
  onLike?: (id: string, isLiked: boolean) => void;
  onSave?: (id: string, isSaved: boolean) => void;
  onShare?: (item: SimulationPost) => void;
  onDelete?: (id: string) => void;
  onRegenerate?: (id: string) => void;
}

export default function SimulationCard({ 
  item, 
  type, 
  index, 
  isOwnProfile,
  onLike,
  onSave,
  onShare,
  onDelete,
  onRegenerate
}: SimulationCardProps) {
  
  const renderPreviewIframe = (htmlCode: string | null) => {
  if (!htmlCode) return null;
  
  const htmlContent = `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{overflow:hidden;pointer-events:none;transform:scale(0.6);transform-origin:top left;width:167%;height:167%}</style></head><body>${htmlCode.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')}</body></html>`;

  return (
    <iframe
      srcDoc={htmlContent}
      className="w-full h-full pointer-events-none"
      sandbox=""
      loading="lazy"
    />
  );
};

  const isPost = 'likes_count' in item;
  const isLab = 'generation_status' in item;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index % 12, 11) * 0.03 }}
      className="group relative bg-gradient-to-br from-gray-900 to-black border border-gray-800/50 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all"
    >
      {/* User Info Header (for posts) */}
      {isPost && (item as SimulationPost).profiles && (
        <div className="p-2 border-b border-gray-800/50 bg-black/40">
          <Link href={`/profiles/${item.user_id}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-[10px] font-bold overflow-hidden">
              {(item as SimulationPost).profiles?.avatar_url ? (
                <img 
                  src={(item as SimulationPost).profiles!.avatar_url!} 
                  alt={(item as SimulationPost).profiles!.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{(item as SimulationPost).profiles!.display_name[0].toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold truncate">{(item as SimulationPost).profiles!.display_name}</p>
              <p className="text-[9px] text-gray-500 truncate">@{(item as SimulationPost).profiles!.username}</p>
            </div>
          </Link>
        </div>
      )}

      {/* Preview */}
      {isPost ? (
        <Link href={`/simulation/${item.id}`}>
          <div className="relative aspect-[4/3] bg-white overflow-hidden cursor-pointer">
            {renderPreviewIframe((item as SimulationPost).html_code)}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        </Link>
      ) : (
        <>
          {(item as Simulation).generation_status === 'completed' && (item as Simulation).html_code ? (
            <Link href={`/simulation-studio/${item.id}`}>
              <div className="relative aspect-[4/3] bg-white overflow-hidden cursor-pointer">
                {renderPreviewIframe((item as Simulation).html_code!)}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                  <Eye className="text-white drop-shadow-lg" size={24} />
                </div>
              </div>
            </Link>
          ) : (
            <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              {(item as Simulation).generation_status === 'generating' && (
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="text-3xl mb-1"
                  >
                    🧄
                  </motion.div>
                  <p className="text-[10px] text-blue-400">Generating...</p>
                </div>
              )}
              {(item as Simulation).generation_status === 'failed' && (
                <div className="text-center px-3">
                  <div className="text-2xl mb-1">💥</div>
                  <p className="text-[10px] text-red-400 line-clamp-2">
                    {(item as Simulation).generation_error || 'Generation failed'}
                  </p>
                </div>
              )}
              {(item as Simulation).generation_status === 'pending' && (
                <div className="text-center px-3">
                  <div className="text-2xl mb-1">⏳</div>
                  <p className="text-[10px] text-yellow-400">Pending...</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Content */}
      <div className="p-2 space-y-2">
        {isPost ? (
          <>
            <p className="text-[10px] text-gray-300 line-clamp-2 leading-relaxed">
              {(item as SimulationPost).caption}
            </p>

            <div className="flex items-center justify-between pt-1.5 border-t border-gray-800/50">
              <div className="flex items-center gap-2">
                {onLike && (
                  <button
                    onClick={() => onLike(item.id, (item as SimulationPost).is_liked || false)}
                    className="flex items-center gap-1 hover:scale-110 transition-transform"
                  >
                    {(item as SimulationPost).is_liked ? (
                      <Image 
                        src="/logo.png" 
                        alt="Liked" 
                        width={14} 
                        height={14}
                      />
                    ) : (
                      <Heart size={13} className="text-gray-500 hover:text-blue-400 transition-colors" />
                    )}
                    <span className="text-[10px] font-bold text-gray-400">
                      {(item as SimulationPost).likes_count || 0}
                    </span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1">
                {onSave && (
                  <button
                    onClick={() => onSave(item.id, (item as SimulationPost).is_saved || false)}
                    className="p-1 hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <Bookmark 
                      size={13} 
                      className={(item as SimulationPost).is_saved ? 'fill-blue-400 text-blue-400' : 'text-gray-500'} 
                    />
                  </button>
                )}

                {onShare && (
                  <button 
                    onClick={() => onShare(item as SimulationPost)} 
                    className="p-1 hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <Share2 size={13} className="text-gray-500 hover:text-cyan-400 transition-colors" />
                  </button>
                )}

                {isOwnProfile && onDelete && (
                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-1 hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <Trash2 size={13} className="text-gray-500 hover:text-red-400 transition-colors" />
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs font-bold mb-0.5 line-clamp-1">
              {(item as Simulation).title || 'Untitled Lab'}
            </p>
            <p className="text-[10px] text-gray-500 mb-1.5">
              {new Date((item as Simulation).updated_at).toLocaleDateString()}
            </p>

            {isOwnProfile && (
              <div className="flex gap-1.5 pt-1.5 border-t border-gray-800/50">
                {(item as Simulation).generation_status === 'completed' && (item as Simulation).html_code && (
                  <Link href={`/simulation-studio/${item.id}`} className="flex-1">
                    <button className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-[10px] font-semibold transition-colors">
                      <Eye size={11} />
                      View
                    </button>
                  </Link>
                )}
                
                {(item as Simulation).generation_status === 'failed' && onRegenerate && (
                  <button
                    onClick={() => onRegenerate(item.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-orange-600 hover:bg-orange-700 rounded text-[10px] font-semibold transition-colors"
                  >
                    <RotateCcw size={11} />
                    Retry
                  </button>
                )}
                
                {(item as Simulation).generation_status === 'generating' && (
                  <button
                    disabled
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-700 rounded text-[10px] font-semibold cursor-not-allowed opacity-50"
                  >
                    <Loader2 size={11} className="animate-spin" />
                    Generating...
                  </button>
                )}
                
                {onDelete && (
                  <button
                    onClick={() => onDelete(item.id)}
                    className="px-2 py-1.5 bg-red-600 hover:bg-red-700 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}