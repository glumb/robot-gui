define((require, exports, module) => {
  const gui = require('UiDat')
  const storeManager = require('State')
  const targetStore = require('Target') // todo dont export store but a handle which acceps the name of the consuming module const targetStore = getStoreFrom('myModule') -> myModule accesses store targetStore

  /**
   * + state per module
   * + render on state changed
   * + get state from other modules
   *
   * --- onStore update render ---
   * get data From other stores
   * - store might not have changed, so no update
   */

  const targetGuiStore = storeManager.createStore('TargetGui', {})

  // the returned value of an action is set to the selected object
  // helper is needed, since dat.gui wants to modify the object, so we cant use ist on the state
  const targetGUI = gui.addFolder('targetGui')

  const helper = {
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
    followTarget: true, // will be set on listen anyways
    eulerRingsVisible: false,
    controlVisible: false,
    manipulate: 'world',
    controlMode: 't/r',
  }

  targetStore.listen([() => targetGuiStore.getStore('Robot').getState().target, state => state], (targetT, state) => {
    helper.followTarget = state.followTarget
    helper.eulerRingsVisible = state.eulerRingsVisible
    helper.controlVisible = state.controlVisible
    helper.manipulate = state.manipulate
    helper.controlMode = state.controlMode

    helper.position.x = state.position.x
    helper.position.y = state.position.y
    helper.position.z = state.position.z

    helper.rotation.x = state.rotation.x
    helper.rotation.y = state.rotation.y
    helper.rotation.z = state.rotation.z

    // Iterate over all controllers
    for (const i in targetGUI.__controllers) {
      targetGUI.__controllers[i].updateDisplay()
    }
  })

  function toggleSpace() {
    targetStore.dispatch('CONTROL_SPACE_TOGGLE')
  }

  targetGUI.add({
    toggleSpace,
  }, 'toggleSpace')

  targetGUI.add(helper, 'controlMode', ['translate', 'rotate']).onChange(() => {
    targetStore.dispatch('CHANGE_CONTROL_MODE', helper.controlMode)
  })

  targetGUI.add(helper, 'followTarget').onChange(() => {
    targetStore.dispatch('CHANGE_FOLLOW_TARGET', helper.followTarget)
  })

  targetGUI.add(helper.position, 'x').step(0.1).onChange(() => {
    targetStore.dispatch('TARGET_CHANGE_TARGET', {
      position: {
        x: helper.position.x,
      },
    })
  })

  targetGUI.add(helper.position, 'y').step(0.1).onChange(() => {
    targetStore.dispatch('TARGET_CHANGE_TARGET', {
      position: {
        y: helper.position.y,
      },
    })
  })

  targetGUI.add(helper.position, 'z').step(0.1).onChange(() => {
    targetStore.dispatch('TARGET_CHANGE_TARGET', {
      position: {
        z: helper.position.z,
      },
    })
  })

  targetGUI.add(helper.rotation, 'x').min(-Math.PI).max(Math.PI).step(0.01).onChange(() => {
    targetStore.dispatch('TARGET_CHANGE_TARGET', {
      rotation: {
        x: helper.rotation.x,
      },
    })
  })

  targetGUI.add(helper.rotation, 'y').min(-Math.PI).max(Math.PI).step(0.01).onChange(() => {
    targetStore.dispatch('TARGET_CHANGE_TARGET', {
      rotation: {
        y: helper.rotation.y,
      },
    })
  })

  targetGUI.add(helper.rotation, 'z').min(-Math.PI).max(Math.PI).step(0.01).onChange(() => {
    targetStore.dispatch('TARGET_CHANGE_TARGET', {
      rotation: {
        z: helper.rotation.z,
      },
    })
  })

  targetGUI.add(helper, 'eulerRingsVisible').onChange(() => {
    targetStore.dispatch('SET_EULER_RINGS_VISIBLE', helper.eulerRingsVisible) // todo bad practice to get the store data outside of listen
  })

  targetGUI.add(helper, 'controlVisible').onChange(() => {
    targetStore.dispatch('SET_CONTROL_VISIBLE', helper.controlVisible)
  })

  module.exports = targetGuiStore
})
