import nodemailer from 'nodemailer';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { ExternalServiceError } from '@/utils/errors';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: false, // true for 465, false for other ports
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verify connection configuration
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      logger.info('Email service connected successfully');
    } catch (error) {
      logger.error('Email service connection failed:', error);
    }
  }

  /**
   * Send OTP email
   */
  async sendOTP(email: string, otp: string, username?: string): Promise<void> {
    try {
      const mailOptions = {
        from: {
          name: 'Cymatics Pro',
          address: config.email.from,
        },
        to: email,
        subject: 'Your OTP Code - Cymatics Pro',
        html: this.generateOTPEmailTemplate(otp, username),
        text: `Your OTP code is: ${otp}. This code will expire in ${config.otp.expiresInMinutes} minutes.`,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`OTP email sent successfully to ${email}`, { messageId: info.messageId });
    } catch (error) {
      logger.error('Failed to send OTP email:', error);
      throw new ExternalServiceError('Failed to send OTP email');
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    try {
      const mailOptions = {
        from: {
          name: 'Cymatics Pro',
          address: config.email.from,
        },
        to: email,
        subject: 'Welcome to Cymatics Pro!',
        html: this.generateWelcomeEmailTemplate(username),
        text: `Welcome to Cymatics Pro, ${username}! Your account has been created successfully.`,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent successfully to ${email}`, { messageId: info.messageId });
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
      throw new ExternalServiceError('Failed to send welcome email');
    }
  }

  /**
   * Send project notification email
   */
  async sendProjectNotification(
    email: string,
    projectName: string,
    projectCode: string,
    status: string,
  ): Promise<void> {
    try {
      const mailOptions = {
        from: {
          name: 'Cymatics Pro',
          address: config.email.from,
        },
        to: email,
        subject: `Project Update: ${projectName} (${projectCode})`,
        html: this.generateProjectNotificationTemplate(projectName, projectCode, status),
        text: `Project ${projectName} (${projectCode}) status has been updated to: ${status}`,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Project notification sent successfully to ${email}`, { messageId: info.messageId });
    } catch (error) {
      logger.error('Failed to send project notification:', error);
      throw new ExternalServiceError('Failed to send project notification');
    }
  }

  /**
   * Generate OTP email template
   */
  private generateOTPEmailTemplate(otp: string, username?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your OTP Code</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-code { background: #fff; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
          .otp-number { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎬 Cymatics Pro</h1>
            <p>Your OTP Verification Code</p>
          </div>
          <div class="content">
            ${username ? `<p>Hello ${username},</p>` : '<p>Hello,</p>'}
            <p>You have requested to access your Cymatics Pro account. Please use the following One-Time Password (OTP) to complete your login:</p>

            <div class="otp-code">
              <div class="otp-number">${otp}</div>
            </div>

            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>This OTP will expire in ${config.otp.expiresInMinutes} minutes</li>
                <li>Do not share this code with anyone</li>
                <li>If you didn't request this code, please ignore this email</li>
              </ul>
            </div>

            <p>If you're having trouble accessing your account, please contact our support team.</p>

            <p>Best regards,<br>The Cymatics Pro Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate welcome email template
   */
  private generateWelcomeEmailTemplate(username: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Cymatics Pro</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .features { background: #fff; padding: 20px; border-radius: 10px; margin: 20px 0; }
          .feature-item { margin: 10px 0; padding: 10px; border-left: 4px solid #667eea; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎬 Welcome to Cymatics Pro!</h1>
            <p>Your creative project management journey starts here</p>
          </div>
          <div class="content">
            <p>Hello ${username},</p>
            <p>Welcome to Cymatics Pro! We're excited to have you on board. Your account has been successfully created and you're ready to start managing your creative projects like a pro.</p>

            <div class="features">
              <h3>🚀 What you can do with Cymatics Pro:</h3>
              <div class="feature-item">📋 <strong>Project Management:</strong> Track your photography and videography projects</div>
              <div class="feature-item">👥 <strong>Client Management:</strong> Organize client information and project history</div>
              <div class="feature-item">💰 <strong>Financial Tracking:</strong> Monitor income, expenses, and project profitability</div>
              <div class="feature-item">📍 <strong>Location Mapping:</strong> Visualize project locations on interactive maps</div>
              <div class="feature-item">📅 <strong>Calendar Integration:</strong> Schedule and track important dates</div>
              <div class="feature-item">🎯 <strong>Asset Management:</strong> Keep track of your equipment and resources</div>
            </div>

            <p>Start exploring and make the most of your creative business management!</p>

            <p>Best regards,<br>The Cymatics Pro Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate project notification email template
   */
  private generateProjectNotificationTemplate(
    projectName: string,
    projectCode: string,
    status: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Project Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .project-info { background: #fff; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #667eea; }
          .status { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; text-transform: uppercase; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Project Update</h1>
            <p>Cymatics Pro Notification</p>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>We wanted to notify you about an update to one of your projects:</p>

            <div class="project-info">
              <h3>📽️ ${projectName}</h3>
              <p><strong>Project Code:</strong> ${projectCode}</p>
              <p><strong>New Status:</strong> <span class="status" style="background: #e3f2fd; color: #1976d2;">${status}</span></p>
            </div>

            <p>You can view more details about this project in your Cymatics Pro dashboard.</p>

            <p>Best regards,<br>The Cymatics Pro Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
