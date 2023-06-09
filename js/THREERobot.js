import * as THREE from 'three'
// import { model as ISS } from './scene'

export default class THREERobot {
  constructor(V_initial, limits, scene) {
    this.THREE = new THREE.Group()

    this.robotBones = []
    this.joints = []

    const scope = this

    let parentObject = this.THREE
    // parentObject.rotation.x = Math.PI / 2
    // let colors = [
    //     0x05668D,
    //     0x028090,
    //     0x00A896,
    //     0x02C39A,
    //     0xF0F3BD,
    //     0x0
    // ]
    const colors = [
      0xaaaaaa,
      0xbbbbbb,
      0xbcbcbc,
      0xcbcbcb,
      0xcccccc,
      0x00ff00,
    ]

    function createCube(x, y, z, w, h, d, min, max, jointNumber) {
      const thicken = 0.3

      const w_thickened = Math.abs(w) + thicken
      const h_thickened = Math.abs(h) + thicken
      const d_thickened = Math.abs(d) + thicken

      const material = new THREE.MeshLambertMaterial({
        color: colors[jointNumber],
      })
      const geometry = new THREE.BoxGeometry(w_thickened, h_thickened, d_thickened)
      const mesh = new THREE.Mesh(geometry, material)

      mesh.position.set(w / 2, h / 2, d / 2)
      const group = new THREE.Object3D()
      group.position.set(x, y, z)
      if(jointNumber > 4) group.add(mesh)
            
      var xpos = w/2
      var ypos = h/2
      var zpos = d/2
      let xrot = (Math.PI)/2
      let yrot = 0
      var zrot = 0
      var path = "/robot_arm_" + jointNumber + ".json"

      switch (jointNumber) {
        case 0:
          zpos -= 0.4
          break
        case 1:
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
          break
      }

      const loader = new THREE.ObjectLoader();
      loader.load(
        // resource URL
        path,

        // onLoad callback
        // Here the loaded data is assumed to be an object
        function ( obj ) {
          // Add the loaded object to the scene
          group.add( obj );
          obj.position.set(xpos, ypos, zpos)
          obj.rotation.set(xrot, yrot, zrot)
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

      return group
    }

    let x = 0, y = 0, z = 0
    V_initial.push([0, 0, 0]) // add a 6th pseudo link for 6 axis
    for (let i = 0; i < V_initial.length; i++) {
      const link = V_initial[i]

      const linkGeo = createCube(x, y, z, link[0], link[1], link[2], limits[i][0], limits[i][1], i)
      x = link[0]
      y = link[1]
      z = link[2]
      console.log(link[0], link[1], link[2])
      parentObject.add(linkGeo)
      parentObject = linkGeo
      this.robotBones.push(linkGeo)
    }

    scene.add(this.THREE)

    this.angles = [0, 0, 0, 0, 0, 0]
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


