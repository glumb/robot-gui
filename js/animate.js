import { updateTarget } from "./Target"
import { manager } from "./scene";
import { updateCamera } from "./camera";
import { robotEEIntersecting, updateRobotBounds } from "./RobotTHREE";
import { robotIntersecting } from "./RobotTHREE";
import { targetCylinder } from "./Target";
import { altUpdateGamepads, updateGamepads } from "./gamepad";

import { targetBB } from "./Target";

const progressBarContainer = document.querySelector('.progress-bar-container')
manager.onLoad = function ( ) {
	progressBarContainer.style.display = 'none'
    animate()
};

export function animate() {
    updateCamera() 
    updateTarget()
    updateRobotBounds()
    
    setTimeout( function() {

        requestAnimationFrame( animate );

    }, 1000 / 60 );

    targetCylinder.material.color.setHex(0xff0000)
    if(robotIntersecting(targetBB)) {
        targetCylinder.material.color.setHex(0x0000ff)
    }
    if(robotEEIntersecting(targetBB)) {
        targetCylinder.material.color.setHex(0xffff00)
    }

    // updateGamepads()
    altUpdateGamepads()
};