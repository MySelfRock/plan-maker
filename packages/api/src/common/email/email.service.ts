import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { RetryService } from '../retry/retry.service';
import { RetryPolicies } from '../retry/retry.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private retryService: RetryService,
  ) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailProvider = this.configService.get('EMAIL_PROVIDER', 'smtp');

    if (emailProvider === 'smtp') {
      this.transporter = nodemailer.createTransporter({
        host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
        port: parseInt(this.configService.get('SMTP_PORT', '587'), 10),
        secure: this.configService.get('SMTP_SECURE', 'false') === 'true',
        auth: {
          user: this.configService.get('SMTP_USER'),
          pass: this.configService.get('SMTP_PASS'),
        },
      });
    }

    this.logger.log(`Email service initialized with provider: ${emailProvider}`);
  }

  async sendVerificationEmail(to: string, token: string, tenantSlug: string): Promise<void> {
    const baseUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3001');
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

    const { result } = await this.retryService.executeWithRetry(
      () =>
        this.transporter.sendMail({
          from: this.configService.get('EMAIL_FROM', 'noreply@planmaker.com'),
          to,
          subject: 'Verify your email address',
          html: `
            <h2>Welcome to PlanMaker!</h2>
            <p>Please verify your email address by clicking the link below:</p>
            <p><a href="${verificationUrl}">Verify Email</a></p>
            <p>Or copy this link: ${verificationUrl}</p>
            <p>This link expires in 24 hours.</p>
          `,
        }),
      RetryPolicies.NETWORK,
    );

    this.logger.log(`Verification email sent to ${to}`);
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const baseUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3001');
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const { result } = await this.retryService.executeWithRetry(
      () =>
        this.transporter.sendMail({
          from: this.configService.get('EMAIL_FROM', 'noreply@planmaker.com'),
          to,
          subject: 'Reset your password',
          html: `
            <h2>Password Reset Request</h2>
            <p>Click the link below to reset your password:</p>
            <p><a href="${resetUrl}">Reset Password</a></p>
            <p>Or copy this link: ${resetUrl}</p>
            <p>This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
          `,
        }),
      RetryPolicies.NETWORK,
    );

    this.logger.log(`Password reset email sent to ${to}`);
  }
}
