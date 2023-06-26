import * as THREE from 'three'
import { loadObject } from './scene'
import { camera3 } from './camera'
// import { scene } from './scene'

import { OBB } from 'three/examples/jsm/math/OBB'

export default class THREERobot {
  constructor(V_initial, limits, scene) {
    this.arm = new THREE.Group()

    this.robotBones = []
    this.joints = []
    this.robotBasicMeshes = []
    this.bbHelpers = []

    const scope = this

    let parentObject = this.arm

    const colors = [
      0xaaaaaa,
      0xbbbbbb,
      0xbcbcbc,
      0xcbcbcb,
      0xcccccc,
      0x00ff00,
    ]

    function createCube(x, y, z, w, h, d, min, max, jointNumber, robotBasicMeshes) {
      const thicken = 0.35

      const w_thickened = Math.abs(w) + thicken
      const h_thickened = Math.abs(h) + thicken
      const d_thickened = Math.abs(d) + thicken

      const material = new THREE.MeshBasicMaterial()
      const geometry = new THREE.BoxGeometry(w_thickened, h_thickened, d_thickened)
      geometry.userData.obb = new OBB();
      const size = new THREE.Vector3( w_thickened, h_thickened, d_thickened );
			geometry.userData.obb.halfSize.copy( size ).multiplyScalar( 0.5 );
      const mesh = new THREE.Mesh(geometry, material)
      mesh.userData.obb = new OBB();
      mesh.userData.obb.copy( mesh.geometry.userData.obb );
			mesh.userData.obb.applyMatrix4( mesh.matrixWorld );
      
      mesh.material.alphaMap = 0x0
      mesh.material.opacity = 0
      mesh.material.transparent = true

      robotBasicMeshes.push(mesh)

      mesh.position.set(w / 2, h / 2, d / 2)


      const group = new THREE.Object3D()
      group.position.set(x, y, z)
      group.add(mesh)
      
      var xpos = w/2
      var ypos = h/2
      var zpos = d/2
      let xrot = (Math.PI)/2
      let yrot = 0
      var zrot = 0
      var path = "robot_arm_" + jointNumber + ".json"

      switch (jointNumber) {
        case 0:
          zpos -= 0.4
          break
        case 1:
          mesh.position.setY(ypos - 0.5)
          xpos -= 2.05
          ypos -= 0.5
          
          break
        case 2:
          xpos -= 1.5
          xrot = (Math.PI) /2 
          break
        case 3:
          xpos += 0.8
          yrot = (Math.PI)
          break
        case 4:
          xpos -= 0.9
          // group.position.y += 0.5
          break
        case 5:
          group.rotation.y = Math.PI / 2
          zrot = (Math.PI) / 2
          zpos -= 1.3

          camera3.lookAt(0, 0, 20)
          group.add(camera3);
          camera3.position.set(-0.1, 1, -1.7)
          break
      }

      loadObject(path, {
        position: [xpos, ypos, zpos],
        rotation: [xrot, yrot, zrot],
        castShadow: false,
        receiveShadow: false,
        addTo: group
      })

      return group
    }

    let x = 0, y = 0, z = 0
    V_initial.push([0, 0, 0]) // add a 6th pseudo link for 6 axis
    for (let i = 0; i < V_initial.length; i++) {
      const link = V_initial[i]

      const linkGeo = createCube(x, y, z, link[0], link[1], link[2], limits[i][0], limits[i][1], 
                        i, this.robotBasicMeshes)
      x = link[0]
      y = link[1]
      z = link[2]
      // console.log(link[0], link[1], link[2])
      parentObject.add(linkGeo)
      parentObject = linkGeo
      this.robotBones.push(linkGeo)
    }

    scene.add(this.arm)

    this.angles = [0, 0, 0, 0, 0, 0]

    for(let i = 0; i < this.robotBasicMeshes.length; i++) {
      const mesh = this.robotBasicMeshes[i]
      const size = mesh.userData.obb.halfSize.multiplyScalar(2)
      const geometry = new THREE.BoxGeometry(size.x, size.y, size.z)
      const material = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true})
      const cube = new THREE.Mesh(geometry, material)

      const rotation4 = new THREE.Matrix4().makeRotationZ((Math.PI)/2)
      mesh.userData.obb.rotation.setFromMatrix4(rotation4)

      cube.position.copy(mesh.userData.obb.center)
      cube.setRotationFromMatrix(rotation4)
      this.bbHelpers.push(cube)
      // console.log(cube)
      scene.add(cube)
    }

  }

  setAngles(angles) {
    this.angles = angles
    this.robotBones[0].rotation.z = angles[0]
    this.robotBones[1].rotation.y = angles[1]
    this.robotBones[2].rotation.y = angles[2]
    this.robotBones[3].rotation.x = angles[3]
    this.robotBones[4].rotation.y = angles[4]
    this.robotBones[5].rotation.z = angles[5]
  }

  setAngle(index, angle) {
    this.angles[index] = angle
    this.setAngles(this.angles)
  }

  highlightJoint(jointIndex, hexColor) {
    if (jointIndex >= this.joints.length) {
      console.warn(`cannot highlight joint: ${jointIndex} (out of index: ${this.joints.length})`)
    }
    if (hexColor) {
      this._colorObjectAndChildren(this.joints[jointIndex], hexColor)
    } else {
      this._resetObjectAndChildrenColor(this.joints[jointIndex])
    }
  }

  updateBounds() {
    for (let i = 0; i < this.robotBones.length; i++) {
      const mesh = this.robotBasicMeshes[i]

      mesh.userData.obb.copy( mesh.geometry.userData.obb );
			mesh.userData.obb.applyMatrix4( mesh.matrixWorld );

      this.bbHelpers[i].position.copy(mesh.userData.obb.center)

      const rotation4 = new THREE.Matrix4().setFromMatrix3(mesh.userData.obb.rotation)
      this.bbHelpers[i].setRotationFromMatrix(rotation4)
    }
  }

  intersecting(boundingBox) {
    let inter = false
    for(let i = 0; i < this.robotBasicMeshes.length; i++) {
      const mesh = this.robotBasicMeshes[i]
      if(mesh.userData.obb.intersectsBox3(boundingBox)) inter = true
    }
    return inter
  }

  intersectingEE(boundingBox) {
    const mesh = this.robotBasicMeshes[5]
    return mesh.userData.obb.intersectsBox3(boundingBox)
  }

  _colorObjectAndChildren(object, hexColor) {
    const scope = this
    object.traverse((node) => {
      scope._colorObject(node, hexColor)
    })
  }

  _colorObject(object, hexColor) {
    if (object.material) {
      if (!object.initalMaterial) {
        object.initalMaterial = object.material
      }
      object.material = object.material.clone()
      object.material.color.setHex(hexColor)
    }
  }

  _resetObjectAndChildrenColor(object, hexColor) {
    const scope = this
    object.traverse((node) => {
      scope._resetObjectColor(node)
    })
  }

  _resetObjectColor(object) {
    if (object.initalMaterial) {
      object.material = object.initalMaterial
    }
  }
}


