const Serial = {
  println(text) {
    // console.log(text)
  },
}

function floatToString(float) {
  return `${float}`
}

const calculatedJointGeometry = []

const arrows = {}

function addArrow(name, from, to, color, length) {
  if (arrows.hasOwnProperty(name)) {
    debug.scene.remove(arrows[name])
  }
  const dir = new THREE.Vector3(to[0], to[1], to[2])
  const origin = new THREE.Vector3(from[0], from[1], from[2])
  length = length || dir.sub(origin).length()
  dir.normalize()
  color = color || 0xffff00
  arrows[name] = new THREE.ArrowHelper(dir, origin, length, color, 2, 1)
  debug.scene.add(arrows[name])
}

function addVectorArrow(name, from, vector, color, length) {
  addArrow(name, from, [from[0] + vector[0], from[1] + vector[1], from[2] + vector[2]], color, length)
}

class InverseKinematic {
  constructor(geometry, jointLimits) {
    this.OK = 0
    this.OUT_OF_RANGE = 1
    this.OUT_OF_BOUNDS = 2
      // todo debug remove
    for (var i = 0; i < 6; i++) {
      const sphereGeom = new THREE.SphereGeometry(1, 32, 32)
      const sphereM = new THREE.Mesh(sphereGeom, new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.5,
        color: 0xfff50,
      }))
        // debug.scene.add(sphereM)
      calculatedJointGeometry.push(sphereM)
    }

    this.V1_length_x_y = Math.sqrt(Math.pow(geometry[1][0], 2) + Math.pow(geometry[1][1], 2))
    this.V4_length_x_y_z = Math.sqrt(Math.pow(geometry[4][0], 2) + Math.pow(geometry[4][1], 2) + Math.pow(geometry[4][2], 2))

    this.jointLimits = []
    for (var i = 0; i < 6; i++) {
      this.jointLimits[i] = []
      this.jointLimits[i][0] = jointLimits[i][0] / 180 * Math.PI
      this.jointLimits[i][1] = jointLimits[i][1] / 180 * Math.PI
    }

    this.geometry = geometry

    this.J_initial_absolute = []
    const tmpPos = [0, 0, 0]
    for (var i = 0; i < geometry.length; i++) {
      this.J_initial_absolute.push([tmpPos[0], tmpPos[1], tmpPos[2]])
      tmpPos[0] += geometry[i][0]
      tmpPos[1] += geometry[i][1]
      tmpPos[2] += geometry[i][2]
    }

    this.R_corrected = [0, 0, 0, 0, 0, 0]

    this.R_corrected[1] -= Math.PI / 2
    this.R_corrected[1] += Math.atan2(geometry[1][0], geometry[1][1]) // correct offset bone

    this.R_corrected[2] -= Math.PI / 2
    this.R_corrected[2] -= Math.atan2((geometry[2][1] + geometry[3][1]), (geometry[2][0] + geometry[3][0])) // correct offset bone V2,V3
    this.R_corrected[2] -= Math.atan2(geometry[1][0], geometry[1][1]) // correct bone offset of V1

    // this.R_corrected[4] += Math.PI / 2;
    this.R_corrected[4] += Math.atan2(geometry[4][1], geometry[4][0])
    console.log(`---------------------------------${Math.atan2(geometry[4][1], geometry[4][0])}`)
  }

  calculateAngles(x, y, z, a, b, c, angles) {
    console.log(x, y, z, a, b, c)

    const ca = Math.cos(a)
    const sb = Math.sin(a)
    const cc = Math.cos(b)
    const sd = Math.sin(b)
    const ce = Math.cos(c)
    const sf = Math.sin(c)

    const targetVectorX = [
      cc * ce,
      cc * sf, -sd,
    ]

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

    calculatedJointGeometry[5].position.set(J[5][0], J[5][1], J[5][2])

    // ---- J4 ----
    // vector

    J[4][0] = x - this.V4_length_x_y_z * targetVectorX[0]
    J[4][1] = y - this.V4_length_x_y_z * targetVectorX[1]
    J[4][2] = z - this.V4_length_x_y_z * targetVectorX[2]

    calculatedJointGeometry[4].position.set(J[4][0], J[4][1], J[4][2])

    // todo backwards rotation

    // ---- R0 ----
    // # J4

    R[0] += Math.PI / 2 - Math.acos(this.J_initial_absolute[4][2] / this.length2(J[4][2], J[4][0]))
    R[0] += Math.atan2(-J[4][2], J[4][0])

    if (this.J_initial_absolute[4][2] > this.length2(J[4][2], J[4][0])) {
      Serial.println('out of reach')
    }

    //                plane.rotation.y = R[0]

    // ---- J1 ----
    // # R0

    J[1][0] = Math.cos(R[0]) * this.geometry[0][0] + Math.sin(R[0]) * this.geometry[0][2]
    J[1][1] = this.geometry[0][1]
    J[1][2] = -Math.sin(R[0]) * this.geometry[0][0] + Math.cos(R[0]) * this.geometry[0][2]

    calculatedJointGeometry[1].position.set(J[1][0], J[1][1], J[1][2])

    // ---- rotate J4 into x,y plane ----
    // # J4 R0

    const J4_x_y = []

    J4_x_y[0] = Math.cos(R[0]) * J[4][0] + -Math.sin(R[0]) * J[4][2]
    J4_x_y[1] = J[4][1]
    J4_x_y[2] = Math.sin(R[0]) * J[4][0] + Math.cos(R[0]) * J[4][2]

    // ---- J1J4_projected_length_square ----
    // # J4 R0

    const J1J4_projected_length_square = Math.pow(J4_x_y[0] - this.J_initial_absolute[1][0], 2) + Math.pow(J4_x_y[1] - this.J_initial_absolute[1][1], 2) // not using Math.sqrt

    // ---- R2 ----
    // # J4 R0

    const J2J4_length_x_y = this.length2(this.geometry[2][0] + this.geometry[3][0], this.geometry[2][1] + this.geometry[3][1])
    R[2] += Math.acos((-J1J4_projected_length_square + Math.pow(J2J4_length_x_y, 2) + Math.pow(this.V1_length_x_y, 2)) / (2.0 * (J2J4_length_x_y) * this.V1_length_x_y))

    // ---- R1 ----
    // # J4 R0

    const J1J4_projected_length = Math.sqrt(J1J4_projected_length_square)
    R[1] += Math.atan2((J4_x_y[1] - this.J_initial_absolute[1][1]), (J4_x_y[0] - this.J_initial_absolute[1][0]))
    R[1] += Math.acos((+J1J4_projected_length_square - Math.pow(J2J4_length_x_y, 2) + Math.pow(this.V1_length_x_y, 2)) / (2.0 * J1J4_projected_length * this.V1_length_x_y))

    // ---- J2 ----
    // # R1 R0

    const ta = Math.cos(R[0])
    const tb = Math.sin(R[0])
    const tc = this.geometry[0][0]
    const d = this.geometry[0][1]
    const e = this.geometry[0][2]
    const f = Math.cos(R[1])
    const g = Math.sin(R[1])
    const h = this.geometry[1][0]
    const i = this.geometry[1][1]
    const j = this.geometry[1][2]
    const k = Math.cos(R[2])
    const l = Math.sin(R[2])
    const m = this.geometry[2][0]
    const n = this.geometry[2][1]
    const o = this.geometry[2][2]

    J[2][0] = ta * tc + tb * e + ta * f * h - ta * g * i + tb * j
    J[2][1] = d + g * h + f * i
    J[2][2] = -tb * tc + ta * e - tb * f * h + tb * g * i + ta * j

    // addArrow('J2', [0, 0, 0], J[2])
    calculatedJointGeometry[2].position.set(J[2][0], J[2][1], J[2][2])

    // ---- J3 ----
    // # R0 R1 R2

    J[3][0] = ta * tc + tb * e + ta * f * h - ta * g * i + tb * j + ta * f * k * m - ta * g * l * m - ta * g * k * n - ta * f * l * n + tb * o
    J[3][1] = d + g * h + f * i + g * k * m + f * l * m + f * k * n - g * l * n
    J[3][2] = -tb * tc + ta * e - tb * f * h + tb * g * i + ta * j - tb * f * k * m + tb * g * l * m + tb * g * k * n + tb * f * l * n + ta * o

    calculatedJointGeometry[3].position.set(J[3][0], J[3][1], J[3][2])

    // ---- J4J3 J4J5 ----
    // # J3 J4 J5

    const J4J5_vector = [J[5][0] - J[4][0], J[5][1] - J[4][1], J[5][2] - J[4][2]]
    const J4J3_vector = [J[3][0] - J[4][0], J[3][1] - J[4][1], J[3][2] - J[4][2]]

    // ---- R3 ----
    // J3 J4 J5

    const J4J5_J4J3_normal_vector = this.cross(J4J5_vector, J4J3_vector)

    // addVectorArrow('normal J4', J[4], J4J5_J4J3_normal_vector)

    const XZ_parallel_aligned_vector = [10 * Math.cos(R[0] + (Math.PI / 2)),
      0, -10 * Math.sin(R[0] + (Math.PI / 2)),
    ]

    // addVectorArrow('normal J4 Y_vector', J[4], XZ_parallel_aligned_vector)

    const reference = this.cross(XZ_parallel_aligned_vector, J4J3_vector)

    // addVectorArrow('normal J4 Y_vectors', J[4], reference)

    const tmp = this.dot(reference, J4J5_J4J3_normal_vector)

    const sign = (tmp > 0) ? 1.0 : -1.0

    R[3] = this.angleBetween(J4J5_J4J3_normal_vector, XZ_parallel_aligned_vector, reference)

    console.log(`------------R3------------- ${R[3]}`)
    console.log(`------------sign------------- ${sign}`)
    console.log(`------------this.angleBetween------------- ${this.angleBetween(J4J5_J4J3_normal_vector, XZ_parallel_aligned_vector, reference)}`)

    // ---- R4 ----
    // #J4 J3 J5

    const reference_vector = this.cross(J4J3_vector, J4J5_J4J3_normal_vector)

    R[4] += this.angleBetween(J4J5_vector, J4J3_vector, reference_vector)
      // addVectorArrow('2', J[5], reference_vector, 0x00ff00)

    // ---- R5 ----

    const reference_vector3 = this.cross(J4J5_vector, [0, 10, 0])

    const reference_vector2 = this.cross(J4J5_vector, reference_vector3)

    // addVectorArrow('32', J[5], reference_vector3, 0x0000ff)
    // const ca = Math.cos(a)
    // const sb = Math.sin(a)
    // const cc = Math.cos(b)
    // const sd = Math.sin(b)
    // const ce = Math.cos(c)
    // const sf = Math.sin(c)
    // b*d*e-f*x
    // b*d*f+e*x
    //    b*c
    const targetVectorY = [
      sb * sd * ce - sf * ca,
      sb * sd * sf + ce * ca,
      sb * cc,
    ]

    // R[5] += -a
    R[5] += Math.PI / 2
    R[5] -= this.angleBetween(J4J5_J4J3_normal_vector, targetVectorY, this.cross(targetVectorY, targetVectorX))

    // R[5] %= 360 / 180 * Math.PI
    //   // configuration
    // if (R[5] > 180 / 180 * Math.PI) {
    //   R[5] -= 360 / 180 * Math.PI
    // } else if (R[5] < -180 / 180 * Math.PI) {
    //   R[5] += 360 / 180 * Math.PI
    // }

    // R[5] += +R[3]
    // addArrow('e2', J[5], J4J5_J4J3_normal_vector, 0x00ff00, 5)
    // addArrow('e3', J[5], targetVectorY, 0x0000ff, 5)
    // addArrow('e4', J[5], targetVectorX, 0xff0000, 5)
    // addArrow('e5', J[5], [0, 0, 1], 0xffff00, 5)
    // addVectorArrow('2', J[5], J4J5_J4J3_normal_vector, 0x00ff00, 5)

    // ---- check and flip R3 R4 if needed ----

    //            var difference = current_R[ 3 ] - R[ 3 ];
    //
    //            if ( difference > 0.5 * Math.PI || difference < - 0.5 * Math.PI ) {
    //                Serial.println( "----------- flipping R3 - distance closer -------------" );
    //                Serial.println( "----------- R3 before " + floatToString( R[ 3 ] ) + " -------------" );
    //                R[ 3 ] = (R[ 3 ] > 0.0) ? R[ 3 ] - Math.PI : R[ 3 ] + Math.PI;
    //                //R[3] =  R[3] + 180.0;
    //                R[ 4 ] = - R[ 4 ];
    //                //R[4] = 0;
    //            } else {
    //                //Serial.println("----------- not flipping R3 - currentR3 " + floatToString(current_R[3]) + " ------------- R3 " + floatToString(R[3]));
    //            }

    // ---- Error handling ----

    let error = false
    const outOfBounds = [false, false, false, false, false, false]

    for (let ij = 0; ij < 6; ij++) {
      if (isNaN(R[ij])) {
        Serial.println(`E A_${String(ij)} out of reach `)
        error = true
      } else if (R[ij] < this.jointLimits[ij][0] || R[ij] > this.jointLimits[ij][1]) {
        Serial.println(`E A_${String(ij)} out of bounds ${floatToString(R[ij] / Math.PI * 180.0)}`)
        Serial.println(`E A_${String(ij)} bounds ${floatToString(this.jointLimits[ij][1] / Math.PI * 180.0)}`)
        Serial.println(`E A_${String(ij)} bounds ${floatToString(this.jointLimits[ij][0] / Math.PI * 180.0)}`)
        outOfBounds[ij] = true
        error = true
      }
    }

    angles[0] = R[0]
    angles[1] = R[1]
    angles[2] = R[2]
    angles[3] = R[3]
    angles[4] = R[4]
    angles[5] = R[5]

    if (!error) {
      // todo set A . While moving, print to serial

      Serial.println(`R0 ${floatToString(R[0])}`)
      Serial.println(`R1 ${floatToString(R[1])}`)
      Serial.println(`R2 ${floatToString(R[2])}`)
      Serial.println(`R3 ${floatToString(R[3])}`)
      Serial.println(`R4 ${floatToString(R[4])}`)
      Serial.println(`R5 ${floatToString(R[5])}`)

      //                Serial.println( "JD X" + floatToString( normal_J2J4_zAxis[ 0 ] ) + " Y" + floatToString( normal_J2J4_zAxis[ 1 ] ) + " Z" + floatToString( normal_J2J4_zAxis[ 2 ] ) );
      //                Serial.println( "JE X" + floatToString( normal_J2J4_vector[ 0 ] ) + " Y" + floatToString( normal_J2J4_vector[ 1 ] ) + " Z" + floatToString( normal_J2J4_vector[ 2 ] ) );

      Serial.println(`J0 X${floatToString(J[0][0])} Y${floatToString(J[0][1])} Z${floatToString(J[0][2])}`)
      Serial.println(`J1 X${floatToString(J[1][0])} Y${floatToString(J[1][1])} Z${floatToString(J[1][2])}`)
      Serial.println(`J2 X${floatToString(J[2][0])} Y${floatToString(J[2][1])} Z${floatToString(J[2][2])}`)
      Serial.println(`J4 X${floatToString(J[4][0])} Y${floatToString(J[4][1])} Z${floatToString(J[4][2])}`)
      Serial.println(`J5 X${floatToString(J[5][0])} Y${floatToString(J[5][1])} Z${floatToString(J[5][2])}`)

      Serial.println(`J5 A ${a} B ${b} C ${c}`)

      // this.calculateCoordinates(R[0], R[1], R[2], R[3], R[4], R[5], [[], [], [], [], [], []])
    }
    return outOfBounds
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
    const C = 0 // this.geometry[5][0]
    const D = 0 // this.geometry[5][1]
    const E = 0 // this.geometry[5][2]

    jointsResult[0][0] = 0
    jointsResult[0][1] = 0
    jointsResult[0][2] = 0

    jointsResult[1][0] = jointsResult[0][0] + a * c + b * e
    jointsResult[1][1] = jointsResult[0][1] + d
    jointsResult[1][2] = jointsResult[0][2] + -b * c + a * e

    jointsResult[2][0] = jointsResult[1][0] + a * f * h - a * g * i + b * j
    jointsResult[2][1] = jointsResult[1][1] + g * h + f * i
    jointsResult[2][2] = jointsResult[1][2] - b * f * h + b * g * i + a * j

    jointsResult[3][0] = jointsResult[2][0] + a * f * k * m - a * g * l * m - a * g * k * n - a * f * l * n + b * o
    jointsResult[3][1] = jointsResult[2][1] + g * k * m + f * l * m + f * k * n - g * l * n
    jointsResult[3][2] = jointsResult[2][2] - b * f * k * m + b * g * l * m + b * g * k * n + b * f * l * n + a * o

    jointsResult[4][0] = jointsResult[3][0] + a * f * k * r - a * g * l * r - a * g * k * p * s - a * f * l * p * s + b * q * s + b * p * t + a * g * k * q * t + a * f * l * q * t
    jointsResult[4][1] = jointsResult[3][1] + g * k * r + f * l * r + f * k * p * s - g * l * p * s - f * k * q * t + g * l * q * t
    jointsResult[4][2] = jointsResult[3][2] - b * f * k * r + b * g * l * r + b * g * k * p * s + b * f * l * p * s + a * q * s + a * p * t - b * g * k * q * t - b * f * l * q * t

    jointsResult[5][0] = jointsResult[4][0] + a * f * k * u * w - a * g * l * u * w - a * g * k * p * v * w - a * f * l * p * v * w + b * q * v * w - a * g * k * p * u * x - a * f * l * p * u * x + b * q * u * x - a * f * k * v * x + a * g * l * v * x + b * p * y + a * g * k * q * y + a * f * l * q * y
    jointsResult[5][1] = jointsResult[4][1] + g * k * u * w + f * l * u * w + f * k * p * v * w - g * l * p * v * w + f * k * p * u * x - g * l * p * u * x - g * k * v * x - f * l * v * x - f * k * q * y + g * l * q * y
    jointsResult[5][2] = jointsResult[4][2] - b * f * k * u * w + b * g * l * u * w + b * g * k * p * v * w + b * f * l * p * v * w + a * q * v * w + b * g * k * p * u * x + b * f * l * p * u * x + a * q * u * x + b * f * k * v * x - b * g * l * v * x + a * p * y - b * g * k * q * y - b * f * l * q * y

    let M = [
      [-B * b * p - B * a * g * k * q - B * a * f * l * q + A * a * f * k * u - A * a * g * l * u - A * a * g * k * p * v - A * a * f * l * p * v + A * b * q * v, -a * g * k * p * u - a * f * l * p * u + b * q * u - a * f * k * v + a * g * l * v, A * b * p + A * a * g * k * q + A * a * f * l * q + B * a * f * k * u - B * a * g * l * u - B * a * g * k * p * v - B * a * f * l * p * v + B * b * q * v],
      [B * f * k * q - B * g * l * q + A * g * k * u + A * f * l * u + A * f * k * p * v - A * g * l * p * v, f * k * p * u - g * l * p * u - g * k * v - f * l * v, -A * f * k * q + A * g * l * q + B * g * k * u + B * f * l * u + B * f * k * p * v - B * g * l * p * v],
      [-B * a * p + B * b * g * k * q + B * b * f * l * q - A * b * f * k * u + A * b * g * l * u + A * b * g * k * p * v + A * b * f * l * p * v + A * a * q * v, b * g * k * p * u + b * f * l * p * u + a * q * u + b * f * k * v - b * g * l * v, A * a * p - A * b * g * k * q - A * b * f * l * q - B * b * f * k * u + B * b * g * l * u + B * b * g * k * p * v + B * b * f * l * p * v + B * a * q * v],
    ]
    // const M = [
    //     [B * f * k * q - B * g * l * q + A * g * k * u + A * f * l * u + A * f * k * p * v - A * g * l * p * v, f * k * p * u - g * l * p * u - g * k * v - f * l * v, -A * f * k * q + A * g * l * q + B * g * k * u + B * f * l * u + B * f * k * p * v - B * g * l * p * v],
    //     [B * b * p + B * a * g * k * q + B * a * f * l * q - A * a * f * k * u + A * a * g * l * u + A * a * g * k * p * v + A * a * f * l * p * v - A * b * q * v, a * g * k * p * u + a * f * l * p * u - b * q * u + a * f * k * v - a * g * l * v, -A * b * p - A * a * g * k * q - A * a * f * l * q - B * a * f * k * u + B * a * g * l * u + B * a * g * k * p * v + B * a * f * l * p * v - B * b * q * v],
    //     [-B * a * p + B * b * g * k * q + B * b * f * l * q - A * b * f * k * u + A * b * g * l * u + A * b * g * k * p * v + A * b * f * l * p * v + A * a * q * v, b * g * k * p * u + b * f * l * p * u + a * q * u + b * f * k * v - b * g * l * v, A * a * p - A * b * g * k * q - A * b * f * l * q - B * b * f * k * u + B * b * g * l * u + B * b * g * k * p * v + B * b * f * l * p * v + B * a * q * v],
    // ]
    M = [
[a * g * k * p * u + a * f * l * p * u - b * q * u + a * f * k * v - a * g * l * v,	-B * b * p - B * a * g * k * q - B * a * f * l * q + A * a * f * k * u - A * a * g * l * u - A * a * g * k * p * v - A * a * f * l * p * v + A * b * q * v,	A * b * p + A * a * g * k * q + A * a * f * l * q + B * a * f * k * u - B * a * g * l * u - B * a * g * k * p * v - B * a * f * l * p * v + B * b * q * v],
[-f * k * p * u + g * l * p * u + g * k * v + f * l * v, B * f * k * q - B * g * l * q + A * g * k * u + A * f * l * u + A * f * k * p * v - A * g * l * p * v, -A * f * k * q + A * g * l * q + B * g * k * u + B * f * l * u + B * f * k * p * v - B * g * l * p * v],
[-b * g * k * p * u - b * f * l * p * u - a * q * u - b * f * k * v + b * g * l * v,	-B * a * p + B * b * g * k * q + B * b * f * l * q - A * b * f * k * u + A * b * g * l * u + A * b * g * k * p * v + A * b * f * l * p * v + A * a * q * v,	A * a * p - A * b * g * k * q - A * b * f * l * q - B * b * f * k * u + B * b * g * l * u + B * b * g * k * p * v + B * b * f * l * p * v + B * a * q * v],]
      // todo convert to euler angles
      //
      // -A * b * p + A * a * g * k * q + A * a * f * l * q - B * a * f * k * u + B * a * g * l * u + B * a * g * k * p * v + B * a * f * l * p * v + B * b * q * v
      //
      //     if (R31 !== 1 || R31 !== -1) {
      //   θ1 = −Math.asin(R31)
      //   θ2 = Math.PI− θ1
      //   ψ1 = Math.atan2(R32 / Math.cos(θ1), R33 / Math.cos(θ1))
      //   ψ2 = Math.atan2(R32 / Math.cos(θ2), R33 / Math.cos(θ2))
      //   φ1 = Math.atan2(R21 / Math.cos(θ1), R11 / Math.cos(θ1))
      //   φ2 = Math.atan2(R21 / Math.cos(θ2), R11 / Math.cos(θ2))
      // } else {
      //   φ = 0 // anything; can set to
      //   if (R31 = −1) {
      //     θ = Math.PI / 2
      //     ψ = φ + Math.atan2(R12, R13)
      //   } else {
      //     θ = −Math.PI / 2
      //     ψ = −φ + Math.atan2(−R12, −R13)
      //   }
      // }
      //
      // http://www.staff.city.ac.uk/~sbbh653/publications/euler.pdf

    // debug.mesh.matrixAutoUpdate = false
    // debug.mesh.matrix.set(
    //   M[0][0], M[0][1], M[0][2], 0,
    //   M[1][0], M[1][1], M[1][2], 0,
    //   M[2][0], M[2][1], M[2][2], 0,
    //   0, 0, 0, 1
    // )

    let θ = 0
    let ψ = 0
    let φ = 0
    if (M[2][0] !== 1 || M[2][0] !== -1) {
      θ = Math.PI + Math.asin(M[2][0])
      ψ = Math.atan2(M[2][1] / Math.cos(θ), M[2][2] / Math.cos(θ))
      φ = Math.atan2(M[1][0] / Math.cos(θ), M[0][0] / Math.cos(θ))
    } else {
      φ = 0 // anything; can set to
      if (M[2][0] === -1) {
        θ = Math.PI / 2
        ψ = φ + Math.atan2(M[0][1], M[0][2])
      } else {
        θ = -Math.PI / 2
        ψ = -φ + Math.atan2(-M[0][1], -M[0][2])
      }
    }

    jointsResult[5][3] = ψ
    jointsResult[5][4] = θ
    jointsResult[5][5] = φ

    console.log('+++++++++forward KINEMATICS++++++++++')
    Serial.println(`J0 X ${jointsResult[0][0]} Y ${jointsResult[0][1]} Z ${jointsResult[0][2]}`)
    Serial.println(`J1 X ${jointsResult[1][0]} Y ${jointsResult[1][1]} Z ${jointsResult[1][2]}`)
    Serial.println(`J2 X ${jointsResult[2][0]} Y ${jointsResult[2][1]} Z ${jointsResult[2][2]}`)
    Serial.println(`J4 X ${jointsResult[4][0]} Y ${jointsResult[4][1]} Z ${jointsResult[4][2]}`)
    Serial.println(`J5 X ${jointsResult[5][0]} Y ${jointsResult[5][1]} Z ${jointsResult[5][2]}`)
    Serial.println(`J5 A ${jointsResult[5][3]} B ${jointsResult[5][4]} C ${jointsResult[5][5]}`)
    console.log('---------forward KINEMATICS----------')
  }

  cross(vectorA, vectorB, result) {
    return result = [
      vectorA[1] * vectorB[2] - vectorA[2] * vectorB[1],
      vectorA[2] * vectorB[0] - vectorA[0] * vectorB[2],
      vectorA[0] * vectorB[1] - vectorA[1] * vectorB[0],
    ]
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

    const sign = (tmp > 0) ? 1.0 : -1.0

    return angle * sign
  }

  length3(vector) {
    return Math.sqrt(Math.pow(vector[0], 2) + Math.pow(vector[1], 2) + Math.pow(vector[2], 2))
  }

  length2(a, b) {
    return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2))
  }
}
