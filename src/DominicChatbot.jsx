import React, { useState, useEffect, useRef } from "react";

const WEBSOCKET_URL = "wss://backend.buildpicoapps.com/api/chatbot/chat";
const APP_ID = "begin-marriage";
const DEFAULT_SYSTEM_PROMPT =
  "You are Dominic Toretto, a street racer and skilled mechanic known for your loyalty to family and friends.";

export default function DominicChatbot() {
  // State management replacing DOM manipulation
  const [messages, setMessages] = useState([]); // Array of { text: string, sender: 'user' | 'bot' }
  const [inputValue, setInputValue] = useState("");
  const [receiving, setReceiving] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);

  // Refs for WebSocket, Chat ID, auto-scroll, and StrictMode guard
  const websocketRef = useRef(null);
  const chatIdRef = useRef(crypto.randomUUID());
  const chatboxRef = useRef(null);
  const hasInitializedRef = useRef(false);

  // Auto-scroll chatbox on message update
  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [messages]);

  // Connect to WebSocket and handle streaming messages
  const connectWebSocket = (message, initChat = false) => {
    setReceiving(true);

    // Close any existing active connection
    if (websocketRef.current) {
      websocketRef.current.close(1000);
    }

    // Append user message if not initial welcome trigger
    if (!initChat) {
      setMessages((prev) => [...prev, { text: message, sender: "user" }]);
    }

    // Append empty placeholder for incoming bot chunks
    setMessages((prev) => [...prev, { text: "", sender: "bot" }]);

    const ws = new WebSocket(WEBSOCKET_URL);
    websocketRef.current = ws;

    ws.addEventListener("open", () => {
      ws.send(
        JSON.stringify({
          chatId: chatIdRef.current,
          appId: APP_ID,
          systemPrompt: systemPrompt,
          message: initChat
            ? "A very short welcome message from Dominic Toretto"
            : message,
        })
      );
    });

    ws.onmessage = (event) => {
      // Append incoming streaming text chunks
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && updated[lastIndex].sender === "bot") {
          updated[lastIndex] = {
            ...updated[lastIndex],
            text: updated[lastIndex].text + event.data,
          };
          return updated;
        }
        return prev;
      });
    };

    ws.onclose = (event) => {
      setReceiving(false);
      if (event.code !== 1000) {
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].sender === "bot") {
            updated[lastIndex] = {
              ...updated[lastIndex],
              text:
                updated[lastIndex].text +
                "\n\nError getting response from server. Refresh the page and try again.",
            };
            return updated;
          }
          return prev;
        });
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  };

  // Welcome message on initial render
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      connectWebSocket("", true);
    }

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close(1000);
      }
    };
  }, []);

  // Send or cancel action
  const handleSend = () => {
    if (!receiving && inputValue.trim() !== "") {
      const messageText = inputValue.trim();
      setInputValue("");
      connectWebSocket(messageText, false);
    } else if (receiving && websocketRef.current) {
      websocketRef.current.close(1000);
      setReceiving(false);
    }
  };

  // Enter key trigger
  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !receiving &&
      inputValue.trim() !== ""
    ) {
      event.preventDefault();
      handleSend();
    }
  };

  // Clear chat action
  const handleClear = () => {
    if (websocketRef.current) {
      websocketRef.current.close(1000);
    }
    setReceiving(false);
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4 font-sans bg-gray-50">
      {/* Header with Clear button and prompt config */}
      <div className="flex justify-between items-center pb-3 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Dominic Toretto Chat</h2>
          <span className="text-xs text-gray-500">
            {receiving ? "🔴 Streaming response..." : "🟢 Connected"}
          </span>
        </div>
        <button
          id="clearButton"
          onClick={handleClear}
          className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition"
        >
          Clear Chat
        </button>
      </div>

      {/* Messages Container (chatbox) */}
      <div
        id="chatbox"
        ref={chatboxRef}
        className="flex-1 overflow-y-auto py-4 flex flex-col space-y-2"
      >
        {messages.map((msg, index) => {
          const isLeft = msg.sender === "bot";
          return (
            <div
              key={index}
              className={`inline-block my-2.5 p-2.5 rounded border max-w-[80%] whitespace-pre-wrap ${
                isLeft
                  ? "self-start bg-white border-gray-200 text-gray-800"
                  : "self-end bg-blue-200 border-blue-300 text-blue-900"
              }`}
            >
              {msg.text || (isLeft && receiving && index === messages.length - 1 ? "..." : "")}
            </div>
          );
        })}
      </div>

      {/* Input area */}
      <div className="flex gap-2 pt-2 border-t border-gray-200">
        <input
          id="messageInput"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 px-3 py-2 border rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          autoFocus
        />
        <button
          id="sendButton"
          onClick={handleSend}
          disabled={!receiving && inputValue.trim() === ""}
          className={`px-4 py-2 font-medium text-white rounded transition ${
            receiving
              ? "bg-amber-500 hover:bg-amber-600 cursor-pointer"
              : "bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
        >
          {receiving ? "Cancel" : "Ask Dom!"}
        </button>
      </div>
    </div>
  );
}
