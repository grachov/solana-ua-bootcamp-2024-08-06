import { setTimeout } from 'node:timers/promises';
import 'dotenv/config';
import {
  createMint,
  createTransferInstruction,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  NONCE_ACCOUNT_LENGTH,
  sendAndConfirmRawTransaction,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { airdropIfRequired, getExplorerLink } from '@solana-developers/helpers';
import nacl from 'tweetnacl';
import naclUtils from 'tweetnacl-util';

const MINOR_UNITS_PER_MAJOR_UNITS = Math.pow(10, 2);
let privateKey = process.env.SECRET_KEY;

if (!privateKey) {
  console.log('Add SECRET_KEY to .env');

  process.exit(1);
}

const privateKeyAsArray = Uint8Array.from(JSON.parse(privateKey));
const sender = Keypair.fromSecretKey(privateKeyAsArray);
const recipient = Keypair.generate();
const connection = new Connection(clusterApiUrl('devnet'));

try {
  airdropIfRequired(
    connection,
    recipient.publicKey,
    1 * LAMPORTS_PER_SOL,
    0.5 * LAMPORTS_PER_SOL,
  );
} catch (error) {}

const tokenMint = await createMint(
  connection,
  sender,
  sender.publicKey,
  sender.publicKey,
  2,
);
const tokenMintLink = getExplorerLink(
  'address',
  tokenMint.toString(),
  'devnet',
);

console.log(`Token Mint: ${tokenMintLink}`);

const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
  connection,
  sender,
  tokenMint,
  sender.publicKey,
);
const senderTokenAccountLink = getExplorerLink(
  'address',
  senderTokenAccount.address.toBase58(),
  'devnet',
);

console.log(`Sender Public Key: ${sender.publicKey.toString()}`);
console.log(`Sender Token Account: ${senderTokenAccount.address.toBase58()}`);
console.log(`Sender Token Account link: ${senderTokenAccountLink}`);

const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
  connection,
  recipient,
  tokenMint,
  recipient.publicKey,
);
const recipientTokenAccountLink = getExplorerLink(
  'address',
  recipientTokenAccount.address.toBase58(),
  'devnet',
);

console.log(`Recipient Public Key: ${recipient.publicKey.toString()}`);
console.log(
  `Recipient Token Account: ${recipientTokenAccount.address.toBase58()}`,
);
console.log(`Recipient Token Account link: ${recipientTokenAccountLink}`);

let transactionSignature = await mintTo(
  connection,
  sender,
  tokenMint,
  senderTokenAccount.address,
  sender,
  1 * MINOR_UNITS_PER_MAJOR_UNITS,
);
let transactionLink = getExplorerLink(
  'transaction',
  transactionSignature,
  'devnet',
);

console.log(`Mint Token Transaction: ${transactionLink}`);

const nonceAccount = Keypair.generate();
const minimumAmount =
  await connection.getMinimumBalanceForRentExemption(NONCE_ACCOUNT_LENGTH);
let transaction = new Transaction();

transaction.add(
  SystemProgram.createNonceAccount({
    fromPubkey: sender.publicKey,
    noncePubkey: nonceAccount.publicKey,
    authorizedPubkey: sender.publicKey,
    lamports: minimumAmount,
  }),
);

await sendAndConfirmTransaction(connection, transaction, [
  sender,
  nonceAccount,
]);

const { nonce } = await connection.getNonce(
  nonceAccount.publicKey,
  'confirmed',
);

console.log(`Nonce Account Public Key: ${nonceAccount.publicKey.toString()}`);

transaction = new Transaction({
  feePayer: recipient.publicKey,
  nonceInfo: {
    nonceInstruction: SystemProgram.nonceAdvance({
      authorizedPubkey: sender.publicKey,
      noncePubkey: nonceAccount.publicKey,
    }),
    nonce,
  },
});

transaction.add(
  createTransferInstruction(
    senderTokenAccount.address,
    recipientTokenAccount.address,
    sender.publicKey,
    1 * MINOR_UNITS_PER_MAJOR_UNITS,
    [],
    TOKEN_PROGRAM_ID,
  ),
);

transaction.sign(sender);

const serializedMessage = transaction.serializeMessage().toString('base64');

console.log('Sending message to recipient for signing...');
console.log(`Message: ${serializedMessage}`);
console.log(`Date: ${new Date().toISOString()}`);
console.log('Waiting 3 minutes...');

await setTimeout(3 * 60 * 1_000);

console.log(`Date: ${new Date().toISOString()}`);
console.log('Signing message...');

const messageSignature = nacl.sign.detached(
  naclUtils.decodeBase64(serializedMessage),
  recipient.secretKey,
);

console.log(
  `Message signature from recipient: ${naclUtils.encodeBase64(messageSignature)}`,
);
console.log('Adding signature to transaction...');

transaction.addSignature(recipient.publicKey, Buffer.from(messageSignature));

console.log('Sending transaction...');

transactionSignature = await sendAndConfirmRawTransaction(
  connection,
  transaction.serialize(),
);

transactionLink = getExplorerLink(
  'transaction',
  transactionSignature,
  'devnet',
);

console.log(`Transaction: ${transactionLink}`);
