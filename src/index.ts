#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { WalletManager } from './WalletManager.js';
import { registerTools } from './tools.js';

const NAME = 'cardano-mcp';
const VERSION = '1.0.0';

export function createServer(wallet: WalletManager): McpServer {
    const server = new McpServer(
        { name: NAME, version: VERSION },
        { capabilities: { tools: {} } },
    );

    registerTools(server, wallet);

    return server;
}

async function main(): Promise<void> {
    const wallet = new WalletManager();
    await wallet.load();

    const transport = process.env.TRANSPORT ?? 'stdio';

    if (transport === 'http') {
        const { CardanoMcpServer } = await import('./CardanoMcpServer.js');
        const httpServer = new CardanoMcpServer(wallet, Number(process.env.PORT ?? 8000));
        await httpServer.start();
    } else {
        const server = createServer(wallet);
        const stdioTransport = new StdioServerTransport();
        await server.connect(stdioTransport);
    }
}

// Handle setup command or start server
if (process.argv[2] === 'setup') {
    import('./cli/setup.js').catch((err) => {
        console.error('Failed to run setup:', err);
        process.exit(1);
    });
} else {
    main().catch((error: unknown) => {
        process.stderr.write(`Cardano MCP error: ${error}\n`);
        process.exit(1);
    });
}