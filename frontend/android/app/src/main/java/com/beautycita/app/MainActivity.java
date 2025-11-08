package com.beautycita.app;

import android.os.Bundle;
import android.view.MotionEvent;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Disable pull-to-refresh and configure zoom settings
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebSettings webSettings = this.bridge.getWebView().getSettings();

            // Disable zoom controls
            webSettings.setBuiltInZoomControls(false);
            webSettings.setDisplayZoomControls(false);
            webSettings.setSupportZoom(false);

            // Disable overscroll (pull-to-refresh effect)
            this.bridge.getWebView().setOverScrollMode(android.view.View.OVER_SCROLL_NEVER);
        }
    }
}
