export class Frac {
    n: number;
    d: number;

    constructor(n: number, d: number) {
        if (d === 0) throw new Error("Denominator cannot be zero");
        
        // Handle signs
        const sign = (n < 0 ? -1 : 1) * (d < 0 ? -1 : 1);
        n = Math.abs(n);
        d = Math.abs(d);
        
        const g = this.gcd(n, d);
        this.n = sign * (n / g);
        this.d = d / g;
    }

    private gcd(a: number, b: number): number {
        return b === 0 ? a : this.gcd(b, a % b);
    }

    add(b: Frac) {
        return new Frac(this.n * b.d + b.n * this.d, this.d * b.d);
    }

    sub(b: Frac) {
        return new Frac(this.n * b.d - b.n * this.d, this.d * b.d);
    }

    mul(b: Frac) {
        return new Frac(this.n * b.n, this.d * b.d);
    }

    div(b: Frac) {
        if (b.n === 0) throw new Error("Division by zero");
        return new Frac(this.n * b.d, this.d * b.n);
    }

    toNumber() {
        return this.n / this.d;
    }

    isNegative() {
        return this.n < 0;
    }

    isInteger() {
        return this.d === 1;
    }
}
