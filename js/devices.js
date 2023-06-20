export class RotaryEncoder {
    constructor( gamepadIndex, firstButtonIndex, secondButtonIndex ){
        this.gamepadIndex = gamepadIndex
        this.firstButtonIndex = firstButtonIndex
        this.secondButtonIndex = secondButtonIndex
    }

    readDirection() {
        const gamepads = navigator.getGamepads()
        const gamepad = gamepads[this.gamepadIndex]
        const buttons = gamepad.buttons
        const firstButton = buttons[this.firstButtonIndex]
        const secondButton = buttons[this.secondButtonIndex]

        if(buttonPressed(firstButton)) return -1
        if(buttonPressed(secondButton)) return 1
        return 0
    }
}

function buttonPressed(b) {
    if (typeof b === "object") {
        return b.pressed;
    }
    return b === 1.0;
}