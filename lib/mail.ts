import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env["GMAIL_USER"],
    pass: process.env["GMAIL_APP_PASSWORD"],
  },
});

export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  const appUrl =
    process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";
  const verificationUrl = `${appUrl}/api/auth/verify?token=${token}`;

  // In development, always log the link so you can verify without email
  if (process.env.NODE_ENV === "development") {
    console.log("\n[DEV] Verification link for", email, ":\n", verificationUrl, "\n");
  }

  try {
    await transporter.sendMail({
      from: `"The White Laser" <${process.env["GMAIL_USER"]}>`,
      to: email,
      subject: "Verifică-ți adresa de email — The White Laser",
      html: `
        <!DOCTYPE html>
        <html lang="ro">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          </head>
          <body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 0;">
              <tr>
                <td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
                    <tr>
                      <td style="background-color:#0f172a;padding:32px 40px;text-align:center;">
                        <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;letter-spacing:0.05em;">THE WHITE LASER</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px;">
                        <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;font-weight:600;">Confirmă-ți adresa de email</h2>
                        <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
                          Bun venit! Apasă butonul de mai jos pentru a-ți verifica adresa de email și a-ți activa contul.
                        </p>
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="border-radius:6px;background-color:#0f172a;">
                              <a href="${verificationUrl}"
                                 style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;">
                                Verifică adresa de email
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;line-height:1.5;">
                          Link-ul expiră în 24 de ore. Dacă nu ai creat un cont, ignoră acest mesaj.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                        <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} The White Laser. Toate drepturile rezervate.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[sendVerificationEmail] Nodemailer error:", message);
    throw new Error("Failed to send verification email.");
  }
}
