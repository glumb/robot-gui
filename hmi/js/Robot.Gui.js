define((require, exports, module) => {
  const gui = require('UiDat')
  const storeManager = require('State')
  const robotStore = require('Robot')

  const geometry = {
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
    }
  }

  const robotGuiStore = storeManager.createStore('RobotGui', {})

  /* DAT GUI */

  const geometryGui = gui.addFolder('robot geometry')


  for (const link in geometry) {
    if (link) {
      const linkFolder = geometryGui.addFolder(`link ${link}`)
      for (const axis in geometry[link]) {
        if (axis) {
          gui.remember(geometry[link])
          linkFolder.add(geometry[link], axis).min(-10).max(10).step(0.1).onChange(() => {
            robotStore.dispatch('ROBOT_CHANGE_GEOMETRY', geometry)
          })
        }
      }
    }
  }

  const anglesDeg = {
    A0: 0,
    A1: 0,
    A2: 0,
    A3: 0,
    A4: 0,
    A5: 0,
  }

  robotStore.listen([state => state.angles], (angles)=> {
    Object.keys(anglesDeg).forEach((k)=> {
      anglesDeg[k] = angles[k] / Math.PI * 180
    })
  })


  const anglesGui = gui.addFolder('angles')
  for (const key in anglesDeg) {
    anglesGui.add(anglesDeg, key).min(-180).max(180).step(1).listen().onChange(() => {
      const anglesRad = {}
      for (const key in anglesDeg) {
        if (anglesDeg.hasOwnProperty(key)) {
          anglesRad[key] = anglesDeg[key] * Math.PI / 180
        }
      }
      robotStore.dispatch('ROBOT_CHANGE_ANGLES', anglesRad)
    })
  }

  /* END DAT GUI */


  module.exports = robotStore
})
