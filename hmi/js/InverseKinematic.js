const Serial = {
  println(text) {
    console.log(text)
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

const InverseKinematic = function (geometry, jointLimits) {
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

  this.A_corrected = [0, 0, 0, 0, 0, 0]

  this.A_corrected[1] -= Math.PI / 2
  this.A_corrected[1] += Math.atan2(geometry[1][0], geometry[1][1]) // correct offset bone

  this.A_corrected[2] -= Math.PI / 2
  this.A_corrected[2] -= Math.atan2((geometry[2][1] + geometry[3][1]), (geometry[2][0] + geometry[3][0])) // correct offset bone V2,V3
  this.A_corrected[2] -= Math.atan2(geometry[1][0], geometry[1][1]) // correct bone offset of V1

    // this.A_corrected[4] += Math.PI / 2;
  this.A_corrected[4] += Math.atan2(geometry[4][1], geometry[4][0])
  console.log(`---------------------------------${Math.atan2(geometry[4][1], geometry[4][0])}`)
}

InverseKinematic.OK = 0
InverseKinematic.OUT_OF_RANGE = 1
InverseKinematic.OUT_OF_BOUNDS = 2

InverseKinematic.prototype = {
  calculateAngles(x, y, z, a, b, c, angles) {
    console.log(x, y, z, a, b, c)


    let ca = Math.cos(a),
      sb = Math.sin(a),
      cc = Math.cos(b),
      sd = Math.sin(b),
      ce = Math.cos(c),
      sf = Math.sin(c)


    const vector = [
      cc * ce,
      cc * sf,
      -sd,
    ]

    const c1 = Math.cos(a / 2)
    const c2 = Math.cos(b / 2)
    const c3 = Math.cos(c / 2)
    const s1 = Math.sin(a / 2)
    const s2 = Math.sin(b / 2)
    const s3 = Math.sin(c / 2)


    function applyQuaternion(vector, q) {
      let x = vector[0],
        y = vector[1],
        z = vector[2]
      let qx = q.x,
        qy = q.y,
        qz = q.z,
        qw = q.w

            // calculate quat * vector

      const ix = qw * x + qy * z - qz * y
      const iy = qw * y + qz * x - qx * z
      const iz = qw * z + qx * y - qy * x
      const iw = -qx * x - qy * y - qz * z

            // calculate result * inverse quat

      vector[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy
      vector[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz
      vector[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx

      return vector
    }


    _x = s1 * c2 * c3 + c1 * s2 * s3
    _y = c1 * s2 * c3 - s1 * c2 * s3
    _z = c1 * c2 * s3 + s1 * s2 * c3
    _w = 2 * Math.acos(c1 * c2 * c3 - s1 * s2 * s3)

    console.log(vector)
    console.log(applyQuaternion([1, 0, 0], {
      x: s1 * c2 * c3 + c1 * s2 * s3,
      y: c1 * s2 * c3 - s1 * c2 * s3,
      z: c1 * c2 * s3 + s1 * s2 * c3,
      w: c1 * c2 * c3 - s1 * s2 * s3,
    }))

    const A = [
      this.A_corrected[0],
      this.A_corrected[1],
      this.A_corrected[2],
      this.A_corrected[3],
      this.A_corrected[4],
      this.A_corrected[5],
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

    J[4][0] = x - this.V4_length_x_y_z * vector[0]
    J[4][1] = y - this.V4_length_x_y_z * vector[1]
    J[4][2] = z - this.V4_length_x_y_z * vector[2]


    calculatedJointGeometry[4].position.set(J[4][0], J[4][1], J[4][2])

        // todo backwards rotation


        // ---- A0 ----
        // # J4

    A[0] += Math.PI / 2 - Math.acos(this.J_initial_absolute[4][2] / this.length2(J[4][2], J[4][0]))
    A[0] += Math.atan2(-J[4][2], J[4][0])

    if (this.J_initial_absolute[4][2] > this.length2(J[4][2], J[4][0])) {
      Serial.println('out of reach')
    }

        //                plane.rotation.y = A[0]


        // ---- J1 ----
        // # A0

    J[1][0] = Math.cos(A[0]) * this.geometry[0][0] + Math.sin(A[0]) * this.geometry[0][2]
    J[1][1] = this.geometry[0][1]
    J[1][2] = -Math.sin(A[0]) * this.geometry[0][0] + Math.cos(A[0]) * this.geometry[0][2]


    calculatedJointGeometry[1].position.set(J[1][0], J[1][1], J[1][2])


        // ---- rotate J4 into x,y plane ----
        // # J4 A0

    const J4_x_y = []

    J4_x_y[0] = Math.cos(A[0]) * J[4][0] + -Math.sin(A[0]) * J[4][2]
    J4_x_y[1] = J[4][1]
    J4_x_y[2] = Math.sin(A[0]) * J[4][0] + Math.cos(A[0]) * J[4][2]


        // ---- J1J4_projected_length_square ----
        // # J4 A0

    const J1J4_projected_length_square = Math.pow(J4_x_y[0] - this.J_initial_absolute[1][0], 2) + Math.pow(J4_x_y[1] - this.J_initial_absolute[1][1], 2) // not using Math.sqrt


        // ---- A2 ----
        // # J4 A0

    const J2J4_length_x_y = this.length2(this.geometry[2][0] + this.geometry[3][0], this.geometry[2][1] + this.geometry[3][1])
    A[2] += Math.acos((-J1J4_projected_length_square + Math.pow(J2J4_length_x_y, 2) + Math.pow(this.V1_length_x_y, 2)) / (2.0 * (J2J4_length_x_y) * this.V1_length_x_y))


        // ---- A1 ----
        // # J4 A0

    const J1J4_projected_length = Math.sqrt(J1J4_projected_length_square)
    A[1] += Math.atan2((J4_x_y[1] - this.J_initial_absolute[1][1]), (J4_x_y[0] - this.J_initial_absolute[1][0]))
    A[1] += Math.acos((+J1J4_projected_length_square - Math.pow(J2J4_length_x_y, 2) + Math.pow(this.V1_length_x_y, 2)) / (2.0 * J1J4_projected_length * this.V1_length_x_y))


        // ---- J2 ----
        // # A1 A0

    const ta = Math.cos(A[0])
    const tb = Math.sin(A[0])
    const tc = this.geometry[0][0]
    const d = this.geometry[0][1]
    const e = this.geometry[0][2]
    const f = Math.cos(A[1])
    const g = Math.sin(A[1])
    const h = this.geometry[1][0]
    const i = this.geometry[1][1]
    const j = this.geometry[1][2]
    const k = Math.cos(A[2])
    const l = Math.sin(A[2])
    const m = this.geometry[2][0]
    const n = this.geometry[2][1]
    const o = this.geometry[2][2]


    J[2][0] = ta * tc + tb * e + ta * f * h - ta * g * i + tb * j
    J[2][1] = d + g * h + f * i
    J[2][2] = -tb * tc + ta * e - tb * f * h + tb * g * i + ta * j


        // addArrow('J2', [0, 0, 0], J[2])
    calculatedJointGeometry[2].position.set(J[2][0], J[2][1], J[2][2])


        // ---- J3 ----
        // # A0 A1 A2


    J[3][0] = ta * tc + tb * e + ta * f * h - ta * g * i + tb * j + ta * f * k * m - ta * g * l * m - ta * g * k * n - ta * f * l * n + tb * o
    J[3][1] = d + g * h + f * i + g * k * m + f * l * m + f * k * n - g * l * n
    J[3][2] = -tb * tc + ta * e - tb * f * h + tb * g * i + ta * j - tb * f * k * m + tb * g * l * m + tb * g * k * n + tb * f * l * n + ta * o


    calculatedJointGeometry[3].position.set(J[3][0], J[3][1], J[3][2])


        // ---- J4J3 J4J5 ----
        // # J3 J4 J5

    const J4J5_vector = [J[5][0] - J[4][0], J[5][1] - J[4][1], J[5][2] - J[4][2]]
    const J4J3_vector = [J[3][0] - J[4][0], J[3][1] - J[4][1], J[3][2] - J[4][2]]


        // ---- A3 ----
        // J3 J4 J5

    const J4J5_J4J3_normal_vector = this.cross(J4J5_vector, J4J3_vector)

        // addVectorArrow('normal J4', J[4], J4J5_J4J3_normal_vector)

    const XZ_parallel_aligned_vector = [10 * Math.cos(A[0] + Math.PI / 2),
            0, -10 * Math.sin(A[0] + Math.PI / 2),
        ]

        // addVectorArrow('normal J4 Y_vector', J[4], XZ_parallel_aligned_vector)

    const reference = this.cross(XZ_parallel_aligned_vector, J4J3_vector)

        // addVectorArrow('normal J4 Y_vectors', J[4], reference)

    const tmp = this.dot(reference, J4J5_J4J3_normal_vector)

    const sign = (tmp > 0) ? 1.0 : -1.0

    A[3] = this.angleBetween(J4J5_J4J3_normal_vector, XZ_parallel_aligned_vector, reference)

    console.log(`------------A3------------- ${A[3]}`)
    console.log(`------------sign------------- ${sign}`)
    console.log(`------------this.angleBetween------------- ${this.angleBetween(J4J5_J4J3_normal_vector, XZ_parallel_aligned_vector, reference)}`)


        // ---- A4 ----
        // #J4 J3 J5

    const reference_vector = this.cross(J4J3_vector, J4J5_J4J3_normal_vector)

    A[4] += this.angleBetween(J4J5_vector, J4J3_vector, reference_vector)
            // addVectorArrow('2', J[5], reference_vector, 0x00ff00)

        // ---- A5 ----

    const reference_vector3 = this.cross(J4J5_vector, [0, 10, 0])

    const reference_vector2 = this.cross(J4J5_vector, reference_vector3)

        // addVectorArrow('32', J[5], reference_vector3, 0x0000ff)

    A[5] += -a
            // A[5] += Math.PI
    A[5] += this.angleBetween(J4J5_J4J3_normal_vector, reference_vector3, reference_vector2)
            // A[5] += +A[3]

        // addVectorArrow('2', J[5], J4J5_J4J3_normal_vector, 0x00ff00, 5)

        // ---- check and flip A3 A4 if needed ----

        //            var difference = current_A[ 3 ] - A[ 3 ];
        //
        //            if ( difference > 0.5 * Math.PI || difference < - 0.5 * Math.PI ) {
        //                Serial.println( "----------- flipping A3 - distance closer -------------" );
        //                Serial.println( "----------- A3 before " + floatToString( A[ 3 ] ) + " -------------" );
        //                A[ 3 ] = (A[ 3 ] > 0.0) ? A[ 3 ] - Math.PI : A[ 3 ] + Math.PI;
        //                //A[3] =  A[3] + 180.0;
        //                A[ 4 ] = - A[ 4 ];
        //                //A[4] = 0;
        //            } else {
        //                //Serial.println("----------- not flipping A3 - currentA3 " + floatToString(current_A[3]) + " ------------- A3 " + floatToString(A[3]));
        //            }


        // ---- Error handling ----

    let error = false
    const outOfBounds = [false, false, false, false, false, false]

    for (let ij = 0; ij < 6; ij++) {
      if (isNaN(A[ij])) {
        Serial.println(`E A_${String(ij)} out of reach `)
        error = true
      } else if (A[ij] < this.jointLimits[ij][0] || A[ij] > this.jointLimits[ij][1]) {
        Serial.println(`E A_${String(ij)} out of bounds ${floatToString(A[ij] / Math.PI * 180.0)}`)
        Serial.println(`E A_${String(ij)} bounds ${floatToString(this.jointLimits[ij][1] / Math.PI * 180.0)}`)
        Serial.println(`E A_${String(ij)} bounds ${floatToString(this.jointLimits[ij][0] / Math.PI * 180.0)}`)
        outOfBounds[ij] = true
        error = true
      }
    }

    angles[0] = A[0]
    angles[1] = A[1]
    angles[2] = A[2]
    angles[3] = A[3]
    angles[4] = A[4]
    angles[5] = A[5]

    if (!error) {
            // todo set A . While moving, print to serial

      Serial.println(`A0 ${floatToString(A[0])}`)
      Serial.println(`A1 ${floatToString(A[1])}`)
      Serial.println(`A2 ${floatToString(A[2])}`)
      Serial.println(`A3 ${floatToString(A[3])}`)
      Serial.println(`A4 ${floatToString(A[4])}`)
      Serial.println(`A5 ${floatToString(A[5])}`)


            //                Serial.println( "JD X" + floatToString( normal_J2J4_zAxis[ 0 ] ) + " Y" + floatToString( normal_J2J4_zAxis[ 1 ] ) + " Z" + floatToString( normal_J2J4_zAxis[ 2 ] ) );
            //                Serial.println( "JE X" + floatToString( normal_J2J4_vector[ 0 ] ) + " Y" + floatToString( normal_J2J4_vector[ 1 ] ) + " Z" + floatToString( normal_J2J4_vector[ 2 ] ) );

      Serial.println(`J0 X${floatToString(J[0][0])} Y${floatToString(J[0][1])} Z${floatToString(J[0][2])}`)
      Serial.println(`J1 X${floatToString(J[1][0])} Y${floatToString(J[1][1])} Z${floatToString(J[1][2])}`)
      Serial.println(`J2 X${floatToString(J[2][0])} Y${floatToString(J[2][1])} Z${floatToString(J[2][2])}`)
      Serial.println(`J4 X${floatToString(J[4][0])} Y${floatToString(J[4][1])} Z${floatToString(J[4][2])}`)
      Serial.println(`J5 X${floatToString(J[5][0])} Y${floatToString(J[5][1])} Z${floatToString(J[5][2])}`)

      Serial.println(`J5 A ${a} B ${b} C ${c}`)

            // this.calculateCoordinates(A[0], A[1], A[2], A[3], A[4], A[5], [[], [], [], [], [], []])
    }
    return outOfBounds
  },

  calculateTCP(A0, A1, A2, A3, A4, A5, jointsResult) {
    const joints = [
            [],
            [],
            [],
            [],
            [],
            [],
    ]
    this.calculateCoordinates(A0, A1, A2, A3, A4, A5, joints)
    jointsResult[0] = joints[5][0]
    jointsResult[1] = joints[5][1]
    jointsResult[2] = joints[5][2]
    jointsResult[3] = joints[5][3]
    jointsResult[4] = joints[5][4]
    jointsResult[5] = joints[5][5]
  },

  calculateCoordinates(A0, A1, A2, A3, A4, A5, jointsResult) {
    const a = Math.cos(A0)
    const b = Math.sin(A0)
    const c = this.geometry[0][0]
    const d = this.geometry[0][1]
    const e = this.geometry[0][2]
    const f = Math.cos(A1)
    const g = Math.sin(A1)
    const h = this.geometry[1][0]
    const i = this.geometry[1][1]
    const j = this.geometry[1][2]
    const k = Math.cos(A2)
    const l = Math.sin(A2)
    const m = this.geometry[2][0]
    const n = this.geometry[2][1]
    const o = this.geometry[2][2]
    const p = Math.cos(A3)
    const q = Math.sin(A3)
    const r = this.geometry[3][0]
    const s = this.geometry[3][1]
    const t = this.geometry[3][2]
    const u = Math.cos(A4)
    const v = Math.sin(A4)
    const w = this.geometry[4][0]
    const x = this.geometry[4][1]
    const y = this.geometry[4][2]
        // todo add z rotation to matrix!!!!!!!!!!!!!!!!!!!!!!!
    const A = Math.cos(A5)
    const B = Math.sin(A5)
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
      [
        a * f * k * u - a * g * l * u - a * g * k * p * v - a * f * l * p * v + b * q * v, -a * g * k * p * u - a * f * l * p * u + b * q * u - a * f * k * v + a * g * l * v,
        b * p + a * g * k * q + a * f * l * q,
        a * c + b * e + a * f * h - a * g * i + b * j + a * f * k * m - a * g * l * m - a * g * k * n - a * f * l * n + b * o + a * f * k * r - a * g * l * r - a * g * k * p * s - a * f * l * p * s + b * q * s + b * p * t + a * g * k * q * t + a * f * l * q * t + a * f * k * u * w - a * g * l * u * w - a * g * k * p * v * w - a * f * l * p * v * w + b * q * v * w - a * g * k * p * u * x - a * f * l * p * u * x + b * q * u * x - a * f * k * v * x + a * g * l * v * x + b * p * y + a * g * k * q * y + a * f * l * q * y,
      ],
      [
        g * k * u + f * l * u + f * k * p * v - g * l * p * v,
        f * k * p * u - g * l * p * u - g * k * v - f * l * v, -f * k * q + g * l * q,
        d + g * h + f * i + g * k * m + f * l * m + f * k * n - g * l * n + g * k * r + f * l * r + f * k * p * s - g * l * p * s - f * k * q * t + g * l * q * t + g * k * u * w + f * l * u * w + f * k * p * v * w - g * l * p * v * w + f * k * p * u * x - g * l * p * u * x - g * k * v * x - f * l * v * x - f * k * q * y + g * l * q * y,
      ],
            [-b * f * k * u + b * g * l * u + b * g * k * p * v + b * f * l * p * v + a * q * v,
                b * g * k * p * u + b * f * l * p * u + a * q * u + b * f * k * v - b * g * l * v,
                a * p - b * g * k * q - b * f * l * q, -b * c + a * e - b * f * h + b * g * i + a * j - b * f * k * m + b * g * l * m + b * g * k * n + b * f * l * n + a * o - b * f * k * r + b * g * l * r + b * g * k * p * s + b * f * l * p * s + a * q * s + a * p * t - b * g * k * q * t - b * f * l * q * t - b * f * k * u * w + b * g * l * u * w + b * g * k * p * v * w + b * f * l * p * v * w + a * q * v * w + b * g * k * p * u * x + b * f * l * p * u * x + a * q * u * x + b * f * k * v * x - b * g * l * v * x + a * p * y - b * g * k * q * y - b * f * l * q * y,
            ],
      [
        0,
        0,
        0,
        1,
      ],
    ]
    M = [
                [-B * b * p - B * a * g * k * q - B * a * f * l * q + A * a * f * k * u - A * a * g * l * u - A * a * g * k * p * v - A * a * f * l * p * v + A * b * q * v, -a * g * k * p * u - a * f * l * p * u + b * q * u - a * f * k * v + a * g * l * v,
                    A * b * p + A * a * g * k * q + A * a * f * l * q + B * a * f * k * u - B * a * g * l * u - B * a * g * k * p * v - B * a * f * l * p * v + B * b * q * v,
                    A * b * p * E + A * a * g * k * q * E + A * a * f * l * q * E + B * a * f * k * u * E - B * a * g * l * u * E - B * a * g * k * p * v * E - B * a * f * l * p * v * E + B * b * q * v * E + a * c + b * e + a * f * h - a * g * i + b * j + a * f * k * m - a * g * l * m - a * g * k * n - a * f * l * n + b * o - B * C * b * p - B * C * a * g * k * q - B * C * a * f * l * q + a * f * k * r - a * g * l * r - a * g * k * p * s - a * f * l * p * s + b * q * s + b * p * t + a * g * k * q * t + a * f * l * q * t + A * C * a * f * k * u - A * C * a * g * l * u - D * a * g * k * p * u - D * a * f * l * p * u + D * b * q * u - D * a * f * k * v + D * a * g * l * v - A * C * a * g * k * p * v - A * C * a * f * l * p * v + A * C * b * q * v + a * f * k * u * w - a * g * l * u * w - a * g * k * p * v * w - a * f * l * p * v * w + b * q * v * w - a * g * k * p * u * x - a * f * l * p * u * x + b * q * u * x - a * f * k * v * x + a * g * l * v * x + b * p * y + a * g * k * q * y + a * f * l * q * y,
                ],
      [
        B * f * k * q - B * g * l * q + A * g * k * u + A * f * l * u + A * f * k * p * v - A * g * l * p * v,
        f * k * p * u - g * l * p * u - g * k * v - f * l * v, -A * f * k * q + A * g * l * q + B * g * k * u + B * f * l * u + B * f * k * p * v - B * g * l * p * v, -A * f * k * q * E + A * g * l * q * E + B * g * k * u * E + B * f * l * u * E + B * f * k * p * v * E - B * g * l * p * v * E + d + g * h + f * i + g * k * m + f * l * m + f * k * n - g * l * n + B * C * f * k * q - B * C * g * l * q + g * k * r + f * l * r + f * k * p * s - g * l * p * s - f * k * q * t + g * l * q * t + A * C * g * k * u + A * C * f * l * u + D * f * k * p * u - D * g * l * p * u - D * g * k * v - D * f * l * v + A * C * f * k * p * v - A * C * g * l * p * v + g * k * u * w + f * l * u * w + f * k * p * v * w - g * l * p * v * w + f * k * p * u * x - g * l * p * u * x - g * k * v * x - f * l * v * x - f * k * q * y + g * l * q * y,
      ],
                [-B * a * p + B * b * g * k * q + B * b * f * l * q - A * b * f * k * u + A * b * g * l * u + A * b * g * k * p * v + A * b * f * l * p * v + A * a * q * v,
                    b * g * k * p * u + b * f * l * p * u + a * q * u + b * f * k * v - b * g * l * v,
                    A * a * p - A * b * g * k * q - A * b * f * l * q - B * b * f * k * u + B * b * g * l * u + B * b * g * k * p * v + B * b * f * l * p * v + B * a * q * v,
                    A * a * p * E - A * b * g * k * q * E - A * b * f * l * q * E - B * b * f * k * u * E + B * b * g * l * u * E + B * b * g * k * p * v * E + B * b * f * l * p * v * E + B * a * q * v * E - b * c + a * e - b * f * h + b * g * i + a * j - b * f * k * m + b * g * l * m + b * g * k * n + b * f * l * n + a * o - B * C * a * p + B * C * b * g * k * q + B * C * b * f * l * q - b * f * k * r + b * g * l * r + b * g * k * p * s + b * f * l * p * s + a * q * s + a * p * t - b * g * k * q * t - b * f * l * q * t - A * C * b * f * k * u + A * C * b * g * l * u + D * b * g * k * p * u + D * b * f * l * p * u + D * a * q * u + D * b * f * k * v - D * b * g * l * v + A * C * b * g * k * p * v + A * C * b * f * l * p * v + A * C * a * q * v - b * f * k * u * w + b * g * l * u * w + b * g * k * p * v * w + b * f * l * p * v * w + a * q * v * w + b * g * k * p * u * x + b * f * l * p * u * x + a * q * u * x + b * f * k * v * x - b * g * l * v * x + a * p * y - b * g * k * q * y - b * f * l * q * y,
                ],
      [
        0,
        0,
        0,
        1,
      ],
    ]
            // todo convert to euler angles
    jointsResult[5][3] = -Math.atan2(M[2][1], M[2][2])
    jointsResult[5][4] = Math.atan2(-M[2][0], Math.sqrt(Math.pow(M[2][1], 2) + Math.pow(M[2][2], 2)))
    jointsResult[5][5] = Math.atan2(M[1][0], M[0][0]) - Math.PI / 2

    const vec = new THREE.Vector3(2, 0, 0)

    let m11 = M[1 - 1][1 - 1],
      m12 = M[1 - 1][2 - 1],
      m13 = M[1 - 1][3 - 1],
      m14 = M[1 - 1][4 - 1]
    let m21 = M[2 - 1][1 - 1],
      m22 = M[2 - 1][2 - 1],
      m23 = M[2 - 1][3 - 1],
      m24 = M[2 - 1][4 - 1]
    let m31 = M[3 - 1][1 - 1],
      m32 = M[3 - 1][2 - 1],
      m33 = M[3 - 1][3 - 1],
      m34 = M[3 - 1][4 - 1]
    let m41 = M[4 - 1][1 - 1],
      m42 = M[4 - 1][2 - 1],
      m43 = M[4 - 1][3 - 1],
      m44 = M[4 - 1][4 - 1]
    const mat = new THREE.Matrix4()

    mat.set(m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44)

    const euler = new THREE.Euler()

    euler.setFromRotationMatrix(mat)

    vec.applyMatrix4(mat)
    console.log(euler)
            // addArrow('dds3dd', [10, 0, 0], [vec.x, vec.y, vec.z])

    const clamp = function (value, min, max) {
      return Math.max(min, Math.min(max, value))
    }

    const test = []

    test[1] = Math.asin(clamp(m13, -1, 1))

    if (Math.abs(m13) < 0.99999) {
      test[0] = Math.atan2(-m23, m33)
      test[2] = Math.atan2(-m12, m11)
    } else {
      test[0] = Math.atan2(m32, m22)
      test[2] = 0
    }

    test[0] = rotate(test[0], Math.PI, Math.PI)
    test[2] = rotate(test[2], Math.PI * 1.5, Math.PI)

        /**
         * rotate from angle to angle
         *
         * @param value
         * @param angle
         * @param max
         * @returns {*}
         */

    function rotate(value, angle, max) {
      const min = (max - 2 * Math.PI)
      let newVal = (value + angle)

      if (newVal > max) {
        newVal = min + (newVal % max)
      } else if (newVal < min) {
        newVal = max + (newVal % min)
      }

      return newVal
    }

    for (let z = 0; z < test.length; z++) {
      const abs = Math.abs(test[z])
      if (abs < 0.0000000001 || Math.abs(abs - Math.PI) < 0.0000000001) {
        test[z] = 0
      }
    }


    console.log(test)

    console.log('+++++++++forward KINEMATICS++++++++++')
    Serial.println(`J0 X ${jointsResult[0][0]} Y ${jointsResult[0][1]} Z ${jointsResult[0][2]}`)
    Serial.println(`J1 X ${jointsResult[1][0]} Y ${jointsResult[1][1]} Z ${jointsResult[1][2]}`)
    Serial.println(`J2 X ${jointsResult[2][0]} Y ${jointsResult[2][1]} Z ${jointsResult[2][2]}`)
    Serial.println(`J4 X ${jointsResult[4][0]} Y ${jointsResult[4][1]} Z ${jointsResult[4][2]}`)
    Serial.println(`J5 X ${jointsResult[5][0]} Y ${jointsResult[5][1]} Z ${jointsResult[5][2]}`)
    Serial.println(`J5 A ${jointsResult[5][3]} B ${jointsResult[5][4]} C ${jointsResult[5][5]}`)
    console.log('---------forward KINEMATICS----------')
  },

  cross(vectorA, vectorB, result) {
    return result = [
      vectorA[1] * vectorB[2] - vectorA[2] * vectorB[1],
      vectorA[2] * vectorB[0] - vectorA[0] * vectorB[2],
      vectorA[0] * vectorB[1] - vectorA[1] * vectorB[0],
    ]
  },

  dot(vectorA, vectorB) {
    return vectorA[0] * vectorB[0] + vectorA[1] * vectorB[1] + vectorA[2] * vectorB[2]
  },

  angleBetween(vectorA, vectorB, referenceVector) {
        // angle = atan2(norm(cross(a, b)), dot(a, b))

    const norm = this.length3(this.cross(vectorA, vectorB))

    const angle = Math.atan2(norm, (vectorB[0] * vectorA[0] + vectorB[1] * vectorA[1] + vectorB[2] * vectorA[2]))


    const tmp = referenceVector[0] * vectorA[0] + referenceVector[1] * vectorA[1] + referenceVector[2] * vectorA[2]

    const sign = (tmp > 0) ? 1.0 : -1.0

    return angle * sign
  },

  length3(vector) {
    return Math.sqrt(Math.pow(vector[0], 2) + Math.pow(vector[1], 2) + Math.pow(vector[2], 2))
  },

  length2(a, b) {
    return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2))
  },
}
