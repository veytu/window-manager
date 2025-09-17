import { TELE_BOX_STATE, TeleBox } from "@netless/telebox-insider";
import { createSideEffectBinder, Val } from "value-enhancer";
import { SideEffectManager } from "side-effect-manager";

/**
 * 统一的 AllBoxStatusInfo 管理器
 * - 内部维护一份不可变思维的快照，所有变更返回新对象并同步到内部
 * - 提供清理/查询/设置等常用能力
 * - 支持 Observable 模式，外部可以监听状态变化
 */
export class AllBoxStatusInfoManager {
    /** 当前所有的盒子状态信息 - Observable */
    private _currentAllBoxStatusInfo$: Val<Record<string, TELE_BOX_STATE>, boolean>;
    /** 当前所有的盒子最后非最小化状态信息 - Observable */
    private _lastNotMinimizedBoxsStatus$: Val<Record<string, TELE_BOX_STATE>, boolean>;
    /** 副作用管理器 */
    private _sideEffect: SideEffectManager;

    constructor() {
        this._sideEffect = new SideEffectManager();
        const { createVal } = createSideEffectBinder(this._sideEffect as any);
        this._currentAllBoxStatusInfo$ = createVal<Record<string, TELE_BOX_STATE>>({});
        this._lastNotMinimizedBoxsStatus$ = createVal<Record<string, TELE_BOX_STATE>>({});
    }

    /** 获取当前盒子状态信息的 Observable */
    public get currentAllBoxStatusInfo$(): Val<Record<string, TELE_BOX_STATE>, boolean> {
        return this._currentAllBoxStatusInfo$;
    }

    /** 获取最后非最小化状态信息的 Observable */
    public get lastNotMinimizedBoxsStatus$(): Val<Record<string, TELE_BOX_STATE>, boolean> {
        return this._lastNotMinimizedBoxsStatus$;
    }


    /** 设置当前所有的盒子状态信息 */
    public setCurrentAllBoxStatusInfo(info: Record<string, TELE_BOX_STATE>, skipUpdate = false): void {
        this._currentAllBoxStatusInfo$.setValue({ ...info }, skipUpdate);
    }

    /** 根据盒子列表清理当前所有的盒子状态信息 */
    public resetCleanCurrentAllBoxStatusInfoFromBoxes(boxes: TeleBox[], skipUpdate = false): void {
        const allBoxIds = boxes.map((item) => item.id);
        const cleanedAllBoxStatusInfo = { ...(this.currentAllBoxStatusInfo$.value || {}) };
        Object.keys(cleanedAllBoxStatusInfo).forEach((boxId) => {
            if (!allBoxIds.includes(boxId)) {
                delete cleanedAllBoxStatusInfo[boxId];
            }
        });
        this._currentAllBoxStatusInfo$.setValue({ ...cleanedAllBoxStatusInfo }, skipUpdate);
    }
    /** 根据盒子列表清理当前所有的盒子最后非最小化状态信息 */
    public resetCleanLastNotMinimizedBoxsStatusFromBoxes(boxes: TeleBox[], skipUpdate = false): void {
        const allBoxIds = boxes.map((item) => item.id);
        const cleanedAllBoxStatusInfo = { ...(this.lastNotMinimizedBoxsStatus$.value || {}) };
        Object.keys(cleanedAllBoxStatusInfo).forEach((boxId) => {
            if (!allBoxIds.includes(boxId)) {
                delete cleanedAllBoxStatusInfo[boxId];
            }
        });
        this._currentAllBoxStatusInfo$.setValue({ ...cleanedAllBoxStatusInfo }, skipUpdate);
    }

    /** 设置当前所有的盒子最后非最小化状态信息 */
    public setLastNotMinimizedBoxsStatus(info: Record<string, TELE_BOX_STATE>, skipUpdate = false): void {
        this._lastNotMinimizedBoxsStatus$.setValue({ ...info }, skipUpdate);
    }
    /** 设置当前指定的盒子状态信息 */
    public setCurrentBoxState(boxId: string, state: TELE_BOX_STATE, skipUpdate = false): void {
        const currentInfo = this._currentAllBoxStatusInfo$.value;
        this._currentAllBoxStatusInfo$.setValue({ ...currentInfo, [boxId]: state }, skipUpdate);
    }
    /** 设置当前指定的盒子最后非最小化状态信息 */
    public setLastNotMinimizedBoxState(boxId: string, state: TELE_BOX_STATE, skipUpdate = false): void {
        const currentInfo = this._lastNotMinimizedBoxsStatus$.value;
        this._lastNotMinimizedBoxsStatus$.setValue({ ...currentInfo, [boxId]: state }, skipUpdate);
    }
    /** 删除当前指定的盒子状态信息 */
    public removeCurrentBoxState(boxId: string, skipUpdate = false): void {
        const currentInfo = this._currentAllBoxStatusInfo$.value;
        const newInfo = { ...currentInfo };
        delete newInfo[boxId];
        this._currentAllBoxStatusInfo$.setValue(newInfo, skipUpdate);
    }
    /** 删除当前指定的盒子最后非最小化状态信息 */
    public removeLastNotMinimizedBoxState(boxId: string, skipUpdate = false): void {
        const currentInfo = this._lastNotMinimizedBoxsStatus$.value;
        const newInfo = { ...currentInfo };
        delete newInfo[boxId];
        this._lastNotMinimizedBoxsStatus$.setValue(newInfo, skipUpdate);
    }
    /** 清除当前所有的盒子状态信息 */
    public clearCurrentAllBoxStatusInfo(skipUpdate = false): void {
        this._currentAllBoxStatusInfo$.setValue({}, skipUpdate);
    }
    /** 清除当前所有的盒子最后非最小化状态信息 */
    public clearLastNotMinimizedBoxsStatus(skipUpdate = false): void {
        this._lastNotMinimizedBoxsStatus$.setValue({}, skipUpdate);
    }
    /** 获取当前所有的盒子状态信息 */
    public getAllBoxStatusInfo(): Record<string, TELE_BOX_STATE> {
        return this._currentAllBoxStatusInfo$.value;
    }
    /**
     * 获取指定状态的盒子列表
     * @param type 状态类型
     * @returns 
     */
    public getBoxesList(type: TELE_BOX_STATE): string[] {
        return Object.entries(this._currentAllBoxStatusInfo$.value)
            .filter(([_, state]) => state === type)
            .map(([boxId]) => boxId);
    }
    /**
     * 是否存在最大化的盒子
     * @returns 是否存在最大化的盒子
     */
    public hasMaximizedBox(): boolean {
        return this.getBoxesList(TELE_BOX_STATE.Maximized).length > 0;
    }
    /**
     * 是否存在最小化的盒子
     * @returns 是否存在最小化的盒子
     */
    public hasMinimizedBox(): boolean {
        return this.getBoxesList(TELE_BOX_STATE.Minimized).length > 0;
    }
    /**
     * 是否存在正常的盒子
     * @returns 是否存在正常的盒子
     */
    public hasNormalBox(): boolean {
        return this.getBoxesList(TELE_BOX_STATE.Normal).length > 0;
    }
    /**
     * 获取最后非最小化状态的盒子列表
     * @returns 最后非最小化状态的盒子列表
     */
    public getLastNotMinimizedBoxsStatus(): Record<string, TELE_BOX_STATE> {
        return this._lastNotMinimizedBoxsStatus$.value;
    }
    /**
     * 获取TeleBox标题栏状态
     * @returns TeleBox标题栏状态
     */
    public getTeleBoxTitleBarState(): TELE_BOX_STATE {
        return this.getBoxesList(TELE_BOX_STATE.Maximized).length > 0 ? TELE_BOX_STATE.Maximized : TELE_BOX_STATE.Normal;
    }

    /**
     * 根据盒子列表设置当前盒子状态（用于 TeleBoxManager 中的调用）
     * @param boxes 盒子列表
     */
    public setCurrentBoxStateFromBoxes(boxes: any[]): void {
        const newStatus: Record<string, TELE_BOX_STATE> = {};
        boxes.forEach((box) => {
            if (box.id) {
                // 根据盒子的状态设置对应的状态
                if (box.isMaximized) {
                    newStatus[box.id] = TELE_BOX_STATE.Maximized;
                } else if (box.isMinimized) {
                    newStatus[box.id] = TELE_BOX_STATE.Minimized;
                } else {
                    newStatus[box.id] = TELE_BOX_STATE.Normal;
                }
            }
        });
        this.setCurrentAllBoxStatusInfo(newStatus);
    }

    /**
     * 获取管理器实例（用于兼容现有代码）
     * @returns 管理器实例
     */
    public get(): AllBoxStatusInfoManager {
        return this;
    }

    /**
     * 销毁管理器，清理所有副作用
     */
    public destroy(): void {
        this._sideEffect.flushAll();
    }
}


