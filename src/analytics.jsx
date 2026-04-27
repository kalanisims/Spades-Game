import { useState, useEffect, useRef } from "react";

const SHEET_URL = "https://script.google.com/macros/s/AKfycbyjzPuRR_HLOyhNC_6v4hMYBQYXzBPho0ND8flVxXX7HXbAK_Px7pY29lh8sZEsU2ycZQ/exec";
const CONSENT_KEY = "analytics_consent";
const SESSION_START = Date.now();

function getBrowserInfo() {
  const ua = navigator.userAgent;
  let browser = "Unknown", version = "Unknown";

  if (/Edg\//.test(ua)) {
    browser = "Edge";
    version = ua.match(/Edg\/([\d.]+)/)?.[1] || "Unknown";
  } else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) {
    browser = "Chrome";
    version = ua.match(/Chrome\/([\d.]+)/)?.[1] || "Unknown";
  } else if (/Firefox\//.test(ua)) {
    browser = "Firefox";
    version = ua.match(/Firefox\/([\d.]+)/)?.[1] || "Unknown";
  } else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) {
    browser = "Safari";
    version = ua.match(/Version\/([\d.]+)/)?.[1] || "Unknown";
  } else if (/OPR\//.test(ua) || /Opera/.test(ua)) {
    browser = "Opera";
    version = ua.match(/OPR\/([\d.]+)/)?.[1] || "Unknown";
  } else if (/SamsungBrowser\//.test(ua)) {
    browser = "Samsung Browser";
    version = ua.match(/SamsungBrowser\/([\d.]+)/)?.[1] || "Unknown";
  }

  return { browser, version };
}

function getOSInfo() {
  const ua = navigator.userAgent;
  if (/Windows NT 10/.test(ua)) return "Windows 10/11";
  if (/Windows NT 6.3/.test(ua)) return "Windows 8.1";
  if (/Windows NT 6.1/.test(ua)) return "Windows 7";
  if (/Windows/.test(ua)) return "Windows";
  if (/iPhone OS/.test(ua)) return `iOS ${ua.match(/iPhone OS ([\d_]+)/)?.[1]?.replace(/_/g, ".") || ""}`;
  if (/iPad/.test(ua)) return `iPadOS ${ua.match(/OS ([\d_]+)/)?.[1]?.replace(/_/g, ".") || ""}`;
  if (/Android/.test(ua)) return `Android ${ua.match(/Android ([\d.]+)/)?.[1] || ""}`;
  if (/Mac OS X/.test(ua)) return `macOS ${ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, ".") || ""}`;
  if (/Linux/.test(ua)) return "Linux";
  if (/CrOS/.test(ua)) return "ChromeOS";
  return "Unknown OS";
}

function getDeviceType() {
  const ua = navigator.userAgent;
  if (/iPad/.test(ua)) return "Tablet";
  if (/iPhone/.test(ua)) return "Mobile (iPhone)";
  if (/Android/.test(ua) && /Mobile/.test(ua)) return "Mobile (Android)";
  if (/Android/.test(ua)) return "Tablet (Android)";
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return "Tablet (iPad)";
  return "Desktop";
}

function collectMetrics() {
  const { browser, version } = getBrowserInfo();
  const sessionDuration = Math.round((Date.now() - SESSION_START) / 1000);

  return {
    timestamp: new Date().toISOString(),
    browser,
    browserVersion: version,
    os: getOSInfo(),
    device: getDeviceType(),
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language || "Unknown",
    referrer: document.referrer || "Direct",
    sessionDuration: `${sessionDuration}s`,
  };
}

async function sendMetrics(metrics) {
  try {
    await fetch(SHEET_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metrics),
    });
  } catch (err) {
    // Silently fail — don't disrupt the user experience
    console.warn("Analytics send failed:", err);
  }
}

// ── CONSENT BANNER ────────────────────────────────────────────
export function ConsentBanner({ onConsent }) {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(CONSENT_KEY);
    if (!saved) {
      setTimeout(() => setVisible(true), 1000);
    } else if (saved === "true") {
      onConsent(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "true");
    setVisible(false);
    onConsent(true);
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, "false");
    setVisible(false);
    onConsent(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: "linear-gradient(0deg, #0a0f0a 0%, #0d1a10 100%)",
      borderTop: "1px solid #2a4a2a",
      padding: "16px 16px 24px",
      fontFamily: "'Courier New', monospace",
      boxShadow: "0 -4px 30px rgba(0,0,0,0.6)",
      animation: "slideUp 0.3s ease-out",
    }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>📊</span>
          <div>
            <div style={{ color: "#e8dfc8", fontSize: 13, fontWeight: "bold", marginBottom: 4 }}>
              Anonymous Analytics
            </div>
            <div style={{ color: "#8ab89a", fontSize: 11, lineHeight: 1.7 }}>
              We collect anonymous data about your browser and device to improve the experience.
              No personal information is collected.
            </div>
          </div>
        </div>

        {showDetails && (
          <div style={{
            background: "#0a1a0c", border: "1px solid #1a3a1a",
            borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 11,
            color: "#6a9a7a", lineHeight: 1.8
          }}>
            <div style={{ color: "#8ab89a", fontWeight: "bold", marginBottom: 6 }}>What we collect:</div>
            <div>• Browser name & version (e.g. Chrome 120)</div>
            <div>• Operating system (e.g. Android 14)</div>
            <div>• Device type (Mobile / Desktop / Tablet)</div>
            <div>• Screen resolution</div>
            <div>• Timezone & language</div>
            <div>• How you arrived (direct link, etc.)</div>
            <div>• How long you stayed</div>
            <div style={{ marginTop: 6, color: "#4a6a4a" }}>
              ✗ No IP address &nbsp;✗ No name &nbsp;✗ No location &nbsp;✗ No tracking
            </div>
          </div>
        )}

        <button
          onClick={() => setShowDetails(d => !d)}
          style={{ background: "none", border: "none", color: "#4a8a5a", fontSize: 11, cursor: "pointer", padding: 0, marginBottom: 10, fontFamily: "inherit" }}
        >
          {showDetails ? "▲ Hide details" : "▼ What data is collected?"}
        </button>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={accept} style={{
            flex: 1, background: "linear-gradient(135deg,#1a4a2a,#0d3018)",
            border: "1px solid #3a7a4a", color: "#c8e8c8",
            borderRadius: 8, padding: "10px", cursor: "pointer",
            fontSize: 12, fontFamily: "inherit", fontWeight: "bold"
          }}>
            ✓ Accept
          </button>
          <button onClick={decline} style={{
            flex: 1, background: "#0a100a",
            border: "1px solid #2a3a2a", color: "#6a8a6a",
            borderRadius: 8, padding: "10px", cursor: "pointer",
            fontSize: 12, fontFamily: "inherit"
          }}>
            ✗ Decline
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ANALYTICS HOOK ────────────────────────────────────────────
export function useAnalytics() {
  const sent = useRef(false);

  function onConsent(accepted) {
    if (accepted && !sent.current) {
      sent.current = true;
      const metrics = collectMetrics();
      sendMetrics(metrics);
      // Also send updated session duration when user leaves
      window.addEventListener("beforeunload", () => {
        const final = collectMetrics();
        sendMetrics({ ...final, sessionDuration: `${Math.round((Date.now() - SESSION_START) / 1000)}s (exit)` });
      });
    }
  }

  return { onConsent };
}
