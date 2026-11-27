// Scripted playthroughs for the museum engine. Run: npm run test:museum
import * as G from './engine.mjs';
import assert from 'node:assert';

// pick an option by its label (exact or prefix), fail loudly if missing
function pick(s, label) {
  const v = G.view(s);
  const i = v.options.findIndex(o => o === label || o.startsWith(label));
  assert(i !== -1, `no option "${label}" at ${s.node}. Options: ${v.options.join(' | ')}`);
  G.choose(s, i);
  return G.view(s);
}
function run(s, labels) { let v; for (const l of labels) v = pick(s, l); return v; }
function said(s, needle) { return G.view(s).msg.join(' ').includes(needle); }
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('ok  ' + name); }

test('menus never exceed eight options, anywhere reachable', () => {
  // brute force: breadth-first over option labels to a modest depth
  const seen = new Set();
  let frontier = [G.newState({ times: [2, 4, 3] })];
  for (let depth = 0; depth < 7; depth++) {
    const next = [];
    for (const s of frontier) {
      const v = G.view(s);
      assert(v.options.length <= 8, `${s.node} has ${v.options.length} options`);
      assert(v.options.length >= 1, `${s.node} is a dead end`);
      for (let i = 0; i < v.options.length; i++) {
        const c = JSON.parse(JSON.stringify(s));
        G.choose(c, i);
        const key = JSON.stringify([c.node, c.room, c.inv, c.guard.state, c.clockSolved, c.hidden, c.ducked]);
        if (!seen.has(key)) { seen.add(key); next.push(c); }
      }
    }
    frontier = next;
  }
});

test('clean run: solve the clocks and finish Chapter 1', () => {
  const s = G.newState({ times: [2, 4, 3] });
  assert(G.view(s).text[0].includes('Nobody counted you'));
  run(s, ['Leave (Landing)', 'Stairs', 'Hall of Clocks', 'Cuckoo clock', 'Back', 'Ship', 'Back', 'Station', 'Back', 'Tall clock', 'Set the hands']);
  assert(G.view(s).input, 'clock should ask for a typed hour');
  G.submit(s, '11');
  assert(said(s, 'slides back to twelve'));
  assert(!s.clockSolved);
  pick(s, 'Set the hands');
  G.submit(s, '9');
  assert(s.clockSolved && said(s, 'You count thirteen'));
  pick(s, 'Take the bell');
  assert(G.view(s).carrying === 'a brass handbell');
  run(s, ['Back', 'Leave (South)', 'Display case']);
  const v = pick(s, 'Place the bell');
  assert(v.done && said(s, 'Congratulations on completing Chapter 1!'));
  assert(G.view(s).carrying === 'nothing');
  // the bolt shows on the PRIVATE door
  run(s, ['Back', 'Stairs', 'Up', 'Tall door']);
  assert(G.view(s).text[0].includes('One is drawn back'));
});

test('looking is free, actions are turns', () => {
  const s = G.newState({ times: [2, 4, 3] });
  run(s, ['Bed', 'Back']);
  assert.strictEqual(s.turns, 0);
  pick(s, 'Leave (Landing)');
  assert.strictEqual(s.turns, 1);
  run(s, ['Tall door', 'Back', 'Painting Gallery', 'Back', 'Egypt', 'Back']);
  assert.strictEqual(s.turns, 1);
});

test('locked doors say Locked', () => {
  const s = G.newState({ times: [2, 4, 3] });
  run(s, ['Leave (Landing)', 'Painting Gallery']);
  assert(G.view(s).text[0] === 'Locked.');
  run(s, ['Back', 'Stairs', 'Stairs', 'Down', 'Mechanical']);
  assert(G.view(s).text[0].endsWith('Locked.'));
  run(s, ['Back', 'Storage']);
  assert(G.view(s).text[0].includes('letter wheels'));
});

test('coins: one fistful, one purchase, conscience without', () => {
  const s = G.newState({ times: [2, 4, 3] });
  run(s, ['Leave (Landing)', 'Stairs', 'Stairs', 'Down', 'Gift Shop', 'Sandwiches', 'Buy a sandwich']);
  assert(said(s, 'conscience gets the better of you'));
  run(s, ['Back', 'Leave (Lower Hall)', 'Stairs', 'Fountain', 'Take coins']);
  assert(G.view(s).carrying === 'a fistful of coins');
  const t = s.turns;
  pick(s, 'Take coins');
  assert(said(s, 'Your pockets are already full.'));
  assert.strictEqual(s.turns, t, 'a refused grab is not a turn');
  run(s, ['Back', 'Stairs', 'Down', 'Gift Shop', 'Sandwiches', 'Buy a sandwich']);
  assert(said(s, 'You eat it'));
  pick(s, 'Buy a sandwich');
  assert(said(s, 'conscience'), 'second purchase on one run must fail');
});

test('hunger nags at 24, 36, then every third turn from 48; eating resets', () => {
  const s = G.newState({ times: [2, 4, 3] });
  const nags = [];
  pick(s, 'Leave (Landing)');
  for (let i = 0; i < 60; i++) {
    pick(s, s.room === 'landing' ? 'Pioneer Cabin' : 'Leave (Landing)');
    if (said(s, 'stomach grumbling')) nags.push(s.turns);
  }
  assert.deepStrictEqual(nags.slice(0, 6), [24, 36, 48, 51, 54, 57]);
  // eat
  run(s, [s.room === 'landing' ? 'Stairs' : 'Leave (Landing)']);
  if (s.room === 'landing') pick(s, 'Stairs');
  run(s, ['Fountain', 'Take coins', 'Back', 'Stairs', 'Down', 'Gift Shop', 'Sandwiches', 'Buy a sandwich']);
  assert(said(s, 'You eat it'));
  const ate = s.turns;
  let next = null;
  run(s, ['Back']);
  for (let i = 0; i < 30 && next === null; i++) {
    pick(s, s.room === 'shop' ? 'Leave (Lower Hall)' : 'Gift Shop');
    if (said(s, 'stomach grumbling')) next = s.turns;
  }
  assert.strictEqual(next - ate, 24);
});

function solveAndTakeBell(s) {
  run(s, ['Leave (Landing)', 'Stairs', 'Hall of Clocks', 'Tall clock', 'Set the hands']);
  G.submit(s, 9);
  pick(s, 'Take the bell');
}

test('cuckoo with the bell in hand: spotted, bell goes to lost and found', () => {
  const s = G.newState({ times: [2, 4, 3] });
  solveAndTakeBell(s);
  run(s, ['Back', 'Cuckoo clock', 'Push the bird back in']);
  assert(said(s, 'a chair scrapes'));
  run(s, ['Back', 'Ship']);            // dawdle, looking is free so nothing happens yet
  assert(s.room === 'clocks');
  run(s, ['Back', 'Cuckoo clock', 'Push the bird back in']); // action 1 after alert
  pick(s, 'Push the bird back in');                           // action 2: he arrives
  assert(s.room === 'cabin' && said(s, 'You run.'));
  assert(G.view(s).text[0].includes('Your pockets are empty'));
  assert.deepStrictEqual(s.lost, ['bell']);
  assert(G.view(s).carrying === 'nothing');
});

test('recover the bell: cuckoo, duck behind the fountain, raid the office, finish', () => {
  const s = G.newState({ times: [2, 4, 3] });
  solveAndTakeBell(s);
  run(s, ['Back', 'Cuckoo clock', 'Push the bird back in', 'Push the bird back in', 'Push the bird back in']);
  assert(s.room === 'cabin');
  // empty-handed from the cabin
  run(s, ['Leave (Landing)']);
  assert(G.view(s).text[0].includes('The door is shut.'));
  run(s, ['Stairs', 'Office door']);
  assert(!G.view(s).options.includes('Go in') && G.view(s).text[0].startsWith('Shut.'), 'office is shut while he is in');
  run(s, ['Back', 'Hall of Clocks', 'Cuckoo clock', 'Push the bird back in', 'Back', 'Leave (South)']);
  assert(said(s, 'office door is opening'));
  assert(!G.view(s).options.some(o => o.startsWith('Duck')), 'no duck option on the lobby menu');
  run(s, ['Front counter', 'Duck under the counter']);
  assert(said(s, 'fade away to the north'));
  assert(s.guard.state === 'out' && s.guard.loc === 'clocks');
  run(s, ['Come out', 'Back', 'Office door', 'Go in', 'Lost and found']);
  assert(G.view(s).text[1].includes('brass handbell'));
  pick(s, 'Take your things');
  assert(G.view(s).carrying === 'a brass handbell');
  run(s, ['Back', 'Leave (Lobby)', 'Display case', 'Place the bell']);
  assert(s.done);
});

test('office: the cuckoo stopping is the warning, and lingering gets you spotted', () => {
  const s = G.newState({ times: [2, 4, 3] });
  run(s, ['Leave (Landing)', 'Stairs', 'Hall of Clocks', 'Cuckoo clock', 'Push the bird back in', 'Back', 'Leave (South)', 'Front counter', 'Duck under the counter']);
  run(s, ['Come out', 'Back', 'Office door', 'Go in']);
  // reading his logbook is free and never brings him back
  for (let i = 0; i < 20; i++) pick(s, s.node === 'office' ? 'Desk' : 'Back');
  assert(s.room === 'office' && s.guard.state === 'out', 'looking must not move the guard');
  // walking in and out does
  let warned = false, turns = 0;
  for (; turns < 12 && s.room !== 'cabin'; turns++) {
    if (s.room === 'office') pick(s, 'Leave (Lobby)');
    else { pick(s, 'Office door'); pick(s, 'Go in'); }
    if (said(s, 'the cuckoo stops')) warned = true;
  }
  assert(warned, 'should hear the cuckoo stop');
  assert(s.room === 'cabin', 'lingering by the office should end in an escape');
  assert(turns <= 6, 'he stays out six turns on the cuckoo');
});

test('with the bell in hand: hide behind the station clock while he fights the bird, then slip out', () => {
  const s = G.newState({ times: [2, 4, 3] });
  solveAndTakeBell(s);
  run(s, ['Back', 'Cuckoo clock', 'Push the bird back in', 'Back', 'Hide behind the station clock']);
  assert(G.view(s).text.join(' ').includes('hold the clapper still'));
  pick(s, 'Stay put');
  assert(said(s, 'goes straight to the cuckoo clock'));
  assert(G.view(s).options.includes('Slip out while his back is turned'));
  pick(s, 'Slip out while his back is turned');
  assert(s.room === 'lobby' && G.view(s).carrying === 'a brass handbell');
  run(s, ['Display case', 'Place the bell']);
  assert(s.done);
});

test('case still locked: hide behind the station clock, wait him out, he gives up and goes home', () => {
  const s = G.newState({ times: [2, 4, 3] });
  run(s, ['Leave (Landing)', 'Stairs', 'Hall of Clocks']);
  assert(!G.view(s).options.includes('Hide behind the station clock'), 'no hide option while he is in his office');
  run(s, ['Cuckoo clock', 'Push the bird back in', 'Back']);
  assert(G.view(s).options.includes('Hide behind the station clock'));
  pick(s, 'Hide behind the station clock');
  pick(s, 'Stay put');
  assert(said(s, 'goes straight to the cuckoo clock'));
  const texts = new Set();
  let left = false;
  for (let i = 0; i < 20 && s.guard.state !== 'in'; i++) {
    pick(s, 'Stay put');
    const m = G.view(s).msg;
    assert(m.length > 0, 'staying put must always say something');
    m.forEach(x => texts.add(x));
    if (said(s, 'walks out to the south')) left = true;
  }
  assert(left && s.guard.state === 'in' && s.room === 'clocks', 'he should give up and leave');
  assert(texts.size >= 3, 'waiting should vary');
  pick(s, 'Stay put');
  assert(said(s, 'Nothing moves'));
  pick(s, 'Come out');
  assert(s.node === 'clocks' && !s.hidden);
});

test('phone lure: call Egypt from the shop, office opens, he comes back', () => {
  const s = G.newState({ times: [2, 4, 3] });
  run(s, ['Leave (Landing)', 'Stairs', 'Stairs', 'Down', 'Gift Shop', 'Telephone', 'Call the front desk']);
  assert(said(s, 'Front desk.'));
  pick(s, 'Call Egypt');
  assert(said(s, 'start up the stairs'));
  run(s, ['Back', 'Leave (Lower Hall)', 'Stairs', 'Office door']);
  assert(G.view(s).options.includes('Go in'));
  run(s, ['Go in', 'Desk']);
  assert(G.view(s).text[1].includes('Clock struck 13') && G.view(s).text[2].includes('MECH'));
  run(s, ['Back', 'Leave (Lobby)', 'Hall of Clocks']);
  let heard = false;
  pick(s, 'Cuckoo clock');
  for (let i = 0; i < 10 && s.guard.state !== 'in'; i++) {
    pick(s, 'Push the bird back in');
    if (said(s, 'the ringing stops')) heard = true;
  }
  assert(heard && s.guard.state === 'in' && s.room === 'clocks');
});

test('stash: things under the bed survive an escape', () => {
  const s = G.newState({ times: [2, 4, 3] });
  run(s, ['Leave (Landing)', 'Stairs', 'Front counter', 'Open the drawer', 'Take the flashlight', 'Back', 'Stairs', 'Up', 'Pioneer Cabin', 'Bed', 'Stash']);
  assert(G.view(s).carrying === 'nothing' && s.stash.includes('flashlight'));
  run(s, ['Back', 'Leave (Landing)', 'Stairs', 'Hall of Clocks', 'Cuckoo clock', 'Push the bird back in', 'Push the bird back in', 'Push the bird back in']);
  assert(s.room === 'cabin' && s.lost.length === 0);
  run(s, ['Bed', 'Take what']);
  assert(G.view(s).carrying === 'a flashlight');
});

test('ringing the bell at the fountain brings him to the lobby; ducking works', () => {
  const s = G.newState({ times: [2, 4, 3] });
  solveAndTakeBell(s);
  run(s, ['Back', 'Leave (South)', 'Fountain', 'Ring the bell']);
  assert(said(s, 'A chair scrapes'));
  run(s, ['Back', 'Front counter', 'Duck under the counter']);
  assert(said(s, 'a door handle turns'));
  pick(s, 'Stay down');
  assert(said(s, 'flashlight beam sweeps the lobby'));
  let back = false;
  for (let i = 0; i < 8 && s.guard.state !== 'in'; i++) { pick(s, 'Stay down'); if (said(s, 'radio comes back on')) back = true; }
  assert(back && s.guard.state === 'in' && s.room === 'lobby' && G.view(s).carrying === 'a brass handbell');
  pick(s, 'Come out');
  assert(s.node === 'desk');
});

test('a number that is not on the menu', () => {
  const s = G.newState({ times: [2, 4, 3] });
  G.choose(s, 5);
  assert(G.view(s).msg[0] === 'There is no 6 here.');
});

test('a fresh game rolls three clock hours from 1 to 4, never adding to twelve', () => {
  const sums = new Set(), sets = new Set();
  for (let i = 0; i < 500; i++) {
    const s = G.newState();
    assert(s.times.length === 3 && s.times.every(n => n >= 1 && n <= 4));
    const sum = G.answer(s);
    assert(sum >= 3 && sum <= 11);
    sums.add(sum); sets.add(s.times.join(''));
  }
  assert(sums.size >= 7 && sets.size >= 40, 'should vary from game to game');
});

test('random game: the clocks, the postcard and the answer all agree', () => {
  const words = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
  for (let i = 0; i < 50; i++) {
    const s = G.newState();
    const [a, b, c] = s.times, sum = a + b + c;
    run(s, ['Leave (Landing)', 'Stairs', 'Hall of Clocks', 'Cuckoo clock']);
    assert(G.view(s).text[0].includes(`say ${words[a]} o`));
    run(s, ['Back', 'Ship']);
    assert(G.view(s).text[1].includes(`points at ${['', 'I', 'II', 'III', 'IIII'][b]}.`));
    run(s, ['Back', 'Station']);
    assert(G.view(s).text[1].includes(`the ${['', 'first', 'second', 'third', 'fourth'][c]} mark past the top`));
    run(s, ['Back', 'Tall clock', 'Set the hands']);
    G.submit(s, sum === 11 ? 10 : sum + 1);
    assert(!s.clockSolved);
    pick(s, 'Set the hands');
    G.submit(s, sum);
    assert(s.clockSolved && said(s, `to ${words[sum]} and let go`));
    assert(G.view(s).text[0].includes(`The hands say ${words[sum]}.`));
  }
});

test('play log: every tap is recorded, with free looks and typed answers', () => {
  const s = G.newState({ times: [2, 4, 3] });
  run(s, ['Bed', 'Back', 'Leave (Landing)', 'Stairs', 'Hall of Clocks', 'Tall clock', 'Set the hands']);
  G.submit(s, 'abc');
  G.submit(s, 11);
  pick(s, 'Set the hands');
  G.submit(s, 9);
  G.choose(s, 7);
  assert.strictEqual(s.log.length, 12);
  assert.strictEqual(s.log[0].cost, 0, 'looking at the bed is free');
  assert.strictEqual(s.log[2].cost, 1, 'leaving the cabin costs a turn');
  assert(s.log[8].pick === 'typed 11' && s.log[8].said.join(' ').includes('slides back'));
  assert(s.log[11].pick.includes('not on the menu'));
  const text = G.logText(s);
  assert(text.includes('clocks 2 + 4 + 3 = 9') && text.includes('> Leave (Landing) -> landing') && text.includes('typed 9'));
  assert(JSON.stringify(s).length < 20000, 'log should stay small');
});

test('wandering the lobby while he is at the cuckoo: looks are free, turns bring him back', () => {
  // the run Scott logged: slip out, then look around the lobby
  const s = G.newState({ times: [3, 1, 2] });
  run(s, ['Leave (Landing)', 'Stairs', 'Hall of Clocks', 'Cuckoo clock', 'Push the bird back in', 'Back', 'Hide behind the station clock', 'Stay put', 'Slip out while his back is turned']);
  assert(s.room === 'lobby' && s.guard.state === 'out');
  // looking around is free: he stays at the bird, and the lobby says so
  assert(G.view(s).text[2].includes('the cuckoo goes off again'));
  assert(G.view(s).text[2].includes('stands open'));
  const tour = ['Display case', 'Back', 'Fountain', 'Back', 'Front counter', 'Back'];
  const before = s.guard.left;
  for (let i = 0; i < 30; i++) pick(s, tour[i % tour.length]);
  assert(s.room === 'lobby' && s.guard.state === 'out' && s.guard.left === before);
  // turns bring him back: warning with two to go, then he finds you in the open
  let warned = false, turns = 0;
  for (; turns < 10 && s.room !== 'cabin'; turns++) {
    pick(s, 'Fountain'); pick(s, 'Take coins'); 
    if (said(s, 'Footsteps start back toward the lobby')) warned = true;
    if (s.room === 'cabin') break;
    pick(s, 'Back'); pick(s, 'Stairs'); pick(s, 'Down'); 
    if (said(s, 'the cuckoo stops')) warned = true;
    pick(s, 'Stairs (Up)');
    if (said(s, 'the cuckoo stops')) warned = true;
  }
  assert(warned && s.room === 'cabin');
});

test('guard status stays on screen: the run where Scott walked back into the office', () => {
  const s = G.newState({ times: [3, 3, 4] });
  run(s, ['Leave (Landing)', 'Stairs', 'Hall of Clocks', 'Cuckoo clock', 'Push the bird back in', 'Back', 'Hide behind the station clock', 'Stay put', 'Stay put', 'Slip out while his back is turned']);
  run(s, ['Front counter', 'Open the drawer', 'Take the flashlight', 'Back', 'Office door']);
  assert(G.view(s).text[1].includes('the cuckoo goes off again'), 'door screen says he is still busy');
  pick(s, 'Go in');
  assert(said(s, 'the cuckoo stops'));
  assert(G.view(s).text.join(' ').includes('Footsteps are coming from the north'), 'office keeps saying he is coming');
  pick(s, 'Leave (Lobby)');
  assert(G.view(s).text[2].includes('The cuckoo has stopped. Footsteps are coming from the north.'), 'lobby says so, and no longer claims the cuckoo is going');
  assert(!G.view(s).text[2].includes('goes off again'));
  pick(s, 'Office door');
  assert(G.view(s).text.join(' ').includes('Footsteps are coming'), 'so does the office door');
  run(s, ['Back', 'Front counter']);
  assert(G.view(s).text.join(' ').includes('Footsteps are coming'), 'and the counter you can hide under');
  pick(s, 'Duck under the counter');
  assert(said(s, 'The office door shuts') && s.guard.state === 'in' && G.view(s).carrying === 'a flashlight');
});

test('under the counter you can tell when he is back: the run where Scott came out a turn early', () => {
  const play = () => {
    const s = G.newState({ times: [2, 2, 3] });
    run(s, ['Leave (Landing)', 'Stairs', 'Hall of Clocks', 'Cuckoo clock', 'Push the bird back in', 'Back', 'Hide behind the station clock', 'Stay put', 'Slip out while his back is turned']);
    run(s, ['Fountain', 'Take coins', 'Back', 'Front counter', 'Open the drawer', 'Take the flashlight', 'Duck under the counter']);
    assert(said(s, 'the cuckoo stops'));
    assert(G.view(s).text[1].includes('Footsteps are coming from the north'), 'the hiding place says he is coming');
    pick(s, 'Stay down');
    assert(said(s, 'Footsteps are coming from the north'), 'waiting says he is coming, not that the lobby is empty');
    return s;
  };
  // what Scott did: come out after one turn and walk north, straight into him
  let s = play();
  run(s, ['Come out', 'Back', 'Hall of Clocks']);
  assert(s.room === 'cabin' && said(s, 'he is right there'));
  // what the screen now tells you to do: wait one more turn
  s = play();
  pick(s, 'Stay down');
  assert(said(s, 'The office door shuts'));
  assert(G.view(s).text[1].includes('The office door is shut. Behind it, the radio is playing.'));
  run(s, ['Come out', 'Back', 'Hall of Clocks']);
  assert(s.room === 'clocks' && G.view(s).carrying === 'a fistful of coins and a flashlight');
});

test('lobby has six options and the directory is on the counter', () => {
  const s = G.newState({ times: [2, 4, 3] });
  run(s, ['Leave (Landing)', 'Stairs']);
  assert.deepStrictEqual(G.view(s).options, ['Display case', 'Fountain', 'Front counter', 'Office door', 'Hall of Clocks (North)', 'Stairs']);
  run(s, ['Front counter', 'Read the directory']);
  assert(G.view(s).text[2].startsWith('UPPER:'));
  pick(s, 'Back');
  assert(s.node === 'desk' && s.turns === 2);
});

function finishChapter1(s) {
  run(s, ['Leave (Landing)', 'Stairs', 'Hall of Clocks', 'Tall clock', 'Set the hands']);
  G.submit(s, G.answer(s));
  run(s, ['Take the bell', 'Back', 'Leave (South)', 'Display case', 'Place the bell']);
}
function put(s, painting, hook) {
  run(s, [painting, 'Hang it']);
  const i = G.view(s).options.indexOf('Hook ' + hook);
  assert(i !== -1, 'hook ' + hook + ' is not offered: ' + G.view(s).options.join(' | '));
  G.choose(s, i);
}
function takeDown(s, hook) { run(s, ['The wall', 'Hook ' + hook + ':', 'Take it down']); if (s.node === 'wall') pick(s, 'Back'); }

test('chapter 2: the gallery is locked until the bell is in the case, then the door opens', () => {
  const s = G.newState({ times: [2, 4, 3] });
  run(s, ['Leave (Landing)', 'Painting Gallery']);
  assert(G.view(s).text[0] === 'Locked.');
  pick(s, 'Back');
  const t = G.newState({ times: [2, 4, 3] });
  finishChapter1(t);
  assert(said(t, 'a latch letting go') && said(t, 'Chapter 1!'));
  run(t, ['Back', 'Stairs', 'Up']);
  assert(G.view(t).text[1].includes('stands ajar'));
  pick(t, 'Painting Gallery');
  assert(t.room === 'gallery' && G.view(t).options.length === 7);
  assert(G.view(t).options[1] !== 'The enormous painting', 'menu order must not be the answer');
});

test('chapter 2: wrong order says check your work, right order opens the panel, the star finishes it', () => {
  const s = G.newState({ times: [2, 4, 3] });
  finishChapter1(s);
  run(s, ['Back', 'Stairs', 'Up', 'Painting Gallery']);
  s.switches.displays = true;            // power is covered in its own test
  pick(s, 'Touchscreen');
  assert(G.view(s).text[3].includes('The lemon sits beside the fish'));
  pick(s, 'Back');
  const turns = s.turns;
  pick(s, 'The brown painting');
  assert(G.view(s).text[1].includes('small circle with spokes') && s.turns === turns, 'looking at a painting is free');
  pick(s, 'Back');
  // Scott's first try: fish on II, long dark on III
  put(s, 'The enormous painting', 'I');
  assert(G.view(s).text[2].startsWith('Hooks: I the enormous painting. II empty.'));
  // a hung painting leaves the main list, and The wall appears
  assert.deepStrictEqual(G.view(s).options, ['Touchscreen', 'The painting with the fish', 'The brown painting', 'The tiny painting', 'The long dark painting', 'The wall', 'Leave (Landing)']);
  run(s, ['The tiny painting', 'Hang it']);
  assert(!G.view(s).options.includes('Hook I'), 'a full hook is not offered');
  pick(s, 'Never mind'); pick(s, 'Back');
  put(s, 'The painting with the fish', 'II');
  put(s, 'The long dark painting', 'III');
  put(s, 'The tiny painting', 'IV');
  put(s, 'The brown painting', 'V');
  assert(said(s, 'Check your work') && !s.gallerySolved);
  assert.deepStrictEqual(G.view(s).options, ['Touchscreen', 'The wall', 'Leave (Landing)'], 'with everything hung, the list is short');
  pick(s, 'Touchscreen');
  assert(G.view(s).text[0] === 'Check your work.');
  pick(s, 'Back');
  // fix it from the wall
  run(s, ['The wall']);
  assert.deepStrictEqual(G.view(s).options, ['Hook I: the enormous painting', 'Hook II: the painting with the fish', 'Hook III: the long dark painting', 'Hook IV: the tiny painting', 'Hook V: the brown painting', 'Back']);
  run(s, ['Hook II:', 'Take it down']);
  assert(said(s, 'You take the painting with the fish down') && s.hooks[1] === null && s.node === 'wall');
  run(s, ['Hook III:', 'Take it down', 'Back']);
  assert(G.view(s).text[0].includes('Two paintings lean'));
  assert(G.view(s).options.includes('The painting with the fish') && G.view(s).options.includes('The long dark painting'));
  put(s, 'The long dark painting', 'II');
  put(s, 'The painting with the fish', 'III');
  assert(s.gallerySolved && said(s, 'On the opposite wall, a panel swings out'));
  assert(G.view(s).text[3] === 'On the wall behind you, a panel hangs open.');
  assert.deepStrictEqual(G.view(s).options, ['Touchscreen', 'The wall', 'Wall panel', 'Leave (Landing)']);
  run(s, ['The wall', 'Hook IV:']);
  assert(!G.view(s).options.includes('Take it down'), 'paintings stay put once solved');
  run(s, ['Back']);
  run(s, ['Back', 'Wall panel', 'Take the star']);
  assert(G.view(s).carrying === 'a gold star');
  run(s, ['Back', 'Leave (Landing)', 'Stairs', 'Display case']);
  assert(G.view(s).text[0].includes('The bell sits on one stand. Four are empty.'));
  pick(s, 'Place the gold star');
  assert(said(s, 'Congratulations on completing Chapter 2!'));
  assert(G.view(s).text[0].includes('The bell and the gold star sit on two stands. Three are empty.'));
  run(s, ['Back', 'Stairs', 'Up', 'Tall door']);
  assert(G.view(s).text[0].includes('Two are drawn back. Three are shut.'));
});

test('chapter 2: a game saved before the gallery existed carries on', () => {
  const s = G.newState({ times: [2, 2, 3] });
  finishChapter1(s);
  ['placed', 'hooks', 'gallerySolved', 'starTaken', 'screenCheck', 'painting'].forEach(k => delete s[k]);
  const old = JSON.parse(JSON.stringify(s));
  run(old, ['Back', 'Stairs', 'Up', 'Painting Gallery']);
  assert(old.room === 'gallery' && old.placed.length === 1);
  put(old, 'The enormous painting', 'I');
  assert(old.hooks[0] === 'enormous');
});

test('chapter 2: the guard takes the star like anything else', () => {
  const s = G.newState({ times: [2, 4, 3] });
  finishChapter1(s);
  run(s, ['Back', 'Stairs', 'Up', 'Painting Gallery']);
  [['The enormous painting', 'I'], ['The long dark painting', 'II'], ['The painting with the fish', 'III'], ['The tiny painting', 'IV'], ['The brown painting', 'V']].forEach(([p, h]) => put(s, p, h));
  run(s, ['Wall panel', 'Take the star', 'Back', 'Leave (Landing)', 'Stairs', 'Hall of Clocks', 'Cuckoo clock', 'Push the bird back in', 'Push the bird back in', 'Push the bird back in']);
  assert(s.room === 'cabin' && s.lost.includes('star'));
});

test('postcards: no hint until you have tried and failed, then always for sale', () => {
  const coins = s => { if (!s.inv.includes('coins')) s.inv.push('coins'); };
  const atRack = s => { s.room = 'shop'; s.node = 'rack'; };
  const s = G.newState({ times: [2, 2, 3] });
  coins(s); atRack(s);
  assert.deepStrictEqual(G.view(s).options, ['Buy the Hall of Clocks', 'Back']);
  const t = s.turns;
  pick(s, 'Buy the Hall of Clocks');
  assert(said(s, 'You have not even tried the clocks yet.'));
  assert(s.inv.includes('coins') && s.turns === t, 'a refused card costs nothing');
  // one wrong answer at the tall clock earns the hint
  s.room = 'clocks'; s.node = 'tall_set';
  G.submit(s, 1);
  assert(s.clockTried && !s.clockSolved);
  atRack(s);
  pick(s, 'Buy the Hall of Clocks');
  assert(said(s, 'Its hands say seven.') && !s.inv.includes('coins'));
  // solved cards stay on sale: money does not matter much
  s.room = 'clocks'; s.node = 'tall_set';
  G.submit(s, 7);
  coins(s); atRack(s);
  pick(s, 'Buy the Hall of Clocks');
  assert(said(s, 'Its hands say seven.'));

  // the gallery card: listed once the gallery is open, refused until a wrong wall
  const g = G.newState({ times: [2, 4, 3] });
  finishChapter1(g);
  coins(g); atRack(g);
  assert.deepStrictEqual(G.view(g).options, ['Buy the Hall of Clocks', 'Buy the Painting Gallery', 'Back']);
  pick(g, 'Buy the Painting Gallery');
  assert(said(g, 'You have not even tried the paintings yet.') && g.inv.includes('coins'));
  g.room = 'gallery'; g.node = 'gallery';
  [['The enormous painting', 'II'], ['The long dark painting', 'I'], ['The painting with the fish', 'III'], ['The tiny painting', 'IV'], ['The brown painting', 'V']].forEach(([p, h]) => put(g, p, h));
  assert(g.galleryTried && !g.gallerySolved);
  atRack(g);
  pick(g, 'Buy the Painting Gallery');
  assert(said(g, 'From the left: an enormous one, a long dark one, one with a fish, a tiny one, a brown one.'));
});

test('batteries go into the flashlight as soon as you hold both', () => {
  // batteries first, flashlight second
  const s = G.newState({ times: [2, 4, 3] });
  run(s, ['Leave (Landing)', 'Stairs', 'Fountain', 'Take coins', 'Back', 'Stairs', 'Down', 'Gift Shop', 'Batteries', 'Buy a pack']);
  assert(G.view(s).carrying === 'a pack of batteries');
  run(s, ['Back', 'Leave (Lower Hall)', 'Stairs', 'Front counter', 'Open the drawer', 'Take the flashlight']);
  assert(said(s, 'You thumb the batteries into the flashlight'));
  assert(G.view(s).carrying === 'a flashlight with fresh batteries');
  run(s, ['Back', 'Fountain']);
  assert(G.view(s).options.includes('Shine the flashlight in'));
  // flashlight first, batteries second
  const t = G.newState({ times: [2, 4, 3] });
  run(t, ['Leave (Landing)', 'Stairs', 'Front counter', 'Open the drawer', 'Take the flashlight', 'Back', 'Fountain', 'Take coins', 'Back', 'Stairs', 'Down', 'Gift Shop', 'Batteries', 'Buy a pack']);
  assert(said(t, 'You thumb the batteries into the flashlight') && G.view(t).carrying === 'a flashlight with fresh batteries');
});

test('mechanical: key from the guard\'s desk, switches start off, two at a time', () => {
  const s = G.newState({ times: [2, 4, 3] });
  assert.deepStrictEqual(s.switches, { displays: false, lift: false, third: false });
  // phone him upstairs, take the key off his desk
  run(s, ['Leave (Landing)', 'Stairs', 'Stairs', 'Down', 'Mechanical']);
  assert(G.view(s).text[0].includes('MECHANICAL') && G.view(s).text[0].endsWith('Locked.'));
  run(s, ['Back', 'Gift Shop', 'Telephone', 'Call Egypt', 'Back', 'Leave (Lower Hall)', 'Stairs', 'Office door', 'Go in', 'Desk', 'Take the key']);
  assert(G.view(s).carrying === 'a brass key');
  assert(!G.view(s).options.includes('Take the key'));
  run(s, ['Back', 'Leave (Lobby)', 'Stairs', 'Down', 'Mechanical']);
  assert(said(s, 'You leave it in the lock.') && s.room === 'mech' && G.view(s).carrying === 'nothing');
  run(s, ['Leave (Lower Hall)', 'Mechanical']);
  assert(s.room === 'mech', 'once unlocked it stays open');
  pick(s, 'Breaker panel');
  assert(G.view(s).text[1] === 'Displays: off. Lift: off. The third has no label: off.');
  assert.deepStrictEqual(G.view(s).options, ['Turn Displays on', 'Turn Lift on', 'Turn the third switch on', 'Back']);
  pick(s, 'Turn Displays on');
  pick(s, 'Turn Lift on');
  assert(said(s, 'a motor starts to hum'));
  assert(G.view(s).text[1] === 'Displays: on. Lift: on. The third has no label: off.');
  pick(s, 'Turn the third switch on');
  assert(said(s, 'All three switches drop to off.'));
  assert.deepStrictEqual(s.switches, { displays: false, lift: false, third: false });
  pick(s, 'Turn Displays on');
  pick(s, 'Turn Displays off');
  assert(!s.switches.displays && said(s, 'drops with a clunk'));
});

test('mechanical: the gallery screen is dark until Displays is on, and the guard going out shuts it off again', () => {
  const s = G.newState({ times: [2, 4, 3] });
  finishChapter1(s);
  run(s, ['Back', 'Stairs', 'Up', 'Painting Gallery']);
  assert(G.view(s).text[1].endsWith('It is dark.'));
  pick(s, 'Touchscreen');
  assert(G.view(s).text[0].startsWith('The screen is black.') && G.view(s).text[1].includes('DISPLAYS'));
  pick(s, 'Back');
  // a wrong wall with the power off: no chime, but it still counts as a try
  [['The enormous painting', 'II'], ['The long dark painting', 'I'], ['The painting with the fish', 'III'], ['The tiny painting', 'IV'], ['The brown painting', 'V']].forEach(([p, h]) => put(s, p, h));
  assert(said(s, 'Nothing happens.') && s.galleryTried && !s.screenCheck);
  // power it
  s.mechOpen = true;
  run(s, ['Leave (Landing)', 'Stairs', 'Stairs', 'Down', 'Mechanical', 'Breaker panel', 'Turn Displays on', 'Back', 'Leave (Lower Hall)', 'Stairs', 'Stairs', 'Up', 'Painting Gallery']);
  assert(G.view(s).text[1].endsWith('It is glowing.'));
  pick(s, 'Touchscreen');
  assert(G.view(s).text[0] === 'FIVE LEMONS. PUT THEM IN ORDER.');
  // the guard ventures out: everything goes back to off
  run(s, ['Back', 'Leave (Landing)', 'Stairs', 'Hall of Clocks', 'Cuckoo clock', 'Push the bird back in', 'Back', 'Hide behind the station clock', 'Stay put']);
  assert(s.guard.state === 'out');
  assert.deepStrictEqual(s.switches, { displays: false, lift: false, third: false });
  // the right order still opens the panel with the screen dark
  for (let i = 0; i < 8 && s.guard.state !== 'in'; i++) pick(s, 'Stay put');
  run(s, ['Come out', 'Leave (South)', 'Stairs', 'Up', 'Painting Gallery']);
  assert(G.view(s).text[1].endsWith('It is dark.'));
  takeDown(s, 'I'); takeDown(s, 'II');
  put(s, 'The enormous painting', 'I'); put(s, 'The long dark painting', 'II');
  assert(s.gallerySolved);
});

console.log(`\n${passed} playthroughs passed`);
