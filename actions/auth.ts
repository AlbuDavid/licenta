"use server";

import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

// Prisma error codes we care about
const PRISMA_UNIQUE_VIOLATION = "P2002";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerUser(input: RegisterInput): Promise<ActionResult> {
  const { name, email, password } = input;

  // Rate limit: 5 registration attempts per email per 15 minutes
  const rl = rateLimit(`register:${email}`, { maxRequests: 5, windowMs: 15 * 60 * 1000 });
  if (!rl.allowed) {
    return { success: false, error: "Prea multe încercări. Reîncearcă mai târziu." };
  }

  // Server-side input validation
  if (!name || name.trim().length < 2 || name.trim().length > 100) {
    return { success: false, error: "Numele trebuie să aibă între 2 și 100 de caractere." };
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    return { success: false, error: "Adresa de email nu este validă." };
  }
  if (!password || password.length < 8) {
    return { success: false, error: "Parola trebuie să aibă cel puțin 8 caractere." };
  }
  if (password.length > 128) {
    return { success: false, error: "Parola nu poate depăși 128 de caractere." };
  }

  let userId: string | null = null;

  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return {
        success: false,
        error: "Un cont cu această adresă de email există deja.",
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: { name, email, password: hashedPassword },
    });
    userId = user.id;

    // Generate verification token (expires in 24h)
    const token = uuidv4();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Remove any existing tokens for this email, then create new one
    await db.verificationToken.deleteMany({ where: { email } });
    await db.verificationToken.create({
      data: { email, token, expires },
    });

    // Send verification email
    await sendVerificationEmail(email, token);

    return { success: true };
  } catch (error: unknown) {
    console.error("[registerUser]", error);

    // Clean up created user if email sending failed
    if (userId) {
      try {
        await db.user.delete({ where: { id: userId } });
        await db.verificationToken.deleteMany({ where: { email } });
      } catch (cleanupError) {
        console.error("[registerUser cleanup]", cleanupError);
      }
    }

    // Prisma unique constraint (race condition — user created between our check and insert)
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === PRISMA_UNIQUE_VIOLATION
    ) {
      return {
        success: false,
        error: "Un cont cu această adresă de email există deja.",
      };
    }

    // SendGrid / email errors
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      (error as { message: string }).message === "Failed to send verification email."
    ) {
      return {
        success: false,
        error:
          "Nu am putut trimite email-ul de verificare. Verifică conexiunea și încearcă din nou.",
      };
    }

    // Database connection errors
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code: string }).code === "string" &&
      (error as { code: string }).code.startsWith("P")
    ) {
      return {
        success: false,
        error: "Eroare de bază de date. Încearcă din nou.",
      };
    }

    return {
      success: false,
      error: "A apărut o eroare neașteptată. Încearcă din nou.",
    };
  }
}
