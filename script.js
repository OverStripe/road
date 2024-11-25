// Set up the scene, camera, and renderer
const canvas = document.getElementById('gameCanvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Sunlight
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Add a background skybox (Online Resource)
const loader = new THREE.CubeTextureLoader();
const skyTexture = loader.load([
    'https://threejsfundamentals.org/threejs/resources/images/compressed-skybox/px.jpg', // Right
    'https://threejsfundamentals.org/threejs/resources/images/compressed-skybox/nx.jpg', // Left
    'https://threejsfundamentals.org/threejs/resources/images/compressed-skybox/py.jpg', // Top
    'https://threejsfundamentals.org/threejs/resources/images/compressed-skybox/ny.jpg', // Bottom
    'https://threejsfundamentals.org/threejs/resources/images/compressed-skybox/pz.jpg', // Front
    'https://threejsfundamentals.org/threejs/resources/images/compressed-skybox/nz.jpg', // Back
]);
scene.background = skyTexture;

// Add car
const car = {
    position: { x: 0, y: 1, z: 0 },
    speed: 0,
    turnSpeed: 0.2, // Turning speed
    turnDirection: 0, // -1 for left, 1 for right, 0 for straight
    mesh: null,
};

function createCar() {
    const carBodyGeometry = new THREE.BoxGeometry(2, 1, 4);
    const carBodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const carBody = new THREE.Mesh(carBodyGeometry, carBodyMaterial);
    carBody.castShadow = true;

    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.5, 12);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

    const wheels = [];
    for (let i = 0; i < 4; i++) {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.castShadow = true;
        wheels.push(wheel);
    }

    wheels[0].position.set(-0.8, -0.5, 1.5); // Front left
    wheels[1].position.set(0.8, -0.5, 1.5);  // Front right
    wheels[2].position.set(-0.8, -0.5, -1.5); // Rear left
    wheels[3].position.set(0.8, -0.5, -1.5);  // Rear right

    const carGroup = new THREE.Group();
    carGroup.add(carBody);
    wheels.forEach(wheel => carGroup.add(wheel));
    carGroup.position.set(car.position.x, car.position.y, car.position.z);

    scene.add(carGroup);
    car.mesh = carGroup;
}

// Initialize the car
createCar();

// Add road
const roadSegments = [];
const segmentLength = 50;
const roadWidth = 20;

function createRoadSegment(zPosition) {
    const geometry = new THREE.PlaneGeometry(roadWidth, segmentLength);
    const material = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const roadSegment = new THREE.Mesh(geometry, material);
    roadSegment.rotation.x = -Math.PI / 2;
    roadSegment.position.set(0, 0, zPosition);
    roadSegment.receiveShadow = true;
    return roadSegment;
}

// Initialize the road
for (let i = 0; i < 10; i++) {
    const segment = createRoadSegment(-i * segmentLength);
    scene.add(segment);
    roadSegments.push(segment);
}

// Add scenery
const scenery = [];

function createTree(x, z) {
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);

    const foliageGeometry = new THREE.ConeGeometry(1, 3, 8);
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);

    const tree = new THREE.Group();
    trunk.position.y = 1;
    foliage.position.y = 3;

    tree.add(trunk);
    tree.add(foliage);
    tree.position.set(x, 0, z);
    tree.castShadow = true;

    scenery.push(tree);
    scene.add(tree);
}

function createScenery() {
    for (let i = -100; i < 0; i += 20) {
        createTree(-roadWidth - Math.random() * 10, i);
        createTree(roadWidth + Math.random() * 10, i);
    }
}

createScenery();

// Handle controls
document.getElementById('leftButton').addEventListener('touchstart', () => (car.turnDirection = -1));
document.getElementById('rightButton').addEventListener('touchstart', () => (car.turnDirection = 1));
document.getElementById('forwardButton').addEventListener('touchstart', () => (car.speed = 0.5));
document.getElementById('forwardButton').addEventListener('touchend', () => (car.speed = 0));
document.getElementById('leftButton').addEventListener('touchend', () => (car.turnDirection = 0));
document.getElementById('rightButton').addEventListener('touchend', () => (car.turnDirection = 0));

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update car position
    car.mesh.position.x += car.turnDirection * car.turnSpeed;
    car.mesh.position.z -= car.speed;

    // Move road
    roadSegments.forEach(segment => {
        segment.position.z += car.speed;
        if (segment.position.z > camera.position.z) {
            segment.position.z -= segmentLength * roadSegments.length;
        }
    });

    // Move scenery
    scenery.forEach(item => {
        item.position.z += car.speed;
        if (item.position.z > camera.position.z) {
            item.position.z -= segmentLength * 10;
        }
    });

    // Update camera
    camera.position.set(car.mesh.position.x, car.mesh.position.y + 5, car.mesh.position.z + 15);
    camera.lookAt(car.mesh.position);

    renderer.render(scene, camera);
}

animate();
