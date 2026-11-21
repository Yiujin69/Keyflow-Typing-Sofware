import {
  Activity,
  Clock,
  Crown,
  Flag,
  Flame,
  Gauge,
  Hash,
  Keyboard,
  Layers,
  Medal,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  flag: Flag,
  layers: Layers,
  medal: Medal,
  gauge: Gauge,
  zap: Zap,
  crown: Crown,
  target: Target,
  sparkles: Sparkles,
  flame: Flame,
  clock: Clock,
  keyboard: Keyboard,
  hash: Hash,
  timer: Timer,
  activity: Activity,
  trophy: Trophy,
};

export function AchievementIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = ICONS[name] ?? Trophy;
  return <Icon size={size} aria-hidden="true" />;
}
