# ⚡ FarhuGPT — AI-Assisted ChatGPT Clone

> A fast, modern, full-featured AI chat interface built with **React + Vite**, powered by real-time WebSocket streaming.

![FarhuGPT](https://img.shields.io/badge/FarhuGPT-AI%20Chatbot-6366f1?style=for-the-badge&logo=openai&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## ✨ Features

- 🔴 **Real-time Streaming** — WebSocket-based token-by-token streaming responses
- 💬 **Multi-Session Chat** — Create, switch, and delete multiple independent chat threads
- 💾 **Persistent History** — All conversations auto-saved to `localStorage`
- 🎛️ **Configurable System Prompt** — Customize the AI persona on the fly
- ✍️ **Markdown Rendering** — Full support for headings, bullet points, and syntax-highlighted code blocks
- ⌨️ **Typing Indicators** — Animated dots while awaiting the first response token
- 🛑 **Cancelable Generation** — Stop any streaming response mid-flight
- 📱 **Responsive Design** — Mobile-first layout with slide-in sidebar
- 🤖 **Dual AI Engine** — Instant local knowledge base + optional OpenAI API key support
- 💡 **Suggestion Cards** — Pre-built prompts on the welcome screen to get started fast

---

## 🛠️ Tech Stack

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

## 🚀 Getting Started

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
