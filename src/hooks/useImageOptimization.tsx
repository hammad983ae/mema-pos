import { useState, useEffect, useRef } from 'react';

interface ImageOptimizationOptions {
  lazy?: boolean;
  placeholder?: string;
  fallback?: string;
}

export function useImageOptimization(src: string, options: ImageOptimizationOptions = {}) {
  const { lazy = true, placeholder, fallback } = options;
  const [currentSrc, setCurrentSrc] = useState(placeholder || '');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!lazy) {
      loadImage();
      return;
    }

    // Setup intersection observer for lazy loading
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
            observerRef.current?.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src, lazy]);

  const loadImage = () => {
    const img = new Image();
    
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoading(false);
      setHasError(false);
    };
    
    img.onerror = () => {
      setCurrentSrc(fallback || '');
      setIsLoading(false);
      setHasError(true);
    };
    
    img.src = src;
  };

  return {
    src: currentSrc,
    isLoading,
    hasError,
    ref: imgRef,
  };
}