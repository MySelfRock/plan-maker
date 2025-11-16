import * as nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: any;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private templateCache: Map<string, Handlebars.TemplateDelegate> = new Map();

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    logger.info('📧 Email service initialized');
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const html = await this.renderTemplate(options.template, options.context);

      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to: options.to,
        subject: options.subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`✅ Email sent to ${options.to}: ${options.subject}`);
    } catch (error) {
      logger.error(`❌ Failed to send email to ${options.to}`, error);
      throw error;
    }
  }

  private async renderTemplate(templateName: string, context: any): Promise<string> {
    let template = this.templateCache.get(templateName);

    if (!template) {
      const templatePath = path.join(__dirname, '../templates', `${templateName}.hbs`);

      if (!fs.existsSync(templatePath)) {
        logger.warn(`⚠️ Template not found: ${templateName}, using default`);
        return this.getDefaultTemplate(context);
      }

      const templateSource = fs.readFileSync(templatePath, 'utf-8');
      template = Handlebars.compile(templateSource);
      this.templateCache.set(templateName, template);
    }

    return template(context);
  }

  private getDefaultTemplate(context: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>PlanMaker</h1>
          </div>
          <div class="content">
            ${context.message || JSON.stringify(context)}
          </div>
          <div class="footer">
            <p>© 2025 PlanMaker. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('✅ SMTP connection verified');
      return true;
    } catch (error) {
      logger.error('❌ SMTP connection failed', error);
      return false;
    }
  }
}
