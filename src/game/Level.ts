export class Level {
    private baseSpeed: number = 0.2;
    private currentSpeed: number = 0.2;
    private progress: number = 0;

    update(boost: boolean): number {
        const targetSpeed = boost ? this.baseSpeed * 2.5 : this.baseSpeed;
        this.currentSpeed += (targetSpeed - this.currentSpeed) * 0.1;
        this.progress += this.currentSpeed;
        return this.progress;
    }
}