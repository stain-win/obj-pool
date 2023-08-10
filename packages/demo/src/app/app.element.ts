import './app.element.scss';
import {build, buildFactory, Poolable} from '@stain-win/objPool';
import {Dummy} from '../../../obj-pool/src/lib/test/dummy';
import {Grumpy} from '../../../obj-pool/src/lib/test/grumpy';

export class AppElement extends HTMLElement {
    public static observedAttributes = [];
    poolDummy: Poolable<Dummy>;
    poolGrumpy: Poolable<Grumpy>;

    poolDummyF: Poolable<Dummy>;
    poolGrumpyF: Poolable<Grumpy>;

    constructor() {
        super();

        this.poolDummy = build(Dummy, 20, (dummy: Dummy) => {
            dummy.setChangeMe(0);
            return dummy;
        });

        this.poolGrumpy = build(Grumpy);
        this.poolDummyF = buildFactory(() => new Dummy('test Dummy'));
        this.poolGrumpyF = buildFactory(() => new Grumpy('test Grumpy'));
    }

    connectedCallback() {
        const title = 'demo app';
        for (let i = 0; i < 10; i++) {
            const dummy = this.poolDummy.allocate() as Dummy
            this.poolDummy.release(dummy);
        }
        const dum1 = this.poolDummy.allocate();
        dum1.setChangeMe(10);
        this.poolDummy.allocate();
        this.poolDummy.allocate();

        this.poolDummy.release(dum1);

        this.innerHTML = `
    <div class="wrapper">
      <div class="container">
        <!--  WELCOME  -->
        <div id="welcome">
          <h1>
            <span> Hello there, </span>
            Welcome ${title} 👋
          </h1>
        </div>
        <p id="love">
          Carefully crafted with
          <svg
            fill="currentColor"
            stroke="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </p>
      </div>
    </div>
      `;
    }
}
customElements.define('app-root', AppElement);
