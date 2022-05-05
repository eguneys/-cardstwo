import { Card, _deck } from './types'
import { fen_headsup_round_pov, headsup_round_pov_fen } from './format/fen'

export type Middle = {
  hands: Array<[Card, Card]>,
  flop: [Card, Card, Card],
  turn: Card,
  river: Card
}

export function middle(_whos: Array<WhoHasAction>, deck: Array<Card>): Middle {

  let river = deck.pop()!
  let turn = deck.pop()!
  let flop = [deck.pop()!, deck.pop()!, deck.pop()!] as [Card, Card, Card]
  let hands = _whos.map(_ => [deck.pop()!, deck.pop()!] as [Card, Card])

  return {
    hands,
    flop,
    turn,
    river
  }
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

export type ActionTypeOnTop = number

const type_mask =  0xff00000
const ontop_mask = 0x00fffff

export function att(type: number, on_top: number = 0) {
  return (type << 20) | on_top as ActionTypeOnTop
}

export function att_action_type(att: ActionTypeOnTop) {
  return (att & type_mask) >> 20 as ActionType
}

export function att_on_top(att: ActionTypeOnTop) {
  return (att & ontop_mask) as number
}

export type WhoHasAction = 1 | 2

export const One: WhoHasAction = 1
export const Two: WhoHasAction = 2

export function who_next(who: WhoHasAction) {
  return who === 1 ? 2 : 1 as WhoHasAction
}

export type ActionWithWho = number

const aww_type_mask =  0x0fffffff
const who_mask =   0xf0000000
export function action_with_who(who: WhoHasAction, type: ActionType) { 
  return (who << 28 | type) as ActionWithWho
}
export function aww_who(aww: ActionWithWho) {
  return (aww & who_mask) >> 28 as WhoHasAction
}
export function aww_att(aww: ActionWithWho) {
  return (aww & aww_type_mask) as ActionType
}

export function aww_action_type(aww: ActionWithWho) {
  return att_action_type(aww_att(aww))
}

export function aww_ontop(aww: ActionWithWho) {
  return att_on_top(aww_att(aww))
}

export interface HasLeftStacks {
  left_stacks: [Chips, Chips]
}

export interface MightHaveWinner {
  winner?: WhoHasAction
}

export const whos: Array<WhoHasAction> = [1, 2]

export class Action implements HasLeftStacks, MightHaveWinner {


  static make_turn = (button: WhoHasAction,
                      stacks: [Chips, Chips],
  small_blind: Chips) => {
    let actions: Array<ActionWithWho> = []
    let left_stacks = stacks.slice(0) as [Chips, Chips]

    return new Action(button,
                      stacks,
                      small_blind,
                      actions, left_stacks)

  }

  static make_blinds = (button: WhoHasAction,
                        stacks: [Chips, Chips],
  small_blind: Chips) => {

    let actions: Array<ActionWithWho> = []
    let left_stacks: [Chips, Chips] = stacks.slice(0) as [Chips, Chips]

    let who_sb = who_next(button),
      who_bb = who_next(who_sb)

    let big_blind = small_blind * 2

    actions.push(action_with_who(who_sb, att(SmallBlind, small_blind)))
    actions.push(action_with_who(who_bb, att(BigBlind, big_blind)))


    left_stacks[who_sb - 1] -= small_blind
    left_stacks[who_bb - 1] -= big_blind

    return new Action(button,
                     stacks,
                     small_blind,
                     actions,
                     left_stacks)
  }

  constructor(readonly button: WhoHasAction,
              readonly stacks: [Chips, Chips],
              readonly small_blind: Chips,
              readonly actions: Array<ActionWithWho>,
              readonly left_stacks: [Chips, Chips]) {}

  get who_sb() {
    return who_next(this.button)
  }

  get who_bb() {
    return who_next(this.who_sb)
  }

  get winner() {
    if (this.settled_with_folds) {
      return who_next(aww_who(this.who_has_folded[0]))
    }
  }

  get big_blind() {
    return this.small_blind * 2
  }

  get bb_who() {
    return who_next(this.who_sb)
  }

  get bb_act_initial() {
    return (this.current_who === this.bb_who) &&
      this.actions.filter(_ => aww_who(_) === this.bb_who).length === 1
  }

  get post_blinds() {
    return !!this.actions.find(_ => aww_action_type(_) === BigBlind)
  }

  get turn_act_initial() {
    return !this.post_blinds && this.actions.length === 0
  }

  get pot() {
    return whos.map(_ => this.bets_of(_)).reduce((a, _) => _ + a)
  }

  get last() {
    return this.actions[this.actions.length - 1]
  }

  get current_who() {
    if (this.turn_act_initial) {
      return this.who_sb
    } else {
      return who_next(aww_who(this.last))
    }
  }

  get allowed_actions(): Array<ActionWithWho> {
    let current_bets = this.bets_of(this.current_who)
    let other_bets = this.bets_of(who_next(this.current_who))

    let diff = current_bets - other_bets

    let left = this.left_stacks[this.current_who - 1]

    if (diff === 0 && (this.bb_act_initial || this.turn_act_initial)) {

      let raise = this.big_blind,
        three_bet = raise * 3,
        five_bet = raise * 5,
        half_stack = left / 2

      let raises = [raise, three_bet, five_bet, half_stack]
      .filter(_ => _ < left)
      .map(_ => action_with_who(this.current_who,
                                att(Raise, _)))

      return [
        action_with_who(this.current_who, att(Check)),
        ...raises,
        action_with_who(this.current_who, att(AllIn, left)),
        action_with_who(this.current_who, att(Fold))
      ]
    } else if (diff < 0) {
      let call = -diff
      let raise = call * 2,
        three_bet = call * 3,
        five_bet = call * 5,
        half_stack = left / 2

      if (left <= call) {
        return [
          action_with_who(this.current_who, att(AllIn, left)),
          action_with_who(this.current_who, att(Fold))
        ]
      }
      let raises = [raise, three_bet, five_bet]
      .filter(_ => _ < left)
      .map(_ => action_with_who(this.current_who, att(Raise, _ + diff)))

      if (half_stack > call) {
        raises.push(action_with_who(this.current_who, att(Raise, half_stack + diff)))
      }

      return [
        action_with_who(this.current_who, att(Call, call)),
        ...raises,
        action_with_who(this.current_who, att(AllIn, left)),
        action_with_who(this.current_who, att(Fold))
      ]
    }
    return []
  }

  get settled() {
    let bets = whos.map(_ => this.bets_of(_))
    let bets_ok = bets.every(_ => _ === bets[0])

    if (this.settled_with_allins) {
      return true
    } else if (this.settled_with_folds) {
      return true
    } else if (this.bb_act_initial) {
      return false
    } else {
      return bets_ok
    }
  }

  get who_has_folded() {
    return this.actions.filter(_ => aww_action_type(_) === Fold)
  }

  get who_has_allin() {
    return this.actions.filter(_ => aww_action_type(_) === AllIn)
  }

  get settled_with_folds() {
    return this.who_has_folded.length === 1
  }

  get settled_with_allins() {
    return this.who_has_allin.length === 2
  }

  maybe_add_action(aww: ActionWithWho) {
    let who = aww_who(aww)
    if (this.allowed_actions.includes(aww)) {
      let current_bets = this.bets_of(who)
      let other_bets = this.bets_of(who_next(who))

      let diff = current_bets - other_bets
      let left = this.left_stacks[who - 1]


      let _att = aww_att(aww)

      let cost = 0

      let action_type = att_action_type(_att)

      if (action_type === Call) {
        cost = -diff
      } else if (action_type === AllIn) {
        cost = left
      } else if (action_type === Raise) {
        let ontop = att_on_top(_att)

        cost = ontop - diff
      }

      _att = att(action_type, cost)
      aww = action_with_who(who, _att)

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

export class Showdown implements HasLeftStacks, MightHaveWinner {

  readonly left_stacks: [Chips, Chips]

  constructor(readonly stacks: [Chips, Chips],
              readonly pot: Chips) {
    // TODO
    this.left_stacks = stacks.slice(0) as [Chips, Chips]
  }

  get winner() {
    return One
  }
}

export class HeadsUpRound implements HasLeftStacks, MightHaveWinner {

  static make = (
    button: WhoHasAction,
    small_blind: Chips,
    stacks: [Chips, Chips]) => {

    let deck = _deck.slice(0)
    let _middle = middle(whos, deck)
    let preflop = Action.make_blinds(button,
                            stacks,
                            small_blind)

    return new HeadsUpRound(button,
                            _middle,
                            small_blind,
                            stacks,
                            preflop)
  }


  get current_who() {
    return this.current_action.current_who
  }

  get current_action() {
    return this.river ?? this.turn ?? this.flop ?? this.preflop
  }


  get left_stacks() {
    return this.showdown?.left_stacks ?? this.current_action.left_stacks
  }

  get settled() {
    return !!this.showdown || !!this.river?.settled
  }

  get winner() {
    return this.showdown?.winner ?? this.current_action.winner
  }

  showdown?: Showdown
  flop?: Action
  turn?: Action
  river?: Action



  get allowed_actions() {
    return this.current_action.allowed_actions
  }

  get povs() {
    return whos.map(who => new HeadsUpRoundPov(
      who,
      {
        hand: this.middle.hands[who - 1],
        flop: this.flop ? this.middle.flop : undefined,
        turn: this.turn ? this.middle.turn : undefined,
        river: this.river ? this.middle.river : undefined
      },
      this.button,
      this.small_blind,
      this.stacks,
      this.preflop,
      this.flop,
      this.turn,
      this.river,
      this.showdown
    ))
  }

  pov_of(who: WhoHasAction) {
    return this.povs[who - 1]
  }

  constructor(
    readonly button: WhoHasAction,
    readonly middle: Middle,
    readonly small_blind: Chips,
    readonly stacks: [Chips, Chips],
    readonly preflop: Action,
    flop?: Action,
    turn?: Action,
    river?: Action) {
      this.flop = flop
      this.turn = turn
      this.river = river
    }

  get who_sb() {
    return who_next(this.button)
  }

  get who_bb() {
    return who_next(this.who_sb)
  }

  get pot() {
    return this.preflop.pot + 
      (this.flop?.pot || 0) +
      (this.turn?.pot || 0) +
      (this.river?.pot || 0)
  }

  maybe_add_action(aww: ActionWithWho) {
    if (this.current_action.maybe_add_action(aww)) {
      if (this.current_action.winner) {
      } else if (this.current_action.settled) {
        if (this.current_action.settled_with_allins) {
          this.showdown = new Showdown(this.current_action.left_stacks, this.pot)
        } else if (!!this.river) {
          this.showdown = new Showdown(this.river.left_stacks, this.pot)
        } else if (!!this.turn) {
          this.river = Action.make_turn(this.button, this.turn.left_stacks, this.small_blind)

        } else if (!!this.flop) {
          this.turn = Action.make_turn(this.button, this.flop.left_stacks, this.small_blind)
        } else {
          this.flop = Action.make_turn(this.button, this.preflop.left_stacks, this.small_blind)
        }
      }
      return true
    }
  }

}

export type MiddlePov = {
  hand: [Card, Card],
  flop?: [Card, Card, Card],
  turn?: Card,
  river?: Card
}

export class HeadsUpRoundPov {

  static from_fen = (fen: string) => {
    return fen_headsup_round_pov(fen)
  }

  get fen() {
    return headsup_round_pov_fen(this)
  }
  
  constructor(
    readonly who: WhoHasAction,
    readonly middle: MiddlePov,
    readonly button: WhoHasAction,
    readonly small_blind: Chips,
    readonly stacks: [Chips, Chips],
    readonly preflop: Action,
    readonly flop?: Action,
    readonly turn?: Action,
    readonly river?: Action,
    readonly showdown?: Showdown) { }

    get current_who() {
      return this.current_action.current_who
    }

    get current_action() {
      return this.river ?? this.turn ?? this.flop ?? this.preflop
    }

    get left_stacks() {
      return this.showdown?.left_stacks ?? this.current_action.left_stacks
    }

    get settled() {
      return !!this.showdown || !!this.river?.settled
    }

    get winner() {
      return this.showdown?.winner ?? this.current_action.winner
    }

    get allowed_actions() {
      return this.current_action.allowed_actions
    }

    get who_sb() {
      return who_next(this.button)
    }

    get who_bb() {
      return who_next(this.who_sb)
    }

    get pot() {
      return this.preflop.pot + 
        (this.flop?.pot || 0) +
        (this.turn?.pot || 0) +
        (this.river?.pot || 0)
    }
}

export type Timestamp = number

export interface Scheduler {
  schedule(fn: () => void, ms: number): void;
}

export type OnHandler = () => void;

export class HeadsUpGame {


  static make = (scheduler: Scheduler,
                 on_new_round: OnHandler,
                 small_blind: Chips) => {

    let stacks = whos
    .map(_ => 100 * small_blind) as [Chips, Chips]

    let fold_after = Date.now() + 35000
    let turn = 1
    let round = HeadsUpRound.make(
      ((turn + 1) % 2) + 1 as WhoHasAction,
      small_blind,
      stacks)

      return new HeadsUpGame(scheduler,
                             on_new_round,
                             small_blind,
                             stacks,
                             fold_after,
                             turn,
                             round)
  }


  round: HeadsUpRound
  turn: number
  fold_after: Timestamp

  get button() {
    return ((this.turn + 1) % 2) + 1 as WhoHasAction
  }

  constructor(
    readonly scheduler: Scheduler,
    readonly on_new_round: OnHandler,
    readonly small_blind: Chips,
    readonly stacks: [Chips, Chips],
    fold_after: Timestamp,
    turn: number,
    round: HeadsUpRound) {
      this.fold_after = fold_after
      this.turn = turn
      this.round = round
  }


  apply(aww: ActionWithWho) {
    if (this.round) {
      let res = this.round.maybe_add_action(aww)
      
      if (res) {
        this.fold_after = Date.now() + 35000
        if (this.round.winner) {
          this.schedule_new_round()
        }
      }
    }
  }

  new_round_now = () => {
    this.turn++;
    this.round = HeadsUpRound.make(
      this.button,
      this.small_blind,
      this.round.left_stacks)

    this.on_new_round()
  }

  schedule_new_round() {
    this.scheduler.schedule(this.new_round_now, 5000)
  }
}
