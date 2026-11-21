import { Lock, Sparkles, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AchievementIcon } from '../components/AchievementIcon';
import { Badge, Button, Card, ProgressBar, Segmented } from '../components/ui';
import { ACHIEVEMENTS } from '../lib/achievements';
import { useStore } from '../lib/store';
import type { ViewId } from '../lib/types';

type Filter = 'all' | 'unlocked' | 'locked';

const TIER_LABELS: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

export function AchievementsView({ navigate }: { navigate: (view: ViewId, lessonId?: string) => void }) {
  const { profile } = useStore();
  const [filter, setFilter] = useState<Filter>('all');

  const unlocked = Object.keys(profile.achievements);
  const total = ACHIEVEMENTS.length;
  const percent = (unlocked.length / total) * 100;

  const filtered = useMemo(() => {
    return ACHIEVEMENTS.filter((achievement) => {
      const isUnlocked = Boolean(profile.achievements[achievement.id]);
      if (filter === 'unlocked') return isUnlocked;
      if (filter === 'locked') return !isUnlocked;
      return true;
    });
  }, [filter, profile.achievements]);

  const tierCounts = useMemo(() => {
    const counts: Record<string, { have: number; total: number }> = {};
    for (const achievement of ACHIEVEMENTS) {
      counts[achievement.tier] = counts[achievement.tier] ?? { have: 0, total: 0 };
      counts[achievement.tier].total += 1;
      if (profile.achievements[achievement.id]) counts[achievement.tier].have += 1;
    }
    return counts;
  }, [profile.achievements]);

  return (
    <div className="page achievements-page">
      <header className="page-head">
        <div>
          <p className="eyebrow"><Trophy size={14} /> Milestones</p>
          <h1>Proof of the work.</h1>
          <p className="page-sub">Earned locally, kept forever. No leaderboards, no accounts, no notifications begging for attention.</p>
        </div>
        <div className="ach-progress-hero">
          <span className="ach-progress-number">{unlocked.length}<em>/{total}</em></span>
          <ProgressBar value={percent} />
          <span className="muted small">{Math.round(percent)}% of all achievements</span>
        </div>
      </header>

      <div className="tier-strip">
        {(['bronze', 'silver', 'gold', 'platinum'] as const).map((tier) => (
          <div className={`tier-card tier-${tier}`} key={tier}>
            <span className="tier-dot" />
            <div>
              <strong>{TIER_LABELS[tier]}</strong>
              <span>{tierCounts[tier]?.have ?? 0} of {tierCounts[tier]?.total ?? 0}</span>
            </div>
            <span className="tier-percent">{Math.round(((tierCounts[tier]?.have ?? 0) / (tierCounts[tier]?.total || 1)) * 100)}%</span>
          </div>
        ))}
      </div>

      <div className="ach-toolbar">
        <Segmented
          ariaLabel="Filter achievements"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'unlocked', label: `Unlocked ${unlocked.length}` },
            { value: 'locked', label: `Locked ${total - unlocked.length}` },
          ]}
        />
        <Button variant="ghost" size="sm" icon={<Sparkles size={15} />} onClick={() => navigate('learn')}>
          Continue the curriculum
        </Button>
      </div>

      <div className="ach-grid">
        {filtered.map((achievement) => {
          const isUnlocked = Boolean(profile.achievements[achievement.id]);
          const progress = achievement.progress?.(profile) ?? { current: 0, goal: 1 };
          const ratio = Math.min(100, (progress.current / progress.goal) * 100);
          const unlockedAt = profile.achievements[achievement.id];
          return (
            <Card className={`ach-card tier-${achievement.tier} ${isUnlocked ? 'is-unlocked' : 'is-locked'}`} key={achievement.id}>
              <div className="ach-card-top">
                <span className={`ach-icon tier-${achievement.tier}`}>
                  {isUnlocked ? <AchievementIcon name={achievement.icon} size={22} /> : <Lock size={18} />}
                </span>
                <Badge tone={isUnlocked ? 'good' : 'neutral'}>{isUnlocked ? 'Unlocked' : TIER_LABELS[achievement.tier]}</Badge>
              </div>
              <h3>{achievement.title}</h3>
              <p>{achievement.description}</p>
              <div className="ach-card-progress">
                <ProgressBar value={ratio} height={5} />
                <span>
                  {isUnlocked && unlockedAt
                    ? `Earned ${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(unlockedAt)}`
                    : `${Math.min(progress.current, progress.goal).toFixed(progress.goal >= 100 ? 0 : 1)} / ${progress.goal}`}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card>
          <p className="muted center">Nothing here yet in this filter.</p>
        </Card>
      )}
    </div>
  );
}
