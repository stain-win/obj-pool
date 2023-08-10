export class Dummy {
    private readonly name: string;
    private readonly dummy: number[]  = new Array(50).fill(0);
    private changeMe = 0;
    constructor(name?: string) {
        this.name = name || 'dummy';
    }

    public getName(): string {
        return this.name;
    }

    public getDummy(): number[] {
        return this.dummy;
    }

    public getChangeMe (): number {
        return this.changeMe;
    }

    public setChangeMe (changeme: number): void {
        this.changeMe = changeme;
    }
}
