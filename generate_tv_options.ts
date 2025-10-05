// For local testing, uncomment the line below after running: npm install dotenv
import 'dotenv/config';

import { callGeminiAPI, parseAIJsonResponse, sendEmail, mockSendEmail, EmailConfig, writeToTempFileAndOpen } from './utils';

// Generate HTML from JSON data
function generateHtmlFromJson(data: any): string {
  const sportsHtml = data.sports && data.sports.length > 0 ? data.sports.map((event: any) => {
    const timeColor = event.time ? '#10b981' : '#6b7280';
    
    return `
      <div style="margin: 20px 0; padding: 18px; background: #f0f9ff; border-radius: 10px; border-left: 4px solid #3b82f6;">
        <h4 style="color: #1e40af; font-size: 18px; margin: 0 0 10px 0; font-weight: 600;">${event.name}</h4>
        
        <div style="margin: 8px 0; display: flex; flex-wrap: wrap; gap: 8px;">
          ${event.time ? `<span style="color: ${timeColor}; font-weight: 600; background: #dcfce7; padding: 4px 8px; border-radius: 4px; font-size: 13px;">⏰ ${event.time}</span>` : ''}
          <span style="color: #1e40af; font-weight: 500; background: #dbeafe; padding: 4px 8px; border-radius: 4px; font-size: 13px;">📺 ${event.channel}</span>
          <span style="color: #7c3aed; font-weight: 500; background: #ede9fe; padding: 4px 8px; border-radius: 4px; font-size: 13px;">${event.category}</span>
        </div>
        
        <p style="color: #374151; line-height: 1.5; margin: 12px 0; font-size: 14px;">${event.description}</p>
      </div>
    `;
  }).join('') : '';

  const liveTvHtml = data.liveTV && data.liveTV.length > 0 ? data.liveTV.map((show: any) => {
    return `
      <div style="margin: 18px 0; padding: 16px; background: #fff7ed; border-radius: 10px; border-left: 4px solid #ea580c;">
        <h4 style="color: #ea580c; font-size: 17px; margin: 0 0 8px 0; font-weight: 600;">${show.title}</h4>
        
        <div style="margin: 8px 0; display: flex; flex-wrap: wrap; gap: 8px;">
          <span style="color: #10b981; font-weight: 600; background: #dcfce7; padding: 4px 8px; border-radius: 4px; font-size: 13px;">⏰ ${show.time}</span>
          <span style="color: #ea580c; font-weight: 500; background: #fed7aa; padding: 4px 8px; border-radius: 4px; font-size: 13px;">📺 ${show.channel}</span>
          <span style="color: #7c2d12; font-weight: 500; background: #fef3c7; padding: 4px 8px; border-radius: 4px; font-size: 13px;">${show.genre}</span>
        </div>
        
        <p style="color: #374151; line-height: 1.5; margin: 10px 0; font-size: 14px;">${show.description}</p>
      </div>
    `;
  }).join('') : '';

  const tvShowsHtml = data.tvShows && data.tvShows.length > 0 ? data.tvShows.map((show: any) => {
    const ratingColor = show.rating >= 8 ? '#10b981' : show.rating >= 6 ? '#f59e0b' : '#ef4444';
    const searchQuery = show.title.replace(/\s+/g, '+');
    const trailerUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
    
    return `
      <div style="margin: 25px 0; padding: 20px; background: #fefefe; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <h4 style="color: #dc2626; font-size: 19px; margin: 0 0 12px 0; font-weight: 600;">${show.title}</h4>
        
        <div style="margin: 10px 0; display: flex; flex-wrap: wrap; gap: 8px;">
          <span style="color: ${ratingColor}; font-weight: 600; background: #f3f4f6; padding: 4px 10px; border-radius: 5px; font-size: 13px;">⭐ ${show.rating}/10</span>
          <span style="color: #059669; font-weight: 500; background: #d1fae5; padding: 4px 10px; border-radius: 5px; font-size: 13px;">📱 ${show.platform}</span>
          <span style="color: #7c2d12; font-weight: 500; background: #fed7aa; padding: 4px 10px; border-radius: 5px; font-size: 13px;">${show.genre}</span>
        </div>
        
        <p style="color: #4b5563; line-height: 1.6; margin: 15px 0; font-size: 14px;">${show.plot}</p>
        
        <a href="${trailerUrl}" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; margin: 8px 8px 0 0; transition: transform 0.2s; font-size: 14px;">🔍 Search Trailer</a>
        <span style="color: #6b7280; font-size: 13px; font-style: italic;">Reason: ${show.reason}</span>
      </div>
    `;
  }).join('') : '';

  const moviesHtml = data.movies && data.movies.length > 0 ? data.movies.map((movie: any) => {
    const ratingColor = movie.rating >= 8 ? '#10b981' : movie.rating >= 6 ? '#f59e0b' : '#ef4444';
    const searchQuery = movie.title.replace(/\s+/g, '+');
    const trailerUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
    
    return `
      <div style="margin: 25px 0; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <h4 style="color: #1e40af; font-size: 19px; margin: 0 0 12px 0; font-weight: 600;">${movie.title}</h4>
        
        <div style="margin: 10px 0; display: flex; flex-wrap: wrap; gap: 8px;">
          <span style="color: ${ratingColor}; font-weight: 600; background: #f3f4f6; padding: 4px 10px; border-radius: 5px; font-size: 13px;">⭐ ${movie.rating}/10</span>
          <span style="color: #1e40af; font-weight: 500; background: #dbeafe; padding: 4px 10px; border-radius: 5px; font-size: 13px;">📱 ${movie.platform}</span>
          <span style="color: #7c2d12; font-weight: 500; background: #fed7aa; padding: 4px 10px; border-radius: 5px; font-size: 13px;">${movie.genre}</span>
        </div>
        
        <p style="color: #4b5563; line-height: 1.6; margin: 15px 0; font-size: 14px;">${movie.plot}</p>
        
        <a href="${trailerUrl}" style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; margin: 8px 8px 0 0; transition: transform 0.2s; font-size: 14px;">🔍 Search Trailer</a>
        <span style="color: #6b7280; font-size: 13px; font-style: italic;">Reason: ${movie.reason}</span>
      </div>
    `;
  }).join('') : '';

  const cinemaHtml = data.cinema && data.cinema.length > 0 ? data.cinema.map((movie: any) => {
    const ratingColor = movie.rating >= 8 ? '#10b981' : movie.rating >= 6 ? '#f59e0b' : '#ef4444';
    const searchQuery = movie.title.replace(/\s+/g, '+');
    const trailerUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
    
    return `
      <div style="margin: 25px 0; padding: 20px; background: #fef7ff; border-radius: 12px; border: 1px solid #e9d5ff; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <h4 style="color: #7c3aed; font-size: 19px; margin: 0 0 12px 0; font-weight: 600;">${movie.title}</h4>
        
        <div style="margin: 10px 0; display: flex; flex-wrap: wrap; gap: 8px;">
          <span style="color: ${ratingColor}; font-weight: 600; background: #f3f4f6; padding: 4px 10px; border-radius: 5px; font-size: 13px;">⭐ ${movie.rating}/10</span>
          <span style="color: #7c3aed; font-weight: 500; background: #ede9fe; padding: 4px 10px; border-radius: 5px; font-size: 13px;">🎬 Cinema</span>
          <span style="color: #7c2d12; font-weight: 500; background: #fed7aa; padding: 4px 10px; border-radius: 5px; font-size: 13px;">${movie.genre}</span>
        </div>
        
        <p style="color: #4b5563; line-height: 1.6; margin: 15px 0; font-size: 14px;">${movie.plot}</p>
        
        <a href="${trailerUrl}" style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; margin: 8px 8px 0 0; transition: transform 0.2s; font-size: 14px;">🔍 Search Trailer</a>
        <span style="color: #6b7280; font-size: 13px; font-style: italic;">Release: ${movie.releaseStatus}</span>
      </div>
    `;
  }).join('') : '';

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TV & Entertainment Newsletter</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #dc2626 0%, #7c2d12 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 650px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            border-radius: 12px;
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
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
        
        .section {
            margin: 30px 0;
        }
        
        .section-title {
            color: #1e40af;
            font-size: 24px;
            margin: 0 0 20px 0;
            font-weight: 700;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 8px;
        }
        
        .sports-section .section-title {
            color: #0f766e;
            border-bottom-color: #14b8a6;
        }
        
        .live-tv-section .section-title {
            color: #ea580c;
            border-bottom-color: #f97316;
        }
        
        .cinema-section .section-title {
            color: #7c3aed;
            border-bottom-color: #8b5cf6;
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
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Today's Sports & Entertainment Guide</p>
        </div>
        <div class="content">
            ${sportsHtml ? `
            <div class="section sports-section">
                <h2 class="section-title">🏆 Sports Tonight</h2>
                ${sportsHtml}
            </div>
            ` : ''}
            
            ${liveTvHtml ? `
            <div class="section live-tv-section">
                <h2 class="section-title">📺 Live TV Tonight</h2>
                ${liveTvHtml}
            </div>
            ` : ''}
            
            ${tvShowsHtml ? `
            <div class="section">
                <h2 class="section-title">📺 TV Shows</h2>
                ${tvShowsHtml}
            </div>
            ` : ''}
            
            ${moviesHtml ? `
            <div class="section">
                <h2 class="section-title">🍿 Movies</h2>
                ${moviesHtml}
            </div>
            ` : ''}
            
            ${cinemaHtml ? `
            <div class="section cinema-section">
                <h2 class="section-title">🎬 Hot in Cinema</h2>
                ${cinemaHtml}
            </div>
            ` : ''}
        </div>
        <div class="footer">
            <p>Enjoy your viewing! 📺✨</p>
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
const TV_NEWSLETTER = process.env.TV_NEWSLETTER;

// Check if the script was run with the --dry-run flag
const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  console.log("🟢 Running in DRY RUN mode. No email will be sent.");
}

// A check to ensure all variables are loaded correctly
if (!GEMINI_API_KEY || !SENDER_EMAIL || !SENDER_PASSWORD || !TV_NEWSLETTER) {
  console.error("❌ One or more required environment variables are missing.");
  process.exit(1);
}

/**
 * The main function that runs our daily task.
 */
async function main() {
  try {
    // --- 2. Generate Content with Gemini (Two-step process) ---
    const today = new Date();
    const todayFormatted = today.toLocaleDateString('en-GB');
    const dayName = today.toLocaleDateString('en-GB', { weekday: 'long' });
    const todayFullDate = `${dayName}, ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    
    // Step 1: Generate initial suggestions
    const suggestionPrompt = `CRITICAL: TODAY'S EXACT DATE IS ${todayFullDate} (${todayFormatted}).

You are a FACT-FINDER, not a content creator. Your job is to FIND actual events and shows scheduled for ${todayFullDate}, NOT to create or suggest fictional content.

IMPORTANT: DO NOT make up events to fill quotas.

Find actual, verified content scheduled/available for ${todayFullDate} in the UK:

Return a JSON object with this structure:

{
  "title": "📺 TV & Entertainment Guide - ${todayFormatted}",
  "sports": [
    {
      "name": "[event_name]",
      "date": "${todayFullDate}",
      "time": "[event_time]",
      "channel": "[broadcast_channel]",
      "category": "[sport_category]",
      "description": "[event_description]"
    }
  ],
  "liveTV": [
    {
      "title": "[show_title]",
      "date": "${todayFullDate}",
      "time": "[broadcast_time]",
      "channel": "[tv_channel]",
      "genre": "[show_genre]",
      "description": "[show_description]"
    }
  ],
  "tvShows": [
    {
      "title": "[show_title]",
      "rating": "[numeric_rating]",
      "platform": "[streaming_platform]",
      "genre": "[content_genre]",
      "plot": "[plot_summary]",
      "reason": "[recommendation_reason]"
    }
  ],
  "movies": [
    {
      "title": "[movie_title]",
      "rating": "[numeric_rating]",
      "platform": "[streaming_platform]",
      "genre": "[movie_genre]",
      "plot": "[plot_summary]",
      "reason": "[recommendation_reason]"
    }
  ],
  "cinema": [
    {
      "title": "[movie_title]",
      "rating": "[numeric_rating]",
      "genre": "[movie_genre]",
      "plot": "[plot_summary]",
      "releaseStatus": "[release_status]"
    }
  ]
}

**SPORTS SECTION - ONLY VERIFIED EVENTS ON ${todayFullDate}:**
CRITICAL: ONLY include events that you can verify are ACTUALLY scheduled for ${todayFullDate}.

FACT-CHECK FIRST: Before including any event, verify it's really happening on ${todayFullDate}.

Search for actual men's football and major sports events scheduled for ${todayFullDate}:
- Check if Premier League season is active and if matches are scheduled for ${todayFullDate}
- Check if Champions League matches are scheduled for ${todayFullDate}
- Check if England has any international matches on ${todayFullDate}
- Check for actual major sports events on ${todayFullDate}

IMPORTANT: If you cannot verify any real events for ${todayFullDate}, return an empty sports array.

**LIVE TV SECTION - POPULAR REALITY/DOCUMENTARY SHOWS:**
Find reality TV and documentary shows that commonly air in the evening on UK channels. Focus on shows that are currently running series or regularly scheduled:

Types of shows we're interested in (include if they have current series):
- Police/Crime shows: Police Interceptors, Traffic Cops, Road Wars, 24 Hours in Police Custody
- Emergency services: 999: What's Your Emergency?, Ambulance, Emergency Rescue
- Social documentaries: Benefits Street, Can't Pay? We'll Take It Away!
- Reality competition: The Island with Bear Grylls, SAS: Who Dares Wins
- Lifestyle shows: Come Dine With Me, Four in a Bed, A Place in the Sun
- Dating shows: First Dates, Married at First Sight
- Entertainment: Gogglebox, The Great British Bake Off (if in season)

Include typical evening time slots (7pm-11pm) and common channels (Channel 4, Channel 5, BBC Three, etc).

IMPORTANT: Focus on shows that are currently airing new episodes or regularly scheduled repeats.


**TV SHOWS SECTION:**
Popular streaming shows (Netflix, Apple TV, Amazon Prime, Disney+, Now TV, BBC iPlayer, ITV Hub, Channel 4 All 4):
- True crime documentaries, shocking shows, thriller series
- Trending reality shows like Love Island, Big Brother
- Popular documentaries and investigative series
- Crime dramas and police procedurals

**MOVIES SECTION:**
Movies on streaming platforms:
- Recent releases on streaming services
- Popular movies trending this week
- True crime documentaries and thriller films

**CINEMA SECTION:**
**CINEMA SECTION:**
Current movies in UK cinemas (verify actual availability):
- New releases currently showing
- Box office hits currently playing
- Popular films currently available

QUALITY OVER QUANTITY:
- It's better to return fewer accurate items than many fictional ones
- Empty arrays are acceptable if no real content exists for ${todayFullDate}
- Do not create fictional events to meet any quotas

Return ONLY the JSON object, no additional text.`;

    // Write Step 1 prompt to file and open it
    const step1Content = `STEP 1 PROMPT - Initial Suggestions
=====================================
${suggestionPrompt}
=====================================`;
    writeToTempFileAndOpen(step1Content, `step1-prompt-${Date.now()}`);

    console.log("🤖 Step 1: Generating initial suggestions...");
    const initialResponse = await callGeminiAPI(GEMINI_API_KEY!, suggestionPrompt);
    const initialData = parseAIJsonResponse(initialResponse);
    
    // Write Step 1 results to file and open it
    const step1Results = `STEP 1 RESULTS - Initial Suggestions
=====================================
${JSON.stringify(initialData, null, 2)}
=====================================`;
    writeToTempFileAndOpen(step1Results, `step1-results-${Date.now()}`);

    // Step 2: Fact-check and filter suggestions
    const factCheckPrompt = `You are a strict fact-checker. Review the following TV and entertainment suggestions for ${todayFullDate} and filter out any that are not factually accurate.

CRITICAL FACT-CHECK REQUIREMENTS:
- TODAY'S EXACT DATE IS: ${todayFullDate}
- For SPORTS: Only keep events actually scheduled for ${todayFullDate} - verify the specific date
- For LIVE TV: Only keep shows actually broadcasting on ${todayFullDate} - verify the specific date
- For TV SHOWS/MOVIES: Only keep content actually available on stated platforms
- For CINEMA: Only keep movies actually showing in UK cinemas as of ${todayFullDate}

Original suggestions to fact-check:
${JSON.stringify(initialData, null, 2)}

Return your fact-checked results using this exact JSON structure template:

{
  "title": "[newsletter_title]",
  "dateChecked": "${todayFullDate}",
  "sports": [
    {
      "name": "[event_name]",
      "time": "[event_time]",
      "channel": "[broadcast_channel]",
      "category": "[sport_category]",
      "description": "[event_description]",
      "dateVerified": "${todayFullDate}"
    }
  ],
  "liveTV": [
    {
      "title": "[show_title]",
      "time": "[broadcast_time]",
      "channel": "[tv_channel]",
      "genre": "[show_genre]",
      "description": "[show_description]",
      "dateVerified": "${todayFullDate}"
    }
  ],
  "tvShows": [
    {
      "title": "[show_title]",
      "rating": "[numeric_rating]",
      "platform": "[streaming_platform]",
      "genre": "[content_genre]",
      "plot": "[plot_summary]",
      "reason": "[recommendation_reason]"
    }
  ],
  "movies": [
    {
      "title": "[movie_title]",
      "rating": "[numeric_rating]",
      "platform": "[streaming_platform]",
      "genre": "[movie_genre]",
      "plot": "[plot_summary]",
      "reason": "[recommendation_reason]"
    }
  ],
  "cinema": [
    {
      "title": "[movie_title]",
      "rating": "[numeric_rating]",
      "genre": "[movie_genre]",
      "plot": "[plot_summary]",
      "releaseStatus": "[release_status]"
    }
  ]
}

Your fact-checking task - be extremely strict:
1. SPORTS: Check each sports event - is it really happening on ${todayFullDate}? Verify the date specifically.
2. LIVE TV: Check each live TV show - is it really airing tonight on ${todayFullDate}? Verify the broadcast schedule.
3. STREAMING: Check each streaming show/movie - is it really available on the stated platform?
4. CINEMA: Check each cinema movie - is it really showing in UK cinemas now?

STRICT REMOVAL CRITERIA - Remove any entries that are:
- Not scheduled for the exact date ${todayFullDate} (sports/live TV)
- Not available on the stated platform (streaming content)
- Not currently showing in UK cinemas (cinema content)
- Fictional, made-up, or generic content
- From wrong dates (even if close to ${todayFullDate})

Be conservative: if you're unsure about a sports event or live TV show date, remove it.

Return the filtered JSON with only factually accurate entries. If a category has no accurate entries, return an empty array for that category.

Return ONLY the corrected JSON object, no additional text.`;

    // Write Step 2 prompt to file and open it
    const step2Content = `STEP 2 PROMPT - Fact Checking
=================================
${factCheckPrompt}
=================================`;
    writeToTempFileAndOpen(step2Content, `step2-prompt-${Date.now()}`);

    console.log("🔍 Step 2: Fact-checking and filtering suggestions...");
    const factCheckedResponse = await callGeminiAPI(GEMINI_API_KEY!, factCheckPrompt);
    const newsletterData = parseAIJsonResponse(factCheckedResponse);

    // Write Step 2 results to file and open it
    const step2Results = `STEP 2 RESULTS - Fact-Checked & Filtered
==========================================
${JSON.stringify(newsletterData, null, 2)}
==========================================`;
    writeToTempFileAndOpen(step2Results, `step2-results-${Date.now()}`);

    console.log("✅ Two-step verification complete.");

    // Generate HTML from JSON data
    const htmlContent = generateHtmlFromJson(newsletterData);

    // Create variables needed for email
    const plainTextContent = `${newsletterData.title}\n\n` +
      (newsletterData.sports && newsletterData.sports.length > 0 ? 
        `SPORTS TONIGHT:\n${newsletterData.sports.map((event: any) => 
          `${event.name}\nTime: ${event.time} | Channel: ${event.channel} | ${event.category}\n${event.description}\n`
        ).join('\n')}\n` : '') +
      (newsletterData.liveTV && newsletterData.liveTV.length > 0 ?
        `LIVE TV TONIGHT:\n${newsletterData.liveTV.map((show: any) => 
          `${show.title}\nTime: ${show.time} | Channel: ${show.channel} | Genre: ${show.genre}\n${show.description}\n`
        ).join('\n')}\n` : '') +
      (newsletterData.tvShows && newsletterData.tvShows.length > 0 ?
        `TV SHOWS:\n${newsletterData.tvShows.map((show: any) => 
          `${show.title}\nRating: ${show.rating}/10 | Platform: ${show.platform} | Genre: ${show.genre}\n${show.plot}\nReason: ${show.reason}\n`
        ).join('\n')}\n` : '') +
      (newsletterData.movies && newsletterData.movies.length > 0 ?
        `MOVIES:\n${newsletterData.movies.map((movie: any) => 
          `${movie.title}\nRating: ${movie.rating}/10 | Platform: ${movie.platform} | Genre: ${movie.genre}\n${movie.plot}\nReason: ${movie.reason}\n`
        ).join('\n')}\n` : '') +
      (newsletterData.cinema && newsletterData.cinema.length > 0 ?
        `HOT IN CINEMA:\n${newsletterData.cinema.map((movie: any) => 
          `${movie.title}\nRating: ${movie.rating}/10 | Genre: ${movie.genre}\n${movie.plot}\nRelease: ${movie.releaseStatus}\n`
        ).join('\n')}` : '');

    // --- 3. Conditionally Send Email or Log to Console ---
    if (isDryRun) {
      // If it's a dry run, just print the summary to the console
      console.log("📊 JSON Data:");
      console.log(JSON.stringify(newsletterData, null, 2));
      mockSendEmail({
        senderEmail: SENDER_EMAIL!,
        senderPassword: SENDER_PASSWORD!,
        recipientEmail: PERSONAL_NEWSLETTER!,
        subject: `TV & Entertainment Guide for ${todayFormatted}`,
        textContent: plainTextContent,
        htmlContent: htmlContent
      });

    } else {
      // If it's a live run, send the email
      await sendEmail({
        senderEmail: SENDER_EMAIL!,
        senderPassword: SENDER_PASSWORD!,
        recipientEmail: TV_NEWSLETTER!,
        subject: `TV & Entertainment Guide for ${todayFormatted}`,
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