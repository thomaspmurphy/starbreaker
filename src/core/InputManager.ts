export interface GameInput {
    moveX: number;
    moveY: number;
    boosting: boolean;
    warping: boolean;
    shooting: boolean;
}

export class InputManager {
    private keys: Set<string> = new Set();
    private input: GameInput = {
        moveX: 0,
        moveY: 0,
        boosting: false,
        warping: false,
        shooting: false
    };

    constructor() {
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    private handleKeyDown = (event: KeyboardEvent): void => {
        this.keys.add(event.code);
        this.updateInputState(event, true);
    }

    private handleKeyUp = (event: KeyboardEvent): void => {
        this.keys.delete(event.code);
        this.updateInputState(event, false);
    }

    private updateInputState(event: KeyboardEvent, isKeyDown: boolean): void {
        switch (event.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.input.moveX = isKeyDown ? -1 : 0;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.input.moveX = isKeyDown ? 1 : 0;
                break;
            case 'ArrowUp':
            case 'KeyW':
                this.input.moveY = isKeyDown ? 1 : 0;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.input.moveY = isKeyDown ? -1 : 0;
                break;
            case 'ShiftLeft':
                this.input.boosting = isKeyDown;
                break;
            case 'Space':
                this.input.shooting = isKeyDown;
                break;
            case 'Tab':
                event.preventDefault();
                this.input.warping = isKeyDown;
                break;
        }
    }

    public getInput(): GameInput {
        return { ...this.input };
    }
}