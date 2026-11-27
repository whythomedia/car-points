/*
 * Museum game engine.
 * Pure state machine: no DOM, no storage, no network. The page in
 * app/games/museum renders what view() returns and saves the state object.
 *
 *   const s = newState()
 *   view(s)            -> { heading, msg, text, options, input, carrying, done, turns }
 *   choose(s, index)   -> take option number `index` (0-based)
 *   submit(s, value)   -> answer a typed prompt (the clock hands)
 *
 * Rules that matter:
 *   - Looking is free. Anything that moves you or changes something is a turn.
 *   - Hunger nags at 24 turns since eating, again at 36, then every third turn from 48.
 *   - The guard never catches you. Spotted means: lose what you carry, wake in the cabin.
 *   - Each puzzle is a chapter. A treasure placed in the lobby case finishes one.
 *
 * Run the scripted playthroughs with: npm run test:museum
 */

var HUNGER_X = 24;
var LURE_TIME = { cuckoo: 6, bell: 3, phone: 8, lobby: 2 };   // turns he stays out
var WARN_AT = 2;                                              // turns of warning before he is back
var WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
var ROMAN = ['', 'I', 'II', 'III', 'IIII'];
var ORDINAL = ['', 'first', 'second', 'third', 'fourth'];

// Three stopped clocks, each on an hour from 1 to 4. The tall clock rests at
// twelve, so a set that adds up to twelve is rolled again.
function rollTimes(rng) {
  var r = rng || Math.random, t;
  do {
    t = [1 + Math.floor(r() * 4), 1 + Math.floor(r() * 4), 1 + Math.floor(r() * 4)];
  } while (t[0] + t[1] + t[2] === 12);
  return t;
}
function answer(s) { return s.times[0] + s.times[1] + s.times[2]; }

var ITEM_NAMES = {
  bell: 'a brass handbell',
  flashlight: 'a flashlight',
  coins: 'a fistful of coins',
  batteries: 'a pack of batteries',
  postcard: 'a postcard of the Hall of Clocks',
  postcard2: 'a postcard of the Painting Gallery',
  flashlight2: 'a flashlight with fresh batteries',
  key: 'a brass key',
  star: 'a gold star'
};

// ---------- Chapter 2: the painting gallery ----------
// Five paintings, five hooks. The answer is the order of the eras.
var PAINTINGS = {
  enormous: {
    name: 'the enormous painting',
    text: [
      'Taller than the doorway. A mother in a red dress sits on a throne with a child standing on her knee. A man in black armor kneels at her feet. Saints crowd in on both sides. One holds a long sword, another a broken lance.',
      'Over all of them arches a bower of branches, thick with orange and yellow fruit. Birds perch in it. A branch of red coral hangs from the top on a string of beads.'
    ]
  },
  dark: {
    name: 'the long dark painting',
    text: [
      'A long painting. Black behind, a bare brown table in front, and three things set out in a row.',
      'On the left, four fat yellow lemons on a silver plate. In the middle, a basket of oranges with the leaves and white blossoms still on. On the right, a white cup on a plate, with a pink rose beside it. Nothing else. No people, no room.'
    ]
  },
  fish: {
    name: 'the painting with the fish',
    text: [
      'A kitchen table with a white cloth thrown over it. A heap of oysters on the left. A red fish with one round eye looking straight at you. A big pale fish with its tail in the air. A thin dark eel curled at the front. A copper pot behind them all.',
      'At the right, off by itself: one lemon and a knife.'
    ]
  },
  tiny: {
    name: 'the tiny painting',
    text: [
      'About the size of a sheet of notebook paper. A bright yellow lemon sits at the front of a table. Beside it, a big white bowl with small red flowers painted on the side. A white cloth lies crumpled at the right edge.',
      'Behind the lemon, a glass bottle with a stopper, half lost in the shadows. The shadows are blue. You can see every brushstroke.'
    ]
  },
  brown: {
    name: 'the brown painting',
    text: [
      'Brown, tan, and gray, edge to edge. It looks like a stack of broken tiles, or a pile of cards someone dropped. There is no table. There is no glass. There is no lemon.',
      'Then, a little below the middle, you find a small circle with spokes in it, like a wheel. A lemon, sliced across.'
    ]
  }
};
var GALLERY_ANSWER = ['enormous', 'dark', 'fish', 'tiny', 'brown'];   // hooks I to V
var GALLERY_MENU = ['fish', 'brown', 'enormous', 'tiny', 'dark'];     // menu order, so the menu is not the answer
var HOOKS = ['I', 'II', 'III', 'IV', 'V'];
var TREASURE_NAMES = { bell: 'the bell', star: 'the gold star' };
var CHAPTER_OF = { bell: 1, star: 2 };

function newState(opts) {
  opts = opts || {};
  return {
    v: 3,
    id: opts.id || ('g' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36)),
    started: new Date().toISOString(),
    log: [],                     // one entry per tap, for review
    times: opts.times ? opts.times.slice() : rollTimes(opts.rng),   // cuckoo, ship, station
    node: 'cabin',
    room: 'cabin',
    opening: true,
    escaped: false,
    inv: [],
    stash: [],
    lost: [],
    clockSolved: false,
    bellTaken: false,
    flashlightTaken: false,
    treasures: 0,
    placed: [],                  // treasures in the lobby case, in order
    hooks: [null, null, null, null, null],
    gallerySolved: false,
    starTaken: false,
    screenCheck: false,
    painting: null,
    switches: { displays: false, lift: false, third: false },   // all off at the start
    mechOpen: false,
    keyTaken: false,
    clockTried: false,           // a postcard hint is only sold after a failed try
    galleryTried: false,
    done: false,
    turns: 0,
    lastAte: 0,
    ate: false,
    guard: { state: 'in', loc: null, lure: null, left: 0, eta: 0, dest: null },
    pendingAlert: null,
    pendingOut: null,
    hidden: false,
    ducked: false,
    locked: null,
    msg: []
  };
}

// ---------- helpers ----------

function has(s, item) { return s.inv.indexOf(item) !== -1; }
function give(s, item) { if (!has(s, item)) s.inv.push(item); }
function take(s, item) { var i = s.inv.indexOf(item); if (i !== -1) s.inv.splice(i, 1); }
function say(s) { for (var i = 1; i < arguments.length; i++) s.msg.push(arguments[i]); }
function list(items) {
  var names = items.map(function (i) { return ITEM_NAMES[i]; });
  if (names.length === 0) return 'nothing';
  if (names.length === 1) return names[0];
  return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
}
function cap(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

// option builders
function look(label, node) {            // free: look at something in the same room
  return { label: label, free: true, fn: function (s) { s.node = node; } };
}
function move(label, room, node) {      // a turn: walk to another room
  return { label: label, fn: function (s) { s.room = room; s.node = node || room; s.hidden = false; s.ducked = false; } };
}
function act(label, fn) { return { label: label, fn: fn }; }      // a turn, unless fn returns false
function freeDo(label, fn) { return { label: label, free: true, fn: fn }; }
function locked(label, name, text) {
  return freeDo(label, function (s) { s.locked = { name: name, text: text || 'Locked.', back: s.node }; s.node = 'locked'; });
}

// ---------- the guard ----------

function spotted(s, walkedIn) {
  s.inv.forEach(function (i) { if (s.lost.indexOf(i) === -1) s.lost.push(i); });
  s.inv = [];
  s.msg = [
    walkedIn ? 'You come through the doorway and he is right there, flashlight in hand.' : 'A flashlight beam swings around and stops on you.',
    '“Hey! You there!”',
    'You run. Boots behind you, then stairs, then nothing.'
  ];
  s.node = 'cabin';
  s.room = 'cabin';
  s.hidden = false;
  s.ducked = false;
  s.escaped = true;
  s.guard = { state: 'in', loc: null, lure: null, left: 0, eta: 0, dest: null };
  s.pendingAlert = null;
  s.pendingOut = null;
}

function guardArrives(s) {
  var g = s.guard;
  if (g.dest === 'lobby') {
    if (s.room === 'lobby') {
      if (!s.ducked) return spotted(s);
      say(s, 'The office door opens. Boots stop beside the counter. A flashlight beam sweeps the lobby, slowly.');
    }
  } else { // heading for the Hall of Clocks, through the lobby
    if (s.room === 'lobby') {
      if (!s.ducked) return spotted(s);
      say(s, 'The office door opens. Boots pass an arm’s length from you and fade away to the north.');
    } else if (s.room === 'clocks') {
      if (!s.hidden) return spotted(s);
      say(s, 'The guard comes in behind his flashlight. He goes straight to the cuckoo clock and pushes the bird back in. It pops back out. He sighs.');
    }
  }
  g.state = 'out';
  g.loc = g.dest;
  g.left = LURE_TIME[g.lure];
  breakersOff(s);
}

// Any time the guard leaves his office, every switch in Mechanical goes back to off.
function breakersOff(s) {
  if (s.switches) s.switches = { displays: false, lift: false, third: false };
}

function guardReturns(s) {
  var g = s.guard;
  var path = g.lure === 'phone' ? ['landing', 'lobby', 'office'] : ['lobby', 'office'];
  var safeInLobby = s.room === 'lobby' && s.ducked;
  if (path.indexOf(s.room) !== -1 && !safeInLobby) return spotted(s);
  if (safeInLobby) {
    say(s, 'Boots cross the lobby and pass the counter. The office door shuts. The radio comes back on.');
  } else if (s.room === 'clocks' && s.hidden && g.loc === 'clocks') {
    say(s, 'The guard gives the bird one last shove and walks out to the south.');
  }
  s.guard = { state: 'in', loc: null, lure: null, left: 0, eta: 0, dest: null };
}

function guardWarning(s) {
  var g = s.guard;
  if (g.lure === 'phone') say(s, 'Far overhead, the ringing stops.');
  else if (g.lure === 'cuckoo') {
    if (s.room === 'clocks' && s.hidden) say(s, 'The guard snaps his pocketknife shut.');
    else if (s.room === 'lobby' || s.room === 'office') say(s, 'Far off, the cuckoo stops. Footsteps start back toward the lobby.');
    else say(s, 'Far off, the cuckoo stops.');
  } else if (g.lure === 'bell') {
    if (!(s.room === 'clocks' && s.hidden)) say(s, 'To the north, footsteps start back toward the lobby.');
  }
}

// what you notice while you wait in a hiding place, so waiting never reads as nothing
function waitText(s, where) {
  var g = s.guard;
  if (g.state === 'alerted') return where === 'lobby' ? 'The radio has stopped. Right beside you, a door handle turns.' : 'Footsteps on stone, getting closer.';
  if (g.state === 'out' && g.loc === where) {
    if (where === 'lobby') return 'The flashlight beam crosses the floor again. His boots are right there.';
    return g.left % 2 ? 'He works a pocketknife in behind the bird. It pops back out.' : 'He pushes the bird in and holds it there. He lets go. Cuckoo.';
  }
  if (g.state === 'out') return where === 'lobby' ? guardStatus(s) : 'Nothing moves.';
  return where === 'lobby' ? 'Nothing moves. Behind the office door, the radio plays on.' : 'Nothing moves. Every clock in the room still says five.';
}

// A standing line about the guard, so his status is on the screen for as long
// as it is true and not only in the one message when it changes.
function guardStatus(s) {
  var g = s.guard;
  if (g.state === 'alerted') return 'The radio has gone quiet.';
  if (g.state !== 'out') return '';
  var coming = g.left <= WARN_AT;
  if (g.lure === 'phone') return coming ? 'The phone overhead has stopped ringing. Footsteps are coming down the stairs.' : 'Far overhead, a phone is still ringing.';
  if (g.lure === 'cuckoo') return coming ? 'The cuckoo has stopped. Footsteps are coming from the north.' : 'From the north, the cuckoo goes off again.';
  if (g.lure === 'bell') return coming ? 'Footsteps are coming from the north.' : 'To the north, a flashlight beam moves across the clocks.';
  return '';
}

function hunger(s) {
  var since = s.turns - s.lastAte;
  if (since === HUNGER_X || since === HUNGER_X * 1.5 ||
      (since >= HUNGER_X * 2 && (since - HUNGER_X * 2) % 3 === 0)) {
    say(s, 'You notice your stomach grumbling, time to eat.');
  }
}

// One count for everything: the guard, like hunger, only moves on turns.
// Looking is free and never brings him back.
function guardOut(s) {
  var g = s.guard;
  if (g.state !== 'out') return;
  if (s.room === g.loc && !s.hidden && !s.ducked) return spotted(s, true);
  g.left--;
  if (g.left === WARN_AT) guardWarning(s);
  if (g.left <= 0) guardReturns(s);
}

function tick(s) {
  s.turns++;
  if (s.ate) { s.lastAte = s.turns; s.ate = false; }
  var g = s.guard;
  if (g.state === 'alerted') {
    g.eta--;
    if (g.eta === 1) {
      if (s.room === 'lobby') say(s, s.ducked ? 'Right beside you, a door handle turns.' : 'Behind the front counter, the office door is opening.');
    } else if (g.eta <= 0) {
      guardArrives(s);
    }
  } else {
    guardOut(s);
  }
  g = s.guard;
  if (s.pendingAlert && g.state === 'in') {
    g.state = 'alerted'; g.eta = 2; g.dest = s.pendingAlert.dest; g.lure = s.pendingAlert.lure;
  }
  if (s.pendingOut && g.state === 'in') {
    g.state = 'out'; g.loc = s.pendingOut.loc; g.lure = s.pendingOut.lure; g.left = LURE_TIME[s.pendingOut.lure];
    breakersOff(s);
  }
  s.pendingAlert = null;
  s.pendingOut = null;
  hunger(s);
}

function hasLight(s) { return has(s, 'flashlight') || has(s, 'flashlight2'); }
function loadFlashlight(s) {
  if (!(has(s, 'flashlight') && has(s, 'batteries'))) return;
  take(s, 'flashlight');
  take(s, 'batteries');
  give(s, 'flashlight2');
  say(s, 'You thumb the batteries into the flashlight and screw the cap back on.');
}

// ---------- buying ----------

function buy(s, what) {
  if (!has(s, 'coins')) {
    say(s, 'You start to grab ' + what + ' without paying, but your conscience gets the better of you.');
    return false;
  }
  take(s, 'coins');
  return true;
}

// ---------- scenes ----------

var POSTCARD2_TEXT = 'The photograph shows a long wall with five paintings in a row. From the left: an enormous one, a long dark one, one with a fish, a tiny one, a brown one.';
function postcardText(s) { return 'The photograph shows a tall case clock at the end of a hall. Its hands say ' + WORDS[answer(s)] + '.'; }

var scenes = {

  cabin: function (s) {
    var text;
    if (s.opening) {
      text = [
        'The last voices went down the stairs an hour ago. Nobody counted you.',
        'You are under a quilt in a log cabin on the upper floor of the museum. Out in the galleries, the lights click off one room at a time.',
        'Somewhere below, a bell rings five times. Then the building is quiet.'
      ];
    } else if (s.escaped) {
      text = ['You are under the quilt in the pioneer cabin. Your pockets are empty. Far below, a door shuts.'];
    } else {
      text = ['A log cabin built inside the gallery, with a rope across the doorway. Inside: a table, a cold iron stove, and a rope bed with a quilt.'];
    }
    return { heading: 'Pioneer Cabin', text: text, options: [
      look('Bed', 'cabin_bed'),
      move('Leave (Landing)', 'landing')
    ] };
  },

  cabin_bed: function (s) {
    var text = ['The quilt hangs to the floor. There is room underneath.'];
    if (s.stash.length) text.push('Stashed under the bed: ' + list(s.stash) + '.');
    var o = [];
    if (s.inv.length) o.push(act('Stash what you’re carrying', function (s) {
      s.inv.forEach(function (i) { if (s.stash.indexOf(i) === -1) s.stash.push(i); });
      s.inv = [];
      say(s, 'You push it all under the bed.');
    }));
    if (s.stash.length) o.push(act('Take what’s stashed', function (s) {
      s.stash.forEach(function (i) { give(s, i); });
      s.stash = [];
      say(s, 'You pull it all back out.');
    }));
    o.push(look('Back', 'cabin'));
    return { heading: 'Pioneer Cabin', text: text, options: o };
  },

  landing: function (s) {
    var door = s.guard.state === 'in' ? 'The door is shut.' : 'The door stands open.';
    var open = s.treasures >= 1;
    return { heading: 'Upstairs Landing', text: [
      'The top of the stairs. A railing looks down on the lobby. From here you can see the display case and the guard’s door. ' + door,
      'A tall door stands at the back of the landing.' + (open ? ' The door to the east stands ajar.' : '')
    ], options: [
      look('Tall door', 'landing_door'),
      open ? move('Painting Gallery (East)', 'gallery') : locked('Painting Gallery (East)', 'Painting Gallery'),
      move('Pioneer Cabin (West)', 'cabin'),
      locked('Egypt (North)', 'Egypt'),
      move('Stairs (Down)', 'lobby')
    ] };
  },

  landing_door: function (s) {
    var bolts = ['All five are shut.', 'One is drawn back. Four are shut.', 'Two are drawn back. Three are shut.',
                 'Three are drawn back. Two are shut.', 'Four are drawn back. One is shut.', 'All five are drawn back.'][s.treasures];
    return { heading: 'Upstairs Landing', text: [
      'A brass plate reads PRIVATE. Five bolts run down the edge. ' + bolts
    ], options: [look('Back', 'landing')] };
  },

  locked: function (s) {
    var l = s.locked || { name: 'Door', text: 'Locked.', back: s.room };
    return { heading: l.name, text: [l.text], options: [look('Back', l.back)] };
  },

  lobby: function (s) {
    var g = s.guard;
    var desk = g.state === 'in'
      ? 'Behind the front counter is the door to the guard’s office. Light shows under it, and a radio is playing low.'
      : g.state === 'alerted'
        ? 'Behind the front counter is the door to the guard’s office. Light shows under it. The radio has gone quiet.'
        : 'Behind the front counter, the door to the guard’s office stands open. ' + guardStatus(s);
    var o = [
      look('Display case', 'case'),
      look('Fountain', 'fountain'),
      look('Front counter', 'desk'),
      look('Office door', 'office_door'),
      move('Hall of Clocks (North)', 'clocks'),
      look('Stairs', 'lobby_stairs')
    ];
    return { heading: 'Lobby', text: [
      'A high room with a stone floor. Moonlight comes through the glass over the front doors, which are chained.',
      'A display case stands in the middle of the floor. A fountain sits against the wall, switched off for the night.',
      desk
    ], options: o };
  },

  desk_ducked: function (s) {
    var g = s.guard;
    var status = g.state === 'in' ? 'The office door is shut. Behind it, the radio is playing.'
      : g.state === 'out' && g.loc === 'lobby' ? 'His boots are a few feet away.'
      : g.state === 'out' ? 'The office door stands open. ' + guardStatus(s)
      : guardStatus(s);
    return { heading: 'Lobby', text: [
      'You are folded up under the front counter, knees to your chin. The door to the guard’s office is an arm’s length away.',
      status
    ], options: [
      act('Stay down', function (s) { say(s, waitText(s, 'lobby')); }),
      freeDo('Come out', function (s) { s.ducked = false; s.node = 'desk'; })
    ] };
  },

  lobby_stairs: function () {
    return { heading: 'Lobby', text: ['Stone stairs go up to the galleries and down to the lower level.'], options: [
      move('Up', 'landing'),
      move('Down', 'lowerhall'),
      look('Back', 'lobby')
    ] };
  },

  case: function (s) {
    var n = s.placed.length;
    var names = s.placed.map(function (i) { return TREASURE_NAMES[i]; });
    var count = n === 0 ? 'All five are empty.'
      : n === 1 ? cap(names[0]) + ' sits on one stand. Four are empty.'
      : cap(names.slice(0, -1).join(', ')) + ' and ' + names[n - 1] + ' sit on ' + WORDS[n] + ' stands. ' + cap(WORDS[5 - n]) + (5 - n === 1 ? ' is empty.' : ' are empty.');
    var o = [];
    ['bell', 'star'].forEach(function (item) {
      if (!has(s, item)) return;
      o.push(act('Place ' + TREASURE_NAMES[item], function (s) {
        take(s, item);
        s.placed.push(item);
        s.treasures = s.placed.length;
        s.done = true;
        say(s, 'You set ' + TREASURE_NAMES[item] + ' down on a stand. Somewhere above you, a bolt slides back.');
        if (item === 'bell') say(s, 'A moment later, a second sound from upstairs: a latch letting go.');
        say(s, 'Congratulations on completing Chapter ' + CHAPTER_OF[item] + '!');
      }));
    });
    o.push(look('Back', 'lobby'));
    return { heading: 'Lobby', text: ['Glass on four sides, open at the top. Five stands inside. ' + count], options: o };
  },

  fountain: function (s) {
    var o = [act('Take coins', function (s) {
      if (has(s, 'coins')) { say(s, 'Your pockets are already full.'); return false; }
      give(s, 'coins');
      say(s, 'You roll up a sleeve. The water is cold. You come up with a fistful, mostly pennies.');
    })];
    if (has(s, 'bell')) o.push(act('Ring the bell', function (s) {
      say(s, 'You swing the bell. The sound fills the lobby and keeps going.');
      if (s.guard.state === 'in') {
        say(s, 'Behind the office door, the radio clicks off. A chair scrapes.');
        s.pendingAlert = { dest: 'lobby', lure: 'lobby' };
      }
    }));
    if (hasLight(s)) o.push(freeDo('Shine the flashlight in', function (s) {
      say(s, 'Coins, all the way down. Mostly pennies.');
    }));
    o.push(look('Back', 'lobby'));
    return { heading: 'Lobby', text: ['The water is still. The bottom is covered in coins.'], options: o };
  },

  directory: function () {
    return { heading: 'Lobby', text: [
      'LOWER LEVEL: Gift Shop. Storage. Mechanical.',
      'GROUND: Lobby. Hall of Clocks.',
      'UPPER: Painting Gallery. Egypt. Pioneer Life. Private.',
      'Above the top line is a strip of paler wood where a fourth line used to be. Four screw holes, no sign.'
    ], options: [look('Back', 'desk')] };
  },

  desk: function (s) {
    var text = ['A long wooden counter with a stool behind it and one drawer. A directory of the galleries is fixed to the top under glass. There is room underneath.'];
    if (s.guard.state === 'out' && s.guard.left <= WARN_AT) text.push(guardStatus(s));
    return { heading: 'Lobby', text: text, options: [
      look('Read the directory', 'directory'),
      look('Open the drawer', 'drawer'),
      act('Duck under the counter', function (s) { s.ducked = true; s.node = 'desk_ducked'; }),
      look('Back', 'lobby')
    ] };
  },

  office_door: function (s) {
    var g = s.guard;
    var open = g.state === 'out' && g.loc !== 'lobby';
    if (!open) {
      return { heading: 'Lobby', text: [
        g.state === 'in'
          ? 'Shut. Light shows underneath, and a radio is playing a ball game on the other side.'
          : 'Shut. Light shows underneath. The radio has gone quiet.'
      ], options: [look('Back', 'lobby')] };
    }
    return { heading: 'Lobby', text: ['It stands open. Inside, the radio is playing a ball game to nobody.', guardStatus(s)], options: [
      move('Go in', 'office'),
      look('Back', 'lobby')
    ] };
  },

  drawer: function (s) {
    if (s.flashlightTaken) return { heading: 'Lobby', text: ['Empty.'], options: [look('Back', 'desk')] };
    return { heading: 'Lobby', text: ['A flashlight.'], options: [
      act('Take the flashlight', function (s) {
        s.flashlightTaken = true;
        give(s, 'flashlight');
        s.node = 'desk';
        say(s, 'It is heavy, with a rubber grip.');
      }),
      look('Back', 'desk')
    ] };
  },

  office: function (s) {
    var text = ['A desk, a swivel chair, a thermos. The radio is playing a ball game to nobody. A wire bin sits on the floor under a cardboard sign: LOST AND FOUND.'];
    if (s.guard.state === 'out' && s.guard.left <= WARN_AT) text.push(guardStatus(s));
    return { heading: 'Guard’s Office', text: text, options: [
      look('Lost and found', 'office_bin'),
      look('Desk', 'office_desk'),
      move('Leave (Lobby)', 'lobby')
    ] };
  },

  office_bin: function (s) {
    var text = ['Umbrellas. One mitten. A child’s shoe.'];
    text.push(s.lost.length ? cap(list(s.lost)) + ', too. Yours.' : 'Nothing of yours.');
    var o = [];
    if (s.lost.length) o.push(act('Take your things', function (s) {
      s.lost.forEach(function (i) { give(s, i); });
      s.lost = [];
      say(s, 'You dig your things out of the bin.');
    }));
    o.push(look('Back', 'office'));
    return { heading: 'Guard’s Office', text: text, options: o };
  },

  office_desk: function (s) {
    var text = [
      'His desk. A logbook lies open on it. Tonight’s page:',
      '“10:05. Breakers on downstairs again. Shut them all off. 11:40. Clock struck 13. She’s up. 12:15. Lights on in Egypt again. Not going up there.”'
    ];
    var o = [];
    if (!s.keyTaken) {
      text.push('Beside the logbook lies a brass key on a paper tag. The tag says MECH.');
      o.push(act('Take the key', function (s) {
        s.keyTaken = true;
        give(s, 'key');
        say(s, 'You slide the key off the desk.');
      }));
    }
    o.push(look('Back', 'office'));
    return { heading: 'Guard’s Office', text: text, options: o };
  },

  clocks: function (s) {
    var tall = s.clockSolved
      ? 'The tall case clock at the far end says ' + WORDS[answer(s)] + ', and its case door hangs open.'
      : 'A tall case clock stands at the far end, taller than the door.';
    return { heading: 'Hall of Clocks', text: [
      'Clocks cover all four walls. None of them is ticking.',
      'Every face says five o’clock. Three do not: a cuckoo clock, a brass ship’s clock, and a railway station clock.',
      tall
    ], options: (function () {
      var o = [
        look('Cuckoo clock', 'cuckoo'),
        look('Ship’s clock', 'ship'),
        look('Station clock', 'station'),
        look('Tall clock', 'tall')
      ];
      if (s.guard.state !== 'in') o.push(act('Hide behind the station clock', function (s) { s.hidden = true; s.node = 'clocks_hidden'; }));
      o.push(move('Leave (South)', 'lobby'));
      return o;
    })() };
  },

  clocks_hidden: function (s) {
    var here = s.guard.state === 'out' && s.guard.loc === 'clocks';
    var text = ['You are crouched behind the station clock. Its face is the size of a table, and there is room behind it to spare.'];
    if (has(s, 'bell')) text.push('You hold the clapper still with two fingers.');
    if (here) text.push('Past the edge of the clock face: the guard is at the cuckoo clock with a pocketknife. The bird keeps popping back out.');
    var o = [act('Stay put', function (s) { say(s, waitText(s, 'clocks')); })];
    if (here) o.push(move('Slip out while his back is turned', 'lobby'));
    else o.push(freeDo('Come out', function (s) { s.hidden = false; s.node = 'clocks'; }));
    return { heading: 'Hall of Clocks', text: text, options: o };
  },

  cuckoo: function (s) {
    return { heading: 'Hall of Clocks', text: [
      'The little door is open and the bird is stuck halfway out. The hands say ' + WORDS[s.times[0]] + ' o’clock.'
    ], options: [
      act('Push the bird back in', function (s) {
        say(s, 'You push the bird in. The little door clicks shut.',
               'A second later it bursts back out. Cuckoo. It is much louder than a clock that size should be. The hands have not moved.');
        if (s.guard.state === 'in') {
          say(s, 'Somewhere to the south, a chair scrapes.');
          s.pendingAlert = { dest: 'clocks', lure: 'cuckoo' };
        }
      }),
      look('Back', 'clocks')
    ] };
  },

  ship: function (s) {
    return { heading: 'Hall of Clocks', text: [
      'Brass, bolted to a plank. Roman numerals, with four written IIII.',
      'The short hand points at ' + ROMAN[s.times[1]] + '. The long hand points straight up.'
    ], options: [look('Back', 'clocks')] };
  },

  station: function (s) {
    return { heading: 'Hall of Clocks', text: [
      'A white face the size of a table. No numbers, only black marks.',
      'The short hand points at the ' + ORDINAL[s.times[2]] + ' mark past the top. The long hand points straight up.'
    ], options: [look('Back', 'clocks')] };
  },

  tall: function (s) {
    if (!s.clockSolved) {
      return { heading: 'Hall of Clocks', text: [
        'The hands are at twelve. They move when you push them.',
        'Behind the glass, where a pendulum should hang, something brass catches the light.',
        'A card is wedged in the door. Red ink: “Arithmetic. Three of my clocks waited for you. Add them up and tell the tall one.”'
      ], options: [
        look('Set the hands', 'tall_set'),
        look('Try the case door', 'tall_door'),
        look('Back', 'clocks')
      ] };
    }
    if (!s.bellTaken) {
      return { heading: 'Hall of Clocks', text: [
        'The hands say ' + WORDS[answer(s)] + '. The case door hangs open.',
        'A brass handbell hangs inside on a hook. A tag is tied to the grip. Red ink: “Satisfactory. It belongs in the lobby.”'
      ], options: [
        act('Take the bell', function (s) {
          s.bellTaken = true;
          give(s, 'bell');
          say(s, 'You lift the bell off its hook. It is heavier than it looks. The clapper knocks once against the brass before you get a hand on it.');
        }),
        look('Back', 'clocks')
      ] };
    }
    var o = [look('Look at the hammer', 'hammer')];
    if (has(s, 'bell')) o.push(act('Ring the bell', function (s) {
      say(s, 'You swing the bell. It is a school bell, and it is built to reach the far end of a playground.');
      if (s.guard.state === 'in') {
        say(s, 'Somewhere to the south, a chair scrapes.');
        s.pendingAlert = { dest: 'clocks', lure: 'bell' };
      }
    }));
    o.push(look('Back', 'clocks'));
    return { heading: 'Hall of Clocks', text: [
      'The hands say ' + WORDS[answer(s)] + '. The case door hangs open.',
      'On the back wall of the case, where the bell hung, a small felt hammer sits on a spring.'
    ], options: o };
  },

  tall_door: function () {
    return { heading: 'Hall of Clocks', text: [
      'The case door does not budge. There is no keyhole and no handle, only a seam in the wood.',
      'Through the glass you can make out a shape hanging on a hook. Brass, with a dark wooden grip.'
    ], options: [look('Back', 'tall')] };
  },

  tall_set: function () {
    return { heading: 'Hall of Clocks', text: [
      'You put a finger on the hour hand. It turns with a soft ratcheting sound.',
      'What time do you set?'
    ], input: { label: 'Hour, 1 through 12', min: 1, max: 12 }, options: [look('Back', 'tall')] };
  },

  hammer: function () {
    return { heading: 'Hall of Clocks', text: [
      'A felt hammer the size of a thumb, mounted on a spring. A thin rod runs from it up into the clockwork.',
      'The rod ends at a brass wheel with a single notch cut into the rim. Beside the notch, someone has scratched a small numeral: V.',
      'The felt is worn flat on one side, exactly where the bell hung.'
    ], options: [look('Back', 'tall')] };
  },

  gallery: function (s) {
    var leaning = GALLERY_MENU.filter(function (p) { return s.hooks.indexOf(p) === -1; });
    var n = leaning.length;
    var text = [
      'A long room. ' + (n === 5 ? 'Five paintings lean against one wall.' : n === 0 ? 'Every painting is up on the wall.' : cap(WORDS[n]) + (n === 1 ? ' painting leans' : ' paintings lean') + ' against the wall.') + ' Above, five hooks in a row, numbered I to V.',
      'A touchscreen stands on a post by the door. ' + (s.switches.displays ? 'It is glowing.' : 'It is dark.'),
      'Hooks: ' + s.hooks.map(function (p, i) { return HOOKS[i] + ' ' + (p ? PAINTINGS[p].name : 'empty'); }).join('. ') + '.'
    ];
    if (s.gallerySolved) text.push('On the wall behind you, a panel hangs open.');
    // Only what is still leaning is listed here. What is hung is on The wall.
    var o = [look('Touchscreen', 'screen')];
    leaning.forEach(function (p) {
      o.push(freeDo(cap(PAINTINGS[p].name), function (s) { s.painting = p; s.node = 'painting'; }));
    });
    if (n < 5) o.push(look('The wall', 'wall'));
    if (s.gallerySolved) o.push(look('Wall panel', 'panel'));
    o.push(move('Leave (Landing)', 'landing'));
    return { heading: 'Painting Gallery', text: text, options: o };
  },

  wall: function (s) {
    var o = [];
    s.hooks.forEach(function (p, i) {
      if (!p) return;
      o.push(freeDo('Hook ' + HOOKS[i] + ': ' + PAINTINGS[p].name, function (s) { s.painting = p; s.node = 'painting'; }));
    });
    o.push(look('Back', 'gallery'));
    return { heading: 'Painting Gallery', text: [
      'Five hooks in a row, numbered I to V.',
      'Hooks: ' + s.hooks.map(function (p, i) { return HOOKS[i] + ' ' + (p ? PAINTINGS[p].name : 'empty'); }).join('. ') + '.'
    ], options: o };
  },

  screen: function (s) {
    if (!s.switches.displays) {
      return { heading: 'Painting Gallery', text: [
        'The screen is black. You tap it. Nothing.',
        'A cable runs down the post and into the floor. A label on the post reads DISPLAYS.'
      ], options: [look('Back', 'gallery')] };
    }
    var text = [];
    if (s.screenCheck) text.push('Check your work.', 'You tap the screen. The five lines come back.');
    text.push(
      'FIVE LEMONS. PUT THEM IN ORDER.',
      'I. Renaissance. The lemons grow over the saints’ heads.',
      'II. Baroque. Lemons, oranges, and a rose on a dark table.',
      'III. Realism. The lemon sits beside the fish.',
      'IV. Impressionism. One lemon beside a white bowl.',
      'V. Modernism. Everything is in pieces. The lemon is a small wheel.'
    );
    return { heading: 'Painting Gallery', text: text, options: [
      freeDo('Back', function (s) { s.screenCheck = false; s.node = 'gallery'; })
    ] };
  },

  painting: function (s) {
    var p = s.painting || GALLERY_MENU[0];
    var at = s.hooks.indexOf(p);
    var hung = at !== -1;
    var text = [];
    if (hung) text.push('It hangs on hook ' + HOOKS[at] + '.');
    text = text.concat(PAINTINGS[p].text);
    var o = [];
    if (!hung) o.push(look('Hang it', 'hang'));
    else if (!s.gallerySolved) o.push(act('Take it down', function (s) {
      s.hooks[at] = null;
      s.screenCheck = false;
      s.node = s.hooks.some(function (x) { return x; }) ? 'wall' : 'gallery';
      say(s, 'You take ' + PAINTINGS[p].name + ' down and lean it against the wall.');
    }));
    o.push(look('Back', hung ? 'wall' : 'gallery'));
    return { heading: 'Painting Gallery', text: text, options: o };
  },

  hang: function (s) {
    var p = s.painting || GALLERY_MENU[0];
    var o = [];
    HOOKS.forEach(function (h, i) {
      if (s.hooks[i]) return;                 // only empty hooks are offered
      o.push(act('Hook ' + h, function (s) {
        s.hooks[i] = p;
        s.node = 'gallery';
        say(s, 'You hang ' + PAINTINGS[p].name + ' on hook ' + h + '.');
        if (s.hooks.indexOf(null) === -1) {
          var right = s.hooks.every(function (x, k) { return x === GALLERY_ANSWER[k]; });
          if (right) {
            s.gallerySolved = true;
            s.screenCheck = false;
            say(s, 'Every hook is full.', 'A click behind you. On the opposite wall, a panel swings out.');
          } else {
            s.galleryTried = true;
            if (s.switches.displays) {
              s.screenCheck = true;
              say(s, 'Every hook is full.', 'By the door, the touchscreen chimes. The five lines are gone. In their place: Check your work.');
            } else {
              say(s, 'Every hook is full.', 'Nothing happens.');
            }
          }
        }
      }));
    });
    o.push(look('Never mind', 'painting'));
    return { heading: 'Painting Gallery', text: ['You get your hands under the frame.', 'Which hook?'], options: o };
  },

  panel: function (s) {
    if (s.starTaken) return { heading: 'Painting Gallery', text: ['A square of felt with a star-shaped dent in it.'], options: [look('Back', 'gallery')] };
    return { heading: 'Painting Gallery', text: [
      'Inside, on a square of felt, sits a gold star the size of your palm. It is the kind a teacher sticks on a paper, cast in metal.',
      'A tag is tied to one point. Red ink: “Satisfactory. It belongs in the lobby.”'
    ], options: [
      act('Take the star', function (s) {
        s.starTaken = true;
        give(s, 'star');
        say(s, 'You lift the star out. It is cold, and the points are sharp.');
      }),
      look('Back', 'gallery')
    ] };
  },

  lowerhall: function (s) {
    var mech = s.mechOpen ? move('Mechanical (North)', 'mech')
      : has(s, 'key') ? act('Mechanical (North)', function (s) {
          take(s, 'key');
          s.mechOpen = true;
          s.room = 'mech';
          s.node = 'mech';
          say(s, 'The brass key turns. You leave it in the lock.');
        })
      : locked('Mechanical (North)', 'Mechanical', 'A steel door with MECHANICAL stenciled on it. A notice is taped below: KEY WITH SECURITY. Locked.');
    return { heading: 'Lower Hall', text: [
      'The bottom of the stairs. A low corridor with pipes along the ceiling. Light spills from a doorway on one side.'
    ], options: [
      move('Gift Shop (East)', 'shop'),
      locked('Storage (West)', 'Storage', 'A steel door with a row of letter wheels where a keyhole should be. Locked.'),
      mech,
      move('Stairs (Up)', 'lobby')
    ] };
  },

  mech: function () {
    return { heading: 'Mechanical', text: [
      'A low room full of pipes. A boiler ticks as it cools. A gray steel panel is bolted to the far wall.'
    ], options: [
      look('Breaker panel', 'breakers'),
      move('Leave (Lower Hall)', 'lowerhall')
    ] };
  },

  breakers: function (s) {
    var sw = s.switches;
    function word(on) { return on ? 'on' : 'off'; }
    function flip(key, label, onText) {
      return act('Turn ' + label + ' ' + (sw[key] ? 'off' : 'on'), function (s) {
        var w = s.switches;
        if (w[key]) { w[key] = false; say(s, 'The switch drops with a clunk.'); return; }
        var already = (w.displays ? 1 : 0) + (w.lift ? 1 : 0) + (w.third ? 1 : 0);
        if (already >= 2) {
          s.switches = { displays: false, lift: false, third: false };
          say(s, 'The switch goes over. A bang inside the panel. All three switches drop to off.');
          return;
        }
        w[key] = true;
        say(s, 'The switch goes over with a clunk.', onText);
      });
    }
    return { heading: 'Mechanical', text: [
      'Three big switches in a row. A hand-lettered card is taped above them: OLD WIRING. TWO AT A TIME.',
      'Displays: ' + word(sw.displays) + '. Lift: ' + word(sw.lift) + '. The third has no label: ' + word(sw.third) + '.'
    ], options: [
      flip('displays', 'Displays', 'Nothing changes down here.'),
      flip('lift', 'Lift', 'Somewhere in the wall, a motor starts to hum.'),
      flip('third', 'the third switch', 'Nothing you can see or hear.'),
      look('Back', 'mech')
    ] };
  },

  shop: function () {
    return { heading: 'Gift Shop', text: [
      'Shelves of rubber dinosaurs, plaster pyramids, and pencils. A night-light glows over the register.',
      'A postcard rack stands by the door. A glass case of sandwiches sits on the counter, with batteries on a card behind it. A telephone is fixed to the wall.'
    ], options: [
      look('Postcard rack', 'rack'),
      look('Sandwiches', 'sandwich'),
      look('Batteries', 'batteries'),
      look('Telephone', 'phone'),
      move('Leave (Lower Hall)', 'lowerhall')
    ] };
  },

  rack: function (s) {
    // A card is a hint. It is not sold until you have tried that room and failed.
    function card(label, item, tried, what, text) {
      return act(label, function (s) {
        if (!tried) { say(s, 'You pick up the card, then put it back. You have not even tried ' + what + ' yet.'); return false; }
        if (!buy(s, 'a postcard')) return false;
        give(s, item);
        say(s, 'You empty your pocket into the dish by the register.', text);
      });
    }
    var o = [card('Buy the Hall of Clocks', 'postcard', s.clockTried || s.clockSolved, 'the clocks', postcardText(s))];
    if (s.treasures >= 1) o.push(card('Buy the Painting Gallery', 'postcard2', s.galleryTried || s.gallerySolved, 'the paintings', POSTCARD2_TEXT));
    var text = ['Views of the museum. A sign: a fistful of change each.'];
    if (has(s, 'postcard')) text.push('Your postcard of the Hall of Clocks: ' + postcardText(s));
    if (has(s, 'postcard2')) text.push('Your postcard of the Painting Gallery: ' + POSTCARD2_TEXT);
    o.push(look('Back', 'shop'));
    return { heading: 'Gift Shop', text: text, options: o };
  },

  sandwich: function () {
    return { heading: 'Gift Shop', text: ['Sandwiches wrapped in wax paper, in a glass case on the counter.'], options: [
      act('Buy a sandwich', function (s) {
        if (!buy(s, 'a sandwich')) return false;
        s.ate = true;
        say(s, 'You empty your pocket into the dish and take a sandwich. You eat it standing at the counter.');
      }),
      look('Back', 'shop')
    ] };
  },

  batteries: function () {
    return { heading: 'Gift Shop', text: ['Packs of batteries hang on a card behind the counter.'], options: [
      act('Buy a pack', function (s) {
        if (!buy(s, 'a pack')) return false;
        give(s, 'batteries');
        say(s, 'You empty your pocket into the dish and pull a pack off the card.');
      }),
      look('Back', 'shop')
    ] };
  },

  phone: function () {
    return { heading: 'Gift Shop', text: [
      'A black wall phone. A typed card is taped beside it:',
      '1 Front Desk. 2 Gift Shop. 3 Egypt. 4 Workshop.'
    ], options: [
      act('Call the front desk', function (s) {
        if (s.guard.state === 'in') say(s, 'It rings somewhere above you. A click. “Front desk.” A pause. “Hello?” You hang up.');
        else say(s, 'It rings somewhere above you. Nobody answers.');
      }),
      act('Call Egypt', function (s) {
        say(s, 'You press 3. Far overhead, a phone starts to ring. It keeps ringing.');
        if (s.guard.state === 'in') {
          say(s, 'Above you, a door opens. Footsteps cross the stone floor and start up the stairs.');
          s.pendingOut = { loc: 'egypt', lure: 'phone' };
        }
      }),
      look('Back', 'shop')
    ] };
  }
};

// ---------- public API ----------

function normalize(s) {
  if (!s.placed) s.placed = s.treasures >= 1 ? ['bell'] : [];
  if (!s.hooks) s.hooks = [null, null, null, null, null];
  if (s.gallerySolved === undefined) s.gallerySolved = false;
  if (s.starTaken === undefined) s.starTaken = false;
  if (s.screenCheck === undefined) s.screenCheck = false;
  if (s.painting === undefined) s.painting = null;
  if (s.clockTried === undefined) s.clockTried = false;
  if (!s.switches) s.switches = { displays: false, lift: false, third: false };
  if (s.mechOpen === undefined) s.mechOpen = false;
  if (s.keyTaken === undefined) s.keyTaken = false;
  if (s.galleryTried === undefined) s.galleryTried = false;
  return s;
}

function scene(s) {
  normalize(s);
  var f = scenes[s.node] || scenes[s.room] || scenes.cabin;
  return f(s);
}

function view(s) {
  var sc = scene(s);
  return {
    heading: sc.heading,
    msg: s.msg.slice(),
    text: sc.text.slice(),
    options: sc.options.map(function (o) { return o.label; }),
    input: sc.input || null,
    carrying: list(s.inv),
    done: s.done,
    turns: s.turns
  };
}

function begin(s) {
  s.msg = [];
  s.escaped = false;
  s.opening = false;
}

// ---------- the play log ----------
// Every tap is recorded in the state: where you were, what you picked,
// whether it cost a turn, where you ended up and what the game said.

function record(s, at, pick, turnBefore) {
  s.log.push({
    n: (s.log.length ? s.log[s.log.length - 1].n : 0) + 1,
    turn: s.turns,
    cost: s.turns - turnBefore,
    at: at,
    pick: pick,
    to: s.node,
    said: s.msg.slice(),
    carry: s.inv.slice(),
    guard: s.guard.state === 'out' ? 'out:' + s.guard.loc : s.guard.state
  });
  if (s.log.length > 300) s.log.shift();   // keep the saved game small
}

function logText(s) {
  var lines = [
    'Museum Game Chapter 1 play log',
    'game ' + s.id + ', started ' + s.started,
    'clocks ' + s.times.join(' + ') + ' = ' + answer(s) + ', chapters complete ' + (s.placed ? s.placed.length : s.treasures),
    'turns ' + s.turns + ', taps ' + (s.log.length ? s.log[s.log.length - 1].n : 0),
    ''
  ];
  s.log.forEach(function (e) {
    var head = ('000' + e.n).slice(-3) + ' t' + e.turn + (e.cost ? '*' : ' ') + ' ' + e.at + ' > ' + e.pick;
    if (e.to !== e.at) head += ' -> ' + e.to;
    if (e.guard !== 'in') head += '  [guard ' + e.guard + ']';
    lines.push(head);
    e.said.forEach(function (m) { lines.push('      ' + m); });
  });
  lines.push('', '* means the tap cost a turn. Looking is free.');
  return lines.join('\n');
}

function choose(s, index) {
  var sc = scene(s);
  var o = sc.options[index];
  var at = s.node, before = s.turns;
  if (!o) {
    s.msg = ['There is no ' + (index + 1) + ' here.'];
    record(s, at, '(pressed ' + (index + 1) + ', not on the menu)', before);
    return s;
  }
  begin(s);
  var result = o.fn(s);
  if (!o.free && result !== false) tick(s);
  loadFlashlight(s);
  record(s, at, o.label, before);
  return s;
}

function submit(s, value) {
  if (s.node !== 'tall_set') return s;
  var at = s.node, before = s.turns;
  var n = parseInt(value, 10);
  if (!(n >= 1 && n <= 12)) {
    s.msg = ['Type a number from 1 to 12.'];
    record(s, at, 'typed "' + String(value).slice(0, 12) + '"', before);
    return s;
  }
  begin(s);
  s.node = 'tall';
  if (n === answer(s)) {
    s.clockSolved = true;
    say(s, 'You set the hands to ' + WORDS[n] + ' and let go.',
           'Something inside the case catches. The clock strikes. You count thirteen.',
           'The case door swings open.');
  } else {
    s.clockTried = true;
    say(s, 'You set the hands and let go.',
           'Nothing. Then the hour hand slides back to twelve by itself.');
  }
  tick(s);
  record(s, at, 'typed ' + n, before);
  return s;
}

export { newState, view, choose, submit, answer, logText, normalize, ITEM_NAMES, HUNGER_X, LURE_TIME };
