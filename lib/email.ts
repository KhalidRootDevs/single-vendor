import nodemailer from 'nodemailer';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const FROM = process.env.SMTP_FROM || 'noreply@yourstore.com';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

function baseLayout(content: string, footer?: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
      ${content}
      <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
      <p style="color:#999;font-size:12px;">${
        footer ?? "If you didn't request this, please ignore this email."
      }</p>
    </div>
  `;
}

function btn(href: string, label: string, color = '#007bff'): string {
  return `<p style="margin:24px 0;"><a href="${href}" style="background:${color};color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;font-weight:bold;">${label}</a></p>`;
}

function itemsTable(
  items: Array<{ name: string; price: number; quantity: number }>
): string {
  const rows = items
    .map(
      (i) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${i.name}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${
        i.quantity
      }</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${(
        i.price * i.quantity
      ).toFixed(2)}</td>
    </tr>`
    )
    .join('');
  return `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:8px;text-align:left;">Item</th>
          <th style="padding:8px;text-align:center;">Qty</th>
          <th style="padding:8px;text-align:right;">Price</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

async function send(to: string, subject: string, html: string): Promise<void> {
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
  } catch (error) {
    console.error(`Failed to send email [${subject}] to ${to}:`, error);
  }
}

// ── Auth Emails ───────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(
  email: string,
  name: string,
  resetToken: string
): Promise<void> {
  const url = `${APP_URL}/reset-password?token=${resetToken}`;
  await send(
    email,
    'Welcome to Our Store – Set Your Password',
    baseLayout(`
      <h2>Welcome to Our Store, ${name}!</h2>
      <p>Thank you for your order! We've created an account so you can track orders and manage future purchases.</p>
      <p>Click below to set a password for your new account:</p>
      ${btn(url, 'Set Your Password')}
      <p style="color:#666;font-size:13px;">This link expires in <strong>1 hour</strong>.</p>
    `)
  );
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  const url = `${APP_URL}/verify-email?token=${token}`;
  await send(
    email,
    'Verify your email address',
    baseLayout(`
      <h2>Hi ${name}, please verify your email</h2>
      <p>Click the button below to verify your email address. This link expires in <strong>24 hours</strong>.</p>
      ${btn(url, 'Verify Email')}
      <p style="color:#666;font-size:13px;">Or copy this link:<br>${url}</p>
    `)
  );
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  const url = `${APP_URL}/reset-password?token=${token}`;
  await send(
    email,
    'Reset your password',
    baseLayout(`
      <h2>Hi ${name}, reset your password</h2>
      <p>Click below to set a new password. This link expires in <strong>1 hour</strong>.</p>
      ${btn(url, 'Reset Password')}
      <p style="color:#666;font-size:13px;">Or copy this link:<br>${url}</p>
    `)
  );
}

// ── Order Emails ──────────────────────────────────────────────────────────────

interface OrderEmailData {
  orderNumber: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  subtotal: number;
  tax: number;
  shipping: number;
  discount?: number;
  total: number;
  shippingAddress?: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export async function sendOrderConfirmationEmail(
  email: string,
  name: string,
  order: OrderEmailData
): Promise<void> {
  const {
    orderNumber,
    items,
    subtotal,
    tax,
    shipping,
    discount,
    total,
    shippingAddress
  } = order;
  const addr = shippingAddress
    ? `${shippingAddress.fullName}, ${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}, ${shippingAddress.country}`
    : 'N/A';

  await send(
    email,
    `Order Confirmed – ${orderNumber}`,
    baseLayout(
      `
      <h2 style="color:#007bff;">Order Confirmed!</h2>
      <p>Hi ${name}, thank you for your order. We'll let you know when it ships.</p>
      <p><strong>Order Number:</strong> ${orderNumber}</p>
      ${itemsTable(items)}
      <table style="width:100%;font-size:14px;">
        <tr><td>Subtotal</td><td style="text-align:right;">$${subtotal.toFixed(
          2
        )}</td></tr>
        ${
          discount
            ? `<tr><td style="color:green;">Discount</td><td style="text-align:right;color:green;">-$${discount.toFixed(
                2
              )}</td></tr>`
            : ''
        }
        <tr><td>Tax</td><td style="text-align:right;">$${tax.toFixed(
          2
        )}</td></tr>
        <tr><td>Shipping</td><td style="text-align:right;">$${shipping.toFixed(
          2
        )}</td></tr>
        <tr style="font-weight:bold;font-size:16px;"><td>Total</td><td style="text-align:right;">$${total.toFixed(
          2
        )}</td></tr>
      </table>
      <p style="margin-top:16px;"><strong>Shipping to:</strong> ${addr}</p>
      ${btn(`${APP_URL}/account/orders`, 'View Order', '#28a745')}
    `,
      'Thank you for shopping with us!'
    )
  );
}

export async function sendShippingConfirmationEmail(
  email: string,
  name: string,
  orderNumber: string,
  trackingNumber?: string
): Promise<void> {
  await send(
    email,
    `Your Order Has Shipped – ${orderNumber}`,
    baseLayout(
      `
      <h2 style="color:#007bff;">Your Order is on its Way!</h2>
      <p>Hi ${name}, great news — your order <strong>${orderNumber}</strong> has shipped.</p>
      ${
        trackingNumber
          ? `<p><strong>Tracking Number:</strong> ${trackingNumber}</p>`
          : ''
      }
      ${btn(`${APP_URL}/account/orders`, 'Track Your Order', '#17a2b8')}
    `,
      'Thank you for shopping with us!'
    )
  );
}

export async function sendOrderCancelledEmail(
  email: string,
  name: string,
  orderNumber: string,
  reason?: string
): Promise<void> {
  await send(
    email,
    `Order Cancelled – ${orderNumber}`,
    baseLayout(`
      <h2 style="color:#dc3545;">Order Cancelled</h2>
      <p>Hi ${name}, your order <strong>${orderNumber}</strong> has been cancelled.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>If you have any questions, please contact our support team.</p>
      ${btn(`${APP_URL}/contact`, 'Contact Support', '#6c757d')}
    `)
  );
}

// ── Return Emails ─────────────────────────────────────────────────────────────

export async function sendReturnConfirmationEmail(
  email: string,
  name: string,
  returnNumber: string,
  orderNumber: string
): Promise<void> {
  await send(
    email,
    `Return Request Received – ${returnNumber}`,
    baseLayout(
      `
      <h2>Return Request Received</h2>
      <p>Hi ${name}, we've received your return request for order <strong>${orderNumber}</strong>.</p>
      <p><strong>Return Number:</strong> ${returnNumber}</p>
      <p>Our team will review your request within 1–2 business days and notify you of the outcome.</p>
      ${btn(`${APP_URL}/account/returns`, 'View Return Status', '#6c757d')}
    `,
      'Thank you for contacting us!'
    )
  );
}

// ── Abandoned Cart Email ───────────────────────────────────────────────────────

export async function sendAbandonedCartEmail(
  email: string,
  name: string,
  items: Array<{ name: string; price: number; quantity: number; image: string }>
): Promise<void> {
  const itemList = items
    .map(
      (i) =>
        `<li style="padding:4px 0;">${i.name} × ${i.quantity} — $${(
          i.price * i.quantity
        ).toFixed(2)}</li>`
    )
    .join('');

  await send(
    email,
    'You left something behind!',
    baseLayout(
      `
      <h2>Hi ${name}, you left something in your cart!</h2>
      <p>Don't forget about the items you were looking at:</p>
      <ul style="padding-left:20px;">${itemList}</ul>
      <p>Come back and complete your purchase — your cart is waiting.</p>
      ${btn(`${APP_URL}/cart`, 'Return to Cart', '#007bff')}
    `,
      'You received this email because you left items in your cart. To unsubscribe, update your preferences in your account settings.'
    )
  );
}
