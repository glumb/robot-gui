define((require, exports, module) => {
  const EventBus = require('EventBus')
  const gui = require('UiDat')

  class Target {

    constructor(state, scene, camera, renderer, cameraControls) {
      const scope = this
      this.state = state.Target

      const sphereGeo = new THREE.CylinderGeometry(1, 1, 1 * 2, 32)
      this.target = new THREE.Group()
      const targetMesh = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.7,
        color: 0xaaaaaa,
      }))
      targetMesh.rotation.z = Math.PI / 2
      targetMesh.position.x += 1
      this.target.add(targetMesh)
      const axisHelper = new THREE.AxisHelper(5)
      this.target.add(axisHelper)
      this.target.rotation.order = 'ZYX'
      scene.add(this.target)

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
        ringx = createRing(2.00, 0xFF0000, 'x')
        ringy = createRing(1.75, 0x00FF00, 'y')
        ringz = createRing(1.50, 0x0000FF, 'z')

        // set up rotation hierarchy - assuming x -> y -> z intrinsic
        ringy.add(ringz)
        ringx.add(ringy)

        parentObject.add(ringx)
      }

      this.eulerRings = new THREE.Object3D()
      scene.add(this.eulerRings)
      createAllRings(this.eulerRings)

      EventBus.subscribe('change', () => {
        scope.target.position.x = this.state.position.x
        scope.target.position.y = this.state.position.y
        scope.target.position.z = this.state.position.z

        scope.target.rotation.x = this.state.rotation.x
        scope.target.rotation.y = this.state.rotation.y
        scope.target.rotation.z = this.state.rotation.z

        scope.eulerRings.position.set(scope.target.position.x, scope.target.position.y, scope.target.position.z)
        ringx.rotation.x = scope.target.rotation.x
        ringy.rotation.y = scope.target.rotation.y
        ringz.rotation.z = scope.target.rotation.z
      })

      EventBus.subscribe('TARGET_CHANGE_TARGET', (data) => {
        // issue: when firing from external this does not check and update the robots target state
        if (this.state.followTarget) {
          EventBus.publish('ROBOT_CHANGE_TARGET', {
            payload: {
              position: data.payload.position,
              rotation: data.payload.rotation,
            },
          })
        }

        scope.state.position = data.payload.position
        scope.state.rotation = data.payload.rotation
        EventBus.publish('change', {

        })
      })

      this.control = new THREE.TransformControls(camera, renderer.domElement)

      const targetChangedAction = () => {
        EventBus.publish('TARGET_CHANGE_TARGET', {
          payload: {
            position: scope.target.position,
            rotation: scope.target.rotation,
          },
        })
      }

      //            this.control.rotation.x = 2
      this.control.addEventListener('change', () => {
        targetChangedAction()
      })
      this.control.attach(this.target)
      this.control.setMode(state.manipulate)
      this.control.setMode(state.manipulate)

      scene.add(this.control)

      /* MOUSE CONTROL */
      const raycaster = new THREE.Raycaster()
      const mouse = new THREE.Vector2()

      let DOWNPOSITION
      let lastTranslateX = 0

      function onDocumentMouseMove(event) {
        event.preventDefault()

        mouse.x = ((event.clientX / window.innerWidth) * 2) - 1
        mouse.y = (-(event.clientY / window.innerHeight) * 2) + 1

        if (DOWNPOSITION) {
          const dy = event.clientY - DOWNPOSITION.y

          scope.target.translateX((dy - lastTranslateX) * 0.1)
          lastTranslateX = dy
          targetChangedAction()
          return
        }
        raycaster.setFromCamera(mouse, camera)
        const intersects = raycaster.intersectObjects(scope.target.children)

        if (intersects.length > 0) {
          renderer.domElement.style.cursor = 'pointer'
        } else {
          renderer.domElement.style.cursor = 'auto'
        }
      }

      function onDocumentMouseDown(event) {
        event.preventDefault()

        raycaster.setFromCamera(mouse, camera)

        const intersects = raycaster.intersectObject(targetMesh)

        if (intersects.length > 0) {
          DOWNPOSITION = {
            x: event.clientX,
            y: event.clientY,
          }
          cameraControls.enabled = false

          renderer.domElement.style.cursor = 'move'
        }
      }

      function onDocumentMouseUp(event) {
        DOWNPOSITION = null
        lastTranslateX = 0
        event.preventDefault()

        cameraControls.enabled = true

        renderer.domElement.style.cursor = 'auto'
      }

      renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false)
      renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false)
      renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false)

      // GUI
      // TARGET

      const targetGUI = gui.addFolder('target')

      targetGUI.add(scope.state, 'followTarget').onChange(() => {
        if (scope.state.followTarget) {
          targetChangedAction()
        }
      })

      targetGUI.add(this.state, 'manipulate', ['translate', 'rotate']).onChange(() => {
        scope.setMode(this.state.manipulate)
      }).listen()
      targetGUI.add(scope.target.position, 'x').step(0.1).onChange(() => {
        targetChangedAction()
      }).listen()
      targetGUI.add(scope.target.position, 'y').step(0.1).onChange(() => {
        targetChangedAction()
      }).listen()
      targetGUI.add(scope.target.position, 'z').step(0.1).onChange(() => {
        targetChangedAction()
      }).listen()

      targetGUI.add(scope.target.rotation, 'x').min(-Math.PI).max(Math.PI).listen().step(0.01).onChange(() => {
        targetChangedAction()
      })
      targetGUI.add(scope.target.rotation, 'y').min(-Math.PI).max(Math.PI).listen().step(0.01).onChange(() => {
        targetChangedAction()
      })
      targetGUI.add(scope.target.rotation, 'z').min(-Math.PI).max(Math.PI).listen().step(0.01).onChange(() => {
        targetChangedAction()
      })
      targetGUI.add(this.state, 'showEulerRings').onChange(() => {
        scope.eulerRings.visible = this.state.showEulerRings
        EventBus.publish('VIEW_RENDER', {

        }) // dont cann View.render() simce there may be multiple view instances
      })
      targetGUI.add(this.state, 'showControls').onChange(() => {
        scope.control.visible = this.state.showControls
        cameraControls.enabled = this.state.showControls // not working
        EventBus.publish('VIEW_RENDER', {

        }) // dont cann View.render() simce there may be multiple view instances
      })

      scope.eulerRings.visible = this.state.showEulerRings
      scope.control.visible = this.state.showControls

      window.addEventListener('keydown', (event) => {
        switch (event.keyCode) {
          case 82:
            console.log('rotation mode')
            scope.setMode('rotate')
            break
          case 84:
            console.log('translation mode')
            scope.setMode('translate')
            break
          default:
            break
        }
        EventBus.publish('Target.change', {
          type: 'change',
        })
      }, false)
    }

    getPosition() {
      return this.target.position
    }
    getRotation() {
      return this.target.rotation
    }
    setMode(mode) {
      this.state.manipulate = mode
      this.control.setMode(mode)
    }
    setEulerRingsVisibility(visible) {
      this.eulerRings.visible = visible
    }
    setControlsVisibility(visible) {
      this.control.visible = visible
    }
  }
  module.exports = Target
})
