import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/routes.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/spacing.dart';
import '../../core/util/image_utils.dart';
import '../../core/widgets/error_view.dart';
import '../../di/injection.dart';
import '../shared/data/api_service.dart';
import '../shared/models/content_model.dart';

class SeeAllScreen extends StatefulWidget {
  const SeeAllScreen({super.key, required this.railId, required this.title});
  final String railId;
  final String title;

  @override
  State<SeeAllScreen> createState() => _SeeAllScreenState();
}

class _SeeAllScreenState extends State<SeeAllScreen> {
  static const _genres = [
    _GenreChip('All', null),
    _GenreChip('Romance', 'romance'),
    _GenreChip('Family', 'family'),
    _GenreChip('Thriller', 'thriller'),
    _GenreChip('Comedy', 'comedy'),
    _GenreChip('Drama', 'drama'),
  ];

  final _scrollController = ScrollController();
  final _items = <ContentModel>[];

  String? _activeGenre;
  int _page = 1;
  int _total = 0;
  bool _loading = false;
  bool _initialLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _loadPage();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _chipScrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
            _scrollController.position.maxScrollExtent - 200 &&
        !_loading &&
        _items.length < _total) {
      _loadPage();
    }
  }

  Future<void> _loadPage() async {
    if (_loading) return;
    if (mounted) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }

    try {
      final result = await getIt<ApiService>().railDramas(
        widget.railId,
        genre: _activeGenre,
        page: _page,
      );
      if (!mounted) return;
      setState(() {
        _items.addAll(result.items);
        _total = result.total;
        _page++;
        _loading = false;
        _initialLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
        _initialLoading = false;
      });
    }
  }

  void _selectGenre(String? slug) {
    if (slug == _activeGenre || !mounted) return;
    setState(() {
      _activeGenre = slug;
      _items.clear();
      _page = 1;
      _total = 0;
      _loading = false;
      _initialLoading = true;
    });
    _loadPage();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildAppBar(),
            _buildGenreChips(),
            Expanded(child: _buildBody()),
          ],
        ),
      ),
    );
  }

  Widget _buildAppBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.xs, AppSpacing.sm, AppSpacing.lg, AppSpacing.xs),
      child: Row(
        children: [
          IconButton(
            onPressed: () => context.pop(),
            icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          ),
          const SizedBox(width: AppSpacing.xs),
          Expanded(
            child: Text(
              widget.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.3,
              ),
            ),
          ),
        ],
      ),
    );
  }

  final _chipScrollController = ScrollController();

  void _scrollChipsForward() {
    final pos = _chipScrollController.position;
    final target = (pos.pixels + 150).clamp(0.0, pos.maxScrollExtent);
    _chipScrollController.animateTo(
      target,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOutCubic,
    );
  }

  Widget _buildGenreChips() {
    return SizedBox(
      height: 52,
      child: Stack(
        children: [
          ListView.separated(
            controller: _chipScrollController,
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm, 50, AppSpacing.sm),
            itemCount: _genres.length,
            separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
        itemBuilder: (ctx, i) {
          final chip = _genres[i];
          final active = chip.slug == _activeGenre;
          return GestureDetector(
            onTap: () => _selectGenre(chip.slug),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: active ? Colors.white : AppColors.surfaceElevated,
                borderRadius: BorderRadius.circular(AppRadii.pill),
                border: Border.all(
                  color: active ? Colors.white : Colors.white.withValues(alpha: 0.12),
                  width: 0.8,
                ),
              ),
              alignment: Alignment.center,
              child: Text(
                chip.label,
                style: TextStyle(
                  color: active ? Colors.black : Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.1,
                ),
              ),
            ),
          );
        },
      ),
          Positioned(
            right: 0,
            top: 0,
            bottom: 0,
            child: GestureDetector(
              onTap: _scrollChipsForward,
              child: Container(
                width: 40,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.bg.withValues(alpha: 0),
                      AppColors.bg.withValues(alpha: 0.9),
                    ],
                  ),
                ),
                alignment: Alignment.center,
                child: Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Icon(
                    Icons.chevron_right_rounded,
                    color: Colors.white.withValues(alpha: 0.8),
                    size: 20,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_initialLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.accent),
      );
    }

    if (_error != null && _items.isEmpty) {
      return ErrorView(
        message: _error!,
        onRetry: () {
          setState(() => _initialLoading = true);
          _loadPage();
        },
      );
    }

    if (_items.isEmpty) {
      return const Center(
        child: Text(
          'No dramas found.',
          style: TextStyle(color: AppColors.onSurfaceMuted),
        ),
      );
    }

    return GridView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 10, AppSpacing.lg, 90),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 10,
        mainAxisSpacing: 18,
        childAspectRatio: 0.58,
      ),
      itemCount: _items.length + (_items.length < _total ? 1 : 0),
      itemBuilder: (ctx, i) {
        if (i >= _items.length) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(AppSpacing.lg),
              child: CircularProgressIndicator(
                color: AppColors.accent,
                strokeWidth: 2,
              ),
            ),
          );
        }
        return _SeeAllCard(content: _items[i]);
      },
    );
  }
}

class _GenreChip {
  const _GenreChip(this.label, this.slug);
  final String label;
  final String? slug;
}

class _SeeAllCard extends StatelessWidget {
  const _SeeAllCard({required this.content});
  final ContentModel content;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push(AppRoutes.detailPath(content.slug)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: CachedNetworkImage(
                imageUrl: resolveImageUrl(content.posterUrl) ?? '',
                fit: BoxFit.cover,
                width: double.infinity,
                placeholder: (_, __) =>
                    Container(color: AppColors.surfaceElevated),
                errorWidget: (_, __, ___) =>
                    Container(color: AppColors.surfaceElevated),
              ),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            content.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.1,
            ),
          ),
        ],
      ),
    );
  }
}
