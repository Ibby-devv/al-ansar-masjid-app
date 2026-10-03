package com.alansarmasjid.app;

/**
 * Hard references to resources loaded only by name at runtime (Notifee).
 * Resource shrinking otherwise removes them from release builds.
 * Kept by ProGuard — see proguard-rules.pro.
 */
public final class ResourceAnchor {
  static final int[] NOTIFICATION_ICONS = new int[] {
    R.drawable.ic_notification_prayer,
    R.drawable.ic_notification_event,
    R.drawable.ic_notification_campaign,
    R.drawable.ic_notification_urgent,
    R.drawable.ic_notification_general,
  };

  private ResourceAnchor() {}
}
