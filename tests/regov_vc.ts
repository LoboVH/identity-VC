import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { RegovVc } from "../target/types/regov_vc";
import * as assert from 'assert';
const { BN } = require("bn.js");

describe("regov_vc", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const { LAMPORTS_PER_SOL } = anchor.web3;

  const mainProgram = anchor.workspace.RegovVc as Program<RegovVc>;

  const createUser = async (airdropBalance) => {
    airdropBalance = airdropBalance * LAMPORTS_PER_SOL;
    let user = anchor.web3.Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      user.publicKey,
      airdropBalance
    );

    const latestBlockHash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: sig,
    });

    let wallet = new anchor.Wallet(user);
    let userProvider = new anchor.AnchorProvider(
      provider.connection,
      wallet,
      provider.opts
    );

    return {
      key: user,
      wallet,
      provider: userProvider,
    };
};


const programForUser = async (user) => {
  return new anchor.Program(
    mainProgram.idl,
    mainProgram.programId,
    user.provider
  );
};




  it("Register Credential", async () => {
    const user1 = await createUser(2);

    //
    let program = await programForUser(user1);

    const [credentialAccount , bump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("credential"), user1.key.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
    .registerCredential( "Varsha", "Haris", "Lobo", new BN(863907962), "lobovarsha18@gmail.com")
    .accounts({
      credential: credentialAccount,
      owner: user1.key.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    }).signers([user1.key]).rpc();

    console.log("transaction signature", tx);

    let credential = await program.account.credential.fetch(credentialAccount);

    console.log("First Name", credential.firstName.toString());
    console.log("Last Name", credential.lastName.toString());
    console.log("User Name", credential.username.toString());
    console.log("Mail Address", credential.mail.toString());

    console.log("******   [TEST UPDATE FIRST NAME]    ******");

    const tx1 = await program.methods
    .updateFirstName("regov")
    .accounts({
      credential: credentialAccount,
      owner: user1.key.publicKey,
    }).rpc();

    console.log("transaction signature 1", tx1);

    let credential1 = await program.account.credential.fetch(credentialAccount);

    assert.equal(credential1.firstName.toString(), "regov" );

    console.log("First Name", credential1.firstName.toString());

    console.log("******   [TEST UPDATE LAST NAME]    ******");

    const tx2 = await program.methods
    .updateLastName("tech")
    .accounts({
      credential: credentialAccount,
      owner: user1.key.publicKey,
    }).rpc();

    console.log("transaction signature 2", tx2);

    let credential2 = await program.account.credential.fetch(credentialAccount);

    assert.equal(credential2.lastName.toString(), "tech" );


    console.log("******   [TEST UPDATE USER NAME]    ******");

    const tx3 = await program.methods
    .updateUsername("Testing")
    .accounts({
      credential: credentialAccount,
      owner: user1.key.publicKey,
    }).rpc();

    console.log("transaction signature 3", tx3);

    let credential3 = await program.account.credential.fetch(credentialAccount);

    assert.equal(credential3.username.toString(), "Testing" );

    console.log("******   [TEST UPDATE MAIL]    ******");

    const tx4 = await program.methods
    .updateMail("hello@regovtech.com")
    .accounts({
      credential: credentialAccount,
      owner: user1.key.publicKey,
    }).rpc();

    console.log("transaction signature 4", tx4);

    let credential4 = await program.account.credential.fetch(credentialAccount);

    assert.equal(credential4.mail.toString(), "hello@regovtech.com" );


    console.log("Lookup credential by owner");

    const lookUpByOwner = await program.account.credential.all([
      {
        memcmp: {
          offset: 8,
          bytes: user1.key.publicKey.toBase58(),
        },
      }
    ]);

    assert.equal(lookUpByOwner.length, 1);

    assert.equal(lookUpByOwner[0].account.owner.toBase58(), user1.key.publicKey.toBase58());
    assert.equal(lookUpByOwner[0].account.firstName, "regov");
    assert.equal(lookUpByOwner[0].account.lastName, "tech");
    assert.equal(lookUpByOwner[0].account.username, "Testing");
    assert.equal(lookUpByOwner[0].account.mail, "hello@regovtech.com");
    assert.equal(lookUpByOwner[0].account.owner.toString(), user1.key.publicKey.toString());
    console.log("owner", lookUpByOwner[0].account.owner.toString());

    console.log("******   [TEST Delete Credential]    ******");

    const tx5 = await program.methods
    .deleteCredential()
    .accounts({
      credential: credentialAccount,
      owner: user1.key.publicKey,
    }).rpc();

    console.log("transaction signature 5", tx5);

    let credential5 = await program.account.credential.fetchNullable(credentialAccount);

    assert.ok(credential5 === null)



    
  });
});
