import * as THREE from 'three';
import {MeshLine, MeshLineGeometry, MeshLineMaterial} from '@lume/three-meshline'

export class TargetBox {
    static colors = {
        red: 0xff0000, 
        green: 0x00ff00,
        blue: 0x0000ff,
        cyan: 0x00ffff,
        yellow: 0xffff00
    }

    constructor( position, rotation, scene, scale = 1, color = TargetBox.colors.blue ) {
        this.position = position
        this.rotation = rotation

        // Create box
        this.geometry = new THREE.BoxGeometry( scale, scale, scale )
        this.material = new THREE.MeshBasicMaterial( { color: color} )
        this.mesh = new THREE.Mesh( this.geometry, this.material )
        scene.add( this.mesh )

        // Create bounding box
        this.boundingBox = new THREE.Box3().setFromObject( this.mesh )
        this.boundingBoxHelper = new THREE.Box3Helper( this.boundingBox, 0xffff00 )
        scene.add( this.boundingBoxHelper )




        const points = getCornersOfCube( this.boundingBox.min, this.boundingBox.max )
        // const points = [ new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 1) ]
        const geometry = new MeshLineGeometry()
        geometry.setPoints(points)
        const resolution = new THREE.Vector2( window.innerWidth, window.innerHeight )
        const material = new MeshLineMaterial({		
            useMap: false,
            color: new THREE.Color("white"),
            opacity: 1,
            resolution: resolution,
            sizeAttenuation: false,
            lineWidth: 10,
        })
        this.border = new MeshLine(geometry, material)
        scene.add( this.border )




        // Position in scene
        this.setPosition(this.position)
        this.setRotation(this.rotation)

    }

    setColor( color ) {
        this.material.color.setHex( color )
    }

    setBorderColor( color ) {
        this.border.material.color.setHex( color ) 
    }

    setPosition( position ) {
        this.position = position
        this.mesh.position.set( position.x, position.y, position.z )
        this.border.position.set( position.x, position.y, position.z )
        this.updateBoundingBox()
    }

    setRotation( rotation ) {
        this.rotaton = rotation
        this.mesh.rotation.set( rotation.x, rotation.y, rotation.z )
        this.rotation.set( rotation.x, rotation.y, rotation.z )
        this.updateBoundingBox()
    }

    updateBoundingBox() {
        this.boundingBox.setFromObject( this.mesh )
    }

    showMesh() {
        this.mesh.visible = true
    }

    hideMesh() {
        this.mesh.visible = false
    }

    showBorder() {
        this.border.visible = true
    }

    hideBorder() {
        this.border.visible = false
    }
}

function getCornersOfCube( min, max ) {
    const startingPoints = [ min, max ]
    let points = []
    const axes = [ "x", "y", "z" ]
    for(let i = 0; i < 2; i++) {
        let j = (i + 1) % 2
        let p = startingPoints[i]
        let arr = [ p.x, p.y, p.z ]
        const point = new THREE.Vector3().fromArray( arr )
        points.push(point)
        
        for(let k = 0; k < 3; k++) {
            arr[k] = startingPoints[j][ axes[k] ]
            const point = new THREE.Vector3().fromArray( arr )
            points.push(point)
            arr = [ p.x, p.y, p.z ]
        }
    }

    points = [ 
        new THREE.Vector3( min.x, min.y, min.z ), // 1
        new THREE.Vector3( max.x, min.y, min.z ), // 2
        new THREE.Vector3( max.x, max.y, min.z ), // 3
        new THREE.Vector3( min.x, max.y, min.z ), // 4
        new THREE.Vector3( min.x, min.y, min.z ), // 1

        new THREE.Vector3( min.x, min.y, max.z ), // 5
        new THREE.Vector3( max.x, min.y, max.z ), // 6
        new THREE.Vector3( max.x, max.y, max.z ), // 7
        new THREE.Vector3( min.x, max.y, max.z ), // 8
        new THREE.Vector3( min.x, min.y, max.z ), // 5

        new THREE.Vector3( max.x, min.y, max.z ), // 6
        new THREE.Vector3( max.x, min.y, min.z ), // 2
        new THREE.Vector3( max.x, max.y, min.z ), // 3
        new THREE.Vector3( max.x, max.y, max.z ), // 7
        new THREE.Vector3( min.x, max.y, max.z ), // 8
        new THREE.Vector3( min.x, max.y, min.z ), // 4

    ]

    return points
}