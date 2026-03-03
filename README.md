<p align="center">
  <img src="https://cdn.simpleicons.org/cardano/0033AD" width="80" />
</p>
<h1 align="center">Cardano MCP Server</h1>

A **Model Context Protocol (MCP) server** for interacting with the Cardano blockchain from AI agents and automation systems.

This server exposes wallet-aware tools for:
- Submitting transactions
- Fetching addresses
- Reading UTxOs
- Fetching balances
- Resolving ADAHandles
- Checking stake delegation

## Secrets
1. Copy the `.env.example` file to a new file `.env`
2. Specify your seed-phrase (`SEED_PHRASE`). Your seed-phrase is NEVER exposed to LLMs, and is only used for local wallet connection.
3. Configure the wallet connection details. Specify a Blockfrost Project ID (https://blockfrost.io/), or a Kupo & Ogmios URL. 

## Docker Installation
Build the container
```bash
docker build -t cardano-mcp .
```
Run with your secrets
```bash
docker run -p 8000:8000 \
  -e PORT=8000 \
  -e SEED_PHRASE="lizard,llama,frog..." \
  -e BLOCKFROST_PROJECT_ID="your_blockfrost_key" \
  cardano-mcp
```

## Manual Installation
Clone this repository
```bash
git clone https://github.com/IndigoProtocol/cardano-mcp.git
```
Install dependencies
```bash
cd cardano-mcp
npm install
```
Build & Run
```bash
npm run dev
- or -
npm run build
npm run start
```

## Connecting
The URL for the Cardano MCP server will be hosted at http://localhost:8000/mcp

## Disclaimer
By using this Cardano MCP Server, you acknowledge and agree that:
- You are solely responsible for any transactions executed using this software.
- You understand the risks associated with blockchain transactions, including irreversible loss of funds.
- You are responsible for securing your seed phrase, private keys, and environment configuration.
- You assume full responsibility for any financial loss, smart contract interaction, or transaction failure.

 Use at your own risk.
