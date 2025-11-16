'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2 } from 'lucide-react';
import { useState } from 'react';
import { Project } from './types';

interface ShareProjectModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onShare: (caption: string, promptVisible: boolean) => Promise<void>;
}

export default function ShareProjectModal({ isOpen, project, onClose, onShare }: ShareProjectModalProps) {
  const [caption, setCaption] = useState('');
  const [promptVisible, setPromptVisible] = useState(true);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (!caption.trim() || sharing) return;
    
    setSharing(true);
    try {
      await onShare(caption, promptVisible);
      setCaption('');
      setPromptVisible(true);
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setSharing(false);
    }
  };

  // Reset caption when project changes
  useState(() => {
    if (project) {
      setCaption(project.title);
    }
  });

  return (
    <AnimatePresence>
      {isOpen && project && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => !sharing && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold">📢 Share to Feed</h3>
              <button onClick={() => !sharing && onClose()} disabled={sharing}>
                <span className="text-2xl text-gray-400 hover:text-white transition-colors">✕</span>
              </button>
            </div>

            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="w-full px-4 py-3 bg-black/50 rounded-xl border border-gray-700 focus:border-purple-500 focus:outline-none mb-4 text-sm"
              disabled={sharing}
            />

            <label className="flex items-center gap-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={promptVisible}
                onChange={(e) => setPromptVisible(e.target.checked)}
                className="w-4 h-4"
                disabled={sharing}
              />
              <span className="text-xs text-gray-400">Share prompt publicly</span>
            </label>

            <motion.button
              onClick={handleShare}
              disabled={!caption.trim() || sharing}
              whileHover={!sharing ? { scale: 1.02 } : {}}
              whileTap={!sharing ? { scale: 0.98 } : {}}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
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
                  <Share2 size={16} />
                  Publish to Feed
                </>
              )}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}