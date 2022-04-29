import { Card } from './types'

export type Middle = {
  hands: Array<[Card, Card]>,
  flop: [Card, Card, Card],
  turn: Card,
  river: Card
}

export type Chips = number

export type ActionType = number

/* ActionTypes */
export const BigBlind = 1
export const SmallBlind = 2
export const Check = 3
export const Call = 4
export const Fold = 5
export const AllIn = 6
export const Raise = 7

export function ontop_raise(on_top: number) {
  return 7 + on_top
}

export function raise_ontop(raise: number) {
  return raise - 7
}

export type WhoHasAction = 1 | 2

export const One: WhoHasAction = 1
export const Two: WhoHasAction = 2

export function who_next(who: WhoHasAction) {
  return who === 1 ? 2 : 1
}

export type ActionWithWho = number

export function action_with_who(who: WhoHasAction, type: ActionType) { return who * 1000000 + type
}
export function aww_who(aww: ActionWithWho) {
  return Math.floor(aww / 1000000) as WhoHasAction
}
export function aww_action_type(aww: ActionWithWho) {
  return aww % 1000000 as ActionType
}

export interface HasLeftStacks {
  left_stacks: [Chips, Chips]
}

export const whos: Array<WhoHasAction> = [1, 2]

export class Action implements HasLeftStacks {

  actions: Array<ActionWithWho> = []

  constructor(readonly who: WhoHasAction,
              readonly stacks: [Chips, Chips],
              readonly small_blind: Chips,
              readonly post_blinds: boolean = false) {
    this.left_stacks = stacks.slice(0) as [Chips, Chips]

    if (this.post_blinds) {
      this.actions.push(action_with_who(who, SmallBlind))
      this.actions.push(action_with_who(who_next(who), BigBlind))
      this.left_stacks[who - 1] -= small_blind
      this.left_stacks[who_next(who) - 1] -= small_blind * 2
    }
  }

  get pot() {
    return whos.map(_ => this.bets_of(_)).reduce((a, _) => _ + a)
  }

  get last() {
    return this.actions[this.actions.length - 1]
  }

  get current_who() {
    return who_next(aww_who(this.last))
  }

  get allowed_actions(): Array<ActionWithWho> {
    let current_bets = this.bets_of(this.current_who)
    let other_bets = this.bets_of(who_next(this.current_who))

    let diff = current_bets - other_bets

    if (diff < 0) {
      let left = this.left_stacks[this.current_who - 1]
      let call = -diff
      let raise = call * 2,
        three_bet = call * 3,
        five_bet = call * 5,
        half_stack = left / 2

      if (left < call) {
        return [action_with_who(this.current_who, AllIn)]
      }
      let raises = [raise, three_bet, five_bet]
      .filter(_ => _ < left)
      .map(_ => action_with_who(this.current_who, ontop_raise(_ + diff)))

      if (half_stack > call) {
        raises.push(action_with_who(this.current_who, ontop_raise(half_stack + diff)))
      }

      return [
        action_with_who(this.current_who, Call),
        ...raises,
        action_with_who(this.current_who, AllIn),
        action_with_who(this.current_who, Fold)
      ]
    }
    return []
  }

  get settled() {
    // TODO
    return false
  }

  get settled_round_with_folds() {
    // TODO
    return false
  }

  readonly left_stacks: [Chips, Chips]

  maybe_add_action(aww: ActionWithWho) {
    let who = aww_who(aww)
    if (this.allowed_actions.includes(aww)) {
      let current_bets = this.bets_of(who)
      let other_bets = this.bets_of(who_next(who))

      let diff = current_bets - other_bets
      let left = this.left_stacks[who - 1]


      let action_type = aww_action_type(aww)

      let cost = 0

      if (action_type === Call) {
        cost = -diff
      } else if (action_type === AllIn) {
        cost = left
      } else if (action_type > Raise) {
        let ontop = raise_ontop(action_type)

        cost = ontop - diff
      }

      this.left_stacks[who - 1] -= cost
      this.actions.push(aww)
      return true
    }
    return false
  }


  bets_of(who: WhoHasAction) {
    return this.stacks[who - 1] - this.left_stacks[who - 1]
  }
}

export class Showdown implements HasLeftStacks {

  readonly left_stacks: [Chips, Chips]

  constructor(stacks: [Chips, Chips]) {
    // TODO
    this.left_stacks = stacks.slice(0) as [Chips, Chips]
  }
}

export class HeadsUpRound implements HasLeftStacks{

  get current_action() {
    return this.river ?? this.turn ?? this.flop ?? this.preflop
  }

  showdown?: Showdown

  get left_stacks() {
    return this.showdown?.left_stacks ?? this.current_action.left_stacks
  }

  get settled() {
    return !!this.showdown || !!this.river?.settled
  }

  constructor(readonly middle: Middle,
              readonly blinds: Chips,
              readonly stacks: [Chips, Chips],
              readonly preflop: Action,
              readonly flop?: Action,
              readonly turn?: Action,
              readonly river?: Action) {}
}
