package com.alansarmasjid.app;

// This class references resources so the shrinker keeps them in release builds.
public final class ResourceAnchor {
  // Notification small icons used by Notifee at runtime
  static final int[] NOTIFICATION_ICONS = new int[] {
    R.drawable.ic_notification_prayer,
    R.drawable.ic_notification_event,
    R.drawable.ic_notification_campaign,
    R.drawable.ic_notification_urgent,
    R.drawable.ic_notification_general,
  };

  // Launcher icons (usually referenced by manifest, kept for belt-and-suspenders)
  static final int[] LAUNCHER_ICONS = new int[] {
    R.mipmap.ic_launcher,
    R.mipmap.ic_launcher_foreground,
    R.mipmap.ic_launcher_background,
    R.mipmap.ic_launcher_monochrome,
  };

  private ResourceAnchor() {}
}
