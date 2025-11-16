'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ActiveSection, Post, Project, Simulation, SimulationPost } from './types';
import CourseCard from './CourseCard';
import SimulationCard from './SimulationCard';
import SubscriptionPanel from './SubscriptionPanel';
import { useRef, useEffect } from 'react';

interface DashboardContentProps {
  activeSection: ActiveSection;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  isOwnProfile: boolean;
  
  // Data
  feedPosts: Post[];
  posts: Post[];
  projects: Project[];
  savedPosts: Post[];
  simulations: Simulation[];
  sharedSimulations: SimulationPost[];
  savedSimulations: SimulationPost[];
  subscriptionStatus: any;
  
  // Handlers
  onLoadMore: () => void;
  onLikeCourse: (id: string, isLiked: boolean) => void;
  onSaveCourse: (id: string, isSaved: boolean) => void;
  onShareCourse: (post: Post) => void;
  onDeletePost: (id: string) => void;
  onShareProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onLikeSimulation: (id: string, isLiked: boolean) => void;
  onSaveSimulation: (id: string, isSaved: boolean) => void;
  onShareSimulation: (post: SimulationPost) => void;
  onDeleteSimulation: (id: string) => void;
  onDeleteSimulationPost: (id: string) => void;
  onRegenerateSimulation: (id: string) => void;
  onSubscribe: () => void;
}

export default function DashboardContent({
  activeSection,
  loading,
  loadingMore,
  hasMore,
  isOwnProfile,
  feedPosts,
  posts,
  projects,
  savedPosts,
  simulations,
  sharedSimulations,
  savedSimulations,
  subscriptionStatus,
  onLoadMore,
  onLikeCourse,
  onSaveCourse,
  onShareCourse,
  onDeletePost,
  onShareProject,
  onDeleteProject,
  onLikeSimulation,
  onSaveSimulation,
  onShareSimulation,
  onDeleteSimulation,
  onDeleteSimulationPost,
  onRegenerateSimulation,
  onSubscribe,
}: DashboardContentProps) {
  
  const observerTarget = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loadingMore, loading, onLoadMore]);

  const getCurrentDisplayItems = () => {
    switch(activeSection) {
      case 'feed': return feedPosts;
      case 'course-posts': return posts;
      case 'course-projects': return projects;
      case 'sim-shared': return sharedSimulations;
      case 'sim-labs': return simulations;
      case 'saved-courses': return savedPosts;
      case 'saved-labs': return savedSimulations;
      case 'subscription': return [];
      default: return [];
    }
  };

  const displayItems = getCurrentDisplayItems();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <AnimatePresence mode="wait">
          {/* LOADING STATE */}
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-20"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="text-6xl"
              >
                🧄
              </motion.div>
            </motion.div>
          )}

          {/* SUBSCRIPTION VIEW */}
          {!loading && activeSection === 'subscription' && (
            <motion.div
              key="subscription"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SubscriptionPanel
                subscriptionStatus={subscriptionStatus}
                onSubscribe={onSubscribe}
              />
            </motion.div>
          )}

          {/* EMPTY STATE */}
          {!loading && activeSection !== 'subscription' && displayItems.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-20"
            >
              <div className="mb-6 flex justify-center">
                <Image 
                  src="/logo.png" 
                  alt="Garliq" 
                  width={80} 
                  height={80}
                />
              </div>
              <h2 className="text-xl font-bold mb-2">
                {activeSection === 'feed' && 'No Trending Posts'}
                {activeSection === 'course-posts' && 'No Posts Yet'}
                {activeSection === 'course-projects' && 'No Projects Yet'}
                {activeSection === 'sim-shared' && 'No Shared Simulations'}
                {activeSection === 'sim-labs' && 'No Labs Yet'}
                {activeSection === 'saved-courses' && 'No Saved Courses'}
                {activeSection === 'saved-labs' && 'No Saved Labs'}
              </h2>
              <p className="text-gray-500 mb-6 text-sm">
                {activeSection === 'feed' && 'Check back later for trending content'}
                {activeSection === 'course-posts' && 'Share your first creation'}
                {activeSection === 'course-projects' && 'Start building something'}
                {activeSection === 'sim-shared' && 'Publish your first lab'}
                {activeSection === 'sim-labs' && 'Create your first simulation'}
                {(activeSection === 'saved-courses' || activeSection === 'saved-labs') && 'Start saving content you love'}
              </p>
              {isOwnProfile && !activeSection.startsWith('saved') && activeSection !== 'feed' && (
                <div className="flex items-center justify-center gap-3">
                  {activeSection.startsWith('course') && (
                    <Link href="/create">
                      <button className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg text-sm">
                        <Plus size={16} />
                        Create Course
                      </button>
                    </Link>
                  )}
                  {activeSection.startsWith('sim') && (
                    <Link href="/create-simulation">
                      <button className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg text-sm">
                        <Plus size={16} />
                        Create Lab
                      </button>
                    </Link>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* CONTENT GRID */}
          {!loading && activeSection !== 'subscription' && displayItems.length > 0 && (
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {/* FEED POSTS */}
                {activeSection === 'feed' && feedPosts.map((post, index) => (
                  <CourseCard
                    key={`${post.id}-${index}`}
                    item={post}
                    type="feed"
                    index={index}
                    isOwnProfile={isOwnProfile}
                    onLike={onLikeCourse}
                    onSave={onSaveCourse}
                    onShare={onShareCourse}
                  />
                ))}

                {/* COURSE POSTS */}
                {activeSection === 'course-posts' && posts.map((post, index) => (
                  <CourseCard
                    key={`${post.id}-${index}`}
                    item={post}
                    type="post"
                    index={index}
                    isOwnProfile={isOwnProfile}
                    onLike={onLikeCourse}
                    onSave={onSaveCourse}
                    onShare={onShareCourse}
                    onDelete={onDeletePost}
                  />
                ))}

                {/* COURSE PROJECTS */}
                {activeSection === 'course-projects' && projects.map((project, index) => (
                  <CourseCard
                    key={`${project.id}-${index}`}
                    item={project}
                    type="project"
                    index={index}
                    isOwnProfile={isOwnProfile}
                    onShareProject={onShareProject}
                    onDeleteProject={onDeleteProject}
                  />
                ))}

                {/* SHARED SIMULATIONS */}
                {activeSection === 'sim-shared' && sharedSimulations.map((sim, index) => (
                  <SimulationCard
                    key={`${sim.id}-${index}`}
                    item={sim}
                    type="post"
                    index={index}
                    isOwnProfile={isOwnProfile}
                    onLike={onLikeSimulation}
                    onSave={onSaveSimulation}
                    onShare={onShareSimulation}
                    onDelete={onDeleteSimulationPost}
                  />
                ))}

                {/* MY LABS */}
                {activeSection === 'sim-labs' && simulations.map((sim, index) => (
                  <SimulationCard
                    key={`${sim.id}-${index}`}
                    item={sim}
                    type="lab"
                    index={index}
                    isOwnProfile={isOwnProfile}
                    onDelete={onDeleteSimulation}
                    onRegenerate={onRegenerateSimulation}
                  />
                ))}

                {/* SAVED COURSES */}
                {activeSection === 'saved-courses' && savedPosts.map((post, index) => (
                  <CourseCard
                    key={`${post.id}-${index}`}
                    item={post}
                    type="post"
                    index={index}
                    isOwnProfile={isOwnProfile}
                    onLike={onLikeCourse}
                    onSave={onSaveCourse}
                    onShare={onShareCourse}
                  />
                ))}

                {/* SAVED LABS */}
                {activeSection === 'saved-labs' && savedSimulations.map((sim, index) => (
                  <SimulationCard
                    key={`${sim.id}-${index}`}
                    item={sim}
                    type="post"
                    index={index}
                    isOwnProfile={isOwnProfile}
                    onLike={onLikeSimulation}
                    onSave={onSaveSimulation}
                    onShare={onShareSimulation}
                  />
                ))}
              </div>

              {/* INFINITE SCROLL TRIGGER */}
              <div ref={observerTarget} className="py-6 flex justify-center">
                {loadingMore && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="text-2xl"
                    >
                      🧄
                    </motion.div>
                    <span className="text-xs">Loading...</span>
                  </div>
                )}
                {!hasMore && displayItems.length > 0 && (
                  <p className="text-gray-500 text-xs">That's all! 🎉</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}