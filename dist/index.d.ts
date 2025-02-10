import * as lodash from 'lodash';
import * as white_web_sdk from 'white-web-sdk';
import { RoomMember, View, ApplianceNames, Camera, Size, SceneDefinition, SceneState, DisplayerState, ViewVisionMode, CameraState, Event as Event$1, Scope, EventPhase, MagixEventListenerOptions as MagixEventListenerOptions$1, toJS, listenUpdated, unlistenUpdated, listenDisposed, unlistenDisposed, Room, ViewMode, Displayer, MemberState, AnimationMode, InvisiblePlugin, InvisiblePluginContext, Player, Rectangle, Point, CameraBound, ImageInformation } from 'white-web-sdk';
export { AnimationMode, Displayer, Player, Room, SceneDefinition, SceneState, View } from 'white-web-sdk';
import Emittery from 'emittery';
import { TELE_BOX_STATE, TeleBoxRect, TeleBoxColorScheme, ReadonlyTeleBox, TeleBoxManager, TeleBoxManagerUpdateConfig, TeleBoxConfig, TeleBoxState } from '@netless/telebox-insider';
export { ReadonlyTeleBox, TeleBoxRect } from '@netless/telebox-insider';

declare enum Events {
    AppMove = "AppMove",
    AppFocus = "AppFocus",
    AppResize = "AppResize",
    AppBoxStateChange = "AppBoxStateChange",
    GetAttributes = "GetAttributes",
    UpdateWindowManagerWrapper = "UpdateWindowManagerWrapper",
    InitReplay = "InitReplay",
    WindowCreated = "WindowCreated",
    SetMainViewScenePath = "SetMainViewScenePath",
    SetMainViewSceneIndex = "SetMainViewSceneIndex",
    SetAppFocusIndex = "SetAppFocusIndex",
    SwitchViewsToFreedom = "SwitchViewsToFreedom",
    MoveCamera = "MoveCamera",
    MoveCameraToContain = "MoveCameraToContain",
    CursorMove = "CursorMove",
    RootDirRemoved = "RootDirRemoved",
    Refresh = "Refresh",
    InitMainViewCamera = "InitMainViewCamera"
}
declare enum AppAttributes {
    Size = "size",
    Position = "position",
    SceneIndex = "SceneIndex",
    ZIndex = "zIndex"
}
declare enum AppStatus {
    StartCreate = "StartCreate"
}

declare class CursorManager {
    private manager;
    private enableCursor;
    containerRect?: DOMRect;
    wrapperRect?: DOMRect;
    cursorInstances: Map<string, Cursor>;
    roomMembers?: readonly RoomMember[];
    userApplianceIcons: ApplianceIcons;
    private mainViewElement?;
    private sideEffectManager;
    private store;
    private leaveFlag;
    private _style;
    constructor(manager: AppManager, enableCursor: boolean, cursorOptions?: CursorOptions, applianceIcons?: ApplianceIcons);
    get applianceIcons(): ApplianceIcons;
    get style(): "default" | "custom";
    set style(value: "default" | "custom");
    private onCursorMove;
    private initCursorInstance;
    private enableCustomCursor;
    private canMoveCursor;
    setupWrapper(wrapper: HTMLElement): void;
    setMainViewDivElement(div: HTMLDivElement): void;
    get boxState(): any;
    get focusView(): View | undefined;
    private mouseMoveListener_;
    private mouseMoveTimer;
    private mouseMoveListener;
    private mouseLeaveListener;
    private showPencilEraserIfNeeded;
    private updateCursor;
    private getPoint;
    /**
     *  因为窗口内框在不同分辨率下的大小不一样，所以这里通过来鼠标事件的 target 来判断是在主白板还是在 APP 中
     */
    private getType;
    updateContainerRect(): void;
    deleteCursor(uid: string): void;
    hideCursor(uid: string): void;
    destroy(): void;
}

declare class Cursor {
    private manager;
    private memberId;
    private cursorManager;
    private wrapper?;
    private member?;
    private timer?;
    private component?;
    private style;
    constructor(manager: AppManager, memberId: string, cursorManager: CursorManager, wrapper?: HTMLElement | undefined);
    move: (position: Position) => void;
    setStyle: (style: typeof this.style) => void;
    leave: () => void;
    private moveCursor;
    get memberApplianceName(): ApplianceNames | undefined;
    get memberColor(): string;
    get memberColorHex(): string;
    private get payload();
    get memberCursorName(): any;
    private get memberTheme();
    private get memberCursorTextColor();
    private get memberCursorTagBackgroundColor();
    private get memberAvatar();
    private get memberOpacity();
    private get memberTagName();
    private autoHidden;
    private createCursor;
    private initProps;
    private getIcon;
    private isCustomIcon;
    updateMember(): RoomMember | undefined;
    private updateComponent;
    destroy(): void;
    hide(): void;
}

type Apps = {
    [key: string]: AppSyncAttributes;
};
type Position = {
    x: number;
    y: number;
    type: PositionType;
    id?: string;
};
type PositionType = "main" | "app";
type StoreContext = {
    getAttributes: () => any;
    safeUpdateAttributes: (keys: string[], value: any) => void;
    safeSetAttributes: (attributes: any) => void;
};
type ICamera = Camera & {
    id: string;
};
type ISize = Size & {
    id: string;
};
declare class AttributesDelegate {
    private context;
    constructor(context: StoreContext);
    setContext(context: StoreContext): void;
    get attributes(): any;
    apps(): Apps;
    get focus(): string | undefined;
    getAppAttributes(id: string): AppSyncAttributes;
    getAppState(id: string): any;
    getMaximized(): any;
    getMinimized(): any;
    setupAppAttributes(params: AddAppParams, id: string, isDynamicPPT: boolean): void;
    updateAppState(appId: string, stateName: AppAttributes, state: any): void;
    cleanAppAttributes(id: string): void;
    cleanFocus(): void;
    getAppSceneIndex(id: string): any;
    getAppScenePath(id: string): any;
    getMainViewScenePath(): string | undefined;
    getMainViewSceneIndex(): any;
    getBoxState(): any;
    setMainViewScenePath(scenePath: string): void;
    setMainViewSceneIndex(index: number): void;
    getMainViewCamera(): MainViewCamera;
    getMainViewSize(): MainViewSize;
    setMainViewCamera(camera: ICamera): void;
    setMainViewSize(size: ISize): void;
    setMainViewCameraAndSize(camera: ICamera, size: ISize): void;
    setAppFocus: (appId: string, focus: boolean) => void;
    updateCursor(uid: string, position: Position): void;
    updateCursorState(uid: string, cursorState: string | undefined): void;
    getCursorState(uid: string): any;
    cleanCursor(uid: string): void;
    setMainViewFocusPath(mainView: View): void;
    getIframeBridge(): any;
    setIframeBridge(data: any): void;
}
type MainViewSize = {
    id: string;
    width: number;
    height: number;
};
type MainViewCamera = {
    id: string;
    centerX: number;
    centerY: number;
    scale: number;
};

type StorageEventListener<T> = (event: T) => void;
declare class StorageEvent<TMessage> {
    listeners: Set<StorageEventListener<TMessage>>;
    get length(): number;
    dispatch(message: TMessage): void;
    addListener(listener: StorageEventListener<TMessage>): void;
    removeListener(listener: StorageEventListener<TMessage>): void;
}

type DiffOne<T> = {
    oldValue?: T;
    newValue?: T;
};
type Diff<T> = {
    [K in keyof T]?: DiffOne<T[K]>;
};
type StorageStateChangedEvent<TState = any> = Diff<TState>;
type StorageStateChangedListener<TState = any> = StorageEventListener<StorageStateChangedEvent<TState>>;
type StorageStateChangedListenerDisposer = () => void;

declare class Storage<TState extends Record<string, any> = any> implements Storage<TState> {
    readonly id: string | null;
    private readonly _context;
    private readonly _sideEffect;
    private _state;
    private _destroyed;
    private _refMap;
    /**
     * `setState` alters local state immediately before sending to server. This will cache the old value for onStateChanged diffing.
     */
    private _lastValue;
    constructor(context: AppContext, id?: string, defaultState?: TState);
    get state(): Readonly<TState>;
    readonly onStateChanged: StorageEvent<Diff<TState>>;
    addStateChangedListener(handler: StorageStateChangedListener<TState>): StorageStateChangedListenerDisposer;
    ensureState(state: Partial<TState>): void;
    setState(state: Partial<TState>): void;
    /**
     * Empty storage data.
     */
    emptyStorage(): void;
    /**
     * Delete storage index with all of its data and destroy the Storage instance.
     */
    deleteStorage(): void;
    get destroyed(): boolean;
    /**
     * Destroy the Storage instance. The data will be kept.
     */
    destroy(): void;
    private _getRawState;
    private _setRawState;
    private _updateProperties;
}

type BoxMovePayload = {
    appId: string;
    x: number;
    y: number;
};
type BoxFocusPayload = {
    appId: string;
};
type BoxResizePayload = {
    appId: string;
    width: number;
    height: number;
    x?: number;
    y?: number;
};
type BoxClosePayload = {
    appId: string;
    error?: Error;
};
type BoxStateChangePayload = {
    appId: string;
    state: TELE_BOX_STATE;
};
type BoxEvent = {
    move: BoxMovePayload;
    focus: BoxFocusPayload;
    resize: BoxResizePayload;
    close: BoxClosePayload;
    boxStateChange: BoxStateChangePayload;
};
type BoxEmitterType = Emittery<BoxEvent>;

type AddPageParams = {
    after?: boolean;
    scene?: SceneDefinition;
};
type PageState = {
    index: number;
    length: number;
};
interface PageController {
    nextPage: () => Promise<boolean>;
    prevPage: () => Promise<boolean>;
    jumpPage: (index: number) => Promise<boolean>;
    addPage: (params?: AddPageParams) => Promise<void>;
    removePage: (index: number) => Promise<boolean>;
    pageState: PageState;
}
interface PageRemoveService {
    removeSceneByIndex: (index: number) => Promise<boolean>;
    setSceneIndexWithoutSync: (index: number) => void;
}

declare const calculateNextIndex: (index: number, pageState: PageState) => number;

declare class AppCreateError extends Error {
    message: string;
}
declare class AppNotRegisterError extends Error {
    constructor(kind: string);
}
declare class AppManagerNotInitError extends Error {
    message: string;
}
declare class WhiteWebSDKInvalidError extends Error {
    constructor(version: string);
}
declare class ParamsInvalidError extends Error {
    message: string;
}
declare class BoxNotCreatedError extends Error {
    message: string;
}
declare class InvalidScenePath extends Error {
    message: string;
}
declare class BoxManagerNotFoundError extends Error {
    message: string;
}
declare class BindContainerRoomPhaseInvalidError extends Error {
    message: string;
}

interface NetlessApp<Attributes extends {} = any, MagixEventPayloads = any, AppOptions = any, SetupResult = any> {
    kind: string;
    config?: {
        /** Box width relative to whiteboard. 0~1. Default 0.5. */
        width?: number;
        /** Box height relative to whiteboard. 0~1. Default 0.5. */
        height?: number;
        /** Minimum box width relative to whiteboard. 0~1. Default 340 / 720. */
        minwidth?: number;
        /** Minimum box height relative to whiteboard. 0~1. Default 340 / 720. */
        minheight?: number;
        /** App only single instance. */
        singleton?: boolean;
    };
    setup: (context: AppContext<Attributes, MagixEventPayloads, AppOptions>) => SetupResult;
}
type AppEmitterEvent<T = any> = {
    /**
     *  before plugin destroyed
     */
    destroy: {
        error?: Error;
    };
    attributesUpdate: T | undefined;
    /**
     * room isWritable change or box blur
     */
    writableChange: boolean;
    sceneStateChange: SceneState;
    setBoxSize: {
        width: number;
        height: number;
    };
    setBoxMinSize: {
        minwidth: number;
        minheight: number;
    };
    setBoxTitle: {
        title: string;
    };
    containerRectUpdate: TeleBoxRect;
    roomStateChange: Partial<DisplayerState>;
    focus: boolean;
    reconnected: void;
    seek: number;
    pageStateChange: PageState;
    togglePreview: boolean;
};
type RegisterEventData = {
    appId: string;
};
type RegisterEvents<SetupResult = any> = {
    created: RegisterEventData & {
        result: SetupResult;
    };
    destroy: RegisterEventData;
    focus: RegisterEventData;
};
type RegisterParams<AppOptions = any, SetupResult = any, Attributes extends {} = any> = {
    kind: string;
    src: NetlessApp<Attributes, SetupResult> | string | (() => Promise<NetlessApp<Attributes, SetupResult>>) | (() => Promise<{
        default: NetlessApp<Attributes, SetupResult>;
    }>);
    appOptions?: AppOptions | (() => AppOptions);
    addHooks?: (emitter: Emittery<RegisterEvents<SetupResult>>) => void;
    /** dynamic load app package name */
    name?: string;
};
type AppListenerKeys = keyof AppEmitterEvent;
type ApplianceIcons = Partial<Record<`${ApplianceNames}` | string, string>>;

type AppPayload = {
    appId: string;
    view: View;
};

type LoadAppEvent = {
    kind: string;
    status: "start" | "success" | "failed";
    reason?: string;
};

type PublicEvent = {
    mainViewModeChange: ViewVisionMode;
    boxStateChange: `${TELE_BOX_STATE}`;
    darkModeChange: boolean;
    prefersColorSchemeChange: TeleBoxColorScheme;
    cameraStateChange: CameraState;
    mainViewScenePathChange: string;
    mainViewSceneIndexChange: number;
    focusedChange: string | undefined;
    mainViewScenesLengthChange: number;
    canRedoStepsChange: number;
    canUndoStepsChange: number;
    loadApp: LoadAppEvent;
    ready: undefined;
    sceneStateChange: SceneState;
    pageStateChange: PageState;
    fullscreenChange: boolean;
    appsChange: string[];
    onBoxMove: BoxMovePayload;
    onBoxResize: BoxResizePayload;
    onBoxFocus: BoxFocusPayload;
    onBoxClose: BoxClosePayload;
    onBoxStateChange: BoxStateChangePayload;
    onMainViewMounted: View;
    onMainViewRebind: View;
    onAppViewMounted: AppPayload;
    onAppSetup: string;
    onAppScenePathChange: AppPayload;
    appZIndexChange: {
        appId: string;
        box: ReadonlyTeleBox;
    };
    onMinimized: string;
    onMaximized: string;
};
type CallbacksType = Emittery<PublicEvent>;

type RemoveSceneParams = {
    scenePath: string;
    index?: number;
};
type EmitterEvent = {
    onCreated: undefined;
    InitReplay: AppInitState;
    error: Error;
    seekStart: undefined;
    seek: number;
    mainViewMounted: undefined;
    observerIdChange: number;
    boxStateChange: string;
    playgroundSizeChange: DOMRect;
    wrapperSizeChange: DOMRect;
    startReconnect: undefined;
    onReconnected: undefined;
    removeScenes: RemoveSceneParams;
    cursorMove: CursorMovePayload;
    updateManagerRect: undefined;
    focusedChange: {
        focused: string | undefined;
        prev: string | undefined;
    };
    rootDirRemoved: undefined;
    rootDirSceneRemoved: string;
    setReadonly: boolean;
    changePageState: undefined;
    writableChange: boolean;
    containerSizeRatioUpdate: number;
    onScaleChange: {
        appId: string;
        scale: number;
    };
    onBackgroundImgChange: string | undefined;
    windowMananerAppScrolling: {
        appId: string;
        x: number;
        y: number;
    };
};
type EmitterType = Emittery<EmitterEvent>;

type CreateBoxParams = {
    appId: string;
    app: NetlessApp;
    view?: View;
    emitter?: Emittery;
    options?: AddAppOptions;
    canOperate?: boolean;
    smartPosition?: boolean;
};
type AppId = {
    appId: string;
};
type MoveBoxParams = AppId & {
    x: number;
    y: number;
};
type ResizeBoxParams = AppId & {
    width: number;
    height: number;
    skipUpdate: boolean;
};
type SetBoxMinSizeParams = AppId & {
    minWidth: number;
    minHeight: number;
};
type SetBoxTitleParams = AppId & {
    title: string;
};
type CreateTeleBoxManagerConfig = {
    collectorContainer?: HTMLElement;
    collectorStyles?: Partial<CSSStyleDeclaration>;
    prefersColorScheme?: TeleBoxColorScheme;
};
type BoxManagerContext = {
    safeSetAttributes: (attributes: any) => void;
    getMainView: () => View;
    updateAppState: (appId: string, field: AppAttributes, value: any) => void;
    emitter: EmitterType;
    boxEmitter: BoxEmitterType;
    callbacks: CallbacksType;
    canOperate: () => boolean;
    notifyContainerRectUpdate: (rect: TeleBoxRect) => void;
    cleanFocus: () => void;
    setAppFocus: (appId: string) => void;
    manager: WindowManager;
};
declare class BoxManager {
    private context;
    private createTeleBoxManagerConfig?;
    teleBoxManager: TeleBoxManager;
    private readonly manager;
    constructor(context: BoxManagerContext, createTeleBoxManagerConfig?: CreateTeleBoxManagerConfig | undefined);
    private get mainView();
    private get canOperate();
    get boxState(): "minimized" | "maximized" | "normal";
    get maximized(): string[];
    get minimized(): string[];
    get darkMode(): boolean;
    get prefersColorScheme(): TeleBoxColorScheme;
    get boxSize(): number;
    private changeScale;
    createBox(params: CreateBoxParams): void;
    setBoxInitState(appId: string): void;
    setupBoxManager(createTeleBoxManagerConfig?: CreateTeleBoxManagerConfig): TeleBoxManager;
    setCollectorContainer(container: HTMLElement): void;
    getBox(appId: string): ReadonlyTeleBox | undefined;
    closeBox(appId: string, skipUpdate?: boolean): ReadonlyTeleBox | undefined;
    boxIsFocus(appId: string): boolean | undefined;
    getFocusBox(): ReadonlyTeleBox | undefined;
    getTopBox(): ReadonlyTeleBox | undefined;
    updateBoxState(state?: AppInitState): void;
    updateManagerRect(): void;
    moveBox({ appId, x, y }: MoveBoxParams): void;
    focusBox({ appId }: AppId, skipUpdate?: boolean): void;
    resizeBox({ appId, width, height, skipUpdate }: ResizeBoxParams): void;
    setBoxMinSize(params: SetBoxMinSizeParams): void;
    setBoxTitle(params: SetBoxTitleParams): void;
    blurAllBox(): void;
    updateAll(config: TeleBoxManagerUpdateConfig): void;
    setMaximized(maximized?: string, skipUpdate?: boolean): void;
    setMinimized(minimized?: string, skipUpdate?: boolean): void;
    focusTopBox(): void;
    updateBox(id: string, payload: TeleBoxConfig, skipUpdate?: boolean): void;
    setReadonly(readonly: boolean): void;
    setPrefersColorScheme(colorScheme: TeleBoxColorScheme): void;
    setZIndex(id: string, zIndex: number, skipUpdate?: boolean): void;
    destroy(): void;
}

interface MagixEventListenerOptions extends MagixEventListenerOptions$1 {
    /**
     * Rapid emitted callbacks will be slowed down to this interval (in ms).
     */
    fireInterval?: number;
    /**
     * If `true`, sent events will reach self-listeners after committed to server.
     * Otherwise the events will reach self-listeners immediately.
     */
    fireSelfEventAfterCommit?: boolean;
}
interface MagixEventMessage<TPayloads = any, TEvent extends MagixEventTypes<TPayloads> = MagixEventTypes<TPayloads>> extends Omit<Event$1, "scope" | "phase"> {
    /** Event name */
    event: TEvent;
    /** Event Payload */
    payload: TPayloads[TEvent];
    /** Whiteboard ID of the client who dispatched the event. It will be AdminObserverId for system events. */
    authorId: number;
    scope: `${Scope}`;
    phase: `${EventPhase}`;
}
type MagixEventTypes<TPayloads = any> = Extract<keyof TPayloads, string>;
type MagixEventDispatcher<TPayloads = any> = <TEvent extends MagixEventTypes<TPayloads> = MagixEventTypes<TPayloads>>(event: TEvent, payload: TPayloads[TEvent]) => void;
type MagixEventHandler<TPayloads = any, TEvent extends MagixEventTypes<TPayloads> = MagixEventTypes<TPayloads>> = (message: MagixEventMessage<TPayloads, TEvent>) => void;
type MagixEventListenerDisposer = () => void;
type MagixEventAddListener<TPayloads = any> = <TEvent extends MagixEventTypes<TPayloads> = MagixEventTypes<TPayloads>>(event: TEvent, handler: MagixEventHandler<TPayloads, TEvent>, options?: MagixEventListenerOptions | undefined) => MagixEventListenerDisposer;
type MagixEventRemoveListener<TPayloads = any> = <TEvent extends MagixEventTypes<TPayloads> = MagixEventTypes<TPayloads>>(event: TEvent, handler?: MagixEventHandler<TPayloads, TEvent>) => void;

declare class AppContext<TAttributes extends {} = any, TMagixEventPayloads = any, TAppOptions = any> implements PageController {
    private manager;
    private boxManager;
    appId: string;
    private appProxy;
    private appOptions?;
    readonly emitter: Emittery<AppEmitterEvent<TAttributes>>;
    readonly mobxUtils: {
        autorun: any;
        reaction: any;
        toJS: typeof toJS;
    };
    readonly objectUtils: {
        listenUpdated: typeof listenUpdated;
        unlistenUpdated: typeof unlistenUpdated;
        listenDisposed: typeof listenDisposed;
        unlistenDisposed: typeof unlistenDisposed;
    };
    private store;
    readonly isAddApp: boolean;
    readonly isReplay: boolean;
    constructor(manager: AppManager, boxManager: BoxManager, appId: string, appProxy: AppProxy, appOptions?: (TAppOptions | (() => TAppOptions)) | undefined);
    getDisplayer: () => white_web_sdk.Displayer<white_web_sdk.DisplayerCallbacks>;
    /** @deprecated Use context.storage.state instead. */
    getAttributes: () => TAttributes | undefined;
    getScenes: () => SceneDefinition[] | undefined;
    getView: () => View | undefined;
    mountView: (dom: HTMLElement) => void;
    getInitScenePath: () => string | undefined;
    /** Get App writable status. */
    getIsWritable: () => boolean;
    getIsAppReadonly: () => boolean;
    /** Get the App Window UI box. */
    getBox: () => ReadonlyTeleBox;
    getRoom: () => Room | undefined;
    /** @deprecated Use context.storage.setState instead. */
    setAttributes: (attributes: TAttributes) => void;
    /** @deprecated Use context.storage.setState instead. */
    updateAttributes: (keys: string[], value: any) => void;
    setScenePath: (scenePath: string) => Promise<void>;
    /** Get the local App options. */
    getAppOptions: () => TAppOptions | undefined;
    private _storage?;
    /** Main Storage for attributes. */
    get storage(): Storage<TAttributes>;
    /**
     * Create separated storages for flexible state management.
     * @param storeId Namespace for the storage. Storages of the same namespace share the same data.
     * @param defaultState Default state for initial storage creation.
     * @returns
     */
    createStorage: <TState extends {}>(storeId: string, defaultState?: TState) => Storage<TState>;
    /** Dispatch events to other clients (and self). */
    dispatchMagixEvent: MagixEventDispatcher<TMagixEventPayloads>;
    /** Listen to events from others clients (and self messages). */
    addMagixEventListener: MagixEventAddListener<TMagixEventPayloads>;
    /** Remove a Magix event listener. */
    removeMagixEventListener: MagixEventRemoveListener<TMagixEventPayloads>;
    /** PageController  */
    nextPage: () => Promise<boolean>;
    jumpPage: (index: number) => Promise<boolean>;
    prevPage: () => Promise<boolean>;
    addPage: (params?: AddPageParams) => Promise<void>;
    removePage: (index?: number) => Promise<boolean>;
    get pageState(): PageState;
    get kind(): string;
    /** Dispatch a local event to `manager.onAppEvent()`. */
    dispatchAppEvent(type: string, value?: any): void;
    get extendWrapper(): HTMLElement | undefined;
}

type AppEmitter = Emittery<AppEmitterEvent>;
declare class AppProxy implements PageRemoveService {
    private params;
    private manager;
    kind: string;
    id: string;
    scenePath?: string;
    appEmitter: AppEmitter;
    scenes?: SceneDefinition[];
    private appListener;
    private boxManager;
    private appProxies;
    private viewManager;
    private store;
    isAddApp: boolean;
    private status;
    private stateKey;
    private _pageState;
    private _prevFullPath;
    appResult?: NetlessApp<any>;
    appContext?: AppContext<any, any>;
    constructor(params: BaseInsertParams, manager: AppManager, appId: string, isAddApp: boolean);
    private initScenes;
    get view(): View | undefined;
    get viewIndex(): number | undefined;
    get isWritable(): boolean;
    get attributes(): any;
    get appAttributes(): AppSyncAttributes;
    getFullScenePath(): string | undefined;
    private getFullScenePathFromScenes;
    setFullPath(path: string): void;
    baseInsertApp(skipUpdate?: boolean): Promise<{
        appId: string;
        app: NetlessApp;
    }>;
    get box(): ReadonlyTeleBox | undefined;
    private setupApp;
    private fixMobileSize;
    private afterSetupApp;
    onSeek(time: number): Promise<void>;
    onReconnected(): Promise<void>;
    onRemoveScene(scenePath: string): Promise<void>;
    getAppInitState: (id: string) => AppInitState | undefined;
    emitAppSceneStateChange(sceneState: SceneState): void;
    emitAppIsWritableChange(): void;
    private makeAppEventListener;
    private appAttributesUpdateListener;
    private setFocusScenePathHandler;
    setScenePath(): void;
    setViewFocusScenePath(): string | undefined;
    private createView;
    notifyPageStateChange: lodash.DebouncedFunc<() => void>;
    get pageState(): PageState;
    removeSceneByIndex(index: number): Promise<boolean>;
    setSceneIndexWithoutSync(index: number): void;
    setSceneIndex(index: number): void;
    destroy(needCloseBox: boolean, cleanAttrs: boolean, skipUpdate: boolean, error?: Error): Promise<void>;
    close(): Promise<void>;
}

declare class MainViewProxy {
    private manager;
    /** Refresh the view's camera in an interval of 1.5s. */
    polling: boolean;
    private scale?;
    private started;
    private mainViewIsAddListener;
    private mainView;
    private store;
    private viewMode;
    private sideEffectManager;
    constructor(manager: AppManager);
    private syncCamera;
    private startListenWritableChange;
    ensureCameraAndSize(): void;
    get mainViewCamera(): MainViewCamera;
    get mainViewSize(): MainViewSize;
    private get didRelease();
    private moveCameraSizeByAttributes;
    start(): void;
    addCameraReaction: () => void;
    setCameraAndSize(): void;
    setMainViewCameraAndSize(camera: Camera & {
        id: string;
    }, size: Size & {
        id: string;
    }): void;
    private cameraReaction;
    sizeChangeHandler: lodash.DebouncedFunc<(size: Size) => void>;
    onUpdateContainerSizeRatio: () => void;
    get view(): View;
    get cameraState(): {
        width: number;
        height: number;
        centerX: number;
        centerY: number;
        scale: number;
    };
    createMainView(): View;
    onReconnect(): void;
    setFocusScenePath(path: string | undefined): View | undefined;
    rebind(): void;
    private onCameraUpdatedByDevice;
    addMainViewListener(): void;
    removeMainViewListener(): void;
    private mainViewClickListener;
    mainViewClickHandler(): Promise<void>;
    setMainViewSize: lodash.DebouncedFunc<(size: Size) => void>;
    private addCameraListener;
    private removeCameraListener;
    private _syncMainViewTimer;
    private onCameraOrSizeUpdated;
    private ensureMainViewSize;
    private syncMainView;
    moveCameraToContian(size: Size): void;
    moveCamera(camera: Camera): void;
    stop(): void;
    setViewMode: (mode: ViewMode) => void;
    destroy(): void;
}

declare class ViewManager {
    private displayer;
    views: Map<string, View>;
    constructor(displayer: Displayer);
    createView(id: string): View;
    getView(id: string): View | undefined;
    destroyView(id: string): void;
    setViewScenePath(id: string, scenePath: string): void;
    destroy(): void;
}

type ReconnectRefresherContext = {
    emitter: EmitterType;
};
declare class ReconnectRefresher {
    private ctx;
    private phase?;
    private room;
    private reactors;
    private disposers;
    constructor(ctx: ReconnectRefresherContext);
    setRoom(room: Room | undefined): void;
    setContext(ctx: ReconnectRefresherContext): void;
    private onPhaseChanged;
    private onReconnected;
    private _onReconnected;
    private releaseDisposers;
    refresh(): void;
    add(id: string, func: any): void;
    remove(id: string): void;
    hasReactor(id: string): boolean;
    destroy(): void;
}

declare class AppManager {
    windowManger: WindowManager;
    displayer: Displayer;
    viewManager: ViewManager;
    appProxies: Map<string, AppProxy>;
    appStatus: Map<string, AppStatus>;
    store: AttributesDelegate;
    mainViewProxy: MainViewProxy;
    refresher: ReconnectRefresher;
    isReplay: boolean;
    mainViewScenesLength: number;
    private appListeners;
    boxManager?: BoxManager;
    private _prevSceneIndex;
    private _prevFocused;
    private callbacksNode;
    private appCreateQueue;
    private sideEffectManager;
    sceneState: SceneState | null;
    rootDirRemoving: boolean;
    constructor(windowManger: WindowManager);
    getMemberState(): MemberState;
    private onRemoveScenes;
    /**
     * 根目录被删除时所有的 scene 都会被删除.
     * 所以需要关掉所有开启了 view 的 app
     */
    onRootDirRemoved(needClose?: boolean): Promise<void>;
    private onReadonlyChanged;
    private onPlayerSeekStart;
    private onPlayerSeekDone;
    createRootDirScenesCallback: () => void;
    removeSceneByIndex: (index: number) => Promise<boolean>;
    setSceneIndexWithoutSync: (index: number) => void;
    private onSceneChange;
    private emitMainViewScenesChange;
    private updateSceneState;
    private get eventName();
    get attributes(): WindowMangerAttributes;
    get canOperate(): boolean;
    get appReadonly(): boolean;
    get room(): Room | undefined;
    get isLaserPointerActive(): any;
    get mainView(): white_web_sdk.View;
    get polling(): boolean;
    set polling(b: boolean);
    get focusApp(): AppProxy | undefined;
    get extendWrapper(): HTMLElement | undefined;
    get uid(): string;
    getMainViewSceneDir(): string;
    private onCreated;
    private onBoxMove;
    private onBoxResize;
    private onBoxFocus;
    private onBoxClose;
    private onBoxStateChange;
    addAppsChangeListener: () => void;
    addAppCloseListener: () => void;
    private onMainViewIndexChange;
    private onFocusChange;
    attributesUpdateCallback: lodash.DebouncedFunc<(apps: any) => Promise<void>>;
    private _appIds;
    notifyAppsChange(appIds: string[]): void;
    /**
     * 插件更新 attributes 时的回调
     *
     * @param {*} attributes
     * @memberof WindowManager
     */
    _attributesUpdateCallback(apps: any): Promise<void>;
    private onRegisteredChange;
    private onMinimized;
    refresh(): void;
    setBoxManager(boxManager: BoxManager): void;
    resetMaximized(): void;
    resetMinimized(): void;
    private onAppDelete;
    private closeAll;
    bindMainView(divElement: HTMLDivElement, disableCameraTransform: boolean): void;
    setMainViewFocusPath(scenePath?: string): boolean | undefined;
    private resetScenePath;
    addApp(params: AddAppParams, isDynamicPPT: boolean): Promise<string | undefined>;
    private beforeAddApp;
    private afterAddApp;
    closeApp(appId: string, needClose?: boolean): Promise<void>;
    private baseInsertApp;
    private displayerStateListener;
    displayerWritableListener: (isReadonly: boolean) => void;
    safeSetAttributes(attributes: any): void;
    safeUpdateAttributes(keys: string[], value: any): void;
    setMainViewScenePath(scenePath: string): Promise<void>;
    private _setMainViewScenePath;
    private updateSceneIndex;
    setMainViewSceneIndex(index: number): Promise<void>;
    private dispatchSetMainViewScenePath;
    getAppInitPath(appId: string): string | undefined;
    safeDispatchMagixEvent(event: string, payload: any): void;
    focusByAttributes(apps: any): void;
    onReconnected(): Promise<void>;
    notifyContainerRectUpdate(rect: TeleBoxRect): void;
    updateRootDirRemoving: (removing: boolean) => void;
    dispatchInternalEvent(event: Events, payload?: any): void;
    destroy(): void;
}

declare class AppListeners {
    private manager;
    private displayer;
    constructor(manager: AppManager);
    private get boxManager();
    addListeners(): void;
    removeListeners(): void;
    private mainMagixEventListener;
    private appMoveHandler;
    private appResizeHandler;
    private boxStateChangeHandler;
    private setMainViewScenePathHandler;
    private moveCameraHandler;
    private moveCameraToContainHandler;
    private cursorMoveHandler;
    private rootDirRemovedHandler;
    private refreshHandler;
    private initMainViewCameraHandler;
    private setAppFocusViewIndexHandler;
}

declare enum IframeEvents {
    Init = "Init",
    AttributesUpdate = "AttributesUpdate",
    SetAttributes = "SetAttributes",
    RegisterMagixEvent = "RegisterMagixEvent",
    RemoveMagixEvent = "RemoveMagixEvent",
    RemoveAllMagixEvent = "RemoveAllMagixEvent",
    RoomStateChanged = "RoomStateChanged",
    DispatchMagixEvent = "DispatchMagixEvent",
    ReciveMagixEvent = "ReciveMagixEvent",
    NextPage = "NextPage",
    PrevPage = "PrevPage",
    SDKCreate = "SDKCreate",
    OnCreate = "OnCreate",
    SetPage = "SetPage",
    GetAttributes = "GetAttributes",
    Ready = "Ready",
    Destory = "Destory",
    StartCreate = "StartCreate",
    WrapperDidUpdate = "WrapperDidUpdate",
    DispayIframe = "DispayIframe",
    HideIframe = "HideIframe",
    GetRootRect = "GetRootRect",
    ReplayRootRect = "ReplayRootRect",
    PageTo = "PageTo"
}
declare enum DomEvents {
    WrapperDidMount = "WrapperDidMount",
    IframeLoad = "IframeLoad"
}
type IframeBridgeAttributes = {
    readonly url: string;
    readonly width: number;
    readonly height: number;
    readonly displaySceneDir: string;
    readonly lastEvent?: {
        name: string;
        payload: any;
    };
    readonly useClicker?: boolean;
    readonly useSelector?: boolean;
};
type IframeBridgeEvents = {
    created: undefined;
    [IframeEvents.Ready]: undefined;
    [IframeEvents.StartCreate]: undefined;
    [IframeEvents.OnCreate]: IframeBridge;
    [IframeEvents.Destory]: undefined;
    [IframeEvents.GetRootRect]: undefined;
    [IframeEvents.ReplayRootRect]: DOMRect;
    [DomEvents.WrapperDidMount]: undefined;
    [IframeEvents.WrapperDidUpdate]: undefined;
    [DomEvents.IframeLoad]: Event;
    [IframeEvents.HideIframe]: undefined;
    [IframeEvents.DispayIframe]: undefined;
};
type IframeSize = {
    readonly width: number;
    readonly height: number;
};
type BaseOption = {
    readonly url: string;
    readonly width: number;
    readonly height: number;
    readonly displaySceneDir: string;
};
type InsertOptions = {
    readonly useClicker?: boolean;
    readonly useSelector?: boolean;
} & BaseOption;
type OnCreateInsertOption = {
    readonly displayer: Displayer;
} & BaseOption;
/**
 * {@link https://github.com/netless-io/netless-iframe-bridge @netless/iframe-bridge}
 */
declare class IframeBridge {
    readonly manager: WindowManager;
    readonly appManager: AppManager;
    static readonly kind = "IframeBridge";
    static readonly hiddenClass = "netless-iframe-brdige-hidden";
    static emitter: Emittery<IframeBridgeEvents>;
    private static displayer;
    private static alreadyCreate;
    displayer: Displayer;
    iframe: HTMLIFrameElement;
    private readonly magixEventMap;
    private cssList;
    private allowAppliances;
    private bridgeDisposer;
    private rootRect;
    private sideEffectManager;
    constructor(manager: WindowManager, appManager: AppManager);
    static onCreate(plugin: IframeBridge): void;
    insert(options: InsertOptions): this;
    private getComputedIframeStyle;
    destroy(): void;
    private getIframe;
    setIframeSize(params: IframeSize): void;
    get attributes(): Partial<IframeBridgeAttributes>;
    setAttributes(data: Partial<IframeBridgeAttributes>): void;
    private _createIframe;
    scaleIframeToFit(animationMode?: AnimationMode): void;
    get isReplay(): boolean;
    private handleSetPage;
    private execListenIframe;
    private src_url_equal_anchor?;
    private listenIframe;
    private onPhaseChangedListener;
    private listenDisplayerState;
    private computedStyleAndIframeDisplay;
    private listenDisplayerCallbacks;
    private get callbackName();
    private stateChangeListener;
    private computedStyle;
    private computedIframeDisplay;
    computedZindex(): void;
    private updateStyle;
    private get iframeOrigin();
    private messageListener;
    private handleSDKCreate;
    private handleDispatchMagixEvent;
    private handleSetAttributes;
    private handleRegisterMagixEvent;
    private handleRemoveMagixEvent;
    private handleNextPage;
    private handlePrevPage;
    private handlePageTo;
    private handleRemoveAllMagixEvent;
    private handleGetAttributes;
    postMessage(message: any): void;
    dispatchMagixEvent(event: string, payload: any): void;
    private get currentIndex();
    private get currentPage();
    private get totalPage();
    private get readonly();
    get inDisplaySceneDir(): boolean;
    private isClicker;
    private get isDisableInput();
}

declare type SideEffectDisposer = () => void;
declare class SideEffectManager {
    /**
     * Add a side effect.
     * @param executor execute side effect
     * @param disposerID Optional id for the disposer
     * @returns disposerID
     */
    add(executor: () => SideEffectDisposer, disposerID?: string): string;
    /**
     * Add a disposer directly.
     * @param disposer a disposer
     * @param disposerID Optional id for the disposer
     * @returns disposerID
     */
    addDisposer(disposer: SideEffectDisposer, disposerID?: string): string;
    /**
     * Sugar for addEventListener.
     * @param el
     * @param type
     * @param listener
     * @param options
     * @param disposerID Optional id for the disposer
     * @returns disposerID
     */
    addEventListener<K extends keyof WindowEventMap>(el: Window, type: K, listener: (this: Window, ev: WindowEventMap[K]) => unknown, options?: boolean | AddEventListenerOptions, disposerID?: string): string;
    addEventListener<K extends keyof DocumentEventMap>(el: Document, type: K, listener: (this: Document, ev: DocumentEventMap[K]) => unknown, options?: boolean | AddEventListenerOptions, disposerID?: string): string;
    addEventListener<K extends keyof HTMLElementEventMap>(el: HTMLElement, type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => unknown, options?: boolean | AddEventListenerOptions, disposerID?: string): string;
    /**
     * Sugar for setTimeout.
     * @param handler
     * @param timeout
     * @param disposerID Optional id for the disposer
     * @returns disposerID
     */
    setTimeout(handler: () => void, timeout: number, disposerID?: string): string;
    /**
     * Sugar for setInterval.
     * @param handler
     * @param timeout
     * @param disposerID Optional id for the disposer
     * @returns disposerID
     */
    setInterval(handler: () => void, timeout: number, disposerID?: string): string;
    /**
     * Remove but not run the disposer. Do nothing if not found.
     * @param disposerID
     */
    remove(disposerID: string): SideEffectDisposer | undefined;
    /**
     * Remove and run the disposer. Do nothing if not found.
     * @param disposerID
     */
    flush(disposerID: string): void;
    /**
     * Remove and run all of the disposers.
     */
    flushAll(): void;
    /**
     * All disposers. Use this only when you know what you are doing.
     */
    readonly disposers: Map<string, SideEffectDisposer>;
}

type CallbackManager = any;

type ViewScrollerConfig = {
    appId: string;
    manager: WindowManager;
    scrollElement: HTMLDivElement | HTMLElement;
};
type ScrollCoord = {
    x?: number;
    y?: number;
};
type InternalCoord = {
    x: number;
    y: number;
};
declare class ViewScroller {
    readonly appId: string;
    private readonly _scrollingElement;
    private readonly manager;
    private crood;
    protected _sideEffect: SideEffectManager;
    private baseScrollTop;
    private baseScrollLeft;
    protected sizeObserver: ResizeObserver;
    protected callbackManager: CallbackManager;
    constructor(config: ViewScrollerConfig);
    private updateSize;
    private onScroll;
    private dispatchScrollEvent;
    private scroll;
    setCoord(position: ScrollCoord): void;
    private setAttribute;
    private getAttribute;
    private calcCoordToLocal;
    private getLocalCoord;
    calcLocalToCoord(position: ScrollCoord): InternalCoord;
    destroy(): void;
}

declare class ScrollerManager {
    private readonly manager;
    private scrollers;
    constructor({ manager }: {
        manager: WindowManager;
    });
    private onAppScrolling;
    add(config: ViewScrollerConfig): void;
    scrollTo(appId: string, position: ScrollCoord): void;
    moveToCenter(appId?: string): void;
    getScroller(appId: string): ViewScroller | undefined;
    remove(appId: string): void;
}

declare const BuiltinApps: {
    DocsViewer: string;
    MediaPlayer: string;
    Plyr: string;
};

type WindowMangerAttributes = {
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
type apps = {
    [key: string]: NetlessApp;
};
type AddAppOptions = {
    scenePath?: string;
    title?: string;
    scenes?: SceneDefinition[];
    hasHeader?: boolean;
};
type setAppOptions = AddAppOptions & {
    appOptions?: any;
};
type AddAppParams<TAttributes = any> = {
    kind: string;
    src?: string;
    options?: AddAppOptions;
    attributes?: TAttributes;
};
type BaseInsertParams = {
    kind: string;
    src?: string;
    options?: AddAppOptions;
    attributes?: any;
    isDynamicPPT?: boolean;
};
type AppSyncAttributes = {
    kind: string;
    src?: string;
    options: any;
    state?: any;
    isDynamicPPT?: boolean;
    fullPath?: string;
    createdAt?: number;
};
type AppInitState = {
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
    boxState?: TeleBoxState;
    zIndex?: number;
};
type CursorMovePayload = {
    uid: string;
    state?: "leave";
    position: Position;
};
type CursorOptions = {
    /**
     * If `"custom"`, it will render the pencil / eraser cursor as a circle and shapes cursor as a cross.
     *
     * @default "default"
     */
    style?: "default" | "custom";
};
type MountParams = {
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
declare const reconnectRefresher: ReconnectRefresher;
declare const mainViewField = "mainView";
declare class WindowManager extends InvisiblePlugin<WindowMangerAttributes, any> implements PageController {
    static kind: string;
    static displayer: Displayer;
    static originWrapper?: HTMLElement;
    static wrapper?: HTMLElement;
    static mainViewWrapper?: HTMLElement;
    static mainViewWrapperShadow?: HTMLElement;
    static sizer?: HTMLElement;
    static playground?: HTMLElement;
    static container?: HTMLElement;
    static debug: boolean;
    static containerSizeRatio: number;
    static supportAppliancePlugin?: boolean;
    static isCreated: boolean;
    static appReadonly: boolean;
    private static _resolve;
    private mutationObserver;
    private observerPencil;
    private static extendWrapper?;
    private static mainViewScrollWrapper?;
    version: string;
    dependencies: Record<string, string>;
    appListeners?: AppListeners;
    readonly?: boolean;
    emitter: Emittery<PublicEvent>;
    appManager?: AppManager;
    cursorManager?: CursorManager;
    scrollerManager?: ScrollerManager;
    viewMode: ViewMode;
    isReplay: boolean;
    private _pageState?;
    private _fullscreen?;
    private _cursorUIDs;
    private _cursorUIDsStyleDOM?;
    private boxManager?;
    private static params?;
    private containerResizeObserver?;
    containerSizeRatio: number;
    constructor(context: InvisiblePluginContext);
    static onCreate(manager: WindowManager): void;
    static mount(params: MountParams): Promise<WindowManager>;
    private static initManager;
    private static initContainer;
    static get registered(): Map<string, RegisterParams>;
    bindContainer(container: HTMLElement): void;
    bindCollectorContainer(container: HTMLElement): void;
    /**
     * 注册插件
     */
    static register(params: RegisterParams<any, any, any>): Promise<void>;
    /**
     * 注销插件
     */
    static unregister(kind: string): void;
    /**
     * 创建一个 app 至白板
     */
    addApp<T = any>(params: AddAppParams<T>): Promise<string | undefined>;
    private _addApp;
    private setupScenePath;
    /**
     * 设置 mainView 的 ScenePath, 并且切换白板为可写状态
     */
    setMainViewScenePath(scenePath: string): Promise<void>;
    /**
     * 设置 mainView 的 SceneIndex, 并且切换白板为可写状态
     */
    setMainViewSceneIndex(index: number): Promise<void>;
    nextPage(): Promise<boolean>;
    prevPage(): Promise<boolean>;
    jumpPage(index: number): Promise<boolean>;
    addPage(params?: AddPageParams): Promise<void>;
    /**
     * 删除一页
     * 默认删除当前页, 可以删除指定 index 页
     * 最低保留一页
     */
    removePage(index?: number): Promise<boolean>;
    /**
     * 返回 mainView 的 ScenePath
     */
    getMainViewScenePath(): string | undefined;
    /**
     * 返回 mainView 的 SceneIndex
     */
    getMainViewSceneIndex(): number;
    /**
     * 设置所有 app 的 readonly 模式
     */
    setReadonly(readonly: boolean): void;
    /**
     * 切换 mainView 为可写
     */
    switchMainViewToWriter(): Promise<void> | undefined;
    /**
     * app destroy 回调
     */
    onAppDestroy(kind: string, listener: (error: Error) => void): void;
    /**
     * app 本地自定义事件回调
     *
     * 返回一个用于撤销此监听的函数
     */
    onAppEvent(kind: string, listener: (args: {
        kind: string;
        appId: string;
        type: string;
        value: any;
    }) => void): () => void;
    /**
     * 设置 ViewMode
     */
    setViewMode(mode: ViewMode): void;
    setBoxState(boxState: TeleBoxState): void;
    setMaximized(maximized: any): void;
    setMinimized(minimized: any): void;
    setFullscreen(fullscreen: boolean): void;
    get cursorUIDs(): string[];
    setCursorUIDs(cursorUIDs?: string[] | null): void;
    maximizedBoxNextPage(): false | Promise<boolean> | undefined;
    maximizedBoxPrevPage(): false | Promise<boolean> | undefined;
    getMaximizedBoxPageState(): PageState | undefined;
    getTopMaxBoxId(): string | undefined;
    get mainView(): View;
    get camera(): Camera;
    get cameraState(): CameraState;
    get apps(): Apps | undefined;
    get boxState(): TeleBoxState | undefined;
    get darkMode(): boolean;
    get prefersColorScheme(): TeleBoxColorScheme | undefined;
    get focused(): string | undefined;
    get focusedView(): View | undefined;
    get polling(): boolean;
    set polling(b: boolean);
    get cursorStyle(): "default" | "custom";
    set cursorStyle(value: "default" | "custom");
    get mainViewSceneIndex(): number;
    get mainViewSceneDir(): string;
    get topApp(): string | undefined;
    get mainViewScenesLength(): number;
    get canRedoSteps(): number;
    get canUndoSteps(): number;
    get sceneState(): SceneState;
    get pageState(): PageState;
    get fullscreen(): boolean;
    get extendWrapper(): HTMLElement | undefined;
    /**
     * 查询所有的 App
     */
    queryAll(): AppProxy[];
    /**
     * 查询单个 App
     */
    queryOne(appId: string): AppProxy | undefined;
    /**
     * 关闭 APP
     */
    closeApp(appId: string): Promise<void>;
    /**
     * 切换 focus 到指定的 app, 并且把这个 app 放到最前面
     */
    focusApp(appId: string): void;
    moveCamera(camera: Partial<Camera> & {
        animationMode?: AnimationMode | undefined;
    }): void;
    moveCameraToContain(rectangle: Rectangle & Readonly<{
        animationMode?: AnimationMode;
    }>): void;
    convertToPointInWorld(point: Point): Point;
    setCameraBound(cameraBound: CameraBound): void;
    onDestroy(): void;
    destroy(): void;
    private _destroy;
    private bindMainView;
    get canOperate(): boolean;
    get room(): Room;
    get appReadonly(): boolean;
    setAppReadonly(readonly: boolean): void;
    safeSetAttributes(attributes: any): void;
    safeUpdateAttributes(keys: string[], value: any): void;
    setPrefersColorScheme(scheme: TeleBoxColorScheme): void;
    cleanCurrentScene(): void;
    redo(): number;
    undo(): number;
    delete(): void;
    copy(): void;
    paste(): void;
    duplicate(): void;
    insertText(x: number, y: number, text: string | undefined): string;
    insertImage(info: ImageInformation): void;
    completeImageUpload(uuid: string, url: string): void;
    lockImage(uuid: string, locked: boolean): void;
    lockImages(locked: boolean): void;
    refresh(): void;
    setContainerSizeRatio(ratio: number): void;
    setScale(appId: string, scale: number): void;
    private _updateMainViewWrapperSize;
    private _setScale;
    getScale(): Record<string, number> | undefined;
    setTeacherInfo(data: {
        uid?: string;
        name?: string;
    }): void;
    private get teacherInfo();
    setLaserPointer(active: boolean): void;
    private _currentPointActive;
    private _changePointerIcon;
    private _setLaserPointer;
    setHidePencil(active: boolean): void;
    private _setHidePencil;
    get isLaserPointerActive(): any;
    private bindHidTeacherCursorListener;
    getAppScale(appId: string): number;
    private isDynamicPPT;
    private ensureAttributes;
    private _iframeBridge?;
    getIframeBridge(): IframeBridge;
    getBackground(): {
        type: "img" | "color";
        value: string | undefined;
    } | undefined;
    setBackgroundImg(src: string): void;
    setBackgroundColor(color: string): void;
    private _setBackgroundColor;
    private _setBackgroundImg;
    private _initAttribute;
}

export { AppContext, AppCreateError, AppManagerNotInitError, AppNotRegisterError, BindContainerRoomPhaseInvalidError, BoxManagerNotFoundError, BoxNotCreatedError, BuiltinApps, DomEvents, IframeBridge, IframeEvents, InvalidScenePath, ParamsInvalidError, Storage, WhiteWebSDKInvalidError, WindowManager, calculateNextIndex, mainViewField, reconnectRefresher };
export type { AddAppOptions, AddAppParams, AddPageParams, AppEmitterEvent, AppInitState, AppListenerKeys, AppPayload, AppSyncAttributes, ApplianceIcons, BaseInsertParams, CursorMovePayload, CursorOptions, IframeBridgeAttributes, IframeBridgeEvents, IframeSize, InsertOptions, MountParams, NetlessApp, OnCreateInsertOption, PageController, PageRemoveService, PageState, PublicEvent, RegisterEventData, RegisterEvents, RegisterParams, StorageStateChangedEvent, StorageStateChangedListener, WindowMangerAttributes, apps, setAppOptions };
