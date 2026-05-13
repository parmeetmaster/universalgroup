import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../theme/colors.dart';
import '../theme/spacing.dart';

class ShimmerBox extends StatelessWidget {
  const ShimmerBox({
    super.key,
    required this.width,
    required this.height,
    this.radius = AppRadii.card,
  });

  final double width;
  final double height;
  final double radius;

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.surfaceElevated,
      highlightColor: AppColors.surfaceHighest,
      period: const Duration(milliseconds: 1400),
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: AppColors.surfaceElevated,
          borderRadius: BorderRadius.circular(radius),
        ),
      ),
    );
  }
}

class ShimmerHomeSkeleton extends StatelessWidget {
  const ShimmerHomeSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            child: ShimmerBox(
              width: MediaQuery.of(context).size.width - 32,
              height: 440,
              radius: AppRadii.hero,
            ),
          ),
          const SizedBox(height: AppSpacing.x3),
          for (int i = 0; i < 3; i++) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: const ShimmerBox(width: 180, height: 20),
            ),
            const SizedBox(height: AppSpacing.md),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              physics: const NeverScrollableScrollPhysics(),
              child: Row(
                children: List.generate(
                  5,
                  (_) => const Padding(
                    padding: EdgeInsets.only(right: AppSpacing.md),
                    child: ShimmerBox(width: 140, height: 210),
                  ),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.x3),
          ],
        ],
      ),
    );
  }
}
