const Anthropic = require('@anthropic-ai/sdk');
const { query } = require('../db');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const winston = require('winston');

const execAsync = promisify(exec);

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'claude-agent' },
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/claude-agent-error.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/claude-agent.log')
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Configuration
const CONFIG = {
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  MODEL: 'claude-sonnet-4-20250514',
  MAX_TOKENS: 8000,
  POLL_INTERVAL_MS: 60000, // Check every minute
  PROJECT_ROOT: '/var/www/beautycita.com',
  DRY_RUN: process.env.CLAUDE_AGENT_DRY_RUN === 'true',
  ENABLE_GIT_COMMITS: process.env.CLAUDE_AGENT_GIT === 'true',
  MAX_COST_PER_DAY: parseFloat(process.env.CLAUDE_AGENT_MAX_COST || '10'), // $10/day max
  NOTIFICATION_EMAIL: process.env.CLAUDE_AGENT_NOTIFICATION_EMAIL || 'admin@beautycita.com'
};

// Safety whitelist - operations that are always safe
const SAFE_OPERATIONS = [
  'read_file',
  'search_code',
  'analyze_logs',
  'run_tests',
  'check_syntax',
  'lint_code'
];

// High-risk operations that require extra caution
const HIGH_RISK_OPERATIONS = [
  'database_migration',
  'delete_file',
  'modify_production_config',
  'restart_service',
  'deploy_code'
];

class ClaudeAgent {
  constructor() {
    if (!CONFIG.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    this.client = new Anthropic({
      apiKey: CONFIG.ANTHROPIC_API_KEY,
    });

    this.isRunning = false;
    this.currentTask = null;
    this.costToday = 0;
    this.lastResetDate = new Date().toDateString();
  }

  /**
   * Start the daemon - poll for critical tasks
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Agent already running');
      return;
    }

    this.isRunning = true;
    logger.info('🤖 Claude Agent Daemon started', {
      dryRun: CONFIG.DRY_RUN,
      model: CONFIG.MODEL,
      pollInterval: CONFIG.POLL_INTERVAL_MS
    });

    // Main polling loop
    while (this.isRunning) {
      try {
        await this.checkAndProcessTasks();
        await this.sleep(CONFIG.POLL_INTERVAL_MS);
      } catch (error) {
        logger.error('Error in main loop:', error);
        await this.sleep(CONFIG.POLL_INTERVAL_MS);
      }
    }
  }

  /**
   * Stop the daemon
   */
  stop() {
    this.isRunning = false;
    logger.info('🛑 Claude Agent Daemon stopped');
  }

  /**
   * Check for critical tasks and process them
   */
  async checkAndProcessTasks() {
    // Reset daily cost counter
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.costToday = 0;
      this.lastResetDate = today;
      logger.info('💰 Daily cost counter reset');
    }

    // Check cost limit
    if (this.costToday >= CONFIG.MAX_COST_PER_DAY) {
      logger.warn('💸 Daily cost limit reached', {
        cost: this.costToday,
        limit: CONFIG.MAX_COST_PER_DAY
      });
      return;
    }

    // Query for critical tasks
    const result = await query(`
      SELECT id, title, description, type, priority, status, created_at
      FROM issues
      WHERE type = 'task'
        AND priority = 'critical'
        AND status = 'todo'
      ORDER BY created_at ASC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      logger.debug('No critical tasks found');
      return;
    }

    const task = result.rows[0];
    logger.info('🎯 Found critical task', {
      id: task.id,
      title: task.title
    });

    await this.processTask(task);
  }

  /**
   * Process a single task
   */
  async processTask(task) {
    this.currentTask = task;

    try {
      // Update status to in_progress
      await query(
        'UPDATE issues SET status = $1, updated_at = NOW() WHERE id = $2',
        ['in_progress', task.id]
      );

      logger.info('📋 Processing task', {
        id: task.id,
        title: task.title
      });

      // Create context for Claude
      const context = await this.gatherContext(task);

      // Call Claude API
      const response = await this.callClaude(task, context);

      // Execute the solution
      const result = await this.executeSolution(task, response);

      if (result.success) {
        // Mark as done
        await query(
          'UPDATE issues SET status = $1, completed_at = NOW() WHERE id = $2',
          ['done', task.id]
        );

        logger.info('✅ Task completed successfully', {
          id: task.id,
          title: task.title,
          result: result.summary
        });

        await this.notifyCompletion(task, result);
      } else {
        // Mark as pending_review if there were issues
        await query(
          `UPDATE issues
           SET status = $1,
               description = description || E'\n\n---\n**Agent Notes:**\n' || $2
           WHERE id = $3`,
          ['pending_review', result.error || 'Partial completion - needs review', task.id]
        );

        logger.warn('⚠️ Task needs review', {
          id: task.id,
          error: result.error
        });

        await this.notifyError(task, result);
      }

    } catch (error) {
      logger.error('❌ Error processing task', {
        id: task.id,
        error: error.message,
        stack: error.stack
      });

      // Update issue with error
      await query(
        `UPDATE issues
         SET status = $1,
             description = description || E'\n\n---\n**Agent Error:**\n' || $2
         WHERE id = $3`,
        ['pending_review', error.message, task.id]
      );

      await this.notifyError(task, { error: error.message });

    } finally {
      this.currentTask = null;
    }
  }

  /**
   * Gather context about the system for Claude
   */
  async gatherContext(task) {
    const context = {
      projectRoot: CONFIG.PROJECT_ROOT,
      timestamp: new Date().toISOString(),
      systemInfo: {},
      recentLogs: [],
      codebase: {}
    };

    try {
      // Get system status
      const { stdout: gitStatus } = await execAsync('git status --short', {
        cwd: CONFIG.PROJECT_ROOT
      });
      context.systemInfo.gitStatus = gitStatus;

      // Get recent backend logs
      const { stdout: logs } = await execAsync(
        'tail -100 /var/www/beautycita.com/backend/logs/combined-0.log'
      );
      context.recentLogs = logs.split('\n').slice(-50); // Last 50 lines

      // Get package.json for dependency info
      const packageJson = await fs.readFile(
        path.join(CONFIG.PROJECT_ROOT, 'package.json'),
        'utf-8'
      );
      context.codebase.dependencies = JSON.parse(packageJson).dependencies;

    } catch (error) {
      logger.warn('Error gathering context', { error: error.message });
    }

    return context;
  }

  /**
   * Call Claude API to get solution
   */
  async callClaude(task, context) {
    const systemPrompt = `You are an autonomous AI agent responsible for fixing critical issues in the BeautyCita platform.

Project: BeautyCita - Beauty services booking platform
Stack: Node.js, Express, PostgreSQL, React, Vite
Location: ${CONFIG.PROJECT_ROOT}

Your capabilities:
- Read and analyze code
- Modify files
- Run commands
- Check logs
- Run tests
- Create git commits

Safety Rules:
1. Always test changes before deploying
2. Never delete data without explicit instruction
3. Create backups before destructive operations
4. Use git commits for all code changes
5. If unsure, mark task for human review

Current Mode: ${CONFIG.DRY_RUN ? 'DRY RUN (preview only)' : 'LIVE EXECUTION'}`;

    const userPrompt = `CRITICAL TASK:
Title: ${task.title}
Description: ${task.description}

CONTEXT:
${JSON.stringify(context, null, 2)}

Please analyze this task and provide:
1. Your understanding of the problem
2. Proposed solution with specific steps
3. Files that need to be modified
4. Commands to run
5. Tests to verify the fix
6. Risk assessment (low/medium/high)

Respond in JSON format with this structure:
{
  "understanding": "brief summary",
  "solution": ["step 1", "step 2", ...],
  "files_to_modify": [{"path": "...", "changes": "..."}],
  "commands": ["command 1", "command 2"],
  "tests": ["test command 1"],
  "risk_level": "low|medium|high",
  "requires_human_review": true/false
}`;

    logger.info('🧠 Calling Claude API', {
      model: CONFIG.MODEL,
      taskId: task.id
    });

    const message = await this.client.messages.create({
      model: CONFIG.MODEL,
      max_tokens: CONFIG.MAX_TOKENS,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    });

    // Track cost
    const cost = this.estimateCost(message.usage);
    this.costToday += cost;
    logger.info('💰 API call cost', {
      cost: cost.toFixed(4),
      totalToday: this.costToday.toFixed(2)
    });

    // Parse response
    const responseText = message.content[0].text;
    let solution;

    try {
      // Extract JSON from response (might be in markdown code block)
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                        responseText.match(/\{[\s\S]*\}/);
      solution = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText);
    } catch (error) {
      throw new Error(`Failed to parse Claude response: ${responseText}`);
    }

    return solution;
  }

  /**
   * Execute the solution provided by Claude
   */
  async executeSolution(task, solution) {
    logger.info('🔧 Executing solution', {
      taskId: task.id,
      riskLevel: solution.risk_level,
      stepsCount: solution.solution.length
    });

    if (CONFIG.DRY_RUN) {
      logger.info('🔍 DRY RUN - Would execute:', {
        solution: solution.solution,
        files: solution.files_to_modify,
        commands: solution.commands
      });

      return {
        success: true,
        dryRun: true,
        summary: 'Dry run completed - no changes made'
      };
    }

    // Check if requires human review
    if (solution.requires_human_review || solution.risk_level === 'high') {
      logger.warn('⚠️ Task requires human review', {
        taskId: task.id,
        reason: 'High risk or complex changes'
      });

      return {
        success: false,
        error: 'Task requires human review due to high risk level'
      };
    }

    const results = {
      filesModified: [],
      commandsRun: [],
      testsRun: [],
      errors: []
    };

    try {
      // Modify files
      for (const fileChange of solution.files_to_modify || []) {
        try {
          const filePath = path.join(CONFIG.PROJECT_ROOT, fileChange.path);
          await fs.writeFile(filePath, fileChange.changes);
          results.filesModified.push(fileChange.path);
          logger.info('📝 Modified file', { path: fileChange.path });
        } catch (error) {
          results.errors.push(`File error: ${fileChange.path} - ${error.message}`);
        }
      }

      // Run commands
      for (const command of solution.commands || []) {
        try {
          const { stdout, stderr } = await execAsync(command, {
            cwd: CONFIG.PROJECT_ROOT,
            timeout: 300000 // 5 minute timeout
          });
          results.commandsRun.push({ command, stdout, stderr });
          logger.info('⚙️ Executed command', { command });
        } catch (error) {
          results.errors.push(`Command error: ${command} - ${error.message}`);
        }
      }

      // Run tests
      for (const test of solution.tests || []) {
        try {
          const { stdout, stderr } = await execAsync(test, {
            cwd: CONFIG.PROJECT_ROOT,
            timeout: 300000
          });
          results.testsRun.push({ test, stdout, stderr });
          logger.info('✓ Test passed', { test });
        } catch (error) {
          results.errors.push(`Test failed: ${test} - ${error.message}`);
        }
      }

      // Create git commit if enabled
      if (CONFIG.ENABLE_GIT_COMMITS && results.filesModified.length > 0) {
        const commitMessage = `[Claude Agent] ${task.title}\n\nIssue #${task.id}\n${solution.understanding}`;
        await execAsync(`git add . && git commit -m "${commitMessage}"`, {
          cwd: CONFIG.PROJECT_ROOT
        });
        logger.info('📦 Git commit created');
      }

      return {
        success: results.errors.length === 0,
        summary: `Modified ${results.filesModified.length} files, ran ${results.commandsRun.length} commands`,
        details: results
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: results
      };
    }
  }

  /**
   * Estimate API call cost
   */
  estimateCost(usage) {
    // Claude pricing (approximate)
    const inputCostPerToken = 0.000003; // $3 per million input tokens
    const outputCostPerToken = 0.000015; // $15 per million output tokens

    return (usage.input_tokens * inputCostPerToken) +
           (usage.output_tokens * outputCostPerToken);
  }

  /**
   * Send notification on task completion
   */
  async notifyCompletion(task, result) {
    // TODO: Integrate with email service or Slack
    logger.info('📧 Notification: Task completed', {
      taskId: task.id,
      title: task.title,
      result: result.summary
    });
  }

  /**
   * Send notification on error
   */
  async notifyError(task, result) {
    logger.error('📧 Notification: Task failed', {
      taskId: task.id,
      title: task.title,
      error: result.error
    });
  }

  /**
   * Helper: sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ClaudeAgent;
