import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.156.1/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.156.1/examples/jsm/controls/OrbitControls.js";
import GUI from "https://cdn.jsdelivr.net/npm/lil-gui@0.18/+esm";

// Renderer Setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Scene & Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(4, 10, 11);

// Orbit Controls (Existing)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = true;
controls.minDistance = 0;
controls.maxDistance = 200;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = 1.4;
controls.autoRotate = false;
controls.target.set(0, 1, 0);

// Lighting Setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Directional Light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = false;
scene.add(directionalLight);

// Spot Light
const spotLight = new THREE.SpotLight(0xffffff, 5, 50, Math.PI / 6, 0.3, 1);
spotLight.position.set(0, 15, 5);
spotLight.castShadow = true;
spotLight.shadow.bias = -0.0001;
scene.add(spotLight);

// GUI Controls
const gui = new GUI();

const modelParams = {
  positionX: -1.64,
  positionY: -4,
  positionZ: -1.64,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  scale: 1,
  color: "#ffffff",
  wireframe: false,
  animate: false, // New: Toggle for animations
};

// Light Controls
const lightParams = {
  directionalLightColor: "#ffffff",
  directionalLightIntensity: 1,
  directionalLightX: 5,
  directionalLightY: 10,
  directionalLightZ: 5,
  
  spotLightColor: "#ffffff",
  spotLightIntensity: 5,
  spotLightX: 0,
  spotLightY: 15,
  spotLightZ: 5,
  spotLightAngle: Math.PI / 6,
  spotLightPenumbra: 0.3,
  spotLightDistance: 50,
};

// Directional Light Controls
const dirLightFolder = gui.addFolder("Directional Light");
dirLightFolder.addColor(lightParams, "directionalLightColor").onChange(value => {
  directionalLight.color.set(value);
});
dirLightFolder.add(lightParams, "directionalLightIntensity", 0, 10).onChange(value => {
  directionalLight.intensity = value;
});
dirLightFolder.add(lightParams, "directionalLightX", -20, 20).onChange(value => {
  directionalLight.position.x = value;
});
dirLightFolder.add(lightParams, "directionalLightY", -20, 20).onChange(value => {
  directionalLight.position.y = value;
});
dirLightFolder.add(lightParams, "directionalLightZ", -20, 20).onChange(value => {
  directionalLight.position.z = value;
});

// Load 3D Model
let model; // Store the loaded model globally

function loadModel() {
  const loader = new GLTFLoader().setPath("public/home/");
  loader.load(
    "scene.gltf",
    (gltf) => {
      model = gltf.scene;

      model.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      model.position.set(modelParams.positionX, modelParams.positionY, modelParams.positionZ);
      scene.add(model);

      // Model Position Controls (Now Supports Negative Values)
      const modelFolder = gui.addFolder("Model Transformations");
      modelFolder.add(modelParams, "positionX", -10, 10).onChange(value => model.position.x = value);
      modelFolder.add(modelParams, "positionY", -10, 10).onChange(value => model.position.y = value);
      modelFolder.add(modelParams, "positionZ", -10, 10).onChange(value => model.position.z = value);
      modelFolder.add(modelParams, "rotationX", 0, Math.PI * 2).onChange(value => model.rotation.x = value);
      modelFolder.add(modelParams, "rotationY", 0, Math.PI * 2).onChange(value => model.rotation.y = value);
      modelFolder.add(modelParams, "rotationZ", 0, Math.PI * 2).onChange(value => model.rotation.z = value);
      modelFolder.add(modelParams, "scale", 0.1, 5).onChange(value => model.scale.set(value, value, value));
      modelFolder.addColor(modelParams, "color").onChange(value => {
        model.traverse(child => {
          if (child.isMesh) {
            child.material.color.set(new THREE.Color(value));
          }
        });
      });
      modelFolder.add(modelParams, "wireframe").onChange(value => {
        model.traverse(child => {
          if (child.isMesh) {
            child.material.wireframe = value;
          }
        });
      });
      modelFolder.add(modelParams, "animate").name("Animate Model"); // New: Toggle for animations

      // Hide Progress Container If Exists
      const progressContainer = document.getElementById("progress-container");
      if (progressContainer) {
        progressContainer.style.display = "none";
      }
    },
    (xhr) => {
      let progress = xhr.total ? (xhr.loaded / xhr.total) * 100 : 0;
      console.log(`Loading: ${progress.toFixed(2)}%`);
    },
    (error) => {
      console.error("Error loading model:", error);
    }
  );
}

loadModel();

// Handle Window Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Raycaster for Click and Hover Events
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Click Event
window.addEventListener("click", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    clickedObject.material.color.set(Math.random() * 0xffffff); // Change color on click
  }
});

// Hover Event
window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    intersects[0].object.material.color.set(0x00ff00); // Green on hover
  } else {
    // Reset colors if not hovering
    scene.traverse(child => {
      if (child.isMesh) {
        child.material.color.set(new THREE.Color(modelParams.color));
      }
    });
  }
});

// Animation Loop
function animate() {
  requestAnimationFrame(animate);

  // Rotate the model if animation is enabled
  if (modelParams.animate && model) {
    model.rotation.y += 0.01;
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();