# ? FarhuGPT — AI-Assisted ChatGPT Clone

> A fast, modern, full-featured AI chat interface built with **React + Vite**, powered by real-time WebSocket streaming.

![FarhuGPT](https://img.shields.io/badge/FarhuGPT-AI%20Chatbot-6366f1?style=for-the-badge&logo=openai&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## ? Features

- ?? **Real-time Streaming** — WebSocket-based token-by-token streaming responses
- ?? **Multi-Session Chat** — Create, switch, and delete multiple independent chat threads
- ?? **Persistent History** — All conversations auto-saved to `localStorage`
- ??? **Configurable System Prompt** — Customize the AI persona on the fly
- ?? **Markdown Rendering** — Full support for headings, bullet points, and syntax-highlighted code blocks
- ?? **Typing Indicators** — Animated dots while awaiting the first response token
- ?? **Cancelable Generation** — Stop any streaming response mid-flight
- ?? **Responsive Design** — Mobile-first layout with slide-in sidebar
- ?? **Dual AI Engine** — Instant local knowledge base + optional OpenAI API key support
- ?? **Suggestion Cards** — Pre-built prompts on the welcome screen to get started fast

---

## ??? Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 |
| **Build Tool** | Vite 8 |
| **Styling** | Vanilla CSS (custom design system) |
| **Markdown** | `marked` |
| **AI Backend** | WebSocket (buildpicoapps) + Optional OpenAI API |
| **Linting** | oxlint |
| **Storage** | Browser `localStorage` |

---

## ?? Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm v9+

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/farhanmd789/ai-assisted-chatgpt-clone.git
cd ai-assisted-chatgpt-clone

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

## ?? Project Structure

```
ai-chatbot/
+-- public/
¦   +-- favicon.svg
¦   +-- icons.svg
+-- src/
¦   +-- assets/
¦   ¦   +-- hero.png
¦   +-- components/
¦   ¦   +-- CodeBlock.jsx        # Syntax-highlighted code block renderer
¦   ¦   +-- MarkdownRenderer.jsx # Converts markdown strings to React elements
¦   +-- services/
¦   ¦   +-- aiEngine.js          # Local AI engine + OpenAI streaming adapter
¦   +-- App.jsx                  # Main chat application (FarhuGPT)
¦   +-- DominicChatbot.jsx       # Alternate persona chatbot (Dominic Toretto)
¦   +-- App.css                  # Component styles
¦   +-- index.css                # Global design system & tokens
¦   +-- main.jsx                 # React entry point
+-- index.html
+-- vite.config.js
+-- package.json
```

---

## ?? AI Engine

FarhuGPT uses a **dual-layer AI system**:

1. **WebSocket Backend** (default) — Streams responses in real-time via `wss://backend.buildpicoapps.com/api/chatbot/chat`. No API key required.

2. **Local Knowledge Base** — Instant, markdown-rich responses for common developer topics:
   - React hooks (`useState`, `useEffect`)
   - Async/Await & Promises
   - Git commands
   - CSS centering
   - Python list comprehensions

3. **OpenAI API** (optional) — Provide your own `gpt-4o-mini` key in `aiEngine.js` for live, unconstrained responses.

---

## ?? Configuration

### Changing the System Prompt

Click the **? Prompt** button in the top-right navbar to open the system prompt panel. Customize the AI persona without touching any code. Click **Reset to default** to restore the original FarhuGPT persona.

### Using a Custom OpenAI API Key

In `src/services/aiEngine.js`, pass your API key to `streamAIResponse`:

```js
streamAIResponse({
  prompt: "...",
  history: [],
  onChunk: (text) => console.log(text),
  customApiKey: "sk-...",
  model: "gpt-4o-mini"
});
```

---

## ?? UI Highlights

- Dark glassmorphism sidebar with chat history list
- Animated pulsing status dot during streaming
- Auto-resizing textarea input (up to 150px)
- Smooth message bubble entrance animations
- Typing dots placeholder before the first token arrives
- Mobile backdrop overlay for the slide-in sidebar

---

## ?? Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run oxlint code linter |

---

## ?? Acknowledgements

- Streaming backend powered by [BuildPicoApps](https://buildpicoapps.com)
- Markdown parsing via [marked](https://marked.js.org/)
- Built with [Vite](https://vitejs.dev/) + [React](https://react.dev/)

---

## ?? License

This project is licensed under the **MIT License**.

---

Made  by [farhanmd789](https://github.com/farhanmd789)
