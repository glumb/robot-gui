define((require, exports, module) => {
  const EventBus = require('EventBus')
  const storeManager = require('State')
  const robotStore = require('Robot')
  const {
    scene,
    camera,
    renderer,
  } = require('THREEScene')

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
    controlVisible: true,
    controlMode: 'translate',
    followTarget: true,
    manipulate: 'rotate',
    showEulerRings: false,
    showControls: true,
    position: {
      x: 10,
      y: 10,
      z: 10,
    },
    rotation: {
      x: 10,
      y: 10,
      z: 10,
    },
  }

  const store = storeManager.createStore('Target', defaultState)

  store.action('CHANGE_FOLLOW_TARGET', (state, data) => {
    if (data) {
      store.getStore('Robot').dispatch('ROBOT_CHANGE_TARGET', {
        position: state.position,
        rotation: state.rotation,
      })
    }
    return Object.assign({}, state, {
      followTarget: data,
    })
  })

  store.action('SET_EULER_RINGS_VISIBLE', (state, data) => Object.assign({}, state, {
    eulerRingsVisible: data,
  }))
  store.action('SET_CONTROL_VISIBLE', (state, data) => Object.assign({}, state, {
    controlVisible: data,
  }))

  const sphereGeo = new THREE.CylinderGeometry(1, 1, 1 * 2, 32)
  const target = new THREE.Group()
  const targetCylinder = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.7,
    color: 0xaaaaaa,
  }))
  targetCylinder.rotation.z = Math.PI / 2
  targetCylinder.position.x += 1
  target.add(targetCylinder)
  const arrowZ = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 3, 0x0000ff)
  // arrowZ.line.material.linewidth = 4
  target.add(arrowZ)
  const arrowY = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 3, 0x00ff00)
  // arrowY.line.material.linewidth = 4
  target.add(arrowY)
  const arrowX = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 3, 0xff0000)
  // arrowX.line.material.linewidth = 4
  target.add(arrowX)
  // const axisHelper = new THREE.AxisHelper(5)
  // target.add(axisHelper)
  target.rotation.order = 'ZYX'
  scene.add(target)

  /* CONTROLS */

  function createRing(radius, color, axis) {
    const sphere_radius = 0.12

    const ringMaterial = new THREE.MeshLambertMaterial({
      color,
    })

    // create ring shape
    const circleMesh = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.05, 6, 50),
      ringMaterial
    )

    const sphereMesh = new THREE.Mesh(
      new THREE.SphereGeometry(sphere_radius, 12, 10),
      ringMaterial
    )
    sphereMesh.position.x = radius

    const composite = new THREE.Object3D()
    composite.add(circleMesh)
    composite.add(sphereMesh)
    // composite.add(coneMesh)

    if (axis === 'x') {
      composite.rotation.y = Math.PI / 2
    } else if (axis === 'y') {
      composite.rotation.x = Math.PI / 2
    }

    const ringObj = new THREE.Object3D()
    ringObj.add(composite)

    return ringObj
  }

  let ringx
  let ringy
  let ringz
  // Euler https://www.udacity.com/course/viewer#!/c-cs291/l-91073092/m-123949249
  function createAllRings(parentObject) {
    // debugger
    // create Rings
    ringz = createRing(2.00, 0x0000FF, 'z')
    ringy = createRing(1.75, 0x00FF00, 'y')
    ringx = createRing(1.50, 0xFF0000, 'x')

    // set up rotation hierarchy - assuming x -> y -> z intrinsic
    ringy.add(ringx)
    ringz.add(ringy)

    parentObject.add(ringz)
  }

  const eulerRings = new THREE.Object3D()
  scene.add(eulerRings)
  createAllRings(eulerRings)

  const control = new THREE.TransformControls(camera, renderer.domElement)
  let disableUpdate = false
  store.listen([() => store.getStore('Robot').getState().target, state => state], (targetT, state) => {
    if (state.followTarget) {
      target.position.x = targetT.position.x
      target.position.y = targetT.position.y
      target.position.z = targetT.position.z

      target.rotation.x = targetT.rotation.x
      target.rotation.y = targetT.rotation.y
      target.rotation.z = targetT.rotation.z
    } else {
      target.position.x = state.position.x
      target.position.y = state.position.y
      target.position.z = state.position.z

      target.rotation.x = state.rotation.x
      target.rotation.y = state.rotation.y
      target.rotation.z = state.rotation.z
    }

    if (true) { // loop -  changing mode triggers change....
      disableUpdate = true
      control.setMode(state.controlMode)
      control.setSpace(state.controlSpace)
      disableUpdate = false
    }

    control.visible = state.controlVisible
    eulerRings.visible = state.eulerRingsVisible

    eulerRings.position.set(target.position.x, target.position.y, target.position.z)
    ringx.rotation.x = target.rotation.x
    ringy.rotation.y = target.rotation.y
    ringz.rotation.z = target.rotation.z

    // control.dispatchEvent({ type: 'change' })
  })

  EventBus.subscribe('TARGET_CHANGE_TARGET', (data) => {
    store.getState().position = data.payload.position
    store.getState().rotation = data.payload.rotation
    EventBus.publish('change', {})
  })

  const targetChangedAction = () => {
    setTarget(target.position, target.rotation)

    // bonus points: how to not fire an action from this reducer and still be able
    // to call CHANGE_TARGET on Target and sync the ROBOT_TARGET
    // state.dispatch('ROBOT_CHANGE_TARGET', {
    //   position: target.position,
    //   rotation: target.rotation,
    // })
  }

  //            control.rotation.x = 2
  control.addEventListener('change', () => {
    if (!disableUpdate) { // changing controlmode causes a loop
      targetChangedAction()
    }
  })
  control.attach(target)

  scene.add(control)

  eulerRings.visible = store.getState().showEulerRings
  control.visible = store.getState().showControls

  window.addEventListener('keydown', (event) => {
    switch (event.keyCode) {
      case 82:
        console.log('rotation mode')
        setMode('rotate')
        break
      case 84:
        console.log('translation mode')
        setMode('translate')
        break
      default:
        break
    }
    EventBus.publish('Target.change', {
      type: 'change',
    })
  }, false)

  store.action('CONTROL_SPACE_TOGGLE', state => state.controlSpace, controlSpace => ((controlSpace === 'local') ? 'world' : 'local'))

  function toggleSpace() {
    store.dispatch('CONTROL_SPACE_TOGGLE')
  }

  function getState() {
    return store.getState()
  }

  function setMode(mode) {
    store.action('CHANGE_CONTROL_MODE', state => state.controlMode, (controlMode, data) => data.mode)
    store.dispatch('CHANGE_CONTROL_MODE', {
      mode,
    })
  }

  function setEulerRingsVisibility(visible) {
    store.action('EULERRINGS_VISIBLE', state => state.eulerRingsVisible, (eulerRingsVisible, data) => data.visible)
    store.dispatch('EULERRINGS_VISIBLE', {
      visible,
    })
  }

  function setControlsVisibility(visible) {
    store.action('CONTROl_VISIBLE', state => state.controlVisible, (controlVisible, data) => data.visible)
    store.dispatch('CONTROl_VISIBLE', {
      visible,
    })
  }

  store.action('TARGET_CHANGE_TARGET', (state, data) => {
    // + this function can be called from outside
    // + may otherwise lead to inconsistent state, where followTarget: true, but pos of target and robot do not match (or not?, listen() will always be consistent)
    // - action should only care about its own state
    // - can lead to loop
    // - need only one way to do it, UI may only need to update other modules state, so only update others sate is needed
    if (state.followTarget) {
      store.getStore('Robot').dispatch('ROBOT_CHANGE_TARGET', {
        position: data.position,
        rotation: data.rotation,
      })
    }
    return Object.assign({}, state, {
      position: data.position,
      rotation: data.rotation,
    })
  })

  function setTarget(position, rotation) {
    store.dispatch('TARGET_CHANGE_TARGET', {
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

  module.exports = store
})
