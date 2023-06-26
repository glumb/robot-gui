import { RobotController } from "./RobotController";
import { storeManager } from "./State";

var robotStore = storeManager.getStore('Robot')

export const robotController = new RobotController(robotStore, 0.1, (Math.PI)/36)

var target = storeManager.getStore('Target').getState()

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

window.addEventListener("keydown", (e) => {
  if(e.key in keys) {
    keys[e.key] = true
  }

  if(keys["w"]) { robotController.incrementPosition("x") }
  if(keys["s"]) { robotController.decrementPosition("x") }
  if(keys["a"]) { robotController.incrementPosition("y") }
  if(keys["d"]) { robotController.decrementPosition("y") }
  if(keys["q"]) { robotController.incrementPosition("z") }
  if(keys["e"]) { robotController.decrementPosition("z") }
  if(keys["1"]) { robotController.incrementRotation("x") }
  if(keys["2"]) { robotController.decrementRotation("x") }
  if(keys["3"]) { robotController.incrementRotation("y") }
  if(keys["4"]) { robotController.decrementRotation("y") }
  if(keys["5"]) { robotController.incrementRotation("z") }
  if(keys["6"]) { robotController.decrementRotation("z") }
})

window.addEventListener("keyup", (e) => {
  if(e.key in keys) {
    keys[e.key] = false
  }
})