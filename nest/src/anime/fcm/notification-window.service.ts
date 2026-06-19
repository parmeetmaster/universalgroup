import { Injectable, Logger } from '@nestjs/common';

/**
 * Per-country delivery window for push notifications.
 *
 * Some regions should only receive notifications during a specific local-time
 * window. Inside the window the country behaves exactly like any other country
 * (real-time fanout); outside the window its topic is skipped for that tick.
 *
 * Currently configured:
 *  - IN: only between 20:00 and 08:00 IST (overnight window).
 */
interface DeliveryWindow {
  /** IANA timezone used to evaluate the window, e.g. "Asia/Kolkata". */
  tz: string;
  /** Window start hour (inclusive), 0-23 local time. */
  startHour: number;
  /** Window end hour (exclusive), 0-23 local time. */
  endHour: number;
}

@Injectable()
export class NotificationWindowService {
  private readonly logger = new Logger(NotificationWindowService.name);

  // No per-country delivery windows — every country receives new-episode pushes in
  // real time, around the clock. (IN was previously restricted to 20:00–08:00 IST,
  // which meant Indian users got NO notifications during the day; removed so they
  // receive them anytime, like every other country.)
  private readonly windows: Record<string, DeliveryWindow> = {};

  /**
   * Returns true if notifications are allowed for the country right now.
   * Countries without a configured window are always allowed.
   */
  isWithinWindow(country: string, now: Date = new Date()): boolean {
    const cc = country.toUpperCase();
    const win = this.windows[cc];
    if (!win) return true;

    const hour = this.hourInTz(now, win.tz);
    const allowed =
      win.startHour > win.endHour
        ? // Overnight window (e.g. 20:00 → 08:00): allowed late evening OR early morning.
          hour >= win.startHour || hour < win.endHour
        : // Same-day window (e.g. 08:00 → 20:00).
          hour >= win.startHour && hour < win.endHour;

    return allowed;
  }

  /** Hour (0-23) of `date` in the given timezone, independent of server TZ. */
  private hourInTz(date: Date, tz: string): number {
    const formatted = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      hour12: false,
    }).format(date);
    return parseInt(formatted, 10) % 24;
  }
}
