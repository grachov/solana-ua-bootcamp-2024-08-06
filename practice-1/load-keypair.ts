import 'dotenv/config';
import { Keypair } from '@solana/web3.js';

const privateKey = process.env.SECRET_KEY;

if (!privateKey) {
  console.log('Add SECRET_KEY to .env');

  process.exit(1);
}

const privateKeyAsArray = Uint8Array.from(JSON.parse(privateKey));
const keyPair = Keypair.fromSecretKey(privateKeyAsArray);

console.log(`Public key: ${keyPair.publicKey.toBase58()}`);
