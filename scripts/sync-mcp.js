#!/usr/bin/env node

/**
 * MCP Configuration Sync Script
 *
 * Reads the universal MCP configuration from .agent/mcp.json
 * and generates tool-specific config files for each AI tool.
 *
 * Usage: npm run mcp:sync
 *
 * Features:
 * - Generates configs for Claude Code, Cursor, etc.
 * - Handles environment variable substitution
 * - Prints instructions for user-home configs (Antigravity)
 * - Validates configuration before writing
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const AGENT_DIR = path.join(ROOT_DIR, '.agent');
const MCP_CONFIG_PATH = path.join(AGENT_DIR, 'mcp.json');

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log();
  log(`━━━ ${title} ━━━`, 'blue');
}

/**
 * Load and parse the universal MCP configuration
 */
function loadUniversalConfig() {
  if (!fs.existsSync(MCP_CONFIG_PATH)) {
    throw new Error(`Universal MCP config not found: ${MCP_CONFIG_PATH}`);
  }

  const content = fs.readFileSync(MCP_CONFIG_PATH, 'utf8');
  return JSON.parse(content);
}

/**
 * Substitute environment variables in a string
 * Supports ${VAR_NAME} syntax
 */
function substituteEnvVars(str, envOverrides = {}) {
  if (typeof str !== 'string') return str;

  return str.replace(/\$\{([^}]+)\}/g, (match, varName) => {
    // Check overrides first, then process.env
    if (envOverrides[varName] !== undefined) {
      return envOverrides[varName];
    }
    if (process.env[varName] !== undefined) {
      return process.env[varName];
    }
    // Return placeholder for missing vars
    return match;
  });
}

/**
 * Build the mcpServers object for a specific tool
 */
function buildToolConfig(config, toolName) {
  const tool = config.tools[toolName];
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  const mcpServers = {};

  for (const [serverName, server] of Object.entries(config.servers)) {
    if (server.status !== 'active') continue;

    const preferredConnection = tool.preferredConnection;
    const connection = server.connections[preferredConnection];

    if (!connection) {
      log(`  ⚠ No ${preferredConnection} connection for ${serverName}`, 'yellow');
      continue;
    }

    // Check if this tool is supported
    if (!connection.supports.includes(toolName)) {
      log(`  ⚠ ${serverName} doesn't support ${toolName} via ${preferredConnection}`, 'yellow');
      continue;
    }

    // Build the server config based on connection type
    if (connection.type === 'http') {
      mcpServers[serverName] = {
        url: connection.url
      };
    } else if (connection.type === 'stdio') {
      // Substitute env vars in args
      const args = connection.args.map(arg => {
        // For SUPABASE_DB_URL, build the full connection string
        if (arg === '${SUPABASE_DB_URL}' && connection.env?.SUPABASE_DB_URL) {
          const dbUrl = substituteEnvVars(connection.env.SUPABASE_DB_URL);
          return dbUrl;
        }
        return substituteEnvVars(arg);
      });

      mcpServers[serverName] = {
        command: connection.command,
        args: args
      };
    }
  }

  return { mcpServers };
}

/**
 * Write a tool-specific config file
 */
function writeToolConfig(toolName, configPath, content) {
  const fullPath = configPath.startsWith('~')
    ? path.join(os.homedir(), configPath.slice(1))
    : path.join(ROOT_DIR, configPath);

  // Ensure directory exists
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Add metadata comment
  const configWithMeta = {
    _generated: true,
    _source: '.agent/mcp.json',
    _generatedAt: new Date().toISOString(),
    _docs: 'DO NOT EDIT - Run `npm run mcp:sync` to regenerate',
    ...content
  };

  fs.writeFileSync(fullPath, JSON.stringify(configWithMeta, null, 2));
  return fullPath;
}

/**
 * Main sync function
 */
function syncMcpConfigs() {
  log('🔄 MCP Configuration Sync', 'blue');
  log('Reading universal config from .agent/mcp.json...', 'dim');

  const config = loadUniversalConfig();

  logSection('Generating Tool Configs');

  const results = {
    generated: [],
    userAction: [],
    errors: []
  };

  for (const [toolName, tool] of Object.entries(config.tools)) {
    try {
      log(`\n📦 ${tool.name} (${toolName})`, 'green');

      if (tool.userHomeRequired) {
        // Can't auto-generate user home configs
        log(`  ℹ Requires manual setup in user home directory`, 'yellow');

        const toolConfig = buildToolConfig(config, toolName);
        const configPath = tool.configPath.replace('~', os.homedir());

        results.userAction.push({
          tool: tool.name,
          path: configPath,
          config: toolConfig
        });

        log(`  → Path: ${configPath}`, 'dim');
      } else {
        // Generate project-scoped config
        const toolConfig = buildToolConfig(config, toolName);
        const writtenPath = writeToolConfig(toolName, tool.configPath, toolConfig);

        log(`  ✓ Generated: ${tool.configPath}`, 'green');
        results.generated.push({
          tool: tool.name,
          path: writtenPath
        });
      }
    } catch (err) {
      log(`  ✗ Error: ${err.message}`, 'red');
      results.errors.push({
        tool: toolName,
        error: err.message
      });
    }
  }

  // Print summary
  logSection('Summary');

  if (results.generated.length > 0) {
    log(`✓ Generated ${results.generated.length} config file(s)`, 'green');
    results.generated.forEach(r => {
      log(`  - ${r.path}`, 'dim');
    });
  }

  if (results.userAction.length > 0) {
    log(`\n⚠ Manual Setup Required:`, 'yellow');
    results.userAction.forEach(r => {
      log(`\n  ${r.tool}:`, 'yellow');
      log(`  Create file: ${r.path}`, 'dim');
      log(`  Contents:`, 'dim');
      console.log(JSON.stringify(r.config, null, 2).split('\n').map(l => '    ' + l).join('\n'));
    });
  }

  if (results.errors.length > 0) {
    log(`\n✗ ${results.errors.length} error(s)`, 'red');
    results.errors.forEach(r => {
      log(`  - ${r.tool}: ${r.error}`, 'red');
    });
  }

  logSection('Environment Variables');
  log('For Postgres connections, set these env vars:', 'dim');
  log('  SUPABASE_DB_PASSWORD=your_password', 'dim');
  log('Or use the full connection URL:', 'dim');
  log('  SUPABASE_DB_URL=postgresql://postgres:pass@host:5432/db', 'dim');

  console.log();
  return results;
}

// Run if called directly
if (require.main === module) {
  try {
    syncMcpConfigs();
  } catch (err) {
    log(`\n✗ Fatal error: ${err.message}`, 'red');
    process.exit(1);
  }
}

module.exports = { syncMcpConfigs, buildToolConfig, loadUniversalConfig };
