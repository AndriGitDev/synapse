'use client';

import { useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Node,
  Edge,
  ConnectionMode,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useSynapseStore } from '@/lib/store';
import { SynapseNode } from './nodes/SynapseNode';
import { AgentEvent, SynapseNodeData, EVENT_COLORS } from '@/lib/types';

const nodeTypes = {
  synapse: SynapseNode,
};

// Layout algorithm: HORIZONTAL timeline with branching
function layoutEvents(events: AgentEvent[], currentIndex: number): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  const HORIZONTAL_SPACING = 350; // Space between nodes horizontally
  const VERTICAL_SPACING = 150;   // Space for branching vertically
  const START_X = 100;
  const START_Y = 300;
  
  // Track vertical offset for branching
  const mainY = START_Y;
  
  events.forEach((event, index) => {
    // Horizontal timeline - each event moves right
    let x = START_X + index * HORIZONTAL_SPACING;
    let y = mainY;
    
    // Offset tool_result nodes slightly down to show connection
    if (event.type === 'tool_result') {
      y += VERTICAL_SPACING / 2;
      x -= HORIZONTAL_SPACING / 3; // Bring it back a bit to cluster with tool_call
    }
    
    // Offset thought/decision nodes slightly up for visual hierarchy
    if (event.type === 'thought' || event.type === 'decision') {
      y -= 20;
    }
    
    const nodeData: SynapseNodeData = {
      event,
      isActive: index === currentIndex,
      isVisible: index <= currentIndex,
    };
    
    nodes.push({
      id: event.id,
      type: 'synapse',
      position: { x, y },
      data: nodeData,
      hidden: index > currentIndex,
    });
    
    // Create edge to previous event (if not first)
    if (index > 0) {
      const prevEvent = events[index - 1];
      const sourceId = event.parentId || prevEvent.id;
      
      edges.push({
        id: `e-${sourceId}-${event.id}`,
        source: sourceId,
        target: event.id,
        type: 'default', // Bezier curve looks better horizontally
        animated: index === currentIndex,
        style: {
          stroke: index <= currentIndex ? '#6366f1' : '#334155',
          strokeWidth: 2,
          strokeLinecap: 'round',
        },
        hidden: index > currentIndex,
      });
    }
  });
  
  return { nodes, edges };
}

// Inner component that uses useReactFlow (must be inside ReactFlowProvider)
function SynapseGraphInner() {
  const { session, playback, selectedEventId, setSelectedEventId } = useSynapseStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { setCenter, getZoom } = useReactFlow();
  const isInitialMount = useRef(true);
  
  // Update layout when visible events change
  useEffect(() => {
    if (!session) {
      setNodes([]);
      setEdges([]);
      return;
    }
    
    const { nodes: newNodes, edges: newEdges } = layoutEvents(
      session.events,
      playback.currentEventIndex
    );
    
    setNodes(newNodes);
    setEdges(newEdges);
  }, [session, playback.currentEventIndex, setNodes, setEdges]);
  
  // Auto-pan to follow the active node during playback
  useEffect(() => {
    if (!session || playback.currentEventIndex < 0) return;
    
    // Skip auto-pan on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    const currentEvent = session.events[playback.currentEventIndex];
    if (!currentEvent) return;
    
    // Find the node position
    const HORIZONTAL_SPACING = 350;
    const START_X = 100;
    const START_Y = 300;
    
    let x = START_X + playback.currentEventIndex * HORIZONTAL_SPACING;
    let y = START_Y;
    
    // Adjust for special node types
    if (currentEvent.type === 'tool_result') {
      y += 75;
      x -= HORIZONTAL_SPACING / 3;
    }
    
    // Smoothly pan to center on the active node
    const currentZoom = getZoom();
    setCenter(x + 140, y + 60, { 
      zoom: Math.max(currentZoom, 0.7), // Don't zoom out too much
      duration: 300 // Faster pan for snappier feel
    });
    
  }, [session, playback.currentEventIndex, setCenter, getZoom]);
  
  // Reset initial mount flag when session changes
  useEffect(() => {
    isInitialMount.current = true;
  }, [session?.id]);
  
  // Handle node click
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedEventId(node.id === selectedEventId ? null : node.id);
  }, [selectedEventId, setSelectedEventId]);
  
  // Custom minimap node color
  const minimapNodeColor = useCallback((node: Node) => {
    const event = (node.data as SynapseNodeData).event;
    const colors = EVENT_COLORS[event.type];
    const colorMap: Record<string, string> = {
      'border-purple-500': '#8b5cf6',
      'border-blue-500': '#3b82f6',
      'border-green-500': '#22c55e',
      'border-cyan-500': '#06b6d4',
      'border-orange-500': '#f97316',
      'border-yellow-500': '#eab308',
      'border-red-500': '#ef4444',
      'border-slate-500': '#64748b',
      'border-indigo-500': '#6366f1',
    };
    return colorMap[colors.border] || '#6366f1';
  }, []);
  
  if (!session) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <p>No session loaded. Try demo mode or upload a session.</p>
      </div>
    );
  }
  
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      connectionMode={ConnectionMode.Loose}
      fitView
      fitViewOptions={{ padding: 0.5, maxZoom: 0.8 }}
      minZoom={0.1}
      maxZoom={2}
      defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
      proOptions={{ hideAttribution: true }}
    >
      <Background 
        variant={BackgroundVariant.Dots} 
        gap={20} 
        size={1} 
        color="#1e293b" 
      />
      <Controls 
        className="!bg-slate-800 !border-slate-700 !rounded-lg"
        showInteractive={false}
      />
      <MiniMap 
        nodeColor={minimapNodeColor}
        maskColor="rgba(0, 0, 0, 0.8)"
        className="!bg-slate-900 !border-slate-700 !rounded-lg"
        pannable
        zoomable
      />
    </ReactFlow>
  );
}

// Wrapper component (exported)
export function SynapseGraph() {
  return (
    <div className="w-full h-full bg-slate-950">
      <SynapseGraphInner />
    </div>
  );
}
