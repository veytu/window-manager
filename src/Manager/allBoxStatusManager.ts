import { TELE_BOX_STATE } from "../BoxManager";

/** allBoxStatusInfo 结构：记录每个 box 的状态 */
export type AllBoxStatusInfo = Record<string, TELE_BOX_STATE>;

/**
 * 统一的 AllBoxStatusInfo 管理器
 * - 内部维护一份不可变思维的快照，所有变更返回新对象并同步到内部
 * - 提供清理/查询/设置等常用能力
 */
export class AllBoxStatusInfoManager {
    private info: AllBoxStatusInfo;

    constructor(initial?: AllBoxStatusInfo) {
        this.info = { ...(initial || {}) };
    }

    /** 获取当前快照（返回拷贝） */
    public getAll(): AllBoxStatusInfo {
        return { ...this.info };
    }

    /** 全量设置（可选传入 existingBoxIds 做一次清理后再设置） */
    public setAll(next: AllBoxStatusInfo | undefined, existingBoxIds?: string[]): AllBoxStatusInfo {
        const normalized = this.normalize(next);
        const cleaned = existingBoxIds ? this.clean(normalized, existingBoxIds) : normalized;
        this.info = { ...cleaned };
        return this.getAll();
    }

    /** 归一化 undefined → {} */
    public normalize(data: AllBoxStatusInfo | undefined): AllBoxStatusInfo {
        return { ...(data || {}) };
    }

    /** 根据现存 boxes 清理多余项（返回拷贝并同步内部状态） */
    public pruneRemovedBoxes(existingBoxIds: string[]): AllBoxStatusInfo {
        const cleaned = this.clean(this.info, existingBoxIds);
        this.info = { ...cleaned };
        return this.getAll();
    }

    /** 获取所有最小化的 boxId 列表 */
    public getMinimized(): string[] {
        return Object.entries(this.info)
            .filter(([_, state]) => state === TELE_BOX_STATE.Minimized)
            .map(([boxId]) => boxId);
    }

    /** 获取所有最大化的 boxId 列表 */
    public getMaximized(): string[] {
        return Object.entries(this.info)
            .filter(([_, state]) => state === TELE_BOX_STATE.Maximized)
            .map(([boxId]) => boxId);
    }

    /** 设置指定 box 的状态（返回新对象并同步内部） */
    public setBoxState(boxId: string, state: TELE_BOX_STATE): AllBoxStatusInfo {
        const next = { ...this.info };
        next[boxId] = state;
        this.info = next;
        return this.getAll();
    }

    /** 批量清除指定状态，将其置为 Normal（返回新对象并同步内部） */
    public clearState(targetState: TELE_BOX_STATE): AllBoxStatusInfo {
        const next = { ...this.info };
        Object.keys(next).forEach(boxId => {
            if (next[boxId] === targetState) next[boxId] = TELE_BOX_STATE.Normal;
        });
        this.info = next;
        return this.getAll();
    }

    /** 仅保留现存 boxes 的状态（纯函数，不修改内部，仅工具） */
    public clean(data: AllBoxStatusInfo | undefined, existingBoxIds: string[]): AllBoxStatusInfo {
        const info = data || {};
        const existingSet = new Set(existingBoxIds || []);
        const cleaned: AllBoxStatusInfo = {};
        Object.keys(info).forEach(boxId => {
            if (existingSet.has(boxId)) cleaned[boxId] = info[boxId];
        });
        return cleaned;
    }
}


