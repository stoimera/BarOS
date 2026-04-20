import { Resend } from 'resend';

function getResendClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Resend client should not be used on the client');
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY in environment variables');
  }
  return new Resend(apiKey);
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface BookingConfirmationData {
  customerName: string;
  customerEmail: string;
  bookingDate: string;
  bookingTime: string;
  partySize: number;
  bookingId: string;
  barName?: string;
}

export interface EventReminderData {
  customerName: string;
  customerEmail: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation?: string;
  barName?: string;
}

export interface LoyaltyRewardData {
  customerName: string;
  customerEmail: string;
  rewardDescription: string;
  barName?: string;
}

export interface MarketingCampaignData {
  customerName: string;
  customerEmail: string;
  subject: string;
  message: string;
  barName?: string;
}

export interface BookingReminderData {
  customerName: string;
  customerEmail: string;
  message: string;
  type: 'confirmation' | 'day_before' | 'hour_before' | 'custom' | 'waitlist_notification';
  barName?: string;
}

// Email templates
const createBookingConfirmationTemplate = (data: BookingConfirmationData): EmailTemplate => {
  const barName = data.barName || 'Your Bar';
  
  return {
    subject: `Booking Confirmation - ${barName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${barName}</h1>
              <h2>Booking Confirmation</h2>
            </div>
            <div class="content">
              <p>Hi ${data.customerName},</p>
              <p>Your booking has been confirmed! Here are the details:</p>
              
              <div class="details">
                <h3>Booking Details</h3>
                <p><strong>Date:</strong> ${data.bookingDate}</p>
                <p><strong>Time:</strong> ${data.bookingTime}</p>
                <p><strong>Party Size:</strong> ${data.partySize} people</p>
                <p><strong>Booking ID:</strong> ${data.bookingId}</p>
              </div>
              
              <p>We look forward to seeing you!</p>
              
              <p>If you need to make any changes to your booking, please contact us.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" class="button">View Booking Details</a>
              </div>
            </div>
            <div class="footer">
              <p>Thank you for choosing ${barName}</p>
              <p>This email was sent to ${data.customerEmail}</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Booking Confirmation - ${barName}

Hi ${data.customerName},

Your booking has been confirmed! Here are the details:

Date: ${data.bookingDate}
Time: ${data.bookingTime}
Party Size: ${data.partySize} people
Booking ID: ${data.bookingId}

We look forward to seeing you!

If you need to make any changes to your booking, please contact us.

Thank you for choosing ${barName}
    `
  };
};

const createEventReminderTemplate = (data: EventReminderData): EmailTemplate => {
  const barName = data.barName || 'Your Bar';
  
  return {
    subject: `Event Reminder: ${data.eventTitle} - ${barName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Event Reminder</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #a21caf; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #a21caf; color: white; text-decoration: none; border-radius: 6px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${barName}</h1>
              <h2>Event Reminder</h2>
            </div>
            <div class="content">
              <p>Hi ${data.customerName},</p>
              <p>Don't forget about the upcoming event!</p>
              
              <div class="details">
                <h3>Event Details</h3>
                <p><strong>Event:</strong> ${data.eventTitle}</p>
                <p><strong>Date:</strong> ${data.eventDate}</p>
                <p><strong>Time:</strong> ${data.eventTime}</p>
                ${data.eventLocation ? `<p><strong>Location:</strong> ${data.eventLocation}</p>` : ''}
              </div>
              
              <p>We can't wait to see you there!</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" class="button">View Event Details</a>
              </div>
            </div>
            <div class="footer">
              <p>Thank you for choosing ${barName}</p>
              <p>This email was sent to ${data.customerEmail}</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Event Reminder: ${data.eventTitle} - ${barName}

Hi ${data.customerName},

Don't forget about the upcoming event!

Event: ${data.eventTitle}
Date: ${data.eventDate}
Time: ${data.eventTime}
${data.eventLocation ? `Location: ${data.eventLocation}` : ''}

We can't wait to see you there!

Thank you for choosing ${barName}
    `
  };
};

const createLoyaltyRewardTemplate = (data: LoyaltyRewardData): EmailTemplate => {
  const barName = data.barName || 'Your Bar';
  
  return {
    subject: `🎉 Loyalty Reward Unlocked! - ${barName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Loyalty Reward</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #eab308; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .reward { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px solid #eab308; }
            .button { display: inline-block; padding: 12px 24px; background: #eab308; color: white; text-decoration: none; border-radius: 6px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${barName}</h1>
              <h2>🎉 Loyalty Reward Unlocked!</h2>
            </div>
            <div class="content">
              <p>Hi ${data.customerName},</p>
              <p>Congratulations! You've earned a loyalty reward!</p>
              
              <div class="reward">
                <h3>🎁 Your Reward</h3>
                <p><strong>${data.rewardDescription}</strong></p>
                <p>Thank you for your continued loyalty!</p>
              </div>
              
              <p>Come visit us soon to claim your reward!</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" class="button">Visit Us</a>
              </div>
            </div>
            <div class="footer">
              <p>Thank you for choosing ${barName}</p>
              <p>This email was sent to ${data.customerEmail}</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
🎉 Loyalty Reward Unlocked! - ${barName}

Hi ${data.customerName},

Congratulations! You've earned a loyalty reward!

🎁 Your Reward
${data.rewardDescription}

Thank you for your continued loyalty!

Come visit us soon to claim your reward!

Thank you for choosing ${barName}
    `
  };
};

const createMarketingCampaignTemplate = (data: MarketingCampaignData): EmailTemplate => {
  const barName = data.barName || 'Your Bar';
  
  return {
    subject: data.subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${data.subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .message { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${barName}</h1>
            </div>
            <div class="content">
              <p>Hi ${data.customerName},</p>
              
              <div class="message">
                ${data.message.replace(/\n/g, '<br>')}
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" class="button">Visit Us</a>
              </div>
            </div>
            <div class="footer">
              <p>Thank you for choosing ${barName}</p>
              <p>This email was sent to ${data.customerEmail}</p>
              <p><a href="#" style="color: #666;">Unsubscribe</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
${data.subject} - ${barName}

Hi ${data.customerName},

${data.message}

Thank you for choosing ${barName}

To unsubscribe, click here: [unsubscribe link]
    `
  };
};

// Email sending functions
export async function sendBookingConfirmation(data: BookingConfirmationData): Promise<boolean> {
  try {
    const template = createBookingConfirmationTemplate(data);
    
    const { error } = await getResendClient().emails.send({
      from: 'noreply@yourbar.com', // You'll need to verify this domain
      to: data.customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('Failed to send booking confirmation:', error);
      return false;
    }


    return true;
  } catch (error) {
    console.error('Error sending booking confirmation:', error);
    return false;
  }
}

export async function sendEventReminder(data: EventReminderData): Promise<boolean> {
  try {
    const template = createEventReminderTemplate(data);
    
    const { error } = await getResendClient().emails.send({
      from: 'noreply@yourbar.com',
      to: data.customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('Failed to send event reminder:', error);
      return false;
    }


    return true;
  } catch (error) {
    console.error('Error sending event reminder:', error);
    return false;
  }
}

export async function sendLoyaltyReward(data: LoyaltyRewardData): Promise<boolean> {
  try {
    const template = createLoyaltyRewardTemplate(data);
    
    const { error } = await getResendClient().emails.send({
      from: 'noreply@yourbar.com',
      to: data.customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('Failed to send loyalty reward:', error);
      return false;
    }


    return true;
  } catch (error) {
    console.error('Error sending loyalty reward:', error);
    return false;
  }
}

export async function sendMarketingCampaign(data: MarketingCampaignData): Promise<boolean> {
  try {
    const template = createMarketingCampaignTemplate(data);
    
    const { error } = await getResendClient().emails.send({
      from: 'noreply@yourbar.com',
      to: data.customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('Failed to send marketing campaign:', error);
      return false;
    }


    return true;
  } catch (error) {
    console.error('Error sending marketing campaign:', error);
    return false;
  }
}

// Bulk email sending for campaigns
export async function sendBulkMarketingCampaign(
  customers: Array<{ name: string; email: string }>,
  subject: string,
  message: string,
  barName?: string
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const customer of customers) {
    const data: MarketingCampaignData = {
      customerName: customer.name,
      customerEmail: customer.email,
      subject,
      message,
      barName
    };

    const result = await sendMarketingCampaign(data);
    if (result) {
      success++;
    } else {
      failed++;
    }

    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { success, failed };
}

// Test email function
export async function sendTestEmail(to: string): Promise<boolean> {
  try {
    const { error } = await getResendClient().emails.send({
      from: 'noreply@yourbar.com',
      to,
      subject: 'Test Email from Your Bar CRM',
      html: '<h1>Test Email</h1><p>This is a test email from your bar CRM system.</p>',
      text: 'Test Email\n\nThis is a test email from your bar CRM system.',
    });

    if (error) {
      console.error('Failed to send test email:', error);
      return false;
    }


    return true;
  } catch (error) {
    console.error('Error sending test email:', error);
    return false;
  }
}

export async function sendBookingReminder(data: BookingReminderData): Promise<boolean> {
  const barName = data.barName || 'Your Bar';
  
  const template: EmailTemplate = {
    subject: `Booking Reminder - ${barName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Reminder</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .message { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 6px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${barName}</h1>
              <h2>Booking Reminder</h2>
            </div>
            <div class="content">
              <p>Hi ${data.customerName},</p>
              
              <div class="message">
                ${data.message}
              </div>
              
              <p>We look forward to seeing you!</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" class="button">View Booking Details</a>
              </div>
            </div>
            <div class="footer">
              <p>Thank you for choosing ${barName}</p>
              <p>This email was sent to ${data.customerEmail}</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Booking Reminder - ${barName}

Hi ${data.customerName},

${data.message}

We look forward to seeing you!

Thank you for choosing ${barName}
    `
  };

  try {
    const { error } = await getResendClient().emails.send({
      from: 'noreply@yourbar.com',
      to: data.customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('Failed to send booking reminder:', error);
      return false;
    }


    return true;
  } catch (error) {
    console.error('Error sending booking reminder:', error);
    return false;
  }
} 