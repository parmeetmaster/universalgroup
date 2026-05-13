import 'package:flutter/material.dart';
import 'colors.dart';

class AppGradients {
  const AppGradients._();

  static const LinearGradient heroBackdrop = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Colors.transparent, Color(0xFF000000)],
    stops: [0.45, 1.0],
  );

  static const LinearGradient heroTopShade = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xCC000000), Colors.transparent],
    stops: [0, 0.4],
  );

  static const LinearGradient cardOverlay = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Colors.transparent, Color(0xCC000000)],
    stops: [0.4, 1.0],
  );

  // Name kept for backwards compatibility; palette is gold now.
  static const LinearGradient primaryRed = LinearGradient(
    colors: [AppColors.accentBright, AppColors.accent],
  );

  static const RadialGradient splash = RadialGradient(
    center: Alignment.center,
    radius: 1.2,
    colors: [Color(0xFF1A1200), Color(0xFF000000)],
  );

  static const LinearGradient authBackground = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1A1200), Color(0xFF000000), Color(0xFF1A1200)],
    stops: [0.0, 0.5, 1.0],
  );

  static const LinearGradient emeraldButton = LinearGradient(
    colors: [AppColors.accentBright, AppColors.accent],
  );
}
