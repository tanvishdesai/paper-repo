'use client';

import { useEffect, useState } from 'react';

export default function SnowOverlay() {
  const [snowflakes, setSnowflakes] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    // Configuration
    const SNOWFLAKE_COUNT = 150;
    
    // Helper to generate a simplified unique ID since we don't have uuid
    const generateId = () => Math.random().toString(36).substr(2, 9);
    
    const elements = Array.from({ length: SNOWFLAKE_COUNT }).map((_, i) => {
      // Randomize properties for natural effect
      const left = Math.random() * 100; // 0% to 100%
      const animationDuration = 5 + Math.random() * 10; // 5s to 15s
      const opacity = Math.random() * 0.5 + 0.3; // 0.3 to 0.8
      const size = Math.random() * 1; // 1px to 4px
      const delay = Math.random() * 10; // Start at different times
      
      return (
        <div
          key={i}
          className="snowflake"
          style={{
            left: `${left}%`,
            width: `${size}px`,
            height: `${size}px`,
            opacity: opacity,
            animationDuration: `${animationDuration}s`,
            animationDelay: `-${delay}s`, // Negative delay starts animation mid-fall
          }}
        />
      );
    });

    setSnowflakes(elements);
  }, []);

  return (
    <div 
      aria-hidden="true" 
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
    >
      {snowflakes}
    </div>
  );
}
