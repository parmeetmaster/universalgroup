import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../di/injection.dart';
import '../theme/colors.dart';
import '../theme/spacing.dart';
import 'rating_cubit.dart';

Future<void> showRatingDialog(BuildContext context) async {
  final cubit = getIt<RatingCubit>();
  cubit.checkShouldShow();
  if (!cubit.state.shouldShow) {
    await cubit.close();
    return;
  }

  await showDialog<void>(
    context: context,
    builder: (_) => BlocProvider.value(
      value: cubit,
      child: const _RatingDialog(),
    ),
  );

  await cubit.close();
}

class _RatingDialog extends StatefulWidget {
  const _RatingDialog();

  @override
  State<_RatingDialog> createState() => _RatingDialogState();
}

class _RatingDialogState extends State<_RatingDialog> {
  final _feedbackController = TextEditingController();

  @override
  void dispose() {
    _feedbackController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<RatingCubit, RatingState>(
      listenWhen: (prev, curr) => curr.status == RatingStatus.done,
      listener: (ctx, state) {
        Navigator.of(ctx).pop();
      },
      builder: (ctx, s) => Dialog(
        backgroundColor: AppColors.surfaceElevated,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.sheet),
        ),
        insetPadding: const EdgeInsets.symmetric(horizontal: 32),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.x2, AppSpacing.x3, AppSpacing.x2, AppSpacing.x2,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(AppRadii.card),
                child: Image.asset(
                  'assets/icons/app_icon.png',
                  width: 64,
                  height: 64,
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              const Text(
                'Enjoying the app?',
                style: TextStyle(
                  color: AppColors.onSurface,
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              const Text(
                'Tap a star to rate your experience',
                style: TextStyle(
                  color: AppColors.onSurfaceMuted,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: AppSpacing.x2),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (i) {
                  final starIndex = i + 1;
                  return GestureDetector(
                    onTap: s.status == RatingStatus.submitting
                        ? null
                        : () => ctx.read<RatingCubit>().setRating(starIndex),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: AnimatedScale(
                        scale: s.rating >= starIndex ? 1.15 : 1.0,
                        duration: const Duration(milliseconds: 150),
                        curve: Curves.easeOutCubic,
                        child: Icon(
                          s.rating >= starIndex
                              ? Icons.star_rounded
                              : Icons.star_outline_rounded,
                          size: 40,
                          color: s.rating >= starIndex
                              ? AppColors.accent
                              : AppColors.onSurfaceSubtle,
                        ),
                      ),
                    ),
                  );
                }),
              ),
              AnimatedSize(
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeOutCubic,
                child: s.showTextField
                    ? Padding(
                        padding: const EdgeInsets.only(top: AppSpacing.x2),
                        child: TextField(
                          controller: _feedbackController,
                          enabled: s.status != RatingStatus.submitting,
                          maxLines: 3,
                          maxLength: 500,
                          style: const TextStyle(
                            color: AppColors.onSurface,
                            fontSize: 14,
                          ),
                          decoration: InputDecoration(
                            hintText: 'Tell us how we can improve (optional)',
                            hintStyle: const TextStyle(
                              color: AppColors.onSurfaceSubtle,
                              fontSize: 13,
                            ),
                            filled: true,
                            fillColor: AppColors.surface,
                            border: OutlineInputBorder(
                              borderRadius:
                                  BorderRadius.circular(AppRadii.button),
                              borderSide: BorderSide.none,
                            ),
                            contentPadding: const EdgeInsets.all(AppSpacing.md),
                            counterStyle: const TextStyle(
                              color: AppColors.onSurfaceSubtle,
                              fontSize: 11,
                            ),
                          ),
                        ),
                      )
                    : const SizedBox.shrink(),
              ),
              const SizedBox(height: AppSpacing.x2),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: s.rating > 0 && s.status != RatingStatus.submitting
                      ? () => ctx.read<RatingCubit>().submit(
                            message: _feedbackController.text,
                          )
                      : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accent,
                    disabledBackgroundColor:
                        AppColors.accent.withValues(alpha: 0.3),
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppRadii.button),
                    ),
                  ),
                  child: s.status == RatingStatus.submitting
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            color: Colors.black,
                          ),
                        )
                      : const Text(
                          'Submit',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
