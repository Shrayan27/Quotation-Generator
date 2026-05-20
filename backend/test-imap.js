const dotenv = require('dotenv');
const path = require('path');
const nodemailer = require('nodemailer');
const Imap = require('node-imap');

// Load .env
dotenv.config({ path: path.join(__dirname, '.env') });

const email = process.env.OUTLOOK_EMAIL || "Sales@sensormart.co.in";
const password = process.env.OUTLOOK_APP_PASSWORD;

console.log("=== EMAIL INTEGRATION DIAGNOSTIC ===");
console.log(`Configured Email: ${email}`);
console.log(`Password configured: ${password ? 'YES (Length: ' + password.length + ')' : 'NO'}`);

if (!password) {
  console.error("ERROR: OUTLOOK_APP_PASSWORD is not set in your .env file!");
  process.exit(1);
}

// 1. Test SMTP (Sending)
const testSmtp = async () => {
  console.log("\n--- Testing SMTP (Email Sending) ---");
  const transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    port: 587,
    secure: false,
    auth: { user: email, pass: password },
    tls: { ciphers: "SSLv3" }
  });

  try {
    console.log("Connecting to SMTP server smtp-mail.outlook.com:587...");
    await transporter.verify();
    console.log("✅ SMTP Verification SUCCESSFUL! You can send emails.");
  } catch (error) {
    console.error("❌ SMTP Verification FAILED:", error.message);
  }
};

// 2. Test IMAP (Reading)
const testImap = () => {
  console.log("\n--- Testing IMAP (Email Reading/Replies) ---");
  const imap = new Imap({
    user: email,
    password: password,
    host: "outlook.office365.com",
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  });

  imap.once('ready', () => {
    console.log("✅ IMAP Connection SUCCESSFUL! IMAP is enabled and credentials are correct.");
    imap.end();
  });

  imap.once('error', (err) => {
    console.error("❌ IMAP Connection FAILED:");
    console.error(err.message || err);
    imap.end();
  });

  imap.once('end', () => {
    console.log("IMAP connection closed.");
  });

  console.log("Connecting to IMAP server outlook.office365.com:993...");
  try {
    imap.connect();
  } catch (err) {
    console.error("Error initiating IMAP connection:", err);
  }
};

const run = async () => {
  await testSmtp();
  testImap();
};

run();
