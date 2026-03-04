# Email Setup (Resend)

1. Go to https://resend.com and create a free account
2. Create an API key
3. Add to `.env.local`: `RESEND_API_KEY=re_your_key_here`
4. For production: verify your domain at resend.com/domains
5. Update the `from` address in `lib/email.ts` to use your verified domain

Until a domain is verified, emails send from onboarding@resend.dev in test mode.
