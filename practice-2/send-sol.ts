import 'dotenv/config';
import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

let privateKey = process.env.SECRET_KEY;

if (!privateKey) {
  console.log('Add SECRET_KEY to .env');

  process.exit(1);
}

const privateKeyAsArray = Uint8Array.from(JSON.parse(privateKey));
const sender = Keypair.fromSecretKey(privateKeyAsArray);
const connection = new Connection(clusterApiUrl('devnet'));

console.log(`Our public key is ${sender.publicKey.toBase58()}`);

const recipient = new PublicKey('LEVWA4UtYXxXzrHV7MLcand5kVbxxp5qPoaq99fzNSD');

console.log(`Attempting to send 0.01 SOL to ${recipient.toBase58()}`);

const memoProgram = new PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
);
const memoText = 'Hello from Solana!';
const transaction = new Transaction();
const sendSolInstruction = SystemProgram.transfer({
  fromPubkey: sender.publicKey,
  toPubkey: recipient,
  lamports: 0.01 * LAMPORTS_PER_SOL,
});
const addMemoInstruction = new TransactionInstruction({
  keys: [
    {
      pubkey: sender.publicKey,
      isSigner: true,
      isWritable: true,
    },
  ],
  data: Buffer.from(memoText, 'utf-8'),
  programId: memoProgram,
});

transaction.add(sendSolInstruction, addMemoInstruction);

const signature = await sendAndConfirmTransaction(connection, transaction, [
  sender,
]);

console.log(`Transaction confirmed, signature: ${signature}`);
console.log(`Memo is: ${memoText}`);
