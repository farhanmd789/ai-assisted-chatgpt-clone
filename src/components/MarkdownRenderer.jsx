import React from 'react';
import { marked } from 'marked';
import CodeBlock from './CodeBlock';

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
});

export default function MarkdownRenderer({ content, isStreaming = false }) {
  if (!content) {
    return isStreaming ? <span className="streaming-cursor" /> : null;
  }

  // Split content by fenced code blocks (```language ... ```)
  // This allows us to render interactive CodeBlock components with copy buttons
  const codeBlockRegex = /```([a-zA-Z0-9_\-+]*)\n([\s\S]*?)```/g;
  
  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore.trim()) {
      segments.push({ type: 'markdown', content: textBefore });
    }
    segments.push({
      type: 'code',
      language: match[1] || 'text',
      code: match[2].replace(/\n$/, ''),
    });
    lastIndex = match.index + match[0].length;
  }

  const remainingText = content.substring(lastIndex);
  if (remainingText) {
    // Check if there's an unclosed code block during active streaming
    const unclosedCodeMatch = remainingText.match(/```([a-zA-Z0-9_\-+]*)\n([\s\S]*)$/);
    if (unclosedCodeMatch) {
      const textBefore = remainingText.substring(0, unclosedCodeMatch.index);
      if (textBefore.trim()) {
        segments.push({ type: 'markdown', content: textBefore });
      }
      segments.push({
        type: 'code',
        language: unclosedCodeMatch[1] || 'text',
        code: unclosedCodeMatch[2],
      });
    } else {
      segments.push({ type: 'markdown', content: remainingText });
    }
  }

  return (
    <div className="markdown-body">
      {segments.map((segment, index) => {
        if (segment.type === 'code') {
          return (
            <CodeBlock
              key={`code-${index}`}
              language={segment.language}
              code={segment.code}
            />
          );
        }

        // Render formatted markdown safely
        const html = marked.parse(segment.content);
        return (
          <div
            key={`md-${index}`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
      {isStreaming && <span className="streaming-cursor" />}
    </div>
  );
}
