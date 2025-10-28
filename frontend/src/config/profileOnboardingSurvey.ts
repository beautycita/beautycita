import { ITheme } from 'survey-core'
import { getMediaUrl } from './media'

export const profileOnboardingSurveyJson = {
  title: "Complete Your Profile",
  description: "Just a few steps to get started with BeautyCita",
  logoPosition: "right",
  pages: [
    {
      name: "username",
      title: "Choose Your Username",
      description: "Pick a unique @username for your profile",
      elements: [
        {
          type: "text",
          name: "username",
          title: "Username",
          isRequired: true,
          placeholder: "username",
          startWithNewLine: true,
          description: "This username will be permanent and cannot be changed later. Only lowercase letters, numbers, and underscores (min 3 chars).",
          validators: [
            {
              type: "text",
              minLength: 3,
              maxLength: 20,
              text: "Username must be between 3 and 20 characters"
            },
            {
              type: "regex",
              regex: "^[a-z0-9_]+$",
              text: "Username can only contain lowercase letters, numbers, and underscores"
            }
          ]
        },
        {
          type: "html",
          name: "username_info",
          html: `
            <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 12px; margin-top: 8px;">
              <p style="color: #1E40AF; margin: 0; font-size: 0.875rem;">
                ℹ️ Only lowercase letters, numbers, and underscores allowed. No spaces.
              </p>
            </div>
          `
        }
      ]
    },
    {
      name: "email",
      title: "Verify Your Email",
      description: "Add and verify your email address for important notifications",
      elements: [
        {
          type: "text",
          name: "email",
          title: "Email Address",
          isRequired: true,
          placeholder: "you@example.com",
          inputType: "email",
          description: "Required for booking confirmations and important updates",
          validators: [
            {
              type: "email",
              text: "Please enter a valid email address"
            }
          ]
        },
        {
          type: "text",
          name: "emailVerificationCode",
          title: "Verification Code",
          isRequired: true,
          placeholder: "000000",
          description: "Enter the 6-digit code sent to your email",
          validators: [
            {
              type: "text",
              minLength: 6,
              maxLength: 6,
              text: "Verification code must be 6 digits"
            },
            {
              type: "regex",
              regex: "^[0-9]{6}$",
              text: "Verification code must be 6 digits"
            }
          ]
        },
        {
          type: "html",
          name: "email_verify_note",
          html: `
            <div style="background: #DBEAFE; border: 1px solid #93C5FD; border-radius: 8px; padding: 12px; margin-top: 8px;">
              <p style="color: #1E40AF; margin: 0 0 8px 0; font-size: 0.875rem;">
                📧 A verification code has been sent to your email.
              </p>
              <p style="color: #1E40AF; margin: 0; font-size: 0.75rem;">
                Check your inbox (and spam folder) for the code. You can click "Continue" once you've entered it.
              </p>
            </div>
          `
        }
      ]
    },
    {
      name: "avatar",
      title: "Choose Your Avatar",
      description: "Select an avatar or upload your photo",
      elements: [
        {
          type: "imagepicker",
          name: "selectedAvatar",
          title: "Choose a Predefined Avatar",
          choices: [
            { value: getMediaUrl("img/avatar/A0.png"), imageLink: getMediaUrl("img/avatar/A0.png") },
            { value: getMediaUrl("img/avatar/A1.png"), imageLink: getMediaUrl("img/avatar/A1.png") },
            { value: getMediaUrl("img/avatar/A2.png"), imageLink: getMediaUrl("img/avatar/A2.png") },
            { value: getMediaUrl("img/avatar/A4.png"), imageLink: getMediaUrl("img/avatar/A4.png") },
            { value: getMediaUrl("img/avatar/A5.png"), imageLink: getMediaUrl("img/avatar/A5.png") },
            { value: getMediaUrl("img/avatar/A6.png"), imageLink: getMediaUrl("img/avatar/A6.png") },
            { value: getMediaUrl("img/avatar/A7.png"), imageLink: getMediaUrl("img/avatar/A7.png") },
            { value: getMediaUrl("img/avatar/A8.png"), imageLink: getMediaUrl("img/avatar/A8.png") },
            { value: getMediaUrl("img/avatar/A9.png"), imageLink: getMediaUrl("img/avatar/A9.png") },
            { value: getMediaUrl("img/avatar/A10.png"), imageLink: getMediaUrl("img/avatar/A10.png") },
            { value: getMediaUrl("img/avatar/A11.png"), imageLink: getMediaUrl("img/avatar/A11.png") },
            { value: getMediaUrl("img/avatar/A12.png"), imageLink: getMediaUrl("img/avatar/A12.png") }
          ],
          colCount: 4,
          imageHeight: 80,
          imageWidth: 80,
          showLabel: false,
          description: "Click an avatar to select it, or upload your own photo below"
        },
        {
          type: "html",
          name: "avatar_divider",
          html: `
            <div style="position: relative; margin: 24px 0;">
              <div style="position: absolute; inset: 0; flex items-center;">
                <div style="width: 100%; border-top: 1px solid #D1D5DB;"></div>
              </div>
              <div style="position: relative; display: flex; justify-content: center;">
                <span style="padding: 0 8px; background: white; color: #6B7280; font-size: 0.875rem;">or upload your own</span>
              </div>
            </div>
          `
        },
        {
          type: "file",
          name: "avatarFile",
          title: "Upload Your Photo (Optional)",
          description: "Max 5MB. JPG, PNG, or WebP format. If you upload a photo, the selected avatar above will be ignored.",
          acceptedTypes: "image/jpeg,image/png,image/webp",
          maxSize: 5242880,
          allowMultiple: false
        }
      ]
    },
    {
      name: "payment",
      title: "Payment Method",
      description: "Set up your default payment method",
      elements: [
        {
          type: "radiogroup",
          name: "paymentMethod",
          title: "Choose Your Preferred Payment Method",
          isRequired: true,
          choices: [
            {
              value: "stripe",
              text: "Credit/Debit Card (Stripe)"
            },
            {
              value: "btcpay",
              text: "Bitcoin (BTCPay)"
            }
          ],
          showNoneItem: false
        },
        {
          type: "html",
          name: "stripe_info",
          visibleIf: "{paymentMethod} = 'stripe'",
          html: `
            <div style="background: #F3E8FF; border: 1px solid #C084FC; border-radius: 8px; padding: 16px; margin-top: 12px;">
              <h4 style="color: #6B21A8; margin: 0 0 8px 0; font-size: 1rem; font-weight: 600;">Stripe Payments</h4>
              <p style="color: #7C3AED; margin: 0; font-size: 0.875rem;">
                Accept Visa, Mastercard, Amex, and Apple Pay. Instant payments with secure processing.
              </p>
            </div>
          `
        },
        {
          type: "html",
          name: "btcpay_info",
          visibleIf: "{paymentMethod} = 'btcpay'",
          html: `
            <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 16px; margin-top: 12px;">
              <h4 style="color: #92400E; margin: 0 0 8px 0; font-size: 1rem; font-weight: 600;">Bitcoin Payments</h4>
              <p style="color: #B45309; margin: 0 0 8px 0; font-size: 0.875rem;">
                Pay with Bitcoin using BTCPay Server. Zero fees, complete privacy.
              </p>
              <p style="color: #B45309; margin: 0; font-size: 0.75rem; font-style: italic;">
                Note: You'll receive wallet deposit instructions via email.
              </p>
            </div>
          `
        },
        {
          type: "boolean",
          name: "btcWalletRequested",
          visibleIf: "{paymentMethod} = 'btcpay'",
          title: "Request BTCPay wallet setup",
          description: "I want to set up Bitcoin payments",
          defaultValue: false
        }
      ]
    }
  ],
  showProgressBar: "top",
  progressBarType: "pages",
  showQuestionNumbers: "off",
  completeText: "Complete Onboarding 🎉",
  pageNextText: "Continue →",
  pagePrevText: "← Back",
  showCompletedPage: false,
  widthMode: "responsive",
  firstPageIsStarted: false
}

// Use the same theme as stylist onboarding
export const profileOnboardingTheme: ITheme = {
  cssVariables: {
    "--sjs-general-backcolor": "rgba(255, 255, 255, 1)",
    "--sjs-general-backcolor-dark": "rgba(248, 248, 248, 1)",
    "--sjs-general-backcolor-dim": "#f3f3f3",
    "--sjs-general-backcolor-dim-light": "#fafafa",
    "--sjs-general-forecolor": "rgba(0, 0, 0, 0.91)",
    "--sjs-general-forecolor-light": "rgba(0, 0, 0, 0.45)",
    "--sjs-general-dim-forecolor": "rgba(0, 0, 0, 0.91)",
    "--sjs-general-dim-forecolor-light": "rgba(0, 0, 0, 0.45)",
    "--sjs-primary-backcolor": "rgba(147, 51, 234, 1)", // purple-600
    "--sjs-primary-backcolor-light": "rgba(168, 85, 247, 0.1)",
    "--sjs-primary-backcolor-dark": "rgba(126, 34, 206, 1)",
    "--sjs-primary-forecolor": "rgba(255, 255, 255, 1)",
    "--sjs-primary-forecolor-light": "rgba(255, 255, 255, 0.25)",
    "--sjs-base-unit": "8px",
    "--sjs-corner-radius": "12px",
    "--sjs-secondary-backcolor": "rgba(236, 72, 153, 1)", // pink-500
    "--sjs-secondary-backcolor-light": "rgba(236, 72, 153, 0.1)",
    "--sjs-secondary-backcolor-semi-light": "rgba(236, 72, 153, 0.25)",
    "--sjs-secondary-forecolor": "rgba(255, 255, 255, 1)",
    "--sjs-secondary-forecolor-light": "rgba(255, 255, 255, 0.25)",
    "--sjs-shadow-small": "0px 1px 2px 0px rgba(0, 0, 0, 0.15)",
    "--sjs-shadow-medium": "0px 2px 6px 0px rgba(0, 0, 0, 0.1)",
    "--sjs-shadow-large": "0px 8px 16px 0px rgba(0, 0, 0, 0.1)",
    "--sjs-shadow-inner": "inset 0px 1px 2px 0px rgba(0, 0, 0, 0.15)",
    "--sjs-border-light": "rgba(0, 0, 0, 0.09)",
    "--sjs-border-default": "rgba(0, 0, 0, 0.16)",
    "--sjs-border-inside": "rgba(0, 0, 0, 0.16)",
    "--sjs-special-red": "rgba(229, 10, 62, 1)",
    "--sjs-special-red-light": "rgba(229, 10, 62, 0.1)",
    "--sjs-special-red-forecolor": "rgba(255, 255, 255, 1)",
    "--sjs-special-green": "rgba(25, 179, 148, 1)",
    "--sjs-special-green-light": "rgba(25, 179, 148, 0.1)",
    "--sjs-special-green-forecolor": "rgba(255, 255, 255, 1)",
    "--sjs-special-blue": "rgba(67, 127, 217, 1)",
    "--sjs-special-blue-light": "rgba(67, 127, 217, 0.1)",
    "--sjs-special-blue-forecolor": "rgba(255, 255, 255, 1)",
    "--sjs-special-yellow": "rgba(255, 152, 20, 1)",
    "--sjs-special-yellow-light": "rgba(255, 152, 20, 0.1)",
    "--sjs-special-yellow-forecolor": "rgba(255, 255, 255, 1)"
  },
  themeName: "beautycita-profile",
  colorPalette: "light",
  isPanelless: false
}
