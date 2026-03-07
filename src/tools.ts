import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WalletManager } from './WalletManager.js';
import { fromHex, TxSignBuilder, TxSigned, UTxO, utxosToCores } from '@lucid-evolution/lucid';
import { ADA_HANDLE_POLICY_ID } from './constants.js';
import { McpTool } from './types.js';
import { Delegation } from '@lucid-evolution/core-types';
import { logger } from './logger.js';

const tools: McpTool[] = [
    {
        name: 'submit_transaction',
        description: 'Sign and submit a Cardano transaction from the connected wallet.',
        inputSchema: {
            cbor: z.string().describe('Cardano un-signed transaction CBOR'),
        },
        outputSchema: {
            transactionHash: z.string().describe('Transaction hash for the submitted CBOR'),
            timestamp: z.number().describe('Millisecond timestamp when the transaction was submitted'),
        },
        handler: submitTransaction,
    },
    {
        name: 'get_addresses',
        description: 'Retrieve Cardano addresses for the connected wallet.',
        inputSchema: {},
        outputSchema: {
            addresses: z.array(z.string()).describe('List of Cardano addresses'),
        },
        handler: getAddresses,
    },
    {
        name: 'get_utxos',
        description: 'Retrieve all Cardano UTxOs for the connected wallet.',
        inputSchema: {},
        outputSchema: {
            utxos: z.array(z.string()).describe('List of Cardano UTxOs in raw format'),
        },
        handler: getUtxos,
    },
    {
        name: 'get_balances',
        description: 'Retrieve all Cardano balances for the connected wallet.',
        inputSchema: {},
        outputSchema: {
            balances: z.array(z.object({
                name: z.string().describe('Human readable name for the asset'),
                policyId: z.string().describe('Policy ID for the asset'),
                nameHex: z.string().describe('Name in hex for the asset'),
                amount: z.number().describe('Amount of asset in the wallet, denominated in lovelace amount (no decimals)'),
            })),
        },
        handler: getBalances,
    },
    {
        name: 'get_adahandles',
        description: 'Retrieve all ADAHandles (https://handle.me/) for the connected wallet.',
        inputSchema: {},
        outputSchema: {
            adaHandles: z.array(z.string()).describe('List of Cardano ADAHandles in the connected wallet'),
        },
        handler: getAdaHandles,
    },
    {
        name: 'get_stake_delegation',
        description: 'Retrieve the staked pool ID & available ADA rewards for the connected wallet.',
        inputSchema: {},
        outputSchema: {
            poolId: z.string().describe('Unique pool ID the wallet is staked to'),
            availableAdaRewards: z.number().describe('Available & claimable ADA staking rewards'),
        },
        handler: getDelegation,
    },
];

export default tools;

export function registerTools(server: McpServer, wallet: WalletManager): void {
    tools.forEach((tool: McpTool) => {
        server.registerTool(
            tool.name,
            {
                title: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema,
                outputSchema: tool.outputSchema,
            },
            async (params: any) => {
                try {
                    return tool.handler(wallet, ...Object.values(params));
                } catch (e) {
                    logger.error(`${e}`);

                    return {
                        content: [{
                            type: 'text' as const,
                            text: `${e}`,
                        }],
                        isError: true,
                    };
                }
            }
        );
    });
}

export async function submitTransaction(wallet: WalletManager, cbor: string) {
    try {
        const transaction: TxSignBuilder = wallet.lucid.fromTx(cbor)
        const signer: TxSignBuilder = await transaction.sign.withWallet()
        const signedTransaction: TxSigned = await signer.complete();
        const transactionHash: string = await signedTransaction.submit();

        const response = {
            transactionHash: transactionHash,
            timestamp: (new Date()).valueOf(),
        }

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(response),
            }],
            structuredContent: response,
        };
    } catch (e) {
        logger.error(`${e}`);

        return {
            content: [{
                type: 'text',
                text: `Unable to submit transaction : ${e}`,
            }]
        };
    }
}

export async function getAddresses(wallet: WalletManager) {
    try {
        const utxos: UTxO[] = await wallet.lucid.wallet().getUtxos();
        const uniqueAddresses: string[] = Array.from(
            new Set(utxos.map((utxo: UTxO) => utxo.address))
        );

        const response = {
            addresses: uniqueAddresses,
        };

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(response),
            }],
            structuredContent: response,
        };
    } catch (e) {
        logger.error(`${e}`);

        return {
            content: [{
                type: 'text',
                text: `Unable to retrieve addresses : ${e}`,
            }]
        };
    }
}

export async function getUtxos(wallet: WalletManager) {
    try {
        const utxos: UTxO[] = await wallet.lucid.wallet().getUtxos();
        const response = {
            utxos: utxosToCores(utxos).map((utxo) => utxo.to_cbor_hex()),
        };

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(response),
            }],
            structuredContent: response,
        };
    } catch (e) {
        logger.error(`${e}`);

        return {
            content: [{
                type: 'text',
                text: `Unable to retrieve UTxOs : ${e}`,
            }]
        };
    }
}

export async function getBalances(wallet: WalletManager) {
    try {
        const utxos: UTxO[] = await wallet.lucid.wallet().getUtxos();
        const balances: Record<string, bigint> = {};

        for (const utxo of utxos) {
            for (const [unit, amount] of Object.entries(utxo.assets)) {
                balances[unit] = (balances[unit] ?? 0n) + amount;
            }
        }

        const response = {
            balances: Object.keys(balances).map((unit: string) => {
                return {
                    name: unit === 'lovelace' ? 'ADA' : Buffer.from(fromHex(unit.slice(56))).toString(),
                    policyId: unit === 'lovelace' ? '' : unit.slice(0, 56),
                    nameHex: unit === 'lovelace' ? '' : unit.slice(56),
                    amount: Number(balances[unit]),
                };
            })
        }

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(response),
            }],
            structuredContent: response,
        };
    } catch (e) {
        logger.error(`${e}`);

        return {
            content: [{
                type: 'text',
                text: `Unable to retrieve wallet balances : ${e}`,
            }]
        };
    }
}

export async function getAdaHandles(wallet: WalletManager) {
    try {
        const utxos: UTxO[] = await wallet.lucid.wallet().getUtxos();
        const adaHandles: string[] = [];

        for (const utxo of utxos) {
            const handlesUnits = Object.keys(utxo.assets)
                .filter((unit: string) => unit.slice(0, 56) === ADA_HANDLE_POLICY_ID);

            adaHandles.push(
                ...handlesUnits.map((unit: string) => Buffer.from(
                    fromHex(unit.slice(56).replace("000de140", ""))
                ).toString())
            );
        }

        const response = {
            adaHandles: adaHandles,
        };

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(response),
            }],
            structuredContent: response,
        };
    } catch (e) {
        logger.error(`${e}`);

        return {
            content: [{
                type: 'text',
                text: `Unable to retrieve ADAHandles : ${e}`,
            }]
        };
    }
}

export async function getDelegation(wallet: WalletManager) {
    try {
        const delegation: Delegation = await wallet.lucid.wallet().getDelegation();
        const response = {
            poolId: delegation.poolId,
            availableAdaRewards: Number(delegation.rewards) / 10**6,
        };

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(response),
            }],
            structuredContent: response,
        };
    } catch (e) {
        logger.error(`${e}`);

        return {
            content: [{
                type: 'text',
                text: `Unable to retrieve delegation : ${e}`,
            }]
        };
    }
}