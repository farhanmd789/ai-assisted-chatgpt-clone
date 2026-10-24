import React, { useState, useEffect, useRef } from 'react';
import MarkdownRenderer from './components/MarkdownRenderer';

const WEBSOCKET_URL = "wss://backend.buildpicoapps.com/api/chatbot/chat";
const APP_ID = "begin-marriage";
const STORAGE_KEY = "farhugpt_chat_history_v1";
const DEFAULT_SYSTEM_PROMPT =
  "You are FarhuGPT, a highly capable, fast, and friendly AI assistant. You provide clean, well-structured responses using markdown formatting (headings, code blocks, bullet points) and default to concise answers.";

const createNewChatSession = () => ({
  id: crypto.randomUUID(),
  title: "New Chat",
  messages: [],
  createdAt: Date.now(),
});

const loadSavedChats = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Failed to load chat history:", e);
  }
  return [createNewChatSession()];
};

export default function App() {
  const [chats, setChats] = useState(loadSavedChats);
  const [activeChatId, setActiveChatId] = useState(() => chats[0]?.id);
  const [inputMessage, setInputMessage] = useState('');
  const [receiving, setReceiving] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showPromptConfig, setShowPromptConfig] = useState(false);

  const websocketRef = useRef(null);
  const chatboxRef = useRef(null);
  const textareaRef = useRef(null);

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    } catch (e) {
      console.error("Failed to persist chats:", e);
    }
  }, [chats]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [activeChat?.messages, receiving]);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    adjustTextareaHeight();
  };

  // Switch chat
  const handleSelectChat = (chatId) => {
    if (chatId === activeChatId) { setIsSidebarOpen(false); return; }
    if (websocketRef.current) { websocketRef.current.close(1000); setReceiving(false); }
    setActiveChatId(chatId);
    setIsSidebarOpen(false);
  };

  // New chat
  const handleNewChat = () => {
    if (websocketRef.current) { websocketRef.current.close(1000); setReceiving(false); }
    if (activeChat?.messages.length === 0) { setIsSidebarOpen(false); return; }
    const fresh = createNewChatSession();
    setChats((prev) => [fresh, ...prev]);
    setActiveChatId(fresh.id);
    setInputMessage('');
    setIsSidebarOpen(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  // Delete single chat
  const handleDeleteChat = (chatIdToDelete, e) => {
    e.stopPropagation();
    if (websocketRef.current && activeChatId === chatIdToDelete) {
      websocketRef.current.close(1000);
      setReceiving(false);
    }
    setChats((prev) => {
      const filtered = prev.filter((c) => c.id !== chatIdToDelete);
      if (filtered.length === 0) {
        const fresh = createNewChatSession();
        setActiveChatId(fresh.id);
        return [fresh];
      }
      if (activeChatId === chatIdToDelete) setActiveChatId(filtered[0].id);
      return filtered;
    });
  };

  // Clear all
  const handleClearAllHistory = () => {
    if (!window.confirm("Clear all chat history? This cannot be undone.")) return;
    if (websocketRef.current) { websocketRef.current.close(1000); setReceiving(false); }
    const fresh = createNewChatSession();
    setChats([fresh]);
    setActiveChatId(fresh.id);
    setInputMessage('');
    setIsSidebarOpen(false);
  };

  // WebSocket send + streaming
  const connectWebSocket = (messageText) => {
    setReceiving(true);
    if (websocketRef.current) websocketRef.current.close(1000);

    const currentChatId = activeChatId;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== currentChatId) return c;
        const isFirst = c.messages.length === 0;
        return {
          ...c,
          title: isFirst
            ? messageText.slice(0, 34) + (messageText.length > 34 ? '…' : '')
            : c.title,
          messages: [
            ...c.messages,
            { text: messageText, sender: 'user', timestamp: timeNow },
            { text: '', sender: 'bot', timestamp: timeNow },
          ],
        };
      })
    );

    const ws = new WebSocket(WEBSOCKET_URL);
    websocketRef.current = ws;

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({
        chatId: currentChatId,
        appId: APP_ID,
        systemPrompt,
        message: messageText,
      }));
    });

    ws.onmessage = (event) => {
      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== currentChatId) return c;
          const updated = [...c.messages];
          const last = updated.length - 1;
          if (last >= 0 && updated[last].sender === 'bot') {
            updated[last] = { ...updated[last], text: updated[last].text + event.data };
            return { ...c, messages: updated };
          }
          return c;
        })
      );
    };

    ws.onclose = (event) => {
      setReceiving(false);
      if (event.code !== 1000) {
        setChats((prev) =>
          prev.map((c) => {
            if (c.id !== currentChatId) return c;
            const updated = [...c.messages];
            const last = updated.length - 1;
            if (last >= 0 && updated[last].sender === 'bot') {
              const err = "Error connecting to server. Please try again.";
              updated[last] = {
                ...updated[last],
                text: updated[last].text ? `${updated[last].text}\n\n${err}` : err,
              };
              return { ...c, messages: updated };
            }
            return c;
          })
        );
      }
    };

    ws.onerror = (err) => console.error("WebSocket error:", err);
  };

  const handleSend = () => {
    if (!receiving && inputMessage.trim()) {
      const text = inputMessage.trim();
      setInputMessage('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      connectWebSocket(text);
    } else if (receiving && websocketRef.current) {
      websocketRef.current.close(1000);
      setReceiving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const samplePrompts = [
    { title: "Explain React hooks", desc: "useState, useEffect, custom hooks" },
    { title: "Debug JavaScript code", desc: "Find and fix errors fast" },
    { title: "Python vs JavaScript", desc: "Compare syntax and use-cases" },
    { title: "Write a REST API", desc: "Node.js / Express or FastAPI" },
  ];

  return (
    <div className="g-app">

      {/* ── Mobile Backdrop ── */}
      {isSidebarOpen && (
        <div
          className="g-backdrop"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ══ SIDEBAR ══ */}
      <aside className={`g-sidebar ${isSidebarOpen ? 'open' : ''}`}>

        {/* Header */}
        <div className="g-sidebar-top">
          <div className="g-brand">
            <div className="g-brand-icon">⚡</div>
            <span className="g-brand-name">FarhuGPT</span>
          </div>
          <button
            type="button"
            className="g-sidebar-close"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* New Chat */}
        <div className="g-sidebar-actions">
          <button
            id="new-chat-btn"
            type="button"
            className="g-new-chat-btn"
            onClick={handleNewChat}
          >
            <span className="g-plus-icon">+</span>
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat History */}
        <div className="g-history-section">
          <div className="g-history-label">Recent Chats ({chats.length})</div>
          <div className="g-history-list">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`g-history-item ${chat.id === activeChatId ? 'active' : ''}`}
                onClick={() => handleSelectChat(chat.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleSelectChat(chat.id)}
              >
                <div className="g-history-item-inner">
                  <span className="g-chat-icon">💬</span>
                  <span className="g-history-title" title={chat.title}>
                    {chat.title}
                  </span>
                </div>
                <button
                  type="button"
                  className="g-delete-btn"
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                  aria-label="Delete chat"
                  title="Delete chat"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="g-sidebar-footer">
          <button
            type="button"
            className="g-clear-all-btn"
            onClick={handleClearAllHistory}
          >
            Clear All History
          </button>
          <div className="g-status-pill">
            <span className={`g-status-dot ${receiving ? 'streaming' : ''}`} />
            <span>{receiving ? 'Streaming response…' : 'All devices ready'}</span>
          </div>
        </div>
      </aside>

      {/* ══ MAIN CONTENT ══ */}
      <main className="g-main">

        {/* Header */}
        <header className="g-navbar">
          <div className="g-nav-left">
            <button
              type="button"
              className="g-hamburger"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open chat history"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <div className="g-header-info">
              <h1 className="g-header-title">FarhuGPT</h1>
              <div className="g-header-status">
                <span className={`g-header-dot ${receiving ? 'active' : ''}`} />
                <span className={`g-header-status-text ${receiving ? 'streaming' : ''}`}>
                  {receiving ? 'Generating response…' : 'Online · Ready'}
                </span>
              </div>
            </div>
          </div>

          <div className="g-nav-right">
            <button
              type="button"
              className="g-nav-icon-btn"
              onClick={() => setShowPromptConfig((p) => !p)}
              title="Configure system prompt"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
              </svg>
              <span>Prompt</span>
            </button>

            <button
              type="button"
              className="g-new-chat-nav-btn"
              onClick={handleNewChat}
              title="Start new chat"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New Chat</span>
            </button>
          </div>
        </header>

        {/* System Prompt Panel */}
        {showPromptConfig && (
          <div className="g-prompt-panel">
            <div className="g-prompt-panel-header">
              <span>FarhuGPT System Prompt</span>
              <button
                type="button"
                className="g-reset-prompt-btn"
                onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
              >
                Reset to default
              </button>
            </div>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={2}
              className="g-prompt-textarea"
              placeholder="Configure FarhuGPT persona…"
            />
          </div>
        )}

        {/* ── Chat Messages ── */}
        <div id="chatbox" ref={chatboxRef} className="g-chatbox">
          {activeChat?.messages.length === 0 ? (

            /* Welcome screen */
            <div className="g-welcome">
              <div className="g-welcome-orb">⚡</div>
              <h2 className="g-welcome-heading">Welcome to FarhuGPT</h2>
              <p className="g-welcome-sub">
                Your fast, friendly AI companion. Tap any suggestion below or type your own question to get started.
              </p>
              <div className="g-suggestions-grid">
                {samplePrompts.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="g-suggestion-card"
                    onClick={() => connectWebSocket(s.title)}
                  >
                    <span className="g-suggestion-title">{s.title}</span>
                    <span className="g-suggestion-desc">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

          ) : (

            /* Message feed */
            <div className="g-message-stream">
              {activeChat.messages.map((msg, index) => {
                const isUser = msg.sender === 'user';
                const isLast = index === activeChat.messages.length - 1;
                const isStreaming = isLast && receiving && !isUser;

                return (
                  <div
                    key={index}
                    className={`g-msg-row ${isUser ? 'user-row' : 'bot-row'}`}
                  >
                    {/* Bot avatar */}
                    {!isUser && (
                      <div className="g-bot-avatar" title="FarhuGPT">⚡</div>
                    )}

                    <div className="g-bubble-wrap">
                      <div className={`g-bubble ${isUser ? 'user' : 'bot'}`}>
                        {isUser ? (
                          <span>{msg.text}</span>
                        ) : msg.text === '' && isStreaming ? (
                          <div className="g-typing-dots">
                            <span /><span /><span />
                          </div>
                        ) : (
                          <MarkdownRenderer
                            content={msg.text}
                            isStreaming={isStreaming}
                          />
                        )}
                      </div>

                      {msg.timestamp && (
                        <div className="g-timestamp">{msg.timestamp}</div>
                      )}
                    </div>

                    {/* User avatar */}
                    {isUser && (
                      <div className="g-user-avatar" title="You">👤</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Floating Input Dock ── */}
        <div className="g-input-dock">
          <div className="g-input-card">
            <textarea
              id="messageInput"
              ref={textareaRef}
              rows={1}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={receiving ? "FarhuGPT is thinking…" : "Message FarhuGPT…"}
              className="g-textarea"
              autoFocus
              aria-label="Message input"
            />

            <button
              id="sendButton"
              type="button"
              className={`g-send-btn ${receiving ? 'cancelling' : inputMessage.trim() ? 'ready' : ''}`}
              onClick={handleSend}
              disabled={!receiving && !inputMessage.trim()}
              aria-label={receiving ? "Cancel generation" : "Send message"}
              title={receiving ? "Stop generating" : "Send message"}
            >
              {receiving ? (
                /* Stop icon */
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="5" y="5" width="14" height="14" rx="3" />
                </svg>
              ) : (
                /* Send icon */
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>

          <div className="g-dock-caption">
            Enter to send · Shift+Enter for new line · History auto-saved
          </div>
        </div>

      </main>
    </div>
  );
}
