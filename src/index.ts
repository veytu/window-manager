import pRetry from "p-retry";
import { AppManager } from "./AppManager";
import { appRegister } from "./Register";
import { callbacks } from "./callback";
import { checkVersion, createInvisiblePlugin, setupWrapper } from "./Helper";
import { ContainerResizeObserver } from "./ContainerResizeObserver";
import { createBoxManager } from "./BoxManager";
import { CursorManager } from "./Cursor";
import { DEFAULT_CONTAINER_RATIO, Events, INIT_DIR, ROOT_DIR } from "./constants";
import { internalEmitter } from "./InternalEmitter";
import { Fields } from "./AttributesDelegate";
import { initDb } from "./Register/storage";
import {
    InvisiblePlugin,
    isPlayer,
    isRoom,
    RoomMember,
    RoomPhase,
    RoomState,
    ViewMode,
} from "white-web-sdk";
import { isEqual, isNull, isObject, omit, isNumber } from "lodash";
import { log } from "./Utils/log";
import { PageStateImpl } from "./PageState";
import { ReconnectRefresher } from "./ReconnectRefresher";
import { replaceRoomFunction } from "./Utils/RoomHacker";
import { setupBuiltin } from "./BuiltinApps";
import "video.js/dist/video-js.css";
import "./style.css";
import "@netless/telebox-insider/dist/style.css";
import {
    addEmitterOnceListener,
    ensureValidScenePath,
    entireScenes,
    isValidScenePath,
    putScenes,
    wait,
} from "./Utils/Common";
import type { TELE_BOX_STATE, BoxManager } from "./BoxManager";
import * as Errors from "./Utils/error";
import type { Apps, Position } from "./AttributesDelegate";
import {
    Displayer,
    SceneDefinition,
    View,
    Room,
    InvisiblePluginContext,
    Camera,
    AnimationMode,
    CameraBound,
    Point,
    Rectangle,
    CameraState,
    Player,
    ImageInformation,
    SceneState,
} from "white-web-sdk";
import type { AppListeners } from "./AppListener";
import type { ApplianceIcons, NetlessApp, RegisterParams } from "./typings";
import type { TeleBoxColorScheme, TeleBoxState } from "@netless/telebox-insider";
import type { AppProxy } from "./App";
import type { PublicEvent } from "./callback";
import type Emittery from "emittery";
import type { PageController, AddPageParams, PageState } from "./Page";
import { boxEmitter } from "./BoxEmitter";
import { IframeBridge } from "./View/IframeBridge";
import { setOptions } from "@netless/app-media-player";
import { ScrollerManager, ScrollerScrollEventType } from "./ScrollerManager";
import { isAndroid, isIOS } from "./Utils/environment";
export * from "./View/IframeBridge";

export type WindowMangerAttributes = {
    modelValue?: string;
    boxState: TELE_BOX_STATE;
    maximized?: boolean;
    minimized?: boolean;
    maximizedBoxes?: string;
    minimizedBoxes?: string;
    mainViewBackgroundImg?: string;
    mainViewBackgroundColor?: string;
    [key: string]: any;
};

export type apps = {
    [key: string]: NetlessApp;
};

export type AddAppOptions = {
    scenePath?: string;
    title?: string;
    scenes?: SceneDefinition[];
    hasHeader?: boolean;
};

export type setAppOptions = AddAppOptions & { appOptions?: any };

export type AddAppParams<TAttributes = any> = {
    kind: string;
    // app 地址(本地 app 不需要传)
    src?: string;
    // 窗口配置
    options?: AddAppOptions;
    // 初始化 attributes
    attributes?: TAttributes;
};

export type BaseInsertParams = {
    kind: string;
    // app 地址(本地 app 不需要传)
    src?: string;
    // 窗口配置
    options?: AddAppOptions;
    // 初始化 attributes
    attributes?: any;
    isDynamicPPT?: boolean;
};

export type AppSyncAttributes = {
    kind: string;
    src?: string;
    options: any;
    state?: any;
    isDynamicPPT?: boolean;
    fullPath?: string;
    createdAt?: number;
};

export type AppInitState = {
    id: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    focus?: boolean;
    maximized?: boolean;
    minimized?: boolean;
    maximizedBoxes?: string[];
    minimizedBoxes?: string[];
    sceneIndex?: number;
    boxState?: TeleBoxState; // 兼容旧版 telebox
    zIndex?: number;
};

export type CursorMovePayload = { uid: string; state?: "leave"; position: Position };

export type CursorOptions = {
    /**
     * If `"custom"`, it will render the pencil / eraser cursor as a circle and shapes cursor as a cross.
     *
     * @default "default"
     */
    style?: "default" | "custom";
};

export type MountParams = {
    room: Room | Player;
    container?: HTMLElement;
    /** 白板高宽比例, 默认为 9 / 16 */
    containerSizeRatio?: number;
    /** @deprecated 显示 PS 透明背景，默认 true */
    chessboard?: boolean;
    collectorContainer?: HTMLElement;
    collectorStyles?: Partial<CSSStyleDeclaration>;
    overwriteStyles?: string;
    cursor?: boolean;
    cursorOptions?: CursorOptions;
    debug?: boolean;
    disableCameraTransform?: boolean;
    prefersColorScheme?: TeleBoxColorScheme;
    applianceIcons?: ApplianceIcons;
    fullscreen?: boolean;
    polling?: boolean;
    supportAppliancePlugin?: boolean;
};

export const reconnectRefresher = new ReconnectRefresher({ emitter: internalEmitter });

export const mainViewField = "mainView";

export class WindowManager
    extends InvisiblePlugin<WindowMangerAttributes, any>
    implements PageController
{
    public static kind = "WindowManager";
    public static displayer: Displayer;
    public static originWrapper?: HTMLElement;
    public static wrapper?: HTMLElement;
    public static mainViewWrapper?: HTMLElement;
    public static mainViewWrapperShadow?: HTMLElement;
    public static sizer?: HTMLElement;
    public static playground?: HTMLElement;
    public static container?: HTMLElement;
    public static debug = false;
    public static containerSizeRatio = DEFAULT_CONTAINER_RATIO;
    public static supportAppliancePlugin?: boolean;
    public static isCreated = false;
    public static appReadonly: boolean = isAndroid() || isIOS();
    private static _resolve = (_manager: WindowManager) => void 0;
    private mutationObserver: MutationObserver | null = null;
    private observerPencil: MutationObserver | null = null

    private static extendWrapper?: HTMLElement;
    private static mainViewScrollWrapper?: HTMLElement;
    public version = __APP_VERSION__;
    public dependencies = __APP_DEPENDENCIES__;

    public appListeners?: AppListeners;

    public readonly?: boolean;
    public emitter: Emittery<PublicEvent> = callbacks;
    public appManager?: AppManager;
    public cursorManager?: CursorManager;
    public scrollerManager?: ScrollerManager;
    public viewMode = ViewMode.Broadcaster;
    public isReplay = isPlayer(this.displayer);
    private _pageState?: PageStateImpl;
    private _fullscreen?: boolean;
    private _cursorUIDs: string[] = [];
    private _cursorUIDsStyleDOM?: HTMLStyleElement;

    private boxManager?: BoxManager;
    private static params?: MountParams;

    private containerResizeObserver?: ContainerResizeObserver;
    public containerSizeRatio = WindowManager.containerSizeRatio;

    constructor(context: InvisiblePluginContext) {
        super(context);
        WindowManager.displayer = context.displayer;
        (window as any).NETLESS_DEPS = __APP_DEPENDENCIES__;
    }

    public static onCreate(manager: WindowManager) {
        WindowManager._resolve(manager);
    }

    public static async mount(params: MountParams): Promise<WindowManager> {
        const room = params.room;
        WindowManager.container = params.container;
        WindowManager.supportAppliancePlugin = params.supportAppliancePlugin;
        const containerSizeRatio = params.containerSizeRatio;
        const debug = params.debug;

        const cursor = params.cursor;
        WindowManager.params = params;
        WindowManager.displayer = params.room;
        checkVersion();
        let manager: WindowManager | undefined = undefined;
        if (isRoom(room)) {
            if (room.phase !== RoomPhase.Connected) {
                throw new Error("[WindowManager]: Room only Connected can be mount");
            }
            if (room.phase === RoomPhase.Connected && room.isWritable) {
                // redo undo 需要设置这个属性
                room.disableSerialization = false;
            }
            manager = await this.initManager(room);
        }
        if (WindowManager.isCreated) {
            throw new Error("[WindowManager]: Already created cannot be created again");
        }

        this.debug = Boolean(debug);
        if (this.debug) {
            setOptions({ verbose: true });
        }
        log("Already insert room", manager);

        if (isRoom(this.displayer)) {
            if (!manager) {
                throw new Error("[WindowManager]: init InvisiblePlugin failed");
            }
        } else {
            await pRetry(
                async count => {
                    manager = room.getInvisiblePlugin(WindowManager.kind) as WindowManager;
                    if (!manager) {
                        log(`manager is empty. retrying ${count}`);
                        throw new Error();
                    }
                },
                // 1s, 2s, 4s, 5s, 5s, 5s, 5s, 5s, 5s
                { retries: 10, maxTimeout: 5000 } as any
            );
        }

        if (!manager) {
            throw new Error("[WindowManager]: create manager failed");
        }

        if (containerSizeRatio) {
            WindowManager.containerSizeRatio = containerSizeRatio;
        }
        await manager.ensureAttributes();

        manager._fullscreen = params.fullscreen;
        manager.appManager = new AppManager(manager);
        manager.appManager.polling = params.polling || false;
        manager._pageState = new PageStateImpl(manager.appManager);
        manager.cursorManager = new CursorManager(
            manager.appManager,
            Boolean(cursor),
            params.cursorOptions,
            params.applianceIcons
        );
        manager.scrollerManager = new ScrollerManager({ manager });
        if (containerSizeRatio) {
            manager.containerSizeRatio = containerSizeRatio;
        }

        if (params.container) {
            manager.bindContainer(params.container);
        }

        replaceRoomFunction(room, manager);
        internalEmitter.emit("onCreated");
        WindowManager.isCreated = true;
        try {
            await initDb();
        } catch (error) {
            console.warn("[WindowManager]: indexedDB open failed");
            console.log(error);
        }

        manager?.room?.addMagixEventListener("onScaleChange", data => {
            manager?._setScale(data.payload);
        });

        manager?.room?.addMagixEventListener("onMainViewBackgroundImgChange", data => {
            manager?._setBackgroundImg(data.payload);
        });
        manager?.room?.addMagixEventListener("onMainViewBackgroundColorChange", data => {
            manager?._setBackgroundColor(data.payload);
        });

        manager?.room?.addMagixEventListener("onLaserPointerActiveChange", data => {
            manager?._setLaserPointer(data.payload);
        });
        manager?.room?.addMagixEventListener("onHidePencil", data => {
            manager?._setHidePencil(data.payload);
        });

        manager.room?.addMagixEventListener(ScrollerScrollEventType, data => {
            internalEmitter.emit(ScrollerScrollEventType, data.payload);
        });

        internalEmitter.on("playgroundSizeChange", () => {
            manager?._updateMainViewWrapperSize(
                manager.getAttributesValue("scale")[mainViewField],
                true
            );
        });

        setTimeout(() => {
            manager?._initAttribute();
        });

        setTimeout(() => {
            manager?.bindHidTeacherCursorListener();
        }, 1000);
        return manager;
    }

    private static initManager(room: Room): Promise<WindowManager | undefined> {
        return createInvisiblePlugin(room);
    }

    private static initContainer(
        manager: WindowManager,
        container: HTMLElement,
        params: {
            chessboard?: boolean;
            overwriteStyles?: string;
            fullscreen?: boolean;
        }
    ) {
        const { chessboard, overwriteStyles, fullscreen } = params;
        if (!WindowManager.container) {
            WindowManager.container = container;
        }
        const {
            playground,
            wrapper,
            sizer,
            mainViewElement,
            mainViewWrapperShadow,
            mainViewWrapper,
            extendWrapper,
            mainViewScrollWrapper,
        } = setupWrapper(container);
        WindowManager.playground = playground;
        if (chessboard) {
            sizer.classList.add("netless-window-manager-chess-sizer");
        }
        if (fullscreen) {
            sizer.classList.add("netless-window-manager-fullscreen");
        }
        if (overwriteStyles) {
            const style = document.createElement("style");
            style.textContent = overwriteStyles;
            playground.appendChild(style);
        }
        manager.containerResizeObserver = ContainerResizeObserver.create(
            playground,
            sizer,
            wrapper,
            internalEmitter
        );
        WindowManager.originWrapper = wrapper;
        WindowManager.wrapper = wrapper;
        WindowManager.sizer = sizer;
        WindowManager.mainViewWrapper = mainViewWrapper;
        WindowManager.extendWrapper = extendWrapper;
        WindowManager.mainViewScrollWrapper = mainViewScrollWrapper;
        WindowManager.mainViewWrapperShadow = mainViewWrapperShadow;

        WindowManager.mainViewScrollWrapper?.classList.toggle(
            "netless-window-manager-fancy-scrollbar-readonly",
            WindowManager.appReadonly
        );
        return mainViewElement;
    }

    public static get registered() {
        return appRegister.registered;
    }

    public bindContainer(container: HTMLElement) {
        if (isRoom(this.displayer) && this.room.phase !== RoomPhase.Connected) {
            throw new Errors.BindContainerRoomPhaseInvalidError();
        }
        if (WindowManager.isCreated && WindowManager.container) {
            if (WindowManager.container.firstChild) {
                container.appendChild(WindowManager.container.firstChild);
            }
        } else {
            if (WindowManager.params) {
                const params = WindowManager.params;
                const mainViewElement = WindowManager.initContainer(this, container, params);
                if (this.boxManager) {
                    this.boxManager.destroy();
                }
                const boxManager = createBoxManager(this, callbacks, internalEmitter, boxEmitter, {
                    collectorContainer: params.collectorContainer,
                    collectorStyles: params.collectorStyles,
                    prefersColorScheme: params.prefersColorScheme,
                });
                this.boxManager = boxManager;
                this.appManager?.setBoxManager(boxManager);
                if (WindowManager.mainViewScrollWrapper) {
                    this.scrollerManager?.add({
                        appId: mainViewField,
                        scrollElement: WindowManager.mainViewScrollWrapper,
                        manager: this,
                    });
                }
                this.bindMainView(mainViewElement, params.disableCameraTransform);
                if (WindowManager.wrapper) {
                    this.cursorManager?.setupWrapper(WindowManager.wrapper);
                }
            }
        }
        internalEmitter.emit("updateManagerRect");
        this.appManager?.refresh();
        this.appManager?.resetMaximized();
        this.appManager?.resetMinimized();
        this.appManager?.displayerWritableListener(!this.room.isWritable);
        WindowManager.container = container;
    }

    public bindCollectorContainer(container: HTMLElement) {
        if (WindowManager.isCreated && this.boxManager) {
            this.boxManager.setCollectorContainer(container);
        } else {
            if (WindowManager.params) {
                WindowManager.params.collectorContainer = container;
            }
        }
    }

    /**
     * 注册插件
     */
    public static register(params: RegisterParams<any, any, any>): Promise<void> {
        return appRegister.register(params);
    }

    /**
     * 注销插件
     */
    public static unregister(kind: string) {
        return appRegister.unregister(kind);
    }

    /**
     * 创建一个 app 至白板
     */
    public async addApp<T = any>(params: AddAppParams<T>): Promise<string | undefined> {
        if (this.appManager) {
            // 移除根目录时需要做一些异步的释放操作 addApp 需要等待释放完成才可以继续添加
            if (this.appManager.rootDirRemoving) {
                return new Promise((resolve, reject) => {
                    internalEmitter.once("rootDirRemoved").then(async () => {
                        try {
                            const appId = await this._addApp(params);
                            resolve(appId);
                        } catch (error) {
                            reject(error.message);
                        }
                    });
                });
            } else {
                return this._addApp(params);
            }
        } else {
            throw new Errors.AppManagerNotInitError();
        }
    }

    private async _addApp<T = any>(params: AddAppParams<T>): Promise<string | undefined> {
        if (this.appManager) {
            if (!params.kind || typeof params.kind !== "string") {
                throw new Errors.ParamsInvalidError();
            }
            if (params.src && typeof params.src === "string") {
                appRegister.register({ kind: params.kind, src: params.src });
            }
            const appImpl = await appRegister.appClasses.get(params.kind)?.();
            if (appImpl && appImpl.config?.singleton) {
                if (this.appManager.appProxies.has(params.kind)) {
                    throw new Errors.AppCreateError();
                }
            }
            const isDynamicPPT = this.setupScenePath(params, this.appManager);
            if (isDynamicPPT === undefined) {
                return;
            }
            if (params?.options?.scenePath) {
                params.options.scenePath = ensureValidScenePath(params.options.scenePath);
            }
            const appId = await this.appManager.addApp(params, Boolean(isDynamicPPT));
            return appId;
        } else {
            throw new Errors.AppManagerNotInitError();
        }
    }

    private setupScenePath(params: AddAppParams, appManager: AppManager): boolean | undefined {
        let isDynamicPPT = false;
        if (params.options) {
            const { scenePath, scenes } = params.options;
            if (scenePath) {
                if (!isValidScenePath(scenePath)) {
                    throw new Errors.InvalidScenePath();
                }
                const apps = Object.keys(this.apps || {});
                for (const appId of apps) {
                    const appScenePath = appManager.store.getAppScenePath(appId);
                    if (appScenePath && appScenePath === scenePath) {
                        console.warn(`[WindowManager]: ScenePath "${scenePath}" already opened`);
                        if (this.boxManager) {
                            const topBox = this.boxManager.getTopBox();
                            if (topBox) {
                                this.boxManager.setZIndex(appId, topBox.zIndex + 1, false);
                                this.boxManager.focusBox({ appId }, false);
                            }
                        }
                        return;
                    }
                }
            }
            if (scenePath && scenes && scenes.length > 0) {
                if (this.isDynamicPPT(scenes)) {
                    isDynamicPPT = true;
                    if (!entireScenes(this.displayer)[scenePath]) {
                        putScenes(this.room, scenePath, scenes);
                    }
                } else {
                    if (!entireScenes(this.displayer)[scenePath]) {
                        putScenes(this.room, scenePath, [{ name: scenes[0].name }]);
                    }
                }
            }
            if (scenePath && scenes === undefined) {
                putScenes(this.room, scenePath, [{}]);
            }
        }
        return isDynamicPPT;
    }

    /**
     * 设置 mainView 的 ScenePath, 并且切换白板为可写状态
     */
    public async setMainViewScenePath(scenePath: string): Promise<void> {
        if (this.appManager) {
            await this.appManager.setMainViewScenePath(scenePath);
        }
    }

    /**
     * 设置 mainView 的 SceneIndex, 并且切换白板为可写状态
     */
    public async setMainViewSceneIndex(index: number): Promise<void> {
        if (this.appManager) {
            await this.appManager.setMainViewSceneIndex(index);
        }
    }

    public async nextPage(): Promise<boolean> {
        if (this.appManager) {
            const nextIndex = this.mainViewSceneIndex + 1;
            if (nextIndex >= this.mainViewScenesLength) {
                console.warn(`[WindowManager]: current page is the last page`);
                return false;
            }
            await this.appManager.setMainViewSceneIndex(nextIndex);
            return true;
        } else {
            return false;
        }
    }

    public async prevPage(): Promise<boolean> {
        if (this.appManager) {
            const prevIndex = this.mainViewSceneIndex - 1;
            if (prevIndex < 0) {
                console.warn(`[WindowManager]: current page is the first page`);
                return false;
            }
            await this.appManager.setMainViewSceneIndex(prevIndex);
            return true;
        } else {
            return false;
        }
    }

    public async jumpPage(index: number): Promise<boolean> {
        if (this.appManager) {
            if (index < 0 || index >= this.pageState.length) {
                console.warn(`[WindowManager]: index ${index} out of range`);
                return false;
            }
            await this.appManager.setMainViewSceneIndex(index);
            return true;
        } else {
            return false;
        }
    }

    public async addPage(params?: AddPageParams): Promise<void> {
        if (this.appManager) {
            const after = params?.after;
            const scene = params?.scene;
            if (after) {
                const nextIndex = this.mainViewSceneIndex + 1;
                this.room.putScenes(ROOT_DIR, [scene || {}], nextIndex);
            } else {
                this.room.putScenes(ROOT_DIR, [scene || {}]);
            }
        }
    }

    /**
     * 删除一页
     * 默认删除当前页, 可以删除指定 index 页
     * 最低保留一页
     */
    public async removePage(index?: number): Promise<boolean> {
        if (this.appManager) {
            const needRemoveIndex = index === undefined ? this.pageState.index : index;
            if (this.pageState.length === 1) {
                console.warn(`[WindowManager]: can not remove the last page`);
                return false;
            }
            if (needRemoveIndex < 0 || needRemoveIndex >= this.pageState.length) {
                console.warn(`[WindowManager]: index ${index} out of range`);
                return false;
            }
            return this.appManager.removeSceneByIndex(needRemoveIndex);
        } else {
            return false;
        }
    }

    /**
     * 返回 mainView 的 ScenePath
     */
    public getMainViewScenePath(): string | undefined {
        return this.appManager?.store.getMainViewScenePath();
    }

    /**
     * 返回 mainView 的 SceneIndex
     */
    public getMainViewSceneIndex(): number {
        return this.appManager?.store.getMainViewSceneIndex();
    }

    /**
     * 设置所有 app 的 readonly 模式
     */
    public setReadonly(readonly: boolean): void {
        this.readonly = readonly;
        this.boxManager?.setReadonly(readonly);
        internalEmitter.emit("setReadonly", readonly);
    }

    /**
     * 切换 mainView 为可写
     */
    public switchMainViewToWriter(): Promise<void> | undefined {
        return this.appManager?.mainViewProxy.mainViewClickHandler();
    }

    /**
     * app destroy 回调
     */
    public onAppDestroy(kind: string, listener: (error: Error) => void): void {
        addEmitterOnceListener(`destroy-${kind}`, listener);
    }

    /**
     * app 本地自定义事件回调
     *
     * 返回一个用于撤销此监听的函数
     */
    public onAppEvent(
        kind: string,
        listener: (args: { kind: string; appId: string; type: string; value: any }) => void
    ): () => void {
        return internalEmitter.on(`custom-${kind}` as any, listener);
    }

    /**
     * 设置 ViewMode
     */
    public setViewMode(mode: ViewMode): void {
        if (mode === ViewMode.Broadcaster || mode === ViewMode.Follower) {
            if (this.canOperate && mode === ViewMode.Broadcaster) {
                this.appManager?.mainViewProxy.setCameraAndSize();
            }
            this.appManager?.mainViewProxy.start();
        }
        if (mode === ViewMode.Freedom) {
            this.appManager?.mainViewProxy.stop();
        }
        this.viewMode = mode;
        this.appManager?.mainViewProxy.setViewMode(mode);
    }

    public setBoxState(boxState: TeleBoxState): void {
        if (!this.canOperate) return;
        switch (boxState) {
            case "normal":
                this.setMaximized(false);
                this.setMinimized(false);
                break;
            case "maximized":
                this.setMaximized(true);
                this.setMinimized(false);
                break;
            case "minimized":
                this.setMinimized(true);
                break;
            default:
                break;
        }
    }

    public setMaximized(maximized: any): void {
        if (!this.canOperate) return;
        this.boxManager?.setMaximized(maximized, false);
    }

    public setMinimized(minimized: any): void {
        if (!this.canOperate) return;
        this.boxManager?.setMinimized(minimized, false);
    }

    public setFullscreen(fullscreen: boolean): void {
        if (this._fullscreen !== fullscreen) {
            this._fullscreen = fullscreen;
            WindowManager.sizer?.classList.toggle("netless-window-manager-fullscreen", fullscreen);
            callbacks.emit("fullscreenChange", fullscreen);
        }
    }

    public get cursorUIDs(): string[] {
        return this._cursorUIDs;
    }

    public setCursorUIDs(cursorUIDs?: string[] | null): void {
        this._cursorUIDs = cursorUIDs || [];
        if (this._cursorUIDs.length === 0) {
            this._cursorUIDsStyleDOM?.remove();
        } else {
            if (!this._cursorUIDsStyleDOM) {
                this._cursorUIDsStyleDOM = document.createElement("style");
            }
            WindowManager.playground?.appendChild(this._cursorUIDsStyleDOM);
            let style = "[data-cursor-uid] { display: none }";
            for (const uid of this._cursorUIDs) {
                style += `\n[data-cursor-uid="${uid}"] { display: flex }`;
            }
            this._cursorUIDsStyleDOM.textContent = style;
        }
    }

    public maximizedBoxNextPage() {
        const boxId = this.getTopMaxBoxId();

        if (!boxId) return false;

        const box = this.appManager?.appProxies.get(boxId);

        if (!box) return false;

        return box?.appContext?.nextPage();
    }

    public maximizedBoxPrevPage() {
        const boxId = this.getTopMaxBoxId();

        if (!boxId) return false;

        const box = this.appManager?.appProxies.get(boxId);

        if (!box) return false;

        return box?.appContext?.prevPage();
    }

    public getMaximizedBoxPageState() {
        const boxId = this.getTopMaxBoxId();

        if (!boxId) return undefined;

        const box = this.appManager?.appProxies.get(boxId);

        if (!box) return undefined;

        return box?.appContext?.pageState;
    }

    public getTopMaxBoxId() {
        const boxes = this.appManager?.boxManager?.teleBoxManager.maximizedBoxes.filter(
            box => !this.appManager?.boxManager?.teleBoxManager.minimizedBoxes.includes(box)
        );
        if (!boxes?.length) return undefined;
        return boxes.reduce((a, b) =>
            Number(this.appManager?.boxManager?.getBox(a)?._zIndex$?.value) >
            Number(this.appManager?.boxManager?.getBox(b)?._zIndex$?.value)
                ? a
                : b
        );
    }

    public get mainView(): View {
        if (this.appManager) {
            return this.appManager.mainViewProxy.view;
        } else {
            throw new Errors.AppManagerNotInitError();
        }
    }

    public get camera(): Camera {
        if (this.appManager) {
            return this.appManager.mainViewProxy.view.camera;
        } else {
            throw new Errors.AppManagerNotInitError();
        }
    }

    public get cameraState(): CameraState {
        if (this.appManager) {
            return this.appManager.mainViewProxy.cameraState;
        } else {
            throw new Errors.AppManagerNotInitError();
        }
    }

    public get apps(): Apps | undefined {
        return this.appManager?.store.apps();
    }

    public get boxState(): TeleBoxState | undefined {
        if (this.appManager) {
            return this.appManager.boxManager?.boxState;
        } else {
            throw new Errors.AppManagerNotInitError();
        }
    }

    public get darkMode(): boolean {
        return Boolean(this.appManager?.boxManager?.darkMode);
    }

    public get prefersColorScheme(): TeleBoxColorScheme | undefined {
        if (this.appManager) {
            return this.appManager.boxManager?.prefersColorScheme;
        } else {
            throw new Errors.AppManagerNotInitError();
        }
    }

    public get focused(): string | undefined {
        return this.attributes.focus;
    }

    public get focusedView(): View | undefined {
        return this.appManager?.focusApp?.view || this.mainView;
    }

    public get polling(): boolean {
        return this.appManager?.polling || false;
    }

    public set polling(b: boolean) {
        if (this.appManager) {
            this.appManager.polling = b;
        }
    }

    public get cursorStyle(): "default" | "custom" {
        return this.cursorManager?.style || "default";
    }

    public set cursorStyle(value: "default" | "custom") {
        if (!this.cursorManager) {
            throw new Error("[WindowManager]: cursor is not enabled, please set { cursor: true }.");
        }
        this.cursorManager.style = value;
    }

    public get mainViewSceneIndex(): number {
        return this._pageState?.index || 0;
    }

    public get mainViewSceneDir(): string {
        if (this.appManager) {
            return this.appManager?.getMainViewSceneDir();
        } else {
            throw new Errors.AppManagerNotInitError();
        }
    }

    public get topApp(): string | undefined {
        return this.boxManager?.getTopBox()?.id;
    }

    public get mainViewScenesLength(): number {
        return this._pageState?.length || 0;
    }

    public get canRedoSteps(): number {
        return this.focusedView?.canRedoSteps || 0;
    }

    public get canUndoSteps(): number {
        return this.focusedView?.canUndoSteps || 0;
    }

    public get sceneState(): SceneState {
        if (this.appManager) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return this.appManager.sceneState!;
        } else {
            throw new Errors.AppManagerNotInitError();
        }
    }

    public get pageState(): PageState {
        if (this._pageState) {
            return this._pageState.toObject();
        } else {
            throw new Errors.AppManagerNotInitError();
        }
    }

    public get fullscreen(): boolean {
        return Boolean(this._fullscreen);
    }

    public get extendWrapper() {
        return WindowManager.extendWrapper;
    }

    /**
     * 查询所有的 App
     */
    public queryAll(): AppProxy[] {
        return Array.from(this.appManager?.appProxies.values() || []);
    }

    /**
     * 查询单个 App
     */
    public queryOne(appId: string): AppProxy | undefined {
        return this.appManager?.appProxies.get(appId);
    }

    /**
     * 关闭 APP
     */
    public async closeApp(appId: string): Promise<void> {
        return this.appManager?.closeApp(appId);
    }

    /**
     * 切换 focus 到指定的 app, 并且把这个 app 放到最前面
     */
    public focusApp(appId: string) {
        const box = this.boxManager?.getBox(appId);
        if (box) {
            this.boxManager?.focusBox({ appId }, false);
            // 1.0 版本这里会有正式的 api
            (this.boxManager?.teleBoxManager as any).makeBoxTop(box, false);
        }
    }

    public moveCamera(
        camera: Partial<Camera> & { animationMode?: AnimationMode | undefined }
    ): void {
        const pureCamera = omit(camera, ["animationMode"]);
        const mainViewCamera = { ...this.mainView.camera };
        if (isEqual({ ...mainViewCamera, ...pureCamera }, mainViewCamera)) return;
        this.mainView.moveCamera(camera);
        this.appManager?.dispatchInternalEvent(Events.MoveCamera, camera);
        setTimeout(() => {
            this.appManager?.mainViewProxy.setCameraAndSize();
        }, 500);
    }

    public moveCameraToContain(
        rectangle: Rectangle &
            Readonly<{
                animationMode?: AnimationMode;
            }>
    ): void {
        this.mainView.moveCameraToContain(rectangle);
        this.appManager?.dispatchInternalEvent(Events.MoveCameraToContain, rectangle);
        setTimeout(() => {
            this.appManager?.mainViewProxy.setCameraAndSize();
        }, 500);
    }

    public convertToPointInWorld(point: Point): Point {
        return this.mainView.convertToPointInWorld(point);
    }

    public setCameraBound(cameraBound: CameraBound): void {
        this.mainView.setCameraBound(cameraBound);
    }

    public override onDestroy(): void {
        this._destroy();
    }

    public override destroy(): void {
        this._destroy();
    }

    private _destroy() {
        this.containerResizeObserver?.disconnect();
        this.appManager?.destroy();
        this.cursorManager?.destroy();
        WindowManager.container = undefined;
        WindowManager.wrapper = undefined;
        WindowManager.sizer = undefined;
        WindowManager.isCreated = false;
        if (WindowManager.playground) {
            WindowManager.playground.parentNode?.removeChild(WindowManager.playground);
        }
        WindowManager.params = undefined;
        this._iframeBridge?.destroy();
        this._iframeBridge = undefined;
        log("Destroyed");
    }

    private bindMainView(divElement: HTMLDivElement, disableCameraTransform: boolean | undefined) {
        if (this.appManager) {
            this.appManager.bindMainView(divElement, Boolean(disableCameraTransform));
            this.cursorManager?.setMainViewDivElement(divElement);
        }
    }

    public get canOperate(): boolean {
        if (isRoom(this.displayer)) {
            return (
                (this.displayer as Room).isWritable &&
                (this.displayer as Room).phase === RoomPhase.Connected
            );
        } else {
            return false;
        }
    }

    public get room(): Room {
        return this.displayer as Room;
    }

    public get appReadonly() {
        return WindowManager.appReadonly;
    }

    public setAppReadonly(readonly: boolean): void {
        WindowManager.appReadonly = readonly;
    }

    public safeSetAttributes(attributes: any): void {
        if (this.canOperate) {
            this.room?.dispatchMagixEvent("Windowmanager_custom_attributes", attributes);
            this.setAttributes(attributes);
        }
    }

    public safeUpdateAttributes(keys: string[], value: any): void {
        if (this.canOperate) {
            this.room?.dispatchMagixEvent("Windowmanager_custom_attributes", { keys, value });
            this.updateAttributes(keys, value);
        }
    }

    public setPrefersColorScheme(scheme: TeleBoxColorScheme): void {
        this.appManager?.boxManager?.setPrefersColorScheme(scheme);
    }

    public cleanCurrentScene(): void {
        log("clean current scene");
        this.focusedView?.cleanCurrentScene();
    }

    public redo(): number {
        return this.focusedView?.redo() || 0;
    }

    public undo(): number {
        return this.focusedView?.undo() || 0;
    }

    public delete(): void {
        this.focusedView?.delete();
    }

    public copy(): void {
        this.focusedView?.copy();
    }

    public paste(): void {
        this.focusedView?.paste();
    }

    public duplicate(): void {
        this.focusedView?.duplicate();
    }

    public insertText(x: number, y: number, text: string | undefined): string {
        return this.focusedView?.insertText(x, y, text) || "";
    }

    public insertImage(info: ImageInformation): void {
        return this.focusedView?.insertImage(info);
    }

    public completeImageUpload(uuid: string, url: string): void {
        return this.focusedView?.completeImageUpload(uuid, url);
    }

    public lockImage(uuid: string, locked: boolean): void {
        return this.focusedView?.lockImage(uuid, locked);
    }

    public lockImages(locked: boolean): void {
        return this.focusedView?.lockImages(locked);
    }

    public refresh() {
        this._refresh();
        this.appManager?.dispatchInternalEvent(Events.Refresh);
    }

    /** @internal */
    public _refresh() {
        this.appManager?.mainViewProxy.rebind();
        if (WindowManager.container) {
            this.bindContainer(WindowManager.container);
        }
        this.appManager?.refresher.refresh();
    }

    public setContainerSizeRatio(ratio: number) {
        if (!isNumber(ratio) || !(ratio > 0)) {
            throw new Error(
                `[WindowManager]: updateContainerSizeRatio error, ratio must be a positive number. but got ${ratio}`
            );
        }
        WindowManager.containerSizeRatio = ratio;
        this.containerSizeRatio = ratio;
        internalEmitter.emit("containerSizeRatioUpdate", ratio);
    }

    public setScale(appId: string, scale: number): void {
        this.room.dispatchMagixEvent("onScaleChange", { appId, scale });
    }

    private _updateMainViewWrapperSize(scale?: number, skipEmit?: boolean) {
        const size = WindowManager.originWrapper?.getBoundingClientRect();

        if (!size) return false;
        const currentScale = scale ?? this.getAttributesValue("scale")[mainViewField];
        if (!WindowManager.mainViewWrapper || !WindowManager.mainViewWrapperShadow) return;

        if (!WindowManager.mainViewWrapper || !WindowManager.mainViewWrapperShadow) return;

        WindowManager.mainViewWrapper.style.width = `${size?.width * currentScale}px`;
        WindowManager.mainViewWrapper.style.height = `${size?.height * currentScale}px`;
        WindowManager.mainViewWrapperShadow.style.width = `${size?.width * currentScale}px`;
        WindowManager.mainViewWrapperShadow.style.height = `${size?.height * currentScale}px`;

        const skipUpdate = skipEmit || this.readonly || isIOS() || isAndroid();

        this.room.disableCameraTransform = true;

        internalEmitter.emit(
            "wrapperSizeChange",
            WindowManager.mainViewWrapper.getBoundingClientRect()
        );
    }

    private _setScale(data: { appId: string; scale: number }, skipEmit?: boolean): boolean {
        const { appId, scale } = data;
        if (!isNumber(scale)) return false;

        let newScale = scale;

        if (newScale < 1) {
            newScale = 1;
        }
        const skipUpdate =
            skipEmit || isAndroid() || isIOS() || WindowManager.appReadonly || this.readonly;

        if (!skipUpdate) {
            this.safeUpdateAttributes(["scale"], {
                ...this.getAttributesValue(["scale"]),
                [appId]: newScale,
            });
        }

        if (appId == mainViewField) {
            this._updateMainViewWrapperSize(newScale, skipEmit);
        } else {
            internalEmitter.emit("onScaleChange", { appId, scale: newScale });
        }

        this.scrollerManager?.moveToCenter(appId);

        return true;
    }

    public getScale(): Record<string, number> | undefined {
        return this.getAttributesValue(["scale"]);
    }

    public setTeacherInfo(data: { uid?: string; name?: string }) {
        this.safeSetAttributes({ teacher: data });
    }

    private get teacherInfo() {
        return this.getAttributesValue(["teacher"]) || {};
    }

    public setLaserPointer(active: boolean) {
        this.room.dispatchMagixEvent("onLaserPointerActiveChange", active);
        this.safeUpdateAttributes([Fields.LaserPointerActive], {
            active,
            uid: this.appManager?.uid,
        });
    }

    private _setLaserPointer(active: boolean) {
        // WindowManager.playground?.classList.toggle("is-cursor-laserPointer", active);
        if (!active) {
            this.mutationObserver?.disconnect();
            this.mutationObserver = null;
            return;
        }
        if (!this.mutationObserver) {
            if (!this.teacherInfo?.uid || !this.teacherInfo?.name) return;

            this.mutationObserver = new MutationObserver(mutationsList => {
                for (let mutation of mutationsList) {
                    if (mutation.type === "childList") {
                        const cursorImgs =
                            WindowManager.wrapper?.getElementsByClassName("cursor-pencil-offset");

                        const cursors = Array.prototype.slice.call(cursorImgs);

                        if (cursors) {
                            cursors.forEach((item: HTMLDivElement) => {
                                const nameNode = item.querySelector(".cursor-inner");
                                if (nameNode && this.teacherInfo?.name == nameNode.innerHTML) {
                                    const imgNode: HTMLImageElement | null =
                                        item.querySelector(".cursor-pencil-image") || item.querySelector('.cursor-arrow-image');

                                    if (imgNode) {
                                        imgNode.src =
                                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGZpbHRlciB4PSItMTIwJSIgeT0iLTEyMCUiIHdpZHRoPSIzNDAlIiBoZWlnaHQ9IjM0MCUiIGZpbHRlclVuaXRzPSJvYmplY3RCb3VuZGluZ0JveCIgaWQ9ImEiPjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjQiIGluPSJTb3VyY2VHcmFwaGljIi8+PC9maWx0ZXI+PC9kZWZzPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDkgOSkiIGZpbGw9IiNGRjAxMDAiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PGNpcmNsZSBmaWx0ZXI9InVybCgjYSkiIGN4PSI1IiBjeT0iNSIgcj0iNSIvPjxwYXRoIGQ9Ik01IDhhMyAzIDAgMSAwIDAtNiAzIDMgMCAwIDAgMCA2em0wLTEuNzE0YTEuMjg2IDEuMjg2IDAgMSAxIDAtMi41NzIgMS4yODYgMS4yODYgMCAwIDEgMCAyLjU3MnoiIGZpbGwtcnVsZT0ibm9uemVybyIvPjwvZz48L3N2Zz4=";
                                    }
                                }
                            });
                        }
                    }
                }
            });
            if (!WindowManager.wrapper) return;
            this.mutationObserver.observe(WindowManager.wrapper, {
                subtree: true,
                childList: true,
            });
        }
    }

    public setHidePencil(active: boolean) {
        this.room.dispatchMagixEvent("onHidePencil", active);
    }

    private _setHidePencil (active: boolean) {
        if (!active) {
            this.observerPencil?.disconnect();
            this.observerPencil = null;
            return;
        }
        if (!this.observerPencil) {
            if (!this.teacherInfo?.uid || !this.teacherInfo?.name) return;

            // this.observerPencil = new MutationObserver(mutationsList => {
            //     for (let mutation of mutationsList) {
            //         if (mutation.type === "childList") {
            //             const cursorImgs =
            //                 WindowManager.wrapper?.getElementsByClassName("cursor-pencil-offset");

            //             const cursors = Array.prototype.slice.call(cursorImgs);

            //             if (cursors) {
            //                 cursors.forEach((item: HTMLDivElement) => {
            //                     const nameNode = item.querySelector(".cursor-inner");
            //                     if (nameNode && this.teacherInfo?.name != nameNode.innerHTML) {
            //                         item.classList.add('force-none')
            //                     }
            //                 });
            //             }
            //         }
            //     }
            // });
            // if (!WindowManager.wrapper) return;
            // this.observerPencil.observe(WindowManager.wrapper, {
            //     subtree: true,
            //     childList: true,
            // });
        }
    }

    public get isLaserPointerActive() {
        return this.getAttributesValue([Fields.LaserPointerActive]) || false;
    }

    private bindHidTeacherCursorListener() {
        const targetNode = document.querySelector(".netless-window-manager-wrapper");
        const config = { childList: true, subtree: true };
        const callback = (mutationList: any) => {
            for (const mutation of mutationList) {
                if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                    const cursors = targetNode?.querySelectorAll(
                        ".netless-window-manager-cursor-mid"
                    );

                    cursors?.forEach(i => {
                        i.classList.add("force-none");
                        if (this.isLaserPointerActive) {
                            if (i.attributes.getNamedItem("data-cursor-uid")?.value === this.teacherInfo?.uid) {
                                i.classList.remove('force-none')
                                const img: HTMLImageElement | null = i.querySelector('.netless-window-manager-cursor-clicker-image') || i.querySelector('.netless-window-manager-cursor-selector-image') 

                                if (img) {
                                    img.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGZpbHRlciB4PSItMTIwJSIgeT0iLTEyMCUiIHdpZHRoPSIzNDAlIiBoZWlnaHQ9IjM0MCUiIGZpbHRlclVuaXRzPSJvYmplY3RCb3VuZGluZ0JveCIgaWQ9ImEiPjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjQiIGluPSJTb3VyY2VHcmFwaGljIi8+PC9maWx0ZXI+PC9kZWZzPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDkgOSkiIGZpbGw9IiNGRjAxMDAiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PGNpcmNsZSBmaWx0ZXI9InVybCgjYSkiIGN4PSI1IiBjeT0iNSIgcj0iNSIvPjxwYXRoIGQ9Ik01IDhhMyAzIDAgMSAwIDAtNiAzIDMgMCAwIDAgMCA2em0wLTEuNzE0YTEuMjg2IDEuMjg2IDAgMSAxIDAtMi41NzIgMS4yODYgMS4yODYgMCAwIDEgMCAyLjU3MnoiIGZpbGwtcnVsZT0ibm9uemVybyIvPjwvZz48L3N2Zz4=";
                                }
                            }
                        }
                    });
                }
            }
        };
        const observer = new MutationObserver(callback);
        observer.observe(targetNode as any, config);
    }

    public getAppScale(appId: string): number {
        return this.getAttributesValue(["scale"])[appId];
    }

    private isDynamicPPT(scenes: SceneDefinition[]) {
        const sceneSrc = scenes[0]?.ppt?.src;
        return sceneSrc?.startsWith("pptx://");
    }

    private async ensureAttributes() {
        if (isNull(this.attributes)) {
            await wait(50);
        }
        if (isObject(this.attributes)) {
            if (!this.attributes[Fields.Apps]) {
                this.safeSetAttributes({ [Fields.Apps]: {} });
            }
            if (!this.attributes[Fields.Cursors]) {
                this.safeSetAttributes({ [Fields.Cursors]: {} });
            }
            if (!this.attributes["_mainScenePath"]) {
                this.safeSetAttributes({ _mainScenePath: INIT_DIR });
            }
            if (!this.attributes["_mainSceneIndex"]) {
                this.safeSetAttributes({ _mainSceneIndex: 0 });
            }
            if (!this.attributes[Fields.Registered]) {
                this.safeSetAttributes({ [Fields.Registered]: {} });
            }
            if (!this.attributes[Fields.IframeBridge]) {
                this.safeSetAttributes({ [Fields.IframeBridge]: {} });
            }
            if (!this.attributes["mainViewBackgroundColor"]) {
                this.safeSetAttributes({ mainViewBackgroundColor: "" });
            }
            if (!this.attributes["mainViewBackgroundImg"]) {
                this.safeSetAttributes({ mainViewBackgroundImg: "" });
            }
            if (!this.attributes["scale"]) {
                if (WindowManager.appReadonly || this.readonly) {
                    return;
                }
                this.safeSetAttributes({
                    scale: {
                        [mainViewField]: 1,
                    },
                });
            }

            if (!this.attributes[Fields.LaserPointerActive]) {
                this.safeSetAttributes({ [Fields.LaserPointerActive]: { active: false, uid: "" } });
            }
        }
    }

    private _iframeBridge?: IframeBridge;
    public getIframeBridge() {
        if (!this.appManager) {
            throw new Error("[WindowManager]: should call getIframeBridge() after await mount()");
        }
        this._iframeBridge || (this._iframeBridge = new IframeBridge(this, this.appManager));
        return this._iframeBridge;
    }

    public getBackground(): { type: "img" | "color"; value: string | undefined } | undefined {
        if (!!this.attributes["mainViewBackgroundColor"]) {
            return {
                type: "color",
                value: this.attributes["mainViewBackgroundColor"],
            };
        }

        if (!!this.attributes["mainViewBackgroundImg"]) {
            return {
                type: "img",
                value: this.attributes["mainViewBackgroundImg"],
            };
        }

        return undefined;
    }

    public setBackgroundImg(src: string): void {
        this.room.dispatchMagixEvent("onMainViewBackgroundColorChange", "");
        this.room.dispatchMagixEvent("onMainViewBackgroundImgChange", src);
    }
    public setBackgroundColor(color: string): void {
        this.room.dispatchMagixEvent("onMainViewBackgroundImgChange", "");
        this.room.dispatchMagixEvent("onMainViewBackgroundColorChange", color);
    }
    private _setBackgroundColor(color: string): void {
        if (!WindowManager.mainViewWrapper) return;
        WindowManager.mainViewWrapper.style.backgroundColor = color;
        this.safeUpdateAttributes(["mainViewBackgroundColor"], color);
    }
    private _setBackgroundImg(src: string): void {
        if (!WindowManager.mainViewWrapper) return;
        WindowManager.mainViewWrapper.style.backgroundImage = `url(${src})`;
        this.safeUpdateAttributes(["mainViewBackgroundImg"], src);
    }

    private _initAttribute(): void {
        if (!!this.attributes["mainViewBackgroundImg"]) {
            this._setBackgroundImg(this.attributes["mainViewBackgroundImg"]);
        }

        if (!!this.attributes["mainViewBackgroundColor"]) {
            this._setBackgroundColor(this.attributes["mainViewBackgroundColor"]);
        }

        if (!!this.attributes["scale"]) {
            const scaleMap: Record<string, number> = this.attributes["scale"];
            Object.keys(scaleMap).forEach(item => {
                this._setScale({ appId: item, scale: scaleMap[item] }, true);
            });
        }

        if (!!this.attributes[Fields.LaserPointerActive]) {
            const { active } = this.attributes[Fields.LaserPointerActive];

            this._setLaserPointer(active);
        }
    }
}

setupBuiltin();

export * from "./typings";

export { BuiltinApps } from "./BuiltinApps";
export type { PublicEvent } from "./callback";
