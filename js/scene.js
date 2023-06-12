import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { storeManager } from './State';

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
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap

console.log(renderer.capabilities.maxTextureSize)
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

let windowWidth, windowHeight;
let mouseX = 0, mouseY = 0;

const views = [
    {
        left: 0.5,
        bottom: 0,
        width: 0.5,
        height: 1.0,
        eye: [ -10.7, 11.4, 6.9 ],
        lookAt: [0, 5, 0],
        up: [ 0, 0, 1 ],
        fov: 40,
    },
    {
        left: 0,
        bottom: 0,
        width: 0.5,
        height: 0.5,
        eye: [ 3.7, -0.75, -0.5 ],
        lookAt: [0, 5, 0],
        up: [ 0, 0, 1 ],
        fov: 100,
    },
    {
        left: 0,
        bottom: 0.5,
        width: 0.5,
        height: 0.5,
        eye: [ 0, 11, 0 ],
        lookAt: [0, 12, 0],
        up: [ 0, 0, 1 ],
        fov: 50,
    }
];

for ( let ii = 0; ii < views.length; ++ ii ) {

    const view = views[ ii ];
    const camera = new THREE.PerspectiveCamera( view.fov, window.innerWidth / window.innerHeight, 0.1, 10000 );
    camera.position.fromArray( view.eye );
    camera.up.fromArray( view.up );
    camera.lookAt(new THREE.Vector3().fromArray( view.lookAt ))
    view.camera = camera;

}

function onDocumentMouseMove( event ) {

    mouseX = ( event.clientX - windowWidth / 2 );
    mouseY = ( event.clientY - windowHeight / 2 );

}

document.addEventListener( 'mousemove', onDocumentMouseMove );

function render() {

    updateSize();

    for ( let ii = 0; ii < views.length; ++ ii ) {

        const view = views[ ii ];
        const camera = view.camera;

        const left = Math.floor( windowWidth * view.left );
        const bottom = Math.floor( windowHeight * view.bottom );
        const width = Math.floor( windowWidth * view.width );
        const height = Math.floor( windowHeight * view.height );

        renderer.setViewport( left, bottom, width, height );
        renderer.setScissor( left, bottom, width, height );
        renderer.setScissorTest( true );
        renderer.setClearColor( view.background );

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.render( scene, camera );

    }
}


function updateSize() {

    if ( windowWidth != window.innerWidth || windowHeight != window.innerHeight ) {

        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;

        renderer.setSize( windowWidth, windowHeight );

    }

}

// scene.rotation.x = -(Math.PI)/2;
camera.up.set(0, 0, 1)
camera.position.set(10, 10, 10)


scene.add(camera)

// renderer.render( scene, camera );

// lights
const light = new THREE.AmbientLight(0xffffff)
light.intensity = 0.2
scene.add(light)

const point = new THREE.PointLight(0xffffff)
point.position.set(100, 0, 0)
point.castShadow = true
point.intensity = 1.3
point.shadow.mapSize.set(16384, 16384)
point.shadow.radius = 5
scene.add(point)


const orbitControls = new OrbitControls(views[0].camera, renderer.domElement)
// orbitControls.addEventListener('change', () => renderer.render(scene, camera))

const flyControls = new FlyControls( camera, renderer.domElement );

flyControls.movementSpeed = 20;
flyControls.rollSpeed = Math.PI / 12;
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
// scene.add(gridHelper)

const axesHelper = new THREE.AxesHelper(5)
// scene.add(axesHelper)


const manager = new THREE.LoadingManager();
const objectLoader = new THREE.ObjectLoader( manager );
const rgbeLoader = new RGBELoader( manager );

manager.onStart = function ( url, itemsLoaded, itemsTotal ) {
	console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
};

const progressBar = document.getElementById('progress-bar');
const progressLabel = document.getElementById('progress-bar-label');
manager.onProgress = function ( url, itemsLoaded, itemsTotal) {
    //TODO: update this
    itemsTotal = 68
	progressBar.value = (itemsLoaded / itemsTotal) * 100
    progressLabel.innerHTML = 'Loaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.'
};

const progressBarContainer = document.querySelector('.progress-bar-container')
manager.onLoad = function ( ) {
	progressBarContainer.style.display = 'none'
    animate()
};

// manager.onError = function ( url ) {
// 	console.log( 'There was an error loading ' + url );
// };

// for(let i = 0; i < 9; i++) {
//     objectLoader.load(
//         // resource URL
//         "/man.json",

//         // onLoad callback
//         // Here the loaded data is assumed to be an object
//         function ( obj ) {
//             // Add the loaded object to the scene
//             scene.add( obj );
//             obj.name = "guy" + i
//             // model.scale.set(0.5, 0.5, 0.5)
//             // let bounds = {
//             //     x: [-3, 3],
//             //     y: [0, 6],
//             //     z: [-2.5, 3]
//             //   }
      
//             // obj.position.x = Math.random() * (bounds.x[1]-bounds.x[0]) + bounds.x[0]
//             // obj.position.y = Math.random() * (bounds.y[1]-bounds.y[0]) + bounds.y[0]
//             // obj.position.z = Math.random() * (bounds.z[1]-bounds.z[0]) + bounds.z[0]
//             obj.position.set(0, 3, 2)
//         },

//         // onProgress callback
//         function ( xhr ) {
//             // console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
//         },

//         // onError callback
//         function ( err ) {
//             console.error( 'An error happened' );
//         }
//     );
// }

// var astronaut = {};
// for (let i = 0; i < 9; i++) {
//     var name = "guy" + i
//     astronaut[name] = {
//         "x_vel": (Math.random() < 0.5 ? -1 : 1) * 0.001,
//         "y_vel": (Math.random() < 0.5 ? -1 : 1) * 0.001,
//         "z_vel": (Math.random() < 0.5 ? -1 : 1) * 0.001,
//         "x_rot": (Math.random() < 0.5 ? -1 : 1) * 0.005,
//         "y_rot": (Math.random() < 0.5 ? -1 : 1) * 0.005

//     }
//     // for (let j = 0; j < 5; j++) {
//     //     astronaut[name] = 
//     // }
// }


// INTENSIVE STUFF

objectLoader.load(
	// resource URL
	"/ISS.json",

	// onLoad callback
	// Here the loaded data is assumed to be an object
	function ( obj ) {
		// Add the loaded object to the scene
		scene.add( obj );
        obj.position.set(-17.5, -13.375, -1.5)
        obj.rotation.set((Math.PI)/2, (Math.PI)/2, 0)

        obj.traverse(function(node) {
            if(node.isMesh) {
                node.castShadow = true
                node.receiveShadow = true
            }
        })
	},

	// onProgress callback
	function ( xhr ) {
		// console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
	},

	// onError callback
	function ( err ) {
		console.error( 'An error happened' );
	}
);

rgbeLoader.load('RenderCrate-HDRI_Orbital_46_Sunset_4K.hdr', function(texture) {
    texture.mapping = THREE.EquirectangularRefractionMapping
    scene.background = texture;
    // scene.environment = texture;
})

/* END THREEJS SCENE SETUP */

// animate()
function animate() {
    // renderer.render( scene, camera );
    // console.log(views[0].camera)
    render()
    // 3. update controls with a small step value to "power its engines"
    // flyControls.update(0.01)
    orbitControls.update(0.01)
    // try {
    //     for(let i = 0; i < 9; i++) {
    //         let name = "guy" + i
    //         const guy =  scene.getObjectByName(name)     
    //         guy.position.x += astronaut[name].x_vel
    //         guy.position.z += astronaut[name].z_vel
    //         guy.position.y += astronaut[name].y_vel 
    //         guy.rotation.x += astronaut[name].x_rot
    //         guy.rotation.y += astronaut[name].y_rot
    //     }
    // } catch (err) {
    //     //do  nothing idc
    // }
    

    requestAnimationFrame( animate );
};

export { scene }
export { renderer }
export { camera }
export { objectLoader}
export const camera3 = views[2].camera