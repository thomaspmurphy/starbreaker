import { expect, test, describe, beforeEach } from "bun:test";
import * as THREE from 'three';
import { Laser } from '../entities/Laser';

describe('Laser', () => {
    let scene: THREE.Scene;

    beforeEach(() => {
        scene = new THREE.Scene();
    });

    test('should create a laser with correct initial properties', () => {
        const startPos = new THREE.Vector3(0, 0, 0);
        const targetPos = new THREE.Vector3(0, 0, -1);
        const laser = new Laser(scene, startPos, targetPos);

        expect(laser.mesh).toBeDefined();
        expect(laser.mesh.position.equals(startPos)).toBe(true);
        expect(scene.children).toContain(laser.mesh);
    });

    test('should update laser position correctly', () => {
        const startPos = new THREE.Vector3(0, 0, 0);
        const targetPos = new THREE.Vector3(0, 0, -1);
        const laser = new Laser(scene, startPos, targetPos);

        const initialPosition = laser.mesh.position.clone();
        laser.update();

        expect(laser.mesh.position.z).toBeLessThan(initialPosition.z);
    });

    test('should destroy laser and clean up resources', () => {
        const startPos = new THREE.Vector3(0, 0, 0);
        const targetPos = new THREE.Vector3(0, 0, -1);
        const laser = new Laser(scene, startPos, targetPos);

        laser.destroy();

        expect(scene.children).not.toContain(laser.mesh);
    });

    test('should create laser trail', () => {
        const startPos = new THREE.Vector3(0, 0, 0);
        const targetPos = new THREE.Vector3(0, 0, -1);
        const laser = new Laser(scene, startPos, targetPos);

        const trail = scene.children.find(child => child instanceof THREE.Line);
        expect(trail).toBeDefined();
    });

    test('should return true when laser is out of bounds', () => {
        const startPos = new THREE.Vector3(0, 0, 0);
        const targetPos = new THREE.Vector3(0, 0, -1);
        const laser = new Laser(scene, startPos, targetPos);

        // Move laser far away
        laser.mesh.position.z = -1001;

        expect(laser.update()).toBe(true);
    });
});