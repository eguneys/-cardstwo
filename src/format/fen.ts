import { card_suit, card_rank,  Pile, Card } from '../types'
import { Solitaire } from '../solitaire'
import { suits_uci, ranks_uci, uci_card, uci_pile } from './uci'

import { Chips, WhoHasAction, ActionType, action_with_who, aww_who, aww_action_type, ActionWithWho, HeadsUpRoundPov, Action, Showdown } from '../headsup'
import { aww_att, att, att_action_type, att_on_top } from '../headsup'

export function card_fen(card: Card) {
  return ranks_uci[card_rank(card) - 1] +
    suits_uci[card_suit(card) - 1]
}

export function pile_fen(pile: Pile) {
  if (pile.length === 0) {
    return '-'
  }
  return pile.map(card_fen).join('')
}

export function bool_fen(bool: boolean) {
  return bool ? '+' : '-'
}

function maybe<A>(_: A | undefined, fn: (_: A) => string) {
  if (_) {
    return fn(_)
  } else {
    return '-'
  }
}

export function showdown_fen(showdown: Showdown) {

  let { stacks, pot } = showdown

  let _stacks = stacks.join(' '),
    _pot = pot

  return [_stacks, _pot].join('/')

}

export function aww_fen(aww: ActionWithWho) {
  let _att = aww_att(aww)
  return [aww_who(aww), att_action_type(_att), att_on_top(_att)].join('.')
}

export function action_fen(action: Action) {

  let { button, stacks, small_blind, actions, left_stacks } = action

  let _button = button
  let _stacks = stacks.join(' ')
  let _small_blind = small_blind
  let _actions = actions.map(aww_fen).join(' ')
  let _left_stacks = left_stacks.join(' ')

  return [_button,
    _stacks,
    _small_blind,
    _actions,
    _left_stacks
  ].join('/')
}

export function headsup_round_pov_fen(pov: HeadsUpRoundPov) {


  let { who, middle, button, small_blind, stacks, preflop, flop, turn, river, showdown } = pov

  let _who = who
  let _middle = [pile_fen(middle.hand),
    maybe(middle.flop, pile_fen),
    maybe(middle.turn, card_fen),
    maybe(middle.river, card_fen)].join(' ')

  let _button = button
  let _small_blind = small_blind
  let _stacks = stacks.join(' ')
  let _preflop = action_fen(preflop)
  let _flop = maybe(flop, action_fen),
    _turn = maybe(turn, action_fen),
    _river = maybe(river, action_fen),
    _showdown = maybe(showdown, showdown_fen)

  return [
    _middle,
    _who,
    _button,
    _small_blind,
    _stacks,
    _preflop,
    _flop,
    _turn,
    _river,
    _showdown
  ].join(';')
}

export function solitaire_fen(solitaire: Solitaire) {

  let piles = solitaire.piles
  .map(_ => 
       [_[0].length, pile_fen(_[1])].join('/')).join(' ')

  let holes = solitaire.holes.map(pile_fen).join(' ')

  return [piles, holes].join(' ')
}

export function fen_maybe<A>(_: string, fn: (_: string) => A): A | undefined {
  if (_ !== '-') {
    return fn(_)
  }
}

export const whos_uci = ['1', '2']

export function fen_who(_who: string): WhoHasAction | undefined {
  let who = whos_uci.indexOf(_who) + 1
  if (who > 0) {
    return who as WhoHasAction
  }
}

export function fen_aww(_: string): ActionWithWho | undefined {

  let [_who, _type, _ontop] = _.split('.')
  let who = fen_who(_who)
  if (who) {
    let type = parseInt(_type)
    if (typeof type === 'number') {
      let ontop = parseInt(_ontop)
      if (typeof ontop === 'number') {
        return action_with_who(who as WhoHasAction, att(type as ActionType, ontop))
      }
    }
  }
}

export function fen_chips(_: string): Chips | undefined {
  let res = parseInt(_)
  return res ?? res
}

export function fen_action(_: string): Action | undefined {

  let [_button,
    _stacks,
    _small_blind,
    _actions,
    _left_stacks
  ] = _.split('/')


  let button = fen_who(_button)
  let stacks = _stacks.split(' ').map(_ => fen_chips(_)!) as [Chips, Chips]
  let small_blind = fen_chips(_small_blind)!
  let actions = _actions.split(' ').map(_ => fen_aww(_)!)
  let left_stacks = _left_stacks.split(' ').map(_ => fen_chips(_)!) as [Chips, Chips]

  if (button) {
    return new Action(button,
                      stacks,
                      small_blind,
                      actions,
                      left_stacks)
  }
}

export function fen_showdown(fen: string) {
  let [_stacks, _pot] = fen.split('/')

  let stacks = _stacks.split(' ').map(_ => fen_chips(_)!) as [Chips, Chips],
    pot = fen_chips(_pot)!

  return new Showdown(stacks, pot)
}

export function fen_headsup_round_pov(fen: string) {
  let [
    _middle,
    _who,
    _button,
    _small_blind,
    _stacks,
    _preflop,
    _flop,
    _turn,
    _river,
    _showdown
  ] = fen.split(';')


  let [_hand, m_flop, m_turn, m_river] =
    _middle.split(' ')

  let middle = {
    hand: uci_pile(_hand) as [Card, Card],
    flop: fen_maybe(m_flop, uci_pile) as [Card, Card, Card],
    turn: fen_maybe(m_turn, uci_card),
    river: fen_maybe(m_river, uci_card)
  }

  let who = fen_who(_who)!
  let button = fen_who(_button)!
  let small_blind = fen_chips(_small_blind)!
  let stacks = _stacks.split(' ').map(_ => fen_chips(_)!) as [Chips, Chips]
  let preflop = fen_action(_preflop)!
  let flop = fen_maybe(_flop, fen_action),
    turn = fen_maybe(_turn, fen_action),
    river = fen_maybe(_river, fen_action),
    showdown = fen_maybe(_showdown, fen_showdown)

  return new HeadsUpRoundPov(
    who,
    middle,
    button,
    small_blind,
    stacks,
    preflop,
    flop,
    turn,
    river,
    showdown)
}
