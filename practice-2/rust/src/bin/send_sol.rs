use dotenv::dotenv;
use serde_json;
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    message::Message,
    native_token::LAMPORTS_PER_SOL,
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    system_instruction,
    transaction::Transaction,
};
use std::{env, str::FromStr};

fn check_balance(client: &RpcClient, public_key: &Pubkey) {
    let balance_in_lamports = client.get_balance(&public_key).unwrap();
    let balance_in_sol = balance_in_lamports as f64 / LAMPORTS_PER_SOL as f64;

    println!("The balance for the wallet at address {} is: {}", public_key.to_string(), balance_in_sol);
}

fn main() {
    dotenv().ok();

    let secret_key = env::var("SECRET_KEY").expect("SECRET_KEY must be set.");
    let private_key = serde_json::from_str::<Vec<u8>>(&secret_key).unwrap();
    let sender = Keypair::from_bytes(&private_key).unwrap();
    let recipient = Pubkey::from_str("LEVWA4UtYXxXzrHV7MLcand5kVbxxp5qPoaq99fzNSD").unwrap();
    let client = RpcClient::new("https://api.devnet.solana.com");

    check_balance(&client, &recipient);

    let memo = "Hello from Solana!";
    let message = Message::new(
        &[
            system_instruction::transfer(
                &sender.pubkey(),
                &recipient,
                (0.01 * LAMPORTS_PER_SOL as f64) as u64,
            ),
            Instruction {
                program_id: Pubkey::from_str("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr").unwrap(),
                data: memo.as_bytes().to_vec(),
                accounts: vec![
                    AccountMeta::new(sender.pubkey(), true),
                ],
            },
        ],
        Some(&sender.pubkey()),
    );
    let transaction = Transaction::new(
        &[&sender],
        message,
        client.get_latest_blockhash().unwrap(),
    );
    let signature = client.send_and_confirm_transaction(&transaction).unwrap();

    println!("Transaction confirmed, signature: {}", signature.to_string());
    println!("Memo is: {}", memo);

    check_balance(&client, &recipient);
}
