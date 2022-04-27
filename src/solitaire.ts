import { deck, Card, Pile, card, card_suit, card_rank } from './types'
import { solitaire_fen } from './format/fen'

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

  static make = (_deck: Pile) => {
    let piles = []
    for (let i = 0; i < 7; i++) {
      piles.push([
        _deck.splice(0, i) as Pile,
        _deck.splice(0, 1) as Pile] as [Pile, Pile])
    }

    let holes = [[], [], [], []]


    return new Solitaire(piles, holes)
  }

  get fen() {
    return solitaire_fen(this)
  }

  get clone() {
    let holes = this.holes.map(_ => _.slice(0))
    let piles = this.piles.map(_ =>
                               ([_[0].slice(0),
                                 _[1].slice(0)] as [Pile, Pile]))

    return new Solitaire(piles, holes)
  }

  back(index: number) {
    return this.piles[index][0]
  }

  front(index: number) {
    return this.piles[index][1]
  }

  constructor(readonly piles: Array<[Pile, Pile]>,
              readonly holes: Array<Pile>) {
  }

  _cut_pile_in(orig: SolIndex): [Pile, Card | undefined] | undefined {
    let [pindex, index] = sol_pile(orig)
    let [back, front] = this.piles[pindex]

    if (front[index]) {
      let reveal
      let stack = front.splice(index)
      if (front.length === 0 && back.length > 0) {
        reveal = back.pop()!
        front.push(reveal)
      }

      return [stack, reveal]
    }
  }


  _paste_pile_in(dest: SolIndex, pile: Pile) {
    let [pindex, index] = sol_pile(dest)
    let [back, front] = this.piles[pindex]

    front.push(...pile)
    return true
  }

  _cut_in(orig: SolIndex) {

    return this._cut_pile_in(orig)
  }

  _paste_in(dest: SolIndex, pile: Pile) {
    return this._paste_pile_in(dest, pile)
  }


  drop_in(orig: SolIndex, dest: SolIndex) {
    let pile_reveal = this._cut_in(orig)

    if (pile_reveal) {
      let [pile, reveal] = pile_reveal
      let ok = this._paste_in(dest, pile)

      if (ok) {
        return this
      }
    }
  }


  drop(orig: SolIndex, dest: SolIndex) {
    let { clone } = this
    return clone.drop_in(orig, dest)
  }
}
