var Servo = function (maxAngleVelocity) {
    this.currentAngle = 0;
    this.targetAngle = 0;

    // for simulation
    this.movementStartTime = (new Date()).getTime()
    this._lastAngle = 0;

    this.maxAngleVelocity = maxAngleVelocity
    this.currentAngleVelocity = maxAngleVelocity
}

Servo.prototype = {
    simulateServoMovement: function () {
        if (this.currentAngle !== this.targetAngle) {

            var currentTime = (new Date()).getTime()
            var deltaT = currentTime - this.movementStartTime

            var deltaAngle = this.targetAngle - this._lastAngle;
            var t_total = Math.abs(deltaAngle) / this.currentAngleVelocity
            var direction = (deltaAngle > 0) ? 1 : -1

            if (t_total > deltaT) {

                this.currentAngle = this._lastAngle + this.currentAngleVelocity * deltaT * direction

            } else {
                console.log(deltaT)
                this.currentAngle = this.targetAngle;
            }
        }

    },

    getMaxAngleVelocity: function (velocity) {
        return this.maxAngleVelocity
    },
    setCurrentAngleVelocity: function (velocity) {
        if (velocity <= this.maxAngleVelocity) {
            this.currentAngleVelocity = velocity
        } else {
            this.currentAngleVelocity = this.maxAngleVelocity
            console.log("velocity greater than maxAngleVelocity")
        }
    },
    getCurrentAngleVelocity: function () {
        return this.currentAngleVelocity
    },
    getCurrentAngle: function () {
        this.simulateServoMovement()

        return this.currentAngle;
    },
    setTargetAngle: function (angle) {
        this.movementStartTime = (new Date()).getTime()
        this._lastAngle = this.currentAngle
        this.targetAngle = angle;
    },
    getTargetAngle: function (angle) {
        return this.targetAngle;
    },
    atTargetAngle: function () {
        return this.currentAngle == this.targetAngle
    }
}