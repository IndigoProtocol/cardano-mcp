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
By using this Cardano MCP Server and all related tools and technology (“MPC”), you acknowledge and agree that (i) your use of decentralized finance, including MPC and/or AI agents that you empower to manage your digital assets, involves various significant financial risks, including but not limited to, the risk of financial loss caused by MPC design or instructions, impermanent loss, and changes in digital asset prices; and (ii) that you are solely responsible for all MPC actions and transactions, and for securing your seed phrase, private keys, and environment configuration.
