export const getReportActionEmailTemplate = (reportData) => {
  const { action_taken, reporter_name, item_type, report_reason, admin_notes } = reportData;
  
  const actionMessages = {
    'content_removed': {
      subject: 'Action Taken on Your Report',
      title: 'Content Removed',
      message: 'We have reviewed your report and removed the content that violated our community guidelines.',
      icon: '✅',
      color: '#10b981'
    },
    'user_warned': {
      subject: 'Action Taken on Your Report',
      title: 'User Warned',
      message: 'We have issued a warning to the user who posted the content you reported.',
      icon: '⚠️',
      color: '#f59e0b'
    },
    'user_suspended': {
      subject: 'Action Taken on Your Report',
      title: 'User Suspended',
      message: 'The user who posted the reported content has been temporarily suspended from Chirp.',
      icon: '🚫',
      color: '#ef4444'
    },
    'user_banned': {
      subject: 'Action Taken on Your Report',
      title: 'User Banned',
      message: 'The user who posted the reported content has been permanently banned from Chirp.',
      icon: '🔨',
      color: '#dc2626'
    },
    'no_action': {
      subject: 'Update on Your Report',
      title: 'No Action Required',
      message: 'After reviewing your report, we determined that the content does not violate our community guidelines.',
      icon: 'ℹ️',
      color: '#6b7280'
    }
  };

  const actionInfo = actionMessages[action_taken] || actionMessages['no_action'];
  
  const itemTypeText = item_type === 'post' ? 'post' : item_type === 'message' ? 'message' : 'content';

  return {
    subject: actionInfo.subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${actionInfo.subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                
                <!-- Header with Brand -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                      🐦 Chirp
                    </h1>
                    <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                      Safety & Community Team
                    </p>
                  </td>
                </tr>

                <!-- Action Badge -->
                <tr>
                  <td style="padding: 40px 40px 0; text-align: center;">
                    <div style="display: inline-block; background-color: ${actionInfo.color}; color: #ffffff; padding: 12px 24px; border-radius: 50px; font-size: 32px; margin-bottom: 20px;">
                      ${actionInfo.icon}
                    </div>
                    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 700;">
                      ${actionInfo.title}
                    </h2>
                  </td>
                </tr>

                <!-- Main Content -->
                <tr>
                  <td style="padding: 0 40px 30px;">
                    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6; text-align: center;">
                      ${reporter_name ? `Hi ${reporter_name},` : 'Hello,'}
                    </p>
                    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6; text-align: center;">
                      ${actionInfo.message}
                    </p>
                  </td>
                </tr>

                <!-- Report Details Box -->
                <tr>
                  <td style="padding: 0 40px 30px;">
                    <div style="background-color: #f9fafb; border-left: 4px solid ${actionInfo.color}; padding: 20px; border-radius: 8px;">
                      <h3 style="margin: 0 0 12px; color: #111827; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                        Report Details
                      </h3>
                      <table width="100%" cellpadding="0" cellspacing="0" style="color: #6b7280; font-size: 14px;">
                        <tr>
                          <td style="padding: 6px 0;"><strong style="color: #374151;">Type:</strong></td>
                          <td style="padding: 6px 0; text-align: right; text-transform: capitalize;">${itemTypeText}</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0;"><strong style="color: #374151;">Reason:</strong></td>
                          <td style="padding: 6px 0; text-align: right; text-transform: capitalize;">${report_reason.replace(/_/g, ' ')}</td>
                        </tr>
                        ${admin_notes ? `
                        <tr>
                          <td colspan="2" style="padding: 12px 0 0;">
                            <strong style="color: #374151;">Admin Notes:</strong>
                            <p style="margin: 8px 0 0; color: #6b7280; font-style: italic;">${admin_notes}</p>
                          </td>
                        </tr>
                        ` : ''}
                      </table>
                    </div>
                  </td>
                </tr>

                <!-- Thank You Message -->
                <tr>
                  <td style="padding: 0 40px 30px; text-align: center;">
                    <p style="margin: 0 0 8px; color: #374151; font-size: 15px; line-height: 1.6;">
                      Thank you for helping keep Chirp safe and welcoming for everyone.
                    </p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      Your reports make a difference in our community.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 12px; color: #6b7280; font-size: 13px; line-height: 1.5;">
                      This is an automated message regarding your report. Please do not reply to this email.
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © ${new Date().getFullYear()} Chirp Social Media. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };
};

export const getContentRemovedNotification = (contentOwnerName, itemType, reason) => {
  const itemTypeText = itemType === 'post' ? 'post' : itemType === 'message' ? 'message' : 'content';
  
  return {
    subject: 'Content Removed - Community Guidelines Violation',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Content Removed</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                      🐦 Chirp
                    </h1>
                    <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                      Community Guidelines Notice
                    </p>
                  </td>
                </tr>

                <!-- Warning Icon -->
                <tr>
                  <td style="padding: 40px 40px 0; text-align: center;">
                    <div style="display: inline-block; background-color: #fee2e2; color: #dc2626; padding: 20px; border-radius: 50%; font-size: 48px; margin-bottom: 20px;">
                      ⚠️
                    </div>
                    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 700;">
                      Content Removed
                    </h2>
                  </td>
                </tr>

                <!-- Main Message -->
                <tr>
                  <td style="padding: 0 40px 30px;">
                    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6; text-align: center;">
                      ${contentOwnerName ? `Hi ${contentOwnerName},` : 'Hello,'}
                    </p>
                    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6; text-align: center;">
                      We've removed your ${itemTypeText} because it violated our Community Guidelines.
                    </p>
                  </td>
                </tr>

                <!-- Violation Details -->
                <tr>
                  <td style="padding: 0 40px 30px;">
                    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px;">
                      <h3 style="margin: 0 0 12px; color: #111827; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                        Violation Type
                      </h3>
                      <p style="margin: 0; color: #374151; font-size: 15px; text-transform: capitalize;">
                        ${reason.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Guidelines Reminder -->
                <tr>
                  <td style="padding: 0 40px 30px;">
                    <h3 style="margin: 0 0 16px; color: #111827; font-size: 16px; font-weight: 600;">
                      Our Community Guidelines
                    </h3>
                    <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
                      <li>Be respectful and kind to others</li>
                      <li>Don't post spam or misleading content</li>
                      <li>No hate speech, harassment, or threats</li>
                      <li>No graphic violence or adult content</li>
                      <li>Respect intellectual property rights</li>
                    </ul>
                  </td>
                </tr>

                <!-- Warning -->
                <tr>
                  <td style="padding: 0 40px 30px; text-align: center;">
                    <div style="background-color: #fffbeb; border: 1px solid #fcd34d; padding: 16px; border-radius: 8px;">
                      <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 500;">
                        ⚠️ Repeated violations may result in account suspension or permanent ban.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">
                      If you believe this was a mistake, please contact us at <a href="mailto:info.ops.chirp@gmail.com" style="color: #667eea; text-decoration: none;">info.ops.chirp@gmail.com</a>
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © ${new Date().getFullYear()} Chirp Social Media. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };
};
