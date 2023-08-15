export class Grumpy {
    private readonly name: string;
    constructor(name?: string) {
        this.name = name || 'grumpy';
    }
    getName() {
        return this.name;
    }
}
