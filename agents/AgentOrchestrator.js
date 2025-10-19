/**
 * Agent Orchestrator - Coordinates the BeautyCita Senior Engineering Team
 *
 * This orchestrator manages a team of 9 senior expert agents across all
 * development departments, routing tasks to the appropriate specialists
 * and coordinating multi-agent collaborations.
 */

const fs = require('fs').promises;
const path = require('path');

class AgentOrchestrator {
  constructor() {
    this.agents = new Map();
    this.taskQueue = [];
    this.activeAgents = new Set();
    this.config = null;
    this.initialized = false;
  }

  /**
   * Initialize the orchestrator and load agent configurations
   */
  async initialize() {
    try {
      const configPath = path.join(__dirname, 'config', 'agents.config.json');
      const configData = await fs.readFile(configPath, 'utf8');
      this.config = JSON.parse(configData);

      // Load all agents
      for (const agentConfig of this.config.agentTeam.agents) {
        await this.loadAgent(agentConfig);
      }

      this.initialized = true;
      console.log(`✅ Agent Orchestrator initialized with ${this.agents.size} senior experts`);
      return true;
    } catch (error) {
      console.error('Failed to initialize Agent Orchestrator:', error);
      throw error;
    }
  }

  /**
   * Load an individual agent
   */
  async loadAgent(agentConfig) {
    const agent = {
      id: agentConfig.id,
      name: agentConfig.name,
      role: agentConfig.role,
      title: agentConfig.title,
      expertise: agentConfig.expertise,
      responsibilities: agentConfig.responsibilities,
      tools: agentConfig.tools,
      languages: agentConfig.languages,
      status: 'available',
      tasksCompleted: 0,
      successRate: 100
    };

    this.agents.set(agentConfig.id, agent);
    console.log(`📦 Loaded agent: ${agent.name} (${agent.role})`);
  }

  /**
   * Route a task to the most appropriate agent(s)
   */
  async routeTask(task) {
    if (!this.initialized) {
      await this.initialize();
    }

    const keywords = this.extractKeywords(task.description);
    const matchingAgents = this.findMatchingAgents(keywords, task.type);

    if (matchingAgents.length === 0) {
      return {
        success: false,
        message: 'No suitable agent found for this task',
        suggestion: 'Consider breaking down the task or providing more details'
      };
    }

    const primaryAgent = matchingAgents[0];
    const collaborators = matchingAgents.slice(1, 3); // Up to 2 collaborators

    return {
      success: true,
      primaryAgent: primaryAgent,
      collaborators: collaborators,
      recommendation: this.generateRecommendation(primaryAgent, collaborators, task)
    };
  }

  /**
   * Extract keywords from task description
   */
  extractKeywords(description) {
    const lowerDesc = description.toLowerCase();
    const keywords = [];

    // Technology keywords
    const techKeywords = {
      frontend: ['react', 'component', 'ui', 'css', 'tailwind', 'vite', 'typescript', 'jsx', 'tsx', 'responsive'],
      backend: ['api', 'express', 'node', 'endpoint', 'route', 'middleware', 'server', 'jwt', 'auth'],
      database: ['database', 'sql', 'postgresql', 'postgres', 'query', 'schema', 'migration', 'table', 'index'],
      devops: ['deploy', 'nginx', 'pm2', 'docker', 'server', 'infrastructure', 'ci/cd', 'pipeline'],
      ai: ['rasa', 'chatbot', 'ai', 'ml', 'nlp', 'openai', 'gpt', 'intent', 'training'],
      security: ['security', 'auth', 'authentication', 'authorization', 'jwt', 'oauth', 'encryption', 'vulnerability'],
      integration: ['stripe', 'twilio', 'payment', 'sms', 'webhook', 'api integration', 'third-party'],
      testing: ['test', 'testing', 'jest', 'cypress', 'e2e', 'unit test', 'integration test']
    };

    for (const [category, words] of Object.entries(techKeywords)) {
      for (const word of words) {
        if (lowerDesc.includes(word)) {
          keywords.push(category);
          break;
        }
      }
    }

    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Find matching agents based on keywords and task type
   */
  findMatchingAgents(keywords, taskType) {
    const agentMatches = [];

    // Map keywords to agent IDs
    const keywordToAgent = {
      frontend: 'frontend-senior',
      backend: 'backend-senior',
      database: 'database-architect',
      devops: 'devops-lead',
      ai: 'ai-ml-engineer',
      security: 'security-engineer',
      integration: 'integration-specialist',
      testing: 'qa-testing-lead'
    };

    // Find matching agents
    for (const keyword of keywords) {
      const agentId = keywordToAgent[keyword];
      if (agentId && this.agents.has(agentId)) {
        const agent = this.agents.get(agentId);
        if (!agentMatches.find(a => a.id === agent.id)) {
          agentMatches.push(agent);
        }
      }
    }

    // If no specific match or architectural task, include product architect
    if (agentMatches.length === 0 || taskType === 'architecture' || keywords.length > 2) {
      const architect = this.agents.get('product-architect');
      if (architect && !agentMatches.find(a => a.id === architect.id)) {
        agentMatches.unshift(architect);
      }
    }

    return agentMatches;
  }

  /**
   * Generate task recommendation
   */
  generateRecommendation(primaryAgent, collaborators, task) {
    let recommendation = `## 🎯 Task Assignment\n\n`;
    recommendation += `**Task:** ${task.description}\n\n`;
    recommendation += `### 👨‍💼 Primary Agent\n`;
    recommendation += `**${primaryAgent.name}** - ${primaryAgent.title}\n`;
    recommendation += `- **Expertise:** ${primaryAgent.expertise.slice(0, 3).join(', ')}\n`;
    recommendation += `- **Responsibilities:** ${primaryAgent.responsibilities[0]}\n\n`;

    if (collaborators.length > 0) {
      recommendation += `### 🤝 Collaborating Agents\n`;
      for (const collab of collaborators) {
        recommendation += `- **${collab.name}** (${collab.role})\n`;
      }
      recommendation += `\n`;
    }

    recommendation += `### 📋 Recommended Approach\n`;
    recommendation += this.generateApproach(primaryAgent, task);

    return recommendation;
  }

  /**
   * Generate approach based on agent expertise
   */
  generateApproach(agent, task) {
    const approaches = {
      'frontend-senior': `
1. Review current component structure and dependencies
2. Implement responsive design following mobile-first approach
3. Optimize bundle size and lazy loading
4. Ensure accessibility compliance (WCAG 2.1)
5. Test across different devices and browsers
6. Document component API and usage`,

      'backend-senior': `
1. Design RESTful API endpoints with proper versioning
2. Implement request validation and error handling
3. Optimize database queries and add proper indexes
4. Add authentication and authorization checks
5. Write comprehensive API documentation
6. Implement rate limiting and security measures`,

      'database-architect': `
1. Analyze current schema and identify optimization opportunities
2. Design efficient indexes for query performance
3. Plan and test database migrations
4. Ensure data integrity with constraints
5. Set up backup and recovery procedures
6. Document schema changes and relationships`,

      'devops-lead': `
1. Review current infrastructure and deployment pipeline
2. Configure Nginx for optimal performance
3. Set up monitoring and alerting
4. Implement automated backups and disaster recovery
5. Optimize PM2 configuration for process management
6. Document deployment procedures`,

      'ai-ml-engineer': `
1. Analyze training data quality and coverage
2. Design conversation flows and intents
3. Train and evaluate NLU models
4. Integrate with OpenAI API efficiently
5. Monitor model performance and accuracy
6. Document AI capabilities and limitations`,

      'security-engineer': `
1. Conduct security audit of affected components
2. Implement authentication and authorization
3. Add input validation and sanitization
4. Configure security headers and CORS
5. Test for common vulnerabilities (OWASP Top 10)
6. Document security measures and best practices`,

      'integration-specialist': `
1. Review API documentation and requirements
2. Implement secure authentication flow
3. Handle webhooks with proper validation
4. Add error handling and retry logic
5. Test integration thoroughly in sandbox
6. Document integration setup and troubleshooting`,

      'qa-testing-lead': `
1. Design comprehensive test strategy
2. Write unit tests for core functionality
3. Implement integration tests for API endpoints
4. Create E2E tests for critical user flows
5. Perform load and performance testing
6. Document test coverage and results`,

      'product-architect': `
1. Review architectural requirements and constraints
2. Design scalable and maintainable solution
3. Evaluate technology options and tradeoffs
4. Create architectural diagrams and documentation
5. Define coding standards and best practices
6. Plan phased implementation approach`
    };

    return approaches[agent.id] || `
1. Analyze requirements and current implementation
2. Design solution following best practices
3. Implement changes with proper testing
4. Document changes and update relevant docs
5. Review and optimize for performance
6. Deploy and monitor in production`;
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId) {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by expertise area
   */
  getAgentsByExpertise(expertise) {
    return this.getAllAgents().filter(agent =>
      agent.expertise.some(exp =>
        exp.toLowerCase().includes(expertise.toLowerCase())
      )
    );
  }

  /**
   * Get team summary
   */
  getTeamSummary() {
    const summary = {
      teamName: this.config.agentTeam.name,
      totalAgents: this.agents.size,
      agents: this.getAllAgents().map(agent => ({
        name: agent.name,
        role: agent.role,
        status: agent.status,
        tasksCompleted: agent.tasksCompleted
      }))
    };

    return summary;
  }

  /**
   * Handle complex multi-agent tasks
   */
  async executeMultiAgentTask(task) {
    const routing = await this.routeTask(task);

    if (!routing.success) {
      return routing;
    }

    // Mark agents as busy
    this.activeAgents.add(routing.primaryAgent.id);
    routing.collaborators.forEach(agent => this.activeAgents.add(agent.id));

    // Execute task (in a real implementation, this would delegate to actual agent implementations)
    const result = {
      success: true,
      task: task,
      routing: routing,
      execution: {
        status: 'completed',
        primaryAgent: routing.primaryAgent.name,
        collaborators: routing.collaborators.map(a => a.name),
        recommendation: routing.recommendation
      }
    };

    // Update agent stats
    const primaryAgent = this.agents.get(routing.primaryAgent.id);
    primaryAgent.tasksCompleted++;
    primaryAgent.status = 'available';
    this.activeAgents.delete(routing.primaryAgent.id);

    routing.collaborators.forEach(collab => {
      const agent = this.agents.get(collab.id);
      agent.tasksCompleted++;
      agent.status = 'available';
      this.activeAgents.delete(collab.id);
    });

    return result;
  }
}

// Singleton instance
let orchestratorInstance = null;

/**
 * Get the singleton orchestrator instance
 */
function getOrchestrator() {
  if (!orchestratorInstance) {
    orchestratorInstance = new AgentOrchestrator();
  }
  return orchestratorInstance;
}

module.exports = {
  AgentOrchestrator,
  getOrchestrator
};
