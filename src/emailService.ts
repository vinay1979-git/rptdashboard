import nodemailer from 'nodemailer';
import { config } from './config';

export interface EmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  attachments: Array<{
    filename: string;
    content: Buffer;
    cid: string;
  }>;
}

export class EmailService {
  /**
   * Sends the reporting email with embedded charts
   */
  public static async sendReport(options: EmailOptions): Promise<void> {
    // Determine if we should use a real SMTP config or a mock test account
    let transporter: nodemailer.Transporter;

    if (config.smtp.user && config.smtp.pass) {
      console.log(`Connecting to configured SMTP host: ${config.smtp.host}...`);
      transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465, // True for port 465, false for other ports
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
    } else {
      console.log('No SMTP credentials found. Creating auto-generated test SMTP account (Ethereal Email)...');
      // Set up a temporary mock test account on Ethereal
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const mailOptions = {
      from: config.email.from,
      to: options.to || config.email.to,
      subject: options.subject,
      html: options.htmlContent,
      attachments: options.attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully! MessageID: ${info.messageId}`);

    // If using test account, display the preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`--------------------------------------------------`);
      console.log(`✉️ Test Email Preview URL: ${previewUrl}`);
      console.log(`Open the link above in your browser to view the rendered email!`);
      console.log(`--------------------------------------------------`);
    }
  }
}
