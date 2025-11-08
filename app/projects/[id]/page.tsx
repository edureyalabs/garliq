'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Edit, Trash2, ChevronLeft, ChevronRight, FileText, Loader2, Eye, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Project {
  id: string;
  title: string;
  html_code: string;
  created_at: string;
  updated_at: string;
  session_id: string | null;
  is_draft: boolean;
  is_shared: boolean;
  post_id: string | null;
  prompt: string;
  user_id: string;
}

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

interface CoursePage {
  id: string;
  page_number: number;
  page_type: 'intro' | 'toc' | 'chapter' | 'conclusion';
  page_title: string;
  html_content: string;
  generation_status: 'pending' | 'generating' | 'completed' | 'failed';
  error_message: string | null;
}

export default function ProjectViewerPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pages, setPages] = useState<CoursePage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingPages, setLoadingPages] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    checkUser();
    fetchProject();
  }, [projectId]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setUser(session.user);
  };

  const fetchProject = async () => {
    try {
      const { data: projectData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;

      if (projectData) {
        console.log('Fetched project data:', projectData);

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', projectData.user_id)
          .single();

        if (profileData) setProfile(profileData);

        setProject(projectData);

        if (projectData.session_id) {
          await fetchPages(projectData.session_id);
        }
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPages = async (sessionId: string) => {
    try {
      setLoadingPages(true);
      console.log('📨 Loading course pages for session:', sessionId);
      
      const { data, error } = await supabase
        .from('course_pages')
        .select('*')
        .eq('session_id', sessionId)
        .eq('generation_status', 'completed')
        .order('page_number', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setPages(data);
        console.log(`✅ Loaded ${data.length} pages`);
      } else {
        console.log('⚠️ No pages found, will use legacy html_code');
      }
    } catch (error) {
      console.error('Load pages error:', error);
    } finally {
      setLoadingPages(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/projects/${projectId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${project?.title} | Garliq`,
          url: shareUrl
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied!');
    }
  };

  const handleDelete = async () => {
    if (!project || !user) return;
    
    const hasPost = !project.is_draft && project.post_id;
    const message = hasPost 
      ? '⚠️ This will delete the project AND its shared post. This cannot be undone. Continue?' 
      : 'Delete this project? This cannot be undone.';
      
    if (!confirm(message)) return;
    
    try {
      const response = await fetch(`/api/projects?projectId=${project.id}&userId=${user.id}`, {
        method: 'DELETE'
      });
      
      const { success, error } = await response.json();
      
      if (!success) {
        throw new Error(error || 'Failed to delete');
      }
      
      alert('✅ Project deleted successfully');
      router.push(`/profiles/${user.id}`);
    } catch (error: any) {
      console.error('Delete error:', error);
      alert('❌ ' + error.message);
    }
  };

  const getPageIcon = (page: CoursePage) => {
    if (page.page_type === 'intro') return '📖';
    if (page.page_type === 'toc') return '📋';
    if (page.page_type === 'conclusion') return '✅';
    return page.page_number - 1;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-6xl"
        >
          🧄
        </motion.div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Project not found</h2>
          <Link href="/feed">
            <button className="bg-purple-600 px-6 py-3 rounded-full">Back to Feed</button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === project.user_id;

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Ultra Compact Header */}
      <div className="flex-shrink-0 bg-black/95 backdrop-blur-xl border-b border-gray-800 z-40">
        <div className="px-3 py-1.5 flex items-center gap-3 text-xs">
          {/* Back Button */}
          <button 
            onClick={() => router.back()} 
            className="p-1 hover:bg-gray-800 rounded transition-colors flex-shrink-0"
          >
            <ArrowLeft size={16} />
          </button>

          {/* Creator */}
          <Link href={`/profiles/${project.user_id}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold overflow-hidden">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.display_name || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{profile?.display_name?.[0]?.toUpperCase() || '?'}</span>
              )}
            </div>
            <span className="font-semibold text-white">{profile?.display_name || 'Anonymous'}</span>
          </Link>

          {/* Divider */}
          <div className="w-px h-4 bg-gray-700"></div>

          {/* Project Title */}
          <p className="text-gray-200 truncate flex-1 font-semibold">
            {project.title || 'Untitled Project'}
          </p>

          {/* Status Badge */}
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            project.is_draft 
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
              : 'bg-green-500/20 text-green-400 border border-green-500/30'
          }`}>
            {project.is_draft ? 'Draft' : 'Live'}
          </span>

          {/* Pages Badge */}
          {pages.length > 0 && (
            <>
              <div className="w-px h-4 bg-gray-700"></div>
              <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 rounded px-2 py-0.5 flex-shrink-0">
                <FileText size={10} className="text-blue-400" />
                <span className="text-xs text-blue-400 font-bold">{pages.length}</span>
              </div>
            </>
          )}

          {/* Last Updated */}
          <div className="w-px h-4 bg-gray-700"></div>
          <div className="flex items-center gap-1 text-gray-500">
            <Calendar size={10} />
            <span className="text-[10px]">
              {new Date(project.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-gray-700"></div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {isOwner && project.session_id && (
              <Link href={`/studio/${project.session_id}`}>
                <button className="p-1 hover:bg-gray-800 rounded transition-colors" title="Edit">
                  <Edit size={14} className="text-gray-400" />
                </button>
              </Link>
            )}

            <button
              onClick={handleShare}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
              title="Share"
            >
              <Share2 size={14} className="text-gray-400" />
            </button>

            {isOwner && (
              <button
                onClick={handleDelete}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
                title="Delete"
              >
                <Trash2 size={14} className="text-red-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Full Width Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Pages Sidebar (if multi-page) */}
        {pages.length > 0 && (
          <div className="hidden lg:block w-48 border-r border-gray-800 bg-gray-900/50 overflow-y-auto">
            <div className="p-2 border-b border-gray-800">
              <h3 className="text-xs font-bold flex items-center gap-1.5">
                <FileText size={12} className="text-purple-400" />
                Pages ({pages.length})
              </h3>
            </div>
            <div className="p-1.5 space-y-0.5">
              {pages.map((page, idx) => (
                <button
                  key={page.id}
                  onClick={() => setCurrentPageIndex(idx)}
                  className={`w-full text-left p-2 rounded transition-all text-xs ${
                    currentPageIndex === idx
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{getPageIcon(page)}</span>
                    <span className="font-semibold flex-1 truncate">
                      {page.page_title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preview Container */}
        <div className="flex-1 flex flex-col">
          {pages.length > 0 ? (
            <>
              {/* Page Navigation Header */}
              <div className="px-3 py-1.5 border-b border-gray-800 flex items-center justify-between flex-shrink-0 bg-black">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentPageIndex === 0}
                    className="p-1 bg-gray-800 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <div className="flex items-center gap-1.5">
                    <Eye size={12} className="text-purple-400" />
                    <span className="text-xs text-gray-400">
                      {pages[currentPageIndex]?.page_title || 'No page'}
                    </span>
                  </div>
                  <button
                    onClick={() => setCurrentPageIndex(prev => Math.min(pages.length - 1, prev + 1))}
                    disabled={currentPageIndex === pages.length - 1}
                    className="p-1 bg-gray-800 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
                <span className="text-xs text-gray-500">
                  {currentPageIndex + 1}/{pages.length}
                </span>
              </div>

              {/* Page Content */}
              <div className="flex-1 bg-white overflow-auto">
                {loadingPages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="animate-spin text-purple-400" size={32} />
                  </div>
                ) : pages[currentPageIndex] ? (
                  <iframe
                    key={pages[currentPageIndex].id}
                    srcDoc={pages[currentPageIndex].html_content}
                    className="w-full h-full"
                    sandbox="allow-scripts allow-same-origin"
                    title="course-page"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p className="text-sm">No page selected</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 bg-white">
              <iframe
                srcDoc={project.html_code}
                className="w-full h-full"
                sandbox="allow-scripts allow-same-origin"
                title="legacy-preview"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}