import { card_suit, card_rank,  Pile, Card } from '../types'
import { Solitaire } from '../solitaire'
import { suits_uci, ranks_uci } from './uci'

export function card_fen(card: Card) {
  return ranks_uci[card_rank(card) - 1] +
    suits_uci[card_suit(card) - 1]
}

export function pile_fen(pile: Pile) {
  if (pile.length === 0) {
    return '-'
  }
  return pile.map(card_fen).join('')
}

export function solitaire_fen(solitaire: Solitaire) {

  let piles = solitaire.piles
  .map(_ => 
       [_[0].length, pile_fen(_[1])].join('/')).join(' ')

  let holes = solitaire.holes.map(pile_fen).join(' ')

  return [piles, holes].join(' ')
}
