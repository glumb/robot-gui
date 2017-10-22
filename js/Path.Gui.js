define((require, exports, module) => {
  const gui = require('UiDat')
  const storeManager = require('State')
  const robotStore = require('Robot') // todo dont export store but a handle which acceps the name of the consuming module const targetStore = getStoreFrom('myModule') -> myModule accesses store targetStore

  const pathGuiStore = storeManager.createStore('PathGui', {
    points: [],
    currentPoint: 0,
    move: false,
  })

  // the returned value of an action is set to the selected object
  // helper is needed, since dat.gui wants to modify the object, so we cant use ist on the state
  const pathGUI = gui.addFolder('PathGui')

  let interval = null
  pathGuiStore.listen([() => robotStore.getState().target, state => state], (robState, state) => {
    if (state.move && !interval && state.points.length > 0) {
      let i = 0
      let currentPoint = state.currentPoint
      let lastPoint = (currentPoint + state.points.length - 1) % state.points.length
      interval = setInterval(() => {
        i += 0.01

        const tp = state.points[currentPoint].position
        const sp = state.points[lastPoint].position
        const position = {
          x: sp.x + (tp.x - sp.x) * i,
          y: sp.y + (tp.y - sp.y) * i,
          z: sp.z + (tp.z - sp.z) * i,
        }
        const tr = state.points[currentPoint].rotation
        const sr = state.points[lastPoint].rotation
        const rotation = {
          x: sr.x + (tr.x - sr.x) * i,
          y: sr.y + (tr.y - sr.y) * i,
          z: sr.z + (tr.z - sr.z) * i,
        }
        robotStore.dispatch('ROBOT_CHANGE_TARGET', {
          position,
          rotation,
        })

        if (i >= 1) {
          i = 0
          lastPoint = currentPoint
          currentPoint = (currentPoint + 1) % state.points.length
          // clearInterval(interval)
        }
      }, 100)
    } else if (!state.move && interval) {
      clearInterval(interval)
      interval = false
    }
  })

  pathGuiStore.action('ADD_POINT', (state, data) => ({
    ...state,
    points: [...state.points, data],
  }))

  pathGuiStore.action('SET_MOVE', (state, data) => ({
    ...state,
    move: data,
  }))

  pathGuiStore.action('NEXT_POINT', state => ({
    ...state,
    currentPoint: (state.currentPoint + 1) % state.points.length,
  }))

  const methods = {
    savePoint: () => {},
    next: () => {},
    prev: () => {},
    move: false,
  }

  pathGUI.add(methods, 'savePoint').onChange(() => {
    const {
      position,
      rotation,
    } = robotStore.getState().target

    pathGuiStore.dispatch('ADD_POINT', {
      position,
      rotation,
    })
  })

  pathGUI.add(methods, 'move').onChange(() => {
    pathGuiStore.dispatch('SET_MOVE', methods.move)
  })

  pathGUI.add(methods, 'next').onChange(() => {
    pathGuiStore.dispatch('NEXT_POINT')
  })

  module.exports = pathGuiStore
})
