"use server";

import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/mail";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function registerUser(input: RegisterInput): Promise<ActionResult> {
  const { name, email, password } = input;

  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, error: "Un cont cu această adresă de email există deja." };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Generate verification token (expires in 24h)
    const token = uuidv4();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Remove any existing tokens for this email before creating a new one
    await db.verificationToken.deleteMany({ where: { email } });

    await db.verificationToken.create({
      data: { email, token, expires },
    });

    // Send verification email
    await sendVerificationEmail(email, token);

    return { success: true };
  } catch (error) {
    console.error("[registerUser]", error);
    return { success: false, error: "A apărut o eroare. Încearcă din nou." };
  }
}
