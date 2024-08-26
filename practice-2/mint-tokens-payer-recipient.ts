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
  Transaction,
} from '@solana/web3.js';
import { getExplorerLink } from '@solana-developers/helpers';

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

let latestBlockhash = await connection.getLatestBlockhash();
const transaction = new Transaction({
  feePayer: recipient.publicKey,
  ...latestBlockhash,
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

const serializedTransaction = transaction
  .serialize({
    requireAllSignatures: false,
  })
  .toString('base64');

console.log('Sending serialized transaction to recipient for signing...');
console.log(`Serialized transaction: ${serializedTransaction}`);

const deserializedTransaction = Transaction.from(
  Buffer.from(serializedTransaction, 'base64'),
);

console.log('Signing and sending transaction...');

deserializedTransaction.partialSign(recipient);

transactionSignature = await connection.sendEncodedTransaction(
  deserializedTransaction.serialize().toString('base64'),
);
latestBlockhash = await connection.getLatestBlockhash();

await connection.confirmTransaction({
  signature: transactionSignature,
  ...latestBlockhash,
});

transactionLink = getExplorerLink(
  'transaction',
  transactionSignature,
  'devnet',
);

console.log(`Transaction: ${transactionLink}`);
