# Cardano MCP Server

[![Smithery](https://smithery.ai/badge/@indigoprotocol/cardano-mcp)](https://smithery.ai/server/@indigoprotocol/cardano-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@indigoprotocol/cardano-mcp)](https://www.npmjs.com/package/@indigoprotocol/cardano-mcp)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/IndigoProtocol/cardano-mcp)

MCP server for interacting with the **Cardano blockchain** from AI agents and automation systems via the [Model Context Protocol](https://modelcontextprotocol.io/).

Part of the [Indigo AI Stack](https://github.com/IndigoProtocol) — use alongside [Indigo MCP](https://github.com/IndigoProtocol/indigo-mcp) for full Cardano DeFi capabilities.

## Features

- Submit signed transactions to the Cardano network
- Retrieve wallet addresses and UTxOs
- Fetch token balances (ADA + native tokens)
- Resolve ADAHandles (handle.me)
- Check stake delegation and claimable rewards
- Wallet-aware tools powered by Lucid Evolution

## Quick Start

### Automatic Setup (Recommended)

Run the interactive setup to automatically configure your MCP client:

```bash
npx @indigoprotocol/cardano-mcp setup
```

This will:
1. Ask which client you're using (Claude Desktop, Claude Code, Cursor, Windsurf)
2. Prompt for your Blockfrost Project ID
3. Prompt for your wallet seed phrase (stored locally, never exposed to LLMs)
4. Automatically update your config file

### Manual Installation

Install globally:

```bash
npm install -g @indigoprotocol/cardano-mcp
```

Or run directly with npx:

```bash
npx @indigoprotocol/cardano-mcp
```

### Docker

```bash
docker build -t cardano-mcp .
docker run -p 8000:8000 \
  -e PORT=8000 \
  -e SEED_PHRASE="your seed phrase here" \
  -e BLOCKFROST_PROJECT_ID="your_blockfrost_key" \
  cardano-mcp
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SEED_PHRASE` | Yes | Your wallet seed phrase (comma-separated). Never exposed to LLMs. |
| `BLOCKFROST_PROJECT_ID` | Yes* | Blockfrost API key from [blockfrost.io](https://blockfrost.io/) |
| `KUPO_URL` | Alt | Kupo endpoint URL (alternative to Blockfrost) |
| `OGMIOS_URL` | Alt | Ogmios endpoint URL (alternative to Blockfrost) |
| `PORT` | No | HTTP server port (default: 8000) |

*Either `BLOCKFROST_PROJECT_ID` or both `KUPO_URL` + `OGMIOS_URL` are required.

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```bash
# macOS
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Windows (PowerShell)
notepad "$env:APPDATA\Claude\claude_desktop_config.json"
```

```json
{
  "mcpServers": {
    "cardano": {
      "command": "npx",
      "args": ["-y", "@indigoprotocol/cardano-mcp"],
      "env": {
        "SEED_PHRASE": "word1,word2,word3,...",
        "BLOCKFROST_PROJECT_ID": "mainnetXXXXXXXXXXXXXXX"
      }
    }
  }
}
```

### Claude Code (CLI)

Add to `~/.claude/settings.json` or `.claude/settings.json` in your project:

```bash
nano ~/.claude/settings.json
```

```json
{
  "mcpServers": {
    "cardano": {
      "command": "npx",
      "args": ["-y", "@indigoprotocol/cardano-mcp"],
      "env": {
        "SEED_PHRASE": "word1,word2,word3,...",
        "BLOCKFROST_PROJECT_ID": "mainnetXXXXXXXXXXXXXXX"
      }
    }
  }
}
```

### Cursor

Add to `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project-level):

```json
{
  "mcpServers": {
    "cardano": {
      "command": "npx",
      "args": ["-y", "@indigoprotocol/cardano-mcp"],
      "env": {
        "SEED_PHRASE": "word1,word2,word3,...",
        "BLOCKFROST_PROJECT_ID": "mainnetXXXXXXXXXXXXXXX"
      }
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "cardano": {
      "command": "npx",
      "args": ["-y", "@indigoprotocol/cardano-mcp"],
      "env": {
        "SEED_PHRASE": "word1,word2,word3,...",
        "BLOCKFROST_PROJECT_ID": "mainnetXXXXXXXXXXXXXXX"
      }
    }
  }
}
```

## Available Tools

### Transaction Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `submit_transaction` | Sign and submit a Cardano transaction from the connected wallet | `cbor`: unsigned transaction CBOR hex string |

**Output:** `{ transactionHash: string, timestamp: number }`

### Address Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_addresses` | Retrieve all Cardano addresses for the connected wallet | None |

**Output:** `{ addresses: string[] }`

### UTxO Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_utxos` | Retrieve all UTxOs for the connected wallet in raw CBOR format | None |

**Output:** `{ utxos: string[] }` (CBOR hex encoded)

### Balance Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_balances` | Retrieve all token balances for the connected wallet | None |

**Output:**
```json
{
  "balances": [
    {
      "name": "ADA",
      "policyId": "",
      "nameHex": "",
      "amount": 1500000000
    },
    {
      "name": "INDY",
      "policyId": "533bb94...",
      "nameHex": "494e4459",
      "amount": 100000000
    }
  ]
}
```

### ADAHandle Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_adahandles` | Retrieve all ADAHandles ([handle.me](https://handle.me/)) owned by the connected wallet | None |

**Output:** `{ adaHandles: string[] }` (e.g., `["$myhandle", "$another"]`)

### Staking Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_stake_delegation` | Retrieve stake pool delegation and available ADA rewards | None |

**Output:**
```json
{
  "poolId": "pool1...",
  "availableAdaRewards": 12.5
}
```

## Example Usage

### Check Wallet Balance

```
"What's my ADA balance?"
```

Claude will use `get_balances` and respond with your ADA and token holdings.

### Submit a Transaction

```
"Submit this transaction: 84a400..."
```

Claude will use `submit_transaction` to sign and submit the CBOR transaction, returning the transaction hash.

### Check Staking Rewards

```
"How much staking rewards do I have available?"
```

Claude will use `get_stake_delegation` to show your staked pool and claimable rewards.

### Resolve ADAHandles

```
"What ADAHandles do I own?"
```

Claude will use `get_adahandles` to list all your handle.me handles.

## Security

⚠️ **Important:** Your seed phrase is stored locally and used only for wallet operations. It is **never** exposed to LLMs or external services.

- The seed phrase is only used by the local Lucid Evolution wallet instance
- All transaction signing happens locally before submission
- No private keys are ever transmitted

## Related Projects

- [Indigo MCP](https://github.com/IndigoProtocol/indigo-mcp) — 60+ tools for Indigo Protocol (CDPs, staking, stability pools, DEX)
- [Indigo AI Skills](https://github.com/IndigoProtocol/indigo-ai) — AI agent skills for Indigo workflows
- [Cardano AI Skills](https://github.com/IndigoProtocol/cardano-ai) — AI agent skills for Cardano operations

## Disclaimer

By using this Cardano MCP Server and all related tools and technology ("MCP"), you acknowledge and agree that:

1. Your use of decentralized finance, including MCP and/or AI agents that you empower to manage your digital assets, involves various significant financial risks
2. These risks include but are not limited to: risk of financial loss caused by MCP design or instructions, impermanent loss, and changes in digital asset prices
3. You are solely responsible for all MCP actions and transactions
4. You are solely responsible for securing your seed phrase, private keys, and environment configuration

## License

MIT
