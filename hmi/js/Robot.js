define((require, exports, module) => {
  const storeManager = require('State')
  const Kinematic = require('Kinematic')()

  localState = {
    jointOutOfBound: [false, false, false, false, false, false],
  }
  const maxAngleVelocity = 90.0 / (180.0 * Math.PI) / 1000.0
  const geo = [
    [2.5 + 2.3, 0, 7.3],
    [0, 0, 13.0],
    [1, 0, 2],
    [12.6, 0, 0],
    [0, 0, -3.6],
    [0, 0, 0],
  ]
  const defaultRobotState = {
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
    jointOutOfBound: [false, false, false, false, false, false],
    maxAngleVelocities: {
      J0: maxAngleVelocity,
      J1: maxAngleVelocity,
      J2: maxAngleVelocity,
      J3: maxAngleVelocity,
      J4: maxAngleVelocity,
      J5: maxAngleVelocity,
    },
    jointLimits: {
      J0: [-190, 190],
      J1: [-58, 90],
      J2: [-135, 40],
      J3: [-90, 75],
      J4: [-39, 141],
      J5: [-188, 181],
    },
    geometry: {
      V0: {
        x: geo[0][0],
        y: geo[0][1],
        z: geo[0][2],
      },
      V1: {
        x: geo[1][0],
        y: geo[1][1],
        z: geo[1][2],
      },
      V2: {
        x: geo[2][0],
        y: geo[2][1],
        z: geo[2][2],
      },
      V3: {
        x: geo[3][0],
        y: geo[3][1],
        z: geo[3][2],
      },
      V4: {
        x: geo[4][0],
        y: geo[4][1],
        z: geo[4][2],
      },
      V5: {
        x: geo[5][0],
        y: geo[5][1],
        z: geo[5][2],
      },
    },
  }
  const robotStore = storeManager.createStore('Robot', defaultRobotState)

  let IK

  function updateIK(geometry) {
    const geo = Object.values(geometry).map((val, i, array) => [val.x, val.y, val.z])
    // todo not optimal, since IK is a sideeffect
    IK = new Kinematic(geo, [ // todo remove when using new ik
      [-90, 90],
      [-58, 90],
      [-135, 40],
      [-90, 75],
      [-39, 141],
      [-188, 181],
    ])
  }

  robotStore.listen([state => state.geometry], (geometry) => {
    updateIK(geometry)
  })

  const calculateAngles = (state, position, rotation) => {
    const angles = []
    const result = IK.calculateAngles(
      position.x,
      position.y,
      position.z,
      rotation.x,
      rotation.y,
      rotation.z,
      angles
    )

    return {
      angles,
      result,
    }
  }

  /* --- Reducer --- */
  robotStore.action('ROBOT_CHANGE_TARGET', (state, data) => {
    const {
      angles,
      result,
    } = calculateAngles(state, data.position, data.rotation)
    return Object.assign({}, state, {
      target: {
        position: Object.assign({}, data.position),
        rotation: Object.assign({}, data.rotation),
      },
    }, {
      angles: {
        A0: angles[0],
        A1: angles[1],
        A2: angles[2],
        A3: angles[3],
        A4: angles[4],
        A5: angles[5],
      },
    }, {
      jointOutOfBound: [...result],
    })
  })

  robotStore.action('ROBOT_CHANGE_ANGLES', (state, angles) => {
    const TCPpose = []
    const result = IK.calculateTCP(
      angles.A0,
      angles.A1,
      angles.A2,
      angles.A3,
      angles.A4,
      angles.A5,
      TCPpose
    )

    IK.calculateAngles(TCPpose[0], TCPpose[1], TCPpose[2], TCPpose[3], TCPpose[4], TCPpose[5], angles)

    return Object.assign({}, state, {
      target: {
        position: {
          x: TCPpose[0],
          y: TCPpose[1],
          z: TCPpose[2],
        },
        rotation: {
          x: TCPpose[3],
          y: TCPpose[4],
          z: TCPpose[5],
        },
      },
    }, {
      angles: {
        A0: angles[0],
        A1: angles[1],
        A2: angles[2],
        A3: angles[3],
        A4: angles[4],
        A5: angles[5],
      },
    })
    // { todo
    //   jointOutOfBound: [...result],
    // }
  })

  robotStore.action('ROBOT_CHANGE_GEOMETRY', (state, data) => {
    const geo = Object.assign({}, state.geometry, data)
    updateIK(geo)
    const {
      angles,
      result,
    } = calculateAngles(state, state.target.position, state.target.rotation)
    return Object.assign({}, state, {
      angles: {
        A0: angles[0],
        A1: angles[1],
        A2: angles[2],
        A3: angles[3],
        A4: angles[4],
        A5: angles[5],
      },
    }, {
      jointOutOfBound: [...result],
    }, {
      geometry: {
        V0: {
          x: geo.V0.x,
          y: geo.V0.y,
          z: geo.V0.z,
        },
        V1: {
          x: geo.V1.x,
          y: geo.V1.y,
          z: geo.V1.z,
        },
        V2: {
          x: geo.V2.x,
          y: geo.V2.y,
          z: geo.V2.z,
        },
        V3: {
          x: geo.V3.x,
          y: geo.V3.y,
          z: geo.V3.z,
        },
        V4: {
          x: geo.V4.x,
          y: geo.V4.y,
          z: geo.V4.z,
        },
        V5: {
          x: geo.V5.x,
          y: geo.V5.y,
          z: geo.V5.z,
        },

      },
    })
  })

  module.exports = robotStore
})
// todo -> get rid of scene injection using require scene -> threerobot handles 3d view
