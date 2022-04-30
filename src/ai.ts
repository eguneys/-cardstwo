import { HeadsUpRoundPov } from './headsup'

export function random(pov: HeadsUpRoundPov) {

  let { who } = pov

  if (pov.current_who === who) {
    return pov.allowed_actions[Math.floor(pov.allowed_actions.length * Math.random())]
  }
}
