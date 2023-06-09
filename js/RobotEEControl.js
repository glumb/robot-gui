import { store } from "./Target";
import { targetChangedAction } from "./Target";

var robotStore = store.getStore('Robot')
var robotTarget = robotStore.getState().target
var robPosition = robotTarget.position
var robRotation = robotTarget.rotation

function updateRobPose() {
    robotTarget = robotStore.getState().target
    robPosition = robotTarget.position
    robRotation = robotTarget.rotation
}

var target = store.getStore('Target').getState()

const targetBound = 0.8
const targetSpawnBounds = {
    x: [-3, 3],
    y: [0, 6],
    z: [-2.5, 3]
}

export function checkWin() {
  if((robPosition.x < target.position.x + targetBound) && (robPosition.x > target.position.x - targetBound)) {
    if(robPosition.y < target.position.y + targetBound && robPosition.y > target.position.y - targetBound) {
      if(robPosition.z < target.position.z + targetBound && robPosition.z > target.position.z - targetBound) {

        // if((state.rotation.x < targetT.rotation.x + 1) && (state.rotation.x > targetT.rotation.x - 1)) { //1 radian of error allowed lols
        //   if(state.rotation.y < targetT.rotation.y + 1 && state.rotation.y > targetT.rotation.y - 1) {
        //     if(state.rotation.z < targetT.rotation.z + 1 && state.rotation.z > targetT.rotation.z - 1) {

        target.rotation.x = Math.random() * (2 * Math.PI)
        target.rotation.y = Math.random() * (2 * Math.PI)
        target.rotation.z = Math.random() * (2 * Math.PI)

        target.position.x = Math.random() * (targetSpawnBounds.x[1]-targetSpawnBounds.x[0]) + targetSpawnBounds.x[0]
        target.position.y = Math.random() * (targetSpawnBounds.y[1]-targetSpawnBounds.y[0]) + targetSpawnBounds.y[0]
        target.position.z = Math.random() * (targetSpawnBounds.z[1]-targetSpawnBounds.z[0]) + targetSpawnBounds.z[0]

        console.log(target.position)
        
        //     }
        //   }
        // }

      }
    }
  }
}

let keys = {
  "w": false,
  "a": false,
  "s": false,
  "d": false,
  "q": false,
  "e": false,
  "1": false,
  "2": false,
  "3": false,
  "4": false,
  "5": false,
  "6": false,
}

const transStep = 0.25;
const rotStep = 5 / 180 * Math.PI;

window.addEventListener("keydown", (e) => {
  updateRobPose();
  // setRobotTarget(robPosition, robRotation)
  if(e.key in keys) {
    keys[e.key] = true
  }

  if(keys["w"]) { robPosition.x += transStep }
  if(keys["s"]) { robPosition.x -= transStep }
  if(keys["a"]) { robPosition.y += transStep }
  if(keys["d"]) { robPosition.y -= transStep }
  if(keys["q"]) { robPosition.z += transStep }
  if(keys["e"]) { robPosition.z -= transStep }
  if(keys["1"]) { robRotation.x += rotStep }
  if(keys["2"]) { robRotation.x -= rotStep }
  if(keys["3"]) { robRotation.y += rotStep }
  if(keys["4"]) { robRotation.y -= rotStep }
  if(keys["5"]) { robRotation.z += rotStep }
  if(keys["6"]) { robRotation.z -= rotStep }
  if(e.key in keys) { setRobotTarget(robPosition, robRotation) }
  checkWin();
})

window.addEventListener("keyup", (e) => {
  if(e.key in keys) {
    keys[e.key] = false
  }
})

function setRobotTarget(position, rotation) {
    robotStore.dispatch('ROBOT_CHANGE_TARGET', {
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