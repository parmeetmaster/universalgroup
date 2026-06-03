import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/routes.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/spacing.dart';
import '../../../../core/util/image_utils.dart';
import '../../../../core/widgets/empty_view.dart';
import '../../../../di/injection.dart';
import '../../../../l10n/generated/app_localizations.dart';
import '../bloc/search_bloc.dart';

class SearchScreen extends StatelessWidget {
  const SearchScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => getIt<SearchBloc>(),
      child: const _SearchView(),
    );
  }
}

class _SearchView extends StatefulWidget {
  const _SearchView();

  @override
  State<_SearchView> createState() => _SearchViewState();
}

class _SearchViewState extends State<_SearchView> {
  final _ctrl = TextEditingController();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: TextField(
                controller: _ctrl,
                autofocus: true,
                decoration: InputDecoration(
                  hintText: S.of(context)!.searchHint,
                  prefixIcon: const Icon(Icons.search_rounded),
                ),
                onChanged: (v) =>
                    context.read<SearchBloc>().add(SearchQueryChanged(v)),
              ),
            ),
            Expanded(
              child: BlocBuilder<SearchBloc, SearchState>(
                builder: (ctx, state) {
                  if (state.query.isEmpty && state.status == SearchStatus.idle) {
                    return const EmptyView(
                      message: 'Type to search',
                      icon: Icons.search_rounded,
                    );
                  }
                  if (state.status == SearchStatus.loading) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  if (state.content.isEmpty && state.episodes.isEmpty) {
                    return EmptyView(message: S.of(context)!.searchNoResults);
                  }
                  return ListView(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                    children: [
                      for (final c in state.content)
                        ListTile(
                          leading: ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: SizedBox(
                              width: 48,
                              height: 72,
                              child: CachedNetworkImage(
                                imageUrl: resolveImageUrl(c.posterUrl) ?? '',
                                fit: BoxFit.cover,
                                errorWidget: (_, __, ___) =>
                                    Container(color: AppColors.surfaceElevated),
                              ),
                            ),
                          ),
                          title: Text(c.title),
                          subtitle: Text(
                              '${c.releaseYear ?? '—'} • ${c.ratingAvgNumeric.toStringAsFixed(1)}★'),
                          onTap: () => context.push(AppRoutes.detailPath(c.slug)),
                        ),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
