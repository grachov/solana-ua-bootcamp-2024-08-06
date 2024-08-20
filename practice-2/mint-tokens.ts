import 'dotenv/config';
import { mintTo } from '@solana/spl-token';
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
const MINOR_UNITS_PER_MAJOR_UNITS = Math.pow(10, 2);
const tokenMintAccount = new PublicKey(
  'BrC1xtjd1cB1Z5uywcSF3QJxGDrTNSTMfZfj6ibTQ2bB',
);
const recipientAssociatedTokenAccount = new PublicKey(
  '8V5WKhtp9xUE2DiC4JmeCCrf4yF3mEmjE4BRpbaALYQP',
);
const transactionSignature = await mintTo(
  connection,
  user,
  tokenMintAccount,
  recipientAssociatedTokenAccount,
  user,
  10 * MINOR_UNITS_PER_MAJOR_UNITS,
);
const link = getExplorerLink('transaction', transactionSignature, 'devnet');

console.log(`Success! Mint Token Transaction: ${link}`);
