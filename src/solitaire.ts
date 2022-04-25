import { deck, Card, card, card_suit, card_rank } from './types'

export type Pile = Array<Card>

export type SolIndex = number

export const waste_sol: SolIndex = 1

export function hole_sol(hole: number): SolIndex {
 return (hole + 1) * 100
}

export function pile_sol(pile: number, index: number): SolIndex {
  return 500 + pile * 100 + index
}

export function sol_pile(sol: SolIndex): [number, number] {
  let res = sol - 500
  return [Math.floor(res / 100), res % 100]
}

export function sol_hole(sol: SolIndex): number {
  return Math.floor(sol / 100) - 1
}

export function is_hole_index(sol: SolIndex): boolean {

  return 100 <= sol && sol <= 400
}

export function is_pile_index(sol: SolIndex): boolean {
  return 500 <= sol && sol <= 1250
}


export class Solitaire {

  static make = () => {
    let _deck: Array<Card> = deck.slice(0)

    let piles = []
    for (let i = 0; i < 7; i++) {
      piles.push([
        _deck.splice(0, i) as Pile,
        _deck.splice(0, 1) as Pile] as [Pile, Pile])
    }

    let holes = [[], [], [], []]


    return new Solitaire(piles, holes)
  }

  get clone() {
    let holes = this.holes.map(_ => _.slice(0))
    let piles = this.piles.map(_ =>
                               ([_[0].slice(0),
                                 _[1].slice(0)] as [Pile, Pile]))

    return new Solitaire(piles, holes)
  }

  constructor(readonly piles: Array<[Pile, Pile]>,
              readonly holes: Array<Pile>) {
  }

  _cut_in(orig: SolIndex): [Pile, Card | undefined] | undefined {
    return undefined
    /*
    let pindex = sol_index_p(orig)

    let [back, front] = this.piles[pindex]

    if (front[pindex]) {
      let reveal
      let stack = front.splice(pindex, front.length - 1)
      if (front.length === 0 && back.length > 0) {
        reveal = back.pop()!
        front.push(reveal)
      }

      return [stack, reveal]
    }
    */
  }


  _paste_in(dest: SolIndex, pile: Pile) {
    return false
  }

  drop(orig: SolIndex, dest: SolIndex) {
    let s2 = this.clone
    let pile_reveal = s2._cut_in(orig)

    if (pile_reveal) {
      let [pile, reveal] = pile_reveal
      let ok = s2._paste_in(dest, pile)

      if (ok) {
        return s2
      }
    }
  }
}
