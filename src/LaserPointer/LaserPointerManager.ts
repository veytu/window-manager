import { throttle } from "lodash";
import { ApplianceNames, Displayer, Room } from "white-web-sdk";
import { Fields } from "../AttributesDelegate";
import { WindowManager } from "../index";
import { AppManager } from "../AppManager";

const logFirstTag = "[LaserPointer]";

/**
 * 激光笔位置接口
 * 定义激光笔在屏幕上的坐标位置
 */
export interface LaserPointerPosition {
    x: number; // X轴坐标
    y: number; // Y轴坐标
}

/**
 * 激光笔管理器类
 * 负责管理单个视图的激光笔功能，包括老师端的位置发送和学生端的位置显示
 */
export class LaserPointerManager {
    private _laserPointerIcon?: HTMLElement;                    // 激光笔图标DOM元素
    private _teacherMoveThrottle?: (position: LaserPointerPosition) => void; // 老师端位置发送节流函数
    private _lastTeacherPosition?: LaserPointerPosition;        // 上次老师端位置，用于位置变化检测
    private _currentPointActive = false;                        // 当前激光笔是否激活
    private _boundHandleTeacherMouseMove?: (event: MouseEvent) => void;   // 绑定的鼠标移动事件处理器
    private _boundHandleTeacherMouseEnter?: (event: MouseEvent) => void;  // 绑定的鼠标进入事件处理器
    private _boundHandleTeacherMouseLeave?: (event: MouseEvent) => void;  // 绑定的鼠标离开事件处理器
    private _room?: Room;                    // 白板房间实例，用于发送激光笔位置事件
    private _displayer?: Displayer;          // 白板显示器实例，用于接收激光笔位置事件
    private _appManager?: AppManager;               // 应用管理器，用于获取应用信息和用户信息
    private _currentUserId?: string;         // 当前用户ID，用于判断是否为老师
    private _instanceId: string;             // 激光笔实例唯一标识，区分主视图和应用视图
    private _manager: WindowManager;         // 窗口管理器，用于获取主视图和应用视图
    private _view?: any;                     // 缓存的视图对象，避免频繁获取，提高性能

    /**
     * 激光笔管理器构造函数
     * 初始化激光笔管理器的所有必要组件和事件监听器
     * @param manager 窗口管理器实例，用于获取主视图和应用视图
     * @param room 白板房间实例，用于发送激光笔位置事件
     * @param displayer 白板显示器实例，用于接收激光笔位置事件
     * @param appManager 应用管理器，用于获取应用信息和用户信息
     * @param currentUserId 当前用户ID，用于判断是否为老师
     * @param viewId 视图ID，用于标识主视图('main')或应用视图('app_xxx')
     */
    constructor(manager: WindowManager,room: Room,displayer: Displayer,appManager: any,currentUserId?: string,viewId?: string) {
        this._manager = manager;
        this._room = room;
        this._displayer = displayer;
        this._appManager = appManager;
        this._currentUserId = currentUserId;
        this._instanceId = viewId || `LP_${Math.random().toString(36).substr(2, 6)}`;
        console.log(`${logFirstTag} [${this._instanceId}] 激光笔管理器构造函数`, manager, room, displayer, appManager, currentUserId, viewId);

        this._initView();
        this._setupMagixListener();
    }

    /**
     * 获取当前显示视图的DOM容器元素
     * 根据实例ID类型返回对应的DOM容器，用于激光笔图标的显示和鼠标事件的监听
     * @returns 主视图返回mainView.divElement.children[0]，应用视图返回view.divElement
     */
    private _getShowViewDivElement(): HTMLElement | null {
        if (!this._view) {
            console.warn(`${logFirstTag} [${this._instanceId}] 视图对象未初始化`);
            return null;
        }
        
        if (this._instanceId === 'main') {
            // 主视图使用mainView.divElement的第一个子元素作为容器
            const mainViewContainer = this._view.divElement?.children?.[0] as HTMLElement;
            console.log(`${logFirstTag} [${this._instanceId}] 主视图容器检查: 容器=${mainViewContainer}`);
            return mainViewContainer || null;
        } else {
            // 应用视图直接使用view.divElement作为容器
            const appContainer = this._view.divElement?.children?.[0] || null;
            console.log(`${logFirstTag} [${this._instanceId}] 应用视图容器检查: 容器=${appContainer}`);
            return appContainer;
        }
    }

    /**
     * 初始化缓存的视图对象
     * 根据instanceId确定是主视图还是应用视图，并缓存对应的view对象
     * 缓存视图对象可以避免频繁查找，提高性能
     */
    private _initView(): void {
        const isMainView = this._instanceId === 'main';
        const isAppView = this._instanceId.startsWith('app_');
        
        if (isMainView) {
            // 主视图直接使用mainView
            this._view = this._manager.mainView;
            console.log(`${logFirstTag} [${this._instanceId}] 主视图初始化: mainView存在=${!!this._manager.mainView}, divElement存在=${!!this._manager.mainView?.divElement}`);
        } else if (isAppView) {
            // 应用视图从appProxies中获取对应的view
            const appId = this._instanceId.replace('app_', '');
            const appProxy = this._appManager?.appProxies?.get(appId);
            this._view = appProxy?.view;
            console.log(`${logFirstTag} [${this._instanceId}] 应用视图初始化: appId=${appId}, appProxy存在=${!!appProxy}, view存在=${!!appProxy?.view}, divElement存在=${!!appProxy?.view?.divElement}`);
        }
        
        console.log(`${logFirstTag} [${this._instanceId}] 初始化视图完成: 是否主视图=${isMainView}, 是否应用视图=${isAppView}, 有视图=${!!this._view}, 视图类型=${isMainView ? '主视图' : '应用视图'}`);
    }

    /**
     * 设置激光笔激活状态
     * 控制激光笔功能的开启和关闭，包括鼠标事件监听器的添加和移除
     * @param active 是否激活激光笔功能，true为激活，false为停用
     */
    public setLaserPointer(active: boolean): void {
        console.log(`${logFirstTag} [${this._instanceId}] 设置激光笔状态:`, active);
        this._currentPointActive = active;
        
        if (!active) {
            // 停用激光笔时，移除鼠标监听器并重置位置
            const showView = this._getShowViewDivElement();
            if (showView && this._boundHandleTeacherMouseMove) {
                console.log(`${logFirstTag} [${this._instanceId}] 移除鼠标移动监听器`);
                showView.removeEventListener('mousemove', this._boundHandleTeacherMouseMove);
            } else {
                console.log(`${logFirstTag} [${this._instanceId}] 无法移除监听器 - 容器:`, !!showView, '绑定处理器:', !!this._boundHandleTeacherMouseMove);
            }
            
            // 移除teacher-current-pointer类名
            if (showView) {
                this.setTeacherMySelfPointerShow(false);
            }
            
            this._lastTeacherPosition = undefined;
        } else {
            // 激活激光笔时，只有当前用户是老师才设置监听器
            const teacherInfo = this._manager.appManager?.store.getTeacherInfo();
            console.log(`${logFirstTag} [${this._instanceId}] 激光笔状态变更`, JSON.stringify(teacherInfo), this._currentUserId);
            if (teacherInfo?.uid === this._currentUserId) {
                console.log(`${logFirstTag} [${this._instanceId}] 当前用户是老师，开始设置监听器`);
                this._setupTeacherMoveListener();
                
                // 如果是非主白板，添加teacher-current-pointer类名
                const showView = this._getShowViewDivElement();
                if (this._instanceId !== 'main') {
                    if (showView) {
                        showView.parentElement?.classList.add('teacher-current-pointer-enevnt-auto');
                        console.log(`${logFirstTag} [${this._instanceId}] 老师端课件已添加pint事件`,showView);
                    }
                }else{
                    showView?.classList?.remove('teacher-current-pointer-enevnt-auto');
                }
            } else {
                console.log(`${logFirstTag} [${this._instanceId}] 当前用户不是老师，跳过监听器设置`);
            }
        }
        
        // 更新激光笔图标显示状态
        this.updateLaserPointerIconVisibility();
    }

    /**
     * 设置老师端鼠标移动监听器
     * 创建节流函数和绑定事件处理器，并添加鼠标事件监听
     * 包括鼠标移动、进入和离开事件的统一处理
     */
    private _setupTeacherMoveListener() {
        if (!this._teacherMoveThrottle) {
            this._teacherMoveThrottle = throttle((position: LaserPointerPosition) => {
                console.log(`${logFirstTag} [${this._instanceId}] 节流函数触发，发送位置:`, JSON.stringify(position));
                this._sendTeacherPosition(position);
            }, 150);
        }
        const showView = this._getShowViewDivElement();
        console.log(`${logFirstTag} [${this._instanceId}] 开始设置老师端激光笔监听器，showView:`, showView != null,"激光笔状态:",this._currentPointActive);
        if (showView) {

            if (!this._boundHandleTeacherMouseMove) {
                this._boundHandleTeacherMouseMove = this._handleTeacherMouseEvent.bind(this);
            }
            if (!this._boundHandleTeacherMouseEnter) {
                this._boundHandleTeacherMouseEnter = this._handleTeacherMouseEvent.bind(this);
            }
            if (!this._boundHandleTeacherMouseLeave) {
                this._boundHandleTeacherMouseLeave = this._handleTeacherMouseEvent.bind(this);
            }

            // 先移除可能存在的监听器，避免重复添加
            if (this._boundHandleTeacherMouseMove) {
                showView.removeEventListener('mousemove', this._boundHandleTeacherMouseMove);
            }
            if (this._boundHandleTeacherMouseEnter) {
                showView.removeEventListener('mouseenter', this._boundHandleTeacherMouseEnter);
            }
            if (this._boundHandleTeacherMouseLeave) {
                showView.removeEventListener('mouseleave', this._boundHandleTeacherMouseLeave);
            }
            
            showView.addEventListener('mousemove', this._boundHandleTeacherMouseMove);
            showView.addEventListener('mouseenter', this._boundHandleTeacherMouseEnter);
            showView.addEventListener('mouseleave', this._boundHandleTeacherMouseLeave);
            
            console.log(`${logFirstTag} [${this._instanceId}] 事件监听器添加完成: mousemove=${!!this._boundHandleTeacherMouseMove}, mouseenter=${!!this._boundHandleTeacherMouseEnter}, mouseleave=${!!this._boundHandleTeacherMouseLeave}`);
            console.log(`${logFirstTag} [${this._instanceId}] 容器信息: tagName=${showView.tagName}, className=${showView.className}, id=${showView.id}, style.pointerEvents=${showView.style.pointerEvents}`);
            console.log(`${logFirstTag} [${this._instanceId}] 容器尺寸: width=${showView.offsetWidth}, height=${showView.offsetHeight}, visible=${showView.offsetWidth > 0 && showView.offsetHeight > 0}`);
            console.log(`${logFirstTag} [${this._instanceId}] 容器位置: left=${showView.offsetLeft}, top=${showView.offsetTop}, rect=${JSON.stringify(showView.getBoundingClientRect())}`);
            
            // 检查容器的父元素
            const parent = showView.parentElement;
            if (parent) {
                console.log(`${logFirstTag} [${this._instanceId}] 父元素信息: tagName=${parent.tagName}, className=${parent.className}, style.pointerEvents=${parent.style.pointerEvents}`);
            }
        }
    }

    /**
     * 统一处理老师端鼠标事件（移动、进入、离开）
     * 根据事件类型和鼠标位置进行相应的处理
     * 包括位置计算、边界检查、节流发送等功能
     */
    private _handleTeacherMouseEvent(event: MouseEvent) {
        const eventType = event.type;
        console.log(`${logFirstTag} [${this._instanceId}] 鼠标${eventType}事件处理, 激光笔激活状态:`, this._currentPointActive);
        
        if (!this._currentPointActive) {
            console.log(`${logFirstTag} [${this._instanceId}] 激光笔未激活，提前返回`);
            return;
        }
        //获取老师教具
        const teacherTool = this._room?.state.memberState.currentApplianceName
        if ((ApplianceNames.laserPointer === teacherTool)) {
            if (this._lastTeacherPosition == null || this._lastTeacherPosition.x !== -1 && this._lastTeacherPosition.y !== -1) {
                this._lastTeacherPosition = { x: -1, y: -1 };
                this._teacherMoveThrottle?.({ x: -1, y: -1 });
            }
            console.log(`${logFirstTag} [${this._instanceId}] 老师教具为激光笔，提前返回并通知学生端隐藏`);
            return;
        }
        
        // 处理鼠标离开事件
        if (eventType === 'mouseleave') {
            console.log(`${logFirstTag} [${this._instanceId}] 鼠标离开容器`);
            this._lastTeacherPosition = { x: -1, y: -1 };
            this._teacherMoveThrottle?.({ x: -1, y: -1 });
            return;
        }
        
        // 处理鼠标进入和移动事件
        if (eventType === 'mouseenter') {
            console.log(`${logFirstTag} [${this._instanceId}] 鼠标进入容器`);
        }
        
        const showView = this._getShowViewDivElement();
        const containerRect = showView?.getBoundingClientRect();
        if (containerRect) {
            const isInsideContainer = event.clientX >= containerRect.left && event.clientX <= containerRect.right && event.clientY >= containerRect.top && event.clientY <= containerRect.bottom;
            const wasOutside = this._lastTeacherPosition && (this._lastTeacherPosition.x === -1 && this._lastTeacherPosition.y === -1);
            
            if (!isInsideContainer) {
                console.log(`${logFirstTag} [${this._instanceId}] 鼠标在容器外，隐藏激光笔`);
                this._teacherMoveThrottle?.({ x: -1, y: -1 });
                return;
            }
            
            const position = this._view.convertToPointInWorld({ x: event.offsetX, y: event.offsetY });
            console.log(`${logFirstTag} [${this._instanceId}] 鼠标移动处理, 偏移量:`, event.offsetX, event.offsetY, '转换后位置:', JSON.stringify(position));
            
            if (wasOutside || !this._lastTeacherPosition || Math.abs(position.x - this._lastTeacherPosition.x) > 0.01 || Math.abs(position.y - this._lastTeacherPosition.y) > 0.01) {
                this._lastTeacherPosition = position;
                this._teacherMoveThrottle?.(position);
            }
        }
    }

    // 发送老师位置（老师端）
    private _sendTeacherPosition(position: LaserPointerPosition) {
        if (this._room) {
            // 确定当前视图的类型和ID
            const isMainView = this._instanceId === 'main';
            const isAppView = this._instanceId.startsWith('app_');
            
            let instanceId = undefined;
            
            if (isMainView) {
                instanceId = 'main';
            } else if (isAppView) {
                instanceId = this._instanceId; // boxId 就是 viewId
            } else {
                // 对于其他情况，使用实例ID作为 boxId
                instanceId = this._instanceId;
            }
            
            console.log(`${logFirstTag} [${this._instanceId}] 发送老师位置: 位置=${JSON.stringify(position)}, 视图ID=${instanceId}`);
            this._room.dispatchMagixEvent('teacherLaserPointerMove', { position, instanceId, timestamp: Date.now() });
        }
    }

    // 检查并更新激光笔图标显示状态
    public updateLaserPointerIconVisibility() {
        const laserPointerData = this._appManager?.attributes?.[Fields.LaserPointerActive];
        // 如果激光笔未激活或当前用户是激活用户，隐藏图标
        const teacherInfo = this._manager.appManager?.store.getTeacherInfo();
        if (!laserPointerData?.active || teacherInfo?.uid === this._currentUserId) {
            this._hideLaserPointerIcon();
        } else {
            // 如果激光笔激活且当前用户不是激活用户，确保图标已创建
            this._setupLaserPointerIcon();
        }
    }

    // 设置激光笔图标（学生端）- 每个视图使用自己的图标
    private _setupLaserPointerIcon() {
        // 检查是否已经存在激光笔图标
        if (this._laserPointerIcon) {
            return; // 已经存在，直接返回
        }
        
        // 检查 DOM 中是否已经存在 teacher-laser-pointer 元素
        const showView = this._getShowViewDivElement();
        const existingIcon = showView?.querySelector('.teacher-laser-pointer');
        if (existingIcon) {
            this._laserPointerIcon = existingIcon as HTMLElement;
            return; // 使用已存在的元素
        }
        
        // 创建本地激光笔图标
        console.log(`${logFirstTag} [${this._instanceId}] 为视图创建本地激光笔图标`);
        this._laserPointerIcon = document.createElement('div');
        this._laserPointerIcon.className = 'teacher-laser-pointer';
        this._laserPointerIcon.style.display = 'none';
        
        // 添加到当前视图容器
        if (showView) {
            showView.appendChild(this._laserPointerIcon);
            console.log(`${logFirstTag} [${this._instanceId}] 激光笔图标已添加到视图容器`);
        }
    }

    // 隐藏激光笔图标（学生端）- 处理本地图标
    private _hideLaserPointerIcon() {
        if (this._laserPointerIcon) {
            this._laserPointerIcon.style.display = 'none';
            console.log(`${logFirstTag} [${this._instanceId}] 隐藏本地激光笔图标`);
        }
    }

    // 设置激光笔 Magix 事件监听器（学生端）
    private _setupMagixListener() {
        console.log(`${logFirstTag} [${this._instanceId}] 设置激光笔移动事件监听器`);
        console.log(`${logFirstTag} [${this._instanceId}] 显示器可用:`, !!this._displayer);
        
        // 监听老师激光笔移动事件
        this._displayer?.addMagixEventListener('teacherLaserPointerMove', (event: any) => {
            console.log(`${logFirstTag} [${this._instanceId}] 收到原始事件:`, event);
            console.log(`${logFirstTag} [${this._instanceId}] 事件payload:`, event.payload);

            // 跳过自己发送的事件
            const teacherInfo = this._manager.appManager?.store.getTeacherInfo();
            console.log(`${logFirstTag} [${this._instanceId}] 老师信息: ${JSON.stringify(teacherInfo)}, 当前用户ID: ${this._currentUserId}`);
            
            if (teacherInfo?.uid === this._currentUserId) {
                console.log(`${logFirstTag} [${this._instanceId}] 跳过自己的事件`);
                return;
            }
            
            const { position, instanceId } = event.payload;
            console.log(`${logFirstTag} [${this._instanceId}] 收到老师激光笔移动: 位置=${JSON.stringify(position)}, 实例ID=${instanceId}, 当前实例ID=${this._instanceId}`);
            
            // 检查是否是当前实例的事件
            if (instanceId !== this._instanceId) {
                console.log(`${logFirstTag} [${this._instanceId}] 不是当前实例的事件，跳过: 期望=${this._instanceId}, 实际=${instanceId}`);
                return;
            }
            
            // 显示激光笔图标
            this._showLaserPointerIcon(position, instanceId);
        });
    }

    // 显示激光笔图标（学生端）
    private _showLaserPointerIcon(position: LaserPointerPosition, instanceId?: string) {
        // 检查激光笔是否激活且不是当前用户
        const laserPointerData = this._appManager?.attributes?.[Fields.LaserPointerActive];
        const teacherInfo = this._manager.appManager?.store.getTeacherInfo();
        if (!laserPointerData?.active || teacherInfo?.uid === this._currentUserId) {
            // 隐藏本地图标
            this._hideLaserPointerIcon();
            return;
        }
        
        // 检查是否是特殊位置（鼠标在屏幕外）
        if (position.x === -1 && position.y === -1) {
            console.log(`${logFirstTag} [${this._instanceId}] 收到隐藏信号，隐藏激光笔`);
            this._hideLaserPointerIcon();
            return;
        }
        
        // 检查实例ID是否匹配
        if (instanceId !== this._instanceId) {
            // 不是当前实例的激光笔，隐藏图标
            console.log(`${logFirstTag} [${this._instanceId}] 不是当前实例的激光笔，隐藏图标. 期望: ${this._instanceId}, 实际: ${instanceId}`);
            this._hideLaserPointerIcon();
            return;
        }
        
        console.log(`${logFirstTag} [${this._instanceId}] 为当前视图显示激光笔`);
        
        // 使用本地图标显示激光笔
        this._setupLaserPointerIcon();
        const showView = this._getShowViewDivElement();
        if (this._laserPointerIcon && showView && this._view) {
            // 统一使用缓存的视图对象进行坐标转换

            const point = this._view.convertToPointOnScreen(position.x, position.y);
            console.log(`${logFirstTag} [${this._instanceId}] 开始设置位置转换位置: ${JSON.stringify(position)}, 目标位置: ${JSON.stringify(point)}`);

            if (point && typeof point.x === 'number' && typeof point.y === 'number') {
                this._laserPointerIcon.style.left = `${point.x}px`;
                this._laserPointerIcon.style.top = `${point.y}px`;
                this._laserPointerIcon.style.display = 'block';
                const isMainView = this._instanceId === 'main';
                console.log(`${logFirstTag} [${this._instanceId}] 显示本地激光笔位置: ${JSON.stringify(point)} (视图类型: ${isMainView ? '主视图' : '应用视图'})`);
            } else {
                console.warn(`${logFirstTag} [${this._instanceId}] 坐标转换返回无效点: ${JSON.stringify(point)}, 原始位置: ${JSON.stringify(position)}`);
            }
        } else if (!this._view) {
            console.warn(`${logFirstTag} [${this._instanceId}] 没有可用的视图进行坐标转换`);
        }
    }

    // 销毁激光笔管理器
    public destroy() {
        // 清理激光笔相关资源
        this._hideLaserPointerIcon();
        
        // 清理 box 事件监听器（如果存在相关方法）
        const isAppView = this._instanceId.startsWith('app_');
        if (isAppView) {
            const appId = this._instanceId.replace('app_', '');
            const appProxy = this._appManager?.appProxies?.get(appId);
            if (appProxy?.box?.element) {
                // 移除可能存在的teacher-laser-pointer类名
                const boxElement = appProxy.box.element as HTMLElement;
                boxElement.classList.remove('teacher-laser-pointer');
            }
        }
        
        // 移除鼠标移动监听器
        const showView = this._getShowViewDivElement();
        if (showView && this._boundHandleTeacherMouseMove) {
            showView.removeEventListener('mousemove', this._boundHandleTeacherMouseMove);
        }
        if (showView && this._boundHandleTeacherMouseEnter) {
            showView.removeEventListener('mouseenter', this._boundHandleTeacherMouseEnter);
        }
        if (showView && this._boundHandleTeacherMouseLeave) {
            showView.removeEventListener('mouseleave', this._boundHandleTeacherMouseLeave);
        }
        
        // 移除所有激光笔图标（防止重复元素）
        const allLaserPointers = showView?.querySelectorAll('.teacher-laser-pointer');
        if (allLaserPointers) {
            allLaserPointers.forEach(icon => {
                if (icon.parentNode) {
                    icon.parentNode.removeChild(icon);
                }
            });
        }
        
        // 清理引用
        this._laserPointerIcon = undefined;
        this._teacherMoveThrottle = undefined;
        this._lastTeacherPosition = undefined;
        this._currentPointActive = false;
        this._boundHandleTeacherMouseMove = undefined;
        this._boundHandleTeacherMouseEnter = undefined;
        this._boundHandleTeacherMouseLeave = undefined;
    }

    /**
     * 测试应用视图的鼠标事件（调试用）
     */
    public testAppViewMouseEvents(): void {
        const showView = this._getShowViewDivElement();
        if (!showView) {
            console.warn(`${logFirstTag} [${this._instanceId}] 无法测试：showView为空`);
            return;
        }
        
        console.log(`${logFirstTag} [${this._instanceId}] 开始测试应用视图鼠标事件`);
        console.log(`${logFirstTag} [${this._instanceId}] 容器信息: tagName=${showView.tagName}, className=${showView.className}, id=${showView.id}`);
        console.log(`${logFirstTag} [${this._instanceId}] 容器尺寸: width=${showView.offsetWidth}, height=${showView.offsetHeight}`);
        console.log(`${logFirstTag} [${this._instanceId}] 容器位置: left=${showView.offsetLeft}, top=${showView.offsetTop}`);
        console.log(`${logFirstTag} [${this._instanceId}] 容器样式: pointerEvents=${showView.style.pointerEvents}, position=${showView.style.position}`);
        
        // 模拟鼠标事件
        const testEvent = new MouseEvent('mousemove', {
            clientX: 100,
            clientY: 100
        });
        
        // 手动设置offsetX和offsetY
        Object.defineProperty(testEvent, 'offsetX', { value: 50 });
        Object.defineProperty(testEvent, 'offsetY', { value: 50 });
        
        console.log(`${logFirstTag} [${this._instanceId}] 模拟鼠标移动事件`);
        showView.dispatchEvent(testEvent);
    }

}
