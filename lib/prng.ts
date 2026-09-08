/**
 * Seeded pseudo random number generator.
 *
 * Every build must produce byte identical data. That means no Math.random, no
 * Date.now and no locale dependent formatting anywhere in generation. The whole
 * dataset is a pure function of the seed below.
 */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class Rng {
  private next: () => number

  constructor(seed: number) {
    this.next = mulberry32(seed)
  }

  /** Float in [0, 1). */
  unit(): number {
    return this.next()
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1))
  }

  /** Float in [min, max) rounded to a fixed number of decimals. */
  float(min: number, max: number, decimals = 2): number {
    const raw = min + this.next() * (max - min)
    const f = Math.pow(10, decimals)
    return Math.round(raw * f) / f
  }

  bool(probabilityTrue = 0.5): boolean {
    return this.next() < probabilityTrue
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)]
  }

  /** Pick by relative weight. Weights need not sum to one. */
  weighted<T>(items: readonly { value: T; weight: number }[]): T {
    const total = items.reduce((sum, i) => sum + i.weight, 0)
    let roll = this.next() * total
    for (const item of items) {
      roll -= item.weight
      if (roll < 0) return item.value
    }
    return items[items.length - 1].value
  }

  /** Fisher Yates on a copy. Never mutates the input. */
  shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice()
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1))
      ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
  }

  /** n distinct members of items, in shuffled order. */
  sample<T>(items: readonly T[], n: number): T[] {
    return this.shuffle(items).slice(0, n)
  }

  /** Roughly normal via the mean of four draws, clamped to the range. */
  normal(min: number, max: number, decimals = 2): number {
    const avg = (this.next() + this.next() + this.next() + this.next()) / 4
    const f = Math.pow(10, decimals)
    return Math.round((min + avg * (max - min)) * f) / f
  }
}
