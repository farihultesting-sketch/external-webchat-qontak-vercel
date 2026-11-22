'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';

interface LiveMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [chatMode, setChatMode] = useState<'ai' | 'connecting' | 'agent'>('ai');
  const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([]);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    setSessionId(
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `sess-${Math.random().toString(36).slice(2, 11)}`
    );
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status } = useChat();
  const isLoading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveMessages, isLoading, chatMode]);

  // Polling balasan agen & status resolve dari Qontak setiap 2 detik saat mode 'agent'
  useEffect(() => {
    if (chatMode !== 'agent' || !sessionId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/poll?sessionId=${sessionId}`);
        if (!res.ok) return;

        const data = await res.json();

        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setLiveMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newFromAgent: LiveMessage[] = data.messages
              .filter((m: { id: string }) => !existingIds.has(m.id))
              .map((m: { id: string; text: string }) => ({
                id: m.id,
                sender: 'agent' as const,
                text: m.text,
              }));

            return newFromAgent.length > 0 ? [...prev, ...newFromAgent] : prev;
          });
        }

        if (data.resolved) {
          setChatMode('ai');
          setLiveMessages((prev) => [
            ...prev,
            {
              id: `sys-resolved-${Date.now()}`,
              sender: 'system',
              text: 'Sesi dengan agen telah selesai. Anda kembali terhubung dengan Asisten Virtual.',
            },
          ]);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [chatMode, sessionId]);

  // Handover langsung ke API Qontak melalui backend Next.js
  const handleHandoverToAgent = async () => {
    if (chatMode !== 'ai' || !sessionId) return;
    setChatMode('connecting');

    const historySummary =
      messages.length > 0
        ? messages
            .map((m) => {
              const roleLabel = m.role === 'user' ? 'Pelanggan' : 'AI';
              const text = m.parts
                .map((p) => (p.type === 'text' ? p.text : ''))
                .join('');
              return `${roleLabel}: ${text}`;
            })
            .join('\n')
        : '';

    try {
      const res = await fetch('/api/handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, historySummary }),
      });

      if (res.ok) {
        setChatMode('agent');
        setLiveMessages((prev) => [
          ...prev,
          {
            id: `sys-connected-${Date.now()}`,
            sender: 'system',
            text: 'Terhubung dengan layanan pelanggan. Silakan tulis pesan Anda.',
          },
          {
            id: `user-init-${Date.now()}`,
            sender: 'user',
            text: 'Halo, saya ingin terhubung dengan agen.',
          },
        ]);
      } else {
        setChatMode('ai');
        setLiveMessages((prev) => [
          ...prev,
          {
            id: `sys-err-${Date.now()}`,
            sender: 'system',
            text: 'Gagal terhubung ke layanan agen. Silakan coba beberapa saat lagi.',
          },
        ]);
      }
    } catch (error) {
      console.error('Handover gagal:', error);
      setChatMode('ai');
    }
  };

  // Kirim pesan ke AI atau ke Qontak API tergantung mode aktif
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    if (chatMode === 'ai') {
      if (isLoading) return;
      sendMessage({ text: trimmed });
      setInput('');
      return;
    }

    if (chatMode === 'agent') {
      setInput('');
      setLiveMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          sender: 'user',
          text: trimmed,
        },
      ]);

      await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, text: trimmed }),
      });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 h-[480px] bg-white border border-zinc-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-zinc-900 text-white px-4 py-3.5 flex justify-between items-center gap-2">
            <div>
              <h3 className="font-semibold text-sm">
                {chatMode === 'agent' ? 'Customer Support' : 'Asisten Virtual'}
              </h3>
              <p className="text-xs text-zinc-400">
                {chatMode === 'connecting'
                  ? 'Menghubungkan...'
                  : chatMode === 'agent'
                    ? 'Terhubung dengan Agen'
                    : 'Online • Siap membantu'}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              {chatMode === 'ai' && (
                <button
                  type="button"
                  onClick={handleHandoverToAgent}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  Hubungi Agen
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white text-lg leading-none px-2 py-1"
                aria-label="Tutup chat"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50">
            {messages.length === 0 && liveMessages.length === 0 && (
              <div className="bg-white border border-zinc-200 text-zinc-600 rounded-2xl rounded-tl-none px-3.5 py-2.5 text-sm shadow-sm">
                Halo! Ada yang bisa saya bantu seputar layanan kami hari ini?
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    message.role === 'user'
                      ? 'bg-zinc-900 text-white rounded-br-none'
                      : 'bg-white border border-zinc-200 text-zinc-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {message.parts.map((part, index) =>
                    part.type === 'text' ? <span key={index}>{part.text}</span> : null
                  )}
                </div>
              </div>
            ))}

            {liveMessages.map((msg) => {
              if (msg.sender === 'system') {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <span className="text-[11px] text-zinc-500 bg-zinc-200/70 px-3 py-1 rounded-full text-center">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-zinc-900 text-white rounded-br-none'
                        : 'bg-emerald-50 border border-emerald-200 text-zinc-800 rounded-bl-none shadow-sm'
                    }`}
                  >
                    {msg.sender === 'agent' && (
                      <span className="block text-[10px] font-semibold text-emerald-700 mb-0.5">
                        Agen
                      </span>
                    )}
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {chatMode === 'ai' &&
              isLoading &&
              messages[messages.length - 1]?.role === 'user' && (
                <div className="flex justify-start">
                  <div className="bg-white border border-zinc-200 text-zinc-400 rounded-2xl px-3.5 py-2 text-xs animate-pulse">
                    Sedang mengetik...
                  </div>
                </div>
              )}

            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white border-t border-zinc-200 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={chatMode === 'connecting'}
              placeholder={
                chatMode === 'agent'
                  ? 'Balas pesan ke agen...'
                  : 'Tulis pertanyaan...'
              }
              className="flex-1 border border-zinc-300 rounded-xl px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:bg-zinc-100"
            />
            <button
              type="submit"
              disabled={
                chatMode === 'connecting' ||
                (chatMode === 'ai' && isLoading) ||
                !input.trim()
              }
              className="bg-zinc-900 text-white px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              Kirim
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-zinc-900 text-white shadow-lg hover:bg-zinc-800 hover:scale-105 transition-all flex items-center justify-center text-2xl"
        aria-label="Buka chat"
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
}