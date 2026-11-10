import { RetrySmall } from './icons';

/** Over the finished debate: what happened, and the way to watch it again. */
export function DebateEndCard({ title, onReplay }: { title: string; onReplay: () => void }) {
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-black/70 text-white" data-testid="end-card">
      <div className="grid justify-items-center gap-3 text-center">
        <p className="text-xs tracking-wide text-white/70 uppercase">Debate finished</p>
        <p className="max-w-xs text-lg font-semibold">{title}</p>
        <button
          type="button"
          onClick={event => {
            event.stopPropagation();
            onReplay();
          }}
          className="flex h-10.5 items-center gap-1.5 rounded-full bg-white px-4 text-smallButton text-text shadow-light"
        >
          <RetrySmall />
          Replay debate
        </button>
      </div>
    </div>
  );
}
