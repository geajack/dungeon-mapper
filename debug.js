export class Timer
{
    constructor()
    {
        this.startTimes = {};
    }

    tick(name)
    {
        this.startTimes[name] = Date.now();
    }

    tock(name)
    {
        const duration = Date.now() - this.startTimes[name];
        console.log(`${name}: ${duration}ms`);
    }
}