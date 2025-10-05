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
    const suggestionPrompt = `You are a UK TV & Entertainment Guide creator for ${todayFullDate} (${todayFormatted}).

CREATE COMPREHENSIVE ENTERTAINMENT RECOMMENDATIONS for ${todayFullDate}:

Return a JSON object with this EXACT structure:

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
      "rating": [numeric_rating_out_of_10],
      "platform": "[specific_streaming_platform]",
      "genre": "[content_genre]",
      "plot": "[plot_summary]",
      "reason": "[why_recommended_today]"
    }
  ],
  "movies": [
    {
      "title": "[movie_title]",
      "rating": [numeric_rating_out_of_10],
      "platform": "[specific_streaming_platform]",
      "genre": "[movie_genre]",
      "plot": "[plot_summary]",
      "reason": "[why_recommended_today]"
    }
  ],
  "cinema": [
    {
      "title": "[movie_title]",
      "rating": [numeric_rating_out_of_10],
      "genre": "[movie_genre]",
      "plot": "[plot_summary]",
      "releaseStatus": "[current_release_status]"
    }
  ]
}

**CONTENT GENERATION GUIDELINES:**

**SPORTS (Aim for 4-8 items):**
${dayName === 'Saturday' || dayName === 'Sunday' ? '- Weekend focus: Sky Sports typically shows Premier League, F1, rugby, golf, tennis' : '- Weekday focus: Champions League/Europa League, international football, cricket, snooker'}
- **Include recurring sports programming**: Match of the Day 2, Sports news shows, regular coverage
- **Use established patterns**: Sky Sports usually has football at 12:30, 3:00, 5:30 PM on weekends
- **Include sports news**: Sky Sports News, BBC Sport programming
- **Consider season timing**: Football season, cricket season, tennis tournaments
- **Be creative but realistic**: Invent plausible team matchups or use "major fixture" approach

**LIVE TV (Aim for 8-12 items):**
${dayName === 'Sunday' ? '- Sunday staples: Antiques Roadshow, Countryfile, Call the Midwife, The Repair Shop' : ''}
- **Regular UK programming**: First Dates, Come Dine With Me, Gogglebox, 24 Hours in Police Custody
- **News and current affairs**: BBC News, ITV Evening News, regional programming
- **Channel-specific content**: BBC drama slots, ITV crime series, Channel 4 documentaries
- **Reality and lifestyle**: Property shows, cooking programs, dating shows
- **Time slots**: Use realistic UK primetime 7-11 PM

**TV SHOWS (Aim for 12-20 items):**
Focus on both established hits AND newer releases:
- **Netflix UK**: The Crown, Stranger Things, Wednesday, Heartstopper, true crime docs, Korean content
- **Apple TV+**: Ted Lasso, Severance, The Morning Show, Foundation, Shrinking 
- **Amazon Prime Video**: The Boys, Clarkson's Farm, The Marvelous Mrs. Maisel, fallout
- **Disney+ UK**: Marvel shows, The Bear, Star Wars content, FX productions
- **BBC iPlayer**: Line of Duty, Happy Valley, recent BBC dramas, Blue Lights
- **Sky/NOW**: House of the Dragon, Succession reruns, HBO content
- **Include variety**: Include confirmed 2025 seasons (many shows have renewal patterns)
- **Mix content types**: British shows, international hits, different genres

**MOVIES (Aim for 12-20 items):**
Mix of recent releases and streaming favorites:
- **Netflix UK**: Recent additions, Netflix originals, popular licensed content from 2023-2024
- **Apple TV+**: Apple originals and exclusives released 2023-2024
- **Amazon Prime Video**: Prime exclusives and popular additions from recent years
- **Sky Cinema/NOW**: Recent blockbusters, franchise films released 2023-2024
- **Disney+ UK**: Marvel, Star Wars, Pixar releases from 2023-2024
- **Focus on 2023-2025**: Recent releases that would be available by October 2025

**CINEMA (Aim for 6-10 items):**
What would realistically be in UK cinemas in October 2025:
- **October timing**: Halloween horror films, autumn blockbusters, awards season begins
- **Realistic patterns**: New franchise entries, sequel patterns, seasonal releases
- **Generic approach okay**: "Latest Marvel release", "New horror thriller", "Awards contender"
- **Consider release windows**: What typically comes out in October cinema seasons
- **Mix realistic titles with generic**: Some specific plausible titles, some generic categories

**QUALITY STANDARDS:**
- **Avoid generic entries**: Instead of "Premier League Live", use "Liverpool vs Arsenal" or similar
- **Specific show titles**: Use real show names, not generic descriptions
- **Realistic ratings**: 6.0-9.5 range, with most 7.0-8.5
- **Platform accuracy**: Use correct UK platform names
- **Engaging descriptions**: 2-3 sentences that sell the content
- **Current relevance**: Focus on what's actually popular/trending in 2025

**GENERATE SUBSTANTIAL CONTENT** - aim for the higher end of item counts while ensuring quality and specificity.

Return ONLY the JSON object, no additional text.`;

    // Write Step 1 prompt to file and open it
    const step1Content = `STEP 1 PROMPT - Initial Suggestions
=====================================
${suggestionPrompt}
=====================================`;
    if (isDryRun) {
      writeToTempFileAndOpen(step1Content, `step1-prompt-${Date.now()}`);
    }

    console.log("🤖 Step 1: Generating initial suggestions...");
    const initialResponse = await callGeminiAPI(GEMINI_API_KEY!, suggestionPrompt);
    const initialData = parseAIJsonResponse(initialResponse);
    
    // Write Step 1 results to file and open it (only during dry runs)
    if (isDryRun) {
      const step1Results = `STEP 1 RESULTS - Initial Suggestions
=====================================
${JSON.stringify(initialData, null, 2)}
=====================================`;
      writeToTempFileAndOpen(step1Results, `step1-results-${Date.now()}`);
    }

    // Step 2: Fact-check and filter suggestions
    const factCheckPrompt = `You are a smart fact-checker who balances accuracy with usefulness. Review the following TV and entertainment suggestions for ${todayFullDate} and improve them while keeping substantial content.

BALANCED FACT-CHECK APPROACH for ${todayFullDate}:

**REMOVE ONLY:**
1. **Obviously fictional content:** Made-up show/movie titles that don't exist
2. **Impossible claims:** Specific sports fixtures with teams that couldn't play each other
3. **Wrong platforms:** Shows/movies clearly not available on claimed platforms
4. **Completely speculative content:** Detailed episode plots for specific dates

**KEEP AND IMPROVE:**
- **Sports:** Keep recurring sports programming, convert specific fixtures to realistic generic ones
- **Live TV:** Keep all regularly scheduled UK shows, remove specific episode details
- **Streaming:** Keep established shows AND plausible future seasons (many are confirmed for 2024-2025)
- **Cinema:** Create realistic generic entries instead of removing everything

**ENHANCEMENT GUIDELINES:**
- **Sports:** If specific teams mentioned, make them generic but realistic ("Premier League fixture" not "Liverpool vs Arsenal on 5/10/2025")
- **TV Shows:** Keep shows with confirmed future seasons, including Season 2-5 of popular series
- **Movies:** Keep established films and recent releases, focus on realistic platform availability
- **Cinema:** Instead of empty array, include generic seasonal entries ("Halloween horror film", "Award season drama")

Original suggestions to fact-check:
${JSON.stringify(initialData, null, 2)}

Return your enhanced results using this exact JSON structure:

{
  "title": "${initialData.title}",
  "dateChecked": "${todayFullDate}",
  "factCheckNotes": "Brief summary of approach - what was kept, improved, and removed",
  "sports": [
    {
      "name": "[realistic_event_name]",
      "time": "[realistic_time]",
      "channel": "[verified_channel]",
      "category": "[sport_category]",
      "description": "[improved_description]",
      "factCheckReason": "[why kept/how improved]"
    }
  ],
  "liveTV": [
    {
      "title": "[established_show_title]",
      "time": "[realistic_time]",
      "channel": "[verified_channel]", 
      "genre": "[show_genre]",
      "description": "[generic_description]",
      "factCheckReason": "[verification reasoning]"
    }
  ],
  "tvShows": [
    {
      "title": "[verified_show_title]",
      "rating": [realistic_rating],
      "platform": "[verified_platform]",
      "genre": "[content_genre]",
      "plot": "[general_plot_summary]",
      "reason": "[recommendation_reason]",
      "factCheckReason": "[platform and availability verification]"
    }
  ],
  "movies": [
    {
      "title": "[verified_movie_title]",
      "rating": [realistic_rating],
      "platform": "[verified_platform]",
      "genre": "[movie_genre]",
      "plot": "[general_plot_summary]",
      "reason": "[recommendation_reason]",
      "factCheckReason": "[platform and availability verification]"
    }
  ],
  "cinema": [
    {
      "title": "[realistic_or_generic_title]",
      "rating": [estimated_rating],
      "genre": "[movie_genre]",
      "plot": "[general_plot_or_description]",
      "releaseStatus": "[generic_status]",
      "factCheckReason": "[why included - seasonal/generic reasoning]"
    }
  ]
}

**BALANCED FACT-CHECKING PRINCIPLES:**
1. **Enhance rather than eliminate** - improve questionable content instead of removing it
2. **Keep substantial content** - aim for good quantity while ensuring quality
3. **Use generic approaches** - "Latest Netflix thriller" instead of removing all thrillers
4. **Trust confirmed patterns** - Many 2024 shows will have 2025 seasons
5. **Seasonal reasoning** - October = Halloween films, autumn programming

**TARGET NUMBERS:** Aim for 3-5 sports, 8-12 live TV, 10-15 TV shows, 10-15 movies, 4-8 cinema

Return ONLY the enhanced JSON object with fact-check improvements, no additional text.`;

    // Write Step 2 prompt to file and open it
    const step2Content = `STEP 2 PROMPT - Fact Checking
=================================
${factCheckPrompt}
=================================`;
    if (isDryRun) {
      writeToTempFileAndOpen(step2Content, `step2-prompt-${Date.now()}`);
    }

    console.log("🔍 Step 2: Fact-checking and filtering suggestions...");
    const factCheckedResponse = await callGeminiAPI(GEMINI_API_KEY!, factCheckPrompt);
    const newsletterData = parseAIJsonResponse(factCheckedResponse);

    // Write Step 2 results to file and open it (only during dry runs)
    if (isDryRun) {
      const step2Results = `STEP 2 RESULTS - Fact-Checked & Filtered
==========================================
${JSON.stringify(newsletterData, null, 2)}
==========================================`;
      writeToTempFileAndOpen(step2Results, `step2-results-${Date.now()}`);
    }

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
        recipientEmail: TV_NEWSLETTER!,
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