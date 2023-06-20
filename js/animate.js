import * as THREE from 'three'
import { scene } from './scene';
import { updateTarget } from "./Target"
import { storeManager } from './State';
import { manager } from "./scene";
import { updateCamera } from "./camera";
import { robotEEIntersecting, updateRobotBounds } from "./RobotTHREE";
import { robotIntersecting } from "./RobotTHREE";
import { targetCylinder } from "./Target";
import { altUpdateGamepads, updateGamepads, velUpdateGamepads } from "./gamepad";
import { TargetBox } from "./targetBox";

import { targetBB } from "./Target";


const position = new THREE.Vector3(1, 2, 3)
const rotation = new THREE.Vector3(0, 0, (Math.PI) / 2)
const targetBox = new TargetBox(position, rotation, scene)

const position1 = new THREE.Vector3(3, 3, 3)
const rotation1 = new THREE.Vector3(0, 0, (Math.PI) / 2)
const goalBox = new TargetBox(position1, rotation1, scene, 2, TargetBox.colors.green)
goalBox.hideMesh()
// goalBox.setBoundColor(TargetBox.colors.green)


const progressBarContainer = document.querySelector('.progress-bar-container')
manager.onLoad = function ( ) {
	progressBarContainer.style.display = 'none'
    animate()
};

let attach = false
window.addEventListener("keydown", (e) => {
    if(e.shiftKey) {
        if(attach == true) attach = false
        else attach = true
    }
})

export function animate() {
    updateCamera() 
    updateTarget()
    
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

    targetBox.setColor( TargetBox.colors.blue )
    // console.log(attach)
    const inGoal = goalBox.boundingBox.containsBox(targetBox.boundingBox)
    if(robotEEIntersecting(targetBox.boundingBox) && attach) {
        targetBox.setColor( TargetBox.colors.green )

        const target = storeManager.getStore("Robot").getState().target

        targetBox.setPosition( target.position )
        targetBox.setRotation( target.rotation )
    }

    if(inGoal) {
        goalBox.setBorderColor( TargetBox.colors.cyan )
    }

    // updateGamepads()
    // altUpdateGamepads()
    velUpdateGamepads()
    updateRobotBounds()
};