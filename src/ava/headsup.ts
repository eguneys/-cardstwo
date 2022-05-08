import test from 'ava'

import { HeadsUpGame, HeadsUpRoundPov, Action, HeadsUpRound, att, action_with_who, One, Two, Raise, Call, AllIn, Fold, Check } from '../headsup'
import { aww_who, aww_action_type, att_action_type, aww_ontop } from '../headsup'

const ontop_raise = (on_top: number) => att(Raise, on_top)

const scheduler = {
  schedule(fn: () => void, ms: number) {
    setTimeout(fn, 0)
  }
}

const on_winner = () => {}

test('no new action after allin call', t => {
  return new Promise(resolve => {

    let hu = HeadsUpGame.make(scheduler, on_new_action, on_new_round, on_winner, 1)

    let now = false

    hu.apply(action_with_who(One, att(Fold, 0)))



    function on_new_round() {
      if (now) { 
      
        on_winner()
        return
      }
      now = true
      t.truthy(hu.apply(action_with_who(Two, att(Call, 1))))
      t.truthy(hu.apply(action_with_who(One, att(AllIn, 97))))
      t.truthy(hu.apply(action_with_who(Two, att(Call, 97))))
    }

    function on_new_action() {}
    function on_winner() {
      if (!now) { return }
      t.truthy(hu.round.showdown)
      t.is(hu.round.preflop, hu.round.current_action)

      t.deepEqual(hu.round.current_action.allowed_actions, [])
      resolve()
    }
  })
})

test('reraise call next action', t => {
  return new Promise(resolve => {
    let hu = HeadsUpRound.make(scheduler, on_new_action, Two, 10, [100, 100])

    hu.maybe_add_action(action_with_who(One, att(Call, 10)))
    hu.maybe_add_action(action_with_who(Two, att(Check, 0)))

    function on_new_action() {
      if (hu.current_action === hu.flop) {
        t.truthy(hu.maybe_add_action(action_with_who(One, att(Raise, 20))))
        t.truthy(hu.maybe_add_action(action_with_who(Two, att(Raise, 20))))
        t.truthy(hu.maybe_add_action(action_with_who(One, att(Call, 20))))

        t.deepEqual(hu.allowed_actions, [])


        resolve()
      }
    }

  })

})

test('game new round', t => {
  return new Promise(resolve => {


    let res = HeadsUpGame.make(scheduler, on_new_action, on_new_round, on_winner, 1)
    function on_new_action() {
    }

    function on_new_round() {
      t.truthy(res.round.pov_of(1).preflop)
      t.truthy(HeadsUpRoundPov.from_fen(res.round.pov_of(1).fen).preflop)

      t.deepEqual(res.round.left_stacks, [97, 100])

      resolve()
    }

    res.apply(action_with_who(Two, att(AllIn, 99)))
    res.apply(action_with_who(One, att(Fold, 0)))

  })
})


test('check on flop', async t => {
  return new Promise(resolve => {
    let hu = HeadsUpRound.make(scheduler, on_new_action, Two, 10, [1000, 1000])

    hu.maybe_add_action(action_with_who(One, att(Raise, 40)))

    hu.maybe_add_action(action_with_who(Two, att(Call, 40)))

    t.is(hu.preflop, hu.current_action)

    function on_new_action() {
      t.is(hu.flop, hu.current_action)

      t.truthy(hu.maybe_add_action(action_with_who(One, att(Check, 0))))

      t.deepEqual(hu.allowed_actions.filter(_ => aww_action_type(_) !== Raise), [
        action_with_who(Two, att(Check, 0)),
        action_with_who(Two, att(AllIn, 940)),
        action_with_who(Two, att(Fold))
      ])
      resolve()
    }
  })
})


test('all in showdown', t => {
  return new Promise(resolve => {
    let hu = HeadsUpRound.make(scheduler, on_new_action, Two, 10, [100, 100])

    hu.maybe_add_action(action_with_who(One, att(AllIn, 90)))

    t.deepEqual(hu.allowed_actions, [
      action_with_who(Two, att(AllIn, 80)),
      action_with_who(Two, att(Fold))
    ])

    t.falsy(hu.maybe_add_action(action_with_who(Two, att(Call, 80))))

    hu.maybe_add_action(action_with_who(Two, att(AllIn, 80)))

    function on_new_action() {

      t.truthy(hu.showdown)
      t.truthy(hu.winner!.length > 0)
      t.truthy(hu.settled)

      t.deepEqual(hu.left_stacks, [200, 0])
      resolve()
    }
  })
})

test('fold on flop', t => {

  return new Promise(resolve => {
    let hu = HeadsUpRound.make(scheduler, on_new_action, Two, 10, [100, 100])

    hu.maybe_add_action(action_with_who(One, att(Call, 10)))
    hu.maybe_add_action(action_with_who(Two, att(Check, 0)))

    function on_new_action() {

      hu.maybe_add_action(action_with_who(One, att(Fold, 0)))
      t.deepEqual(hu.winner, [Two])
      t.deepEqual(hu.allowed_actions, [ ])
      resolve()
    }

  })
})

test('fold round', t => {

  function on_new_action() {}
  let hu = HeadsUpRound.make(scheduler, on_new_action, Two, 10, [100, 100])

  hu.maybe_add_action(action_with_who(One, att(Call, 10)))
  hu.maybe_add_action(action_with_who(Two, att(Fold)))

  t.deepEqual(hu.winner, [One])

  t.deepEqual(hu.allowed_actions, [ ])

})

test('on flop', t => {
  return new Promise(resolve => {
    let hu = HeadsUpRound.make(scheduler, on_new_action, Two, 10, [100, 100])

    hu.maybe_add_action(action_with_who(One, att(Call, 10)))
    hu.maybe_add_action(action_with_who(Two, att(Check)))

    function on_new_action() {
      t.is(hu.current_who, One)
      t.is(HeadsUpRoundPov.from_fen(hu.pov_of(One).fen).fen, hu.pov_of(One).fen)
      resolve()
    }
  })
})

test('fen', t => {
  function on_new_action() { } 
  let hu = HeadsUpRound.make(scheduler, on_new_action, Two, 10, [100, 100])

  // t.is(hu.pov_of(One).fen, '8s7s - - -;1;2;10;100 100;2/100 100/10/1.2.10 2.1.20/90 80;-;-;-;-')

  t.is(HeadsUpRoundPov.from_fen(hu.pov_of(One).fen).fen, hu.pov_of(One).fen)
})

test('fen showdown', t => {
  return new Promise(resolve => {
    let hu = HeadsUpRound.make(scheduler, on_new_action, Two, 10, [100, 100])

    hu.maybe_add_action(action_with_who(One, att(AllIn, 90)))
    hu.maybe_add_action(action_with_who(Two, att(AllIn, 80)))

    function on_new_action() {
      //t.is(hu.pov_of(One).fen, 'Th8d - - -;1;2;10;100 100;2/100 100/10/1.2.10 2.1.20 1.6.90 2.6.80/0 0;-;-;-;0 0/200/2/4dJsQs 5c As 1:Th8d,2:4sKd')

      t.is(HeadsUpRoundPov.from_fen(hu.pov_of(One).fen).fen, hu.pov_of(One).fen)
      resolve()
    }
  })

})

test('headsup', t => {
  return new Promise(resolve => {

    let hu = HeadsUpRound.make(scheduler, on_new_action, Two, 10, [100, 100])


    t.is(hu.current_action, hu.preflop)
    t.falsy(hu.settled)

    t.truthy(hu.maybe_add_action(action_with_who(One, att(Call, 10))))

    t.truthy(hu.maybe_add_action(action_with_who(Two, att(Check))))
    
    function on_new_action() {
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
      resolve()
    }
  })
})

test('fold', t => {

  let bb = Action.make_blinds(Two, [100, 100], 10)


  t.truthy(bb.maybe_add_action(action_with_who(One, att(Fold))))

  t.truthy(bb.settled)

  t.deepEqual(bb.winner, [Two])

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
