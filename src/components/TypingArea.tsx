import { useEffect, useRef } from 'react';
import type { CharState } from '../hooks/useTyping';

export function TypingArea({
  text,
  states,
  index,
  caretStyle,
  fontSize,
}: {
  text: string;
  states: CharState[];
  index: number;
  caretStyle: 'line' | 'block' | 'underline';
  fontSize?: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const current = container.querySelector<HTMLElement>('.is-current');
    if (!current) return;
    const top = current.offsetTop;
    const bottom = top + current.offsetHeight;
    if (top < container.scrollTop + 32) {
      container.scrollTop = Math.max(0, top - 40);
    } else if (bottom > container.scrollTop + container.clientHeight - 48) {
      container.scrollTop = bottom - container.clientHeight + 56;
    }
  }, [index]);

  return (
    <div className="typing-area-wrap">
      <div
        ref={scrollRef}
        className={`typing-area caret-${caretStyle} ${index === 0 ? 'at-start' : ''}`}
        style={fontSize ? { fontSize } : undefined}
      >
        {[...text].map((char, charIndex) => {
          const state = states[charIndex] ?? 'pending';
          const isCurrent = charIndex === index;
          const classes = [
            'char',
            `char-${state}`,
            isCurrent ? 'is-current' : '',
            char === ' ' ? 'is-space' : '',
            char === '\n' ? 'is-newline' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <span key={charIndex} className={classes} data-index={charIndex}>
              {char}
              {isCurrent && <span className="caret" aria-hidden="true" />}
            </span>
          );
        })}
        {index >= text.length && <span className="caret caret-end" aria-hidden="true" />}
      </div>
    </div>
  );
}
