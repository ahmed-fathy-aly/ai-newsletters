// For local testing, uncomment the line below after running: npm install dotenv
import 'dotenv/config';

import { callGeminiAPI, parseAIJsonResponse, sendSms } from './utils';

// --- 1. Configuration and Setup ---
const GEMINI_API_KEY = process.env.FINAL_GEMINI_API_KEY;
const MY_PHONE_NUMBER = process.env.MY_PHONE_NUMBER;

// Check if the script was run with the --dry-run flag
const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  console.log("🟢 Running in DRY RUN mode.");
}

// A check to ensure all variables are loaded correctly
if (!GEMINI_API_KEY || !MY_PHONE_NUMBER) {
  console.error("❌ One or more required environment variables are missing.");
  process.exit(1);
}

/**
 * Helper function that returns an object with the content of the shift motivational message.
 */
function generateShiftMessage(data: any): { message: string } {
  return {
    message: data.message
  };
}

/**
 * The main function that runs our task.
 */
async function main() {
  try {
    // Calculate remaining hours in the shift based on UK time
    const now = new Date();
    const ukOffset = 1; // BST offset in hours (adjust if needed for GMT)
    const ukTime = new Date(now.getTime() + ukOffset * 60 * 60 * 1000);
    const currentHour = ukTime.getHours();
    let remainingHours: number;
    if (currentHour >= 19) {
      // From 7pm onwards
      remainingHours = 24 - currentHour + 7;
    } else if (currentHour < 7) {
      // Before 7am
      remainingHours = 7 - currentHour;
    } else {
      // Not in shift
      remainingHours = 0;
    }

    console.log(`Current UK time: ${ukTime.toLocaleString('en-GB')}`);
    console.log(`Remaining hours in shift: ${remainingHours}`);

    // --- 2. Generate Content with Gemini ---
    const prompt = `Create a funny motivational message for a night shift paramedic with ${remainingHours} hours left in the shift (from 7 pm to 7 am UK time). The message should indicate how much is left in the shift and include a joke related to our golden retriever Kevin who is naughty.

Keep the message very casual, try to be funny, and not too cheesy and keep it under 200 characters. End it with 'Sent from the machine on behalf of Ahmed'.

Return the response as a JSON object with the following structure:

{
  "message": "Your message text here, mentioning ${remainingHours} hours left and a joke."
}

Make the message encouraging, light-hearted, and relevant to a night shift as a paramedic.

Return ONLY the JSON object, no additional text or formatting.`;

    const jsonResponse = await callGeminiAPI(GEMINI_API_KEY!, prompt);

    // Parse the JSON response
    const messageData = parseAIJsonResponse(jsonResponse);

    // Generate the message object
    const messageObject = generateShiftMessage(messageData);

    // Print the message
    console.log("📧 Shift Motivational Message:");
    console.log(messageObject.message);

    // --- 3. Conditionally Send SMS or Log ---
    if (isDryRun) {
      console.log("\n🟢 DRY RUN: SMS not sent.");
      console.log("\n🟢 DRY RUN: JSON Data:");
      console.log(JSON.stringify(messageData, null, 2));
    } else {
      await sendSms(MY_PHONE_NUMBER!, messageObject.message);
    }

  } catch (error) {
    console.error("❌ An error occurred during the process:", error);
    process.exit(1);
  }
}

// Run the main function
main();