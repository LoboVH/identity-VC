use anchor_lang::prelude::*;

declare_id!("6wxT8RjtniTfzBJr3tfgAAbpwZVWTeCMqbReJMqY5mGM");

#[program]
pub mod regov_vc {
    use super::*;
    pub fn register_credential(
        ctx: Context<RegisterCredential>,
        first_name: String,
        last_name: String,
        username: String,
        birth: i64,
        mail: Option<String>,
    ) -> Result<()> {

        require_gte!(
            Credential::MAX_STRING_SIZE,
            first_name.len(),
            CredentialError::StringTooLarge
        );

        require_gte!(
            Credential::MAX_STRING_SIZE,
            last_name.len(),
            CredentialError::StringTooLarge
        );

        require_gte!(
            Credential::MAX_STRING_SIZE,
            username.len(),
            CredentialError::StringTooLarge
        );

        if mail.is_some() {
            require_gte!(
            Credential::MAX_STRING_SIZE,
            mail.as_ref().unwrap().len(),
            CredentialError::StringTooLarge
        );
        }
        

        let credential = &mut ctx.accounts.credential;
        credential.owner = ctx.accounts.owner.key();
        credential.first_name = first_name;
        credential.last_name = last_name;
        credential.username = username;
        credential.birth = birth;
        credential.mail = mail;
        credential.created = Clock::get().unwrap().unix_timestamp;
        credential.bump = *ctx.bumps.get("credential").unwrap();

        Ok(())
    }

    pub fn update_first_name(ctx: Context<UpdateCredential>, first_name: String) -> Result<()> {

        ctx.accounts.credential.first_name = first_name;

        Ok(())
    }

    pub fn update_last_name(ctx: Context<UpdateCredential>, last_name: String) -> Result<()> {

        ctx.accounts.credential.last_name = last_name;

        Ok(())
    }

 /*   pub fn update_birth(ctx: Context<UpdateIdentity>, birth: i64) -> Result<()> {

        ctx.accounts.credential.birth = birth;

        Ok(())
    }
*/

    pub fn update_username(ctx: Context<UpdateCredential>, username: String) -> Result<()> {

        ctx.accounts.credential.username = username;

        Ok(())
    }

    pub fn update_mail(ctx: Context<UpdateCredential>, mail: Option<String>) -> Result<()> {

        ctx.accounts.credential.mail = mail;

        Ok(())
    }

    pub fn delete_credential(_ctx: Context<CloseCredential>) -> Result<()> {
        //can add condition
        
        msg!("Credential Deleted.....!!");

        Ok(())
    }
}


#[derive(Accounts)]
pub struct RegisterCredential<'info> {
    #[account(
        init,
        payer = owner,
        space = Credential::MAX_CREDENTIAL_SIZE + 8,
        seeds = [b"credential", owner.key().as_ref()], bump
    )]
    pub credential: Account<'info, Credential>,

    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateCredential<'info> {
    #[account(
        mut,
        seeds = [b"credential" , owner.key().as_ref()], bump = credential.bump
    )]
    pub credential: Account<'info, Credential>,

    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct CloseCredential<'info> {
    #[account(
        mut,
        has_one = owner,
        close = owner,
        seeds = [ b"credential" , owner.key().as_ref()], bump = credential.bump
    )]
    pub credential: Account<'info, Credential>,
    pub owner: Signer<'info>,
}


#[account]
pub struct Credential {
    pub owner: Pubkey,        // 32
    pub first_name: String,   // 128 + 4 = 132
    pub last_name: String,    // 128 + 4 = 132
    pub username: String,     // 128 + 4 = 132
    pub birth: i64,           // 8
    pub mail: Option<String>, // 128 + 1 = 129
    pub created: i64,         // 8
    pub bump: u8,             // 1
}


impl Credential {

    pub const MAX_CREDENTIAL_SIZE: usize = 32 + 132 + 132 + 132 + 8 + 129 + 8 + 1;

    pub const MAX_STRING_SIZE: usize = 128;
}

#[error_code]
pub enum CredentialError {
    #[msg("Specified string is higher than the expected maximum space")]
    StringTooLarge
}
