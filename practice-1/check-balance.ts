import 'dotenv/config';
import { LAMPORTS_PER_SOL, Connection, clusterApiUrl } from '@solana/web3.js';
import { getKeypairFromEnvironment } from '@solana-developers/helpers';

const connection = new Connection(clusterApiUrl('devnet'));

console.log('Connected to devnet');

const keyPair = getKeypairFromEnvironment('SECRET_KEY');
const publicKey = keyPair.publicKey;
const balanceInLamports = await connection.getBalance(publicKey);
const balanceInSOL = balanceInLamports / LAMPORTS_PER_SOL;

console.log(
  `The balance for the wallet at address ${publicKey.toBase58()} is: ${balanceInSOL}`,
);
