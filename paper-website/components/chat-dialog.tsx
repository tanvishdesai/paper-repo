"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, Bot, User, Lightbulb, ListOrdered, BookOpen } from 'lucide-react';
import { Doc } from '@/convex/_generated/dataModel';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isJson?: boolean;
  structuredData?: {
    explanation: string;
    steps: string[];
    key_concepts: string[];
  };
}

interface ChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  question: Doc<"questions"> | null;
}

export function ChatDialog({ isOpen, onClose, question }: ChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = useCallback(async (message: string, isInitial: boolean = false) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    // Add user message (skip for initial message to avoid duplication)
    if (!isInitial) {
      setMessages(prev => [...prev, userMessage]);
    }
    setInputMessage('');
    setIsLoading(true);

    try {
      // Prepare messages for API (include initial prompt if this is the first message)
      const apiMessages = isInitial ? [{
        role: 'user',
        content: message
      }] : messages.concat(userMessage).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          question: question,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const rawContent = data.response;
      
      // Try to parse JSON response
      let structuredData = null;
      let isJson = false;
      try {
        // Attempt to clean markdown if present (e.g. ```json ... ```)
        const cleanContent = rawContent.replace(/```json\n?|\n?```/g, "").trim();
        structuredData = JSON.parse(cleanContent);
        if (structuredData.explanation && structuredData.steps) {
             isJson = true;
        }
      } catch {
        // Not JSON, continue as text
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: rawContent,
        timestamp: new Date(),
        isJson,
        structuredData
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Focus input after sending
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isLoading, messages, question]);

  // Initialize chat with question explanation when dialog opens
  useEffect(() => {
    if (isOpen && question && !isInitialized) {
      const initialPrompt = `Look at this question and explain its solution to me like I'm a novice. Explain each term and calculation from the basics:

Question: ${question.questionType}
${question.question ? `Question: ${question.question}` : ''}
Subject: ${question.subject}
Topic: ${question.chapter}
Type: ${question.questionType}
Year: ${question.year}

Please explain step by step, starting from the very basics.`;

      handleSendMessage(initialPrompt, true);
      setIsInitialized(true);
    }
  }, [isOpen, question, isInitialized, handleSendMessage]);

  // Reset when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setIsInitialized(false);
      setInputMessage('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputMessage);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Assistant
          </DialogTitle>
        </DialogHeader>

        <ScrollArea ref={scrollAreaRef} className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                    {message.role === 'assistant' && message.isJson && message.structuredData ? (
                        <div className="space-y-4 py-1">
                            {/* Summary Section */}
                            <div className="flex gap-2 items-start">
                                <Lightbulb className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-sm mb-1">Explanation</h4>
                                    <div className="text-sm text-foreground/90 prose prose-sm prose-slate max-w-none prose-p:my-1 prose-headings:my-1 prose-strong:text-foreground">
                                      <ReactMarkdown>{message.structuredData.explanation}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Steps Section */}
                            <div className="flex gap-2 items-start bg-background/50 p-3 rounded-md">
                                <ListOrdered className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <div className="w-full">
                                    <h4 className="font-semibold text-sm mb-2">Step-by-Step Guide</h4>
                                    <ol className="list-none space-y-2 m-0 p-0 text-sm">
                                        {message.structuredData.steps.map((step, i) => (
                                            <li key={i} className="flex gap-2 relative pl-1">
                                                <span className="font-mono text-xs text-muted-foreground mt-0.5">{i + 1}.</span>
                                                <div className="text-foreground/90 prose prose-sm prose-slate max-w-none prose-p:my-0 prose-strong:text-foreground">
                                                  <ReactMarkdown>{step}</ReactMarkdown>
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            </div>

                            {/* Key Concepts Section */}
                            {message.structuredData.key_concepts && message.structuredData.key_concepts.length > 0 && (
                                <div className="flex gap-2 items-start pt-1">
                                    <BookOpen className="h-4 w-4 text-blue-500 flex-shrink-0 mt-1" />
                                    <div>
                                        <h4 className="font-semibold text-xs mb-2 uppercase tracking-wide text-muted-foreground">Key Concepts</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {message.structuredData.key_concepts.map((concept, i) => (
                                                <Badge key={i} variant="secondary" className="text-xs">
                                                    {concept}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                      <div className="text-sm leading-relaxed prose prose-sm prose-slate max-w-none prose-p:my-2 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-pre:my-2 prose-code:text-xs prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                        {message.role === 'assistant' ? (
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        ) : (
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        )}
                      </div>
                    )}
                  
                  <div className="text-xs opacity-70 mt-1">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="flex gap-2 pt-4 border-t">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask a question..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !inputMessage.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
