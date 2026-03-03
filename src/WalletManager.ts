import { Blockfrost, Kupmios, Lucid } from '@lucid-evolution/lucid';
import { logger } from './logger';

export class WalletManager {

    protected _lucid!: Awaited<ReturnType<typeof Lucid>>;

    async load() {
        const seedPhrase: string | undefined = process.env.SEED_PHRASE;

        if (! seedPhrase) {
            throw new Error('Please specify your seed phrase in the .env');
        }

        const blockfrostProjectId: string | undefined = process.env.BLOCKFROST_PROJECT_ID;
        const kupoUrl: string | undefined = process.env.KUPO_URL;
        const ogmiosUrl: string | undefined = process.env.OGMIOS_URL;

        if (blockfrostProjectId) {
            this._lucid = await Lucid(
                new Blockfrost('https://cardano-mainnet.blockfrost.io/api/v0', blockfrostProjectId),
                'Mainnet'
            );
        } else if (kupoUrl && ogmiosUrl) {
            this._lucid = await Lucid(
                new Kupmios(kupoUrl, ogmiosUrl),
                'Mainnet'
            )
        } else {
            throw new Error('Please specify either Blockfrost Project ID or Kupo/Ogmios secrets in the .env');
        }

        this._lucid.selectWallet.fromSeed(
            seedPhrase.replaceAll(',', ' ')
        );

        logger.info('Cardano wallet loaded!');
    }

    get lucid() {
        return this._lucid;
    }

}