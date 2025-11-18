/**
 * Email Adapter Interface
 *
 * Abstract email sending to support multiple providers:
 * - Stub (for development/testing)
 * - SendGrid
 * - Resend
 * - AWS SES
 * - Postmark
 * etc.
 */

export interface EmailAddress {
  email: string
  name?: string
}

export interface EmailAttachment {
  filename: string
  content: string | Buffer
  contentType?: string
}

export interface SendEmailOptions {
  from: EmailAddress
  to: EmailAddress | EmailAddress[]
  cc?: EmailAddress | EmailAddress[]
  bcc?: EmailAddress | EmailAddress[]
  subject: string
  text?: string
  html?: string
  attachments?: EmailAttachment[]
  replyTo?: EmailAddress
  headers?: Record<string, string>
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface IEmailAdapter {
  send(options: SendEmailOptions): Promise<EmailResult>
  sendBatch(emails: SendEmailOptions[]): Promise<EmailResult[]>
}

/**
 * Stub Email Adapter (for development)
 */
export class StubEmailAdapter implements IEmailAdapter {
  private sentEmails: SendEmailOptions[] = []

  async send(options: SendEmailOptions): Promise<EmailResult> {
    console.log('📧 [Stub] Email sent:', {
      to: options.to,
      subject: options.subject,
    })

    this.sentEmails.push(options)

    return {
      success: true,
      messageId: `stub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
  }

  async sendBatch(emails: SendEmailOptions[]): Promise<EmailResult[]> {
    return Promise.all(emails.map((email) => this.send(email)))
  }

  // Test helper
  getSentEmails(): SendEmailOptions[] {
    return [...this.sentEmails]
  }

  clearSentEmails(): void {
    this.sentEmails = []
  }
}

/**
 * Resend Email Adapter (example implementation)
 */
export class ResendEmailAdapter implements IEmailAdapter {
  constructor(private apiKey: string) {}

  async send(options: SendEmailOptions): Promise<EmailResult> {
    try {
      // Example: Resend API integration
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: `${options.from.name || ''} <${options.from.email}>`,
          to: Array.isArray(options.to)
            ? options.to.map((t) => t.email)
            : [options.to.email],
          subject: options.subject,
          text: options.text,
          html: options.html,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to send email',
        }
      }

      return {
        success: true,
        messageId: data.id,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async sendBatch(emails: SendEmailOptions[]): Promise<EmailResult[]> {
    // Resend supports batch sending
    return Promise.all(emails.map((email) => this.send(email)))
  }
}

// Default adapter (stub for development)
let emailAdapter: IEmailAdapter = new StubEmailAdapter()

export function setEmailAdapter(adapter: IEmailAdapter): void {
  emailAdapter = adapter
}

export function getEmailAdapter(): IEmailAdapter {
  return emailAdapter
}

// Convenience function
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  return emailAdapter.send(options)
}
