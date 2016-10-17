var Hmi = function() {

    var geometry = [
        [1, 1, 0],
        [0, 10, 0],
        [5, 0, 0],
        [3, 0, 0],
        [0, -3, 0],
        [0, 0, 0]
    ]
    geometry = [
            [4.6, 8, 0],
            [0, 11.6, 0],
            [1.5, 2, 0],
            [11, 0, 0],
            [0, -3, 0],
            [0, 0, 0]
        ]
        //                geometry = [ [ 1, 1, 2 ], [ 0, 10, 0 ], [ 0, 0, -5 ], [ 5, 0, 0 ], [ 0, - 3, 0 ],[ 0, 0, 0 ]  ]
        //                geometry = [ [ 1, 1, 2 ], [ 0, 10, 0 ], [ 0, 3, -5 ], [ 8, 0, 0 ], [ 0, - 3, 0 ],[ 0, 0, 0 ]  ]
        //                geometry = [[5, 0, 0], [0, 5, 0], [0, 0, 5], [5, 0, 0], [0, -3, 0], [0, 0, 0]]
        //        geometry = [ [ -3, -5, -7 ], [ 15, -4, 3 ], [ 2, -5, -8 ], [ -10, -3, -2 ], [ 0, - 3, 0 ],[ 0, 0, 0 ]  ]


    var jointLimits = [
        [-170, 170],
        [-90, 45],
        [-80, 120],
        [-112.5, 112.5],
        [-90, 120],
        [-180, 179]
    ]
    jointLimits = [
        [-90, 90],
        [-58, 90],
        [-135, 40],
        [-90, 75],
        [-39, 141],
        [-188, 178]
    ]


    var maxAngleVelocity = 90.0 / 180.0 * Math.PI / 1000.0;

    var maxAngleVelocities = [
        maxAngleVelocity,
        maxAngleVelocity,
        maxAngleVelocity,
        maxAngleVelocity,
        maxAngleVelocity,
        maxAngleVelocity
    ]

    this.state = {
        jointOutOfBound: [false, false, false, false, false, false],
        followTarget: false,
    }

    if (Detector.webgl) {
        renderer = new THREE.WebGLRenderer({
            antialias: true, // to get smoother output
            preserveDrawingBuffer: true // to allow screenshot
        });
        renderer.setClearColor(0xbbbbbb);
    } else {
        Detector.addGetWebGLMessage();
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);


    // create a scene
    this.scene = new THREE.Scene();

    // put a this.camera in the scene
    this.camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 10000);
    this.camera = new THREE.OrthographicCamera(-15, 15, 15, -12, 1, 1000);
    this.camera.position.set(-25, 25, 25);
    this.scene.add(this.camera);

    // here you add your objects
    // - you will most likely replace this part by your own
    var light = new THREE.AmbientLight(Math.random() * 0xffffff);
    this.scene.add(light);
    var light = new THREE.DirectionalLight(Math.random() * 0xffffff);
    light.position.set(Math.random(), Math.random(), Math.random()).normalize();
    this.scene.add(light);


    this.cameraControls = new THREE.OrbitControls(this.camera, renderer.domElement);
    this.cameraControls.addEventListener('change', this.render.bind(this))

    // transparently support window resize
    THREEx.WindowResize.bind(renderer, this.camera);

    var size = 10;
    var step = 20;

    var gridHelper = new THREE.GridHelper(size, step);
    this.scene.add(gridHelper);

    var axisHelper = new THREE.AxisHelper(5);
    this.scene.add(axisHelper);



    let scope = this;

    window.onload = function() {
        var options = {
            maxVelocity: 5
        }

        var gui = new dat.GUI();
        //            gui.add(hmi, 'message');

        var hmiGui = gui.addFolder('HMI');
        gui.remember(scope.state);
        hmiGui.add(scope.state, 'followTarget').onChange(function() {
            if (scope.state.followTarget) {
                scope.updateTarget()
            }
        })
        hmiGui.add(scope, 'simulationInterval', 20, 150).step(5).onChange(function() {
            scope.modeChanged()
        })
        hmiGui.add(scope, 'simulationMode', ['follow', 'simulate']).onChange(function() {
            scope.modeChanged()
        });
        var pathGui = hmiGui.addFolder('path');
        pathGui.add(scope, 'targetToTCP')
        pathGui.add(scope, 'addPosition')
        pathGui.add(scope, 'startQueue')


        var robotControllerGui = gui.addFolder('robotController');
        // gui.remember(robotController);
        // robotControllerGui.add(robotController, 'movementMethod', ['P2P', 'LINEAR'])
        // robotControllerGui.add(robotController, 'resetPosition')
        // robotControllerGui.add(robotController, 'moveToMinPosition')
        // robotControllerGui.add(robotController, 'moveToMaxPosition')
        // robotControllerGui.add(robotController, '_interpolationDistance', 0.05, 2)

        robotControllerGui.add(options, 'maxVelocity', 0.1, 5).onChange(function() {
            robotController.setMaxVelocity(options.maxVelocity)
        });
    };

    this.RobotController = RobotController
    this.VisualRobot = new THREERobot(geometry, jointLimits, this.scene)

    this.IK = new InverseKinematic(geometry, jointLimits);

    this.simulationMode = 'follow'
    this.simulationInterval = 30


    let sphereGeo = new THREE.CylinderGeometry(1, 1, 1 * 2, 32);
    this.target = new THREE.Group()
    var targetMesh = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.7,
        color: 0xff0000
    }));
    targetMesh.rotation.z = Math.PI / 2
    targetMesh.position.x += 1
    this.target.add(targetMesh)
    var axisHelper = new THREE.AxisHelper(5);
    this.target.add(axisHelper);
    this.scene.add(this.target)

    this.followTarget = false;

    var control = new THREE.TransformControls(this.camera, renderer.domElement);
    //            control.rotation.x = 2
    control.addEventListener('change', function() {
      if (scope.state.followTarget) {

        scope.updateTarget();
      }

        scope.render()
    });
    control.attach(this.target)
    this.scene.add(control)

    this.positionQueue = []
    this.queuePointer = 0

    var selectedJoint = 0
    window.addEventListener('keydown', function myFunction(event) {
        //            Up: 38
        //            Down: 40
        //            Right: 39
        //            Left: 37
        console.log(event.keyCode)
        if (event.keyCode >= 48 && event.keyCode <= 57) {
            console.log('selected Joint:' + (event.keyCode - 48))
            selectedJoint = event.keyCode - 48
        }
        switch (event.keyCode) {
            case 38:
                console.log("Up key is pressed");
                break;
            case 40:
                console.log("Down key is pressed");
                break;
            case 39:
                console.log("Right key is pressed");
                break;
            case 37:
                console.log("left key is pressed");
                break;
            case 65:
                {
                    console.log(selectedJoint + " rotate left " + robotGeometryObjects[selectedJoint].rotation[(selectedJoint == 3) ? 'x' : 'z']);
                    let axis = ''
                    switch (selectedJoint) {
                        case 1:
                        case 2:
                        case 4:
                            axis = 'z'
                            break;
                        case 3:
                            axis = 'x'
                            break;
                        case 0:
                        case 5:
                            axis = 'y'
                            break;
                    }
                    robotGeometryObjects[selectedJoint].rotation[axis] -= 5 / 180 * Math.PI
                    //                        robotController.setTargetAngle(selectedJoint, robotController.getTargetAngle(selectedJoint) - 5 / 180 * Math.PI)//todo fix euler angles tcp first
                    break;
                }

            case 68:
                {
                    console.log(selectedJoint + " rotate right " + robotGeometryObjects[selectedJoint].rotation[(selectedJoint == 3) ? 'x' : 'z']);
                    let axis = ''
                    switch (selectedJoint) {
                        case 1:
                        case 2:
                        case 4:
                            axis = 'z'
                            break;
                        case 3:
                            axis = 'x'
                            break;
                        case 0:
                        case 5:
                            axis = 'y'
                            break;
                    }
                    robotGeometryObjects[selectedJoint].rotation[axis] += 5 / 180 * Math.PI
                    //                        robotController.setTargetAngle(selectedJoint, robotController.getTargetAngle(selectedJoint) + 5 / 180 * Math.PI)//todo fix euler angles tcp first
                    break;
                }

            case 82:
                console.log('rotation mode');
                control.setMode('rotate')
                break;
            case 84:
                console.log('translation mode');
                control.setMode('translate')
                break;
        }
        //setTarget(target.position) //to do ik again
        scope.render()
    }, false)


    this.render()
}

Hmi.prototype = {

    updateTarget: function() {
        this.setTarget(this.target.position, this.target.rotation)
    },

    setTarget: function(position, rotation) {

        let angles = []
        let result = this.IK.calculateAngles(position.x, position.y, position.z, rotation.x, rotation.y, rotation.z, angles);

        this.VisualRobot.setAngles(angles)


        for (var i = 0; i < 6; i++) {
            if (result[i] && !this.state.jointOutOfBound[i]) { //highlight only on change
                this.VisualRobot.highlightJoint(i, 0xff0000)
            } else if (!result[i] && this.state.jointOutOfBound[i]){
                this.VisualRobot.highlightJoint(i)
            }
        }

        this.state.jointOutOfBound = result
        this.render()

    },

    targetToTCP: function() {
        let position = []
        this.RobotController.getCurrentPosition(position)
        this.target.position.x = position[0]
        this.target.position.y = position[1]
        this.target.position.z = position[2]

        this.target.rotation.x = position[3]
        this.target.rotation.y = position[4]
        this.target.rotation.z = position[5]

        this.render()
    },

    simulateServoMovements: function() {


        var deltaT = this.simulationInterval
        var angles = []

        for (var i = 0; i < 6; i++) {

            //                    robotController.Servos[i].simulateServoMovement(deltaT)
            angles[i] = this.RobotController.Servos[i].getCurrentAngle()
            this.render()

        }
        this.VisualRobot.setAngles(angles)

        this.RobotController.process()
            //            console.log(robotController.STATE)
    },

    modeChanged: function() {
        if (this.interval) {
            clearInterval(this.interval)
        }

        if (this.simulationMode == 'follow') {

        } else if (this.simulationMode == 'simulate') {

            this.interval = setInterval(this.simulateServoMovements.bind(this), this.simulationInterval)
        }
    },

    addPosition: function() {
        this.positionQueue.push([this.target.position.x,
            this.target.position.y,
            this.target.position.z,
            this.target.rotation.x,
            this.target.rotation.y,
            this.target.rotation.z
        ])
        console.log(JSON.stringify(this.positionQueue[this.positionQueue.length - 1]))
    },

    startQueue: function() {
        this.queuePointer = 0
        this.processQueue()
    },

    processQueue: function() {
        if (this.positionQueue.length > this.queuePointer) {

            if (!this.RobotController.isMoving()) {
                var position = this.positionQueue[this.queuePointer]
                this.RobotController.setTargetPosition(position[0], position[1], position[2], position[3], position[4], position[5])
                this.queuePointer++
            }
            setTimeout(this.processQueue.bind(this), 100);
        }
    },

    render: function() {

        // actually render the this.scene
        renderer.render(this.scene, this.camera);
    }


}
