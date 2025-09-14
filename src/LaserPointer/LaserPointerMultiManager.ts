import { LaserPointerManager } from "./LaserPointerManager";
import { WindowManager } from "../index";
import { callbacks } from "../callback";
import { Displayer, Room } from "white-web-sdk";
import { AppManager } from "../AppManager";
import { Fields } from "../AttributesDelegate";

const logFirstTag = "[LaserPointer]";


/**
 * 多实例激光笔管理器
 * 负责管理多个 LaserPointerManager 实例，处理不同视图的激光笔功能
 */
export class LaserPointerMultiManager {
    private _laserPointerManagers = new Map<string, LaserPointerManager>();
    private _windowManager: WindowManager;
    private _room?: Room;
    private _displayer?: Displayer;
    private _appManager?: AppManager;
    private _currentUserId?: string;
    private _isDestroyed = false;
    
    constructor(windowManager: WindowManager) {
        this._windowManager = windowManager;
        this._room = windowManager.room;
        this._displayer = windowManager.displayer;
        this._appManager = windowManager.appManager;
        this._currentUserId = this._getCurrentUserId();
        
        console.log(`${logFirstTag} Initialized LaserPointerMultiManager`);
    }

    /**
     * 设置事件监听器
     */
    public setupEventListeners(): void {
        console.log(`${logFirstTag} Setting up event listeners`);
        
        // 监听主视图挂载事件
        callbacks.on("onMainViewMounted", (_view) => {
            console.log(`${logFirstTag} onMainViewMounted event received`);
            // 延迟获取容器，确保 DOM 已更新
            setTimeout(() => {
                const mainViewContainer = this._getMainViewContainer();
                if (mainViewContainer) {
                    console.log(`${logFirstTag} Creating main view laser pointer manager`);
                    this.createLaserPointerManagerForView("main");
                } else {
                    console.warn(`${logFirstTag} Failed to get main view container`);
                }
            }, 100);
        });

        // 监听主视图重新绑定事件
        callbacks.on("onMainViewRebind", (_view) => {
            console.log(`${logFirstTag} onMainViewRebind event received`);
            // 主视图重新绑定时，重新创建激光笔管理器
            this.destroyLaserPointerManagerForView("main");
            const mainViewContainer = this._getMainViewContainer();
            if (mainViewContainer) {
                this.createLaserPointerManagerForView("main");
            }
        });

        // 监听应用视图挂载事件
        callbacks.on("onAppViewMounted", (payload) => {
            console.log(`${logFirstTag} onAppViewMounted event received for app:`, payload.appId);
            // 为应用视图创建激光笔管理器，使用 boxview
            const appBoxView = this._getAppBoxView(payload.appId);
            console.log(`${logFirstTag} App box view for ${payload.appId}:`, !!appBoxView);
            if (appBoxView) {
                console.log(`${logFirstTag} Creating laser pointer manager for app:`, payload.appId);
                this.createLaserPointerManagerForView(`app_${payload.appId}`);
            } else {
                console.warn(`${logFirstTag} Failed to get app box view for:`, payload.appId);
            }
        });

        // 初始化时尝试创建主视图管理器（如果已经存在主视图）
        setTimeout(() => {
            console.log(`${logFirstTag} Checking if main view manager needs to be created during setup`);
            this._ensureMainViewManager();
        }, 500);
    }

    /**
     * 为特定视图创建激光笔管理器
     */
    public createLaserPointerManagerForView(viewId: string): LaserPointerManager | undefined {
        if (this._isDestroyed) {
            console.warn(`${logFirstTag} Cannot create LaserPointerManager - manager is destroyed`);
            return undefined;
        }

        if (!this._room || !this._displayer || !this._appManager) {
            console.warn(`${logFirstTag} Cannot create LaserPointerManager for view ${viewId} - missing dependencies`);
            return undefined;
        }

        // 检查是否已存在
        if (this._laserPointerManagers.has(viewId)) {
            console.log(`${logFirstTag} LaserPointerManager for view ${viewId} already exists`);
            return this._laserPointerManagers.get(viewId);
        }
        
        const manager = new LaserPointerManager(
            this._windowManager,
            this._room,
            this._displayer,
            this._appManager,
            this._currentUserId,
            viewId
        );
        manager.setLaserPointer(this._appManager.store.getLaserPointerActive()?.active || false);

        this._laserPointerManagers.set(viewId, manager);
        console.log(`${logFirstTag} Created LaserPointerManager for view ${viewId}`);
        return manager;
    }

    /**
     * 销毁特定视图的激光笔管理器
     */
    public destroyLaserPointerManagerForView(viewId: string): void {
        const manager = this._laserPointerManagers.get(viewId);
        if (manager) {
            manager.destroy();
            this._laserPointerManagers.delete(viewId);
            console.log(`${logFirstTag} Destroyed LaserPointerManager for view ${viewId}`);
        }
    }

    /**
     * 设置所有激光笔管理器的激活状态
     */
    public setLaserPointerActive(active: boolean): void {
        const isTeacher = this._isCurrentUserTeacher();
        
        console.log(`${logFirstTag} Setting laser pointer active: ${active}, isTeacher: ${isTeacher}, managers: ${this._laserPointerManagers.size}`);
        
        // 如果没有管理器且是老师端激活，尝试创建主视图管理器
        if (this._laserPointerManagers.size === 0 && isTeacher && active) {
            console.log(`${logFirstTag} No managers found, attempting to create main view manager`);
            this._ensureMainViewManager();
        }
        
        this._laserPointerManagers.forEach((manager, viewId) => {
            console.log(`${logFirstTag} Updating laser pointer for view: ${viewId}, active: ${isTeacher ? active : false}`);
            if (isTeacher) {
                manager.setLaserPointer(active);
            } else {
                manager.setLaserPointer(false);
            }
        });
    }

    /**
     * 设置老师端激光笔显示样式
     * @param show 是否显示老师端激光笔样式
     */
    public setTeacherMySelfPointerShow(show: boolean): void {
        this._laserPointerManagers.forEach((manager, _) => {
            manager.setTeacherMySelfPointerShow(show);
        });
    }

    /**
     * 销毁所有激光笔管理器
     */
    public destroy(): void {
        console.log(`${logFirstTag} Destroying LaserPointerMultiManager with ${this._laserPointerManagers.size} managers`);
        
        // 销毁所有激光笔管理器
        this._laserPointerManagers.forEach((manager, viewId) => {
            console.log(`${logFirstTag} Destroying LaserPointerManager for view ${viewId}`);
            manager.destroy();
        });
        
        this._laserPointerManagers.clear();
        
        
        this._isDestroyed = true;
        
        console.log(`${logFirstTag} LaserPointerMultiManager destroyed`);
    }

    /**
     * 获取当前用户ID
     */
    private _getCurrentUserId(): string | undefined {
        // 使用与 WindowManager 相同的逻辑获取当前用户ID
        return this._windowManager.appManager?.uid ? 
            this._windowManager.appManager?.uid : 
            undefined;
    }

    /**
     * 检查当前用户是否是老师
     */
    private _isCurrentUserTeacher(): boolean {
        const teacherInfo = this._windowManager.appManager?.store?.getTeacherInfo();
        return teacherInfo?.uid === this._currentUserId;
    }

    /**
     * 确保主视图管理器存在
     */
    private _ensureMainViewManager(): void {
        // 检查是否已经存在主视图管理器
        if (this._laserPointerManagers.has("main")) {
            console.log(`${logFirstTag} Main view manager already exists`);
            return;
        }
        
        console.log(`${logFirstTag} Attempting to create main view manager`);
        const mainViewContainer = this._getMainViewContainer();
        if (mainViewContainer) {
            console.log(`${logFirstTag} Successfully creating main view laser pointer manager`);
            this.createLaserPointerManagerForView("main");
        } else {
            console.warn(`${logFirstTag} Still failed to get main view container`);
        }
    }

    /**
     * 获取主视图容器
     */
    private _getMainViewContainer(): HTMLElement | null {
        // 获取主白板容器
        const hasChildren = (this._windowManager?.mainView?.divElement?.children?.length ?? 0) > 0;
        const mainViewContainer = hasChildren 
            ? (this._windowManager?.mainView?.divElement?.children[0] as HTMLElement) 
            : this._windowManager.container;
        
        console.log(`${logFirstTag} Getting main view container:`, {
            hasMainView: !!this._windowManager?.mainView,
            hasDivElement: !!this._windowManager?.mainView?.divElement,
            childrenCount: this._windowManager?.mainView?.divElement?.children?.length ?? 0,
            hasContainer: !!this._windowManager.container,
            selectedContainer: !!mainViewContainer
        });
        
        return mainViewContainer || null;
    }

    /**
     * 获取应用的 boxview
     */
    private _getAppBoxView(appId: string): HTMLElement | null {
        const appProxy = this._appManager?.appProxies?.get(appId);
        console.log(`${logFirstTag} Getting app box view for ${appId}:`, {
            hasAppManager: !!this._appManager,
            hasAppProxy: !!appProxy,
            hasBox: !!appProxy?.box,
            hasElement: !!appProxy?.box?.$box
        });
        
        if (appProxy?.box?.$box) {
            return appProxy.box?.$box as HTMLElement;
        }
        return null;
    }
}
