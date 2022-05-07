import { ranks, card_rank, card_suit, Card, Rank } from './types'

export type Hand = Array<Card>

export function rank_value(rank: Rank) {
  return rank === 1 ? 14 : rank
}

export function card_sort(a: Card, b: Card) {
  return rank_value(card_rank(b)) - rank_value(card_rank(a))
}

export function cards_of_rank(hand: Hand, rank: Rank) {
  return hand.filter(_ => card_rank(_) === rank)
}

export function high_card_sorted(hand: Hand) {
  let sorted = hand.sort(card_sort)
  return sorted
}

export function one_pair_sorted(hand: Hand) {
  let sorted = hand.sort(card_sort)

  const paired = ranks
  .map(rank => cards_of_rank(sorted, rank))
  .find(_ => _.length === 2)

  if (paired) {
    return [...paired, ...sorted.filter(_ => !paired.includes(_))]
  }
}

export type HandValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export const HighCard: HandValue = 1
export const OnePair: HandValue = 2

export function hand_solve(hand: Hand): [HandValue, Hand] {
  let res: Hand

  res = one_pair_sorted(hand)!
  if (res) {
    return [OnePair, res]
  }

  res = high_card_sorted(hand)
  return [HighCard, res]
}
