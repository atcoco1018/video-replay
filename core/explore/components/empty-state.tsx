/** Shown when the filters leave no claims, with a way back to all of them. */
export function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="grid justify-items-center gap-2 rounded-xl border border-dashed border-divider bg-white px-6 py-10 text-center">
      <p className="font-medium">No claims match these filters.</p>
      <p className="text-sm text-grey-04">Try fewer words, another topic, or both sides.</p>
      <button type="button" onClick={onReset} className="mt-2 text-sm underline">
        Clear all filters
      </button>
    </div>
  );
}
