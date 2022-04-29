import test from 'ava'

import { Action, HeadsUpRound, action_with_who, One, Two, ontop_raise, Call, AllIn, Fold, Check } from '../headsup'


test('headsup', t => {

  let hu = HeadsUpRound.make(Two, 10, [100, 100])


  t.is(hu.current_action, hu.preflop)
  t.falsy(hu.settled)

  t.truthy(hu.maybe_add_action(action_with_who(One, Call)))
  t.truthy(hu.maybe_add_action(action_with_who(Two, Check)))
  t.is(hu.current_action, hu.flop!)

  t.is(hu.pot, 40)

  t.deepEqual(hu.allowed_actions, [
    action_with_who(One, Check),
    action_with_who(One, ontop_raise(20)),
    action_with_who(One, ontop_raise(60)),
    action_with_who(One, ontop_raise(40)),
    action_with_who(One, AllIn),
    action_with_who(One, Fold)
  ])

  t.truthy(hu.maybe_add_action(action_with_who(One, Check)))

})

test('fold', t => {

  let bb = new Action(Two,
                      [100, 100],
  10,
  true)


  t.truthy(bb.maybe_add_action(action_with_who(One, Fold)))

  t.truthy(bb.settled_with_folds)
  t.truthy(bb.settled)

  t.is(bb.winner, Two)

})


test('action', t => {

  let bb = new Action(Two,
                      [100, 100],
  10,
  true)

  t.is(bb.pot, 30)

  t.is(bb.current_who, One)

  t.falsy(bb.settled)

  t.falsy(bb.bb_act_initial)

  t.deepEqual(bb.allowed_actions, [
    action_with_who(One, Call),
    action_with_who(One, ontop_raise(10)),
    action_with_who(One, ontop_raise(20)),
    action_with_who(One, ontop_raise(40)),
    action_with_who(One, ontop_raise(35)),
    action_with_who(One, AllIn),
    action_with_who(One, Fold)
  ])

  t.truthy(bb.maybe_add_action(action_with_who(One, Call)))

  t.is(bb.pot, 40)
  t.is(bb.current_who, Two)

  t.falsy(bb.settled)
  t.truthy(bb.bb_act_initial)


  t.deepEqual(bb.allowed_actions, [
    action_with_who(Two, Check),
    action_with_who(Two, ontop_raise(20)),
    action_with_who(Two, ontop_raise(60)),
    action_with_who(Two, ontop_raise(40)),
    action_with_who(Two, AllIn),
    action_with_who(Two, Fold)
  ])
  


  t.truthy(bb.maybe_add_action(action_with_who(Two, Check)))

  t.truthy(bb.settled)

  t.falsy(bb.winner)

})
