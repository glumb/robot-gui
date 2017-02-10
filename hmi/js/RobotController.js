// define((require, exports, module) => {
//   const storeManager = require('State')
//   const Kinematic = require('Kinematic')()
//
//   function NORM(v, u, length) {
//     length = sqrt((u)[0] * (u)[0] + (u)[1] * (u)[1] + (u)[2] * (u)[2]);
//     (v)[0] = (u)[0] / length;
//     (v)[1] = (u)[1] / length;
//     (v)[2] = (u)[2] / length
//   }
//
//   function ADDV(v, u, w) /* ADD Vector */ {
//     (v)[0] = (u)[0] + (w)[0];
//     (v)[1] = (u)[1] + (w)[1];
//     (v)[2] = (u)[2] + (w)[2]
//   }
//
//   function SUBV(v, u, w) /* SUBtract Vector */ {
//     (v)[0] = (u)[0] - (w)[0];
//     (v)[1] = (u)[1] - (w)[1];
//     (v)[2] = (u)[2] - (w)[2]
//   }
//
//   function MULVS(v, u, s) /* MULtiply Vector by */ {
//     (v)[0] = (u)[0] * s;
//     (v)[1] = (u)[1] * s;
//     (v)[2] = (u)[2] * s
//   }
//
//   function CROSSVP(v, u, w) /* CROSS Vector Product */ {
//     (v)[0] = (u)[1] * (w)[2] - (u)[2] * (w)[1];
//     (v)[1] = (u)[2] * (w)[0] - (u)[0] * (w)[2];
//     (v)[2] = (u)[0] * (w)[1] - (u)[1] * (w)[0]
//   }
//
//   function DOTVP(v, u) {
//     return ((v)[0] * (u)[0] + (v)[1] * (u)[1] + (v)[2] * (u)[2])
//   }
//
//   const NUMBER_OF_AXIS = 6
//   const IDLE = 'IDLE'
//   const MOVING = 'MOVING'
//   const START_MOVE = 'START_MOVE'
//   const PREPARE_MOVE = 'PREPARE_MOVE'
//   const LINEAR = 'LINEAR'
//   const P2P = 'P2P'
//   const X = 'X'
//   const Y = 'Y'
//   const Z = 'Z'
//   const A = 'A'
//   const B = 'B'
//   const C = 'C'
//
//   const Serial = {
//     println(text) {
//       console.log(text)
//     },
//     print(text) {
//       console.log(text)
//     },
//   }
//
//   const logger = {
//     warning(text) {
//       console.log(text)
//     },
//     info(text) {
//       console.log(text)
//     },
//   }
//
//   function sin(a) {
//     return Math.sin(a)
//   }
//
//   function cos(a) {
//     return Math.cos(a)
//   }
//
//   function asin(a) {
//     return Math.asin(a)
//   }
//
//   function tan(a) {
//     return Math.tan(a)
//   }
//
//   function sqrt(a) {
//     return Math.sqrt(a)
//   }
//
//   function acos(a) {
//     return Math.acos(a)
//   }
//
//   function abs(a) {
//     return Math.abs(a)
//   }
//
//   function RobotController(servos, Kin, angleLimitsRad) {
//     this.Servos = servos
//
//     this.angleLimits = angleLimitsRad
//
//     this.IK = Kin
//
//     this.getCurrentPose(this.targetPose)
//
//     this.movementMethod = LINEAR
//     this.state = IDLE
//
//     this.interpolationDistanceIncrement = 1
//     this.interpolationOrientationAngleIncrement = 5
//
//     this.maxVelocity = 70 // in units per s
//
//     this.moveAsFarAsPossibleOnOutOfBound = true
//
//     const initialAngles = [
//       0,
//       0,
//       0,
//       0,
//       0,
//       0,
//     ]
//
//     this.setTargetAngles(initialAngles)
//   }
//
//   this.setMaxVelocity = function (velocity) {
//     this.maxVelocity = velocity
//   }
//
//   this.resetPose = function () {
//     const angles = []
//
//     this.setTargetAngles(angles)
//   }
//
//   this.moveToMinPose = function () {
//     const angles = []
//
//     for (const i = 0; i < NUMBER_OF_AXIS; i++) {
//       // add a little to not conflict with limits todo
//       angles[i] = this.angleLimits[i][0] + 5.0 / 180.0 * PI
//     }
//
//     this.setTargetAngles(angles)
//   }
//
//   this.moveToMaxPose = function () {
//     const angles = []
//
//     for (const i = 0; i < NUMBER_OF_AXIS; i++) {
//       // sub a little to not conflict with limits todo
//       angles[i] = this.angleLimits[i][1] - 5.0 / 180.0 * PI
//     }
//
//     this.setTargetAngles(angles)
//   }
//
//   this.setMovementMethod = function (method) {
//     this.movementMethod = method
//   }
//
//   this.getTargetPose = function (targetPose) {
//     targetPose = this.targetPose // todo
//   }
//
//   this.setTargetPose = function (x, y, z, a, b, c) {
//     this._setTargetPose(x, y, z, a, b, c)
//   }
//
//   this.setTargetPose = function (position, value) {
//     switch (position) {
//       case X:
//         this._setTargetPose(value, this.targetPose[1], this.targetPose[2], this.targetPose[3], this.targetPose[4],
//         this.targetPose[5])
//         break
//
//       case Y:
//         this._setTargetPose(this.targetPose[0], value, this.targetPose[2], this.targetPose[3], this.targetPose[4],
//         this.targetPose[5])
//         break
//
//       case Z:
//         this._setTargetPose(this.targetPose[0], this.targetPose[1], value, this.targetPose[3], this.targetPose[4],
//         this.targetPose[5])
//         break
//
//       case A:
//         this._setTargetPose(this.targetPose[0], this.targetPose[1], this.targetPose[2], value, this.targetPose[4],
//         this.targetPose[5])
//         break
//
//       case B:
//         this._setTargetPose(this.targetPose[0], this.targetPose[1], this.targetPose[2], this.targetPose[3], value,
//         this.targetPose[5])
//         break
//
//       case C:
//         this._setTargetPose(this.targetPose[0], this.targetPose[1], this.targetPose[2], this.targetPose[3], this.targetPose[4],
//         value)
//         break
//     }
//   }
//
//   // todo add stop method() targetPose = currentPose
//
//   this._setTargetPose = function (x, y, z, a, b, c) {
//     const newPose = [
//       x,
//       y,
//       z,
//       a,
//       b,
//       c,
//     ]
//
//     if (this.PoseEquals(this.targetPose, newPose)) {
//       return
//     }
//
//     this.startPose = this.targetPose // todo use current pose
//
//     this.targetPose[0] = x
//     this.targetPose[1] = y
//     this.targetPose[2] = z
//     this.targetPose[3] = a
//     this.targetPose[4] = b
//     this.targetPose[5] = c
//
//     this.state = PREPARE_MOVE
//   }
//
//   this.getCurrentAngles = function (currentAngles) {
//     for (const i = 0; i < NUMBER_OF_AXIS; i++) {
//       currentAngles[i] = this.Servos[i].getCurrentAngle()
//     }
//   }
//
//   this.setTargetAngles = function (targetAngles) {
//     const TCP = []
//
//     // complicated way, since interpolation method may still be linear, so we need the target pos anyways
//     this.IK.forward(
//       targetAngles[0],
//       targetAngles[1],
//       targetAngles[2],
//       targetAngles[3],
//       targetAngles[4],
//       targetAngles[5],
//       TCP
//     )
//
//     // logger.log("--still here--");
//     // logger.log(targetAngles[0]);
//     // logger.log(targetAngles[1]);
//     // logger.log(targetAngles[2]);
//     // logger.log(targetAngles[3]);
//     // logger.log(targetAngles[4]);
//     // logger.log(targetAngles[5]);
//
//     /* delay(5000);
//        logger.log("-----");
//        logger.log(TCP[0]);
//        logger.log(TCP[1]);
//        logger.log(TCP[2]);
//        logger.log(TCP[3]);//todo wrong
//        logger.log(TCP[4]);
//        logger.log(TCP[5]);
//        logger.log("-----");
//        delay(5000);*/
//
//     this._setTargetPose(
//       TCP[0],
//       TCP[1],
//       TCP[2],
//       TCP[3],
//       TCP[4],
//       TCP[5])
//   }
//
//   this.setTargetAngle = function (index, targetAngle) {
//     const angles = []
//
//     this.getTargetAngles(angles)
//
//     // delay(4000);
//     // Serial.println(targetAngle);
//     angles[index] = targetAngle
//     this.setTargetAngles(angles)
//
//     // Serial.println(this.targetPose[0]);
//     // todo
//     // this.Servos[index].setTargetRadAngle(targetAngle);
//   }
//
//   this._applyTimedTargetAngles = function (targetAngles, targetTime) {
//     let maxTime = targetTime
//
//     // todo take into account that the target angle may be out of angle and thus be far away
//     for (const i = 0; i < NUMBER_OF_AXIS; i++) {
//       var dAngle = abs(targetAngles[i] - this.Servos[i].getCurrentAngle())
//       const dTime = dAngle / this.Servos[i].getMaxAngleVelocity()
//
//       if (dTime > maxTime) maxTime = dTime
//     }
//
//     if (maxTime > targetTime) {
//       logger.warning(`could not move in time: ${String(targetTime)}`)
//       logger.warning(` using instead time: ${String(maxTime)}`)
//     }
//
//     // Serial.println(targetAngles[5]);
//     if (maxTime != 0) {
//       for (const j = 0; j < NUMBER_OF_AXIS; j++) {
//         var dAngle = abs(targetAngles[j] - this.Servos[j].getCurrentAngle())
//         this.Servos[j].setCurrentAngleVelocity(dAngle / maxTime)
//         this.Servos[j].setTargetRadAngle(targetAngles[j])
//       }
//     }
//   }
//
//   this.getTargetAngles = function (targetAngles) {
//     for (let i = 0; i < NUMBER_OF_AXIS; i++) {
//       targetAngles[i] = this.Servos[i].getTargetRadAngle()
//     }
//   }
//
//   this.getTargetAngle = function (index) {
//     if (index >= NUMBER_OF_AXIS) {
//       Serial.print('WARING, can not getTargetAngle(), out of index')
//       return 0
//     }
//     return this.Servos[index].getTargetRadAngle()
//   }
//
//   this.getCurrentPose = function (Pose) {
//     this.IK.forward(
//       this.Servos[0].getCurrentAngle(),
//       this.Servos[1].getCurrentAngle(),
//       this.Servos[2].getCurrentAngle(),
//       this.Servos[3].getCurrentAngle(),
//       this.Servos[4].getCurrentAngle(),
//       this.Servos[5].getCurrentAngle(),
//       Pose
//     )
//   }
//
//   this.isMoving = function () {
//     return this.state !== IDLE
//   }
//
//   this.atTargetPose = function () {
//     return this.PoseEquals(this.startPose, this.targetPose)
//   }
//
//   this.PoseEquals = function (pos1, pos2) {
//     for (let i = 0; i < 6; i++) {
//       if (pos1[i] != pos2[i]) {
//         return false
//       }
//     }
//     return true
//   }
//
//   this.process = function () {
//     switch (this.state) {
//       case IDLE:
//         break
//
//       case MOVING:
//         {
//           logger.info('MOVING')
//
//         // may not be the target pose though
//           let atTargetAngle = true
//
//           for (var i = 0; i < 6; i++) {
//             if (!this.Servos[i].atTargetAngle()) {
//               atTargetAngle = false
//               logger.info(`not at Target angle${String(i)}`)
//             }
//           }
//
//           if (atTargetAngle) {
//             logger.info('at Target angle')
//             logger.info(this.currentInterpolationStep)
//             logger.info(this.totalInterpolationSteps)
//
//             if (this.currentInterpolationStep == this.totalInterpolationSteps) {
//               this.state = IDLE
//             } else {
//               this.state = START_MOVE
//             }
//           }
//           break
//         }
//
//       case PREPARE_MOVE:
//         {
//           this.currentInterpolationStep = 0
//
//           switch (this.movementMethod) {
//             case P2P:
//               this.totalInterpolationSteps = 0
//               break
//
//             case LINEAR:
//
//           // rotate a (1,0,0) Vector according to ZYX Euler angle rotation
//
//               var targetOrientationVector = []
//
//               var cb = cos(this.targetPose[4])
//               var sb = sin(this.targetPose[4])
//               var cc = cos(this.targetPose[5])
//               var sc = sin(this.targetPose[5])
//
//               targetOrientationVector[0] = cb * cc
//               targetOrientationVector[1] = cb * sc
//               targetOrientationVector[2] = -sb
//
//               cb = cos(this.startPose[4])
//               sb = sin(this.startPose[4])
//               cc = cos(this.startPose[5])
//               sc = sin(this.startPose[5])
//
//               this.startOrientationVector[0] = cb * cc
//               this.startOrientationVector[1] = cb * sc
//               this.startOrientationVector[2] = -sb
//
//           // init the rotation Axis rodrigues rotation
//               var length
//
//               NORM(this.targetOrientationVectorNorm, targetOrientationVector, length)
//
//               CROSSVP(this.rotationAxisVectorNorm, this.startOrientationVector, this.targetOrientationVectorNorm) // this.rotationAxisVectorNorm
//               NORM(this.rotationAxisVectorNorm, this.rotationAxisVectorNorm, length)
//               NORM(this.startOrientationVectorNorm, this.startOrientationVector, length)
//
//               this.interpolationRotationAngle = acos(DOTVP(this.startOrientationVectorNorm, this.targetOrientationVectorNorm))
//
//           // set the interpolation steps based on orientation angle and distance
//               var dx = this.targetPose[0] - this.startPose[0]
//               var dy = this.targetPose[1] - this.startPose[1]
//               var dz = this.targetPose[2] - this.startPose[2]
//
//           // todo use this.interpolationDistanceIncrement to determine steps
//           //             // todo include only rotation
//               var distance = sqrt(pow(dx, 2) + pow(dy, 2) + pow(dz, 2))
//
//               var distanceSteps = distance / this.interpolationDistanceIncrement
//               var angleSteps = this.interpolationRotationAngle / this.interpolationOrientationAngleIncrement
//
//           // todo use (distanceSteps>angleSteps)?distanceSteps:angleSteps
//               this.totalInterpolationSteps = 40
//               break
//           }
//
//           this.state = START_MOVE
//
//           this.process()
//           break
//         }
//
//       case START_MOVE:
//         {
//           logger.info('START_MOVE')
//           let tmpTargetPose = [0, 0, 0, 0, 0, 0]
//           let dTime = 0
//
//           switch (this.movementMethod) {
//             case P2P:
//               logger.info('P2P')
//               tmpTargetPose = this.targetPose // todo do we need memcpy?
//               dTime = 0
//               break
//
//             case LINEAR:
//
//               var fraction
//
//               if (this.totalInterpolationSteps == 0) {
//                 fraction = 1
//               } else {
//                 fraction = this.currentInterpolationStep / this.totalInterpolationSteps
//               }
//
//               var dx = this.targetPose[0] - this.startPose[0]
//
//           // logger.log("this.targetPose[0] " + String(this.targetPose[0]), false);
//           // logger.log(dx,                                                   false);
//               var dy = this.targetPose[1] - this.startPose[1]
//
//           // logger.log("this.targetPose[1] " + String(this.targetPose[1]), false);
//           // logger.log(dy,                                                   false);
//               var dz = this.targetPose[2] - this.startPose[2]
//
//           // logger.log("this.targetPose[2] " + String(this.targetPose[2]), false);
//           // logger.log(dz,                                                   false);
//               var da = this.targetPose[3] - this.startPose[3]
//
//           // logger.log("this.targetPose[3] " + String(this.targetPose[3]), false);
//           // logger.log(da,                                                   false);
//               var db = this.targetPose[4] - this.startPose[4]
//
//           // logger.log("this.targetPose[4] " + String(this.targetPose[4]), false);
//           // logger.log(db,                                                   false);
//               var dc = this.targetPose[5] - this.startPose[5]
//
//           // logger.log("this.targetPose[5] " + String(this.targetPose[5]), false);
//           // logger.log(dc,                                                   false);
//
//           // todo do this properly with quaternions
//
//               var b = 0
//               var c = 0
//
//               if ((abs(db) > 0.0001) || (abs(dc) > 0.0001)) {
//                 const targetVector = []
//
//                 this.rodrigues(targetVector, this.rotationAxisVectorNorm, this.startOrientationVector,
//               fraction * this.interpolationRotationAngle)
//
//                 const rotationMatrix = [
//               [],
//               [],
//               [],
//                 ]
//
//                 var length
//                 NORM(targetVector, targetVector, length)
//
//             // X component
//                 rotationMatrix[0][0] = targetVector[0]
//                 rotationMatrix[1][0] = targetVector[1]
//                 rotationMatrix[2][0] = targetVector[2]
//
//             // todo simplify
//
//                 if ((rotationMatrix[2][0] != 1) || (rotationMatrix[2][0] != -1)) {
//                   b = PI + asin(rotationMatrix[2][0])
//                   c = atan2(rotationMatrix[1][0] / cos(b), rotationMatrix[0][0] / cos(b))
//                 } else {
//                   c = 0 // anything; can set to
//
//                   if (rotationMatrix[2][0] == -1) {
//                     b = PI / 2
//                   } else {
//                     b = -PI / 2
//                   }
//                 }
//               } else {
//                 b = this.targetPose[4]
//                 c = this.targetPose[5]
//               }
//
//               logger.info(`fraction ${String(fraction)}`)
//
//               var distance = sqrt(pow(dx, 2) + pow(dy, 2) + pow(dz, 2))
//
//               dx = dx * fraction
//               dy = dy * fraction
//               dz = dz * fraction
//
//               da = da * fraction
//
//               tmpTargetPose[0] = this.startPose[0] + dx
//               tmpTargetPose[1] = this.startPose[1] + dy
//               tmpTargetPose[2] = this.startPose[2] + dz
//
//               tmpTargetPose[3] = this.startPose[3] + da
//               tmpTargetPose[4] = b
//               tmpTargetPose[5] = c
//
//               logger.log('--- A B C ---', true)
//               logger.log(tmpTargetPose[3], true)
//               logger.log(tmpTargetPose[4], true)
//               logger.log(tmpTargetPose[5], true)
//               logger.log('-----', true)
//
//           // v = s/t  t = s/v
//               dTime = (distance / this.totalInterpolationSteps) / this.maxVelocity
//
//               this.currentInterpolationStep++
//
//               break
//
//           //
//           // case CIRCULAR:
//           //     break;
//           }
//
//           const targetAngles = [0, 0, 0, 0, 0, 0] // todo check if tmpTargetPose angles >90° for new Pose - not linear anymore
//           const returnCode = this.IK.inverse(
//           tmpTargetPose[0],
//           tmpTargetPose[1],
//           tmpTargetPose[2],
//           tmpTargetPose[3],
//           tmpTargetPose[4],
//           tmpTargetPose[5],
//           targetAngles
//         )
//
//           let outOfAngle = false
//
//         // Serial.println(dTime*1000);
//
//         // if (returnCode == Kinematic::OK) {
//           for (var i = 0; i < NUMBER_OF_AXIS; i++) {
//             if ((targetAngles[i] < this.angleLimits[i][0]) || (targetAngles[i] > this.angleLimits[i][1])) {
//               logger.warning(`Oh noo, out of angle :(  angle: ${String(i)}`)
//
//               outOfAngle = true
//             }
//           }
//         // } else {
//           logger.warning('Oh noo, out of bounds')
//         // }
//
//         // if ((!outOfAngle || this.moveAsFarAsPossibleOnOutOfBound) && (returnCode == Kinematic::OK)) {
//           if ((!outOfAngle || this.moveAsFarAsPossibleOnOutOfBound) && (true)) {
//           // todo handle singularity
//             if (abs(targetAngles[4] - (PI / 2)) < 0.05) { // axis 5 and 3 in line
//               Serial.println('singularity axis 5,3')
//
//               targetAngles[3] = this.Servos[3].getCurrentAngle()
//               targetAngles[5] = this.Servos[5].getCurrentAngle()
//             }
//
//           // Serial.println("A5 "+String(targetAngles[5]/PI*180));
//             this._applyTimedTargetAngles(targetAngles, dTime)
//             this.state = MOVING
//           } else {
//             this.state = IDLE
//           }
//
//           break
//         }
//     }
//   }
//
//   this.rodrigues = function (ret, unit, v, angleRad) {
//     const ret1 = [0, 0, 0]
//     const ret2 = [0, 0, 0]
//     const ret3 = [0, 0, 0]
//
//     MULVS(ret1, v, cos(angleRad))
//     CROSSVP(ret2, unit, v)
//     MULVS(ret2, ret2, sin(angleRad))
//
//     MULVS(ret3, unit, DOTVP(unit, v))
//     MULVS(ret3, ret3, (1 - cos(angleRad)))
//
//     // v*cos(angleRad)+cross(unit,v)*sin(angleRad)+unit*dot(unit,v)*(1-cos(angleRad))
//
//     // ret1 + ret2 + ret3
//
//     ADDV(ret1, ret1, ret2)
//     ADDV(ret1, ret1, ret3)
//
//     ret[0] = ret1[0]
//     ret[1] = ret1[1]
//     ret[2] = ret1[2]
//   }
//
//   module.exports = RobotController
// })
