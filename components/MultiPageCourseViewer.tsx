'use client';
import { useRef, useState, useEffect } from 'react';
import { RotateCcw, Maximize2, Minimize2 } from 'lucide-react';

interface MultiPageCourseViewerProps {
  htmlCode: string;
  className?: string;
}

export default function MultiPageCourseViewer({ htmlCode, className = '' }: MultiPageCourseViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [key, setKey] = useState(0);

  const handleReload = () => {
    setKey(prev => prev + 1);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      iframeRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Minimal Control Bar - Only shown on hover */}
      <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
        <button
          onClick={handleReload}
          className="p-2 bg-black/80 hover:bg-black rounded-lg backdrop-blur-sm transition-colors"
          title="Reload"
        >
          <RotateCcw size={16} className="text-white" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-black/80 hover:bg-black rounded-lg backdrop-blur-sm transition-colors"
          title="Fullscreen"
        >
          {isFullscreen ? (
            <Minimize2 size={16} className="text-white" />
          ) : (
            <Maximize2 size={16} className="text-white" />
          )}
        </button>
      </div>

      {/* Clean iframe - no wrapper, no interference */}
      <iframe
        key={key}
        ref={iframeRef}
        srcDoc={htmlCode}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
        allow="fullscreen"
        title="course-viewer"
        style={{
          background: 'white',
          colorScheme: 'normal'
        }}
      />
    </div>
  );
}