import { useState, useEffect, useCallback, useRef } from "react";

// ============================================================
// INLINE GAME DATA
// ============================================================
const SUITS_UNUSED = null;
const TYPES_LIST = ["Normal","Fire","Water","Grass","Electric","Ice","Fighting","Poison","Ground","Flying","Psychic","Bug","Rock","Ghost","Dragon","Dark","Steel","Fairy"];

const TYPE_COLORS = {
  Normal:"#A8A878", Fire:"#F08030", Water:"#6890F0", Grass:"#78C850", Electric:"#F8D030",
  Ice:"#98D8D8", Fighting:"#C03028", Poison:"#A040A0", Ground:"#E0C068", Flying:"#A890F0",
  Psychic:"#F85888", Bug:"#A8B820", Rock:"#B8A038", Ghost:"#705898", Dragon:"#7038F8",
  Dark:"#705848", Steel:"#B8B8D0", Fairy:"#EE99AC"
};

const TYPE_CHART = {
  Normal:{Rock:0.5,Ghost:0,Steel:0.5},
  Fire:{Fire:0.5,Water:0.5,Grass:2,Ice:2,Bug:2,Rock:0.5,Dragon:0.5,Steel:2},
  Water:{Fire:2,Water:0.5,Grass:0.5,Ground:2,Rock:2,Dragon:0.5},
  Grass:{Fire:0.5,Water:2,Grass:0.5,Poison:0.5,Ground:2,Flying:0.5,Bug:0.5,Rock:2,Dragon:0.5,Steel:0.5},
  Electric:{Water:2,Electric:0.5,Grass:0.5,Ground:0,Flying:2,Dragon:0.5},
  Ice:{Fire:0.5,Water:0.5,Grass:2,Ice:0.5,Ground:2,Flying:2,Dragon:2,Steel:0.5},
  Fighting:{Normal:2,Ice:2,Poison:0.5,Flying:0.5,Psychic:0.5,Bug:0.5,Rock:2,Ghost:0,Dark:2,Steel:2,Fairy:0.5},
  Poison:{Grass:2,Poison:0.5,Ground:0.5,Rock:0.5,Ghost:0.5,Steel:0,Fairy:2},
  Ground:{Fire:2,Electric:2,Grass:0.5,Poison:2,Flying:0,Bug:0.5,Rock:2,Steel:2},
  Flying:{Electric:0.5,Grass:2,Fighting:2,Bug:2,Rock:0.5,Steel:0.5},
  Psychic:{Fighting:2,Poison:2,Psychic:0.5,Dark:0,Steel:0.5},
  Bug:{Fire:0.5,Grass:2,Fighting:0.5,Flying:0.5,Psychic:2,Ghost:0.5,Dark:2,Steel:0.5,Fairy:0.5},
  Rock:{Fire:2,Ice:2,Fighting:0.5,Ground:0.5,Flying:2,Bug:2,Steel:0.5},
  Ghost:{Normal:0,Psychic:2,Ghost:2,Dark:0.5},
  Dragon:{Dragon:2,Steel:0.5,Fairy:0},
  Dark:{Fighting:0.5,Psychic:2,Ghost:2,Dark:0.5,Fairy:0.5},
  Steel:{Fire:0.5,Water:0.5,Electric:0.5,Ice:2,Rock:2,Steel:0.5,Fairy:2},
  Fairy:{Fire:0.5,Fighting:2,Poison:0.5,Dragon:2,Dark:2,Steel:0.5},
};

function getEff(moveType, defTypes) {
  let m = 1;
  for (const dt of defTypes) { const r = TYPE_CHART[moveType]||{}; m *= r[dt]!==undefined?r[dt]:1; }
  return m;
}

const MOVES_DB = {
  Tackle:{type:"Normal",cat:"Physical",power:40,pp:35,maxPP:35,acc:100},
  Scratch:{type:"Normal",cat:"Physical",power:40,pp:35,maxPP:35,acc:100},
  Pound:{type:"Normal",cat:"Physical",power:40,pp:35,maxPP:35,acc:100},
  "Quick Attack":{type:"Normal",cat:"Physical",power:40,pp:30,maxPP:30,acc:100},
  "Body Slam":{type:"Normal",cat:"Physical",power:85,pp:15,maxPP:15,acc:100},
  "Hyper Voice":{type:"Normal",cat:"Special",power:90,pp:10,maxPP:10,acc:100},
  Return:{type:"Normal",cat:"Physical",power:80,pp:20,maxPP:20,acc:100},
  Growl:{type:"Normal",cat:"Status",power:0,pp:40,maxPP:40,acc:100,effect:"atk-1"},
  Leer:{type:"Normal",cat:"Status",power:0,pp:30,maxPP:30,acc:100,effect:"def-1"},
  "Tail Whip":{type:"Normal",cat:"Status",power:0,pp:30,maxPP:30,acc:100,effect:"def-1"},
  Harden:{type:"Normal",cat:"Status",power:0,pp:30,maxPP:30,acc:null,effect:"def+1"},
  "Swords Dance":{type:"Normal",cat:"Status",power:0,pp:20,maxPP:20,acc:null,effect:"atk+2"},
  Recover:{type:"Normal",cat:"Status",power:0,pp:10,maxPP:10,acc:null,effect:"heal"},
  Smokescreen:{type:"Normal",cat:"Status",power:0,pp:20,maxPP:20,acc:100,effect:"acc-1"},
  Ember:{type:"Fire",cat:"Special",power:40,pp:25,maxPP:25,acc:100},
  Flamethrower:{type:"Fire",cat:"Special",power:90,pp:15,maxPP:15,acc:100},
  "Fire Blast":{type:"Fire",cat:"Special",power:110,pp:5,maxPP:5,acc:85},
  "Flame Charge":{type:"Fire",cat:"Physical",power:50,pp:20,maxPP:20,acc:100},
  "Fire Spin":{type:"Fire",cat:"Special",power:35,pp:15,maxPP:15,acc:85},
  Bubble:{type:"Water",cat:"Special",power:40,pp:30,maxPP:30,acc:100},
  "Water Gun":{type:"Water",cat:"Special",power:40,pp:25,maxPP:25,acc:100},
  Surf:{type:"Water",cat:"Special",power:90,pp:15,maxPP:15,acc:100},
  Waterfall:{type:"Water",cat:"Physical",power:80,pp:15,maxPP:15,acc:100},
  Scald:{type:"Water",cat:"Special",power:80,pp:15,maxPP:15,acc:100},
  "Hydro Pump":{type:"Water",cat:"Special",power:110,pp:5,maxPP:5,acc:80},
  "Vine Whip":{type:"Grass",cat:"Physical",power:45,pp:25,maxPP:25,acc:100},
  "Razor Leaf":{type:"Grass",cat:"Physical",power:55,pp:25,maxPP:25,acc:95},
  "Seed Bomb":{type:"Grass",cat:"Physical",power:80,pp:15,maxPP:15,acc:100},
  "Energy Ball":{type:"Grass",cat:"Special",power:90,pp:10,maxPP:10,acc:100},
  "Solar Beam":{type:"Grass",cat:"Special",power:120,pp:10,maxPP:10,acc:100},
  "Bullet Seed":{type:"Grass",cat:"Physical",power:25,pp:30,maxPP:30,acc:100},
  "Thunder Shock":{type:"Electric",cat:"Special",power:40,pp:30,maxPP:30,acc:100},
  Thunderbolt:{type:"Electric",cat:"Special",power:90,pp:15,maxPP:15,acc:100},
  Thunder:{type:"Electric",cat:"Special",power:110,pp:10,maxPP:10,acc:70},
  "Wild Charge":{type:"Electric",cat:"Physical",power:90,pp:15,maxPP:15,acc:100},
  Confusion:{type:"Psychic",cat:"Special",power:50,pp:25,maxPP:25,acc:100},
  Psybeam:{type:"Psychic",cat:"Special",power:65,pp:20,maxPP:20,acc:100},
  Psychic:{type:"Psychic",cat:"Special",power:90,pp:10,maxPP:10,acc:100},
  Psyshock:{type:"Psychic",cat:"Special",power:80,pp:10,maxPP:10,acc:100},
  "Ice Shard":{type:"Ice",cat:"Physical",power:40,pp:30,maxPP:30,acc:100},
  "Ice Beam":{type:"Ice",cat:"Special",power:90,pp:10,maxPP:10,acc:100},
  Blizzard:{type:"Ice",cat:"Special",power:110,pp:5,maxPP:5,acc:70},
  "Icicle Crash":{type:"Ice",cat:"Physical",power:85,pp:10,maxPP:10,acc:90},
  "Karate Chop":{type:"Fighting",cat:"Physical",power:50,pp:25,maxPP:25,acc:100},
  "Low Kick":{type:"Fighting",cat:"Physical",power:60,pp:20,maxPP:20,acc:100},
  "Close Combat":{type:"Fighting",cat:"Physical",power:120,pp:5,maxPP:5,acc:100},
  "Hammer Arm":{type:"Fighting",cat:"Physical",power:100,pp:10,maxPP:10,acc:90},
  "High Jump Kick":{type:"Fighting",cat:"Physical",power:130,pp:10,maxPP:10,acc:90},
  "Comet Punch":{type:"Normal",cat:"Physical",power:18,pp:15,maxPP:15,acc:85},
  Acrobatics:{type:"Flying",cat:"Physical",power:55,pp:15,maxPP:15,acc:100},
  Superpower:{type:"Fighting",cat:"Physical",power:120,pp:5,maxPP:5,acc:100},
  "Rock Throw":{type:"Rock",cat:"Physical",power:50,pp:15,maxPP:15,acc:90},
  "Rock Slide":{type:"Rock",cat:"Physical",power:75,pp:10,maxPP:10,acc:90},
  "Stone Edge":{type:"Rock",cat:"Physical",power:100,pp:5,maxPP:5,acc:80},
  "Mud Slap":{type:"Ground",cat:"Special",power:20,pp:10,maxPP:10,acc:100},
  Earthquake:{type:"Ground",cat:"Physical",power:100,pp:10,maxPP:10,acc:100},
  Gust:{type:"Flying",cat:"Special",power:40,pp:35,maxPP:35,acc:100},
  "Wing Attack":{type:"Flying",cat:"Physical",power:60,pp:35,maxPP:35,acc:100},
  Fly:{type:"Flying",cat:"Physical",power:90,pp:15,maxPP:15,acc:95},
  "Aerial Ace":{type:"Flying",cat:"Physical",power:60,pp:20,maxPP:20,acc:null},
  Bounce:{type:"Flying",cat:"Physical",power:85,pp:5,maxPP:5,acc:85},
  "String Shot":{type:"Bug",cat:"Status",power:0,pp:40,maxPP:40,acc:95,effect:"spe-1"},
  "Bug Bite":{type:"Bug",cat:"Physical",power:60,pp:20,maxPP:20,acc:100},
  "X-Scissor":{type:"Bug",cat:"Physical",power:80,pp:15,maxPP:15,acc:100},
  "Poison Sting":{type:"Poison",cat:"Physical",power:15,pp:35,maxPP:35,acc:100},
  Sludge:{type:"Poison",cat:"Special",power:65,pp:20,maxPP:20,acc:100},
  "Sludge Bomb":{type:"Poison",cat:"Special",power:90,pp:10,maxPP:10,acc:100},
  "Dragon Rage":{type:"Dragon",cat:"Special",power:40,pp:10,maxPP:10,acc:100},
  "Dragon Claw":{type:"Dragon",cat:"Physical",power:80,pp:15,maxPP:15,acc:100},
  "Dragon Pulse":{type:"Dragon",cat:"Special",power:85,pp:10,maxPP:10,acc:100},
  Outrage:{type:"Dragon",cat:"Physical",power:120,pp:10,maxPP:10,acc:100},
  Bite:{type:"Dark",cat:"Physical",power:60,pp:25,maxPP:25,acc:100},
  Crunch:{type:"Dark",cat:"Physical",power:80,pp:15,maxPP:15,acc:100},
  "Dark Pulse":{type:"Dark",cat:"Special",power:80,pp:15,maxPP:15,acc:100},
  "Night Slash":{type:"Dark",cat:"Physical",power:70,pp:15,maxPP:15,acc:100},
  "Metal Claw":{type:"Steel",cat:"Physical",power:50,pp:35,maxPP:35,acc:95},
  "Iron Head":{type:"Steel",cat:"Physical",power:80,pp:15,maxPP:15,acc:100},
  "Flash Cannon":{type:"Steel",cat:"Special",power:80,pp:10,maxPP:10,acc:100},
  "Shadow Ball":{type:"Ghost",cat:"Special",power:80,pp:15,maxPP:15,acc:100},
  "Shadow Claw":{type:"Ghost",cat:"Physical",power:70,pp:15,maxPP:15,acc:100},
  "Shadow Sneak":{type:"Ghost",cat:"Physical",power:40,pp:30,maxPP:30,acc:100},
  Lick:{type:"Ghost",cat:"Physical",power:30,pp:30,maxPP:30,acc:100},
  "Fairy Wind":{type:"Fairy",cat:"Special",power:40,pp:30,maxPP:30,acc:100},
  Moonblast:{type:"Fairy",cat:"Special",power:95,pp:15,maxPP:15,acc:100},
  "Play Rough":{type:"Fairy",cat:"Physical",power:90,pp:10,maxPP:10,acc:90},
  "Dazzling Gleam":{type:"Fairy",cat:"Special",power:80,pp:10,maxPP:10,acc:100},
  Rollout:{type:"Rock",cat:"Physical",power:30,pp:20,maxPP:20,acc:90},
  Headbutt:{type:"Normal",cat:"Physical",power:70,pp:15,maxPP:15,acc:100},
  Slash:{type:"Normal",cat:"Physical",power:70,pp:20,maxPP:20,acc:100},
  "Muddy Water":{type:"Water",cat:"Special",power:90,pp:10,maxPP:10,acc:85},
  "Sludge Wave":{type:"Poison",cat:"Special",power:95,pp:10,maxPP:10,acc:100},
  Boomburst:{type:"Normal",cat:"Special",power:140,pp:10,maxPP:10,acc:100},
  "Sacred Sword":{type:"Fighting",cat:"Physical",power:90,pp:15,maxPP:15,acc:100},
  "Cotton Spore":{type:"Grass",cat:"Status",power:0,pp:40,maxPP:40,acc:100,effect:"spe-2"},
  "Poison Powder":{type:"Poison",cat:"Status",power:0,pp:35,maxPP:35,acc:75,effect:"psn"},
  Slam:{type:"Normal",cat:"Physical",power:80,pp:20,maxPP:20,acc:75},
  Reflect:{type:"Psychic",cat:"Status",power:0,pp:20,maxPP:20,acc:null,effect:"def+1"},
  "Thunder Wave":{type:"Electric",cat:"Status",power:0,pp:20,maxPP:20,acc:90,effect:"par"},
  "Air Slash":{type:"Flying",cat:"Special",power:75,pp:15,maxPP:15,acc:95},
  "Ice Punch":{type:"Ice",cat:"Physical",power:75,pp:15,maxPP:15,acc:100},
  "Ice Fang":{type:"Ice",cat:"Physical",power:65,pp:15,maxPP:15,acc:95},
  "Cross Poison":{type:"Poison",cat:"Physical",power:70,pp:20,maxPP:20,acc:100},
  "Razor Shell":{type:"Water",cat:"Physical",power:75,pp:10,maxPP:10,acc:95},
  "Earth Power":{type:"Ground",cat:"Special",power:90,pp:10,maxPP:10,acc:100},
  "Wood Hammer":{type:"Grass",cat:"Physical",power:120,pp:15,maxPP:15,acc:100},
  "Horn Leech":{type:"Grass",cat:"Physical",power:75,pp:10,maxPP:10,acc:100},
  Avalanche:{type:"Ice",cat:"Physical",power:60,pp:10,maxPP:10,acc:100},
  "Flare Blitz":{type:"Fire",cat:"Physical",power:120,pp:15,maxPP:15,acc:100},
  "Brave Bird":{type:"Flying",cat:"Physical",power:120,pp:15,maxPP:15,acc:100},
  "Will-O-Wisp":{type:"Fire",cat:"Status",power:0,pp:15,maxPP:15,acc:85,effect:"brn"},
  "Fairy Lock":{type:"Fairy",cat:"Status",power:0,pp:10,maxPP:10,acc:null},
  Spikes:{type:"Ground",cat:"Status",power:0,pp:20,maxPP:20,acc:null},
  "Metal Sound":{type:"Steel",cat:"Status",power:0,pp:40,maxPP:40,acc:85,effect:"spd-2"},
  "Shell Smash":{type:"Normal",cat:"Status",power:0,pp:15,maxPP:15,acc:null,effect:"atk+2"},
  "Smog":{type:"Poison",cat:"Special",power:30,pp:20,maxPP:20,acc:70},
  "Confuse Ray":{type:"Ghost",cat:"Status",power:0,pp:10,maxPP:10,acc:100,effect:"cnf"},
  "Parabolic Charge":{type:"Electric",cat:"Special",power:65,pp:20,maxPP:20,acc:100},
  "Ingrain":{type:"Grass",cat:"Status",power:0,pp:20,maxPP:20,acc:null,effect:"heal"},
  "Feint Attack":{type:"Dark",cat:"Physical",power:60,pp:20,maxPP:20,acc:null},
  "Icy Wind":{type:"Ice",cat:"Special",power:55,pp:15,maxPP:15,acc:95},
};

const POKEMON_DB = {
  Chespin:{types:["Grass"],hp:56,atk:61,def:65,spa:48,spd:45,spe:38,moves:["Tackle","Growl","Vine Whip","Razor Leaf"],evo:"Quilladin",evoLv:16,sprite:"🌰"},
  Quilladin:{types:["Grass"],hp:61,atk:78,def:95,spa:56,spd:58,spe:57,moves:["Vine Whip","Razor Leaf","Bite","Seed Bomb"],evo:"Chesnaught",evoLv:36,sprite:"🦔"},
  Chesnaught:{types:["Grass","Fighting"],hp:88,atk:107,def:122,spa:74,spd:75,spe:64,moves:["Seed Bomb","Close Combat","Hammer Arm","Body Slam"],sprite:"🛡️"},
  Fennekin:{types:["Fire"],hp:40,atk:45,def:40,spa:62,spd:60,spe:60,moves:["Scratch","Growl","Ember","Psybeam"],evo:"Braixen",evoLv:16,sprite:"🦊"},
  Braixen:{types:["Fire"],hp:59,atk:59,def:58,spa:90,spd:70,spe:73,moves:["Ember","Psybeam","Flamethrower","Confusion"],evo:"Delphox",evoLv:36,sprite:"🔥"},
  Delphox:{types:["Fire","Psychic"],hp:75,atk:69,def:72,spa:114,spd:100,spe:104,moves:["Flamethrower","Psychic","Fire Blast","Moonblast"],sprite:"🧙"},
  Froakie:{types:["Water"],hp:41,atk:56,def:40,spa:62,spd:44,spe:71,moves:["Pound","Growl","Bubble","Quick Attack"],evo:"Frogadier",evoLv:16,sprite:"🐸"},
  Frogadier:{types:["Water"],hp:54,atk:63,def:52,spa:83,spd:56,spe:97,moves:["Water Gun","Quick Attack","Aerial Ace","Scald"],evo:"Greninja",evoLv:36,sprite:"💨"},
  Greninja:{types:["Water","Dark"],hp:72,atk:95,def:67,spa:103,spd:71,spe:122,moves:["Surf","Dark Pulse","Ice Beam","Shadow Ball"],sprite:"🥷"},
  Pidgey:{types:["Normal","Flying"],hp:40,atk:45,def:40,spa:35,spd:35,spe:56,moves:["Tackle","Gust","Quick Attack","Wing Attack"],evo:"Pidgeotto",evoLv:18,sprite:"🐦"},
  Pidgeotto:{types:["Normal","Flying"],hp:63,atk:60,def:55,spa:50,spd:50,spe:71,moves:["Wing Attack","Gust","Aerial Ace","Quick Attack"],sprite:"🦅"},
  Bunnelby:{types:["Normal"],hp:38,atk:36,def:38,spa:32,spd:36,spe:57,moves:["Tackle","Quick Attack","Return","Wild Charge"],evo:"Diggersby",evoLv:20,sprite:"🐰"},
  Diggersby:{types:["Normal","Ground"],hp:85,atk:56,def:77,spa:50,spd:77,spe:78,moves:["Return","Wild Charge","Earthquake","Quick Attack"],sprite:"🐇"},
  Fletchling:{types:["Normal","Flying"],hp:45,atk:50,def:43,spa:40,spd:38,spe:62,moves:["Tackle","Quick Attack","Wing Attack","Flame Charge"],evo:"Fletchinder",evoLv:17,sprite:"🔴"},
  Fletchinder:{types:["Fire","Flying"],hp:62,atk:73,def:55,spa:56,spd:52,spe:84,moves:["Wing Attack","Flame Charge","Aerial Ace","Flamethrower"],sprite:"🔥"},
  Scatterbug:{types:["Bug"],hp:38,atk:35,def:40,spa:27,spd:25,spe:35,moves:["Tackle","String Shot","Bug Bite"],evo:"Spewpa",evoLv:9,sprite:"🐛"},
  Spewpa:{types:["Bug"],hp:45,atk:22,def:60,spa:27,spd:30,spe:29,moves:["Harden","Bug Bite"],evo:"Vivillon",evoLv:12,sprite:"🫘"},
  Vivillon:{types:["Bug","Flying"],hp:80,atk:52,def:50,spa:90,spd:50,spe:89,moves:["Gust","Bug Bite","Energy Ball","Psychic"],sprite:"🦋"},
  Pikachu:{types:["Electric"],hp:35,atk:55,def:40,spa:50,spd:50,spe:90,moves:["Thunder Shock","Quick Attack","Thunderbolt","Wild Charge"],sprite:"⚡"},
  Ralts:{types:["Psychic","Fairy"],hp:28,atk:25,def:25,spa:45,spd:35,spe:40,moves:["Confusion","Fairy Wind","Psybeam","Moonblast"],evo:"Kirlia",evoLv:20,sprite:"🌀"},
  Kirlia:{types:["Psychic","Fairy"],hp:38,atk:35,def:35,spa:65,spd:55,spe:50,moves:["Confusion","Psychic","Fairy Wind","Moonblast"],evo:"Gardevoir",evoLv:30,sprite:"💃"},
  Gardevoir:{types:["Psychic","Fairy"],hp:68,atk:65,def:65,spa:125,spd:115,spe:80,moves:["Psychic","Moonblast","Shadow Ball","Psyshock"],sprite:"🌸"},
  Litleo:{types:["Fire","Normal"],hp:62,atk:50,def:58,spa:73,spd:54,spe:72,moves:["Ember","Tackle","Headbutt","Flamethrower"],evo:"Pyroar",evoLv:35,sprite:"🦁"},
  Pyroar:{types:["Fire","Normal"],hp:86,atk:68,def:72,spa:109,spd:66,spe:106,moves:["Flamethrower","Hyper Voice","Dark Pulse","Fire Blast"],sprite:"👑"},
  Honedge:{types:["Steel","Ghost"],hp:45,atk:80,def:100,spa:35,spd:37,spe:28,moves:["Shadow Sneak","Iron Head","Shadow Claw","Metal Claw"],evo:"Doublade",evoLv:35,sprite:"⚔️"},
  Doublade:{types:["Steel","Ghost"],hp:59,atk:110,def:150,spa:45,spd:49,spe:35,moves:["Shadow Claw","Iron Head","Shadow Ball","Swords Dance"],sprite:"⚔️"},
  Goomy:{types:["Dragon"],hp:45,atk:50,def:35,spa:55,spd:75,spe:40,moves:["Tackle","Dragon Rage","Dragon Claw","Muddy Water"],evo:"Sliggoo",evoLv:40,sprite:"💧"},
  Sliggoo:{types:["Dragon"],hp:68,atk:75,def:53,spa:83,spd:113,spe:60,moves:["Dragon Claw","Dragon Rage","Muddy Water","Body Slam"],evo:"Goodra",evoLv:50,sprite:"🌧️"},
  Goodra:{types:["Dragon"],hp:90,atk:100,def:70,spa:110,spd:150,spe:80,moves:["Dragon Claw","Outrage","Muddy Water","Body Slam"],sprite:"🐉"},
  Hawlucha:{types:["Fighting","Flying"],hp:78,atk:92,def:75,spa:74,spd:63,spe:118,moves:["Wing Attack","Close Combat","Aerial Ace","X-Scissor"],sprite:"🦅"},
  Pancham:{types:["Fighting"],hp:67,atk:82,def:62,spa:46,spd:48,spe:43,moves:["Comet Punch","Karate Chop","Low Kick","Crunch"],evo:"Pangoro",evoLv:32,sprite:"🐼"},
  Pangoro:{types:["Fighting","Dark"],hp:95,atk:124,def:78,spa:69,spd:71,spe:58,moves:["Hammer Arm","Crunch","Close Combat","Dark Pulse"],sprite:"🥊"},
  Tyrunt:{types:["Rock","Dragon"],hp:58,atk:89,def:77,spa:45,spd:45,spe:48,moves:["Rock Throw","Dragon Claw","Bite","Rock Slide"],evo:"Tyrantrum",evoLv:39,sprite:"🦖"},
  Tyrantrum:{types:["Rock","Dragon"],hp:82,atk:121,def:119,spa:69,spd:59,spe:71,moves:["Stone Edge","Dragon Claw","Crunch","Rock Slide"],sprite:"🦕"},
  Amaura:{types:["Rock","Ice"],hp:77,atk:59,def:50,spa:67,spd:63,spe:46,moves:["Rock Throw","Ice Beam","Icy Wind","Thunderbolt"],evo:"Aurorus",evoLv:39,sprite:"🦕"},
  Aurorus:{types:["Rock","Ice"],hp:123,atk:77,def:72,spa:99,spd:92,spe:58,moves:["Blizzard","Ice Beam","Stone Edge","Thunder"],sprite:"❄️"},
  Surskit:{types:["Bug","Water"],hp:40,atk:30,def:32,spa:50,spd:52,spe:65,moves:["Bubble","Bug Bite","Quick Attack","Water Gun"],sprite:"🕷️"},
  Vivillon2:{types:["Bug","Flying"],hp:80,atk:52,def:50,spa:90,spd:50,spe:89,moves:["Gust","Bug Bite","Energy Ball","Psychic"],sprite:"🦋"},
  Mienfoo:{types:["Fighting"],hp:45,atk:85,def:50,spa:55,spd:65,spe:65,moves:["Quick Attack","Karate Chop","Low Kick","Acrobatics"],sprite:"🥋"},
  Machamp:{types:["Fighting"],hp:90,atk:130,def:80,spa:65,spd:85,spe:55,moves:["Close Combat","Hammer Arm","Karate Chop","Rock Slide"],sprite:"💪"},
  Abomasnow:{types:["Grass","Ice"],hp:90,atk:92,def:75,spa:92,spd:85,spe:60,moves:["Blizzard","Energy Ball","Ice Punch","Wood Hammer"],sprite:"🌨️"},
  Cryogonal:{types:["Ice"],hp:70,atk:50,def:30,spa:95,spd:135,spe:105,moves:["Ice Beam","Blizzard","Recover","Flash Cannon"],sprite:"❄️"},
  Avalugg:{types:["Ice"],hp:95,atk:117,def:184,spa:44,spd:46,spe:28,moves:["Avalanche","Ice Fang","Crunch","Stone Edge"],sprite:"🧊"},
  Clawitzer:{types:["Water"],hp:71,atk:73,def:88,spa:120,spd:89,spe:59,moves:["Surf","Scald","Ice Beam","Dark Pulse"],sprite:"🦞"},
  Gyarados:{types:["Water","Flying"],hp:95,atk:125,def:79,spa:60,spd:100,spe:81,moves:["Waterfall","Crunch","Ice Fang","Body Slam"],sprite:"🐉"},
  Chandelure:{types:["Ghost","Fire"],hp:60,atk:55,def:90,spa:145,spd:90,spe:80,moves:["Shadow Ball","Flamethrower","Energy Ball","Psychic"],sprite:"🕯️"},
  Noivern:{types:["Flying","Dragon"],hp:85,atk:70,def:80,spa:97,spd:80,spe:123,moves:["Dragon Claw","Fly","Dark Pulse","Boomburst"],sprite:"🦇"},
  Dragalge:{types:["Poison","Dragon"],hp:65,atk:75,def:90,spa:97,spd:123,spe:44,moves:["Dragon Pulse","Sludge Bomb","Dark Pulse","Scald"],sprite:"🐠"},
  Drapion:{types:["Poison","Dark"],hp:70,atk:90,def:110,spa:60,spd:75,spe:95,moves:["Cross Poison","Crunch","Earthquake","Night Slash"],sprite:"🦂"},
  Trevenant:{types:["Ghost","Grass"],hp:85,atk:110,def:76,spa:65,spd:82,spe:56,moves:["Shadow Claw","Wood Hammer","Horn Leech","Earthquake"],sprite:"🌳"},
  Gourgeist:{types:["Ghost","Grass"],hp:65,atk:90,def:122,spa:58,spd:75,spe:84,moves:["Shadow Ball","Seed Bomb","Shadow Claw","Energy Ball"],sprite:"🎃"},
  Aegislash:{types:["Steel","Ghost"],hp:60,atk:150,def:150,spa:150,spd:150,spe:60,moves:["Shadow Ball","Iron Head","Sacred Sword","Shadow Claw"],sprite:"🗡️"},
  Klefki:{types:["Steel","Fairy"],hp:57,atk:80,def:91,spa:80,spd:87,spe:75,moves:["Flash Cannon","Dazzling Gleam","Spikes","Play Rough"],sprite:"🔑"},
  Probopass:{types:["Rock","Steel"],hp:60,atk:55,def:145,spa:75,spd:150,spe:40,moves:["Flash Cannon","Stone Edge","Thunderbolt","Earth Power"],sprite:"🧲"},
  Scizor:{types:["Bug","Steel"],hp:70,atk:130,def:100,spa:55,spd:80,spe:65,moves:["X-Scissor","Iron Head","Bug Bite","Swords Dance"],sprite:"✂️"},
  Druddigon:{types:["Dragon"],hp:77,atk:120,def:90,spa:60,spd:90,spe:48,moves:["Dragon Claw","Crunch","Rock Slide","Superpower"],sprite:"🐲"},
  Altaria:{types:["Dragon","Flying"],hp:75,atk:70,def:90,spa:70,spd:105,spe:80,moves:["Dragon Pulse","Moonblast","Hyper Voice","Fly"],sprite:"☁️"},
  Pyroar2:{types:["Fire","Normal"],hp:86,atk:68,def:72,spa:109,spd:66,spe:106,moves:["Flamethrower","Hyper Voice","Dark Pulse","Fire Blast"],sprite:"👑"},
  Torkoal:{types:["Fire"],hp:70,atk:85,def:140,spa:85,spd:70,spe:20,moves:["Flamethrower","Earth Power","Smog","Shell Smash"],sprite:"🐢"},
  Talonflame:{types:["Fire","Flying"],hp:78,atk:81,def:71,spa:74,spd:69,spe:126,moves:["Flare Blitz","Brave Bird","Aerial Ace","Will-O-Wisp"],sprite:"🔥"},
  Starmie:{types:["Water","Psychic"],hp:60,atk:75,def:85,spa:100,spd:85,spe:115,moves:["Surf","Psychic","Ice Beam","Thunderbolt"],sprite:"⭐"},
  Barbaracle:{types:["Rock","Water"],hp:72,atk:105,def:115,spa:54,spd:86,spe:68,moves:["Stone Edge","Cross Chop","Razor Shell","Earthquake"],sprite:"🦀"},
  Mawile:{types:["Steel","Fairy"],hp:50,atk:85,def:85,spa:55,spd:55,spe:50,moves:["Iron Head","Play Rough","Fairy Wind","Bite"],sprite:"😬"},
  "Mr. Mime":{types:["Psychic","Fairy"],hp:40,atk:45,def:65,spa:100,spd:120,spe:90,moves:["Psychic","Moonblast","Dazzling Gleam","Reflect"],sprite:"🤡"},
  Sylveon:{types:["Fairy"],hp:95,atk:65,def:65,spa:110,spd:130,spe:60,moves:["Moonblast","Hyper Voice","Shadow Ball","Psyshock"],sprite:"🎀"},
  Sigilyph:{types:["Psychic","Flying"],hp:72,atk:58,def:80,spa:103,spd:80,spe:97,moves:["Psychic","Air Slash","Ice Beam","Energy Ball"],sprite:"🔮"},
  Slowking:{types:["Water","Psychic"],hp:95,atk:75,def:80,spa:100,spd:110,spe:30,moves:["Psychic","Surf","Fire Blast","Thunder Wave"],sprite:"👑"},
  Meowstic:{types:["Psychic"],hp:74,atk:48,def:76,spa:83,spd:81,spe:104,moves:["Psychic","Shadow Ball","Energy Ball","Thunderbolt"],sprite:"😺"},
  Jumpluff:{types:["Grass","Flying"],hp:75,atk:55,def:70,spa:55,spd:95,spe:110,moves:["Acrobatics","Bullet Seed","Cotton Spore","Aerial Ace"],sprite:"🌺"},
  Weepinbell:{types:["Grass","Poison"],hp:65,atk:90,def:50,spa:85,spd:45,spe:55,moves:["Razor Leaf","Poison Powder","Slam","Seed Bomb"],sprite:"🌿"},
  Gogoat:{types:["Grass"],hp:123,atk:100,def:62,spa:97,spd:81,spe:68,moves:["Razor Leaf","Bulk Up","Rock Slide","Body Slam"],sprite:"🐐"},
};

// ---- GYM DATA ----
const GYMS = [
  {id:0,city:"Santalune City",leader:"Viola",badge:"Bug Badge",type:"Bug",
   quote:"My lens captures everything — including your defeat!",
   winQuote:"You've proven your strength. Here is the Bug Badge!",
   team:[{name:"Surskit",level:10},{name:"Vivillon",level:12,moves:["Gust","Bug Bite","Energy Ball","Psychic"]}]},
  {id:1,city:"Cyllage City",leader:"Grant",badge:"Cliff Badge",type:"Rock",
   quote:"You can't climb to the top without challenging the rock face!",
   winQuote:"You've scaled my defenses! Take the Cliff Badge!",
   team:[{name:"Amaura",level:25},{name:"Tyrunt",level:25}]},
  {id:2,city:"Shalour City",leader:"Korrina",badge:"Rumble Badge",type:"Fighting",
   quote:"I can feel your fighting spirit! Let's go!",
   winQuote:"You've got the moves! Accept the Rumble Badge!",
   team:[{name:"Mienfoo",level:29},{name:"Pancham",level:28,moves:["Karate Chop","Low Kick","Comet Punch","Crunch"]},{name:"Machamp",level:32}]},
  {id:3,city:"Coumarine City",leader:"Ramos",badge:"Plant Badge",type:"Grass",
   quote:"Hm-hm-hm... Are ye ready for the likes of me, young sprout?",
   winQuote:"Ye have the strength of a mighty tree! Take the Plant Badge!",
   team:[{name:"Jumpluff",level:30,moves:["Acrobatics","Bullet Seed","Cotton Spore","Aerial Ace"]},{name:"Weepinbell",level:31,moves:["Razor Leaf","Poison Powder","Slam","Seed Bomb"]},{name:"Gogoat",level:34,moves:["Razor Leaf","Bulk Up","Rock Slide","Body Slam"]}]},
  {id:4,city:"Laverre City",leader:"Valerie",badge:"Fairy Badge",type:"Fairy",
   quote:"I shall show you the elegance of Fairy-type Pokemon!",
   winQuote:"You are worthy of the Fairy Badge!",
   team:[{name:"Mawile",level:38,moves:["Iron Head","Play Rough","Fairy Wind","Bite"]},{name:"Mr. Mime",level:38,moves:["Psychic","Moonblast","Dazzling Gleam","Reflect"]},{name:"Sylveon",level:42,moves:["Moonblast","Hyper Voice","Shadow Ball","Psyshock"]}]},
  {id:5,city:"Anistar City",leader:"Olympia",badge:"Psychic Badge",type:"Psychic",
   quote:"The future is written in the stars... can you rewrite yours?",
   winQuote:"Your future shines bright. Here is the Psychic Badge!",
   team:[{name:"Sigilyph",level:44,moves:["Psychic","Air Slash","Ice Beam","Energy Ball"]},{name:"Slowking",level:45,moves:["Psychic","Surf","Fire Blast","Thunder Wave"]},{name:"Meowstic",level:48,moves:["Psychic","Shadow Ball","Energy Ball","Thunderbolt"]}]},
  {id:6,city:"Snowbelle City",leader:"Wulfric",badge:"Iceberg Badge",type:"Ice",
   quote:"My icy heart won't melt for just anyone! Come at me!",
   winQuote:"Your fire has thawed me! Take the Iceberg Badge!",
   team:[{name:"Abomasnow",level:56,moves:["Blizzard","Energy Ball","Ice Punch","Wood Hammer"]},{name:"Cryogonal",level:55,moves:["Ice Beam","Blizzard","Recover","Flash Cannon"]},{name:"Avalugg",level:59,moves:["Avalanche","Ice Fang","Crunch","Stone Edge"]}]},
  {id:7,city:"Pokemon League",leader:"Wikstrom",badge:"",type:"Steel",isElite:true,
   quote:"Upon my Aegislash! Face the might of the Elite Four!",
   winQuote:"A knight worthy of Kalos! Extraordinary!",
   team:[{name:"Klefki",level:63,moves:["Flash Cannon","Dazzling Gleam","Spikes","Play Rough"]},{name:"Probopass",level:63,moves:["Flash Cannon","Stone Edge","Thunderbolt","Earth Power"]},{name:"Scizor",level:65,moves:["X-Scissor","Iron Head","Bug Bite","Swords Dance"]},{name:"Aegislash",level:68,moves:["Shadow Ball","Iron Head","Sacred Sword","Shadow Claw"]}]},
  {id:8,city:"Pokemon League",leader:"Drasna",badge:"",type:"Dragon",isElite:true,
   quote:"My dragons are burning with desire to battle you!",
   winQuote:"Magnificent! You have the heart of a dragon!",
   team:[{name:"Dragalge",level:63,moves:["Dragon Pulse","Sludge Bomb","Dark Pulse","Scald"]},{name:"Druddigon",level:65,moves:["Dragon Claw","Crunch","Rock Slide","Superpower"]},{name:"Altaria",level:64,moves:["Dragon Pulse","Moonblast","Hyper Voice","Fly"]},{name:"Noivern",level:68,moves:["Dragon Claw","Fly","Dark Pulse","Boomburst"]}]},
  {id:9,city:"Pokemon League",leader:"Malva",badge:"",type:"Fire",isElite:true,
   quote:"I'm Elite Four... and a news anchor. I wonder which role I prefer?",
   winQuote:"Hmph. You're stronger than I'd like to admit.",
   team:[{name:"Pyroar2",level:65,moves:["Flamethrower","Hyper Voice","Dark Pulse","Fire Blast"]},{name:"Torkoal",level:65,moves:["Flamethrower","Earth Power","Smog","Shell Smash"]},{name:"Chandelure",level:66,moves:["Shadow Ball","Flamethrower","Energy Ball","Psychic"]},{name:"Talonflame",level:68,moves:["Flare Blitz","Brave Bird","Aerial Ace","Will-O-Wisp"]}]},
  {id:10,city:"Pokemon League",leader:"Siebold",badge:"",type:"Water",isElite:true,
   quote:"Cooking and battle are alike — both require heart and soul!",
   winQuote:"You are a master chef of battle!",
   team:[{name:"Clawitzer",level:65,moves:["Surf","Scald","Ice Beam","Dark Pulse"]},{name:"Gyarados",level:66,moves:["Waterfall","Crunch","Ice Fang","Body Slam"]},{name:"Starmie",level:63,moves:["Surf","Psychic","Ice Beam","Thunderbolt"]},{name:"Barbaracle",level:68,moves:["Stone Edge","Cross Chop","Razor Shell","Earthquake"]}]},
  {id:11,city:"Pokemon League",leader:"Diantha",badge:"",type:"Various",isChampion:true,
   quote:"As Champion of Kalos, I will show you true Pokemon mastery!",
   winQuote:"You are the new Champion of Kalos! Congratulations! The world awaits you!",
   team:[{name:"Hawlucha",level:68,moves:["High Jump Kick","Aerial Ace","Stone Edge","X-Scissor"]},{name:"Tyrantrum",level:69,moves:["Stone Edge","Dragon Claw","Earthquake","Crunch"]},{name:"Aurorus",level:71,moves:["Blizzard","Stone Edge","Thunder","Hyper Voice"]},{name:"Gourgeist",level:72,moves:["Shadow Ball","Seed Bomb","Shadow Claw","Energy Ball"]},{name:"Goodra",level:74,moves:["Outrage","Dragon Claw","Sludge Wave","Muddy Water"]},{name:"Gardevoir",level:78,moves:["Moonblast","Psychic","Shadow Ball","Thunderbolt"]}]},
];

const LOCATIONS = [
  {id:"vaniville",name:"Vaniville Town",type:"town",desc:"Your home town. A fresh start awaits!",connections:["route1"],shop:false,heal:false},
  {id:"route1",name:"Route 1",type:"route",desc:"A short road to Aquacorde.",connections:["vaniville","aquacorde"],wild:false},
  {id:"aquacorde",name:"Aquacorde Town",type:"town",desc:"A town beside a fast-flowing river. Get your first Pokemon here!",connections:["route1","route2"],shop:true,heal:true,starter:true},
  {id:"route2",name:"Route 2",type:"route",desc:"Wild Pokemon roam here.",connections:["aquacorde","santalune_forest"],wild:true,wildPokemon:["Bunnelby","Pidgey","Fletchling","Scatterbug"],wildLvRange:[2,5]},
  {id:"santalune_forest",name:"Santalune Forest",type:"route",desc:"A bright forest full of Bug Pokemon.",connections:["route2","route3"],wild:true,wildPokemon:["Scatterbug","Bunnelby","Pikachu","Fletchling"],wildLvRange:[3,6]},
  {id:"route3",name:"Route 3",type:"route",desc:"Flowers line the path ahead.",connections:["santalune_forest","santalune"],wild:true,wildPokemon:["Bunnelby","Pidgey","Fletchling","Ralts"],wildLvRange:[4,7]},
  {id:"santalune",name:"Santalune City",type:"city",desc:"City of skateboarders. Gym Leader Viola awaits!",connections:["route3","route4"],shop:true,heal:true,gymId:0},
  {id:"route4",name:"Route 4",type:"route",desc:"Flowers and Pokemon trainers line this route.",connections:["santalune","lumiose"],wild:true,wildPokemon:["Ralts","Litleo","Pikachu","Bunnelby"],wildLvRange:[8,12]},
  {id:"lumiose",name:"Lumiose City",type:"city",desc:"The dazzling heart of Kalos. The Prism Tower gleams in the center.",connections:["route4","route5","route13","route14"],shop:true,heal:true},
  {id:"route5",name:"Route 5",type:"route",desc:"A road through wide open fields.",connections:["lumiose","camphrier"],wild:true,wildPokemon:["Pikachu","Pancham","Fletchling","Ralts"],wildLvRange:[13,17]},
  {id:"camphrier",name:"Camphrier Town",type:"town",desc:"An ancient town with a sleepy atmosphere.",connections:["route5","route6"],shop:true,heal:true},
  {id:"route6",name:"Route 6",type:"route",desc:"Wild Pokemon hide in the tall grass.",connections:["camphrier","parfum_palace"],wild:true,wildPokemon:["Honedge","Goomy","Pikachu","Pancham"],wildLvRange:[16,20]},
  {id:"parfum_palace",name:"Parfum Palace",type:"town",desc:"A magnificent palace from another era.",connections:["route6","route7"],heal:true},
  {id:"route7",name:"Route 7",type:"route",desc:"Fossil Pokemon roam these ancient lands.",connections:["parfum_palace","ambrette"],wild:true,wildPokemon:["Goomy","Tyrunt","Amaura","Hawlucha"],wildLvRange:[19,23]},
  {id:"ambrette",name:"Ambrette Town",type:"town",desc:"A town devoted to fossil research.",connections:["route7","cyllage"],shop:true,heal:true},
  {id:"cyllage",name:"Cyllage City",type:"city",desc:"A city carved into cliffsides by the sea. Gym Leader Grant challenges you!",connections:["ambrette","route10"],shop:true,heal:true,gymId:1},
  {id:"route10",name:"Route 10",type:"route",desc:"Mysterious Pokemon lurk on this rocky route.",connections:["cyllage","shalour"],wild:true,wildPokemon:["Litleo","Pyroar","Hawlucha","Pancham"],wildLvRange:[24,28]},
  {id:"shalour",name:"Shalour City",type:"city",desc:"Home of the Tower of Mastery. Gym Leader Korrina fights here!",connections:["route10","coumarine"],shop:true,heal:true,gymId:2},
  {id:"coumarine",name:"Coumarine City",type:"city",desc:"A breezy seaside city. Gym Leader Ramos awaits in his treetop gym!",connections:["shalour","lumiose"],shop:true,heal:true,gymId:3},
  {id:"route13",name:"Route 13",type:"route",desc:"The Lumiose Badlands stretch out before you.",connections:["coumarine","lumiose"],wild:true,wildPokemon:["Goomy","Sliggoo","Honedge","Pikachu"],wildLvRange:[30,35]},
  {id:"route14",name:"Route 14",type:"route",desc:"A damp, misty route.",connections:["lumiose","laverre"],wild:true,wildPokemon:["Goomy","Tyrunt","Amaura","Honedge"],wildLvRange:[33,38]},
  {id:"laverre",name:"Laverre City",type:"city",desc:"A city built from a giant toppled tree. Fairy Gym Leader Valerie waits!",connections:["route14","dendemille"],shop:true,heal:true,gymId:4},
  {id:"dendemille",name:"Dendemille Town",type:"town",desc:"A rural town surrounded by windmills.",connections:["laverre","anistar"],shop:true,heal:true},
  {id:"anistar",name:"Anistar City",type:"city",desc:"The city of the mysterious sundial. Psychic Gym Leader Olympia is here.",connections:["dendemille","couriway"],shop:true,heal:true,gymId:5},
  {id:"couriway",name:"Couriway Town",type:"town",desc:"A town connected by massive waterfalls.",connections:["anistar","snowbelle"],heal:true},
  {id:"snowbelle",name:"Snowbelle City",type:"city",desc:"A city covered in snow year-round. Ice Gym Leader Wulfric is the final gym!",connections:["couriway","victory_road"],shop:true,heal:true,gymId:6},
  {id:"victory_road",name:"Victory Road",type:"route",desc:"The final challenge before the Pokemon League.",connections:["snowbelle","pokemon_league"],wild:true,wildPokemon:["Pangoro","Hawlucha","Tyrunt","Goodra"],wildLvRange:[55,60]},
  {id:"pokemon_league",name:"Pokemon League",type:"special",desc:"The pinnacle of Kalos Pokemon battling. Face the Elite Four and Champion!",connections:["victory_road"],heal:true,gymId:7},
];

const WILD_ENCOUNTERS = {
  route2:["Bunnelby","Pidgey","Fletchling","Scatterbug"],
  santalune_forest:["Scatterbug","Bunnelby","Pikachu","Fletchling"],
  route3:["Bunnelby","Pidgey","Fletchling","Ralts"],
  route4:["Ralts","Litleo","Pikachu","Bunnelby"],
  route5:["Pikachu","Pancham","Fletchling","Ralts"],
  route6:["Honedge","Goomy","Pikachu","Pancham"],
  route7:["Goomy","Tyrunt","Amaura","Hawlucha"],
  route10:["Litleo","Pyroar","Hawlucha","Pancham"],
  route13:["Goomy","Sliggoo","Honedge","Pikachu"],
  route14:["Goomy","Tyrunt","Amaura","Honedge"],
  victory_road:["Pangoro","Hawlucha","Tyrunt","Goodra"],
};

const ITEMS_DB = {
  "Potion":{desc:"Restores 20 HP",cost:300,heal:20},
  "Super Potion":{desc:"Restores 50 HP",cost:700,heal:50},
  "Hyper Potion":{desc:"Restores 120 HP",cost:1200,heal:120},
  "Max Potion":{desc:"Fully restores HP",cost:2500,heal:999},
  "Poke Ball":{desc:"Catch wild Pokemon",cost:200,isBall:true,rate:1},
  "Great Ball":{desc:"Better catch rate",cost:600,isBall:true,rate:1.5},
  "Ultra Ball":{desc:"High catch rate",cost:1200,isBall:true,rate:2},
};

// ============================================================
// GAME HELPERS
// ============================================================
function calcStat(base, level, isHP=false) {
  if(isHP) return Math.floor((2*base*level)/100) + level + 10;
  return Math.floor((2*base*level)/100) + 5;
}

function createPokemon(name, level, movesOverride=null) {
  const data = POKEMON_DB[name];
  if(!data) return null;
  const maxHP = calcStat(data.hp, level, true);
  const moves = (movesOverride || data.moves).slice(0,4).map(m => {
    const md = MOVES_DB[m];
    return md ? { name:m, pp:md.pp, maxPP:md.maxPP||md.pp } : null;
  }).filter(Boolean);
  return {
    name, level,
    types: data.types,
    maxHP, hp: maxHP,
    atk: calcStat(data.atk, level),
    def: calcStat(data.def, level),
    spa: calcStat(data.spa, level),
    spd: calcStat(data.spd, level),
    spe: calcStat(data.spe, level),
    moves,
    exp: 0,
    expToNext: Math.floor(Math.pow(level+1, 3) - Math.pow(level, 3)),
    status: null,
    statMods: {atk:0,def:0,spa:0,spd:0,spe:0,acc:0},
    sprite: data.sprite || "❓",
    evo: data.evo,
    evoLv: data.evoLv,
  };
}

function getStatMod(stage) {
  const mods = [0.25,0.28,0.33,0.4,0.5,0.66,1,1.5,2,2.5,3,3.5,4];
  return mods[Math.max(0,Math.min(12, stage+6))];
}

function calcDamage(attacker, defender, moveName) {
  const move = MOVES_DB[moveName];
  if(!move || move.cat==="Status" || !move.power) return 0;
  const isPhys = move.cat==="Physical";
  const atkStat = isPhys ? attacker.atk * getStatMod(attacker.statMods.atk) : attacker.spa * getStatMod(attacker.statMods.spa);
  const defStat = isPhys ? defender.def * getStatMod(defender.statMods.def) : defender.spd * getStatMod(defender.statMods.spd);
  const lvl = attacker.level;
  const bp = move.power;
  const stab = attacker.types.includes(move.type) ? 1.5 : 1;
  const eff = getEff(move.type, defender.types);
  const rand = 0.85 + Math.random()*0.15;
  const dmg = Math.floor(((2*lvl/5+2)*bp*(atkStat/defStat)/50+2)*stab*eff*rand);
  return Math.max(1, dmg);
}

function effText(mult) {
  if(mult===0) return "It had no effect...";
  if(mult>=4) return "It's super effective!!";
  if(mult>=2) return "It's super effective!";
  if(mult<=0.25) return "It's not very effective...";
  if(mult<=0.5) return "It's not very effective.";
  return "";
}

function gainExp(pokemon, foeLevel) {
  const gained = Math.floor((foeLevel * foeLevel) / 7);
  pokemon.exp += gained;
  const msgs = [`${pokemon.name} gained ${gained} EXP!`];
  while(pokemon.exp >= pokemon.expToNext) {
    pokemon.exp -= pokemon.expToNext;
    pokemon.level++;
    // Recalc stats
    const data = POKEMON_DB[pokemon.name];
    pokemon.maxHP = calcStat(data.hp, pokemon.level, true);
    pokemon.hp = Math.min(pokemon.hp + calcStat(data.hp, 1, true), pokemon.maxHP);
    pokemon.atk = calcStat(data.atk, pokemon.level);
    pokemon.def = calcStat(data.def, pokemon.level);
    pokemon.spa = calcStat(data.spa, pokemon.level);
    pokemon.spd = calcStat(data.spd, pokemon.level);
    pokemon.spe = calcStat(data.spe, pokemon.level);
    pokemon.expToNext = Math.floor(Math.pow(pokemon.level+1,3) - Math.pow(pokemon.level,3));
    msgs.push(`${pokemon.name} grew to Lv. ${pokemon.level}!`);
    // Learn moves
    const allMoves = POKEMON_DB[pokemon.name].moves;
    if(allMoves.length > pokemon.moves.length && pokemon.moves.length < 4) {
      const newMove = allMoves[pokemon.moves.length];
      if(newMove && MOVES_DB[newMove] && !pokemon.moves.find(m=>m.name===newMove)) {
        const md = MOVES_DB[newMove];
        pokemon.moves.push({name:newMove, pp:md.pp, maxPP:md.maxPP||md.pp});
        msgs.push(`${pokemon.name} learned ${newMove}!`);
      }
    }
    // Check evolution
    if(pokemon.evo && pokemon.level >= pokemon.evoLv) {
      const oldName = pokemon.name;
      const newData = POKEMON_DB[pokemon.evo];
      if(newData) {
        pokemon.name = pokemon.evo;
        pokemon.types = newData.types;
        pokemon.sprite = newData.sprite || "❓";
        pokemon.evo = newData.evo;
        pokemon.evoLv = newData.evoLv;
        msgs.push(`✨ ${oldName} evolved into ${pokemon.name}!`);
      }
    }
  }
  return msgs;
}

// ============================================================
// UI COMPONENTS
// ============================================================
function TypeBadge({type}) {
  return <span style={{background:TYPE_COLORS[type]||"#888",color:"#fff",fontSize:10,padding:"1px 6px",borderRadius:4,fontWeight:"bold",letterSpacing:0.5}}>{type}</span>;
}

function HPBar({current, max, small}) {
  const pct = Math.max(0, current/max*100);
  const col = pct>50?"#44cc44":pct>20?"#ffcc00":"#ff4444";
  return (
    <div style={{width:"100%",height:small?6:10,background:"#333",borderRadius:4,overflow:"hidden"}}>
      <div style={{width:`${pct}%`,height:"100%",background:col,transition:"width 0.3s"}}/>
    </div>
  );
}

function PokemonCard({pokemon, active, onClick, dimmed}) {
  if(!pokemon) return null;
  return (
    <div onClick={onClick} style={{
      background:active?"#2a4a2a":"#1a2a1a",
      border:active?"2px solid #44ff44":"2px solid #2a3a2a",
      borderRadius:10,padding:"8px 10px",cursor:onClick?"pointer":"default",
      opacity:dimmed?0.5:1,transition:"all 0.2s",minWidth:100
    }}>
      <div style={{fontSize:24,textAlign:"center"}}>{pokemon.sprite}</div>
      <div style={{color:"#e8dfc8",fontSize:12,fontWeight:"bold",textAlign:"center"}}>{pokemon.name}</div>
      <div style={{color:"#8ab89a",fontSize:10,textAlign:"center"}}>Lv.{pokemon.level}</div>
      <div style={{display:"flex",gap:3,justifyContent:"center",marginTop:2,flexWrap:"wrap"}}>
        {pokemon.types.map(t=><TypeBadge key={t} type={t}/>)}
      </div>
      <HPBar current={pokemon.hp} max={pokemon.maxHP} small/>
      <div style={{color:"#8ab89a",fontSize:10,textAlign:"center"}}>{pokemon.hp}/{pokemon.maxHP}</div>
    </div>
  );
}

// ============================================================
// BATTLE SCREEN
// ============================================================
function BattleScreen({playerParty, setPlayerParty, enemy, enemyName, isBoss, gymId, onWin, onLose, isWild, wildPokemon}) {
  const [playerIdx, setPlayerIdx] = useState(0);
  const [enemyPokemon, setEnemyPokemon] = useState(null);
  const [enemyIdx, setEnemyIdx] = useState(0);
  const [log, setLog] = useState([]);
  const [phase, setPhase] = useState("choose"); // choose|anim|switch|caught|bag
  const [pendingMsgs, setPendingMsgs] = useState([]);
  const [msgIdx, setMsgIdx] = useState(0);
  const [party, setParty] = useState(playerParty.map(p=>({...p,statMods:{...p.statMods}})));
  const [enemyTeam, setEnemyTeam] = useState([]);
  const [bagOpen, setBagOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const logRef = useRef(null);

  useEffect(()=>{
    if(isWild && wildPokemon) {
      setEnemyTeam([wildPokemon]);
      setEnemyPokemon(wildPokemon);
    } else if(enemy) {
      const team = enemy.team.map(t=>createPokemon(t.name, t.level, t.moves));
      setEnemyTeam(team);
      setEnemyPokemon(team[0]);
    }
  },[]);

  useEffect(()=>{
    if(logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  },[log]);

  const player = party[playerIdx];

  function addLog(msgs) {
    setLog(l=>[...l,...(Array.isArray(msgs)?msgs:[msgs])]);
  }

  function doPlayerMove(moveName) {
    if(phase!=="choose") return;
    const move = MOVES_DB[moveName];
    if(!move) return;
    const mi = player.moves.findIndex(m=>m.name===moveName);
    if(player.moves[mi].pp<=0) { addLog(["No PP left!"]); return; }

    const newParty = party.map(p=>({...p}));
    const attacker = newParty[playerIdx];
    const newEnemyTeam = enemyTeam.map(p=>({...p}));
    const def = {...enemyPokemon};

    attacker.moves[mi].pp--;
    const msgs = [];

    if(move.cat==="Status") {
      msgs.push(`${attacker.name} used ${moveName}!`);
      applyStatus(move.effect, attacker, def, msgs);
    } else {
      const dmg = calcDamage(attacker, def, moveName);
      const eff = getEff(move.type, def.types);
      msgs.push(`${attacker.name} used ${moveName}!`);
      def.hp = Math.max(0, def.hp - dmg);
      if(eff!==1) msgs.push(effText(eff));
      msgs.push(`Dealt ${dmg} damage! (${def.hp}/${def.maxHP} HP)`);
    }

    // Enemy faint check
    if(def.hp<=0) {
      msgs.push(`${def.name} fainted!`);
      const expMsgs = gainExp(attacker, def.level);
      msgs.push(...expMsgs);
      newParty[playerIdx] = attacker;
      setParty(newParty);
      setPlayerParty(newParty);

      const nextEnemyIdx = enemyIdx+1;
      if(!isWild && nextEnemyIdx < enemyTeam.length) {
        const next = newEnemyTeam[nextEnemyIdx];
        msgs.push(`${enemyName} sent out ${next.name}!`);
        addLog(msgs);
        setEnemyPokemon(next);
        setEnemyIdx(nextEnemyIdx);
      } else {
        addLog(msgs);
        setTimeout(()=>onWin(newParty), 1200);
        return;
      }
    } else {
      newParty[playerIdx] = attacker;
      // Enemy turn
      const enemyMove = chooseEnemyMove(def, attacker);
      setTimeout(()=>{
        doEnemyMove(def, newParty, playerIdx, enemyMove, msgs, newEnemyTeam, nextEnemyIdx=>nextEnemyIdx);
      }, 600);
      setEnemyPokemon(def);
      setEnemyTeam(newEnemyTeam.map((p,i)=>i===enemyIdx?def:p));
      setParty(newParty);
    }
    addLog(msgs);
  }

  function applyStatus(effect, user, target, msgs) {
    if(!effect) return;
    const statMap = {atk:"atk",def:"def",spa:"spa",spd:"spd",spe:"spe",acc:"acc"};
    const match = effect.match(/^(atk|def|spa|spd|spe|acc)([+-]\d)$/);
    if(match) {
      const stat = match[1];
      const delta = parseInt(match[2]);
      const tgt = effect.includes("+") ? user : target;
      tgt.statMods[stat] = Math.max(-6, Math.min(6, (tgt.statMods[stat]||0)+delta));
      msgs.push(`${delta>0?user.name:target.name}'s ${stat} ${delta>0?"rose":"fell"}!`);
    } else if(effect==="heal") {
      const heal = Math.floor(user.maxHP/2);
      user.hp = Math.min(user.maxHP, user.hp+heal);
      msgs.push(`${user.name} restored HP!`);
    }
  }

  function chooseEnemyMove(enemy, target) {
    const usable = enemy.moves.filter(m=>m.pp>0);
    if(usable.length===0) return "Struggle";
    // Prefer super effective moves
    const supers = usable.filter(m=>{
      const mv = MOVES_DB[m.name];
      return mv && mv.cat!=="Status" && getEff(mv.type, target.types)>=2;
    });
    if(supers.length>0) return supers[Math.floor(Math.random()*supers.length)].name;
    return usable[Math.floor(Math.random()*usable.length)].name;
  }

  function doEnemyMove(enemyPok, playerPartyLocal, pidx, moveName, prevMsgs, eteam, nextFn) {
    const move = MOVES_DB[moveName]||{type:"Normal",cat:"Physical",power:50,pp:99,maxPP:99,acc:100};
    const newParty = playerPartyLocal.map(p=>({...p}));
    const target = newParty[pidx];
    const msgs = [...prevMsgs];

    msgs.push(`${enemyPok.name} used ${moveName}!`);

    if(move.cat==="Status") {
      applyStatus(move.effect, enemyPok, target, msgs);
    } else {
      const dmg = calcDamage(enemyPok, target, moveName);
      const eff = getEff(move.type, target.types);
      target.hp = Math.max(0, target.hp-dmg);
      if(eff!==1) msgs.push(effText(eff));
      msgs.push(`${target.name} took ${dmg} damage! (${target.hp}/${target.maxHP} HP)`);
    }

    if(target.hp<=0) {
      msgs.push(`${target.name} fainted!`);
      newParty[pidx] = target;
      // Check if any alive
      const alive = newParty.findIndex(p=>p.hp>0);
      if(alive<0) {
        addLog(msgs);
        setParty(newParty);
        setTimeout(()=>onLose(), 1200);
        return;
      } else {
        addLog(msgs);
        setParty(newParty);
        setPlayerParty(newParty);
        setPlayerIdx(alive);
      }
    } else {
      newParty[pidx] = target;
      setParty(newParty);
      setPlayerParty(newParty);
      addLog(msgs);
    }
  }

  function tryRunAway() {
    if(!isWild) { addLog(["You can't run from a trainer battle!"]); return; }
    addLog(["Got away safely!"]);
    setTimeout(()=>onLose(), 800);
  }

  function tryUseBall(ballName) {
    if(!isWild) { addLog(["You can only catch wild Pokemon!"]); setBagOpen(false); return; }
    const ball = ITEMS_DB[ballName];
    const catchMult = ball?.rate||1;
    const hp = enemyPokemon.hp;
    const maxHP = enemyPokemon.maxHP;
    const rate = Math.floor((maxHP*255*3)/(hp*catchMult));
    const success = Math.random() * 255 < rate;
    setBagOpen(false);
    if(success) {
      addLog([`You threw a ${ballName}...`, `Gotcha! ${enemyPokemon.name} was caught!`]);
      const caught = {...enemyPokemon};
      setTimeout(()=>onWin(party, caught), 1200);
    } else {
      addLog([`You threw a ${ballName}...`, `Oh no! ${enemyPokemon.name} broke free!`]);
    }
  }

  function usePotion(itemName, targetIdx) {
    const item = ITEMS_DB[itemName];
    if(!item?.heal) return;
    const newParty = party.map(p=>({...p}));
    const target = newParty[targetIdx];
    if(target.hp<=0) { addLog(["Can't use on a fainted Pokemon!"]); return; }
    target.hp = Math.min(target.maxHP, target.hp+item.heal);
    setParty(newParty);
    setPlayerParty(newParty);
    addLog([`Used ${itemName} on ${target.name}. HP restored!`]);
    setBagOpen(false);
  }

  if(!enemyPokemon || !player) return <div style={{color:"#fff",padding:20}}>Loading battle...</div>;

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:"linear-gradient(180deg,#1a3a4a 0%,#0d2030 100%)",fontFamily:"'Courier New',monospace",padding:8,gap:6,boxSizing:"border-box",minHeight:"100vh"}}>
      {/* Enemy */}
      <div style={{background:"#1a2a3a",borderRadius:10,padding:10,border:"1px solid #2a4a5a"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{color:"#e8dfc8",fontWeight:"bold",fontSize:14}}>{enemyPokemon.name} {isBoss&&<span style={{color:"#ffd700",fontSize:11}}>★ {enemyName}</span>}</div>
            <div style={{display:"flex",gap:3,marginTop:2}}>{enemyPokemon.types.map(t=><TypeBadge key={t} type={t}/>)}</div>
            <div style={{color:"#8ab89a",fontSize:11,marginTop:2}}>Lv.{enemyPokemon.level}</div>
          </div>
          <div style={{fontSize:40}}>{enemyPokemon.sprite}</div>
        </div>
        <HPBar current={enemyPokemon.hp} max={enemyPokemon.maxHP}/>
        <div style={{color:"#8ab89a",fontSize:11,marginTop:2}}>{enemyPokemon.hp}/{enemyPokemon.maxHP} HP</div>
        {!isWild && <div style={{color:"#6a8a6a",fontSize:10,marginTop:2}}>{enemyIdx+1}/{enemyTeam.length} Pokemon</div>}
      </div>

      {/* Battle log */}
      <div ref={logRef} style={{flex:1,background:"#0d1a20",borderRadius:8,padding:8,overflowY:"auto",maxHeight:140,minHeight:80}}>
        {log.slice(-8).map((l,i)=>(
          <div key={i} style={{color:l.includes("fainted")?"#ff6666":l.includes("evolved")?"#ffd700":l.includes("super effective")?"#ff9944":l.includes("not very")?"#aaaaaa":"#c8d8c8",fontSize:11,lineHeight:1.6}}>{l}</div>
        ))}
        {log.length===0 && <div style={{color:"#4a6a5a",fontSize:11}}>A wild {enemyPokemon?.name} appeared!</div>}
      </div>

      {/* Player pokemon */}
      <div style={{background:"#1a2a1a",borderRadius:10,padding:10,border:"1px solid #2a4a2a"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:36}}>{player.sprite}</div>
          <div style={{flex:1,marginLeft:10}}>
            <div style={{color:"#e8dfc8",fontWeight:"bold",fontSize:14}}>{player.name} <span style={{color:"#8ab89a",fontSize:11}}>Lv.{player.level}</span></div>
            <div style={{display:"flex",gap:3,marginTop:1}}>{player.types.map(t=><TypeBadge key={t} type={t}/>)}</div>
            <HPBar current={player.hp} max={player.maxHP}/>
            <div style={{color:"#8ab89a",fontSize:11,marginTop:1}}>{player.hp}/{player.maxHP} HP</div>
          </div>
        </div>
        <div style={{color:"#6a8a6a",fontSize:10,marginTop:2}}>EXP: {player.exp}/{player.expToNext}</div>
      </div>

      {/* Actions */}
      {!bagOpen && !switchOpen && (
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
            {player.moves.map((m,i)=>{
              const md = MOVES_DB[m.name]||{type:"Normal",cat:"Physical"};
              return (
                <button key={i} onClick={()=>doPlayerMove(m.name)} disabled={m.pp<=0} style={{
                  background:m.pp>0?`${TYPE_COLORS[md.type]}33`:"#1a1a1a",
                  border:`1px solid ${m.pp>0?TYPE_COLORS[md.type]:"#333"}`,
                  borderRadius:6,padding:"6px 4px",cursor:m.pp>0?"pointer":"default",
                  color:m.pp>0?"#e8dfc8":"#555",fontSize:11,
                }}>
                  <div style={{fontWeight:"bold"}}>{m.name}</div>
                  <div style={{fontSize:9,color:"#8ab89a"}}>{md.type} • {m.pp}/{m.maxPP} PP</div>
                </button>
              );
            })}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4}}>
            <button onClick={()=>setSwitchOpen(true)} style={{background:"#1a3a2a",border:"1px solid #2a6a3a",borderRadius:6,padding:"6px 4px",cursor:"pointer",color:"#8ab89a",fontSize:11}}>🔄 Switch</button>
            <button onClick={()=>setBagOpen(true)} style={{background:"#3a2a1a",border:"1px solid #6a4a2a",borderRadius:6,padding:"6px 4px",cursor:"pointer",color:"#c8a870",fontSize:11}}>🎒 Bag</button>
            <button onClick={tryRunAway} style={{background:"#2a1a1a",border:"1px solid #5a2a2a",borderRadius:6,padding:"6px 4px",cursor:"pointer",color:"#c87070",fontSize:11}}>🏃 Run</button>
          </div>
        </>
      )}

      {/* Bag */}
      {bagOpen && (
        <div style={{background:"#1a2a1a",borderRadius:8,padding:8,border:"1px solid #2a4a2a"}}>
          <div style={{color:"#e8dfc8",fontSize:12,marginBottom:6,fontWeight:"bold"}}>🎒 BAG</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,maxHeight:120,overflowY:"auto"}}>
            {["Potion","Super Potion","Hyper Potion","Max Potion"].map(item=>(
              <div key={item}>
                <div style={{color:"#8ab89a",fontSize:10,marginBottom:2}}>{item}:</div>
                {party.map((p,pi)=>(
                  <button key={pi} onClick={()=>usePotion(item,pi)} disabled={p.hp<=0||p.hp===p.maxHP} style={{background:"#1a3a1a",border:"1px solid #2a5a2a",borderRadius:4,padding:"3px 6px",fontSize:10,color:"#c8e8c8",cursor:"pointer",marginBottom:2,width:"100%",opacity:p.hp<=0||p.hp===p.maxHP?0.4:1}}>
                    {p.sprite} {p.name}
                  </button>
                ))}
              </div>
            ))}
            {isWild && ["Poke Ball","Great Ball","Ultra Ball"].map(ball=>(
              <button key={ball} onClick={()=>tryUseBall(ball)} style={{background:"#2a1a3a",border:"1px solid #5a3a6a",borderRadius:4,padding:"5px 6px",fontSize:10,color:"#c8a8e8",cursor:"pointer"}}>
                ⚾ {ball}
              </button>
            ))}
          </div>
          <button onClick={()=>setBagOpen(false)} style={{marginTop:6,background:"#2a1a1a",border:"1px solid #4a2a2a",borderRadius:4,padding:"4px 12px",fontSize:11,color:"#c88888",cursor:"pointer"}}>Back</button>
        </div>
      )}

      {/* Switch */}
      {switchOpen && (
        <div style={{background:"#1a2a1a",borderRadius:8,padding:8,border:"1px solid #2a4a2a"}}>
          <div style={{color:"#e8dfc8",fontSize:12,marginBottom:6,fontWeight:"bold"}}>Switch Pokemon</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {party.map((p,i)=>(
              <button key={i} onClick={()=>{if(p.hp>0&&i!==playerIdx){setPlayerIdx(i);setSwitchOpen(false);addLog([`Go, ${p.name}!`]);} }} disabled={p.hp<=0||i===playerIdx} style={{
                background:i===playerIdx?"#1a3a1a":"#1a2a1a",border:`1px solid ${p.hp>0?"#2a5a2a":"#3a2a2a"}`,
                borderRadius:6,padding:"6px 8px",cursor:p.hp>0&&i!==playerIdx?"pointer":"default",
                color:p.hp>0?"#e8dfc8":"#555",fontSize:11,opacity:p.hp<=0?0.4:1
              }}>
                {p.sprite} {p.name}<br/>
                <span style={{fontSize:9,color:"#8ab89a"}}>{p.hp}/{p.maxHP}</span>
              </button>
            ))}
          </div>
          <button onClick={()=>setSwitchOpen(false)} style={{marginTop:6,background:"#2a1a1a",border:"1px solid #4a2a2a",borderRadius:4,padding:"4px 12px",fontSize:11,color:"#c88888",cursor:"pointer"}}>Back</button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN GAME
// ============================================================
export default function PokemonGame() {
  const [screen, setScreen] = useState("title"); // title|intro|world|battle|gym_intro|gym_win|pokemon_center|shop|pokedex|party|gameover|champion
  const [playerName, setPlayerName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [currentLocation, setCurrentLocation] = useState("vaniville");
  const [party, setParty] = useState([]);
  const [pokeDex, setPokeDex] = useState([]);
  const [badges, setBadges] = useState([]);
  const [money, setMoney] = useState(3000);
  const [bag, setBag] = useState({"Poke Ball":5,"Potion":3});
  const [defeatedGyms, setDefeatedGyms] = useState([]);
  const [currentGym, setCurrentGym] = useState(null);
  const [currentBattle, setCurrentBattle] = useState(null);
  const [battleType, setBattleType] = useState(null); // "gym"|"wild"|"elite"
  const [message, setMessage] = useState("");
  const [gameLog, setGameLog] = useState([]);

  const loc = LOCATIONS.find(l=>l.id===currentLocation);

  function startGame() {
    if(nameInput.trim().length<1) return;
    setPlayerName(nameInput.trim());
    setScreen("intro");
  }

  function choosStarter(name) {
    const p = createPokemon(name, 5);
    setParty([p]);
    setPokeDex([name]);
    setCurrentLocation("aquacorde");
    setScreen("world");
    setMessage(`You received ${name}! Your adventure in Kalos begins!`);
  }

  function travel(destId) {
    const dest = LOCATIONS.find(l=>l.id===destId);
    if(!dest) return;
    // Check if gym was cleared
    if(dest.gymId !== undefined) {
      const gym = GYMS[dest.gymId];
      if(gym && !gym.isElite && !gym.isChampion && !defeatedGyms.includes(gym.id) && badges.length < gym.id) {
        setMessage(`The path to ${dest.name} is blocked! You need more badges first.`);
        return;
      }
    }
    setCurrentLocation(destId);
    setMessage(`Arrived at ${dest.name}.`);
    // Random wild encounter on routes
    if(dest.wild && dest.wildPokemon && Math.random()<0.4) {
      triggerWild(dest);
    }
  }

  function triggerWild(location) {
    const loc = location || LOCATIONS.find(l=>l.id===currentLocation);
    if(!loc?.wild || !loc.wildPokemon) return;
    const name = loc.wildPokemon[Math.floor(Math.random()*loc.wildPokemon.length)];
    const [minLv, maxLv] = loc.wildLvRange || [5,10];
    const level = minLv + Math.floor(Math.random()*(maxLv-minLv+1));
    const wild = createPokemon(name, level);
    if(!wild) return;
    setCurrentBattle({type:"wild",wild,location:loc.id});
    setBattleType("wild");
    setScreen("battle");
  }

  function challengeGym() {
    const gymData = GYMS[loc.gymId];
    if(!gymData) return;
    if(defeatedGyms.includes(gymData.id)) { setMessage(`You already have the ${gymData.badge || "badge"} from here!`); return; }
    // Check gym access for elite four
    if(gymData.isElite || gymData.isChampion) {
      if(badges.length < 7 && !gymData.isChampion) { setMessage("You need all 7 gym badges to enter the Elite Four!"); return; }
      if(gymData.isChampion && defeatedGyms.length < 11) { setMessage("Defeat all Elite Four members first!"); return; }
    }
    setCurrentGym(gymData);
    setCurrentBattle({type:"gym",gym:gymData});
    setBattleType("gym");
    setScreen("gym_intro");
  }

  function startGymBattle() {
    setScreen("battle");
  }

  function onBattleWin(newParty, caughtPokemon) {
    setParty(newParty);
    if(caughtPokemon) {
      // Caught a Pokemon
      const newPartyFull = newParty.length < 6 ? [...newParty, caughtPokemon] : newParty;
      setParty(newPartyFull);
      if(!pokeDex.includes(caughtPokemon.name)) setPokeDex(d=>[...d,caughtPokemon.name]);
      setMessage(`${caughtPokemon.name} was added to your party!`);
      setScreen("world");
      return;
    }
    if(battleType==="gym" && currentGym) {
      const reward = (currentGym.isElite || currentGym.isChampion) ? 8000 : 2000 + currentGym.id*500;
      setMoney(m=>m+reward);
      setDefeatedGyms(d=>[...d,currentGym.id]);
      if(currentGym.badge) setBadges(b=>[...b,currentGym.badge]);
      if(currentGym.isChampion) { setScreen("champion"); return; }
      setScreen("gym_win");
    } else {
      const reward = 200 + (party[0]?.level||5)*10;
      setMoney(m=>m+reward);
      setMessage("You won the battle!");
      setScreen("world");
    }
  }

  function onBattleLose() {
    const healedParty = party.map(p=>({...p, hp:Math.max(1,Math.floor(p.maxHP/2))}));
    setParty(healedParty);
    setMoney(m=>Math.max(100, m-200));
    setMessage("You blacked out! Your Pokemon were taken to the Pokemon Center...");
    // Return to nearest town with heal
    const nearestHeal = LOCATIONS.find(l=>l.heal && l.id!==currentLocation) || LOCATIONS.find(l=>l.heal);
    if(nearestHeal) setCurrentLocation(nearestHeal.id);
    setScreen("world");
  }

  function healParty() {
    const healed = party.map(p=>({
      ...p, hp:p.maxHP,
      moves:p.moves.map(m=>({...m,pp:m.maxPP}))
    }));
    setParty(healed);
    setMessage("Your Pokemon have been healed!");
  }

  function buyItem(itemName) {
    const item = ITEMS_DB[itemName];
    if(!item) return;
    if(money < item.cost) { setMessage("Not enough money!"); return; }
    setMoney(m=>m-item.cost);
    setBag(b=>({...b,[itemName]:(b[itemName]||0)+1}));
    setMessage(`Bought ${itemName}!`);
  }

  function useItemOnPokemon(itemName, pokIdx) {
    const item = ITEMS_DB[itemName];
    if(!item?.heal) return;
    const target = party[pokIdx];
    if(target.hp<=0) { setMessage("Can't use on a fainted Pokemon!"); return; }
    if(target.hp===target.maxHP) { setMessage("HP is already full!"); return; }
    if((bag[itemName]||0)<=0) { setMessage("You're out of that item!"); return; }
    const newParty = party.map((p,i)=>i===pokIdx?{...p,hp:Math.min(p.maxHP,p.hp+item.heal)}:p);
    setParty(newParty);
    setBag(b=>({...b,[itemName]:b[itemName]-1}));
    setMessage(`Used ${itemName} on ${target.name}!`);
  }

  // ── SCREENS ──────────────────────────────────────────────────────

  const bg = "linear-gradient(180deg,#0d1a2e 0%,#0a1020 100%)";
  const panelStyle = {background:"#0d1a10",border:"1px solid #1a3a1a",borderRadius:12,padding:16};
  const btnStyle = {background:"linear-gradient(135deg,#1a4a2a,#0d3018)",border:"1px solid #2a6a3a",color:"#c8e8c8",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:13,fontFamily:"'Courier New',monospace"};
  const dangerBtn = {background:"linear-gradient(135deg,#4a1a1a,#300d0d)",border:"1px solid #6a2a2a",color:"#e8c8c8",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:13,fontFamily:"'Courier New',monospace"};

  if(screen==="title") return (
    <div style={{minHeight:"100vh",background:bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace",color:"#c8e8c8",padding:20}}>
      <div style={{fontSize:48,marginBottom:8}}>⚔️🌸🔥💧</div>
      <h1 style={{fontSize:32,color:"#ffd700",textShadow:"0 0 20px #ffd70066",letterSpacing:4,margin:"0 0 4px"}}>POKEMON</h1>
      <h2 style={{fontSize:20,color:"#88ccff",letterSpacing:8,margin:"0 0 32px"}}>KALOS</h2>
      <div style={{...panelStyle,maxWidth:340,width:"100%",textAlign:"center"}}>
        <p style={{color:"#8ab89a",fontSize:13,marginBottom:16}}>Enter your name, Trainer:</p>
        <input value={nameInput} onChange={e=>setNameInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&startGame()} placeholder="Your name..." style={{background:"#0d2018",border:"1px solid #2a5a3a",borderRadius:6,padding:"8px 12px",color:"#c8e8c8",fontSize:14,width:"100%",boxSizing:"border-box",fontFamily:"'Courier New',monospace",marginBottom:12}}/>
        <button onClick={startGame} style={{...btnStyle,width:"100%",fontSize:15,padding:"10px"}}>New Game ▶</button>
      </div>
      <p style={{color:"#3a6a4a",fontSize:11,marginTop:24}}>8 Gyms • Elite Four • Champion Diantha</p>
    </div>
  );

  if(screen==="intro") return (
    <div style={{minHeight:"100vh",background:bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace",color:"#c8e8c8",padding:20}}>
      <div style={{...panelStyle,maxWidth:380,width:"100%",textAlign:"center"}}>
        <div style={{fontSize:32,marginBottom:8}}>👴</div>
        <p style={{fontSize:13,lineHeight:1.8,color:"#c8e8c8",marginBottom:8}}>
          Welcome to the world of Pokémon, <span style={{color:"#ffd700"}}>{playerName}</span>!
        </p>
        <p style={{fontSize:12,lineHeight:1.8,color:"#8ab89a",marginBottom:16}}>
          The Kalos region is vast and full of wonder. Your journey begins in Vaniville Town. Head to Aquacorde Town to receive your first Pokémon!
        </p>
        <p style={{fontSize:13,color:"#c8e8c8",marginBottom:16}}>Choose your starter Pokémon:</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
          {[
            {name:"Chespin",emoji:"🌰",types:["Grass"],desc:"Hardy & tough"},
            {name:"Fennekin",emoji:"🦊",types:["Fire"],desc:"Clever & fiery"},
            {name:"Froakie",emoji:"🐸",types:["Water"],desc:"Nimble & swift"},
          ].map(s=>(
            <button key={s.name} onClick={()=>choosStarter(s.name)} style={{...panelStyle,cursor:"pointer",border:"1px solid #2a5a3a",padding:12,textAlign:"center",transition:"all 0.2s"}}>
              <div style={{fontSize:32,marginBottom:4}}>{s.emoji}</div>
              <div style={{color:"#ffd700",fontSize:13,fontWeight:"bold"}}>{s.name}</div>
              {s.types.map(t=><TypeBadge key={t} type={t}/>)}
              <div style={{color:"#6a9a7a",fontSize:10,marginTop:4}}>{s.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if(screen==="gym_intro" && currentGym) return (
    <div style={{minHeight:"100vh",background:bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace",color:"#c8e8c8",padding:20}}>
      <div style={{...panelStyle,maxWidth:380,width:"100%",textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:8}}>{currentGym.isChampion?"👑":currentGym.isElite?"🏆":"🏅"}</div>
        <div style={{color:"#ffd700",fontSize:16,fontWeight:"bold",marginBottom:4}}>
          {currentGym.isChampion?"Champion":"Elite Four Member"} {currentGym.leader}
        </div>
        {currentGym.badge && <div style={{color:"#88ccff",fontSize:12,marginBottom:8}}>{currentGym.badge} Gym • {currentGym.type} Type</div>}
        {!currentGym.badge && <div style={{color:"#88ccff",fontSize:12,marginBottom:8}}>{currentGym.type} Specialist</div>}
        <div style={{background:"#0d2018",borderRadius:8,padding:12,marginBottom:16,border:"1px solid #1a4a28"}}>
          <p style={{color:"#c8e8c8",fontSize:13,fontStyle:"italic",lineHeight:1.7,margin:0}}>"{currentGym.quote}"</p>
          <p style={{color:"#8ab89a",fontSize:11,marginTop:8,margin:"8px 0 0"}}>— {currentGym.leader}</p>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{color:"#8ab89a",fontSize:12,marginBottom:6}}>Their team:</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
            {currentGym.team.map((t,i)=>{
              const pd = POKEMON_DB[t.name];
              return <div key={i} style={{background:"#0d2018",borderRadius:6,padding:"4px 8px",fontSize:11,color:"#c8e8c8",border:"1px solid #1a4a28"}}>
                {pd?.sprite||"❓"} {t.name} Lv.{t.level}
              </div>;
            })}
          </div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button onClick={startGymBattle} style={{...btnStyle,background:"linear-gradient(135deg,#4a1a1a,#3a0d0d)",borderColor:"#8a2a2a",color:"#ffcccc"}}>⚔️ Battle!</button>
          <button onClick={()=>setScreen("world")} style={dangerBtn}>← Back</button>
        </div>
      </div>
    </div>
  );

  if(screen==="gym_win" && currentGym) return (
    <div style={{minHeight:"100vh",background:bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace",color:"#c8e8c8",padding:20}}>
      <div style={{...panelStyle,maxWidth:380,width:"100%",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:8}}>🏅</div>
        <div style={{color:"#ffd700",fontSize:18,fontWeight:"bold",marginBottom:8}}>{currentGym.badge} obtained!</div>
        <div style={{background:"#0d2018",borderRadius:8,padding:12,marginBottom:16,border:"1px solid #2a5a28"}}>
          <p style={{color:"#c8e8c8",fontSize:13,fontStyle:"italic",lineHeight:1.7,margin:0}}>"{currentGym.winQuote}"</p>
        </div>
        <div style={{color:"#8ab89a",fontSize:12,marginBottom:16}}>Badges: {badges.length}/7</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",marginBottom:16}}>
          {badges.map((b,i)=><span key={i} style={{background:"#1a3a2a",border:"1px solid #3a7a4a",borderRadius:20,padding:"4px 10px",fontSize:11,color:"#88dd88"}}>🏅 {b}</span>)}
        </div>
        <button onClick={()=>setScreen("world")} style={{...btnStyle,width:"100%"}}>Continue ▶</button>
      </div>
    </div>
  );

  if(screen==="champion") return (
    <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#1a0d2e,#0d0a20)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace",color:"#c8e8c8",padding:20}}>
      <div style={{...panelStyle,maxWidth:420,width:"100%",textAlign:"center",border:"2px solid #ffd700"}}>
        <div style={{fontSize:60,marginBottom:12}}>🏆</div>
        <h1 style={{color:"#ffd700",fontSize:24,margin:"0 0 8px",textShadow:"0 0 20px #ffd700"}}>CHAMPION!</h1>
        <p style={{color:"#e8dfc8",fontSize:14,lineHeight:1.8}}>
          Congratulations, <span style={{color:"#ffd700"}}>{playerName}</span>!<br/>
          You have defeated Champion Diantha and become the new Pokémon Champion of the Kalos region!
        </p>
        <div style={{color:"#88ccff",fontSize:13,margin:"12px 0"}}>
          Your name will be forever enshrined in the Hall of Fame!
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",marginBottom:16}}>
          {badges.map((b,i)=><span key={i} style={{background:"#1a3a2a",border:"1px solid #3a7a4a",borderRadius:20,padding:"4px 10px",fontSize:11,color:"#88dd88"}}>🏅 {b}</span>)}
        </div>
        <div style={{color:"#8ab89a",fontSize:12,marginBottom:16}}>
          Party: {party.map(p=>`${p.sprite}${p.name} Lv.${p.level}`).join(" • ")}
        </div>
        <button onClick={()=>{setScreen("world");setMessage("You are the Kalos Champion! The adventure continues...");}} style={{...btnStyle,width:"100%",fontSize:15,padding:"12px"}}>Continue Your Journey ▶</button>
      </div>
    </div>
  );

  if(screen==="battle" && currentBattle) {
    const isWild = currentBattle.type==="wild";
    const gym = currentBattle.gym;
    return (
      <BattleScreen
        playerParty={party}
        setPlayerParty={setParty}
        enemy={isWild?null:gym}
        enemyName={isWild?null:gym.leader}
        isBoss={!isWild}
        gymId={gym?.id}
        onWin={onBattleWin}
        onLose={onBattleLose}
        isWild={isWild}
        wildPokemon={isWild?currentBattle.wild:null}
      />
    );
  }

  // ── WORLD SCREEN ──────────────────────────────────────────────
  if(screen==="world") return (
    <div style={{minHeight:"100vh",background:bg,fontFamily:"'Courier New',monospace",color:"#c8e8c8",padding:8,boxSizing:"border-box",maxWidth:480,margin:"0 auto"}}>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div>
          <span style={{color:"#ffd700",fontSize:13,fontWeight:"bold"}}>{playerName}</span>
          <span style={{color:"#8ab89a",fontSize:11}}> • 💰{money}</span>
        </div>
        <div style={{display:"flex",gap:4}}>
          {badges.slice(0,4).map((b,i)=><span key={i} style={{fontSize:14}}>🏅</span>)}
          {badges.length>4 && <span style={{color:"#ffd700",fontSize:11}}>+{badges.length-4}</span>}
        </div>
      </div>

      {/* Location */}
      <div style={{...panelStyle,marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{color:"#ffd700",fontSize:15,fontWeight:"bold"}}>{loc?.name}</div>
            <div style={{color:"#6a9a7a",fontSize:11,marginTop:2}}>{loc?.desc}</div>
          </div>
          <span style={{fontSize:20}}>{loc?.type==="city"?"🏙️":loc?.type==="route"?"🌿":"🏘️"}</span>
        </div>
        {message && <div style={{background:"#0d2018",borderRadius:6,padding:"6px 10px",marginTop:8,fontSize:12,color:"#a8d8a8",border:"1px solid #1a4a28"}}>{message}</div>}
      </div>

      {/* Party summary */}
      <div style={{...panelStyle,marginBottom:8}}>
        <div style={{color:"#8ab89a",fontSize:11,marginBottom:6}}>YOUR PARTY</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {party.map((p,i)=>(
            <div key={i} style={{background:p.hp>0?"#0d2018":"#1a0d0d",borderRadius:8,padding:"6px 8px",minWidth:70,border:`1px solid ${p.hp>0?"#1a4a28":"#3a1a1a"}`}}>
              <div style={{fontSize:20,textAlign:"center"}}>{p.sprite}</div>
              <div style={{color:"#c8e8c8",fontSize:10,textAlign:"center"}}>{p.name}</div>
              <div style={{color:"#8ab89a",fontSize:9,textAlign:"center"}}>Lv.{p.level}</div>
              <HPBar current={p.hp} max={p.maxHP} small/>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
        {/* Travel */}
        <div style={{...panelStyle,gridColumn:"1/-1"}}>
          <div style={{color:"#8ab89a",fontSize:11,marginBottom:6}}>🗺️ TRAVEL TO</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {(loc?.connections||[]).map(connId=>{
              const dest = LOCATIONS.find(l=>l.id===connId);
              if(!dest) return null;
              return (
                <button key={connId} onClick={()=>travel(connId)} style={{...btnStyle,fontSize:11,padding:"5px 10px"}}>
                  {dest.type==="city"?"🏙️":dest.type==="route"?"🌿":"🏘️"} {dest.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gym */}
        {loc?.gymId !== undefined && !defeatedGyms.includes(GYMS[loc.gymId]?.id) && (
          <button onClick={challengeGym} style={{...btnStyle,gridColumn:"1/-1",background:"linear-gradient(135deg,#4a2a0a,#3a1a00)",borderColor:"#8a5a1a",color:"#ffd788",fontSize:13,padding:"10px"}}>
            ⚔️ Challenge {GYMS[loc.gymId]?.leader}'s {GYMS[loc.gymId]?.isChampion?"Championship":GYMS[loc.gymId]?.isElite?"Elite Four":"Gym"}
          </button>
        )}
        {loc?.gymId !== undefined && defeatedGyms.includes(GYMS[loc.gymId]?.id) && (
          <div style={{...panelStyle,gridColumn:"1/-1",textAlign:"center",border:"1px solid #2a5a2a"}}>
            <span style={{color:"#44cc44",fontSize:13}}>✅ Cleared! {GYMS[loc.gymId]?.badge}</span>
          </div>
        )}

        {/* Wild encounter */}
        {loc?.wild && (
          <button onClick={()=>triggerWild(loc)} style={{...btnStyle,fontSize:11,padding:"8px"}}>
            🌿 Search for Pokemon
          </button>
        )}

        {/* Heal */}
        {loc?.heal && (
          <button onClick={()=>{healParty();}} style={{...btnStyle,background:"linear-gradient(135deg,#0a2a4a,#061a30)",borderColor:"#1a5a8a",color:"#88ccff",fontSize:11,padding:"8px"}}>
            🏥 Pokemon Center
          </button>
        )}

        {/* Shop */}
        {loc?.shop && (
          <button onClick={()=>setScreen("shop")} style={{...btnStyle,background:"linear-gradient(135deg,#2a1a4a,#1a0d30)",borderColor:"#5a3a8a",color:"#cc88ff",fontSize:11,padding:"8px"}}>
            🛒 Poke Mart
          </button>
        )}

        {/* Starter */}
        {loc?.starter && party.length===0 && (
          <button onClick={()=>setScreen("intro")} style={{...btnStyle,gridColumn:"1/-1",background:"linear-gradient(135deg,#4a3a0a,#3a2a00)",borderColor:"#8a7a1a",color:"#ffd700",fontSize:13,padding:"10px"}}>
            🎁 Choose Your Starter!
          </button>
        )}

        {/* Party / Pokedex */}
        <button onClick={()=>setScreen("party")} style={{...btnStyle,fontSize:11,padding:"8px"}}>👥 Party</button>
        <button onClick={()=>setScreen("pokedex")} style={{...btnStyle,fontSize:11,padding:"8px"}}>📖 Pokédex ({pokeDex.length})</button>
      </div>
    </div>
  );

  if(screen==="shop") return (
    <div style={{minHeight:"100vh",background:bg,fontFamily:"'Courier New',monospace",color:"#c8e8c8",padding:16,boxSizing:"border-box",maxWidth:480,margin:"0 auto"}}>
      <div style={{...panelStyle,marginBottom:12}}>
        <div style={{color:"#cc88ff",fontSize:16,fontWeight:"bold",marginBottom:4}}>🛒 POKÉ MART</div>
        <div style={{color:"#8ab89a",fontSize:12}}>💰 {money} PokeDollars</div>
      </div>
      <div style={{display:"grid",gap:8,marginBottom:12}}>
        {Object.entries(ITEMS_DB).map(([name,item])=>(
          <div key={name} style={{...panelStyle,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{color:"#e8dfc8",fontSize:13,fontWeight:"bold"}}>{name}</div>
              <div style={{color:"#6a9a7a",fontSize:11}}>{item.desc}</div>
              <div style={{color:"#8ab89a",fontSize:10}}>In bag: {bag[name]||0}</div>
            </div>
            <button onClick={()=>buyItem(name)} disabled={money<item.cost} style={{...btnStyle,fontSize:12,padding:"6px 12px",opacity:money<item.cost?0.5:1}}>
              💰{item.cost}
            </button>
          </div>
        ))}
      </div>
      {message && <div style={{background:"#0d2018",borderRadius:6,padding:"8px 12px",marginBottom:12,fontSize:12,color:"#a8d8a8"}}>{message}</div>}
      <button onClick={()=>setScreen("world")} style={{...btnStyle,width:"100%"}}>← Back</button>
    </div>
  );

  if(screen==="party") return (
    <div style={{minHeight:"100vh",background:bg,fontFamily:"'Courier New',monospace",color:"#c8e8c8",padding:16,boxSizing:"border-box",maxWidth:480,margin:"0 auto"}}>
      <div style={{color:"#ffd700",fontSize:16,fontWeight:"bold",marginBottom:12}}>👥 YOUR PARTY</div>
      {message && <div style={{background:"#0d2018",borderRadius:6,padding:"8px 12px",marginBottom:12,fontSize:12,color:"#a8d8a8"}}>{message}</div>}
      <div style={{display:"grid",gap:8,marginBottom:12}}>
        {party.map((p,i)=>(
          <div key={i} style={{...panelStyle,border:`1px solid ${p.hp>0?"#1a4a28":"#3a1a1a"}`}}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <div style={{fontSize:36}}>{p.sprite}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{color:"#e8dfc8",fontSize:14,fontWeight:"bold"}}>{p.name}</span>
                  <span style={{color:"#8ab89a",fontSize:12}}>Lv.{p.level}</span>
                </div>
                <div style={{display:"flex",gap:4,marginTop:2}}>{p.types.map(t=><TypeBadge key={t} type={t}/>)}</div>
                <HPBar current={p.hp} max={p.maxHP}/>
                <div style={{color:"#8ab89a",fontSize:11}}>{p.hp}/{p.maxHP} HP</div>
                <div style={{color:"#6a8a6a",fontSize:10}}>EXP: {p.exp}/{p.expToNext}</div>
              </div>
            </div>
            <div style={{marginTop:8,display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
              {p.moves.map((m,mi)=>{
                const md = MOVES_DB[m.name];
                return <div key={mi} style={{background:"#0d1a10",borderRadius:4,padding:"3px 6px",fontSize:10}}>
                  <span style={{color:TYPE_COLORS[md?.type]||"#888",fontWeight:"bold"}}>{m.name}</span>
                  <span style={{color:"#6a9a6a"}}> {m.pp}/{m.maxPP}</span>
                </div>;
              })}
            </div>
            {/* Use item */}
            <div style={{marginTop:8,display:"flex",gap:4,flexWrap:"wrap"}}>
              {Object.entries(bag).filter(([n,q])=>q>0&&ITEMS_DB[n]?.heal).map(([n,q])=>(
                <button key={n} onClick={()=>useItemOnPokemon(n,i)} disabled={p.hp<=0||p.hp===p.maxHP} style={{...btnStyle,fontSize:10,padding:"3px 8px",opacity:p.hp<=0||p.hp===p.maxHP?0.4:1}}>
                  {n}×{q}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={()=>setScreen("world")} style={{...btnStyle,width:"100%"}}>← Back</button>
    </div>
  );

  if(screen==="pokedex") return (
    <div style={{minHeight:"100vh",background:bg,fontFamily:"'Courier New',monospace",color:"#c8e8c8",padding:16,boxSizing:"border-box",maxWidth:480,margin:"0 auto"}}>
      <div style={{color:"#ffd700",fontSize:16,fontWeight:"bold",marginBottom:4}}>📖 POKÉDEX</div>
      <div style={{color:"#8ab89a",fontSize:12,marginBottom:12}}>Seen/Caught: {pokeDex.length}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
        {pokeDex.map(name=>{
          const data = POKEMON_DB[name];
          return (
            <div key={name} style={{...panelStyle,padding:10}}>
              <div style={{fontSize:24,textAlign:"center"}}>{data?.sprite||"❓"}</div>
              <div style={{color:"#e8dfc8",fontSize:12,textAlign:"center",fontWeight:"bold"}}>{name}</div>
              <div style={{display:"flex",gap:3,justifyContent:"center",marginTop:2,flexWrap:"wrap"}}>
                {(data?.types||[]).map(t=><TypeBadge key={t} type={t}/>)}
              </div>
              <div style={{color:"#6a8a6a",fontSize:9,textAlign:"center",marginTop:2}}>
                HP:{data?.hp} ATK:{data?.atk} DEF:{data?.def}
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={()=>setScreen("world")} style={{...btnStyle,width:"100%"}}>← Back</button>
    </div>
  );

  return <div style={{color:"#fff",padding:20}}>Loading...</div>;
}
