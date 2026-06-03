import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../l10n/generated/app_localizations.dart';
import '../theme/colors.dart';
import 'routes.dart';

/// Bottom nav: 5 tabs, always-visible labels, compact.
class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.child});
  final Widget child;

  List<_Tab> _tabs(BuildContext context) {
    final s = S.of(context)!;
    return [
      _Tab(AppRoutes.home, Icons.home_rounded, s.homeTabTitle),
      _Tab(AppRoutes.browse, Icons.local_fire_department_rounded, s.browseTabTitle),
      _Tab(AppRoutes.search, Icons.search_rounded, s.searchTabTitle),
      _Tab(AppRoutes.watchlist, Icons.bookmark_border_rounded, s.watchlistTabTitle),
      _Tab(AppRoutes.profile, Icons.person_outline_rounded, s.profileTabTitle),
    ];
  }

  int _currentIndex(BuildContext context, List<_Tab> tabs) {
    final location = GoRouterState.of(context).uri.toString();
    for (int i = 0; i < tabs.length; i++) {
      if (location.startsWith(tabs[i].path)) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final tabs = _tabs(context);
    return Scaffold(
      backgroundColor: AppColors.bg,
      extendBody: true,
      body: SafeArea(
        top: false,
        bottom: false,
        child: child,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Colors.black,
          border: Border(
            top: BorderSide(color: Color(0xFF181818), width: 0.5),
          ),
        ),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 56,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(tabs.length, (i) {
                final tab = tabs[i];
                final isActive = i == _currentIndex(context, tabs);
                return _TabButton(
                  tab: tab,
                  isActive: isActive,
                  onTap: () => context.go(tab.path),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class _Tab {
  const _Tab(this.path, this.icon, this.label);
  final String path;
  final IconData icon;
  final String label;
}

class _TabButton extends StatelessWidget {
  const _TabButton({
    required this.tab,
    required this.isActive,
    required this.onTap,
  });

  final _Tab tab;
  final bool isActive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = isActive ? AppColors.accent : AppColors.onSurfaceSubtle;
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(tab.icon, color: color, size: 22),
            const SizedBox(height: 3),
            Text(
              tab.label,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.visible,
              style: TextStyle(
                color: color,
                fontSize: 10,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
