define((require, exports, module) => {
  const storeManager = require('State')
  const robotStore = require('Robot')
  const io = require('/socket.io/socket.io.js')
  const gui = require('UiDat')

  /**
   * + state per module
   * + render on state changed
   * + get state from other modules
   *
   * --- onStore update render ---
   * get data From other stores
   * - store might not have changed, so no update
   */

  const defaultState = {
    sendData: false,
    sendDataInterval: 4000,
    selectedUSBDevice: 'None',
    remoteStatus: 'unknown',
    USBDevices: [],
  }

  const store = storeManager.createStore('RemoteRobot', defaultState)

  store.action('CHANGE_SEND_DATA', (state, data) => Object.assign({}, state, {
    sendData: data,
  }))

  store.action('CHANGE_SEND_DATA_INTERVAL', (state, data) => Object.assign({}, state, {
    sendDataInterval: data,
  }))

  store.action('SET_AVAILABLE_USB_DEVICES', (state, data) => Object.assign({}, state, {
    USBDevices: data,
  }))

  store.action('SELECT_USB_DEVICE', (state, data) => Object.assign({}, state, {
    selectedUSBDevice: data,
  }))

  store.action('CHANGE_REMOTE_STATUS', (state, data) => Object.assign({}, state, {
    remoteStatus: data,
  }))

  const remoteRobotGui = gui.addFolder('RemoteRobot')

  const guiHelper = Object.assign({}, defaultState)

  let addedDropdownGui = false
  store.listen((state) => {
    guiHelper.sendData = state.sendData
    guiHelper.sendDataInterval = state.sendDataInterval
    guiHelper.selectedUSBDevice = state.selectedUSBDevice
    guiHelper.remoteStatus = state.remoteStatus
    guiHelper.USBDevices = state.USBDevices

    if (state.USBDevices[0] && !addedDropdownGui) {
      addedDropdownGui = true
        // add the gui after the dropdoenlist is available, since its content cant be changed
      remoteRobotGui.add(guiHelper, 'selectedUSBDevice', guiHelper.USBDevices).onChange(() => {
        console.log(guiHelper.selectedUSBDevice)
        store.dispatch('SELECT_USB_DEVICE', guiHelper.selectedUSBDevice)
        socket.emit('connectToPort', {
          port: guiHelper.selectedUSBDevice,
        }, (result) => {
          // doto only if successfull
          store.dispatch('CHANGE_REMOTE_STATUS', 'portOpen')
          console.log(`connected: ${result}`)
        })
      })
    }

    // Iterate over all controllers
    for (const i in remoteRobotGui.__controllers) {
      remoteRobotGui.__controllers[i].updateDisplay()
      console.log('update')
    }
  })

  // REMOTE ROBOT
  const socket = io()

  const setupComplete = false
  const ports = []

  remoteRobotGui.add(guiHelper, 'remoteStatus')

  remoteRobotGui.add(guiHelper, 'sendDataInterval').onChange(() => {
    store.dispatch('CHANGE_SEND_DATA_INTERVAL', guiHelper.sendDataInterval)
  })

  let interval

  remoteRobotGui.add(guiHelper, 'sendData').onChange(() => {
    if (store.getState().remoteStatus === 'portOpen') {
      store.dispatch('CHANGE_SEND_DATA', guiHelper.sendData)
      if (store.getState().sendData) {
        interval = setInterval(() => {
          const outOfBound = robotStore.getState().jointOutOfBound.reduce((previous, current) => previous || current, false)
          if (!outOfBound) {
            socket.emit('write', {
              port: store.getState().selectedUSBDevice,
              message: `M00 V0 R0 ${(robotStore.getState().angles.A0 / Math.PI * 180).toFixed(3)} ` +
                  `R1 ${(robotStore.getState().angles.A1 / Math.PI * 180).toFixed(3)} ` +
                  `R2 ${(robotStore.getState().angles.A2 / Math.PI * 180).toFixed(3)} ` +
                  `R3 ${(robotStore.getState().angles.A3 / Math.PI * 180).toFixed(3)} ` +
                  `R4 ${(robotStore.getState().angles.A4 / Math.PI * 180).toFixed(3)} ` +
                  `R5 ${(robotStore.getState().angles.A5 / Math.PI * 180).toFixed(3)} \r`,
            },
              (res) => {
                console.log(res)
              })
          }
        }, store.getState().sendDataInterval)
      } else {
        clearInterval(interval)
      }
    }
  })

  socket.emit('getPortList', {}, (ports) => {
    console.log(ports)

    store.dispatch('SET_AVAILABLE_USB_DEVICES', ports)

    const interval = null
  })

  socket.on('data', (data) => {
    console.log(data)
      // todo
      // this.Robot.setAngles([20, 1, 1, 1, 1, 1])
  })

  socket.on('portStatusChanged', (data) => {
    store.dispatch('CHANGE_REMOTE_STATUS', data.status)
  })

  /* END DAT GUI */

  /* INIT MODULES */

  // this.Robot = new Robot(this.state, this.scene)
  // this.RobotTHREE = new RobotTHREE(this.state, this.scene)
  // this.Robot.setVisible(this.state.showRobot)
  // this.Target = new Target(this.state, this.scene, this.camera, this.renderer, this.cameraControls)

  // remote robot
  // const geometryArray = Object.values(this.state.Robot.geometry).map(val => [val.x, val.y, val.z])
  // const jointLimitsArray = Object.values(this.state.Robot.jointLimits)
  //
  // this.THREERemoteRobot = new THREE.Group()
  // this.THREERemoteRobot.visible = scope.state.showRemoteRobot
  // this.scene.add(this.THREERemoteRobot)
  // this.RemoteRobot = new THREERobot(geometryArray, jointLimitsArray, this.THREERemoteRobot)

  /* END INIT MODULES */
  module.exports = store
})
