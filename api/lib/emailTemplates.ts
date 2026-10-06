const BRAND_COLOR = "#F59E0B"; // amber-500, matches the app's primary accent

// All template params below can trace back to user-controlled input (account
// name, child name, admin-entered descriptions, etc.) -- every interpolation
// into HTML must go through this, or a name like `<img src=x onerror=...>`
// would inject markup into an email rendered by the recipient's mail client.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(title: string, bodyHtml: string, preheader = ""): string {
  const safeTitle = escapeHtml(title);
  const safePreheader = escapeHtml(preheader);
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <span style="display:none;font-size:1px;color:#f9fafb;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${safePreheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background-color:${BRAND_COLOR};padding:24px 32px;">
                <h1 style="margin:0;color:#ffffff;font-size:20px;">Chindela Storybook</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#1f2937;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#f9fafb;color:#9ca3af;font-size:12px;">
                You're receiving this email because of activity on your Chindela Storybook account.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// `url` is always server-generated (env.appUrl + a hex token), never
// user-controlled, so it's safe to place directly into the href attribute.
function button(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="border-radius:8px;background-color:${BRAND_COLOR};">
        <a href="${url}" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

export function welcomeEmail(name: string, verifyUrl: string) {
  const safeName = escapeHtml(name);
  const body = `
    <p>Hi ${safeName},</p>
    <p>Welcome to Chindela Storybook! Your account has been created and you're ready to add your first child profile.</p>
    <p>Please verify your email address to make sure you never lose access to your account:</p>
    ${button(verifyUrl, "Verify my email")}
    <p style="color:#6b7280;font-size:13px;">This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.</p>
  `;
  return { subject: "Welcome to Chindela Storybook", html: layout("Welcome", body, "Verify your email to get started") };
}

export function verificationEmail(name: string, verifyUrl: string) {
  const safeName = escapeHtml(name);
  const body = `
    <p>Hi ${safeName},</p>
    <p>Please confirm your email address by clicking the button below:</p>
    ${button(verifyUrl, "Verify my email")}
    <p style="color:#6b7280;font-size:13px;">This link expires in 24 hours.</p>
  `;
  return { subject: "Verify your email address", html: layout("Verify your email", body, "Confirm your email address") };
}

export function passwordResetEmail(name: string, resetUrl: string) {
  const safeName = escapeHtml(name);
  const body = `
    <p>Hi ${safeName},</p>
    <p>We received a request to reset your password. Click the button below to choose a new one:</p>
    ${button(resetUrl, "Reset my password")}
    <p style="color:#6b7280;font-size:13px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password will not be changed.</p>
  `;
  return { subject: "Reset your password", html: layout("Reset your password", body, "Reset your Chindela Storybook password") };
}

export function subscriptionConfirmationEmail(params: {
  name: string;
  childName: string;
  ageGroupName: string;
  duration: number;
  totalPrice: string;
}) {
  const name = escapeHtml(params.name);
  const childName = escapeHtml(params.childName);
  const ageGroupName = escapeHtml(params.ageGroupName);
  const body = `
    <p>Hi ${name},</p>
    <p>Your subscription for <strong>${childName}</strong> (${ageGroupName}) is now active.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #e5e7eb;border-radius:8px;">
      <tr><td style="padding:12px 16px;color:#6b7280;">Duration</td><td style="padding:12px 16px;text-align:right;">${params.duration} month(s)</td></tr>
      <tr><td style="padding:12px 16px;color:#6b7280;border-top:1px solid #e5e7eb;">Total</td><td style="padding:12px 16px;text-align:right;border-top:1px solid #e5e7eb;">£${escapeHtml(params.totalPrice)}</td></tr>
    </table>
    <p>Thank you for subscribing — happy reading!</p>
  `;
  return { subject: "Your subscription is active", html: layout("Subscription confirmed", body, "Your subscription is now active") };
}

export function paymentReceiptEmail(params: { name: string; amount: string; date: string; description: string }) {
  const name = escapeHtml(params.name);
  const description = escapeHtml(params.description);
  const amount = escapeHtml(params.amount);
  const date = escapeHtml(params.date);
  const body = `
    <p>Hi ${name},</p>
    <p>This confirms we received your payment. Here's your receipt:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #e5e7eb;border-radius:8px;">
      <tr><td style="padding:12px 16px;color:#6b7280;">Description</td><td style="padding:12px 16px;text-align:right;">${description}</td></tr>
      <tr><td style="padding:12px 16px;color:#6b7280;border-top:1px solid #e5e7eb;">Amount</td><td style="padding:12px 16px;text-align:right;border-top:1px solid #e5e7eb;">£${amount}</td></tr>
      <tr><td style="padding:12px 16px;color:#6b7280;border-top:1px solid #e5e7eb;">Date</td><td style="padding:12px 16px;text-align:right;border-top:1px solid #e5e7eb;">${date}</td></tr>
    </table>
  `;
  return { subject: "Payment receipt", html: layout("Payment receipt", body, "Your payment receipt") };
}

export function subscriptionExpiryReminderEmail(params: { name: string; childName: string; endDate: string }) {
  const name = escapeHtml(params.name);
  const childName = escapeHtml(params.childName);
  const endDate = escapeHtml(params.endDate);
  const body = `
    <p>Hi ${name},</p>
    <p>Your subscription for <strong>${childName}</strong> is set to end on <strong>${endDate}</strong>.</p>
    <p>Renew now to make sure ${childName} doesn't lose access to new stories and lessons.</p>
  `;
  return { subject: "Your subscription is ending soon", html: layout("Subscription ending soon", body, "Renew before your subscription ends") };
}

export function contributionReceiptEmail(params: { name: string; amount: string }) {
  const name = escapeHtml(params.name);
  const amount = escapeHtml(params.amount);
  const body = `
    <p>Hi ${name},</p>
    <p>Thank you so much for your contribution of <strong>£${amount}</strong>! Your generosity helps us keep building safe, educational stories for children everywhere.</p>
  `;
  return { subject: "Thank you for your contribution", html: layout("Thank you", body, "Your contribution receipt") };
}

export function donationReceiptEmail(params: { name: string; amount: string }) {
  const name = escapeHtml(params.name);
  const amount = escapeHtml(params.amount);
  const body = `
    <p>Hi ${name},</p>
    <p>Thank you so much for your donation of <strong>£${amount}</strong> to Chindela by MJ CIC! Your generosity supports the welfare and bright future of children.</p>
  `;
  return { subject: "Thank you for your donation", html: layout("Thank you", body, "Your donation receipt") };
}

export function paymentFailedEmail(params: { name: string; reason: string }) {
  const name = escapeHtml(params.name);
  const reason = escapeHtml(params.reason);
  const body = `
    <p>Hi ${name},</p>
    <p>We weren't able to process your most recent subscription payment${reason ? ` (${reason})` : ""}.</p>
    <p>Please check your payment details in the app to avoid any interruption to your subscription.</p>
  `;
  return { subject: "Payment failed", html: layout("Payment failed", body, "Action needed: payment failed") };
}

export function parentNotificationEmail(params: { name: string; title: string; message: string }) {
  const name = escapeHtml(params.name);
  const title = escapeHtml(params.title);
  const message = escapeHtml(params.message);
  const body = `
    <p>Hi ${name},</p>
    <p><strong>${title}</strong></p>
    <p>${message}</p>
  `;
  return { subject: params.title, html: layout(title, body, message) };
}

export function adminAlertEmail(params: { subject: string; message: string }) {
  const message = escapeHtml(params.message);
  const body = `<p>${message}</p>`;
  return { subject: `[Admin] ${params.subject}`, html: layout(params.subject, body, message) };
}
