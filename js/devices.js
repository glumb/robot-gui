export class RotaryEncoder {
    constructor( gamepadIndex, firstButtonIndex, secondButtonIndex, axisIndex ){
        this.gamepadIndex = gamepadIndex
        this.firstButtonIndex = firstButtonIndex
        this.secondButtonIndex = secondButtonIndex
        this.axisIndex = axisIndex

        const gamepads = navigator.getGamepads()
        this.gamepad = gamepads[ this.gamepadIndex ]
    }

    readDirection() {
        this.#updateGamepad()
        const buttons = this.gamepad.buttons
        const firstButton = buttons[this.firstButtonIndex]
        const secondButton = buttons[this.secondButtonIndex]

        if(buttonPressed(firstButton)) return -1
        if(buttonPressed(secondButton)) return 1
        return 0
    }

    readVelocity() {
        this.#updateGamepad()
        const axes = this.gamepad.axes
        const velocityAxis = axes[ this.axisIndex ]
        return velocityAxis
    }

    #updateGamepad() {
        const gamepads = navigator.getGamepads()
        this.gamepad = gamepads[ this.gamepadIndex ]
    }
}

function buttonPressed(b) {
    if (typeof b === "object") {
        return b.pressed;
    }
    return b === 1.0;
}