import 'dotenv/config';
import { createMint } from '@solana/spl-token';
import { clusterApiUrl, Connection, Keypair } from '@solana/web3.js';
import { getExplorerLink } from '@solana-developers/helpers';

let privateKey = process.env.SECRET_KEY;

if (!privateKey) {
  console.log('Add SECRET_KEY to .env');

  process.exit(1);
}

const privateKeyAsArray = Uint8Array.from(JSON.parse(privateKey));
const user = Keypair.fromSecretKey(privateKeyAsArray);
const connection = new Connection(clusterApiUrl('devnet'));

console.log(`Our public key is ${user.publicKey.toBase58()}`);

const tokenMint = await createMint(connection, user, user.publicKey, null, 2);
const link = getExplorerLink('address', tokenMint.toString(), 'devnet');

console.log(`Token Mint: ${link}`);
