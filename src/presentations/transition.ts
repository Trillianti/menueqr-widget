/** Finish only the current exit, including transitions replaced by a media-query change. */
export function afterTransitions(
  element: HTMLElement,
  current: () => boolean,
  finished: () => void,
): void {
  if (!current()) return;
  void element.getBoundingClientRect();
  const animations =
    element
      .getAnimations?.({ subtree: true })
      .filter((animation) => animation.playState === 'running' || animation.pending) ?? [];
  if (!animations.length) {
    queueMicrotask(() => {
      if (current()) finished();
    });
    return;
  }
  void Promise.allSettled(animations.map((animation) => animation.finished)).then(() =>
    afterTransitions(element, current, finished),
  );
}
