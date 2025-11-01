"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Database, Loader2, Filter, RotateCcw } from "lucide-react";
import * as d3 from "d3";

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: string;
  degree?: number;
  cluster?: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface Stats {
  totalQuestions: number;
  totalSubjects: number;
  totalChapters: number;
  totalSubtopics: number;
  earliestYear: number;
  latestYear: number;
}

interface GraphFilters {
  showSubjects: boolean;
  showChapters: boolean;
  showSubtopics: boolean;
  showQuestions: boolean;
  searchTerm: string;
}

/**
 * Sanitize a string to be used as an object key by replacing invalid characters
 * Must match the sanitization function in convex/questions.ts
 */
function sanitizeKey(key: string): string {
  return key
    .replace(/‐/g, '-') // Replace en-dash (U+2010) with regular hyphen
    .replace(/–/g, '-') // Replace en-dash (U+2013) with regular hyphen
    .replace(/—/g, '-') // Replace em-dash (U+2014) with regular hyphen
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
    .replace(/[^\x20-\x7E]/g, '_'); // Replace any other non-ASCII printable characters with underscore
}

export default function ExplorePage() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filters, setFilters] = useState<GraphFilters>({
    showSubjects: true,
    showChapters: true,
    showSubtopics: true,
    showQuestions: false,
    searchTerm: ""
  });
  const [showFilters, setShowFilters] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Fetch data from Convex
  const convexStats = useQuery(api.questions.getDetailedStats);
  const allQuestions = useQuery(api.questions.getAllQuestions);

  // Process Convex data into graph data
  useEffect(() => {
    if (!convexStats || !allQuestions) {
      setLoading(true);
      return;
    }

    try {
      setLoading(true);

      const nodes: GraphNode[] = [];
      const links: GraphLink[] = [];
      const nodeMap = new Map<string, GraphNode>();

      // Add root node
      const rootNode: GraphNode = {
        id: `root`,
        label: "GATE CS",
        type: "root",
        x: 0,
        y: 0,
      };
      nodes.push(rootNode);
      nodeMap.set("root", rootNode);

      // Add subject nodes
      for (const subject of convexStats.subjectList || []) {
        const sanitizedSubject = sanitizeKey(subject);
        const count = convexStats.subjects?.[sanitizedSubject] || 0;
        const subjectNode: GraphNode = {
          id: `subject-${sanitizedSubject}`,
          label: `${subject}\n(${count})`, // Display original name but use sanitized ID
          type: "subject",
        };
        nodes.push(subjectNode);
        nodeMap.set(sanitizedSubject, subjectNode);
        links.push({ source: "root", target: `subject-${sanitizedSubject}`, type: "contains" });
      }

      // Add chapter and subtopic nodes if enabled
      if (filters.showChapters || filters.showSubtopics) {
        for (const [sanitizedChapter] of Object.entries(convexStats.chapters || {})) {
          // Find the original chapter name from subtopicsByChapter (which stores original names in arrays)
          const originalChapterNames = convexStats.subtopicsByChapter?.[sanitizedChapter] || [];
          const originalChapter = originalChapterNames[0] || sanitizedChapter; // Use first original name if available
          
          if (filters.showChapters) {
            const chapterNode: GraphNode = {
              id: `chapter-${sanitizedChapter}`,
              label: originalChapter, // Display original name but use sanitized ID
              type: "chapter",
            };
            nodes.push(chapterNode);
            nodeMap.set(sanitizedChapter, chapterNode);

            // Connect to subjects
            // Need to compare sanitized chapter names
            const relatedSubjects = new Set<string>();
            allQuestions.forEach((q) => {
              if (q.chapter && sanitizeKey(q.chapter) === sanitizedChapter && q.subject) {
                relatedSubjects.add(q.subject);
              }
            });

            relatedSubjects.forEach((subject) => {
              const sanitizedSubject = sanitizeKey(subject);
              links.push({ 
                source: `subject-${sanitizedSubject}`, 
                target: `chapter-${sanitizedChapter}`, 
                type: "has_chapter" 
              });
            });
          }

          if (filters.showSubtopics) {
            const subtopics = convexStats.subtopicsByChapter?.[sanitizedChapter] || [];
            subtopics.forEach((subtopic) => {
              // Sanitize subtopic name for node ID to match the chapter key
              const sanitizedSubtopic = sanitizeKey(subtopic);
              const subtopicNode: GraphNode = {
                id: `subtopic-${sanitizedSubtopic}`,
                label: subtopic, // Display original name
                type: "subtopic",
              };

              if (!nodeMap.has(sanitizedSubtopic)) {
                nodes.push(subtopicNode);
                nodeMap.set(sanitizedSubtopic, subtopicNode);
              }

              if (filters.showChapters) {
                links.push({ 
                  source: `chapter-${sanitizedChapter}`, 
                  target: `subtopic-${sanitizedSubtopic}`, 
                  type: "has_subtopic" 
                });
              }
            });
          }
        }
      }

      // Calculate statistics
      const stats: Stats = {
        totalQuestions: convexStats.totalQuestions,
        totalSubjects: convexStats.subjectList?.length || 0,
        totalChapters: Object.keys(convexStats.chapters || {}).length,
        totalSubtopics: Object.keys(convexStats.subtopics || {}).length,
        earliestYear: convexStats.yearRange?.min || new Date().getFullYear(),
        latestYear: convexStats.yearRange?.max || new Date().getFullYear(),
      };

      setStats(stats);
      setGraphData({ nodes, links });
    } catch (error) {
      console.error("Error processing Convex data:", error);
    } finally {
      setLoading(false);
    }
  }, [convexStats, allQuestions, filters]);

  // D3 visualization setup
  useEffect(() => {
    if (!graphData || !svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg.append("g");

    // Create simulation
    const simulation = d3.forceSimulation(graphData.nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(graphData.links).id((d) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    simulationRef.current = simulation;
    gRef.current = g.node() as SVGGElement;

    // Add links
    const link = g
      .selectAll<SVGLineElement, GraphLink>("line")
      .data(graphData.links)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1.5);

    // Add nodes
    const node = g
      .selectAll<SVGCircleElement, GraphNode>("circle")
      .data(graphData.nodes)
      .enter()
      .append("circle")
      .attr("r", (d) => (d.type === "root" ? 15 : d.type === "subject" ? 10 : 6))
      .attr("fill", (d) => {
        if (d.type === "root") return "#ff6b6b";
        if (d.type === "subject") return "#4c6ef5";
        if (d.type === "chapter") return "#748ffc";
        return "#a5d8ff";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .call(
        d3.drag<SVGCircleElement, GraphNode>()
          .on("start", dragStarted)
          .on("drag", dragged)
          .on("end", dragEnded)
      )
      .on("click", (event, d) => setSelectedNode(d));

    // Add labels
    const labels = g
      .selectAll<SVGTextElement, GraphNode>("text")
      .data(graphData.nodes)
      .enter()
      .append("text")
      .attr("font-size", (d) => (d.type === "root" ? 12 : 10))
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .attr("fill", "#fff")
      .attr("font-weight", (d) => (d.type === "root" || d.type === "subject" ? "bold" : "normal"))
      .text((d) => d.label.split("\n")[0])
      .style("pointer-events", "none");

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as GraphNode).x || 0)
        .attr("y1", (d) => (d.source as GraphNode).y || 0)
        .attr("x2", (d) => (d.target as GraphNode).x || 0)
        .attr("y2", (d) => (d.target as GraphNode).y || 0);

      node
        .attr("cx", (d) => d.x || 0)
        .attr("cy", (d) => d.y || 0);

      labels
        .attr("x", (d) => d.x || 0)
        .attr("y", (d) => d.y || 0);
    });

    function dragStarted(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragEnded(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [graphData]);

  const handleResetZoom = () => {
    if (svgRef.current && zoomRef.current) {
      const svgElement = svgRef.current;
      const transform = d3.zoomIdentity
        .translate(svgElement.clientWidth / 2, svgElement.clientHeight / 2);
      d3.select(svgElement)
        .transition()
        .duration(750)
        .call(zoomRef.current.transform, transform);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Question Knowledge Graph</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Loading knowledge graph...</p>
          </div>
        </div>
      )}

      {!loading && stats && (
        <div className="flex gap-4 p-4">
          <div className="flex-1">
            <svg ref={svgRef} className="w-full h-screen border border-border rounded-lg" />
          </div>

          <div className="w-80 space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Database className="h-5 w-5" />
                Statistics
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Questions:</span>
                  <span className="font-semibold">{stats.totalQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subjects:</span>
                  <span className="font-semibold">{stats.totalSubjects}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chapters:</span>
                  <span className="font-semibold">{stats.totalChapters}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtopics:</span>
                  <span className="font-semibold">{stats.totalSubtopics}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Year Range:</span>
                  <span className="font-semibold">{stats.earliestYear} - {stats.latestYear}</span>
                </div>
              </div>
            </Card>

            <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Hide" : "Show"} Filters
            </Button>

            {showFilters && (
              <Card className="p-4 space-y-3">
                <h3 className="font-semibold">Graph Filters</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.showSubjects}
                      onChange={(e) => setFilters({ ...filters, showSubjects: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Show Subjects</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.showChapters}
                      onChange={(e) => setFilters({ ...filters, showChapters: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Show Chapters</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.showSubtopics}
                      onChange={(e) => setFilters({ ...filters, showSubtopics: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Show Subtopics</span>
                  </label>
                </div>
                <Button onClick={handleResetZoom} variant="secondary" size="sm" className="w-full">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset View
                </Button>
              </Card>
            )}

            {selectedNode && (
              <Card className="p-4">
                <h3 className="font-semibold mb-2">{selectedNode.label}</h3>
                <Badge variant="outline">{selectedNode.type}</Badge>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
