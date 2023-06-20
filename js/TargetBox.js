import * as THREE from 'three';

export class TargetBox {
    static colors = {
        red: 0xff0000, 
        green: 0x00ff00,
        blue: 0x0000ff
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

        // Position in scene
        this.setPosition(this.position)
        this.setRotation(this.rotation)
    }

    setColor( color ) {
        this.material.color.setHex( color )
    }

    setPosition( position ) {
        this.position = position
        this.mesh.position.set( position.x, position.y, position.z )
        this.updateBoundingBox()
    }

    setRotation( rotation ) {
        this.rotaton = rotation
        this.mesh.rotation.set( rotation.x, rotation.y, rotation.z )
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
}