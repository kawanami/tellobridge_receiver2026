/**
 * tello_bridge.ts
 *
 * Tello-Bridge 用ユーティリティ
 *
 * - Tello機体番号（SSID末尾）をセット
 * - serial (P0/P1, 57600) を初期化
 * - radio受信 → serial転送 (telloRx_server.startReceiverTelloBridge)
 * - ss= / pass= を2回送信して確実化
 */

namespace tello_bridge {
    let initiated = false

    // ---- 設定値 ----
    let radio_group = 0

    // Tello Wi-Fi情報
    let telloSuffix = ""   // 例: "E97455"
    let ssid = ""          // "TELLO-" + suffix
    let pass = ""          // 通常は空

    // シリアル設定（Tello-Bridge仕様）
    const BRIDGE_BAUD = BaudRate.BaudRate57600
    const TX_PIN = SerialPin.P0
    const RX_PIN = SerialPin.P1

    // Wi-Fi送信安定化用（あなたの経験則）
    const SEND_REPEAT = 2
    const SS_WAIT_MS = 1000
    const PASS_WAIT_MS = 1500

    let DEBUG = false

    function log(s: string) {
        if (DEBUG) serial.writeLine("[tello_bridge] " + s)
    }

    //% block="Tello-Bridge デバッグ %enabled"
    export function setDebug(enabled: boolean) {
        DEBUG = enabled
        if (DEBUG) serial.writeLine("[tello_bridge] DEBUG ON")
    }

    /**
     * Tello機体番号（SSID末尾）を設定する
     * 例: "E97455"
     */
    //% block="Tello機体番号を設定 %suffix"
    //% suffix.defl="E97455"
    export function setTelloSuffix(suffix: string) {
        telloSuffix = "" + suffix
        ssid = "TELLO-" + telloSuffix
        log("set suffix=" + telloSuffix + " ssid=" + ssid)
    }

    /**
     * Telloパスワードを設定する（通常は空文字）
     */
    //% block="Telloパスワードを設定 %password"
    //% password.defl=""
    export function setPassword(password: string) {
        pass = "" + password
        log("set pass=" + pass)
    }

    /**
     * 現在のSSIDを取得（デバッグ用）
     */
    //% block="現在のTello SSID"
    export function getSsid(): string {
        return ssid
    }

    function sendWifiOnce() {
        if (ssid.length == 0) {
            log("SSID is empty -> ignored")
            return
        }

        serial.writeLine("ss=" + ssid)
        basic.pause(SS_WAIT_MS)

        serial.writeLine("pass=" + pass)
        basic.pause(PASS_WAIT_MS)
    }

    function sendWifiRepeated() {
        for (let i = 0; i < SEND_REPEAT; i++) {
            sendWifiOnce()
        }
    }

    /**
     * Tello-Bridge 初期化
     *
     * - serial.redirect(P0,P1,57600)
     * - telloRx_server.startReceiverTelloBridge(group)
     * - 起動時に自動で Wi-Fi設定送信（オプション）
     */
    //% block="⚠スタッフ用⚠ Tello-Bridge初期化 group %group 自動接続 %autoConnect"
    //% group.min=0 group.max=255
    export function start(group: number, autoConnect: boolean = true) {
        if (initiated) return
        initiated = true

        radio_group = group

        // SSID未設定なら安全にデフォルトを入れる
        if (ssid.length == 0) {
            telloSuffix = "E97455"
            ssid = "TELLO-" + telloSuffix
        }

        // serial (Bridge)
        serial.redirect(TX_PIN, RX_PIN, BRIDGE_BAUD)

        // radio受信機起動（Tello-Bridge版）
        telloRx_server.startReceiverPcServer(radio_group)

        log("start ok group=" + group + " ssid=" + ssid)

        // SSID末尾2文字だけ表示（あなたのUIを踏襲）
        if (ssid.length >= 12) {
            basic.showString(ssid.substr(10, 2))
        }

        // 起動時に自動接続する
        if (autoConnect) {
            basic.showIcon(IconNames.Heart)
            sendWifiRepeated()
            basic.showIcon(IconNames.Yes)
        }
    }

    /**
     * Wi-Fi設定を再送（接続が不安定なとき用）
     */
    //% block="Tello-Bridge，WiFi再接続"
    export function resendWifi() {
        if (!initiated) return

        basic.showIcon(IconNames.Heart)
        sendWifiRepeated()
        basic.showIcon(IconNames.Yes)

        log("resend wifi done")
    }

    /**
     * 任意コマンドを送信する
     * 例: "land", "takeoff", "emergency"
     */
    //% block="Tello-Bridgeへコマンド送信 %cmd"
    //% cmd.defl="land"
    export function sendCommand(cmd: string) {
        if (!initiated) return

        telloRx_server._sendToSerial(cmd)
    }
}
