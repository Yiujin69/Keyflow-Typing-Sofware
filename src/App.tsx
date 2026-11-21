import { useEffect, useState } from 'react';
import {
  BarChart3,
  Flame,
  GraduationCap,
  Hand,
  LayoutDashboard,
  Moon,
  PenLine,
  Repeat2,
  Settings,
  Sun,
  Timer,
  Trophy,
  WifiOff,
} from 'lucide-react';
import { useStore } from './lib/store';
import { exportProfileFile } from './lib/storage';
import { getLesson } from './lib/curriculum';
import type { ViewId } from './lib/types';
import { Dashboard } from './views/Dashboard';
import { Learn } from './views/Learn';
import { LessonView } from './views/LessonView';
import { TestView } from './views/TestView';
import { ReviewView } from './views/ReviewView';
import { CustomView } from './views/CustomView';
import { StatsView } from './views/StatsView';
import { AchievementsView } from './views/AchievementsView';
import { FingersView } from './views/FingersView';
import { SettingsView } from './views/SettingsView';
import { Onboarding } from './views/Onboarding';
import { IconButton } from './components/ui';

interface Route {
  view: ViewId;
  lessonId?: string;
}

const VIEWS: ViewId[] = ['dashboard', 'learn', 'test', 'review', 'custom', 'stats', 'achievements', 'fingers', 'settings'];

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [view, param] = raw.split('/');
  if (view === 'lesson' && param && getLesson(param)) return { view: 'learn', lessonId: param };
  if (VIEWS.includes(view as ViewId)) return { view: view as ViewId };
  return { view: 'dashboard' };
}

const NAV_GROUPS: { label: string; items: { id: ViewId; label: string; icon: typeof LayoutDashboard }[] }[] = [
  {
    label: 'Practice',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'learn', label: 'Learn', icon: GraduationCap },
      { id: 'test', label: 'Typing test', icon: Timer },
      { id: 'review', label: 'Review', icon: Repeat2 },
      { id: 'custom', label: 'Custom practice', icon: PenLine },
    ],
  },
  {
    label: 'Insights',
    items: [
      { id: 'stats', label: 'Statistics', icon: BarChart3 },
      { id: 'achievements', label: 'Achievements', icon: Trophy },
    ],
  },
  {
    label: 'Guide',
    items: [
      { id: 'fingers', label: 'Finger guide', icon: Hand },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function App() {
  const { profile, ready, updateSettings } = useStore();
  const [route, setRoute] = useState<Route>(() => parseHash());
  const [focus, setFocus] = useState(false);

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      setFocus(false);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (view: ViewId, lessonId?: string) => {
    const hash = lessonId ? `#/lesson/${lessonId}` : `#/${view}`;
    if (window.location.hash === hash) {
      setRoute(lessonId ? { view: 'learn', lessonId } : { view });
      return;
    }
    window.location.hash = hash;
  };

  const toggleTheme = () => {
    const isDark = document.documentElement.dataset.theme === 'dark';
    updateSettings({ theme: isDark ? 'light' : 'dark' });
  };

  useEffect(() => {
    document.body.classList.toggle('is-focus-mode', focus);
    return () => document.body.classList.remove('is-focus-mode');
  }, [focus]);

  // The desktop File menu export works from any screen.
  useEffect(() => {
    const handler = () => {
      void exportProfileFile(profile);
    };
    window.addEventListener('keyflow:export', handler);
    return () => window.removeEventListener('keyflow:export', handler);
  }, [profile]);

  if (!ready) {
    return (
      <div className="boot-screen">
        <div className="boot-mark">K</div>
        <p>Loading your local profile…</p>
      </div>
    );
  }

  const activeNav = route.view;
  const lessonId = route.lessonId;

  return (
    <div className={`app-shell ${focus ? 'is-focused' : ''}`}>
      <a href="#main" className="skip-link">Skip to content</a>

      <aside className="sidebar">
        <button type="button" className="brand" onClick={() => navigate('dashboard')}>
          <span className="brand-mark" aria-hidden="true">
            <span className="brand-key brand-key-1">K</span>
            <span className="brand-key brand-key-2">F</span>
          </span>
          <span className="brand-text">
            <strong>Keyflow</strong>
            <em>Typing studio</em>
          </span>
        </button>

        <nav className="nav" aria-label="Main navigation">
          {NAV_GROUPS.map((group) => (
            <div className="nav-group" key={group.label}>
              <span className="nav-label">{group.label}</span>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id || (item.id === 'learn' && lessonId);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`nav-item ${isActive ? 'is-active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => navigate(item.id)}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{item.label}</span>
                    {item.id === 'review' && profile.reviewQueue.length > 0 && (
                      <span className="nav-count">{profile.reviewQueue.length}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="offline-pill">
            <WifiOff size={13} aria-hidden="true" />
            <span>Offline · local profile</span>
          </div>
          <div className="streak-pill">
            <Flame size={15} aria-hidden="true" />
            <span>{profile.streak.current}-day streak</span>
          </div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="topbar-left">
            <span className="topbar-title">
              {activeNav === 'dashboard' && 'Dashboard'}
              {activeNav === 'learn' && (lessonId ? 'Practice' : 'Learning path')}
              {activeNav === 'test' && 'Typing test'}
              {activeNav === 'review' && 'Adaptive review'}
              {activeNav === 'custom' && 'Custom practice'}
              {activeNav === 'stats' && 'Statistics'}
              {activeNav === 'achievements' && 'Achievements'}
              {activeNav === 'fingers' && 'Finger guide'}
              {activeNav === 'settings' && 'Settings'}
            </span>
            <span className="topbar-sep" aria-hidden="true" />
            <span className="topbar-sub">
              {profile.settings.layout.toUpperCase()} · {profile.settings.language.toUpperCase()}
            </span>
          </div>
          <div className="topbar-right">
            <div className="topbar-streak">
              <Flame size={15} aria-hidden="true" />
              <strong>{profile.streak.current}</strong>
              <span>day streak</span>
            </div>
            <IconButton label="Toggle light and dark theme" onClick={toggleTheme}>
              <Sun size={17} className="theme-icon-light" />
              <Moon size={17} className="theme-icon-dark" />
            </IconButton>
          </div>
        </header>

        <main id="main" className="main" key={`${route.view}-${lessonId ?? ''}`}>
          {route.view === 'dashboard' && <Dashboard navigate={navigate} />}
          {route.view === 'learn' &&
            (lessonId && getLesson(lessonId) ? (
              <LessonView
                key={lessonId}
                lessonId={lessonId}
                navigate={navigate}
                focus={focus}
                onToggleFocus={() => setFocus((value) => !value)}
              />
            ) : (
              <Learn navigate={navigate} />
            ))}
          {route.view === 'test' && (
            <TestView navigate={navigate} focus={focus} onToggleFocus={() => setFocus((value) => !value)} />
          )}
          {route.view === 'review' && (
            <ReviewView navigate={navigate} focus={focus} onToggleFocus={() => setFocus((value) => !value)} />
          )}
          {route.view === 'custom' && (
            <CustomView navigate={navigate} focus={focus} onToggleFocus={() => setFocus((value) => !value)} />
          )}
          {route.view === 'stats' && <StatsView navigate={navigate} />}
          {route.view === 'achievements' && <AchievementsView navigate={navigate} />}
          {route.view === 'fingers' && <FingersView navigate={navigate} />}
          {route.view === 'settings' && <SettingsView navigate={navigate} />}
        </main>
      </div>

      {!profile.onboardingDone && <Onboarding onDone={() => navigate('learn')} />}
    </div>
  );
}
