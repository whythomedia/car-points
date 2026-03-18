export type Riddle = {
  question: string
  answers: string[]
  hint: string
}

export const RIDDLES: Riddle[] = [
  {
    question: "I have cities but no houses, mountains but no trees, water but no fish. What am I?",
    answers: ["a map", "map"],
    hint: "You might be staring at one right now.",
  },
  {
    question: "The more you take, the more you leave behind. What am I?",
    answers: ["footsteps", "steps", "a footstep"],
    hint: "Think about walking.",
  },
  {
    question: "What has to be broken before you can use it?",
    answers: ["an egg", "egg"],
    hint: "Think about breakfast.",
  },
  {
    question: "I'm light as a feather, but even the strongest person can't hold me for more than a few minutes. What am I?",
    answers: ["breath", "your breath"],
    hint: "You're doing it right now.",
  },
  {
    question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
    answers: ["an echo", "echo"],
    hint: "Yell into a canyon.",
  },
  {
    question: "What runs but never walks, has a mouth but never talks, has a head but never weeps?",
    answers: ["a river", "river"],
    hint: "You might cross one on this trip.",
  },
  {
    question: "The more you take away, the bigger I get. What am I?",
    answers: ["a hole", "hole"],
    hint: "Dig deeper.",
  },
  {
    question: "I'm always in front of you but can never be seen. What am I?",
    answers: ["the future", "future"],
    hint: "Not the past, not the present...",
  },
  {
    question: "What has one eye but can't see?",
    answers: ["a needle", "needle"],
    hint: "Used for sewing.",
  },
  {
    question: "What gets wetter the more it dries?",
    answers: ["a towel", "towel"],
    hint: "You used one this morning.",
  },
  {
    question: "You see me once in June, twice in November, and not at all in May. What am I?",
    answers: ["the letter e", "e", "letter e"],
    hint: "Look at the words themselves.",
  },
  {
    question: "I have a head and a tail, but no body. What am I?",
    answers: ["a coin", "coin"],
    hint: "It's in your pocket.",
  },
  {
    question: "What comes once in a minute, twice in a moment, but never in a thousand years?",
    answers: ["the letter m", "m", "letter m"],
    hint: "Look at the words.",
  },
  {
    question: "I go around all the places but never move. What am I?",
    answers: ["a road", "road", "a street", "street"],
    hint: "You're on one right now.",
  },
  {
    question: "What can you catch but not throw?",
    answers: ["a cold", "cold"],
    hint: "Achoo!",
  },
  {
    question: "What has four wheels and flies?",
    answers: ["a garbage truck", "garbage truck", "a trash truck", "trash truck"],
    hint: "Not what you're thinking.",
  },
  {
    question: "I'm tall when I'm young and short when I'm old. What am I?",
    answers: ["a candle", "candle"],
    hint: "Make a wish.",
  },
  {
    question: "What has keys but no locks, space but no room?",
    answers: ["a keyboard", "keyboard"],
    hint: "You might be typing on one someday.",
  },
  {
    question: "I have hands but I can't clap. What am I?",
    answers: ["a clock", "clock", "a watch", "watch"],
    hint: "Tick tock.",
  },
  {
    question: "What is so fragile that saying its name breaks it?",
    answers: ["silence", "the silence"],
    hint: "Shhh...",
  },
]

export function getTodayRiddle(): Riddle {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000)
  return RIDDLES[dayOfYear % RIDDLES.length]
}
