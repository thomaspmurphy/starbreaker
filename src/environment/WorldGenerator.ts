import * as THREE from 'three';
import { Enemy } from '../entities/Enemy';
import { FlightPath } from '../game/FlightPath';
import { Laser } from '../entities/Laser';

export class WorldGenerator {
    private obstacles: THREE.Mesh[] = [];
    private enemies: Enemy[] = [];
    private nextSpawnDistance: number = 50;
    private spawnInterval: number = 30;
    private lastSpawnZ: number = 0;  // Track last spawn position

    constructor(
        private scene: THREE.Scene,
        private flightPath: FlightPath
    ) {}

    public update(playerPosition: THREE.Vector3): void {
        // Check if we need to spawn new obstacles
        if (playerPosition.z < this.lastSpawnZ - this.nextSpawnDistance) {
            this.spawnObstacles(playerPosition);
            this.lastSpawnZ = playerPosition.z;
        }

        this.updateEntities(playerPosition);
    }

    private updateEntities(playerPosition: THREE.Vector3): void {
        // Update and remove far obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const meteor = this.obstacles[i];

            // Animate meteor rotation
            if (meteor.userData.rotationSpeed) {
                meteor.rotation.x += meteor.userData.rotationSpeed.x;
                meteor.rotation.y += meteor.userData.rotationSpeed.y;
                meteor.rotation.z += meteor.userData.rotationSpeed.z;
            }

            if (meteor.position.z > playerPosition.z + 100) {  // Increased cleanup distance
                this.scene.remove(meteor);
                this.obstacles.splice(i, 1);
            }
        }

        // Update and remove enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy.isRemoved()) {
                this.enemies.splice(i, 1);
            } else {
                enemy.update(playerPosition);
            }
        }
    }

    private spawnObstacles(playerPosition: THREE.Vector3): void {
        // Increase number of obstacles
        const numObstacles = Math.min(Math.floor(Math.random() * 6) + 4, 10);  // 4-10 obstacles

        // Create a wider grid pattern
        const gridSize = Math.ceil(Math.sqrt(numObstacles));
        const cellSize = 30;  // Increased from 20

        for (let i = 0; i < numObstacles; i++) {
            const gridX = (i % gridSize) - (gridSize / 2);
            const gridY = Math.floor(i / gridSize) - (gridSize / 2);

            // Add more randomness to positions
            const position = new THREE.Vector3(
                gridX * cellSize + (Math.random() - 0.5) * cellSize * 1.5,  // More random spread
                gridY * cellSize + (Math.random() - 0.5) * cellSize * 1.5,
                playerPosition.z - 300  // Spawn further ahead
            );

            // Ensure obstacles aren't directly in front of the player
            if (Math.abs(position.x) < 8 && Math.abs(position.y) < 8) {
                position.x += (position.x < 0 ? -1 : 1) * 8;
            }

            if (Math.random() < 0.3) {
                this.spawnEnemy(position);
            } else {
                this.spawnObstacle(position);
            }
        }

        // Gradually decrease spawn interval as difficulty increases
        this.spawnInterval = Math.max(20, this.spawnInterval - 0.1);
    }

    private spawnObstacle(position: THREE.Vector3): void {
        // Create a meteor with irregular shape using IcosahedronGeometry
        const geometry = new THREE.IcosahedronGeometry(2, 1);

        // Randomize vertices to make it more irregular
        const positions = geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += (Math.random() - 0.5) * 0.3;
            positions[i + 1] += (Math.random() - 0.5) * 0.3;
            positions[i + 2] += (Math.random() - 0.5) * 0.3;
        }
        geometry.computeVertexNormals();

        // Create a realistic meteor material with glowing effect
        const material = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.7,
            metalness: 0.2,
            emissive: 0xff4400,
            emissiveIntensity: 0.2,
        });

        const meteor = new THREE.Mesh(geometry, material);
        meteor.position.copy(position);

        // Add random rotation and spin
        meteor.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );

        // Store initial rotation speed for animation
        meteor.userData.rotationSpeed = {
            x: (Math.random() - 0.5) * 0.02,
            y: (Math.random() - 0.5) * 0.02,
            z: (Math.random() - 0.5) * 0.02
        };

        // Add a glowing atmosphere effect
        const atmosphereGeometry = new THREE.IcosahedronGeometry(2.2, 1);
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        meteor.add(atmosphere);

        // Random scale variation
        const scale = 0.8 + Math.random() * 1.2;
        meteor.scale.set(scale, scale, scale);

        this.obstacles.push(meteor);
        this.scene.add(meteor);
    }

    private spawnEnemy(position: THREE.Vector3): void {
        const enemy = new Enemy(this.scene, position, Math.floor(this.flightPath.getDifficulty()));
        this.enemies.push(enemy);
    }

    public checkLaserCollisions(lasers: Laser[]): void {
        const laserBox = new THREE.Box3();
        const targetBox = new THREE.Box3();

        for (const laser of lasers) {
            laserBox.setFromObject(laser.mesh);

            // Check obstacle collisions
            for (let i = this.obstacles.length - 1; i >= 0; i--) {
                targetBox.setFromObject(this.obstacles[i]);
                if (laserBox.intersectsBox(targetBox)) {
                    this.scene.remove(this.obstacles[i]);
                    this.obstacles.splice(i, 1);
                    laser.destroy();
                    break;
                }
            }

            // Check enemy collisions
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                targetBox.setFromObject(this.enemies[i].mesh);
                if (laserBox.intersectsBox(targetBox)) {
                    if (this.enemies[i].takeDamage(50)) {
                        this.enemies.splice(i, 1);
                    }
                    laser.destroy();
                    break;
                }
            }
        }
    }
}