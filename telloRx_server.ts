//% advanced=true
//% block="⚠スタッフ用⚠ Tello受信機ブロック"
//% group.min=0 group.max=255
namespace telloRx_server {
    let started = false

    let hasPending = false
    let pending = ""

    // 外部クラスからシリアル送信行う用（tello_bridgeクラスで利用中）
    export function _sendToSerial(s: string) {
        pending = "" + s
        hasPending = true
    }

    function startSerialWorkerOnce() {
        control.inBackground(() => {
            while (true) {
                if (hasPending) {
                    const s = pending
                    hasPending = false

                    serial.writeLine(s)
                }
                basic.pause(1)
            }
        })
    }

    function _startReceiverCommon(group: number, showIcon: boolean) {
        if (started) return
        started = true

        radio.setGroup(group)
        radio.setTransmitPower(7)
        radio.setFrequencyBand(group % 84)

        startSerialWorkerOnce()

        radioEzAck._setModeServer((payload: string) => {
            pending = "" + payload
            hasPending = true
        }, showIcon)
    }

    //% block="⚠スタッフ用⚠ 【最初だけ】PCサーバー受信機 （受信表示無） %group"
    //% group.min=0 group.max=255
    export function startReceiverPcServerNoIcon(group: number) {
        _startReceiverCommon(group, false)
    }

    //% block="⚠スタッフ用⚠ 【最初だけ】PCサーバー受信機 （受信表示有） %group"
    //% group.min=0 group.max=255
    export function startReceiverPcServer(group: number) {
        _startReceiverCommon(group, true)
    }
}