import { GoogleGenerativeAI } from "@google/generative-ai";
import * as nodemailer from "nodemailer";
import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

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
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
    
    // Remove control characters that can break JSON parsing
    cleanedResponse = cleanedResponse.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    // Try to find JSON object in the response if direct parsing fails
    let jsonToParseALternative = cleanedResponse;
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonToParseALternative = jsonMatch[0];
    }
    
    return JSON.parse(jsonToParseALternative);
  } catch (error) {
    console.error("❌ Failed to parse JSON response:", error);
    console.log("Raw response first 500 chars:", jsonResponse.substring(0, 500));
    throw new Error("Invalid JSON response from AI");
  }
}

/**
 * Send an email using nodemailer with Gmail SMTP
 * @param config - Email configuration object
 */
export async function sendEmail(config: EmailConfig): Promise<void> {
  console.log(`✉️ Preparing to send email from ${config.senderEmail}...`);
  
  const transporter = nodemailer.createTransport({
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
 * Mock sending an email by logging the content to console and opening HTML preview in browser
 * @param config - Email configuration object
 */
export function mockSendEmail(config: EmailConfig): void {
  console.log("\n--- 📧 Mock Email Content ---");
  console.log(`To: ${config.recipientEmail}`);
  console.log(`Subject: ${config.subject}`);
  console.log("----------------------------");
  console.log("📝 Text Content:");
  console.log(config.textContent);
  console.log("\n🌐 Creating HTML preview file...");
  
  try {
    // Create a temporary HTML file
    const tempDir = os.tmpdir();
    const fileName = `email-preview-${Date.now()}.html`;
    const filePath = path.join(tempDir, fileName);
    
    // Write HTML content to file
    fs.writeFileSync(filePath, config.htmlContent, 'utf8');
    
    console.log(`📄 HTML file created: ${filePath}`);
    
    // Open the file with the default browser (Windows)
    const openCommand = `start "" "${filePath}"`;
    
    exec(openCommand, (error) => {
      if (error) {
        console.log("❌ Failed to open browser automatically.");
        console.log(`You can manually open this file: ${filePath}`);
      } else {
        console.log("✅ HTML preview opened in default browser!");
      }
    });
    
  } catch (error) {
    console.error("❌ Failed to create HTML preview file:", error);
  }
  
  console.log("----------------------------");
}

/**
 * Write content to a temporary text file and open it with the default text editor
 * @param content - The text content to write to the file
 * @param fileName - Optional custom filename (without extension)
 * @returns The path to the created file
 */
export function writeToTempFileAndOpen(content: string, fileName?: string): string {
  try {
    // Create a temporary text file
    const tempDir = os.tmpdir();
    const baseFileName = fileName || `temp-content-${Date.now()}`;
    const fullFileName = `${baseFileName}.txt`;
    const filePath = path.join(tempDir, fullFileName);
    
    // Write content to file
    fs.writeFileSync(filePath, content, 'utf8');
    
    console.log(`📄 Text file created: ${filePath}`);
    
    // Open the file with the default text editor (Windows)
    const openCommand = `start "" "${filePath}"`;
    
    exec(openCommand, (error) => {
      if (error) {
        console.log("❌ Failed to open text editor automatically.");
        console.log(`You can manually open this file: ${filePath}`);
      } else {
        console.log("✅ Text file opened in default editor!");
      }
    });
    
    return filePath;
  } catch (error) {
    console.error("❌ Failed to create temporary text file:", error);
    throw error;
  }
}