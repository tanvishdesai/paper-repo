'use client';

import React, { useState, useEffect } from 'react';
import Snowfall from 'react-snowfall';
import { Snowflake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function SnowfallWrapper() {
  const [enabled, setEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {enabled && (
        <div className="fixed inset-0 pointer-events-none z-0" style={{ width: '100vw', height: '100vh' }}>
          <Snowfall />
        </div>
      )}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "fixed bottom-4 left-4 z-[10000] rounded-full bg-background/50 backdrop-blur-sm border border-border hover:bg-background/80 transition-colors",
          enabled ? "text-primary" : "text-muted-foreground"
        )}
        onClick={() => setEnabled(!enabled)}
        aria-label="Toggle snowfall"
        title="Toggle snowfall"
      >
        <Snowflake className="h-5 w-5" />
      </Button>
    </>
  );
}
