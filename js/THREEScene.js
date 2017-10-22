define((require, exports, module) => {
  const storeManager = require('State')

  const THREEStore = storeManager.createStore('THREE', {})
  /* THREEJS SCENE SETUP */

  const renderer = new THREE.WebGLRenderer({
    antialias: true, // to get smoother output
    preserveDrawingBuffer: false, // no screenshot -> faster?
  })
  renderer.setClearColor(0x333333)

  renderer.setSize(window.innerWidth, window.innerHeight)
  document.getElementById('container').appendChild(renderer.domElement)

  // create a scene
  const scene = new THREE.Scene()

  debug.scene = scene
  // toggle camera mode
  const perspectiveCamera = true
  let camera
  if (perspectiveCamera) {
    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 10000)
  } else {
    camera = new THREE.OrthographicCamera(
      window.innerWidth / -2,
      window.innerWidth / 2,
      window.innerHeight / 2,
      window.innerHeight / -2, -500, 1000)
    camera.zoom = 20
    camera.updateProjectionMatrix()
  }

  camera.up.set(0, 0, 1)
  camera.position.set(25, 25, 25)
  scene.add(camera)

  // lights
  const light = new THREE.AmbientLight(0xaaaaaa)
  scene.add(light)
  const light2 = new THREE.DirectionalLight(0xaaaaaa)
  light2.position.set(1, 1.3, 1).normalize()
  scene.add(light2)

  cameraControls = new THREE.OrbitControls(camera, renderer.domElement)
  cameraControls.addEventListener('change', () => renderer.render(scene, camera))

  function onWindowResize() {
    if (perspectiveCamera) {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
    } else {
      camera.left = window.innerWidth / -2
      camera.right = window.innerWidth / 2
      camera.top = window.innerHeight / 2
      camera.bottom = window.innerHeight / -2
      camera.updateProjectionMatrix()
    }

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.render(scene, camera)
  }

  window.addEventListener('resize', onWindowResize, false)

  const size = 10
  const step = 20

  const gridHelper = new THREE.GridHelper(size, step)
  gridHelper.rotation.x = Math.PI / 2
  scene.add(gridHelper)

  const axisHelper = new THREE.AxisHelper(5)
  scene.add(axisHelper)

  /* END THREEJS SCENE SETUP */

  THREEStore.listen(() => {
    // kickass trick to render after other listeners. Stack and stuff
    setTimeout(() => {
      renderer.render(scene, camera)
    }, 0)
  })

  module.exports.scene = scene
  module.exports.renderer = renderer
  module.exports.camera = camera
})
