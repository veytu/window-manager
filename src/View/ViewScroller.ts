import type { Val } from "value-enhancer";
import { createSideEffectBinder, withValueEnhancer } from "value-enhancer";
import { SideEffectManager } from "side-effect-manager";
import { logFirstTag, WindowManager } from "..";
import type { CallbackManager} from "../Utils/callbacks";
import { createCallbackManager } from "../Utils/callbacks";
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
    private baseScrollTop = 0;
    private baseScrollLeft = 0;
    protected sizeObserver: ResizeObserver
    protected callbackManager: CallbackManager
    private _isInternalUpdate = false;
    private _isRemoteSync = false; // 添加远端同步标志位

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
            // 添加标志位防止循环
            if (!this._isInternalUpdate) {
                this.scroll();
            }
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
        console.log('window manager scroll readonly', this.manager.readonly || true !== this.manager.wukongRoleManager?.wukongCanOperate())
        if (this.manager.readonly || true !== this.manager.wukongRoleManager?.wukongCanOperate()) return
        
        // 如果是内部更新触发的滚动，不处理
        if (this._isInternalUpdate) return;
        
        // 如果是远端同步触发的滚动，也不处理（避免循环）
        if (this._isRemoteSync) return;
        
        const {x, y} = this.calcLocalToCoord(this.getLocalCoord())

        this.dispatchScrollEvent({x, y})
    }

    private dispatchScrollEvent = debounce(({x, y}: {x: number, y: number}) => {
        console.log(`${logFirstTag} ViewScrollChange Dispatch Scroll Event`, {appId: this.appId, x, y})
        
        // 检查数据是否真的发生了变化
        const currentData = this.manager.appManager?.store?.getViewScrollChange();
        if (currentData && currentData.appId === this.appId && 
            Math.abs(currentData.x - x) < 0.01 && Math.abs(currentData.y - y) < 0.01) {
            console.log(`${logFirstTag} ViewScrollChange Skip - No significant change`);
            return;
        }
        
        // 更新数据（会自动同步到远端）
        this.manager.appManager?.store?.setViewScrollChange({ appId: this.appId, x, y })
    }, 200)

    private scroll(): void {
        if (!this._scrollingElement) return;
        const { x: left, y: top } = this.calcCoordToLocal();

        this._scrollingElement.scrollTo({ left, top, behavior: "instant"});
    }

    public setCoord(position: ScrollCoord): void {
        this._isInternalUpdate = true;
        console.log(`${logFirstTag} ViewScrollChange SetCoord`, JSON.stringify(position))
        try {
            this.crood.setValue({
                x: isValidNumber(position.x) ? position.x! : this.crood.value.x,
                y: isValidNumber(position.y) ? position.y! : this.crood.value.y
            });
        } finally {
            this._isInternalUpdate = false;
        }
    }

    // 添加远端同步方法
    public setCoordFromRemote(position: ScrollCoord): void {
        this._isRemoteSync = true;
        console.log(`${logFirstTag} ViewScrollChange SetCoordFromRemote`, JSON.stringify(position))
        try {
            this.crood.setValue({
                x: isValidNumber(position.x) ? position.x! : this.crood.value.x,
                y: isValidNumber(position.y) ? position.y! : this.crood.value.y
            });
        } finally {
            this._isRemoteSync = false;
        }
    }


    private getAttribute() {
        const currentAttribute = this.manager.appManager?.store?.getViewScrollChange() || { x: 0, y: 0 };
        return currentAttribute;
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
