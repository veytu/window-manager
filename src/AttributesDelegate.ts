import { AppAttributes } from "./constants";
import { get, isObject, pick } from "lodash";
import { setViewFocusScenePath } from "./Utils/Common";
import { logFirstTag, type AddAppParams, type AppSyncAttributes } from "./index";
import type { Camera, Size, View } from "white-web-sdk";
import type { Cursor } from "./Cursor/Cursor";
import { TELE_BOX_STATE } from "./BoxManager";
import type { TELE_BOX_NOT_MINIMIZED_STATE } from "./BoxManager";

export enum Fields {
    Apps = "apps",
    Focus = "focus",
    State = "state",
    BoxState = "boxState",
    MainViewCamera = "mainViewCamera",
    MainViewSize = "mainViewSize",
    Broadcaster = "broadcaster",
    Cursors = "cursors",
    Position = "position",
    CursorState = "cursorState",
    FullPath = "fullPath",
    Registered = "registered",
    IframeBridge = "iframeBridge",
    // 移动到自定义的内部
    LaserPointerActive = 'laserPointerActive',
    AllBoxStatusInfo = "allBoxStatusInfo",//全部的Box状态信息
    LastNotMinimizedBoxsStatus = "lastNotMinimizedBoxsStatus",//上一次最小化的Box状态信息
    ViewScrollChange = 'viewScrollChange',//视图移动
    MainViewBackgroundInfo = 'mainViewBackgroundInfo',//背景信息，分为图片和颜色{img:url,color:string}
    Scale = 'Scale',//缩放调整
}

export type Apps = {
    [key: string]: AppSyncAttributes;
};

export type Position = {
    x: number;
    y: number;
    type: PositionType;
    id?: string;
};

export type PositionType = "main" | "app";

export type StoreContext = {
    getAttributes: () => any;
    safeUpdateAttributes: (keys: string[], value: any) => void;
    safeSetAttributes: (attributes: any) => void;
};

export type ICamera = Camera & { id: string };

export type ISize = Size & { id: string };

export class AttributesDelegate {
    constructor(private context: StoreContext) {}

    public setContext(context: StoreContext) {
        this.context = context;
    }

    public get attributes() {
        return this.context.getAttributes();
    }

    public apps(): Apps {
        return get(this.attributes, [Fields.Apps]);
    }

    public get focus(): string | undefined {
        return get(this.attributes, [Fields.Focus]);
    }

    public getAppAttributes(id: string): AppSyncAttributes {
        return get(this.apps(), [id]);
    }

    public getAppState(id: string) {
        return get(this.apps(), [id, Fields.State]);
    }

    public getMaximized(): string[] {
        const allBoxStatusInfo = this.getAllBoxStatusInfo()
        if (!allBoxStatusInfo) return []
        return Object.entries(allBoxStatusInfo)
            .filter(([_, state]) => state === TELE_BOX_STATE.Maximized)
            .map(([boxId, _]) => boxId)
    }

    public getMinimized(): string[] {
        const allBoxStatusInfo = this.getAllBoxStatusInfo()
        if (!allBoxStatusInfo) return []
        return Object.entries(allBoxStatusInfo)
            .filter(([_, state]) => state === TELE_BOX_STATE.Minimized)
            .map(([boxId, _]) => boxId)
    }

    public setAllBoxStatusInfo(allBoxStatusInfo: Record<string, TELE_BOX_STATE> | undefined) {
        console.log('[TeleBox] AttributesDelegate - setAllBoxStatusInfo', allBoxStatusInfo)
        this.context.safeSetAttributes({ [Fields.AllBoxStatusInfo]: allBoxStatusInfo });
    }
    public getAllBoxStatusInfo(): Record<string, TELE_BOX_STATE> | undefined {
        return get(this.attributes, [Fields.AllBoxStatusInfo]);
    }

    public setBoxStatusInfo(id: string, status: TELE_BOX_STATE | undefined) {
        this.context.safeUpdateAttributes([Fields.AllBoxStatusInfo, id], status);
    }

    public getBoxStatusInfo(id: string): TELE_BOX_STATE | undefined {
        return get(this.attributes, [Fields.AllBoxStatusInfo, id]);
    }

    public getLastNotMinimizedBoxsStatus(): Record<string, TELE_BOX_STATE> | undefined {
        return get(this.attributes, [Fields.LastNotMinimizedBoxsStatus]);
    }

    public setLastNotMinimizedBoxsStatus(lastNotMinimizedBoxsStatus: Record<string, TELE_BOX_STATE> | undefined) {
        this.context.safeSetAttributes({ [Fields.LastNotMinimizedBoxsStatus]: lastNotMinimizedBoxsStatus });
    }

    public setViewScrollChange(data: {appId: string, x: number, y: number}) {
        console.log(`${logFirstTag} ViewScrollChange Set`, JSON.stringify(data))
        this.context.safeSetAttributes({ [Fields.ViewScrollChange]: data });
    }
    public getViewScrollChange(): {appId: string, x: number, y: number} | undefined {
        return get(this.attributes, [Fields.ViewScrollChange]);
    }

    public getLastNotMinimizedBoxStatus(id: string): TELE_BOX_NOT_MINIMIZED_STATE | undefined {
        return get(this.attributes, [Fields.LastNotMinimizedBoxsStatus, id]);
    }

    public setLastNotMinimizedBoxStatus(id: string, status: TELE_BOX_NOT_MINIMIZED_STATE | undefined) {
        this.context.safeUpdateAttributes([Fields.LastNotMinimizedBoxsStatus, id], status);
    }

    public setupAppAttributes(params: AddAppParams, id: string, isDynamicPPT: boolean) {
        const attributes = this.attributes;
        if (!attributes.apps) {
            this.context.safeSetAttributes({ apps: {} });
        }
        const attrNames = ["scenePath", "title"];
        if (!isDynamicPPT) {
            attrNames.push("scenes");
        }
        const options = pick(params.options, attrNames);
        const attrs: AppSyncAttributes = { kind: params.kind, options, isDynamicPPT };
        if (typeof params.src === "string") {
            attrs.src = params.src;
        }
        attrs.createdAt = Date.now();
        this.context.safeUpdateAttributes([Fields.Apps, id], attrs);
        this.context.safeUpdateAttributes([Fields.Apps, id, Fields.State], {
            [AppAttributes.Size]: {},
            [AppAttributes.Position]: {},
            [AppAttributes.SceneIndex]: 0,
        });
    }

    public updateAppState(appId: string, stateName: AppAttributes, state: any) {
        if (get(this.attributes, [Fields.Apps, appId, Fields.State])) {
            this.context.safeUpdateAttributes([Fields.Apps, appId, Fields.State, stateName], state);
        }
    }

    public cleanAppAttributes(id: string) {
        this.context.safeUpdateAttributes([Fields.Apps, id], undefined);
        this.context.safeSetAttributes({ [id]: undefined });
        const focus = this.attributes[Fields.Focus];
        if (focus === id) {
            this.cleanFocus();
        }
    }

    public cleanFocus() {
        this.context.safeSetAttributes({ [Fields.Focus]: undefined });
    }

    public getAppSceneIndex(id: string) {
        return this.getAppState(id)?.[AppAttributes.SceneIndex];
    }

    public getAppScenePath(id: string) {
        return this.getAppAttributes(id)?.options?.scenePath;
    }

    public getMainViewScenePath(): string | undefined {
        return this.attributes["_mainScenePath"];
    }

    public getMainViewSceneIndex() {
        return this.attributes["_mainSceneIndex"];
    }

    public getBoxState(): TELE_BOX_STATE {
        return this.attributes[Fields.BoxState];
    }

    public setMainViewScenePath(scenePath: string) {
        this.context.safeSetAttributes({ _mainScenePath: scenePath });
    }

    public setMainViewSceneIndex(index: number) {
        this.context.safeSetAttributes({ _mainSceneIndex: index });
    }

    public getMainViewCamera(): MainViewCamera {
        return get(this.attributes, [Fields.MainViewCamera]);
    }

    public getMainViewSize(): MainViewSize {
        return get(this.attributes, [Fields.MainViewSize]);
    }

    public setMainViewCamera(camera: ICamera) {
        this.context.safeSetAttributes({ [Fields.MainViewCamera]: { ...camera } });
    }

    public setMainViewSize(size: ISize) {
        if (size.width === 0 || size.height === 0) return;
        this.context.safeSetAttributes({ [Fields.MainViewSize]: { ...size } });
    }

    public setMainViewCameraAndSize(camera: ICamera, size: ISize) {
        if (size.width === 0 || size.height === 0) return;
        this.context.safeSetAttributes({
            [Fields.MainViewCamera]: { ...camera },
            [Fields.MainViewSize]: { ...size },
        });
    }

    public setAppFocus = (appId: string, focus: boolean) => {
        if (focus) {
            this.context.safeSetAttributes({ [Fields.Focus]: appId });
        } else {
            this.context.safeSetAttributes({ [Fields.Focus]: undefined });
        }
    };

    public updateCursor(uid: string, position: Position) {
        if (!get(this.attributes, [Fields.Cursors])) {
            this.context.safeUpdateAttributes([Fields.Cursors], {});
        }
        if (!get(this.attributes, [Fields.Cursors, uid])) {
            this.context.safeUpdateAttributes([Fields.Cursors, uid], {});
        }
        this.context.safeUpdateAttributes([Fields.Cursors, uid, Fields.Position], position);
    }

    public updateCursorState(uid: string, cursorState: string | undefined) {
        if (!get(this.attributes, [Fields.Cursors, uid])) {
            this.context.safeUpdateAttributes([Fields.Cursors, uid], {});
        }
        this.context.safeUpdateAttributes([Fields.Cursors, uid, Fields.CursorState], cursorState);
    }

    public getCursorState(uid: string) {
        return get(this.attributes, [Fields.Cursors, uid, Fields.CursorState]);
    }

    public cleanCursor(uid: string) {
        this.context.safeUpdateAttributes([Fields.Cursors, uid], undefined);
    }

    // TODO 状态中保存一个 SceneName 优化性能
    public setMainViewFocusPath(mainView: View) {
        const scenePath = this.getMainViewScenePath();
        if (scenePath) {
            setViewFocusScenePath(mainView, scenePath);
        }
    }

    public getIframeBridge() {
        return get(this.attributes, [Fields.IframeBridge]);
    }

    public setIframeBridge(data: any) {
        if (isObject(data)) {
            const oldState = this.getIframeBridge();
            for (const key in data) {
                const value = (data as any)[key];
                if (oldState[key] !== value) {
                    this.context.safeUpdateAttributes([Fields.IframeBridge, key], value);
                }
            }
        }
    }
}

export type MainViewSize = {
    id: string;
    width: number;
    height: number;
};

export type MainViewCamera = {
    id: string;
    centerX: number;
    centerY: number;
    scale: number;
};

export type Cursors = {
    [key: string]: Cursor;
};

export const store = new AttributesDelegate({
    getAttributes: () => {
        throw new Error("getAttributes not implemented");
    },
    safeSetAttributes: () => {
        throw new Error("safeSetAttributes not implemented");
    },
    safeUpdateAttributes: () => {
        throw new Error("safeUpdateAttributes not implemented");
    },
});
