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
import { AgentEvent, SynapseNodeData, EVENT_COLORS, AgentInfo, AGENT_COLORS, AgentSession } from '@/lib/types';

const nodeTypes = {
  synapse: SynapseNode,
};

// Get agent info for an event
function getAgentForEvent(event: AgentEvent, session: AgentSession): AgentInfo | undefined {
  if (!session.isMultiAgent || !session.agents || !event.agentId) return undefined;
  return session.agents.find(a => a.id === event.agentId);
}

// Layout algorithm for MULTI-AGENT: VERTICAL flow with horizontal branches
function layoutMultiAgent(
  events: AgentEvent[], 
  currentIndex: number, 
  session: AgentSession,
  isLiveMode: boolean
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  const VERTICAL_SPACING = 200;
  const HORIZONTAL_SPACING = 480;
  const START_X = 500;
  const START_Y = 100;
  
  // Assign horizontal lanes to each agent (orchestrator in center, others branch out)
  const agentLanes: Record<string, number> = {};
  if (session.agents) {
    const orchestratorId = session.agents.find(a => a.role === 'orchestrator')?.id;
    let leftIdx = -1;
    let rightIdx = 1;
    
    session.agents.forEach((agent) => {
      if (agent.id === orchestratorId) {
        agentLanes[agent.id] = 0; // Center
      } else if (leftIdx * -1 <= rightIdx) {
        agentLanes[agent.id] = leftIdx;
        leftIdx--;
      } else {
        agentLanes[agent.id] = rightIdx;
        rightIdx++;
      }
    });
  }
  
  // Track Y position per agent
  const agentYOffset: Record<string, number> = {};
  let globalY = 0;
  
  events.forEach((event, index) => {
    const agent = getAgentForEvent(event, session);
    const agentId = event.agentId || 'orchestrator';
    
    // Initialize agent Y offset
    if (!(agentId in agentYOffset)) {
      agentYOffset[agentId] = globalY;
    }
    
    const laneIndex = agentLanes[agentId] ?? 0;
    const x = START_X + laneIndex * HORIZONTAL_SPACING;
    const y = START_Y + agentYOffset[agentId] * VERTICAL_SPACING;
    
    // Increment Y for this agent
    agentYOffset[agentId]++;
    
    // Also advance global Y for spawn events to keep flow logical
    if (event.type === 'spawn_agent' || event.type === 'agent_complete') {
      globalY = Math.max(globalY, agentYOffset[agentId]);
    }
    
    // Mark final node only in non-live mode
    const isLastEvent = index === events.length - 1;
    const isFinal = isLastEvent && !isLiveMode;
    
    const nodeData: SynapseNodeData = {
      event,
      isActive: index === currentIndex,
      isVisible: index <= currentIndex,
      agent,
      isFinal,
    };
    
    nodes.push({
      id: event.id,
      type: 'synapse',
      position: { x, y },
      data: nodeData,
      hidden: index > currentIndex,
    });
    
    // Create edges
    if (index > 0 && event.parentId) {
      const sourceId = event.parentId;
      const sourceEvent = events.find(e => e.id === sourceId);
      const isCrossAgent = sourceEvent?.agentId !== event.agentId;
      
      const agentRole = agent?.role || 'default';
      const agentColor = AGENT_COLORS[agentRole] || AGENT_COLORS.default;
      
      edges.push({
        id: `e-${sourceId}-${event.id}`,
        source: sourceId,
        target: event.id,
        sourceHandle: isCrossAgent ? 'right' : 'bottom',  // Vertical: bottom, Cross-agent: right
        targetHandle: isCrossAgent ? 'left' : 'top',      // Vertical: top, Cross-agent: left
        type: 'smoothstep',
        animated: index === currentIndex,
        style: {
          stroke: index <= currentIndex 
            ? (isCrossAgent ? '#ec4899' : agentColor.border.replace('border-', '#').replace('-500', '')) 
            : '#334155',
          strokeWidth: isCrossAgent ? 3 : 2,
          strokeDasharray: isCrossAgent ? '5,5' : undefined,
          strokeLinecap: 'round',
        },
        hidden: index > currentIndex,
      });
    }
  });
  
  return { nodes, edges };
}

// Layout algorithm for SINGLE-AGENT: HORIZONTAL timeline
function layoutSingleAgent(
  events: AgentEvent[], 
  currentIndex: number,
  isLiveMode: boolean
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  const HORIZONTAL_SPACING = 420;
  const VERTICAL_SPACING = 180;
  const START_X = 100;
  const START_Y = 300;
  
  events.forEach((event, index) => {
    let x = START_X + index * HORIZONTAL_SPACING;
    let y = START_Y;
    
    // Offset tool_result nodes slightly down
    if (event.type === 'tool_result') {
      y += VERTICAL_SPACING / 2;
      x -= HORIZONTAL_SPACING / 3;
    }
    
    // Offset thought/decision nodes slightly up
    if (event.type === 'thought' || event.type === 'decision') {
      y -= 20;
    }
    
    // Mark final node only in non-live mode
    const isLastEvent = index === events.length - 1;
    const isFinal = isLastEvent && !isLiveMode;
    
    const nodeData: SynapseNodeData = {
      event,
      isActive: index === currentIndex,
      isVisible: index <= currentIndex,
      isFinal,
    };
    
    nodes.push({
      id: event.id,
      type: 'synapse',
      position: { x, y },
      data: nodeData,
      hidden: index > currentIndex,
    });
    
    if (index > 0) {
      const prevEvent = events[index - 1];
      const sourceId = event.parentId || prevEvent.id;
      
      edges.push({
        id: `e-${sourceId}-${event.id}`,
        source: sourceId,
        target: event.id,
        sourceHandle: 'right',  // Horizontal: right to left
        targetHandle: 'left',
        type: 'default',
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

// Main layout function - delegates based on session type
function layoutEvents(
  events: AgentEvent[], 
  currentIndex: number, 
  session: AgentSession,
  isLiveMode: boolean
): { nodes: Node[]; edges: Edge[] } {
  if (session.isMultiAgent) {
    return layoutMultiAgent(events, currentIndex, session, isLiveMode);
  }
  return layoutSingleAgent(events, currentIndex, isLiveMode);
}

// Inner component that uses useReactFlow
function SynapseGraphInner() {
  const { session, playback, selectedEventId, setSelectedEventId, isLiveMode } = useSynapseStore();
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
      playback.currentEventIndex,
      session,
      isLiveMode
    );
    
    setNodes(newNodes);
    setEdges(newEdges);
  }, [session, playback.currentEventIndex, isLiveMode, setNodes, setEdges]);
  
  // Auto-pan to follow the active node during playback
  useEffect(() => {
    if (!session || playback.currentEventIndex < 0) return;
    
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    const currentEvent = session.events[playback.currentEventIndex];
    if (!currentEvent) return;
    
    const currentNode = nodes.find(n => n.id === currentEvent.id);
    if (!currentNode) return;
    
    const { x, y } = currentNode.position;
    
    const currentZoom = getZoom();
    setCenter(x + 140, y + 60, { 
      zoom: Math.max(currentZoom, 0.6),
      duration: 300
    });
    
  }, [session, playback.currentEventIndex, nodes, setCenter, getZoom]);
  
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
    const data = node.data as SynapseNodeData;
    const event = data.event;
    const agent = data.agent;
    
    if (agent?.role) {
      const agentColor = AGENT_COLORS[agent.role] || AGENT_COLORS.default;
      return agentColor.glow.replace('rgba(', '#').replace(/,\s*[\d.]+\)/, '');
    }
    
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
      'border-pink-500': '#ec4899',
      'border-emerald-500': '#10b981',
      'border-amber-500': '#f59e0b',
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
    <div className="relative w-full h-full">
      {/* Agent legend - TOP RIGHT for multi-agent sessions */}
      {session.isMultiAgent && session.agents && (
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          {session.agents.map((agent) => {
            const agentColors = AGENT_COLORS[agent.role || 'default'] || AGENT_COLORS.default;
            return (
              <div 
                key={agent.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${agentColors.bg} border ${agentColors.border}`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${agentColors.border.replace('border-', 'bg-')}`} />
                <span className={`text-xs font-semibold ${agentColors.text}`}>
                  {agent.name}
                </span>
              </div>
            );
          })}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-pink-900/30 border border-pink-500/50 mt-2">
            <div className="w-4 h-0 border-t-2 border-dashed border-pink-500" />
            <span className="text-[10px] text-pink-300">Cross-agent</span>
          </div>
        </div>
      )}
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.5, maxZoom: 0.7 }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
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
    </div>
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
