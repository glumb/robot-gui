var RobotController = function (V_initial, jointLimits, maxAngleVelocities) {
    this.Servos = [];
    this.Servos[0] = new Servo(maxAngleVelocities[0])
    this.Servos[1] = new Servo(maxAngleVelocities[1])
    this.Servos[2] = new Servo(maxAngleVelocities[2])
    this.Servos[3] = new Servo(maxAngleVelocities[3])
    this.Servos[4] = new Servo(maxAngleVelocities[4])
    this.Servos[5] = new Servo(maxAngleVelocities[5])

    this.IK = new InverseKinematic(V_initial, jointLimits)

    this.jointLimits = []
    for(var i = 0; i < 6; i++) {
        this.jointLimits[i] = []
        this.jointLimits[i][0] = jointLimits[i][0] / 180 * Math.PI;
        this.jointLimits[i][1] = jointLimits[i][1] / 180 * Math.PI;
    }


    this.targetPosition = [0, 0, 0, 0, 0, 0]
    this._tweenTargetPosition = [0, 0, 0, 0, 0, 0]
    this.movementMethod = "P2P";
    this.STATE = "IDLE"

    this._interpolationDistance = 1

    this.maxVelocity = 100 / 1000; //in units per ms
}

RobotController.prototype = {

    setMaxVelocity: function (velocity) {
        this.maxVelocity = velocity / 1000
    },
    resetPosition: function () {
        this.setTargetAngles([0, 0, 0, 0, 0, 0])
    },

    moveToMinPosition: function () {
        this.setTargetAngles([
            this.jointLimits[0][0],
            this.jointLimits[1][0],
            this.jointLimits[2][0],
            this.jointLimits[3][0],
            this.jointLimits[4][0],
            this.jointLimits[5][0]
        ])
    },

    moveToMaxPosition: function () {
        this.setTargetAngles([
            this.jointLimits[0][1],
            this.jointLimits[1][1],
            this.jointLimits[2][1],
            this.jointLimits[3][1],
            this.jointLimits[4][1],
            this.jointLimits[5][1]
        ])
    },

    setMaxAngleVelocity: function (servoIndex, velocity) {
        this.Servos[servoIndex].setMaxAngleVelocity(velocity)
    },

    setMovementMethod: function (method) {
        this.movementMethod = method
    },

    getTargetPosition: function () {
        return this.targetPosition
    },

    setTargetPosition: function (x, y, z, a, b, c) {
        this._setTargetPosition([x, y, z, a, b, c])
    },

    _setTargetPosition: function (pos) {
        this.targetPosition = [pos[0], pos[1], pos[2], pos[3], pos[4], pos[5]]
        this.STATE = "START_MOVE"
    },

    getCurrentAngles: function (angles) {
        for(var i = 0; i < this.Servos.length; i++) {
            angles[i] = this.Servos[i].getCurrentAngle();
        }
    },

    setTargetAngles: function (targetAngles) {
        var TCP = []
        // complicated way, since interpolation method may still be linear, so we need the target pos anyways
        this.IK.calculateTCP(
            targetAngles[0],
            targetAngles[1],
            targetAngles[2],
            targetAngles[3],
            targetAngles[4],
            targetAngles[5],
            TCP
        )

        this._setTargetPosition(TCP)
    },

    setTargetAngle: function (index, angle) {
        let angles = []
        this.getTargetAngles(angles)
        angles[index] = angle
        this.setTargetAngles(angles)
    },

    _setTargetAngles: function (targetAngles, time) {
        var maxTime = time || 0
        for(var i = 0; i < this.Servos.length; i++) {
            var dAngle = Math.abs(targetAngles[i] - this.Servos[i].getCurrentAngle())
            var dTime = dAngle / this.Servos[i].getMaxAngleVelocity()
            if (dTime > maxTime)
                maxTime = dTime
        }
        if (time && maxTime != time) {
            console.log("could not move in time: " + time + " using instead time: " + maxTime)
        }
        if (maxTime != 0)
            for(var j = 0; j < this.Servos.length; j++) {
                dAngle = Math.abs(targetAngles[j] - this.Servos[j].getCurrentAngle())
                this.Servos[j].setCurrentAngleVelocity(dAngle / maxTime);
                this.Servos[j].setTargetAngle(targetAngles[j]);
            }
    },

    getCurrentAngle: function (index) {
        return this.Servos[index].getCurrentAngle()
    },

    getTargetAngles: function (angles) {
        for(var i = 0; i < this.Servos.length; i++) {
            angles[i] = this.Servos[i].getTargetAngle();
        }
    },

    getTargetAngle: function (index) {
        return this.Servos[index].getTargetAngle()
    },

    getCurrentPosition: function (position) {
        this.IK.calculateTCP(
            this.getCurrentAngle(0),
            this.getCurrentAngle(1),
            this.getCurrentAngle(2),
            this.getCurrentAngle(3),
            this.getCurrentAngle(4),
            this.getCurrentAngle(5),
            position
        )
    },

    isMoving: function () {
      return (this.STATE !== 'IDLE')
    },

    atTargetPosition: function () {
        // caution may not be true, when position not reachable
        return this.positionEquals(this._tweenTargetPosition, this.targetPosition)
    },

    positionEquals: function (pos1, pos2) {
        for(var i = 0; i < pos1.length; i++) {
            if (pos1[i] !== pos2[i]) {
                return false;
            }
        }
        return true;
    },

    process: function () {
        switch(this.STATE) {

            case "MOVING":
                var atTargetAngle = true;
                for(var i = 0; i < this.Servos.length; i++) {
                    if (!this.Servos[i].atTargetAngle()) {
                        atTargetAngle = false
                    }
                }
                if (atTargetAngle) {
                    if (this.positionEquals(this._tweenTargetPosition, this.targetPosition)) {
                        this.STATE = "IDLE"
                    } else {
                        this.STATE = "START_MOVE"
                    }
                }
                break;

            case "START_MOVE":
                var targetPosition = []
                var time = 0
                switch(this.movementMethod) {
                    case "P2P":
                        targetPosition = this.targetPosition
                        time = 0;
                        break;
                    case "LINEAR":

                        var dx = this.targetPosition[0] - this._tweenTargetPosition[0];
                        var dy = this.targetPosition[1] - this._tweenTargetPosition[1];
                        var dz = this.targetPosition[2] - this._tweenTargetPosition[2];
                        var da = this.targetPosition[3] - this._tweenTargetPosition[3];
                        var db = this.targetPosition[4] - this._tweenTargetPosition[4];
                        var dc = this.targetPosition[5] - this._tweenTargetPosition[5];
                        //todo include only rotation
                        var length = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2) + Math.pow(dz, 2) + Math.pow(da, 2) + Math.pow(db, 2) + Math.pow(dc, 2));
                        console.log("STATE:MOVING", "distance: " + (length));


                        if (length == 0) {
                            console.log('lenth 000-----look todo omg')
                            break;
                        } else if (length < this._interpolationDistance) {
                            targetPosition[0] = this.targetPosition[0];
                            targetPosition[1] = this.targetPosition[1];
                            targetPosition[2] = this.targetPosition[2];
                            targetPosition[3] = this.targetPosition[3]
                            targetPosition[4] = this.targetPosition[4]
                            targetPosition[5] = this.targetPosition[5]

                            time = length / this.maxVelocity
                        } else {
                            dx = dx / length * this._interpolationDistance;
                            dy = dy / length * this._interpolationDistance;
                            dz = dz / length * this._interpolationDistance;
                            da = da / length * this._interpolationDistance;
                            db = db / length * this._interpolationDistance;
                            dc = dc / length * this._interpolationDistance;

                            targetPosition[0] = this._tweenTargetPosition[0] + dx;
                            targetPosition[1] = this._tweenTargetPosition[1] + dy;
                            targetPosition[2] = this._tweenTargetPosition[2] + dz;
                            targetPosition[3] = this._tweenTargetPosition[3] + da;
                            targetPosition[4] = this._tweenTargetPosition[4] + db;
                            targetPosition[5] = this._tweenTargetPosition[5] + dc;

                            time = this._interpolationDistance / this.maxVelocity
                        }

                        break;
                }
                var targetAngles = [] //todo check if targetposition angles >90° for new position - not linear anymore
                var returnCode = this.IK.calculateAngles(
                    targetPosition[0],
                    targetPosition[1],
                    targetPosition[2],
                    targetPosition[3],
                    targetPosition[4],
                    targetPosition[5],
                    targetAngles
                )
                if (returnCode == InverseKinematic.OK) {
                    this._setTargetAngles(targetAngles, time)
                    this._tweenTargetPosition = targetPosition
                    this.STATE = "MOVING"
                } else {
                    console.log('ERRORO out of reach')
                    this.STATE = "IDLE"
                }
                break;
        }
    }
}