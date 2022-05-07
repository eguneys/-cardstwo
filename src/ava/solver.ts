import test from 'ava'

import { hand_solve, HandValue, OnePair, HighCard } from '../solver'
import { fen_pile, pile_fen } from '../format/fen'


function comp(t: any, fen: string, exp: string, cat: HandValue) {
  let res = hand_solve(fen_pile(fen)!)
  t.is(res[0], cat)
  t.is(pile_fen(res[1]), exp)
}

test('one pair', t => {
  comp(t, `ThTc9h3s8s7sAc`, `ThTcAc9h8s7s3s`, OnePair)
})

test('high card', t => {
  comp(t, `Th9c8h3s4s7sAc`, `AcTh9c8h7s4s3s`, HighCard)
})
