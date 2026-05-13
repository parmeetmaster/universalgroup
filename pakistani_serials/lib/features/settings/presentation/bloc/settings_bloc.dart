import 'dart:ui';

import 'package:equatable/equatable.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:injectable/injectable.dart';

class SettingsState extends Equatable {
  final Locale locale;

  const SettingsState({required this.locale});

  SettingsState copyWith({Locale? locale}) => SettingsState(locale: locale ?? this.locale);

  @override
  List<Object?> get props => [locale];
}

sealed class SettingsEvent {}

class ChangeLocale extends SettingsEvent {
  final Locale locale;
  ChangeLocale(this.locale);
}

@singleton
class SettingsBloc extends HydratedBloc<SettingsEvent, SettingsState> {
  SettingsBloc() : super(const SettingsState(locale: Locale('en'))) {
    on<ChangeLocale>((e, emit) => emit(state.copyWith(locale: e.locale)));
  }

  @override
  SettingsState? fromJson(Map<String, dynamic> json) {
    final code = json['locale'] as String?;
    if (code == null) return null;
    return SettingsState(locale: Locale(code));
  }

  @override
  Map<String, dynamic>? toJson(SettingsState state) => {
        'locale': state.locale.languageCode,
      };
}
