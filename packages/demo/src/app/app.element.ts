import './app.element.scss';
import {build, buildFactory, Poolable, getAllPoolStats, PoolStats} from '@stain-win/objPool';
import {Dummy} from '../../../obj-pool/src/lib/test/dummy';
import {Grumpy} from '../../../obj-pool/src/lib/test/grumpy';

export class AppElement extends HTMLElement {
    public static observedAttributes = [];

    private poolDummy: Poolable<Dummy>;
    private poolGrumpy: Poolable<Grumpy>;
    private poolDummyFactory: Poolable<Dummy>;
    private allocatedObjects: Dummy[] = [];
    private statsInterval?: number;

    constructor() {
        super();

        // Create pools with different configurations
        this.poolDummy = build(Dummy, 20, (dummy: Dummy) => {
            dummy.reset();
            return dummy;
        }, 100); // Max size of 100

        this.poolGrumpy = build(Grumpy, 10);

        this.poolDummyFactory = buildFactory(
            () => new Dummy('Factory Dummy'),
            5,
            (d) => d.reset(),
            50
        );
    }

    connectedCallback() {
        this.render();
        this.attachEventListeners();
        this.startStatsMonitoring();
    }

    disconnectedCallback() {
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
        }
    }

    private render() {
        this.innerHTML = `
            <div class="wrapper">
                <div class="container">
                    <header id="welcome">
                        <h1>
                            <span>🎱 Object Pool</span>
                            Interactive Demo
                        </h1>
                        <p class="subtitle">
                            Explore high-performance object pooling with real-time statistics
                        </p>
                    </header>

                    <!-- Feature Showcase -->
                    <section class="feature-grid">
                        <div class="feature-card">
                            <div class="feature-icon">⚡</div>
                            <h3>High Performance</h3>
                            <p>15-20% faster than new object creation</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">📊</div>
                            <h3>Real-time Stats</h3>
                            <p>Monitor pool usage and efficiency</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🔒</div>
                            <h3>Type Safe</h3>
                            <p>100% TypeScript with generics</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🎯</div>
                            <h3>Smart Growth</h3>
                            <p>Automatic pool sizing & shrinking</p>
                        </div>
                    </section>

                    <!-- Interactive Controls -->
                    <section class="controls-section">
                        <h2>Interactive Pool Operations</h2>

                        <div class="control-group">
                            <div class="control-panel">
                                <h3>Allocation Controls</h3>
                                <div class="button-group">
                                    <button id="allocate-1" class="btn btn-primary">
                                        Allocate 1 Object
                                    </button>
                                    <button id="allocate-10" class="btn btn-primary">
                                        Allocate 10 Objects
                                    </button>
                                    <button id="allocate-100" class="btn btn-primary">
                                        Allocate 100 Objects
                                    </button>
                                </div>
                                <div class="button-group">
                                    <button id="release-all" class="btn btn-secondary">
                                        Release All
                                    </button>
                                    <button id="release-half" class="btn btn-secondary">
                                        Release Half
                                    </button>
                                </div>
                            </div>

                            <div class="control-panel">
                                <h3>Pool Management</h3>
                                <div class="button-group">
                                    <button id="reserve-50" class="btn btn-info">
                                        Reserve 50 Objects
                                    </button>
                                    <button id="shrink-pool" class="btn btn-info">
                                        Shrink to 10
                                    </button>
                                </div>
                                <div class="button-group">
                                    <button id="benchmark" class="btn btn-warning">
                                        🏁 Run Benchmark
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="status-display">
                            <div class="status-item">
                                <span class="status-label">Currently Allocated:</span>
                                <span id="allocated-count" class="status-value">0</span>
                            </div>
                        </div>
                    </section>

                    <!-- Statistics Display -->
                    <section class="stats-section">
                        <h2>Pool Statistics</h2>
                        <div id="stats-container" class="stats-grid">
                            <!-- Stats will be injected here -->
                        </div>
                    </section>

                    <!-- Benchmark Results -->
                    <section class="benchmark-section" id="benchmark-section" style="display: none;">
                        <h2>Benchmark Results</h2>
                        <div id="benchmark-results" class="benchmark-results">
                            <!-- Results will be injected here -->
                        </div>
                    </section>

                    <!-- Code Examples -->
                    <section class="examples-section">
                        <h2>Code Examples</h2>

                        <div class="example-card">
                            <h3>Basic Usage</h3>
                            <pre><code>import { build } from '@stain-win/obj-pool';

// Create a pool
const pool = build(MyClass, 20, (obj) => obj.reset());

// Allocate objects
const obj = pool.allocate();

// Use the object
obj.doSomething();

// Return to pool when done
pool.release(obj);</code></pre>
                        </div>

                        <div class="example-card">
                            <h3>With Statistics</h3>
                            <pre><code>// Get pool statistics
const stats = pool.getStats();
console.log(\`Pool: \${stats.inUse}/\${stats.capacity} in use\`);

// Monitor all pools
const allStats = getAllPoolStats();
allStats.forEach(({ name, stats }) => {
    console.log(\`\${name}: \${stats.available} available\`);
});</code></pre>
                        </div>

                        <div class="example-card">
                            <h3>Advanced Features</h3>
                            <pre><code>// With max size limit
const pool = build(MyClass, 20, recycler, 100);

// Shrink pool after peak usage
pool.shrink(20);

// Batch operations
pool.release([obj1, obj2, obj3]);</code></pre>
                        </div>
                    </section>

                    <footer class="footer">
                        <p>
                            <strong>@stain-win/obj-pool</strong> - High-performance object pooling for JavaScript
                        </p>
                        <p class="footer-links">
                            <a href="https://github.com/stain-win/obj-pool" target="_blank">GitHub</a>
                            <span>•</span>
                            <a href="https://www.npmjs.com/package/@stain-win/obj-pool" target="_blank">NPM</a>
                        </p>
                    </footer>
                </div>
            </div>
        `;
    }

    private attachEventListeners() {
        // Allocation buttons
        this.querySelector('#allocate-1')?.addEventListener('click', () => this.allocateObjects(1));
        this.querySelector('#allocate-10')?.addEventListener('click', () => this.allocateObjects(10));
        this.querySelector('#allocate-100')?.addEventListener('click', () => this.allocateObjects(100));

        // Release buttons
        this.querySelector('#release-all')?.addEventListener('click', () => this.releaseObjects('all'));
        this.querySelector('#release-half')?.addEventListener('click', () => this.releaseObjects('half'));

        // Management buttons
        this.querySelector('#reserve-50')?.addEventListener('click', () => this.reserveObjects(50));
        this.querySelector('#shrink-pool')?.addEventListener('click', () => this.shrinkPool(10));

        // Benchmark button
        this.querySelector('#benchmark')?.addEventListener('click', () => this.runBenchmark());
    }

    private allocateObjects(count: number) {
        const start = performance.now();

        for (let i = 0; i < count; i++) {
            const obj = this.poolDummy.allocate();
            obj.setChangeMe(Math.random() * 100);
            this.allocatedObjects.push(obj);
        }

        const duration = performance.now() - start;
        this.updateAllocatedCount();
        this.showNotification(`Allocated ${count} objects in ${duration.toFixed(2)}ms`, 'success');
        this.updateStats();
    }

    private releaseObjects(mode: 'all' | 'half') {
        const count = mode === 'all'
            ? this.allocatedObjects.length
            : Math.floor(this.allocatedObjects.length / 2);

        if (count === 0) {
            this.showNotification('No objects to release', 'info');
            return;
        }

        const toRelease = this.allocatedObjects.splice(0, count);
        this.poolDummy.release(toRelease);

        this.updateAllocatedCount();
        this.showNotification(`Released ${count} objects`, 'success');
        this.updateStats();
    }

    private reserveObjects(count: number) {
        this.poolDummy.reserve(count);
        this.showNotification(`Reserved ${count} objects`, 'info');
        this.updateStats();
    }

    private shrinkPool(targetSize: number) {
        this.poolDummy.shrink(targetSize);
        this.showNotification(`Pool shrunk to ${targetSize} free objects`, 'info');
        this.updateStats();
    }

    private runBenchmark() {
        const btn = this.querySelector('#benchmark') as HTMLButtonElement;
        btn.disabled = true;
        btn.textContent = '⏳ Running...';

        setTimeout(() => {
            const iterations = 10000;

            // Benchmark WITH POOL - realistic allocation/release cycle
            const poolStart = performance.now();
            for (let i = 0; i < iterations; i++) {
                const obj = this.poolDummy.allocate();
                obj.setChangeMe(i);
                obj.setDummyPrealloc(i % 50);
                // Immediately release - simulates real-world usage
                this.poolDummy.release(obj);
            }
            const poolDuration = performance.now() - poolStart;

            // Benchmark WITHOUT POOL - same operations
            const nopoolStart = performance.now();
            for (let i = 0; i < iterations; i++) {
                const obj = new Dummy();
                obj.setChangeMe(i);
                obj.setDummyPrealloc(i % 50);
                // Object becomes garbage - GC will clean it up later
            }
            const nopoolDuration = performance.now() - nopoolStart;

            const improvement = ((nopoolDuration - poolDuration) / nopoolDuration * 100).toFixed(1);

            this.displayBenchmarkResults({
                iterations,
                poolDuration,
                nopoolDuration,
                improvement
            });

            btn.disabled = false;
            btn.textContent = '🏁 Run Benchmark';
            this.showNotification('Benchmark completed!', 'success');
        }, 100);
    }

    private displayBenchmarkResults(results: {
        iterations: number;
        poolDuration: number;
        nopoolDuration: number;
        improvement: string;
    }) {
        const section = this.querySelector('#benchmark-section') as HTMLElement;
        const container = this.querySelector('#benchmark-results') as HTMLElement;

        section.style.display = 'block';
        container.innerHTML = `
            <div class="benchmark-card">
                <h3>With Pool</h3>
                <div class="benchmark-time">${results.poolDuration.toFixed(2)}ms</div>
                <div class="benchmark-label">${results.iterations.toLocaleString()} operations</div>
            </div>
            <div class="benchmark-card">
                <h3>Without Pool</h3>
                <div class="benchmark-time">${results.nopoolDuration.toFixed(2)}ms</div>
                <div class="benchmark-label">${results.iterations.toLocaleString()} operations</div>
            </div>
            <div class="benchmark-card highlight">
                <h3>Performance Gain</h3>
                <div class="benchmark-improvement">${results.improvement}%</div>
                <div class="benchmark-label">faster with pooling</div>
            </div>
        `;
    }

    private startStatsMonitoring() {
        this.updateStats();
        this.statsInterval = window.setInterval(() => {
            this.updateStats();
        }, 1000);
    }

    private updateStats() {
        const allStats = getAllPoolStats();
        const container = this.querySelector('#stats-container');

        if (!container) return;

        // Sort stats by pool name to prevent jumping
        const sortedStats = allStats.sort((a, b) => a.name.localeCompare(b.name));

        // Check if cards already exist
        const existingCards = container.querySelectorAll('.stat-card');

        if (existingCards.length === sortedStats.length) {
            // Update existing cards instead of recreating
            sortedStats.forEach(({ name, stats }, index) => {
                const card = existingCards[index] as HTMLElement;

                // Update only the values, not the structure
                const values = card.querySelectorAll('.stat-value');
                if (values[0]) values[0].textContent = stats.available.toString();
                if (values[1]) values[1].textContent = stats.inUse.toString();
                if (values[2]) values[2].textContent = stats.capacity.toString();
                if (values[3]) values[3].textContent = stats.maxSize === Infinity ? '∞' : stats.maxSize.toString();

                // Update progress bar
                const progressFill = card.querySelector('.progress-fill') as HTMLElement;
                if (progressFill) {
                    const utilization = (stats.inUse / stats.capacity * 100).toFixed(1);
                    progressFill.style.width = `${utilization}%`;
                }

                const progressLabel = card.querySelector('.progress-label');
                if (progressLabel) {
                    progressLabel.textContent = `${(stats.inUse / stats.capacity * 100).toFixed(1)}% utilized`;
                }

                // Update footer stats
                const footerSmalls = card.querySelectorAll('.stat-footer small');
                if (footerSmalls[0]) footerSmalls[0].textContent = `Total Allocations: ${stats.totalAllocations.toLocaleString()}`;
                if (footerSmalls[1]) footerSmalls[1].textContent = `Total Releases: ${stats.totalReleases.toLocaleString()}`;
            });
        } else {
            // Initial render - create all cards
            container.innerHTML = sortedStats.map(({ name, stats }) => `
                <div class="stat-card" data-pool-name="${name}">
                    <h3>${name} Pool</h3>
                    <div class="stat-row">
                        <span class="stat-label">Available:</span>
                        <span class="stat-value">${stats.available}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">In Use:</span>
                        <span class="stat-value">${stats.inUse}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Capacity:</span>
                        <span class="stat-value">${stats.capacity}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Max Size:</span>
                        <span class="stat-value">${stats.maxSize === Infinity ? '∞' : stats.maxSize}</span>
                    </div>
                    <div class="stat-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(stats.inUse / stats.capacity * 100).toFixed(1)}%"></div>
                        </div>
                        <span class="progress-label">${(stats.inUse / stats.capacity * 100).toFixed(1)}% utilized</span>
                    </div>
                    <div class="stat-footer">
                        <small>Total Allocations: ${stats.totalAllocations.toLocaleString()}</small>
                        <small>Total Releases: ${stats.totalReleases.toLocaleString()}</small>
                    </div>
                </div>
            `).join('');
        }
    }

    private updateAllocatedCount() {
        const countEl = this.querySelector('#allocated-count');
        if (countEl) {
            countEl.textContent = this.allocatedObjects.length.toString();
        }
    }

    private showNotification(message: string, type: 'success' | 'info' | 'warning' = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        this.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

customElements.define('app-root', AppElement);
