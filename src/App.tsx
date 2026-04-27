import { useState } from "react";
import SpadesGame from './spades-1.jsx';
import PokemonGame from './PokemonGame.jsx';
import { ConsentBanner, useAnalytics } from './analytics.jsx';

export default function App() {
  const [activeGame, setActiveGame] = useState(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const { onConsent } = useAnalytics();

  function handleConsent(accepted) {
    setConsentGiven(true);
    onConsent(accepted);
  }

  if (activeGame === "spades") {
    return (
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setActiveGame(null)}
          style={{
            position: "fixed", top: 12, left: 12, zIndex: 999,
            background: "#0d2010", border: "1px solid #2a5a3a",
            color: "#8ab89a", borderRadius: 6, padding: "5px 12px",
            fontSize: 12, cursor: "pointer", fontFamily: "Georgia, serif"
          }}
        >
          ← Home
        </button>
        <SpadesGame />
      </div>
    );
  }

  if (activeGame === "pokemon") {
    return (
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setActiveGame(null)}
          style={{
            position: "fixed", top: 12, left: 12, zIndex: 999,
            background: "#0d1a10", border: "1px solid #1a4a28",
            color: "#8ab89a", borderRadius: 6, padding: "5px 12px",
            fontSize: 12, cursor: "pointer", fontFamily: "'Courier New', monospace"
          }}
        >
          ← Home
        </button>
        <PokemonGame />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0a0a1a 0%, #0d1a10 50%, #1a0a0a 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "Georgia, serif", color: "#e8dfc8",
      padding: 24, boxSizing: "border-box"
    }}>

      {/* Consent banner */}
      <ConsentBanner onConsent={handleConsent} />

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontSize: 11, letterSpacing: 6, color: "#4a6a5a", marginBottom: 8, textTransform: "uppercase" }}>
          Game Library
        </div>
        <h1 style={{
          fontSize: 36, margin: 0, letterSpacing: 4,
          background: "linear-gradient(135deg, #ffd700, #88ccff, #88dd88)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          textTransform: "uppercase"
        }}>
          Arcade
        </h1>
        <div style={{ fontSize: 12, color: "#3a5a4a", marginTop: 6, letterSpacing: 2 }}>
          Choose your game
        </div>
      </div>

      {/* Game cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 380 }}>

        {/* Spades */}
        <button
          onClick={() => setActiveGame("spades")}
          style={{
            background: "linear-gradient(135deg, #0d2010 0%, #1a3a22 100%)",
            border: "1px solid #2a6a3a", borderRadius: 16, padding: "20px 24px",
            cursor: "pointer", textAlign: "left", transition: "all 0.2s",
            color: "#e8dfc8", boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
          }}
          onMouseEnter={e => e.currentTarget.style.border = "1px solid #4aaa6a"}
          onMouseLeave={e => e.currentTarget.style.border = "1px solid #2a6a3a"}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              fontSize: 48, width: 64, height: 64, background: "#0a1a0c",
              borderRadius: 12, display: "flex", alignItems: "center",
              justifyContent: "center", border: "1px solid #1a4a28", flexShrink: 0
            }}>♠</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: "bold", marginBottom: 4, letterSpacing: 2 }}>SPADES</div>
              <div style={{ fontSize: 12, color: "#6a9a7a", lineHeight: 1.6 }}>
                Classic trick-taking card game.<br />You vs 3 AI opponents.
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {["Card Game", "4 Players", "Offline"].map(tag => (
                  <span key={tag} style={{ background: "#0a2010", border: "1px solid #1a4a28", borderRadius: 20, padding: "2px 8px", fontSize: 10, color: "#4a8a5a" }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </button>

        {/* Pokemon */}
        <button
          onClick={() => setActiveGame("pokemon")}
          style={{
            background: "linear-gradient(135deg, #0d1a2e 0%, #1a2a4a 100%)",
            border: "1px solid #2a4a8a", borderRadius: 16, padding: "20px 24px",
            cursor: "pointer", textAlign: "left", transition: "all 0.2s",
            color: "#e8dfc8", boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
          }}
          onMouseEnter={e => e.currentTarget.style.border = "1px solid #4a7aff"}
          onMouseLeave={e => e.currentTarget.style.border = "1px solid #2a4a8a"}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              fontSize: 40, width: 64, height: 64, background: "#0a101a",
              borderRadius: 12, display: "flex", alignItems: "center",
              justifyContent: "center", border: "1px solid #1a2a4a", flexShrink: 0
            }}>⚔️🌸</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: "bold", marginBottom: 4, letterSpacing: 2 }}>POKÉMON</div>
              <div style={{ fontSize: 12, color: "#6a8aaa", lineHeight: 1.6 }}>
                Full Kalos region RPG.<br />8 Gyms • Elite Four • Champion.
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {["RPG", "Kalos", "Turn-Based"].map(tag => (
                  <span key={tag} style={{ background: "#0a1020", border: "1px solid #1a2a4a", borderRadius: 20, padding: "2px 8px", fontSize: 10, color: "#4a6a9a" }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </button>

      </div>

      {/* Footer */}
      <div style={{ marginTop: 40, textAlign: "center" }}>
        <div style={{ color: "#2a4a3a", fontSize: 11, letterSpacing: 2, marginBottom: 12 }}>
          MORE GAMES COMING SOON
        </div>
        <button
          onClick={() => setActiveGame("privacy")}
          style={{ background: "none", border: "none", color: "#2a4a3a", fontSize: 10, cursor: "pointer", fontFamily: "inherit", letterSpacing: 1, textDecoration: "underline" }}
        >
          Privacy Policy
        </button>
      </div>
    </div>
  );
}
