import nodemailer from "nodemailer";
import { formatPrice } from "@/lib/utils";

interface OrderEmailItem {
  productName: string;
  price: number;
  quantity: number;
}

interface OrderEmailData {
  id: string;
  customerName: string;
  total: number;
  items: OrderEmailItem[];
}

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

export async function sendOrderConfirmationEmail(
  email: string,
  order: OrderEmailData
): Promise<void> {
  const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";
  const orderUrl = `${appUrl}/comenzi`;
  const orderIdShort = order.id.slice(-8).toUpperCase();

  const itemsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;color:#334155;font-size:14px;border-bottom:1px solid #e2e8f0;">
            ${item.productName}
          </td>
          <td style="padding:8px 0;color:#64748b;font-size:14px;text-align:center;border-bottom:1px solid #e2e8f0;">
            ${item.quantity}
          </td>
          <td style="padding:8px 0;color:#334155;font-size:14px;text-align:right;border-bottom:1px solid #e2e8f0;">
            ${formatPrice(item.price * item.quantity)}
          </td>
        </tr>`
    )
    .join("");

  if (process.env.NODE_ENV === "development") {
    console.log("\n[DEV] Order confirmation email for", email, "— Order #", orderIdShort, "\n");
  }

  try {
    await transporter.sendMail({
      from: `"The White Laser" <${process.env["GMAIL_USER"]}>`,
      to: email,
      subject: `Comandă confirmată #${orderIdShort} — The White Laser`,
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
                        <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;font-weight:600;">Comanda ta a fost plasată!</h2>
                        <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
                          Mulțumim, ${order.customerName}! Comanda <strong>#${orderIdShort}</strong> a fost înregistrată cu succes.
                        </p>

                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                          <tr style="background-color:#f8fafc;">
                            <td style="padding:8px 0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Produs</td>
                            <td style="padding:8px 0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;text-align:center;">Cant.</td>
                            <td style="padding:8px 0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;text-align:right;">Preț</td>
                          </tr>
                          ${itemsHtml}
                          <tr>
                            <td colspan="2" style="padding:12px 0 0;color:#0f172a;font-size:15px;font-weight:700;">Total</td>
                            <td style="padding:12px 0 0;color:#0f172a;font-size:15px;font-weight:700;text-align:right;">${formatPrice(order.total)}</td>
                          </tr>
                        </table>

                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="border-radius:6px;background-color:#0f172a;">
                              <a href="${orderUrl}"
                                 style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;">
                                Vezi comanda ta
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;line-height:1.5;">
                          Vei fi notificat când comanda ta va fi procesată și expediată.
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
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[sendOrderConfirmationEmail] Nodemailer error:", message);
    throw new Error("Failed to send order confirmation email.");
  }
}
