define((require, exports, module) => {
  const EventBus = require('EventBus')
  const gui = require('UiDat')

  class Robot {

    constructor(state, scene) {
      const scope = this
      this.state = state
      this.THREESimulationRobot = new THREE.Group()
      scene.add(this.THREESimulationRobot)
      this.localState = {
        jointOutOfBound: this.state.Robot.jointOutOfBound,
      }

      /* DAT GUI */

      const geometryGui = gui.addFolder('robot geometry')

      const controller = {

        freezeRobot() {
          const geometry = Object.values(scope.state.Robot.geometry).map((val, i, array) => [val.x, val.y, val.z])
          const jointLimits = Object.values(scope.state.Robot.jointLimits)
          scope.VisualRobot = new THREERobot(geometry, jointLimits, scope.THREESimulationRobot)
        },
      }

      geometryGui.add(controller, 'freezeRobot').onChange(() => {})

      for (const link in state.Robot.geometry) {
        if (link) {
          const linkFolder = geometryGui.addFolder(`link ${link}`)
          for (const axis in state.Robot.geometry[link]) {
            if (axis) {
              gui.remember(state.Robot.geometry[link])
              linkFolder.add(state.Robot.geometry[link], axis).min(-10).max(10).step(0.1).onChange(() => {
                scope.buildRobot() // todo build robot on any change - test if geometry actually changed
                // todo find a way to detect if the state actually changed
                // we always listen for specific parts of the state
                // function observeStore(store, select, onChange) {
                //   let currentState;
                //
                //   function handleChange() {
                //     let nextState = select(store.getState());
                //     if (nextState !== currentState) {
                //       currentState = nextState;
                //       onChange(currentState);
                //     }
                //   }
                //
                //   let unsubscribe = store.subscribe(handleChange);
                //   handleChange();
                //   return unsubscribe;
                // }
                EventBus.publish('ROBOT_CHANGE_GEOMETRY', {
                  type: 'change',
                })
              })
            }
          }
        }
      }

      const anglesGui = gui.addFolder('angles')
      for (const key in state.Robot.angles) {
        anglesGui.add(state.Robot.angles, key).min(-Math.PI).max(Math.PI).step(0.1).listen()
      }

      /* END DAT GUI */

      this.buildRobot() // after GUI loaded in the stored values

      EventBus.subscribe('change', () => {
        this.setTarget(Object.values(this.state.Robot.angles))
      })
    }

    buildRobot() {
      if (this.state.Robot.geometry.V3.y !== 0 || this.state.Robot.geometry.V3.z !== 0 || this.state.Robot.geometry.V4.z !== 0 || this.state.Robot.geometry.V4.x !== 0) {
        alert('geometry where V3 y,z not 0 and V4 x,z not 0 are not supported, yet')
        this.state.Robot.geometry.V3.y =
          this.state.Robot.geometry.V3.z =
          this.state.Robot.geometry.V4.z =
          this.state.Robot.geometry.V4.x = 0
      }
      for (const child of this.THREESimulationRobot.children) {
        this.THREESimulationRobot.remove(child)
      }
      // object to nested arrays
      const geometry = Object.values(this.state.Robot.geometry).map((val, i, array) => {
        return [val.x, val.y, val.z]
      })
      const jointLimits = Object.values(this.state.Robot.jointLimits)

      this.VisualRobot = new THREERobot(geometry, jointLimits, this.THREESimulationRobot)
    }

    setTarget(angles) {
      this.VisualRobot.setAngles(angles)

      for (let i = 0; i < 6; i++) {
        if (this.localState.jointOutOfBound[i] && !this.state.Robot.jointOutOfBound[i]) { // highlight only on change
          this.VisualRobot.highlightJoint(i, 0xff0000)
        } else if (!this.localState.jointOutOfBound[i] && this.state.Robot.jointOutOfBound[i]) {
          this.VisualRobot.highlightJoint(i)
        }
      }

      this.localState.jointOutOfBound = this.state.Robot.jointOutOfBound
    }

    setVisible(visible) {
      this.THREESimulationRobot.visible = visible
    }
  }
  module.exports = Robot
})
