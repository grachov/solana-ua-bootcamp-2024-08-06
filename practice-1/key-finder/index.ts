import { Keypair } from '@solana/web3.js';

let keyPairsCount = 0;
let keyPair: Keypair;

while (true) {
  keyPair = Keypair.generate();
  keyPairsCount += 1;

  if (keyPairsCount % 1_000 === 0) {
    process.stdout.write('.');
  }

  if (keyPair.publicKey.toBase58().startsWith('LEV')) {
    break;
  }
}

console.log(`\nPublic key is: ${keyPair.publicKey.toBase58()}`);
console.log(
  `Private key is: ${JSON.stringify(Object.values(keyPair.secretKey))}`,
);
