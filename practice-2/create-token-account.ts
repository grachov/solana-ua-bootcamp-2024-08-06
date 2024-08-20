import 'dotenv/config';
import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { clusterApiUrl, Connection, Keypair, PublicKey } from '@solana/web3.js';
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

const tokenMintAccount = new PublicKey(
  'BrC1xtjd1cB1Z5uywcSF3QJxGDrTNSTMfZfj6ibTQ2bB',
);
const recipient = new PublicKey('EEHYCFJUhUD8GhfKqWkzur6sbAFRUSJv4cVR88FsYa6z');
const tokenAccount = await getOrCreateAssociatedTokenAccount(
  connection,
  user,
  tokenMintAccount,
  recipient,
);

console.log(`Token Account: ${tokenAccount.address.toBase58()}`);

const link = getExplorerLink(
  'address',
  tokenAccount.address.toBase58(),
  'devnet',
);

console.log(`Created token account: ${link}`);
