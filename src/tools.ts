import { z } from 'zod';
import { WalletManager } from './WalletManager';
import { fromHex, TxSignBuilder, TxSigned, UTxO, utxosToCores } from '@lucid-evolution/lucid';
import { ADA_HANDLE_POLICY_ID } from './constants';
import { Delegation } from '@lucid-evolution/core-types';

export default [
    {
        name: 'submit_transaction',
        description: 'Sign and submit a Cardano transaction from the connected wallet.',
        inputSchema: {
            cbor: z.string().describe('Cardano un-signed transaction CBOR'),
        },
        handler: submitTransaction,
    },
    {
        name: 'get_addresses',
        description: 'Retrieve Cardano addresses for the connected wallet.',
        inputSchema: {},
        handler: getAddresses,
    },
    {
        name: 'get_utxos',
        description: 'Retrieve all Cardano UTxOs for the connected wallet.',
        inputSchema: {},
        handler: getUtxos,
    },
    {
        name: 'get_balances',
        description: 'Retrieve all Cardano balances for the connected wallet.',
        inputSchema: {},
        handler: getBalances,
    },
    {
        name: 'get_adahandles',
        description: 'Retrieve all ADAHandles (https://handle.me/) for the connected wallet.',
        inputSchema: {},
        handler: getAdaHandles,
    },
    {
        name: 'get_stake_delegation',
        description: 'Retrieve the staked pool ID & available ADA rewards for the connected wallet.',
        inputSchema: {},
        handler: getDelegation,
    },
];

export async function submitTransaction(wallet: WalletManager, cbor: string) {
    try {
        const transaction: TxSignBuilder = wallet.lucid.fromTx(cbor)
        const signer: TxSignBuilder = await transaction.sign.withWallet()
        const signedTransaction: TxSigned = await signer.complete();
        const transactionHash: string = await signedTransaction.submit();

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    transactionHash: transactionHash,
                    timestamp: (new Date()).valueOf(),
                }),
            }]
        };
    } catch (e) {
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

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    addresses: uniqueAddresses,
                }),
            }]
        };
    } catch (e) {
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

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    utxos: utxosToCores(utxos),
                }),
            }]
        };
    } catch (e) {
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

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    balances: Object.keys(balances).map((unit: string) => {
                        return {
                            name: unit === 'lovelace' ? 'ADA' : Buffer.from(fromHex(unit.slice(56))).toString(),
                            policyId: unit === 'lovelace' ? '' : unit.slice(0, 56),
                            nameHex: unit === 'lovelace' ? '' : unit.slice(56),
                            amount: Number(balances[unit]),
                        };
                    })
                }),
            }],
        };
    } catch (e) {
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

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    adaHandles: adaHandles,
                }),
            }],
        };
    } catch (e) {
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

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    poolId: delegation.poolId,
                    availableAdaRewards: Number(delegation.rewards) / 10**6,
                }),
            }],
        };
    } catch (e) {
        return {
            content: [{
                type: 'text',
                text: `Unable to retrieve delegation : ${e}`,
            }]
        };
    }
}