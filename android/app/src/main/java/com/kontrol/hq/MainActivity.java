package com.kontrol.hq;

import android.os.Bundle;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    /**
     * Keep track of whether the WebView has finished its first page load.
     * The splash screen's keep-visible condition checks this flag.
     */
    private boolean webViewReady = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Install the AndroidX SplashScreen BEFORE super.onCreate() so the
        // launch theme (AppTheme.NoActionBarLaunch → @drawable/splash) is kept
        // visible while the WebView loads the remote URL.
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);

        // Keep the splash on screen until the Capacitor bridge signals ready.
        // This prevents the blank-WebView flash on Android 12+.
        splashScreen.setKeepOnScreenCondition(() -> !webViewReady);

        super.onCreate(savedInstanceState);
    }

    /**
     * Called by the Capacitor SplashScreen plugin when launchAutoHide is false
     * and SplashScreen.hide() is invoked from JavaScript.
     */
    @Override
    public void onStart() {
        super.onStart();

        // Listen for the bridge's page-load event so we can lift the keep
        // condition once the first Inertia page has rendered.
        if (getBridge() != null) {
            getBridge().getWebView().addOnAttachStateChangeListener(
                new android.view.View.OnAttachStateChangeListener() {
                    @Override
                    public void onViewAttachedToWindow(android.view.View v) {
                        getBridge().getWebView().setWebViewClient(new android.webkit.WebViewClient() {
                            private boolean firstLoad = true;

                            @Override
                            public void onPageFinished(android.webkit.WebView view, String url) {
                                super.onPageFinished(view, url);
                                if (firstLoad) {
                                    firstLoad = false;
                                    // Small delay so the JS AppLoader has painted before
                                    // we release the splash screen condition.
                                    view.postDelayed(() -> webViewReady = true, 400);
                                }
                            }
                        });
                    }

                    @Override
                    public void onViewDetachedFromWindow(android.view.View v) {}
                }
            );
        }
    }
}
