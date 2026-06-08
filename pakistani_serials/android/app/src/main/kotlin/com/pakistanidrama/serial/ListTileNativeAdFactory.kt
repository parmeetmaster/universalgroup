package com.pakistanidrama.serial

import android.content.Context
import android.view.LayoutInflater
import android.widget.TextView
import com.google.android.gms.ads.nativead.MediaView
import com.google.android.gms.ads.nativead.NativeAd
import com.google.android.gms.ads.nativead.NativeAdView
import io.flutter.plugins.googlemobileads.GoogleMobileAdsPlugin

class ListTileNativeAdFactory(private val context: Context) :
    GoogleMobileAdsPlugin.NativeAdFactory {

    override fun createNativeAd(
        nativeAd: NativeAd,
        customOptions: MutableMap<String, Any>?
    ): NativeAdView {
        val adView = LayoutInflater.from(context)
            .inflate(R.layout.native_ad_list_tile, null) as NativeAdView

        val headlineView = adView.findViewById<TextView>(R.id.ad_headline)
        val bodyView = adView.findViewById<TextView>(R.id.ad_body)
        val mediaView = adView.findViewById<MediaView>(R.id.ad_media)
        val callToActionView = adView.findViewById<TextView>(R.id.ad_call_to_action)

        headlineView.text = nativeAd.headline
        bodyView.text = nativeAd.body ?: ""
        callToActionView.text = nativeAd.callToAction ?: "Learn More"

        // Main image/video asset must be shown via MediaView (AdMob policy)
        nativeAd.mediaContent?.let { mediaView.mediaContent = it }

        adView.headlineView = headlineView
        adView.bodyView = bodyView
        adView.mediaView = mediaView
        adView.callToActionView = callToActionView
        adView.setNativeAd(nativeAd)

        return adView
    }
}
