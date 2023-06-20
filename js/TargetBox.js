import * as THREE from 'three';
import { MeshLine, MeshLineMaterial, MeshLineRaycast } from 'three.meshline';

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

        // Create border that can change color
        this.borderGeometry = new THREE.EdgesGeometry( this.geometry ); // or WireframeGeometry( geometry )
        // this.borderMaterial = new THREE.LineBasicMaterial( { color: TargetBox.colors.yellow } );
        // this.border = new THREE.LineSegments( this.borderGeometry, this.borderMaterial );
        this.borderLine = new MeshLine()
        this.borderLine.setPoints( this.borderGeometry )
        this.borderMaterial = new MeshLineMaterial({ color: TargetBox.colors.yellow })
        this.border = new THREE.Mesh( this.borderLine, this.borderMaterial )
        scene.add( this.border );

        // Position in scene
        this.setPosition(this.position)
        this.setRotation(this.rotation)

    }

    setColor( color ) {
        this.material.color.setHex( color )
    }

    setBorderColor( color ) {
        this.borderMaterial.color.setHex( color ) 
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
        this.border.rotation.set( rotation.x, rotation.y, rotation.z )
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