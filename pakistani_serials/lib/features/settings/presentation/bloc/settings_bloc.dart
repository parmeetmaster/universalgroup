import 'dart:ui';

import 'package:equatable/equatable.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/notifications/notification_service.dart';

class SettingsState extends Equatable {
  const SettingsState({required this.locale, required this.notificationsEnabled});

  final Locale locale;
  final bool notificationsEnabled;

  SettingsState copyWith({Locale? locale, bool? notificationsEnabled}) => SettingsState(
        locale: locale ?? this.locale,
        notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
      );

  @override
  List<Object?> get props => [locale, notificationsEnabled];
}

sealed class SettingsEvent {}

class ChangeLocale extends SettingsEvent {
  ChangeLocale(this.locale);
  final Locale locale;
}

class ToggleNotifications extends SettingsEvent {
  ToggleNotifications(this.enabled);
  final bool enabled;
}

@singleton
class SettingsBloc extends HydratedBloc<SettingsEvent, SettingsState> {
  SettingsBloc(this._notifications)
      : super(SettingsState(
          locale: const Locale('en'),
          notificationsEnabled: _notifications.enabled,
        )) {
    on<ChangeLocale>((e, emit) => emit(state.copyWith(locale: e.locale)));
    on<ToggleNotifications>((e, emit) async {
      await _notifications.setEnabled(e.enabled);
      emit(state.copyWith(notificationsEnabled: e.enabled));
    });
  }

  final NotificationService _notifications;

  // Only the locale is persisted via hydration; the notification flag is owned
  // by NotificationService (SharedPreferences) so the FCM subscription state is
  // always the single source of truth.
  @override
  SettingsState? fromJson(Map<String, dynamic> json) {
    final code = json['locale'] as String?;
    if (code == null) return null;
    return SettingsState(
      locale: Locale(code),
      notificationsEnabled: _notifications.enabled,
    );
  }

  @override
  Map<String, dynamic>? toJson(SettingsState state) => {
        'locale': state.locale.languageCode,
      };
}
