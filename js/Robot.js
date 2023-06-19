import { storeManager } from './State'
import { InverseKinematic as Kinematic } from './InverseKinematic'

const maxAngleVelocity = 90.0 / (180.0 * Math.PI) / 1000.0
const geo = [
    [0, 0, 0],
    [4.1, 0, 0],
    [3, 0, 0],
    [1.65, 0, 0],
    [1.7, 0, 0],
    [0, 0, 0],
  ]
const defaultRobotState = {
  target: {
    position: {
      x: 0,
      y: 10.5,
      z: 0,
    },
    rotation: {
      x: -((Math.PI)/2),
      y: 0,
      z: (Math.PI)/2,
    },
  },
  angles: {
    A0: (Math.PI)/2,
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
    J0: [-180 / 180 * Math.PI, 360 / 180 * Math.PI],
    J1: [-270 / 180 * Math.PI, 270 / 180 * Math.PI],
    J2: [-270 / 180 * Math.PI, 270 / 180 * Math.PI],
    J3: [-270 / 180 * Math.PI, 270 / 180 * Math.PI],
    J4: [-120 / 180 * Math.PI, 120 / 180 * Math.PI],
    J5: [-270 / 180 * Math.PI, 270 / 180 * Math.PI],
  },
  configuration: [false, false, false],
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
  },
}
const robotStore = storeManager.createStore('Robot', defaultRobotState)

let IK

function updateIK(geometry) {
  const geo = Object.values(geometry).map((val, i, array) => [val.x, val.y, val.z])
  // todo not optimal, since IK is a sideeffect
  IK = new Kinematic(geo)
}

robotStore.listen([state => state.geometry], (geometry) => {
  updateIK(geometry)
})

const calculateAngles = (jointLimits, position, rotation, configuration) => {
  const angles = []
  IK.calculateAngles(
    position.x,
    position.y,
    position.z,
    rotation.x,
    rotation.y,
    rotation.z,
    angles,
    configuration
  )

  var outOfBounds = [false, false, false, false, false, false]
  let i = 0
  for (const index in jointLimits) {
    if (angles[i] < jointLimits[index][0] || angles[i] > jointLimits[index][1]) {
      outOfBounds[i] = true
    }
    i++
  }

  return {
    angles,
    outOfBounds,
  }
}

/* --- Reducer --- */
robotStore.action('ROBOT_CHANGE_TARGET', (state, data) => {
  const {
    angles,
    outOfBounds,
  } = calculateAngles(state.jointLimits, data.position, data.rotation, state.configuration)

  let anglesDeg = angles.slice()
  for(let i = 0; i < anglesDeg.length; i++) {
    anglesDeg[i] = anglesDeg[i] / Math.PI * 180
  }

  // console.log(data.position)

  let invalid = false
  for(let out of outOfBounds) {
    if(out) invalid = true
  }
  for(let angle of angles) {
    if(isNaN(angle)) invalid = true
  }

  // console.log(invalid)

  if(!invalid) {
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
      jointOutOfBound: [...outOfBounds],
    })
  } else {
    return Object.assign({}, state, data)
  }
})

robotStore.action('ROBOT_CHANGE_ANGLES', (state, angles) => {
  const TCPpose = []
  IK.calculateTCP(
    angles.A0,
    angles.A1,
    angles.A2,
    angles.A3,
    angles.A4,
    angles.A5,
    TCPpose,
  )

  let anglesDeg = {
    A0: angles.A0 / Math.PI * 180,
    A1: angles.A1 / Math.PI * 180,
    A2: angles.A2 / Math.PI * 180,
    A3: angles.A3 / Math.PI * 180,
    A4: angles.A4 / Math.PI * 180,
    A5: angles.A5 / Math.PI * 180,
  }

  let invalid = false;

  let angleKeys = Object.keys(angles)
  let limitKeys = Object.keys(state.jointLimits)

  for(let i = 0; i < angleKeys.length; i++) {
    let angleKey = Object.keys(angles)[i]
    let limitKey = Object.keys(state.jointLimits)[i]

    if(angles[angleKey] < state.jointLimits[limitKey][0] ||
       angles[angleKey] > state.jointLimits[limitKey][1]) {
        invalid = true
       }
  }

  // IK.calculateAngles(TCPpose[0], TCPpose[1], TCPpose[2], TCPpose[3], TCPpose[4], TCPpose[5], angles)
  if(!invalid) {
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
        A0: angles.A0,
        A1: angles.A1,
        A2: angles.A2,
        A3: angles.A3,
        A4: angles.A4,
        A5: angles.A5,
      },
    })
  } else {
    return Object.assign({}, state, state)
  }
})

robotStore.action('ROBOT_CHANGE_GEOMETRY', (state, data) => {
  const geo = Object.assign({}, state.geometry, data)
  updateIK(geo)
  const {
    angles,
    outOfBounds,
  } = calculateAngles(state.jointLimits, state.target.position, state.target.rotation, state.configuration)
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
    jointOutOfBound: [...outOfBounds],
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
    },
  })
})

robotStore.action('ROBOT_CHANGE_JOINT_LIMITS', (state, data) => {
  const {
    outOfBounds,
  } = calculateAngles(state.jointLimits, state.target.position, state.target.rotation, state.configuration)
  return { ...state,
    jointOutOfBound: [...outOfBounds],
    jointLimits: { ...state.jointLimits,
      ...data,
    },
  }
})

robotStore.action('ROBOT_CHANGE_CONFIGURATION', (state, data) => {
  const {
    angles,
    outOfBounds,
  } = calculateAngles(state.jointLimits, state.target.position, state.target.rotation, data)
  return Object.assign({}, state, {
    angles: {
      A0: angles[0],
      A1: angles[1],
      A2: angles[2],
      A3: angles[3],
      A4: angles[4],
      A5: angles[5],
    },
    configuration: [...data],
    jointOutOfBound: [...outOfBounds],
  })
})

export { robotStore }
