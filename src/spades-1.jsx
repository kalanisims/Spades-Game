import { useState, useEffect, useCallback, useRef } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
const RANK_VAL = Object.fromEntries(RANKS.map((r, i) => [r, i]));
const PLAYERS = ["You", "West", "Partner", "East"];
const TEAM_NAMES = ["Us", "Them"];

function buildDeck() {
  const d = [];
  for (const s of SUITS) for (const r of RANKS) d.push({ suit: s, rank: r });
  return d;
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function cardVal(card) {
  return RANK_VAL[card.rank];
}
function isSpade(c) { return c.suit === "♠"; }
function suitColor(s) { return s === "♥" || s === "♦" ? "#e05b5b" : "#e8e0d4"; }

function beatsTrick(trick, candidate, spadesBroken) {
  if (trick.length === 0) return true;
  const led = trick[0].card.suit;
  const cSuit = candidate.suit;
  const cSpade = isSpade(candidate);
  const hasSpadeWinner = trick.some(t => isSpade(t.card));
  const currentWinner = trick.reduce((w, t) => {
    const tw = t.card;
    if (isSpade(tw) && !isSpade(w.card)) return t;
    if (!isSpade(tw) && isSpade(w.card)) return w;
    if (tw.suit === w.card.suit && cardVal(tw) > cardVal(w.card)) return t;
    return w;
  }, trick[0]);

  if (cSpade) {
    if (hasSpadeWinner) return cardVal(candidate) > cardVal(currentWinner.card);
    return true;
  }
  if (cSuit === led) {
    if (hasSpadeWinner) return false;
    return cardVal(candidate) > cardVal(currentWinner.card);
  }
  return false;
}

function aiChooseCard(hand, trick, spadesBroken, bids, tricks) {
  const led = trick.length > 0 ? trick[0].card.suit : null;
  let playable;
  if (led) {
    const suited = hand.filter(c => c.suit === led);
    playable = suited.length > 0 ? suited : hand;
  } else {
    const nonSpade = hand.filter(c => !isSpade(c));
    playable = (!spadesBroken && nonSpade.length > 0) ? nonSpade : hand;
  }
  // Try to win if possible
  const winners = playable.filter(c => beatsTrick(trick, c, spadesBroken));
  if (winners.length > 0) {
    return winners.reduce((a, b) => cardVal(a) < cardVal(b) ? a : b);
  }
  // Dump lowest
  return playable.reduce((a, b) => cardVal(a) < cardVal(b) ? a : b);
}

function calcScore(bids, tricksWon) {
  const scores = [0, 0];
  const bags = [0, 0];
  for (let team = 0; team < 2; team++) {
    const p1 = team, p2 = team + 2;
    const bid = bids[p1] + bids[p2];
    const won = tricksWon[p1] + tricksWon[p2];
    if (bid === 0) {
      scores[team] = won === 0 ? 100 : -100;
    } else if (won >= bid) {
      const over = won - bid;
      scores[team] = bid * 10 + over;
      bags[team] = over;
    } else {
      scores[team] = -(bid * 10);
    }
  }
  return { scores, bags };
}

// ─── Card Component ────────────────────────────────────────────────────────────
function Card({ card, onClick, selected, disabled, small, faceDown }) {
  if (faceDown) {
    return (
      <div style={{
        width: small ? 36 : 52, height: small ? 52 : 76,
        borderRadius: 6, background: "linear-gradient(135deg,#1a3a5c,#0d2035)",
        border: "2px solid #2a5a8c", cursor: "default", flexShrink: 0,
        display:"flex",alignItems:"center",justifyContent:"center",
        boxShadow:"0 2px 6px rgba(0,0,0,0.5)"
      }}>
        <span style={{color:"#2a5a8c",fontSize:small?14:20}}>♠</span>
      </div>
    );
  }
  const col = suitColor(card.suit);
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      style={{
        width: small ? 36 : 52, height: small ? 52 : 76,
        borderRadius: 6, background: selected ? "#fffde0" : "#faf5ec",
        border: selected ? "2px solid #f0c040" : "2px solid #c8b89a",
        cursor: disabled ? "default" : "pointer",
        display: "flex", flexDirection: "column",
        alignItems: "flex-start", justifyContent: "space-between",
        padding: small ? "2px 4px" : "4px 6px",
        boxShadow: selected ? "0 0 10px #f0c04088" : "0 2px 6px rgba(0,0,0,0.35)",
        transform: selected ? "translateY(-10px)" : "none",
        transition: "transform 0.15s, box-shadow 0.15s",
        flexShrink: 0, userSelect: "none",
      }}
    >
      <div style={{ color: col, fontSize: small ? 11 : 14, fontFamily:"'Georgia',serif", fontWeight:"bold", lineHeight:1 }}>
        {card.rank}<br/>{card.suit}
      </div>
      {!small && (
        <div style={{ color: col, fontSize: 14, fontFamily:"'Georgia',serif", fontWeight:"bold", lineHeight:1, alignSelf:"flex-end", transform:"rotate(180deg)" }}>
          {card.rank}<br/>{card.suit}
        </div>
      )}
    </div>
  );
}

// ─── Main Game ─────────────────────────────────────────────────────────────────
export default function SpadesGame() {
  const [phase, setPhase] = useState("menu"); // menu|deal|bid|play|roundEnd|gameOver
  const [hands, setHands] = useState([[], [], [], []]);
  const [bids, setBids] = useState([0, 0, 0, 0]);
  const [currentBidder, setCurrentBidder] = useState(0);
  const [playerBid, setPlayerBid] = useState(null);
  const [trick, setTrick] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [spadesBroken, setSpadesBroken] = useState(false);
  const [tricksWon, setTricksWon] = useState([0, 0, 0, 0]);
  const [totalScores, setTotalScores] = useState([0, 0]);
  const [totalBags, setTotalBags] = useState([0, 0]);
  const [roundResult, setRoundResult] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [lastTrick, setLastTrick] = useState(null);
  const [msg, setMsg] = useState("");
  const [animTrick, setAnimTrick] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const aiTimer = useRef(null);

  const dealRound = useCallback(() => {
    const deck = shuffle(buildDeck());
    const h = [[], [], [], []];
    deck.forEach((c, i) => h[i % 4].push(c));
    h.forEach(hand => hand.sort((a, b) => {
      const si = SUITS.indexOf(a.suit), sj = SUITS.indexOf(b.suit);
      return si !== sj ? si - sj : cardVal(a) - cardVal(b);
    }));
    setHands(h);
    setBids([0, 0, 0, 0]);
    setTrick([]);
    setSpadesBroken(false);
    setTricksWon([0, 0, 0, 0]);
    setSelectedCard(null);
    setLastTrick(null);
    setCurrentBidder(0);
    setCurrentPlayer(0);
    setPhase("bid");
    setMsg("Bidding phase — how many tricks will you take?");
  }, []);

  // AI bidding
  useEffect(() => {
    if (phase !== "bid" || currentBidder === 0) return;
    const timer = setTimeout(() => {
      const hand = hands[currentBidder];
      let aiBid = hand.filter(c => isSpade(c)).length;
      aiBid += hand.filter(c => c.rank === "A" && !isSpade(c)).length;
      aiBid = Math.max(1, Math.min(aiBid, 7));
      setBids(b => { const nb = [...b]; nb[currentBidder] = aiBid; return nb; });
      if (currentBidder === 3) {
        setPhase("play");
        setCurrentPlayer(0);
        setMsg("Your turn to play!");
      } else {
        setCurrentBidder(b => b + 1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [phase, currentBidder, hands]);

  // AI playing
  useEffect(() => {
    if (phase !== "play" || currentPlayer === 0) return;
    const hand = hands[currentPlayer];
    if (!hand || hand.length === 0) return;
    aiTimer.current = setTimeout(() => {
      const currentHand = hands[currentPlayer];
      if (!currentHand || currentHand.length === 0) return;
      const card = aiChooseCard(currentHand, trick, spadesBroken, bids, tricksWon);
      if (card) playCard(currentPlayer, card);
    }, 700);
    return () => clearTimeout(aiTimer.current);
  }, [phase, currentPlayer, trick, hands]);

  function playCard(playerIdx, card) {
    const newHands = hands.map((h, i) => i === playerIdx ? h.filter(c => c !== card) : h);
    const newTrick = [...trick, { player: playerIdx, card }];
    let newSpadesBroken = spadesBroken || isSpade(card);
    setHands(newHands);
    setTrick(newTrick);
    setSpadesBroken(newSpadesBroken);
    setSelectedCard(null);

    if (newTrick.length === 4) {
      // Re-evaluate trick winner properly
      let winEntry = newTrick[0];
      for (let i = 1; i < newTrick.length; i++) {
        const isWin = (() => {
          const c = newTrick[i].card;
          const led = newTrick[0].card.suit;
          const cSpade = isSpade(c);
          const winCard = winEntry.card;
          const winSpade = isSpade(winCard);
          if (cSpade && !winSpade) return true;
          if (!cSpade && winSpade) return false;
          if (cSpade && winSpade) return cardVal(c) > cardVal(winCard);
          if (c.suit === led && winCard.suit === led) return cardVal(c) > cardVal(winCard);
          if (c.suit === led && winCard.suit !== led) return true;
          return false;
        })();
        if (isWin) winEntry = newTrick[i];
      }
      const winnerIdx = winEntry.player;
      const newTricksWon = [...tricksWon];
      newTricksWon[winnerIdx]++;

      setAnimTrick(true);
      setTimeout(() => {
        setLastTrick(newTrick);
        setTrick([]);
        setTricksWon(newTricksWon);
        setAnimTrick(false);

        // Round is over when ALL players are out of cards
        const roundOver = newHands.every(h => h.length === 0);
        if (roundOver) {
          const finalBids = bids;
          const { scores, bags } = calcScore(finalBids, newTricksWon);
          const newTotal = [totalScores[0] + scores[0], totalScores[1] + scores[1]];
          const newBags = [totalBags[0] + bags[0], totalBags[1] + bags[1]];
          const bagPenalty = [0, 0];
          for (let t = 0; t < 2; t++) {
            if (newBags[t] >= 10) {
              newTotal[t] -= 100;
              newBags[t] -= 10;
              bagPenalty[t] = 1;
            }
          }
          setTotalScores(newTotal);
          setTotalBags(newBags);
          setRoundResult({ scores, newTotal, newBags, bagPenalty, tricksWon: newTricksWon, bids: finalBids });
          setPhase("roundEnd");
        } else {
          setCurrentPlayer(winnerIdx);
          setMsg(winnerIdx === 0 ? "You won that trick! Your lead." : `${PLAYERS[winnerIdx]} won the trick.`);
        }
      }, 900);
    } else {
      setCurrentPlayer((playerIdx + 1) % 4);
      if ((playerIdx + 1) % 4 === 0) setMsg("Your turn!");
    }
  }

  function handlePlayerCard(card) {
    if (phase !== "play" || currentPlayer !== 0) return;
    if (selectedCard === card) {
      // Play it
      const led = trick.length > 0 ? trick[0].card.suit : null;
      if (led) {
        const hasSuit = hands[0].some(c => c.suit === led);
        if (hasSuit && card.suit !== led) { setMsg("You must follow suit!"); return; }
      } else {
        // Leading
        if (isSpade(card) && !spadesBroken) {
          const hasNonSpade = hands[0].some(c => !isSpade(c));
          if (hasNonSpade) { setMsg("Spades not broken yet!"); return; }
        }
      }
      playCard(0, card);
    } else {
      setSelectedCard(card);
    }
  }

  function checkGameOver() {
    return totalScores[0] >= 500 || totalScores[1] >= 500 ||
           totalScores[0] <= -200 || totalScores[1] <= -200;
  }

  // ─── RENDER ────────────────────────────────────────────────────────────────
  const green = "#1a4a2e";
  const felt = "radial-gradient(ellipse at center, #1e5c38 0%, #143d26 100%)";

  const HelpModal = () => (
    <div style={{
      position:"fixed",inset:0,background:"#000000cc",zIndex:100,
      display:"flex",alignItems:"center",justifyContent:"center",padding:16
    }} onClick={()=>setShowHelp(false)}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"#0f2a18",border:"2px solid #2a6a3a",borderRadius:14,
        padding:24,maxWidth:420,width:"100%",maxHeight:"85vh",overflowY:"auto",
        fontFamily:"'Georgia',serif",color:"#e8dfc8",position:"relative"
      }}>
        <button onClick={()=>setShowHelp(false)} style={{
          position:"absolute",top:12,right:12,background:"none",border:"none",
          color:"#8ab89a",fontSize:22,cursor:"pointer",lineHeight:1
        }}>✕</button>
        <h2 style={{fontSize:22,letterSpacing:4,textAlign:"center",marginTop:0,marginBottom:20,color:"#6dda8a"}}>HOW TO PLAY</h2>

        {[
          {
            icon:"👥", title:"The Setup",
            body:"4 players — You & Partner (North/South) vs West & East. 13 cards are dealt to each player. Spades (♠) are always trump."
          },
          {
            icon:"🤔", title:"Bidding",
            body:"Before each round, every player bids how many tricks they expect to win. Count your spades and aces as a guide. You must commit to your bid — there's no passing."
          },
          {
            icon:"🃏", title:"Playing a Trick",
            body:"The player to the left of the dealer leads first. Tap a card to select it (it lifts up), then tap it again to play. You must follow the suit that was led if you can. If you can't follow suit, you may play any card including a spade."
          },
          {
            icon:"♠", title:"Spades & Trump",
            body:"Spades cannot be led until they've been 'broken' — meaning someone has already played a spade when they couldn't follow suit. The highest card of the led suit wins the trick, unless a spade is played — then the highest spade wins."
          },
          {
            icon:"🏆", title:"Scoring",
            body:"Make your bid: earn 10 pts per trick you bid, plus 1 pt per extra trick (called a 'bag'). Miss your bid: lose 10 pts per trick you bid. Nil bid (0): earn 100 pts if you win zero tricks, or lose 100 pts if you win any."
          },
          {
            icon:"👜", title:"Bags & Penalties",
            body:"Overtricks (bags) are risky! Accumulate 10 bags and your team loses 100 points — and the bag counter resets. Keep an eye on the bag count shown next to your score."
          },
          {
            icon:"🎯", title:"Winning",
            body:"First team to reach 500 points wins the game. If a team drops to −200 points, they lose immediately. Play as many rounds as it takes!"
          }
        ].map(({icon,title,body})=>(
          <div key={title} style={{marginBottom:18,paddingBottom:18,borderBottom:"1px solid #1a4a28"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontSize:18}}>{icon}</span>
              <span style={{fontSize:14,letterSpacing:2,color:"#6dda8a",textTransform:"uppercase"}}>{title}</span>
            </div>
            <p style={{margin:0,fontSize:13,lineHeight:1.7,color:"#c8b89a"}}>{body}</p>
          </div>
        ))}

        <button onClick={()=>setShowHelp(false)} style={{
          width:"100%",marginTop:4,background:"linear-gradient(135deg,#2a7a4a,#1a5a34)",
          border:"2px solid #4aaa6a",color:"#e8dfc8",fontSize:15,
          padding:"12px",borderRadius:8,cursor:"pointer",
          fontFamily:"'Georgia',serif",letterSpacing:3
        }}>Got It!</button>
      </div>
    </div>
  );

  if (phase === "menu") {
    return (
      <div style={{
        minHeight:"100vh", background:"#0d2010",
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        fontFamily:"'Georgia',serif", color:"#e8dfc8",
        backgroundImage:"radial-gradient(ellipse at 50% 0%,#1a4a2e,#0d1a0e)"
      }}>
        {showHelp && <HelpModal />}
        <div style={{fontSize:80,marginBottom:8}}>♠</div>
        <h1 style={{fontSize:42,letterSpacing:8,margin:"0 0 8px",textTransform:"uppercase",
          textShadow:"0 0 30px #40ff8080"}}>SPADES</h1>
        <p style={{color:"#8ab89a",fontSize:14,marginBottom:40,letterSpacing:3}}>CLASSIC CARD GAME</p>
        <button onClick={dealRound} style={{
          background:"linear-gradient(135deg,#2a7a4a,#1a5a34)",
          border:"2px solid #4aaa6a", color:"#e8dfc8", fontSize:18,
          padding:"14px 48px", borderRadius:8, cursor:"pointer",
          letterSpacing:4, textTransform:"uppercase",
          boxShadow:"0 0 20px #2a7a4a66",fontFamily:"'Georgia',serif",marginBottom:14
        }}>Deal Cards</button>
        <button onClick={()=>setShowHelp(true)} style={{
          background:"transparent",border:"2px solid #2a5a3a",color:"#8ab89a",
          fontSize:14,padding:"10px 36px",borderRadius:8,cursor:"pointer",
          letterSpacing:3,textTransform:"uppercase",fontFamily:"'Georgia',serif"
        }}>How to Play</button>
        <div style={{marginTop:36,color:"#4a7a5a",fontSize:12,lineHeight:2,textAlign:"center"}}>
          You & Partner vs West & East<br/>
          First to 500 points wins • 10 bags = −100
        </div>
      </div>
    );
  }

  if (phase === "gameOver") {
    const weWin = totalScores[0] > totalScores[1];
    return (
      <div style={{minHeight:"100vh",background:"#0d2010",display:"flex",flexDirection:"column",
        alignItems:"center",justifyContent:"center",fontFamily:"'Georgia',serif",color:"#e8dfc8"}}>
        <div style={{fontSize:60}}>{weWin?"🏆":"💀"}</div>
        <h1 style={{fontSize:36,marginBottom:8}}>{weWin?"You Win!":"Game Over"}</h1>
        <p style={{color:"#8ab89a"}}>Final Score: Us {totalScores[0]} — Them {totalScores[1]}</p>
        <button onClick={() => { setTotalScores([0,0]); setTotalBags([0,0]); dealRound(); }} style={{
          marginTop:32,background:"linear-gradient(135deg,#2a7a4a,#1a5a34)",
          border:"2px solid #4aaa6a",color:"#e8dfc8",fontSize:16,
          padding:"12px 40px",borderRadius:8,cursor:"pointer",fontFamily:"'Georgia',serif"
        }}>Play Again</button>
      </div>
    );
  }

  if (phase === "roundEnd" && roundResult) {
    return (
      <div style={{minHeight:"100vh",background:"#0d2010",display:"flex",flexDirection:"column",
        alignItems:"center",justifyContent:"center",fontFamily:"'Georgia',serif",color:"#e8dfc8",
        padding:24}}>
        <h2 style={{fontSize:28,marginBottom:24,letterSpacing:4}}>ROUND OVER</h2>
        <div style={{background:"#1a3a22",borderRadius:12,padding:24,minWidth:280,
          border:"1px solid #2a6a3a",marginBottom:20}}>
          {[0,1].map(t => (
            <div key={t} style={{marginBottom:16}}>
              <div style={{color:"#8ab89a",fontSize:12,letterSpacing:2,marginBottom:4}}>
                {t===0?"US (You + Partner)":"THEM (West + East)"}
              </div>
              <div style={{fontSize:13,color:"#c8b89a"}}>
                Bid: {roundResult.bids[t*0]+roundResult.bids[t===0?2:1+2*t-1]} | Won: {roundResult.tricksWon[t===0?0:1]+roundResult.tricksWon[t===0?2:3]}
              </div>
              <div style={{fontSize:20,fontWeight:"bold",color:roundResult.scores[t]>=0?"#6dda8a":"#e05b5b"}}>
                {roundResult.scores[t]>=0?"+":""}{roundResult.scores[t]} pts
              </div>
              {roundResult.bagPenalty[t]>0 && <div style={{color:"#e09a3a",fontSize:12}}>⚠ Bag penalty: -100</div>}
            </div>
          ))}
        </div>
        <div style={{background:"#0d2018",borderRadius:8,padding:16,minWidth:280,
          border:"1px solid #1a4a28",marginBottom:24}}>
          <div style={{color:"#8ab89a",fontSize:12,letterSpacing:2,marginBottom:8}}>TOTAL SCORE</div>
          {[0,1].map(t=>(
            <div key={t} style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{color:"#c8b89a"}}>{t===0?"Us":"Them"}</span>
              <span style={{color:"#e8dfc8",fontWeight:"bold"}}>{roundResult.newTotal[t]}</span>
            </div>
          ))}
        </div>
        <button onClick={() => {
          if (checkGameOver()) setPhase("gameOver");
          else dealRound();
        }} style={{
          background:"linear-gradient(135deg,#2a7a4a,#1a5a34)",
          border:"2px solid #4aaa6a",color:"#e8dfc8",fontSize:16,
          padding:"12px 40px",borderRadius:8,cursor:"pointer",fontFamily:"'Georgia',serif",letterSpacing:2
        }}>Next Round</button>
      </div>
    );
  }

  // ─── Bid Phase ─────────────────────────────────────────────────────────────
  if (phase === "bid") {
    return (
      <div style={{minHeight:"100vh",background:felt,display:"flex",flexDirection:"column",
        alignItems:"center",justifyContent:"space-between",fontFamily:"'Georgia',serif",
        color:"#e8dfc8",padding:"16px 8px",boxSizing:"border-box"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:11,letterSpacing:3,color:"#8ab89a",marginBottom:4}}>BIDDING</div>
          <div style={{fontSize:14,color:"#c8b89a"}}>
            {currentBidder===0?"Your turn to bid":PLAYERS[currentBidder]+" is bidding..."}
          </div>
        </div>
        {/* Score bar */}
        <div style={{display:"flex",gap:16}}>
          {[0,1].map(t=>(
            <div key={t} style={{background:"#0d2018aa",borderRadius:6,padding:"4px 12px",fontSize:11,textAlign:"center"}}>
              <div style={{color:"#8ab89a"}}>{t===0?"Us":"Them"}</div>
              <div style={{color:"#e8dfc8",fontWeight:"bold"}}>{totalScores[t]}</div>
            </div>
          ))}
        </div>
        {/* Other bids */}
        <div style={{display:"flex",gap:8}}>
          {[1,2,3].map(p=>(
            <div key={p} style={{background:"#0d2018aa",borderRadius:6,padding:"4px 10px",fontSize:11,textAlign:"center",minWidth:60}}>
              <div style={{color:"#8ab89a"}}>{PLAYERS[p]}</div>
              <div style={{color:"#e8dfc8"}}>{bids[p]>0?`Bid ${bids[p]}`:currentBidder===p?"...":"—"}</div>
            </div>
          ))}
        </div>
        {/* Player hand */}
        <div style={{width:"100%",overflowX:"auto",padding:"8px 0"}}>
          <div style={{display:"flex",gap:4,justifyContent:"center",flexWrap:"wrap"}}>
            {hands[0].map((c, i) => (
              <Card key={i} card={c} disabled small />
            ))}
          </div>
        </div>
        {/* Bid selector */}
        {currentBidder === 0 && (
          <div style={{textAlign:"center"}}>
            <div style={{color:"#8ab89a",fontSize:12,marginBottom:8}}>How many tricks will you take?</div>
            <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
              {[0,1,2,3,4,5,6,7,8,9,10,11,12,13].map(n=>(
                <button key={n} onClick={()=>setPlayerBid(n)} style={{
                  width:36,height:36,borderRadius:4,
                  background:playerBid===n?"#2a7a4a":"#1a3a22",
                  border:playerBid===n?"2px solid #4aaa6a":"2px solid #2a5a3a",
                  color:"#e8dfc8",cursor:"pointer",fontSize:13,fontFamily:"'Georgia',serif"
                }}>{n}</button>
              ))}
            </div>
            <button disabled={playerBid===null} onClick={()=>{
              setBids(b=>{const nb=[...b];nb[0]=playerBid;return nb;});
              setCurrentBidder(1);
            }} style={{
              marginTop:12,background:playerBid!==null?"linear-gradient(135deg,#2a7a4a,#1a5a34)":"#1a2a1a",
              border:"2px solid #4aaa6a",color:"#e8dfc8",fontSize:14,
              padding:"10px 32px",borderRadius:6,cursor:playerBid!==null?"pointer":"default",
              fontFamily:"'Georgia',serif",letterSpacing:2
            }}>Confirm Bid</button>
          </div>
        )}
        {currentBidder !== 0 && <div style={{height:80}} />}
      </div>
    );
  }

  // ─── Play Phase ────────────────────────────────────────────────────────────
  const bidSummary = [0,1].map(t => ({
    bid: bids[t]+bids[t+2],
    won: tricksWon[t]+tricksWon[t+2]
  }));

  return (
    <div style={{minHeight:"100vh",background:felt,display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"space-between",fontFamily:"'Georgia',serif",
      color:"#e8dfc8",padding:"8px",boxSizing:"border-box",maxWidth:480,margin:"0 auto"}}>

      {/* Top: North (Partner=2) */}
      <div style={{width:"100%",display:"flex",justifyContent:"center",alignItems:"center",gap:4,minHeight:48}}>
        <div style={{textAlign:"center",marginRight:8}}>
          <div style={{fontSize:10,color:"#8ab89a"}}>Partner</div>
          <div style={{fontSize:11,color:"#c8b89a"}}>Bid {bids[2]} | Won {tricksWon[2]}</div>
        </div>
        {hands[2].map((_,i)=><Card key={i} faceDown small />)}
      </div>

      {/* Score + Message */}
      <div style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,padding:"0 4px"}}>
        {[0,1].map(t=>(
          <div key={t} style={{background:"#0d2018aa",borderRadius:6,padding:"4px 8px",fontSize:11,textAlign:"center",flex:1}}>
            <div style={{color:"#8ab89a"}}>{t===0?"Us":"Them"}</div>
            <div style={{color:"#e8dfc8",fontWeight:"bold"}}>{totalScores[t]}</div>
            <div style={{color:"#c89a3a",fontSize:10}}>B:{bidSummary[t].bid} W:{bidSummary[t].won}</div>
          </div>
        ))}
        <div style={{flex:2,textAlign:"center",fontSize:12,color:"#c8b89a",padding:"0 4px"}}>{msg}</div>
      </div>

      {/* Middle row: West(1), Trick, East(3) */}
      <div style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        {/* West */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
          <div style={{fontSize:10,color:"#8ab89a"}}>West</div>
          <div style={{fontSize:10,color:"#c8b89a"}}>B{bids[1]} W{tricksWon[1]}</div>
          {hands[1].slice(0,Math.min(6,hands[1].length)).map((_,i)=>(
            <Card key={i} faceDown small />
          ))}
        </div>

        {/* Trick area */}
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,minHeight:160}}>
          {lastTrick && trick.length===0 && (
            <div style={{fontSize:10,color:"#8ab89a",marginBottom:4}}>Last trick</div>
          )}
          <div style={{position:"relative",width:120,height:120}}>
            {(trick.length>0?trick:lastTrick||[]).map((t,i)=>{
              const positions = [{top:0,left:"50%",transform:"translateX(-50%)"},{top:"50%",left:0,transform:"translateY(-50%)"},{bottom:0,left:"50%",transform:"translateX(-50%)"},{top:"50%",right:0,transform:"translateY(-50%)"}];
              const posMap = [2,1,0,3]; // south=0=bottom, west=1=left, north=2=top, east=3=right
              const pos = positions[posMap[t.player]];
              return (
                <div key={i} style={{position:"absolute",...pos}}>
                  <Card card={t.card} small disabled />
                </div>
              );
            })}
          </div>
          {spadesBroken && <div style={{fontSize:10,color:"#8ab89a"}}>♠ Spades broken</div>}
        </div>

        {/* East */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
          <div style={{fontSize:10,color:"#8ab89a"}}>East</div>
          <div style={{fontSize:10,color:"#c8b89a"}}>B{bids[3]} W{tricksWon[3]}</div>
          {hands[3].slice(0,Math.min(6,hands[3].length)).map((_,i)=>(
            <Card key={i} faceDown small />
          ))}
        </div>
      </div>

      {/* Player hand */}
      <div style={{width:"100%"}}>
        <div style={{fontSize:10,color:"#8ab89a",textAlign:"center",marginBottom:4}}>
          You — Bid {bids[0]} | Won {tricksWon[0]}
          {currentPlayer===0 && trick.length<4 && <span style={{color:"#6dda8a"}}> — Your turn</span>}
        </div>
        <div style={{
          overflowX:"auto", display:"flex", gap:3,
          justifyContent:"center", padding:"4px 0", flexWrap:"nowrap",
          WebkitOverflowScrolling:"touch"
        }}>
          {hands[0].map((c, i) => {
            const led = trick.length>0?trick[0].card.suit:null;
            const hasSuit = led && hands[0].some(hc=>hc.suit===led);
            const notFollowing = led && hasSuit && c.suit!==led;
            const spadeLead = !led && isSpade(c) && !spadesBroken && hands[0].some(hc=>!isSpade(hc));
            const unplayable = notFollowing || spadeLead;
            return (
              <div key={i} style={{opacity:currentPlayer===0&&!unplayable?1:0.5}}>
                <Card
                  card={c}
                  selected={selectedCard===c}
                  onClick={()=>handlePlayerCard(c)}
                  disabled={currentPlayer!==0||unplayable}
                />
              </div>
            );
          })}
        </div>
        {selectedCard && currentPlayer===0 && (
          <div style={{textAlign:"center",marginTop:6,fontSize:12,color:"#6dda8a"}}>
            Tap again to play {selectedCard.rank}{selectedCard.suit}
          </div>
        )}
      </div>
    </div>
  );
}
