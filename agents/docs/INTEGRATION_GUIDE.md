# 🔌 Integration Guide - Using Agents in BeautyCita

This guide shows you how to integrate the Senior Engineering Team into your BeautyCita development workflow.

---

## 📦 Integration Methods

### 1. CLI Integration (Recommended for Manual Tasks)
### 2. Programmatic Integration (For Automation)
### 3. CI/CD Integration (For Automated Checks)
### 4. Git Hooks Integration (Pre-commit Reviews)
### 5. API Endpoint Integration (For Runtime Assistance)

---

## 1️⃣ CLI Integration

### Daily Development Workflow

```bash
# Morning: Check team status
node agents/cli.js team

# Before committing: Code review
node agents/cli.js task "Review my changes in UserProfile component"

# Planning: Get architectural guidance
node agents/cli.js task "Design a caching strategy for API responses"

# Deployment: Pre-deployment checklist
node agents/cli.js task "Review deployment configuration for production"
```

### Adding to npm Scripts

Edit `package.json`:

```json
{
  "scripts": {
    "agents:list": "node agents/cli.js list",
    "agents:team": "node agents/cli.js team",
    "agents:review": "node agents/cli.js task",
    "pre-commit-review": "node agents/cli.js task 'Review staged changes'"
  }
}
```

Usage:
```bash
npm run agents:list
npm run agents:team
npm run agents:review "Fix authentication bug"
```

---

## 2️⃣ Programmatic Integration

### Backend Integration

Create `backend/src/services/agentService.js`:

```javascript
const { getOrchestrator } = require('../../agents/AgentOrchestrator');
const FrontendSenior = require('../../agents/senior-experts/FrontendSenior');
const BackendSenior = require('../../agents/senior-experts/BackendSenior');

class AgentService {
  constructor() {
    this.orchestrator = null;
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      this.orchestrator = getOrchestrator();
      await this.orchestrator.initialize();
      this.initialized = true;
    }
  }

  /**
   * Get code review from agents
   */
  async getCodeReview(filePath, code, type = 'frontend') {
    await this.initialize();

    if (type === 'frontend') {
      const elena = new FrontendSenior();
      return elena.reviewComponent(filePath, code);
    } else if (type === 'backend') {
      const marcus = new BackendSenior();
      // Implement backend review logic
      return { message: 'Backend review coming soon' };
    }
  }

  /**
   * Route task to appropriate agent
   */
  async routeTask(taskDescription) {
    await this.initialize();

    const task = {
      description: taskDescription,
      type: 'general'
    };

    return await this.orchestrator.executeMultiAgentTask(task);
  }

  /**
   * Get agent recommendations for optimization
   */
  async getOptimizationSuggestions(category) {
    await this.initialize();

    const agentMap = {
      frontend: 'frontend-senior',
      backend: 'backend-senior',
      database: 'database-architect',
      security: 'security-engineer'
    };

    const agentId = agentMap[category];
    if (!agentId) {
      throw new Error(`Unknown category: ${category}`);
    }

    const agent = this.orchestrator.getAgent(agentId);
    return {
      agent: agent.name,
      role: agent.role,
      expertise: agent.expertise,
      recommendations: agent.responsibilities
    };
  }
}

module.exports = new AgentService();
```

### Using in Routes

`backend/src/routes/developer.js`:

```javascript
const express = require('express');
const router = express.Router();
const agentService = require('../services/agentService');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/developer/code-review
 * Get code review from agents
 */
router.post('/code-review', authenticateToken, async (req, res) => {
  try {
    const { filePath, code, type } = req.body;

    const review = await agentService.getCodeReview(filePath, code, type);

    res.json({
      success: true,
      review
    });
  } catch (error) {
    console.error('Code review error:', error);
    res.status(500).json({
      error: 'Failed to get code review',
      message: error.message
    });
  }
});

/**
 * POST /api/developer/task
 * Route a task to appropriate agent
 */
router.post('/task', authenticateToken, async (req, res) => {
  try {
    const { description } = req.body;

    const result = await agentService.routeTask(description);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Task routing error:', error);
    res.status(500).json({
      error: 'Failed to route task',
      message: error.message
    });
  }
});

/**
 * GET /api/developer/agents
 * List all available agents
 */
router.get('/agents', authenticateToken, async (req, res) => {
  try {
    await agentService.initialize();
    const agents = agentService.orchestrator.getAllAgents();

    res.json({
      success: true,
      agents: agents.map(a => ({
        id: a.id,
        name: a.name,
        role: a.role,
        status: a.status,
        expertise: a.expertise.slice(0, 5)
      }))
    });
  } catch (error) {
    console.error('Agent list error:', error);
    res.status(500).json({
      error: 'Failed to get agents',
      message: error.message
    });
  }
});

module.exports = router;
```

Add to `backend/src/server.js`:

```javascript
// Add developer routes
const developerRoutes = require('./routes/developer');
app.use('/api/developer', developerRoutes);
```

---

## 3️⃣ CI/CD Integration

### GitHub Actions

Create `.github/workflows/agent-review.yml`:

```yaml
name: Agent Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  agent-review:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Initialize Agents
        run: |
          cd agents
          chmod +x cli.js

      - name: Security Review
        run: |
          node agents/cli.js task "Review PR for security vulnerabilities"

      - name: Performance Review
        run: |
          node agents/cli.js task "Review PR for performance issues"

      - name: Code Quality Review
        run: |
          node agents/cli.js task "Review PR for code quality and best practices"

      - name: Comment Results
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Agent review completed! Check the workflow logs for details.'
            })
```

---

## 4️⃣ Git Hooks Integration

### Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash

echo "🤖 Running agent pre-commit review..."

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
  echo "No staged files to review"
  exit 0
fi

# Review frontend files
FRONTEND_FILES=$(echo "$STAGED_FILES" | grep -E '\.(tsx?|jsx?)$' || true)
if [ ! -z "$FRONTEND_FILES" ]; then
  echo "📝 Reviewing frontend files..."
  node agents/cli.js task "Review staged frontend changes for best practices"
fi

# Review backend files
BACKEND_FILES=$(echo "$STAGED_FILES" | grep 'backend/.*\.js$' || true)
if [ ! -z "$BACKEND_FILES" ]; then
  echo "📝 Reviewing backend files..."
  node agents/cli.js task "Review staged backend changes for security and performance"
fi

echo "✅ Pre-commit review complete!"
exit 0
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

### Using Husky (Recommended)

```bash
npm install --save-dev husky

# Initialize husky
npx husky init

# Add pre-commit hook
npx husky add .husky/pre-commit "node agents/cli.js task 'Review staged changes'"
```

---

## 5️⃣ Frontend Integration

### React Component for Agent Assistance

Create `frontend/src/components/developer/AgentAssistant.tsx`:

```typescript
import React, { useState } from 'react';
import axios from 'axios';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
  expertise: string[];
}

const AgentAssistant: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [task, setTask] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchAgents = async () => {
    try {
      const response = await axios.get('/api/developer/agents');
      setAgents(response.data.agents);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const submitTask = async () => {
    if (!task.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post('/api/developer/task', {
        description: task
      });
      setResult(response.data.result);
    } catch (error) {
      console.error('Failed to submit task:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="agent-assistant">
      <h2>🤖 Senior Engineering Team</h2>

      <button onClick={fetchAgents}>
        Load Agents
      </button>

      {agents.length > 0 && (
        <div className="agents-list">
          <h3>Available Agents</h3>
          {agents.map(agent => (
            <div key={agent.id} className="agent-card">
              <h4>{agent.name}</h4>
              <p>{agent.role}</p>
              <span className={`status ${agent.status}`}>
                {agent.status}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="task-form">
        <h3>Ask for Help</h3>
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Describe your task or question..."
          rows={4}
        />
        <button onClick={submitTask} disabled={loading}>
          {loading ? 'Processing...' : 'Submit Task'}
        </button>
      </div>

      {result && (
        <div className="task-result">
          <h3>Recommendation</h3>
          <pre>{result.execution?.recommendation}</pre>
        </div>
      )}
    </div>
  );
};

export default AgentAssistant;
```

---

## 6️⃣ VSCode Integration

### Add to VSCode Tasks

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Agent: List All",
      "type": "shell",
      "command": "node agents/cli.js list",
      "problemMatcher": []
    },
    {
      "label": "Agent: Team Status",
      "type": "shell",
      "command": "node agents/cli.js team",
      "problemMatcher": []
    },
    {
      "label": "Agent: Code Review",
      "type": "shell",
      "command": "node agents/cli.js task 'Review ${relativeFile}'",
      "problemMatcher": []
    }
  ]
}
```

Usage: `Cmd/Ctrl + Shift + P` → "Tasks: Run Task" → Select agent task

---

## 📊 Usage Examples

### Example 1: Pre-deployment Check

```javascript
// scripts/pre-deploy.js
const { getOrchestrator } = require('./agents/AgentOrchestrator');

async function preDeploymentCheck() {
  const orchestrator = getOrchestrator();
  await orchestrator.initialize();

  console.log('🔍 Running pre-deployment checks...\n');

  const checks = [
    'Review backend API security',
    'Check database migration scripts',
    'Verify environment variables',
    'Review Nginx configuration',
    'Check frontend build optimization'
  ];

  for (const check of checks) {
    console.log(`Checking: ${check}`);
    const result = await orchestrator.executeMultiAgentTask({
      description: check,
      type: 'review'
    });
    console.log(`✅ ${result.execution.primaryAgent} completed review\n`);
  }

  console.log('✅ All pre-deployment checks complete!');
}

preDeploymentCheck();
```

Run before deployment:
```bash
node scripts/pre-deploy.js
```

---

## 🎯 Best Practices

### 1. Use in Development
- Code reviews before commits
- Architecture decisions
- Performance optimization
- Security audits

### 2. Integrate with CI/CD
- Automated code reviews
- Security scanning
- Performance checks
- Quality gates

### 3. Documentation
- Generate API docs
- Update README files
- Create integration guides
- Document decisions

### 4. Team Collaboration
- Share agent recommendations
- Document architectural decisions
- Create best practice guides
- Knowledge sharing

---

## 🚀 Advanced Integration

### Custom Agent for Your Domain

Create `agents/senior-experts/BeautyCitaSpecialist.js`:

```javascript
class BeautyCitaSpecialist {
  constructor() {
    this.name = 'Beauty Domain Expert';
    this.expertise = [
      'Booking system patterns',
      'Stylist-client matching',
      'Payment flow optimization',
      'Appointment scheduling',
      'Review system design'
    ];
  }

  reviewBookingFlow(flow) {
    // Custom logic for BeautyCita booking system
    const recommendations = [];

    // Check for double-booking prevention
    if (!flow.includes('concurrency check')) {
      recommendations.push({
        priority: 'high',
        area: 'Booking Safety',
        suggestion: 'Add optimistic locking to prevent double bookings'
      });
    }

    // Check for cancellation policy
    if (!flow.includes('cancellation')) {
      recommendations.push({
        priority: 'medium',
        area: 'User Experience',
        suggestion: 'Implement clear cancellation policy and refund logic'
      });
    }

    return recommendations;
  }
}

module.exports = BeautyCitaSpecialist;
```

Add to orchestrator config and start using domain-specific intelligence!

---

## 📞 Support

Need help integrating?

```bash
node agents/cli.js task "Help me integrate agents into my development workflow"
```

---

**Made with 💜 by the BeautyCita Engineering Team**
