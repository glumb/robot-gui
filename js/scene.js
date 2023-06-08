import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { storeManager } from './State';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls'

const THREEStore = storeManager.createStore('THREE', {})

/* THREEJS SCENE SETUP */

const renderer = new THREE.WebGLRenderer({
    antialias: true, // to get smoother output
    preserveDrawingBuffer: false, // no screenshot -> faster?
})
renderer.setClearColor(0x333333)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild( renderer.domElement );

// create a scene
const scene = new THREE.Scene()

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

// scene.rotation.x = -(Math.PI)/2;
camera.up.set(0, 0, 1)
camera.position.set(25, 25, 25)


scene.add(camera)

// lights
const light = new THREE.AmbientLight(0xaaaaaa)
scene.add(light)
const light2 = new THREE.DirectionalLight(0xaaaaaa)
light2.position.set(1, 1.3, 1).normalize()
scene.add(light2)

const light3 = new THREE.DirectionalLight(0xFAFCB2)
light2.position.set(1, 1.3, 1).normalize()
scene.add(light3)

const orbitControls = new OrbitControls(camera, renderer.domElement)
orbitControls.addEventListener('change', () => renderer.render(scene, camera))

const flyControls = new FlyControls( camera, renderer.domElement );

flyControls.movementSpeed = 100;
flyControls.rollSpeed = Math.PI / 24;
flyControls.autoForward = false;
flyControls.dragToLook = true;

//controls.update(0.01)


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

const size = 40
const step = 20

const gridHelper = new THREE.GridHelper(size, step)
gridHelper.rotation.x = Math.PI / 2
scene.add(gridHelper)

const axesHelper = new THREE.AxesHelper(5)
// scene.add(axesHelper)

renderer.render( scene, camera );

// const loader = new GLTFLoader();
// loader.load( 'ISS_stationary.glb', function ( gltf ) {
// 	const model = gltf.scene
// 	scene.add( model );
// 	// model.scale.set(0.5, 0.5, 0.5)
//     model.position.set(-17.5, -13.375, -1.5)
//     model.rotation.set((Math.PI)/2, (Math.PI)/2, 0)
//     console.log(model)
    

// }, undefined, function ( error ) {

// 	console.error( error );

// } );

// const loader = new THREE.ObjectLoader();
// loader.load(
// 	// resource URL
// 	"/ISS.json",

// 	// onLoad callback
// 	// Here the loaded data is assumed to be an object
// 	function ( obj ) {
// 		// Add the loaded object to the scene
// 		scene.add( obj );
//         obj.position.set(-17.5, -13.375, -1.5)
//         obj.rotation.set((Math.PI)/2, (Math.PI)/2, 0)
// 	},

// 	// onProgress callback
// 	function ( xhr ) {
// 		console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
// 	},

// 	// onError callback
// 	function ( err ) {
// 		console.error( 'An error happened' );
// 	}
// );

// const loader1 = new RGBELoader();
// loader1.load('RenderCrate-HDRI_Orbital_46_Sunset_4K.hdr', function(texture) {
//     texture.mapping = THREE.EquirectangularRefractionMapping
//     scene.background = texture;
//     scene.environment = texture;
// })

// const geometry = new THREE.SphereGeometry( 100, 100, 100 ); 
// const material = new THREE.MeshBasicMaterial( {
//     map: new THREE.TextureLoader().load(
//         '/8k_earth_daymap.jpg'
//     )
// } );
// const sphere = new THREE.Mesh( geometry, material ); scene.add( sphere );
// sphere.position.set(-17.5, -13.375, -1050)

/* END THREEJS SCENE SETUP */

THREEStore.listen(() => {
// kickass trick to render after other listeners. Stack and stuff
    setTimeout(() => {
        renderer.render(scene, camera)
    }, 0)
})

// animate()
// function animate() {
//     renderer.render( scene, camera );
//     // 3. update controls with a small step value to "power its engines"
//     flyControls.update(0.01)
//     requestAnimationFrame( animate );
// };

export { scene }
export { renderer }
export { camera }
// export { model }

// module.exports.scene = scene
// module.exports.renderer = renderer
// module.exports.camera = camera