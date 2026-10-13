'use client';

import { Send } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useOrderStore } from '@/store/order-store';
import type { Courier } from '@/types';

const QUICK_REPLIES = ['I’m on my way down 🏃', 'Please leave it with the concierge', 'Can you call when outside?', 'Thanks so much! 🙏'];

const AUTO_REPLIES: [RegExp, string][] = [
  [/call|ring|phone/i, 'Sure, I’ll give you a quick call when I’m outside 👍'],
  [/concierge|reception|porter/i, 'No problem — I’ll hand it to the concierge.'],
  [/door|leave|drop/i, 'Got it, I’ll leave it safely at the door and send a photo.'],
  [/thank/i, 'You’re welcome! Enjoy your meal 😊'],
  [/where|how long|eta|late/i, 'Nearly there — just a few minutes away!'],
];
const DEFAULT_REPLY = 'Got it 👍';

export function CourierChat({ open, onClose, orderId, courier }: { open: boolean; onClose: () => void; orderId: string; courier: Courier }) {
  const messages = useOrderStore((s) => s.chats[orderId] ?? []);
  const sendChat = useOrderStore((s) => s.sendChat);
  const pushCourierMessage = useOrderStore((s) => s.pushCourierMessage);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, typing, open]);

  const send = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    sendChat(orderId, trimmed);
    setText('');
    setTyping(true);
    const reply = AUTO_REPLIES.find(([re]) => re.test(trimmed))?.[1] ?? DEFAULT_REPLY;
    window.setTimeout(() => {
      setTyping(false);
      pushCourierMessage(orderId, reply);
    }, 1600 + Math.random() * 900);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(text);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      placement="right"
      title={`Chat with ${courier.name.split(' ')[0]}`}
      description="Messages are relayed — your number stays private."
      initialFocusRef={inputRef as React.RefObject<HTMLElement>}
      footer={
        <div className="space-y-3">
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            {QUICK_REPLIES.map((q) => (
              <button key={q} type="button" onClick={() => send(q)} className="shrink-0 rounded-full border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-800 hover:border-ink-400">
                {q}
              </button>
            ))}
          </div>
          <form onSubmit={onSubmit} className="flex gap-2">
            <label htmlFor="chat-input" className="sr-only">
              Message your courier
            </label>
            <input
              ref={inputRef}
              id="chat-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={300}
              placeholder="Type a message…"
              autoComplete="off"
              className="h-11 min-w-0 flex-1 rounded-full border border-ink-200 px-4 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
            <button type="submit" disabled={!text.trim()} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-700 text-white hover:bg-brand-800 disabled:bg-ink-200 disabled:text-ink-600" aria-label="Send message">
              <Send className="h-5 w-5" aria-hidden />
            </button>
          </form>
        </div>
      }
    >
      <ol ref={listRef} className="flex h-full flex-col gap-3 overflow-y-auto p-5" aria-live="polite" aria-label="Conversation">
        {messages.map((m) => (
          <li key={m.id} className={cn('flex flex-col', m.from === 'customer' ? 'items-end' : m.from === 'system' ? 'items-center' : 'items-start')}>
            {m.from === 'system' ? (
              <p className="max-w-[90%] rounded-xl bg-ink-50 px-3 py-2 text-center text-xs text-ink-600">{m.text}</p>
            ) : (
              <>
                <p className={cn('max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px]', m.from === 'customer' ? 'rounded-br-md bg-ink-900 text-white' : 'rounded-bl-md bg-ink-50 text-ink-900')}>
                  <span className="sr-only">{m.from === 'customer' ? 'You' : courier.name}: </span>
                  {m.text}
                </p>
                <span className="mt-1 text-[11px] text-ink-600">{formatTime(m.at)}</span>
              </>
            )}
          </li>
        ))}
        {typing && (
          <li className="flex items-start" aria-label={`${courier.name} is typing`}>
            <span className="flex gap-1 rounded-2xl rounded-bl-md bg-ink-50 px-4 py-3" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-ink-400" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </span>
          </li>
        )}
      </ol>
    </Dialog>
  );
}
