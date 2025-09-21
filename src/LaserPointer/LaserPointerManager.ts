import { isNumber, throttle } from "lodash";
import type { View } from "white-web-sdk";
import type { WindowManager } from "../index";
import type { AppProxy } from "../App";
import { Fields } from "../AttributesDelegate";

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
    private _boundHandleTeacherMouseMove?: (event: MouseEvent) => void;   // 绑定的鼠标移动事件处理器
    private _manager: WindowManager;         // 窗口管理器，用于获取主视图和应用视图
    private _listenerViewMap: Record<string, AppProxy | null | undefined> = {}; // 监听的视图列表
    private _pointMap: Record<string, HTMLElement | null> = {}; // 记录的坐标点
    private _teacherMoveThrottle?: (position: LaserPointerPosition, viewId: string) => void; // 老师端位置发送节流函数
    private _mainViewId = 'mainViewId';// 主视图ID
    private _currentPointActive = false; // 当前激光笔是否激活

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
    constructor(manager: WindowManager) {
        this._manager = manager;
        this.addWindowManagerListeners();
        this.addEventListeners();
    }

    /**
     * 添加窗口管理器事件监听
     */
    private addWindowManagerListeners() {
        // 监听应用视图挂载事件
        this._manager.emitter.on("onAppViewMounted", (payload) => {
            console.log(`${logFirstTag} onAppViewMounted event received for app:`, payload);
            // 为应用视图创建激光笔管理器，使用 boxview
            const appBox = this._manager?.appManager?.appProxies?.get(payload.appId);
            console.log(`${logFirstTag} App box view for ${payload.appId}:`, !!appBox);
            if (appBox) {
                console.log(`${logFirstTag} Creating laser pointer manager for app:`, appBox);
                this._listenerViewMap[payload.appId] = appBox;
            } else {
                console.warn(`${logFirstTag} Failed to get app box view for:`, payload.appId);
            }
        });

        this._manager.emitter.on("onBoxClose", (payload) => {
            console.log(`${logFirstTag} onAppViewUnmounted event received for app:`, payload);
            const appBox = this._manager?.appManager?.appProxies?.get(payload.appId);
            if (appBox) {
                this._listenerViewMap[payload.appId] = null;
                this._pointMap[payload.appId] = null;
            }
        });
        // 监听老师激光笔移动事件
        this._manager.displayer?.addMagixEventListener('teacherLaserPointerMove', (event: any) => {
            console.info(`${logFirstTag} 收到老师激光笔移动事件:`, event);
            if (event.payload.sendUserId === this._manager.room.uid) {
                console.info(`${logFirstTag} 跳过自己的事件`);
                return;
            }
            let view = this._manager.appManager?.appProxies?.get(event.payload.viewId)?.view;
            if (view == null) {
                if (this._manager.mainView != null && this._mainViewId === event.payload.viewId) {
                    view = this._manager.mainView;
                }
            }
            let point = null
            if (view == null) {
                console.info(`${logFirstTag} 找不到视图ID:`, event.payload.viewId);
            } else {
                if (this._mainViewId !== event.payload.viewId) {
                    view.divElement?.classList.add('teacher-current-pointer-enevnt-auto');
                }
                //接收到坐标信息进行转换
                point = view.convertToPointOnScreen(event.payload.position.x, event.payload.position.y);
                if (point == null) {
                    console.info(`${logFirstTag} 转换失败:`, event.payload.position);
                } else {
                    console.info(`${logFirstTag} 转换成功:`, event.payload.viewId, point);
                }
            }
            this._showPointIcon(event.payload.viewId, view, point);
        });
    }

    /**
     * 将事件挂载的document上
     */
    private addEventListeners() {
        const teacherInfo = this._manager.appManager?.store.getTeacherInfo();
        if (this._manager.room.uid === teacherInfo?.uid) {
            if (!this._teacherMoveThrottle) {
                this._teacherMoveThrottle = throttle((position: LaserPointerPosition, viewId: string) => {
                    console.log(`${logFirstTag} 发送老师位置: 位置=${JSON.stringify(position)}`);
                    const teacherInfo = this._manager.appManager?.store.getTeacherInfo();
                    this._manager.room?.dispatchMagixEvent('teacherLaserPointerMove', { position, viewId: viewId, sendUserId: teacherInfo?.uid, timestamp: Date.now() });
                }, 150);
            }
            //判断是否需要初始化三个监听，没有初始化的话初始化，最后在添加
            if (!this._boundHandleTeacherMouseMove) {
                this._boundHandleTeacherMouseMove = (event: MouseEvent) => {
                    if (!this._currentPointActive) {
                        return;
                    }
                    // 对 this._listenerViewMap 的 value 进行排序，zIndex 最大的放在前面
                    const sortedViewMap = Object.entries(this._listenerViewMap)
                        .sort((a, b) => {
                            const zIndexA = a[1]?.box?.zIndex ?? 0;
                            const zIndexB = b[1]?.box?.zIndex ?? 0;
                            return zIndexB - zIndexA;
                        })
                        .map(item => ({ key: item[0], value: item[1] }));
                    let position: { x: number; y: number } | null = null;
                    let viewId: string | null = null;
                    let currentView: any = null;
                    for (const item of sortedViewMap) {
                        const id = item.key;
                        const view = item.value;
                        if (view?.view) {
                            const offset = this._getViewOffset(view?.view, event);
                            if (offset) {
                                viewId = id;
                                position = offset;
                                currentView = view.view;
                                break;
                            }
                        }
                    }
                    if (!position) {
                        const offset = this._getViewOffset(this._manager.mainView, event);
                        if (offset) {
                            viewId = this._mainViewId;
                            position = offset;
                            currentView = this._manager.mainView;
                        }
                    }
                    if (position && viewId) {
                        const point = currentView.convertToPointInWorld({ x: position.x, y: position.y });
                        console.log(`${logFirstTag} [${viewId}] 鼠标移动处理,当前窗口偏移：${JSON.stringify(position)} 转换至view偏移:`, JSON.stringify(point));
                        this._teacherMoveThrottle?.(point, viewId);
                    } else {
                        console.log(`${logFirstTag} 找不到视图ID:`, viewId);
                        this._teacherMoveThrottle?.({ x: -1, y: -1 }, '');

                    }
                }
            }
            document.addEventListener('mousemove', this._boundHandleTeacherMouseMove);
        }
    }
    /**
     * 移除事件监听
     */
    private removeEventListeners() {
        if (this._boundHandleTeacherMouseMove) {
            document.removeEventListener('mousemove', this._boundHandleTeacherMouseMove);
        }
    }

    /**
     * 设置激光笔激活状态
     * 控制激光笔功能的开启和关闭，包括鼠标事件监听器的添加和移除
     * @param active 是否激活激光笔功能，true为激活，false为停用
     */
    public setLaserPointer(active: boolean): void {
        console.log(`${logFirstTag} 设置激光笔状态:`, active);
        this._currentPointActive = active;
    }


    // 销毁激光笔管理器
    public destroy() {
        this.removeEventListeners();
        this._pointMap = {};
        this._listenerViewMap = {};
        this._teacherMoveThrottle = undefined;
        this._boundHandleTeacherMouseMove = undefined;
        this._currentPointActive = false;
        this._mainViewId = 'mainViewId';
        this._manager.displayer?.removeMagixEventListener('teacherLaserPointerMove');
        this._manager.appManager?.refresher?.remove(Fields.LaserPointerActive);
        this._manager.appManager?.refresher?.remove(Fields.Scale);
    }




    /**
     * 获取视图的偏移量
     * @param view 视图
     * @param event 鼠标事件
     * @returns 偏移量
     */
    private _getViewOffset(view: View, event: MouseEvent): LaserPointerPosition | null {
        const divElement = this._getViewDivElement(view);
        if (divElement && divElement instanceof HTMLDivElement) {
            const targetPoint = PointerTranslation.getTargetPoint(event, document.documentElement as HTMLDivElement, divElement);
            const rect = divElement.getBoundingClientRect()
            if (targetPoint && targetPoint[0] >= 0 && targetPoint[1] >= 0 && targetPoint[0] <= rect.width && targetPoint[1] <= rect.height) {
                return { x: targetPoint[0], y: targetPoint[1] };
            }
        }
        return null;
    }

    /**
     * 获取视图的div元素
     * @param view 视图
     * @returns div元素
     */
    private _getViewDivElement(view: View): HTMLElement | null {
        const children = view.divElement?.children;
        if (children && children.length > 0) {
            return children[0] as HTMLElement;
        }
        return null;
    }

    /**
     * 显示坐标点
     * @param view 视图
     * @param point 坐标点
     */
    private _showPointIcon(viewId: string, view: View | undefined, point: Point | null) {
        let icon = this._pointMap[viewId]
        if (!icon) {
            icon = document.createElement('div');
            icon.className = 'teacher-laser-pointer';
            icon.style.display = 'none';
            // 添加到当前视图容器
            if (view) {
                this._getViewDivElement(view)?.appendChild(icon);
                console.log(`${logFirstTag} [${viewId}] 激光笔图标已添加到视图容器`);
                this._pointMap[viewId] = icon;
            }
        }

        Object.entries(this._pointMap).forEach(([key, value]) => {
            if (key !== viewId && value) {
                console.log(`${logFirstTag} [${key}] 激光笔图标已隐藏`);
                value.style.display = 'none';
            }
        });
        if (point) {
            console.log(`${logFirstTag} [${viewId}] 激光笔图标已显示`);
            icon.style.left = `${point.x}px`;
            icon.style.top = `${point.y}px`;
            icon.style.display = 'block';
        } else {
            icon.style.display = 'none';
        }
    }

}


/**
 * 坐标点接口
 */
interface Point {
    x: number;
    y: number;
}

/**
 * 指针转换工具类
 * 用于处理鼠标事件坐标与DOM元素坐标之间的转换
 */
class PointerTranslation {
    /**
     * 获取鼠标事件在目标元素中的相对坐标
     * @param event 鼠标事件
     * @param listener 监听器元素
     * @param target 目标元素
     * @returns 相对坐标 [x, y] 或 null
     */
    public static getTargetPoint(
        event: MouseEvent,
        listener: HTMLDivElement,
        target: HTMLDivElement
    ): [number, number] | null {
        const targetOffset = this.getContainerOffset(target, { x: 0, y: 0 });
        const listenerOffset = this.getContainerOffset(listener, { x: 0, y: 0 });

        const offset = {
            x: targetOffset.x - listenerOffset.x,
            y: targetOffset.y - listenerOffset.y,
        };

        const point = this.getPosition(event);
        if (point && isNumber(point.x) && isNumber(point.y)) {
            return [
                point.x - offset.x,
                point.y - offset.y, // 修复了原来的错误：应该是 offset.y 而不是 offset.x
            ];
        }

        return null;
    }

    /**
     * 获取鼠标事件的页面坐标
     * @param event 鼠标事件
     * @returns 页面坐标点
     */
    private static getPosition(event: MouseEvent): Point {
        return {
            x: event.pageX,
            y: event.pageY,
        };
    }

    /**
     * 获取元素的transform变换值
     * @param element DOM元素
     * @returns [translateX, translateY]
     */
    private static getTranslate(element: HTMLElement): [number, number] {
        const transformMatrix =
            (element.style as any)["WebkitTransform"] ||
            getComputedStyle(element, "").getPropertyValue("-webkit-transform") ||
            (element.style as any)["transform"] ||
            getComputedStyle(element, "").getPropertyValue("transform");

        const matrix = transformMatrix.match(/-?[0-9]+\.?[0-9]*/g);
        const x = (matrix && parseInt(matrix[0])) || 0; // translate x
        const y = (matrix && parseInt(matrix[1])) || 0; // translate y
        return [x, y];
    }

    /**
     * 递归计算容器元素的偏移量
     * @param eventTarget 目标元素
     * @param offset 初始偏移量
     * @returns 计算后的偏移量
     */
    private static getContainerOffset(
        eventTarget: HTMLDivElement,
        offset: Point
    ): Point {
        const translate = this.getTranslate(eventTarget);
        let newOffset: Point = {
            x: offset.x + eventTarget.offsetLeft - eventTarget.scrollLeft + translate[0],
            y: offset.y + eventTarget.offsetTop - eventTarget.scrollTop + translate[1],
        };

        if (
            eventTarget.offsetParent?.nodeName &&
            eventTarget.offsetParent.nodeName !== "BODY"
        ) {
            newOffset = this.getContainerOffset(
                eventTarget.offsetParent as HTMLDivElement,
                newOffset
            );
        }

        return newOffset;
    }

    /**
     * 获取元素相对于视口的坐标
     * @param element DOM元素
     * @returns 视口坐标点
     */
    public static getElementViewportPosition(element: HTMLElement): Point {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top,
        };
    }

    /**
     * 将页面坐标转换为元素相对坐标
     * @param pagePoint 页面坐标点
     * @param element 目标元素
     * @returns 元素相对坐标点
     */
    public static pageToElementCoordinates(pagePoint: Point, element: HTMLElement): Point {
        const elementOffset = this.getContainerOffset(element as HTMLDivElement, { x: 0, y: 0 });
        return {
            x: pagePoint.x - elementOffset.x,
            y: pagePoint.y - elementOffset.y,
        };
    }

    /**
     * 将元素相对坐标转换为页面坐标
     * @param elementPoint 元素相对坐标点
     * @param element 目标元素
     * @returns 页面坐标点
     */
    public static elementToPageCoordinates(elementPoint: Point, element: HTMLElement): Point {
        const elementOffset = this.getContainerOffset(element as HTMLDivElement, { x: 0, y: 0 });
        return {
            x: elementPoint.x + elementOffset.x,
            y: elementPoint.y + elementOffset.y,
        };
    }
}