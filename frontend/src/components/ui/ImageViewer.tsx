import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Download, X } from 'lucide-react';

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt?: string;
}

export default function ImageViewer({ isOpen, onClose, src, alt }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '=' || e.key === '+') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, scale, position]);

  if (!isOpen) return null;

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.1, 5));
    } else {
      setScale((prev) => Math.max(prev - 0.1, 0.5));
    }
  };

  // Dragging start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  // Dragging move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  // Dragging end
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    if (scale !== 1) {
      handleReset();
    } else {
      setScale(2);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = src;
    link.download = alt || 'downloaded-image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md select-none">
      {/* Backdrop Close Click area */}
      <div className="absolute inset-0 cursor-zoom-out" onClick={onClose} />

      {/* Top Header with title and Close button */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
        <span className="text-sm font-medium text-white/80 truncate max-w-[70%]">
          {alt || 'Image Viewer'}
        </span>
        <button
          onClick={onClose}
          className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-200"
          title="Close (Esc)"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Image Container */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={src}
          alt={alt}
          onDoubleClick={handleDoubleClick}
          draggable={false}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            maxHeight: '85vh',
            maxWidth: '90vw',
            objectFit: 'contain',
          }}
          className="shadow-2xl rounded-sm pointer-events-auto"
        />
      </div>

      {/* Floating Toolbar at the bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-4 py-2 bg-neutral-900/90 border border-white/10 rounded-full shadow-2xl backdrop-blur-md">
        <button
          onClick={handleZoomOut}
          disabled={scale <= 0.5}
          className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all duration-200"
          title="Zoom Out (-)"
        >
          <ZoomOut size={18} />
        </button>
        <span className="text-xs font-mono text-white/80 min-w-[50px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          disabled={scale >= 5}
          className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all duration-200"
          title="Zoom In (+)"
        >
          <ZoomIn size={18} />
        </button>
        <div className="h-4 w-px bg-white/10 mx-1" />
        <button
          onClick={handleReset}
          className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
          title="Reset Zoom (0)"
        >
          <RotateCcw size={17} />
        </button>
        <button
          onClick={handleDownload}
          className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
          title="Download"
        >
          <Download size={17} />
        </button>
      </div>
    </div>
  );
}
