# StackOrbitAI Meeting Intelligence & AI Copilot

An enterprise-grade, cross-platform AI desktop application designed for freelancers, agencies, consultants, and developers. It serves as a universal meeting assistant, prompt engineering hub, and translation copilot backed by a personal local RAG (Retrieval-Augmented Generation) memory system. 

It is specifically optimized to help non-native English speakers communicate confidently and professionally during live client calls (on Zoom, Google Meet, Microsoft Teams) and chat platforms (Fiverr, Upwork, WhatsApp).

---

## 🌟 Key Features

### 1. Live Meeting Intelligence (Voice Copilot)
* **Real-Time Captions**: Listens to meeting audio and transcribes conversation live.
* **Hindi Translation & Subtitles**: Translates the client's spoken English into Hindi on the fly, allowing you to easily understand their points.
* **Context-Aware Suggestions**: Generates 3 natural English reply suggestions based on the context of the meeting and the client's history.
* **Steering Hint Bar**: Enter hints in Hindi or broken English (e.g., *"Bol ki hum Monday ko start karenge"*) to guide the AI to regenerate matching replies.
* **Auto-Keyword Tag Pills**: Extracts key project entities (e.g., `WordPress`, `Database`, `AdSense`) from the client's speech. Click them to immediately add them to your steering hints.
* **AI Summary Reports**: After a meeting concludes, it generates an AI report featuring an **Outcomes Summary**, **Action Items list**, and **Key Decisions**.
* **Exports**: Download full meeting transcripts as `.txt` files and AI Summary Reports as Markdown (`.md`) files.

### 2. Client Brains Manager (Personal Local RAG)
* **Custom Brains**: Create dedicated knowledge databases for individual clients (e.g., *"Fiverr Client: John"*).
* **Chat Logs Indexing**: Upload previous Fiverr/Upwork chat histories, project briefs, or contracts.
* **RAG System**: The app indexes files locally into a vector store. The AI uses this context during live meetings to suggest replies matching past pricing, agreements, or requirements.

### 3. Writing Assistant (Professional Translator & Refiner)
* **Rough Input Refinement**: Enter rough ideas, bullet points, or raw Hindi text.
* **Formatting Templates**:
  * **Client Message Response**: Translates and writes polished, professional English client replies.
  * **Tech-to-Layman Explainer**: Simplifies complex technical jargon into easy-to-understand explanations.
  * **Pitch & Proposal**: Crafts persuasive pitches for project bids.
  * **Grammar & Style**: Audits and elevates your written text.

### 4. Global Prompt Studio & Glass HUD Overlay
* **Prompt Studio**: Create, edit, and organize custom system prompt templates.
* **Global HUD Overlay**: Press `Ctrl + Shift + E` globally in any app (browser, WhatsApp, Fiverr chat). A transparent glassmorphic overlay pops up to read, rewrite, and paste back professional English responses automatically.

---

## 🛠️ Technology Stack
* **Frontend**: React, TypeScript, Vite
* **Backend (Main Process)**: Electron, Node.js, `tsup` (Compilation)
* **Styling**: Premium Vanilla CSS (Glassmorphism, custom dark palettes, and responsive flex/grid layouts)
* **Icons**: Lucide React
* **Speech Engine**: Web Speech API (Speech Recognition)

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **npm** (comes with Node.js)

### Installation
1. Clone this repository:
   ```bash
   git clone https://github.com/StackOrbitAI/stackorbitai-meeting-copilot.git
   cd stackorbitai-meeting-copilot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development Mode
To launch the frontend dev server and the Electron application in watch mode (with hot-reloading active):
```bash
npm run dev
```

### Production Build
To package the app for distribution (Windows, macOS, Linux):
```bash
npm run build
```

---

## 🔒 Security & Privacy First
* **Offline-First Storage**: Your client data, meeting histories, and Brain documents are stored locally on your machine.
* **API Key Protection**: Your LLM keys are saved securely in your local storage configuration and are never sent to external servers.

---

## 📝 License
Distributed under the MIT License. See `LICENSE` for more information.
