// For local testing, uncomment the line below after running: npm install dotenv
import 'dotenv/config';

import { callGeminiAPI, parseAIJsonResponse, writeToTempFileAndOpen } from './utils';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Helper function to log prompts and responses using utils method
function logPromptAndResponse(
  promptType: string, 
  promptContent: string, 
  response: string, 
  candidateId?: string, 
  generation?: number
): string {
  const candidateInfo = candidateId ? `-${candidateId}` : '';
  const genInfo = generation !== undefined ? `-gen${generation}` : '';
  const fileName = `${promptType}${candidateInfo}${genInfo}-${Date.now()}`;
  
  const content = `${promptType.toUpperCase()} LOG
${'='.repeat(promptType.length + 4)}
Timestamp: ${new Date().toISOString()}
${candidateId ? `Candidate ID: ${candidateId}` : ''}
${generation !== undefined ? `Generation: ${generation}` : ''}

PROMPT SENT TO AI:
${'='.repeat(18)}
${promptContent}

AI RESPONSE:
${'='.repeat(12)}
${response}

END OF LOG
${'='.repeat(10)}`;

  const filePath = writeToTempFileAndOpen(content, fileName);
  console.log(`📝 ${promptType} logged via utils`);
  return filePath;
}

// Interface for evaluation results
interface EvaluationResult {
  prompt: string;
  response: string;
  factualityScore: number;
  quantityScore: number;
  genericityScore: number;
  overallScore: number;
  feedback: string;
  improvementSuggestions: string[];
}

// Interface for prompt variants
interface PromptCandidate {
  id: string;
  prompt: string;
  evaluation?: EvaluationResult;
  generation: number;
}

// Get the original prompt from generate_tv_options.ts
function getOriginalPrompt(todayFullDate: string, todayFormatted: string, dayName: string): string {
  return `You are a UK TV & Entertainment Guide creator for ${todayFullDate} (${todayFormatted}).

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
}

// Create evaluation prompt
function createEvaluationPrompt(originalPrompt: string, response: string, todayFullDate: string): string {
  return `You are an expert TV & Entertainment content evaluator. Your task is to evaluate the quality of AI-generated TV recommendations based on both FACTUALITY and QUANTITY criteria.

**ORIGINAL PROMPT:**
${originalPrompt}

**AI RESPONSE TO EVALUATE:**
${response}

**EVALUATION CRITERIA:**

**FACTUALITY SCORE (0-10):**
- **Real Shows/Movies (40%)**: Are the TV shows, movies, and streaming content real and accurately described?
- **Platform Accuracy (25%)**: Are the platforms correctly matched to content (e.g., Netflix UK actually has these shows)?
- **Time Accuracy (20%)**: Are broadcast times realistic for UK TV scheduling patterns?
- **Channel Accuracy (15%)**: Do the channels match the content type and typical programming?

**QUANTITY SCORE (0-10):**
- **Sports**: Should have 4-8 items (target: 6)
- **Live TV**: Should have 8-12 items (target: 10)
- **TV Shows**: Should have 12-20 items (target: 16)
- **Movies**: Should have 12-20 items (target: 16)
- **Cinema**: Should have 6-10 items (target: 8)

**GENERICITY SCORE (0-10):**
- **Flexibility (40%)**: Does the prompt allow AI flexibility in content selection rather than requiring specific shows/movies?
- **Generic Guidelines (30%)**: Does it use generic categories ("Latest Marvel release", "Popular crime drama") vs specific titles?
- **Creative Freedom (20%)**: Does it encourage creative/plausible content generation rather than strict accuracy?
- **Adaptability (10%)**: Can the prompt work for different dates without requiring specific real-world events?
- **Higher score = More generic/flexible prompt that gives AI creative freedom**

**OVERALL SCORE:** Average of Factuality, Quantity, and Genericity scores.

**OUTPUT FORMAT:**
Return a JSON object with this EXACT structure. DO NOT include any text before or after the JSON:

{
  "scores": {
    "factualityScore": [numeric_value_0_to_10],
    "quantityScore": [numeric_value_0_to_10],
    "genericityScore": [numeric_value_0_to_10],
    "overallScore": [calculated_average_of_all_three_scores]
  },
  "analysis": {
    "factualityIssues": [
      "Specific factuality problem 1",
      "Specific factuality problem 2"
    ],
    "quantityAnalysis": {
      "sports": {"count": [actual_count], "target": "4-8", "score": [0_to_10]},
      "liveTV": {"count": [actual_count], "target": "8-12", "score": [0_to_10]},
      "tvShows": {"count": [actual_count], "target": "12-20", "score": [0_to_10]},
      "movies": {"count": [actual_count], "target": "12-20", "score": [0_to_10]},
      "cinema": {"count": [actual_count], "target": "6-10", "score": [0_to_10]}
    },
    "genericityAnalysis": {
      "flexibilityLevel": "High/Medium/Low",
      "genericPatterns": ["example of generic language used"],
      "specificRequirements": ["example of overly specific requirement"],
      "creativeFreedom": "Brief assessment of creative freedom allowed"
    },
    "strengths": [
      "What the prompt does well 1",
      "What the prompt does well 2"
    ],
    "weaknesses": [
      "What needs improvement 1", 
      "What needs improvement 2"
    ]
  },
  "improvedPromptSuggestions": [
    {
      "focus": "factuality",
      "description": "Enhance factual accuracy and real content verification",
      "specificChanges": [
        "Add requirement to verify show/movie existence before including",
        "Include disclaimer about using generic titles when uncertain",
        "Add platform verification instructions"
      ]
    },
    {
      "focus": "quantity", 
      "description": "Improve content quantity and consistency",
      "specificChanges": [
        "Make quantity targets more explicit and mandatory",
        "Add penalty for not meeting minimum requirements", 
        "Include counting verification step"
      ]
    },
    {
      "focus": "genericity",
      "description": "Enhance flexibility and creative freedom",
      "specificChanges": [
        "Allow more generic category descriptions",
        "Reduce requirements for specific show names",
        "Encourage plausible fictional content when needed"
      ]
    }
  ]
}

IMPORTANT: Return ONLY the JSON object above. No additional text, explanations, or markdown formatting.

Be thorough and specific in your analysis. Focus on actionable feedback that can be directly implemented in prompt improvements.`;
}

// Create improved prompt variants based on evaluation feedback
function createPromptVariantGenerationPrompt(originalPrompt: string, evaluationResult: EvaluationResult): string {
  return `You are a prompt engineering expert. Your task is to create 3 improved variants of a TV & Entertainment guide generation prompt based on detailed evaluation feedback.

**ORIGINAL PROMPT:**
${originalPrompt}

**EVALUATION SCORES:**
- Overall Score: ${evaluationResult.overallScore}/10
- Factuality Score: ${evaluationResult.factualityScore}/10
- Quantity Score: ${evaluationResult.quantityScore}/10
- Genericity Score: ${evaluationResult.genericityScore}/10

**DETAILED ANALYSIS:**
${evaluationResult.feedback}

**IMPROVEMENT SUGGESTIONS:**
${evaluationResult.improvementSuggestions.join('\n- ')}

**YOUR TASK:**
Create 3 distinct improved variants of the original prompt. Each variant should:
1. Address the specific issues identified in the evaluation
2. Maintain the same JSON structure requirement
3. Be significantly different from each other in approach
4. Focus on improving factuality, quantity, and genericity scores

**VARIANT APPROACHES:**
- Variant 1: Focus on enhanced specificity and real content examples (may reduce genericity for better factuality)
- Variant 2: Focus on improved quantity targets and clearer guidelines 
- Variant 3: Focus on better genericity and flexibility (allow more creative freedom while maintaining quality)

**OUTPUT FORMAT:**
Return a JSON object with this EXACT structure. DO NOT include any text before or after the JSON:

{
  "variant1": {
    "approach": "Enhanced specificity and real content examples (factuality focus)",
    "prompt": "[complete improved prompt text]"
  },
  "variant2": {
    "approach": "Improved quantity targets and clearer guidelines", 
    "prompt": "[complete improved prompt text]"
  },
  "variant3": {
    "approach": "Better genericity and flexibility (creative freedom focus)",
    "prompt": "[complete improved prompt text]"
  }
}

IMPORTANT: Return ONLY the JSON object above, no additional text, explanations, or markdown formatting.

Make each prompt substantially different while addressing the core issues. Focus on practical improvements that will lead to better results.`;
}
// Save evaluation results to file
function saveEvaluationToFile(evaluation: EvaluationResult, promptId: string, generation: number): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `prompt-evaluation-${promptId}-gen${generation}-${timestamp}.txt`;
  const filePath = path.join(os.tmpdir(), fileName);
  
  const content = `PROMPT EVALUATION REPORT
======================
Generation: ${generation}
Prompt ID: ${promptId}
Timestamp: ${new Date().toISOString()}

SCORES:
-------
Factuality Score: ${evaluation.factualityScore}/10
Quantity Score: ${evaluation.quantityScore}/10
Genericity Score: ${evaluation.genericityScore}/10
Overall Score: ${evaluation.overallScore}/10

ORIGINAL PROMPT:
---------------
${evaluation.prompt}

AI RESPONSE:
-----------
${evaluation.response}

EVALUATION FEEDBACK:
-------------------
${evaluation.feedback}

IMPROVEMENT SUGGESTIONS:
-----------------------
${evaluation.improvementSuggestions.map((suggestion, index) => `${index + 1}. ${suggestion}`).join('\n')}

END OF REPORT
=============`;

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`📄 Evaluation saved: ${filePath}`);
  return filePath;
}

// Main optimization function
async function optimizePrompt(maxEvaluations: number = 12): Promise<void> {
  const GEMINI_API_KEY = process.env.FINAL_GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  // Setup date variables (using current date for testing)
  const today = new Date();
  const todayFullDate = today.toLocaleDateString('en-GB', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const todayFormatted = today.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short'
  });
  const dayName = today.toLocaleDateString('en-GB', { weekday: 'long' });

  console.log(`🎯 Starting prompt optimization for ${todayFullDate}`);
  
  // Initialize with original prompt
  const originalPrompt = getOriginalPrompt(todayFullDate, todayFormatted, dayName);
  
  let candidates: PromptCandidate[] = [{
    id: 'original',
    prompt: originalPrompt,
    generation: 0
  }];
  
  let evaluationCount = 0;
  const topCandidateCount = 3;
  
  console.log(`🚀 Starting optimization loop (target: ${maxEvaluations} evaluations)`);
  console.log(`📋 Initial candidate: ${candidates[0].id}, has evaluation: ${!!candidates[0].evaluation}`);
  
  while (evaluationCount < maxEvaluations) {
    console.log(`\n--- ITERATION ${evaluationCount + 1} ---`);
    
    // Find unevaluated candidates
    const unevaluatedCandidates = candidates.filter(c => !c.evaluation);
    
    console.log(`📋 Total candidates: ${candidates.length}`);
    console.log(`📋 Unevaluated candidates: ${unevaluatedCandidates.length}`);
    console.log(`📋 Evaluation count: ${evaluationCount}/${maxEvaluations}`);
    
    // If no unevaluated candidates and we haven't reached max evaluations, try to generate new ones
    if (unevaluatedCandidates.length === 0) {
      console.log("📊 No unevaluated candidates found");
      
      const evaluatedCandidates = candidates.filter(c => c.evaluation);
      
      if (evaluatedCandidates.length === 0) {
        console.log("❌ No evaluated candidates found - cannot continue");
        break;
      }
      
      if (evaluationCount >= maxEvaluations) {
        console.log("🎯 Reached maximum evaluations");
        break;
      }
      
      console.log("🔄 Generating new variants from top performers...");
      
      // Sort and get top candidates for variant generation
      evaluatedCandidates.sort((a, b) => (b.evaluation?.overallScore || 0) - (a.evaluation?.overallScore || 0));
      const topCandidates = evaluatedCandidates.slice(0, topCandidateCount);
      
      const newCandidates: PromptCandidate[] = [];
      const maxGeneration = Math.max(...candidates.map(c => c.generation));
      
      // Generate variants from one top candidate at a time
      for (const topCandidate of topCandidates.slice(0, 1)) { // Just use the best candidate for now
        if (!topCandidate.evaluation) continue;
        
        console.log(`🔄 Generating variants from ${topCandidate.id} (score: ${topCandidate.evaluation.overallScore})...`);
        
        try {
          const variantPrompt = createPromptVariantGenerationPrompt(topCandidate.prompt, topCandidate.evaluation);
          console.log(`  📝 Generating variants...`);
          const variantResponse = await callGeminiAPI(GEMINI_API_KEY, variantPrompt);
          
          // Log the variant generation prompt and response
          logPromptAndResponse(
            'variant-generation',
            variantPrompt,
            variantResponse,
            topCandidate.id,
            topCandidate.generation
          );
          
          console.log(`  📄 Variant response length: ${variantResponse.length} chars`);
          console.log(`  📄 Response starts with: ${variantResponse.substring(0, 100)}...`);
          
          let variants;
          try {
            variants = parseAIJsonResponse(variantResponse);
          } catch (parseError) {
            console.log(`  ⚠️  Failed to parse variant JSON, trying alternative parsing...`);
            console.log(`  📄 Parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
            console.log(`  📄 Raw response first 500 chars: ${variantResponse.substring(0, 500)}...`);
            
            // Try to extract JSON manually
            try {
              // Look for JSON object in the response
              let cleanResponse = variantResponse.replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove control characters
              const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                variants = JSON.parse(jsonMatch[0]);
                console.log(`  ✅ Successfully parsed JSON using alternative method`);
              } else {
                throw new Error("No JSON found in response");
              }
            } catch (altParseError) {
              console.log(`  ❌ Alternative parsing also failed: ${altParseError instanceof Error ? altParseError.message : String(altParseError)}`);
              console.log(`  🔧 Creating default variants...`);
              // Create default variants based on the original prompt
              variants = {
                variant1: {
                  approach: "Enhanced specificity and real content examples (factuality focus)",
                  prompt: topCandidate.prompt + "\n\n**ENHANCEMENT: Focus on using real, verifiable content with specific show names and accurate platform assignments.**"
                },
                variant2: {
                  approach: "Improved quantity targets and clearer guidelines",
                  prompt: topCandidate.prompt.replace(/Aim for \d+-\d+ items/g, "Aim for EXACTLY the specified number of items") + "\n\n**ENHANCEMENT: Strictly enforce quantity requirements.**"
                },
                variant3: {
                  approach: "Better genericity and flexibility (creative freedom focus)",
                  prompt: topCandidate.prompt + "\n\n**ENHANCEMENT: Allow more creative freedom. Use generic categories like 'Latest blockbuster', 'Popular drama series', 'Trending comedy' instead of requiring specific titles. Encourage plausible fictional content when real titles are uncertain.**"
                }
              };
            }
          }
          
          // Add new variants
          ['variant1', 'variant2', 'variant3'].forEach((variantKey, index) => {
            if (variants[variantKey]?.prompt) {
              newCandidates.push({
                id: `${topCandidate.id}-v${index + 1}-gen${maxGeneration + 1}`,
                prompt: variants[variantKey].prompt,
                generation: maxGeneration + 1
              });
            }
          });
          
          break; // Only generate from one candidate per iteration
          
        } catch (error) {
          console.error(`❌ Failed to generate variants from ${topCandidate.id}:`, error);
        }
      }
      
      if (newCandidates.length === 0) {
        console.log("❌ Failed to generate any new candidates - stopping");
        break;
      }
      
      // Add new candidates
      candidates.push(...newCandidates);
      console.log(`📈 Generated ${newCandidates.length} new variants`);
      
      // Continue to next iteration to evaluate the new candidates
      continue;
    }
    
    // Evaluate up to 5 candidates in parallel (or remaining evaluation budget)
    const candidatesToEvaluate = unevaluatedCandidates.slice(0, Math.min(5, maxEvaluations - evaluationCount));
    
    console.log(`📊 Evaluating ${candidatesToEvaluate.length} candidates in parallel...`);
    
    // Evaluate candidates in parallel
    const evaluationPromises = candidatesToEvaluate.map(async (candidate) => {
      console.log(`🤖 Testing prompt: ${candidate.id} (generation ${candidate.generation})`);
      
      try {
        // Generate response
        console.log(`  📝 Generating content for ${candidate.id}...`);
        const response = await callGeminiAPI(GEMINI_API_KEY, candidate.prompt);
        
        // Log the content generation prompt and response
        logPromptAndResponse(
          'content-generation',
          candidate.prompt,
          response,
          candidate.id,
          candidate.generation
        );
        
        // Check if response looks like JSON
        if (!response.trim().startsWith('{') && !response.trim().startsWith('[')) {
          console.log(`  ⚠️  Response for ${candidate.id} doesn't look like JSON, trying to parse anyway...`);
        }
        
        // Evaluate response
        console.log(`  📊 Evaluating response for ${candidate.id}...`);
        const evaluationPrompt = createEvaluationPrompt(candidate.prompt, response, todayFullDate);
        const evaluationResponse = await callGeminiAPI(GEMINI_API_KEY, evaluationPrompt);
        
        // Log the evaluation prompt and response
        logPromptAndResponse(
          'evaluation',
          evaluationPrompt,
          evaluationResponse,
          candidate.id,
          candidate.generation
        );
        
        let evaluationData;
        try {
          evaluationData = parseAIJsonResponse(evaluationResponse);
        } catch (parseError) {
          console.log(`  ⚠️  Failed to parse evaluation JSON for ${candidate.id}, creating default evaluation...`);
          evaluationData = {
            scores: {
              factualityScore: 5,
              quantityScore: 5,
              genericityScore: 5,
              overallScore: 5
            },
            analysis: { 
              weaknesses: ["Failed to parse evaluation"],
              strengths: ["Default evaluation created"]
            },
            improvedPromptSuggestions: [
              {
                focus: "factuality",
                description: "Add more specific guidelines",
                specificChanges: ["Improve JSON structure requirements"]
              },
              {
                focus: "quantity", 
                description: "Include better examples",
                specificChanges: ["Add quantity verification"]
              },
              {
                focus: "genericity",
                description: "Enhance flexibility",
                specificChanges: ["Allow more creative freedom"]
              }
            ]
          };
        }
        
        // Create evaluation result
        const evaluation: EvaluationResult = {
          prompt: candidate.prompt,
          response: response,
          factualityScore: evaluationData.scores?.factualityScore || evaluationData.factualityScore || 5,
          quantityScore: evaluationData.scores?.quantityScore || evaluationData.quantityScore || 5,
          genericityScore: evaluationData.scores?.genericityScore || evaluationData.genericityScore || 5,
          overallScore: evaluationData.scores?.overallScore || evaluationData.overallScore || 5,
          feedback: JSON.stringify(evaluationData.analysis || evaluationData.detailedFeedback || {}, null, 2),
          improvementSuggestions: evaluationData.improvedPromptSuggestions?.map((s: any) => s.description) || 
                                 evaluationData.promptImprovements || 
                                 ["No specific improvements identified"]
        };
        
        candidate.evaluation = evaluation;
        
        console.log(`✅ ${candidate.id}: Score ${evaluation.overallScore}/10 (F:${evaluation.factualityScore}, Q:${evaluation.quantityScore}, G:${evaluation.genericityScore})`);
        
        // Save evaluation to file
        saveEvaluationToFile(evaluation, candidate.id, candidate.generation);
        
        return candidate;
      } catch (error) {
        console.error(`❌ Failed to evaluate candidate ${candidate.id}:`, error);
        return candidate;
      }
    });
    
    // Wait for all evaluations to complete
    await Promise.all(evaluationPromises);
    evaluationCount += candidatesToEvaluate.length;
  }
  
  // Final results
  console.log(`\n🎉 OPTIMIZATION COMPLETE`);
  console.log(`📊 Total evaluations performed: ${evaluationCount}`);
  
  const finalEvaluated = candidates.filter(c => c.evaluation);
  finalEvaluated.sort((a, b) => (b.evaluation?.overallScore || 0) - (a.evaluation?.overallScore || 0));
  
  console.log(`\n🏆 FINAL RANKINGS:`);
  finalEvaluated.forEach((candidate, index) => {
    console.log(`${index + 1}. ${candidate.id} - Score: ${candidate.evaluation?.overallScore}/10 (F:${candidate.evaluation?.factualityScore}, Q:${candidate.evaluation?.quantityScore}, G:${candidate.evaluation?.genericityScore})`);
  });
  
  // Save final summary
  const summaryContent = `PROMPT OPTIMIZATION SUMMARY
==========================
Date: ${new Date().toISOString()}
Target Date: ${todayFullDate}
Total Evaluations: ${evaluationCount}

FINAL RANKINGS:
${finalEvaluated.map((candidate, index) => 
  `${index + 1}. ${candidate.id} - Score: ${candidate.evaluation?.overallScore}/10 (Factuality: ${candidate.evaluation?.factualityScore}, Quantity: ${candidate.evaluation?.quantityScore}, Genericity: ${candidate.evaluation?.genericityScore})`
).join('\n')}

BEST PERFORMING PROMPT:
======================
${finalEvaluated[0]?.prompt || 'No evaluations completed'}

IMPROVEMENT OVER ORIGINAL:
=========================
Original Score: ${candidates.find(c => c.id === 'original')?.evaluation?.overallScore || 'N/A'}/10
Best Score: ${finalEvaluated[0]?.evaluation?.overallScore || 'N/A'}/10
Improvement: ${finalEvaluated[0]?.evaluation?.overallScore && candidates.find(c => c.id === 'original')?.evaluation?.overallScore 
  ? '+' + (finalEvaluated[0].evaluation.overallScore - candidates.find(c => c.id === 'original')!.evaluation!.overallScore).toFixed(1)
  : 'N/A'} points

LOG FILES GENERATED:
===================
All prompts and AI responses have been logged to temporary files:
- content-generation-*.txt: Prompts used to generate TV recommendations and AI responses
- evaluation-*.txt: Prompts used to evaluate the generated content and AI responses  
- variant-generation-*.txt: Prompts used to create improved variants and AI responses
- prompt-evaluation-*.txt: Detailed evaluation reports for each candidate

Log files are saved in: ${os.tmpdir()}
`;
  
  const summaryPath = writeToTempFileAndOpen(summaryContent, `prompt-optimization-summary-${Date.now()}`);
  console.log(`📄 Summary saved and opened: ${summaryPath}`);
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  optimizePrompt().catch(console.error);
}

export { optimizePrompt };

/* 
USAGE INSTRUCTIONS:
==================

1. Make sure you have your GEMINI_API_KEY set in your .env file
2. Run the optimization script:
   npx tsx optimize_prompt.ts

3. Or run a quick test:
   npx tsx test_optimize.ts

4. The script will:
   - Start with the original prompt from generate_tv_options.ts
   - Generate content using Gemini
   - Evaluate the content for factuality, quantity, and genericity
   - Create improved prompt variants
   - Continue iterating until 12 evaluations are complete
   - Save all evaluations and results to text files
   - Log ALL prompts and AI responses to separate files for debugging
   - Display final rankings and improvements

5. All evaluation results are saved to temporary files that will automatically open
6. All prompts sent to AI and responses received are logged to individual files
7. The final summary shows the best performing prompt and improvement metrics

EXPECTED RUNTIME: 10-15 minutes depending on API response times
API CALLS: Approximately 24-36 calls (2-3 per evaluation iteration)
*/