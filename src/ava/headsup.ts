import test from 'ava'

import { HeadsUpRoundPov, Action, HeadsUpRound, att, action_with_who, One, Two, Raise, Call, AllIn, Fold, Check } from '../headsup'
import { aww_who, aww_action_type, att_action_type, att_on_top } from '../headsup'

const ontop_raise = (on_top: number) => att(Raise, on_top)

test('fen', t => {
  let hu = HeadsUpRound.make(Two, 10, [100, 100])

  t.is(hu.pov_of(One).fen, '8s7s - - -;1;2;10;100 100;2/100 100/10/1.2.10 2.1.20/90 80;-;-;-;-')

  t.is(HeadsUpRoundPov.from_fen(hu.pov_of(One).fen).fen, hu.pov_of(One).fen)
})

test('headsup', t => {

  let hu = HeadsUpRound.make(Two, 10, [100, 100])


  t.is(hu.current_action, hu.preflop)
  t.falsy(hu.settled)

  t.truthy(hu.maybe_add_action(action_with_who(One, att(Call, 10))))

  t.truthy(hu.maybe_add_action(action_with_who(Two, att(Check))))
  t.is(hu.current_action, hu.flop!)

  t.is(hu.pot, 40)

  t.deepEqual(hu.allowed_actions, [
    action_with_who(One, att(Check)),
    action_with_who(One, ontop_raise(20)),
    action_with_who(One, ontop_raise(60)),
    action_with_who(One, ontop_raise(40)),
    action_with_who(One, att(AllIn, 80)),
    action_with_who(One, att(Fold))
  ])

  t.truthy(hu.maybe_add_action(action_with_who(One, att(Check))))

})

test('fold', t => {

  let bb = Action.make_blinds(Two, [100, 100], 10)


  t.truthy(bb.maybe_add_action(action_with_who(One, att(Fold))))

  t.truthy(bb.settled_with_folds)
  t.truthy(bb.settled)

  t.is(bb.winner, Two)

})


test('action', t => {

  let bb = Action.make_blinds(Two, [100, 100], 10)

  t.is(bb.pot, 30)

  t.is(bb.current_who, One)

  t.falsy(bb.settled)

  t.falsy(bb.bb_act_initial)

  t.deepEqual(bb.allowed_actions, [
    action_with_who(One, att(Call, 10)),
    action_with_who(One, ontop_raise(10)),
    action_with_who(One, ontop_raise(20)),
    action_with_who(One, ontop_raise(40)),
    action_with_who(One, ontop_raise(35)),
    action_with_who(One, att(AllIn, 90)),
    action_with_who(One, att(Fold))
  ])

  t.truthy(bb.maybe_add_action(action_with_who(One, att(Call, 10))))

  t.is(bb.pot, 40)
  t.is(bb.current_who, Two)

  t.falsy(bb.settled)
  t.truthy(bb.bb_act_initial)


  t.deepEqual(bb.allowed_actions, [
    action_with_who(Two, att(Check)),
    action_with_who(Two, ontop_raise(20)),
    action_with_who(Two, ontop_raise(60)),
    action_with_who(Two, ontop_raise(40)),
    action_with_who(Two, att(AllIn, 80)),
    action_with_who(Two, att(Fold))
  ])
  


  t.truthy(bb.maybe_add_action(action_with_who(Two, att(Check))))

  t.truthy(bb.settled)

  t.falsy(bb.winner)

})
