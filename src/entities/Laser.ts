import * as THREE from 'three';

export class Laser {
    mesh: THREE.Mesh = new THREE.Mesh();
    private speed: number = 8.0;
    private direction: THREE.Vector3 = new THREE.Vector3();
    private trail: THREE.Line = new THREE.Line();
    private trailLength: number = 50;

    constructor(
        private scene: THREE.Scene,
        startPosition: THREE.Vector3,
        targetPosition: THREE.Vector3
    ) {
        this.initialize(startPosition, targetPosition);
    }

    private initialize(startPosition: THREE.Vector3, targetPosition: THREE.Vector3): void {
        // Create laser mesh
        const geometry = new THREE.CylinderGeometry(0.05, 0.05, 4, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 1.0
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.direction = targetPosition.clone().sub(startPosition).normalize();

        // Create laser trail
        this.createTrail();

        this.mesh.position.copy(startPosition);
        this.mesh.lookAt(targetPosition);
        this.mesh.rotateX(Math.PI / 2);
        this.scene.add(this.mesh);
    }

    private createTrail(): void {
        const trailGeometry = new THREE.BufferGeometry();
        const trailMaterial = new THREE.LineBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });

        const positions = new Float32Array(this.trailLength * 3);
        trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.trail = new THREE.Line(trailGeometry, trailMaterial);
        this.scene.add(this.trail);

        // Add glow effect
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(0x00ff00) }
            },
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                varying vec3 vNormal;
                void main() {
                    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    gl_FragColor = vec4(color, 1.0) * intensity;
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });

        const glowGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 16);
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.mesh.add(glow);
    }

    public update(): boolean {
        // Update position
        this.mesh.position.add(this.direction.multiplyScalar(this.speed));

        // Update trail
        const positions = this.trail.geometry.attributes.position.array as Float32Array;
        for (let i = positions.length - 3; i >= 3; i -= 3) {
            positions[i] = positions[i - 3];
            positions[i + 1] = positions[i - 2];
            positions[i + 2] = positions[i - 1];
        }
        positions[0] = this.mesh.position.x;
        positions[1] = this.mesh.position.y;
        positions[2] = this.mesh.position.z;
        this.trail.geometry.attributes.position.needsUpdate = true;

        // Check if laser should be removed
        if (this.mesh.position.z < -1000) {
            this.destroy();
            return true;
        }
        return false;
    }

    public destroy(): void {
        this.scene.remove(this.mesh);
        this.scene.remove(this.trail);
        this.mesh.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();
        this.trail.geometry.dispose();
        (this.trail.material as THREE.Material).dispose();
    }
}