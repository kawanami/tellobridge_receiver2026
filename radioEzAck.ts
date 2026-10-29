// **使用中!!**
// 通常のRadio通信において，簡易的なACK処理を追加する
// Tello-Bridgeとの互換ありのため，採用

// 問題点：Tello-Bridgeで利用する際は必ず3回コマンドが送信される．（ACK返答がないため）
// Tello-Bridgeでは短期間における連続コマンド受信は無視するため，重複動作は行わない（動作確認済み）

namespace radioEzAck {
    enum Mode {
        None = 0,
        Controller = 1,
        Server = 2
    }

    let mode: Mode = Mode.None
    let inited = false

    const ACK_TEXT = "OK"
    const RETRY_MAX = 3
    let ACK_TIMEOUT_MS = 100
    let SHOW_RX_CMD_ICON = false
    let DEBUG = false

    let waiting = false
    let acked = false

    let rxHandler: (cmd: string) => void = null

    function log(s: string) {
        if (DEBUG) serial.writeLine("[radioEzAck] " + s)
    }
    export function setDebug(enabled: boolean) {
        DEBUG = enabled
        if (DEBUG) serial.writeLine("[radioEzAck] DEBUG ON")
    }
    export function setAckTimeout(ms: number) {
        ACK_TIMEOUT_MS = ms
        log("ACK_TIMEOUT_MS=" + ms)
    }

    function initIfNeeded() {
        if (inited) return
        inited = true
        radio.onReceivedString(onRx)
        log("init ok")
    }

    function onRx(msg: string) {
        // ACK受信
        if (msg == ACK_TEXT) {
            if (waiting) {
                acked = true
                log("RX ACK (OK) -> matched")
            } else {
                log("RX ACK (OK) -> ignored (not waiting)")
            }
            return
        }

        if (mode == Mode.Server) {
            const cmd = "" + msg // 念のためコピー
            log("RX CMD: " + cmd)

            // ★受信イベント内で重いことはしない：handlerもACK送信も外へ
            control.inBackground(() => {
                // handler（Tello-Bridge互換）
                if (rxHandler) rxHandler(cmd)

                // ACK返信（受信イベント外）
                basic.pause(10)
                radio.sendString(ACK_TEXT)
                log("TX ACK (OK)")

                if (SHOW_RX_CMD_ICON) {
                    basic.showIcon(IconNames.Target)
                    basic.pause((300))
                    basic.clearScreen()
                }
            })
            return
        }

        // NOTE: サーバ → コントローラ通信実装時に利用
        // TODO: 実装を完了させる
        if (mode == Mode.Controller) {
        }

        log("RX ignored (mode=" + mode + " msg=" + msg + ")")
    }

    export function _setModeController() {
        initIfNeeded()
        mode = Mode.Controller
        rxHandler = null
        log("mode=Controller")
    }

    export function _setModeServer(handler: (cmd: string) => void, showRxIcon: boolean = false) {
        initIfNeeded()
        mode = Mode.Server
        rxHandler = handler
        SHOW_RX_CMD_ICON = showRxIcon
        log("mode=Server showRxIcon=" + showRxIcon)
    }

    export function _sendWithAck(cmd: string): boolean {
        initIfNeeded()

        if (waiting) {
            log("SEND rejected (already waiting)")
            return false
        }

        waiting = true
        acked = false

        log("SEND start cmd=" + cmd)

        for (let i = 0; i < RETRY_MAX; i++) {
            log("TX cmd try=" + (i + 1))
            radio.sendString(cmd)

            const t0 = control.millis()
            while (control.millis() - t0 < ACK_TIMEOUT_MS) {
                if (acked) {
                    waiting = false
                    log("SEND success")
                    return true
                }
                basic.pause(5)
            }
            log("TIMEOUT (no OK)")
        }

        waiting = false
        log("SEND failed")
        return false
    }
}
