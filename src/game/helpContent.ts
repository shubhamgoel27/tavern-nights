// ── Help & Rules Content ──
// Static data consumed by HowToPlayModal and CheatSheet.

export interface SpecialCardInfo {
  rank: string;
  title: string;
  icon: string;
  description: string;
}

export interface HandRankInfo {
  name: string;
  description: string;
}

export const SPECIAL_CARDS: SpecialCardInfo[] = [
  {
    rank: 'Jack',
    title: 'Spy',
    icon: '\uD83D\uDC41',
    description: 'Ability: Placed on opponent\'s board (dilutes their hand) + draw 2 cards. Or play as value card (11) with no ability.',
  },
  {
    rank: 'Queen',
    title: 'Medic',
    icon: '\u2695',
    description: 'Ability: Revives the highest card from the graveyard onto this row. Or play as value card (12) with no ability.',
  },
  {
    rank: 'King',
    title: 'Commander',
    icon: '\u2694',
    description: 'Ability: Win this row = opponent loses 5 extra chips (stacks). Or play as value card (13) with no ability.',
  },
  {
    rank: 'Ace',
    title: 'Scorcher',
    icon: '\uD83D\uDD25',
    description: 'Ability: Destroys opponent\'s highest card in same row. Or play as value card (14) with no ability.',
  },
  {
    rank: 'Joker',
    title: 'Weather',
    icon: '\u2601',
    description: 'Disables ALL flushes for the entire round. Affects both players — always activates (no value option).',
  },
];

export const HAND_RANKINGS: HandRankInfo[] = [
  { name: 'Royal Flush', description: '10-J-Q-K-A, same suit' },
  { name: 'Straight Flush', description: '5 consecutive, same suit' },
  { name: 'Four of a Kind', description: '4 cards of the same rank' },
  { name: 'Full House', description: '3 of a kind + a pair' },
  { name: 'Flush', description: '5 cards of the same suit' },
  { name: 'Straight', description: '5 consecutive, any suit' },
  { name: 'Three of a Kind', description: '3 cards of the same rank' },
  { name: 'Two Pair', description: '2 different pairs' },
  { name: 'Pair', description: '2 cards of the same rank' },
  { name: 'High Card', description: 'No combination; highest card wins' },
];

export const GAME_RULES: { label: string; text: string }[] = [
  {
    label: 'Match Structure',
    text: 'A match is best-of-3 — first to win 2 rounds wins. If a round ties (each player wins one row), the pot carries over, making the next round worth even more.',
  },
  {
    label: 'The Board',
    text: 'Each player has 2 rows: Frontline and Backline. Place cards to build poker hands (max 5 cards per row). You must win BOTH rows to win the round. You can see your opponent\'s board cards as they play them — use this to adapt your strategy in real time.',
  },
  {
    label: 'Turn Flow',
    text: 'Players alternate turns. On your turn: select a card, place it on a row, then bet or check. Continue until both players pass or run out of cards to play.',
  },
  {
    label: 'Your Hand',
    text: 'You start with 10 cards from a 54-card deck (36 number cards, 16 face cards, 2 jokers). Cards carry over between rounds — what you don\'t play now, you keep for later. At the start of each new round, both players draw 2 fresh cards from the deck.',
  },
  {
    label: 'Betting',
    text: 'After placing a card: Check (no bet), or Bet (add chips to the pot). If your opponent bets: Call (match it), Raise (increase it), or Fold (forfeit the round and all chips in the pot).',
  },
  {
    label: 'Passing',
    text: 'Fold at any time to end your participation in the current round. Your opponent can keep playing cards. Passing is strategic — conceding a small pot can preserve cards and chips for bigger rounds.',
  },
  {
    label: 'Chips & Economy',
    text: 'Start with 100 chips. Ante escalates each round: 10 → 15 → 20. Running out of chips loses the match. Kings inflict an extra 5-chip penalty per King when you win their row.',
  },
  {
    label: 'Graveyard & Weather',
    text: 'All board cards go to the graveyard between rounds. Aces send destroyed cards there too. Queens can revive cards from it. Jokers activate Weather, disabling all flushes for the round.',
  },
];

export const STRATEGY_TIPS: { label: string; text: string }[] = [
  {
    label: 'Balance Both Rows',
    text: 'You must win BOTH rows to win the round. A dominant Frontline means nothing if your Backline is empty. Spread your strength across both rows.',
  },
  {
    label: 'Conserve Cards',
    text: 'You draw 2 new cards each round, but that won\'t replace heavy spending. Playing 7+ cards in round 1 leaves you thin for later. Aim for 3-5 cards per round, adjusting based on stakes.',
  },
  {
    label: 'Know When to Fold',
    text: 'Folding isn\'t defeat — it\'s resource management. If your opponent has a strong board and the pot is small, folding saves cards and chips for a round you can win.',
  },
  {
    label: 'Read the Pot',
    text: 'Tied rounds carry the pot forward. Antes escalate (10 → 15 → 20), so later rounds start with bigger pots. Invest more effort when the pot is large — fold early when it\'s small.',
  },
  {
    label: 'Time Your Face Cards',
    text: 'Face cards can be played for their ability (exhausted — doesn\'t count in your poker hand) or as a high-value card (J=11, Q=12, K=13, A=14 — no ability). Use abilities when the timing is right; play as value when you need a strong poker hand.',
  },
  {
    label: 'Bluffing & Bet Sizing',
    text: 'Both players can see each other\'s board cards, but hand evaluations shift with every new card. A big bet can force a fold even if your board looks weak — your opponent doesn\'t know what you\'re holding. Small bets probe. But bluffing too often becomes predictable — and losing a big bluff is costly with escalating antes.',
  },
  {
    label: 'Watch the Graveyard',
    text: 'Cards destroyed by Aces and all board cards enter the graveyard between rounds. Queens revive the best card from it — plan Queen plays around what\'s available.',
  },
  {
    label: 'Round-by-Round Thinking',
    text: 'Round 1: Establish position, avoid over-investing. Round 2: Adapt based on round 1 results — the 2 fresh cards may open new combinations. Round 3: Go all-in with whatever you have — nothing to save for.',
  },
];
