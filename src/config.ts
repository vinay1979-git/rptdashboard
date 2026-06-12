import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

export interface Config {
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
  email: {
    from: string;
    to: string;
  };
}

export const config: Config = {
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  email: {
    from: process.env.EMAIL_FROM || 'Reporting Dashboard <noreply@example.com>',
    to: process.env.EMAIL_TO || '',
  },
};
