// For local testing, uncomment the line below after running: npm install dotenv
import 'dotenv/config';

import { callGeminiAPI, parseAIJsonResponse, sendEmail, mockSendEmail, EmailConfig } from './utils';

// Generate HTML from JSON data
function generateHtmlFromJson(data: any): string {
  const gamesHtml = data.games.map((game: any) => {
    const scoreColor = game.score >= 8 ? '#10b981' : game.score >= 6 ? '#f59e0b' : '#ef4444';
    
    return `
      <div style="margin: 30px 0; padding: 20px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
        <h3 style="color: #2563eb; font-size: 20px; margin: 0 0 15px 0; font-weight: 600;">${game.name}</h3>
        
        <div style="margin: 10px 0; padding: 8px 0;">
          <span style="color: ${scoreColor}; font-weight: 600; background: #f3f4f6; padding: 3px 8px; border-radius: 4px; margin-right: 12px;">Score: ${game.score}/10</span>
          <span style="color: #6b7280; font-weight: 500; background: #ffffff; padding: 3px 8px; border-radius: 4px;">Type: ${game.type}</span>
        </div>
        
        <p style="color: #4b5563; line-height: 1.6; margin: 15px 0;">${game.description} (${game.reason})</p>
        
        <a href="${game.storeUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 6px 12px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; margin: 8px 0; transition: transform 0.2s; font-size: 14px;">View on Meta Store</a>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gaming Newsletter</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            border-radius: 12px;
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            text-align: center;
            color: white;
        }
        
        .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 800;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .content {
            padding: 30px;
            background: white;
        }
        
        .footer {
            background: #f8fafc;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-style: italic;
        }
        
        a:hover {
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2) !important;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${data.title}</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Latest Games & Updates</p>
        </div>
        <div class="content">
            <h2 style="color: #1e40af; font-size: 24px; margin: 0 0 20px 0; font-weight: 700; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">${data.subtitle}</h2>
            ${gamesHtml}
        </div>
        <div class="footer">
            <p>Happy Gaming! 🎮</p>
            <p style="font-size: 12px; margin-top: 10px;">Powered by AI • ${new Date().toLocaleDateString('en-GB')}</p>
        </div>
    </div>
</body>
</html>`;
}

// --- 1. Configuration and Setup ---
const GEMINI_API_KEY = process.env.FINAL_GEMINI_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const SENDER_PASSWORD = process.env.SENDER_PASSWORD;
const PERSONAL_NEWSLETTER = process.env.PERSONAL_NEWSLETTER;

// Check if the script was run with the --dry-run flag
const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  console.log("🟢 Running in DRY RUN mode. No email will be sent.");
}

// A check to ensure all variables are loaded correctly
if (!GEMINI_API_KEY || !SENDER_EMAIL || !SENDER_PASSWORD || !PERSONAL_NEWSLETTER) {
  console.error("❌ One or more required environment variables are missing.");
  process.exit(1);
}

/**
 * The main function that runs our daily task.
 */
async function main() {
  try {
    // --- 2. Generate Content with Gemini ---
    const prompt = `Create a gaming newsletter featuring at least 10 games. Return the response as a JSON object with the following structure:

{
  "title": "🎮 Gaming Newsletter - Latest Games & Updates",
  "subtitle": "🆕 Featured Games",
  "games": [
    {
      "name": "Game Name",
      "score": 8.5,
      "type": "Action RPG",
      "description": "Brief 1-2 sentence description of the game",
      "reason": "Recent price drop",
      "storeUrl": "https://www.meta.com/en-gb/experiences/search/?q=game+name"
    }
  ]
}

Please favor games with recent changes (price drops, new releases, or Horizon+ additions). Make sure to include a good mix of different game types and prioritize games that have had recent updates or changes in their status.

For the reason field, use one of: "Recent price drop", "Recently added to Horizon+", or "New release".

For the storeUrl, provide Meta store URLs using the format "https://www.meta.com/en-gb/experiences/search/?q=[game-name]" where spaces are replaced with + and no special characters are used.

Return ONLY the JSON object, no additional text or formatting.`;

    const jsonResponse = await callGeminiAPI(GEMINI_API_KEY, prompt);

    // Parse the JSON response
    const newsletterData = parseAIJsonResponse(jsonResponse);

    // Generate HTML from JSON data
    const htmlContent = generateHtmlFromJson(newsletterData);

    // Create variables needed for email
    const today = new Date().toLocaleDateString('en-GB');
    const plainTextContent = `${newsletterData.title}\n\n${newsletterData.subtitle}\n\n` + 
      newsletterData.games.map((game: any) => 
        `${game.name}\nScore: ${game.score}/10 | Type: ${game.type}\n${game.description} (${game.reason})\n${game.storeUrl}\n`
      ).join('\n');


    // --- 3. Conditionally Send Email or Log to Console ---
    if (isDryRun) {
      // If it's a dry run, just print the summary to the console
      console.log("� JSON Data:");
      console.log(JSON.stringify(newsletterData, null, 2));
      mockSendEmail({
        senderEmail: SENDER_EMAIL,
        senderPassword: SENDER_PASSWORD,
        recipientEmail: PERSONAL_NEWSLETTER,
        subject: `Gaming Newsletter - Latest Games & Updates for ${today}`,
        textContent: plainTextContent,
        htmlContent: htmlContent
      });

    } else {
      // If it's a live run, send the email
      await sendEmail({
        senderEmail: SENDER_EMAIL,
        senderPassword: SENDER_PASSWORD,
        recipientEmail: PERSONAL_NEWSLETTER,
        subject: `Gaming Newsletter - Latest Games & Updates for ${today}`,
        textContent: plainTextContent,
        htmlContent: htmlContent
      });
    }

  } catch (error) {
    console.error("❌ An error occurred during the process:", error);
    process.exit(1);
  }
}

// Run the main function
main();