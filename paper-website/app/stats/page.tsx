"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { BookOpen, TrendingUp, BarChart3, Activity, Target, ArrowLeft, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Pie
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

export default function StatsPage() {
  // Fetch data from Convex
  const statsData = useQuery(api.questions.getDetailedStats);

  // Subject comparison state
  const [subject1, setSubject1] = useState<string>('');
  const [subject2, setSubject2] = useState<string>('');
  const [selectedSubtopic1, setSelectedSubtopic1] = useState<string>('all');
  const [selectedSubtopic2, setSelectedSubtopic2] = useState<string>('all');

  // --- delay rendering until we have statsData, to prevent changing hook order ---
  const isLoading = !statsData;

  // Get subtopics for a specific subject - only defined after statsData is present
  const getAvailableSubtopicsForSubject = useCallback((subject: string) => {
    if (!subject || !statsData) return [];

    const subtopics = new Set<string>();
    statsData.subjectComparisonData.forEach(item => {
      if (item.subject === subject && item.subtopic) {
        subtopics.add(item.subtopic);
      }
    });
    return Array.from(subtopics).sort();
  }, [statsData]);

  // Reset selected subtopics when subjects change, only after data is ready
  useEffect(() => {
    if (!statsData) return;
    if (subject1) {
      const availableSubtopics1 = getAvailableSubtopicsForSubject(subject1);
      if (selectedSubtopic1 !== 'all' && !availableSubtopics1.includes(selectedSubtopic1)) {
        setSelectedSubtopic1('all');
      }
    }
    if (subject2) {
      const availableSubtopics2 = getAvailableSubtopicsForSubject(subject2);
      if (selectedSubtopic2 !== 'all' && !availableSubtopics2.includes(selectedSubtopic2)) {
        setSelectedSubtopic2('all');
      }
    }
  }, [subject1, subject2, statsData, selectedSubtopic1, selectedSubtopic2, getAvailableSubtopicsForSubject]);

  // Process comparison data for the selected subjects and subtopic
  const getComparisonChartData = useCallback(() => {
    if (!subject1 || !subject2 || !statsData) return [];

    const filteredData = statsData.subjectComparisonData.filter(item => {
      if (item.subject === subject1) {
        // For subject1, check if it matches the selected subtopic for subject1
        const matchesSubtopic1 = selectedSubtopic1 === 'all' || item.subtopic === selectedSubtopic1;
        return matchesSubtopic1;
      } else if (item.subject === subject2) {
        // For subject2, check if it matches the selected subtopic for subject2
        const matchesSubtopic2 = selectedSubtopic2 === 'all' || item.subtopic === selectedSubtopic2;
        return matchesSubtopic2;
      }
      return false; // Only include data for the two selected subjects
    });

    // Group by year and subject
    const yearSubjectMap = new Map<string, { [subject: string]: number }>();

    filteredData.forEach(item => {
      const key = item.year;
      if (!yearSubjectMap.has(key)) {
        yearSubjectMap.set(key, {});
      }
      const yearData = yearSubjectMap.get(key)!;
      yearData[item.subject] = (yearData[item.subject] || 0) + item.count;
    });

    // Convert to chart data format
    return Array.from(yearSubjectMap.entries())
      .map(([year, subjects]) => ({
        year: parseInt(year),
        [subject1]: subjects[subject1] || 0,
        [subject2]: subjects[subject2] || 0
      }))
      .sort((a, b) => a.year - b.year);
  }, [statsData, subject1, subject2, selectedSubtopic1, selectedSubtopic2]);

  if (isLoading) {
    // Always call hooks before this return.
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading statistics from Convex...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="flex items-center gap-2">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              Statistics Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              {statsData.totalQuestions.toLocaleString()} Questions
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData.totalQuestions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all years</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Years Covered</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData.yearDistribution.length}</div>
              <p className="text-xs text-muted-foreground">2007 - 2025</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData.subjectDistribution.length}</div>
              <p className="text-xs text-muted-foreground">Computer Science topics</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Questions/Year</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(statsData.totalQuestions / statsData.yearDistribution.length)}
              </div>
              <p className="text-xs text-muted-foreground">Per examination year</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Year Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Questions by Year</CardTitle>
              <CardDescription>Distribution of questions across examination years</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={statsData.yearDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Subject Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Questions by Subject</CardTitle>
              <CardDescription>Top 10 subjects by question count</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statsData.subjectDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Marks Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Marks Distribution</CardTitle>
              <CardDescription>1-mark vs 2-mark questions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={statsData.marksDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${((percent as number) * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statsData.marksDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Theory vs Practical */}
          <Card>
            <CardHeader>
              <CardTitle>Theoretical vs Practical</CardTitle>
              <CardDescription>Question type distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={statsData.theoryPracticalDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${((percent as number) * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statsData.theoryPracticalDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>

        {/* Subject Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Comparison</CardTitle>
            <CardDescription>Compare question counts between two subjects over time</CardDescription>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Subject 1</label>
                <Select value={subject1} onValueChange={setSubject1}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select subject 1" />
                  </SelectTrigger>
                  <SelectContent>
                    {statsData.allSubjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Subject 2</label>
                <Select value={subject2} onValueChange={setSubject2}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select subject 2" />
                  </SelectTrigger>
                  <SelectContent>
                    {statsData.allSubjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Subtopic for {subject1 || 'Subject 1'}</label>
                <Select
                  value={selectedSubtopic1}
                  onValueChange={setSelectedSubtopic1}
                  disabled={!subject1}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All subtopics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subtopics</SelectItem>
                    {getAvailableSubtopicsForSubject(subject1).map((subtopic) => (
                      <SelectItem key={subtopic} value={subtopic}>
                        {subtopic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Subtopic for {subject2 || 'Subject 2'}</label>
                <Select
                  value={selectedSubtopic2}
                  onValueChange={setSelectedSubtopic2}
                  disabled={!subject2}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All subtopics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subtopics</SelectItem>
                    {getAvailableSubtopicsForSubject(subject2).map((subtopic) => (
                      <SelectItem key={subtopic} value={subtopic}>
                        {subtopic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {subject1 && subject2 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={getComparisonChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={subject1}
                    stroke="#8884d8"
                    strokeWidth={2}
                    name={`${subject1}${selectedSubtopic1 !== 'all' ? ` (${selectedSubtopic1})` : ''}`}
                  />
                  <Line
                    type="monotone"
                    dataKey={subject2}
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name={`${subject2}${selectedSubtopic2 !== 'all' ? ` (${selectedSubtopic2})` : ''}`}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Please select two subjects to compare
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Chapters and Subtopics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Top Chapters</CardTitle>
              <CardDescription>Most frequent chapters by question count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statsData.chapterDistribution.slice(0, 10).map((chapter, index) => (
                  <div key={chapter.chapter} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="text-sm font-medium">{chapter.chapter}</span>
                    </div>
                    <Badge variant="secondary">{chapter.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Subtopics</CardTitle>
              <CardDescription>Most frequent subtopics by question count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statsData.topSubtopics.slice(0, 10).map((subtopic, index) => (
                  <div key={subtopic.subtopic} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="text-sm font-medium">{subtopic.subtopic}</span>
                    </div>
                    <Badge variant="secondary">{subtopic.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
