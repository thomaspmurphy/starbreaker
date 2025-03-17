import * as THREE from 'three';

export class FlightPath {
    private forwardSpeed: number;
    private baseSpeed: number = 0.5;
    private wormholeSpeed: number = 5.0;
    private position: THREE.Vector3;
    private difficulty: number;
    private isWormhole: boolean = false;

    constructor() {
        this.forwardSpeed = this.baseSpeed;
        this.position = new THREE.Vector3(0, 0, 0);
        this.difficulty = 1;
    }

    public update(deltaTime: number, playerPosition: THREE.Vector3): void {
        this.position.copy(playerPosition);

        if (this.isWormhole) {
            this.forwardSpeed = this.wormholeSpeed;
        } else {
            this.forwardSpeed = this.baseSpeed;
        }

        this.difficulty += deltaTime * 0.1;
    }

    public setWormholeState(active: boolean): void {
        this.isWormhole = active;
    }

    public getDifficulty(): number {
        return this.difficulty;
    }

    public getSpeed(): number {
        return this.forwardSpeed;
    }
}