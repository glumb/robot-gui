define((require, exports, module) => {
  const Robot = require('Robot')
  const RobotTHREE = require('RobotTHREE')
  const RobotGui = require('Robot.Gui')
  const Target = require('Target')
  const TargetGui = require('Target.Gui')
  const gui = require('UiDat')
  const THREEView = require('THREEView')
  const storeManager = require('State')
  const ws = require('WorkingSpace')
  const Path = require('Path.Gui')
  const Kinematic = require('Kinematic')
  // const RemoteRobot = require('RemoteRobot')

  const logger = store => dispatch => (action, data) => {
    console.group(`ACTION ${action}`)

    console.log(`action: %c${action}`, 'color:green')
    console.log('data: ', data)
    console.log('%cstore before: ', 'color:orange', store.getState())

    const newState = dispatch(action, data)
    console.log('%cnew state: ', 'color:green', newState)
    console.groupEnd()
    return newState
  }

  const mid = store => dispatch => (action, data) => {
    const oldState = store.getState()
    const oldStateCopy = JSON.parse(JSON.stringify(oldState))

    const newState = dispatch(action, data)

    function compare(o, n, os) {
      for (const i of Object.keys(o).concat(Object.keys(n))) {
        if (typeof n[i] === 'undefined') {
          if (os === n) {
            console.warn('nooohohoohoh did not change state, bro!')
            console.warn('element was removed, but parent not changed')
          }
        } else if (typeof o[i] === 'undefined') {
          if (os === n) {
            console.warn('nooohohoohoh did not change state, bro!')
            console.warn('element was added, but parent not changed')
          }
        } else if (!!o[i] && typeof (o[i]) === 'object') {
          // console.log('aaaa')
          //
          compare(o[i], n[i], os[i])
        } else {
          if (typeof n[i] === 'undefined' || o[i] !== n[i]) { // el deleted, or value not same
            // value has changed todo iter over newState (missing ones were deleted, dont matter. new ones dont matter either hm....)

            // new state cant be old state, if a child changed
            if (os === n) {
              console.warn('nooohohoohoh did not change state, bro!')
              console.group(`state ${action}`)
              console.log(`oldStateCopy: ${o[i]}`)
              console.log(`oldState: %c${os[i]}`, 'color: red')
              console.log(`newState: ${n[i]}`)
              console.groupEnd()
            }
          }
          // console.log(i, o[i] === n[i])
        }
      }
    }
    compare(oldStateCopy, newState, oldState)

    return newState
  }

  storeManager.applyMiddleware(logger, mid)
  /* POLYFILL */

  const reduce = Function.bind.call(Function.call, Array.prototype.reduce)
  const isEnumerable = Function.bind.call(Function.call, Object.prototype.propertyIsEnumerable)
  const concat = Function.bind.call(Function.call, Array.prototype.concat)
  const keys = Reflect.ownKeys

  if (!Object.values) {
    Object.values = function values(O) {
      return reduce(keys(O), (v, k) => concat(v, typeof k === 'string' && isEnumerable(O, k) ? [O[k]] : []), [])
    }
  }

  /* END POLYFILL */

  class Hmi {
    constructor() {
      const maxAngleVelocity = 90.0 / (180.0 * Math.PI) / 1000.0

      const store = storeManager.createStore('Hmi', {})

      const scope = this

      /* THREEJS SCENE SETUP */

      const {
        scene,
        renderer,
        camera,
      } = require('THREEScene')
      this.scene = scene
      this.renderer = renderer
      this.camera = camera

      /* END THREEJS SCENE SETUP */

      /* DAT GUI */

      const hmiGui = gui.addFolder('HMI')
      gui.remember(scope.state)

      const fun = {
        resetTargetAngles: () => {
          Robot.dispatch('ROBOT_CHANGE_ANGLES', {
            A0: 0,
            A1: 0,
            A2: 0,
            A3: 0,
            A4: 0,
            A5: 0,
          })
        },
      }

      hmiGui.add(fun, 'resetTargetAngles').onChange(() => {

      })
      window.debug.show = false
      hmiGui.add(window.debug, 'show')

      /* CONNECT MODULES */
    }
  }

  module.exports = Hmi
})
