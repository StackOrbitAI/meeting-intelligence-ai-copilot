import { StorageService, AppSettings } from './storage';

export class AIService {
  private static getActiveSettings(): AppSettings {
    return StorageService.getSettings();
  }

  /**
   * Helper to perform fetch requests with error handling
   */
  private static async postRequest(url: string, headers: Record<string, string>, body: any): Promise<any> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (err: any) {
      console.error('[AI Request Error]', err);
      throw err;
    }
  }

  /**
   * Generates embeddings for text chunks using OpenAI or Gemini depending on the active keys.
   */
  static async getEmbedding(text: string): Promise<number[]> {
    const settings = this.getActiveSettings();
    const provider = settings.activeProviderId;

    if (provider === 'openai' && settings.openaiApiKey) {
      const url = 'https://api.openai.com/v1/embeddings';
      const headers = {
        'Authorization': `Bearer ${settings.openaiApiKey}`,
        'Content-Type': 'application/json'
      };
      const body = {
        input: text,
        model: 'text-embedding-3-small'
      };
      const result = await this.postRequest(url, headers, body);
      return result.data[0].embedding;
    }

    // Default or Fallback to Gemini if active or if OpenAI isn't configured
    const geminiKey = settings.geminiApiKey || settings.openaiApiKey;
    if (geminiKey) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`;
      const headers = { 'Content-Type': 'application/json' };
      const body = {
        model: 'models/text-embedding-004',
        content: {
          parts: [{ text }]
        }
      };
      const result = await this.postRequest(url, headers, body);
      return result.embedding.values;
    }

    throw new Error('No API key configured for embeddings. Please configure OpenAI or Gemini key in settings.');
  }

  /**
   * Universal text generation connector
   */
  static async generateText(prompt: string, systemPrompt: string): Promise<string> {
    const settings = this.getActiveSettings();
    const provider = settings.activeProviderId;

    if (provider === 'openai') {
      if (!settings.openaiApiKey) throw new Error('OpenAI API Key is missing in settings.');
      const url = 'https://api.openai.com/v1/chat/completions';
      const headers = {
        'Authorization': `Bearer ${settings.openaiApiKey}`,
        'Content-Type': 'application/json'
      };
      const body = {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      };
      const res = await this.postRequest(url, headers, body);
      return res.choices[0].message.content.trim();
    } 
    
    if (provider === 'claude') {
      if (!settings.claudeApiKey) throw new Error('Claude API Key is missing in settings.');
      const url = 'https://api.anthropic.com/v1/messages';
      const headers = {
        'x-api-key': settings.claudeApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      };
      const body = {
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      };
      const res = await this.postRequest(url, headers, body);
      return res.content[0].text.trim();
    }

    if (provider === 'custom') {
      if (!settings.customApiBaseUrl) throw new Error('Custom API Base URL is missing.');
      const url = `${settings.customApiBaseUrl.replace(/\/$/, '')}/chat/completions`;
      const headers = {
        'Content-Type': 'application/json'
      };
      if (settings.customApiKey) {
        (headers as any)['Authorization'] = `Bearer ${settings.customApiKey}`;
      }
      const body = {
        model: settings.customModel || 'default',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      };
      const res = await this.postRequest(url, headers, body);
      return res.choices[0].message.content.trim();
    }

    if (provider === 'openrouter') {
      if (!settings.openrouterApiKey) throw new Error('OpenRouter API Key is missing in settings.');
      const url = 'https://openrouter.ai/api/v1/chat/completions';
      const headers = {
        'Authorization': `Bearer ${settings.openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://stackorbitai.com',
        'X-Title': 'StackOrbitAI Meeting Copilot'
      };
      const body = {
        model: settings.openrouterModel || 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      };
      const res = await this.postRequest(url, headers, body);
      return res.choices[0].message.content.trim();
    }

    // Default: Gemini
    const geminiKey = settings.geminiApiKey;
    if (!geminiKey) throw new Error('Gemini API Key is missing. Please add it in settings.');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`;
    const headers = { 'Content-Type': 'application/json' };
    const body = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7
      }
    };
    const res = await this.postRequest(url, headers, body);
    return res.candidates[0].content.parts[0].text.trim();
  }

  /**
   * Real-time translation helper
   */
  static async translateText(text: string, targetLanguage: string): Promise<string> {
    const systemPrompt = `You are a professional real-time translator. Translate the user's speech directly into language code "${targetLanguage}".
Provide a natural, colloquial, and accurate translation that sounds like a native speaker of that language in a meeting.
Do not provide any notes, preamble, or explanations. Respond with ONLY the translated text.`;
    return this.generateText(text, systemPrompt);
  }

  /**
   * Generates AI prompt enhancements (Prompt Studio)
   */
  static async enhancePrompt(prompt: string, systemPrompt: string): Promise<string> {
    return this.generateText(prompt, systemPrompt);
  }

  /**
   * Generates meeting suggestions based on transcript context, RAG knowledge, and user hints.
   * Returns 5 options with varied tones.
   */
  static async generateReplySuggestions(
    transcriptSnippet: string,
    contextInfo: string,
    userHints: string
  ): Promise<string[]> {
    const systemPrompt = `You are an expert AI meeting copilot. You help freelancers, developers, and consultants communicate confidently in real-time online meetings.
Given the current meeting conversation snippet, relevant project/client memory files context, and user steering hints, generate exactly 5 natural, professional reply suggestions for the user to say.
The 5 options MUST vary in tone and strategy:
Option 1 (Confident): Direct, assertive, and affirmative response showing capability.
Option 2 (Polite): Warm, accommodating, and courteous response.
Option 3 (Clarifying): Review-oriented response — asking for details, reviewing scope, or postponing slightly.
Option 4 (Strategic): Value-adding response — suggesting alternatives, mentioning tools/tech stacks, upselling expertise.
Option 5 (Casual): Friendly, relaxed, and conversational response that builds rapport.

Instructions:
- Keep suggestions short, natural, and conversational (1-2 sentences maximum per option).
- Actively incorporate the steering hints and client files context if relevant.
- If user hints say something specific, ALL 5 options should weave that theme in different ways.
- Return ONLY a JSON array containing exactly 5 suggestion strings. No formatting blocks, no markdown, no conversational text.
Example response:
[
  "Absolutely, I can deliver the full redesign by Friday with all requested features.",
  "Sure thing! I'd be happy to prioritize this and aim for a Friday delivery.",
  "Before I commit to Friday, could you confirm the final page list and any content changes?",
  "I can hit Friday if we keep the scope to the core 5 pages — any additions would push to Monday.",
  "Friday works for me! Let's lock it in and I'll send you a progress update mid-week."
]`;

    const userPrompt = `
=== CLIENT BRAIN FILES CONTEXT ===
${contextInfo || 'No files uploaded yet for this brain.'}

=== USER HINTS ===
${userHints || 'None provided.'}

=== RECENT MEETING TRANSCRIPT ===
${transcriptSnippet}

Generate the 5 options now in JSON list format:`;

    try {
      const responseText = await this.generateText(userPrompt, systemPrompt);
      
      // Clean possible markdown JSON wrappers (e.g. ```json ... ```)
      const cleanJson = responseText
        .replace(/^```json/i, '')
        .replace(/^```/, '')
        .replace(/```$/, '')
        .trim();

      const options = JSON.parse(cleanJson);
      if (Array.isArray(options) && options.length >= 5) {
        return options.slice(0, 5);
      }
      // Pad to 5 if fewer returned
      while (options.length < 5) {
        options.push("Let me think about that and get back to you.");
      }
      return options.slice(0, 5);
    } catch (err) {
      console.error('Failed to parse suggestions response, returning default fallbacks:', err);
      return [
        "Absolutely, I can handle that for you.",
        "Sure, I'd be happy to help with that!",
        "Could you clarify the exact deliverables you expect for this milestone?",
        "I can certainly handle that. I'll outline the steps in a quick summary after our call.",
        "Sounds good! Let me know the details and we'll get started."
      ];
    }
  }

  /**
   * Generates a final summary, action items, and decisions from the transcript
   */
  static async generateMeetingSummary(
    fullTranscript: string
  ): Promise<{ summary: string; actionItems: string[]; decisions: string[] }> {
    const systemPrompt = `You are an executive assistant. Your job is to analyze a full meeting transcript and draft a structured summary.
Return ONLY a valid JSON object matching the following structure:
{
  "summary": "A concise paragraph summarizing the meeting outcomes (3-4 sentences).",
  "actionItems": [
    "Action item 1 (with assignee if clear)",
    "Action item 2"
  ],
  "decisions": [
    "Key decision 1",
    "Key decision 2"
  ]
}
Do not write any markdown codeblocks or conversational text. Return ONLY the JSON object.`;

    const userPrompt = `=== FULL MEETING TRANSCRIPT ===\n${fullTranscript}\n\nGenerate summary JSON now:`;

    try {
      const responseText = await this.generateText(userPrompt, systemPrompt);
      const cleanJson = responseText
        .replace(/^```json/i, '')
        .replace(/^```/, '')
        .replace(/```$/, '')
        .trim();

      const parsed = JSON.parse(cleanJson);
      return {
        summary: parsed.summary || 'Meeting completed.',
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
        decisions: Array.isArray(parsed.decisions) ? parsed.decisions : []
      };
    } catch (err) {
      console.error('Failed to generate summary JSON:', err);
      return {
        summary: 'Meeting concluded and saved.',
        actionItems: ['Review meeting transcript.'],
        decisions: ['Meeting successfully transcribed.']
      };
    }
  }

  /**
   * Analyzes pasted chat text (Fiverr, email, meeting) and extracts structured intelligence.
   * Returns structured data to display + a context string to save into the brain RAG store.
   */
  static async analyzeChatAndExtract(chatText: string): Promise<{
    clientName: string;
    projectType: string;
    budget: string;
    timeline: string;
    keyTopics: string[];
    techStack: string[];
    sentiment: string;
    extractedContext: string;
  }> {
    const systemPrompt = `You are an expert business intelligence analyst for freelancers. You analyze raw chat conversations (from Fiverr, Upwork, email, or meetings) and extract structured actionable intelligence.

Return ONLY a valid JSON object matching this structure:
{
  "clientName": "Name of the client or 'Unknown' if not mentioned",
  "projectType": "Type of project discussed (e.g. WordPress website, Mobile app, AI automation, etc.)",
  "budget": "Budget mentioned or 'Not discussed'",
  "timeline": "Timeline/deadline mentioned or 'Not discussed'",
  "keyTopics": ["topic1", "topic2", "topic3"],
  "techStack": ["technology1", "technology2"],
  "sentiment": "positive / neutral / cautious / urgent",
  "extractedContext": "A comprehensive 3-5 sentence summary of the entire conversation capturing all important details, requirements, preferences, and any specific instructions the client gave. This should be rich enough to serve as context for future AI suggestions."
}

Instructions:
- Extract EVERY piece of useful information from the chat.
- keyTopics should capture the main themes discussed (deliverables, features, pain points).
- techStack should list any technologies, platforms, or tools mentioned.
- sentiment should reflect the client's overall tone.
- extractedContext should be a dense, information-rich summary suitable for RAG retrieval.
- Do not write any markdown codeblocks or conversational text. Return ONLY the JSON object.`;

    const userPrompt = `=== RAW CHAT / CONVERSATION ===\n${chatText}\n\nAnalyze and extract intelligence JSON now:`;

    try {
      const responseText = await this.generateText(userPrompt, systemPrompt);
      const cleanJson = responseText
        .replace(/^```json/i, '')
        .replace(/^```/, '')
        .replace(/```$/, '')
        .trim();

      const parsed = JSON.parse(cleanJson);
      return {
        clientName: parsed.clientName || 'Unknown',
        projectType: parsed.projectType || 'General',
        budget: parsed.budget || 'Not discussed',
        timeline: parsed.timeline || 'Not discussed',
        keyTopics: Array.isArray(parsed.keyTopics) ? parsed.keyTopics : [],
        techStack: Array.isArray(parsed.techStack) ? parsed.techStack : [],
        sentiment: parsed.sentiment || 'neutral',
        extractedContext: parsed.extractedContext || chatText.substring(0, 500)
      };
    } catch (err) {
      console.error('Failed to analyze chat:', err);
      return {
        clientName: 'Unknown',
        projectType: 'General',
        budget: 'Not discussed',
        timeline: 'Not discussed',
        keyTopics: [],
        techStack: [],
        sentiment: 'neutral',
        extractedContext: chatText.substring(0, 500)
      };
    }
  }

  /**
   * Transcribes and translates speech bytes natively using Gemini 3.5 structured output.
   */
  static async transcribeAndTranslateAudio(
    audioBase64: string,
    targetLanguage: string
  ): Promise<{ text: string; translation: string }> {
    const settings = this.getActiveSettings();
    const geminiKey = settings.geminiApiKey;
    if (!geminiKey) {
      throw new Error('Google Gemini API Key is missing. Please configure it in Settings.');
    }

    const model = 'gemini-3.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

    const systemPrompt = `You are a real-time speech translator for meetings.
Analyze the input audio clip (which is a buyer speaking English in a meeting).
1. Transcribe the spoken English text.
2. Translate that text directly into target language code "${targetLanguage}" (e.g. Hindi).
Respond with a JSON object ONLY match this structure:
{
  "text": "original English transcript",
  "translation": "translated text"
}
Do not write markdown or conversational text. Return only the raw JSON.`;

    const headers = { 'Content-Type': 'application/json' };
    const body = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'audio/webm',
                data: audioBase64
              }
            },
            {
              text: 'Transcribe and translate this audio clip now:'
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    };

    try {
      const res = await this.postRequest(url, headers, body);
      const resultText = res.candidates[0].content.parts[0].text.trim();
      const parsed = JSON.parse(resultText);
      return {
        text: parsed.text || '',
        translation: parsed.translation || ''
      };
    } catch (err) {
      console.error('Failed to transcribe and translate audio:', err);
      return {
        text: '',
        translation: ''
      };
    }
  }
}

