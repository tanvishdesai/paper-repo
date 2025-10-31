"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Key, Code, Terminal } from "lucide-react";

export default function ApiDocsPage() {
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
                  <Code className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">API Documentation</h1>
                  <p className="text-xs text-muted-foreground">
                    RESTful API for GATE Questions
                  </p>
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Introduction */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Access thousands of GATE questions programmatically through our RESTful API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Base URL</h3>
              <code className="block bg-muted p-3 rounded-md text-sm">
                https://your-domain.com/api/v1
              </code>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Authentication</h3>
              <p className="text-sm text-muted-foreground mb-2">
                All API requests require an API key. Include your key in the request header:
              </p>
              <code className="block bg-muted p-3 rounded-md text-sm">
                X-API-Key: your_api_key_here
              </code>
              <p className="text-sm text-muted-foreground mt-2">
                Or use Bearer token:
              </p>
              <code className="block bg-muted p-3 rounded-md text-sm">
                Authorization: Bearer your_api_key_here
              </code>
            </div>
            <div className="pt-2">
              <Button asChild>
                <Link href="/api-keys">
                  <Key className="h-4 w-4 mr-2" />
                  Get Your API Key
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Rate Limits */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Rate Limits</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Badge>Default</Badge>
                <span>1,000 requests per day</span>
              </li>
              <li className="text-muted-foreground">
                Rate limit information is included in response headers
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">API Endpoints</h2>

          {/* Get All Subjects */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400">
                  GET
                </Badge>
                <code className="text-sm">/subjects</code>
              </div>
              <CardTitle className="text-lg">Get All Subjects</CardTitle>
              <CardDescription>
                Returns a list of all available subjects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Example Request</h4>
                <code className="block bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`curl -X GET "https://your-domain.com/api/v1/subjects" \\
  -H "X-API-Key: your_api_key_here"`}
                </code>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Example Response</h4>
                <code className="block bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`{
  "success": true,
  "data": [
    {
      "name": "Algorithms",
      "fileName": "Algorithms",
      "description": "...",
      "icon": "🔄"
    },
    ...
  ]
}`}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Get Questions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400">
                  GET
                </Badge>
                <code className="text-sm">/questions</code>
              </div>
              <CardTitle className="text-lg">Get Questions</CardTitle>
              <CardDescription>
                Retrieve questions with optional filtering, sorting, and pagination
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Query Parameters</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <code className="bg-muted px-2 py-1 rounded">subject</code>
                    <span className="text-muted-foreground">Filter by subject name (e.g., &quot;Algorithms&quot;)</span>
                  </div>
                  <div className="flex gap-2">
                    <code className="bg-muted px-2 py-1 rounded">year</code>
                    <span className="text-muted-foreground">Filter by exam year (e.g., 2023)</span>
                  </div>
                  <div className="flex gap-2">
                    <code className="bg-muted px-2 py-1 rounded">marks</code>
                    <span className="text-muted-foreground">Filter by marks (e.g., 1, 2)</span>
                  </div>
                  <div className="flex gap-2">
                    <code className="bg-muted px-2 py-1 rounded">type</code>
                    <span className="text-muted-foreground">Filter by type (theoretical/practical)</span>
                  </div>
                  <div className="flex gap-2">
                    <code className="bg-muted px-2 py-1 rounded">search</code>
                    <span className="text-muted-foreground">Search in question text and topics</span>
                  </div>
                  <div className="flex gap-2">
                    <code className="bg-muted px-2 py-1 rounded">sort</code>
                    <span className="text-muted-foreground">Sort by (year-desc, year-asc, marks-desc, marks-asc)</span>
                  </div>
                  <div className="flex gap-2">
                    <code className="bg-muted px-2 py-1 rounded">limit</code>
                    <span className="text-muted-foreground">Number of results per page (default: 100, max: 1000)</span>
                  </div>
                  <div className="flex gap-2">
                    <code className="bg-muted px-2 py-1 rounded">offset</code>
                    <span className="text-muted-foreground">Pagination offset (default: 0)</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Example Request - Get All Questions</h4>
                <code className="block bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`curl -X GET "https://your-domain.com/api/v1/questions" \\
  -H "X-API-Key: your_api_key_here"`}
                </code>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Example Request - Filter by Subject and Year</h4>
                <code className="block bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`curl -X GET "https://your-domain.com/api/v1/questions?subject=Algorithms&year=2023" \\
  -H "X-API-Key: your_api_key_here"`}
                </code>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Example Request - Search and Paginate</h4>
                <code className="block bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`curl -X GET "https://your-domain.com/api/v1/questions?search=sorting&limit=50&offset=0" \\
  -H "X-API-Key: your_api_key_here"`}
                </code>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Example Response</h4>
                <code className="block bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`{
  "success": true,
  "data": [
    {
      "year": 2023,
      "paper_code": "CS",
      "question_no": "Q.25",
      "question_text": "What is the time complexity...",
      "subject": "Algorithms",
      "chapter": "Sorting",
      "subtopic": "Merge Sort",
      "theoretical_practical": "theoretical",
      "marks": 2,
      "provenance": "GATE 2023",
      "confidence": 0.95
    },
    ...
  ],
  "pagination": {
    "total": 150,
    "limit": 100,
    "offset": 0,
    "hasMore": true
  },
  "filters": {
    "subject": null,
    "year": null,
    "marks": null,
    "type": null,
    "search": null,
    "sortBy": "year-desc"
  }
}`}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Code Examples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Code Examples
              </CardTitle>
              <CardDescription>
                Use the API in your favorite programming language
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* JavaScript Example */}
              <div>
                <h4 className="font-semibold mb-2">JavaScript (fetch)</h4>
                <code className="block bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`const apiKey = 'your_api_key_here';

fetch('https://your-domain.com/api/v1/questions?subject=Algorithms', {
  headers: {
    'X-API-Key': apiKey
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`}
                </code>
              </div>

              {/* Python Example */}
              <div>
                <h4 className="font-semibold mb-2">Python (requests)</h4>
                <code className="block bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`import requests

api_key = 'your_api_key_here'
url = 'https://your-domain.com/api/v1/questions'

headers = {
    'X-API-Key': api_key
}

params = {
    'subject': 'Algorithms',
    'year': 2023,
    'limit': 50
}

response = requests.get(url, headers=headers, params=params)
data = response.json()
print(data)`}
                </code>
              </div>

              {/* Node.js Example */}
              <div>
                <h4 className="font-semibold mb-2">Node.js (axios)</h4>
                <code className="block bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`const axios = require('axios');

const apiKey = 'your_api_key_here';

axios.get('https://your-domain.com/api/v1/questions', {
  headers: {
    'X-API-Key': apiKey
  },
  params: {
    subject: 'Algorithms',
    marks: 2
  }
})
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error('Error:', error);
  });`}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Error Responses */}
          <Card>
            <CardHeader>
              <CardTitle>Error Responses</CardTitle>
              <CardDescription>
                Common error codes and their meanings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <code className="bg-muted px-2 py-1 rounded mr-2">401 Unauthorized</code>
                  <span className="text-muted-foreground">Missing or invalid API key</span>
                </div>
                <div>
                  <code className="bg-muted px-2 py-1 rounded mr-2">404 Not Found</code>
                  <span className="text-muted-foreground">Resource not found</span>
                </div>
                <div>
                  <code className="bg-muted px-2 py-1 rounded mr-2">429 Too Many Requests</code>
                  <span className="text-muted-foreground">Rate limit exceeded</span>
                </div>
                <div>
                  <code className="bg-muted px-2 py-1 rounded mr-2">500 Internal Server Error</code>
                  <span className="text-muted-foreground">Server error</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Need help? Have questions about the API?
          </p>
          <Button asChild variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

