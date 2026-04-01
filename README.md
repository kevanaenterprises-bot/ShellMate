# ShellMate — Deployment Guide
### Powered by Turtle Logistics LLC

---

## What You Built

A full SaaS platform with:
- **Landing page** with pricing
- **Auth** (signup / login) via Supabase
- **Terminal Helper** — AI-powered command assistant
- **AI Companion** — Nova (female) or Axel (male) personalities
- **Stripe billing** — Free, Terminal Pro ($9.99), Companion Pro ($14.99), Bundle ($19.99)
- **Rate limiting** — daily question caps per plan enforced server-side
- **Webhook handler** — auto-upgrades/downgrades users when Stripe events fire

---

## Step 1 — Supabase Setup

1. Go to **supabase.com** → open your project
2. Click **SQL Editor** in the left sidebar
3. Paste the entire contents of `supabase-schema.sql` and click **Run**
4. Go to **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2 — Anthropic API Key

1. Go to **console.anthropic.com**
2. Click **API Keys → Create Key**
3. Copy it → `ANTHROPIC_API_KEY`

---

## Step 3 — Stripe Setup

1. Go to **dashboard.stripe.com**
2. **Create 3 Products** (Catalog → Products → Add Product):

   | Product Name     | Price    | Billing  |
   |-----------------|----------|----------|
   | Terminal Pro    | $9.99    | Monthly  |
   | Companion Pro   | $14.99   | Monthly  |
   | ShellMate Bundle| $19.99   | Monthly  |

3. After creating each, copy the **Price ID** (starts with `price_...`):
   - Terminal Pro price ID → `STRIPE_PRICE_TERMINAL`
   - Companion Pro price ID → `STRIPE_PRICE_COMPANION`
   - Bundle price ID → `STRIPE_PRICE_BUNDLE`

4. Go to **Developers → API Keys**:
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`

5. **Set up Webhook** (Developers → Webhooks → Add Endpoint):
   - URL: `https://your-railway-domain.up.railway.app/api/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Copy the **Signing Secret** → `STRIPE_WEBHOOK_SECRET`

---

## Step 4 — Deploy to Railway

1. Push this folder to a **GitHub repo**
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin https://github.com/yourusername/shellmate.git
   git push -u origin main
   ```

2. Go to **railway.app** → New Project → Deploy from GitHub repo

3. Select your repo → Railway auto-detects Next.js

4. Go to **Variables** tab in Railway and add ALL of these:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ANTHROPIC_API_KEY
   STRIPE_SECRET_KEY
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   STRIPE_WEBHOOK_SECRET
   STRIPE_PRICE_TERMINAL
   STRIPE_PRICE_COMPANION
   STRIPE_PRICE_BUNDLE
   NEXT_PUBLIC_APP_URL  ← set this to your Railway domain once deployed
   ```

5. Railway will build and deploy automatically. You'll get a domain like:
   `https://shellmate-production.up.railway.app`

6. Go back to Stripe and **update your webhook URL** with the real Railway domain.

7. Update `NEXT_PUBLIC_APP_URL` in Railway variables to your real domain.

---

## Step 5 — Test Everything

- [ ] Visit your Railway URL — landing page loads
- [ ] Sign up for an account
- [ ] Try Terminal Helper — ask a question
- [ ] Try AI Companion — pick Nova or Axel, have a chat
- [ ] Hit the free limit (10 questions) — should see upgrade prompt
- [ ] Click upgrade → goes to Stripe checkout
- [ ] Use Stripe test card `4242 4242 4242 4242` to complete payment
- [ ] After payment → redirected to dashboard with success message
- [ ] Verify plan updated in Supabase → profiles table

---

## File Structure

```
shellmate/
├── pages/
│   ├── index.js          ← Landing page
│   ├── pricing.js        ← Pricing page
│   ├── dashboard.js      ← User dashboard
│   ├── terminal.js       ← Terminal Helper app
│   ├── companion.js      ← AI Companion app
│   ├── _app.js           ← Next.js app wrapper
│   └── api/
│       ├── terminal.js   ← Terminal AI endpoint
│       ├── companion.js  ← Companion AI endpoint
│       ├── checkout.js   ← Stripe checkout session
│       └── webhook.js    ← Stripe webhook handler
├── lib/
│   ├── supabase.js       ← Supabase client
│   └── usage.js          ← Rate limiting logic
├── styles/
│   └── globals.css
├── supabase-schema.sql   ← Run this in Supabase SQL editor
├── .env.example          ← Copy to .env.local for local dev
├── next.config.js
└── package.json
```

---

## Pricing / Cost Breakdown

| Plan | You charge | Your Anthropic cost* | Your margin |
|------|-----------|----------------------|-------------|
| Free | $0 | ~$0.03/day | — |
| Terminal Pro | $9.99/mo | ~$1.80/mo | ~$8.19 |
| Companion Pro | $14.99/mo | ~$1.80/mo | ~$13.19 |
| Bundle | $19.99/mo | ~$3.60/mo | ~$16.39 |

*Based on 200 questions/day × 30 days × ~$0.003/question

---

## Local Development

```bash
npm install
cp .env.example .env.local
# Fill in .env.local with your real keys
npm run dev
# Visit http://localhost:3000
```

---

## Future Ideas

- **Custom companion names** — let users name their companion
- **Memory across sessions** — store conversation summaries in Supabase
- **Mobile app** — wrap in React Native or Expo
- **Team plans** — multiple seats under one Stripe subscription
- **Usage analytics dashboard** — show users their history
- **Affiliate program** — give users a referral link for commission

---

Built with ❤️ by Turtle Logistics LLC
