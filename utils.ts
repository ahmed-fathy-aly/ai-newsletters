import { GoogleGenerativeAI } from "@google/generative-ai";
import * as nodemailer from "nodemailer";

/**
 * Interface for email configuration
 */
export interface EmailConfig {
  senderEmail: string;
  senderPassword: string;
  recipientEmail: string;
  subject: string;
  textContent: string;
  htmlContent: string;
}

/**
 * Call the Gemini API with a given prompt
 * @param apiKey - The Gemini API key
 * @param prompt - The prompt to send to Gemini
 * @returns The raw response text from Gemini
 */
export async function callGeminiAPI(apiKey: string, prompt: string): Promise<string> {
  console.log("🤖 Generating content with Gemini...");
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  
  console.log("✅ Content generated successfully.");
  return response;
}

/**
 * Parse JSON response from AI, handling common formatting issues
 * @param jsonResponse - The raw response from AI that should contain JSON
 * @returns Parsed JSON object
 */
export function parseAIJsonResponse(jsonResponse: string): any {
  try {
    // Clean the response by removing markdown code blocks if present
    let cleanedResponse = jsonResponse.trim();
    
    // Remove ```json and ``` markers if they exist
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '');
    }
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '');
    }
    if (cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/\s*```$/, '');
    }
    
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error("❌ Failed to parse JSON response:", error);
    console.log("Raw response:", jsonResponse);
    throw new Error("Invalid JSON response from AI");
  }
}

/**
 * Send an email using nodemailer with Gmail SMTP
 * @param config - Email configuration object
 */
export async function sendEmail(config: EmailConfig): Promise<void> {
  console.log(`✉️ Preparing to send email from ${config.senderEmail}...`);
  
  const transporter = nodemailer.createTransporter({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: config.senderEmail,
      pass: config.senderPassword,
    },
  });

  await transporter.sendMail({
    from: config.senderEmail,
    to: config.recipientEmail,
    subject: config.subject,
    text: config.textContent,
    html: config.htmlContent,
  });
  
  console.log(`🚀 Email sent successfully to ${config.recipientEmail}!`);
}

/**
 * Mock sending an email by logging the content to console
 * @param config - Email configuration object
 */
export function mockSendEmail(config: EmailConfig): void {
  console.log("\n--- 📧 Mock Email Content ---");
  console.log(`To: ${config.recipientEmail}`);
  console.log(`Subject: ${config.subject}`);
  console.log("----------------------------");
  console.log("📝 Text Content:");
  console.log(config.textContent);
  console.log("\n🌐 HTML Content:");
  console.log(config.htmlContent);
  console.log("----------------------------");
}