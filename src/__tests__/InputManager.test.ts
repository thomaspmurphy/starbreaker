import { expect, test, describe, beforeEach, mock } from "bun:test";
import { InputManager } from '../core/InputManager';
import type { GameInput } from '../core/InputManager';

// Mock KeyboardEvent
class MockKeyboardEvent {
    code: string;
    constructor(type: string, init: { code: string }) {
        this.code = init.code;
    }
    preventDefault() {}
}

// @ts-ignore - Replace global KeyboardEvent with mock
global.KeyboardEvent = MockKeyboardEvent;

// Mock window object
const mockWindow = {
    addEventListener: mock((() => {}) as typeof window.addEventListener),
    removeEventListener: mock((() => {}) as typeof window.removeEventListener),
};

// @ts-ignore - Replace global window with mock
global.window = mockWindow;

describe('InputManager', () => {
    let inputManager: InputManager;
    let eventListeners: { [key: string]: ((event: any) => void)[] } = {};

    beforeEach(() => {
        // Reset event listeners
        eventListeners = {
            keydown: [],
            keyup: []
        };

        // Mock addEventListener to capture listeners
        mockWindow.addEventListener.mockImplementation((type: string, listener: any) => {
            if (!eventListeners[type]) {
                eventListeners[type] = [];
            }
            eventListeners[type].push(listener);
        });

        inputManager = new InputManager();
    });

    function dispatchKeyEvent(type: 'keydown' | 'keyup', code: string) {
        const event = new KeyboardEvent(type, { code });
        eventListeners[type].forEach(listener => listener(event));
    }

    test('should initialize with default input state', () => {
        const input = inputManager.getInput();
        expect(input).toEqual({
            moveX: 0,
            moveY: 0,
            boosting: false,
            warping: false,
            shooting: false
        });
    });

    test('should handle WASD movement keys', () => {
        // Simulate W key press
        dispatchKeyEvent('keydown', 'KeyW');
        expect(inputManager.getInput().moveY).toBe(1);

        // Simulate S key press
        dispatchKeyEvent('keydown', 'KeyS');
        expect(inputManager.getInput().moveY).toBe(-1);

        // Simulate A key press
        dispatchKeyEvent('keydown', 'KeyA');
        expect(inputManager.getInput().moveX).toBe(-1);

        // Simulate D key press
        dispatchKeyEvent('keydown', 'KeyD');
        expect(inputManager.getInput().moveX).toBe(1);

        // Release keys
        dispatchKeyEvent('keyup', 'KeyW');
        dispatchKeyEvent('keyup', 'KeyS');
        dispatchKeyEvent('keyup', 'KeyA');
        dispatchKeyEvent('keyup', 'KeyD');

        const finalInput = inputManager.getInput();
        expect(finalInput.moveX).toBe(0);
        expect(finalInput.moveY).toBe(0);
    });

    test('should handle arrow key movement', () => {
        // Simulate arrow key presses
        dispatchKeyEvent('keydown', 'ArrowUp');
        expect(inputManager.getInput().moveY).toBe(1);

        dispatchKeyEvent('keydown', 'ArrowDown');
        expect(inputManager.getInput().moveY).toBe(-1);

        dispatchKeyEvent('keydown', 'ArrowLeft');
        expect(inputManager.getInput().moveX).toBe(-1);

        dispatchKeyEvent('keydown', 'ArrowRight');
        expect(inputManager.getInput().moveX).toBe(1);

        // Release keys
        dispatchKeyEvent('keyup', 'ArrowUp');
        dispatchKeyEvent('keyup', 'ArrowDown');
        dispatchKeyEvent('keyup', 'ArrowLeft');
        dispatchKeyEvent('keyup', 'ArrowRight');

        const finalInput = inputManager.getInput();
        expect(finalInput.moveX).toBe(0);
        expect(finalInput.moveY).toBe(0);
    });

    test('should handle boost input', () => {
        dispatchKeyEvent('keydown', 'ShiftLeft');
        expect(inputManager.getInput().boosting).toBe(true);

        dispatchKeyEvent('keyup', 'ShiftLeft');
        expect(inputManager.getInput().boosting).toBe(false);
    });

    test('should handle warp input', () => {
        dispatchKeyEvent('keydown', 'Tab');
        expect(inputManager.getInput().warping).toBe(true);

        dispatchKeyEvent('keyup', 'Tab');
        expect(inputManager.getInput().warping).toBe(false);
    });

    test('should handle shooting input', () => {
        dispatchKeyEvent('keydown', 'Space');
        expect(inputManager.getInput().shooting).toBe(true);

        dispatchKeyEvent('keyup', 'Space');
        expect(inputManager.getInput().shooting).toBe(false);
    });

    test('should not modify original input state when getting input', () => {
        // Press some keys
        dispatchKeyEvent('keydown', 'KeyW');
        dispatchKeyEvent('keydown', 'ShiftLeft');

        const input1 = inputManager.getInput();
        const input2 = inputManager.getInput();

        // Modify the first input object
        input1.moveY = 999;
        input1.boosting = false;

        // Second input should remain unchanged
        expect(input2.moveY).toBe(1);
        expect(input2.boosting).toBe(true);

        // Original state should be preserved
        const input3 = inputManager.getInput();
        expect(input3.moveY).toBe(1);
        expect(input3.boosting).toBe(true);
    });
});