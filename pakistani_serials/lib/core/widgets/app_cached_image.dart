import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../theme/colors.dart';
import '../util/image_utils.dart';

/// Drop-in replacement for [CachedNetworkImage] that silently catches image
/// stream errors (SocketException, ClientException, etc.) via [errorListener],
/// preventing them from reaching [FlutterError.onError] and being reported as
/// fatal crashes in Crashlytics.
class AppCachedImage extends StatelessWidget {
  const AppCachedImage({
    super.key,
    required this.imageUrl,
    this.fit = BoxFit.cover,
    this.width,
    this.height,
    this.alignment = Alignment.center,
    this.placeholder,
    this.errorWidget,
  });

  final String? imageUrl;
  final BoxFit fit;
  final double? width;
  final double? height;
  final Alignment alignment;
  final Widget? placeholder;
  final Widget? errorWidget;

  @override
  Widget build(BuildContext context) {
    final resolved = resolveImageUrl(imageUrl);
    if (resolved == null || resolved.isEmpty) {
      return errorWidget ?? _defaultPlaceholder();
    }

    return CachedNetworkImage(
      imageUrl: resolved,
      fit: fit,
      width: width,
      height: height,
      alignment: alignment,
      placeholder: (_, __) => placeholder ?? _defaultPlaceholder(),
      errorWidget: (_, __, ___) => errorWidget ?? _defaultPlaceholder(),
      errorListener: (e) {
        debugPrint('Image load error: $e');
      },
    );
  }

  Widget _defaultPlaceholder() =>
      Container(color: AppColors.surfaceElevated);
}
