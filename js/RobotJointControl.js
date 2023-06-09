import { storeManager } from './State'
import { robotStore } from './Robot'
import { checkWin } from './RobotEEControl'

const geometry = storeManager.getStore('Robot').getState().geometry
const jointLimits = storeManager.getStore('Robot').getState().jointLimits

const robotGuiStore = storeManager.createStore('RobotGui', {})


const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI

var anglesDeg = {
  A0: 0,
  A1: 0,
  A2: 0,
  A3: 0,
  A4: 0,
  A5: 0,
}

var robPosition = storeManager.getStore('Robot').getState().target.position
var robRotation = storeManager.getStore('Robot').getState().target.rotation
var target = storeManager.getStore('Target').getState()

function updatePoses() {
  robPosition = storeManager.getStore('Robot').getState().target.position
  robRotation = storeManager.getStore('Robot').getState().target.rotation
  target = storeManager.getStore('Target').getState()

  anglesDeg = {
    A0: storeManager.getStore('Robot').getState().angles.A0 * 180 / Math.PI,
    A1: storeManager.getStore('Robot').getState().angles.A1 * 180 / Math.PI,
    A2: storeManager.getStore('Robot').getState().angles.A2 * 180 / Math.PI,
    A3: storeManager.getStore('Robot').getState().angles.A3 * 180 / Math.PI,
    A4: storeManager.getStore('Robot').getState().angles.A4 * 180 / Math.PI,
    A5: storeManager.getStore('Robot').getState().angles.A5 * 180 / Math.PI,
  }
}

function setTarget(position, rotation) {
  storeManager.dispatch('TARGET_CHANGE_TARGET', {
    position: {
      x: position.x,
      y: position.y,
      z: position.z,
    },
    rotation: {
      x: rotation.x,
      y: rotation.y,
      z: rotation.z,
    },
  })
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
