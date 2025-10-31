"use client";

import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

interface DisplayCardProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  date?: string;
  iconClassName?: string;
  titleClassName?: string;
}

function DisplayCard({
  className,
  icon = <Sparkles className="size-4 text-red-300" />,
  title = "Featured",
  description = "Discover amazing content",
  date = "Just now",
  iconClassName = "text-red-500",
  titleClassName = "text-red-500",
}: DisplayCardProps) {
  return (
    <div
      className={cn(
        "relative flex h-36 w-[22rem] -skew-y-[8deg] select-none flex-col justify-between rounded-xl border-2 bg-muted/70 backdrop-blur-sm px-4 py-3 transition-all duration-700 after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[20rem] after:bg-gradient-to-l after:from-background after:to-transparent after:content-[''] hover:border-white/20 hover:bg-muted [&>*]:flex [&>*]:items-center [&>*]:gap-2",
        className
      )}
    >
      <div>
        <span className="relative inline-block rounded-full bg-red-800 p-1">
          {icon}
        </span>
        <p className={cn("text-lg font-medium", titleClassName)}>{title}</p>
      </div>
      <p className="whitespace-nowrap text-lg">{description}</p>
      <p className="text-muted-foreground">{date}</p>
    </div>
  );
}

interface DisplayCardsProps {
  cards?: DisplayCardProps[];
  animationInterval?: number;
}

export default function DisplayCards({ cards, animationInterval = 3000 }: DisplayCardsProps) {
  const defaultCards = [
    {
      className: "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration:700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      className: "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration:700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      className: "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10",
    },
  ];

  const displayCards = cards || defaultCards;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % displayCards.length);
    }, animationInterval);

    return () => clearInterval(interval);
  }, [displayCards.length, animationInterval]);

  const getCardPosition = (index: number, currentIndex: number, totalCards: number) => {
    const relativeIndex = (index - currentIndex + totalCards) % totalCards;

    switch (relativeIndex) {
      case 0: // Front card
        return "[grid-area:stack] hover:-translate-y-10 transition-all duration-700 ease-in-out z-30";
      case 1: // Second card
        return "[grid-area:stack] translate-x-20 translate-y-12 hover:-translate-y-1 transition-all duration-700 ease-in-out z-20";
      case 2: // Third card
        return "[grid-area:stack] translate-x-40 translate-y-24 hover:translate-y-10 transition-all duration-700 ease-in-out z-10";
      case 3: // Fourth card (if exists)
        return "[grid-area:stack] translate-x-60 translate-y-36 hover:translate-y-20 transition-all duration-700 ease-in-out z-0";
      default: // Cards further back
        return "[grid-area:stack] translate-x-80 translate-y-48 opacity-0 transition-all duration-700 ease-in-out z-0";
    }
  };

  return (
    <div className="grid [grid-template-areas:'stack'] place-items-center opacity-100 animate-in fade-in-0 duration-700 min-h-[400px] w-full">
      {displayCards.map((cardProps, index) => {
        const positionClass = getCardPosition(index, currentIndex, displayCards.length);
        
        return (
          <DisplayCard
            key={index}
            {...cardProps}
            className={positionClass}
          />
        );
      })}
    </div>
  );
}
