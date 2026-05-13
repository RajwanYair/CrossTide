/**
 * Mobile-first UX utilities — R10
 *
 * Touch interactions and swipe-based navigation for mobile/tablet viewports.
 *
 *  - **Swipe detection** — horizontal/vertical swipe with configurable
 *    threshold, velocity, and direction lock.
 *  - **Pull-to-refresh** — triggers a callback when the user pulls down from
 *    the top of a scrollable container.
 *  - **Touch-friendly menu** — drawer toggle with edge-swipe detection.
 *  - **Viewport helpers** — safe area insets, orientation detection.
 */

// ── Swipe detection ──────────────────────────────────────────────────────────

export type SwipeDirection = "left" | "right" | "up" | "down";

export interface SwipeEvent {
  readonly direction: SwipeDirection;
  readonly distance: number;
  readonly velocity: number; // px/ms
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
  readonly endY: number;
}

export interface SwipeOptions {
  /** Minimum distance in px to qualify as a swipe. @default 50 */
  readonly threshold?: number;
  /** Minimum velocity in px/ms. @default 0.3 */
  readonly minVelocity?: number;
  /** Lock to primary axis to prevent diagonal triggers. @default true */
  readonly axisLock?: boolean;
}

export type SwipeHandler = (event: SwipeEvent) => void;

/**
 * Attach swipe detection to an element. Returns a dispose function.
 */
export function onSwipe(
  el: HTMLElement,
  handler: SwipeHandler,
  options: SwipeOptions = {},
): () => void {
  const threshold = options.threshold ?? 50;
  const minVelocity = options.minVelocity ?? 0.3;
  const axisLock = options.axisLock ?? true;

  let startX = 0;
  let startY = 0;
  let startTime = 0;

  function onTouchStart(e: TouchEvent): void {
    const touch = e.touches[0];
    if (!touch) return;
    startX = touch.clientX;
    startY = touch.clientY;
    startTime = Date.now();
  }

  function onTouchEnd(e: TouchEvent): void {
    const touch = e.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    const dt = Date.now() - startTime;
    if (dt === 0) return;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Axis lock: only fire if primary axis distance dominates
    if (axisLock && absDx > 0 && absDy > 0) {
      const ratio = Math.max(absDx, absDy) / Math.min(absDx, absDy);
      if (ratio < 1.5) return; // Too diagonal
    }

    const isHorizontal = absDx >= absDy;
    const distance = isHorizontal ? absDx : absDy;
    const velocity = distance / dt;

    if (distance < threshold || velocity < minVelocity) return;

    let direction: SwipeDirection;
    if (isHorizontal) {
      direction = dx > 0 ? "right" : "left";
    } else {
      direction = dy > 0 ? "down" : "up";
    }

    handler({
      direction,
      distance,
      velocity,
      startX,
      startY,
      endX: touch.clientX,
      endY: touch.clientY,
    });
  }

  el.addEventListener("touchstart", onTouchStart, { passive: true });
  el.addEventListener("touchend", onTouchEnd, { passive: true });

  return () => {
    el.removeEventListener("touchstart", onTouchStart);
    el.removeEventListener("touchend", onTouchEnd);
  };
}

// ── Pull-to-refresh ──────────────────────────────────────────────────────────

export interface PullToRefreshOptions {
  /** Distance in px before refresh triggers. @default 80 */
  readonly pullDistance?: number;
  /** Element to watch scroll position on. @default container */
  readonly scrollTarget?: Element;
}

/**
 * Attach pull-to-refresh behaviour to a container.
 * Calls `onRefresh` when the user pulls down from the top.
 * Returns a dispose function.
 */
export function pullToRefresh(
  container: HTMLElement,
  onRefresh: () => void | Promise<void>,
  options: PullToRefreshOptions = {},
): () => void {
  const pullDistance = options.pullDistance ?? 80;
  const scrollTarget = options.scrollTarget ?? container;
  let startY = 0;
  let pulling = false;

  function onTouchStart(e: TouchEvent): void {
    if (scrollTarget.scrollTop > 0) return;
    const touch = e.touches[0];
    if (!touch) return;
    startY = touch.clientY;
    pulling = true;
  }

  function onTouchMove(e: TouchEvent): void {
    if (!pulling) return;
    const touch = e.touches[0];
    if (!touch) return;
    const dy = touch.clientY - startY;
    if (dy < 0) {
      pulling = false;
    }
  }

  function onTouchEnd(e: TouchEvent): void {
    if (!pulling) return;
    pulling = false;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const dy = touch.clientY - startY;
    if (dy >= pullDistance) {
      void Promise.resolve(onRefresh());
    }
  }

  container.addEventListener("touchstart", onTouchStart, { passive: true });
  container.addEventListener("touchmove", onTouchMove, { passive: true });
  container.addEventListener("touchend", onTouchEnd, { passive: true });

  return () => {
    container.removeEventListener("touchstart", onTouchStart);
    container.removeEventListener("touchmove", onTouchMove);
    container.removeEventListener("touchend", onTouchEnd);
  };
}

// ── Edge swipe drawer ────────────────────────────────────────────────────────

export interface DrawerOptions {
  /** Edge zone width in px. @default 20 */
  readonly edgeWidth?: number;
  /** Which edge to detect. @default "left" */
  readonly edge?: "left" | "right";
}

/**
 * Detect edge swipes for drawer toggle. Returns dispose function.
 */
export function onEdgeSwipe(
  handler: (opening: boolean) => void,
  options: DrawerOptions = {},
): () => void {
  const edgeWidth = options.edgeWidth ?? 20;
  const edge = options.edge ?? "left";

  return onSwipe(
    document.body,
    (e) => {
      if (edge === "left") {
        if (e.direction === "right" && e.startX <= edgeWidth) handler(true);
        if (e.direction === "left") handler(false);
      } else {
        const vw = window.innerWidth;
        if (e.direction === "left" && e.startX >= vw - edgeWidth) handler(true);
        if (e.direction === "right") handler(false);
      }
    },
    { threshold: 30 },
  );
}

// ── Viewport helpers ─────────────────────────────────────────────────────────

export type Orientation = "portrait" | "landscape";

/**
 * Get current viewport orientation.
 */
export function getOrientation(): Orientation {
  return window.innerHeight >= window.innerWidth ? "portrait" : "landscape";
}

/**
 * Watch orientation changes. Returns dispose function.
 */
export function onOrientationChange(handler: (o: Orientation) => void): () => void {
  const mq = window.matchMedia("(orientation: portrait)");
  function listener(): void {
    handler(getOrientation());
  }
  mq.addEventListener("change", listener);
  return () => mq.removeEventListener("change", listener);
}

/**
 * Check if a CSS `env()` safe-area value is supported (i.e., the device has
 * a notch or rounded corners).
 */
export function hasSafeAreaInsets(): boolean {
  return CSS.supports("padding-top: env(safe-area-inset-top)");
}
