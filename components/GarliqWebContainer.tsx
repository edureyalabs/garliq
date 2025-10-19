'use client';
import { useRef, useState, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, Maximize2, Minimize2, X } from 'lucide-react';

interface GarliqWebContainerProps {
  htmlCode: string;
  username: string;
  displayName: string;
  timestamp: string;
  className?: string;
}

// Memoize to prevent re-renders from parent component changes
const GarliqWebContainer = memo(function GarliqWebContainer({
  htmlCode,
  username,
  displayName,
  timestamp,
  className = ''
}: GarliqWebContainerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const normalContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Format timestamp
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Reload iframe only
  const handleReload = () => {
    if (iframeRef.current && !isReloading) {
      setIsReloading(true);
      const iframe = iframeRef.current;
      
      // Method 1: Try contentWindow.location.reload() first
      try {
        iframe.contentWindow?.location.reload();
        setTimeout(() => setIsReloading(false), 1000);
      } catch (e) {
        // Method 2: Fallback to srcDoc manipulation
        const currentSrc = iframe.srcdoc || htmlCode;
        iframe.srcdoc = '';
        
        setTimeout(() => {
          iframe.srcdoc = currentSrc;
          setTimeout(() => setIsReloading(false), 500);
        }, 100);
      }
    }
  };

  // Toggle enlarge mode
  const handleEnlarge = () => {
    setIsEnlarged(true);
    document.body.style.overflow = 'hidden';
    
    // Move iframe to fullscreen container
    if (iframeRef.current && fullscreenContainerRef.current) {
      fullscreenContainerRef.current.appendChild(iframeRef.current);
    }
  };

  const handleCompress = () => {
    setIsEnlarged(false);
    document.body.style.overflow = '';
    
    // Move iframe back to normal container
    if (iframeRef.current && normalContainerRef.current) {
      normalContainerRef.current.appendChild(iframeRef.current);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEnlarged) {
        handleCompress();
      }
    };

    if (isEnlarged) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isEnlarged]);

  // Chrome Bar Component
  const ChromeBar = ({ isFullscreen = false }: { isFullscreen?: boolean }) => (
    <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-gray-800 border-b border-gray-700 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xl flex-shrink-0">🧄</span>
        <span className="text-sm font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 hidden sm:block">
          Garliq
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-400 min-w-0 px-4">
        <span className="font-semibold text-gray-300 truncate max-w-[120px] sm:max-w-[200px]">
          @{username}
        </span>
        <span className="text-gray-600 hidden sm:inline">•</span>
        <span className="text-xs text-gray-500 whitespace-nowrap hidden sm:inline">
          {formatTimestamp(timestamp)}
        </span>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={handleReload}
          disabled={isReloading}
          className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors disabled:opacity-50 group relative"
          title="Reload"
        >
          <RotateCw 
            size={16} 
            className={`text-gray-400 group-hover:text-purple-400 transition-colors ${
              isReloading ? 'animate-spin' : ''
            }`} 
          />
        </button>

        {isFullscreen ? (
          <button
            onClick={handleCompress}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors group"
            title="Exit Fullscreen"
          >
            <Minimize2 size={16} className="text-gray-400 group-hover:text-purple-400 transition-colors" />
          </button>
        ) : (
          <button
            onClick={handleEnlarge}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors group"
            title="Fullscreen"
          >
            <Maximize2 size={16} className="text-gray-400 group-hover:text-purple-400 transition-colors" />
          </button>
        )}
      </div>
    </div>
  );

  // Loading Overlay Component
  const LoadingOverlay = () => (
    isReloading ? (
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm z-10 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="text-4xl"
        >
          🧄
        </motion.div>
      </div>
    ) : null
  );

  // Create iframe element once
  const iframeElement = (
    <iframe
      ref={iframeRef}
      srcDoc={htmlCode}
      className="w-full h-full bg-white border-0"
      sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
      allow="autoplay; fullscreen"
      title="garliq-preview"
    />
  );

  return (
    <>
      {/* Normal View */}
      <div className={className}>
        <div className="h-full rounded-lg overflow-hidden border border-gray-800 shadow-2xl flex flex-col bg-gray-950">
          <ChromeBar />
          
          <div className="flex-1 relative bg-white overflow-hidden">
            <LoadingOverlay />
            <div ref={normalContainerRef} className="w-full h-full">
              {!isEnlarged && iframeElement}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen View */}
      {mounted && isEnlarged && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black z-[100] flex flex-col"
          >
            <button
              onClick={handleCompress}
              className="absolute top-4 right-4 z-10 p-2 bg-black/80 hover:bg-black rounded-full backdrop-blur-sm transition-colors md:hidden"
            >
              <X size={20} className="text-gray-400" />
            </button>

            <ChromeBar isFullscreen />
            
            <div className="flex-1 relative bg-white overflow-hidden">
              <LoadingOverlay />
              <div ref={fullscreenContainerRef} className="w-full h-full">
                {isEnlarged && iframeElement}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if htmlCode changes
  return prevProps.htmlCode === nextProps.htmlCode &&
         prevProps.username === nextProps.username &&
         prevProps.timestamp === nextProps.timestamp;
});

GarliqWebContainer.displayName = 'GarliqWebContainer';

export default GarliqWebContainer;