package com.kontrol.hq;

import android.os.Bundle;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Install the AndroidX SplashScreen BEFORE super.onCreate() so the
        // launch theme (AppTheme.NoActionBarLaunch → @drawable/splash) is kept
        // visible while the WebView starts.
        SplashScreen.installSplashScreen(this);

        super.onCreate(savedInstanceState);
    }
}
