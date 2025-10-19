import { ITheme } from 'survey-core'

export const stylistOnboardingSurveyJson = {
  title: "Stylist Onboarding",
  description: "Complete your stylist profile to start accepting bookings",
  logoPosition: "right",
  pages: [
    {
      name: "professional_identity",
      title: "Professional Identity",
      description: "Tell us about your beauty business",
      elements: [
        {
          type: "text",
          name: "businessName",
          title: "Business Name",
          isRequired: true,
          placeholder: "e.g., Sofia's Beauty Studio",
          validators: [
            {
              type: "text",
              minLength: 2,
              maxLength: 100,
              text: "Business name must be between 2 and 100 characters"
            }
          ]
        },
        {
          type: "dropdown",
          name: "experience",
          title: "Years of Experience",
          isRequired: true,
          choices: [
            { value: 1, text: "Less than 1 year" },
            { value: 2, text: "1-2 years" },
            { value: 3, text: "3-5 years" },
            { value: 5, text: "5-10 years" },
            { value: 10, text: "10+ years" }
          ]
        },
        {
          type: "checkbox",
          name: "specialties",
          title: "Specialties (Select all that apply)",
          isRequired: true,
          choices: [
            "Hair Styling",
            "Hair Coloring",
            "Makeup",
            "Nails",
            "Skincare",
            "Massage",
            "Waxing",
            "Eyelashes",
            "Eyebrows",
            "Spa Treatments"
          ],
          validators: [
            {
              type: "answercount",
              minCount: 1,
              text: "Please select at least one specialty"
            }
          ],
          colCount: 2
        },
        {
          type: "comment",
          name: "bio",
          title: "Professional Bio",
          description: "Tell potential clients about your expertise, style, and what makes you unique",
          isRequired: true,
          placeholder: "Share your story, experience, and what makes you special...",
          rows: 5,
          maxLength: 500,
          validators: [
            {
              type: "text",
              minLength: 50,
              text: "Bio must be at least 50 characters"
            }
          ]
        }
      ]
    },
    {
      name: "location_service_area",
      title: "Location & Service Area",
      description: "Where do you provide services?",
      elements: [
        {
          type: "text",
          name: "locationAddress",
          title: "Business Address",
          isRequired: true,
          placeholder: "123 Main St, City, State",
          description: "Your main business location or preferred service area"
        },
        {
          type: "text",
          name: "locationCity",
          title: "City",
          isRequired: true,
          placeholder: "Miami"
        },
        {
          type: "text",
          name: "locationState",
          title: "State",
          isRequired: true,
          placeholder: "FL"
        },
        {
          type: "text",
          name: "serviceRadius",
          title: "Service Radius (km)",
          description: "How far are you willing to travel for appointments?",
          inputType: "number",
          defaultValue: 10,
          min: 1,
          max: 50,
          validators: [
            {
              type: "numeric",
              minValue: 1,
              maxValue: 50
            }
          ]
        },
        {
          type: "boolean",
          name: "mobileServices",
          title: "I offer mobile services",
          description: "I can travel to clients' locations",
          defaultValue: false
        }
      ]
    },
    {
      name: "services_pricing",
      title: "Services & Pricing",
      description: "Confirm you're ready to offer services",
      elements: [
        {
          type: "html",
          name: "services_info",
          html: `
            <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
              <p style="color: #1E40AF; margin: 0;">
                💡 <strong>Tip:</strong> You'll configure detailed services and pricing in your dashboard after approval.
                For now, just confirm you have at least 3 services ready to offer.
              </p>
            </div>
          `
        },
        {
          type: "boolean",
          name: "servicesConfirmation",
          title: "I confirm I have at least 3 services ready to offer clients",
          isRequired: true,
          validators: [
            {
              type: "expression",
              expression: "{servicesConfirmation} = true",
              text: "You must confirm you have services ready"
            }
          ]
        }
      ]
    },
    {
      name: "portfolio_social",
      title: "Portfolio & Social Proof",
      description: "Showcase your best work",
      elements: [
        {
          type: "file",
          name: "portfolioImages",
          title: "Portfolio Images (3-6 images required)",
          description: "Upload your best work. PNG, JPG, or WebP up to 5MB each.",
          isRequired: true,
          acceptedTypes: "image/jpeg,image/png,image/webp",
          maxSize: 5242880,
          allowMultiple: true,
          minCount: 3,
          maxCount: 6,
          validators: [
            {
              type: "expression",
              expression: "{portfolioImages.length} >= 3 and {portfolioImages.length} <= 6",
              text: "Please upload between 3 and 6 portfolio images"
            }
          ]
        },
        {
          type: "text",
          name: "instagramUrl",
          title: "Instagram Profile (optional)",
          placeholder: "https://instagram.com/yourusername",
          inputType: "url",
          validators: [
            {
              type: "regex",
              regex: "^$|^https?://(www\\.)?instagram\\.com/.*",
              text: "Please enter a valid Instagram URL"
            }
          ]
        },
        {
          type: "text",
          name: "tiktokUrl",
          title: "TikTok Profile (optional)",
          placeholder: "https://tiktok.com/@yourusername",
          inputType: "url",
          validators: [
            {
              type: "regex",
              regex: "^$|^https?://(www\\.)?tiktok\\.com/.*",
              text: "Please enter a valid TikTok URL"
            }
          ]
        }
      ]
    },
    {
      name: "payment_setup",
      title: "Payment Setup",
      description: "Set up payments to receive your earnings",
      elements: [
        {
          type: "html",
          name: "payment_warning",
          html: `
            <div style="background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
              <p style="color: #92400E; margin: 0;">
                ⚠️ <strong>Important:</strong> Both Stripe and Bitcoin payment verification are required
                before your profile can be approved. You'll set these up after completing this wizard.
              </p>
            </div>
          `
        },
        {
          type: "html",
          name: "payment_info",
          html: `
            <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 16px;">
              <p style="color: #1E40AF; margin: 0;">
                💡 <strong>Next Steps:</strong> After completing this wizard, you'll be guided through
                the payment setup process for both Stripe Connect and Bitcoin/BTCPay. Once both are verified,
                your profile will be submitted for approval.
              </p>
            </div>
          `
        },
        {
          type: "boolean",
          name: "paymentAcknowledgement",
          title: "I understand I need to complete payment setup after this wizard",
          isRequired: true,
          validators: [
            {
              type: "expression",
              expression: "{paymentAcknowledgement} = true",
              text: "Please acknowledge the payment setup requirement"
            }
          ]
        }
      ]
    }
  ],
  showProgressBar: "top",
  progressBarType: "pages",
  showQuestionNumbers: "off",
  completeText: "Complete Setup 🎉",
  pageNextText: "Next Step →",
  pagePrevText: "← Back",
  showCompletedPage: false,
  widthMode: "responsive"
}

// Custom theme for BeautyCita
export const beautycitaTheme: ITheme = {
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
    "--sjs-secondary-backcolor": "rgba(255, 152, 0, 1)",
    "--sjs-secondary-backcolor-light": "rgba(255, 152, 0, 0.1)",
    "--sjs-secondary-backcolor-semi-light": "rgba(255, 152, 0, 0.25)",
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
    "--sjs-special-yellow-forecolor": "rgba(255, 255, 255, 1)",
    "--sjs-article-font-xx-large-textDecoration": "none",
    "--sjs-article-font-xx-large-fontWeight": "700",
    "--sjs-article-font-xx-large-fontStyle": "normal",
    "--sjs-article-font-xx-large-fontStretch": "normal",
    "--sjs-article-font-xx-large-letterSpacing": "0",
    "--sjs-article-font-xx-large-lineHeight": "64px",
    "--sjs-article-font-xx-large-paragraphIndent": "0px",
    "--sjs-article-font-xx-large-textCase": "none",
    "--sjs-article-font-x-large-textDecoration": "none",
    "--sjs-article-font-x-large-fontWeight": "700",
    "--sjs-article-font-x-large-fontStyle": "normal",
    "--sjs-article-font-x-large-fontStretch": "normal",
    "--sjs-article-font-x-large-letterSpacing": "0",
    "--sjs-article-font-x-large-lineHeight": "56px",
    "--sjs-article-font-x-large-paragraphIndent": "0px",
    "--sjs-article-font-x-large-textCase": "none",
    "--sjs-article-font-large-textDecoration": "none",
    "--sjs-article-font-large-fontWeight": "700",
    "--sjs-article-font-large-fontStyle": "normal",
    "--sjs-article-font-large-fontStretch": "normal",
    "--sjs-article-font-large-letterSpacing": "0",
    "--sjs-article-font-large-lineHeight": "40px",
    "--sjs-article-font-large-paragraphIndent": "0px",
    "--sjs-article-font-large-textCase": "none",
    "--sjs-article-font-medium-textDecoration": "none",
    "--sjs-article-font-medium-fontWeight": "700",
    "--sjs-article-font-medium-fontStyle": "normal",
    "--sjs-article-font-medium-fontStretch": "normal",
    "--sjs-article-font-medium-letterSpacing": "0",
    "--sjs-article-font-medium-lineHeight": "32px",
    "--sjs-article-font-medium-paragraphIndent": "0px",
    "--sjs-article-font-medium-textCase": "none",
    "--sjs-article-font-default-textDecoration": "none",
    "--sjs-article-font-default-fontWeight": "400",
    "--sjs-article-font-default-fontStyle": "normal",
    "--sjs-article-font-default-fontStretch": "normal",
    "--sjs-article-font-default-letterSpacing": "0",
    "--sjs-article-font-default-lineHeight": "28px",
    "--sjs-article-font-default-paragraphIndent": "0px",
    "--sjs-article-font-default-textCase": "none"
  },
  themeName: "beautycita-custom",
  colorPalette: "light",
  isPanelless: false
}
