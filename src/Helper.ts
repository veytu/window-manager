import pRetry from "p-retry";
import type { Room, RoomMember } from "white-web-sdk";
import { WhiteVersion } from "white-web-sdk";
import { REQUIRE_VERSION } from "./constants";
import { WindowManager } from "./index";
import { getVersionNumber } from "./Utils/Common";
import { WhiteWebSDKInvalidError } from "./Utils/error";
import { log } from "./Utils/log";
import { isAndroid, isIOS } from "./Utils/environment";

export const setupWrapper = (
    root: HTMLElement
): {
    playground: HTMLDivElement;
    wrapper: HTMLDivElement;
    sizer: HTMLDivElement;
    mainViewElement: HTMLDivElement;
    mainViewWrapper: HTMLDivElement;
    mainViewWrapperShadow: HTMLDivElement;
    extendWrapper: HTMLDivElement;
    mainViewScrollWrapper: HTMLDivElement;
} => {
    const playground = document.createElement("div");
    playground.className = "netless-window-manager-playground";

    const sizer = document.createElement("div");
    sizer.className = "netless-window-manager-sizer";

    const wrapper = document.createElement("div");
    wrapper.className = "netless-window-manager-wrapper";

    const mainViewScrollWrapper = document.createElement("div");

    mainViewScrollWrapper.className = "netless-window-manager-wrapper netless-window-manager-fancy-scrollbar"
    mainViewScrollWrapper.classList.toggle('netless-window-manager-fancy-scrollbar-readonly', Boolean(isAndroid() || isIOS()))
    const mainViewWrapperShadow = document.createElement("div");
    mainViewWrapperShadow.className = "netless-window-manager-main-view-wrapper netless-window-manager-main-view-wrapper-shadow"

    const mainViewWrapper = document.createElement("div");
    mainViewWrapper.className = "netless-window-manager-main-view-wrapper netless-window-manager-main-view-wrp"

    const mainViewElement = document.createElement("div");
    mainViewElement.className = "netless-window-manager-main-view";

    const extendWrapper = document.createElement('div')
    extendWrapper.style.display = 'none'

    
    playground.appendChild(sizer);
    playground.appendChild(extendWrapper)
    sizer.appendChild(wrapper);
    mainViewWrapper.appendChild(mainViewElement);
    mainViewScrollWrapper.appendChild(mainViewWrapperShadow)
    mainViewScrollWrapper.appendChild(mainViewWrapper);
    wrapper.appendChild(mainViewScrollWrapper);
    root.appendChild(playground);
    WindowManager.wrapper = wrapper;

    return { playground, wrapper, sizer, mainViewElement, mainViewWrapperShadow, mainViewWrapper, extendWrapper, mainViewScrollWrapper };
};

export const checkVersion = () => {
    const version = getVersionNumber(WhiteVersion);
    if (version < getVersionNumber(REQUIRE_VERSION)) {
        throw new WhiteWebSDKInvalidError(REQUIRE_VERSION);
    }
};

export const findMemberByUid = (room: Room | undefined, uid: string) => {
    const roomMembers = room?.state.roomMembers || [];
    let maxMemberId = -1; // 第一个进入房间的用户 memberId 是 0
    let result: RoomMember | undefined = undefined;
    for (const member of roomMembers) {
        if (member.payload?.uid === uid && maxMemberId < member.memberId) {
            maxMemberId = member.memberId;
            result = member;
        }
    }
    return result;
};

export const createInvisiblePlugin = async (room: Room): Promise<WindowManager> => {
    let manager = room.getInvisiblePlugin(WindowManager.kind) as WindowManager;
    if (manager) return manager;

    let resolve!: (manager: WindowManager) => void;
    const promise = new Promise<WindowManager>(r => {
        // @ts-expect-error Set private property.
        WindowManager._resolve = resolve = r;
    });

    let wasReadonly = false;
    const canOperate = isRoomTokenWritable(room);
    if (!room.isWritable && canOperate) {
        wasReadonly = true;
        await pRetry(
            async count => {
                log(`switching to writable (x${count})`);
                await room.setWritable(true);
            },
            { retries: 10, maxTimeout: 5000 }
        );
    }
    if (room.isWritable) {
        log("creating InvisiblePlugin...");
        room.createInvisiblePlugin(WindowManager, {}).catch(console.warn);
    } else {
        if (canOperate) console.warn("[WindowManager]: failed to switch to writable");
        console.warn("[WindowManager]: waiting for others to create the plugin...");
    }

    const timeout = setTimeout(() => {
        console.warn("[WindowManager]: no one called createInvisiblePlugin() after 20 seconds");
    }, 20_000);

    const abort = setTimeout(() => {
        throw new Error("[WindowManager]: no one called createInvisiblePlugin() after 60 seconds");
    }, 60_000);

    const interval = setInterval(() => {
        manager = room.getInvisiblePlugin(WindowManager.kind) as WindowManager;
        if (manager) {
            clearTimeout(abort);
            clearTimeout(timeout);
            clearInterval(interval);
            resolve(manager);
            if (wasReadonly && room.isWritable) {
                setTimeout(() => room.setWritable(false).catch(console.warn), 500);
            }
        }
    }, 200);

    return promise;
};

const isRoomTokenWritable = (room: Room) => {
    try {
        const str = atob(room.roomToken.slice("NETLESSROOM_".length));
        const index = str.indexOf("&role=");
        const role = +str[index + "&role=".length];
        return role < 2;
    } catch (error) {
        console.error(error);
        return false;
    }
};
