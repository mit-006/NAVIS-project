import React, { useState, useRef, useEffect, useCallback } from 'react';
import { processQuery, SUGGESTED_QUESTIONS } from '../services/navisAssistant';

function formatMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n- /g, '\n\u2022 ')
    .replace(/\n/g, '<br/>');
}

const WELCOME_QUESTIONS = [
  'Which year had the highest exposure?',
  'How many habitations are flood exposed?',
  'How is priority calculated?',
  'How many relocation candidates are there?',
];

const DARK = {
  panel: '#141414',
  headerBg: '#141414',
  surface: '#1B1B1B',
  surfaceHover: '#232323',
  border: 'rgba(255,255,255,0.10)',
  borderSubtle: 'rgba(255,255,255,0.07)',
  borderSuggestion: 'rgba(255,255,255,0.08)',
  primary: '#FFFFFF',
  secondary: '#A1A1AA',
  inputBg: '#1B1B1B',
  blue: '#0221B7',
  pink: '#B7027B',
  disabledBg: '#27272A',
};

const LIGHT = {
  panel: '#FFFFFF',
  headerBg: '#FFFFFF',
  surface: '#F4F4F5',
  surfaceHover: '#E8E8EC',
  border: '#E4E4E7',
  borderSubtle: '#E4E4E7',
  borderSuggestion: '#E4E4E7',
  primary: '#18181B',
  secondary: '#71717A',
  inputBg: '#F4F4F5',
  blue: '#0221B7',
  pink: '#B7027B',
  disabledBg: '#E4E4E7',
};

export default function NavisAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLg, setIsLg] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const getColors = useCallback(() => {
    return document.documentElement.classList.contains('dark') ? DARK : LIGHT;
  }, []);

  const [colors, setColors] = useState(getColors);

  useEffect(() => {
    const observer = new MutationObserver(() => setColors(getColors()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [getColors]);

  useEffect(() => {
    const checkMobile = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsLg(w >= 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const addMessage = (text, sender) => {
    setMessages(prev => [...prev, { text, sender, id: Date.now() + Math.random() }]);
  };

  const handleSend = useCallback((text) => {
    const q = text || input.trim();
    if (!q) return;
    setInput('');
    addMessage(q, 'user');
    setIsTyping(true);
    setTimeout(() => {
      const response = processQuery(q);
      addMessage(response, 'assistant');
      setIsTyping(false);
    }, 350 + Math.random() * 400);
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const c = colors;

  const btnRight = isMobile ? 16 : 20;
  const btnBottom = isMobile ? 16 : 20;
  const btnSize = isMobile ? 52 : 56;

  return (
    <>
      {/* ── Floating Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close ResQ Assistant' : 'Open ResQ Assistant'}
        style={{
          position: 'fixed',
          right: btnRight,
          bottom: btnBottom,
          width: btnSize,
          height: btnSize,
          zIndex: 1000,
          borderRadius: '50%',
          background: c.blue,
          boxShadow: '0 8px 24px rgba(0,0,0,0.30)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 200ms ease, background 150ms',
        }}
      >
        {isOpen ? (
          <svg width="24" height="24" fill="none" stroke="#FFFFFF" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg width="24" height="24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* ── Chat Panel ── */}
      {isOpen && (
        <>
          {/* Desktop panel: >= 1024px — 340x500 */}
          {isLg && (
            <div style={{
              position: 'fixed',
              right: 20,
              bottom: 20,
              width: 340,
              minWidth: 340,
              maxWidth: 340,
              height: 500,
              maxHeight: 500,
              zIndex: 1001,
              borderRadius: 16,
              border: `1px solid ${c.border}`,
              boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
              background: c.panel,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'rqPanelIn 200ms ease-out',
            }}>
              <Header colors={c} onClose={() => setIsOpen(false)} titleSize={15} subtitleSize={11} iconSize={34} iconRadius={9} closeSize={28} height={60} padding={12} />
              <ChatBody messages={messages} isTyping={isTyping} colors={c} messagesEndRef={messagesEndRef} welcomeQuestions={WELCOME_QUESTIONS} onSend={handleSend} maxUser="78%" maxAssist="82%" />
              <InputArea input={input} setInput={setInput} onKeyDown={handleKeyDown} onSend={handleSend} colors={c} height={56} padding={10} inputHeight={36} sendSize={32} inputRef={inputRef} />
            </div>
          )}

          {/* Mobile panel: < 1024px — responsive */}
          {!isLg && (
            <div style={{
              position: 'fixed',
              right: 12,
              bottom: 12,
              width: 'calc(100vw - 24px)',
              maxWidth: 330,
              height: 'min(560px, calc(100dvh - 90px))',
              maxHeight: 'calc(100dvh - 90px)',
              zIndex: 1001,
              borderRadius: 16,
              border: `1px solid ${c.border}`,
              boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
              background: c.panel,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'rqPanelIn 200ms ease-out',
            }}>
              <Header colors={c} onClose={() => setIsOpen(false)} titleSize={14} subtitleSize={10} iconSize={32} iconRadius={8} closeSize={28} height={56} padding={12} />
              <ChatBody messages={messages} isTyping={isTyping} colors={c} messagesEndRef={messagesEndRef} welcomeQuestions={WELCOME_QUESTIONS} onSend={handleSend} maxUser="82%" maxAssist="88%" />
              <InputArea input={input} setInput={setInput} onKeyDown={handleKeyDown} onSend={handleSend} colors={c} height={54} padding={10} inputHeight={34} sendSize={30} inputRef={inputRef} />
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes rqPanelIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes rqBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </>
  );
}

function Header({ colors: c, onClose, titleSize, subtitleSize, iconSize, iconRadius, closeSize, height, padding }) {
  return (
    <div style={{ height, padding, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${c.borderSuggestion}`, flexShrink: 0, background: c.headerBg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: iconSize === 34 ? 10 : 9 }}>
        <div style={{ width: iconSize, height: iconSize, borderRadius: iconRadius, background: `linear-gradient(135deg, ${c.blue}, ${c.pink})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width={iconSize * 0.5} height={iconSize * 0.5} fill="none" stroke="#FFFFFF" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: titleSize, fontWeight: 600, color: c.primary, lineHeight: 1 }}>ResQ Assistant</div>
          <div style={{ fontSize: subtitleSize, color: c.secondary, marginTop: 2 }}>NAVIS Intelligence</div>
        </div>
      </div>
      <button onClick={onClose} aria-label="Close assistant" style={{ width: closeSize, height: closeSize, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.secondary }}>
        <svg width={closeSize * 0.5} height={closeSize * 0.5} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function ChatBody({ messages, isTyping, colors: c, messagesEndRef, welcomeQuestions, onSend, maxUser, maxAssist }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
      {messages.length === 0 && !isTyping && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(2,33,183,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <svg width="22" height="22" fill="none" stroke={c.blue} strokeWidth="1.6" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: c.primary, textAlign: 'center', marginBottom: 4 }}>Hello! I'm ResQ Assistant.</div>
          <div style={{ fontSize: 11, color: c.secondary, textAlign: 'center', maxWidth: 280, lineHeight: 1.6, marginBottom: 16 }}>Ask about NAVIS's flood exposure, priority analysis, hazards, or relocation insights.</div>
          <div style={{ width: '100%' }}>
            {welcomeQuestions.map((q, i) => (
              <button key={i} onClick={() => onSend(q)} style={{
                width: '100%',
                height: 36,
                margin: '5px 0',
                padding: '0 10px',
                borderRadius: 10,
                background: c.surface,
                border: `1px solid ${c.borderSuggestion}`,
                color: c.secondary,
                fontSize: 11,
                textAlign: 'left',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'block',
                transition: 'background 150ms, border-color 150ms, color 150ms',
              }}
                onMouseEnter={e => { e.target.style.background = c.surfaceHover; e.target.style.borderColor = c.blue; e.target.style.color = c.primary; }}
                onMouseLeave={e => { e.target.style.background = c.surface; e.target.style.borderColor = c.borderSuggestion; e.target.style.color = c.secondary; }}
              >{q}</button>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
          <div style={{
            maxWidth: msg.sender === 'user' ? maxUser : maxAssist,
            padding: '8px 10px',
            borderRadius: 12,
            fontSize: 11,
            lineHeight: 1.5,
            wordBreak: 'break-word',
            ...(msg.sender === 'user' ? {
              background: c.blue,
              color: '#FFFFFF',
            } : {
              background: c.surface,
              border: `1px solid ${c.borderSubtle}`,
              color: c.primary,
            }),
          }}>
            <p style={{ margin: 0 }} dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.text) }} />
          </div>
        </div>
      ))}

      {isTyping && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
          <div style={{ padding: '8px 12px', borderRadius: 12, background: c.surface, border: `1px solid ${c.borderSubtle}` }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.secondary, animation: 'rqBounce 1.2s ease-in-out infinite' }} />
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.secondary, animation: 'rqBounce 1.2s ease-in-out 0.2s infinite' }} />
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.secondary, animation: 'rqBounce 1.2s ease-in-out 0.4s infinite' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

function InputArea({ input, setInput, onKeyDown, onSend, colors: c, height, padding, inputHeight, sendSize, inputRef }) {
  return (
    <div style={{ height, padding, borderTop: `1px solid ${c.borderSuggestion}`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, background: c.headerBg }}>
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Ask about NAVIS..."
        aria-label="Message input"
        style={{
          flex: 1,
          height: inputHeight,
          padding: '0 12px',
          borderRadius: 10,
          background: c.inputBg,
          border: `1px solid ${c.border}`,
          color: c.primary,
          fontSize: 12,
          outline: 'none',
        }}
      />
      <button
        onClick={() => onSend()}
        disabled={!input.trim()}
        aria-label="Send message"
        style={{
          width: sendSize,
          height: sendSize,
          borderRadius: 10,
          background: input.trim() ? c.blue : c.disabledBg,
          border: 'none',
          cursor: input.trim() ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background 150ms',
        }}
      >
        <svg width={sendSize * 0.44} height={sendSize * 0.44} fill="none" stroke="#FFFFFF" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
