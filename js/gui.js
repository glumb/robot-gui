import initialControls from "../config/controls.json" assert { type: "json" }
import mapping from "../config/mapping.json" assert { type: "json" }
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// Make a deep copy of the control config so we can reset controls later
export var controls = JSON.parse(JSON.stringify(initialControls));

/* CREATE GUI */
const gui = new GUI({width: 400})
gui.close()
const guiFolders = addFolders( controls, gui)
createControls()

// META!! controls for the controls
let controlControls = {
    "Download Controls Config": downloadControlsConfig,
    "Upload Controls Config": uploadControlsConfig,
    "Reset Controls": resetControls
}
gui.add(controlControls, "Download Controls Config")
gui.add(controlControls, "Upload Controls Config")
gui.add(controlControls, "Reset Controls")



/* GUI CREATION FUNCTIONS */

function createControls() {
    createIncrementalControls()
    createAxisControls()
}

// Create all the incremental controls
function createIncrementalControls() {
    // Get list of buttons, add option for no assignment
    const buttonList = getButtonNames( mapping )
    buttonList.unshift("none")

    // Create end effector incremental controls
    addControlsToGUI( 
        guiFolders["End Effector Controls"]["Incremental Controls"].folder,
        controls["End Effector Controls"]["Incremental Controls"],
        buttonList
    )

    // Create joint level incremental controls
    addControlsToGUI( 
        guiFolders["Joint Controls"]["Incremental Controls"].folder,
        controls["Joint Controls"]["Incremental Controls"],
        buttonList
    )
}

function createAxisControls() {
    // Get list of axes, add option for no assignment
    const axisList = getAxisNames( mapping )    
    axisList.unshift("none")

    // End effector axis controls
    addControlsToGUI(
        guiFolders["End Effector Controls"]["Axis Controls"].folder,
        controls["End Effector Controls"]["Axis Controls"],
        axisList
    )

    // Joint axis controls
    addControlsToGUI(
        guiFolders["Joint Controls"]["Angle Controls"].folder,
        controls["Joint Controls"]["Angle Controls"],
        axisList
    )
}


/* HELPER FUNCTIONS */

// Recursively add all subobjects in an object as gui folders
// Returns an object containing all the gui folder objects
function addFolders( object, gui ){
    const folders = {}
    for(let folderName in object) {
        const folder = object[ folderName ]
        if( typeof(folder) !== "object" ) continue

        const guiFolder = gui.addFolder( folderName )
        folders[ folderName ] = addFolders( folder, guiFolder )
        folders[ folderName ][ "folder" ] = guiFolder

        guiFolder.close()
    }
    
    return folders
}

// Returns the names of all buttons, including rotary encoder buttons
function getButtonNames( mapping ) {
    let buttonNames = Object.keys(mapping["Buttons"])

    for(let rotaryEncoderName in mapping["Rotary Encoders"]) {
        const rotaryEncoderMapping = mapping["Rotary Encoders"][rotaryEncoderName]

        // for(let buttonName in rotaryEncoderMapping["Buttons"]) {
        //     const name = rotaryEncoderName + " " + buttonName
        //     buttonNames.push(name)
        // }

        const name = rotaryEncoderName + " button"
        buttonNames.push(name)
    }

    return buttonNames
}

function getAxisNames( mapping ) {
    let axisNames = Object.keys(mapping["Rotary Encoders"])
    axisNames = axisNames.concat(Object.keys(mapping["Potentiometers"]))
    
    return axisNames
}

/*
Adds all controls from the controls object to the gui folder
Allows user to select device from the device names pass in
Any controls that are not defined by strings (controls that are not devices)
are not created with a dropdown
*/
function addControlsToGUI( guiFolder, controls, deviceNames ) {
    for(let controlName in controls) {
        if(typeof(controls[controlName]) !== "string") {
            guiFolder.add( controls, controlName )
            continue
        }

        guiFolder.add( controls, controlName, deviceNames )
    }
}

// Download the given json object
function downloadControlsConfig() {
    const filename = "controls.json"
    const jsonStr = JSON.stringify(controls)

    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonStr))
    element.setAttribute('download', filename)

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
}

// Prompt user to upload a controls config and set the controls to it
function uploadControlsConfig() {
    var input = document.createElement('input');
    input.type = 'file';

    input.onchange = e => { 

    // getting a hold of the file reference
    var file = e.target.files[0]; 

    // setting up the reader
    var reader = new FileReader();
    reader.readAsText(file,'UTF-8');

    // here we tell the reader what to do when it's done reading...
    reader.onload = readerEvent => {
        var content = readerEvent.target.result; // this is the content!
        const newControls = JSON.parse(content)
        updateControls( controls, newControls )
        updateGUI()
    }

    }

    input.click();
}

function resetControls() {
    updateControls( controls, initialControls )
    updateGUI()
}


// Updates display of all GUI elements
function updateGUI() {
    const guiControllers = gui.controllersRecursive()
    for( let controller of guiControllers ) {
        controller.updateDisplay()
    }
}

// Have to update controls recursively so that GUI updates
function updateControls(oldControls, newControls) {
    for(let controlName in oldControls) {
        if(typeof(oldControls[controlName]) === "object") {
            updateControls( oldControls[controlName], newControls[controlName] )
            continue
        }

        if(oldControls[controlName] !== newControls[controlName]) {
            oldControls[controlName] = newControls[controlName]
        }
    }
}