export class Dummy {
    private readonly name: string;
    private dummyPre: number[] = new Array(50).fill(0);
    private dummy: number[] = [];
    private dummySlot = 0;
    private changeMe = 0;

    constructor (name?: string) {
        this.name = name || 'dummy';
    }

    public getName (): string {
        return this.name;
    }

    public getDummy (): number[] {
        return this.dummy;
    }

    public getDummyPre (): number[] {
        return this.dummyPre;
    }

    public setDummyPrealloc (dummyEl: number): void {
        if (this.dummySlot < 50) {
            this.dummyPre[this.dummySlot++] = dummyEl
        } else {
            this.dummyPre[this.dummyPre.length - 1] = dummyEl;
        }
    }

    public setDummy (dummyEl: number): void {
        this.dummy.push(dummyEl);

    }

    public getChangeMe (): number {
        return this.changeMe;
    }

    public setChangeMe (changeme: number): void {
        this.changeMe = changeme;
    }

    public reset (): Dummy {
        this.dummy = [];
        this.dummySlot = 0;
        this.changeMe = 0;
        return this;
    }
}
