import { Pile, Card, is_suit, is_rank, card, card_suit, card_rank } from '../types'

const suits = ['h', 'c', 'd', 's']
const ranks = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K']

export function uci_card(_card: string) {
  if (card.length === 2) {
    let suit = suits.indexOf(_card[1]) + 1,
      rank = ranks.indexOf(_card[0]) + 1

    if (is_suit(suit) && is_rank(rank)) {
      return card(suit, rank)
    }
  }
}

export function uci_pile(_pile: string) {
  let res = []
  for (let i = 0; i < _pile.length; i+=2) {
    let _card = _pile.slice(i, i + 2)
    let _res = uci_card(_card)
    if (_res) {
      res.push(_res)
    } else {
      return undefined
    }
  }
  return res
}


export function card_uci(card: Card) {
  let suit = card_suit(card),
    rank = card_rank(card)

  return ranks[rank - 1] + suits[suit - 1]
}

export function pile_uci(pile: Pile) {
  return pile.map(card_uci).join('')
}
