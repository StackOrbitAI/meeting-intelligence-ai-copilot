import { app } from 'electron';
import path from 'path';
import fs from 'fs';

export interface AppSettings {
  openaiApiKey: string;
  geminiApiKey: string;
  claudeApiKey: string;
  customApiBaseUrl: string;
  customApiKey: string;
  customModel: string;
  activeProviderId: 'openai' | 'gemini' | 'claude' | 'custom';
  theme: 'light' | 'dark';
  targetLanguage: string;
  shortcut: string;
  autoCopy: boolean;
  autoReplace: boolean;
  launchAtStartup: boolean;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  isPreset?: boolean;
}

export interface ClientBrain {
  id: string;
  name: string;
  description: string;
  documents: Array<{
    id: string;
    filePath: string;
    fileName: string;
    fileType: string;
    uploadedAt: string;
    chunkCount: number;
  }>;
}

export interface MeetingTranscriptEntry {
  role: 'buyer' | 'user' | 'system';
  text: string;
  translation?: string;
  timestamp: string;
}

export interface MeetingRecord {
  id: string;
  brainId: string;
  brainName: string;
  title: string;
  date: string;
  duration: number; // in seconds
  transcript: MeetingTranscriptEntry[];
  summary: string;
  actionItems: string[];
  decisions: string[];
}

const PRESET_TEMPLATES: PromptTemplate[] = [
  {
    id: 'general',
    name: 'General AI',
    description: 'Enhances general prompts for clarity, structure, detail, and formatting.',
    systemPrompt: 'You are an expert prompt engineer. Your task is to rewrite and enhance the user\'s prompt to make it clear, detailed, and structured. Expand it to specify formatting guidelines, context, and goals, while preserving the user\'s original intent. Avoid preamble and return ONLY the enhanced prompt.',
    isPreset: true
  },
  {
    id: 'coding',
    name: 'Coding & Dev',
    description: 'Optimizes prompts for writing robust, clean, and documented code.',
    systemPrompt: 'You are a master software engineer and prompt optimizer. Rewrite the user\'s programming query to specify requirements for clean code, error handling, edge cases, performance, modularity, and inline comments. Direct the AI to explain the logic clearly. Return ONLY the enhanced prompt.',
    isPreset: true
  },
  {
    id: 'grammar',
    name: 'Grammar & Tone',
    description: 'Fixes grammar, styling, and adjusts writing to sound natural and native.',
    systemPrompt: 'You are a professional editor. Rewrite the user\'s message to correct any spelling, grammar, or phrasing errors. Make the tone flow naturally, sound native, and retain its core meaning. Do not write any explanations; return ONLY the revised text.',
    isPreset: true
  },
  {
    id: 'fiverr',
    name: 'Fiverr Client Response',
    description: 'Drafts or refines professional responses to potential freelance buyers.',
    systemPrompt: 'You are a top-rated freelancer. Help rewrite the response to a Fiverr client to sound highly professional, polite, helpful, and clear. Explicitly outline details regarding project deliverables, pricing, and timelines while maintaining a friendly tone. Return ONLY the final message.',
    isPreset: true
  },
  {
    id: 'proposal',
    name: 'Proposal Writing',
    description: 'Generates structured job proposals for Upwork/Fiverr requests.',
    systemPrompt: 'You are a business consultant. Write a high-converting project proposal based on the brief provided. Structure it with: 1) Understanding of requirements, 2) Proposed solution and tech stack, 3) Timeline and milestones, 4) Call to action. Keep it persuasive, professional, and concise.',
    isPreset: true
  }
];

const DEFAULT_SETTINGS: AppSettings = {
  openaiApiKey: '',
  geminiApiKey: '',
  claudeApiKey: '',
  customApiBaseUrl: '',
  customApiKey: '',
  customModel: '',
  activeProviderId: 'gemini',
  theme: 'dark',
  targetLanguage: 'hi', // Hindi default
  shortcut: 'CommandOrControl+Shift+E',
  autoCopy: true,
  autoReplace: false,
  launchAtStartup: true
};

export class StorageService {
  private static getUserDataPath(): string {
    try {
      return app.getPath('userData');
    } catch {
      // Fallback for scripts/testing environment
      return path.resolve(__dirname, '../../../');
    }
  }

  private static getFilePath(filename: string): string {
    const dir = this.getUserDataPath();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return path.join(dir, filename);
  }

  // --- Settings Management ---
  static getSettings(): AppSettings {
    const filePath = this.getFilePath('settings.json');
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(DEFAULT_SETTINGS, null, 2));
      return DEFAULT_SETTINGS;
    }
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(content) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  static updateSetting(key: keyof AppSettings, value: any): AppSettings {
    const settings = this.getSettings();
    (settings as any)[key] = value;
    const filePath = this.getFilePath('settings.json');
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2));
    return settings;
  }

  // --- Templates Management ---
  static getTemplates(): PromptTemplate[] {
    const filePath = this.getFilePath('templates.json');
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      return PRESET_TEMPLATES;
    }
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const customTemplates = JSON.parse(content) as PromptTemplate[];
      return [...PRESET_TEMPLATES, ...customTemplates];
    } catch {
      return PRESET_TEMPLATES;
    }
  }

  static addCustomTemplate(name: string, description: string, systemPrompt: string): PromptTemplate[] {
    const filePath = this.getFilePath('templates.json');
    const templates = this.getTemplates().filter(t => !t.isPreset);
    const newTemplate: PromptTemplate = {
      id: 'custom_' + Date.now(),
      name,
      description,
      systemPrompt,
      isPreset: false
    };
    templates.push(newTemplate);
    fs.writeFileSync(filePath, JSON.stringify(templates, null, 2));
    return [...PRESET_TEMPLATES, ...templates];
  }

  static updateCustomTemplate(id: string, name: string, description: string, systemPrompt: string): PromptTemplate[] {
    const filePath = this.getFilePath('templates.json');
    const templates = this.getTemplates().filter(t => !t.isPreset);
    const idx = templates.findIndex(t => t.id === id);
    if (idx !== -1) {
      templates[idx] = { ...templates[idx], name, description, systemPrompt };
      fs.writeFileSync(filePath, JSON.stringify(templates, null, 2));
    }
    return [...PRESET_TEMPLATES, ...templates];
  }

  static deleteCustomTemplate(id: string): PromptTemplate[] {
    const filePath = this.getFilePath('templates.json');
    const templates = this.getTemplates().filter(t => !t.isPreset && t.id !== id);
    fs.writeFileSync(filePath, JSON.stringify(templates, null, 2));
    return [...PRESET_TEMPLATES, ...templates];
  }

  // --- Brains Management ---
  static getBrains(): ClientBrain[] {
    const filePath = this.getFilePath('brains.json');
    if (!fs.existsSync(filePath)) {
      const defaultBrains: ClientBrain[] = [
        { id: 'john_smith', name: 'John Smith', description: 'Fiverr Client - WordPress project details', documents: [] },
        { id: 'abc_company', name: 'ABC Company', description: 'Direct Client - AI automation consulting', documents: [] }
      ];
      fs.writeFileSync(filePath, JSON.stringify(defaultBrains, null, 2));
      return defaultBrains;
    }
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as ClientBrain[];
    } catch {
      return [];
    }
  }

  static saveBrains(brains: ClientBrain[]) {
    const filePath = this.getFilePath('brains.json');
    fs.writeFileSync(filePath, JSON.stringify(brains, null, 2));
  }

  static createBrain(name: string, description: string): ClientBrain {
    const brains = this.getBrains();
    const newBrain: ClientBrain = {
      id: 'brain_' + Date.now(),
      name,
      description,
      documents: []
    };
    brains.push(newBrain);
    this.saveBrains(brains);
    return newBrain;
  }

  static updateBrain(id: string, name: string, description: string): ClientBrain[] {
    const brains = this.getBrains();
    const idx = brains.findIndex(b => b.id === id);
    if (idx !== -1) {
      brains[idx].name = name;
      brains[idx].description = description;
      this.saveBrains(brains);
    }
    return brains;
  }

  static deleteBrain(id: string): ClientBrain[] {
    const brains = this.getBrains().filter(b => b.id !== id);
    this.saveBrains(brains);
    
    // Also delete any vector data or documents saved for this brain locally
    const vectorPath = this.getFilePath(`vectors_${id}.json`);
    if (fs.existsSync(vectorPath)) {
      try {
        fs.unlinkSync(vectorPath);
      } catch (err) {
        console.error('Error deleting vector file:', err);
      }
    }
    return brains;
  }

  // --- Meeting Logs Management ---
  static getMeetings(): MeetingRecord[] {
    const filePath = this.getFilePath('meetings.json');
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      return [];
    }
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as MeetingRecord[];
    } catch {
      return [];
    }
  }

  static saveMeeting(record: MeetingRecord): MeetingRecord[] {
    const meetings = this.getMeetings();
    meetings.push(record);
    const filePath = this.getFilePath('meetings.json');
    fs.writeFileSync(filePath, JSON.stringify(meetings, null, 2));
    return meetings;
  }
}
