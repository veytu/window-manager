import { throttle } from "lodash";
import { ApplianceNames, Displayer, Room } from "white-web-sdk";
import { Fields } from "./AttributesDelegate";
import { WindowManager } from ".";

const logFirstTag = "[LaserPointerManager]";

export interface LaserPointerPosition {
    x: number;
    y: number;
}

export class LaserPointerManager {
    private _laserPointerIcon?: HTMLElement;
    private _teacherMoveThrottle?: (position: LaserPointerPosition) => void;
    private _lastTeacherPosition?: LaserPointerPosition;
    private _currentPointActive = false;
    private _boundHandleTeacherMouseMove?: (event: MouseEvent) => void;
    private _boundHandleTeacherMouseEnter?: (event: MouseEvent) => void;
    private _boundHandleTeacherMouseLeave?: (event: MouseEvent) => void;
    private _container?: HTMLElement;
    private _room?: Room;
    private _displayer?: Displayer;
    private _appManager?: any;
    private _currentUserId?: string;
    private _instanceId: string; // 实例唯一标识
    private _manager: WindowManager;

    constructor(
        manager: WindowManager,
        container: HTMLElement,
        room: Room,
        displayer: Displayer,
        appManager: any,
        currentUserId?: string
    ) {
        this._manager = manager;
        this._container = container;
        this._room = room;
        this._displayer = displayer;
        this._appManager = appManager;
        this._currentUserId = currentUserId;
        
        // 生成实例唯一标识
        this._instanceId = `LP_${Math.random().toString(36).substr(2, 6)}`;
        
        this._setupMagixListener();
    }

    // 设置激光笔激活状态
    public setLaserPointer(active: boolean): void {
        console.log(`${logFirstTag} [${this._instanceId}] setLaserPointer called with active:`, active);
        this._currentPointActive = active;
        if (!active) {
            // 移除鼠标移动监听器
            if (this._container && this._boundHandleTeacherMouseMove) {
                console.log(`${logFirstTag} [${this._instanceId}] Removing mousemove listener`);
                this._container.removeEventListener('mousemove', this._boundHandleTeacherMouseMove);
            } else {
                console.log(`${logFirstTag} [${this._instanceId}] Cannot remove listener - container:`, !!this._container, 'boundHandler:', !!this._boundHandleTeacherMouseMove);
            }
            
            // 重置位置
            this._lastTeacherPosition = undefined;
        } else {
            // 只有当前用户是激活用户时才设置监听器
            const teacherInfo = this._manager.appManager?.store.getTeacherInfo();
            console.log(`${logFirstTag} [${this._instanceId}] LastPointActive Chagne`, JSON.stringify(teacherInfo), this._currentUserId);
            if (teacherInfo?.uid === this._currentUserId) {
                this._setupTeacherMoveListener();
            }
        }
        
        // 联动更新图标显示状态
        this.updateLaserPointerIconVisibility();
    }

    // 设置老师移动监听器（老师端）
    private _setupTeacherMoveListener() {
        console.log(`${logFirstTag} [${this._instanceId}] Setting up teacher move listener`);
        
        if (!this._teacherMoveThrottle) {
            // 节流函数，每 150ms 发送一次位置更新
            this._teacherMoveThrottle = throttle((position: LaserPointerPosition) => {
                this._sendTeacherPosition(position);
            }, 150);
        }

        // 创建绑定的处理函数（只创建一次）
        if (!this._boundHandleTeacherMouseMove) {
            this._boundHandleTeacherMouseMove = this._handleTeacherMouseMove.bind(this);
        }
        if (!this._boundHandleTeacherMouseEnter) {
            this._boundHandleTeacherMouseEnter = this._handleTeacherMouseEnter.bind(this);
        }
        if (!this._boundHandleTeacherMouseLeave) {
            this._boundHandleTeacherMouseLeave = this._handleTeacherMouseLeave.bind(this);
        }

        const viewWrapper = this._container?.querySelector('.netless-window-manager-wrapper') as HTMLElement; 
        // 监听老师的鼠标移动和边界事件
        if (this._container) {
            // 先移除可能存在的监听器，避免重复添加
            if (this._boundHandleTeacherMouseMove) {
                viewWrapper.removeEventListener('mousemove', this._boundHandleTeacherMouseMove);
            }
            if (this._boundHandleTeacherMouseEnter) {
                viewWrapper.removeEventListener('mouseenter', this._boundHandleTeacherMouseEnter);
            }
            if (this._boundHandleTeacherMouseLeave) {
                viewWrapper.removeEventListener('mouseleave', this._boundHandleTeacherMouseLeave);
            }
            
            viewWrapper.addEventListener('mousemove', this._boundHandleTeacherMouseMove);
            viewWrapper.addEventListener('mouseenter', this._boundHandleTeacherMouseEnter);
            viewWrapper.addEventListener('mouseleave', this._boundHandleTeacherMouseLeave);
            console.log(`${logFirstTag} [${this._instanceId}] Added mouse listeners`);
        }
    }

    // 处理老师鼠标移动（老师端）
    private _handleTeacherMouseMove(event: MouseEvent) {
        console.log(`${logFirstTag} [${this._instanceId}] Mouse move handler called, _currentPointActive:`, this._currentPointActive);
        if (!this._currentPointActive) {
            console.log(`${logFirstTag} [${this._instanceId}] Early return due to inactive state`);
            return;
        }
        
        const containerRect = this._container?.getBoundingClientRect();
        if (containerRect) {
            // 检查鼠标是否在容器范围内
            const isInsideContainer = event.clientX >= containerRect.left && 
                                    event.clientX <= containerRect.right && 
                                    event.clientY >= containerRect.top && 
                                    event.clientY <= containerRect.bottom;
            
            if (!isInsideContainer) {
                // 鼠标在屏幕外，发送特殊位置表示隐藏
                console.log(`${logFirstTag} [${this._instanceId}] Mouse outside container, hiding laser pointer`);
                this._teacherMoveThrottle?.({ x: -1, y: -1 }); // 使用特殊值表示隐藏
                return;
            }
            const memberState = this._manager.appManager?.getMemberState();
            let offsetX = 8;
            let offsetY = 8;
            console.log(`${logFirstTag} [${this._instanceId}] Current Member State`, memberState);
            if (ApplianceNames.pencil === memberState?.currentApplianceName) {
                offsetX = 18;
                offsetY = 18;
            }
            
            const position = this._manager.mainView.convertToPointInWorld({ x: event.offsetX - offsetX, y: event.offsetY - offsetY})
            console.log(`${logFirstTag} [${this._instanceId}] Mouse move handler called, position:`, position, event.offsetX, event.offsetY);
            // 检查是否是重新进入容器（之前在外面，现在在里面）
            const wasOutside = this._lastTeacherPosition && 
                             (this._lastTeacherPosition.x === -1 && this._lastTeacherPosition.y === -1);
            
            // 检查位置是否有显著变化（避免微小移动）或重新进入容器
            if (wasOutside || !this._lastTeacherPosition || 
                Math.abs(position.x - this._lastTeacherPosition.x) > 0.01 ||
                Math.abs(position.y - this._lastTeacherPosition.y) > 0.01) {
                
                this._lastTeacherPosition = position;
                this._teacherMoveThrottle?.(position);
            }
        }
    }

    // 处理老师鼠标进入容器（老师端）
    private _handleTeacherMouseEnter(event: MouseEvent) {
        console.log(`${logFirstTag} [${this._instanceId}] Mouse entered container`);
        if (!this._currentPointActive) return;
        
        // 鼠标重新进入容器，立即发送当前位置
        const containerRect = this._container?.getBoundingClientRect();
        if (containerRect) {
            const relativeX = (event.clientX - containerRect.left) / containerRect.width;
            const relativeY = (event.clientY - containerRect.top) / containerRect.height;
            const position = { x: relativeX, y: relativeY };
            
            this._lastTeacherPosition = position;
            this._teacherMoveThrottle?.(position);
        }
    }

    // 处理老师鼠标离开容器（老师端）
    private _handleTeacherMouseLeave(event: MouseEvent) {
        console.log(`${logFirstTag} [${this._instanceId}] Mouse left container`);
        if (!this._currentPointActive) return;
        
        // 鼠标离开容器，发送隐藏信号
        this._lastTeacherPosition = { x: -1, y: -1 };
        this._teacherMoveThrottle?.({ x: -1, y: -1 });
    }

    // 发送老师位置（老师端）
    private _sendTeacherPosition(position: LaserPointerPosition) {
        if (this._room) {
            console.log(`${logFirstTag} [${this._instanceId}] Sending Teacher Position`, position);
            this._room.dispatchMagixEvent('teacherLaserPointerMove', {
                position,
                timestamp: Date.now()
            });
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

    // 设置激光笔图标（学生端）
    private _setupLaserPointerIcon() {
        // 检查是否已经存在激光笔图标
        if (this._laserPointerIcon) {
            return; // 已经存在，直接返回
        }
        
        // 检查 DOM 中是否已经存在 teacher-laser-pointer 元素
        const existingIcon = this._container?.querySelector('.teacher-laser-pointer');
        if (existingIcon) {
            this._laserPointerIcon = existingIcon as HTMLElement;
            return; // 使用已存在的元素
        }
        
        // 创建新的激光笔图标
        this._laserPointerIcon = document.createElement('div');
        this._laserPointerIcon.className = 'teacher-laser-pointer';
        this._laserPointerIcon.style.cssText = `
            position: absolute;
            width: 40px;
            height: 40px;
            background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGZpbHRlciB4PSItMTIwJSIgeT0iLTEyMCUiIHdpZHRoPSIzNDAlIiBoZWlnaHQ9IjM0MCUiIGZpbHRlclVuaXRzPSJvYmplY3RCb3VuZGluZ0JveCIgaWQ9ImEiPjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjQiIGluPSJTb3VyY2VHcmFwaGljIi8+PC9maWx0ZXI+PC9kZWZzPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDkgOSkiIGZpbGw9IiNGRjAxMDAiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PGNpcmNsZSBmaWx0ZXI9InVybCgjYSkiIGN4PSI1IiBjeT0iNSIgcj0iNSIvPjxwYXRoIGQ9Ik01IDhhMyAzIDAgMSAwIDAtNiAzIDMgMCAwIDAgMCA2em0wLTEuNzE0YTEuMjg2IDEuMjg2IDAgMSAxIDAtMi41NzIgMS4yODYgMS4yODYgMCAwIDEgMCAyLjU3MnoiIGZpbGwtcnVsZT0ibm9uemVybyIvPjwvZz48L3N2Zz4=');
            background-size: contain;
            background-repeat: no-repeat;
            pointer-events: none;
            z-index: 10000;
            display: none;
        `;
        
        if (this._container) {
            this._container?.querySelector('.netless-window-manager-wrapper')?.appendChild(this._laserPointerIcon);
        }
    }

    // 隐藏激光笔图标（学生端）
    private _hideLaserPointerIcon() {
        if (this._laserPointerIcon) {
            this._laserPointerIcon.style.display = 'none';
        }
    }

    // 设置激光笔 Magix 事件监听器（学生端）
    private _setupMagixListener() {
        // 监听老师激光笔移动事件
        this._displayer?.addMagixEventListener('teacherLaserPointerMove', (event: any) => {
            // 跳过自己发送的事件
            const teacherInfo = this._manager.appManager?.store.getTeacherInfo();
            if (teacherInfo?.uid === this._currentUserId) {
                return;
            }
            
            const { position } = event.payload;
            console.log(`${logFirstTag} [${this._instanceId}] Received Teacher Laser Pointer Move`, position);
            
            // 显示激光笔图标（内部会检查权限）
            this._showLaserPointerIcon(position);
        });
    }

    // 显示激光笔图标（学生端）
    private _showLaserPointerIcon(position: LaserPointerPosition) {
        // 检查激光笔是否激活且不是当前用户
        const laserPointerData = this._appManager?.attributes?.[Fields.LaserPointerActive];
        const teacherInfo = this._manager.appManager?.store.getTeacherInfo();
        if (!laserPointerData?.active || teacherInfo?.uid === this._currentUserId) {
            this._hideLaserPointerIcon(); // 激光笔未激活或当前用户是激活用户，隐藏图标
            return;
        }
        
        // 检查是否是特殊位置（鼠标在屏幕外）
        if (position.x === -1 && position.y === -1) {
            console.log(`${logFirstTag} [${this._instanceId}] Received hide signal, hiding laser pointer`);
            this._hideLaserPointerIcon();
            return;
        }
        
        // 确保激光笔图标已创建
        this._setupLaserPointerIcon();
        
        // 更新激光笔图标位置
        if (this._laserPointerIcon && this._container) {
            const containerRect = this._container.getBoundingClientRect();
            const point = this._manager.mainView.convertToPointOnScreen(position.x, position.y)
            
            // 使用 transform 设置位置，性能更好且更流畅
            this._laserPointerIcon.style.left = `${point.x}px`;
            this._laserPointerIcon.style.top = `${point.y}px`;
            this._laserPointerIcon.style.display = 'block';
        }
    }



    // 销毁激光笔管理器
    public destroy() {
        // 清理激光笔相关资源
        this._hideLaserPointerIcon();
        
        // 移除鼠标移动监听器
        if (this._container && this._boundHandleTeacherMouseMove) {
            this._container.removeEventListener('mousemove', this._boundHandleTeacherMouseMove);
        }
        if (this._container && this._boundHandleTeacherMouseEnter) {
            this._container.removeEventListener('mouseenter', this._boundHandleTeacherMouseEnter);
        }
        if (this._container && this._boundHandleTeacherMouseLeave) {
            this._container.removeEventListener('mouseleave', this._boundHandleTeacherMouseLeave);
        }
        
        // 移除所有激光笔图标（防止重复元素）
        const allLaserPointers = this._container?.querySelectorAll('.teacher-laser-pointer');
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
}
