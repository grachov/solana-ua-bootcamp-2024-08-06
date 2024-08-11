import 'dotenv/config';
import { Keypair } from '@solana/web3.js';

const keypair = Keypair.generate();

console.log(`Public key is: ${keypair.publicKey.toBase58()}`);
console.log(
  `Private key is: ${JSON.stringify(Object.values(keypair.secretKey))}`,
);
