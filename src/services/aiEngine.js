/**
 * AI Conversational Engine
 * - Session-based context awareness
 * - Markdown formatting (Headings, Bullet points, Numbered lists, Code blocks)
 * - Concise by default, expands on request
 * - Streaming responses with cancellation support
 */

// Knowledge base for instant, rich answers
const TOPIC_HANDLERS = [
  {
    keywords: ['react state', 'usestate', 'manage state', 'state in react'],
    response: () => `### Managing State in React

State allows React components to hold dynamic data that changes over time and triggers re-renders when updated.

#### 1. Basic useState Hook
\`\`\`jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(prev => prev + 1)}>
      Count: {count}
    </button>
  );
}
\`\`\`

#### Key Principles:
- **Never mutate state directly**: Always use the setter function or updater callback.
- **State updates are asynchronous**: React batches updates for performance.
- **Lift state up**: When sibling components need shared data, move state to their common parent.`
  },
  {
    keywords: ['useeffect', 'react lifecycle', 'side effect'],
    response: () => `### The \`useEffect\` Hook in React

\`useEffect\` lets you synchronize a component with external systems (APIs, subscriptions, DOM manipulation).

\`\`\`jsx
import { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      const res = await fetch(\`/api/users/\${userId}\`);
      const data = await res.json();
      if (!isCancelled) setUser(data);
    }

    loadData();

    // Cleanup function when component unmounts or userId changes
    return () => {
      isCancelled = true;
    };
  }, [userId]); // Dependency array

  return <div>{user ? user.name : 'Loading...'}</div>;
}
\`\`\`

#### Dependency Guidelines:
1. **Empty array \`[]\`**: Runs once after initial mount.
2. **With values \`[a, b]\`**: Runs on mount and whenever \`a\` or \`b\` changes.
3. **No array**: Runs after every render (use cautiously).`
  },
  {
    keywords: ['center a div', 'center div', 'css center'],
    response: () => `### Centering a \`div\` in CSS

Here are the two cleanest and most modern methods:

#### Method 1: Flexbox (Recommended)
\`\`\`css
.parent {
  display: flex;
  justify-content: center; /* Horizontal */
  align-items: center;     /* Vertical */
  height: 100vh;           /* Or any parent height */
}
\`\`\`

#### Method 2: CSS Grid (Most Concise)
\`\`\`css
.parent {
  display: grid;
  place-items: center;
  height: 100vh;
}
\`\`\`

Both methods center child elements both vertically and horizontally without fixed dimensions.`
  },
  {
    keywords: ['async await', 'promise', 'promises in javascript', 'asynchronous javascript'],
    response: () => `### Async/Await in JavaScript

\`async/await\` is syntactic sugar on top of Promises, making asynchronous code read synchronously.

\`\`\`javascript
async function fetchUserData(userId) {
  try {
    const response = await fetch(\`https://api.example.com/users/\${userId}\`);
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch failed:', error.message);
    throw error;
  }
}
\`\`\`

#### Rules to Remember:
- Any function marked \`async\` always returns a Promise.
- \`await\` pauses execution until the Promise resolves or rejects.
- Always wrap in \`try...catch\` to handle network or runtime errors gracefully.`
  },
  {
    keywords: ['git undo', 'undo commit', 'git reset', 'git revert'],
    response: () => `### Undoing Commits in Git

Choose the command based on whether you've already pushed to a remote repository:

#### 1. Undo local commit (Keep code changes)
\`\`\`bash
git reset --soft HEAD~1
\`\`\`
*Your changes remain staged in your working directory.*

#### 2. Undo local commit (Discard all changes)
\`\`\`bash
git reset --hard HEAD~1
\`\`\`
*Caution: This permanently deletes changes from that commit.*

#### 3. Already pushed to shared branch (Safe for teams)
\`\`\`bash
git revert <commit-hash>
git push origin <branch-name>
\`\`\`
*Creates a new commit that inverts the previous commit's changes.*`
  },
  {
    keywords: ['python list comprehension', 'list comprehension'],
    response: () => `### Python List Comprehensions

List comprehensions provide a concise way to create lists from existing iterables.

#### Syntax:
\`[expression for item in iterable if condition]\`

#### Examples:
\`\`\`python
# 1. Squares of numbers
numbers = [1, 2, 3, 4, 5]
squares = [n ** 2 for n in numbers]
# Output: [1, 4, 9, 16, 25]

# 2. Filter even numbers only
evens = [n for n in numbers if n % 2 == 0]
# Output: [2, 4]

# 3. String transformation
words = ["react", "vite", "javascript"]
capitalized = [w.capitalize() for w in words]
# Output: ['React', 'Vite', 'Javascript']
\`\`\`

#### Why use it?
- More readable than \`map()\` and \`filter()\`
- Faster than standard \`for\` loops with \`.append()\``
  }
];

/**
 * Check if the prompt is asking to expand on the previous message
 */
function isExpansionPrompt(prompt) {
  const clean = prompt.toLowerCase().trim();
  return (
    clean.includes('explain more') ||
    clean.includes('more detail') ||
    clean.includes('elaborate') ||
    clean.includes('expand') ||
    clean.includes('give more') ||
    clean.includes('tell me more') ||
    clean.includes('deep dive') ||
    clean.includes('in depth')
  );
}

/**
 * Generate response based on current input and session history
 */
export function generateLocalResponse(prompt, history = []) {
  const p = prompt.trim();
  const lower = p.toLowerCase();

  // 1. Check for single character or ambiguous inputs
  if (p.length < 3 && !['hi', 'js', 'ui', 'go'].includes(lower)) {
    return `Could you please clarify what you would like to know about **${p}**? I'd be happy to explain in detail.`;
  }

  // 2. Greetings
  if (['hi', 'hello', 'hey', 'greetings', 'good morning', 'good evening'].includes(lower)) {
    return `Hello! How can I assist you with your coding or technical questions today?`;
  }

  // 3. Expansion request (Context aware)
  if (isExpansionPrompt(p) && history.length > 0) {
    const lastAssistantMsg = [...history].reverse().find(m => m.role === 'assistant');
    if (lastAssistantMsg) {
      return `### In-Depth Deep Dive

Building directly on our previous discussion:

#### Core Architectural Nuances
1. **Performance Considerations**:
   - Minimize unnecessary re-computations by memoizing expensive operations.
   - Batch DOM updates or I/O calls to avoid layout thrashing.
2. **Edge Cases to Watch**:
   - Handling unexpected \`null\` or \`undefined\` inputs defensively.
   - Race conditions in asynchronous event listeners.
3. **Production Best Practices**:
   - Write comprehensive unit tests for business logic.
   - Profile memory usage during long-running sessions.

Would you like a full code implementation or benchmark comparison?`;
    }
  }

  // 4. Follow-up detection (referencing previous context)
  if (lower.startsWith('why') || lower.startsWith('how so') || lower.includes('example in')) {
    const lastAssistantMsg = [...history].reverse().find(m => m.role === 'assistant');
    if (lastAssistantMsg) {
      if (lower.includes('example in python')) {
        return `### Python Implementation

Here is how that concept translates to Python:

\`\`\`python
class Solution:
    def execute(self, payload: dict) -> dict:
        # Validate inputs
        if not payload:
            raise ValueError("Payload cannot be empty")
        
        # Process and return transformed result
        return {k: v for k, v in payload.items() if v is not None}

# Usage
client = Solution()
result = client.execute({"name": "Chatbot", "active": True, "archived": None})
print(result) # {'name': 'Chatbot', 'active': True}
\`\`\``;
      }

      if (lower.includes('example in') || lower.includes('javascript') || lower.includes('js')) {
        return `### JavaScript Implementation

Here is the equivalent implementation in modern JavaScript:

\`\`\`javascript
export function processPayload(payload = {}) {
  if (!payload || Object.keys(payload).length === 0) {
    throw new Error('Payload cannot be empty');
  }

  // Clean and filter entries
  return Object.entries(payload).reduce((acc, [key, val]) => {
    if (val !== null && val !== undefined) {
      acc[key] = val;
    }
    return acc;
  }, {});
}
\`\`\``;
      }
    }
  }

  // 5. Match predefined topic handlers
  for (const handler of TOPIC_HANDLERS) {
    if (handler.keywords.some(kw => lower.includes(kw))) {
      return handler.response();
    }
  }

  // 6. Programming language / coding requests
  if (lower.includes('function') || lower.includes('write a script') || lower.includes('code') || lower.includes('create a')) {
    return `### Solution

Here is a clean, modular solution for your request:

\`\`\`javascript
/**
 * Executes the requested task efficiently
 * @param {Object} options - Configuration parameters
 * @returns {Promise<Object>} Formatted output
 */
export async function executeTask(options = {}) {
  const { timeout = 5000, retries = 3 } = options;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Core logic implementation
      return { success: true, timestamp: Date.now() };
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise(res => setTimeout(res, 500 * attempt));
    }
  }
}
\`\`\`

#### Key Highlights:
- **Resilience**: Implements progressive retry backoff.
- **Configurable**: Exposes timeout and attempt limits.
- **Async/Await**: Clean promise-based error bubbling.`;
  }

  // 7. General concept explanation (concise default with structure)
  return `### ${capitalize(p)}

Here is a clear and concise overview:

- **Definition**: It represents a fundamental concept designed to solve specific workflow or architectural challenges efficiently.
- **Primary Benefit**: Simplifies complexity, promotes maintainability, and prevents common design errors.
- **Implementation**: Typically integrated into the core application layer through modular components or pure helper functions.

*Would you like a code example or a deeper explanation of any specific aspect?*`;
}

function capitalize(str) {
  if (!str) return 'Overview';
  return str.charAt(0).toUpperCase() + str.slice(1, 40);
}

/**
 * Stream response generator that streams words smoothly to simulate real-time LLM typing
 */
export async function streamAIResponse({
  prompt,
  history,
  onChunk,
  signal,
  customApiKey = null,
  model = 'built-in'
}) {
  // If custom API key is supplied, attempt live fetch, else fallback to instant local engine
  if (customApiKey && customApiKey.trim().length > 10) {
    try {
      await streamFromCustomLLM({ prompt, history, onChunk, signal, apiKey: customApiKey, model });
      return;
    } catch (err) {
      console.warn('Custom LLM API call failed, falling back to local engine:', err);
    }
  }

  const fullText = generateLocalResponse(prompt, history);
  const words = fullText.split(' ');
  let accumulated = '';

  for (let i = 0; i < words.length; i++) {
    if (signal?.aborted) {
      break;
    }

    accumulated += (i === 0 ? '' : ' ') + words[i];
    onChunk(accumulated);

    // Dynamic typing delay: slightly longer on punctuation for natural cadence
    const word = words[i];
    const isPunctuation = word.endsWith('.') || word.endsWith('\n') || word.endsWith(':');
    const delay = isPunctuation ? 35 : 18;

    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

/**
 * Optional Live LLM streaming if user provides their key
 */
async function streamFromCustomLLM({ prompt, history, onChunk, signal, apiKey }) {
  // OpenAI compatible chat completion endpoint
  const messages = [
    {
      role: 'system',
      content: 'You are a fast, friendly, and professional AI coding assistant running inside a React chat interface. Provide clean, concise markdown answers with headings, bullet points, and code blocks. Expand only when asked.'
    },
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: prompt }
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      stream: true
    }),
    signal
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));

    for (const line of lines) {
      const dataStr = line.replace('data: ', '').trim();
      if (dataStr === '[DONE]') break;

      try {
        const json = JSON.parse(dataStr);
        const token = json.choices[0]?.delta?.content || '';
        accumulated += token;
        onChunk(accumulated);
      } catch (e) {
        // ignore parse error on partial chunks
      }
    }
  }
}
