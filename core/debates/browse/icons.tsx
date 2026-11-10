const base = { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'currentColor', 'aria-hidden': true } as const;

export function Play() {
  return (
    <svg {...base}>
      <path d="M4 2.5v11l9-5.5-9-5.5z" />
    </svg>
  );
}

export function Pause() {
  return (
    <svg {...base}>
      <rect x="3.5" y="2.5" width="3" height="11" rx="1" />
      <rect x="9.5" y="2.5" width="3" height="11" rx="1" />
    </svg>
  );
}

export function Speaker() {
  return (
    <svg {...base}>
      <path d="M2 6h3l4-3v10l-4-3H2z" />
      <path d="M11 5.5a3.5 3.5 0 0 1 0 5" stroke="currentColor" strokeWidth="1.4" fill="none" />
    </svg>
  );
}

export function SpeakerMuted() {
  return (
    <svg {...base}>
      <path d="M2 6h3l4-3v10l-4-3H2z" />
      <path d="M11 6l3 4M14 6l-3 4" stroke="currentColor" strokeWidth="1.4" fill="none" />
    </svg>
  );
}

export function RetrySmall() {
  return (
    <svg {...base}>
      <path
        d="M3.5 8a4.5 4.5 0 1 0 1.3-3.2M3.5 2.5v2.8h2.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
