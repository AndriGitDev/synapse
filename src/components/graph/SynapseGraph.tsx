'use client';

import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
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

// Layout algorithm: simple vertical timeline with branching
function layoutEvents(events: AgentEvent[], currentIndex: number): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  const VERTICAL_SPACING = 120;
  const HORIZONTAL_SPACING = 320;
  const START_X = 400;
  const START_Y = 50;
  
  // Track column positions for parallel events
  const columnMap = new Map<string, number>();
  let currentColumn = 0;
  
  events.forEach((event, index) => {
    // Determine column (for now, simple sequential layout)
    let x = START_X;
    let y = START_Y + index * VERTICAL_SPACING;
    
    // Offset tool_result nodes to the right
    if (event.type === 'tool_result') {
      x += HORIZONTAL_SPACING / 2;
      y -= VERTICAL_SPACING / 2;
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
        type: 'smoothstep',
        animated: index === currentIndex,
        style: {
          stroke: index <= currentIndex ? '#6366f1' : '#334155',
          strokeWidth: 2,
        },
        hidden: index > currentIndex,
      });
    }
  });
  
  return { nodes, edges };
}

export function SynapseGraph() {
  const { session, playback, selectedEventId, setSelectedEventId } = useSynapseStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
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
  
  // Handle node click
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedEventId(node.id === selectedEventId ? null : node.id);
  }, [selectedEventId, setSelectedEventId]);
  
  // Custom minimap node color
  const minimapNodeColor = useCallback((node: Node) => {
    const event = (node.data as SynapseNodeData).event;
    const colors = EVENT_COLORS[event.type];
    // Return a hex color based on event type
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
    <div className="w-full h-full bg-slate-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
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
        />
      </ReactFlow>
    </div>
  );
}
