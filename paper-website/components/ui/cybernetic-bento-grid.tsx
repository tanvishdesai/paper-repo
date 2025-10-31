import React, { useEffect, useRef } from 'react';
import { Brain, BarChart3, Database, Search, Key, Sparkles } from 'lucide-react';
// Reusable BentoItem component
const BentoItem = ({ className, children }: { className: string; children: React.ReactNode }) => {
    const itemRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const item = itemRef.current;
        if (!item) return;
        const handleMouseMove = (e: MouseEvent) => {
            const rect = item.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            item.style.setProperty('--mouse-x', `${x}px`);
            item.style.setProperty('--mouse-y', `${y}px`);
        };

        item.addEventListener('mousemove', handleMouseMove);

        return () => {
            item.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <div ref={itemRef} className={`bento-item ${className}`}>
            {children}
        </div>
    );
};

// Main Component
export const CyberneticBentoGrid = () => {
    return (
        <div className="w-full max-w-6xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground text-center mb-8">Core Features</h1>
            <div className="bento-grid">
                    <BentoItem className="col-span-2 row-span-2 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <Brain className="h-8 w-8 text-red-500" />
                                <h2 className="text-2xl font-bold text-foreground">AI Chat Help</h2>
                            </div>
                            <p className="text-muted-foreground">Get instant assistance with any GATE question. Our AI assistant powered by Google Gemini provides step-by-step explanations, hints, and detailed solutions in real-time.</p>
                        </div>
                        <div className="mt-4 h-32 bg-muted/50 rounded-lg flex items-center justify-center text-muted-foreground border border-border/50">
                            <div className="text-center">
                                <Brain className="h-12 w-12 mx-auto mb-2 text-red-500/70" />
                                <span className="text-sm font-medium">Powered by Gemini</span>
                            </div>
                        </div>
                    </BentoItem>

                    <BentoItem className="">
                        <div className="flex items-center gap-3 mb-3">
                            <Sparkles className="h-6 w-6 text-red-500" />
                            <h2 className="text-xl font-bold text-foreground">Vector Similarity</h2>
                        </div>
                        <p className="text-muted-foreground text-sm">Find semantically similar questions using advanced vector embeddings to discover related problems and concepts.</p>
                    </BentoItem>

                    <BentoItem className="">
                        <div className="flex items-center gap-3 mb-3">
                            <Key className="h-6 w-6 text-red-500" />
                            <h2 className="text-xl font-bold text-foreground">Free API Access</h2>
                        </div>
                        <p className="text-muted-foreground text-sm">Get your free API key for full programmatic access to the entire question database and features.</p>
                    </BentoItem>

                    <BentoItem className="row-span-2">
                        <div className="flex items-center gap-3 mb-3">
                            <Database className="h-6 w-6 text-red-500" />
                            <h2 className="text-xl font-bold text-foreground">Large Database</h2>
                        </div>
                        <p className="text-muted-foreground text-sm">Access 1000+ GATE questions  (2012-2025) across Computer Science subjects and topics.</p>
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Algorithms</span>
                                <span className="font-semibold text-red-400">76</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1">
                                <div className="bg-red-500 h-1 rounded-full" style={{width: '8.12%'}}></div>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">General Aptitude</span>
                                <span className="font-semibold text-red-400">210</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1">
                                <div className="bg-red-500 h-1 rounded-full" style={{width: '22.45%'}}></div>
                            </div>
                        </div>
                    </BentoItem>

                    <BentoItem className="col-span-2">
                        <div className="flex items-center gap-3 mb-3">
                            <BarChart3 className="h-6 w-6 text-red-500" />
                            <h2 className="text-xl font-bold text-foreground">Database Visualization</h2>
                        </div>
                        <p className="text-muted-foreground text-sm">Interactive charts and analytics showing question distribution across subjects, years, and difficulty levels.</p>
                    </BentoItem>

                    <BentoItem className="">
                        <div className="flex items-center gap-3 mb-3">
                            <Search className="h-6 w-6 text-red-500" />
                            <h2 className="text-xl font-bold text-foreground">Smart Search</h2>
                        </div>
                        <p className="text-muted-foreground text-sm">Advanced search with filters by year, marks, subtopics, and full-text search through questions.</p>
                    </BentoItem>
                </div>
            </div>
    );
};
