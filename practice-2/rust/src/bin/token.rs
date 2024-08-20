use dotenv::dotenv;
use mpl_token_metadata::{
    accounts::Metadata,
    instructions::CreateV1Builder,
    types::TokenStandard,
};
use solana_client::rpc_client::RpcClient;
use solana_program::{
    instruction::Instruction,
    pubkey::Pubkey,
};
use solana_sdk::{
    message::Message,
    program_pack::Pack,
    signature::{Keypair, Signature, Signer},
    system_instruction,
    transaction::Transaction,
};
use spl_associated_token_account::{
    get_associated_token_address,
    instruction::create_associated_token_account,
};
use spl_token::state::Mint;
use std::env;
use serde_json;
use spl_token;

fn send_and_confirm_transaction(
    client: &RpcClient,
    payer: &Pubkey,
    signers: &[&Keypair],
    instructions: &[Instruction],
) -> Signature {
    let latest_blockhash = client.get_latest_blockhash().unwrap();
    let message = Message::new_with_blockhash(
        &instructions,
        Some(payer),
        &latest_blockhash,
    );
    let transaction = Transaction::new(signers, message, latest_blockhash);

    client.send_and_confirm_transaction(&transaction).unwrap()
}

fn get_or_create_associated_token_address(
    client: &RpcClient,
    owner: &Keypair,
    wallet: &Pubkey,
    mint_authority: &Pubkey,
) -> Pubkey {
    let token_account = get_associated_token_address(wallet, mint_authority);
    let token_account_info = client.get_account(&token_account);

    if let Ok(account) = token_account_info {
        if account.owner == spl_token::id() {
            return token_account;
        }
    }

    let signers = vec![owner];
    let instructions = vec![
        create_associated_token_account(
            &owner.pubkey(),
            wallet,
            mint_authority,
            &spl_token::id(),
        ),
    ];

    send_and_confirm_transaction(
        client,
        &owner.pubkey(),
        &signers,
        &instructions,
    );

    token_account
}

fn main() {
    dotenv().ok();

    let secret_key = env::var("SECRET_KEY").expect("SECRET_KEY must be set.");
    let private_key = serde_json::from_str::<Vec<u8>>(&secret_key).unwrap();
    let user_keypair = Keypair::from_bytes(&private_key).unwrap();

    println!("Out public key is: {}", user_keypair.pubkey().to_string());

    let mint_keypair = Keypair::new();
    let client = RpcClient::new("https://api.devnet.solana.com");
    let signers = vec![&user_keypair, &mint_keypair];
    let instructions = vec![
        system_instruction::create_account(
            &user_keypair.pubkey(),
            &mint_keypair.pubkey(),
            client.get_minimum_balance_for_rent_exemption(Mint::LEN).unwrap(),
            Mint::LEN as u64,
            &spl_token::id(),
        ),
        spl_token::instruction::initialize_mint(
            &spl_token::id(),
            &mint_keypair.pubkey(),
            &user_keypair.pubkey(),
            None,
            2,
        ).unwrap(),
    ];

    send_and_confirm_transaction(
        &client,
        &user_keypair.pubkey(),
        &signers,
        &instructions,
    );

    let signers = vec![&mint_keypair, &user_keypair];
    let instructions = vec![
        CreateV1Builder::new()
            .metadata(Metadata::find_pda(&mint_keypair.pubkey()).0)
            .mint(mint_keypair.pubkey(), true)
            .authority(user_keypair.pubkey())
            .payer(user_keypair.pubkey())
            .update_authority(user_keypair.pubkey(), false)
            .is_mutable(true)
            .primary_sale_happened(false)
            .name(String::from("Solana UA Bootcamp 2024-08-06"))
            .symbol(String::from("UAB-2"))
            .uri(String::from("https://arweave.net/1234"))
            .seller_fee_basis_points(0)
            .token_standard(TokenStandard::Fungible)
            .instruction(),
    ];

    send_and_confirm_transaction(
        &client,
        &user_keypair.pubkey(),
        &signers,
        &instructions,
    );

    println!("Token Mint: {}", mint_keypair.pubkey().to_string());

    let token_account = get_or_create_associated_token_address(
        &client,
        &user_keypair,
        &user_keypair.pubkey(),
        &mint_keypair.pubkey(),
    );

    println!("Token Account: {}", token_account.to_string());

    let signers = vec![&user_keypair];
    let instructions = [
        spl_token::instruction::mint_to(
            &spl_token::id(),
            &mint_keypair.pubkey(),
            &token_account,
            &user_keypair.pubkey(),
            &vec![&user_keypair.pubkey()],
            10 * 10_u64.pow(2),
        ).unwrap(),
    ];
    let signature = send_and_confirm_transaction(
        &client,
        &user_keypair.pubkey(),
        &signers,
        &instructions,
    );

    println!("Mint Token Transaction: {}", signature.to_string());
}
