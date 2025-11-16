'use client';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Bookmark, Share2, Code2, Edit, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Post, Project } from './types';

interface CourseCardProps {
  item: Post | Project;
  type: 'post' | 'project' | 'feed';
  index: number;
  isOwnProfile?: boolean;
  onLike?: (id: string, isLiked: boolean) => void;
  onSave?: (id: string, isSaved: boolean) => void;
  onShare?: (item: Post) => void; // ✅ Changed to accept only Post
  onDelete?: (id: string) => void;
  onShareProject?: (project: Project) => void;
  onDeleteProject?: (project: Project) => void;
}

export default function CourseCard({ 
  item, 
  type, 
  index, 
  isOwnProfile,
  onLike,
  onSave,
  onShare,
  onDelete,
  onShareProject,
  onDeleteProject
}: CourseCardProps) {
  
  const renderPreviewIframe = () => {
    const htmlContent = item.session_id && item.first_page_content
      ? `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:sans-serif;padding:20px;overflow:hidden}</style></head><body>${item.first_page_content}</body></html>`
      : `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{overflow:hidden;pointer-events:none;transform:scale(0.8);transform-origin:top left;width:125%;height:125%}</style></head><body>${item.html_code.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')}</body></html>`;

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
  const isProject = 'is_draft' in item;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index % 12, 11) * 0.03 }}
      className="group relative bg-gradient-to-br from-gray-900 to-black border border-gray-800/50 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all"
    >
      {/* Project Draft/Live Badge */}
      {isProject && isOwnProfile && (
        <div className="absolute top-1.5 right-1.5 z-10">
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-lg ${
            (item as Project).is_draft 
              ? 'bg-yellow-500 text-black' 
              : 'bg-green-500 text-black'
          }`}>
            {(item as Project).is_draft ? 'Draft' : 'Live'}
          </span>
        </div>
      )}

      {/* User Info Header (for feed and saved) */}
      {(type === 'feed' || type === 'post') && isPost && (item as Post).profiles && (
        <div className="p-2 border-b border-gray-800/50 bg-black/40">
          <Link href={`/profiles/${item.user_id}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold overflow-hidden">
              {(item as Post).profiles?.avatar_url ? (
                <img 
                  src={(item as Post).profiles!.avatar_url!} 
                  alt={(item as Post).profiles!.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{(item as Post).profiles!.display_name[0].toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold truncate">{(item as Post).profiles!.display_name}</p>
              <p className="text-[9px] text-gray-500 truncate">@{(item as Post).profiles!.username}</p>
            </div>
          </Link>
        </div>
      )}

      {/* Preview */}
      {isPost ? (
        <Link href={`/post/${item.id}`}>
          <div className="relative aspect-[4/3] bg-white overflow-hidden cursor-pointer">
            {renderPreviewIframe()}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        </Link>
      ) : (
        <Link href={`/projects/${item.id}`}>
          <div className="relative aspect-[4/3] bg-white overflow-hidden cursor-pointer">
            {renderPreviewIframe()}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
              <Eye className="text-white drop-shadow-lg" size={24} />
            </div>
          </div>
        </Link>
      )}

      {/* Content */}
      <div className="p-2 space-y-2">
        {isPost ? (
          <>
            <p className="text-[10px] text-gray-300 line-clamp-2 leading-relaxed">
              {(item as Post).caption}
            </p>

            {(item as Post).prompt_visible && (item as Post).prompt && (
              <div className="bg-purple-500/5 border border-purple-500/10 rounded p-1.5">
                <div className="flex items-center gap-1 mb-0.5">
                  <Code2 size={8} className="text-purple-400" />
                  <span className="text-[8px] font-bold text-purple-400 uppercase">Prompt</span>
                </div>
                <p className="text-[9px] text-gray-400 line-clamp-2 font-mono">{(item as Post).prompt}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-1.5 border-t border-gray-800/50">
              <div className="flex items-center gap-2">
                {onLike && (
                  <button
                    onClick={() => onLike(item.id, (item as Post).is_liked || false)}
                    className="flex items-center gap-1 hover:scale-110 transition-transform"
                  >
                    {(item as Post).is_liked ? (
                      <Image 
                        src="/logo.png" 
                        alt="Liked" 
                        width={14} 
                        height={14}
                      />
                    ) : (
                      <Heart size={13} className="text-gray-500 hover:text-purple-400 transition-colors" />
                    )}
                    <span className="text-[10px] font-bold text-gray-400">{(item as Post).likes_count || 0}</span>
                  </button>
                )}

                {type === 'feed' && (
                  <Link href={`/post/${item.id}#comments`}>
                    <div className="flex items-center gap-1 text-gray-500">
                      <MessageCircle size={13} />
                      <span className="text-[10px] font-bold">{(item as Post).comments_count || 0}</span>
                    </div>
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-1">
                {onSave && (
                  <button
                    onClick={() => onSave(item.id, (item as Post).is_saved || false)}
                    className="p-1 hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <Bookmark 
                      size={13} 
                      className={(item as Post).is_saved ? 'fill-purple-400 text-purple-400' : 'text-gray-500'} 
                    />
                  </button>
                )}

                {onShare && isPost && ( // ✅ Added isPost check
                  <button 
                    onClick={() => onShare(item as Post)} // ✅ Cast to Post
                    className="p-1 hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <Share2 size={13} className="text-gray-500 hover:text-blue-400 transition-colors" />
                  </button>
                )}

                {isOwnProfile && onDelete && type === 'post' && (
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
              {(item as Project).title || 'Untitled Project'}
            </p>
            <p className="text-[10px] text-gray-500 mb-1.5">
              {new Date((item as Project).updated_at).toLocaleDateString()}
            </p>

            {isOwnProfile && onShareProject && onDeleteProject && (
              <div className="flex gap-1.5 pt-1.5 border-t border-gray-800/50">
                {(item as Project).session_id && (
                  <Link href={`/studio/${(item as Project).session_id}`} className="flex-1">
                    <button className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-[10px] font-semibold transition-colors">
                      <Edit size={11} />
                      Edit
                    </button>
                  </Link>
                )}
                
                {(item as Project).is_draft && (item as Project).session_id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onShareProject(item as Project);
                    }}
                    className="px-2 py-1.5 bg-green-600 hover:bg-green-700 rounded transition-colors"
                    title="Share"
                  >
                    <Share2 size={11} />
                  </button>
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProject(item as Project);
                  }}
                  className="px-2 py-1.5 bg-red-600 hover:bg-red-700 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}