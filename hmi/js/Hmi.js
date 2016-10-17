define((require, exports, module) => {
  const Target = require('Target')
  const Robot = require('Robot')
  const gui = require('UiDat')
  const io = require('/socket.io/socket.io.js')
  const EventBus = require('EventBus')
  const createStore = require('redux').createStore
  const THREEView = require('THREEView')

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
      const scope = this
      let geometry = [
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

      let jointLimits = [
        [-170, 170],
        [-90, 45],
        [-80, 120],
        [-112.5, 112.5],
        [-90, 120],
        [-180, 179],
      ]

      const maxAngleVelocity = 90.0 / (180.0 * Math.PI) / 1000.0

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
            J5: [-188, 178],
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

      geometry = Object.values(this.state.Robot.geometry).map((val, i, array) => {
        return [val.x, val.y, val.z]
      })
      jointLimits = Object.values(this.state.Robot.jointLimits)

      this.IK = new InverseKinematic(geometry, jointLimits)

      const setAngles = () => {
        const geometry = Object.values(this.state.Robot.geometry).map((val, i, array) => {
          return [val.x, val.y, val.z]
        })
        const jointLimits = Object.values(this.state.Robot.jointLimits)

        const angles = []
        const result = this.IK.calculateAngles(
          this.state.Robot.target.position.x,
          this.state.Robot.target.position.y,
          this.state.Robot.target.position.z,
          this.state.Robot.target.rotation.x,
          this.state.Robot.target.rotation.y,
          this.state.Robot.target.rotation.z,
          angles
        )

        this.state.Robot.jointOutOfBound = result

        this.state.Robot.angles.A0 = angles[0]
        this.state.Robot.angles.A1 = angles[1]
        this.state.Robot.angles.A2 = angles[2]
        this.state.Robot.angles.A3 = angles[3]
        this.state.Robot.angles.A4 = angles[4]
        this.state.Robot.angles.A5 = angles[5]
      }

      /* --- Reducer --- */
      EventBus.subscribe('ROBOT_CHANGE_TARGET', (data) => {
        scope.state.Robot.target.position = data.payload.position
        scope.state.Robot.target.rotation = data.payload.rotation
        setAngles()

        EventBus.publish('change', {

        })
        this.render()
      })

      EventBus.subscribe('change', (data) => {
        this.render()
      })

      EventBus.subscribe('ROBOT_CHANGE_GEOMETRY', (data) => {
        const geometry = Object.values(this.state.Robot.geometry).map((val, i, array) => {
          return [val.x, val.y, val.z]
        })
        const jointLimits = Object.values(this.state.Robot.jointLimits)

        this.IK = new InverseKinematic(geometry, jointLimits)
        setAngles()
        EventBus.publish('change', {

        })
        this.render()
      })
        /* THREEJS SCENE SETUP */

      this.renderer = new THREE.WebGLRenderer({
        antialias: true, // to get smoother output
        preserveDrawingBuffer: false, // no screenshot -> faster?
      })
      this.renderer.setClearColor(0x333333)

      this.renderer.setSize(window.innerWidth, window.innerHeight)
      document.getElementById('container').appendChild(this.renderer.domElement)

      // create a scene
      this.scene = new THREE.Scene()
      debug.scene = this.scene

      // toggle camera mode
      const perspectiveCamera = true
      if (perspectiveCamera) {
        this.camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 10000)
      } else {
        this.camera = new THREE.OrthographicCamera(
          window.innerWidth / -2,
          window.innerWidth / 2,
          window.innerHeight / 2,
          window.innerHeight / -2, -500, 1000)
        this.camera.zoom = 20
        this.camera.updateProjectionMatrix()
      }

      this.camera.position.set(25, 25, -25)
      this.scene.add(this.camera)

      // lights
      const light = new THREE.AmbientLight(0xaaaaaa)
      this.scene.add(light)
      const light2 = new THREE.DirectionalLight(0xaaaaaa)
      light2.position.set(1, 1.3, 1).normalize()
      this.scene.add(light2)

      this.cameraControls = new THREE.OrbitControls(this.camera, this.renderer.domElement)
      this.cameraControls.addEventListener('change', this.render.bind(this))

      function onWindowResize() {
        if (perspectiveCamera) {
          scope.camera.aspect = window.innerWidth / window.innerHeight
          scope.camera.updateProjectionMatrix()
        } else {
          scope.camera.left = window.innerWidth / -2
          scope.camera.right = window.innerWidth / 2
          scope.camera.top = window.innerHeight / 2
          scope.camera.bottom = window.innerHeight / -2
          scope.camera.updateProjectionMatrix()
        }

        scope.renderer.setSize(window.innerWidth, window.innerHeight)
        scope.render()
      }

      window.addEventListener('resize', onWindowResize, false)

      const size = 10
      const step = 20

      const gridHelper = new THREE.GridHelper(size, step)
      this.scene.add(gridHelper)

      const axisHelper = new THREE.AxisHelper(5)
      this.scene.add(axisHelper)

      /* END THREEJS SCENE SETUP */

      /* DAT GUI */

      const hmiGui = gui.addFolder('HMI')
      gui.remember(scope.state)

      const fun = {
        resetTargetPos: () => {
          EventBus.publish('TARGET_CHANGE_TARGET', {
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
      }

      hmiGui.add(fun, 'resetTargetPos').onChange(() => {

      })

      hmiGui.add(scope.state, 'showRobot').onChange(() => {
        scope.Robot.setVisible(scope.state.showRobot)
        scope.render()
      })

      hmiGui.add(scope.state, 'showRemoteRobot').onChange(() => {
        scope.THREERemoteRobot.visible = scope.state.showRemoteRobot
        scope.render()
      })

      // REMOTE ROBOT
      const socket = io()

      let setupComplete = true
      let ports = []

      socket.emit('info', {}, (info) => {
        console.log(info)
        ports = info
        const remoteRobotGui = gui.addFolder('RemoteRobot')

        remoteRobotGui.add(scope.state, 'port', ports).onChange(() => {
          socket.emit('setup', {
            port: scope.state.port,
          }, (result) => {
            // doto only if successfull
            setupComplete = true
            console.log(`connected: ${result}`)
          })
        })

        let interval = null
        remoteRobotGui.add(scope.state, 'sendAnglesToRobot').onChange(() => {
          if (setupComplete) {
            if (scope.state.sendAnglesToRobot) {
              interval = setInterval(() => {
                const outOfBound = scope.state.Robot.jointOutOfBound.reduce((previous, current) => {
                  return previous || current
                }, false)
                if (!outOfBound) {
                  socket.emit('write',
                    `R0 ${(scope.state.Robot.angles.A0 / (Math.PI * 180)).toFixed(3)} ` +
                    `R1 ${(scope.state.Robot.angles.A1 / (Math.PI * 180)).toFixed(3)} ` +
                    `R2 ${(scope.state.Robot.angles.A2 / (Math.PI * 180)).toFixed(3)} ` +
                    `R3 ${(scope.state.Robot.angles.A3 / (Math.PI * 180)).toFixed(3)} ` +
                    `R4 ${(scope.state.Robot.angles.A4 / (Math.PI * 180)).toFixed(3)} ` +
                    `R5 ${(scope.state.Robot.angles.A5 / (Math.PI * 180)).toFixed(3)} \r`,
                    (res) => {
                      console.log(res)
                    })
                }
              }, scope.state.interval)
            } else {
              clearInterval(interval)
            }
          }
        })
      })

      socket.on('data', (data) => {
        console.log(data)
          // todo
        this.Robot.setAngles([20, 1, 1, 1, 1, 1])
      })

      /* END DAT GUI */

      /* INIT MODULES */

      this.Target = new Target(this.state, this.scene, this.camera, this.renderer, this.cameraControls)
      this.Robot = new Robot(this.state, this.scene)
      this.Robot.setVisible(this.state.showRobot)

      // remote robot
      const geometryArray = Object.values(this.state.Robot.geometry).map(val => [val.x, val.y, val.z])
      const jointLimitsArray = Object.values(this.state.Robot.jointLimits)

      this.THREERemoteRobot = new THREE.Group()
      this.THREERemoteRobot.visible = scope.state.showRemoteRobot
      this.scene.add(this.THREERemoteRobot)
      this.RemoteRobot = new THREERobot(geometryArray, jointLimitsArray, this.THREERemoteRobot)

      /* END INIT MODULES */

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
      this.Robot.setTarget(this.Target.getPosition(), this.Target.getRotation())
    }

    targetToTCP() {
      const position = []
      this.RobotController.getCurrentPosition(position)
      this.target.position.x = position[0]
      this.target.position.y = position[1]
      this.target.position.z = position[2]

      this.target.rotation.x = position[3]
      this.target.rotation.y = position[4]
      this.target.rotation.z = position[5]

      this.render()
    }

    render() {
      this.renderer.render(this.scene, this.camera)
    }

  }

  module.exports = new Hmi()
})
