"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Database, Network, Loader2, Info, Zap, TrendingUp, Filter, Search, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
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

export default function ExplorePage() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [filters, setFilters] = useState<GraphFilters>({
    showSubjects: true,
    showChapters: true,
    showSubtopics: true,
    showQuestions: false, // Start with questions hidden to avoid clutter
    searchTerm: ""
  });
  const [showFilters, setShowFilters] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch graph data and stats in parallel
        const [graphResponse, statsResponse] = await Promise.all([
          fetch("/api/v1/graph?limit=500"), // Increased limit for better visualization
          fetch("/api/v1/stats")
        ]);

        if (graphResponse.ok) {
          const graphResult = await graphResponse.json();
          const data = graphResult.data as GraphData;

          // Process nodes: calculate degrees and assign clusters
          const nodeMap = new Map(data.nodes.map(node => [node.id, node]));
          const linkCounts = new Map<string, number>();

          // Calculate node degrees (number of connections)
          data.nodes.forEach(node => {
            linkCounts.set(node.id, 0);
          });

          data.links.forEach(link => {
            const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
            const targetId = typeof link.target === 'string' ? link.target : link.target.id;
            linkCounts.set(sourceId, (linkCounts.get(sourceId) || 0) + 1);
            linkCounts.set(targetId, (linkCounts.get(targetId) || 0) + 1);
          });

          // Assign degrees and initialize positions
          data.nodes.forEach((node, index) => {
            node.degree = linkCounts.get(node.id) || 0;
            // Better initial positioning based on node type
            const angle = (index / data.nodes.length) * 2 * Math.PI;
            const radius = 300 + Math.random() * 200;
            node.x = Math.cos(angle) * radius;
            node.y = Math.sin(angle) * radius;
            node.fx = null;
            node.fy = null;
          });

          // Simple clustering based on node type
          const typeClusters: { [key: string]: number } = {
            'Subject': 0,
            'Chapter': 1,
            'Subtopic': 2,
            'Question': 3
          };

          data.nodes.forEach(node => {
            node.cluster = typeClusters[node.type] || 0;
          });

          setGraphData(data);
        }

        if (statsResponse.ok) {
          const statsResult = await statsResponse.json();
          setStats(statsResult.data);
        }
      } catch (error) {
        console.error("Error fetching exploration data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Compute filtered data
  const filteredData = useMemo(() => {
    if (!graphData) return null;

    const filteredNodes = graphData.nodes.filter(node => {
      // Filter by node type
      if (node.type === 'Subject' && !filters.showSubjects) return false;
      if (node.type === 'Chapter' && !filters.showChapters) return false;
      if (node.type === 'Subtopic' && !filters.showSubtopics) return false;
      if (node.type === 'Question' && !filters.showQuestions) return false;

      // Filter by search term
      if (filters.searchTerm && !node.label.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }

      return true;
    });

    // Get all node IDs that passed filtering
    const filteredNodeIds = new Set(filteredNodes.map(node => node.id));

    // Filter links to only include those between filtered nodes
    const filteredLinks = graphData.links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    });

    return { nodes: filteredNodes, links: filteredLinks };
  }, [graphData, filters]);

  // D3.js Graph Visualization
  useEffect(() => {
    if (!filteredData || !svgRef.current || !gRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    const width = 800;
    const height = 600;

    // Clear previous content
    g.selectAll("*").remove();

    // Create color scale for node types
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['Subject', 'Chapter', 'Subtopic', 'Question'])
      .range(['#8b5cf6', '#ec4899', '#f59e0b', '#10b981']);

    // Create size scale based on node degree
    const maxDegree = d3.max(filteredData.nodes, d => d.degree || 0) || 1;
    const sizeScale = d3.scaleSqrt()
      .domain([0, maxDegree])
      .range([4, 20]);

    // Create force simulation
    const simulation = d3.forceSimulation(filteredData.nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(filteredData.links)
        .id((d: GraphNode) => d.id)
        .distance(80)
        .strength(0.3))
      .force("charge", d3.forceManyBody()
        .strength(-300)
        .distanceMax(300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<GraphNode>()
        .radius(d => sizeScale(d.degree || 0) + 2));

    simulationRef.current = simulation;

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    // Create links
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(filteredData.links)
      .enter().append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.3)
      .attr("stroke-width", 1);

    // Create link labels for different relationship types
    const linkLabel = g.append("g")
      .attr("class", "link-labels")
      .selectAll("text")
      .data(filteredData.links)
      .enter().append("text")
      .attr("text-anchor", "middle")
      .attr("dy", -2)
      .attr("font-size", "8px")
      .attr("fill", "#666")
      .text(d => d.type.replace(/_/g, ' ').toLowerCase());

    // Create nodes
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(filteredData.nodes)
      .enter().append("circle")
      .attr("r", d => sizeScale(d.degree || 0))
      .attr("fill", d => colorScale(d.type))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        setHoveredNode(d);
        // Highlight connected nodes and links
        const connectedNodeIds = new Set<string>();
        filteredData.links.forEach(link => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          if (sourceId === d.id || targetId === d.id) {
            connectedNodeIds.add(sourceId);
            connectedNodeIds.add(targetId);
          }
        });

        node.attr("opacity", n => connectedNodeIds.has(n.id) ? 1 : 0.2);
        link.attr("opacity", l => {
          const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
          const targetId = typeof l.target === 'object' ? l.target.id : l.target;
          return (sourceId === d.id || targetId === d.id) ? 1 : 0.1;
        });
      })
      .on("mouseout", () => {
        setHoveredNode(null);
        node.attr("opacity", 1);
        link.attr("opacity", 0.3);
      })
      .on("click", (event, d) => {
        setSelectedNode(selectedNode?.id === d.id ? null : d);
        event.stopPropagation();
      });

    // Create node labels
    const nodeLabel = g.append("g")
      .attr("class", "node-labels")
      .selectAll("text")
      .data(filteredData.nodes)
      .enter().append("text")
      .attr("text-anchor", "middle")
      .attr("dy", d => -(sizeScale(d.degree || 0) + 8))
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .attr("fill", "#374151")
      .style("pointer-events", "none")
      .text(d => d.label.length > 15 ? d.label.substring(0, 12) + "..." : d.label);

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: GraphLink) => (d.source as GraphNode).x || 0)
        .attr("y1", (d: GraphLink) => (d.source as GraphNode).y || 0)
        .attr("x2", (d: GraphLink) => (d.target as GraphNode).x || 0)
        .attr("y2", (d: GraphLink) => (d.target as GraphNode).y || 0);

      linkLabel
        .attr("x", (d: GraphLink) => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2)
        .attr("y", (d: GraphLink) => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2);

      node
        .attr("cx", (d: GraphNode) => d.x || 0)
        .attr("cy", (d: GraphNode) => d.y || 0);

      nodeLabel
        .attr("x", (d: GraphNode) => d.x || 0)
        .attr("y", (d: GraphNode) => d.y || 0);
    });

    // Handle background click to deselect
    svg.on("click", () => setSelectedNode(null));

    // Cleanup
    return () => {
      simulation.stop();
      svg.on("click", null);
    };
  }, [filteredData, selectedNode]);

  // Zoom controls
  const handleZoomIn = () => {
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current).transition().call(
        zoomRef.current.scaleBy, 1.5
      );
    }
  };

  const handleZoomOut = () => {
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current).transition().call(
        zoomRef.current.scaleBy, 0.67
      );
    }
  };

  const handleResetZoom = () => {
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current).transition().call(
        zoomRef.current.transform,
        d3.zoomIdentity.translate(0, 0).scale(1)
      );
    }
  };

  const handleRestartSimulation = () => {
    if (simulationRef.current) {
      simulationRef.current.alpha(1).restart();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading graph data...</p>
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
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Database className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">Data Exploration</h1>
                  <p className="text-xs text-muted-foreground">
                    Powered by Neo4j Graph Database
                  </p>
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-purple-500" />
                <span className="text-xs font-medium text-muted-foreground">Questions</span>
              </div>
              <p className="text-2xl font-bold text-purple-500">{stats.totalQuestions.toLocaleString()}</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Network className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium text-muted-foreground">Subjects</span>
              </div>
              <p className="text-2xl font-bold text-blue-500">{stats.totalSubjects}</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium text-muted-foreground">Chapters</span>
              </div>
              <p className="text-2xl font-bold text-green-500">{stats.totalChapters}</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium text-muted-foreground">Subtopics</span>
              </div>
              <p className="text-2xl font-bold text-amber-500">{stats.totalSubtopics}</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border-indigo-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground">First Year</span>
              </div>
              <p className="text-2xl font-bold text-indigo-500">{stats.earliestYear}</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground">Latest Year</span>
              </div>
              <p className="text-2xl font-bold text-pink-500">{stats.latestYear}</p>
            </Card>
          </div>
        )}

        {/* Graph Visualization */}
        <Card className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold mb-2">Knowledge Graph Visualization</h2>
                <p className="text-sm text-muted-foreground">
                  Interactive visualization showing relationships between questions, subjects, chapters, and subtopics
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <Card className="p-4 mb-4 bg-muted/30">
                <div className="space-y-4">
                  {/* Search */}
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search nodes..."
                      value={filters.searchTerm}
                      onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                      className="flex-1 px-3 py-1 text-sm border border-border rounded-md bg-background"
                    />
                  </div>

                  {/* Node Type Filters */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.showSubjects}
                        onChange={(e) => setFilters(prev => ({ ...prev, showSubjects: e.target.checked }))}
                        className="rounded"
                      />
                      <div className="w-3 h-3 rounded-full bg-[#8b5cf6]"></div>
                      Subjects
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.showChapters}
                        onChange={(e) => setFilters(prev => ({ ...prev, showChapters: e.target.checked }))}
                        className="rounded"
                      />
                      <div className="w-3 h-3 rounded-full bg-[#ec4899]"></div>
                      Chapters
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.showSubtopics}
                        onChange={(e) => setFilters(prev => ({ ...prev, showSubtopics: e.target.checked }))}
                        className="rounded"
                      />
                      <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
                      Subtopics
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.showQuestions}
                        onChange={(e) => setFilters(prev => ({ ...prev, showQuestions: e.target.checked }))}
                        className="rounded"
                      />
                      <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
                      Questions
                    </label>
                  </div>
                </div>
              </Card>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#8b5cf6]"></div>
                <span className="text-xs text-muted-foreground">Subject</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ec4899]"></div>
                <span className="text-xs text-muted-foreground">Chapter</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
                <span className="text-xs text-muted-foreground">Subtopic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
                <span className="text-xs text-muted-foreground">Question</span>
              </div>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg overflow-hidden border" style={{ height: "600px" }}>
            {/* Zoom Controls */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
              <Button variant="outline" size="sm" onClick={handleZoomIn} className="h-8 w-8 p-0">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleZoomOut} className="h-8 w-8 p-0">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleResetZoom} className="h-8 w-8 p-0">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleRestartSimulation} className="h-8 w-8 p-0">
                <Network className="h-4 w-4" />
              </Button>
            </div>

            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              className="cursor-grab active:cursor-grabbing"
            >
              <g ref={gRef} />
            </svg>

            {/* Node Info Panel */}
            {(selectedNode || hoveredNode) && (
              <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-4 max-w-xs shadow-lg">
                <Badge className="mb-2">{(selectedNode || hoveredNode)?.type}</Badge>
                <h3 className="font-semibold text-sm mb-1">{(selectedNode || hoveredNode)?.label}</h3>
                <p className="text-xs text-muted-foreground mb-2">ID: {(selectedNode || hoveredNode)?.id}</p>
                <p className="text-xs text-muted-foreground">
                  Connections: {(selectedNode || hoveredNode)?.degree || 0}
                </p>
                {selectedNode && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">Click to deselect</p>
                  </div>
                )}
              </div>
            )}

            {/* Stats overlay */}
            {filteredData && (
              <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm border border-border rounded-lg p-3">
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Nodes: {filteredData.nodes.length}</div>
                  <div>Links: {filteredData.links.length}</div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>💡 Tips:</strong> Drag to pan • Scroll to zoom • Click nodes to select • Hover to highlight connections • Use filters to focus on specific content types
            </p>
          </div>
        </Card>

        {/* Information Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Graph Database Benefits
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Relationship-based queries:</strong> Find similar questions based on shared topics and subtopics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Fast traversals:</strong> Navigate between related questions instantly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Pattern matching:</strong> Discover hidden connections in your data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Scalable:</strong> Efficiently handles thousands of questions and relationships</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              Graph Schema
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Questions</strong> → HAS_SUBJECT → <strong>Subjects</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Questions</strong> → BELONGS_TO_CHAPTER → <strong>Chapters</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Questions</strong> → HAS_SUBTOPIC → <strong>Subtopics</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Questions</strong> → ASKED_IN → <strong>Papers</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Questions</strong> → HAS_OPTION → <strong>Options</strong></span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
