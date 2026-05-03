"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { languages } from '@/i18n/dictionaries';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `${t.welcome} ${t.appName}! How can I help you with your electoral queries today?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMsg }],
          language: languages[language]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 20px', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      <header className="text-center mb-6">
        <h1 className="text-navy mb-2">{t.chatTitle}</h1>
        <p>{t.chatDesc}</p>
      </header>

      <div className="glass-panel flex-col" style={{ flex: 1, overflow: 'hidden', maxWidth: '800px', margin: '0 auto', width: '100%', padding: '0' }}>

        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                padding: '1rem 1.5rem',
                borderRadius: 'var(--radius-lg)',
                background: msg.role === 'user' ? 'var(--saffron)' : 'var(--bg-main)',
                color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                border: msg.role === 'assistant' ? '1px solid var(--glass-border)' : 'none',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.5, color: 'inherit' }}>{msg.content}</p>
            </div>
          ))}
          {isLoading && (
            <div style={{ alignSelf: 'flex-start', padding: '1rem 1.5rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-lg)' }}>
              <span className="text-muted">AI is typing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: '1rem 2rem', borderTop: '1px solid var(--glass-border)', backgroundColor: 'var(--glass-bg)' }}>
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question here..."
              style={{
                flex: 1,
                padding: '1rem 1.5rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--glass-border)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-main)',
                outline: 'none',
                fontSize: '1rem'
              }}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !input.trim()}
              style={{ padding: '1rem 2rem' }}
            >
              Send
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
