import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your AI Task & Agile Assistant. How can I assist your workflow today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    const apiKey = import.meta.env.VITE_AI_API_KEY;

    if (apiKey && apiKey.trim() !== '') {
      try {
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content:
                  'You are a helpful agile project management assistant integrated into a Kanban board application. Answer user inquiries concisely regarding prioritizing work, avoiding burnout, breaking down tasks, or setting deadlines.',
              },
              { role: 'user', content: userText },
            ],
            max_tokens: 200,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const reply = response.data.choices[0]?.message?.content;
        setMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
        setLoading(false);
        return;
      } catch (err) {
        console.warn('Real AI API failed, falling back:', err.message);
      }
    }

    // Deterministic Rule-Based Fallback
    setTimeout(() => {
      let reply = 'Here is an agile recommendation: Focus on completing existing In-Progress tasks before pulling new items into the pipeline to minimize context switching.';
      const lower = userText.toLowerCase();

      if (lower.includes('burnout') || lower.includes('overload') || lower.includes('workload')) {
        reply = 'Workload Balancing Tip: When a team member holds more than 5 in-progress tasks, their avatar pulses red to alert the lead. Consider reassigning tasks or moving non-urgent tickets back to To-Do.';
      } else if (lower.includes('priority') || lower.includes('prioritize') || lower.includes('urgent')) {
        reply = 'Priority Strategy: Sort your backlog by HIGH priority items first. Ensure tasks blocking other milestones are addressed before low-impact enhancements.';
      } else if (lower.includes('kanban') || lower.includes('wip') || lower.includes('limit')) {
        reply = 'Kanban Best Practice: Enforce WIP (Work-In-Progress) limits. Keeping fewer active tasks per engineer drastically improves cycle time and delivery quality.';
      } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        reply = 'Hello! You can ask me how to prioritize tasks, balance team workloads, or break down complex deliverables!';
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: reply,
          isFallback: true,
        },
      ]);
      setLoading(false);
    }, 500);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center group"
        aria-label="Toggle AI Assistant"
      >
        <span className="text-xl">🤖</span>
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-semibold pl-0 group-hover:pl-2">
          AI Assistant
        </span>
      </button>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[480px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-fadeIn">
          {/* Header */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-sm">
                🤖
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Agile AI Assistant</h3>
                <span className="text-[10px] text-slate-400">
                  {import.meta.env.VITE_AI_API_KEY ? 'OpenAI GPT Online' : 'Active (Demo Heuristic Mode)'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  <p>{m.text}</p>
                  {m.isFallback && (
                    <span className="block mt-1 text-[9px] text-amber-400/80">
                      Heuristic recommendation (no API key set)
                    </span>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                  <span>Generating thoughts...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about workload, task advice..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 disabled:opacity-40 transition-all"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
