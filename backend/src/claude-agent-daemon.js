#!/usr/bin/env node

/**
 * Claude Agent Daemon
 * Autonomous AI agent that monitors and fixes critical issues
 *
 * Usage:
 *   node claude-agent-daemon.js start
 *   node claude-agent-daemon.js stop
 *   node claude-agent-daemon.js status
 */

const ClaudeAgent = require('./services/claudeAgent');
const fs = require('fs');
const path = require('path');

const PID_FILE = '/var/www/beautycita.com/backend/claude-agent.pid';
const command = process.argv[2];

async function start() {
  // Check if already running
  if (fs.existsSync(PID_FILE)) {
    const pid = fs.readFileSync(PID_FILE, 'utf8');
    try {
      process.kill(pid, 0); // Check if process exists
      console.error('❌ Agent is already running (PID:', pid, ')');
      process.exit(1);
    } catch (e) {
      // Process doesn't exist, clean up stale PID file
      fs.unlinkSync(PID_FILE);
    }
  }

  // Write PID file
  fs.writeFileSync(PID_FILE, process.pid.toString());

  console.log('🤖 Starting Claude Agent Daemon...');
  console.log('📝 PID:', process.pid);
  console.log('🔧 Mode:', process.env.CLAUDE_AGENT_DRY_RUN === 'true' ? 'DRY RUN' : 'LIVE');

  const agent = new ClaudeAgent();

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n🛑 Shutting down gracefully...');
    agent.stop();

    if (fs.existsSync(PID_FILE)) {
      fs.unlinkSync(PID_FILE);
    }

    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // Start the agent
  try {
    await agent.start();
  } catch (error) {
    console.error('❌ Fatal error:', error);

    if (fs.existsSync(PID_FILE)) {
      fs.unlinkSync(PID_FILE);
    }

    process.exit(1);
  }
}

function stop() {
  if (!fs.existsSync(PID_FILE)) {
    console.error('❌ Agent is not running');
    process.exit(1);
  }

  const pid = fs.readFileSync(PID_FILE, 'utf8');

  try {
    process.kill(pid, 'SIGTERM');
    console.log('✅ Sent stop signal to PID:', pid);

    // Wait for process to stop
    setTimeout(() => {
      try {
        process.kill(pid, 0);
        console.warn('⚠️  Process still running, forcing stop...');
        process.kill(pid, 'SIGKILL');
      } catch (e) {
        console.log('✅ Agent stopped successfully');
      }

      if (fs.existsSync(PID_FILE)) {
        fs.unlinkSync(PID_FILE);
      }
    }, 5000);

  } catch (error) {
    console.error('❌ Error stopping agent:', error.message);
    process.exit(1);
  }
}

function status() {
  if (!fs.existsSync(PID_FILE)) {
    console.log('⚫ Agent is not running');
    process.exit(1);
  }

  const pid = fs.readFileSync(PID_FILE, 'utf8');

  try {
    process.kill(pid, 0); // Check if process exists
    console.log('✅ Agent is running (PID:', pid, ')');
    process.exit(0);
  } catch (e) {
    console.log('❌ Agent is not running (stale PID file)');
    fs.unlinkSync(PID_FILE);
    process.exit(1);
  }
}

// Main
switch (command) {
  case 'start':
    start();
    break;
  case 'stop':
    stop();
    break;
  case 'status':
    status();
    break;
  default:
    console.log('Usage: claude-agent-daemon.js {start|stop|status}');
    process.exit(1);
}
