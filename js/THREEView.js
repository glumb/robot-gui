define((require, exports, module) => {

  class THREEView {
    constructor() {
      /* THREEJS SCENE SETUP */

      // this.renderer = new THREE.WebGLRenderer({
      //   antialias: true, // to get smoother output
      //   preserveDrawingBuffer: false, // no screenshot -> faster?
      // })
      // this.renderer.setClearColor(0x333333)
      //
      // this.renderer.setSize(window.innerWidth, window.innerHeight)
      // document.getElementById('container').appendChild(this.renderer.domElement)
      //
      // // create a scene
      // this.scene = new THREE.Scene()
      // debug.scene = this.scene
      //
      // // toggle camera mode
      // const perspectiveCamera = true
      // if (perspectiveCamera) {
      //   this.camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 10000)
      // } else {
      //   this.camera = new THREE.OrthographicCamera(
      //     window.innerWidth / -2,
      //     window.innerWidth / 2,
      //     window.innerHeight / 2,
      //     window.innerHeight / -2, -500, 1000)
      //   this.camera.zoom = 20
      //   this.camera.updateProjectionMatrix()
      // }
      //
      // this.camera.position.set(25, 25, -25)
      // this.scene.add(this.camera)
      //
      // // lights
      // const light = new THREE.AmbientLight(0xaaaaaa)
      // this.scene.add(light)
      // const light2 = new THREE.DirectionalLight(0xaaaaaa)
      // light2.position.set(1, 1.3, 1).normalize()
      // this.scene.add(light2)
      //
      // this.cameraControls = new THREE.OrbitControls(this.camera, this.renderer.domElement)
      // this.cameraControls.addEventListener('change', this.render.bind(this))
      //
      // function onWindowResize() {
      //   if (perspectiveCamera) {
      //     scope.camera.aspect = window.innerWidth / window.innerHeight
      //     scope.camera.updateProjectionMatrix()
      //   } else {
      //     scope.camera.left = window.innerWidth / -2
      //     scope.camera.right = window.innerWidth / 2
      //     scope.camera.top = window.innerHeight / 2
      //     scope.camera.bottom = window.innerHeight / -2
      //     scope.camera.updateProjectionMatrix()
      //   }
      //
      //   scope.renderer.setSize(window.innerWidth, window.innerHeight)
      //   scope.render()
      // }
      //
      // window.addEventListener('resize', onWindowResize, false)
      //
      // const size = 10
      // const step = 20
      //
      // const gridHelper = new THREE.GridHelper(size, step)
      // this.scene.add(gridHelper)
      //
      // const axisHelper = new THREE.AxisHelper(5)
      // this.scene.add(axisHelper)

      /* END THREEJS SCENE SETUP */
    }

    render() {
      this.renderer.render(this.scene, this.camera)
    }
  }

  module.exports = new THREEView()
})
