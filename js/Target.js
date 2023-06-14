import { storeManager } from './State'
import { scene } from './scene'
import * as THREE from 'three'
/**
 * + state per module
 * + render on state changed
 * + get state from other modules
 *
 * --- onStore update render ---
 * get data From other stores
 * - store might not have changed, so no update
 */

const defaultState = {
  controlSpace: 'local',
  eulerRingsVisible: false,
  controlVisible: false,
  controlMode: 'translate',
  followTarget: false,
  manipulate: 'rotate',
  position: {
    x: 0,
    y: 3,
    z: 1,
  },
  rotation: {
    x: 0,
    y: 0,
    z: 0,
  },
}

const store = storeManager.createStore('Target', defaultState)

const sphereGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.2 * 2, 16)
const target = new THREE.Group()

const targetCylinder = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({
  transparent: false,
  opacity: 1,
  color: 0xF64129,
}))

targetCylinder.rotation.x = Math.PI / 2
targetCylinder.position.z += 1
target.add(targetCylinder)
target.rotation.y = Math.PI / 2
target.rotation.z = -Math.PI
target.rotation.order = 'XYZ'
scene.add(target)

const targetBB = new THREE.Box3()
targetCylinder.geometry.computeBoundingBox()
const helper = new THREE.Box3Helper( targetBB, 0xffff00 )
scene.add( helper );

store.listen([() => store.getStore('Robot').getState().target, state => state], (targetT, state) => {
  if (state.followTarget) {
    state.position.x = targetT.position.x
    state.position.y = targetT.position.y
    state.position.z = targetT.position.z

    state.rotation.x = targetT.rotation.x
    state.rotation.y = targetT.rotation.y
    state.rotation.z = targetT.rotation.z
  }
  ///*
  target.position.x = state.position.x
  target.position.y = state.position.y
  target.position.z = state.position.z

  target.rotation.x = state.rotation.x
  target.rotation.y = state.rotation.y
  target.rotation.z = state.rotation.z
  //*/
})

store.action('TARGET_CHANGE_TARGET', (state, data) => {
  // + this function can be called from outside
  // + may otherwise lead to inconsistent state, where followTarget: true, but pos of target and robot do not match (or not?, listen() will always be consistent)
  // - action should only care about its own state
  // - can lead to loop
  // - need only one way to do it, UI may only need to update other modules state, so only update others sate is needed
  // const pos = { ...state.rotation,
  //   ...data.rotation,
  // }
  //
  // console.log(pos)
  if (state.followTarget) {
    store.getStore('Robot').dispatch('ROBOT_CHANGE_TARGET', {
      position: { ...state.position, // allow for changing only one parameter (x,y,z)
        ...data.position,
      },
      rotation: { ...state.rotation,
        ...data.rotation,
      },
    })
  }
  return { ...state,
    position: { ...state.position, // allow for changing only one parameter (x,y,z)
      ...data.position,
    },
    rotation: { ...state.rotation,
      ...data.rotation,
    },
  }
})

function updateTarget() {
  targetBB.copy( targetCylinder.geometry.boundingBox ).applyMatrix4( targetCylinder.matrixWorld )
}

export {store}
export {updateTarget}
export {targetBB}
export {targetCylinder}