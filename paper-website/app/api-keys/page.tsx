"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowLeft,
  BookOpen,
  Key,
  Copy,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Power
} from "lucide-react";

export default function ApiKeysPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [keyName, setKeyName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Convex queries and mutations
  const apiKeys = useQuery(api.apiKeys.list);
  const generateKey = useMutation(api.apiKeys.generate);
  const revokeKey = useMutation(api.apiKeys.revoke);
  const toggleActive = useMutation(api.apiKeys.toggleActive);
  const storeUser = useMutation(api.users.store);

  // Store user in Convex when they sign in
  useEffect(() => {
    if (isSignedIn && user) {
      storeUser().catch(console.error);
    }
  }, [isSignedIn, user, storeUser]);

  const handleGenerateKey = async () => {
    if (!keyName.trim()) {
      alert("Please enter a name for your API key");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateKey({ name: keyName });
      setGeneratedKey(result.key);
      setKeyName("");
    } catch (error) {
      console.error("Failed to generate API key:", error);
      alert("Failed to generate API key. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
      return;
    }

    try {
      await revokeKey({ keyId: keyId as Id<"apiKeys"> });
    } catch (error) {
      console.error("Failed to revoke API key:", error);
      alert("Failed to revoke API key. Please try again.");
    }
  };

  const handleToggleActive = async (keyId: string) => {
    try {
      await toggleActive({ keyId: keyId as Id<"apiKeys"> });
    } catch (error) {
      console.error("Failed to toggle API key:", error);
      alert("Failed to toggle API key. Please try again.");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">GATE Question Bank</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto text-center p-8">
            <AlertCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in to manage your API keys
            </p>
            <Button asChild className="w-full">
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Key className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">API Keys</h1>
                  <p className="text-xs text-muted-foreground">
                    Manage your API access
                  </p>
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Info Banner */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">API Access</CardTitle>
            <CardDescription>
              Generate API keys to access the GATE Question Bank programmatically. 
              View the <Link href="/api-docs" className="text-primary hover:underline">API documentation</Link> for usage details.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Generate New Key */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Generate New API Key
            </CardTitle>
            <CardDescription>
              Create a new API key to access questions data programmatically
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="API key name (e.g., My App, Production, Testing)"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerateKey()}
                className="flex-1"
              />
              <Button 
                onClick={handleGenerateKey}
                disabled={isGenerating || !keyName.trim()}
              >
                {isGenerating ? "Generating..." : "Generate Key"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Generated Key Dialog */}
        {generatedKey && (
          <Card className="mb-8 border-green-500/50 bg-green-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                API Key Generated Successfully
              </CardTitle>
              <CardDescription>
                <strong>Important:</strong> Copy this key now. For security reasons, it won&apos;t be shown again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={generatedKey}
                  readOnly
                  type={showKey ? "text" : "password"}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopyKey(generatedKey, "new")}
                >
                  {copiedId === "new" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGeneratedKey(null)}
                className="mt-4"
              >
                I&apos;ve saved my key
              </Button>
            </CardContent>
          </Card>
        )}

        {/* API Keys List */}
        <Card>
          <CardHeader>
            <CardTitle>Your API Keys</CardTitle>
            <CardDescription>
              {apiKeys?.length || 0} active API key{apiKeys?.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!apiKeys || apiKeys.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Key className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No API keys yet</p>
                <p className="text-sm">Generate your first API key to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <Card key={key.id} className="border-2">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{key.name}</h3>
                            {key.isActive ? (
                              <Badge variant="default" className="bg-green-500">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground font-mono mb-2">
                            {key.keyPrefix}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span>Created: {formatDate(key.createdAt)}</span>
                            {key.lastUsedAt && (
                              <span>Last used: {formatDate(key.lastUsedAt)}</span>
                            )}
                            <span>Limit: {key.rateLimit} req/day</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleToggleActive(key.id)}
                            title={key.isActive ? "Deactivate" : "Activate"}
                          >
                            <Power className={`h-4 w-4 ${key.isActive ? "text-green-500" : ""}`} />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleRevokeKey(key.id)}
                            title="Delete API key"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

