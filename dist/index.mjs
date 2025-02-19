import pRetry from "p-retry";
import Emittery from "emittery";
import { debounce, isEqual, omit, isObject, has, get, size as size$1, mapValues, noop as noop$2, pick, isEmpty, isInteger, orderBy, isFunction, isString, isNumber, isNull } from "lodash";
import { ScenePathType, UpdateEventKind, listenUpdated, unlistenUpdated, reaction, autorun, toJS, listenDisposed, unlistenDisposed, ViewMode, AnimationMode, isPlayer, isRoom, WhiteVersion, ApplianceNames, RoomPhase, PlayerPhase, InvisiblePlugin } from "white-web-sdk";
import { v4 } from "uuid";
import { ResizeObserver as ResizeObserver$3 } from "@juggle/resize-observer";
import u$3 from "video.js";
var Events = /* @__PURE__ */ ((Events2) => {
  Events2["AppMove"] = "AppMove";
  Events2["AppFocus"] = "AppFocus";
  Events2["AppResize"] = "AppResize";
  Events2["AppBoxStateChange"] = "AppBoxStateChange";
  Events2["GetAttributes"] = "GetAttributes";
  Events2["UpdateWindowManagerWrapper"] = "UpdateWindowManagerWrapper";
  Events2["InitReplay"] = "InitReplay";
  Events2["WindowCreated"] = "WindowCreated";
  Events2["SetMainViewScenePath"] = "SetMainViewScenePath";
  Events2["SetMainViewSceneIndex"] = "SetMainViewSceneIndex";
  Events2["SetAppFocusIndex"] = "SetAppFocusIndex";
  Events2["SwitchViewsToFreedom"] = "SwitchViewsToFreedom";
  Events2["MoveCamera"] = "MoveCamera";
  Events2["MoveCameraToContain"] = "MoveCameraToContain";
  Events2["CursorMove"] = "CursorMove";
  Events2["RootDirRemoved"] = "RootDirRemoved";
  Events2["Refresh"] = "Refresh";
  Events2["InitMainViewCamera"] = "InitMainViewCamera";
  return Events2;
})(Events || {});
const MagixEventName = "__WindowManger";
const EnsureReconnectEvent = "__WindowMangerEnsureReconnected__";
var AppAttributes = /* @__PURE__ */ ((AppAttributes2) => {
  AppAttributes2["Size"] = "size";
  AppAttributes2["Position"] = "position";
  AppAttributes2["SceneIndex"] = "SceneIndex";
  AppAttributes2["ZIndex"] = "zIndex";
  return AppAttributes2;
})(AppAttributes || {});
var AppEvents = /* @__PURE__ */ ((AppEvents2) => {
  AppEvents2["setBoxSize"] = "setBoxSize";
  AppEvents2["setBoxMinSize"] = "setBoxMinSize";
  AppEvents2["destroy"] = "destroy";
  return AppEvents2;
})(AppEvents || {});
var AppStatus = /* @__PURE__ */ ((AppStatus2) => {
  AppStatus2["StartCreate"] = "StartCreate";
  return AppStatus2;
})(AppStatus || {});
var CursorState = /* @__PURE__ */ ((CursorState2) => {
  CursorState2["Leave"] = "leave";
  CursorState2["Normal"] = "normal";
  return CursorState2;
})(CursorState || {});
const REQUIRE_VERSION = "2.16.1";
const MIN_WIDTH = 340 / 720;
const MIN_HEIGHT = 340 / 720;
const DEFAULT_CONTAINER_RATIO = 9 / 16;
const ROOT_DIR = "/";
const INIT_DIR = "/init";
const SETUP_APP_DELAY = 50;
const callbacks$1 = new Emittery();
class AppCreateQueue {
  constructor() {
    this.list = [];
    this.isEmit = false;
    this.invoked = () => {
      this.currentInvoker = void 0;
      if (this.list.length === 0) {
        this.clear();
        this.emitReady();
      }
    };
    this.clear = () => {
      clearInterval(this.timer);
      this.timer = void 0;
    };
  }
  initInterval() {
    return setInterval(() => {
      this.invoke();
    }, 50);
  }
  push(item) {
    this.list.push(item);
    this.invoke();
    if (this.timer === void 0 && this.list.length > 0) {
      this.timer = this.initInterval();
    }
  }
  invoke() {
    if (this.list.length === 0) {
      return;
    }
    if (this.currentInvoker !== void 0) {
      return;
    }
    const item = this.list.shift();
    if (item) {
      this.currentInvoker = item;
      item().then(() => {
        this.invoked();
      }).catch((error) => {
        console.error(`[WindowManager]: create app error: ${error.message}`);
        this.invoked();
      });
    }
  }
  emitReady() {
    if (!this.isEmit) {
      setTimeout(() => {
        callbacks$1.emit("ready");
      }, SETUP_APP_DELAY);
    }
    this.isEmit = true;
  }
  empty() {
    this.list = [];
    this.clear();
  }
  destroy() {
    if (this.timer) {
      this.clear();
    }
  }
}
const internalEmitter = new Emittery();
const DatabaseName = "__WindowManagerAppCache";
let db$1;
let store$1;
const initDb = async () => {
  db$1 = await createDb();
};
const setItem = (key, val) => {
  if (!db$1)
    return;
  return addRecord(db$1, { kind: key, sourceCode: val });
};
const getItem = async (key) => {
  if (!db$1)
    return null;
  return await query(db$1, key);
};
function createDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DatabaseName, 2);
    request.onerror = (e2) => {
      reject(e2);
    };
    request.onupgradeneeded = (event) => {
      const db2 = event.target.result;
      if (!db2.objectStoreNames.contains("apps")) {
        store$1 = db2.createObjectStore("apps", { keyPath: "kind" });
        store$1.createIndex("kind", "kind", { unique: true });
      }
    };
    request.onsuccess = () => {
      const db2 = request.result;
      resolve(db2);
    };
  });
}
function query(db2, val) {
  return new Promise((resolve, reject) => {
    const index2 = db2.transaction(["apps"]).objectStore("apps").index("kind");
    const request = index2.get(val);
    request.onerror = (e2) => reject(e2);
    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result);
      } else {
        resolve(null);
      }
    };
  });
}
function addRecord(db2, payload) {
  return new Promise((resolve, reject) => {
    const request = db2.transaction(["apps"], "readwrite").objectStore("apps").add(payload);
    request.onsuccess = () => resolve();
    request.onerror = () => reject();
  });
}
const Prefix = "NetlessApp";
const TIMEOUT = 1e4;
const getScript = async (url) => {
  const item = await getItem(url);
  if (item) {
    return item.sourceCode;
  } else {
    const result = await fetchWithTimeout(url, { timeout: TIMEOUT });
    const text2 = await result.text();
    await setItem(url, text2);
    return text2;
  }
};
const executeScript = (text2, appName) => {
  let result = Function(text2 + `
;return ${appName}`)();
  if (typeof result === "undefined") {
    result = window[appName];
  }
  return result;
};
const loadApp = async (url, key, name) => {
  const appName = name || Prefix + key;
  callbacks$1.emit("loadApp", { kind: key, status: "start" });
  let text2;
  try {
    text2 = await getScript(url);
    if (!text2 || text2.length === 0) {
      callbacks$1.emit("loadApp", { kind: key, status: "failed", reason: "script is empty." });
      throw new Error("[WindowManager]: script is empty.");
    }
  } catch (error) {
    callbacks$1.emit("loadApp", { kind: key, status: "failed", reason: error.message });
    throw error;
  }
  return getResult(text2, appName, key);
};
const getResult = (text2, appName, key) => {
  try {
    const result = executeScript(text2, appName);
    callbacks$1.emit("loadApp", { kind: key, status: "success" });
    return result;
  } catch (error) {
    if (error.message.includes("Can only have one anonymous define call per script file")) {
      const define = window.define;
      if ("function" == typeof define && define.amd) {
        delete define.amd;
      }
      const result = executeScript(text2, appName);
      callbacks$1.emit("loadApp", { kind: key, status: "success" });
      return result;
    }
    callbacks$1.emit("loadApp", { kind: key, status: "failed", reason: error.message });
    throw error;
  }
};
async function fetchWithTimeout(resource, options) {
  const { timeout = 1e4 } = options;
  const controller = new AbortController();
  const id2 = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal,
    headers: {
      "content-type": "text/plain"
    }
  });
  clearTimeout(id2);
  return response;
}
class AppRegister {
  constructor() {
    this.kindEmitters = /* @__PURE__ */ new Map();
    this.registered = /* @__PURE__ */ new Map();
    this.appClassesCache = /* @__PURE__ */ new Map();
    this.appClasses = /* @__PURE__ */ new Map();
    this.syncRegisterApp = null;
    this.onSyncRegisterAppChange = (payload) => {
      this.register({ kind: payload.kind, src: payload.src });
    };
  }
  setSyncRegisterApp(fn) {
    this.syncRegisterApp = fn;
  }
  async register(params) {
    this.appClassesCache.delete(params.kind);
    this.registered.set(params.kind, params);
    const paramSrc = params.src;
    let downloadApp;
    if (typeof paramSrc === "string") {
      downloadApp = async () => {
        const result = await loadApp(paramSrc, params.kind, params.name);
        if (result.__esModule) {
          return result.default;
        }
        return result;
      };
      if (this.syncRegisterApp) {
        this.syncRegisterApp({ kind: params.kind, src: paramSrc, name: params.name });
      }
    }
    if (typeof paramSrc === "function") {
      downloadApp = async () => {
        let appClass = await paramSrc();
        if (appClass) {
          if (appClass.__esModule || appClass.default) {
            appClass = appClass.default;
          }
          return appClass;
        } else {
          throw new Error(`[WindowManager]: load remote script failed, ${paramSrc}`);
        }
      };
    }
    if (typeof paramSrc === "object") {
      downloadApp = async () => paramSrc;
    }
    this.appClasses.set(params.kind, async () => {
      let app = this.appClassesCache.get(params.kind);
      if (!app) {
        app = downloadApp();
        this.appClassesCache.set(params.kind, app);
      }
      return app;
    });
    if (params.addHooks) {
      const emitter = this.createKindEmitter(params.kind);
      if (emitter) {
        params.addHooks(emitter);
      }
    }
  }
  unregister(kind2) {
    this.appClasses.delete(kind2);
    this.appClassesCache.delete(kind2);
    this.registered.delete(kind2);
    const kindEmitter = this.kindEmitters.get(kind2);
    if (kindEmitter) {
      kindEmitter.clearListeners();
      this.kindEmitters.delete(kind2);
    }
  }
  async notifyApp(kind2, event, payload) {
    const emitter = this.kindEmitters.get(kind2);
    await (emitter == null ? void 0 : emitter.emit(event, payload));
  }
  createKindEmitter(kind2) {
    if (!this.kindEmitters.has(kind2)) {
      const emitter = new Emittery();
      this.kindEmitters.set(kind2, emitter);
    }
    return this.kindEmitters.get(kind2);
  }
}
const appRegister = new AppRegister();
const genAppId = async (kind2) => {
  var _a, _b;
  const impl = await ((_a = appRegister.appClasses.get(kind2)) == null ? void 0 : _a());
  if (impl && ((_b = impl.config) == null ? void 0 : _b.singleton)) {
    return kind2;
  }
  return `${kind2}-${v4().replace("-", "").slice(0, 8)}`;
};
const setViewFocusScenePath = (view, focusScenePath) => {
  if (view.focusScenePath !== focusScenePath) {
    view.focusScenePath = focusScenePath;
    return view;
  }
};
const setScenePath = (room, scenePath) => {
  if (room && room.isWritable) {
    if (room.state.sceneState.scenePath !== scenePath) {
      const nextScenePath = scenePath === "/" ? "" : scenePath;
      room.setScenePath(nextScenePath);
    }
  }
};
const getScenePath = (room, dir, index2) => {
  var _a;
  if (room && dir) {
    const scenes = entireScenes(room);
    const scene = (_a = scenes[dir]) == null ? void 0 : _a[index2];
    if (scene) {
      return `${dir}/${scene.name}`;
    }
  }
};
const removeScenes = (room, scenePath, index2) => {
  if (room) {
    const type = room.scenePathType(scenePath);
    if (type !== ScenePathType.None) {
      room.removeScenes(scenePath, index2);
    }
  }
};
const addEmitterOnceListener = (event, listener) => {
  internalEmitter.once(event).then(listener);
};
debounce(
  (callbacks2, mode) => {
    callbacks2.emit("mainViewModeChange", mode);
  },
  200
);
const makeValidScenePath = (displayer, scenePath, index2 = 0) => {
  const scenes = entireScenes(displayer)[scenePath];
  if (!scenes)
    return;
  const scene = scenes[index2];
  if (!scene)
    return;
  const firstSceneName = scene.name;
  if (scenePath === ROOT_DIR) {
    return `/${firstSceneName}`;
  } else {
    return `${scenePath}/${firstSceneName}`;
  }
};
const entireScenes = (displayer) => {
  return displayer.entireScenes();
};
const putScenes = (room, path, scenes, index2) => {
  var _a;
  for (let i2 = 0; i2 < scenes.length; ++i2) {
    if ((_a = scenes[i2].name) == null ? void 0 : _a.includes("/")) {
      throw new Error("scenes name can not have '/'");
    }
  }
  return room == null ? void 0 : room.putScenes(path, scenes, index2);
};
const isValidScenePath = (scenePath) => {
  return scenePath.startsWith("/");
};
const parseSceneDir = (scenePath) => {
  const sceneList = scenePath.split("/");
  sceneList.pop();
  let sceneDir = sceneList.join("/");
  if (sceneDir === "") {
    sceneDir = "/";
  }
  return sceneDir;
};
const ensureValidScenePath = (scenePath) => {
  if (scenePath.endsWith("/")) {
    return scenePath.slice(0, -1);
  } else {
    return scenePath;
  }
};
const getVersionNumber = (version) => {
  const versionString = version.split(".").map((s2) => s2.padStart(2, "0")).join("");
  return parseInt(versionString);
};
const wait = (time2) => new Promise((resolve) => setTimeout(resolve, time2));
const isRootDirPage = (scenePath) => {
  const delimiterCount = scenePath.split("").reduce((prev, cur) => {
    if (cur === ROOT_DIR) {
      prev += 1;
    }
    return prev;
  }, 0);
  return delimiterCount === 1;
};
class AppListeners {
  constructor(manager) {
    this.manager = manager;
    this.displayer = this.manager.displayer;
    this.mainMagixEventListener = (event) => {
      if (event.authorId !== this.displayer.observerId) {
        const data = event.payload;
        switch (data.eventName) {
          case Events.AppMove: {
            this.appMoveHandler(data.payload);
            break;
          }
          case Events.AppResize: {
            this.appResizeHandler(data.payload);
            break;
          }
          case Events.AppBoxStateChange: {
            this.boxStateChangeHandler(data.payload);
            break;
          }
          case Events.SetMainViewScenePath: {
            this.setMainViewScenePathHandler(data.payload);
            break;
          }
          case Events.MoveCamera: {
            this.moveCameraHandler(data.payload);
            break;
          }
          case Events.MoveCameraToContain: {
            this.moveCameraToContainHandler(data.payload);
            break;
          }
          case Events.CursorMove: {
            this.cursorMoveHandler(data.payload);
            break;
          }
          case Events.RootDirRemoved: {
            this.rootDirRemovedHandler();
            break;
          }
          case Events.Refresh: {
            this.refreshHandler();
            break;
          }
          case Events.InitMainViewCamera: {
            this.initMainViewCameraHandler();
            break;
          }
          case Events.SetAppFocusIndex: {
            this.setAppFocusViewIndexHandler(data.payload);
            break;
          }
        }
      }
    };
    this.appMoveHandler = (payload) => {
      var _a;
      (_a = this.boxManager) == null ? void 0 : _a.moveBox(payload);
    };
    this.appResizeHandler = (payload) => {
      var _a, _b;
      (_a = this.boxManager) == null ? void 0 : _a.resizeBox(Object.assign(payload, { skipUpdate: true }));
      (_b = this.manager.room) == null ? void 0 : _b.refreshViewSize();
    };
    this.boxStateChangeHandler = (state) => {
      callbacks$1.emit("boxStateChange", state);
    };
    this.setMainViewScenePathHandler = ({ nextScenePath }) => {
      setViewFocusScenePath(this.manager.mainView, nextScenePath);
      callbacks$1.emit("mainViewScenePathChange", nextScenePath);
    };
    this.moveCameraHandler = (payload) => {
      if (isEqual(omit(payload, ["animationMode"]), { ...this.manager.mainView.camera }))
        return;
      this.manager.mainView.moveCamera(payload);
    };
    this.moveCameraToContainHandler = (payload) => {
      this.manager.mainView.moveCameraToContain(payload);
    };
    this.cursorMoveHandler = (payload) => {
      internalEmitter.emit("cursorMove", payload);
    };
    this.rootDirRemovedHandler = () => {
      this.manager.createRootDirScenesCallback();
      this.manager.mainViewProxy.rebind();
      internalEmitter.emit("rootDirRemoved");
    };
    this.refreshHandler = () => {
      this.manager.windowManger._refresh();
    };
    this.initMainViewCameraHandler = () => {
      this.manager.mainViewProxy.addCameraReaction();
    };
    this.setAppFocusViewIndexHandler = (payload) => {
      if (payload.type === "main") {
        this.manager.setSceneIndexWithoutSync(payload.index);
      } else if (payload.type === "app" && payload.appID) {
        const app = this.manager.appProxies.get(payload.appID);
        if (app) {
          app.setSceneIndexWithoutSync(payload.index);
        }
      }
    };
  }
  get boxManager() {
    return this.manager.boxManager;
  }
  addListeners() {
    this.displayer.addMagixEventListener(MagixEventName, this.mainMagixEventListener);
  }
  removeListeners() {
    this.displayer.removeMagixEventListener(MagixEventName, this.mainMagixEventListener);
  }
}
class AppCreateError extends Error {
  constructor() {
    super(...arguments);
    this.message = "[WindowManager]: app duplicate exists and cannot be created again";
  }
}
class AppNotRegisterError extends Error {
  constructor(kind2) {
    super(`[WindowManager]: app ${kind2} need register or provide src`);
  }
}
class AppManagerNotInitError extends Error {
  constructor() {
    super(...arguments);
    this.message = "[WindowManager]: AppManager must be initialized";
  }
}
class WhiteWebSDKInvalidError extends Error {
  constructor(version) {
    super(`[WindowManager]: white-web-sdk version must large than ${version}`);
  }
}
class ParamsInvalidError extends Error {
  constructor() {
    super(...arguments);
    this.message = "[WindowManager]: kind must be a valid string";
  }
}
class BoxNotCreatedError extends Error {
  constructor() {
    super(...arguments);
    this.message = "[WindowManager]: box need created";
  }
}
class InvalidScenePath extends Error {
  constructor() {
    super(...arguments);
    this.message = `[WindowManager]: ScenePath should start with "/"`;
  }
}
class BoxManagerNotFoundError extends Error {
  constructor() {
    super(...arguments);
    this.message = "[WindowManager]: boxManager not found";
  }
}
class BindContainerRoomPhaseInvalidError extends Error {
  constructor() {
    super(...arguments);
    this.message = "[WindowManager]: room phase only Connected can be bindContainer";
  }
}
const e$3 = "!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", s$3 = e$3.length, t$3 = Array(20), r$4 = () => {
  for (let r2 = 0; r2 < 20; r2++)
    t$3[r2] = e$3.charAt(Math.random() * s$3);
  return t$3.join("");
};
class o$2 {
  constructor() {
    this.disposers = /* @__PURE__ */ new Map();
  }
  add(e2, s2 = r$4()) {
    return this.flush(s2), this.disposers.set(s2, e2()), s2;
  }
  addDisposer(e2, s2 = r$4()) {
    return this.flush(s2), this.disposers.set(s2, e2), s2;
  }
  addEventListener(e2, s2, t2, o2, i2 = r$4()) {
    return this.add(() => (e2.addEventListener(s2, t2, o2), () => e2.removeEventListener(s2, t2, o2)), i2), i2;
  }
  setTimeout(e2, s2, t2 = r$4()) {
    return this.add(() => {
      const r2 = window.setTimeout(() => {
        this.remove(t2), e2();
      }, s2);
      return () => window.clearTimeout(r2);
    }, t2);
  }
  setInterval(e2, s2, t2 = r$4()) {
    return this.add(() => {
      const t3 = window.setInterval(e2, s2);
      return () => window.clearInterval(t3);
    }, t2);
  }
  remove(e2) {
    const s2 = this.disposers.get(e2);
    return this.disposers.delete(e2), s2;
  }
  flush(e2) {
    const s2 = this.remove(e2);
    if (s2)
      try {
        s2();
      } catch (t2) {
        console.error(t2);
      }
  }
  flushAll() {
    this.disposers.forEach((e2) => {
      try {
        e2();
      } catch (s2) {
        console.error(s2);
      }
    }), this.disposers.clear();
  }
}
const onObjectByEvent = (event) => {
  return (object, func) => {
    if (object === void 0)
      return;
    if (listenUpdated) {
      const listener = (events2) => {
        const kinds = events2.map((e2) => e2.kind);
        if (kinds.includes(event)) {
          func();
        }
      };
      listenUpdated(object, listener);
      func();
      return () => unlistenUpdated(object, listener);
    } else {
      return reaction(
        () => object,
        () => {
          func();
        },
        {
          fireImmediately: true
        }
      );
    }
  };
};
const safeListenPropsUpdated = (getProps, callback, onDestroyed) => {
  let disposeListenUpdated = null;
  const disposeReaction = reaction(
    getProps,
    () => {
      if (disposeListenUpdated) {
        disposeListenUpdated();
        disposeListenUpdated = null;
      }
      const props = getProps();
      if (isObject(props)) {
        disposeListenUpdated = () => unlistenUpdated(props, callback);
        listenUpdated(props, callback);
      } else {
        onDestroyed == null ? void 0 : onDestroyed(props);
      }
    },
    { fireImmediately: true }
  );
  return () => {
    disposeListenUpdated == null ? void 0 : disposeListenUpdated();
    disposeReaction();
  };
};
const onObjectRemoved = onObjectByEvent(UpdateEventKind.Removed);
onObjectByEvent(UpdateEventKind.Inserted);
class StorageEvent {
  constructor() {
    this.listeners = /* @__PURE__ */ new Set();
  }
  get length() {
    return this.listeners.size;
  }
  dispatch(message) {
    this.listeners.forEach((callback) => callback(message));
  }
  addListener(listener) {
    this.listeners.add(listener);
  }
  removeListener(listener) {
    this.listeners.delete(listener);
  }
}
const plainObjectKeys = Object.keys;
function isRef(e2) {
  return Boolean(has(e2, "__isRef"));
}
function makeRef(v2) {
  return { k: r$4(), v: v2, __isRef: true };
}
const STORAGE_NS = "_WM-STORAGE_";
class Storage {
  constructor(context, id2, defaultState) {
    this._sideEffect = new o$2();
    this._destroyed = false;
    this._refMap = /* @__PURE__ */ new WeakMap();
    this._lastValue = /* @__PURE__ */ new Map();
    this.onStateChanged = new StorageEvent();
    if (defaultState && !isObject(defaultState)) {
      throw new Error(`Default state for Storage ${id2} is not an object.`);
    }
    this._context = context;
    this.id = id2 || null;
    this._state = {};
    const rawState = this._getRawState(this._state);
    if (this._context.getIsWritable()) {
      if (this.id === null) {
        if (context.isAddApp && defaultState) {
          this.setState(defaultState);
        }
      } else {
        if (rawState === this._state || !isObject(rawState)) {
          if (!get(this._context.getAttributes(), [STORAGE_NS])) {
            this._context.updateAttributes([STORAGE_NS], {});
          }
          this._context.updateAttributes([STORAGE_NS, this.id], this._state);
          if (defaultState) {
            this.setState(defaultState);
          }
        }
      }
    }
    plainObjectKeys(rawState).forEach((key) => {
      if (this.id === null && key === STORAGE_NS) {
        return;
      }
      try {
        const rawValue = isObject(rawState[key]) ? JSON.parse(JSON.stringify(rawState[key])) : rawState[key];
        if (isRef(rawValue)) {
          this._state[key] = rawValue.v;
          if (isObject(rawValue.v)) {
            this._refMap.set(rawValue.v, rawValue);
          }
        } else {
          this._state[key] = rawValue;
        }
      } catch (e2) {
        console.error(e2);
      }
    });
    this._sideEffect.addDisposer(
      safeListenPropsUpdated(
        () => this.id === null ? context.getAttributes() : get(context.getAttributes(), [STORAGE_NS, this.id]),
        this._updateProperties.bind(this),
        this.destroy.bind(this)
      )
    );
  }
  get state() {
    if (this._destroyed) {
      console.warn(`Accessing state on destroyed Storage "${this.id}"`);
    }
    return this._state;
  }
  addStateChangedListener(handler) {
    this.onStateChanged.addListener(handler);
    return () => this.onStateChanged.removeListener(handler);
  }
  ensureState(state) {
    return this.setState(
      plainObjectKeys(state).reduce((payload, key) => {
        if (!has(this._state, key)) {
          payload[key] = state[key];
        }
        return payload;
      }, {})
    );
  }
  setState(state) {
    if (this._destroyed) {
      console.error(new Error(`Cannot call setState on destroyed Storage "${this.id}".`));
      return;
    }
    if (!this._context.getIsWritable()) {
      console.error(
        new Error(`Cannot setState on Storage "${this.id}" without writable access`),
        state
      );
      return;
    }
    const keys = plainObjectKeys(state);
    if (keys.length > 0) {
      keys.forEach((key) => {
        const value = state[key];
        if (value === this._state[key]) {
          return;
        }
        if (value === void 0) {
          this._lastValue.set(key, this._state[key]);
          delete this._state[key];
          this._setRawState(key, value);
        } else {
          this._lastValue.set(key, this._state[key]);
          this._state[key] = value;
          let payload = value;
          if (isObject(value)) {
            let refValue = this._refMap.get(value);
            if (!refValue) {
              refValue = makeRef(value);
              this._refMap.set(value, refValue);
            }
            payload = refValue;
          }
          this._setRawState(key, payload);
        }
      });
    }
  }
  emptyStorage() {
    if (size$1(this._state) <= 0) {
      return;
    }
    if (this._destroyed) {
      console.error(new Error(`Cannot empty destroyed Storage "${this.id}".`));
      return;
    }
    if (!this._context.getIsWritable()) {
      console.error(new Error(`Cannot empty Storage "${this.id}" without writable access.`));
      return;
    }
    this.setState(mapValues(this._state, noop$2));
  }
  deleteStorage() {
    if (this.id === null) {
      throw new Error(`Cannot delete main Storage`);
    }
    if (!this._context.getIsWritable()) {
      console.error(new Error(`Cannot delete Storage "${this.id}" without writable access.`));
      return;
    }
    this.destroy();
    this._context.updateAttributes([STORAGE_NS, this.id], void 0);
  }
  get destroyed() {
    return this._destroyed;
  }
  destroy() {
    this._destroyed = true;
    this._sideEffect.flushAll();
  }
  _getRawState(defaultValue) {
    var _a;
    if (this.id === null) {
      return (_a = this._context.getAttributes()) != null ? _a : defaultValue;
    } else {
      return get(this._context.getAttributes(), [STORAGE_NS, this.id], defaultValue);
    }
  }
  _setRawState(key, value) {
    if (this.id === null) {
      if (key === STORAGE_NS) {
        throw new Error(`Cannot set attribute internal filed "${STORAGE_NS}"`);
      }
      return this._context.updateAttributes([key], value);
    } else {
      return this._context.updateAttributes([STORAGE_NS, this.id, key], value);
    }
  }
  _updateProperties(actions) {
    var _a;
    if (this._destroyed) {
      console.error(
        new Error(`Cannot call _updateProperties on destroyed Storage "${this.id}".`)
      );
      return;
    }
    if (actions.length > 0) {
      const diffs = {};
      for (let i2 = 0; i2 < actions.length; i2++) {
        try {
          const action = actions[i2];
          const key = action.key;
          if (this.id === null && key === STORAGE_NS) {
            continue;
          }
          const value = isObject(action.value) ? JSON.parse(JSON.stringify(action.value)) : action.value;
          let oldValue;
          if (this._lastValue.has(key)) {
            oldValue = this._lastValue.get(key);
            this._lastValue.delete(key);
          }
          switch (action.kind) {
            case 2: {
              if (has(this._state, key)) {
                oldValue = this._state[key];
                delete this._state[key];
              }
              diffs[key] = { oldValue };
              break;
            }
            default: {
              let newValue = value;
              if (isRef(value)) {
                const { k: k2, v: v2 } = value;
                const curValue = this._state[key];
                if (isObject(curValue) && ((_a = this._refMap.get(curValue)) == null ? void 0 : _a.k) === k2) {
                  newValue = curValue;
                } else {
                  newValue = v2;
                  if (isObject(v2)) {
                    this._refMap.set(v2, value);
                  }
                }
              }
              if (newValue !== this._state[key]) {
                oldValue = this._state[key];
                this._state[key] = newValue;
              }
              diffs[key] = { newValue, oldValue };
              break;
            }
          }
        } catch (e2) {
          console.error(e2);
        }
      }
      this.onStateChanged.dispatch(diffs);
    }
  }
}
class AppContext {
  constructor(manager, boxManager, appId, appProxy, appOptions) {
    this.manager = manager;
    this.boxManager = boxManager;
    this.appId = appId;
    this.appProxy = appProxy;
    this.appOptions = appOptions;
    this.mobxUtils = {
      autorun,
      reaction,
      toJS
    };
    this.objectUtils = {
      listenUpdated,
      unlistenUpdated,
      listenDisposed,
      unlistenDisposed
    };
    this.store = this.manager.store;
    this.isReplay = this.manager.isReplay;
    this.getDisplayer = () => {
      return this.manager.displayer;
    };
    this.getAttributes = () => {
      return this.appProxy.attributes;
    };
    this.getScenes = () => {
      const appAttr = this.store.getAppAttributes(this.appId);
      if (appAttr == null ? void 0 : appAttr.isDynamicPPT) {
        return this.appProxy.scenes;
      } else {
        return appAttr == null ? void 0 : appAttr.options["scenes"];
      }
    };
    this.getView = () => {
      return this.appProxy.view;
    };
    this.mountView = (dom) => {
      const view = this.getView();
      if (view) {
        view.divElement = dom;
        setTimeout(() => {
          var _a;
          (_a = this.getRoom()) == null ? void 0 : _a.refreshViewSize();
          callbacks$1.emit("onAppViewMounted", { appId: this.appId, view });
        }, 1e3);
      }
    };
    this.getInitScenePath = () => {
      return this.manager.getAppInitPath(this.appId);
    };
    this.getIsWritable = () => {
      return this.manager.canOperate;
    };
    this.getBox = () => {
      const box = this.boxManager.getBox(this.appId);
      if (box) {
        return box;
      } else {
        throw new BoxNotCreatedError();
      }
    };
    this.getRoom = () => {
      return this.manager.room;
    };
    this.setAttributes = (attributes) => {
      this.manager.safeSetAttributes({ [this.appId]: attributes });
    };
    this.updateAttributes = (keys, value) => {
      if (this.manager.attributes[this.appId]) {
        this.manager.safeUpdateAttributes([this.appId, ...keys], value);
      }
    };
    this.setScenePath = async (scenePath) => {
      var _a;
      if (!this.appProxy.box)
        return;
      this.appProxy.setFullPath(scenePath);
      (_a = this.getRoom()) == null ? void 0 : _a.setScenePath(scenePath);
    };
    this.getAppOptions = () => {
      return typeof this.appOptions === "function" ? this.appOptions() : this.appOptions;
    };
    this.createStorage = (storeId, defaultState) => {
      const storage = new Storage(this, storeId, defaultState);
      this.emitter.on("destroy", () => {
        storage.destroy();
      });
      return storage;
    };
    this.dispatchMagixEvent = (...args) => {
      var _a;
      const appScopeEvent = `${this.appId}:${args[0]}`;
      return (_a = this.manager.room) == null ? void 0 : _a.dispatchMagixEvent(appScopeEvent, args[1]);
    };
    this.addMagixEventListener = (event, handler, options) => {
      const appScopeEvent = `${this.appId}:${event}`;
      this.manager.displayer.addMagixEventListener(
        appScopeEvent,
        handler,
        options
      );
      return () => this.manager.displayer.removeMagixEventListener(
        appScopeEvent,
        handler
      );
    };
    this.removeMagixEventListener = this.manager.displayer.removeMagixEventListener.bind(
      this.manager.displayer
    );
    this.nextPage = async () => {
      const nextIndex = this.pageState.index + 1;
      if (nextIndex > this.pageState.length - 1) {
        console.warn("[WindowManager] nextPage: index out of range");
        return false;
      }
      this.appProxy.setSceneIndex(nextIndex);
      return true;
    };
    this.jumpPage = async (index2) => {
      if (!(0 <= index2 && index2 < this.pageState.length)) {
        console.warn("[WindowManager] nextPage: index out of range");
        return false;
      }
      this.appProxy.setSceneIndex(index2);
      return true;
    };
    this.prevPage = async () => {
      const nextIndex = this.pageState.index - 1;
      if (nextIndex < 0) {
        console.warn("[WindowManager] prevPage: index out of range");
        return false;
      }
      this.appProxy.setSceneIndex(nextIndex);
      return true;
    };
    this.addPage = async (params) => {
      const after = params == null ? void 0 : params.after;
      const scene = params == null ? void 0 : params.scene;
      const scenePath = this.appProxy.scenePath;
      if (!scenePath)
        return;
      if (after) {
        const nextIndex = this.pageState.index + 1;
        putScenes(this.manager.room, scenePath, [scene || {}], nextIndex);
      } else {
        putScenes(this.manager.room, scenePath, [scene || {}]);
      }
    };
    this.removePage = async (index2) => {
      const needRemoveIndex = index2 === void 0 ? this.pageState.index : index2;
      if (this.pageState.length === 1) {
        console.warn(`[WindowManager]: can not remove the last page`);
        return false;
      }
      if (needRemoveIndex < 0 || needRemoveIndex >= this.pageState.length) {
        console.warn(`[WindowManager]: page index ${index2} out of range`);
        return false;
      }
      return this.appProxy.removeSceneByIndex(needRemoveIndex);
    };
    this.emitter = appProxy.appEmitter;
    this.isAddApp = appProxy.isAddApp;
  }
  get storage() {
    if (!this._storage) {
      this._storage = new Storage(this);
    }
    return this._storage;
  }
  get pageState() {
    return this.appProxy.pageState;
  }
  get kind() {
    return this.appProxy.kind;
  }
  dispatchAppEvent(type, value) {
    internalEmitter.emit(`custom-${this.kind}`, {
      kind: this.kind,
      appId: this.appId,
      type,
      value
    });
  }
}
class AppPageStateImpl {
  constructor(params) {
    this.params = params;
    this.sceneNode = null;
    this.onSceneChange = (node) => {
      this.sceneNode = node;
      this.params.notifyPageStateChange();
    };
    const { displayer, scenePath } = this.params;
    if (scenePath) {
      this.sceneNode = displayer.createScenesCallback(scenePath, {
        onAddScene: this.onSceneChange,
        onRemoveScene: this.onSceneChange
      });
    }
  }
  getFullPath(index2) {
    var _a;
    const scenes = (_a = this.sceneNode) == null ? void 0 : _a.scenes;
    if (this.params.scenePath && scenes) {
      const name = scenes[index2];
      if (name) {
        return `${this.params.scenePath}/${name}`;
      }
    }
  }
  toObject() {
    var _a, _b;
    return {
      index: ((_a = this.params.view) == null ? void 0 : _a.focusSceneIndex) || 0,
      length: ((_b = this.sceneNode) == null ? void 0 : _b.scenes.length) || 0
    };
  }
  destroy() {
    var _a;
    (_a = this.sceneNode) == null ? void 0 : _a.dispose();
  }
}
var Fields = /* @__PURE__ */ ((Fields2) => {
  Fields2["Apps"] = "apps";
  Fields2["Focus"] = "focus";
  Fields2["State"] = "state";
  Fields2["BoxState"] = "boxState";
  Fields2["MainViewCamera"] = "mainViewCamera";
  Fields2["MainViewSize"] = "mainViewSize";
  Fields2["Broadcaster"] = "broadcaster";
  Fields2["Cursors"] = "cursors";
  Fields2["Position"] = "position";
  Fields2["CursorState"] = "cursorState";
  Fields2["FullPath"] = "fullPath";
  Fields2["Registered"] = "registered";
  Fields2["IframeBridge"] = "iframeBridge";
  return Fields2;
})(Fields || {});
class AttributesDelegate {
  constructor(context) {
    this.context = context;
    this.setAppFocus = (appId, focus) => {
      if (focus) {
        this.context.safeSetAttributes({ ["focus"]: appId });
      } else {
        this.context.safeSetAttributes({ ["focus"]: void 0 });
      }
    };
  }
  setContext(context) {
    this.context = context;
  }
  get attributes() {
    return this.context.getAttributes();
  }
  apps() {
    return get(this.attributes, ["apps"]);
  }
  get focus() {
    return get(this.attributes, ["focus"]);
  }
  getAppAttributes(id2) {
    return get(this.apps(), [id2]);
  }
  getAppState(id2) {
    return get(this.apps(), [id2, "state"]);
  }
  getMaximized() {
    return get(this.attributes, ["maximizedBoxes"]);
  }
  getMinimized() {
    return get(this.attributes, ["minimizedBoxes"]);
  }
  setupAppAttributes(params, id2, isDynamicPPT) {
    const attributes = this.attributes;
    if (!attributes.apps) {
      this.context.safeSetAttributes({ apps: {} });
    }
    const attrNames = ["scenePath", "title"];
    if (!isDynamicPPT) {
      attrNames.push("scenes");
    }
    const options = pick(params.options, attrNames);
    const attrs = { kind: params.kind, options, isDynamicPPT };
    if (typeof params.src === "string") {
      attrs.src = params.src;
    }
    attrs.createdAt = Date.now();
    this.context.safeUpdateAttributes(["apps", id2], attrs);
    this.context.safeUpdateAttributes(["apps", id2, "state"], {
      [AppAttributes.Size]: {},
      [AppAttributes.Position]: {},
      [AppAttributes.SceneIndex]: 0
    });
  }
  updateAppState(appId, stateName, state) {
    if (get(this.attributes, ["apps", appId, "state"])) {
      this.context.safeUpdateAttributes(["apps", appId, "state", stateName], state);
    }
  }
  cleanAppAttributes(id2) {
    this.context.safeUpdateAttributes(["apps", id2], void 0);
    this.context.safeSetAttributes({ [id2]: void 0 });
    const focus = this.attributes["focus"];
    if (focus === id2) {
      this.cleanFocus();
    }
  }
  cleanFocus() {
    this.context.safeSetAttributes({ ["focus"]: void 0 });
  }
  getAppSceneIndex(id2) {
    var _a;
    return (_a = this.getAppState(id2)) == null ? void 0 : _a[AppAttributes.SceneIndex];
  }
  getAppScenePath(id2) {
    var _a, _b;
    return (_b = (_a = this.getAppAttributes(id2)) == null ? void 0 : _a.options) == null ? void 0 : _b.scenePath;
  }
  getMainViewScenePath() {
    return this.attributes["_mainScenePath"];
  }
  getMainViewSceneIndex() {
    return this.attributes["_mainSceneIndex"];
  }
  getBoxState() {
    return this.attributes["boxState"];
  }
  setMainViewScenePath(scenePath) {
    this.context.safeSetAttributes({ _mainScenePath: scenePath });
  }
  setMainViewSceneIndex(index2) {
    this.context.safeSetAttributes({ _mainSceneIndex: index2 });
  }
  getMainViewCamera() {
    return get(this.attributes, ["mainViewCamera"]);
  }
  getMainViewSize() {
    return get(this.attributes, ["mainViewSize"]);
  }
  setMainViewCamera(camera) {
    this.context.safeSetAttributes({ ["mainViewCamera"]: { ...camera } });
  }
  setMainViewSize(size2) {
    if (size2.width === 0 || size2.height === 0)
      return;
    this.context.safeSetAttributes({ ["mainViewSize"]: { ...size2 } });
  }
  setMainViewCameraAndSize(camera, size2) {
    if (size2.width === 0 || size2.height === 0)
      return;
    this.context.safeSetAttributes({
      ["mainViewCamera"]: { ...camera },
      ["mainViewSize"]: { ...size2 }
    });
  }
  updateCursor(uid, position) {
    if (!get(this.attributes, ["cursors"])) {
      this.context.safeUpdateAttributes(["cursors"], {});
    }
    if (!get(this.attributes, ["cursors", uid])) {
      this.context.safeUpdateAttributes(["cursors", uid], {});
    }
    this.context.safeUpdateAttributes(["cursors", uid, "position"], position);
  }
  updateCursorState(uid, cursorState) {
    if (!get(this.attributes, ["cursors", uid])) {
      this.context.safeUpdateAttributes(["cursors", uid], {});
    }
    this.context.safeUpdateAttributes(["cursors", uid, "cursorState"], cursorState);
  }
  getCursorState(uid) {
    return get(this.attributes, ["cursors", uid, "cursorState"]);
  }
  cleanCursor(uid) {
    this.context.safeUpdateAttributes(["cursors", uid], void 0);
  }
  setMainViewFocusPath(mainView) {
    const scenePath = this.getMainViewScenePath();
    if (scenePath) {
      setViewFocusScenePath(mainView, scenePath);
    }
  }
  getIframeBridge() {
    return get(this.attributes, ["iframeBridge"]);
  }
  setIframeBridge(data) {
    if (isObject(data)) {
      const oldState = this.getIframeBridge();
      for (const key in data) {
        const value = data[key];
        if (oldState[key] !== value) {
          this.context.safeUpdateAttributes(["iframeBridge", key], value);
        }
      }
    }
  }
}
const store = new AttributesDelegate({
  getAttributes: () => {
    throw new Error("getAttributes not implemented");
  },
  safeSetAttributes: () => {
    throw new Error("safeSetAttributes not implemented");
  },
  safeUpdateAttributes: () => {
    throw new Error("safeUpdateAttributes not implemented");
  }
});
const log = (...args) => {
  if (WindowManager.debug) {
    console.log(`[WindowManager]:`, ...args);
  }
};
const calculateNextIndex = (index2, pageState) => {
  let nextIndex = 0;
  const maxIndex = pageState.length - 1;
  if (index2 === pageState.index) {
    if (index2 === maxIndex) {
      nextIndex = index2 - 1;
    } else {
      nextIndex = pageState.index + 1;
    }
  } else {
    nextIndex = pageState.index;
  }
  return nextIndex;
};
const boxEmitter = new Emittery();
class AppProxy {
  constructor(params, manager, appId, isAddApp) {
    var _a;
    this.params = params;
    this.manager = manager;
    this.boxManager = this.manager.boxManager;
    this.appProxies = this.manager.appProxies;
    this.viewManager = this.manager.viewManager;
    this.store = this.manager.store;
    this.status = "normal";
    this.getAppInitState = (id2) => {
      var _a2, _b;
      const attrs = this.store.getAppState(id2);
      if (!attrs)
        return;
      const position = attrs == null ? void 0 : attrs[AppAttributes.Position];
      const focus = this.store.focus;
      const size2 = attrs == null ? void 0 : attrs[AppAttributes.Size];
      const sceneIndex = attrs == null ? void 0 : attrs[AppAttributes.SceneIndex];
      const maximized = (_a2 = this.attributes) == null ? void 0 : _a2["maximized"];
      const minimized = (_b = this.attributes) == null ? void 0 : _b["minimized"];
      const zIndex = attrs == null ? void 0 : attrs.zIndex;
      let payload = { maximized, minimized, zIndex };
      if (position) {
        payload = { ...payload, id: id2, x: position.x, y: position.y };
      }
      if (focus === id2) {
        payload = { ...payload, focus: true };
      }
      if (size2) {
        payload = { ...payload, width: size2.width, height: size2.height };
      }
      if (sceneIndex) {
        payload = { ...payload, sceneIndex };
      }
      return payload;
    };
    this.appAttributesUpdateListener = (appId2) => {
      this.manager.refresher.add(appId2, () => {
        return autorun(() => {
          const attrs = this.manager.attributes[appId2];
          if (attrs) {
            this.appEmitter.emit("attributesUpdate", attrs);
          }
        });
      });
      this.manager.refresher.add(this.stateKey, () => {
        return autorun(() => {
          var _a2, _b, _c, _d;
          const appState = (_a2 = this.appAttributes) == null ? void 0 : _a2.state;
          if ((appState == null ? void 0 : appState.zIndex) > 0 && appState.zIndex !== ((_b = this.box) == null ? void 0 : _b.zIndex)) {
            (_c = this.boxManager) == null ? void 0 : _c.setZIndex(appId2, appState.zIndex);
            (_d = this.boxManager) == null ? void 0 : _d.focusBox({ appId: appId2 });
          }
        });
      });
      this.manager.refresher.add(`${appId2}-fullPath`, () => {
        return autorun(() => {
          var _a2;
          const fullPath = (_a2 = this.appAttributes) == null ? void 0 : _a2.fullPath;
          this.setFocusScenePathHandler(fullPath);
          if (this._prevFullPath !== fullPath) {
            this.notifyPageStateChange();
            this._prevFullPath = fullPath;
          }
        });
      });
    };
    this.setFocusScenePathHandler = debounce((fullPath) => {
      var _a2;
      if (this.view && fullPath && fullPath !== ((_a2 = this.view) == null ? void 0 : _a2.focusScenePath)) {
        setViewFocusScenePath(this.view, fullPath);
        callbacks$1.emit("onAppScenePathChange", { appId: this.id, view: this.view });
      }
    }, 50);
    this.notifyPageStateChange = debounce(() => {
      this.appEmitter.emit("pageStateChange", this.pageState);
    }, 50);
    this.kind = params.kind;
    this.id = appId;
    this.stateKey = `${this.id}_state`;
    this.appProxies.set(this.id, this);
    this.appEmitter = new Emittery();
    this.appListener = this.makeAppEventListener(this.id);
    this.isAddApp = isAddApp;
    this.initScenes();
    if ((_a = this.params.options) == null ? void 0 : _a.scenePath) {
      this.createView();
    }
    this._pageState = new AppPageStateImpl({
      displayer: this.manager.displayer,
      scenePath: this.scenePath,
      view: this.view,
      notifyPageStateChange: this.notifyPageStateChange
    });
  }
  initScenes() {
    var _a;
    const options = this.params.options;
    if (options) {
      this.scenePath = options.scenePath;
      if (((_a = this.appAttributes) == null ? void 0 : _a.isDynamicPPT) && this.scenePath) {
        this.scenes = entireScenes(this.manager.displayer)[this.scenePath];
      } else {
        this.scenes = options.scenes;
      }
    }
  }
  get view() {
    return this.manager.viewManager.getView(this.id);
  }
  get viewIndex() {
    var _a;
    return (_a = this.view) == null ? void 0 : _a.focusSceneIndex;
  }
  get isWritable() {
    var _a;
    return this.manager.canOperate && !((_a = this.box) == null ? void 0 : _a.readonly);
  }
  get attributes() {
    return this.manager.attributes[this.id];
  }
  get appAttributes() {
    return this.store.getAppAttributes(this.id);
  }
  getFullScenePath() {
    if (this.scenePath) {
      return get(this.appAttributes, [Fields.FullPath]) || this.getFullScenePathFromScenes();
    }
  }
  getFullScenePathFromScenes() {
    const sceneIndex = get(this.appAttributes, ["state", "SceneIndex"], 0);
    const fullPath = getScenePath(this.manager.room, this.scenePath, sceneIndex);
    if (fullPath) {
      this.setFullPath(fullPath);
    }
    return fullPath;
  }
  setFullPath(path) {
    this.manager.safeUpdateAttributes(["apps", this.id, Fields.FullPath], path);
  }
  async baseInsertApp(skipUpdate = false) {
    var _a;
    const params = this.params;
    if (!params.kind) {
      throw new Error("[WindowManager]: kind require");
    }
    const appImpl = await ((_a = appRegister.appClasses.get(params.kind)) == null ? void 0 : _a());
    const appParams = appRegister.registered.get(params.kind);
    if (appImpl) {
      await this.setupApp(
        this.id,
        skipUpdate,
        appImpl,
        params.options,
        appParams == null ? void 0 : appParams.appOptions
      );
    } else {
      throw new Error(`[WindowManager]: app load failed ${params.kind} ${params.src}`);
    }
    internalEmitter.emit("updateManagerRect");
    return {
      appId: this.id,
      app: appImpl
    };
  }
  get box() {
    var _a;
    return (_a = this.boxManager) == null ? void 0 : _a.getBox(this.id);
  }
  async setupApp(appId, skipUpdate, app, options, appOptions) {
    var _a;
    log("setupApp", appId, app, options);
    if (!this.boxManager) {
      throw new BoxManagerNotFoundError();
    }
    const context = new AppContext(this.manager, this.boxManager, appId, this, appOptions);
    this.appContext = context;
    try {
      internalEmitter.once(`${appId}${Events.WindowCreated}`).then(async () => {
        var _a2;
        let boxInitState;
        if (!skipUpdate) {
          boxInitState = this.getAppInitState(appId);
          (_a2 = this.boxManager) == null ? void 0 : _a2.updateBoxState(boxInitState);
        }
        this.appEmitter.onAny(this.appListener);
        this.appAttributesUpdateListener(appId);
        this.setViewFocusScenePath();
        setTimeout(async () => {
          console.log("setup app", app);
          const result = await app.setup(context);
          this.appResult = result;
          appRegister.notifyApp(this.kind, "created", { appId, result });
          this.afterSetupApp(boxInitState);
          this.fixMobileSize();
          callbacks$1.emit("onAppSetup", appId);
        }, SETUP_APP_DELAY);
      });
      (_a = this.boxManager) == null ? void 0 : _a.createBox({
        appId,
        app,
        options,
        canOperate: this.manager.canOperate,
        smartPosition: this.isAddApp
      });
      if (this.isAddApp && this.box) {
        this.store.updateAppState(appId, AppAttributes.ZIndex, this.box.zIndex);
        this.store.updateAppState(appId, AppAttributes.Size, {
          width: this.box.intrinsicWidth,
          height: this.box.intrinsicHeight
        });
        this.boxManager.focusBox({ appId }, false);
      }
    } catch (error) {
      console.error(error);
      throw new Error(`[WindowManager]: app setup error: ${error.message}`);
    }
  }
  fixMobileSize() {
    var _a, _b;
    const box = (_a = this.boxManager) == null ? void 0 : _a.getBox(this.id);
    if (box) {
      (_b = this.boxManager) == null ? void 0 : _b.resizeBox({
        appId: this.id,
        width: box.intrinsicWidth + 1e-3,
        height: box.intrinsicHeight + 1e-3,
        skipUpdate: true
      });
    }
  }
  afterSetupApp(boxInitState) {
    var _a;
    if (boxInitState) {
      if (!(boxInitState == null ? void 0 : boxInitState.x) || !boxInitState.y) {
        (_a = this.boxManager) == null ? void 0 : _a.setBoxInitState(this.id);
      }
    }
  }
  async onSeek(time2) {
    var _a;
    this.appEmitter.emit("seek", time2).catch((err) => {
      console.log(`[WindowManager]: emit seek error: ${err.message}`);
    });
    const boxInitState = this.getAppInitState(this.id);
    (_a = this.boxManager) == null ? void 0 : _a.updateBoxState(boxInitState);
  }
  async onReconnected() {
    var _a;
    const isExist = Boolean(this.manager.attributes.apps[this.id]);
    if (!isExist) {
      await this.destroy(true, false, true);
      return;
    }
    this.appEmitter.emit("reconnected", void 0);
    const currentAppState = this.getAppInitState(this.id);
    await this.destroy(true, false, true);
    const params = this.params;
    const appProxy = new AppProxy(params, this.manager, this.id, this.isAddApp);
    await appProxy.baseInsertApp(true);
    (_a = this.boxManager) == null ? void 0 : _a.updateBoxState(currentAppState);
  }
  async onRemoveScene(scenePath) {
    if (this.scenePath && scenePath.startsWith(this.scenePath + "/")) {
      let nextIndex = this.pageState.index;
      let fullPath = this._pageState.getFullPath(nextIndex);
      if (!fullPath) {
        nextIndex = 0;
        fullPath = this._pageState.getFullPath(nextIndex);
      }
      if (fullPath) {
        this.setFullPath(fullPath);
      }
      this.setViewFocusScenePath();
      if (this.view) {
        this.view.focusSceneIndex = nextIndex;
      }
    }
  }
  emitAppSceneStateChange(sceneState) {
    this.appEmitter.emit("sceneStateChange", sceneState);
  }
  emitAppIsWritableChange() {
    this.appEmitter.emit("writableChange", this.isWritable);
  }
  makeAppEventListener(appId) {
    return (eventName, data) => {
      var _a, _b, _c, _d;
      if (!this.manager.canOperate)
        return;
      switch (eventName) {
        case "setBoxSize": {
          (_a = this.boxManager) == null ? void 0 : _a.resizeBox({
            appId,
            width: data.width,
            height: data.height,
            skipUpdate: false
          });
          break;
        }
        case "setBoxMinSize": {
          (_b = this.boxManager) == null ? void 0 : _b.setBoxMinSize({
            appId,
            minWidth: data.minwidth,
            minHeight: data.minheight
          });
          break;
        }
        case "setBoxTitle": {
          (_c = this.boxManager) == null ? void 0 : _c.setBoxTitle({ appId, title: data.title });
          break;
        }
        case AppEvents.destroy: {
          if (this.status === "destroyed")
            return;
          this.destroy(true, false, true, data == null ? void 0 : data.error);
          if (data == null ? void 0 : data.error) {
            console.error(data == null ? void 0 : data.error);
          }
          break;
        }
        case "focus": {
          (_d = this.boxManager) == null ? void 0 : _d.focusBox({ appId: this.id });
          boxEmitter.emit("focus", { appId: this.id });
          break;
        }
      }
    };
  }
  setScenePath() {
    if (!this.manager.canOperate)
      return;
    const fullScenePath = this.getFullScenePath();
    if (this.manager.room && fullScenePath && this.view) {
      setScenePath(this.manager.room, fullScenePath);
    }
  }
  setViewFocusScenePath() {
    const fullPath = this.getFullScenePath();
    if (fullPath && this.view) {
      setViewFocusScenePath(this.view, fullPath);
    }
    return fullPath;
  }
  async createView() {
    const view = await this.viewManager.createView(this.id);
    this.setViewFocusScenePath();
    return view;
  }
  get pageState() {
    return this._pageState.toObject();
  }
  async removeSceneByIndex(index2) {
    const scenePath = this._pageState.getFullPath(index2);
    if (scenePath) {
      const nextIndex = calculateNextIndex(index2, this.pageState);
      this.setSceneIndexWithoutSync(nextIndex);
      this.manager.dispatchInternalEvent(Events.SetAppFocusIndex, {
        type: "app",
        appID: this.id,
        index: nextIndex
      });
      setTimeout(() => {
        removeScenes(this.manager.room, scenePath, index2);
      }, 100);
      return true;
    } else {
      return false;
    }
  }
  setSceneIndexWithoutSync(index2) {
    if (this.view) {
      this.view.focusSceneIndex = index2;
    }
  }
  setSceneIndex(index2) {
    if (this.view) {
      this.view.focusSceneIndex = index2;
      const fullPath = this._pageState.getFullPath(index2);
      if (fullPath) {
        this.setFullPath(fullPath);
      }
    }
  }
  async destroy(needCloseBox, cleanAttrs, skipUpdate, error) {
    var _a;
    if (this.status === "destroyed")
      return;
    this.status = "destroyed";
    try {
      await appRegister.notifyApp(this.kind, "destroy", { appId: this.id });
      await this.appEmitter.emit("destroy", { error });
    } catch (error2) {
      console.error("[WindowManager]: notifyApp error", error2.message, error2.stack);
    }
    this.appEmitter.clearListeners();
    internalEmitter.emit(`destroy-${this.id}`, { error });
    if (needCloseBox) {
      (_a = this.boxManager) == null ? void 0 : _a.closeBox(this.id, skipUpdate);
    }
    if (cleanAttrs) {
      this.store.cleanAppAttributes(this.id);
      if (this.scenePath) {
        removeScenes(this.manager.room, this.scenePath);
      }
    }
    this.appProxies.delete(this.id);
    this._pageState.destroy();
    this.viewManager.destroyView(this.id);
    this.manager.appStatus.delete(this.id);
    this.manager.refresher.remove(this.id);
    this.manager.refresher.remove(this.stateKey);
    this.manager.refresher.remove(`${this.id}-fullPath`);
    this._prevFullPath = void 0;
  }
  close() {
    return this.destroy(true, true, false);
  }
}
class ViewManager {
  constructor(displayer) {
    this.displayer = displayer;
    this.views = /* @__PURE__ */ new Map();
  }
  createView(id2) {
    const view = createView(this.displayer);
    this.views.set(id2, view);
    return view;
  }
  getView(id2) {
    return this.views.get(id2);
  }
  destroyView(id2) {
    const view = this.views.get(id2);
    if (view) {
      try {
        view.release();
      } catch {
      }
      this.views.delete(id2);
    }
  }
  setViewScenePath(id2, scenePath) {
    const view = this.views.get(id2);
    if (view) {
      view.focusScenePath = scenePath;
    }
  }
  destroy() {
    this.views.forEach((view) => {
      try {
        view.release();
      } catch {
      }
    });
    this.views.clear();
  }
}
const createView = (displayer) => {
  const view = displayer.views.createView();
  setDefaultCameraBound(view);
  return view;
};
const setDefaultCameraBound = (view) => {
  view.setCameraBound({
    maxContentMode: () => 10,
    minContentMode: () => 0.1
  });
};
class MainViewProxy {
  constructor(manager) {
    this.manager = manager;
    this.polling = false;
    this.started = false;
    this.mainViewIsAddListener = false;
    this.store = this.manager.store;
    this.viewMode = this.manager.windowManger.viewMode;
    this.sideEffectManager = new o$2();
    this.syncCamera = () => {
      if (!this.polling || this.viewMode !== ViewMode.Broadcaster)
        return;
      const { mainViewCamera } = this;
      if (mainViewCamera && mainViewCamera.id !== this.manager.uid) {
        this.moveCameraSizeByAttributes();
      }
    };
    this.startListenWritableChange = () => {
      this.sideEffectManager.add(() => {
        return internalEmitter.on("writableChange", (isWritable) => {
          if (isWritable) {
            this.ensureCameraAndSize();
          }
          if (this.manager.room)
            this.syncMainView(this.manager.room);
        });
      });
    };
    this.addCameraReaction = () => {
      this.manager.refresher.add(Fields.MainViewCamera, this.cameraReaction);
    };
    this.cameraReaction = () => {
      return reaction(
        () => this.mainViewCamera,
        (camera) => {
          if (camera && camera.id !== this.manager.uid) {
            this.moveCameraToContian(this.mainViewSize);
            this.moveCamera(camera);
          }
        },
        { fireImmediately: true }
      );
    };
    this.sizeChangeHandler = debounce((size2) => {
      if (size2) {
        this.moveCameraToContian(size2);
        this.moveCamera(this.mainViewCamera);
      }
      this.ensureMainViewSize();
    }, 30);
    this.onUpdateContainerSizeRatio = () => {
      const size2 = this.store.getMainViewSize();
      this.sizeChangeHandler(size2);
    };
    this.onCameraUpdatedByDevice = (camera) => {
      if (this.viewMode === ViewMode.Follower)
        return;
      this.store.setMainViewCamera({ ...camera, id: this.manager.uid });
      if (!isEqual(this.mainViewSize, { ...this.mainView.size, id: this.manager.uid })) {
        this.setMainViewSize(this.view.size);
      }
    };
    this.mainViewClickListener = () => {
      this.mainViewClickHandler();
    };
    this.setMainViewSize = debounce((size2) => {
      this.store.setMainViewSize({ ...size2, id: this.manager.uid });
    }, 50);
    this._syncMainViewTimer = 0;
    this.onCameraOrSizeUpdated = () => {
      callbacks$1.emit("cameraStateChange", this.cameraState);
      if (this.manager.room && this.manager.room.syncMainView) {
        clearTimeout(this._syncMainViewTimer);
        this._syncMainViewTimer = setTimeout(this.syncMainView, 100, this.manager.room);
      }
      this.ensureMainViewSize();
    };
    this.syncMainView = (room) => {
      if (room.isWritable) {
        room.syncMainView(this.mainView);
      }
    };
    this.setViewMode = (mode) => {
      this.viewMode = mode;
    };
    this.mainView = this.createMainView();
    this.moveCameraSizeByAttributes();
    internalEmitter.once("mainViewMounted").then(() => {
      this.addMainViewListener();
      this.start();
      this.ensureCameraAndSize();
      this.startListenWritableChange();
    });
    const playgroundSizeChangeListener = () => {
      this.sizeChangeHandler(this.mainViewSize);
    };
    this.sideEffectManager.add(() => {
      return internalEmitter.on("playgroundSizeChange", playgroundSizeChangeListener);
    });
    this.sideEffectManager.add(() => {
      return internalEmitter.on("containerSizeRatioUpdate", this.onUpdateContainerSizeRatio);
    });
    this.sideEffectManager.add(() => {
      return internalEmitter.on("startReconnect", () => {
        if (!this.didRelease) {
          this.mainView.release();
        }
      });
    });
    this.sideEffectManager.setInterval(this.syncCamera, 1500);
  }
  ensureCameraAndSize() {
    if (this.viewMode !== ViewMode.Broadcaster)
      return;
    if (!this.mainViewCamera || !this.mainViewSize) {
      this.manager.dispatchInternalEvent(Events.InitMainViewCamera);
      this.setCameraAndSize();
    }
  }
  get mainViewCamera() {
    return this.store.getMainViewCamera();
  }
  get mainViewSize() {
    return this.store.getMainViewSize();
  }
  get didRelease() {
    return get(this.view, ["didRelease"]);
  }
  moveCameraSizeByAttributes() {
    this.moveCameraToContian(this.mainViewSize);
    this.moveCamera(this.mainViewCamera);
  }
  start() {
    this.sizeChangeHandler(this.mainViewSize);
    if (this.started)
      return;
    this.addCameraListener();
    this.addCameraReaction();
    if (this.manager.room)
      this.syncMainView(this.manager.room);
    this.started = true;
  }
  setCameraAndSize() {
    const camera = { ...this.mainView.camera, id: this.manager.uid };
    const size2 = { ...this.mainView.size, id: this.manager.uid };
    this.store.setMainViewCameraAndSize(camera, size2);
  }
  get view() {
    return this.mainView;
  }
  get cameraState() {
    return { ...this.view.camera, ...this.view.size };
  }
  createMainView() {
    const mainView = createView(this.manager.displayer);
    const mainViewScenePath = this.store.getMainViewScenePath();
    if (mainViewScenePath) {
      setViewFocusScenePath(mainView, mainViewScenePath);
    }
    return mainView;
  }
  onReconnect() {
    if (this.didRelease) {
      this.rebind();
    } else {
      const mainViewScenePath = this.store.getMainViewScenePath();
      this.setFocusScenePath(mainViewScenePath);
    }
  }
  setFocusScenePath(path) {
    if (path) {
      return setViewFocusScenePath(this.view, path);
    }
  }
  rebind() {
    const divElement = this.mainView.divElement;
    const disableCameraTransform = this.mainView.disableCameraTransform;
    this.stop();
    if (!this.didRelease) {
      this.mainView.release();
    }
    this.removeMainViewListener();
    this.mainView = this.createMainView();
    this.mainView.disableCameraTransform = disableCameraTransform;
    this.mainView.divElement = divElement;
    this.addMainViewListener();
    this.start();
    callbacks$1.emit("onMainViewRebind", this.mainView);
  }
  addMainViewListener() {
    if (this.mainViewIsAddListener)
      return;
    if (this.view.divElement) {
      this.view.divElement.addEventListener("click", this.mainViewClickListener);
      this.view.divElement.addEventListener("touchend", this.mainViewClickListener);
      this.mainViewIsAddListener = true;
    }
  }
  removeMainViewListener() {
    if (this.view.divElement) {
      this.view.divElement.removeEventListener("click", this.mainViewClickListener);
      this.view.divElement.removeEventListener("touchend", this.mainViewClickListener);
    }
    this.mainViewIsAddListener = false;
  }
  async mainViewClickHandler() {
    var _a;
    if (!this.manager.canOperate)
      return;
    this.store.cleanFocus();
    (_a = this.manager.boxManager) == null ? void 0 : _a.blurAllBox();
  }
  addCameraListener() {
    this.view.callbacks.on("onCameraUpdatedByDevice", this.onCameraUpdatedByDevice);
    this.view.callbacks.on("onCameraUpdated", this.onCameraOrSizeUpdated);
    this.view.callbacks.on("onSizeUpdated", this.onCameraOrSizeUpdated);
  }
  removeCameraListener() {
    this.view.callbacks.off("onCameraUpdatedByDevice", this.onCameraUpdatedByDevice);
    this.view.callbacks.off("onCameraUpdated", this.onCameraOrSizeUpdated);
    this.view.callbacks.off("onSizeUpdated", this.onCameraOrSizeUpdated);
  }
  ensureMainViewSize() {
    if ((!this.mainViewSize || this.mainViewSize.width === 0 || this.mainViewSize.height === 0) && this.mainView.size.width > 0 && this.mainView.size.height > 0) {
      this.setMainViewSize(this.mainView.size);
    }
  }
  moveCameraToContian(size2) {
    if (!isEmpty(size2)) {
      this.view.moveCameraToContain({
        width: size2.width,
        height: size2.height,
        originX: -size2.width / 2,
        originY: -size2.height / 2,
        animationMode: AnimationMode.Immediately
      });
      this.scale = this.view.camera.scale;
    }
  }
  moveCamera(camera) {
    if (!isEmpty(camera)) {
      if (isEqual(camera, this.view.camera))
        return;
      const { centerX, centerY, scale: scale2 } = camera;
      const needScale = scale2 * (this.scale || 1);
      this.view.moveCamera({
        centerX,
        centerY,
        scale: needScale,
        animationMode: AnimationMode.Immediately
      });
    }
  }
  stop() {
    this.removeCameraListener();
    this.manager.refresher.remove(Fields.MainViewCamera);
    this.manager.refresher.remove(Fields.MainViewSize);
    this.started = false;
  }
  destroy() {
    this.removeMainViewListener();
    this.stop();
    this.sideEffectManager.flushAll();
  }
}
class RedoUndo {
  constructor(context) {
    this.context = context;
    this.addRedoUndoListeners = (focused) => {
      if (focused === void 0) {
        this.addViewCallbacks(
          this.context.mainView(),
          this.onCanRedoStepsUpdate,
          this.onCanUndoStepsUpdate
        );
      } else {
        const focusApp = this.context.getAppProxy(focused);
        if (focusApp && focusApp.view) {
          this.addViewCallbacks(
            focusApp.view,
            this.onCanRedoStepsUpdate,
            this.onCanUndoStepsUpdate
          );
        }
      }
    };
    this.addViewCallbacks = (view, redoListener, undoListener) => {
      redoListener(view.canRedoSteps);
      undoListener(view.canUndoSteps);
      view.callbacks.on("onCanRedoStepsUpdate", redoListener);
      view.callbacks.on("onCanUndoStepsUpdate", undoListener);
    };
    this.disposeViewCallbacks = (view) => {
      view.callbacks.off("onCanRedoStepsUpdate", this.onCanRedoStepsUpdate);
      view.callbacks.off("onCanUndoStepsUpdate", this.onCanUndoStepsUpdate);
    };
    this.onCanRedoStepsUpdate = (steps2) => {
      callbacks$1.emit("canRedoStepsChange", steps2);
    };
    this.onCanUndoStepsUpdate = (steps2) => {
      callbacks$1.emit("canUndoStepsChange", steps2);
    };
    this.disposePrevFocusViewRedoUndoListeners = (prevFocused) => {
      let view = void 0;
      if (prevFocused === void 0) {
        view = this.context.mainView();
      } else {
        const appProxy = this.context.getAppProxy(prevFocused);
        if (appProxy && appProxy.view) {
          view = appProxy.view;
        }
      }
      if (view) {
        this.disposeViewCallbacks(view);
      }
    };
    internalEmitter.on("focusedChange", (changed) => {
      this.disposePrevFocusViewRedoUndoListeners(changed.prev);
      setTimeout(() => {
        this.addRedoUndoListeners(changed.focused);
      }, 0);
    });
    internalEmitter.on("rootDirRemoved", () => {
      this.disposePrevFocusViewRedoUndoListeners(context.focus());
      this.addRedoUndoListeners(context.focus());
    });
    this.addRedoUndoListeners(context.focus());
  }
  destroy() {
    this.disposePrevFocusViewRedoUndoListeners(this.context.focus());
  }
}
class AppManager {
  constructor(windowManger) {
    this.windowManger = windowManger;
    this.appProxies = /* @__PURE__ */ new Map();
    this.appStatus = /* @__PURE__ */ new Map();
    this.store = store;
    this.isReplay = this.windowManger.isReplay;
    this.mainViewScenesLength = 0;
    this.callbacksNode = null;
    this.appCreateQueue = new AppCreateQueue();
    this.sideEffectManager = new o$2();
    this.sceneState = null;
    this.rootDirRemoving = false;
    this.onRemoveScenes = async (params) => {
      var _a, _b;
      const { scenePath } = params;
      if (scenePath === ROOT_DIR) {
        await this.onRootDirRemoved();
        this.dispatchInternalEvent(Events.RootDirRemoved);
        return;
      }
      if (isRootDirPage(scenePath)) {
        let nextIndex = this.mainView.focusSceneIndex || 0;
        let sceneName = (_a = this.callbacksNode) == null ? void 0 : _a.scenes[nextIndex];
        if (!sceneName) {
          nextIndex = 0;
          sceneName = (_b = this.callbacksNode) == null ? void 0 : _b.scenes[nextIndex];
        }
        if (sceneName) {
          this.setMainViewScenePath(`${ROOT_DIR}${sceneName}`);
        }
        await this.setMainViewSceneIndex(nextIndex);
      } else {
        this.appProxies.forEach((app) => {
          app.onRemoveScene(scenePath);
        });
      }
    };
    this.onReadonlyChanged = () => {
      this.appProxies.forEach((appProxy) => {
        appProxy.emitAppIsWritableChange();
      });
    };
    this.onPlayerSeekStart = async () => {
      await this.closeAll();
    };
    this.onPlayerSeekDone = async (time2) => {
      await this.attributesUpdateCallback(this.attributes.apps);
      this.appProxies.forEach((appProxy) => {
        appProxy.onSeek(time2);
      });
    };
    this.createRootDirScenesCallback = () => {
      let isRecreate = false;
      if (this.callbacksNode) {
        this.callbacksNode.dispose();
        isRecreate = true;
      }
      this.callbacksNode = this.displayer.createScenesCallback(ROOT_DIR, {
        onAddScene: this.onSceneChange,
        onRemoveScene: async (node, name) => {
          await this.onSceneChange(node);
          internalEmitter.emit("rootDirSceneRemoved", name);
        }
      });
      if (this.callbacksNode) {
        this.updateSceneState(this.callbacksNode);
        this.mainViewScenesLength = this.callbacksNode.scenes.length;
        if (isRecreate) {
          this.emitMainViewScenesChange(this.callbacksNode.scenes.length);
        }
      }
    };
    this.removeSceneByIndex = async (index2) => {
      var _a;
      const nextIndex = calculateNextIndex(index2, this.windowManger.pageState);
      this.setSceneIndexWithoutSync(nextIndex);
      this.dispatchInternalEvent(Events.SetAppFocusIndex, { type: "main", index: nextIndex });
      const scene = (_a = this.callbacksNode) == null ? void 0 : _a.scenes[index2];
      setTimeout(() => {
        if (scene) {
          removeScenes(this.room, `${ROOT_DIR}${scene}`, index2);
        }
      }, 100);
      return new Promise((resolve, reject) => {
        internalEmitter.once("rootDirSceneRemoved").then((name) => {
          if (name === scene) {
            resolve(true);
          }
        }).catch((e2) => {
          console.log(`[WindowManager]: removePage error: ${e2}`);
          reject(false);
        });
      });
    };
    this.setSceneIndexWithoutSync = (index2) => {
      var _a;
      const sceneName = (_a = this.callbacksNode) == null ? void 0 : _a.scenes[index2];
      if (sceneName) {
        this.mainViewProxy.setFocusScenePath(`${ROOT_DIR}${sceneName}`);
      }
    };
    this.onSceneChange = (node) => {
      this.mainViewScenesLength = node.scenes.length;
      this.updateSceneState(node);
      return this.emitMainViewScenesChange(this.mainViewScenesLength);
    };
    this.emitMainViewScenesChange = (length) => {
      return Promise.all([
        callbacks$1.emit("mainViewScenesLengthChange", length),
        internalEmitter.emit("changePageState")
      ]);
    };
    this.updateSceneState = (node) => {
      const currentIndex = this.store.getMainViewSceneIndex() || 0;
      let sceneName = node.scenes[currentIndex];
      if (!sceneName) {
        sceneName = node.scenes[this.mainView.focusSceneIndex || 0];
      }
      this.sceneState = {
        scenePath: `${ROOT_DIR}${sceneName}`,
        contextPath: node.path,
        index: currentIndex,
        scenes: node.scenes.map((scene) => {
          return {
            name: scene
          };
        }),
        sceneName
      };
      callbacks$1.emit("sceneStateChange", this.sceneState);
    };
    this.onBoxMove = (payload) => {
      this.dispatchInternalEvent(Events.AppMove, payload);
      this.store.updateAppState(payload.appId, AppAttributes.Position, {
        x: payload.x,
        y: payload.y
      });
      callbacks$1.emit("onBoxMove", payload);
    };
    this.onBoxResize = (payload) => {
      if (payload.width && payload.height) {
        this.dispatchInternalEvent(Events.AppResize, payload);
        this.store.updateAppState(payload.appId, AppAttributes.Size, {
          width: payload.width,
          height: payload.height
        });
        callbacks$1.emit("onBoxResize", payload);
      }
    };
    this.onBoxFocus = (payload) => {
      this.windowManger.safeSetAttributes({ focus: payload.appId });
      callbacks$1.emit("onBoxFocus", payload);
    };
    this.onBoxClose = (payload) => {
      const appProxy = this.appProxies.get(payload.appId);
      if (appProxy) {
        appProxy.destroy(false, true, true, payload.error);
      }
      callbacks$1.emit("onBoxClose", payload);
    };
    this.onBoxStateChange = (payload) => {
      this.dispatchInternalEvent(Events.AppBoxStateChange, payload);
      callbacks$1.emit("onBoxStateChange", payload);
    };
    this.addAppsChangeListener = () => {
      this.refresher.add("apps", () => {
        return safeListenPropsUpdated(
          () => this.attributes.apps,
          () => {
            this.attributesUpdateCallback(this.attributes.apps);
          }
        );
      });
    };
    this.addAppCloseListener = () => {
      this.refresher.add("appsClose", () => {
        return onObjectRemoved(this.attributes.apps, () => {
          this.onAppDelete(this.attributes.apps);
        });
      });
    };
    this.onMainViewIndexChange = (index2) => {
      if (index2 !== void 0 && this._prevSceneIndex !== index2) {
        callbacks$1.emit("mainViewSceneIndexChange", index2);
        internalEmitter.emit("changePageState");
        if (this.callbacksNode) {
          this.updateSceneState(this.callbacksNode);
        }
        this._prevSceneIndex = index2;
      }
    };
    this.onFocusChange = (focused) => {
      var _a;
      if (this._prevFocused !== focused) {
        callbacks$1.emit("focusedChange", focused);
        internalEmitter.emit("focusedChange", { focused, prev: this._prevFocused });
        this._prevFocused = focused;
        if (focused !== void 0) {
          (_a = this.boxManager) == null ? void 0 : _a.focusBox({ appId: focused });
          setTimeout(() => {
            const appProxy = this.appProxies.get(focused);
            if (appProxy) {
              appRegister.notifyApp(appProxy.kind, "focus", { appId: focused });
            }
          }, 0);
        }
      }
    };
    this.attributesUpdateCallback = debounce(
      (apps) => this._attributesUpdateCallback(apps),
      100
    );
    this._appIds = [];
    this.onRegisteredChange = (registered) => {
      if (!registered)
        return;
      Object.entries(registered).forEach(([kind2, payload]) => {
        if (!appRegister.appClasses.has(kind2)) {
          appRegister.register({
            kind: kind2,
            src: payload.src,
            name: payload.name
          });
        }
      });
    };
    this.onMinimized = (minimized) => {
      var _a;
      if (((_a = this.boxManager) == null ? void 0 : _a.minimized) !== minimized) {
        setTimeout(() => {
          var _a2;
          (_a2 = this.boxManager) == null ? void 0 : _a2.setMinimized(minimized);
        }, 0);
      }
    };
    this.onAppDelete = async (apps) => {
      const ids = Object.keys(apps);
      for (const [id2, appProxy] of this.appProxies.entries()) {
        if (!ids.includes(id2)) {
          await appProxy.destroy(true, false, true);
        }
      }
    };
    this.closeAll = async () => {
      for (const [_2, appProxy] of this.appProxies.entries()) {
        await appProxy.destroy(true, false, true);
      }
    };
    this.displayerStateListener = (state) => {
      this.appProxies.forEach((appProxy) => {
        appProxy.appEmitter.emit("roomStateChange", state);
      });
      internalEmitter.emit("observerIdChange", this.displayer.observerId);
    };
    this.displayerWritableListener = (isReadonly) => {
      var _a, _b;
      const isWritable = !isReadonly;
      const isManualWritable = this.windowManger.readonly === void 0 || this.windowManger.readonly === false;
      if (this.windowManger.readonly === void 0) {
        (_a = this.boxManager) == null ? void 0 : _a.setReadonly(isReadonly);
      } else {
        (_b = this.boxManager) == null ? void 0 : _b.setReadonly(!(isWritable && isManualWritable));
      }
      this.appProxies.forEach((appProxy) => {
        appProxy.emitAppIsWritableChange();
      });
      internalEmitter.emit("writableChange", isWritable);
    };
    this.updateSceneIndex = () => {
      const scenePath = this.store.getMainViewScenePath();
      const sceneDir = parseSceneDir(scenePath);
      const scenes = entireScenes(this.displayer)[sceneDir];
      if (scenes.length) {
        const pageName = scenePath.replace(sceneDir, "").replace("/", "");
        const index2 = scenes.findIndex((scene) => scene.name === pageName);
        if (isInteger(index2) && index2 >= 0) {
          this.safeSetAttributes({ _mainSceneIndex: index2 });
        }
      }
    };
    this.updateRootDirRemoving = (removing) => {
      this.rootDirRemoving = removing;
    };
    this.displayer = windowManger.displayer;
    this.store.setContext({
      getAttributes: () => this.attributes,
      safeSetAttributes: (attributes) => this.safeSetAttributes(attributes),
      safeUpdateAttributes: (keys, val) => this.safeUpdateAttributes(keys, val)
    });
    this.mainViewProxy = new MainViewProxy(this);
    this.viewManager = new ViewManager(this.displayer);
    this.appListeners = new AppListeners(this);
    this.displayer.callbacks.on(this.eventName, this.displayerStateListener);
    this.appListeners.addListeners();
    this.refresher = reconnectRefresher;
    this.refresher.setRoom(this.room);
    this.refresher.setContext({ emitter: internalEmitter });
    this.sideEffectManager.addDisposer(() => {
      var _a, _b;
      this.appCreateQueue.destroy();
      this.mainViewProxy.destroy();
      this.refresher.destroy();
      this.viewManager.destroy();
      (_a = this.boxManager) == null ? void 0 : _a.destroy();
      (_b = this.callbacksNode) == null ? void 0 : _b.dispose();
    });
    internalEmitter.once("onCreated").then(() => this.onCreated());
    internalEmitter.on("onReconnected", () => this.onReconnected());
    if (isPlayer(this.displayer)) {
      internalEmitter.on("seekStart", this.onPlayerSeekStart);
      internalEmitter.on("seek", this.onPlayerSeekDone);
    }
    internalEmitter.on("removeScenes", this.onRemoveScenes);
    internalEmitter.on("setReadonly", this.onReadonlyChanged);
    this.createRootDirScenesCallback();
    appRegister.setSyncRegisterApp((payload) => {
      this.safeUpdateAttributes([Fields.Registered, payload.kind], payload);
    });
  }
  getMemberState() {
    var _a;
    return ((_a = this.room) == null ? void 0 : _a.state.memberState) || { strokeColor: [0, 0, 0] };
  }
  async onRootDirRemoved(needClose = true) {
    this.setMainViewScenePath(INIT_DIR);
    this.createRootDirScenesCallback();
    for (const [id2, appProxy] of this.appProxies.entries()) {
      if (appProxy.view) {
        await this.closeApp(id2, needClose);
      }
    }
    this.mainViewProxy.rebind();
    internalEmitter.emit("rootDirRemoved");
    this.updateRootDirRemoving(false);
  }
  get eventName() {
    return isRoom(this.displayer) ? "onRoomStateChanged" : "onPlayerStateChanged";
  }
  get attributes() {
    return this.windowManger.attributes;
  }
  get canOperate() {
    return this.windowManger.canOperate;
  }
  get room() {
    return isRoom(this.displayer) ? this.displayer : void 0;
  }
  get mainView() {
    return this.mainViewProxy.view;
  }
  get polling() {
    return this.mainViewProxy.polling;
  }
  set polling(b2) {
    this.mainViewProxy.polling = b2;
  }
  get focusApp() {
    if (this.store.focus) {
      return this.appProxies.get(this.store.focus);
    }
  }
  get uid() {
    var _a;
    return ((_a = this.room) == null ? void 0 : _a.uid) || "";
  }
  getMainViewSceneDir() {
    const scenePath = this.store.getMainViewScenePath();
    if (scenePath) {
      return parseSceneDir(scenePath);
    } else {
      throw new Error("[WindowManager]: mainViewSceneDir not found");
    }
  }
  async onCreated() {
    var _a;
    await this.attributesUpdateCallback(this.attributes.apps);
    internalEmitter.emit("updateManagerRect");
    boxEmitter.on("move", this.onBoxMove);
    boxEmitter.on("resize", this.onBoxResize);
    boxEmitter.on("focus", this.onBoxFocus);
    boxEmitter.on("close", this.onBoxClose);
    boxEmitter.on("boxStateChange", this.onBoxStateChange);
    this.addAppsChangeListener();
    this.addAppCloseListener();
    this.refresher.add("maximizedBoxes", () => {
      return autorun(() => {
        var _a2;
        const maximized = this.attributes.maximizedBoxes;
        (_a2 = this.boxManager) == null ? void 0 : _a2.setMaximized(maximized);
      });
    });
    this.refresher.add("minimizedBoxes", () => {
      return autorun(() => {
        const minimized = this.attributes.minimizedBoxes;
        this.onMinimized(minimized);
      });
    });
    this.refresher.add("mainViewIndex", () => {
      return autorun(() => {
        const mainSceneIndex = get(this.attributes, "_mainSceneIndex");
        this.onMainViewIndexChange(mainSceneIndex);
      });
    });
    this.refresher.add("focusedChange", () => {
      return autorun(() => {
        const focused = get(this.attributes, "focus");
        this.onFocusChange(focused);
      });
    });
    this.refresher.add("registeredChange", () => {
      return autorun(() => {
        const registered = get(this.attributes, Fields.Registered);
        this.onRegisteredChange(registered);
      });
    });
    if (!this.attributes.apps || Object.keys(this.attributes.apps).length === 0) {
      const mainScenePath = this.store.getMainViewScenePath();
      if (!mainScenePath)
        return;
      this.resetScenePath(mainScenePath);
    }
    this.displayerWritableListener(!((_a = this.room) == null ? void 0 : _a.isWritable));
    this.displayer.callbacks.on("onEnableWriteNowChanged", this.displayerWritableListener);
    this._prevFocused = this.attributes.focus;
    this.sideEffectManager.add(() => {
      const redoUndo = new RedoUndo({
        mainView: () => this.mainViewProxy.view,
        focus: () => this.attributes.focus,
        getAppProxy: (id2) => this.appProxies.get(id2)
      });
      return () => redoUndo.destroy();
    });
  }
  notifyAppsChange(appIds) {
    if (this._appIds.length !== appIds.length || !this._appIds.every((id2) => appIds.includes(id2))) {
      this._appIds = appIds;
      callbacks$1.emit("appsChange", appIds);
    }
  }
  async _attributesUpdateCallback(apps) {
    if (apps && WindowManager.container) {
      const appIds = Object.keys(apps);
      if (appIds.length === 0) {
        this.appCreateQueue.emitReady();
      }
      const appsWithCreatedAt = orderBy(
        appIds.map((appId) => {
          return {
            id: appId,
            createdAt: apps[appId].createdAt
          };
        }),
        "createdAt",
        "asc"
      );
      const orderedAppIds = appsWithCreatedAt.map(({ id: id2 }) => id2);
      this.notifyAppsChange(orderedAppIds);
      for (const id2 of orderedAppIds) {
        if (!this.appProxies.has(id2) && !this.appStatus.has(id2)) {
          const app = apps[id2];
          try {
            const appAttributes = this.attributes[id2];
            if (!appAttributes) {
              throw new Error("appAttributes is undefined");
            }
            this.appCreateQueue.push(() => {
              this.appStatus.set(id2, AppStatus.StartCreate);
              return this.baseInsertApp(
                {
                  kind: app.kind,
                  options: app.options,
                  isDynamicPPT: app.isDynamicPPT
                },
                id2,
                false
              );
            });
            this.focusByAttributes(apps);
          } catch (error) {
            console.warn(`[WindowManager]: Insert App Error`, error);
          }
        }
      }
    }
  }
  refresh() {
    this.attributesUpdateCallback(this.attributes.apps);
  }
  setBoxManager(boxManager) {
    this.boxManager = boxManager;
  }
  resetMaximized() {
    var _a;
    (_a = this.boxManager) == null ? void 0 : _a.setMaximized(this.store.getMaximized() ? this.store.getMaximized() : []);
  }
  resetMinimized() {
    var _a;
    (_a = this.boxManager) == null ? void 0 : _a.setMinimized(this.store.getMinimized() ? this.store.getMinimized() : []);
  }
  bindMainView(divElement, disableCameraTransform) {
    const mainView = this.mainViewProxy.view;
    mainView.disableCameraTransform = disableCameraTransform;
    mainView.divElement = divElement;
    if (!mainView.focusScenePath) {
      this.setMainViewFocusPath();
    }
    internalEmitter.emit("mainViewMounted");
    callbacks$1.emit("onMainViewMounted", mainView);
  }
  setMainViewFocusPath(scenePath) {
    var _a;
    const focusScenePath = scenePath || this.store.getMainViewScenePath();
    if (focusScenePath) {
      setViewFocusScenePath(this.mainView, focusScenePath);
      return ((_a = this.mainView) == null ? void 0 : _a.focusScenePath) === focusScenePath;
    }
  }
  resetScenePath(scenePath) {
    const sceneState = this.displayer.state.sceneState;
    if (sceneState.scenePath !== scenePath) {
      setScenePath(this.room, scenePath);
    }
  }
  async addApp(params, isDynamicPPT) {
    log("addApp", params);
    const { appId, needFocus } = await this.beforeAddApp(params, isDynamicPPT);
    const appProxy = await this.baseInsertApp(params, appId, true, needFocus);
    this.afterAddApp(appProxy);
    return appProxy == null ? void 0 : appProxy.id;
  }
  async beforeAddApp(params, isDynamicPPT) {
    var _a, _b;
    const appId = await genAppId(params.kind);
    this.appStatus.set(appId, AppStatus.StartCreate);
    const attrs = (_a = params.attributes) != null ? _a : {};
    this.safeUpdateAttributes([appId], attrs);
    this.store.setupAppAttributes(params, appId, isDynamicPPT);
    const needFocus = !((_b = this.boxManager) == null ? void 0 : _b.minimized);
    if (needFocus) {
      this.store.setAppFocus(appId, true);
    }
    return { appId, needFocus };
  }
  afterAddApp(appProxy) {
    var _a;
    if (appProxy && appProxy.box) {
      const box = appProxy.box;
      boxEmitter.emit("move", {
        appId: appProxy.id,
        x: box == null ? void 0 : box.intrinsicX,
        y: box == null ? void 0 : box.intrinsicY
      });
      this.store.updateAppState(appProxy.id, AppAttributes.ZIndex, box.zIndex);
    }
    if ((_a = this.boxManager) == null ? void 0 : _a.minimized)
      ;
  }
  async closeApp(appId, needClose = true) {
    const appProxy = this.appProxies.get(appId);
    if (appProxy) {
      appProxy.destroy(true, needClose, false);
    }
  }
  async baseInsertApp(params, appId, isAddApp, focus) {
    if (this.appProxies.has(appId)) {
      console.warn("[WindowManager]: app duplicate exists and cannot be created again");
      return;
    }
    const appProxy = new AppProxy(params, this, appId, isAddApp);
    if (appProxy) {
      await appProxy.baseInsertApp(focus);
      this.appStatus.delete(appId);
      return appProxy;
    } else {
      this.appStatus.delete(appId);
      throw new Error("[WindowManger]: initialize AppProxy failed");
    }
  }
  safeSetAttributes(attributes) {
    this.windowManger.safeSetAttributes(attributes);
  }
  safeUpdateAttributes(keys, value) {
    this.windowManger.safeUpdateAttributes(keys, value);
  }
  async setMainViewScenePath(scenePath) {
    if (this.room) {
      const scenePathType = this.displayer.scenePathType(scenePath);
      const sceneDir = parseSceneDir(scenePath);
      if (sceneDir !== ROOT_DIR) {
        throw new Error(`[WindowManager]: main view scenePath must in root dir "/"`);
      }
      if (scenePathType === ScenePathType.None) {
        throw new Error(`[WindowManager]: ${scenePath} not valid scene`);
      } else if (scenePathType === ScenePathType.Page) {
        await this._setMainViewScenePath(scenePath);
      } else if (scenePathType === ScenePathType.Dir) {
        const validScenePath = makeValidScenePath(this.displayer, scenePath);
        if (validScenePath) {
          await this._setMainViewScenePath(validScenePath);
        }
      }
    }
  }
  async _setMainViewScenePath(scenePath) {
    const success = this.setMainViewFocusPath(scenePath);
    if (success) {
      this.safeSetAttributes({ _mainScenePath: scenePath });
      this.store.setMainViewFocusPath(this.mainView);
      this.updateSceneIndex();
      this.dispatchSetMainViewScenePath(scenePath);
    }
  }
  async setMainViewSceneIndex(index2) {
    var _a;
    if (this.room) {
      if (this.store.getMainViewSceneIndex() === index2)
        return;
      const sceneName = (_a = this.callbacksNode) == null ? void 0 : _a.scenes[index2];
      const scenePath = `${ROOT_DIR}${sceneName}`;
      if (sceneName) {
        const success = this.setMainViewFocusPath(scenePath);
        if (success) {
          this.store.setMainViewScenePath(scenePath);
          this.store.setMainViewSceneIndex(index2);
          this.dispatchSetMainViewScenePath(scenePath);
        }
      } else {
        throw new Error(`[WindowManager]: ${index2} not valid index`);
      }
    }
  }
  dispatchSetMainViewScenePath(scenePath) {
    this.dispatchInternalEvent(Events.SetMainViewScenePath, { nextScenePath: scenePath });
    callbacks$1.emit("mainViewScenePathChange", scenePath);
    setScenePath(this.room, scenePath);
  }
  getAppInitPath(appId) {
    var _a;
    const attrs = this.store.getAppAttributes(appId);
    if (attrs) {
      return (_a = attrs == null ? void 0 : attrs.options) == null ? void 0 : _a.scenePath;
    }
  }
  safeDispatchMagixEvent(event, payload) {
    if (this.canOperate) {
      this.displayer.dispatchMagixEvent(event, payload);
    }
  }
  focusByAttributes(apps) {
    var _a;
    if (apps && Object.keys(apps).length === ((_a = this.boxManager) == null ? void 0 : _a.boxSize)) {
      const focusAppId = this.store.focus;
      if (focusAppId) {
        this.boxManager.focusBox({ appId: focusAppId });
      }
    }
  }
  async onReconnected() {
    this.attributesUpdateCallback(this.attributes.apps);
    const appProxies = Array.from(this.appProxies.values());
    const reconnected = appProxies.map((appProxy) => {
      return appProxy.onReconnected();
    });
    this.mainViewProxy.onReconnect();
    await Promise.all(reconnected);
    if (this.callbacksNode) {
      this.onSceneChange(this.callbacksNode);
    }
  }
  notifyContainerRectUpdate(rect) {
    this.appProxies.forEach((appProxy) => {
      appProxy.appEmitter.emit("containerRectUpdate", rect);
    });
  }
  dispatchInternalEvent(event, payload) {
    this.safeDispatchMagixEvent(MagixEventName, {
      eventName: event,
      payload
    });
  }
  destroy() {
    this.displayer.callbacks.off(this.eventName, this.displayerStateListener);
    this.displayer.callbacks.off("onEnableWriteNowChanged", this.displayerWritableListener);
    this.appListeners.removeListeners();
    boxEmitter.clearListeners();
    internalEmitter.clearListeners();
    if (this.appProxies.size) {
      this.appProxies.forEach((appProxy) => {
        appProxy.destroy(true, false, true);
      });
    }
    callbacks$1.clearListeners();
    this.sideEffectManager.flushAll();
    this._prevFocused = void 0;
    this._prevSceneIndex = void 0;
  }
}
const setupWrapper = (root) => {
  const playground = document.createElement("div");
  playground.className = "netless-window-manager-playground";
  const sizer = document.createElement("div");
  sizer.className = "netless-window-manager-sizer";
  const wrapper = document.createElement("div");
  wrapper.className = "netless-window-manager-wrapper";
  const mainViewWrapper = document.createElement("div");
  mainViewWrapper.className = "netless-window-manager-main-view-wrapper";
  const mainViewElement = document.createElement("div");
  mainViewElement.className = "netless-window-manager-main-view";
  playground.appendChild(sizer);
  sizer.appendChild(wrapper);
  mainViewWrapper.appendChild(mainViewElement);
  wrapper.appendChild(mainViewElement);
  root.appendChild(playground);
  WindowManager.wrapper = wrapper;
  return { playground, wrapper, sizer, mainViewElement, mainViewWrapper };
};
const checkVersion = () => {
  const version = getVersionNumber(WhiteVersion);
  if (version < getVersionNumber(REQUIRE_VERSION)) {
    throw new WhiteWebSDKInvalidError(REQUIRE_VERSION);
  }
};
const findMemberByUid = (room, uid) => {
  var _a;
  const roomMembers = (room == null ? void 0 : room.state.roomMembers) || [];
  let maxMemberId = -1;
  let result = void 0;
  for (const member of roomMembers) {
    if (((_a = member.payload) == null ? void 0 : _a.uid) === uid && maxMemberId < member.memberId) {
      maxMemberId = member.memberId;
      result = member;
    }
  }
  return result;
};
const createInvisiblePlugin = async (room) => {
  let manager = room.getInvisiblePlugin(WindowManager.kind);
  if (manager)
    return manager;
  let resolve;
  const promise = new Promise((r2) => {
    WindowManager._resolve = resolve = r2;
  });
  let wasReadonly = false;
  const canOperate = isRoomTokenWritable(room);
  if (!room.isWritable && canOperate) {
    wasReadonly = true;
    await pRetry(
      async (count) => {
        log(`switching to writable (x${count})`);
        await room.setWritable(true);
      },
      { retries: 10, maxTimeout: 5e3 }
    );
  }
  if (room.isWritable) {
    log("creating InvisiblePlugin...");
    room.createInvisiblePlugin(WindowManager, {}).catch(console.warn);
  } else {
    if (canOperate)
      console.warn("[WindowManager]: failed to switch to writable");
    console.warn("[WindowManager]: waiting for others to create the plugin...");
  }
  const timeout = setTimeout(() => {
    console.warn("[WindowManager]: no one called createInvisiblePlugin() after 20 seconds");
  }, 2e4);
  const abort = setTimeout(() => {
    throw new Error("[WindowManager]: no one called createInvisiblePlugin() after 60 seconds");
  }, 6e4);
  const interval = setInterval(() => {
    manager = room.getInvisiblePlugin(WindowManager.kind);
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
const isRoomTokenWritable = (room) => {
  try {
    const str = atob(room.roomToken.slice("NETLESSROOM_".length));
    const index2 = str.indexOf("&role=");
    const role = +str[index2 + "&role=".length];
    return role < 2;
  } catch (error) {
    console.error(error);
    return false;
  }
};
const ResizeObserver$2 = window.ResizeObserver || ResizeObserver$3;
class ContainerResizeObserver {
  constructor(emitter) {
    this.emitter = emitter;
  }
  static create(container, sizer, wrapper, emitter) {
    const containerResizeObserver = new ContainerResizeObserver(emitter);
    containerResizeObserver.observePlaygroundSize(container, sizer, wrapper);
    return containerResizeObserver;
  }
  observePlaygroundSize(container, sizer, wrapper) {
    this.updateSizer(container.getBoundingClientRect(), sizer, wrapper);
    this.containerResizeObserver = new ResizeObserver$2((entries) => {
      var _a;
      const containerRect = (_a = entries[0]) == null ? void 0 : _a.contentRect;
      if (containerRect) {
        this.updateSizer(containerRect, sizer, wrapper);
        this.emitter.emit("playgroundSizeChange", containerRect);
      }
    });
    this.disposer = this.emitter.on("containerSizeRatioUpdate", () => {
      const containerRect = container.getBoundingClientRect();
      this.updateSizer(containerRect, sizer, wrapper);
      this.emitter.emit("playgroundSizeChange", containerRect);
    });
    this.containerResizeObserver.observe(container);
  }
  updateSizer({ width, height }, sizer, wrapper) {
    if (width && height) {
      if (height / width > WindowManager.containerSizeRatio) {
        height = width * WindowManager.containerSizeRatio;
        sizer.classList.toggle("netless-window-manager-sizer-horizontal", true);
      } else {
        width = height / WindowManager.containerSizeRatio;
        sizer.classList.toggle("netless-window-manager-sizer-horizontal", false);
      }
      wrapper.style.width = `${width}px`;
      wrapper.style.height = `${height}px`;
    }
  }
  disconnect() {
    var _a;
    (_a = this.containerResizeObserver) == null ? void 0 : _a.disconnect();
    if (isFunction(this.disposer)) {
      this.disposer();
      this.disposer = void 0;
    }
  }
}
var eventemitter3 = { exports: {} };
(function(module) {
  var has2 = Object.prototype.hasOwnProperty, prefix = "~";
  function Events2() {
  }
  if (Object.create) {
    Events2.prototype = /* @__PURE__ */ Object.create(null);
    if (!new Events2().__proto__)
      prefix = false;
  }
  function EE(fn, context, once) {
    this.fn = fn;
    this.context = context;
    this.once = once || false;
  }
  function addListener(emitter, event, fn, context, once) {
    if (typeof fn !== "function") {
      throw new TypeError("The listener must be a function");
    }
    var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
    if (!emitter._events[evt])
      emitter._events[evt] = listener, emitter._eventsCount++;
    else if (!emitter._events[evt].fn)
      emitter._events[evt].push(listener);
    else
      emitter._events[evt] = [emitter._events[evt], listener];
    return emitter;
  }
  function clearEvent(emitter, evt) {
    if (--emitter._eventsCount === 0)
      emitter._events = new Events2();
    else
      delete emitter._events[evt];
  }
  function EventEmitter2() {
    this._events = new Events2();
    this._eventsCount = 0;
  }
  EventEmitter2.prototype.eventNames = function eventNames() {
    var names = [], events2, name;
    if (this._eventsCount === 0)
      return names;
    for (name in events2 = this._events) {
      if (has2.call(events2, name))
        names.push(prefix ? name.slice(1) : name);
    }
    if (Object.getOwnPropertySymbols) {
      return names.concat(Object.getOwnPropertySymbols(events2));
    }
    return names;
  };
  EventEmitter2.prototype.listeners = function listeners(event) {
    var evt = prefix ? prefix + event : event, handlers = this._events[evt];
    if (!handlers)
      return [];
    if (handlers.fn)
      return [handlers.fn];
    for (var i2 = 0, l2 = handlers.length, ee2 = new Array(l2); i2 < l2; i2++) {
      ee2[i2] = handlers[i2].fn;
    }
    return ee2;
  };
  EventEmitter2.prototype.listenerCount = function listenerCount(event) {
    var evt = prefix ? prefix + event : event, listeners = this._events[evt];
    if (!listeners)
      return 0;
    if (listeners.fn)
      return 1;
    return listeners.length;
  };
  EventEmitter2.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
    var evt = prefix ? prefix + event : event;
    if (!this._events[evt])
      return false;
    var listeners = this._events[evt], len = arguments.length, args, i2;
    if (listeners.fn) {
      if (listeners.once)
        this.removeListener(event, listeners.fn, void 0, true);
      switch (len) {
        case 1:
          return listeners.fn.call(listeners.context), true;
        case 2:
          return listeners.fn.call(listeners.context, a1), true;
        case 3:
          return listeners.fn.call(listeners.context, a1, a2), true;
        case 4:
          return listeners.fn.call(listeners.context, a1, a2, a3), true;
        case 5:
          return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
        case 6:
          return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
      }
      for (i2 = 1, args = new Array(len - 1); i2 < len; i2++) {
        args[i2 - 1] = arguments[i2];
      }
      listeners.fn.apply(listeners.context, args);
    } else {
      var length = listeners.length, j2;
      for (i2 = 0; i2 < length; i2++) {
        if (listeners[i2].once)
          this.removeListener(event, listeners[i2].fn, void 0, true);
        switch (len) {
          case 1:
            listeners[i2].fn.call(listeners[i2].context);
            break;
          case 2:
            listeners[i2].fn.call(listeners[i2].context, a1);
            break;
          case 3:
            listeners[i2].fn.call(listeners[i2].context, a1, a2);
            break;
          case 4:
            listeners[i2].fn.call(listeners[i2].context, a1, a2, a3);
            break;
          default:
            if (!args)
              for (j2 = 1, args = new Array(len - 1); j2 < len; j2++) {
                args[j2 - 1] = arguments[j2];
              }
            listeners[i2].fn.apply(listeners[i2].context, args);
        }
      }
    }
    return true;
  };
  EventEmitter2.prototype.on = function on(event, fn, context) {
    return addListener(this, event, fn, context, false);
  };
  EventEmitter2.prototype.once = function once(event, fn, context) {
    return addListener(this, event, fn, context, true);
  };
  EventEmitter2.prototype.removeListener = function removeListener(event, fn, context, once) {
    var evt = prefix ? prefix + event : event;
    if (!this._events[evt])
      return this;
    if (!fn) {
      clearEvent(this, evt);
      return this;
    }
    var listeners = this._events[evt];
    if (listeners.fn) {
      if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
        clearEvent(this, evt);
      }
    } else {
      for (var i2 = 0, events2 = [], length = listeners.length; i2 < length; i2++) {
        if (listeners[i2].fn !== fn || once && !listeners[i2].once || context && listeners[i2].context !== context) {
          events2.push(listeners[i2]);
        }
      }
      if (events2.length)
        this._events[evt] = events2.length === 1 ? events2[0] : events2;
      else
        clearEvent(this, evt);
    }
    return this;
  };
  EventEmitter2.prototype.removeAllListeners = function removeAllListeners(event) {
    var evt;
    if (event) {
      evt = prefix ? prefix + event : event;
      if (this._events[evt])
        clearEvent(this, evt);
    } else {
      this._events = new Events2();
      this._eventsCount = 0;
    }
    return this;
  };
  EventEmitter2.prototype.off = EventEmitter2.prototype.removeListener;
  EventEmitter2.prototype.addListener = EventEmitter2.prototype.on;
  EventEmitter2.prefixed = prefix;
  EventEmitter2.EventEmitter = EventEmitter2;
  {
    module.exports = EventEmitter2;
  }
})(eventemitter3);
var EventEmitter = eventemitter3.exports;
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
var __assign$1 = function() {
  __assign$1 = Object.assign || function __assign2(t2) {
    for (var s2, i2 = 1, n2 = arguments.length; i2 < n2; i2++) {
      s2 = arguments[i2];
      for (var p2 in s2)
        if (Object.prototype.hasOwnProperty.call(s2, p2))
          t2[p2] = s2[p2];
    }
    return t2;
  };
  return __assign$1.apply(this, arguments);
};
function __rest(s2, e2) {
  var t2 = {};
  for (var p2 in s2)
    if (Object.prototype.hasOwnProperty.call(s2, p2) && e2.indexOf(p2) < 0)
      t2[p2] = s2[p2];
  if (s2 != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i2 = 0, p2 = Object.getOwnPropertySymbols(s2); i2 < p2.length; i2++) {
      if (e2.indexOf(p2[i2]) < 0 && Object.prototype.propertyIsEnumerable.call(s2, p2[i2]))
        t2[p2[i2]] = s2[p2[i2]];
    }
  return t2;
}
var prevTime = 0;
var onNextFrame = typeof window !== "undefined" && window.requestAnimationFrame !== void 0 ? function(callback) {
  return window.requestAnimationFrame(callback);
} : function(callback) {
  var timestamp = Date.now();
  var timeToCall = Math.max(0, 16.7 - (timestamp - prevTime));
  prevTime = timestamp + timeToCall;
  setTimeout(function() {
    return callback(prevTime);
  }, timeToCall);
};
var createStep = function(setRunNextFrame) {
  var processToRun = [];
  var processToRunNextFrame = [];
  var numThisFrame = 0;
  var isProcessing2 = false;
  var i2 = 0;
  var cancelled = /* @__PURE__ */ new WeakSet();
  var toKeepAlive = /* @__PURE__ */ new WeakSet();
  var renderStep = {
    cancel: function(process2) {
      var indexOfCallback = processToRunNextFrame.indexOf(process2);
      cancelled.add(process2);
      if (indexOfCallback !== -1) {
        processToRunNextFrame.splice(indexOfCallback, 1);
      }
    },
    process: function(frame2) {
      var _a;
      isProcessing2 = true;
      _a = [processToRunNextFrame, processToRun], processToRun = _a[0], processToRunNextFrame = _a[1];
      processToRunNextFrame.length = 0;
      numThisFrame = processToRun.length;
      if (numThisFrame) {
        var process_1;
        for (i2 = 0; i2 < numThisFrame; i2++) {
          process_1 = processToRun[i2];
          process_1(frame2);
          if (toKeepAlive.has(process_1) === true && !cancelled.has(process_1)) {
            renderStep.schedule(process_1);
            setRunNextFrame(true);
          }
        }
      }
      isProcessing2 = false;
    },
    schedule: function(process2, keepAlive, immediate) {
      if (keepAlive === void 0) {
        keepAlive = false;
      }
      if (immediate === void 0) {
        immediate = false;
      }
      var addToCurrentBuffer = immediate && isProcessing2;
      var buffer = addToCurrentBuffer ? processToRun : processToRunNextFrame;
      cancelled.delete(process2);
      if (keepAlive)
        toKeepAlive.add(process2);
      if (buffer.indexOf(process2) === -1) {
        buffer.push(process2);
        if (addToCurrentBuffer)
          numThisFrame = processToRun.length;
      }
    }
  };
  return renderStep;
};
var maxElapsed = 40;
var defaultElapsed = 1 / 60 * 1e3;
var useDefaultElapsed = true;
var willRunNextFrame = false;
var isProcessing = false;
var frame = {
  delta: 0,
  timestamp: 0
};
var stepsOrder = ["read", "update", "preRender", "render", "postRender"];
var setWillRunNextFrame = function(willRun) {
  return willRunNextFrame = willRun;
};
var steps = /* @__PURE__ */ stepsOrder.reduce(function(acc, key) {
  acc[key] = createStep(setWillRunNextFrame);
  return acc;
}, {});
var sync = /* @__PURE__ */ stepsOrder.reduce(function(acc, key) {
  var step = steps[key];
  acc[key] = function(process2, keepAlive, immediate) {
    if (keepAlive === void 0) {
      keepAlive = false;
    }
    if (immediate === void 0) {
      immediate = false;
    }
    if (!willRunNextFrame)
      startLoop();
    step.schedule(process2, keepAlive, immediate);
    return process2;
  };
  return acc;
}, {});
var processStep = function(stepId) {
  return steps[stepId].process(frame);
};
var processFrame = function(timestamp) {
  willRunNextFrame = false;
  frame.delta = useDefaultElapsed ? defaultElapsed : Math.max(Math.min(timestamp - frame.timestamp, maxElapsed), 1);
  if (!useDefaultElapsed)
    defaultElapsed = frame.delta;
  frame.timestamp = timestamp;
  isProcessing = true;
  stepsOrder.forEach(processStep);
  isProcessing = false;
  if (willRunNextFrame) {
    useDefaultElapsed = false;
    onNextFrame(processFrame);
  }
};
var startLoop = function() {
  willRunNextFrame = true;
  useDefaultElapsed = true;
  if (!isProcessing)
    onNextFrame(processFrame);
};
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
var __assign = function() {
  __assign = Object.assign || function __assign2(t2) {
    for (var s2, i2 = 1, n2 = arguments.length; i2 < n2; i2++) {
      s2 = arguments[i2];
      for (var p2 in s2)
        if (Object.prototype.hasOwnProperty.call(s2, p2))
          t2[p2] = s2[p2];
    }
    return t2;
  };
  return __assign.apply(this, arguments);
};
var clamp$1 = function(min, max) {
  return function(v2) {
    return Math.max(Math.min(v2, max), min);
  };
};
var sanitize = function(v2) {
  return v2 % 1 ? Number(v2.toFixed(5)) : v2;
};
var singleColorRegex = /^(#[0-9a-f]{3}|#(?:[0-9a-f]{2}){2,4}|(rgb|hsl)a?\((-?[\d\.]+%?[,\s]+){2,3}\s*\/*\s*[\d\.]+%?\))$/i;
var number = {
  test: function(v2) {
    return typeof v2 === "number";
  },
  parse: parseFloat,
  transform: function(v2) {
    return v2;
  }
};
var alpha = __assign(__assign({}, number), { transform: clamp$1(0, 1) });
var scale = __assign(__assign({}, number), { default: 1 });
var createUnitType = function(unit) {
  return {
    test: function(v2) {
      return typeof v2 === "string" && v2.endsWith(unit) && v2.split(" ").length === 1;
    },
    parse: parseFloat,
    transform: function(v2) {
      return "" + v2 + unit;
    }
  };
};
var degrees = createUnitType("deg");
var percent = createUnitType("%");
var px = createUnitType("px");
var progressPercentage = __assign(__assign({}, percent), { parse: function(v2) {
  return percent.parse(v2) / 100;
}, transform: function(v2) {
  return percent.transform(v2 * 100);
} });
var getValueFromFunctionString = function(value) {
  return value.substring(value.indexOf("(") + 1, value.lastIndexOf(")"));
};
var clampRgbUnit = clamp$1(0, 255);
var isRgba = function(v2) {
  return v2.red !== void 0;
};
var isHsla = function(v2) {
  return v2.hue !== void 0;
};
function getValuesAsArray(value) {
  return getValueFromFunctionString(value).replace(/(,|\/)/g, " ").split(/ \s*/);
}
var splitColorValues = function(terms) {
  return function(v2) {
    if (typeof v2 !== "string")
      return v2;
    var values = {};
    var valuesArray = getValuesAsArray(v2);
    for (var i2 = 0; i2 < 4; i2++) {
      values[terms[i2]] = valuesArray[i2] !== void 0 ? parseFloat(valuesArray[i2]) : 1;
    }
    return values;
  };
};
var rgbaTemplate = function(_a) {
  var red = _a.red, green = _a.green, blue = _a.blue, _b = _a.alpha, alpha2 = _b === void 0 ? 1 : _b;
  return "rgba(" + red + ", " + green + ", " + blue + ", " + alpha2 + ")";
};
var hslaTemplate = function(_a) {
  var hue = _a.hue, saturation = _a.saturation, lightness = _a.lightness, _b = _a.alpha, alpha2 = _b === void 0 ? 1 : _b;
  return "hsla(" + hue + ", " + saturation + ", " + lightness + ", " + alpha2 + ")";
};
var rgbUnit = __assign(__assign({}, number), { transform: function(v2) {
  return Math.round(clampRgbUnit(v2));
} });
function isColorString(color2, colorType) {
  return color2.startsWith(colorType) && singleColorRegex.test(color2);
}
var rgba = {
  test: function(v2) {
    return typeof v2 === "string" ? isColorString(v2, "rgb") : isRgba(v2);
  },
  parse: splitColorValues(["red", "green", "blue", "alpha"]),
  transform: function(_a) {
    var red = _a.red, green = _a.green, blue = _a.blue, _b = _a.alpha, alpha$1 = _b === void 0 ? 1 : _b;
    return rgbaTemplate({
      red: rgbUnit.transform(red),
      green: rgbUnit.transform(green),
      blue: rgbUnit.transform(blue),
      alpha: sanitize(alpha.transform(alpha$1))
    });
  }
};
var hsla = {
  test: function(v2) {
    return typeof v2 === "string" ? isColorString(v2, "hsl") : isHsla(v2);
  },
  parse: splitColorValues(["hue", "saturation", "lightness", "alpha"]),
  transform: function(_a) {
    var hue = _a.hue, saturation = _a.saturation, lightness = _a.lightness, _b = _a.alpha, alpha$1 = _b === void 0 ? 1 : _b;
    return hslaTemplate({
      hue: Math.round(hue),
      saturation: percent.transform(sanitize(saturation)),
      lightness: percent.transform(sanitize(lightness)),
      alpha: sanitize(alpha.transform(alpha$1))
    });
  }
};
var hex = __assign(__assign({}, rgba), { test: function(v2) {
  return typeof v2 === "string" && isColorString(v2, "#");
}, parse: function(v2) {
  var r2 = "";
  var g2 = "";
  var b2 = "";
  if (v2.length > 4) {
    r2 = v2.substr(1, 2);
    g2 = v2.substr(3, 2);
    b2 = v2.substr(5, 2);
  } else {
    r2 = v2.substr(1, 1);
    g2 = v2.substr(2, 1);
    b2 = v2.substr(3, 1);
    r2 += r2;
    g2 += g2;
    b2 += b2;
  }
  return {
    red: parseInt(r2, 16),
    green: parseInt(g2, 16),
    blue: parseInt(b2, 16),
    alpha: 1
  };
} });
var color = {
  test: function(v2) {
    return typeof v2 === "string" && singleColorRegex.test(v2) || isRgba(v2) || isHsla(v2);
  },
  parse: function(v2) {
    if (rgba.test(v2)) {
      return rgba.parse(v2);
    } else if (hsla.test(v2)) {
      return hsla.parse(v2);
    } else if (hex.test(v2)) {
      return hex.parse(v2);
    }
    return v2;
  },
  transform: function(v2) {
    if (isRgba(v2)) {
      return rgba.transform(v2);
    } else if (isHsla(v2)) {
      return hsla.transform(v2);
    }
    return v2;
  }
};
var createStyler = function(_a) {
  var onRead2 = _a.onRead, onRender2 = _a.onRender, _b = _a.uncachedValues, uncachedValues = _b === void 0 ? /* @__PURE__ */ new Set() : _b, _c = _a.useCache, useCache = _c === void 0 ? true : _c;
  return function(_a2) {
    if (_a2 === void 0) {
      _a2 = {};
    }
    var props = __rest(_a2, []);
    var state = {};
    var changedValues = [];
    var hasChanged = false;
    function setValue(key, value) {
      if (key.startsWith("--")) {
        props.hasCSSVariable = true;
      }
      var currentValue = state[key];
      state[key] = value;
      if (state[key] === currentValue)
        return;
      if (changedValues.indexOf(key) === -1) {
        changedValues.push(key);
      }
      if (!hasChanged) {
        hasChanged = true;
        sync.render(styler.render);
      }
    }
    var styler = {
      get: function(key, forceRead) {
        if (forceRead === void 0) {
          forceRead = false;
        }
        var useCached = !forceRead && useCache && !uncachedValues.has(key) && state[key] !== void 0;
        return useCached ? state[key] : onRead2(key, props);
      },
      set: function(values, value) {
        if (typeof values === "string") {
          setValue(values, value);
        } else {
          for (var key in values) {
            setValue(key, values[key]);
          }
        }
        return this;
      },
      render: function(forceRender) {
        if (forceRender === void 0) {
          forceRender = false;
        }
        if (hasChanged || forceRender === true) {
          onRender2(state, props, changedValues);
          hasChanged = false;
          changedValues.length = 0;
        }
        return this;
      }
    };
    return styler;
  };
};
var CAMEL_CASE_PATTERN = /([a-z])([A-Z])/g;
var REPLACE_TEMPLATE = "$1-$2";
var camelToDash = function(str) {
  return str.replace(CAMEL_CASE_PATTERN, REPLACE_TEMPLATE).toLowerCase();
};
var camelCache = /* @__PURE__ */ new Map();
var dashCache = /* @__PURE__ */ new Map();
var prefixes = ["Webkit", "Moz", "O", "ms", ""];
var numPrefixes = prefixes.length;
var isBrowser = typeof document !== "undefined";
var testElement;
var setDashPrefix = function(key, prefixed) {
  return dashCache.set(key, camelToDash(prefixed));
};
var testPrefix = function(key) {
  testElement = testElement || document.createElement("div");
  for (var i2 = 0; i2 < numPrefixes; i2++) {
    var prefix = prefixes[i2];
    var noPrefix = prefix === "";
    var prefixedPropertyName = noPrefix ? key : prefix + key.charAt(0).toUpperCase() + key.slice(1);
    if (prefixedPropertyName in testElement.style || noPrefix) {
      if (noPrefix && key === "clipPath" && dashCache.has(key)) {
        return;
      }
      camelCache.set(key, prefixedPropertyName);
      setDashPrefix(key, (noPrefix ? "" : "-") + camelToDash(prefixedPropertyName));
    }
  }
};
var setServerProperty = function(key) {
  return setDashPrefix(key, key);
};
var prefixer = function(key, asDashCase) {
  if (asDashCase === void 0) {
    asDashCase = false;
  }
  var cache2 = asDashCase ? dashCache : camelCache;
  if (!cache2.has(key)) {
    isBrowser ? testPrefix(key) : setServerProperty(key);
  }
  return cache2.get(key) || key;
};
var axes = ["", "X", "Y", "Z"];
var order = ["translate", "scale", "rotate", "skew", "transformPerspective"];
var transformProps = /* @__PURE__ */ order.reduce(function(acc, key) {
  return axes.reduce(function(axesAcc, axesKey) {
    axesAcc.push(key + axesKey);
    return axesAcc;
  }, acc);
}, ["x", "y", "z"]);
var transformPropDictionary = /* @__PURE__ */ transformProps.reduce(function(dict, key) {
  dict[key] = true;
  return dict;
}, {});
function isTransformProp(key) {
  return transformPropDictionary[key] === true;
}
function sortTransformProps(a2, b2) {
  return transformProps.indexOf(a2) - transformProps.indexOf(b2);
}
var transformOriginProps = /* @__PURE__ */ new Set(["originX", "originY", "originZ"]);
function isTransformOriginProp(key) {
  return transformOriginProps.has(key);
}
var int = /* @__PURE__ */ __assign$1(/* @__PURE__ */ __assign$1({}, number), { transform: Math.round });
var valueTypes = {
  color,
  backgroundColor: color,
  outlineColor: color,
  fill: color,
  stroke: color,
  borderColor: color,
  borderTopColor: color,
  borderRightColor: color,
  borderBottomColor: color,
  borderLeftColor: color,
  borderWidth: px,
  borderTopWidth: px,
  borderRightWidth: px,
  borderBottomWidth: px,
  borderLeftWidth: px,
  borderRadius: px,
  radius: px,
  borderTopLeftRadius: px,
  borderTopRightRadius: px,
  borderBottomRightRadius: px,
  borderBottomLeftRadius: px,
  width: px,
  maxWidth: px,
  height: px,
  maxHeight: px,
  size: px,
  top: px,
  right: px,
  bottom: px,
  left: px,
  padding: px,
  paddingTop: px,
  paddingRight: px,
  paddingBottom: px,
  paddingLeft: px,
  margin: px,
  marginTop: px,
  marginRight: px,
  marginBottom: px,
  marginLeft: px,
  rotate: degrees,
  rotateX: degrees,
  rotateY: degrees,
  rotateZ: degrees,
  scale,
  scaleX: scale,
  scaleY: scale,
  scaleZ: scale,
  skew: degrees,
  skewX: degrees,
  skewY: degrees,
  distance: px,
  translateX: px,
  translateY: px,
  translateZ: px,
  x: px,
  y: px,
  z: px,
  perspective: px,
  opacity: alpha,
  originX: progressPercentage,
  originY: progressPercentage,
  originZ: px,
  zIndex: int,
  fillOpacity: alpha,
  strokeOpacity: alpha,
  numOctaves: int
};
var getValueType = function(key) {
  return valueTypes[key];
};
var getValueAsType = function(value, type) {
  return type && typeof value === "number" ? type.transform(value) : value;
};
var SCROLL_LEFT = "scrollLeft";
var SCROLL_TOP = "scrollTop";
var scrollKeys = /* @__PURE__ */ new Set([SCROLL_LEFT, SCROLL_TOP]);
var blacklist = /* @__PURE__ */ new Set([SCROLL_LEFT, SCROLL_TOP, "transform"]);
var translateAlias = {
  x: "translateX",
  y: "translateY",
  z: "translateZ"
};
function isCustomTemplate(v2) {
  return typeof v2 === "function";
}
function buildTransform(state, transform, transformKeys, transformIsDefault, enableHardwareAcceleration, allowTransformNone) {
  if (allowTransformNone === void 0) {
    allowTransformNone = true;
  }
  var transformString = "";
  var transformHasZ = false;
  transformKeys.sort(sortTransformProps);
  var numTransformKeys = transformKeys.length;
  for (var i2 = 0; i2 < numTransformKeys; i2++) {
    var key = transformKeys[i2];
    transformString += (translateAlias[key] || key) + "(" + transform[key] + ") ";
    transformHasZ = key === "z" ? true : transformHasZ;
  }
  if (!transformHasZ && enableHardwareAcceleration) {
    transformString += "translateZ(0)";
  } else {
    transformString = transformString.trim();
  }
  if (isCustomTemplate(state.transform)) {
    transformString = state.transform(transform, transformIsDefault ? "" : transformString);
  } else if (allowTransformNone && transformIsDefault) {
    transformString = "none";
  }
  return transformString;
}
function buildStyleProperty(state, enableHardwareAcceleration, styles2, transform, transformOrigin, transformKeys, isDashCase, allowTransformNone) {
  if (enableHardwareAcceleration === void 0) {
    enableHardwareAcceleration = true;
  }
  if (styles2 === void 0) {
    styles2 = {};
  }
  if (transform === void 0) {
    transform = {};
  }
  if (transformOrigin === void 0) {
    transformOrigin = {};
  }
  if (transformKeys === void 0) {
    transformKeys = [];
  }
  if (isDashCase === void 0) {
    isDashCase = false;
  }
  if (allowTransformNone === void 0) {
    allowTransformNone = true;
  }
  var transformIsDefault = true;
  var hasTransform = false;
  var hasTransformOrigin = false;
  for (var key in state) {
    var value = state[key];
    var valueType = getValueType(key);
    var valueAsType = getValueAsType(value, valueType);
    if (isTransformProp(key)) {
      hasTransform = true;
      transform[key] = valueAsType;
      transformKeys.push(key);
      if (transformIsDefault) {
        if (valueType.default && value !== valueType.default || !valueType.default && value !== 0) {
          transformIsDefault = false;
        }
      }
    } else if (isTransformOriginProp(key)) {
      transformOrigin[key] = valueAsType;
      hasTransformOrigin = true;
    } else if (!blacklist.has(key) || !isCustomTemplate(valueAsType)) {
      styles2[prefixer(key, isDashCase)] = valueAsType;
    }
  }
  if (hasTransform || typeof state.transform === "function") {
    styles2.transform = buildTransform(state, transform, transformKeys, transformIsDefault, enableHardwareAcceleration, allowTransformNone);
  }
  if (hasTransformOrigin) {
    styles2.transformOrigin = (transformOrigin.originX || "50%") + " " + (transformOrigin.originY || "50%") + " " + (transformOrigin.originZ || 0);
  }
  return styles2;
}
function createStyleBuilder(_a) {
  var _b = _a === void 0 ? {} : _a, _c = _b.enableHardwareAcceleration, enableHardwareAcceleration = _c === void 0 ? true : _c, _d = _b.isDashCase, isDashCase = _d === void 0 ? true : _d, _e = _b.allowTransformNone, allowTransformNone = _e === void 0 ? true : _e;
  var styles2 = {};
  var transform = {};
  var transformOrigin = {};
  var transformKeys = [];
  return function(state) {
    transformKeys.length = 0;
    buildStyleProperty(state, enableHardwareAcceleration, styles2, transform, transformOrigin, transformKeys, isDashCase, allowTransformNone);
    return styles2;
  };
}
function onRead(key, options) {
  var element2 = options.element, preparseOutput = options.preparseOutput;
  var defaultValueType = getValueType(key);
  if (isTransformProp(key)) {
    return defaultValueType ? defaultValueType.default || 0 : 0;
  } else if (scrollKeys.has(key)) {
    return element2[key];
  } else {
    var domValue = window.getComputedStyle(element2, null).getPropertyValue(prefixer(key, true)) || 0;
    return preparseOutput && defaultValueType && defaultValueType.test(domValue) && defaultValueType.parse ? defaultValueType.parse(domValue) : domValue;
  }
}
function onRender(state, _a, changedValues) {
  var element2 = _a.element, buildStyles = _a.buildStyles, hasCSSVariable = _a.hasCSSVariable;
  Object.assign(element2.style, buildStyles(state));
  if (hasCSSVariable) {
    var numChangedValues = changedValues.length;
    for (var i2 = 0; i2 < numChangedValues; i2++) {
      var key = changedValues[i2];
      if (key.startsWith("--")) {
        element2.style.setProperty(key, state[key]);
      }
    }
  }
  if (changedValues.indexOf(SCROLL_LEFT) !== -1) {
    element2[SCROLL_LEFT] = state[SCROLL_LEFT];
  }
  if (changedValues.indexOf(SCROLL_TOP) !== -1) {
    element2[SCROLL_TOP] = state[SCROLL_TOP];
  }
}
var cssStyler = /* @__PURE__ */ createStyler({
  onRead,
  onRender,
  uncachedValues: scrollKeys
});
function createCssStyler(element2, _a) {
  if (_a === void 0) {
    _a = {};
  }
  var enableHardwareAcceleration = _a.enableHardwareAcceleration, allowTransformNone = _a.allowTransformNone, props = __rest(_a, ["enableHardwareAcceleration", "allowTransformNone"]);
  return cssStyler(__assign$1({ element: element2, buildStyles: createStyleBuilder({
    enableHardwareAcceleration,
    allowTransformNone
  }), preparseOutput: true }, props));
}
var camelCaseAttributes = /* @__PURE__ */ new Set(["baseFrequency", "diffuseConstant", "kernelMatrix", "kernelUnitLength", "keySplines", "keyTimes", "limitingConeAngle", "markerHeight", "markerWidth", "numOctaves", "targetX", "targetY", "surfaceScale", "specularConstant", "specularExponent", "stdDeviation", "tableValues"]);
var defaultOrigin = 0.5;
var svgAttrsTemplate = function() {
  return {
    style: {}
  };
};
var progressToPixels = function(progress, length) {
  return px.transform(progress * length);
};
var unmeasured = { x: 0, y: 0, width: 0, height: 0 };
function calcOrigin(origin, offset, size2) {
  return typeof origin === "string" ? origin : px.transform(offset + size2 * origin);
}
function calculateSVGTransformOrigin(dimensions, originX, originY) {
  return calcOrigin(originX, dimensions.x, dimensions.width) + " " + calcOrigin(originY, dimensions.y, dimensions.height);
}
var svgStyleConfig = {
  enableHardwareAcceleration: false,
  isDashCase: false
};
function buildSVGAttrs(_a, dimensions, totalPathLength, cssBuilder, attrs, isDashCase) {
  if (dimensions === void 0) {
    dimensions = unmeasured;
  }
  if (cssBuilder === void 0) {
    cssBuilder = createStyleBuilder(svgStyleConfig);
  }
  if (attrs === void 0) {
    attrs = svgAttrsTemplate();
  }
  if (isDashCase === void 0) {
    isDashCase = true;
  }
  var attrX = _a.attrX, attrY = _a.attrY, originX = _a.originX, originY = _a.originY, pathLength = _a.pathLength, _b = _a.pathSpacing, pathSpacing = _b === void 0 ? 1 : _b, _c = _a.pathOffset, pathOffset = _c === void 0 ? 0 : _c, state = __rest(_a, ["attrX", "attrY", "originX", "originY", "pathLength", "pathSpacing", "pathOffset"]);
  var style2 = cssBuilder(state);
  for (var key in style2) {
    if (key === "transform") {
      attrs.style.transform = style2[key];
    } else {
      var attrKey = isDashCase && !camelCaseAttributes.has(key) ? camelToDash(key) : key;
      attrs[attrKey] = style2[key];
    }
  }
  if (originX !== void 0 || originY !== void 0 || style2.transform) {
    attrs.style.transformOrigin = calculateSVGTransformOrigin(dimensions, originX !== void 0 ? originX : defaultOrigin, originY !== void 0 ? originY : defaultOrigin);
  }
  if (attrX !== void 0)
    attrs.x = attrX;
  if (attrY !== void 0)
    attrs.y = attrY;
  if (totalPathLength !== void 0 && pathLength !== void 0) {
    attrs[isDashCase ? "stroke-dashoffset" : "strokeDashoffset"] = progressToPixels(-pathOffset, totalPathLength);
    attrs[isDashCase ? "stroke-dasharray" : "strokeDasharray"] = progressToPixels(pathLength, totalPathLength) + " " + progressToPixels(pathSpacing, totalPathLength);
  }
  return attrs;
}
function createAttrBuilder(dimensions, totalPathLength, isDashCase) {
  if (isDashCase === void 0) {
    isDashCase = true;
  }
  var attrs = svgAttrsTemplate();
  var cssBuilder = createStyleBuilder(svgStyleConfig);
  return function(state) {
    return buildSVGAttrs(state, dimensions, totalPathLength, cssBuilder, attrs, isDashCase);
  };
}
var getDimensions = function(element2) {
  return typeof element2.getBBox === "function" ? element2.getBBox() : element2.getBoundingClientRect();
};
var getSVGElementDimensions = function(element2) {
  try {
    return getDimensions(element2);
  } catch (e2) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
};
var isPath = function(element2) {
  return element2.tagName === "path";
};
var svgStyler = /* @__PURE__ */ createStyler({
  onRead: function(key, _a) {
    var element2 = _a.element;
    key = !camelCaseAttributes.has(key) ? camelToDash(key) : key;
    if (!isTransformProp(key)) {
      return element2.getAttribute(key);
    } else {
      var valueType = getValueType(key);
      return valueType ? valueType.default || 0 : 0;
    }
  },
  onRender: function(state, _a) {
    var element2 = _a.element, buildAttrs = _a.buildAttrs;
    var attrs = buildAttrs(state);
    for (var key in attrs) {
      if (key === "style") {
        Object.assign(element2.style, attrs.style);
      } else {
        element2.setAttribute(key, attrs[key]);
      }
    }
  }
});
var svg = function(element2) {
  var dimensions = getSVGElementDimensions(element2);
  var pathLength = isPath(element2) && element2.getTotalLength ? element2.getTotalLength() : void 0;
  return svgStyler({
    element: element2,
    buildAttrs: createAttrBuilder(dimensions, pathLength)
  });
};
var viewport = /* @__PURE__ */ createStyler({
  useCache: false,
  onRead: function(key) {
    return key === "scrollTop" ? window.pageYOffset : window.pageXOffset;
  },
  onRender: function(_a) {
    var _b = _a.scrollTop, scrollTop = _b === void 0 ? 0 : _b, _c = _a.scrollLeft, scrollLeft = _c === void 0 ? 0 : _c;
    return window.scrollTo(scrollLeft, scrollTop);
  }
});
var cache$1 = /* @__PURE__ */ new WeakMap();
var isHTMLElement = function(node) {
  return node instanceof HTMLElement || typeof node.click === "function";
};
var isSVGElement = function(node) {
  return node instanceof SVGElement || "ownerSVGElement" in node;
};
var createDOMStyler = function(node, props) {
  var styler;
  if (node === window) {
    styler = viewport(node);
  } else if (isHTMLElement(node)) {
    styler = createCssStyler(node, props);
  } else if (isSVGElement(node)) {
    styler = svg(node);
  }
  cache$1.set(node, styler);
  return styler;
};
var getStyler = function(node, props) {
  return cache$1.has(node) ? cache$1.get(node) : createDOMStyler(node, props);
};
function index(nodeOrSelector, props) {
  var node = typeof nodeOrSelector === "string" ? document.querySelector(nodeOrSelector) : nodeOrSelector;
  return getStyler(node, props);
}
var shallowequal = function shallowEqual(objA, objB, compare, compareContext) {
  var ret = compare ? compare.call(compareContext, objA, objB) : void 0;
  if (ret !== void 0) {
    return !!ret;
  }
  if (objA === objB) {
    return true;
  }
  if (typeof objA !== "object" || !objA || typeof objB !== "object" || !objB) {
    return false;
  }
  var keysA = Object.keys(objA);
  var keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) {
    return false;
  }
  var bHasOwnProperty = Object.prototype.hasOwnProperty.bind(objB);
  for (var idx = 0; idx < keysA.length; idx++) {
    var key = keysA[idx];
    if (!bHasOwnProperty(key)) {
      return false;
    }
    var valueA = objA[key];
    var valueB = objB[key];
    ret = compare ? compare.call(compareContext, valueA, valueB, key) : void 0;
    if (ret === false || ret === void 0 && valueA !== valueB) {
      return false;
    }
  }
  return true;
};
const e$1 = "!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", s$1 = e$1.length, t$1$1 = Array(20), r$1$1 = () => {
  for (let r2 = 0; r2 < 20; r2++)
    t$1$1[r2] = e$1.charAt(Math.random() * s$1);
  return t$1$1.join("");
};
class o$1 {
  constructor() {
    this.disposers = /* @__PURE__ */ new Map();
  }
  add(e2, s2 = r$1$1()) {
    return this.flush(s2), this.disposers.set(s2, e2()), s2;
  }
  addDisposer(e2, s2 = r$1$1()) {
    return this.flush(s2), this.disposers.set(s2, e2), s2;
  }
  addEventListener(e2, s2, t2, o2, i2 = r$1$1()) {
    return this.add(() => (e2.addEventListener(s2, t2, o2), () => e2.removeEventListener(s2, t2, o2)), i2), i2;
  }
  setTimeout(e2, s2, t2 = r$1$1()) {
    return this.add(() => {
      const r2 = window.setTimeout(() => {
        this.remove(t2), e2();
      }, s2);
      return () => window.clearTimeout(r2);
    }, t2);
  }
  setInterval(e2, s2, t2 = r$1$1()) {
    return this.add(() => {
      const t3 = window.setInterval(e2, s2);
      return () => window.clearInterval(t3);
    }, t2);
  }
  remove(e2) {
    const s2 = this.disposers.get(e2);
    return this.disposers.delete(e2), s2;
  }
  flush(e2) {
    const s2 = this.remove(e2);
    if (s2)
      try {
        s2();
      } catch (t2) {
        console.error(t2);
      }
  }
  flushAll() {
    this.disposers.forEach((e2) => {
      try {
        e2();
      } catch (s2) {
        console.error(s2);
      }
    }), this.disposers.clear();
  }
}
var e$2 = Object.defineProperty, s$2 = ("undefined" != typeof require && require, (s2, r2, t2) => (((s3, r3, t3) => {
  r3 in s3 ? e$2(s3, r3, { enumerable: true, configurable: true, writable: true, value: t3 }) : s3[r3] = t3;
})(s2, "symbol" != typeof r2 ? r2 + "" : r2, t2), t2));
class r$3 {
  constructor(e2, r2) {
    s$2(this, "_value"), s$2(this, "_beforeDestroys"), s$2(this, "_subscribers"), this._value = e2, r2 && (this.compare = r2);
  }
  get value() {
    return this._value;
  }
  setValue(e2, s2) {
    if (!this.compare(e2, this._value)) {
      const r2 = this._value;
      this._value = e2, this._subscribers && this._subscribers.forEach((t2) => t2(e2, r2, s2));
    }
  }
  reaction(e2) {
    return this._subscribers || (this._subscribers = /* @__PURE__ */ new Set()), this._subscribers.add(e2), () => {
      this._subscribers && this._subscribers.delete(e2);
    };
  }
  subscribe(e2, s2) {
    const r2 = this.reaction(e2);
    return e2(this._value, void 0, s2), r2;
  }
  derive(e2, s2, t2) {
    const i2 = new r$3(e2(this.value, void 0, t2), s2), o2 = this.reaction((s3, r2, t3) => {
      i2.setValue(e2(s3, r2, t3));
    });
    return i2.addBeforeDestroy(o2), i2;
  }
  destroy() {
    this._beforeDestroys && (this._beforeDestroys.forEach((e2) => e2()), this._beforeDestroys.clear()), this._subscribers && this._subscribers.clear();
  }
  addBeforeDestroy(e2) {
    return this._beforeDestroys || (this._beforeDestroys = /* @__PURE__ */ new Set()), this._beforeDestroys.add(e2), () => {
      this._beforeDestroys && this._beforeDestroys.delete(e2);
    };
  }
  compare(e2, s2) {
    return e2 === s2;
  }
}
function t$2(e2, s2, t2, i2) {
  let o2 = e2.map((e3) => e3.value);
  const u2 = new r$3(s2(o2, void 0, i2), t2);
  return e2.forEach((e3, r2) => {
    const t3 = e3.reaction((e4, t4, i3) => {
      const c2 = o2.slice();
      c2[r2] = e4;
      const n2 = o2;
      o2 = c2, u2.setValue(s2(c2, n2, i3), i3);
    });
    u2.addBeforeDestroy(t3);
  }), u2;
}
function i$1(e2, s2) {
  Object.keys(s2).forEach((r2) => {
    u$2(e2, r2, s2[r2]);
  });
}
function u$2(e2, s2, r2) {
  var t2;
  return Object.defineProperties(e2, { [s2]: { get: () => r2.value }, [`_${s2}$`]: { value: r2 }, [`set${t2 = s2, t2[0].toUpperCase() + t2.slice(1)}`]: { value: (e3, s3) => r2.setValue(e3, s3) } }), e2;
}
function c(e2) {
  const s2 = (s3) => {
    const r2 = e2.addDisposer(() => {
      s3.destroy();
    });
    return s3.addBeforeDestroy(() => {
      e2.remove(r2);
    }), s3;
  };
  return { bindSideEffect: s2, combine: (e3, r2, i2, o2) => s2(t$2(e3, r2, i2, o2)), createVal: (e3, t2) => s2(new r$3(e3, t2)) };
}
var TELE_BOX_COLOR_SCHEME = /* @__PURE__ */ ((TELE_BOX_COLOR_SCHEME2) => {
  TELE_BOX_COLOR_SCHEME2["Light"] = "light";
  TELE_BOX_COLOR_SCHEME2["Dark"] = "dark";
  TELE_BOX_COLOR_SCHEME2["Auto"] = "auto";
  return TELE_BOX_COLOR_SCHEME2;
})(TELE_BOX_COLOR_SCHEME || {});
var TELE_BOX_STATE = /* @__PURE__ */ ((TELE_BOX_STATE2) => {
  TELE_BOX_STATE2["Normal"] = "normal";
  TELE_BOX_STATE2["Minimized"] = "minimized";
  TELE_BOX_STATE2["Maximized"] = "maximized";
  return TELE_BOX_STATE2;
})(TELE_BOX_STATE || {});
var TELE_BOX_EVENT = /* @__PURE__ */ ((TELE_BOX_EVENT2) => {
  TELE_BOX_EVENT2["DarkMode"] = "dark_mode";
  TELE_BOX_EVENT2["PrefersColorScheme"] = "prefers_color_scheme";
  TELE_BOX_EVENT2["Close"] = "close";
  TELE_BOX_EVENT2["Focus"] = "focus";
  TELE_BOX_EVENT2["Blur"] = "blur";
  TELE_BOX_EVENT2["Move"] = "move";
  TELE_BOX_EVENT2["Resize"] = "resize";
  TELE_BOX_EVENT2["IntrinsicMove"] = "intrinsic_move";
  TELE_BOX_EVENT2["IntrinsicResize"] = "intrinsic_resize";
  TELE_BOX_EVENT2["VisualResize"] = "visual_resize";
  TELE_BOX_EVENT2["ZIndex"] = "z_index";
  TELE_BOX_EVENT2["State"] = "state";
  TELE_BOX_EVENT2["Minimized"] = "minimized";
  TELE_BOX_EVENT2["Maximized"] = "maximized";
  TELE_BOX_EVENT2["Readonly"] = "readonly";
  TELE_BOX_EVENT2["Destroyed"] = "destroyed";
  return TELE_BOX_EVENT2;
})(TELE_BOX_EVENT || {});
var TELE_BOX_DELEGATE_EVENT = /* @__PURE__ */ ((TELE_BOX_DELEGATE_EVENT2) => {
  TELE_BOX_DELEGATE_EVENT2["Close"] = "close";
  TELE_BOX_DELEGATE_EVENT2["Maximize"] = "maximize";
  TELE_BOX_DELEGATE_EVENT2["Minimize"] = "minimize";
  return TELE_BOX_DELEGATE_EVENT2;
})(TELE_BOX_DELEGATE_EVENT || {});
var TELE_BOX_RESIZE_HANDLE = /* @__PURE__ */ ((TELE_BOX_RESIZE_HANDLE2) => {
  TELE_BOX_RESIZE_HANDLE2["North"] = "n";
  TELE_BOX_RESIZE_HANDLE2["South"] = "s";
  TELE_BOX_RESIZE_HANDLE2["West"] = "w";
  TELE_BOX_RESIZE_HANDLE2["East"] = "e";
  TELE_BOX_RESIZE_HANDLE2["NorthWest"] = "nw";
  TELE_BOX_RESIZE_HANDLE2["NorthEast"] = "ne";
  TELE_BOX_RESIZE_HANDLE2["SouthEast"] = "se";
  TELE_BOX_RESIZE_HANDLE2["SouthWest"] = "sw";
  return TELE_BOX_RESIZE_HANDLE2;
})(TELE_BOX_RESIZE_HANDLE || {});
const TeleBoxDragHandleType = "dh";
function clamp$2(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
function preventEvent$1(ev) {
  ev.stopPropagation();
  if (ev.cancelable) {
    ev.preventDefault();
  }
}
let defaultBoxCount = 1;
function getBoxDefaultName() {
  return `New Box ${defaultBoxCount++}`;
}
function isTruthy(value) {
  return Boolean(value);
}
function isFalsy(value) {
  return !value;
}
function uniqueByVal(arr) {
  return arr.reduce((acc, item) => {
    if (!acc.includes(item))
      acc.push(item);
    return acc;
  }, []);
}
function removeByVal(arr, val) {
  const index2 = arr.indexOf(val);
  if (index2 < 0) {
    return arr;
  }
  const newArr = [...arr];
  newArr.splice(index2, 1);
  return newArr;
}
function excludeFromBoth(c2, a2, b2) {
  const aSet = new Set(a2);
  const bSet = new Set(b2);
  return c2.filter((item) => !aSet.has(item) && !bSet.has(item));
}
function flattenEvent$1(ev) {
  return ev.touches ? ev.touches[0] : ev;
}
function genUniqueKey() {
  return Date.now().toString().slice(6) + Math.random().toString().slice(2, 8);
}
class DefaultTitleBar {
  constructor({
    readonly = false,
    title,
    buttons,
    onEvent,
    onDragStart,
    namespace = "telebox",
    state = TELE_BOX_STATE.Normal
  } = {}) {
    this.$btns = [];
    this.sideEffect = new o$1();
    this.lastTitleBarClick = {
      timestamp: 0,
      clientX: -100,
      clientY: -100
    };
    this.handleTitleBarClick = (ev) => {
      var _a;
      if (this.readonly) {
        return;
      }
      if (ev.button !== 0) {
        return;
      }
      if ((_a = ev.target.dataset) == null ? void 0 : _a.teleTitleBarNoDblClick) {
        return;
      }
      preventEvent$1(ev);
      const now = Date.now();
      if (now - this.lastTitleBarClick.timestamp <= 500) {
        if (Math.abs(ev.clientX - this.lastTitleBarClick.clientX) <= 5 && Math.abs(ev.clientY - this.lastTitleBarClick.clientY) <= 5) {
          if (this.onEvent) {
            this.onEvent({ type: TELE_BOX_DELEGATE_EVENT.Maximize });
          }
        }
      } else if (this.onDragStart) {
        this.onDragStart(ev);
      }
      this.lastTitleBarClick.timestamp = now;
      this.lastTitleBarClick.clientX = ev.clientX;
      this.lastTitleBarClick.clientY = ev.clientY;
    };
    this.lastTitleBarTouch = {
      timestamp: 0,
      clientX: -100,
      clientY: -100
    };
    this.handleTitleBarTouch = (ev) => {
      var _a;
      if (this.readonly) {
        return;
      }
      if ((_a = ev.target.dataset) == null ? void 0 : _a.teleTitleBarNoDblClick) {
        return;
      }
      preventEvent$1(ev);
      const now = Date.now();
      const {
        clientX = this.lastTitleBarTouch.clientX + 100,
        clientY = this.lastTitleBarTouch.clientY + 100
      } = ev.touches[0] || {};
      if (now - this.lastTitleBarTouch.timestamp <= 500) {
        if (Math.abs(clientX - this.lastTitleBarTouch.clientX) <= 10 && Math.abs(clientY - this.lastTitleBarTouch.clientY) <= 10) {
          if (this.onEvent) {
            this.onEvent({ type: TELE_BOX_DELEGATE_EVENT.Maximize });
          }
        }
      } else if (this.onDragStart) {
        this.onDragStart(ev);
      }
      this.lastTitleBarTouch.timestamp = now;
      this.lastTitleBarTouch.clientX = clientX;
      this.lastTitleBarTouch.clientY = clientY;
    };
    this.readonly = readonly;
    this.onEvent = onEvent;
    this.onDragStart = onDragStart;
    this.namespace = namespace;
    this.title = title;
    this.state = state;
    this.buttons = buttons || [
      {
        type: TELE_BOX_DELEGATE_EVENT.Minimize,
        iconClassName: this.wrapClassName("titlebar-icon-minimize")
      },
      {
        type: TELE_BOX_DELEGATE_EVENT.Maximize,
        iconClassName: this.wrapClassName("titlebar-icon-maximize"),
        isActive: (state2) => state2 === TELE_BOX_STATE.Maximized
      },
      {
        type: TELE_BOX_DELEGATE_EVENT.Close,
        iconClassName: this.wrapClassName("titlebar-icon-close")
      }
    ];
    this.$dragArea = this.renderDragArea();
  }
  setTitle(title) {
    this.title = title;
    if (this.$title) {
      this.$title.textContent = title;
      this.$title.title = title;
    }
  }
  setState(state) {
    if (this.state !== state) {
      this.state = state;
      this.buttons.forEach((btn, i2) => {
        if (btn.isActive) {
          this.$btns[i2].classList.toggle(
            "is-active",
            btn.isActive(state)
          );
        }
      });
    }
  }
  setReadonly(readonly) {
    if (this.readonly !== readonly) {
      this.readonly = readonly;
    }
  }
  render() {
    if (!this.$titleBar) {
      this.$titleBar = document.createElement("div");
      this.$titleBar.className = this.wrapClassName("titlebar");
      const $titleArea = document.createElement("div");
      $titleArea.className = this.wrapClassName("title-area");
      $titleArea.dataset.teleBoxHandle = TeleBoxDragHandleType;
      this.$title = document.createElement("h1");
      this.$title.className = this.wrapClassName("title");
      this.$title.dataset.teleBoxHandle = TeleBoxDragHandleType;
      if (this.title) {
        this.$title.textContent = this.title;
        this.$title.title = this.title;
      }
      $titleArea.appendChild(this.$title);
      $titleArea.appendChild(this.$dragArea);
      const $buttonsContainer = document.createElement("div");
      $buttonsContainer.className = this.wrapClassName("titlebar-btns");
      this.buttons.forEach(({ iconClassName, isActive }, i2) => {
        const teleTitleBarBtnIndex = String(i2);
        const $btn = document.createElement("button");
        $btn.className = `${this.wrapClassName(
          "titlebar-btn"
        )} ${iconClassName}`;
        $btn.dataset.teleTitleBarBtnIndex = teleTitleBarBtnIndex;
        $btn.dataset.teleTitleBarNoDblClick = "true";
        if (isActive) {
          $btn.classList.toggle("is-active", isActive(this.state));
        }
        this.$btns.push($btn);
        $buttonsContainer.appendChild($btn);
      });
      this.sideEffect.addEventListener(
        $buttonsContainer,
        "click",
        (ev) => {
          var _a;
          if (this.readonly) {
            return;
          }
          const target = ev.target;
          const teleTitleBarBtnIndex = Number(
            (_a = target.dataset) == null ? void 0 : _a.teleTitleBarBtnIndex
          );
          if (!Number.isNaN(teleTitleBarBtnIndex) && teleTitleBarBtnIndex < this.buttons.length) {
            preventEvent$1(ev);
            const btn = this.buttons[teleTitleBarBtnIndex];
            if (this.onEvent) {
              this.onEvent({
                type: btn.type,
                value: btn.value
              });
            }
          }
        }
      );
      this.$titleBar.appendChild($titleArea);
      this.$titleBar.appendChild($buttonsContainer);
    }
    return this.$titleBar;
  }
  renderDragArea() {
    const $dragArea = document.createElement("div");
    $dragArea.className = this.wrapClassName("drag-area");
    $dragArea.dataset.teleBoxHandle = TeleBoxDragHandleType;
    this.sideEffect.addEventListener(
      $dragArea,
      "mousedown",
      this.handleTitleBarClick
    );
    this.sideEffect.addEventListener(
      $dragArea,
      "touchstart",
      this.handleTitleBarTouch,
      { passive: true }
    );
    return $dragArea;
  }
  dragHandle() {
    return this.$titleBar;
  }
  wrapClassName(className) {
    return `${this.namespace}-${className}`;
  }
  destroy() {
    this.sideEffect.flushAll();
    if (this.$titleBar) {
      this.$titleBar = void 0;
      this.$title = void 0;
      this.$btns.length = 0;
      this.onDragStart = void 0;
      this.onEvent = void 0;
    }
  }
}
class TeleBox {
  constructor({
    id: id2 = genUniqueKey(),
    title = getBoxDefaultName(),
    prefersColorScheme = TELE_BOX_COLOR_SCHEME.Light,
    darkMode,
    visible = true,
    width = 0.5,
    height = 0.5,
    minWidth = 0,
    minHeight = 0,
    x: x2 = 0.1,
    y: y2 = 0.1,
    minimized = false,
    maximized = false,
    readonly = false,
    resizable = true,
    draggable = true,
    fence = true,
    fixRatio = false,
    focus = false,
    zIndex = 100,
    namespace = "telebox",
    titleBar,
    content,
    footer,
    styles: styles2,
    containerRect = {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight
    },
    collectorRect
  } = {}) {
    this._renderSideEffect = new o$1();
    this.handleTrackStart = (ev) => {
      var _a;
      return (_a = this._handleTrackStart) == null ? void 0 : _a.call(this, ev);
    };
    this._sideEffect = new o$1();
    this._valSideEffectBinder = c(this._sideEffect);
    const { combine, createVal } = this._valSideEffectBinder;
    this.id = id2;
    this.namespace = namespace;
    this.events = new EventEmitter();
    this._delegateEvents = new EventEmitter();
    const prefersColorScheme$ = createVal(
      prefersColorScheme
    );
    prefersColorScheme$.reaction((prefersColorScheme2, _2, skipUpdate) => {
      if (!skipUpdate) {
        this.events.emit(
          TELE_BOX_EVENT.PrefersColorScheme,
          prefersColorScheme2
        );
      }
    });
    const darkMode$ = createVal(Boolean(darkMode));
    if (darkMode == null) {
      prefersColorScheme$.subscribe(
        (prefersColorScheme2, _2, skipUpdate) => {
          this._sideEffect.add(() => {
            if (prefersColorScheme2 === "auto") {
              const prefersDark = window.matchMedia(
                "(prefers-color-scheme: dark)"
              );
              if (prefersDark) {
                darkMode$.setValue(
                  prefersDark.matches,
                  skipUpdate
                );
                const handler = (evt) => {
                  darkMode$.setValue(evt.matches, skipUpdate);
                };
                prefersDark.addListener(handler);
                return () => prefersDark.removeListener(handler);
              } else {
                return noop$1;
              }
            } else {
              darkMode$.setValue(
                prefersColorScheme2 === "dark",
                skipUpdate
              );
              return noop$1;
            }
          }, "prefers-color-scheme");
        }
      );
    }
    darkMode$.reaction((darkMode2, _2, skipUpdate) => {
      if (!skipUpdate) {
        this.events.emit(TELE_BOX_EVENT.DarkMode, darkMode2);
      }
    });
    const containerRect$ = createVal(containerRect, shallowequal);
    const collectorRect$ = createVal(collectorRect, shallowequal);
    const title$ = createVal(title);
    title$.reaction((title2, _2, skipUpdate) => {
      if (!skipUpdate) {
        this.titleBar.setTitle(title2);
      }
    });
    const visible$ = createVal(visible);
    visible$.reaction((visible2, _2, skipUpdate) => {
      if (!skipUpdate && !visible2) {
        this.events.emit(TELE_BOX_EVENT.Close);
      }
    });
    const readonly$ = createVal(readonly);
    readonly$.reaction((readonly2, _2, skipUpdate) => {
      if (!skipUpdate) {
        this.events.emit(TELE_BOX_EVENT.Readonly, readonly2);
      }
    });
    const resizable$ = createVal(resizable);
    const draggable$ = createVal(draggable);
    const fence$ = createVal(fence);
    const fixRatio$ = createVal(fixRatio);
    const zIndex$ = createVal(zIndex);
    zIndex$.reaction((zIndex2, _2, skipUpdate) => {
      if (!skipUpdate) {
        this.events.emit(TELE_BOX_EVENT.ZIndex, zIndex2);
      }
    });
    const focus$ = createVal(focus);
    focus$.reaction((focus2, _2, skipUpdate) => {
      if (!skipUpdate) {
        this.events.emit(
          focus2 ? TELE_BOX_EVENT.Focus : TELE_BOX_EVENT.Blur
        );
      }
    });
    const minimized$ = createVal(minimized);
    minimized$.reaction((minimized2, _2, skipUpdate) => {
      if (!skipUpdate) {
        this.events.emit(TELE_BOX_EVENT.Minimized, minimized2);
      }
    });
    const maximized$ = createVal(maximized);
    maximized$.reaction((maximized2, _2, skipUpdate) => {
      if (!skipUpdate) {
        this.events.emit(TELE_BOX_EVENT.Maximized, maximized2);
      }
    });
    const state$ = combine(
      [minimized$, maximized$],
      ([minimized2, maximized2]) => minimized2 ? TELE_BOX_STATE.Minimized : maximized2 ? TELE_BOX_STATE.Maximized : TELE_BOX_STATE.Normal
    );
    state$.reaction((state, _2, skipUpdate) => {
      if (!skipUpdate) {
        this.events.emit(TELE_BOX_EVENT.State, state);
      }
    });
    const minSize$ = createVal(
      {
        width: clamp$2(minWidth, 0, 1),
        height: clamp$2(minHeight, 0, 1)
      },
      shallowequal
    );
    const intrinsicSize$ = createVal(
      {
        width: clamp$2(width, minSize$.value.width, 1),
        height: clamp$2(height, minSize$.value.height, 1)
      },
      shallowequal
    );
    minSize$.reaction((minSize, _2, skipUpdate) => {
      intrinsicSize$.setValue(
        {
          width: clamp$2(width, minSize.width, 1),
          height: clamp$2(height, minSize.height, 1)
        },
        skipUpdate
      );
    });
    intrinsicSize$.reaction((size2, _2, skipUpdate) => {
      if (!skipUpdate) {
        this.events.emit(TELE_BOX_EVENT.IntrinsicResize, size2);
      }
    });
    const size$ = combine(
      [intrinsicSize$, maximized$],
      ([intrinsicSize, maximized2]) => {
        if (maximized2) {
          return { width: 1, height: 1 };
        }
        return intrinsicSize;
      },
      shallowequal
    );
    size$.reaction((size2, _2, skipUpdate) => {
      if (!skipUpdate) {
        this.events.emit(TELE_BOX_EVENT.Resize, size2);
      }
    });
    const visualSize$ = combine(
      [size$, minimized$, containerRect$, collectorRect$],
      ([size2, minimized2, containerRect2, collectorRect2]) => {
        if (minimized2 && collectorRect2) {
          return {
            width: collectorRect2.width / size2.width / containerRect2.width,
            height: collectorRect2.height / size2.height / containerRect2.height
          };
        }
        return size2;
      },
      shallowequal
    );
    visualSize$.reaction((size2, _2, skipUpdate) => {
      if (!skipUpdate) {
        this.events.emit(TELE_BOX_EVENT.VisualResize, size2);
      }
    });
    const intrinsicCoord$ = createVal(
      { x: clamp$2(x2, 0, 1), y: clamp$2(y2, 0, 1) },
      shallowequal
    );
    intrinsicCoord$.reaction((coord, _2, skipUpdate) => {
      if (!skipUpdate) {
        this.events.emit(TELE_BOX_EVENT.IntrinsicMove, coord);
      }
    });
    const coord$ = combine(
      [
        intrinsicCoord$,
        intrinsicSize$,
        containerRect$,
        collectorRect$,
        minimized$,
        maximized$
      ],
      ([
        intrinsicCoord,
        intrinsicSize,
        containerRect2,
        collectorRect2,
        minimized2,
        maximized2
      ]) => {
        if (minimized2 && collectorRect2) {
          if (maximized2) {
            return {
              x: (collectorRect2.x + collectorRect2.width / 2) / containerRect2.width - 1 / 2,
              y: (collectorRect2.y + collectorRect2.height / 2) / containerRect2.height - 1 / 2
            };
          }
          return {
            x: (collectorRect2.x + collectorRect2.width / 2) / containerRect2.width - intrinsicSize.width / 2,
            y: (collectorRect2.y + collectorRect2.height / 2) / containerRect2.height - intrinsicSize.height / 2
          };
        }
        if (maximized2) {
          return { x: 0, y: 0 };
        }
        return intrinsicCoord;
      },
      shallowequal
    );
    coord$.reaction((coord, _2, skipUpdate) => {
      if (!skipUpdate) {
        this.events.emit(TELE_BOX_EVENT.Move, coord);
      }
    });
    this.titleBar = titleBar || new DefaultTitleBar({
      readonly: readonly$.value,
      title: title$.value,
      namespace: this.namespace,
      onDragStart: (event) => {
        var _a;
        return (_a = this._handleTrackStart) == null ? void 0 : _a.call(this, event);
      },
      onEvent: (event) => {
        if (this._delegateEvents.listeners.length > 0) {
          this._delegateEvents.emit(event.type);
        } else {
          switch (event.type) {
            case TELE_BOX_DELEGATE_EVENT.Maximize: {
              maximized$.setValue(!maximized$.value);
              break;
            }
            case TELE_BOX_DELEGATE_EVENT.Minimize: {
              minimized$.setValue(true);
              break;
            }
            case TELE_BOX_DELEGATE_EVENT.Close: {
              visible$.setValue(false);
              break;
            }
            default: {
              console.error(
                "Unsupported titleBar event:",
                event
              );
              break;
            }
          }
        }
      }
    });
    readonly$.reaction((readonly2) => {
      this.titleBar.setReadonly(readonly2);
    });
    const $userContent$ = createVal(content);
    const $userFooter$ = createVal(footer);
    const $userStyles$ = createVal(styles2);
    const valConfig = {
      prefersColorScheme: prefersColorScheme$,
      darkMode: darkMode$,
      containerRect: containerRect$,
      collectorRect: collectorRect$,
      title: title$,
      visible: visible$,
      readonly: readonly$,
      resizable: resizable$,
      draggable: draggable$,
      fence: fence$,
      fixRatio: fixRatio$,
      focus: focus$,
      zIndex: zIndex$,
      minimized: minimized$,
      maximized: maximized$,
      $userContent: $userContent$,
      $userFooter: $userFooter$,
      $userStyles: $userStyles$
    };
    i$1(this, valConfig);
    this._state$ = state$;
    this._minSize$ = minSize$;
    this._size$ = size$;
    this._intrinsicSize$ = intrinsicSize$;
    this._visualSize$ = visualSize$;
    this._coord$ = coord$;
    this._intrinsicCoord$ = intrinsicCoord$;
    if (this.fixRatio) {
      this.transform(
        coord$.value.x,
        coord$.value.y,
        size$.value.width,
        size$.value.height,
        true
      );
    }
    this.$box = this.render();
  }
  get darkMode() {
    return this._darkMode$.value;
  }
  get state() {
    return this._state$.value;
  }
  setState(state, skipUpdate = false) {
    switch (state) {
      case TELE_BOX_STATE.Maximized: {
        this.setMinimized(false, skipUpdate);
        this.setMaximized(true, skipUpdate);
        break;
      }
      case TELE_BOX_STATE.Minimized: {
        this.setMinimized(true, skipUpdate);
        this.setMaximized(false, skipUpdate);
        break;
      }
      default: {
        this.setMinimized(false, skipUpdate);
        this.setMaximized(false, skipUpdate);
        break;
      }
    }
    return this;
  }
  get minWidth() {
    return this._minSize$.value.width;
  }
  get minHeight() {
    return this._minSize$.value.height;
  }
  setMinWidth(minWidth, skipUpdate = false) {
    this._minSize$.setValue(
      { width: minWidth, height: this.minHeight },
      skipUpdate
    );
    return this;
  }
  setMinHeight(minHeight, skipUpdate = false) {
    this._minSize$.setValue(
      { width: this.minWidth, height: minHeight },
      skipUpdate
    );
    return this;
  }
  get intrinsicWidth() {
    return this._intrinsicSize$.value.width;
  }
  get intrinsicHeight() {
    return this._intrinsicSize$.value.height;
  }
  resize(width, height, skipUpdate = false) {
    this._intrinsicSize$.setValue({ width, height }, skipUpdate);
    return this;
  }
  get width() {
    return this._size$.value.width;
  }
  get height() {
    return this._size$.value.height;
  }
  get absoluteWidth() {
    return this.width * this.containerRect.width;
  }
  get absoluteHeight() {
    return this.height * this.containerRect.height;
  }
  get visualWidth() {
    return this._visualSize$.value.width;
  }
  get visualHeight() {
    return this._visualSize$.value.height;
  }
  get intrinsicX() {
    return this._intrinsicCoord$.value.x;
  }
  get intrinsicY() {
    return this._intrinsicCoord$.value.y;
  }
  move(x2, y2, skipUpdate = false) {
    this._intrinsicCoord$.setValue({ x: x2, y: y2 }, skipUpdate);
    return this;
  }
  get x() {
    return this._coord$.value.x;
  }
  get y() {
    return this._coord$.value.y;
  }
  transform(x2, y2, width, height, skipUpdate = false) {
    if (this.fixRatio) {
      const newHeight = this.intrinsicHeight / this.intrinsicWidth * width;
      if (y2 !== this.intrinsicY) {
        y2 -= newHeight - height;
      }
      height = newHeight;
    }
    if (y2 < 0) {
      y2 = 0;
      if (height > this.intrinsicHeight) {
        height = this.intrinsicHeight;
      }
    }
    this._intrinsicCoord$.setValue(
      {
        x: width >= this.minWidth ? x2 : this.intrinsicX,
        y: height >= this.minHeight ? y2 : this.intrinsicY
      },
      skipUpdate
    );
    this._intrinsicSize$.setValue(
      {
        width: clamp$2(width, this.minWidth, 1),
        height: clamp$2(height, this.minHeight, 1)
      },
      skipUpdate
    );
    return this;
  }
  mount(container) {
    container.appendChild(this.render());
    return this;
  }
  unmount() {
    if (this.$box) {
      this.$box.remove();
    }
    return this;
  }
  mountContent(content) {
    this.set$userContent(content);
    return this;
  }
  unmountContent() {
    this.set$userContent(void 0);
    return this;
  }
  mountFooter(footer) {
    this.set$userFooter(footer);
    return this;
  }
  unmountFooter() {
    this.set$userFooter(void 0);
    return this;
  }
  getUserStyles() {
    return this.$userStyles;
  }
  mountStyles(styles2) {
    let $styles;
    if (typeof styles2 === "string") {
      $styles = document.createElement("style");
      $styles.textContent = styles2;
    } else {
      $styles = styles2;
    }
    this.set$userStyles($styles);
    return this;
  }
  unmountStyles() {
    this.set$userStyles(void 0);
    return this;
  }
  render(root) {
    if (root) {
      if (root === this.$box) {
        return this.$box;
      } else {
        this.$box = root;
      }
    } else {
      if (this.$box) {
        return this.$box;
      } else {
        this.$box = document.createElement("div");
      }
    }
    this._renderSideEffect.flushAll();
    this.$box.classList.add(this.wrapClassName("box"));
    const bindClassName = (el, val, className, predicate = isTruthy) => {
      return this._renderSideEffect.add(() => {
        const wrappedClassName = this.wrapClassName(className);
        return val.subscribe((value) => {
          el.classList.toggle(wrappedClassName, predicate(value));
        });
      });
    };
    bindClassName(this.$box, this._readonly$, "readonly");
    bindClassName(this.$box, this._draggable$, "no-drag", isFalsy);
    bindClassName(this.$box, this._resizable$, "no-resize", isFalsy);
    bindClassName(this.$box, this._focus$, "blur", isFalsy);
    bindClassName(this.$box, this._darkMode$, "color-scheme-dark");
    bindClassName(
      this.$box,
      this._darkMode$,
      "color-scheme-light",
      isFalsy
    );
    this._renderSideEffect.add(() => {
      const minimizedClassName = this.wrapClassName("minimized");
      const maximizedClassName = this.wrapClassName("maximized");
      const MAXIMIZED_TIMER_ID = "box-maximized-timer";
      return this._state$.subscribe((state) => {
        this.$box.classList.toggle(
          minimizedClassName,
          state === TELE_BOX_STATE.Minimized
        );
        if (state === TELE_BOX_STATE.Maximized) {
          this._renderSideEffect.flush(MAXIMIZED_TIMER_ID);
          this.$box.classList.toggle(maximizedClassName, true);
        } else {
          this._renderSideEffect.setTimeout(
            () => {
              this.$box.classList.toggle(
                maximizedClassName,
                false
              );
            },
            0,
            MAXIMIZED_TIMER_ID
          );
        }
      });
    });
    this._renderSideEffect.add(
      () => this._visible$.subscribe((visible) => {
        this.$box.style.display = visible ? "block" : "none";
      })
    );
    this._renderSideEffect.add(
      () => this._zIndex$.subscribe((zIndex) => {
        this.$box.style.zIndex = String(zIndex);
      })
    );
    const boxStyler = index(this.$box);
    this.$box.dataset.teleBoxID = this.id;
    this.$box.style.width = this.absoluteWidth + "px";
    this.$box.style.height = this.absoluteHeight + "px";
    const translateX = this.x * this.containerRect.width + this.containerRect.x;
    const translateY = this.y * this.containerRect.height + this.containerRect.y;
    this.$box.style.transform = `translate(${translateX - 10}px,${translateY - 10}px)`;
    this._valSideEffectBinder.combine(
      [
        this._coord$,
        this._size$,
        this._minimized$,
        this._containerRect$,
        this._collectorRect$
      ],
      ([coord, size2, minimized, containerRect, collectorRect]) => {
        const absoluteWidth = size2.width * containerRect.width;
        const absoluteHeight = size2.height * containerRect.height;
        return {
          width: absoluteWidth + (minimized && collectorRect ? 1 : 0),
          height: absoluteHeight + (minimized && collectorRect ? 1 : 0),
          x: coord.x * containerRect.width,
          y: coord.y * containerRect.height,
          scaleX: minimized && collectorRect ? collectorRect.width / absoluteWidth : 1,
          scaleY: minimized && collectorRect ? collectorRect.height / absoluteHeight : 1
        };
      },
      shallowequal
    ).subscribe((styles2) => {
      boxStyler.set(styles2);
    });
    boxStyler.set({ x: translateX, y: translateY });
    const $boxMain = document.createElement("div");
    $boxMain.className = this.wrapClassName("box-main");
    this.$box.appendChild($boxMain);
    const $titleBar = document.createElement("div");
    $titleBar.className = this.wrapClassName("titlebar-wrap");
    $titleBar.appendChild(this.titleBar.render());
    this.$titleBar = $titleBar;
    const $contentWrap = document.createElement("div");
    $contentWrap.className = this.wrapClassName("content-wrap") + " tele-fancy-scrollbar";
    const $content = document.createElement("div");
    $content.className = this.wrapClassName("content") + " tele-fancy-scrollbar";
    this.$content = $content;
    this._renderSideEffect.add(() => {
      let last$userStyles;
      return this._$userStyles$.subscribe(($userStyles) => {
        if (last$userStyles) {
          last$userStyles.remove();
        }
        last$userStyles = $userStyles;
        if ($userStyles) {
          $contentWrap.appendChild($userStyles);
        }
      });
    });
    this._renderSideEffect.add(() => {
      let last$userContent;
      return this._$userContent$.subscribe(($userContent) => {
        if (last$userContent) {
          last$userContent.remove();
        }
        last$userContent = $userContent;
        if ($userContent) {
          $content.appendChild($userContent);
        }
      });
    });
    $contentWrap.appendChild($content);
    const $footer = document.createElement("div");
    $footer.className = this.wrapClassName("footer-wrap");
    this.$footer = $footer;
    this._renderSideEffect.add(() => {
      let last$userFooter;
      return this._$userFooter$.subscribe(($userFooter) => {
        if (last$userFooter) {
          last$userFooter.remove();
        }
        last$userFooter = $userFooter;
        if ($userFooter) {
          $footer.appendChild($userFooter);
        }
      });
    });
    $boxMain.appendChild($titleBar);
    $boxMain.appendChild($contentWrap);
    $boxMain.appendChild($footer);
    this.$contentWrap = $contentWrap;
    this._renderResizeHandlers();
    return this.$box;
  }
  _renderResizeHandlers() {
    const $resizeHandles = document.createElement("div");
    $resizeHandles.className = this.wrapClassName("resize-handles");
    Object.values(TELE_BOX_RESIZE_HANDLE).forEach((handleType) => {
      const $handle = document.createElement("div");
      $handle.className = this.wrapClassName(handleType) + " " + this.wrapClassName("resize-handle");
      $handle.dataset.teleBoxHandle = handleType;
      $resizeHandles.appendChild($handle);
    });
    this.$box.appendChild($resizeHandles);
    const TRACKING_DISPOSER_ID = "handle-tracking-listener";
    const transformingClassName = this.wrapClassName("transforming");
    let $trackMask;
    let trackStartX = 0;
    let trackStartY = 0;
    let trackStartWidth = 0;
    let trackStartHeight = 0;
    let trackStartPageX = 0;
    let trackStartPageY = 0;
    let trackingHandle;
    const handleTracking = (ev) => {
      if (this.state !== TELE_BOX_STATE.Normal) {
        return;
      }
      preventEvent$1(ev);
      let { pageX, pageY } = flattenEvent$1(ev);
      if (pageY < 0) {
        pageY = 0;
      }
      const offsetX = (pageX - trackStartPageX) / this.containerRect.width;
      const offsetY = (pageY - trackStartPageY) / this.containerRect.height;
      switch (trackingHandle) {
        case TELE_BOX_RESIZE_HANDLE.North: {
          this.transform(
            this.x,
            trackStartY + offsetY,
            this.width,
            trackStartHeight - offsetY
          );
          break;
        }
        case TELE_BOX_RESIZE_HANDLE.South: {
          this.transform(
            this.x,
            this.y,
            this.width,
            trackStartHeight + offsetY
          );
          break;
        }
        case TELE_BOX_RESIZE_HANDLE.West: {
          this.transform(
            trackStartX + offsetX,
            this.y,
            trackStartWidth - offsetX,
            this.height
          );
          break;
        }
        case TELE_BOX_RESIZE_HANDLE.East: {
          this.transform(
            this.x,
            this.y,
            trackStartWidth + offsetX,
            this.height
          );
          break;
        }
        case TELE_BOX_RESIZE_HANDLE.NorthWest: {
          this.transform(
            trackStartX + offsetX,
            trackStartY + offsetY,
            trackStartWidth - offsetX,
            trackStartHeight - offsetY
          );
          break;
        }
        case TELE_BOX_RESIZE_HANDLE.NorthEast: {
          this.transform(
            this.x,
            trackStartY + offsetY,
            trackStartWidth + offsetX,
            trackStartHeight - offsetY
          );
          break;
        }
        case TELE_BOX_RESIZE_HANDLE.SouthEast: {
          this.transform(
            this.x,
            this.y,
            trackStartWidth + offsetX,
            trackStartHeight + offsetY
          );
          break;
        }
        case TELE_BOX_RESIZE_HANDLE.SouthWest: {
          this.transform(
            trackStartX + offsetX,
            this.y,
            trackStartWidth - offsetX,
            trackStartHeight + offsetY
          );
          break;
        }
        default: {
          if (this.fence) {
            this.move(
              clamp$2(trackStartX + offsetX, 0, 1 - this.width),
              clamp$2(trackStartY + offsetY, 0, 1 - this.height)
            );
          } else {
            const xOverflowOffset = 20 / this.containerRect.width;
            const yOverflowOffset = 20 / this.containerRect.height;
            this.move(
              clamp$2(
                trackStartX + offsetX,
                xOverflowOffset - this.width,
                1 - xOverflowOffset
              ),
              clamp$2(trackStartY + offsetY, 0, 1 - yOverflowOffset)
            );
          }
          break;
        }
      }
    };
    const handleTrackEnd = (ev) => {
      trackingHandle = void 0;
      if (!$trackMask) {
        return;
      }
      preventEvent$1(ev);
      this.$box.classList.toggle(transformingClassName, false);
      this._sideEffect.flush(TRACKING_DISPOSER_ID);
      $trackMask.remove();
    };
    const handleTrackStart = (ev) => {
      var _a;
      if (this.readonly) {
        return;
      }
      if (ev.button != null && ev.button !== 0) {
        return;
      }
      if (!this.draggable || trackingHandle || this.state !== TELE_BOX_STATE.Normal) {
        return;
      }
      const target = ev.target;
      if ((_a = target.dataset) == null ? void 0 : _a.teleBoxHandle) {
        preventEvent$1(ev);
        trackStartX = this.x;
        trackStartY = this.y;
        trackStartWidth = this.width;
        trackStartHeight = this.height;
        ({ pageX: trackStartPageX, pageY: trackStartPageY } = flattenEvent$1(ev));
        trackingHandle = target.dataset.teleBoxHandle;
        if (!$trackMask) {
          $trackMask = document.createElement("div");
        }
        const cursor = trackingHandle ? this.wrapClassName(`cursor-${trackingHandle}`) : "";
        $trackMask.className = this.wrapClassName(
          `track-mask${cursor ? ` ${cursor}` : ""}`
        );
        this.$box.appendChild($trackMask);
        this.$box.classList.add(transformingClassName);
        this._sideEffect.add(() => {
          window.addEventListener("mousemove", handleTracking);
          window.addEventListener("touchmove", handleTracking, {
            passive: false
          });
          window.addEventListener("mouseup", handleTrackEnd);
          window.addEventListener("touchend", handleTrackEnd, {
            passive: false
          });
          window.addEventListener("touchcancel", handleTrackEnd, {
            passive: false
          });
          return () => {
            window.removeEventListener("mousemove", handleTracking);
            window.removeEventListener("touchmove", handleTracking);
            window.removeEventListener("mouseup", handleTrackEnd);
            window.removeEventListener("touchend", handleTrackEnd);
            window.removeEventListener(
              "touchcancel",
              handleTrackEnd
            );
          };
        }, TRACKING_DISPOSER_ID);
      }
    };
    this._handleTrackStart = handleTrackStart;
    this._sideEffect.addEventListener(
      $resizeHandles,
      "mousedown",
      handleTrackStart,
      {},
      "box-resizeHandles-mousedown"
    );
    this._sideEffect.addEventListener(
      $resizeHandles,
      "touchstart",
      handleTrackStart,
      { passive: false },
      "box-resizeHandles-touchstart"
    );
  }
  setScaleContent(scale2) {
    if (!this.$content)
      return;
    const styles2 = {};
    for (const property in this.$content.style) {
      if (typeof this.$content.style[property] === "string") {
        styles2[property] = this.$content.style[property];
      }
    }
    const contentWrapRect = this.$contentWrap.getBoundingClientRect();
    Object.assign(styles2, {
      width: contentWrapRect.width * scale2,
      height: contentWrapRect.height * scale2
    });
    Object.keys(styles2).forEach((key) => {
      const value = styles2[key];
      if (value != null) {
        this.$content.style[key] = value;
      }
    });
  }
  destroy() {
    this.$box.remove();
    this.events.emit(TELE_BOX_EVENT.Destroyed);
    this._sideEffect.flushAll();
    this._renderSideEffect.flushAll();
    this.events.removeAllListeners();
    this._delegateEvents.removeAllListeners();
  }
  wrapClassName(className) {
    return `${this.namespace}-${className}`;
  }
}
function noop$1() {
  return;
}
var collectorSVG = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzFfNDQyNDQpIj4KPGcgZmlsdGVyPSJ1cmwoI2ZpbHRlcjBfZF8xXzQ0MjQ0KSI+CjxwYXRoIGQ9Ik0xNC4wMDAyIDE2LjE5NTNDMTMuODI0NyAxNi4xOTUzIDEzLjY1MjIgMTYuMTQ5MSAxMy41MDAyIDE2LjA2MTVMNC41MDAxNyAxMC44NjQzQzQuMDIxNzggMTAuNTg3OSAzLjg1Nzk2IDkuOTc2MTIgNC4xMzQyOCA5LjQ5NzczQzQuMjIyMDQgOS4zNDU3OSA0LjM0ODIzIDkuMjE5NiA0LjUwMDE3IDkuMTMxODRMMTMuNTAwMiAzLjkzODQ4QzEzLjgwOTggMy43NjA3NCAxNC4xOTA1IDMuNzYwNzQgMTQuNTAwMiAzLjkzODQ4TDIzLjUwMDIgOS4xMzE4NEMyMy45Nzg2IDkuNDA4MTYgMjQuMTQyNCAxMC4wMiAyMy44NjYxIDEwLjQ5ODRDMjMuNzc4MyAxMC42NTAzIDIzLjY1MjEgMTAuNzc2NSAyMy41MDAyIDEwLjg2NDNMMTQuNTAwMiAxNi4wNjE1QzE0LjM0ODEgMTYuMTQ5MSAxNC4xNzU3IDE2LjE5NTMgMTQuMDAwMiAxNi4xOTUzWiIgZmlsbD0id2hpdGUiLz4KPC9nPgo8ZyBmaWx0ZXI9InVybCgjZmlsdGVyMV9kXzFfNDQyNDQpIj4KPHBhdGggZD0iTTIzLjUwMDIgMTMuMTMxOUwyMS41MzYxIDExLjk5ODVMMTQuNTAwMiAxNi4wNjE2QzE0LjE5MDcgMTYuMjQgMTMuODA5NiAxNi4yNCAxMy41MDAyIDE2LjA2MTZMNi40NjQyOCAxMS45OTg1TDQuNTAwMTcgMTMuMTMxOUM0LjAyMTc4IDEzLjQwODIgMy44NTc5NiAxNC4wMiA0LjEzNDI4IDE0LjQ5ODRDNC4yMjIwNCAxNC42NTA0IDQuMzQ4MjMgMTQuNzc2NiA0LjUwMDE3IDE0Ljg2NDNMMTMuNTAwMiAyMC4wNjE2QzEzLjgwOTYgMjAuMjQgMTQuMTkwNyAyMC4yNCAxNC41MDAyIDIwLjA2MTZMMjMuNTAwMiAxNC44NjQzQzIzLjk3ODYgMTQuNTg4IDI0LjE0MjQgMTMuOTc2MiAyMy44NjYxIDEzLjQ5NzhDMjMuNzc4MyAxMy4zNDU5IDIzLjY1MjEgMTMuMjE5NyAyMy41MDAyIDEzLjEzMTlaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjgiIHNoYXBlLXJlbmRlcmluZz0iY3Jpc3BFZGdlcyIvPgo8L2c+CjxnIGZpbHRlcj0idXJsKCNmaWx0ZXIyX2RfMV80NDI0NCkiPgo8cGF0aCBkPSJNMjMuNTAwMiAxNy4xMzE5TDIxLjUzNjEgMTUuOTk4NUwxNC41MDAyIDIwLjA2MTZDMTQuMTkwNyAyMC4yNCAxMy44MDk2IDIwLjI0IDEzLjUwMDIgMjAuMDYxNkw2LjQ2NDI4IDE1Ljk5ODVMNC41MDAxNyAxNy4xMzE5QzQuMDIxNzggMTcuNDA4MiAzLjg1Nzk2IDE4LjAyIDQuMTM0MjggMTguNDk4NEM0LjIyMjA0IDE4LjY1MDQgNC4zNDgyMyAxOC43NzY2IDQuNTAwMTcgMTguODY0M0wxMy41MDAyIDI0LjA2MTZDMTMuODA5NiAyNC4yNCAxNC4xOTA3IDI0LjI0IDE0LjUwMDIgMjQuMDYxNkwyMy41MDAyIDE4Ljg2NDNDMjMuOTc4NiAxOC41ODggMjQuMTQyNCAxNy45NzYyIDIzLjg2NjEgMTcuNDk3OEMyMy43NzgzIDE3LjM0NTkgMjMuNjUyMSAxNy4yMTk3IDIzLjUwMDIgMTcuMTMxOVoiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuNiIgc2hhcGUtcmVuZGVyaW5nPSJjcmlzcEVkZ2VzIi8+CjwvZz4KPC9nPgo8ZGVmcz4KPGZpbHRlciBpZD0iZmlsdGVyMF9kXzFfNDQyNDQiIHg9IjMiIHk9IjMuODA1MTgiIHdpZHRoPSIyMiIgaGVpZ2h0PSIxNC4zOTAxIiBmaWx0ZXJVbml0cz0idXNlclNwYWNlT25Vc2UiIGNvbG9yLWludGVycG9sYXRpb24tZmlsdGVycz0ic1JHQiI+CjxmZUZsb29kIGZsb29kLW9wYWNpdHk9IjAiIHJlc3VsdD0iQmFja2dyb3VuZEltYWdlRml4Ii8+CjxmZUNvbG9yTWF0cml4IGluPSJTb3VyY2VBbHBoYSIgdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDEyNyAwIiByZXN1bHQ9ImhhcmRBbHBoYSIvPgo8ZmVPZmZzZXQgZHk9IjEiLz4KPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMC41Ii8+CjxmZUNvbXBvc2l0ZSBpbjI9ImhhcmRBbHBoYSIgb3BlcmF0b3I9Im91dCIvPgo8ZmVDb2xvck1hdHJpeCB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMCAwIDAgMCAwLjU1Mjk0MSAwIDAgMCAwIDAuNTYwNzg0IDAgMCAwIDAgMC42NTA5OCAwIDAgMCAwLjE1IDAiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbjI9IkJhY2tncm91bmRJbWFnZUZpeCIgcmVzdWx0PSJlZmZlY3QxX2Ryb3BTaGFkb3dfMV80NDI0NCIvPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluPSJTb3VyY2VHcmFwaGljIiBpbjI9ImVmZmVjdDFfZHJvcFNoYWRvd18xXzQ0MjQ0IiByZXN1bHQ9InNoYXBlIi8+CjwvZmlsdGVyPgo8ZmlsdGVyIGlkPSJmaWx0ZXIxX2RfMV80NDI0NCIgeD0iMyIgeT0iMTEuOTk4NSIgd2lkdGg9IjIyIiBoZWlnaHQ9IjEwLjE5NjgiIGZpbHRlclVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj4KPGZlRmxvb2QgZmxvb2Qtb3BhY2l0eT0iMCIgcmVzdWx0PSJCYWNrZ3JvdW5kSW1hZ2VGaXgiLz4KPGZlQ29sb3JNYXRyaXggaW49IlNvdXJjZUFscGhhIiB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMTI3IDAiIHJlc3VsdD0iaGFyZEFscGhhIi8+CjxmZU9mZnNldCBkeT0iMSIvPgo8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIwLjUiLz4KPGZlQ29tcG9zaXRlIGluMj0iaGFyZEFscGhhIiBvcGVyYXRvcj0ib3V0Ii8+CjxmZUNvbG9yTWF0cml4IHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAuNTUyOTQxIDAgMCAwIDAgMC41NjA3ODQgMCAwIDAgMCAwLjY1MDk4IDAgMCAwIDAuMTUgMCIvPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluMj0iQmFja2dyb3VuZEltYWdlRml4IiByZXN1bHQ9ImVmZmVjdDFfZHJvcFNoYWRvd18xXzQ0MjQ0Ii8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0iZWZmZWN0MV9kcm9wU2hhZG93XzFfNDQyNDQiIHJlc3VsdD0ic2hhcGUiLz4KPC9maWx0ZXI+CjxmaWx0ZXIgaWQ9ImZpbHRlcjJfZF8xXzQ0MjQ0IiB4PSIzIiB5PSIxNS45OTg1IiB3aWR0aD0iMjIiIGhlaWdodD0iMTAuMTk2OCIgZmlsdGVyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiPgo8ZmVGbG9vZCBmbG9vZC1vcGFjaXR5PSIwIiByZXN1bHQ9IkJhY2tncm91bmRJbWFnZUZpeCIvPgo8ZmVDb2xvck1hdHJpeCBpbj0iU291cmNlQWxwaGEiIHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAxMjcgMCIgcmVzdWx0PSJoYXJkQWxwaGEiLz4KPGZlT2Zmc2V0IGR5PSIxIi8+CjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjAuNSIvPgo8ZmVDb21wb3NpdGUgaW4yPSJoYXJkQWxwaGEiIG9wZXJhdG9yPSJvdXQiLz4KPGZlQ29sb3JNYXRyaXggdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAgMCAwIDAgMC41NTI5NDEgMCAwIDAgMCAwLjU2MDc4NCAwIDAgMCAwIDAuNjUwOTggMCAwIDAgMC4xNSAwIi8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW4yPSJCYWNrZ3JvdW5kSW1hZ2VGaXgiIHJlc3VsdD0iZWZmZWN0MV9kcm9wU2hhZG93XzFfNDQyNDQiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJlZmZlY3QxX2Ryb3BTaGFkb3dfMV80NDI0NCIgcmVzdWx0PSJzaGFwZSIvPgo8L2ZpbHRlcj4KPGNsaXBQYXRoIGlkPSJjbGlwMF8xXzQ0MjQ0Ij4KPHJlY3Qgd2lkdGg9IjI4IiBoZWlnaHQ9IjI4IiBmaWxsPSJ3aGl0ZSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo=";
let onTickEndCallbacks;
let onTickEndPrimaryCallbacks;
function onTickEnd(callback, isPrimary = false) {
  if (!onTickEndCallbacks) {
    onTickEndCallbacks = isPrimary ? [] : [callback];
    onTickEndPrimaryCallbacks = isPrimary ? [callback] : [];
    Promise.resolve().then(() => {
      const currentCallbacks = onTickEndCallbacks;
      const currentPrimaryCallbacks = onTickEndPrimaryCallbacks;
      onTickEndCallbacks = void 0;
      onTickEndPrimaryCallbacks = void 0;
      currentPrimaryCallbacks == null ? void 0 : currentPrimaryCallbacks.forEach((cb2) => cb2());
      currentCallbacks == null ? void 0 : currentCallbacks.forEach((cb2) => cb2());
    });
  } else if (isPrimary) {
    onTickEndPrimaryCallbacks == null ? void 0 : onTickEndPrimaryCallbacks.push(callback);
  } else {
    onTickEndCallbacks.push(callback);
  }
}
function getHiddenElementSize(element2) {
  const clone = element2.cloneNode(true);
  clone.style.position = "absolute";
  clone.style.top = "-99999px";
  clone.style.float = "none";
  clone.style.visibility = "hidden";
  clone.style.display = "block";
  document.body.appendChild(clone);
  const rect = clone.getBoundingClientRect();
  document.body.removeChild(clone);
  return { height: rect.height, width: rect.width };
}
class TeleBoxCollector {
  constructor({
    visible = true,
    readonly = false,
    darkMode = false,
    namespace = "telebox",
    styles: styles2 = {},
    onClick,
    minimizedBoxes = [],
    boxes = []
  } = {}) {
    this.handleCollectorClick = () => {
      if (!this._readonly && this.onClick) {
        this.popupVisible$.setValue(!this.popupVisible$.value);
      }
    };
    this._sideEffect = new o$1();
    const { createVal } = c(this._sideEffect);
    this._visible = visible;
    this._readonly = readonly;
    this._darkMode = darkMode;
    this.namespace = namespace;
    this.styles = styles2;
    this.minimizedBoxes = minimizedBoxes;
    this.boxes = boxes;
    this.onClick = onClick;
    this.popupVisible$ = createVal(false);
    this.popupVisible$.reaction((popupVisible) => {
      var _a;
      (_a = this.$titles) == null ? void 0 : _a.classList.toggle(
        this.wrapClassName("collector-hide"),
        !popupVisible
      );
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          var _a2;
          (_a2 = this.$titles) == null ? void 0 : _a2.classList.toggle(
            this.wrapClassName(
              "collector-titles-visible"
            ),
            popupVisible
          );
        });
      });
    });
    const blurPopup = (ev) => {
      var _a, _b;
      if (!this.popupVisible$)
        return;
      const target = ev.target;
      if ((_b = (_a = target.className) == null ? void 0 : _a.includes) == null ? void 0 : _b.call(_a, "collector"))
        return;
      this.popupVisible$.setValue(false);
    };
    this._sideEffect.addEventListener(
      window,
      "pointerdown",
      blurPopup,
      true
    );
  }
  get visible() {
    return this._visible;
  }
  get readonly() {
    return this._readonly;
  }
  get darkMode() {
    return this._darkMode;
  }
  mount(root) {
    this.render(root);
    this.root = root;
    return this;
  }
  unmount() {
    if (this.$collector) {
      this.$collector.remove();
    }
    return this;
  }
  setVisible(visible) {
    var _a;
    if (this._visible !== visible) {
      this._visible = visible;
      if (this.$collector) {
        this.$collector.classList.toggle(this.wrapClassName("collector-visible"), visible);
        (_a = this.wrp$) == null ? void 0 : _a.classList.toggle(this.wrapClassName("collector-visible"), visible);
        if (!visible) {
          this.popupVisible$.setValue(false);
        } else {
          this.renderTitles();
        }
      }
    }
    return this;
  }
  setReadonly(readonly) {
    if (this._readonly !== readonly) {
      this._readonly = readonly;
      if (this.$collector) {
        this.$collector.classList.toggle(this.wrapClassName("collector-readonly"), readonly);
      }
    }
    return this;
  }
  setDarkMode(darkMode) {
    if (this._darkMode !== darkMode) {
      this._darkMode = darkMode;
      if (this.$collector) {
        this.$collector.classList.toggle(this.wrapClassName("color-scheme-dark"), darkMode);
        this.$collector.classList.toggle(
          this.wrapClassName("color-scheme-light"),
          !darkMode
        );
      }
    }
    return this;
  }
  setStyles(styles2) {
    Object.assign(this.styles, styles2);
    if (this.wrp$) {
      const $collector = this.wrp$;
      Object.keys(styles2).forEach((key) => {
        const value = styles2[key];
        if (value != null) {
          $collector.style[key] = value;
        }
      });
    }
    return this;
  }
  setMinimizedBoxes(boxes) {
    var _a;
    this.minimizedBoxes = boxes;
    if (this.count$) {
      this.count$.textContent = String((_a = this.minimizedBoxes) == null ? void 0 : _a.length) || "0";
    }
    this.renderTitles();
  }
  setBoxes(boxes) {
    this.boxes = boxes;
    this.renderTitles();
  }
  render(root) {
    if (!this.$collector) {
      this.$collector = document.createElement("button");
      this.$collector.className = this.wrapClassName("collector");
      this.$collector.style.backgroundImage = `url('${collectorSVG}')`;
      this.wrp$ = document.createElement("div");
      this.count$ = document.createElement("div");
      this.wrp$.className = this.wrapClassName("collector-wrp");
      this.count$.className = this.wrapClassName("collector-count");
      this.wrp$.appendChild(this.count$);
      this.wrp$.appendChild(this.$collector);
      this.$collector.addEventListener("click", this.handleCollectorClick);
      if (this._visible) {
        this.$collector.classList.add(this.wrapClassName("collector-visible"));
        this.wrp$.classList.toggle(this.wrapClassName("collector-visible"));
        this.renderTitles();
      }
      if (this._readonly) {
        this.$collector.classList.add(this.wrapClassName("collector-readonly"));
      }
      this.$collector.classList.add(
        this.wrapClassName(this._darkMode ? "color-scheme-dark" : "color-scheme-light")
      );
      this.setStyles(this.styles);
      root.appendChild(this.wrp$);
    }
    return this.$collector;
  }
  renderTitles() {
    var _a, _b, _c, _d;
    if (!this.$titles) {
      this.$titles = document.createElement("div");
      this.$titles.className = this.wrapClassName("collector-titles");
      this.$titles.classList.toggle(
        this.wrapClassName("collector-hide"),
        !this.popupVisible$.value
      );
    }
    this._sideEffect.addEventListener(
      this.$titles,
      "wheel",
      (ev) => {
        if (!ev.deltaX) {
          ev.currentTarget.scrollBy({
            left: ev.deltaY > 0 ? 250 : -250,
            behavior: "smooth"
          });
        }
      },
      { passive: false },
      "min-popup-render-wheel-titles"
    );
    const existContent = this.$titles.querySelector(
      `.${this.wrapClassName("collector-titles-content")}`
    );
    const $content = existContent != null ? existContent : document.createElement("div");
    $content.className = this.wrapClassName("collector-titles-content");
    if (!existContent) {
      this.$titles.appendChild($content);
      this._sideEffect.addEventListener(
        $content,
        "click",
        (ev) => {
          var _a2, _b2, _c2, _d2;
          const target = ev.target;
          if ((_b2 = (_a2 = target.dataset) == null ? void 0 : _a2.teleBoxID) == null ? void 0 : _b2.length) {
            (_d2 = this.onClick) == null ? void 0 : _d2.call(this, (_c2 = target.dataset) == null ? void 0 : _c2.teleBoxID);
          }
        },
        {},
        "telebox-collector-titles-content-click"
      );
    }
    $content.innerHTML = "";
    const disposers = (_a = this.boxes) == null ? void 0 : _a.filter((box) => {
      var _a2;
      return (_a2 = this.minimizedBoxes) == null ? void 0 : _a2.includes(box.id);
    }).map((box) => {
      const $tab = document.createElement("button");
      $tab.className = this.wrapClassName("collector-titles-tab");
      $tab.textContent = box.title;
      $tab.dataset.teleBoxID = box.id;
      $tab.dataset.teleTitleBarNoDblClick = "true";
      $content.appendChild($tab);
      return box._title$.reaction((title) => $tab.textContent = title);
    });
    this._sideEffect.addDisposer(
      () => disposers == null ? void 0 : disposers.forEach((disposer) => disposer()),
      "min-popup-render-tab-titles"
    );
    const existTitles = (_b = this.wrp$) == null ? void 0 : _b.querySelector(
      `.${this.wrapClassName("collector-titles")}`
    );
    if (!existTitles) {
      (_c = this.wrp$) == null ? void 0 : _c.appendChild(this.$titles);
    } else {
      (_d = this.wrp$) == null ? void 0 : _d.replaceChild(this.$titles, existTitles);
    }
    onTickEnd(() => {
      var _a2, _b2;
      if (!this.$titles)
        return;
      if (!this.wrp$)
        return;
      if (!this.root)
        return;
      const parentRect = (_a2 = this.wrp$) == null ? void 0 : _a2.getBoundingClientRect();
      const rootRect = (_b2 = this.root) == null ? void 0 : _b2.getBoundingClientRect();
      const popupSize = getHiddenElementSize(this.$titles);
      const isAvailableSpaceTop = parentRect.top - rootRect.top > popupSize.height;
      const isAvailableSpaceLeft = parentRect.x - rootRect.x > popupSize.width / 2 - parentRect.width / 2;
      const topPosition = -popupSize.height - 10;
      let leftPosition = -(popupSize.width / 2 - parentRect.width / 2);
      if (!isAvailableSpaceTop) {
        const availableHeight = parentRect.top;
        this.$titles.style.height = `${availableHeight}px`;
      }
      if (!isAvailableSpaceLeft) {
        leftPosition = -(parentRect.x - rootRect.x - 4);
      }
      this.$titles.style.top = `${topPosition}px`;
      this.$titles.style.left = `${leftPosition}px`;
    });
    return this.$titles;
  }
  destroy() {
    if (this.$collector) {
      this.$collector.removeEventListener("click", this.handleCollectorClick);
      this.$collector.remove();
      this.$collector = void 0;
    }
    this.onClick = void 0;
  }
  wrapClassName(className) {
    return `${this.namespace}-${className}`;
  }
}
var TELE_BOX_MANAGER_EVENT = /* @__PURE__ */ ((TELE_BOX_MANAGER_EVENT2) => {
  TELE_BOX_MANAGER_EVENT2["Focused"] = "focused";
  TELE_BOX_MANAGER_EVENT2["Blurred"] = "blurred";
  TELE_BOX_MANAGER_EVENT2["Created"] = "created";
  TELE_BOX_MANAGER_EVENT2["Removed"] = "removed";
  TELE_BOX_MANAGER_EVENT2["State"] = "state";
  TELE_BOX_MANAGER_EVENT2["Maximized"] = "maximized";
  TELE_BOX_MANAGER_EVENT2["Minimized"] = "minimized";
  TELE_BOX_MANAGER_EVENT2["Move"] = "move";
  TELE_BOX_MANAGER_EVENT2["Resize"] = "resize";
  TELE_BOX_MANAGER_EVENT2["IntrinsicMove"] = "intrinsic_move";
  TELE_BOX_MANAGER_EVENT2["IntrinsicResize"] = "intrinsic_resize";
  TELE_BOX_MANAGER_EVENT2["VisualResize"] = "visual_resize";
  TELE_BOX_MANAGER_EVENT2["ZIndex"] = "z_index";
  TELE_BOX_MANAGER_EVENT2["PrefersColorScheme"] = "prefers_color_scheme";
  TELE_BOX_MANAGER_EVENT2["DarkMode"] = "dark_mode";
  return TELE_BOX_MANAGER_EVENT2;
})(TELE_BOX_MANAGER_EVENT || {});
class MaxTitleBar extends DefaultTitleBar {
  constructor(config) {
    super(config);
    this.boxes = config.boxes;
    this.focusedBox = config.focusedBox;
    this.containerRect = config.containerRect;
    this.darkMode = config.darkMode;
    this.maximizedBoxes$ = config.maximizedBoxes$;
    this.minimizedBoxes$ = config.minimizedBoxes$;
  }
  focusBox(box) {
    var _a;
    if (this.focusedBox && this.focusedBox === box) {
      return;
    }
    if (this.$titles && this.state === TELE_BOX_STATE.Maximized) {
      const { children: children2 } = this.$titles.firstElementChild;
      for (let i2 = children2.length - 1; i2 >= 0; i2 -= 1) {
        const $tab = children2[i2];
        const id2 = (_a = $tab.dataset) == null ? void 0 : _a.teleBoxID;
        if (id2) {
          if (box && id2 === box.id) {
            $tab.classList.toggle(this.wrapClassName("titles-tab-focus"), true);
          } else if (this.focusedBox && id2 === this.focusedBox.id) {
            $tab.classList.toggle(this.wrapClassName("titles-tab-focus"), false);
          }
        }
      }
    }
    this.focusedBox = box;
  }
  setContainerRect(rect) {
    this.containerRect = rect;
    if (this.$titleBar) {
      const { x: x2, y: y2, width } = rect;
      this.$titleBar.style.transform = `translate(${x2}px, ${y2}px)`;
      this.$titleBar.style.width = width + "px";
    }
  }
  setBoxes(boxes) {
    this.boxes = boxes;
    this.updateTitles();
  }
  setMaximizedBoxes(boxes) {
    this.maximizedBoxes$ = boxes;
    this.updateTitles();
  }
  setMinimizedBoxes(boxes) {
    this.minimizedBoxes$ = boxes;
    this.updateTitles();
  }
  setState(state) {
    super.setState(state);
    if (this.$titleBar) {
      this.$titleBar.classList.toggle(
        this.wrapClassName("max-titlebar-maximized"),
        state === TELE_BOX_STATE.Maximized
      );
    }
    this.updateTitles();
  }
  setReadonly(readonly) {
    super.setReadonly(readonly);
    if (this.$titleBar) {
      this.$titleBar.classList.toggle(this.wrapClassName("readonly"), this.readonly);
    }
  }
  setDarkMode(darkMode) {
    if (darkMode !== this.darkMode) {
      this.darkMode = darkMode;
      if (this.$titleBar) {
        this.$titleBar.classList.toggle(this.wrapClassName("color-scheme-dark"), darkMode);
        this.$titleBar.classList.toggle(this.wrapClassName("color-scheme-light"), !darkMode);
      }
    }
  }
  render() {
    const $titleBar = super.render();
    const { x: x2, y: y2, width } = this.containerRect;
    $titleBar.style.transform = `translate(${x2}px, ${y2}px)`;
    $titleBar.style.width = width + "px";
    $titleBar.classList.add(this.wrapClassName("max-titlebar"));
    $titleBar.classList.toggle(
      this.wrapClassName("max-titlebar-maximized"),
      this.state === TELE_BOX_STATE.Maximized
    );
    $titleBar.classList.toggle(this.wrapClassName("readonly"), this.readonly);
    $titleBar.classList.add(
      this.wrapClassName(this.darkMode ? "color-scheme-dark" : "color-scheme-light")
    );
    const $titlesArea = document.createElement("div");
    $titlesArea.classList.add(this.wrapClassName("titles-area"));
    $titleBar.insertBefore($titlesArea, $titleBar.firstElementChild);
    this.updateTitles();
    return $titleBar;
  }
  destroy() {
    super.destroy();
    this.$titles = void 0;
    this.boxes.length = 0;
    this.focusedBox = void 0;
  }
  updateTitles() {
    var _a;
    (_a = this.$titleBar) == null ? void 0 : _a.classList.toggle(
      this.wrapClassName("max-titlebar-active"),
      this.maximizedBoxes$.length > 0 && this.boxes.length > 0 && this.maximizedBoxes$.filter((boxId) => !this.minimizedBoxes$.includes(boxId)).length > 0
    );
    if (this.$titleBar && this.maximizedBoxes$.length > 0 && this.boxes.length > 0 && this.maximizedBoxes$.filter((boxId) => !this.minimizedBoxes$.includes(boxId)).length > 0) {
      this.$titleBar.classList.toggle(
        this.wrapClassName("max-titlebar-single-title"),
        this.boxes.length === 1
      );
      if (this.boxes.length === 1) {
        this.setTitle(this.boxes[0].title);
      } else {
        this.$titleBar.replaceChild(
          this.renderTitles(),
          this.$titleBar.firstElementChild
        );
      }
    }
  }
  renderTitles() {
    this.$titles = document.createElement("div");
    this.$titles.className = this.wrapClassName("titles");
    this.$titles.addEventListener(
      "wheel",
      (ev) => {
        ev.currentTarget.scrollBy({
          left: ev.deltaY > 0 ? 250 : -250,
          behavior: "smooth"
        });
      },
      { passive: false }
    );
    const $content = document.createElement("div");
    $content.className = this.wrapClassName("titles-content");
    this.$titles.appendChild($content);
    this.boxes.filter((box) => this.maximizedBoxes$.includes(box.id)).filter((box) => !this.minimizedBoxes$.includes(box.id)).forEach((box) => {
      const $tab = document.createElement("button");
      $tab.className = this.wrapClassName("titles-tab");
      $tab.textContent = box.title;
      $tab.dataset.teleBoxID = box.id;
      $tab.dataset.teleTitleBarNoDblClick = "true";
      if (this.focusedBox && box.id === this.focusedBox.id) {
        $tab.classList.add(this.wrapClassName("titles-tab-focus"));
      }
      $content.appendChild($tab);
    });
    return this.$titles;
  }
}
class TeleBoxManager {
  constructor({
    root = document.body,
    prefersColorScheme = TELE_BOX_COLOR_SCHEME.Light,
    fence = true,
    containerRect = {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight
    },
    collector,
    namespace = "telebox",
    readonly = false,
    minimizedBoxes = [],
    maximizedBoxes = []
  } = {}) {
    this.events = new EventEmitter();
    this._sideEffect = new o$1();
    const { combine, createVal } = c(this._sideEffect);
    this.root = root;
    this.namespace = namespace;
    this.boxes$ = createVal([]);
    this.topBox$ = this.boxes$.derive((boxes) => {
      if (boxes.length > 0) {
        const topBox = boxes.reduce(
          (topBox2, box) => topBox2.zIndex > box.zIndex ? topBox2 : box
        );
        return topBox;
      }
      return;
    });
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
    const prefersDark$ = createVal(false);
    if (prefersDark) {
      prefersDark$.setValue(prefersDark.matches);
      this._sideEffect.add(() => {
        const handler = (evt) => {
          prefersDark$.setValue(evt.matches);
        };
        prefersDark.addListener(handler);
        return () => prefersDark.removeListener(handler);
      });
    }
    const prefersColorScheme$ = createVal(prefersColorScheme);
    prefersColorScheme$.reaction((prefersColorScheme2, _2, skipUpdate) => {
      this.boxes.forEach((box) => box.setPrefersColorScheme(prefersColorScheme2, skipUpdate));
      if (!skipUpdate) {
        this.events.emit(TELE_BOX_MANAGER_EVENT.PrefersColorScheme, prefersColorScheme2);
      }
    });
    this._darkMode$ = combine(
      [prefersDark$, prefersColorScheme$],
      ([prefersDark2, prefersColorScheme2]) => prefersColorScheme2 === "auto" ? prefersDark2 : prefersColorScheme2 === "dark"
    );
    this._darkMode$.reaction((darkMode, _2, skipUpdate) => {
      this.boxes.forEach((box) => box.setDarkMode(darkMode, skipUpdate));
      if (!skipUpdate) {
        this.events.emit(TELE_BOX_MANAGER_EVENT.DarkMode, darkMode);
      }
    });
    const readonly$ = createVal(readonly);
    readonly$.reaction((readonly2, _2, skipUpdate) => {
      this.boxes.forEach((box) => box.setReadonly(readonly2, skipUpdate));
    });
    this.maximizedBoxes$ = createVal(maximizedBoxes);
    this.minimizedBoxes$ = createVal(minimizedBoxes);
    this.maximizedBoxes$.reaction((maximizedBoxes2, _2, skipUpdate) => {
      this.boxes.forEach((box) => box.setMaximized(maximizedBoxes2.includes(box.id), skipUpdate));
      const maxBoxes = maximizedBoxes2.filter((id2) => !this.minimizedBoxes$.value.includes(id2));
      this.maxTitleBar.setState(maxBoxes.length > 0 ? TELE_BOX_STATE.Maximized : TELE_BOX_STATE.Normal);
      this.maxTitleBar.setMaximizedBoxes(maximizedBoxes2);
      if (!skipUpdate) {
        this.events.emit(TELE_BOX_MANAGER_EVENT.Maximized, maximizedBoxes2);
      }
    });
    const state$ = combine(
      [this.minimizedBoxes$, this.maximizedBoxes$],
      ([minimized, maximized]) => minimized.length ? TELE_BOX_STATE.Minimized : maximized.length ? TELE_BOX_STATE.Maximized : TELE_BOX_STATE.Normal
    );
    state$.reaction((state, _2, skipUpdate) => {
      this.maxTitleBar.setState(state);
      if (!skipUpdate) {
        this.events.emit(TELE_BOX_MANAGER_EVENT.State, state);
      }
    });
    const fence$ = createVal(fence);
    fence$.subscribe((fence2, _2, skipUpdate) => {
      this.boxes.forEach((box) => box.setFence(fence2, skipUpdate));
    });
    const containerRect$ = createVal(containerRect, shallowequal);
    containerRect$.reaction((containerRect2, _2, skipUpdate) => {
      this.boxes.forEach((box) => box.setContainerRect(containerRect2, skipUpdate));
      this.maxTitleBar.setContainerRect(containerRect2);
    });
    const collector$ = createVal(
      collector === null ? null : collector || new TeleBoxCollector({
        visible: this.minimizedBoxes$.value.length > 0,
        readonly,
        namespace,
        minimizedBoxes: this.minimizedBoxes$.value,
        boxes: this.boxes$.value
      }).mount(root)
    );
    collector$.subscribe((collector2) => {
      if (collector2) {
        collector2.setVisible(this.minimizedBoxes$.value.length > 0);
        collector2.setReadonly(readonly$.value);
        collector2.setDarkMode(this._darkMode$.value);
        this._sideEffect.add(() => {
          collector2.onClick = (boxId) => {
            if (!readonly$.value) {
              this.setMinimizedBoxes(
                removeByVal(
                  this.minimizedBoxes$.value.filter(Boolean),
                  boxId
                )
              );
            }
          };
          return () => collector2.destroy();
        }, "collect-onClick");
      }
    });
    readonly$.subscribe((readonly2) => {
      var _a;
      return (_a = collector$.value) == null ? void 0 : _a.setReadonly(readonly2);
    });
    this._darkMode$.subscribe((darkMode) => {
      var _a;
      (_a = collector$.value) == null ? void 0 : _a.setDarkMode(darkMode);
    });
    const calcCollectorRect = () => {
      var _a;
      if ((_a = collector$.value) == null ? void 0 : _a.$collector) {
        const { x: x2, y: y2, width, height } = collector$.value.$collector.getBoundingClientRect();
        const rootRect = this.root.getBoundingClientRect();
        return {
          x: x2 - rootRect.x,
          y: y2 - rootRect.y,
          width,
          height
        };
      }
      return;
    };
    const collectorRect$ = createVal(this.minimizedBoxes$.value.length > 0 ? calcCollectorRect() : void 0);
    collectorRect$.subscribe((collectorRect, _2, skipUpdate) => {
      this.boxes.forEach((box) => {
        box.setCollectorRect(collectorRect, skipUpdate);
      });
    });
    this.minimizedBoxes$.reaction((minimizedBoxes2, _2, skipUpdate) => {
      var _a, _b, _c;
      this.boxes.forEach((box) => box.setMinimized(minimizedBoxes2.includes(box.id), skipUpdate));
      const maxBoxes = this.maximizedBoxes$.value.filter((id2) => !minimizedBoxes2.includes(id2));
      this.maxTitleBar.setState(maxBoxes.length > 0 ? TELE_BOX_STATE.Maximized : TELE_BOX_STATE.Normal);
      this.maxTitleBar.setMinimizedBoxes(minimizedBoxes2);
      const minimized = minimizedBoxes2.length > 0;
      (_a = collector$.value) == null ? void 0 : _a.setVisible(minimized);
      (_b = this.collector) == null ? void 0 : _b.setMinimizedBoxes(minimizedBoxes2);
      if (minimized) {
        if ((_c = collector$.value) == null ? void 0 : _c.$collector) {
          collectorRect$.setValue(calcCollectorRect());
        }
      }
      if (!skipUpdate) {
        this.events.emit(TELE_BOX_MANAGER_EVENT.Minimized, minimizedBoxes2);
      }
    });
    const closeBtnClassName = this.wrapClassName("titlebar-icon-close");
    const checkFocusBox = (ev) => {
      var _a;
      if (readonly$.value) {
        return;
      }
      const target = ev.target;
      if (!target.tagName) {
        return;
      }
      for (let el = target; el; el = el.parentElement) {
        if (el.classList && el.classList.contains(closeBtnClassName)) {
          return;
        }
        const id2 = (_a = el.dataset) == null ? void 0 : _a.teleBoxID;
        if (id2) {
          const box = this.getBox(id2);
          if (box) {
            this.focusBox(box);
            this.makeBoxTop(box);
            return;
          }
        }
      }
    };
    this._sideEffect.addEventListener(window, "mousedown", checkFocusBox, true);
    this._sideEffect.addEventListener(window, "touchstart", checkFocusBox, true);
    this.maxTitleBar = new MaxTitleBar({
      darkMode: this.darkMode,
      readonly: readonly$.value,
      namespace: this.namespace,
      state: state$.value,
      boxes: this.boxes$.value,
      containerRect: containerRect$.value,
      maximizedBoxes$: this.maximizedBoxes$.value,
      minimizedBoxes$: this.minimizedBoxes$.value,
      onEvent: (event) => {
        var _a, _b, _c, _d, _e, _f;
        switch (event.type) {
          case TELE_BOX_DELEGATE_EVENT.Maximize: {
            if ((_a = this.maxTitleBar.focusedBox) == null ? void 0 : _a.id) {
              const oldFocusId = (_b = this.maxTitleBar.focusedBox) == null ? void 0 : _b.id;
              const isInMaximizedBoxes = this.maximizedBoxes$.value.includes(
                oldFocusId
              );
              const newMaximizedBoxes = isInMaximizedBoxes ? removeByVal(
                [...this.maximizedBoxes$.value],
                oldFocusId
              ) : uniqueByVal([
                ...this.maximizedBoxes$.value,
                (_c = this.maxTitleBar.focusedBox) == null ? void 0 : _c.id
              ]);
              this.setMaximizedBoxes(newMaximizedBoxes);
              const hasTopBox = this.makeBoxTopFromMaximized();
              const oldFocusBox = this.boxes$.value.find(
                (box) => box.id == oldFocusId
              );
              if (oldFocusBox) {
                this.makeBoxTop(oldFocusBox);
              }
              if (!hasTopBox) {
                this.setMaximizedBoxes([]);
              }
            } else {
              this.setMaximizedBoxes([]);
            }
            break;
          }
          case TELE_BOX_DELEGATE_EVENT.Minimize: {
            if ((_d = this.maxTitleBar.focusedBox) == null ? void 0 : _d.id) {
              const newMinimizedBoxes = uniqueByVal([
                ...this.minimizedBoxes$.value,
                (_e = this.maxTitleBar.focusedBox) == null ? void 0 : _e.id
              ]);
              this.makeBoxTopFromMaximized();
              this.setMinimizedBoxes(newMinimizedBoxes);
            }
            break;
          }
          case TELE_BOX_EVENT.Close: {
            const focusedId = (_f = this.maxTitleBar.focusedBox) == null ? void 0 : _f.id;
            if (focusedId) {
              this.remove(focusedId);
              this.makeBoxTopFromMaximized();
              this.setMaximizedBoxes(removeByVal(this.maximizedBoxes$.value, focusedId));
            }
            this.focusTopBox();
            break;
          }
        }
      }
    });
    readonly$.subscribe((readonly2) => this.maxTitleBar.setReadonly(readonly2));
    this._darkMode$.subscribe((darkMode) => {
      this.maxTitleBar.setDarkMode(darkMode);
    });
    this.boxes$.reaction((boxes) => {
      var _a;
      this.maxTitleBar.setBoxes(boxes);
      (_a = this.collector) == null ? void 0 : _a.setBoxes(boxes);
    });
    this.maximizedBoxes$.reaction((boxes) => {
      this.maxTitleBar.setMaximizedBoxes(boxes);
    });
    this.minimizedBoxes$.reaction((boxes) => {
      this.maxTitleBar.setMinimizedBoxes(boxes);
    });
    const valConfig = {
      prefersColorScheme: prefersColorScheme$,
      containerRect: containerRect$,
      collector: collector$,
      collectorRect: collectorRect$,
      readonly: readonly$,
      fence: fence$,
      maximizedBoxes: this.maximizedBoxes$,
      minimizedBoxes: this.minimizedBoxes$
    };
    i$1(this, valConfig);
    this._state$ = state$;
    this.root.appendChild(this.maxTitleBar.render());
  }
  get boxes() {
    return this.boxes$.value;
  }
  get topBox() {
    return this.topBox$.value;
  }
  get darkMode() {
    return this._darkMode$.value;
  }
  get state() {
    return this._state$.value;
  }
  setMinimized(data, skipUpdate = false) {
    console.log("mini", data, skipUpdate);
  }
  setMaximized(data, skipUpdate = false) {
    console.log("max", data, skipUpdate);
  }
  setState(state, skipUpdate = false) {
    console.log(skipUpdate);
    switch (state) {
      case TELE_BOX_STATE.Maximized: {
        break;
      }
      case TELE_BOX_STATE.Minimized: {
        break;
      }
    }
    return this;
  }
  create(config = {}, smartPosition = true) {
    const id2 = config.id || r$1$1();
    const managerMaximized$ = this.maximizedBoxes$.value.includes(id2);
    const managerMinimized$ = this.maximizedBoxes$.value.includes(id2);
    const box = new TeleBox({
      zIndex: this.topBox ? this.topBox.zIndex + 1 : 100,
      ...smartPosition ? this.smartPosition(config) : config,
      darkMode: this.darkMode,
      prefersColorScheme: this.prefersColorScheme,
      maximized: managerMaximized$,
      minimized: managerMinimized$,
      fence: this.fence,
      namespace: this.namespace,
      containerRect: this.containerRect,
      readonly: this.readonly,
      collectorRect: this.collectorRect,
      id: id2
    });
    box.mount(this.root);
    if (box.focus) {
      this.focusBox(box);
      if (smartPosition) {
        this.makeBoxTop(box);
      }
    }
    this.boxes$.setValue([...this.boxes, box]);
    box._delegateEvents.on(TELE_BOX_DELEGATE_EVENT.Maximize, () => {
      this.setMaximizedBoxes(this.boxes$.value.map((item) => item.id));
      this.maxTitleBar.focusBox(box);
    });
    box._delegateEvents.on(TELE_BOX_DELEGATE_EVENT.Minimize, () => {
      this.setMinimizedBoxes([...this.minimizedBoxes$.value, id2]);
    });
    box._delegateEvents.on(TELE_BOX_DELEGATE_EVENT.Close, () => {
      this.remove(box);
      this.makeBoxTopFromMaximized(box.id);
      this.focusTopBox();
    });
    box._coord$.reaction((_2, __, skipUpdate) => {
      if (!skipUpdate) {
        this.events.emit(TELE_BOX_MANAGER_EVENT.Move, box);
      }
    });
    box._size$.reaction((_2, __, skipUpdate) => {
      if (!skipUpdate) {
        this.events.emit(TELE_BOX_MANAGER_EVENT.Resize, box);
      }
    });
    box._intrinsicCoord$.reaction((_2, __, skipUpdate) => {
      if (!skipUpdate) {
        this.events.emit(TELE_BOX_MANAGER_EVENT.IntrinsicMove, box);
      }
    });
    box._intrinsicSize$.reaction((_2, __, skipUpdate) => {
      if (!skipUpdate) {
        this.events.emit(TELE_BOX_MANAGER_EVENT.IntrinsicResize, box);
      }
    });
    box._visualSize$.reaction((_2, __, skipUpdate) => {
      if (!skipUpdate) {
        this.events.emit(TELE_BOX_MANAGER_EVENT.VisualResize, box);
      }
    });
    box._zIndex$.reaction((_2, __, skipUpdate) => {
      if (this.boxes.length > 0) {
        const topBox = this.boxes.reduce(
          (topBox2, box2) => topBox2.zIndex > box2.zIndex ? topBox2 : box2
        );
        this.topBox$.setValue(topBox);
      }
      if (!skipUpdate) {
        this.events.emit(TELE_BOX_MANAGER_EVENT.ZIndex, box);
      }
    });
    this.events.emit(TELE_BOX_MANAGER_EVENT.Created, box);
    return box;
  }
  query(config) {
    return config ? this.boxes.filter(this.teleBoxMatcher(config)) : [...this.boxes];
  }
  queryOne(config) {
    return config ? this.boxes.find(this.teleBoxMatcher(config)) : this.boxes[0];
  }
  update(boxID, config, skipUpdate = false) {
    const box = this.boxes.find((box2) => box2.id === boxID);
    if (box) {
      return this.updateBox(box, config, skipUpdate);
    }
  }
  updateAll(config, skipUpdate = false) {
    this.boxes.forEach((box) => {
      this.updateBox(box, config, skipUpdate);
    });
  }
  remove(boxOrID, skipUpdate = false) {
    var _a;
    const index2 = this.getBoxIndex(boxOrID);
    if (index2 >= 0) {
      const boxes = this.boxes.slice();
      const deletedBoxes = boxes.splice(index2, 1);
      this.boxes$.setValue(boxes);
      deletedBoxes.forEach((box) => box.destroy());
      const boxId = (_a = this.getBox(boxOrID)) == null ? void 0 : _a.id;
      if (boxId) {
        this.setMaximizedBoxes(removeByVal(this.maximizedBoxes$.value, boxId));
        this.setMinimizedBoxes(removeByVal(this.minimizedBoxes$.value, boxId));
      }
      if (!skipUpdate) {
        if (this.boxes.length <= 0) {
          this.setMaximizedBoxes([]);
          this.setMinimizedBoxes([]);
        }
        this.events.emit(TELE_BOX_MANAGER_EVENT.Removed, deletedBoxes);
      }
      return deletedBoxes[0];
    }
    return;
  }
  removeTopBox() {
    if (this.topBox) {
      return this.remove(this.topBox);
    }
    return;
  }
  removeAll(skipUpdate = false) {
    const deletedBoxes = this.boxes$.value;
    this.boxes$.setValue([]);
    deletedBoxes.forEach((box) => box.destroy());
    if (!skipUpdate) {
      if (this.boxes.length <= 0) {
        this.setMaximizedBoxes([]);
        this.setMinimizedBoxes([]);
      }
      this.events.emit(TELE_BOX_MANAGER_EVENT.Removed, deletedBoxes);
    }
    return deletedBoxes;
  }
  destroy(skipUpdate = false) {
    this.events.removeAllListeners();
    this._sideEffect.flushAll();
    this.removeAll(skipUpdate);
    Object.keys(this).forEach((key) => {
      const value = this[key];
      if (value instanceof r$3) {
        value.destroy();
      }
    });
  }
  wrapClassName(className) {
    return `${this.namespace}-${className}`;
  }
  focusBox(boxOrID, skipUpdate = false) {
    const targetBox = this.getBox(boxOrID);
    if (targetBox) {
      this.boxes.forEach((box) => {
        if (targetBox === box) {
          let focusChanged = false;
          if (!targetBox.focus) {
            focusChanged = true;
            targetBox.setFocus(true, skipUpdate);
          }
          if (focusChanged && !skipUpdate) {
            this.events.emit(TELE_BOX_MANAGER_EVENT.Focused, targetBox);
          }
        } else if (box.focus) {
          if (!this.maximizedBoxes$.value.includes(box.id)) {
            this.blurBox(box, skipUpdate);
          }
        }
      });
      if (this.maximizedBoxes$.value.length > 0) {
        if (this.maximizedBoxes$.value.includes(targetBox.id)) {
          this.maxTitleBar.focusBox(targetBox);
        }
      } else {
        this.maxTitleBar.focusBox(targetBox);
      }
    }
  }
  focusTopBox() {
    if (this.topBox && !this.topBox.focus) {
      return this.focusBox(this.topBox);
    }
  }
  blurBox(boxOrID, skipUpdate = false) {
    const targetBox = this.getBox(boxOrID);
    if (targetBox) {
      if (targetBox.focus) {
        targetBox.setFocus(false, skipUpdate);
        if (!skipUpdate) {
          this.events.emit(TELE_BOX_MANAGER_EVENT.Blurred, targetBox);
        }
      }
      if (this.maxTitleBar.focusedBox === targetBox) {
        this.maxTitleBar.focusBox();
      }
    }
  }
  blurAll(skipUpdate = false) {
    this.boxes.forEach((box) => {
      if (box.focus) {
        box.setFocus(false, skipUpdate);
        if (!skipUpdate) {
          this.events.emit(TELE_BOX_MANAGER_EVENT.Blurred, box);
        }
      }
    });
    if (this.maxTitleBar.focusedBox) {
      this.maxTitleBar.focusBox();
    }
  }
  setScaleContent(scale2) {
    this.boxes.forEach((box) => {
      box.setScaleContent(scale2);
    });
  }
  teleBoxMatcher(config) {
    const keys = Object.keys(config);
    return (box) => keys.every((key) => config[key] === box[key]);
  }
  updateBox(box, config, skipUpdate = false) {
    if (config.x != null || config.y != null) {
      box.move(
        config.x == null ? box.intrinsicX : config.x,
        config.y == null ? box.intrinsicY : config.y,
        skipUpdate
      );
    }
    if (config.width != null || config.height != null) {
      box.resize(
        config.width == null ? box.intrinsicWidth : config.width,
        config.height == null ? box.intrinsicHeight : config.height,
        skipUpdate
      );
    }
    if (config.title != null) {
      box.setTitle(config.title);
      this.maxTitleBar.updateTitles();
    }
    if (config.visible != null) {
      box.setVisible(config.visible, skipUpdate);
    }
    if (config.minHeight != null) {
      box.setMinHeight(config.minHeight, skipUpdate);
    }
    if (config.minWidth != null) {
      box.setMinWidth(config.minWidth, skipUpdate);
    }
    if (config.resizable != null) {
      box.setResizable(config.resizable, skipUpdate);
    }
    if (config.draggable != null) {
      box.setDraggable(config.draggable, skipUpdate);
    }
    if (config.fixRatio != null) {
      box.setFixRatio(config.fixRatio, skipUpdate);
    }
    if (config.zIndex != null) {
      box.setZIndex(config.zIndex, skipUpdate);
    }
    if (config.content != null) {
      box.mountContent(config.content);
    }
    if (config.footer != null) {
      box.mountFooter(config.footer);
    }
  }
  smartPosition(config = {}) {
    let { x: x2, y: y2 } = config;
    const { width = 0.5, height = 0.5 } = config;
    if (x2 == null) {
      let vx = 20;
      if (this.topBox) {
        vx = this.topBox.intrinsicX * this.containerRect.width + 20;
        if (vx > this.containerRect.width - width * this.containerRect.width) {
          vx = 20;
        }
      }
      x2 = vx / this.containerRect.width;
    }
    if (y2 == null) {
      let vy = 20;
      if (this.topBox) {
        vy = this.topBox.intrinsicY * this.containerRect.height + 20;
        if (vy > this.containerRect.height - height * this.containerRect.height) {
          vy = 20;
        }
      }
      y2 = vy / this.containerRect.height;
    }
    return { ...config, x: x2, y: y2, width, height };
  }
  makeBoxTop(box, skipUpdate = false) {
    if (this.topBox) {
      if (box !== this.topBox) {
        if (this.maximizedBoxes$.value.includes(box.id)) {
          const newIndex = this.topBox.zIndex + 1;
          const normalBoxesIds = excludeFromBoth(
            this.boxes$.value.map((item) => item.id),
            this.maximizedBoxes$.value,
            this.minimizedBoxes$.value
          );
          const normalBoxes = this.boxes$.value.filter(
            (box2) => normalBoxesIds.includes(box2.id)
          );
          box._zIndex$.setValue(newIndex, skipUpdate);
          normalBoxes.sort((a2, b2) => a2._zIndex$.value - b2._zIndex$.value).forEach((box2, index2) => {
            box2._zIndex$.setValue(newIndex + 1 + index2, skipUpdate);
          });
        } else {
          box._zIndex$.setValue(this.topBox.zIndex + 1, skipUpdate);
        }
      }
    }
  }
  makeBoxTopFromMaximized(boxId) {
    let maxIndexBox = void 0;
    if (boxId) {
      if (this.maximizedBoxes$.value.includes(boxId) && !this.minimizedBoxes$.value.includes(boxId)) {
        maxIndexBox = this.boxes$.value.find((box) => box.id === boxId);
      }
    } else {
      const nextFocusBoxes = this.boxes$.value.filter((box) => {
        var _a;
        return box.id != ((_a = this.maxTitleBar.focusedBox) == null ? void 0 : _a.id) && this.maximizedBoxes$.value.includes(box.id) && !this.minimizedBoxes$.value.includes(box.id);
      });
      maxIndexBox = nextFocusBoxes.length ? nextFocusBoxes.reduce((maxItem, current) => {
        return current._zIndex$.value > maxItem._zIndex$.value ? current : maxItem;
      }) : void 0;
      if (maxIndexBox) {
        this.maxTitleBar.focusBox(maxIndexBox);
      }
    }
    return !!maxIndexBox;
  }
  getBoxIndex(boxOrID) {
    return typeof boxOrID === "string" ? this.boxes.findIndex((box) => box.id === boxOrID) : this.boxes.findIndex((box) => box === boxOrID);
  }
  getBox(boxOrID) {
    return typeof boxOrID === "string" ? this.boxes.find((box) => box.id === boxOrID) : boxOrID;
  }
}
const createBoxManager = (manager, callbacks2, emitter, boxEmitter2, options) => {
  return new BoxManager(
    {
      safeSetAttributes: (attributes) => manager.safeSetAttributes(attributes),
      getMainView: () => manager.mainView,
      updateAppState: (...args) => {
        var _a;
        return (_a = manager.appManager) == null ? void 0 : _a.store.updateAppState(...args);
      },
      canOperate: () => manager.canOperate,
      notifyContainerRectUpdate: (rect) => {
        var _a;
        return (_a = manager.appManager) == null ? void 0 : _a.notifyContainerRectUpdate(rect);
      },
      cleanFocus: () => {
        var _a;
        return (_a = manager.appManager) == null ? void 0 : _a.store.cleanFocus();
      },
      setAppFocus: (appId) => {
        var _a;
        return (_a = manager.appManager) == null ? void 0 : _a.store.setAppFocus(appId, true);
      },
      callbacks: callbacks2,
      emitter,
      boxEmitter: boxEmitter2
    },
    options
  );
};
class BoxManager {
  constructor(context, createTeleBoxManagerConfig) {
    this.context = context;
    this.createTeleBoxManagerConfig = createTeleBoxManagerConfig;
    const { emitter, callbacks: callbacks2, boxEmitter: boxEmitter2 } = context;
    this.teleBoxManager = this.setupBoxManager(createTeleBoxManagerConfig);
    this.teleBoxManager._state$.reaction((state) => {
      callbacks2.emit("boxStateChange", state);
      emitter.emit("boxStateChange", state);
    });
    this.teleBoxManager._darkMode$.reaction((darkMode) => {
      callbacks2.emit("darkModeChange", darkMode);
    });
    this.teleBoxManager._prefersColorScheme$.reaction((colorScheme) => {
      callbacks2.emit("prefersColorSchemeChange", colorScheme);
    });
    this.teleBoxManager._minimizedBoxes$.reaction((minimizedBoxes) => {
      if (!minimizedBoxes.length) {
        setTimeout(() => {
          const offset = 1e-3 * (Math.random() > 0.5 ? 1 : -1);
          this.teleBoxManager.boxes.forEach((box) => {
            box.resize(box.intrinsicWidth + offset, box.intrinsicHeight + offset, true);
          });
        }, 400);
      }
    });
    this.teleBoxManager.events.on("minimized", (minimizedBoxes) => {
      this.context.safeSetAttributes({ minimizedBoxes: JSON.stringify(minimizedBoxes) });
    });
    this.teleBoxManager.events.on("maximized", (maximizedBoxes) => {
      this.context.safeSetAttributes({ maximizedBoxes: JSON.stringify(maximizedBoxes) });
    });
    this.teleBoxManager.events.on("removed", (boxes) => {
      boxes.forEach((box) => {
        boxEmitter2.emit("close", { appId: box.id });
      });
    });
    this.teleBoxManager.events.on(
      "intrinsic_move",
      debounce((box) => {
        boxEmitter2.emit("move", { appId: box.id, x: box.intrinsicX, y: box.intrinsicY });
      }, 50)
    );
    this.teleBoxManager.events.on(
      "intrinsic_resize",
      debounce((box) => {
        boxEmitter2.emit("resize", {
          appId: box.id,
          width: box.intrinsicWidth,
          height: box.intrinsicHeight
        });
      }, 200)
    );
    this.teleBoxManager.events.on("focused", (box) => {
      if (box) {
        if (this.canOperate) {
          boxEmitter2.emit("focus", { appId: box.id });
        } else {
          this.teleBoxManager.blurBox(box.id);
        }
      }
    });
    this.teleBoxManager.events.on("z_index", (box) => {
      this.context.updateAppState(box.id, AppAttributes.ZIndex, box.zIndex);
    });
    emitter.on("playgroundSizeChange", () => this.updateManagerRect());
    emitter.on("updateManagerRect", () => this.updateManagerRect());
    emitter.on("onScaleChange", (scale2) => this.changeScale(scale2));
  }
  get mainView() {
    return this.context.getMainView();
  }
  get canOperate() {
    return this.context.canOperate();
  }
  get boxState() {
    return this.teleBoxManager.state;
  }
  get maximized() {
    return !!this.teleBoxManager._maximizedBoxes$.value;
  }
  get minimized() {
    return !!this.teleBoxManager._minimizedBoxes$.value;
  }
  get darkMode() {
    return this.teleBoxManager.darkMode;
  }
  get prefersColorScheme() {
    return this.teleBoxManager.prefersColorScheme;
  }
  get boxSize() {
    return this.teleBoxManager.boxes.length;
  }
  changeScale(scale2) {
    this.teleBoxManager.setScaleContent(scale2);
  }
  createBox(params) {
    var _a, _b, _c;
    if (!this.teleBoxManager)
      return;
    let { minwidth = MIN_WIDTH, minheight = MIN_HEIGHT } = (_a = params.app.config) != null ? _a : {};
    const { width, height } = (_b = params.app.config) != null ? _b : {};
    const title = ((_c = params.options) == null ? void 0 : _c.title) || params.appId;
    const rect = this.teleBoxManager.containerRect;
    if (minwidth > 1) {
      minwidth = minwidth / rect.width;
    }
    if (minheight > 1) {
      minheight = minheight / rect.height;
    }
    const createBoxConfig = {
      title,
      minWidth: minwidth,
      minHeight: minheight,
      width,
      height,
      id: params.appId
    };
    this.teleBoxManager.create(createBoxConfig, params.smartPosition);
    this.context.emitter.emit(`${params.appId}${Events.WindowCreated}`);
  }
  setBoxInitState(appId) {
    const box = this.teleBoxManager.queryOne({ id: appId });
    if (box) {
      if (box.state === TELE_BOX_STATE.Maximized) {
        this.context.boxEmitter.emit("resize", {
          appId,
          x: box.x,
          y: box.y,
          width: box.intrinsicWidth,
          height: box.intrinsicHeight
        });
      }
    }
  }
  setupBoxManager(createTeleBoxManagerConfig) {
    const root = WindowManager.wrapper ? WindowManager.wrapper : document.body;
    const rect = root.getBoundingClientRect();
    const initManagerState = {
      root,
      containerRect: {
        x: 0,
        y: 0,
        width: rect.width,
        height: rect.height
      },
      fence: false,
      prefersColorScheme: createTeleBoxManagerConfig == null ? void 0 : createTeleBoxManagerConfig.prefersColorScheme
    };
    const manager = new TeleBoxManager(initManagerState);
    if (this.teleBoxManager) {
      this.teleBoxManager.destroy();
    }
    this.teleBoxManager = manager;
    const container = (createTeleBoxManagerConfig == null ? void 0 : createTeleBoxManagerConfig.collectorContainer) || WindowManager.wrapper;
    if (container) {
      this.setCollectorContainer(container);
    }
    return manager;
  }
  setCollectorContainer(container) {
    var _a;
    const collector = new TeleBoxCollector({
      styles: (_a = this.createTeleBoxManagerConfig) == null ? void 0 : _a.collectorStyles
    }).mount(container);
    this.teleBoxManager.setCollector(collector);
  }
  getBox(appId) {
    return this.teleBoxManager.queryOne({ id: appId });
  }
  closeBox(appId, skipUpdate = false) {
    return this.teleBoxManager.remove(appId, skipUpdate);
  }
  boxIsFocus(appId) {
    const box = this.getBox(appId);
    return box == null ? void 0 : box.focus;
  }
  getFocusBox() {
    const boxes = this.teleBoxManager.query({ focus: true });
    return boxes[0];
  }
  getTopBox() {
    return this.teleBoxManager.topBox;
  }
  updateBoxState(state) {
    console.log(state);
    if (!state)
      return;
    const box = this.getBox(state.id);
    if (box) {
      this.teleBoxManager.update(
        box.id,
        {
          x: state.x,
          y: state.y,
          width: state.width || 0.5,
          height: state.height || 0.5,
          zIndex: state.zIndex
        },
        true
      );
      setTimeout(() => {
        if (state.focus) {
          this.teleBoxManager.focusBox(box.id, true);
        }
        if (state.maximized != null) {
          this.teleBoxManager.setMaximizedBoxes(isString(state.maximizedBoxes) ? JSON.parse(state.maximizedBoxes) : [], true);
        }
        if (state.minimized != null) {
          this.teleBoxManager.setMinimizedBoxes(isString(state.minimizedBoxes) ? JSON.parse(state.minimizedBoxes) : [], true);
        }
      }, 50);
      this.context.callbacks.emit("boxStateChange", this.teleBoxManager.state);
    }
  }
  updateManagerRect() {
    var _a;
    const rect = (_a = this.mainView.divElement) == null ? void 0 : _a.getBoundingClientRect();
    if (rect && rect.width > 0 && rect.height > 0) {
      const containerRect = { x: 0, y: 0, width: rect.width, height: rect.height };
      this.teleBoxManager.setContainerRect(containerRect);
      this.context.notifyContainerRectUpdate(containerRect);
    }
  }
  moveBox({ appId, x: x2, y: y2 }) {
    this.teleBoxManager.update(appId, { x: x2, y: y2 }, true);
  }
  focusBox({ appId }, skipUpdate = true) {
    this.teleBoxManager.focusBox(appId, skipUpdate);
  }
  resizeBox({ appId, width, height, skipUpdate }) {
    this.teleBoxManager.update(appId, { width, height }, skipUpdate);
  }
  setBoxMinSize(params) {
    this.teleBoxManager.update(
      params.appId,
      {
        minWidth: params.minWidth,
        minHeight: params.minHeight
      },
      true
    );
  }
  setBoxTitle(params) {
    this.teleBoxManager.update(params.appId, { title: params.title }, true);
  }
  blurAllBox() {
    this.teleBoxManager.blurAll();
  }
  updateAll(config) {
    this.teleBoxManager.updateAll(config);
  }
  setMaximized(maximized, skipUpdate = true) {
    if (!isString(maximized))
      return;
    try {
      this.teleBoxManager.setMaximizedBoxes(JSON.parse(maximized), skipUpdate);
    } catch (e2) {
      console.log(e2);
    }
  }
  setMinimized(minimized, skipUpdate = true) {
    if (!isString(minimized))
      return;
    try {
      this.teleBoxManager.setMinimizedBoxes(JSON.parse(minimized), skipUpdate);
    } catch (e2) {
      console.log(e2);
    }
  }
  focusTopBox() {
    const boxes = this.teleBoxManager.query();
    if (boxes.length >= 1) {
      const box = this.getTopBox();
      if (box) {
        this.focusBox({ appId: box.id }, false);
      }
    }
  }
  updateBox(id2, payload, skipUpdate = true) {
    console.log(id2, payload);
    this.teleBoxManager.update(id2, payload, skipUpdate);
  }
  setReadonly(readonly) {
    this.teleBoxManager.setReadonly(readonly);
  }
  setPrefersColorScheme(colorScheme) {
    this.teleBoxManager.setPrefersColorScheme(colorScheme);
  }
  setZIndex(id2, zIndex, skipUpdate = true) {
    this.teleBoxManager.update(id2, { zIndex }, skipUpdate);
  }
  destroy() {
    this.teleBoxManager.destroy();
  }
}
function noop() {
}
function run(fn) {
  return fn();
}
function blank_object() {
  return /* @__PURE__ */ Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function is_function(thing) {
  return typeof thing === "function";
}
function safe_not_equal(a2, b2) {
  return a2 != a2 ? b2 == b2 : a2 !== b2 || (a2 && typeof a2 === "object" || typeof a2 === "function");
}
let src_url_equal_anchor;
function src_url_equal(element_src, url) {
  if (!src_url_equal_anchor) {
    src_url_equal_anchor = document.createElement("a");
  }
  src_url_equal_anchor.href = url;
  return element_src === src_url_equal_anchor.href;
}
function is_empty(obj) {
  return Object.keys(obj).length === 0;
}
function append(target, node) {
  target.appendChild(node);
}
function insert(target, node, anchor) {
  target.insertBefore(node, anchor || null);
}
function detach(node) {
  node.parentNode.removeChild(node);
}
function element(name) {
  return document.createElement(name);
}
function text$1(data) {
  return document.createTextNode(data);
}
function space() {
  return text$1(" ");
}
function attr(node, attribute, value) {
  if (value == null)
    node.removeAttribute(attribute);
  else if (node.getAttribute(attribute) !== value)
    node.setAttribute(attribute, value);
}
function children(element2) {
  return Array.from(element2.childNodes);
}
function set_data(text2, data) {
  data = "" + data;
  if (text2.wholeText !== data)
    text2.data = data;
}
function set_style(node, key, value, important) {
  node.style.setProperty(key, value, important ? "important" : "");
}
let current_component;
function set_current_component(component) {
  current_component = component;
}
const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
  if (!update_scheduled) {
    update_scheduled = true;
    resolved_promise.then(flush);
  }
}
function add_render_callback(fn) {
  render_callbacks.push(fn);
}
let flushing = false;
const seen_callbacks = /* @__PURE__ */ new Set();
function flush() {
  if (flushing)
    return;
  flushing = true;
  do {
    for (let i2 = 0; i2 < dirty_components.length; i2 += 1) {
      const component = dirty_components[i2];
      set_current_component(component);
      update(component.$$);
    }
    set_current_component(null);
    dirty_components.length = 0;
    while (binding_callbacks.length)
      binding_callbacks.pop()();
    for (let i2 = 0; i2 < render_callbacks.length; i2 += 1) {
      const callback = render_callbacks[i2];
      if (!seen_callbacks.has(callback)) {
        seen_callbacks.add(callback);
        callback();
      }
    }
    render_callbacks.length = 0;
  } while (dirty_components.length);
  while (flush_callbacks.length) {
    flush_callbacks.pop()();
  }
  update_scheduled = false;
  flushing = false;
  seen_callbacks.clear();
}
function update($$) {
  if ($$.fragment !== null) {
    $$.update();
    run_all($$.before_update);
    const dirty = $$.dirty;
    $$.dirty = [-1];
    $$.fragment && $$.fragment.p($$.ctx, dirty);
    $$.after_update.forEach(add_render_callback);
  }
}
const outroing = /* @__PURE__ */ new Set();
function transition_in(block, local) {
  if (block && block.i) {
    outroing.delete(block);
    block.i(local);
  }
}
function mount_component(component, target, anchor, customElement) {
  const { fragment, on_mount, on_destroy, after_update } = component.$$;
  fragment && fragment.m(target, anchor);
  if (!customElement) {
    add_render_callback(() => {
      const new_on_destroy = on_mount.map(run).filter(is_function);
      if (on_destroy) {
        on_destroy.push(...new_on_destroy);
      } else {
        run_all(new_on_destroy);
      }
      component.$$.on_mount = [];
    });
  }
  after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
  const $$ = component.$$;
  if ($$.fragment !== null) {
    run_all($$.on_destroy);
    $$.fragment && $$.fragment.d(detaching);
    $$.on_destroy = $$.fragment = null;
    $$.ctx = [];
  }
}
function make_dirty(component, i2) {
  if (component.$$.dirty[0] === -1) {
    dirty_components.push(component);
    schedule_update();
    component.$$.dirty.fill(0);
  }
  component.$$.dirty[i2 / 31 | 0] |= 1 << i2 % 31;
}
function init(component, options, instance2, create_fragment2, not_equal, props, append_styles, dirty = [-1]) {
  const parent_component = current_component;
  set_current_component(component);
  const $$ = component.$$ = {
    fragment: null,
    ctx: null,
    props,
    update: noop,
    not_equal,
    bound: blank_object(),
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(parent_component ? parent_component.$$.context : options.context || []),
    callbacks: blank_object(),
    dirty,
    skip_bound: false,
    root: options.target || parent_component.$$.root
  };
  append_styles && append_styles($$.root);
  let ready = false;
  $$.ctx = instance2 ? instance2(component, options.props || {}, (i2, ret, ...rest) => {
    const value = rest.length ? rest[0] : ret;
    if ($$.ctx && not_equal($$.ctx[i2], $$.ctx[i2] = value)) {
      if (!$$.skip_bound && $$.bound[i2])
        $$.bound[i2](value);
      if (ready)
        make_dirty(component, i2);
    }
    return ret;
  }) : [];
  $$.update();
  ready = true;
  run_all($$.before_update);
  $$.fragment = create_fragment2 ? create_fragment2($$.ctx) : false;
  if (options.target) {
    if (options.hydrate) {
      const nodes = children(options.target);
      $$.fragment && $$.fragment.l(nodes);
      nodes.forEach(detach);
    } else {
      $$.fragment && $$.fragment.c();
    }
    if (options.intro)
      transition_in(component.$$.fragment);
    mount_component(component, options.target, options.anchor, options.customElement);
    flush();
  }
  set_current_component(parent_component);
}
class SvelteComponent {
  $destroy() {
    destroy_component(this, 1);
    this.$destroy = noop;
  }
  $on(type, callback) {
    const callbacks2 = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
    callbacks2.push(callback);
    return () => {
      const index2 = callbacks2.indexOf(callback);
      if (index2 !== -1)
        callbacks2.splice(index2, 1);
    };
  }
  $set($$props) {
    if (this.$$set && !is_empty($$props)) {
      this.$$.skip_bound = true;
      this.$$set($$props);
      this.$$.skip_bound = false;
    }
  }
}
function create_if_block(ctx) {
  let div1;
  let div0;
  let t0;
  let span;
  let t1;
  let t2;
  let div1_class_value;
  let if_block0 = ctx[18] && create_if_block_2(ctx);
  let if_block1 = ctx[19] && create_if_block_1(ctx);
  return {
    c() {
      div1 = element("div");
      div0 = element("div");
      if (if_block0)
        if_block0.c();
      t0 = space();
      span = element("span");
      t1 = text$1(ctx[1]);
      t2 = space();
      if (if_block1)
        if_block1.c();
      set_style(span, "overflow", "hidden");
      set_style(span, "white-space", "nowrap");
      set_style(span, "text-overflow", "ellipsis");
      set_style(span, "max-width", "80px");
      attr(div0, "class", ctx[9]);
      set_style(div0, "background-color", ctx[3]);
      set_style(div0, "color", ctx[10]);
      set_style(div0, "opacity", ctx[12]);
      attr(div1, "class", div1_class_value = "netless-window-manager-cursor-name " + ctx[16] + " " + ctx[15]);
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, div0);
      if (if_block0)
        if_block0.m(div0, null);
      append(div0, t0);
      append(div0, span);
      append(span, t1);
      append(div0, t2);
      if (if_block1)
        if_block1.m(div0, null);
    },
    p(ctx2, dirty) {
      if (ctx2[18]) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
        } else {
          if_block0 = create_if_block_2(ctx2);
          if_block0.c();
          if_block0.m(div0, t0);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (dirty & 2)
        set_data(t1, ctx2[1]);
      if (ctx2[19]) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_1(ctx2);
          if_block1.c();
          if_block1.m(div0, null);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
      if (dirty & 512) {
        attr(div0, "class", ctx2[9]);
      }
      if (dirty & 8) {
        set_style(div0, "background-color", ctx2[3]);
      }
      if (dirty & 1024) {
        set_style(div0, "color", ctx2[10]);
      }
      if (dirty & 4096) {
        set_style(div0, "opacity", ctx2[12]);
      }
      if (dirty & 98304 && div1_class_value !== (div1_class_value = "netless-window-manager-cursor-name " + ctx2[16] + " " + ctx2[15])) {
        attr(div1, "class", div1_class_value);
      }
    },
    d(detaching) {
      if (detaching)
        detach(div1);
      if (if_block0)
        if_block0.d();
      if (if_block1)
        if_block1.d();
    }
  };
}
function create_if_block_2(ctx) {
  let img;
  let img_src_value;
  return {
    c() {
      img = element("img");
      attr(img, "class", "netless-window-manager-cursor-selector-avatar");
      attr(img, "style", ctx[20]());
      if (!src_url_equal(img.src, img_src_value = ctx[8]))
        attr(img, "src", img_src_value);
      attr(img, "alt", "avatar");
    },
    m(target, anchor) {
      insert(target, img, anchor);
    },
    p(ctx2, dirty) {
      if (dirty & 256 && !src_url_equal(img.src, img_src_value = ctx2[8])) {
        attr(img, "src", img_src_value);
      }
    },
    d(detaching) {
      if (detaching)
        detach(img);
    }
  };
}
function create_if_block_1(ctx) {
  let span;
  let t2;
  return {
    c() {
      span = element("span");
      t2 = text$1(ctx[2]);
      attr(span, "class", "netless-window-manager-cursor-tag-name");
      set_style(span, "background-color", ctx[11]);
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t2);
    },
    p(ctx2, dirty) {
      if (dirty & 4)
        set_data(t2, ctx2[2]);
      if (dirty & 2048) {
        set_style(span, "background-color", ctx2[11]);
      }
    },
    d(detaching) {
      if (detaching)
        detach(span);
    }
  };
}
function create_fragment(ctx) {
  let div1;
  let t2;
  let div0;
  let img;
  let img_class_value;
  let img_src_value;
  let div1_class_value;
  let if_block = !ctx[14] && create_if_block(ctx);
  return {
    c() {
      div1 = element("div");
      if (if_block)
        if_block.c();
      t2 = space();
      div0 = element("div");
      img = element("img");
      attr(img, "class", img_class_value = "netless-window-manager-cursor-" + ctx[4] + "-image " + ctx[15]);
      if (!src_url_equal(img.src, img_src_value = ctx[7]))
        attr(img, "src", img_src_value);
      attr(img, "alt", ctx[4]);
      attr(div0, "class", "cursor-image-wrapper");
      attr(div1, "class", div1_class_value = "netless-window-manager-cursor-mid" + (ctx[13] ? " netless-window-manager-cursor-custom" : ""));
      set_style(div1, "transform", "translateX(" + ctx[5] + "px) translateY(" + ctx[6] + "px)");
      set_style(div1, "display", ctx[17]);
      attr(div1, "data-cursor-uid", ctx[0]);
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      if (if_block)
        if_block.m(div1, null);
      append(div1, t2);
      append(div1, div0);
      append(div0, img);
    },
    p(ctx2, [dirty]) {
      if (!ctx2[14]) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block(ctx2);
          if_block.c();
          if_block.m(div1, t2);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
      if (dirty & 32784 && img_class_value !== (img_class_value = "netless-window-manager-cursor-" + ctx2[4] + "-image " + ctx2[15])) {
        attr(img, "class", img_class_value);
      }
      if (dirty & 128 && !src_url_equal(img.src, img_src_value = ctx2[7])) {
        attr(img, "src", img_src_value);
      }
      if (dirty & 16) {
        attr(img, "alt", ctx2[4]);
      }
      if (dirty & 8192 && div1_class_value !== (div1_class_value = "netless-window-manager-cursor-mid" + (ctx2[13] ? " netless-window-manager-cursor-custom" : ""))) {
        attr(div1, "class", div1_class_value);
      }
      if (dirty & 96) {
        set_style(div1, "transform", "translateX(" + ctx2[5] + "px) translateY(" + ctx2[6] + "px)");
      }
      if (dirty & 131072) {
        set_style(div1, "display", ctx2[17]);
      }
      if (dirty & 1) {
        attr(div1, "data-cursor-uid", ctx2[0]);
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching)
        detach(div1);
      if (if_block)
        if_block.d();
    }
  };
}
function instance($$self, $$props, $$invalidate) {
  let hasName;
  let hasTagName;
  let hasAvatar;
  let display;
  let isLaserPointer;
  let isLaserPointerPencilEraser;
  let offset;
  let pencilEraserSize3ImageOffset;
  let { uid } = $$props;
  let { cursorName } = $$props;
  let { tagName } = $$props;
  let { backgroundColor } = $$props;
  let { appliance } = $$props;
  let { x: x2 } = $$props;
  let { y: y2 } = $$props;
  let { src } = $$props;
  let { visible } = $$props;
  let { avatar } = $$props;
  let { theme } = $$props;
  let { color: color2 } = $$props;
  let { cursorTagBackgroundColor } = $$props;
  let { opacity } = $$props;
  let { pencilEraserSize } = $$props;
  let { custom } = $$props;
  const computedAvatarStyle = () => {
    return Object.entries({
      width: (hasName ? 19 : 28) + "px",
      height: (hasName ? 19 : 28) + "px",
      position: hasName ? "initial" : "absolute",
      "border-color": hasName ? "white" : backgroundColor,
      "margin-right": (hasName ? 4 : 0) + "px"
    }).map(([key, v2]) => `${key}: ${v2}`).join(";");
  };
  $$self.$$set = ($$props2) => {
    if ("uid" in $$props2)
      $$invalidate(0, uid = $$props2.uid);
    if ("cursorName" in $$props2)
      $$invalidate(1, cursorName = $$props2.cursorName);
    if ("tagName" in $$props2)
      $$invalidate(2, tagName = $$props2.tagName);
    if ("backgroundColor" in $$props2)
      $$invalidate(3, backgroundColor = $$props2.backgroundColor);
    if ("appliance" in $$props2)
      $$invalidate(4, appliance = $$props2.appliance);
    if ("x" in $$props2)
      $$invalidate(5, x2 = $$props2.x);
    if ("y" in $$props2)
      $$invalidate(6, y2 = $$props2.y);
    if ("src" in $$props2)
      $$invalidate(7, src = $$props2.src);
    if ("visible" in $$props2)
      $$invalidate(21, visible = $$props2.visible);
    if ("avatar" in $$props2)
      $$invalidate(8, avatar = $$props2.avatar);
    if ("theme" in $$props2)
      $$invalidate(9, theme = $$props2.theme);
    if ("color" in $$props2)
      $$invalidate(10, color2 = $$props2.color);
    if ("cursorTagBackgroundColor" in $$props2)
      $$invalidate(11, cursorTagBackgroundColor = $$props2.cursorTagBackgroundColor);
    if ("opacity" in $$props2)
      $$invalidate(12, opacity = $$props2.opacity);
    if ("pencilEraserSize" in $$props2)
      $$invalidate(22, pencilEraserSize = $$props2.pencilEraserSize);
    if ("custom" in $$props2)
      $$invalidate(13, custom = $$props2.custom);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & 2) {
      hasName = !isEmpty(cursorName);
    }
    if ($$self.$$.dirty & 4) {
      $$invalidate(19, hasTagName = !isEmpty(tagName));
    }
    if ($$self.$$.dirty & 256) {
      $$invalidate(18, hasAvatar = !isEmpty(avatar));
    }
    if ($$self.$$.dirty & 2097152) {
      $$invalidate(17, display = visible ? "" : "none");
    }
    if ($$self.$$.dirty & 16) {
      $$invalidate(14, isLaserPointer = appliance === ApplianceNames.laserPointer);
    }
    if ($$self.$$.dirty & 16400) {
      $$invalidate(23, isLaserPointerPencilEraser = isLaserPointer || appliance === ApplianceNames.pencilEraser);
    }
    if ($$self.$$.dirty & 8388608) {
      $$invalidate(16, offset = isLaserPointerPencilEraser ? "netless-window-manager-laserPointer-pencilEraser-offset" : "");
    }
    if ($$self.$$.dirty & 4194304) {
      $$invalidate(15, pencilEraserSize3ImageOffset = pencilEraserSize === 3 ? "netless-window-manager-pencilEraser-3-offset" : "");
    }
  };
  return [
    uid,
    cursorName,
    tagName,
    backgroundColor,
    appliance,
    x2,
    y2,
    src,
    avatar,
    theme,
    color2,
    cursorTagBackgroundColor,
    opacity,
    custom,
    isLaserPointer,
    pencilEraserSize3ImageOffset,
    offset,
    display,
    hasAvatar,
    hasTagName,
    computedAvatarStyle,
    visible,
    pencilEraserSize,
    isLaserPointerPencilEraser
  ];
}
class Cursor$1 extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance, create_fragment, safe_not_equal, {
      uid: 0,
      cursorName: 1,
      tagName: 2,
      backgroundColor: 3,
      appliance: 4,
      x: 5,
      y: 6,
      src: 7,
      visible: 21,
      avatar: 8,
      theme: 9,
      color: 10,
      cursorTagBackgroundColor: 11,
      opacity: 12,
      pencilEraserSize: 22,
      custom: 13
    });
  }
}
const staticCircle = `data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Ccircle cx='12' cy='12' r='2.5' stroke='%23000' stroke-linejoin='square'/%3E%3Ccircle cx='12' cy='12' r='3.5' stroke='%23FFF'/%3E%3C/g%3E%3C/svg%3E`;
function circleUrl(color2) {
  return `data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Ccircle cx='12' cy='12' r='2.5' stroke='%23${color2}' stroke-linejoin='square'/%3E%3Ccircle cx='12' cy='12' r='3.5' stroke='%23${color2}'/%3E%3C/g%3E%3C/svg%3E`;
}
function crossUrl(color2) {
  return `data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg' fill='none'%3E%3Cpath d='M5 12H19' stroke='%23${color2}' stroke-linejoin='round'/%3E%3Cpath d='M12 5V19' stroke='%23${color2}' stroke-linejoin='round'/%3E%3C/svg%3E`;
}
function cssCursor(url) {
  return `url("${url}") 12 12, auto`;
}
function makeStyleContent(config) {
  let result = "";
  for (const cursor in config) {
    result += `.netless-whiteboard.${cursor} {cursor: ${config[cursor]}}
`;
  }
  return result;
}
const $style = document.createElement("style");
function enableLocal(memberState) {
  const [r2, g2, b2] = memberState.strokeColor;
  const hex2 = ((1 << 24) + (r2 << 16) + (g2 << 8) + b2).toString(16).slice(1);
  $style.textContent = makeStyleContent({
    "cursor-pencil": cssCursor(circleUrl(hex2)),
    "cursor-eraser": cssCursor(staticCircle),
    "cursor-rectangle": cssCursor(crossUrl(hex2)),
    "cursor-ellipse": cssCursor(crossUrl(hex2)),
    "cursor-straight": cssCursor(crossUrl(hex2)),
    "cursor-arrow": cssCursor(crossUrl(hex2)),
    "cursor-shape": cssCursor(crossUrl(hex2))
  });
  document.head.appendChild($style);
  return () => {
    if ($style.parentNode == null)
      return;
    document.head.removeChild($style);
  };
}
const shapeAppliances = /* @__PURE__ */ new Set([
  ApplianceNames.rectangle,
  ApplianceNames.ellipse,
  ApplianceNames.straight,
  ApplianceNames.arrow,
  ApplianceNames.shape
]);
function remoteIcon(applianceName, hex2) {
  if (applianceName === ApplianceNames.pencil) {
    return circleUrl(hex2);
  } else if (applianceName === ApplianceNames.eraser) {
    return staticCircle;
  } else if (shapeAppliances.has(applianceName)) {
    return crossUrl(hex2);
  }
}
class Cursor {
  constructor(manager, memberId, cursorManager, wrapper) {
    this.manager = manager;
    this.memberId = memberId;
    this.cursorManager = cursorManager;
    this.wrapper = wrapper;
    this.style = "default";
    this.move = (position) => {
      var _a;
      if (position.type === "main") {
        const rect = this.cursorManager.wrapperRect;
        if (this.component && rect) {
          this.autoHidden();
          this.moveCursor(position, rect, this.manager.mainView);
        }
      } else {
        const focusView = this.cursorManager.focusView;
        const viewRect = (_a = focusView == null ? void 0 : focusView.divElement) == null ? void 0 : _a.getBoundingClientRect();
        const viewCamera = focusView == null ? void 0 : focusView.camera;
        if (focusView && viewRect && viewCamera && this.component) {
          this.autoHidden();
          this.moveCursor(position, viewRect, focusView);
        }
      }
    };
    this.setStyle = (style2) => {
      this.style = style2;
      if (this.component) {
        this.component.$set({
          src: this.getIcon(),
          custom: this.isCustomIcon()
        });
      }
    };
    this.leave = () => {
      this.hide();
    };
    this.updateMember();
    this.createCursor();
    this.autoHidden();
    this.setStyle(cursorManager.style);
  }
  moveCursor(cursor, rect, view) {
    var _a, _b;
    const { x: x2, y: y2, type } = cursor;
    const point = view == null ? void 0 : view.screen.convertPointToScreen(x2, y2);
    if (point) {
      let translateX = point.x - 2;
      let translateY = point.y - 18;
      if (this.isCustomIcon()) {
        translateX -= 11;
        translateY += 4;
      }
      if (type === "app") {
        const wrapperRect = this.cursorManager.wrapperRect;
        if (wrapperRect) {
          translateX = translateX + rect.x - wrapperRect.x;
          translateY = translateY + rect.y - wrapperRect.y;
        }
      }
      if (point.x < 0 || point.x > rect.width || point.y < 0 || point.y > rect.height) {
        (_a = this.component) == null ? void 0 : _a.$set({ visible: false, x: translateX, y: translateY });
      } else {
        (_b = this.component) == null ? void 0 : _b.$set({ visible: true, x: translateX, y: translateY });
      }
    }
  }
  get memberApplianceName() {
    var _a, _b;
    return (_b = (_a = this.member) == null ? void 0 : _a.memberState) == null ? void 0 : _b.currentApplianceName;
  }
  get memberColor() {
    var _a, _b;
    const rgb = (_b = (_a = this.member) == null ? void 0 : _a.memberState) == null ? void 0 : _b.strokeColor.join(",");
    return `rgb(${rgb})`;
  }
  get memberColorHex() {
    var _a, _b;
    const [r2, g2, b2] = ((_b = (_a = this.member) == null ? void 0 : _a.memberState) == null ? void 0 : _b.strokeColor) || [236, 52, 85];
    return ((1 << 24) + (r2 << 16) + (g2 << 8) + b2).toString(16).slice(1);
  }
  get payload() {
    var _a;
    return (_a = this.member) == null ? void 0 : _a.payload;
  }
  get memberCursorName() {
    var _a, _b;
    return ((_a = this.payload) == null ? void 0 : _a.nickName) || ((_b = this.payload) == null ? void 0 : _b.cursorName) || this.memberId;
  }
  get memberTheme() {
    var _a;
    if ((_a = this.payload) == null ? void 0 : _a.theme) {
      return "netless-window-manager-cursor-inner-mellow";
    } else {
      return "netless-window-manager-cursor-inner";
    }
  }
  get memberCursorTextColor() {
    var _a;
    return ((_a = this.payload) == null ? void 0 : _a.cursorTextColor) || "#FFFFFF";
  }
  get memberCursorTagBackgroundColor() {
    var _a;
    return ((_a = this.payload) == null ? void 0 : _a.cursorTagBackgroundColor) || this.memberColor;
  }
  get memberAvatar() {
    var _a;
    return (_a = this.payload) == null ? void 0 : _a.avatar;
  }
  get memberOpacity() {
    if (!this.memberCursorName && !this.memberAvatar) {
      return 0;
    } else {
      return 1;
    }
  }
  get memberTagName() {
    var _a;
    return (_a = this.payload) == null ? void 0 : _a.cursorTagName;
  }
  autoHidden() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = window.setTimeout(() => {
      this.hide();
    }, 1e3 * 10);
  }
  async createCursor() {
    if (this.member && this.wrapper) {
      this.component = new Cursor$1({
        target: this.wrapper,
        props: this.initProps()
      });
    }
  }
  initProps() {
    var _a;
    return {
      uid: this.memberId,
      x: 0,
      y: 0,
      appliance: this.memberApplianceName,
      avatar: this.memberAvatar,
      src: this.getIcon(),
      custom: this.isCustomIcon(),
      visible: false,
      backgroundColor: this.memberColor,
      cursorName: this.memberCursorName,
      theme: this.memberTheme,
      color: this.memberCursorTextColor,
      cursorTagBackgroundColor: this.memberCursorTagBackgroundColor,
      opacity: this.memberOpacity,
      tagName: this.memberTagName,
      pencilEraserSize: (_a = this.member) == null ? void 0 : _a.memberState.pencilEraserSize
    };
  }
  getIcon() {
    var _a;
    if (!this.member)
      return;
    const { memberApplianceName, memberColorHex } = this;
    const { userApplianceIcons, applianceIcons } = this.cursorManager;
    let iconsKey = this.memberApplianceName;
    if (iconsKey === ApplianceNames.pencilEraser) {
      iconsKey = `${iconsKey}${((_a = this.member) == null ? void 0 : _a.memberState.pencilEraserSize) || 1}`;
    }
    const userApplianceSrc = iconsKey && userApplianceIcons[iconsKey];
    if (userApplianceSrc)
      return userApplianceSrc;
    if (this.style === "custom" && memberApplianceName) {
      const customApplianceSrc = remoteIcon(memberApplianceName, memberColorHex);
      if (customApplianceSrc)
        return customApplianceSrc;
    }
    const applianceSrc = applianceIcons[iconsKey || ApplianceNames.shape];
    return applianceSrc || applianceIcons[ApplianceNames.shape];
  }
  isCustomIcon() {
    var _a;
    if (!this.member)
      return false;
    const { memberApplianceName, memberColorHex } = this;
    const { userApplianceIcons } = this.cursorManager;
    let iconsKey = this.memberApplianceName;
    if (iconsKey === ApplianceNames.pencilEraser) {
      iconsKey = `${iconsKey}${((_a = this.member) == null ? void 0 : _a.memberState.pencilEraserSize) || 1}`;
    }
    const userApplianceSrc = iconsKey && userApplianceIcons[iconsKey];
    if (userApplianceSrc)
      return false;
    if (this.style === "custom" && memberApplianceName) {
      const customApplianceSrc = remoteIcon(memberApplianceName, memberColorHex);
      if (customApplianceSrc)
        return true;
    }
    return false;
  }
  updateMember() {
    this.member = findMemberByUid(this.manager.room, this.memberId);
    this.updateComponent();
    return this.member;
  }
  updateComponent() {
    var _a;
    (_a = this.component) == null ? void 0 : _a.$set(omit(this.initProps(), ["x", "y"]));
  }
  destroy() {
    if (this.component) {
      this.component.$destroy();
    }
    this.cursorManager.cursorInstances.delete(this.memberId);
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }
  hide() {
    if (this.component) {
      this.component.$set({ visible: false });
      this.destroy();
    }
  }
}
var pencil = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAA0CAYAAADFeBvrAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAYISURBVHgB7ZpNSCtXFIBPEuvz+dMGpYUKD/sWFX+Qti6kK7Hqpm6e9q0rIoIUFUShPLV10VZx4+JZqa9v20LBhdq9fyBUCtKNPH8qYl2IOw3G38Rkek4y15y5uTOZJDOWggcOSSYzN/ebc+45554JwIM8iBCPyTEP+86T4vyMfsRN4b+nQTKIJp0vzuGvlpID7os8EQNEIBD4oKio6Bm9DwaDv/v9/n/076JgbtWUYPchwrW8qD7UnOvr6wFNkpubm+/wu7f0c7y6mrnlvQufxB0Iau7V1dX3BDA/P6/V1dVpzc3N2uLiIofK1c8VYHys/wRKBUN3/hGHqaysNOjc3FwMis6hc0FtLTHuvYLxCCZgci8uLn4wg5Gh6Fy8Jk+/NkcCAlAAuUkoW4g0B+d5tLS05O/r67O8eGxsDNra2uDy8nKsoKCAwCIQDxQa0yTxgrvCYXyTk5Ml+Orf2dlJeeHIyAigFSE/P38ELfUNqNdSkjgF5FF89jL1TU1NlQwODl5gZPujp6cHWltbUw7Koc7Pz8mkZpHPFeFrJuZeqLnoMoPoZqe0JjDP/IZgnyLUG/o8NDRkuo5Ua2pjY6MC4oFCFf1cA0oKzRSOp6enRfTaGh0d/QxBt+1CUVgnOTs7+xrHfQzGyOcKkK3QTJMnQffZ6e/v/xwttmsHqqmpKXbdycnJCxy7ABLh3FEgVZ6hZJhnFZoFFMF0d3c/w7v+dyookXBnZ2c/xvHfhriVcvXfdBRItsxjnOhYqjwjoAimq6vrCysoGofk+Ph4Esd/F/UdiFtJAGUd2DygTpp5dmBUUJ2dnc9VUALm8PDwJY7/BPU9VD8k3M4RC6kskxZMKigKIMLN9vf3p3H8DyWgfEhEOwOQD9IXOTz7EObbwsLC4YWFBRgeHrY9ECXYo6MjaGlpKWlsbPxkYGDgRW1tbSEWquVlZWXBzc3Nl1VVVa8hXiXc6ioqBqGaPDk7AACJTRZ3NS9lcUp86cJwoSQ7Pj4Op6enfxUXF3/V0NCQv7q6GsCvwrqGUG/01xAD4+VQTOxaSF43d5bBOisrGBJRCtXX17+/trb268rKSgASFgmz97KFkmo6OztWuVyPweiWGc4WRkhFRQVEIpHg8vJyQAIQVlLBROVxvBYQHsXnO8tk62ZcyN0wecLBwcEvYHSzEPscBqOLCRhLC4n9uqaA8UAWAcAKhtbQ3t7eTHl5+Y9gtAp3twhT056CDMQ7MRzIFTeTYKb1yYYVQFH9VdzsqNmYKpfTJBDX3Ixgdnd3XyHMT2AMALJlBBSPaMpNngrIsTyTCgaj288YDGakictrxizvKFNOjgSSBLS+vv6UYHDb7DgMVgsChjTEgCIKGG4ZU+EWkgNBzN1qamq+pAMTExPgFMzW1tZrhHkFyWE5KxgSszx0527RaDRmOSpRshEOU11dPQPG8CwHARHJlMnTSrwSRFIlfXt7m3V5ngJGuJtqzaQtZkFBVNJezN5ZAdmwjKo2k9tVtrcI3OXk4tPgcg7ChCDZ1URgMOu72Xa5VFHOkymQhWVU60YVmjN6wiC7k6p+S1syCACOwJBYFaexV+yhBekNPsMBO6KAEeE4BMaCU67RsoYhSbXgaT//ht709vZCaWmp6YkEbLFmVJWzas04+iBL7EKpm0J7duqu0B7+CTUpNJuyvb1NCfMj1CqI9wLKUOlOUMeG+gGFkHii4HizUF4z/KFUrPsJ8WbEIyx7nnZ0dDynME6BAuce09iFHo+GrnmGltltb2//E4wVAN82y7vOjKOZXSBhJdHNiT3TYWD8OY2PTUJkdd7MkJMnT5wZVQF2RFX6yBMUdzPMvvfqxz3sXHF+GNT9ANXit/10O1sgHkZvdQAOKvs9B5L7ARELGAAXLSTvM8QExTE+YbHe+HURhZp1aRyF4CJXClbbWwGketgkW9VsY+YaiBCVhfgE+XvxRwgZSM4jUVCDZFQ9pytmXR8hUTB2gnidx4XffVWydN0yQjwmx/jkAZJBrIBI5J7ZvQGZWUgVSuU/EqmOAzicKNMVu816DdRWUV1/7xAP8n+SfwF3Du3NF2sYhwAAAABJRU5ErkJggg==";
var selector = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADEAAAAxCAYAAABznEEcAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAZoSURBVHgB7VlLSCRXFL3ljNEhEXTGhMQJmOjCz8ZNVLKICz9xIYhCNi7UgINkGEk2En8hW5cBUQNxo05GAoKikuCAmvGzGMdPcCUGjDPxD/4Vv/3JvWW97luvq7ur+hMZ8MKlqrteNfe8e965970GuLVbC5kpJr53+hjHx9yY3TUxJgLMAQG4ITARfp5T4Mri4uL9q6urnxwOxz/oY5eXl1/Pzs7e195X2FX4jZsIhAK7gx5ps9m6nGj9/f3OtbU1pzAE0318fPwVjYHrrN7R3AjU/wpOBwA9Cmf/9ejoqDMtLU31iooKGdA+ATo4OMiXAEWAHhBAGEApXj4rPAik0vPt7e0vCgoKPH4gMzMTSktLIS8vD2JiYgABvcHMTZyennbHxsaOg3udOJmLzwqEYB0ZgRCZENm4u7e39yQuLq65srISZmZmvP5Ybm4u5OfnQ0lJyXWUCAgzNLS+vt6SnJz8WgvYwV5xSlcRgyVg3ha2Dkxzc3MvfZmVlQW+bGxsDBobGyE7O1u94uJPjIqKqklKSvrbbrfPnp+ff7e8vJwMnlSTKWfJjDKhywJo6wLp0YcZ+dyIUr7s4cOHLsrRlQwBTSBFuzc2NiZYhjjVAIyzZBqEwgCQv0OOM/gNzuiP/ijlDxBRjgClpqa6AF1cXDydmpoaLCws3JcAGYHyC4JMzoKaibKysvienp6FtrY2IA/WCFB5ebkqCHSvARo8Ozt7igIxwIJ2gJ+seFMnDoIyEUV+dHT0G3qWVUr5M043DdAB0m2IKZwAYpgZX+qkywR6NFbuR0iDxmAoZRUQKRxSLTMnJ8eIaqqSeVMnIYUOdu+sq6vrp4f+VCoYo8khZaNs01VRlERUu2/BrWAA7sl2Anink1Ao18JGjyY/PDx8hq1GZqgp5c2mp6chMjLy2b179x7hRzvoqeUUwXIzqq4O5nZsNUaEbIbLqPLTou/s7FTvT05OpsA9sXJG1AVsZDwjutqBIN6gUlWjxod8XRBNKXgsrqpqYZfwEqX9h8TExD7wbFm8LmzxHQ0QHSlXKZVSqFC/hkqlaKapTaGgCQTK7PHW1lb/wsLC86KiokkccoV+qV1tcE0pO7AWxmhTxBszDzqRr66ujqanp2cRpQLNBgUsCh8BwQ54bn5+/s+mpqa+4eHhfS1gb52vwuP0trPjhSZCBtLQ0NA3MDDQQIFYAUHBYhuvzjpVbJr1lZWVP3p7e19UVVXNgHumXYrI4uBx6Yqevz02b0FcRQ8CoBQF3dXVpQLZ3d39C7n+ora29vfJyclDYFnWgFyxK3cxhss/+KoT/N6DVkQpKypFGUCp3Ozo6HgSHx//GLW/BwHsg57zl5pzADajwLn52mPL1ZHPloMoRYPMFL6EhAR18e7s7MxVV1fPsAAp4Avteq7dC/c1+wKI4g+EfGzDM+EYHBw8RDrNiA2QL6upqVGvKJ2/gHu2L1nA5wwEB2YDfSYMO1x/px0cgEc2zBY+eo67u6H29vZ/wU2VC8l58JxKNjDOgojNEp08aFVfX++3l6JMEdDx8fEB0FNIBsDXBc8ArwuW1EkeI1RKdLWmCx+1DhkZGRvR0dFfSsHKxYtnW0iqvJAN9xNm6MR/QO5sfapUSkqKmqW5ubmfwVgyZdpw/vPZl2kUEAinBMSUStG+gwra0NDQSynQKyloIxnlewafjDFLJzLRBJqiFMnqyMgIbG5uDuD996Dnv8iAPOMAPmbcm5lVJwA/vZRMKZGZlpaWVtAvUL4GZMqE1fjRJrUd76LHoX+InlhcXPwZnWW2tra6jjrpiBM3UK/weQr6J+gfodMh9HtwncG7YLA3CMSsLmxx5WuDCt8B7vZeicInTjCWlpb6wc15mfey7oc9E8LElpVmMgb9AXoC+qcTExOPKRu4NlTHs6Q10GfhgfYOvRsJQZ76BWMKuDtaolQs+gfoH6Mn436gDg+e+5BKXUQx/C5Je/a+NpbeiQJPKgUdlNXx/BCBKxVdxW5Q0I3XBqFKRhU4KLtjYawi3csuTKdc4FnIXNvKUJkVEGRG20QZAAUpA5DbaYAQLmQzfzxyk/ffdnCD4NWVnGdE7kQBQvQHC5lVEDxgMaM29lkxGCNLKrDnIbFAMkFmBIaDkHstU41coGZ1TZD5UjReCGUAYbNgdNqoXZB/T67yYbFAMiGML3BhYeH8rb0t9h/zgcTBcTNGiQAAAABJRU5ErkJggg==";
var eraser = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAA0CAYAAADFeBvrAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAgrSURBVHgB7ZprTBRXFIDP7gIt8lQppTwE5V0KaAn6o1pqNGkDDTEmTUhsgKRp+gNJw68CFkLbVC2QkDS+gD8KJdWmARvbFBNNWpuIRGPFWBXQRMPDqIki+KLATs+ZnTvcvXtnX8w2beJJToaduTP3fHPOPffcOwC8kP+2WCDwIvahGFxTuN8KmNSZmULPNjLeqF9F8rdPkIEGEn+r+vjx46LQ0NA8/Dsader58+e/h4WFDWntFO7ot6fMFAt3JLWi2lCDpqamCux2+2+KROj82NhYGrXT2lu5Z/DP/deFByElA4Pv3LlTiHY/nJ6eVnbv3q1s2bJFyc7OVrZu3arU1dUp4+PjxPUQoT+g9tp9PkMFgpo9kxljHRoaWp2Xl3duYmIiurKyEvDoclNCQgIcPnxYPc7MzHwcGRnZhaft4Ag7O9fUbRhaITCie4lgcnNzT7qDIaHz27dvh+vXr0NEREQneqoCHKFnAR+8ZCaQGGq2CxcurCGYycnJZHcwTNAzUFFRoUJFRUV1IFQ5OKBsXB9uxSwgl0TQ3d29Yt26dccwoyVXV1d7hGEiQmGi2AzOUHx/hob4K2yuYS9G987s7OwPISEh7xPM6dOnwVfBsIMjR45AZmbmo5s3b76Xnp7+J55egMVxBSAZT0v1ED+76yn66dOnLQSzd+9ev2BIyFP0MjBco1JTU/sxfFeDazp3cYgZHmKqdoaGNISHh9fv378fSJcqlPV6e3sBJ+I/goOD34VFL0k95Y+HxPHCYGxmw5DQ2NuzZw8EBQVtunXr1jvgwUP+hhz/QDXMMCNVE8zx48dNg2FCz6QQjI2N/RA8VBFmANnu3btXihnpG8pM9fX1EAi5du0aeWkVOAMBCF7yN+R0z4yOjq6NiYlpp9CgdBtIwXpPH6vgDKWLt0CygtM6MDCwBuUYZSKaOCksAiVY9wFOBePgDOOytPAGSKzNVCCC2bBhw69YdK7ypgpYimzbtk2dl7CM+hFcveOUHDylbTFO1YdhFbByx44dA1QFUP0VSJj4+Hjo6+sDq9U6iEmHKvFZTedQ50GYbN15SITVlwNlZWUnLRZL8s6dOwMOQ9UCTtKTra2ttdppt9V2kMF5cbmsjxuM43bMNrmUzc6fP6+GQiDGDoOJi4ubwb4qm5ubafyIE6nLxGqTPEsGo1cBOGNX0TyDYafC0CyOaxcVziyh53Z2dkJycvLMvn37PmpoaBgFR4jxYSbWdVIgI89Iq4CjR48CZjlYv369+tssqI6ODsjPz4f+/v668vLycxrEHHfkYdwC8SB6mGEV8Cl64cuuri5oa2tTG+EyGjZu3AiXLl1qefDgwV8lJSUFZkDV1tZCcXExXLx4sbWoqKgPFj0zx8GI9ZwO5W4M6ekZYeqpaqbqmaSqqkpNpcPDw4dwzfM9nrLduHEjEs+X0XV/Sx96LnqE1kLtBQUF3eDwCO8dGQyzV5rl+JyuegfXI29jRotiRlKnpFghHMzKyjqotVXS0tLacKPjF3bdHxjSq1evduAkepAD+ZsDYlC8V5w8ZBVg+PPq2MGMlkInqE4joTf45MmT4YyMjAPcA+ltLSQlJX2BafxnX6HI29QeK44TOTk57mCYZ0QoJ8OBM4yB6dkNkwGlSygsLFQvYtYB3BTMxFL+M+0eFgZqp4mJiU2+QKGX1fGIk/QIrn0aYXGsyDxjmAyMhO2jhaCGoUbX1NSkLSwsPMJqV8Fspu6lIZS6OYhjiOLwdU7fQM1HfRPD7wS1obZ0j0xpb4726Z49ezaJf2/S7s9ATUGNR41BjdJseRnke3WGwhrRTS9pD1mOGoeG15BxOOfoxuCkp0Ih6NeaEaSZGlieJyiCoc1FgsGldokGk8nBvAKOrWIGQ5uPsm0tt0BWDiicAaGuGhkZ+YqMw9StGzU4OKhCnT179hNsswY1FTXdE5QEJhc1S3tGogazXLOBwQSBl3tzIhQPtAL1VQJCTcNx8y1vHIUghSKFZE9PT7H2dlM1b+Wgrr1y5Uq77J75+fnplpaWMg2ch4nlYEI5z7hdensDpI4hrYNErcMMXJ32koG4ztf3pultz83NjWG99Ra2WQ0OL2VjZjwgeufUqVOqV8+cOdPIwdBLSNJeHg8TAh5WqJ6EfSmgt7IMNRJ1JThiOlnrOAMHshprmMKdoGSCpb9s3B3SYLIFGIqICJB7xisYi+RvfiypXw40DWGdlJaWRmMd141hk8V2OWm7ieYTXhBc3+BgaZyqAISjOYxSMVvXsBTNlzdiNQDgRao2AtK3pjggpmrqbGpqSsLPIN/dv38/gaBwUjTshMHcvn27JyUlpRmc5xpPMD599LIYnLNyUKKndKjGxsakXbt2deMCLIE8IVvs0YRM1fjdu3d/wrXN5+BcnzEgvor2uN3rjzAYMp5lPEoQlE5fA0fWo8GfhlCbKVFQ1pKNIfzcOHH58mWqaimVUwJI0+6n59D4pIlzmdZPMPiZzXjDjX47Le5g0Uu8x2zgPqWyKpjVe7x3+AUbq9NYjQbgp2dsBud5o8TP7d5kHAWcQchQfoEmLgn8HjOiBIF7o5hI1x6CEbLNP3bdqYAF44JzyWLzcN1i8DcT/o3awbm8Fz3DAy2A62INwPV/E3wWdx5inmBHuwChCBD6R2JwHge80TIQRQLjt7e8DTkGZgfX8cUMZTDAteFDkveaIlzjX9ySQs8X18r2t2VHUURPKoICmDR+eCO9aSdmOIub3/w9RgpgUpiJhvraXpa6jZKHGEqyusw0GLFzX+5RhN/8kYnMSNMMfyH/V/kHST6OYVElTPAAAAAASUVORK5CYII=";
var shape = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNDBweCIgaGVpZ2h0PSI0MHB4IiB2aWV3Qm94PSIwIDAgNDAgNDAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDYwLjEgKDg4MTMzKSAtIGh0dHBzOi8vc2tldGNoLmNvbSAtLT4KICAgIDx0aXRsZT5zaGFwZS1jdXJzb3I8L3RpdGxlPgogICAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CiAgICA8ZGVmcz4KICAgICAgICA8cGF0aCBkPSJNMjAsMjEuNSBDMjAuMjQ1NDU5OSwyMS41IDIwLjQ0OTYwODQsMjEuNjc2ODc1MiAyMC40OTE5NDQzLDIxLjkxMDEyNDQgTDIwLjUsMjIgTDIwLjUsMjcgQzIwLjUsMjcuMjc2MTQyNCAyMC4yNzYxNDI0LDI3LjUgMjAsMjcuNSBDMTkuNzU0NTQwMSwyNy41IDE5LjU1MDM5MTYsMjcuMzIzMTI0OCAxOS41MDgwNTU3LDI3LjA4OTg3NTYgTDE5LjUsMjcgTDE5LjUsMjIgQzE5LjUsMjEuNzIzODU3NiAxOS43MjM4NTc2LDIxLjUgMjAsMjEuNSBaIE0yNywxOS41IEMyNy4yNzYxNDI0LDE5LjUgMjcuNSwxOS43MjM4NTc2IDI3LjUsMjAgQzI3LjUsMjAuMjQ1NDU5OSAyNy4zMjMxMjQ4LDIwLjQ0OTYwODQgMjcuMDg5ODc1NiwyMC40OTE5NDQzIEwyNywyMC41IEwyMiwyMC41IEMyMS43MjM4NTc2LDIwLjUgMjEuNSwyMC4yNzYxNDI0IDIxLjUsMjAgQzIxLjUsMTkuNzU0NTQwMSAyMS42NzY4NzUyLDE5LjU1MDM5MTYgMjEuOTEwMTI0NCwxOS41MDgwNTU3IEwyMiwxOS41IEwyNywxOS41IFogTTE4LDE5LjUgQzE4LjI3NjE0MjQsMTkuNSAxOC41LDE5LjcyMzg1NzYgMTguNSwyMCBDMTguNSwyMC4yNDU0NTk5IDE4LjMyMzEyNDgsMjAuNDQ5NjA4NCAxOC4wODk4NzU2LDIwLjQ5MTk0NDMgTDE4LDIwLjUgTDEzLDIwLjUgQzEyLjcyMzg1NzYsMjAuNSAxMi41LDIwLjI3NjE0MjQgMTIuNSwyMCBDMTIuNSwxOS43NTQ1NDAxIDEyLjY3Njg3NTIsMTkuNTUwMzkxNiAxMi45MTAxMjQ0LDE5LjUwODA1NTcgTDEzLDE5LjUgTDE4LDE5LjUgWiBNMjAsMTIuNSBDMjAuMjQ1NDU5OSwxMi41IDIwLjQ0OTYwODQsMTIuNjc2ODc1MiAyMC40OTE5NDQzLDEyLjkxMDEyNDQgTDIwLjUsMTMgTDIwLjUsMTggQzIwLjUsMTguMjc2MTQyNCAyMC4yNzYxNDI0LDE4LjUgMjAsMTguNSBDMTkuNzU0NTQwMSwxOC41IDE5LjU1MDM5MTYsMTguMzIzMTI0OCAxOS41MDgwNTU3LDE4LjA4OTg3NTYgTDE5LjUsMTggTDE5LjUsMTMgQzE5LjUsMTIuNzIzODU3NiAxOS43MjM4NTc2LDEyLjUgMjAsMTIuNSBaIiBpZD0icGF0aC0xIj48L3BhdGg+CiAgICAgICAgPGZpbHRlciB4PSItNjQuNiUiIHk9Ii01OS41JSIgd2lkdGg9IjIyOS4zJSIgaGVpZ2h0PSIyNDYuMSUiIGZpbHRlclVuaXRzPSJvYmplY3RCb3VuZGluZ0JveCIgaWQ9ImZpbHRlci0yIj4KICAgICAgICAgICAgPGZlTW9ycGhvbG9neSByYWRpdXM9IjEiIG9wZXJhdG9yPSJkaWxhdGUiIGluPSJTb3VyY2VBbHBoYSIgcmVzdWx0PSJzaGFkb3dTcHJlYWRPdXRlcjEiPjwvZmVNb3JwaG9sb2d5PgogICAgICAgICAgICA8ZmVPZmZzZXQgZHg9IjAiIGR5PSIyIiBpbj0ic2hhZG93U3ByZWFkT3V0ZXIxIiByZXN1bHQ9InNoYWRvd09mZnNldE91dGVyMSI+PC9mZU9mZnNldD4KICAgICAgICAgICAgPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMyIgaW49InNoYWRvd09mZnNldE91dGVyMSIgcmVzdWx0PSJzaGFkb3dCbHVyT3V0ZXIxIj48L2ZlR2F1c3NpYW5CbHVyPgogICAgICAgICAgICA8ZmVDb21wb3NpdGUgaW49InNoYWRvd0JsdXJPdXRlcjEiIGluMj0iU291cmNlQWxwaGEiIG9wZXJhdG9yPSJvdXQiIHJlc3VsdD0ic2hhZG93Qmx1ck91dGVyMSI+PC9mZUNvbXBvc2l0ZT4KICAgICAgICAgICAgPGZlQ29sb3JNYXRyaXggdmFsdWVzPSIwIDAgMCAwIDAgICAwIDAgMCAwIDAgICAwIDAgMCAwIDAgIDAgMCAwIDAuMTYgMCIgdHlwZT0ibWF0cml4IiBpbj0ic2hhZG93Qmx1ck91dGVyMSI+PC9mZUNvbG9yTWF0cml4PgogICAgICAgIDwvZmlsdGVyPgogICAgPC9kZWZzPgogICAgPGcgaWQ9Iumhtemdoi00IiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8ZyBpZD0iV2hpdGVib2FyZC1HdWlkZWxpbmVzIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMzQ0LjAwMDAwMCwgLTc1MS4wMDAwMDApIj4KICAgICAgICAgICAgPGcgaWQ9InNoYXBlLWN1cnNvciIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzQ0LjAwMDAwMCwgNzUxLjAwMDAwMCkiPgogICAgICAgICAgICAgICAgPHJlY3QgaWQ9IuefqeW9ouWkh+S7vS00NCIgZmlsbD0iI0ZGRkZGRiIgb3BhY2l0eT0iMC4wMSIgeD0iMCIgeT0iMCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMiI+PC9yZWN0PgogICAgICAgICAgICAgICAgPGcgaWQ9IuW9oueKtue7k+WQiCIgZmlsbC1ydWxlPSJub256ZXJvIj4KICAgICAgICAgICAgICAgICAgICA8dXNlIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjEiIGZpbHRlcj0idXJsKCNmaWx0ZXItMikiIHhsaW5rOmhyZWY9IiNwYXRoLTEiPjwvdXNlPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIxIiBkPSJNMjAsMjEgQzIwLjQ4NTQxMDMsMjEgMjAuODk4MDg1LDIxLjM0Nzk5OTMgMjAuOTg5OTQ3OSwyMS44NjU0ODc3IEwyMSwyMiBMMjEsMjcgQzIxLDI3LjU1MjI4NDcgMjAuNTUyMjg0NywyOCAyMCwyOCBDMTkuNTE0NTg5NywyOCAxOS4xMDE5MTUsMjcuNjUyMDAwNyAxOS4wMTAwNTIxLDI3LjEzNDUxMjMgTDE5LDI3IEwxOSwyMiBDMTksMjEuNDQ3NzE1MyAxOS40NDc3MTUzLDIxIDIwLDIxIFogTTI3LDE5IEMyNy41NTIyODQ3LDE5IDI4LDE5LjQ0NzcxNTMgMjgsMjAgQzI4LDIwLjQ4NTQxMDMgMjcuNjUyMDAwNywyMC44OTgwODUgMjcuMTM0NTEyMywyMC45ODk5NDc5IEwyNywyMSBMMjIsMjEgQzIxLjQ0NzcxNTMsMjEgMjEsMjAuNTUyMjg0NyAyMSwyMCBDMjEsMTkuNTE0NTg5NyAyMS4zNDc5OTkzLDE5LjEwMTkxNSAyMS44NjU0ODc3LDE5LjAxMDA1MjEgTDIyLDE5IEwyNywxOSBaIE0xOCwxOSBDMTguNTUyMjg0NywxOSAxOSwxOS40NDc3MTUzIDE5LDIwIEMxOSwyMC40ODU0MTAzIDE4LjY1MjAwMDcsMjAuODk4MDg1IDE4LjEzNDUxMjMsMjAuOTg5OTQ3OSBMMTgsMjEgTDEzLDIxIEMxMi40NDc3MTUzLDIxIDEyLDIwLjU1MjI4NDcgMTIsMjAgQzEyLDE5LjUxNDU4OTcgMTIuMzQ3OTk5MywxOS4xMDE5MTUgMTIuODY1NDg3NywxOS4wMTAwNTIxIEwxMywxOSBMMTgsMTkgWiBNMjAsMTIgQzIwLjQ4NTQxMDMsMTIgMjAuODk4MDg1LDEyLjM0Nzk5OTMgMjAuOTg5OTQ3OSwxMi44NjU0ODc3IEwyMSwxMyBMMjEsMTggQzIxLDE4LjU1MjI4NDcgMjAuNTUyMjg0NywxOSAyMCwxOSBDMTkuNTE0NTg5NywxOSAxOS4xMDE5MTUsMTguNjUyMDAwNyAxOS4wMTAwNTIxLDE4LjEzNDUxMjMgTDE5LDE4IEwxOSwxMyBDMTksMTIuNDQ3NzE1MyAxOS40NDc3MTUzLDEyIDIwLDEyIFoiIGZpbGw9IiMyMTIzMjQiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PC9wYXRoPgogICAgICAgICAgICAgICAgPC9nPgogICAgICAgICAgICAgICAgPHJlY3QgaWQ9IuefqeW9oiIgZmlsbD0iI0ZGRkZGRiIgeD0iMTguNSIgeT0iMTciIHdpZHRoPSIzIiBoZWlnaHQ9IjYiPjwvcmVjdD4KICAgICAgICAgICAgICAgIDxyZWN0IGlkPSLnn6nlvaIiIGZpbGw9IiNGRkZGRkYiIHg9IjE3IiB5PSIxOC41IiB3aWR0aD0iNiIgaGVpZ2h0PSIzIj48L3JlY3Q+CiAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMjAsMjEuNSBDMjAuMjQ1NDU5OSwyMS41IDIwLjQ0OTYwODQsMjEuNjc2ODc1MiAyMC40OTE5NDQzLDIxLjkxMDEyNDQgTDIwLjUsMjIgTDIwLjUsMjcgQzIwLjUsMjcuMjc2MTQyNCAyMC4yNzYxNDI0LDI3LjUgMjAsMjcuNSBDMTkuNzU0NTQwMSwyNy41IDE5LjU1MDM5MTYsMjcuMzIzMTI0OCAxOS41MDgwNTU3LDI3LjA4OTg3NTYgTDE5LjUsMjcgTDE5LjUsMjIgQzE5LjUsMjEuNzIzODU3NiAxOS43MjM4NTc2LDIxLjUgMjAsMjEuNSBaIE0yNywxOS41IEMyNy4yNzYxNDI0LDE5LjUgMjcuNSwxOS43MjM4NTc2IDI3LjUsMjAgQzI3LjUsMjAuMjQ1NDU5OSAyNy4zMjMxMjQ4LDIwLjQ0OTYwODQgMjcuMDg5ODc1NiwyMC40OTE5NDQzIEwyNywyMC41IEwyMiwyMC41IEMyMS43MjM4NTc2LDIwLjUgMjEuNSwyMC4yNzYxNDI0IDIxLjUsMjAgQzIxLjUsMTkuNzU0NTQwMSAyMS42NzY4NzUyLDE5LjU1MDM5MTYgMjEuOTEwMTI0NCwxOS41MDgwNTU3IEwyMiwxOS41IEwyNywxOS41IFogTTE4LDE5LjUgQzE4LjI3NjE0MjQsMTkuNSAxOC41LDE5LjcyMzg1NzYgMTguNSwyMCBDMTguNSwyMC4yNDU0NTk5IDE4LjMyMzEyNDgsMjAuNDQ5NjA4NCAxOC4wODk4NzU2LDIwLjQ5MTk0NDMgTDE4LDIwLjUgTDEzLDIwLjUgQzEyLjcyMzg1NzYsMjAuNSAxMi41LDIwLjI3NjE0MjQgMTIuNSwyMCBDMTIuNSwxOS43NTQ1NDAxIDEyLjY3Njg3NTIsMTkuNTUwMzkxNiAxMi45MTAxMjQ0LDE5LjUwODA1NTcgTDEzLDE5LjUgTDE4LDE5LjUgWiBNMjAsMTIuNSBDMjAuMjQ1NDU5OSwxMi41IDIwLjQ0OTYwODQsMTIuNjc2ODc1MiAyMC40OTE5NDQzLDEyLjkxMDEyNDQgTDIwLjUsMTMgTDIwLjUsMTggQzIwLjUsMTguMjc2MTQyNCAyMC4yNzYxNDI0LDE4LjUgMjAsMTguNSBDMTkuNzU0NTQwMSwxOC41IDE5LjU1MDM5MTYsMTguMzIzMTI0OCAxOS41MDgwNTU3LDE4LjA4OTg3NTYgTDE5LjUsMTggTDE5LjUsMTMgQzE5LjUsMTIuNzIzODU3NiAxOS43MjM4NTc2LDEyLjUgMjAsMTIuNSBaIiBpZD0i5b2i54q257uT5ZCIIiBmaWxsPSIjMjEyMzI0IiBmaWxsLXJ1bGU9Im5vbnplcm8iPjwvcGF0aD4KICAgICAgICAgICAgPC9nPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+";
var text = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNDdweCIgaGVpZ2h0PSI0MHB4IiB2aWV3Qm94PSIwIDAgNDcgNDAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDYwLjEgKDg4MTMzKSAtIGh0dHBzOi8vc2tldGNoLmNvbSAtLT4KICAgIDx0aXRsZT50ZXh0LWN1cnNvcjwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPgogICAgICAgIDxwYXRoIGQ9Ik0xNiwyNi41IEMxNS43MjM4NTc2LDI2LjUgMTUuNSwyNi4yNzYxNDI0IDE1LjUsMjYgQzE1LjUsMjUuNzU0NTQwMSAxNS42NzY4NzUyLDI1LjU1MDM5MTYgMTUuOTEwMTI0NCwyNS41MDgwNTU3IEwxNiwyNS41IEwxOS41LDI1LjUgTDE5LjUsMTQuNSBMMTYsMTQuNSBDMTUuNzIzODU3NiwxNC41IDE1LjUsMTQuMjc2MTQyNCAxNS41LDE0IEMxNS41LDEzLjc1NDU0MDEgMTUuNjc2ODc1MiwxMy41NTAzOTE2IDE1LjkxMDEyNDQsMTMuNTA4MDU1NyBMMTYsMTMuNSBMMjQsMTMuNSBDMjQuMjc2MTQyNCwxMy41IDI0LjUsMTMuNzIzODU3NiAyNC41LDE0IEMyNC41LDE0LjI0NTQ1OTkgMjQuMzIzMTI0OCwxNC40NDk2MDg0IDI0LjA4OTg3NTYsMTQuNDkxOTQ0MyBMMjQsMTQuNSBMMjAuNSwxNC41IEwyMC41LDI1LjUgTDI0LDI1LjUgQzI0LjI3NjE0MjQsMjUuNSAyNC41LDI1LjcyMzg1NzYgMjQuNSwyNiBDMjQuNSwyNi4yNDU0NTk5IDI0LjMyMzEyNDgsMjYuNDQ5NjA4NCAyNC4wODk4NzU2LDI2LjQ5MTk0NDMgTDI0LDI2LjUgTDE2LDI2LjUgWiIgaWQ9InBhdGgtMSI+PC9wYXRoPgogICAgICAgIDxmaWx0ZXIgeD0iLTI4NC4wJSIgeT0iLTgxLjUlIiB3aWR0aD0iNjY4LjElIiBoZWlnaHQ9IjI5My45JSIgZmlsdGVyVW5pdHM9Im9iamVjdEJvdW5kaW5nQm94IiBpZD0iZmlsdGVyLTIiPgogICAgICAgICAgICA8ZmVNb3JwaG9sb2d5IHJhZGl1cz0iMSIgb3BlcmF0b3I9ImRpbGF0ZSIgaW49IlNvdXJjZUFscGhhIiByZXN1bHQ9InNoYWRvd1NwcmVhZE91dGVyMSI+PC9mZU1vcnBob2xvZ3k+CiAgICAgICAgICAgIDxmZU9mZnNldCBkeD0iMCIgZHk9IjIiIGluPSJzaGFkb3dTcHJlYWRPdXRlcjEiIHJlc3VsdD0ic2hhZG93T2Zmc2V0T3V0ZXIxIj48L2ZlT2Zmc2V0PgogICAgICAgICAgICA8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIzIiBpbj0ic2hhZG93T2Zmc2V0T3V0ZXIxIiByZXN1bHQ9InNoYWRvd0JsdXJPdXRlcjEiPjwvZmVHYXVzc2lhbkJsdXI+CiAgICAgICAgICAgIDxmZUNvbXBvc2l0ZSBpbj0ic2hhZG93Qmx1ck91dGVyMSIgaW4yPSJTb3VyY2VBbHBoYSIgb3BlcmF0b3I9Im91dCIgcmVzdWx0PSJzaGFkb3dCbHVyT3V0ZXIxIj48L2ZlQ29tcG9zaXRlPgogICAgICAgICAgICA8ZmVDb2xvck1hdHJpeCB2YWx1ZXM9IjAgMCAwIDAgMCAgIDAgMCAwIDAgMCAgIDAgMCAwIDAgMCAgMCAwIDAgMC4xNiAwIiB0eXBlPSJtYXRyaXgiIGluPSJzaGFkb3dCbHVyT3V0ZXIxIj48L2ZlQ29sb3JNYXRyaXg+CiAgICAgICAgPC9maWx0ZXI+CiAgICA8L2RlZnM+CiAgICA8ZyBpZD0i6aG16Z2iLTQiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxnIGlkPSJXaGl0ZWJvYXJkLUd1aWRlbGluZXMiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zODguMDAwMDAwLCAtNjcyLjAwMDAwMCkiPgogICAgICAgICAgICA8ZyBpZD0idGV4dC1jdXJzb3IiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDM5Mi4wMDAwMDAsIDY3Mi4wMDAwMDApIj4KICAgICAgICAgICAgICAgIDxyZWN0IGlkPSLnn6nlvaLlpIfku70tNDAiIGZpbGw9IiNGRkZGRkYiIG9wYWNpdHk9IjAuMDEiIHg9IjAiIHk9IjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcng9IjIiPjwvcmVjdD4KICAgICAgICAgICAgICAgIDxnIGlkPSLlvaLnirbnu5PlkIgiIGZpbGwtcnVsZT0ibm9uemVybyI+CiAgICAgICAgICAgICAgICAgICAgPHVzZSBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIxIiBmaWx0ZXI9InVybCgjZmlsdGVyLTIpIiB4bGluazpocmVmPSIjcGF0aC0xIj48L3VzZT4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMSIgZD0iTTE5LDI1IEwxOSwxNSBMMTYsMTUgQzE1LjQ0NzcxNTMsMTUgMTUsMTQuNTUyMjg0NyAxNSwxNCBDMTUsMTMuNTE0NTg5NyAxNS4zNDc5OTkzLDEzLjEwMTkxNSAxNS44NjU0ODc3LDEzLjAxMDA1MjEgTDE2LDEzIEwyNCwxMyBDMjQuNTUyMjg0NywxMyAyNSwxMy40NDc3MTUzIDI1LDE0IEMyNSwxNC40ODU0MTAzIDI0LjY1MjAwMDcsMTQuODk4MDg1IDI0LjEzNDUxMjMsMTQuOTg5OTQ3OSBMMjQsMTUgTDIxLDE1IEwyMSwyNSBMMjQsMjUgQzI0LjU1MjI4NDcsMjUgMjUsMjUuNDQ3NzE1MyAyNSwyNiBDMjUsMjYuNDg1NDEwMyAyNC42NTIwMDA3LDI2Ljg5ODA4NSAyNC4xMzQ1MTIzLDI2Ljk4OTk0NzkgTDI0LDI3IEwxNiwyNyBDMTUuNDQ3NzE1MywyNyAxNSwyNi41NTIyODQ3IDE1LDI2IEMxNSwyNS41MTQ1ODk3IDE1LjM0Nzk5OTMsMjUuMTAxOTE1IDE1Ljg2NTQ4NzcsMjUuMDEwMDUyMSBMMTYsMjUgTDE5LDI1IFoiIGZpbGw9IiMyMTIzMjQiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PC9wYXRoPgogICAgICAgICAgICAgICAgPC9nPgogICAgICAgICAgICA8L2c+CiAgICAgICAgPC9nPgogICAgPC9nPgo8L3N2Zz4=";
var laser = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMjhweCIgaGVpZ2h0PSIyOHB4IiB2aWV3Qm94PSIwIDAgMjggMjgiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDU1LjEgKDc4MTM2KSAtIGh0dHBzOi8vc2tldGNoYXBwLmNvbSAtLT4KICAgIDx0aXRsZT7nvJbnu4QgMjwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPgogICAgICAgIDxmaWx0ZXIgeD0iLTEyMC4wJSIgeT0iLTEyMC4wJSIgd2lkdGg9IjM0MC4wJSIgaGVpZ2h0PSIzNDAuMCUiIGZpbHRlclVuaXRzPSJvYmplY3RCb3VuZGluZ0JveCIgaWQ9ImZpbHRlci0xIj4KICAgICAgICAgICAgPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iNCIgaW49IlNvdXJjZUdyYXBoaWMiPjwvZmVHYXVzc2lhbkJsdXI+CiAgICAgICAgPC9maWx0ZXI+CiAgICA8L2RlZnM+CiAgICA8ZyBpZD0i6aG16Z2iMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9Iue8lue7hC0yIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg5LjAwMDAwMCwgOS4wMDAwMDApIiBmaWxsPSIjRkYwMTAwIj4KICAgICAgICAgICAgPGNpcmNsZSBpZD0i5qSt5ZyG5b2iIiBmaWx0ZXI9InVybCgjZmlsdGVyLTEpIiBjeD0iNSIgY3k9IjUiIHI9IjUiPjwvY2lyY2xlPgogICAgICAgICAgICA8cGF0aCBkPSJNNSw4IEM2LjY1Njg1NDI1LDggOCw2LjY1Njg1NDI1IDgsNSBDOCwzLjM0MzE0NTc1IDYuNjU2ODU0MjUsMiA1LDIgQzMuMzQzMTQ1NzUsMiAyLDMuMzQzMTQ1NzUgMiw1IEMyLDYuNjU2ODU0MjUgMy4zNDMxNDU3NSw4IDUsOCBaIE01LDYuMjg1NzE0MjkgQzQuMjg5OTE5NjEsNi4yODU3MTQyOSAzLjcxNDI4NTcxLDUuNzEwMDgwMzkgMy43MTQyODU3MSw1IEMzLjcxNDI4NTcxLDQuMjg5OTE5NjEgNC4yODk5MTk2MSwzLjcxNDI4NTcxIDUsMy43MTQyODU3MSBDNS43MTAwODAzOSwzLjcxNDI4NTcxIDYuMjg1NzE0MjksNC4yODk5MTk2MSA2LjI4NTcxNDI5LDUgQzYuMjg1NzE0MjksNS43MTAwODAzOSA1LjcxMDA4MDM5LDYuMjg1NzE0MjkgNSw2LjI4NTcxNDI5IFoiIGlkPSLmpK3lnIblvaIiIGZpbGwtcnVsZT0ibm9uemVybyI+PC9wYXRoPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+";
var pencilEraser1 = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMjYiIHZpZXdCb3g9IjAgMCAxOCAyNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMC41IiB5PSIwLjUiIHdpZHRoPSIxNyIgaGVpZ2h0PSIyNSIgcng9IjMuNSIgZmlsbD0iYmxhY2siIGZpbGwtb3BhY2l0eT0iMC4zNSIgc3Ryb2tlPSJ3aGl0ZSIvPgo8L3N2Zz4K";
var pencilEraser2 = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjYiIGhlaWdodD0iMzQiIHZpZXdCb3g9IjAgMCAyNiAzNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMC41IiB5PSIwLjUiIHdpZHRoPSIyNSIgaGVpZ2h0PSIzMyIgcng9IjMuNSIgZmlsbD0iYmxhY2siIGZpbGwtb3BhY2l0eT0iMC4zNSIgc3Ryb2tlPSJ3aGl0ZSIvPgo8L3N2Zz4K";
var pencilEraser3 = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzQiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCAzNCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMC41IiB5PSIwLjUiIHdpZHRoPSIzMyIgaGVpZ2h0PSI0OSIgcng9IjMuNSIgZmlsbD0iYmxhY2siIGZpbGwtb3BhY2l0eT0iMC4zNSIgc3Ryb2tlPSJ3aGl0ZSIvPgo8L3N2Zz4K";
const ApplianceMap = {
  [ApplianceNames.pencil]: pencil,
  [ApplianceNames.selector]: selector,
  [ApplianceNames.eraser]: eraser,
  [ApplianceNames.shape]: shape,
  [ApplianceNames.text]: text,
  [ApplianceNames.laserPointer]: laser,
  ["pencilEraser1"]: pencilEraser1,
  ["pencilEraser2"]: pencilEraser2,
  ["pencilEraser3"]: pencilEraser3
};
const LocalCursorSideEffectId = "local-cursor";
class CursorManager {
  constructor(manager, enableCursor, cursorOptions, applianceIcons) {
    var _a;
    this.manager = manager;
    this.enableCursor = enableCursor;
    this.cursorInstances = /* @__PURE__ */ new Map();
    this.userApplianceIcons = {};
    this.sideEffectManager = new o$2();
    this.store = this.manager.store;
    this.leaveFlag = true;
    this._style = "default";
    this.onCursorMove = (payload) => {
      const cursorInstance = this.initCursorInstance(payload.uid);
      if (payload.state === CursorState.Leave) {
        cursorInstance.leave();
      } else {
        const member = cursorInstance.updateMember();
        if (this.canMoveCursor(member)) {
          cursorInstance.move(payload.position);
        }
      }
    };
    this.initCursorInstance = (uid) => {
      let cursorInstance = this.cursorInstances.get(uid);
      if (!cursorInstance) {
        cursorInstance = new Cursor(this.manager, uid, this, WindowManager.wrapper);
        this.cursorInstances.set(uid, cursorInstance);
      }
      return cursorInstance;
    };
    this.mouseMoveListener_ = (event, isTouch) => {
      const type = this.getType(event);
      this.updateCursor(type, event.clientX, event.clientY);
      isTouch && this.showPencilEraserIfNeeded(type, event.clientX, event.clientY);
    };
    this.mouseMoveTimer = 0;
    this.mouseMoveListener = (event) => {
      const isTouch = event.pointerType === "touch";
      if (isTouch && !event.isPrimary)
        return;
      const now = Date.now();
      if (now - this.mouseMoveTimer > 48) {
        this.mouseMoveTimer = now;
        if (WindowManager.supportAppliancePlugin && isRoom(WindowManager.displayer) && WindowManager.displayer.disableDeviceInputs) {
          if (this.leaveFlag) {
            this.manager.dispatchInternalEvent(Events.CursorMove, {
              uid: this.manager.uid,
              state: CursorState.Leave
            });
            this.leaveFlag = false;
          }
          return;
        }
        this.mouseMoveListener_(event, isTouch);
        this.leaveFlag = true;
      }
    };
    this.mouseLeaveListener = () => {
      this.hideCursor(this.manager.uid);
    };
    this.getPoint = (view, clientX, clientY) => {
      var _a2;
      const rect = (_a2 = view == null ? void 0 : view.divElement) == null ? void 0 : _a2.getBoundingClientRect();
      if (rect) {
        const point = view == null ? void 0 : view.convertToPointInWorld({
          x: clientX - rect.x,
          y: clientY - rect.y
        });
        return point;
      }
    };
    this.getType = (event) => {
      var _a2;
      const target = event.target;
      const focusApp = this.manager.focusApp;
      switch (target.parentElement) {
        case this.mainViewElement: {
          return { type: "main" };
        }
        case ((_a2 = focusApp == null ? void 0 : focusApp.view) == null ? void 0 : _a2.divElement): {
          return { type: "app" };
        }
        default: {
          return { type: "main" };
        }
      }
    };
    this.roomMembers = (_a = this.manager.room) == null ? void 0 : _a.state.roomMembers;
    const wrapper = WindowManager.wrapper;
    if (wrapper) {
      this.setupWrapper(wrapper);
    }
    this.sideEffectManager.add(() => {
      return internalEmitter.on("cursorMove", this.onCursorMove);
    });
    this.sideEffectManager.add(() => {
      return internalEmitter.on("playgroundSizeChange", () => this.updateContainerRect());
    });
    const room = this.manager.room;
    if (room) {
      this.sideEffectManager.add(() => {
        const update2 = (state) => {
          if (this.style === "custom" && state.memberState)
            this.enableCustomCursor();
        };
        room.callbacks.on("onRoomStateChanged", update2);
        return () => room.callbacks.off("onRoomStateChanged", update2);
      });
    }
    if (applianceIcons) {
      this.userApplianceIcons = applianceIcons;
    }
    this.style = (cursorOptions == null ? void 0 : cursorOptions.style) || "default";
  }
  get applianceIcons() {
    return { ...ApplianceMap, ...this.userApplianceIcons };
  }
  get style() {
    return this._style;
  }
  set style(value) {
    if (this._style !== value) {
      this._style = value;
      this.cursorInstances.forEach((cursor) => {
        cursor.setStyle(value);
      });
      if (value === "custom") {
        this.enableCustomCursor();
      } else {
        this.sideEffectManager.flush(LocalCursorSideEffectId);
      }
    }
  }
  enableCustomCursor() {
    this.sideEffectManager.add(
      () => enableLocal(this.manager.getMemberState()),
      LocalCursorSideEffectId
    );
  }
  canMoveCursor(member) {
    const isLaserPointer = (member == null ? void 0 : member.memberState.currentApplianceName) === ApplianceNames.laserPointer;
    return this.enableCursor || isLaserPointer;
  }
  setupWrapper(wrapper) {
    this.sideEffectManager.add(() => {
      wrapper.addEventListener("pointerenter", this.mouseMoveListener);
      wrapper.addEventListener("pointermove", this.mouseMoveListener);
      wrapper.addEventListener("pointerleave", this.mouseLeaveListener);
      return () => {
        wrapper.removeEventListener("pointerenter", this.mouseMoveListener);
        wrapper.removeEventListener("pointermove", this.mouseMoveListener);
        wrapper.removeEventListener("pointerleave", this.mouseLeaveListener);
      };
    });
    this.wrapperRect = wrapper.getBoundingClientRect();
  }
  setMainViewDivElement(div) {
    this.mainViewElement = div;
  }
  get boxState() {
    return this.store.getBoxState();
  }
  get focusView() {
    var _a;
    return (_a = this.manager.focusApp) == null ? void 0 : _a.view;
  }
  showPencilEraserIfNeeded(event, clientX, clientY) {
    const self2 = findMemberByUid(this.manager.room, this.manager.uid);
    const isPencilEraser = (self2 == null ? void 0 : self2.memberState.currentApplianceName) === ApplianceNames.pencilEraser;
    if (this.wrapperRect && this.manager.canOperate && this.canMoveCursor(self2) && isPencilEraser) {
      const view = event.type === "main" ? this.manager.mainView : this.focusView;
      const point = this.getPoint(view, clientX, clientY);
      if (point) {
        this.onCursorMove({
          uid: this.manager.uid,
          position: {
            x: point.x,
            y: point.y,
            type: event.type
          }
        });
      }
    }
  }
  updateCursor(event, clientX, clientY) {
    const self2 = findMemberByUid(this.manager.room, this.manager.uid);
    if (this.wrapperRect && this.manager.canOperate && this.canMoveCursor(self2)) {
      const view = event.type === "main" ? this.manager.mainView : this.focusView;
      const point = this.getPoint(view, clientX, clientY);
      if (point) {
        this.manager.dispatchInternalEvent(Events.CursorMove, {
          uid: this.manager.uid,
          position: {
            x: point.x,
            y: point.y,
            type: event.type
          }
        });
      }
    }
  }
  updateContainerRect() {
    var _a, _b;
    this.containerRect = (_a = WindowManager.container) == null ? void 0 : _a.getBoundingClientRect();
    this.wrapperRect = (_b = WindowManager.wrapper) == null ? void 0 : _b.getBoundingClientRect();
  }
  deleteCursor(uid) {
    this.store.cleanCursor(uid);
    const cursor = this.cursorInstances.get(uid);
    if (cursor) {
      cursor.destroy();
    }
  }
  hideCursor(uid) {
    const cursor = this.cursorInstances.get(uid);
    if (cursor) {
      cursor.hide();
    }
  }
  destroy() {
    this.sideEffectManager.flushAll();
    if (this.cursorInstances.size) {
      this.cursorInstances.forEach((cursor) => {
        cursor.destroy();
      });
      this.cursorInstances.clear();
    }
  }
}
class PageStateImpl {
  constructor(manager) {
    this.manager = manager;
    internalEmitter.on("changePageState", () => {
      callbacks$1.emit("pageStateChange", this.toObject());
    });
  }
  get index() {
    return this.manager.store.getMainViewSceneIndex() || 0;
  }
  get length() {
    return this.manager.mainViewScenesLength || 0;
  }
  toObject() {
    const index2 = this.index >= this.length ? this.length - 1 : this.index;
    return {
      index: index2,
      length: this.length
    };
  }
}
class ReconnectRefresher {
  constructor(ctx) {
    this.ctx = ctx;
    this.reactors = /* @__PURE__ */ new Map();
    this.disposers = /* @__PURE__ */ new Map();
    this.onPhaseChanged = async (phase) => {
      var _a, _b;
      if (phase === RoomPhase.Reconnecting) {
        this.ctx.emitter.emit("startReconnect");
      }
      if (phase === RoomPhase.Connected && this.phase === RoomPhase.Reconnecting) {
        if ((_a = this.room) == null ? void 0 : _a.isWritable) {
          (_b = this.room) == null ? void 0 : _b.dispatchMagixEvent(EnsureReconnectEvent, {});
        } else {
          await wait(500);
          this.onReconnected();
        }
      }
      this.phase = phase;
    };
    this.onReconnected = debounce(() => {
      this._onReconnected();
    }, 1e3);
    this._onReconnected = () => {
      log("onReconnected refresh reactors");
      this.releaseDisposers();
      this.reactors.forEach((func, id2) => {
        if (isFunction(func)) {
          this.disposers.set(id2, func());
        }
      });
      this.ctx.emitter.emit("onReconnected");
    };
  }
  setRoom(room) {
    this.room = room;
    this.phase = room == null ? void 0 : room.phase;
    if (room) {
      room.callbacks.off("onPhaseChanged", this.onPhaseChanged);
      room.callbacks.on("onPhaseChanged", this.onPhaseChanged);
      room.addMagixEventListener(
        EnsureReconnectEvent,
        (payload) => {
          if (payload.authorId === room.observerId) {
            this.onReconnected();
          }
        },
        { fireSelfEventAfterCommit: true }
      );
    }
  }
  setContext(ctx) {
    this.ctx = ctx;
  }
  releaseDisposers() {
    this.disposers.forEach((disposer) => {
      if (isFunction(disposer)) {
        disposer();
      }
    });
    this.disposers.clear();
  }
  refresh() {
    this._onReconnected();
  }
  add(id2, func) {
    const disposer = this.disposers.get(id2);
    if (disposer && isFunction(disposer)) {
      disposer();
    }
    if (isFunction(func)) {
      this.reactors.set(id2, func);
      this.disposers.set(id2, func());
    }
  }
  remove(id2) {
    if (this.reactors.has(id2)) {
      this.reactors.delete(id2);
    }
    const disposer = this.disposers.get(id2);
    if (disposer) {
      if (isFunction(disposer)) {
        disposer();
      }
      this.disposers.delete(id2);
    }
  }
  hasReactor(id2) {
    return this.reactors.has(id2);
  }
  destroy() {
    var _a, _b;
    (_a = this.room) == null ? void 0 : _a.callbacks.off("onPhaseChanged", this.onPhaseChanged);
    (_b = this.room) == null ? void 0 : _b.removeMagixEventListener(EnsureReconnectEvent, this.onReconnected);
    this.releaseDisposers();
  }
}
const replaceRoomFunction = (room, manager) => {
  if (isPlayer(room)) {
    const player = room;
    delegateSeekToProgressTime(player);
  } else {
    room = room;
    const descriptor = Object.getOwnPropertyDescriptor(room, "disableCameraTransform");
    if (descriptor)
      return;
    Object.defineProperty(room, "disableCameraTransform", {
      get() {
        return manager.mainView.disableCameraTransform;
      },
      set(disable) {
        manager.mainView.disableCameraTransform = disable;
      }
    });
    Object.defineProperty(room, "canUndoSteps", {
      get() {
        return manager.canUndoSteps;
      }
    });
    Object.defineProperty(room, "canRedoSteps", {
      get() {
        return manager.canRedoSteps;
      }
    });
    room.moveCamera = (camera) => manager.moveCamera(camera);
    room.moveCameraToContain = (...args) => manager.moveCameraToContain(...args);
    room.convertToPointInWorld = (...args) => manager.mainView.convertToPointInWorld(...args);
    room.setCameraBound = (...args) => manager.mainView.setCameraBound(...args);
    room.scenePreview = (...args) => manager.mainView.scenePreview(...args);
    room.fillSceneSnapshot = (...args) => manager.mainView.fillSceneSnapshot(...args);
    room.generateScreenshot = (...args) => manager.mainView.generateScreenshot(...args);
    room.setMemberState = (...args) => manager.mainView.setMemberState(...args);
    room.redo = () => manager.redo();
    room.undo = () => manager.undo();
    room.cleanCurrentScene = () => manager.cleanCurrentScene();
    room.delete = () => manager.delete();
    room.copy = () => manager.copy();
    room.paste = () => manager.paste();
    room.duplicate = () => manager.duplicate();
    room.insertImage = (...args) => manager.insertImage(...args);
    room.completeImageUpload = (...args) => manager.completeImageUpload(...args);
    room.insertText = (...args) => manager.insertText(...args);
    room.lockImage = (...args) => manager.lockImage(...args);
    room.lockImages = (...args) => manager.lockImages(...args);
    delegateRemoveScenes(room, manager);
  }
};
const delegateRemoveScenes = (room, manager) => {
  const originRemoveScenes = room.removeScenes;
  room.removeScenes = (scenePath, index2) => {
    var _a;
    if (scenePath === ROOT_DIR) {
      (_a = manager.appManager) == null ? void 0 : _a.updateRootDirRemoving(true);
    }
    const result = originRemoveScenes.call(room, scenePath);
    internalEmitter.emit("removeScenes", { scenePath, index: index2 });
    return result;
  };
};
const delegateSeekToProgressTime = (player) => {
  const originSeek = player.seekToProgressTime;
  async function newSeek(time2) {
    await internalEmitter.emit("seekStart");
    const seekResult = await originSeek.call(player, time2);
    internalEmitter.emit("seek", time2);
    return seekResult;
  }
  player.seekToProgressTime = newSeek;
};
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a2, b2) => {
  for (var prop in b2 || (b2 = {}))
    if (__hasOwnProp.call(b2, prop))
      __defNormalProp(a2, prop, b2[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b2)) {
      if (__propIsEnum.call(b2, prop))
        __defNormalProp(a2, prop, b2[prop]);
    }
  return a2;
};
var __spreadProps = (a2, b2) => __defProps(a2, __getOwnPropDescs(b2));
var styles = /* @__PURE__ */ (() => ".netless-app-docs-viewer-content{position:relative;height:100%;overflow:hidden}.netless-app-docs-viewer-preview-mask{display:none;position:absolute;z-index:200;top:0;left:0;width:100%;height:100%}.netless-app-docs-viewer-preview{display:flex;flex-direction:column;align-items:center;z-index:300;top:0;right:0;width:23%;padding:12px;transform:translate(100%);box-shadow:-4.8px -3.2px 20px #20233826;transition:transform .4s;background:#f5f5fc;border-radius:4px;-webkit-box-shadow:-4.8px -3.2px 20px rgba(32,35,56,.15);height:100%;position:absolute;opacity:0}.netless-app-docs-viewer-preview-active .netless-app-docs-viewer-preview-mask{display:block}.netless-app-docs-viewer-preview-active .netless-app-docs-viewer-preview{transform:translate(0);opacity:1}.netless-app-docs-viewer-preview-head{display:flex;align-items:center;justify-content:space-between;width:100%;margin-bottom:10px}.netless-app-docs-viewer-preview-head>h3{color:#484c70;font-weight:400;font-size:14px;width:calc(100% - 20px);overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;white-space:nowrap}.netless-app-docs-viewer-preview-head .netless-app-docs-viewer-close{width:25px;height:25px;padding:0;outline:none;border:none;background:#fff;display:flex;justify-content:center;align-items:center;border-radius:100%;cursor:pointer}.netless-app-docs-viewer-preview-head .netless-app-docs-viewer-close button{width:22px;height:22px;padding:0;outline:none;border:none;background:center/cover no-repeat;background-image:url(./icons/close.svg)}.netless-app-docs-viewer-preview-page{position:relative;display:flex;width:100%;margin-bottom:10px;font-size:0;color:transparent;outline:none;border-radius:4px;transition:border-color .3s;user-select:none;align-items:flex-end}.netless-app-docs-viewer-preview-page>img{width:calc(90% - 10px);height:auto;box-sizing:border-box;border:2px solid rgba(0,0,0,.5);border-radius:2px;background-color:#fff}.netless-app-docs-viewer-preview-page>img.netless-app-docs-viewer-active{border-color:#ff5353}.netless-app-docs-viewer-preview-page-name{text-align:right;font-size:12px;color:#8d8fa6;user-select:none;margin-right:10px;width:5%}.netless-app-docs-viewer-footer{box-sizing:border-box;height:40px;display:flex;align-items:center;padding:0 16px;color:#191919;background:#ebecfa}.netless-app-docs-viewer-float-footer{width:100%;min-height:40px;position:absolute;left:0;bottom:0;z-index:2000;transition:opacity .4s;color:#191919}.netless-app-docs-viewer-footer-btn{box-sizing:border-box;width:26px;height:26px;font-size:0;margin:0;padding:3px;border:none;border-radius:4px;outline:none;color:currentColor;background:transparent;transition:background .4s;cursor:pointer;user-select:none;-webkit-tap-highlight-color:rgba(0,0,0,0);color:#8d8fa6}.netless-app-docs-viewer-footer-btn.netless-app-docs-viewer-footer-btn-disable{color:#c6c7d2;cursor:not-allowed}.netless-app-docs-viewer-footer-btn.netless-app-docs-viewer-footer-btn-disable .arrow{fill:#c6c7d2}.netless-app-docs-viewer-footer-btn .arrow{fill:#8d8fa6}.netless-app-docs-viewer-footer-btn:hover{background-color:#1b1f4d0a}@media (hover: none){.netless-app-docs-viewer-footer-btn:hover{background:transparent!important}}.netless-app-docs-viewer-footer-btn>svg{width:100%;height:100%}.netless-app-docs-viewer-footer-btn>svg:nth-of-type(2){display:none}.netless-app-docs-viewer-footer-btn.netless-app-docs-viewer-footer-btn-playing>svg:nth-of-type(1){display:none}.netless-app-docs-viewer-footer-btn.netless-app-docs-viewer-footer-btn-playing>svg:nth-of-type(2){display:initial}.netless-app-docs-viewer-hide{display:none}.netless-app-docs-viewer-page-jumps{flex:1;display:flex;justify-content:center;align-items:center;gap:8px}.netless-app-docs-viewer-page-number{font-size:14px;color:#8d8fa6;user-select:none;white-space:nowrap;word-break:keep-all}.netless-app-docs-viewer-page-number-input{border:none;outline:none;width:3em;margin:0;padding:0 2px;text-align:right;font-size:13px;line-height:1;font-weight:400;font-family:inherit;border-radius:2px;color:currentColor;background:transparent;transition:background .4s;user-select:text;-webkit-tap-highlight-color:rgba(0,0,0,0)}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-footer-btn{cursor:not-allowed}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-footer-btn:hover{background:transparent}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input{cursor:not-allowed}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input:hover,.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input:focus,.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input:active{background:transparent;box-shadow:none}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input:disabled{color:inherit}.netless-app-docs-viewer-readonly.netless-app-docs-viewer-float-footer{display:none}.telebox-color-scheme-dark .netless-app-docs-viewer-page-number-input{color:#a6a6a8}.telebox-color-scheme-dark .netless-app-docs-viewer-page-number-input:active,.telebox-color-scheme-dark .netless-app-docs-viewer-page-number-input:focus,.telebox-color-scheme-dark .netless-app-docs-viewer-page-number-input:hover{color:#222}.telebox-color-scheme-dark .netless-app-docs-viewer-footer{color:#a6a6a8;background:#2d2d33;border-top:none}.telebox-color-scheme-dark .netless-app-docs-viewer-footer-btn:hover{background:#212126}.telebox-color-scheme-dark .netless-app-docs-viewer-preview{background:rgba(50,50,50,.9)}.netless-app-docs-viewer-static-scrollbar{position:absolute;top:0;right:0;z-index:2147483647;width:8px;min-height:30px;margin:0;padding:0;border:none;outline:none;border-radius:4px;background:rgba(68,78,96,.4);box-shadow:1px 1px 8px #ffffffb3;opacity:0;transition:background .4s,opacity .4s 3s,transform .2s;user-select:none}.netless-app-docs-viewer-static-scrollbar.netless-app-docs-viewer-static-scrollbar-dragging{background:rgba(68,78,96,.6);opacity:1;transition:background .4s,opacity .4s 3s!important}.netless-app-docs-viewer-static-scrollbar:hover,.netless-app-docs-viewer-static-scrollbar:focus{background:rgba(68,78,96,.5)}.netless-app-docs-viewer-static-scrollbar:active{background:rgba(68,78,96,.6)}.netless-app-docs-viewer-content:hover .netless-app-docs-viewer-static-scrollbar{opacity:1;transition:background .4s,opacity .4s,transform .2s}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-static-scrollbar{display:none}.netless-app-docs-viewer-static-pages:hover .netless-app-docs-viewer-static-scrollbar{opacity:1;transition:background .4s,opacity .4s,transform .2s}.page-renderer-pages-container{position:relative;overflow:hidden}.page-renderer-page{position:absolute;top:0;left:0;background-position:center;background-size:cover;background-repeat:no-repeat}.page-renderer-pages-container.is-hwa .page-renderer-page{will-change:transform}.page-renderer-page-img{display:block;width:100%;height:auto;user-select:none}.netless-app-docs-viewer-static-pages{overflow:hidden;position:relative;height:100%;user-select:none}.netless-app-docs-viewer-static-page{display:block;width:100%;height:auto;user-select:none}.netless-app-docs-viewer-static-wb-view,.netless-app-docs-viewer-dynamic-wb-view{position:absolute;top:0;left:0;width:100%;height:100%;z-index:100;overflow:auto}.netless-app-docs-viewer-dynamic-wb-view .cursor-clicker .ppt-event-source{cursor:pointer}\n")();
const copyProperty = (to, from, property, ignoreNonConfigurable) => {
  if (property === "length" || property === "prototype") {
    return;
  }
  if (property === "arguments" || property === "caller") {
    return;
  }
  const toDescriptor = Object.getOwnPropertyDescriptor(to, property);
  const fromDescriptor = Object.getOwnPropertyDescriptor(from, property);
  if (!canCopyProperty(toDescriptor, fromDescriptor) && ignoreNonConfigurable) {
    return;
  }
  Object.defineProperty(to, property, fromDescriptor);
};
const canCopyProperty = function(toDescriptor, fromDescriptor) {
  return toDescriptor === void 0 || toDescriptor.configurable || toDescriptor.writable === fromDescriptor.writable && toDescriptor.enumerable === fromDescriptor.enumerable && toDescriptor.configurable === fromDescriptor.configurable && (toDescriptor.writable || toDescriptor.value === fromDescriptor.value);
};
const changePrototype = (to, from) => {
  const fromPrototype = Object.getPrototypeOf(from);
  if (fromPrototype === Object.getPrototypeOf(to)) {
    return;
  }
  Object.setPrototypeOf(to, fromPrototype);
};
const wrappedToString = (withName, fromBody) => `/* Wrapped ${withName}*/
${fromBody}`;
const toStringDescriptor = Object.getOwnPropertyDescriptor(Function.prototype, "toString");
const toStringName = Object.getOwnPropertyDescriptor(Function.prototype.toString, "name");
const changeToString = (to, from, name) => {
  const withName = name === "" ? "" : `with ${name.trim()}() `;
  const newToString = wrappedToString.bind(null, withName, from.toString());
  Object.defineProperty(newToString, "name", toStringName);
  Object.defineProperty(to, "toString", __spreadProps(__spreadValues({}, toStringDescriptor), { value: newToString }));
};
function mimicFunction(to, from, { ignoreNonConfigurable = false } = {}) {
  const { name } = to;
  for (const property of Reflect.ownKeys(from)) {
    copyProperty(to, from, property, ignoreNonConfigurable);
  }
  changePrototype(to, from);
  changeToString(to, from, name);
  return to;
}
const debounceFn = (inputFunction, options = {}) => {
  if (typeof inputFunction !== "function") {
    throw new TypeError(`Expected the first argument to be a function, got \`${typeof inputFunction}\``);
  }
  const {
    wait: wait2 = 0,
    maxWait = Number.Infinity,
    before = false,
    after = true
  } = options;
  if (!before && !after) {
    throw new Error("Both `before` and `after` are false, function wouldn't be called.");
  }
  let timeout;
  let maxTimeout;
  let result;
  const debouncedFunction = function(...arguments_) {
    const context = this;
    const later = () => {
      timeout = void 0;
      if (maxTimeout) {
        clearTimeout(maxTimeout);
        maxTimeout = void 0;
      }
      if (after) {
        result = inputFunction.apply(context, arguments_);
      }
    };
    const maxLater = () => {
      maxTimeout = void 0;
      if (timeout) {
        clearTimeout(timeout);
        timeout = void 0;
      }
      if (after) {
        result = inputFunction.apply(context, arguments_);
      }
    };
    const shouldCallNow = before && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait2);
    if (maxWait > 0 && maxWait !== Number.Infinity && !maxTimeout) {
      maxTimeout = setTimeout(maxLater, maxWait);
    }
    if (shouldCallNow) {
      result = inputFunction.apply(context, arguments_);
    }
    return result;
  };
  mimicFunction(debouncedFunction, inputFunction);
  debouncedFunction.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = void 0;
    }
    if (maxTimeout) {
      clearTimeout(maxTimeout);
      maxTimeout = void 0;
    }
  };
  return debouncedFunction;
};
const SOUP = "!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const SOUP_LEN = 87;
const ID_LEN = 20;
const reusedIdCarrier = [];
const genUID = () => {
  for (let i2 = 0; i2 < ID_LEN; i2++) {
    reusedIdCarrier[i2] = SOUP.charAt(Math.random() * SOUP_LEN);
  }
  return reusedIdCarrier.join("");
};
function invoke(fn) {
  try {
    return fn();
  } catch (e2) {
    console.error(e2);
  }
}
class SideEffectManager {
  constructor() {
    this.push = this.addDisposer;
    this.disposers = /* @__PURE__ */ new Map();
  }
  addDisposer(disposer, disposerID = this.genUID()) {
    this.flush(disposerID);
    this.disposers.set(disposerID, Array.isArray(disposer) ? joinDisposers(disposer) : disposer);
    return disposerID;
  }
  add(executor, disposerID = this.genUID()) {
    const disposers = executor();
    return disposers ? this.addDisposer(disposers, disposerID) : disposerID;
  }
  addEventListener(el, type, listener, options, disposerID = this.genUID()) {
    el.addEventListener(type, listener, options);
    this.addDisposer(() => el.removeEventListener(type, listener, options), disposerID);
    return disposerID;
  }
  setTimeout(handler, timeout, disposerID = this.genUID()) {
    const ticket = window.setTimeout(() => {
      this.remove(disposerID);
      handler();
    }, timeout);
    return this.addDisposer(() => window.clearTimeout(ticket), disposerID);
  }
  setInterval(handler, timeout, disposerID = this.genUID()) {
    const ticket = window.setInterval(handler, timeout);
    return this.addDisposer(() => window.clearInterval(ticket), disposerID);
  }
  remove(disposerID) {
    const disposer = this.disposers.get(disposerID);
    this.disposers.delete(disposerID);
    return disposer;
  }
  flush(disposerID) {
    const disposer = this.remove(disposerID);
    if (disposer) {
      disposer();
    }
  }
  flushAll() {
    this.disposers.forEach(invoke);
    this.disposers.clear();
  }
  genUID() {
    let uid;
    do {
      uid = genUID();
    } while (this.disposers.has(uid));
    return uid;
  }
}
function joinDisposers(disposers) {
  return () => disposers.forEach(invoke);
}
var resizeObservers = [];
var hasActiveObservations = function() {
  return resizeObservers.some(function(ro) {
    return ro.activeTargets.length > 0;
  });
};
var hasSkippedObservations = function() {
  return resizeObservers.some(function(ro) {
    return ro.skippedTargets.length > 0;
  });
};
var msg = "ResizeObserver loop completed with undelivered notifications.";
var deliverResizeLoopError = function() {
  var event;
  if (typeof ErrorEvent === "function") {
    event = new ErrorEvent("error", {
      message: msg
    });
  } else {
    event = document.createEvent("Event");
    event.initEvent("error", false, false);
    event.message = msg;
  }
  window.dispatchEvent(event);
};
var ResizeObserverBoxOptions;
(function(ResizeObserverBoxOptions2) {
  ResizeObserverBoxOptions2["BORDER_BOX"] = "border-box";
  ResizeObserverBoxOptions2["CONTENT_BOX"] = "content-box";
  ResizeObserverBoxOptions2["DEVICE_PIXEL_CONTENT_BOX"] = "device-pixel-content-box";
})(ResizeObserverBoxOptions || (ResizeObserverBoxOptions = {}));
var freeze = function(obj) {
  return Object.freeze(obj);
};
var ResizeObserverSize = function() {
  function ResizeObserverSize2(inlineSize, blockSize) {
    this.inlineSize = inlineSize;
    this.blockSize = blockSize;
    freeze(this);
  }
  return ResizeObserverSize2;
}();
var DOMRectReadOnly = function() {
  function DOMRectReadOnly2(x2, y2, width, height) {
    this.x = x2;
    this.y = y2;
    this.width = width;
    this.height = height;
    this.top = this.y;
    this.left = this.x;
    this.bottom = this.top + this.height;
    this.right = this.left + this.width;
    return freeze(this);
  }
  DOMRectReadOnly2.prototype.toJSON = function() {
    var _a = this, x2 = _a.x, y2 = _a.y, top = _a.top, right = _a.right, bottom = _a.bottom, left = _a.left, width = _a.width, height = _a.height;
    return { x: x2, y: y2, top, right, bottom, left, width, height };
  };
  DOMRectReadOnly2.fromRect = function(rectangle) {
    return new DOMRectReadOnly2(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
  };
  return DOMRectReadOnly2;
}();
var isSVG = function(target) {
  return target instanceof SVGElement && "getBBox" in target;
};
var isHidden = function(target) {
  if (isSVG(target)) {
    var _a = target.getBBox(), width = _a.width, height = _a.height;
    return !width && !height;
  }
  var _b = target, offsetWidth = _b.offsetWidth, offsetHeight = _b.offsetHeight;
  return !(offsetWidth || offsetHeight || target.getClientRects().length);
};
var isElement = function(obj) {
  var _a, _b;
  if (obj instanceof Element) {
    return true;
  }
  var scope = (_b = (_a = obj) === null || _a === void 0 ? void 0 : _a.ownerDocument) === null || _b === void 0 ? void 0 : _b.defaultView;
  return !!(scope && obj instanceof scope.Element);
};
var isReplacedElement = function(target) {
  switch (target.tagName) {
    case "INPUT":
      if (target.type !== "image") {
        break;
      }
    case "VIDEO":
    case "AUDIO":
    case "EMBED":
    case "OBJECT":
    case "CANVAS":
    case "IFRAME":
    case "IMG":
      return true;
  }
  return false;
};
var global$1 = typeof window !== "undefined" ? window : {};
var cache = /* @__PURE__ */ new WeakMap();
var scrollRegexp = /auto|scroll/;
var verticalRegexp = /^tb|vertical/;
var IE = /msie|trident/i.test(global$1.navigator && global$1.navigator.userAgent);
var parseDimension = function(pixel) {
  return parseFloat(pixel || "0");
};
var size = function(inlineSize, blockSize, switchSizes) {
  if (inlineSize === void 0) {
    inlineSize = 0;
  }
  if (blockSize === void 0) {
    blockSize = 0;
  }
  if (switchSizes === void 0) {
    switchSizes = false;
  }
  return new ResizeObserverSize((switchSizes ? blockSize : inlineSize) || 0, (switchSizes ? inlineSize : blockSize) || 0);
};
var zeroBoxes = freeze({
  devicePixelContentBoxSize: size(),
  borderBoxSize: size(),
  contentBoxSize: size(),
  contentRect: new DOMRectReadOnly(0, 0, 0, 0)
});
var calculateBoxSizes = function(target, forceRecalculation) {
  if (forceRecalculation === void 0) {
    forceRecalculation = false;
  }
  if (cache.has(target) && !forceRecalculation) {
    return cache.get(target);
  }
  if (isHidden(target)) {
    cache.set(target, zeroBoxes);
    return zeroBoxes;
  }
  var cs = getComputedStyle(target);
  var svg2 = isSVG(target) && target.ownerSVGElement && target.getBBox();
  var removePadding = !IE && cs.boxSizing === "border-box";
  var switchSizes = verticalRegexp.test(cs.writingMode || "");
  var canScrollVertically = !svg2 && scrollRegexp.test(cs.overflowY || "");
  var canScrollHorizontally = !svg2 && scrollRegexp.test(cs.overflowX || "");
  var paddingTop = svg2 ? 0 : parseDimension(cs.paddingTop);
  var paddingRight = svg2 ? 0 : parseDimension(cs.paddingRight);
  var paddingBottom = svg2 ? 0 : parseDimension(cs.paddingBottom);
  var paddingLeft = svg2 ? 0 : parseDimension(cs.paddingLeft);
  var borderTop = svg2 ? 0 : parseDimension(cs.borderTopWidth);
  var borderRight = svg2 ? 0 : parseDimension(cs.borderRightWidth);
  var borderBottom = svg2 ? 0 : parseDimension(cs.borderBottomWidth);
  var borderLeft = svg2 ? 0 : parseDimension(cs.borderLeftWidth);
  var horizontalPadding = paddingLeft + paddingRight;
  var verticalPadding = paddingTop + paddingBottom;
  var horizontalBorderArea = borderLeft + borderRight;
  var verticalBorderArea = borderTop + borderBottom;
  var horizontalScrollbarThickness = !canScrollHorizontally ? 0 : target.offsetHeight - verticalBorderArea - target.clientHeight;
  var verticalScrollbarThickness = !canScrollVertically ? 0 : target.offsetWidth - horizontalBorderArea - target.clientWidth;
  var widthReduction = removePadding ? horizontalPadding + horizontalBorderArea : 0;
  var heightReduction = removePadding ? verticalPadding + verticalBorderArea : 0;
  var contentWidth = svg2 ? svg2.width : parseDimension(cs.width) - widthReduction - verticalScrollbarThickness;
  var contentHeight = svg2 ? svg2.height : parseDimension(cs.height) - heightReduction - horizontalScrollbarThickness;
  var borderBoxWidth = contentWidth + horizontalPadding + verticalScrollbarThickness + horizontalBorderArea;
  var borderBoxHeight = contentHeight + verticalPadding + horizontalScrollbarThickness + verticalBorderArea;
  var boxes = freeze({
    devicePixelContentBoxSize: size(Math.round(contentWidth * devicePixelRatio), Math.round(contentHeight * devicePixelRatio), switchSizes),
    borderBoxSize: size(borderBoxWidth, borderBoxHeight, switchSizes),
    contentBoxSize: size(contentWidth, contentHeight, switchSizes),
    contentRect: new DOMRectReadOnly(paddingLeft, paddingTop, contentWidth, contentHeight)
  });
  cache.set(target, boxes);
  return boxes;
};
var calculateBoxSize = function(target, observedBox, forceRecalculation) {
  var _a = calculateBoxSizes(target, forceRecalculation), borderBoxSize = _a.borderBoxSize, contentBoxSize = _a.contentBoxSize, devicePixelContentBoxSize = _a.devicePixelContentBoxSize;
  switch (observedBox) {
    case ResizeObserverBoxOptions.DEVICE_PIXEL_CONTENT_BOX:
      return devicePixelContentBoxSize;
    case ResizeObserverBoxOptions.BORDER_BOX:
      return borderBoxSize;
    default:
      return contentBoxSize;
  }
};
var ResizeObserverEntry = function() {
  function ResizeObserverEntry2(target) {
    var boxes = calculateBoxSizes(target);
    this.target = target;
    this.contentRect = boxes.contentRect;
    this.borderBoxSize = freeze([boxes.borderBoxSize]);
    this.contentBoxSize = freeze([boxes.contentBoxSize]);
    this.devicePixelContentBoxSize = freeze([boxes.devicePixelContentBoxSize]);
  }
  return ResizeObserverEntry2;
}();
var calculateDepthForNode = function(node) {
  if (isHidden(node)) {
    return Infinity;
  }
  var depth = 0;
  var parent = node.parentNode;
  while (parent) {
    depth += 1;
    parent = parent.parentNode;
  }
  return depth;
};
var broadcastActiveObservations = function() {
  var shallowestDepth = Infinity;
  var callbacks2 = [];
  resizeObservers.forEach(function processObserver(ro) {
    if (ro.activeTargets.length === 0) {
      return;
    }
    var entries = [];
    ro.activeTargets.forEach(function processTarget(ot) {
      var entry = new ResizeObserverEntry(ot.target);
      var targetDepth = calculateDepthForNode(ot.target);
      entries.push(entry);
      ot.lastReportedSize = calculateBoxSize(ot.target, ot.observedBox);
      if (targetDepth < shallowestDepth) {
        shallowestDepth = targetDepth;
      }
    });
    callbacks2.push(function resizeObserverCallback() {
      ro.callback.call(ro.observer, entries, ro.observer);
    });
    ro.activeTargets.splice(0, ro.activeTargets.length);
  });
  for (var _i = 0, callbacks_1 = callbacks2; _i < callbacks_1.length; _i++) {
    var callback = callbacks_1[_i];
    callback();
  }
  return shallowestDepth;
};
var gatherActiveObservationsAtDepth = function(depth) {
  resizeObservers.forEach(function processObserver(ro) {
    ro.activeTargets.splice(0, ro.activeTargets.length);
    ro.skippedTargets.splice(0, ro.skippedTargets.length);
    ro.observationTargets.forEach(function processTarget(ot) {
      if (ot.isActive()) {
        if (calculateDepthForNode(ot.target) > depth) {
          ro.activeTargets.push(ot);
        } else {
          ro.skippedTargets.push(ot);
        }
      }
    });
  });
};
var process = function() {
  var depth = 0;
  gatherActiveObservationsAtDepth(depth);
  while (hasActiveObservations()) {
    depth = broadcastActiveObservations();
    gatherActiveObservationsAtDepth(depth);
  }
  if (hasSkippedObservations()) {
    deliverResizeLoopError();
  }
  return depth > 0;
};
var trigger;
var callbacks = [];
var notify = function() {
  return callbacks.splice(0).forEach(function(cb2) {
    return cb2();
  });
};
var queueMicroTask = function(callback) {
  if (!trigger) {
    var toggle_1 = 0;
    var el_1 = document.createTextNode("");
    var config = { characterData: true };
    new MutationObserver(function() {
      return notify();
    }).observe(el_1, config);
    trigger = function() {
      el_1.textContent = "" + (toggle_1 ? toggle_1-- : toggle_1++);
    };
  }
  callbacks.push(callback);
  trigger();
};
var queueResizeObserver = function(cb2) {
  queueMicroTask(function ResizeObserver2() {
    requestAnimationFrame(cb2);
  });
};
var watching = 0;
var isWatching = function() {
  return !!watching;
};
var CATCH_PERIOD = 250;
var observerConfig = { attributes: true, characterData: true, childList: true, subtree: true };
var events = [
  "resize",
  "load",
  "transitionend",
  "animationend",
  "animationstart",
  "animationiteration",
  "keyup",
  "keydown",
  "mouseup",
  "mousedown",
  "mouseover",
  "mouseout",
  "blur",
  "focus"
];
var time = function(timeout) {
  if (timeout === void 0) {
    timeout = 0;
  }
  return Date.now() + timeout;
};
var scheduled = false;
var Scheduler = function() {
  function Scheduler2() {
    var _this = this;
    this.stopped = true;
    this.listener = function() {
      return _this.schedule();
    };
  }
  Scheduler2.prototype.run = function(timeout) {
    var _this = this;
    if (timeout === void 0) {
      timeout = CATCH_PERIOD;
    }
    if (scheduled) {
      return;
    }
    scheduled = true;
    var until = time(timeout);
    queueResizeObserver(function() {
      var elementsHaveResized = false;
      try {
        elementsHaveResized = process();
      } finally {
        scheduled = false;
        timeout = until - time();
        if (!isWatching()) {
          return;
        }
        if (elementsHaveResized) {
          _this.run(1e3);
        } else if (timeout > 0) {
          _this.run(timeout);
        } else {
          _this.start();
        }
      }
    });
  };
  Scheduler2.prototype.schedule = function() {
    this.stop();
    this.run();
  };
  Scheduler2.prototype.observe = function() {
    var _this = this;
    var cb2 = function() {
      return _this.observer && _this.observer.observe(document.body, observerConfig);
    };
    document.body ? cb2() : global$1.addEventListener("DOMContentLoaded", cb2);
  };
  Scheduler2.prototype.start = function() {
    var _this = this;
    if (this.stopped) {
      this.stopped = false;
      this.observer = new MutationObserver(this.listener);
      this.observe();
      events.forEach(function(name) {
        return global$1.addEventListener(name, _this.listener, true);
      });
    }
  };
  Scheduler2.prototype.stop = function() {
    var _this = this;
    if (!this.stopped) {
      this.observer && this.observer.disconnect();
      events.forEach(function(name) {
        return global$1.removeEventListener(name, _this.listener, true);
      });
      this.stopped = true;
    }
  };
  return Scheduler2;
}();
var scheduler$1 = new Scheduler();
var updateCount = function(n2) {
  !watching && n2 > 0 && scheduler$1.start();
  watching += n2;
  !watching && scheduler$1.stop();
};
var skipNotifyOnElement = function(target) {
  return !isSVG(target) && !isReplacedElement(target) && getComputedStyle(target).display === "inline";
};
var ResizeObservation = function() {
  function ResizeObservation2(target, observedBox) {
    this.target = target;
    this.observedBox = observedBox || ResizeObserverBoxOptions.CONTENT_BOX;
    this.lastReportedSize = {
      inlineSize: 0,
      blockSize: 0
    };
  }
  ResizeObservation2.prototype.isActive = function() {
    var size2 = calculateBoxSize(this.target, this.observedBox, true);
    if (skipNotifyOnElement(this.target)) {
      this.lastReportedSize = size2;
    }
    if (this.lastReportedSize.inlineSize !== size2.inlineSize || this.lastReportedSize.blockSize !== size2.blockSize) {
      return true;
    }
    return false;
  };
  return ResizeObservation2;
}();
var ResizeObserverDetail = function() {
  function ResizeObserverDetail2(resizeObserver, callback) {
    this.activeTargets = [];
    this.skippedTargets = [];
    this.observationTargets = [];
    this.observer = resizeObserver;
    this.callback = callback;
  }
  return ResizeObserverDetail2;
}();
var observerMap = /* @__PURE__ */ new WeakMap();
var getObservationIndex = function(observationTargets, target) {
  for (var i2 = 0; i2 < observationTargets.length; i2 += 1) {
    if (observationTargets[i2].target === target) {
      return i2;
    }
  }
  return -1;
};
var ResizeObserverController = function() {
  function ResizeObserverController2() {
  }
  ResizeObserverController2.connect = function(resizeObserver, callback) {
    var detail = new ResizeObserverDetail(resizeObserver, callback);
    observerMap.set(resizeObserver, detail);
  };
  ResizeObserverController2.observe = function(resizeObserver, target, options) {
    var detail = observerMap.get(resizeObserver);
    var firstObservation = detail.observationTargets.length === 0;
    if (getObservationIndex(detail.observationTargets, target) < 0) {
      firstObservation && resizeObservers.push(detail);
      detail.observationTargets.push(new ResizeObservation(target, options && options.box));
      updateCount(1);
      scheduler$1.schedule();
    }
  };
  ResizeObserverController2.unobserve = function(resizeObserver, target) {
    var detail = observerMap.get(resizeObserver);
    var index2 = getObservationIndex(detail.observationTargets, target);
    var lastObservation = detail.observationTargets.length === 1;
    if (index2 >= 0) {
      lastObservation && resizeObservers.splice(resizeObservers.indexOf(detail), 1);
      detail.observationTargets.splice(index2, 1);
      updateCount(-1);
    }
  };
  ResizeObserverController2.disconnect = function(resizeObserver) {
    var _this = this;
    var detail = observerMap.get(resizeObserver);
    detail.observationTargets.slice().forEach(function(ot) {
      return _this.unobserve(resizeObserver, ot.target);
    });
    detail.activeTargets.splice(0, detail.activeTargets.length);
  };
  return ResizeObserverController2;
}();
var ResizeObserver$1 = function() {
  function ResizeObserver2(callback) {
    if (arguments.length === 0) {
      throw new TypeError("Failed to construct 'ResizeObserver': 1 argument required, but only 0 present.");
    }
    if (typeof callback !== "function") {
      throw new TypeError("Failed to construct 'ResizeObserver': The callback provided as parameter 1 is not a function.");
    }
    ResizeObserverController.connect(this, callback);
  }
  ResizeObserver2.prototype.observe = function(target, options) {
    if (arguments.length === 0) {
      throw new TypeError("Failed to execute 'observe' on 'ResizeObserver': 1 argument required, but only 0 present.");
    }
    if (!isElement(target)) {
      throw new TypeError("Failed to execute 'observe' on 'ResizeObserver': parameter 1 is not of type 'Element");
    }
    ResizeObserverController.observe(this, target, options);
  };
  ResizeObserver2.prototype.unobserve = function(target) {
    if (arguments.length === 0) {
      throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': 1 argument required, but only 0 present.");
    }
    if (!isElement(target)) {
      throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': parameter 1 is not of type 'Element");
    }
    ResizeObserverController.unobserve(this, target);
  };
  ResizeObserver2.prototype.disconnect = function() {
    ResizeObserverController.disconnect(this);
  };
  ResizeObserver2.toString = function() {
    return "function ResizeObserver () { [polyfill code] }";
  };
  return ResizeObserver2;
}();
function arrowLeftSVG(namespace) {
  const NS = "http://www.w3.org/2000/svg";
  const $svg = document.createElementNS(NS, "svg");
  $svg.setAttribute("class", `${namespace}-footer-icon-arrow-left`);
  $svg.setAttribute("viewBox", "0 0 20 20");
  $svg.innerHTML = `<g clip-path="url(#clip0_11800_99864)">
<path fill-rule="evenodd" clip-rule="evenodd" d="M11.5283 4.86182L12.4711 5.80463L8.22849 10.0473L12.4711 14.2899L11.5283 15.2327L6.34287 10.0473L11.5283 4.86182Z" class="arrow" />
</g>
<defs>
<clipPath id="clip0_11800_99864">
<rect width="16" height="16" fill="white" transform="translate(2 2)"/>
</clipPath>
</defs>`;
  return $svg;
}
function arrowRightSVG(namespace) {
  const NS = "http://www.w3.org/2000/svg";
  const $svg = document.createElementNS(NS, "svg");
  $svg.setAttribute("class", `${namespace}-footer-icon-arrow-right`);
  $svg.setAttribute("viewBox", "0 0 20 20");
  $svg.innerHTML = `<g clip-path="url(#clip0_11800_99870)">
<path fill-rule="evenodd" clip-rule="evenodd" d="M8.1377 4.86182L7.19489 5.80463L11.4375 10.0473L7.19489 14.2899L8.1377 15.2327L13.3231 10.0473L8.1377 4.86182Z" class="arrow" />
</g>
<defs>
<clipPath id="clip0_11800_99870">
<rect width="16" height="16" fill="white" transform="translate(2 2)"/>
</clipPath>
</defs>`;
  return $svg;
}
function playSVG(namespace) {
  const NS = "http://www.w3.org/2000/svg";
  const $svg = document.createElementNS(NS, "svg");
  $svg.setAttribute("class", `${namespace}-footer-icon-play`);
  $svg.setAttribute("viewBox", "0 0 500 500");
  const $path = document.createElementNS(NS, "path");
  $path.setAttribute("fill", "currentColor");
  $path.setAttribute("d", "M418.158 257.419L174.663 413.33c-6.017 3.919-15.708 3.772-21.291-.29-2.791-2.018-4.295-4.483-4.295-7.084V94.109c0-5.65 6.883-10.289 15.271-10.289 4.298 0 8.391 1.307 11.181 3.332l242.629 155.484c6.016 3.917 6.451 10.292.649 14.491-.216.154-.432.154-.649.292zM170.621 391.288l223.116-141.301L170.71 107.753l-.089 283.535z");
  $svg.appendChild($path);
  return $svg;
}
function pauseSVG(namespace) {
  const NS = "http://www.w3.org/2000/svg";
  const $svg = document.createElementNS(NS, "svg");
  $svg.setAttribute("class", `${namespace}-footer-icon-pause`);
  $svg.setAttribute("viewBox", "0 0 500 500");
  const $path = document.createElementNS(NS, "path");
  $path.setAttribute("fill", "currentColor");
  $path.setAttribute("d", "M312.491 78.261c0-6.159 4.893-11.213 11.04-11.213 6.158 0 11.211 5.054 11.211 11.213v343.478c0 6.159-5.053 11.213-11.211 11.213-6.147 0-11.04-5.054-11.04-11.213V78.261zM165.257 78.261c0-6.159 4.893-11.213 11.04-11.213 6.158 0 11.211 5.054 11.211 11.213v343.478c0 6.159-5.053 11.213-11.211 11.213-6.147 0-11.04-5.054-11.04-11.213V78.261z");
  $svg.appendChild($path);
  return $svg;
}
const runningOnBrowser = typeof window !== "undefined";
const isBot = runningOnBrowser && !("onscroll" in window) || typeof navigator !== "undefined" && /(gle|ing|ro)bot|crawl|spider/i.test(navigator.userAgent);
const supportsIntersectionObserver = runningOnBrowser && "IntersectionObserver" in window;
const supportsClassList = runningOnBrowser && "classList" in document.createElement("p");
const isHiDpi = runningOnBrowser && window.devicePixelRatio > 1;
const defaultSettings = {
  elements_selector: ".lazy",
  container: isBot || runningOnBrowser ? document : null,
  threshold: 300,
  thresholds: null,
  data_src: "src",
  data_srcset: "srcset",
  data_sizes: "sizes",
  data_bg: "bg",
  data_bg_hidpi: "bg-hidpi",
  data_bg_multi: "bg-multi",
  data_bg_multi_hidpi: "bg-multi-hidpi",
  data_bg_set: "bg-set",
  data_poster: "poster",
  class_applied: "applied",
  class_loading: "loading",
  class_loaded: "loaded",
  class_error: "error",
  class_entered: "entered",
  class_exited: "exited",
  unobserve_completed: true,
  unobserve_entered: false,
  cancel_on_exit: true,
  callback_enter: null,
  callback_exit: null,
  callback_applied: null,
  callback_loading: null,
  callback_loaded: null,
  callback_error: null,
  callback_finish: null,
  callback_cancel: null,
  use_native: false,
  restore_on_error: false
};
const getExtendedSettings = (customSettings) => {
  return Object.assign({}, defaultSettings, customSettings);
};
const createInstance = function(classObj, options) {
  let event;
  const eventString = "LazyLoad::Initialized";
  const instance2 = new classObj(options);
  try {
    event = new CustomEvent(eventString, { detail: { instance: instance2 } });
  } catch (err) {
    event = document.createEvent("CustomEvent");
    event.initCustomEvent(eventString, false, false, { instance: instance2 });
  }
  window.dispatchEvent(event);
};
const autoInitialize = (classObj, options) => {
  if (!options) {
    return;
  }
  if (!options.length) {
    createInstance(classObj, options);
  } else {
    for (let i2 = 0, optionsItem; optionsItem = options[i2]; i2 += 1) {
      createInstance(classObj, optionsItem);
    }
  }
};
const SRC = "src";
const SRCSET = "srcset";
const SIZES = "sizes";
const POSTER = "poster";
const ORIGINALS = "llOriginalAttrs";
const DATA = "data";
const statusLoading = "loading";
const statusLoaded = "loaded";
const statusApplied = "applied";
const statusEntered = "entered";
const statusError = "error";
const statusNative = "native";
const dataPrefix = "data-";
const statusDataName = "ll-status";
const getData = (element2, attribute) => {
  return element2.getAttribute(dataPrefix + attribute);
};
const setData = (element2, attribute, value) => {
  var attrName = dataPrefix + attribute;
  if (value === null) {
    element2.removeAttribute(attrName);
    return;
  }
  element2.setAttribute(attrName, value);
};
const getStatus = (element2) => getData(element2, statusDataName);
const setStatus = (element2, status) => setData(element2, statusDataName, status);
const resetStatus = (element2) => setStatus(element2, null);
const hasEmptyStatus = (element2) => getStatus(element2) === null;
const hasStatusLoading = (element2) => getStatus(element2) === statusLoading;
const hasStatusError = (element2) => getStatus(element2) === statusError;
const hasStatusNative = (element2) => getStatus(element2) === statusNative;
const statusesAfterLoading = [statusLoading, statusLoaded, statusApplied, statusError];
const hadStartedLoading = (element2) => statusesAfterLoading.indexOf(getStatus(element2)) >= 0;
const safeCallback = (callback, arg1, arg2, arg3) => {
  if (!callback) {
    return;
  }
  if (arg3 !== void 0) {
    callback(arg1, arg2, arg3);
    return;
  }
  if (arg2 !== void 0) {
    callback(arg1, arg2);
    return;
  }
  callback(arg1);
};
const addClass = (element2, className) => {
  if (supportsClassList) {
    element2.classList.add(className);
    return;
  }
  element2.className += (element2.className ? " " : "") + className;
};
const removeClass = (element2, className) => {
  if (supportsClassList) {
    element2.classList.remove(className);
    return;
  }
  element2.className = element2.className.replace(new RegExp("(^|\\s+)" + className + "(\\s+|$)"), " ").replace(/^\s+/, "").replace(/\s+$/, "");
};
const addTempImage = (element2) => {
  element2.llTempImage = document.createElement("IMG");
};
const deleteTempImage = (element2) => {
  delete element2.llTempImage;
};
const getTempImage = (element2) => element2.llTempImage;
const unobserve = (element2, instance2) => {
  if (!instance2)
    return;
  const observer = instance2._observer;
  if (!observer)
    return;
  observer.unobserve(element2);
};
const resetObserver = (observer) => {
  observer.disconnect();
};
const unobserveEntered = (element2, settings, instance2) => {
  if (settings.unobserve_entered)
    unobserve(element2, instance2);
};
const updateLoadingCount = (instance2, delta) => {
  if (!instance2)
    return;
  instance2.loadingCount += delta;
};
const decreaseToLoadCount = (instance2) => {
  if (!instance2)
    return;
  instance2.toLoadCount -= 1;
};
const setToLoadCount = (instance2, value) => {
  if (!instance2)
    return;
  instance2.toLoadCount = value;
};
const isSomethingLoading = (instance2) => instance2.loadingCount > 0;
const haveElementsToLoad = (instance2) => instance2.toLoadCount > 0;
const getSourceTags = (parentTag) => {
  let sourceTags = [];
  for (let i2 = 0, childTag; childTag = parentTag.children[i2]; i2 += 1) {
    if (childTag.tagName === "SOURCE") {
      sourceTags.push(childTag);
    }
  }
  return sourceTags;
};
const forEachPictureSource = (element2, fn) => {
  const parent = element2.parentNode;
  if (!parent || parent.tagName !== "PICTURE") {
    return;
  }
  let sourceTags = getSourceTags(parent);
  sourceTags.forEach(fn);
};
const forEachVideoSource = (element2, fn) => {
  let sourceTags = getSourceTags(element2);
  sourceTags.forEach(fn);
};
const attrsSrc = [SRC];
const attrsSrcPoster = [SRC, POSTER];
const attrsSrcSrcsetSizes = [SRC, SRCSET, SIZES];
const attrsData = [DATA];
const hasOriginalAttrs = (element2) => !!element2[ORIGINALS];
const getOriginalAttrs = (element2) => element2[ORIGINALS];
const deleteOriginalAttrs = (element2) => delete element2[ORIGINALS];
const setOriginalsObject = (element2, attributes) => {
  if (hasOriginalAttrs(element2)) {
    return;
  }
  const originals = {};
  attributes.forEach((attribute) => {
    originals[attribute] = element2.getAttribute(attribute);
  });
  element2[ORIGINALS] = originals;
};
const saveOriginalBackgroundStyle = (element2) => {
  if (hasOriginalAttrs(element2)) {
    return;
  }
  element2[ORIGINALS] = { backgroundImage: element2.style.backgroundImage };
};
const setOrResetAttribute = (element2, attrName, value) => {
  if (!value) {
    element2.removeAttribute(attrName);
    return;
  }
  element2.setAttribute(attrName, value);
};
const restoreOriginalAttrs = (element2, attributes) => {
  if (!hasOriginalAttrs(element2)) {
    return;
  }
  const originals = getOriginalAttrs(element2);
  attributes.forEach((attribute) => {
    setOrResetAttribute(element2, attribute, originals[attribute]);
  });
};
const restoreOriginalBgImage = (element2) => {
  if (!hasOriginalAttrs(element2)) {
    return;
  }
  const originals = getOriginalAttrs(element2);
  element2.style.backgroundImage = originals.backgroundImage;
};
const manageApplied = (element2, settings, instance2) => {
  addClass(element2, settings.class_applied);
  setStatus(element2, statusApplied);
  if (!instance2)
    return;
  if (settings.unobserve_completed) {
    unobserve(element2, settings);
  }
  safeCallback(settings.callback_applied, element2, instance2);
};
const manageLoading = (element2, settings, instance2) => {
  addClass(element2, settings.class_loading);
  setStatus(element2, statusLoading);
  if (!instance2)
    return;
  updateLoadingCount(instance2, 1);
  safeCallback(settings.callback_loading, element2, instance2);
};
const setAttributeIfValue = (element2, attrName, value) => {
  if (!value) {
    return;
  }
  element2.setAttribute(attrName, value);
};
const setImageAttributes = (element2, settings) => {
  setAttributeIfValue(element2, SIZES, getData(element2, settings.data_sizes));
  setAttributeIfValue(element2, SRCSET, getData(element2, settings.data_srcset));
  setAttributeIfValue(element2, SRC, getData(element2, settings.data_src));
};
const setSourcesImg = (imgEl, settings) => {
  forEachPictureSource(imgEl, (sourceTag) => {
    setOriginalsObject(sourceTag, attrsSrcSrcsetSizes);
    setImageAttributes(sourceTag, settings);
  });
  setOriginalsObject(imgEl, attrsSrcSrcsetSizes);
  setImageAttributes(imgEl, settings);
};
const setSourcesIframe = (iframe, settings) => {
  setOriginalsObject(iframe, attrsSrc);
  setAttributeIfValue(iframe, SRC, getData(iframe, settings.data_src));
};
const setSourcesVideo = (videoEl, settings) => {
  forEachVideoSource(videoEl, (sourceEl) => {
    setOriginalsObject(sourceEl, attrsSrc);
    setAttributeIfValue(sourceEl, SRC, getData(sourceEl, settings.data_src));
  });
  setOriginalsObject(videoEl, attrsSrcPoster);
  setAttributeIfValue(videoEl, POSTER, getData(videoEl, settings.data_poster));
  setAttributeIfValue(videoEl, SRC, getData(videoEl, settings.data_src));
  videoEl.load();
};
const setSourcesObject = (object, settings) => {
  setOriginalsObject(object, attrsData);
  setAttributeIfValue(object, DATA, getData(object, settings.data_src));
};
const setBackground = (element2, settings, instance2) => {
  const bg1xValue = getData(element2, settings.data_bg);
  const bgHiDpiValue = getData(element2, settings.data_bg_hidpi);
  const bgDataValue = isHiDpi && bgHiDpiValue ? bgHiDpiValue : bg1xValue;
  if (!bgDataValue)
    return;
  element2.style.backgroundImage = `url("${bgDataValue}")`;
  getTempImage(element2).setAttribute(SRC, bgDataValue);
  manageLoading(element2, settings, instance2);
};
const setMultiBackground = (element2, settings, instance2) => {
  const bg1xValue = getData(element2, settings.data_bg_multi);
  const bgHiDpiValue = getData(element2, settings.data_bg_multi_hidpi);
  const bgDataValue = isHiDpi && bgHiDpiValue ? bgHiDpiValue : bg1xValue;
  if (!bgDataValue) {
    return;
  }
  element2.style.backgroundImage = bgDataValue;
  manageApplied(element2, settings, instance2);
};
const setImgsetBackground = (element2, settings, instance2) => {
  const bgImgSetDataValue = getData(element2, settings.data_bg_set);
  if (!bgImgSetDataValue) {
    return;
  }
  const imgSetValues = bgImgSetDataValue.split("|");
  let bgImageValues = imgSetValues.map((value) => `image-set(${value})`);
  element2.style.backgroundImage = bgImageValues.join();
  if (element2.style.backgroundImage === "") {
    bgImageValues = imgSetValues.map((value) => `-webkit-image-set(${value})`);
    element2.style.backgroundImage = bgImageValues.join();
  }
  manageApplied(element2, settings, instance2);
};
const setSourcesFunctions = {
  IMG: setSourcesImg,
  IFRAME: setSourcesIframe,
  VIDEO: setSourcesVideo,
  OBJECT: setSourcesObject
};
const setSourcesNative = (element2, settings) => {
  const setSourcesFunction = setSourcesFunctions[element2.tagName];
  if (!setSourcesFunction) {
    return;
  }
  setSourcesFunction(element2, settings);
};
const setSources = (element2, settings, instance2) => {
  const setSourcesFunction = setSourcesFunctions[element2.tagName];
  if (!setSourcesFunction) {
    return;
  }
  setSourcesFunction(element2, settings);
  manageLoading(element2, settings, instance2);
};
const elementsWithLoadEvent = ["IMG", "IFRAME", "VIDEO", "OBJECT"];
const hasLoadEvent = (element2) => elementsWithLoadEvent.indexOf(element2.tagName) > -1;
const checkFinish = (settings, instance2) => {
  if (instance2 && !isSomethingLoading(instance2) && !haveElementsToLoad(instance2)) {
    safeCallback(settings.callback_finish, instance2);
  }
};
const addEventListener = (element2, eventName, handler) => {
  element2.addEventListener(eventName, handler);
  element2.llEvLisnrs[eventName] = handler;
};
const removeEventListener = (element2, eventName, handler) => {
  element2.removeEventListener(eventName, handler);
};
const hasEventListeners = (element2) => {
  return !!element2.llEvLisnrs;
};
const addEventListeners = (element2, loadHandler2, errorHandler2) => {
  if (!hasEventListeners(element2))
    element2.llEvLisnrs = {};
  const loadEventName = element2.tagName === "VIDEO" ? "loadeddata" : "load";
  addEventListener(element2, loadEventName, loadHandler2);
  addEventListener(element2, "error", errorHandler2);
};
const removeEventListeners = (element2) => {
  if (!hasEventListeners(element2)) {
    return;
  }
  const eventListeners = element2.llEvLisnrs;
  for (let eventName in eventListeners) {
    const handler = eventListeners[eventName];
    removeEventListener(element2, eventName, handler);
  }
  delete element2.llEvLisnrs;
};
const doneHandler = (element2, settings, instance2) => {
  deleteTempImage(element2);
  updateLoadingCount(instance2, -1);
  decreaseToLoadCount(instance2);
  removeClass(element2, settings.class_loading);
  if (settings.unobserve_completed) {
    unobserve(element2, instance2);
  }
};
const loadHandler = (event, element2, settings, instance2) => {
  const goingNative = hasStatusNative(element2);
  doneHandler(element2, settings, instance2);
  addClass(element2, settings.class_loaded);
  setStatus(element2, statusLoaded);
  safeCallback(settings.callback_loaded, element2, instance2);
  if (!goingNative)
    checkFinish(settings, instance2);
};
const errorHandler = (event, element2, settings, instance2) => {
  const goingNative = hasStatusNative(element2);
  doneHandler(element2, settings, instance2);
  addClass(element2, settings.class_error);
  setStatus(element2, statusError);
  safeCallback(settings.callback_error, element2, instance2);
  if (settings.restore_on_error)
    restoreOriginalAttrs(element2, attrsSrcSrcsetSizes);
  if (!goingNative)
    checkFinish(settings, instance2);
};
const addOneShotEventListeners = (element2, settings, instance2) => {
  const elementToListenTo = getTempImage(element2) || element2;
  if (hasEventListeners(elementToListenTo)) {
    return;
  }
  const _loadHandler = (event) => {
    loadHandler(event, element2, settings, instance2);
    removeEventListeners(elementToListenTo);
  };
  const _errorHandler = (event) => {
    errorHandler(event, element2, settings, instance2);
    removeEventListeners(elementToListenTo);
  };
  addEventListeners(elementToListenTo, _loadHandler, _errorHandler);
};
const loadBackground = (element2, settings, instance2) => {
  addTempImage(element2);
  addOneShotEventListeners(element2, settings, instance2);
  saveOriginalBackgroundStyle(element2);
  setBackground(element2, settings, instance2);
  setMultiBackground(element2, settings, instance2);
  setImgsetBackground(element2, settings, instance2);
};
const loadRegular = (element2, settings, instance2) => {
  addOneShotEventListeners(element2, settings, instance2);
  setSources(element2, settings, instance2);
};
const load = (element2, settings, instance2) => {
  if (hasLoadEvent(element2)) {
    loadRegular(element2, settings, instance2);
  } else {
    loadBackground(element2, settings, instance2);
  }
};
const loadNative = (element2, settings, instance2) => {
  element2.setAttribute("loading", "lazy");
  addOneShotEventListeners(element2, settings, instance2);
  setSourcesNative(element2, settings);
  setStatus(element2, statusNative);
};
const removeImageAttributes = (element2) => {
  element2.removeAttribute(SRC);
  element2.removeAttribute(SRCSET);
  element2.removeAttribute(SIZES);
};
const resetSourcesImg = (element2) => {
  forEachPictureSource(element2, (sourceTag) => {
    removeImageAttributes(sourceTag);
  });
  removeImageAttributes(element2);
};
const restoreImg = (imgEl) => {
  forEachPictureSource(imgEl, (sourceEl) => {
    restoreOriginalAttrs(sourceEl, attrsSrcSrcsetSizes);
  });
  restoreOriginalAttrs(imgEl, attrsSrcSrcsetSizes);
};
const restoreVideo = (videoEl) => {
  forEachVideoSource(videoEl, (sourceEl) => {
    restoreOriginalAttrs(sourceEl, attrsSrc);
  });
  restoreOriginalAttrs(videoEl, attrsSrcPoster);
  videoEl.load();
};
const restoreIframe = (iframeEl) => {
  restoreOriginalAttrs(iframeEl, attrsSrc);
};
const restoreObject = (objectEl) => {
  restoreOriginalAttrs(objectEl, attrsData);
};
const restoreFunctions = {
  IMG: restoreImg,
  IFRAME: restoreIframe,
  VIDEO: restoreVideo,
  OBJECT: restoreObject
};
const restoreAttributes = (element2) => {
  const restoreFunction = restoreFunctions[element2.tagName];
  if (!restoreFunction) {
    restoreOriginalBgImage(element2);
    return;
  }
  restoreFunction(element2);
};
const resetClasses = (element2, settings) => {
  if (hasEmptyStatus(element2) || hasStatusNative(element2)) {
    return;
  }
  removeClass(element2, settings.class_entered);
  removeClass(element2, settings.class_exited);
  removeClass(element2, settings.class_applied);
  removeClass(element2, settings.class_loading);
  removeClass(element2, settings.class_loaded);
  removeClass(element2, settings.class_error);
};
const restore = (element2, settings) => {
  restoreAttributes(element2);
  resetClasses(element2, settings);
  resetStatus(element2);
  deleteOriginalAttrs(element2);
};
const cancelLoading = (element2, entry, settings, instance2) => {
  if (!settings.cancel_on_exit)
    return;
  if (!hasStatusLoading(element2))
    return;
  if (element2.tagName !== "IMG")
    return;
  removeEventListeners(element2);
  resetSourcesImg(element2);
  restoreImg(element2);
  removeClass(element2, settings.class_loading);
  updateLoadingCount(instance2, -1);
  resetStatus(element2);
  safeCallback(settings.callback_cancel, element2, entry, instance2);
};
const onEnter = (element2, entry, settings, instance2) => {
  const dontLoad = hadStartedLoading(element2);
  setStatus(element2, statusEntered);
  addClass(element2, settings.class_entered);
  removeClass(element2, settings.class_exited);
  unobserveEntered(element2, settings, instance2);
  safeCallback(settings.callback_enter, element2, entry, instance2);
  if (dontLoad)
    return;
  load(element2, settings, instance2);
};
const onExit = (element2, entry, settings, instance2) => {
  if (hasEmptyStatus(element2))
    return;
  addClass(element2, settings.class_exited);
  cancelLoading(element2, entry, settings, instance2);
  safeCallback(settings.callback_exit, element2, entry, instance2);
};
const tagsWithNativeLazy = ["IMG", "IFRAME", "VIDEO"];
const shouldUseNative$1 = (settings) => settings.use_native && "loading" in HTMLImageElement.prototype;
const loadAllNative = (elements, settings, instance2) => {
  elements.forEach((element2) => {
    if (tagsWithNativeLazy.indexOf(element2.tagName) === -1) {
      return;
    }
    loadNative(element2, settings, instance2);
  });
  setToLoadCount(instance2, 0);
};
const isIntersecting = (entry) => entry.isIntersecting || entry.intersectionRatio > 0;
const getObserverSettings = (settings) => ({
  root: settings.container === document ? null : settings.container,
  rootMargin: settings.thresholds || settings.threshold + "px"
});
const intersectionHandler = (entries, settings, instance2) => {
  entries.forEach((entry) => isIntersecting(entry) ? onEnter(entry.target, entry, settings, instance2) : onExit(entry.target, entry, settings, instance2));
};
const observeElements = (observer, elements) => {
  elements.forEach((element2) => {
    observer.observe(element2);
  });
};
const updateObserver = (observer, elementsToObserve) => {
  resetObserver(observer);
  observeElements(observer, elementsToObserve);
};
const setObserver = (settings, instance2) => {
  if (!supportsIntersectionObserver || shouldUseNative$1(settings)) {
    return;
  }
  instance2._observer = new IntersectionObserver((entries) => {
    intersectionHandler(entries, settings, instance2);
  }, getObserverSettings(settings));
};
const toArray = (nodeSet) => Array.prototype.slice.call(nodeSet);
const queryElements = (settings) => settings.container.querySelectorAll(settings.elements_selector);
const excludeManagedElements = (elements) => toArray(elements).filter(hasEmptyStatus);
const hasError = (element2) => hasStatusError(element2);
const filterErrorElements = (elements) => toArray(elements).filter(hasError);
const getElementsToLoad = (elements, settings) => excludeManagedElements(elements || queryElements(settings));
const retryLazyLoad = (settings, instance2) => {
  const errorElements = filterErrorElements(queryElements(settings));
  errorElements.forEach((element2) => {
    removeClass(element2, settings.class_error);
    resetStatus(element2);
  });
  instance2.update();
};
const setOnlineCheck = (settings, instance2) => {
  if (!runningOnBrowser) {
    return;
  }
  instance2._onlineHandler = () => {
    retryLazyLoad(settings, instance2);
  };
  window.addEventListener("online", instance2._onlineHandler);
};
const resetOnlineCheck = (instance2) => {
  if (!runningOnBrowser) {
    return;
  }
  window.removeEventListener("online", instance2._onlineHandler);
};
const LazyLoad = function(customSettings, elements) {
  const settings = getExtendedSettings(customSettings);
  this._settings = settings;
  this.loadingCount = 0;
  setObserver(settings, this);
  setOnlineCheck(settings, this);
  this.update(elements);
};
LazyLoad.prototype = {
  update: function(givenNodeset) {
    const settings = this._settings;
    const elementsToLoad = getElementsToLoad(givenNodeset, settings);
    setToLoadCount(this, elementsToLoad.length);
    if (isBot || !supportsIntersectionObserver) {
      this.loadAll(elementsToLoad);
      return;
    }
    if (shouldUseNative$1(settings)) {
      loadAllNative(elementsToLoad, settings, this);
      return;
    }
    updateObserver(this._observer, elementsToLoad);
  },
  destroy: function() {
    if (this._observer) {
      this._observer.disconnect();
    }
    resetOnlineCheck(this);
    queryElements(this._settings).forEach((element2) => {
      deleteOriginalAttrs(element2);
    });
    delete this._observer;
    delete this._settings;
    delete this._onlineHandler;
    delete this.loadingCount;
    delete this.toLoadCount;
  },
  loadAll: function(elements) {
    const settings = this._settings;
    const elementsToLoad = getElementsToLoad(elements, settings);
    elementsToLoad.forEach((element2) => {
      unobserve(element2, this);
      load(element2, settings, this);
    });
  },
  restoreAll: function() {
    const settings = this._settings;
    queryElements(settings).forEach((element2) => {
      restore(element2, settings);
    });
  }
};
LazyLoad.load = (element2, customSettings) => {
  const settings = getExtendedSettings(customSettings);
  load(element2, settings);
};
LazyLoad.resetStatus = (element2) => {
  resetStatus(element2);
};
if (runningOnBrowser) {
  autoInitialize(LazyLoad, window.lazyLoadOptions);
}
class DocsViewer {
  constructor({ readonly, box, pages, onNewPageIndex, onPlay }) {
    this.pageIndex = 0;
    this.namespace = "netless-app-docs-viewer";
    this.isShowPreview = false;
    this.isSmallBox = false;
    this.sideEffect = new SideEffectManager();
    if (pages.length <= 0) {
      throw new Error("[DocsViewer] Empty pages.");
    }
    this.readonly = readonly;
    this.box = box;
    this.pages = pages;
    this.onNewPageIndex = onNewPageIndex;
    this.onPlay = onPlay;
    this.onPageIndexChanged = () => void 0;
    this.render();
  }
  mount() {
    this.box.mountContent(this.$content);
    this.box.mountFooter(this.$footer);
    this.sideEffect.add(() => {
      const previewLazyLoad = new LazyLoad({
        container: this.$preview,
        elements_selector: `.${this.wrapClassName("preview-page>img")}`
      });
      return () => previewLazyLoad.destroy();
    }, "preview-lazyload");
    this.box.events.on("maximized", (max) => {
      this.$footer.classList.toggle(this.wrapClassName("hide"), max);
    });
    this.$footer.classList.toggle(this.wrapClassName("hide"), this.box.maximized);
  }
  unmount() {
    this.$content.remove();
    this.$footer.remove();
  }
  setReadonly(readonly) {
    if (this.readonly !== readonly) {
      this.readonly = readonly;
      this.$content.classList.toggle(this.wrapClassName("readonly"), readonly);
      this.$footer.classList.toggle(this.wrapClassName("readonly"), readonly);
    }
  }
  destroy() {
    this.sideEffect.flushAll();
    this.unmount();
  }
  setPageIndex(pageIndex) {
    if (!Number.isNaN(pageIndex)) {
      this.scrollPreview(pageIndex);
      this.pageIndex = pageIndex;
      this.$pageNumberInput.textContent = String(pageIndex + 1);
      this.onPageIndexChanged(pageIndex);
      this.$btnPageBack.classList.toggle(this.wrapClassName("footer-btn-disable"), pageIndex == 0);
      this.$btnPageNext.classList.toggle(this.wrapClassName("footer-btn-disable"), pageIndex == this.pages.length - 1);
    }
  }
  scrollPreview(pageIndex) {
    var _a;
    const previews = (_a = this.$preview) == null ? void 0 : _a.querySelectorAll("." + this.wrapClassName("preview-page"));
    previews == null ? void 0 : previews.forEach((node, i2) => {
      var _a2;
      (_a2 = node.querySelector("img")) == null ? void 0 : _a2.classList.toggle(this.wrapClassName("active"), Number(pageIndex) == i2);
    });
    const imgNode = Array.prototype.slice.call(previews).find((node) => node.querySelector("img").className.includes(this.wrapClassName("active")));
    if (!imgNode)
      return;
    const parentRect = this.$preview.getBoundingClientRect();
    const elementRect = imgNode == null ? void 0 : imgNode.getBoundingClientRect();
    const isInView = elementRect.top >= parentRect.top && elementRect.bottom <= parentRect.bottom;
    if (!isInView) {
      this.$preview.scrollTo({
        top: imgNode.offsetTop - 16,
        behavior: this.isShowPreview ? "smooth" : "auto"
      });
    }
  }
  setSmallBox(isSmallBox) {
    if (this.isSmallBox !== isSmallBox) {
      this.isSmallBox = isSmallBox;
      this.$footer.classList.toggle(this.wrapClassName("float-footer"), isSmallBox);
    }
  }
  render() {
    this.renderContent();
    this.renderFooter();
    return this.$content;
  }
  renderContent() {
    if (!this.$content) {
      const $content = document.createElement("div");
      $content.className = this.wrapClassName("content");
      this.$content = $content;
      if (this.readonly) {
        $content.classList.add(this.wrapClassName("readonly"));
      }
      $content.appendChild(this.renderPreviewMask());
      $content.appendChild(this.renderPreview());
    }
    return this.$content;
  }
  renderPreview() {
    if (!this.$preview) {
      const $preview = document.createElement("div");
      $preview.className = this.wrapClassName("preview") + " tele-fancy-scrollbar";
      this.$preview = $preview;
      const title = document.createElement("div");
      title.className = this.wrapClassName("preview-head");
      const h3 = document.createElement("h3");
      h3.textContent = this.box.title;
      title.appendChild(h3);
      this.$preview.appendChild(title);
      const pageClassName = this.wrapClassName("preview-page");
      const pageNameClassName = this.wrapClassName("preview-page-name");
      this.pages.forEach((page, i2) => {
        var _a;
        const previewSRC = (_a = page.thumbnail) != null ? _a : page.src.startsWith("ppt") ? void 0 : page.src;
        if (!previewSRC) {
          return;
        }
        const pageIndex = String(i2);
        const $page = document.createElement("a");
        $page.className = pageClassName + " " + this.wrapClassName(`preview-page-${i2}`);
        $page.setAttribute("href", "#");
        $page.dataset.pageIndex = pageIndex;
        const $name = document.createElement("span");
        $name.className = pageNameClassName;
        $name.textContent = String(i2 + 1);
        $name.dataset.pageIndex = pageIndex;
        const $img = document.createElement("img");
        $img.width = page.width;
        $img.height = page.height;
        $img.dataset.src = previewSRC;
        $img.dataset.pageIndex = pageIndex;
        $page.appendChild($name);
        $page.appendChild($img);
        $preview.appendChild($page);
        $img.classList.toggle(this.wrapClassName("active"), this.pageIndex == i2);
      });
      this.sideEffect.addEventListener($preview, "click", (ev) => {
        var _a;
        if (this.readonly) {
          return;
        }
        const pageIndex = (_a = ev.target.dataset) == null ? void 0 : _a.pageIndex;
        if (pageIndex) {
          ev.preventDefault();
          ev.stopPropagation();
          ev.stopImmediatePropagation();
          this.onNewPageIndex(Number(pageIndex));
        }
      });
    }
    return this.$preview;
  }
  renderPreviewMask() {
    if (!this.$previewMask) {
      this.$previewMask = document.createElement("div");
      this.$previewMask.className = this.wrapClassName("preview-mask");
      this.sideEffect.addEventListener(this.$previewMask, "click", (ev) => {
        if (this.readonly) {
          return;
        }
        if (ev.target === this.$previewMask) {
          this.togglePreview(false);
        }
      });
    }
    return this.$previewMask;
  }
  renderFooter() {
    if (!this.$footer) {
      const $footer = document.createElement("div");
      $footer.className = this.wrapClassName("footer");
      this.$footer = $footer;
      if (this.readonly) {
        $footer.classList.add(this.wrapClassName("readonly"));
      }
      if (this.isSmallBox) {
        $footer.classList.add(this.wrapClassName("float-footer"));
      }
      if (this.pages.some((page) => page.thumbnail || !page.src.startsWith("ppt")))
        ;
      const $pageJumps = document.createElement("div");
      $pageJumps.className = this.wrapClassName("page-jumps");
      const $btnPageBack = this.renderFooterBtn("btn-page-back", arrowLeftSVG(this.namespace));
      this.sideEffect.addEventListener($btnPageBack, "click", () => {
        if (this.readonly) {
          return;
        }
        this.onNewPageIndex(this.pageIndex - 1);
      });
      $pageJumps.appendChild($btnPageBack);
      this.$btnPageBack = $btnPageBack;
      if (this.onPlay) {
        const $btnPlay = this.renderFooterBtn("btn-page-play", playSVG(this.namespace), pauseSVG(this.namespace));
        const returnPlay = () => {
          this.sideEffect.setTimeout(() => {
            $btnPlay.classList.toggle(this.wrapClassName("footer-btn-playing"), false);
          }, 500, "returnPlay");
        };
        this.sideEffect.addEventListener($btnPlay, "click", () => {
          var _a;
          if (this.readonly) {
            return;
          }
          $btnPlay.classList.toggle(this.wrapClassName("footer-btn-playing"), true);
          (_a = this.onPlay) == null ? void 0 : _a.call(this);
          returnPlay();
        });
        this.$footer.appendChild($btnPlay);
      }
      const $pageNumber = document.createElement("div");
      $pageNumber.className = this.wrapClassName("page-number");
      const $pageNumberInput = document.createElement("span");
      $pageNumberInput.className = this.wrapClassName("page-number-input");
      $pageNumberInput.textContent = String(this.pageIndex + 1);
      this.$pageNumberInput = $pageNumberInput;
      const $totalPage = document.createElement("span");
      $totalPage.textContent = " / " + this.pages.length;
      $pageNumber.appendChild($pageNumberInput);
      $pageNumber.appendChild($totalPage);
      $pageJumps.appendChild($pageNumber);
      const $btnPageNext = this.renderFooterBtn("btn-page-next", arrowRightSVG(this.namespace));
      this.sideEffect.addEventListener($btnPageNext, "click", () => {
        if (this.readonly) {
          return;
        }
        this.onNewPageIndex(this.pageIndex + 1);
      });
      $pageJumps.appendChild($btnPageNext);
      this.$btnPageNext = $btnPageNext;
      this.$footer.appendChild($pageJumps);
    }
    return this.$footer;
  }
  renderFooterBtn(className, $icon, $iconActive) {
    const $btn = document.createElement("button");
    $btn.className = this.wrapClassName("footer-btn") + " " + this.wrapClassName(className);
    $btn.appendChild($icon);
    if ($iconActive) {
      $btn.appendChild($iconActive);
    }
    return $btn;
  }
  togglePreview(isShowPreview) {
    this.isShowPreview = isShowPreview != null ? isShowPreview : !this.isShowPreview;
    this.$content.classList.toggle(this.wrapClassName("preview-active"), this.isShowPreview);
    if (this.isShowPreview) {
      const $previewPage = this.$preview.querySelector("." + this.wrapClassName(`preview-page-${this.pageIndex}`));
      if ($previewPage) {
        this.$preview.scrollTo({
          top: $previewPage.offsetTop - 16
        });
      }
    }
  }
  wrapClassName(className) {
    return `${this.namespace}-${className}`;
  }
}
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
function flattenEvent(ev) {
  return ev.touches ? ev.touches[0] : ev;
}
function preventEvent(ev) {
  ev.stopPropagation();
  if (ev.cancelable) {
    ev.preventDefault();
  }
}
function isEditable(el) {
  if (!el)
    return false;
  const tagName = el.tagName;
  return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
}
class Stepper {
  constructor(config) {
    var _a, _b, _c;
    this.velocity = 0;
    this.paused = true;
    this._animationFrameID = null;
    this._loopTimestamp = 0;
    this.looper = (timestamp) => {
      if (this.paused) {
        return;
      }
      let frames = Math.floor((timestamp - this._loopTimestamp) / 1e3 * 60) + 1;
      this._loopTimestamp = timestamp;
      while (frames-- > 0) {
        this.stepper();
      }
      this.onStep(this.current, this);
      if (!this.paused && this.current !== this.target) {
        window.requestAnimationFrame(this.looper);
      }
    };
    this.current = (_a = config.start) != null ? _a : 0;
    this.target = this.current;
    this.stiffness = (_b = config.stiffness) != null ? _b : 170;
    this.damping = (_c = config.damping) != null ? _c : 26;
    this.onStep = config.onStep;
  }
  stepTo(target, start) {
    if (this.paused && start != null) {
      this.current = start;
    }
    this.paused = false;
    this.target = target;
    this.onStep(this.current, this);
    this._loopTimestamp = Date.now();
    window.requestAnimationFrame(this.looper);
  }
  pause() {
    this.paused = true;
  }
  destroy() {
    this.pause();
  }
  stepper() {
    const fSpring = -this.stiffness * (this.current - this.target);
    const fDamper = -this.damping * this.velocity;
    const newVelocity = this.velocity + (fSpring + fDamper) / 60;
    const newCurrent = this.current + newVelocity / 60;
    if (Math.abs(newVelocity - 0) < 0.01 && Math.abs(newCurrent - this.target) < 0.01) {
      this.current = this.target;
      this.velocity = 0;
    } else {
      this.current = newCurrent;
      this.velocity = newVelocity;
    }
  }
}
class PageEl {
  constructor(index2, page, scale2, pagesIntrinsicWidth) {
    this.scale = 1;
    this.lastVisit = Date.now();
    this.pageOffsetY = 0;
    this.pageOffsetX = 0;
    this.visible = true;
    this.index = index2;
    this.page = page;
    this.scale = scale2;
    this.pageOffsetX = (pagesIntrinsicWidth - page.width) / 2;
    const $page = document.createElement("div");
    $page.className = "page-renderer-page";
    $page.dataset.index = `${index2}`;
    $page.style.width = `${page.width * scale2}px`;
    $page.style.height = `${page.height * scale2}px`;
    if (page.thumbnail) {
      $page.style.backgroundImage = `url("${page.thumbnail}")`;
    }
    const $img = document.createElement("img");
    $img.className = "page-renderer-page-img";
    $img.width = page.width;
    $img.height = page.height;
    $img.src = page.src;
    $page.appendChild($img);
    this.$page = $page;
  }
  translateY(pageOffsetY) {
    if (Math.abs(pageOffsetY - this.pageOffsetY) >= 1e-3) {
      this.pageOffsetY = pageOffsetY;
      this.$page.style.transform = `translate(${this.pageOffsetX * this.scale}px, ${this.pageOffsetY * this.scale}px)`;
    }
  }
  setScale(scale2) {
    if (Math.abs(scale2 - this.scale) >= 1e-3) {
      this.scale = scale2;
      this.$page.style.width = `${this.page.width * this.scale}px`;
      this.$page.style.height = `${this.page.height * this.scale}px`;
      this.$page.style.transform = `translate(${this.pageOffsetX * this.scale}px, ${this.pageOffsetY * this.scale}px)`;
    }
  }
  setVisible(visible) {
    if (visible !== this.visible) {
      this.visible = visible;
      this.$page.style.opacity = visible ? "1" : "0";
    }
  }
}
const schedule = window.requestIdleCallback || ((handler) => window.setTimeout(handler, 5e3));
const cancelSchedule = window.cancelIdleCallback || window.clearTimeout;
class PageElManager {
  constructor(pages, pagesIntrinsicWidth, scale2) {
    this.pages = pages;
    this.pagesIntrinsicWidth = pagesIntrinsicWidth;
    this.scale = scale2;
    this.els = /* @__PURE__ */ new Map();
    this.maxElCount = 200;
    this.gcTimer = null;
    this.gc = () => {
      this.gcTimer = null;
      if (this.els.size > this.maxElCount) {
        const sortedEls = [...this.els.values()].sort((x2, y2) => y2.lastVisit - x2.lastVisit);
        for (let i2 = Math.floor(this.maxElCount / 4); i2 < sortedEls.length; i2++) {
          this.els.delete(sortedEls[i2].index);
        }
      }
    };
  }
  getEl(index2) {
    let el = this.els.get(index2);
    if (!el) {
      el = new PageEl(index2, this.pages[index2], this.scale, this.pagesIntrinsicWidth);
      this.els.set(index2, el);
    }
    el.lastVisit = Date.now();
    if (this.els.size > this.maxElCount && this.gcTimer === null) {
      this.gcTimer = schedule(this.gc);
    }
    return el;
  }
  setScale(scale2) {
    if (scale2 !== this.scale) {
      this.scale = scale2;
      this.els.forEach((pageEl) => pageEl.setScale(scale2));
    }
  }
  destroy() {
    this.els.clear();
    if (this.gcTimer !== null) {
      cancelSchedule(this.gcTimer);
      this.gcTimer = null;
    }
  }
}
class PageRenderer {
  constructor(config) {
    this._hwaTimeout = NaN;
    this._turnOffHWA = () => {
      window.clearTimeout(this._hwaTimeout);
      this._hwaTimeout = NaN;
      this.$pages.classList.toggle("is-hwa", false);
    };
    this.pagesScrollTop = config.pagesScrollTop || 0;
    this.containerWidth = config.containerWidth || 1;
    this.containerHeight = config.containerHeight || 1;
    this.pages = config.pages.map((page) => {
      if (page.thumbnail) {
        return page;
      }
      try {
        const url = new URL(page.src);
        url.searchParams.set("x-oss-process", "image/resize,l_50");
        return __spreadProps(__spreadValues({}, page), { thumbnail: url.toString() });
      } catch (e2) {
        console.error(e2);
        return page;
      }
    });
    const pagesIntrinsicYs = Array(this.pages.length);
    let pagesMinHeight = Infinity;
    let pagesIntrinsicWidth = 0;
    this.pagesIntrinsicHeight = this.pages.reduce((pageY, page, i2) => {
      pagesIntrinsicYs[i2] = pageY;
      if (page.width > pagesIntrinsicWidth) {
        pagesIntrinsicWidth = page.width;
      }
      if (page.height <= pagesMinHeight) {
        pagesMinHeight = page.height;
      }
      return pageY + page.height;
    }, 0);
    this.pagesIntrinsicWidth = pagesIntrinsicWidth;
    this.pagesMinHeight = pagesMinHeight;
    this.pagesIntrinsicYs = pagesIntrinsicYs;
    this.scale = this._calcScale();
    this.threshold = this._calcThreshold();
    this.onPageIndexChanged = config.onPageIndexChanged;
    this.pageScrollIndex = 0;
    if (this.pagesScrollTop !== 0) {
      this.pageScrollIndex = this.findScrollPageIndex();
      if (this.onPageIndexChanged && this.pageScrollIndex > 0) {
        this.onPageIndexChanged(this.pageScrollIndex);
      }
    }
    this.pageElManager = new PageElManager(this.pages, pagesIntrinsicWidth, this.scale);
    this.$pages = this.renderPages();
  }
  setContainerSize(width, height) {
    if (width > 0 && height > 0) {
      if (width !== this.containerWidth || height !== this.containerHeight) {
        this.containerWidth = width;
        this.containerHeight = height;
        this.$pages.style.width = `${this.containerWidth}px`;
        this.$pages.style.height = `${this.containerHeight}px`;
        this.scale = this._calcScale();
        this.threshold = this._calcThreshold();
        this.pageElManager.setScale(this.scale);
        if (this.$pages.parentElement) {
          this.pagesScrollTo(this.pagesScrollTop, true);
        }
      }
    }
  }
  renderPages() {
    const $pages = document.createElement("div");
    $pages.className = "page-renderer-pages-container";
    $pages.style.width = `${this.containerWidth}px`;
    $pages.style.height = `${this.containerHeight}px`;
    return $pages;
  }
  pagesScrollTo(pagesScrollTop, force) {
    pagesScrollTop = clamp(pagesScrollTop, 0, this.pagesIntrinsicHeight - this.containerHeight / this.scale);
    if (force || Math.abs(pagesScrollTop - this.pagesScrollTop) >= 1e-3) {
      this._turnOnHWA();
      this.pagesScrollTop = pagesScrollTop;
      const pageScrollIndex = this.findScrollPageIndex();
      const startIndex = Math.max(pageScrollIndex - this.threshold, 0);
      const endIndex = Math.min(pageScrollIndex + this.threshold, this.pages.length - 1);
      for (let i2 = 0; i2 < this.$pages.children.length; i2++) {
        const $page = this.$pages.children[i2];
        const index2 = Number($page.dataset.index);
        if (!(index2 >= startIndex && index2 <= endIndex)) {
          $page.remove();
          i2--;
        }
      }
      for (let i2 = startIndex; i2 <= endIndex; i2++) {
        const pageEl = this.pageElManager.getEl(i2);
        if (pageEl.$page.parentElement !== this.$pages) {
          this.$pages.appendChild(pageEl.$page);
        }
        pageEl.translateY(this.pagesIntrinsicYs[i2] - this.pagesScrollTop);
      }
      if (pageScrollIndex !== this.pageScrollIndex) {
        this.pageScrollIndex = pageScrollIndex;
        if (this.onPageIndexChanged) {
          this.onPageIndexChanged(pageScrollIndex);
        }
      }
    }
  }
  findScrollPageIndex() {
    for (let i2 = 0; i2 < this.pagesIntrinsicYs.length; i2++) {
      if (this.pagesIntrinsicYs[i2] + this.pages[i2].height - this.pagesScrollTop >= 1e-3) {
        return i2;
      }
    }
    return this.pagesIntrinsicYs.length - 1;
  }
  mount($parent) {
    $parent.appendChild(this.$pages);
    this.pagesScrollTo(this.pagesScrollTop, true);
  }
  unmount() {
    this.$pages.remove();
  }
  destroy() {
    this.unmount();
    this.onPageIndexChanged = void 0;
    this.pageElManager.destroy();
    if (this._hwaTimeout) {
      window.clearTimeout(this._hwaTimeout);
      this._hwaTimeout = NaN;
    }
  }
  _calcScale() {
    return this.containerWidth / this.pagesIntrinsicWidth || 1;
  }
  _calcThreshold() {
    return clamp(Math.ceil(this.containerHeight / this.scale / this.pagesMinHeight / 2), 1, this.pages.length);
  }
  _turnOnHWA() {
    if (this._hwaTimeout) {
      window.clearTimeout(this._hwaTimeout);
    } else {
      this.$pages.classList.toggle("is-hwa", true);
    }
    this._hwaTimeout = window.setTimeout(this._turnOffHWA, 1e3);
  }
}
const SCROLLBAR_DEFAULT_MIN_HEIGHT = 30;
class ScrollBar {
  constructor(config) {
    this.sideEffect = new SideEffectManager();
    this.pagesScrollTop = config.pagesScrollTop || 0;
    this.containerWidth = config.containerWidth || 1;
    this.containerHeight = config.containerHeight || 1;
    this.pagesWidth = config.pagesWidth || 1;
    this.pagesHeight = config.pagesHeight || 1;
    this.scale = this._calcScale();
    this.scrollbarMinHeight = config.scrollbarMinHeight || SCROLLBAR_DEFAULT_MIN_HEIGHT;
    this.scrollbarHeight = this._calcScrollbarHeight();
    this.readonly = config.readonly;
    this.wrapClassName = config.wrapClassName;
    this.onDragScroll = config.onDragScroll;
    this.$scrollbar = this.renderScrollbar();
  }
  mount($parent) {
    $parent.appendChild(this.$scrollbar);
    this.pagesScrollTo(this.pagesScrollTop, true);
  }
  unmount() {
    this.$scrollbar.remove();
  }
  setReadonly(readonly) {
    this.readonly = readonly;
  }
  setContainerSize(width, height) {
    if (width > 0 && height > 0) {
      if (width !== this.containerWidth || height !== this.containerHeight) {
        this.containerWidth = width;
        this.containerHeight = height;
        this.scale = this._calcScale();
        this._updateScrollbarHeight();
        if (this.$scrollbar.parentElement) {
          this.pagesScrollTo(this.pagesScrollTop, true);
        }
      }
    }
  }
  pagesScrollTo(pagesScrollTop, force) {
    pagesScrollTop = clamp(pagesScrollTop, 0, this.pagesHeight - this.containerHeight / this.scale);
    if (force || Math.abs(pagesScrollTop - this.pagesScrollTop) >= 1e-3) {
      this.pagesScrollTop = pagesScrollTop;
      const elScrollTop = this.pagesScrollTop * this.scale;
      const elPagesHeight = this.pagesHeight * this.scale;
      const translateY = elScrollTop / (elPagesHeight - this.containerHeight) * (this.containerHeight - this.scrollbarHeight);
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(() => {
          this.$scrollbar.style.transform = `translateY(${translateY}px)`;
        });
      } else {
        this.$scrollbar.style.transform = `translateY(${translateY}px)`;
      }
    }
  }
  destroy() {
    this.unmount();
    this.onDragScroll = void 0;
    this.sideEffect.flushAll();
  }
  renderScrollbar() {
    const $scrollbar = document.createElement("button");
    $scrollbar.className = this.wrapClassName("scrollbar");
    $scrollbar.style.minHeight = `${this.scrollbarMinHeight}px`;
    $scrollbar.style.height = `${this.scrollbarHeight}px`;
    const trackStart = (ev) => {
      if (this.readonly) {
        return;
      }
      if (ev.button != null && ev.button !== 0) {
        return;
      }
      preventEvent(ev);
      const draggingClassName = this.wrapClassName("scrollbar-dragging");
      $scrollbar.classList.toggle(draggingClassName, true);
      const startTop = this.pagesScrollTop;
      const { clientY: startY } = flattenEvent(ev);
      const tracking = (ev2) => {
        if (this.readonly) {
          return;
        }
        const { clientY } = flattenEvent(ev2);
        const offsetY = (clientY - startY) / this.scale;
        if (Math.abs(offsetY) > 0 && this.onDragScroll) {
          this.onDragScroll(startTop + offsetY * (this.pagesHeight * this.scale / this.containerHeight));
        }
      };
      const trackEnd = () => {
        $scrollbar.classList.toggle(draggingClassName, false);
        window.removeEventListener("mousemove", tracking, true);
        window.removeEventListener("touchmove", tracking, true);
        window.removeEventListener("mouseup", trackEnd, true);
        window.removeEventListener("touchend", trackEnd, true);
        window.removeEventListener("touchcancel", trackEnd, true);
      };
      window.addEventListener("mousemove", tracking, true);
      window.addEventListener("touchmove", tracking, true);
      window.addEventListener("mouseup", trackEnd, true);
      window.addEventListener("touchend", trackEnd, true);
      window.addEventListener("touchcancel", trackEnd, true);
    };
    this.sideEffect.addEventListener($scrollbar, "mousedown", trackStart);
    this.sideEffect.addEventListener($scrollbar, "touchstart", trackStart);
    return $scrollbar;
  }
  _calcScale() {
    return this.containerWidth / this.pagesWidth || 1;
  }
  _calcScrollbarHeight() {
    return clamp(this.containerHeight / (this.pagesHeight * this.scale) * this.containerHeight, this.scrollbarMinHeight, this.containerHeight);
  }
  _updateScrollbarHeight() {
    const newHeight = this._calcScrollbarHeight();
    if (Math.abs(newHeight - this.scrollbarHeight) > 1e-3) {
      this.scrollbarHeight = newHeight;
      this.$scrollbar.style.height = `${newHeight}px`;
    }
  }
}
const ResizeObserver = window.ResizeObserver || ResizeObserver$1;
const RATIO_BASE_CONTAINER_HEIGHT = 640;
class StaticDocsViewer {
  constructor({
    context,
    whiteboardView,
    readonly,
    box,
    pages,
    pageScrollTop = 0,
    mountWhiteboard,
    onUserScroll,
    baseScenePath,
    appId
  }) {
    this.sideEffect = new SideEffectManager();
    this.userScrolling = false;
    this.onNewPageIndex = (index2) => {
      this.scrollToPage(index2);
    };
    this.toPdf = async () => {
      const whiteSnapshotCanvas = document.createElement("canvas");
      const whiteCtx = whiteSnapshotCanvas.getContext("2d");
      if (!whiteCtx || !this.baseScenePath) {
        this.reportProgress(100, null);
        return;
      }
      const scenePath = this.whiteboardView.focusScenePath || `${this.baseScenePath}/1`;
      const firstPage = this.pages[0];
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
        format: [firstPage.width, firstPage.height],
        orientation: firstPage.width > firstPage.height ? "l" : "p",
        compress: true
      });
      for (const [index2, page] of this.pages.entries()) {
        const { width, height, src } = page;
        whiteSnapshotCanvas.width = width;
        whiteSnapshotCanvas.height = height;
        const orientation = width > height ? "l" : "p";
        if (index2 > 0) {
          pdf.addPage([width, height], orientation);
        }
        const pdfPageSrc = await this.getBase64FromUrl(src);
        const img = document.createElement("img");
        img.src = pdfPageSrc;
        await new Promise((resolve) => img.onload = resolve);
        whiteCtx.drawImage(img, 0, 0);
        const pdfPageBase64 = whiteSnapshotCanvas.toDataURL("image/jpeg", 0.6);
        whiteCtx.clearRect(0, 0, width, height);
        const camera = {
          centerX: width / 2,
          centerY: height / 2 + index2 * height,
          scale: 1
        };
        const windowManger = this.context.manager.windowManger;
        if (windowManger._appliancePlugin) {
          await windowManger._appliancePlugin.screenshotToCanvasAsync(whiteCtx, scenePath, width, height, camera);
        } else {
          this.whiteboardView.screenshotToCanvas(whiteCtx, scenePath, width, height, camera);
        }
        const snapshot = whiteSnapshotCanvas.toDataURL("image/png");
        pdf.addImage(pdfPageBase64, "JPEG", 0, 0, width, height, "", "FAST");
        pdf.addImage(snapshot, "PNG", 0, 0, width, height, "", "FAST");
        whiteCtx.clearRect(0, 0, width, height);
        const progress = Math.ceil((index2 + 1) / this.pages.length * 100);
        if (progress < 100) {
          this.reportProgress(Math.ceil((index2 + 1) / this.pages.length * 100), null);
        }
      }
      const dataUrl = pdf.output("arraybuffer");
      this.reportProgress(100, { pdf: dataUrl, title: this.box.title });
    };
    this.context = context;
    this.whiteboardView = whiteboardView;
    this.readonly = readonly;
    this.box = box;
    this.pages = pages;
    this.baseScenePath = baseScenePath;
    this.appId = appId;
    this.mountWhiteboard = mountWhiteboard;
    this._onUserScroll = onUserScroll;
    const debouncedOnUserScroll = this.debounce(() => {
      this.userScrolling = false;
      if (this._onUserScroll) {
        this._onUserScroll(this.pageRenderer.pagesScrollTop);
      }
    }, { wait: 80 }, "debounce-updateUserScroll");
    this.updateUserScroll = () => {
      this.userScrolling = true;
      debouncedOnUserScroll();
    };
    this.viewer = new DocsViewer({
      readonly,
      box,
      pages,
      onNewPageIndex: this.onNewPageIndex
    });
    const { width: containerWidth, height: containerHeight } = this.whiteboardView.size;
    this.pageRenderer = new PageRenderer({
      pagesScrollTop: pageScrollTop,
      pages: this.pages,
      containerWidth,
      containerHeight,
      onPageIndexChanged: this.viewer.setPageIndex.bind(this.viewer)
    });
    this.scrollbar = new ScrollBar({
      pagesScrollTop: this.pageRenderer.pagesScrollTop,
      containerWidth,
      containerHeight,
      pagesWidth: this.pageRenderer.pagesIntrinsicWidth,
      pagesHeight: this.pageRenderer.pagesIntrinsicHeight,
      readonly: this.readonly,
      wrapClassName: this.wrapClassName.bind(this),
      onDragScroll: (pageScrollTop2) => {
        this.pageScrollTo(pageScrollTop2);
        this.updateUserScroll();
      }
    });
    this.pageScrollStepper = new Stepper({
      start: this.pageRenderer.pagesScrollTop,
      onStep: (pageScrollTop2) => {
        this.pageScrollTo(pageScrollTop2);
      }
    });
    this.render();
  }
  mount() {
    this.viewer.mount();
    this.setupScrollListener();
    const debouncedRenderRatioHeight = this.debounce(this.renderRatioHeight.bind(this), {
      wait: 80
    });
    this.sideEffect.add(() => {
      const observer = new ResizeObserver(debouncedRenderRatioHeight);
      observer.observe(this.viewer.$content);
      return () => observer.disconnect();
    });
    this.sideEffect.setTimeout(() => {
      if (!this.userScrolling) {
        this.pageScrollTo(this.pageRenderer.pagesScrollTop);
      }
    }, 100);
    this.sideEffect.add(() => {
      const handleDownloadPdf = (evt) => {
        if (evt.data.type === "@netless/_request_save_pdf_" && evt.data.appId === this.appId) {
          this.toPdf().catch(() => this.reportProgress(100, null));
        }
      };
      window.addEventListener("message", handleDownloadPdf);
      return () => {
        window.removeEventListener("message", handleDownloadPdf);
      };
    });
    return this;
  }
  unmount() {
    this.viewer.unmount();
    return this;
  }
  setReadonly(readonly) {
    if (this.readonly !== readonly) {
      this.readonly = readonly;
      this.viewer.setReadonly(readonly);
      this.scrollbar.setReadonly(readonly);
    }
  }
  destroy() {
    this.sideEffect.flushAll();
    this.pageScrollStepper.destroy();
    this._onUserScroll = void 0;
    this.unmount();
    this.viewer.destroy();
    this.pageRenderer.destroy();
    this.scrollbar.destroy();
  }
  syncPageScrollTop(pageScrollTop) {
    if (!this.userScrolling && pageScrollTop >= 0 && Math.abs(this.pageRenderer.pagesScrollTop - pageScrollTop) > 0.01) {
      this.pageScrollStepper.stepTo(pageScrollTop, this.pageRenderer.pagesScrollTop);
    }
  }
  render() {
    this.pageRenderer.mount(this.viewer.$content);
    this.viewer.$content.appendChild(this.renderWhiteboardView());
    this.scrollbar.mount(this.viewer.$content);
    this.renderRatioHeight();
  }
  renderRatioHeight() {
    const boxHeight = this.box.absoluteHeight;
    const isSmallBox = boxHeight <= RATIO_BASE_CONTAINER_HEIGHT;
    this.viewer.setSmallBox(isSmallBox);
    if (isSmallBox) {
      const titleBarSupposedHeight = 26 / RATIO_BASE_CONTAINER_HEIGHT;
      const titleBarActualHeight = 26 / boxHeight;
      const footerSupposedHeight = 26 / RATIO_BASE_CONTAINER_HEIGHT;
      const footerActualHeight = 0;
      const emptySpace = Math.max((titleBarSupposedHeight + footerSupposedHeight - (titleBarActualHeight + footerActualHeight)) / 2, 0);
      if (this.box.$titleBar) {
        const titleBarHeight = titleBarActualHeight + emptySpace;
        this.box.$titleBar.style.height = `${titleBarHeight * 100}%`;
      }
      if (this.box.$footer) {
        const footerHeight = footerActualHeight + emptySpace;
        this.box.$footer.style.height = `${footerHeight * 100}%`;
      }
    } else {
      if (this.box.$titleBar) {
        const titleBarHeight = Math.max(26 / RATIO_BASE_CONTAINER_HEIGHT, 26 / boxHeight);
        this.box.$titleBar.style.height = `${titleBarHeight * 100}%`;
      }
      if (this.box.$footer) {
        const footerHeight = Math.max(26 / RATIO_BASE_CONTAINER_HEIGHT, 26 / boxHeight);
        this.box.$footer.style.height = `${footerHeight * 100}%`;
      }
    }
  }
  renderWhiteboardView() {
    if (!this.$whiteboardView) {
      this.$whiteboardView = document.createElement("div");
      this.$whiteboardView.className = this.wrapClassName("wb-view");
      this.mountWhiteboard(this.$whiteboardView);
      this.sideEffect.addEventListener(this.$whiteboardView, "wheel", (ev) => {
        preventEvent(ev);
        if (!this.readonly) {
          this.pageScrollTo(this.pageRenderer.pagesScrollTop + ev.deltaY);
          this.updateUserScroll();
        }
      }, { passive: false, capture: true });
      this.sideEffect.addEventListener(this.$whiteboardView, "touchmove", (ev) => {
        if (this.readonly || ev.touches.length <= 1) {
          return;
        }
        this.updateUserScroll();
      }, { passive: true, capture: true });
    }
    return this.$whiteboardView;
  }
  scrollTopPageToEl(pageScrollTop) {
    return pageScrollTop * this.pageRenderer.scale;
  }
  scrollTopElToPage(elScrollTop) {
    return elScrollTop / this.pageRenderer.scale;
  }
  elScrollTo(elScrollTop) {
    this.pageScrollTo(this.scrollTopElToPage(elScrollTop));
  }
  pageScrollTo(pageScrollTop) {
    const halfWbHeight = this.scrollTopElToPage(this.whiteboardView.size.height / 2);
    this.whiteboardView.moveCamera({
      centerY: clamp(pageScrollTop + halfWbHeight, halfWbHeight, this.pageRenderer.pagesIntrinsicHeight - halfWbHeight),
      animationMode: "immediately"
    });
  }
  scrollToPage(index2) {
    if (!this.readonly && !Number.isNaN(index2)) {
      const offsetY = this.pageRenderer.pagesIntrinsicYs[index2];
      if (offsetY >= 0) {
        this.pageScrollTo(offsetY + 5 / this.pageRenderer.scale);
        this.updateUserScroll();
      }
    }
  }
  setupScrollListener() {
    this.sideEffect.add(() => {
      const handleCameraUpdate = (camera) => {
        const { width: wbWidth, height: wbHeight } = this.whiteboardView.size;
        if (wbWidth <= 0 || wbHeight <= 0) {
          return;
        }
        const pagesScrollTop = camera.centerY - this.pageRenderer.containerHeight / this.pageRenderer.scale / 2;
        this.pageRenderer.pagesScrollTo(pagesScrollTop);
        this.scrollbar.pagesScrollTo(pagesScrollTop);
      };
      this.whiteboardView.callbacks.on("onCameraUpdated", handleCameraUpdate);
      return () => this.whiteboardView.callbacks.off("onCameraUpdated", handleCameraUpdate);
    });
    this.sideEffect.add(() => {
      const { updateUserScroll } = this;
      this.whiteboardView.callbacks.on("onCameraUpdatedByDevice", updateUserScroll);
      return () => this.whiteboardView.callbacks.off("onCameraUpdatedByDevice", updateUserScroll);
    });
    this.sideEffect.add(() => {
      const handleSizeUpdate = ({ width: wbWidth, height: wbHeight }) => {
        if (wbWidth <= 0 || wbHeight <= 0) {
          return;
        }
        this.pageRenderer.setContainerSize(wbWidth, wbHeight);
        this.scrollbar.setContainerSize(wbWidth, wbHeight);
        const { pagesIntrinsicWidth, pagesIntrinsicHeight } = this.pageRenderer;
        this.whiteboardView.moveCameraToContain({
          originX: 0,
          originY: this.pageRenderer.pagesScrollTop,
          width: pagesIntrinsicWidth,
          height: wbHeight / this.pageRenderer.scale,
          animationMode: "immediately"
        });
        this.whiteboardView.setCameraBound({
          damping: 1,
          maxContentMode: () => this.pageRenderer.scale,
          minContentMode: () => this.pageRenderer.scale,
          centerX: pagesIntrinsicWidth / 2,
          centerY: pagesIntrinsicHeight / 2,
          width: pagesIntrinsicWidth,
          height: pagesIntrinsicHeight
        });
      };
      this.whiteboardView.callbacks.on("onSizeUpdated", handleSizeUpdate);
      return () => {
        this.whiteboardView.callbacks.off("onSizeUpdated", handleSizeUpdate);
      };
    }, "whiteboard-size-update");
    this.sideEffect.addEventListener(window, "keyup", (ev) => {
      if (this.readonly || !this.box.focus || this.box.minimized || isEditable(ev.target)) {
        return;
      }
      let newPageScrollTop = null;
      switch (ev.key) {
        case "PageDown": {
          newPageScrollTop = this.pageRenderer.pagesScrollTop + this.pageRenderer.containerHeight / this.pageRenderer.scale;
          break;
        }
        case "PageUp": {
          newPageScrollTop = this.pageRenderer.pagesScrollTop - this.pageRenderer.containerHeight / this.pageRenderer.scale;
          break;
        }
        case "ArrowDown": {
          newPageScrollTop = this.pageRenderer.pagesScrollTop + this.pageRenderer.containerHeight / 4 / this.pageRenderer.scale;
          break;
        }
        case "ArrowUp": {
          newPageScrollTop = this.pageRenderer.pagesScrollTop - this.pageRenderer.containerHeight / 4 / this.pageRenderer.scale;
          break;
        }
      }
      if (newPageScrollTop !== null) {
        if (this._onUserScroll) {
          this._onUserScroll(newPageScrollTop);
        } else {
          this.pageScrollTo(newPageScrollTop);
          this.updateUserScroll();
        }
      }
    }, { capture: true });
  }
  debounce(fn, options, disposerID) {
    const dFn = debounceFn(fn, options);
    this.sideEffect.addDisposer(() => dFn.cancel(), disposerID);
    return dFn;
  }
  wrapClassName(className) {
    return "netless-app-docs-viewer-static-" + className;
  }
  async getBase64FromUrl(url) {
    const data = await fetch(this._invalidate(url));
    const blob = await data.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result;
        resolve(base64data);
      };
    });
  }
  _invalidate(url) {
    try {
      const a2 = new URL(url);
      a2.searchParams.set("t", Date.now().toString());
      return a2.toString();
    } catch {
      return url;
    }
  }
  reportProgress(progress, result) {
    window.postMessage({
      type: "@netless/_result_save_pdf_",
      appId: this.appId,
      progress,
      result
    });
  }
}
class DynamicDocsViewer {
  constructor({ context, whiteboardView, box, pages }) {
    this.sideEffect = new SideEffectManager();
    this.onPlayPPT = () => {
      const room = this.context.getRoom();
      if (room) {
        room.pptNextStep();
      }
    };
    this._scaleDocsToFitImpl = () => {
      const page = this.pages[this.getPageIndex()];
      if (page) {
        this.whiteboardView.moveCameraToContain({
          originX: -page.width / 2,
          originY: -page.height / 2,
          width: page.width,
          height: page.height,
          animationMode: "immediately"
        });
        this.whiteboardView.setCameraBound({
          damping: 1,
          maxContentMode: () => this.whiteboardView.camera.scale,
          minContentMode: () => this.whiteboardView.camera.scale,
          centerX: 0,
          centerY: 0,
          width: page.width,
          height: page.height
        });
      }
    };
    this._scaleDocsToFitDebounced = () => {
      this.sideEffect.setTimeout(this._scaleDocsToFitImpl, 1e3, "_scaleDocsToFitDebounced");
    };
    this.scaleDocsToFit = () => {
      this._scaleDocsToFitImpl();
      this._scaleDocsToFitDebounced();
    };
    this.onNewPageIndex = (index2) => {
      this.jumpToPage(index2, true);
    };
    this.context = context;
    this.whiteboardView = whiteboardView;
    this.box = box;
    this.pages = pages;
    this.displayer = context.getDisplayer();
    this.viewer = new DocsViewer({
      readonly: !context.getIsWritable(),
      box,
      pages,
      onNewPageIndex: this.onNewPageIndex,
      onPlay: this.onPlayPPT
    });
    this.render();
    this.sideEffect.add(() => {
      const handler = (isWritable) => {
        this.viewer.setReadonly(!isWritable);
      };
      this.context.emitter.on("writableChange", handler);
      return () => this.context.emitter.off("writableChange", handler);
    });
    this.sideEffect.add(() => {
      const handler = (sceneState) => {
        this.jumpToPage(sceneState.index);
      };
      this.context.emitter.on("sceneStateChange", handler);
      return () => this.context.emitter.off("sceneStateChange", handler);
    });
    this.sideEffect.add(() => {
      const handler = (pageState) => {
        this.jumpToPage(pageState.index);
      };
      this.context.emitter.on("pageStateChange", handler);
      return () => this.context.emitter.off("pageStateChange", handler);
    });
    this.sideEffect.add(() => {
      const handler = (visible) => {
        this.viewer.togglePreview(visible);
      };
      this.context.emitter.on("togglePreview", handler);
      return () => this.context.emitter.off("togglePreview", handler);
    });
  }
  mount() {
    this.viewer.mount();
    const pageIndex = this.getPageIndex();
    if (pageIndex !== 0) {
      this.jumpToPage(pageIndex);
    }
    this.scaleDocsToFit();
    this.sideEffect.add(() => {
      this.whiteboardView.callbacks.on("onSizeUpdated", this.scaleDocsToFit);
      return () => {
        this.whiteboardView.callbacks.off("onSizeUpdated", this.scaleDocsToFit);
      };
    });
    return this;
  }
  unmount() {
    this.viewer.unmount();
    return this;
  }
  destroy() {
    this.sideEffect.flushAll();
    this.unmount();
    this.viewer.destroy();
  }
  getPageIndex() {
    return this.displayer.state.sceneState.index;
  }
  jumpToPage(index2, reset) {
    var _a, _b;
    index2 = clamp(index2, 0, this.pages.length - 1);
    if (index2 !== this.getPageIndex()) {
      if (this.context.getIsWritable()) {
        const initScenePath = this.context.getInitScenePath();
        const scene = (_b = (_a = this.context.getScenes()) == null ? void 0 : _a[index2]) == null ? void 0 : _b.name;
        if (initScenePath && scene) {
          this.context.setScenePath(`${initScenePath}/${scene}`);
        }
        this.scaleDocsToFit();
      }
    }
    if (index2 !== this.viewer.pageIndex) {
      this.viewer.setPageIndex(index2);
    }
    if (reset) {
      const room = this.context.getRoom();
      if (room) {
        const pptState = room.state.globalState.__pptState;
        room.setGlobalState({
          __pptState: pptState && {
            uuid: pptState.uuid,
            pageIndex: index2,
            disableAutoPlay: pptState.disableAutoPlay
          }
        });
      }
    }
  }
  render() {
    this.viewer.$content.appendChild(this.renderMask());
    this.viewer.$content.appendChild(this.renderWhiteboardView());
    this.sideEffect.addEventListener(window, "keydown", (ev) => {
      var _a;
      if (this.box.focus && !isEditable(ev.target)) {
        switch (ev.key) {
          case "ArrowUp":
          case "ArrowLeft": {
            this.jumpToPage(this.getPageIndex() - 1, true);
            break;
          }
          case "ArrowRight":
          case "ArrowDown": {
            (_a = this.context.getRoom()) == null ? void 0 : _a.pptNextStep();
            break;
          }
        }
      }
    });
  }
  renderMask() {
    if (!this.$mask) {
      const $mask = document.createElement("div");
      $mask.className = this.wrapClassName("mask");
      this.$mask = $mask;
      const $back = document.createElement("button");
      $back.className = this.wrapClassName("back");
      const $next = document.createElement("button");
      $next.className = this.wrapClassName("next");
    }
    return this.$mask;
  }
  renderWhiteboardView() {
    if (!this.$whiteboardView) {
      this.$whiteboardView = document.createElement("div");
      this.$whiteboardView.className = this.wrapClassName("wb-view");
      this.sideEffect.addEventListener(this.$whiteboardView, "click", (ev) => {
        var _a;
        const room = this.context.getRoom();
        if (room && room.state.memberState.currentApplianceName === "clicker") {
          for (let el = ev.target; el; el = el.parentElement) {
            if ((_a = el.classList) == null ? void 0 : _a.contains("ppt-event-source")) {
              return;
            }
          }
          room.pptNextStep();
        }
      });
      this.context.mountView(this.$whiteboardView);
    }
    return this.$whiteboardView;
  }
  wrapClassName(className) {
    return "netless-app-docs-viewer-dynamic-" + className;
  }
}
const kind = "DocsViewer";
const NetlessAppDocsViewer = {
  kind,
  setup(context) {
    const box = context.getBox();
    const scenes = context.getScenes();
    if (!scenes) {
      throw new Error("[Docs Viewer]: scenes not found.");
    }
    const whiteboardView = context.getView();
    console.log(context.storage.state);
    if (!whiteboardView) {
      throw new Error("[Docs Viewer]: no whiteboard view.");
    }
    const pages = scenes.map(({ ppt }) => ppt ? {
      width: ppt.width,
      height: ppt.height,
      src: ppt.src,
      thumbnail: ppt.previewURL
    } : null).filter((page) => Boolean(page));
    if (pages.length <= 0) {
      throw new Error("[Docs Viewer]: empty scenes.");
    }
    box.mountStyles(styles);
    if (pages[0].src.startsWith("ppt")) {
      return setupDynamicDocsViewer(context, whiteboardView, box, pages);
    } else {
      return setupStaticDocsViewer(context, whiteboardView, box, pages);
    }
  }
};
function setupStaticDocsViewer(context, whiteboardView, box, pages) {
  var _a;
  whiteboardView.disableCameraTransform = !context.getIsWritable();
  const docsViewer = new StaticDocsViewer({
    context,
    whiteboardView,
    readonly: !context.getIsWritable(),
    box,
    pages,
    pageScrollTop: (_a = context.getAttributes()) == null ? void 0 : _a.pageScrollTop,
    mountWhiteboard: context.mountView.bind(context),
    onUserScroll: (pageScrollTop) => {
      var _a2;
      if (((_a2 = context.getAttributes()) == null ? void 0 : _a2.pageScrollTop) !== pageScrollTop && !box.readonly) {
        context.updateAttributes(["pageScrollTop"], pageScrollTop);
      }
    },
    baseScenePath: context.getInitScenePath(),
    appId: context.appId
  }).mount();
  docsViewer.viewer.onPageIndexChanged = (index2) => {
    context.dispatchAppEvent("pageStateChange", { index: index2, length: pages.length });
  };
  context.dispatchAppEvent("pageStateChange", {
    index: docsViewer.viewer.pageIndex,
    length: pages.length
  });
  context.emitter.on("attributesUpdate", (attributes) => {
    if (attributes) {
      if (attributes.pageScrollTop != null) {
        docsViewer.syncPageScrollTop(attributes.pageScrollTop);
      }
    }
  });
  context.emitter.on("writableChange", (isWritable) => {
    docsViewer.setReadonly(!isWritable);
    whiteboardView.disableCameraTransform = !isWritable;
  });
  return {
    viewer: () => {
      return docsViewer;
    },
    position: () => {
      const controller = docsViewer == null ? void 0 : docsViewer.viewer;
      if (controller) {
        return [controller.pageIndex, docsViewer.pages.length];
      }
    }
  };
}
function setupDynamicDocsViewer(context, whiteboardView, box, pages) {
  whiteboardView.disableCameraTransform = true;
  const docsViewer = new DynamicDocsViewer({
    context,
    whiteboardView,
    box,
    pages
  }).mount();
  docsViewer.viewer.onPageIndexChanged = (index2) => {
    context.dispatchAppEvent("pageStateChange", { index: index2, length: pages.length });
  };
  context.dispatchAppEvent("pageStateChange", {
    index: docsViewer.getPageIndex(),
    length: pages.length
  });
  context.mountView(docsViewer.$whiteboardView);
  if (context.isAddApp) {
    whiteboardView.callbacks.once("onSizeUpdated", ({ width: contentWidth, height: contentHeight }) => {
      if (pages.length > 0 && box.state !== "maximized") {
        const { width: pageWidth, height: pageHeight } = pages[0];
        const preferHeight = pageHeight / pageWidth * contentWidth;
        const diff = preferHeight - contentHeight;
        if (diff !== 0 && context.getIsWritable()) {
          context.emitter.emit("setBoxSize", {
            width: box.width,
            height: box.height + diff / box.containerRect.height
          });
        }
      }
    });
  }
  return {
    viewer: () => {
      return docsViewer;
    },
    position: () => {
      const controller = docsViewer == null ? void 0 : docsViewer.viewer;
      if (controller) {
        return [controller.pageIndex, docsViewer.pages.length];
      }
    },
    nextStep: () => {
      return docsViewer.onPlayPPT();
    },
    nextPage: () => {
      return docsViewer.jumpToPage(docsViewer.getPageIndex() + 1, true);
    },
    prevPage: () => {
      return docsViewer.jumpToPage(docsViewer.getPageIndex() + 1, true);
    },
    jumpToPage: (pageIndex) => {
      if (typeof pageIndex == "number") {
        docsViewer.jumpToPage(pageIndex, true);
      }
    },
    togglePreview: (visible) => {
      docsViewer.viewer.togglePreview(visible);
    }
  };
}
var react = { exports: {} };
var react_production_min = {};
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;
function toObject(val) {
  if (val === null || val === void 0) {
    throw new TypeError("Object.assign cannot be called with null or undefined");
  }
  return Object(val);
}
function shouldUseNative() {
  try {
    if (!Object.assign) {
      return false;
    }
    var test1 = new String("abc");
    test1[5] = "de";
    if (Object.getOwnPropertyNames(test1)[0] === "5") {
      return false;
    }
    var test2 = {};
    for (var i2 = 0; i2 < 10; i2++) {
      test2["_" + String.fromCharCode(i2)] = i2;
    }
    var order2 = Object.getOwnPropertyNames(test2).map(function(n2) {
      return test2[n2];
    });
    if (order2.join("") !== "0123456789") {
      return false;
    }
    var test3 = {};
    "abcdefghijklmnopqrst".split("").forEach(function(letter) {
      test3[letter] = letter;
    });
    if (Object.keys(Object.assign({}, test3)).join("") !== "abcdefghijklmnopqrst") {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}
var objectAssign = shouldUseNative() ? Object.assign : function(target, source) {
  var from;
  var to = toObject(target);
  var symbols;
  for (var s2 = 1; s2 < arguments.length; s2++) {
    from = Object(arguments[s2]);
    for (var key in from) {
      if (hasOwnProperty.call(from, key)) {
        to[key] = from[key];
      }
    }
    if (getOwnPropertySymbols) {
      symbols = getOwnPropertySymbols(from);
      for (var i2 = 0; i2 < symbols.length; i2++) {
        if (propIsEnumerable.call(from, symbols[i2])) {
          to[symbols[i2]] = from[symbols[i2]];
        }
      }
    }
  }
  return to;
};
/** @license React v16.14.0
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var l$1 = objectAssign, n$2 = "function" === typeof Symbol && Symbol.for, p$1 = n$2 ? Symbol.for("react.element") : 60103, q$1 = n$2 ? Symbol.for("react.portal") : 60106, r$2 = n$2 ? Symbol.for("react.fragment") : 60107, t$1 = n$2 ? Symbol.for("react.strict_mode") : 60108, u$1 = n$2 ? Symbol.for("react.profiler") : 60114, v$2 = n$2 ? Symbol.for("react.provider") : 60109, w$1 = n$2 ? Symbol.for("react.context") : 60110, x$1 = n$2 ? Symbol.for("react.forward_ref") : 60112, y$1 = n$2 ? Symbol.for("react.suspense") : 60113, z$1 = n$2 ? Symbol.for("react.memo") : 60115, A$1 = n$2 ? Symbol.for("react.lazy") : 60116, B$1 = "function" === typeof Symbol && Symbol.iterator;
function C$2(a2) {
  for (var b2 = "https://reactjs.org/docs/error-decoder.html?invariant=" + a2, c2 = 1; c2 < arguments.length; c2++)
    b2 += "&args[]=" + encodeURIComponent(arguments[c2]);
  return "Minified React error #" + a2 + "; visit " + b2 + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
}
var D$1 = { isMounted: function() {
  return false;
}, enqueueForceUpdate: function() {
}, enqueueReplaceState: function() {
}, enqueueSetState: function() {
} }, E$2 = {};
function F$2(a2, b2, c2) {
  this.props = a2;
  this.context = b2;
  this.refs = E$2;
  this.updater = c2 || D$1;
}
F$2.prototype.isReactComponent = {};
F$2.prototype.setState = function(a2, b2) {
  if ("object" !== typeof a2 && "function" !== typeof a2 && null != a2)
    throw Error(C$2(85));
  this.updater.enqueueSetState(this, a2, b2, "setState");
};
F$2.prototype.forceUpdate = function(a2) {
  this.updater.enqueueForceUpdate(this, a2, "forceUpdate");
};
function G$2() {
}
G$2.prototype = F$2.prototype;
function H$2(a2, b2, c2) {
  this.props = a2;
  this.context = b2;
  this.refs = E$2;
  this.updater = c2 || D$1;
}
var I$2 = H$2.prototype = new G$2();
I$2.constructor = H$2;
l$1(I$2, F$2.prototype);
I$2.isPureReactComponent = true;
var J$2 = { current: null }, K$2 = Object.prototype.hasOwnProperty, L$2 = { key: true, ref: true, __self: true, __source: true };
function M$2(a2, b2, c2) {
  var e2, d = {}, g2 = null, k2 = null;
  if (null != b2)
    for (e2 in void 0 !== b2.ref && (k2 = b2.ref), void 0 !== b2.key && (g2 = "" + b2.key), b2)
      K$2.call(b2, e2) && !L$2.hasOwnProperty(e2) && (d[e2] = b2[e2]);
  var f2 = arguments.length - 2;
  if (1 === f2)
    d.children = c2;
  else if (1 < f2) {
    for (var h2 = Array(f2), m2 = 0; m2 < f2; m2++)
      h2[m2] = arguments[m2 + 2];
    d.children = h2;
  }
  if (a2 && a2.defaultProps)
    for (e2 in f2 = a2.defaultProps, f2)
      void 0 === d[e2] && (d[e2] = f2[e2]);
  return { $$typeof: p$1, type: a2, key: g2, ref: k2, props: d, _owner: J$2.current };
}
function N$2(a2, b2) {
  return { $$typeof: p$1, type: a2.type, key: b2, ref: a2.ref, props: a2.props, _owner: a2._owner };
}
function O$2(a2) {
  return "object" === typeof a2 && null !== a2 && a2.$$typeof === p$1;
}
function escape(a2) {
  var b2 = { "=": "=0", ":": "=2" };
  return "$" + ("" + a2).replace(/[=:]/g, function(a3) {
    return b2[a3];
  });
}
var P$2 = /\/+/g, Q$2 = [];
function R$2(a2, b2, c2, e2) {
  if (Q$2.length) {
    var d = Q$2.pop();
    d.result = a2;
    d.keyPrefix = b2;
    d.func = c2;
    d.context = e2;
    d.count = 0;
    return d;
  }
  return { result: a2, keyPrefix: b2, func: c2, context: e2, count: 0 };
}
function S$2(a2) {
  a2.result = null;
  a2.keyPrefix = null;
  a2.func = null;
  a2.context = null;
  a2.count = 0;
  10 > Q$2.length && Q$2.push(a2);
}
function T$2(a2, b2, c2, e2) {
  var d = typeof a2;
  if ("undefined" === d || "boolean" === d)
    a2 = null;
  var g2 = false;
  if (null === a2)
    g2 = true;
  else
    switch (d) {
      case "string":
      case "number":
        g2 = true;
        break;
      case "object":
        switch (a2.$$typeof) {
          case p$1:
          case q$1:
            g2 = true;
        }
    }
  if (g2)
    return c2(e2, a2, "" === b2 ? "." + U$2(a2, 0) : b2), 1;
  g2 = 0;
  b2 = "" === b2 ? "." : b2 + ":";
  if (Array.isArray(a2))
    for (var k2 = 0; k2 < a2.length; k2++) {
      d = a2[k2];
      var f2 = b2 + U$2(d, k2);
      g2 += T$2(d, f2, c2, e2);
    }
  else if (null === a2 || "object" !== typeof a2 ? f2 = null : (f2 = B$1 && a2[B$1] || a2["@@iterator"], f2 = "function" === typeof f2 ? f2 : null), "function" === typeof f2)
    for (a2 = f2.call(a2), k2 = 0; !(d = a2.next()).done; )
      d = d.value, f2 = b2 + U$2(d, k2++), g2 += T$2(d, f2, c2, e2);
  else if ("object" === d)
    throw c2 = "" + a2, Error(C$2(31, "[object Object]" === c2 ? "object with keys {" + Object.keys(a2).join(", ") + "}" : c2, ""));
  return g2;
}
function V$2(a2, b2, c2) {
  return null == a2 ? 0 : T$2(a2, "", b2, c2);
}
function U$2(a2, b2) {
  return "object" === typeof a2 && null !== a2 && null != a2.key ? escape(a2.key) : b2.toString(36);
}
function W$2(a2, b2) {
  a2.func.call(a2.context, b2, a2.count++);
}
function aa$1(a2, b2, c2) {
  var e2 = a2.result, d = a2.keyPrefix;
  a2 = a2.func.call(a2.context, b2, a2.count++);
  Array.isArray(a2) ? X$2(a2, e2, c2, function(a3) {
    return a3;
  }) : null != a2 && (O$2(a2) && (a2 = N$2(a2, d + (!a2.key || b2 && b2.key === a2.key ? "" : ("" + a2.key).replace(P$2, "$&/") + "/") + c2)), e2.push(a2));
}
function X$2(a2, b2, c2, e2, d) {
  var g2 = "";
  null != c2 && (g2 = ("" + c2).replace(P$2, "$&/") + "/");
  b2 = R$2(b2, g2, e2, d);
  V$2(a2, aa$1, b2);
  S$2(b2);
}
var Y$2 = { current: null };
function Z$2() {
  var a2 = Y$2.current;
  if (null === a2)
    throw Error(C$2(321));
  return a2;
}
var ba$1 = { ReactCurrentDispatcher: Y$2, ReactCurrentBatchConfig: { suspense: null }, ReactCurrentOwner: J$2, IsSomeRendererActing: { current: false }, assign: l$1 };
react_production_min.Children = { map: function(a2, b2, c2) {
  if (null == a2)
    return a2;
  var e2 = [];
  X$2(a2, e2, null, b2, c2);
  return e2;
}, forEach: function(a2, b2, c2) {
  if (null == a2)
    return a2;
  b2 = R$2(null, null, b2, c2);
  V$2(a2, W$2, b2);
  S$2(b2);
}, count: function(a2) {
  return V$2(a2, function() {
    return null;
  }, null);
}, toArray: function(a2) {
  var b2 = [];
  X$2(a2, b2, null, function(a3) {
    return a3;
  });
  return b2;
}, only: function(a2) {
  if (!O$2(a2))
    throw Error(C$2(143));
  return a2;
} };
react_production_min.Component = F$2;
react_production_min.Fragment = r$2;
react_production_min.Profiler = u$1;
react_production_min.PureComponent = H$2;
react_production_min.StrictMode = t$1;
react_production_min.Suspense = y$1;
react_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ba$1;
react_production_min.cloneElement = function(a2, b2, c2) {
  if (null === a2 || void 0 === a2)
    throw Error(C$2(267, a2));
  var e2 = l$1({}, a2.props), d = a2.key, g2 = a2.ref, k2 = a2._owner;
  if (null != b2) {
    void 0 !== b2.ref && (g2 = b2.ref, k2 = J$2.current);
    void 0 !== b2.key && (d = "" + b2.key);
    if (a2.type && a2.type.defaultProps)
      var f2 = a2.type.defaultProps;
    for (h2 in b2)
      K$2.call(b2, h2) && !L$2.hasOwnProperty(h2) && (e2[h2] = void 0 === b2[h2] && void 0 !== f2 ? f2[h2] : b2[h2]);
  }
  var h2 = arguments.length - 2;
  if (1 === h2)
    e2.children = c2;
  else if (1 < h2) {
    f2 = Array(h2);
    for (var m2 = 0; m2 < h2; m2++)
      f2[m2] = arguments[m2 + 2];
    e2.children = f2;
  }
  return {
    $$typeof: p$1,
    type: a2.type,
    key: d,
    ref: g2,
    props: e2,
    _owner: k2
  };
};
react_production_min.createContext = function(a2, b2) {
  void 0 === b2 && (b2 = null);
  a2 = { $$typeof: w$1, _calculateChangedBits: b2, _currentValue: a2, _currentValue2: a2, _threadCount: 0, Provider: null, Consumer: null };
  a2.Provider = { $$typeof: v$2, _context: a2 };
  return a2.Consumer = a2;
};
react_production_min.createElement = M$2;
react_production_min.createFactory = function(a2) {
  var b2 = M$2.bind(null, a2);
  b2.type = a2;
  return b2;
};
react_production_min.createRef = function() {
  return { current: null };
};
react_production_min.forwardRef = function(a2) {
  return { $$typeof: x$1, render: a2 };
};
react_production_min.isValidElement = O$2;
react_production_min.lazy = function(a2) {
  return { $$typeof: A$1, _ctor: a2, _status: -1, _result: null };
};
react_production_min.memo = function(a2, b2) {
  return { $$typeof: z$1, type: a2, compare: void 0 === b2 ? null : b2 };
};
react_production_min.useCallback = function(a2, b2) {
  return Z$2().useCallback(a2, b2);
};
react_production_min.useContext = function(a2, b2) {
  return Z$2().useContext(a2, b2);
};
react_production_min.useDebugValue = function() {
};
react_production_min.useEffect = function(a2, b2) {
  return Z$2().useEffect(a2, b2);
};
react_production_min.useImperativeHandle = function(a2, b2, c2) {
  return Z$2().useImperativeHandle(a2, b2, c2);
};
react_production_min.useLayoutEffect = function(a2, b2) {
  return Z$2().useLayoutEffect(a2, b2);
};
react_production_min.useMemo = function(a2, b2) {
  return Z$2().useMemo(a2, b2);
};
react_production_min.useReducer = function(a2, b2, c2) {
  return Z$2().useReducer(a2, b2, c2);
};
react_production_min.useRef = function(a2) {
  return Z$2().useRef(a2);
};
react_production_min.useState = function(a2) {
  return Z$2().useState(a2);
};
react_production_min.version = "16.14.0";
{
  react.exports = react_production_min;
}
var l = react.exports;
var reactDom = { exports: {} };
var reactDom_production_min = {};
var scheduler = { exports: {} };
var scheduler_production_min = {};
/** @license React v0.19.1
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
(function(exports) {
  var f2, g2, h2, k2, l2;
  if ("undefined" === typeof window || "function" !== typeof MessageChannel) {
    var p2 = null, q2 = null, t2 = function() {
      if (null !== p2)
        try {
          var a2 = exports.unstable_now();
          p2(true, a2);
          p2 = null;
        } catch (b2) {
          throw setTimeout(t2, 0), b2;
        }
    }, u2 = Date.now();
    exports.unstable_now = function() {
      return Date.now() - u2;
    };
    f2 = function(a2) {
      null !== p2 ? setTimeout(f2, 0, a2) : (p2 = a2, setTimeout(t2, 0));
    };
    g2 = function(a2, b2) {
      q2 = setTimeout(a2, b2);
    };
    h2 = function() {
      clearTimeout(q2);
    };
    k2 = function() {
      return false;
    };
    l2 = exports.unstable_forceFrameRate = function() {
    };
  } else {
    var w2 = window.performance, x2 = window.Date, y2 = window.setTimeout, z2 = window.clearTimeout;
    if ("undefined" !== typeof console) {
      var A2 = window.cancelAnimationFrame;
      "function" !== typeof window.requestAnimationFrame && console.error("This browser doesn't support requestAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills");
      "function" !== typeof A2 && console.error("This browser doesn't support cancelAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills");
    }
    if ("object" === typeof w2 && "function" === typeof w2.now)
      exports.unstable_now = function() {
        return w2.now();
      };
    else {
      var B2 = x2.now();
      exports.unstable_now = function() {
        return x2.now() - B2;
      };
    }
    var C2 = false, D2 = null, E2 = -1, F2 = 5, G2 = 0;
    k2 = function() {
      return exports.unstable_now() >= G2;
    };
    l2 = function() {
    };
    exports.unstable_forceFrameRate = function(a2) {
      0 > a2 || 125 < a2 ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing framerates higher than 125 fps is not unsupported") : F2 = 0 < a2 ? Math.floor(1e3 / a2) : 5;
    };
    var H2 = new MessageChannel(), I2 = H2.port2;
    H2.port1.onmessage = function() {
      if (null !== D2) {
        var a2 = exports.unstable_now();
        G2 = a2 + F2;
        try {
          D2(true, a2) ? I2.postMessage(null) : (C2 = false, D2 = null);
        } catch (b2) {
          throw I2.postMessage(null), b2;
        }
      } else
        C2 = false;
    };
    f2 = function(a2) {
      D2 = a2;
      C2 || (C2 = true, I2.postMessage(null));
    };
    g2 = function(a2, b2) {
      E2 = y2(function() {
        a2(exports.unstable_now());
      }, b2);
    };
    h2 = function() {
      z2(E2);
      E2 = -1;
    };
  }
  function J2(a2, b2) {
    var c2 = a2.length;
    a2.push(b2);
    a:
      for (; ; ) {
        var d = c2 - 1 >>> 1, e2 = a2[d];
        if (void 0 !== e2 && 0 < K2(e2, b2))
          a2[d] = b2, a2[c2] = e2, c2 = d;
        else
          break a;
      }
  }
  function L2(a2) {
    a2 = a2[0];
    return void 0 === a2 ? null : a2;
  }
  function M2(a2) {
    var b2 = a2[0];
    if (void 0 !== b2) {
      var c2 = a2.pop();
      if (c2 !== b2) {
        a2[0] = c2;
        a:
          for (var d = 0, e2 = a2.length; d < e2; ) {
            var m2 = 2 * (d + 1) - 1, n2 = a2[m2], v2 = m2 + 1, r2 = a2[v2];
            if (void 0 !== n2 && 0 > K2(n2, c2))
              void 0 !== r2 && 0 > K2(r2, n2) ? (a2[d] = r2, a2[v2] = c2, d = v2) : (a2[d] = n2, a2[m2] = c2, d = m2);
            else if (void 0 !== r2 && 0 > K2(r2, c2))
              a2[d] = r2, a2[v2] = c2, d = v2;
            else
              break a;
          }
      }
      return b2;
    }
    return null;
  }
  function K2(a2, b2) {
    var c2 = a2.sortIndex - b2.sortIndex;
    return 0 !== c2 ? c2 : a2.id - b2.id;
  }
  var N2 = [], O2 = [], P2 = 1, Q2 = null, R2 = 3, S2 = false, T2 = false, U2 = false;
  function V2(a2) {
    for (var b2 = L2(O2); null !== b2; ) {
      if (null === b2.callback)
        M2(O2);
      else if (b2.startTime <= a2)
        M2(O2), b2.sortIndex = b2.expirationTime, J2(N2, b2);
      else
        break;
      b2 = L2(O2);
    }
  }
  function W2(a2) {
    U2 = false;
    V2(a2);
    if (!T2)
      if (null !== L2(N2))
        T2 = true, f2(X2);
      else {
        var b2 = L2(O2);
        null !== b2 && g2(W2, b2.startTime - a2);
      }
  }
  function X2(a2, b2) {
    T2 = false;
    U2 && (U2 = false, h2());
    S2 = true;
    var c2 = R2;
    try {
      V2(b2);
      for (Q2 = L2(N2); null !== Q2 && (!(Q2.expirationTime > b2) || a2 && !k2()); ) {
        var d = Q2.callback;
        if (null !== d) {
          Q2.callback = null;
          R2 = Q2.priorityLevel;
          var e2 = d(Q2.expirationTime <= b2);
          b2 = exports.unstable_now();
          "function" === typeof e2 ? Q2.callback = e2 : Q2 === L2(N2) && M2(N2);
          V2(b2);
        } else
          M2(N2);
        Q2 = L2(N2);
      }
      if (null !== Q2)
        var m2 = true;
      else {
        var n2 = L2(O2);
        null !== n2 && g2(W2, n2.startTime - b2);
        m2 = false;
      }
      return m2;
    } finally {
      Q2 = null, R2 = c2, S2 = false;
    }
  }
  function Y2(a2) {
    switch (a2) {
      case 1:
        return -1;
      case 2:
        return 250;
      case 5:
        return 1073741823;
      case 4:
        return 1e4;
      default:
        return 5e3;
    }
  }
  var Z2 = l2;
  exports.unstable_IdlePriority = 5;
  exports.unstable_ImmediatePriority = 1;
  exports.unstable_LowPriority = 4;
  exports.unstable_NormalPriority = 3;
  exports.unstable_Profiling = null;
  exports.unstable_UserBlockingPriority = 2;
  exports.unstable_cancelCallback = function(a2) {
    a2.callback = null;
  };
  exports.unstable_continueExecution = function() {
    T2 || S2 || (T2 = true, f2(X2));
  };
  exports.unstable_getCurrentPriorityLevel = function() {
    return R2;
  };
  exports.unstable_getFirstCallbackNode = function() {
    return L2(N2);
  };
  exports.unstable_next = function(a2) {
    switch (R2) {
      case 1:
      case 2:
      case 3:
        var b2 = 3;
        break;
      default:
        b2 = R2;
    }
    var c2 = R2;
    R2 = b2;
    try {
      return a2();
    } finally {
      R2 = c2;
    }
  };
  exports.unstable_pauseExecution = function() {
  };
  exports.unstable_requestPaint = Z2;
  exports.unstable_runWithPriority = function(a2, b2) {
    switch (a2) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        break;
      default:
        a2 = 3;
    }
    var c2 = R2;
    R2 = a2;
    try {
      return b2();
    } finally {
      R2 = c2;
    }
  };
  exports.unstable_scheduleCallback = function(a2, b2, c2) {
    var d = exports.unstable_now();
    if ("object" === typeof c2 && null !== c2) {
      var e2 = c2.delay;
      e2 = "number" === typeof e2 && 0 < e2 ? d + e2 : d;
      c2 = "number" === typeof c2.timeout ? c2.timeout : Y2(a2);
    } else
      c2 = Y2(a2), e2 = d;
    c2 = e2 + c2;
    a2 = { id: P2++, callback: b2, priorityLevel: a2, startTime: e2, expirationTime: c2, sortIndex: -1 };
    e2 > d ? (a2.sortIndex = e2, J2(O2, a2), null === L2(N2) && a2 === L2(O2) && (U2 ? h2() : U2 = true, g2(W2, e2 - d))) : (a2.sortIndex = c2, J2(N2, a2), T2 || S2 || (T2 = true, f2(X2)));
    return a2;
  };
  exports.unstable_shouldYield = function() {
    var a2 = exports.unstable_now();
    V2(a2);
    var b2 = L2(N2);
    return b2 !== Q2 && null !== Q2 && null !== b2 && null !== b2.callback && b2.startTime <= a2 && b2.expirationTime < Q2.expirationTime || k2();
  };
  exports.unstable_wrapCallback = function(a2) {
    var b2 = R2;
    return function() {
      var c2 = R2;
      R2 = b2;
      try {
        return a2.apply(this, arguments);
      } finally {
        R2 = c2;
      }
    };
  };
})(scheduler_production_min);
{
  scheduler.exports = scheduler_production_min;
}
/** @license React v16.14.0
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var aa = react.exports, n$1 = objectAssign, r$1 = scheduler.exports;
function u(a2) {
  for (var b2 = "https://reactjs.org/docs/error-decoder.html?invariant=" + a2, c2 = 1; c2 < arguments.length; c2++)
    b2 += "&args[]=" + encodeURIComponent(arguments[c2]);
  return "Minified React error #" + a2 + "; visit " + b2 + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
}
if (!aa)
  throw Error(u(227));
function ba(a2, b2, c2, d, e2, f2, g2, h2, k2) {
  var l2 = Array.prototype.slice.call(arguments, 3);
  try {
    b2.apply(c2, l2);
  } catch (m2) {
    this.onError(m2);
  }
}
var da = false, ea = null, fa = false, ha = null, ia = { onError: function(a2) {
  da = true;
  ea = a2;
} };
function ja(a2, b2, c2, d, e2, f2, g2, h2, k2) {
  da = false;
  ea = null;
  ba.apply(ia, arguments);
}
function ka(a2, b2, c2, d, e2, f2, g2, h2, k2) {
  ja.apply(this, arguments);
  if (da) {
    if (da) {
      var l2 = ea;
      da = false;
      ea = null;
    } else
      throw Error(u(198));
    fa || (fa = true, ha = l2);
  }
}
var la = null, ma = null, na = null;
function oa(a2, b2, c2) {
  var d = a2.type || "unknown-event";
  a2.currentTarget = na(c2);
  ka(d, b2, void 0, a2);
  a2.currentTarget = null;
}
var pa = null, qa = {};
function ra() {
  if (pa)
    for (var a2 in qa) {
      var b2 = qa[a2], c2 = pa.indexOf(a2);
      if (!(-1 < c2))
        throw Error(u(96, a2));
      if (!sa[c2]) {
        if (!b2.extractEvents)
          throw Error(u(97, a2));
        sa[c2] = b2;
        c2 = b2.eventTypes;
        for (var d in c2) {
          var e2 = void 0;
          var f2 = c2[d], g2 = b2, h2 = d;
          if (ta.hasOwnProperty(h2))
            throw Error(u(99, h2));
          ta[h2] = f2;
          var k2 = f2.phasedRegistrationNames;
          if (k2) {
            for (e2 in k2)
              k2.hasOwnProperty(e2) && ua(k2[e2], g2, h2);
            e2 = true;
          } else
            f2.registrationName ? (ua(f2.registrationName, g2, h2), e2 = true) : e2 = false;
          if (!e2)
            throw Error(u(98, d, a2));
        }
      }
    }
}
function ua(a2, b2, c2) {
  if (va[a2])
    throw Error(u(100, a2));
  va[a2] = b2;
  wa[a2] = b2.eventTypes[c2].dependencies;
}
var sa = [], ta = {}, va = {}, wa = {};
function xa(a2) {
  var b2 = false, c2;
  for (c2 in a2)
    if (a2.hasOwnProperty(c2)) {
      var d = a2[c2];
      if (!qa.hasOwnProperty(c2) || qa[c2] !== d) {
        if (qa[c2])
          throw Error(u(102, c2));
        qa[c2] = d;
        b2 = true;
      }
    }
  b2 && ra();
}
var ya = !("undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement), za = null, Aa = null, Ba = null;
function Ca(a2) {
  if (a2 = ma(a2)) {
    if ("function" !== typeof za)
      throw Error(u(280));
    var b2 = a2.stateNode;
    b2 && (b2 = la(b2), za(a2.stateNode, a2.type, b2));
  }
}
function Da(a2) {
  Aa ? Ba ? Ba.push(a2) : Ba = [a2] : Aa = a2;
}
function Ea() {
  if (Aa) {
    var a2 = Aa, b2 = Ba;
    Ba = Aa = null;
    Ca(a2);
    if (b2)
      for (a2 = 0; a2 < b2.length; a2++)
        Ca(b2[a2]);
  }
}
function Fa(a2, b2) {
  return a2(b2);
}
function Ga(a2, b2, c2, d, e2) {
  return a2(b2, c2, d, e2);
}
function Ha() {
}
var Ia = Fa, Ja = false, Ka = false;
function La() {
  if (null !== Aa || null !== Ba)
    Ha(), Ea();
}
function Ma(a2, b2, c2) {
  if (Ka)
    return a2(b2, c2);
  Ka = true;
  try {
    return Ia(a2, b2, c2);
  } finally {
    Ka = false, La();
  }
}
var Na = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, Oa = Object.prototype.hasOwnProperty, Pa = {}, Qa = {};
function Ra(a2) {
  if (Oa.call(Qa, a2))
    return true;
  if (Oa.call(Pa, a2))
    return false;
  if (Na.test(a2))
    return Qa[a2] = true;
  Pa[a2] = true;
  return false;
}
function Sa(a2, b2, c2, d) {
  if (null !== c2 && 0 === c2.type)
    return false;
  switch (typeof b2) {
    case "function":
    case "symbol":
      return true;
    case "boolean":
      if (d)
        return false;
      if (null !== c2)
        return !c2.acceptsBooleans;
      a2 = a2.toLowerCase().slice(0, 5);
      return "data-" !== a2 && "aria-" !== a2;
    default:
      return false;
  }
}
function Ta(a2, b2, c2, d) {
  if (null === b2 || "undefined" === typeof b2 || Sa(a2, b2, c2, d))
    return true;
  if (d)
    return false;
  if (null !== c2)
    switch (c2.type) {
      case 3:
        return !b2;
      case 4:
        return false === b2;
      case 5:
        return isNaN(b2);
      case 6:
        return isNaN(b2) || 1 > b2;
    }
  return false;
}
function v$1(a2, b2, c2, d, e2, f2) {
  this.acceptsBooleans = 2 === b2 || 3 === b2 || 4 === b2;
  this.attributeName = d;
  this.attributeNamespace = e2;
  this.mustUseProperty = c2;
  this.propertyName = a2;
  this.type = b2;
  this.sanitizeURL = f2;
}
var C$1 = {};
"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(a2) {
  C$1[a2] = new v$1(a2, 0, false, a2, null, false);
});
[["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(a2) {
  var b2 = a2[0];
  C$1[b2] = new v$1(b2, 1, false, a2[1], null, false);
});
["contentEditable", "draggable", "spellCheck", "value"].forEach(function(a2) {
  C$1[a2] = new v$1(a2, 2, false, a2.toLowerCase(), null, false);
});
["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(a2) {
  C$1[a2] = new v$1(a2, 2, false, a2, null, false);
});
"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(a2) {
  C$1[a2] = new v$1(a2, 3, false, a2.toLowerCase(), null, false);
});
["checked", "multiple", "muted", "selected"].forEach(function(a2) {
  C$1[a2] = new v$1(a2, 3, true, a2, null, false);
});
["capture", "download"].forEach(function(a2) {
  C$1[a2] = new v$1(a2, 4, false, a2, null, false);
});
["cols", "rows", "size", "span"].forEach(function(a2) {
  C$1[a2] = new v$1(a2, 6, false, a2, null, false);
});
["rowSpan", "start"].forEach(function(a2) {
  C$1[a2] = new v$1(a2, 5, false, a2.toLowerCase(), null, false);
});
var Ua = /[\-:]([a-z])/g;
function Va(a2) {
  return a2[1].toUpperCase();
}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(a2) {
  var b2 = a2.replace(
    Ua,
    Va
  );
  C$1[b2] = new v$1(b2, 1, false, a2, null, false);
});
"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(a2) {
  var b2 = a2.replace(Ua, Va);
  C$1[b2] = new v$1(b2, 1, false, a2, "http://www.w3.org/1999/xlink", false);
});
["xml:base", "xml:lang", "xml:space"].forEach(function(a2) {
  var b2 = a2.replace(Ua, Va);
  C$1[b2] = new v$1(b2, 1, false, a2, "http://www.w3.org/XML/1998/namespace", false);
});
["tabIndex", "crossOrigin"].forEach(function(a2) {
  C$1[a2] = new v$1(a2, 1, false, a2.toLowerCase(), null, false);
});
C$1.xlinkHref = new v$1("xlinkHref", 1, false, "xlink:href", "http://www.w3.org/1999/xlink", true);
["src", "href", "action", "formAction"].forEach(function(a2) {
  C$1[a2] = new v$1(a2, 1, false, a2.toLowerCase(), null, true);
});
var Wa = aa.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
Wa.hasOwnProperty("ReactCurrentDispatcher") || (Wa.ReactCurrentDispatcher = { current: null });
Wa.hasOwnProperty("ReactCurrentBatchConfig") || (Wa.ReactCurrentBatchConfig = { suspense: null });
function Xa(a2, b2, c2, d) {
  var e2 = C$1.hasOwnProperty(b2) ? C$1[b2] : null;
  var f2 = null !== e2 ? 0 === e2.type : d ? false : !(2 < b2.length) || "o" !== b2[0] && "O" !== b2[0] || "n" !== b2[1] && "N" !== b2[1] ? false : true;
  f2 || (Ta(b2, c2, e2, d) && (c2 = null), d || null === e2 ? Ra(b2) && (null === c2 ? a2.removeAttribute(b2) : a2.setAttribute(b2, "" + c2)) : e2.mustUseProperty ? a2[e2.propertyName] = null === c2 ? 3 === e2.type ? false : "" : c2 : (b2 = e2.attributeName, d = e2.attributeNamespace, null === c2 ? a2.removeAttribute(b2) : (e2 = e2.type, c2 = 3 === e2 || 4 === e2 && true === c2 ? "" : "" + c2, d ? a2.setAttributeNS(d, b2, c2) : a2.setAttribute(b2, c2))));
}
var Ya = /^(.*)[\\\/]/, E$1 = "function" === typeof Symbol && Symbol.for, Za = E$1 ? Symbol.for("react.element") : 60103, $a = E$1 ? Symbol.for("react.portal") : 60106, ab = E$1 ? Symbol.for("react.fragment") : 60107, bb = E$1 ? Symbol.for("react.strict_mode") : 60108, cb = E$1 ? Symbol.for("react.profiler") : 60114, db = E$1 ? Symbol.for("react.provider") : 60109, eb = E$1 ? Symbol.for("react.context") : 60110, fb = E$1 ? Symbol.for("react.concurrent_mode") : 60111, gb = E$1 ? Symbol.for("react.forward_ref") : 60112, hb = E$1 ? Symbol.for("react.suspense") : 60113, ib = E$1 ? Symbol.for("react.suspense_list") : 60120, jb = E$1 ? Symbol.for("react.memo") : 60115, kb = E$1 ? Symbol.for("react.lazy") : 60116, lb = E$1 ? Symbol.for("react.block") : 60121, mb = "function" === typeof Symbol && Symbol.iterator;
function nb(a2) {
  if (null === a2 || "object" !== typeof a2)
    return null;
  a2 = mb && a2[mb] || a2["@@iterator"];
  return "function" === typeof a2 ? a2 : null;
}
function ob(a2) {
  if (-1 === a2._status) {
    a2._status = 0;
    var b2 = a2._ctor;
    b2 = b2();
    a2._result = b2;
    b2.then(function(b3) {
      0 === a2._status && (b3 = b3.default, a2._status = 1, a2._result = b3);
    }, function(b3) {
      0 === a2._status && (a2._status = 2, a2._result = b3);
    });
  }
}
function pb(a2) {
  if (null == a2)
    return null;
  if ("function" === typeof a2)
    return a2.displayName || a2.name || null;
  if ("string" === typeof a2)
    return a2;
  switch (a2) {
    case ab:
      return "Fragment";
    case $a:
      return "Portal";
    case cb:
      return "Profiler";
    case bb:
      return "StrictMode";
    case hb:
      return "Suspense";
    case ib:
      return "SuspenseList";
  }
  if ("object" === typeof a2)
    switch (a2.$$typeof) {
      case eb:
        return "Context.Consumer";
      case db:
        return "Context.Provider";
      case gb:
        var b2 = a2.render;
        b2 = b2.displayName || b2.name || "";
        return a2.displayName || ("" !== b2 ? "ForwardRef(" + b2 + ")" : "ForwardRef");
      case jb:
        return pb(a2.type);
      case lb:
        return pb(a2.render);
      case kb:
        if (a2 = 1 === a2._status ? a2._result : null)
          return pb(a2);
    }
  return null;
}
function qb(a2) {
  var b2 = "";
  do {
    a:
      switch (a2.tag) {
        case 3:
        case 4:
        case 6:
        case 7:
        case 10:
        case 9:
          var c2 = "";
          break a;
        default:
          var d = a2._debugOwner, e2 = a2._debugSource, f2 = pb(a2.type);
          c2 = null;
          d && (c2 = pb(d.type));
          d = f2;
          f2 = "";
          e2 ? f2 = " (at " + e2.fileName.replace(Ya, "") + ":" + e2.lineNumber + ")" : c2 && (f2 = " (created by " + c2 + ")");
          c2 = "\n    in " + (d || "Unknown") + f2;
      }
    b2 += c2;
    a2 = a2.return;
  } while (a2);
  return b2;
}
function rb(a2) {
  switch (typeof a2) {
    case "boolean":
    case "number":
    case "object":
    case "string":
    case "undefined":
      return a2;
    default:
      return "";
  }
}
function sb(a2) {
  var b2 = a2.type;
  return (a2 = a2.nodeName) && "input" === a2.toLowerCase() && ("checkbox" === b2 || "radio" === b2);
}
function tb(a2) {
  var b2 = sb(a2) ? "checked" : "value", c2 = Object.getOwnPropertyDescriptor(a2.constructor.prototype, b2), d = "" + a2[b2];
  if (!a2.hasOwnProperty(b2) && "undefined" !== typeof c2 && "function" === typeof c2.get && "function" === typeof c2.set) {
    var e2 = c2.get, f2 = c2.set;
    Object.defineProperty(a2, b2, { configurable: true, get: function() {
      return e2.call(this);
    }, set: function(a3) {
      d = "" + a3;
      f2.call(this, a3);
    } });
    Object.defineProperty(a2, b2, { enumerable: c2.enumerable });
    return { getValue: function() {
      return d;
    }, setValue: function(a3) {
      d = "" + a3;
    }, stopTracking: function() {
      a2._valueTracker = null;
      delete a2[b2];
    } };
  }
}
function xb(a2) {
  a2._valueTracker || (a2._valueTracker = tb(a2));
}
function yb(a2) {
  if (!a2)
    return false;
  var b2 = a2._valueTracker;
  if (!b2)
    return true;
  var c2 = b2.getValue();
  var d = "";
  a2 && (d = sb(a2) ? a2.checked ? "true" : "false" : a2.value);
  a2 = d;
  return a2 !== c2 ? (b2.setValue(a2), true) : false;
}
function zb(a2, b2) {
  var c2 = b2.checked;
  return n$1({}, b2, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: null != c2 ? c2 : a2._wrapperState.initialChecked });
}
function Ab(a2, b2) {
  var c2 = null == b2.defaultValue ? "" : b2.defaultValue, d = null != b2.checked ? b2.checked : b2.defaultChecked;
  c2 = rb(null != b2.value ? b2.value : c2);
  a2._wrapperState = { initialChecked: d, initialValue: c2, controlled: "checkbox" === b2.type || "radio" === b2.type ? null != b2.checked : null != b2.value };
}
function Bb(a2, b2) {
  b2 = b2.checked;
  null != b2 && Xa(a2, "checked", b2, false);
}
function Cb(a2, b2) {
  Bb(a2, b2);
  var c2 = rb(b2.value), d = b2.type;
  if (null != c2)
    if ("number" === d) {
      if (0 === c2 && "" === a2.value || a2.value != c2)
        a2.value = "" + c2;
    } else
      a2.value !== "" + c2 && (a2.value = "" + c2);
  else if ("submit" === d || "reset" === d) {
    a2.removeAttribute("value");
    return;
  }
  b2.hasOwnProperty("value") ? Db(a2, b2.type, c2) : b2.hasOwnProperty("defaultValue") && Db(a2, b2.type, rb(b2.defaultValue));
  null == b2.checked && null != b2.defaultChecked && (a2.defaultChecked = !!b2.defaultChecked);
}
function Eb(a2, b2, c2) {
  if (b2.hasOwnProperty("value") || b2.hasOwnProperty("defaultValue")) {
    var d = b2.type;
    if (!("submit" !== d && "reset" !== d || void 0 !== b2.value && null !== b2.value))
      return;
    b2 = "" + a2._wrapperState.initialValue;
    c2 || b2 === a2.value || (a2.value = b2);
    a2.defaultValue = b2;
  }
  c2 = a2.name;
  "" !== c2 && (a2.name = "");
  a2.defaultChecked = !!a2._wrapperState.initialChecked;
  "" !== c2 && (a2.name = c2);
}
function Db(a2, b2, c2) {
  if ("number" !== b2 || a2.ownerDocument.activeElement !== a2)
    null == c2 ? a2.defaultValue = "" + a2._wrapperState.initialValue : a2.defaultValue !== "" + c2 && (a2.defaultValue = "" + c2);
}
function Fb(a2) {
  var b2 = "";
  aa.Children.forEach(a2, function(a3) {
    null != a3 && (b2 += a3);
  });
  return b2;
}
function Gb(a2, b2) {
  a2 = n$1({ children: void 0 }, b2);
  if (b2 = Fb(b2.children))
    a2.children = b2;
  return a2;
}
function Hb(a2, b2, c2, d) {
  a2 = a2.options;
  if (b2) {
    b2 = {};
    for (var e2 = 0; e2 < c2.length; e2++)
      b2["$" + c2[e2]] = true;
    for (c2 = 0; c2 < a2.length; c2++)
      e2 = b2.hasOwnProperty("$" + a2[c2].value), a2[c2].selected !== e2 && (a2[c2].selected = e2), e2 && d && (a2[c2].defaultSelected = true);
  } else {
    c2 = "" + rb(c2);
    b2 = null;
    for (e2 = 0; e2 < a2.length; e2++) {
      if (a2[e2].value === c2) {
        a2[e2].selected = true;
        d && (a2[e2].defaultSelected = true);
        return;
      }
      null !== b2 || a2[e2].disabled || (b2 = a2[e2]);
    }
    null !== b2 && (b2.selected = true);
  }
}
function Ib(a2, b2) {
  if (null != b2.dangerouslySetInnerHTML)
    throw Error(u(91));
  return n$1({}, b2, { value: void 0, defaultValue: void 0, children: "" + a2._wrapperState.initialValue });
}
function Jb(a2, b2) {
  var c2 = b2.value;
  if (null == c2) {
    c2 = b2.children;
    b2 = b2.defaultValue;
    if (null != c2) {
      if (null != b2)
        throw Error(u(92));
      if (Array.isArray(c2)) {
        if (!(1 >= c2.length))
          throw Error(u(93));
        c2 = c2[0];
      }
      b2 = c2;
    }
    null == b2 && (b2 = "");
    c2 = b2;
  }
  a2._wrapperState = { initialValue: rb(c2) };
}
function Kb(a2, b2) {
  var c2 = rb(b2.value), d = rb(b2.defaultValue);
  null != c2 && (c2 = "" + c2, c2 !== a2.value && (a2.value = c2), null == b2.defaultValue && a2.defaultValue !== c2 && (a2.defaultValue = c2));
  null != d && (a2.defaultValue = "" + d);
}
function Lb(a2) {
  var b2 = a2.textContent;
  b2 === a2._wrapperState.initialValue && "" !== b2 && null !== b2 && (a2.value = b2);
}
var Mb = { html: "http://www.w3.org/1999/xhtml", mathml: "http://www.w3.org/1998/Math/MathML", svg: "http://www.w3.org/2000/svg" };
function Nb(a2) {
  switch (a2) {
    case "svg":
      return "http://www.w3.org/2000/svg";
    case "math":
      return "http://www.w3.org/1998/Math/MathML";
    default:
      return "http://www.w3.org/1999/xhtml";
  }
}
function Ob(a2, b2) {
  return null == a2 || "http://www.w3.org/1999/xhtml" === a2 ? Nb(b2) : "http://www.w3.org/2000/svg" === a2 && "foreignObject" === b2 ? "http://www.w3.org/1999/xhtml" : a2;
}
var Pb, Qb = function(a2) {
  return "undefined" !== typeof MSApp && MSApp.execUnsafeLocalFunction ? function(b2, c2, d, e2) {
    MSApp.execUnsafeLocalFunction(function() {
      return a2(b2, c2, d, e2);
    });
  } : a2;
}(function(a2, b2) {
  if (a2.namespaceURI !== Mb.svg || "innerHTML" in a2)
    a2.innerHTML = b2;
  else {
    Pb = Pb || document.createElement("div");
    Pb.innerHTML = "<svg>" + b2.valueOf().toString() + "</svg>";
    for (b2 = Pb.firstChild; a2.firstChild; )
      a2.removeChild(a2.firstChild);
    for (; b2.firstChild; )
      a2.appendChild(b2.firstChild);
  }
});
function Rb(a2, b2) {
  if (b2) {
    var c2 = a2.firstChild;
    if (c2 && c2 === a2.lastChild && 3 === c2.nodeType) {
      c2.nodeValue = b2;
      return;
    }
  }
  a2.textContent = b2;
}
function Sb(a2, b2) {
  var c2 = {};
  c2[a2.toLowerCase()] = b2.toLowerCase();
  c2["Webkit" + a2] = "webkit" + b2;
  c2["Moz" + a2] = "moz" + b2;
  return c2;
}
var Tb = { animationend: Sb("Animation", "AnimationEnd"), animationiteration: Sb("Animation", "AnimationIteration"), animationstart: Sb("Animation", "AnimationStart"), transitionend: Sb("Transition", "TransitionEnd") }, Ub = {}, Vb = {};
ya && (Vb = document.createElement("div").style, "AnimationEvent" in window || (delete Tb.animationend.animation, delete Tb.animationiteration.animation, delete Tb.animationstart.animation), "TransitionEvent" in window || delete Tb.transitionend.transition);
function Wb(a2) {
  if (Ub[a2])
    return Ub[a2];
  if (!Tb[a2])
    return a2;
  var b2 = Tb[a2], c2;
  for (c2 in b2)
    if (b2.hasOwnProperty(c2) && c2 in Vb)
      return Ub[a2] = b2[c2];
  return a2;
}
var Xb = Wb("animationend"), Yb = Wb("animationiteration"), Zb = Wb("animationstart"), $b = Wb("transitionend"), ac = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), bc = new ("function" === typeof WeakMap ? WeakMap : Map)();
function cc(a2) {
  var b2 = bc.get(a2);
  void 0 === b2 && (b2 = /* @__PURE__ */ new Map(), bc.set(a2, b2));
  return b2;
}
function dc(a2) {
  var b2 = a2, c2 = a2;
  if (a2.alternate)
    for (; b2.return; )
      b2 = b2.return;
  else {
    a2 = b2;
    do
      b2 = a2, 0 !== (b2.effectTag & 1026) && (c2 = b2.return), a2 = b2.return;
    while (a2);
  }
  return 3 === b2.tag ? c2 : null;
}
function ec(a2) {
  if (13 === a2.tag) {
    var b2 = a2.memoizedState;
    null === b2 && (a2 = a2.alternate, null !== a2 && (b2 = a2.memoizedState));
    if (null !== b2)
      return b2.dehydrated;
  }
  return null;
}
function fc(a2) {
  if (dc(a2) !== a2)
    throw Error(u(188));
}
function gc(a2) {
  var b2 = a2.alternate;
  if (!b2) {
    b2 = dc(a2);
    if (null === b2)
      throw Error(u(188));
    return b2 !== a2 ? null : a2;
  }
  for (var c2 = a2, d = b2; ; ) {
    var e2 = c2.return;
    if (null === e2)
      break;
    var f2 = e2.alternate;
    if (null === f2) {
      d = e2.return;
      if (null !== d) {
        c2 = d;
        continue;
      }
      break;
    }
    if (e2.child === f2.child) {
      for (f2 = e2.child; f2; ) {
        if (f2 === c2)
          return fc(e2), a2;
        if (f2 === d)
          return fc(e2), b2;
        f2 = f2.sibling;
      }
      throw Error(u(188));
    }
    if (c2.return !== d.return)
      c2 = e2, d = f2;
    else {
      for (var g2 = false, h2 = e2.child; h2; ) {
        if (h2 === c2) {
          g2 = true;
          c2 = e2;
          d = f2;
          break;
        }
        if (h2 === d) {
          g2 = true;
          d = e2;
          c2 = f2;
          break;
        }
        h2 = h2.sibling;
      }
      if (!g2) {
        for (h2 = f2.child; h2; ) {
          if (h2 === c2) {
            g2 = true;
            c2 = f2;
            d = e2;
            break;
          }
          if (h2 === d) {
            g2 = true;
            d = f2;
            c2 = e2;
            break;
          }
          h2 = h2.sibling;
        }
        if (!g2)
          throw Error(u(189));
      }
    }
    if (c2.alternate !== d)
      throw Error(u(190));
  }
  if (3 !== c2.tag)
    throw Error(u(188));
  return c2.stateNode.current === c2 ? a2 : b2;
}
function hc(a2) {
  a2 = gc(a2);
  if (!a2)
    return null;
  for (var b2 = a2; ; ) {
    if (5 === b2.tag || 6 === b2.tag)
      return b2;
    if (b2.child)
      b2.child.return = b2, b2 = b2.child;
    else {
      if (b2 === a2)
        break;
      for (; !b2.sibling; ) {
        if (!b2.return || b2.return === a2)
          return null;
        b2 = b2.return;
      }
      b2.sibling.return = b2.return;
      b2 = b2.sibling;
    }
  }
  return null;
}
function ic(a2, b2) {
  if (null == b2)
    throw Error(u(30));
  if (null == a2)
    return b2;
  if (Array.isArray(a2)) {
    if (Array.isArray(b2))
      return a2.push.apply(a2, b2), a2;
    a2.push(b2);
    return a2;
  }
  return Array.isArray(b2) ? [a2].concat(b2) : [a2, b2];
}
function jc(a2, b2, c2) {
  Array.isArray(a2) ? a2.forEach(b2, c2) : a2 && b2.call(c2, a2);
}
var kc = null;
function lc(a2) {
  if (a2) {
    var b2 = a2._dispatchListeners, c2 = a2._dispatchInstances;
    if (Array.isArray(b2))
      for (var d = 0; d < b2.length && !a2.isPropagationStopped(); d++)
        oa(a2, b2[d], c2[d]);
    else
      b2 && oa(a2, b2, c2);
    a2._dispatchListeners = null;
    a2._dispatchInstances = null;
    a2.isPersistent() || a2.constructor.release(a2);
  }
}
function mc(a2) {
  null !== a2 && (kc = ic(kc, a2));
  a2 = kc;
  kc = null;
  if (a2) {
    jc(a2, lc);
    if (kc)
      throw Error(u(95));
    if (fa)
      throw a2 = ha, fa = false, ha = null, a2;
  }
}
function nc(a2) {
  a2 = a2.target || a2.srcElement || window;
  a2.correspondingUseElement && (a2 = a2.correspondingUseElement);
  return 3 === a2.nodeType ? a2.parentNode : a2;
}
function oc(a2) {
  if (!ya)
    return false;
  a2 = "on" + a2;
  var b2 = a2 in document;
  b2 || (b2 = document.createElement("div"), b2.setAttribute(a2, "return;"), b2 = "function" === typeof b2[a2]);
  return b2;
}
var pc = [];
function qc(a2) {
  a2.topLevelType = null;
  a2.nativeEvent = null;
  a2.targetInst = null;
  a2.ancestors.length = 0;
  10 > pc.length && pc.push(a2);
}
function rc(a2, b2, c2, d) {
  if (pc.length) {
    var e2 = pc.pop();
    e2.topLevelType = a2;
    e2.eventSystemFlags = d;
    e2.nativeEvent = b2;
    e2.targetInst = c2;
    return e2;
  }
  return { topLevelType: a2, eventSystemFlags: d, nativeEvent: b2, targetInst: c2, ancestors: [] };
}
function sc(a2) {
  var b2 = a2.targetInst, c2 = b2;
  do {
    if (!c2) {
      a2.ancestors.push(c2);
      break;
    }
    var d = c2;
    if (3 === d.tag)
      d = d.stateNode.containerInfo;
    else {
      for (; d.return; )
        d = d.return;
      d = 3 !== d.tag ? null : d.stateNode.containerInfo;
    }
    if (!d)
      break;
    b2 = c2.tag;
    5 !== b2 && 6 !== b2 || a2.ancestors.push(c2);
    c2 = tc(d);
  } while (c2);
  for (c2 = 0; c2 < a2.ancestors.length; c2++) {
    b2 = a2.ancestors[c2];
    var e2 = nc(a2.nativeEvent);
    d = a2.topLevelType;
    var f2 = a2.nativeEvent, g2 = a2.eventSystemFlags;
    0 === c2 && (g2 |= 64);
    for (var h2 = null, k2 = 0; k2 < sa.length; k2++) {
      var l2 = sa[k2];
      l2 && (l2 = l2.extractEvents(d, b2, f2, e2, g2)) && (h2 = ic(h2, l2));
    }
    mc(h2);
  }
}
function uc(a2, b2, c2) {
  if (!c2.has(a2)) {
    switch (a2) {
      case "scroll":
        vc(b2, "scroll", true);
        break;
      case "focus":
      case "blur":
        vc(b2, "focus", true);
        vc(b2, "blur", true);
        c2.set("blur", null);
        c2.set("focus", null);
        break;
      case "cancel":
      case "close":
        oc(a2) && vc(b2, a2, true);
        break;
      case "invalid":
      case "submit":
      case "reset":
        break;
      default:
        -1 === ac.indexOf(a2) && F$1(a2, b2);
    }
    c2.set(a2, null);
  }
}
var wc, xc, yc, zc = false, Ac = [], Bc = null, Cc = null, Dc = null, Ec = /* @__PURE__ */ new Map(), Fc = /* @__PURE__ */ new Map(), Gc = [], Hc = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput close cancel copy cut paste click change contextmenu reset submit".split(" "), Ic = "focus blur dragenter dragleave mouseover mouseout pointerover pointerout gotpointercapture lostpointercapture".split(" ");
function Jc(a2, b2) {
  var c2 = cc(b2);
  Hc.forEach(function(a3) {
    uc(a3, b2, c2);
  });
  Ic.forEach(function(a3) {
    uc(a3, b2, c2);
  });
}
function Kc(a2, b2, c2, d, e2) {
  return { blockedOn: a2, topLevelType: b2, eventSystemFlags: c2 | 32, nativeEvent: e2, container: d };
}
function Lc(a2, b2) {
  switch (a2) {
    case "focus":
    case "blur":
      Bc = null;
      break;
    case "dragenter":
    case "dragleave":
      Cc = null;
      break;
    case "mouseover":
    case "mouseout":
      Dc = null;
      break;
    case "pointerover":
    case "pointerout":
      Ec.delete(b2.pointerId);
      break;
    case "gotpointercapture":
    case "lostpointercapture":
      Fc.delete(b2.pointerId);
  }
}
function Mc(a2, b2, c2, d, e2, f2) {
  if (null === a2 || a2.nativeEvent !== f2)
    return a2 = Kc(b2, c2, d, e2, f2), null !== b2 && (b2 = Nc(b2), null !== b2 && xc(b2)), a2;
  a2.eventSystemFlags |= d;
  return a2;
}
function Oc(a2, b2, c2, d, e2) {
  switch (b2) {
    case "focus":
      return Bc = Mc(Bc, a2, b2, c2, d, e2), true;
    case "dragenter":
      return Cc = Mc(Cc, a2, b2, c2, d, e2), true;
    case "mouseover":
      return Dc = Mc(Dc, a2, b2, c2, d, e2), true;
    case "pointerover":
      var f2 = e2.pointerId;
      Ec.set(f2, Mc(Ec.get(f2) || null, a2, b2, c2, d, e2));
      return true;
    case "gotpointercapture":
      return f2 = e2.pointerId, Fc.set(f2, Mc(Fc.get(f2) || null, a2, b2, c2, d, e2)), true;
  }
  return false;
}
function Pc(a2) {
  var b2 = tc(a2.target);
  if (null !== b2) {
    var c2 = dc(b2);
    if (null !== c2) {
      if (b2 = c2.tag, 13 === b2) {
        if (b2 = ec(c2), null !== b2) {
          a2.blockedOn = b2;
          r$1.unstable_runWithPriority(a2.priority, function() {
            yc(c2);
          });
          return;
        }
      } else if (3 === b2 && c2.stateNode.hydrate) {
        a2.blockedOn = 3 === c2.tag ? c2.stateNode.containerInfo : null;
        return;
      }
    }
  }
  a2.blockedOn = null;
}
function Qc(a2) {
  if (null !== a2.blockedOn)
    return false;
  var b2 = Rc(a2.topLevelType, a2.eventSystemFlags, a2.container, a2.nativeEvent);
  if (null !== b2) {
    var c2 = Nc(b2);
    null !== c2 && xc(c2);
    a2.blockedOn = b2;
    return false;
  }
  return true;
}
function Sc(a2, b2, c2) {
  Qc(a2) && c2.delete(b2);
}
function Tc() {
  for (zc = false; 0 < Ac.length; ) {
    var a2 = Ac[0];
    if (null !== a2.blockedOn) {
      a2 = Nc(a2.blockedOn);
      null !== a2 && wc(a2);
      break;
    }
    var b2 = Rc(a2.topLevelType, a2.eventSystemFlags, a2.container, a2.nativeEvent);
    null !== b2 ? a2.blockedOn = b2 : Ac.shift();
  }
  null !== Bc && Qc(Bc) && (Bc = null);
  null !== Cc && Qc(Cc) && (Cc = null);
  null !== Dc && Qc(Dc) && (Dc = null);
  Ec.forEach(Sc);
  Fc.forEach(Sc);
}
function Uc(a2, b2) {
  a2.blockedOn === b2 && (a2.blockedOn = null, zc || (zc = true, r$1.unstable_scheduleCallback(r$1.unstable_NormalPriority, Tc)));
}
function Vc(a2) {
  function b2(b3) {
    return Uc(b3, a2);
  }
  if (0 < Ac.length) {
    Uc(Ac[0], a2);
    for (var c2 = 1; c2 < Ac.length; c2++) {
      var d = Ac[c2];
      d.blockedOn === a2 && (d.blockedOn = null);
    }
  }
  null !== Bc && Uc(Bc, a2);
  null !== Cc && Uc(Cc, a2);
  null !== Dc && Uc(Dc, a2);
  Ec.forEach(b2);
  Fc.forEach(b2);
  for (c2 = 0; c2 < Gc.length; c2++)
    d = Gc[c2], d.blockedOn === a2 && (d.blockedOn = null);
  for (; 0 < Gc.length && (c2 = Gc[0], null === c2.blockedOn); )
    Pc(c2), null === c2.blockedOn && Gc.shift();
}
var Wc = {}, Yc = /* @__PURE__ */ new Map(), Zc = /* @__PURE__ */ new Map(), $c = [
  "abort",
  "abort",
  Xb,
  "animationEnd",
  Yb,
  "animationIteration",
  Zb,
  "animationStart",
  "canplay",
  "canPlay",
  "canplaythrough",
  "canPlayThrough",
  "durationchange",
  "durationChange",
  "emptied",
  "emptied",
  "encrypted",
  "encrypted",
  "ended",
  "ended",
  "error",
  "error",
  "gotpointercapture",
  "gotPointerCapture",
  "load",
  "load",
  "loadeddata",
  "loadedData",
  "loadedmetadata",
  "loadedMetadata",
  "loadstart",
  "loadStart",
  "lostpointercapture",
  "lostPointerCapture",
  "playing",
  "playing",
  "progress",
  "progress",
  "seeking",
  "seeking",
  "stalled",
  "stalled",
  "suspend",
  "suspend",
  "timeupdate",
  "timeUpdate",
  $b,
  "transitionEnd",
  "waiting",
  "waiting"
];
function ad(a2, b2) {
  for (var c2 = 0; c2 < a2.length; c2 += 2) {
    var d = a2[c2], e2 = a2[c2 + 1], f2 = "on" + (e2[0].toUpperCase() + e2.slice(1));
    f2 = { phasedRegistrationNames: { bubbled: f2, captured: f2 + "Capture" }, dependencies: [d], eventPriority: b2 };
    Zc.set(d, b2);
    Yc.set(d, f2);
    Wc[e2] = f2;
  }
}
ad("blur blur cancel cancel click click close close contextmenu contextMenu copy copy cut cut auxclick auxClick dblclick doubleClick dragend dragEnd dragstart dragStart drop drop focus focus input input invalid invalid keydown keyDown keypress keyPress keyup keyUp mousedown mouseDown mouseup mouseUp paste paste pause pause play play pointercancel pointerCancel pointerdown pointerDown pointerup pointerUp ratechange rateChange reset reset seeked seeked submit submit touchcancel touchCancel touchend touchEnd touchstart touchStart volumechange volumeChange".split(" "), 0);
ad("drag drag dragenter dragEnter dragexit dragExit dragleave dragLeave dragover dragOver mousemove mouseMove mouseout mouseOut mouseover mouseOver pointermove pointerMove pointerout pointerOut pointerover pointerOver scroll scroll toggle toggle touchmove touchMove wheel wheel".split(" "), 1);
ad($c, 2);
for (var bd = "change selectionchange textInput compositionstart compositionend compositionupdate".split(" "), cd = 0; cd < bd.length; cd++)
  Zc.set(bd[cd], 0);
var dd = r$1.unstable_UserBlockingPriority, ed = r$1.unstable_runWithPriority, fd = true;
function F$1(a2, b2) {
  vc(b2, a2, false);
}
function vc(a2, b2, c2) {
  var d = Zc.get(b2);
  switch (void 0 === d ? 2 : d) {
    case 0:
      d = gd.bind(null, b2, 1, a2);
      break;
    case 1:
      d = hd.bind(null, b2, 1, a2);
      break;
    default:
      d = id.bind(null, b2, 1, a2);
  }
  c2 ? a2.addEventListener(b2, d, true) : a2.addEventListener(b2, d, false);
}
function gd(a2, b2, c2, d) {
  Ja || Ha();
  var e2 = id, f2 = Ja;
  Ja = true;
  try {
    Ga(e2, a2, b2, c2, d);
  } finally {
    (Ja = f2) || La();
  }
}
function hd(a2, b2, c2, d) {
  ed(dd, id.bind(null, a2, b2, c2, d));
}
function id(a2, b2, c2, d) {
  if (fd)
    if (0 < Ac.length && -1 < Hc.indexOf(a2))
      a2 = Kc(null, a2, b2, c2, d), Ac.push(a2);
    else {
      var e2 = Rc(a2, b2, c2, d);
      if (null === e2)
        Lc(a2, d);
      else if (-1 < Hc.indexOf(a2))
        a2 = Kc(e2, a2, b2, c2, d), Ac.push(a2);
      else if (!Oc(e2, a2, b2, c2, d)) {
        Lc(a2, d);
        a2 = rc(a2, d, null, b2);
        try {
          Ma(sc, a2);
        } finally {
          qc(a2);
        }
      }
    }
}
function Rc(a2, b2, c2, d) {
  c2 = nc(d);
  c2 = tc(c2);
  if (null !== c2) {
    var e2 = dc(c2);
    if (null === e2)
      c2 = null;
    else {
      var f2 = e2.tag;
      if (13 === f2) {
        c2 = ec(e2);
        if (null !== c2)
          return c2;
        c2 = null;
      } else if (3 === f2) {
        if (e2.stateNode.hydrate)
          return 3 === e2.tag ? e2.stateNode.containerInfo : null;
        c2 = null;
      } else
        e2 !== c2 && (c2 = null);
    }
  }
  a2 = rc(a2, d, c2, b2);
  try {
    Ma(sc, a2);
  } finally {
    qc(a2);
  }
  return null;
}
var jd = {
  animationIterationCount: true,
  borderImageOutset: true,
  borderImageSlice: true,
  borderImageWidth: true,
  boxFlex: true,
  boxFlexGroup: true,
  boxOrdinalGroup: true,
  columnCount: true,
  columns: true,
  flex: true,
  flexGrow: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  flexOrder: true,
  gridArea: true,
  gridRow: true,
  gridRowEnd: true,
  gridRowSpan: true,
  gridRowStart: true,
  gridColumn: true,
  gridColumnEnd: true,
  gridColumnSpan: true,
  gridColumnStart: true,
  fontWeight: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,
  fillOpacity: true,
  floodOpacity: true,
  stopOpacity: true,
  strokeDasharray: true,
  strokeDashoffset: true,
  strokeMiterlimit: true,
  strokeOpacity: true,
  strokeWidth: true
}, kd = ["Webkit", "ms", "Moz", "O"];
Object.keys(jd).forEach(function(a2) {
  kd.forEach(function(b2) {
    b2 = b2 + a2.charAt(0).toUpperCase() + a2.substring(1);
    jd[b2] = jd[a2];
  });
});
function ld(a2, b2, c2) {
  return null == b2 || "boolean" === typeof b2 || "" === b2 ? "" : c2 || "number" !== typeof b2 || 0 === b2 || jd.hasOwnProperty(a2) && jd[a2] ? ("" + b2).trim() : b2 + "px";
}
function md(a2, b2) {
  a2 = a2.style;
  for (var c2 in b2)
    if (b2.hasOwnProperty(c2)) {
      var d = 0 === c2.indexOf("--"), e2 = ld(c2, b2[c2], d);
      "float" === c2 && (c2 = "cssFloat");
      d ? a2.setProperty(c2, e2) : a2[c2] = e2;
    }
}
var nd = n$1({ menuitem: true }, { area: true, base: true, br: true, col: true, embed: true, hr: true, img: true, input: true, keygen: true, link: true, meta: true, param: true, source: true, track: true, wbr: true });
function od(a2, b2) {
  if (b2) {
    if (nd[a2] && (null != b2.children || null != b2.dangerouslySetInnerHTML))
      throw Error(u(137, a2, ""));
    if (null != b2.dangerouslySetInnerHTML) {
      if (null != b2.children)
        throw Error(u(60));
      if (!("object" === typeof b2.dangerouslySetInnerHTML && "__html" in b2.dangerouslySetInnerHTML))
        throw Error(u(61));
    }
    if (null != b2.style && "object" !== typeof b2.style)
      throw Error(u(62, ""));
  }
}
function pd(a2, b2) {
  if (-1 === a2.indexOf("-"))
    return "string" === typeof b2.is;
  switch (a2) {
    case "annotation-xml":
    case "color-profile":
    case "font-face":
    case "font-face-src":
    case "font-face-uri":
    case "font-face-format":
    case "font-face-name":
    case "missing-glyph":
      return false;
    default:
      return true;
  }
}
var qd = Mb.html;
function rd(a2, b2) {
  a2 = 9 === a2.nodeType || 11 === a2.nodeType ? a2 : a2.ownerDocument;
  var c2 = cc(a2);
  b2 = wa[b2];
  for (var d = 0; d < b2.length; d++)
    uc(b2[d], a2, c2);
}
function sd() {
}
function td(a2) {
  a2 = a2 || ("undefined" !== typeof document ? document : void 0);
  if ("undefined" === typeof a2)
    return null;
  try {
    return a2.activeElement || a2.body;
  } catch (b2) {
    return a2.body;
  }
}
function ud(a2) {
  for (; a2 && a2.firstChild; )
    a2 = a2.firstChild;
  return a2;
}
function vd(a2, b2) {
  var c2 = ud(a2);
  a2 = 0;
  for (var d; c2; ) {
    if (3 === c2.nodeType) {
      d = a2 + c2.textContent.length;
      if (a2 <= b2 && d >= b2)
        return { node: c2, offset: b2 - a2 };
      a2 = d;
    }
    a: {
      for (; c2; ) {
        if (c2.nextSibling) {
          c2 = c2.nextSibling;
          break a;
        }
        c2 = c2.parentNode;
      }
      c2 = void 0;
    }
    c2 = ud(c2);
  }
}
function wd(a2, b2) {
  return a2 && b2 ? a2 === b2 ? true : a2 && 3 === a2.nodeType ? false : b2 && 3 === b2.nodeType ? wd(a2, b2.parentNode) : "contains" in a2 ? a2.contains(b2) : a2.compareDocumentPosition ? !!(a2.compareDocumentPosition(b2) & 16) : false : false;
}
function xd() {
  for (var a2 = window, b2 = td(); b2 instanceof a2.HTMLIFrameElement; ) {
    try {
      var c2 = "string" === typeof b2.contentWindow.location.href;
    } catch (d) {
      c2 = false;
    }
    if (c2)
      a2 = b2.contentWindow;
    else
      break;
    b2 = td(a2.document);
  }
  return b2;
}
function yd(a2) {
  var b2 = a2 && a2.nodeName && a2.nodeName.toLowerCase();
  return b2 && ("input" === b2 && ("text" === a2.type || "search" === a2.type || "tel" === a2.type || "url" === a2.type || "password" === a2.type) || "textarea" === b2 || "true" === a2.contentEditable);
}
var zd = "$", Ad = "/$", Bd = "$?", Cd = "$!", Dd = null, Ed = null;
function Fd(a2, b2) {
  switch (a2) {
    case "button":
    case "input":
    case "select":
    case "textarea":
      return !!b2.autoFocus;
  }
  return false;
}
function Gd(a2, b2) {
  return "textarea" === a2 || "option" === a2 || "noscript" === a2 || "string" === typeof b2.children || "number" === typeof b2.children || "object" === typeof b2.dangerouslySetInnerHTML && null !== b2.dangerouslySetInnerHTML && null != b2.dangerouslySetInnerHTML.__html;
}
var Hd = "function" === typeof setTimeout ? setTimeout : void 0, Id = "function" === typeof clearTimeout ? clearTimeout : void 0;
function Jd(a2) {
  for (; null != a2; a2 = a2.nextSibling) {
    var b2 = a2.nodeType;
    if (1 === b2 || 3 === b2)
      break;
  }
  return a2;
}
function Kd(a2) {
  a2 = a2.previousSibling;
  for (var b2 = 0; a2; ) {
    if (8 === a2.nodeType) {
      var c2 = a2.data;
      if (c2 === zd || c2 === Cd || c2 === Bd) {
        if (0 === b2)
          return a2;
        b2--;
      } else
        c2 === Ad && b2++;
    }
    a2 = a2.previousSibling;
  }
  return null;
}
var Ld = Math.random().toString(36).slice(2), Md = "__reactInternalInstance$" + Ld, Nd = "__reactEventHandlers$" + Ld, Od = "__reactContainere$" + Ld;
function tc(a2) {
  var b2 = a2[Md];
  if (b2)
    return b2;
  for (var c2 = a2.parentNode; c2; ) {
    if (b2 = c2[Od] || c2[Md]) {
      c2 = b2.alternate;
      if (null !== b2.child || null !== c2 && null !== c2.child)
        for (a2 = Kd(a2); null !== a2; ) {
          if (c2 = a2[Md])
            return c2;
          a2 = Kd(a2);
        }
      return b2;
    }
    a2 = c2;
    c2 = a2.parentNode;
  }
  return null;
}
function Nc(a2) {
  a2 = a2[Md] || a2[Od];
  return !a2 || 5 !== a2.tag && 6 !== a2.tag && 13 !== a2.tag && 3 !== a2.tag ? null : a2;
}
function Pd(a2) {
  if (5 === a2.tag || 6 === a2.tag)
    return a2.stateNode;
  throw Error(u(33));
}
function Qd(a2) {
  return a2[Nd] || null;
}
function Rd(a2) {
  do
    a2 = a2.return;
  while (a2 && 5 !== a2.tag);
  return a2 ? a2 : null;
}
function Sd(a2, b2) {
  var c2 = a2.stateNode;
  if (!c2)
    return null;
  var d = la(c2);
  if (!d)
    return null;
  c2 = d[b2];
  a:
    switch (b2) {
      case "onClick":
      case "onClickCapture":
      case "onDoubleClick":
      case "onDoubleClickCapture":
      case "onMouseDown":
      case "onMouseDownCapture":
      case "onMouseMove":
      case "onMouseMoveCapture":
      case "onMouseUp":
      case "onMouseUpCapture":
      case "onMouseEnter":
        (d = !d.disabled) || (a2 = a2.type, d = !("button" === a2 || "input" === a2 || "select" === a2 || "textarea" === a2));
        a2 = !d;
        break a;
      default:
        a2 = false;
    }
  if (a2)
    return null;
  if (c2 && "function" !== typeof c2)
    throw Error(u(
      231,
      b2,
      typeof c2
    ));
  return c2;
}
function Td(a2, b2, c2) {
  if (b2 = Sd(a2, c2.dispatchConfig.phasedRegistrationNames[b2]))
    c2._dispatchListeners = ic(c2._dispatchListeners, b2), c2._dispatchInstances = ic(c2._dispatchInstances, a2);
}
function Ud(a2) {
  if (a2 && a2.dispatchConfig.phasedRegistrationNames) {
    for (var b2 = a2._targetInst, c2 = []; b2; )
      c2.push(b2), b2 = Rd(b2);
    for (b2 = c2.length; 0 < b2--; )
      Td(c2[b2], "captured", a2);
    for (b2 = 0; b2 < c2.length; b2++)
      Td(c2[b2], "bubbled", a2);
  }
}
function Vd(a2, b2, c2) {
  a2 && c2 && c2.dispatchConfig.registrationName && (b2 = Sd(a2, c2.dispatchConfig.registrationName)) && (c2._dispatchListeners = ic(c2._dispatchListeners, b2), c2._dispatchInstances = ic(c2._dispatchInstances, a2));
}
function Wd(a2) {
  a2 && a2.dispatchConfig.registrationName && Vd(a2._targetInst, null, a2);
}
function Xd(a2) {
  jc(a2, Ud);
}
var Yd = null, Zd = null, $d = null;
function ae() {
  if ($d)
    return $d;
  var a2, b2 = Zd, c2 = b2.length, d, e2 = "value" in Yd ? Yd.value : Yd.textContent, f2 = e2.length;
  for (a2 = 0; a2 < c2 && b2[a2] === e2[a2]; a2++)
    ;
  var g2 = c2 - a2;
  for (d = 1; d <= g2 && b2[c2 - d] === e2[f2 - d]; d++)
    ;
  return $d = e2.slice(a2, 1 < d ? 1 - d : void 0);
}
function be() {
  return true;
}
function ce() {
  return false;
}
function G$1(a2, b2, c2, d) {
  this.dispatchConfig = a2;
  this._targetInst = b2;
  this.nativeEvent = c2;
  a2 = this.constructor.Interface;
  for (var e2 in a2)
    a2.hasOwnProperty(e2) && ((b2 = a2[e2]) ? this[e2] = b2(c2) : "target" === e2 ? this.target = d : this[e2] = c2[e2]);
  this.isDefaultPrevented = (null != c2.defaultPrevented ? c2.defaultPrevented : false === c2.returnValue) ? be : ce;
  this.isPropagationStopped = ce;
  return this;
}
n$1(G$1.prototype, { preventDefault: function() {
  this.defaultPrevented = true;
  var a2 = this.nativeEvent;
  a2 && (a2.preventDefault ? a2.preventDefault() : "unknown" !== typeof a2.returnValue && (a2.returnValue = false), this.isDefaultPrevented = be);
}, stopPropagation: function() {
  var a2 = this.nativeEvent;
  a2 && (a2.stopPropagation ? a2.stopPropagation() : "unknown" !== typeof a2.cancelBubble && (a2.cancelBubble = true), this.isPropagationStopped = be);
}, persist: function() {
  this.isPersistent = be;
}, isPersistent: ce, destructor: function() {
  var a2 = this.constructor.Interface, b2;
  for (b2 in a2)
    this[b2] = null;
  this.nativeEvent = this._targetInst = this.dispatchConfig = null;
  this.isPropagationStopped = this.isDefaultPrevented = ce;
  this._dispatchInstances = this._dispatchListeners = null;
} });
G$1.Interface = { type: null, target: null, currentTarget: function() {
  return null;
}, eventPhase: null, bubbles: null, cancelable: null, timeStamp: function(a2) {
  return a2.timeStamp || Date.now();
}, defaultPrevented: null, isTrusted: null };
G$1.extend = function(a2) {
  function b2() {
  }
  function c2() {
    return d.apply(this, arguments);
  }
  var d = this;
  b2.prototype = d.prototype;
  var e2 = new b2();
  n$1(e2, c2.prototype);
  c2.prototype = e2;
  c2.prototype.constructor = c2;
  c2.Interface = n$1({}, d.Interface, a2);
  c2.extend = d.extend;
  de(c2);
  return c2;
};
de(G$1);
function ee$1(a2, b2, c2, d) {
  if (this.eventPool.length) {
    var e2 = this.eventPool.pop();
    this.call(e2, a2, b2, c2, d);
    return e2;
  }
  return new this(a2, b2, c2, d);
}
function fe(a2) {
  if (!(a2 instanceof this))
    throw Error(u(279));
  a2.destructor();
  10 > this.eventPool.length && this.eventPool.push(a2);
}
function de(a2) {
  a2.eventPool = [];
  a2.getPooled = ee$1;
  a2.release = fe;
}
var ge = G$1.extend({ data: null }), he = G$1.extend({ data: null }), ie$1 = [9, 13, 27, 32], je = ya && "CompositionEvent" in window, ke = null;
ya && "documentMode" in document && (ke = document.documentMode);
var le = ya && "TextEvent" in window && !ke, me = ya && (!je || ke && 8 < ke && 11 >= ke), ne = String.fromCharCode(32), oe = { beforeInput: { phasedRegistrationNames: { bubbled: "onBeforeInput", captured: "onBeforeInputCapture" }, dependencies: ["compositionend", "keypress", "textInput", "paste"] }, compositionEnd: { phasedRegistrationNames: { bubbled: "onCompositionEnd", captured: "onCompositionEndCapture" }, dependencies: "blur compositionend keydown keypress keyup mousedown".split(" ") }, compositionStart: { phasedRegistrationNames: {
  bubbled: "onCompositionStart",
  captured: "onCompositionStartCapture"
}, dependencies: "blur compositionstart keydown keypress keyup mousedown".split(" ") }, compositionUpdate: { phasedRegistrationNames: { bubbled: "onCompositionUpdate", captured: "onCompositionUpdateCapture" }, dependencies: "blur compositionupdate keydown keypress keyup mousedown".split(" ") } }, pe = false;
function qe(a2, b2) {
  switch (a2) {
    case "keyup":
      return -1 !== ie$1.indexOf(b2.keyCode);
    case "keydown":
      return 229 !== b2.keyCode;
    case "keypress":
    case "mousedown":
    case "blur":
      return true;
    default:
      return false;
  }
}
function re(a2) {
  a2 = a2.detail;
  return "object" === typeof a2 && "data" in a2 ? a2.data : null;
}
var se = false;
function te$1(a2, b2) {
  switch (a2) {
    case "compositionend":
      return re(b2);
    case "keypress":
      if (32 !== b2.which)
        return null;
      pe = true;
      return ne;
    case "textInput":
      return a2 = b2.data, a2 === ne && pe ? null : a2;
    default:
      return null;
  }
}
function ue(a2, b2) {
  if (se)
    return "compositionend" === a2 || !je && qe(a2, b2) ? (a2 = ae(), $d = Zd = Yd = null, se = false, a2) : null;
  switch (a2) {
    case "paste":
      return null;
    case "keypress":
      if (!(b2.ctrlKey || b2.altKey || b2.metaKey) || b2.ctrlKey && b2.altKey) {
        if (b2.char && 1 < b2.char.length)
          return b2.char;
        if (b2.which)
          return String.fromCharCode(b2.which);
      }
      return null;
    case "compositionend":
      return me && "ko" !== b2.locale ? null : b2.data;
    default:
      return null;
  }
}
var ve = { eventTypes: oe, extractEvents: function(a2, b2, c2, d) {
  var e2;
  if (je)
    b: {
      switch (a2) {
        case "compositionstart":
          var f2 = oe.compositionStart;
          break b;
        case "compositionend":
          f2 = oe.compositionEnd;
          break b;
        case "compositionupdate":
          f2 = oe.compositionUpdate;
          break b;
      }
      f2 = void 0;
    }
  else
    se ? qe(a2, c2) && (f2 = oe.compositionEnd) : "keydown" === a2 && 229 === c2.keyCode && (f2 = oe.compositionStart);
  f2 ? (me && "ko" !== c2.locale && (se || f2 !== oe.compositionStart ? f2 === oe.compositionEnd && se && (e2 = ae()) : (Yd = d, Zd = "value" in Yd ? Yd.value : Yd.textContent, se = true)), f2 = ge.getPooled(
    f2,
    b2,
    c2,
    d
  ), e2 ? f2.data = e2 : (e2 = re(c2), null !== e2 && (f2.data = e2)), Xd(f2), e2 = f2) : e2 = null;
  (a2 = le ? te$1(a2, c2) : ue(a2, c2)) ? (b2 = he.getPooled(oe.beforeInput, b2, c2, d), b2.data = a2, Xd(b2)) : b2 = null;
  return null === e2 ? b2 : null === b2 ? e2 : [e2, b2];
} }, we = { color: true, date: true, datetime: true, "datetime-local": true, email: true, month: true, number: true, password: true, range: true, search: true, tel: true, text: true, time: true, url: true, week: true };
function xe(a2) {
  var b2 = a2 && a2.nodeName && a2.nodeName.toLowerCase();
  return "input" === b2 ? !!we[a2.type] : "textarea" === b2 ? true : false;
}
var ye = { change: { phasedRegistrationNames: { bubbled: "onChange", captured: "onChangeCapture" }, dependencies: "blur change click focus input keydown keyup selectionchange".split(" ") } };
function ze(a2, b2, c2) {
  a2 = G$1.getPooled(ye.change, a2, b2, c2);
  a2.type = "change";
  Da(c2);
  Xd(a2);
  return a2;
}
var Ae = null, Be = null;
function Ce(a2) {
  mc(a2);
}
function De(a2) {
  var b2 = Pd(a2);
  if (yb(b2))
    return a2;
}
function Ee(a2, b2) {
  if ("change" === a2)
    return b2;
}
var Fe = false;
ya && (Fe = oc("input") && (!document.documentMode || 9 < document.documentMode));
function Ge() {
  Ae && (Ae.detachEvent("onpropertychange", He), Be = Ae = null);
}
function He(a2) {
  if ("value" === a2.propertyName && De(Be))
    if (a2 = ze(Be, a2, nc(a2)), Ja)
      mc(a2);
    else {
      Ja = true;
      try {
        Fa(Ce, a2);
      } finally {
        Ja = false, La();
      }
    }
}
function Ie(a2, b2, c2) {
  "focus" === a2 ? (Ge(), Ae = b2, Be = c2, Ae.attachEvent("onpropertychange", He)) : "blur" === a2 && Ge();
}
function Je(a2) {
  if ("selectionchange" === a2 || "keyup" === a2 || "keydown" === a2)
    return De(Be);
}
function Ke(a2, b2) {
  if ("click" === a2)
    return De(b2);
}
function Le(a2, b2) {
  if ("input" === a2 || "change" === a2)
    return De(b2);
}
var Me = { eventTypes: ye, _isInputEventSupported: Fe, extractEvents: function(a2, b2, c2, d) {
  var e2 = b2 ? Pd(b2) : window, f2 = e2.nodeName && e2.nodeName.toLowerCase();
  if ("select" === f2 || "input" === f2 && "file" === e2.type)
    var g2 = Ee;
  else if (xe(e2))
    if (Fe)
      g2 = Le;
    else {
      g2 = Je;
      var h2 = Ie;
    }
  else
    (f2 = e2.nodeName) && "input" === f2.toLowerCase() && ("checkbox" === e2.type || "radio" === e2.type) && (g2 = Ke);
  if (g2 && (g2 = g2(a2, b2)))
    return ze(g2, c2, d);
  h2 && h2(a2, e2, b2);
  "blur" === a2 && (a2 = e2._wrapperState) && a2.controlled && "number" === e2.type && Db(e2, "number", e2.value);
} }, Ne = G$1.extend({ view: null, detail: null }), Oe = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
function Pe(a2) {
  var b2 = this.nativeEvent;
  return b2.getModifierState ? b2.getModifierState(a2) : (a2 = Oe[a2]) ? !!b2[a2] : false;
}
function Qe() {
  return Pe;
}
var Re = 0, Se = 0, Te = false, Ue = false, Ve = Ne.extend({ screenX: null, screenY: null, clientX: null, clientY: null, pageX: null, pageY: null, ctrlKey: null, shiftKey: null, altKey: null, metaKey: null, getModifierState: Qe, button: null, buttons: null, relatedTarget: function(a2) {
  return a2.relatedTarget || (a2.fromElement === a2.srcElement ? a2.toElement : a2.fromElement);
}, movementX: function(a2) {
  if ("movementX" in a2)
    return a2.movementX;
  var b2 = Re;
  Re = a2.screenX;
  return Te ? "mousemove" === a2.type ? a2.screenX - b2 : 0 : (Te = true, 0);
}, movementY: function(a2) {
  if ("movementY" in a2)
    return a2.movementY;
  var b2 = Se;
  Se = a2.screenY;
  return Ue ? "mousemove" === a2.type ? a2.screenY - b2 : 0 : (Ue = true, 0);
} }), We = Ve.extend({ pointerId: null, width: null, height: null, pressure: null, tangentialPressure: null, tiltX: null, tiltY: null, twist: null, pointerType: null, isPrimary: null }), Xe = { mouseEnter: { registrationName: "onMouseEnter", dependencies: ["mouseout", "mouseover"] }, mouseLeave: { registrationName: "onMouseLeave", dependencies: ["mouseout", "mouseover"] }, pointerEnter: { registrationName: "onPointerEnter", dependencies: ["pointerout", "pointerover"] }, pointerLeave: {
  registrationName: "onPointerLeave",
  dependencies: ["pointerout", "pointerover"]
} }, Ye = { eventTypes: Xe, extractEvents: function(a2, b2, c2, d, e2) {
  var f2 = "mouseover" === a2 || "pointerover" === a2, g2 = "mouseout" === a2 || "pointerout" === a2;
  if (f2 && 0 === (e2 & 32) && (c2.relatedTarget || c2.fromElement) || !g2 && !f2)
    return null;
  f2 = d.window === d ? d : (f2 = d.ownerDocument) ? f2.defaultView || f2.parentWindow : window;
  if (g2) {
    if (g2 = b2, b2 = (b2 = c2.relatedTarget || c2.toElement) ? tc(b2) : null, null !== b2) {
      var h2 = dc(b2);
      if (b2 !== h2 || 5 !== b2.tag && 6 !== b2.tag)
        b2 = null;
    }
  } else
    g2 = null;
  if (g2 === b2)
    return null;
  if ("mouseout" === a2 || "mouseover" === a2) {
    var k2 = Ve;
    var l2 = Xe.mouseLeave;
    var m2 = Xe.mouseEnter;
    var p2 = "mouse";
  } else if ("pointerout" === a2 || "pointerover" === a2)
    k2 = We, l2 = Xe.pointerLeave, m2 = Xe.pointerEnter, p2 = "pointer";
  a2 = null == g2 ? f2 : Pd(g2);
  f2 = null == b2 ? f2 : Pd(b2);
  l2 = k2.getPooled(l2, g2, c2, d);
  l2.type = p2 + "leave";
  l2.target = a2;
  l2.relatedTarget = f2;
  c2 = k2.getPooled(m2, b2, c2, d);
  c2.type = p2 + "enter";
  c2.target = f2;
  c2.relatedTarget = a2;
  d = g2;
  p2 = b2;
  if (d && p2)
    a: {
      k2 = d;
      m2 = p2;
      g2 = 0;
      for (a2 = k2; a2; a2 = Rd(a2))
        g2++;
      a2 = 0;
      for (b2 = m2; b2; b2 = Rd(b2))
        a2++;
      for (; 0 < g2 - a2; )
        k2 = Rd(k2), g2--;
      for (; 0 < a2 - g2; )
        m2 = Rd(m2), a2--;
      for (; g2--; ) {
        if (k2 === m2 || k2 === m2.alternate)
          break a;
        k2 = Rd(k2);
        m2 = Rd(m2);
      }
      k2 = null;
    }
  else
    k2 = null;
  m2 = k2;
  for (k2 = []; d && d !== m2; ) {
    g2 = d.alternate;
    if (null !== g2 && g2 === m2)
      break;
    k2.push(d);
    d = Rd(d);
  }
  for (d = []; p2 && p2 !== m2; ) {
    g2 = p2.alternate;
    if (null !== g2 && g2 === m2)
      break;
    d.push(p2);
    p2 = Rd(p2);
  }
  for (p2 = 0; p2 < k2.length; p2++)
    Vd(k2[p2], "bubbled", l2);
  for (p2 = d.length; 0 < p2--; )
    Vd(d[p2], "captured", c2);
  return 0 === (e2 & 64) ? [l2] : [l2, c2];
} };
function Ze(a2, b2) {
  return a2 === b2 && (0 !== a2 || 1 / a2 === 1 / b2) || a2 !== a2 && b2 !== b2;
}
var $e = "function" === typeof Object.is ? Object.is : Ze, af = Object.prototype.hasOwnProperty;
function bf(a2, b2) {
  if ($e(a2, b2))
    return true;
  if ("object" !== typeof a2 || null === a2 || "object" !== typeof b2 || null === b2)
    return false;
  var c2 = Object.keys(a2), d = Object.keys(b2);
  if (c2.length !== d.length)
    return false;
  for (d = 0; d < c2.length; d++)
    if (!af.call(b2, c2[d]) || !$e(a2[c2[d]], b2[c2[d]]))
      return false;
  return true;
}
var cf = ya && "documentMode" in document && 11 >= document.documentMode, df = { select: { phasedRegistrationNames: { bubbled: "onSelect", captured: "onSelectCapture" }, dependencies: "blur contextmenu dragend focus keydown keyup mousedown mouseup selectionchange".split(" ") } }, ef = null, ff = null, gf = null, hf = false;
function jf(a2, b2) {
  var c2 = b2.window === b2 ? b2.document : 9 === b2.nodeType ? b2 : b2.ownerDocument;
  if (hf || null == ef || ef !== td(c2))
    return null;
  c2 = ef;
  "selectionStart" in c2 && yd(c2) ? c2 = { start: c2.selectionStart, end: c2.selectionEnd } : (c2 = (c2.ownerDocument && c2.ownerDocument.defaultView || window).getSelection(), c2 = { anchorNode: c2.anchorNode, anchorOffset: c2.anchorOffset, focusNode: c2.focusNode, focusOffset: c2.focusOffset });
  return gf && bf(gf, c2) ? null : (gf = c2, a2 = G$1.getPooled(df.select, ff, a2, b2), a2.type = "select", a2.target = ef, Xd(a2), a2);
}
var kf = { eventTypes: df, extractEvents: function(a2, b2, c2, d, e2, f2) {
  e2 = f2 || (d.window === d ? d.document : 9 === d.nodeType ? d : d.ownerDocument);
  if (!(f2 = !e2)) {
    a: {
      e2 = cc(e2);
      f2 = wa.onSelect;
      for (var g2 = 0; g2 < f2.length; g2++)
        if (!e2.has(f2[g2])) {
          e2 = false;
          break a;
        }
      e2 = true;
    }
    f2 = !e2;
  }
  if (f2)
    return null;
  e2 = b2 ? Pd(b2) : window;
  switch (a2) {
    case "focus":
      if (xe(e2) || "true" === e2.contentEditable)
        ef = e2, ff = b2, gf = null;
      break;
    case "blur":
      gf = ff = ef = null;
      break;
    case "mousedown":
      hf = true;
      break;
    case "contextmenu":
    case "mouseup":
    case "dragend":
      return hf = false, jf(c2, d);
    case "selectionchange":
      if (cf)
        break;
    case "keydown":
    case "keyup":
      return jf(c2, d);
  }
  return null;
} }, lf = G$1.extend({ animationName: null, elapsedTime: null, pseudoElement: null }), mf = G$1.extend({ clipboardData: function(a2) {
  return "clipboardData" in a2 ? a2.clipboardData : window.clipboardData;
} }), nf = Ne.extend({ relatedTarget: null });
function of(a2) {
  var b2 = a2.keyCode;
  "charCode" in a2 ? (a2 = a2.charCode, 0 === a2 && 13 === b2 && (a2 = 13)) : a2 = b2;
  10 === a2 && (a2 = 13);
  return 32 <= a2 || 13 === a2 ? a2 : 0;
}
var pf = { Esc: "Escape", Spacebar: " ", Left: "ArrowLeft", Up: "ArrowUp", Right: "ArrowRight", Down: "ArrowDown", Del: "Delete", Win: "OS", Menu: "ContextMenu", Apps: "ContextMenu", Scroll: "ScrollLock", MozPrintableKey: "Unidentified" }, qf = {
  8: "Backspace",
  9: "Tab",
  12: "Clear",
  13: "Enter",
  16: "Shift",
  17: "Control",
  18: "Alt",
  19: "Pause",
  20: "CapsLock",
  27: "Escape",
  32: " ",
  33: "PageUp",
  34: "PageDown",
  35: "End",
  36: "Home",
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",
  45: "Insert",
  46: "Delete",
  112: "F1",
  113: "F2",
  114: "F3",
  115: "F4",
  116: "F5",
  117: "F6",
  118: "F7",
  119: "F8",
  120: "F9",
  121: "F10",
  122: "F11",
  123: "F12",
  144: "NumLock",
  145: "ScrollLock",
  224: "Meta"
}, rf = Ne.extend({ key: function(a2) {
  if (a2.key) {
    var b2 = pf[a2.key] || a2.key;
    if ("Unidentified" !== b2)
      return b2;
  }
  return "keypress" === a2.type ? (a2 = of(a2), 13 === a2 ? "Enter" : String.fromCharCode(a2)) : "keydown" === a2.type || "keyup" === a2.type ? qf[a2.keyCode] || "Unidentified" : "";
}, location: null, ctrlKey: null, shiftKey: null, altKey: null, metaKey: null, repeat: null, locale: null, getModifierState: Qe, charCode: function(a2) {
  return "keypress" === a2.type ? of(a2) : 0;
}, keyCode: function(a2) {
  return "keydown" === a2.type || "keyup" === a2.type ? a2.keyCode : 0;
}, which: function(a2) {
  return "keypress" === a2.type ? of(a2) : "keydown" === a2.type || "keyup" === a2.type ? a2.keyCode : 0;
} }), sf = Ve.extend({ dataTransfer: null }), tf = Ne.extend({ touches: null, targetTouches: null, changedTouches: null, altKey: null, metaKey: null, ctrlKey: null, shiftKey: null, getModifierState: Qe }), uf = G$1.extend({ propertyName: null, elapsedTime: null, pseudoElement: null }), vf = Ve.extend({ deltaX: function(a2) {
  return "deltaX" in a2 ? a2.deltaX : "wheelDeltaX" in a2 ? -a2.wheelDeltaX : 0;
}, deltaY: function(a2) {
  return "deltaY" in a2 ? a2.deltaY : "wheelDeltaY" in a2 ? -a2.wheelDeltaY : "wheelDelta" in a2 ? -a2.wheelDelta : 0;
}, deltaZ: null, deltaMode: null }), wf = { eventTypes: Wc, extractEvents: function(a2, b2, c2, d) {
  var e2 = Yc.get(a2);
  if (!e2)
    return null;
  switch (a2) {
    case "keypress":
      if (0 === of(c2))
        return null;
    case "keydown":
    case "keyup":
      a2 = rf;
      break;
    case "blur":
    case "focus":
      a2 = nf;
      break;
    case "click":
      if (2 === c2.button)
        return null;
    case "auxclick":
    case "dblclick":
    case "mousedown":
    case "mousemove":
    case "mouseup":
    case "mouseout":
    case "mouseover":
    case "contextmenu":
      a2 = Ve;
      break;
    case "drag":
    case "dragend":
    case "dragenter":
    case "dragexit":
    case "dragleave":
    case "dragover":
    case "dragstart":
    case "drop":
      a2 = sf;
      break;
    case "touchcancel":
    case "touchend":
    case "touchmove":
    case "touchstart":
      a2 = tf;
      break;
    case Xb:
    case Yb:
    case Zb:
      a2 = lf;
      break;
    case $b:
      a2 = uf;
      break;
    case "scroll":
      a2 = Ne;
      break;
    case "wheel":
      a2 = vf;
      break;
    case "copy":
    case "cut":
    case "paste":
      a2 = mf;
      break;
    case "gotpointercapture":
    case "lostpointercapture":
    case "pointercancel":
    case "pointerdown":
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "pointerup":
      a2 = We;
      break;
    default:
      a2 = G$1;
  }
  b2 = a2.getPooled(e2, b2, c2, d);
  Xd(b2);
  return b2;
} };
if (pa)
  throw Error(u(101));
pa = Array.prototype.slice.call("ResponderEventPlugin SimpleEventPlugin EnterLeaveEventPlugin ChangeEventPlugin SelectEventPlugin BeforeInputEventPlugin".split(" "));
ra();
var xf = Nc;
la = Qd;
ma = xf;
na = Pd;
xa({ SimpleEventPlugin: wf, EnterLeaveEventPlugin: Ye, ChangeEventPlugin: Me, SelectEventPlugin: kf, BeforeInputEventPlugin: ve });
var yf = [], zf = -1;
function H$1(a2) {
  0 > zf || (a2.current = yf[zf], yf[zf] = null, zf--);
}
function I$1(a2, b2) {
  zf++;
  yf[zf] = a2.current;
  a2.current = b2;
}
var Af = {}, J$1 = { current: Af }, K$1 = { current: false }, Bf = Af;
function Cf(a2, b2) {
  var c2 = a2.type.contextTypes;
  if (!c2)
    return Af;
  var d = a2.stateNode;
  if (d && d.__reactInternalMemoizedUnmaskedChildContext === b2)
    return d.__reactInternalMemoizedMaskedChildContext;
  var e2 = {}, f2;
  for (f2 in c2)
    e2[f2] = b2[f2];
  d && (a2 = a2.stateNode, a2.__reactInternalMemoizedUnmaskedChildContext = b2, a2.__reactInternalMemoizedMaskedChildContext = e2);
  return e2;
}
function L$1(a2) {
  a2 = a2.childContextTypes;
  return null !== a2 && void 0 !== a2;
}
function Df() {
  H$1(K$1);
  H$1(J$1);
}
function Ef(a2, b2, c2) {
  if (J$1.current !== Af)
    throw Error(u(168));
  I$1(J$1, b2);
  I$1(K$1, c2);
}
function Ff(a2, b2, c2) {
  var d = a2.stateNode;
  a2 = b2.childContextTypes;
  if ("function" !== typeof d.getChildContext)
    return c2;
  d = d.getChildContext();
  for (var e2 in d)
    if (!(e2 in a2))
      throw Error(u(108, pb(b2) || "Unknown", e2));
  return n$1({}, c2, {}, d);
}
function Gf(a2) {
  a2 = (a2 = a2.stateNode) && a2.__reactInternalMemoizedMergedChildContext || Af;
  Bf = J$1.current;
  I$1(J$1, a2);
  I$1(K$1, K$1.current);
  return true;
}
function Hf(a2, b2, c2) {
  var d = a2.stateNode;
  if (!d)
    throw Error(u(169));
  c2 ? (a2 = Ff(a2, b2, Bf), d.__reactInternalMemoizedMergedChildContext = a2, H$1(K$1), H$1(J$1), I$1(J$1, a2)) : H$1(K$1);
  I$1(K$1, c2);
}
var If = r$1.unstable_runWithPriority, Jf = r$1.unstable_scheduleCallback, Kf = r$1.unstable_cancelCallback, Lf = r$1.unstable_requestPaint, Mf = r$1.unstable_now, Nf = r$1.unstable_getCurrentPriorityLevel, Of = r$1.unstable_ImmediatePriority, Pf = r$1.unstable_UserBlockingPriority, Qf = r$1.unstable_NormalPriority, Rf = r$1.unstable_LowPriority, Sf = r$1.unstable_IdlePriority, Tf = {}, Uf = r$1.unstable_shouldYield, Vf = void 0 !== Lf ? Lf : function() {
}, Wf = null, Xf = null, Yf = false, Zf = Mf(), $f = 1e4 > Zf ? Mf : function() {
  return Mf() - Zf;
};
function ag() {
  switch (Nf()) {
    case Of:
      return 99;
    case Pf:
      return 98;
    case Qf:
      return 97;
    case Rf:
      return 96;
    case Sf:
      return 95;
    default:
      throw Error(u(332));
  }
}
function bg(a2) {
  switch (a2) {
    case 99:
      return Of;
    case 98:
      return Pf;
    case 97:
      return Qf;
    case 96:
      return Rf;
    case 95:
      return Sf;
    default:
      throw Error(u(332));
  }
}
function cg(a2, b2) {
  a2 = bg(a2);
  return If(a2, b2);
}
function dg(a2, b2, c2) {
  a2 = bg(a2);
  return Jf(a2, b2, c2);
}
function eg(a2) {
  null === Wf ? (Wf = [a2], Xf = Jf(Of, fg)) : Wf.push(a2);
  return Tf;
}
function gg() {
  if (null !== Xf) {
    var a2 = Xf;
    Xf = null;
    Kf(a2);
  }
  fg();
}
function fg() {
  if (!Yf && null !== Wf) {
    Yf = true;
    var a2 = 0;
    try {
      var b2 = Wf;
      cg(99, function() {
        for (; a2 < b2.length; a2++) {
          var c2 = b2[a2];
          do
            c2 = c2(true);
          while (null !== c2);
        }
      });
      Wf = null;
    } catch (c2) {
      throw null !== Wf && (Wf = Wf.slice(a2 + 1)), Jf(Of, gg), c2;
    } finally {
      Yf = false;
    }
  }
}
function hg(a2, b2, c2) {
  c2 /= 10;
  return 1073741821 - (((1073741821 - a2 + b2 / 10) / c2 | 0) + 1) * c2;
}
function ig(a2, b2) {
  if (a2 && a2.defaultProps) {
    b2 = n$1({}, b2);
    a2 = a2.defaultProps;
    for (var c2 in a2)
      void 0 === b2[c2] && (b2[c2] = a2[c2]);
  }
  return b2;
}
var jg = { current: null }, kg = null, lg = null, mg = null;
function ng() {
  mg = lg = kg = null;
}
function og(a2) {
  var b2 = jg.current;
  H$1(jg);
  a2.type._context._currentValue = b2;
}
function pg(a2, b2) {
  for (; null !== a2; ) {
    var c2 = a2.alternate;
    if (a2.childExpirationTime < b2)
      a2.childExpirationTime = b2, null !== c2 && c2.childExpirationTime < b2 && (c2.childExpirationTime = b2);
    else if (null !== c2 && c2.childExpirationTime < b2)
      c2.childExpirationTime = b2;
    else
      break;
    a2 = a2.return;
  }
}
function qg(a2, b2) {
  kg = a2;
  mg = lg = null;
  a2 = a2.dependencies;
  null !== a2 && null !== a2.firstContext && (a2.expirationTime >= b2 && (rg = true), a2.firstContext = null);
}
function sg(a2, b2) {
  if (mg !== a2 && false !== b2 && 0 !== b2) {
    if ("number" !== typeof b2 || 1073741823 === b2)
      mg = a2, b2 = 1073741823;
    b2 = { context: a2, observedBits: b2, next: null };
    if (null === lg) {
      if (null === kg)
        throw Error(u(308));
      lg = b2;
      kg.dependencies = { expirationTime: 0, firstContext: b2, responders: null };
    } else
      lg = lg.next = b2;
  }
  return a2._currentValue;
}
var tg = false;
function ug(a2) {
  a2.updateQueue = { baseState: a2.memoizedState, baseQueue: null, shared: { pending: null }, effects: null };
}
function vg(a2, b2) {
  a2 = a2.updateQueue;
  b2.updateQueue === a2 && (b2.updateQueue = { baseState: a2.baseState, baseQueue: a2.baseQueue, shared: a2.shared, effects: a2.effects });
}
function wg(a2, b2) {
  a2 = { expirationTime: a2, suspenseConfig: b2, tag: 0, payload: null, callback: null, next: null };
  return a2.next = a2;
}
function xg(a2, b2) {
  a2 = a2.updateQueue;
  if (null !== a2) {
    a2 = a2.shared;
    var c2 = a2.pending;
    null === c2 ? b2.next = b2 : (b2.next = c2.next, c2.next = b2);
    a2.pending = b2;
  }
}
function yg(a2, b2) {
  var c2 = a2.alternate;
  null !== c2 && vg(c2, a2);
  a2 = a2.updateQueue;
  c2 = a2.baseQueue;
  null === c2 ? (a2.baseQueue = b2.next = b2, b2.next = b2) : (b2.next = c2.next, c2.next = b2);
}
function zg(a2, b2, c2, d) {
  var e2 = a2.updateQueue;
  tg = false;
  var f2 = e2.baseQueue, g2 = e2.shared.pending;
  if (null !== g2) {
    if (null !== f2) {
      var h2 = f2.next;
      f2.next = g2.next;
      g2.next = h2;
    }
    f2 = g2;
    e2.shared.pending = null;
    h2 = a2.alternate;
    null !== h2 && (h2 = h2.updateQueue, null !== h2 && (h2.baseQueue = g2));
  }
  if (null !== f2) {
    h2 = f2.next;
    var k2 = e2.baseState, l2 = 0, m2 = null, p2 = null, x2 = null;
    if (null !== h2) {
      var z2 = h2;
      do {
        g2 = z2.expirationTime;
        if (g2 < d) {
          var ca = { expirationTime: z2.expirationTime, suspenseConfig: z2.suspenseConfig, tag: z2.tag, payload: z2.payload, callback: z2.callback, next: null };
          null === x2 ? (p2 = x2 = ca, m2 = k2) : x2 = x2.next = ca;
          g2 > l2 && (l2 = g2);
        } else {
          null !== x2 && (x2 = x2.next = { expirationTime: 1073741823, suspenseConfig: z2.suspenseConfig, tag: z2.tag, payload: z2.payload, callback: z2.callback, next: null });
          Ag(g2, z2.suspenseConfig);
          a: {
            var D2 = a2, t2 = z2;
            g2 = b2;
            ca = c2;
            switch (t2.tag) {
              case 1:
                D2 = t2.payload;
                if ("function" === typeof D2) {
                  k2 = D2.call(ca, k2, g2);
                  break a;
                }
                k2 = D2;
                break a;
              case 3:
                D2.effectTag = D2.effectTag & -4097 | 64;
              case 0:
                D2 = t2.payload;
                g2 = "function" === typeof D2 ? D2.call(ca, k2, g2) : D2;
                if (null === g2 || void 0 === g2)
                  break a;
                k2 = n$1({}, k2, g2);
                break a;
              case 2:
                tg = true;
            }
          }
          null !== z2.callback && (a2.effectTag |= 32, g2 = e2.effects, null === g2 ? e2.effects = [z2] : g2.push(z2));
        }
        z2 = z2.next;
        if (null === z2 || z2 === h2)
          if (g2 = e2.shared.pending, null === g2)
            break;
          else
            z2 = f2.next = g2.next, g2.next = h2, e2.baseQueue = f2 = g2, e2.shared.pending = null;
      } while (1);
    }
    null === x2 ? m2 = k2 : x2.next = p2;
    e2.baseState = m2;
    e2.baseQueue = x2;
    Bg(l2);
    a2.expirationTime = l2;
    a2.memoizedState = k2;
  }
}
function Cg(a2, b2, c2) {
  a2 = b2.effects;
  b2.effects = null;
  if (null !== a2)
    for (b2 = 0; b2 < a2.length; b2++) {
      var d = a2[b2], e2 = d.callback;
      if (null !== e2) {
        d.callback = null;
        d = e2;
        e2 = c2;
        if ("function" !== typeof d)
          throw Error(u(191, d));
        d.call(e2);
      }
    }
}
var Dg = Wa.ReactCurrentBatchConfig, Eg = new aa.Component().refs;
function Fg(a2, b2, c2, d) {
  b2 = a2.memoizedState;
  c2 = c2(d, b2);
  c2 = null === c2 || void 0 === c2 ? b2 : n$1({}, b2, c2);
  a2.memoizedState = c2;
  0 === a2.expirationTime && (a2.updateQueue.baseState = c2);
}
var Jg = { isMounted: function(a2) {
  return (a2 = a2._reactInternalFiber) ? dc(a2) === a2 : false;
}, enqueueSetState: function(a2, b2, c2) {
  a2 = a2._reactInternalFiber;
  var d = Gg(), e2 = Dg.suspense;
  d = Hg(d, a2, e2);
  e2 = wg(d, e2);
  e2.payload = b2;
  void 0 !== c2 && null !== c2 && (e2.callback = c2);
  xg(a2, e2);
  Ig(a2, d);
}, enqueueReplaceState: function(a2, b2, c2) {
  a2 = a2._reactInternalFiber;
  var d = Gg(), e2 = Dg.suspense;
  d = Hg(d, a2, e2);
  e2 = wg(d, e2);
  e2.tag = 1;
  e2.payload = b2;
  void 0 !== c2 && null !== c2 && (e2.callback = c2);
  xg(a2, e2);
  Ig(a2, d);
}, enqueueForceUpdate: function(a2, b2) {
  a2 = a2._reactInternalFiber;
  var c2 = Gg(), d = Dg.suspense;
  c2 = Hg(c2, a2, d);
  d = wg(c2, d);
  d.tag = 2;
  void 0 !== b2 && null !== b2 && (d.callback = b2);
  xg(a2, d);
  Ig(a2, c2);
} };
function Kg(a2, b2, c2, d, e2, f2, g2) {
  a2 = a2.stateNode;
  return "function" === typeof a2.shouldComponentUpdate ? a2.shouldComponentUpdate(d, f2, g2) : b2.prototype && b2.prototype.isPureReactComponent ? !bf(c2, d) || !bf(e2, f2) : true;
}
function Lg(a2, b2, c2) {
  var d = false, e2 = Af;
  var f2 = b2.contextType;
  "object" === typeof f2 && null !== f2 ? f2 = sg(f2) : (e2 = L$1(b2) ? Bf : J$1.current, d = b2.contextTypes, f2 = (d = null !== d && void 0 !== d) ? Cf(a2, e2) : Af);
  b2 = new b2(c2, f2);
  a2.memoizedState = null !== b2.state && void 0 !== b2.state ? b2.state : null;
  b2.updater = Jg;
  a2.stateNode = b2;
  b2._reactInternalFiber = a2;
  d && (a2 = a2.stateNode, a2.__reactInternalMemoizedUnmaskedChildContext = e2, a2.__reactInternalMemoizedMaskedChildContext = f2);
  return b2;
}
function Mg(a2, b2, c2, d) {
  a2 = b2.state;
  "function" === typeof b2.componentWillReceiveProps && b2.componentWillReceiveProps(c2, d);
  "function" === typeof b2.UNSAFE_componentWillReceiveProps && b2.UNSAFE_componentWillReceiveProps(c2, d);
  b2.state !== a2 && Jg.enqueueReplaceState(b2, b2.state, null);
}
function Ng(a2, b2, c2, d) {
  var e2 = a2.stateNode;
  e2.props = c2;
  e2.state = a2.memoizedState;
  e2.refs = Eg;
  ug(a2);
  var f2 = b2.contextType;
  "object" === typeof f2 && null !== f2 ? e2.context = sg(f2) : (f2 = L$1(b2) ? Bf : J$1.current, e2.context = Cf(a2, f2));
  zg(a2, c2, e2, d);
  e2.state = a2.memoizedState;
  f2 = b2.getDerivedStateFromProps;
  "function" === typeof f2 && (Fg(a2, b2, f2, c2), e2.state = a2.memoizedState);
  "function" === typeof b2.getDerivedStateFromProps || "function" === typeof e2.getSnapshotBeforeUpdate || "function" !== typeof e2.UNSAFE_componentWillMount && "function" !== typeof e2.componentWillMount || (b2 = e2.state, "function" === typeof e2.componentWillMount && e2.componentWillMount(), "function" === typeof e2.UNSAFE_componentWillMount && e2.UNSAFE_componentWillMount(), b2 !== e2.state && Jg.enqueueReplaceState(e2, e2.state, null), zg(a2, c2, e2, d), e2.state = a2.memoizedState);
  "function" === typeof e2.componentDidMount && (a2.effectTag |= 4);
}
var Og = Array.isArray;
function Pg(a2, b2, c2) {
  a2 = c2.ref;
  if (null !== a2 && "function" !== typeof a2 && "object" !== typeof a2) {
    if (c2._owner) {
      c2 = c2._owner;
      if (c2) {
        if (1 !== c2.tag)
          throw Error(u(309));
        var d = c2.stateNode;
      }
      if (!d)
        throw Error(u(147, a2));
      var e2 = "" + a2;
      if (null !== b2 && null !== b2.ref && "function" === typeof b2.ref && b2.ref._stringRef === e2)
        return b2.ref;
      b2 = function(a3) {
        var b3 = d.refs;
        b3 === Eg && (b3 = d.refs = {});
        null === a3 ? delete b3[e2] : b3[e2] = a3;
      };
      b2._stringRef = e2;
      return b2;
    }
    if ("string" !== typeof a2)
      throw Error(u(284));
    if (!c2._owner)
      throw Error(u(290, a2));
  }
  return a2;
}
function Qg(a2, b2) {
  if ("textarea" !== a2.type)
    throw Error(u(31, "[object Object]" === Object.prototype.toString.call(b2) ? "object with keys {" + Object.keys(b2).join(", ") + "}" : b2, ""));
}
function Rg(a2) {
  function b2(b3, c3) {
    if (a2) {
      var d2 = b3.lastEffect;
      null !== d2 ? (d2.nextEffect = c3, b3.lastEffect = c3) : b3.firstEffect = b3.lastEffect = c3;
      c3.nextEffect = null;
      c3.effectTag = 8;
    }
  }
  function c2(c3, d2) {
    if (!a2)
      return null;
    for (; null !== d2; )
      b2(c3, d2), d2 = d2.sibling;
    return null;
  }
  function d(a3, b3) {
    for (a3 = /* @__PURE__ */ new Map(); null !== b3; )
      null !== b3.key ? a3.set(b3.key, b3) : a3.set(b3.index, b3), b3 = b3.sibling;
    return a3;
  }
  function e2(a3, b3) {
    a3 = Sg(a3, b3);
    a3.index = 0;
    a3.sibling = null;
    return a3;
  }
  function f2(b3, c3, d2) {
    b3.index = d2;
    if (!a2)
      return c3;
    d2 = b3.alternate;
    if (null !== d2)
      return d2 = d2.index, d2 < c3 ? (b3.effectTag = 2, c3) : d2;
    b3.effectTag = 2;
    return c3;
  }
  function g2(b3) {
    a2 && null === b3.alternate && (b3.effectTag = 2);
    return b3;
  }
  function h2(a3, b3, c3, d2) {
    if (null === b3 || 6 !== b3.tag)
      return b3 = Tg(c3, a3.mode, d2), b3.return = a3, b3;
    b3 = e2(b3, c3);
    b3.return = a3;
    return b3;
  }
  function k2(a3, b3, c3, d2) {
    if (null !== b3 && b3.elementType === c3.type)
      return d2 = e2(b3, c3.props), d2.ref = Pg(a3, b3, c3), d2.return = a3, d2;
    d2 = Ug(c3.type, c3.key, c3.props, null, a3.mode, d2);
    d2.ref = Pg(a3, b3, c3);
    d2.return = a3;
    return d2;
  }
  function l2(a3, b3, c3, d2) {
    if (null === b3 || 4 !== b3.tag || b3.stateNode.containerInfo !== c3.containerInfo || b3.stateNode.implementation !== c3.implementation)
      return b3 = Vg(c3, a3.mode, d2), b3.return = a3, b3;
    b3 = e2(b3, c3.children || []);
    b3.return = a3;
    return b3;
  }
  function m2(a3, b3, c3, d2, f3) {
    if (null === b3 || 7 !== b3.tag)
      return b3 = Wg(c3, a3.mode, d2, f3), b3.return = a3, b3;
    b3 = e2(b3, c3);
    b3.return = a3;
    return b3;
  }
  function p2(a3, b3, c3) {
    if ("string" === typeof b3 || "number" === typeof b3)
      return b3 = Tg("" + b3, a3.mode, c3), b3.return = a3, b3;
    if ("object" === typeof b3 && null !== b3) {
      switch (b3.$$typeof) {
        case Za:
          return c3 = Ug(b3.type, b3.key, b3.props, null, a3.mode, c3), c3.ref = Pg(a3, null, b3), c3.return = a3, c3;
        case $a:
          return b3 = Vg(b3, a3.mode, c3), b3.return = a3, b3;
      }
      if (Og(b3) || nb(b3))
        return b3 = Wg(b3, a3.mode, c3, null), b3.return = a3, b3;
      Qg(a3, b3);
    }
    return null;
  }
  function x2(a3, b3, c3, d2) {
    var e3 = null !== b3 ? b3.key : null;
    if ("string" === typeof c3 || "number" === typeof c3)
      return null !== e3 ? null : h2(a3, b3, "" + c3, d2);
    if ("object" === typeof c3 && null !== c3) {
      switch (c3.$$typeof) {
        case Za:
          return c3.key === e3 ? c3.type === ab ? m2(a3, b3, c3.props.children, d2, e3) : k2(a3, b3, c3, d2) : null;
        case $a:
          return c3.key === e3 ? l2(a3, b3, c3, d2) : null;
      }
      if (Og(c3) || nb(c3))
        return null !== e3 ? null : m2(a3, b3, c3, d2, null);
      Qg(a3, c3);
    }
    return null;
  }
  function z2(a3, b3, c3, d2, e3) {
    if ("string" === typeof d2 || "number" === typeof d2)
      return a3 = a3.get(c3) || null, h2(b3, a3, "" + d2, e3);
    if ("object" === typeof d2 && null !== d2) {
      switch (d2.$$typeof) {
        case Za:
          return a3 = a3.get(null === d2.key ? c3 : d2.key) || null, d2.type === ab ? m2(b3, a3, d2.props.children, e3, d2.key) : k2(b3, a3, d2, e3);
        case $a:
          return a3 = a3.get(null === d2.key ? c3 : d2.key) || null, l2(b3, a3, d2, e3);
      }
      if (Og(d2) || nb(d2))
        return a3 = a3.get(c3) || null, m2(b3, a3, d2, e3, null);
      Qg(b3, d2);
    }
    return null;
  }
  function ca(e3, g3, h3, k3) {
    for (var l3 = null, t2 = null, m3 = g3, y2 = g3 = 0, A2 = null; null !== m3 && y2 < h3.length; y2++) {
      m3.index > y2 ? (A2 = m3, m3 = null) : A2 = m3.sibling;
      var q2 = x2(e3, m3, h3[y2], k3);
      if (null === q2) {
        null === m3 && (m3 = A2);
        break;
      }
      a2 && m3 && null === q2.alternate && b2(e3, m3);
      g3 = f2(q2, g3, y2);
      null === t2 ? l3 = q2 : t2.sibling = q2;
      t2 = q2;
      m3 = A2;
    }
    if (y2 === h3.length)
      return c2(e3, m3), l3;
    if (null === m3) {
      for (; y2 < h3.length; y2++)
        m3 = p2(e3, h3[y2], k3), null !== m3 && (g3 = f2(m3, g3, y2), null === t2 ? l3 = m3 : t2.sibling = m3, t2 = m3);
      return l3;
    }
    for (m3 = d(e3, m3); y2 < h3.length; y2++)
      A2 = z2(m3, e3, y2, h3[y2], k3), null !== A2 && (a2 && null !== A2.alternate && m3.delete(null === A2.key ? y2 : A2.key), g3 = f2(A2, g3, y2), null === t2 ? l3 = A2 : t2.sibling = A2, t2 = A2);
    a2 && m3.forEach(function(a3) {
      return b2(e3, a3);
    });
    return l3;
  }
  function D2(e3, g3, h3, l3) {
    var k3 = nb(h3);
    if ("function" !== typeof k3)
      throw Error(u(150));
    h3 = k3.call(h3);
    if (null == h3)
      throw Error(u(151));
    for (var m3 = k3 = null, t2 = g3, y2 = g3 = 0, A2 = null, q2 = h3.next(); null !== t2 && !q2.done; y2++, q2 = h3.next()) {
      t2.index > y2 ? (A2 = t2, t2 = null) : A2 = t2.sibling;
      var D3 = x2(e3, t2, q2.value, l3);
      if (null === D3) {
        null === t2 && (t2 = A2);
        break;
      }
      a2 && t2 && null === D3.alternate && b2(e3, t2);
      g3 = f2(D3, g3, y2);
      null === m3 ? k3 = D3 : m3.sibling = D3;
      m3 = D3;
      t2 = A2;
    }
    if (q2.done)
      return c2(e3, t2), k3;
    if (null === t2) {
      for (; !q2.done; y2++, q2 = h3.next())
        q2 = p2(e3, q2.value, l3), null !== q2 && (g3 = f2(q2, g3, y2), null === m3 ? k3 = q2 : m3.sibling = q2, m3 = q2);
      return k3;
    }
    for (t2 = d(e3, t2); !q2.done; y2++, q2 = h3.next())
      q2 = z2(t2, e3, y2, q2.value, l3), null !== q2 && (a2 && null !== q2.alternate && t2.delete(null === q2.key ? y2 : q2.key), g3 = f2(q2, g3, y2), null === m3 ? k3 = q2 : m3.sibling = q2, m3 = q2);
    a2 && t2.forEach(function(a3) {
      return b2(e3, a3);
    });
    return k3;
  }
  return function(a3, d2, f3, h3) {
    var k3 = "object" === typeof f3 && null !== f3 && f3.type === ab && null === f3.key;
    k3 && (f3 = f3.props.children);
    var l3 = "object" === typeof f3 && null !== f3;
    if (l3)
      switch (f3.$$typeof) {
        case Za:
          a: {
            l3 = f3.key;
            for (k3 = d2; null !== k3; ) {
              if (k3.key === l3) {
                switch (k3.tag) {
                  case 7:
                    if (f3.type === ab) {
                      c2(a3, k3.sibling);
                      d2 = e2(k3, f3.props.children);
                      d2.return = a3;
                      a3 = d2;
                      break a;
                    }
                    break;
                  default:
                    if (k3.elementType === f3.type) {
                      c2(
                        a3,
                        k3.sibling
                      );
                      d2 = e2(k3, f3.props);
                      d2.ref = Pg(a3, k3, f3);
                      d2.return = a3;
                      a3 = d2;
                      break a;
                    }
                }
                c2(a3, k3);
                break;
              } else
                b2(a3, k3);
              k3 = k3.sibling;
            }
            f3.type === ab ? (d2 = Wg(f3.props.children, a3.mode, h3, f3.key), d2.return = a3, a3 = d2) : (h3 = Ug(f3.type, f3.key, f3.props, null, a3.mode, h3), h3.ref = Pg(a3, d2, f3), h3.return = a3, a3 = h3);
          }
          return g2(a3);
        case $a:
          a: {
            for (k3 = f3.key; null !== d2; ) {
              if (d2.key === k3)
                if (4 === d2.tag && d2.stateNode.containerInfo === f3.containerInfo && d2.stateNode.implementation === f3.implementation) {
                  c2(a3, d2.sibling);
                  d2 = e2(d2, f3.children || []);
                  d2.return = a3;
                  a3 = d2;
                  break a;
                } else {
                  c2(a3, d2);
                  break;
                }
              else
                b2(a3, d2);
              d2 = d2.sibling;
            }
            d2 = Vg(f3, a3.mode, h3);
            d2.return = a3;
            a3 = d2;
          }
          return g2(a3);
      }
    if ("string" === typeof f3 || "number" === typeof f3)
      return f3 = "" + f3, null !== d2 && 6 === d2.tag ? (c2(a3, d2.sibling), d2 = e2(d2, f3), d2.return = a3, a3 = d2) : (c2(a3, d2), d2 = Tg(f3, a3.mode, h3), d2.return = a3, a3 = d2), g2(a3);
    if (Og(f3))
      return ca(a3, d2, f3, h3);
    if (nb(f3))
      return D2(a3, d2, f3, h3);
    l3 && Qg(a3, f3);
    if ("undefined" === typeof f3 && !k3)
      switch (a3.tag) {
        case 1:
        case 0:
          throw a3 = a3.type, Error(u(152, a3.displayName || a3.name || "Component"));
      }
    return c2(a3, d2);
  };
}
var Xg = Rg(true), Yg = Rg(false), Zg = {}, $g = { current: Zg }, ah = { current: Zg }, bh = { current: Zg };
function ch(a2) {
  if (a2 === Zg)
    throw Error(u(174));
  return a2;
}
function dh(a2, b2) {
  I$1(bh, b2);
  I$1(ah, a2);
  I$1($g, Zg);
  a2 = b2.nodeType;
  switch (a2) {
    case 9:
    case 11:
      b2 = (b2 = b2.documentElement) ? b2.namespaceURI : Ob(null, "");
      break;
    default:
      a2 = 8 === a2 ? b2.parentNode : b2, b2 = a2.namespaceURI || null, a2 = a2.tagName, b2 = Ob(b2, a2);
  }
  H$1($g);
  I$1($g, b2);
}
function eh() {
  H$1($g);
  H$1(ah);
  H$1(bh);
}
function fh(a2) {
  ch(bh.current);
  var b2 = ch($g.current);
  var c2 = Ob(b2, a2.type);
  b2 !== c2 && (I$1(ah, a2), I$1($g, c2));
}
function gh(a2) {
  ah.current === a2 && (H$1($g), H$1(ah));
}
var M$1 = { current: 0 };
function hh(a2) {
  for (var b2 = a2; null !== b2; ) {
    if (13 === b2.tag) {
      var c2 = b2.memoizedState;
      if (null !== c2 && (c2 = c2.dehydrated, null === c2 || c2.data === Bd || c2.data === Cd))
        return b2;
    } else if (19 === b2.tag && void 0 !== b2.memoizedProps.revealOrder) {
      if (0 !== (b2.effectTag & 64))
        return b2;
    } else if (null !== b2.child) {
      b2.child.return = b2;
      b2 = b2.child;
      continue;
    }
    if (b2 === a2)
      break;
    for (; null === b2.sibling; ) {
      if (null === b2.return || b2.return === a2)
        return null;
      b2 = b2.return;
    }
    b2.sibling.return = b2.return;
    b2 = b2.sibling;
  }
  return null;
}
function ih(a2, b2) {
  return { responder: a2, props: b2 };
}
var jh = Wa.ReactCurrentDispatcher, kh = Wa.ReactCurrentBatchConfig, lh = 0, N$1 = null, O$1 = null, P$1 = null, mh = false;
function Q$1() {
  throw Error(u(321));
}
function nh(a2, b2) {
  if (null === b2)
    return false;
  for (var c2 = 0; c2 < b2.length && c2 < a2.length; c2++)
    if (!$e(a2[c2], b2[c2]))
      return false;
  return true;
}
function oh(a2, b2, c2, d, e2, f2) {
  lh = f2;
  N$1 = b2;
  b2.memoizedState = null;
  b2.updateQueue = null;
  b2.expirationTime = 0;
  jh.current = null === a2 || null === a2.memoizedState ? ph : qh;
  a2 = c2(d, e2);
  if (b2.expirationTime === lh) {
    f2 = 0;
    do {
      b2.expirationTime = 0;
      if (!(25 > f2))
        throw Error(u(301));
      f2 += 1;
      P$1 = O$1 = null;
      b2.updateQueue = null;
      jh.current = rh;
      a2 = c2(d, e2);
    } while (b2.expirationTime === lh);
  }
  jh.current = sh;
  b2 = null !== O$1 && null !== O$1.next;
  lh = 0;
  P$1 = O$1 = N$1 = null;
  mh = false;
  if (b2)
    throw Error(u(300));
  return a2;
}
function th() {
  var a2 = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
  null === P$1 ? N$1.memoizedState = P$1 = a2 : P$1 = P$1.next = a2;
  return P$1;
}
function uh() {
  if (null === O$1) {
    var a2 = N$1.alternate;
    a2 = null !== a2 ? a2.memoizedState : null;
  } else
    a2 = O$1.next;
  var b2 = null === P$1 ? N$1.memoizedState : P$1.next;
  if (null !== b2)
    P$1 = b2, O$1 = a2;
  else {
    if (null === a2)
      throw Error(u(310));
    O$1 = a2;
    a2 = { memoizedState: O$1.memoizedState, baseState: O$1.baseState, baseQueue: O$1.baseQueue, queue: O$1.queue, next: null };
    null === P$1 ? N$1.memoizedState = P$1 = a2 : P$1 = P$1.next = a2;
  }
  return P$1;
}
function vh(a2, b2) {
  return "function" === typeof b2 ? b2(a2) : b2;
}
function wh(a2) {
  var b2 = uh(), c2 = b2.queue;
  if (null === c2)
    throw Error(u(311));
  c2.lastRenderedReducer = a2;
  var d = O$1, e2 = d.baseQueue, f2 = c2.pending;
  if (null !== f2) {
    if (null !== e2) {
      var g2 = e2.next;
      e2.next = f2.next;
      f2.next = g2;
    }
    d.baseQueue = e2 = f2;
    c2.pending = null;
  }
  if (null !== e2) {
    e2 = e2.next;
    d = d.baseState;
    var h2 = g2 = f2 = null, k2 = e2;
    do {
      var l2 = k2.expirationTime;
      if (l2 < lh) {
        var m2 = { expirationTime: k2.expirationTime, suspenseConfig: k2.suspenseConfig, action: k2.action, eagerReducer: k2.eagerReducer, eagerState: k2.eagerState, next: null };
        null === h2 ? (g2 = h2 = m2, f2 = d) : h2 = h2.next = m2;
        l2 > N$1.expirationTime && (N$1.expirationTime = l2, Bg(l2));
      } else
        null !== h2 && (h2 = h2.next = { expirationTime: 1073741823, suspenseConfig: k2.suspenseConfig, action: k2.action, eagerReducer: k2.eagerReducer, eagerState: k2.eagerState, next: null }), Ag(l2, k2.suspenseConfig), d = k2.eagerReducer === a2 ? k2.eagerState : a2(d, k2.action);
      k2 = k2.next;
    } while (null !== k2 && k2 !== e2);
    null === h2 ? f2 = d : h2.next = g2;
    $e(d, b2.memoizedState) || (rg = true);
    b2.memoizedState = d;
    b2.baseState = f2;
    b2.baseQueue = h2;
    c2.lastRenderedState = d;
  }
  return [b2.memoizedState, c2.dispatch];
}
function xh(a2) {
  var b2 = uh(), c2 = b2.queue;
  if (null === c2)
    throw Error(u(311));
  c2.lastRenderedReducer = a2;
  var d = c2.dispatch, e2 = c2.pending, f2 = b2.memoizedState;
  if (null !== e2) {
    c2.pending = null;
    var g2 = e2 = e2.next;
    do
      f2 = a2(f2, g2.action), g2 = g2.next;
    while (g2 !== e2);
    $e(f2, b2.memoizedState) || (rg = true);
    b2.memoizedState = f2;
    null === b2.baseQueue && (b2.baseState = f2);
    c2.lastRenderedState = f2;
  }
  return [f2, d];
}
function yh(a2) {
  var b2 = th();
  "function" === typeof a2 && (a2 = a2());
  b2.memoizedState = b2.baseState = a2;
  a2 = b2.queue = { pending: null, dispatch: null, lastRenderedReducer: vh, lastRenderedState: a2 };
  a2 = a2.dispatch = zh.bind(null, N$1, a2);
  return [b2.memoizedState, a2];
}
function Ah(a2, b2, c2, d) {
  a2 = { tag: a2, create: b2, destroy: c2, deps: d, next: null };
  b2 = N$1.updateQueue;
  null === b2 ? (b2 = { lastEffect: null }, N$1.updateQueue = b2, b2.lastEffect = a2.next = a2) : (c2 = b2.lastEffect, null === c2 ? b2.lastEffect = a2.next = a2 : (d = c2.next, c2.next = a2, a2.next = d, b2.lastEffect = a2));
  return a2;
}
function Bh() {
  return uh().memoizedState;
}
function Ch(a2, b2, c2, d) {
  var e2 = th();
  N$1.effectTag |= a2;
  e2.memoizedState = Ah(1 | b2, c2, void 0, void 0 === d ? null : d);
}
function Dh(a2, b2, c2, d) {
  var e2 = uh();
  d = void 0 === d ? null : d;
  var f2 = void 0;
  if (null !== O$1) {
    var g2 = O$1.memoizedState;
    f2 = g2.destroy;
    if (null !== d && nh(d, g2.deps)) {
      Ah(b2, c2, f2, d);
      return;
    }
  }
  N$1.effectTag |= a2;
  e2.memoizedState = Ah(1 | b2, c2, f2, d);
}
function Eh(a2, b2) {
  return Ch(516, 4, a2, b2);
}
function Fh(a2, b2) {
  return Dh(516, 4, a2, b2);
}
function Gh(a2, b2) {
  return Dh(4, 2, a2, b2);
}
function Hh(a2, b2) {
  if ("function" === typeof b2)
    return a2 = a2(), b2(a2), function() {
      b2(null);
    };
  if (null !== b2 && void 0 !== b2)
    return a2 = a2(), b2.current = a2, function() {
      b2.current = null;
    };
}
function Ih(a2, b2, c2) {
  c2 = null !== c2 && void 0 !== c2 ? c2.concat([a2]) : null;
  return Dh(4, 2, Hh.bind(null, b2, a2), c2);
}
function Jh() {
}
function Kh(a2, b2) {
  th().memoizedState = [a2, void 0 === b2 ? null : b2];
  return a2;
}
function Lh(a2, b2) {
  var c2 = uh();
  b2 = void 0 === b2 ? null : b2;
  var d = c2.memoizedState;
  if (null !== d && null !== b2 && nh(b2, d[1]))
    return d[0];
  c2.memoizedState = [a2, b2];
  return a2;
}
function Mh(a2, b2) {
  var c2 = uh();
  b2 = void 0 === b2 ? null : b2;
  var d = c2.memoizedState;
  if (null !== d && null !== b2 && nh(b2, d[1]))
    return d[0];
  a2 = a2();
  c2.memoizedState = [a2, b2];
  return a2;
}
function Nh(a2, b2, c2) {
  var d = ag();
  cg(98 > d ? 98 : d, function() {
    a2(true);
  });
  cg(97 < d ? 97 : d, function() {
    var d2 = kh.suspense;
    kh.suspense = void 0 === b2 ? null : b2;
    try {
      a2(false), c2();
    } finally {
      kh.suspense = d2;
    }
  });
}
function zh(a2, b2, c2) {
  var d = Gg(), e2 = Dg.suspense;
  d = Hg(d, a2, e2);
  e2 = { expirationTime: d, suspenseConfig: e2, action: c2, eagerReducer: null, eagerState: null, next: null };
  var f2 = b2.pending;
  null === f2 ? e2.next = e2 : (e2.next = f2.next, f2.next = e2);
  b2.pending = e2;
  f2 = a2.alternate;
  if (a2 === N$1 || null !== f2 && f2 === N$1)
    mh = true, e2.expirationTime = lh, N$1.expirationTime = lh;
  else {
    if (0 === a2.expirationTime && (null === f2 || 0 === f2.expirationTime) && (f2 = b2.lastRenderedReducer, null !== f2))
      try {
        var g2 = b2.lastRenderedState, h2 = f2(g2, c2);
        e2.eagerReducer = f2;
        e2.eagerState = h2;
        if ($e(h2, g2))
          return;
      } catch (k2) {
      } finally {
      }
    Ig(
      a2,
      d
    );
  }
}
var sh = { readContext: sg, useCallback: Q$1, useContext: Q$1, useEffect: Q$1, useImperativeHandle: Q$1, useLayoutEffect: Q$1, useMemo: Q$1, useReducer: Q$1, useRef: Q$1, useState: Q$1, useDebugValue: Q$1, useResponder: Q$1, useDeferredValue: Q$1, useTransition: Q$1 }, ph = { readContext: sg, useCallback: Kh, useContext: sg, useEffect: Eh, useImperativeHandle: function(a2, b2, c2) {
  c2 = null !== c2 && void 0 !== c2 ? c2.concat([a2]) : null;
  return Ch(4, 2, Hh.bind(null, b2, a2), c2);
}, useLayoutEffect: function(a2, b2) {
  return Ch(4, 2, a2, b2);
}, useMemo: function(a2, b2) {
  var c2 = th();
  b2 = void 0 === b2 ? null : b2;
  a2 = a2();
  c2.memoizedState = [
    a2,
    b2
  ];
  return a2;
}, useReducer: function(a2, b2, c2) {
  var d = th();
  b2 = void 0 !== c2 ? c2(b2) : b2;
  d.memoizedState = d.baseState = b2;
  a2 = d.queue = { pending: null, dispatch: null, lastRenderedReducer: a2, lastRenderedState: b2 };
  a2 = a2.dispatch = zh.bind(null, N$1, a2);
  return [d.memoizedState, a2];
}, useRef: function(a2) {
  var b2 = th();
  a2 = { current: a2 };
  return b2.memoizedState = a2;
}, useState: yh, useDebugValue: Jh, useResponder: ih, useDeferredValue: function(a2, b2) {
  var c2 = yh(a2), d = c2[0], e2 = c2[1];
  Eh(function() {
    var c3 = kh.suspense;
    kh.suspense = void 0 === b2 ? null : b2;
    try {
      e2(a2);
    } finally {
      kh.suspense = c3;
    }
  }, [a2, b2]);
  return d;
}, useTransition: function(a2) {
  var b2 = yh(false), c2 = b2[0];
  b2 = b2[1];
  return [Kh(Nh.bind(null, b2, a2), [b2, a2]), c2];
} }, qh = { readContext: sg, useCallback: Lh, useContext: sg, useEffect: Fh, useImperativeHandle: Ih, useLayoutEffect: Gh, useMemo: Mh, useReducer: wh, useRef: Bh, useState: function() {
  return wh(vh);
}, useDebugValue: Jh, useResponder: ih, useDeferredValue: function(a2, b2) {
  var c2 = wh(vh), d = c2[0], e2 = c2[1];
  Fh(function() {
    var c3 = kh.suspense;
    kh.suspense = void 0 === b2 ? null : b2;
    try {
      e2(a2);
    } finally {
      kh.suspense = c3;
    }
  }, [a2, b2]);
  return d;
}, useTransition: function(a2) {
  var b2 = wh(vh), c2 = b2[0];
  b2 = b2[1];
  return [Lh(Nh.bind(null, b2, a2), [b2, a2]), c2];
} }, rh = { readContext: sg, useCallback: Lh, useContext: sg, useEffect: Fh, useImperativeHandle: Ih, useLayoutEffect: Gh, useMemo: Mh, useReducer: xh, useRef: Bh, useState: function() {
  return xh(vh);
}, useDebugValue: Jh, useResponder: ih, useDeferredValue: function(a2, b2) {
  var c2 = xh(vh), d = c2[0], e2 = c2[1];
  Fh(function() {
    var c3 = kh.suspense;
    kh.suspense = void 0 === b2 ? null : b2;
    try {
      e2(a2);
    } finally {
      kh.suspense = c3;
    }
  }, [a2, b2]);
  return d;
}, useTransition: function(a2) {
  var b2 = xh(vh), c2 = b2[0];
  b2 = b2[1];
  return [Lh(Nh.bind(
    null,
    b2,
    a2
  ), [b2, a2]), c2];
} }, Oh = null, Ph = null, Qh = false;
function Rh(a2, b2) {
  var c2 = Sh(5, null, null, 0);
  c2.elementType = "DELETED";
  c2.type = "DELETED";
  c2.stateNode = b2;
  c2.return = a2;
  c2.effectTag = 8;
  null !== a2.lastEffect ? (a2.lastEffect.nextEffect = c2, a2.lastEffect = c2) : a2.firstEffect = a2.lastEffect = c2;
}
function Th(a2, b2) {
  switch (a2.tag) {
    case 5:
      var c2 = a2.type;
      b2 = 1 !== b2.nodeType || c2.toLowerCase() !== b2.nodeName.toLowerCase() ? null : b2;
      return null !== b2 ? (a2.stateNode = b2, true) : false;
    case 6:
      return b2 = "" === a2.pendingProps || 3 !== b2.nodeType ? null : b2, null !== b2 ? (a2.stateNode = b2, true) : false;
    case 13:
      return false;
    default:
      return false;
  }
}
function Uh(a2) {
  if (Qh) {
    var b2 = Ph;
    if (b2) {
      var c2 = b2;
      if (!Th(a2, b2)) {
        b2 = Jd(c2.nextSibling);
        if (!b2 || !Th(a2, b2)) {
          a2.effectTag = a2.effectTag & -1025 | 2;
          Qh = false;
          Oh = a2;
          return;
        }
        Rh(Oh, c2);
      }
      Oh = a2;
      Ph = Jd(b2.firstChild);
    } else
      a2.effectTag = a2.effectTag & -1025 | 2, Qh = false, Oh = a2;
  }
}
function Vh(a2) {
  for (a2 = a2.return; null !== a2 && 5 !== a2.tag && 3 !== a2.tag && 13 !== a2.tag; )
    a2 = a2.return;
  Oh = a2;
}
function Wh(a2) {
  if (a2 !== Oh)
    return false;
  if (!Qh)
    return Vh(a2), Qh = true, false;
  var b2 = a2.type;
  if (5 !== a2.tag || "head" !== b2 && "body" !== b2 && !Gd(b2, a2.memoizedProps))
    for (b2 = Ph; b2; )
      Rh(a2, b2), b2 = Jd(b2.nextSibling);
  Vh(a2);
  if (13 === a2.tag) {
    a2 = a2.memoizedState;
    a2 = null !== a2 ? a2.dehydrated : null;
    if (!a2)
      throw Error(u(317));
    a: {
      a2 = a2.nextSibling;
      for (b2 = 0; a2; ) {
        if (8 === a2.nodeType) {
          var c2 = a2.data;
          if (c2 === Ad) {
            if (0 === b2) {
              Ph = Jd(a2.nextSibling);
              break a;
            }
            b2--;
          } else
            c2 !== zd && c2 !== Cd && c2 !== Bd || b2++;
        }
        a2 = a2.nextSibling;
      }
      Ph = null;
    }
  } else
    Ph = Oh ? Jd(a2.stateNode.nextSibling) : null;
  return true;
}
function Xh() {
  Ph = Oh = null;
  Qh = false;
}
var Yh = Wa.ReactCurrentOwner, rg = false;
function R$1(a2, b2, c2, d) {
  b2.child = null === a2 ? Yg(b2, null, c2, d) : Xg(b2, a2.child, c2, d);
}
function Zh(a2, b2, c2, d, e2) {
  c2 = c2.render;
  var f2 = b2.ref;
  qg(b2, e2);
  d = oh(a2, b2, c2, d, f2, e2);
  if (null !== a2 && !rg)
    return b2.updateQueue = a2.updateQueue, b2.effectTag &= -517, a2.expirationTime <= e2 && (a2.expirationTime = 0), $h(a2, b2, e2);
  b2.effectTag |= 1;
  R$1(a2, b2, d, e2);
  return b2.child;
}
function ai(a2, b2, c2, d, e2, f2) {
  if (null === a2) {
    var g2 = c2.type;
    if ("function" === typeof g2 && !bi(g2) && void 0 === g2.defaultProps && null === c2.compare && void 0 === c2.defaultProps)
      return b2.tag = 15, b2.type = g2, ci(a2, b2, g2, d, e2, f2);
    a2 = Ug(c2.type, null, d, null, b2.mode, f2);
    a2.ref = b2.ref;
    a2.return = b2;
    return b2.child = a2;
  }
  g2 = a2.child;
  if (e2 < f2 && (e2 = g2.memoizedProps, c2 = c2.compare, c2 = null !== c2 ? c2 : bf, c2(e2, d) && a2.ref === b2.ref))
    return $h(a2, b2, f2);
  b2.effectTag |= 1;
  a2 = Sg(g2, d);
  a2.ref = b2.ref;
  a2.return = b2;
  return b2.child = a2;
}
function ci(a2, b2, c2, d, e2, f2) {
  return null !== a2 && bf(a2.memoizedProps, d) && a2.ref === b2.ref && (rg = false, e2 < f2) ? (b2.expirationTime = a2.expirationTime, $h(a2, b2, f2)) : di(a2, b2, c2, d, f2);
}
function ei(a2, b2) {
  var c2 = b2.ref;
  if (null === a2 && null !== c2 || null !== a2 && a2.ref !== c2)
    b2.effectTag |= 128;
}
function di(a2, b2, c2, d, e2) {
  var f2 = L$1(c2) ? Bf : J$1.current;
  f2 = Cf(b2, f2);
  qg(b2, e2);
  c2 = oh(a2, b2, c2, d, f2, e2);
  if (null !== a2 && !rg)
    return b2.updateQueue = a2.updateQueue, b2.effectTag &= -517, a2.expirationTime <= e2 && (a2.expirationTime = 0), $h(a2, b2, e2);
  b2.effectTag |= 1;
  R$1(a2, b2, c2, e2);
  return b2.child;
}
function fi(a2, b2, c2, d, e2) {
  if (L$1(c2)) {
    var f2 = true;
    Gf(b2);
  } else
    f2 = false;
  qg(b2, e2);
  if (null === b2.stateNode)
    null !== a2 && (a2.alternate = null, b2.alternate = null, b2.effectTag |= 2), Lg(b2, c2, d), Ng(b2, c2, d, e2), d = true;
  else if (null === a2) {
    var g2 = b2.stateNode, h2 = b2.memoizedProps;
    g2.props = h2;
    var k2 = g2.context, l2 = c2.contextType;
    "object" === typeof l2 && null !== l2 ? l2 = sg(l2) : (l2 = L$1(c2) ? Bf : J$1.current, l2 = Cf(b2, l2));
    var m2 = c2.getDerivedStateFromProps, p2 = "function" === typeof m2 || "function" === typeof g2.getSnapshotBeforeUpdate;
    p2 || "function" !== typeof g2.UNSAFE_componentWillReceiveProps && "function" !== typeof g2.componentWillReceiveProps || (h2 !== d || k2 !== l2) && Mg(b2, g2, d, l2);
    tg = false;
    var x2 = b2.memoizedState;
    g2.state = x2;
    zg(b2, d, g2, e2);
    k2 = b2.memoizedState;
    h2 !== d || x2 !== k2 || K$1.current || tg ? ("function" === typeof m2 && (Fg(b2, c2, m2, d), k2 = b2.memoizedState), (h2 = tg || Kg(b2, c2, h2, d, x2, k2, l2)) ? (p2 || "function" !== typeof g2.UNSAFE_componentWillMount && "function" !== typeof g2.componentWillMount || ("function" === typeof g2.componentWillMount && g2.componentWillMount(), "function" === typeof g2.UNSAFE_componentWillMount && g2.UNSAFE_componentWillMount()), "function" === typeof g2.componentDidMount && (b2.effectTag |= 4)) : ("function" === typeof g2.componentDidMount && (b2.effectTag |= 4), b2.memoizedProps = d, b2.memoizedState = k2), g2.props = d, g2.state = k2, g2.context = l2, d = h2) : ("function" === typeof g2.componentDidMount && (b2.effectTag |= 4), d = false);
  } else
    g2 = b2.stateNode, vg(a2, b2), h2 = b2.memoizedProps, g2.props = b2.type === b2.elementType ? h2 : ig(b2.type, h2), k2 = g2.context, l2 = c2.contextType, "object" === typeof l2 && null !== l2 ? l2 = sg(l2) : (l2 = L$1(c2) ? Bf : J$1.current, l2 = Cf(b2, l2)), m2 = c2.getDerivedStateFromProps, (p2 = "function" === typeof m2 || "function" === typeof g2.getSnapshotBeforeUpdate) || "function" !== typeof g2.UNSAFE_componentWillReceiveProps && "function" !== typeof g2.componentWillReceiveProps || (h2 !== d || k2 !== l2) && Mg(b2, g2, d, l2), tg = false, k2 = b2.memoizedState, g2.state = k2, zg(b2, d, g2, e2), x2 = b2.memoizedState, h2 !== d || k2 !== x2 || K$1.current || tg ? ("function" === typeof m2 && (Fg(b2, c2, m2, d), x2 = b2.memoizedState), (m2 = tg || Kg(b2, c2, h2, d, k2, x2, l2)) ? (p2 || "function" !== typeof g2.UNSAFE_componentWillUpdate && "function" !== typeof g2.componentWillUpdate || ("function" === typeof g2.componentWillUpdate && g2.componentWillUpdate(
      d,
      x2,
      l2
    ), "function" === typeof g2.UNSAFE_componentWillUpdate && g2.UNSAFE_componentWillUpdate(d, x2, l2)), "function" === typeof g2.componentDidUpdate && (b2.effectTag |= 4), "function" === typeof g2.getSnapshotBeforeUpdate && (b2.effectTag |= 256)) : ("function" !== typeof g2.componentDidUpdate || h2 === a2.memoizedProps && k2 === a2.memoizedState || (b2.effectTag |= 4), "function" !== typeof g2.getSnapshotBeforeUpdate || h2 === a2.memoizedProps && k2 === a2.memoizedState || (b2.effectTag |= 256), b2.memoizedProps = d, b2.memoizedState = x2), g2.props = d, g2.state = x2, g2.context = l2, d = m2) : ("function" !== typeof g2.componentDidUpdate || h2 === a2.memoizedProps && k2 === a2.memoizedState || (b2.effectTag |= 4), "function" !== typeof g2.getSnapshotBeforeUpdate || h2 === a2.memoizedProps && k2 === a2.memoizedState || (b2.effectTag |= 256), d = false);
  return gi(a2, b2, c2, d, f2, e2);
}
function gi(a2, b2, c2, d, e2, f2) {
  ei(a2, b2);
  var g2 = 0 !== (b2.effectTag & 64);
  if (!d && !g2)
    return e2 && Hf(b2, c2, false), $h(a2, b2, f2);
  d = b2.stateNode;
  Yh.current = b2;
  var h2 = g2 && "function" !== typeof c2.getDerivedStateFromError ? null : d.render();
  b2.effectTag |= 1;
  null !== a2 && g2 ? (b2.child = Xg(b2, a2.child, null, f2), b2.child = Xg(b2, null, h2, f2)) : R$1(a2, b2, h2, f2);
  b2.memoizedState = d.state;
  e2 && Hf(b2, c2, true);
  return b2.child;
}
function hi(a2) {
  var b2 = a2.stateNode;
  b2.pendingContext ? Ef(a2, b2.pendingContext, b2.pendingContext !== b2.context) : b2.context && Ef(a2, b2.context, false);
  dh(a2, b2.containerInfo);
}
var ii = { dehydrated: null, retryTime: 0 };
function ji(a2, b2, c2) {
  var d = b2.mode, e2 = b2.pendingProps, f2 = M$1.current, g2 = false, h2;
  (h2 = 0 !== (b2.effectTag & 64)) || (h2 = 0 !== (f2 & 2) && (null === a2 || null !== a2.memoizedState));
  h2 ? (g2 = true, b2.effectTag &= -65) : null !== a2 && null === a2.memoizedState || void 0 === e2.fallback || true === e2.unstable_avoidThisFallback || (f2 |= 1);
  I$1(M$1, f2 & 1);
  if (null === a2) {
    void 0 !== e2.fallback && Uh(b2);
    if (g2) {
      g2 = e2.fallback;
      e2 = Wg(null, d, 0, null);
      e2.return = b2;
      if (0 === (b2.mode & 2))
        for (a2 = null !== b2.memoizedState ? b2.child.child : b2.child, e2.child = a2; null !== a2; )
          a2.return = e2, a2 = a2.sibling;
      c2 = Wg(g2, d, c2, null);
      c2.return = b2;
      e2.sibling = c2;
      b2.memoizedState = ii;
      b2.child = e2;
      return c2;
    }
    d = e2.children;
    b2.memoizedState = null;
    return b2.child = Yg(b2, null, d, c2);
  }
  if (null !== a2.memoizedState) {
    a2 = a2.child;
    d = a2.sibling;
    if (g2) {
      e2 = e2.fallback;
      c2 = Sg(a2, a2.pendingProps);
      c2.return = b2;
      if (0 === (b2.mode & 2) && (g2 = null !== b2.memoizedState ? b2.child.child : b2.child, g2 !== a2.child))
        for (c2.child = g2; null !== g2; )
          g2.return = c2, g2 = g2.sibling;
      d = Sg(d, e2);
      d.return = b2;
      c2.sibling = d;
      c2.childExpirationTime = 0;
      b2.memoizedState = ii;
      b2.child = c2;
      return d;
    }
    c2 = Xg(b2, a2.child, e2.children, c2);
    b2.memoizedState = null;
    return b2.child = c2;
  }
  a2 = a2.child;
  if (g2) {
    g2 = e2.fallback;
    e2 = Wg(null, d, 0, null);
    e2.return = b2;
    e2.child = a2;
    null !== a2 && (a2.return = e2);
    if (0 === (b2.mode & 2))
      for (a2 = null !== b2.memoizedState ? b2.child.child : b2.child, e2.child = a2; null !== a2; )
        a2.return = e2, a2 = a2.sibling;
    c2 = Wg(g2, d, c2, null);
    c2.return = b2;
    e2.sibling = c2;
    c2.effectTag |= 2;
    e2.childExpirationTime = 0;
    b2.memoizedState = ii;
    b2.child = e2;
    return c2;
  }
  b2.memoizedState = null;
  return b2.child = Xg(b2, a2, e2.children, c2);
}
function ki(a2, b2) {
  a2.expirationTime < b2 && (a2.expirationTime = b2);
  var c2 = a2.alternate;
  null !== c2 && c2.expirationTime < b2 && (c2.expirationTime = b2);
  pg(a2.return, b2);
}
function li(a2, b2, c2, d, e2, f2) {
  var g2 = a2.memoizedState;
  null === g2 ? a2.memoizedState = { isBackwards: b2, rendering: null, renderingStartTime: 0, last: d, tail: c2, tailExpiration: 0, tailMode: e2, lastEffect: f2 } : (g2.isBackwards = b2, g2.rendering = null, g2.renderingStartTime = 0, g2.last = d, g2.tail = c2, g2.tailExpiration = 0, g2.tailMode = e2, g2.lastEffect = f2);
}
function mi(a2, b2, c2) {
  var d = b2.pendingProps, e2 = d.revealOrder, f2 = d.tail;
  R$1(a2, b2, d.children, c2);
  d = M$1.current;
  if (0 !== (d & 2))
    d = d & 1 | 2, b2.effectTag |= 64;
  else {
    if (null !== a2 && 0 !== (a2.effectTag & 64))
      a:
        for (a2 = b2.child; null !== a2; ) {
          if (13 === a2.tag)
            null !== a2.memoizedState && ki(a2, c2);
          else if (19 === a2.tag)
            ki(a2, c2);
          else if (null !== a2.child) {
            a2.child.return = a2;
            a2 = a2.child;
            continue;
          }
          if (a2 === b2)
            break a;
          for (; null === a2.sibling; ) {
            if (null === a2.return || a2.return === b2)
              break a;
            a2 = a2.return;
          }
          a2.sibling.return = a2.return;
          a2 = a2.sibling;
        }
    d &= 1;
  }
  I$1(M$1, d);
  if (0 === (b2.mode & 2))
    b2.memoizedState = null;
  else
    switch (e2) {
      case "forwards":
        c2 = b2.child;
        for (e2 = null; null !== c2; )
          a2 = c2.alternate, null !== a2 && null === hh(a2) && (e2 = c2), c2 = c2.sibling;
        c2 = e2;
        null === c2 ? (e2 = b2.child, b2.child = null) : (e2 = c2.sibling, c2.sibling = null);
        li(b2, false, e2, c2, f2, b2.lastEffect);
        break;
      case "backwards":
        c2 = null;
        e2 = b2.child;
        for (b2.child = null; null !== e2; ) {
          a2 = e2.alternate;
          if (null !== a2 && null === hh(a2)) {
            b2.child = e2;
            break;
          }
          a2 = e2.sibling;
          e2.sibling = c2;
          c2 = e2;
          e2 = a2;
        }
        li(b2, true, c2, null, f2, b2.lastEffect);
        break;
      case "together":
        li(b2, false, null, null, void 0, b2.lastEffect);
        break;
      default:
        b2.memoizedState = null;
    }
  return b2.child;
}
function $h(a2, b2, c2) {
  null !== a2 && (b2.dependencies = a2.dependencies);
  var d = b2.expirationTime;
  0 !== d && Bg(d);
  if (b2.childExpirationTime < c2)
    return null;
  if (null !== a2 && b2.child !== a2.child)
    throw Error(u(153));
  if (null !== b2.child) {
    a2 = b2.child;
    c2 = Sg(a2, a2.pendingProps);
    b2.child = c2;
    for (c2.return = b2; null !== a2.sibling; )
      a2 = a2.sibling, c2 = c2.sibling = Sg(a2, a2.pendingProps), c2.return = b2;
    c2.sibling = null;
  }
  return b2.child;
}
var ni, oi, pi, qi;
ni = function(a2, b2) {
  for (var c2 = b2.child; null !== c2; ) {
    if (5 === c2.tag || 6 === c2.tag)
      a2.appendChild(c2.stateNode);
    else if (4 !== c2.tag && null !== c2.child) {
      c2.child.return = c2;
      c2 = c2.child;
      continue;
    }
    if (c2 === b2)
      break;
    for (; null === c2.sibling; ) {
      if (null === c2.return || c2.return === b2)
        return;
      c2 = c2.return;
    }
    c2.sibling.return = c2.return;
    c2 = c2.sibling;
  }
};
oi = function() {
};
pi = function(a2, b2, c2, d, e2) {
  var f2 = a2.memoizedProps;
  if (f2 !== d) {
    var g2 = b2.stateNode;
    ch($g.current);
    a2 = null;
    switch (c2) {
      case "input":
        f2 = zb(g2, f2);
        d = zb(g2, d);
        a2 = [];
        break;
      case "option":
        f2 = Gb(g2, f2);
        d = Gb(g2, d);
        a2 = [];
        break;
      case "select":
        f2 = n$1({}, f2, { value: void 0 });
        d = n$1({}, d, { value: void 0 });
        a2 = [];
        break;
      case "textarea":
        f2 = Ib(g2, f2);
        d = Ib(g2, d);
        a2 = [];
        break;
      default:
        "function" !== typeof f2.onClick && "function" === typeof d.onClick && (g2.onclick = sd);
    }
    od(c2, d);
    var h2, k2;
    c2 = null;
    for (h2 in f2)
      if (!d.hasOwnProperty(h2) && f2.hasOwnProperty(h2) && null != f2[h2])
        if ("style" === h2)
          for (k2 in g2 = f2[h2], g2)
            g2.hasOwnProperty(k2) && (c2 || (c2 = {}), c2[k2] = "");
        else
          "dangerouslySetInnerHTML" !== h2 && "children" !== h2 && "suppressContentEditableWarning" !== h2 && "suppressHydrationWarning" !== h2 && "autoFocus" !== h2 && (va.hasOwnProperty(h2) ? a2 || (a2 = []) : (a2 = a2 || []).push(h2, null));
    for (h2 in d) {
      var l2 = d[h2];
      g2 = null != f2 ? f2[h2] : void 0;
      if (d.hasOwnProperty(h2) && l2 !== g2 && (null != l2 || null != g2))
        if ("style" === h2)
          if (g2) {
            for (k2 in g2)
              !g2.hasOwnProperty(k2) || l2 && l2.hasOwnProperty(k2) || (c2 || (c2 = {}), c2[k2] = "");
            for (k2 in l2)
              l2.hasOwnProperty(k2) && g2[k2] !== l2[k2] && (c2 || (c2 = {}), c2[k2] = l2[k2]);
          } else
            c2 || (a2 || (a2 = []), a2.push(h2, c2)), c2 = l2;
        else
          "dangerouslySetInnerHTML" === h2 ? (l2 = l2 ? l2.__html : void 0, g2 = g2 ? g2.__html : void 0, null != l2 && g2 !== l2 && (a2 = a2 || []).push(h2, l2)) : "children" === h2 ? g2 === l2 || "string" !== typeof l2 && "number" !== typeof l2 || (a2 = a2 || []).push(h2, "" + l2) : "suppressContentEditableWarning" !== h2 && "suppressHydrationWarning" !== h2 && (va.hasOwnProperty(h2) ? (null != l2 && rd(e2, h2), a2 || g2 === l2 || (a2 = [])) : (a2 = a2 || []).push(h2, l2));
    }
    c2 && (a2 = a2 || []).push("style", c2);
    e2 = a2;
    if (b2.updateQueue = e2)
      b2.effectTag |= 4;
  }
};
qi = function(a2, b2, c2, d) {
  c2 !== d && (b2.effectTag |= 4);
};
function ri(a2, b2) {
  switch (a2.tailMode) {
    case "hidden":
      b2 = a2.tail;
      for (var c2 = null; null !== b2; )
        null !== b2.alternate && (c2 = b2), b2 = b2.sibling;
      null === c2 ? a2.tail = null : c2.sibling = null;
      break;
    case "collapsed":
      c2 = a2.tail;
      for (var d = null; null !== c2; )
        null !== c2.alternate && (d = c2), c2 = c2.sibling;
      null === d ? b2 || null === a2.tail ? a2.tail = null : a2.tail.sibling = null : d.sibling = null;
  }
}
function si(a2, b2, c2) {
  var d = b2.pendingProps;
  switch (b2.tag) {
    case 2:
    case 16:
    case 15:
    case 0:
    case 11:
    case 7:
    case 8:
    case 12:
    case 9:
    case 14:
      return null;
    case 1:
      return L$1(b2.type) && Df(), null;
    case 3:
      return eh(), H$1(K$1), H$1(J$1), c2 = b2.stateNode, c2.pendingContext && (c2.context = c2.pendingContext, c2.pendingContext = null), null !== a2 && null !== a2.child || !Wh(b2) || (b2.effectTag |= 4), oi(b2), null;
    case 5:
      gh(b2);
      c2 = ch(bh.current);
      var e2 = b2.type;
      if (null !== a2 && null != b2.stateNode)
        pi(a2, b2, e2, d, c2), a2.ref !== b2.ref && (b2.effectTag |= 128);
      else {
        if (!d) {
          if (null === b2.stateNode)
            throw Error(u(166));
          return null;
        }
        a2 = ch($g.current);
        if (Wh(b2)) {
          d = b2.stateNode;
          e2 = b2.type;
          var f2 = b2.memoizedProps;
          d[Md] = b2;
          d[Nd] = f2;
          switch (e2) {
            case "iframe":
            case "object":
            case "embed":
              F$1("load", d);
              break;
            case "video":
            case "audio":
              for (a2 = 0; a2 < ac.length; a2++)
                F$1(ac[a2], d);
              break;
            case "source":
              F$1("error", d);
              break;
            case "img":
            case "image":
            case "link":
              F$1("error", d);
              F$1("load", d);
              break;
            case "form":
              F$1("reset", d);
              F$1("submit", d);
              break;
            case "details":
              F$1("toggle", d);
              break;
            case "input":
              Ab(d, f2);
              F$1("invalid", d);
              rd(c2, "onChange");
              break;
            case "select":
              d._wrapperState = { wasMultiple: !!f2.multiple };
              F$1("invalid", d);
              rd(c2, "onChange");
              break;
            case "textarea":
              Jb(d, f2), F$1("invalid", d), rd(c2, "onChange");
          }
          od(e2, f2);
          a2 = null;
          for (var g2 in f2)
            if (f2.hasOwnProperty(g2)) {
              var h2 = f2[g2];
              "children" === g2 ? "string" === typeof h2 ? d.textContent !== h2 && (a2 = ["children", h2]) : "number" === typeof h2 && d.textContent !== "" + h2 && (a2 = ["children", "" + h2]) : va.hasOwnProperty(g2) && null != h2 && rd(c2, g2);
            }
          switch (e2) {
            case "input":
              xb(d);
              Eb(d, f2, true);
              break;
            case "textarea":
              xb(d);
              Lb(d);
              break;
            case "select":
            case "option":
              break;
            default:
              "function" === typeof f2.onClick && (d.onclick = sd);
          }
          c2 = a2;
          b2.updateQueue = c2;
          null !== c2 && (b2.effectTag |= 4);
        } else {
          g2 = 9 === c2.nodeType ? c2 : c2.ownerDocument;
          a2 === qd && (a2 = Nb(e2));
          a2 === qd ? "script" === e2 ? (a2 = g2.createElement("div"), a2.innerHTML = "<script><\/script>", a2 = a2.removeChild(a2.firstChild)) : "string" === typeof d.is ? a2 = g2.createElement(e2, { is: d.is }) : (a2 = g2.createElement(e2), "select" === e2 && (g2 = a2, d.multiple ? g2.multiple = true : d.size && (g2.size = d.size))) : a2 = g2.createElementNS(a2, e2);
          a2[Md] = b2;
          a2[Nd] = d;
          ni(a2, b2, false, false);
          b2.stateNode = a2;
          g2 = pd(e2, d);
          switch (e2) {
            case "iframe":
            case "object":
            case "embed":
              F$1(
                "load",
                a2
              );
              h2 = d;
              break;
            case "video":
            case "audio":
              for (h2 = 0; h2 < ac.length; h2++)
                F$1(ac[h2], a2);
              h2 = d;
              break;
            case "source":
              F$1("error", a2);
              h2 = d;
              break;
            case "img":
            case "image":
            case "link":
              F$1("error", a2);
              F$1("load", a2);
              h2 = d;
              break;
            case "form":
              F$1("reset", a2);
              F$1("submit", a2);
              h2 = d;
              break;
            case "details":
              F$1("toggle", a2);
              h2 = d;
              break;
            case "input":
              Ab(a2, d);
              h2 = zb(a2, d);
              F$1("invalid", a2);
              rd(c2, "onChange");
              break;
            case "option":
              h2 = Gb(a2, d);
              break;
            case "select":
              a2._wrapperState = { wasMultiple: !!d.multiple };
              h2 = n$1({}, d, { value: void 0 });
              F$1("invalid", a2);
              rd(c2, "onChange");
              break;
            case "textarea":
              Jb(
                a2,
                d
              );
              h2 = Ib(a2, d);
              F$1("invalid", a2);
              rd(c2, "onChange");
              break;
            default:
              h2 = d;
          }
          od(e2, h2);
          var k2 = h2;
          for (f2 in k2)
            if (k2.hasOwnProperty(f2)) {
              var l2 = k2[f2];
              "style" === f2 ? md(a2, l2) : "dangerouslySetInnerHTML" === f2 ? (l2 = l2 ? l2.__html : void 0, null != l2 && Qb(a2, l2)) : "children" === f2 ? "string" === typeof l2 ? ("textarea" !== e2 || "" !== l2) && Rb(a2, l2) : "number" === typeof l2 && Rb(a2, "" + l2) : "suppressContentEditableWarning" !== f2 && "suppressHydrationWarning" !== f2 && "autoFocus" !== f2 && (va.hasOwnProperty(f2) ? null != l2 && rd(c2, f2) : null != l2 && Xa(a2, f2, l2, g2));
            }
          switch (e2) {
            case "input":
              xb(a2);
              Eb(a2, d, false);
              break;
            case "textarea":
              xb(a2);
              Lb(a2);
              break;
            case "option":
              null != d.value && a2.setAttribute("value", "" + rb(d.value));
              break;
            case "select":
              a2.multiple = !!d.multiple;
              c2 = d.value;
              null != c2 ? Hb(a2, !!d.multiple, c2, false) : null != d.defaultValue && Hb(a2, !!d.multiple, d.defaultValue, true);
              break;
            default:
              "function" === typeof h2.onClick && (a2.onclick = sd);
          }
          Fd(e2, d) && (b2.effectTag |= 4);
        }
        null !== b2.ref && (b2.effectTag |= 128);
      }
      return null;
    case 6:
      if (a2 && null != b2.stateNode)
        qi(a2, b2, a2.memoizedProps, d);
      else {
        if ("string" !== typeof d && null === b2.stateNode)
          throw Error(u(166));
        c2 = ch(bh.current);
        ch($g.current);
        Wh(b2) ? (c2 = b2.stateNode, d = b2.memoizedProps, c2[Md] = b2, c2.nodeValue !== d && (b2.effectTag |= 4)) : (c2 = (9 === c2.nodeType ? c2 : c2.ownerDocument).createTextNode(d), c2[Md] = b2, b2.stateNode = c2);
      }
      return null;
    case 13:
      H$1(M$1);
      d = b2.memoizedState;
      if (0 !== (b2.effectTag & 64))
        return b2.expirationTime = c2, b2;
      c2 = null !== d;
      d = false;
      null === a2 ? void 0 !== b2.memoizedProps.fallback && Wh(b2) : (e2 = a2.memoizedState, d = null !== e2, c2 || null === e2 || (e2 = a2.child.sibling, null !== e2 && (f2 = b2.firstEffect, null !== f2 ? (b2.firstEffect = e2, e2.nextEffect = f2) : (b2.firstEffect = b2.lastEffect = e2, e2.nextEffect = null), e2.effectTag = 8)));
      if (c2 && !d && 0 !== (b2.mode & 2))
        if (null === a2 && true !== b2.memoizedProps.unstable_avoidThisFallback || 0 !== (M$1.current & 1))
          S$1 === ti && (S$1 = ui);
        else {
          if (S$1 === ti || S$1 === ui)
            S$1 = vi;
          0 !== wi && null !== T$1 && (xi(T$1, U$1), yi(T$1, wi));
        }
      if (c2 || d)
        b2.effectTag |= 4;
      return null;
    case 4:
      return eh(), oi(b2), null;
    case 10:
      return og(b2), null;
    case 17:
      return L$1(b2.type) && Df(), null;
    case 19:
      H$1(M$1);
      d = b2.memoizedState;
      if (null === d)
        return null;
      e2 = 0 !== (b2.effectTag & 64);
      f2 = d.rendering;
      if (null === f2)
        if (e2)
          ri(d, false);
        else {
          if (S$1 !== ti || null !== a2 && 0 !== (a2.effectTag & 64))
            for (f2 = b2.child; null !== f2; ) {
              a2 = hh(f2);
              if (null !== a2) {
                b2.effectTag |= 64;
                ri(d, false);
                e2 = a2.updateQueue;
                null !== e2 && (b2.updateQueue = e2, b2.effectTag |= 4);
                null === d.lastEffect && (b2.firstEffect = null);
                b2.lastEffect = d.lastEffect;
                for (d = b2.child; null !== d; )
                  e2 = d, f2 = c2, e2.effectTag &= 2, e2.nextEffect = null, e2.firstEffect = null, e2.lastEffect = null, a2 = e2.alternate, null === a2 ? (e2.childExpirationTime = 0, e2.expirationTime = f2, e2.child = null, e2.memoizedProps = null, e2.memoizedState = null, e2.updateQueue = null, e2.dependencies = null) : (e2.childExpirationTime = a2.childExpirationTime, e2.expirationTime = a2.expirationTime, e2.child = a2.child, e2.memoizedProps = a2.memoizedProps, e2.memoizedState = a2.memoizedState, e2.updateQueue = a2.updateQueue, f2 = a2.dependencies, e2.dependencies = null === f2 ? null : { expirationTime: f2.expirationTime, firstContext: f2.firstContext, responders: f2.responders }), d = d.sibling;
                I$1(M$1, M$1.current & 1 | 2);
                return b2.child;
              }
              f2 = f2.sibling;
            }
        }
      else {
        if (!e2)
          if (a2 = hh(f2), null !== a2) {
            if (b2.effectTag |= 64, e2 = true, c2 = a2.updateQueue, null !== c2 && (b2.updateQueue = c2, b2.effectTag |= 4), ri(d, true), null === d.tail && "hidden" === d.tailMode && !f2.alternate)
              return b2 = b2.lastEffect = d.lastEffect, null !== b2 && (b2.nextEffect = null), null;
          } else
            2 * $f() - d.renderingStartTime > d.tailExpiration && 1 < c2 && (b2.effectTag |= 64, e2 = true, ri(d, false), b2.expirationTime = b2.childExpirationTime = c2 - 1);
        d.isBackwards ? (f2.sibling = b2.child, b2.child = f2) : (c2 = d.last, null !== c2 ? c2.sibling = f2 : b2.child = f2, d.last = f2);
      }
      return null !== d.tail ? (0 === d.tailExpiration && (d.tailExpiration = $f() + 500), c2 = d.tail, d.rendering = c2, d.tail = c2.sibling, d.lastEffect = b2.lastEffect, d.renderingStartTime = $f(), c2.sibling = null, b2 = M$1.current, I$1(M$1, e2 ? b2 & 1 | 2 : b2 & 1), c2) : null;
  }
  throw Error(u(
    156,
    b2.tag
  ));
}
function zi(a2) {
  switch (a2.tag) {
    case 1:
      L$1(a2.type) && Df();
      var b2 = a2.effectTag;
      return b2 & 4096 ? (a2.effectTag = b2 & -4097 | 64, a2) : null;
    case 3:
      eh();
      H$1(K$1);
      H$1(J$1);
      b2 = a2.effectTag;
      if (0 !== (b2 & 64))
        throw Error(u(285));
      a2.effectTag = b2 & -4097 | 64;
      return a2;
    case 5:
      return gh(a2), null;
    case 13:
      return H$1(M$1), b2 = a2.effectTag, b2 & 4096 ? (a2.effectTag = b2 & -4097 | 64, a2) : null;
    case 19:
      return H$1(M$1), null;
    case 4:
      return eh(), null;
    case 10:
      return og(a2), null;
    default:
      return null;
  }
}
function Ai(a2, b2) {
  return { value: a2, source: b2, stack: qb(b2) };
}
var Bi = "function" === typeof WeakSet ? WeakSet : Set;
function Ci(a2, b2) {
  var c2 = b2.source, d = b2.stack;
  null === d && null !== c2 && (d = qb(c2));
  null !== c2 && pb(c2.type);
  b2 = b2.value;
  null !== a2 && 1 === a2.tag && pb(a2.type);
  try {
    console.error(b2);
  } catch (e2) {
    setTimeout(function() {
      throw e2;
    });
  }
}
function Di(a2, b2) {
  try {
    b2.props = a2.memoizedProps, b2.state = a2.memoizedState, b2.componentWillUnmount();
  } catch (c2) {
    Ei(a2, c2);
  }
}
function Fi(a2) {
  var b2 = a2.ref;
  if (null !== b2)
    if ("function" === typeof b2)
      try {
        b2(null);
      } catch (c2) {
        Ei(a2, c2);
      }
    else
      b2.current = null;
}
function Gi(a2, b2) {
  switch (b2.tag) {
    case 0:
    case 11:
    case 15:
    case 22:
      return;
    case 1:
      if (b2.effectTag & 256 && null !== a2) {
        var c2 = a2.memoizedProps, d = a2.memoizedState;
        a2 = b2.stateNode;
        b2 = a2.getSnapshotBeforeUpdate(b2.elementType === b2.type ? c2 : ig(b2.type, c2), d);
        a2.__reactInternalSnapshotBeforeUpdate = b2;
      }
      return;
    case 3:
    case 5:
    case 6:
    case 4:
    case 17:
      return;
  }
  throw Error(u(163));
}
function Hi(a2, b2) {
  b2 = b2.updateQueue;
  b2 = null !== b2 ? b2.lastEffect : null;
  if (null !== b2) {
    var c2 = b2 = b2.next;
    do {
      if ((c2.tag & a2) === a2) {
        var d = c2.destroy;
        c2.destroy = void 0;
        void 0 !== d && d();
      }
      c2 = c2.next;
    } while (c2 !== b2);
  }
}
function Ii(a2, b2) {
  b2 = b2.updateQueue;
  b2 = null !== b2 ? b2.lastEffect : null;
  if (null !== b2) {
    var c2 = b2 = b2.next;
    do {
      if ((c2.tag & a2) === a2) {
        var d = c2.create;
        c2.destroy = d();
      }
      c2 = c2.next;
    } while (c2 !== b2);
  }
}
function Ji(a2, b2, c2) {
  switch (c2.tag) {
    case 0:
    case 11:
    case 15:
    case 22:
      Ii(3, c2);
      return;
    case 1:
      a2 = c2.stateNode;
      if (c2.effectTag & 4)
        if (null === b2)
          a2.componentDidMount();
        else {
          var d = c2.elementType === c2.type ? b2.memoizedProps : ig(c2.type, b2.memoizedProps);
          a2.componentDidUpdate(d, b2.memoizedState, a2.__reactInternalSnapshotBeforeUpdate);
        }
      b2 = c2.updateQueue;
      null !== b2 && Cg(c2, b2, a2);
      return;
    case 3:
      b2 = c2.updateQueue;
      if (null !== b2) {
        a2 = null;
        if (null !== c2.child)
          switch (c2.child.tag) {
            case 5:
              a2 = c2.child.stateNode;
              break;
            case 1:
              a2 = c2.child.stateNode;
          }
        Cg(c2, b2, a2);
      }
      return;
    case 5:
      a2 = c2.stateNode;
      null === b2 && c2.effectTag & 4 && Fd(c2.type, c2.memoizedProps) && a2.focus();
      return;
    case 6:
      return;
    case 4:
      return;
    case 12:
      return;
    case 13:
      null === c2.memoizedState && (c2 = c2.alternate, null !== c2 && (c2 = c2.memoizedState, null !== c2 && (c2 = c2.dehydrated, null !== c2 && Vc(c2))));
      return;
    case 19:
    case 17:
    case 20:
    case 21:
      return;
  }
  throw Error(u(163));
}
function Ki(a2, b2, c2) {
  "function" === typeof Li && Li(b2);
  switch (b2.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
    case 22:
      a2 = b2.updateQueue;
      if (null !== a2 && (a2 = a2.lastEffect, null !== a2)) {
        var d = a2.next;
        cg(97 < c2 ? 97 : c2, function() {
          var a3 = d;
          do {
            var c3 = a3.destroy;
            if (void 0 !== c3) {
              var g2 = b2;
              try {
                c3();
              } catch (h2) {
                Ei(g2, h2);
              }
            }
            a3 = a3.next;
          } while (a3 !== d);
        });
      }
      break;
    case 1:
      Fi(b2);
      c2 = b2.stateNode;
      "function" === typeof c2.componentWillUnmount && Di(b2, c2);
      break;
    case 5:
      Fi(b2);
      break;
    case 4:
      Mi(a2, b2, c2);
  }
}
function Ni(a2) {
  var b2 = a2.alternate;
  a2.return = null;
  a2.child = null;
  a2.memoizedState = null;
  a2.updateQueue = null;
  a2.dependencies = null;
  a2.alternate = null;
  a2.firstEffect = null;
  a2.lastEffect = null;
  a2.pendingProps = null;
  a2.memoizedProps = null;
  a2.stateNode = null;
  null !== b2 && Ni(b2);
}
function Oi(a2) {
  return 5 === a2.tag || 3 === a2.tag || 4 === a2.tag;
}
function Pi(a2) {
  a: {
    for (var b2 = a2.return; null !== b2; ) {
      if (Oi(b2)) {
        var c2 = b2;
        break a;
      }
      b2 = b2.return;
    }
    throw Error(u(160));
  }
  b2 = c2.stateNode;
  switch (c2.tag) {
    case 5:
      var d = false;
      break;
    case 3:
      b2 = b2.containerInfo;
      d = true;
      break;
    case 4:
      b2 = b2.containerInfo;
      d = true;
      break;
    default:
      throw Error(u(161));
  }
  c2.effectTag & 16 && (Rb(b2, ""), c2.effectTag &= -17);
  a:
    b:
      for (c2 = a2; ; ) {
        for (; null === c2.sibling; ) {
          if (null === c2.return || Oi(c2.return)) {
            c2 = null;
            break a;
          }
          c2 = c2.return;
        }
        c2.sibling.return = c2.return;
        for (c2 = c2.sibling; 5 !== c2.tag && 6 !== c2.tag && 18 !== c2.tag; ) {
          if (c2.effectTag & 2)
            continue b;
          if (null === c2.child || 4 === c2.tag)
            continue b;
          else
            c2.child.return = c2, c2 = c2.child;
        }
        if (!(c2.effectTag & 2)) {
          c2 = c2.stateNode;
          break a;
        }
      }
  d ? Qi(a2, c2, b2) : Ri(a2, c2, b2);
}
function Qi(a2, b2, c2) {
  var d = a2.tag, e2 = 5 === d || 6 === d;
  if (e2)
    a2 = e2 ? a2.stateNode : a2.stateNode.instance, b2 ? 8 === c2.nodeType ? c2.parentNode.insertBefore(a2, b2) : c2.insertBefore(a2, b2) : (8 === c2.nodeType ? (b2 = c2.parentNode, b2.insertBefore(a2, c2)) : (b2 = c2, b2.appendChild(a2)), c2 = c2._reactRootContainer, null !== c2 && void 0 !== c2 || null !== b2.onclick || (b2.onclick = sd));
  else if (4 !== d && (a2 = a2.child, null !== a2))
    for (Qi(a2, b2, c2), a2 = a2.sibling; null !== a2; )
      Qi(a2, b2, c2), a2 = a2.sibling;
}
function Ri(a2, b2, c2) {
  var d = a2.tag, e2 = 5 === d || 6 === d;
  if (e2)
    a2 = e2 ? a2.stateNode : a2.stateNode.instance, b2 ? c2.insertBefore(a2, b2) : c2.appendChild(a2);
  else if (4 !== d && (a2 = a2.child, null !== a2))
    for (Ri(a2, b2, c2), a2 = a2.sibling; null !== a2; )
      Ri(a2, b2, c2), a2 = a2.sibling;
}
function Mi(a2, b2, c2) {
  for (var d = b2, e2 = false, f2, g2; ; ) {
    if (!e2) {
      e2 = d.return;
      a:
        for (; ; ) {
          if (null === e2)
            throw Error(u(160));
          f2 = e2.stateNode;
          switch (e2.tag) {
            case 5:
              g2 = false;
              break a;
            case 3:
              f2 = f2.containerInfo;
              g2 = true;
              break a;
            case 4:
              f2 = f2.containerInfo;
              g2 = true;
              break a;
          }
          e2 = e2.return;
        }
      e2 = true;
    }
    if (5 === d.tag || 6 === d.tag) {
      a:
        for (var h2 = a2, k2 = d, l2 = c2, m2 = k2; ; )
          if (Ki(h2, m2, l2), null !== m2.child && 4 !== m2.tag)
            m2.child.return = m2, m2 = m2.child;
          else {
            if (m2 === k2)
              break a;
            for (; null === m2.sibling; ) {
              if (null === m2.return || m2.return === k2)
                break a;
              m2 = m2.return;
            }
            m2.sibling.return = m2.return;
            m2 = m2.sibling;
          }
      g2 ? (h2 = f2, k2 = d.stateNode, 8 === h2.nodeType ? h2.parentNode.removeChild(k2) : h2.removeChild(k2)) : f2.removeChild(d.stateNode);
    } else if (4 === d.tag) {
      if (null !== d.child) {
        f2 = d.stateNode.containerInfo;
        g2 = true;
        d.child.return = d;
        d = d.child;
        continue;
      }
    } else if (Ki(a2, d, c2), null !== d.child) {
      d.child.return = d;
      d = d.child;
      continue;
    }
    if (d === b2)
      break;
    for (; null === d.sibling; ) {
      if (null === d.return || d.return === b2)
        return;
      d = d.return;
      4 === d.tag && (e2 = false);
    }
    d.sibling.return = d.return;
    d = d.sibling;
  }
}
function Si(a2, b2) {
  switch (b2.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
    case 22:
      Hi(3, b2);
      return;
    case 1:
      return;
    case 5:
      var c2 = b2.stateNode;
      if (null != c2) {
        var d = b2.memoizedProps, e2 = null !== a2 ? a2.memoizedProps : d;
        a2 = b2.type;
        var f2 = b2.updateQueue;
        b2.updateQueue = null;
        if (null !== f2) {
          c2[Nd] = d;
          "input" === a2 && "radio" === d.type && null != d.name && Bb(c2, d);
          pd(a2, e2);
          b2 = pd(a2, d);
          for (e2 = 0; e2 < f2.length; e2 += 2) {
            var g2 = f2[e2], h2 = f2[e2 + 1];
            "style" === g2 ? md(c2, h2) : "dangerouslySetInnerHTML" === g2 ? Qb(c2, h2) : "children" === g2 ? Rb(c2, h2) : Xa(c2, g2, h2, b2);
          }
          switch (a2) {
            case "input":
              Cb(c2, d);
              break;
            case "textarea":
              Kb(c2, d);
              break;
            case "select":
              b2 = c2._wrapperState.wasMultiple, c2._wrapperState.wasMultiple = !!d.multiple, a2 = d.value, null != a2 ? Hb(c2, !!d.multiple, a2, false) : b2 !== !!d.multiple && (null != d.defaultValue ? Hb(c2, !!d.multiple, d.defaultValue, true) : Hb(c2, !!d.multiple, d.multiple ? [] : "", false));
          }
        }
      }
      return;
    case 6:
      if (null === b2.stateNode)
        throw Error(u(162));
      b2.stateNode.nodeValue = b2.memoizedProps;
      return;
    case 3:
      b2 = b2.stateNode;
      b2.hydrate && (b2.hydrate = false, Vc(b2.containerInfo));
      return;
    case 12:
      return;
    case 13:
      c2 = b2;
      null === b2.memoizedState ? d = false : (d = true, c2 = b2.child, Ti = $f());
      if (null !== c2)
        a:
          for (a2 = c2; ; ) {
            if (5 === a2.tag)
              f2 = a2.stateNode, d ? (f2 = f2.style, "function" === typeof f2.setProperty ? f2.setProperty("display", "none", "important") : f2.display = "none") : (f2 = a2.stateNode, e2 = a2.memoizedProps.style, e2 = void 0 !== e2 && null !== e2 && e2.hasOwnProperty("display") ? e2.display : null, f2.style.display = ld("display", e2));
            else if (6 === a2.tag)
              a2.stateNode.nodeValue = d ? "" : a2.memoizedProps;
            else if (13 === a2.tag && null !== a2.memoizedState && null === a2.memoizedState.dehydrated) {
              f2 = a2.child.sibling;
              f2.return = a2;
              a2 = f2;
              continue;
            } else if (null !== a2.child) {
              a2.child.return = a2;
              a2 = a2.child;
              continue;
            }
            if (a2 === c2)
              break;
            for (; null === a2.sibling; ) {
              if (null === a2.return || a2.return === c2)
                break a;
              a2 = a2.return;
            }
            a2.sibling.return = a2.return;
            a2 = a2.sibling;
          }
      Ui(b2);
      return;
    case 19:
      Ui(b2);
      return;
    case 17:
      return;
  }
  throw Error(u(163));
}
function Ui(a2) {
  var b2 = a2.updateQueue;
  if (null !== b2) {
    a2.updateQueue = null;
    var c2 = a2.stateNode;
    null === c2 && (c2 = a2.stateNode = new Bi());
    b2.forEach(function(b3) {
      var d = Vi.bind(null, a2, b3);
      c2.has(b3) || (c2.add(b3), b3.then(d, d));
    });
  }
}
var Wi = "function" === typeof WeakMap ? WeakMap : Map;
function Xi(a2, b2, c2) {
  c2 = wg(c2, null);
  c2.tag = 3;
  c2.payload = { element: null };
  var d = b2.value;
  c2.callback = function() {
    Yi || (Yi = true, Zi = d);
    Ci(a2, b2);
  };
  return c2;
}
function $i(a2, b2, c2) {
  c2 = wg(c2, null);
  c2.tag = 3;
  var d = a2.type.getDerivedStateFromError;
  if ("function" === typeof d) {
    var e2 = b2.value;
    c2.payload = function() {
      Ci(a2, b2);
      return d(e2);
    };
  }
  var f2 = a2.stateNode;
  null !== f2 && "function" === typeof f2.componentDidCatch && (c2.callback = function() {
    "function" !== typeof d && (null === aj ? aj = /* @__PURE__ */ new Set([this]) : aj.add(this), Ci(a2, b2));
    var c3 = b2.stack;
    this.componentDidCatch(b2.value, { componentStack: null !== c3 ? c3 : "" });
  });
  return c2;
}
var bj = Math.ceil, cj = Wa.ReactCurrentDispatcher, dj = Wa.ReactCurrentOwner, V$1 = 0, ej = 8, fj = 16, gj = 32, ti = 0, hj = 1, ij = 2, ui = 3, vi = 4, jj = 5, W$1 = V$1, T$1 = null, X$1 = null, U$1 = 0, S$1 = ti, kj = null, lj = 1073741823, mj = 1073741823, nj = null, wi = 0, oj = false, Ti = 0, pj = 500, Y$1 = null, Yi = false, Zi = null, aj = null, qj = false, rj = null, sj = 90, tj = null, uj = 0, vj = null, wj = 0;
function Gg() {
  return (W$1 & (fj | gj)) !== V$1 ? 1073741821 - ($f() / 10 | 0) : 0 !== wj ? wj : wj = 1073741821 - ($f() / 10 | 0);
}
function Hg(a2, b2, c2) {
  b2 = b2.mode;
  if (0 === (b2 & 2))
    return 1073741823;
  var d = ag();
  if (0 === (b2 & 4))
    return 99 === d ? 1073741823 : 1073741822;
  if ((W$1 & fj) !== V$1)
    return U$1;
  if (null !== c2)
    a2 = hg(a2, c2.timeoutMs | 0 || 5e3, 250);
  else
    switch (d) {
      case 99:
        a2 = 1073741823;
        break;
      case 98:
        a2 = hg(a2, 150, 100);
        break;
      case 97:
      case 96:
        a2 = hg(a2, 5e3, 250);
        break;
      case 95:
        a2 = 2;
        break;
      default:
        throw Error(u(326));
    }
  null !== T$1 && a2 === U$1 && --a2;
  return a2;
}
function Ig(a2, b2) {
  if (50 < uj)
    throw uj = 0, vj = null, Error(u(185));
  a2 = xj(a2, b2);
  if (null !== a2) {
    var c2 = ag();
    1073741823 === b2 ? (W$1 & ej) !== V$1 && (W$1 & (fj | gj)) === V$1 ? yj(a2) : (Z$1(a2), W$1 === V$1 && gg()) : Z$1(a2);
    (W$1 & 4) === V$1 || 98 !== c2 && 99 !== c2 || (null === tj ? tj = /* @__PURE__ */ new Map([[a2, b2]]) : (c2 = tj.get(a2), (void 0 === c2 || c2 > b2) && tj.set(a2, b2)));
  }
}
function xj(a2, b2) {
  a2.expirationTime < b2 && (a2.expirationTime = b2);
  var c2 = a2.alternate;
  null !== c2 && c2.expirationTime < b2 && (c2.expirationTime = b2);
  var d = a2.return, e2 = null;
  if (null === d && 3 === a2.tag)
    e2 = a2.stateNode;
  else
    for (; null !== d; ) {
      c2 = d.alternate;
      d.childExpirationTime < b2 && (d.childExpirationTime = b2);
      null !== c2 && c2.childExpirationTime < b2 && (c2.childExpirationTime = b2);
      if (null === d.return && 3 === d.tag) {
        e2 = d.stateNode;
        break;
      }
      d = d.return;
    }
  null !== e2 && (T$1 === e2 && (Bg(b2), S$1 === vi && xi(e2, U$1)), yi(e2, b2));
  return e2;
}
function zj(a2) {
  var b2 = a2.lastExpiredTime;
  if (0 !== b2)
    return b2;
  b2 = a2.firstPendingTime;
  if (!Aj(a2, b2))
    return b2;
  var c2 = a2.lastPingedTime;
  a2 = a2.nextKnownPendingLevel;
  a2 = c2 > a2 ? c2 : a2;
  return 2 >= a2 && b2 !== a2 ? 0 : a2;
}
function Z$1(a2) {
  if (0 !== a2.lastExpiredTime)
    a2.callbackExpirationTime = 1073741823, a2.callbackPriority = 99, a2.callbackNode = eg(yj.bind(null, a2));
  else {
    var b2 = zj(a2), c2 = a2.callbackNode;
    if (0 === b2)
      null !== c2 && (a2.callbackNode = null, a2.callbackExpirationTime = 0, a2.callbackPriority = 90);
    else {
      var d = Gg();
      1073741823 === b2 ? d = 99 : 1 === b2 || 2 === b2 ? d = 95 : (d = 10 * (1073741821 - b2) - 10 * (1073741821 - d), d = 0 >= d ? 99 : 250 >= d ? 98 : 5250 >= d ? 97 : 95);
      if (null !== c2) {
        var e2 = a2.callbackPriority;
        if (a2.callbackExpirationTime === b2 && e2 >= d)
          return;
        c2 !== Tf && Kf(c2);
      }
      a2.callbackExpirationTime = b2;
      a2.callbackPriority = d;
      b2 = 1073741823 === b2 ? eg(yj.bind(null, a2)) : dg(d, Bj.bind(null, a2), { timeout: 10 * (1073741821 - b2) - $f() });
      a2.callbackNode = b2;
    }
  }
}
function Bj(a2, b2) {
  wj = 0;
  if (b2)
    return b2 = Gg(), Cj(a2, b2), Z$1(a2), null;
  var c2 = zj(a2);
  if (0 !== c2) {
    b2 = a2.callbackNode;
    if ((W$1 & (fj | gj)) !== V$1)
      throw Error(u(327));
    Dj();
    a2 === T$1 && c2 === U$1 || Ej(a2, c2);
    if (null !== X$1) {
      var d = W$1;
      W$1 |= fj;
      var e2 = Fj();
      do
        try {
          Gj();
          break;
        } catch (h2) {
          Hj(a2, h2);
        }
      while (1);
      ng();
      W$1 = d;
      cj.current = e2;
      if (S$1 === hj)
        throw b2 = kj, Ej(a2, c2), xi(a2, c2), Z$1(a2), b2;
      if (null === X$1)
        switch (e2 = a2.finishedWork = a2.current.alternate, a2.finishedExpirationTime = c2, d = S$1, T$1 = null, d) {
          case ti:
          case hj:
            throw Error(u(345));
          case ij:
            Cj(a2, 2 < c2 ? 2 : c2);
            break;
          case ui:
            xi(a2, c2);
            d = a2.lastSuspendedTime;
            c2 === d && (a2.nextKnownPendingLevel = Ij(e2));
            if (1073741823 === lj && (e2 = Ti + pj - $f(), 10 < e2)) {
              if (oj) {
                var f2 = a2.lastPingedTime;
                if (0 === f2 || f2 >= c2) {
                  a2.lastPingedTime = c2;
                  Ej(a2, c2);
                  break;
                }
              }
              f2 = zj(a2);
              if (0 !== f2 && f2 !== c2)
                break;
              if (0 !== d && d !== c2) {
                a2.lastPingedTime = d;
                break;
              }
              a2.timeoutHandle = Hd(Jj.bind(null, a2), e2);
              break;
            }
            Jj(a2);
            break;
          case vi:
            xi(a2, c2);
            d = a2.lastSuspendedTime;
            c2 === d && (a2.nextKnownPendingLevel = Ij(e2));
            if (oj && (e2 = a2.lastPingedTime, 0 === e2 || e2 >= c2)) {
              a2.lastPingedTime = c2;
              Ej(a2, c2);
              break;
            }
            e2 = zj(a2);
            if (0 !== e2 && e2 !== c2)
              break;
            if (0 !== d && d !== c2) {
              a2.lastPingedTime = d;
              break;
            }
            1073741823 !== mj ? d = 10 * (1073741821 - mj) - $f() : 1073741823 === lj ? d = 0 : (d = 10 * (1073741821 - lj) - 5e3, e2 = $f(), c2 = 10 * (1073741821 - c2) - e2, d = e2 - d, 0 > d && (d = 0), d = (120 > d ? 120 : 480 > d ? 480 : 1080 > d ? 1080 : 1920 > d ? 1920 : 3e3 > d ? 3e3 : 4320 > d ? 4320 : 1960 * bj(d / 1960)) - d, c2 < d && (d = c2));
            if (10 < d) {
              a2.timeoutHandle = Hd(Jj.bind(null, a2), d);
              break;
            }
            Jj(a2);
            break;
          case jj:
            if (1073741823 !== lj && null !== nj) {
              f2 = lj;
              var g2 = nj;
              d = g2.busyMinDurationMs | 0;
              0 >= d ? d = 0 : (e2 = g2.busyDelayMs | 0, f2 = $f() - (10 * (1073741821 - f2) - (g2.timeoutMs | 0 || 5e3)), d = f2 <= e2 ? 0 : e2 + d - f2);
              if (10 < d) {
                xi(a2, c2);
                a2.timeoutHandle = Hd(Jj.bind(null, a2), d);
                break;
              }
            }
            Jj(a2);
            break;
          default:
            throw Error(u(329));
        }
      Z$1(a2);
      if (a2.callbackNode === b2)
        return Bj.bind(null, a2);
    }
  }
  return null;
}
function yj(a2) {
  var b2 = a2.lastExpiredTime;
  b2 = 0 !== b2 ? b2 : 1073741823;
  if ((W$1 & (fj | gj)) !== V$1)
    throw Error(u(327));
  Dj();
  a2 === T$1 && b2 === U$1 || Ej(a2, b2);
  if (null !== X$1) {
    var c2 = W$1;
    W$1 |= fj;
    var d = Fj();
    do
      try {
        Kj();
        break;
      } catch (e2) {
        Hj(a2, e2);
      }
    while (1);
    ng();
    W$1 = c2;
    cj.current = d;
    if (S$1 === hj)
      throw c2 = kj, Ej(a2, b2), xi(a2, b2), Z$1(a2), c2;
    if (null !== X$1)
      throw Error(u(261));
    a2.finishedWork = a2.current.alternate;
    a2.finishedExpirationTime = b2;
    T$1 = null;
    Jj(a2);
    Z$1(a2);
  }
  return null;
}
function Lj() {
  if (null !== tj) {
    var a2 = tj;
    tj = null;
    a2.forEach(function(a3, c2) {
      Cj(c2, a3);
      Z$1(c2);
    });
    gg();
  }
}
function Mj(a2, b2) {
  var c2 = W$1;
  W$1 |= 1;
  try {
    return a2(b2);
  } finally {
    W$1 = c2, W$1 === V$1 && gg();
  }
}
function Nj(a2, b2) {
  var c2 = W$1;
  W$1 &= -2;
  W$1 |= ej;
  try {
    return a2(b2);
  } finally {
    W$1 = c2, W$1 === V$1 && gg();
  }
}
function Ej(a2, b2) {
  a2.finishedWork = null;
  a2.finishedExpirationTime = 0;
  var c2 = a2.timeoutHandle;
  -1 !== c2 && (a2.timeoutHandle = -1, Id(c2));
  if (null !== X$1)
    for (c2 = X$1.return; null !== c2; ) {
      var d = c2;
      switch (d.tag) {
        case 1:
          d = d.type.childContextTypes;
          null !== d && void 0 !== d && Df();
          break;
        case 3:
          eh();
          H$1(K$1);
          H$1(J$1);
          break;
        case 5:
          gh(d);
          break;
        case 4:
          eh();
          break;
        case 13:
          H$1(M$1);
          break;
        case 19:
          H$1(M$1);
          break;
        case 10:
          og(d);
      }
      c2 = c2.return;
    }
  T$1 = a2;
  X$1 = Sg(a2.current, null);
  U$1 = b2;
  S$1 = ti;
  kj = null;
  mj = lj = 1073741823;
  nj = null;
  wi = 0;
  oj = false;
}
function Hj(a2, b2) {
  do {
    try {
      ng();
      jh.current = sh;
      if (mh)
        for (var c2 = N$1.memoizedState; null !== c2; ) {
          var d = c2.queue;
          null !== d && (d.pending = null);
          c2 = c2.next;
        }
      lh = 0;
      P$1 = O$1 = N$1 = null;
      mh = false;
      if (null === X$1 || null === X$1.return)
        return S$1 = hj, kj = b2, X$1 = null;
      a: {
        var e2 = a2, f2 = X$1.return, g2 = X$1, h2 = b2;
        b2 = U$1;
        g2.effectTag |= 2048;
        g2.firstEffect = g2.lastEffect = null;
        if (null !== h2 && "object" === typeof h2 && "function" === typeof h2.then) {
          var k2 = h2;
          if (0 === (g2.mode & 2)) {
            var l2 = g2.alternate;
            l2 ? (g2.updateQueue = l2.updateQueue, g2.memoizedState = l2.memoizedState, g2.expirationTime = l2.expirationTime) : (g2.updateQueue = null, g2.memoizedState = null);
          }
          var m2 = 0 !== (M$1.current & 1), p2 = f2;
          do {
            var x2;
            if (x2 = 13 === p2.tag) {
              var z2 = p2.memoizedState;
              if (null !== z2)
                x2 = null !== z2.dehydrated ? true : false;
              else {
                var ca = p2.memoizedProps;
                x2 = void 0 === ca.fallback ? false : true !== ca.unstable_avoidThisFallback ? true : m2 ? false : true;
              }
            }
            if (x2) {
              var D2 = p2.updateQueue;
              if (null === D2) {
                var t2 = /* @__PURE__ */ new Set();
                t2.add(k2);
                p2.updateQueue = t2;
              } else
                D2.add(k2);
              if (0 === (p2.mode & 2)) {
                p2.effectTag |= 64;
                g2.effectTag &= -2981;
                if (1 === g2.tag)
                  if (null === g2.alternate)
                    g2.tag = 17;
                  else {
                    var y2 = wg(1073741823, null);
                    y2.tag = 2;
                    xg(g2, y2);
                  }
                g2.expirationTime = 1073741823;
                break a;
              }
              h2 = void 0;
              g2 = b2;
              var A2 = e2.pingCache;
              null === A2 ? (A2 = e2.pingCache = new Wi(), h2 = /* @__PURE__ */ new Set(), A2.set(k2, h2)) : (h2 = A2.get(k2), void 0 === h2 && (h2 = /* @__PURE__ */ new Set(), A2.set(k2, h2)));
              if (!h2.has(g2)) {
                h2.add(g2);
                var q2 = Oj.bind(null, e2, k2, g2);
                k2.then(q2, q2);
              }
              p2.effectTag |= 4096;
              p2.expirationTime = b2;
              break a;
            }
            p2 = p2.return;
          } while (null !== p2);
          h2 = Error((pb(g2.type) || "A React component") + " suspended while rendering, but no fallback UI was specified.\n\nAdd a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display." + qb(g2));
        }
        S$1 !== jj && (S$1 = ij);
        h2 = Ai(h2, g2);
        p2 = f2;
        do {
          switch (p2.tag) {
            case 3:
              k2 = h2;
              p2.effectTag |= 4096;
              p2.expirationTime = b2;
              var B2 = Xi(p2, k2, b2);
              yg(p2, B2);
              break a;
            case 1:
              k2 = h2;
              var w2 = p2.type, ub = p2.stateNode;
              if (0 === (p2.effectTag & 64) && ("function" === typeof w2.getDerivedStateFromError || null !== ub && "function" === typeof ub.componentDidCatch && (null === aj || !aj.has(ub)))) {
                p2.effectTag |= 4096;
                p2.expirationTime = b2;
                var vb = $i(p2, k2, b2);
                yg(p2, vb);
                break a;
              }
          }
          p2 = p2.return;
        } while (null !== p2);
      }
      X$1 = Pj(X$1);
    } catch (Xc) {
      b2 = Xc;
      continue;
    }
    break;
  } while (1);
}
function Fj() {
  var a2 = cj.current;
  cj.current = sh;
  return null === a2 ? sh : a2;
}
function Ag(a2, b2) {
  a2 < lj && 2 < a2 && (lj = a2);
  null !== b2 && a2 < mj && 2 < a2 && (mj = a2, nj = b2);
}
function Bg(a2) {
  a2 > wi && (wi = a2);
}
function Kj() {
  for (; null !== X$1; )
    X$1 = Qj(X$1);
}
function Gj() {
  for (; null !== X$1 && !Uf(); )
    X$1 = Qj(X$1);
}
function Qj(a2) {
  var b2 = Rj(a2.alternate, a2, U$1);
  a2.memoizedProps = a2.pendingProps;
  null === b2 && (b2 = Pj(a2));
  dj.current = null;
  return b2;
}
function Pj(a2) {
  X$1 = a2;
  do {
    var b2 = X$1.alternate;
    a2 = X$1.return;
    if (0 === (X$1.effectTag & 2048)) {
      b2 = si(b2, X$1, U$1);
      if (1 === U$1 || 1 !== X$1.childExpirationTime) {
        for (var c2 = 0, d = X$1.child; null !== d; ) {
          var e2 = d.expirationTime, f2 = d.childExpirationTime;
          e2 > c2 && (c2 = e2);
          f2 > c2 && (c2 = f2);
          d = d.sibling;
        }
        X$1.childExpirationTime = c2;
      }
      if (null !== b2)
        return b2;
      null !== a2 && 0 === (a2.effectTag & 2048) && (null === a2.firstEffect && (a2.firstEffect = X$1.firstEffect), null !== X$1.lastEffect && (null !== a2.lastEffect && (a2.lastEffect.nextEffect = X$1.firstEffect), a2.lastEffect = X$1.lastEffect), 1 < X$1.effectTag && (null !== a2.lastEffect ? a2.lastEffect.nextEffect = X$1 : a2.firstEffect = X$1, a2.lastEffect = X$1));
    } else {
      b2 = zi(X$1);
      if (null !== b2)
        return b2.effectTag &= 2047, b2;
      null !== a2 && (a2.firstEffect = a2.lastEffect = null, a2.effectTag |= 2048);
    }
    b2 = X$1.sibling;
    if (null !== b2)
      return b2;
    X$1 = a2;
  } while (null !== X$1);
  S$1 === ti && (S$1 = jj);
  return null;
}
function Ij(a2) {
  var b2 = a2.expirationTime;
  a2 = a2.childExpirationTime;
  return b2 > a2 ? b2 : a2;
}
function Jj(a2) {
  var b2 = ag();
  cg(99, Sj.bind(null, a2, b2));
  return null;
}
function Sj(a2, b2) {
  do
    Dj();
  while (null !== rj);
  if ((W$1 & (fj | gj)) !== V$1)
    throw Error(u(327));
  var c2 = a2.finishedWork, d = a2.finishedExpirationTime;
  if (null === c2)
    return null;
  a2.finishedWork = null;
  a2.finishedExpirationTime = 0;
  if (c2 === a2.current)
    throw Error(u(177));
  a2.callbackNode = null;
  a2.callbackExpirationTime = 0;
  a2.callbackPriority = 90;
  a2.nextKnownPendingLevel = 0;
  var e2 = Ij(c2);
  a2.firstPendingTime = e2;
  d <= a2.lastSuspendedTime ? a2.firstSuspendedTime = a2.lastSuspendedTime = a2.nextKnownPendingLevel = 0 : d <= a2.firstSuspendedTime && (a2.firstSuspendedTime = d - 1);
  d <= a2.lastPingedTime && (a2.lastPingedTime = 0);
  d <= a2.lastExpiredTime && (a2.lastExpiredTime = 0);
  a2 === T$1 && (X$1 = T$1 = null, U$1 = 0);
  1 < c2.effectTag ? null !== c2.lastEffect ? (c2.lastEffect.nextEffect = c2, e2 = c2.firstEffect) : e2 = c2 : e2 = c2.firstEffect;
  if (null !== e2) {
    var f2 = W$1;
    W$1 |= gj;
    dj.current = null;
    Dd = fd;
    var g2 = xd();
    if (yd(g2)) {
      if ("selectionStart" in g2)
        var h2 = { start: g2.selectionStart, end: g2.selectionEnd };
      else
        a: {
          h2 = (h2 = g2.ownerDocument) && h2.defaultView || window;
          var k2 = h2.getSelection && h2.getSelection();
          if (k2 && 0 !== k2.rangeCount) {
            h2 = k2.anchorNode;
            var l2 = k2.anchorOffset, m2 = k2.focusNode;
            k2 = k2.focusOffset;
            try {
              h2.nodeType, m2.nodeType;
            } catch (wb) {
              h2 = null;
              break a;
            }
            var p2 = 0, x2 = -1, z2 = -1, ca = 0, D2 = 0, t2 = g2, y2 = null;
            b:
              for (; ; ) {
                for (var A2; ; ) {
                  t2 !== h2 || 0 !== l2 && 3 !== t2.nodeType || (x2 = p2 + l2);
                  t2 !== m2 || 0 !== k2 && 3 !== t2.nodeType || (z2 = p2 + k2);
                  3 === t2.nodeType && (p2 += t2.nodeValue.length);
                  if (null === (A2 = t2.firstChild))
                    break;
                  y2 = t2;
                  t2 = A2;
                }
                for (; ; ) {
                  if (t2 === g2)
                    break b;
                  y2 === h2 && ++ca === l2 && (x2 = p2);
                  y2 === m2 && ++D2 === k2 && (z2 = p2);
                  if (null !== (A2 = t2.nextSibling))
                    break;
                  t2 = y2;
                  y2 = t2.parentNode;
                }
                t2 = A2;
              }
            h2 = -1 === x2 || -1 === z2 ? null : { start: x2, end: z2 };
          } else
            h2 = null;
        }
      h2 = h2 || { start: 0, end: 0 };
    } else
      h2 = null;
    Ed = { activeElementDetached: null, focusedElem: g2, selectionRange: h2 };
    fd = false;
    Y$1 = e2;
    do
      try {
        Tj();
      } catch (wb) {
        if (null === Y$1)
          throw Error(u(330));
        Ei(Y$1, wb);
        Y$1 = Y$1.nextEffect;
      }
    while (null !== Y$1);
    Y$1 = e2;
    do
      try {
        for (g2 = a2, h2 = b2; null !== Y$1; ) {
          var q2 = Y$1.effectTag;
          q2 & 16 && Rb(Y$1.stateNode, "");
          if (q2 & 128) {
            var B2 = Y$1.alternate;
            if (null !== B2) {
              var w2 = B2.ref;
              null !== w2 && ("function" === typeof w2 ? w2(null) : w2.current = null);
            }
          }
          switch (q2 & 1038) {
            case 2:
              Pi(Y$1);
              Y$1.effectTag &= -3;
              break;
            case 6:
              Pi(Y$1);
              Y$1.effectTag &= -3;
              Si(Y$1.alternate, Y$1);
              break;
            case 1024:
              Y$1.effectTag &= -1025;
              break;
            case 1028:
              Y$1.effectTag &= -1025;
              Si(Y$1.alternate, Y$1);
              break;
            case 4:
              Si(Y$1.alternate, Y$1);
              break;
            case 8:
              l2 = Y$1, Mi(g2, l2, h2), Ni(l2);
          }
          Y$1 = Y$1.nextEffect;
        }
      } catch (wb) {
        if (null === Y$1)
          throw Error(u(330));
        Ei(Y$1, wb);
        Y$1 = Y$1.nextEffect;
      }
    while (null !== Y$1);
    w2 = Ed;
    B2 = xd();
    q2 = w2.focusedElem;
    h2 = w2.selectionRange;
    if (B2 !== q2 && q2 && q2.ownerDocument && wd(q2.ownerDocument.documentElement, q2)) {
      null !== h2 && yd(q2) && (B2 = h2.start, w2 = h2.end, void 0 === w2 && (w2 = B2), "selectionStart" in q2 ? (q2.selectionStart = B2, q2.selectionEnd = Math.min(w2, q2.value.length)) : (w2 = (B2 = q2.ownerDocument || document) && B2.defaultView || window, w2.getSelection && (w2 = w2.getSelection(), l2 = q2.textContent.length, g2 = Math.min(h2.start, l2), h2 = void 0 === h2.end ? g2 : Math.min(h2.end, l2), !w2.extend && g2 > h2 && (l2 = h2, h2 = g2, g2 = l2), l2 = vd(q2, g2), m2 = vd(q2, h2), l2 && m2 && (1 !== w2.rangeCount || w2.anchorNode !== l2.node || w2.anchorOffset !== l2.offset || w2.focusNode !== m2.node || w2.focusOffset !== m2.offset) && (B2 = B2.createRange(), B2.setStart(l2.node, l2.offset), w2.removeAllRanges(), g2 > h2 ? (w2.addRange(B2), w2.extend(m2.node, m2.offset)) : (B2.setEnd(m2.node, m2.offset), w2.addRange(B2))))));
      B2 = [];
      for (w2 = q2; w2 = w2.parentNode; )
        1 === w2.nodeType && B2.push({
          element: w2,
          left: w2.scrollLeft,
          top: w2.scrollTop
        });
      "function" === typeof q2.focus && q2.focus();
      for (q2 = 0; q2 < B2.length; q2++)
        w2 = B2[q2], w2.element.scrollLeft = w2.left, w2.element.scrollTop = w2.top;
    }
    fd = !!Dd;
    Ed = Dd = null;
    a2.current = c2;
    Y$1 = e2;
    do
      try {
        for (q2 = a2; null !== Y$1; ) {
          var ub = Y$1.effectTag;
          ub & 36 && Ji(q2, Y$1.alternate, Y$1);
          if (ub & 128) {
            B2 = void 0;
            var vb = Y$1.ref;
            if (null !== vb) {
              var Xc = Y$1.stateNode;
              switch (Y$1.tag) {
                case 5:
                  B2 = Xc;
                  break;
                default:
                  B2 = Xc;
              }
              "function" === typeof vb ? vb(B2) : vb.current = B2;
            }
          }
          Y$1 = Y$1.nextEffect;
        }
      } catch (wb) {
        if (null === Y$1)
          throw Error(u(330));
        Ei(Y$1, wb);
        Y$1 = Y$1.nextEffect;
      }
    while (null !== Y$1);
    Y$1 = null;
    Vf();
    W$1 = f2;
  } else
    a2.current = c2;
  if (qj)
    qj = false, rj = a2, sj = b2;
  else
    for (Y$1 = e2; null !== Y$1; )
      b2 = Y$1.nextEffect, Y$1.nextEffect = null, Y$1 = b2;
  b2 = a2.firstPendingTime;
  0 === b2 && (aj = null);
  1073741823 === b2 ? a2 === vj ? uj++ : (uj = 0, vj = a2) : uj = 0;
  "function" === typeof Uj && Uj(c2.stateNode, d);
  Z$1(a2);
  if (Yi)
    throw Yi = false, a2 = Zi, Zi = null, a2;
  if ((W$1 & ej) !== V$1)
    return null;
  gg();
  return null;
}
function Tj() {
  for (; null !== Y$1; ) {
    var a2 = Y$1.effectTag;
    0 !== (a2 & 256) && Gi(Y$1.alternate, Y$1);
    0 === (a2 & 512) || qj || (qj = true, dg(97, function() {
      Dj();
      return null;
    }));
    Y$1 = Y$1.nextEffect;
  }
}
function Dj() {
  if (90 !== sj) {
    var a2 = 97 < sj ? 97 : sj;
    sj = 90;
    return cg(a2, Vj);
  }
}
function Vj() {
  if (null === rj)
    return false;
  var a2 = rj;
  rj = null;
  if ((W$1 & (fj | gj)) !== V$1)
    throw Error(u(331));
  var b2 = W$1;
  W$1 |= gj;
  for (a2 = a2.current.firstEffect; null !== a2; ) {
    try {
      var c2 = a2;
      if (0 !== (c2.effectTag & 512))
        switch (c2.tag) {
          case 0:
          case 11:
          case 15:
          case 22:
            Hi(5, c2), Ii(5, c2);
        }
    } catch (d) {
      if (null === a2)
        throw Error(u(330));
      Ei(a2, d);
    }
    c2 = a2.nextEffect;
    a2.nextEffect = null;
    a2 = c2;
  }
  W$1 = b2;
  gg();
  return true;
}
function Wj(a2, b2, c2) {
  b2 = Ai(c2, b2);
  b2 = Xi(a2, b2, 1073741823);
  xg(a2, b2);
  a2 = xj(a2, 1073741823);
  null !== a2 && Z$1(a2);
}
function Ei(a2, b2) {
  if (3 === a2.tag)
    Wj(a2, a2, b2);
  else
    for (var c2 = a2.return; null !== c2; ) {
      if (3 === c2.tag) {
        Wj(c2, a2, b2);
        break;
      } else if (1 === c2.tag) {
        var d = c2.stateNode;
        if ("function" === typeof c2.type.getDerivedStateFromError || "function" === typeof d.componentDidCatch && (null === aj || !aj.has(d))) {
          a2 = Ai(b2, a2);
          a2 = $i(c2, a2, 1073741823);
          xg(c2, a2);
          c2 = xj(c2, 1073741823);
          null !== c2 && Z$1(c2);
          break;
        }
      }
      c2 = c2.return;
    }
}
function Oj(a2, b2, c2) {
  var d = a2.pingCache;
  null !== d && d.delete(b2);
  T$1 === a2 && U$1 === c2 ? S$1 === vi || S$1 === ui && 1073741823 === lj && $f() - Ti < pj ? Ej(a2, U$1) : oj = true : Aj(a2, c2) && (b2 = a2.lastPingedTime, 0 !== b2 && b2 < c2 || (a2.lastPingedTime = c2, Z$1(a2)));
}
function Vi(a2, b2) {
  var c2 = a2.stateNode;
  null !== c2 && c2.delete(b2);
  b2 = 0;
  0 === b2 && (b2 = Gg(), b2 = Hg(b2, a2, null));
  a2 = xj(a2, b2);
  null !== a2 && Z$1(a2);
}
var Rj;
Rj = function(a2, b2, c2) {
  var d = b2.expirationTime;
  if (null !== a2) {
    var e2 = b2.pendingProps;
    if (a2.memoizedProps !== e2 || K$1.current)
      rg = true;
    else {
      if (d < c2) {
        rg = false;
        switch (b2.tag) {
          case 3:
            hi(b2);
            Xh();
            break;
          case 5:
            fh(b2);
            if (b2.mode & 4 && 1 !== c2 && e2.hidden)
              return b2.expirationTime = b2.childExpirationTime = 1, null;
            break;
          case 1:
            L$1(b2.type) && Gf(b2);
            break;
          case 4:
            dh(b2, b2.stateNode.containerInfo);
            break;
          case 10:
            d = b2.memoizedProps.value;
            e2 = b2.type._context;
            I$1(jg, e2._currentValue);
            e2._currentValue = d;
            break;
          case 13:
            if (null !== b2.memoizedState) {
              d = b2.child.childExpirationTime;
              if (0 !== d && d >= c2)
                return ji(a2, b2, c2);
              I$1(M$1, M$1.current & 1);
              b2 = $h(a2, b2, c2);
              return null !== b2 ? b2.sibling : null;
            }
            I$1(M$1, M$1.current & 1);
            break;
          case 19:
            d = b2.childExpirationTime >= c2;
            if (0 !== (a2.effectTag & 64)) {
              if (d)
                return mi(a2, b2, c2);
              b2.effectTag |= 64;
            }
            e2 = b2.memoizedState;
            null !== e2 && (e2.rendering = null, e2.tail = null);
            I$1(M$1, M$1.current);
            if (!d)
              return null;
        }
        return $h(a2, b2, c2);
      }
      rg = false;
    }
  } else
    rg = false;
  b2.expirationTime = 0;
  switch (b2.tag) {
    case 2:
      d = b2.type;
      null !== a2 && (a2.alternate = null, b2.alternate = null, b2.effectTag |= 2);
      a2 = b2.pendingProps;
      e2 = Cf(b2, J$1.current);
      qg(b2, c2);
      e2 = oh(
        null,
        b2,
        d,
        a2,
        e2,
        c2
      );
      b2.effectTag |= 1;
      if ("object" === typeof e2 && null !== e2 && "function" === typeof e2.render && void 0 === e2.$$typeof) {
        b2.tag = 1;
        b2.memoizedState = null;
        b2.updateQueue = null;
        if (L$1(d)) {
          var f2 = true;
          Gf(b2);
        } else
          f2 = false;
        b2.memoizedState = null !== e2.state && void 0 !== e2.state ? e2.state : null;
        ug(b2);
        var g2 = d.getDerivedStateFromProps;
        "function" === typeof g2 && Fg(b2, d, g2, a2);
        e2.updater = Jg;
        b2.stateNode = e2;
        e2._reactInternalFiber = b2;
        Ng(b2, d, a2, c2);
        b2 = gi(null, b2, d, true, f2, c2);
      } else
        b2.tag = 0, R$1(null, b2, e2, c2), b2 = b2.child;
      return b2;
    case 16:
      a: {
        e2 = b2.elementType;
        null !== a2 && (a2.alternate = null, b2.alternate = null, b2.effectTag |= 2);
        a2 = b2.pendingProps;
        ob(e2);
        if (1 !== e2._status)
          throw e2._result;
        e2 = e2._result;
        b2.type = e2;
        f2 = b2.tag = Xj(e2);
        a2 = ig(e2, a2);
        switch (f2) {
          case 0:
            b2 = di(null, b2, e2, a2, c2);
            break a;
          case 1:
            b2 = fi(null, b2, e2, a2, c2);
            break a;
          case 11:
            b2 = Zh(null, b2, e2, a2, c2);
            break a;
          case 14:
            b2 = ai(null, b2, e2, ig(e2.type, a2), d, c2);
            break a;
        }
        throw Error(u(306, e2, ""));
      }
      return b2;
    case 0:
      return d = b2.type, e2 = b2.pendingProps, e2 = b2.elementType === d ? e2 : ig(d, e2), di(a2, b2, d, e2, c2);
    case 1:
      return d = b2.type, e2 = b2.pendingProps, e2 = b2.elementType === d ? e2 : ig(d, e2), fi(a2, b2, d, e2, c2);
    case 3:
      hi(b2);
      d = b2.updateQueue;
      if (null === a2 || null === d)
        throw Error(u(282));
      d = b2.pendingProps;
      e2 = b2.memoizedState;
      e2 = null !== e2 ? e2.element : null;
      vg(a2, b2);
      zg(b2, d, null, c2);
      d = b2.memoizedState.element;
      if (d === e2)
        Xh(), b2 = $h(a2, b2, c2);
      else {
        if (e2 = b2.stateNode.hydrate)
          Ph = Jd(b2.stateNode.containerInfo.firstChild), Oh = b2, e2 = Qh = true;
        if (e2)
          for (c2 = Yg(b2, null, d, c2), b2.child = c2; c2; )
            c2.effectTag = c2.effectTag & -3 | 1024, c2 = c2.sibling;
        else
          R$1(a2, b2, d, c2), Xh();
        b2 = b2.child;
      }
      return b2;
    case 5:
      return fh(b2), null === a2 && Uh(b2), d = b2.type, e2 = b2.pendingProps, f2 = null !== a2 ? a2.memoizedProps : null, g2 = e2.children, Gd(d, e2) ? g2 = null : null !== f2 && Gd(d, f2) && (b2.effectTag |= 16), ei(a2, b2), b2.mode & 4 && 1 !== c2 && e2.hidden ? (b2.expirationTime = b2.childExpirationTime = 1, b2 = null) : (R$1(a2, b2, g2, c2), b2 = b2.child), b2;
    case 6:
      return null === a2 && Uh(b2), null;
    case 13:
      return ji(a2, b2, c2);
    case 4:
      return dh(b2, b2.stateNode.containerInfo), d = b2.pendingProps, null === a2 ? b2.child = Xg(b2, null, d, c2) : R$1(a2, b2, d, c2), b2.child;
    case 11:
      return d = b2.type, e2 = b2.pendingProps, e2 = b2.elementType === d ? e2 : ig(d, e2), Zh(a2, b2, d, e2, c2);
    case 7:
      return R$1(a2, b2, b2.pendingProps, c2), b2.child;
    case 8:
      return R$1(
        a2,
        b2,
        b2.pendingProps.children,
        c2
      ), b2.child;
    case 12:
      return R$1(a2, b2, b2.pendingProps.children, c2), b2.child;
    case 10:
      a: {
        d = b2.type._context;
        e2 = b2.pendingProps;
        g2 = b2.memoizedProps;
        f2 = e2.value;
        var h2 = b2.type._context;
        I$1(jg, h2._currentValue);
        h2._currentValue = f2;
        if (null !== g2)
          if (h2 = g2.value, f2 = $e(h2, f2) ? 0 : ("function" === typeof d._calculateChangedBits ? d._calculateChangedBits(h2, f2) : 1073741823) | 0, 0 === f2) {
            if (g2.children === e2.children && !K$1.current) {
              b2 = $h(a2, b2, c2);
              break a;
            }
          } else
            for (h2 = b2.child, null !== h2 && (h2.return = b2); null !== h2; ) {
              var k2 = h2.dependencies;
              if (null !== k2) {
                g2 = h2.child;
                for (var l2 = k2.firstContext; null !== l2; ) {
                  if (l2.context === d && 0 !== (l2.observedBits & f2)) {
                    1 === h2.tag && (l2 = wg(c2, null), l2.tag = 2, xg(h2, l2));
                    h2.expirationTime < c2 && (h2.expirationTime = c2);
                    l2 = h2.alternate;
                    null !== l2 && l2.expirationTime < c2 && (l2.expirationTime = c2);
                    pg(h2.return, c2);
                    k2.expirationTime < c2 && (k2.expirationTime = c2);
                    break;
                  }
                  l2 = l2.next;
                }
              } else
                g2 = 10 === h2.tag ? h2.type === b2.type ? null : h2.child : h2.child;
              if (null !== g2)
                g2.return = h2;
              else
                for (g2 = h2; null !== g2; ) {
                  if (g2 === b2) {
                    g2 = null;
                    break;
                  }
                  h2 = g2.sibling;
                  if (null !== h2) {
                    h2.return = g2.return;
                    g2 = h2;
                    break;
                  }
                  g2 = g2.return;
                }
              h2 = g2;
            }
        R$1(a2, b2, e2.children, c2);
        b2 = b2.child;
      }
      return b2;
    case 9:
      return e2 = b2.type, f2 = b2.pendingProps, d = f2.children, qg(b2, c2), e2 = sg(e2, f2.unstable_observedBits), d = d(e2), b2.effectTag |= 1, R$1(a2, b2, d, c2), b2.child;
    case 14:
      return e2 = b2.type, f2 = ig(e2, b2.pendingProps), f2 = ig(e2.type, f2), ai(a2, b2, e2, f2, d, c2);
    case 15:
      return ci(a2, b2, b2.type, b2.pendingProps, d, c2);
    case 17:
      return d = b2.type, e2 = b2.pendingProps, e2 = b2.elementType === d ? e2 : ig(d, e2), null !== a2 && (a2.alternate = null, b2.alternate = null, b2.effectTag |= 2), b2.tag = 1, L$1(d) ? (a2 = true, Gf(b2)) : a2 = false, qg(b2, c2), Lg(b2, d, e2), Ng(b2, d, e2, c2), gi(
        null,
        b2,
        d,
        true,
        a2,
        c2
      );
    case 19:
      return mi(a2, b2, c2);
  }
  throw Error(u(156, b2.tag));
};
var Uj = null, Li = null;
function Yj(a2) {
  if ("undefined" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__)
    return false;
  var b2 = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (b2.isDisabled || !b2.supportsFiber)
    return true;
  try {
    var c2 = b2.inject(a2);
    Uj = function(a3) {
      try {
        b2.onCommitFiberRoot(c2, a3, void 0, 64 === (a3.current.effectTag & 64));
      } catch (e2) {
      }
    };
    Li = function(a3) {
      try {
        b2.onCommitFiberUnmount(c2, a3);
      } catch (e2) {
      }
    };
  } catch (d) {
  }
  return true;
}
function Zj(a2, b2, c2, d) {
  this.tag = a2;
  this.key = c2;
  this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
  this.index = 0;
  this.ref = null;
  this.pendingProps = b2;
  this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
  this.mode = d;
  this.effectTag = 0;
  this.lastEffect = this.firstEffect = this.nextEffect = null;
  this.childExpirationTime = this.expirationTime = 0;
  this.alternate = null;
}
function Sh(a2, b2, c2, d) {
  return new Zj(a2, b2, c2, d);
}
function bi(a2) {
  a2 = a2.prototype;
  return !(!a2 || !a2.isReactComponent);
}
function Xj(a2) {
  if ("function" === typeof a2)
    return bi(a2) ? 1 : 0;
  if (void 0 !== a2 && null !== a2) {
    a2 = a2.$$typeof;
    if (a2 === gb)
      return 11;
    if (a2 === jb)
      return 14;
  }
  return 2;
}
function Sg(a2, b2) {
  var c2 = a2.alternate;
  null === c2 ? (c2 = Sh(a2.tag, b2, a2.key, a2.mode), c2.elementType = a2.elementType, c2.type = a2.type, c2.stateNode = a2.stateNode, c2.alternate = a2, a2.alternate = c2) : (c2.pendingProps = b2, c2.effectTag = 0, c2.nextEffect = null, c2.firstEffect = null, c2.lastEffect = null);
  c2.childExpirationTime = a2.childExpirationTime;
  c2.expirationTime = a2.expirationTime;
  c2.child = a2.child;
  c2.memoizedProps = a2.memoizedProps;
  c2.memoizedState = a2.memoizedState;
  c2.updateQueue = a2.updateQueue;
  b2 = a2.dependencies;
  c2.dependencies = null === b2 ? null : {
    expirationTime: b2.expirationTime,
    firstContext: b2.firstContext,
    responders: b2.responders
  };
  c2.sibling = a2.sibling;
  c2.index = a2.index;
  c2.ref = a2.ref;
  return c2;
}
function Ug(a2, b2, c2, d, e2, f2) {
  var g2 = 2;
  d = a2;
  if ("function" === typeof a2)
    bi(a2) && (g2 = 1);
  else if ("string" === typeof a2)
    g2 = 5;
  else
    a:
      switch (a2) {
        case ab:
          return Wg(c2.children, e2, f2, b2);
        case fb:
          g2 = 8;
          e2 |= 7;
          break;
        case bb:
          g2 = 8;
          e2 |= 1;
          break;
        case cb:
          return a2 = Sh(12, c2, b2, e2 | 8), a2.elementType = cb, a2.type = cb, a2.expirationTime = f2, a2;
        case hb:
          return a2 = Sh(13, c2, b2, e2), a2.type = hb, a2.elementType = hb, a2.expirationTime = f2, a2;
        case ib:
          return a2 = Sh(19, c2, b2, e2), a2.elementType = ib, a2.expirationTime = f2, a2;
        default:
          if ("object" === typeof a2 && null !== a2)
            switch (a2.$$typeof) {
              case db:
                g2 = 10;
                break a;
              case eb:
                g2 = 9;
                break a;
              case gb:
                g2 = 11;
                break a;
              case jb:
                g2 = 14;
                break a;
              case kb:
                g2 = 16;
                d = null;
                break a;
              case lb:
                g2 = 22;
                break a;
            }
          throw Error(u(130, null == a2 ? a2 : typeof a2, ""));
      }
  b2 = Sh(g2, c2, b2, e2);
  b2.elementType = a2;
  b2.type = d;
  b2.expirationTime = f2;
  return b2;
}
function Wg(a2, b2, c2, d) {
  a2 = Sh(7, a2, d, b2);
  a2.expirationTime = c2;
  return a2;
}
function Tg(a2, b2, c2) {
  a2 = Sh(6, a2, null, b2);
  a2.expirationTime = c2;
  return a2;
}
function Vg(a2, b2, c2) {
  b2 = Sh(4, null !== a2.children ? a2.children : [], a2.key, b2);
  b2.expirationTime = c2;
  b2.stateNode = { containerInfo: a2.containerInfo, pendingChildren: null, implementation: a2.implementation };
  return b2;
}
function ak(a2, b2, c2) {
  this.tag = b2;
  this.current = null;
  this.containerInfo = a2;
  this.pingCache = this.pendingChildren = null;
  this.finishedExpirationTime = 0;
  this.finishedWork = null;
  this.timeoutHandle = -1;
  this.pendingContext = this.context = null;
  this.hydrate = c2;
  this.callbackNode = null;
  this.callbackPriority = 90;
  this.lastExpiredTime = this.lastPingedTime = this.nextKnownPendingLevel = this.lastSuspendedTime = this.firstSuspendedTime = this.firstPendingTime = 0;
}
function Aj(a2, b2) {
  var c2 = a2.firstSuspendedTime;
  a2 = a2.lastSuspendedTime;
  return 0 !== c2 && c2 >= b2 && a2 <= b2;
}
function xi(a2, b2) {
  var c2 = a2.firstSuspendedTime, d = a2.lastSuspendedTime;
  c2 < b2 && (a2.firstSuspendedTime = b2);
  if (d > b2 || 0 === c2)
    a2.lastSuspendedTime = b2;
  b2 <= a2.lastPingedTime && (a2.lastPingedTime = 0);
  b2 <= a2.lastExpiredTime && (a2.lastExpiredTime = 0);
}
function yi(a2, b2) {
  b2 > a2.firstPendingTime && (a2.firstPendingTime = b2);
  var c2 = a2.firstSuspendedTime;
  0 !== c2 && (b2 >= c2 ? a2.firstSuspendedTime = a2.lastSuspendedTime = a2.nextKnownPendingLevel = 0 : b2 >= a2.lastSuspendedTime && (a2.lastSuspendedTime = b2 + 1), b2 > a2.nextKnownPendingLevel && (a2.nextKnownPendingLevel = b2));
}
function Cj(a2, b2) {
  var c2 = a2.lastExpiredTime;
  if (0 === c2 || c2 > b2)
    a2.lastExpiredTime = b2;
}
function bk(a2, b2, c2, d) {
  var e2 = b2.current, f2 = Gg(), g2 = Dg.suspense;
  f2 = Hg(f2, e2, g2);
  a:
    if (c2) {
      c2 = c2._reactInternalFiber;
      b: {
        if (dc(c2) !== c2 || 1 !== c2.tag)
          throw Error(u(170));
        var h2 = c2;
        do {
          switch (h2.tag) {
            case 3:
              h2 = h2.stateNode.context;
              break b;
            case 1:
              if (L$1(h2.type)) {
                h2 = h2.stateNode.__reactInternalMemoizedMergedChildContext;
                break b;
              }
          }
          h2 = h2.return;
        } while (null !== h2);
        throw Error(u(171));
      }
      if (1 === c2.tag) {
        var k2 = c2.type;
        if (L$1(k2)) {
          c2 = Ff(c2, k2, h2);
          break a;
        }
      }
      c2 = h2;
    } else
      c2 = Af;
  null === b2.context ? b2.context = c2 : b2.pendingContext = c2;
  b2 = wg(f2, g2);
  b2.payload = { element: a2 };
  d = void 0 === d ? null : d;
  null !== d && (b2.callback = d);
  xg(e2, b2);
  Ig(e2, f2);
  return f2;
}
function ck(a2) {
  a2 = a2.current;
  if (!a2.child)
    return null;
  switch (a2.child.tag) {
    case 5:
      return a2.child.stateNode;
    default:
      return a2.child.stateNode;
  }
}
function dk(a2, b2) {
  a2 = a2.memoizedState;
  null !== a2 && null !== a2.dehydrated && a2.retryTime < b2 && (a2.retryTime = b2);
}
function ek(a2, b2) {
  dk(a2, b2);
  (a2 = a2.alternate) && dk(a2, b2);
}
function fk(a2, b2, c2) {
  c2 = null != c2 && true === c2.hydrate;
  var d = new ak(a2, b2, c2), e2 = Sh(3, null, null, 2 === b2 ? 7 : 1 === b2 ? 3 : 0);
  d.current = e2;
  e2.stateNode = d;
  ug(e2);
  a2[Od] = d.current;
  c2 && 0 !== b2 && Jc(a2, 9 === a2.nodeType ? a2 : a2.ownerDocument);
  this._internalRoot = d;
}
fk.prototype.render = function(a2) {
  bk(a2, this._internalRoot, null, null);
};
fk.prototype.unmount = function() {
  var a2 = this._internalRoot, b2 = a2.containerInfo;
  bk(null, a2, null, function() {
    b2[Od] = null;
  });
};
function gk(a2) {
  return !(!a2 || 1 !== a2.nodeType && 9 !== a2.nodeType && 11 !== a2.nodeType && (8 !== a2.nodeType || " react-mount-point-unstable " !== a2.nodeValue));
}
function hk(a2, b2) {
  b2 || (b2 = a2 ? 9 === a2.nodeType ? a2.documentElement : a2.firstChild : null, b2 = !(!b2 || 1 !== b2.nodeType || !b2.hasAttribute("data-reactroot")));
  if (!b2)
    for (var c2; c2 = a2.lastChild; )
      a2.removeChild(c2);
  return new fk(a2, 0, b2 ? { hydrate: true } : void 0);
}
function ik(a2, b2, c2, d, e2) {
  var f2 = c2._reactRootContainer;
  if (f2) {
    var g2 = f2._internalRoot;
    if ("function" === typeof e2) {
      var h2 = e2;
      e2 = function() {
        var a3 = ck(g2);
        h2.call(a3);
      };
    }
    bk(b2, g2, a2, e2);
  } else {
    f2 = c2._reactRootContainer = hk(c2, d);
    g2 = f2._internalRoot;
    if ("function" === typeof e2) {
      var k2 = e2;
      e2 = function() {
        var a3 = ck(g2);
        k2.call(a3);
      };
    }
    Nj(function() {
      bk(b2, g2, a2, e2);
    });
  }
  return ck(g2);
}
function jk(a2, b2, c2) {
  var d = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
  return { $$typeof: $a, key: null == d ? null : "" + d, children: a2, containerInfo: b2, implementation: c2 };
}
wc = function(a2) {
  if (13 === a2.tag) {
    var b2 = hg(Gg(), 150, 100);
    Ig(a2, b2);
    ek(a2, b2);
  }
};
xc = function(a2) {
  13 === a2.tag && (Ig(a2, 3), ek(a2, 3));
};
yc = function(a2) {
  if (13 === a2.tag) {
    var b2 = Gg();
    b2 = Hg(b2, a2, null);
    Ig(a2, b2);
    ek(a2, b2);
  }
};
za = function(a2, b2, c2) {
  switch (b2) {
    case "input":
      Cb(a2, c2);
      b2 = c2.name;
      if ("radio" === c2.type && null != b2) {
        for (c2 = a2; c2.parentNode; )
          c2 = c2.parentNode;
        c2 = c2.querySelectorAll("input[name=" + JSON.stringify("" + b2) + '][type="radio"]');
        for (b2 = 0; b2 < c2.length; b2++) {
          var d = c2[b2];
          if (d !== a2 && d.form === a2.form) {
            var e2 = Qd(d);
            if (!e2)
              throw Error(u(90));
            yb(d);
            Cb(d, e2);
          }
        }
      }
      break;
    case "textarea":
      Kb(a2, c2);
      break;
    case "select":
      b2 = c2.value, null != b2 && Hb(a2, !!c2.multiple, b2, false);
  }
};
Fa = Mj;
Ga = function(a2, b2, c2, d, e2) {
  var f2 = W$1;
  W$1 |= 4;
  try {
    return cg(98, a2.bind(null, b2, c2, d, e2));
  } finally {
    W$1 = f2, W$1 === V$1 && gg();
  }
};
Ha = function() {
  (W$1 & (1 | fj | gj)) === V$1 && (Lj(), Dj());
};
Ia = function(a2, b2) {
  var c2 = W$1;
  W$1 |= 2;
  try {
    return a2(b2);
  } finally {
    W$1 = c2, W$1 === V$1 && gg();
  }
};
function kk(a2, b2) {
  var c2 = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
  if (!gk(b2))
    throw Error(u(200));
  return jk(a2, b2, null, c2);
}
var lk = { Events: [Nc, Pd, Qd, xa, ta, Xd, function(a2) {
  jc(a2, Wd);
}, Da, Ea, id, mc, Dj, { current: false }] };
(function(a2) {
  var b2 = a2.findFiberByHostInstance;
  return Yj(n$1({}, a2, { overrideHookState: null, overrideProps: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: Wa.ReactCurrentDispatcher, findHostInstanceByFiber: function(a3) {
    a3 = hc(a3);
    return null === a3 ? null : a3.stateNode;
  }, findFiberByHostInstance: function(a3) {
    return b2 ? b2(a3) : null;
  }, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null }));
})({
  findFiberByHostInstance: tc,
  bundleType: 0,
  version: "16.14.0",
  rendererPackageName: "react-dom"
});
reactDom_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = lk;
reactDom_production_min.createPortal = kk;
reactDom_production_min.findDOMNode = function(a2) {
  if (null == a2)
    return null;
  if (1 === a2.nodeType)
    return a2;
  var b2 = a2._reactInternalFiber;
  if (void 0 === b2) {
    if ("function" === typeof a2.render)
      throw Error(u(188));
    throw Error(u(268, Object.keys(a2)));
  }
  a2 = hc(b2);
  a2 = null === a2 ? null : a2.stateNode;
  return a2;
};
reactDom_production_min.flushSync = function(a2, b2) {
  if ((W$1 & (fj | gj)) !== V$1)
    throw Error(u(187));
  var c2 = W$1;
  W$1 |= 1;
  try {
    return cg(99, a2.bind(null, b2));
  } finally {
    W$1 = c2, gg();
  }
};
reactDom_production_min.hydrate = function(a2, b2, c2) {
  if (!gk(b2))
    throw Error(u(200));
  return ik(null, a2, b2, true, c2);
};
reactDom_production_min.render = function(a2, b2, c2) {
  if (!gk(b2))
    throw Error(u(200));
  return ik(null, a2, b2, false, c2);
};
reactDom_production_min.unmountComponentAtNode = function(a2) {
  if (!gk(a2))
    throw Error(u(40));
  return a2._reactRootContainer ? (Nj(function() {
    ik(null, null, a2, false, function() {
      a2._reactRootContainer = null;
      a2[Od] = null;
    });
  }), true) : false;
};
reactDom_production_min.unstable_batchedUpdates = Mj;
reactDom_production_min.unstable_createPortal = function(a2, b2) {
  return kk(a2, b2, 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null);
};
reactDom_production_min.unstable_renderSubtreeIntoContainer = function(a2, b2, c2, d) {
  if (!gk(c2))
    throw Error(u(200));
  if (null == a2 || void 0 === a2._reactInternalFiber)
    throw Error(u(38));
  return ik(a2, b2, c2, false, d);
};
reactDom_production_min.version = "16.14.0";
function checkDCE() {
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") {
    return;
  }
  try {
    __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
  } catch (err) {
    console.error(err);
  }
}
{
  checkDCE();
  reactDom.exports = reactDom_production_min;
}
var p = reactDom.exports;
var e = Object.defineProperty, t = Object.defineProperties, i = Object.getOwnPropertyDescriptors, s = Object.getOwnPropertySymbols, r = Object.prototype.hasOwnProperty, o = Object.prototype.propertyIsEnumerable, n = (t2, i2, s2) => i2 in t2 ? e(t2, i2, { enumerable: true, configurable: true, writable: true, value: s2 }) : t2[i2] = s2, a = (e2, t2) => {
  for (var i2 in t2 || (t2 = {}))
    r.call(t2, i2) && n(e2, i2, t2[i2]);
  if (s)
    for (var i2 of s(t2))
      o.call(t2, i2) && n(e2, i2, t2[i2]);
  return e2;
};
const h = { src: "", currentTime: 0, hostTime: 0, muted: false, paused: true, volume: 1 }, m = { currentTimeMaxError: 1, syncInterval: 1e3, retryInterval: 15e3, verbose: false, log: console.log.bind(console) };
let g = m;
function v(e2) {
  g = a(a({}, m), e2);
}
function f(e2, t2) {
  if (e2.paused)
    return e2.currentTime;
  const i2 = function(e3) {
    if (e3.player)
      return e3.player.beginTimestamp + e3.player.progressTime;
    if (e3.room)
      return e3.room.calibrationTimestamp;
  }(t2);
  return i2 ? e2.currentTime + (i2 - e2.hostTime) / 1e3 : e2.currentTime;
}
const A = navigator.userAgent.includes("Safari"), y = [".aac", ".mid", ".midi", ".mp3", ".ogg", ".oga", ".wav", ".weba"];
var b = "object" == typeof global && global && global.Object === Object && global, I = "object" == typeof self && self && self.Object === Object && self, S = b || I || Function("return this")(), T = S.Symbol, k = Object.prototype, E = k.hasOwnProperty, C = k.toString, P = T ? T.toStringTag : void 0;
var j = Object.prototype.toString;
var B = T ? T.toStringTag : void 0;
function w(e2) {
  return null == e2 ? void 0 === e2 ? "[object Undefined]" : "[object Null]" : B && B in Object(e2) ? function(e3) {
    var t2 = E.call(e3, P), i2 = e3[P];
    try {
      e3[P] = void 0;
      var s2 = true;
    } catch (o2) {
    }
    var r2 = C.call(e3);
    return s2 && (t2 ? e3[P] = i2 : delete e3[P]), r2;
  }(e2) : function(e3) {
    return j.call(e3);
  }(e2);
}
var x = /\s/;
var H = /^\s+/;
function Q(e2) {
  return e2 ? e2.slice(0, function(e3) {
    for (var t2 = e3.length; t2-- && x.test(e3.charAt(t2)); )
      ;
    return t2;
  }(e2) + 1).replace(H, "") : e2;
}
function M(e2) {
  var t2 = typeof e2;
  return null != e2 && ("object" == t2 || "function" == t2);
}
var L = /^[-+]0x[0-9a-f]+$/i, W = /^0b[01]+$/i, N = /^0o[0-7]+$/i, V = parseInt;
function O(e2) {
  if ("number" == typeof e2)
    return e2;
  if (function(e3) {
    return "symbol" == typeof e3 || function(e4) {
      return null != e4 && "object" == typeof e4;
    }(e3) && "[object Symbol]" == w(e3);
  }(e2))
    return NaN;
  if (M(e2)) {
    var t2 = "function" == typeof e2.valueOf ? e2.valueOf() : e2;
    e2 = M(t2) ? t2 + "" : t2;
  }
  if ("string" != typeof e2)
    return 0 === e2 ? e2 : +e2;
  e2 = Q(e2);
  var i2 = W.test(e2);
  return i2 || N.test(e2) ? V(e2.slice(2), i2 ? 2 : 8) : L.test(e2) ? NaN : +e2;
}
var z = function() {
  return S.Date.now();
}, D = Math.max, Z = Math.min;
function R(e2, t2, i2) {
  var s2, r2, o2, n2, a2, l2, c2 = 0, p2 = false, u2 = false, d = true;
  if ("function" != typeof e2)
    throw new TypeError("Expected a function");
  function h2(t3) {
    var i3 = s2, o3 = r2;
    return s2 = r2 = void 0, c2 = t3, n2 = e2.apply(o3, i3);
  }
  function m2(e3) {
    return c2 = e3, a2 = setTimeout(v2, t2), p2 ? h2(e3) : n2;
  }
  function g2(e3) {
    var i3 = e3 - l2;
    return void 0 === l2 || i3 >= t2 || i3 < 0 || u2 && e3 - c2 >= o2;
  }
  function v2() {
    var e3 = z();
    if (g2(e3))
      return f2(e3);
    a2 = setTimeout(v2, function(e4) {
      var i3 = t2 - (e4 - l2);
      return u2 ? Z(i3, o2 - (e4 - c2)) : i3;
    }(e3));
  }
  function f2(e3) {
    return a2 = void 0, d && s2 ? h2(e3) : (s2 = r2 = void 0, n2);
  }
  function A2() {
    var e3 = z(), i3 = g2(e3);
    if (s2 = arguments, r2 = this, l2 = e3, i3) {
      if (void 0 === a2)
        return m2(l2);
      if (u2)
        return clearTimeout(a2), a2 = setTimeout(v2, t2), h2(l2);
    }
    return void 0 === a2 && (a2 = setTimeout(v2, t2)), n2;
  }
  return t2 = O(t2) || 0, M(i2) && (p2 = !!i2.leading, o2 = (u2 = "maxWait" in i2) ? D(O(i2.maxWait) || 0, t2) : o2, d = "trailing" in i2 ? !!i2.trailing : d), A2.cancel = function() {
    void 0 !== a2 && clearTimeout(a2), c2 = 0, s2 = l2 = r2 = a2 = void 0;
  }, A2.flush = function() {
    return void 0 === a2 ? n2 : f2(z());
  }, A2;
}
class U extends react.exports.Component {
  constructor(e2) {
    super(e2), this.seeking = false, this.mobileSeeking = false, this.track = null, this.hoverTime = null, this.offset = 0, this.secondsPrefix = "00:00:", this.minutesPrefix = "00:", this.seekPause = false, this.handleTouchSeeking = (e3) => {
      let t2 = 0;
      for (let i2 = 0; i2 < e3.changedTouches.length; i2++)
        t2 = e3.changedTouches[i2].pageX;
      t2 = t2 < 0 ? 0 : t2, this.mobileSeeking && this.changeCurrentTimePosition(t2);
    }, this.handleSeeking = (e3) => {
      this.seeking && this.changeCurrentTimePosition(e3.pageX);
    }, this.setTrackWidthState = () => {
      this.track && this.setState({ trackWidth: this.track.offsetWidth });
    }, this.handleTrackHover = (e3, t2) => {
      if (this.track) {
        const i2 = this.props.scale || 1;
        let s2;
        s2 = e3 ? 0 : (t2.pageX - this.track.getBoundingClientRect().left) / i2, this.setState({ seekHoverPosition: s2, trackWidth: this.track.offsetWidth });
      }
    }, this.mouseSeekingHandler = (e3) => {
      this.setSeeking(false, e3), this.onMouseUp();
    }, this.setSeeking = (e3, t2) => {
      t2.preventDefault(), this.handleSeeking(t2), this.seeking = e3, this.setState({ seekHoverPosition: e3 ? this.state.seekHoverPosition : 0 });
    }, this.mobileTouchSeekingHandler = () => {
      this.setMobileSeeking(false);
    }, this.setMobileSeeking = (e3) => {
      this.mobileSeeking = e3, this.setState({ seekHoverPosition: e3 ? this.state.seekHoverPosition : 0 });
    }, this.renderBufferProgress = () => {
      if (this.props.buffered) {
        const e3 = a(a({}, this.getPositionStyle(this.props.buffered)), this.props.bufferColor && { backgroundColor: this.props.bufferColor });
        return l.createElement("div", { className: "buffered", style: e3 });
      }
      return null;
    }, this.renderProgress = () => {
      const e3 = a(a({}, this.getPositionStyle(this.props.current)), this.props.sliderColor && { backgroundColor: this.props.sliderColor });
      return l.createElement("div", { className: "connect", style: e3 });
    }, this.renderHoverProgress = () => {
      const e3 = a(a({}, this.getSeekHoverPosition()), this.props.sliderHoverColor && { backgroundColor: this.props.sliderHoverColor });
      return l.createElement("div", { className: "seek-hover", style: e3 });
    }, this.renderThumb = () => l.createElement("div", { className: this.isThumbActive() ? "thumb active" : "thumb", style: this.getThumbHandlerPosition() }, l.createElement("div", { style: { backgroundColor: this.props.thumbColor }, className: "handler" })), this.onMouseDown = (e3) => {
      var t2, i2;
      this.props.pause && !this.props.paused && (this.props.pause(), this.seekPause = true), this.setSeeking(true, e3), null == (i2 = (t2 = this.props).onSeekStart) || i2.call(t2);
    }, this.onMouseUp = () => {
      var e3, t2;
      this.props.play && this.seekPause && (this.props.play(), this.seekPause = false), null == (t2 = (e3 = this.props).onSeekEnd) || t2.call(e3);
    }, this.props.secondsPrefix && (this.secondsPrefix = this.props.secondsPrefix), this.props.minutesPrefix && (this.minutesPrefix = this.props.minutesPrefix), this.state = { ready: false, trackWidth: 0, seekHoverPosition: 0 };
  }
  componentDidMount() {
    this.setTrackWidthState(), window.addEventListener("resize", this.setTrackWidthState), window.addEventListener("mousemove", this.handleSeeking), window.addEventListener("mouseup", this.mouseSeekingHandler), window.addEventListener("touchmove", this.handleTouchSeeking), window.addEventListener("touchend", this.mobileTouchSeekingHandler);
  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.setTrackWidthState), window.removeEventListener("mousemove", this.handleSeeking), window.removeEventListener("mouseup", this.mouseSeekingHandler), window.removeEventListener("touchmove", this.handleTouchSeeking), window.removeEventListener("touchend", this.mobileTouchSeekingHandler);
  }
  changeCurrentTimePosition(e2) {
    if (this.track) {
      const t2 = this.props.scale || 1;
      let i2 = (e2 - this.track.getBoundingClientRect().left) / t2;
      i2 = Math.min(this.state.trackWidth, Math.max(0, i2)), this.setState({ seekHoverPosition: i2 });
      const s2 = +(i2 / this.state.trackWidth * this.props.total).toFixed(0);
      this.props.onChange(s2);
    }
  }
  getPositionStyle(e2) {
    return { transform: `scaleX(${100 * e2 / this.props.total / 100})` };
  }
  getThumbHandlerPosition() {
    return { transform: `translateX(${this.state.trackWidth / (this.props.total / this.props.current)}px)` };
  }
  getSeekHoverPosition() {
    return { transform: `scaleX(${100 * this.state.seekHoverPosition / this.state.trackWidth / 100})` };
  }
  getHoverTimePosition() {
    let e2 = 0;
    return this.hoverTime && (e2 = this.state.seekHoverPosition - this.hoverTime.offsetWidth / 2, this.props.limitTimeTooltipBySides && (e2 < 0 ? e2 = 0 : e2 + this.hoverTime.offsetWidth > this.state.trackWidth && (e2 = this.state.trackWidth - this.hoverTime.offsetWidth))), { transform: `translateX(${e2}px)` };
  }
  secondsToTime(e2) {
    e2 = Math.round(e2 + this.offset);
    const t2 = Math.floor(e2 / 3600), i2 = e2 % 3600, s2 = Math.floor(i2 / 60), r2 = Math.ceil(i2 % 60);
    return { hh: t2.toString(), mm: s2 < 10 ? "0" + s2 : s2.toString(), ss: r2 < 10 ? "0" + r2 : r2.toString() };
  }
  getHoverTime() {
    const e2 = 100 * this.state.seekHoverPosition / this.state.trackWidth, t2 = Math.floor(+e2 * (this.props.total / 100)), i2 = this.secondsToTime(t2);
    return this.props.total + this.offset < 60 ? this.secondsPrefix + i2.ss : this.props.total + this.offset < 3600 ? this.minutesPrefix + i2.mm + ":" + i2.ss : i2.hh + ":" + i2.mm + ":" + i2.ss;
  }
  isThumbActive() {
    return this.state.seekHoverPosition > 0 || this.seeking;
  }
  drawHoverTime() {
    return this.props.hideHoverTime ? null : l.createElement("div", { className: this.isThumbActive() ? "hover-time active" : "hover-time", style: this.getHoverTimePosition(), ref: (e2) => this.hoverTime = e2 }, this.getHoverTime());
  }
  render() {
    return l.createElement("div", { className: "seek-slider" }, l.createElement("div", { className: "track", ref: (e2) => this.track = e2, onMouseMove: (e2) => this.handleTrackHover(false, e2), onMouseLeave: (e2) => this.handleTrackHover(true, e2), onMouseDown: this.onMouseDown, onTouchStart: (e2) => {
      this.setMobileSeeking(true), this.onMouseDown(e2);
    }, onMouseUp: this.onMouseUp, onTouchEnd: this.onMouseUp }, l.createElement("div", { className: "main" }, this.renderBufferProgress(), this.renderHoverProgress(), this.renderProgress())), this.drawHoverTime(), this.renderThumb());
  }
}
class F extends react.exports.Component {
  constructor(e2) {
    super(e2), this.stageVolume = 0, this.updateVolumeTimer = 0, this.onVolumeSeeking = false, this.onClickOperationButton = () => {
      const { paused: e3 } = this.props;
      e3 ? this.props.play() : this.props.pause();
    }, this.operationButton = () => {
      const { paused: e3 } = this.props;
      return e3 ? l.createElement("img", { src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBhcmlhLWhpZGRlbj0idHJ1ZSIgcm9sZT0iaW1nIiBjbGFzcz0iaWNvbmlmeSBpY29uaWZ5LS1tZGkiIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQgbWVldCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNOCA1LjE0djE0bDExLTdsLTExLTd6IiBmaWxsPSIjZmZmIj48L3BhdGg+PC9zdmc+Cg==" }) : l.createElement("img", { src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBhcmlhLWhpZGRlbj0idHJ1ZSIgcm9sZT0iaW1nIiBjbGFzcz0iaWNvbmlmeSBpY29uaWZ5LS1tZGkiIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQgbWVldCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTQgMTloNFY1aC00TTYgMTloNFY1SDZ2MTR6IiBmaWxsPSIjZmZmIj48L3BhdGg+PC9zdmc+Cg==" });
    }, this.operationVolumeButton = () => this.props.volume > 0.9 ? l.createElement("img", { src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBhcmlhLWhpZGRlbj0idHJ1ZSIgcm9sZT0iaW1nIiBjbGFzcz0iaWNvbmlmeSBpY29uaWZ5LS1tZGkiIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQgbWVldCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTQgMy4yM3YyLjA2YzIuODkuODYgNSAzLjU0IDUgNi43MXMtMi4xMSA1Ljg0LTUgNi43djIuMDdjNC0uOTEgNy00LjQ5IDctOC43N2MwLTQuMjgtMy03Ljg2LTctOC43N00xNi41IDEyYzAtMS43Ny0xLTMuMjktMi41LTQuMDNWMTZjMS41LS43MSAyLjUtMi4yNCAyLjUtNE0zIDl2Nmg0bDUgNVY0TDcgOUgzeiIgZmlsbD0iI2ZmZiI+PC9wYXRoPjwvc3ZnPgo=" }) : 0 === this.props.volume ? l.createElement("img", { src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBhcmlhLWhpZGRlbj0idHJ1ZSIgcm9sZT0iaW1nIiBjbGFzcz0iaWNvbmlmeSBpY29uaWZ5LS1tZGkiIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQgbWVldCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNNyA5djZoNGw1IDVWNGwtNSA1SDd6IiBmaWxsPSIjZmZmIj48L3BhdGg+PC9zdmc+Cg==" }) : l.createElement("img", { src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBhcmlhLWhpZGRlbj0idHJ1ZSIgcm9sZT0iaW1nIiBjbGFzcz0iaWNvbmlmeSBpY29uaWZ5LS1tZGkiIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQgbWVldCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNNSA5djZoNGw1IDVWNEw5IDltOS41IDNjMC0xLjc3LTEtMy4yOS0yLjUtNC4wM1YxNmMxLjUtLjcxIDIuNS0yLjI0IDIuNS00eiIgZmlsbD0iI2ZmZiI+PC9wYXRoPjwvc3ZnPgo=" }), this.handleClickVolume = () => {
      0 === this.props.volume ? 0 !== this.stageVolume ? this.props.setVolume(this.stageVolume) : this.props.setVolume(1) : (this.stageVolume = this.props.volume, this.props.setVolume(0));
    }, this.onChange = (e3) => {
      this.setState({ currentTime: e3 }), e3 && this.changeTime(e3);
    }, this.changeTime = R((e3) => {
      this.props.setCurrentTime(e3);
    }, 50), this.onVolumeChange = (e3) => {
      this.changeVolume(e3), this.setState({ seekVolume: e3 / 100 });
    }, this.changeVolume = R((e3) => {
      this.props.setVolume(e3 / 100);
    }, 50), this.onVolumeSeekStart = () => {
      this.onVolumeSeeking = true;
    }, this.onVolumeSeekEnd = R(() => {
      this.onVolumeSeeking = false;
    }, 500), this.onProgressSeekStart = () => this.setState({ isPlayerSeeking: true }), this.onProgressSeekEnd = R(() => {
      this.setState({ isPlayerSeeking: false });
    }, 500), this.state = { isPlayerSeeking: false, isVolumeHover: false, seekVolume: 1, visible: true, currentTime: 0 }, this.stageVolume = e2.volume;
  }
  componentDidMount() {
    this.updateVolumeTimer = setInterval(() => {
      this.onVolumeSeeking || this.setState({ seekVolume: this.props.volume }), this.state.isPlayerSeeking || this.setState({ currentTime: this.props.currentTime });
    }, 100);
  }
  componentWillUnmount() {
    this.updateVolumeTimer && clearInterval(this.updateVolumeTimer);
  }
  render() {
    const { duration: e2, currentTime: t2 } = this.props;
    return l.createElement("div", { className: "player-controller", style: { opacity: this.props.visible ? "1" : "0" } }, l.createElement("div", { className: "player-controller-progress" }, l.createElement(U, { total: e2, current: this.state.currentTime, onChange: this.onChange, buffered: this.props.buffered, bufferColor: "rgba(255,255,255,0.3)", hideHoverTime: true, limitTimeTooltipBySides: true, onSeekStart: this.onProgressSeekStart, onSeekEnd: this.onProgressSeekEnd, play: this.props.play, pause: this.props.pause, paused: this.props.paused, scale: this.props.scale })), l.createElement("div", { className: "player-controller-actions" }, l.createElement("div", { className: "player-controller-actions-left" }, l.createElement("div", { onClick: this.onClickOperationButton, className: "player-controller-play" }, this.operationButton()), l.createElement("div", { className: "player-volume-box", onMouseEnter: () => this.setState({ isVolumeHover: true }), onMouseLeave: () => this.setState({ isVolumeHover: false }) }, l.createElement("div", { onClick: this.handleClickVolume, className: "player-volume" }, this.operationVolumeButton()), l.createElement("div", { className: "player-volume-slider" }, l.createElement(U, { total: 100, current: 100 * this.state.seekVolume, onChange: this.onVolumeChange, onSeekStart: this.onVolumeSeekStart, onSeekEnd: this.onVolumeSeekEnd, scale: this.props.scale, limitTimeTooltipBySides: true, hideHoverTime: true })))), l.createElement("div", { className: "player-mid-box-time" }, X(Math.floor(t2 / 1e3)), " /", " ", X(Math.floor(e2 / 1e3)))));
  }
}
function X(e2) {
  const t2 = e2 % 60, i2 = (e2 - t2) / 60;
  if (i2 >= 60) {
    const e3 = i2 % 60;
    return `${G((i2 - e3) / 60)}:${G(e3)}:${G(t2)}`;
  }
  return `${G(i2)}:${G(t2)}`;
}
function G(e2) {
  return e2 <= 9 ? `0${e2}` : `${e2}`;
}
let Y = 99999;
var J, K;
(K = J || (J = {}))[K.Idle = 0] = "Idle", K[K.Playing = 1] = "Playing", K[K.Paused = 2] = "Paused";
let q = {};
function $(e2, ...t2) {
  g.verbose && console.log(`[RTCEffect] ${e2}`, ...t2);
}
function _(e2, t2, i2) {
  function s2(t3) {
    0 === q[t3].playState ? (e2.playEffect(t3, i2, 0, 1, 0, 100, false, 0).then(() => {
      $(">>> Play Success", { playingId: t3 });
    }), q[t3].playState = 1) : $(">>> Skip Play", { playingId: t3, state: q[t3].playState });
  }
  function r2(e3) {
    q[e3].playState = 0, q[e3].previousVideoJSAdvance = 0, q[e3].previousSeekTargetTime = 0, q[e3].previousBeginSeekTime = 0;
  }
  t2.one("ready", () => {
    var i3;
    const o2 = (null == (i3 = null == t2 ? void 0 : t2.tagAttributes) ? void 0 : i3.src) || "";
    o2.endsWith("mp3") || o2.endsWith("wav") || o2.endsWith("m4a") || ($(">>> Mute js player", { src: o2 }), t2.muted(true), t2.muted = (e3) => false);
    const n2 = function() {
      const e3 = Y--, t3 = { playState: J.Idle, previousVideoJSAdvance: 0, previousSeekTargetTime: 0, previousBeginSeekTime: 0 };
      return q[e3] = t3, e3;
    }();
    $(">>> Setup", { playingId: n2, src: o2 }), e2.addListener("error", (e3) => {
      $(">>> Error", { soundId: e3 }), r2(e3);
    }), e2.addListener("effectFinished", (e3) => {
      $(">>> Finished", { soundId: e3 }), r2(e3);
    }), t2.on("play", () => {
      switch (q[n2].playState) {
        case 0:
          $(">>> Start play", { playingId: n2 }), s2(n2);
          break;
        case 2:
          $(">>> Resume play", { playingId: n2 }), e2.resumeEffect(n2), q[n2].playState = 1;
      }
    }), t2.on("pause", () => {
      const t3 = q[n2].playState;
      switch (t3) {
        case 1:
          $(">>> Pause play", { playingId: n2 }), e2.pauseEffect(n2), q[n2].playState = 2;
          break;
        default:
          $(">>> Skip Pause", { playingId: n2, currenState: t3 });
      }
    }), t2.on("timeupdate", () => {
      e2.getEffectCurrentPosition(n2).then((i4) => {
        const r3 = q[n2], o3 = i4 / 1e3, a2 = t2.currentTime(), l2 = 0 !== r3.previousSeekTargetTime && 0 !== r3.previousBeginSeekTime;
        if ($(`>>> EffectSecond rtc: ${o3} js: ${a2} seeking: ${l2}`, { playingId: n2 }), 0 == r3.playState)
          return void (t2.paused() || ($(">>> Play effect due to time update.", { playingId: n2 }), s2(n2)));
        if (l2 && o3 < r3.previousSeekTargetTime)
          return;
        if (1 !== r3.playState)
          return void $(">>> Skip timupdate", { playingId: n2, state: r3.playState, jsTime: t2.currentTime(), rtcEffectTime: o3 });
        function c2(t3, i5) {
          e2.setEffectPosition(i5, 1e3 * t3), r3.previousBeginSeekTime = Date.now() / 1e3, r3.previousSeekTargetTime = t3;
        }
        const p2 = r3.previousBeginSeekTime;
        if (i4 > 0) {
          const e3 = a2 - o3, t3 = Math.abs(e3), i5 = 0.5;
          if (t3 > i5)
            if (l2) {
              const t4 = r3.previousSeekTargetTime - o3, i6 = Date.now() / 1e3 - p2, s3 = i6 + (e3 > 0 ? e3 : 0), l3 = a2 + s3;
              c2(l3, n2), $(">>> Start seeking after seeking lag", { jsPlayerTime: a2, rtcEffectTime: o3, jsPlayerTimerAdvance: e3, lastSeekingCost: i6, estimatedRTCLag: s3, targetRTCSeekTime: l3, previousBeginSeekTime: p2, timeElapse: t4 });
            } else if (t3 > 10)
              c2(a2, n2), $(">>> DirectSeek", { time: a2, rtcEffectTime: o3, jsPlayerTimerAdvance: e3 });
            else {
              const t4 = r3.previousVideoJSAdvance, i6 = 0, s3 = a2 + i6;
              r3.previousVideoJSAdvance = i6, c2(s3, n2), $(">>> Start seeking with lag", { jsPlayerTime: a2, rtcEffectTime: o3, jsPlayerTimerAdvance: e3, previousAdvance: t4, estimatedRTCLag: i6, targetRTCSeekTime: s3 });
            }
          else
            l2 && ($(">>> SeekingFinish no lag", { jsPlayerTime: a2, rtcEffectTime: o3, jsPlayerTimerAdvance: e3, previousBeginSeekTime: p2, rtcLagTolerance: i5 }), r3.previousBeginSeekTime = 0, r3.previousSeekTargetTime = 0);
        }
      });
    }), t2.on("dispose", () => {
      q[n2].playState && (e2.stopEffect(n2), delete q[n2], $(">>> Dispose", { playingId: n2 }));
    });
  });
}
class ee extends react.exports.Component {
  constructor() {
    super(...arguments), this.putAttributes = (e2) => {
      const { context: t2 } = this.props, i2 = t2.getAttributes() || {};
      for (const s2 in e2)
        i2[s2] !== e2[s2] && t2.updateAttributes([s2], e2[s2]);
    };
  }
  render() {
    const { context: e2 } = this.props, t2 = e2.getRoom(), i2 = t2 ? void 0 : e2.getDisplayer(), s2 = this.putAttributes;
    return l.createElement(te, { room: t2, player: i2, context: e2, plugin: { putAttributes: s2 } });
  }
}
class te extends react.exports.Component {
  constructor(e2) {
    super(e2), this.alertMask = null, this.container = l.createRef(), this.controllerHiddenTimer = 0, this.syncPlayerTimer = 0, this.retryCount = 0, this.decreaseRetryTimer = 0, this.noSoundSyncCount = 0, this.showController = () => {
      this.setState({ controllerVisible: true }), this.debounceHidingController();
    }, this.play = () => {
      var e3;
      const t2 = null == (e3 = this.props.room) ? void 0 : e3.calibrationTimestamp;
      this.debug(">>> play", { paused: false, hostTime: t2 }), this.isEnabled() && this.props.plugin.putAttributes({ paused: false, hostTime: t2 });
    }, this.pause = () => {
      const e3 = f(this.getAttributes(), this.props);
      this.debug(">>> pause", { paused: true, currentTime: e3 }), this.isEnabled() && this.props.plugin.putAttributes({ paused: true, currentTime: e3 });
    }, this.setVolume = (e3) => {
      this.debug(">>> volume", { volume: e3 }), this.isEnabled() && this.props.plugin.putAttributes({ volume: e3 }), this.isEnabled() && this.props.plugin.putAttributes({ volume: e3, muted: 0 === e3 });
    }, this.setCurrentTime = (e3) => {
      var t2;
      const i2 = null == (t2 = this.props.room) ? void 0 : t2.calibrationTimestamp;
      this.debug(">>> seek", { currentTime: e3 / 1e3, hostTime: i2 }), this.isEnabled() && this.props.plugin.putAttributes({ currentTime: e3 / 1e3, hostTime: i2 });
    }, this.resetPlayer = () => {
      var e3;
      null == (e3 = this.player) || e3.autoplay(false), this.state.NoSound || (this.debug(">>> ended", { paused: true, currentTime: 0 }), this.isEnabled() && this.props.plugin.putAttributes({ paused: true, currentTime: 0 }));
    }, this.syncPlayerWithAttributes = () => {
      var e3;
      const t2 = this.getAttributes();
      if (!t2)
        return;
      const i2 = this.player;
      if (!i2)
        return;
      if (this.state.NoSound && (this.noSoundSyncCount += 1) % 8 != 0)
        return;
      i2.paused() !== t2.paused && (this.debug("<<< paused -> %o", t2.paused), t2.paused ? i2.pause() : null == (e3 = i2.play()) || e3.catch(this.catchPlayFail)), i2.muted() !== t2.muted && (this.debug("<<< muted -> %o", t2.muted), i2.muted(t2.muted)), i2.volume() !== t2.volume && (this.debug("<<< volume -> %o", t2.volume), i2.volume(t2.volume));
      const s2 = f(t2, this.props);
      let r2 = g.currentTimeMaxError;
      this.state.NoSound && (r2 *= 3), s2 > i2.duration() ? this.resetPlayer() : Math.abs(i2.currentTime() - s2) > r2 && (this.debug("<<< currentTime -> %o", s2), i2.currentTime(s2));
    }, this.debounceHidingController = () => {
      this.controllerHiddenTimer && (clearTimeout(this.controllerHiddenTimer), this.controllerHiddenTimer = 0), this.controllerHiddenTimer = setTimeout(() => {
        this.setState({ controllerVisible: false }), this.controllerHiddenTimer = 0;
      }, 3e3);
    }, this.decreaseRetryCount = () => {
      this.player && this.retryCount > 0 && (this.retryCount = this.retryCount - 1);
    }, this.catchPlayFail = (e3) => {
      var t2, i2;
      const s2 = String(e3);
      if (A && s2.includes("NotAllowedError") || s2.includes("interact"))
        null == (t2 = this.player) || t2.autoplay("any"), this.setState({ NoSound: true });
      else {
        const t3 = null == (i2 = this.player) ? void 0 : i2.error();
        t3 && (this.retryCount <= 3 ? (this.initPlayer(), this.retryCount = this.retryCount + 1) : (this.debug("catch videojs media error", t3), this.setState({ MediaError: true }))), this.debug("catch error", e3);
      }
    }, this.fixPlayFail = () => {
      this.debug("try to fix play state"), this.setState({ NoSound: false });
      const { muted: e3, volume: t2 } = this.getAttributes();
      this.player && (this.player.muted(e3), this.player.volume(t2));
    }, this.initPlayer = async () => {
      var e3;
      null == (e3 = this.player) || e3.dispose(), this.player = void 0, this.debug("creating elements ...");
      const { type: t2, src: i2, poster: s2 } = this.getAttributes(), r2 = document.createElement("div");
      r2.setAttribute("data-vjs-player", "");
      const o2 = document.createElement("video");
      o2.className = "video-js", s2 && (o2.poster = s2), o2.setAttribute("playsInline", ""), o2.setAttribute("webkit-playsinline", "");
      const n2 = document.createElement("source");
      new URL(i2).pathname.endsWith(".m3u8") ? n2.type = "application/x-mpegURL" : o2.src = i2, n2.src = i2, t2 && (n2.type = t2), o2.appendChild(n2), r2.appendChild(o2), this.container.current.appendChild(r2), await new Promise((e4) => (window.requestAnimationFrame || window.setTimeout)(e4)), this.debug("initializing videojs() ...");
      const a2 = u$3(o2);
      this.player = a2, window.player = a2, a2.one("loadedmetadata", this.gracefullyUpdate);
      const l2 = window.__mediaPlayerAudioEffectClient;
      void 0 !== l2 && _(l2, a2, i2), a2.on("ready", () => {
        var e4;
        null == (e4 = g.onPlayer) || e4.call(g, a2), a2.on("timeupdate", this.gracefullyUpdate), a2.on("volumechange", this.gracefullyUpdate), a2.on("seeked", this.gracefullyUpdate), a2.on("play", this.gracefullyUpdate), a2.on("pause", this.gracefullyUpdate), a2.on("ended", this.resetPlayer);
      }), a2.on("error", this.catchPlayFail), this.setState({ MediaError: false });
    }, this.gracefullyUpdate = () => this.setState({ updater: !this.state.updater }), this.setupAlert = (e3) => {
      e3 && (e3.addEventListener("touchstart", this.fixPlayFail), e3.addEventListener("click", this.fixPlayFail)), this.alertMask = e3;
    }, this.setupReload = (e3) => {
      e3 && (e3.addEventListener("touchstart", this.initPlayer), e3.addEventListener("click", this.initPlayer));
    }, this.state = { NoSound: false, MediaError: false, updater: false, controllerVisible: false }, e2.room && function(e3) {
      if (!e3.calibrationTimestamp)
        throw new Error("@netless/app-media-player@0.1.0-alpha.5 requires white-web-sdk@^2.13.8 to work properly.");
    }(e2.room);
  }
  getAttributes() {
    const { context: e2 } = this.props;
    let s2 = e2.getAttributes();
    if (s2) {
      if (s2 = a(a({}, h), s2), this.player) {
        let e3 = f(s2, this.props), o2 = this.player.duration();
        !s2.paused && e3 > o2 && (r2 = a({}, s2), s2 = t(r2, i({ currentTime: 0, paused: true })), this.resetPlayer());
      }
      var r2;
      return s2;
    }
  }
  isShowingPoster() {
    const e2 = this.getAttributes();
    return !(null == e2 ? void 0 : e2.src) || y.some((t2) => e2.src.endsWith(t2));
  }
  render() {
    var e2, t2;
    if (!this.props.room && !this.props.player)
      return null;
    const i2 = this.getAttributes();
    if (!i2)
      return null;
    const s2 = 1e3 * ((null == (e2 = this.player) ? void 0 : e2.duration()) || 1e3), r2 = (null == (t2 = this.player) ? void 0 : t2.bufferedPercent()) || 0;
    return l.createElement("div", { className: this.isEnabled() ? "vjs-p" : "vjs-p disabled", onMouseEnter: this.showController, onMouseMove: this.showController }, l.createElement("div", { className: "video-js-plugin-player", ref: this.container }), this.isShowingPoster() && l.createElement("div", { className: "video-js-plugin-poster" }, i2.poster && l.createElement("img", { src: i2.poster, alt: "", draggable: false })), l.createElement(F, { duration: s2, volume: i2.volume, setVolume: this.setVolume, paused: i2.paused, play: this.play, pause: this.pause, currentTime: 1e3 * f(i2, this.props), setCurrentTime: this.setCurrentTime, buffered: s2 * r2, visible: true }), this.state.NoSound && l.createElement("div", { ref: this.setupAlert, className: "videojs-plugin-muted-alert" }), this.state.MediaError && l.createElement("div", { className: "videojs-plugin-recovery-mode" }, l.createElement("button", { ref: this.setupReload }, "Reload Player")));
  }
  debug(e2, ...t2) {
    g.verbose && g.log(`[MediaPlayer] ${e2}`, ...t2);
  }
  componentDidMount() {
    this.debug("app version =", "0.1.0-alpha.5"), this.debug("video.js version =", u$3.VERSION), this.initPlayer(), this.props.context.emitter.on("attributesUpdate", this.syncPlayerWithAttributes), this.syncPlayerTimer = setInterval(this.syncPlayerWithAttributes, g.syncInterval), this.decreaseRetryTimer = setInterval(this.decreaseRetryCount, g.retryInterval);
  }
  componentWillUnmount() {
    var e2;
    this.debug("unmount"), this.props.context.emitter.off("attributesUpdate", this.syncPlayerWithAttributes), null == (e2 = this.player) || e2.dispose(), clearInterval(this.syncPlayerTimer), clearInterval(this.decreaseRetryTimer);
  }
  isEnabled() {
    return this.props.context.getIsWritable();
  }
}
const ie = { kind: "MediaPlayer", setup(e2) {
  let t2 = e2.getAttributes();
  if (!t2 || !t2.src)
    return e2.emitter.emit("destroy", { error: new Error("[MediaPlayer]: Missing 'attributes'.'src'.") });
  t2 = a(a({}, h), t2);
  const i2 = e2.getBox();
  i2.mountStyles('.vjs-p{display:flex;flex-grow:1}.vjs-p *{pointer-events:auto}.vjs-p.disabled *{pointer-events:none}.vjs-p .video-js-plugin-poster{position:absolute;top:0;left:0;right:0;bottom:0;background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgQAAACACAYAAAB0vHFxAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAACBKADAAQAAAABAAAAgAAAAACE3oPTAAAKXUlEQVR4Ae3dYW4ktxEG0LW9FwkC2McycokAOUGAXMLwtQwYvomdP4akHUnNnm6SVUU+/xqpe8ji+yiDWz3a/e7L5v/98se//3pL8K9//O+7t19Hv85eX7RP9vnllz2h4/rkd+wz+ir/0cLfjv/9t1/6igABAgQIENhRwIFgx9StmQABAgQIPAg4EDyA+JIAAQIECOwo8HXHRVvzPIHRzwBHjz9PKudMo31Hj59TdZ2qsueXvb5sO0GHIFsi6iFAgAABAgECOgQB6KbsJ5Dtt0L6rWyPkeRXO+fs+WWvL1v6OgTZElEPAQIECBAIENAhCEA3ZT8Bzwj7WUaMJL8I9X5zZs8ve339kugzkg5BH0ejECBAgACB0gIOBKXjUzwBAgQIEOgj4EDQx9EoBAgQIECgtIADQen4FE+AAAECBPoIOBD0cTQKAQIECBAoLeC3DErHp/iWgE8Zt4RyX5df7nxa1Y3Ob/T4rfWtdl2HYLVErYcAAQIECFwQWL5DsPoJcvX1XdjTpd4iv1JxvStWfu9IfCORwLP7U4cgUXhKIUCAAAECUQIOBFHy5iVAgAABAokEHAgShaEUAgQIECAQJXD7MwTPPqOIWujVeUevb/T4V9ftfecE5HfOKetd8suajLoiBHQIItTNSYAAAQIEkgnc7hAkW0/3ckb/e9qjx+8OYsBvBOT3DUe5L+RXLjIFDxTQIRiIa2gCBAgQIFBFoNkh2P0Z2+j1jx4/+0asvv7q9d/dH9XXX73+3fO7u/7W+3fbHzoErR3hOgECBAgQ2ECg2SHwjG2DXRC4xOj9tdufAHpHLb/eonPHk9+xd7TPcXX9r+oQ9Dc1IgECBAgQKCfgQFAuMgUTIECAAIH+Ag4E/U2NSIAAAQIEygk0P0MQvaLsz3hb9bWu840WOJ5ffsc+2a/KL3tC6jsSmL1/dQiO0nCNAAECBAhsItDsEMw+oTzrHl1f61OorevPrvfZ+6N9WvVmr09+xwnKr7ZP9vyOdcdfze7Tuz4dgvF7ygwECBAgQCC9QLNDkH0F0X+C45NdoHZ99rf8aguofqRA7/8/6BCMTMvYBAgQIECgiED5DkHvZyhFcjtdJp/TVClvlF/KWE4XJb/TVG68INB7f+kQXAjBWwgQIECAwGoCDgSrJWo9BAgQIEDggoADwQU0byFAgAABAqsJfO39DGI1IOuJFbA/Y/3vzi6/u4Kx7189v7vru/v+2HTfz65D8N7EdwgQIECAwHYCw3/LYLUT1HY7pLFg+TaAkl+WX/KAGuXJrwEUfLlaPjoEwRvG9AQIECBAIIPA8A5B779JKQOaGl4F5PtqUfGV/Cqm9lqz/F4tMr6qlo8OQcZdpCYCBAgQIDBZYHiHoNozlMn+5aeTb+0I5Se/2gK5q6/286VDkHs/qY4AAQIECEwRcCCYwmwSAgQIECCQW8CBIHc+qiNAgAABAlMEhn+GYMoqTEKAAAEC7wSqPcN+twDfmCqgQzCV22QECBAgQCCnQHiHoPoJtlV/63rObfFaVfX6X1dy7VX19Vev/1pqr++qvv7q9b8m4dVHAtny1SH4KCXfI0CAAAECmwmEdwiq/U1Om+2PL/Kpnbj85FdbYO3qs/186hCsvd+sjgABAgQInBJwIDjF5CYCBAgQILC2gAPB2vlaHQECBAgQOCUQ/hmCbJ+yPKW20U3yqR22/ORXW2Dt6qN/Ph/n1yFYe79ZHQECBAgQOCXgQHCKyU0ECBAgQGBtAQeCtfO1OgIECBAgcErAgeAUk5sIECBAgMDaAg4Ea+drdQQIECBA4JTA1+///OGnoztd52N/fC7g58PPx+e748sX+8P+qLQ/dAiO0nKNAAECBAhsIuBAsEnQlkmAAAECBI4EHAiOdFwjQIAAAQKbCDgQbBK0ZRIgQIAAgSMBB4IjHdcIECBAgMAmAuH/lsHP//zvb5tYl1ymfErG9lK0/F4oSr6QX8nYThcdne/j/DoEp6NzIwECBAgQWFfAgWDdbK2MAAECBAicFnAgOE3lRgIECBAgsK5A+GcIfv39Pz++5X18pvH2mtfzBeQz37znjPLrqTl/LPnNN585Y7Z8dQhmpm8uAgQIECCQVCC8Q1C9I9Cqv3U96b54Kat6/S8Lufii+vqr138xtpe3VV9/9fpfgvDiQ4Fs+eoQfBiTbxIgQIAAgb0EwjsEe3FbLQECBOYJZPsT6LyVm+mKgA7BFTXvIUCAAAECiwk4ECwWqOUQIECAAIErAg4EV9S8hwABAgQILCYw/DMEnmEttmMeliPfB5BiX8qvWGAP5crvASTZl9Xy0SFItoGUQ4AAAQIEIgSGdwiy/U1MEcgrzynf2unKT361BXJXX+3nS4cg935SHQECBAgQmCIwvENQ7RnKFPWFJpFv7TDlJ7/aArmrr/bzpUOQez+pjgABAgQITBH4Wu0EM0XFJGkE7M80UVwqRH6X2NK8afX87q7v7vvTBP13IToE2RJRDwECBAgQCBBwIAhANyUBAgQIEMgm4ECQLRH1ECBAgACBAIHhv2Uwek2rPcPp7cWnt+jc8eQ317v3bPLrLWq8twK995cOwVtdrwkQIECAwKYC5TsE1f4mqNn7jM9s8b7zya+v5+zR5DdbfK/5eu8vHYK99o/VEiBAgACBDwWaHYLezyg+rOLGN6Pra53QWtdvLP3UW6N9WkVmr09+xwnKr7ZP9vyOdcdfze7Tuz4dgvF7ygwECBAgQCC9QLNDEL2C3ieg3utp1de63rueZ8fLXt+z6+l9f3af7PX1zuPZ8bL7ZK/vWW/39xWYvT90CPrmZzQCBAgQIFBSwIGgZGyKJkCAAAECfQUcCPp6Go0AAQIECJQUaH6GIPpT1iVVFX1aIHp/zX5GdxqmyI3yKxLUJ2XK7xOYv78d7XNcXf+rOgT9TY1IgAABAgTKCTQ7BLv/CWr0+kePn31HVl9/9frv7o/q669e/+753V1/6/277Q8dgtaOcJ0AAQIECGwg0OwQbGBwuMTRz5BGj3+4OBdvC8jvNmHoAPIL5Td5MgEdgmSBKIcAAQIECEQI3O4QrP6MZfT6Ro8fsal2mlN+tdOWX+38VN9XQIegr6fRCBAgQIBASQEHgpKxKZoAAQIECPQVcCDo62k0AgQIECBQUuD2Zwiyr3r1Z4Srry/7/rpbn/zuCsa+X36x/mY/Fnh2f+oQHHu6SoAAAQIEthBYvkOwRYoW+anAsyfkTwdyIURAfiHs3SYdnd/o8btBFBlIh6BIUMokQIAAAQIjBRwIRuoamwABAgQIFBFwICgSlDIJECBAgMBIAQeCkbrGJkCAAAECRQQcCIoEpUwCBAgQIDBSwG8ZjNQ19nABnzIeTjx0AvkN5R0+ePb8stc3PKAnJ9AheBLM7QQIECBAYEUBHYIVU91oTf49+9phy09+IwXsr+d0dQie83I3AQIECBBYUkCHYMlY8yxq9DO80ePnkYypZLTv6PFj1PaZNXt+2evLtlN0CLIloh4CBAgQIBAg4EAQgG5KAgQIECCQTcCBIFsi6iFAgAABAgEC/wdVfx9UuC8B6AAAAABJRU5ErkJggg==);background-repeat:repeat-x;background-position:0 50%;display:flex;align-items:center;justify-content:center}.vjs-p .video-js-plugin-poster img{box-shadow:0 0 5px 10px #0006}.vjs-p .player-controller,.vjs-p .videojs-plugin-muted-alert{pointer-events:auto}.vjs-p.disabled .videojs-plugin-close-icon,.vjs-p.disabled .player-controller{pointer-events:none}.vjs-p .video-js-plugin-player{position:absolute;top:0;left:0;right:0;bottom:0}.video-js,[data-vjs-player]{width:100%;height:100%}.vjs-p .videojs-plugin-muted-alert{pointer-events:auto;cursor:pointer;position:absolute;top:0;left:0;right:0;bottom:0;z-index:43}.vjs-p .videojs-plugin-muted-alert:before{pointer-events:auto;cursor:pointer;position:absolute;top:0;left:0;right:0;bottom:0;z-index:43;content:"\\f104";background:rgba(0,0,0,.3);font-family:VideoJS;font-size:2em;display:flex;align-items:center;justify-content:center;color:#fff}.vjs-p .videojs-plugin-recovery-mode{pointer-events:auto;cursor:pointer;position:absolute;top:0;left:0;right:0;bottom:0;z-index:44}.vjs-p .videojs-plugin-recovery-mode button{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}.vjs-p .seek-slider{position:relative;width:100%}.vjs-p .seek-slider:focus{outline:none}.vjs-p .seek-slider .track{padding:10px 0;cursor:pointer;outline:none}.vjs-p .seek-slider .track:focus{border:0;outline:none}.vjs-p .seek-slider .track .main{width:100%;height:3px;background-color:#ffffff4d;border-radius:30px;position:absolute;left:0;top:8.5px;transition:transform .4s;outline:none}.vjs-p .seek-slider .track .main:focus{border:0;outline:none}.vjs-p .seek-slider .track .main .buffered{position:absolute;background-color:#ffffff4d;width:100%;height:100%;transform:scaleX(.8);z-index:2;transform-origin:0 0}.vjs-p .seek-slider .track .main .seek-hover{position:absolute;background-color:#ffffff80;width:100%;height:100%;z-index:1;transform:scaleX(.6);transform-origin:0 0;opacity:0;transition:opacity .4s}.vjs-p .seek-slider .track .main .connect{position:absolute;background-color:#fff;width:100%;height:100%;z-index:3;left:0;transform:scaleX(.13);transform-origin:0 0}.vjs-p .seek-slider .track.active .main{transform:scaleY(2)}.vjs-p .seek-slider .thumb{pointer-events:none;position:absolute;width:12px;height:12px;left:-6px;top:4px;z-index:4;transform:translate(100px)}.vjs-p .seek-slider .thumb .handler{border-radius:100%;width:100%;height:100%;background-color:#fff;opacity:0;transform:scale(.4);cursor:pointer;transition:transform .2s;pointer-events:none}.vjs-p .seek-slider .thumb.active .handler{opacity:1;transform:scale(1)}.vjs-p .seek-slider .hover-time{position:absolute;background-color:#0000004d;line-height:18px;font-size:16px;color:#ddd;top:-25px;left:0;padding:5px 10px;border-radius:5px;box-shadow:0 0 5px #0000004d;opacity:0;transform:translate(150px);pointer-events:none}.vjs-p .seek-slider .hover-time.active{opacity:1}.vjs-p .seek-slider:hover .track .main .seek-hover{opacity:1}.vjs-p .player-controller{position:absolute;z-index:100;bottom:0px;left:0;width:100%;display:flex;flex-direction:column;justify-content:center;align-items:stretch;height:64px;background-image:linear-gradient(0deg,#000,transparent);transition:opacity .2s;color:#fff}.vjs-p .player-menu-box{display:flex;align-items:center;justify-content:center;flex-direction:column;margin-bottom:40px}.vjs-p .player-menu-cell{width:100%;text-align:center;font-size:12px;color:#7a7b7c}.vjs-p .player-multiple-play{width:64px;height:120px}.vjs-p .player-controller-actions-left{display:flex;justify-content:center;align-items:center;flex-shrink:0}.vjs-p .player-right-box{font-size:14px;color:#7a7b7c;cursor:pointer;margin-right:12px}.vjs-p .player-controller-actions{display:flex;flex-direction:row;justify-content:space-between;align-items:center;padding-left:8px;padding-right:8px;margin-top:2px}.vjs-p .player-mid-box-time{font-size:9px;display:flex;justify-content:center;align-items:center;color:#fff;flex-shrink:0;margin-right:8px;font-family:monospace}.vjs-p .player-controller-play{display:flex;align-items:center;justify-content:center;cursor:pointer;padding-right:4px}.vjs-p .player-controller-progress{width:calc(100% - 28px);margin-left:14px;display:flex;align-items:center;justify-content:center;margin-top:8px}.vjs-p .player-volume{display:flex;align-items:center;justify-content:center;cursor:pointer;margin-right:16px;margin-left:8px}.vjs-p .player-volume-slider{width:60px;margin-right:12px;display:flex;align-items:center}.vjs-p .player-volume-box{display:flex;flex-direction:row}.netless-app-media-player-container{display:flex;position:relative;height:100%}\n');
  const s2 = document.createElement("div");
  s2.classList.add("netless-app-media-player-container"), p.render(l.createElement(ee, { context: e2 }), s2), i2.mountContent(s2), e2.emitter.on("destroy", () => {
    console.log("[MediaPlayer]: destroy"), p.unmountComponentAtNode(s2);
  });
} };
const setupBuiltin = () => {
  if (WindowManager.debug) {
    v({ verbose: true });
  }
  WindowManager.register({
    kind: NetlessAppDocsViewer.kind,
    src: NetlessAppDocsViewer
  });
  WindowManager.register({
    kind: ie.kind,
    src: ie
  });
};
const BuiltinApps = {
  DocsViewer: NetlessAppDocsViewer.kind,
  MediaPlayer: ie.kind
};
var videoJs = "";
var style$1 = "";
var style = "";
var IframeEvents = /* @__PURE__ */ ((IframeEvents2) => {
  IframeEvents2["Init"] = "Init";
  IframeEvents2["AttributesUpdate"] = "AttributesUpdate";
  IframeEvents2["SetAttributes"] = "SetAttributes";
  IframeEvents2["RegisterMagixEvent"] = "RegisterMagixEvent";
  IframeEvents2["RemoveMagixEvent"] = "RemoveMagixEvent";
  IframeEvents2["RemoveAllMagixEvent"] = "RemoveAllMagixEvent";
  IframeEvents2["RoomStateChanged"] = "RoomStateChanged";
  IframeEvents2["DispatchMagixEvent"] = "DispatchMagixEvent";
  IframeEvents2["ReciveMagixEvent"] = "ReciveMagixEvent";
  IframeEvents2["NextPage"] = "NextPage";
  IframeEvents2["PrevPage"] = "PrevPage";
  IframeEvents2["SDKCreate"] = "SDKCreate";
  IframeEvents2["OnCreate"] = "OnCreate";
  IframeEvents2["SetPage"] = "SetPage";
  IframeEvents2["GetAttributes"] = "GetAttributes";
  IframeEvents2["Ready"] = "Ready";
  IframeEvents2["Destory"] = "Destory";
  IframeEvents2["StartCreate"] = "StartCreate";
  IframeEvents2["WrapperDidUpdate"] = "WrapperDidUpdate";
  IframeEvents2["DispayIframe"] = "DispayIframe";
  IframeEvents2["HideIframe"] = "HideIframe";
  IframeEvents2["GetRootRect"] = "GetRootRect";
  IframeEvents2["ReplayRootRect"] = "ReplayRootRect";
  IframeEvents2["PageTo"] = "PageTo";
  return IframeEvents2;
})(IframeEvents || {});
var DomEvents = /* @__PURE__ */ ((DomEvents2) => {
  DomEvents2["WrapperDidMount"] = "WrapperDidMount";
  DomEvents2["IframeLoad"] = "IframeLoad";
  return DomEvents2;
})(DomEvents || {});
const RefreshIDs = {
  Ready: "Ready",
  RootRect: "ReplayRootRect",
  Message: "message",
  ComputeStyle: "computeStyle",
  Load: "load",
  DisplayerState: "displayerState",
  Show: "show",
  Hide: "hide"
};
const times = (number2, iteratee) => {
  return new Array(number2).fill(0).map((_2, index2) => iteratee(index2));
};
const _IframeBridge = class {
  constructor(manager, appManager) {
    this.manager = manager;
    this.appManager = appManager;
    this.magixEventMap = /* @__PURE__ */ new Map();
    this.cssList = [];
    this.allowAppliances = ["clicker"];
    this.bridgeDisposer = noop$2;
    this.rootRect = null;
    this.sideEffectManager = new o$2();
    this.execListenIframe = debounce((options) => {
      this.listenIframe(options);
    }, 50);
    this.onPhaseChangedListener = (phase) => {
      if (phase === PlayerPhase.Playing) {
        this.computedStyleAndIframeDisplay();
      }
    };
    this.stateChangeListener = (state) => {
      state = { ...state };
      state.cameraState = this.manager.cameraState;
      this.postMessage({ kind: "RoomStateChanged", payload: state });
      if (state.cameraState) {
        _IframeBridge.emitter.emit("GetRootRect");
        this.computedStyle(state);
      }
      if (state.memberState) {
        this.computedZindex();
        this.updateStyle();
      }
      if (state.sceneState) {
        this.computedIframeDisplay(state, this.attributes);
      }
    };
    this.displayer = _IframeBridge.displayer = appManager.displayer;
    this.iframe = this._createIframe();
    this.sideEffectManager.addDisposer(
      _IframeBridge.emitter.on("ReplayRootRect", (rect) => {
        this.rootRect = rect;
      }),
      RefreshIDs.RootRect
    );
    this.sideEffectManager.addDisposer(
      _IframeBridge.emitter.on("HideIframe", () => {
        this.iframe.className = _IframeBridge.hiddenClass;
      }),
      RefreshIDs.Hide
    );
    this.sideEffectManager.addDisposer(
      _IframeBridge.emitter.on("DispayIframe", () => {
        this.iframe.className = "";
      }),
      RefreshIDs.Show
    );
    this.sideEffectManager.addDisposer(
      _IframeBridge.emitter.on("created", () => {
        this.bridgeDisposer();
        this.bridgeDisposer = autorun(() => {
          var _a;
          const attributes = this.attributes;
          if (attributes.url) {
            const iframeSrc = (_a = this.iframe) == null ? void 0 : _a.src;
            if (iframeSrc && iframeSrc !== attributes.url) {
              this.execListenIframe(attributes);
            }
          }
          if (attributes.displaySceneDir) {
            this.computedIframeDisplay(this.displayer.state, attributes);
          }
          if ((attributes.width || attributes.height) && this.iframe) {
            this.iframe.width = `${attributes.width}px`;
            this.iframe.height = `${attributes.height}px`;
          }
          this.postMessage({ kind: "AttributesUpdate", payload: attributes });
        });
      })
    );
    this.sideEffectManager.addDisposer(
      manager.emitter.on("cameraStateChange", () => {
        this.computedStyle(this.displayer.state);
      })
    );
    _IframeBridge.onCreate(this);
  }
  static onCreate(plugin) {
    _IframeBridge.emitter.emit("StartCreate");
    _IframeBridge.emitter.emit("OnCreate", plugin);
    _IframeBridge.emitter.emit("created");
  }
  insert(options) {
    const initAttributes = {
      url: options.url,
      width: options.width,
      height: options.height,
      displaySceneDir: options.displaySceneDir,
      useClicker: options.useClicker || false,
      useSelector: options.useSelector
    };
    this.setAttributes(initAttributes);
    const wrapperDidMountListener = () => {
      this.getIframe();
      this.listenIframe(this.attributes);
      this.listenDisplayerState();
      _IframeBridge.emitter.emit("GetRootRect");
    };
    if (this.getIframe()) {
      wrapperDidMountListener();
    } else {
      const didMount = this.sideEffectManager.addDisposer(
        _IframeBridge.emitter.on("WrapperDidMount", () => {
          wrapperDidMountListener();
          this.sideEffectManager.flush(didMount);
        })
      );
      const didUpdate = this.sideEffectManager.addDisposer(
        _IframeBridge.emitter.on("WrapperDidUpdate", () => {
          wrapperDidMountListener();
          this.sideEffectManager.flush(didUpdate);
        })
      );
    }
    if (this.attributes.useSelector) {
      this.allowAppliances.push("selector");
    }
    this.computedStyle(this.displayer.state);
    this.listenDisplayerCallbacks();
    this.getComputedIframeStyle();
    this.sideEffectManager.addEventListener(
      window,
      "message",
      this.messageListener.bind(this),
      void 0,
      RefreshIDs.Message
    );
    _IframeBridge.alreadyCreate = true;
    return this;
  }
  getComputedIframeStyle() {
    this.sideEffectManager.setTimeout(
      () => {
        if (this.iframe) {
          getComputedStyle(this.iframe);
        }
      },
      200,
      RefreshIDs.ComputeStyle
    );
  }
  destroy() {
    this.sideEffectManager.flushAll();
    _IframeBridge.emitter.emit("Destory");
    _IframeBridge.alreadyCreate = false;
    _IframeBridge.emitter.clearListeners();
  }
  getIframe() {
    this.iframe || (this.iframe = this._createIframe());
    return this.iframe;
  }
  setIframeSize(params) {
    if (this.iframe) {
      this.iframe.width = `${params.width}px`;
      this.iframe.height = `${params.height}px`;
      this.setAttributes({ width: params.width, height: params.height });
    }
  }
  get attributes() {
    return this.appManager.store.getIframeBridge();
  }
  setAttributes(data) {
    this.appManager.store.setIframeBridge(data);
  }
  _createIframe() {
    const iframe = document.createElement("iframe");
    iframe.id = "IframeBridge";
    iframe.className = _IframeBridge.hiddenClass;
    if (this.appManager.mainView.divElement) {
      this.appManager.mainView.divElement.appendChild(iframe);
    }
    return iframe;
  }
  scaleIframeToFit(animationMode = AnimationMode.Immediately) {
    if (!this.inDisplaySceneDir) {
      return;
    }
    const { width = 1280, height = 720 } = this.attributes;
    const x2 = width ? -width / 2 : 0;
    const y2 = height ? -height / 2 : 0;
    this.manager.moveCameraToContain({
      originX: x2,
      originY: y2,
      width,
      height,
      animationMode
    });
  }
  get isReplay() {
    return this.manager.isReplay;
  }
  handleSetPage(data) {
    if (this.isReplay || !this.attributes.displaySceneDir) {
      return;
    }
    const page = data.payload;
    const room = this.displayer;
    const scenes = room.entireScenes()[this.attributes.displaySceneDir];
    if (!scenes || scenes.length !== page) {
      const genScenes = times(page, (index2) => ({
        name: String(index2 + 1)
      }));
      room.putScenes(this.attributes.displaySceneDir, genScenes);
      this.manager.setMainViewScenePath(this.attributes.displaySceneDir);
    }
  }
  listenIframe(options) {
    const loadListener = (ev) => {
      var _a;
      this.postMessage({
        kind: "Init",
        payload: {
          attributes: this.attributes,
          roomState: (_a = _IframeBridge.displayer) == null ? void 0 : _a.state,
          currentPage: this.currentPage,
          observerId: this.displayer.observerId
        }
      });
      _IframeBridge.emitter.emit("IframeLoad", ev);
      this.sideEffectManager.addDisposer(
        _IframeBridge.emitter.on("Ready", () => {
          var _a2;
          this.postMessage((_a2 = this.attributes.lastEvent) == null ? void 0 : _a2.payload);
        }),
        RefreshIDs.Ready
      );
      this.computedStyleAndIframeDisplay();
    };
    if (options.url && this.iframe.src !== options.url) {
      if (!this.src_url_equal_anchor)
        this.src_url_equal_anchor = document.createElement("a");
      this.src_url_equal_anchor.href = options.url;
      if (this.src_url_equal_anchor.href !== this.iframe.src) {
        this.iframe.src = options.url;
      }
    }
    this.iframe.width = `${options.width}px`;
    this.iframe.height = `${options.height}px`;
    this.sideEffectManager.addEventListener(
      this.iframe,
      "load",
      loadListener,
      void 0,
      RefreshIDs.Load
    );
  }
  listenDisplayerState() {
    if (this.isReplay) {
      if (this.displayer._phase === PlayerPhase.Playing) {
        this.computedStyleAndIframeDisplay();
      }
      this.sideEffectManager.add(() => {
        this.displayer.callbacks.on("onPhaseChanged", this.onPhaseChangedListener);
        return () => this.displayer.callbacks.off("onPhaseChanged", this.onPhaseChangedListener);
      }, RefreshIDs.DisplayerState);
    }
    this.computedStyleAndIframeDisplay();
  }
  computedStyleAndIframeDisplay() {
    this.computedStyle(this.displayer.state);
    this.computedIframeDisplay(this.displayer.state, this.attributes);
  }
  listenDisplayerCallbacks() {
    this.displayer.callbacks.on(this.callbackName, this.stateChangeListener);
  }
  get callbackName() {
    return this.isReplay ? "onPlayerStateChanged" : "onRoomStateChanged";
  }
  computedStyle(_state) {
    const cameraState = this.manager.cameraState;
    const setWidth = this.attributes.width || 1280;
    const setHeight = this.attributes.height || 720;
    if (this.iframe) {
      const { width, height, scale: scale2, centerX, centerY } = cameraState;
      const rootRect = this.rootRect || { x: 0, y: 0 };
      const transformOriginX = `${width / 2 + rootRect.x}px`;
      const transformOriginY = `${height / 2 + rootRect.y}px`;
      const transformOrigin = `transform-origin: ${transformOriginX} ${transformOriginY};`;
      const iframeXDiff = (width - setWidth) / 2 * scale2;
      const iframeYDiff = (height - setHeight) / 2 * scale2;
      const x2 = -(centerX * scale2) + iframeXDiff;
      const y2 = -(centerY * scale2) + iframeYDiff;
      const transform = `transform: translate(${x2}px,${y2}px) scale(${scale2}, ${scale2});`;
      const position = "position: absolute;";
      const borderWidth = "border: 0.1px solid rgba(0,0,0,0);";
      const left = `left: 0px;`;
      const top = `top: 0px;`;
      const cssList = [position, borderWidth, top, left, transformOrigin, transform];
      this.cssList = cssList;
      this.computedZindex();
      this.updateStyle();
    }
  }
  computedIframeDisplay(_state, _attributes) {
    if (this.inDisplaySceneDir) {
      _IframeBridge.emitter.emit("DispayIframe");
    } else {
      _IframeBridge.emitter.emit("HideIframe");
    }
  }
  computedZindex() {
    const zIndexString = "z-index: -1;";
    const index2 = this.cssList.findIndex((css) => css === zIndexString);
    if (index2 !== -1) {
      this.cssList.splice(index2, 1);
    }
    if (!this.isClicker() || this.isDisableInput) {
      this.cssList.push(zIndexString);
    }
  }
  updateStyle() {
    this.iframe.style.cssText = this.cssList.join(" ");
  }
  get iframeOrigin() {
    if (this.iframe) {
      try {
        return new URL(this.iframe.src).origin;
      } catch (err) {
        console.warn(err);
      }
    }
  }
  messageListener(event) {
    log("<<<", JSON.stringify(event.data));
    if (event.origin !== this.iframeOrigin) {
      return;
    }
    const data = event.data;
    switch (data.kind) {
      case "SetAttributes": {
        this.handleSetAttributes(data);
        break;
      }
      case "RegisterMagixEvent": {
        this.handleRegisterMagixEvent(data);
        break;
      }
      case "RemoveMagixEvent": {
        this.handleRemoveMagixEvent(data);
        break;
      }
      case "DispatchMagixEvent": {
        this.handleDispatchMagixEvent(data);
        break;
      }
      case "RemoveAllMagixEvent": {
        this.handleRemoveAllMagixEvent();
        break;
      }
      case "NextPage": {
        this.handleNextPage();
        break;
      }
      case "PrevPage": {
        this.handlePrevPage();
        break;
      }
      case "SDKCreate": {
        this.handleSDKCreate();
        break;
      }
      case "SetPage": {
        this.handleSetPage(data);
        break;
      }
      case "GetAttributes": {
        this.handleGetAttributes();
        break;
      }
      case "PageTo": {
        this.handlePageTo(data);
        break;
      }
      default: {
        log(`${data.kind} not allow event.`);
        break;
      }
    }
  }
  handleSDKCreate() {
    this.postMessage({
      kind: "Init",
      payload: {
        attributes: this.attributes,
        roomState: this.displayer.state,
        currentPage: this.currentPage,
        observerId: this.displayer.observerId
      }
    });
  }
  handleDispatchMagixEvent(data) {
    const eventPayload = data.payload;
    this.appManager.safeDispatchMagixEvent(eventPayload.event, eventPayload.payload);
  }
  handleSetAttributes(data) {
    this.setAttributes(data.payload);
  }
  handleRegisterMagixEvent(data) {
    const eventName = data.payload;
    const listener = (event) => {
      if (event.authorId === this.displayer.observerId) {
        return;
      }
      this.postMessage({ kind: "ReciveMagixEvent", payload: event });
    };
    this.magixEventMap.set(eventName, listener);
    this.displayer.addMagixEventListener(eventName, listener);
  }
  handleRemoveMagixEvent(data) {
    const eventName = data.payload;
    const listener = this.magixEventMap.get(eventName);
    this.displayer.removeMagixEventListener(eventName, listener);
  }
  handleNextPage() {
    if (this.manager.canOperate) {
      this.manager.nextPage();
      this.dispatchMagixEvent("NextPage", {});
    }
  }
  handlePrevPage() {
    if (this.manager.canOperate) {
      this.manager.prevPage();
      this.dispatchMagixEvent("PrevPage", {});
    }
  }
  handlePageTo(data) {
    if (this.manager.canOperate) {
      const page = data.payload;
      if (!Number.isSafeInteger(page) || page <= 0) {
        return;
      }
      this.manager.setMainViewSceneIndex(page - 1);
      this.dispatchMagixEvent("PageTo", page - 1);
    }
  }
  handleRemoveAllMagixEvent() {
    this.magixEventMap.forEach((listener, event) => {
      this.displayer.removeMagixEventListener(event, listener);
    });
    this.magixEventMap.clear();
  }
  handleGetAttributes() {
    this.postMessage({
      kind: "GetAttributes",
      payload: this.attributes
    });
  }
  postMessage(message) {
    var _a;
    if (this.iframe) {
      (_a = this.iframe.contentWindow) == null ? void 0 : _a.postMessage(JSON.parse(JSON.stringify(message)), "*");
    }
  }
  dispatchMagixEvent(event, payload) {
    if (this.manager.canOperate) {
      this.setAttributes({ lastEvent: { name: event, payload } });
      this.displayer.dispatchMagixEvent(event, payload);
    }
  }
  get currentIndex() {
    return this.manager.mainViewSceneIndex;
  }
  get currentPage() {
    return this.currentIndex + 1;
  }
  get totalPage() {
    return this.manager.mainViewScenesLength;
  }
  get readonly() {
    return !this.displayer.isWritable;
  }
  get inDisplaySceneDir() {
    return this.manager.mainViewSceneDir === this.attributes.displaySceneDir;
  }
  isClicker() {
    if (this.readonly) {
      return false;
    }
    const currentApplianceName = this.displayer.state.memberState.currentApplianceName;
    return this.allowAppliances.includes(currentApplianceName);
  }
  get isDisableInput() {
    if ("disableDeviceInputs" in this.displayer) {
      return this.displayer.disableDeviceInputs;
    } else {
      return true;
    }
  }
};
let IframeBridge = _IframeBridge;
IframeBridge.kind = "IframeBridge";
IframeBridge.hiddenClass = "netless-iframe-brdige-hidden";
IframeBridge.emitter = new Emittery();
IframeBridge.displayer = null;
IframeBridge.alreadyCreate = false;
const reconnectRefresher = new ReconnectRefresher({ emitter: internalEmitter });
const _WindowManager = class extends InvisiblePlugin {
  constructor(context) {
    super(context);
    this.version = "1.0.3";
    this.dependencies = { "dependencies": { "@juggle/resize-observer": "^3.3.1", "@netless/telebox-insider": "github:veytu/telebox-insider", "emittery": "^0.9.2", "lodash": "^4.17.21", "p-retry": "^4.6.1", "uuid": "^7.0.3", "video.js": ">=7" }, "peerDependencies": { "jspdf": "2.5.1", "white-web-sdk": "^2.16.52" }, "devDependencies": { "@hyrious/dts": "^0.2.2", "@netless/app-media-player": "0.1.0-beta.9", "@netless/app-docs-viewer": "github:veytu/app-docs-viewer", "@rollup/plugin-commonjs": "^20.0.0", "@rollup/plugin-node-resolve": "^13.0.4", "@rollup/plugin-url": "^6.1.0", "@sveltejs/vite-plugin-svelte": "^1.0.0-next.22", "@tsconfig/svelte": "^2.0.1", "@types/debug": "^4.1.7", "@types/lodash": "^4.14.182", "@types/lodash-es": "^4.17.4", "@types/uuid": "^8.3.1", "@typescript-eslint/eslint-plugin": "^4.30.0", "@typescript-eslint/parser": "^4.30.0", "@vitest/ui": "^0.14.1", "cypress": "^8.7.0", "dotenv": "^10.0.0", "eslint": "^7.32.0", "eslint-config-prettier": "^8.3.0", "eslint-plugin-svelte3": "^3.2.0", "jsdom": "^19.0.0", "jspdf": "^2.5.1", "less": "^4.1.1", "prettier": "^2.3.2", "prettier-plugin-svelte": "^2.4.0", "rollup-plugin-analyzer": "^4.0.0", "rollup-plugin-styles": "^3.14.1", "side-effect-manager": "0.1.5", "svelte": "^3.42.4", "typescript": "^4.5.5", "vite": "^2.9.9", "vitest": "^0.14.1", "white-web-sdk": "2.16.52" } };
    this.emitter = callbacks$1;
    this.viewMode = ViewMode.Broadcaster;
    this.isReplay = isPlayer(this.displayer);
    this._cursorUIDs = [];
    this.containerSizeRatio = _WindowManager.containerSizeRatio;
    _WindowManager.displayer = context.displayer;
    window.NETLESS_DEPS = { "dependencies": { "@juggle/resize-observer": "^3.3.1", "@netless/telebox-insider": "github:veytu/telebox-insider", "emittery": "^0.9.2", "lodash": "^4.17.21", "p-retry": "^4.6.1", "uuid": "^7.0.3", "video.js": ">=7" }, "peerDependencies": { "jspdf": "2.5.1", "white-web-sdk": "^2.16.52" }, "devDependencies": { "@hyrious/dts": "^0.2.2", "@netless/app-media-player": "0.1.0-beta.9", "@netless/app-docs-viewer": "github:veytu/app-docs-viewer", "@rollup/plugin-commonjs": "^20.0.0", "@rollup/plugin-node-resolve": "^13.0.4", "@rollup/plugin-url": "^6.1.0", "@sveltejs/vite-plugin-svelte": "^1.0.0-next.22", "@tsconfig/svelte": "^2.0.1", "@types/debug": "^4.1.7", "@types/lodash": "^4.14.182", "@types/lodash-es": "^4.17.4", "@types/uuid": "^8.3.1", "@typescript-eslint/eslint-plugin": "^4.30.0", "@typescript-eslint/parser": "^4.30.0", "@vitest/ui": "^0.14.1", "cypress": "^8.7.0", "dotenv": "^10.0.0", "eslint": "^7.32.0", "eslint-config-prettier": "^8.3.0", "eslint-plugin-svelte3": "^3.2.0", "jsdom": "^19.0.0", "jspdf": "^2.5.1", "less": "^4.1.1", "prettier": "^2.3.2", "prettier-plugin-svelte": "^2.4.0", "rollup-plugin-analyzer": "^4.0.0", "rollup-plugin-styles": "^3.14.1", "side-effect-manager": "0.1.5", "svelte": "^3.42.4", "typescript": "^4.5.5", "vite": "^2.9.9", "vitest": "^0.14.1", "white-web-sdk": "2.16.52" } };
  }
  static onCreate(manager) {
    _WindowManager._resolve(manager);
  }
  static async mount(params) {
    var _a;
    const room = params.room;
    _WindowManager.container = params.container;
    _WindowManager.supportAppliancePlugin = params.supportAppliancePlugin;
    const containerSizeRatio = params.containerSizeRatio;
    const debug = params.debug;
    const cursor = params.cursor;
    _WindowManager.params = params;
    _WindowManager.displayer = params.room;
    checkVersion();
    let manager = void 0;
    if (isRoom(room)) {
      if (room.phase !== RoomPhase.Connected) {
        throw new Error("[WindowManager]: Room only Connected can be mount");
      }
      if (room.phase === RoomPhase.Connected && room.isWritable) {
        room.disableSerialization = false;
      }
      manager = await this.initManager(room);
    }
    if (_WindowManager.isCreated) {
      throw new Error("[WindowManager]: Already created cannot be created again");
    }
    this.debug = Boolean(debug);
    if (this.debug) {
      v({ verbose: true });
    }
    log("Already insert room", manager);
    if (isRoom(this.displayer)) {
      if (!manager) {
        throw new Error("[WindowManager]: init InvisiblePlugin failed");
      }
    } else {
      await pRetry(
        async (count) => {
          manager = room.getInvisiblePlugin(_WindowManager.kind);
          if (!manager) {
            log(`manager is empty. retrying ${count}`);
            throw new Error();
          }
        },
        { retries: 10, maxTimeout: 5e3 }
      );
    }
    if (!manager) {
      throw new Error("[WindowManager]: create manager failed");
    }
    if (containerSizeRatio) {
      _WindowManager.containerSizeRatio = containerSizeRatio;
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
    if (containerSizeRatio) {
      manager.containerSizeRatio = containerSizeRatio;
    }
    if (params.container) {
      manager.bindContainer(params.container);
    }
    replaceRoomFunction(room, manager);
    internalEmitter.emit("onCreated");
    _WindowManager.isCreated = true;
    try {
      await initDb();
    } catch (error) {
      console.warn("[WindowManager]: indexedDB open failed");
      console.log(error);
    }
    (_a = manager == null ? void 0 : manager.room) == null ? void 0 : _a.addMagixEventListener("onScaleChange", (data) => {
      manager == null ? void 0 : manager.setScale(data.payload);
    });
    return manager;
  }
  static initManager(room) {
    return createInvisiblePlugin(room);
  }
  static initContainer(manager, container, params) {
    const { chessboard, overwriteStyles, fullscreen } = params;
    if (!_WindowManager.container) {
      _WindowManager.container = container;
    }
    const { playground, wrapper, sizer, mainViewElement, mainViewWrapper } = setupWrapper(container);
    _WindowManager.playground = playground;
    if (chessboard) {
      sizer.classList.add("netless-window-manager-chess-sizer");
    }
    if (fullscreen) {
      sizer.classList.add("netless-window-manager-fullscreen");
    }
    if (overwriteStyles) {
      const style2 = document.createElement("style");
      style2.textContent = overwriteStyles;
      playground.appendChild(style2);
    }
    manager.containerResizeObserver = ContainerResizeObserver.create(
      playground,
      sizer,
      wrapper,
      internalEmitter
    );
    _WindowManager.wrapper = wrapper;
    _WindowManager.sizer = sizer;
    _WindowManager.mainViewWrapper = mainViewWrapper;
    return mainViewElement;
  }
  static get registered() {
    return appRegister.registered;
  }
  bindContainer(container) {
    var _a, _b, _c, _d, _e, _f;
    if (isRoom(this.displayer) && this.room.phase !== RoomPhase.Connected) {
      throw new BindContainerRoomPhaseInvalidError();
    }
    if (_WindowManager.isCreated && _WindowManager.container) {
      if (_WindowManager.container.firstChild) {
        container.appendChild(_WindowManager.container.firstChild);
      }
    } else {
      if (_WindowManager.params) {
        const params = _WindowManager.params;
        const mainViewElement = _WindowManager.initContainer(this, container, params);
        if (this.boxManager) {
          this.boxManager.destroy();
        }
        const boxManager = createBoxManager(this, callbacks$1, internalEmitter, boxEmitter, {
          collectorContainer: params.collectorContainer,
          collectorStyles: params.collectorStyles,
          prefersColorScheme: params.prefersColorScheme
        });
        this.boxManager = boxManager;
        (_a = this.appManager) == null ? void 0 : _a.setBoxManager(boxManager);
        this.bindMainView(mainViewElement, params.disableCameraTransform);
        if (_WindowManager.wrapper) {
          (_b = this.cursorManager) == null ? void 0 : _b.setupWrapper(_WindowManager.wrapper);
        }
      }
    }
    internalEmitter.emit("updateManagerRect");
    (_c = this.appManager) == null ? void 0 : _c.refresh();
    (_d = this.appManager) == null ? void 0 : _d.resetMaximized();
    (_e = this.appManager) == null ? void 0 : _e.resetMinimized();
    (_f = this.appManager) == null ? void 0 : _f.displayerWritableListener(!this.room.isWritable);
    _WindowManager.container = container;
  }
  bindCollectorContainer(container) {
    if (_WindowManager.isCreated && this.boxManager) {
      this.boxManager.setCollectorContainer(container);
    } else {
      if (_WindowManager.params) {
        _WindowManager.params.collectorContainer = container;
      }
    }
  }
  static register(params) {
    return appRegister.register(params);
  }
  static unregister(kind2) {
    return appRegister.unregister(kind2);
  }
  async addApp(params) {
    if (this.appManager) {
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
      throw new AppManagerNotInitError();
    }
  }
  async _addApp(params) {
    var _a, _b, _c;
    if (this.appManager) {
      if (!params.kind || typeof params.kind !== "string") {
        throw new ParamsInvalidError();
      }
      if (params.src && typeof params.src === "string") {
        appRegister.register({ kind: params.kind, src: params.src });
      }
      const appImpl = await ((_a = appRegister.appClasses.get(params.kind)) == null ? void 0 : _a());
      if (appImpl && ((_b = appImpl.config) == null ? void 0 : _b.singleton)) {
        if (this.appManager.appProxies.has(params.kind)) {
          throw new AppCreateError();
        }
      }
      const isDynamicPPT = this.setupScenePath(params, this.appManager);
      if (isDynamicPPT === void 0) {
        return;
      }
      if ((_c = params == null ? void 0 : params.options) == null ? void 0 : _c.scenePath) {
        params.options.scenePath = ensureValidScenePath(params.options.scenePath);
      }
      const appId = await this.appManager.addApp(params, Boolean(isDynamicPPT));
      return appId;
    } else {
      throw new AppManagerNotInitError();
    }
  }
  setupScenePath(params, appManager) {
    let isDynamicPPT = false;
    if (params.options) {
      const { scenePath, scenes } = params.options;
      if (scenePath) {
        if (!isValidScenePath(scenePath)) {
          throw new InvalidScenePath();
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
      if (scenePath && scenes === void 0) {
        putScenes(this.room, scenePath, [{}]);
      }
    }
    return isDynamicPPT;
  }
  async setMainViewScenePath(scenePath) {
    if (this.appManager) {
      await this.appManager.setMainViewScenePath(scenePath);
    }
  }
  async setMainViewSceneIndex(index2) {
    if (this.appManager) {
      await this.appManager.setMainViewSceneIndex(index2);
    }
  }
  async nextPage() {
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
  async prevPage() {
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
  async jumpPage(index2) {
    if (this.appManager) {
      if (index2 < 0 || index2 >= this.pageState.length) {
        console.warn(`[WindowManager]: index ${index2} out of range`);
        return false;
      }
      await this.appManager.setMainViewSceneIndex(index2);
      return true;
    } else {
      return false;
    }
  }
  async addPage(params) {
    if (this.appManager) {
      const after = params == null ? void 0 : params.after;
      const scene = params == null ? void 0 : params.scene;
      if (after) {
        const nextIndex = this.mainViewSceneIndex + 1;
        this.room.putScenes(ROOT_DIR, [scene || {}], nextIndex);
      } else {
        this.room.putScenes(ROOT_DIR, [scene || {}]);
      }
    }
  }
  async removePage(index2) {
    if (this.appManager) {
      const needRemoveIndex = index2 === void 0 ? this.pageState.index : index2;
      if (this.pageState.length === 1) {
        console.warn(`[WindowManager]: can not remove the last page`);
        return false;
      }
      if (needRemoveIndex < 0 || needRemoveIndex >= this.pageState.length) {
        console.warn(`[WindowManager]: index ${index2} out of range`);
        return false;
      }
      return this.appManager.removeSceneByIndex(needRemoveIndex);
    } else {
      return false;
    }
  }
  getMainViewScenePath() {
    var _a;
    return (_a = this.appManager) == null ? void 0 : _a.store.getMainViewScenePath();
  }
  getMainViewSceneIndex() {
    var _a;
    return (_a = this.appManager) == null ? void 0 : _a.store.getMainViewSceneIndex();
  }
  setReadonly(readonly) {
    var _a;
    this.readonly = readonly;
    (_a = this.boxManager) == null ? void 0 : _a.setReadonly(readonly);
    internalEmitter.emit("setReadonly", readonly);
  }
  switchMainViewToWriter() {
    var _a;
    return (_a = this.appManager) == null ? void 0 : _a.mainViewProxy.mainViewClickHandler();
  }
  onAppDestroy(kind2, listener) {
    addEmitterOnceListener(`destroy-${kind2}`, listener);
  }
  onAppEvent(kind2, listener) {
    return internalEmitter.on(`custom-${kind2}`, listener);
  }
  setViewMode(mode) {
    var _a, _b, _c, _d;
    if (mode === ViewMode.Broadcaster || mode === ViewMode.Follower) {
      if (this.canOperate && mode === ViewMode.Broadcaster) {
        (_a = this.appManager) == null ? void 0 : _a.mainViewProxy.setCameraAndSize();
      }
      (_b = this.appManager) == null ? void 0 : _b.mainViewProxy.start();
    }
    if (mode === ViewMode.Freedom) {
      (_c = this.appManager) == null ? void 0 : _c.mainViewProxy.stop();
    }
    this.viewMode = mode;
    (_d = this.appManager) == null ? void 0 : _d.mainViewProxy.setViewMode(mode);
  }
  setBoxState(boxState) {
    if (!this.canOperate)
      return;
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
    }
  }
  setMaximized(maximized) {
    var _a;
    if (!this.canOperate)
      return;
    (_a = this.boxManager) == null ? void 0 : _a.setMaximized(maximized, false);
  }
  setMinimized(minimized) {
    var _a;
    if (!this.canOperate)
      return;
    (_a = this.boxManager) == null ? void 0 : _a.setMinimized(minimized, false);
  }
  setFullscreen(fullscreen) {
    var _a;
    if (this._fullscreen !== fullscreen) {
      this._fullscreen = fullscreen;
      (_a = _WindowManager.sizer) == null ? void 0 : _a.classList.toggle("netless-window-manager-fullscreen", fullscreen);
      callbacks$1.emit("fullscreenChange", fullscreen);
    }
  }
  get cursorUIDs() {
    return this._cursorUIDs;
  }
  setCursorUIDs(cursorUIDs) {
    var _a, _b;
    this._cursorUIDs = cursorUIDs || [];
    if (this._cursorUIDs.length === 0) {
      (_a = this._cursorUIDsStyleDOM) == null ? void 0 : _a.remove();
    } else {
      if (!this._cursorUIDsStyleDOM) {
        this._cursorUIDsStyleDOM = document.createElement("style");
      }
      (_b = _WindowManager.playground) == null ? void 0 : _b.appendChild(this._cursorUIDsStyleDOM);
      let style2 = "[data-cursor-uid] { display: none }";
      for (const uid of this._cursorUIDs) {
        style2 += `
[data-cursor-uid="${uid}"] { display: flex }`;
      }
      this._cursorUIDsStyleDOM.textContent = style2;
    }
  }
  maximizedBoxNextPage() {
    var _a, _b;
    const boxId = this.getTopMaxBoxId();
    if (!boxId)
      return false;
    const box = (_a = this.appManager) == null ? void 0 : _a.appProxies.get(boxId);
    if (!box)
      return false;
    return (_b = box == null ? void 0 : box.appContext) == null ? void 0 : _b.nextPage();
  }
  maximizedBoxPrevPage() {
    var _a, _b;
    const boxId = this.getTopMaxBoxId();
    if (!boxId)
      return false;
    const box = (_a = this.appManager) == null ? void 0 : _a.appProxies.get(boxId);
    if (!box)
      return false;
    return (_b = box == null ? void 0 : box.appContext) == null ? void 0 : _b.prevPage();
  }
  getMaximizedBoxPageState() {
    var _a, _b;
    const boxId = this.getTopMaxBoxId();
    if (!boxId)
      return void 0;
    const box = (_a = this.appManager) == null ? void 0 : _a.appProxies.get(boxId);
    if (!box)
      return void 0;
    return (_b = box == null ? void 0 : box.appContext) == null ? void 0 : _b.pageState;
  }
  getTopMaxBoxId() {
    var _a, _b;
    const boxes = (_b = (_a = this.appManager) == null ? void 0 : _a.boxManager) == null ? void 0 : _b.teleBoxManager.maximizedBoxes.filter((box) => {
      var _a2, _b2;
      return !((_b2 = (_a2 = this.appManager) == null ? void 0 : _a2.boxManager) == null ? void 0 : _b2.teleBoxManager.minimizedBoxes.includes(box));
    });
    if (!(boxes == null ? void 0 : boxes.length))
      return void 0;
    return boxes.reduce(
      (a2, b2) => {
        var _a2, _b2, _c, _d, _e, _f, _g, _h;
        return Number((_d = (_c = (_b2 = (_a2 = this.appManager) == null ? void 0 : _a2.boxManager) == null ? void 0 : _b2.getBox(a2)) == null ? void 0 : _c._zIndex$) == null ? void 0 : _d.value) > Number((_h = (_g = (_f = (_e = this.appManager) == null ? void 0 : _e.boxManager) == null ? void 0 : _f.getBox(b2)) == null ? void 0 : _g._zIndex$) == null ? void 0 : _h.value) ? a2 : b2;
      }
    );
  }
  get mainView() {
    if (this.appManager) {
      return this.appManager.mainViewProxy.view;
    } else {
      throw new AppManagerNotInitError();
    }
  }
  get camera() {
    if (this.appManager) {
      return this.appManager.mainViewProxy.view.camera;
    } else {
      throw new AppManagerNotInitError();
    }
  }
  get cameraState() {
    if (this.appManager) {
      return this.appManager.mainViewProxy.cameraState;
    } else {
      throw new AppManagerNotInitError();
    }
  }
  get apps() {
    var _a;
    return (_a = this.appManager) == null ? void 0 : _a.store.apps();
  }
  get boxState() {
    var _a;
    if (this.appManager) {
      return (_a = this.appManager.boxManager) == null ? void 0 : _a.boxState;
    } else {
      throw new AppManagerNotInitError();
    }
  }
  get darkMode() {
    var _a, _b;
    return Boolean((_b = (_a = this.appManager) == null ? void 0 : _a.boxManager) == null ? void 0 : _b.darkMode);
  }
  get prefersColorScheme() {
    var _a;
    if (this.appManager) {
      return (_a = this.appManager.boxManager) == null ? void 0 : _a.prefersColorScheme;
    } else {
      throw new AppManagerNotInitError();
    }
  }
  get focused() {
    return this.attributes.focus;
  }
  get focusedView() {
    var _a, _b;
    return ((_b = (_a = this.appManager) == null ? void 0 : _a.focusApp) == null ? void 0 : _b.view) || this.mainView;
  }
  get polling() {
    var _a;
    return ((_a = this.appManager) == null ? void 0 : _a.polling) || false;
  }
  set polling(b2) {
    if (this.appManager) {
      this.appManager.polling = b2;
    }
  }
  get cursorStyle() {
    var _a;
    return ((_a = this.cursorManager) == null ? void 0 : _a.style) || "default";
  }
  set cursorStyle(value) {
    if (!this.cursorManager) {
      throw new Error("[WindowManager]: cursor is not enabled, please set { cursor: true }.");
    }
    this.cursorManager.style = value;
  }
  get mainViewSceneIndex() {
    var _a;
    return ((_a = this._pageState) == null ? void 0 : _a.index) || 0;
  }
  get mainViewSceneDir() {
    var _a;
    if (this.appManager) {
      return (_a = this.appManager) == null ? void 0 : _a.getMainViewSceneDir();
    } else {
      throw new AppManagerNotInitError();
    }
  }
  get topApp() {
    var _a, _b;
    return (_b = (_a = this.boxManager) == null ? void 0 : _a.getTopBox()) == null ? void 0 : _b.id;
  }
  get mainViewScenesLength() {
    var _a;
    return ((_a = this._pageState) == null ? void 0 : _a.length) || 0;
  }
  get canRedoSteps() {
    var _a;
    return ((_a = this.focusedView) == null ? void 0 : _a.canRedoSteps) || 0;
  }
  get canUndoSteps() {
    var _a;
    return ((_a = this.focusedView) == null ? void 0 : _a.canUndoSteps) || 0;
  }
  get sceneState() {
    if (this.appManager) {
      return this.appManager.sceneState;
    } else {
      throw new AppManagerNotInitError();
    }
  }
  get pageState() {
    if (this._pageState) {
      return this._pageState.toObject();
    } else {
      throw new AppManagerNotInitError();
    }
  }
  get fullscreen() {
    return Boolean(this._fullscreen);
  }
  queryAll() {
    var _a;
    return Array.from(((_a = this.appManager) == null ? void 0 : _a.appProxies.values()) || []);
  }
  queryOne(appId) {
    var _a;
    return (_a = this.appManager) == null ? void 0 : _a.appProxies.get(appId);
  }
  async closeApp(appId) {
    var _a;
    return (_a = this.appManager) == null ? void 0 : _a.closeApp(appId);
  }
  focusApp(appId) {
    var _a, _b, _c;
    const box = (_a = this.boxManager) == null ? void 0 : _a.getBox(appId);
    if (box) {
      (_b = this.boxManager) == null ? void 0 : _b.focusBox({ appId }, false);
      ((_c = this.boxManager) == null ? void 0 : _c.teleBoxManager).makeBoxTop(box, false);
    }
  }
  moveCamera(camera) {
    var _a;
    const pureCamera = omit(camera, ["animationMode"]);
    const mainViewCamera = { ...this.mainView.camera };
    if (isEqual({ ...mainViewCamera, ...pureCamera }, mainViewCamera))
      return;
    this.mainView.moveCamera(camera);
    (_a = this.appManager) == null ? void 0 : _a.dispatchInternalEvent(Events.MoveCamera, camera);
    setTimeout(() => {
      var _a2;
      (_a2 = this.appManager) == null ? void 0 : _a2.mainViewProxy.setCameraAndSize();
    }, 500);
  }
  moveCameraToContain(rectangle) {
    var _a;
    this.mainView.moveCameraToContain(rectangle);
    (_a = this.appManager) == null ? void 0 : _a.dispatchInternalEvent(Events.MoveCameraToContain, rectangle);
    setTimeout(() => {
      var _a2;
      (_a2 = this.appManager) == null ? void 0 : _a2.mainViewProxy.setCameraAndSize();
    }, 500);
  }
  convertToPointInWorld(point) {
    return this.mainView.convertToPointInWorld(point);
  }
  setCameraBound(cameraBound) {
    this.mainView.setCameraBound(cameraBound);
  }
  onDestroy() {
    this._destroy();
  }
  destroy() {
    this._destroy();
  }
  _destroy() {
    var _a, _b, _c, _d, _e;
    (_a = this.containerResizeObserver) == null ? void 0 : _a.disconnect();
    (_b = this.appManager) == null ? void 0 : _b.destroy();
    (_c = this.cursorManager) == null ? void 0 : _c.destroy();
    _WindowManager.container = void 0;
    _WindowManager.wrapper = void 0;
    _WindowManager.sizer = void 0;
    _WindowManager.isCreated = false;
    if (_WindowManager.playground) {
      (_d = _WindowManager.playground.parentNode) == null ? void 0 : _d.removeChild(_WindowManager.playground);
    }
    _WindowManager.params = void 0;
    (_e = this._iframeBridge) == null ? void 0 : _e.destroy();
    this._iframeBridge = void 0;
    log("Destroyed");
  }
  bindMainView(divElement, disableCameraTransform) {
    var _a;
    if (this.appManager) {
      this.appManager.bindMainView(divElement, Boolean(disableCameraTransform));
      (_a = this.cursorManager) == null ? void 0 : _a.setMainViewDivElement(divElement);
    }
  }
  get canOperate() {
    if (isRoom(this.displayer)) {
      return this.displayer.isWritable && this.displayer.phase === RoomPhase.Connected;
    } else {
      return false;
    }
  }
  get room() {
    return this.displayer;
  }
  safeSetAttributes(attributes) {
    if (this.canOperate) {
      this.setAttributes(attributes);
    }
  }
  safeUpdateAttributes(keys, value) {
    if (this.canOperate) {
      this.updateAttributes(keys, value);
    }
  }
  setPrefersColorScheme(scheme) {
    var _a, _b;
    (_b = (_a = this.appManager) == null ? void 0 : _a.boxManager) == null ? void 0 : _b.setPrefersColorScheme(scheme);
  }
  cleanCurrentScene() {
    var _a;
    log("clean current scene");
    (_a = this.focusedView) == null ? void 0 : _a.cleanCurrentScene();
  }
  redo() {
    var _a;
    return ((_a = this.focusedView) == null ? void 0 : _a.redo()) || 0;
  }
  undo() {
    var _a;
    return ((_a = this.focusedView) == null ? void 0 : _a.undo()) || 0;
  }
  delete() {
    var _a;
    (_a = this.focusedView) == null ? void 0 : _a.delete();
  }
  copy() {
    var _a;
    (_a = this.focusedView) == null ? void 0 : _a.copy();
  }
  paste() {
    var _a;
    (_a = this.focusedView) == null ? void 0 : _a.paste();
  }
  duplicate() {
    var _a;
    (_a = this.focusedView) == null ? void 0 : _a.duplicate();
  }
  insertText(x2, y2, text2) {
    var _a;
    return ((_a = this.focusedView) == null ? void 0 : _a.insertText(x2, y2, text2)) || "";
  }
  insertImage(info) {
    var _a;
    return (_a = this.focusedView) == null ? void 0 : _a.insertImage(info);
  }
  completeImageUpload(uuid, url) {
    var _a;
    return (_a = this.focusedView) == null ? void 0 : _a.completeImageUpload(uuid, url);
  }
  lockImage(uuid, locked) {
    var _a;
    return (_a = this.focusedView) == null ? void 0 : _a.lockImage(uuid, locked);
  }
  lockImages(locked) {
    var _a;
    return (_a = this.focusedView) == null ? void 0 : _a.lockImages(locked);
  }
  refresh() {
    var _a;
    this._refresh();
    (_a = this.appManager) == null ? void 0 : _a.dispatchInternalEvent(Events.Refresh);
  }
  _refresh() {
    var _a, _b;
    (_a = this.appManager) == null ? void 0 : _a.mainViewProxy.rebind();
    if (_WindowManager.container) {
      this.bindContainer(_WindowManager.container);
    }
    (_b = this.appManager) == null ? void 0 : _b.refresher.refresh();
  }
  setContainerSizeRatio(ratio) {
    if (!isNumber(ratio) || !(ratio > 0)) {
      throw new Error(
        `[WindowManager]: updateContainerSizeRatio error, ratio must be a positive number. but got ${ratio}`
      );
    }
    _WindowManager.containerSizeRatio = ratio;
    this.containerSizeRatio = ratio;
    internalEmitter.emit("containerSizeRatioUpdate", ratio);
  }
  setScale(scale2) {
    var _a;
    if (!isNumber(scale2))
      return false;
    const setStyles = (styles2) => {
      if (!_WindowManager.mainViewWrapper)
        return;
      _WindowManager.mainViewWrapper.style.width = `${styles2.width}px`;
      _WindowManager.mainViewWrapper.style.height = `${styles2.height}px`;
    };
    const size2 = (_a = _WindowManager.wrapper) == null ? void 0 : _a.getBoundingClientRect();
    if (!size2)
      return false;
    if (scale2 < 1) {
      setStyles({ width: size2 == null ? void 0 : size2.width, height: size2 == null ? void 0 : size2.height });
      internalEmitter.emit("onScaleChange", scale2);
      return true;
    }
    setStyles({ width: (size2 == null ? void 0 : size2.width) * scale2, height: (size2 == null ? void 0 : size2.height) * scale2 });
    internalEmitter.emit("onScaleChange", scale2);
    return true;
  }
  isDynamicPPT(scenes) {
    var _a, _b;
    const sceneSrc = (_b = (_a = scenes[0]) == null ? void 0 : _a.ppt) == null ? void 0 : _b.src;
    return sceneSrc == null ? void 0 : sceneSrc.startsWith("pptx://");
  }
  async ensureAttributes() {
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
    }
  }
  getIframeBridge() {
    if (!this.appManager) {
      throw new Error("[WindowManager]: should call getIframeBridge() after await mount()");
    }
    this._iframeBridge || (this._iframeBridge = new IframeBridge(this, this.appManager));
    return this._iframeBridge;
  }
};
let WindowManager = _WindowManager;
WindowManager.kind = "WindowManager";
WindowManager.debug = false;
WindowManager.containerSizeRatio = DEFAULT_CONTAINER_RATIO;
WindowManager.isCreated = false;
WindowManager._resolve = (_manager) => void 0;
setupBuiltin();
export { AppCreateError, AppManagerNotInitError, AppNotRegisterError, BindContainerRoomPhaseInvalidError, BoxManagerNotFoundError, BoxNotCreatedError, BuiltinApps, DomEvents, IframeBridge, IframeEvents, InvalidScenePath, ParamsInvalidError, WhiteWebSDKInvalidError, WindowManager, calculateNextIndex, reconnectRefresher };
//# sourceMappingURL=index.mjs.map
