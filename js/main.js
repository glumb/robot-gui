import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'


const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdddddd)

const camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 5000 );
camera.rotation.y = 45/180*Math.PI
camera.position.x = 100
camera.position.y = 10
camera.position.z = 100

const light = new THREE.AmbientLight(0x404040, 10)
scene.add(light)

const light1 = new THREE.PointLight(0xc4c4c4, 100)
light.position.set(0, 300, 500)
scene.add(light1)

const directionalLight  = new THREE.DirectionalLight(0xffffff, 100)
directionalLight.position.set(0, 1, 0)
directionalLight.caseShadow = true;
scene.add(directionalLight)

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.update()

const axesHelper = new THREE.AxesHelper(20);
scene.add(axesHelper)

const loader = new GLTFLoader();

loader.load( 'ISS_stationary.glb', function ( gltf ) {
	const model = gltf.scene
	scene.add( model );
	model.scale.set(0.5, 0.5, 0.5)

}, undefined, function ( error ) {

	console.error( error );

} );


function animate() {
	requestAnimationFrame( animate );

	renderer.render( scene, camera );
}

if ( WebGL.isWebGLAvailable() ) {

	// Initiate function or other initializations here
	animate();

} else {

	const warning = WebGL.getWebGLErrorMessage();
	document.getElementById( 'container' ).appendChild( warning );

}