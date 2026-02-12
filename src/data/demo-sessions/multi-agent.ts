import { AgentSession, AgentInfo } from '@/lib/types';

// Define the agents in this orchestration
const agents: AgentInfo[] = [
  { id: 'orchestrator', name: 'Orchestrator', role: 'orchestrator', color: 'violet' },
  { id: 'researcher', name: 'Research Agent', role: 'researcher', color: 'blue', parentAgentId: 'orchestrator' },
  { id: 'writer', name: 'Writer Agent', role: 'writer', color: 'emerald', parentAgentId: 'orchestrator' },
  { id: 'reviewer', name: 'Reviewer Agent', role: 'reviewer', color: 'amber', parentAgentId: 'orchestrator' },
];

// Demo session: An orchestrator spawning specialized sub-agents
export const multiAgentSession: AgentSession = {
  id: 'demo-multi-agent',
  name: 'Multi-Agent Orchestration',
  description: 'Watch an orchestrator delegate tasks to specialized sub-agents',
  agent: 'clawdbot',
  startedAt: new Date('2026-02-12T09:00:00Z'),
  isMultiAgent: true,
  agents,
  events: [
    // User request
    {
      id: 'e1',
      timestamp: new Date('2026-02-12T09:00:00Z'),
      type: 'user_message',
      content: 'Write a comprehensive blog post about the security implications of AI agents having access to system tools.',
      agentId: 'orchestrator',
    },
    
    // Orchestrator thinks
    {
      id: 'e2',
      timestamp: new Date('2026-02-12T09:00:01Z'),
      type: 'thought',
      content: 'This is a complex task requiring research, writing, and quality review. I should break this into specialized sub-tasks and delegate to appropriate agents.',
      parentId: 'e1',
      agentId: 'orchestrator',
    },
    
    // Orchestrator plans
    {
      id: 'e3',
      timestamp: new Date('2026-02-12T09:00:02Z'),
      type: 'decision',
      content: 'Task decomposition: 1) Research current AI agent security landscape, 2) Write the article, 3) Review for accuracy and tone. Spawning three specialized agents.',
      parentId: 'e2',
      agentId: 'orchestrator',
    },
    
    // Spawn Research Agent
    {
      id: 'e4',
      timestamp: new Date('2026-02-12T09:00:03Z'),
      type: 'spawn_agent',
      content: 'Spawning Research Agent to gather information on AI agent security vulnerabilities, recent incidents, and expert opinions.',
      parentId: 'e3',
      agentId: 'orchestrator',
      metadata: {
        spawnedAgent: agents[1],
      },
    },
    
    // Research Agent starts
    {
      id: 'e5',
      timestamp: new Date('2026-02-12T09:00:04Z'),
      type: 'thought',
      content: 'I need to research AI agent security. Let me search for recent incidents, academic papers, and security advisories.',
      parentId: 'e4',
      agentId: 'researcher',
    },
    
    // Research Agent searches
    {
      id: 'e6',
      timestamp: new Date('2026-02-12T09:00:05Z'),
      type: 'tool_call',
      content: 'Searching for "AI agent security vulnerabilities 2025 2026"',
      parentId: 'e5',
      agentId: 'researcher',
      metadata: { tool: 'web_search' },
    },
    
    {
      id: 'e7',
      timestamp: new Date('2026-02-12T09:00:07Z'),
      type: 'tool_result',
      content: 'Found 15 relevant articles including OWASP AI Security Top 10, recent prompt injection research, and case studies.',
      parentId: 'e6',
      agentId: 'researcher',
      metadata: { success: true, duration: 2100 },
    },
    
    {
      id: 'e8',
      timestamp: new Date('2026-02-12T09:00:08Z'),
      type: 'thought',
      content: 'Good initial results. Now searching for specific tool-access vulnerabilities like file system abuse, command injection, and credential theft.',
      parentId: 'e7',
      agentId: 'researcher',
    },
    
    {
      id: 'e9',
      timestamp: new Date('2026-02-12T09:00:09Z'),
      type: 'tool_call',
      content: 'Searching for "AI agent tool access risks command injection file access"',
      parentId: 'e8',
      agentId: 'researcher',
      metadata: { tool: 'web_search' },
    },
    
    {
      id: 'e10',
      timestamp: new Date('2026-02-12T09:00:11Z'),
      type: 'tool_result',
      content: 'Found research on indirect prompt injection, tool poisoning attacks, and privilege escalation through AI agents.',
      parentId: 'e9',
      agentId: 'researcher',
      metadata: { success: true, duration: 1800 },
    },
    
    // Research Agent completes
    {
      id: 'e11',
      timestamp: new Date('2026-02-12T09:00:12Z'),
      type: 'agent_complete',
      content: 'Research complete. Key findings: 1) Prompt injection remains top threat, 2) Tool access amplifies risk exponentially, 3) Most frameworks lack sandboxing, 4) Real incidents: data exfiltration via email tools, cryptominer deployment, credential harvesting.',
      parentId: 'e10',
      agentId: 'researcher',
      metadata: {
        agentResult: 'research_findings',
        success: true,
      },
    },
    
    // Orchestrator receives research
    {
      id: 'e12',
      timestamp: new Date('2026-02-12T09:00:13Z'),
      type: 'thought',
      content: 'Research Agent delivered comprehensive findings. Now spawning Writer Agent with this context.',
      parentId: 'e11',
      agentId: 'orchestrator',
    },
    
    // Spawn Writer Agent
    {
      id: 'e13',
      timestamp: new Date('2026-02-12T09:00:14Z'),
      type: 'spawn_agent',
      content: 'Spawning Writer Agent to compose the blog post using research findings. Target: 1000-1500 words, accessible tone.',
      parentId: 'e12',
      agentId: 'orchestrator',
      metadata: {
        spawnedAgent: agents[2],
      },
    },
    
    // Writer Agent starts
    {
      id: 'e14',
      timestamp: new Date('2026-02-12T09:00:15Z'),
      type: 'thought',
      content: 'Writing a blog post about AI agent security. I have solid research to work with. Structuring as: hook, background, risks, real examples, mitigations, conclusion.',
      parentId: 'e13',
      agentId: 'writer',
    },
    
    {
      id: 'e15',
      timestamp: new Date('2026-02-12T09:00:16Z'),
      type: 'decision',
      content: 'Opening with a provocative question about whether users realize their AI assistant can read their files. This will grab attention.',
      parentId: 'e14',
      agentId: 'writer',
    },
    
    {
      id: 'e16',
      timestamp: new Date('2026-02-12T09:00:17Z'),
      type: 'file_write',
      content: 'Writing article draft: "The Keys to Your Kingdom: When AI Agents Get System Access"',
      parentId: 'e15',
      agentId: 'writer',
      metadata: { file: 'drafts/ai-agent-security.md', tool: 'write' },
    },
    
    {
      id: 'e17',
      timestamp: new Date('2026-02-12T09:00:20Z'),
      type: 'tool_result',
      content: 'Successfully wrote 1,247 words covering all key points from research.',
      parentId: 'e16',
      agentId: 'writer',
      metadata: { success: true, duration: 3000 },
    },
    
    // Writer completes
    {
      id: 'e18',
      timestamp: new Date('2026-02-12T09:00:21Z'),
      type: 'agent_complete',
      content: 'Article draft complete. Covered prompt injection, tool risks, real incidents, and practical mitigations. Ready for review.',
      parentId: 'e17',
      agentId: 'writer',
      metadata: {
        agentResult: 'article_draft',
        success: true,
      },
    },
    
    // Orchestrator receives draft
    {
      id: 'e19',
      timestamp: new Date('2026-02-12T09:00:22Z'),
      type: 'thought',
      content: 'Writer Agent finished the draft. Now spawning Reviewer Agent for quality check before final delivery.',
      parentId: 'e18',
      agentId: 'orchestrator',
    },
    
    // Spawn Reviewer Agent
    {
      id: 'e20',
      timestamp: new Date('2026-02-12T09:00:23Z'),
      type: 'spawn_agent',
      content: 'Spawning Reviewer Agent to check factual accuracy, tone, and suggest improvements.',
      parentId: 'e19',
      agentId: 'orchestrator',
      metadata: {
        spawnedAgent: agents[3],
      },
    },
    
    // Reviewer Agent starts
    {
      id: 'e21',
      timestamp: new Date('2026-02-12T09:00:24Z'),
      type: 'file_read',
      content: 'Reading article draft for review',
      parentId: 'e20',
      agentId: 'reviewer',
      metadata: { file: 'drafts/ai-agent-security.md', tool: 'read' },
    },
    
    {
      id: 'e22',
      timestamp: new Date('2026-02-12T09:00:25Z'),
      type: 'thought',
      content: 'Reviewing the draft. Checking: factual accuracy against research, tone consistency, readability, and actionable takeaways.',
      parentId: 'e21',
      agentId: 'reviewer',
    },
    
    {
      id: 'e23',
      timestamp: new Date('2026-02-12T09:00:26Z'),
      type: 'decision',
      content: 'Draft is solid. Minor issues: 1) Add specific CVE reference for credibility, 2) Soften alarmist tone in paragraph 3, 3) Add OWASP link in resources.',
      parentId: 'e22',
      agentId: 'reviewer',
    },
    
    {
      id: 'e24',
      timestamp: new Date('2026-02-12T09:00:27Z'),
      type: 'file_write',
      content: 'Applying review edits: adding CVE-2024-21626 reference, adjusting tone, adding OWASP resource link.',
      parentId: 'e23',
      agentId: 'reviewer',
      metadata: { file: 'drafts/ai-agent-security.md', tool: 'edit' },
    },
    
    {
      id: 'e25',
      timestamp: new Date('2026-02-12T09:00:28Z'),
      type: 'tool_result',
      content: 'Edits applied successfully. Article improved.',
      parentId: 'e24',
      agentId: 'reviewer',
      metadata: { success: true },
    },
    
    // Reviewer completes
    {
      id: 'e26',
      timestamp: new Date('2026-02-12T09:00:29Z'),
      type: 'agent_complete',
      content: 'Review complete. Article passes quality check. Factually accurate, well-structured, appropriate tone for technical blog.',
      parentId: 'e25',
      agentId: 'reviewer',
      metadata: {
        agentResult: 'review_passed',
        success: true,
      },
    },
    
    // Orchestrator final response
    {
      id: 'e27',
      timestamp: new Date('2026-02-12T09:00:30Z'),
      type: 'thought',
      content: 'All sub-agents completed successfully. Research gathered, article written, review passed. Ready to deliver.',
      parentId: 'e26',
      agentId: 'orchestrator',
    },
    
    {
      id: 'e28',
      timestamp: new Date('2026-02-12T09:00:31Z'),
      type: 'assistant_message',
      content: 'Done! I\'ve created a comprehensive blog post titled "The Keys to Your Kingdom: When AI Agents Get System Access" covering security risks of AI tool access, real incidents, and practical mitigations. The article has been researched, written, and reviewed by my specialist agents. Would you like me to publish it or make any changes?',
      parentId: 'e27',
      agentId: 'orchestrator',
    },
  ],
};
