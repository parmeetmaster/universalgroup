import 'dart:async';
import 'package:flutter/material.dart';
import '../../di/injection.dart';
import '../theme/colors.dart';
import 'connectivity_service.dart';

class ConnectivityOverlay extends StatefulWidget {
  const ConnectivityOverlay({super.key, required this.child});
  final Widget child;

  @override
  State<ConnectivityOverlay> createState() => _ConnectivityOverlayState();
}

class _ConnectivityOverlayState extends State<ConnectivityOverlay>
    with SingleTickerProviderStateMixin {
  late final AnimationController _animCtrl;
  late final Animation<Offset> _slideAnim;
  late StreamSubscription<bool> _sub;
  bool _showBanner = false;
  bool _wasOffline = false;

  @override
  void initState() {
    super.initState();

    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, -1),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _animCtrl, curve: Curves.easeOutCubic));

    final svc = getIt<ConnectivityService>();

    if (!svc.isOnline) {
      _showBanner = true;
      _wasOffline = true;
      _animCtrl.forward();
    }

    _sub = svc.onStatusChange.listen((online) {
      if (!online) {
        setState(() {
          _showBanner = true;
          _wasOffline = true;
        });
        _animCtrl.forward();
      } else if (_wasOffline) {
        // Show "Back online" briefly then hide
        setState(() => _wasOffline = false);
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted && getIt<ConnectivityService>().isOnline) {
            _animCtrl.reverse().then((_) {
              if (mounted) setState(() => _showBanner = false);
            });
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _sub.cancel();
    _animCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        if (_showBanner)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SlideTransition(
              position: _slideAnim,
              child: _Banner(isOnline: !_wasOffline),
            ),
          ),
      ],
    );
  }
}

class _Banner extends StatelessWidget {
  const _Banner({required this.isOnline});
  final bool isOnline;

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);

    return Container(
      width: double.infinity,
      padding: EdgeInsets.only(
        top: mq.padding.top + 4,
        bottom: 10,
        left: 16,
        right: 16,
      ),
      decoration: BoxDecoration(
        color: isOnline ? AppColors.success : AppColors.error,
        boxShadow: [
          BoxShadow(
            color: (isOnline ? AppColors.success : AppColors.error)
                .withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            isOnline ? Icons.wifi : Icons.wifi_off_rounded,
            color: Colors.white,
            size: 18,
          ),
          const SizedBox(width: 8),
          Text(
            isOnline ? 'Back online' : 'No internet connection',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 13,
              fontWeight: FontWeight.w600,
              decoration: TextDecoration.none,
            ),
          ),
        ],
      ),
    );
  }
}
