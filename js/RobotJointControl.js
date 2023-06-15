import { robotController } from "./RobotEEControl"

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
  if(e.key in keys) {
    keys[e.key] = true
  }

  if(keys["t"]) { robotController.incrementJoint(0) }
  if(keys["g"]) { robotController.decrementJoint(0) }
  if(keys["y"]) { robotController.incrementJoint(1) }
  if(keys["h"]) { robotController.decrementJoint(1) }
  if(keys["u"]) { robotController.incrementJoint(2) }
  if(keys["j"]) { robotController.decrementJoint(2) }
  if(keys["i"]) { robotController.incrementJoint(3) }
  if(keys["k"]) { robotController.decrementJoint(3) }
  if(keys["o"]) { robotController.incrementJoint(4) }
  if(keys["l"]) { robotController.decrementJoint(4) }
  if(keys["p"]) { robotController.incrementJoint(5) }
  if(keys[";"]) { robotController.decrementJoint(5) }
})

window.addEventListener("keyup", (e) => {
  if(e.key in keys) {
    keys[e.key] = false
  }
})