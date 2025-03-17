import * as THREE from 'three';
import type { GameInput } from '../core/InputManager';
import { Laser } from './Laser';
import { Reticle } from './Reticle';
import { ShipStats } from './ShipStats';

export class Player {
    mesh: THREE.Group = new THREE.Group();
    private speed: number = 0.5;
    private maxRoll: number = 1.5;
    private bankingSensitivity: number = 0.1;
    private baseSpeed: number = 1;
    private boostMultiplier: number = 2;
    private warpMultiplier: number = 8;
    private position: THREE.Vector3;
    private velocity: THREE.Vector3;
    private boosting: boolean = false;
    private boostParticles!: THREE.Points;
    private lasers: Laser[] = [];
    private canShoot: boolean = true;
    private shootCooldown: number = 150;
    private reticle!: Reticle;
    private stats: ShipStats;
    private spotlight!: THREE.SpotLight;

    constructor(private scene: THREE.Scene) {
        this.position = new THREE.Vector3(0, 0, -5);
        this.velocity = new THREE.Vector3();
        this.stats = new ShipStats();

        this.initializeShip();
        this.initializeReticle();
        this.initializeBoostParticles();
    }

    private createShipBody(material: THREE.MeshStandardMaterial): void {
        const bodyGeometry = new THREE.ConeGeometry(1, 4, 8);
        const body = new THREE.Mesh(bodyGeometry, material);
        body.rotation.x = -Math.PI / 2;
        body.position.z = -2;
        this.mesh.add(body);

        const cockpitGeometry = new THREE.SphereGeometry(0.8, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const cockpit = new THREE.Mesh(cockpitGeometry, material);
        cockpit.position.z = -0.5;
        this.mesh.add(cockpit);
    }

    private createShipWings(material: THREE.MeshStandardMaterial): void {
        const wingGeometry = new THREE.BoxGeometry(6, 0.2, 3);
        const leftWing = new THREE.Mesh(wingGeometry, material);
        const rightWing = new THREE.Mesh(wingGeometry, material);

        leftWing.position.set(-2, 0, -1);
        rightWing.position.set(2, 0, -1);
        leftWing.rotation.z = Math.PI * 0.1;
        rightWing.rotation.z = -Math.PI * 0.1;

        this.mesh.add(leftWing);
        this.mesh.add(rightWing);
    }

    private createLighting(): void {
        // Add engine glow
        const engineLight = new THREE.PointLight(0x00ffff, 2, 5);
        engineLight.position.z = -2;
        this.mesh.add(engineLight);

        // Add spotlight for better visibility
        this.spotlight = new THREE.SpotLight(0xffffff, 1);
        this.spotlight.position.set(0, 10, 10);
        this.spotlight.target = this.mesh;
        this.scene.add(this.spotlight);
    }

    private initializeShip(): void {
        // Create ship materials
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xCCCCCC,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x222222,
            transparent: false,
            side: THREE.FrontSide
        });

        const wingMaterial = new THREE.MeshStandardMaterial({
            color: 0x0044ff,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x001133,
            transparent: false,
            side: THREE.FrontSide
        });

        // Create ship body and wings
        this.createShipBody(bodyMaterial);
        this.createShipWings(wingMaterial);
        this.createLighting();

        // Scale up the ship
        this.mesh.scale.set(1.5, 1.5, 1.5);
        this.scene.add(this.mesh);
    }

    private initializeReticle(): void {
        this.reticle = new Reticle(this.scene);
    }

    private initializeBoostParticles(): void {
        const particleGeometry = new THREE.BufferGeometry();
        const particleCount = 100;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 2;

            colors[i * 3] = 0;
            colors[i * 3 + 1] = 1;
            colors[i * 3 + 2] = 1;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
        });

        this.boostParticles = new THREE.Points(particleGeometry, particleMaterial);
        this.boostParticles.visible = false;
        this.mesh.add(this.boostParticles);
    }

    private move(x: number, y: number, boosting: boolean, warping: boolean): void {
        const targetX = x * 50;
        const targetY = y * 40;
        const roll = -x * this.maxRoll;

        const bankingFactor = Math.abs(x) > 0.5 ? 1.5 : 1.0;

        const currentBankingSensitivity = this.bankingSensitivity * (warping ? 0.6 : boosting ? 0.8 : 1.0);

        const currentSpeed = warping ? this.baseSpeed * this.warpMultiplier :
                           boosting ? this.baseSpeed * this.boostMultiplier :
                           this.baseSpeed;

        this.mesh.position.x += (targetX - this.mesh.position.x) * currentBankingSensitivity;
        this.mesh.position.y += (targetY - this.mesh.position.y) * currentBankingSensitivity;
        this.mesh.position.z -= currentSpeed;
        this.mesh.rotation.z += (roll - this.mesh.rotation.z) * currentBankingSensitivity * bankingFactor;

        this.boosting = boosting;
        this.boostParticles.visible = boosting || warping;

        if (this.boostParticles.visible) {
            const particleScale = warping ? 2.0 : boosting ? 1.5 : 1.0;
            this.boostParticles.scale.set(particleScale, particleScale, particleScale);
        }
    }

    private shoot(): void {
        if (!this.canShoot) return;

        const laserStartPos = this.mesh.position.clone();
        const targetPos = this.reticle.getPosition();

        // Calculate firing direction considering ship's orientation
        const direction = targetPos.clone().sub(laserStartPos);

        // Apply ship's banking effect to the shot trajectory
        const bankingOffset = Math.sin(this.mesh.rotation.z) * 2;
        direction.x += bankingOffset;

        direction.normalize();

        const laser = new Laser(this.scene, laserStartPos, targetPos);
        this.lasers.push(laser);

        this.canShoot = false;
        setTimeout(() => this.canShoot = true, this.shootCooldown);
    }

    private updateLasers(): void {
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            if (laser.update()) {
                this.lasers.splice(i, 1);
            }
        }
    }

    public update(input: GameInput): void {
        this.move(input.moveX, input.moveY, input.boosting, input.warping);
        if (input.shooting) {
            this.shoot();
        }
        this.updateLasers();
        this.reticle.update(this.mesh.position, this.mesh.rotation);
    }

    public getPosition(): THREE.Vector3 {
        return this.mesh.position.clone();
    }

    public getLasers(): Laser[] {
        return this.lasers;
    }

    public getRotation(): THREE.Euler {
        return this.mesh.rotation.clone();
    }
}