import { createSideEffectBinder, withValueEnhancer, Val } from "value-enhancer";
import { SideEffectManager } from "side-effect-manager";
import { WindowManager } from "..";
import { type CallbackManager, createCallbackManager } from "../Utils/callbacks";
import { ScrollerScrollEventType } from "../ScrollerManager";
import { debounce, isNumber } from "lodash";

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

const isValidNumber = (num: any) => {
    return isNumber(num) && !Number.isNaN(num)
}
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

    private updateSize = () => {
        this.baseScrollTop =
            this._scrollingElement.scrollHeight - this._scrollingElement.clientHeight;
        this.baseScrollLeft =
            this._scrollingElement.scrollWidth - this._scrollingElement.clientWidth;
        this.scroll()
    }

    private onScroll() {
        console.log('window manager scroll readonly', this.manager.readonly || WindowManager.appReadonly)
        if (this.manager.readonly || WindowManager.appReadonly) return
        const {x, y} = this.calcLocalToCoord(this.getLocalCoord())

        this.dispatchScrollEvent({x, y})
    }

    private dispatchScrollEvent = debounce(({x, y}: {x: number, y: number}) => {
        this.manager.room?.dispatchMagixEvent(ScrollerScrollEventType, {appId: this.appId, x, y})
    }, 200)

    private scroll(): void {
        if (!this._scrollingElement) return;
        const { x: left, y: top } = this.calcCoordToLocal();

        this._scrollingElement.scrollTo({ left, top, behavior: "instant"});
    }

    public setCoord(position: ScrollCoord): void {
        this.crood.setValue({
            x: isValidNumber(position.x) ? position.x! : this.crood.value.x,
            y: isValidNumber(position.y) ? position.y! : this.crood.value.y
        });
        this.setAttribute();
    }

    private setAttribute() {
        console.log('window manager scroll readonly', this.manager.readonly || WindowManager.appReadonly)
        if (WindowManager.appReadonly || this.manager.readonly) return;

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

        const newLocalCoord = { x: CoordX * this.baseScrollLeft, y: CoordY * this.baseScrollTop };

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

        if (isValidNumber(CoordX)) {
            newLocalCoord.x = Number((CoordX! / this.baseScrollLeft).toFixed(2));
        }

        if (isValidNumber(CoordY)) {
            newLocalCoord.y = Number((CoordY! / this.baseScrollTop).toFixed(2));
        }

        return newLocalCoord;
    }

    public destroy(): void {
        this._sideEffect.flushAll();
        this.callbackManager.removeAll()
        this.sizeObserver.disconnect()
    }
}

export default ViewScroller;
