import { robotController } from "./RobotEEControl";
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { RotaryEncoder } from "./devices";
import { RobotController } from "./RobotController";

window.addEventListener("gamepadconnected", (e) => {
    const gp = navigator.getGamepads()[e.gamepad.index];
    console.log(
      "Gamepad connected at index %d: %s. %d buttons, %d axes.",
      gp.index,
      gp.id,
      gp.buttons.length,
      gp.axes.length
    );
});

function buttonPressed(b) {
    if (typeof b === "object") {
        return b.pressed;
    }
    return b === 1.0;
}

let buttonMapping = {
    "choose a control": -1,
    "rotary encoder 0 clockwise": 0,
    "rotary encoder 0 counterclockwise": 1,
    "rotary encoder 1 clockwise": 2,
    "rotary encoder 1 counterclockwise": 3,
    "rotary encoder 2 clockwise": 4,
    "rotary encoder 2 counterclockwise": 5,
    "rotary encoder 3 clockwise": 6,
    "rotary encoder 3 counterclockwise": 7,
}

const gui = new GUI( { width: 400 } )
const endEffectorControlFolder = gui.addFolder("End Effector Control Option 1")

let endEffectorControlMapping = {
    "increment x position": {func: () => robotController.incrementPosition("x"), button: 0},
    "decrement x position": {func: () => robotController.decrementPosition("x"), button: 1},
    "increment y position": {func: () => robotController.incrementPosition("y"), button: 2},
    "decrement y position": {func: () => robotController.decrementPosition("y"), button: 3},
    "increment z position": {func: () => robotController.incrementPosition("z"), button: 4},
    "decrement z position": {func: () => robotController.decrementPosition("z"), button: 5},
    "increment x Rotation": {func: () => robotController.incrementRotation("x"), button: 6},
    "decrement x Rotation": {func: () => robotController.decrementRotation("x"), button: 7},
    "increment y Rotation": {func: () => robotController.incrementRotation("y"), button: -1},
    "decrement y Rotation": {func: () => robotController.decrementRotation("y"), button: -1},
    "increment z Rotation": {func: () => robotController.incrementRotation("z"), button: -1},
    "decrement z Rotation": {func: () => robotController.decrementRotation("z"), button: -1},
}



for(let control in endEffectorControlMapping) {
    let mapping = endEffectorControlMapping[control]
    endEffectorControlFolder.add( mapping, "button", buttonMapping ).name(control)
}




const endEffectorControlFolder2 = gui.addFolder("End Effector Control Option 2")
var rotaryEncoders = {}
rotaryEncoders["select device"] = "select device"
for(let i = 0; i < 4; i++) {
    rotaryEncoders["Rotary Encoder " + i] = new RotaryEncoder(0, i*2 + 1, i*2 + 2, i)
}

endEffectorControlFolder.close()
endEffectorControlFolder2.close()


// console.log(rotaryEncoders)

const endEffectorControlMapping2 = {
    "x position": {device: rotaryEncoders["Rotary Encoder 0"]},
    "y position": {device: rotaryEncoders["Rotary Encoder 1"]},
    "z position": {device: rotaryEncoders["Rotary Encoder 2"]},
    "x rotation": {device: rotaryEncoders["Rotary Encoder 3"]},
    "y rotation": {device: "select device"},
    "z rotation": {device: "select device"},
}

for(let control in endEffectorControlMapping2) {
    let mapping = endEffectorControlMapping2[control]
    endEffectorControlFolder2.add( mapping, "device", rotaryEncoders ).name(control)
}

function getGamepad() {
    const gamepads = navigator.getGamepads()
    if(!gamepads) return

    const gamepad = gamepads[0]
    let buttons
    try {
        buttons = gamepad.buttons
    } catch ( err ) {
        return false
    }

    return gamepad
}


export function altUpdateGamepads() {
    const gamepad = getGamepad()
    if(!gamepad) return
    

    // console.log(endEffectorControlMapping2["x position"]["previous"])

    for(const control in endEffectorControlMapping2) {
        const mapping = endEffectorControlMapping2[control]
        const axis = control[0]    // x, y, or z
        const positionControl = control.includes("position")  // true or false

       

        if(mapping.device === "select device") continue
        const direction = mapping.device.readDirection()     // -1, 0, or 1
        if(direction === 0) {
            mapping["previous"] = direction
            continue
        }
        // if(mapping["previous"] !== 0) continue
        mapping["previous"] = direction

        if(positionControl) {
            robotController.moveAlongAxis(axis, direction)
        } else {
            robotController.rotateAroundAxis(axis, direction)
        }
    }
}


export function updateGamepads() {
    const gamepads = navigator.getGamepads()
    if(!gamepads) return

    const gamepad = gamepads[0]
    let buttons
    try {
        buttons = gamepad.buttons
    } catch ( err ) {
        console.log(err)
        return
    }

    for(let control in endEffectorControlMapping) {
        let mapping = endEffectorControlMapping[control]
        
        if(mapping.button === -1) continue
        if(buttonPressed(buttons[mapping.button])) {
            // console.log(control)
            mapping.func()
        }
    }
}



function updateEE( tVel, rVel ) {
    for(let axis in tVel) {
        robotController.moveAlongAxisAmt( axis, tVel[axis] )
        robotController.rotateAroundAxis( axis, rVel[axis] )
    }
}

export function velUpdateGamepads() {
    const gamepad = getGamepad()
    if(!gamepad) return


    let translationalVelocity = {
        "x": 0,
        "y": 0,
        "z": 0,
    }
    
    let rotationalVelocity = {
        "x": 0,
        "y": 0,
        "z": 0,
    }

    // console.log(rotaryEncoders["Rotary Encoder 0"].readVelocity())


    for(const control in endEffectorControlMapping2) {
        const mapping = endEffectorControlMapping2[control]
        const device = mapping.device
        const axis = control[0]
        const positionControl = control.includes("position")

        if(device === "select device") continue

        const direction = device.readDirection()
        const velocity = device.readVelocity()

        if(Math.abs(velocity) < 0.05) {
            // Don't allow multiple movements per frame
            if(direction === 0) {
                mapping["previous"] = direction
                continue
            }
            if(mapping["previous"] !== 0) continue
            mapping["previous"] = direction


            if(positionControl) {
                robotController.moveAlongAxis(axis, direction)
            } else {
                robotController.rotateAroundAxis(axis, direction)
            }
            continue
        } 

        if(positionControl) {
            translationalVelocity[axis] = velocity
        } else {
            rotationalVelocity[axis] = velocity * Math.PI
        }
    }

    
    updateEE( translationalVelocity, rotationalVelocity )
}