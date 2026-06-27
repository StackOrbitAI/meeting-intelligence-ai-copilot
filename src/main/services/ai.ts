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

    // Default: Gemini
    const geminiKey = settings.geminiApiKey;
    if (!geminiKey) throw new Error('Gemini API Key is missing. Please add it in settings.');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
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
   * Generates meeting suggestions based on transcript context, RAG knowledge, and user hints
   */
  static async generateReplySuggestions(
    transcriptSnippet: string,
    contextInfo: string,
    userHints: string
  ): Promise<string[]> {
    const systemPrompt = `You are an expert AI meeting copilot. You help freelancers, developers, and consultants communicate confidently in real-time online meetings.
Given the current meeting conversation snippet, relevant project/client memory files context, and user steering hints, generate exactly 3 natural, professional reply suggestions for the user to say.
The options should vary in tone and strategy:
Option 1: Direct, polite, and affirmative response.
Option 2: Review-oriented or clarifying response (asking for details, reviewing scope first, postponing slightly).
Option 3: Strategic or value-adding response (suggesting alternatives, mentioning tools/tech stacks, providing extra consulting).

Instructions:
- Keep suggestions short, natural, and conversational (1-2 sentences maximum per option).
- Actively incorporate the steering hints and client files context if relevant.
- Return ONLY a JSON array containing the three suggestions strings. No formatting blocks, no markdown, no conversational text.
Example response:
[
  "Yes, I can deliver it within three days.",
  "I'll review the project scope first and confirm whether a three-day delivery is feasible.",
  "I can complete it in three days if the requirements remain unchanged."
]`;

    const userPrompt = `
=== CLIENT BRAIN FILES CONTEXT ===
${contextInfo || 'No files uploaded yet for this brain.'}

=== USER HINTS ===
${userHints || 'None provided.'}

=== RECENT MEETING TRANSCRIPT ===
${transcriptSnippet}

Generate the 3 options now in JSON list format:`;

    try {
      const responseText = await this.generateText(userPrompt, systemPrompt);
      
      // Clean possible markdown JSON wrappers (e.g. ```json ... ```)
      const cleanJson = responseText
        .replace(/^```json/i, '')
        .replace(/^```/, '')
        .replace(/```$/, '')
        .trim();

      const options = JSON.parse(cleanJson);
      if (Array.isArray(options) && options.length >= 3) {
        return options.slice(0, 3);
      }
      return [options[0] || '', options[1] || '', options[2] || ''];
    } catch (err) {
      console.error('Failed to parse suggestions response, returning default fallbacks:', err);
      return [
        "Let me double-check those details and get back to you shortly.",
        "Could you clarify the exact deliverables you expect for this milestone?",
        "I can certainly handle that. I'll outline the steps in a quick summary after our call."
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
}
