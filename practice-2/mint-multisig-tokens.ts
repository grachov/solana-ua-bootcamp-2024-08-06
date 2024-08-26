import 'dotenv/config';
import type { Signer } from '@solana/web3.js';
import {
  createMint,
  createMultisig,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token';
import { clusterApiUrl, Connection, Keypair } from '@solana/web3.js';
import { getExplorerLink } from '@solana-developers/helpers';

const MINOR_UNITS_PER_MAJOR_UNITS = Math.pow(10, 2);
let privateKey = process.env.SECRET_KEY;

if (!privateKey) {
  console.log('Add SECRET_KEY to .env');

  process.exit(1);
}

const privateKeyAsArray = Uint8Array.from(JSON.parse(privateKey));
const firstUser = Keypair.fromSecretKey(privateKeyAsArray);
const secondUser = Keypair.generate();
const thirdUser = Keypair.generate();
const connection = new Connection(clusterApiUrl('devnet'));
const multisigAccount = await createMultisig(
  connection,
  firstUser,
  [firstUser, secondUser, thirdUser].map((user) => user.publicKey),
  3,
);
const multisigAccountLink = getExplorerLink(
  'address',
  multisigAccount.toString(),
  'devnet',
);

console.log(`Multisig Account address: ${multisigAccount.toString()}`);
console.log(`Multisig Account link: ${multisigAccountLink}`);

const tokenMint = await createMint(
  connection,
  firstUser,
  multisigAccount,
  multisigAccount,
  2,
);
const tokenMintLink = getExplorerLink(
  'address',
  tokenMint.toString(),
  'devnet',
);

console.log(`Token Mint: ${tokenMintLink}`);

const firstUserAssociatedTokenAccount = await getOrCreateAssociatedTokenAccount(
  connection,
  firstUser,
  tokenMint,
  firstUser.publicKey,
);
const firstUserAssociatedTokenAccountLink = getExplorerLink(
  'address',
  firstUserAssociatedTokenAccount.address.toBase58(),
  'devnet',
);

console.log(
  `First user Token Account: ${firstUserAssociatedTokenAccount.address.toBase58()}`,
);
console.log(
  `First user Token Account link: ${firstUserAssociatedTokenAccountLink}`,
);

const mint = async (signers: Signer[]) => {
  try {
    const transactionSignature = await mintTo(
      connection,
      firstUser,
      tokenMint,
      firstUserAssociatedTokenAccount.address,
      multisigAccount,
      10 * MINOR_UNITS_PER_MAJOR_UNITS,
      signers,
    );
    const link = getExplorerLink('transaction', transactionSignature, 'devnet');

    console.log(`Success! Mint Token Transaction: ${link}`);
  } catch (error) {
    console.log(`Error! ${error.transactionMessage || error.message}`);
  }
};

console.log(`Trying to mint tokens with the 2 of 3 signers...`);

await mint([firstUser, secondUser]);

console.log(`Trying to mint tokens with all signers...`);

await mint([firstUser, secondUser, thirdUser]);
