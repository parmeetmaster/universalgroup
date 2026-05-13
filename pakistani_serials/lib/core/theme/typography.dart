import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'colors.dart';

class AppTypography {
  const AppTypography._();

  static TextTheme textTheme(Locale? locale) {
    final isUrdu = locale?.languageCode == 'ur';
    final base = isUrdu
        ? GoogleFonts.notoNastaliqUrduTextTheme()
        : GoogleFonts.interTextTheme();

    return base.copyWith(
      displayLarge: base.displayLarge?.copyWith(
        fontSize: 34, height: 38 / 34, fontWeight: FontWeight.w900,
        color: AppColors.onSurface, letterSpacing: -0.8,
      ),
      displayMedium: base.displayMedium?.copyWith(
        fontSize: 28, height: 32 / 28, fontWeight: FontWeight.w800,
        color: AppColors.onSurface, letterSpacing: -0.5,
      ),
      displaySmall: base.displaySmall?.copyWith(
        fontSize: 22, height: 26 / 22, fontWeight: FontWeight.w800,
        color: AppColors.onSurface, letterSpacing: -0.4,
      ),
      titleLarge: base.titleLarge?.copyWith(
        fontSize: 18, height: 24 / 18, fontWeight: FontWeight.w700,
        color: AppColors.onSurface, letterSpacing: -0.2,
      ),
      titleMedium: base.titleMedium?.copyWith(
        fontSize: 15, height: 20 / 15, fontWeight: FontWeight.w700,
        color: AppColors.onSurface,
      ),
      titleSmall: base.titleSmall?.copyWith(
        fontSize: 13, height: 18 / 13, fontWeight: FontWeight.w600,
        color: AppColors.onSurface,
      ),
      bodyLarge: base.bodyLarge?.copyWith(
        fontSize: 15, height: 21 / 15, fontWeight: FontWeight.w400,
        color: AppColors.onSurface,
      ),
      bodyMedium: base.bodyMedium?.copyWith(
        fontSize: 13, height: 18 / 13, fontWeight: FontWeight.w400,
        color: AppColors.onSurface,
      ),
      bodySmall: base.bodySmall?.copyWith(
        fontSize: 11, height: 14 / 11, fontWeight: FontWeight.w500,
        color: AppColors.onSurfaceMuted,
      ),
      labelLarge: base.labelLarge?.copyWith(
        fontSize: 13, height: 16 / 13, fontWeight: FontWeight.w700,
        color: AppColors.onSurface,
      ),
      labelMedium: base.labelMedium?.copyWith(
        fontSize: 11, height: 14 / 11, fontWeight: FontWeight.w500,
        color: AppColors.onSurfaceMuted,
      ),
    );
  }
}
