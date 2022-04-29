export type Suit = 1 | 2 | 3 | 4
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13

export type Card = number

export type Pile = Array<Card>

export function card(suit: Suit, rank: Rank) {
  return suit * 20 + rank
}

export function card_suit(card: Card) {
  return Math.floor(card / 20)
}

export function card_rank(card: Card) {
  return card % 20
}

export function is_suit(_: number): _ is Suit {
  return 1 <= _ && _ <= 4
}

export function is_rank(_: number): _ is Rank {
  return 1 <= _ && _ <= 13
}

export const suits: Array<Suit> = [1, 2, 3, 4]
export const ranks: Array<Rank> = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]

export const _deck: Array<Card> = 
  suits.flatMap(suit =>
            ranks.map(rank =>
                      card(suit, rank)))
