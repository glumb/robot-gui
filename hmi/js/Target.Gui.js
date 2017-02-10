define((require, exports, module) => {
  const EventBus = require('EventBus')
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
  }

  targetStore.listen([() => targetGuiStore.getStore('Robot').getState().target, state => state], (targetT, state) => {
    if (state.followTarget) {
      helper.position.x = targetT.position.x
      helper.position.y = targetT.position.y
      helper.position.z = targetT.position.z

      helper.rotation.x = targetT.rotation.x
      helper.rotation.y = targetT.rotation.y
      helper.rotation.z = targetT.rotation.z
    } else {
      helper.position.x = state.position.x
      helper.position.y = state.position.y
      helper.position.z = state.position.z

      helper.rotation.x = state.rotation.x
      helper.rotation.y = state.rotation.y
      helper.rotation.z = state.rotation.z
    }

    // Iterate over all controllers
    for (const i in targetGUI.__controllers) {
      targetGUI.__controllers[i].updateDisplay()
    }
  })

  // setInterval(()=> {
  //   targetStore.dispatch('TARGET_CHANGE_TARGET', {
  //     position: {
  //       x: helper.position.x - 0.1,
  //       y: helper.position.y,
  //       z: helper.position.z,
  //     },
  //     rotation: {
  //       x: helper.rotation.x,
  //       y: helper.rotation.y,
  //       z: helper.rotation.z,
  //     },
  //   })
  // }, 100)

  // GUI
  // TARGET

  // targetGUI.add(store.getState(), 'followTarget').onChange(() => {
  //   store.dispatch('CHANGE_FOLLOW_TARGET', !store.getState().followTarget)
  // })

  function toggleSpace() {
    targetStore.dispatch('CONTROL_SPACE_TOGGLE')
  }

  targetGUI.add({
    toggleSpace,
  }, 'toggleSpace')
  targetGUI.add(targetStore.getState(), 'manipulate', ['translate', 'rotate']).onChange(() => {
    setMode(store.getState().manipulate)
  })
  targetGUI.add(helper.position, 'x').step(0.1).onChange(() => {
    targetStore.dispatch('TARGET_CHANGE_TARGET', {
      position: {
        x: helper.position.x,
        y: helper.position.y,
        z: helper.position.z,
      },
      rotation: {
        x: helper.rotation.x,
        y: helper.rotation.y,
        z: helper.rotation.z,
      },
    })
  })
  targetGUI.add(helper.position, 'y').step(0.1).onChange(() => {
    targetStore.dispatch('TARGET_CHANGE_TARGET', {
      position: {
        x: helper.position.x,
        y: helper.position.y,
        z: helper.position.z,
      },
      rotation: {
        x: helper.rotation.x,
        y: helper.rotation.y,
        z: helper.rotation.z,
      },
    })
  })
  targetGUI.add(helper.position, 'z').step(0.1).onChange(() => {
    targetStore.dispatch('TARGET_CHANGE_TARGET', {
      position: {
        x: helper.position.x,
        y: helper.position.y,
        z: helper.position.z,
      },
      rotation: {
        x: helper.rotation.x,
        y: helper.rotation.y,
        z: helper.rotation.z,
      },
    })
  })

  targetGUI.add(helper.rotation, 'x').min(-Math.PI).max(Math.PI).step(0.01).onChange(() => {
    targetStore.dispatch('TARGET_CHANGE_TARGET', {
      position: {
        x: helper.position.x,
        y: helper.position.y,
        z: helper.position.z,
      },
      rotation: {
        x: helper.rotation.x,
        y: helper.rotation.y,
        z: helper.rotation.z,
      },
    })
  })
  targetGUI.add(helper.rotation, 'y').min(-Math.PI).max(Math.PI).step(0.01).onChange(() => {
    targetStore.dispatch('TARGET_CHANGE_TARGET', {
      position: {
        x: helper.position.x,
        y: helper.position.y,
        z: helper.position.z,
      },
      rotation: {
        x: helper.rotation.x,
        y: helper.rotation.y,
        z: helper.rotation.z,
      },
    })
  })
  targetGUI.add(helper.rotation, 'z').min(-Math.PI).max(Math.PI).step(0.01).onChange(() => {
    targetStore.dispatch('TARGET_CHANGE_TARGET', {
      position: {
        x: helper.position.x,
        y: helper.position.y,
        z: helper.position.z,
      },
      rotation: {
        x: helper.rotation.x,
        y: helper.rotation.y,
        z: helper.rotation.z,
      },
    })
  })
  targetGUI.add(targetStore.getState(), 'showEulerRings').onChange(() => {
    targetStore.dispatch('SET_EULER_RINGS_VISIBLE', !targetStore.getState().eulerRingsVisible) // todo bad practice to get the store data outside of listen
  })
  targetGUI.add(targetStore.getState(), 'showControls').onChange(() => {
    targetStore.dispatch('SET_CONTROL_VISIBLE', !targetStore.getState().controlVisible)
  })

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
  }, false)

  module.exports = targetGuiStore
})
