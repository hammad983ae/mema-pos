import { useEffect, useRef } from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

export function usePerformanceMonitor(componentName: string) {
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef<number>(0);
  const metricsRef = useRef<PerformanceMetric[]>([]);

  useEffect(() => {
    mountTimeRef.current = performance.now();
    renderCountRef.current = 0;

    return () => {
      const unmountTime = performance.now();
      const totalLifetime = unmountTime - mountTimeRef.current;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Performance metrics for ${componentName}:`, {
          totalLifetime: `${totalLifetime.toFixed(2)}ms`,
          renderCount: renderCountRef.current,
          avgRenderTime: metricsRef.current.length > 0 
            ? `${(metricsRef.current.reduce((sum, m) => sum + m.value, 0) / metricsRef.current.length).toFixed(2)}ms`
            : 'N/A'
        });
      }
    };
  }, [componentName]);

  useEffect(() => {
    renderCountRef.current += 1;
    const renderStart = performance.now();

    // Measure render time
    setTimeout(() => {
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;
      
      metricsRef.current.push({
        name: `render-${renderCountRef.current}`,
        value: renderTime,
        timestamp: renderEnd,
      });

      // Keep only last 10 measurements
      if (metricsRef.current.length > 10) {
        metricsRef.current = metricsRef.current.slice(-10);
      }
    }, 0);
  });

  const measureAsync = async (operationName: string, operation: () => Promise<any>) => {
    const start = performance.now();
    try {
      const result = await operation();
      const end = performance.now();
      const duration = end - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName}.${operationName}: ${duration.toFixed(2)}ms`);
      }
      
      metricsRef.current.push({
        name: operationName,
        value: duration,
        timestamp: end,
      });
      
      return result;
    } catch (error) {
      const end = performance.now();
      const duration = end - start;
      console.error(`${componentName}.${operationName} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  };

  return {
    measureAsync,
    renderCount: renderCountRef.current,
  };
}
