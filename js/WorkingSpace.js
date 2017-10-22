define((require, exports, module) => {
  const storeManager = require('State')
  const gui = require('UiDat')
  const Kinematic = require('Kinematic')
  const {
    scene,
  } = require('THREEScene')

  const robotStore = require('Robot')

  const workingSpaceStore = storeManager.createStore('WorkingSpace', {
    step: 5.0,
    directions: [{
      rx: 0,
      ry: 0,
      rz: -Math.PI / 2,
      color: 0x00ff00,
    }, {
      rx: Math.PI,
      ry: 0,
      rz: 0,
      color: 0xff0000,
    }, {
      rx: 0,
      ry: Math.PI / 2,
      rz: 0,
      color: 0x0000ff,
    }],
    show: false,
  })

  workingSpaceStore.action('CHANGE_STEP', (state, step) =>
    Object.assign({}, state, {
      step,
    }),
  )

  workingSpaceStore.action('ADD_POSE_TO_EULER', state => state.directions, (directions, pose) => [...directions, pose])

  workingSpaceStore.action('REMOVE_POSES', state => state.directions, (directions, pose) => [])

  workingSpaceStore.action('CHANGE_VISIBILITY', (state, data) => Object.assign({}, state, {
    show: data,
  }))

  const guiHelper = {
    step: 5.0,
    directions: [{
      rx: 0,
      ry: 0,
      rz: -Math.PI / 2,
      color: 0x00ff00,
    }, {
      rx: Math.PI,
      ry: 0,
      rz: 0,
      color: 0xff0000,
    }, {
      rx: 0,
      ry: Math.PI / 2,
      rz: 0,
      color: 0x0000ff,
    }],
    show: false,
  }

  const THREEGroup = new THREE.Group()
  scene.add(THREEGroup)

  robotStore.listen([() => workingSpaceStore.getState(), state => state.jointLimits, state => state.geometry], (state, jointLimits, geometry) => {
    // gui
    guiHelper.step = state.step

    // romove all children before adding new ones
    while (THREEGroup.children.length) {
      THREEGroup.remove(THREEGroup.children[0])
    }

    if (state.show) {
      // debugger
      const geo = Object.values(geometry).map((val, i, array) => [val.x, val.y, val.z])
      const IK = new Kinematic(geo, [ // todo remove when using new ik
        [-360, 360],
        [-360, 360],
        [-360, 360],
        [-360, 360],
        [-360, 360],
        [-360, 360],
        [-360, 360],
      ])

      const step = state.step

      const euler = state.directions

      const THREEgeo = new THREE.BoxBufferGeometry(0.1, 0.1, 0.1)

      for (let j = 0; j < euler.length; j++) {
        const {
          rx,
          ry,
          rz,
          color,
        } = euler[j]

        const size = 1.5
        const transparent = true
        const opacity = 0.9
        const vertexColors = false
        const sizeAttenuation = true
        const rotateSystem = false

        const geom = new THREE.Geometry()
        const material = new THREE.PointCloudMaterial({
          size,
          transparent,
          opacity,
          vertexColors,
          sizeAttenuation,
          color,
        })

        let i = 0
        let goOn = 8

        while (goOn > 0) {
          i += step
          goOn--
          for (let x = -i; x <= i; x += step) {
            for (let y = -i; y <= i; y += step) {
              for (let z = -i; z <= i; z += step) {
                // not at the boundary
                if (x < i && x > -i && y < i && y > -i && z < i && z > -i) continue

                const angles = []
                IK.calculateAngles(
                  x,
                  y,
                  z,
                  rx,
                  ry,
                  rz,
                  angles,
                )

                let inReach = true
                Object.keys(jointLimits).forEach((key, i) => {
                  const jl0 = jointLimits[key][0]
                  const jl1 = jointLimits[key][1]

                  if (isNaN(angles[i]) || jointLimits[key][0] > angles[i] || jointLimits[key][1] < angles[i]) {
                    inReach = false
                  }
                })

                if (inReach) {
                  goOn = 3 // continue n more layers if at least one point was in reach

                  // const material = new THREE.MeshBasicMaterial({
                  //   color,
                  // })
                  // const sphere = new THREE.Mesh(THREEgeo, material)
                  // sphere.position.set(x + 0.1 * j, y + 0.1 * j, z + 0.1 * j)
                  // THREEGroup.add(sphere)
                  const particle = new THREE.Vector3(x + 0.2 * size * j, y + 0.2 * size * j, z + 0.2 * size * j)
                  geom.vertices.push(particle)
                  // console.log(particle)
                  // var color = new THREE.Color(0x00ff00);
                  // color.setHSL(color.getHSL().h, color.getHSL().s, color.getHSL().l);
                  // geom.colors.push(color);
                }
              }
            }
          }
        }
        const cloud = new THREE.Points(geom, material)

        THREEGroup.add(cloud)
      }
    }
  })

  const workingSpaceGUI = gui.addFolder('working space')

  workingSpaceGUI.add(guiHelper, 'show').onChange(() => {
    workingSpaceStore.dispatch('CHANGE_VISIBILITY', guiHelper.show)
  })
  workingSpaceGUI.add(guiHelper, 'step').min(0.1).max(5).step(0.1).onChange(() => {
    workingSpaceStore.dispatch('CHANGE_STEP', guiHelper.step)
  })

  const fun = {
    addPose() {

    },
    clearPoses() {

    },
  }

  workingSpaceGUI.add(fun, 'addPose').onChange(() => {
    workingSpaceStore.dispatch('ADD_POSE_TO_EULER', {
      rx: robotStore.getState().target.rotation.x,
      ry: robotStore.getState().target.rotation.y,
      rz: robotStore.getState().target.rotation.z,
      color: 0xffffff * (0.6 + 0.4 * Math.random()), // brighter colors
    })
  })
  workingSpaceGUI.add(fun, 'clearPoses').onChange(() => {
    workingSpaceStore.dispatch('REMOVE_POSES', {})
  })

  module.exports = function test() {
    console.log('todo')
  }
})
// todo -> get rid of scene injection using require scene -> threerobot handles 3d view
