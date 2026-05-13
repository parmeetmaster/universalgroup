import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_hi.dart';
import 'app_localizations_pa.dart';
import 'app_localizations_ur.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of S
/// returned by `S.of(context)`.
///
/// Applications need to include `S.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'generated/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: S.localizationsDelegates,
///   supportedLocales: S.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the S.supportedLocales
/// property.
abstract class S {
  S(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static S? of(BuildContext context) {
    return Localizations.of<S>(context, S);
  }

  static const LocalizationsDelegate<S> delegate = _SDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('hi'),
    Locale('pa'),
    Locale('ur'),
  ];

  /// No description provided for @appName.
  ///
  /// In en, this message translates to:
  /// **'Pakistani Serials'**
  String get appName;

  /// No description provided for @homeTabTitle.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get homeTabTitle;

  /// No description provided for @browseTabTitle.
  ///
  /// In en, this message translates to:
  /// **'Browse'**
  String get browseTabTitle;

  /// No description provided for @searchTabTitle.
  ///
  /// In en, this message translates to:
  /// **'Search'**
  String get searchTabTitle;

  /// No description provided for @watchlistTabTitle.
  ///
  /// In en, this message translates to:
  /// **'My List'**
  String get watchlistTabTitle;

  /// No description provided for @profileTabTitle.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profileTabTitle;

  /// No description provided for @homeBrand.
  ///
  /// In en, this message translates to:
  /// **'PAKISTANI SERIALS'**
  String get homeBrand;

  /// No description provided for @homeTop10Today.
  ///
  /// In en, this message translates to:
  /// **'Top 10 in Pakistan Today'**
  String get homeTop10Today;

  /// No description provided for @homeFeatured.
  ///
  /// In en, this message translates to:
  /// **'FEATURED'**
  String get homeFeatured;

  /// No description provided for @homeSeeAll.
  ///
  /// In en, this message translates to:
  /// **'See all'**
  String get homeSeeAll;

  /// No description provided for @homePlay.
  ///
  /// In en, this message translates to:
  /// **'Play'**
  String get homePlay;

  /// No description provided for @homeMyList.
  ///
  /// In en, this message translates to:
  /// **'My List'**
  String get homeMyList;

  /// No description provided for @genreAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get genreAll;

  /// No description provided for @genreRomance.
  ///
  /// In en, this message translates to:
  /// **'Romance'**
  String get genreRomance;

  /// No description provided for @genreFamily.
  ///
  /// In en, this message translates to:
  /// **'Family'**
  String get genreFamily;

  /// No description provided for @genreThriller.
  ///
  /// In en, this message translates to:
  /// **'Thriller'**
  String get genreThriller;

  /// No description provided for @genreComedy.
  ///
  /// In en, this message translates to:
  /// **'Comedy'**
  String get genreComedy;

  /// No description provided for @genreDrama.
  ///
  /// In en, this message translates to:
  /// **'Drama'**
  String get genreDrama;

  /// No description provided for @badgeNew.
  ///
  /// In en, this message translates to:
  /// **'NEW'**
  String get badgeNew;

  /// No description provided for @badgeHD.
  ///
  /// In en, this message translates to:
  /// **'HD'**
  String get badgeHD;

  /// No description provided for @badgeLive.
  ///
  /// In en, this message translates to:
  /// **'LIVE'**
  String get badgeLive;

  /// No description provided for @badgePakistaniSerial.
  ///
  /// In en, this message translates to:
  /// **'PAKISTANI SERIAL'**
  String get badgePakistaniSerial;

  /// No description provided for @statusNewSeries.
  ///
  /// In en, this message translates to:
  /// **'New Series'**
  String get statusNewSeries;

  /// No description provided for @statusOnAir.
  ///
  /// In en, this message translates to:
  /// **'On Air'**
  String get statusOnAir;

  /// No description provided for @statusUpcoming.
  ///
  /// In en, this message translates to:
  /// **'Upcoming'**
  String get statusUpcoming;

  /// No description provided for @statusComplete.
  ///
  /// In en, this message translates to:
  /// **'Complete'**
  String get statusComplete;

  /// No description provided for @statusComingSoon.
  ///
  /// In en, this message translates to:
  /// **'Coming Soon'**
  String get statusComingSoon;

  /// No description provided for @statusNewEpisodes.
  ///
  /// In en, this message translates to:
  /// **'New Episodes'**
  String get statusNewEpisodes;

  /// No description provided for @detailPlay.
  ///
  /// In en, this message translates to:
  /// **'Play'**
  String get detailPlay;

  /// No description provided for @detailMyList.
  ///
  /// In en, this message translates to:
  /// **'My List'**
  String get detailMyList;

  /// No description provided for @detailAdded.
  ///
  /// In en, this message translates to:
  /// **'Added'**
  String get detailAdded;

  /// No description provided for @detailEpisodes.
  ///
  /// In en, this message translates to:
  /// **'Episodes'**
  String get detailEpisodes;

  /// No description provided for @detailRelated.
  ///
  /// In en, this message translates to:
  /// **'More Like This'**
  String get detailRelated;

  /// No description provided for @detailCast.
  ///
  /// In en, this message translates to:
  /// **'Cast'**
  String get detailCast;

  /// No description provided for @detailSeason.
  ///
  /// In en, this message translates to:
  /// **'Season'**
  String get detailSeason;

  /// No description provided for @detailNoEpisodesYet.
  ///
  /// In en, this message translates to:
  /// **'No Episodes Yet'**
  String get detailNoEpisodesYet;

  /// No description provided for @detailEpisodesDroppingSoon.
  ///
  /// In en, this message translates to:
  /// **'Episodes dropping soon'**
  String get detailEpisodesDroppingSoon;

  /// No description provided for @sourcesTapToPlay.
  ///
  /// In en, this message translates to:
  /// **'Tap to play'**
  String get sourcesTapToPlay;

  /// No description provided for @sourcesNoServers.
  ///
  /// In en, this message translates to:
  /// **'No servers available'**
  String get sourcesNoServers;

  /// No description provided for @searchHint.
  ///
  /// In en, this message translates to:
  /// **'Search dramas'**
  String get searchHint;

  /// No description provided for @searchNoResults.
  ///
  /// In en, this message translates to:
  /// **'No results'**
  String get searchNoResults;

  /// No description provided for @watchlistTitle.
  ///
  /// In en, this message translates to:
  /// **'My List'**
  String get watchlistTitle;

  /// No description provided for @watchlistEmpty.
  ///
  /// In en, this message translates to:
  /// **'Your list is empty'**
  String get watchlistEmpty;

  /// No description provided for @watchlistBrowseDramas.
  ///
  /// In en, this message translates to:
  /// **'Browse dramas'**
  String get watchlistBrowseDramas;

  /// No description provided for @splashRetry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get splashRetry;

  /// No description provided for @splashExit.
  ///
  /// In en, this message translates to:
  /// **'Exit'**
  String get splashExit;

  /// No description provided for @settingsTitle.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settingsTitle;

  /// No description provided for @settingsLanguage.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get settingsLanguage;

  /// No description provided for @settingsTheme.
  ///
  /// In en, this message translates to:
  /// **'Theme'**
  String get settingsTheme;

  /// No description provided for @settingsLogout.
  ///
  /// In en, this message translates to:
  /// **'Log out'**
  String get settingsLogout;

  /// No description provided for @settingsAbout.
  ///
  /// In en, this message translates to:
  /// **'About'**
  String get settingsAbout;

  /// No description provided for @settingsVersion.
  ///
  /// In en, this message translates to:
  /// **'Version'**
  String get settingsVersion;

  /// No description provided for @langEnglish.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get langEnglish;

  /// No description provided for @langUrdu.
  ///
  /// In en, this message translates to:
  /// **'اردو'**
  String get langUrdu;

  /// No description provided for @langPunjabi.
  ///
  /// In en, this message translates to:
  /// **'ਪੰਜਾਬੀ'**
  String get langPunjabi;

  /// No description provided for @langHindi.
  ///
  /// In en, this message translates to:
  /// **'हिन्दी'**
  String get langHindi;

  /// No description provided for @errorGeneric.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong'**
  String get errorGeneric;

  /// No description provided for @errorNetwork.
  ///
  /// In en, this message translates to:
  /// **'No internet connection'**
  String get errorNetwork;

  /// No description provided for @errorUnauthorized.
  ///
  /// In en, this message translates to:
  /// **'Please sign in again'**
  String get errorUnauthorized;

  /// No description provided for @retry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retry;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @ok.
  ///
  /// In en, this message translates to:
  /// **'OK'**
  String get ok;

  /// No description provided for @loading.
  ///
  /// In en, this message translates to:
  /// **'Loading...'**
  String get loading;

  /// No description provided for @continueWatching.
  ///
  /// In en, this message translates to:
  /// **'Continue Watching'**
  String get continueWatching;
}

class _SDelegate extends LocalizationsDelegate<S> {
  const _SDelegate();

  @override
  Future<S> load(Locale locale) {
    return SynchronousFuture<S>(lookupS(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'hi', 'pa', 'ur'].contains(locale.languageCode);

  @override
  bool shouldReload(_SDelegate old) => false;
}

S lookupS(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return SEn();
    case 'hi':
      return SHi();
    case 'pa':
      return SPa();
    case 'ur':
      return SUr();
  }

  throw FlutterError(
    'S.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
