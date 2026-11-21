import { ArrowRight, Clock, RotateCcw, Sparkles, Star, Target, TrendingUp, Trophy, Zap } from 'lucide-react';
import { ACHIEVEMENT_MAP } from '../lib/achievements';
import { formatDuration, niceKey } from '../lib/metrics';
import type { SessionSummary } from '../lib/types';
import { LineChart } from './Charts';
import { Button, Modal } from './ui';

export interface SessionResultsProps {
  open: boolean;
  summary: SessionSummary | null;
  stars?: number;
  unlocked?: string[];
  beatWpm?: boolean;
  beatAccuracy?: boolean;
  onRetry: () => void;
  onNext?: () => void;
  nextLabel?: string;
  onClose?: () => void;
  comparison?: { wpm: number; accuracy: number } | null;
}

export function SessionResults({
  open,
  summary,
  stars = 0,
  unlocked = [],
  beatWpm = false,
  beatAccuracy = false,
  onRetry,
  onNext,
  nextLabel = 'Next lesson',
  onClose,
  comparison,
}: SessionResultsProps) {
  if (!summary) return null;
  const accuracyTone = summary.accuracy >= 97 ? 'good' : summary.accuracy >= 90 ? 'warm' : 'bad';
  const sampleData = summary.samples.map((sample) => ({ label: `${sample.t}s`, value: sample.wpm }));

  return (
    <Modal
      open={open}
      onClose={onClose ?? onRetry}
      width={720}
      title={
        <span className="results-title">
          <Trophy size={20} /> {summary.kind === 'test' ? 'Test complete' : summary.kind === 'review' ? 'Review complete' : 'Session complete'}
        </span>
      }
      subtitle={`${summary.label} · ${formatDuration(summary.durationMs, true)}`}
      footer={
        <div className="results-actions">
          <Button variant="outline" icon={<RotateCcw size={16} />} onClick={onRetry}>
            Try again
          </Button>
          {onNext && (
            <Button variant="primary" trailing={<ArrowRight size={16} />} onClick={onNext}>
              {nextLabel}
            </Button>
          )}
          {!onNext && onClose && (
            <Button variant="primary" onClick={onClose}>
              Done
            </Button>
          )}
        </div>
      }
    >
      <div className="results-hero">
        <div className="results-main">
          <span className="results-kicker">Speed</span>
          <div className="results-wpm">
            {Math.round(summary.wpm)}
            <span>wpm</span>
          </div>
          <div className="results-sub">
            {Math.round(summary.rawWpm)} raw · {Math.round(summary.correctChars)} correct chars
          </div>
        </div>
        <div className={`results-accuracy tone-${accuracyTone}`}>
          <span className="results-kicker">Accuracy</span>
          <strong>{summary.accuracy.toFixed(1)}%</strong>
          <span className="results-sub">{summary.errors} error{summary.errors === 1 ? '' : 's'}</span>
        </div>
      </div>

      {stars > 0 && (
        <div className={`star-row ${stars === 3 ? 'is-perfect' : ''}`} aria-label={`${stars} of 3 stars`}>
          {[1, 2, 3].map((value) => (
            <Star key={value} size={26} className={value <= stars ? 'star is-filled' : 'star'} fill={value <= stars ? 'currentColor' : 'none'} />
          ))}
          <span>{stars === 3 ? 'Target met' : stars === 2 ? 'Almost there' : 'Lesson complete'}</span>
        </div>
      )}

      {(beatWpm || beatAccuracy) && (
        <div className="pb-banner">
          <Sparkles size={16} />
          <span>
            New personal best{beatWpm ? ` speed · ${Math.round(summary.wpm)} wpm` : ''}
            {beatWpm && beatAccuracy ? ' and' : ''}
            {beatAccuracy ? ` accuracy · ${summary.accuracy.toFixed(1)}%` : ''}
          </span>
        </div>
      )}

      <div className="results-grid">
        <div className="result-pocket">
          <Zap size={15} />
          <span>Consistency</span>
          <strong>{summary.consistency}%</strong>
        </div>
        <div className="result-pocket">
          <Target size={15} />
          <span>Keystrokes</span>
          <strong>{summary.totalKeystrokes}</strong>
        </div>
        <div className="result-pocket">
          <Clock size={15} />
          <span>Time</span>
          <strong>{formatDuration(summary.durationMs, true)}</strong>
        </div>
        <div className="result-pocket">
          <TrendingUp size={15} />
          <span>Weak keys</span>
          <strong>{summary.weakKeys.length || '—'}</strong>
        </div>
      </div>

      {comparison && (
        <p className="results-comparison">
          Target: {comparison.wpm} wpm at {comparison.accuracy}% accuracy
        </p>
      )}

      {sampleData.length > 2 && (
        <div className="results-chart">
          <h4>Pace over the session</h4>
          <LineChart data={sampleData} height={150} suffix=" wpm" />
        </div>
      )}

      {summary.weakKeys.length > 0 && (
        <div className="weak-keys">
          <h4>Keep an eye on these</h4>
          <div className="key-chips">
            {summary.weakKeys.map((key) => (
              <kbd key={key}>{niceKey(key)}</kbd>
            ))}
          </div>
          <p>Adaptive review will bring these keys back in your next sessions.</p>
        </div>
      )}

      {unlocked.length > 0 && (
        <div className="unlock-list">
          <h4>Achievement unlocked</h4>
          {unlocked.map((id) => {
            const achievement = ACHIEVEMENT_MAP.get(id);
            if (!achievement) return null;
            return (
              <div className="unlock-item" key={id}>
                <span className="unlock-icon"><Trophy size={16} /></span>
                <div>
                  <strong>{achievement.title}</strong>
                  <span>{achievement.description}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
