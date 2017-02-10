define((require, exports, module) => {
  const Robot = require('Robot')
  const RobotTHREE = require('RobotTHREE')
  const RobotGui = require('Robot.Gui')
    // const RobotGui = require('Robot.Gui')
  const Target = require('Target')
  const TargetGui = require('Target.Gui')
  const gui = require('UiDat')
  const EventBus = require('EventBus')
  const redux = require('redux')
  const THREEView = require('THREEView')
  const storeManager = require('State')
  const ws = require('WorkingSpace')
  const RemoteRobot = require('RemoteRobot')

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

  // storeManager.applyMiddleware(logger, mid)
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
      const geometry = [
        [1, 1, 0],
        [0, 10, 0],
        [5, 0, 0],
        [3, 0, 0],
        [0, -3, 0],
        [0, 0, 0],
      ]

      // geometry = [
      //         [4.6, 8, 0],
      //         [0, 11.6, 0],
      //         [1.5, 2, 0],
      //         [11, 0, 0],
      //         [0, -3, 0],
      //         [0, 0, 0]
      //     ]
      //                geometry = [ [ 1, 1, 2 ], [ 0, 10, 0 ], [ 0, 0, -5 ], [ 5, 0, 0 ], [ 0, - 3, 0 ],[ 0, 0, 0 ]  ]
      //                geometry = [ [ 1, 1, 2 ], [ 0, 10, 0 ], [ 0, 3, -5 ], [ 8, 0, 0 ], [ 0, - 3, 0 ],[ 0, 0, 0 ]  ]
      //                geometry = [[5, 0, 0], [0, 5, 0], [0, 0, 5], [5, 0, 0], [0, -3, 0], [0, 0, 0]]
      //        geometry = [ [ -3, -5, -7 ], [ 15, -4, 3 ], [ 2, -5, -8 ], [ -10, -3, -2 ], [ 0, - 3, 0 ],[ 0, 0, 0 ]  ]

      const jointLimits = [
        [-170, 170],
        [-90, 45],
        [-80, 120],
        [-112.5, 112.5],
        [-90, 120],
        [-180, 179],
      ]

      this.state = {
        jointOutOfBound: [false, false, false, false, false, false],
        showRemoteRobot: false,
        showRobot: true,
        sendAnglesToRobot: false,
        interval: 1000,
        port: '/',
        Target: {
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
          manipulate: 'translate',
          showEulerRings: false,
          showControls: true,
          followTarget: true,
        },
        Robot: {
          target: {
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
          },
          angles: {
            A0: 0,
            A1: 0,
            A2: 0,
            A3: 0,
            A4: 0,
            A5: 0,
          },
          maxAngleVelocities: {
            J0: maxAngleVelocity,
            J1: maxAngleVelocity,
            J2: maxAngleVelocity,
            J3: maxAngleVelocity,
            J4: maxAngleVelocity,
            J5: maxAngleVelocity,
          },
          jointLimits: {
            J0: [-90, 90],
            J1: [-58, 90],
            J2: [-135, 40],
            J3: [-90, 75],
            J4: [-39, 141],
            J5: [-188, 181],
          },
          geometry: {
            V0: {
              x: 1,
              y: 1,
              z: 0,
            },
            V1: {
              x: 0,
              y: 10,
              z: 0,
            },
            V2: {
              x: 5,
              y: 0,
              z: 0,
            },
            V3: {
              x: 3,
              y: 0,
              z: 0,
            },
            V4: {
              x: 0,
              y: -3,
              z: 0,
            },
            V5: {
              x: 0,
              y: 0,
              z: 0,
            },
          },
        },
      }

      EventBus.subscribe('ROBOT_CHANGE_ANGLES', (data) => {
        scope.state.Robot.angles = data.payload.angles

        const TCPpose = []
        const result = this.IK.calculateTCP(
            scope.state.Robot.angles.A0,
            scope.state.Robot.angles.A1,
            scope.state.Robot.angles.A2,
            scope.state.Robot.angles.A3,
            scope.state.Robot.angles.A4,
            scope.state.Robot.angles.A5,
            TCPpose
          )

          // todo joint out of bound

        this.state.Robot.target.position.x = TCPpose[0]
        this.state.Robot.target.position.y = TCPpose[1]
        this.state.Robot.target.position.z = TCPpose[2]
        this.state.Robot.target.rotation.x = TCPpose[3]
        this.state.Robot.target.rotation.y = TCPpose[4]
        this.state.Robot.target.rotation.z = TCPpose[5]
        EventBus.publish('change', {

        })
        this.render()
      })
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
        resetTargetPos: () => {
          EventBus.publish('ROBOT_CHANGE_TARGET', {
            payload: {
              position: {
                x: 0,
                y: 0,
                z: 0,
              },
              rotation: {
                x: 0,
                y: 0,
                z: 0,
              },
            },
          })
        },
        resetTargetAngles: () => {
          EventBus.publish('ROBOT_CHANGE_ANGLES', {
            payload: {
              angles: {
                A0: 0,
                A1: 0,
                A2: 0,
                A3: 0,
                A4: 0,
                A5: 0,
              },
            },

          })
        },
      }

      hmiGui.add(fun, 'resetTargetPos').onChange(() => {

      })
      hmiGui.add(fun, 'resetTargetAngles').onChange(() => {

      })

      hmiGui.add(scope.state, 'showRobot').onChange(() => {
        scope.Robot.setVisible(scope.state.showRobot)
        scope.render()
      })

      hmiGui.add(scope.state, 'showRemoteRobot').onChange(() => {
        scope.THREERemoteRobot.visible = scope.state.showRemoteRobot
        scope.render()
      })

      /* CONNECT MODULES */
      EventBus.subscribe('Target.change', () => {
        if (scope.state.followTarget) {
          scope.robotToTargetPosition()
        }

        scope.render()
      })

      this.IK = new InverseKinematic(geometry, jointLimits)

      window.addEventListener('keydown', (event) => {
        switch (event.keyCode) {
          case 38:
            console.log('Up key is pressed')
            break
          case 40:
            console.log('Down key is pressed')
            break
          case 39:
            console.log('Right key is pressed')
            break
          case 37:
            console.log('left key is pressed')
            break
          default:
            break
        }
        scope.render()
      }, false)

      EventBus.subscribe('Robot.change', () => {
        scope.robotToTargetPosition()
        scope.render()
      })

      this.render()

      EventBus.publish('change', {})
    }

    robotToTargetPosition() {
      // this.Robot.setTarget(this.Target.getPosition(), this.Target.getRotation())
    }

    targetToTCP() {
      const position = []
        // this.RobotController.getCurrentPosition(position)
      this.target.position.x = position[0]
      this.target.position.y = position[1]
      this.target.position.z = position[2]

      this.target.rotation.x = position[3]
      this.target.rotation.y = position[4]
      this.target.rotation.z = position[5]

      this.render()
    }

    render() {
      // this.renderer.render(this.scene, this.camera)
    }

    setTarget(position, rotation) {
      robotStore.dispatch('ROBOT_CHANGE_TARGET', {
        position,
        rotation,
      })
    }

  }

  module.exports = Hmi
})
