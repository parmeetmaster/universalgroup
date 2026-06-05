.PHONY: help
.DEFAULT_GOAL := help

# ─── Colors ──────────────────────────────────────────────
CYAN  = \033[36m
GREEN = \033[32m
BOLD  = \033[1m
RESET = \033[0m

help: ## Show all available commands
	@echo ""
	@echo "$(BOLD)Universal Apps — Command Center$(RESET)"
	@echo ""
	@echo "$(GREEN)Backend / Dashboard$(RESET)"
	@grep -E '^(backend|dashboard)-[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)make %-30s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Aviation News$(RESET)"
	@grep -E '^aviation-[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)make %-30s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Pakistani Serials$(RESET)"
	@grep -E '^pak-[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)make %-30s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Video Downloader$(RESET)"
	@grep -E '^video-[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)make %-30s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Manga Browser$(RESET)"
	@grep -E '^manga-[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)make %-30s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# ══════════════════════════════════════════════════════════
# Backend (NestJS) + Dashboard (Next.js)
# ══════════════════════════════════════════════════════════

backend-build: ## Build NestJS backend
	npx tsc --project nest/tsconfig.json

dashboard-build: ## Build Next.js dashboard
	npm run build

dashboard-dev: ## Start Next.js dev server (port 3000)
	npm run dev

dashboard-lint: ## Lint Next.js code
	npm run lint

backend-deploy: ## Deploy NestJS + Next.js to production
	bash deploy.sh

# ══════════════════════════════════════════════════════════
# Aviation News (Flutter)
# ══════════════════════════════════════════════════════════

AVIATION_DIR = aviation_news_2
AVIATION_FASTLANE = cd $(AVIATION_DIR)/android && /opt/homebrew/opt/ruby/bin/bundle exec fastlane android
AVIATION_FIREBASE_APP_ID = 1:523354523469:android:527aaf01a0dd87df8e1904
AVIATION_APK = $(AVIATION_DIR)/build/app/outputs/flutter-apk/app-release.apk

aviation-deploy-internal: ## Bump version + build + upload to Play Store internal + Firebase
	$(AVIATION_FASTLANE) deploy_internal

aviation-deploy-prod: ## Bump version + build + upload to Play Store production + Firebase
	$(AVIATION_FASTLANE) deploy_prod

aviation-upload-internal: ## Build + upload to internal (no version bump)
	$(AVIATION_FASTLANE) upload_internal

aviation-upload-prod: ## Build + upload to production (no version bump)
	$(AVIATION_FASTLANE) upload_prod

aviation-promote: ## Promote internal build to production (no rebuild)
	$(AVIATION_FASTLANE) promote_to_prod

aviation-firebase: ## Build APK + distribute via Firebase App Distribution
	cd $(AVIATION_DIR) && fvm flutter build apk --release
	firebase appdistribution:distribute $(AVIATION_APK) \
		--app $(AVIATION_FIREBASE_APP_ID) \
		--testers "parmeetyash@gmail.com" \
		--release-notes "Aviation build $$(date '+%Y-%m-%d %H:%M')"

aviation-build: ## Build release AAB
	cd $(AVIATION_DIR) && fvm flutter build appbundle --release

aviation-clean: ## Clean build outputs
	cd $(AVIATION_DIR) && fvm flutter clean

aviation-version: ## Show current version
	@grep '^version:' $(AVIATION_DIR)/pubspec.yaml

aviation-bump: ## Bump patch version (e.g. 1.1.7+17 → 1.1.8+18)
	@cd $(AVIATION_DIR) && \
	V=$$(grep '^version:' pubspec.yaml | sed 's/version: //'); \
	MAJOR=$$(echo $$V | cut -d. -f1); \
	MINOR=$$(echo $$V | cut -d. -f2); \
	PATCH=$$(echo $$V | cut -d. -f3 | cut -d+ -f1); \
	CODE=$$(echo $$V | cut -d+ -f2); \
	NEW_PATCH=$$((PATCH + 1)); NEW_CODE=$$((CODE + 1)); \
	NEW="$$MAJOR.$$MINOR.$$NEW_PATCH+$$NEW_CODE"; \
	sed -i '' "s/^version: .*/version: $$NEW/" pubspec.yaml; \
	echo "aviation: $$V → $$NEW"

# ══════════════════════════════════════════════════════════
# Pakistani Serials (Flutter)
# ══════════════════════════════════════════════════════════

PAK_DIR = pakistani_serials
PAK_FASTLANE = cd $(PAK_DIR)/android && fastlane android
PAK_API_URL = http://pak-ott.animekill.com/v1

pak-deploy-internal: ## Bump version + build + upload to Play Store internal
	$(PAK_FASTLANE) deploy_internal

pak-deploy-prod: ## Bump version + build + upload to Play Store production
	$(PAK_FASTLANE) deploy_prod

pak-build: ## Build release AAB with API URL
	cd $(PAK_DIR) && fvm flutter build appbundle --release --dart-define=API_BASE_URL=$(PAK_API_URL)

pak-clean: ## Clean build outputs
	cd $(PAK_DIR) && fvm flutter clean

pak-version: ## Show current version
	@grep '^version:' $(PAK_DIR)/pubspec.yaml

pak-bump: ## Bump patch version (e.g. 1.0.0+3 → 1.0.1+4)
	@cd $(PAK_DIR) && \
	V=$$(grep '^version:' pubspec.yaml | sed 's/version: //'); \
	MAJOR=$$(echo $$V | cut -d. -f1); \
	MINOR=$$(echo $$V | cut -d. -f2); \
	PATCH=$$(echo $$V | cut -d. -f3 | cut -d+ -f1); \
	CODE=$$(echo $$V | cut -d+ -f2); \
	NEW_PATCH=$$((PATCH + 1)); NEW_CODE=$$((CODE + 1)); \
	NEW="$$MAJOR.$$MINOR.$$NEW_PATCH+$$NEW_CODE"; \
	sed -i '' "s/^version: .*/version: $$NEW/" pubspec.yaml; \
	echo "pak: $$V → $$NEW"

# ══════════════════════════════════════════════════════════
# Video Downloader (Kotlin)
# ══════════════════════════════════════════════════════════

VIDEO_DIR = super-video-downloader
VIDEO_FASTLANE = cd $(VIDEO_DIR) && fastlane android
VIDEO_FIREBASE_APP_ID = 1:589463373111:android:e97e8f475f50dec07086b2
VIDEO_APK_DEBUG = $(VIDEO_DIR)/app/build/outputs/apk/debug/app-arm64-v8a-debug.apk
VIDEO_APK_RELEASE = $(VIDEO_DIR)/app/build/outputs/apk/release/app-universal-release.apk

video-deploy-internal: ## Bump version + build + upload to Play Store internal + Firebase
	$(VIDEO_FASTLANE) deploy_internal

video-deploy-prod: ## Bump version + build + upload to Play Store production + Firebase
	$(VIDEO_FASTLANE) deploy_prod

video-upload-internal: ## Build + upload to internal (no version bump)
	$(VIDEO_FASTLANE) upload_internal

video-upload-prod: ## Build + upload to production (no version bump)
	$(VIDEO_FASTLANE) upload_prod

video-promote: ## Promote internal build to production (no rebuild)
	$(VIDEO_FASTLANE) promote_to_prod

video-firebase: ## Build debug APK + distribute via Firebase App Distribution
	cd $(VIDEO_DIR) && ./gradlew assembleDebug
	firebase appdistribution:distribute $(VIDEO_APK_DEBUG) \
		--app $(VIDEO_FIREBASE_APP_ID) \
		--groups "testers" \
		--release-notes "Debug build $$(date '+%Y-%m-%d %H:%M')"

video-firebase-release: ## Build release APK + distribute via Firebase
	cd $(VIDEO_DIR) && ./gradlew assembleRelease
	firebase appdistribution:distribute $(VIDEO_APK_RELEASE) \
		--app $(VIDEO_FIREBASE_APP_ID) \
		--groups "testers" \
		--release-notes "Release APK $$(date '+%Y-%m-%d %H:%M')"

video-build: ## Build release bundle (AAB)
	cd $(VIDEO_DIR) && ./gradlew bundleRelease

video-install: ## Build debug + install on connected device
	cd $(VIDEO_DIR) && ./gradlew assembleDebug
	adb install -r $(VIDEO_APK_DEBUG)

video-clean: ## Clean build outputs
	cd $(VIDEO_DIR) && ./gradlew clean

video-version: ## Show current version
	@grep -E 'versionName|versionCode' $(VIDEO_DIR)/app/build.gradle.kts | head -2

video-bump: ## Bump patch version (e.g. 0.8.59/234 → 0.8.60/235)
	@GRADLE=$(VIDEO_DIR)/app/build.gradle.kts; \
	CODE=$$(grep -m1 'versionCode' $$GRADLE | sed 's/[^0-9]//g'); \
	NAME=$$(grep -m1 'versionName' $$GRADLE | sed 's/.*"\(.*\)".*/\1/'); \
	MAJOR=$$(echo $$NAME | cut -d. -f1); \
	MINOR=$$(echo $$NAME | cut -d. -f2); \
	PATCH=$$(echo $$NAME | cut -d. -f3); \
	NEW_PATCH=$$((PATCH + 1)); NEW_CODE=$$((CODE + 1)); \
	NEW_NAME="$$MAJOR.$$MINOR.$$NEW_PATCH"; \
	sed -i '' "s/versionCode = $$CODE/versionCode = $$NEW_CODE/" $$GRADLE; \
	sed -i '' "s/versionName = \"$$NAME\"/versionName = \"$$NEW_NAME\"/" $$GRADLE; \
	echo "video: $$NAME ($$CODE) → $$NEW_NAME ($$NEW_CODE)"

# ══════════════════════════════════════════════════════════
# Manga Browser (Flutter)
# ══════════════════════════════════════════════════════════

MANGA_DIR = manga browser
MANGA_FASTLANE = cd "$(MANGA_DIR)/android" && fastlane android

manga-deploy-internal: ## Bump version + build + upload to Play Store internal
	$(MANGA_FASTLANE) deploy_internal

manga-deploy-prod: ## Bump version + build + upload to Play Store production
	$(MANGA_FASTLANE) deploy_prod

manga-build: ## Build release AAB
	cd "$(MANGA_DIR)" && fvm flutter build appbundle --release

manga-clean: ## Clean build outputs
	cd "$(MANGA_DIR)" && fvm flutter clean

manga-version: ## Show current version
	@grep '^version:' "$(MANGA_DIR)/pubspec.yaml"

manga-bump: ## Bump patch version (e.g. 1.0.6+7 → 1.0.7+8)
	@cd "$(MANGA_DIR)" && \
	V=$$(grep '^version:' pubspec.yaml | sed 's/version: //'); \
	MAJOR=$$(echo $$V | cut -d. -f1); \
	MINOR=$$(echo $$V | cut -d. -f2); \
	PATCH=$$(echo $$V | cut -d. -f3 | cut -d+ -f1); \
	CODE=$$(echo $$V | cut -d+ -f2); \
	NEW_PATCH=$$((PATCH + 1)); NEW_CODE=$$((CODE + 1)); \
	NEW="$$MAJOR.$$MINOR.$$NEW_PATCH+$$NEW_CODE"; \
	sed -i '' "s/^version: .*/version: $$NEW/" pubspec.yaml; \
	echo "manga: $$V → $$NEW"
