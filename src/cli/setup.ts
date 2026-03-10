#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as readline from 'readline';

const CONFIG_PATHS: Record<string, Record<string, string>> = {
  'Claude Desktop': {
    darwin: path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
    win32: path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json'),
    linux: path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json'),
  },
  'Claude Code': {
    darwin: path.join(os.homedir(), '.claude', 'settings.json'),
    win32: path.join(os.homedir(), '.claude', 'settings.json'),
    linux: path.join(os.homedir(), '.claude', 'settings.json'),
  },
  'Cursor': {
    darwin: path.join(os.homedir(), '.cursor', 'mcp.json'),
    win32: path.join(os.homedir(), '.cursor', 'mcp.json'),
    linux: path.join(os.homedir(), '.cursor', 'mcp.json'),
  },
  'Windsurf': {
    darwin: path.join(os.homedir(), '.codeium', 'windsurf', 'mcp_config.json'),
    win32: path.join(os.homedir(), '.codeium', 'windsurf', 'mcp_config.json'),
    linux: path.join(os.homedir(), '.codeium', 'windsurf', 'mcp_config.json'),
  },
};

const CARDANO_SERVER_CONFIG = {
  command: 'npx',
  args: ['-y', '@indigoprotocol/cardano-mcp'],
  env: {
    SEED_PHRASE: '',
    BLOCKFROST_PROJECT_ID: '',
  },
};

function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function question(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

function selectOption(rl: readline.Interface, prompt: string, options: string[]): Promise<string> {
  return new Promise((resolve) => {
    console.log(`\n${prompt}`);
    options.forEach((opt, i) => console.log(`  ${i + 1}. ${opt}`));
    rl.question('\nEnter number: ', (answer) => {
      const index = parseInt(answer.trim()) - 1;
      if (index >= 0 && index < options.length) {
        resolve(options[index]);
      } else {
        console.log('Invalid selection, using first option.');
        resolve(options[0]);
      }
    });
  });
}

function readConfig(configPath: string): Record<string, unknown> {
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(content);
    }
  } catch {
    // File doesn't exist or is invalid JSON
  }
  return {};
}

function writeConfig(configPath: string, config: Record<string, unknown>): void {
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

async function main(): Promise<void> {
  console.log('\n🔷 Cardano MCP Setup\n');

  const rl = createReadlineInterface();
  const platform = process.platform as 'darwin' | 'win32' | 'linux';

  try {
    // Select client
    const clients = Object.keys(CONFIG_PATHS);
    const selectedClient = await selectOption(rl, 'Select your MCP client:', clients);

    // Get config path
    const configPath = CONFIG_PATHS[selectedClient][platform];
    if (!configPath) {
      console.error(`❌ Unsupported platform: ${platform}`);
      process.exit(1);
    }

    console.log(`\n📁 Config file: ${configPath}`);

    // Ask for Blockfrost API key
    console.log('\n💡 Get a free Blockfrost API key at: https://blockfrost.io/');
    const blockfrostKey = await question(rl, 'Enter your Blockfrost Project ID: ');

    // Ask for seed phrase
    console.log('\n⚠️  Your seed phrase is stored locally and NEVER exposed to LLMs.');
    console.log('   It is only used for local wallet operations.');
    const seedPhrase = await question(rl, 'Enter your seed phrase (comma-separated, or press Enter to skip): ');

    // Read existing config
    const config = readConfig(configPath);

    // Ensure mcpServers exists
    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    // Add cardano server
    const serverConfig = { ...CARDANO_SERVER_CONFIG };
    serverConfig.env = {
      SEED_PHRASE: seedPhrase || 'word1,word2,word3,...',
      BLOCKFROST_PROJECT_ID: blockfrostKey || 'your-blockfrost-project-id',
    };

    (config.mcpServers as Record<string, unknown>)['cardano'] = serverConfig;

    // Write config
    writeConfig(configPath, config);

    console.log(`\n✅ Added cardano server to ${selectedClient} config`);
    console.log(`   ${configPath}`);
    
    if (!blockfrostKey || !seedPhrase) {
      console.log('\n⚠️  Remember to update the config file with:');
      if (!blockfrostKey) console.log('   - Your Blockfrost Project ID');
      if (!seedPhrase) console.log('   - Your wallet seed phrase');
    }

    console.log(`\n🔄 Restart ${selectedClient} to activate the changes.\n`);

  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});
