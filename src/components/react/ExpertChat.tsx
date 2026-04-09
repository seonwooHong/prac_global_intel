import React, { useState, useCallback, useRef, useEffect } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ExpertChatProps {
  /** Whether the chat body is expanded. */
  defaultExpanded?: boolean;
  /** Chat message history. */
  messages?: ChatMessage[];
  /** Status text shown in the footer. */
  statusText?: string;
  /** Called when the user sends a message. */
  onSendMessage?: (text: string) => void;
  /** Called when the user clicks "Analyze Market". */
  onAnalyzeMarket?: () => void;
  /** Called when the user clicks "Plan a trade". */
  onPlanTrade?: () => void;
  /** Optional className */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const ExpertChat: React.FC<ExpertChatProps> = ({
  defaultExpanded = true,
  messages = [],
  statusText = 'Operational',
  onSendMessage,
  onAnalyzeMarket,
  onPlanTrade,
  className,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* auto-scroll to bottom on new messages */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSendMessage?.(trimmed);
    setInput('');
  }, [input, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') handleSend();
    },
    [handleSend],
  );

  return (
    <div className={`expert-chat${className ? ' ' + className : ''}`}>
      {/* Header */}
      <div className="expert-header" onClick={() => setExpanded((v) => !v)}>
        <span className="expert-icon">{'\u2699'}</span>
        <span className="expert-title">Expert Mode</span>
        <span className="expert-chevron">{expanded ? '\u25BE' : '\u25B8'}</span>
      </div>

      {/* Body */}
      {expanded && (
        <div className="expert-body">
          <div className="expert-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`expert-message expert-message-${msg.role}`}>
                {msg.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="expert-actions">
            <button className="expert-action-btn" onClick={onAnalyzeMarket}>
              <span className="expert-action-icon">{'\uD83D\uDCCA'}</span> Analyze Market
            </button>
            <button className="expert-action-btn" onClick={onPlanTrade}>
              <span className="expert-action-icon">{'\u2728'}</span> Plan a trade
            </button>
          </div>

          <div className="expert-input-row">
            <input
              type="text"
              className="expert-input"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="expert-send-btn" onClick={handleSend}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="expert-footer">
        <span className="expert-status-dot" />
        <span className="expert-status-text">{statusText}</span>
      </div>
    </div>
  );
};
