import React, { useState, useEffect, useCallback, useRef } from "react";

/**
 * SPADES MOBILE-OPTIMIZED
 * Features: 
 * - Dynamic Viewport Height (100dvh)
 * - Overlapping card hand for small screens
 * - Touch-friendly bidding and card selection
 */

// ─── Constants & Helpers ──────────────────────────────────────────────────────
const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
const RANK_VAL = Object.fromEntries(RANKS.map((r, i) => [r, i]));
const PLAYERS = ["You", "West", "Partner", "East"];

const buildDeck = () => {
  const d = [];
  for (const s of SUITS) for (const r of RANKS) d.push({ suit: s, rank: r });
  return d;
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const cardVal = (card) => RANK_VAL[card.rank];
const isSpade = (c) => c.suit === "♠";
const suitColor = (s) => (s === "♥" || s === "♦" ? "#e05b5b" : "#e8e0d4");

const beatsTrick = (trick, candidate) => {
  if (trick.length === 0) return true;
  const led = trick[0].card.suit;
  const cSpade = isSpade(candidate);
  const currentWinner = trick.reduce((w, t) => {
    const tw = t.card;
    if (isSpade(tw) && !isSpade(w.card)) return t;
    if (!isSpade(tw) && isSpade(w.card)) return w;
    if (tw.suit === w.card.suit && cardVal(tw) > cardVal(w.card)) return t;
    return w;
  }, trick[0]);

  if (cSpade) {
    if (isSpade(currentWinner.card)) return cardVal(candidate) > cardVal(currentWinner.card);
    return true;
  }
  if (candidate.suit === led) {
    if (isSpade(currentWinner.card)) return false;
    return cardVal(candidate) > cardVal(currentWinner.card);
  }
  return false;
};

const aiChooseCard = (hand, trick, spadesBroken) => {
  const led = trick.length > 0 ? trick[0].card.suit : null;
  let playable = led ? (hand.filter(c => c.suit === led).length > 0 ? hand.filter(c => c.suit === led) : hand) : 
                ((!spadesBroken && hand.filter(c => !isSpade(c)).length > 0) ? hand.filter(c => !isSpade(c)) : hand);
  
  const winners = playable.filter(c => beatsTrick(trick, c));
  return winners.length > 0 ? winners.reduce((a, b) => cardVal(a) < cardVal(b) ? a : b) : playable.reduce((a, b) => cardVal(a) < cardVal(b) ? a : b);
};

const calcScore = (bids, tricksWon) => {
  const scores = [0, 0];
  const bags = [0, 0];
  for (let team = 0; team < 2; team++) {
    const bid = bids[team] + bids[team + 2];
    const won = tricksWon[team] + tricksWon[team + 2];
    if (bid === 0) { scores[team] = won === 0 ? 100 : -100; }
    else if (won >= bid) {
      const over = won - bid;
      scores[team] = bid * 10 + over;
      bags[team] = over;
    } else { scores[team] = -(bid * 10); }
  }
  return { scores, bags };
};

// ─── Card Component ────────────────────────────────────────────────────────────
function Card({ card, onClick, selected, disabled, small, faceDown, overlap }) {
  const width = small ? 32 : 48;
  const height = small ? 46 : 68;
  
  if (faceDown) {
    return (
      <div style={{
        width, height, borderRadius: 4, background: "linear-gradient(135deg,#1a3a5c,#0d2035)",
        border: "1px solid #2a5a8c", marginLeft: overlap ? "-18px" : "0", boxShadow: "0 1px 3px rgba(0,0,0,0.5)"
      }} />
    );
  }
  const col = suitColor(card.suit);
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      style={{
        width, height, borderRadius: 4, background: selected ? "#fffde0" : "#faf5ec",
        border: selected ? "2px solid #f0c040" : "1px solid #c8b89a",
        display: "flex", flexDirection: "column", padding: "2px",
        boxShadow: selected ? "0 0 8px #f0c040" : "0 1px 3px rgba(0,0,0,0.3)",
        transform: selected ? "translateY(-8px)" : "none",
        transition: "transform 0.1s", marginLeft: overlap ? "-20px" : "0",
        zIndex: selected ? 100 : "auto", cursor: "pointer", userSelect: "none"
      }}
    >
      <div style={{ color: col, fontSize: small ? 10 : 12, fontWeight: "bold", lineHeight: 1 }}>
        {card.rank}<br/>{card.suit}
      </div>
    </div>
  );
}

// ─── Main Game ─────────────────────────────────────────────────────────────────
export default function SpadesGame() {
  const [phase, setPhase] = useState("menu");
  const [hands, setHands] = useState([[], [], [], []]);
  const [bids, setBids] = useState([0, 0, 0, 0]);
  const [currentBidder, setCurrentBidder] = useState(0);
  const [trick, setTrick] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [spadesBroken, setSpadesBroken] = useState(false);
  const [tricksWon, setTricksWon] = useState([0, 0, 0, 0]);
  const [totalScores, setTotalScores] = useState([0, 0]);
  const [selectedCard, setSelectedCard] = useState(null);
  
  const aiTimer = useRef(null);

  const dealRound = useCallback(() => {
    const deck = shuffle(buildDeck());
    const h = [[], [], [], []];
    deck.forEach((c, i) => h[i % 4].push(c));
    h.forEach(hand => hand.sort((a, b) => 
      SUITS.indexOf(a.suit) !== SUITS.indexOf(b.suit) ? 
      SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit) : 
      cardVal(a) - cardVal(b)
    ));
    setHands(h);
    setBids([0, 0, 0, 0]);
    setTrick([]);
    setSpadesBroken(false);
    setTricksWon([0, 0, 0, 0]);
    setPhase("bid");
    setCurrentBidder(0);
  }, []);

  // AI Bidding Logic
  useEffect(() => {
    if (phase === "bid" && currentBidder !== 0) {
      const t = setTimeout(() => {
        const bid = Math.max(1, Math.min(hands[currentBidder].filter(c => isSpade(c) || c.rank === "A").length, 7));
        setBids(prev => { const n = [...prev]; n[currentBidder] = bid; return n; });
        if (currentBidder === 3) { setPhase("play"); setCurrentPlayer(0); }
        else { setCurrentBidder(c => c + 1); }
      }, 400);
      return () => clearTimeout(t);
    }
  }, [phase, currentBidder, hands]);

  // AI Playing Logic
  useEffect(() => {
    if (phase === "play" && currentPlayer !== 0) {
      aiTimer.current = setTimeout(() => {
        const card = aiChooseCard(hands[currentPlayer], trick, spadesBroken);
        if (card) playCard(currentPlayer, card);
      }, 600);
      return () => clearTimeout(aiTimer.current);
    }
  }, [phase, currentPlayer, trick, hands, spadesBroken]);

  function playCard(pIdx, card) {
    const nextTrick = [...trick, { player: pIdx, card }];
    setHands(h => h.map((hand, i) => i === pIdx ? hand.filter(c => c !== card) : hand));
    setTrick(nextTrick);
    setSpadesBroken(prev => prev || isSpade(card));
    setSelectedCard(null);

    if (nextTrick.length === 4) {
      setTimeout(() => {
        let winEntry = nextTrick[0];
        const led = nextTrick[0].card.suit;
        for (let i = 1; i < 4; i++) {
          const c = nextTrick[i].card;
          const w = winEntry.card;
          if ((isSpade(c) && !isSpade(w)) || (c.suit === w.suit && cardVal(c) > cardVal(w)) || (c.suit === led && w.suit !== led && !isSpade(w))) {
            winEntry = nextTrick[i];
          }
        }
        const winner = winEntry.player;
        const newTricks = [...tricksWon]; newTricks[winner]++;
        setTricksWon(newTricks);
        setTrick([]);
        
        if (hands[0].length === 1 && pIdx === 0) { // Check if round over (last card played)
           const { scores } = calcScore(bids, newTricks);
           setTotalScores(s => [s[0] + scores[0], s[1] + scores[1]]);
           setPhase("roundEnd");
        } else {
          setCurrentPlayer(winner);
        }
      }, 800);
    } else {
      setCurrentPlayer((pIdx + 1) % 4);
    }
  }

  const containerStyle = {
    height: "100dvh", width: "100vw", background: "radial-gradient(circle, #1e5c38 0%, #11331f 100%)",
    display: "flex", flexDirection: "column", overflow: "hidden", touchAction: "none",
    fontFamily: "serif", color: "#e8dfc8", boxSizing: "border-box", padding: "8px"
  };

  if (phase === "menu") return (
    <div style={containerStyle}>
      <div style={{ margin: "auto", textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", letterSpacing: "5px" }}>SPADES</h1>
        <button onClick={dealRound} style={{ padding: "12px 40px", fontSize: "1.2rem", background: "#2a7a4a", border: "1px solid #4aaa6a", color: "white", borderRadius: "8px" }}>DEAL</button>
      </div>
    </div>
  );

  if (phase === "roundEnd") return (
    <div style={containerStyle}>
       <div style={{ margin: "auto", textAlign: "center", background: "rgba(0,0,0,0.3)", padding: "20px", borderRadius: "12px" }}>
          <h2>Round Over</h2>
          <p>Us: {totalScores[0]} | Them: {totalScores[1]}</p>
          <button onClick={dealRound} style={{ padding: "10px 20px", background: "#2a7a4a", border: "none", color: "white", borderRadius: "5px" }}>Next Round</button>
       </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      {/* Top: Partner */}
      <div style={{ height: "60px", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "flex", paddingLeft: "20px" }}>
          {hands[2].map((_, i) => <Card key={i} faceDown small overlap />)}
        </div>
      </div>

      {/* Middle: Score Bar */}
      <div style={{ display: "flex", justifyContent: "space-around", fontSize: "0.8rem", padding: "5px 0" }}>
        <div style={{ textAlign: "center" }}>Us: <b>{totalScores[0]}</b><br/>Bid {bids[0]+bids[2]} Won {tricksWon[0]+tricksWon[2]}</div>
        <div style={{ textAlign: "center" }}>Them: <b>{totalScores[1]}</b><br/>Bid {bids[1]+bids[3]} Won {tricksWon[1]+tricksWon[3]}</div>
      </div>

      {/* Play Area */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div style={{ position: "absolute", left: "0", top: "50%", transform: "translateY(-50%) rotate(90deg)" }}>
          <div style={{ display: "flex" }}>{hands[1].slice(0,6).map((_, i) => <Card key={i} faceDown small overlap />)}</div>
        </div>

        <div style={{ width: "100px", height: "100px", position: "relative" }}>
          {trick.map((t, i) => {
            const pos = [
              { bottom: -20, left: "50%", transform: "translateX(-50%)" },
              { left: -20, top: "50%", transform: "translateY(-50%)" },
              { top: -20, left: "50%", transform: "translateX(-50%)" },
              { right: -20, top: "50%", transform: "translateY(-50%)" }
            ][t.player];
            return <div key={i} style={{ position: "absolute", ...pos }}><Card card={t.card} small /></div>;
          })}
        </div>

        <div style={{ position: "absolute", right: "0", top: "50%", transform: "translateY(-50%) rotate(-90deg)" }}>
          <div style={{ display: "flex" }}>{hands[3].slice(0,6).map((_, i) => <Card key={i} faceDown small overlap />)}</div>
        </div>
      </div>

      {/* Status Message */}
      <div style={{ height: "30px", textAlign: "center", fontSize: "0.9rem", color: "#6dda8a" }}>
        {phase === "bid" ? (currentBidder === 0 ? "Your Bid" : `${PLAYERS[currentBidder]} is bidding...`) : (currentPlayer === 0 ? "Your Turn" : "")}
      </div>

      {/* Player Action Area */}
      <div style={{ height: "120px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", paddingBottom: "10px" }}>
        {phase === "bid" && currentBidder === 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px" }}>
            {[0,1,2,3,4,5,6].map(n => (
              <button key={n} onClick={() => { 
                setBids(b => {const nb=[...b]; nb[0]=n; return nb;}); 
                setCurrentBidder(1); 
              }} style={{ width: "38px", height: "38px", borderRadius: "50%", border: "1px solid #4aaa6a", background: "#1a3a22", color: "white", fontWeight: "bold" }}>{n}</button>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", paddingLeft: "20px" }}>
            {hands[0].map((c, i) => (
              <Card 
                key={i} card={c} overlap 
                selected={selectedCard === c} 
                onClick={() => {
                  if (currentPlayer !== 0) return;
                  if (selectedCard === c) playCard(0, c);
                  else setSelectedCard(c);
                }} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
