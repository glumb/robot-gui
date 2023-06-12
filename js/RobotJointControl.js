import { storeManager } from './State'
import { checkWin } from './RobotEEControl'

const DEG_TO_RAD = Math.PI / 180

var anglesDeg = {
  A0: 0,
  A1: 0,
  A2: 0,
  A3: 0,
  A4: 0,
  A5: 0,
}

const robotStore = storeManager.getStore('Robot')

function updatePoses() {
  anglesDeg = {
    A0: robotStore.getState().angles.A0 * 180 / Math.PI,
    A1: robotStore.getState().angles.A1 * 180 / Math.PI,
    A2: robotStore.getState().angles.A2 * 180 / Math.PI,
    A3: robotStore.getState().angles.A3 * 180 / Math.PI,
    A4: robotStore.getState().angles.A4 * 180 / Math.PI,
    A5: robotStore.getState().angles.A5 * 180 / Math.PI,
  }
}

const rotStep = 5;

let keys = {
  "t": false,
  "g": false,
  "y": false,
  "h": false,
  "u": false,
  "j": false,
  "i": false,
  "k": false,
  "o": false,
  "l": false,
  "p": false,
  ";": false,
}

window.addEventListener("keydown", (e) => {
  updatePoses()
  if(e.key in keys) {
    keys[e.key] = true
  }

  if(keys["t"]) { anglesDeg.A0 += rotStep }
  if(keys["g"]) { anglesDeg.A0 -= rotStep }
  if(keys["y"]) { anglesDeg.A1 += rotStep }
  if(keys["h"]) { anglesDeg.A1 -= rotStep }
  if(keys["u"]) { anglesDeg.A2 += rotStep }
  if(keys["j"]) { anglesDeg.A2 -= rotStep }
  if(keys["i"]) { anglesDeg.A3 += rotStep }
  if(keys["k"]) { anglesDeg.A3 -= rotStep }
  if(keys["o"]) { anglesDeg.A4 += rotStep }
  if(keys["l"]) { anglesDeg.A4 -= rotStep }
  if(keys["p"]) { anglesDeg.A5 += rotStep }
  if(keys[";"]) { anglesDeg.A5 -= rotStep }

  updateRobotAngles()
  checkWin()
})

window.addEventListener("keyup", (e) => {
  if(e.key in keys) {
    keys[e.key] = false
  }
})

function updateRobotAngles() {
  const anglesRad = {}
  for (const key in anglesDeg) {
    if (anglesDeg.hasOwnProperty(key)) {
      anglesRad[key] = anglesDeg[key] * DEG_TO_RAD
    }
  }
  robotStore.dispatch('ROBOT_CHANGE_ANGLES', anglesRad)
}

robotStore.listen([state => state.angles], (angles) => {
  Object.keys(anglesDeg).forEach((k) => {
    anglesDeg[k] = angles[k] / Math.PI * 180
  })
})

export {robotStore}
