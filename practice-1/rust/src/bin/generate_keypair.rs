use solana_sdk::{signature::{Keypair, Signer}};

fn main() {
    let key_pair = Keypair::new();

    println!("Public key is: {}", &key_pair.pubkey().to_string());
    println!("Private key is: {:?}", &key_pair.to_bytes());
}
