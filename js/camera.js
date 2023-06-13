import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { storeManager } from './State';

import { FlyControls } from 'three/examples/jsm/controls/FlyControls'

import { scene } from './scene';
import { renderer } from './scene';
import { manager } from './scene';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';


const params = {
    threshold: 0,
    strength: 0.1,
    radius: 0,
    exposure: 1,
    show: true
};

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

const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
bloomPass.threshold = params.threshold;
bloomPass.strength = params.strength;
bloomPass.radius = params.radius;

const outputPass = new OutputPass( THREE.ACESFilmicToneMapping );

const gui = new GUI();

const bloomFolder = gui.addFolder( 'bloom' );

bloomFolder.add( params, 'threshold', 0.0, 1.0 ).onChange( function ( value ) {

    bloomPass.threshold = Number( value );

} );

bloomFolder.add( params, 'strength', 0.0, 3.0 ).onChange( function ( value ) {

    bloomPass.strength = Number( value );

} );

bloomFolder.add( params, 'radius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value ) {

    bloomPass.radius = Number( value );

} );

bloomFolder.add(params, 'show').onChange(setupPostProc)

const toneMappingFolder = gui.addFolder( 'tone mapping' );

toneMappingFolder.add( params, 'exposure', 0.1, 2 ).onChange( function ( value ) {

    outputPass.toneMappingExposure = Math.pow( value, 4.0 );

} );

setupCams()
setupPostProc()

function setupCams() {
    for ( let ii = 0; ii < views.length; ++ ii ) {

        const view = views[ ii ];
        const camera = new THREE.PerspectiveCamera( view.fov, window.innerWidth / window.innerHeight, 0.1, 10000 );
        camera.position.fromArray( view.eye );
        camera.up.fromArray( view.up );
        camera.lookAt(new THREE.Vector3().fromArray( view.lookAt ))
        view.camera = camera;
    }
}

function setupPostProc() {
    for ( let ii = 0; ii < views.length; ++ ii ) {
        const view = views[ii]
        const camera = view.camera
        const composer = new EffectComposer( renderer );

        const renderPass = new RenderPass( scene, camera );
        composer.addPass( renderPass ); 
        
        const glitchPass = new GlitchPass();
        // composer.addPass( glitchPass );

        if(params.show) composer.addPass( bloomPass );
        composer.addPass( outputPass ); 

        view.composer = composer
    }
}

let windowWidth, windowHeight;

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

        view.composer.render()
    }
}


function updateSize() {

    if ( windowWidth != window.innerWidth || windowHeight != window.innerHeight ) {

        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;

        renderer.setSize( windowWidth, windowHeight );

    }

}

const orbitControls = new OrbitControls(views[0].camera, renderer.domElement)
// orbitControls.addEventListener('change', () => renderer.render(scene, camera))

// const flyControls = new FlyControls( camera, renderer.domElement );

// flyControls.movementSpeed = 20;
// flyControls.rollSpeed = Math.PI / 12;
// flyControls.autoForward = false;
// flyControls.dragToLook = true;

const progressBarContainer = document.querySelector('.progress-bar-container')
manager.onLoad = function ( ) {
	progressBarContainer.style.display = 'none'
    animate()
};

export function animate() {
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

export const camera3 = views[2].camera