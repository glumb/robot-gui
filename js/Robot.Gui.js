// const gui = require('UiDat')
import { storeManager } from './State'
import { robotStore } from './Robot'

const geometry = storeManager.getStore('Robot').getState().geometry
const jointLimits = storeManager.getStore('Robot').getState().jointLimits

const robotGuiStore = storeManager.createStore('RobotGui', {})


const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI
/* DAT GUI */

// const geometryGui = gui.addFolder('robot geometry')

// for (const link in geometry) {
//   if (link) {
//     const linkFolder = geometryGui.addFolder(`link ${link}`)
//     for (const axis in geometry[link]) {
//       if (axis) {
//         gui.remember(geometry[link])
//         linkFolder.add(geometry[link], axis).min(-10).max(10).step(0.1).onChange(() => {
//           robotStore.dispatch('ROBOT_CHANGE_GEOMETRY', geometry)
//         })
//       }
//     }
//   }
// }

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

const targetBound = 0.8
function checkWin() {
  if((robPosition.x < target.position.x + targetBound) && (robPosition.x > target.position.x - targetBound)) {
    if(robPosition.y < target.position.y + targetBound && robPosition.y > target.position.y - targetBound) {
      if(robPosition.z < target.position.z + targetBound && robPosition.z > target.position.z - targetBound) {

        // if((state.rotation.x < targetT.rotation.x + 1) && (state.rotation.x > targetT.rotation.x - 1)) { //1 radian of error allowed lols
        //   if(state.rotation.y < targetT.rotation.y + 1 && state.rotation.y > targetT.rotation.y - 1) {
        //     if(state.rotation.z < targetT.rotation.z + 1 && state.rotation.z > targetT.rotation.z - 1) {

        target.rotation.x = Math.random() * (2 * Math.PI)
        target.rotation.y = Math.random() * (2 * Math.PI)
        target.rotation.z = Math.random() * (2 * Math.PI)

        let bounds = {
          x: [-3, 3],
          y: [0, 6],
          z: [-2.5, 3]
        }

        target.position.x = Math.random() * (bounds.x[1]-bounds.x[0]) + bounds.x[0]
        target.position.y = Math.random() * (bounds.y[1]-bounds.y[0]) + bounds.y[0]
        target.position.z = Math.random() * (bounds.z[1]-bounds.z[0]) + bounds.z[0]

        console.log(target.position)
          
        targetChangedAction()
        //     }
        //   }
        // }

      }
    }
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

  // for(let key in anglesDeg) {
  //   if(anglesDeg[key] > 180) {
  //     anglesDeg[key] -= 360;
  //   }
  //   if(anglesDeg[key] < -180) {
  //     anglesDeg[key] += 360
  //   }
  // }

  updateRobotAngles()
  checkWin()
})

window.addEventListener("keyup", (e) => {
  if(e.key in keys) {
    keys[e.key] = false
  }
})





// const configuration = {
//   1: false,
//   2: false,
//   3: false,
// }

// const jointLimitsDeg = {
//   J0: [-190, 190],
//   J1: [-58, 90],
//   J2: [-135, 40],
//   J3: [-90, 75],
//   J4: [-139, 20],
//   J5: [-188, 181],
// }

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

// const anglesGui = gui.addFolder('angles')
// let i = 0
// for (const key in anglesDeg) {
//   anglesGui.add(anglesDeg, key).min(jointLimits[`J${i}`][0] * RAD_TO_DEG).max(jointLimits[`J${i++}`][1] * RAD_TO_DEG).step(1).listen().onChange(() => {
//     updateRobotAngles()
//     // const anglesRad = {}
//     // for (const key in anglesDeg) {
//     //   if (anglesDeg.hasOwnProperty(key)) {
//     //     anglesRad[key] = anglesDeg[key] * DEG_TO_RAD
//     //   }
//     // }
//     // robotStore.dispatch('ROBOT_CHANGE_ANGLES', anglesRad)
//   })
// }

// const configurationGui = gui.addFolder('configuration')
// for (const key in configuration) {
//   configurationGui.add(configuration, key).listen().onChange(() => {
//     robotStore.dispatch('ROBOT_CHANGE_CONFIGURATION', Object.values(configuration))
//   })
// }

// const angleLimitGui = anglesGui.addFolder('angle limits')
// for (const joint in jointLimitsDeg) {
//   if (joint) {
//     const jointFolder = angleLimitGui.addFolder(`joint ${joint}`)
//     for (const limit in jointLimitsDeg[joint]) {
//       if (limit) {
//         // gui.remember(jointLimitsDeg[joint])

//         (j => jointFolder.add(jointLimitsDeg[j], limit).name((limit == 0) ? 'min' : 'max').min(-360).max(360).step(1).onChange(() => {
//           limts_rad = {}
//           limts_rad[j] = [
//             jointLimitsDeg[j][0] * DEG_TO_RAD,
//             jointLimitsDeg[j][1] * DEG_TO_RAD,
//           ]
//           robotStore.dispatch('ROBOT_CHANGE_JOINT_LIMITS', limts_rad)
//         }))(joint)
//       }
//     }
//   }
// }

/* END DAT GUI */

export {robotStore}
