'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FolderOpen, Trash2, Edit, Eye, Calendar, Share2, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Project {
  id: string;
  title: string;
  prompt: string;
  html_code: string;
  is_shared: boolean;
  is_draft: boolean;
  session_id: string | null;
  post_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareProject, setShareProject] = useState<Project | null>(null);
  const [shareCaption, setShareCaption] = useState('');
  const [promptVisible, setPromptVisible] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth');
    } else {
      setUser(session.user);
      fetchProjects(session.user.id);
    }
  };

  const fetchProjects = async (userId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (data) {
      console.log('Fetched projects:', data);
      setProjects(data);
    }
    if (error) console.error('Fetch error:', error);
    setLoading(false);
  };

  const handleDelete = async (project: Project) => {
    const hasPost = !project.is_draft && project.post_id;
    const message = hasPost 
      ? '⚠️ This will delete the project AND its shared post. This cannot be undone. Continue?' 
      : 'Delete this project? This cannot be undone.';
      
    if (!confirm(message)) return;
    
    try {
      const response = await fetch(`/api/projects?projectId=${project.id}&userId=${user?.id}`, {
        method: 'DELETE'
      });
      
      const { success, error } = await response.json();
      
      if (!success) {
        throw new Error(error || 'Failed to delete');
      }
      
      alert('✅ Project deleted successfully');
      
      if (user) fetchProjects(user.id);
    } catch (error: any) {
      console.error('Delete error:', error);
      alert('❌ ' + error.message);
    }
  };

  const handleShareClick = (project: Project) => {
    setShareProject(project);
    setShareCaption(project.title);
    setShowShareModal(true);
  };

  const handleShare = async () => {
    if (!shareCaption.trim() || !shareProject || !user || sharing) return;

    setSharing(true);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: shareProject.id,
          caption: shareCaption,
          promptVisible,
          userId: user.id
        })
      });

      const { success, error } = await response.json();

      if (!success || error) {
        throw new Error(error || 'Failed to publish');
      }

      setShowShareModal(false);
      setShareCaption('');
      setShareProject(null);
      
      fetchProjects(user.id);
      
      alert('✅ Project published to feed!');
    } catch (error: any) {
      console.error('Share failed:', error);
      alert('❌ ' + (error.message || 'Failed to share project'));
    }

    setSharing(false);
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/feed" className="flex items-center gap-3 hover:opacity-80 transition">
            <span className="text-4xl">🧄</span>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              MY PROJECTS
            </h1>
          </Link>

          <Link href="/create">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2.5 rounded-full font-bold flex items-center gap-2 shadow-lg"
            >
              <Plus size={20} />
              New Project
            </motion.button>
          </Link>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32"
          >
            <FolderOpen size={80} className="mx-auto mb-6 text-gray-700" />
            <h2 className="text-3xl font-bold mb-3">No Projects Yet</h2>
            <p className="text-gray-500 mb-8 text-lg">Start creating your first vibe coding project</p>
            <Link href="/create">
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-purple-500/50 transition">
                Create Project
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all shadow-xl"
              >
                {/* Preview */}
                <div 
                  className="h-48 bg-white cursor-pointer relative overflow-hidden"
                  onClick={() => setSelectedProject(project)}
                >
                  <iframe
                    srcDoc={project.html_code}
                    className="w-full h-full pointer-events-none scale-50 origin-top-left"
                    style={{ width: '200%', height: '200%' }}
                    sandbox=""
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="text-white drop-shadow-lg" size={40} />
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">
                  {/* Title and Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-bold text-lg line-clamp-1 flex-1">{project.title}</h3>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide flex-shrink-0 ${
                      project.is_draft 
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                        : 'bg-green-500/20 text-green-400 border border-green-500/30'
                    }`}>
                      {project.is_draft ? 'Draft' : 'Live'}
                    </span>
                  </div>

                  {/* Prompt */}
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2 leading-relaxed">{project.prompt}</p>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-4 pb-4 border-b border-gray-800">
                    <Calendar size={14} />
                    Updated {new Date(project.updated_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {/* Edit Button - Primary Action */}
                    {project.session_id ? (
                      <Link href={`/studio/${project.session_id}`} className="block">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl transition-all font-semibold shadow-lg"
                        >
                          <Edit size={18} />
                          Continue Editing
                        </motion.button>
                      </Link>
                    ) : (
                      <button
                        onClick={() => setSelectedProject(project)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all font-semibold"
                      >
                        <Eye size={18} />
                        View Only
                      </button>
                    )}

                    {/* Secondary Actions Row */}
                    <div className="flex items-center gap-2">
                      {/* Share Button - Only for Drafts */}
                      {project.is_draft && project.session_id && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleShareClick(project)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 rounded-xl transition-all font-semibold text-sm"
                          title="Publish to Feed"
                        >
                          <Share2 size={16} />
                          Share
                        </motion.button>
                      )}

                      {/* View Post Link - For Published */}
                      {!project.is_draft && project.post_id && (
                        <Link href={`/post/${project.post_id}`} className="flex-1">
                          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl transition-all font-semibold text-sm">
                            <ExternalLink size={16} />
                            View Post
                          </button>
                        </Link>
                      )}

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(project)}
                        className="px-4 py-2.5 bg-gray-800 hover:bg-red-600 rounded-xl transition-all"
                        title="Delete Project"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-6xl h-[90vh] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-full flex flex-col">
                {/* Modal Header */}
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-black/50 backdrop-blur-sm">
                  <div>
                    <h3 className="font-bold text-lg">{selectedProject.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedProject.is_draft ? '📝 Draft' : '✅ Published'} • Last updated {new Date(selectedProject.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedProject.session_id && (
                      <Link href={`/studio/${selectedProject.session_id}`}>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold flex items-center gap-2 text-sm"
                        >
                          <Edit size={16} />
                          Edit
                        </motion.button>
                      </Link>
                    )}
                    <button 
                      onClick={() => setSelectedProject(null)} 
                      className="text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center hover:bg-gray-800 rounded-full transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
                {/* Preview Iframe */}
                <iframe
                  srcDoc={selectedProject.html_code}
                  className="flex-1 w-full bg-white"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && shareProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6"
            onClick={() => !sharing && setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">📢 Share to Feed</h3>
                <button onClick={() => !sharing && setShowShareModal(false)} disabled={sharing}>
                  <X size={24} className="text-gray-400 hover:text-white" />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-400 mb-2">Caption</label>
                <input
                  type="text"
                  value={shareCaption}
                  onChange={(e) => setShareCaption(e.target.value)}
                  placeholder="Describe your creation..."
                  className="w-full px-4 py-3 bg-black/50 rounded-xl border border-gray-700 focus:border-purple-500 focus:outline-none"
                  disabled={sharing}
                />
              </div>

              <label className="flex items-center gap-3 mb-6 cursor-pointer p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition">
                <input
                  type="checkbox"
                  checked={promptVisible}
                  onChange={(e) => setPromptVisible(e.target.checked)}
                  className="w-5 h-5 accent-purple-600"
                  disabled={sharing}
                />
                <span className="text-sm text-gray-300">Show prompt to everyone</span>
              </label>

              <motion.button
                onClick={handleShare}
                disabled={!shareCaption.trim() || sharing}
                whileHover={!sharing ? { scale: 1.02 } : {}}
                whileTap={!sharing ? { scale: 0.98 } : {}}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {sharing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      🧄
                    </motion.div>
                    Publishing...
                  </>
                ) : (
                  <>
                    <Share2 size={18} />
                    Publish to Feed
                  </>
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}