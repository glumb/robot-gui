import { robotController } from "./RobotEEControl";
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { RotaryEncoder } from "./devices";
import { Button } from "./devices";
import { Axis } from "./devices"
import { RobotController } from "./RobotController";
import { controls } from "./gui";

import mapping from "../config/mapping.json" assert { type: "json" }
import { storeManager } from "./State";


// Store devices, can't be initialized until gamepad connected
const devices = {}

// Add listener for gamepad to be connected
var GAMEPAD_INDEX;
var VELOCITY_THRESHOLD = 0.03;
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


// update all controls
export default function updateControls() {
    const gamepad = getGamepad()
    if(!gamepad) return

    
    // handle end effector incremental controls
    handleIncrementalControls("End Effector")
    handleIncrementalControls("Joint")
    handleAxisControls("End Effector")
    handleAxisControls("Joint")
}



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


/* HANDLE AXIS CONTROLS */

function handleAxisControls( mode ) {
    var controlTerm
    if(mode === "End Effector") controlTerm = "Axis"
    else controlTerm = "Angle"
    const axisControls = controls[ mode + " Controls"][controlTerm + " Controls"]
    for(let controlName in axisControls) {
        const axisName = axisControls[controlName]
        if(typeof(axisName) !== "string") continue

        var controlType = mode.toLowerCase()
        if( controlName.includes("position")) controlType += " position"
        else if( controlName.includes("rotation")) controlType += " rotation"

        handleAxisControl( controlType, controlName, axisName )
    }
}

function handleAxisControl( controlType, controlName, axisName ) {
    if(axisName === "none") return
    const device = getAxis( axisName )
    var rotaryEncoder = false
    if(axisName.includes("Rotary Encoder")) rotaryEncoder = true

    // determine the ID of the joint/axis to control
    var ID
    if( controlType.includes("end effector") ) {
        ID = controlName[0].toLowerCase()
    } else {
        const nameArray = controlName.split(" ")
        ID = nameArray[1]
    }

    // apply output appropriately
    if(rotaryEncoder) {
        setAxisRotaryEncoder( controlType, ID, device)
    } else {
        setAxisPotentiometer( controlType, ID, device)
    }


}

function setAxisRotaryEncoder( controlType, ID, encoder ) {
    const velocity = encoder.velocity
    const direction = encoder.direction

    if (Math.abs(velocity) < VELOCITY_THRESHOLD) {
        // try to increment in each direction
        incrementOnce( controlType, ID, 1, direction === 1)
        incrementOnce( controlType, ID, -1, direction === -1)
    } else {
        incrementAmt( controlType, ID, velocity )
    }
}

function setAxisPotentiometer( controlType, ID, potentiometer ) {
    const input = potentiometer.value

    if(controlType === "joint") {
        const angleRad = propInputToJointOutput( ID, input )
        robotController.setJointAngle( ID, angleRad )
    } else if (controlType === "end effector position") {
        const position = propInputToEEOutput( "position", ID, input )
        robotController.setPosition( ID, position )
    } else if (controlType === "end effector rotation") {
        const rotation = propInputToEEOutput ( "rotation", ID, input )
        console.log(rotation)
        robotController.setRotation( ID, rotation )
    }
}

const eeLimits = {
    position: {
        x: [-7.5, 7.5],
        y: [2.75, 10],
        z: [-7.5, 7.5]
    },
    rotation: {
        x: [ -(Math.PI), Math.PI ],
        y: [ -(Math.PI), Math.PI ],
        z: [ -(Math.PI), Math.PI ]
    }
}

function propInputToEEOutput( mode, axis, input ) {
    const inputProp = mapInput( -1, 1, input)
    const limits = eeLimits[mode][axis]
    const min = limits[0]
    const max = limits[1]
    return mapOutput( min, max, inputProp)
}

function propInputToJointOutput( jointNumber, input ) {
    const inputProp = mapInput( -1, 1, input)
    const jointLimits = storeManager.getStore("Robot").getState().jointLimits
    const jID = "J" + jointNumber
    const limits = jointLimits[ jID ]
    const min = limits[0]
    const max = limits[1]
    
    return mapOutput( min, max, inputProp)
}

// Maps value between 0 and 1 to value between min and max
function mapOutput( min, max, input) {
    const diff = max - min
    return input * diff + min
}

// Maps value between min and max to between 0 and 1
function mapInput( min, max, input ) {
    const diff = max - min
    return (input - min) / diff
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



/* HANDLE CONTROLS INCREMENTAL */

function handleIncrementalControls( mode ) {
    const incrementalControls = controls[ mode + " Controls"]["Incremental Controls"]
    for(let controlName in incrementalControls) {
        // handle step size control
        if(controlName.includes("step size")) {
            const newStep = incrementalControls[controlName]
            handleStepSize( mode, newStep )
            continue
        }

        const buttonName = incrementalControls[controlName]
        if(typeof(buttonName) !== "string") continue

        // handle other controls
        var controlType = mode.toLowerCase()
        if( controlName.includes("position")) controlType += " position"
        else if( controlName.includes("position")) controlType += " rotation"

        handleIncrementalControl( controlType, controlName, buttonName )
    }
}

function handleStepSize( mode, newStep ) {
    var currentStep

    if(mode === "Joint") currentStep = robotController.rotStep
    else if (mode === "End Effector") currentStep = robotController.transStep
    else {
        console.error("Invalid mode")
    }

    if( currentStep === newStep ) return

    if( mode === "Joint" ) robotController.setRotStepDeg( newStep )
    else robotController.setTransStep( newStep )


}
 
const incrementalControlStates = {}

function handleIncrementalControl( controlType, controlName, buttonName ) {
    if( buttonName === "none" ) return
    const button = getButton( buttonName )

    // determine direction
    var direction = 0
    if( controlName.includes("increment") ) direction = 1
    else if ( controlName.includes("decrement" )) direction = -1
    else {
        console.warn( "Invalid control name" )
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

    incrementOnce( controlType, ID, direction, button.pressed)
}

// increment once and don't increment again until button is unpressed
function incrementOnce( controlType, ID, direction, buttonPressed ) {
    var directionWord = "increment"
    if(direction === -1) directionWord = "decrement"

    const controlName = directionWord + " " + controlType + " " + ID

    if( buttonPressed ) {
        if(incrementalControlStates[controlName] !== false) return
        
        increment( controlType, ID, direction )
        incrementalControlStates[controlName] = true
    } else {
        incrementalControlStates[controlName] = false
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

function getAxis( axisName ) {
    if( axisName.includes( "Rotary Encoder" )) {
        return devices["Rotary Encoders"][axisName]
    } else if ( axisName.includes( "Potentiometer" )) {
        return devices["Potentiometers"][axisName]
    } else {
        console.error("Invalid axis name")
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
