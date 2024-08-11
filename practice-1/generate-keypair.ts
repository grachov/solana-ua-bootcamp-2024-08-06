import { Keypair } from '@solana/web3.js';

const keyPair = Keypair.generate();

console.log(`Public key is: ${keyPair.publicKey.toBase58()}`);
console.log(
  `Private key is: ${JSON.stringify(Object.values(keyPair.secretKey))}`,
);
