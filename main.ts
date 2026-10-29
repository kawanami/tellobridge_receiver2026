// Aでland
input.onButtonPressed(Button.A, function () {
    tello_bridge.sendCommand("land")
    basic.showLeds(`
        # # # # #
        . . # . .
        # . # . #
        . # # # .
        . . # . .
        `)
    basic.pause(1000)
})
// ABでWi-Fi再送
input.onButtonPressed(Button.AB, function () {
    tello_bridge.resendWifi()
    basic.showLeds(`
        . . . . .
        # . . . #
        # . # . #
        . # . # .
        . # . # .
        `)
    basic.pause(1000)
})
// B長押しでemergency
input.onButtonPressed(Button.B, function () {
    for (let index = 0; index < 4; index++) {
        basic.pause(100)
        if (input.buttonIsPressed(Button.B)) {
            tello_bridge.sendCommand("emergency")
            basic.showIcon(IconNames.No)
            basic.pause(1000)
            break;
        }
    }
})
let radio_group = 51
tello_bridge.setTelloSuffix("9BFBEE")
tello_bridge.setPassword("")
tello_bridge.start(radio_group, true)
