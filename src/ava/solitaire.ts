import test from 'ava';
import { Solitaire, SolIndex, waste_sol, hole_sol, pile_sol, 
  sol_pile,
  sol_hole,

  is_hole_index,
  is_pile_index } from '../solitaire'

import { uci_pile, pile_uci } from '../format/uci'


test('SolIndex', t => {

  let w = waste_sol

  t.falsy(is_hole_index(w))
  t.falsy(is_pile_index(w))

  for (let i = 0; i < 4; i++) {

    let h = hole_sol(i)

    t.is(sol_hole(h), i)

    t.truthy(is_hole_index(h))
    t.falsy(is_pile_index(h))
  }

  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 20; j++) {
      let p = pile_sol(i, j)

      t.deepEqual(sol_pile(p), [i, j])

      t.truthy(is_pile_index(p))
      t.falsy(is_hole_index(p))
    }
  }
})


let _soli = new Solitaire([
  [uci_pile(``)!, uci_pile(``)!],
  [uci_pile(``)!, uci_pile(`Ac`)!],
  [uci_pile(`Ah`)!, uci_pile(`Ac2c`)!],
  [uci_pile(`Ah2h`)!, uci_pile(`Ac2c3c`)!],
  [uci_pile(`Ah2h3h`)!, uci_pile(`Ac2c3c4c`)!],
  [uci_pile(``)!, uci_pile(``)!],
  [uci_pile(``)!, uci_pile(``)!]], [[],[],[],[]])


test('drop pile to pile', t => {

  let soli = _soli

  let res = soli.drop(pile_sol(4, 1), pile_sol(1, 0))!

  t.truthy(res)
  t.is(pile_uci(res.front(4)), `Ac`)
  t.is(pile_uci(res.front(1)), `Ac2c3c4c`)

})

test('reveal drop pile to pile', t => {

  let soli = _soli

  let res = soli.drop(pile_sol(4, 0), pile_sol(1, 0))!

  t.truthy(res)
  t.is(pile_uci(res.back(4)), `Ah2h`)
  t.is(pile_uci(res.front(4)), `3h`)
  t.is(pile_uci(res.front(1)), `AcAc2c3c4c`)
})
