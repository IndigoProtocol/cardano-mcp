import express, { Express } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { logger } from './logger';
import cors from 'cors';
import { registerTools } from './tools';
import { WalletManager } from './WalletManager';

const NAME: string = 'cardano-mcp';
const VERSION: string = '1.0.0';

export class CardanoMcpServer {

    protected _app: Express;

    constructor(
        protected _wallet: WalletManager,
        protected _port: number = 8000,
    ) {
        this._app = express()
    }

    async start() {
        this._app.use(express.json());
        this._app.use(
            cors({
                exposedHeaders: ['mcp-session-id'],
                allowedHeaders: ['Content-Type', 'mcp-session-id'],
            })
        );

        this._app.post('/mcp', this.handleRequest.bind(this));
        this._app.get('/mcp', this.rejectRequest.bind(this));
        this._app.delete('/mcp', this.rejectRequest.bind(this));

        this._app.listen(this._port, () => {
            logger.info(`Cardano MCP started on port ${this._port}`);
        });
    }

    async handleRequest(request: express.Request, response: express.Response) {
        try {
            const server: McpServer = new McpServer({
                name: NAME,
                version: VERSION,
            }, {
                capabilities: {
                    tools: {},
                },
            });

            registerTools(server, this._wallet);

            const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
                sessionIdGenerator: undefined,
            });

            response.on('close', () => {
                transport.close();
                server.close();
            });

            await server.connect(transport);
            await transport.handleRequest(request, response, request.body);
        } catch (e) {
            logger.error(e);

            if (! response.headersSent) {
                response.status(500).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32603,
                        message: 'Internal server error',
                    },
                    id: null,
                });
            }
        }
    }

    rejectRequest(request: express.Request, response: express.Response) {
        response.writeHead(405).end(JSON.stringify({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Method not allowed.'
            },
            id: null
        }));
    }

}
