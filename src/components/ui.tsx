import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export function Card({
  children,
  className = '',
  title,
  subtitle,
  action,
  as: Tag = 'section',
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  as?: 'section' | 'div' | 'article';
}) {
  return (
    <Tag className={`card ${className}`}>
      {(title || action) && (
        <header className="card-head">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {action && <div className="card-action">{action}</div>}
        </header>
      )}
      {children}
    </Tag>
  );
}

type ButtonVariant = 'primary' | 'soft' | 'ghost' | 'outline' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export function Button({
  variant = 'soft',
  size = 'md',
  className = '',
  icon,
  trailing,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <button className={`btn btn-${variant} btn-${size} ${className}`} type="button" {...props}>
      {icon && <span className="btn-icon" aria-hidden="true">{icon}</span>}
      {children && <span>{children}</span>}
      {trailing && <span className="btn-icon" aria-hidden="true">{trailing}</span>}
    </button>
  );
}

export function IconButton({
  label,
  className = '',
  active = false,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      className={`icon-btn ${active ? 'is-active' : ''} ${className}`}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'accent' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function ProgressBar({ value, tone = 'accent', height }: { value: number; tone?: string; height?: number }) {
  return (
    <div className="progress" style={{ height }} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}>
      <div className={`progress-fill tone-${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Ring({
  value,
  size = 92,
  stroke = 8,
  children,
  tone = 'accent',
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
  tone?: 'accent' | 'good' | 'warm';
  label?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <div className={`ring ring-${tone}`} style={{ width: size, height: size }} role="img" aria-label={label ?? `${Math.round(clamped)} percent`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} fill="none" />
        <circle
          className="ring-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-content">{children ?? <span className="ring-number">{Math.round(clamped)}%</span>}</div>
    </div>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md',
}: {
  options: { value: T; label: ReactNode; hint?: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div className={`segmented segmented-${size}`} role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          className={option.value === value ? 'is-selected' : ''}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          title={option.hint}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className={`switch-row ${disabled ? 'is-disabled' : ''}`}>
      <div className="switch-text">
        <label htmlFor={id}>{label}</label>
        {description && <p>{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`switch ${checked ? 'is-on' : ''}`}
        onClick={() => onChange(!checked)}
        disabled={disabled}
      >
        <span className="switch-thumb" />
      </button>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 560,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
  labelledBy?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if (event.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const timer = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('button, input, textarea, [tabindex]')?.focus();
    }, 40);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(timer);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy ?? titleId}
        ref={panelRef}
        style={{ maxWidth: width }}
      >
        {(title || subtitle) && (
          <header className="modal-head">
            <div>
              {title && <h2 id={titleId}>{title}</h2>}
              {subtitle && <p>{subtitle}</p>}
            </div>
            <IconButton label="Close" onClick={onClose} className="modal-close">
              <X size={18} />
            </IconButton>
          </header>
        )}
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}

export function StatTile({
  label,
  value,
  unit,
  hint,
  icon,
  tone = 'accent',
  children,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`stat-tile tone-${tone}`}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {icon && <span className="stat-icon" aria-hidden="true">{icon}</span>}
      </div>
      <div className="stat-value">
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      {hint && <div className="stat-hint">{hint}</div>}
      {children && <div className="stat-extra">{children}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-icon">{icon}</div>}
      <h4>{title}</h4>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
