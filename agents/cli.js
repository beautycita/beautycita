#!/usr/bin/env node

/**
 * BeautyCita Agent Team CLI
 *
 * Command-line interface for interacting with the senior engineering team
 */

const { getOrchestrator } = require('./AgentOrchestrator');

const commands = {
  help: displayHelp,
  list: listAgents,
  info: agentInfo,
  team: teamSummary,
  task: assignTask,
  expertise: findExpertise
};

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  if (!commands[command]) {
    console.error(`❌ Unknown command: ${command}`);
    displayHelp();
    process.exit(1);
  }

  try {
    await commands[command](args.slice(1));
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

function displayHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║         🤖 BeautyCita Senior Engineering Team CLI             ║
╚═══════════════════════════════════════════════════════════════╝

Available Commands:

  📋 list                    - List all senior expert agents
  ℹ️  info <agent-id>         - Get detailed info about an agent
  👥 team                    - Display team summary and stats
  🎯 task "<description>"    - Route a task to appropriate agent(s)
  🔍 expertise <keyword>     - Find agents by expertise area
  ❓ help                    - Display this help message

Examples:

  node agents/cli.js list
  node agents/cli.js info frontend-senior
  node agents/cli.js task "Optimize React component rendering"
  node agents/cli.js expertise "PostgreSQL"

Agent IDs:
  - frontend-senior       - Elena Rodriguez (Frontend)
  - backend-senior        - Marcus Chen (Backend)
  - database-architect    - Sarah Ahmed (Database)
  - devops-lead          - Alex Morrison (DevOps)
  - ai-ml-engineer       - Dr. Priya Kapoor (AI/ML)
  - security-engineer    - James Parker (Security)
  - integration-specialist - Lisa Thompson (Integrations)
  - qa-testing-lead      - David Kim (QA/Testing)
  - product-architect    - Rachel Green (Architecture)
  `);
}

async function listAgents() {
  console.log('\n🤖 Senior Expert Agents\n');
  console.log('═'.repeat(80));

  const orchestrator = getOrchestrator();
  await orchestrator.initialize();

  const agents = orchestrator.getAllAgents();

  agents.forEach((agent, index) => {
    console.log(`\n${index + 1}. ${agent.name} - ${agent.title}`);
    console.log(`   ID: ${agent.id}`);
    console.log(`   Role: ${agent.role}`);
    console.log(`   Status: ${agent.status === 'available' ? '✅ Available' : '⏳ Busy'}`);
    console.log(`   Top Expertise: ${agent.expertise.slice(0, 3).join(', ')}`);
  });

  console.log('\n' + '═'.repeat(80));
  console.log(`\nTotal Agents: ${agents.length}\n`);
}

async function agentInfo(args) {
  const agentId = args[0];

  if (!agentId) {
    console.error('❌ Please provide an agent ID');
    console.log('Usage: node agents/cli.js info <agent-id>');
    return;
  }

  const orchestrator = getOrchestrator();
  await orchestrator.initialize();

  const agent = orchestrator.getAgent(agentId);

  if (!agent) {
    console.error(`❌ Agent not found: ${agentId}`);
    return;
  }

  console.log(`\n╔═══════════════════════════════════════════════════════════════╗`);
  console.log(`║  ${agent.name} - ${agent.title}`.padEnd(66) + '║');
  console.log(`╚═══════════════════════════════════════════════════════════════╝\n`);

  console.log(`📋 Role: ${agent.role}`);
  console.log(`🆔 ID: ${agent.id}`);
  console.log(`📊 Status: ${agent.status === 'available' ? '✅ Available' : '⏳ Busy'}`);
  console.log(`✅ Tasks Completed: ${agent.tasksCompleted}`);
  console.log(`📈 Success Rate: ${agent.successRate}%\n`);

  console.log(`🎯 Expertise:`);
  agent.expertise.forEach(exp => console.log(`   • ${exp}`));

  console.log(`\n📝 Responsibilities:`);
  agent.responsibilities.forEach(resp => console.log(`   • ${resp}`));

  console.log(`\n🛠️  Tools:`);
  console.log(`   ${agent.tools.join(', ')}`);

  console.log(`\n💻 Languages:`);
  console.log(`   ${agent.languages.join(', ')}\n`);
}

async function teamSummary() {
  const orchestrator = getOrchestrator();
  await orchestrator.initialize();

  const summary = orchestrator.getTeamSummary();

  console.log(`\n╔═══════════════════════════════════════════════════════════════╗`);
  console.log(`║  ${summary.teamName}`.padEnd(66) + '║');
  console.log(`╚═══════════════════════════════════════════════════════════════╝\n`);

  console.log(`👥 Total Agents: ${summary.totalAgents}`);
  console.log(`✅ Available: ${summary.agents.filter(a => a.status === 'available').length}`);
  console.log(`⏳ Busy: ${summary.agents.filter(a => a.status === 'busy').length}\n`);

  console.log(`📊 Team Performance:\n`);

  const totalTasks = summary.agents.reduce((sum, a) => sum + a.tasksCompleted, 0);
  console.log(`   Total Tasks Completed: ${totalTasks}`);

  console.log(`\n🏆 Top Contributors:\n`);
  const sortedAgents = [...summary.agents].sort((a, b) => b.tasksCompleted - a.tasksCompleted);

  sortedAgents.slice(0, 5).forEach((agent, index) => {
    console.log(`   ${index + 1}. ${agent.name} - ${agent.tasksCompleted} tasks`);
  });

  console.log('');
}

async function assignTask(args) {
  const description = args.join(' ');

  if (!description) {
    console.error('❌ Please provide a task description');
    console.log('Usage: node agents/cli.js task "Your task description"');
    return;
  }

  const orchestrator = getOrchestrator();
  await orchestrator.initialize();

  const task = {
    description: description,
    type: 'general'
  };

  console.log(`\n🎯 Routing task: "${description}"\n`);
  console.log('Analyzing task requirements...\n');

  const result = await orchestrator.executeMultiAgentTask(task);

  if (!result.success) {
    console.error(`❌ ${result.message}`);
    if (result.suggestion) {
      console.log(`💡 Suggestion: ${result.suggestion}`);
    }
    return;
  }

  console.log(result.execution.recommendation);
  console.log(`\n✅ Task routing complete!\n`);
}

async function findExpertise(args) {
  const keyword = args[0];

  if (!keyword) {
    console.error('❌ Please provide an expertise keyword');
    console.log('Usage: node agents/cli.js expertise <keyword>');
    return;
  }

  const orchestrator = getOrchestrator();
  await orchestrator.initialize();

  const agents = orchestrator.getAgentsByExpertise(keyword);

  if (agents.length === 0) {
    console.log(`\n❌ No agents found with expertise in: ${keyword}\n`);
    return;
  }

  console.log(`\n🔍 Agents with expertise in "${keyword}":\n`);
  console.log('═'.repeat(80));

  agents.forEach(agent => {
    console.log(`\n👤 ${agent.name} - ${agent.role}`);
    const matchingExpertise = agent.expertise.filter(exp =>
      exp.toLowerCase().includes(keyword.toLowerCase())
    );
    console.log(`   Relevant expertise: ${matchingExpertise.join(', ')}`);
  });

  console.log('\n' + '═'.repeat(80) + '\n');
}

// Run CLI
if (require.main === module) {
  main();
}

module.exports = { main };
