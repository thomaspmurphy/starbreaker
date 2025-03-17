import * as THREE from 'three';
import { Enemy } from '../entities/Enemy';

describe('Enemy', () => {
    let scene: THREE.Scene;
    let enemy: Enemy;
    const initialPosition = new THREE.Vector3(0, 0, 0);
    const level = 1;

    beforeEach(() => {
        scene = new THREE.Scene();
        enemy = new Enemy(scene, initialPosition, level);
    });

    afterEach(() => {
        // Clean up
        enemy.destroy();
    });

    test('should initialize with correct properties', () => {
        expect(enemy.mesh).toBeInstanceOf(THREE.Group);
        expect(enemy.mesh.position).toEqual(initialPosition);
        expect(scene.children).toContain(enemy.mesh);
        expect(enemy.mesh.children.length).toBe(10); // body + 6 spikes + core + 2 exhausts
    });

    test('should move towards player position', () => {
        const playerPosition = new THREE.Vector3(10, 0, 0);
        const initialEnemyPosition = enemy.mesh.position.clone();

        enemy.update(playerPosition);

        expect(enemy.mesh.position.x).toBeGreaterThan(initialEnemyPosition.x);
        expect(enemy.mesh.position).not.toEqual(initialEnemyPosition);
    });

    test('should take damage and update health', () => {
        const result = enemy.takeDamage(50);
        expect(result).toBe(false); // Enemy shouldn't be dead yet

        const killResult = enemy.takeDamage(50);
        expect(killResult).toBe(true); // Enemy should be dead
        expect(enemy.isRemoved()).toBe(true);
        expect(scene.children).not.toContain(enemy.mesh);
    });

    test('should be removed from scene when destroyed', () => {
        expect(scene.children).toContain(enemy.mesh);
        enemy.destroy();
        expect(scene.children).not.toContain(enemy.mesh);
        expect(enemy.isRemoved()).toBe(true);
    });

    test('should face the player when updating', () => {
        const playerPosition = new THREE.Vector3(10, 10, 0);
        const initialRotation = enemy.mesh.rotation.clone();

        enemy.update(playerPosition);

        expect(enemy.mesh.rotation).not.toEqual(initialRotation);
    });

    test('should initialize with higher health and speed at higher levels', () => {
        const highLevelEnemy = new Enemy(scene, initialPosition, 2);
        const lowLevelEnemy = new Enemy(scene, initialPosition, 1);

        // Test higher level enemy takes more hits to destroy
        lowLevelEnemy.takeDamage(150);
        highLevelEnemy.takeDamage(150);

        expect(lowLevelEnemy.isRemoved()).toBe(true);
        expect(highLevelEnemy.isRemoved()).toBe(false);

        // Clean up
        highLevelEnemy.destroy();
    });
});