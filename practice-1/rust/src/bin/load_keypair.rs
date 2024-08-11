use dotenv::dotenv;
use serde_json;
use solana_sdk::{signature::{Keypair, Signer}};
use std::env;

fn main() {
    dotenv().ok();

    let secret_key = env::var("SECRET_KEY").expect("SECRET_KEY must be set.");
    let private_key = serde_json::from_str::<Vec<u8>>(&secret_key).unwrap();
    let key_pair = Keypair::from_bytes(&private_key).unwrap();

    println!("Public key is: {}", &key_pair.pubkey().to_string());
    println!("Private key is: {:?}", &key_pair.to_bytes());
}
