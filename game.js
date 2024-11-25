// Set up Three.js scene, camera, and renderer
const canvas = document.getElementById('gameCanvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

// Add a background color
renderer.setClearColor(0x87CEEB); // Light blue sky color

// Add ambient and directional lights
const ambientLight = new THREE.AmbientLight(0x404040, 1); // Soft light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Sunlight
directionalLight.position.set(0, 10, 10).normalize();
scene.add(directionalLight);

// Car parameters
const car = {
    speed: 0.2,
    turnDirection: 0,
    maxSpeed: 5,
    acceleration: 0.02,
    brakePower: 0.1,
    turnAngle: 0.05,
    position: { x: 0, y: 1, z: 0 },
    mesh: null,
    update: function () {
        this.position.z -= this.speed;
        this.position.x += this.turnDirection * this.speed;
        this.speed = Math.max(0, Math.min(this.maxSpeed, this.speed)); // Clamp speed
    }
};

// Create a car model
function createCar() {
    const carBodyGeometry = new THREE.BoxGeometry(1, 0.5, 2);
    const carBodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red car body
    const carBody = new THREE.Mesh(carBodyGeometry, carBodyMaterial);

    const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 12);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 }); // Black wheels

    const wheels = [];
    for (let i = 0; i < 4; i++) {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheels.push(wheel);
    }

    // Position the wheels
    wheels[0].position.set(-0.5, -0.25, 0.8); // Front left
    wheels[1].position.set(0.5, -0.25, 0.8);  // Front right
    wheels[2].position.set(-0.5, -0.25, -0.8); // Rear left
    wheels[3].position.set(0.5, -0.25, -0.8);  // Rear right

    const carGroup = new THREE.Group();
    carGroup.add(carBody);
    wheels.forEach(wheel => carGroup.add(wheel));

    carGroup.position.set(car.position.x, car.position.y, car.position.z);
    scene.add(carGroup);
    car.mesh = carGroup;
}

// Road parameters
const roadSegments = [];
const segmentLength = 20;
const roadWidth = 10;

// Create a road segment
function createRoadSegment(positionZ) {
    const geometry = new THREE.PlaneGeometry(roadWidth, segmentLength);
    const material = new THREE.MeshStandardMaterial({ color: 0x444444 }); // Dark gray road
    const roadSegment = new THREE.Mesh(geometry, material);
    roadSegment.rotation.x = -Math.PI / 2;
    roadSegment.position.set(0, 0, positionZ);
    return roadSegment;
}

// Add initial road
function initializeRoad() {
    for (let i = 0; i < 10; i++) {
        const segment = createRoadSegment(-i * segmentLength);
        scene.add(segment);
        roadSegments.push(segment);
    }
}

// Update road for infinity
function updateRoad() {
    for (let segment of roadSegments) {
        segment.position.z += car.speed;
        if (segment.position.z > camera.position.z) {
            segment.position.z -= roadSegments.length * segmentLength;
        }
    }
}

// Tree and mountain arrays
const trees = [];
const mountains = [];

// Create a tree
function createTree(positionX, positionZ) {
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown trunk
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(positionX, 1, positionZ);

    const foliageGeometry = new THREE.ConeGeometry(1, 3, 8);
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 }); // Green foliage
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.set(positionX, 3, positionZ);

    const tree = new THREE.Group();
    tree.add(trunk);
    tree.add(foliage);
    return tree;
}

// Create a mountain
function createMountain(positionX, positionZ) {
    const mountainGeometry = new THREE.ConeGeometry(10, 20, 4);
    const mountainMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 }); // Gray mountains
    const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
    mountain.position.set(positionX, 10, positionZ);
    mountain.rotation.y = Math.random() * Math.PI;
    return mountain;
}

// Generate scenery
function generateScenery(segment) {
    const offsetZ = segment.position.z;

    for (let i = 0; i < 3; i++) {
        const leftTree = createTree(-roadWidth / 2 - 5 - Math.random() * 5, offsetZ + Math.random() * segmentLength);
        const rightTree = createTree(roadWidth / 2 + 5 + Math.random() * 5, offsetZ + Math.random() * segmentLength);
        trees.push(leftTree, rightTree);
        scene.add(leftTree, rightTree);
    }

    const leftMountain = createMountain(-roadWidth - 30 - Math.random() * 50, offsetZ + Math.random() * segmentLength);
    const rightMountain = createMountain(roadWidth + 30 + Math.random() * 50, offsetZ + Math.random() * segmentLength);
    mountains.push(leftMountain, rightMountain);
    scene.add(leftMountain, rightMountain);
}

// Initialize scenery
function initializeScenery() {
    roadSegments.forEach(segment => generateScenery(segment));
}

// Update game logic
function updateGameLogic() {
    car.update();
    car.mesh.position.set(car.position.x, car.position.y, car.position.z);
    updateRoad();
}

// Handle button inputs
document.getElementById('leftButton').addEventListener('mousedown', () => (car.turnDirection = -1));
document.getElementById('rightButton').addEventListener('mousedown', () => (car.turnDirection = 1));
document.getElementById('forwardButton').addEventListener('mousedown', () => (car.speed += car.acceleration));
document.getElementById('brakeButton').addEventListener('mousedown', () => (car.speed -= car.brakePower));
['leftButton', 'rightButton'].forEach(buttonId =>
    document.getElementById(buttonId).addEventListener('mouseup', () => (car.turnDirection = 0))
);

// Render loop
function animate() {
    requestAnimationFrame(animate);
    updateGameLogic();
    renderer.render(scene, camera);
}

// Initialize game
function initializeGame() {
    camera.position.set(0, 5, 15); // Adjust camera to view the car and road
    camera.lookAt(0, 0, 0);

    createCar();
    initializeRoad();
    initializeScenery();
    animate();
}

initializeGame();
