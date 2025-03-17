import * as THREE from 'three';

export class Reticle {
    private mesh!: THREE.Group;
    private distance: number = 100;
    private maxOffset: number = 5;
    private currentOffset: THREE.Vector2 = new THREE.Vector2(0, 0);

    constructor(private scene: THREE.Scene) {
        this.initialize();
    }

    private initialize(): void {
        this.mesh = new THREE.Group();

        const material = new THREE.LineBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.5
        });

        // Create crosshair
        const size = 1;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array([
            -size, 0, 0, size, 0, 0,
            0, -size, 0, 0, size, 0
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const crosshair = new THREE.LineSegments(geometry, material);
        this.mesh.add(crosshair);
        this.scene.add(this.mesh);
    }

    public update(playerPosition: THREE.Vector3, playerRotation: THREE.Euler): void {
        const input = this.scene.userData.input as GameInput;

        // Keep reticle movement subtle
        const targetX = input.moveX * this.maxOffset;
        const targetY = input.moveY * this.maxOffset;

        // Smooth movement
        this.currentOffset.x += (targetX - this.currentOffset.x) * 0.05;
        this.currentOffset.y += (targetY - this.currentOffset.y) * 0.05;

        // Calculate the base position in front of the player
        const basePosition = new THREE.Vector3(0, 0, -this.distance);

        // Apply ship's rotation to the reticle position
        basePosition.applyEuler(playerRotation);
        basePosition.add(playerPosition);

        // Add subtle offset for fine aiming
        this.mesh.position.copy(basePosition);
        this.mesh.position.x += this.currentOffset.x;
        this.mesh.position.y += this.currentOffset.y;

        // Rotate reticle to stay aligned with view
        this.mesh.rotation.copy(playerRotation);
    }

    public getPosition(): THREE.Vector3 {
        return this.mesh.position.clone();
    }
}