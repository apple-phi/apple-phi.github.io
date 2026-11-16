export const tokenPattern = /^(?:[A-Za-z0-9_-]{21}[AQgw]|[0-9a-f]{64})$/

export function generateToken() {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')
}

const adjectives = [
  'Amber',
  'Silver',
  'Quiet',
  'Bright',
  'Cedar',
  'Blue',
  'Copper',
  'Swift',
  'Golden',
  'Gentle',
  'Green',
  'Misty',
  'Violet',
  'Calm',
  'Coral',
  'Crimson'
]
const animals = [
  'Heron',
  'Otter',
  'Finch',
  'Fox',
  'Owl',
  'Wren',
  'Lynx',
  'Lark',
  'Robin',
  'Badger',
  'Hare',
  'Panda',
  'Falcon',
  'Marten',
  'Crane',
  'Sparrow'
]

export function generateName(
  occupied: Iterable<string>,
  start = crypto.getRandomValues(new Uint32Array(1))[0]! % (adjectives.length * animals.length)
) {
  const taken = new Set(Array.from(occupied, (name) => name.toLowerCase()))
  for (let index = start; ; index++) {
    let remaining = Math.floor(index / animals.length)
    let name = animals[index % animals.length]!
    do {
      name = adjectives[remaining % adjectives.length]! + name
      remaining = Math.floor(remaining / adjectives.length) - 1
    } while (remaining >= 0)
    if (!taken.has(name.toLowerCase())) return name
  }
}
