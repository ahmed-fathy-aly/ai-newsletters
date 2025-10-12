// For local testing, uncomment the line below after running: npm install dotenv
import 'dotenv/config';

import { callGeminiAPI, parseAIJsonResponse, sendEmail, mockSendEmail } from './utils.js';

// Generate HTML from JSON data
function generateHtmlFromJson(data: any): string {
  // Function to generate HTML for a single event
  const generateEventHtml = (event: any, inferredCategory?: string) => {
    const distanceBadge = event.distance || (typeof event.distanceMiles === 'number' ? `${event.distanceMiles.toFixed(1)} mi from TN231DS` : 'Distance: N/A');
    const timeText = event.time || event.startDateTime || 'Time: TBC';
    
    // Generate Google search link
    const searchQuery = `${event.title} ${event.venueName || ''} Ashford Kent`.trim();
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    const linkHtml = `<a href="${googleSearchUrl}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 600;">🔍 Search on Google</a>`;
    
    const sourcesHtml = Array.isArray(event.sources) && event.sources.length > 0
      ? event.sources.map((s: string) => `<span style="background:#f3f4f6; padding:3px 8px; border-radius:4px; font-size:12px; margin-right:6px; color:#374151;">${s}</span>`).join('')
      : '<span style="color:#6b7280; font-style: italic;">No sources provided</span>';

    // Determine category - use provided category, inferredCategory, or default to 'one-off'
    const category = event.category || inferredCategory || 'one-off';
    const isLongRunning = category === 'long-running';
    const categoryColor = isLongRunning ? '#059669' : '#dc2626';
    const categoryBg = isLongRunning ? '#d1fae5' : '#fee2e2';
    const categoryIcon = isLongRunning ? '🔄' : '🎯';
    const categoryLabel = isLongRunning ? 'Regular' : 'One-off';

    return `
      <div style="margin: 20px 0; padding: 18px; background: #f8fafc; border-radius: 12px; border-left: 4px solid #2563eb; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
        <h3 style="color:#1e40af; font-size: 18px; margin: 0 0 8px 0; font-weight:700;">${event.title}</h3>
        <div style="display:flex; flex-wrap:wrap; gap:8px; margin: 8px 0 10px 0;">
          <span style="color:${categoryColor}; background:${categoryBg}; padding:4px 8px; border-radius:6px; font-weight:600; font-size:12px;">${categoryIcon} ${categoryLabel}</span>
          <span style="color:#0f766e; background:#d1fae5; padding:4px 8px; border-radius:6px; font-weight:600; font-size:12px;">${distanceBadge}</span>
          <span style="color:#7c3aed; background:#ede9fe; padding:4px 8px; border-radius:6px; font-weight:600; font-size:12px;">🕒 ${timeText}</span>
        </div>
        ${event.venueName || event.venueAddress ? `<p style=\"color:#374151; margin: 6px 0; font-size: 14px;\"><strong>Venue:</strong> ${[event.venueName, event.venueAddress].filter(Boolean).join(' — ')}</p>` : ''}
        <p style="color:#374151; line-height:1.55; font-size:14px; margin: 8px 0 10px 0;">${event.description || ''}</p>
        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-top:6px;">
          ${linkHtml}
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">${sourcesHtml}</div>
        </div>
      </div>
    `;
  };

  // Generate sections for categorized events
  let contentHtml = '';
  
  // Handle new categorized structure
  if (data.longRunningEvents || data.oneOffEvents) {
    if (data.longRunningEvents && data.longRunningEvents.length > 0) {
      contentHtml += `
        <h2 style="color:#1e40af; font-size: 22px; margin: 0 0 16px 0; font-weight:700; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
          🔄 Regular Activities
        </h2>
        ${data.longRunningEvents.map((event: any) => generateEventHtml(event, 'long-running')).join('')}
      `;
    }
    
    if (data.oneOffEvents && data.oneOffEvents.length > 0) {
      contentHtml += `
        <h2 style="color:#1e40af; font-size: 22px; margin: 24px 0 16px 0; font-weight:700; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
          🎯 Special Events
        </h2>
        ${data.oneOffEvents.map((event: any) => generateEventHtml(event, 'one-off')).join('')}
      `;
    }
  } 
  // Fallback for old single events array structure
  else if (data.events && data.events.length > 0) {
    contentHtml = data.events.map(generateEventHtml).join('');
  }

  if (!contentHtml) {
    contentHtml = '<p style="color:#6b7280;">No verified events found for this period.</p>';
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${data.title || 'Ashford Events Newsletter'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin:0; padding:20px; background: linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%); min-height:100vh; }
    .container { max-width: 650px; margin: 0 auto; background: white; box-shadow: 0 20px 40px rgba(0,0,0,0.15); border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 28px; text-align:center; color:white; }
    .header h1 { margin:0; font-size: 28px; font-weight: 800; }
    .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 15px; }
    .content { padding: 26px; }
    .footer { background: #f8fafc; padding: 18px 26px; text-align:center; border-top: 1px solid #e5e7eb; color:#6b7280; font-style: italic; }
  </style>
 </head>
 <body>
  <div class="container">
    <div class="header">
      <h1>${data.title || 'Ashford Events: Next 3 Days'}</h1>
      <p>${data.subtitle || 'What’s on near TN231DS'}</p>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p>Have fun out there! 🎟️</p>
      <p style="font-size:12px; margin-top: 8px;">Powered by AI • ${new Date().toLocaleDateString('en-GB')}</p>
    </div>
  </div>
 </body>
</html>`;
}

// --- 1. Configuration and Setup ---
const GEMINI_API_KEY = process.env.FINAL_GEMINI_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const SENDER_PASSWORD = process.env.SENDER_PASSWORD;
const ASHFORD_NEWSLETTER = process.env.PERSONAL_NEWSLETTER;

// Check if the script was run with the --dry-run flag
const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  console.log('🟢 Running in DRY RUN mode. No email will be sent.');
}

// A check to ensure all variables are loaded correctly
if (!GEMINI_API_KEY || !SENDER_EMAIL || !SENDER_PASSWORD || !ASHFORD_NEWSLETTER) {
  console.error('❌ One or more required environment variables are missing.');
  console.error('Required: FINAL_GEMINI_API_KEY, SENDER_EMAIL, SENDER_PASSWORD, PERSONAL_NEWSLETTER');
  process.exit(1);
}

/**
 * The main function that runs our task.
 */
async function main() {
  try {
    // --- 2. Generate Content with Gemini ---
    const now = new Date();
    const end = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // next 3 days

    const dateRangeHuman = `${now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })} to ${end.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}`;
    const todayFormatted = now.toLocaleDateString('en-GB');
    const startISO = now.toISOString().split('T')[0];
    const endISO = end.toISOString().split('T')[0];

  const prompt = `You are a local events expert for Ashford, Kent, UK. Find real events happening between ${startISO} and ${endISO} in Ashford and nearby areas (prioritize within 8 miles of TN231DS).

ORGANIZE INTO TWO CATEGORIES:

🔄 LONG RUNNING EVENTS - These are regular, recurring activities that happen on a predictable schedule:
- Activities that repeat weekly, monthly, or daily
- Ongoing classes, services, or programs 
- Regular market days, gym sessions, library programs
- Weekly social activities like pub quizzes
- Daily offerings like cinema showings or fitness classes
- Religious services that occur weekly
- Any activity someone could reliably expect to attend regularly

🎯 ONE-OFF EVENTS - These are specific, dated events that happen once or have a limited run:
- Special performances, concerts, or shows with specific dates
- One-time workshops, talks, or educational events
- Festival events or special celebrations
- Art exhibition openings/closings
- Community meetings or special gatherings
- Seasonal events tied to specific dates
- Any event that has a unique date/time and won't repeat regularly

SEARCH APPROACH:
- Think broadly about what activities might be happening in the Ashford area
- Consider all types of venues and spaces where events could occur
- Look beyond obvious places - events can happen anywhere
- Think about seasonal activities appropriate for October
- Consider both indoor and outdoor possibilities

THEMATIC SEARCH - Cast a wide net for diverse event types:
- **Arts & Culture:** Any creative activities, performances, exhibitions, or cultural experiences
- **Food & Drink:** Any food-related events, special dining experiences, or beverage activities  
- **Community & Local:** Any gatherings, meetings, social events, or community activities
- **Health & Wellness:** Any fitness, wellbeing, or outdoor activities beyond standard gym offerings
- **Learning & Education:** Any educational opportunities, talks, courses, or skill-sharing events
- **Seasonal/October:** Any autumn-themed activities, harvest events, or seasonal celebrations
- **Family & Children:** Any activities specifically designed for families or young people
- **Business & Professional:** Any networking, business events, or professional development activities

ACCURACY REQUIREMENTS:
✅ Include both regular scheduled activities AND specific one-off events
✅ Focus on events within 20 miles of Ashford postcode TN231DS  
✅ At least one credible source per event (venue name, organization, etc.)
✅ Provide realistic distance estimates from TN231DS
✅ One-off events can include typical seasonal activities that commonly happen in October
✅ Regular events should be activities that genuinely repeat on a schedule
❌ Don't invent completely fictional venues or organizations
❌ Don't create events that would be highly unusual for the Ashford area

OUTPUT FORMAT (JSON only, no extra text):
{
  "title": "🎟️ Ashford Events — Next 3 Days",
  "subtitle": "${dateRangeHuman} • near TN231DS",
  "longRunningEvents": [
    {
      "title": "[regular activity name]",
      "sources": ["[venue/source name]"],
      "description": "[brief description of regular activity]",
      "distanceMiles": [number],
      "distance": "[X.X miles from TN231DS]",
      "time": "[typical schedule, e.g., 'Daily 9am-5pm' or 'Tuesdays 7pm']",
      "startDateTime": "[next occurrence ISO format or null]",
      "venueName": "[venue name]",
      "venueAddress": "[address with postcode if known]",
      "category": "long-running"
    }
  ],
  "oneOffEvents": [
    {
      "title": "[specific event name]",
      "sources": ["[venue/source name]"],
      "description": "[brief description of specific event]",
      "distanceMiles": [number],
      "distance": "[X.X miles from TN231DS]",
      "time": "[specific date/time]",
      "startDateTime": "[ISO format]",
      "venueName": "[venue name]",
      "venueAddress": "[address with postcode if known]",
      "category": "one-off"
    }
    }
  ]
}

TARGET: Find up to 5 long running events AND up to 5 one-off events (maximum 10 total events).
IMPORTANT: Only include events you are confident exist. If you can only find 2-3 events per category, that's perfectly fine. Do NOT create fictional events just to reach the maximum quota.`;

    if (isDryRun) {
      console.log('🧪 Prompt sent to AI:');
      console.log(prompt);
    }

    const jsonResponse = await callGeminiAPI(GEMINI_API_KEY!, prompt);

    // Parse the JSON response
    const newsletterData = parseAIJsonResponse(jsonResponse);

    // Fallback: if no events returned, try a slightly more permissive prompt
    let finalData = newsletterData;
    const hasEvents = (finalData.longRunningEvents && finalData.longRunningEvents.length > 0) || 
                     (finalData.oneOffEvents && finalData.oneOffEvents.length > 0) ||
                     (Array.isArray(finalData.events) && finalData.events.length > 0);
    
    if (!hasEvents) {
      const fallbackPrompt = `FALLBACK: Find Ashford area events for ${startISO} to ${endISO}. Organize into:

🔄 REGULAR ACTIVITIES (things that happen repeatedly):
- Any weekly, daily, or monthly recurring activities

🎯 SPECIAL EVENTS (specific dated events):
- Any one-time events, special occasions, or limited-time activities happening in the date range

SEARCH BROADLY:
- Think about all possible activities in the Ashford area
- Consider seasonal events appropriate for October
- Look for both indoor and outdoor possibilities
- Include activities for all age groups and interests
- Consider business, educational, cultural, social, and recreational events

JSON ONLY:
{
  "title": "🎟️ Ashford Events — Next 3 Days",
  "subtitle": "${dateRangeHuman} • near TN231DS",
  "longRunningEvents": [
    {
      "title": "[regular activity]",
      "sources": ["[venue]"],
      "description": "[brief description]",
      "distanceMiles": [number under 8],
      "distance": "[X miles from TN231DS]",
      "time": "[typical schedule]",
      "startDateTime": null,
      "venueName": "[venue]",
      "venueAddress": "[address]",
      "category": "long-running"
    }
  ],
  "oneOffEvents": [
    {
      "title": "[specific event]",
      "sources": ["[venue]"],
      "description": "[brief description]",
      "distanceMiles": [number under 8],
      "distance": "[X miles from TN231DS]",
      "time": "[specific date/time]",
      "startDateTime": "[ISO format]",
      "venueName": "[venue]",
      "venueAddress": "[address]",
      "category": "one-off"
    }
  ]
}

TARGET: Find up to 5 events per category. Only include real events - don't invent activities to reach the quota.`;

      if (isDryRun) {
        console.log('🧪 Fallback prompt sent to AI:');
        console.log(fallbackPrompt);
      }

      const fallbackResponse = await callGeminiAPI(GEMINI_API_KEY!, fallbackPrompt);
      try {
        finalData = parseAIJsonResponse(fallbackResponse);
      } catch {
        // keep original empty data if parsing fails
      }
    }

    // Generate HTML from JSON data
  const htmlContent = generateHtmlFromJson(finalData);

    // Create plain text content for email
    let plainTextContent = `${finalData.title || 'Ashford Events — Next 3 Days'}\n\n`;
    
    // Function to format event text
    const formatEventText = (e: any, idx: number, inferredCategory?: string) => {
      const srcs = Array.isArray(e.sources) ? e.sources.join(', ') : 'N/A';
      
      // Generate Google search link for plain text
      const searchQuery = `${e.title} ${e.venueName || ''} Ashford Kent`.trim();
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
      
      const category = e.category || inferredCategory || 'one-off';
      const categoryText = category === 'long-running' ? '[Regular]' : '[One-off]';
      return `#${idx + 1} ${e.title} ${categoryText}\nTime: ${e.time || e.startDateTime || 'TBC'}\nDistance: ${e.distance || (typeof e.distanceMiles === 'number' ? `${e.distanceMiles.toFixed(1)} mi` : 'N/A')}\nSources: ${srcs}\nGoogle Search: ${googleSearchUrl}\n${e.description || ''}\n`;
    };

    // Handle new categorized structure
    if (finalData.longRunningEvents || finalData.oneOffEvents) {
      let eventCounter = 0;
      
      if (finalData.longRunningEvents && finalData.longRunningEvents.length > 0) {
        plainTextContent += '🔄 REGULAR ACTIVITIES:\n\n';
        plainTextContent += finalData.longRunningEvents.map((e: any) => formatEventText(e, ++eventCounter, 'long-running')).join('\n');
      }
      
      if (finalData.oneOffEvents && finalData.oneOffEvents.length > 0) {
        if (finalData.longRunningEvents && finalData.longRunningEvents.length > 0) {
          plainTextContent += '\n';
        }
        plainTextContent += '🎯 SPECIAL EVENTS:\n\n';
        plainTextContent += finalData.oneOffEvents.map((e: any) => formatEventText(e, ++eventCounter, 'one-off')).join('\n');
      }
      
      if (eventCounter === 0) {
        plainTextContent += 'No events found.';
      }
    } 
    // Fallback for old structure
    else if (Array.isArray(finalData.events)) {
      plainTextContent += finalData.events.map((e: any, idx: number) => formatEventText(e, idx + 1)).join('\n');
    } else {
      plainTextContent += 'No events found.';
    }

    // --- 3. Conditionally Send Email or Log to Console ---
    const subject = `Ashford Events (Next 3 Days) — ${todayFormatted}`;

    if (isDryRun) {
      console.log('📊 JSON Data:');
      console.log(JSON.stringify(finalData, null, 2));
      mockSendEmail({
        senderEmail: SENDER_EMAIL!,
        senderPassword: SENDER_PASSWORD!,
        recipientEmail: ASHFORD_NEWSLETTER!,
        subject,
        textContent: plainTextContent,
        htmlContent
      });
    } else {
      await sendEmail({
        senderEmail: SENDER_EMAIL!,
        senderPassword: SENDER_PASSWORD!,
        recipientEmail: ASHFORD_NEWSLETTER!,
        subject,
        textContent: plainTextContent,
        htmlContent
      });
    }

  } catch (error) {
    console.error('❌ An error occurred during the process:', error);
    process.exit(1);
  }
}

// Run the main function
main();
