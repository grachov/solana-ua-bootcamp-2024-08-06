use dotenv::dotenv;
use serde_json;
use solana_client::rpc_client::RpcClient;
use solana_sdk::{native_token::LAMPORTS_PER_SOL, signature::{Keypair, Signer}};
use std::{env, thread, time};

fn main() {
    dotenv().ok();

    let secret_key = env::var("SECRET_KEY").expect("SECRET_KEY must be set.");
    let private_key = serde_json::from_str::<Vec<u8>>(&secret_key).unwrap();
    let key_pair = Keypair::from_bytes(&private_key).unwrap();
    let public_key = key_pair.pubkey();
    let client = RpcClient::new("https://api.devnet.solana.com");
    let mut balance_in_lamports = client.get_balance(&public_key).unwrap();
    let mut balance_in_sol = balance_in_lamports as f64 / LAMPORTS_PER_SOL as f64;

    println!("The balance for the wallet at address {} is: {}", public_key.to_string(), balance_in_sol);
    print!("Requesting airdrop");

    let signature = client.request_airdrop(&public_key, (0.5 * LAMPORTS_PER_SOL as f64) as u64).unwrap();

    loop {
        print!(".");
        thread::sleep(time::Duration::from_secs(1));

        let confirmed = client.confirm_transaction(&signature).unwrap();

        if confirmed {
            break;
        }
    }

    balance_in_lamports = client.get_balance(&public_key).unwrap();
    balance_in_sol = balance_in_lamports as f64 / LAMPORTS_PER_SOL as f64;

    println!("\nThe balance for the wallet at address {} is: {}", public_key.to_string(), balance_in_sol);
}
