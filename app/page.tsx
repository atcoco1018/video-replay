import { DebateFeed } from '~/core/debates/browse/debate-feed';
import { DevPanels } from '~/core/debates/browse/debug-panels';

export default function FeedPage() {
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_300px]">
      <div className="grid content-start gap-2">
        <h1 className="text-2xl font-semibold">Debates</h1>
        <p className="text-sm text-grey-04">
          Mock debates with stand-in audio. Each debater says where the debate is every 5 seconds, so you can hear where
          playback is. Scroll to move playback between cards.
        </p>
        <DebateFeed />
      </div>
      <DevPanels />
    </main>
  );
}
