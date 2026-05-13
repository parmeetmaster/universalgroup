import 'package:flutter/material.dart';

/// Black-first palette with gold accent (icon match).
class AppColors {
  const AppColors._();

  // Brand — gold (icon "PAKISTANI DRAMAS" + crescent)
  static const Color accent = Color(0xFFD4AF37);
  static const Color accentDark = Color(0xFFA8841F);
  static const Color accentBright = Color(0xFFEBC66B);

  // Surfaces — pure black
  static const Color bg = Color(0xFF000000);
  static const Color surface = Color(0xFF0B0B0B);
  static const Color surfaceElevated = Color(0xFF1A1A1A);
  static const Color surfaceHighest = Color(0xFF2A2A2A);

  // Text
  static const Color onSurface = Color(0xFFFFFFFF);
  static const Color onSurfaceMuted = Color(0xFFB3B3B3);
  static const Color onSurfaceSubtle = Color(0xFF808080);

  // Semantic
  static const Color success = Color(0xFF46D369);
  static const Color warning = Color(0xFFF5A623);
  static const Color error = Color(0xFFE15642);

  // Borders / outlines
  static const Color outline = Color(0xFF2A2A2A);
  static const Color outlineSubtle = Color(0xFF1A1A1A);

  // Glass
  static const Color glassOverlay = Color(0xCC000000);
}
