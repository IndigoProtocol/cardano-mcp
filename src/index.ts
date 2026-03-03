import { CardanoMcpServer } from './CardanoMcpServer';
import dotenv from 'dotenv';

dotenv.config()

const server: CardanoMcpServer = new CardanoMcpServer(Number(process.env.PORT ?? 8000));

await server.start();

