Role: You are a Senior Backend Architect and DevSecOps Expert.
Context: You are continuing work on "The White Laser" (refer to `AI_INSTRUCTIONS.md`). We need to implement database-backed authentication using NextAuth.js (Credentials Provider), Prisma, and email verification via SendGrid.

Task: Implement the backend infrastructure for user registration, secure login, and email verification. Please execute these exact steps carefully:

1. Install necessary dependencies:
   Run: `npm install next-auth @auth/prisma-adapter bcryptjs @sendgrid/mail uuid`
   Run: `npm install -D @types/bcryptjs @types/uuid`
2. Update the Database Schema (`prisma/schema.prisma`):
   - Ensure the `User` model has: `id`, `name`, `email` (unique), `emailVerified` (DateTime?), `password` (String?), `image` (String?), and `role` (enum USER/ADMIN default USER).
   - Add a `VerificationToken` model with fields: `id`, `email`, `token` (unique), and `expires` (DateTime), plus a unique constraint on `[email, token]`.
   - Run `npx prisma db push` or `npx prisma generate` to sync the schema.

3. Create Email Utility (`lib/mail.ts`):
   - Set up `@sendgrid/mail` using `process.env.SENDGRID_API_KEY`.
   - Create a function `sendVerificationEmail(email: string, token: string)` that sends a professional HTML email with a link pointing to `http://localhost:3000/auth/verify?token=${token}`.

4. Create Server Actions / Logic for Registration (`actions/auth.ts` or `lib/auth-logic.ts`):
   - Create a `registerUser` function. It should:
     a) Check if the user already exists.
     b) Hash the password using `bcryptjs`.
     c) Save the user to the database.
     d) Generate a unique verification token (using `uuid`) and save it to the `VerificationToken` table.
     e) Call `sendVerificationEmail`.

5. Configure NextAuth (`auth.ts` / NextAuth setup for App Router):
   - Set up NextAuth with the Prisma Adapter and the Credentials provider.
   - In the Credentials `authorize` function: Find the user by email, compare the hashed password using `bcryptjs`, and check if `emailVerified` is not null. If `emailVerified` is null, throw an error instructing them to verify their email.
   - Configure session callbacks to include the user's `role` and `id` in the token/session object.

Do NOT build the UI pages (Login/Register) yet. Focus strictly on the schema, SendGrid utility, Server Actions, and NextAuth configuration files. Use `try/catch` blocks for all database and API calls.

Confirm when completed and list the environment variables (.env) I need to configure.
