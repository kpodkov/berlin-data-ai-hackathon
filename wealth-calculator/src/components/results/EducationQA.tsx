import { useState } from 'react';
import { useEducation } from '../../hooks/useCortex';
import { CortexBadge } from '../shared/CortexBadge';

const SUGGESTED = [
  'What is compound interest?',
  'How should I start investing?',
  'Roth IRA vs Traditional IRA?',
  'How much should I save for retirement?',
  'What is dollar-cost averaging?',
];

export function EducationQA() {
  const [question, setQuestion] = useState('');
  const { data, loading, error, ask } = useEducation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) ask(question.trim());
  };

  const handleChip = (q: string) => {
    setQuestion(q);
    ask(q);
  };

  return (
    <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl p-5">
      <h3 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark mb-1">
        Ask a Financial Question
      </h3>
      <div className="mb-3">
        <CortexBadge size="md" />
      </div>

      {/* Suggested chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {SUGGESTED.map((q) => (
          <button
            key={q}
            onClick={() => handleChip(q)}
            className="px-2.5 py-1 rounded-full text-xs border border-border dark:border-border-dark
              text-text-secondary dark:text-text-secondary-dark
              hover:bg-surface-raised dark:hover:bg-surface-dark-raised
              transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything about personal finance..."
          className="flex-1 px-3 py-2 rounded-lg text-sm
            bg-background dark:bg-background-dark
            border border-border dark:border-border-dark
            text-text-primary dark:text-text-primary-dark
            placeholder:text-text-muted dark:placeholder:text-text-muted-dark
            focus:outline-none focus:ring-2 focus:ring-border-focus dark:focus:ring-border-dark-focus"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="px-4 py-2 rounded-lg text-sm font-medium
            bg-accent-blue dark:bg-accent-blue-dark text-white
            hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? '...' : 'Ask'}
        </button>
      </form>

      {/* Loading skeleton */}
      {loading && (
        <div className="mt-3 animate-pulse space-y-2">
          <div className="h-3 bg-surface-raised dark:bg-surface-dark-raised rounded w-full" />
          <div className="h-3 bg-surface-raised dark:bg-surface-dark-raised rounded w-4/5" />
          <div className="h-3 bg-surface-raised dark:bg-surface-dark-raised rounded w-3/5" />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-3 text-xs text-accent-rose dark:text-accent-rose-dark">{error}</p>
      )}

      {/* Response */}
      {data && !loading && (
        <div className="mt-3 p-3 rounded-lg bg-surface-raised dark:bg-surface-dark-raised">
          <p className="text-xs font-medium text-text-primary dark:text-text-primary-dark mb-1">
            {data.question}
          </p>
          <p className="text-xs text-text-secondary dark:text-text-secondary-dark leading-relaxed">
            {data.answer}
          </p>
        </div>
      )}
    </div>
  );
}
