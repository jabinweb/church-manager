import nodemailer from 'nodemailer'
import { getChurchSettings } from '@/lib/settings'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

class ChurchEmailService {
  private transporter: nodemailer.Transporter | null = null
  private isConfigured: boolean = false

  constructor() {
    this.initializeTransporter()
  }

  private initializeTransporter() {
    try {
      // Use EMAIL_SERVER_* variables (NextAuth standard) with fallback to SMTP_* for backward compatibility
      const smtpUser = process.env.EMAIL_SERVER_USER || process.env.SMTP_USER
      const smtpPass = process.env.EMAIL_SERVER_PASSWORD || process.env.SMTP_PASSWORD
      const smtpHost = process.env.EMAIL_SERVER_HOST || process.env.SMTP_HOST || 'smtp.gmail.com'
      const smtpPort = parseInt(process.env.EMAIL_SERVER_PORT || process.env.SMTP_PORT || '587')

      if (!smtpUser || !smtpPass) {
        console.warn('SMTP credentials not configured. Email notifications will be disabled.')
        console.warn('Please set EMAIL_SERVER_USER and EMAIL_SERVER_PASSWORD in .env')
        return
      }

      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // Use secure connection for port 465
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })

      this.isConfigured = true
      console.log('Church email service initialized successfully')
      console.log(`Using SMTP: ${smtpHost}:${smtpPort} with user: ${smtpUser}`)
    } catch (error) {
      console.error('Failed to initialize church email service:', error)
      this.isConfigured = false
    }
  }

  async sendEmail({ to, subject, html, text }: EmailOptions) {
    if (!this.isConfigured || !this.transporter) {
      console.log(`Church email would be sent to ${to}: ${subject}`)
      console.log('Email service not configured - skipping email send')
      return { messageId: 'not-configured', skipped: true }
    }

    try {
      const settings = await getChurchSettings()
      
      const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_SERVER_USER
      const mailOptions = {
        from: `"${settings.churchName}" <${fromEmail}>`,
        to,
        subject,
        html,
        text: text || this.htmlToText(html)
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('Church email sent successfully:', result.messageId)
      return result
    } catch (error) {
      console.error('Church email sending failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      return { messageId: 'failed', error: errorMessage }
    }
  }

  private htmlToText(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  }

  // Welcome new member email
  async sendWelcomeEmail(userEmail: string, userName: string) {
    const settings = await getChurchSettings()
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #7C3AED, #3B82F6); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to ${settings.churchName}! 🙏</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 12px 12px;">
          <p style="font-size: 18px; color: #374151;">Dear ${userName},</p>
          
          <p style="color: #6b7280; line-height: 1.6;">
            We are thrilled to welcome you to our church family! Your presence enriches our community, 
            and we look forward to growing in faith together.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7C3AED;">
            <h3 style="color: #7C3AED; margin-top: 0;">What's Next?</h3>
            <ul style="color: #374151; line-height: 1.8;">
              <li>Join us for Sunday worship services at 9:00 AM and 11:00 AM</li>
              <li>Explore our ministries and small groups</li>
              <li>Connect with our pastoral team</li>
              <li>Consider attending our newcomer's class</li>
            </ul>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Contact Information</h3>
            <p style="color: #6b7280; margin: 5px 0;">📍 ${settings.churchAddress}</p>
            <p style="color: #6b7280; margin: 5px 0;">📞 ${settings.churchPhone}</p>
            <p style="color: #6b7280; margin: 5px 0;">✉️ ${settings.churchEmail}</p>
          </div>

          <p style="color: #6b7280;">
            Blessings,<br>
            <strong>The ${settings.churchName} Team</strong>
          </p>
        </div>
      </div>
    `

    return await this.sendEmail({
      to: userEmail,
      subject: `Welcome to ${settings.churchName}!`,
      html
    })
  }

  // Event registration confirmation
  async sendEventRegistrationConfirmation(userEmail: string, userName: string, event: any) {
    const settings = await getChurchSettings()
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Event Registration Confirmed! ✅</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 12px 12px;">
          <p style="font-size: 18px; color: #374151;">Hi ${userName},</p>
          
          <p style="color: #6b7280; line-height: 1.6;">
            Great news! Your registration for <strong>${event.title}</strong> has been confirmed.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
            <h3 style="color: #10B981; margin-top: 0;">Event Details</h3>
            <p><strong>Event:</strong> ${event.title}</p>
            <p><strong>Date:</strong> ${new Date(event.startDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p><strong>Time:</strong> ${new Date(event.startDate).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit' 
            })}</p>
            ${event.location ? `<p><strong>Location:</strong> ${event.location}</p>` : ''}
            ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ''}
          </div>

          <p style="color: #6b7280;">
            We're looking forward to seeing you there! If you have any questions, 
            please don't hesitate to contact us.
          </p>

          <p style="color: #6b7280;">
            Blessings,<br>
            <strong>The ${settings.churchName} Events Team</strong>
          </p>
        </div>
      </div>
    `

    return await this.sendEmail({
      to: userEmail,
      subject: `Registration Confirmed: ${event.title}`,
      html
    })
  }

  // Prayer request acknowledgment
  async sendPrayerRequestAcknowledgment(userEmail: string, userName: string, prayerRequest: any) {
    const settings = await getChurchSettings()
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Prayer Request Received 🙏</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 12px 12px;">
          <p style="font-size: 18px; color: #374151;">Dear ${userName},</p>
          
          <p style="color: #6b7280; line-height: 1.6;">
            Thank you for sharing your prayer request with us. Our prayer team is committed 
            to lifting up your needs before God.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8B5CF6;">
            <h3 style="color: #8B5CF6; margin-top: 0;">Your Prayer Request</h3>
            <p style="color: #374151; font-style: italic;">"${prayerRequest.description}"</p>
            <p style="color: #6b7280; font-size: 14px;">
              Submitted: ${new Date(prayerRequest.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #92400E; margin: 0; font-size: 14px;">
              💛 <strong>Remember:</strong> "Do not be anxious about anything, but in every situation, 
              by prayer and petition, with thanksgiving, present your requests to God." - Philippians 4:6
            </p>
          </div>

          <p style="color: #6b7280;">
            We believe in the power of prayer and trust that God hears every request. 
            You are in our thoughts and prayers.
          </p>

          <p style="color: #6b7280;">
            In Christ's love,<br>
            <strong>The ${settings.churchName} Prayer Team</strong>
          </p>
        </div>
      </div>
    `

    return await this.sendEmail({
      to: userEmail,
      subject: 'Your Prayer Request Has Been Received',
      html
    })
  }

  // Donation thank you email
  async sendDonationThankYou(userEmail: string, userName: string, donation: any) {
    const settings = await getChurchSettings()
    const currency = donation.currency || settings.currency || 'USD'
    
    const formatCurrency = (amount: number) => {
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency
        }).format(amount)
      } catch {
        const symbol = this.getCurrencySymbol(currency)
        return `${symbol}${amount.toFixed(2)}`
      }
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #F59E0B, #D97706); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Thank You for Your Generosity! 💝</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 12px 12px;">
          <p style="font-size: 18px; color: #374151;">Dear ${userName},</p>
          
          <p style="color: #6b7280; line-height: 1.6;">
            Thank you for your generous donation to ${settings.churchName}. Your giving helps us 
            continue our mission to share God's love in our community and beyond.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
            <h3 style="color: #F59E0B; margin-top: 0;">Donation Details</h3>
            <p><strong>Amount:</strong> ${formatCurrency(donation.amount)}</p>
            <p><strong>Type:</strong> ${donation.donationType}</p>
            <p><strong>Date:</strong> ${new Date(donation.createdAt).toLocaleDateString()}</p>
            ${donation.transactionId ? `<p><strong>Transaction ID:</strong> ${donation.transactionId}</p>` : ''}
          </div>

          <div style="background: #DBEAFE; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #1E40AF; margin: 0; font-size: 14px;">
              💙 <strong>Scripture:</strong> "Each of you should give what you have decided in your heart to give, 
              not reluctantly or under compulsion, for God loves a cheerful giver." - 2 Corinthians 9:7
            </p>
          </div>

          <p style="color: #6b7280;">
            Your partnership in ministry makes a real difference in the lives of those we serve. 
            May God bless you abundantly for your faithful giving.
          </p>

          <p style="color: #6b7280;">
            With gratitude,<br>
            <strong>The ${settings.churchName} Leadership Team</strong>
          </p>
        </div>
      </div>
    `

    return await this.sendEmail({
      to: userEmail,
      subject: `Thank You for Your Donation - ${settings.churchName}`,
      html
    })
  }

  private getCurrencySymbol(currency: string = 'USD') {
    try {
      return (0).toLocaleString('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).replace(/\d/g, '').trim()
    } catch {
      return '$'
    }
  }

  // Order confirmation email
  async sendOrderConfirmation(userEmail: string, userName: string, order: any) {
    const settings = await getChurchSettings()
    const currency = settings.currency || 'USD'
    
    const formatCurrency = (amount: number) => {
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency
        }).format(amount)
      } catch {
        const symbol = this.getCurrencySymbol(currency)
        return `${symbol}${amount.toFixed(2)}`
      }
    }
    
    const orderItems = order.orderItems || []
    const orderTotal = Number(order.totalAmount) || 0
    
    const itemsHtml = orderItems.map((item: any) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 15px 0; vertical-align: top;">
          <div style="font-weight: 600; color: #374151; margin-bottom: 5px;">${item.product?.name || 'Product'}</div>
          <div style="color: #6b7280; font-size: 14px;">Quantity: ${item.quantity}</div>
        </td>
        <td style="padding: 15px 0; text-align: right; vertical-align: top;">
          <div style="font-weight: 600; color: #374151;">${formatCurrency(Number(item.price) * item.quantity)}</div>
          <div style="color: #6b7280; font-size: 14px;">${formatCurrency(Number(item.price))} each</div>
        </td>
      </tr>
    `).join('')

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #059669, #10B981); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Order Confirmed! 🎉</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for your purchase</p>
        </div>
        
        <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 12px 12px;">
          <p style="font-size: 18px; color: #374151;">Dear ${userName},</p>
          
          <p style="color: #6b7280; line-height: 1.6;">
            Thank you for your order! We've received your payment and your order is being processed. 
            Your support helps us continue our ministry work.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
            <h3 style="color: #10B981; margin-top: 0;">Order Details</h3>
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p><strong>Status:</strong> <span style="color: #059669;">Processing</span></p>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Items Ordered</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${itemsHtml}
              <tr style="border-top: 2px solid #059669; background: #f0fdf4;">
                <td style="padding: 15px 0; font-weight: 700; color: #059669;">Total</td>
                <td style="padding: 15px 0; text-align: right; font-weight: 700; color: #059669; font-size: 18px;">${formatCurrency(orderTotal)}</td>
              </tr>
            </table>
          </div>

          ${order.shippingAddress ? `
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Shipping Address</h3>
            <div style="color: #6b7280; line-height: 1.6;">
              ${order.shippingAddress.replace(/\n/g, '<br>')}
            </div>
          </div>
          ` : ''}

          <div style="background: #EBF8FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1E40AF; margin-top: 0;">What's Next?</h3>
            <ul style="color: #374151; line-height: 1.8; margin: 10px 0; padding-left: 20px;">
              <li>We'll process your order within 1-2 business days</li>
              <li>You'll receive a shipping notification when your order is dispatched</li>
              <li>Digital items (if any) will be available in your account immediately</li>
              <li>Contact us if you have any questions about your order</li>
            </ul>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Need Help?</h3>
            <p style="color: #6b7280; margin: 5px 0;">📞 ${settings.churchPhone}</p>
            <p style="color: #6b7280; margin: 5px 0;">✉️ ${settings.churchEmail}</p>
            <p style="color: #6b7280; margin: 5px 0;">🌐 ${settings.churchWebsite}</p>
          </div>

          <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #92400E; margin: 0; font-size: 14px;">
              💛 <strong>Thank you!</strong> Your purchase supports our church ministries and helps us 
              serve our community better. God bless you for your generosity!
            </p>
          </div>

          <p style="color: #6b7280;">
            Blessings and gratitude,<br>
            <strong>The ${settings.churchName} Team</strong>
          </p>
        </div>
      </div>
    `

    return await this.sendEmail({
      to: userEmail,
      subject: `Order Confirmation #${order.id} - ${settings.churchName}`,
      html
    })
  }

  // Directory message email
  async sendDirectoryMessage(
    recipientEmail: string, 
    recipientName: string, 
    senderName: string, 
    senderEmail: string, 
    message: string
  ) {
    const settings = await getChurchSettings()
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">New Message from Church Directory 📬</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 12px 12px;">
          <p style="font-size: 18px; color: #374151;">Dear ${recipientName},</p>
          
          <p style="color: #6b7280; line-height: 1.6;">
            You have received a new message through the ${settings.churchName} directory from 
            <strong>${senderName}</strong>.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6;">
            <h3 style="color: #3B82F6; margin-top: 0;">Message</h3>
            <p style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                <strong>From:</strong> ${senderName}<br>
                <strong>Email:</strong> ${senderEmail}
              </p>
            </div>
          </div>

          <div style="background: #EBF8FF; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #1E40AF; margin: 0; font-size: 14px;">
              💙 <strong>Reply:</strong> You can reply to this message by responding directly to 
              ${senderEmail} or through the church directory.
            </p>
          </div>

          <p style="color: #6b7280;">
            Blessings,<br>
            <strong>The ${settings.churchName} Team</strong>
          </p>
        </div>
      </div>
    `

    return await this.sendEmail({
      to: recipientEmail,
      subject: `Message from ${senderName} - ${settings.churchName} Directory`,
      html
    })
  }

  // Recurring donation confirmation email
  async sendRecurringDonationConfirmation(userEmail: string, userName: string, subscription: any) {
    const settings = await getChurchSettings()
    const currency = subscription.currency || settings.currency || 'USD'
    
    const formatCurrency = (amount: number) => {
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency
        }).format(amount)
      } catch {
        const symbol = this.getCurrencySymbol(currency)
        return `${symbol}${amount.toFixed(2)}`
      }
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Recurring Giving Activated! 💚</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 12px 12px;">
          <p style="font-size: 18px; color: #374151;">Dear ${userName},</p>
          
          <p style="color: #6b7280; line-height: 1.6;">
            Thank you for setting up recurring giving with ${settings.churchName}. Your consistent generosity 
            helps us plan and sustain our ministries throughout the year.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
            <h3 style="color: #10B981; margin-top: 0;">Subscription Details</h3>
            <p><strong>Amount:</strong> ${formatCurrency(subscription.amount)}</p>
            <p><strong>Frequency:</strong> ${subscription.frequency.charAt(0).toUpperCase() + subscription.frequency.slice(1)}</p>
            <p><strong>Fund:</strong> ${subscription.fundName}</p>
            <p><strong>Subscription ID:</strong> ${subscription.subscriptionId}</p>
            <p><strong>Status:</strong> <span style="color: #10B981;">Active</span></p>
          </div>

          <div style="background: #EBF8FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1E40AF; margin-top: 0;">What happens next?</h3>
            <ul style="color: #374151; line-height: 1.8; margin: 10px 0; padding-left: 20px;">
              <li>Your ${subscription.frequency} donation will be automatically processed</li>
              <li>You'll receive email confirmations for each donation</li>
              <li>You can manage or cancel your subscription anytime from your dashboard</li>
              <li>Annual giving statements will include all your recurring donations</li>
            </ul>
          </div>

          <div style="background: #DBEAFE; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #1E40AF; margin: 0; font-size: 14px;">
              💙 <strong>Scripture:</strong> "Honor the Lord with your wealth, with the firstfruits of all your crops; 
              then your barns will be filled to overflowing." - Proverbs 3:9-10
            </p>
          </div>

          <p style="color: #6b7280;">
            Your faithful giving is a tremendous blessing to our church family. Thank you for your 
            commitment to supporting God's work through ${settings.churchName}.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${settings.churchWebsite}/dashboard/giving" 
               style="display: inline-block; background: #10B981; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: 600;">
              Manage Your Giving
            </a>
          </div>

          <p style="color: #6b7280;">
            With heartfelt gratitude,<br>
            <strong>The ${settings.churchName} Leadership Team</strong>
          </p>
        </div>
      </div>
    `

    return await this.sendEmail({
      to: userEmail,
      subject: `Recurring Giving Confirmed - ${settings.churchName}`,
      html
    })
  }
}

export const churchEmailService = new ChurchEmailService()
export default ChurchEmailService
