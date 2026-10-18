import nodemailer from "nodemailer";
import { config } from "./environment";

// Create email transporter with environment-specific configuration
export const createEmailTransporter = (): nodemailer.Transporter => {
  const transporterConfig = {
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth:
      config.email.auth.user && config.email.auth.pass
        ? {
            user: config.email.auth.user,
            pass: config.email.auth.pass,
          }
        : undefined,
  };

  // Add additional configuration for production
  if (config.nodeEnv === "production") {
    // Enable connection pooling for better performance
    (transporterConfig as any).pool = true;
    (transporterConfig as any).maxConnections = 5;
    (transporterConfig as any).maxMessages = 100;

    // Set timeouts
    (transporterConfig as any).connectionTimeout = 60000; // 1 minute
    (transporterConfig as any).greetingTimeout = 30000; // 30 seconds
    (transporterConfig as any).socketTimeout = 60000; // 1 minute
  }

  return nodemailer.createTransport(transporterConfig);
};

// Validate email configuration
export const validateEmailConfig = (): boolean => {
  const { host, auth } = config.email;

  if (!host) {
    console.warn("Email host is not configured");
    return false;
  }

  if (!auth.user || !auth.pass) {
    if (config.nodeEnv === "production") {
      throw new Error("Email authentication is required in production");
    }
    console.warn(
      "Email authentication is not configured. Email sending will not work."
    );
    return false;
  }

  return true;
};

// Test email configuration
export const testEmailConnection = async (
  transporter: nodemailer.Transporter
): Promise<boolean> => {
  try {
    if (!validateEmailConfig()) {
      return false;
    }

    await transporter.verify();
    console.log("Email configuration is valid");
    return true;
  } catch (error) {
    console.error("Email configuration test failed:", error);
    return false;
  }
};

// Email templates for different environments
export const getEmailTemplate = (
  type: "welcome" | "approval" | "error"
): { subject: string; html: string } => {
  const appName =
    config.nodeEnv === "production"
      ? "BanhMi App"
      : `BanhMi App (${config.nodeEnv})`;

  const templates = {
    welcome: {
      subject: `Welcome to ${appName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to ${appName}!</h2>
          <p>Thank you for registering with us. Your account is currently pending approval.</p>
          <p>You will receive another email once your account is approved.</p>
          <p>Best regards,<br>${appName} Team</p>
        </div>
      `,
    },
    approval: {
      subject: `Account Approved - ${appName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Account Approved!</h2>
          <p>Great news! Your account has been approved.</p>
          <p>You can now access all features including point-based payments.</p>
          <p>Best regards,<br>${appName} Team</p>
        </div>
      `,
    },
    error: {
      subject: `System Error - ${appName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>System Error Notification</h2>
          <p>An error occurred in the system that requires attention.</p>
          <p>Please check the system logs for more details.</p>
          <p>System Administrator</p>
        </div>
      `,
    },
  };

  return templates[type];
};
