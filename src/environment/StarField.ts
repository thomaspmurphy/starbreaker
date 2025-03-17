import * as THREE from 'three';

export class StarField {
    private stars: THREE.Points = new THREE.Points();
    private warpField: THREE.Points = new THREE.Points();
    private initialPositions: Float32Array = new Float32Array(0);
    private readonly starCount: number = 8000;  // Increased further
    private readonly starDepth: number = 3000;  // Increased depth
    private readonly starSpread: number = 500;  // Increased spread
    private readonly resetZ: number = -3000;    // Further reset point
    private readonly minVisibleStars: number = 1000; // Minimum visible stars threshold

    constructor(private scene: THREE.Scene) {
        this.initialize();
    }

    private initialize(): void {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.starCount * 3);
        this.initialPositions = new Float32Array(this.starCount * 3);

        // Distribute stars more evenly through space
        for (let i = 0; i < this.starCount; i++) {
            const i3 = i * 3;

            // Improved distribution using cube root for more stars at edges
            const radius = Math.pow(Math.random(), 1/3) * this.starSpread;
            const theta = Math.random() * Math.PI * 2;
            const z = Math.random() * -this.starDepth;

            const x = radius * Math.cos(theta);
            const y = radius * Math.sin(theta);

            positions[i3] = x;
            positions[i3 + 1] = y;
            positions[i3 + 2] = z;

            this.initialPositions[i3] = x;
            this.initialPositions[i3 + 1] = y;
            this.initialPositions[i3 + 2] = z;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            size: 2.0,  // Increased size
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        this.stars = new THREE.Points(geometry, material);
        this.scene.add(this.stars);
    }

    public update(boosting: boolean, warping: boolean): void {
        const positions = this.stars.geometry.attributes.position.array as Float32Array;
        const baseSpeed = 2;
        const speed = warping ? baseSpeed * 8 : boosting ? baseSpeed * 3 : baseSpeed;

        let visibleStars = 0;
        let starsToReset = [];

        // First pass: count visible stars and mark stars for reset
        for (let i = 0; i < this.starCount; i++) {
            const i3 = i * 3;
            positions[i3 + 2] += speed;

            // Count stars that are still visible
            if (positions[i3 + 2] < 100) {
                visibleStars++;
            }

            // Mark stars for reset when they get too close
            if (positions[i3 + 2] > 100) {
                starsToReset.push(i);
            }
        }

        // Reset marked stars and add more if needed
        const totalToReset = Math.max(
            starsToReset.length,
            warping ? 200 : boosting ? 100 : 50  // Force more resets during high speed
        );

        // Reset existing stars that went out of bounds
        for (const i of starsToReset) {
            this.resetStar(positions, i * 3);
        }

        // If we're running low on visible stars, force reset additional ones
        if (visibleStars < this.minVisibleStars || warping) {
            const additionalResets = Math.min(
                this.starCount - starsToReset.length,
                warping ? 300 : boosting ? 150 : 75
            );

            for (let i = 0; i < additionalResets; i++) {
                const randomStar = Math.floor(Math.random() * this.starCount);
                this.resetStar(positions, randomStar * 3);
            }
        }

        this.stars.geometry.attributes.position.needsUpdate = true;
    }

    private resetStar(positions: Float32Array, index: number): void {
        // Use cylindrical coordinates for better distribution
        const radius = Math.pow(Math.random(), 1/3) * this.starSpread;
        const theta = Math.random() * Math.PI * 2;

        // Calculate new position
        positions[index] = radius * Math.cos(theta);
        positions[index + 1] = radius * Math.sin(theta);

        // Stagger Z positions based on speed state
        const zVariation = Math.random() * 1000;
        positions[index + 2] = this.resetZ - zVariation;
    }
}