import { robotController } from "./RobotEEControl";
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { RotaryEncoder } from "./devices";
import { Button } from "./devices";
import { Axis } from "./devices"
import { RobotController } from "./RobotController";
import { controls } from "./gui";

import mapping from "../config/mapping.json" assert { type: "json" }


// Store devices, can't be initialized until gamepad connected
const devices = {}

// Add listener for gamepad to be connected
var GAMEPAD_INDEX;
var THROTTLE;
window.addEventListener("gamepadconnected", (e) => {
    const gp = navigator.getGamepads()[e.gamepad.index];
    console.log(
      "Gamepad connected at index %d: %s. %d buttons, %d axes.",
      gp.index,
      gp.id,
      gp.buttons.length,
      gp.axes.length
    );

    GAMEPAD_INDEX = gp.index
    makeDevices()
    console.log(devices)
});



/* CREATE DEVICES */

function makeDevices() {
    devices[ "Rotary Encoders" ] = makeRotaryEncoders(),
    devices[ "Buttons" ] = makeBasicDevices( mapping[ "Buttons" ], Button ),
    devices[ "Switches" ] = makeBasicDevices( mapping[ "Switches" ], Button ),
    devices[ "Potentiometers" ] = makeBasicDevices( mapping[ "Potentiometers"], Axis )
}

function makeRotaryEncoders() {
    const rotaryEncoders = {}
    
    const rotaryEncoderMappings = mapping[ "Rotary Encoders" ]
    for( let rotaryEncoderName in rotaryEncoderMappings ) {
        const rotaryEncoderMapping = rotaryEncoderMappings[ rotaryEncoderName ]
        const buttons = rotaryEncoderMapping[ "Buttons" ]

        // Get the IDs of all buttons
        const bId = []
        for(let buttonName in buttons ) {
            bId.push(buttons[ buttonName ])
        }

        const axis = rotaryEncoderMapping[ "velocity axis" ]
        const rotaryEncoder = new RotaryEncoder( GAMEPAD_INDEX, bId[0], bId[1], bId[2], axis)
        rotaryEncoders[ rotaryEncoderName ] = rotaryEncoder
    }

    return rotaryEncoders
}

function makeBasicDevices( deviceMappings, DeviceClass ) {
    const devices = {}

    for( let deviceName in deviceMappings ) {
        const deviceIndex = deviceMappings[ deviceName ]
        const device = new DeviceClass( GAMEPAD_INDEX, deviceIndex )
        devices[ deviceName ] = device
    }

    return devices
}



/* HANDLE CONTROLS */


function handleIncrementalControl( controlType, controlName, buttonName ) {
    const button = getButton( buttonName )

    // determine direction
    var direction = 0
    if( controlName.includes("increment") ) direction = 1
    else if ( controlName.includes("decrement" )) direction = -1
    else {
        console.warn( "Invalid contol name" )
        return
    }

    // determine id
    const nameArray = controlName.split(" ")
    var ID
    if( controlType === "joint" ) ID = nameArray[2]
    else if ( controlType.includes("end effector")) ID = nameArray[1].toLowerCase()
    else {
        console.warn( "Invalid control type" )
        return
    }

    if( button.pressed ) {
        console.log(ID)
        increment( controlType, ID, direction )
    }
}



// helpers for selecting correct control function
function increment( controlType, ID, direction ) {
    if( controlType === "joint" ) {
        robotController.moveJoint( ID, direction )
    } else if( controlType === "end effector position" ) {
        robotController.moveAlongAxis( ID, direction )
    } else if( controlType === "end effector rotation") {
        robotController.rotateAroundAxis( ID, direction )
    } else {
        console.error("Invalid control type")
    }
}

function incrementAmt ( controlType, ID, amt ) {
    if( controlType === "joint" ) {
        robotController.moveJointAmt( ID, amt )
    } else if( controlType === "end effector position" ) {
        robotController.moveAlongAxisAmt( ID, amt )
    } else if( controlType === "end effector rotation") {
        robotController.rotateAroundAxisAmt( ID, amt )
    } else {
        console.error("Invalid control type")
    }
}


// update all controls
export default function updateControls() {
    const gamepad = getGamepad()
    if(!gamepad) return

    
    // handle end effector incremental controls
    const EEincrementalControls = controls["End Effector Controls"]["Incremental Controls"]
    for(let controlName in EEincrementalControls) {

        // handle step size control
        if(controlName.includes("step size")) {
            const currentStep = robotController.transStep
            const newStep = EEincrementalControls["step size"]

            if(currentStep !== newStep) robotController.setTransStep(newStep)
            continue
        }

        const buttonName = EEincrementalControls[controlName]
        if( buttonName === "none" ) continue

        // handle other controls
        var controlType = "end effector"
        if( controlName.includes("position")) controlType += " position"
        else controlType += " rotation"

        handleIncrementalControl( controlType, controlName, buttonName )
    }
}


/* HELPER FUNCTIONS */

function buttonPressed(b) {
    if (typeof b === "object") {
        return b.pressed;
    }
    return b === 1.0;
}

function updateEE( tVel, rVel ) {
    for(let axis in tVel) {
        robotController.moveAlongAxisAmt( axis, tVel[axis] )
        robotController.rotateAroundAxis( axis, rVel[axis] )
    }
}

function getButton( buttonName ) {
    if( buttonName.includes( "Rotary Encoder" )) {
        // Rotary Encoder name format: "Rotary Encoder # button name"
        var nameArray = buttonName.split(" ")
        const num = nameArray[2]
        const encoderName = "Rotary Encoder " + num
        buttonName = nameArray[3]
        
        return devices["Rotary Encoders"][encoderName].buttons[buttonName]
    } else {
        return devices["Buttons"][buttonName]
    }
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
