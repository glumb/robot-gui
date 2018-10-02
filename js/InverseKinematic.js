define((require, exports, module) => {
  const Serial = {
    println(text) {
      // // console.log(text)
    },
  }

  function floatToString(float) {
    return `${float}`
  }

  const calculatedJointGeometry = []

  const arrows = {}

  function addArrow(name, from, to, color, length = 10) {
    // if (arrows.hasOwnProperty(name)) {
    //   debug.scene.remove(arrows[name])
    // }
    // const toPoint = new THREE.Vector3(to[0], to[1], to[2])
    // const origin = new THREE.Vector3(from[0], from[1], from[2])
    // // length = length || toPoint.sub(origin).length()
    // // toPoint.normalize()
    // color = color || 0xffff00
    // arrows[name] = new THREE.ArrowHelper(toPoint.sub(origin).normalize(), origin, length, color, 2, 1)
    // debug.scene.add(arrows[name])
  }

  function addVectorArrow(name, from, vector, color, length) {
    addArrow(name, from, [from[0] + vector[0], from[1] + vector[1], from[2] + vector[2]], color, length)
  }
  const spheres = {}

  function addSphere(name, position, color, diameter = 1) {
    if (spheres.hasOwnProperty(name)) {
      debug.scene.remove(spheres[name])
    }
    color = color || 0xffff00
    const geometry = new THREE.SphereGeometry(diameter, 32, 32)
    const material = new THREE.MeshBasicMaterial({
      color,
    })

    spheres[name] = new THREE.Mesh(geometry, material)
    spheres[name].position.set(position[0], position[1], position[2])
    debug.scene.add(spheres[name])
  }

  class InverseKinematic {
    constructor(geometry) {
      this.robotType = 'AXIS6'

      this.OK = 0
      this.OUT_OF_RANGE = 1
      this.OUT_OF_BOUNDS = 2

      this.V1_length_x_z = Math.sqrt(Math.pow(geometry[1][0], 2) + Math.pow(geometry[1][2], 2))
      this.V4_length_x_y_z = Math.sqrt(Math.pow(geometry[4][0], 2) + Math.pow(geometry[4][2], 2) + Math.pow(-geometry[4][1], 2))


      this.J_initial_absolute = []
      const tmpPos = [0, 0, 0]
      for (let i = 0; i < geometry.length; i++) {
        this.J_initial_absolute.push([tmpPos[0], tmpPos[1], tmpPos[2]])
        tmpPos[0] += geometry[i][0]
        tmpPos[1] += geometry[i][1]
        tmpPos[2] += geometry[i][2]
      }

      this.R_corrected = [0, 0, 0, 0, 0, 0]

      this.R_corrected[1] += Math.PI / 2
      this.R_corrected[1] -= Math.atan2(geometry[1][0], geometry[1][2]) // correct offset bone

      this.R_corrected[2] += Math.PI / 2
      this.R_corrected[2] += Math.atan2((geometry[2][2] + geometry[3][2]), (geometry[2][0] + geometry[3][0])) // correct offset bone V2,V3
      this.R_corrected[2] += Math.atan2(geometry[1][0], geometry[1][2]) // correct bone offset of V1

      this.R_corrected[4] += Math.PI / 2
      // this.R_corrected[4] -= Math.atan2(geometry[4][2], geometry[4][0])
      // console.log(`---------------------------------${Math.atan2(geometry[4][2], geometry[4][0])}`)
      this.geometry = geometry

      // debugger;
      // this.calculateCoordinates(0,0,0,0,0,0,[[],[],[],[],[],[],[],[],[]])
    }

    calculateAngles(x, y, z, a, b, c, angles, config = [false, false, false, false]) {
      const cc = Math.cos(c)
      const sc = Math.sin(c)
      const cb = Math.cos(b)
      const sb = Math.sin(b)
      const ca = Math.cos(a)
      const sa = Math.sin(a)


      const targetVectorZ = [
        sb, -sa * cb,
        ca * cb,
      ]


      if (this.robotType === 'AXIS4') {
        targetVectorX = [0, -1, 0]
      }

      const R = [
        this.R_corrected[0],
        this.R_corrected[1],
        this.R_corrected[2],
        this.R_corrected[3],
        this.R_corrected[4],
        this.R_corrected[5],
      ]

      const J = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]

      // ---- J5 ----

      J[5][0] = x
      J[5][1] = y
      J[5][2] = z
      addSphere('J5', J[5])
      // calculatedJointGeometry[5].position.set(J[5][0], J[5][1], J[5][2])

      // ---- J4 ----
      // vector

      J[4][0] = x - this.V4_length_x_y_z * targetVectorZ[0]
      J[4][1] = y - this.V4_length_x_y_z * targetVectorZ[1]
      J[4][2] = z - this.V4_length_x_y_z * targetVectorZ[2]
      addSphere('J4', J[4])
      // calculatedJointGeometry[4].position.set(J[4][0], J[4][1], J[4][2])

      // todo backwards rotation

      // ---- R0 ----
      // # J4

      const alphaR0 = Math.asin(this.J_initial_absolute[4][1] / this.length2(J[4][1], J[4][0]))
      R[0] += Math.atan2(J[4][1], J[4][0])
      R[0] += -alphaR0

      if (config[0]) {
        R[0] += 2 * alphaR0 - Math.PI
      }

      if (-this.J_initial_absolute[4][1] > this.length2(J[4][2], J[4][0])) {
        Serial.println('out of reach')
      }

      // ---- J1 ----
      // # R0

      J[1][0] = Math.cos(R[0]) * this.geometry[0][0] + Math.sin(R[0]) * -this.geometry[0][1]
      J[1][1] = Math.sin(R[0]) * this.geometry[0][0] + Math.cos(R[0]) * this.geometry[0][1]
      J[1][2] = this.geometry[0][2]
      addSphere('J1', J[1], 0x00ff00)
      // calculatedJointGeometry[1].position.set(J[1][0], J[1][1], J[1][2])

      // ---- rotate J4 into x,z plane ----
      // # J4 R0

      const J4_x_z = []

      J4_x_z[0] = Math.cos(R[0]) * J[4][0] + Math.sin(R[0]) * J[4][1]
      J4_x_z[1] = Math.sin(R[0]) * J[4][0] + Math.cos(R[0]) * -J[4][1] // 0
      J4_x_z[2] = J[4][2]
      addSphere('J4_x_z', J4_x_z, 0xff0000)
      // ---- J1J4_projected_length_square ----
      // # J4 R0

      const J1J4_projected_length_square = Math.pow(J4_x_z[0] - this.J_initial_absolute[1][0], 2) + Math.pow(J4_x_z[2] - this.J_initial_absolute[1][2], 2) // not using Math.sqrt

      // ---- R2 ----
      // # J4 R0

      const J2J4_length_x_z = this.length2(this.geometry[2][0] + this.geometry[3][0], this.geometry[2][2] + this.geometry[3][2])
      R[2] += ((config[1] ? !config[0] : config[0]) ? 1.0 : -1.0) * Math.acos((-J1J4_projected_length_square + Math.pow(J2J4_length_x_z, 2) + Math.pow(this.V1_length_x_z, 2)) / (2.0 * (J2J4_length_x_z) * this.V1_length_x_z))
      R[2] -= 2 * Math.PI

      R[2] = ((R[2] + 3 * Math.PI) % (2 * Math.PI)) - Math.PI // todo better clamp -180/180 degree
      // ---- R1 ----
      // # J4 R0

      const J1J4_projected_length = Math.sqrt(J1J4_projected_length_square)
      R[1] -= Math.atan2((J4_x_z[2] - this.J_initial_absolute[1][2]), (J4_x_z[0] - this.J_initial_absolute[1][0])) // a''
      R[1] += ((config[1] ? !config[0] : config[0]) ? 1.0 : -1.0) * Math.acos((J1J4_projected_length_square - Math.pow(J2J4_length_x_z, 2) + Math.pow(this.V1_length_x_z, 2)) / (2.0 * J1J4_projected_length * this.V1_length_x_z)) // a

      // ---- J2 ----
      // # R1 R0

      const ta = Math.cos(R[0])
      const tb = Math.sin(R[0])
      const tc = this.geometry[0][0]
      const d = this.geometry[0][2]
      const e = -this.geometry[0][1]
      const f = Math.cos(R[1])
      const g = Math.sin(R[1])
      const h = this.geometry[1][0]
      const i = this.geometry[1][2]
      const j = -this.geometry[1][1]
      const k = Math.cos(R[2])
      const l = Math.sin(R[2])
      const m = this.geometry[2][0]
      const n = this.geometry[2][2]
      const o = -this.geometry[2][1]

      J[2][0] = ta * tc + tb * e + ta * f * h - ta * -g * i + tb * j
      J[2][1] = -(-tb * tc + ta * e - tb * f * h + tb * -g * i + ta * j)
      J[2][2] = d + -g * h + f * i
      addSphere('J2', J[2], 0x0000ff)

      J[3][0] = J[2][0] + ta * f * k * m - ta * -g * -l * m - ta * -g * k * n - ta * f * -l * n + tb * o
      J[3][1] = J[2][1] - (-tb * f * k * m + tb * -g * -l * m + tb * -g * k * n + tb * f * -l * n + ta * o)
      J[3][2] = J[2][2] + -g * k * m + f * -l * m + f * k * n + g * -l * n
      addSphere('J3', J[3], 0x0000ff)
      // calculatedJointGeometry[3].position.set(J[3][0], J[3][1], J[3][2])

      // ---- J4J3 J4J5 ----
      // # J3 J4 J5

      const J4J5_vector = [J[5][0] - J[4][0], J[5][1] - J[4][1], J[5][2] - J[4][2]]
      const J4J3_vector = [J[3][0] - J[4][0], J[3][1] - J[4][1], J[3][2] - J[4][2]]

      // ---- R3 ----
      // J3 J4 J5

      // todo how to always point in one direction traveling from TCP vector
      const J4J5_J4J3_normal_vector = this.cross(J4J5_vector, J4J3_vector)
      // J4J5_J4J3_normal_vector[0] = Math.abs(J4J5_J4J3_normal_vector[0])
      // J4J5_J4J3_normal_vector[1] = Math.abs(J4J5_J4J3_normal_vector[1])
      // J4J5_J4J3_normal_vector[2] = Math.abs(J4J5_J4J3_normal_vector[2])

      // addVectorArrow('normal J4', J[4], J4J5_J4J3_normal_vector)

      const XY_parallel_aligned_vector = [
        10 * Math.cos(R[0] + (Math.PI / 2)), -(-10 * Math.sin(R[0] + (Math.PI / 2))),
        0,
      ]

      // addVectorArrow('normal J4 Y_vector', J[4], XZ_parallel_aligned_vector)
      // console.log(this.angleBetween(J4J5_J4J3_normal_vector, XY_parallel_aligned_vector, this.cross(XY_parallel_aligned_vector, [0, 0, 1])))
      // console.log(Math.abs(this.angleBetween(J4J5_J4J3_normal_vector, XY_parallel_aligned_vector, this.cross(XY_parallel_aligned_vector, [0, 0, 1]))) - Math.PI / 2 <= 0.0001)

      // static configuration
      if (Math.abs(this.angleBetween(J4J5_J4J3_normal_vector, XY_parallel_aligned_vector, this.cross(XY_parallel_aligned_vector, [0, 0, 1]))) - Math.PI / 2 >= 0.0001) {
        J4J5_J4J3_normal_vector[0] *= -1
        J4J5_J4J3_normal_vector[1] *= -1
        J4J5_J4J3_normal_vector[2] *= -1
      }

      const reference = this.cross(XY_parallel_aligned_vector, J4J3_vector)

      // addVectorArrow('normal J4 Y_vectors', J[4], reference, 0xff0000)
      addVectorArrow('XZ_parallel_aligned_vector', J[4], XY_parallel_aligned_vector, 0x0000ff)

      R[3] = this.angleBetween(J4J5_J4J3_normal_vector, XY_parallel_aligned_vector, reference)

      // console.log(`------------R3------------- ${R[3]}`)
      // console.log(`------------sign------------- ${sign}`)
      // console.log(`------------this.angleBetween------------- ${this.angleBetween(J4J5_J4J3_normal_vector, XZ_parallel_aligned_vector, reference)}`)

      // ---- R4 ----
      // #J4 J3 J5

      const reference_vector = this.cross(J4J3_vector, J4J5_J4J3_normal_vector)

      R[4] -= this.angleBetween(J4J5_vector, J4J3_vector, reference_vector)
      R[4] = ((3 / 2 * Math.PI + R[4]) % (2 * Math.PI)) - 3 / 2 * Math.PI // clamp angle
      // console.log(this.angleBetween(J4J5_vector, J4J3_vector, reference_vector))
      addVectorArrow('2', J[4], J4J5_J4J3_normal_vector, 0x00ff00)
      // console.log(this.angleBetween2(J4J5_vector, J4J3_vector))
      // ---- R5 ----

      const reference_vector3 = this.cross(J4J5_vector, [0, 0, 10])

      const reference_vector2 = this.cross(J4J5_vector, reference_vector3)

      const targetVectorY = [-cb * sc,
        ca * cc - sa * sb * sc,
        sa * cc + ca * sb * sc,
      ]

      // R[5] += -a
      // R[5] += Math.PI
      R[5] -= this.angleBetween(J4J5_J4J3_normal_vector, targetVectorY, this.cross(targetVectorZ, targetVectorY))
      // addVectorArrow('J4J5_J4J3_normal_vector', J[4], J4J5_J4J3_normal_vector, 0xff0000)
      if (R[5] > Math.PI) {
        R[5] = -Math.PI + (R[5] % Math.PI)
      }

      const PI = Math.PI

      // ---- Error handling ----

      const error = false
      const outOfBounds = [false, false, false, false, false, false]


      angles[0] = R[0]
      angles[1] = R[1]
      angles[2] = R[2]
      angles[3] = R[3]
      angles[4] = R[4]
      angles[5] = R[5]
    }

    calculateTCP(R0, R1, R2, R3, R4, R5, jointsResult) {
      const joints = [
        [],
        [],
        [],
        [],
        [],
        [],
      ]
      this.calculateCoordinates(R0, R1, R2, R3, R4, R5, joints)
      jointsResult[0] = joints[5][0]
      jointsResult[1] = joints[5][1]
      jointsResult[2] = joints[5][2]
      jointsResult[3] = joints[5][3]
      jointsResult[4] = joints[5][4]
      jointsResult[5] = joints[5][5]
    }

    calculateCoordinates(R0, R1, R2, R3, R4, R5, jointsResult) {
      const a = Math.cos(R0)
      const b = Math.sin(R0)
      const c = this.geometry[0][0]
      const d = this.geometry[0][1]
      const e = this.geometry[0][2]
      const f = Math.cos(R1)
      const g = Math.sin(R1)
      const h = this.geometry[1][0]
      const i = this.geometry[1][1]
      const j = this.geometry[1][2]
      const k = Math.cos(R2)
      const l = Math.sin(R2)
      const m = this.geometry[2][0]
      const n = this.geometry[2][1]
      const o = this.geometry[2][2]
      const p = Math.cos(R3)
      const q = Math.sin(R3)
      const r = this.geometry[3][0]
      const s = this.geometry[3][1]
      const t = this.geometry[3][2]
      const u = Math.cos(R4)
      const v = Math.sin(R4)
      const w = this.geometry[4][0]
      const x = this.geometry[4][1]
      const y = this.geometry[4][2]
      const A = Math.cos(R5)
      const B = Math.sin(R5)

      jointsResult[0][0] = 0
      jointsResult[0][1] = 0
      jointsResult[0][2] = 0

      jointsResult[1][0] = jointsResult[0][0] + a * c - b * d
      jointsResult[1][1] = jointsResult[0][1] + b * c + a * d
      jointsResult[1][2] = jointsResult[0][2] + e

      jointsResult[2][0] = jointsResult[1][0] + a * f * h - b * i + a * g * j
      jointsResult[2][1] = jointsResult[1][1] + b * f * h + a * i + b * g * j
      jointsResult[2][2] = jointsResult[1][2] + -g * h + f * j

      jointsResult[3][0] = jointsResult[2][0] + a * f * k * m - a * g * l * m - b * n + a * g * k * o + a * f * l * o
      jointsResult[3][1] = jointsResult[2][1] + b * f * k * m - b * g * l * m + a * n + b * g * k * o + b * f * l * o
      jointsResult[3][2] = jointsResult[2][2] - g * k * m - f * l * m + f * k * o - g * l * o

      jointsResult[4][0] = jointsResult[3][0] + a * f * k * r - a * g * l * r - b * p * s + a * g * k * q * s + a * f * l * q * s + a * g * k * p * t + a * f * l * p * t + b * q * t
      jointsResult[4][1] = jointsResult[3][1] + b * f * k * r - b * g * l * r + a * p * s + b * g * k * q * s + b * f * l * q * s + b * g * k * p * t + b * f * l * p * t - a * q * t
      jointsResult[4][2] = jointsResult[3][2] - g * k * r - f * l * r + f * k * q * s - g * l * q * s + f * k * p * t - g * l * p * t

      jointsResult[5][0] = jointsResult[4][0] + a * f * k * u * w - a * g * l * u * w - a * g * k * p * v * w - a * f * l * p * v * w - b * q * v * w - b * p * x + a * g * k * q * x + a * f * l * q * x + a * g * k * p * u * y + a * f * l * p * u * y + b * q * u * y + a * f * k * v * y - a * g * l * v * y
      jointsResult[5][1] = jointsResult[4][1] + b * f * k * u * w - b * g * l * u * w - b * g * k * p * v * w - b * f * l * p * v * w + a * q * v * w + a * p * x + b * g * k * q * x + b * f * l * q * x + b * g * k * p * u * y + b * f * l * p * u * y - a * q * u * y + b * f * k * v * y - b * g * l * v * y
      jointsResult[5][2] = jointsResult[4][2] - g * k * u * w - f * l * u * w - f * k * p * v * w + g * l * p * v * w + f * k * q * x - g * l * q * x + f * k * p * u * y - g * l * p * u * y - g * k * v * y - f * l * v * y

      const M = [
        [-B * b * p - -B * a * g * k * q - -B * a * f * l * q - A * a * f * k * u + A * a * g * l * u + A * a * g * k * p * v + A * a * f * l * p * v + A * b * q * v, -A * b * p + A * a * g * k * q + A * a * f * l * q - -B * a * f * k * u + -B * a * g * l * u + -B * a * g * k * p * v + -B * a * f * l * p * v + -B * b * q * v, -a * g * k * p * u - a * f * l * p * u - b * q * u - a * f * k * v + a * g * l * v, 0],
        [+B * a * p - -B * b * g * k * q - -B * b * f * l * q - A * b * f * k * u + A * b * g * l * u + A * b * g * k * p * v + A * b * f * l * p * v - A * a * q * v, A * a * p + A * b * g * k * q + A * b * f * l * q - -B * b * f * k * u + -B * b * g * l * u + -B * b * g * k * p * v + -B * b * f * l * p * v - -B * a * q * v, -b * g * k * p * u - b * f * l * p * u + a * q * u - b * f * k * v + b * g * l * v, 0],
        [+B * f * k * q + -B * g * l * q + A * g * k * u + A * f * l * u + A * f * k * p * v - A * g * l * p * v, A * f * k * q - A * g * l * q + -B * g * k * u + -B * f * l * u + -B * f * k * p * v - -B * g * l * p * v, -f * k * p * u + g * l * p * u + g * k * v + f * l * v, 0],
      ]

      // https://www.geometrictools.com/Documentation/EulerAngles.pdf
      let thetaY,
        thetaX,
        thetaZ
      if (M[0][2] < 1) {
        if (M[0][2] > -1) {
          thetaY = Math.asin(M[0][2])
          thetaX = Math.atan2(-M[1][2], M[2][2])
          thetaZ = Math.atan2(-M[0][1], M[0][0])
        } else {
          thetaY = -Math.PI / 2
          thetaX = -Math.atan2(M[1][0], M[1][1])
          thetaZ = 0
        }
      } else {
        thetaY = +Math.PI / 2
        thetaX = Math.atan2(M[1][0], M[1][1])
        thetaZ = 0
      }


      jointsResult[5][3] = thetaX
      jointsResult[5][4] = thetaY
      jointsResult[5][5] = thetaZ
    }

    cross(vectorA, vectorB, result = []) {
      result[0] = vectorA[1] * vectorB[2] - vectorA[2] * vectorB[1]
      result[1] = vectorA[2] * vectorB[0] - vectorA[0] * vectorB[2]
      result[2] = vectorA[0] * vectorB[1] - vectorA[1] * vectorB[0]
      return result
    }

    dot(vectorA, vectorB) {
      return vectorA[0] * vectorB[0] + vectorA[1] * vectorB[1] + vectorA[2] * vectorB[2]
    }

    /**
     * @param  {array} vectorA         angle from
     * @param  {array} vectorB         angle to
     * @param  {array} referenceVector angle to set 0 degree from. coplanar with vecA and vecB
     * @return {number}                 description
     * @example angleBetween([1,0,0],[0,1,0],[0,0,1]) // PI/2
     */
    angleBetween(vectorA, vectorB, referenceVector) {
      // angle = atan2(norm(cross(a, b)), dot(a, b))

      const norm = this.length3(this.cross(vectorA, vectorB))

      const angle = Math.atan2(norm, (vectorB[0] * vectorA[0] + vectorB[1] * vectorA[1] + vectorB[2] * vectorA[2]))

      const tmp = referenceVector[0] * vectorA[0] + referenceVector[1] * vectorA[1] + referenceVector[2] * vectorA[2]

      const sign = (tmp > 0.0001) ? 1.0 : -1.0

      return angle * sign
    }

    length3(vector) {
      return Math.sqrt(Math.pow(vector[0], 2) + Math.pow(vector[1], 2) + Math.pow(vector[2], 2))
    }

    length2(a, b) {
      return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2))
    }

    angleBetween2(v1, v2) {
      let angle
      // turn vectors into unit vectors
      // this.normalize(v1,v1)
      // this.normalize(v2,v2)
      //
      // var angle = Math.acos(this.dot(v1, v2))
      // // if no noticable rotation is available return zero rotation
      // // this way we avoid Cross product artifacts
      // if (Math.abs(angle) < 0.0001) return 0
      // // in this case there are 2 lines on the same axis
      // // // angle = atan2(norm(cross(a, b)), dot(a, b))
      const cross = this.cross(v1, v2)

      return Math.atan2(this.length3(cross), this.dot(v1, v2))
    }
    normalize(vector, result) {
      const length = Math.sqrt((vector[0] * vector[0]) + (vector[1] * vector[1]) + (vector[2] * vector[2]))
      result[0] = vector[0] / length
      result[1] = vector[1] / length
      result[2] = vector[2] / length
    }
  }

  function kinematic() {
    return InverseKinematic
  }

  module.exports = InverseKinematic
})
