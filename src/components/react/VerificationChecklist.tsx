import React, { useState, useCallback, useMemo } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface VerificationCheck {
  id: string;
  label: string;
  checked: boolean;
  icon: string;
}

export type Verdict = 'verified' | 'likely' | 'uncertain' | 'unreliable';

export interface VerificationResult {
  score: number;
  checks: VerificationCheck[];
  verdict: Verdict;
  notes: string[];
}

export interface VerificationChecklistProps {
  /** Optional initial checks – defaults to the standard 8-item template. */
  initialChecks?: VerificationCheck[];
  /** Called whenever the verification state changes. */
  onChange?: (result: VerificationResult) => void;
  /** Called when the user clicks "Reset". */
  onReset?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Default template                                                   */
/* ------------------------------------------------------------------ */

const DEFAULT_CHECKS: VerificationCheck[] = [
  { id: 'recency', label: 'Recent timestamp confirmed', checked: false, icon: '\uD83D\uDD50' },
  { id: 'geolocation', label: 'Location verified', checked: false, icon: '\uD83D\uDCCD' },
  { id: 'source', label: 'Primary source identified', checked: false, icon: '\uD83D\uDCF0' },
  { id: 'crossref', label: 'Cross-referenced with other sources', checked: false, icon: '\uD83D\uDD17' },
  { id: 'no_ai', label: 'No AI generation artifacts', checked: false, icon: '\uD83E\uDD16' },
  { id: 'no_recrop', label: 'Not recycled/old footage', checked: false, icon: '\uD83D\uDD04' },
  { id: 'metadata', label: 'Metadata verified', checked: false, icon: '\uD83D\uDCCB' },
  { id: 'context', label: 'Context established', checked: false, icon: '\uD83D\uDCD6' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function calcResult(checks: VerificationCheck[], notes: string[]): VerificationResult {
  const checkedCount = checks.filter((c) => c.checked).length;
  const score = Math.round((checkedCount / checks.length) * 100);

  let verdict: Verdict;
  if (score >= 90) verdict = 'verified';
  else if (score >= 70) verdict = 'likely';
  else if (score >= 40) verdict = 'uncertain';
  else verdict = 'unreliable';

  return { score, checks, verdict, notes };
}

const VERDICT_COLORS: Record<Verdict, string> = {
  verified: '#22c55e',
  likely: '#60a5fa',
  uncertain: '#facc15',
  unreliable: '#ef4444',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const VerificationChecklist: React.FC<VerificationChecklistProps> = ({
  initialChecks,
  onChange,
  onReset,
}) => {
  const [checks, setChecks] = useState<VerificationCheck[]>(
    () => (initialChecks ?? DEFAULT_CHECKS).map((c) => ({ ...c })),
  );
  const [notes, setNotes] = useState<string[]>([]);
  const [noteInput, setNoteInput] = useState('');

  const result = useMemo(() => calcResult(checks, notes), [checks, notes]);

  const toggleCheck = useCallback(
    (id: string) => {
      setChecks((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c));
        const r = calcResult(next, notes);
        onChange?.(r);
        return next;
      });
    },
    [notes, onChange],
  );

  const addNote = useCallback(() => {
    const trimmed = noteInput.trim();
    if (!trimmed) return;
    setNotes((prev) => {
      const next = [...prev, trimmed];
      onChange?.(calcResult(checks, next));
      return next;
    });
    setNoteInput('');
  }, [noteInput, checks, onChange]);

  const handleReset = useCallback(() => {
    const fresh = (initialChecks ?? DEFAULT_CHECKS).map((c) => ({ ...c }));
    setChecks(fresh);
    setNotes([]);
    setNoteInput('');
    onChange?.(calcResult(fresh, []));
    onReset?.();
  }, [initialChecks, onChange, onReset]);

  return (
    <div className="verification-checklist">
      {/* Score bar */}
      <div className="verification-score">
        <div className="verification-score-bar">
          <div
            className="verification-score-fill"
            style={{ width: `${result.score}%`, backgroundColor: VERDICT_COLORS[result.verdict] }}
          />
        </div>
        <span className="verification-score-label" style={{ color: VERDICT_COLORS[result.verdict] }}>
          {result.score}% &mdash; {result.verdict.toUpperCase()}
        </span>
      </div>

      {/* Checks */}
      <ul className="verification-checks">
        {checks.map((c) => (
          <li
            key={c.id}
            className={`verification-check-item${c.checked ? ' checked' : ''}`}
            onClick={() => toggleCheck(c.id)}
          >
            <span className="verification-check-icon">{c.icon}</span>
            <span className="verification-check-label">{c.label}</span>
            <span className="verification-check-toggle">{c.checked ? '\u2705' : '\u2B1C'}</span>
          </li>
        ))}
      </ul>

      {/* Notes */}
      {notes.length > 0 && (
        <ul className="verification-notes">
          {notes.map((n, i) => (
            <li key={i} className="verification-note">{n}</li>
          ))}
        </ul>
      )}

      {/* Add note */}
      <div className="verification-note-input">
        <input
          type="text"
          className="verification-note-field"
          placeholder="Add a note..."
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addNote()}
        />
        <button className="verification-note-add" onClick={addNote} disabled={!noteInput.trim()}>
          Add
        </button>
      </div>

      {/* Reset */}
      <button className="verification-reset" onClick={handleReset}>
        Reset Checklist
      </button>
    </div>
  );
};
