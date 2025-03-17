export class ShipStats {
    private health: number = 100;
    private shield: number = 100;
    private energy: number = 100;

    public takeDamage(amount: number): void {
        if (this.shield > 0) {
            this.shield -= amount;
            if (this.shield < 0) {
                this.health += this.shield;
                this.shield = 0;
            }
        } else {
            this.health -= amount;
        }
    }

    public useEnergy(amount: number): boolean {
        if (this.energy >= amount) {
            this.energy -= amount;
            return true;
        }
        return false;
    }

    public rechargeEnergy(amount: number): void {
        this.energy = Math.min(this.energy + amount, 100);
    }

    public rechargeShield(amount: number): void {
        this.shield = Math.min(this.shield + amount, 100);
    }

    public getHealth(): number {
        return this.health;
    }

    public getShield(): number {
        return this.shield;
    }

    public getEnergy(): number {
        return this.energy;
    }
}