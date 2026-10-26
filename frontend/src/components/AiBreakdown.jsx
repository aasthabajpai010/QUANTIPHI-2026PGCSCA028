import { useState } from 'react';
import axios from 'axios';

export default function AiBreakdown({ task, onApplySubtasks }) {
  const [loading, setLoading] = useState(false);
  const [subtasks, setSubtasks] = useState([]);
  const [mode, setMode] = useState(''); // 'ai' or 'fallback'
  const [error, setError] = useState('');

  const generateBreakdown = async () => {
    setLoading(true);
    setError('');
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
                  'You are an agile project manager. Given a task title and description, break it down into 3-5 concise, actionable subtasks. Return ONLY a valid JSON array of strings, e.g. ["Subtask 1", "Subtask 2"].',
              },
              {
                role: 'user',
                content: `Task Title: "${task.title}"\nDescription: "${task.description || 'None provided'}"`,
              },
            ],
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const content = response.data.choices[0]?.message?.content;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          setSubtasks(parsed);
          setMode('ai');
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Real AI breakdown failed, utilizing smart heuristic fallback:', err.message);
      }
    }

    // Honest deterministic fallback
    setTimeout(() => {
      const generated = generateSmartFallback(task.title, task.description);
      setSubtasks(generated);
      setMode('fallback');
      setLoading(false);
    }, 400);
  };

  const generateSmartFallback = (title, desc) => {
    const t = (title || '').toLowerCase();
    if (t.includes('bug') || t.includes('fix') || t.includes('issue')) {
      return [
        'Reproduce error locally & collect stack traces',
        'Inspect failing code paths & identify root cause',
        'Implement defensive patch & verify edge cases',
        'Add regression test & create pull request',
      ];
    }
    if (t.includes('design') || t.includes('ui') || t.includes('frontend')) {
      return [
        'Review design guidelines & wireframe components',
        'Build responsive UI structure with Tailwind CSS',
        'Connect user interactions & validate edge cases',
        'Verify cross-browser responsiveness & accessibility',
      ];
    }
    if (t.includes('api') || t.includes('backend') || t.includes('database')) {
      return [
        'Define relational data schema & run migration',
        'Implement REST endpoint with input validation',
        'Apply JWT authorization & RBAC permissions',
        'Test response payloads & handle error status codes',
      ];
    }
    return [
      `Analyze requirements for "${title}"`,
      'Draft step-by-step implementation plan',
      'Execute core development & integrate components',
      'Run verification tests & mark as Done',
    ];
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">✨</span>
          <span className="text-xs font-semibold text-slate-300">AI Task Breakdown</span>
        </div>
        <button
          type="button"
          onClick={generateBreakdown}
          disabled={loading}
          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all flex items-center gap-1.5"
        >
          {loading ? 'Analyzing...' : 'Generate Subtasks'}
        </button>
      </div>

      {mode && (
        <div className="my-2 p-2 rounded-lg text-[11px] flex items-center gap-2 bg-slate-950 border border-slate-800">
          <span className={`w-2 h-2 rounded-full ${mode === 'ai' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
          <span className="text-slate-400">
            {mode === 'ai'
              ? 'Generated via live OpenAI connection'
              : 'AI Key not configured — showing heuristic breakdown'}
          </span>
        </div>
      )}

      {subtasks.length > 0 && (
        <div className="space-y-1.5 mt-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
          {subtasks.map((st, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
              <input type="checkbox" className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-0" />
              <span>{st}</span>
            </div>
          ))}
          {onApplySubtasks && (
            <button
              type="button"
              onClick={() => onApplySubtasks(subtasks)}
              className="mt-2 text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium"
            >
              Append to Task Description
            </button>
          )}
        </div>
      )}
    </div>
  );
}
