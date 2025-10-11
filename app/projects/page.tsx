'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, FolderOpen, Trash2, Edit, Eye, Calendar } from 'lucide-react';
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

  useEffect(() => {
    checkAuth();
    fetchProjects();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) router.push('/auth');
  };

  const fetchProjects = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false });

    if (data) setProjects(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    
    await supabase.from('projects').delete().eq('id', id);
    fetchProjects();
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
          <Link href="/feed" className="flex items-center gap-3">
            <span className="text-4xl">🧄</span>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              MY PROJECTS
            </h1>
          </Link>

          <Link href="/create">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2.5 rounded-full font-bold flex items-center gap-2"
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
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 rounded-full font-bold">
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
                transition={{ delay: i * 0.1 }}
                className="group bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all"
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
                    sandbox="allow-scripts"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="text-white" size={32} />
                  </div>
                </div>

                {/* Info */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg truncate flex-1">{project.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      project.is_draft 
                        ? 'bg-yellow-500/20 text-yellow-400' 
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {project.is_draft ? 'Draft' : 'Published'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{project.prompt}</p>

                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
                    <Calendar size={14} />
                    {new Date(project.updated_at).toLocaleDateString()}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {project.session_id ? (
                      <Link href={`/studio/${project.session_id}`} className="flex-1">
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
                          <Edit size={16} />
                          <span className="text-sm font-medium">Edit</span>
                        </button>
                      </Link>
                    ) : (
                      <button
                        onClick={() => setSelectedProject(project)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                      >
                        <Eye size={16} />
                        <span className="text-sm font-medium">View</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(project.id)}
                      className="p-2 bg-gray-800 hover:bg-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {selectedProject && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6"
          onClick={() => setSelectedProject(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="w-full max-w-6xl h-[90vh] bg-gray-900 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-black/50 backdrop-blur-sm">
                <div>
                  <h3 className="font-bold text-lg">{selectedProject.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedProject.is_draft ? 'Draft' : 'Published'} • Last updated {new Date(selectedProject.updated_at).toLocaleDateString()}
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
                        Edit Project
                      </motion.button>
                    </Link>
                  )}
                  <button 
                    onClick={() => setSelectedProject(null)} 
                    className="text-gray-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center hover:bg-gray-800 rounded-full transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <iframe
                srcDoc={selectedProject.html_code}
                className="flex-1 w-full bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}