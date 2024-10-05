import { defineConfig } from 'drizzle-kit'

if(typeof process.env.CLOUDFLARE_ACCOUNT_ID !== 'string') {
    throw new Error('CLOUDFLARE_ACCOUNT_ID must be defined in the environment')
}

if(typeof process.env.CLOUDFLARE_DATABASE_ID !== 'string') {
    throw new Error('CLOUDFLARE_DATABASE_ID must be defined in the environment')
}

if(typeof process.env.CLOUDFLARE_API_TOKEN !== 'string') {
    throw new Error('CLOUDFLARE_API_TOKEN must be defined in the environment')
}

export default defineConfig({
  schema: "./app/data/schema.ts",
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID,
    token: process.env.CLOUDFLARE_API_TOKEN,
  },
})