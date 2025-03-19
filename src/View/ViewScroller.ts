import { createSideEffectBinder, withValueEnhancer, Val } from "value-enhancer";
import { SideEffectManager } from "side-effect-manager";
import { WindowManager } from "..";
import { type CallbackManager, createCallbackManager } from "../Utils/callbacks";
import { ScrollerScrollEventType } from "../ScrollerManager";
import { debounce } from "lodash";

type ValConfig = {
    $crood: Val<InternalCoord>;
};

export type ViewScrollerConfig = {
    appId: string;
    manager: WindowManager;
    scrollElement: HTMLDivElement | HTMLElement;
};

export type ScrollCoord = {
    x?: number;
    y?: number;
};

export const PageScrollerAttributeField = "scrollData";

// coord [0,1]; 0 is top, 1 is bottom;
// ex. scrollTop element.scrollHeight - element.clientHeight = maxScrollTop;
// ex. element.scrollTop / maxScrollTop = 1

type InternalCoord = {
    x: number;
    y: number;
};

class ViewScroller {
    public readonly appId: string;
    private readonly _scrollingElement: HTMLDivElement | HTMLElement;
    private readonly manager: WindowManager;
    private crood: Val<InternalCoord>;
    protected _sideEffect: SideEffectManager;
    private baseScrollTop: number = 0;
    private baseScrollLeft: number = 0;
    protected sizeObserver: ResizeObserver
    protected callbackManager: CallbackManager

    constructor(config: ViewScrollerConfig) {
        this._sideEffect = new SideEffectManager();
        const { createVal } = createSideEffectBinder(this._sideEffect as any);
        this._scrollingElement = config.scrollElement;
        this.manager = config.manager;
        this.appId = config.appId;
        
        this.crood = createVal<InternalCoord>(this.getAttribute());

        const valConfig: ValConfig = {
            $crood: this.crood,
        };

        withValueEnhancer(this, valConfig);

        this.updateSize()

        this._sideEffect.addEventListener(this._scrollingElement, 'scroll', this.onScroll.bind(this), true)

        this.callbackManager = createCallbackManager()
        this.sizeObserver = new ResizeObserver(this.callbackManager.runCallbacks)

        this.callbackManager.addCallback(this.updateSize.bind(this))
        this.sizeObserver.observe(this._scrollingElement)
        this.sizeObserver.observe(this._scrollingElement.firstElementChild!)
        this.crood.reaction(() => {
            this.scroll();
        })

        setTimeout(() => {
            this.updateSize()
            this.scroll();
        })
    }

    private updateSize () {
        console.log('onAppScrolling update size', this._scrollingElement.scrollHeight, this._scrollingElement.clientHeight)
        this.baseScrollTop =
            this._scrollingElement.scrollHeight - this._scrollingElement.clientHeight;
        this.baseScrollLeft =
            this._scrollingElement.scrollWidth - this._scrollingElement.clientWidth;
    }

    private onScroll() {
        if (this.manager.readonly) return
        const {x, y} = this.calcLocalToCoord(this.getLocalCoord())
        this.dispatchScrollEvent({x, y})
    }

    private dispatchScrollEvent = debounce(({x, y}: {x: number, y: number}) => {
        this.manager.room?.dispatchMagixEvent(ScrollerScrollEventType, {appId: this.appId, x, y})
    }, 500)

    private scroll(): void {
        if (!this._scrollingElement) return;

        const { x: left, y: top } = this.calcCoordToLocal();

        console.log('onAppScrolling', {left, top})
        this.scrollLeft(left);
        this.scrollTop(top);
    }

    public setCoord(position: ScrollCoord): void {
        console.log('onAppScrolling setCoord', position)
        this.crood.setValue({
            x: position.x || this.crood.value.x,
            y: position.y || this.crood.value.y,
        });
        this.setAttribute();
    }

    private setAttribute() {
        const currentAttribute = this.manager.getAttributesValue([PageScrollerAttributeField]);
        if (currentAttribute) {
            this.manager.updateAttributes([PageScrollerAttributeField], {
                ...currentAttribute,
                [this.appId]: this.crood.value,
            });
        } else {
            this.manager.safeSetAttributes({
                [PageScrollerAttributeField]: { [this.appId]: this.crood.value },
            });
        }
    }

    private getAttribute() {
        const currentAttribute = this.manager.getAttributesValue([PageScrollerAttributeField]);

        return currentAttribute?.[this.appId] || { x: 0, y: 0 };
    }

    private calcCoordToLocal(): InternalCoord {
        if (!this._scrollingElement) return { x: 0, y: 0 };

        const { x: CoordX, y: CoordY } = this.crood.value;

        console.log('onAppScrolling calcCoordToLocal', {CoordX, CoordY, baseScrollLeft: this.baseScrollLeft, baseScrollTop: this.baseScrollTop})
        const newLocalCoord = { x: 0, y: 0 };

        if (CoordX) {
            newLocalCoord.x = CoordX * this.baseScrollLeft;
        }

        if (CoordY) {
            newLocalCoord.y = CoordY * this.baseScrollTop;
        }

        return newLocalCoord;
    }

    private getLocalCoord(): InternalCoord {
        return {
            x: this._scrollingElement.scrollLeft,
            y: this._scrollingElement.scrollTop
        }
    }

    public calcLocalToCoord(position: ScrollCoord): InternalCoord {
        if (!this._scrollingElement) return { x: 0, y: 0 };

        const { x: CoordX, y: CoordY } = position;
        const newLocalCoord = { x: 0, y: 0 };

        if (CoordX) {
            newLocalCoord.x = Number((CoordX / this.baseScrollLeft).toFixed(2));
        }

        if (CoordY) {
            newLocalCoord.y = Number((CoordY / this.baseScrollTop).toFixed(2));
        }

        return newLocalCoord;
    }

    private scrollLeft(left: number) {
        this._scrollingElement.scrollTo({ left, behavior: "auto" });
    }

    private scrollTop(top: number) {
        this._scrollingElement.scrollTo({ top, behavior: "auto" });
    }

    public destroy(): void {
        this._sideEffect.flushAll();
        this.callbackManager.removeAll()
        this.sizeObserver.disconnect()
    }
}

export default ViewScroller;
