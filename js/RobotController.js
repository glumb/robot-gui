
export class RobotController {
    static #DEG_TO_RAD = Math.PI / 180
    constructor(robotStore, config = { rotStep: (Math.PI)/36, transStep: 0.25 }) {
        // Allows us to get and set robot state
        this.robotStore = robotStore
        
        // Robot current state
        this.angles = robotStore.getState().angles
        this.EEposition = robotStore.getState().target.position
        this.EErotation = robotStore.getState().target.rotation
    
        // How much to move by
        this.rotStep = config.rotStep
        this.transStep = config.transStep
    }

    setTransStep( step ) {
        this.transStep = step
    }

    setRotStepDeg( angleDeg ) {
        this.rotStep = angleDeg * DEG_TO_RAD
    }

    setJointAngle( jointNumber, angleRad ) {
        this.angles[ "A" + jointNumber ] = angleRad
        this.#setRobotAngles( this.angles )
    }

    setPosition( axis, position ) {
        this.EEposition[ axis ] = position
        this.#setRobotTarget( this.EEposition, this.EErotation )
    }

    setRotation( axis, rotation ) {
        this.EErotation[ axis ] = rotation
        this.#setRobotTarget( this.EEposition, this.EErotation )
    }

    incrementJoint( jointNumber ) { this.#moveJoint( jointNumber, 1 ) }
    decrementJoint( jointNumber ) { this.#moveJoint( jointNumber, -1 ) }
    incrementPosition( axis ) { this.#moveAlongAxis( axis, 1 ) }
    decrementPosition( axis ) { this.#moveAlongAxis( axis, -1 ) }
    incrementRotation( axis ) { this.#rotateAroundAxis( axis, 1 ) }
    decrementRotation( axis ) { this.#rotateAroundAxis( axis, -1 ) }

    #moveJoint( jointNumber, direction ) {
        this.angles[ "A" + jointNumber ] += this.rotStep * direction
        this.#setRobotAngles( this.angles )
    }

    #moveAlongAxis( axis, direction ) {
        this.EEposition[ axis ] += this.transStep * direction
        this.#setRobotTarget( this.EEposition, this.EErotation )
    }

    #rotateAroundAxis( axis, direction ) {
        this.EErotation[ axis ] += this.rotStep * direction
        this.#setRobotTarget( this.EEposition, this.EErotation )
    }

    #updateState() {
        this.angles = this.robotStore.getState().angles
        this.EEposition = this.robotStore.getState().target.position
        this.EErotation = this.robotStore.getState().target.rotation
    }

    #setRobotTarget( position, rotation ) {
        this.robotStore.dispatch('ROBOT_CHANGE_TARGET', { position, rotation })
        this.#updateState()
    }

    #setRobotAngles( angles ) {
        this.robotStore.dispatch('ROBOT_CHANGE_ANGLES', angles)
        this.#updateState()
    }
}