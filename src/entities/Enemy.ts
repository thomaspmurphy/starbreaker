import * as THREE from 'three';

// Static shared resources
const SHARED_GEOMETRIES = {
    body: new THREE.OctahedronGeometry(1.2, 0),
    spike: new THREE.ConeGeometry(0.2, 1, 4),
    core: new THREE.SphereGeometry(0.4, 8, 8),
    exhaust: new THREE.CylinderGeometry(0.3, 0.1, 0.8, 6)
};

const SHARED_MATERIALS = {
    body: new THREE.MeshPhongMaterial({
        color: 0x333333,
        emissive: 0x330000,
        shininess: 30
    }),
    spike: new THREE.MeshPhongMaterial({
        color: 0x660000,
        emissive: 0x330000,
        shininess: 50
    }),
    core: new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.9
    }),
    exhaust: new THREE.MeshPhongMaterial({
        color: 0xff3300,
        emissive: 0xff3300
    })
};

export class Enemy {
    mesh: THREE.Group = new THREE.Group();
    private health: number = 0;
    private speed: number = 0;
    private removeFlag: boolean = false;
    private glowPulse: number = 0;
    private coreMesh: THREE.Mesh = new THREE.Mesh(SHARED_GEOMETRIES.core, SHARED_MATERIALS.core);

    constructor(
        private scene: THREE.Scene,
        position: THREE.Vector3,
        level: number
    ) {
        this.initialize(position, level);
    }

    private initialize(position: THREE.Vector3, level: number): void {
        this.health = 100 * level;
        this.speed = 0.2 + (level * 0.1);

        // Main body
        const body = new THREE.Mesh(SHARED_GEOMETRIES.body, SHARED_MATERIALS.body);
        this.mesh.add(body);

        // Add spikes around the body
        const spikeCount = 6;  // Reduced from 8
        for (let i = 0; i < spikeCount; i++) {
            const spike = new THREE.Mesh(SHARED_GEOMETRIES.spike, SHARED_MATERIALS.spike);
            const angle = (i / spikeCount) * Math.PI * 2;
            spike.position.set(
                Math.cos(angle) * 1.5,
                Math.sin(angle) * 1.5,
                0
            );
            spike.rotation.z = angle + Math.PI / 2;
            this.mesh.add(spike);
        }

        // Glowing core
        this.coreMesh = new THREE.Mesh(SHARED_GEOMETRIES.core, SHARED_MATERIALS.core);
        this.mesh.add(this.coreMesh);

        // Add two engine exhausts
        const leftExhaust = new THREE.Mesh(SHARED_GEOMETRIES.exhaust, SHARED_MATERIALS.exhaust);
        leftExhaust.position.set(-0.8, 0, 1);
        leftExhaust.rotation.x = Math.PI / 2;
        this.mesh.add(leftExhaust);

        const rightExhaust = new THREE.Mesh(SHARED_GEOMETRIES.exhaust, SHARED_MATERIALS.exhaust);
        rightExhaust.position.set(0.8, 0, 1);
        rightExhaust.rotation.x = Math.PI / 2;
        this.mesh.add(rightExhaust);

        this.mesh.position.copy(position);
        this.scene.add(this.mesh);
    }

    public update(playerPosition: THREE.Vector3): void {
        const direction = playerPosition.clone().sub(this.mesh.position).normalize();
        this.mesh.position.add(direction.multiplyScalar(this.speed));
        this.mesh.lookAt(playerPosition);

        // Pulse the core opacity instead of using a light
        this.glowPulse += 0.1;
        const pulseIntensity = 0.7 + Math.sin(this.glowPulse) * 0.3;
        (this.coreMesh.material as THREE.MeshBasicMaterial).opacity = pulseIntensity;

        // Smoother tilt animation
        const tiltAmount = Math.sin(this.glowPulse * 0.5) * 0.1;  // Reduced tilt amount
        this.mesh.rotation.x = tiltAmount;  // Set absolute rotation instead of adding
    }

    public takeDamage(amount: number): boolean {
        this.health -= amount;
        if (this.health <= 0) {
            this.destroy();
            return true;
        }
        // Flash red when taking damage using emissive color
        const bodyMesh = this.mesh.children[0] as THREE.Mesh;
        const bodyMaterial = bodyMesh.material as THREE.MeshPhongMaterial;
        bodyMaterial.emissive.setHex(0xff0000);
        setTimeout(() => {
            bodyMaterial.emissive.setHex(0x330000);
        }, 100);
        return false;
    }

    public destroy(): void {
        this.scene.remove(this.mesh);
        this.removeFlag = true;
    }

    public isRemoved(): boolean {
        return this.removeFlag;
    }
}