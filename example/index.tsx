import React, { useEffect, useState, useRef } from "react";
import ReactDom from "react-dom";
import { PlayerPhase, WhiteWebSdk } from "white-web-sdk";
import {
    createStatic,
    createDynamic,
    createHelloWorld,
    createVideo,
    createSlide,
    createCounter,
    createBoard,
    createIframe,
} from "./apps";
import "../dist/style.css";
import "./register";
import "./index.css";
import { DefaultHotKeys } from "white-web-sdk";
import { WindowManager, BuiltinApps, mainViewField } from "../src";
import type {WindowManager as WindowManagerType} from '../src'

const sdkToken = "NETLESSSDK_YWs9dEtEY055dDliNFZHRTFkeiZub25jZT02NDdkODY5MC1lOWMyLTExZWYtYmQ2OS01Nzc1NjRkMzRmOTcmcm9sZT0wJnNpZz1iY2U5NmJjM2FiMTcyNDJiOTRmMmQ2M2U2Y2I4ZTk4ZDFlZjBiMjYwYzJkYjAwNjMzNjQ1YjcyMGZhZGQ3OWNh"

const sdk = new WhiteWebSdk({
    appIdentifier: 'U0vvIOnBEe-MW3XOVZtvLQ/KJdZSKsTjrpcrw',
    useMobXState: true,
});

const anyWindow = window as any;

(window as any).WindowManager = WindowManager;

let firstPlay = false;

const search = window.location.search;
const url = new URLSearchParams(search);
const isWritable = url.get("isWritable");
const isReplay = url.get("isReplay");
const cursor = url.get("cursor") === "false" ? false : true;

let manager: WindowManagerType;

const mountManager = async (room, root) => {
    manager = (await WindowManager.mount({
        room,
        // collectorStyles: { bottom: "100px", left: "30px" },
        containerSizeRatio: 2 / 3,
        chessboard: true,
        // fullscreen: true,
        debug: true,
        cursor,
        // cursorOptions: { style: "custom" },
        // overwriteStyles: ".netless-window-manager-cursor-name { display: none }",
    })) as WindowManagerType;

    manager.emitter.on("ready", async () => {
        if (isWritable === "false") {
            manager.setViewMode("freedom" as any);
        }
    });

    manager.bindContainer(root);

    console.log("manager apps", manager.queryAll());
    console.log("manager mounted boxState:", manager.boxState);
    (window as any).manager = manager;
    manager.onAppDestroy(BuiltinApps.DocsViewer, error => {
        console.log("onAppDestroy", error);
    });

    manager.onAppEvent(BuiltinApps.DocsViewer, event => {
        console.log("onAppEvent", event);
    });

    manager.onAppEvent("Board", event => {
        console.log("onAppEvent", event);
    });

    manager.emitter.on("mainViewModeChange", mode => {
        console.log("mode", mode);
    });

    manager.emitter.on("boxStateChange", state => {
        console.log("boxStateChange:", state);
    });

    manager.emitter.on("fullscreenChange", state => {
        console.log("fullscreenChange:", state);
    });

    manager.emitter.on("appsChange", apps => {
        console.log("appsChange:", apps);
    });

    manager.emitter.on("mainViewScenePathChange", path => {
        console.log("mainViewScenePathChange", path);
    });
    manager.emitter.on("mainViewSceneIndexChange", index => {
        console.log("mainViewSceneIndexChange", index);
    });
    manager.emitter.on("focusedChange", focus => {
        console.log("focusedChange", focus);
    });
    manager.emitter.on("mainViewScenesLengthChange", length => {
        console.log("mainViewScenesLengthChange", length);
    });
    manager.emitter.on("canRedoStepsChange", steps => {
        console.log("canRedoStepsChange", steps);
    });
    manager.emitter.on("canUndoStepsChange", steps => {
        console.log("canUndoStepsChange", steps);
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    manager.emitter.on("cameraStateChange", state => {
        // console.log("cameraStateChange", state);
    });

    manager.emitter.on("sceneStateChange", state => {
        console.log("sceneStateChange", state);
    });

    manager.emitter.on("loadApp", payload => {
        console.log("loadApp", payload);
    });

    manager.emitter.on("pageStateChange", state => {
        console.log("pageStateChange", state);
    });
};

const replay = (info: {room: string; roomToken: string}) => {
    if (!info) return
    sdk.replayRoom({
        room: info.room,
        roomToken: info.roomToken,
        invisiblePlugins: [WindowManager as any],
        useMultiViews: true,
    }).then(async player => {
        await manager?.destroy();
        anyWindow.room?.disconnect();
        setTimeout(async () => {
            anyWindow.player = player;
            // player.bindHtmlElement(document.getElementById("container") as any)
            player.play();
        }, 500);
        player.callbacks.on("onPhaseChanged", phase => {
            if (phase === PlayerPhase.Playing) {
                if (firstPlay) return;
                setTimeout(() => {
                    mountManager(player, document.getElementById("container"));
                }, 1000);
                firstPlay = true;
            }
        });
    });
};

const joinRoom = (ref: any, info: {room: string; roomToken: string}) => {
    const uid = Math.random().toString().substr(3, 8);
    if (isReplay) {
        replay(info);
    } else {
        return sdk
            .joinRoom({
                uuid: info.room,
                roomToken: info.roomToken,
                invisiblePlugins: [WindowManager as any],
                useMultiViews: true,
                userPayload: {
                    userId: "111",
                    cursorName: uid,
                    avatar: "https://avatars.githubusercontent.com/u/8299540?s=60&v=4",
                },
                isWritable: !(isWritable === "false"),
                cursorAdapter: undefined,
                uid: uid,
                disableMagixEventDispatchLimit: true,
                disableNewPencil: false,
                floatBar: true,
                hotKeys: {
                    ...DefaultHotKeys,
                    changeToClick: "c",
                    changeToSelector: "s",
                    changeToPencil: "p",
                    changeToEraser: "e",
                },
            })
            .then(async room => {
                (window as any).room = room;
                return await mountManager(room, ref);
            });
    }
};

const destroy = () => {
    manager.destroy();
    manager = undefined;
};

anyWindow.mountManager = mountManager;
anyWindow.destroy = destroy;

const prevPage = (manager: WindowManager) => {
    manager.prevPage();
};

const nextPage = (manager: WindowManager) => {
    manager.nextPage();
};

const addPage = (manager: WindowManager) => manager.addPage();

const cleanCurrentScene = (manager: WindowManager) => {
    manager.cleanCurrentScene();
};

const App = () => {
    const [pageState, setPageState] = useState({});
    const ref = useRef();
    const [roomInfo, setRoomInfo] = useState<{room: string | undefined, roomToken: string | undefined}>({
        room: undefined,
        roomToken: undefined,
    });


    const getRoomToken = async () => {
        const headers = {
            "content-type": "application/json",
            "token": sdkToken,
            "region": "cn-hz",
        }
        fetch("https://api.netless.link/v5/rooms", {
            method: "POST",
            headers
        }).then(res => res.json()).then((json) => {
             // 创建房间成功，获取房间的 uuid
            const roomUUID = json.uuid;

            // 构造申请 Room Token 的 Request
            const url = "https://api.netless.link/v5/tokens/rooms/" + roomUUID;
            const requestInit = {
                method: "POST",
                headers,
                body: JSON.stringify({
                    "lifespan": 0, // 表明 Room Token 永不失效
                    "role": "admin", // 表明 Room Token 有 Admin 的权限
                }),
            };
            fetch(url, requestInit).then(function(response) {
                return response.json();

            }).then(function(roomToken) {
                setRoomInfo({
                    room: json.uuid,
                    roomToken
                })
            }).catch(function(err) {
                console.error(err);
            });
        })
    }

    useEffect(() => {
        getRoomToken()
    }, [])

    useEffect(() => {
        if (!roomInfo.room) return
        joinRoom(ref.current, roomInfo).then(() => {
            if (manager) {
                setPageState(manager.pageState);
                // createIframe(manager);
                return manager.emitter.on("pageStateChange", state => {
                    setPageState(state);
                });
            }
        });
    }, [ref, roomInfo]);

    return (
        <div className="app">
            <div
                ref={ref}
                id="container"
                style={{
                    flex: 1,
                    height: "calc(100vh - 32px)",
                    border: "1px solid",
                    resize: "auto",
                    overflow: "scroll",
                }}
            ></div>
            <div className="side">
                <button className="side-button" onClick={() => createHelloWorld(manager)}>
                    Hello World
                </button>
                <button className="side-button" onClick={() => createCounter(manager)}>
                    Counter
                </button>
                <button className="side-button" onClick={() => createBoard(manager)}>
                    Board
                </button>
                <button className="side-button" onClick={() => createStatic(manager)}>
                    课件 static
                </button>
                <button className="side-button" onClick={() => createDynamic(manager)}>
                    课件 dynamic
                </button>
                <button className="side-button" onClick={() => createSlide(manager)}>
                    Slide
                </button>
                <button className="side-button" onClick={() => createVideo(manager)}>
                    视频
                </button>
                <button className="side-button" onClick={() => createIframe(manager)}>
                    Iframe Bridge
                </button>
                <button className="side-button" onClick={replay}>
                    回放
                </button>
                <button className="side-button" onClick={() => prevPage(manager)}>
                    上一页
                </button>
                <button className="side-button" onClick={() => nextPage(manager)}>
                    下一页
                </button>
                <button className="side-button" onClick={() => addPage(manager)}>
                    加一页
                </button>
                <button className="side-button" onClick={() => cleanCurrentScene(manager)}>
                    清屏
                </button>
                <button className="side-button" onClick={() => manager.setBackgroundColor('#000')}>
                    背景色
                </button>
                <button className="side-button" onClick={() => {
                    manager.setScale(mainViewField, manager.getScale()?.[mainViewField] + 0.5)
                    setTimeout(() => {
                        manager.scrollerManager?.moveToCenter()
                    })
                }}>
                    zoomout
                </button>
                <button className="side-button" onClick={() => {
                    manager.setScale(mainViewField, manager.getScale()?.[mainViewField] - 0.5)
                }}>
                    zoomin
                </button>
                <span>
                    {pageState.index}/{pageState.length}
                </span>
            </div>
        </div>
    );
};

ReactDom.render(<App />, document.getElementById("root"));
