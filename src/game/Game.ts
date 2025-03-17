import * as THREE from 'three';
import { Player } from '../entities/Player';
import { StarField } from '../environment/StarField';
import { Level } from '../game/Level';
import { FlightPath } from '../game/FlightPath';
import { WorldGenerator } from '../environment/WorldGenerator';
import { InputManager } from '../core/InputManager';

export class Game {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private player: Player;
    private starField: StarField;
    private level: Level;
    private flightPath: FlightPath;
    private worldGenerator: WorldGenerator;
    private inputManager: InputManager;

    constructor() {
        this.setupScene();
        this.setupLighting();
        this.initializeGameObjects();
        this.setupEventListeners();
    }

    private setupScene(): void {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000);
        document.body.appendChild(this.renderer.domElement);
    }

    private setupLighting(): void {
        const ambientLight = new THREE.AmbientLight(0x222222, 1);
        this.scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
        mainLight.position.set(5, 5, 5);
        this.scene.add(mainLight);

        const frontLight = new THREE.DirectionalLight(0xFFFFFF, 1);
        frontLight.position.set(0, 0, 5);
        this.scene.add(frontLight);

        const backLight = new THREE.DirectionalLight(0x4444ff, 0.5);
        backLight.position.set(0, 0, -5);
        this.scene.add(backLight);
    }

    private initializeGameObjects(): void {
        this.starField = new StarField(this.scene);
        this.level = new Level();
        this.flightPath = new FlightPath();
        this.worldGenerator = new WorldGenerator(this.scene, this.flightPath);
        this.player = new Player(this.scene);
        this.inputManager = new InputManager();

        // Camera setup
        this.camera.position.set(0, 3, 10);
        this.camera.lookAt(0, 0, -5);
    }

    private setupEventListeners(): void {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    public start(): void {
        this.animate();
    }

    private animate = (currentTime: number = 0): void => {
        requestAnimationFrame(this.animate);

        const input = this.inputManager.getInput();
        this.scene.userData.input = input;

        this.starField.update(input.boosting, input.warping);
        this.level.update(input.boosting);
        this.player.update(input);

        this.flightPath.setWormholeState(input.warping);
        this.flightPath.update(1/60, this.player.getPosition());
        this.worldGenerator.update(this.player.getPosition());

        this.updateCamera();
        this.renderer.render(this.scene, this.camera);
    }

    private updateCamera(): void {
        const playerPos = this.player.getPosition();
        const playerRotation = this.player.getRotation();

        const cameraDistance = 25;
        const heightOffset = 6;

        // Calculate camera position with more responsive following
        const idealOffset = new THREE.Vector3(
            playerPos.x * 0.8,  // More responsive following
            playerPos.y * 0.8 + heightOffset,
            playerPos.z + cameraDistance
        );

        const bankOffset = Math.sin(playerRotation.z) * 5;
        idealOffset.x += bankOffset;

        const lookTarget = new THREE.Vector3(
            playerPos.x * 0.9,
            playerPos.y * 0.9,
            playerPos.z - 40
        );

        this.camera.position.lerp(idealOffset, 0.08);
        this.camera.lookAt(lookTarget);
    }
}