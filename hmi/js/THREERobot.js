var THREERobot = function(V_initial, limits, scene) {

    this.THREE = new THREE.Group()

    this.robotBones = [];
    this.joints = [];

    let scope = this;

    let parentObject = this.THREE;
    let x = 0,
        y = 0,
        z = 0;

    for (var i = 0; i < V_initial.length; i++) {
        var link = V_initial[i];

        let linkGeo = createCube(x, y, z, link[0], link[1], link[2], limits[i][0], limits[i][1], i)
        x = link[0]
        y = link[1]
        z = link[2]
        parentObject.add(linkGeo)
        parentObject = linkGeo
        this.robotBones.push(linkGeo)
    }

    scene.add(this.THREE)

    function createCube(x, y, z, w, h, d, min, max, jointNumber) {
        let thicken = 1

        var w_thickened = Math.abs(w) + thicken
        var h_thickened = Math.abs(h) + thicken
        var d_thickened = Math.abs(d) + thicken

        var material = new THREE.MeshLambertMaterial({
            color: Math.random() * 0xffffff
        });
        var geometry = new THREE.CubeGeometry(w_thickened, h_thickened, d_thickened);
        var mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(w / 2, h / 2, d / 2)
        let group = new THREE.Object3D()
        group.position.set(x, y, z)
        group.add(mesh)

        console.log(min, max)
        min = min / 180 * Math.PI
        max = max / 180 * Math.PI

        let jointGeo1 = new THREE.CylinderGeometry(.8, .8, .8 * 2, 32, 32, false, -min, 2 * Math.PI - max + min);
        let jointGeoMax = new THREE.CylinderGeometry(.8, .8, .8 * 2, 32, 32, false, -max, max);
        let jointGeoMin = new THREE.CylinderGeometry(.8, .8, .8 * 2, 32, 32, false, 0, -min);
        var jointMesh1 = new THREE.Mesh(jointGeo1, new THREE.MeshBasicMaterial({
            color: 0xffbb00
        }));
        var jointMeshMax = new THREE.Mesh(jointGeoMax, new THREE.MeshBasicMaterial({
            color: 0x009900
        }));
        var jointMeshMin = new THREE.Mesh(jointGeoMin, new THREE.MeshBasicMaterial({
            color: 0xdd2200
        }));

        var joint = new THREE.Group()
            //joint.add(jointMesh1, jointMesh2)
        joint.add(jointMeshMax, jointMeshMin, jointMesh1)

        scope.joints.push(joint);

        switch (jointNumber) {
            case 1:
            case 2:
                joint.rotation.x = Math.PI / 2
                break;
            case 4:
                joint.rotation.x = Math.PI / 2
                joint.rotation.y = -Math.PI / 2
                break;
            case 3:
                joint.rotation.z = Math.PI / 2
                joint.rotation.y = Math.PI
                break;
            case 5:
                group.rotation.z = -Math.PI / 2
                group.rotation.y += Math.PI
                joint.rotation.z = +Math.PI / 2
                group.add(new THREE.AxisHelper(3))
                    //joint.add(getVectorArrow([0,0,0],[0,0,5]))
                break;
        }

        group.add(joint)
        return group

    }

    function getArrow(from, to) {
        var dir = new THREE.Vector3(to[0], to[1], to[2]);
        var origin = new THREE.Vector3(from[0], from[1], from[2]);
        var length = dir.sub(origin).length()
        dir.normalize()
        var color = 0xffff00;

        return new THREE.ArrowHelper(dir, origin, length, color, 2, 1);
    }

    function getVectorArrow(from, vector) {
        return getArrow(from, [from[0] + vector[0],
            [from[1] + vector[1]],
            [from[2] + vector[2]]
        ])
    }

    this.angles = [0, 0, 0, 0, 0, 0]
}

THREERobot.prototype = {
    setAngles: function(angles) {
        this.angles = angles
        this.robotBones[0].rotation.y = angles[0]
        this.robotBones[1].rotation.z = angles[1]
        this.robotBones[2].rotation.z = angles[2]
        this.robotBones[3].rotation.x = angles[3]
        this.robotBones[4].rotation.z = angles[4]
        this.robotBones[5].rotation.y = angles[5]

    },

    setAngle: function(index, angle) {
        this.angles[index] = angle
        this.setAngles(this.angles)
    },

    highlightJoint: function(jointIndex, hexColor) {
        if (jointIndex >= this.joints.length) {
            console.warn('cannot highlight joint: ' + jointIndex + ' (out of index: ' + this.joints.length + ')');
        }
        if (hexColor) {

            this._colorObjectAndChildren(this.joints[jointIndex], hexColor)
        } else {
            this._resetObjectAndChildrenColor(this.joints[jointIndex])
        }
    },

    _colorObjectAndChildren: function(object, hexColor) {
        var scope = this
        object.traverse(function(node) {
            scope._colorObject(node, hexColor)
        })
    },

    _colorObject: function(object, hexColor) {
        if (object.material) {
            if (!object.initalMaterial) {
                object.initalMaterial = object.material;
            }
            object.material = object.material.clone();
            object.material.color.setHex(hexColor);
        }
    },

    _resetObjectAndChildrenColor: function(object, hexColor) {
        var scope = this
        object.traverse(function(node) {
            scope._resetObjectColor(node)
        })
    },

    _resetObjectColor: function(object) {
        if (object.initalMaterial) {
            object.material = object.initalMaterial
        }
    },

}
