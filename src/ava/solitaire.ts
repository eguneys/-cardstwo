import test from 'ava';
import { SolIndex, waste_sol, hole_sol, pile_sol, 

  sol_pile,
  sol_hole,

  is_hole_index,
  is_pile_index } from '../solitaire'


test('SolIndex', t => {

  let w = waste_sol

  t.falsy(is_hole_index(w))
  t.falsy(is_pile_index(w))

})
