import pM from "p-retry";
import Nd from "emittery";
import { debounce as xs, isEqual as tg, omit as nS, isObject as xa, has as _b, get as wn, size as FD, mapValues as $D, noop as mM, pick as QD, isNumber as Pb, isEmpty as Gh, isInteger as ZD, orderBy as YD, isFunction as xd, isString as KC, isNull as GD } from "lodash";
import { ScenePathType as Gv, UpdateEventKind as vM, listenUpdated as ng, unlistenUpdated as iS, reaction as ug, autorun as Ss, toJS as XD, listenDisposed as JD, unlistenDisposed as qD, ViewMode as sl, AnimationMode as zb, isPlayer as rS, isRoom as ol, WhiteVersion as KD, ApplianceNames as Nn, RoomPhase as ll, PlayerPhase as eT, InvisiblePlugin as eN } from "white-web-sdk";
import { v4 as tN } from "uuid";
import { ResizeObserver as nN } from "@juggle/resize-observer";
import tT from "video.js";
var Xt = /* @__PURE__ */ ((r) => (r.AppMove = "AppMove", r.AppFocus = "AppFocus", r.AppResize = "AppResize", r.AppBoxStateChange = "AppBoxStateChange", r.GetAttributes = "GetAttributes", r.UpdateWindowManagerWrapper = "UpdateWindowManagerWrapper", r.InitReplay = "InitReplay", r.WindowCreated = "WindowCreated", r.SetMainViewScenePath = "SetMainViewScenePath", r.SetMainViewSceneIndex = "SetMainViewSceneIndex", r.SetAppFocusIndex = "SetAppFocusIndex", r.SwitchViewsToFreedom = "SwitchViewsToFreedom", r.MoveCamera = "MoveCamera", r.MoveCameraToContain = "MoveCameraToContain", r.CursorMove = "CursorMove", r.RootDirRemoved = "RootDirRemoved", r.Refresh = "Refresh", r.InitMainViewCamera = "InitMainViewCamera", r))(Xt || {});
const Ob = "__WindowManger", lb = "__WindowMangerEnsureReconnected__";
var Ji = /* @__PURE__ */ ((r) => (r.Size = "size", r.Position = "position", r.SceneIndex = "SceneIndex", r.ZIndex = "zIndex", r))(Ji || {}), gM = /* @__PURE__ */ ((r) => (r.setBoxSize = "setBoxSize", r.setBoxMinSize = "setBoxMinSize", r.destroy = "destroy", r))(gM || {}), Lb = /* @__PURE__ */ ((r) => (r.StartCreate = "StartCreate", r))(Lb || {}), Bb = /* @__PURE__ */ ((r) => (r.Leave = "leave", r.Normal = "normal", r))(Bb || {});
const nT = "2.16.1", iN = 340 / 720, rN = 340 / 720, aN = 9 / 16, Cr = "/", yM = "/init", wM = 50, Dt = new Nd();
class sN {
  constructor() {
    this.list = [], this.isEmit = !1, this.invoked = () => {
      this.currentInvoker = void 0, this.list.length === 0 && (this.clear(), this.emitReady());
    }, this.clear = () => {
      clearInterval(this.timer), this.timer = void 0;
    };
  }
  initInterval() {
    return setInterval(() => {
      this.invoke();
    }, 50);
  }
  push(i) {
    this.list.push(i), this.invoke(), this.timer === void 0 && this.list.length > 0 && (this.timer = this.initInterval());
  }
  invoke() {
    if (this.list.length === 0 || this.currentInvoker !== void 0)
      return;
    const i = this.list.shift();
    i && (this.currentInvoker = i, i().then(() => {
      this.invoked();
    }).catch((o) => {
      console.error(`[WindowManager]: create app error: ${o.message}`), this.invoked();
    }));
  }
  emitReady() {
    this.isEmit || setTimeout(() => {
      Dt.emit("ready");
    }, wM), this.isEmit = !0;
  }
  empty() {
    this.list = [], this.clear();
  }
  destroy() {
    this.timer && this.clear();
  }
}
const tt = new Nd(), oN = "__WindowManagerAppCache";
let ip, iT;
const lN = async () => {
  ip = await dN();
}, uN = (r, i) => {
  if (!!ip)
    return hN(ip, { kind: r, sourceCode: i });
}, cN = async (r) => ip ? await fN(ip, r) : null;
function dN() {
  return new Promise((r, i) => {
    const o = indexedDB.open(oN, 2);
    o.onerror = (c) => {
      i(c);
    }, o.onupgradeneeded = (c) => {
      const h = c.target.result;
      h.objectStoreNames.contains("apps") || (iT = h.createObjectStore("apps", { keyPath: "kind" }), iT.createIndex("kind", "kind", { unique: !0 }));
    }, o.onsuccess = () => {
      const c = o.result;
      r(c);
    };
  });
}
function fN(r, i) {
  return new Promise((o, c) => {
    const m = r.transaction(["apps"]).objectStore("apps").index("kind").get(i);
    m.onerror = (y) => c(y), m.onsuccess = () => {
      m.result ? o(m.result) : o(null);
    };
  });
}
function hN(r, i) {
  return new Promise((o, c) => {
    const h = r.transaction(["apps"], "readwrite").objectStore("apps").add(i);
    h.onsuccess = () => o(), h.onerror = () => c();
  });
}
const pN = "NetlessApp", mN = 1e4, vN = async (r) => {
  const i = await cN(r);
  if (i)
    return i.sourceCode;
  {
    const c = await (await wN(r, { timeout: mN })).text();
    return await uN(r, c), c;
  }
}, rT = (r, i) => {
  let o = Function(r + `
;return ${i}`)();
  return typeof o > "u" && (o = window[i]), o;
}, gN = async (r, i, o) => {
  const c = o || pN + i;
  Dt.emit("loadApp", { kind: i, status: "start" });
  let h;
  try {
    if (h = await vN(r), !h || h.length === 0)
      throw Dt.emit("loadApp", { kind: i, status: "failed", reason: "script is empty." }), new Error("[WindowManager]: script is empty.");
  } catch (m) {
    throw Dt.emit("loadApp", { kind: i, status: "failed", reason: m.message }), m;
  }
  return yN(h, c, i);
}, yN = (r, i, o) => {
  try {
    const c = rT(r, i);
    return Dt.emit("loadApp", { kind: o, status: "success" }), c;
  } catch (c) {
    if (c.message.includes("Can only have one anonymous define call per script file")) {
      const h = window.define;
      typeof h == "function" && h.amd && delete h.amd;
      const m = rT(r, i);
      return Dt.emit("loadApp", { kind: o, status: "success" }), m;
    }
    throw Dt.emit("loadApp", { kind: o, status: "failed", reason: c.message }), c;
  }
};
async function wN(r, i) {
  const { timeout: o = 1e4 } = i, c = new AbortController(), h = setTimeout(() => c.abort(), o), m = await fetch(r, {
    ...i,
    signal: c.signal,
    headers: {
      "content-type": "text/plain"
    }
  });
  return clearTimeout(h), m;
}
class bN {
  constructor() {
    this.kindEmitters = /* @__PURE__ */ new Map(), this.registered = /* @__PURE__ */ new Map(), this.appClassesCache = /* @__PURE__ */ new Map(), this.appClasses = /* @__PURE__ */ new Map(), this.syncRegisterApp = null, this.onSyncRegisterAppChange = (i) => {
      this.register({ kind: i.kind, src: i.src });
    };
  }
  setSyncRegisterApp(i) {
    this.syncRegisterApp = i;
  }
  async register(i) {
    this.appClassesCache.delete(i.kind), this.registered.set(i.kind, i);
    const o = i.src;
    let c;
    if (typeof o == "string" && (c = async () => {
      const h = await gN(o, i.kind, i.name);
      return h.__esModule ? h.default : h;
    }, this.syncRegisterApp && this.syncRegisterApp({ kind: i.kind, src: o, name: i.name })), typeof o == "function" && (c = async () => {
      let h = await o();
      if (h)
        return (h.__esModule || h.default) && (h = h.default), h;
      throw new Error(`[WindowManager]: load remote script failed, ${o}`);
    }), typeof o == "object" && (c = async () => o), this.appClasses.set(i.kind, async () => {
      let h = this.appClassesCache.get(i.kind);
      return h || (h = c(), this.appClassesCache.set(i.kind, h)), h;
    }), i.addHooks) {
      const h = this.createKindEmitter(i.kind);
      h && i.addHooks(h);
    }
  }
  unregister(i) {
    this.appClasses.delete(i), this.appClassesCache.delete(i), this.registered.delete(i);
    const o = this.kindEmitters.get(i);
    o && (o.clearListeners(), this.kindEmitters.delete(i));
  }
  async notifyApp(i, o, c) {
    const h = this.kindEmitters.get(i);
    await (h == null ? void 0 : h.emit(o, c));
  }
  createKindEmitter(i) {
    if (!this.kindEmitters.has(i)) {
      const o = new Nd();
      this.kindEmitters.set(i, o);
    }
    return this.kindEmitters.get(i);
  }
}
const qi = new bN(), SN = async (r) => {
  var o, c;
  const i = await ((o = qi.appClasses.get(r)) == null ? void 0 : o());
  return i && ((c = i.config) == null ? void 0 : c.singleton) ? r : `${r}-${tN().replace("-", "").slice(0, 8)}`;
}, Pu = (r, i) => {
  if (r.focusScenePath !== i)
    return r.focusScenePath = i, r;
}, jb = (r, i) => {
  if (r && r.isWritable && r.state.sceneState.scenePath !== i) {
    const o = i === "/" ? "" : i;
    r.setScenePath(o);
  }
}, xN = (r, i, o) => {
  var c;
  if (r && i) {
    const m = (c = Ad(r)[i]) == null ? void 0 : c[o];
    if (m)
      return `${i}/${m.name}`;
  }
}, Ub = (r, i, o) => {
  r && r.scenePathType(i) !== Gv.None && r.removeScenes(i, o);
}, CN = (r, i) => {
  tt.once(r).then(i);
};
xs(
  (r, i) => {
    r.emit("mainViewModeChange", i);
  },
  200
);
const TN = (r, i, o = 0) => {
  const c = Ad(r)[i];
  if (!c)
    return;
  const h = c[o];
  if (!h)
    return;
  const m = h.name;
  return i === Cr ? `/${m}` : `${i}/${m}`;
}, Ad = (r) => r.entireScenes(), Xh = (r, i, o, c) => {
  var h;
  for (let m = 0; m < o.length; ++m)
    if ((h = o[m].name) != null && h.includes("/"))
      throw new Error("scenes name can not have '/'");
  return r == null ? void 0 : r.putScenes(i, o, c);
}, MN = (r) => r.startsWith("/"), ub = (r) => {
  const i = r.split("/");
  i.pop();
  let o = i.join("/");
  return o === "" && (o = "/"), o;
}, EN = (r) => r.endsWith("/") ? r.slice(0, -1) : r, aT = (r) => {
  const i = r.split(".").map((o) => o.padStart(2, "0")).join("");
  return parseInt(i);
}, bM = (r) => new Promise((i) => setTimeout(i, r)), IN = (r) => r.split("").reduce((o, c) => (c === Cr && (o += 1), o), 0) === 1;
class AN {
  constructor(i) {
    this.manager = i, this.displayer = this.manager.displayer, this.mainMagixEventListener = (o) => {
      if (o.authorId !== this.displayer.observerId) {
        const c = o.payload;
        switch (c.eventName) {
          case Xt.AppMove: {
            this.appMoveHandler(c.payload);
            break;
          }
          case Xt.AppResize: {
            this.appResizeHandler(c.payload);
            break;
          }
          case Xt.AppBoxStateChange: {
            this.boxStateChangeHandler(c.payload);
            break;
          }
          case Xt.SetMainViewScenePath: {
            this.setMainViewScenePathHandler(c.payload);
            break;
          }
          case Xt.MoveCamera: {
            this.moveCameraHandler(c.payload);
            break;
          }
          case Xt.MoveCameraToContain: {
            this.moveCameraToContainHandler(c.payload);
            break;
          }
          case Xt.CursorMove: {
            this.cursorMoveHandler(c.payload);
            break;
          }
          case Xt.RootDirRemoved: {
            this.rootDirRemovedHandler();
            break;
          }
          case Xt.Refresh: {
            this.refreshHandler();
            break;
          }
          case Xt.InitMainViewCamera: {
            this.initMainViewCameraHandler();
            break;
          }
          case Xt.SetAppFocusIndex: {
            this.setAppFocusViewIndexHandler(c.payload);
            break;
          }
        }
      }
    }, this.appMoveHandler = (o) => {
      var c;
      (c = this.boxManager) == null || c.moveBox(o);
    }, this.appResizeHandler = (o) => {
      var c, h;
      (c = this.boxManager) == null || c.resizeBox(Object.assign(o, { skipUpdate: !0 })), (h = this.manager.room) == null || h.refreshViewSize();
    }, this.boxStateChangeHandler = (o) => {
      Dt.emit("boxStateChange", o);
    }, this.setMainViewScenePathHandler = ({ nextScenePath: o }) => {
      Pu(this.manager.mainView, o), Dt.emit("mainViewScenePathChange", o);
    }, this.moveCameraHandler = (o) => {
      tg(nS(o, ["animationMode"]), { ...this.manager.mainView.camera }) || this.manager.mainView.moveCamera(o);
    }, this.moveCameraToContainHandler = (o) => {
      this.manager.mainView.moveCameraToContain(o);
    }, this.cursorMoveHandler = (o) => {
      tt.emit("cursorMove", o);
    }, this.rootDirRemovedHandler = () => {
      this.manager.createRootDirScenesCallback(), this.manager.mainViewProxy.rebind(), tt.emit("rootDirRemoved");
    }, this.refreshHandler = () => {
      this.manager.windowManger._refresh();
    }, this.initMainViewCameraHandler = () => {
      this.manager.mainViewProxy.addCameraReaction();
    }, this.setAppFocusViewIndexHandler = (o) => {
      if (o.type === "main")
        this.manager.setSceneIndexWithoutSync(o.index);
      else if (o.type === "app" && o.appID) {
        const c = this.manager.appProxies.get(o.appID);
        c && c.setSceneIndexWithoutSync(o.index);
      }
    };
  }
  get boxManager() {
    return this.manager.boxManager;
  }
  addListeners() {
    this.displayer.addMagixEventListener(Ob, this.mainMagixEventListener);
  }
  removeListeners() {
    this.displayer.removeMagixEventListener(Ob, this.mainMagixEventListener);
  }
}
class RN extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: app duplicate exists and cannot be created again";
  }
}
class iL extends Error {
  constructor(i) {
    super(`[WindowManager]: app ${i} need register or provide src`);
  }
}
class ms extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: AppManager must be initialized";
  }
}
class DN extends Error {
  constructor(i) {
    super(`[WindowManager]: white-web-sdk version must large than ${i}`);
  }
}
class NN extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: kind must be a valid string";
  }
}
class kN extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: box need created";
  }
}
class _N extends Error {
  constructor() {
    super(...arguments), this.message = '[WindowManager]: ScenePath should start with "/"';
  }
}
class PN extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: boxManager not found";
  }
}
class zN extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: room phase only Connected can be bindContainer";
  }
}
const SM = "!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", ON = SM.length, sT = Array(20), Cd = () => {
  for (let r = 0; r < 20; r++)
    sT[r] = SM.charAt(Math.random() * ON);
  return sT.join("");
};
class up {
  constructor() {
    this.disposers = /* @__PURE__ */ new Map();
  }
  add(i, o = Cd()) {
    return this.flush(o), this.disposers.set(o, i()), o;
  }
  addDisposer(i, o = Cd()) {
    return this.flush(o), this.disposers.set(o, i), o;
  }
  addEventListener(i, o, c, h, m = Cd()) {
    return this.add(() => (i.addEventListener(o, c, h), () => i.removeEventListener(o, c, h)), m), m;
  }
  setTimeout(i, o, c = Cd()) {
    return this.add(() => {
      const h = window.setTimeout(() => {
        this.remove(c), i();
      }, o);
      return () => window.clearTimeout(h);
    }, c);
  }
  setInterval(i, o, c = Cd()) {
    return this.add(() => {
      const h = window.setInterval(i, o);
      return () => window.clearInterval(h);
    }, c);
  }
  remove(i) {
    const o = this.disposers.get(i);
    return this.disposers.delete(i), o;
  }
  flush(i) {
    const o = this.remove(i);
    if (o)
      try {
        o();
      } catch (c) {
        console.error(c);
      }
  }
  flushAll() {
    this.disposers.forEach((i) => {
      try {
        i();
      } catch (o) {
        console.error(o);
      }
    }), this.disposers.clear();
  }
}
const xM = (r) => (i, o) => {
  if (i !== void 0)
    if (ng) {
      const c = (h) => {
        h.map((y) => y.kind).includes(r) && o();
      };
      return ng(i, c), o(), () => iS(i, c);
    } else
      return ug(
        () => i,
        () => {
          o();
        },
        {
          fireImmediately: !0
        }
      );
}, CM = (r, i, o) => {
  let c = null;
  const h = ug(
    r,
    () => {
      c && (c(), c = null);
      const m = r();
      xa(m) ? (c = () => iS(m, i), ng(m, i)) : o == null || o(m);
    },
    { fireImmediately: !0 }
  );
  return () => {
    c == null || c(), h();
  };
}, LN = xM(vM.Removed);
xM(vM.Inserted);
class BN {
  constructor() {
    this.listeners = /* @__PURE__ */ new Set();
  }
  get length() {
    return this.listeners.size;
  }
  dispatch(i) {
    this.listeners.forEach((o) => o(i));
  }
  addListener(i) {
    this.listeners.add(i);
  }
  removeListener(i) {
    this.listeners.delete(i);
  }
}
const cb = Object.keys;
function oT(r) {
  return Boolean(_b(r, "__isRef"));
}
function jN(r) {
  return { k: Cd(), v: r, __isRef: !0 };
}
const ba = "_WM-STORAGE_";
class lT {
  constructor(i, o, c) {
    if (this._sideEffect = new up(), this._destroyed = !1, this._refMap = /* @__PURE__ */ new WeakMap(), this._lastValue = /* @__PURE__ */ new Map(), this.onStateChanged = new BN(), c && !xa(c))
      throw new Error(`Default state for Storage ${o} is not an object.`);
    this._context = i, this.id = o || null, this._state = {};
    const h = this._getRawState(this._state);
    this._context.getIsWritable() && (this.id === null ? i.isAddApp && c && this.setState(c) : (h === this._state || !xa(h)) && (wn(this._context.getAttributes(), [ba]) || this._context.updateAttributes([ba], {}), this._context.updateAttributes([ba, this.id], this._state), c && this.setState(c))), cb(h).forEach((m) => {
      if (!(this.id === null && m === ba))
        try {
          const y = xa(h[m]) ? JSON.parse(JSON.stringify(h[m])) : h[m];
          oT(y) ? (this._state[m] = y.v, xa(y.v) && this._refMap.set(y.v, y)) : this._state[m] = y;
        } catch (y) {
          console.error(y);
        }
    }), this._sideEffect.addDisposer(
      CM(
        () => this.id === null ? i.getAttributes() : wn(i.getAttributes(), [ba, this.id]),
        this._updateProperties.bind(this),
        this.destroy.bind(this)
      )
    );
  }
  get state() {
    return this._destroyed && console.warn(`Accessing state on destroyed Storage "${this.id}"`), this._state;
  }
  addStateChangedListener(i) {
    return this.onStateChanged.addListener(i), () => this.onStateChanged.removeListener(i);
  }
  ensureState(i) {
    return this.setState(
      cb(i).reduce((o, c) => (_b(this._state, c) || (o[c] = i[c]), o), {})
    );
  }
  setState(i) {
    if (this._destroyed) {
      console.error(new Error(`Cannot call setState on destroyed Storage "${this.id}".`));
      return;
    }
    if (!this._context.getIsWritable()) {
      console.error(
        new Error(`Cannot setState on Storage "${this.id}" without writable access`),
        i
      );
      return;
    }
    const o = cb(i);
    o.length > 0 && o.forEach((c) => {
      const h = i[c];
      if (h !== this._state[c])
        if (h === void 0)
          this._lastValue.set(c, this._state[c]), delete this._state[c], this._setRawState(c, h);
        else {
          this._lastValue.set(c, this._state[c]), this._state[c] = h;
          let m = h;
          if (xa(h)) {
            let y = this._refMap.get(h);
            y || (y = jN(h), this._refMap.set(h, y)), m = y;
          }
          this._setRawState(c, m);
        }
    });
  }
  emptyStorage() {
    if (!(FD(this._state) <= 0)) {
      if (this._destroyed) {
        console.error(new Error(`Cannot empty destroyed Storage "${this.id}".`));
        return;
      }
      if (!this._context.getIsWritable()) {
        console.error(new Error(`Cannot empty Storage "${this.id}" without writable access.`));
        return;
      }
      this.setState($D(this._state, mM));
    }
  }
  deleteStorage() {
    if (this.id === null)
      throw new Error("Cannot delete main Storage");
    if (!this._context.getIsWritable()) {
      console.error(new Error(`Cannot delete Storage "${this.id}" without writable access.`));
      return;
    }
    this.destroy(), this._context.updateAttributes([ba, this.id], void 0);
  }
  get destroyed() {
    return this._destroyed;
  }
  destroy() {
    this._destroyed = !0, this._sideEffect.flushAll();
  }
  _getRawState(i) {
    var o;
    return this.id === null ? (o = this._context.getAttributes()) != null ? o : i : wn(this._context.getAttributes(), [ba, this.id], i);
  }
  _setRawState(i, o) {
    if (this.id === null) {
      if (i === ba)
        throw new Error(`Cannot set attribute internal filed "${ba}"`);
      return this._context.updateAttributes([i], o);
    } else
      return this._context.updateAttributes([ba, this.id, i], o);
  }
  _updateProperties(i) {
    var o;
    if (this._destroyed) {
      console.error(
        new Error(`Cannot call _updateProperties on destroyed Storage "${this.id}".`)
      );
      return;
    }
    if (i.length > 0) {
      const c = {};
      for (let h = 0; h < i.length; h++)
        try {
          const m = i[h], y = m.key;
          if (this.id === null && y === ba)
            continue;
          const g = xa(m.value) ? JSON.parse(JSON.stringify(m.value)) : m.value;
          let x;
          switch (this._lastValue.has(y) && (x = this._lastValue.get(y), this._lastValue.delete(y)), m.kind) {
            case 2: {
              _b(this._state, y) && (x = this._state[y], delete this._state[y]), c[y] = { oldValue: x };
              break;
            }
            default: {
              let C = g;
              if (oT(g)) {
                const { k: I, v: A } = g, z = this._state[y];
                xa(z) && ((o = this._refMap.get(z)) == null ? void 0 : o.k) === I ? C = z : (C = A, xa(A) && this._refMap.set(A, g));
              }
              C !== this._state[y] && (x = this._state[y], this._state[y] = C), c[y] = { newValue: C, oldValue: x };
              break;
            }
          }
        } catch (m) {
          console.error(m);
        }
      this.onStateChanged.dispatch(c);
    }
  }
}
class UN {
  constructor(i, o, c, h, m) {
    this.manager = i, this.boxManager = o, this.appId = c, this.appProxy = h, this.appOptions = m, this.mobxUtils = {
      autorun: Ss,
      reaction: ug,
      toJS: XD
    }, this.objectUtils = {
      listenUpdated: ng,
      unlistenUpdated: iS,
      listenDisposed: JD,
      unlistenDisposed: qD
    }, this.store = this.manager.store, this.isReplay = this.manager.isReplay, this.getDisplayer = () => this.manager.displayer, this.getAttributes = () => this.appProxy.attributes, this.getScenes = () => {
      const y = this.store.getAppAttributes(this.appId);
      return y != null && y.isDynamicPPT ? this.appProxy.scenes : y == null ? void 0 : y.options.scenes;
    }, this.getView = () => this.appProxy.view, this.mountView = (y) => {
      const g = this.getView();
      g && (g.divElement = y, setTimeout(() => {
        var x;
        (x = this.getRoom()) == null || x.refreshViewSize(), Dt.emit("onAppViewMounted", { appId: this.appId, view: g });
      }, 1e3));
    }, this.getInitScenePath = () => this.manager.getAppInitPath(this.appId), this.getIsWritable = () => this.manager.canOperate, this.getIsAppReadonly = () => this.manager.appReadonly, this.getBox = () => {
      const y = this.boxManager.getBox(this.appId);
      if (y)
        return y;
      throw new kN();
    }, this.getRoom = () => this.manager.room, this.setAttributes = (y) => {
      this.manager.safeSetAttributes({ [this.appId]: y });
    }, this.updateAttributes = (y, g) => {
      this.manager.attributes[this.appId] && this.manager.safeUpdateAttributes([this.appId, ...y], g);
    }, this.setScenePath = async (y) => {
      var g;
      !this.appProxy.box || (this.appProxy.setFullPath(y), (g = this.getRoom()) == null || g.setScenePath(y));
    }, this.getAppOptions = () => typeof this.appOptions == "function" ? this.appOptions() : this.appOptions, this.createStorage = (y, g) => {
      const x = new lT(this, y, g);
      return this.emitter.on("destroy", () => {
        x.destroy();
      }), x;
    }, this.dispatchMagixEvent = (...y) => {
      var x;
      const g = `${this.appId}:${y[0]}`;
      return (x = this.manager.room) == null ? void 0 : x.dispatchMagixEvent(g, y[1]);
    }, this.addMagixEventListener = (y, g, x) => {
      const C = `${this.appId}:${y}`;
      return this.manager.displayer.addMagixEventListener(
        C,
        g,
        x
      ), () => this.manager.displayer.removeMagixEventListener(
        C,
        g
      );
    }, this.removeMagixEventListener = this.manager.displayer.removeMagixEventListener.bind(
      this.manager.displayer
    ), this.nextPage = async () => {
      const y = this.pageState.index + 1;
      return y > this.pageState.length - 1 ? (console.warn("[WindowManager] nextPage: index out of range"), !1) : (this.appProxy.setSceneIndex(y), !0);
    }, this.jumpPage = async (y) => 0 <= y && y < this.pageState.length ? (this.appProxy.setSceneIndex(y), !0) : (console.warn("[WindowManager] nextPage: index out of range"), !1), this.prevPage = async () => {
      const y = this.pageState.index - 1;
      return y < 0 ? (console.warn("[WindowManager] prevPage: index out of range"), !1) : (this.appProxy.setSceneIndex(y), !0);
    }, this.addPage = async (y) => {
      const g = y == null ? void 0 : y.after, x = y == null ? void 0 : y.scene, C = this.appProxy.scenePath;
      if (!!C)
        if (g) {
          const I = this.pageState.index + 1;
          Xh(this.manager.room, C, [x || {}], I);
        } else
          Xh(this.manager.room, C, [x || {}]);
    }, this.removePage = async (y) => {
      const g = y === void 0 ? this.pageState.index : y;
      return this.pageState.length === 1 ? (console.warn("[WindowManager]: can not remove the last page"), !1) : g < 0 || g >= this.pageState.length ? (console.warn(`[WindowManager]: page index ${y} out of range`), !1) : this.appProxy.removeSceneByIndex(g);
    }, this.emitter = h.appEmitter, this.isAddApp = h.isAddApp;
  }
  get storage() {
    return this._storage || (this._storage = new lT(this)), this._storage;
  }
  get pageState() {
    return this.appProxy.pageState;
  }
  get kind() {
    return this.appProxy.kind;
  }
  dispatchAppEvent(i, o) {
    tt.emit(`custom-${this.kind}`, {
      kind: this.kind,
      appId: this.appId,
      type: i,
      value: o
    });
  }
  get extendWrapper() {
    return this.manager.extendWrapper;
  }
}
class VN {
  constructor(i) {
    this.params = i, this.sceneNode = null, this.onSceneChange = (h) => {
      this.sceneNode = h, this.params.notifyPageStateChange();
    };
    const { displayer: o, scenePath: c } = this.params;
    c && (this.sceneNode = o.createScenesCallback(c, {
      onAddScene: this.onSceneChange,
      onRemoveScene: this.onSceneChange
    }));
  }
  getFullPath(i) {
    var c;
    const o = (c = this.sceneNode) == null ? void 0 : c.scenes;
    if (this.params.scenePath && o) {
      const h = o[i];
      if (h)
        return `${this.params.scenePath}/${h}`;
    }
  }
  toObject() {
    var i, o;
    return {
      index: ((i = this.params.view) == null ? void 0 : i.focusSceneIndex) || 0,
      length: ((o = this.sceneNode) == null ? void 0 : o.scenes.length) || 0
    };
  }
  destroy() {
    var i;
    (i = this.sceneNode) == null || i.dispose();
  }
}
var xi = /* @__PURE__ */ ((r) => (r.Apps = "apps", r.Focus = "focus", r.State = "state", r.BoxState = "boxState", r.MainViewCamera = "mainViewCamera", r.MainViewSize = "mainViewSize", r.Broadcaster = "broadcaster", r.Cursors = "cursors", r.Position = "position", r.CursorState = "cursorState", r.FullPath = "fullPath", r.Registered = "registered", r.IframeBridge = "iframeBridge", r))(xi || {});
class HN {
  constructor(i) {
    this.context = i, this.setAppFocus = (o, c) => {
      c ? this.context.safeSetAttributes({ focus: o }) : this.context.safeSetAttributes({ focus: void 0 });
    };
  }
  setContext(i) {
    this.context = i;
  }
  get attributes() {
    return this.context.getAttributes();
  }
  apps() {
    return wn(this.attributes, ["apps"]);
  }
  get focus() {
    return wn(this.attributes, ["focus"]);
  }
  getAppAttributes(i) {
    return wn(this.apps(), [i]);
  }
  getAppState(i) {
    return wn(this.apps(), [i, "state"]);
  }
  getMaximized() {
    return wn(this.attributes, ["maximizedBoxes"]);
  }
  getMinimized() {
    return wn(this.attributes, ["minimizedBoxes"]);
  }
  setupAppAttributes(i, o, c) {
    this.attributes.apps || this.context.safeSetAttributes({ apps: {} });
    const m = ["scenePath", "title"];
    c || m.push("scenes");
    const y = QD(i.options, m), g = { kind: i.kind, options: y, isDynamicPPT: c };
    typeof i.src == "string" && (g.src = i.src), g.createdAt = Date.now(), this.context.safeUpdateAttributes(["apps", o], g), this.context.safeUpdateAttributes(["apps", o, "state"], {
      [Ji.Size]: {},
      [Ji.Position]: {},
      [Ji.SceneIndex]: 0
    });
  }
  updateAppState(i, o, c) {
    wn(this.attributes, ["apps", i, "state"]) && this.context.safeUpdateAttributes(["apps", i, "state", o], c);
  }
  cleanAppAttributes(i) {
    this.context.safeUpdateAttributes(["apps", i], void 0), this.context.safeSetAttributes({ [i]: void 0 }), this.attributes.focus === i && this.cleanFocus();
  }
  cleanFocus() {
    this.context.safeSetAttributes({ focus: void 0 });
  }
  getAppSceneIndex(i) {
    var o;
    return (o = this.getAppState(i)) == null ? void 0 : o[Ji.SceneIndex];
  }
  getAppScenePath(i) {
    var o, c;
    return (c = (o = this.getAppAttributes(i)) == null ? void 0 : o.options) == null ? void 0 : c.scenePath;
  }
  getMainViewScenePath() {
    return this.attributes._mainScenePath;
  }
  getMainViewSceneIndex() {
    return this.attributes._mainSceneIndex;
  }
  getBoxState() {
    return this.attributes.boxState;
  }
  setMainViewScenePath(i) {
    this.context.safeSetAttributes({ _mainScenePath: i });
  }
  setMainViewSceneIndex(i) {
    this.context.safeSetAttributes({ _mainSceneIndex: i });
  }
  getMainViewCamera() {
    return wn(this.attributes, ["mainViewCamera"]);
  }
  getMainViewSize() {
    return wn(this.attributes, ["mainViewSize"]);
  }
  setMainViewCamera(i) {
    this.context.safeSetAttributes({ mainViewCamera: { ...i } });
  }
  setMainViewSize(i) {
    i.width === 0 || i.height === 0 || this.context.safeSetAttributes({ mainViewSize: { ...i } });
  }
  setMainViewCameraAndSize(i, o) {
    o.width === 0 || o.height === 0 || this.context.safeSetAttributes({
      mainViewCamera: { ...i },
      mainViewSize: { ...o }
    });
  }
  updateCursor(i, o) {
    wn(this.attributes, ["cursors"]) || this.context.safeUpdateAttributes(["cursors"], {}), wn(this.attributes, ["cursors", i]) || this.context.safeUpdateAttributes(["cursors", i], {}), this.context.safeUpdateAttributes(["cursors", i, "position"], o);
  }
  updateCursorState(i, o) {
    wn(this.attributes, ["cursors", i]) || this.context.safeUpdateAttributes(["cursors", i], {}), this.context.safeUpdateAttributes(["cursors", i, "cursorState"], o);
  }
  getCursorState(i) {
    return wn(this.attributes, ["cursors", i, "cursorState"]);
  }
  cleanCursor(i) {
    this.context.safeUpdateAttributes(["cursors", i], void 0);
  }
  setMainViewFocusPath(i) {
    const o = this.getMainViewScenePath();
    o && Pu(i, o);
  }
  getIframeBridge() {
    return wn(this.attributes, ["iframeBridge"]);
  }
  setIframeBridge(i) {
    if (xa(i)) {
      const o = this.getIframeBridge();
      for (const c in i) {
        const h = i[c];
        o[c] !== h && this.context.safeUpdateAttributes(["iframeBridge", c], h);
      }
    }
  }
}
const WN = new HN({
  getAttributes: () => {
    throw new Error("getAttributes not implemented");
  },
  safeSetAttributes: () => {
    throw new Error("safeSetAttributes not implemented");
  },
  safeUpdateAttributes: () => {
    throw new Error("safeUpdateAttributes not implemented");
  }
}), Ca = (...r) => {
  Wt.debug && console.log("[WindowManager]:", ...r);
}, TM = (r, i) => {
  let o = 0;
  const c = i.length - 1;
  return r === i.index ? r === c ? o = r - 1 : o = i.index + 1 : o = i.index, o;
}, po = new Nd();
class aS {
  constructor(i, o, c, h) {
    var m;
    this.params = i, this.manager = o, this.boxManager = this.manager.boxManager, this.appProxies = this.manager.appProxies, this.viewManager = this.manager.viewManager, this.store = this.manager.store, this.status = "normal", this.getAppInitState = (y) => {
      var G, he;
      const g = this.store.getAppState(y);
      if (!g)
        return;
      const x = g == null ? void 0 : g[Ji.Position], C = this.store.focus, I = g == null ? void 0 : g[Ji.Size], A = g == null ? void 0 : g[Ji.SceneIndex], z = (G = this.attributes) == null ? void 0 : G.maximized, $ = (he = this.attributes) == null ? void 0 : he.minimized, V = g == null ? void 0 : g.zIndex;
      let q = { maximized: z, minimized: $, zIndex: V };
      return x && (q = { ...q, id: y, x: x.x, y: x.y }), C === y && (q = { ...q, focus: !0 }), I && (q = { ...q, width: I.width, height: I.height }), A && (q = { ...q, sceneIndex: A }), q;
    }, this.appAttributesUpdateListener = (y) => {
      this.manager.refresher.add(y, () => Ss(() => {
        const g = this.manager.attributes[y];
        g && this.appEmitter.emit("attributesUpdate", g);
      })), this.manager.refresher.add(this.stateKey, () => Ss(() => {
        var x, C, I, A;
        const g = (x = this.appAttributes) == null ? void 0 : x.state;
        (g == null ? void 0 : g.zIndex) > 0 && g.zIndex !== ((C = this.box) == null ? void 0 : C.zIndex) && ((I = this.boxManager) == null || I.setZIndex(y, g.zIndex), (A = this.boxManager) == null || A.focusBox({ appId: y }));
      })), this.manager.refresher.add(`${y}-fullPath`, () => Ss(() => {
        var x;
        const g = (x = this.appAttributes) == null ? void 0 : x.fullPath;
        this.setFocusScenePathHandler(g), this._prevFullPath !== g && (this.notifyPageStateChange(), this._prevFullPath = g);
      }));
    }, this.setFocusScenePathHandler = xs((y) => {
      var g;
      this.view && y && y !== ((g = this.view) == null ? void 0 : g.focusScenePath) && (Pu(this.view, y), Dt.emit("onAppScenePathChange", { appId: this.id, view: this.view }));
    }, 50), this.notifyPageStateChange = xs(() => {
      this.appEmitter.emit("pageStateChange", this.pageState);
    }, 50), this.kind = i.kind, this.id = c, this.stateKey = `${this.id}_state`, this.appProxies.set(this.id, this), this.appEmitter = new Nd(), this.appListener = this.makeAppEventListener(this.id), this.isAddApp = h, this.initScenes(), (m = this.params.options) != null && m.scenePath && this.createView(), this._pageState = new VN({
      displayer: this.manager.displayer,
      scenePath: this.scenePath,
      view: this.view,
      notifyPageStateChange: this.notifyPageStateChange
    });
  }
  initScenes() {
    var o;
    const i = this.params.options;
    i && (this.scenePath = i.scenePath, ((o = this.appAttributes) == null ? void 0 : o.isDynamicPPT) && this.scenePath ? this.scenes = Ad(this.manager.displayer)[this.scenePath] : this.scenes = i.scenes);
  }
  get view() {
    return this.manager.viewManager.getView(this.id);
  }
  get viewIndex() {
    var i;
    return (i = this.view) == null ? void 0 : i.focusSceneIndex;
  }
  get isWritable() {
    var i;
    return this.manager.canOperate && !((i = this.box) != null && i.readonly);
  }
  get attributes() {
    return this.manager.attributes[this.id];
  }
  get appAttributes() {
    return this.store.getAppAttributes(this.id);
  }
  getFullScenePath() {
    if (this.scenePath)
      return wn(this.appAttributes, [xi.FullPath]) || this.getFullScenePathFromScenes();
  }
  getFullScenePathFromScenes() {
    const i = wn(this.appAttributes, ["state", "SceneIndex"], 0), o = xN(this.manager.room, this.scenePath, i);
    return o && this.setFullPath(o), o;
  }
  setFullPath(i) {
    this.manager.safeUpdateAttributes(["apps", this.id, xi.FullPath], i);
  }
  async baseInsertApp(i = !1) {
    var m;
    const o = this.params;
    if (!o.kind)
      throw new Error("[WindowManager]: kind require");
    const c = await ((m = qi.appClasses.get(o.kind)) == null ? void 0 : m()), h = qi.registered.get(o.kind);
    if (c)
      await this.setupApp(
        this.id,
        i,
        c,
        o.options,
        h == null ? void 0 : h.appOptions
      );
    else
      throw new Error(`[WindowManager]: app load failed ${o.kind} ${o.src}`);
    return tt.emit("updateManagerRect"), {
      appId: this.id,
      app: c
    };
  }
  get box() {
    var i;
    return (i = this.boxManager) == null ? void 0 : i.getBox(this.id);
  }
  async setupApp(i, o, c, h, m) {
    var g;
    if (Ca("setupApp", i, c, h), !this.boxManager)
      throw new PN();
    const y = new UN(this.manager, this.boxManager, i, this, m);
    this.appContext = y;
    try {
      tt.once(`${i}${Xt.WindowCreated}`).then(async () => {
        var z, $, V, q, G, he, se, Z, ue, oe;
        let A;
        if (!o) {
          A = this.getAppInitState(i);
          const Ne = (V = ($ = (z = this.boxManager) == null ? void 0 : z.teleBoxManager) == null ? void 0 : $.maximizedBoxes) == null ? void 0 : V.includes(i), Fe = (he = (G = (q = this.boxManager) == null ? void 0 : q.teleBoxManager) == null ? void 0 : G.minimizedBoxes) == null ? void 0 : he.includes(i);
          Object.assign(A || {}, { maximized: Ne, minimized: Fe }), (se = this.boxManager) == null || se.updateBoxState(A);
          const Pe = (Z = this.boxManager) == null ? void 0 : Z.teleBoxManager.maximizedBoxes.filter((Y) => {
            var fe;
            return !((fe = this == null ? void 0 : this.boxManager) != null && fe.teleBoxManager.minimizedBoxes.includes(Y));
          });
          Pe != null && Pe.length && ((oe = (ue = this.boxManager) == null ? void 0 : ue.teleBoxManager) == null || oe.makeBoxTopFromMaximized());
        }
        this.appEmitter.onAny(this.appListener), this.appAttributesUpdateListener(i), this.setViewFocusScenePath(), setTimeout(async () => {
          console.log("setup app", c);
          const Ne = await c.setup(y);
          this.appResult = Ne, qi.notifyApp(this.kind, "created", { appId: i, result: Ne }), this.afterSetupApp(A), this.fixMobileSize(), Dt.emit("onAppSetup", i);
        }, wM);
      }), (g = this.boxManager) == null || g.createBox({
        appId: i,
        app: c,
        options: h,
        canOperate: this.manager.canOperate,
        smartPosition: this.isAddApp
      }), this.isAddApp && this.box && (this.store.updateAppState(i, Ji.ZIndex, this.box.zIndex), this.store.updateAppState(i, Ji.Size, {
        width: this.box.intrinsicWidth,
        height: this.box.intrinsicHeight
      }), this.boxManager.focusBox({ appId: i }, !1));
      const x = this.store.attributes.scale, C = this.store.attributes.mainViewBackgroundImg;
      let I = Pb(x) ? x : 1;
      I < 1 && (I = 1), tt.emit("onScaleChange", I), tt.emit("onBackgroundImgChange", C);
    } catch (x) {
      throw console.error(x), new Error(`[WindowManager]: app setup error: ${x.message}`);
    }
  }
  fixMobileSize() {
    var o, c;
    const i = (o = this.boxManager) == null ? void 0 : o.getBox(this.id);
    i && ((c = this.boxManager) == null || c.resizeBox({
      appId: this.id,
      width: i.intrinsicWidth + 1e-3,
      height: i.intrinsicHeight + 1e-3,
      skipUpdate: !0
    }));
  }
  afterSetupApp(i) {
    var o;
    i && (!(i != null && i.x) || !i.y) && ((o = this.boxManager) == null || o.setBoxInitState(this.id));
  }
  async onSeek(i) {
    var c;
    this.appEmitter.emit("seek", i).catch((h) => {
      console.log(`[WindowManager]: emit seek error: ${h.message}`);
    });
    const o = this.getAppInitState(this.id);
    (c = this.boxManager) == null || c.updateBoxState(o);
  }
  async onReconnected() {
    var m;
    if (!Boolean(this.manager.attributes.apps[this.id])) {
      await this.destroy(!0, !1, !0);
      return;
    }
    this.appEmitter.emit("reconnected", void 0);
    const o = this.getAppInitState(this.id);
    await this.destroy(!0, !1, !0);
    const c = this.params;
    await new aS(c, this.manager, this.id, this.isAddApp).baseInsertApp(!0), (m = this.boxManager) == null || m.updateBoxState(o);
  }
  async onRemoveScene(i) {
    if (this.scenePath && i.startsWith(this.scenePath + "/")) {
      let o = this.pageState.index, c = this._pageState.getFullPath(o);
      c || (o = 0, c = this._pageState.getFullPath(o)), c && this.setFullPath(c), this.setViewFocusScenePath(), this.view && (this.view.focusSceneIndex = o);
    }
  }
  emitAppSceneStateChange(i) {
    this.appEmitter.emit("sceneStateChange", i);
  }
  emitAppIsWritableChange() {
    this.appEmitter.emit("writableChange", this.isWritable);
  }
  makeAppEventListener(i) {
    return (o, c) => {
      var h, m, y, g;
      if (!!this.manager.canOperate)
        switch (o) {
          case "setBoxSize": {
            (h = this.boxManager) == null || h.resizeBox({
              appId: i,
              width: c.width,
              height: c.height,
              skipUpdate: !1
            });
            break;
          }
          case "setBoxMinSize": {
            (m = this.boxManager) == null || m.setBoxMinSize({
              appId: i,
              minWidth: c.minwidth,
              minHeight: c.minheight
            });
            break;
          }
          case "setBoxTitle": {
            (y = this.boxManager) == null || y.setBoxTitle({ appId: i, title: c.title });
            break;
          }
          case gM.destroy: {
            if (this.status === "destroyed")
              return;
            this.destroy(!0, !1, !0, c == null ? void 0 : c.error), c != null && c.error && console.error(c == null ? void 0 : c.error);
            break;
          }
          case "focus": {
            (g = this.boxManager) == null || g.focusBox({ appId: this.id }), po.emit("focus", { appId: this.id });
            break;
          }
        }
    };
  }
  setScenePath() {
    if (!this.manager.canOperate)
      return;
    const i = this.getFullScenePath();
    this.manager.room && i && this.view && jb(this.manager.room, i);
  }
  setViewFocusScenePath() {
    const i = this.getFullScenePath();
    return i && this.view && Pu(this.view, i), i;
  }
  async createView() {
    const i = await this.viewManager.createView(this.id);
    return this.setViewFocusScenePath(), i;
  }
  get pageState() {
    return this._pageState.toObject();
  }
  async removeSceneByIndex(i) {
    const o = this._pageState.getFullPath(i);
    if (o) {
      const c = TM(i, this.pageState);
      return this.setSceneIndexWithoutSync(c), this.manager.dispatchInternalEvent(Xt.SetAppFocusIndex, {
        type: "app",
        appID: this.id,
        index: c
      }), setTimeout(() => {
        Ub(this.manager.room, o, i);
      }, 100), !0;
    } else
      return !1;
  }
  setSceneIndexWithoutSync(i) {
    this.view && (this.view.focusSceneIndex = i);
  }
  setSceneIndex(i) {
    if (this.view) {
      this.view.focusSceneIndex = i;
      const o = this._pageState.getFullPath(i);
      o && this.setFullPath(o);
    }
  }
  async destroy(i, o, c, h) {
    var m;
    if (this.status !== "destroyed") {
      this.status = "destroyed";
      try {
        await qi.notifyApp(this.kind, "destroy", { appId: this.id }), await this.appEmitter.emit("destroy", { error: h });
      } catch (y) {
        console.error("[WindowManager]: notifyApp error", y.message, y.stack);
      }
      this.appEmitter.clearListeners(), tt.emit(`destroy-${this.id}`, { error: h }), i && ((m = this.boxManager) == null || m.closeBox(this.id, c)), o && (this.store.cleanAppAttributes(this.id), this.scenePath && Ub(this.manager.room, this.scenePath)), this.appProxies.delete(this.id), this._pageState.destroy(), this.viewManager.destroyView(this.id), this.manager.appStatus.delete(this.id), this.manager.refresher.remove(this.id), this.manager.refresher.remove(this.stateKey), this.manager.refresher.remove(`${this.id}-fullPath`), this._prevFullPath = void 0;
    }
  }
  close() {
    return this.destroy(!0, !0, !1);
  }
}
class FN {
  constructor(i) {
    this.displayer = i, this.views = /* @__PURE__ */ new Map();
  }
  createView(i) {
    const o = MM(this.displayer);
    return this.views.set(i, o), o;
  }
  getView(i) {
    return this.views.get(i);
  }
  destroyView(i) {
    const o = this.views.get(i);
    if (o) {
      try {
        o.release();
      } catch {
      }
      this.views.delete(i);
    }
  }
  setViewScenePath(i, o) {
    const c = this.views.get(i);
    c && (c.focusScenePath = o);
  }
  destroy() {
    this.views.forEach((i) => {
      try {
        i.release();
      } catch {
      }
    }), this.views.clear();
  }
}
const MM = (r) => {
  const i = r.views.createView();
  return $N(i), i;
}, $N = (r) => {
  r.setCameraBound({
    maxContentMode: () => 10,
    minContentMode: () => 0.1
  });
};
class QN {
  constructor(i) {
    this.manager = i, this.polling = !1, this.started = !1, this.mainViewIsAddListener = !1, this.store = this.manager.store, this.viewMode = this.manager.windowManger.viewMode, this.sideEffectManager = new up(), this.syncCamera = () => {
      if (!this.polling || this.viewMode !== sl.Broadcaster)
        return;
      const { mainViewCamera: c } = this;
      c && c.id !== this.manager.uid && this.moveCameraSizeByAttributes();
    }, this.startListenWritableChange = () => {
      this.sideEffectManager.add(() => tt.on("writableChange", (c) => {
        c && this.ensureCameraAndSize(), this.manager.room && this.syncMainView(this.manager.room);
      }));
    }, this.addCameraReaction = () => {
      this.manager.refresher.add(xi.MainViewCamera, this.cameraReaction);
    }, this.cameraReaction = () => ug(
      () => this.mainViewCamera,
      (c) => {
        c && c.id !== this.manager.uid && (this.moveCameraToContian(this.mainViewSize), this.moveCamera(c));
      },
      { fireImmediately: !0 }
    ), this.sizeChangeHandler = xs((c) => {
      c && (this.moveCameraToContian(c), this.moveCamera(this.mainViewCamera)), this.ensureMainViewSize();
    }, 30), this.onUpdateContainerSizeRatio = () => {
      const c = this.store.getMainViewSize();
      this.sizeChangeHandler(c);
    }, this.onCameraUpdatedByDevice = (c) => {
      this.viewMode !== sl.Follower && (this.store.setMainViewCamera({ ...c, id: this.manager.uid }), tg(this.mainViewSize, { ...this.mainView.size, id: this.manager.uid }) || this.setMainViewSize(this.view.size));
    }, this.mainViewClickListener = () => {
      this.mainViewClickHandler();
    }, this.setMainViewSize = xs((c) => {
      this.store.setMainViewSize({ ...c, id: this.manager.uid });
    }, 50), this._syncMainViewTimer = 0, this.onCameraOrSizeUpdated = () => {
      Dt.emit("cameraStateChange", this.cameraState), this.manager.room && this.manager.room.syncMainView && (clearTimeout(this._syncMainViewTimer), this._syncMainViewTimer = setTimeout(this.syncMainView, 100, this.manager.room)), this.ensureMainViewSize();
    }, this.syncMainView = (c) => {
      c.isWritable && c.syncMainView(this.mainView);
    }, this.setViewMode = (c) => {
      this.viewMode = c;
    }, this.mainView = this.createMainView(), this.moveCameraSizeByAttributes(), tt.once("mainViewMounted").then(() => {
      this.addMainViewListener(), this.start(), this.ensureCameraAndSize(), this.startListenWritableChange();
    });
    const o = () => {
      this.sizeChangeHandler(this.mainViewSize);
    };
    this.sideEffectManager.add(() => tt.on("playgroundSizeChange", o)), this.sideEffectManager.add(() => tt.on("containerSizeRatioUpdate", this.onUpdateContainerSizeRatio)), this.sideEffectManager.add(() => tt.on("startReconnect", () => {
      this.didRelease || this.mainView.release();
    })), this.sideEffectManager.setInterval(this.syncCamera, 1500);
  }
  ensureCameraAndSize() {
    this.viewMode === sl.Broadcaster && (!this.mainViewCamera || !this.mainViewSize) && (this.manager.dispatchInternalEvent(Xt.InitMainViewCamera), this.setCameraAndSize());
  }
  get mainViewCamera() {
    return this.store.getMainViewCamera();
  }
  get mainViewSize() {
    return this.store.getMainViewSize();
  }
  get didRelease() {
    return wn(this.view, ["didRelease"]);
  }
  moveCameraSizeByAttributes() {
    this.moveCameraToContian(this.mainViewSize), this.moveCamera(this.mainViewCamera);
  }
  start() {
    this.sizeChangeHandler(this.mainViewSize), !this.started && (this.addCameraListener(), this.addCameraReaction(), this.manager.room && this.syncMainView(this.manager.room), this.started = !0);
  }
  setCameraAndSize() {
    const i = { ...this.mainView.camera, id: this.manager.uid }, o = { ...this.mainView.size, id: this.manager.uid };
    this.store.setMainViewCameraAndSize(i, o);
  }
  get view() {
    return this.mainView;
  }
  get cameraState() {
    return { ...this.view.camera, ...this.view.size };
  }
  createMainView() {
    const i = MM(this.manager.displayer), o = this.store.getMainViewScenePath();
    return o && Pu(i, o), i;
  }
  onReconnect() {
    if (this.didRelease)
      this.rebind();
    else {
      const i = this.store.getMainViewScenePath();
      this.setFocusScenePath(i);
    }
  }
  setFocusScenePath(i) {
    if (i)
      return Pu(this.view, i);
  }
  rebind() {
    const i = this.mainView.divElement, o = this.mainView.disableCameraTransform;
    this.stop(), this.didRelease || this.mainView.release(), this.removeMainViewListener(), this.mainView = this.createMainView(), this.mainView.disableCameraTransform = o, this.mainView.divElement = i, this.addMainViewListener(), this.start(), Dt.emit("onMainViewRebind", this.mainView);
  }
  addMainViewListener() {
    this.mainViewIsAddListener || this.view.divElement && (this.view.divElement.addEventListener("click", this.mainViewClickListener), this.view.divElement.addEventListener("touchend", this.mainViewClickListener), this.mainViewIsAddListener = !0);
  }
  removeMainViewListener() {
    this.view.divElement && (this.view.divElement.removeEventListener("click", this.mainViewClickListener), this.view.divElement.removeEventListener("touchend", this.mainViewClickListener)), this.mainViewIsAddListener = !1;
  }
  async mainViewClickHandler() {
    var i;
    !this.manager.canOperate || (this.store.cleanFocus(), (i = this.manager.boxManager) == null || i.blurAllBox());
  }
  addCameraListener() {
    this.view.callbacks.on("onCameraUpdatedByDevice", this.onCameraUpdatedByDevice), this.view.callbacks.on("onCameraUpdated", this.onCameraOrSizeUpdated), this.view.callbacks.on("onSizeUpdated", this.onCameraOrSizeUpdated);
  }
  removeCameraListener() {
    this.view.callbacks.off("onCameraUpdatedByDevice", this.onCameraUpdatedByDevice), this.view.callbacks.off("onCameraUpdated", this.onCameraOrSizeUpdated), this.view.callbacks.off("onSizeUpdated", this.onCameraOrSizeUpdated);
  }
  ensureMainViewSize() {
    (!this.mainViewSize || this.mainViewSize.width === 0 || this.mainViewSize.height === 0) && this.mainView.size.width > 0 && this.mainView.size.height > 0 && this.setMainViewSize(this.mainView.size);
  }
  moveCameraToContian(i) {
    Gh(i) || (this.view.moveCameraToContain({
      width: i.width,
      height: i.height,
      originX: -i.width / 2,
      originY: -i.height / 2,
      animationMode: zb.Immediately
    }), this.scale = this.view.camera.scale);
  }
  moveCamera(i) {
    if (!Gh(i)) {
      if (tg(i, this.view.camera))
        return;
      const { centerX: o, centerY: c, scale: h } = i, m = h * (this.scale || 1);
      this.view.moveCamera({
        centerX: o,
        centerY: c,
        scale: m,
        animationMode: zb.Immediately
      });
    }
  }
  stop() {
    this.removeCameraListener(), this.manager.refresher.remove(xi.MainViewCamera), this.manager.refresher.remove(xi.MainViewSize), this.started = !1;
  }
  destroy() {
    this.removeMainViewListener(), this.stop(), this.sideEffectManager.flushAll();
  }
}
class ZN {
  constructor(i) {
    this.context = i, this.addRedoUndoListeners = (o) => {
      if (o === void 0)
        this.addViewCallbacks(
          this.context.mainView(),
          this.onCanRedoStepsUpdate,
          this.onCanUndoStepsUpdate
        );
      else {
        const c = this.context.getAppProxy(o);
        c && c.view && this.addViewCallbacks(
          c.view,
          this.onCanRedoStepsUpdate,
          this.onCanUndoStepsUpdate
        );
      }
    }, this.addViewCallbacks = (o, c, h) => {
      c(o.canRedoSteps), h(o.canUndoSteps), o.callbacks.on("onCanRedoStepsUpdate", c), o.callbacks.on("onCanUndoStepsUpdate", h);
    }, this.disposeViewCallbacks = (o) => {
      o.callbacks.off("onCanRedoStepsUpdate", this.onCanRedoStepsUpdate), o.callbacks.off("onCanUndoStepsUpdate", this.onCanUndoStepsUpdate);
    }, this.onCanRedoStepsUpdate = (o) => {
      Dt.emit("canRedoStepsChange", o);
    }, this.onCanUndoStepsUpdate = (o) => {
      Dt.emit("canUndoStepsChange", o);
    }, this.disposePrevFocusViewRedoUndoListeners = (o) => {
      let c;
      if (o === void 0)
        c = this.context.mainView();
      else {
        const h = this.context.getAppProxy(o);
        h && h.view && (c = h.view);
      }
      c && this.disposeViewCallbacks(c);
    }, tt.on("focusedChange", (o) => {
      this.disposePrevFocusViewRedoUndoListeners(o.prev), setTimeout(() => {
        this.addRedoUndoListeners(o.focused);
      }, 0);
    }), tt.on("rootDirRemoved", () => {
      this.disposePrevFocusViewRedoUndoListeners(i.focus()), this.addRedoUndoListeners(i.focus());
    }), this.addRedoUndoListeners(i.focus());
  }
  destroy() {
    this.disposePrevFocusViewRedoUndoListeners(this.context.focus());
  }
}
class YN {
  constructor(i) {
    this.windowManger = i, this.appProxies = /* @__PURE__ */ new Map(), this.appStatus = /* @__PURE__ */ new Map(), this.store = WN, this.isReplay = this.windowManger.isReplay, this.mainViewScenesLength = 0, this.callbacksNode = null, this.appCreateQueue = new sN(), this.sideEffectManager = new up(), this.sceneState = null, this.rootDirRemoving = !1, this.onRemoveScenes = async (o) => {
      var h, m;
      const { scenePath: c } = o;
      if (c === Cr) {
        await this.onRootDirRemoved(), this.dispatchInternalEvent(Xt.RootDirRemoved);
        return;
      }
      if (IN(c)) {
        let y = this.mainView.focusSceneIndex || 0, g = (h = this.callbacksNode) == null ? void 0 : h.scenes[y];
        g || (y = 0, g = (m = this.callbacksNode) == null ? void 0 : m.scenes[y]), g && this.setMainViewScenePath(`${Cr}${g}`), await this.setMainViewSceneIndex(y);
      } else
        this.appProxies.forEach((y) => {
          y.onRemoveScene(c);
        });
    }, this.onReadonlyChanged = () => {
      this.appProxies.forEach((o) => {
        o.emitAppIsWritableChange();
      });
    }, this.onPlayerSeekStart = async () => {
      await this.closeAll();
    }, this.onPlayerSeekDone = async (o) => {
      await this.attributesUpdateCallback(this.attributes.apps), this.appProxies.forEach((c) => {
        c.onSeek(o);
      });
    }, this.createRootDirScenesCallback = () => {
      let o = !1;
      this.callbacksNode && (this.callbacksNode.dispose(), o = !0), this.callbacksNode = this.displayer.createScenesCallback(Cr, {
        onAddScene: this.onSceneChange,
        onRemoveScene: async (c, h) => {
          await this.onSceneChange(c), tt.emit("rootDirSceneRemoved", h);
        }
      }), this.callbacksNode && (this.updateSceneState(this.callbacksNode), this.mainViewScenesLength = this.callbacksNode.scenes.length, o && this.emitMainViewScenesChange(this.callbacksNode.scenes.length));
    }, this.removeSceneByIndex = async (o) => {
      var m;
      const c = TM(o, this.windowManger.pageState);
      this.setSceneIndexWithoutSync(c), this.dispatchInternalEvent(Xt.SetAppFocusIndex, { type: "main", index: c });
      const h = (m = this.callbacksNode) == null ? void 0 : m.scenes[o];
      return setTimeout(() => {
        h && Ub(this.room, `${Cr}${h}`, o);
      }, 100), new Promise((y, g) => {
        tt.once("rootDirSceneRemoved").then((x) => {
          x === h && y(!0);
        }).catch((x) => {
          console.log(`[WindowManager]: removePage error: ${x}`), g(!1);
        });
      });
    }, this.setSceneIndexWithoutSync = (o) => {
      var h;
      const c = (h = this.callbacksNode) == null ? void 0 : h.scenes[o];
      c && this.mainViewProxy.setFocusScenePath(`${Cr}${c}`);
    }, this.onSceneChange = (o) => (this.mainViewScenesLength = o.scenes.length, this.updateSceneState(o), this.emitMainViewScenesChange(this.mainViewScenesLength)), this.emitMainViewScenesChange = (o) => Promise.all([
      Dt.emit("mainViewScenesLengthChange", o),
      tt.emit("changePageState")
    ]), this.updateSceneState = (o) => {
      const c = this.store.getMainViewSceneIndex() || 0;
      let h = o.scenes[c];
      h || (h = o.scenes[this.mainView.focusSceneIndex || 0]), this.sceneState = {
        scenePath: `${Cr}${h}`,
        contextPath: o.path,
        index: c,
        scenes: o.scenes.map((m) => ({
          name: m
        })),
        sceneName: h
      }, Dt.emit("sceneStateChange", this.sceneState);
    }, this.onBoxMove = (o) => {
      this.dispatchInternalEvent(Xt.AppMove, o), this.store.updateAppState(o.appId, Ji.Position, {
        x: o.x,
        y: o.y
      }), Dt.emit("onBoxMove", o);
    }, this.onBoxResize = (o) => {
      o.width && o.height && (this.dispatchInternalEvent(Xt.AppResize, o), this.store.updateAppState(o.appId, Ji.Size, {
        width: o.width,
        height: o.height
      }), Dt.emit("onBoxResize", o));
    }, this.onBoxFocus = (o) => {
      this.windowManger.safeSetAttributes({ focus: o.appId }), Dt.emit("onBoxFocus", o);
    }, this.onBoxClose = (o) => {
      const c = this.appProxies.get(o.appId);
      c && c.destroy(!1, !0, !0, o.error), Dt.emit("onBoxClose", o);
    }, this.onBoxStateChange = (o) => {
      this.dispatchInternalEvent(Xt.AppBoxStateChange, o), Dt.emit("onBoxStateChange", o);
    }, this.addAppsChangeListener = () => {
      this.refresher.add("apps", () => CM(
        () => this.attributes.apps,
        () => {
          this.attributesUpdateCallback(this.attributes.apps);
        }
      ));
    }, this.addAppCloseListener = () => {
      this.refresher.add("appsClose", () => LN(this.attributes.apps, () => {
        this.onAppDelete(this.attributes.apps);
      }));
    }, this.onMainViewIndexChange = (o) => {
      o !== void 0 && this._prevSceneIndex !== o && (Dt.emit("mainViewSceneIndexChange", o), tt.emit("changePageState"), this.callbacksNode && this.updateSceneState(this.callbacksNode), this._prevSceneIndex = o);
    }, this.onFocusChange = (o) => {
      var c;
      this._prevFocused !== o && (Dt.emit("focusedChange", o), tt.emit("focusedChange", { focused: o, prev: this._prevFocused }), this._prevFocused = o, o !== void 0 && ((c = this.boxManager) == null || c.focusBox({ appId: o }), setTimeout(() => {
        const h = this.appProxies.get(o);
        h && qi.notifyApp(h.kind, "focus", { appId: o });
      }, 0)));
    }, this.attributesUpdateCallback = xs(
      (o) => this._attributesUpdateCallback(o),
      100
    ), this._appIds = [], this.onRegisteredChange = (o) => {
      !o || Object.entries(o).forEach(([c, h]) => {
        qi.appClasses.has(c) || qi.register({
          kind: c,
          src: h.src,
          name: h.name
        });
      });
    }, this.onMinimized = (o) => {
      var c;
      ((c = this.boxManager) == null ? void 0 : c.minimized) !== o && setTimeout(() => {
        var h;
        (h = this.boxManager) == null || h.setMinimized(o);
      }, 0);
    }, this.onAppDelete = async (o) => {
      const c = Object.keys(o);
      for (const [h, m] of this.appProxies.entries())
        c.includes(h) || await m.destroy(!0, !1, !0);
    }, this.closeAll = async () => {
      for (const [o, c] of this.appProxies.entries())
        await c.destroy(!0, !1, !0);
    }, this.displayerStateListener = (o) => {
      this.appProxies.forEach((c) => {
        c.appEmitter.emit("roomStateChange", o);
      }), tt.emit("observerIdChange", this.displayer.observerId);
    }, this.displayerWritableListener = (o) => {
      var m, y;
      const c = !o, h = this.windowManger.readonly === void 0 || this.windowManger.readonly === !1;
      this.windowManger.readonly === void 0 ? (m = this.boxManager) == null || m.setReadonly(o) : (y = this.boxManager) == null || y.setReadonly(!(c && h)), this.appProxies.forEach((g) => {
        g.emitAppIsWritableChange();
      }), tt.emit("writableChange", c);
    }, this.updateSceneIndex = () => {
      const o = this.store.getMainViewScenePath(), c = ub(o), h = Ad(this.displayer)[c];
      if (h.length) {
        const m = o.replace(c, "").replace("/", ""), y = h.findIndex((g) => g.name === m);
        ZD(y) && y >= 0 && this.safeSetAttributes({ _mainSceneIndex: y });
      }
    }, this.updateRootDirRemoving = (o) => {
      this.rootDirRemoving = o;
    }, this.displayer = i.displayer, this.store.setContext({
      getAttributes: () => this.attributes,
      safeSetAttributes: (o) => this.safeSetAttributes(o),
      safeUpdateAttributes: (o, c) => this.safeUpdateAttributes(o, c)
    }), this.mainViewProxy = new QN(this), this.viewManager = new FN(this.displayer), this.appListeners = new AN(this), this.displayer.callbacks.on(this.eventName, this.displayerStateListener), this.appListeners.addListeners(), this.refresher = GO, this.refresher.setRoom(this.room), this.refresher.setContext({ emitter: tt }), this.sideEffectManager.addDisposer(() => {
      var o, c;
      this.appCreateQueue.destroy(), this.mainViewProxy.destroy(), this.refresher.destroy(), this.viewManager.destroy(), (o = this.boxManager) == null || o.destroy(), (c = this.callbacksNode) == null || c.dispose();
    }), tt.once("onCreated").then(() => this.onCreated()), tt.on("onReconnected", () => this.onReconnected()), rS(this.displayer) && (tt.on("seekStart", this.onPlayerSeekStart), tt.on("seek", this.onPlayerSeekDone)), tt.on("removeScenes", this.onRemoveScenes), tt.on("setReadonly", this.onReadonlyChanged), this.createRootDirScenesCallback(), qi.setSyncRegisterApp((o) => {
      this.safeUpdateAttributes([xi.Registered, o.kind], o);
    });
  }
  getMemberState() {
    var i;
    return ((i = this.room) == null ? void 0 : i.state.memberState) || { strokeColor: [0, 0, 0] };
  }
  async onRootDirRemoved(i = !0) {
    this.setMainViewScenePath(yM), this.createRootDirScenesCallback();
    for (const [o, c] of this.appProxies.entries())
      c.view && await this.closeApp(o, i);
    this.mainViewProxy.rebind(), tt.emit("rootDirRemoved"), this.updateRootDirRemoving(!1);
  }
  get eventName() {
    return ol(this.displayer) ? "onRoomStateChanged" : "onPlayerStateChanged";
  }
  get attributes() {
    return this.windowManger.attributes;
  }
  get canOperate() {
    return this.windowManger.canOperate;
  }
  get appReadonly() {
    return this.windowManger.appReadonly;
  }
  get room() {
    return ol(this.displayer) ? this.displayer : void 0;
  }
  get mainView() {
    return this.mainViewProxy.view;
  }
  get polling() {
    return this.mainViewProxy.polling;
  }
  set polling(i) {
    this.mainViewProxy.polling = i;
  }
  get focusApp() {
    if (this.store.focus)
      return this.appProxies.get(this.store.focus);
  }
  get extendWrapper() {
    return this.windowManger.extendWrapper;
  }
  get uid() {
    var i;
    return ((i = this.room) == null ? void 0 : i.uid) || "";
  }
  getMainViewSceneDir() {
    const i = this.store.getMainViewScenePath();
    if (i)
      return ub(i);
    throw new Error("[WindowManager]: mainViewSceneDir not found");
  }
  async onCreated() {
    var i;
    if (await this.attributesUpdateCallback(this.attributes.apps), tt.emit("updateManagerRect"), po.on("move", this.onBoxMove), po.on("resize", this.onBoxResize), po.on("focus", this.onBoxFocus), po.on("close", this.onBoxClose), po.on("boxStateChange", this.onBoxStateChange), this.addAppsChangeListener(), this.addAppCloseListener(), this.refresher.add("maximizedBoxes", () => Ss(() => {
      var c;
      const o = this.attributes.maximizedBoxes;
      (c = this.boxManager) == null || c.setMaximized(o);
    })), this.refresher.add("minimizedBoxes", () => Ss(() => {
      const o = this.attributes.minimizedBoxes;
      this.onMinimized(o);
    })), this.refresher.add("mainViewIndex", () => Ss(() => {
      const o = wn(this.attributes, "_mainSceneIndex");
      this.onMainViewIndexChange(o);
    })), this.refresher.add("focusedChange", () => Ss(() => {
      const o = wn(this.attributes, "focus");
      this.onFocusChange(o);
    })), this.refresher.add("registeredChange", () => Ss(() => {
      const o = wn(this.attributes, xi.Registered);
      this.onRegisteredChange(o);
    })), !this.attributes.apps || Object.keys(this.attributes.apps).length === 0) {
      const o = this.store.getMainViewScenePath();
      if (!o)
        return;
      this.resetScenePath(o);
    }
    this.displayerWritableListener(!((i = this.room) != null && i.isWritable)), this.displayer.callbacks.on("onEnableWriteNowChanged", this.displayerWritableListener), this._prevFocused = this.attributes.focus, this.sideEffectManager.add(() => {
      const o = new ZN({
        mainView: () => this.mainViewProxy.view,
        focus: () => this.attributes.focus,
        getAppProxy: (c) => this.appProxies.get(c)
      });
      return () => o.destroy();
    });
  }
  notifyAppsChange(i) {
    (this._appIds.length !== i.length || !this._appIds.every((o) => i.includes(o))) && (this._appIds = i, Dt.emit("appsChange", i));
  }
  async _attributesUpdateCallback(i) {
    if (i && Wt.container) {
      const o = Object.keys(i);
      o.length === 0 && this.appCreateQueue.emitReady();
      const h = YD(
        o.map((m) => ({
          id: m,
          createdAt: i[m].createdAt
        })),
        "createdAt",
        "asc"
      ).map(({ id: m }) => m);
      this.notifyAppsChange(h);
      for (const m of h)
        if (!this.appProxies.has(m) && !this.appStatus.has(m)) {
          const y = i[m];
          try {
            if (!this.attributes[m])
              throw new Error("appAttributes is undefined");
            this.appCreateQueue.push(() => (this.appStatus.set(m, Lb.StartCreate), this.baseInsertApp(
              {
                kind: y.kind,
                options: y.options,
                isDynamicPPT: y.isDynamicPPT
              },
              m,
              !1
            ))), this.focusByAttributes(i);
          } catch (g) {
            console.warn("[WindowManager]: Insert App Error", g);
          }
        }
    }
  }
  refresh() {
    this.attributesUpdateCallback(this.attributes.apps);
  }
  setBoxManager(i) {
    this.boxManager = i;
  }
  resetMaximized() {
    var i;
    (i = this.boxManager) == null || i.setMaximized(this.store.getMaximized() ? this.store.getMaximized() : []);
  }
  resetMinimized() {
    var i;
    (i = this.boxManager) == null || i.setMinimized(this.store.getMinimized() ? this.store.getMinimized() : []);
  }
  bindMainView(i, o) {
    const c = this.mainViewProxy.view;
    c.disableCameraTransform = o, c.divElement = i, c.focusScenePath || this.setMainViewFocusPath(), tt.emit("mainViewMounted"), Dt.emit("onMainViewMounted", c);
  }
  setMainViewFocusPath(i) {
    var c;
    const o = i || this.store.getMainViewScenePath();
    if (o)
      return Pu(this.mainView, o), ((c = this.mainView) == null ? void 0 : c.focusScenePath) === o;
  }
  resetScenePath(i) {
    this.displayer.state.sceneState.scenePath !== i && jb(this.room, i);
  }
  async addApp(i, o) {
    Ca("addApp", i);
    const { appId: c, needFocus: h } = await this.beforeAddApp(i, o), m = await this.baseInsertApp(i, c, !0, h);
    return this.afterAddApp(m), m == null ? void 0 : m.id;
  }
  async beforeAddApp(i, o) {
    var y, g;
    const c = await SN(i.kind);
    this.appStatus.set(c, Lb.StartCreate);
    const h = (y = i.attributes) != null ? y : {};
    this.safeUpdateAttributes([c], h), this.store.setupAppAttributes(i, c, o);
    const m = !((g = this.boxManager) != null && g.minimized);
    return m && this.store.setAppFocus(c, !0), { appId: c, needFocus: m };
  }
  afterAddApp(i) {
    var o;
    if (i && i.box) {
      const c = i.box;
      po.emit("move", {
        appId: i.id,
        x: c == null ? void 0 : c.intrinsicX,
        y: c == null ? void 0 : c.intrinsicY
      }), this.store.updateAppState(i.id, Ji.ZIndex, c.zIndex);
    }
    (o = this.boxManager) != null && o.minimized;
  }
  async closeApp(i, o = !0) {
    const c = this.appProxies.get(i);
    c && c.destroy(!0, o, !1);
  }
  async baseInsertApp(i, o, c, h) {
    if (this.appProxies.has(o)) {
      console.warn("[WindowManager]: app duplicate exists and cannot be created again");
      return;
    }
    const m = new aS(i, this, o, c);
    if (m)
      return await m.baseInsertApp(h), this.appStatus.delete(o), m;
    throw this.appStatus.delete(o), new Error("[WindowManger]: initialize AppProxy failed");
  }
  safeSetAttributes(i) {
    this.windowManger.safeSetAttributes(i);
  }
  safeUpdateAttributes(i, o) {
    this.windowManger.safeUpdateAttributes(i, o);
  }
  async setMainViewScenePath(i) {
    if (this.room) {
      const o = this.displayer.scenePathType(i);
      if (ub(i) !== Cr)
        throw new Error('[WindowManager]: main view scenePath must in root dir "/"');
      if (o === Gv.None)
        throw new Error(`[WindowManager]: ${i} not valid scene`);
      if (o === Gv.Page)
        await this._setMainViewScenePath(i);
      else if (o === Gv.Dir) {
        const h = TN(this.displayer, i);
        h && await this._setMainViewScenePath(h);
      }
    }
  }
  async _setMainViewScenePath(i) {
    this.setMainViewFocusPath(i) && (this.safeSetAttributes({ _mainScenePath: i }), this.store.setMainViewFocusPath(this.mainView), this.updateSceneIndex(), this.dispatchSetMainViewScenePath(i));
  }
  async setMainViewSceneIndex(i) {
    var o;
    if (this.room) {
      if (this.store.getMainViewSceneIndex() === i)
        return;
      const c = (o = this.callbacksNode) == null ? void 0 : o.scenes[i], h = `${Cr}${c}`;
      if (c)
        this.setMainViewFocusPath(h) && (this.store.setMainViewScenePath(h), this.store.setMainViewSceneIndex(i), this.dispatchSetMainViewScenePath(h));
      else
        throw new Error(`[WindowManager]: ${i} not valid index`);
    }
  }
  dispatchSetMainViewScenePath(i) {
    this.dispatchInternalEvent(Xt.SetMainViewScenePath, { nextScenePath: i }), Dt.emit("mainViewScenePathChange", i), jb(this.room, i);
  }
  getAppInitPath(i) {
    var c;
    const o = this.store.getAppAttributes(i);
    if (o)
      return (c = o == null ? void 0 : o.options) == null ? void 0 : c.scenePath;
  }
  safeDispatchMagixEvent(i, o) {
    this.canOperate && this.displayer.dispatchMagixEvent(i, o);
  }
  focusByAttributes(i) {
    var o;
    if (i && Object.keys(i).length === ((o = this.boxManager) == null ? void 0 : o.boxSize)) {
      const c = this.store.focus;
      c && this.boxManager.focusBox({ appId: c });
    }
  }
  async onReconnected() {
    this.attributesUpdateCallback(this.attributes.apps);
    const o = Array.from(this.appProxies.values()).map((c) => c.onReconnected());
    this.mainViewProxy.onReconnect(), await Promise.all(o), this.callbacksNode && this.onSceneChange(this.callbacksNode);
  }
  notifyContainerRectUpdate(i) {
    this.appProxies.forEach((o) => {
      o.appEmitter.emit("containerRectUpdate", i);
    });
  }
  dispatchInternalEvent(i, o) {
    this.safeDispatchMagixEvent(Ob, {
      eventName: i,
      payload: o
    });
  }
  destroy() {
    this.displayer.callbacks.off(this.eventName, this.displayerStateListener), this.displayer.callbacks.off("onEnableWriteNowChanged", this.displayerWritableListener), this.appListeners.removeListeners(), po.clearListeners(), tt.clearListeners(), this.appProxies.size && this.appProxies.forEach((i) => {
      i.destroy(!0, !1, !0);
    }), Dt.clearListeners(), this.sideEffectManager.flushAll(), this._prevFocused = void 0, this._prevSceneIndex = void 0;
  }
}
const GN = (r) => {
  const i = document.createElement("div");
  i.className = "netless-window-manager-playground";
  const o = document.createElement("div");
  o.className = "netless-window-manager-sizer";
  const c = document.createElement("div");
  c.className = "netless-window-manager-wrapper";
  const h = document.createElement("div");
  h.className = "netless-window-manager-main-view-wrapper netless-window-manager-fancy-scrollbar";
  const m = document.createElement("div");
  m.className = "netless-window-manager-main-view-wrapper";
  const y = document.createElement("div");
  y.className = "netless-window-manager-main-view";
  const g = document.createElement("div");
  return g.style.display = "none", i.appendChild(o), i.appendChild(g), o.appendChild(c), m.appendChild(y), h.appendChild(m), c.appendChild(h), r.appendChild(i), Wt.wrapper = c, { playground: i, wrapper: c, sizer: o, mainViewElement: y, mainViewWrapper: m, extendWrapper: g };
}, XN = () => {
  if (aT(KD) < aT(nT))
    throw new DN(nT);
}, Vb = (r, i) => {
  var m;
  const o = (r == null ? void 0 : r.state.roomMembers) || [];
  let c = -1, h;
  for (const y of o)
    ((m = y.payload) == null ? void 0 : m.uid) === i && c < y.memberId && (c = y.memberId, h = y);
  return h;
}, JN = async (r) => {
  let i = r.getInvisiblePlugin(Wt.kind);
  if (i)
    return i;
  let o;
  const c = new Promise((C) => {
    Wt._resolve = o = C;
  });
  let h = !1;
  const m = qN(r);
  !r.isWritable && m && (h = !0, await pM(
    async (C) => {
      Ca(`switching to writable (x${C})`), await r.setWritable(!0);
    },
    { retries: 10, maxTimeout: 5e3 }
  )), r.isWritable ? (Ca("creating InvisiblePlugin..."), r.createInvisiblePlugin(Wt, {}).catch(console.warn)) : (m && console.warn("[WindowManager]: failed to switch to writable"), console.warn("[WindowManager]: waiting for others to create the plugin..."));
  const y = setTimeout(() => {
    console.warn("[WindowManager]: no one called createInvisiblePlugin() after 20 seconds");
  }, 2e4), g = setTimeout(() => {
    throw new Error("[WindowManager]: no one called createInvisiblePlugin() after 60 seconds");
  }, 6e4), x = setInterval(() => {
    i = r.getInvisiblePlugin(Wt.kind), i && (clearTimeout(g), clearTimeout(y), clearInterval(x), o(i), h && r.isWritable && setTimeout(() => r.setWritable(!1).catch(console.warn), 500));
  }, 200);
  return c;
}, qN = (r) => {
  try {
    const i = atob(r.roomToken.slice(12)), o = i.indexOf("&role=");
    return +i[o + 6] < 2;
  } catch (i) {
    return console.error(i), !1;
  }
}, KN = window.ResizeObserver || nN;
class sS {
  constructor(i) {
    this.emitter = i;
  }
  static create(i, o, c, h) {
    const m = new sS(h);
    return m.observePlaygroundSize(i, o, c), m;
  }
  observePlaygroundSize(i, o, c) {
    this.updateSizer(i.getBoundingClientRect(), o, c), this.containerResizeObserver = new KN((h) => {
      var y;
      const m = (y = h[0]) == null ? void 0 : y.contentRect;
      m && (this.updateSizer(m, o, c), this.emitter.emit("playgroundSizeChange", m));
    }), this.disposer = this.emitter.on("containerSizeRatioUpdate", () => {
      const h = i.getBoundingClientRect();
      this.updateSizer(h, o, c), this.emitter.emit("playgroundSizeChange", h);
    }), this.containerResizeObserver.observe(i);
  }
  updateSizer({ width: i, height: o }, c, h) {
    i && o && (o / i > Wt.containerSizeRatio ? (o = i * Wt.containerSizeRatio, c.classList.toggle("netless-window-manager-sizer-horizontal", !0)) : (i = o / Wt.containerSizeRatio, c.classList.toggle("netless-window-manager-sizer-horizontal", !1)), h.style.width = `${i}px`, h.style.height = `${o}px`);
  }
  disconnect() {
    var i;
    (i = this.containerResizeObserver) == null || i.disconnect(), xd(this.disposer) && (this.disposer(), this.disposer = void 0);
  }
}
var EM = { exports: {} };
(function(r) {
  var i = Object.prototype.hasOwnProperty, o = "~";
  function c() {
  }
  Object.create && (c.prototype = /* @__PURE__ */ Object.create(null), new c().__proto__ || (o = !1));
  function h(x, C, I) {
    this.fn = x, this.context = C, this.once = I || !1;
  }
  function m(x, C, I, A, z) {
    if (typeof I != "function")
      throw new TypeError("The listener must be a function");
    var $ = new h(I, A || x, z), V = o ? o + C : C;
    return x._events[V] ? x._events[V].fn ? x._events[V] = [x._events[V], $] : x._events[V].push($) : (x._events[V] = $, x._eventsCount++), x;
  }
  function y(x, C) {
    --x._eventsCount === 0 ? x._events = new c() : delete x._events[C];
  }
  function g() {
    this._events = new c(), this._eventsCount = 0;
  }
  g.prototype.eventNames = function() {
    var C = [], I, A;
    if (this._eventsCount === 0)
      return C;
    for (A in I = this._events)
      i.call(I, A) && C.push(o ? A.slice(1) : A);
    return Object.getOwnPropertySymbols ? C.concat(Object.getOwnPropertySymbols(I)) : C;
  }, g.prototype.listeners = function(C) {
    var I = o ? o + C : C, A = this._events[I];
    if (!A)
      return [];
    if (A.fn)
      return [A.fn];
    for (var z = 0, $ = A.length, V = new Array($); z < $; z++)
      V[z] = A[z].fn;
    return V;
  }, g.prototype.listenerCount = function(C) {
    var I = o ? o + C : C, A = this._events[I];
    return A ? A.fn ? 1 : A.length : 0;
  }, g.prototype.emit = function(C, I, A, z, $, V) {
    var q = o ? o + C : C;
    if (!this._events[q])
      return !1;
    var G = this._events[q], he = arguments.length, se, Z;
    if (G.fn) {
      switch (G.once && this.removeListener(C, G.fn, void 0, !0), he) {
        case 1:
          return G.fn.call(G.context), !0;
        case 2:
          return G.fn.call(G.context, I), !0;
        case 3:
          return G.fn.call(G.context, I, A), !0;
        case 4:
          return G.fn.call(G.context, I, A, z), !0;
        case 5:
          return G.fn.call(G.context, I, A, z, $), !0;
        case 6:
          return G.fn.call(G.context, I, A, z, $, V), !0;
      }
      for (Z = 1, se = new Array(he - 1); Z < he; Z++)
        se[Z - 1] = arguments[Z];
      G.fn.apply(G.context, se);
    } else {
      var ue = G.length, oe;
      for (Z = 0; Z < ue; Z++)
        switch (G[Z].once && this.removeListener(C, G[Z].fn, void 0, !0), he) {
          case 1:
            G[Z].fn.call(G[Z].context);
            break;
          case 2:
            G[Z].fn.call(G[Z].context, I);
            break;
          case 3:
            G[Z].fn.call(G[Z].context, I, A);
            break;
          case 4:
            G[Z].fn.call(G[Z].context, I, A, z);
            break;
          default:
            if (!se)
              for (oe = 1, se = new Array(he - 1); oe < he; oe++)
                se[oe - 1] = arguments[oe];
            G[Z].fn.apply(G[Z].context, se);
        }
    }
    return !0;
  }, g.prototype.on = function(C, I, A) {
    return m(this, C, I, A, !1);
  }, g.prototype.once = function(C, I, A) {
    return m(this, C, I, A, !0);
  }, g.prototype.removeListener = function(C, I, A, z) {
    var $ = o ? o + C : C;
    if (!this._events[$])
      return this;
    if (!I)
      return y(this, $), this;
    var V = this._events[$];
    if (V.fn)
      V.fn === I && (!z || V.once) && (!A || V.context === A) && y(this, $);
    else {
      for (var q = 0, G = [], he = V.length; q < he; q++)
        (V[q].fn !== I || z && !V[q].once || A && V[q].context !== A) && G.push(V[q]);
      G.length ? this._events[$] = G.length === 1 ? G[0] : G : y(this, $);
    }
    return this;
  }, g.prototype.removeAllListeners = function(C) {
    var I;
    return C ? (I = o ? o + C : C, this._events[I] && y(this, I)) : (this._events = new c(), this._eventsCount = 0), this;
  }, g.prototype.off = g.prototype.removeListener, g.prototype.addListener = g.prototype.on, g.prefixed = o, g.EventEmitter = g, r.exports = g;
})(EM);
var ig = EM.exports;
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
var rp = function() {
  return rp = Object.assign || function(i) {
    for (var o, c = 1, h = arguments.length; c < h; c++) {
      o = arguments[c];
      for (var m in o)
        Object.prototype.hasOwnProperty.call(o, m) && (i[m] = o[m]);
    }
    return i;
  }, rp.apply(this, arguments);
};
function oS(r, i) {
  var o = {};
  for (var c in r)
    Object.prototype.hasOwnProperty.call(r, c) && i.indexOf(c) < 0 && (o[c] = r[c]);
  if (r != null && typeof Object.getOwnPropertySymbols == "function")
    for (var h = 0, c = Object.getOwnPropertySymbols(r); h < c.length; h++)
      i.indexOf(c[h]) < 0 && Object.prototype.propertyIsEnumerable.call(r, c[h]) && (o[c[h]] = r[c[h]]);
  return o;
}
var db = 0, IM = typeof window < "u" && window.requestAnimationFrame !== void 0 ? function(r) {
  return window.requestAnimationFrame(r);
} : function(r) {
  var i = Date.now(), o = Math.max(0, 16.7 - (i - db));
  db = i + o, setTimeout(function() {
    return r(db);
  }, o);
}, ek = function(r) {
  var i = [], o = [], c = 0, h = !1, m = 0, y = /* @__PURE__ */ new WeakSet(), g = /* @__PURE__ */ new WeakSet(), x = {
    cancel: function(C) {
      var I = o.indexOf(C);
      y.add(C), I !== -1 && o.splice(I, 1);
    },
    process: function(C) {
      var I;
      if (h = !0, I = [o, i], i = I[0], o = I[1], o.length = 0, c = i.length, c) {
        var A;
        for (m = 0; m < c; m++)
          A = i[m], A(C), g.has(A) === !0 && !y.has(A) && (x.schedule(A), r(!0));
      }
      h = !1;
    },
    schedule: function(C, I, A) {
      I === void 0 && (I = !1), A === void 0 && (A = !1);
      var z = A && h, $ = z ? i : o;
      y.delete(C), I && g.add(C), $.indexOf(C) === -1 && ($.push(C), z && (c = i.length));
    }
  };
  return x;
}, tk = 40, uT = 1 / 60 * 1e3, Xv = !0, ap = !1, Hb = !1, Zh = {
  delta: 0,
  timestamp: 0
}, lS = ["read", "update", "preRender", "render", "postRender"], nk = function(r) {
  return ap = r;
}, AM = /* @__PURE__ */ lS.reduce(function(r, i) {
  return r[i] = ek(nk), r;
}, {}), ik = /* @__PURE__ */ lS.reduce(function(r, i) {
  var o = AM[i];
  return r[i] = function(c, h, m) {
    return h === void 0 && (h = !1), m === void 0 && (m = !1), ap || ak(), o.schedule(c, h, m), c;
  }, r;
}, {}), rk = function(r) {
  return AM[r].process(Zh);
}, RM = function(r) {
  ap = !1, Zh.delta = Xv ? uT : Math.max(Math.min(r - Zh.timestamp, tk), 1), Xv || (uT = Zh.delta), Zh.timestamp = r, Hb = !0, lS.forEach(rk), Hb = !1, ap && (Xv = !1, IM(RM));
}, ak = function() {
  ap = !0, Xv = !0, Hb || IM(RM);
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
var Yr = function() {
  return Yr = Object.assign || function(i) {
    for (var o, c = 1, h = arguments.length; c < h; c++) {
      o = arguments[c];
      for (var m in o)
        Object.prototype.hasOwnProperty.call(o, m) && (i[m] = o[m]);
    }
    return i;
  }, Yr.apply(this, arguments);
}, DM = function(r, i) {
  return function(o) {
    return Math.max(Math.min(o, i), r);
  };
}, Jv = function(r) {
  return r % 1 ? Number(r.toFixed(5)) : r;
}, NM = /^(#[0-9a-f]{3}|#(?:[0-9a-f]{2}){2,4}|(rgb|hsl)a?\((-?[\d\.]+%?[,\s]+){2,3}\s*\/*\s*[\d\.]+%?\))$/i, cg = {
  test: function(r) {
    return typeof r == "number";
  },
  parse: parseFloat,
  transform: function(r) {
    return r;
  }
}, Jh = Yr(Yr({}, cg), { transform: DM(0, 1) }), Uv = Yr(Yr({}, cg), { default: 1 }), uS = function(r) {
  return {
    test: function(i) {
      return typeof i == "string" && i.endsWith(r) && i.split(" ").length === 1;
    },
    parse: parseFloat,
    transform: function(i) {
      return "" + i + r;
    }
  };
}, Du = uS("deg"), qh = uS("%"), ut = uS("px"), cT = Yr(Yr({}, qh), { parse: function(r) {
  return qh.parse(r) / 100;
}, transform: function(r) {
  return qh.transform(r * 100);
} }), sk = function(r) {
  return r.substring(r.indexOf("(") + 1, r.lastIndexOf(")"));
}, ok = DM(0, 255), Wb = function(r) {
  return r.red !== void 0;
}, Fb = function(r) {
  return r.hue !== void 0;
};
function lk(r) {
  return sk(r).replace(/(,|\/)/g, " ").split(/ \s*/);
}
var kM = function(r) {
  return function(i) {
    if (typeof i != "string")
      return i;
    for (var o = {}, c = lk(i), h = 0; h < 4; h++)
      o[r[h]] = c[h] !== void 0 ? parseFloat(c[h]) : 1;
    return o;
  };
}, uk = function(r) {
  var i = r.red, o = r.green, c = r.blue, h = r.alpha, m = h === void 0 ? 1 : h;
  return "rgba(" + i + ", " + o + ", " + c + ", " + m + ")";
}, ck = function(r) {
  var i = r.hue, o = r.saturation, c = r.lightness, h = r.alpha, m = h === void 0 ? 1 : h;
  return "hsla(" + i + ", " + o + ", " + c + ", " + m + ")";
}, fb = Yr(Yr({}, cg), { transform: function(r) {
  return Math.round(ok(r));
} });
function cS(r, i) {
  return r.startsWith(i) && NM.test(r);
}
var qv = {
  test: function(r) {
    return typeof r == "string" ? cS(r, "rgb") : Wb(r);
  },
  parse: kM(["red", "green", "blue", "alpha"]),
  transform: function(r) {
    var i = r.red, o = r.green, c = r.blue, h = r.alpha, m = h === void 0 ? 1 : h;
    return uk({
      red: fb.transform(i),
      green: fb.transform(o),
      blue: fb.transform(c),
      alpha: Jv(Jh.transform(m))
    });
  }
}, hb = {
  test: function(r) {
    return typeof r == "string" ? cS(r, "hsl") : Fb(r);
  },
  parse: kM(["hue", "saturation", "lightness", "alpha"]),
  transform: function(r) {
    var i = r.hue, o = r.saturation, c = r.lightness, h = r.alpha, m = h === void 0 ? 1 : h;
    return ck({
      hue: Math.round(i),
      saturation: qh.transform(Jv(o)),
      lightness: qh.transform(Jv(c)),
      alpha: Jv(Jh.transform(m))
    });
  }
}, dT = Yr(Yr({}, qv), { test: function(r) {
  return typeof r == "string" && cS(r, "#");
}, parse: function(r) {
  var i = "", o = "", c = "";
  return r.length > 4 ? (i = r.substr(1, 2), o = r.substr(3, 2), c = r.substr(5, 2)) : (i = r.substr(1, 1), o = r.substr(2, 1), c = r.substr(3, 1), i += i, o += o, c += c), {
    red: parseInt(i, 16),
    green: parseInt(o, 16),
    blue: parseInt(c, 16),
    alpha: 1
  };
} }), vs = {
  test: function(r) {
    return typeof r == "string" && NM.test(r) || Wb(r) || Fb(r);
  },
  parse: function(r) {
    return qv.test(r) ? qv.parse(r) : hb.test(r) ? hb.parse(r) : dT.test(r) ? dT.parse(r) : r;
  },
  transform: function(r) {
    return Wb(r) ? qv.transform(r) : Fb(r) ? hb.transform(r) : r;
  }
}, dS = function(r) {
  var i = r.onRead, o = r.onRender, c = r.uncachedValues, h = c === void 0 ? /* @__PURE__ */ new Set() : c, m = r.useCache, y = m === void 0 ? !0 : m;
  return function(g) {
    g === void 0 && (g = {});
    var x = oS(g, []), C = {}, I = [], A = !1;
    function z(V, q) {
      V.startsWith("--") && (x.hasCSSVariable = !0);
      var G = C[V];
      C[V] = q, C[V] !== G && (I.indexOf(V) === -1 && I.push(V), A || (A = !0, ik.render($.render)));
    }
    var $ = {
      get: function(V, q) {
        q === void 0 && (q = !1);
        var G = !q && y && !h.has(V) && C[V] !== void 0;
        return G ? C[V] : i(V, x);
      },
      set: function(V, q) {
        if (typeof V == "string")
          z(V, q);
        else
          for (var G in V)
            z(G, V[G]);
        return this;
      },
      render: function(V) {
        return V === void 0 && (V = !1), (A || V === !0) && (o(C, x, I), A = !1, I.length = 0), this;
      }
    };
    return $;
  };
}, dk = /([a-z])([A-Z])/g, fk = "$1-$2", dg = function(r) {
  return r.replace(dk, fk).toLowerCase();
}, _M = /* @__PURE__ */ new Map(), fS = /* @__PURE__ */ new Map(), PM = ["Webkit", "Moz", "O", "ms", ""], hk = PM.length, pk = typeof document < "u", pb, zM = function(r, i) {
  return fS.set(r, dg(i));
}, mk = function(r) {
  pb = pb || document.createElement("div");
  for (var i = 0; i < hk; i++) {
    var o = PM[i], c = o === "", h = c ? r : o + r.charAt(0).toUpperCase() + r.slice(1);
    if (h in pb.style || c) {
      if (c && r === "clipPath" && fS.has(r))
        return;
      _M.set(r, h), zM(r, (c ? "" : "-") + dg(h));
    }
  }
}, vk = function(r) {
  return zM(r, r);
}, OM = function(r, i) {
  i === void 0 && (i = !1);
  var o = i ? fS : _M;
  return o.has(r) || (pk ? mk(r) : vk(r)), o.get(r) || r;
}, gk = ["", "X", "Y", "Z"], yk = ["translate", "scale", "rotate", "skew", "transformPerspective"], $b = /* @__PURE__ */ yk.reduce(function(r, i) {
  return gk.reduce(function(o, c) {
    return o.push(i + c), o;
  }, r);
}, ["x", "y", "z"]), wk = /* @__PURE__ */ $b.reduce(function(r, i) {
  return r[i] = !0, r;
}, {});
function hS(r) {
  return wk[r] === !0;
}
function bk(r, i) {
  return $b.indexOf(r) - $b.indexOf(i);
}
var Sk = /* @__PURE__ */ new Set(["originX", "originY", "originZ"]);
function xk(r) {
  return Sk.has(r);
}
var fT = /* @__PURE__ */ rp(/* @__PURE__ */ rp({}, cg), { transform: Math.round }), Ck = {
  color: vs,
  backgroundColor: vs,
  outlineColor: vs,
  fill: vs,
  stroke: vs,
  borderColor: vs,
  borderTopColor: vs,
  borderRightColor: vs,
  borderBottomColor: vs,
  borderLeftColor: vs,
  borderWidth: ut,
  borderTopWidth: ut,
  borderRightWidth: ut,
  borderBottomWidth: ut,
  borderLeftWidth: ut,
  borderRadius: ut,
  radius: ut,
  borderTopLeftRadius: ut,
  borderTopRightRadius: ut,
  borderBottomRightRadius: ut,
  borderBottomLeftRadius: ut,
  width: ut,
  maxWidth: ut,
  height: ut,
  maxHeight: ut,
  size: ut,
  top: ut,
  right: ut,
  bottom: ut,
  left: ut,
  padding: ut,
  paddingTop: ut,
  paddingRight: ut,
  paddingBottom: ut,
  paddingLeft: ut,
  margin: ut,
  marginTop: ut,
  marginRight: ut,
  marginBottom: ut,
  marginLeft: ut,
  rotate: Du,
  rotateX: Du,
  rotateY: Du,
  rotateZ: Du,
  scale: Uv,
  scaleX: Uv,
  scaleY: Uv,
  scaleZ: Uv,
  skew: Du,
  skewX: Du,
  skewY: Du,
  distance: ut,
  translateX: ut,
  translateY: ut,
  translateZ: ut,
  x: ut,
  y: ut,
  z: ut,
  perspective: ut,
  opacity: Jh,
  originX: cT,
  originY: cT,
  originZ: ut,
  zIndex: fT,
  fillOpacity: Jh,
  strokeOpacity: Jh,
  numOctaves: fT
}, pS = function(r) {
  return Ck[r];
}, Tk = function(r, i) {
  return i && typeof r == "number" ? i.transform(r) : r;
}, Kh = "scrollLeft", ep = "scrollTop", LM = /* @__PURE__ */ new Set([Kh, ep]), Mk = /* @__PURE__ */ new Set([Kh, ep, "transform"]), Ek = {
  x: "translateX",
  y: "translateY",
  z: "translateZ"
};
function BM(r) {
  return typeof r == "function";
}
function Ik(r, i, o, c, h, m) {
  m === void 0 && (m = !0);
  var y = "", g = !1;
  o.sort(bk);
  for (var x = o.length, C = 0; C < x; C++) {
    var I = o[C];
    y += (Ek[I] || I) + "(" + i[I] + ") ", g = I === "z" ? !0 : g;
  }
  return !g && h ? y += "translateZ(0)" : y = y.trim(), BM(r.transform) ? y = r.transform(i, c ? "" : y) : m && c && (y = "none"), y;
}
function Ak(r, i, o, c, h, m, y, g) {
  i === void 0 && (i = !0), o === void 0 && (o = {}), c === void 0 && (c = {}), h === void 0 && (h = {}), m === void 0 && (m = []), y === void 0 && (y = !1), g === void 0 && (g = !0);
  var x = !0, C = !1, I = !1;
  for (var A in r) {
    var z = r[A], $ = pS(A), V = Tk(z, $);
    hS(A) ? (C = !0, c[A] = V, m.push(A), x && ($.default && z !== $.default || !$.default && z !== 0) && (x = !1)) : xk(A) ? (h[A] = V, I = !0) : (!Mk.has(A) || !BM(V)) && (o[OM(A, y)] = V);
  }
  return (C || typeof r.transform == "function") && (o.transform = Ik(r, c, m, x, i, g)), I && (o.transformOrigin = (h.originX || "50%") + " " + (h.originY || "50%") + " " + (h.originZ || 0)), o;
}
function mS(r) {
  var i = r === void 0 ? {} : r, o = i.enableHardwareAcceleration, c = o === void 0 ? !0 : o, h = i.isDashCase, m = h === void 0 ? !0 : h, y = i.allowTransformNone, g = y === void 0 ? !0 : y, x = {}, C = {}, I = {}, A = [];
  return function(z) {
    return A.length = 0, Ak(z, c, x, C, I, A, m, g), x;
  };
}
function Rk(r, i) {
  var o = i.element, c = i.preparseOutput, h = pS(r);
  if (hS(r))
    return h && h.default || 0;
  if (LM.has(r))
    return o[r];
  var m = window.getComputedStyle(o, null).getPropertyValue(OM(r, !0)) || 0;
  return c && h && h.test(m) && h.parse ? h.parse(m) : m;
}
function Dk(r, i, o) {
  var c = i.element, h = i.buildStyles, m = i.hasCSSVariable;
  if (Object.assign(c.style, h(r)), m)
    for (var y = o.length, g = 0; g < y; g++) {
      var x = o[g];
      x.startsWith("--") && c.style.setProperty(x, r[x]);
    }
  o.indexOf(Kh) !== -1 && (c[Kh] = r[Kh]), o.indexOf(ep) !== -1 && (c[ep] = r[ep]);
}
var Nk = /* @__PURE__ */ dS({
  onRead: Rk,
  onRender: Dk,
  uncachedValues: LM
});
function kk(r, i) {
  i === void 0 && (i = {});
  var o = i.enableHardwareAcceleration, c = i.allowTransformNone, h = oS(i, ["enableHardwareAcceleration", "allowTransformNone"]);
  return Nk(rp({ element: r, buildStyles: mS({
    enableHardwareAcceleration: o,
    allowTransformNone: c
  }), preparseOutput: !0 }, h));
}
var jM = /* @__PURE__ */ new Set(["baseFrequency", "diffuseConstant", "kernelMatrix", "kernelUnitLength", "keySplines", "keyTimes", "limitingConeAngle", "markerHeight", "markerWidth", "numOctaves", "targetX", "targetY", "surfaceScale", "specularConstant", "specularExponent", "stdDeviation", "tableValues"]), hT = 0.5, UM = function() {
  return {
    style: {}
  };
}, mb = function(r, i) {
  return ut.transform(r * i);
}, _k = { x: 0, y: 0, width: 0, height: 0 };
function pT(r, i, o) {
  return typeof r == "string" ? r : ut.transform(i + o * r);
}
function Pk(r, i, o) {
  return pT(i, r.x, r.width) + " " + pT(o, r.y, r.height);
}
var VM = {
  enableHardwareAcceleration: !1,
  isDashCase: !1
};
function zk(r, i, o, c, h, m) {
  i === void 0 && (i = _k), c === void 0 && (c = mS(VM)), h === void 0 && (h = UM()), m === void 0 && (m = !0);
  var y = r.attrX, g = r.attrY, x = r.originX, C = r.originY, I = r.pathLength, A = r.pathSpacing, z = A === void 0 ? 1 : A, $ = r.pathOffset, V = $ === void 0 ? 0 : $, q = oS(r, ["attrX", "attrY", "originX", "originY", "pathLength", "pathSpacing", "pathOffset"]), G = c(q);
  for (var he in G)
    if (he === "transform")
      h.style.transform = G[he];
    else {
      var se = m && !jM.has(he) ? dg(he) : he;
      h[se] = G[he];
    }
  return (x !== void 0 || C !== void 0 || G.transform) && (h.style.transformOrigin = Pk(i, x !== void 0 ? x : hT, C !== void 0 ? C : hT)), y !== void 0 && (h.x = y), g !== void 0 && (h.y = g), o !== void 0 && I !== void 0 && (h[m ? "stroke-dashoffset" : "strokeDashoffset"] = mb(-V, o), h[m ? "stroke-dasharray" : "strokeDasharray"] = mb(I, o) + " " + mb(z, o)), h;
}
function Ok(r, i, o) {
  o === void 0 && (o = !0);
  var c = UM(), h = mS(VM);
  return function(m) {
    return zk(m, r, i, h, c, o);
  };
}
var Lk = function(r) {
  return typeof r.getBBox == "function" ? r.getBBox() : r.getBoundingClientRect();
}, Bk = function(r) {
  try {
    return Lk(r);
  } catch {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
}, jk = function(r) {
  return r.tagName === "path";
}, Uk = /* @__PURE__ */ dS({
  onRead: function(r, i) {
    var o = i.element;
    if (r = jM.has(r) ? r : dg(r), hS(r)) {
      var c = pS(r);
      return c && c.default || 0;
    } else
      return o.getAttribute(r);
  },
  onRender: function(r, i) {
    var o = i.element, c = i.buildAttrs, h = c(r);
    for (var m in h)
      m === "style" ? Object.assign(o.style, h.style) : o.setAttribute(m, h[m]);
  }
}), Vk = function(r) {
  var i = Bk(r), o = jk(r) && r.getTotalLength ? r.getTotalLength() : void 0;
  return Uk({
    element: r,
    buildAttrs: Ok(i, o)
  });
}, Hk = /* @__PURE__ */ dS({
  useCache: !1,
  onRead: function(r) {
    return r === "scrollTop" ? window.pageYOffset : window.pageXOffset;
  },
  onRender: function(r) {
    var i = r.scrollTop, o = i === void 0 ? 0 : i, c = r.scrollLeft, h = c === void 0 ? 0 : c;
    return window.scrollTo(h, o);
  }
}), Qb = /* @__PURE__ */ new WeakMap(), Wk = function(r) {
  return r instanceof HTMLElement || typeof r.click == "function";
}, Fk = function(r) {
  return r instanceof SVGElement || "ownerSVGElement" in r;
}, $k = function(r, i) {
  var o;
  return r === window ? o = Hk(r) : Wk(r) ? o = kk(r, i) : Fk(r) && (o = Vk(r)), Qb.set(r, o), o;
}, Qk = function(r, i) {
  return Qb.has(r) ? Qb.get(r) : $k(r, i);
};
function Zk(r, i) {
  var o = typeof r == "string" ? document.querySelector(r) : r;
  return Qk(o, i);
}
var ys = function(i, o, c, h) {
  var m = c ? c.call(h, i, o) : void 0;
  if (m !== void 0)
    return !!m;
  if (i === o)
    return !0;
  if (typeof i != "object" || !i || typeof o != "object" || !o)
    return !1;
  var y = Object.keys(i), g = Object.keys(o);
  if (y.length !== g.length)
    return !1;
  for (var x = Object.prototype.hasOwnProperty.bind(o), C = 0; C < y.length; C++) {
    var I = y[C];
    if (!x(I))
      return !1;
    var A = i[I], z = o[I];
    if (m = c ? c.call(h, A, z, I) : void 0, m === !1 || m === void 0 && A !== z)
      return !1;
  }
  return !0;
};
const HM = "!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", Yk = HM.length, mT = Array(20), Td = () => {
  for (let r = 0; r < 20; r++)
    mT[r] = HM.charAt(Math.random() * Yk);
  return mT.join("");
};
class sp {
  constructor() {
    this.disposers = /* @__PURE__ */ new Map();
  }
  add(i, o = Td()) {
    return this.flush(o), this.disposers.set(o, i()), o;
  }
  addDisposer(i, o = Td()) {
    return this.flush(o), this.disposers.set(o, i), o;
  }
  addEventListener(i, o, c, h, m = Td()) {
    return this.add(() => (i.addEventListener(o, c, h), () => i.removeEventListener(o, c, h)), m), m;
  }
  setTimeout(i, o, c = Td()) {
    return this.add(() => {
      const h = window.setTimeout(() => {
        this.remove(c), i();
      }, o);
      return () => window.clearTimeout(h);
    }, c);
  }
  setInterval(i, o, c = Td()) {
    return this.add(() => {
      const h = window.setInterval(i, o);
      return () => window.clearInterval(h);
    }, c);
  }
  remove(i) {
    const o = this.disposers.get(i);
    return this.disposers.delete(i), o;
  }
  flush(i) {
    const o = this.remove(i);
    if (o)
      try {
        o();
      } catch (c) {
        console.error(c);
      }
  }
  flushAll() {
    this.disposers.forEach((i) => {
      try {
        i();
      } catch (o) {
        console.error(o);
      }
    }), this.disposers.clear();
  }
}
var Gk = Object.defineProperty, vb = (typeof require < "u" && require, (r, i, o) => (((c, h, m) => {
  h in c ? Gk(c, h, { enumerable: !0, configurable: !0, writable: !0, value: m }) : c[h] = m;
})(r, typeof i != "symbol" ? i + "" : i, o), o));
class cp {
  constructor(i, o) {
    vb(this, "_value"), vb(this, "_beforeDestroys"), vb(this, "_subscribers"), this._value = i, o && (this.compare = o);
  }
  get value() {
    return this._value;
  }
  setValue(i, o) {
    if (!this.compare(i, this._value)) {
      const c = this._value;
      this._value = i, this._subscribers && this._subscribers.forEach((h) => h(i, c, o));
    }
  }
  reaction(i) {
    return this._subscribers || (this._subscribers = /* @__PURE__ */ new Set()), this._subscribers.add(i), () => {
      this._subscribers && this._subscribers.delete(i);
    };
  }
  subscribe(i, o) {
    const c = this.reaction(i);
    return i(this._value, void 0, o), c;
  }
  derive(i, o, c) {
    const h = new cp(i(this.value, void 0, c), o), m = this.reaction((y, g, x) => {
      h.setValue(i(y, g, x));
    });
    return h.addBeforeDestroy(m), h;
  }
  destroy() {
    this._beforeDestroys && (this._beforeDestroys.forEach((i) => i()), this._beforeDestroys.clear()), this._subscribers && this._subscribers.clear();
  }
  addBeforeDestroy(i) {
    return this._beforeDestroys || (this._beforeDestroys = /* @__PURE__ */ new Set()), this._beforeDestroys.add(i), () => {
      this._beforeDestroys && this._beforeDestroys.delete(i);
    };
  }
  compare(i, o) {
    return i === o;
  }
}
function Xk(r, i, o, c) {
  let h = r.map((y) => y.value);
  const m = new cp(i(h, void 0, c), o);
  return r.forEach((y, g) => {
    const x = y.reaction((C, I, A) => {
      const z = h.slice();
      z[g] = C;
      const $ = h;
      h = z, m.setValue(i(z, $, A), A);
    });
    m.addBeforeDestroy(x);
  }), m;
}
function WM(r, i) {
  Object.keys(i).forEach((o) => {
    Jk(r, o, i[o]);
  });
}
function Jk(r, i, o) {
  var c;
  return Object.defineProperties(r, { [i]: { get: () => o.value }, [`_${i}$`]: { value: o }, [`set${c = i, c[0].toUpperCase() + c.slice(1)}`]: { value: (h, m) => o.setValue(h, m) } }), r;
}
function vS(r) {
  const i = (o) => {
    const c = r.addDisposer(() => {
      o.destroy();
    });
    return o.addBeforeDestroy(() => {
      r.remove(c);
    }), o;
  };
  return { bindSideEffect: i, combine: (o, c, h, m) => i(Xk(o, c, h, m)), createVal: (o, c) => i(new cp(o, c)) };
}
var gS = /* @__PURE__ */ ((r) => (r.Light = "light", r.Dark = "dark", r.Auto = "auto", r))(gS || {}), nn = /* @__PURE__ */ ((r) => (r.Normal = "normal", r.Minimized = "minimized", r.Maximized = "maximized", r))(nn || {}), Xn = /* @__PURE__ */ ((r) => (r.DarkMode = "dark_mode", r.PrefersColorScheme = "prefers_color_scheme", r.Close = "close", r.Focus = "focus", r.Blur = "blur", r.Move = "move", r.Resize = "resize", r.IntrinsicMove = "intrinsic_move", r.IntrinsicResize = "intrinsic_resize", r.VisualResize = "visual_resize", r.ZIndex = "z_index", r.State = "state", r.Minimized = "minimized", r.Maximized = "maximized", r.Readonly = "readonly", r.Destroyed = "destroyed", r))(Xn || {}), Ki = /* @__PURE__ */ ((r) => (r.Close = "close", r.Maximize = "maximize", r.Minimize = "minimize", r))(Ki || {}), ws = /* @__PURE__ */ ((r) => (r.North = "n", r.South = "s", r.West = "w", r.East = "e", r.NorthWest = "nw", r.NorthEast = "ne", r.SouthEast = "se", r.SouthWest = "sw", r))(ws || {});
const gb = "dh";
function Xi(r, i, o) {
  return Math.min(Math.max(r, i), o);
}
function Ed(r) {
  r.stopPropagation(), r.cancelable && r.preventDefault();
}
let qk = 1;
function Kk() {
  return `New Box ${qk++}`;
}
function e_(r) {
  return Boolean(r);
}
function Vv(r) {
  return !r;
}
function vT(r) {
  return r.reduce((i, o) => (i.includes(o) || i.push(o), i), []);
}
function Vh(r, i) {
  const o = r.indexOf(i);
  if (o < 0)
    return r;
  const c = [...r];
  return c.splice(o, 1), c;
}
function t_(r, i, o) {
  const c = new Set(i), h = new Set(o);
  return r.filter((m) => !c.has(m) && !h.has(m));
}
function gT(r) {
  return r.touches ? r.touches[0] : r;
}
function n_() {
  return Date.now().toString().slice(6) + Math.random().toString().slice(2, 8);
}
class FM {
  constructor({
    readonly: i = !1,
    title: o,
    buttons: c,
    onEvent: h,
    onDragStart: m,
    namespace: y = "telebox",
    state: g = nn.Normal
  } = {}) {
    this.$btns = [], this.sideEffect = new sp(), this.lastTitleBarClick = {
      timestamp: 0,
      clientX: -100,
      clientY: -100
    }, this.handleTitleBarClick = (x) => {
      var C;
      if (this.readonly || x.button !== 0 || (C = x.target.dataset) != null && C.teleTitleBarNoDblClick)
        return;
      Ed(x);
      const I = Date.now();
      I - this.lastTitleBarClick.timestamp <= 500 ? Math.abs(x.clientX - this.lastTitleBarClick.clientX) <= 5 && Math.abs(x.clientY - this.lastTitleBarClick.clientY) <= 5 && this.onEvent && this.onEvent({ type: Ki.Maximize }) : this.onDragStart && this.onDragStart(x), this.lastTitleBarClick.timestamp = I, this.lastTitleBarClick.clientX = x.clientX, this.lastTitleBarClick.clientY = x.clientY;
    }, this.lastTitleBarTouch = {
      timestamp: 0,
      clientX: -100,
      clientY: -100
    }, this.handleTitleBarTouch = (x) => {
      var C;
      if (this.readonly || (C = x.target.dataset) != null && C.teleTitleBarNoDblClick)
        return;
      Ed(x);
      const I = Date.now(), {
        clientX: A = this.lastTitleBarTouch.clientX + 100,
        clientY: z = this.lastTitleBarTouch.clientY + 100
      } = x.touches[0] || {};
      I - this.lastTitleBarTouch.timestamp <= 500 ? Math.abs(A - this.lastTitleBarTouch.clientX) <= 10 && Math.abs(z - this.lastTitleBarTouch.clientY) <= 10 && this.onEvent && this.onEvent({ type: Ki.Maximize }) : this.onDragStart && this.onDragStart(x), this.lastTitleBarTouch.timestamp = I, this.lastTitleBarTouch.clientX = A, this.lastTitleBarTouch.clientY = z;
    }, this.readonly = i, this.onEvent = h, this.onDragStart = m, this.namespace = y, this.title = o, this.state = g, this.buttons = c || [
      {
        type: Ki.Minimize,
        iconClassName: this.wrapClassName("titlebar-icon-minimize")
      },
      {
        type: Ki.Maximize,
        iconClassName: this.wrapClassName("titlebar-icon-maximize"),
        isActive: (x) => x === nn.Maximized
      },
      {
        type: Ki.Close,
        iconClassName: this.wrapClassName("titlebar-icon-close")
      }
    ], this.$dragArea = this.renderDragArea();
  }
  setTitle(i) {
    this.title = i, this.$title && (this.$title.textContent = i, this.$title.title = i);
  }
  setState(i) {
    this.state !== i && (this.state = i, this.buttons.forEach((o, c) => {
      o.isActive && this.$btns[c].classList.toggle(
        "is-active",
        o.isActive(i)
      );
    }));
  }
  setReadonly(i) {
    this.readonly !== i && (this.readonly = i);
  }
  render() {
    if (!this.$titleBar) {
      this.$titleBar = document.createElement("div"), this.$titleBar.className = this.wrapClassName("titlebar");
      const i = document.createElement("div");
      i.className = this.wrapClassName("title-area"), i.dataset.teleBoxHandle = gb, this.$title = document.createElement("h1"), this.$title.className = this.wrapClassName("title"), this.$title.dataset.teleBoxHandle = gb, this.title && (this.$title.textContent = this.title, this.$title.title = this.title), i.appendChild(this.$title), i.appendChild(this.$dragArea);
      const o = document.createElement("div");
      o.className = this.wrapClassName("titlebar-btns"), this.buttons.forEach(({ iconClassName: c, isActive: h }, m) => {
        const y = String(m), g = document.createElement("button");
        g.className = `${this.wrapClassName(
          "titlebar-btn"
        )} ${c}`, g.dataset.teleTitleBarBtnIndex = y, g.dataset.teleTitleBarNoDblClick = "true", h && g.classList.toggle("is-active", h(this.state)), this.$btns.push(g), o.appendChild(g);
      }), this.sideEffect.addEventListener(
        o,
        "click",
        (c) => {
          var h;
          if (this.readonly)
            return;
          const m = c.target, y = Number(
            (h = m.dataset) == null ? void 0 : h.teleTitleBarBtnIndex
          );
          if (!Number.isNaN(y) && y < this.buttons.length) {
            Ed(c);
            const g = this.buttons[y];
            this.onEvent && this.onEvent({
              type: g.type,
              value: g.value
            });
          }
        }
      ), this.$titleBar.appendChild(i), this.$titleBar.appendChild(o);
    }
    return this.$titleBar;
  }
  renderDragArea() {
    const i = document.createElement("div");
    return i.className = this.wrapClassName("drag-area"), i.dataset.teleBoxHandle = gb, this.sideEffect.addEventListener(
      i,
      "mousedown",
      this.handleTitleBarClick
    ), this.sideEffect.addEventListener(
      i,
      "touchstart",
      this.handleTitleBarTouch,
      { passive: !0 }
    ), i;
  }
  dragHandle() {
    return this.$titleBar;
  }
  wrapClassName(i) {
    return `${this.namespace}-${i}`;
  }
  destroy() {
    this.sideEffect.flushAll(), this.$titleBar && (this.$titleBar = void 0, this.$title = void 0, this.$btns.length = 0, this.onDragStart = void 0, this.onEvent = void 0);
  }
}
class i_ {
  constructor({
    id: i = n_(),
    title: o = Kk(),
    prefersColorScheme: c = gS.Light,
    darkMode: h,
    visible: m = !0,
    width: y = 0.5,
    height: g = 0.5,
    minWidth: x = 0,
    minHeight: C = 0,
    x: I = 0.1,
    y: A = 0.1,
    minimized: z = !1,
    maximized: $ = !1,
    readonly: V = !1,
    resizable: q = !0,
    draggable: G = !0,
    fence: he = !0,
    fixRatio: se = !1,
    focus: Z = !1,
    zIndex: ue = 100,
    namespace: oe = "telebox",
    titleBar: Ne,
    content: Fe,
    footer: Pe,
    styles: Y,
    containerRect: fe = {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight
    },
    collectorRect: be,
    fixed: ie = !1,
    addObserver: ct
  } = {}) {
    this._renderSideEffect = new sp(), this.handleTrackStart = (ke) => {
      var st;
      return (st = this._handleTrackStart) == null ? void 0 : st.call(this, ke);
    }, this._sideEffect = new sp(), this._valSideEffectBinder = vS(this._sideEffect);
    const { combine: Oe, createVal: ce } = this._valSideEffectBinder;
    this.addObserver = ct || yb, this.id = i, this.namespace = oe, this.events = new ig(), this._delegateEvents = new ig(), this.scale = ce(1), this.fixed = ie;
    const Qe = ce(c);
    Qe.reaction((ke, st, He) => {
      He || this.events.emit(Xn.PrefersColorScheme, ke);
    });
    const Se = ce(Boolean(h));
    h == null && Qe.subscribe((ke, st, He) => {
      this._sideEffect.add(() => {
        if (ke === "auto") {
          const jt = window.matchMedia("(prefers-color-scheme: dark)");
          if (jt) {
            Se.setValue(jt.matches, He);
            const Sn = (ci) => {
              Se.setValue(ci.matches, He);
            };
            return jt.addListener(Sn), () => jt.removeListener(Sn);
          } else
            return yb;
        } else
          return Se.setValue(ke === "dark", He), yb;
      }, "prefers-color-scheme");
    }), Se.reaction((ke, st, He) => {
      He || this.events.emit(Xn.DarkMode, ke);
    });
    const Ve = ce(fe, ys), Re = ce(be, ys), $e = ce(o);
    $e.reaction((ke, st, He) => {
      He || this.titleBar.setTitle(ke);
    });
    const Tt = ce(m);
    Tt.reaction((ke, st, He) => {
      !He && !ke && this.events.emit(Xn.Close);
    });
    const Bt = ce(V);
    Bt.reaction((ke, st, He) => {
      He || this.events.emit(Xn.Readonly, ke);
    });
    const Ge = ce(q), re = ce(G), D = ce(he), B = ce(se), ee = ce(ue);
    ee.reaction((ke, st, He) => {
      He || this.events.emit(Xn.ZIndex, ke);
    });
    const Ce = ce(Z);
    Ce.reaction((ke, st, He) => {
      He || this.events.emit(ke ? Xn.Focus : Xn.Blur);
    });
    const ge = ce(z);
    ge.reaction((ke, st, He) => {
      He || this.events.emit(Xn.Minimized, ke);
    });
    const it = ce($);
    it.reaction((ke, st, He) => {
      He || this.events.emit(Xn.Maximized, ke);
    });
    const Xe = Oe(
      [ge, it],
      ([ke, st]) => ke ? nn.Minimized : st ? nn.Maximized : nn.Normal
    );
    Xe.reaction((ke, st, He) => {
      He || this.events.emit(Xn.State, ke);
    });
    const Be = ce(
      {
        width: Xi(x, 0, 1),
        height: Xi(C, 0, 1)
      },
      ys
    ), dt = ce(
      {
        width: Xi(y, Be.value.width, 1),
        height: Xi(g, Be.value.height, 1)
      },
      ys
    );
    Be.reaction((ke, st, He) => {
      dt.setValue(
        {
          width: Xi(y, ke.width, 1),
          height: Xi(g, ke.height, 1)
        },
        He
      );
    }), dt.reaction((ke, st, He) => {
      He || this.events.emit(Xn.IntrinsicResize, ke);
    });
    const gt = Oe(
      [dt, it],
      ([ke, st]) => st ? { width: 1, height: 1 } : ke,
      ys
    );
    gt.reaction((ke, st, He) => {
      He || this.events.emit(Xn.Resize, ke);
    });
    const Zt = Oe(
      [gt, ge, Ve, Re],
      ([ke, st, He, jt]) => st && jt ? {
        width: jt.width / ke.width / He.width,
        height: jt.height / ke.height / He.height
      } : ke,
      ys
    );
    Zt.reaction((ke, st, He) => {
      He || this.events.emit(Xn.VisualResize, ke);
    });
    const Mt = ce({ x: Xi(I, 0, 1), y: Xi(A, 0, 1) }, ys);
    Mt.reaction((ke, st, He) => {
      He || this.events.emit(Xn.IntrinsicMove, ke);
    });
    const bn = Oe(
      [
        Mt,
        dt,
        Ve,
        Re,
        ge,
        it
      ],
      ([
        ke,
        st,
        He,
        jt,
        Sn,
        ci
      ]) => Sn && jt ? ci ? {
        x: (jt.x + jt.width / 2) / He.width - 1 / 2,
        y: (jt.y + jt.height / 2) / He.height - 1 / 2
      } : {
        x: (jt.x + jt.width / 2) / He.width - st.width / 2,
        y: (jt.y + jt.height / 2) / He.height - st.height / 2
      } : ci ? { x: 0, y: 0 } : ke,
      ys
    );
    bn.reaction((ke, st, He) => {
      He || this.events.emit(Xn.Move, ke);
    }), this.titleBar = Ne || new FM({
      readonly: Bt.value,
      title: $e.value,
      namespace: this.namespace,
      onDragStart: (ke) => {
        var st;
        return (st = this._handleTrackStart) == null ? void 0 : st.call(this, ke);
      },
      onEvent: (ke) => {
        if (this._delegateEvents.listeners.length > 0)
          this._delegateEvents.emit(ke.type);
        else
          switch (ke.type) {
            case Ki.Maximize: {
              it.setValue(!it.value);
              break;
            }
            case Ki.Minimize: {
              ge.setValue(!0);
              break;
            }
            case Ki.Close: {
              Tt.setValue(!1);
              break;
            }
            default: {
              console.error("Unsupported titleBar event:", ke);
              break;
            }
          }
      }
    }), Bt.reaction((ke) => {
      this.titleBar.setReadonly(ke);
    });
    const Ft = ce(Fe), Ui = ce(Pe), Ci = ce(Y);
    WM(this, {
      prefersColorScheme: Qe,
      darkMode: Se,
      containerRect: Ve,
      collectorRect: Re,
      title: $e,
      visible: Tt,
      readonly: Bt,
      resizable: Ge,
      draggable: re,
      fence: D,
      fixRatio: B,
      focus: Ce,
      zIndex: ee,
      minimized: ge,
      maximized: it,
      $userContent: Ft,
      $userFooter: Ui,
      $userStyles: Ci
    }), this._state$ = Xe, this._minSize$ = Be, this._size$ = gt, this._intrinsicSize$ = dt, this._visualSize$ = Zt, this._coord$ = bn, this._intrinsicCoord$ = Mt, this.fixRatio && this.transform(
      bn.value.x,
      bn.value.y,
      gt.value.width,
      gt.value.height,
      !0
    ), this.$box = this.render();
  }
  get darkMode() {
    return this._darkMode$.value;
  }
  get state() {
    return this._state$.value;
  }
  setState(i, o = !1) {
    switch (i) {
      case nn.Maximized: {
        this.setMinimized(!1, o), this.setMaximized(!0, o);
        break;
      }
      case nn.Minimized: {
        this.setMinimized(!0, o), this.setMaximized(!1, o);
        break;
      }
      default: {
        this.setMinimized(!1, o), this.setMaximized(!1, o);
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
  setMinWidth(i, o = !1) {
    return this._minSize$.setValue({ width: i, height: this.minHeight }, o), this;
  }
  setMinHeight(i, o = !1) {
    return this._minSize$.setValue({ width: this.minWidth, height: i }, o), this;
  }
  get intrinsicWidth() {
    return this._intrinsicSize$.value.width;
  }
  get intrinsicHeight() {
    return this._intrinsicSize$.value.height;
  }
  resize(i, o, c = !1) {
    return this._intrinsicSize$.setValue({ width: i, height: o }, c), this;
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
  move(i, o, c = !1) {
    return this.fixed ? this : (this._intrinsicCoord$.setValue({ x: i, y: o }, c), this);
  }
  get x() {
    return this._coord$.value.x;
  }
  get y() {
    return this._coord$.value.y;
  }
  transform(i, o, c, h, m = !1) {
    if (this.fixRatio) {
      const y = this.intrinsicHeight / this.intrinsicWidth * c;
      o !== this.intrinsicY && (o -= y - h), h = y;
    }
    return o < 0 && (o = 0, h > this.intrinsicHeight && (h = this.intrinsicHeight)), this.fixed || this._intrinsicCoord$.setValue(
      {
        x: c >= this.minWidth ? i : this.intrinsicX,
        y: h >= this.minHeight ? o : this.intrinsicY
      },
      m
    ), this._intrinsicSize$.setValue(
      {
        width: Xi(c, this.minWidth, 1),
        height: Xi(h, this.minHeight, 1)
      },
      m
    ), this;
  }
  mount(i) {
    return i.appendChild(this.render()), this;
  }
  unmount() {
    return this.$box && this.$box.remove(), this;
  }
  mountContent(i) {
    return this.set$userContent(i), this;
  }
  unmountContent() {
    return this.set$userContent(void 0), this;
  }
  mountFooter(i) {
    return this.set$userFooter(i), this;
  }
  unmountFooter() {
    return this.set$userFooter(void 0), this;
  }
  getUserStyles() {
    return this.$userStyles;
  }
  mountStyles(i) {
    let o;
    return typeof i == "string" ? (o = document.createElement("style"), o.textContent = i) : o = i, this.set$userStyles(o), this;
  }
  unmountStyles() {
    return this.set$userStyles(void 0), this;
  }
  setFixed(i) {
    this.fixed = i;
  }
  render(i) {
    if (i) {
      if (i === this.$box)
        return this.$box;
      this.$box = i;
    } else {
      if (this.$box)
        return this.$box;
      this.$box = document.createElement("div");
    }
    this._renderSideEffect.flushAll(), this.$box.classList.add(this.wrapClassName("box"));
    const o = (A, z, $, V = e_) => this._renderSideEffect.add(() => {
      const q = this.wrapClassName($);
      return z.subscribe((G) => {
        A.classList.toggle(q, V(G));
      });
    });
    o(this.$box, this._readonly$, "readonly"), o(this.$box, this._draggable$, "no-drag", Vv), o(this.$box, this._resizable$, "no-resize", Vv), o(this.$box, this._focus$, "blur", Vv), o(this.$box, this._darkMode$, "color-scheme-dark"), o(this.$box, this._darkMode$, "color-scheme-light", Vv), this._renderSideEffect.add(() => {
      const A = this.wrapClassName("minimized"), z = this.wrapClassName("maximized"), $ = "box-maximized-timer";
      return this._state$.subscribe((V) => {
        this.$box.classList.toggle(A, V === nn.Minimized), V === nn.Maximized ? (this._renderSideEffect.flush($), this.$box.classList.toggle(z, !0)) : this._renderSideEffect.setTimeout(
          () => {
            this.$box.classList.toggle(z, !1);
          },
          0,
          $
        );
      });
    }), this._renderSideEffect.add(
      () => this._visible$.subscribe((A) => {
        this.$box.style.display = A ? "block" : "none";
      })
    ), this._renderSideEffect.add(
      () => this._zIndex$.subscribe((A) => {
        this.$box.style.zIndex = String(A);
      })
    );
    const c = Zk(this.$box);
    this.$box.dataset.teleBoxID = this.id, this.$box.style.width = this.absoluteWidth + "px", this.$box.style.height = this.absoluteHeight + "px";
    const h = this.x * this.containerRect.width + this.containerRect.x, m = this.y * this.containerRect.height + this.containerRect.y;
    this.$box.style.transform = `translate(${h - 10}px,${m - 10}px)`, this._valSideEffectBinder.combine(
      [
        this._coord$,
        this._size$,
        this._minimized$,
        this._containerRect$,
        this._collectorRect$
      ],
      ([A, z, $, V, q]) => {
        const G = z.width * V.width, he = z.height * V.height;
        return {
          width: G + ($ && q ? 1 : 0),
          height: he + ($ && q ? 1 : 0),
          x: A.x * V.width,
          y: A.y * V.height,
          scaleX: 1,
          scaleY: 1
        };
      },
      ys
    ).subscribe((A) => {
      c.set(A);
    }), c.set({ x: h, y: m });
    const y = document.createElement("div");
    y.className = this.wrapClassName("box-main"), this.$box.appendChild(y);
    const g = document.createElement("div");
    g.className = this.wrapClassName("titlebar-wrap"), g.appendChild(this.titleBar.render()), this.$titleBar = g;
    const x = document.createElement("div");
    x.className = this.wrapClassName("content-wrap") + " tele-fancy-scrollbar";
    const C = document.createElement("div");
    C.className = this.wrapClassName("content") + " tele-fancy-scrollbar", this.$content = C, this._renderSideEffect.add(() => {
      let A;
      return this._$userStyles$.subscribe((z) => {
        A && A.remove(), A = z, z && x.appendChild(z);
      });
    }), this._renderSideEffect.add(() => {
      let A;
      return this._$userContent$.subscribe((z) => {
        A && A.remove(), A = z, z && C.appendChild(z);
      });
    }), x.appendChild(C);
    const I = document.createElement("div");
    return I.className = this.wrapClassName("footer-wrap"), this.$footer = I, this._renderSideEffect.add(() => {
      let A;
      return this._$userFooter$.subscribe((z) => {
        A && A.remove(), A = z, z && I.appendChild(z);
      });
    }), this._state$.reaction((A) => {
      I.classList.toggle(this.wrapClassName("footer-hide"), A == nn.Maximized);
    }), y.appendChild(g), y.appendChild(x), y.appendChild(I), this.$contentWrap = x, this.addObserver(x, (A) => {
      const z = A.find(($) => $.target == x);
      (z == null ? void 0 : z.target) == x && (C.style.width = z.contentRect.width * this.scale.value + "px", C.style.height = z.contentRect.height * this.scale.value + "px");
    }), this.scale.reaction((A) => {
      C.style.width = x.getBoundingClientRect().width * A + "px", C.style.height = x.getBoundingClientRect().height * A + "px";
    }), this._renderResizeHandlers(), this.$box;
  }
  _renderResizeHandlers() {
    const i = document.createElement("div");
    i.className = this.wrapClassName("resize-handles"), Object.values(ws).forEach((q) => {
      const G = document.createElement("div");
      G.className = this.wrapClassName(q) + " " + this.wrapClassName("resize-handle"), G.dataset.teleBoxHandle = q, i.appendChild(G);
    }), this.$box.appendChild(i);
    const o = "handle-tracking-listener", c = this.wrapClassName("transforming");
    let h, m = 0, y = 0, g = 0, x = 0, C = 0, I = 0, A;
    const z = (q) => {
      if (this.state !== nn.Normal)
        return;
      Ed(q);
      let { pageX: G, pageY: he } = gT(q);
      he < 0 && (he = 0);
      const se = (G - C) / this.containerRect.width, Z = (he - I) / this.containerRect.height;
      switch (A) {
        case ws.North: {
          this.transform(
            this.x,
            y + Z,
            this.width,
            x - Z
          );
          break;
        }
        case ws.South: {
          this.transform(this.x, this.y, this.width, x + Z);
          break;
        }
        case ws.West: {
          this.transform(
            m + se,
            this.y,
            g - se,
            this.height
          );
          break;
        }
        case ws.East: {
          this.transform(this.x, this.y, g + se, this.height);
          break;
        }
        case ws.NorthWest: {
          this.transform(
            m + se,
            y + Z,
            g - se,
            x - Z
          );
          break;
        }
        case ws.NorthEast: {
          this.transform(
            this.x,
            y + Z,
            g + se,
            x - Z
          );
          break;
        }
        case ws.SouthEast: {
          this.transform(
            this.x,
            this.y,
            g + se,
            x + Z
          );
          break;
        }
        case ws.SouthWest: {
          this.transform(
            m + se,
            this.y,
            g - se,
            x + Z
          );
          break;
        }
        default: {
          if (this.fence)
            this.move(
              Xi(m + se, 0, 1 - this.width),
              Xi(y + Z, 0, 1 - this.height)
            );
          else {
            const ue = 20 / this.containerRect.width, oe = 20 / this.containerRect.height;
            this.move(
              Xi(
                m + se,
                ue - this.width,
                1 - ue
              ),
              Xi(y + Z, 0, 1 - oe)
            );
          }
          break;
        }
      }
    }, $ = (q) => {
      A = void 0, h && (Ed(q), this.$box.classList.toggle(c, !1), this._sideEffect.flush(o), h.remove());
    }, V = (q) => {
      var G;
      if (this.readonly || q.button != null && q.button !== 0 || !this.draggable || A || this.state !== nn.Normal)
        return;
      const he = q.target;
      if ((G = he.dataset) != null && G.teleBoxHandle) {
        Ed(q), m = this.x, y = this.y, g = this.width, x = this.height, { pageX: C, pageY: I } = gT(q), A = he.dataset.teleBoxHandle, h || (h = document.createElement("div"));
        const se = A ? this.wrapClassName(`cursor-${A}`) : "";
        h.className = this.wrapClassName(`track-mask${se ? ` ${se}` : ""}`), this.$box.appendChild(h), this.$box.classList.add(c), this._sideEffect.add(() => (window.addEventListener("mousemove", z), window.addEventListener("touchmove", z, {
          passive: !1
        }), window.addEventListener("mouseup", $), window.addEventListener("touchend", $, {
          passive: !1
        }), window.addEventListener("touchcancel", $, {
          passive: !1
        }), () => {
          window.removeEventListener("mousemove", z), window.removeEventListener("touchmove", z), window.removeEventListener("mouseup", $), window.removeEventListener("touchend", $), window.removeEventListener("touchcancel", $);
        }), o);
      }
    };
    this._handleTrackStart = V, this._sideEffect.addEventListener(
      i,
      "mousedown",
      V,
      {},
      "box-resizeHandles-mousedown"
    ), this._sideEffect.addEventListener(
      i,
      "touchstart",
      V,
      { passive: !1 },
      "box-resizeHandles-touchstart"
    );
  }
  setScaleContent(i) {
    this.scale.setValue(i);
  }
  destroy() {
    this.$box.remove(), this.events.emit(Xn.Destroyed), this._sideEffect.flushAll(), this._renderSideEffect.flushAll(), this.events.removeAllListeners(), this._delegateEvents.removeAllListeners();
  }
  wrapClassName(i) {
    return `${this.namespace}-${i}`;
  }
}
function yb() {
}
var r_ = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzFfNDQyNDQpIj4KPGcgZmlsdGVyPSJ1cmwoI2ZpbHRlcjBfZF8xXzQ0MjQ0KSI+CjxwYXRoIGQ9Ik0xNC4wMDAyIDE2LjE5NTNDMTMuODI0NyAxNi4xOTUzIDEzLjY1MjIgMTYuMTQ5MSAxMy41MDAyIDE2LjA2MTVMNC41MDAxNyAxMC44NjQzQzQuMDIxNzggMTAuNTg3OSAzLjg1Nzk2IDkuOTc2MTIgNC4xMzQyOCA5LjQ5NzczQzQuMjIyMDQgOS4zNDU3OSA0LjM0ODIzIDkuMjE5NiA0LjUwMDE3IDkuMTMxODRMMTMuNTAwMiAzLjkzODQ4QzEzLjgwOTggMy43NjA3NCAxNC4xOTA1IDMuNzYwNzQgMTQuNTAwMiAzLjkzODQ4TDIzLjUwMDIgOS4xMzE4NEMyMy45Nzg2IDkuNDA4MTYgMjQuMTQyNCAxMC4wMiAyMy44NjYxIDEwLjQ5ODRDMjMuNzc4MyAxMC42NTAzIDIzLjY1MjEgMTAuNzc2NSAyMy41MDAyIDEwLjg2NDNMMTQuNTAwMiAxNi4wNjE1QzE0LjM0ODEgMTYuMTQ5MSAxNC4xNzU3IDE2LjE5NTMgMTQuMDAwMiAxNi4xOTUzWiIgZmlsbD0id2hpdGUiLz4KPC9nPgo8ZyBmaWx0ZXI9InVybCgjZmlsdGVyMV9kXzFfNDQyNDQpIj4KPHBhdGggZD0iTTIzLjUwMDIgMTMuMTMxOUwyMS41MzYxIDExLjk5ODVMMTQuNTAwMiAxNi4wNjE2QzE0LjE5MDcgMTYuMjQgMTMuODA5NiAxNi4yNCAxMy41MDAyIDE2LjA2MTZMNi40NjQyOCAxMS45OTg1TDQuNTAwMTcgMTMuMTMxOUM0LjAyMTc4IDEzLjQwODIgMy44NTc5NiAxNC4wMiA0LjEzNDI4IDE0LjQ5ODRDNC4yMjIwNCAxNC42NTA0IDQuMzQ4MjMgMTQuNzc2NiA0LjUwMDE3IDE0Ljg2NDNMMTMuNTAwMiAyMC4wNjE2QzEzLjgwOTYgMjAuMjQgMTQuMTkwNyAyMC4yNCAxNC41MDAyIDIwLjA2MTZMMjMuNTAwMiAxNC44NjQzQzIzLjk3ODYgMTQuNTg4IDI0LjE0MjQgMTMuOTc2MiAyMy44NjYxIDEzLjQ5NzhDMjMuNzc4MyAxMy4zNDU5IDIzLjY1MjEgMTMuMjE5NyAyMy41MDAyIDEzLjEzMTlaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjgiIHNoYXBlLXJlbmRlcmluZz0iY3Jpc3BFZGdlcyIvPgo8L2c+CjxnIGZpbHRlcj0idXJsKCNmaWx0ZXIyX2RfMV80NDI0NCkiPgo8cGF0aCBkPSJNMjMuNTAwMiAxNy4xMzE5TDIxLjUzNjEgMTUuOTk4NUwxNC41MDAyIDIwLjA2MTZDMTQuMTkwNyAyMC4yNCAxMy44MDk2IDIwLjI0IDEzLjUwMDIgMjAuMDYxNkw2LjQ2NDI4IDE1Ljk5ODVMNC41MDAxNyAxNy4xMzE5QzQuMDIxNzggMTcuNDA4MiAzLjg1Nzk2IDE4LjAyIDQuMTM0MjggMTguNDk4NEM0LjIyMjA0IDE4LjY1MDQgNC4zNDgyMyAxOC43NzY2IDQuNTAwMTcgMTguODY0M0wxMy41MDAyIDI0LjA2MTZDMTMuODA5NiAyNC4yNCAxNC4xOTA3IDI0LjI0IDE0LjUwMDIgMjQuMDYxNkwyMy41MDAyIDE4Ljg2NDNDMjMuOTc4NiAxOC41ODggMjQuMTQyNCAxNy45NzYyIDIzLjg2NjEgMTcuNDk3OEMyMy43NzgzIDE3LjM0NTkgMjMuNjUyMSAxNy4yMTk3IDIzLjUwMDIgMTcuMTMxOVoiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuNiIgc2hhcGUtcmVuZGVyaW5nPSJjcmlzcEVkZ2VzIi8+CjwvZz4KPC9nPgo8ZGVmcz4KPGZpbHRlciBpZD0iZmlsdGVyMF9kXzFfNDQyNDQiIHg9IjMiIHk9IjMuODA1MTgiIHdpZHRoPSIyMiIgaGVpZ2h0PSIxNC4zOTAxIiBmaWx0ZXJVbml0cz0idXNlclNwYWNlT25Vc2UiIGNvbG9yLWludGVycG9sYXRpb24tZmlsdGVycz0ic1JHQiI+CjxmZUZsb29kIGZsb29kLW9wYWNpdHk9IjAiIHJlc3VsdD0iQmFja2dyb3VuZEltYWdlRml4Ii8+CjxmZUNvbG9yTWF0cml4IGluPSJTb3VyY2VBbHBoYSIgdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDEyNyAwIiByZXN1bHQ9ImhhcmRBbHBoYSIvPgo8ZmVPZmZzZXQgZHk9IjEiLz4KPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMC41Ii8+CjxmZUNvbXBvc2l0ZSBpbjI9ImhhcmRBbHBoYSIgb3BlcmF0b3I9Im91dCIvPgo8ZmVDb2xvck1hdHJpeCB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMCAwIDAgMCAwLjU1Mjk0MSAwIDAgMCAwIDAuNTYwNzg0IDAgMCAwIDAgMC42NTA5OCAwIDAgMCAwLjE1IDAiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbjI9IkJhY2tncm91bmRJbWFnZUZpeCIgcmVzdWx0PSJlZmZlY3QxX2Ryb3BTaGFkb3dfMV80NDI0NCIvPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluPSJTb3VyY2VHcmFwaGljIiBpbjI9ImVmZmVjdDFfZHJvcFNoYWRvd18xXzQ0MjQ0IiByZXN1bHQ9InNoYXBlIi8+CjwvZmlsdGVyPgo8ZmlsdGVyIGlkPSJmaWx0ZXIxX2RfMV80NDI0NCIgeD0iMyIgeT0iMTEuOTk4NSIgd2lkdGg9IjIyIiBoZWlnaHQ9IjEwLjE5NjgiIGZpbHRlclVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj4KPGZlRmxvb2QgZmxvb2Qtb3BhY2l0eT0iMCIgcmVzdWx0PSJCYWNrZ3JvdW5kSW1hZ2VGaXgiLz4KPGZlQ29sb3JNYXRyaXggaW49IlNvdXJjZUFscGhhIiB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMTI3IDAiIHJlc3VsdD0iaGFyZEFscGhhIi8+CjxmZU9mZnNldCBkeT0iMSIvPgo8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIwLjUiLz4KPGZlQ29tcG9zaXRlIGluMj0iaGFyZEFscGhhIiBvcGVyYXRvcj0ib3V0Ii8+CjxmZUNvbG9yTWF0cml4IHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAuNTUyOTQxIDAgMCAwIDAgMC41NjA3ODQgMCAwIDAgMCAwLjY1MDk4IDAgMCAwIDAuMTUgMCIvPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluMj0iQmFja2dyb3VuZEltYWdlRml4IiByZXN1bHQ9ImVmZmVjdDFfZHJvcFNoYWRvd18xXzQ0MjQ0Ii8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0iZWZmZWN0MV9kcm9wU2hhZG93XzFfNDQyNDQiIHJlc3VsdD0ic2hhcGUiLz4KPC9maWx0ZXI+CjxmaWx0ZXIgaWQ9ImZpbHRlcjJfZF8xXzQ0MjQ0IiB4PSIzIiB5PSIxNS45OTg1IiB3aWR0aD0iMjIiIGhlaWdodD0iMTAuMTk2OCIgZmlsdGVyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiPgo8ZmVGbG9vZCBmbG9vZC1vcGFjaXR5PSIwIiByZXN1bHQ9IkJhY2tncm91bmRJbWFnZUZpeCIvPgo8ZmVDb2xvck1hdHJpeCBpbj0iU291cmNlQWxwaGEiIHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAxMjcgMCIgcmVzdWx0PSJoYXJkQWxwaGEiLz4KPGZlT2Zmc2V0IGR5PSIxIi8+CjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjAuNSIvPgo8ZmVDb21wb3NpdGUgaW4yPSJoYXJkQWxwaGEiIG9wZXJhdG9yPSJvdXQiLz4KPGZlQ29sb3JNYXRyaXggdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAgMCAwIDAgMC41NTI5NDEgMCAwIDAgMCAwLjU2MDc4NCAwIDAgMCAwIDAuNjUwOTggMCAwIDAgMC4xNSAwIi8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW4yPSJCYWNrZ3JvdW5kSW1hZ2VGaXgiIHJlc3VsdD0iZWZmZWN0MV9kcm9wU2hhZG93XzFfNDQyNDQiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJlZmZlY3QxX2Ryb3BTaGFkb3dfMV80NDI0NCIgcmVzdWx0PSJzaGFwZSIvPgo8L2ZpbHRlcj4KPGNsaXBQYXRoIGlkPSJjbGlwMF8xXzQ0MjQ0Ij4KPHJlY3Qgd2lkdGg9IjI4IiBoZWlnaHQ9IjI4IiBmaWxsPSJ3aGl0ZSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo=";
let Hh, Wh;
function a_(r, i = !1) {
  Hh ? i ? Wh == null || Wh.push(r) : Hh.push(r) : (Hh = i ? [] : [r], Wh = i ? [r] : [], Promise.resolve().then(() => {
    const o = Hh, c = Wh;
    Hh = void 0, Wh = void 0, c == null || c.forEach((h) => h()), o == null || o.forEach((h) => h());
  }));
}
function s_(r) {
  const i = r.cloneNode(!0);
  i.style.position = "absolute", i.style.top = "-99999px", i.style.float = "none", i.style.visibility = "hidden", i.style.display = "block", document.body.appendChild(i);
  const o = i.getBoundingClientRect();
  return document.body.removeChild(i), { height: o.height, width: o.width };
}
class $M {
  constructor({
    visible: i = !0,
    readonly: o = !1,
    darkMode: c = !1,
    namespace: h = "telebox",
    styles: m = {},
    onClick: y,
    minimizedBoxes: g = [],
    boxes: x = [],
    externalEvents: C
  } = {}) {
    this.handleCollectorClick = () => {
      !this._readonly && this.onClick && this.popupVisible$.setValue(!this.popupVisible$.value);
    }, this.externalEvents = C, this._sideEffect = new sp();
    const { createVal: I } = vS(this._sideEffect);
    this._visible = i, this._readonly = o, this._darkMode = c, this.namespace = h, this.styles = m, this.minimizedBoxes = g, this.boxes = x, this.onClick = y, this.popupVisible$ = I(!1), this.popupVisible$.reaction((z) => {
      var $;
      ($ = this.$titles) == null || $.classList.toggle(
        this.wrapClassName("collector-hide"),
        !z
      ), requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          var V;
          (V = this.$titles) == null || V.classList.toggle(
            this.wrapClassName(
              "collector-titles-visible"
            ),
            z
          );
        });
      });
    });
    const A = (z) => {
      var $, V;
      !this.popupVisible$ || (V = ($ = z.target.className) == null ? void 0 : $.includes) != null && V.call($, "collector") || this.popupVisible$.setValue(!1);
    };
    this._sideEffect.addEventListener(
      window,
      "pointerdown",
      A,
      !0
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
  mount(i) {
    return this.render(i), this.root = i, this;
  }
  unmount() {
    return this.$collector && this.$collector.remove(), this;
  }
  setVisible(i) {
    var o;
    return this._visible !== i && (this._visible = i, this.$collector && (this.$collector.classList.toggle(this.wrapClassName("collector-visible"), i), (o = this.wrp$) == null || o.classList.toggle(this.wrapClassName("collector-visible"), i), i ? this.renderTitles() : this.popupVisible$.setValue(!1))), this;
  }
  setReadonly(i) {
    return this._readonly !== i && (this._readonly = i, this.$collector && this.$collector.classList.toggle(this.wrapClassName("collector-readonly"), i)), this;
  }
  setDarkMode(i) {
    return this._darkMode !== i && (this._darkMode = i, this.$collector && (this.$collector.classList.toggle(this.wrapClassName("color-scheme-dark"), i), this.$collector.classList.toggle(
      this.wrapClassName("color-scheme-light"),
      !i
    ))), this;
  }
  setStyles(i) {
    if (Object.assign(this.styles, i), this.wrp$) {
      const o = this.wrp$;
      Object.keys(i).forEach((c) => {
        const h = i[c];
        h != null && (o.style[c] = h);
      });
    }
    return this;
  }
  setMinimizedBoxes(i) {
    var o;
    this.minimizedBoxes = i, this.count$ && (this.count$.textContent = String((o = this.minimizedBoxes) == null ? void 0 : o.length) || "0"), this.renderTitles();
  }
  setBoxes(i) {
    this.boxes = i, this.renderTitles();
  }
  render(i) {
    return this.$collector || (this.$collector = document.createElement("button"), this.$collector.className = this.wrapClassName("collector"), this.$collector.style.backgroundImage = `url('${r_}')`, this.wrp$ = document.createElement("div"), this.count$ = document.createElement("div"), this.wrp$.className = this.wrapClassName("collector-wrp"), this.count$.className = this.wrapClassName("collector-count"), this.wrp$.appendChild(this.count$), this.wrp$.appendChild(this.$collector), this.$collector.addEventListener("click", this.handleCollectorClick), this._visible && (this.$collector.classList.add(this.wrapClassName("collector-visible")), this.wrp$.classList.toggle(this.wrapClassName("collector-visible")), this.renderTitles()), this._readonly && this.$collector.classList.add(this.wrapClassName("collector-readonly")), this.$collector.classList.add(
      this.wrapClassName(this._darkMode ? "color-scheme-dark" : "color-scheme-light")
    ), this.setStyles(this.styles), i.appendChild(this.wrp$)), this.$collector;
  }
  renderTitles() {
    var i, o, c, h;
    this.$titles || (this.$titles = document.createElement("div"), this.$titles.className = this.wrapClassName("collector-titles"), this.$titles.classList.toggle(
      this.wrapClassName("collector-hide"),
      !this.popupVisible$.value
    )), this._sideEffect.addEventListener(
      this.$titles,
      "wheel",
      (C) => {
        C.deltaX || C.currentTarget.scrollBy({
          left: C.deltaY > 0 ? 250 : -250,
          behavior: "smooth"
        });
      },
      { passive: !1 },
      "min-popup-render-wheel-titles"
    );
    const m = this.$titles.querySelector(
      `.${this.wrapClassName("collector-titles-content")}`
    ), y = m != null ? m : document.createElement("div");
    y.className = this.wrapClassName("collector-titles-content"), m || (this.$titles.appendChild(y), this._sideEffect.addEventListener(
      y,
      "click",
      (C) => {
        var I, A, z, $;
        const V = C.target;
        (A = (I = V.dataset) == null ? void 0 : I.teleBoxID) != null && A.length && (($ = this.onClick) == null || $.call(this, (z = V.dataset) == null ? void 0 : z.teleBoxID));
      },
      {},
      "telebox-collector-titles-content-click"
    )), y.innerHTML = "";
    const g = (i = this.boxes) == null ? void 0 : i.filter((C) => {
      var I;
      return (I = this.minimizedBoxes) == null ? void 0 : I.includes(C.id);
    }).map((C) => {
      const I = document.createElement("button");
      return I.className = this.wrapClassName("collector-titles-tab"), I.textContent = C.title, I.dataset.teleBoxID = C.id, I.dataset.teleTitleBarNoDblClick = "true", y.appendChild(I), C._title$.reaction((A) => I.textContent = A);
    });
    this._sideEffect.addDisposer(
      () => g == null ? void 0 : g.forEach((C) => C()),
      "min-popup-render-tab-titles"
    );
    const x = (o = this.wrp$) == null ? void 0 : o.querySelector(
      `.${this.wrapClassName("collector-titles")}`
    );
    return x ? (h = this.wrp$) == null || h.replaceChild(this.$titles, x) : (c = this.wrp$) == null || c.appendChild(this.$titles), a_(() => {
      var C, I;
      if (!this.$titles || !this.wrp$ || !this.root)
        return;
      const A = (C = this.wrp$) == null ? void 0 : C.getBoundingClientRect(), z = (I = this.root) == null ? void 0 : I.getBoundingClientRect(), $ = s_(this.$titles);
      A.top - z.top > $.height;
      const V = A.x - z.x > $.width / 2 - A.width / 2, q = -$.height - 10;
      let G = -($.width / 2 - A.width / 2);
      V || (G = -(A.x - z.x - 4)), this.$titles.style.top = `${q}px`, this.$titles.style.left = `${G}px`;
    }), this.$titles;
  }
  destroy() {
    this.$collector && (this.$collector.removeEventListener("click", this.handleCollectorClick), this.$collector.remove(), this.$collector = void 0), this.onClick = void 0;
  }
  wrapClassName(i) {
    return `${this.namespace}-${i}`;
  }
}
var mn = /* @__PURE__ */ ((r) => (r.Focused = "focused", r.Blurred = "blurred", r.Created = "created", r.Removed = "removed", r.State = "state", r.Maximized = "maximized", r.Minimized = "minimized", r.Move = "move", r.Resize = "resize", r.IntrinsicMove = "intrinsic_move", r.IntrinsicResize = "intrinsic_resize", r.VisualResize = "visual_resize", r.ZIndex = "z_index", r.PrefersColorScheme = "prefers_color_scheme", r.DarkMode = "dark_mode", r))(mn || {});
class o_ extends FM {
  constructor(i) {
    super(i), this.boxes = i.boxes, this.focusedBox = i.focusedBox, this.containerRect = i.containerRect, this.darkMode = i.darkMode, this.maximizedBoxes$ = i.maximizedBoxes$, this.minimizedBoxes$ = i.minimizedBoxes$;
  }
  focusBox(i) {
    var o;
    if (!(this.focusedBox && this.focusedBox === i)) {
      if (this.$titles && this.state === nn.Maximized) {
        const { children: c } = this.$titles.firstElementChild;
        for (let h = c.length - 1; h >= 0; h -= 1) {
          const m = c[h], y = (o = m.dataset) == null ? void 0 : o.teleBoxID;
          y && (i && y === i.id ? m.classList.toggle(this.wrapClassName("titles-tab-focus"), !0) : this.focusedBox && y === this.focusedBox.id && m.classList.toggle(this.wrapClassName("titles-tab-focus"), !1));
        }
      }
      this.focusedBox = i;
    }
  }
  setContainerRect(i) {
    if (this.containerRect = i, this.$titleBar) {
      const { x: o, y: c, width: h } = i;
      this.$titleBar.style.transform = `translate(${o}px, ${c}px)`, this.$titleBar.style.width = h + "px";
    }
  }
  setBoxes(i) {
    this.boxes = i, this.updateTitles();
  }
  setMaximizedBoxes(i) {
    this.maximizedBoxes$ = i, this.updateTitles();
  }
  setMinimizedBoxes(i) {
    this.minimizedBoxes$ = i, this.updateTitles();
  }
  setState(i) {
    super.setState(i), this.$titleBar && this.$titleBar.classList.toggle(
      this.wrapClassName("max-titlebar-maximized"),
      i === nn.Maximized
    ), this.updateTitles();
  }
  setReadonly(i) {
    super.setReadonly(i), this.$titleBar && this.$titleBar.classList.toggle(this.wrapClassName("readonly"), this.readonly);
  }
  setDarkMode(i) {
    i !== this.darkMode && (this.darkMode = i, this.$titleBar && (this.$titleBar.classList.toggle(this.wrapClassName("color-scheme-dark"), i), this.$titleBar.classList.toggle(this.wrapClassName("color-scheme-light"), !i)));
  }
  render() {
    const i = super.render(), { x: o, y: c, width: h } = this.containerRect;
    i.style.transform = `translate(${o}px, ${c}px)`, i.style.width = h + "px", i.classList.add(this.wrapClassName("max-titlebar")), i.classList.toggle(
      this.wrapClassName("max-titlebar-maximized"),
      this.state === nn.Maximized
    ), i.classList.toggle(this.wrapClassName("readonly"), this.readonly), i.classList.add(
      this.wrapClassName(this.darkMode ? "color-scheme-dark" : "color-scheme-light")
    );
    const m = document.createElement("div");
    return m.classList.add(this.wrapClassName("titles-area")), i.insertBefore(m, i.firstElementChild), this.updateTitles(), i;
  }
  destroy() {
    super.destroy(), this.$titles = void 0, this.boxes.length = 0, this.focusedBox = void 0;
  }
  updateTitles() {
    var i;
    (i = this.$titleBar) == null || i.classList.toggle(
      this.wrapClassName("max-titlebar-active"),
      this.maximizedBoxes$.length > 0 && this.boxes.length > 0 && this.maximizedBoxes$.filter((o) => !this.minimizedBoxes$.includes(o)).length > 0
    ), this.$titleBar && this.maximizedBoxes$.length > 0 && this.boxes.length > 0 && this.maximizedBoxes$.filter((o) => !this.minimizedBoxes$.includes(o)).length > 0 && (this.$titleBar.classList.toggle(
      this.wrapClassName("max-titlebar-single-title"),
      this.boxes.length === 1
    ), this.boxes.length === 1 ? this.setTitle(this.boxes[0].title) : this.$titleBar.replaceChild(
      this.renderTitles(),
      this.$titleBar.firstElementChild
    ));
  }
  renderTitles() {
    this.$titles = document.createElement("div"), this.$titles.className = this.wrapClassName("titles"), this.$titles.addEventListener(
      "wheel",
      (o) => {
        o.currentTarget.scrollBy({
          left: o.deltaY > 0 ? 250 : -250,
          behavior: "smooth"
        });
      },
      { passive: !1 }
    );
    const i = document.createElement("div");
    return i.className = this.wrapClassName("titles-content"), this.$titles.appendChild(i), this.boxes.filter((o) => this.maximizedBoxes$.includes(o.id)).filter((o) => !this.minimizedBoxes$.includes(o.id)).forEach((o) => {
      const c = document.createElement("button");
      c.className = this.wrapClassName("titles-tab"), c.textContent = o.title, c.dataset.teleBoxID = o.id, c.dataset.teleTitleBarNoDblClick = "true", this.focusedBox && o.id === this.focusedBox.id && c.classList.add(this.wrapClassName("titles-tab-focus")), i.appendChild(c);
    }), this.$titles;
  }
}
function l_() {
  let r = /* @__PURE__ */ new Set();
  function i(y) {
    return r.add(y), () => {
      o(y);
    };
  }
  function o(y) {
    r.delete(y);
  }
  function c(...y) {
    r.forEach((g) => {
      g(...y);
    });
  }
  function h() {
    return Boolean(r.size);
  }
  function m() {
    r = /* @__PURE__ */ new Set();
  }
  return {
    runCallbacks: c,
    addCallback: i,
    removeCallback: o,
    hasCallbacks: h,
    removeAll: m
  };
}
class u_ {
  constructor({
    root: i = document.body,
    prefersColorScheme: o = gS.Light,
    fence: c = !0,
    containerRect: h = {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight
    },
    collector: m,
    namespace: y = "telebox",
    readonly: g = !1,
    minimizedBoxes: x = [],
    maximizedBoxes: C = []
  } = {}) {
    this.externalEvents = new ig(), this.events = new ig(), this._sideEffect = new sp();
    const { combine: I, createVal: A } = vS(this._sideEffect);
    this.callbackManager = l_(), this.sizeObserver = new ResizeObserver(this.callbackManager.runCallbacks), this.elementObserverMap = /* @__PURE__ */ new Map(), this.root = i, this.namespace = y, this.boxes$ = A([]), this.topBox$ = this.boxes$.derive((Y) => {
      if (Y.length > 0)
        return Y.reduce(
          (be, ie) => be.zIndex > ie.zIndex ? be : ie
        );
    });
    const z = window.matchMedia("(prefers-color-scheme: dark)"), $ = A(!1);
    z && ($.setValue(z.matches), this._sideEffect.add(() => {
      const Y = (fe) => {
        $.setValue(fe.matches);
      };
      return z.addListener(Y), () => z.removeListener(Y);
    }));
    const V = A(o);
    V.reaction((Y, fe, be) => {
      this.boxes.forEach((ie) => ie.setPrefersColorScheme(Y, be)), be || this.events.emit(mn.PrefersColorScheme, Y);
    }), this._darkMode$ = I(
      [$, V],
      ([Y, fe]) => fe === "auto" ? Y : fe === "dark"
    ), this._darkMode$.reaction((Y, fe, be) => {
      this.boxes.forEach((ie) => ie.setDarkMode(Y, be)), be || this.events.emit(mn.DarkMode, Y);
    });
    const q = A(g);
    q.reaction((Y, fe, be) => {
      this.boxes.forEach((ie) => ie.setReadonly(Y, be));
    }), this.maximizedBoxes$ = A(C), this.minimizedBoxes$ = A(x), this.maximizedBoxes$.reaction((Y, fe, be) => {
      this.boxes.forEach((ct) => ct.setMaximized(Y.includes(ct.id), be));
      const ie = Y.filter((ct) => !this.minimizedBoxes$.value.includes(ct));
      this.maxTitleBar.setState(ie.length > 0 ? nn.Maximized : nn.Normal), this.maxTitleBar.setMaximizedBoxes(Y), be || this.events.emit(mn.Maximized, Y);
    });
    const G = I(
      [this.minimizedBoxes$, this.maximizedBoxes$],
      ([Y, fe]) => Y.length ? nn.Minimized : fe.length ? nn.Maximized : nn.Normal
    );
    G.reaction((Y, fe, be) => {
      this.maxTitleBar.setState(Y), be || this.events.emit(mn.State, Y);
    });
    const he = A(c);
    he.subscribe((Y, fe, be) => {
      this.boxes.forEach((ie) => ie.setFence(Y, be));
    });
    const se = A(h, ys);
    se.reaction((Y, fe, be) => {
      this.boxes.forEach((ie) => ie.setContainerRect(Y, be)), this.maxTitleBar.setContainerRect(Y);
    });
    const Z = A(
      m === null ? null : m || new $M({
        visible: this.minimizedBoxes$.value.length > 0,
        readonly: q.value,
        namespace: y,
        minimizedBoxes: this.minimizedBoxes$.value,
        boxes: this.boxes$.value,
        externalEvents: this.externalEvents
      }).mount(i)
    );
    Z.subscribe((Y) => {
      Y && (Y.setVisible(this.minimizedBoxes$.value.length > 0), Y.setReadonly(q.value), Y.setDarkMode(this._darkMode$.value), this._sideEffect.add(() => (Y.onClick = (fe) => {
        var be;
        q.value || (this.setMinimizedBoxes(
          Vh(
            this.minimizedBoxes$.value.filter(Boolean),
            fe
          )
        ), (be = this.externalEvents) == null || be.emit("OpenMiniBox", []));
      }, () => Y.destroy()), "collect-onClick"));
    }), q.subscribe((Y) => {
      var fe;
      return (fe = Z.value) == null ? void 0 : fe.setReadonly(Y);
    }), this._darkMode$.subscribe((Y) => {
      var fe;
      (fe = Z.value) == null || fe.setDarkMode(Y);
    });
    const ue = () => {
      var Y;
      if ((Y = Z.value) != null && Y.$collector) {
        const { x: fe, y: be, width: ie, height: ct } = Z.value.$collector.getBoundingClientRect(), Oe = this.root.getBoundingClientRect();
        return {
          x: fe - Oe.x,
          y: be - Oe.y,
          width: ie,
          height: ct
        };
      }
    }, oe = A(this.minimizedBoxes$.value.length > 0 ? ue() : void 0);
    oe.subscribe((Y, fe, be) => {
      this.boxes.forEach((ie) => {
        ie.setCollectorRect(Y, be);
      });
    }), this.minimizedBoxes$.reaction((Y, fe, be) => {
      var ie, ct, Oe;
      this.boxes.forEach((Se) => Se.setMinimized(Y.includes(Se.id), be));
      const ce = this.maximizedBoxes$.value.filter((Se) => !Y.includes(Se));
      this.maxTitleBar.setState(ce.length > 0 ? nn.Maximized : nn.Normal), this.maxTitleBar.setMinimizedBoxes(Y);
      const Qe = Y.length > 0;
      (ie = Z.value) == null || ie.setVisible(Qe), (ct = this.collector) == null || ct.setMinimizedBoxes(Y), Qe && (Oe = Z.value) != null && Oe.$collector && oe.setValue(ue()), be || this.events.emit(mn.Minimized, Y);
    });
    const Ne = this.wrapClassName("titlebar-icon-close"), Fe = (Y) => {
      var fe;
      if (q.value)
        return;
      const be = Y.target;
      if (!!be.tagName)
        for (let ie = be; ie; ie = ie.parentElement) {
          if (ie.classList && ie.classList.contains(Ne))
            return;
          const ct = (fe = ie.dataset) == null ? void 0 : fe.teleBoxID;
          if (ct) {
            const Oe = this.getBox(ct);
            if (Oe) {
              this.focusBox(Oe), this.makeBoxTop(Oe);
              return;
            }
          }
        }
    };
    this._sideEffect.addEventListener(window, "mousedown", Fe, !0), this._sideEffect.addEventListener(window, "touchstart", Fe, !0), this.maxTitleBar = new o_({
      darkMode: this.darkMode,
      readonly: q.value,
      namespace: this.namespace,
      state: G.value,
      boxes: this.boxes$.value,
      containerRect: se.value,
      maximizedBoxes$: this.maximizedBoxes$.value,
      minimizedBoxes$: this.minimizedBoxes$.value,
      onEvent: (Y) => {
        var fe, be, ie, ct, Oe, ce;
        switch (Y.type) {
          case Ki.Maximize: {
            if ((fe = this.maxTitleBar.focusedBox) != null && fe.id) {
              const Qe = (be = this.maxTitleBar.focusedBox) == null ? void 0 : be.id, Ve = this.maximizedBoxes$.value.includes(
                Qe
              ) ? Vh(
                [...this.maximizedBoxes$.value],
                Qe
              ) : vT([
                ...this.maximizedBoxes$.value,
                (ie = this.maxTitleBar.focusedBox) == null ? void 0 : ie.id
              ]);
              this.setMaximizedBoxes(Ve);
              const Re = this.makeBoxTopFromMaximized(), $e = this.boxes$.value.find(
                (Tt) => Tt.id == Qe
              );
              $e && this.makeBoxTop($e), Re || this.setMaximizedBoxes([]);
            } else
              this.setMaximizedBoxes([]);
            this.externalEvents.emit(mn.Maximized, []);
            break;
          }
          case Ki.Minimize: {
            if ((ct = this.maxTitleBar.focusedBox) != null && ct.id) {
              const Qe = vT([
                ...this.minimizedBoxes$.value,
                (Oe = this.maxTitleBar.focusedBox) == null ? void 0 : Oe.id
              ]);
              this.makeBoxTopFromMaximized(), this.setMinimizedBoxes(Qe);
            }
            this.externalEvents.emit(mn.Minimized, this.minimizedBoxes$.value);
            break;
          }
          case Xn.Close: {
            const Qe = (ce = this.maxTitleBar.focusedBox) == null ? void 0 : ce.id;
            Qe && (this.remove(Qe), this.makeBoxTopFromMaximized(), this.setMaximizedBoxes(Vh(this.maximizedBoxes$.value, Qe))), this.externalEvents.emit(mn.Removed, []), this.focusTopBox();
            break;
          }
        }
      }
    }), q.subscribe((Y) => this.maxTitleBar.setReadonly(Y)), this._darkMode$.subscribe((Y) => {
      this.maxTitleBar.setDarkMode(Y);
    }), this.boxes$.reaction((Y) => {
      var fe;
      this.maxTitleBar.setBoxes(Y), (fe = this.collector) == null || fe.setBoxes(Y);
    }), this.maximizedBoxes$.reaction((Y) => {
      this.maxTitleBar.setMaximizedBoxes(Y);
    }), this.minimizedBoxes$.reaction((Y) => {
      this.maxTitleBar.setMinimizedBoxes(Y);
    });
    const Pe = {
      prefersColorScheme: V,
      containerRect: se,
      collector: Z,
      collectorRect: oe,
      readonly: q,
      fence: he,
      maximizedBoxes: this.maximizedBoxes$,
      minimizedBoxes: this.minimizedBoxes$
    };
    WM(this, Pe), this._state$ = G, this.root.appendChild(this.maxTitleBar.render());
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
  setMinimized(i, o = !1) {
    console.log("mini", i, o);
  }
  setMaximized(i, o = !1) {
    console.log("max", i, o);
  }
  setState(i, o = !1) {
    switch (console.log(o), i) {
      case nn.Maximized:
        break;
      case nn.Minimized:
        break;
    }
    return this;
  }
  create(i = {}, o = !0) {
    const c = i.id || Td(), h = this.maximizedBoxes$.value.includes(c), m = this.maximizedBoxes$.value.includes(c), y = new i_({
      zIndex: this.topBox ? this.topBox.zIndex + 1 : 100,
      ...o ? this.smartPosition(i) : i,
      darkMode: this.darkMode,
      prefersColorScheme: this.prefersColorScheme,
      maximized: h,
      minimized: m,
      fence: this.fence,
      namespace: this.namespace,
      containerRect: this.containerRect,
      readonly: this.readonly,
      collectorRect: this.collectorRect,
      id: c,
      addObserver: (g, x) => {
        const C = this.elementObserverMap.get(c);
        C ? C.push({ el: g, cb: x }) : this.elementObserverMap.set(c, [{ el: g, cb: x }]), this.callbackManager.addCallback(x), this.sizeObserver.observe(g);
      }
    });
    return y.mount(this.root), y.focus && (this.focusBox(y), o && this.makeBoxTop(y)), this.boxes$.setValue([...this.boxes, y]), y._delegateEvents.on(Ki.Maximize, () => {
      this.setMaximizedBoxes(this.boxes$.value.map((g) => g.id)), this.maxTitleBar.focusBox(y), this.externalEvents.emit(mn.Maximized, [y.id]);
    }), y._delegateEvents.on(Ki.Minimize, () => {
      this.setMinimizedBoxes([...this.minimizedBoxes$.value, c]), this.externalEvents.emit(mn.Minimized, [y.id]);
    }), y._delegateEvents.on(Ki.Close, () => {
      this.remove(y), this.makeBoxTopFromMaximized(y.id), this.focusTopBox(), this.externalEvents.emit(mn.Removed, [y]);
    }), y._coord$.reaction((g, x, C) => {
      C || this.events.emit(mn.Move, y);
    }), y._size$.reaction((g, x, C) => {
      C || this.events.emit(mn.Resize, y);
    }), y._intrinsicCoord$.reaction((g, x, C) => {
      C || this.events.emit(mn.IntrinsicMove, y);
    }), y._intrinsicSize$.reaction((g, x, C) => {
      C || this.events.emit(mn.IntrinsicResize, y);
    }), y._visualSize$.reaction((g, x, C) => {
      C || this.events.emit(mn.VisualResize, y);
    }), y._zIndex$.reaction((g, x, C) => {
      if (this.boxes.length > 0) {
        const I = this.boxes.reduce(
          (A, z) => A.zIndex > z.zIndex ? A : z
        );
        this.topBox$.setValue(I);
      }
      C || this.events.emit(mn.ZIndex, y);
    }), this.events.emit(mn.Created, y), y;
  }
  query(i) {
    return i ? this.boxes.filter(this.teleBoxMatcher(i)) : [...this.boxes];
  }
  queryOne(i) {
    return i ? this.boxes.find(this.teleBoxMatcher(i)) : this.boxes[0];
  }
  update(i, o, c = !1) {
    const h = this.boxes.find((m) => m.id === i);
    if (h)
      return this.updateBox(h, o, c);
  }
  updateAll(i, o = !1) {
    this.boxes.forEach((c) => {
      this.updateBox(c, i, o);
    });
  }
  remove(i, o = !1) {
    var c;
    const h = this.getBoxIndex(i);
    if (h >= 0) {
      const m = this.boxes.slice(), y = m.splice(h, 1);
      this.boxes$.setValue(m), y.forEach((x) => x.destroy());
      const g = (c = this.getBox(i)) == null ? void 0 : c.id;
      if (g) {
        this.setMaximizedBoxes(Vh(this.maximizedBoxes$.value, g)), this.setMinimizedBoxes(Vh(this.minimizedBoxes$.value, g));
        const x = this.elementObserverMap.get(g);
        x && x.forEach(({ el: C, cb: I }) => {
          this.callbackManager.removeCallback(I), this.sizeObserver.unobserve(C), this.elementObserverMap.delete(g);
        });
      }
      return o || (this.boxes.length <= 0 && (this.setMaximizedBoxes([]), this.setMinimizedBoxes([])), this.events.emit(mn.Removed, y)), y[0];
    }
  }
  removeTopBox() {
    if (this.topBox)
      return this.remove(this.topBox);
  }
  removeAll(i = !1) {
    const o = this.boxes$.value;
    return this.boxes$.setValue([]), o.forEach((c) => c.destroy()), this.sizeObserver.disconnect(), this.elementObserverMap = /* @__PURE__ */ new Map(), this.callbackManager.removeAll(), i || (this.boxes.length <= 0 && (this.setMaximizedBoxes([]), this.setMinimizedBoxes([])), this.events.emit(mn.Removed, o)), o;
  }
  destroy(i = !1) {
    this.events.removeAllListeners(), this._sideEffect.flushAll(), this.removeAll(i), this.sizeObserver.disconnect(), this.callbackManager.removeAll(), Object.keys(this).forEach((o) => {
      const c = this[o];
      c instanceof cp && c.destroy();
    });
  }
  wrapClassName(i) {
    return `${this.namespace}-${i}`;
  }
  focusBox(i, o = !1) {
    const c = this.getBox(i);
    c && (this.boxes.forEach((h) => {
      if (c === h) {
        let m = !1;
        c.focus || (m = !0, c.setFocus(!0, o)), m && !o && this.events.emit(mn.Focused, c);
      } else
        h.focus && this.blurBox(h, o);
    }), this.maximizedBoxes$.value.length > 0 ? this.maximizedBoxes$.value.includes(c.id) && this.maxTitleBar.focusBox(c) : this.maxTitleBar.focusBox(c));
  }
  focusTopBox() {
    if (this.topBox && !this.topBox.focus)
      return this.focusBox(this.topBox);
  }
  blurBox(i, o = !1) {
    const c = this.getBox(i);
    c && c.focus && (c.setFocus(!1, o), o || this.events.emit(mn.Blurred, c));
  }
  blurAll(i = !1) {
    this.boxes.forEach((o) => {
      o.focus && (o.setFocus(!1, i), i || this.events.emit(mn.Blurred, o));
    }), this.maxTitleBar.focusedBox && this.maxTitleBar.focusBox();
  }
  setScaleContent(i) {
    this.boxes.forEach((o) => {
      o.setScaleContent(i);
    });
  }
  teleBoxMatcher(i) {
    const o = Object.keys(i);
    return (c) => o.every((h) => i[h] === c[h]);
  }
  updateBox(i, o, c = !1) {
    (o.x != null || o.y != null) && i.move(
      o.x == null ? i.intrinsicX : o.x,
      o.y == null ? i.intrinsicY : o.y,
      c
    ), (o.width != null || o.height != null) && i.resize(
      o.width == null ? i.intrinsicWidth : o.width,
      o.height == null ? i.intrinsicHeight : o.height,
      c
    ), o.title != null && (i.setTitle(o.title), this.maxTitleBar.updateTitles()), o.visible != null && i.setVisible(o.visible, c), o.minHeight != null && i.setMinHeight(o.minHeight, c), o.minWidth != null && i.setMinWidth(o.minWidth, c), o.resizable != null && i.setResizable(o.resizable, c), o.draggable != null && i.setDraggable(o.draggable, c), o.fixRatio != null && i.setFixRatio(o.fixRatio, c), o.zIndex != null && i.setZIndex(o.zIndex, c), o.content != null && i.mountContent(o.content), o.footer != null && i.mountFooter(o.footer), o.maximized != null && i.setMaximized(o.maximized, c), o.minimized != null && i.setMinimized(o.minimized, c);
  }
  smartPosition(i = {}) {
    let { x: o, y: c } = i;
    const { width: h = 0.5, height: m = 0.5 } = i;
    if (o == null) {
      let y = 20;
      this.topBox && (y = this.topBox.intrinsicX * this.containerRect.width + 20, y > this.containerRect.width - h * this.containerRect.width && (y = 20)), o = y / this.containerRect.width;
    }
    if (c == null) {
      let y = 20;
      this.topBox && (y = this.topBox.intrinsicY * this.containerRect.height + 20, y > this.containerRect.height - m * this.containerRect.height && (y = 20)), c = y / this.containerRect.height;
    }
    return { ...i, x: o, y: c, width: h, height: m };
  }
  makeBoxTop(i, o = !1) {
    if (this.topBox && i !== this.topBox)
      if (this.maximizedBoxes$.value.includes(i.id)) {
        const c = this.topBox.zIndex + 1, h = t_(
          this.boxes$.value.map((y) => y.id),
          this.maximizedBoxes$.value,
          this.minimizedBoxes$.value
        ), m = this.boxes$.value.filter(
          (y) => h.includes(y.id)
        );
        i._zIndex$.setValue(c, o), m.sort((y, g) => y._zIndex$.value - g._zIndex$.value).forEach((y, g) => {
          y._zIndex$.setValue(c + 1 + g, o);
        });
      } else
        i._zIndex$.setValue(this.topBox.zIndex + 1, o);
  }
  makeBoxTopFromMaximized(i) {
    let o;
    if (i)
      this.maximizedBoxes$.value.includes(i) && !this.minimizedBoxes$.value.includes(i) && (o = this.boxes$.value.find((c) => c.id === i));
    else {
      const c = this.boxes$.value.filter((h) => {
        var m;
        return h.id != ((m = this.maxTitleBar.focusedBox) == null ? void 0 : m.id) && this.maximizedBoxes$.value.includes(h.id) && !this.minimizedBoxes$.value.includes(h.id);
      });
      o = c.length ? c.reduce((h, m) => m._zIndex$.value > h._zIndex$.value ? m : h) : void 0, o && this.maxTitleBar.focusBox(o);
    }
    return !!o;
  }
  getBoxIndex(i) {
    return typeof i == "string" ? this.boxes.findIndex((o) => o.id === i) : this.boxes.findIndex((o) => o === i);
  }
  setMaxTitleFocus(i) {
    this.getBox(i) && this.maxTitleBar.focusBox(this.getBox(i));
  }
  getBox(i) {
    return typeof i == "string" ? this.boxes.find((o) => o.id === i) : i;
  }
}
var hM;
const tp = (hM = window.navigator) == null ? void 0 : hM.userAgent;
tp == null || tp.match(/(Edge?)\/(\d+)/);
const yT = () => typeof navigator < "u" && typeof window < "u" && /iPad|iPhone|iPod/.test(tp), wT = () => typeof navigator < "u" && /Android/.test(tp), c_ = (r, i, o, c, h) => new d_(
  {
    safeSetAttributes: (m) => r.safeSetAttributes(m),
    getMainView: () => r.mainView,
    updateAppState: (...m) => {
      var y;
      return (y = r.appManager) == null ? void 0 : y.store.updateAppState(...m);
    },
    canOperate: () => r.canOperate,
    notifyContainerRectUpdate: (m) => {
      var y;
      return (y = r.appManager) == null ? void 0 : y.notifyContainerRectUpdate(m);
    },
    cleanFocus: () => {
      var m;
      return (m = r.appManager) == null ? void 0 : m.store.cleanFocus();
    },
    setAppFocus: (m) => {
      var y;
      return (y = r.appManager) == null ? void 0 : y.store.setAppFocus(m, !0);
    },
    callbacks: i,
    emitter: o,
    boxEmitter: c
  },
  h
);
class d_ {
  constructor(i, o) {
    this.context = i, this.createTeleBoxManagerConfig = o;
    const { emitter: c, callbacks: h, boxEmitter: m } = i;
    this.teleBoxManager = this.setupBoxManager(o), this.teleBoxManager._state$.reaction((y) => {
      h.emit("boxStateChange", y), c.emit("boxStateChange", y);
    }), this.teleBoxManager._darkMode$.reaction((y) => {
      h.emit("darkModeChange", y);
    }), this.teleBoxManager._prefersColorScheme$.reaction((y) => {
      h.emit("prefersColorSchemeChange", y);
    }), this.teleBoxManager._minimizedBoxes$.reaction((y) => {
      y.length || setTimeout(() => {
        const g = 1e-3 * (Math.random() > 0.5 ? 1 : -1);
        this.teleBoxManager.boxes.forEach((x) => {
          x.resize(x.intrinsicWidth + g, x.intrinsicHeight + g, !0);
        });
      }, 400);
    }), this.teleBoxManager.events.on("minimized", (y) => {
      this.context.safeSetAttributes({ minimizedBoxes: JSON.stringify(y) }), h.emit("onMinimized", JSON.stringify(y));
    }), this.teleBoxManager.events.on("maximized", (y) => {
      this.context.safeSetAttributes({ maximizedBoxes: JSON.stringify(y) }), h.emit("onMaximized", JSON.stringify(y));
    }), this.teleBoxManager.events.on("removed", (y) => {
      y.forEach((g) => {
        m.emit("close", { appId: g.id });
      });
    }), this.teleBoxManager.events.on(
      "intrinsic_move",
      xs((y) => {
        m.emit("move", { appId: y.id, x: y.intrinsicX, y: y.intrinsicY });
      }, 50)
    ), this.teleBoxManager.events.on(
      "intrinsic_resize",
      xs((y) => {
        m.emit("resize", {
          appId: y.id,
          width: y.intrinsicWidth,
          height: y.intrinsicHeight
        });
      }, 200)
    ), this.teleBoxManager.events.on("focused", (y) => {
      y && (this.canOperate ? m.emit("focus", { appId: y.id }) : this.teleBoxManager.blurBox(y.id));
    }), this.teleBoxManager.events.on("z_index", (y) => {
      this.context.updateAppState(y.id, Ji.ZIndex, y.zIndex), h.emit("appZIndexChange", { appId: y.id, box: y });
    }), c.on("playgroundSizeChange", () => this.updateManagerRect()), c.on("updateManagerRect", () => this.updateManagerRect()), c.on("onScaleChange", (y) => {
      this.changeScale(y);
    });
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
  changeScale(i) {
    this.teleBoxManager.setScaleContent(i);
  }
  createBox(i) {
    var C, I, A;
    if (!this.teleBoxManager)
      return;
    let { minwidth: o = iN, minheight: c = rN } = (C = i.app.config) != null ? C : {};
    const { width: h, height: m } = (I = i.app.config) != null ? I : {}, y = ((A = i.options) == null ? void 0 : A.title) || i.appId, g = this.teleBoxManager.containerRect;
    o > 1 && (o = o / g.width), c > 1 && (c = c / g.height);
    const x = {
      title: y,
      minWidth: o,
      minHeight: c,
      width: h,
      height: m,
      id: i.appId
    };
    this.teleBoxManager.create(x, i.smartPosition), this.context.emitter.emit(`${i.appId}${Xt.WindowCreated}`);
  }
  setBoxInitState(i) {
    const o = this.teleBoxManager.queryOne({ id: i });
    o && o.state === nn.Maximized && this.context.boxEmitter.emit("resize", {
      appId: i,
      x: o.x,
      y: o.y,
      width: o.intrinsicWidth,
      height: o.intrinsicHeight
    });
  }
  setupBoxManager(i) {
    const o = Wt.wrapper ? Wt.wrapper : document.body, c = o.getBoundingClientRect(), h = {
      root: o,
      containerRect: {
        x: 0,
        y: 0,
        width: c.width,
        height: c.height
      },
      fence: !1,
      prefersColorScheme: i == null ? void 0 : i.prefersColorScheme
    }, m = new u_(h);
    this.teleBoxManager && this.teleBoxManager.destroy(), this.teleBoxManager = m;
    const y = (i == null ? void 0 : i.collectorContainer) || Wt.wrapper;
    return y && this.setCollectorContainer(y), m;
  }
  setCollectorContainer(i) {
    var c;
    const o = new $M({
      styles: (c = this.createTeleBoxManagerConfig) == null ? void 0 : c.collectorStyles,
      readonly: this.teleBoxManager.readonly
    }).mount(i);
    this.teleBoxManager.setCollector(o);
  }
  getBox(i) {
    return this.teleBoxManager.queryOne({ id: i });
  }
  closeBox(i, o = !1) {
    return this.teleBoxManager.remove(i, o);
  }
  boxIsFocus(i) {
    const o = this.getBox(i);
    return o == null ? void 0 : o.focus;
  }
  getFocusBox() {
    return this.teleBoxManager.query({ focus: !0 })[0];
  }
  getTopBox() {
    return this.teleBoxManager.topBox;
  }
  updateBoxState(i) {
    if (console.log(i), !i)
      return;
    const o = this.getBox(i.id);
    o && (this.teleBoxManager.update(
      o.id,
      {
        x: i.x,
        y: i.y,
        width: i.width || 0.5,
        height: i.height || 0.5,
        zIndex: i.zIndex
      },
      !1
    ), setTimeout(() => {
      i.focus && this.teleBoxManager.focusBox(o.id, !0);
    }, 50), this.context.callbacks.emit("boxStateChange", this.teleBoxManager.state));
  }
  updateManagerRect() {
    var o;
    const i = (o = Wt.wrapper) == null ? void 0 : o.getBoundingClientRect();
    if (i && i.width > 0 && i.height > 0) {
      const c = { x: 0, y: 0, width: i.width, height: i.height };
      this.teleBoxManager.setContainerRect(c), this.context.notifyContainerRectUpdate(c);
    }
  }
  moveBox({ appId: i, x: o, y: c }) {
    this.teleBoxManager.update(i, { x: o, y: c }, !0);
  }
  focusBox({ appId: i }, o = !0) {
    this.teleBoxManager.focusBox(i, o);
  }
  resizeBox({ appId: i, width: o, height: c, skipUpdate: h }) {
    this.teleBoxManager.update(i, { width: o, height: c }, h);
  }
  setBoxMinSize(i) {
    this.teleBoxManager.update(
      i.appId,
      {
        minWidth: i.minWidth,
        minHeight: i.minHeight
      },
      !0
    );
  }
  setBoxTitle(i) {
    this.teleBoxManager.update(i.appId, { title: i.title }, !0);
  }
  blurAllBox() {
    this.teleBoxManager.blurAll();
  }
  updateAll(i) {
    this.teleBoxManager.updateAll(i);
  }
  setMaximized(i, o = !0) {
    if (!!KC(i))
      try {
        this.teleBoxManager.setMaximizedBoxes(JSON.parse(i), o);
      } catch (c) {
        console.log(c);
      }
  }
  setMinimized(i, o = !0) {
    if (!!KC(i))
      try {
        this.teleBoxManager.setMinimizedBoxes(JSON.parse(i), o);
      } catch (c) {
        console.log(c);
      }
  }
  focusTopBox() {
    if (this.teleBoxManager.query().length >= 1) {
      const o = this.getTopBox();
      o && this.focusBox({ appId: o.id }, !1);
    }
  }
  updateBox(i, o, c = !0) {
    this.teleBoxManager.update(i, o, c);
  }
  setReadonly(i) {
    var o;
    this.teleBoxManager.setReadonly(i || yT() || wT()), (o = this.teleBoxManager._collector$.value) == null || o.setReadonly(i || yT() || wT());
  }
  setPrefersColorScheme(i) {
    this.teleBoxManager.setPrefersColorScheme(i);
  }
  setZIndex(i, o, c = !0) {
    this.teleBoxManager.update(i, { zIndex: o }, c);
  }
  destroy() {
    this.teleBoxManager.destroy();
  }
}
function rg() {
}
function QM(r) {
  return r();
}
function bT() {
  return /* @__PURE__ */ Object.create(null);
}
function fg(r) {
  r.forEach(QM);
}
function f_(r) {
  return typeof r == "function";
}
function h_(r, i) {
  return r != r ? i == i : r !== i || r && typeof r == "object" || typeof r == "function";
}
let Hv;
function ag(r, i) {
  return Hv || (Hv = document.createElement("a")), Hv.href = i, r === Hv.href;
}
function p_(r) {
  return Object.keys(r).length === 0;
}
function vo(r, i) {
  r.appendChild(i);
}
function hg(r, i, o) {
  r.insertBefore(i, o || null);
}
function dp(r) {
  r.parentNode.removeChild(r);
}
function ul(r) {
  return document.createElement(r);
}
function yS(r) {
  return document.createTextNode(r);
}
function Zb() {
  return yS(" ");
}
function Dn(r, i, o) {
  o == null ? r.removeAttribute(i) : r.getAttribute(i) !== o && r.setAttribute(i, o);
}
function m_(r) {
  return Array.from(r.childNodes);
}
function ZM(r, i) {
  i = "" + i, r.wholeText !== i && (r.data = i);
}
function Si(r, i, o, c) {
  r.style.setProperty(i, o, c ? "important" : "");
}
let YM;
function sg(r) {
  YM = r;
}
const Yh = [], ST = [], Kv = [], xT = [], v_ = Promise.resolve();
let Yb = !1;
function g_() {
  Yb || (Yb = !0, v_.then(GM));
}
function Gb(r) {
  Kv.push(r);
}
let wb = !1;
const bb = /* @__PURE__ */ new Set();
function GM() {
  if (!wb) {
    wb = !0;
    do {
      for (let r = 0; r < Yh.length; r += 1) {
        const i = Yh[r];
        sg(i), y_(i.$$);
      }
      for (sg(null), Yh.length = 0; ST.length; )
        ST.pop()();
      for (let r = 0; r < Kv.length; r += 1) {
        const i = Kv[r];
        bb.has(i) || (bb.add(i), i());
      }
      Kv.length = 0;
    } while (Yh.length);
    for (; xT.length; )
      xT.pop()();
    Yb = !1, wb = !1, bb.clear();
  }
}
function y_(r) {
  if (r.fragment !== null) {
    r.update(), fg(r.before_update);
    const i = r.dirty;
    r.dirty = [-1], r.fragment && r.fragment.p(r.ctx, i), r.after_update.forEach(Gb);
  }
}
const w_ = /* @__PURE__ */ new Set();
function b_(r, i) {
  r && r.i && (w_.delete(r), r.i(i));
}
function S_(r, i, o, c) {
  const { fragment: h, on_mount: m, on_destroy: y, after_update: g } = r.$$;
  h && h.m(i, o), c || Gb(() => {
    const x = m.map(QM).filter(f_);
    y ? y.push(...x) : fg(x), r.$$.on_mount = [];
  }), g.forEach(Gb);
}
function x_(r, i) {
  const o = r.$$;
  o.fragment !== null && (fg(o.on_destroy), o.fragment && o.fragment.d(i), o.on_destroy = o.fragment = null, o.ctx = []);
}
function C_(r, i) {
  r.$$.dirty[0] === -1 && (Yh.push(r), g_(), r.$$.dirty.fill(0)), r.$$.dirty[i / 31 | 0] |= 1 << i % 31;
}
function T_(r, i, o, c, h, m, y, g = [-1]) {
  const x = YM;
  sg(r);
  const C = r.$$ = {
    fragment: null,
    ctx: null,
    props: m,
    update: rg,
    not_equal: h,
    bound: bT(),
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(x ? x.$$.context : i.context || []),
    callbacks: bT(),
    dirty: g,
    skip_bound: !1,
    root: i.target || x.$$.root
  };
  y && y(C.root);
  let I = !1;
  if (C.ctx = o ? o(r, i.props || {}, (A, z, ...$) => {
    const V = $.length ? $[0] : z;
    return C.ctx && h(C.ctx[A], C.ctx[A] = V) && (!C.skip_bound && C.bound[A] && C.bound[A](V), I && C_(r, A)), z;
  }) : [], C.update(), I = !0, fg(C.before_update), C.fragment = c ? c(C.ctx) : !1, i.target) {
    if (i.hydrate) {
      const A = m_(i.target);
      C.fragment && C.fragment.l(A), A.forEach(dp);
    } else
      C.fragment && C.fragment.c();
    i.intro && b_(r.$$.fragment), S_(r, i.target, i.anchor, i.customElement), GM();
  }
  sg(x);
}
class M_ {
  $destroy() {
    x_(this, 1), this.$destroy = rg;
  }
  $on(i, o) {
    const c = this.$$.callbacks[i] || (this.$$.callbacks[i] = []);
    return c.push(o), () => {
      const h = c.indexOf(o);
      h !== -1 && c.splice(h, 1);
    };
  }
  $set(i) {
    this.$$set && !p_(i) && (this.$$.skip_bound = !0, this.$$set(i), this.$$.skip_bound = !1);
  }
}
function CT(r) {
  let i, o, c, h, m, y, g, x = r[18] && TT(r), C = r[19] && MT(r);
  return {
    c() {
      i = ul("div"), o = ul("div"), x && x.c(), c = Zb(), h = ul("span"), m = yS(r[1]), y = Zb(), C && C.c(), Si(h, "overflow", "hidden"), Si(h, "white-space", "nowrap"), Si(h, "text-overflow", "ellipsis"), Si(h, "max-width", "80px"), Dn(o, "class", r[9]), Si(o, "background-color", r[3]), Si(o, "color", r[10]), Si(o, "opacity", r[12]), Dn(i, "class", g = "netless-window-manager-cursor-name " + r[16] + " " + r[15]);
    },
    m(I, A) {
      hg(I, i, A), vo(i, o), x && x.m(o, null), vo(o, c), vo(o, h), vo(h, m), vo(o, y), C && C.m(o, null);
    },
    p(I, A) {
      I[18] ? x ? x.p(I, A) : (x = TT(I), x.c(), x.m(o, c)) : x && (x.d(1), x = null), A & 2 && ZM(m, I[1]), I[19] ? C ? C.p(I, A) : (C = MT(I), C.c(), C.m(o, null)) : C && (C.d(1), C = null), A & 512 && Dn(o, "class", I[9]), A & 8 && Si(o, "background-color", I[3]), A & 1024 && Si(o, "color", I[10]), A & 4096 && Si(o, "opacity", I[12]), A & 98304 && g !== (g = "netless-window-manager-cursor-name " + I[16] + " " + I[15]) && Dn(i, "class", g);
    },
    d(I) {
      I && dp(i), x && x.d(), C && C.d();
    }
  };
}
function TT(r) {
  let i, o;
  return {
    c() {
      i = ul("img"), Dn(i, "class", "netless-window-manager-cursor-selector-avatar"), Dn(i, "style", r[20]()), ag(i.src, o = r[8]) || Dn(i, "src", o), Dn(i, "alt", "avatar");
    },
    m(c, h) {
      hg(c, i, h);
    },
    p(c, h) {
      h & 256 && !ag(i.src, o = c[8]) && Dn(i, "src", o);
    },
    d(c) {
      c && dp(i);
    }
  };
}
function MT(r) {
  let i, o;
  return {
    c() {
      i = ul("span"), o = yS(r[2]), Dn(i, "class", "netless-window-manager-cursor-tag-name"), Si(i, "background-color", r[11]);
    },
    m(c, h) {
      hg(c, i, h), vo(i, o);
    },
    p(c, h) {
      h & 4 && ZM(o, c[2]), h & 2048 && Si(i, "background-color", c[11]);
    },
    d(c) {
      c && dp(i);
    }
  };
}
function E_(r) {
  let i, o, c, h, m, y, g, x = !r[14] && CT(r);
  return {
    c() {
      i = ul("div"), x && x.c(), o = Zb(), c = ul("div"), h = ul("img"), Dn(h, "class", m = "netless-window-manager-cursor-" + r[4] + "-image " + r[15]), ag(h.src, y = r[7]) || Dn(h, "src", y), Dn(h, "alt", r[4]), Dn(c, "class", "cursor-image-wrapper"), Dn(i, "class", g = "netless-window-manager-cursor-mid" + (r[13] ? " netless-window-manager-cursor-custom" : "")), Si(i, "transform", "translateX(" + r[5] + "px) translateY(" + r[6] + "px)"), Si(i, "display", r[17]), Dn(i, "data-cursor-uid", r[0]);
    },
    m(C, I) {
      hg(C, i, I), x && x.m(i, null), vo(i, o), vo(i, c), vo(c, h);
    },
    p(C, [I]) {
      C[14] ? x && (x.d(1), x = null) : x ? x.p(C, I) : (x = CT(C), x.c(), x.m(i, o)), I & 32784 && m !== (m = "netless-window-manager-cursor-" + C[4] + "-image " + C[15]) && Dn(h, "class", m), I & 128 && !ag(h.src, y = C[7]) && Dn(h, "src", y), I & 16 && Dn(h, "alt", C[4]), I & 8192 && g !== (g = "netless-window-manager-cursor-mid" + (C[13] ? " netless-window-manager-cursor-custom" : "")) && Dn(i, "class", g), I & 96 && Si(i, "transform", "translateX(" + C[5] + "px) translateY(" + C[6] + "px)"), I & 131072 && Si(i, "display", C[17]), I & 1 && Dn(i, "data-cursor-uid", C[0]);
    },
    i: rg,
    o: rg,
    d(C) {
      C && dp(i), x && x.d();
    }
  };
}
function I_(r, i, o) {
  let c, h, m, y, g, x, C, I, { uid: A } = i, { cursorName: z } = i, { tagName: $ } = i, { backgroundColor: V } = i, { appliance: q } = i, { x: G } = i, { y: he } = i, { src: se } = i, { visible: Z } = i, { avatar: ue } = i, { theme: oe } = i, { color: Ne } = i, { cursorTagBackgroundColor: Fe } = i, { opacity: Pe } = i, { pencilEraserSize: Y } = i, { custom: fe } = i;
  const be = () => Object.entries({
    width: (c ? 19 : 28) + "px",
    height: (c ? 19 : 28) + "px",
    position: c ? "initial" : "absolute",
    "border-color": c ? "white" : V,
    "margin-right": (c ? 4 : 0) + "px"
  }).map(([ie, ct]) => `${ie}: ${ct}`).join(";");
  return r.$$set = (ie) => {
    "uid" in ie && o(0, A = ie.uid), "cursorName" in ie && o(1, z = ie.cursorName), "tagName" in ie && o(2, $ = ie.tagName), "backgroundColor" in ie && o(3, V = ie.backgroundColor), "appliance" in ie && o(4, q = ie.appliance), "x" in ie && o(5, G = ie.x), "y" in ie && o(6, he = ie.y), "src" in ie && o(7, se = ie.src), "visible" in ie && o(21, Z = ie.visible), "avatar" in ie && o(8, ue = ie.avatar), "theme" in ie && o(9, oe = ie.theme), "color" in ie && o(10, Ne = ie.color), "cursorTagBackgroundColor" in ie && o(11, Fe = ie.cursorTagBackgroundColor), "opacity" in ie && o(12, Pe = ie.opacity), "pencilEraserSize" in ie && o(22, Y = ie.pencilEraserSize), "custom" in ie && o(13, fe = ie.custom);
  }, r.$$.update = () => {
    r.$$.dirty & 2 && (c = !Gh(z)), r.$$.dirty & 4 && o(19, h = !Gh($)), r.$$.dirty & 256 && o(18, m = !Gh(ue)), r.$$.dirty & 2097152 && o(17, y = Z ? "" : "none"), r.$$.dirty & 16 && o(14, g = q === Nn.laserPointer), r.$$.dirty & 16400 && o(23, x = g || q === Nn.pencilEraser), r.$$.dirty & 8388608 && o(16, C = x ? "netless-window-manager-laserPointer-pencilEraser-offset" : ""), r.$$.dirty & 4194304 && o(15, I = Y === 3 ? "netless-window-manager-pencilEraser-3-offset" : "");
  }, [
    A,
    z,
    $,
    V,
    q,
    G,
    he,
    se,
    ue,
    oe,
    Ne,
    Fe,
    Pe,
    fe,
    g,
    I,
    C,
    y,
    m,
    h,
    be,
    Z,
    Y,
    x
  ];
}
class A_ extends M_ {
  constructor(i) {
    super(), T_(this, i, I_, E_, h_, {
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
const XM = "data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Ccircle cx='12' cy='12' r='2.5' stroke='%23000' stroke-linejoin='square'/%3E%3Ccircle cx='12' cy='12' r='3.5' stroke='%23FFF'/%3E%3C/g%3E%3C/svg%3E";
function JM(r) {
  return `data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Ccircle cx='12' cy='12' r='2.5' stroke='%23${r}' stroke-linejoin='square'/%3E%3Ccircle cx='12' cy='12' r='3.5' stroke='%23${r}'/%3E%3C/g%3E%3C/svg%3E`;
}
function Md(r) {
  return `data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg' fill='none'%3E%3Cpath d='M5 12H19' stroke='%23${r}' stroke-linejoin='round'/%3E%3Cpath d='M12 5V19' stroke='%23${r}' stroke-linejoin='round'/%3E%3C/svg%3E`;
}
function Nu(r) {
  return `url("${r}") 12 12, auto`;
}
function R_(r) {
  let i = "";
  for (const o in r)
    i += `.netless-whiteboard.${o} {cursor: ${r[o]}}
`;
  return i;
}
const Wv = document.createElement("style");
function D_(r) {
  const [i, o, c] = r.strokeColor, h = ((1 << 24) + (i << 16) + (o << 8) + c).toString(16).slice(1);
  return Wv.textContent = R_({
    "cursor-pencil": Nu(JM(h)),
    "cursor-eraser": Nu(XM),
    "cursor-rectangle": Nu(Md(h)),
    "cursor-ellipse": Nu(Md(h)),
    "cursor-straight": Nu(Md(h)),
    "cursor-arrow": Nu(Md(h)),
    "cursor-shape": Nu(Md(h))
  }), document.head.appendChild(Wv), () => {
    Wv.parentNode != null && document.head.removeChild(Wv);
  };
}
const N_ = /* @__PURE__ */ new Set([
  Nn.rectangle,
  Nn.ellipse,
  Nn.straight,
  Nn.arrow,
  Nn.shape
]);
function ET(r, i) {
  if (r === Nn.pencil)
    return JM(i);
  if (r === Nn.eraser)
    return XM;
  if (N_.has(r))
    return Md(i);
}
class k_ {
  constructor(i, o, c, h) {
    this.manager = i, this.memberId = o, this.cursorManager = c, this.wrapper = h, this.style = "default", this.move = (m) => {
      var y;
      if (m.type === "main") {
        const g = this.cursorManager.wrapperRect;
        this.component && g && (this.autoHidden(), this.moveCursor(m, g, this.manager.mainView));
      } else {
        const g = this.cursorManager.focusView, x = (y = g == null ? void 0 : g.divElement) == null ? void 0 : y.getBoundingClientRect(), C = g == null ? void 0 : g.camera;
        g && x && C && this.component && (this.autoHidden(), this.moveCursor(m, x, g));
      }
    }, this.setStyle = (m) => {
      this.style = m, this.component && this.component.$set({
        src: this.getIcon(),
        custom: this.isCustomIcon()
      });
    }, this.leave = () => {
      this.hide();
    }, this.updateMember(), this.createCursor(), this.autoHidden(), this.setStyle(c.style);
  }
  moveCursor(i, o, c) {
    var x, C;
    const { x: h, y: m, type: y } = i, g = c == null ? void 0 : c.screen.convertPointToScreen(h, m);
    if (g) {
      let I = g.x - 2, A = g.y - 18;
      if (this.isCustomIcon() && (I -= 11, A += 4), y === "app") {
        const z = this.cursorManager.wrapperRect;
        z && (I = I + o.x - z.x, A = A + o.y - z.y);
      }
      g.x < 0 || g.x > o.width || g.y < 0 || g.y > o.height ? (x = this.component) == null || x.$set({ visible: !1, x: I, y: A }) : (C = this.component) == null || C.$set({ visible: !0, x: I, y: A });
    }
  }
  get memberApplianceName() {
    var i, o;
    return (o = (i = this.member) == null ? void 0 : i.memberState) == null ? void 0 : o.currentApplianceName;
  }
  get memberColor() {
    var o, c;
    return `rgb(${(c = (o = this.member) == null ? void 0 : o.memberState) == null ? void 0 : c.strokeColor.join(",")})`;
  }
  get memberColorHex() {
    var h, m;
    const [i, o, c] = ((m = (h = this.member) == null ? void 0 : h.memberState) == null ? void 0 : m.strokeColor) || [236, 52, 85];
    return ((1 << 24) + (i << 16) + (o << 8) + c).toString(16).slice(1);
  }
  get payload() {
    var i;
    return (i = this.member) == null ? void 0 : i.payload;
  }
  get memberCursorName() {
    var i, o;
    return ((i = this.payload) == null ? void 0 : i.nickName) || ((o = this.payload) == null ? void 0 : o.cursorName) || this.memberId;
  }
  get memberTheme() {
    var i;
    return (i = this.payload) != null && i.theme ? "netless-window-manager-cursor-inner-mellow" : "netless-window-manager-cursor-inner";
  }
  get memberCursorTextColor() {
    var i;
    return ((i = this.payload) == null ? void 0 : i.cursorTextColor) || "#FFFFFF";
  }
  get memberCursorTagBackgroundColor() {
    var i;
    return ((i = this.payload) == null ? void 0 : i.cursorTagBackgroundColor) || this.memberColor;
  }
  get memberAvatar() {
    var i;
    return (i = this.payload) == null ? void 0 : i.avatar;
  }
  get memberOpacity() {
    return !this.memberCursorName && !this.memberAvatar ? 0 : 1;
  }
  get memberTagName() {
    var i;
    return (i = this.payload) == null ? void 0 : i.cursorTagName;
  }
  autoHidden() {
    this.timer && clearTimeout(this.timer), this.timer = window.setTimeout(() => {
      this.hide();
    }, 1e3 * 10);
  }
  async createCursor() {
    this.member && this.wrapper && (this.component = new A_({
      target: this.wrapper,
      props: this.initProps()
    }));
  }
  initProps() {
    var i;
    return {
      uid: this.memberId,
      x: 0,
      y: 0,
      appliance: this.memberApplianceName,
      avatar: this.memberAvatar,
      src: this.getIcon(),
      custom: this.isCustomIcon(),
      visible: !1,
      backgroundColor: this.memberColor,
      cursorName: this.memberCursorName,
      theme: this.memberTheme,
      color: this.memberCursorTextColor,
      cursorTagBackgroundColor: this.memberCursorTagBackgroundColor,
      opacity: this.memberOpacity,
      tagName: this.memberTagName,
      pencilEraserSize: (i = this.member) == null ? void 0 : i.memberState.pencilEraserSize
    };
  }
  getIcon() {
    var x;
    if (!this.member)
      return;
    const { memberApplianceName: i, memberColorHex: o } = this, { userApplianceIcons: c, applianceIcons: h } = this.cursorManager;
    let m = this.memberApplianceName;
    m === Nn.pencilEraser && (m = `${m}${((x = this.member) == null ? void 0 : x.memberState.pencilEraserSize) || 1}`);
    const y = m && c[m];
    if (y)
      return y;
    if (this.style === "custom" && i) {
      const C = ET(i, o);
      if (C)
        return C;
    }
    return h[m || Nn.shape] || h[Nn.shape];
  }
  isCustomIcon() {
    var y;
    if (!this.member)
      return !1;
    const { memberApplianceName: i, memberColorHex: o } = this, { userApplianceIcons: c } = this.cursorManager;
    let h = this.memberApplianceName;
    return h === Nn.pencilEraser && (h = `${h}${((y = this.member) == null ? void 0 : y.memberState.pencilEraserSize) || 1}`), h && c[h] ? !1 : !!(this.style === "custom" && i && ET(i, o));
  }
  updateMember() {
    return this.member = Vb(this.manager.room, this.memberId), this.updateComponent(), this.member;
  }
  updateComponent() {
    var i;
    (i = this.component) == null || i.$set(nS(this.initProps(), ["x", "y"]));
  }
  destroy() {
    this.component && this.component.$destroy(), this.cursorManager.cursorInstances.delete(this.memberId), this.timer && clearTimeout(this.timer);
  }
  hide() {
    this.component && (this.component.$set({ visible: !1 }), this.destroy());
  }
}
const __ = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAA0CAYAAADFeBvrAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAYISURBVHgB7ZpNSCtXFIBPEuvz+dMGpYUKD/sWFX+Qti6kK7Hqpm6e9q0rIoIUFUShPLV10VZx4+JZqa9v20LBhdq9fyBUCtKNPH8qYl2IOw3G38Rkek4y15y5uTOZJDOWggcOSSYzN/ebc+45554JwIM8iBCPyTEP+86T4vyMfsRN4b+nQTKIJp0vzuGvlpID7os8EQNEIBD4oKio6Bm9DwaDv/v9/n/076JgbtWUYPchwrW8qD7UnOvr6wFNkpubm+/wu7f0c7y6mrnlvQufxB0Iau7V1dX3BDA/P6/V1dVpzc3N2uLiIofK1c8VYHys/wRKBUN3/hGHqaysNOjc3FwMis6hc0FtLTHuvYLxCCZgci8uLn4wg5Gh6Fy8Jk+/NkcCAlAAuUkoW4g0B+d5tLS05O/r67O8eGxsDNra2uDy8nKsoKCAwCIQDxQa0yTxgrvCYXyTk5Ml+Orf2dlJeeHIyAigFSE/P38ELfUNqNdSkjgF5FF89jL1TU1NlQwODl5gZPujp6cHWltbUw7Koc7Pz8mkZpHPFeFrJuZeqLnoMoPoZqe0JjDP/IZgnyLUG/o8NDRkuo5Ua2pjY6MC4oFCFf1cA0oKzRSOp6enRfTaGh0d/QxBt+1CUVgnOTs7+xrHfQzGyOcKkK3QTJMnQffZ6e/v/xwttmsHqqmpKXbdycnJCxy7ABLh3FEgVZ6hZJhnFZoFFMF0d3c/w7v+dyookXBnZ2c/xvHfhriVcvXfdBRItsxjnOhYqjwjoAimq6vrCysoGofk+Ph4Esd/F/UdiFtJAGUd2DygTpp5dmBUUJ2dnc9VUALm8PDwJY7/BPU9VD8k3M4RC6kskxZMKigKIMLN9vf3p3H8DyWgfEhEOwOQD9IXOTz7EObbwsLC4YWFBRgeHrY9ECXYo6MjaGlpKWlsbPxkYGDgRW1tbSEWquVlZWXBzc3Nl1VVVa8hXiXc6ioqBqGaPDk7AACJTRZ3NS9lcUp86cJwoSQ7Pj4Op6enfxUXF3/V0NCQv7q6GsCvwrqGUG/01xAD4+VQTOxaSF43d5bBOisrGBJRCtXX17+/trb268rKSgASFgmz97KFkmo6OztWuVyPweiWGc4WRkhFRQVEIpHg8vJyQAIQVlLBROVxvBYQHsXnO8tk62ZcyN0wecLBwcEvYHSzEPscBqOLCRhLC4n9uqaA8UAWAcAKhtbQ3t7eTHl5+Y9gtAp3twhT056CDMQ7MRzIFTeTYKb1yYYVQFH9VdzsqNmYKpfTJBDX3Ixgdnd3XyHMT2AMALJlBBSPaMpNngrIsTyTCgaj288YDGakictrxizvKFNOjgSSBLS+vv6UYHDb7DgMVgsChjTEgCIKGG4ZU+EWkgNBzN1qamq+pAMTExPgFMzW1tZrhHkFyWE5KxgSszx0527RaDRmOSpRshEOU11dPQPG8CwHARHJlMnTSrwSRFIlfXt7m3V5ngJGuJtqzaQtZkFBVNJezN5ZAdmwjKo2k9tVtrcI3OXk4tPgcg7ChCDZ1URgMOu72Xa5VFHOkymQhWVU60YVmjN6wiC7k6p+S1syCACOwJBYFaexV+yhBekNPsMBO6KAEeE4BMaCU67RsoYhSbXgaT//ht709vZCaWmp6YkEbLFmVJWzas04+iBL7EKpm0J7duqu0B7+CTUpNJuyvb1NCfMj1CqI9wLKUOlOUMeG+gGFkHii4HizUF4z/KFUrPsJ8WbEIyx7nnZ0dDynME6BAuce09iFHo+GrnmGltltb2//E4wVAN82y7vOjKOZXSBhJdHNiT3TYWD8OY2PTUJkdd7MkJMnT5wZVQF2RFX6yBMUdzPMvvfqxz3sXHF+GNT9ANXit/10O1sgHkZvdQAOKvs9B5L7ARELGAAXLSTvM8QExTE+YbHe+HURhZp1aRyF4CJXClbbWwGketgkW9VsY+YaiBCVhfgE+XvxRwgZSM4jUVCDZFQ9pytmXR8hUTB2gnidx4XffVWydN0yQjwmx/jkAZJBrIBI5J7ZvQGZWUgVSuU/EqmOAzicKNMVu816DdRWUV1/7xAP8n+SfwF3Du3NF2sYhwAAAABJRU5ErkJggg==", P_ = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADEAAAAxCAYAAABznEEcAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAZoSURBVHgB7VlLSCRXFL3ljNEhEXTGhMQJmOjCz8ZNVLKICz9xIYhCNi7UgINkGEk2En8hW5cBUQNxo05GAoKikuCAmvGzGMdPcCUGjDPxD/4Vv/3JvWW97luvq7ur+hMZ8MKlqrteNfe8e965970GuLVbC5kpJr53+hjHx9yY3TUxJgLMAQG4ITARfp5T4Mri4uL9q6urnxwOxz/oY5eXl1/Pzs7e195X2FX4jZsIhAK7gx5ps9m6nGj9/f3OtbU1pzAE0318fPwVjYHrrN7R3AjU/wpOBwA9Cmf/9ejoqDMtLU31iooKGdA+ATo4OMiXAEWAHhBAGEApXj4rPAik0vPt7e0vCgoKPH4gMzMTSktLIS8vD2JiYgABvcHMTZyennbHxsaOg3udOJmLzwqEYB0ZgRCZENm4u7e39yQuLq65srISZmZmvP5Ybm4u5OfnQ0lJyXWUCAgzNLS+vt6SnJz8WgvYwV5xSlcRgyVg3ha2Dkxzc3MvfZmVlQW+bGxsDBobGyE7O1u94uJPjIqKqklKSvrbbrfPnp+ff7e8vJwMnlSTKWfJjDKhywJo6wLp0YcZ+dyIUr7s4cOHLsrRlQwBTSBFuzc2NiZYhjjVAIyzZBqEwgCQv0OOM/gNzuiP/ijlDxBRjgClpqa6AF1cXDydmpoaLCws3JcAGYHyC4JMzoKaibKysvienp6FtrY2IA/WCFB5ebkqCHSvARo8Ozt7igIxwIJ2gJ+seFMnDoIyEUV+dHT0G3qWVUr5M043DdAB0m2IKZwAYpgZX+qkywR6NFbuR0iDxmAoZRUQKRxSLTMnJ8eIaqqSeVMnIYUOdu+sq6vrp4f+VCoYo8khZaNs01VRlERUu2/BrWAA7sl2Anink1Ao18JGjyY/PDx8hq1GZqgp5c2mp6chMjLy2b179x7hRzvoqeUUwXIzqq4O5nZsNUaEbIbLqPLTou/s7FTvT05OpsA9sXJG1AVsZDwjutqBIN6gUlWjxod8XRBNKXgsrqpqYZfwEqX9h8TExD7wbFm8LmzxHQ0QHSlXKZVSqFC/hkqlaKapTaGgCQTK7PHW1lb/wsLC86KiokkccoV+qV1tcE0pO7AWxmhTxBszDzqRr66ujqanp2cRpQLNBgUsCh8BwQ54bn5+/s+mpqa+4eHhfS1gb52vwuP0trPjhSZCBtLQ0NA3MDDQQIFYAUHBYhuvzjpVbJr1lZWVP3p7e19UVVXNgHumXYrI4uBx6Yqevz02b0FcRQ8CoBQF3dXVpQLZ3d39C7n+ora29vfJyclDYFnWgFyxK3cxhss/+KoT/N6DVkQpKypFGUCp3Ozo6HgSHx//GLW/BwHsg57zl5pzADajwLn52mPL1ZHPloMoRYPMFL6EhAR18e7s7MxVV1fPsAAp4Avteq7dC/c1+wKI4g+EfGzDM+EYHBw8RDrNiA2QL6upqVGvKJ2/gHu2L1nA5wwEB2YDfSYMO1x/px0cgEc2zBY+eo67u6H29vZ/wU2VC8l58JxKNjDOgojNEp08aFVfX++3l6JMEdDx8fEB0FNIBsDXBc8ArwuW1EkeI1RKdLWmCx+1DhkZGRvR0dFfSsHKxYtnW0iqvJAN9xNm6MR/QO5sfapUSkqKmqW5ubmfwVgyZdpw/vPZl2kUEAinBMSUStG+gwra0NDQSynQKyloIxnlewafjDFLJzLRBJqiFMnqyMgIbG5uDuD996Dnv8iAPOMAPmbcm5lVJwA/vZRMKZGZlpaWVtAvUL4GZMqE1fjRJrUd76LHoX+InlhcXPwZnWW2tra6jjrpiBM3UK/weQr6J+gfodMh9HtwncG7YLA3CMSsLmxx5WuDCt8B7vZeicInTjCWlpb6wc15mfey7oc9E8LElpVmMgb9AXoC+qcTExOPKRu4NlTHs6Q10GfhgfYOvRsJQZ76BWMKuDtaolQs+gfoH6Mn436gDg+e+5BKXUQx/C5Je/a+NpbeiQJPKgUdlNXx/BCBKxVdxW5Q0I3XBqFKRhU4KLtjYawi3csuTKdc4FnIXNvKUJkVEGRG20QZAAUpA5DbaYAQLmQzfzxyk/ffdnCD4NWVnGdE7kQBQvQHC5lVEDxgMaM29lkxGCNLKrDnIbFAMkFmBIaDkHstU41coGZ1TZD5UjReCGUAYbNgdNqoXZB/T67yYbFAMiGML3BhYeH8rb0t9h/zgcTBcTNGiQAAAABJRU5ErkJggg==", z_ = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAA0CAYAAADFeBvrAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAgrSURBVHgB7ZprTBRXFIDP7gIt8lQppTwE5V0KaAn6o1pqNGkDDTEmTUhsgKRp+gNJw68CFkLbVC2QkDS+gD8KJdWmARvbFBNNWpuIRGPFWBXQRMPDqIki+KLATs+ZnTvcvXtnX8w2beJJToaduTP3fHPOPffcOwC8kP+2WCDwIvahGFxTuN8KmNSZmULPNjLeqF9F8rdPkIEGEn+r+vjx46LQ0NA8/Dsader58+e/h4WFDWntFO7ot6fMFAt3JLWi2lCDpqamCux2+2+KROj82NhYGrXT2lu5Z/DP/deFByElA4Pv3LlTiHY/nJ6eVnbv3q1s2bJFyc7OVrZu3arU1dUp4+PjxPUQoT+g9tp9PkMFgpo9kxljHRoaWp2Xl3duYmIiurKyEvDoclNCQgIcPnxYPc7MzHwcGRnZhaft4Ag7O9fUbRhaITCie4lgcnNzT7qDIaHz27dvh+vXr0NEREQneqoCHKFnAR+8ZCaQGGq2CxcurCGYycnJZHcwTNAzUFFRoUJFRUV1IFQ5OKBsXB9uxSwgl0TQ3d29Yt26dccwoyVXV1d7hGEiQmGi2AzOUHx/hob4K2yuYS9G987s7OwPISEh7xPM6dOnwVfBsIMjR45AZmbmo5s3b76Xnp7+J55egMVxBSAZT0v1ED+76yn66dOnLQSzd+9ev2BIyFP0MjBco1JTU/sxfFeDazp3cYgZHmKqdoaGNISHh9fv378fSJcqlPV6e3sBJ+I/goOD34VFL0k95Y+HxPHCYGxmw5DQ2NuzZw8EBQVtunXr1jvgwUP+hhz/QDXMMCNVE8zx48dNg2FCz6QQjI2N/RA8VBFmANnu3btXihnpG8pM9fX1EAi5du0aeWkVOAMBCF7yN+R0z4yOjq6NiYlpp9CgdBtIwXpPH6vgDKWLt0CygtM6MDCwBuUYZSKaOCksAiVY9wFOBePgDOOytPAGSKzNVCCC2bBhw69YdK7ypgpYimzbtk2dl7CM+hFcveOUHDylbTFO1YdhFbByx44dA1QFUP0VSJj4+Hjo6+sDq9U6iEmHKvFZTedQ50GYbN15SITVlwNlZWUnLRZL8s6dOwMOQ9UCTtKTra2ttdppt9V2kMF5cbmsjxuM43bMNrmUzc6fP6+GQiDGDoOJi4ubwb4qm5ubafyIE6nLxGqTPEsGo1cBOGNX0TyDYafC0CyOaxcVziyh53Z2dkJycvLMvn37PmpoaBgFR4jxYSbWdVIgI89Iq4CjR48CZjlYv369+tssqI6ODsjPz4f+/v668vLycxrEHHfkYdwC8SB6mGEV8Cl64cuuri5oa2tTG+EyGjZu3AiXLl1qefDgwV8lJSUFZkDV1tZCcXExXLx4sbWoqKgPFj0zx8GI9ZwO5W4M6ekZYeqpaqbqmaSqqkpNpcPDw4dwzfM9nrLduHEjEs+X0XV/Sx96LnqE1kLtBQUF3eDwCO8dGQyzV5rl+JyuegfXI29jRotiRlKnpFghHMzKyjqotVXS0tLacKPjF3bdHxjSq1evduAkepAD+ZsDYlC8V5w8ZBVg+PPq2MGMlkInqE4joTf45MmT4YyMjAPcA+ltLSQlJX2BafxnX6HI29QeK44TOTk57mCYZ0QoJ8OBM4yB6dkNkwGlSygsLFQvYtYB3BTMxFL+M+0eFgZqp4mJiU2+QKGX1fGIk/QIrn0aYXGsyDxjmAyMhO2jhaCGoUbX1NSkLSwsPMJqV8Fspu6lIZS6OYhjiOLwdU7fQM1HfRPD7wS1obZ0j0xpb4726Z49ezaJf2/S7s9ATUGNR41BjdJseRnke3WGwhrRTS9pD1mOGoeG15BxOOfoxuCkp0Ih6NeaEaSZGlieJyiCoc1FgsGldokGk8nBvAKOrWIGQ5uPsm0tt0BWDiicAaGuGhkZ+YqMw9StGzU4OKhCnT179hNsswY1FTXdE5QEJhc1S3tGogazXLOBwQSBl3tzIhQPtAL1VQJCTcNx8y1vHIUghSKFZE9PT7H2dlM1b+Wgrr1y5Uq77J75+fnplpaWMg2ch4nlYEI5z7hdensDpI4hrYNErcMMXJ32koG4ztf3pultz83NjWG99Ra2WQ0OL2VjZjwgeufUqVOqV8+cOdPIwdBLSNJeHg8TAh5WqJ6EfSmgt7IMNRJ1JThiOlnrOAMHshprmMKdoGSCpb9s3B3SYLIFGIqICJB7xisYi+RvfiypXw40DWGdlJaWRmMd141hk8V2OWm7ieYTXhBc3+BgaZyqAISjOYxSMVvXsBTNlzdiNQDgRao2AtK3pjggpmrqbGpqSsLPIN/dv38/gaBwUjTshMHcvn27JyUlpRmc5xpPMD599LIYnLNyUKKndKjGxsakXbt2deMCLIE8IVvs0YRM1fjdu3d/wrXN5+BcnzEgvor2uN3rjzAYMp5lPEoQlE5fA0fWo8GfhlCbKVFQ1pKNIfzcOHH58mWqaimVUwJI0+6n59D4pIlzmdZPMPiZzXjDjX47Le5g0Uu8x2zgPqWyKpjVe7x3+AUbq9NYjQbgp2dsBud5o8TP7d5kHAWcQchQfoEmLgn8HjOiBIF7o5hI1x6CEbLNP3bdqYAF44JzyWLzcN1i8DcT/o3awbm8Fz3DAy2A62INwPV/E3wWdx5inmBHuwChCBD6R2JwHge80TIQRQLjt7e8DTkGZgfX8cUMZTDAteFDkveaIlzjX9ySQs8X18r2t2VHUURPKoICmDR+eCO9aSdmOIub3/w9RgpgUpiJhvraXpa6jZKHGEqyusw0GLFzX+5RhN/8kYnMSNMMfyH/V/kHST6OYVElTPAAAAAASUVORK5CYII=", O_ = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNDBweCIgaGVpZ2h0PSI0MHB4IiB2aWV3Qm94PSIwIDAgNDAgNDAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDYwLjEgKDg4MTMzKSAtIGh0dHBzOi8vc2tldGNoLmNvbSAtLT4KICAgIDx0aXRsZT5zaGFwZS1jdXJzb3I8L3RpdGxlPgogICAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CiAgICA8ZGVmcz4KICAgICAgICA8cGF0aCBkPSJNMjAsMjEuNSBDMjAuMjQ1NDU5OSwyMS41IDIwLjQ0OTYwODQsMjEuNjc2ODc1MiAyMC40OTE5NDQzLDIxLjkxMDEyNDQgTDIwLjUsMjIgTDIwLjUsMjcgQzIwLjUsMjcuMjc2MTQyNCAyMC4yNzYxNDI0LDI3LjUgMjAsMjcuNSBDMTkuNzU0NTQwMSwyNy41IDE5LjU1MDM5MTYsMjcuMzIzMTI0OCAxOS41MDgwNTU3LDI3LjA4OTg3NTYgTDE5LjUsMjcgTDE5LjUsMjIgQzE5LjUsMjEuNzIzODU3NiAxOS43MjM4NTc2LDIxLjUgMjAsMjEuNSBaIE0yNywxOS41IEMyNy4yNzYxNDI0LDE5LjUgMjcuNSwxOS43MjM4NTc2IDI3LjUsMjAgQzI3LjUsMjAuMjQ1NDU5OSAyNy4zMjMxMjQ4LDIwLjQ0OTYwODQgMjcuMDg5ODc1NiwyMC40OTE5NDQzIEwyNywyMC41IEwyMiwyMC41IEMyMS43MjM4NTc2LDIwLjUgMjEuNSwyMC4yNzYxNDI0IDIxLjUsMjAgQzIxLjUsMTkuNzU0NTQwMSAyMS42NzY4NzUyLDE5LjU1MDM5MTYgMjEuOTEwMTI0NCwxOS41MDgwNTU3IEwyMiwxOS41IEwyNywxOS41IFogTTE4LDE5LjUgQzE4LjI3NjE0MjQsMTkuNSAxOC41LDE5LjcyMzg1NzYgMTguNSwyMCBDMTguNSwyMC4yNDU0NTk5IDE4LjMyMzEyNDgsMjAuNDQ5NjA4NCAxOC4wODk4NzU2LDIwLjQ5MTk0NDMgTDE4LDIwLjUgTDEzLDIwLjUgQzEyLjcyMzg1NzYsMjAuNSAxMi41LDIwLjI3NjE0MjQgMTIuNSwyMCBDMTIuNSwxOS43NTQ1NDAxIDEyLjY3Njg3NTIsMTkuNTUwMzkxNiAxMi45MTAxMjQ0LDE5LjUwODA1NTcgTDEzLDE5LjUgTDE4LDE5LjUgWiBNMjAsMTIuNSBDMjAuMjQ1NDU5OSwxMi41IDIwLjQ0OTYwODQsMTIuNjc2ODc1MiAyMC40OTE5NDQzLDEyLjkxMDEyNDQgTDIwLjUsMTMgTDIwLjUsMTggQzIwLjUsMTguMjc2MTQyNCAyMC4yNzYxNDI0LDE4LjUgMjAsMTguNSBDMTkuNzU0NTQwMSwxOC41IDE5LjU1MDM5MTYsMTguMzIzMTI0OCAxOS41MDgwNTU3LDE4LjA4OTg3NTYgTDE5LjUsMTggTDE5LjUsMTMgQzE5LjUsMTIuNzIzODU3NiAxOS43MjM4NTc2LDEyLjUgMjAsMTIuNSBaIiBpZD0icGF0aC0xIj48L3BhdGg+CiAgICAgICAgPGZpbHRlciB4PSItNjQuNiUiIHk9Ii01OS41JSIgd2lkdGg9IjIyOS4zJSIgaGVpZ2h0PSIyNDYuMSUiIGZpbHRlclVuaXRzPSJvYmplY3RCb3VuZGluZ0JveCIgaWQ9ImZpbHRlci0yIj4KICAgICAgICAgICAgPGZlTW9ycGhvbG9neSByYWRpdXM9IjEiIG9wZXJhdG9yPSJkaWxhdGUiIGluPSJTb3VyY2VBbHBoYSIgcmVzdWx0PSJzaGFkb3dTcHJlYWRPdXRlcjEiPjwvZmVNb3JwaG9sb2d5PgogICAgICAgICAgICA8ZmVPZmZzZXQgZHg9IjAiIGR5PSIyIiBpbj0ic2hhZG93U3ByZWFkT3V0ZXIxIiByZXN1bHQ9InNoYWRvd09mZnNldE91dGVyMSI+PC9mZU9mZnNldD4KICAgICAgICAgICAgPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMyIgaW49InNoYWRvd09mZnNldE91dGVyMSIgcmVzdWx0PSJzaGFkb3dCbHVyT3V0ZXIxIj48L2ZlR2F1c3NpYW5CbHVyPgogICAgICAgICAgICA8ZmVDb21wb3NpdGUgaW49InNoYWRvd0JsdXJPdXRlcjEiIGluMj0iU291cmNlQWxwaGEiIG9wZXJhdG9yPSJvdXQiIHJlc3VsdD0ic2hhZG93Qmx1ck91dGVyMSI+PC9mZUNvbXBvc2l0ZT4KICAgICAgICAgICAgPGZlQ29sb3JNYXRyaXggdmFsdWVzPSIwIDAgMCAwIDAgICAwIDAgMCAwIDAgICAwIDAgMCAwIDAgIDAgMCAwIDAuMTYgMCIgdHlwZT0ibWF0cml4IiBpbj0ic2hhZG93Qmx1ck91dGVyMSI+PC9mZUNvbG9yTWF0cml4PgogICAgICAgIDwvZmlsdGVyPgogICAgPC9kZWZzPgogICAgPGcgaWQ9Iumhtemdoi00IiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8ZyBpZD0iV2hpdGVib2FyZC1HdWlkZWxpbmVzIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMzQ0LjAwMDAwMCwgLTc1MS4wMDAwMDApIj4KICAgICAgICAgICAgPGcgaWQ9InNoYXBlLWN1cnNvciIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzQ0LjAwMDAwMCwgNzUxLjAwMDAwMCkiPgogICAgICAgICAgICAgICAgPHJlY3QgaWQ9IuefqeW9ouWkh+S7vS00NCIgZmlsbD0iI0ZGRkZGRiIgb3BhY2l0eT0iMC4wMSIgeD0iMCIgeT0iMCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMiI+PC9yZWN0PgogICAgICAgICAgICAgICAgPGcgaWQ9IuW9oueKtue7k+WQiCIgZmlsbC1ydWxlPSJub256ZXJvIj4KICAgICAgICAgICAgICAgICAgICA8dXNlIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjEiIGZpbHRlcj0idXJsKCNmaWx0ZXItMikiIHhsaW5rOmhyZWY9IiNwYXRoLTEiPjwvdXNlPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIxIiBkPSJNMjAsMjEgQzIwLjQ4NTQxMDMsMjEgMjAuODk4MDg1LDIxLjM0Nzk5OTMgMjAuOTg5OTQ3OSwyMS44NjU0ODc3IEwyMSwyMiBMMjEsMjcgQzIxLDI3LjU1MjI4NDcgMjAuNTUyMjg0NywyOCAyMCwyOCBDMTkuNTE0NTg5NywyOCAxOS4xMDE5MTUsMjcuNjUyMDAwNyAxOS4wMTAwNTIxLDI3LjEzNDUxMjMgTDE5LDI3IEwxOSwyMiBDMTksMjEuNDQ3NzE1MyAxOS40NDc3MTUzLDIxIDIwLDIxIFogTTI3LDE5IEMyNy41NTIyODQ3LDE5IDI4LDE5LjQ0NzcxNTMgMjgsMjAgQzI4LDIwLjQ4NTQxMDMgMjcuNjUyMDAwNywyMC44OTgwODUgMjcuMTM0NTEyMywyMC45ODk5NDc5IEwyNywyMSBMMjIsMjEgQzIxLjQ0NzcxNTMsMjEgMjEsMjAuNTUyMjg0NyAyMSwyMCBDMjEsMTkuNTE0NTg5NyAyMS4zNDc5OTkzLDE5LjEwMTkxNSAyMS44NjU0ODc3LDE5LjAxMDA1MjEgTDIyLDE5IEwyNywxOSBaIE0xOCwxOSBDMTguNTUyMjg0NywxOSAxOSwxOS40NDc3MTUzIDE5LDIwIEMxOSwyMC40ODU0MTAzIDE4LjY1MjAwMDcsMjAuODk4MDg1IDE4LjEzNDUxMjMsMjAuOTg5OTQ3OSBMMTgsMjEgTDEzLDIxIEMxMi40NDc3MTUzLDIxIDEyLDIwLjU1MjI4NDcgMTIsMjAgQzEyLDE5LjUxNDU4OTcgMTIuMzQ3OTk5MywxOS4xMDE5MTUgMTIuODY1NDg3NywxOS4wMTAwNTIxIEwxMywxOSBMMTgsMTkgWiBNMjAsMTIgQzIwLjQ4NTQxMDMsMTIgMjAuODk4MDg1LDEyLjM0Nzk5OTMgMjAuOTg5OTQ3OSwxMi44NjU0ODc3IEwyMSwxMyBMMjEsMTggQzIxLDE4LjU1MjI4NDcgMjAuNTUyMjg0NywxOSAyMCwxOSBDMTkuNTE0NTg5NywxOSAxOS4xMDE5MTUsMTguNjUyMDAwNyAxOS4wMTAwNTIxLDE4LjEzNDUxMjMgTDE5LDE4IEwxOSwxMyBDMTksMTIuNDQ3NzE1MyAxOS40NDc3MTUzLDEyIDIwLDEyIFoiIGZpbGw9IiMyMTIzMjQiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PC9wYXRoPgogICAgICAgICAgICAgICAgPC9nPgogICAgICAgICAgICAgICAgPHJlY3QgaWQ9IuefqeW9oiIgZmlsbD0iI0ZGRkZGRiIgeD0iMTguNSIgeT0iMTciIHdpZHRoPSIzIiBoZWlnaHQ9IjYiPjwvcmVjdD4KICAgICAgICAgICAgICAgIDxyZWN0IGlkPSLnn6nlvaIiIGZpbGw9IiNGRkZGRkYiIHg9IjE3IiB5PSIxOC41IiB3aWR0aD0iNiIgaGVpZ2h0PSIzIj48L3JlY3Q+CiAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMjAsMjEuNSBDMjAuMjQ1NDU5OSwyMS41IDIwLjQ0OTYwODQsMjEuNjc2ODc1MiAyMC40OTE5NDQzLDIxLjkxMDEyNDQgTDIwLjUsMjIgTDIwLjUsMjcgQzIwLjUsMjcuMjc2MTQyNCAyMC4yNzYxNDI0LDI3LjUgMjAsMjcuNSBDMTkuNzU0NTQwMSwyNy41IDE5LjU1MDM5MTYsMjcuMzIzMTI0OCAxOS41MDgwNTU3LDI3LjA4OTg3NTYgTDE5LjUsMjcgTDE5LjUsMjIgQzE5LjUsMjEuNzIzODU3NiAxOS43MjM4NTc2LDIxLjUgMjAsMjEuNSBaIE0yNywxOS41IEMyNy4yNzYxNDI0LDE5LjUgMjcuNSwxOS43MjM4NTc2IDI3LjUsMjAgQzI3LjUsMjAuMjQ1NDU5OSAyNy4zMjMxMjQ4LDIwLjQ0OTYwODQgMjcuMDg5ODc1NiwyMC40OTE5NDQzIEwyNywyMC41IEwyMiwyMC41IEMyMS43MjM4NTc2LDIwLjUgMjEuNSwyMC4yNzYxNDI0IDIxLjUsMjAgQzIxLjUsMTkuNzU0NTQwMSAyMS42NzY4NzUyLDE5LjU1MDM5MTYgMjEuOTEwMTI0NCwxOS41MDgwNTU3IEwyMiwxOS41IEwyNywxOS41IFogTTE4LDE5LjUgQzE4LjI3NjE0MjQsMTkuNSAxOC41LDE5LjcyMzg1NzYgMTguNSwyMCBDMTguNSwyMC4yNDU0NTk5IDE4LjMyMzEyNDgsMjAuNDQ5NjA4NCAxOC4wODk4NzU2LDIwLjQ5MTk0NDMgTDE4LDIwLjUgTDEzLDIwLjUgQzEyLjcyMzg1NzYsMjAuNSAxMi41LDIwLjI3NjE0MjQgMTIuNSwyMCBDMTIuNSwxOS43NTQ1NDAxIDEyLjY3Njg3NTIsMTkuNTUwMzkxNiAxMi45MTAxMjQ0LDE5LjUwODA1NTcgTDEzLDE5LjUgTDE4LDE5LjUgWiBNMjAsMTIuNSBDMjAuMjQ1NDU5OSwxMi41IDIwLjQ0OTYwODQsMTIuNjc2ODc1MiAyMC40OTE5NDQzLDEyLjkxMDEyNDQgTDIwLjUsMTMgTDIwLjUsMTggQzIwLjUsMTguMjc2MTQyNCAyMC4yNzYxNDI0LDE4LjUgMjAsMTguNSBDMTkuNzU0NTQwMSwxOC41IDE5LjU1MDM5MTYsMTguMzIzMTI0OCAxOS41MDgwNTU3LDE4LjA4OTg3NTYgTDE5LjUsMTggTDE5LjUsMTMgQzE5LjUsMTIuNzIzODU3NiAxOS43MjM4NTc2LDEyLjUgMjAsMTIuNSBaIiBpZD0i5b2i54q257uT5ZCIIiBmaWxsPSIjMjEyMzI0IiBmaWxsLXJ1bGU9Im5vbnplcm8iPjwvcGF0aD4KICAgICAgICAgICAgPC9nPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+", L_ = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNDdweCIgaGVpZ2h0PSI0MHB4IiB2aWV3Qm94PSIwIDAgNDcgNDAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDYwLjEgKDg4MTMzKSAtIGh0dHBzOi8vc2tldGNoLmNvbSAtLT4KICAgIDx0aXRsZT50ZXh0LWN1cnNvcjwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPgogICAgICAgIDxwYXRoIGQ9Ik0xNiwyNi41IEMxNS43MjM4NTc2LDI2LjUgMTUuNSwyNi4yNzYxNDI0IDE1LjUsMjYgQzE1LjUsMjUuNzU0NTQwMSAxNS42NzY4NzUyLDI1LjU1MDM5MTYgMTUuOTEwMTI0NCwyNS41MDgwNTU3IEwxNiwyNS41IEwxOS41LDI1LjUgTDE5LjUsMTQuNSBMMTYsMTQuNSBDMTUuNzIzODU3NiwxNC41IDE1LjUsMTQuMjc2MTQyNCAxNS41LDE0IEMxNS41LDEzLjc1NDU0MDEgMTUuNjc2ODc1MiwxMy41NTAzOTE2IDE1LjkxMDEyNDQsMTMuNTA4MDU1NyBMMTYsMTMuNSBMMjQsMTMuNSBDMjQuMjc2MTQyNCwxMy41IDI0LjUsMTMuNzIzODU3NiAyNC41LDE0IEMyNC41LDE0LjI0NTQ1OTkgMjQuMzIzMTI0OCwxNC40NDk2MDg0IDI0LjA4OTg3NTYsMTQuNDkxOTQ0MyBMMjQsMTQuNSBMMjAuNSwxNC41IEwyMC41LDI1LjUgTDI0LDI1LjUgQzI0LjI3NjE0MjQsMjUuNSAyNC41LDI1LjcyMzg1NzYgMjQuNSwyNiBDMjQuNSwyNi4yNDU0NTk5IDI0LjMyMzEyNDgsMjYuNDQ5NjA4NCAyNC4wODk4NzU2LDI2LjQ5MTk0NDMgTDI0LDI2LjUgTDE2LDI2LjUgWiIgaWQ9InBhdGgtMSI+PC9wYXRoPgogICAgICAgIDxmaWx0ZXIgeD0iLTI4NC4wJSIgeT0iLTgxLjUlIiB3aWR0aD0iNjY4LjElIiBoZWlnaHQ9IjI5My45JSIgZmlsdGVyVW5pdHM9Im9iamVjdEJvdW5kaW5nQm94IiBpZD0iZmlsdGVyLTIiPgogICAgICAgICAgICA8ZmVNb3JwaG9sb2d5IHJhZGl1cz0iMSIgb3BlcmF0b3I9ImRpbGF0ZSIgaW49IlNvdXJjZUFscGhhIiByZXN1bHQ9InNoYWRvd1NwcmVhZE91dGVyMSI+PC9mZU1vcnBob2xvZ3k+CiAgICAgICAgICAgIDxmZU9mZnNldCBkeD0iMCIgZHk9IjIiIGluPSJzaGFkb3dTcHJlYWRPdXRlcjEiIHJlc3VsdD0ic2hhZG93T2Zmc2V0T3V0ZXIxIj48L2ZlT2Zmc2V0PgogICAgICAgICAgICA8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIzIiBpbj0ic2hhZG93T2Zmc2V0T3V0ZXIxIiByZXN1bHQ9InNoYWRvd0JsdXJPdXRlcjEiPjwvZmVHYXVzc2lhbkJsdXI+CiAgICAgICAgICAgIDxmZUNvbXBvc2l0ZSBpbj0ic2hhZG93Qmx1ck91dGVyMSIgaW4yPSJTb3VyY2VBbHBoYSIgb3BlcmF0b3I9Im91dCIgcmVzdWx0PSJzaGFkb3dCbHVyT3V0ZXIxIj48L2ZlQ29tcG9zaXRlPgogICAgICAgICAgICA8ZmVDb2xvck1hdHJpeCB2YWx1ZXM9IjAgMCAwIDAgMCAgIDAgMCAwIDAgMCAgIDAgMCAwIDAgMCAgMCAwIDAgMC4xNiAwIiB0eXBlPSJtYXRyaXgiIGluPSJzaGFkb3dCbHVyT3V0ZXIxIj48L2ZlQ29sb3JNYXRyaXg+CiAgICAgICAgPC9maWx0ZXI+CiAgICA8L2RlZnM+CiAgICA8ZyBpZD0i6aG16Z2iLTQiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxnIGlkPSJXaGl0ZWJvYXJkLUd1aWRlbGluZXMiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zODguMDAwMDAwLCAtNjcyLjAwMDAwMCkiPgogICAgICAgICAgICA8ZyBpZD0idGV4dC1jdXJzb3IiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDM5Mi4wMDAwMDAsIDY3Mi4wMDAwMDApIj4KICAgICAgICAgICAgICAgIDxyZWN0IGlkPSLnn6nlvaLlpIfku70tNDAiIGZpbGw9IiNGRkZGRkYiIG9wYWNpdHk9IjAuMDEiIHg9IjAiIHk9IjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcng9IjIiPjwvcmVjdD4KICAgICAgICAgICAgICAgIDxnIGlkPSLlvaLnirbnu5PlkIgiIGZpbGwtcnVsZT0ibm9uemVybyI+CiAgICAgICAgICAgICAgICAgICAgPHVzZSBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIxIiBmaWx0ZXI9InVybCgjZmlsdGVyLTIpIiB4bGluazpocmVmPSIjcGF0aC0xIj48L3VzZT4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMSIgZD0iTTE5LDI1IEwxOSwxNSBMMTYsMTUgQzE1LjQ0NzcxNTMsMTUgMTUsMTQuNTUyMjg0NyAxNSwxNCBDMTUsMTMuNTE0NTg5NyAxNS4zNDc5OTkzLDEzLjEwMTkxNSAxNS44NjU0ODc3LDEzLjAxMDA1MjEgTDE2LDEzIEwyNCwxMyBDMjQuNTUyMjg0NywxMyAyNSwxMy40NDc3MTUzIDI1LDE0IEMyNSwxNC40ODU0MTAzIDI0LjY1MjAwMDcsMTQuODk4MDg1IDI0LjEzNDUxMjMsMTQuOTg5OTQ3OSBMMjQsMTUgTDIxLDE1IEwyMSwyNSBMMjQsMjUgQzI0LjU1MjI4NDcsMjUgMjUsMjUuNDQ3NzE1MyAyNSwyNiBDMjUsMjYuNDg1NDEwMyAyNC42NTIwMDA3LDI2Ljg5ODA4NSAyNC4xMzQ1MTIzLDI2Ljk4OTk0NzkgTDI0LDI3IEwxNiwyNyBDMTUuNDQ3NzE1MywyNyAxNSwyNi41NTIyODQ3IDE1LDI2IEMxNSwyNS41MTQ1ODk3IDE1LjM0Nzk5OTMsMjUuMTAxOTE1IDE1Ljg2NTQ4NzcsMjUuMDEwMDUyMSBMMTYsMjUgTDE5LDI1IFoiIGZpbGw9IiMyMTIzMjQiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PC9wYXRoPgogICAgICAgICAgICAgICAgPC9nPgogICAgICAgICAgICA8L2c+CiAgICAgICAgPC9nPgogICAgPC9nPgo8L3N2Zz4=", B_ = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMjhweCIgaGVpZ2h0PSIyOHB4IiB2aWV3Qm94PSIwIDAgMjggMjgiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDU1LjEgKDc4MTM2KSAtIGh0dHBzOi8vc2tldGNoYXBwLmNvbSAtLT4KICAgIDx0aXRsZT7nvJbnu4QgMjwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPgogICAgICAgIDxmaWx0ZXIgeD0iLTEyMC4wJSIgeT0iLTEyMC4wJSIgd2lkdGg9IjM0MC4wJSIgaGVpZ2h0PSIzNDAuMCUiIGZpbHRlclVuaXRzPSJvYmplY3RCb3VuZGluZ0JveCIgaWQ9ImZpbHRlci0xIj4KICAgICAgICAgICAgPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iNCIgaW49IlNvdXJjZUdyYXBoaWMiPjwvZmVHYXVzc2lhbkJsdXI+CiAgICAgICAgPC9maWx0ZXI+CiAgICA8L2RlZnM+CiAgICA8ZyBpZD0i6aG16Z2iMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9Iue8lue7hC0yIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg5LjAwMDAwMCwgOS4wMDAwMDApIiBmaWxsPSIjRkYwMTAwIj4KICAgICAgICAgICAgPGNpcmNsZSBpZD0i5qSt5ZyG5b2iIiBmaWx0ZXI9InVybCgjZmlsdGVyLTEpIiBjeD0iNSIgY3k9IjUiIHI9IjUiPjwvY2lyY2xlPgogICAgICAgICAgICA8cGF0aCBkPSJNNSw4IEM2LjY1Njg1NDI1LDggOCw2LjY1Njg1NDI1IDgsNSBDOCwzLjM0MzE0NTc1IDYuNjU2ODU0MjUsMiA1LDIgQzMuMzQzMTQ1NzUsMiAyLDMuMzQzMTQ1NzUgMiw1IEMyLDYuNjU2ODU0MjUgMy4zNDMxNDU3NSw4IDUsOCBaIE01LDYuMjg1NzE0MjkgQzQuMjg5OTE5NjEsNi4yODU3MTQyOSAzLjcxNDI4NTcxLDUuNzEwMDgwMzkgMy43MTQyODU3MSw1IEMzLjcxNDI4NTcxLDQuMjg5OTE5NjEgNC4yODk5MTk2MSwzLjcxNDI4NTcxIDUsMy43MTQyODU3MSBDNS43MTAwODAzOSwzLjcxNDI4NTcxIDYuMjg1NzE0MjksNC4yODk5MTk2MSA2LjI4NTcxNDI5LDUgQzYuMjg1NzE0MjksNS43MTAwODAzOSA1LjcxMDA4MDM5LDYuMjg1NzE0MjkgNSw2LjI4NTcxNDI5IFoiIGlkPSLmpK3lnIblvaIiIGZpbGwtcnVsZT0ibm9uemVybyI+PC9wYXRoPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+", j_ = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMjYiIHZpZXdCb3g9IjAgMCAxOCAyNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMC41IiB5PSIwLjUiIHdpZHRoPSIxNyIgaGVpZ2h0PSIyNSIgcng9IjMuNSIgZmlsbD0iYmxhY2siIGZpbGwtb3BhY2l0eT0iMC4zNSIgc3Ryb2tlPSJ3aGl0ZSIvPgo8L3N2Zz4K", U_ = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjYiIGhlaWdodD0iMzQiIHZpZXdCb3g9IjAgMCAyNiAzNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMC41IiB5PSIwLjUiIHdpZHRoPSIyNSIgaGVpZ2h0PSIzMyIgcng9IjMuNSIgZmlsbD0iYmxhY2siIGZpbGwtb3BhY2l0eT0iMC4zNSIgc3Ryb2tlPSJ3aGl0ZSIvPgo8L3N2Zz4K", V_ = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzQiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCAzNCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMC41IiB5PSIwLjUiIHdpZHRoPSIzMyIgaGVpZ2h0PSI0OSIgcng9IjMuNSIgZmlsbD0iYmxhY2siIGZpbGwtb3BhY2l0eT0iMC4zNSIgc3Ryb2tlPSJ3aGl0ZSIvPgo8L3N2Zz4K", H_ = {
  [Nn.pencil]: __,
  [Nn.selector]: P_,
  [Nn.eraser]: z_,
  [Nn.shape]: O_,
  [Nn.text]: L_,
  [Nn.laserPointer]: B_,
  pencilEraser1: j_,
  pencilEraser2: U_,
  pencilEraser3: V_
}, IT = "local-cursor";
class W_ {
  constructor(i, o, c, h) {
    var g;
    this.manager = i, this.enableCursor = o, this.cursorInstances = /* @__PURE__ */ new Map(), this.userApplianceIcons = {}, this.sideEffectManager = new up(), this.store = this.manager.store, this.leaveFlag = !0, this._style = "default", this.onCursorMove = (x) => {
      const C = this.initCursorInstance(x.uid);
      if (x.state === Bb.Leave)
        C.leave();
      else {
        const I = C.updateMember();
        this.canMoveCursor(I) && C.move(x.position);
      }
    }, this.initCursorInstance = (x) => {
      let C = this.cursorInstances.get(x);
      return C || (C = new k_(this.manager, x, this, Wt.wrapper), this.cursorInstances.set(x, C)), C;
    }, this.mouseMoveListener_ = (x, C) => {
      const I = this.getType(x);
      this.updateCursor(I, x.clientX, x.clientY), C && this.showPencilEraserIfNeeded(I, x.clientX, x.clientY);
    }, this.mouseMoveTimer = 0, this.mouseMoveListener = (x) => {
      const C = x.pointerType === "touch";
      if (C && !x.isPrimary)
        return;
      const I = Date.now();
      if (I - this.mouseMoveTimer > 48) {
        if (this.mouseMoveTimer = I, Wt.supportAppliancePlugin && ol(Wt.displayer) && Wt.displayer.disableDeviceInputs) {
          this.leaveFlag && (this.manager.dispatchInternalEvent(Xt.CursorMove, {
            uid: this.manager.uid,
            state: Bb.Leave
          }), this.leaveFlag = !1);
          return;
        }
        this.mouseMoveListener_(x, C), this.leaveFlag = !0;
      }
    }, this.mouseLeaveListener = () => {
      this.hideCursor(this.manager.uid);
    }, this.getPoint = (x, C, I) => {
      var z;
      const A = (z = x == null ? void 0 : x.divElement) == null ? void 0 : z.getBoundingClientRect();
      if (A)
        return x == null ? void 0 : x.convertToPointInWorld({
          x: C - A.x,
          y: I - A.y
        });
    }, this.getType = (x) => {
      var A;
      const C = x.target, I = this.manager.focusApp;
      switch (C.parentElement) {
        case this.mainViewElement:
          return { type: "main" };
        case ((A = I == null ? void 0 : I.view) == null ? void 0 : A.divElement):
          return { type: "app" };
        default:
          return { type: "main" };
      }
    }, this.roomMembers = (g = this.manager.room) == null ? void 0 : g.state.roomMembers;
    const m = Wt.wrapper;
    m && this.setupWrapper(m), this.sideEffectManager.add(() => tt.on("cursorMove", this.onCursorMove)), this.sideEffectManager.add(() => tt.on("playgroundSizeChange", () => this.updateContainerRect()));
    const y = this.manager.room;
    y && this.sideEffectManager.add(() => {
      const x = (C) => {
        this.style === "custom" && C.memberState && this.enableCustomCursor();
      };
      return y.callbacks.on("onRoomStateChanged", x), () => y.callbacks.off("onRoomStateChanged", x);
    }), h && (this.userApplianceIcons = h), this.style = (c == null ? void 0 : c.style) || "default";
  }
  get applianceIcons() {
    return { ...H_, ...this.userApplianceIcons };
  }
  get style() {
    return this._style;
  }
  set style(i) {
    this._style !== i && (this._style = i, this.cursorInstances.forEach((o) => {
      o.setStyle(i);
    }), i === "custom" ? this.enableCustomCursor() : this.sideEffectManager.flush(IT));
  }
  enableCustomCursor() {
    this.sideEffectManager.add(
      () => D_(this.manager.getMemberState()),
      IT
    );
  }
  canMoveCursor(i) {
    const o = (i == null ? void 0 : i.memberState.currentApplianceName) === Nn.laserPointer;
    return this.enableCursor || o;
  }
  setupWrapper(i) {
    this.sideEffectManager.add(() => (i.addEventListener("pointerenter", this.mouseMoveListener), i.addEventListener("pointermove", this.mouseMoveListener), i.addEventListener("pointerleave", this.mouseLeaveListener), () => {
      i.removeEventListener("pointerenter", this.mouseMoveListener), i.removeEventListener("pointermove", this.mouseMoveListener), i.removeEventListener("pointerleave", this.mouseLeaveListener);
    })), this.wrapperRect = i.getBoundingClientRect();
  }
  setMainViewDivElement(i) {
    this.mainViewElement = i;
  }
  get boxState() {
    return this.store.getBoxState();
  }
  get focusView() {
    var i;
    return (i = this.manager.focusApp) == null ? void 0 : i.view;
  }
  showPencilEraserIfNeeded(i, o, c) {
    const h = Vb(this.manager.room, this.manager.uid), m = (h == null ? void 0 : h.memberState.currentApplianceName) === Nn.pencilEraser;
    if (this.wrapperRect && this.manager.canOperate && this.canMoveCursor(h) && m) {
      const y = i.type === "main" ? this.manager.mainView : this.focusView, g = this.getPoint(y, o, c);
      g && this.onCursorMove({
        uid: this.manager.uid,
        position: {
          x: g.x,
          y: g.y,
          type: i.type
        }
      });
    }
  }
  updateCursor(i, o, c) {
    const h = Vb(this.manager.room, this.manager.uid);
    if (this.wrapperRect && this.manager.canOperate && this.canMoveCursor(h)) {
      const m = i.type === "main" ? this.manager.mainView : this.focusView, y = this.getPoint(m, o, c);
      y && this.manager.dispatchInternalEvent(Xt.CursorMove, {
        uid: this.manager.uid,
        position: {
          x: y.x,
          y: y.y,
          type: i.type
        }
      });
    }
  }
  updateContainerRect() {
    var i, o;
    this.containerRect = (i = Wt.container) == null ? void 0 : i.getBoundingClientRect(), this.wrapperRect = (o = Wt.wrapper) == null ? void 0 : o.getBoundingClientRect();
  }
  deleteCursor(i) {
    this.store.cleanCursor(i);
    const o = this.cursorInstances.get(i);
    o && o.destroy();
  }
  hideCursor(i) {
    const o = this.cursorInstances.get(i);
    o && o.hide();
  }
  destroy() {
    this.sideEffectManager.flushAll(), this.cursorInstances.size && (this.cursorInstances.forEach((i) => {
      i.destroy();
    }), this.cursorInstances.clear());
  }
}
class F_ {
  constructor(i) {
    this.manager = i, tt.on("changePageState", () => {
      Dt.emit("pageStateChange", this.toObject());
    });
  }
  get index() {
    return this.manager.store.getMainViewSceneIndex() || 0;
  }
  get length() {
    return this.manager.mainViewScenesLength || 0;
  }
  toObject() {
    return {
      index: this.index >= this.length ? this.length - 1 : this.index,
      length: this.length
    };
  }
}
class $_ {
  constructor(i) {
    this.ctx = i, this.reactors = /* @__PURE__ */ new Map(), this.disposers = /* @__PURE__ */ new Map(), this.onPhaseChanged = async (o) => {
      var c, h;
      o === ll.Reconnecting && this.ctx.emitter.emit("startReconnect"), o === ll.Connected && this.phase === ll.Reconnecting && ((c = this.room) != null && c.isWritable ? (h = this.room) == null || h.dispatchMagixEvent(lb, {}) : (await bM(500), this.onReconnected())), this.phase = o;
    }, this.onReconnected = xs(() => {
      this._onReconnected();
    }, 1e3), this._onReconnected = () => {
      Ca("onReconnected refresh reactors"), this.releaseDisposers(), this.reactors.forEach((o, c) => {
        xd(o) && this.disposers.set(c, o());
      }), this.ctx.emitter.emit("onReconnected");
    };
  }
  setRoom(i) {
    this.room = i, this.phase = i == null ? void 0 : i.phase, i && (i.callbacks.off("onPhaseChanged", this.onPhaseChanged), i.callbacks.on("onPhaseChanged", this.onPhaseChanged), i.addMagixEventListener(
      lb,
      (o) => {
        o.authorId === i.observerId && this.onReconnected();
      },
      { fireSelfEventAfterCommit: !0 }
    ));
  }
  setContext(i) {
    this.ctx = i;
  }
  releaseDisposers() {
    this.disposers.forEach((i) => {
      xd(i) && i();
    }), this.disposers.clear();
  }
  refresh() {
    this._onReconnected();
  }
  add(i, o) {
    const c = this.disposers.get(i);
    c && xd(c) && c(), xd(o) && (this.reactors.set(i, o), this.disposers.set(i, o()));
  }
  remove(i) {
    this.reactors.has(i) && this.reactors.delete(i);
    const o = this.disposers.get(i);
    o && (xd(o) && o(), this.disposers.delete(i));
  }
  hasReactor(i) {
    return this.reactors.has(i);
  }
  destroy() {
    var i, o;
    (i = this.room) == null || i.callbacks.off("onPhaseChanged", this.onPhaseChanged), (o = this.room) == null || o.removeMagixEventListener(lb, this.onReconnected), this.releaseDisposers();
  }
}
const Q_ = (r, i) => {
  if (rS(r))
    Y_(r);
  else {
    if (r = r, Object.getOwnPropertyDescriptor(r, "disableCameraTransform"))
      return;
    Object.defineProperty(r, "disableCameraTransform", {
      get() {
        return i.mainView.disableCameraTransform;
      },
      set(c) {
        i.mainView.disableCameraTransform = c;
      }
    }), Object.defineProperty(r, "canUndoSteps", {
      get() {
        return i.canUndoSteps;
      }
    }), Object.defineProperty(r, "canRedoSteps", {
      get() {
        return i.canRedoSteps;
      }
    }), r.moveCamera = (c) => i.moveCamera(c), r.moveCameraToContain = (...c) => i.moveCameraToContain(...c), r.convertToPointInWorld = (...c) => i.mainView.convertToPointInWorld(...c), r.setCameraBound = (...c) => i.mainView.setCameraBound(...c), r.scenePreview = (...c) => i.mainView.scenePreview(...c), r.fillSceneSnapshot = (...c) => i.mainView.fillSceneSnapshot(...c), r.generateScreenshot = (...c) => i.mainView.generateScreenshot(...c), r.setMemberState = (...c) => i.mainView.setMemberState(...c), r.redo = () => i.redo(), r.undo = () => i.undo(), r.cleanCurrentScene = () => i.cleanCurrentScene(), r.delete = () => i.delete(), r.copy = () => i.copy(), r.paste = () => i.paste(), r.duplicate = () => i.duplicate(), r.insertImage = (...c) => i.insertImage(...c), r.completeImageUpload = (...c) => i.completeImageUpload(...c), r.insertText = (...c) => i.insertText(...c), r.lockImage = (...c) => i.lockImage(...c), r.lockImages = (...c) => i.lockImages(...c), Z_(r, i);
  }
}, Z_ = (r, i) => {
  const o = r.removeScenes;
  r.removeScenes = (c, h) => {
    var y;
    c === Cr && ((y = i.appManager) == null || y.updateRootDirRemoving(!0));
    const m = o.call(r, c);
    return tt.emit("removeScenes", { scenePath: c, index: h }), m;
  };
}, Y_ = (r) => {
  const i = r.seekToProgressTime;
  async function o(c) {
    await tt.emit("seekStart");
    const h = await i.call(r, c);
    return tt.emit("seek", c), h;
  }
  r.seekToProgressTime = o;
};
var G_ = Object.defineProperty, X_ = Object.defineProperties, J_ = Object.getOwnPropertyDescriptors, AT = Object.getOwnPropertySymbols, q_ = Object.prototype.hasOwnProperty, K_ = Object.prototype.propertyIsEnumerable, RT = (r, i, o) => i in r ? G_(r, i, { enumerable: !0, configurable: !0, writable: !0, value: o }) : r[i] = o, qM = (r, i) => {
  for (var o in i || (i = {}))
    q_.call(i, o) && RT(r, o, i[o]);
  if (AT)
    for (var o of AT(i))
      K_.call(i, o) && RT(r, o, i[o]);
  return r;
}, KM = (r, i) => X_(r, J_(i)), eP = /* @__PURE__ */ (() => `.netless-app-docs-viewer-content{position:relative;height:100%;overflow:hidden}.netless-app-docs-viewer-preview-mask{display:block;position:absolute;z-index:200;top:0;left:0;width:100%;height:100%}.netless-app-docs-viewer-preview{display:flex;flex-direction:column;align-items:center;z-index:300;top:0;right:0;width:23%;padding:12px;box-shadow:-4.8px -3.2px 20px #20233826;transition:transform .4s;background:#f5f5fc;border-radius:4px;-webkit-box-shadow:-4.8px -3.2px 20px rgba(32,35,56,.15);height:100%;position:absolute}.netless-app-docs-viewer-preview-active .netless-app-docs-viewer-preview-mask{display:block}.netless-app-docs-viewer-preview-active .netless-app-docs-viewer-preview{transform:translate(0);opacity:1}.netless-app-docs-viewer-preview-head{display:flex;align-items:center;justify-content:space-between;width:100%;margin-bottom:10px}.netless-app-docs-viewer-preview-head>h3{color:#484c70;font-weight:400;font-size:14px;width:calc(100% - 20px);overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;white-space:nowrap}.netless-app-docs-viewer-preview-head .netless-app-docs-viewer-close{width:25px;height:25px;padding:0;outline:none;border:none;background:#fff;display:flex;justify-content:center;align-items:center;border-radius:100%;cursor:pointer}.netless-app-docs-viewer-preview-head .netless-app-docs-viewer-close button{width:22px;height:22px;padding:0;outline:none;border:none;background:center/cover no-repeat;background-image:url(./icons/close.svg)}.netless-app-docs-viewer-preview-page{position:relative;display:flex;width:100%;margin-bottom:10px;font-size:0;color:transparent;outline:none;border-radius:4px;transition:border-color .3s;user-select:none;align-items:flex-end}.netless-app-docs-viewer-preview-page>img{width:calc(90% - 10px);height:auto;box-sizing:border-box;border:2px solid rgba(0,0,0,.5);border-radius:2px;background-color:#fff}.netless-app-docs-viewer-preview-page>img.netless-app-docs-viewer-active{border-color:#ff5353}.netless-app-docs-viewer-preview-page-name{text-align:right;font-size:12px;color:#8d8fa6;user-select:none;margin-right:10px;width:5%}.netless-app-docs-viewer-footer{box-sizing:border-box;height:40px;display:flex;align-items:center;padding:0 16px;color:#191919;background:#ebecfa}.netless-app-docs-viewer-float-footer{width:100%;min-height:40px;position:absolute;left:0;bottom:0;z-index:2000;transition:opacity .4s;color:#191919}.netless-app-docs-viewer-footer-btn{box-sizing:border-box;width:26px;height:26px;font-size:0;margin:0;padding:3px;border:none;border-radius:4px;outline:none;color:currentColor;background:transparent;transition:background .4s;cursor:pointer;user-select:none;-webkit-tap-highlight-color:rgba(0,0,0,0);color:#8d8fa6}.netless-app-docs-viewer-footer-btn.netless-app-docs-viewer-footer-btn-disable{color:#c6c7d2;cursor:not-allowed}.netless-app-docs-viewer-footer-btn.netless-app-docs-viewer-footer-btn-disable .arrow{fill:#c6c7d2}.netless-app-docs-viewer-footer-btn .arrow{fill:#8d8fa6}.netless-app-docs-viewer-footer-btn:hover{background-color:#1b1f4d0a}@media (hover: none){.netless-app-docs-viewer-footer-btn:hover{background:transparent!important}}.netless-app-docs-viewer-footer-btn>svg{width:100%;height:100%}.netless-app-docs-viewer-footer-btn>svg:nth-of-type(2){display:none}.netless-app-docs-viewer-footer-btn.netless-app-docs-viewer-footer-btn-playing>svg:nth-of-type(1){display:none}.netless-app-docs-viewer-footer-btn.netless-app-docs-viewer-footer-btn-playing>svg:nth-of-type(2){display:initial}.netless-app-docs-viewer-hide{display:none}.netless-app-docs-viewer-page-jumps{flex:1;display:flex;justify-content:center;align-items:center;gap:8px}.netless-app-docs-viewer-page-number{font-size:14px;color:#8d8fa6;user-select:none;white-space:nowrap;word-break:keep-all}.netless-app-docs-viewer-page-number-input{border:none;outline:none;width:3em;margin:0;padding:0 2px;text-align:right;font-size:13px;line-height:1;font-weight:400;font-family:inherit;border-radius:2px;color:currentColor;background:transparent;transition:background .4s;user-select:text;-webkit-tap-highlight-color:rgba(0,0,0,0)}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-footer-btn{cursor:not-allowed}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-footer-btn:hover{background:transparent}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input{cursor:not-allowed}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input:hover,.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input:focus,.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input:active{background:transparent;box-shadow:none}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input:disabled{color:inherit}.netless-app-docs-viewer-readonly.netless-app-docs-viewer-float-footer{display:none}.telebox-color-scheme-dark .netless-app-docs-viewer-page-number-input{color:#a6a6a8}.telebox-color-scheme-dark .netless-app-docs-viewer-page-number-input:active,.telebox-color-scheme-dark .netless-app-docs-viewer-page-number-input:focus,.telebox-color-scheme-dark .netless-app-docs-viewer-page-number-input:hover{color:#222}.telebox-color-scheme-dark .netless-app-docs-viewer-footer{color:#a6a6a8;background:#2d2d33;border-top:none}.telebox-color-scheme-dark .netless-app-docs-viewer-footer-btn:hover{background:#212126}.telebox-color-scheme-dark .netless-app-docs-viewer-preview{background:rgba(50,50,50,.9)}.netless-app-docs-viewer-static-scrollbar{position:absolute;top:0;right:0;z-index:2147483647;width:8px;min-height:30px;margin:0;padding:0;border:none;outline:none;border-radius:4px;background:rgba(68,78,96,.4);box-shadow:1px 1px 8px #ffffffb3;opacity:0;transition:background .4s,opacity .4s 3s,transform .2s;user-select:none}.netless-app-docs-viewer-static-scrollbar.netless-app-docs-viewer-static-scrollbar-dragging{background:rgba(68,78,96,.6);opacity:1;transition:background .4s,opacity .4s 3s!important}.netless-app-docs-viewer-static-scrollbar:hover,.netless-app-docs-viewer-static-scrollbar:focus{background:rgba(68,78,96,.5)}.netless-app-docs-viewer-static-scrollbar:active{background:rgba(68,78,96,.6)}.netless-app-docs-viewer-content:hover .netless-app-docs-viewer-static-scrollbar{opacity:1;transition:background .4s,opacity .4s,transform .2s}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-static-scrollbar{display:none}.netless-app-docs-viewer-static-pages:hover .netless-app-docs-viewer-static-scrollbar{opacity:1;transition:background .4s,opacity .4s,transform .2s}.page-renderer-pages-container{position:relative;overflow:hidden}.page-renderer-page{position:absolute;top:0;left:0;background-position:center;background-size:cover;background-repeat:no-repeat}.page-renderer-pages-container.is-hwa .page-renderer-page{will-change:transform}.page-renderer-page-img{display:block;width:100%;height:auto;user-select:none}.netless-app-docs-viewer-static-pages{overflow:hidden;position:relative;height:100%;user-select:none}.netless-app-docs-viewer-static-page{display:block;width:100%;height:auto;user-select:none}.netless-app-docs-viewer-static-wb-view,.netless-app-docs-viewer-dynamic-wb-view{position:absolute;top:0;left:0;width:100%;height:100%;z-index:100;overflow:auto}.netless-app-docs-viewer-dynamic-wb-view .cursor-clicker .ppt-event-source{cursor:pointer}
`)();
const tP = (r, i, o, c) => {
  if (o === "length" || o === "prototype" || o === "arguments" || o === "caller")
    return;
  const h = Object.getOwnPropertyDescriptor(r, o), m = Object.getOwnPropertyDescriptor(i, o);
  !nP(h, m) && c || Object.defineProperty(r, o, m);
}, nP = function(r, i) {
  return r === void 0 || r.configurable || r.writable === i.writable && r.enumerable === i.enumerable && r.configurable === i.configurable && (r.writable || r.value === i.value);
}, iP = (r, i) => {
  const o = Object.getPrototypeOf(i);
  o !== Object.getPrototypeOf(r) && Object.setPrototypeOf(r, o);
}, rP = (r, i) => `/* Wrapped ${r}*/
${i}`, aP = Object.getOwnPropertyDescriptor(Function.prototype, "toString"), sP = Object.getOwnPropertyDescriptor(Function.prototype.toString, "name"), oP = (r, i, o) => {
  const c = o === "" ? "" : `with ${o.trim()}() `, h = rP.bind(null, c, i.toString());
  Object.defineProperty(h, "name", sP), Object.defineProperty(r, "toString", KM(qM({}, aP), { value: h }));
};
function lP(r, i, { ignoreNonConfigurable: o = !1 } = {}) {
  const { name: c } = r;
  for (const h of Reflect.ownKeys(i))
    tP(r, i, h, o);
  return iP(r, i), oP(r, i, c), r;
}
const uP = (r, i = {}) => {
  if (typeof r != "function")
    throw new TypeError(`Expected the first argument to be a function, got \`${typeof r}\``);
  const {
    wait: o = 0,
    maxWait: c = Number.Infinity,
    before: h = !1,
    after: m = !0
  } = i;
  if (!h && !m)
    throw new Error("Both `before` and `after` are false, function wouldn't be called.");
  let y, g, x;
  const C = function(...I) {
    const A = this, z = () => {
      y = void 0, g && (clearTimeout(g), g = void 0), m && (x = r.apply(A, I));
    }, $ = () => {
      g = void 0, y && (clearTimeout(y), y = void 0), m && (x = r.apply(A, I));
    }, V = h && !y;
    return clearTimeout(y), y = setTimeout(z, o), c > 0 && c !== Number.Infinity && !g && (g = setTimeout($, c)), V && (x = r.apply(A, I)), x;
  };
  return lP(C, r), C.cancel = () => {
    y && (clearTimeout(y), y = void 0), g && (clearTimeout(g), g = void 0);
  }, C;
}, cP = "!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", dP = 87, fP = 20, DT = [], hP = () => {
  for (let r = 0; r < fP; r++)
    DT[r] = cP.charAt(Math.random() * dP);
  return DT.join("");
};
function eE(r) {
  try {
    return r();
  } catch (i) {
    console.error(i);
  }
}
class pg {
  constructor() {
    this.push = this.addDisposer, this.disposers = /* @__PURE__ */ new Map();
  }
  addDisposer(i, o = this.genUID()) {
    return this.flush(o), this.disposers.set(o, Array.isArray(i) ? pP(i) : i), o;
  }
  add(i, o = this.genUID()) {
    const c = i();
    return c ? this.addDisposer(c, o) : o;
  }
  addEventListener(i, o, c, h, m = this.genUID()) {
    return i.addEventListener(o, c, h), this.addDisposer(() => i.removeEventListener(o, c, h), m), m;
  }
  setTimeout(i, o, c = this.genUID()) {
    const h = window.setTimeout(() => {
      this.remove(c), i();
    }, o);
    return this.addDisposer(() => window.clearTimeout(h), c);
  }
  setInterval(i, o, c = this.genUID()) {
    const h = window.setInterval(i, o);
    return this.addDisposer(() => window.clearInterval(h), c);
  }
  remove(i) {
    const o = this.disposers.get(i);
    return this.disposers.delete(i), o;
  }
  flush(i) {
    const o = this.remove(i);
    o && o();
  }
  flushAll() {
    this.disposers.forEach(eE), this.disposers.clear();
  }
  genUID() {
    let i;
    do
      i = hP();
    while (this.disposers.has(i));
    return i;
  }
}
function pP(r) {
  return () => r.forEach(eE);
}
var ku = [], mP = function() {
  return ku.some(function(r) {
    return r.activeTargets.length > 0;
  });
}, vP = function() {
  return ku.some(function(r) {
    return r.skippedTargets.length > 0;
  });
}, NT = "ResizeObserver loop completed with undelivered notifications.", gP = function() {
  var r;
  typeof ErrorEvent == "function" ? r = new ErrorEvent("error", {
    message: NT
  }) : (r = document.createEvent("Event"), r.initEvent("error", !1, !1), r.message = NT), window.dispatchEvent(r);
}, op;
(function(r) {
  r.BORDER_BOX = "border-box", r.CONTENT_BOX = "content-box", r.DEVICE_PIXEL_CONTENT_BOX = "device-pixel-content-box";
})(op || (op = {}));
var _u = function(r) {
  return Object.freeze(r);
}, yP = function() {
  function r(i, o) {
    this.inlineSize = i, this.blockSize = o, _u(this);
  }
  return r;
}(), tE = function() {
  function r(i, o, c, h) {
    return this.x = i, this.y = o, this.width = c, this.height = h, this.top = this.y, this.left = this.x, this.bottom = this.top + this.height, this.right = this.left + this.width, _u(this);
  }
  return r.prototype.toJSON = function() {
    var i = this, o = i.x, c = i.y, h = i.top, m = i.right, y = i.bottom, g = i.left, x = i.width, C = i.height;
    return { x: o, y: c, top: h, right: m, bottom: y, left: g, width: x, height: C };
  }, r.fromRect = function(i) {
    return new r(i.x, i.y, i.width, i.height);
  }, r;
}(), wS = function(r) {
  return r instanceof SVGElement && "getBBox" in r;
}, nE = function(r) {
  if (wS(r)) {
    var i = r.getBBox(), o = i.width, c = i.height;
    return !o && !c;
  }
  var h = r, m = h.offsetWidth, y = h.offsetHeight;
  return !(m || y || r.getClientRects().length);
}, kT = function(r) {
  var i, o;
  if (r instanceof Element)
    return !0;
  var c = (o = (i = r) === null || i === void 0 ? void 0 : i.ownerDocument) === null || o === void 0 ? void 0 : o.defaultView;
  return !!(c && r instanceof c.Element);
}, wP = function(r) {
  switch (r.tagName) {
    case "INPUT":
      if (r.type !== "image")
        break;
    case "VIDEO":
    case "AUDIO":
    case "EMBED":
    case "OBJECT":
    case "CANVAS":
    case "IFRAME":
    case "IMG":
      return !0;
  }
  return !1;
}, np = typeof window < "u" ? window : {}, Fv = /* @__PURE__ */ new WeakMap(), _T = /auto|scroll/, bP = /^tb|vertical/, SP = /msie|trident/i.test(np.navigator && np.navigator.userAgent), gs = function(r) {
  return parseFloat(r || "0");
}, Id = function(r, i, o) {
  return r === void 0 && (r = 0), i === void 0 && (i = 0), o === void 0 && (o = !1), new yP((o ? i : r) || 0, (o ? r : i) || 0);
}, PT = _u({
  devicePixelContentBoxSize: Id(),
  borderBoxSize: Id(),
  contentBoxSize: Id(),
  contentRect: new tE(0, 0, 0, 0)
}), iE = function(r, i) {
  if (i === void 0 && (i = !1), Fv.has(r) && !i)
    return Fv.get(r);
  if (nE(r))
    return Fv.set(r, PT), PT;
  var o = getComputedStyle(r), c = wS(r) && r.ownerSVGElement && r.getBBox(), h = !SP && o.boxSizing === "border-box", m = bP.test(o.writingMode || ""), y = !c && _T.test(o.overflowY || ""), g = !c && _T.test(o.overflowX || ""), x = c ? 0 : gs(o.paddingTop), C = c ? 0 : gs(o.paddingRight), I = c ? 0 : gs(o.paddingBottom), A = c ? 0 : gs(o.paddingLeft), z = c ? 0 : gs(o.borderTopWidth), $ = c ? 0 : gs(o.borderRightWidth), V = c ? 0 : gs(o.borderBottomWidth), q = c ? 0 : gs(o.borderLeftWidth), G = A + C, he = x + I, se = q + $, Z = z + V, ue = g ? r.offsetHeight - Z - r.clientHeight : 0, oe = y ? r.offsetWidth - se - r.clientWidth : 0, Ne = h ? G + se : 0, Fe = h ? he + Z : 0, Pe = c ? c.width : gs(o.width) - Ne - oe, Y = c ? c.height : gs(o.height) - Fe - ue, fe = Pe + G + oe + se, be = Y + he + ue + Z, ie = _u({
    devicePixelContentBoxSize: Id(Math.round(Pe * devicePixelRatio), Math.round(Y * devicePixelRatio), m),
    borderBoxSize: Id(fe, be, m),
    contentBoxSize: Id(Pe, Y, m),
    contentRect: new tE(A, x, Pe, Y)
  });
  return Fv.set(r, ie), ie;
}, rE = function(r, i, o) {
  var c = iE(r, o), h = c.borderBoxSize, m = c.contentBoxSize, y = c.devicePixelContentBoxSize;
  switch (i) {
    case op.DEVICE_PIXEL_CONTENT_BOX:
      return y;
    case op.BORDER_BOX:
      return h;
    default:
      return m;
  }
}, xP = function() {
  function r(i) {
    var o = iE(i);
    this.target = i, this.contentRect = o.contentRect, this.borderBoxSize = _u([o.borderBoxSize]), this.contentBoxSize = _u([o.contentBoxSize]), this.devicePixelContentBoxSize = _u([o.devicePixelContentBoxSize]);
  }
  return r;
}(), aE = function(r) {
  if (nE(r))
    return 1 / 0;
  for (var i = 0, o = r.parentNode; o; )
    i += 1, o = o.parentNode;
  return i;
}, CP = function() {
  var r = 1 / 0, i = [];
  ku.forEach(function(y) {
    if (y.activeTargets.length !== 0) {
      var g = [];
      y.activeTargets.forEach(function(C) {
        var I = new xP(C.target), A = aE(C.target);
        g.push(I), C.lastReportedSize = rE(C.target, C.observedBox), A < r && (r = A);
      }), i.push(function() {
        y.callback.call(y.observer, g, y.observer);
      }), y.activeTargets.splice(0, y.activeTargets.length);
    }
  });
  for (var o = 0, c = i; o < c.length; o++) {
    var h = c[o];
    h();
  }
  return r;
}, zT = function(r) {
  ku.forEach(function(o) {
    o.activeTargets.splice(0, o.activeTargets.length), o.skippedTargets.splice(0, o.skippedTargets.length), o.observationTargets.forEach(function(h) {
      h.isActive() && (aE(h.target) > r ? o.activeTargets.push(h) : o.skippedTargets.push(h));
    });
  });
}, TP = function() {
  var r = 0;
  for (zT(r); mP(); )
    r = CP(), zT(r);
  return vP() && gP(), r > 0;
}, Sb, sE = [], MP = function() {
  return sE.splice(0).forEach(function(r) {
    return r();
  });
}, EP = function(r) {
  if (!Sb) {
    var i = 0, o = document.createTextNode(""), c = { characterData: !0 };
    new MutationObserver(function() {
      return MP();
    }).observe(o, c), Sb = function() {
      o.textContent = "" + (i ? i-- : i++);
    };
  }
  sE.push(r), Sb();
}, IP = function(r) {
  EP(function() {
    requestAnimationFrame(r);
  });
}, eg = 0, AP = function() {
  return !!eg;
}, RP = 250, DP = { attributes: !0, characterData: !0, childList: !0, subtree: !0 }, OT = [
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
], LT = function(r) {
  return r === void 0 && (r = 0), Date.now() + r;
}, xb = !1, NP = function() {
  function r() {
    var i = this;
    this.stopped = !0, this.listener = function() {
      return i.schedule();
    };
  }
  return r.prototype.run = function(i) {
    var o = this;
    if (i === void 0 && (i = RP), !xb) {
      xb = !0;
      var c = LT(i);
      IP(function() {
        var h = !1;
        try {
          h = TP();
        } finally {
          if (xb = !1, i = c - LT(), !AP())
            return;
          h ? o.run(1e3) : i > 0 ? o.run(i) : o.start();
        }
      });
    }
  }, r.prototype.schedule = function() {
    this.stop(), this.run();
  }, r.prototype.observe = function() {
    var i = this, o = function() {
      return i.observer && i.observer.observe(document.body, DP);
    };
    document.body ? o() : np.addEventListener("DOMContentLoaded", o);
  }, r.prototype.start = function() {
    var i = this;
    this.stopped && (this.stopped = !1, this.observer = new MutationObserver(this.listener), this.observe(), OT.forEach(function(o) {
      return np.addEventListener(o, i.listener, !0);
    }));
  }, r.prototype.stop = function() {
    var i = this;
    this.stopped || (this.observer && this.observer.disconnect(), OT.forEach(function(o) {
      return np.removeEventListener(o, i.listener, !0);
    }), this.stopped = !0);
  }, r;
}(), Xb = new NP(), BT = function(r) {
  !eg && r > 0 && Xb.start(), eg += r, !eg && Xb.stop();
}, kP = function(r) {
  return !wS(r) && !wP(r) && getComputedStyle(r).display === "inline";
}, _P = function() {
  function r(i, o) {
    this.target = i, this.observedBox = o || op.CONTENT_BOX, this.lastReportedSize = {
      inlineSize: 0,
      blockSize: 0
    };
  }
  return r.prototype.isActive = function() {
    var i = rE(this.target, this.observedBox, !0);
    return kP(this.target) && (this.lastReportedSize = i), this.lastReportedSize.inlineSize !== i.inlineSize || this.lastReportedSize.blockSize !== i.blockSize;
  }, r;
}(), PP = function() {
  function r(i, o) {
    this.activeTargets = [], this.skippedTargets = [], this.observationTargets = [], this.observer = i, this.callback = o;
  }
  return r;
}(), $v = /* @__PURE__ */ new WeakMap(), jT = function(r, i) {
  for (var o = 0; o < r.length; o += 1)
    if (r[o].target === i)
      return o;
  return -1;
}, Qv = function() {
  function r() {
  }
  return r.connect = function(i, o) {
    var c = new PP(i, o);
    $v.set(i, c);
  }, r.observe = function(i, o, c) {
    var h = $v.get(i), m = h.observationTargets.length === 0;
    jT(h.observationTargets, o) < 0 && (m && ku.push(h), h.observationTargets.push(new _P(o, c && c.box)), BT(1), Xb.schedule());
  }, r.unobserve = function(i, o) {
    var c = $v.get(i), h = jT(c.observationTargets, o), m = c.observationTargets.length === 1;
    h >= 0 && (m && ku.splice(ku.indexOf(c), 1), c.observationTargets.splice(h, 1), BT(-1));
  }, r.disconnect = function(i) {
    var o = this, c = $v.get(i);
    c.observationTargets.slice().forEach(function(h) {
      return o.unobserve(i, h.target);
    }), c.activeTargets.splice(0, c.activeTargets.length);
  }, r;
}(), zP = function() {
  function r(i) {
    if (arguments.length === 0)
      throw new TypeError("Failed to construct 'ResizeObserver': 1 argument required, but only 0 present.");
    if (typeof i != "function")
      throw new TypeError("Failed to construct 'ResizeObserver': The callback provided as parameter 1 is not a function.");
    Qv.connect(this, i);
  }
  return r.prototype.observe = function(i, o) {
    if (arguments.length === 0)
      throw new TypeError("Failed to execute 'observe' on 'ResizeObserver': 1 argument required, but only 0 present.");
    if (!kT(i))
      throw new TypeError("Failed to execute 'observe' on 'ResizeObserver': parameter 1 is not of type 'Element");
    Qv.observe(this, i, o);
  }, r.prototype.unobserve = function(i) {
    if (arguments.length === 0)
      throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': 1 argument required, but only 0 present.");
    if (!kT(i))
      throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': parameter 1 is not of type 'Element");
    Qv.unobserve(this, i);
  }, r.prototype.disconnect = function() {
    Qv.disconnect(this);
  }, r.toString = function() {
    return "function ResizeObserver () { [polyfill code] }";
  }, r;
}();
function OP(r) {
  const i = "http://www.w3.org/2000/svg", o = document.createElementNS(i, "svg");
  return o.setAttribute("class", `${r}-footer-icon-arrow-left`), o.setAttribute("viewBox", "0 0 20 20"), o.innerHTML = `<g clip-path="url(#clip0_11800_99864)">
<path fill-rule="evenodd" clip-rule="evenodd" d="M11.5283 4.86182L12.4711 5.80463L8.22849 10.0473L12.4711 14.2899L11.5283 15.2327L6.34287 10.0473L11.5283 4.86182Z" class="arrow" />
</g>
<defs>
<clipPath id="clip0_11800_99864">
<rect width="16" height="16" fill="white" transform="translate(2 2)"/>
</clipPath>
</defs>`, o;
}
function LP(r) {
  const i = "http://www.w3.org/2000/svg", o = document.createElementNS(i, "svg");
  return o.setAttribute("class", `${r}-footer-icon-arrow-right`), o.setAttribute("viewBox", "0 0 20 20"), o.innerHTML = `<g clip-path="url(#clip0_11800_99870)">
<path fill-rule="evenodd" clip-rule="evenodd" d="M8.1377 4.86182L7.19489 5.80463L11.4375 10.0473L7.19489 14.2899L8.1377 15.2327L13.3231 10.0473L8.1377 4.86182Z" class="arrow" />
</g>
<defs>
<clipPath id="clip0_11800_99870">
<rect width="16" height="16" fill="white" transform="translate(2 2)"/>
</clipPath>
</defs>`, o;
}
function BP(r) {
  const i = "http://www.w3.org/2000/svg", o = document.createElementNS(i, "svg");
  o.setAttribute("class", `${r}-footer-icon-play`), o.setAttribute("viewBox", "0 0 500 500");
  const c = document.createElementNS(i, "path");
  return c.setAttribute("fill", "currentColor"), c.setAttribute("d", "M418.158 257.419L174.663 413.33c-6.017 3.919-15.708 3.772-21.291-.29-2.791-2.018-4.295-4.483-4.295-7.084V94.109c0-5.65 6.883-10.289 15.271-10.289 4.298 0 8.391 1.307 11.181 3.332l242.629 155.484c6.016 3.917 6.451 10.292.649 14.491-.216.154-.432.154-.649.292zM170.621 391.288l223.116-141.301L170.71 107.753l-.089 283.535z"), o.appendChild(c), o;
}
function jP(r) {
  const i = "http://www.w3.org/2000/svg", o = document.createElementNS(i, "svg");
  o.setAttribute("class", `${r}-footer-icon-pause`), o.setAttribute("viewBox", "0 0 500 500");
  const c = document.createElementNS(i, "path");
  return c.setAttribute("fill", "currentColor"), c.setAttribute("d", "M312.491 78.261c0-6.159 4.893-11.213 11.04-11.213 6.158 0 11.211 5.054 11.211 11.213v343.478c0 6.159-5.053 11.213-11.211 11.213-6.147 0-11.04-5.054-11.04-11.213V78.261zM165.257 78.261c0-6.159 4.893-11.213 11.04-11.213 6.158 0 11.211 5.054 11.211 11.213v343.478c0 6.159-5.053 11.213-11.211 11.213-6.147 0-11.04-5.054-11.04-11.213V78.261z"), o.appendChild(c), o;
}
const dl = typeof window < "u", oE = dl && !("onscroll" in window) || typeof navigator < "u" && /(gle|ing|ro)bot|crawl|spider/i.test(navigator.userAgent), lE = dl && "IntersectionObserver" in window, uE = dl && "classList" in document.createElement("p"), cE = dl && window.devicePixelRatio > 1, UP = {
  elements_selector: ".lazy",
  container: oE || dl ? document : null,
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
  unobserve_completed: !0,
  unobserve_entered: !1,
  cancel_on_exit: !0,
  callback_enter: null,
  callback_exit: null,
  callback_applied: null,
  callback_loading: null,
  callback_loaded: null,
  callback_error: null,
  callback_finish: null,
  callback_cancel: null,
  use_native: !1,
  restore_on_error: !1
}, dE = (r) => Object.assign({}, UP, r), UT = function(r, i) {
  let o;
  const c = "LazyLoad::Initialized", h = new r(i);
  try {
    o = new CustomEvent(c, { detail: { instance: h } });
  } catch {
    o = document.createEvent("CustomEvent"), o.initCustomEvent(c, !1, !1, { instance: h });
  }
  window.dispatchEvent(o);
}, VP = (r, i) => {
  if (!!i)
    if (!i.length)
      UT(r, i);
    else
      for (let o = 0, c; c = i[o]; o += 1)
        UT(r, c);
}, go = "src", bS = "srcset", SS = "sizes", fE = "poster", fp = "llOriginalAttrs", hE = "data", xS = "loading", pE = "loaded", mE = "applied", HP = "entered", CS = "error", vE = "native", gE = "data-", yE = "ll-status", er = (r, i) => r.getAttribute(gE + i), WP = (r, i, o) => {
  var c = gE + i;
  if (o === null) {
    r.removeAttribute(c);
    return;
  }
  r.setAttribute(c, o);
}, hp = (r) => er(r, yE), Ou = (r, i) => WP(r, yE, i), mg = (r) => Ou(r, null), TS = (r) => hp(r) === null, FP = (r) => hp(r) === xS, $P = (r) => hp(r) === CS, MS = (r) => hp(r) === vE, QP = [xS, pE, mE, CS], ZP = (r) => QP.indexOf(hp(r)) >= 0, fl = (r, i, o, c) => {
  if (!!r) {
    if (c !== void 0) {
      r(i, o, c);
      return;
    }
    if (o !== void 0) {
      r(i, o);
      return;
    }
    r(i);
  }
}, kd = (r, i) => {
  if (uE) {
    r.classList.add(i);
    return;
  }
  r.className += (r.className ? " " : "") + i;
}, bs = (r, i) => {
  if (uE) {
    r.classList.remove(i);
    return;
  }
  r.className = r.className.replace(new RegExp("(^|\\s+)" + i + "(\\s+|$)"), " ").replace(/^\s+/, "").replace(/\s+$/, "");
}, YP = (r) => {
  r.llTempImage = document.createElement("IMG");
}, GP = (r) => {
  delete r.llTempImage;
}, wE = (r) => r.llTempImage, vg = (r, i) => {
  if (!i)
    return;
  const o = i._observer;
  !o || o.unobserve(r);
}, XP = (r) => {
  r.disconnect();
}, JP = (r, i, o) => {
  i.unobserve_entered && vg(r, o);
}, ES = (r, i) => {
  !r || (r.loadingCount += i);
}, qP = (r) => {
  !r || (r.toLoadCount -= 1);
}, bE = (r, i) => {
  !r || (r.toLoadCount = i);
}, KP = (r) => r.loadingCount > 0, ez = (r) => r.toLoadCount > 0, SE = (r) => {
  let i = [];
  for (let o = 0, c; c = r.children[o]; o += 1)
    c.tagName === "SOURCE" && i.push(c);
  return i;
}, IS = (r, i) => {
  const o = r.parentNode;
  if (!o || o.tagName !== "PICTURE")
    return;
  SE(o).forEach(i);
}, xE = (r, i) => {
  SE(r).forEach(i);
}, gg = [go], CE = [go, fE], lp = [go, bS, SS], TE = [hE], yg = (r) => !!r[fp], ME = (r) => r[fp], EE = (r) => delete r[fp], Rd = (r, i) => {
  if (yg(r))
    return;
  const o = {};
  i.forEach((c) => {
    o[c] = r.getAttribute(c);
  }), r[fp] = o;
}, tz = (r) => {
  yg(r) || (r[fp] = { backgroundImage: r.style.backgroundImage });
}, nz = (r, i, o) => {
  if (!o) {
    r.removeAttribute(i);
    return;
  }
  r.setAttribute(i, o);
}, zu = (r, i) => {
  if (!yg(r))
    return;
  const o = ME(r);
  i.forEach((c) => {
    nz(r, c, o[c]);
  });
}, iz = (r) => {
  if (!yg(r))
    return;
  const i = ME(r);
  r.style.backgroundImage = i.backgroundImage;
}, IE = (r, i, o) => {
  kd(r, i.class_applied), Ou(r, mE), o && (i.unobserve_completed && vg(r, i), fl(i.callback_applied, r, o));
}, AE = (r, i, o) => {
  kd(r, i.class_loading), Ou(r, xS), o && (ES(o, 1), fl(i.callback_loading, r, o));
}, cl = (r, i, o) => {
  !o || r.setAttribute(i, o);
}, VT = (r, i) => {
  cl(r, SS, er(r, i.data_sizes)), cl(r, bS, er(r, i.data_srcset)), cl(r, go, er(r, i.data_src));
}, rz = (r, i) => {
  IS(r, (o) => {
    Rd(o, lp), VT(o, i);
  }), Rd(r, lp), VT(r, i);
}, az = (r, i) => {
  Rd(r, gg), cl(r, go, er(r, i.data_src));
}, sz = (r, i) => {
  xE(r, (o) => {
    Rd(o, gg), cl(o, go, er(o, i.data_src));
  }), Rd(r, CE), cl(r, fE, er(r, i.data_poster)), cl(r, go, er(r, i.data_src)), r.load();
}, oz = (r, i) => {
  Rd(r, TE), cl(r, hE, er(r, i.data_src));
}, lz = (r, i, o) => {
  const c = er(r, i.data_bg), h = er(r, i.data_bg_hidpi), m = cE && h ? h : c;
  !m || (r.style.backgroundImage = `url("${m}")`, wE(r).setAttribute(go, m), AE(r, i, o));
}, uz = (r, i, o) => {
  const c = er(r, i.data_bg_multi), h = er(r, i.data_bg_multi_hidpi), m = cE && h ? h : c;
  !m || (r.style.backgroundImage = m, IE(r, i, o));
}, cz = (r, i, o) => {
  const c = er(r, i.data_bg_set);
  if (!c)
    return;
  const h = c.split("|");
  let m = h.map((y) => `image-set(${y})`);
  r.style.backgroundImage = m.join(), r.style.backgroundImage === "" && (m = h.map((y) => `-webkit-image-set(${y})`), r.style.backgroundImage = m.join()), IE(r, i, o);
}, RE = {
  IMG: rz,
  IFRAME: az,
  VIDEO: sz,
  OBJECT: oz
}, dz = (r, i) => {
  const o = RE[r.tagName];
  !o || o(r, i);
}, fz = (r, i, o) => {
  const c = RE[r.tagName];
  !c || (c(r, i), AE(r, i, o));
}, hz = ["IMG", "IFRAME", "VIDEO", "OBJECT"], pz = (r) => hz.indexOf(r.tagName) > -1, DE = (r, i) => {
  i && !KP(i) && !ez(i) && fl(r.callback_finish, i);
}, HT = (r, i, o) => {
  r.addEventListener(i, o), r.llEvLisnrs[i] = o;
}, mz = (r, i, o) => {
  r.removeEventListener(i, o);
}, AS = (r) => !!r.llEvLisnrs, vz = (r, i, o) => {
  AS(r) || (r.llEvLisnrs = {});
  const c = r.tagName === "VIDEO" ? "loadeddata" : "load";
  HT(r, c, i), HT(r, "error", o);
}, Jb = (r) => {
  if (!AS(r))
    return;
  const i = r.llEvLisnrs;
  for (let o in i) {
    const c = i[o];
    mz(r, o, c);
  }
  delete r.llEvLisnrs;
}, NE = (r, i, o) => {
  GP(r), ES(o, -1), qP(o), bs(r, i.class_loading), i.unobserve_completed && vg(r, o);
}, gz = (r, i, o, c) => {
  const h = MS(i);
  NE(i, o, c), kd(i, o.class_loaded), Ou(i, pE), fl(o.callback_loaded, i, c), h || DE(o, c);
}, yz = (r, i, o, c) => {
  const h = MS(i);
  NE(i, o, c), kd(i, o.class_error), Ou(i, CS), fl(o.callback_error, i, c), o.restore_on_error && zu(i, lp), h || DE(o, c);
}, RS = (r, i, o) => {
  const c = wE(r) || r;
  if (AS(c))
    return;
  vz(c, (y) => {
    gz(y, r, i, o), Jb(c);
  }, (y) => {
    yz(y, r, i, o), Jb(c);
  });
}, wz = (r, i, o) => {
  YP(r), RS(r, i, o), tz(r), lz(r, i, o), uz(r, i, o), cz(r, i, o);
}, bz = (r, i, o) => {
  RS(r, i, o), fz(r, i, o);
}, DS = (r, i, o) => {
  pz(r) ? bz(r, i, o) : wz(r, i, o);
}, Sz = (r, i, o) => {
  r.setAttribute("loading", "lazy"), RS(r, i, o), dz(r, i), Ou(r, vE);
}, WT = (r) => {
  r.removeAttribute(go), r.removeAttribute(bS), r.removeAttribute(SS);
}, xz = (r) => {
  IS(r, (i) => {
    WT(i);
  }), WT(r);
}, kE = (r) => {
  IS(r, (i) => {
    zu(i, lp);
  }), zu(r, lp);
}, Cz = (r) => {
  xE(r, (i) => {
    zu(i, gg);
  }), zu(r, CE), r.load();
}, Tz = (r) => {
  zu(r, gg);
}, Mz = (r) => {
  zu(r, TE);
}, Ez = {
  IMG: kE,
  IFRAME: Tz,
  VIDEO: Cz,
  OBJECT: Mz
}, Iz = (r) => {
  const i = Ez[r.tagName];
  if (!i) {
    iz(r);
    return;
  }
  i(r);
}, Az = (r, i) => {
  TS(r) || MS(r) || (bs(r, i.class_entered), bs(r, i.class_exited), bs(r, i.class_applied), bs(r, i.class_loading), bs(r, i.class_loaded), bs(r, i.class_error));
}, Rz = (r, i) => {
  Iz(r), Az(r, i), mg(r), EE(r);
}, Dz = (r, i, o, c) => {
  !o.cancel_on_exit || !FP(r) || r.tagName === "IMG" && (Jb(r), xz(r), kE(r), bs(r, o.class_loading), ES(c, -1), mg(r), fl(o.callback_cancel, r, i, c));
}, Nz = (r, i, o, c) => {
  const h = ZP(r);
  Ou(r, HP), kd(r, o.class_entered), bs(r, o.class_exited), JP(r, o, c), fl(o.callback_enter, r, i, c), !h && DS(r, o, c);
}, kz = (r, i, o, c) => {
  TS(r) || (kd(r, o.class_exited), Dz(r, i, o, c), fl(o.callback_exit, r, i, c));
}, _z = ["IMG", "IFRAME", "VIDEO"], _E = (r) => r.use_native && "loading" in HTMLImageElement.prototype, Pz = (r, i, o) => {
  r.forEach((c) => {
    _z.indexOf(c.tagName) !== -1 && Sz(c, i, o);
  }), bE(o, 0);
}, zz = (r) => r.isIntersecting || r.intersectionRatio > 0, Oz = (r) => ({
  root: r.container === document ? null : r.container,
  rootMargin: r.thresholds || r.threshold + "px"
}), Lz = (r, i, o) => {
  r.forEach((c) => zz(c) ? Nz(c.target, c, i, o) : kz(c.target, c, i, o));
}, Bz = (r, i) => {
  i.forEach((o) => {
    r.observe(o);
  });
}, jz = (r, i) => {
  XP(r), Bz(r, i);
}, Uz = (r, i) => {
  !lE || _E(r) || (i._observer = new IntersectionObserver((o) => {
    Lz(o, r, i);
  }, Oz(r)));
}, PE = (r) => Array.prototype.slice.call(r), og = (r) => r.container.querySelectorAll(r.elements_selector), Vz = (r) => PE(r).filter(TS), Hz = (r) => $P(r), Wz = (r) => PE(r).filter(Hz), FT = (r, i) => Vz(r || og(i)), Fz = (r, i) => {
  Wz(og(r)).forEach((c) => {
    bs(c, r.class_error), mg(c);
  }), i.update();
}, $z = (r, i) => {
  !dl || (i._onlineHandler = () => {
    Fz(r, i);
  }, window.addEventListener("online", i._onlineHandler));
}, Qz = (r) => {
  !dl || window.removeEventListener("online", r._onlineHandler);
}, pp = function(r, i) {
  const o = dE(r);
  this._settings = o, this.loadingCount = 0, Uz(o, this), $z(o, this), this.update(i);
};
pp.prototype = {
  update: function(r) {
    const i = this._settings, o = FT(r, i);
    if (bE(this, o.length), oE || !lE) {
      this.loadAll(o);
      return;
    }
    if (_E(i)) {
      Pz(o, i, this);
      return;
    }
    jz(this._observer, o);
  },
  destroy: function() {
    this._observer && this._observer.disconnect(), Qz(this), og(this._settings).forEach((r) => {
      EE(r);
    }), delete this._observer, delete this._settings, delete this._onlineHandler, delete this.loadingCount, delete this.toLoadCount;
  },
  loadAll: function(r) {
    const i = this._settings;
    FT(r, i).forEach((c) => {
      vg(c, this), DS(c, i, this);
    });
  },
  restoreAll: function() {
    const r = this._settings;
    og(r).forEach((i) => {
      Rz(i, r);
    });
  }
};
pp.load = (r, i) => {
  const o = dE(i);
  DS(r, o);
};
pp.resetStatus = (r) => {
  mg(r);
};
dl && VP(pp, window.lazyLoadOptions);
class zE {
  constructor({ context: i, readonly: o, box: c, pages: h, onNewPageIndex: m, onPlay: y }) {
    if (this.pageIndex = 0, this.namespace = "netless-app-docs-viewer", this.isShowPreview = !1, this.isSmallBox = !1, this.sideEffect = new pg(), h.length <= 0)
      throw new Error("[DocsViewer] Empty pages.");
    this.context = i, this.readonly = o, this.box = c, this.pages = h, this.onNewPageIndex = m, this.onPlay = y, this.onPageIndexChanged = () => {
    }, this.render();
  }
  mount() {
    this.box.mountContent(this.$content), this.box.mountFooter(this.$footer), this.box.events.on("maximized", (i) => {
      this.$footer.classList.toggle(this.wrapClassName("hide"), i);
    }), this.$footer.classList.toggle(this.wrapClassName("hide"), this.box.maximized);
  }
  unmount() {
    this.$content.remove(), this.$footer.remove();
  }
  setReadonly(i) {
    this.readonly !== i && (this.readonly = i, this.$content.classList.toggle(this.wrapClassName("readonly"), i), this.$footer.classList.toggle(this.wrapClassName("readonly"), i));
  }
  destroy() {
    this.sideEffect.flushAll(), this.unmount();
  }
  setPageIndex(i) {
    Number.isNaN(i) || (this.scrollPreview(i), this.pageIndex = i, this.$pageNumberInput.textContent = String(i + 1), this.onPageIndexChanged(i), this.$btnPageBack.classList.toggle(this.wrapClassName("footer-btn-disable"), i == 0), this.$btnPageNext.classList.toggle(this.wrapClassName("footer-btn-disable"), i == this.pages.length - 1));
  }
  scrollPreview(i) {
    var o;
    const c = (o = this.$preview) == null ? void 0 : o.querySelectorAll("." + this.wrapClassName("preview-page"));
    if (c == null || c.forEach((x, C) => {
      var I;
      (I = x.querySelector("img")) == null || I.classList.toggle(this.wrapClassName("active"), Number(i) == C);
    }), !c)
      return;
    const h = Array.prototype.slice.call(c).find((x) => x.querySelector("img").className.includes(this.wrapClassName("active")));
    if (!h)
      return;
    const m = this.$preview.getBoundingClientRect(), y = h == null ? void 0 : h.getBoundingClientRect();
    y.top >= m.top && y.bottom <= m.bottom || this.$preview.scrollTo({
      top: h.offsetTop - 16,
      behavior: this.isShowPreview ? "smooth" : "auto"
    });
  }
  setSmallBox(i) {
    this.isSmallBox !== i && (this.isSmallBox = i, this.$footer.classList.toggle(this.wrapClassName("float-footer"), i));
  }
  render() {
    return this.renderContent(), this.renderFooter(), this.$content;
  }
  renderContent() {
    if (!this.$content) {
      const i = document.createElement("div");
      i.className = this.wrapClassName("content"), this.$content = i, this.readonly && i.classList.add(this.wrapClassName("readonly"));
    }
    return this.$content;
  }
  renderPreview() {
    if (!this.$preview) {
      const i = document.createElement("div");
      i.className = this.wrapClassName("preview") + " tele-fancy-scrollbar", this.$preview = i;
      const o = document.createElement("div");
      o.className = this.wrapClassName("preview-head");
      const c = document.createElement("h3");
      c.textContent = this.box.title, o.appendChild(c), this.$preview.appendChild(o);
      const h = this.wrapClassName("preview-page"), m = this.wrapClassName("preview-page-name");
      this.pages.forEach((y, g) => {
        var x;
        const C = (x = y.thumbnail) != null ? x : y.src.startsWith("ppt") ? void 0 : y.src;
        if (!C)
          return;
        const I = String(g), A = document.createElement("a");
        A.className = h + " " + this.wrapClassName(`preview-page-${g}`), A.setAttribute("href", "#"), A.dataset.pageIndex = I;
        const z = document.createElement("span");
        z.className = m, z.textContent = String(g + 1), z.dataset.pageIndex = I;
        const $ = document.createElement("img");
        $.width = y.width, $.height = y.height, $.dataset.src = C, $.dataset.pageIndex = I, A.appendChild(z), A.appendChild($), i.appendChild(A), $.classList.toggle(this.wrapClassName("active"), this.pageIndex == g);
      }), this.sideEffect.addEventListener(i, "click", (y) => {
        var g;
        if (this.readonly)
          return;
        const x = (g = y.target.dataset) == null ? void 0 : g.pageIndex;
        x && (y.preventDefault(), y.stopPropagation(), y.stopImmediatePropagation(), this.onNewPageIndex(Number(x)));
      });
    }
    return this.$preview;
  }
  renderPreviewMask() {
    return this.$previewMask || (this.$previewMask = document.createElement("div"), this.$previewMask.className = this.wrapClassName("preview-mask"), this.sideEffect.addEventListener(this.$previewMask, "click", (i) => {
      this.readonly || i.target === this.$previewMask && this.togglePreview(!1);
    })), this.$previewMask;
  }
  renderFooter() {
    if (!this.$footer) {
      const i = document.createElement("div");
      i.className = this.wrapClassName("footer"), this.$footer = i, this.readonly && i.classList.add(this.wrapClassName("readonly")), this.isSmallBox && i.classList.add(this.wrapClassName("float-footer")), this.pages.some((x) => x.thumbnail || !x.src.startsWith("ppt"));
      const o = document.createElement("div");
      o.className = this.wrapClassName("page-jumps");
      const c = this.renderFooterBtn("btn-page-back", OP(this.namespace));
      if (this.sideEffect.addEventListener(c, "click", () => {
        this.readonly || this.onNewPageIndex(this.pageIndex - 1);
      }), o.appendChild(c), this.$btnPageBack = c, this.onPlay) {
        const x = this.renderFooterBtn("btn-page-play", BP(this.namespace), jP(this.namespace)), C = () => {
          this.sideEffect.setTimeout(() => {
            x.classList.toggle(this.wrapClassName("footer-btn-playing"), !1);
          }, 500, "returnPlay");
        };
        this.sideEffect.addEventListener(x, "click", () => {
          var I;
          this.readonly || (x.classList.toggle(this.wrapClassName("footer-btn-playing"), !0), (I = this.onPlay) == null || I.call(this), C());
        }), this.$footer.appendChild(x);
      }
      const h = document.createElement("div");
      h.className = this.wrapClassName("page-number");
      const m = document.createElement("span");
      m.className = this.wrapClassName("page-number-input"), m.textContent = String(this.pageIndex + 1), this.$pageNumberInput = m;
      const y = document.createElement("span");
      y.textContent = " / " + this.pages.length, h.appendChild(m), h.appendChild(y), o.appendChild(h);
      const g = this.renderFooterBtn("btn-page-next", LP(this.namespace));
      this.sideEffect.addEventListener(g, "click", () => {
        this.readonly || this.onNewPageIndex(this.pageIndex + 1);
      }), o.appendChild(g), this.$btnPageNext = g, this.$footer.appendChild(o);
    }
    return this.$footer;
  }
  renderFooterBtn(i, o, c) {
    const h = document.createElement("button");
    return h.className = this.wrapClassName("footer-btn") + " " + this.wrapClassName(i), h.appendChild(o), c && h.appendChild(c), h;
  }
  togglePreview(i) {
    var o, c, h, m, y, g, x;
    this.isShowPreview = i != null ? i : !this.isShowPreview, console.log((o = this.context) == null ? void 0 : o.extendWrapper), this.$content.classList.toggle(this.wrapClassName("preview-active"), this.isShowPreview), this.isShowPreview ? ((c = this.context) != null && c.extendWrapper && ((m = (h = this.context) == null ? void 0 : h.extendWrapper) == null || m.appendChild(this.renderPreviewMask()), (g = (y = this.context) == null ? void 0 : y.extendWrapper) == null || g.appendChild(this.renderPreview()), this.context.extendWrapper.style.display = "block"), setTimeout(() => {
      const C = this.$preview.querySelector("." + this.wrapClassName(`preview-page-${this.pageIndex}`));
      C && (this.sideEffect.add(() => {
        const I = new pp({
          container: this.$preview,
          elements_selector: `.${this.wrapClassName("preview-page>img")}`
        });
        return () => I.destroy();
      }, "preview-lazyload"), this.$preview.scrollTo({
        top: C.offsetTop - 16
      })), C && this.$preview.scrollTo({
        top: C.offsetTop - 16
      });
    })) : (x = this.context) != null && x.extendWrapper && (this.context.extendWrapper.style.display = "none", this.context.extendWrapper.innerHTML = "");
  }
  wrapClassName(i) {
    return `${this.namespace}-${i}`;
  }
}
function Dd(r, i, o) {
  return Math.min(Math.max(r, i), o);
}
function $T(r) {
  return r.touches ? r.touches[0] : r;
}
function OE(r) {
  r.stopPropagation(), r.cancelable && r.preventDefault();
}
function LE(r) {
  if (!r)
    return !1;
  const i = r.tagName;
  return i === "INPUT" || i === "TEXTAREA" || i === "SELECT";
}
class Zz {
  constructor(i) {
    var o, c, h;
    this.velocity = 0, this.paused = !0, this._animationFrameID = null, this._loopTimestamp = 0, this.looper = (m) => {
      if (this.paused)
        return;
      let y = Math.floor((m - this._loopTimestamp) / 1e3 * 60) + 1;
      for (this._loopTimestamp = m; y-- > 0; )
        this.stepper();
      this.onStep(this.current, this), !this.paused && this.current !== this.target && window.requestAnimationFrame(this.looper);
    }, this.current = (o = i.start) != null ? o : 0, this.target = this.current, this.stiffness = (c = i.stiffness) != null ? c : 170, this.damping = (h = i.damping) != null ? h : 26, this.onStep = i.onStep;
  }
  stepTo(i, o) {
    this.paused && o != null && (this.current = o), this.paused = !1, this.target = i, this.onStep(this.current, this), this._loopTimestamp = Date.now(), window.requestAnimationFrame(this.looper);
  }
  pause() {
    this.paused = !0;
  }
  destroy() {
    this.pause();
  }
  stepper() {
    const i = -this.stiffness * (this.current - this.target), o = -this.damping * this.velocity, c = this.velocity + (i + o) / 60, h = this.current + c / 60;
    Math.abs(c - 0) < 0.01 && Math.abs(h - this.target) < 0.01 ? (this.current = this.target, this.velocity = 0) : (this.current = h, this.velocity = c);
  }
}
class Yz {
  constructor(i, o, c, h) {
    this.scale = 1, this.lastVisit = Date.now(), this.pageOffsetY = 0, this.pageOffsetX = 0, this.visible = !0, this.index = i, this.page = o, this.scale = c, this.pageOffsetX = (h - o.width) / 2;
    const m = document.createElement("div");
    m.className = "page-renderer-page", m.dataset.index = `${i}`, m.style.width = `${o.width * c}px`, m.style.height = `${o.height * c}px`, o.thumbnail && (m.style.backgroundImage = `url("${o.thumbnail}")`);
    const y = document.createElement("img");
    y.className = "page-renderer-page-img", y.width = o.width, y.height = o.height, y.src = o.src, m.appendChild(y), this.$page = m;
  }
  translateY(i) {
    Math.abs(i - this.pageOffsetY) >= 1e-3 && (this.pageOffsetY = i, this.$page.style.transform = `translate(${this.pageOffsetX * this.scale}px, ${this.pageOffsetY * this.scale}px)`);
  }
  setScale(i) {
    Math.abs(i - this.scale) >= 1e-3 && (this.scale = i, this.$page.style.width = `${this.page.width * this.scale}px`, this.$page.style.height = `${this.page.height * this.scale}px`, this.$page.style.transform = `translate(${this.pageOffsetX * this.scale}px, ${this.pageOffsetY * this.scale}px)`);
  }
  setVisible(i) {
    i !== this.visible && (this.visible = i, this.$page.style.opacity = i ? "1" : "0");
  }
}
const Gz = window.requestIdleCallback || ((r) => window.setTimeout(r, 5e3)), Xz = window.cancelIdleCallback || window.clearTimeout;
class Jz {
  constructor(i, o, c) {
    this.pages = i, this.pagesIntrinsicWidth = o, this.scale = c, this.els = /* @__PURE__ */ new Map(), this.maxElCount = 200, this.gcTimer = null, this.gc = () => {
      if (this.gcTimer = null, this.els.size > this.maxElCount) {
        const h = [...this.els.values()].sort((m, y) => y.lastVisit - m.lastVisit);
        for (let m = Math.floor(this.maxElCount / 4); m < h.length; m++)
          this.els.delete(h[m].index);
      }
    };
  }
  getEl(i) {
    let o = this.els.get(i);
    return o || (o = new Yz(i, this.pages[i], this.scale, this.pagesIntrinsicWidth), this.els.set(i, o)), o.lastVisit = Date.now(), this.els.size > this.maxElCount && this.gcTimer === null && (this.gcTimer = Gz(this.gc)), o;
  }
  setScale(i) {
    i !== this.scale && (this.scale = i, this.els.forEach((o) => o.setScale(i)));
  }
  destroy() {
    this.els.clear(), this.gcTimer !== null && (Xz(this.gcTimer), this.gcTimer = null);
  }
}
class qz {
  constructor(i) {
    this._hwaTimeout = NaN, this._turnOffHWA = () => {
      window.clearTimeout(this._hwaTimeout), this._hwaTimeout = NaN, this.$pages.classList.toggle("is-hwa", !1);
    }, this.pagesScrollTop = i.pagesScrollTop || 0, this.containerWidth = i.containerWidth || 1, this.containerHeight = i.containerHeight || 1, this.pages = i.pages.map((m) => {
      if (m.thumbnail)
        return m;
      try {
        const y = new URL(m.src);
        return y.searchParams.set("x-oss-process", "image/resize,l_50"), KM(qM({}, m), { thumbnail: y.toString() });
      } catch (y) {
        return console.error(y), m;
      }
    });
    const o = Array(this.pages.length);
    let c = 1 / 0, h = 0;
    this.pagesIntrinsicHeight = this.pages.reduce((m, y, g) => (o[g] = m, y.width > h && (h = y.width), y.height <= c && (c = y.height), m + y.height), 0), this.pagesIntrinsicWidth = h, this.pagesMinHeight = c, this.pagesIntrinsicYs = o, this.scale = this._calcScale(), this.threshold = this._calcThreshold(), this.onPageIndexChanged = i.onPageIndexChanged, this.pageScrollIndex = 0, this.pagesScrollTop !== 0 && (this.pageScrollIndex = this.findScrollPageIndex(), this.onPageIndexChanged && this.pageScrollIndex > 0 && this.onPageIndexChanged(this.pageScrollIndex)), this.pageElManager = new Jz(this.pages, h, this.scale), this.$pages = this.renderPages();
  }
  setContainerSize(i, o) {
    i > 0 && o > 0 && (i !== this.containerWidth || o !== this.containerHeight) && (this.containerWidth = i, this.containerHeight = o, this.$pages.style.width = `${this.containerWidth}px`, this.$pages.style.height = `${this.containerHeight}px`, this.scale = this._calcScale(), this.threshold = this._calcThreshold(), this.pageElManager.setScale(this.scale), this.$pages.parentElement && this.pagesScrollTo(this.pagesScrollTop, !0));
  }
  renderPages() {
    const i = document.createElement("div");
    return i.className = "page-renderer-pages-container", i.style.width = `${this.containerWidth}px`, i.style.height = `${this.containerHeight}px`, i;
  }
  pagesScrollTo(i, o) {
    if (i = Dd(i, 0, this.pagesIntrinsicHeight - this.containerHeight / this.scale), o || Math.abs(i - this.pagesScrollTop) >= 1e-3) {
      this._turnOnHWA(), this.pagesScrollTop = i;
      const c = this.findScrollPageIndex(), h = Math.max(c - this.threshold, 0), m = Math.min(c + this.threshold, this.pages.length - 1);
      for (let y = 0; y < this.$pages.children.length; y++) {
        const g = this.$pages.children[y], x = Number(g.dataset.index);
        x >= h && x <= m || (g.remove(), y--);
      }
      for (let y = h; y <= m; y++) {
        const g = this.pageElManager.getEl(y);
        g.$page.parentElement !== this.$pages && this.$pages.appendChild(g.$page), g.translateY(this.pagesIntrinsicYs[y] - this.pagesScrollTop);
      }
      c !== this.pageScrollIndex && (this.pageScrollIndex = c, this.onPageIndexChanged && this.onPageIndexChanged(c));
    }
  }
  findScrollPageIndex() {
    for (let i = 0; i < this.pagesIntrinsicYs.length; i++)
      if (this.pagesIntrinsicYs[i] + this.pages[i].height - this.pagesScrollTop >= 1e-3)
        return i;
    return this.pagesIntrinsicYs.length - 1;
  }
  mount(i) {
    i.appendChild(this.$pages), this.pagesScrollTo(this.pagesScrollTop, !0);
  }
  unmount() {
    this.$pages.remove();
  }
  destroy() {
    this.unmount(), this.onPageIndexChanged = void 0, this.pageElManager.destroy(), this._hwaTimeout && (window.clearTimeout(this._hwaTimeout), this._hwaTimeout = NaN);
  }
  _calcScale() {
    return this.containerWidth / this.pagesIntrinsicWidth || 1;
  }
  _calcThreshold() {
    return Dd(Math.ceil(this.containerHeight / this.scale / this.pagesMinHeight / 2), 1, this.pages.length);
  }
  _turnOnHWA() {
    this._hwaTimeout ? window.clearTimeout(this._hwaTimeout) : this.$pages.classList.toggle("is-hwa", !0), this._hwaTimeout = window.setTimeout(this._turnOffHWA, 1e3);
  }
}
const Kz = 30;
class eO {
  constructor(i) {
    this.sideEffect = new pg(), this.pagesScrollTop = i.pagesScrollTop || 0, this.containerWidth = i.containerWidth || 1, this.containerHeight = i.containerHeight || 1, this.pagesWidth = i.pagesWidth || 1, this.pagesHeight = i.pagesHeight || 1, this.scale = this._calcScale(), this.scrollbarMinHeight = i.scrollbarMinHeight || Kz, this.scrollbarHeight = this._calcScrollbarHeight(), this.readonly = i.readonly, this.wrapClassName = i.wrapClassName, this.onDragScroll = i.onDragScroll, this.$scrollbar = this.renderScrollbar();
  }
  mount(i) {
    i.appendChild(this.$scrollbar), this.pagesScrollTo(this.pagesScrollTop, !0);
  }
  unmount() {
    this.$scrollbar.remove();
  }
  setReadonly(i) {
    this.readonly = i;
  }
  setContainerSize(i, o) {
    i > 0 && o > 0 && (i !== this.containerWidth || o !== this.containerHeight) && (this.containerWidth = i, this.containerHeight = o, this.scale = this._calcScale(), this._updateScrollbarHeight(), this.$scrollbar.parentElement && this.pagesScrollTo(this.pagesScrollTop, !0));
  }
  pagesScrollTo(i, o) {
    if (i = Dd(i, 0, this.pagesHeight - this.containerHeight / this.scale), o || Math.abs(i - this.pagesScrollTop) >= 1e-3) {
      this.pagesScrollTop = i;
      const c = this.pagesScrollTop * this.scale, h = this.pagesHeight * this.scale, m = c / (h - this.containerHeight) * (this.containerHeight - this.scrollbarHeight);
      window.requestAnimationFrame ? window.requestAnimationFrame(() => {
        this.$scrollbar.style.transform = `translateY(${m}px)`;
      }) : this.$scrollbar.style.transform = `translateY(${m}px)`;
    }
  }
  destroy() {
    this.unmount(), this.onDragScroll = void 0, this.sideEffect.flushAll();
  }
  renderScrollbar() {
    const i = document.createElement("button");
    i.className = this.wrapClassName("scrollbar"), i.style.minHeight = `${this.scrollbarMinHeight}px`, i.style.height = `${this.scrollbarHeight}px`;
    const o = (c) => {
      if (this.readonly || c.button != null && c.button !== 0)
        return;
      OE(c);
      const h = this.wrapClassName("scrollbar-dragging");
      i.classList.toggle(h, !0);
      const m = this.pagesScrollTop, { clientY: y } = $T(c), g = (C) => {
        if (this.readonly)
          return;
        const { clientY: I } = $T(C), A = (I - y) / this.scale;
        Math.abs(A) > 0 && this.onDragScroll && this.onDragScroll(m + A * (this.pagesHeight * this.scale / this.containerHeight));
      }, x = () => {
        i.classList.toggle(h, !1), window.removeEventListener("mousemove", g, !0), window.removeEventListener("touchmove", g, !0), window.removeEventListener("mouseup", x, !0), window.removeEventListener("touchend", x, !0), window.removeEventListener("touchcancel", x, !0);
      };
      window.addEventListener("mousemove", g, !0), window.addEventListener("touchmove", g, !0), window.addEventListener("mouseup", x, !0), window.addEventListener("touchend", x, !0), window.addEventListener("touchcancel", x, !0);
    };
    return this.sideEffect.addEventListener(i, "mousedown", o), this.sideEffect.addEventListener(i, "touchstart", o), i;
  }
  _calcScale() {
    return this.containerWidth / this.pagesWidth || 1;
  }
  _calcScrollbarHeight() {
    return Dd(this.containerHeight / (this.pagesHeight * this.scale) * this.containerHeight, this.scrollbarMinHeight, this.containerHeight);
  }
  _updateScrollbarHeight() {
    const i = this._calcScrollbarHeight();
    Math.abs(i - this.scrollbarHeight) > 1e-3 && (this.scrollbarHeight = i, this.$scrollbar.style.height = `${i}px`);
  }
}
const tO = window.ResizeObserver || zP, Fh = 640;
class nO {
  constructor({
    context: i,
    whiteboardView: o,
    readonly: c,
    box: h,
    pages: m,
    pageScrollTop: y = 0,
    mountWhiteboard: g,
    onUserScroll: x,
    baseScenePath: C,
    appId: I
  }) {
    this.sideEffect = new pg(), this.userScrolling = !1, this.onNewPageIndex = (V) => {
      this.scrollToPage(V);
    }, this.toPdf = async () => {
      const V = document.createElement("canvas"), q = V.getContext("2d");
      if (!q || !this.baseScenePath) {
        this.reportProgress(100, null);
        return;
      }
      const G = this.whiteboardView.focusScenePath || `${this.baseScenePath}/1`, he = this.pages[0], { jsPDF: se } = await import("jspdf"), Z = new se({
        format: [he.width, he.height],
        orientation: he.width > he.height ? "l" : "p",
        compress: !0
      });
      for (const [oe, Ne] of this.pages.entries()) {
        const { width: Fe, height: Pe, src: Y } = Ne;
        V.width = Fe, V.height = Pe;
        const fe = Fe > Pe ? "l" : "p";
        oe > 0 && Z.addPage([Fe, Pe], fe);
        const be = await this.getBase64FromUrl(Y), ie = document.createElement("img");
        ie.src = be, await new Promise((Ve) => ie.onload = Ve), q.drawImage(ie, 0, 0);
        const ct = V.toDataURL("image/jpeg", 0.6);
        q.clearRect(0, 0, Fe, Pe);
        const Oe = {
          centerX: Fe / 2,
          centerY: Pe / 2 + oe * Pe,
          scale: 1
        }, ce = this.context.manager.windowManger;
        ce._appliancePlugin ? await ce._appliancePlugin.screenshotToCanvasAsync(q, G, Fe, Pe, Oe) : this.whiteboardView.screenshotToCanvas(q, G, Fe, Pe, Oe);
        const Qe = V.toDataURL("image/png");
        Z.addImage(ct, "JPEG", 0, 0, Fe, Pe, "", "FAST"), Z.addImage(Qe, "PNG", 0, 0, Fe, Pe, "", "FAST"), q.clearRect(0, 0, Fe, Pe), Math.ceil((oe + 1) / this.pages.length * 100) < 100 && this.reportProgress(Math.ceil((oe + 1) / this.pages.length * 100), null);
      }
      const ue = Z.output("arraybuffer");
      this.reportProgress(100, { pdf: ue, title: this.box.title });
    }, this.context = i, this.whiteboardView = o, this.readonly = c, this.box = h, this.pages = m, this.baseScenePath = C, this.appId = I, this.mountWhiteboard = g, this._onUserScroll = x;
    const A = this.debounce(() => {
      this.userScrolling = !1, this._onUserScroll && this._onUserScroll(this.pageRenderer.pagesScrollTop);
    }, { wait: 80 }, "debounce-updateUserScroll");
    this.updateUserScroll = () => {
      this.userScrolling = !0, A();
    }, this.viewer = new zE({
      context: i,
      readonly: c,
      box: h,
      pages: m,
      onNewPageIndex: this.onNewPageIndex
    });
    const { width: z, height: $ } = this.whiteboardView.size;
    this.pageRenderer = new qz({
      pagesScrollTop: y,
      pages: this.pages,
      containerWidth: z,
      containerHeight: $,
      onPageIndexChanged: this.viewer.setPageIndex.bind(this.viewer)
    }), this.scrollbar = new eO({
      pagesScrollTop: this.pageRenderer.pagesScrollTop,
      containerWidth: z,
      containerHeight: $,
      pagesWidth: this.pageRenderer.pagesIntrinsicWidth,
      pagesHeight: this.pageRenderer.pagesIntrinsicHeight,
      readonly: this.readonly,
      wrapClassName: this.wrapClassName.bind(this),
      onDragScroll: (V) => {
        this.pageScrollTo(V), this.updateUserScroll();
      }
    }), this.pageScrollStepper = new Zz({
      start: this.pageRenderer.pagesScrollTop,
      onStep: (V) => {
        this.pageScrollTo(V);
      }
    }), this.render();
  }
  mount() {
    this.viewer.mount(), this.setupScrollListener();
    const i = this.debounce(this.renderRatioHeight.bind(this), {
      wait: 80
    });
    return this.sideEffect.add(() => {
      const o = new tO(i);
      return o.observe(this.viewer.$content), () => o.disconnect();
    }), this.sideEffect.setTimeout(() => {
      this.userScrolling || this.pageScrollTo(this.pageRenderer.pagesScrollTop);
    }, 100), this.sideEffect.add(() => {
      const o = (c) => {
        c.data.type === "@netless/_request_save_pdf_" && c.data.appId === this.appId && this.toPdf().catch(() => this.reportProgress(100, null));
      };
      return window.addEventListener("message", o), () => {
        window.removeEventListener("message", o);
      };
    }), this;
  }
  unmount() {
    return this.viewer.unmount(), this;
  }
  setReadonly(i) {
    this.readonly !== i && (this.readonly = i, this.viewer.setReadonly(i), this.scrollbar.setReadonly(i));
  }
  destroy() {
    this.sideEffect.flushAll(), this.pageScrollStepper.destroy(), this._onUserScroll = void 0, this.unmount(), this.viewer.destroy(), this.pageRenderer.destroy(), this.scrollbar.destroy();
  }
  syncPageScrollTop(i) {
    !this.userScrolling && i >= 0 && Math.abs(this.pageRenderer.pagesScrollTop - i) > 0.01 && this.pageScrollStepper.stepTo(i, this.pageRenderer.pagesScrollTop);
  }
  render() {
    this.pageRenderer.mount(this.viewer.$content), this.viewer.$content.appendChild(this.renderWhiteboardView()), this.scrollbar.mount(this.viewer.$content), this.renderRatioHeight();
  }
  renderRatioHeight() {
    const i = this.box.absoluteHeight, o = i <= Fh;
    if (this.viewer.setSmallBox(o), o) {
      const c = 26 / Fh, h = 26 / i, m = 26 / Fh, y = 0, g = Math.max((c + m - (h + y)) / 2, 0);
      if (this.box.$titleBar) {
        const x = h + g;
        this.box.$titleBar.style.height = `${x * 100}%`;
      }
      if (this.box.$footer) {
        const x = y + g;
        this.box.$footer.style.height = `${x * 100}%`;
      }
    } else {
      if (this.box.$titleBar) {
        const c = Math.max(26 / Fh, 26 / i);
        this.box.$titleBar.style.height = `${c * 100}%`;
      }
      if (this.box.$footer) {
        const c = Math.max(26 / Fh, 26 / i);
        this.box.$footer.style.height = `${c * 100}%`;
      }
    }
  }
  renderWhiteboardView() {
    return this.$whiteboardView || (this.$whiteboardView = document.createElement("div"), this.$whiteboardView.className = this.wrapClassName("wb-view"), this.mountWhiteboard(this.$whiteboardView), this.sideEffect.addEventListener(this.$whiteboardView, "wheel", (i) => {
      OE(i), this.readonly || (this.pageScrollTo(this.pageRenderer.pagesScrollTop + i.deltaY), this.updateUserScroll());
    }, { passive: !1, capture: !0 }), this.sideEffect.addEventListener(this.$whiteboardView, "touchmove", (i) => {
      this.readonly || i.touches.length <= 1 || this.updateUserScroll();
    }, { passive: !0, capture: !0 })), this.$whiteboardView;
  }
  scrollTopPageToEl(i) {
    return i * this.pageRenderer.scale;
  }
  scrollTopElToPage(i) {
    return i / this.pageRenderer.scale;
  }
  elScrollTo(i) {
    this.pageScrollTo(this.scrollTopElToPage(i));
  }
  pageScrollTo(i) {
    const o = this.scrollTopElToPage(this.whiteboardView.size.height / 2);
    this.whiteboardView.moveCamera({
      centerY: Dd(i + o, o, this.pageRenderer.pagesIntrinsicHeight - o),
      animationMode: "immediately"
    });
  }
  scrollToPage(i) {
    if (!this.readonly && !Number.isNaN(i)) {
      const o = this.pageRenderer.pagesIntrinsicYs[i];
      o >= 0 && (this.pageScrollTo(o + 5 / this.pageRenderer.scale), this.updateUserScroll());
    }
  }
  setupScrollListener() {
    this.sideEffect.add(() => {
      const i = (o) => {
        const { width: c, height: h } = this.whiteboardView.size;
        if (c <= 0 || h <= 0)
          return;
        const m = o.centerY - this.pageRenderer.containerHeight / this.pageRenderer.scale / 2;
        this.pageRenderer.pagesScrollTo(m), this.scrollbar.pagesScrollTo(m);
      };
      return this.whiteboardView.callbacks.on("onCameraUpdated", i), () => this.whiteboardView.callbacks.off("onCameraUpdated", i);
    }), this.sideEffect.add(() => {
      const { updateUserScroll: i } = this;
      return this.whiteboardView.callbacks.on("onCameraUpdatedByDevice", i), () => this.whiteboardView.callbacks.off("onCameraUpdatedByDevice", i);
    }), this.sideEffect.add(() => {
      const i = ({ width: o, height: c }) => {
        if (o <= 0 || c <= 0)
          return;
        this.pageRenderer.setContainerSize(o, c), this.scrollbar.setContainerSize(o, c);
        const { pagesIntrinsicWidth: h, pagesIntrinsicHeight: m } = this.pageRenderer;
        this.whiteboardView.moveCameraToContain({
          originX: 0,
          originY: this.pageRenderer.pagesScrollTop,
          width: h,
          height: c / this.pageRenderer.scale,
          animationMode: "immediately"
        }), this.whiteboardView.setCameraBound({
          damping: 1,
          maxContentMode: () => this.pageRenderer.scale,
          minContentMode: () => this.pageRenderer.scale,
          centerX: h / 2,
          centerY: m / 2,
          width: h,
          height: m
        });
      };
      return this.whiteboardView.callbacks.on("onSizeUpdated", i), () => {
        this.whiteboardView.callbacks.off("onSizeUpdated", i);
      };
    }, "whiteboard-size-update"), this.sideEffect.addEventListener(window, "keyup", (i) => {
      if (this.readonly || !this.box.focus || this.box.minimized || LE(i.target))
        return;
      let o = null;
      switch (i.key) {
        case "PageDown": {
          o = this.pageRenderer.pagesScrollTop + this.pageRenderer.containerHeight / this.pageRenderer.scale;
          break;
        }
        case "PageUp": {
          o = this.pageRenderer.pagesScrollTop - this.pageRenderer.containerHeight / this.pageRenderer.scale;
          break;
        }
        case "ArrowDown": {
          o = this.pageRenderer.pagesScrollTop + this.pageRenderer.containerHeight / 4 / this.pageRenderer.scale;
          break;
        }
        case "ArrowUp": {
          o = this.pageRenderer.pagesScrollTop - this.pageRenderer.containerHeight / 4 / this.pageRenderer.scale;
          break;
        }
      }
      o !== null && (this._onUserScroll ? this._onUserScroll(o) : (this.pageScrollTo(o), this.updateUserScroll()));
    }, { capture: !0 });
  }
  debounce(i, o, c) {
    const h = uP(i, o);
    return this.sideEffect.addDisposer(() => h.cancel(), c), h;
  }
  wrapClassName(i) {
    return "netless-app-docs-viewer-static-" + i;
  }
  async getBase64FromUrl(i) {
    const c = await (await fetch(this._invalidate(i))).blob();
    return new Promise((h) => {
      const m = new FileReader();
      m.readAsDataURL(c), m.onloadend = () => {
        const y = m.result;
        h(y);
      };
    });
  }
  _invalidate(i) {
    try {
      const o = new URL(i);
      return o.searchParams.set("t", Date.now().toString()), o.toString();
    } catch {
      return i;
    }
  }
  reportProgress(i, o) {
    window.postMessage({
      type: "@netless/_result_save_pdf_",
      appId: this.appId,
      progress: i,
      result: o
    });
  }
}
class iO {
  constructor({ context: i, whiteboardView: o, box: c, pages: h }) {
    this.sideEffect = new pg(), this.onPlayPPT = () => {
      const m = this.context.getRoom();
      m && m.pptNextStep();
    }, this._scaleDocsToFitImpl = () => {
      const m = this.pages[this.getPageIndex()];
      m && (this.whiteboardView.moveCameraToContain({
        originX: -m.width / 2,
        originY: -m.height / 2,
        width: m.width,
        height: m.height,
        animationMode: "immediately"
      }), this.whiteboardView.setCameraBound({
        damping: 1,
        maxContentMode: () => this.whiteboardView.camera.scale,
        minContentMode: () => this.whiteboardView.camera.scale,
        centerX: 0,
        centerY: 0,
        width: m.width,
        height: m.height
      }));
    }, this._scaleDocsToFitDebounced = () => {
      this.sideEffect.setTimeout(this._scaleDocsToFitImpl, 1e3, "_scaleDocsToFitDebounced");
    }, this.scaleDocsToFit = () => {
      this._scaleDocsToFitImpl(), this._scaleDocsToFitDebounced();
    }, this.onNewPageIndex = (m) => {
      this.jumpToPage(m, !0);
    }, this.context = i, this.whiteboardView = o, this.box = c, this.pages = h, this.displayer = i.getDisplayer(), this.viewer = new zE({
      context: i,
      readonly: !i.getIsWritable(),
      box: c,
      pages: h,
      onNewPageIndex: this.onNewPageIndex,
      onPlay: this.onPlayPPT
    }), this.render(), this.sideEffect.add(() => {
      const m = (y) => {
        this.viewer.setReadonly(!y);
      };
      return this.context.emitter.on("writableChange", m), () => this.context.emitter.off("writableChange", m);
    }), this.sideEffect.add(() => {
      const m = (y) => {
        this.jumpToPage(y.index);
      };
      return this.context.emitter.on("sceneStateChange", m), () => this.context.emitter.off("sceneStateChange", m);
    }), this.sideEffect.add(() => {
      const m = (y) => {
        this.jumpToPage(y.index);
      };
      return this.context.emitter.on("pageStateChange", m), () => this.context.emitter.off("pageStateChange", m);
    }), this.sideEffect.add(() => {
      const m = (y) => {
        this.viewer.togglePreview(y);
      };
      return this.context.emitter.on("togglePreview", m), () => this.context.emitter.off("togglePreview", m);
    });
  }
  mount() {
    this.viewer.mount();
    const i = this.getPageIndex();
    return i !== 0 && this.jumpToPage(i), this.scaleDocsToFit(), this.sideEffect.add(() => (this.whiteboardView.callbacks.on("onSizeUpdated", this.scaleDocsToFit), () => {
      this.whiteboardView.callbacks.off("onSizeUpdated", this.scaleDocsToFit);
    })), this;
  }
  unmount() {
    return this.viewer.unmount(), this;
  }
  destroy() {
    this.sideEffect.flushAll(), this.unmount(), this.viewer.destroy();
  }
  getPageIndex() {
    return this.displayer.state.sceneState.index;
  }
  jumpToPage(i, o) {
    var c, h;
    if (i = Dd(i, 0, this.pages.length - 1), i !== this.getPageIndex() && this.context.getIsWritable()) {
      const m = this.context.getInitScenePath(), y = (h = (c = this.context.getScenes()) == null ? void 0 : c[i]) == null ? void 0 : h.name;
      m && y && this.context.setScenePath(`${m}/${y}`), this.scaleDocsToFit();
    }
    if (i !== this.viewer.pageIndex && this.viewer.setPageIndex(i), o) {
      const m = this.context.getRoom();
      if (m) {
        const y = m.state.globalState.__pptState;
        m.setGlobalState({
          __pptState: y && {
            uuid: y.uuid,
            pageIndex: i,
            disableAutoPlay: y.disableAutoPlay
          }
        });
      }
    }
  }
  render() {
    this.viewer.$content.appendChild(this.renderMask()), this.viewer.$content.appendChild(this.renderWhiteboardView()), this.sideEffect.addEventListener(window, "keydown", (i) => {
      var o;
      if (this.box.focus && !LE(i.target))
        switch (i.key) {
          case "ArrowUp":
          case "ArrowLeft": {
            this.jumpToPage(this.getPageIndex() - 1, !0);
            break;
          }
          case "ArrowRight":
          case "ArrowDown": {
            (o = this.context.getRoom()) == null || o.pptNextStep();
            break;
          }
        }
    });
  }
  renderMask() {
    if (!this.$mask) {
      const i = document.createElement("div");
      i.className = this.wrapClassName("mask"), this.$mask = i;
      const o = document.createElement("button");
      o.className = this.wrapClassName("back");
      const c = document.createElement("button");
      c.className = this.wrapClassName("next");
    }
    return this.$mask;
  }
  renderWhiteboardView() {
    return this.$whiteboardView || (this.$whiteboardView = document.createElement("div"), this.$whiteboardView.className = this.wrapClassName("wb-view"), this.sideEffect.addEventListener(this.$whiteboardView, "click", (i) => {
      var o;
      const c = this.context.getRoom();
      if (c && c.state.memberState.currentApplianceName === "clicker") {
        for (let h = i.target; h; h = h.parentElement)
          if ((o = h.classList) != null && o.contains("ppt-event-source"))
            return;
        c.pptNextStep();
      }
    }), this.context.mountView(this.$whiteboardView)), this.$whiteboardView;
  }
  wrapClassName(i) {
    return "netless-app-docs-viewer-dynamic-" + i;
  }
}
const rO = "DocsViewer", qb = {
  kind: rO,
  setup(r) {
    const i = r.getBox(), o = r.getScenes();
    if (!o)
      throw new Error("[Docs Viewer]: scenes not found.");
    const c = r.getView();
    if (console.log(r.storage.state), !c)
      throw new Error("[Docs Viewer]: no whiteboard view.");
    const h = o.map(({ ppt: m }) => m ? {
      width: m.width,
      height: m.height,
      src: m.src,
      thumbnail: m.previewURL
    } : null).filter((m) => Boolean(m));
    if (h.length <= 0)
      throw new Error("[Docs Viewer]: empty scenes.");
    return i.mountStyles(eP), h[0].src.startsWith("ppt") ? sO(r, c, i, h) : aO(r, c, i, h);
  }
};
function aO(r, i, o, c) {
  var h;
  i.disableCameraTransform = !r.getIsWritable();
  const m = new nO({
    context: r,
    whiteboardView: i,
    readonly: !r.getIsWritable(),
    box: o,
    pages: c,
    pageScrollTop: (h = r.getAttributes()) == null ? void 0 : h.pageScrollTop,
    mountWhiteboard: r.mountView.bind(r),
    onUserScroll: (y) => {
      var g;
      ((g = r.getAttributes()) == null ? void 0 : g.pageScrollTop) !== y && !o.readonly && r.updateAttributes(["pageScrollTop"], y);
    },
    baseScenePath: r.getInitScenePath(),
    appId: r.appId
  }).mount();
  return m.viewer.onPageIndexChanged = (y) => {
    r.dispatchAppEvent("pageStateChange", { index: y, length: c.length });
  }, r.dispatchAppEvent("pageStateChange", {
    index: m.viewer.pageIndex,
    length: c.length
  }), r.emitter.on("attributesUpdate", (y) => {
    y && y.pageScrollTop != null && m.syncPageScrollTop(y.pageScrollTop);
  }), r.emitter.on("writableChange", (y) => {
    m.setReadonly(!y), i.disableCameraTransform = !y;
  }), {
    viewer: () => m,
    position: () => {
      const y = m == null ? void 0 : m.viewer;
      if (y)
        return [y.pageIndex, m.pages.length];
    }
  };
}
function sO(r, i, o, c) {
  i.disableCameraTransform = !0;
  const h = new iO({
    context: r,
    whiteboardView: i,
    box: o,
    pages: c
  }).mount();
  return h.viewer.onPageIndexChanged = (m) => {
    r.dispatchAppEvent("pageStateChange", { index: m, length: c.length });
  }, r.dispatchAppEvent("pageStateChange", {
    index: h.getPageIndex(),
    length: c.length
  }), r.mountView(h.$whiteboardView), r.isAddApp && i.callbacks.once("onSizeUpdated", ({ width: m, height: y }) => {
    if (c.length > 0 && o.state !== "maximized") {
      const { width: g, height: x } = c[0], I = x / g * m - y;
      I !== 0 && r.getIsWritable() && r.emitter.emit("setBoxSize", {
        width: o.width,
        height: o.height + I / o.containerRect.height
      });
    }
  }), {
    viewer: () => h,
    position: () => {
      const m = h == null ? void 0 : h.viewer;
      if (m)
        return [m.pageIndex, h.pages.length];
    },
    nextStep: () => h.onPlayPPT(),
    nextPage: () => h.jumpToPage(h.getPageIndex() + 1, !0),
    prevPage: () => h.jumpToPage(h.getPageIndex() + 1, !0),
    jumpToPage: (m) => {
      typeof m == "number" && h.jumpToPage(m, !0);
    },
    togglePreview: (m) => {
      h.viewer.togglePreview(m);
    }
  };
}
function BE(r) {
  return r && r.__esModule && Object.prototype.hasOwnProperty.call(r, "default") ? r.default : r;
}
var hl = { exports: {} }, Ot = {};
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var Cb, QT;
function wg() {
  if (QT)
    return Cb;
  QT = 1;
  var r = Object.getOwnPropertySymbols, i = Object.prototype.hasOwnProperty, o = Object.prototype.propertyIsEnumerable;
  function c(m) {
    if (m == null)
      throw new TypeError("Object.assign cannot be called with null or undefined");
    return Object(m);
  }
  function h() {
    try {
      if (!Object.assign)
        return !1;
      var m = new String("abc");
      if (m[5] = "de", Object.getOwnPropertyNames(m)[0] === "5")
        return !1;
      for (var y = {}, g = 0; g < 10; g++)
        y["_" + String.fromCharCode(g)] = g;
      var x = Object.getOwnPropertyNames(y).map(function(I) {
        return y[I];
      });
      if (x.join("") !== "0123456789")
        return !1;
      var C = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(I) {
        C[I] = I;
      }), Object.keys(Object.assign({}, C)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return Cb = h() ? Object.assign : function(m, y) {
    for (var g, x = c(m), C, I = 1; I < arguments.length; I++) {
      g = Object(arguments[I]);
      for (var A in g)
        i.call(g, A) && (x[A] = g[A]);
      if (r) {
        C = r(g);
        for (var z = 0; z < C.length; z++)
          o.call(g, C[z]) && (x[C[z]] = g[C[z]]);
      }
    }
    return x;
  }, Cb;
}
/** @license React v16.14.0
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var ZT;
function oO() {
  if (ZT)
    return Ot;
  ZT = 1;
  var r = wg(), i = typeof Symbol == "function" && Symbol.for, o = i ? Symbol.for("react.element") : 60103, c = i ? Symbol.for("react.portal") : 60106, h = i ? Symbol.for("react.fragment") : 60107, m = i ? Symbol.for("react.strict_mode") : 60108, y = i ? Symbol.for("react.profiler") : 60114, g = i ? Symbol.for("react.provider") : 60109, x = i ? Symbol.for("react.context") : 60110, C = i ? Symbol.for("react.forward_ref") : 60112, I = i ? Symbol.for("react.suspense") : 60113, A = i ? Symbol.for("react.memo") : 60115, z = i ? Symbol.for("react.lazy") : 60116, $ = typeof Symbol == "function" && Symbol.iterator;
  function V(D) {
    for (var B = "https://reactjs.org/docs/error-decoder.html?invariant=" + D, ee = 1; ee < arguments.length; ee++)
      B += "&args[]=" + encodeURIComponent(arguments[ee]);
    return "Minified React error #" + D + "; visit " + B + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  var q = { isMounted: function() {
    return !1;
  }, enqueueForceUpdate: function() {
  }, enqueueReplaceState: function() {
  }, enqueueSetState: function() {
  } }, G = {};
  function he(D, B, ee) {
    this.props = D, this.context = B, this.refs = G, this.updater = ee || q;
  }
  he.prototype.isReactComponent = {}, he.prototype.setState = function(D, B) {
    if (typeof D != "object" && typeof D != "function" && D != null)
      throw Error(V(85));
    this.updater.enqueueSetState(this, D, B, "setState");
  }, he.prototype.forceUpdate = function(D) {
    this.updater.enqueueForceUpdate(this, D, "forceUpdate");
  };
  function se() {
  }
  se.prototype = he.prototype;
  function Z(D, B, ee) {
    this.props = D, this.context = B, this.refs = G, this.updater = ee || q;
  }
  var ue = Z.prototype = new se();
  ue.constructor = Z, r(ue, he.prototype), ue.isPureReactComponent = !0;
  var oe = { current: null }, Ne = Object.prototype.hasOwnProperty, Fe = { key: !0, ref: !0, __self: !0, __source: !0 };
  function Pe(D, B, ee) {
    var Ce, ge = {}, it = null, Xe = null;
    if (B != null)
      for (Ce in B.ref !== void 0 && (Xe = B.ref), B.key !== void 0 && (it = "" + B.key), B)
        Ne.call(B, Ce) && !Fe.hasOwnProperty(Ce) && (ge[Ce] = B[Ce]);
    var Be = arguments.length - 2;
    if (Be === 1)
      ge.children = ee;
    else if (1 < Be) {
      for (var dt = Array(Be), gt = 0; gt < Be; gt++)
        dt[gt] = arguments[gt + 2];
      ge.children = dt;
    }
    if (D && D.defaultProps)
      for (Ce in Be = D.defaultProps, Be)
        ge[Ce] === void 0 && (ge[Ce] = Be[Ce]);
    return { $$typeof: o, type: D, key: it, ref: Xe, props: ge, _owner: oe.current };
  }
  function Y(D, B) {
    return { $$typeof: o, type: D.type, key: B, ref: D.ref, props: D.props, _owner: D._owner };
  }
  function fe(D) {
    return typeof D == "object" && D !== null && D.$$typeof === o;
  }
  function be(D) {
    var B = { "=": "=0", ":": "=2" };
    return "$" + ("" + D).replace(/[=:]/g, function(ee) {
      return B[ee];
    });
  }
  var ie = /\/+/g, ct = [];
  function Oe(D, B, ee, Ce) {
    if (ct.length) {
      var ge = ct.pop();
      return ge.result = D, ge.keyPrefix = B, ge.func = ee, ge.context = Ce, ge.count = 0, ge;
    }
    return { result: D, keyPrefix: B, func: ee, context: Ce, count: 0 };
  }
  function ce(D) {
    D.result = null, D.keyPrefix = null, D.func = null, D.context = null, D.count = 0, 10 > ct.length && ct.push(D);
  }
  function Qe(D, B, ee, Ce) {
    var ge = typeof D;
    (ge === "undefined" || ge === "boolean") && (D = null);
    var it = !1;
    if (D === null)
      it = !0;
    else
      switch (ge) {
        case "string":
        case "number":
          it = !0;
          break;
        case "object":
          switch (D.$$typeof) {
            case o:
            case c:
              it = !0;
          }
      }
    if (it)
      return ee(Ce, D, B === "" ? "." + Ve(D, 0) : B), 1;
    if (it = 0, B = B === "" ? "." : B + ":", Array.isArray(D))
      for (var Xe = 0; Xe < D.length; Xe++) {
        ge = D[Xe];
        var Be = B + Ve(ge, Xe);
        it += Qe(ge, Be, ee, Ce);
      }
    else if (D === null || typeof D != "object" ? Be = null : (Be = $ && D[$] || D["@@iterator"], Be = typeof Be == "function" ? Be : null), typeof Be == "function")
      for (D = Be.call(D), Xe = 0; !(ge = D.next()).done; )
        ge = ge.value, Be = B + Ve(ge, Xe++), it += Qe(ge, Be, ee, Ce);
    else if (ge === "object")
      throw ee = "" + D, Error(V(31, ee === "[object Object]" ? "object with keys {" + Object.keys(D).join(", ") + "}" : ee, ""));
    return it;
  }
  function Se(D, B, ee) {
    return D == null ? 0 : Qe(D, "", B, ee);
  }
  function Ve(D, B) {
    return typeof D == "object" && D !== null && D.key != null ? be(D.key) : B.toString(36);
  }
  function Re(D, B) {
    D.func.call(D.context, B, D.count++);
  }
  function $e(D, B, ee) {
    var Ce = D.result, ge = D.keyPrefix;
    D = D.func.call(D.context, B, D.count++), Array.isArray(D) ? Tt(D, Ce, ee, function(it) {
      return it;
    }) : D != null && (fe(D) && (D = Y(D, ge + (!D.key || B && B.key === D.key ? "" : ("" + D.key).replace(ie, "$&/") + "/") + ee)), Ce.push(D));
  }
  function Tt(D, B, ee, Ce, ge) {
    var it = "";
    ee != null && (it = ("" + ee).replace(ie, "$&/") + "/"), B = Oe(B, it, Ce, ge), Se(D, $e, B), ce(B);
  }
  var Bt = { current: null };
  function Ge() {
    var D = Bt.current;
    if (D === null)
      throw Error(V(321));
    return D;
  }
  var re = { ReactCurrentDispatcher: Bt, ReactCurrentBatchConfig: { suspense: null }, ReactCurrentOwner: oe, IsSomeRendererActing: { current: !1 }, assign: r };
  return Ot.Children = { map: function(D, B, ee) {
    if (D == null)
      return D;
    var Ce = [];
    return Tt(D, Ce, null, B, ee), Ce;
  }, forEach: function(D, B, ee) {
    if (D == null)
      return D;
    B = Oe(null, null, B, ee), Se(D, Re, B), ce(B);
  }, count: function(D) {
    return Se(D, function() {
      return null;
    }, null);
  }, toArray: function(D) {
    var B = [];
    return Tt(D, B, null, function(ee) {
      return ee;
    }), B;
  }, only: function(D) {
    if (!fe(D))
      throw Error(V(143));
    return D;
  } }, Ot.Component = he, Ot.Fragment = h, Ot.Profiler = y, Ot.PureComponent = Z, Ot.StrictMode = m, Ot.Suspense = I, Ot.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = re, Ot.cloneElement = function(D, B, ee) {
    if (D == null)
      throw Error(V(267, D));
    var Ce = r({}, D.props), ge = D.key, it = D.ref, Xe = D._owner;
    if (B != null) {
      if (B.ref !== void 0 && (it = B.ref, Xe = oe.current), B.key !== void 0 && (ge = "" + B.key), D.type && D.type.defaultProps)
        var Be = D.type.defaultProps;
      for (dt in B)
        Ne.call(B, dt) && !Fe.hasOwnProperty(dt) && (Ce[dt] = B[dt] === void 0 && Be !== void 0 ? Be[dt] : B[dt]);
    }
    var dt = arguments.length - 2;
    if (dt === 1)
      Ce.children = ee;
    else if (1 < dt) {
      Be = Array(dt);
      for (var gt = 0; gt < dt; gt++)
        Be[gt] = arguments[gt + 2];
      Ce.children = Be;
    }
    return {
      $$typeof: o,
      type: D.type,
      key: ge,
      ref: it,
      props: Ce,
      _owner: Xe
    };
  }, Ot.createContext = function(D, B) {
    return B === void 0 && (B = null), D = { $$typeof: x, _calculateChangedBits: B, _currentValue: D, _currentValue2: D, _threadCount: 0, Provider: null, Consumer: null }, D.Provider = { $$typeof: g, _context: D }, D.Consumer = D;
  }, Ot.createElement = Pe, Ot.createFactory = function(D) {
    var B = Pe.bind(null, D);
    return B.type = D, B;
  }, Ot.createRef = function() {
    return { current: null };
  }, Ot.forwardRef = function(D) {
    return { $$typeof: C, render: D };
  }, Ot.isValidElement = fe, Ot.lazy = function(D) {
    return { $$typeof: z, _ctor: D, _status: -1, _result: null };
  }, Ot.memo = function(D, B) {
    return { $$typeof: A, type: D, compare: B === void 0 ? null : B };
  }, Ot.useCallback = function(D, B) {
    return Ge().useCallback(D, B);
  }, Ot.useContext = function(D, B) {
    return Ge().useContext(D, B);
  }, Ot.useDebugValue = function() {
  }, Ot.useEffect = function(D, B) {
    return Ge().useEffect(D, B);
  }, Ot.useImperativeHandle = function(D, B, ee) {
    return Ge().useImperativeHandle(D, B, ee);
  }, Ot.useLayoutEffect = function(D, B) {
    return Ge().useLayoutEffect(D, B);
  }, Ot.useMemo = function(D, B) {
    return Ge().useMemo(D, B);
  }, Ot.useReducer = function(D, B, ee) {
    return Ge().useReducer(D, B, ee);
  }, Ot.useRef = function(D) {
    return Ge().useRef(D);
  }, Ot.useState = function(D) {
    return Ge().useState(D);
  }, Ot.version = "16.14.0", Ot;
}
var Lt = {}, Tb, YT;
function lO() {
  if (YT)
    return Tb;
  YT = 1;
  var r = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return Tb = r, Tb;
}
var Mb, GT;
function uO() {
  return GT || (GT = 1, Mb = Function.call.bind(Object.prototype.hasOwnProperty)), Mb;
}
var Eb, XT;
function jE() {
  if (XT)
    return Eb;
  XT = 1;
  var r = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var i = lO(), o = {}, c = uO();
    r = function(m) {
      var y = "Warning: " + m;
      typeof console < "u" && console.error(y);
      try {
        throw new Error(y);
      } catch {
      }
    };
  }
  function h(m, y, g, x, C) {
    if (process.env.NODE_ENV !== "production") {
      for (var I in m)
        if (c(m, I)) {
          var A;
          try {
            if (typeof m[I] != "function") {
              var z = Error(
                (x || "React class") + ": " + g + " type `" + I + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof m[I] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw z.name = "Invariant Violation", z;
            }
            A = m[I](y, I, x, g, null, i);
          } catch (V) {
            A = V;
          }
          if (A && !(A instanceof Error) && r(
            (x || "React class") + ": type specification of " + g + " `" + I + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof A + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), A instanceof Error && !(A.message in o)) {
            o[A.message] = !0;
            var $ = C ? C() : "";
            r(
              "Failed " + g + " type: " + A.message + ($ != null ? $ : "")
            );
          }
        }
    }
  }
  return h.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (o = {});
  }, Eb = h, Eb;
}
/** @license React v16.14.0
 * react.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var JT;
function cO() {
  return JT || (JT = 1, process.env.NODE_ENV !== "production" && function() {
    var r = wg(), i = jE(), o = "16.14.0", c = typeof Symbol == "function" && Symbol.for, h = c ? Symbol.for("react.element") : 60103, m = c ? Symbol.for("react.portal") : 60106, y = c ? Symbol.for("react.fragment") : 60107, g = c ? Symbol.for("react.strict_mode") : 60108, x = c ? Symbol.for("react.profiler") : 60114, C = c ? Symbol.for("react.provider") : 60109, I = c ? Symbol.for("react.context") : 60110, A = c ? Symbol.for("react.concurrent_mode") : 60111, z = c ? Symbol.for("react.forward_ref") : 60112, $ = c ? Symbol.for("react.suspense") : 60113, V = c ? Symbol.for("react.suspense_list") : 60120, q = c ? Symbol.for("react.memo") : 60115, G = c ? Symbol.for("react.lazy") : 60116, he = c ? Symbol.for("react.block") : 60121, se = c ? Symbol.for("react.fundamental") : 60117, Z = c ? Symbol.for("react.responder") : 60118, ue = c ? Symbol.for("react.scope") : 60119, oe = typeof Symbol == "function" && Symbol.iterator, Ne = "@@iterator";
    function Fe(M) {
      if (M === null || typeof M != "object")
        return null;
      var _ = oe && M[oe] || M[Ne];
      return typeof _ == "function" ? _ : null;
    }
    var Pe = {
      current: null
    }, Y = {
      suspense: null
    }, fe = {
      current: null
    }, be = /^(.*)[\\\/]/;
    function ie(M, _, H) {
      var X = "";
      if (_) {
        var xe = _.fileName, Ze = xe.replace(be, "");
        if (/^index\./.test(Ze)) {
          var je = xe.match(be);
          if (je) {
            var et = je[1];
            if (et) {
              var Nt = et.replace(be, "");
              Ze = Nt + "/" + Ze;
            }
          }
        }
        X = " (at " + Ze + ":" + _.lineNumber + ")";
      } else
        H && (X = " (created by " + H + ")");
      return `
    in ` + (M || "Unknown") + X;
    }
    var ct = 1;
    function Oe(M) {
      return M._status === ct ? M._result : null;
    }
    function ce(M, _, H) {
      var X = _.displayName || _.name || "";
      return M.displayName || (X !== "" ? H + "(" + X + ")" : H);
    }
    function Qe(M) {
      if (M == null)
        return null;
      if (typeof M.tag == "number" && Ge("Received an unexpected object in getComponentName(). This is likely a bug in React. Please file an issue."), typeof M == "function")
        return M.displayName || M.name || null;
      if (typeof M == "string")
        return M;
      switch (M) {
        case y:
          return "Fragment";
        case m:
          return "Portal";
        case x:
          return "Profiler";
        case g:
          return "StrictMode";
        case $:
          return "Suspense";
        case V:
          return "SuspenseList";
      }
      if (typeof M == "object")
        switch (M.$$typeof) {
          case I:
            return "Context.Consumer";
          case C:
            return "Context.Provider";
          case z:
            return ce(M, M.render, "ForwardRef");
          case q:
            return Qe(M.type);
          case he:
            return Qe(M.render);
          case G: {
            var _ = M, H = Oe(_);
            if (H)
              return Qe(H);
            break;
          }
        }
      return null;
    }
    var Se = {}, Ve = null;
    function Re(M) {
      Ve = M;
    }
    Se.getCurrentStack = null, Se.getStackAddendum = function() {
      var M = "";
      if (Ve) {
        var _ = Qe(Ve.type), H = Ve._owner;
        M += ie(_, Ve._source, H && Qe(H.type));
      }
      var X = Se.getCurrentStack;
      return X && (M += X() || ""), M;
    };
    var $e = {
      current: !1
    }, Tt = {
      ReactCurrentDispatcher: Pe,
      ReactCurrentBatchConfig: Y,
      ReactCurrentOwner: fe,
      IsSomeRendererActing: $e,
      assign: r
    };
    r(Tt, {
      ReactDebugCurrentFrame: Se,
      ReactComponentTreeHook: {}
    });
    function Bt(M) {
      {
        for (var _ = arguments.length, H = new Array(_ > 1 ? _ - 1 : 0), X = 1; X < _; X++)
          H[X - 1] = arguments[X];
        re("warn", M, H);
      }
    }
    function Ge(M) {
      {
        for (var _ = arguments.length, H = new Array(_ > 1 ? _ - 1 : 0), X = 1; X < _; X++)
          H[X - 1] = arguments[X];
        re("error", M, H);
      }
    }
    function re(M, _, H) {
      {
        var X = H.length > 0 && typeof H[H.length - 1] == "string" && H[H.length - 1].indexOf(`
    in`) === 0;
        if (!X) {
          var xe = Tt.ReactDebugCurrentFrame, Ze = xe.getStackAddendum();
          Ze !== "" && (_ += "%s", H = H.concat([Ze]));
        }
        var je = H.map(function(gn) {
          return "" + gn;
        });
        je.unshift("Warning: " + _), Function.prototype.apply.call(console[M], console, je);
        try {
          var et = 0, Nt = "Warning: " + _.replace(/%s/g, function() {
            return H[et++];
          });
          throw new Error(Nt);
        } catch {
        }
      }
    }
    var D = {};
    function B(M, _) {
      {
        var H = M.constructor, X = H && (H.displayName || H.name) || "ReactClass", xe = X + "." + _;
        if (D[xe])
          return;
        Ge("Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.", _, X), D[xe] = !0;
      }
    }
    var ee = {
      isMounted: function(M) {
        return !1;
      },
      enqueueForceUpdate: function(M, _, H) {
        B(M, "forceUpdate");
      },
      enqueueReplaceState: function(M, _, H, X) {
        B(M, "replaceState");
      },
      enqueueSetState: function(M, _, H, X) {
        B(M, "setState");
      }
    }, Ce = {};
    Object.freeze(Ce);
    function ge(M, _, H) {
      this.props = M, this.context = _, this.refs = Ce, this.updater = H || ee;
    }
    ge.prototype.isReactComponent = {}, ge.prototype.setState = function(M, _) {
      if (!(typeof M == "object" || typeof M == "function" || M == null))
        throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
      this.updater.enqueueSetState(this, M, _, "setState");
    }, ge.prototype.forceUpdate = function(M) {
      this.updater.enqueueForceUpdate(this, M, "forceUpdate");
    };
    {
      var it = {
        isMounted: ["isMounted", "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."],
        replaceState: ["replaceState", "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."]
      }, Xe = function(M, _) {
        Object.defineProperty(ge.prototype, M, {
          get: function() {
            Bt("%s(...) is deprecated in plain JavaScript React classes. %s", _[0], _[1]);
          }
        });
      };
      for (var Be in it)
        it.hasOwnProperty(Be) && Xe(Be, it[Be]);
    }
    function dt() {
    }
    dt.prototype = ge.prototype;
    function gt(M, _, H) {
      this.props = M, this.context = _, this.refs = Ce, this.updater = H || ee;
    }
    var Zt = gt.prototype = new dt();
    Zt.constructor = gt, r(Zt, ge.prototype), Zt.isPureReactComponent = !0;
    function Mt() {
      var M = {
        current: null
      };
      return Object.seal(M), M;
    }
    var bn = Object.prototype.hasOwnProperty, Ft = {
      key: !0,
      ref: !0,
      __self: !0,
      __source: !0
    }, Ui, Ci, Jn;
    Jn = {};
    function ke(M) {
      if (bn.call(M, "ref")) {
        var _ = Object.getOwnPropertyDescriptor(M, "ref").get;
        if (_ && _.isReactWarning)
          return !1;
      }
      return M.ref !== void 0;
    }
    function st(M) {
      if (bn.call(M, "key")) {
        var _ = Object.getOwnPropertyDescriptor(M, "key").get;
        if (_ && _.isReactWarning)
          return !1;
      }
      return M.key !== void 0;
    }
    function He(M, _) {
      var H = function() {
        Ui || (Ui = !0, Ge("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://fb.me/react-special-props)", _));
      };
      H.isReactWarning = !0, Object.defineProperty(M, "key", {
        get: H,
        configurable: !0
      });
    }
    function jt(M, _) {
      var H = function() {
        Ci || (Ci = !0, Ge("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://fb.me/react-special-props)", _));
      };
      H.isReactWarning = !0, Object.defineProperty(M, "ref", {
        get: H,
        configurable: !0
      });
    }
    function Sn(M) {
      if (typeof M.ref == "string" && fe.current && M.__self && fe.current.stateNode !== M.__self) {
        var _ = Qe(fe.current.type);
        Jn[_] || (Ge('Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. This case cannot be automatically converted to an arrow function. We ask you to manually fix this case by using useRef() or createRef() instead. Learn more about using refs safely here: https://fb.me/react-strict-mode-string-ref', Qe(fe.current.type), M.ref), Jn[_] = !0);
      }
    }
    var ci = function(M, _, H, X, xe, Ze, je) {
      var et = {
        $$typeof: h,
        type: M,
        key: _,
        ref: H,
        props: je,
        _owner: Ze
      };
      return et._store = {}, Object.defineProperty(et._store, "validated", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: !1
      }), Object.defineProperty(et, "_self", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: X
      }), Object.defineProperty(et, "_source", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: xe
      }), Object.freeze && (Object.freeze(et.props), Object.freeze(et)), et;
    };
    function Mr(M, _, H) {
      var X, xe = {}, Ze = null, je = null, et = null, Nt = null;
      if (_ != null) {
        ke(_) && (je = _.ref, Sn(_)), st(_) && (Ze = "" + _.key), et = _.__self === void 0 ? null : _.__self, Nt = _.__source === void 0 ? null : _.__source;
        for (X in _)
          bn.call(_, X) && !Ft.hasOwnProperty(X) && (xe[X] = _[X]);
      }
      var gn = arguments.length - 2;
      if (gn === 1)
        xe.children = H;
      else if (gn > 1) {
        for (var xn = Array(gn), Mn = 0; Mn < gn; Mn++)
          xn[Mn] = arguments[Mn + 2];
        Object.freeze && Object.freeze(xn), xe.children = xn;
      }
      if (M && M.defaultProps) {
        var ni = M.defaultProps;
        for (X in ni)
          xe[X] === void 0 && (xe[X] = ni[X]);
      }
      if (Ze || je) {
        var ii = typeof M == "function" ? M.displayName || M.name || "Unknown" : M;
        Ze && He(xe, ii), je && jt(xe, ii);
      }
      return ci(M, Ze, je, et, Nt, fe.current, xe);
    }
    function jn(M, _) {
      var H = ci(M.type, _, M.ref, M._self, M._source, M._owner, M.props);
      return H;
    }
    function Gr(M, _, H) {
      if (M == null)
        throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + M + ".");
      var X, xe = r({}, M.props), Ze = M.key, je = M.ref, et = M._self, Nt = M._source, gn = M._owner;
      if (_ != null) {
        ke(_) && (je = _.ref, gn = fe.current), st(_) && (Ze = "" + _.key);
        var xn;
        M.type && M.type.defaultProps && (xn = M.type.defaultProps);
        for (X in _)
          bn.call(_, X) && !Ft.hasOwnProperty(X) && (_[X] === void 0 && xn !== void 0 ? xe[X] = xn[X] : xe[X] = _[X]);
      }
      var Mn = arguments.length - 2;
      if (Mn === 1)
        xe.children = H;
      else if (Mn > 1) {
        for (var ni = Array(Mn), ii = 0; ii < Mn; ii++)
          ni[ii] = arguments[ii + 2];
        xe.children = ni;
      }
      return ci(M.type, Ze, je, et, Nt, gn, xe);
    }
    function Vi(M) {
      return typeof M == "object" && M !== null && M.$$typeof === h;
    }
    var Ta = ".", Ma = ":";
    function di(M) {
      var _ = /[=:]/g, H = {
        "=": "=0",
        ":": "=2"
      }, X = ("" + M).replace(_, function(xe) {
        return H[xe];
      });
      return "$" + X;
    }
    var tr = !1, fi = /\/+/g;
    function Ea(M) {
      return ("" + M).replace(fi, "$&/");
    }
    var Ti = 10, Xr = [];
    function Cs(M, _, H, X) {
      if (Xr.length) {
        var xe = Xr.pop();
        return xe.result = M, xe.keyPrefix = _, xe.func = H, xe.context = X, xe.count = 0, xe;
      } else
        return {
          result: M,
          keyPrefix: _,
          func: H,
          context: X,
          count: 0
        };
    }
    function Er(M) {
      M.result = null, M.keyPrefix = null, M.func = null, M.context = null, M.count = 0, Xr.length < Ti && Xr.push(M);
    }
    function Ir(M, _, H, X) {
      var xe = typeof M;
      (xe === "undefined" || xe === "boolean") && (M = null);
      var Ze = !1;
      if (M === null)
        Ze = !0;
      else
        switch (xe) {
          case "string":
          case "number":
            Ze = !0;
            break;
          case "object":
            switch (M.$$typeof) {
              case h:
              case m:
                Ze = !0;
            }
        }
      if (Ze)
        return H(
          X,
          M,
          _ === "" ? Ta + qn(M, 0) : _
        ), 1;
      var je, et, Nt = 0, gn = _ === "" ? Ta : _ + Ma;
      if (Array.isArray(M))
        for (var xn = 0; xn < M.length; xn++)
          je = M[xn], et = gn + qn(je, xn), Nt += Ir(je, et, H, X);
      else {
        var Mn = Fe(M);
        if (typeof Mn == "function") {
          Mn === M.entries && (tr || Bt("Using Maps as children is deprecated and will be removed in a future major release. Consider converting children to an array of keyed ReactElements instead."), tr = !0);
          for (var ni = Mn.call(M), ii, So = 0; !(ii = ni.next()).done; )
            je = ii.value, et = gn + qn(je, So++), Nt += Ir(je, et, H, X);
        } else if (xe === "object") {
          var ta = "";
          ta = " If you meant to render a collection of children, use an array instead." + Se.getStackAddendum();
          var ir = "" + M;
          throw Error("Objects are not valid as a React child (found: " + (ir === "[object Object]" ? "object with keys {" + Object.keys(M).join(", ") + "}" : ir) + ")." + ta);
        }
      }
      return Nt;
    }
    function vn(M, _, H) {
      return M == null ? 0 : Ir(M, "", _, H);
    }
    function qn(M, _) {
      return typeof M == "object" && M !== null && M.key != null ? di(M.key) : _.toString(36);
    }
    function Ia(M, _, H) {
      var X = M.func, xe = M.context;
      X.call(xe, _, M.count++);
    }
    function kt(M, _, H) {
      if (M == null)
        return M;
      var X = Cs(null, null, _, H);
      vn(M, Ia, X), Er(X);
    }
    function rn(M, _, H) {
      var X = M.result, xe = M.keyPrefix, Ze = M.func, je = M.context, et = Ze.call(je, _, M.count++);
      Array.isArray(et) ? Mi(et, X, H, function(Nt) {
        return Nt;
      }) : et != null && (Vi(et) && (et = jn(
        et,
        xe + (et.key && (!_ || _.key !== et.key) ? Ea(et.key) + "/" : "") + H
      )), X.push(et));
    }
    function Mi(M, _, H, X, xe) {
      var Ze = "";
      H != null && (Ze = Ea(H) + "/");
      var je = Cs(_, Ze, X, xe);
      vn(M, rn, je), Er(je);
    }
    function kn(M, _, H) {
      if (M == null)
        return M;
      var X = [];
      return Mi(M, X, null, _, H), X;
    }
    function Ei(M) {
      return vn(M, function() {
        return null;
      }, null);
    }
    function Kn(M) {
      var _ = [];
      return Mi(M, _, null, function(H) {
        return H;
      }), _;
    }
    function Jr(M) {
      if (!Vi(M))
        throw Error("React.Children.only expected to receive a single React element child.");
      return M;
    }
    function Aa(M, _) {
      _ === void 0 ? _ = null : _ !== null && typeof _ != "function" && Ge("createContext: Expected the optional second argument to be a function. Instead received: %s", _);
      var H = {
        $$typeof: I,
        _calculateChangedBits: _,
        _currentValue: M,
        _currentValue2: M,
        _threadCount: 0,
        Provider: null,
        Consumer: null
      };
      H.Provider = {
        $$typeof: C,
        _context: H
      };
      var X = !1, xe = !1;
      {
        var Ze = {
          $$typeof: I,
          _context: H,
          _calculateChangedBits: H._calculateChangedBits
        };
        Object.defineProperties(Ze, {
          Provider: {
            get: function() {
              return xe || (xe = !0, Ge("Rendering <Context.Consumer.Provider> is not supported and will be removed in a future major release. Did you mean to render <Context.Provider> instead?")), H.Provider;
            },
            set: function(je) {
              H.Provider = je;
            }
          },
          _currentValue: {
            get: function() {
              return H._currentValue;
            },
            set: function(je) {
              H._currentValue = je;
            }
          },
          _currentValue2: {
            get: function() {
              return H._currentValue2;
            },
            set: function(je) {
              H._currentValue2 = je;
            }
          },
          _threadCount: {
            get: function() {
              return H._threadCount;
            },
            set: function(je) {
              H._threadCount = je;
            }
          },
          Consumer: {
            get: function() {
              return X || (X = !0, Ge("Rendering <Context.Consumer.Consumer> is not supported and will be removed in a future major release. Did you mean to render <Context.Consumer> instead?")), H.Consumer;
            }
          }
        }), H.Consumer = Ze;
      }
      return H._currentRenderer = null, H._currentRenderer2 = null, H;
    }
    function yo(M) {
      var _ = {
        $$typeof: G,
        _ctor: M,
        _status: -1,
        _result: null
      };
      {
        var H, X;
        Object.defineProperties(_, {
          defaultProps: {
            configurable: !0,
            get: function() {
              return H;
            },
            set: function(xe) {
              Ge("React.lazy(...): It is not supported to assign `defaultProps` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it."), H = xe, Object.defineProperty(_, "defaultProps", {
                enumerable: !0
              });
            }
          },
          propTypes: {
            configurable: !0,
            get: function() {
              return X;
            },
            set: function(xe) {
              Ge("React.lazy(...): It is not supported to assign `propTypes` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it."), X = xe, Object.defineProperty(_, "propTypes", {
                enumerable: !0
              });
            }
          }
        });
      }
      return _;
    }
    function wo(M) {
      return M != null && M.$$typeof === q ? Ge("forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...)).") : typeof M != "function" ? Ge("forwardRef requires a render function but was given %s.", M === null ? "null" : typeof M) : M.length !== 0 && M.length !== 2 && Ge("forwardRef render functions accept exactly two parameters: props and ref. %s", M.length === 1 ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined."), M != null && (M.defaultProps != null || M.propTypes != null) && Ge("forwardRef render functions do not support propTypes or defaultProps. Did you accidentally pass a React component?"), {
        $$typeof: z,
        render: M
      };
    }
    function Ts(M) {
      return typeof M == "string" || typeof M == "function" || M === y || M === A || M === x || M === g || M === $ || M === V || typeof M == "object" && M !== null && (M.$$typeof === G || M.$$typeof === q || M.$$typeof === C || M.$$typeof === I || M.$$typeof === z || M.$$typeof === se || M.$$typeof === Z || M.$$typeof === ue || M.$$typeof === he);
    }
    function Ra(M, _) {
      return Ts(M) || Ge("memo: The first argument must be a component. Instead received: %s", M === null ? "null" : typeof M), {
        $$typeof: q,
        type: M,
        compare: _ === void 0 ? null : _
      };
    }
    function _n() {
      var M = Pe.current;
      if (M === null)
        throw Error(`Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
1. You might have mismatching versions of React and the renderer (such as React DOM)
2. You might be breaking the Rules of Hooks
3. You might have more than one copy of React in the same app
See https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem.`);
      return M;
    }
    function Ar(M, _) {
      var H = _n();
      if (_ !== void 0 && Ge("useContext() second argument is reserved for future use in React. Passing it is not supported. You passed: %s.%s", _, typeof _ == "number" && Array.isArray(arguments[2]) ? `

Did you call array.map(useContext)? Calling Hooks inside a loop is not supported. Learn more at https://fb.me/rules-of-hooks` : ""), M._context !== void 0) {
        var X = M._context;
        X.Consumer === M ? Ge("Calling useContext(Context.Consumer) is not supported, may cause bugs, and will be removed in a future major release. Did you mean to call useContext(Context) instead?") : X.Provider === M && Ge("Calling useContext(Context.Provider) is not supported. Did you mean to call useContext(Context) instead?");
      }
      return H.useContext(M, _);
    }
    function qr(M) {
      var _ = _n();
      return _.useState(M);
    }
    function ei(M, _, H) {
      var X = _n();
      return X.useReducer(M, _, H);
    }
    function Rr(M) {
      var _ = _n();
      return _.useRef(M);
    }
    function Un(M, _) {
      var H = _n();
      return H.useEffect(M, _);
    }
    function nr(M, _) {
      var H = _n();
      return H.useLayoutEffect(M, _);
    }
    function Ms(M, _) {
      var H = _n();
      return H.useCallback(M, _);
    }
    function Kr(M, _) {
      var H = _n();
      return H.useMemo(M, _);
    }
    function Es(M, _, H) {
      var X = _n();
      return X.useImperativeHandle(M, _, H);
    }
    function ne(M, _) {
      {
        var H = _n();
        return H.useDebugValue(M, _);
      }
    }
    var de;
    de = !1;
    function Je() {
      if (fe.current) {
        var M = Qe(fe.current.type);
        if (M)
          return `

Check the render method of \`` + M + "`.";
      }
      return "";
    }
    function pt(M) {
      if (M !== void 0) {
        var _ = M.fileName.replace(/^.*[\\\/]/, ""), H = M.lineNumber;
        return `

Check your code at ` + _ + ":" + H + ".";
      }
      return "";
    }
    function Jt(M) {
      return M != null ? pt(M.__source) : "";
    }
    var Yt = {};
    function fn(M) {
      var _ = Je();
      if (!_) {
        var H = typeof M == "string" ? M : M.displayName || M.name;
        H && (_ = `

Check the top-level render call using <` + H + ">.");
      }
      return _;
    }
    function ti(M, _) {
      if (!(!M._store || M._store.validated || M.key != null)) {
        M._store.validated = !0;
        var H = fn(_);
        if (!Yt[H]) {
          Yt[H] = !0;
          var X = "";
          M && M._owner && M._owner !== fe.current && (X = " It was passed a child from " + Qe(M._owner.type) + "."), Re(M), Ge('Each child in a list should have a unique "key" prop.%s%s See https://fb.me/react-warning-keys for more information.', H, X), Re(null);
        }
      }
    }
    function qt(M, _) {
      if (typeof M == "object") {
        if (Array.isArray(M))
          for (var H = 0; H < M.length; H++) {
            var X = M[H];
            Vi(X) && ti(X, _);
          }
        else if (Vi(M))
          M._store && (M._store.validated = !0);
        else if (M) {
          var xe = Fe(M);
          if (typeof xe == "function" && xe !== M.entries)
            for (var Ze = xe.call(M), je; !(je = Ze.next()).done; )
              Vi(je.value) && ti(je.value, _);
        }
      }
    }
    function Da(M) {
      {
        var _ = M.type;
        if (_ == null || typeof _ == "string")
          return;
        var H = Qe(_), X;
        if (typeof _ == "function")
          X = _.propTypes;
        else if (typeof _ == "object" && (_.$$typeof === z || _.$$typeof === q))
          X = _.propTypes;
        else
          return;
        X ? (Re(M), i(X, M.props, "prop", H, Se.getStackAddendum), Re(null)) : _.PropTypes !== void 0 && !de && (de = !0, Ge("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", H || "Unknown")), typeof _.getDefaultProps == "function" && !_.getDefaultProps.isReactClassApproved && Ge("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
      }
    }
    function bo(M) {
      {
        Re(M);
        for (var _ = Object.keys(M.props), H = 0; H < _.length; H++) {
          var X = _[H];
          if (X !== "children" && X !== "key") {
            Ge("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", X);
            break;
          }
        }
        M.ref !== null && Ge("Invalid attribute `ref` supplied to `React.Fragment`."), Re(null);
      }
    }
    function an(M, _, H) {
      var X = Ts(M);
      if (!X) {
        var xe = "";
        (M === void 0 || typeof M == "object" && M !== null && Object.keys(M).length === 0) && (xe += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");
        var Ze = Jt(_);
        Ze ? xe += Ze : xe += Je();
        var je;
        M === null ? je = "null" : Array.isArray(M) ? je = "array" : M !== void 0 && M.$$typeof === h ? (je = "<" + (Qe(M.type) || "Unknown") + " />", xe = " Did you accidentally export a JSX literal instead of a component?") : je = typeof M, Ge("React.createElement: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", je, xe);
      }
      var et = Mr.apply(this, arguments);
      if (et == null)
        return et;
      if (X)
        for (var Nt = 2; Nt < arguments.length; Nt++)
          qt(arguments[Nt], M);
      return M === y ? bo(et) : Da(et), et;
    }
    var hn = !1;
    function Is(M) {
      var _ = an.bind(null, M);
      return _.type = M, hn || (hn = !0, Bt("React.createFactory() is deprecated and will be removed in a future major release. Consider using JSX or use React.createElement() directly instead.")), Object.defineProperty(_, "type", {
        enumerable: !1,
        get: function() {
          return Bt("Factory.type is deprecated. Access the class directly before passing it to createFactory."), Object.defineProperty(this, "type", {
            value: M
          }), M;
        }
      }), _;
    }
    function pl(M, _, H) {
      for (var X = Gr.apply(this, arguments), xe = 2; xe < arguments.length; xe++)
        qt(arguments[xe], X.type);
      return Da(X), X;
    }
    try {
      var ea = Object.freeze({}), ml = /* @__PURE__ */ new Map([[ea, null]]), Lu = /* @__PURE__ */ new Set([ea]);
      ml.set(0, 0), Lu.add(0);
    } catch {
    }
    var As = an, vl = pl, Bu = Is, gl = {
      map: kn,
      forEach: kt,
      count: Ei,
      toArray: Kn,
      only: Jr
    };
    Lt.Children = gl, Lt.Component = ge, Lt.Fragment = y, Lt.Profiler = x, Lt.PureComponent = gt, Lt.StrictMode = g, Lt.Suspense = $, Lt.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Tt, Lt.cloneElement = vl, Lt.createContext = Aa, Lt.createElement = As, Lt.createFactory = Bu, Lt.createRef = Mt, Lt.forwardRef = wo, Lt.isValidElement = Vi, Lt.lazy = yo, Lt.memo = Ra, Lt.useCallback = Ms, Lt.useContext = Ar, Lt.useDebugValue = ne, Lt.useEffect = Un, Lt.useImperativeHandle = Es, Lt.useLayoutEffect = nr, Lt.useMemo = Kr, Lt.useReducer = ei, Lt.useRef = Rr, Lt.useState = qr, Lt.version = o;
  }()), Lt;
}
(function(r) {
  process.env.NODE_ENV === "production" ? r.exports = oO() : r.exports = cO();
})(hl);
const wt = /* @__PURE__ */ BE(hl.exports);
var UE = { exports: {} }, Sr = {}, Ib = { exports: {} }, Ab = {};
/** @license React v0.19.1
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var qT;
function dO() {
  return qT || (qT = 1, function(r) {
    var i, o, c, h, m;
    if (typeof window > "u" || typeof MessageChannel != "function") {
      var y = null, g = null, x = function() {
        if (y !== null)
          try {
            var re = r.unstable_now();
            y(!0, re), y = null;
          } catch (D) {
            throw setTimeout(x, 0), D;
          }
      }, C = Date.now();
      r.unstable_now = function() {
        return Date.now() - C;
      }, i = function(re) {
        y !== null ? setTimeout(i, 0, re) : (y = re, setTimeout(x, 0));
      }, o = function(re, D) {
        g = setTimeout(re, D);
      }, c = function() {
        clearTimeout(g);
      }, h = function() {
        return !1;
      }, m = r.unstable_forceFrameRate = function() {
      };
    } else {
      var I = window.performance, A = window.Date, z = window.setTimeout, $ = window.clearTimeout;
      if (typeof console < "u") {
        var V = window.cancelAnimationFrame;
        typeof window.requestAnimationFrame != "function" && console.error("This browser doesn't support requestAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"), typeof V != "function" && console.error("This browser doesn't support cancelAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills");
      }
      if (typeof I == "object" && typeof I.now == "function")
        r.unstable_now = function() {
          return I.now();
        };
      else {
        var q = A.now();
        r.unstable_now = function() {
          return A.now() - q;
        };
      }
      var G = !1, he = null, se = -1, Z = 5, ue = 0;
      h = function() {
        return r.unstable_now() >= ue;
      }, m = function() {
      }, r.unstable_forceFrameRate = function(re) {
        0 > re || 125 < re ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing framerates higher than 125 fps is not unsupported") : Z = 0 < re ? Math.floor(1e3 / re) : 5;
      };
      var oe = new MessageChannel(), Ne = oe.port2;
      oe.port1.onmessage = function() {
        if (he !== null) {
          var re = r.unstable_now();
          ue = re + Z;
          try {
            he(!0, re) ? Ne.postMessage(null) : (G = !1, he = null);
          } catch (D) {
            throw Ne.postMessage(null), D;
          }
        } else
          G = !1;
      }, i = function(re) {
        he = re, G || (G = !0, Ne.postMessage(null));
      }, o = function(re, D) {
        se = z(function() {
          re(r.unstable_now());
        }, D);
      }, c = function() {
        $(se), se = -1;
      };
    }
    function Fe(re, D) {
      var B = re.length;
      re.push(D);
      e:
        for (; ; ) {
          var ee = B - 1 >>> 1, Ce = re[ee];
          if (Ce !== void 0 && 0 < fe(Ce, D))
            re[ee] = D, re[B] = Ce, B = ee;
          else
            break e;
        }
    }
    function Pe(re) {
      return re = re[0], re === void 0 ? null : re;
    }
    function Y(re) {
      var D = re[0];
      if (D !== void 0) {
        var B = re.pop();
        if (B !== D) {
          re[0] = B;
          e:
            for (var ee = 0, Ce = re.length; ee < Ce; ) {
              var ge = 2 * (ee + 1) - 1, it = re[ge], Xe = ge + 1, Be = re[Xe];
              if (it !== void 0 && 0 > fe(it, B))
                Be !== void 0 && 0 > fe(Be, it) ? (re[ee] = Be, re[Xe] = B, ee = Xe) : (re[ee] = it, re[ge] = B, ee = ge);
              else if (Be !== void 0 && 0 > fe(Be, B))
                re[ee] = Be, re[Xe] = B, ee = Xe;
              else
                break e;
            }
        }
        return D;
      }
      return null;
    }
    function fe(re, D) {
      var B = re.sortIndex - D.sortIndex;
      return B !== 0 ? B : re.id - D.id;
    }
    var be = [], ie = [], ct = 1, Oe = null, ce = 3, Qe = !1, Se = !1, Ve = !1;
    function Re(re) {
      for (var D = Pe(ie); D !== null; ) {
        if (D.callback === null)
          Y(ie);
        else if (D.startTime <= re)
          Y(ie), D.sortIndex = D.expirationTime, Fe(be, D);
        else
          break;
        D = Pe(ie);
      }
    }
    function $e(re) {
      if (Ve = !1, Re(re), !Se)
        if (Pe(be) !== null)
          Se = !0, i(Tt);
        else {
          var D = Pe(ie);
          D !== null && o($e, D.startTime - re);
        }
    }
    function Tt(re, D) {
      Se = !1, Ve && (Ve = !1, c()), Qe = !0;
      var B = ce;
      try {
        for (Re(D), Oe = Pe(be); Oe !== null && (!(Oe.expirationTime > D) || re && !h()); ) {
          var ee = Oe.callback;
          if (ee !== null) {
            Oe.callback = null, ce = Oe.priorityLevel;
            var Ce = ee(Oe.expirationTime <= D);
            D = r.unstable_now(), typeof Ce == "function" ? Oe.callback = Ce : Oe === Pe(be) && Y(be), Re(D);
          } else
            Y(be);
          Oe = Pe(be);
        }
        if (Oe !== null)
          var ge = !0;
        else {
          var it = Pe(ie);
          it !== null && o($e, it.startTime - D), ge = !1;
        }
        return ge;
      } finally {
        Oe = null, ce = B, Qe = !1;
      }
    }
    function Bt(re) {
      switch (re) {
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
    var Ge = m;
    r.unstable_IdlePriority = 5, r.unstable_ImmediatePriority = 1, r.unstable_LowPriority = 4, r.unstable_NormalPriority = 3, r.unstable_Profiling = null, r.unstable_UserBlockingPriority = 2, r.unstable_cancelCallback = function(re) {
      re.callback = null;
    }, r.unstable_continueExecution = function() {
      Se || Qe || (Se = !0, i(Tt));
    }, r.unstable_getCurrentPriorityLevel = function() {
      return ce;
    }, r.unstable_getFirstCallbackNode = function() {
      return Pe(be);
    }, r.unstable_next = function(re) {
      switch (ce) {
        case 1:
        case 2:
        case 3:
          var D = 3;
          break;
        default:
          D = ce;
      }
      var B = ce;
      ce = D;
      try {
        return re();
      } finally {
        ce = B;
      }
    }, r.unstable_pauseExecution = function() {
    }, r.unstable_requestPaint = Ge, r.unstable_runWithPriority = function(re, D) {
      switch (re) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          break;
        default:
          re = 3;
      }
      var B = ce;
      ce = re;
      try {
        return D();
      } finally {
        ce = B;
      }
    }, r.unstable_scheduleCallback = function(re, D, B) {
      var ee = r.unstable_now();
      if (typeof B == "object" && B !== null) {
        var Ce = B.delay;
        Ce = typeof Ce == "number" && 0 < Ce ? ee + Ce : ee, B = typeof B.timeout == "number" ? B.timeout : Bt(re);
      } else
        B = Bt(re), Ce = ee;
      return B = Ce + B, re = { id: ct++, callback: D, priorityLevel: re, startTime: Ce, expirationTime: B, sortIndex: -1 }, Ce > ee ? (re.sortIndex = Ce, Fe(ie, re), Pe(be) === null && re === Pe(ie) && (Ve ? c() : Ve = !0, o($e, Ce - ee))) : (re.sortIndex = B, Fe(be, re), Se || Qe || (Se = !0, i(Tt))), re;
    }, r.unstable_shouldYield = function() {
      var re = r.unstable_now();
      Re(re);
      var D = Pe(be);
      return D !== Oe && Oe !== null && D !== null && D.callback !== null && D.startTime <= re && D.expirationTime < Oe.expirationTime || h();
    }, r.unstable_wrapCallback = function(re) {
      var D = ce;
      return function() {
        var B = ce;
        ce = D;
        try {
          return re.apply(this, arguments);
        } finally {
          ce = B;
        }
      };
    };
  }(Ab)), Ab;
}
var Rb = {};
/** @license React v0.19.1
 * scheduler.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var KT;
function fO() {
  return KT || (KT = 1, function(r) {
    process.env.NODE_ENV !== "production" && function() {
      var i = !1, o = !0, c, h, m, y, g;
      if (typeof window > "u" || typeof MessageChannel != "function") {
        var x = null, C = null, I = function() {
          if (x !== null)
            try {
              var ne = r.unstable_now(), de = !0;
              x(de, ne), x = null;
            } catch (Je) {
              throw setTimeout(I, 0), Je;
            }
        }, A = Date.now();
        r.unstable_now = function() {
          return Date.now() - A;
        }, c = function(ne) {
          x !== null ? setTimeout(c, 0, ne) : (x = ne, setTimeout(I, 0));
        }, h = function(ne, de) {
          C = setTimeout(ne, de);
        }, m = function() {
          clearTimeout(C);
        }, y = function() {
          return !1;
        }, g = r.unstable_forceFrameRate = function() {
        };
      } else {
        var z = window.performance, $ = window.Date, V = window.setTimeout, q = window.clearTimeout;
        if (typeof console < "u") {
          var G = window.requestAnimationFrame, he = window.cancelAnimationFrame;
          typeof G != "function" && console.error("This browser doesn't support requestAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"), typeof he != "function" && console.error("This browser doesn't support cancelAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills");
        }
        if (typeof z == "object" && typeof z.now == "function")
          r.unstable_now = function() {
            return z.now();
          };
        else {
          var se = $.now();
          r.unstable_now = function() {
            return $.now() - se;
          };
        }
        var Z = !1, ue = null, oe = -1, Ne = 5, Fe = 0;
        y = function() {
          return r.unstable_now() >= Fe;
        }, g = function() {
        }, r.unstable_forceFrameRate = function(ne) {
          if (ne < 0 || ne > 125) {
            console.error("forceFrameRate takes a positive int between 0 and 125, forcing framerates higher than 125 fps is not unsupported");
            return;
          }
          ne > 0 ? Ne = Math.floor(1e3 / ne) : Ne = 5;
        };
        var Pe = function() {
          if (ue !== null) {
            var ne = r.unstable_now();
            Fe = ne + Ne;
            var de = !0;
            try {
              var Je = ue(de, ne);
              Je ? fe.postMessage(null) : (Z = !1, ue = null);
            } catch (pt) {
              throw fe.postMessage(null), pt;
            }
          } else
            Z = !1;
        }, Y = new MessageChannel(), fe = Y.port2;
        Y.port1.onmessage = Pe, c = function(ne) {
          ue = ne, Z || (Z = !0, fe.postMessage(null));
        }, h = function(ne, de) {
          oe = V(function() {
            ne(r.unstable_now());
          }, de);
        }, m = function() {
          q(oe), oe = -1;
        };
      }
      function be(ne, de) {
        var Je = ne.length;
        ne.push(de), Oe(ne, de, Je);
      }
      function ie(ne) {
        var de = ne[0];
        return de === void 0 ? null : de;
      }
      function ct(ne) {
        var de = ne[0];
        if (de !== void 0) {
          var Je = ne.pop();
          return Je !== de && (ne[0] = Je, ce(ne, Je, 0)), de;
        } else
          return null;
      }
      function Oe(ne, de, Je) {
        for (var pt = Je; ; ) {
          var Jt = pt - 1 >>> 1, Yt = ne[Jt];
          if (Yt !== void 0 && Qe(Yt, de) > 0)
            ne[Jt] = de, ne[pt] = Yt, pt = Jt;
          else
            return;
        }
      }
      function ce(ne, de, Je) {
        for (var pt = Je, Jt = ne.length; pt < Jt; ) {
          var Yt = (pt + 1) * 2 - 1, fn = ne[Yt], ti = Yt + 1, qt = ne[ti];
          if (fn !== void 0 && Qe(fn, de) < 0)
            qt !== void 0 && Qe(qt, fn) < 0 ? (ne[pt] = qt, ne[ti] = de, pt = ti) : (ne[pt] = fn, ne[Yt] = de, pt = Yt);
          else if (qt !== void 0 && Qe(qt, de) < 0)
            ne[pt] = qt, ne[ti] = de, pt = ti;
          else
            return;
        }
      }
      function Qe(ne, de) {
        var Je = ne.sortIndex - de.sortIndex;
        return Je !== 0 ? Je : ne.id - de.id;
      }
      var Se = 0, Ve = 1, Re = 2, $e = 3, Tt = 4, Bt = 5, Ge = 0, re = 0, D = 4, B = typeof SharedArrayBuffer == "function" ? new SharedArrayBuffer(D * Int32Array.BYTES_PER_ELEMENT) : typeof ArrayBuffer == "function" ? new ArrayBuffer(D * Int32Array.BYTES_PER_ELEMENT) : null, ee = B !== null ? new Int32Array(B) : [], Ce = 0, ge = 1, it = 2, Xe = 3;
      ee[Ce] = Se, ee[Xe] = 0, ee[ge] = 0;
      var Be = 131072, dt = 524288, gt = 0, Zt = null, Mt = null, bn = 0, Ft = 1, Ui = 2, Ci = 3, Jn = 4, ke = 5, st = 6, He = 7, jt = 8;
      function Sn(ne) {
        if (Mt !== null) {
          var de = bn;
          if (bn += ne.length, bn + 1 > gt) {
            if (gt *= 2, gt > dt) {
              console.error("Scheduler Profiling: Event log exceeded maximum size. Don't forget to call `stopLoggingProfilingEvents()`."), Mr();
              return;
            }
            var Je = new Int32Array(gt * 4);
            Je.set(Mt), Zt = Je.buffer, Mt = Je;
          }
          Mt.set(ne, de);
        }
      }
      function ci() {
        gt = Be, Zt = new ArrayBuffer(gt * 4), Mt = new Int32Array(Zt), bn = 0;
      }
      function Mr() {
        var ne = Zt;
        return gt = 0, Zt = null, Mt = null, bn = 0, ne;
      }
      function jn(ne, de) {
        ee[Xe]++, Mt !== null && Sn([Ft, de * 1e3, ne.id, ne.priorityLevel]);
      }
      function Gr(ne, de) {
        ee[Ce] = Se, ee[ge] = 0, ee[Xe]--, Mt !== null && Sn([Ui, de * 1e3, ne.id]);
      }
      function Vi(ne, de) {
        ee[Xe]--, Mt !== null && Sn([Jn, de * 1e3, ne.id]);
      }
      function Ta(ne, de) {
        ee[Ce] = Se, ee[ge] = 0, ee[Xe]--, Mt !== null && Sn([Ci, de * 1e3, ne.id]);
      }
      function Ma(ne, de) {
        Ge++, ee[Ce] = ne.priorityLevel, ee[ge] = ne.id, ee[it] = Ge, Mt !== null && Sn([ke, de * 1e3, ne.id, Ge]);
      }
      function di(ne, de) {
        ee[Ce] = Se, ee[ge] = 0, ee[it] = 0, Mt !== null && Sn([st, de * 1e3, ne.id, Ge]);
      }
      function tr(ne) {
        re++, Mt !== null && Sn([He, ne * 1e3, re]);
      }
      function fi(ne) {
        Mt !== null && Sn([jt, ne * 1e3, re]);
      }
      var Ea = 1073741823, Ti = -1, Xr = 250, Cs = 5e3, Er = 1e4, Ir = Ea, vn = [], qn = [], Ia = 1, kt = null, rn = $e, Mi = !1, kn = !1, Ei = !1;
      function Kn(ne) {
        for (var de = ie(qn); de !== null; ) {
          if (de.callback === null)
            ct(qn);
          else if (de.startTime <= ne)
            ct(qn), de.sortIndex = de.expirationTime, be(vn, de), jn(de, ne), de.isQueued = !0;
          else
            return;
          de = ie(qn);
        }
      }
      function Jr(ne) {
        if (Ei = !1, Kn(ne), !kn)
          if (ie(vn) !== null)
            kn = !0, c(Aa);
          else {
            var de = ie(qn);
            de !== null && h(Jr, de.startTime - ne);
          }
      }
      function Aa(ne, de) {
        fi(de), kn = !1, Ei && (Ei = !1, m()), Mi = !0;
        var Je = rn;
        try {
          if (o)
            try {
              return yo(ne, de);
            } catch (Yt) {
              if (kt !== null) {
                var pt = r.unstable_now();
                Ta(kt, pt), kt.isQueued = !1;
              }
              throw Yt;
            }
        } finally {
          kt = null, rn = Je, Mi = !1;
          {
            var Jt = r.unstable_now();
            tr(Jt);
          }
        }
      }
      function yo(ne, de) {
        var Je = de;
        for (Kn(Je), kt = ie(vn); kt !== null && !i && !(kt.expirationTime > Je && (!ne || y())); ) {
          var pt = kt.callback;
          if (pt !== null) {
            kt.callback = null, rn = kt.priorityLevel;
            var Jt = kt.expirationTime <= Je;
            Ma(kt, Je);
            var Yt = pt(Jt);
            Je = r.unstable_now(), typeof Yt == "function" ? (kt.callback = Yt, di(kt, Je)) : (Gr(kt, Je), kt.isQueued = !1, kt === ie(vn) && ct(vn)), Kn(Je);
          } else
            ct(vn);
          kt = ie(vn);
        }
        if (kt !== null)
          return !0;
        var fn = ie(qn);
        return fn !== null && h(Jr, fn.startTime - Je), !1;
      }
      function wo(ne, de) {
        switch (ne) {
          case Ve:
          case Re:
          case $e:
          case Tt:
          case Bt:
            break;
          default:
            ne = $e;
        }
        var Je = rn;
        rn = ne;
        try {
          return de();
        } finally {
          rn = Je;
        }
      }
      function Ts(ne) {
        var de;
        switch (rn) {
          case Ve:
          case Re:
          case $e:
            de = $e;
            break;
          default:
            de = rn;
            break;
        }
        var Je = rn;
        rn = de;
        try {
          return ne();
        } finally {
          rn = Je;
        }
      }
      function Ra(ne) {
        var de = rn;
        return function() {
          var Je = rn;
          rn = de;
          try {
            return ne.apply(this, arguments);
          } finally {
            rn = Je;
          }
        };
      }
      function _n(ne) {
        switch (ne) {
          case Ve:
            return Ti;
          case Re:
            return Xr;
          case Bt:
            return Ir;
          case Tt:
            return Er;
          case $e:
          default:
            return Cs;
        }
      }
      function Ar(ne, de, Je) {
        var pt = r.unstable_now(), Jt, Yt;
        if (typeof Je == "object" && Je !== null) {
          var fn = Je.delay;
          typeof fn == "number" && fn > 0 ? Jt = pt + fn : Jt = pt, Yt = typeof Je.timeout == "number" ? Je.timeout : _n(ne);
        } else
          Yt = _n(ne), Jt = pt;
        var ti = Jt + Yt, qt = {
          id: Ia++,
          callback: de,
          priorityLevel: ne,
          startTime: Jt,
          expirationTime: ti,
          sortIndex: -1
        };
        return qt.isQueued = !1, Jt > pt ? (qt.sortIndex = Jt, be(qn, qt), ie(vn) === null && qt === ie(qn) && (Ei ? m() : Ei = !0, h(Jr, Jt - pt))) : (qt.sortIndex = ti, be(vn, qt), jn(qt, pt), qt.isQueued = !0, !kn && !Mi && (kn = !0, c(Aa))), qt;
      }
      function qr() {
      }
      function ei() {
        !kn && !Mi && (kn = !0, c(Aa));
      }
      function Rr() {
        return ie(vn);
      }
      function Un(ne) {
        if (ne.isQueued) {
          var de = r.unstable_now();
          Vi(ne, de), ne.isQueued = !1;
        }
        ne.callback = null;
      }
      function nr() {
        return rn;
      }
      function Ms() {
        var ne = r.unstable_now();
        Kn(ne);
        var de = ie(vn);
        return de !== kt && kt !== null && de !== null && de.callback !== null && de.startTime <= ne && de.expirationTime < kt.expirationTime || y();
      }
      var Kr = g, Es = {
        startLoggingProfilingEvents: ci,
        stopLoggingProfilingEvents: Mr,
        sharedProfilingBuffer: B
      };
      r.unstable_IdlePriority = Bt, r.unstable_ImmediatePriority = Ve, r.unstable_LowPriority = Tt, r.unstable_NormalPriority = $e, r.unstable_Profiling = Es, r.unstable_UserBlockingPriority = Re, r.unstable_cancelCallback = Un, r.unstable_continueExecution = ei, r.unstable_getCurrentPriorityLevel = nr, r.unstable_getFirstCallbackNode = Rr, r.unstable_next = Ts, r.unstable_pauseExecution = qr, r.unstable_requestPaint = Kr, r.unstable_runWithPriority = wo, r.unstable_scheduleCallback = Ar, r.unstable_shouldYield = Ms, r.unstable_wrapCallback = Ra;
    }();
  }(Rb)), Rb;
}
var eM;
function VE() {
  return eM || (eM = 1, function(r) {
    process.env.NODE_ENV === "production" ? r.exports = dO() : r.exports = fO();
  }(Ib)), Ib.exports;
}
/** @license React v16.14.0
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var tM;
function hO() {
  if (tM)
    return Sr;
  tM = 1;
  var r = hl.exports, i = wg(), o = VE();
  function c(n) {
    for (var a = "https://reactjs.org/docs/error-decoder.html?invariant=" + n, u = 1; u < arguments.length; u++)
      a += "&args[]=" + encodeURIComponent(arguments[u]);
    return "Minified React error #" + n + "; visit " + a + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  if (!r)
    throw Error(c(227));
  function h(n, a, u, f, v, S, T, R, W) {
    var U = Array.prototype.slice.call(arguments, 3);
    try {
      a.apply(u, U);
    } catch (Me) {
      this.onError(Me);
    }
  }
  var m = !1, y = null, g = !1, x = null, C = { onError: function(n) {
    m = !0, y = n;
  } };
  function I(n, a, u, f, v, S, T, R, W) {
    m = !1, y = null, h.apply(C, arguments);
  }
  function A(n, a, u, f, v, S, T, R, W) {
    if (I.apply(this, arguments), m) {
      if (m) {
        var U = y;
        m = !1, y = null;
      } else
        throw Error(c(198));
      g || (g = !0, x = U);
    }
  }
  var z = null, $ = null, V = null;
  function q(n, a, u) {
    var f = n.type || "unknown-event";
    n.currentTarget = V(u), A(f, a, void 0, n), n.currentTarget = null;
  }
  var G = null, he = {};
  function se() {
    if (G)
      for (var n in he) {
        var a = he[n], u = G.indexOf(n);
        if (!(-1 < u))
          throw Error(c(96, n));
        if (!ue[u]) {
          if (!a.extractEvents)
            throw Error(c(97, n));
          ue[u] = a, u = a.eventTypes;
          for (var f in u) {
            var v = void 0, S = u[f], T = a, R = f;
            if (oe.hasOwnProperty(R))
              throw Error(c(99, R));
            oe[R] = S;
            var W = S.phasedRegistrationNames;
            if (W) {
              for (v in W)
                W.hasOwnProperty(v) && Z(W[v], T, R);
              v = !0;
            } else
              S.registrationName ? (Z(S.registrationName, T, R), v = !0) : v = !1;
            if (!v)
              throw Error(c(98, f, n));
          }
        }
      }
  }
  function Z(n, a, u) {
    if (Ne[n])
      throw Error(c(100, n));
    Ne[n] = a, Fe[n] = a.eventTypes[u].dependencies;
  }
  var ue = [], oe = {}, Ne = {}, Fe = {};
  function Pe(n) {
    var a = !1, u;
    for (u in n)
      if (n.hasOwnProperty(u)) {
        var f = n[u];
        if (!he.hasOwnProperty(u) || he[u] !== f) {
          if (he[u])
            throw Error(c(102, u));
          he[u] = f, a = !0;
        }
      }
    a && se();
  }
  var Y = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), fe = null, be = null, ie = null;
  function ct(n) {
    if (n = $(n)) {
      if (typeof fe != "function")
        throw Error(c(280));
      var a = n.stateNode;
      a && (a = z(a), fe(n.stateNode, n.type, a));
    }
  }
  function Oe(n) {
    be ? ie ? ie.push(n) : ie = [n] : be = n;
  }
  function ce() {
    if (be) {
      var n = be, a = ie;
      if (ie = be = null, ct(n), a)
        for (n = 0; n < a.length; n++)
          ct(a[n]);
    }
  }
  function Qe(n, a) {
    return n(a);
  }
  function Se(n, a, u, f, v) {
    return n(a, u, f, v);
  }
  function Ve() {
  }
  var Re = Qe, $e = !1, Tt = !1;
  function Bt() {
    (be !== null || ie !== null) && (Ve(), ce());
  }
  function Ge(n, a, u) {
    if (Tt)
      return n(a, u);
    Tt = !0;
    try {
      return Re(n, a, u);
    } finally {
      Tt = !1, Bt();
    }
  }
  var re = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, D = Object.prototype.hasOwnProperty, B = {}, ee = {};
  function Ce(n) {
    return D.call(ee, n) ? !0 : D.call(B, n) ? !1 : re.test(n) ? ee[n] = !0 : (B[n] = !0, !1);
  }
  function ge(n, a, u, f) {
    if (u !== null && u.type === 0)
      return !1;
    switch (typeof a) {
      case "function":
      case "symbol":
        return !0;
      case "boolean":
        return f ? !1 : u !== null ? !u.acceptsBooleans : (n = n.toLowerCase().slice(0, 5), n !== "data-" && n !== "aria-");
      default:
        return !1;
    }
  }
  function it(n, a, u, f) {
    if (a === null || typeof a > "u" || ge(n, a, u, f))
      return !0;
    if (f)
      return !1;
    if (u !== null)
      switch (u.type) {
        case 3:
          return !a;
        case 4:
          return a === !1;
        case 5:
          return isNaN(a);
        case 6:
          return isNaN(a) || 1 > a;
      }
    return !1;
  }
  function Xe(n, a, u, f, v, S) {
    this.acceptsBooleans = a === 2 || a === 3 || a === 4, this.attributeName = f, this.attributeNamespace = v, this.mustUseProperty = u, this.propertyName = n, this.type = a, this.sanitizeURL = S;
  }
  var Be = {};
  "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(n) {
    Be[n] = new Xe(n, 0, !1, n, null, !1);
  }), [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(n) {
    var a = n[0];
    Be[a] = new Xe(a, 1, !1, n[1], null, !1);
  }), ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(n) {
    Be[n] = new Xe(n, 2, !1, n.toLowerCase(), null, !1);
  }), ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(n) {
    Be[n] = new Xe(n, 2, !1, n, null, !1);
  }), "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(n) {
    Be[n] = new Xe(n, 3, !1, n.toLowerCase(), null, !1);
  }), ["checked", "multiple", "muted", "selected"].forEach(function(n) {
    Be[n] = new Xe(n, 3, !0, n, null, !1);
  }), ["capture", "download"].forEach(function(n) {
    Be[n] = new Xe(n, 4, !1, n, null, !1);
  }), ["cols", "rows", "size", "span"].forEach(function(n) {
    Be[n] = new Xe(n, 6, !1, n, null, !1);
  }), ["rowSpan", "start"].forEach(function(n) {
    Be[n] = new Xe(n, 5, !1, n.toLowerCase(), null, !1);
  });
  var dt = /[\-:]([a-z])/g;
  function gt(n) {
    return n[1].toUpperCase();
  }
  "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(n) {
    var a = n.replace(
      dt,
      gt
    );
    Be[a] = new Xe(a, 1, !1, n, null, !1);
  }), "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(n) {
    var a = n.replace(dt, gt);
    Be[a] = new Xe(a, 1, !1, n, "http://www.w3.org/1999/xlink", !1);
  }), ["xml:base", "xml:lang", "xml:space"].forEach(function(n) {
    var a = n.replace(dt, gt);
    Be[a] = new Xe(a, 1, !1, n, "http://www.w3.org/XML/1998/namespace", !1);
  }), ["tabIndex", "crossOrigin"].forEach(function(n) {
    Be[n] = new Xe(n, 1, !1, n.toLowerCase(), null, !1);
  }), Be.xlinkHref = new Xe("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0), ["src", "href", "action", "formAction"].forEach(function(n) {
    Be[n] = new Xe(n, 1, !1, n.toLowerCase(), null, !0);
  });
  var Zt = r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  Zt.hasOwnProperty("ReactCurrentDispatcher") || (Zt.ReactCurrentDispatcher = { current: null }), Zt.hasOwnProperty("ReactCurrentBatchConfig") || (Zt.ReactCurrentBatchConfig = { suspense: null });
  function Mt(n, a, u, f) {
    var v = Be.hasOwnProperty(a) ? Be[a] : null, S = v !== null ? v.type === 0 : f ? !1 : !(!(2 < a.length) || a[0] !== "o" && a[0] !== "O" || a[1] !== "n" && a[1] !== "N");
    S || (it(a, u, v, f) && (u = null), f || v === null ? Ce(a) && (u === null ? n.removeAttribute(a) : n.setAttribute(a, "" + u)) : v.mustUseProperty ? n[v.propertyName] = u === null ? v.type === 3 ? !1 : "" : u : (a = v.attributeName, f = v.attributeNamespace, u === null ? n.removeAttribute(a) : (v = v.type, u = v === 3 || v === 4 && u === !0 ? "" : "" + u, f ? n.setAttributeNS(f, a, u) : n.setAttribute(a, u))));
  }
  var bn = /^(.*)[\\\/]/, Ft = typeof Symbol == "function" && Symbol.for, Ui = Ft ? Symbol.for("react.element") : 60103, Ci = Ft ? Symbol.for("react.portal") : 60106, Jn = Ft ? Symbol.for("react.fragment") : 60107, ke = Ft ? Symbol.for("react.strict_mode") : 60108, st = Ft ? Symbol.for("react.profiler") : 60114, He = Ft ? Symbol.for("react.provider") : 60109, jt = Ft ? Symbol.for("react.context") : 60110, Sn = Ft ? Symbol.for("react.concurrent_mode") : 60111, ci = Ft ? Symbol.for("react.forward_ref") : 60112, Mr = Ft ? Symbol.for("react.suspense") : 60113, jn = Ft ? Symbol.for("react.suspense_list") : 60120, Gr = Ft ? Symbol.for("react.memo") : 60115, Vi = Ft ? Symbol.for("react.lazy") : 60116, Ta = Ft ? Symbol.for("react.block") : 60121, Ma = typeof Symbol == "function" && Symbol.iterator;
  function di(n) {
    return n === null || typeof n != "object" ? null : (n = Ma && n[Ma] || n["@@iterator"], typeof n == "function" ? n : null);
  }
  function tr(n) {
    if (n._status === -1) {
      n._status = 0;
      var a = n._ctor;
      a = a(), n._result = a, a.then(function(u) {
        n._status === 0 && (u = u.default, n._status = 1, n._result = u);
      }, function(u) {
        n._status === 0 && (n._status = 2, n._result = u);
      });
    }
  }
  function fi(n) {
    if (n == null)
      return null;
    if (typeof n == "function")
      return n.displayName || n.name || null;
    if (typeof n == "string")
      return n;
    switch (n) {
      case Jn:
        return "Fragment";
      case Ci:
        return "Portal";
      case st:
        return "Profiler";
      case ke:
        return "StrictMode";
      case Mr:
        return "Suspense";
      case jn:
        return "SuspenseList";
    }
    if (typeof n == "object")
      switch (n.$$typeof) {
        case jt:
          return "Context.Consumer";
        case He:
          return "Context.Provider";
        case ci:
          var a = n.render;
          return a = a.displayName || a.name || "", n.displayName || (a !== "" ? "ForwardRef(" + a + ")" : "ForwardRef");
        case Gr:
          return fi(n.type);
        case Ta:
          return fi(n.render);
        case Vi:
          if (n = n._status === 1 ? n._result : null)
            return fi(n);
      }
    return null;
  }
  function Ea(n) {
    var a = "";
    do {
      e:
        switch (n.tag) {
          case 3:
          case 4:
          case 6:
          case 7:
          case 10:
          case 9:
            var u = "";
            break e;
          default:
            var f = n._debugOwner, v = n._debugSource, S = fi(n.type);
            u = null, f && (u = fi(f.type)), f = S, S = "", v ? S = " (at " + v.fileName.replace(bn, "") + ":" + v.lineNumber + ")" : u && (S = " (created by " + u + ")"), u = `
    in ` + (f || "Unknown") + S;
        }
      a += u, n = n.return;
    } while (n);
    return a;
  }
  function Ti(n) {
    switch (typeof n) {
      case "boolean":
      case "number":
      case "object":
      case "string":
      case "undefined":
        return n;
      default:
        return "";
    }
  }
  function Xr(n) {
    var a = n.type;
    return (n = n.nodeName) && n.toLowerCase() === "input" && (a === "checkbox" || a === "radio");
  }
  function Cs(n) {
    var a = Xr(n) ? "checked" : "value", u = Object.getOwnPropertyDescriptor(n.constructor.prototype, a), f = "" + n[a];
    if (!n.hasOwnProperty(a) && typeof u < "u" && typeof u.get == "function" && typeof u.set == "function") {
      var v = u.get, S = u.set;
      return Object.defineProperty(n, a, { configurable: !0, get: function() {
        return v.call(this);
      }, set: function(T) {
        f = "" + T, S.call(this, T);
      } }), Object.defineProperty(n, a, { enumerable: u.enumerable }), { getValue: function() {
        return f;
      }, setValue: function(T) {
        f = "" + T;
      }, stopTracking: function() {
        n._valueTracker = null, delete n[a];
      } };
    }
  }
  function Er(n) {
    n._valueTracker || (n._valueTracker = Cs(n));
  }
  function Ir(n) {
    if (!n)
      return !1;
    var a = n._valueTracker;
    if (!a)
      return !0;
    var u = a.getValue(), f = "";
    return n && (f = Xr(n) ? n.checked ? "true" : "false" : n.value), n = f, n !== u ? (a.setValue(n), !0) : !1;
  }
  function vn(n, a) {
    var u = a.checked;
    return i({}, a, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: u != null ? u : n._wrapperState.initialChecked });
  }
  function qn(n, a) {
    var u = a.defaultValue == null ? "" : a.defaultValue, f = a.checked != null ? a.checked : a.defaultChecked;
    u = Ti(a.value != null ? a.value : u), n._wrapperState = { initialChecked: f, initialValue: u, controlled: a.type === "checkbox" || a.type === "radio" ? a.checked != null : a.value != null };
  }
  function Ia(n, a) {
    a = a.checked, a != null && Mt(n, "checked", a, !1);
  }
  function kt(n, a) {
    Ia(n, a);
    var u = Ti(a.value), f = a.type;
    if (u != null)
      f === "number" ? (u === 0 && n.value === "" || n.value != u) && (n.value = "" + u) : n.value !== "" + u && (n.value = "" + u);
    else if (f === "submit" || f === "reset") {
      n.removeAttribute("value");
      return;
    }
    a.hasOwnProperty("value") ? Mi(n, a.type, u) : a.hasOwnProperty("defaultValue") && Mi(n, a.type, Ti(a.defaultValue)), a.checked == null && a.defaultChecked != null && (n.defaultChecked = !!a.defaultChecked);
  }
  function rn(n, a, u) {
    if (a.hasOwnProperty("value") || a.hasOwnProperty("defaultValue")) {
      var f = a.type;
      if (!(f !== "submit" && f !== "reset" || a.value !== void 0 && a.value !== null))
        return;
      a = "" + n._wrapperState.initialValue, u || a === n.value || (n.value = a), n.defaultValue = a;
    }
    u = n.name, u !== "" && (n.name = ""), n.defaultChecked = !!n._wrapperState.initialChecked, u !== "" && (n.name = u);
  }
  function Mi(n, a, u) {
    (a !== "number" || n.ownerDocument.activeElement !== n) && (u == null ? n.defaultValue = "" + n._wrapperState.initialValue : n.defaultValue !== "" + u && (n.defaultValue = "" + u));
  }
  function kn(n) {
    var a = "";
    return r.Children.forEach(n, function(u) {
      u != null && (a += u);
    }), a;
  }
  function Ei(n, a) {
    return n = i({ children: void 0 }, a), (a = kn(a.children)) && (n.children = a), n;
  }
  function Kn(n, a, u, f) {
    if (n = n.options, a) {
      a = {};
      for (var v = 0; v < u.length; v++)
        a["$" + u[v]] = !0;
      for (u = 0; u < n.length; u++)
        v = a.hasOwnProperty("$" + n[u].value), n[u].selected !== v && (n[u].selected = v), v && f && (n[u].defaultSelected = !0);
    } else {
      for (u = "" + Ti(u), a = null, v = 0; v < n.length; v++) {
        if (n[v].value === u) {
          n[v].selected = !0, f && (n[v].defaultSelected = !0);
          return;
        }
        a !== null || n[v].disabled || (a = n[v]);
      }
      a !== null && (a.selected = !0);
    }
  }
  function Jr(n, a) {
    if (a.dangerouslySetInnerHTML != null)
      throw Error(c(91));
    return i({}, a, { value: void 0, defaultValue: void 0, children: "" + n._wrapperState.initialValue });
  }
  function Aa(n, a) {
    var u = a.value;
    if (u == null) {
      if (u = a.children, a = a.defaultValue, u != null) {
        if (a != null)
          throw Error(c(92));
        if (Array.isArray(u)) {
          if (!(1 >= u.length))
            throw Error(c(93));
          u = u[0];
        }
        a = u;
      }
      a == null && (a = ""), u = a;
    }
    n._wrapperState = { initialValue: Ti(u) };
  }
  function yo(n, a) {
    var u = Ti(a.value), f = Ti(a.defaultValue);
    u != null && (u = "" + u, u !== n.value && (n.value = u), a.defaultValue == null && n.defaultValue !== u && (n.defaultValue = u)), f != null && (n.defaultValue = "" + f);
  }
  function wo(n) {
    var a = n.textContent;
    a === n._wrapperState.initialValue && a !== "" && a !== null && (n.value = a);
  }
  var Ts = { html: "http://www.w3.org/1999/xhtml", mathml: "http://www.w3.org/1998/Math/MathML", svg: "http://www.w3.org/2000/svg" };
  function Ra(n) {
    switch (n) {
      case "svg":
        return "http://www.w3.org/2000/svg";
      case "math":
        return "http://www.w3.org/1998/Math/MathML";
      default:
        return "http://www.w3.org/1999/xhtml";
    }
  }
  function _n(n, a) {
    return n == null || n === "http://www.w3.org/1999/xhtml" ? Ra(a) : n === "http://www.w3.org/2000/svg" && a === "foreignObject" ? "http://www.w3.org/1999/xhtml" : n;
  }
  var Ar, qr = function(n) {
    return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(a, u, f, v) {
      MSApp.execUnsafeLocalFunction(function() {
        return n(a, u, f, v);
      });
    } : n;
  }(function(n, a) {
    if (n.namespaceURI !== Ts.svg || "innerHTML" in n)
      n.innerHTML = a;
    else {
      for (Ar = Ar || document.createElement("div"), Ar.innerHTML = "<svg>" + a.valueOf().toString() + "</svg>", a = Ar.firstChild; n.firstChild; )
        n.removeChild(n.firstChild);
      for (; a.firstChild; )
        n.appendChild(a.firstChild);
    }
  });
  function ei(n, a) {
    if (a) {
      var u = n.firstChild;
      if (u && u === n.lastChild && u.nodeType === 3) {
        u.nodeValue = a;
        return;
      }
    }
    n.textContent = a;
  }
  function Rr(n, a) {
    var u = {};
    return u[n.toLowerCase()] = a.toLowerCase(), u["Webkit" + n] = "webkit" + a, u["Moz" + n] = "moz" + a, u;
  }
  var Un = { animationend: Rr("Animation", "AnimationEnd"), animationiteration: Rr("Animation", "AnimationIteration"), animationstart: Rr("Animation", "AnimationStart"), transitionend: Rr("Transition", "TransitionEnd") }, nr = {}, Ms = {};
  Y && (Ms = document.createElement("div").style, "AnimationEvent" in window || (delete Un.animationend.animation, delete Un.animationiteration.animation, delete Un.animationstart.animation), "TransitionEvent" in window || delete Un.transitionend.transition);
  function Kr(n) {
    if (nr[n])
      return nr[n];
    if (!Un[n])
      return n;
    var a = Un[n], u;
    for (u in a)
      if (a.hasOwnProperty(u) && u in Ms)
        return nr[n] = a[u];
    return n;
  }
  var Es = Kr("animationend"), ne = Kr("animationiteration"), de = Kr("animationstart"), Je = Kr("transitionend"), pt = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), Jt = new (typeof WeakMap == "function" ? WeakMap : Map)();
  function Yt(n) {
    var a = Jt.get(n);
    return a === void 0 && (a = /* @__PURE__ */ new Map(), Jt.set(n, a)), a;
  }
  function fn(n) {
    var a = n, u = n;
    if (n.alternate)
      for (; a.return; )
        a = a.return;
    else {
      n = a;
      do
        a = n, (a.effectTag & 1026) !== 0 && (u = a.return), n = a.return;
      while (n);
    }
    return a.tag === 3 ? u : null;
  }
  function ti(n) {
    if (n.tag === 13) {
      var a = n.memoizedState;
      if (a === null && (n = n.alternate, n !== null && (a = n.memoizedState)), a !== null)
        return a.dehydrated;
    }
    return null;
  }
  function qt(n) {
    if (fn(n) !== n)
      throw Error(c(188));
  }
  function Da(n) {
    var a = n.alternate;
    if (!a) {
      if (a = fn(n), a === null)
        throw Error(c(188));
      return a !== n ? null : n;
    }
    for (var u = n, f = a; ; ) {
      var v = u.return;
      if (v === null)
        break;
      var S = v.alternate;
      if (S === null) {
        if (f = v.return, f !== null) {
          u = f;
          continue;
        }
        break;
      }
      if (v.child === S.child) {
        for (S = v.child; S; ) {
          if (S === u)
            return qt(v), n;
          if (S === f)
            return qt(v), a;
          S = S.sibling;
        }
        throw Error(c(188));
      }
      if (u.return !== f.return)
        u = v, f = S;
      else {
        for (var T = !1, R = v.child; R; ) {
          if (R === u) {
            T = !0, u = v, f = S;
            break;
          }
          if (R === f) {
            T = !0, f = v, u = S;
            break;
          }
          R = R.sibling;
        }
        if (!T) {
          for (R = S.child; R; ) {
            if (R === u) {
              T = !0, u = S, f = v;
              break;
            }
            if (R === f) {
              T = !0, f = S, u = v;
              break;
            }
            R = R.sibling;
          }
          if (!T)
            throw Error(c(189));
        }
      }
      if (u.alternate !== f)
        throw Error(c(190));
    }
    if (u.tag !== 3)
      throw Error(c(188));
    return u.stateNode.current === u ? n : a;
  }
  function bo(n) {
    if (n = Da(n), !n)
      return null;
    for (var a = n; ; ) {
      if (a.tag === 5 || a.tag === 6)
        return a;
      if (a.child)
        a.child.return = a, a = a.child;
      else {
        if (a === n)
          break;
        for (; !a.sibling; ) {
          if (!a.return || a.return === n)
            return null;
          a = a.return;
        }
        a.sibling.return = a.return, a = a.sibling;
      }
    }
    return null;
  }
  function an(n, a) {
    if (a == null)
      throw Error(c(30));
    return n == null ? a : Array.isArray(n) ? Array.isArray(a) ? (n.push.apply(n, a), n) : (n.push(a), n) : Array.isArray(a) ? [n].concat(a) : [n, a];
  }
  function hn(n, a, u) {
    Array.isArray(n) ? n.forEach(a, u) : n && a.call(u, n);
  }
  var Is = null;
  function pl(n) {
    if (n) {
      var a = n._dispatchListeners, u = n._dispatchInstances;
      if (Array.isArray(a))
        for (var f = 0; f < a.length && !n.isPropagationStopped(); f++)
          q(n, a[f], u[f]);
      else
        a && q(n, a, u);
      n._dispatchListeners = null, n._dispatchInstances = null, n.isPersistent() || n.constructor.release(n);
    }
  }
  function ea(n) {
    if (n !== null && (Is = an(Is, n)), n = Is, Is = null, n) {
      if (hn(n, pl), Is)
        throw Error(c(95));
      if (g)
        throw n = x, g = !1, x = null, n;
    }
  }
  function ml(n) {
    return n = n.target || n.srcElement || window, n.correspondingUseElement && (n = n.correspondingUseElement), n.nodeType === 3 ? n.parentNode : n;
  }
  function Lu(n) {
    if (!Y)
      return !1;
    n = "on" + n;
    var a = n in document;
    return a || (a = document.createElement("div"), a.setAttribute(n, "return;"), a = typeof a[n] == "function"), a;
  }
  var As = [];
  function vl(n) {
    n.topLevelType = null, n.nativeEvent = null, n.targetInst = null, n.ancestors.length = 0, 10 > As.length && As.push(n);
  }
  function Bu(n, a, u, f) {
    if (As.length) {
      var v = As.pop();
      return v.topLevelType = n, v.eventSystemFlags = f, v.nativeEvent = a, v.targetInst = u, v;
    }
    return { topLevelType: n, eventSystemFlags: f, nativeEvent: a, targetInst: u, ancestors: [] };
  }
  function gl(n) {
    var a = n.targetInst, u = a;
    do {
      if (!u) {
        n.ancestors.push(u);
        break;
      }
      var f = u;
      if (f.tag === 3)
        f = f.stateNode.containerInfo;
      else {
        for (; f.return; )
          f = f.return;
        f = f.tag !== 3 ? null : f.stateNode.containerInfo;
      }
      if (!f)
        break;
      a = u.tag, a !== 5 && a !== 6 || n.ancestors.push(u), u = Ao(f);
    } while (u);
    for (u = 0; u < n.ancestors.length; u++) {
      a = n.ancestors[u];
      var v = ml(n.nativeEvent);
      f = n.topLevelType;
      var S = n.nativeEvent, T = n.eventSystemFlags;
      u === 0 && (T |= 64);
      for (var R = null, W = 0; W < ue.length; W++) {
        var U = ue[W];
        U && (U = U.extractEvents(f, a, S, v, T)) && (R = an(R, U));
      }
      ea(R);
    }
  }
  function M(n, a, u) {
    if (!u.has(n)) {
      switch (n) {
        case "scroll":
          rr(a, "scroll", !0);
          break;
        case "focus":
        case "blur":
          rr(a, "focus", !0), rr(a, "blur", !0), u.set("blur", null), u.set("focus", null);
          break;
        case "cancel":
        case "close":
          Lu(n) && rr(a, n, !0);
          break;
        case "invalid":
        case "submit":
        case "reset":
          break;
        default:
          pt.indexOf(n) === -1 && ft(n, a);
      }
      u.set(n, null);
    }
  }
  var _, H, X, xe = !1, Ze = [], je = null, et = null, Nt = null, gn = /* @__PURE__ */ new Map(), xn = /* @__PURE__ */ new Map(), Mn = [], ni = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput close cancel copy cut paste click change contextmenu reset submit".split(" "), ii = "focus blur dragenter dragleave mouseover mouseout pointerover pointerout gotpointercapture lostpointercapture".split(" ");
  function So(n, a) {
    var u = Yt(a);
    ni.forEach(function(f) {
      M(f, a, u);
    }), ii.forEach(function(f) {
      M(f, a, u);
    });
  }
  function ta(n, a, u, f, v) {
    return { blockedOn: n, topLevelType: a, eventSystemFlags: u | 32, nativeEvent: v, container: f };
  }
  function ir(n, a) {
    switch (n) {
      case "focus":
      case "blur":
        je = null;
        break;
      case "dragenter":
      case "dragleave":
        et = null;
        break;
      case "mouseover":
      case "mouseout":
        Nt = null;
        break;
      case "pointerover":
      case "pointerout":
        gn.delete(a.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        xn.delete(a.pointerId);
    }
  }
  function xo(n, a, u, f, v, S) {
    return n === null || n.nativeEvent !== S ? (n = ta(a, u, f, v, S), a !== null && (a = Sl(a), a !== null && H(a)), n) : (n.eventSystemFlags |= f, n);
  }
  function mp(n, a, u, f, v) {
    switch (a) {
      case "focus":
        return je = xo(je, n, a, u, f, v), !0;
      case "dragenter":
        return et = xo(et, n, a, u, f, v), !0;
      case "mouseover":
        return Nt = xo(Nt, n, a, u, f, v), !0;
      case "pointerover":
        var S = v.pointerId;
        return gn.set(S, xo(gn.get(S) || null, n, a, u, f, v)), !0;
      case "gotpointercapture":
        return S = v.pointerId, xn.set(S, xo(xn.get(S) || null, n, a, u, f, v)), !0;
    }
    return !1;
  }
  function bg(n) {
    var a = Ao(n.target);
    if (a !== null) {
      var u = fn(a);
      if (u !== null) {
        if (a = u.tag, a === 13) {
          if (a = ti(u), a !== null) {
            n.blockedOn = a, o.unstable_runWithPriority(n.priority, function() {
              X(u);
            });
            return;
          }
        } else if (a === 3 && u.stateNode.hydrate) {
          n.blockedOn = u.tag === 3 ? u.stateNode.containerInfo : null;
          return;
        }
      }
    }
    n.blockedOn = null;
  }
  function Dr(n) {
    if (n.blockedOn !== null)
      return !1;
    var a = kr(n.topLevelType, n.eventSystemFlags, n.container, n.nativeEvent);
    if (a !== null) {
      var u = Sl(a);
      return u !== null && H(u), n.blockedOn = a, !1;
    }
    return !0;
  }
  function vp(n, a, u) {
    Dr(n) && u.delete(a);
  }
  function Pd() {
    for (xe = !1; 0 < Ze.length; ) {
      var n = Ze[0];
      if (n.blockedOn !== null) {
        n = Sl(n.blockedOn), n !== null && _(n);
        break;
      }
      var a = kr(n.topLevelType, n.eventSystemFlags, n.container, n.nativeEvent);
      a !== null ? n.blockedOn = a : Ze.shift();
    }
    je !== null && Dr(je) && (je = null), et !== null && Dr(et) && (et = null), Nt !== null && Dr(Nt) && (Nt = null), gn.forEach(vp), xn.forEach(vp);
  }
  function Rs(n, a) {
    n.blockedOn === a && (n.blockedOn = null, xe || (xe = !0, o.unstable_scheduleCallback(o.unstable_NormalPriority, Pd)));
  }
  function gp(n) {
    function a(v) {
      return Rs(v, n);
    }
    if (0 < Ze.length) {
      Rs(Ze[0], n);
      for (var u = 1; u < Ze.length; u++) {
        var f = Ze[u];
        f.blockedOn === n && (f.blockedOn = null);
      }
    }
    for (je !== null && Rs(je, n), et !== null && Rs(et, n), Nt !== null && Rs(Nt, n), gn.forEach(a), xn.forEach(a), u = 0; u < Mn.length; u++)
      f = Mn[u], f.blockedOn === n && (f.blockedOn = null);
    for (; 0 < Mn.length && (u = Mn[0], u.blockedOn === null); )
      bg(u), u.blockedOn === null && Mn.shift();
  }
  var zd = {}, yp = /* @__PURE__ */ new Map(), Od = /* @__PURE__ */ new Map(), Te = [
    "abort",
    "abort",
    Es,
    "animationEnd",
    ne,
    "animationIteration",
    de,
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
    Je,
    "transitionEnd",
    "waiting",
    "waiting"
  ];
  function ju(n, a) {
    for (var u = 0; u < n.length; u += 2) {
      var f = n[u], v = n[u + 1], S = "on" + (v[0].toUpperCase() + v.slice(1));
      S = { phasedRegistrationNames: { bubbled: S, captured: S + "Capture" }, dependencies: [f], eventPriority: a }, Od.set(f, a), yp.set(f, S), zd[v] = S;
    }
  }
  ju("blur blur cancel cancel click click close close contextmenu contextMenu copy copy cut cut auxclick auxClick dblclick doubleClick dragend dragEnd dragstart dragStart drop drop focus focus input input invalid invalid keydown keyDown keypress keyPress keyup keyUp mousedown mouseDown mouseup mouseUp paste paste pause pause play play pointercancel pointerCancel pointerdown pointerDown pointerup pointerUp ratechange rateChange reset reset seeked seeked submit submit touchcancel touchCancel touchend touchEnd touchstart touchStart volumechange volumeChange".split(" "), 0), ju("drag drag dragenter dragEnter dragexit dragExit dragleave dragLeave dragover dragOver mousemove mouseMove mouseout mouseOut mouseover mouseOver pointermove pointerMove pointerout pointerOut pointerover pointerOver scroll scroll toggle toggle touchmove touchMove wheel wheel".split(" "), 1), ju(Te, 2);
  for (var wp = "change selectionchange textInput compositionstart compositionend compositionupdate".split(" "), $n = 0; $n < wp.length; $n++)
    Od.set(wp[$n], 0);
  var na = o.unstable_UserBlockingPriority, yl = o.unstable_runWithPriority, Na = !0;
  function ft(n, a) {
    rr(a, n, !1);
  }
  function rr(n, a, u) {
    var f = Od.get(a);
    switch (f === void 0 ? 2 : f) {
      case 0:
        f = Co.bind(null, a, 1, n);
        break;
      case 1:
        f = Nr.bind(null, a, 1, n);
        break;
      default:
        f = ri.bind(null, a, 1, n);
    }
    u ? n.addEventListener(a, f, !0) : n.addEventListener(a, f, !1);
  }
  function Co(n, a, u, f) {
    $e || Ve();
    var v = ri, S = $e;
    $e = !0;
    try {
      Se(v, n, a, u, f);
    } finally {
      ($e = S) || Bt();
    }
  }
  function Nr(n, a, u, f) {
    yl(na, ri.bind(null, n, a, u, f));
  }
  function ri(n, a, u, f) {
    if (Na)
      if (0 < Ze.length && -1 < ni.indexOf(n))
        n = ta(null, n, a, u, f), Ze.push(n);
      else {
        var v = kr(n, a, u, f);
        if (v === null)
          ir(n, f);
        else if (-1 < ni.indexOf(n))
          n = ta(v, n, a, u, f), Ze.push(n);
        else if (!mp(v, n, a, u, f)) {
          ir(n, f), n = Bu(n, f, null, a);
          try {
            Ge(gl, n);
          } finally {
            vl(n);
          }
        }
      }
  }
  function kr(n, a, u, f) {
    if (u = ml(f), u = Ao(u), u !== null) {
      var v = fn(u);
      if (v === null)
        u = null;
      else {
        var S = v.tag;
        if (S === 13) {
          if (u = ti(v), u !== null)
            return u;
          u = null;
        } else if (S === 3) {
          if (v.stateNode.hydrate)
            return v.tag === 3 ? v.stateNode.containerInfo : null;
          u = null;
        } else
          v !== u && (u = null);
      }
    }
    n = Bu(n, f, u, a);
    try {
      Ge(gl, n);
    } finally {
      vl(n);
    }
    return null;
  }
  var To = {
    animationIterationCount: !0,
    borderImageOutset: !0,
    borderImageSlice: !0,
    borderImageWidth: !0,
    boxFlex: !0,
    boxFlexGroup: !0,
    boxOrdinalGroup: !0,
    columnCount: !0,
    columns: !0,
    flex: !0,
    flexGrow: !0,
    flexPositive: !0,
    flexShrink: !0,
    flexNegative: !0,
    flexOrder: !0,
    gridArea: !0,
    gridRow: !0,
    gridRowEnd: !0,
    gridRowSpan: !0,
    gridRowStart: !0,
    gridColumn: !0,
    gridColumnEnd: !0,
    gridColumnSpan: !0,
    gridColumnStart: !0,
    fontWeight: !0,
    lineClamp: !0,
    lineHeight: !0,
    opacity: !0,
    order: !0,
    orphans: !0,
    tabSize: !0,
    widows: !0,
    zIndex: !0,
    zoom: !0,
    fillOpacity: !0,
    floodOpacity: !0,
    stopOpacity: !0,
    strokeDasharray: !0,
    strokeDashoffset: !0,
    strokeMiterlimit: !0,
    strokeOpacity: !0,
    strokeWidth: !0
  }, Uu = ["Webkit", "ms", "Moz", "O"];
  Object.keys(To).forEach(function(n) {
    Uu.forEach(function(a) {
      a = a + n.charAt(0).toUpperCase() + n.substring(1), To[a] = To[n];
    });
  });
  function bp(n, a, u) {
    return a == null || typeof a == "boolean" || a === "" ? "" : u || typeof a != "number" || a === 0 || To.hasOwnProperty(n) && To[n] ? ("" + a).trim() : a + "px";
  }
  function Sp(n, a) {
    n = n.style;
    for (var u in a)
      if (a.hasOwnProperty(u)) {
        var f = u.indexOf("--") === 0, v = bp(u, a[u], f);
        u === "float" && (u = "cssFloat"), f ? n.setProperty(u, v) : n[u] = v;
      }
  }
  var xp = i({ menuitem: !0 }, { area: !0, base: !0, br: !0, col: !0, embed: !0, hr: !0, img: !0, input: !0, keygen: !0, link: !0, meta: !0, param: !0, source: !0, track: !0, wbr: !0 });
  function Vu(n, a) {
    if (a) {
      if (xp[n] && (a.children != null || a.dangerouslySetInnerHTML != null))
        throw Error(c(137, n, ""));
      if (a.dangerouslySetInnerHTML != null) {
        if (a.children != null)
          throw Error(c(60));
        if (!(typeof a.dangerouslySetInnerHTML == "object" && "__html" in a.dangerouslySetInnerHTML))
          throw Error(c(61));
      }
      if (a.style != null && typeof a.style != "object")
        throw Error(c(62, ""));
    }
  }
  function Ld(n, a) {
    if (n.indexOf("-") === -1)
      return typeof a.is == "string";
    switch (n) {
      case "annotation-xml":
      case "color-profile":
      case "font-face":
      case "font-face-src":
      case "font-face-uri":
      case "font-face-format":
      case "font-face-name":
      case "missing-glyph":
        return !1;
      default:
        return !0;
    }
  }
  var Cp = Ts.html;
  function ia(n, a) {
    n = n.nodeType === 9 || n.nodeType === 11 ? n : n.ownerDocument;
    var u = Yt(n);
    a = Fe[a];
    for (var f = 0; f < a.length; f++)
      M(a[f], n, u);
  }
  function Ds() {
  }
  function Hu(n) {
    if (n = n || (typeof document < "u" ? document : void 0), typeof n > "u")
      return null;
    try {
      return n.activeElement || n.body;
    } catch {
      return n.body;
    }
  }
  function Bd(n) {
    for (; n && n.firstChild; )
      n = n.firstChild;
    return n;
  }
  function jd(n, a) {
    var u = Bd(n);
    n = 0;
    for (var f; u; ) {
      if (u.nodeType === 3) {
        if (f = n + u.textContent.length, n <= a && f >= a)
          return { node: u, offset: a - n };
        n = f;
      }
      e: {
        for (; u; ) {
          if (u.nextSibling) {
            u = u.nextSibling;
            break e;
          }
          u = u.parentNode;
        }
        u = void 0;
      }
      u = Bd(u);
    }
  }
  function Ud(n, a) {
    return n && a ? n === a ? !0 : n && n.nodeType === 3 ? !1 : a && a.nodeType === 3 ? Ud(n, a.parentNode) : "contains" in n ? n.contains(a) : n.compareDocumentPosition ? !!(n.compareDocumentPosition(a) & 16) : !1 : !1;
  }
  function Vd() {
    for (var n = window, a = Hu(); a instanceof n.HTMLIFrameElement; ) {
      try {
        var u = typeof a.contentWindow.location.href == "string";
      } catch {
        u = !1;
      }
      if (u)
        n = a.contentWindow;
      else
        break;
      a = Hu(n.document);
    }
    return a;
  }
  function Wu(n) {
    var a = n && n.nodeName && n.nodeName.toLowerCase();
    return a && (a === "input" && (n.type === "text" || n.type === "search" || n.type === "tel" || n.type === "url" || n.type === "password") || a === "textarea" || n.contentEditable === "true");
  }
  var Fu = "$", Hd = "/$", $u = "$?", wl = "$!", Qu = null, Wd = null;
  function Tp(n, a) {
    switch (n) {
      case "button":
      case "input":
      case "select":
      case "textarea":
        return !!a.autoFocus;
    }
    return !1;
  }
  function bl(n, a) {
    return n === "textarea" || n === "option" || n === "noscript" || typeof a.children == "string" || typeof a.children == "number" || typeof a.dangerouslySetInnerHTML == "object" && a.dangerouslySetInnerHTML !== null && a.dangerouslySetInnerHTML.__html != null;
  }
  var Zu = typeof setTimeout == "function" ? setTimeout : void 0, Mp = typeof clearTimeout == "function" ? clearTimeout : void 0;
  function Mo(n) {
    for (; n != null; n = n.nextSibling) {
      var a = n.nodeType;
      if (a === 1 || a === 3)
        break;
    }
    return n;
  }
  function Fd(n) {
    n = n.previousSibling;
    for (var a = 0; n; ) {
      if (n.nodeType === 8) {
        var u = n.data;
        if (u === Fu || u === wl || u === $u) {
          if (a === 0)
            return n;
          a--;
        } else
          u === Hd && a++;
      }
      n = n.previousSibling;
    }
    return null;
  }
  var $d = Math.random().toString(36).slice(2), _r = "__reactInternalInstance$" + $d, Eo = "__reactEventHandlers$" + $d, Io = "__reactContainere$" + $d;
  function Ao(n) {
    var a = n[_r];
    if (a)
      return a;
    for (var u = n.parentNode; u; ) {
      if (a = u[Io] || u[_r]) {
        if (u = a.alternate, a.child !== null || u !== null && u.child !== null)
          for (n = Fd(n); n !== null; ) {
            if (u = n[_r])
              return u;
            n = Fd(n);
          }
        return a;
      }
      n = u, u = n.parentNode;
    }
    return null;
  }
  function Sl(n) {
    return n = n[_r] || n[Io], !n || n.tag !== 5 && n.tag !== 6 && n.tag !== 13 && n.tag !== 3 ? null : n;
  }
  function Hi(n) {
    if (n.tag === 5 || n.tag === 6)
      return n.stateNode;
    throw Error(c(33));
  }
  function xl(n) {
    return n[Eo] || null;
  }
  function Pr(n) {
    do
      n = n.return;
    while (n && n.tag !== 5);
    return n || null;
  }
  function Ep(n, a) {
    var u = n.stateNode;
    if (!u)
      return null;
    var f = z(u);
    if (!f)
      return null;
    u = f[a];
    e:
      switch (a) {
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
          (f = !f.disabled) || (n = n.type, f = !(n === "button" || n === "input" || n === "select" || n === "textarea")), n = !f;
          break e;
        default:
          n = !1;
      }
    if (n)
      return null;
    if (u && typeof u != "function")
      throw Error(c(
        231,
        a,
        typeof u
      ));
    return u;
  }
  function Ip(n, a, u) {
    (a = Ep(n, u.dispatchConfig.phasedRegistrationNames[a])) && (u._dispatchListeners = an(u._dispatchListeners, a), u._dispatchInstances = an(u._dispatchInstances, n));
  }
  function Sg(n) {
    if (n && n.dispatchConfig.phasedRegistrationNames) {
      for (var a = n._targetInst, u = []; a; )
        u.push(a), a = Pr(a);
      for (a = u.length; 0 < a--; )
        Ip(u[a], "captured", n);
      for (a = 0; a < u.length; a++)
        Ip(u[a], "bubbled", n);
    }
  }
  function Yu(n, a, u) {
    n && u && u.dispatchConfig.registrationName && (a = Ep(n, u.dispatchConfig.registrationName)) && (u._dispatchListeners = an(u._dispatchListeners, a), u._dispatchInstances = an(u._dispatchInstances, n));
  }
  function Qd(n) {
    n && n.dispatchConfig.registrationName && Yu(n._targetInst, null, n);
  }
  function Ns(n) {
    hn(n, Sg);
  }
  var ra = null, Gu = null, Xu = null;
  function Cl() {
    if (Xu)
      return Xu;
    var n, a = Gu, u = a.length, f, v = "value" in ra ? ra.value : ra.textContent, S = v.length;
    for (n = 0; n < u && a[n] === v[n]; n++)
      ;
    var T = u - n;
    for (f = 1; f <= T && a[u - f] === v[S - f]; f++)
      ;
    return Xu = v.slice(n, 1 < f ? 1 - f : void 0);
  }
  function Tl() {
    return !0;
  }
  function Ro() {
    return !1;
  }
  function hi(n, a, u, f) {
    this.dispatchConfig = n, this._targetInst = a, this.nativeEvent = u, n = this.constructor.Interface;
    for (var v in n)
      n.hasOwnProperty(v) && ((a = n[v]) ? this[v] = a(u) : v === "target" ? this.target = f : this[v] = u[v]);
    return this.isDefaultPrevented = (u.defaultPrevented != null ? u.defaultPrevented : u.returnValue === !1) ? Tl : Ro, this.isPropagationStopped = Ro, this;
  }
  i(hi.prototype, { preventDefault: function() {
    this.defaultPrevented = !0;
    var n = this.nativeEvent;
    n && (n.preventDefault ? n.preventDefault() : typeof n.returnValue != "unknown" && (n.returnValue = !1), this.isDefaultPrevented = Tl);
  }, stopPropagation: function() {
    var n = this.nativeEvent;
    n && (n.stopPropagation ? n.stopPropagation() : typeof n.cancelBubble != "unknown" && (n.cancelBubble = !0), this.isPropagationStopped = Tl);
  }, persist: function() {
    this.isPersistent = Tl;
  }, isPersistent: Ro, destructor: function() {
    var n = this.constructor.Interface, a;
    for (a in n)
      this[a] = null;
    this.nativeEvent = this._targetInst = this.dispatchConfig = null, this.isPropagationStopped = this.isDefaultPrevented = Ro, this._dispatchInstances = this._dispatchListeners = null;
  } }), hi.Interface = { type: null, target: null, currentTarget: function() {
    return null;
  }, eventPhase: null, bubbles: null, cancelable: null, timeStamp: function(n) {
    return n.timeStamp || Date.now();
  }, defaultPrevented: null, isTrusted: null }, hi.extend = function(n) {
    function a() {
    }
    function u() {
      return f.apply(this, arguments);
    }
    var f = this;
    a.prototype = f.prototype;
    var v = new a();
    return i(v, u.prototype), u.prototype = v, u.prototype.constructor = u, u.Interface = i({}, f.Interface, n), u.extend = f.extend, Ap(u), u;
  }, Ap(hi);
  function Zd(n, a, u, f) {
    if (this.eventPool.length) {
      var v = this.eventPool.pop();
      return this.call(v, n, a, u, f), v;
    }
    return new this(n, a, u, f);
  }
  function Yd(n) {
    if (!(n instanceof this))
      throw Error(c(279));
    n.destructor(), 10 > this.eventPool.length && this.eventPool.push(n);
  }
  function Ap(n) {
    n.eventPool = [], n.getPooled = Zd, n.release = Yd;
  }
  var Ju = hi.extend({ data: null }), Rp = hi.extend({ data: null }), ar = [9, 13, 27, 32], sr = Y && "CompositionEvent" in window, ai = null;
  Y && "documentMode" in document && (ai = document.documentMode);
  var ka = Y && "TextEvent" in window && !ai, qu = Y && (!sr || ai && 8 < ai && 11 >= ai), Ml = String.fromCharCode(32), _a = { beforeInput: { phasedRegistrationNames: { bubbled: "onBeforeInput", captured: "onBeforeInputCapture" }, dependencies: ["compositionend", "keypress", "textInput", "paste"] }, compositionEnd: { phasedRegistrationNames: { bubbled: "onCompositionEnd", captured: "onCompositionEndCapture" }, dependencies: "blur compositionend keydown keypress keyup mousedown".split(" ") }, compositionStart: { phasedRegistrationNames: {
    bubbled: "onCompositionStart",
    captured: "onCompositionStartCapture"
  }, dependencies: "blur compositionstart keydown keypress keyup mousedown".split(" ") }, compositionUpdate: { phasedRegistrationNames: { bubbled: "onCompositionUpdate", captured: "onCompositionUpdateCapture" }, dependencies: "blur compositionupdate keydown keypress keyup mousedown".split(" ") } }, xg = !1;
  function El(n, a) {
    switch (n) {
      case "keyup":
        return ar.indexOf(a.keyCode) !== -1;
      case "keydown":
        return a.keyCode !== 229;
      case "keypress":
      case "mousedown":
      case "blur":
        return !0;
      default:
        return !1;
    }
  }
  function ks(n) {
    return n = n.detail, typeof n == "object" && "data" in n ? n.data : null;
  }
  var Pa = !1;
  function Dp(n, a) {
    switch (n) {
      case "compositionend":
        return ks(a);
      case "keypress":
        return a.which !== 32 ? null : (xg = !0, Ml);
      case "textInput":
        return n = a.data, n === Ml && xg ? null : n;
      default:
        return null;
    }
  }
  function Ku(n, a) {
    if (Pa)
      return n === "compositionend" || !sr && El(n, a) ? (n = Cl(), Xu = Gu = ra = null, Pa = !1, n) : null;
    switch (n) {
      case "paste":
        return null;
      case "keypress":
        if (!(a.ctrlKey || a.altKey || a.metaKey) || a.ctrlKey && a.altKey) {
          if (a.char && 1 < a.char.length)
            return a.char;
          if (a.which)
            return String.fromCharCode(a.which);
        }
        return null;
      case "compositionend":
        return qu && a.locale !== "ko" ? null : a.data;
      default:
        return null;
    }
  }
  var Gd = { eventTypes: _a, extractEvents: function(n, a, u, f) {
    var v;
    if (sr)
      e: {
        switch (n) {
          case "compositionstart":
            var S = _a.compositionStart;
            break e;
          case "compositionend":
            S = _a.compositionEnd;
            break e;
          case "compositionupdate":
            S = _a.compositionUpdate;
            break e;
        }
        S = void 0;
      }
    else
      Pa ? El(n, u) && (S = _a.compositionEnd) : n === "keydown" && u.keyCode === 229 && (S = _a.compositionStart);
    return S ? (qu && u.locale !== "ko" && (Pa || S !== _a.compositionStart ? S === _a.compositionEnd && Pa && (v = Cl()) : (ra = f, Gu = "value" in ra ? ra.value : ra.textContent, Pa = !0)), S = Ju.getPooled(
      S,
      a,
      u,
      f
    ), v ? S.data = v : (v = ks(u), v !== null && (S.data = v)), Ns(S), v = S) : v = null, (n = ka ? Dp(n, u) : Ku(n, u)) ? (a = Rp.getPooled(_a.beforeInput, a, u, f), a.data = n, Ns(a)) : a = null, v === null ? a : a === null ? v : [v, a];
  } }, Np = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
  function Xd(n) {
    var a = n && n.nodeName && n.nodeName.toLowerCase();
    return a === "input" ? !!Np[n.type] : a === "textarea";
  }
  var Jd = { change: { phasedRegistrationNames: { bubbled: "onChange", captured: "onChangeCapture" }, dependencies: "blur change click focus input keydown keyup selectionchange".split(" ") } };
  function Vn(n, a, u) {
    return n = hi.getPooled(Jd.change, n, a, u), n.type = "change", Oe(u), Ns(n), n;
  }
  var _s = null, Ps = null;
  function ec(n) {
    ea(n);
  }
  function za(n) {
    var a = Hi(n);
    if (Ir(a))
      return n;
  }
  function Il(n, a) {
    if (n === "change")
      return a;
  }
  var Do = !1;
  Y && (Do = Lu("input") && (!document.documentMode || 9 < document.documentMode));
  function aa() {
    _s && (_s.detachEvent("onpropertychange", Al), Ps = _s = null);
  }
  function Al(n) {
    if (n.propertyName === "value" && za(Ps))
      if (n = Vn(Ps, n, ml(n)), $e)
        ea(n);
      else {
        $e = !0;
        try {
          Qe(ec, n);
        } finally {
          $e = !1, Bt();
        }
      }
  }
  function qd(n, a, u) {
    n === "focus" ? (aa(), _s = a, Ps = u, _s.attachEvent("onpropertychange", Al)) : n === "blur" && aa();
  }
  function Rl(n) {
    if (n === "selectionchange" || n === "keyup" || n === "keydown")
      return za(Ps);
  }
  function Kd(n, a) {
    if (n === "click")
      return za(a);
  }
  function ef(n, a) {
    if (n === "input" || n === "change")
      return za(a);
  }
  var tf = { eventTypes: Jd, _isInputEventSupported: Do, extractEvents: function(n, a, u, f) {
    var v = a ? Hi(a) : window, S = v.nodeName && v.nodeName.toLowerCase();
    if (S === "select" || S === "input" && v.type === "file")
      var T = Il;
    else if (Xd(v))
      if (Do)
        T = ef;
      else {
        T = Rl;
        var R = qd;
      }
    else
      (S = v.nodeName) && S.toLowerCase() === "input" && (v.type === "checkbox" || v.type === "radio") && (T = Kd);
    if (T && (T = T(n, a)))
      return Vn(T, u, f);
    R && R(n, v, a), n === "blur" && (n = v._wrapperState) && n.controlled && v.type === "number" && Mi(v, "number", v.value);
  } }, zs = hi.extend({ view: null, detail: null }), kp = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
  function Dl(n) {
    var a = this.nativeEvent;
    return a.getModifierState ? a.getModifierState(n) : (n = kp[n]) ? !!a[n] : !1;
  }
  function Os() {
    return Dl;
  }
  var nf = 0, Nl = 0, rf = !1, tc = !1, Ls = zs.extend({ screenX: null, screenY: null, clientX: null, clientY: null, pageX: null, pageY: null, ctrlKey: null, shiftKey: null, altKey: null, metaKey: null, getModifierState: Os, button: null, buttons: null, relatedTarget: function(n) {
    return n.relatedTarget || (n.fromElement === n.srcElement ? n.toElement : n.fromElement);
  }, movementX: function(n) {
    if ("movementX" in n)
      return n.movementX;
    var a = nf;
    return nf = n.screenX, rf ? n.type === "mousemove" ? n.screenX - a : 0 : (rf = !0, 0);
  }, movementY: function(n) {
    if ("movementY" in n)
      return n.movementY;
    var a = Nl;
    return Nl = n.screenY, tc ? n.type === "mousemove" ? n.screenY - a : 0 : (tc = !0, 0);
  } }), nc = Ls.extend({ pointerId: null, width: null, height: null, pressure: null, tangentialPressure: null, tiltX: null, tiltY: null, twist: null, pointerType: null, isPrimary: null }), Bs = { mouseEnter: { registrationName: "onMouseEnter", dependencies: ["mouseout", "mouseover"] }, mouseLeave: { registrationName: "onMouseLeave", dependencies: ["mouseout", "mouseover"] }, pointerEnter: { registrationName: "onPointerEnter", dependencies: ["pointerout", "pointerover"] }, pointerLeave: {
    registrationName: "onPointerLeave",
    dependencies: ["pointerout", "pointerover"]
  } }, af = { eventTypes: Bs, extractEvents: function(n, a, u, f, v) {
    var S = n === "mouseover" || n === "pointerover", T = n === "mouseout" || n === "pointerout";
    if (S && (v & 32) === 0 && (u.relatedTarget || u.fromElement) || !T && !S)
      return null;
    if (S = f.window === f ? f : (S = f.ownerDocument) ? S.defaultView || S.parentWindow : window, T) {
      if (T = a, a = (a = u.relatedTarget || u.toElement) ? Ao(a) : null, a !== null) {
        var R = fn(a);
        (a !== R || a.tag !== 5 && a.tag !== 6) && (a = null);
      }
    } else
      T = null;
    if (T === a)
      return null;
    if (n === "mouseout" || n === "mouseover")
      var W = Ls, U = Bs.mouseLeave, Me = Bs.mouseEnter, De = "mouse";
    else
      (n === "pointerout" || n === "pointerover") && (W = nc, U = Bs.pointerLeave, Me = Bs.pointerEnter, De = "pointer");
    if (n = T == null ? S : Hi(T), S = a == null ? S : Hi(a), U = W.getPooled(U, T, u, f), U.type = De + "leave", U.target = n, U.relatedTarget = S, u = W.getPooled(Me, a, u, f), u.type = De + "enter", u.target = S, u.relatedTarget = n, f = T, De = a, f && De)
      e: {
        for (W = f, Me = De, T = 0, n = W; n; n = Pr(n))
          T++;
        for (n = 0, a = Me; a; a = Pr(a))
          n++;
        for (; 0 < T - n; )
          W = Pr(W), T--;
        for (; 0 < n - T; )
          Me = Pr(Me), n--;
        for (; T--; ) {
          if (W === Me || W === Me.alternate)
            break e;
          W = Pr(W), Me = Pr(Me);
        }
        W = null;
      }
    else
      W = null;
    for (Me = W, W = []; f && f !== Me && (T = f.alternate, !(T !== null && T === Me)); )
      W.push(f), f = Pr(f);
    for (f = []; De && De !== Me && (T = De.alternate, !(T !== null && T === Me)); )
      f.push(De), De = Pr(De);
    for (De = 0; De < W.length; De++)
      Yu(W[De], "bubbled", U);
    for (De = f.length; 0 < De--; )
      Yu(f[De], "captured", u);
    return (v & 64) === 0 ? [U] : [U, u];
  } };
  function sf(n, a) {
    return n === a && (n !== 0 || 1 / n === 1 / a) || n !== n && a !== a;
  }
  var Ii = typeof Object.is == "function" ? Object.is : sf, Wi = Object.prototype.hasOwnProperty;
  function sa(n, a) {
    if (Ii(n, a))
      return !0;
    if (typeof n != "object" || n === null || typeof a != "object" || a === null)
      return !1;
    var u = Object.keys(n), f = Object.keys(a);
    if (u.length !== f.length)
      return !1;
    for (f = 0; f < u.length; f++)
      if (!Wi.call(a, u[f]) || !Ii(n[u[f]], a[u[f]]))
        return !1;
    return !0;
  }
  var kl = Y && "documentMode" in document && 11 >= document.documentMode, zr = { select: { phasedRegistrationNames: { bubbled: "onSelect", captured: "onSelectCapture" }, dependencies: "blur contextmenu dragend focus keydown keyup mousedown mouseup selectionchange".split(" ") } }, Hn = null, Fi = null, si = null, Oa = !1;
  function ic(n, a) {
    var u = a.window === a ? a.document : a.nodeType === 9 ? a : a.ownerDocument;
    return Oa || Hn == null || Hn !== Hu(u) ? null : (u = Hn, "selectionStart" in u && Wu(u) ? u = { start: u.selectionStart, end: u.selectionEnd } : (u = (u.ownerDocument && u.ownerDocument.defaultView || window).getSelection(), u = { anchorNode: u.anchorNode, anchorOffset: u.anchorOffset, focusNode: u.focusNode, focusOffset: u.focusOffset }), si && sa(si, u) ? null : (si = u, n = hi.getPooled(zr.select, Fi, n, a), n.type = "select", n.target = Hn, Ns(n), n));
  }
  var of = { eventTypes: zr, extractEvents: function(n, a, u, f, v, S) {
    if (v = S || (f.window === f ? f.document : f.nodeType === 9 ? f : f.ownerDocument), !(S = !v)) {
      e: {
        v = Yt(v), S = Fe.onSelect;
        for (var T = 0; T < S.length; T++)
          if (!v.has(S[T])) {
            v = !1;
            break e;
          }
        v = !0;
      }
      S = !v;
    }
    if (S)
      return null;
    switch (v = a ? Hi(a) : window, n) {
      case "focus":
        (Xd(v) || v.contentEditable === "true") && (Hn = v, Fi = a, si = null);
        break;
      case "blur":
        si = Fi = Hn = null;
        break;
      case "mousedown":
        Oa = !0;
        break;
      case "contextmenu":
      case "mouseup":
      case "dragend":
        return Oa = !1, ic(u, f);
      case "selectionchange":
        if (kl)
          break;
      case "keydown":
      case "keyup":
        return ic(u, f);
    }
    return null;
  } }, lf = hi.extend({ animationName: null, elapsedTime: null, pseudoElement: null }), rc = hi.extend({ clipboardData: function(n) {
    return "clipboardData" in n ? n.clipboardData : window.clipboardData;
  } }), oa = zs.extend({ relatedTarget: null });
  function _l(n) {
    var a = n.keyCode;
    return "charCode" in n ? (n = n.charCode, n === 0 && a === 13 && (n = 13)) : n = a, n === 10 && (n = 13), 32 <= n || n === 13 ? n : 0;
  }
  var La = { Esc: "Escape", Spacebar: " ", Left: "ArrowLeft", Up: "ArrowUp", Right: "ArrowRight", Down: "ArrowDown", Del: "Delete", Win: "OS", Menu: "ContextMenu", Apps: "ContextMenu", Scroll: "ScrollLock", MozPrintableKey: "Unidentified" }, la = {
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
  }, Pl = zs.extend({ key: function(n) {
    if (n.key) {
      var a = La[n.key] || n.key;
      if (a !== "Unidentified")
        return a;
    }
    return n.type === "keypress" ? (n = _l(n), n === 13 ? "Enter" : String.fromCharCode(n)) : n.type === "keydown" || n.type === "keyup" ? la[n.keyCode] || "Unidentified" : "";
  }, location: null, ctrlKey: null, shiftKey: null, altKey: null, metaKey: null, repeat: null, locale: null, getModifierState: Os, charCode: function(n) {
    return n.type === "keypress" ? _l(n) : 0;
  }, keyCode: function(n) {
    return n.type === "keydown" || n.type === "keyup" ? n.keyCode : 0;
  }, which: function(n) {
    return n.type === "keypress" ? _l(n) : n.type === "keydown" || n.type === "keyup" ? n.keyCode : 0;
  } }), zl = Ls.extend({ dataTransfer: null }), uf = zs.extend({ touches: null, targetTouches: null, changedTouches: null, altKey: null, metaKey: null, ctrlKey: null, shiftKey: null, getModifierState: Os }), cf = hi.extend({ propertyName: null, elapsedTime: null, pseudoElement: null }), df = Ls.extend({ deltaX: function(n) {
    return "deltaX" in n ? n.deltaX : "wheelDeltaX" in n ? -n.wheelDeltaX : 0;
  }, deltaY: function(n) {
    return "deltaY" in n ? n.deltaY : "wheelDeltaY" in n ? -n.wheelDeltaY : "wheelDelta" in n ? -n.wheelDelta : 0;
  }, deltaZ: null, deltaMode: null }), ff = { eventTypes: zd, extractEvents: function(n, a, u, f) {
    var v = yp.get(n);
    if (!v)
      return null;
    switch (n) {
      case "keypress":
        if (_l(u) === 0)
          return null;
      case "keydown":
      case "keyup":
        n = Pl;
        break;
      case "blur":
      case "focus":
        n = oa;
        break;
      case "click":
        if (u.button === 2)
          return null;
      case "auxclick":
      case "dblclick":
      case "mousedown":
      case "mousemove":
      case "mouseup":
      case "mouseout":
      case "mouseover":
      case "contextmenu":
        n = Ls;
        break;
      case "drag":
      case "dragend":
      case "dragenter":
      case "dragexit":
      case "dragleave":
      case "dragover":
      case "dragstart":
      case "drop":
        n = zl;
        break;
      case "touchcancel":
      case "touchend":
      case "touchmove":
      case "touchstart":
        n = uf;
        break;
      case Es:
      case ne:
      case de:
        n = lf;
        break;
      case Je:
        n = cf;
        break;
      case "scroll":
        n = zs;
        break;
      case "wheel":
        n = df;
        break;
      case "copy":
      case "cut":
      case "paste":
        n = rc;
        break;
      case "gotpointercapture":
      case "lostpointercapture":
      case "pointercancel":
      case "pointerdown":
      case "pointermove":
      case "pointerout":
      case "pointerover":
      case "pointerup":
        n = nc;
        break;
      default:
        n = hi;
    }
    return a = n.getPooled(v, a, u, f), Ns(a), a;
  } };
  if (G)
    throw Error(c(101));
  G = Array.prototype.slice.call("ResponderEventPlugin SimpleEventPlugin EnterLeaveEventPlugin ChangeEventPlugin SelectEventPlugin BeforeInputEventPlugin".split(" ")), se();
  var hf = Sl;
  z = xl, $ = hf, V = Hi, Pe({ SimpleEventPlugin: ff, EnterLeaveEventPlugin: af, ChangeEventPlugin: tf, SelectEventPlugin: of, BeforeInputEventPlugin: Gd });
  var ac = [], Ai = -1;
  function St(n) {
    0 > Ai || (n.current = ac[Ai], ac[Ai] = null, Ai--);
  }
  function sn(n, a) {
    Ai++, ac[Ai] = n.current, n.current = a;
  }
  var Or = {}, Pn = { current: Or }, En = { current: !1 }, Lr = Or;
  function Ba(n, a) {
    var u = n.type.contextTypes;
    if (!u)
      return Or;
    var f = n.stateNode;
    if (f && f.__reactInternalMemoizedUnmaskedChildContext === a)
      return f.__reactInternalMemoizedMaskedChildContext;
    var v = {}, S;
    for (S in u)
      v[S] = a[S];
    return f && (n = n.stateNode, n.__reactInternalMemoizedUnmaskedChildContext = a, n.__reactInternalMemoizedMaskedChildContext = v), v;
  }
  function Qn(n) {
    return n = n.childContextTypes, n != null;
  }
  function ja() {
    St(En), St(Pn);
  }
  function sc(n, a, u) {
    if (Pn.current !== Or)
      throw Error(c(168));
    sn(Pn, a), sn(En, u);
  }
  function js(n, a, u) {
    var f = n.stateNode;
    if (n = a.childContextTypes, typeof f.getChildContext != "function")
      return u;
    f = f.getChildContext();
    for (var v in f)
      if (!(v in n))
        throw Error(c(108, fi(a) || "Unknown", v));
    return i({}, u, {}, f);
  }
  function No(n) {
    return n = (n = n.stateNode) && n.__reactInternalMemoizedMergedChildContext || Or, Lr = Pn.current, sn(Pn, n), sn(En, En.current), !0;
  }
  function Ol(n, a, u) {
    var f = n.stateNode;
    if (!f)
      throw Error(c(169));
    u ? (n = js(n, a, Lr), f.__reactInternalMemoizedMergedChildContext = n, St(En), St(Pn), sn(Pn, n)) : St(En), sn(En, u);
  }
  var pf = o.unstable_runWithPriority, ko = o.unstable_scheduleCallback, oc = o.unstable_cancelCallback, lc = o.unstable_requestPaint, uc = o.unstable_now, mf = o.unstable_getCurrentPriorityLevel, Ll = o.unstable_ImmediatePriority, cc = o.unstable_UserBlockingPriority, dc = o.unstable_NormalPriority, vf = o.unstable_LowPriority, _o = o.unstable_IdlePriority, gf = {}, Cg = o.unstable_shouldYield, _p = lc !== void 0 ? lc : function() {
  }, or = null, ua = null, yf = !1, Pp = uc(), _t = 1e4 > Pp ? uc : function() {
    return uc() - Pp;
  };
  function lr() {
    switch (mf()) {
      case Ll:
        return 99;
      case cc:
        return 98;
      case dc:
        return 97;
      case vf:
        return 96;
      case _o:
        return 95;
      default:
        throw Error(c(332));
    }
  }
  function Cn(n) {
    switch (n) {
      case 99:
        return Ll;
      case 98:
        return cc;
      case 97:
        return dc;
      case 96:
        return vf;
      case 95:
        return _o;
      default:
        throw Error(c(332));
    }
  }
  function xt(n, a) {
    return n = Cn(n), pf(n, a);
  }
  function zp(n, a, u) {
    return n = Cn(n), ko(n, a, u);
  }
  function Us(n) {
    return or === null ? (or = [n], ua = ko(Ll, wf)) : or.push(n), gf;
  }
  function Ri() {
    if (ua !== null) {
      var n = ua;
      ua = null, oc(n);
    }
    wf();
  }
  function wf() {
    if (!yf && or !== null) {
      yf = !0;
      var n = 0;
      try {
        var a = or;
        xt(99, function() {
          for (; n < a.length; n++) {
            var u = a[n];
            do
              u = u(!0);
            while (u !== null);
          }
        }), or = null;
      } catch (u) {
        throw or !== null && (or = or.slice(n + 1)), ko(Ll, Ri), u;
      } finally {
        yf = !1;
      }
    }
  }
  function Ut(n, a, u) {
    return u /= 10, 1073741821 - (((1073741821 - n + a / 10) / u | 0) + 1) * u;
  }
  function pi(n, a) {
    if (n && n.defaultProps) {
      a = i({}, a), n = n.defaultProps;
      for (var u in n)
        a[u] === void 0 && (a[u] = n[u]);
    }
    return a;
  }
  var Ua = { current: null }, Va = null, $i = null, fc = null;
  function bf() {
    fc = $i = Va = null;
  }
  function Sf(n) {
    var a = Ua.current;
    St(Ua), n.type._context._currentValue = a;
  }
  function Po(n, a) {
    for (; n !== null; ) {
      var u = n.alternate;
      if (n.childExpirationTime < a)
        n.childExpirationTime = a, u !== null && u.childExpirationTime < a && (u.childExpirationTime = a);
      else if (u !== null && u.childExpirationTime < a)
        u.childExpirationTime = a;
      else
        break;
      n = n.return;
    }
  }
  function mi(n, a) {
    Va = n, fc = $i = null, n = n.dependencies, n !== null && n.firstContext !== null && (n.expirationTime >= a && (cr = !0), n.firstContext = null);
  }
  function Qi(n, a) {
    if (fc !== n && a !== !1 && a !== 0)
      if ((typeof a != "number" || a === 1073741823) && (fc = n, a = 1073741823), a = { context: n, observedBits: a, next: null }, $i === null) {
        if (Va === null)
          throw Error(c(308));
        $i = a, Va.dependencies = { expirationTime: 0, firstContext: a, responders: null };
      } else
        $i = $i.next = a;
    return n._currentValue;
  }
  var vi = !1;
  function hc(n) {
    n.updateQueue = { baseState: n.memoizedState, baseQueue: null, shared: { pending: null }, effects: null };
  }
  function pc(n, a) {
    n = n.updateQueue, a.updateQueue === n && (a.updateQueue = { baseState: n.baseState, baseQueue: n.baseQueue, shared: n.shared, effects: n.effects });
  }
  function Ha(n, a) {
    return n = { expirationTime: n, suspenseConfig: a, tag: 0, payload: null, callback: null, next: null }, n.next = n;
  }
  function Wa(n, a) {
    if (n = n.updateQueue, n !== null) {
      n = n.shared;
      var u = n.pending;
      u === null ? a.next = a : (a.next = u.next, u.next = a), n.pending = a;
    }
  }
  function xf(n, a) {
    var u = n.alternate;
    u !== null && pc(u, n), n = n.updateQueue, u = n.baseQueue, u === null ? (n.baseQueue = a.next = a, a.next = a) : (a.next = u.next, u.next = a);
  }
  function zo(n, a, u, f) {
    var v = n.updateQueue;
    vi = !1;
    var S = v.baseQueue, T = v.shared.pending;
    if (T !== null) {
      if (S !== null) {
        var R = S.next;
        S.next = T.next, T.next = R;
      }
      S = T, v.shared.pending = null, R = n.alternate, R !== null && (R = R.updateQueue, R !== null && (R.baseQueue = T));
    }
    if (S !== null) {
      R = S.next;
      var W = v.baseState, U = 0, Me = null, De = null, mt = null;
      if (R !== null) {
        var Et = R;
        do {
          if (T = Et.expirationTime, T < f) {
            var Pi = { expirationTime: Et.expirationTime, suspenseConfig: Et.suspenseConfig, tag: Et.tag, payload: Et.payload, callback: Et.callback, next: null };
            mt === null ? (De = mt = Pi, Me = W) : mt = mt.next = Pi, T > U && (U = T);
          } else {
            mt !== null && (mt = mt.next = { expirationTime: 1073741823, suspenseConfig: Et.suspenseConfig, tag: Et.tag, payload: Et.payload, callback: Et.callback, next: null }), Ff(T, Et.suspenseConfig);
            e: {
              var Fn = n, O = Et;
              switch (T = a, Pi = u, O.tag) {
                case 1:
                  if (Fn = O.payload, typeof Fn == "function") {
                    W = Fn.call(Pi, W, T);
                    break e;
                  }
                  W = Fn;
                  break e;
                case 3:
                  Fn.effectTag = Fn.effectTag & -4097 | 64;
                case 0:
                  if (Fn = O.payload, T = typeof Fn == "function" ? Fn.call(Pi, W, T) : Fn, T == null)
                    break e;
                  W = i({}, W, T);
                  break e;
                case 2:
                  vi = !0;
              }
            }
            Et.callback !== null && (n.effectTag |= 32, T = v.effects, T === null ? v.effects = [Et] : T.push(Et));
          }
          if (Et = Et.next, Et === null || Et === R) {
            if (T = v.shared.pending, T === null)
              break;
            Et = S.next = T.next, T.next = R, v.baseQueue = S = T, v.shared.pending = null;
          }
        } while (1);
      }
      mt === null ? Me = W : mt.next = De, v.baseState = Me, v.baseQueue = mt, ql(U), n.expirationTime = U, n.memoizedState = W;
    }
  }
  function Cf(n, a, u) {
    if (n = a.effects, a.effects = null, n !== null)
      for (a = 0; a < n.length; a++) {
        var f = n[a], v = f.callback;
        if (v !== null) {
          if (f.callback = null, f = v, v = u, typeof f != "function")
            throw Error(c(191, f));
          f.call(v);
        }
      }
  }
  var Bl = Zt.ReactCurrentBatchConfig, Vs = new r.Component().refs;
  function Oo(n, a, u, f) {
    a = n.memoizedState, u = u(f, a), u = u == null ? a : i({}, a, u), n.memoizedState = u, n.expirationTime === 0 && (n.updateQueue.baseState = u);
  }
  var Fa = { isMounted: function(n) {
    return (n = n._reactInternalFiber) ? fn(n) === n : !1;
  }, enqueueSetState: function(n, a, u) {
    n = n._reactInternalFiber;
    var f = Ln(), v = Bl.suspense;
    f = Ja(f, n, v), v = Ha(f, v), v.payload = a, u != null && (v.callback = u), Wa(n, v), qa(n, f);
  }, enqueueReplaceState: function(n, a, u) {
    n = n._reactInternalFiber;
    var f = Ln(), v = Bl.suspense;
    f = Ja(f, n, v), v = Ha(f, v), v.tag = 1, v.payload = a, u != null && (v.callback = u), Wa(n, v), qa(n, f);
  }, enqueueForceUpdate: function(n, a) {
    n = n._reactInternalFiber;
    var u = Ln(), f = Bl.suspense;
    u = Ja(u, n, f), f = Ha(u, f), f.tag = 2, a != null && (f.callback = a), Wa(n, f), qa(n, u);
  } };
  function Op(n, a, u, f, v, S, T) {
    return n = n.stateNode, typeof n.shouldComponentUpdate == "function" ? n.shouldComponentUpdate(f, S, T) : a.prototype && a.prototype.isPureReactComponent ? !sa(u, f) || !sa(v, S) : !0;
  }
  function Lp(n, a, u) {
    var f = !1, v = Or, S = a.contextType;
    return typeof S == "object" && S !== null ? S = Qi(S) : (v = Qn(a) ? Lr : Pn.current, f = a.contextTypes, S = (f = f != null) ? Ba(n, v) : Or), a = new a(u, S), n.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = Fa, n.stateNode = a, a._reactInternalFiber = n, f && (n = n.stateNode, n.__reactInternalMemoizedUnmaskedChildContext = v, n.__reactInternalMemoizedMaskedChildContext = S), a;
  }
  function mc(n, a, u, f) {
    n = a.state, typeof a.componentWillReceiveProps == "function" && a.componentWillReceiveProps(u, f), typeof a.UNSAFE_componentWillReceiveProps == "function" && a.UNSAFE_componentWillReceiveProps(u, f), a.state !== n && Fa.enqueueReplaceState(a, a.state, null);
  }
  function jl(n, a, u, f) {
    var v = n.stateNode;
    v.props = u, v.state = n.memoizedState, v.refs = Vs, hc(n);
    var S = a.contextType;
    typeof S == "object" && S !== null ? v.context = Qi(S) : (S = Qn(a) ? Lr : Pn.current, v.context = Ba(n, S)), zo(n, u, v, f), v.state = n.memoizedState, S = a.getDerivedStateFromProps, typeof S == "function" && (Oo(n, a, S, u), v.state = n.memoizedState), typeof a.getDerivedStateFromProps == "function" || typeof v.getSnapshotBeforeUpdate == "function" || typeof v.UNSAFE_componentWillMount != "function" && typeof v.componentWillMount != "function" || (a = v.state, typeof v.componentWillMount == "function" && v.componentWillMount(), typeof v.UNSAFE_componentWillMount == "function" && v.UNSAFE_componentWillMount(), a !== v.state && Fa.enqueueReplaceState(v, v.state, null), zo(n, u, v, f), v.state = n.memoizedState), typeof v.componentDidMount == "function" && (n.effectTag |= 4);
  }
  var Ul = Array.isArray;
  function Vl(n, a, u) {
    if (n = u.ref, n !== null && typeof n != "function" && typeof n != "object") {
      if (u._owner) {
        if (u = u._owner, u) {
          if (u.tag !== 1)
            throw Error(c(309));
          var f = u.stateNode;
        }
        if (!f)
          throw Error(c(147, n));
        var v = "" + n;
        return a !== null && a.ref !== null && typeof a.ref == "function" && a.ref._stringRef === v ? a.ref : (a = function(S) {
          var T = f.refs;
          T === Vs && (T = f.refs = {}), S === null ? delete T[v] : T[v] = S;
        }, a._stringRef = v, a);
      }
      if (typeof n != "string")
        throw Error(c(284));
      if (!u._owner)
        throw Error(c(290, n));
    }
    return n;
  }
  function Hs(n, a) {
    if (n.type !== "textarea")
      throw Error(c(31, Object.prototype.toString.call(a) === "[object Object]" ? "object with keys {" + Object.keys(a).join(", ") + "}" : a, ""));
  }
  function Bp(n) {
    function a(O, P) {
      if (n) {
        var Q = O.lastEffect;
        Q !== null ? (Q.nextEffect = P, O.lastEffect = P) : O.firstEffect = O.lastEffect = P, P.nextEffect = null, P.effectTag = 8;
      }
    }
    function u(O, P) {
      if (!n)
        return null;
      for (; P !== null; )
        a(O, P), P = P.sibling;
      return null;
    }
    function f(O, P) {
      for (O = /* @__PURE__ */ new Map(); P !== null; )
        P.key !== null ? O.set(P.key, P) : O.set(P.index, P), P = P.sibling;
      return O;
    }
    function v(O, P) {
      return O = hr(O, P), O.index = 0, O.sibling = null, O;
    }
    function S(O, P, Q) {
      return O.index = Q, n ? (Q = O.alternate, Q !== null ? (Q = Q.index, Q < P ? (O.effectTag = 2, P) : Q) : (O.effectTag = 2, P)) : P;
    }
    function T(O) {
      return n && O.alternate === null && (O.effectTag = 2), O;
    }
    function R(O, P, Q, le) {
      return P === null || P.tag !== 6 ? (P = Zf(Q, O.mode, le), P.return = O, P) : (P = v(P, Q), P.return = O, P);
    }
    function W(O, P, Q, le) {
      return P !== null && P.elementType === Q.type ? (le = v(P, Q.props), le.ref = Vl(O, P, Q), le.return = O, le) : (le = Hc(Q.type, Q.key, Q.props, null, O.mode, le), le.ref = Vl(O, P, Q), le.return = O, le);
    }
    function U(O, P, Q, le) {
      return P === null || P.tag !== 4 || P.stateNode.containerInfo !== Q.containerInfo || P.stateNode.implementation !== Q.implementation ? (P = Yf(Q, O.mode, le), P.return = O, P) : (P = v(P, Q.children || []), P.return = O, P);
    }
    function Me(O, P, Q, le, ye) {
      return P === null || P.tag !== 7 ? (P = fa(Q, O.mode, le, ye), P.return = O, P) : (P = v(P, Q), P.return = O, P);
    }
    function De(O, P, Q) {
      if (typeof P == "string" || typeof P == "number")
        return P = Zf("" + P, O.mode, Q), P.return = O, P;
      if (typeof P == "object" && P !== null) {
        switch (P.$$typeof) {
          case Ui:
            return Q = Hc(P.type, P.key, P.props, null, O.mode, Q), Q.ref = Vl(O, null, P), Q.return = O, Q;
          case Ci:
            return P = Yf(P, O.mode, Q), P.return = O, P;
        }
        if (Ul(P) || di(P))
          return P = fa(P, O.mode, Q, null), P.return = O, P;
        Hs(O, P);
      }
      return null;
    }
    function mt(O, P, Q, le) {
      var ye = P !== null ? P.key : null;
      if (typeof Q == "string" || typeof Q == "number")
        return ye !== null ? null : R(O, P, "" + Q, le);
      if (typeof Q == "object" && Q !== null) {
        switch (Q.$$typeof) {
          case Ui:
            return Q.key === ye ? Q.type === Jn ? Me(O, P, Q.props.children, le, ye) : W(O, P, Q, le) : null;
          case Ci:
            return Q.key === ye ? U(O, P, Q, le) : null;
        }
        if (Ul(Q) || di(Q))
          return ye !== null ? null : Me(O, P, Q, le, null);
        Hs(O, Q);
      }
      return null;
    }
    function Et(O, P, Q, le, ye) {
      if (typeof le == "string" || typeof le == "number")
        return O = O.get(Q) || null, R(P, O, "" + le, ye);
      if (typeof le == "object" && le !== null) {
        switch (le.$$typeof) {
          case Ui:
            return O = O.get(le.key === null ? Q : le.key) || null, le.type === Jn ? Me(P, O, le.props.children, ye, le.key) : W(P, O, le, ye);
          case Ci:
            return O = O.get(le.key === null ? Q : le.key) || null, U(P, O, le, ye);
        }
        if (Ul(le) || di(le))
          return O = O.get(Q) || null, Me(P, O, le, ye, null);
        Hs(P, le);
      }
      return null;
    }
    function Pi(O, P, Q, le) {
      for (var ye = null, _e = null, qe = P, bt = P = 0, un = null; qe !== null && bt < Q.length; bt++) {
        qe.index > bt ? (un = qe, qe = null) : un = qe.sibling;
        var lt = mt(O, qe, Q[bt], le);
        if (lt === null) {
          qe === null && (qe = un);
          break;
        }
        n && qe && lt.alternate === null && a(O, qe), P = S(lt, P, bt), _e === null ? ye = lt : _e.sibling = lt, _e = lt, qe = un;
      }
      if (bt === Q.length)
        return u(O, qe), ye;
      if (qe === null) {
        for (; bt < Q.length; bt++)
          qe = De(O, Q[bt], le), qe !== null && (P = S(qe, P, bt), _e === null ? ye = qe : _e.sibling = qe, _e = qe);
        return ye;
      }
      for (qe = f(O, qe); bt < Q.length; bt++)
        un = Et(qe, O, bt, Q[bt], le), un !== null && (n && un.alternate !== null && qe.delete(un.key === null ? bt : un.key), P = S(un, P, bt), _e === null ? ye = un : _e.sibling = un, _e = un);
      return n && qe.forEach(function(ns) {
        return a(O, ns);
      }), ye;
    }
    function Fn(O, P, Q, le) {
      var ye = di(Q);
      if (typeof ye != "function")
        throw Error(c(150));
      if (Q = ye.call(Q), Q == null)
        throw Error(c(151));
      for (var _e = ye = null, qe = P, bt = P = 0, un = null, lt = Q.next(); qe !== null && !lt.done; bt++, lt = Q.next()) {
        qe.index > bt ? (un = qe, qe = null) : un = qe.sibling;
        var ns = mt(O, qe, lt.value, le);
        if (ns === null) {
          qe === null && (qe = un);
          break;
        }
        n && qe && ns.alternate === null && a(O, qe), P = S(ns, P, bt), _e === null ? ye = ns : _e.sibling = ns, _e = ns, qe = un;
      }
      if (lt.done)
        return u(O, qe), ye;
      if (qe === null) {
        for (; !lt.done; bt++, lt = Q.next())
          lt = De(O, lt.value, le), lt !== null && (P = S(lt, P, bt), _e === null ? ye = lt : _e.sibling = lt, _e = lt);
        return ye;
      }
      for (qe = f(O, qe); !lt.done; bt++, lt = Q.next())
        lt = Et(qe, O, bt, lt.value, le), lt !== null && (n && lt.alternate !== null && qe.delete(lt.key === null ? bt : lt.key), P = S(lt, P, bt), _e === null ? ye = lt : _e.sibling = lt, _e = lt);
      return n && qe.forEach(function(Ug) {
        return a(O, Ug);
      }), ye;
    }
    return function(O, P, Q, le) {
      var ye = typeof Q == "object" && Q !== null && Q.type === Jn && Q.key === null;
      ye && (Q = Q.props.children);
      var _e = typeof Q == "object" && Q !== null;
      if (_e)
        switch (Q.$$typeof) {
          case Ui:
            e: {
              for (_e = Q.key, ye = P; ye !== null; ) {
                if (ye.key === _e) {
                  switch (ye.tag) {
                    case 7:
                      if (Q.type === Jn) {
                        u(O, ye.sibling), P = v(ye, Q.props.children), P.return = O, O = P;
                        break e;
                      }
                      break;
                    default:
                      if (ye.elementType === Q.type) {
                        u(
                          O,
                          ye.sibling
                        ), P = v(ye, Q.props), P.ref = Vl(O, ye, Q), P.return = O, O = P;
                        break e;
                      }
                  }
                  u(O, ye);
                  break;
                } else
                  a(O, ye);
                ye = ye.sibling;
              }
              Q.type === Jn ? (P = fa(Q.props.children, O.mode, le, Q.key), P.return = O, O = P) : (le = Hc(Q.type, Q.key, Q.props, null, O.mode, le), le.ref = Vl(O, P, Q), le.return = O, O = le);
            }
            return T(O);
          case Ci:
            e: {
              for (ye = Q.key; P !== null; ) {
                if (P.key === ye)
                  if (P.tag === 4 && P.stateNode.containerInfo === Q.containerInfo && P.stateNode.implementation === Q.implementation) {
                    u(O, P.sibling), P = v(P, Q.children || []), P.return = O, O = P;
                    break e;
                  } else {
                    u(O, P);
                    break;
                  }
                else
                  a(O, P);
                P = P.sibling;
              }
              P = Yf(Q, O.mode, le), P.return = O, O = P;
            }
            return T(O);
        }
      if (typeof Q == "string" || typeof Q == "number")
        return Q = "" + Q, P !== null && P.tag === 6 ? (u(O, P.sibling), P = v(P, Q), P.return = O, O = P) : (u(O, P), P = Zf(Q, O.mode, le), P.return = O, O = P), T(O);
      if (Ul(Q))
        return Pi(O, P, Q, le);
      if (di(Q))
        return Fn(O, P, Q, le);
      if (_e && Hs(O, Q), typeof Q > "u" && !ye)
        switch (O.tag) {
          case 1:
          case 0:
            throw O = O.type, Error(c(152, O.displayName || O.name || "Component"));
        }
      return u(O, P);
    };
  }
  var Lo = Bp(!0), Tf = Bp(!1), Hl = {}, Br = { current: Hl }, Wl = { current: Hl }, Bo = { current: Hl };
  function Ws(n) {
    if (n === Hl)
      throw Error(c(174));
    return n;
  }
  function vc(n, a) {
    switch (sn(Bo, a), sn(Wl, n), sn(Br, Hl), n = a.nodeType, n) {
      case 9:
      case 11:
        a = (a = a.documentElement) ? a.namespaceURI : _n(null, "");
        break;
      default:
        n = n === 8 ? a.parentNode : a, a = n.namespaceURI || null, n = n.tagName, a = _n(a, n);
    }
    St(Br), sn(Br, a);
  }
  function jo() {
    St(Br), St(Wl), St(Bo);
  }
  function Mf(n) {
    Ws(Bo.current);
    var a = Ws(Br.current), u = _n(a, n.type);
    a !== u && (sn(Wl, n), sn(Br, u));
  }
  function Ef(n) {
    Wl.current === n && (St(Br), St(Wl));
  }
  var Kt = { current: 0 };
  function gc(n) {
    for (var a = n; a !== null; ) {
      if (a.tag === 13) {
        var u = a.memoizedState;
        if (u !== null && (u = u.dehydrated, u === null || u.data === $u || u.data === wl))
          return a;
      } else if (a.tag === 19 && a.memoizedProps.revealOrder !== void 0) {
        if ((a.effectTag & 64) !== 0)
          return a;
      } else if (a.child !== null) {
        a.child.return = a, a = a.child;
        continue;
      }
      if (a === n)
        break;
      for (; a.sibling === null; ) {
        if (a.return === null || a.return === n)
          return null;
        a = a.return;
      }
      a.sibling.return = a.return, a = a.sibling;
    }
    return null;
  }
  function yc(n, a) {
    return { responder: n, props: a };
  }
  var wc = Zt.ReactCurrentDispatcher, gi = Zt.ReactCurrentBatchConfig, Zn = 0, $t = null, on = null, ln = null, $a = !1;
  function Wn() {
    throw Error(c(321));
  }
  function Fs(n, a) {
    if (a === null)
      return !1;
    for (var u = 0; u < a.length && u < n.length; u++)
      if (!Ii(n[u], a[u]))
        return !1;
    return !0;
  }
  function If(n, a, u, f, v, S) {
    if (Zn = S, $t = a, a.memoizedState = null, a.updateQueue = null, a.expirationTime = 0, wc.current = n === null || n.memoizedState === null ? Tg : Mg, n = u(f, v), a.expirationTime === Zn) {
      S = 0;
      do {
        if (a.expirationTime = 0, !(25 > S))
          throw Error(c(301));
        S += 1, ln = on = null, a.updateQueue = null, wc.current = Eg, n = u(f, v);
      } while (a.expirationTime === Zn);
    }
    if (wc.current = Ic, a = on !== null && on.next !== null, Zn = 0, ln = on = $t = null, $a = !1, a)
      throw Error(c(300));
    return n;
  }
  function $s() {
    var n = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
    return ln === null ? $t.memoizedState = ln = n : ln = ln.next = n, ln;
  }
  function Uo() {
    if (on === null) {
      var n = $t.alternate;
      n = n !== null ? n.memoizedState : null;
    } else
      n = on.next;
    var a = ln === null ? $t.memoizedState : ln.next;
    if (a !== null)
      ln = a, on = n;
    else {
      if (n === null)
        throw Error(c(310));
      on = n, n = { memoizedState: on.memoizedState, baseState: on.baseState, baseQueue: on.baseQueue, queue: on.queue, next: null }, ln === null ? $t.memoizedState = ln = n : ln = ln.next = n;
    }
    return ln;
  }
  function Qa(n, a) {
    return typeof a == "function" ? a(n) : a;
  }
  function Fl(n) {
    var a = Uo(), u = a.queue;
    if (u === null)
      throw Error(c(311));
    u.lastRenderedReducer = n;
    var f = on, v = f.baseQueue, S = u.pending;
    if (S !== null) {
      if (v !== null) {
        var T = v.next;
        v.next = S.next, S.next = T;
      }
      f.baseQueue = v = S, u.pending = null;
    }
    if (v !== null) {
      v = v.next, f = f.baseState;
      var R = T = S = null, W = v;
      do {
        var U = W.expirationTime;
        if (U < Zn) {
          var Me = { expirationTime: W.expirationTime, suspenseConfig: W.suspenseConfig, action: W.action, eagerReducer: W.eagerReducer, eagerState: W.eagerState, next: null };
          R === null ? (T = R = Me, S = f) : R = R.next = Me, U > $t.expirationTime && ($t.expirationTime = U, ql(U));
        } else
          R !== null && (R = R.next = { expirationTime: 1073741823, suspenseConfig: W.suspenseConfig, action: W.action, eagerReducer: W.eagerReducer, eagerState: W.eagerState, next: null }), Ff(U, W.suspenseConfig), f = W.eagerReducer === n ? W.eagerState : n(f, W.action);
        W = W.next;
      } while (W !== null && W !== v);
      R === null ? S = f : R.next = T, Ii(f, a.memoizedState) || (cr = !0), a.memoizedState = f, a.baseState = S, a.baseQueue = R, u.lastRenderedState = f;
    }
    return [a.memoizedState, u.dispatch];
  }
  function bc(n) {
    var a = Uo(), u = a.queue;
    if (u === null)
      throw Error(c(311));
    u.lastRenderedReducer = n;
    var f = u.dispatch, v = u.pending, S = a.memoizedState;
    if (v !== null) {
      u.pending = null;
      var T = v = v.next;
      do
        S = n(S, T.action), T = T.next;
      while (T !== v);
      Ii(S, a.memoizedState) || (cr = !0), a.memoizedState = S, a.baseQueue === null && (a.baseState = S), u.lastRenderedState = S;
    }
    return [S, f];
  }
  function Sc(n) {
    var a = $s();
    return typeof n == "function" && (n = n()), a.memoizedState = a.baseState = n, n = a.queue = { pending: null, dispatch: null, lastRenderedReducer: Qa, lastRenderedState: n }, n = n.dispatch = Ec.bind(null, $t, n), [a.memoizedState, n];
  }
  function xc(n, a, u, f) {
    return n = { tag: n, create: a, destroy: u, deps: f, next: null }, a = $t.updateQueue, a === null ? (a = { lastEffect: null }, $t.updateQueue = a, a.lastEffect = n.next = n) : (u = a.lastEffect, u === null ? a.lastEffect = n.next = n : (f = u.next, u.next = n, n.next = f, a.lastEffect = n)), n;
  }
  function Af() {
    return Uo().memoizedState;
  }
  function Qs(n, a, u, f) {
    var v = $s();
    $t.effectTag |= n, v.memoizedState = xc(1 | a, u, void 0, f === void 0 ? null : f);
  }
  function Rf(n, a, u, f) {
    var v = Uo();
    f = f === void 0 ? null : f;
    var S = void 0;
    if (on !== null) {
      var T = on.memoizedState;
      if (S = T.destroy, f !== null && Fs(f, T.deps)) {
        xc(a, u, S, f);
        return;
      }
    }
    $t.effectTag |= n, v.memoizedState = xc(1 | a, u, S, f);
  }
  function jp(n, a) {
    return Qs(516, 4, n, a);
  }
  function Zs(n, a) {
    return Rf(516, 4, n, a);
  }
  function Df(n, a) {
    return Rf(4, 2, n, a);
  }
  function Up(n, a) {
    if (typeof a == "function")
      return n = n(), a(n), function() {
        a(null);
      };
    if (a != null)
      return n = n(), a.current = n, function() {
        a.current = null;
      };
  }
  function Vo(n, a, u) {
    return u = u != null ? u.concat([n]) : null, Rf(4, 2, Up.bind(null, a, n), u);
  }
  function Cc() {
  }
  function Vp(n, a) {
    return $s().memoizedState = [n, a === void 0 ? null : a], n;
  }
  function Tc(n, a) {
    var u = Uo();
    a = a === void 0 ? null : a;
    var f = u.memoizedState;
    return f !== null && a !== null && Fs(a, f[1]) ? f[0] : (u.memoizedState = [n, a], n);
  }
  function Nf(n, a) {
    var u = Uo();
    a = a === void 0 ? null : a;
    var f = u.memoizedState;
    return f !== null && a !== null && Fs(a, f[1]) ? f[0] : (n = n(), u.memoizedState = [n, a], n);
  }
  function Mc(n, a, u) {
    var f = lr();
    xt(98 > f ? 98 : f, function() {
      n(!0);
    }), xt(97 < f ? 97 : f, function() {
      var v = gi.suspense;
      gi.suspense = a === void 0 ? null : a;
      try {
        n(!1), u();
      } finally {
        gi.suspense = v;
      }
    });
  }
  function Ec(n, a, u) {
    var f = Ln(), v = Bl.suspense;
    f = Ja(f, n, v), v = { expirationTime: f, suspenseConfig: v, action: u, eagerReducer: null, eagerState: null, next: null };
    var S = a.pending;
    if (S === null ? v.next = v : (v.next = S.next, S.next = v), a.pending = v, S = n.alternate, n === $t || S !== null && S === $t)
      $a = !0, v.expirationTime = Zn, $t.expirationTime = Zn;
    else {
      if (n.expirationTime === 0 && (S === null || S.expirationTime === 0) && (S = a.lastRenderedReducer, S !== null))
        try {
          var T = a.lastRenderedState, R = S(T, u);
          if (v.eagerReducer = S, v.eagerState = R, Ii(R, T))
            return;
        } catch {
        } finally {
        }
      qa(
        n,
        f
      );
    }
  }
  var Ic = { readContext: Qi, useCallback: Wn, useContext: Wn, useEffect: Wn, useImperativeHandle: Wn, useLayoutEffect: Wn, useMemo: Wn, useReducer: Wn, useRef: Wn, useState: Wn, useDebugValue: Wn, useResponder: Wn, useDeferredValue: Wn, useTransition: Wn }, Tg = { readContext: Qi, useCallback: Vp, useContext: Qi, useEffect: jp, useImperativeHandle: function(n, a, u) {
    return u = u != null ? u.concat([n]) : null, Qs(4, 2, Up.bind(null, a, n), u);
  }, useLayoutEffect: function(n, a) {
    return Qs(4, 2, n, a);
  }, useMemo: function(n, a) {
    var u = $s();
    return a = a === void 0 ? null : a, n = n(), u.memoizedState = [
      n,
      a
    ], n;
  }, useReducer: function(n, a, u) {
    var f = $s();
    return a = u !== void 0 ? u(a) : a, f.memoizedState = f.baseState = a, n = f.queue = { pending: null, dispatch: null, lastRenderedReducer: n, lastRenderedState: a }, n = n.dispatch = Ec.bind(null, $t, n), [f.memoizedState, n];
  }, useRef: function(n) {
    var a = $s();
    return n = { current: n }, a.memoizedState = n;
  }, useState: Sc, useDebugValue: Cc, useResponder: yc, useDeferredValue: function(n, a) {
    var u = Sc(n), f = u[0], v = u[1];
    return jp(function() {
      var S = gi.suspense;
      gi.suspense = a === void 0 ? null : a;
      try {
        v(n);
      } finally {
        gi.suspense = S;
      }
    }, [n, a]), f;
  }, useTransition: function(n) {
    var a = Sc(!1), u = a[0];
    return a = a[1], [Vp(Mc.bind(null, a, n), [a, n]), u];
  } }, Mg = { readContext: Qi, useCallback: Tc, useContext: Qi, useEffect: Zs, useImperativeHandle: Vo, useLayoutEffect: Df, useMemo: Nf, useReducer: Fl, useRef: Af, useState: function() {
    return Fl(Qa);
  }, useDebugValue: Cc, useResponder: yc, useDeferredValue: function(n, a) {
    var u = Fl(Qa), f = u[0], v = u[1];
    return Zs(function() {
      var S = gi.suspense;
      gi.suspense = a === void 0 ? null : a;
      try {
        v(n);
      } finally {
        gi.suspense = S;
      }
    }, [n, a]), f;
  }, useTransition: function(n) {
    var a = Fl(Qa), u = a[0];
    return a = a[1], [Tc(Mc.bind(null, a, n), [a, n]), u];
  } }, Eg = { readContext: Qi, useCallback: Tc, useContext: Qi, useEffect: Zs, useImperativeHandle: Vo, useLayoutEffect: Df, useMemo: Nf, useReducer: bc, useRef: Af, useState: function() {
    return bc(Qa);
  }, useDebugValue: Cc, useResponder: yc, useDeferredValue: function(n, a) {
    var u = bc(Qa), f = u[0], v = u[1];
    return Zs(function() {
      var S = gi.suspense;
      gi.suspense = a === void 0 ? null : a;
      try {
        v(n);
      } finally {
        gi.suspense = S;
      }
    }, [n, a]), f;
  }, useTransition: function(n) {
    var a = bc(Qa), u = a[0];
    return a = a[1], [Tc(Mc.bind(
      null,
      a,
      n
    ), [a, n]), u];
  } }, ur = null, Za = null, Ys = !1;
  function Hp(n, a) {
    var u = Vr(5, null, null, 0);
    u.elementType = "DELETED", u.type = "DELETED", u.stateNode = a, u.return = n, u.effectTag = 8, n.lastEffect !== null ? (n.lastEffect.nextEffect = u, n.lastEffect = u) : n.firstEffect = n.lastEffect = u;
  }
  function Wp(n, a) {
    switch (n.tag) {
      case 5:
        var u = n.type;
        return a = a.nodeType !== 1 || u.toLowerCase() !== a.nodeName.toLowerCase() ? null : a, a !== null ? (n.stateNode = a, !0) : !1;
      case 6:
        return a = n.pendingProps === "" || a.nodeType !== 3 ? null : a, a !== null ? (n.stateNode = a, !0) : !1;
      case 13:
        return !1;
      default:
        return !1;
    }
  }
  function $l(n) {
    if (Ys) {
      var a = Za;
      if (a) {
        var u = a;
        if (!Wp(n, a)) {
          if (a = Mo(u.nextSibling), !a || !Wp(n, a)) {
            n.effectTag = n.effectTag & -1025 | 2, Ys = !1, ur = n;
            return;
          }
          Hp(ur, u);
        }
        ur = n, Za = Mo(a.firstChild);
      } else
        n.effectTag = n.effectTag & -1025 | 2, Ys = !1, ur = n;
    }
  }
  function kf(n) {
    for (n = n.return; n !== null && n.tag !== 5 && n.tag !== 3 && n.tag !== 13; )
      n = n.return;
    ur = n;
  }
  function Ac(n) {
    if (n !== ur)
      return !1;
    if (!Ys)
      return kf(n), Ys = !0, !1;
    var a = n.type;
    if (n.tag !== 5 || a !== "head" && a !== "body" && !bl(a, n.memoizedProps))
      for (a = Za; a; )
        Hp(n, a), a = Mo(a.nextSibling);
    if (kf(n), n.tag === 13) {
      if (n = n.memoizedState, n = n !== null ? n.dehydrated : null, !n)
        throw Error(c(317));
      e: {
        for (n = n.nextSibling, a = 0; n; ) {
          if (n.nodeType === 8) {
            var u = n.data;
            if (u === Hd) {
              if (a === 0) {
                Za = Mo(n.nextSibling);
                break e;
              }
              a--;
            } else
              u !== Fu && u !== wl && u !== $u || a++;
          }
          n = n.nextSibling;
        }
        Za = null;
      }
    } else
      Za = ur ? Mo(n.stateNode.nextSibling) : null;
    return !0;
  }
  function Gt() {
    Za = ur = null, Ys = !1;
  }
  var Rc = Zt.ReactCurrentOwner, cr = !1;
  function Di(n, a, u, f) {
    a.child = n === null ? Tf(a, null, u, f) : Lo(a, n.child, u, f);
  }
  function Fp(n, a, u, f, v) {
    u = u.render;
    var S = a.ref;
    return mi(a, v), f = If(n, a, u, f, S, v), n !== null && !cr ? (a.updateQueue = n.updateQueue, a.effectTag &= -517, n.expirationTime <= v && (n.expirationTime = 0), ca(n, a, v)) : (a.effectTag |= 1, Di(n, a, f, v), a.child);
  }
  function Ql(n, a, u, f, v, S) {
    if (n === null) {
      var T = u.type;
      return typeof T == "function" && !Qf(T) && T.defaultProps === void 0 && u.compare === null && u.defaultProps === void 0 ? (a.tag = 15, a.type = T, Dc(n, a, T, f, v, S)) : (n = Hc(u.type, null, f, null, a.mode, S), n.ref = a.ref, n.return = a, a.child = n);
    }
    return T = n.child, v < S && (v = T.memoizedProps, u = u.compare, u = u !== null ? u : sa, u(v, f) && n.ref === a.ref) ? ca(n, a, S) : (a.effectTag |= 1, n = hr(T, f), n.ref = a.ref, n.return = a, a.child = n);
  }
  function Dc(n, a, u, f, v, S) {
    return n !== null && sa(n.memoizedProps, f) && n.ref === a.ref && (cr = !1, v < S) ? (a.expirationTime = n.expirationTime, ca(n, a, S)) : Gs(n, a, u, f, S);
  }
  function $p(n, a) {
    var u = a.ref;
    (n === null && u !== null || n !== null && n.ref !== u) && (a.effectTag |= 128);
  }
  function Gs(n, a, u, f, v) {
    var S = Qn(u) ? Lr : Pn.current;
    return S = Ba(a, S), mi(a, v), u = If(n, a, u, f, S, v), n !== null && !cr ? (a.updateQueue = n.updateQueue, a.effectTag &= -517, n.expirationTime <= v && (n.expirationTime = 0), ca(n, a, v)) : (a.effectTag |= 1, Di(n, a, u, v), a.child);
  }
  function Qp(n, a, u, f, v) {
    if (Qn(u)) {
      var S = !0;
      No(a);
    } else
      S = !1;
    if (mi(a, v), a.stateNode === null)
      n !== null && (n.alternate = null, a.alternate = null, a.effectTag |= 2), Lp(a, u, f), jl(a, u, f, v), f = !0;
    else if (n === null) {
      var T = a.stateNode, R = a.memoizedProps;
      T.props = R;
      var W = T.context, U = u.contextType;
      typeof U == "object" && U !== null ? U = Qi(U) : (U = Qn(u) ? Lr : Pn.current, U = Ba(a, U));
      var Me = u.getDerivedStateFromProps, De = typeof Me == "function" || typeof T.getSnapshotBeforeUpdate == "function";
      De || typeof T.UNSAFE_componentWillReceiveProps != "function" && typeof T.componentWillReceiveProps != "function" || (R !== f || W !== U) && mc(a, T, f, U), vi = !1;
      var mt = a.memoizedState;
      T.state = mt, zo(a, f, T, v), W = a.memoizedState, R !== f || mt !== W || En.current || vi ? (typeof Me == "function" && (Oo(a, u, Me, f), W = a.memoizedState), (R = vi || Op(a, u, R, f, mt, W, U)) ? (De || typeof T.UNSAFE_componentWillMount != "function" && typeof T.componentWillMount != "function" || (typeof T.componentWillMount == "function" && T.componentWillMount(), typeof T.UNSAFE_componentWillMount == "function" && T.UNSAFE_componentWillMount()), typeof T.componentDidMount == "function" && (a.effectTag |= 4)) : (typeof T.componentDidMount == "function" && (a.effectTag |= 4), a.memoizedProps = f, a.memoizedState = W), T.props = f, T.state = W, T.context = U, f = R) : (typeof T.componentDidMount == "function" && (a.effectTag |= 4), f = !1);
    } else
      T = a.stateNode, pc(n, a), R = a.memoizedProps, T.props = a.type === a.elementType ? R : pi(a.type, R), W = T.context, U = u.contextType, typeof U == "object" && U !== null ? U = Qi(U) : (U = Qn(u) ? Lr : Pn.current, U = Ba(a, U)), Me = u.getDerivedStateFromProps, (De = typeof Me == "function" || typeof T.getSnapshotBeforeUpdate == "function") || typeof T.UNSAFE_componentWillReceiveProps != "function" && typeof T.componentWillReceiveProps != "function" || (R !== f || W !== U) && mc(a, T, f, U), vi = !1, W = a.memoizedState, T.state = W, zo(a, f, T, v), mt = a.memoizedState, R !== f || W !== mt || En.current || vi ? (typeof Me == "function" && (Oo(a, u, Me, f), mt = a.memoizedState), (Me = vi || Op(a, u, R, f, W, mt, U)) ? (De || typeof T.UNSAFE_componentWillUpdate != "function" && typeof T.componentWillUpdate != "function" || (typeof T.componentWillUpdate == "function" && T.componentWillUpdate(
        f,
        mt,
        U
      ), typeof T.UNSAFE_componentWillUpdate == "function" && T.UNSAFE_componentWillUpdate(f, mt, U)), typeof T.componentDidUpdate == "function" && (a.effectTag |= 4), typeof T.getSnapshotBeforeUpdate == "function" && (a.effectTag |= 256)) : (typeof T.componentDidUpdate != "function" || R === n.memoizedProps && W === n.memoizedState || (a.effectTag |= 4), typeof T.getSnapshotBeforeUpdate != "function" || R === n.memoizedProps && W === n.memoizedState || (a.effectTag |= 256), a.memoizedProps = f, a.memoizedState = mt), T.props = f, T.state = mt, T.context = U, f = Me) : (typeof T.componentDidUpdate != "function" || R === n.memoizedProps && W === n.memoizedState || (a.effectTag |= 4), typeof T.getSnapshotBeforeUpdate != "function" || R === n.memoizedProps && W === n.memoizedState || (a.effectTag |= 256), f = !1);
    return _f(n, a, u, f, S, v);
  }
  function _f(n, a, u, f, v, S) {
    $p(n, a);
    var T = (a.effectTag & 64) !== 0;
    if (!f && !T)
      return v && Ol(a, u, !1), ca(n, a, S);
    f = a.stateNode, Rc.current = a;
    var R = T && typeof u.getDerivedStateFromError != "function" ? null : f.render();
    return a.effectTag |= 1, n !== null && T ? (a.child = Lo(a, n.child, null, S), a.child = Lo(a, null, R, S)) : Di(n, a, R, S), a.memoizedState = f.state, v && Ol(a, u, !0), a.child;
  }
  function Nc(n) {
    var a = n.stateNode;
    a.pendingContext ? sc(n, a.pendingContext, a.pendingContext !== a.context) : a.context && sc(n, a.context, !1), vc(n, a.containerInfo);
  }
  var Pf = { dehydrated: null, retryTime: 0 };
  function Zp(n, a, u) {
    var f = a.mode, v = a.pendingProps, S = Kt.current, T = !1, R;
    if ((R = (a.effectTag & 64) !== 0) || (R = (S & 2) !== 0 && (n === null || n.memoizedState !== null)), R ? (T = !0, a.effectTag &= -65) : n !== null && n.memoizedState === null || v.fallback === void 0 || v.unstable_avoidThisFallback === !0 || (S |= 1), sn(Kt, S & 1), n === null) {
      if (v.fallback !== void 0 && $l(a), T) {
        if (T = v.fallback, v = fa(null, f, 0, null), v.return = a, (a.mode & 2) === 0)
          for (n = a.memoizedState !== null ? a.child.child : a.child, v.child = n; n !== null; )
            n.return = v, n = n.sibling;
        return u = fa(T, f, u, null), u.return = a, v.sibling = u, a.memoizedState = Pf, a.child = v, u;
      }
      return f = v.children, a.memoizedState = null, a.child = Tf(a, null, f, u);
    }
    if (n.memoizedState !== null) {
      if (n = n.child, f = n.sibling, T) {
        if (v = v.fallback, u = hr(n, n.pendingProps), u.return = a, (a.mode & 2) === 0 && (T = a.memoizedState !== null ? a.child.child : a.child, T !== n.child))
          for (u.child = T; T !== null; )
            T.return = u, T = T.sibling;
        return f = hr(f, v), f.return = a, u.sibling = f, u.childExpirationTime = 0, a.memoizedState = Pf, a.child = u, f;
      }
      return u = Lo(a, n.child, v.children, u), a.memoizedState = null, a.child = u;
    }
    if (n = n.child, T) {
      if (T = v.fallback, v = fa(null, f, 0, null), v.return = a, v.child = n, n !== null && (n.return = v), (a.mode & 2) === 0)
        for (n = a.memoizedState !== null ? a.child.child : a.child, v.child = n; n !== null; )
          n.return = v, n = n.sibling;
      return u = fa(T, f, u, null), u.return = a, v.sibling = u, u.effectTag |= 2, v.childExpirationTime = 0, a.memoizedState = Pf, a.child = v, u;
    }
    return a.memoizedState = null, a.child = Lo(a, n, v.children, u);
  }
  function Yp(n, a) {
    n.expirationTime < a && (n.expirationTime = a);
    var u = n.alternate;
    u !== null && u.expirationTime < a && (u.expirationTime = a), Po(n.return, a);
  }
  function kc(n, a, u, f, v, S) {
    var T = n.memoizedState;
    T === null ? n.memoizedState = { isBackwards: a, rendering: null, renderingStartTime: 0, last: f, tail: u, tailExpiration: 0, tailMode: v, lastEffect: S } : (T.isBackwards = a, T.rendering = null, T.renderingStartTime = 0, T.last = f, T.tail = u, T.tailExpiration = 0, T.tailMode = v, T.lastEffect = S);
  }
  function Gp(n, a, u) {
    var f = a.pendingProps, v = f.revealOrder, S = f.tail;
    if (Di(n, a, f.children, u), f = Kt.current, (f & 2) !== 0)
      f = f & 1 | 2, a.effectTag |= 64;
    else {
      if (n !== null && (n.effectTag & 64) !== 0)
        e:
          for (n = a.child; n !== null; ) {
            if (n.tag === 13)
              n.memoizedState !== null && Yp(n, u);
            else if (n.tag === 19)
              Yp(n, u);
            else if (n.child !== null) {
              n.child.return = n, n = n.child;
              continue;
            }
            if (n === a)
              break e;
            for (; n.sibling === null; ) {
              if (n.return === null || n.return === a)
                break e;
              n = n.return;
            }
            n.sibling.return = n.return, n = n.sibling;
          }
      f &= 1;
    }
    if (sn(Kt, f), (a.mode & 2) === 0)
      a.memoizedState = null;
    else
      switch (v) {
        case "forwards":
          for (u = a.child, v = null; u !== null; )
            n = u.alternate, n !== null && gc(n) === null && (v = u), u = u.sibling;
          u = v, u === null ? (v = a.child, a.child = null) : (v = u.sibling, u.sibling = null), kc(a, !1, v, u, S, a.lastEffect);
          break;
        case "backwards":
          for (u = null, v = a.child, a.child = null; v !== null; ) {
            if (n = v.alternate, n !== null && gc(n) === null) {
              a.child = v;
              break;
            }
            n = v.sibling, v.sibling = u, u = v, v = n;
          }
          kc(a, !0, u, null, S, a.lastEffect);
          break;
        case "together":
          kc(a, !1, null, null, void 0, a.lastEffect);
          break;
        default:
          a.memoizedState = null;
      }
    return a.child;
  }
  function ca(n, a, u) {
    n !== null && (a.dependencies = n.dependencies);
    var f = a.expirationTime;
    if (f !== 0 && ql(f), a.childExpirationTime < u)
      return null;
    if (n !== null && a.child !== n.child)
      throw Error(c(153));
    if (a.child !== null) {
      for (n = a.child, u = hr(n, n.pendingProps), a.child = u, u.return = a; n.sibling !== null; )
        n = n.sibling, u = u.sibling = hr(n, n.pendingProps), u.return = a;
      u.sibling = null;
    }
    return a.child;
  }
  var Xp, _c, Xs, Pc;
  Xp = function(n, a) {
    for (var u = a.child; u !== null; ) {
      if (u.tag === 5 || u.tag === 6)
        n.appendChild(u.stateNode);
      else if (u.tag !== 4 && u.child !== null) {
        u.child.return = u, u = u.child;
        continue;
      }
      if (u === a)
        break;
      for (; u.sibling === null; ) {
        if (u.return === null || u.return === a)
          return;
        u = u.return;
      }
      u.sibling.return = u.return, u = u.sibling;
    }
  }, _c = function() {
  }, Xs = function(n, a, u, f, v) {
    var S = n.memoizedProps;
    if (S !== f) {
      var T = a.stateNode;
      switch (Ws(Br.current), n = null, u) {
        case "input":
          S = vn(T, S), f = vn(T, f), n = [];
          break;
        case "option":
          S = Ei(T, S), f = Ei(T, f), n = [];
          break;
        case "select":
          S = i({}, S, { value: void 0 }), f = i({}, f, { value: void 0 }), n = [];
          break;
        case "textarea":
          S = Jr(T, S), f = Jr(T, f), n = [];
          break;
        default:
          typeof S.onClick != "function" && typeof f.onClick == "function" && (T.onclick = Ds);
      }
      Vu(u, f);
      var R, W;
      u = null;
      for (R in S)
        if (!f.hasOwnProperty(R) && S.hasOwnProperty(R) && S[R] != null)
          if (R === "style")
            for (W in T = S[R], T)
              T.hasOwnProperty(W) && (u || (u = {}), u[W] = "");
          else
            R !== "dangerouslySetInnerHTML" && R !== "children" && R !== "suppressContentEditableWarning" && R !== "suppressHydrationWarning" && R !== "autoFocus" && (Ne.hasOwnProperty(R) ? n || (n = []) : (n = n || []).push(R, null));
      for (R in f) {
        var U = f[R];
        if (T = S != null ? S[R] : void 0, f.hasOwnProperty(R) && U !== T && (U != null || T != null))
          if (R === "style")
            if (T) {
              for (W in T)
                !T.hasOwnProperty(W) || U && U.hasOwnProperty(W) || (u || (u = {}), u[W] = "");
              for (W in U)
                U.hasOwnProperty(W) && T[W] !== U[W] && (u || (u = {}), u[W] = U[W]);
            } else
              u || (n || (n = []), n.push(R, u)), u = U;
          else
            R === "dangerouslySetInnerHTML" ? (U = U ? U.__html : void 0, T = T ? T.__html : void 0, U != null && T !== U && (n = n || []).push(R, U)) : R === "children" ? T === U || typeof U != "string" && typeof U != "number" || (n = n || []).push(R, "" + U) : R !== "suppressContentEditableWarning" && R !== "suppressHydrationWarning" && (Ne.hasOwnProperty(R) ? (U != null && ia(v, R), n || T === U || (n = [])) : (n = n || []).push(R, U));
      }
      u && (n = n || []).push("style", u), v = n, (a.updateQueue = v) && (a.effectTag |= 4);
    }
  }, Pc = function(n, a, u, f) {
    u !== f && (a.effectTag |= 4);
  };
  function Zl(n, a) {
    switch (n.tailMode) {
      case "hidden":
        a = n.tail;
        for (var u = null; a !== null; )
          a.alternate !== null && (u = a), a = a.sibling;
        u === null ? n.tail = null : u.sibling = null;
        break;
      case "collapsed":
        u = n.tail;
        for (var f = null; u !== null; )
          u.alternate !== null && (f = u), u = u.sibling;
        f === null ? a || n.tail === null ? n.tail = null : n.tail.sibling = null : f.sibling = null;
    }
  }
  function Jp(n, a, u) {
    var f = a.pendingProps;
    switch (a.tag) {
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
        return Qn(a.type) && ja(), null;
      case 3:
        return jo(), St(En), St(Pn), u = a.stateNode, u.pendingContext && (u.context = u.pendingContext, u.pendingContext = null), n !== null && n.child !== null || !Ac(a) || (a.effectTag |= 4), _c(a), null;
      case 5:
        Ef(a), u = Ws(Bo.current);
        var v = a.type;
        if (n !== null && a.stateNode != null)
          Xs(n, a, v, f, u), n.ref !== a.ref && (a.effectTag |= 128);
        else {
          if (!f) {
            if (a.stateNode === null)
              throw Error(c(166));
            return null;
          }
          if (n = Ws(Br.current), Ac(a)) {
            f = a.stateNode, v = a.type;
            var S = a.memoizedProps;
            switch (f[_r] = a, f[Eo] = S, v) {
              case "iframe":
              case "object":
              case "embed":
                ft("load", f);
                break;
              case "video":
              case "audio":
                for (n = 0; n < pt.length; n++)
                  ft(pt[n], f);
                break;
              case "source":
                ft("error", f);
                break;
              case "img":
              case "image":
              case "link":
                ft("error", f), ft("load", f);
                break;
              case "form":
                ft("reset", f), ft("submit", f);
                break;
              case "details":
                ft("toggle", f);
                break;
              case "input":
                qn(f, S), ft("invalid", f), ia(u, "onChange");
                break;
              case "select":
                f._wrapperState = { wasMultiple: !!S.multiple }, ft("invalid", f), ia(u, "onChange");
                break;
              case "textarea":
                Aa(f, S), ft("invalid", f), ia(u, "onChange");
            }
            Vu(v, S), n = null;
            for (var T in S)
              if (S.hasOwnProperty(T)) {
                var R = S[T];
                T === "children" ? typeof R == "string" ? f.textContent !== R && (n = ["children", R]) : typeof R == "number" && f.textContent !== "" + R && (n = ["children", "" + R]) : Ne.hasOwnProperty(T) && R != null && ia(u, T);
              }
            switch (v) {
              case "input":
                Er(f), rn(f, S, !0);
                break;
              case "textarea":
                Er(f), wo(f);
                break;
              case "select":
              case "option":
                break;
              default:
                typeof S.onClick == "function" && (f.onclick = Ds);
            }
            u = n, a.updateQueue = u, u !== null && (a.effectTag |= 4);
          } else {
            switch (T = u.nodeType === 9 ? u : u.ownerDocument, n === Cp && (n = Ra(v)), n === Cp ? v === "script" ? (n = T.createElement("div"), n.innerHTML = "<script><\/script>", n = n.removeChild(n.firstChild)) : typeof f.is == "string" ? n = T.createElement(v, { is: f.is }) : (n = T.createElement(v), v === "select" && (T = n, f.multiple ? T.multiple = !0 : f.size && (T.size = f.size))) : n = T.createElementNS(n, v), n[_r] = a, n[Eo] = f, Xp(n, a, !1, !1), a.stateNode = n, T = Ld(v, f), v) {
              case "iframe":
              case "object":
              case "embed":
                ft(
                  "load",
                  n
                ), R = f;
                break;
              case "video":
              case "audio":
                for (R = 0; R < pt.length; R++)
                  ft(pt[R], n);
                R = f;
                break;
              case "source":
                ft("error", n), R = f;
                break;
              case "img":
              case "image":
              case "link":
                ft("error", n), ft("load", n), R = f;
                break;
              case "form":
                ft("reset", n), ft("submit", n), R = f;
                break;
              case "details":
                ft("toggle", n), R = f;
                break;
              case "input":
                qn(n, f), R = vn(n, f), ft("invalid", n), ia(u, "onChange");
                break;
              case "option":
                R = Ei(n, f);
                break;
              case "select":
                n._wrapperState = { wasMultiple: !!f.multiple }, R = i({}, f, { value: void 0 }), ft("invalid", n), ia(u, "onChange");
                break;
              case "textarea":
                Aa(
                  n,
                  f
                ), R = Jr(n, f), ft("invalid", n), ia(u, "onChange");
                break;
              default:
                R = f;
            }
            Vu(v, R);
            var W = R;
            for (S in W)
              if (W.hasOwnProperty(S)) {
                var U = W[S];
                S === "style" ? Sp(n, U) : S === "dangerouslySetInnerHTML" ? (U = U ? U.__html : void 0, U != null && qr(n, U)) : S === "children" ? typeof U == "string" ? (v !== "textarea" || U !== "") && ei(n, U) : typeof U == "number" && ei(n, "" + U) : S !== "suppressContentEditableWarning" && S !== "suppressHydrationWarning" && S !== "autoFocus" && (Ne.hasOwnProperty(S) ? U != null && ia(u, S) : U != null && Mt(n, S, U, T));
              }
            switch (v) {
              case "input":
                Er(n), rn(n, f, !1);
                break;
              case "textarea":
                Er(n), wo(n);
                break;
              case "option":
                f.value != null && n.setAttribute("value", "" + Ti(f.value));
                break;
              case "select":
                n.multiple = !!f.multiple, u = f.value, u != null ? Kn(n, !!f.multiple, u, !1) : f.defaultValue != null && Kn(n, !!f.multiple, f.defaultValue, !0);
                break;
              default:
                typeof R.onClick == "function" && (n.onclick = Ds);
            }
            Tp(v, f) && (a.effectTag |= 4);
          }
          a.ref !== null && (a.effectTag |= 128);
        }
        return null;
      case 6:
        if (n && a.stateNode != null)
          Pc(n, a, n.memoizedProps, f);
        else {
          if (typeof f != "string" && a.stateNode === null)
            throw Error(c(166));
          u = Ws(Bo.current), Ws(Br.current), Ac(a) ? (u = a.stateNode, f = a.memoizedProps, u[_r] = a, u.nodeValue !== f && (a.effectTag |= 4)) : (u = (u.nodeType === 9 ? u : u.ownerDocument).createTextNode(f), u[_r] = a, a.stateNode = u);
        }
        return null;
      case 13:
        return St(Kt), f = a.memoizedState, (a.effectTag & 64) !== 0 ? (a.expirationTime = u, a) : (u = f !== null, f = !1, n === null ? a.memoizedProps.fallback !== void 0 && Ac(a) : (v = n.memoizedState, f = v !== null, u || v === null || (v = n.child.sibling, v !== null && (S = a.firstEffect, S !== null ? (a.firstEffect = v, v.nextEffect = S) : (a.firstEffect = a.lastEffect = v, v.nextEffect = null), v.effectTag = 8))), u && !f && (a.mode & 2) !== 0 && (n === null && a.memoizedProps.unstable_avoidThisFallback !== !0 || (Kt.current & 1) !== 0 ? pn === Ya && (pn = Xl) : ((pn === Ya || pn === Xl) && (pn = Lc), dr !== 0 && Ni !== null && (io(Ni, Vt), Gf(Ni, dr)))), (u || f) && (a.effectTag |= 4), null);
      case 4:
        return jo(), _c(a), null;
      case 10:
        return Sf(a), null;
      case 17:
        return Qn(a.type) && ja(), null;
      case 19:
        if (St(Kt), f = a.memoizedState, f === null)
          return null;
        if (v = (a.effectTag & 64) !== 0, S = f.rendering, S === null) {
          if (v)
            Zl(f, !1);
          else if (pn !== Ya || n !== null && (n.effectTag & 64) !== 0)
            for (S = a.child; S !== null; ) {
              if (n = gc(S), n !== null) {
                for (a.effectTag |= 64, Zl(f, !1), v = n.updateQueue, v !== null && (a.updateQueue = v, a.effectTag |= 4), f.lastEffect === null && (a.firstEffect = null), a.lastEffect = f.lastEffect, f = a.child; f !== null; )
                  v = f, S = u, v.effectTag &= 2, v.nextEffect = null, v.firstEffect = null, v.lastEffect = null, n = v.alternate, n === null ? (v.childExpirationTime = 0, v.expirationTime = S, v.child = null, v.memoizedProps = null, v.memoizedState = null, v.updateQueue = null, v.dependencies = null) : (v.childExpirationTime = n.childExpirationTime, v.expirationTime = n.expirationTime, v.child = n.child, v.memoizedProps = n.memoizedProps, v.memoizedState = n.memoizedState, v.updateQueue = n.updateQueue, S = n.dependencies, v.dependencies = S === null ? null : { expirationTime: S.expirationTime, firstContext: S.firstContext, responders: S.responders }), f = f.sibling;
                return sn(Kt, Kt.current & 1 | 2), a.child;
              }
              S = S.sibling;
            }
        } else {
          if (!v)
            if (n = gc(S), n !== null) {
              if (a.effectTag |= 64, v = !0, u = n.updateQueue, u !== null && (a.updateQueue = u, a.effectTag |= 4), Zl(f, !0), f.tail === null && f.tailMode === "hidden" && !S.alternate)
                return a = a.lastEffect = f.lastEffect, a !== null && (a.nextEffect = null), null;
            } else
              2 * _t() - f.renderingStartTime > f.tailExpiration && 1 < u && (a.effectTag |= 64, v = !0, Zl(f, !1), a.expirationTime = a.childExpirationTime = u - 1);
          f.isBackwards ? (S.sibling = a.child, a.child = S) : (u = f.last, u !== null ? u.sibling = S : a.child = S, f.last = S);
        }
        return f.tail !== null ? (f.tailExpiration === 0 && (f.tailExpiration = _t() + 500), u = f.tail, f.rendering = u, f.tail = u.sibling, f.lastEffect = a.lastEffect, f.renderingStartTime = _t(), u.sibling = null, a = Kt.current, sn(Kt, v ? a & 1 | 2 : a & 1), u) : null;
    }
    throw Error(c(
      156,
      a.tag
    ));
  }
  function Ig(n) {
    switch (n.tag) {
      case 1:
        Qn(n.type) && ja();
        var a = n.effectTag;
        return a & 4096 ? (n.effectTag = a & -4097 | 64, n) : null;
      case 3:
        if (jo(), St(En), St(Pn), a = n.effectTag, (a & 64) !== 0)
          throw Error(c(285));
        return n.effectTag = a & -4097 | 64, n;
      case 5:
        return Ef(n), null;
      case 13:
        return St(Kt), a = n.effectTag, a & 4096 ? (n.effectTag = a & -4097 | 64, n) : null;
      case 19:
        return St(Kt), null;
      case 4:
        return jo(), null;
      case 10:
        return Sf(n), null;
      default:
        return null;
    }
  }
  function zf(n, a) {
    return { value: n, source: a, stack: Ea(a) };
  }
  var Ag = typeof WeakSet == "function" ? WeakSet : Set;
  function Of(n, a) {
    var u = a.source, f = a.stack;
    f === null && u !== null && (f = Ea(u)), u !== null && fi(u.type), a = a.value, n !== null && n.tag === 1 && fi(n.type);
    try {
      console.error(a);
    } catch (v) {
      setTimeout(function() {
        throw v;
      });
    }
  }
  function Rg(n, a) {
    try {
      a.props = n.memoizedProps, a.state = n.memoizedState, a.componentWillUnmount();
    } catch (u) {
      es(n, u);
    }
  }
  function qp(n) {
    var a = n.ref;
    if (a !== null)
      if (typeof a == "function")
        try {
          a(null);
        } catch (u) {
          es(n, u);
        }
      else
        a.current = null;
  }
  function Dg(n, a) {
    switch (a.tag) {
      case 0:
      case 11:
      case 15:
      case 22:
        return;
      case 1:
        if (a.effectTag & 256 && n !== null) {
          var u = n.memoizedProps, f = n.memoizedState;
          n = a.stateNode, a = n.getSnapshotBeforeUpdate(a.elementType === a.type ? u : pi(a.type, u), f), n.__reactInternalSnapshotBeforeUpdate = a;
        }
        return;
      case 3:
      case 5:
      case 6:
      case 4:
      case 17:
        return;
    }
    throw Error(c(163));
  }
  function Kp(n, a) {
    if (a = a.updateQueue, a = a !== null ? a.lastEffect : null, a !== null) {
      var u = a = a.next;
      do {
        if ((u.tag & n) === n) {
          var f = u.destroy;
          u.destroy = void 0, f !== void 0 && f();
        }
        u = u.next;
      } while (u !== a);
    }
  }
  function Lf(n, a) {
    if (a = a.updateQueue, a = a !== null ? a.lastEffect : null, a !== null) {
      var u = a = a.next;
      do {
        if ((u.tag & n) === n) {
          var f = u.create;
          u.destroy = f();
        }
        u = u.next;
      } while (u !== a);
    }
  }
  function Ng(n, a, u) {
    switch (u.tag) {
      case 0:
      case 11:
      case 15:
      case 22:
        Lf(3, u);
        return;
      case 1:
        if (n = u.stateNode, u.effectTag & 4)
          if (a === null)
            n.componentDidMount();
          else {
            var f = u.elementType === u.type ? a.memoizedProps : pi(u.type, a.memoizedProps);
            n.componentDidUpdate(f, a.memoizedState, n.__reactInternalSnapshotBeforeUpdate);
          }
        a = u.updateQueue, a !== null && Cf(u, a, n);
        return;
      case 3:
        if (a = u.updateQueue, a !== null) {
          if (n = null, u.child !== null)
            switch (u.child.tag) {
              case 5:
                n = u.child.stateNode;
                break;
              case 1:
                n = u.child.stateNode;
            }
          Cf(u, a, n);
        }
        return;
      case 5:
        n = u.stateNode, a === null && u.effectTag & 4 && Tp(u.type, u.memoizedProps) && n.focus();
        return;
      case 6:
        return;
      case 4:
        return;
      case 12:
        return;
      case 13:
        u.memoizedState === null && (u = u.alternate, u !== null && (u = u.memoizedState, u !== null && (u = u.dehydrated, u !== null && gp(u))));
        return;
      case 19:
      case 17:
      case 20:
      case 21:
        return;
    }
    throw Error(c(163));
  }
  function Bf(n, a, u) {
    switch (typeof eu == "function" && eu(a), a.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
      case 22:
        if (n = a.updateQueue, n !== null && (n = n.lastEffect, n !== null)) {
          var f = n.next;
          xt(97 < u ? 97 : u, function() {
            var v = f;
            do {
              var S = v.destroy;
              if (S !== void 0) {
                var T = a;
                try {
                  S();
                } catch (R) {
                  es(T, R);
                }
              }
              v = v.next;
            } while (v !== f);
          });
        }
        break;
      case 1:
        qp(a), u = a.stateNode, typeof u.componentWillUnmount == "function" && Rg(a, u);
        break;
      case 5:
        qp(a);
        break;
      case 4:
        zc(n, a, u);
    }
  }
  function em(n) {
    var a = n.alternate;
    n.return = null, n.child = null, n.memoizedState = null, n.updateQueue = null, n.dependencies = null, n.alternate = null, n.firstEffect = null, n.lastEffect = null, n.pendingProps = null, n.memoizedProps = null, n.stateNode = null, a !== null && em(a);
  }
  function tm(n) {
    return n.tag === 5 || n.tag === 3 || n.tag === 4;
  }
  function nm(n) {
    e: {
      for (var a = n.return; a !== null; ) {
        if (tm(a)) {
          var u = a;
          break e;
        }
        a = a.return;
      }
      throw Error(c(160));
    }
    switch (a = u.stateNode, u.tag) {
      case 5:
        var f = !1;
        break;
      case 3:
        a = a.containerInfo, f = !0;
        break;
      case 4:
        a = a.containerInfo, f = !0;
        break;
      default:
        throw Error(c(161));
    }
    u.effectTag & 16 && (ei(a, ""), u.effectTag &= -17);
    e:
      t:
        for (u = n; ; ) {
          for (; u.sibling === null; ) {
            if (u.return === null || tm(u.return)) {
              u = null;
              break e;
            }
            u = u.return;
          }
          for (u.sibling.return = u.return, u = u.sibling; u.tag !== 5 && u.tag !== 6 && u.tag !== 18; ) {
            if (u.effectTag & 2 || u.child === null || u.tag === 4)
              continue t;
            u.child.return = u, u = u.child;
          }
          if (!(u.effectTag & 2)) {
            u = u.stateNode;
            break e;
          }
        }
    f ? jf(n, u, a) : Yl(n, u, a);
  }
  function jf(n, a, u) {
    var f = n.tag, v = f === 5 || f === 6;
    if (v)
      n = v ? n.stateNode : n.stateNode.instance, a ? u.nodeType === 8 ? u.parentNode.insertBefore(n, a) : u.insertBefore(n, a) : (u.nodeType === 8 ? (a = u.parentNode, a.insertBefore(n, u)) : (a = u, a.appendChild(n)), u = u._reactRootContainer, u != null || a.onclick !== null || (a.onclick = Ds));
    else if (f !== 4 && (n = n.child, n !== null))
      for (jf(n, a, u), n = n.sibling; n !== null; )
        jf(n, a, u), n = n.sibling;
  }
  function Yl(n, a, u) {
    var f = n.tag, v = f === 5 || f === 6;
    if (v)
      n = v ? n.stateNode : n.stateNode.instance, a ? u.insertBefore(n, a) : u.appendChild(n);
    else if (f !== 4 && (n = n.child, n !== null))
      for (Yl(n, a, u), n = n.sibling; n !== null; )
        Yl(n, a, u), n = n.sibling;
  }
  function zc(n, a, u) {
    for (var f = a, v = !1, S, T; ; ) {
      if (!v) {
        v = f.return;
        e:
          for (; ; ) {
            if (v === null)
              throw Error(c(160));
            switch (S = v.stateNode, v.tag) {
              case 5:
                T = !1;
                break e;
              case 3:
                S = S.containerInfo, T = !0;
                break e;
              case 4:
                S = S.containerInfo, T = !0;
                break e;
            }
            v = v.return;
          }
        v = !0;
      }
      if (f.tag === 5 || f.tag === 6) {
        e:
          for (var R = n, W = f, U = u, Me = W; ; )
            if (Bf(R, Me, U), Me.child !== null && Me.tag !== 4)
              Me.child.return = Me, Me = Me.child;
            else {
              if (Me === W)
                break e;
              for (; Me.sibling === null; ) {
                if (Me.return === null || Me.return === W)
                  break e;
                Me = Me.return;
              }
              Me.sibling.return = Me.return, Me = Me.sibling;
            }
        T ? (R = S, W = f.stateNode, R.nodeType === 8 ? R.parentNode.removeChild(W) : R.removeChild(W)) : S.removeChild(f.stateNode);
      } else if (f.tag === 4) {
        if (f.child !== null) {
          S = f.stateNode.containerInfo, T = !0, f.child.return = f, f = f.child;
          continue;
        }
      } else if (Bf(n, f, u), f.child !== null) {
        f.child.return = f, f = f.child;
        continue;
      }
      if (f === a)
        break;
      for (; f.sibling === null; ) {
        if (f.return === null || f.return === a)
          return;
        f = f.return, f.tag === 4 && (v = !1);
      }
      f.sibling.return = f.return, f = f.sibling;
    }
  }
  function da(n, a) {
    switch (a.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
      case 22:
        Kp(3, a);
        return;
      case 1:
        return;
      case 5:
        var u = a.stateNode;
        if (u != null) {
          var f = a.memoizedProps, v = n !== null ? n.memoizedProps : f;
          n = a.type;
          var S = a.updateQueue;
          if (a.updateQueue = null, S !== null) {
            for (u[Eo] = f, n === "input" && f.type === "radio" && f.name != null && Ia(u, f), Ld(n, v), a = Ld(n, f), v = 0; v < S.length; v += 2) {
              var T = S[v], R = S[v + 1];
              T === "style" ? Sp(u, R) : T === "dangerouslySetInnerHTML" ? qr(u, R) : T === "children" ? ei(u, R) : Mt(u, T, R, a);
            }
            switch (n) {
              case "input":
                kt(u, f);
                break;
              case "textarea":
                yo(u, f);
                break;
              case "select":
                a = u._wrapperState.wasMultiple, u._wrapperState.wasMultiple = !!f.multiple, n = f.value, n != null ? Kn(u, !!f.multiple, n, !1) : a !== !!f.multiple && (f.defaultValue != null ? Kn(u, !!f.multiple, f.defaultValue, !0) : Kn(u, !!f.multiple, f.multiple ? [] : "", !1));
            }
          }
        }
        return;
      case 6:
        if (a.stateNode === null)
          throw Error(c(162));
        a.stateNode.nodeValue = a.memoizedProps;
        return;
      case 3:
        a = a.stateNode, a.hydrate && (a.hydrate = !1, gp(a.containerInfo));
        return;
      case 12:
        return;
      case 13:
        if (u = a, a.memoizedState === null ? f = !1 : (f = !0, u = a.child, Ga = _t()), u !== null)
          e:
            for (n = u; ; ) {
              if (n.tag === 5)
                S = n.stateNode, f ? (S = S.style, typeof S.setProperty == "function" ? S.setProperty("display", "none", "important") : S.display = "none") : (S = n.stateNode, v = n.memoizedProps.style, v = v != null && v.hasOwnProperty("display") ? v.display : null, S.style.display = bp("display", v));
              else if (n.tag === 6)
                n.stateNode.nodeValue = f ? "" : n.memoizedProps;
              else if (n.tag === 13 && n.memoizedState !== null && n.memoizedState.dehydrated === null) {
                S = n.child.sibling, S.return = n, n = S;
                continue;
              } else if (n.child !== null) {
                n.child.return = n, n = n.child;
                continue;
              }
              if (n === u)
                break;
              for (; n.sibling === null; ) {
                if (n.return === null || n.return === u)
                  break e;
                n = n.return;
              }
              n.sibling.return = n.return, n = n.sibling;
            }
        Gl(a);
        return;
      case 19:
        Gl(a);
        return;
      case 17:
        return;
    }
    throw Error(c(163));
  }
  function Gl(n) {
    var a = n.updateQueue;
    if (a !== null) {
      n.updateQueue = null;
      var u = n.stateNode;
      u === null && (u = n.stateNode = new Ag()), a.forEach(function(f) {
        var v = Og.bind(null, n, f);
        u.has(f) || (u.add(f), f.then(v, v));
      });
    }
  }
  var im = typeof WeakMap == "function" ? WeakMap : Map;
  function Js(n, a, u) {
    u = Ha(u, null), u.tag = 3, u.payload = { element: null };
    var f = a.value;
    return u.callback = function() {
      eo || (eo = !0, Wo = f), Of(n, a);
    }, u;
  }
  function rm(n, a, u) {
    u = Ha(u, null), u.tag = 3;
    var f = n.type.getDerivedStateFromError;
    if (typeof f == "function") {
      var v = a.value;
      u.payload = function() {
        return Of(n, a), f(v);
      };
    }
    var S = n.stateNode;
    return S !== null && typeof S.componentDidCatch == "function" && (u.callback = function() {
      typeof f != "function" && (Yi === null ? Yi = /* @__PURE__ */ new Set([this]) : Yi.add(this), Of(n, a));
      var T = a.stack;
      this.componentDidCatch(a.value, { componentStack: T !== null ? T : "" });
    }), u;
  }
  var kg = Math.ceil, Oc = Zt.ReactCurrentDispatcher, am = Zt.ReactCurrentOwner, zn = 0, Uf = 8, Zi = 16, jr = 32, Ya = 0, On = 1, sm = 2, Xl = 3, Lc = 4, Vf = 5, at = zn, Ni = null, ot = null, Vt = 0, pn = Ya, qs = null, ki = 1073741823, Ho = 1073741823, Ur = null, dr = 0, Ks = !1, Ga = 0, Bc = 500, Le = null, eo = !1, Wo = null, Yi = null, Jl = !1, Xa = null, Fo = 90, fr = null, $o = 0, Hf = null, jc = 0;
  function Ln() {
    return (at & (Zi | jr)) !== zn ? 1073741821 - (_t() / 10 | 0) : jc !== 0 ? jc : jc = 1073741821 - (_t() / 10 | 0);
  }
  function Ja(n, a, u) {
    if (a = a.mode, (a & 2) === 0)
      return 1073741823;
    var f = lr();
    if ((a & 4) === 0)
      return f === 99 ? 1073741823 : 1073741822;
    if ((at & Zi) !== zn)
      return Vt;
    if (u !== null)
      n = Ut(n, u.timeoutMs | 0 || 5e3, 250);
    else
      switch (f) {
        case 99:
          n = 1073741823;
          break;
        case 98:
          n = Ut(n, 150, 100);
          break;
        case 97:
        case 96:
          n = Ut(n, 5e3, 250);
          break;
        case 95:
          n = 2;
          break;
        default:
          throw Error(c(326));
      }
    return Ni !== null && n === Vt && --n, n;
  }
  function qa(n, a) {
    if (50 < $o)
      throw $o = 0, Hf = null, Error(c(185));
    if (n = to(n, a), n !== null) {
      var u = lr();
      a === 1073741823 ? (at & Uf) !== zn && (at & (Zi | jr)) === zn ? Wf(n) : (_i(n), at === zn && Ri()) : _i(n), (at & 4) === zn || u !== 98 && u !== 99 || (fr === null ? fr = /* @__PURE__ */ new Map([[n, a]]) : (u = fr.get(n), (u === void 0 || u > a) && fr.set(n, a)));
    }
  }
  function to(n, a) {
    n.expirationTime < a && (n.expirationTime = a);
    var u = n.alternate;
    u !== null && u.expirationTime < a && (u.expirationTime = a);
    var f = n.return, v = null;
    if (f === null && n.tag === 3)
      v = n.stateNode;
    else
      for (; f !== null; ) {
        if (u = f.alternate, f.childExpirationTime < a && (f.childExpirationTime = a), u !== null && u.childExpirationTime < a && (u.childExpirationTime = a), f.return === null && f.tag === 3) {
          v = f.stateNode;
          break;
        }
        f = f.return;
      }
    return v !== null && (Ni === v && (ql(a), pn === Lc && io(v, Vt)), Gf(v, a)), v;
  }
  function Uc(n) {
    var a = n.lastExpiredTime;
    if (a !== 0 || (a = n.firstPendingTime, !bm(n, a)))
      return a;
    var u = n.lastPingedTime;
    return n = n.nextKnownPendingLevel, n = u > n ? u : n, 2 >= n && a !== n ? 0 : n;
  }
  function _i(n) {
    if (n.lastExpiredTime !== 0)
      n.callbackExpirationTime = 1073741823, n.callbackPriority = 99, n.callbackNode = Us(Wf.bind(null, n));
    else {
      var a = Uc(n), u = n.callbackNode;
      if (a === 0)
        u !== null && (n.callbackNode = null, n.callbackExpirationTime = 0, n.callbackPriority = 90);
      else {
        var f = Ln();
        if (a === 1073741823 ? f = 99 : a === 1 || a === 2 ? f = 95 : (f = 10 * (1073741821 - a) - 10 * (1073741821 - f), f = 0 >= f ? 99 : 250 >= f ? 98 : 5250 >= f ? 97 : 95), u !== null) {
          var v = n.callbackPriority;
          if (n.callbackExpirationTime === a && v >= f)
            return;
          u !== gf && oc(u);
        }
        n.callbackExpirationTime = a, n.callbackPriority = f, a = a === 1073741823 ? Us(Wf.bind(null, n)) : zp(f, om.bind(null, n), { timeout: 10 * (1073741821 - a) - _t() }), n.callbackNode = a;
      }
    }
  }
  function om(n, a) {
    if (jc = 0, a)
      return a = Ln(), ts(n, a), _i(n), null;
    var u = Uc(n);
    if (u !== 0) {
      if (a = n.callbackNode, (at & (Zi | jr)) !== zn)
        throw Error(c(327));
      if (Qo(), n === Ni && u === Vt || no(n, u), ot !== null) {
        var f = at;
        at |= Zi;
        var v = dm();
        do
          try {
            hm();
            break;
          } catch (R) {
            cm(n, R);
          }
        while (1);
        if (bf(), at = f, Oc.current = v, pn === On)
          throw a = qs, no(n, u), io(n, u), _i(n), a;
        if (ot === null)
          switch (v = n.finishedWork = n.current.alternate, n.finishedExpirationTime = u, f = pn, Ni = null, f) {
            case Ya:
            case On:
              throw Error(c(345));
            case sm:
              ts(n, 2 < u ? 2 : u);
              break;
            case Xl:
              if (io(n, u), f = n.lastSuspendedTime, u === f && (n.nextKnownPendingLevel = Kl(v)), ki === 1073741823 && (v = Ga + Bc - _t(), 10 < v)) {
                if (Ks) {
                  var S = n.lastPingedTime;
                  if (S === 0 || S >= u) {
                    n.lastPingedTime = u, no(n, u);
                    break;
                  }
                }
                if (S = Uc(n), S !== 0 && S !== u)
                  break;
                if (f !== 0 && f !== u) {
                  n.lastPingedTime = f;
                  break;
                }
                n.timeoutHandle = Zu(Ka.bind(null, n), v);
                break;
              }
              Ka(n);
              break;
            case Lc:
              if (io(n, u), f = n.lastSuspendedTime, u === f && (n.nextKnownPendingLevel = Kl(v)), Ks && (v = n.lastPingedTime, v === 0 || v >= u)) {
                n.lastPingedTime = u, no(n, u);
                break;
              }
              if (v = Uc(n), v !== 0 && v !== u)
                break;
              if (f !== 0 && f !== u) {
                n.lastPingedTime = f;
                break;
              }
              if (Ho !== 1073741823 ? f = 10 * (1073741821 - Ho) - _t() : ki === 1073741823 ? f = 0 : (f = 10 * (1073741821 - ki) - 5e3, v = _t(), u = 10 * (1073741821 - u) - v, f = v - f, 0 > f && (f = 0), f = (120 > f ? 120 : 480 > f ? 480 : 1080 > f ? 1080 : 1920 > f ? 1920 : 3e3 > f ? 3e3 : 4320 > f ? 4320 : 1960 * kg(f / 1960)) - f, u < f && (f = u)), 10 < f) {
                n.timeoutHandle = Zu(Ka.bind(null, n), f);
                break;
              }
              Ka(n);
              break;
            case Vf:
              if (ki !== 1073741823 && Ur !== null) {
                S = ki;
                var T = Ur;
                if (f = T.busyMinDurationMs | 0, 0 >= f ? f = 0 : (v = T.busyDelayMs | 0, S = _t() - (10 * (1073741821 - S) - (T.timeoutMs | 0 || 5e3)), f = S <= v ? 0 : v + f - S), 10 < f) {
                  io(n, u), n.timeoutHandle = Zu(Ka.bind(null, n), f);
                  break;
                }
              }
              Ka(n);
              break;
            default:
              throw Error(c(329));
          }
        if (_i(n), n.callbackNode === a)
          return om.bind(null, n);
      }
    }
    return null;
  }
  function Wf(n) {
    var a = n.lastExpiredTime;
    if (a = a !== 0 ? a : 1073741823, (at & (Zi | jr)) !== zn)
      throw Error(c(327));
    if (Qo(), n === Ni && a === Vt || no(n, a), ot !== null) {
      var u = at;
      at |= Zi;
      var f = dm();
      do
        try {
          fm();
          break;
        } catch (v) {
          cm(n, v);
        }
      while (1);
      if (bf(), at = u, Oc.current = f, pn === On)
        throw u = qs, no(n, a), io(n, a), _i(n), u;
      if (ot !== null)
        throw Error(c(261));
      n.finishedWork = n.current.alternate, n.finishedExpirationTime = a, Ni = null, Ka(n), _i(n);
    }
    return null;
  }
  function _g() {
    if (fr !== null) {
      var n = fr;
      fr = null, n.forEach(function(a, u) {
        ts(u, a), _i(u);
      }), Ri();
    }
  }
  function lm(n, a) {
    var u = at;
    at |= 1;
    try {
      return n(a);
    } finally {
      at = u, at === zn && Ri();
    }
  }
  function um(n, a) {
    var u = at;
    at &= -2, at |= Uf;
    try {
      return n(a);
    } finally {
      at = u, at === zn && Ri();
    }
  }
  function no(n, a) {
    n.finishedWork = null, n.finishedExpirationTime = 0;
    var u = n.timeoutHandle;
    if (u !== -1 && (n.timeoutHandle = -1, Mp(u)), ot !== null)
      for (u = ot.return; u !== null; ) {
        var f = u;
        switch (f.tag) {
          case 1:
            f = f.type.childContextTypes, f != null && ja();
            break;
          case 3:
            jo(), St(En), St(Pn);
            break;
          case 5:
            Ef(f);
            break;
          case 4:
            jo();
            break;
          case 13:
            St(Kt);
            break;
          case 19:
            St(Kt);
            break;
          case 10:
            Sf(f);
        }
        u = u.return;
      }
    Ni = n, ot = hr(n.current, null), Vt = a, pn = Ya, qs = null, Ho = ki = 1073741823, Ur = null, dr = 0, Ks = !1;
  }
  function cm(n, a) {
    do {
      try {
        if (bf(), wc.current = Ic, $a)
          for (var u = $t.memoizedState; u !== null; ) {
            var f = u.queue;
            f !== null && (f.pending = null), u = u.next;
          }
        if (Zn = 0, ln = on = $t = null, $a = !1, ot === null || ot.return === null)
          return pn = On, qs = a, ot = null;
        e: {
          var v = n, S = ot.return, T = ot, R = a;
          if (a = Vt, T.effectTag |= 2048, T.firstEffect = T.lastEffect = null, R !== null && typeof R == "object" && typeof R.then == "function") {
            var W = R;
            if ((T.mode & 2) === 0) {
              var U = T.alternate;
              U ? (T.updateQueue = U.updateQueue, T.memoizedState = U.memoizedState, T.expirationTime = U.expirationTime) : (T.updateQueue = null, T.memoizedState = null);
            }
            var Me = (Kt.current & 1) !== 0, De = S;
            do {
              var mt;
              if (mt = De.tag === 13) {
                var Et = De.memoizedState;
                if (Et !== null)
                  mt = Et.dehydrated !== null;
                else {
                  var Pi = De.memoizedProps;
                  mt = Pi.fallback === void 0 ? !1 : Pi.unstable_avoidThisFallback !== !0 ? !0 : !Me;
                }
              }
              if (mt) {
                var Fn = De.updateQueue;
                if (Fn === null) {
                  var O = /* @__PURE__ */ new Set();
                  O.add(W), De.updateQueue = O;
                } else
                  Fn.add(W);
                if ((De.mode & 2) === 0) {
                  if (De.effectTag |= 64, T.effectTag &= -2981, T.tag === 1)
                    if (T.alternate === null)
                      T.tag = 17;
                    else {
                      var P = Ha(1073741823, null);
                      P.tag = 2, Wa(T, P);
                    }
                  T.expirationTime = 1073741823;
                  break e;
                }
                R = void 0, T = a;
                var Q = v.pingCache;
                if (Q === null ? (Q = v.pingCache = new im(), R = /* @__PURE__ */ new Set(), Q.set(W, R)) : (R = Q.get(W), R === void 0 && (R = /* @__PURE__ */ new Set(), Q.set(W, R))), !R.has(T)) {
                  R.add(T);
                  var le = gm.bind(null, v, W, T);
                  W.then(le, le);
                }
                De.effectTag |= 4096, De.expirationTime = a;
                break e;
              }
              De = De.return;
            } while (De !== null);
            R = Error((fi(T.type) || "A React component") + ` suspended while rendering, but no fallback UI was specified.

Add a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display.` + Ea(T));
          }
          pn !== Vf && (pn = sm), R = zf(R, T), De = S;
          do {
            switch (De.tag) {
              case 3:
                W = R, De.effectTag |= 4096, De.expirationTime = a;
                var ye = Js(De, W, a);
                xf(De, ye);
                break e;
              case 1:
                W = R;
                var _e = De.type, qe = De.stateNode;
                if ((De.effectTag & 64) === 0 && (typeof _e.getDerivedStateFromError == "function" || qe !== null && typeof qe.componentDidCatch == "function" && (Yi === null || !Yi.has(qe)))) {
                  De.effectTag |= 4096, De.expirationTime = a;
                  var bt = rm(De, W, a);
                  xf(De, bt);
                  break e;
                }
            }
            De = De.return;
          } while (De !== null);
        }
        ot = pm(ot);
      } catch (un) {
        a = un;
        continue;
      }
      break;
    } while (1);
  }
  function dm() {
    var n = Oc.current;
    return Oc.current = Ic, n === null ? Ic : n;
  }
  function Ff(n, a) {
    n < ki && 2 < n && (ki = n), a !== null && n < Ho && 2 < n && (Ho = n, Ur = a);
  }
  function ql(n) {
    n > dr && (dr = n);
  }
  function fm() {
    for (; ot !== null; )
      ot = $f(ot);
  }
  function hm() {
    for (; ot !== null && !Cg(); )
      ot = $f(ot);
  }
  function $f(n) {
    var a = ym(n.alternate, n, Vt);
    return n.memoizedProps = n.pendingProps, a === null && (a = pm(n)), am.current = null, a;
  }
  function pm(n) {
    ot = n;
    do {
      var a = ot.alternate;
      if (n = ot.return, (ot.effectTag & 2048) === 0) {
        if (a = Jp(a, ot, Vt), Vt === 1 || ot.childExpirationTime !== 1) {
          for (var u = 0, f = ot.child; f !== null; ) {
            var v = f.expirationTime, S = f.childExpirationTime;
            v > u && (u = v), S > u && (u = S), f = f.sibling;
          }
          ot.childExpirationTime = u;
        }
        if (a !== null)
          return a;
        n !== null && (n.effectTag & 2048) === 0 && (n.firstEffect === null && (n.firstEffect = ot.firstEffect), ot.lastEffect !== null && (n.lastEffect !== null && (n.lastEffect.nextEffect = ot.firstEffect), n.lastEffect = ot.lastEffect), 1 < ot.effectTag && (n.lastEffect !== null ? n.lastEffect.nextEffect = ot : n.firstEffect = ot, n.lastEffect = ot));
      } else {
        if (a = Ig(ot), a !== null)
          return a.effectTag &= 2047, a;
        n !== null && (n.firstEffect = n.lastEffect = null, n.effectTag |= 2048);
      }
      if (a = ot.sibling, a !== null)
        return a;
      ot = n;
    } while (ot !== null);
    return pn === Ya && (pn = Vf), null;
  }
  function Kl(n) {
    var a = n.expirationTime;
    return n = n.childExpirationTime, a > n ? a : n;
  }
  function Ka(n) {
    var a = lr();
    return xt(99, Pg.bind(null, n, a)), null;
  }
  function Pg(n, a) {
    do
      Qo();
    while (Xa !== null);
    if ((at & (Zi | jr)) !== zn)
      throw Error(c(327));
    var u = n.finishedWork, f = n.finishedExpirationTime;
    if (u === null)
      return null;
    if (n.finishedWork = null, n.finishedExpirationTime = 0, u === n.current)
      throw Error(c(177));
    n.callbackNode = null, n.callbackExpirationTime = 0, n.callbackPriority = 90, n.nextKnownPendingLevel = 0;
    var v = Kl(u);
    if (n.firstPendingTime = v, f <= n.lastSuspendedTime ? n.firstSuspendedTime = n.lastSuspendedTime = n.nextKnownPendingLevel = 0 : f <= n.firstSuspendedTime && (n.firstSuspendedTime = f - 1), f <= n.lastPingedTime && (n.lastPingedTime = 0), f <= n.lastExpiredTime && (n.lastExpiredTime = 0), n === Ni && (ot = Ni = null, Vt = 0), 1 < u.effectTag ? u.lastEffect !== null ? (u.lastEffect.nextEffect = u, v = u.firstEffect) : v = u : v = u.firstEffect, v !== null) {
      var S = at;
      at |= jr, am.current = null, Qu = Na;
      var T = Vd();
      if (Wu(T)) {
        if ("selectionStart" in T)
          var R = { start: T.selectionStart, end: T.selectionEnd };
        else
          e: {
            R = (R = T.ownerDocument) && R.defaultView || window;
            var W = R.getSelection && R.getSelection();
            if (W && W.rangeCount !== 0) {
              R = W.anchorNode;
              var U = W.anchorOffset, Me = W.focusNode;
              W = W.focusOffset;
              try {
                R.nodeType, Me.nodeType;
              } catch {
                R = null;
                break e;
              }
              var De = 0, mt = -1, Et = -1, Pi = 0, Fn = 0, O = T, P = null;
              t:
                for (; ; ) {
                  for (var Q; O !== R || U !== 0 && O.nodeType !== 3 || (mt = De + U), O !== Me || W !== 0 && O.nodeType !== 3 || (Et = De + W), O.nodeType === 3 && (De += O.nodeValue.length), (Q = O.firstChild) !== null; )
                    P = O, O = Q;
                  for (; ; ) {
                    if (O === T)
                      break t;
                    if (P === R && ++Pi === U && (mt = De), P === Me && ++Fn === W && (Et = De), (Q = O.nextSibling) !== null)
                      break;
                    O = P, P = O.parentNode;
                  }
                  O = Q;
                }
              R = mt === -1 || Et === -1 ? null : { start: mt, end: Et };
            } else
              R = null;
          }
        R = R || { start: 0, end: 0 };
      } else
        R = null;
      Wd = { activeElementDetached: null, focusedElem: T, selectionRange: R }, Na = !1, Le = v;
      do
        try {
          mm();
        } catch (lt) {
          if (Le === null)
            throw Error(c(330));
          es(Le, lt), Le = Le.nextEffect;
        }
      while (Le !== null);
      Le = v;
      do
        try {
          for (T = n, R = a; Le !== null; ) {
            var le = Le.effectTag;
            if (le & 16 && ei(Le.stateNode, ""), le & 128) {
              var ye = Le.alternate;
              if (ye !== null) {
                var _e = ye.ref;
                _e !== null && (typeof _e == "function" ? _e(null) : _e.current = null);
              }
            }
            switch (le & 1038) {
              case 2:
                nm(Le), Le.effectTag &= -3;
                break;
              case 6:
                nm(Le), Le.effectTag &= -3, da(Le.alternate, Le);
                break;
              case 1024:
                Le.effectTag &= -1025;
                break;
              case 1028:
                Le.effectTag &= -1025, da(Le.alternate, Le);
                break;
              case 4:
                da(Le.alternate, Le);
                break;
              case 8:
                U = Le, zc(T, U, R), em(U);
            }
            Le = Le.nextEffect;
          }
        } catch (lt) {
          if (Le === null)
            throw Error(c(330));
          es(Le, lt), Le = Le.nextEffect;
        }
      while (Le !== null);
      if (_e = Wd, ye = Vd(), le = _e.focusedElem, R = _e.selectionRange, ye !== le && le && le.ownerDocument && Ud(le.ownerDocument.documentElement, le)) {
        for (R !== null && Wu(le) && (ye = R.start, _e = R.end, _e === void 0 && (_e = ye), "selectionStart" in le ? (le.selectionStart = ye, le.selectionEnd = Math.min(_e, le.value.length)) : (_e = (ye = le.ownerDocument || document) && ye.defaultView || window, _e.getSelection && (_e = _e.getSelection(), U = le.textContent.length, T = Math.min(R.start, U), R = R.end === void 0 ? T : Math.min(R.end, U), !_e.extend && T > R && (U = R, R = T, T = U), U = jd(le, T), Me = jd(le, R), U && Me && (_e.rangeCount !== 1 || _e.anchorNode !== U.node || _e.anchorOffset !== U.offset || _e.focusNode !== Me.node || _e.focusOffset !== Me.offset) && (ye = ye.createRange(), ye.setStart(U.node, U.offset), _e.removeAllRanges(), T > R ? (_e.addRange(ye), _e.extend(Me.node, Me.offset)) : (ye.setEnd(Me.node, Me.offset), _e.addRange(ye)))))), ye = [], _e = le; _e = _e.parentNode; )
          _e.nodeType === 1 && ye.push({
            element: _e,
            left: _e.scrollLeft,
            top: _e.scrollTop
          });
        for (typeof le.focus == "function" && le.focus(), le = 0; le < ye.length; le++)
          _e = ye[le], _e.element.scrollLeft = _e.left, _e.element.scrollTop = _e.top;
      }
      Na = !!Qu, Wd = Qu = null, n.current = u, Le = v;
      do
        try {
          for (le = n; Le !== null; ) {
            var qe = Le.effectTag;
            if (qe & 36 && Ng(le, Le.alternate, Le), qe & 128) {
              ye = void 0;
              var bt = Le.ref;
              if (bt !== null) {
                var un = Le.stateNode;
                switch (Le.tag) {
                  case 5:
                    ye = un;
                    break;
                  default:
                    ye = un;
                }
                typeof bt == "function" ? bt(ye) : bt.current = ye;
              }
            }
            Le = Le.nextEffect;
          }
        } catch (lt) {
          if (Le === null)
            throw Error(c(330));
          es(Le, lt), Le = Le.nextEffect;
        }
      while (Le !== null);
      Le = null, _p(), at = S;
    } else
      n.current = u;
    if (Jl)
      Jl = !1, Xa = n, Fo = a;
    else
      for (Le = v; Le !== null; )
        a = Le.nextEffect, Le.nextEffect = null, Le = a;
    if (a = n.firstPendingTime, a === 0 && (Yi = null), a === 1073741823 ? n === Hf ? $o++ : ($o = 0, Hf = n) : $o = 0, typeof Vc == "function" && Vc(u.stateNode, f), _i(n), eo)
      throw eo = !1, n = Wo, Wo = null, n;
    return (at & Uf) !== zn || Ri(), null;
  }
  function mm() {
    for (; Le !== null; ) {
      var n = Le.effectTag;
      (n & 256) !== 0 && Dg(Le.alternate, Le), (n & 512) === 0 || Jl || (Jl = !0, zp(97, function() {
        return Qo(), null;
      })), Le = Le.nextEffect;
    }
  }
  function Qo() {
    if (Fo !== 90) {
      var n = 97 < Fo ? 97 : Fo;
      return Fo = 90, xt(n, zg);
    }
  }
  function zg() {
    if (Xa === null)
      return !1;
    var n = Xa;
    if (Xa = null, (at & (Zi | jr)) !== zn)
      throw Error(c(331));
    var a = at;
    for (at |= jr, n = n.current.firstEffect; n !== null; ) {
      try {
        var u = n;
        if ((u.effectTag & 512) !== 0)
          switch (u.tag) {
            case 0:
            case 11:
            case 15:
            case 22:
              Kp(5, u), Lf(5, u);
          }
      } catch (f) {
        if (n === null)
          throw Error(c(330));
        es(n, f);
      }
      u = n.nextEffect, n.nextEffect = null, n = u;
    }
    return at = a, Ri(), !0;
  }
  function vm(n, a, u) {
    a = zf(u, a), a = Js(n, a, 1073741823), Wa(n, a), n = to(n, 1073741823), n !== null && _i(n);
  }
  function es(n, a) {
    if (n.tag === 3)
      vm(n, n, a);
    else
      for (var u = n.return; u !== null; ) {
        if (u.tag === 3) {
          vm(u, n, a);
          break;
        } else if (u.tag === 1) {
          var f = u.stateNode;
          if (typeof u.type.getDerivedStateFromError == "function" || typeof f.componentDidCatch == "function" && (Yi === null || !Yi.has(f))) {
            n = zf(a, n), n = rm(u, n, 1073741823), Wa(u, n), u = to(u, 1073741823), u !== null && _i(u);
            break;
          }
        }
        u = u.return;
      }
  }
  function gm(n, a, u) {
    var f = n.pingCache;
    f !== null && f.delete(a), Ni === n && Vt === u ? pn === Lc || pn === Xl && ki === 1073741823 && _t() - Ga < Bc ? no(n, Vt) : Ks = !0 : bm(n, u) && (a = n.lastPingedTime, a !== 0 && a < u || (n.lastPingedTime = u, _i(n)));
  }
  function Og(n, a) {
    var u = n.stateNode;
    u !== null && u.delete(a), a = 0, a === 0 && (a = Ln(), a = Ja(a, n, null)), n = to(n, a), n !== null && _i(n);
  }
  var ym;
  ym = function(n, a, u) {
    var f = a.expirationTime;
    if (n !== null) {
      var v = a.pendingProps;
      if (n.memoizedProps !== v || En.current)
        cr = !0;
      else {
        if (f < u) {
          switch (cr = !1, a.tag) {
            case 3:
              Nc(a), Gt();
              break;
            case 5:
              if (Mf(a), a.mode & 4 && u !== 1 && v.hidden)
                return a.expirationTime = a.childExpirationTime = 1, null;
              break;
            case 1:
              Qn(a.type) && No(a);
              break;
            case 4:
              vc(a, a.stateNode.containerInfo);
              break;
            case 10:
              f = a.memoizedProps.value, v = a.type._context, sn(Ua, v._currentValue), v._currentValue = f;
              break;
            case 13:
              if (a.memoizedState !== null)
                return f = a.child.childExpirationTime, f !== 0 && f >= u ? Zp(n, a, u) : (sn(Kt, Kt.current & 1), a = ca(n, a, u), a !== null ? a.sibling : null);
              sn(Kt, Kt.current & 1);
              break;
            case 19:
              if (f = a.childExpirationTime >= u, (n.effectTag & 64) !== 0) {
                if (f)
                  return Gp(n, a, u);
                a.effectTag |= 64;
              }
              if (v = a.memoizedState, v !== null && (v.rendering = null, v.tail = null), sn(Kt, Kt.current), !f)
                return null;
          }
          return ca(n, a, u);
        }
        cr = !1;
      }
    } else
      cr = !1;
    switch (a.expirationTime = 0, a.tag) {
      case 2:
        if (f = a.type, n !== null && (n.alternate = null, a.alternate = null, a.effectTag |= 2), n = a.pendingProps, v = Ba(a, Pn.current), mi(a, u), v = If(
          null,
          a,
          f,
          n,
          v,
          u
        ), a.effectTag |= 1, typeof v == "object" && v !== null && typeof v.render == "function" && v.$$typeof === void 0) {
          if (a.tag = 1, a.memoizedState = null, a.updateQueue = null, Qn(f)) {
            var S = !0;
            No(a);
          } else
            S = !1;
          a.memoizedState = v.state !== null && v.state !== void 0 ? v.state : null, hc(a);
          var T = f.getDerivedStateFromProps;
          typeof T == "function" && Oo(a, f, T, n), v.updater = Fa, a.stateNode = v, v._reactInternalFiber = a, jl(a, f, n, u), a = _f(null, a, f, !0, S, u);
        } else
          a.tag = 0, Di(null, a, v, u), a = a.child;
        return a;
      case 16:
        e: {
          if (v = a.elementType, n !== null && (n.alternate = null, a.alternate = null, a.effectTag |= 2), n = a.pendingProps, tr(v), v._status !== 1)
            throw v._result;
          switch (v = v._result, a.type = v, S = a.tag = tu(v), n = pi(v, n), S) {
            case 0:
              a = Gs(null, a, v, n, u);
              break e;
            case 1:
              a = Qp(null, a, v, n, u);
              break e;
            case 11:
              a = Fp(null, a, v, n, u);
              break e;
            case 14:
              a = Ql(null, a, v, pi(v.type, n), f, u);
              break e;
          }
          throw Error(c(306, v, ""));
        }
        return a;
      case 0:
        return f = a.type, v = a.pendingProps, v = a.elementType === f ? v : pi(f, v), Gs(n, a, f, v, u);
      case 1:
        return f = a.type, v = a.pendingProps, v = a.elementType === f ? v : pi(f, v), Qp(n, a, f, v, u);
      case 3:
        if (Nc(a), f = a.updateQueue, n === null || f === null)
          throw Error(c(282));
        if (f = a.pendingProps, v = a.memoizedState, v = v !== null ? v.element : null, pc(n, a), zo(a, f, null, u), f = a.memoizedState.element, f === v)
          Gt(), a = ca(n, a, u);
        else {
          if ((v = a.stateNode.hydrate) && (Za = Mo(a.stateNode.containerInfo.firstChild), ur = a, v = Ys = !0), v)
            for (u = Tf(a, null, f, u), a.child = u; u; )
              u.effectTag = u.effectTag & -3 | 1024, u = u.sibling;
          else
            Di(n, a, f, u), Gt();
          a = a.child;
        }
        return a;
      case 5:
        return Mf(a), n === null && $l(a), f = a.type, v = a.pendingProps, S = n !== null ? n.memoizedProps : null, T = v.children, bl(f, v) ? T = null : S !== null && bl(f, S) && (a.effectTag |= 16), $p(n, a), a.mode & 4 && u !== 1 && v.hidden ? (a.expirationTime = a.childExpirationTime = 1, a = null) : (Di(n, a, T, u), a = a.child), a;
      case 6:
        return n === null && $l(a), null;
      case 13:
        return Zp(n, a, u);
      case 4:
        return vc(a, a.stateNode.containerInfo), f = a.pendingProps, n === null ? a.child = Lo(a, null, f, u) : Di(n, a, f, u), a.child;
      case 11:
        return f = a.type, v = a.pendingProps, v = a.elementType === f ? v : pi(f, v), Fp(n, a, f, v, u);
      case 7:
        return Di(n, a, a.pendingProps, u), a.child;
      case 8:
        return Di(
          n,
          a,
          a.pendingProps.children,
          u
        ), a.child;
      case 12:
        return Di(n, a, a.pendingProps.children, u), a.child;
      case 10:
        e: {
          f = a.type._context, v = a.pendingProps, T = a.memoizedProps, S = v.value;
          var R = a.type._context;
          if (sn(Ua, R._currentValue), R._currentValue = S, T !== null)
            if (R = T.value, S = Ii(R, S) ? 0 : (typeof f._calculateChangedBits == "function" ? f._calculateChangedBits(R, S) : 1073741823) | 0, S === 0) {
              if (T.children === v.children && !En.current) {
                a = ca(n, a, u);
                break e;
              }
            } else
              for (R = a.child, R !== null && (R.return = a); R !== null; ) {
                var W = R.dependencies;
                if (W !== null) {
                  T = R.child;
                  for (var U = W.firstContext; U !== null; ) {
                    if (U.context === f && (U.observedBits & S) !== 0) {
                      R.tag === 1 && (U = Ha(u, null), U.tag = 2, Wa(R, U)), R.expirationTime < u && (R.expirationTime = u), U = R.alternate, U !== null && U.expirationTime < u && (U.expirationTime = u), Po(R.return, u), W.expirationTime < u && (W.expirationTime = u);
                      break;
                    }
                    U = U.next;
                  }
                } else
                  T = R.tag === 10 && R.type === a.type ? null : R.child;
                if (T !== null)
                  T.return = R;
                else
                  for (T = R; T !== null; ) {
                    if (T === a) {
                      T = null;
                      break;
                    }
                    if (R = T.sibling, R !== null) {
                      R.return = T.return, T = R;
                      break;
                    }
                    T = T.return;
                  }
                R = T;
              }
          Di(n, a, v.children, u), a = a.child;
        }
        return a;
      case 9:
        return v = a.type, S = a.pendingProps, f = S.children, mi(a, u), v = Qi(v, S.unstable_observedBits), f = f(v), a.effectTag |= 1, Di(n, a, f, u), a.child;
      case 14:
        return v = a.type, S = pi(v, a.pendingProps), S = pi(v.type, S), Ql(n, a, v, S, f, u);
      case 15:
        return Dc(n, a, a.type, a.pendingProps, f, u);
      case 17:
        return f = a.type, v = a.pendingProps, v = a.elementType === f ? v : pi(f, v), n !== null && (n.alternate = null, a.alternate = null, a.effectTag |= 2), a.tag = 1, Qn(f) ? (n = !0, No(a)) : n = !1, mi(a, u), Lp(a, f, v), jl(a, f, v, u), _f(
          null,
          a,
          f,
          !0,
          n,
          u
        );
      case 19:
        return Gp(n, a, u);
    }
    throw Error(c(156, a.tag));
  };
  var Vc = null, eu = null;
  function Lg(n) {
    if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u")
      return !1;
    var a = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (a.isDisabled || !a.supportsFiber)
      return !0;
    try {
      var u = a.inject(n);
      Vc = function(f) {
        try {
          a.onCommitFiberRoot(u, f, void 0, (f.current.effectTag & 64) === 64);
        } catch {
        }
      }, eu = function(f) {
        try {
          a.onCommitFiberUnmount(u, f);
        } catch {
        }
      };
    } catch {
    }
    return !0;
  }
  function Bg(n, a, u, f) {
    this.tag = n, this.key = u, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = a, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = f, this.effectTag = 0, this.lastEffect = this.firstEffect = this.nextEffect = null, this.childExpirationTime = this.expirationTime = 0, this.alternate = null;
  }
  function Vr(n, a, u, f) {
    return new Bg(n, a, u, f);
  }
  function Qf(n) {
    return n = n.prototype, !(!n || !n.isReactComponent);
  }
  function tu(n) {
    if (typeof n == "function")
      return Qf(n) ? 1 : 0;
    if (n != null) {
      if (n = n.$$typeof, n === ci)
        return 11;
      if (n === Gr)
        return 14;
    }
    return 2;
  }
  function hr(n, a) {
    var u = n.alternate;
    return u === null ? (u = Vr(n.tag, a, n.key, n.mode), u.elementType = n.elementType, u.type = n.type, u.stateNode = n.stateNode, u.alternate = n, n.alternate = u) : (u.pendingProps = a, u.effectTag = 0, u.nextEffect = null, u.firstEffect = null, u.lastEffect = null), u.childExpirationTime = n.childExpirationTime, u.expirationTime = n.expirationTime, u.child = n.child, u.memoizedProps = n.memoizedProps, u.memoizedState = n.memoizedState, u.updateQueue = n.updateQueue, a = n.dependencies, u.dependencies = a === null ? null : {
      expirationTime: a.expirationTime,
      firstContext: a.firstContext,
      responders: a.responders
    }, u.sibling = n.sibling, u.index = n.index, u.ref = n.ref, u;
  }
  function Hc(n, a, u, f, v, S) {
    var T = 2;
    if (f = n, typeof n == "function")
      Qf(n) && (T = 1);
    else if (typeof n == "string")
      T = 5;
    else
      e:
        switch (n) {
          case Jn:
            return fa(u.children, v, S, a);
          case Sn:
            T = 8, v |= 7;
            break;
          case ke:
            T = 8, v |= 1;
            break;
          case st:
            return n = Vr(12, u, a, v | 8), n.elementType = st, n.type = st, n.expirationTime = S, n;
          case Mr:
            return n = Vr(13, u, a, v), n.type = Mr, n.elementType = Mr, n.expirationTime = S, n;
          case jn:
            return n = Vr(19, u, a, v), n.elementType = jn, n.expirationTime = S, n;
          default:
            if (typeof n == "object" && n !== null)
              switch (n.$$typeof) {
                case He:
                  T = 10;
                  break e;
                case jt:
                  T = 9;
                  break e;
                case ci:
                  T = 11;
                  break e;
                case Gr:
                  T = 14;
                  break e;
                case Vi:
                  T = 16, f = null;
                  break e;
                case Ta:
                  T = 22;
                  break e;
              }
            throw Error(c(130, n == null ? n : typeof n, ""));
        }
    return a = Vr(T, u, a, v), a.elementType = n, a.type = f, a.expirationTime = S, a;
  }
  function fa(n, a, u, f) {
    return n = Vr(7, n, f, a), n.expirationTime = u, n;
  }
  function Zf(n, a, u) {
    return n = Vr(6, n, null, a), n.expirationTime = u, n;
  }
  function Yf(n, a, u) {
    return a = Vr(4, n.children !== null ? n.children : [], n.key, a), a.expirationTime = u, a.stateNode = { containerInfo: n.containerInfo, pendingChildren: null, implementation: n.implementation }, a;
  }
  function wm(n, a, u) {
    this.tag = a, this.current = null, this.containerInfo = n, this.pingCache = this.pendingChildren = null, this.finishedExpirationTime = 0, this.finishedWork = null, this.timeoutHandle = -1, this.pendingContext = this.context = null, this.hydrate = u, this.callbackNode = null, this.callbackPriority = 90, this.lastExpiredTime = this.lastPingedTime = this.nextKnownPendingLevel = this.lastSuspendedTime = this.firstSuspendedTime = this.firstPendingTime = 0;
  }
  function bm(n, a) {
    var u = n.firstSuspendedTime;
    return n = n.lastSuspendedTime, u !== 0 && u >= a && n <= a;
  }
  function io(n, a) {
    var u = n.firstSuspendedTime, f = n.lastSuspendedTime;
    u < a && (n.firstSuspendedTime = a), (f > a || u === 0) && (n.lastSuspendedTime = a), a <= n.lastPingedTime && (n.lastPingedTime = 0), a <= n.lastExpiredTime && (n.lastExpiredTime = 0);
  }
  function Gf(n, a) {
    a > n.firstPendingTime && (n.firstPendingTime = a);
    var u = n.firstSuspendedTime;
    u !== 0 && (a >= u ? n.firstSuspendedTime = n.lastSuspendedTime = n.nextKnownPendingLevel = 0 : a >= n.lastSuspendedTime && (n.lastSuspendedTime = a + 1), a > n.nextKnownPendingLevel && (n.nextKnownPendingLevel = a));
  }
  function ts(n, a) {
    var u = n.lastExpiredTime;
    (u === 0 || u > a) && (n.lastExpiredTime = a);
  }
  function nu(n, a, u, f) {
    var v = a.current, S = Ln(), T = Bl.suspense;
    S = Ja(S, v, T);
    e:
      if (u) {
        u = u._reactInternalFiber;
        t: {
          if (fn(u) !== u || u.tag !== 1)
            throw Error(c(170));
          var R = u;
          do {
            switch (R.tag) {
              case 3:
                R = R.stateNode.context;
                break t;
              case 1:
                if (Qn(R.type)) {
                  R = R.stateNode.__reactInternalMemoizedMergedChildContext;
                  break t;
                }
            }
            R = R.return;
          } while (R !== null);
          throw Error(c(171));
        }
        if (u.tag === 1) {
          var W = u.type;
          if (Qn(W)) {
            u = js(u, W, R);
            break e;
          }
        }
        u = R;
      } else
        u = Or;
    return a.context === null ? a.context = u : a.pendingContext = u, a = Ha(S, T), a.payload = { element: n }, f = f === void 0 ? null : f, f !== null && (a.callback = f), Wa(v, a), qa(v, S), S;
  }
  function Wc(n) {
    if (n = n.current, !n.child)
      return null;
    switch (n.child.tag) {
      case 5:
        return n.child.stateNode;
      default:
        return n.child.stateNode;
    }
  }
  function Fc(n, a) {
    n = n.memoizedState, n !== null && n.dehydrated !== null && n.retryTime < a && (n.retryTime = a);
  }
  function iu(n, a) {
    Fc(n, a), (n = n.alternate) && Fc(n, a);
  }
  function Xf(n, a, u) {
    u = u != null && u.hydrate === !0;
    var f = new wm(n, a, u), v = Vr(3, null, null, a === 2 ? 7 : a === 1 ? 3 : 0);
    f.current = v, v.stateNode = f, hc(v), n[Io] = f.current, u && a !== 0 && So(n, n.nodeType === 9 ? n : n.ownerDocument), this._internalRoot = f;
  }
  Xf.prototype.render = function(n) {
    nu(n, this._internalRoot, null, null);
  }, Xf.prototype.unmount = function() {
    var n = this._internalRoot, a = n.containerInfo;
    nu(null, n, null, function() {
      a[Io] = null;
    });
  };
  function ro(n) {
    return !(!n || n.nodeType !== 1 && n.nodeType !== 9 && n.nodeType !== 11 && (n.nodeType !== 8 || n.nodeValue !== " react-mount-point-unstable "));
  }
  function Jf(n, a) {
    if (a || (a = n ? n.nodeType === 9 ? n.documentElement : n.firstChild : null, a = !(!a || a.nodeType !== 1 || !a.hasAttribute("data-reactroot"))), !a)
      for (var u; u = n.lastChild; )
        n.removeChild(u);
    return new Xf(n, 0, a ? { hydrate: !0 } : void 0);
  }
  function ru(n, a, u, f, v) {
    var S = u._reactRootContainer;
    if (S) {
      var T = S._internalRoot;
      if (typeof v == "function") {
        var R = v;
        v = function() {
          var U = Wc(T);
          R.call(U);
        };
      }
      nu(a, T, n, v);
    } else {
      if (S = u._reactRootContainer = Jf(u, f), T = S._internalRoot, typeof v == "function") {
        var W = v;
        v = function() {
          var U = Wc(T);
          W.call(U);
        };
      }
      um(function() {
        nu(a, T, n, v);
      });
    }
    return Wc(T);
  }
  function jg(n, a, u) {
    var f = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return { $$typeof: Ci, key: f == null ? null : "" + f, children: n, containerInfo: a, implementation: u };
  }
  _ = function(n) {
    if (n.tag === 13) {
      var a = Ut(Ln(), 150, 100);
      qa(n, a), iu(n, a);
    }
  }, H = function(n) {
    n.tag === 13 && (qa(n, 3), iu(n, 3));
  }, X = function(n) {
    if (n.tag === 13) {
      var a = Ln();
      a = Ja(a, n, null), qa(n, a), iu(n, a);
    }
  }, fe = function(n, a, u) {
    switch (a) {
      case "input":
        if (kt(n, u), a = u.name, u.type === "radio" && a != null) {
          for (u = n; u.parentNode; )
            u = u.parentNode;
          for (u = u.querySelectorAll("input[name=" + JSON.stringify("" + a) + '][type="radio"]'), a = 0; a < u.length; a++) {
            var f = u[a];
            if (f !== n && f.form === n.form) {
              var v = xl(f);
              if (!v)
                throw Error(c(90));
              Ir(f), kt(f, v);
            }
          }
        }
        break;
      case "textarea":
        yo(n, u);
        break;
      case "select":
        a = u.value, a != null && Kn(n, !!u.multiple, a, !1);
    }
  }, Qe = lm, Se = function(n, a, u, f, v) {
    var S = at;
    at |= 4;
    try {
      return xt(98, n.bind(null, a, u, f, v));
    } finally {
      at = S, at === zn && Ri();
    }
  }, Ve = function() {
    (at & (1 | Zi | jr)) === zn && (_g(), Qo());
  }, Re = function(n, a) {
    var u = at;
    at |= 2;
    try {
      return n(a);
    } finally {
      at = u, at === zn && Ri();
    }
  };
  function Sm(n, a) {
    var u = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!ro(a))
      throw Error(c(200));
    return jg(n, a, null, u);
  }
  var NS = { Events: [Sl, Hi, xl, Pe, oe, Ns, function(n) {
    hn(n, Qd);
  }, Oe, ce, ri, ea, Qo, { current: !1 }] };
  return function(n) {
    var a = n.findFiberByHostInstance;
    return Lg(i({}, n, { overrideHookState: null, overrideProps: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: Zt.ReactCurrentDispatcher, findHostInstanceByFiber: function(u) {
      return u = bo(u), u === null ? null : u.stateNode;
    }, findFiberByHostInstance: function(u) {
      return a ? a(u) : null;
    }, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null }));
  }({
    findFiberByHostInstance: Ao,
    bundleType: 0,
    version: "16.14.0",
    rendererPackageName: "react-dom"
  }), Sr.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = NS, Sr.createPortal = Sm, Sr.findDOMNode = function(n) {
    if (n == null)
      return null;
    if (n.nodeType === 1)
      return n;
    var a = n._reactInternalFiber;
    if (a === void 0)
      throw typeof n.render == "function" ? Error(c(188)) : Error(c(268, Object.keys(n)));
    return n = bo(a), n = n === null ? null : n.stateNode, n;
  }, Sr.flushSync = function(n, a) {
    if ((at & (Zi | jr)) !== zn)
      throw Error(c(187));
    var u = at;
    at |= 1;
    try {
      return xt(99, n.bind(null, a));
    } finally {
      at = u, Ri();
    }
  }, Sr.hydrate = function(n, a, u) {
    if (!ro(a))
      throw Error(c(200));
    return ru(null, n, a, !0, u);
  }, Sr.render = function(n, a, u) {
    if (!ro(a))
      throw Error(c(200));
    return ru(null, n, a, !1, u);
  }, Sr.unmountComponentAtNode = function(n) {
    if (!ro(n))
      throw Error(c(40));
    return n._reactRootContainer ? (um(function() {
      ru(null, null, n, !1, function() {
        n._reactRootContainer = null, n[Io] = null;
      });
    }), !0) : !1;
  }, Sr.unstable_batchedUpdates = lm, Sr.unstable_createPortal = function(n, a) {
    return Sm(n, a, 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null);
  }, Sr.unstable_renderSubtreeIntoContainer = function(n, a, u, f) {
    if (!ro(u))
      throw Error(c(200));
    if (n == null || n._reactInternalFiber === void 0)
      throw Error(c(38));
    return ru(n, a, u, !1, f);
  }, Sr.version = "16.14.0", Sr;
}
var xr = {}, Db = { exports: {} }, Sa = {};
/** @license React v0.19.1
 * scheduler-tracing.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var nM;
function pO() {
  if (nM)
    return Sa;
  nM = 1;
  var r = 0;
  return Sa.__interactionsRef = null, Sa.__subscriberRef = null, Sa.unstable_clear = function(i) {
    return i();
  }, Sa.unstable_getCurrent = function() {
    return null;
  }, Sa.unstable_getThreadID = function() {
    return ++r;
  }, Sa.unstable_subscribe = function() {
  }, Sa.unstable_trace = function(i, o, c) {
    return c();
  }, Sa.unstable_unsubscribe = function() {
  }, Sa.unstable_wrap = function(i) {
    return i;
  }, Sa;
}
var Nb = {};
/** @license React v0.19.1
 * scheduler-tracing.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var iM;
function mO() {
  return iM || (iM = 1, function(r) {
    process.env.NODE_ENV !== "production" && function() {
      var i = 0, o = 0, c = 0;
      r.__interactionsRef = null, r.__subscriberRef = null, r.__interactionsRef = {
        current: /* @__PURE__ */ new Set()
      }, r.__subscriberRef = {
        current: null
      };
      function h(se) {
        var Z = r.__interactionsRef.current;
        r.__interactionsRef.current = /* @__PURE__ */ new Set();
        try {
          return se();
        } finally {
          r.__interactionsRef.current = Z;
        }
      }
      function m() {
        return r.__interactionsRef.current;
      }
      function y() {
        return ++c;
      }
      function g(se, Z, ue) {
        var oe = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : i, Ne = {
          __count: 1,
          id: o++,
          name: se,
          timestamp: Z
        }, Fe = r.__interactionsRef.current, Pe = new Set(Fe);
        Pe.add(Ne), r.__interactionsRef.current = Pe;
        var Y = r.__subscriberRef.current, fe;
        try {
          Y !== null && Y.onInteractionTraced(Ne);
        } finally {
          try {
            Y !== null && Y.onWorkStarted(Pe, oe);
          } finally {
            try {
              fe = ue();
            } finally {
              r.__interactionsRef.current = Fe;
              try {
                Y !== null && Y.onWorkStopped(Pe, oe);
              } finally {
                Ne.__count--, Y !== null && Ne.__count === 0 && Y.onInteractionScheduledWorkCompleted(Ne);
              }
            }
          }
        }
        return fe;
      }
      function x(se) {
        var Z = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : i, ue = r.__interactionsRef.current, oe = r.__subscriberRef.current;
        oe !== null && oe.onWorkScheduled(ue, Z), ue.forEach(function(Pe) {
          Pe.__count++;
        });
        var Ne = !1;
        function Fe() {
          var Pe = r.__interactionsRef.current;
          r.__interactionsRef.current = ue, oe = r.__subscriberRef.current;
          try {
            var Y;
            try {
              oe !== null && oe.onWorkStarted(ue, Z);
            } finally {
              try {
                Y = se.apply(void 0, arguments);
              } finally {
                r.__interactionsRef.current = Pe, oe !== null && oe.onWorkStopped(ue, Z);
              }
            }
            return Y;
          } finally {
            Ne || (Ne = !0, ue.forEach(function(fe) {
              fe.__count--, oe !== null && fe.__count === 0 && oe.onInteractionScheduledWorkCompleted(fe);
            }));
          }
        }
        return Fe.cancel = function() {
          oe = r.__subscriberRef.current;
          try {
            oe !== null && oe.onWorkCanceled(ue, Z);
          } finally {
            ue.forEach(function(Y) {
              Y.__count--, oe && Y.__count === 0 && oe.onInteractionScheduledWorkCompleted(Y);
            });
          }
        }, Fe;
      }
      var C = null;
      C = /* @__PURE__ */ new Set();
      function I(se) {
        C.add(se), C.size === 1 && (r.__subscriberRef.current = {
          onInteractionScheduledWorkCompleted: $,
          onInteractionTraced: z,
          onWorkCanceled: he,
          onWorkScheduled: V,
          onWorkStarted: q,
          onWorkStopped: G
        });
      }
      function A(se) {
        C.delete(se), C.size === 0 && (r.__subscriberRef.current = null);
      }
      function z(se) {
        var Z = !1, ue = null;
        if (C.forEach(function(oe) {
          try {
            oe.onInteractionTraced(se);
          } catch (Ne) {
            Z || (Z = !0, ue = Ne);
          }
        }), Z)
          throw ue;
      }
      function $(se) {
        var Z = !1, ue = null;
        if (C.forEach(function(oe) {
          try {
            oe.onInteractionScheduledWorkCompleted(se);
          } catch (Ne) {
            Z || (Z = !0, ue = Ne);
          }
        }), Z)
          throw ue;
      }
      function V(se, Z) {
        var ue = !1, oe = null;
        if (C.forEach(function(Ne) {
          try {
            Ne.onWorkScheduled(se, Z);
          } catch (Fe) {
            ue || (ue = !0, oe = Fe);
          }
        }), ue)
          throw oe;
      }
      function q(se, Z) {
        var ue = !1, oe = null;
        if (C.forEach(function(Ne) {
          try {
            Ne.onWorkStarted(se, Z);
          } catch (Fe) {
            ue || (ue = !0, oe = Fe);
          }
        }), ue)
          throw oe;
      }
      function G(se, Z) {
        var ue = !1, oe = null;
        if (C.forEach(function(Ne) {
          try {
            Ne.onWorkStopped(se, Z);
          } catch (Fe) {
            ue || (ue = !0, oe = Fe);
          }
        }), ue)
          throw oe;
      }
      function he(se, Z) {
        var ue = !1, oe = null;
        if (C.forEach(function(Ne) {
          try {
            Ne.onWorkCanceled(se, Z);
          } catch (Fe) {
            ue || (ue = !0, oe = Fe);
          }
        }), ue)
          throw oe;
      }
      r.unstable_clear = h, r.unstable_getCurrent = m, r.unstable_getThreadID = y, r.unstable_subscribe = I, r.unstable_trace = g, r.unstable_unsubscribe = A, r.unstable_wrap = x;
    }();
  }(Nb)), Nb;
}
var rM;
function vO() {
  return rM || (rM = 1, function(r) {
    process.env.NODE_ENV === "production" ? r.exports = pO() : r.exports = mO();
  }(Db)), Db.exports;
}
/** @license React v16.14.0
 * react-dom.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var aM;
function gO() {
  return aM || (aM = 1, process.env.NODE_ENV !== "production" && function() {
    var r = hl.exports, i = wg(), o = VE(), c = jE(), h = vO(), m = r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    m.hasOwnProperty("ReactCurrentDispatcher") || (m.ReactCurrentDispatcher = {
      current: null
    }), m.hasOwnProperty("ReactCurrentBatchConfig") || (m.ReactCurrentBatchConfig = {
      suspense: null
    });
    function y(e) {
      {
        for (var t = arguments.length, s = new Array(t > 1 ? t - 1 : 0), l = 1; l < t; l++)
          s[l - 1] = arguments[l];
        x("warn", e, s);
      }
    }
    function g(e) {
      {
        for (var t = arguments.length, s = new Array(t > 1 ? t - 1 : 0), l = 1; l < t; l++)
          s[l - 1] = arguments[l];
        x("error", e, s);
      }
    }
    function x(e, t, s) {
      {
        var l = s.length > 0 && typeof s[s.length - 1] == "string" && s[s.length - 1].indexOf(`
    in`) === 0;
        if (!l) {
          var d = m.ReactDebugCurrentFrame, p = d.getStackAddendum();
          p !== "" && (t += "%s", s = s.concat([p]));
        }
        var w = s.map(function(N) {
          return "" + N;
        });
        w.unshift("Warning: " + t), Function.prototype.apply.call(console[e], console, w);
        try {
          var b = 0, E = "Warning: " + t.replace(/%s/g, function() {
            return s[b++];
          });
          throw new Error(E);
        } catch {
        }
      }
    }
    if (!r)
      throw Error("ReactDOM was loaded before React. Make sure you load the React package before loading ReactDOM.");
    var C = function(e, t, s, l, d, p, w, b, E) {
      var N = Array.prototype.slice.call(arguments, 3);
      try {
        t.apply(s, N);
      } catch (k) {
        this.onError(k);
      }
    };
    if (typeof window < "u" && typeof window.dispatchEvent == "function" && typeof document < "u" && typeof document.createEvent == "function") {
      var I = document.createElement("react"), A = function(e, t, s, l, d, p, w, b, E) {
        if (!(typeof document < "u"))
          throw Error("The `document` global was defined when React was initialized, but is not defined anymore. This can happen in a test environment if a component schedules an update from an asynchronous callback, but the test has already finished running. To solve this, you can either unmount the component at the end of your test (and ensure that any asynchronous operations get canceled in `componentWillUnmount`), or you can change the test itself to be asynchronous.");
        var N = document.createEvent("Event"), k = !0, J = window.event, L = Object.getOwnPropertyDescriptor(window, "event"), K = Array.prototype.slice.call(arguments, 3);
        function me() {
          I.removeEventListener(vt, me, !1), typeof window.event < "u" && window.hasOwnProperty("event") && (window.event = J), t.apply(s, K), k = !1;
        }
        var we, Ke = !1, nt = !1;
        function Pt(Qt) {
          if (we = Qt.error, Ke = !0, we === null && Qt.colno === 0 && Qt.lineno === 0 && (nt = !0), Qt.defaultPrevented && we != null && typeof we == "object")
            try {
              we._suppressLogging = !0;
            } catch {
            }
        }
        var vt = "react-" + (e || "invokeguardedcallback");
        window.addEventListener("error", Pt), I.addEventListener(vt, me, !1), N.initEvent(vt, !1, !1), I.dispatchEvent(N), L && Object.defineProperty(window, "event", L), k && (Ke ? nt && (we = new Error("A cross-origin error was thrown. React doesn't have access to the actual error object in development. See https://fb.me/react-crossorigin-error for more information.")) : we = new Error(`An error was thrown inside one of your components, but React doesn't know what it was. This is likely due to browser flakiness. React does its best to preserve the "Pause on exceptions" behavior of the DevTools, which requires some DEV-mode only tricks. It's possible that these don't work in your browser. Try triggering the error in production mode, or switching to a modern browser. If you suspect that this is actually an issue with React, please file an issue.`), this.onError(we)), window.removeEventListener("error", Pt);
      };
      C = A;
    }
    var z = C, $ = !1, V = null, q = !1, G = null, he = {
      onError: function(e) {
        $ = !0, V = e;
      }
    };
    function se(e, t, s, l, d, p, w, b, E) {
      $ = !1, V = null, z.apply(he, arguments);
    }
    function Z(e, t, s, l, d, p, w, b, E) {
      if (se.apply(this, arguments), $) {
        var N = Ne();
        q || (q = !0, G = N);
      }
    }
    function ue() {
      if (q) {
        var e = G;
        throw q = !1, G = null, e;
      }
    }
    function oe() {
      return $;
    }
    function Ne() {
      if ($) {
        var e = V;
        return $ = !1, V = null, e;
      } else
        throw Error("clearCaughtError was called but no error was captured. This error is likely caused by a bug in React. Please file an issue.");
    }
    var Fe = null, Pe = null, Y = null;
    function fe(e, t, s) {
      Fe = e, Pe = t, Y = s, (!Y || !Pe) && g("EventPluginUtils.setComponentTree(...): Injected module is missing getNodeFromInstance or getInstanceFromNode.");
    }
    var be;
    be = function(e) {
      var t = e._dispatchListeners, s = e._dispatchInstances, l = Array.isArray(t), d = l ? t.length : t ? 1 : 0, p = Array.isArray(s), w = p ? s.length : s ? 1 : 0;
      (p !== l || w !== d) && g("EventPluginUtils: Invalid `event`.");
    };
    function ie(e, t, s) {
      var l = e.type || "unknown-event";
      e.currentTarget = Y(s), Z(l, t, void 0, e), e.currentTarget = null;
    }
    function ct(e) {
      var t = e._dispatchListeners, s = e._dispatchInstances;
      if (be(e), Array.isArray(t))
        for (var l = 0; l < t.length && !e.isPropagationStopped(); l++)
          ie(e, t[l], s[l]);
      else
        t && ie(e, t, s);
      e._dispatchListeners = null, e._dispatchInstances = null;
    }
    var Oe = 0, ce = 1, Qe = 2, Se = 3, Ve = 4, Re = 5, $e = 6, Tt = 7, Bt = 8, Ge = 9, re = 10, D = 11, B = 12, ee = 13, Ce = 14, ge = 15, it = 16, Xe = 17, Be = 18, dt = 19, gt = 20, Zt = 21, Mt = 22, bn = null, Ft = {};
    function Ui() {
      if (!!bn)
        for (var e in Ft) {
          var t = Ft[e], s = bn.indexOf(e);
          if (!(s > -1))
            throw Error("EventPluginRegistry: Cannot inject event plugins that do not exist in the plugin ordering, `" + e + "`.");
          if (!ke[s]) {
            if (!t.extractEvents)
              throw Error("EventPluginRegistry: Event plugins must implement an `extractEvents` method, but `" + e + "` does not.");
            ke[s] = t;
            var l = t.eventTypes;
            for (var d in l)
              if (!Ci(l[d], t, d))
                throw Error("EventPluginRegistry: Failed to publish event `" + d + "` for plugin `" + e + "`.");
          }
        }
    }
    function Ci(e, t, s) {
      if (st.hasOwnProperty(s))
        throw Error("EventPluginRegistry: More than one plugin attempted to publish the same event name, `" + s + "`.");
      st[s] = e;
      var l = e.phasedRegistrationNames;
      if (l) {
        for (var d in l)
          if (l.hasOwnProperty(d)) {
            var p = l[d];
            Jn(p, t, s);
          }
        return !0;
      } else if (e.registrationName)
        return Jn(e.registrationName, t, s), !0;
      return !1;
    }
    function Jn(e, t, s) {
      if (He[e])
        throw Error("EventPluginRegistry: More than one plugin attempted to publish the same registration name, `" + e + "`.");
      He[e] = t, jt[e] = t.eventTypes[s].dependencies;
      {
        var l = e.toLowerCase();
        Sn[l] = e, e === "onDoubleClick" && (Sn.ondblclick = e);
      }
    }
    var ke = [], st = {}, He = {}, jt = {}, Sn = {};
    function ci(e) {
      if (bn)
        throw Error("EventPluginRegistry: Cannot inject event plugin ordering more than once. You are likely trying to load more than one copy of React.");
      bn = Array.prototype.slice.call(e), Ui();
    }
    function Mr(e) {
      var t = !1;
      for (var s in e)
        if (!!e.hasOwnProperty(s)) {
          var l = e[s];
          if (!Ft.hasOwnProperty(s) || Ft[s] !== l) {
            if (Ft[s])
              throw Error("EventPluginRegistry: Cannot inject two different event plugins using the same name, `" + s + "`.");
            Ft[s] = l, t = !0;
          }
        }
      t && Ui();
    }
    var jn = typeof window < "u" && typeof window.document < "u" && typeof window.document.createElement < "u", Gr = 1, Vi = 1 << 5, Ta = 1 << 6, Ma = null, di = null, tr = null;
    function fi(e) {
      var t = Pe(e);
      if (!!t) {
        if (typeof Ma != "function")
          throw Error("setRestoreImplementation() needs to be called to handle a target for controlled events. This error is likely caused by a bug in React. Please file an issue.");
        var s = t.stateNode;
        if (s) {
          var l = Fe(s);
          Ma(t.stateNode, t.type, l);
        }
      }
    }
    function Ea(e) {
      Ma = e;
    }
    function Ti(e) {
      di ? tr ? tr.push(e) : tr = [e] : di = e;
    }
    function Xr() {
      return di !== null || tr !== null;
    }
    function Cs() {
      if (!!di) {
        var e = di, t = tr;
        if (di = null, tr = null, fi(e), t)
          for (var s = 0; s < t.length; s++)
            fi(t[s]);
      }
    }
    var Er = !0, Ir = !1, vn = !1, qn = !1, Ia = function(e, t) {
      return e(t);
    }, kt = function(e, t, s, l, d) {
      return e(t, s, l, d);
    }, rn = function() {
    }, Mi = Ia, kn = !1, Ei = !1;
    function Kn() {
      var e = Xr();
      e && (rn(), Cs());
    }
    function Jr(e, t) {
      if (kn)
        return e(t);
      kn = !0;
      try {
        return Ia(e, t);
      } finally {
        kn = !1, Kn();
      }
    }
    function Aa(e, t, s) {
      if (Ei)
        return e(t, s);
      Ei = !0;
      try {
        return Mi(e, t, s);
      } finally {
        Ei = !1, Kn();
      }
    }
    function yo(e, t, s, l, d) {
      var p = kn;
      kn = !0;
      try {
        return kt(e, t, s, l, d);
      } finally {
        kn = p, kn || Kn();
      }
    }
    function wo(e) {
      !kn && !Ir && rn();
    }
    function Ts(e, t, s, l) {
      Ia = e, kt = t, rn = s, Mi = l;
    }
    var Ra = 0, _n = 1, Ar = 2, qr = 0, ei = 1, Rr = 2, Un = 3, nr = 4, Ms = 5, Kr = 6, Es = ":A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD", ne = Es + "\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040", de = "data-reactroot", Je = new RegExp("^[" + Es + "][" + ne + "]*$"), pt = Object.prototype.hasOwnProperty, Jt = {}, Yt = {};
    function fn(e) {
      return pt.call(Yt, e) ? !0 : pt.call(Jt, e) ? !1 : Je.test(e) ? (Yt[e] = !0, !0) : (Jt[e] = !0, g("Invalid attribute name: `%s`", e), !1);
    }
    function ti(e, t, s) {
      return t !== null ? t.type === qr : s ? !1 : e.length > 2 && (e[0] === "o" || e[0] === "O") && (e[1] === "n" || e[1] === "N");
    }
    function qt(e, t, s, l) {
      if (s !== null && s.type === qr)
        return !1;
      switch (typeof t) {
        case "function":
        case "symbol":
          return !0;
        case "boolean": {
          if (l)
            return !1;
          if (s !== null)
            return !s.acceptsBooleans;
          var d = e.toLowerCase().slice(0, 5);
          return d !== "data-" && d !== "aria-";
        }
        default:
          return !1;
      }
    }
    function Da(e, t, s, l) {
      if (t === null || typeof t > "u" || qt(e, t, s, l))
        return !0;
      if (l)
        return !1;
      if (s !== null)
        switch (s.type) {
          case Un:
            return !t;
          case nr:
            return t === !1;
          case Ms:
            return isNaN(t);
          case Kr:
            return isNaN(t) || t < 1;
        }
      return !1;
    }
    function bo(e) {
      return hn.hasOwnProperty(e) ? hn[e] : null;
    }
    function an(e, t, s, l, d, p) {
      this.acceptsBooleans = t === Rr || t === Un || t === nr, this.attributeName = l, this.attributeNamespace = d, this.mustUseProperty = s, this.propertyName = e, this.type = t, this.sanitizeURL = p;
    }
    var hn = {}, Is = [
      "children",
      "dangerouslySetInnerHTML",
      "defaultValue",
      "defaultChecked",
      "innerHTML",
      "suppressContentEditableWarning",
      "suppressHydrationWarning",
      "style"
    ];
    Is.forEach(function(e) {
      hn[e] = new an(
        e,
        qr,
        !1,
        e,
        null,
        !1
      );
    }), [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(e) {
      var t = e[0], s = e[1];
      hn[t] = new an(
        t,
        ei,
        !1,
        s,
        null,
        !1
      );
    }), ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(e) {
      hn[e] = new an(
        e,
        Rr,
        !1,
        e.toLowerCase(),
        null,
        !1
      );
    }), ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(e) {
      hn[e] = new an(
        e,
        Rr,
        !1,
        e,
        null,
        !1
      );
    }), [
      "allowFullScreen",
      "async",
      "autoFocus",
      "autoPlay",
      "controls",
      "default",
      "defer",
      "disabled",
      "disablePictureInPicture",
      "formNoValidate",
      "hidden",
      "loop",
      "noModule",
      "noValidate",
      "open",
      "playsInline",
      "readOnly",
      "required",
      "reversed",
      "scoped",
      "seamless",
      "itemScope"
    ].forEach(function(e) {
      hn[e] = new an(
        e,
        Un,
        !1,
        e.toLowerCase(),
        null,
        !1
      );
    }), [
      "checked",
      "multiple",
      "muted",
      "selected"
    ].forEach(function(e) {
      hn[e] = new an(
        e,
        Un,
        !0,
        e,
        null,
        !1
      );
    }), [
      "capture",
      "download"
    ].forEach(function(e) {
      hn[e] = new an(
        e,
        nr,
        !1,
        e,
        null,
        !1
      );
    }), [
      "cols",
      "rows",
      "size",
      "span"
    ].forEach(function(e) {
      hn[e] = new an(
        e,
        Kr,
        !1,
        e,
        null,
        !1
      );
    }), ["rowSpan", "start"].forEach(function(e) {
      hn[e] = new an(
        e,
        Ms,
        !1,
        e.toLowerCase(),
        null,
        !1
      );
    });
    var pl = /[\-\:]([a-z])/g, ea = function(e) {
      return e[1].toUpperCase();
    };
    [
      "accent-height",
      "alignment-baseline",
      "arabic-form",
      "baseline-shift",
      "cap-height",
      "clip-path",
      "clip-rule",
      "color-interpolation",
      "color-interpolation-filters",
      "color-profile",
      "color-rendering",
      "dominant-baseline",
      "enable-background",
      "fill-opacity",
      "fill-rule",
      "flood-color",
      "flood-opacity",
      "font-family",
      "font-size",
      "font-size-adjust",
      "font-stretch",
      "font-style",
      "font-variant",
      "font-weight",
      "glyph-name",
      "glyph-orientation-horizontal",
      "glyph-orientation-vertical",
      "horiz-adv-x",
      "horiz-origin-x",
      "image-rendering",
      "letter-spacing",
      "lighting-color",
      "marker-end",
      "marker-mid",
      "marker-start",
      "overline-position",
      "overline-thickness",
      "paint-order",
      "panose-1",
      "pointer-events",
      "rendering-intent",
      "shape-rendering",
      "stop-color",
      "stop-opacity",
      "strikethrough-position",
      "strikethrough-thickness",
      "stroke-dasharray",
      "stroke-dashoffset",
      "stroke-linecap",
      "stroke-linejoin",
      "stroke-miterlimit",
      "stroke-opacity",
      "stroke-width",
      "text-anchor",
      "text-decoration",
      "text-rendering",
      "underline-position",
      "underline-thickness",
      "unicode-bidi",
      "unicode-range",
      "units-per-em",
      "v-alphabetic",
      "v-hanging",
      "v-ideographic",
      "v-mathematical",
      "vector-effect",
      "vert-adv-y",
      "vert-origin-x",
      "vert-origin-y",
      "word-spacing",
      "writing-mode",
      "xmlns:xlink",
      "x-height"
    ].forEach(function(e) {
      var t = e.replace(pl, ea);
      hn[t] = new an(
        t,
        ei,
        !1,
        e,
        null,
        !1
      );
    }), [
      "xlink:actuate",
      "xlink:arcrole",
      "xlink:role",
      "xlink:show",
      "xlink:title",
      "xlink:type"
    ].forEach(function(e) {
      var t = e.replace(pl, ea);
      hn[t] = new an(
        t,
        ei,
        !1,
        e,
        "http://www.w3.org/1999/xlink",
        !1
      );
    }), [
      "xml:base",
      "xml:lang",
      "xml:space"
    ].forEach(function(e) {
      var t = e.replace(pl, ea);
      hn[t] = new an(
        t,
        ei,
        !1,
        e,
        "http://www.w3.org/XML/1998/namespace",
        !1
      );
    }), ["tabIndex", "crossOrigin"].forEach(function(e) {
      hn[e] = new an(
        e,
        ei,
        !1,
        e.toLowerCase(),
        null,
        !1
      );
    });
    var ml = "xlinkHref";
    hn[ml] = new an(
      "xlinkHref",
      ei,
      !1,
      "xlink:href",
      "http://www.w3.org/1999/xlink",
      !0
    ), ["src", "href", "action", "formAction"].forEach(function(e) {
      hn[e] = new an(
        e,
        ei,
        !1,
        e.toLowerCase(),
        null,
        !0
      );
    }), m.ReactDebugCurrentFrame;
    var Lu = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*\:/i, As = !1;
    function vl(e) {
      !As && Lu.test(e) && (As = !0, g("A future version of React will block javascript: URLs as a security precaution. Use event handlers instead if you can. If you need to generate unsafe HTML try using dangerouslySetInnerHTML instead. React was passed %s.", JSON.stringify(e)));
    }
    function Bu(e, t, s, l) {
      if (l.mustUseProperty) {
        var d = l.propertyName;
        return e[d];
      } else {
        l.sanitizeURL && vl("" + s);
        var p = l.attributeName, w = null;
        if (l.type === nr) {
          if (e.hasAttribute(p)) {
            var b = e.getAttribute(p);
            return b === "" ? !0 : Da(t, s, l, !1) ? b : b === "" + s ? s : b;
          }
        } else if (e.hasAttribute(p)) {
          if (Da(t, s, l, !1))
            return e.getAttribute(p);
          if (l.type === Un)
            return s;
          w = e.getAttribute(p);
        }
        return Da(t, s, l, !1) ? w === null ? s : w : w === "" + s ? s : w;
      }
    }
    function gl(e, t, s) {
      {
        if (!fn(t))
          return;
        if (!e.hasAttribute(t))
          return s === void 0 ? void 0 : null;
        var l = e.getAttribute(t);
        return l === "" + s ? s : l;
      }
    }
    function M(e, t, s, l) {
      var d = bo(t);
      if (!ti(t, d, l)) {
        if (Da(t, s, d, l) && (s = null), l || d === null) {
          if (fn(t)) {
            var p = t;
            s === null ? e.removeAttribute(p) : e.setAttribute(p, "" + s);
          }
          return;
        }
        var w = d.mustUseProperty;
        if (w) {
          var b = d.propertyName;
          if (s === null) {
            var E = d.type;
            e[b] = E === Un ? !1 : "";
          } else
            e[b] = s;
          return;
        }
        var N = d.attributeName, k = d.attributeNamespace;
        if (s === null)
          e.removeAttribute(N);
        else {
          var J = d.type, L;
          J === Un || J === nr && s === !0 ? L = "" : (L = "" + s, d.sanitizeURL && vl(L.toString())), k ? e.setAttributeNS(k, N, L) : e.setAttribute(N, L);
        }
      }
    }
    var _ = /^(.*)[\\\/]/;
    function H(e, t, s) {
      var l = "";
      if (t) {
        var d = t.fileName, p = d.replace(_, "");
        if (/^index\./.test(p)) {
          var w = d.match(_);
          if (w) {
            var b = w[1];
            if (b) {
              var E = b.replace(_, "");
              p = E + "/" + p;
            }
          }
        }
        l = " (at " + p + ":" + t.lineNumber + ")";
      } else
        s && (l = " (created by " + s + ")");
      return `
    in ` + (e || "Unknown") + l;
    }
    var X = typeof Symbol == "function" && Symbol.for, xe = X ? Symbol.for("react.element") : 60103, Ze = X ? Symbol.for("react.portal") : 60106, je = X ? Symbol.for("react.fragment") : 60107, et = X ? Symbol.for("react.strict_mode") : 60108, Nt = X ? Symbol.for("react.profiler") : 60114, gn = X ? Symbol.for("react.provider") : 60109, xn = X ? Symbol.for("react.context") : 60110, Mn = X ? Symbol.for("react.concurrent_mode") : 60111, ni = X ? Symbol.for("react.forward_ref") : 60112, ii = X ? Symbol.for("react.suspense") : 60113, So = X ? Symbol.for("react.suspense_list") : 60120, ta = X ? Symbol.for("react.memo") : 60115, ir = X ? Symbol.for("react.lazy") : 60116, xo = X ? Symbol.for("react.block") : 60121, mp = typeof Symbol == "function" && Symbol.iterator, bg = "@@iterator";
    function Dr(e) {
      if (e === null || typeof e != "object")
        return null;
      var t = mp && e[mp] || e[bg];
      return typeof t == "function" ? t : null;
    }
    var vp = -1, Pd = 0, Rs = 1, gp = 2;
    function zd(e) {
      return e._status === Rs ? e._result : null;
    }
    function yp(e) {
      if (e._status === vp) {
        e._status = Pd;
        var t = e._ctor, s = t();
        e._result = s, s.then(function(l) {
          if (e._status === Pd) {
            var d = l.default;
            d === void 0 && g(`lazy: Expected the result of a dynamic import() call. Instead received: %s

Your code should look like: 
  const MyComponent = lazy(() => import('./MyComponent'))`, l), e._status = Rs, e._result = d;
          }
        }, function(l) {
          e._status === Pd && (e._status = gp, e._result = l);
        });
      }
    }
    function Od(e, t, s) {
      var l = t.displayName || t.name || "";
      return e.displayName || (l !== "" ? s + "(" + l + ")" : s);
    }
    function Te(e) {
      if (e == null)
        return null;
      if (typeof e.tag == "number" && g("Received an unexpected object in getComponentName(). This is likely a bug in React. Please file an issue."), typeof e == "function")
        return e.displayName || e.name || null;
      if (typeof e == "string")
        return e;
      switch (e) {
        case je:
          return "Fragment";
        case Ze:
          return "Portal";
        case Nt:
          return "Profiler";
        case et:
          return "StrictMode";
        case ii:
          return "Suspense";
        case So:
          return "SuspenseList";
      }
      if (typeof e == "object")
        switch (e.$$typeof) {
          case xn:
            return "Context.Consumer";
          case gn:
            return "Context.Provider";
          case ni:
            return Od(e, e.render, "ForwardRef");
          case ta:
            return Te(e.type);
          case xo:
            return Te(e.render);
          case ir: {
            var t = e, s = zd(t);
            if (s)
              return Te(s);
            break;
          }
        }
      return null;
    }
    var ju = m.ReactDebugCurrentFrame;
    function wp(e) {
      switch (e.tag) {
        case Se:
        case Ve:
        case $e:
        case Tt:
        case re:
        case Ge:
          return "";
        default:
          var t = e._debugOwner, s = e._debugSource, l = Te(e.type), d = null;
          return t && (d = Te(t.type)), H(l, s, d);
      }
    }
    function $n(e) {
      var t = "", s = e;
      do
        t += wp(s), s = s.return;
      while (s);
      return t;
    }
    var na = null, yl = !1;
    function Na() {
      {
        if (na === null)
          return null;
        var e = na._debugOwner;
        if (e !== null && typeof e < "u")
          return Te(e.type);
      }
      return null;
    }
    function ft() {
      return na === null ? "" : $n(na);
    }
    function rr() {
      ju.getCurrentStack = null, na = null, yl = !1;
    }
    function Co(e) {
      ju.getCurrentStack = ft, na = e, yl = !1;
    }
    function Nr(e) {
      yl = e;
    }
    function ri(e) {
      return "" + e;
    }
    function kr(e) {
      switch (typeof e) {
        case "boolean":
        case "number":
        case "object":
        case "string":
        case "undefined":
          return e;
        default:
          return "";
      }
    }
    var To = null, Uu = {
      checkPropTypes: null
    };
    {
      To = m.ReactDebugCurrentFrame;
      var bp = {
        button: !0,
        checkbox: !0,
        image: !0,
        hidden: !0,
        radio: !0,
        reset: !0,
        submit: !0
      }, Sp = {
        value: function(e, t, s) {
          return bp[e.type] || e.onChange || e.readOnly || e.disabled || e[t] == null || Ir ? null : new Error("You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`.");
        },
        checked: function(e, t, s) {
          return e.onChange || e.readOnly || e.disabled || e[t] == null || Ir ? null : new Error("You provided a `checked` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultChecked`. Otherwise, set either `onChange` or `readOnly`.");
        }
      };
      Uu.checkPropTypes = function(e, t) {
        c(Sp, t, "prop", e, To.getStackAddendum);
      };
    }
    function xp(e) {
      var t = e.type, s = e.nodeName;
      return s && s.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
    }
    function Vu(e) {
      return e._valueTracker;
    }
    function Ld(e) {
      e._valueTracker = null;
    }
    function Cp(e) {
      var t = "";
      return e && (xp(e) ? t = e.checked ? "true" : "false" : t = e.value), t;
    }
    function ia(e) {
      var t = xp(e) ? "checked" : "value", s = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), l = "" + e[t];
      if (!(e.hasOwnProperty(t) || typeof s > "u" || typeof s.get != "function" || typeof s.set != "function")) {
        var d = s.get, p = s.set;
        Object.defineProperty(e, t, {
          configurable: !0,
          get: function() {
            return d.call(this);
          },
          set: function(b) {
            l = "" + b, p.call(this, b);
          }
        }), Object.defineProperty(e, t, {
          enumerable: s.enumerable
        });
        var w = {
          getValue: function() {
            return l;
          },
          setValue: function(b) {
            l = "" + b;
          },
          stopTracking: function() {
            Ld(e), delete e[t];
          }
        };
        return w;
      }
    }
    function Ds(e) {
      Vu(e) || (e._valueTracker = ia(e));
    }
    function Hu(e) {
      if (!e)
        return !1;
      var t = Vu(e);
      if (!t)
        return !0;
      var s = t.getValue(), l = Cp(e);
      return l !== s ? (t.setValue(l), !0) : !1;
    }
    var Bd = !1, jd = !1, Ud = !1, Vd = !1;
    function Wu(e) {
      var t = e.type === "checkbox" || e.type === "radio";
      return t ? e.checked != null : e.value != null;
    }
    function Fu(e, t) {
      var s = e, l = t.checked, d = i({}, t, {
        defaultChecked: void 0,
        defaultValue: void 0,
        value: void 0,
        checked: l != null ? l : s._wrapperState.initialChecked
      });
      return d;
    }
    function Hd(e, t) {
      Uu.checkPropTypes("input", t), t.checked !== void 0 && t.defaultChecked !== void 0 && !jd && (g("%s contains an input of type %s with both checked and defaultChecked props. Input elements must be either controlled or uncontrolled (specify either the checked prop, or the defaultChecked prop, but not both). Decide between using a controlled or uncontrolled input element and remove one of these props. More info: https://fb.me/react-controlled-components", Na() || "A component", t.type), jd = !0), t.value !== void 0 && t.defaultValue !== void 0 && !Bd && (g("%s contains an input of type %s with both value and defaultValue props. Input elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled input element and remove one of these props. More info: https://fb.me/react-controlled-components", Na() || "A component", t.type), Bd = !0);
      var s = e, l = t.defaultValue == null ? "" : t.defaultValue;
      s._wrapperState = {
        initialChecked: t.checked != null ? t.checked : t.defaultChecked,
        initialValue: kr(t.value != null ? t.value : l),
        controlled: Wu(t)
      };
    }
    function $u(e, t) {
      var s = e, l = t.checked;
      l != null && M(s, "checked", l, !1);
    }
    function wl(e, t) {
      var s = e;
      {
        var l = Wu(t);
        !s._wrapperState.controlled && l && !Vd && (g("A component is changing an uncontrolled input of type %s to be controlled. Input elements should not switch from uncontrolled to controlled (or vice versa). Decide between using a controlled or uncontrolled input element for the lifetime of the component. More info: https://fb.me/react-controlled-components", t.type), Vd = !0), s._wrapperState.controlled && !l && !Ud && (g("A component is changing a controlled input of type %s to be uncontrolled. Input elements should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled input element for the lifetime of the component. More info: https://fb.me/react-controlled-components", t.type), Ud = !0);
      }
      $u(e, t);
      var d = kr(t.value), p = t.type;
      if (d != null)
        p === "number" ? (d === 0 && s.value === "" || s.value != d) && (s.value = ri(d)) : s.value !== ri(d) && (s.value = ri(d));
      else if (p === "submit" || p === "reset") {
        s.removeAttribute("value");
        return;
      }
      t.hasOwnProperty("value") ? bl(s, t.type, d) : t.hasOwnProperty("defaultValue") && bl(s, t.type, kr(t.defaultValue)), t.checked == null && t.defaultChecked != null && (s.defaultChecked = !!t.defaultChecked);
    }
    function Qu(e, t, s) {
      var l = e;
      if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
        var d = t.type, p = d === "submit" || d === "reset";
        if (p && (t.value === void 0 || t.value === null))
          return;
        var w = ri(l._wrapperState.initialValue);
        s || w !== l.value && (l.value = w), l.defaultValue = w;
      }
      var b = l.name;
      b !== "" && (l.name = ""), l.defaultChecked = !l.defaultChecked, l.defaultChecked = !!l._wrapperState.initialChecked, b !== "" && (l.name = b);
    }
    function Wd(e, t) {
      var s = e;
      wl(s, t), Tp(s, t);
    }
    function Tp(e, t) {
      var s = t.name;
      if (t.type === "radio" && s != null) {
        for (var l = e; l.parentNode; )
          l = l.parentNode;
        for (var d = l.querySelectorAll("input[name=" + JSON.stringify("" + s) + '][type="radio"]'), p = 0; p < d.length; p++) {
          var w = d[p];
          if (!(w === e || w.form !== e.form)) {
            var b = Wg(w);
            if (!b)
              throw Error("ReactDOMInput: Mixing React and non-React radio inputs with the same `name` is not supported.");
            Hu(w), wl(w, b);
          }
        }
      }
    }
    function bl(e, t, s) {
      (t !== "number" || e.ownerDocument.activeElement !== e) && (s == null ? e.defaultValue = ri(e._wrapperState.initialValue) : e.defaultValue !== ri(s) && (e.defaultValue = ri(s)));
    }
    var Zu = !1, Mp = !1;
    function Mo(e) {
      var t = "";
      return r.Children.forEach(e, function(s) {
        s != null && (t += s);
      }), t;
    }
    function Fd(e, t) {
      typeof t.children == "object" && t.children !== null && r.Children.forEach(t.children, function(s) {
        s != null && (typeof s == "string" || typeof s == "number" || typeof s.type == "string" && (Mp || (Mp = !0, g("Only strings and numbers are supported as <option> children."))));
      }), t.selected != null && !Zu && (g("Use the `defaultValue` or `value` props on <select> instead of setting `selected` on <option>."), Zu = !0);
    }
    function $d(e, t) {
      t.value != null && e.setAttribute("value", ri(kr(t.value)));
    }
    function _r(e, t) {
      var s = i({
        children: void 0
      }, t), l = Mo(t.children);
      return l && (s.children = l), s;
    }
    var Eo;
    Eo = !1;
    function Io() {
      var e = Na();
      return e ? `

Check the render method of \`` + e + "`." : "";
    }
    var Ao = ["value", "defaultValue"];
    function Sl(e) {
      {
        Uu.checkPropTypes("select", e);
        for (var t = 0; t < Ao.length; t++) {
          var s = Ao[t];
          if (e[s] != null) {
            var l = Array.isArray(e[s]);
            e.multiple && !l ? g("The `%s` prop supplied to <select> must be an array if `multiple` is true.%s", s, Io()) : !e.multiple && l && g("The `%s` prop supplied to <select> must be a scalar value if `multiple` is false.%s", s, Io());
          }
        }
      }
    }
    function Hi(e, t, s, l) {
      var d = e.options;
      if (t) {
        for (var p = s, w = {}, b = 0; b < p.length; b++)
          w["$" + p[b]] = !0;
        for (var E = 0; E < d.length; E++) {
          var N = w.hasOwnProperty("$" + d[E].value);
          d[E].selected !== N && (d[E].selected = N), N && l && (d[E].defaultSelected = !0);
        }
      } else {
        for (var k = ri(kr(s)), J = null, L = 0; L < d.length; L++) {
          if (d[L].value === k) {
            d[L].selected = !0, l && (d[L].defaultSelected = !0);
            return;
          }
          J === null && !d[L].disabled && (J = d[L]);
        }
        J !== null && (J.selected = !0);
      }
    }
    function xl(e, t) {
      return i({}, t, {
        value: void 0
      });
    }
    function Pr(e, t) {
      var s = e;
      Sl(t), s._wrapperState = {
        wasMultiple: !!t.multiple
      }, t.value !== void 0 && t.defaultValue !== void 0 && !Eo && (g("Select elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled select element and remove one of these props. More info: https://fb.me/react-controlled-components"), Eo = !0);
    }
    function Ep(e, t) {
      var s = e;
      s.multiple = !!t.multiple;
      var l = t.value;
      l != null ? Hi(s, !!t.multiple, l, !1) : t.defaultValue != null && Hi(s, !!t.multiple, t.defaultValue, !0);
    }
    function Ip(e, t) {
      var s = e, l = s._wrapperState.wasMultiple;
      s._wrapperState.wasMultiple = !!t.multiple;
      var d = t.value;
      d != null ? Hi(s, !!t.multiple, d, !1) : l !== !!t.multiple && (t.defaultValue != null ? Hi(s, !!t.multiple, t.defaultValue, !0) : Hi(s, !!t.multiple, t.multiple ? [] : "", !1));
    }
    function Sg(e, t) {
      var s = e, l = t.value;
      l != null && Hi(s, !!t.multiple, l, !1);
    }
    var Yu = !1;
    function Qd(e, t) {
      var s = e;
      if (t.dangerouslySetInnerHTML != null)
        throw Error("`dangerouslySetInnerHTML` does not make sense on <textarea>.");
      var l = i({}, t, {
        value: void 0,
        defaultValue: void 0,
        children: ri(s._wrapperState.initialValue)
      });
      return l;
    }
    function Ns(e, t) {
      var s = e;
      Uu.checkPropTypes("textarea", t), t.value !== void 0 && t.defaultValue !== void 0 && !Yu && (g("%s contains a textarea with both value and defaultValue props. Textarea elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled textarea and remove one of these props. More info: https://fb.me/react-controlled-components", Na() || "A component"), Yu = !0);
      var l = t.value;
      if (l == null) {
        var d = t.children, p = t.defaultValue;
        if (d != null) {
          g("Use the `defaultValue` or `value` props instead of setting children on <textarea>.");
          {
            if (p != null)
              throw Error("If you supply `defaultValue` on a <textarea>, do not pass children.");
            if (Array.isArray(d)) {
              if (!(d.length <= 1))
                throw Error("<textarea> can only have at most one child.");
              d = d[0];
            }
            p = d;
          }
        }
        p == null && (p = ""), l = p;
      }
      s._wrapperState = {
        initialValue: kr(l)
      };
    }
    function ra(e, t) {
      var s = e, l = kr(t.value), d = kr(t.defaultValue);
      if (l != null) {
        var p = ri(l);
        p !== s.value && (s.value = p), t.defaultValue == null && s.defaultValue !== p && (s.defaultValue = p);
      }
      d != null && (s.defaultValue = ri(d));
    }
    function Gu(e, t) {
      var s = e, l = s.textContent;
      l === s._wrapperState.initialValue && l !== "" && l !== null && (s.value = l);
    }
    function Xu(e, t) {
      ra(e, t);
    }
    var Cl = "http://www.w3.org/1999/xhtml", Tl = "http://www.w3.org/1998/Math/MathML", Ro = "http://www.w3.org/2000/svg", hi = {
      html: Cl,
      mathml: Tl,
      svg: Ro
    };
    function Zd(e) {
      switch (e) {
        case "svg":
          return Ro;
        case "math":
          return Tl;
        default:
          return Cl;
      }
    }
    function Yd(e, t) {
      return e == null || e === Cl ? Zd(t) : e === Ro && t === "foreignObject" ? Cl : e;
    }
    var Ap = function(e) {
      return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, s, l, d) {
        MSApp.execUnsafeLocalFunction(function() {
          return e(t, s, l, d);
        });
      } : e;
    }, Ju, Rp = Ap(function(e, t) {
      if (e.namespaceURI === hi.svg && !("innerHTML" in e)) {
        Ju = Ju || document.createElement("div"), Ju.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>";
        for (var s = Ju.firstChild; e.firstChild; )
          e.removeChild(e.firstChild);
        for (; s.firstChild; )
          e.appendChild(s.firstChild);
        return;
      }
      e.innerHTML = t;
    }), ar = 1, sr = 3, ai = 8, ka = 9, qu = 11, Ml = function(e, t) {
      if (t) {
        var s = e.firstChild;
        if (s && s === e.lastChild && s.nodeType === sr) {
          s.nodeValue = t;
          return;
        }
      }
      e.textContent = t;
    };
    function _a(e) {
      return e;
    }
    function xg(e) {
      return e;
    }
    function El(e, t) {
      var s = {};
      return s[e.toLowerCase()] = t.toLowerCase(), s["Webkit" + e] = "webkit" + t, s["Moz" + e] = "moz" + t, s;
    }
    var ks = {
      animationend: El("Animation", "AnimationEnd"),
      animationiteration: El("Animation", "AnimationIteration"),
      animationstart: El("Animation", "AnimationStart"),
      transitionend: El("Transition", "TransitionEnd")
    }, Pa = {}, Dp = {};
    jn && (Dp = document.createElement("div").style, "AnimationEvent" in window || (delete ks.animationend.animation, delete ks.animationiteration.animation, delete ks.animationstart.animation), "TransitionEvent" in window || delete ks.transitionend.transition);
    function Ku(e) {
      if (Pa[e])
        return Pa[e];
      if (!ks[e])
        return e;
      var t = ks[e];
      for (var s in t)
        if (t.hasOwnProperty(s) && s in Dp)
          return Pa[e] = t[s];
      return e;
    }
    var Gd = "abort", Np = Ku("animationend"), Xd = Ku("animationiteration"), Jd = Ku("animationstart"), Vn = "blur", _s = "canplay", Ps = "canplaythrough", ec = "cancel", za = "change", Il = "click", Do = "close", aa = "compositionend", Al = "compositionstart", qd = "compositionupdate", Rl = "contextmenu", Kd = "copy", ef = "cut", tf = "dblclick", zs = "auxclick", kp = "drag", Dl = "dragend", Os = "dragenter", nf = "dragexit", Nl = "dragleave", rf = "dragover", tc = "dragstart", Ls = "drop", nc = "durationchange", Bs = "emptied", af = "encrypted", sf = "ended", Ii = "error", Wi = "focus", sa = "gotpointercapture", kl = "input", zr = "invalid", Hn = "keydown", Fi = "keypress", si = "keyup", Oa = "load", ic = "loadstart", of = "loadeddata", lf = "loadedmetadata", rc = "lostpointercapture", oa = "mousedown", _l = "mousemove", La = "mouseout", la = "mouseover", Pl = "mouseup", zl = "paste", uf = "pause", cf = "play", df = "playing", ff = "pointercancel", hf = "pointerdown", ac = "pointermove", Ai = "pointerout", St = "pointerover", sn = "pointerup", Or = "progress", Pn = "ratechange", En = "reset", Lr = "scroll", Ba = "seeked", Qn = "seeking", ja = "selectionchange", sc = "stalled", js = "submit", No = "suspend", Ol = "textInput", pf = "timeupdate", ko = "toggle", oc = "touchcancel", lc = "touchend", uc = "touchmove", mf = "touchstart", Ll = Ku("transitionend"), cc = "volumechange", dc = "waiting", vf = "wheel", _o = [Gd, _s, Ps, nc, Bs, af, sf, Ii, of, lf, ic, uf, cf, df, Or, Pn, Ba, Qn, sc, No, pf, cc, dc];
    function gf(e) {
      return e;
    }
    var Cg = typeof WeakMap == "function" ? WeakMap : Map, _p = new Cg();
    function or(e) {
      var t = _p.get(e);
      return t === void 0 && (t = /* @__PURE__ */ new Map(), _p.set(e, t)), t;
    }
    function ua(e) {
      return e._reactInternalFiber;
    }
    function yf(e) {
      return e._reactInternalFiber !== void 0;
    }
    function Pp(e, t) {
      e._reactInternalFiber = t;
    }
    var _t = 0, lr = 1, Cn = 2, xt = 4, zp = 6, Us = 8, Ri = 16, wf = 32, Ut = 64, pi = 128, Ua = 256, Va = 512, $i = 1024, fc = 1028, bf = 932, Sf = 2047, Po = 2048, mi = 4096, Qi = m.ReactCurrentOwner;
    function vi(e) {
      var t = e, s = e;
      if (e.alternate)
        for (; t.return; )
          t = t.return;
      else {
        var l = t;
        do
          t = l, (t.effectTag & (Cn | $i)) !== _t && (s = t.return), l = t.return;
        while (l);
      }
      return t.tag === Se ? s : null;
    }
    function hc(e) {
      if (e.tag === ee) {
        var t = e.memoizedState;
        if (t === null) {
          var s = e.alternate;
          s !== null && (t = s.memoizedState);
        }
        if (t !== null)
          return t.dehydrated;
      }
      return null;
    }
    function pc(e) {
      return e.tag === Se ? e.stateNode.containerInfo : null;
    }
    function Ha(e) {
      return vi(e) === e;
    }
    function Wa(e) {
      {
        var t = Qi.current;
        if (t !== null && t.tag === ce) {
          var s = t, l = s.stateNode;
          l._warnedAboutRefsInRender || g("%s is accessing isMounted inside its render() function. render() should be a pure function of props and state. It should never access something that requires stale data from the previous render, such as refs. Move this logic to componentDidMount and componentDidUpdate instead.", Te(s.type) || "A component"), l._warnedAboutRefsInRender = !0;
        }
      }
      var d = ua(e);
      return d ? vi(d) === d : !1;
    }
    function xf(e) {
      if (vi(e) !== e)
        throw Error("Unable to find node on an unmounted component.");
    }
    function zo(e) {
      var t = e.alternate;
      if (!t) {
        var s = vi(e);
        if (s === null)
          throw Error("Unable to find node on an unmounted component.");
        return s !== e ? null : e;
      }
      for (var l = e, d = t; ; ) {
        var p = l.return;
        if (p === null)
          break;
        var w = p.alternate;
        if (w === null) {
          var b = p.return;
          if (b !== null) {
            l = d = b;
            continue;
          }
          break;
        }
        if (p.child === w.child) {
          for (var E = p.child; E; ) {
            if (E === l)
              return xf(p), e;
            if (E === d)
              return xf(p), t;
            E = E.sibling;
          }
          throw Error("Unable to find node on an unmounted component.");
        }
        if (l.return !== d.return)
          l = p, d = w;
        else {
          for (var N = !1, k = p.child; k; ) {
            if (k === l) {
              N = !0, l = p, d = w;
              break;
            }
            if (k === d) {
              N = !0, d = p, l = w;
              break;
            }
            k = k.sibling;
          }
          if (!N) {
            for (k = w.child; k; ) {
              if (k === l) {
                N = !0, l = w, d = p;
                break;
              }
              if (k === d) {
                N = !0, d = w, l = p;
                break;
              }
              k = k.sibling;
            }
            if (!N)
              throw Error("Child was not found in either parent set. This indicates a bug in React related to the return pointer. Please file an issue.");
          }
        }
        if (l.alternate !== d)
          throw Error("Return fibers should always be each others' alternates. This error is likely caused by a bug in React. Please file an issue.");
      }
      if (l.tag !== Se)
        throw Error("Unable to find node on an unmounted component.");
      return l.stateNode.current === l ? e : t;
    }
    function Cf(e) {
      var t = zo(e);
      if (!t)
        return null;
      for (var s = t; ; ) {
        if (s.tag === Re || s.tag === $e)
          return s;
        if (s.child) {
          s.child.return = s, s = s.child;
          continue;
        }
        if (s === t)
          return null;
        for (; !s.sibling; ) {
          if (!s.return || s.return === t)
            return null;
          s = s.return;
        }
        s.sibling.return = s.return, s = s.sibling;
      }
      return null;
    }
    function Bl(e) {
      var t = zo(e);
      if (!t)
        return null;
      for (var s = t; ; ) {
        if (s.tag === Re || s.tag === $e || vn)
          return s;
        if (s.child && s.tag !== Ve) {
          s.child.return = s, s = s.child;
          continue;
        }
        if (s === t)
          return null;
        for (; !s.sibling; ) {
          if (!s.return || s.return === t)
            return null;
          s = s.return;
        }
        s.sibling.return = s.return, s = s.sibling;
      }
      return null;
    }
    function Vs(e, t) {
      if (t == null)
        throw Error("accumulateInto(...): Accumulated items must not be null or undefined.");
      return e == null ? t : Array.isArray(e) ? Array.isArray(t) ? (e.push.apply(e, t), e) : (e.push(t), e) : Array.isArray(t) ? [e].concat(t) : [e, t];
    }
    function Oo(e, t, s) {
      Array.isArray(e) ? e.forEach(t, s) : e && t.call(s, e);
    }
    var Fa = null, Op = function(e) {
      e && (ct(e), e.isPersistent() || e.constructor.release(e));
    }, Lp = function(e) {
      return Op(e);
    };
    function mc(e) {
      e !== null && (Fa = Vs(Fa, e));
      var t = Fa;
      if (Fa = null, !!t) {
        if (Oo(t, Lp), Fa)
          throw Error("processEventQueue(): Additional events were enqueued while processing an event queue. Support for this has not yet been implemented.");
        ue();
      }
    }
    function jl(e) {
      var t = e.target || e.srcElement || window;
      return t.correspondingUseElement && (t = t.correspondingUseElement), t.nodeType === sr ? t.parentNode : t;
    }
    /**
     * Checks if an event is supported in the current execution environment.
     *
     * NOTE: This will not work correctly for non-generic events such as `change`,
     * `reset`, `load`, `error`, and `select`.
     *
     * Borrows from Modernizr.
     *
     * @param {string} eventNameSuffix Event name, e.g. "click".
     * @return {boolean} True if the event is supported.
     * @internal
     * @license Modernizr 3.0.0pre (Custom Build) | MIT
     */
    function Ul(e) {
      if (!jn)
        return !1;
      var t = "on" + e, s = t in document;
      if (!s) {
        var l = document.createElement("div");
        l.setAttribute(t, "return;"), s = typeof l[t] == "function";
      }
      return s;
    }
    var Vl = 10, Hs = [];
    function Bp(e) {
      e.topLevelType = null, e.nativeEvent = null, e.targetInst = null, e.ancestors.length = 0, Hs.length < Vl && Hs.push(e);
    }
    function Lo(e, t, s, l) {
      if (Hs.length) {
        var d = Hs.pop();
        return d.topLevelType = e, d.eventSystemFlags = l, d.nativeEvent = t, d.targetInst = s, d;
      }
      return {
        topLevelType: e,
        eventSystemFlags: l,
        nativeEvent: t,
        targetInst: s,
        ancestors: []
      };
    }
    function Tf(e) {
      if (e.tag === Se)
        return e.stateNode.containerInfo;
      for (; e.return; )
        e = e.return;
      return e.tag !== Se ? null : e.stateNode.containerInfo;
    }
    function Hl(e, t, s, l, d) {
      for (var p = null, w = 0; w < ke.length; w++) {
        var b = ke[w];
        if (b) {
          var E = b.extractEvents(e, t, s, l, d);
          E && (p = Vs(p, E));
        }
      }
      return p;
    }
    function Br(e, t, s, l, d) {
      var p = Hl(e, t, s, l, d);
      mc(p);
    }
    function Wl(e) {
      var t = e.targetInst, s = t;
      do {
        if (!s) {
          var l = e.ancestors;
          l.push(s);
          break;
        }
        var d = Tf(s);
        if (!d)
          break;
        var p = s.tag;
        (p === Re || p === $e) && e.ancestors.push(s), s = eh(d);
      } while (s);
      for (var w = 0; w < e.ancestors.length; w++) {
        t = e.ancestors[w];
        var b = jl(e.nativeEvent), E = e.topLevelType, N = e.nativeEvent, k = e.eventSystemFlags;
        w === 0 && (k |= Ta), Br(E, t, N, b, k);
      }
    }
    function Bo(e, t, s, l) {
      var d = Lo(e, s, l, t);
      try {
        Aa(Wl, d);
      } finally {
        Bp(d);
      }
    }
    function Ws(e, t) {
      for (var s = or(t), l = jt[e], d = 0; d < l.length; d++) {
        var p = l[d];
        vc(p, t, s);
      }
    }
    function vc(e, t, s) {
      if (!s.has(e)) {
        switch (e) {
          case Lr:
            Rc(Lr, t);
            break;
          case Wi:
          case Vn:
            Rc(Wi, t), Rc(Vn, t), s.set(Vn, null), s.set(Wi, null);
            break;
          case ec:
          case Do:
            Ul(gf(e)) && Rc(e, t);
            break;
          case zr:
          case js:
          case En:
            break;
          default:
            var l = _o.indexOf(e) !== -1;
            l || Gt(e, t);
            break;
        }
        s.set(e, null);
      }
    }
    function jo(e, t) {
      for (var s = or(t), l = jt[e], d = 0; d < l.length; d++) {
        var p = l[d];
        if (!s.has(p))
          return !1;
      }
      return !0;
    }
    var Mf;
    function Ef(e) {
      Mf = e;
    }
    var Kt;
    function gc(e) {
      Kt = e;
    }
    var yc;
    function wc(e) {
      yc = e;
    }
    var gi = !1, Zn = [], $t = null, on = null, ln = null, $a = /* @__PURE__ */ new Map(), Wn = /* @__PURE__ */ new Map(), Fs = [];
    function If() {
      return Zn.length > 0;
    }
    var $s = [oa, Pl, oc, lc, mf, zs, tf, ff, hf, sn, Dl, tc, Ls, aa, Al, Hn, Fi, si, kl, Ol, Do, ec, Kd, ef, zl, Il, za, Rl, En, js], Uo = [Wi, Vn, Os, Nl, la, La, St, Ai, sa, rc];
    function Qa(e) {
      return $s.indexOf(e) > -1;
    }
    function Fl(e, t, s) {
      vc(e, t, s);
    }
    function bc(e, t) {
      var s = or(t);
      $s.forEach(function(l) {
        Fl(l, t, s);
      }), Uo.forEach(function(l) {
        Fl(l, t, s);
      });
    }
    function Sc(e, t, s, l, d) {
      return {
        blockedOn: e,
        topLevelType: t,
        eventSystemFlags: s | Vi,
        nativeEvent: d,
        container: l
      };
    }
    function xc(e, t, s, l, d) {
      var p = Sc(e, t, s, l, d);
      Zn.push(p);
    }
    function Af(e, t) {
      switch (e) {
        case Wi:
        case Vn:
          $t = null;
          break;
        case Os:
        case Nl:
          on = null;
          break;
        case la:
        case La:
          ln = null;
          break;
        case St:
        case Ai: {
          var s = t.pointerId;
          $a.delete(s);
          break;
        }
        case sa:
        case rc: {
          var l = t.pointerId;
          Wn.delete(l);
          break;
        }
      }
    }
    function Qs(e, t, s, l, d, p) {
      if (e === null || e.nativeEvent !== p) {
        var w = Sc(t, s, l, d, p);
        if (t !== null) {
          var b = Zo(t);
          b !== null && Kt(b);
        }
        return w;
      }
      return e.eventSystemFlags |= l, e;
    }
    function Rf(e, t, s, l, d) {
      switch (t) {
        case Wi: {
          var p = d;
          return $t = Qs($t, e, t, s, l, p), !0;
        }
        case Os: {
          var w = d;
          return on = Qs(on, e, t, s, l, w), !0;
        }
        case la: {
          var b = d;
          return ln = Qs(ln, e, t, s, l, b), !0;
        }
        case St: {
          var E = d, N = E.pointerId;
          return $a.set(N, Qs($a.get(N) || null, e, t, s, l, E)), !0;
        }
        case sa: {
          var k = d, J = k.pointerId;
          return Wn.set(J, Qs(Wn.get(J) || null, e, t, s, l, k)), !0;
        }
      }
      return !1;
    }
    function jp(e) {
      var t = eh(e.target);
      if (t !== null) {
        var s = vi(t);
        if (s !== null) {
          var l = s.tag;
          if (l === ee) {
            var d = hc(s);
            if (d !== null) {
              e.blockedOn = d, o.unstable_runWithPriority(e.priority, function() {
                yc(s);
              });
              return;
            }
          } else if (l === Se) {
            var p = s.stateNode;
            if (p.hydrate) {
              e.blockedOn = pc(s);
              return;
            }
          }
        }
      }
      e.blockedOn = null;
    }
    function Zs(e) {
      if (e.blockedOn !== null)
        return !1;
      var t = Dc(e.topLevelType, e.eventSystemFlags, e.container, e.nativeEvent);
      if (t !== null) {
        var s = Zo(t);
        return s !== null && Kt(s), e.blockedOn = t, !1;
      }
      return !0;
    }
    function Df(e, t, s) {
      Zs(e) && s.delete(t);
    }
    function Up() {
      for (gi = !1; Zn.length > 0; ) {
        var e = Zn[0];
        if (e.blockedOn !== null) {
          var t = Zo(e.blockedOn);
          t !== null && Mf(t);
          break;
        }
        var s = Dc(e.topLevelType, e.eventSystemFlags, e.container, e.nativeEvent);
        s !== null ? e.blockedOn = s : Zn.shift();
      }
      $t !== null && Zs($t) && ($t = null), on !== null && Zs(on) && (on = null), ln !== null && Zs(ln) && (ln = null), $a.forEach(Df), Wn.forEach(Df);
    }
    function Vo(e, t) {
      e.blockedOn === t && (e.blockedOn = null, gi || (gi = !0, o.unstable_scheduleCallback(o.unstable_NormalPriority, Up)));
    }
    function Cc(e) {
      if (Zn.length > 0) {
        Vo(Zn[0], e);
        for (var t = 1; t < Zn.length; t++) {
          var s = Zn[t];
          s.blockedOn === e && (s.blockedOn = null);
        }
      }
      $t !== null && Vo($t, e), on !== null && Vo(on, e), ln !== null && Vo(ln, e);
      var l = function(b) {
        return Vo(b, e);
      };
      $a.forEach(l), Wn.forEach(l);
      for (var d = 0; d < Fs.length; d++) {
        var p = Fs[d];
        p.blockedOn === e && (p.blockedOn = null);
      }
      for (; Fs.length > 0; ) {
        var w = Fs[0];
        if (w.blockedOn !== null)
          break;
        jp(w), w.blockedOn === null && Fs.shift();
      }
    }
    function Vp(e, t, s) {
      e.addEventListener(t, s, !1);
    }
    function Tc(e, t, s) {
      e.addEventListener(t, s, !0);
    }
    var Nf = {}, Mc = /* @__PURE__ */ new Map(), Ec = /* @__PURE__ */ new Map(), Ic = [Vn, "blur", ec, "cancel", Il, "click", Do, "close", Rl, "contextMenu", Kd, "copy", ef, "cut", zs, "auxClick", tf, "doubleClick", Dl, "dragEnd", tc, "dragStart", Ls, "drop", Wi, "focus", kl, "input", zr, "invalid", Hn, "keyDown", Fi, "keyPress", si, "keyUp", oa, "mouseDown", Pl, "mouseUp", zl, "paste", uf, "pause", cf, "play", ff, "pointerCancel", hf, "pointerDown", sn, "pointerUp", Pn, "rateChange", En, "reset", Ba, "seeked", js, "submit", oc, "touchCancel", lc, "touchEnd", mf, "touchStart", cc, "volumeChange"], Tg = [za, ja, Ol, Al, aa, qd], Mg = [kp, "drag", Os, "dragEnter", nf, "dragExit", Nl, "dragLeave", rf, "dragOver", _l, "mouseMove", La, "mouseOut", la, "mouseOver", ac, "pointerMove", Ai, "pointerOut", St, "pointerOver", Lr, "scroll", ko, "toggle", uc, "touchMove", vf, "wheel"], Eg = [Gd, "abort", Np, "animationEnd", Xd, "animationIteration", Jd, "animationStart", _s, "canPlay", Ps, "canPlayThrough", nc, "durationChange", Bs, "emptied", af, "encrypted", sf, "ended", Ii, "error", sa, "gotPointerCapture", Oa, "load", of, "loadedData", lf, "loadedMetadata", ic, "loadStart", rc, "lostPointerCapture", df, "playing", Or, "progress", Qn, "seeking", sc, "stalled", No, "suspend", pf, "timeUpdate", Ll, "transitionEnd", dc, "waiting"];
    function ur(e, t) {
      for (var s = 0; s < e.length; s += 2) {
        var l = e[s], d = e[s + 1], p = d[0].toUpperCase() + d.slice(1), w = "on" + p, b = {
          phasedRegistrationNames: {
            bubbled: w,
            captured: w + "Capture"
          },
          dependencies: [l],
          eventPriority: t
        };
        Ec.set(l, t), Mc.set(l, b), Nf[d] = b;
      }
    }
    function Za(e, t) {
      for (var s = 0; s < e.length; s++)
        Ec.set(e[s], t);
    }
    ur(Ic, Ra), ur(Mg, _n), ur(Eg, Ar), Za(Tg, Ra);
    function Ys(e) {
      var t = Ec.get(e);
      return t === void 0 ? Ar : t;
    }
    var Hp = o.unstable_UserBlockingPriority, Wp = o.unstable_runWithPriority, $l = !0;
    function kf(e) {
      $l = !!e;
    }
    function Ac() {
      return $l;
    }
    function Gt(e, t) {
      cr(t, e, !1);
    }
    function Rc(e, t) {
      cr(t, e, !0);
    }
    function cr(e, t, s) {
      var l;
      switch (Ys(t)) {
        case Ra:
          l = Di.bind(null, t, Gr, e);
          break;
        case _n:
          l = Fp.bind(null, t, Gr, e);
          break;
        case Ar:
        default:
          l = Ql.bind(null, t, Gr, e);
          break;
      }
      var d = gf(t);
      s ? Tc(e, d, l) : Vp(e, d, l);
    }
    function Di(e, t, s, l) {
      wo(l.timeStamp), yo(Ql, e, t, s, l);
    }
    function Fp(e, t, s, l) {
      Wp(Hp, Ql.bind(null, e, t, s, l));
    }
    function Ql(e, t, s, l) {
      if (!!$l) {
        if (If() && Qa(e)) {
          xc(
            null,
            e,
            t,
            s,
            l
          );
          return;
        }
        var d = Dc(e, t, s, l);
        if (d === null) {
          Af(e, l);
          return;
        }
        if (Qa(e)) {
          xc(d, e, t, s, l);
          return;
        }
        Rf(d, e, t, s, l) || (Af(e, l), Bo(e, t, l, null));
      }
    }
    function Dc(e, t, s, l) {
      var d = jl(l), p = eh(d);
      if (p !== null) {
        var w = vi(p);
        if (w === null)
          p = null;
        else {
          var b = w.tag;
          if (b === ee) {
            var E = hc(w);
            if (E !== null)
              return E;
            p = null;
          } else if (b === Se) {
            var N = w.stateNode;
            if (N.hydrate)
              return pc(w);
            p = null;
          } else
            w !== p && (p = null);
        }
      }
      return Bo(e, t, l, p), null;
    }
    var $p = {
      animation: ["animationDelay", "animationDirection", "animationDuration", "animationFillMode", "animationIterationCount", "animationName", "animationPlayState", "animationTimingFunction"],
      background: ["backgroundAttachment", "backgroundClip", "backgroundColor", "backgroundImage", "backgroundOrigin", "backgroundPositionX", "backgroundPositionY", "backgroundRepeat", "backgroundSize"],
      backgroundPosition: ["backgroundPositionX", "backgroundPositionY"],
      border: ["borderBottomColor", "borderBottomStyle", "borderBottomWidth", "borderImageOutset", "borderImageRepeat", "borderImageSlice", "borderImageSource", "borderImageWidth", "borderLeftColor", "borderLeftStyle", "borderLeftWidth", "borderRightColor", "borderRightStyle", "borderRightWidth", "borderTopColor", "borderTopStyle", "borderTopWidth"],
      borderBlockEnd: ["borderBlockEndColor", "borderBlockEndStyle", "borderBlockEndWidth"],
      borderBlockStart: ["borderBlockStartColor", "borderBlockStartStyle", "borderBlockStartWidth"],
      borderBottom: ["borderBottomColor", "borderBottomStyle", "borderBottomWidth"],
      borderColor: ["borderBottomColor", "borderLeftColor", "borderRightColor", "borderTopColor"],
      borderImage: ["borderImageOutset", "borderImageRepeat", "borderImageSlice", "borderImageSource", "borderImageWidth"],
      borderInlineEnd: ["borderInlineEndColor", "borderInlineEndStyle", "borderInlineEndWidth"],
      borderInlineStart: ["borderInlineStartColor", "borderInlineStartStyle", "borderInlineStartWidth"],
      borderLeft: ["borderLeftColor", "borderLeftStyle", "borderLeftWidth"],
      borderRadius: ["borderBottomLeftRadius", "borderBottomRightRadius", "borderTopLeftRadius", "borderTopRightRadius"],
      borderRight: ["borderRightColor", "borderRightStyle", "borderRightWidth"],
      borderStyle: ["borderBottomStyle", "borderLeftStyle", "borderRightStyle", "borderTopStyle"],
      borderTop: ["borderTopColor", "borderTopStyle", "borderTopWidth"],
      borderWidth: ["borderBottomWidth", "borderLeftWidth", "borderRightWidth", "borderTopWidth"],
      columnRule: ["columnRuleColor", "columnRuleStyle", "columnRuleWidth"],
      columns: ["columnCount", "columnWidth"],
      flex: ["flexBasis", "flexGrow", "flexShrink"],
      flexFlow: ["flexDirection", "flexWrap"],
      font: ["fontFamily", "fontFeatureSettings", "fontKerning", "fontLanguageOverride", "fontSize", "fontSizeAdjust", "fontStretch", "fontStyle", "fontVariant", "fontVariantAlternates", "fontVariantCaps", "fontVariantEastAsian", "fontVariantLigatures", "fontVariantNumeric", "fontVariantPosition", "fontWeight", "lineHeight"],
      fontVariant: ["fontVariantAlternates", "fontVariantCaps", "fontVariantEastAsian", "fontVariantLigatures", "fontVariantNumeric", "fontVariantPosition"],
      gap: ["columnGap", "rowGap"],
      grid: ["gridAutoColumns", "gridAutoFlow", "gridAutoRows", "gridTemplateAreas", "gridTemplateColumns", "gridTemplateRows"],
      gridArea: ["gridColumnEnd", "gridColumnStart", "gridRowEnd", "gridRowStart"],
      gridColumn: ["gridColumnEnd", "gridColumnStart"],
      gridColumnGap: ["columnGap"],
      gridGap: ["columnGap", "rowGap"],
      gridRow: ["gridRowEnd", "gridRowStart"],
      gridRowGap: ["rowGap"],
      gridTemplate: ["gridTemplateAreas", "gridTemplateColumns", "gridTemplateRows"],
      listStyle: ["listStyleImage", "listStylePosition", "listStyleType"],
      margin: ["marginBottom", "marginLeft", "marginRight", "marginTop"],
      marker: ["markerEnd", "markerMid", "markerStart"],
      mask: ["maskClip", "maskComposite", "maskImage", "maskMode", "maskOrigin", "maskPositionX", "maskPositionY", "maskRepeat", "maskSize"],
      maskPosition: ["maskPositionX", "maskPositionY"],
      outline: ["outlineColor", "outlineStyle", "outlineWidth"],
      overflow: ["overflowX", "overflowY"],
      padding: ["paddingBottom", "paddingLeft", "paddingRight", "paddingTop"],
      placeContent: ["alignContent", "justifyContent"],
      placeItems: ["alignItems", "justifyItems"],
      placeSelf: ["alignSelf", "justifySelf"],
      textDecoration: ["textDecorationColor", "textDecorationLine", "textDecorationStyle"],
      textEmphasis: ["textEmphasisColor", "textEmphasisStyle"],
      transition: ["transitionDelay", "transitionDuration", "transitionProperty", "transitionTimingFunction"],
      wordWrap: ["overflowWrap"]
    }, Gs = {
      animationIterationCount: !0,
      borderImageOutset: !0,
      borderImageSlice: !0,
      borderImageWidth: !0,
      boxFlex: !0,
      boxFlexGroup: !0,
      boxOrdinalGroup: !0,
      columnCount: !0,
      columns: !0,
      flex: !0,
      flexGrow: !0,
      flexPositive: !0,
      flexShrink: !0,
      flexNegative: !0,
      flexOrder: !0,
      gridArea: !0,
      gridRow: !0,
      gridRowEnd: !0,
      gridRowSpan: !0,
      gridRowStart: !0,
      gridColumn: !0,
      gridColumnEnd: !0,
      gridColumnSpan: !0,
      gridColumnStart: !0,
      fontWeight: !0,
      lineClamp: !0,
      lineHeight: !0,
      opacity: !0,
      order: !0,
      orphans: !0,
      tabSize: !0,
      widows: !0,
      zIndex: !0,
      zoom: !0,
      fillOpacity: !0,
      floodOpacity: !0,
      stopOpacity: !0,
      strokeDasharray: !0,
      strokeDashoffset: !0,
      strokeMiterlimit: !0,
      strokeOpacity: !0,
      strokeWidth: !0
    };
    function Qp(e, t) {
      return e + t.charAt(0).toUpperCase() + t.substring(1);
    }
    var _f = ["Webkit", "ms", "Moz", "O"];
    Object.keys(Gs).forEach(function(e) {
      _f.forEach(function(t) {
        Gs[Qp(t, e)] = Gs[e];
      });
    });
    function Nc(e, t, s) {
      var l = t == null || typeof t == "boolean" || t === "";
      return l ? "" : !s && typeof t == "number" && t !== 0 && !(Gs.hasOwnProperty(e) && Gs[e]) ? t + "px" : ("" + t).trim();
    }
    var Pf = /([A-Z])/g, Zp = /^ms-/;
    function Yp(e) {
      return e.replace(Pf, "-$1").toLowerCase().replace(Zp, "-ms-");
    }
    var kc = function() {
    };
    {
      var Gp = /^(?:webkit|moz|o)[A-Z]/, ca = /^-ms-/, Xp = /-(.)/g, _c = /;\s*$/, Xs = {}, Pc = {}, Zl = !1, Jp = !1, Ig = function(e) {
        return e.replace(Xp, function(t, s) {
          return s.toUpperCase();
        });
      }, zf = function(e) {
        Xs.hasOwnProperty(e) && Xs[e] || (Xs[e] = !0, g(
          "Unsupported style property %s. Did you mean %s?",
          e,
          Ig(e.replace(ca, "ms-"))
        ));
      }, Ag = function(e) {
        Xs.hasOwnProperty(e) && Xs[e] || (Xs[e] = !0, g("Unsupported vendor-prefixed style property %s. Did you mean %s?", e, e.charAt(0).toUpperCase() + e.slice(1)));
      }, Of = function(e, t) {
        Pc.hasOwnProperty(t) && Pc[t] || (Pc[t] = !0, g(`Style property values shouldn't contain a semicolon. Try "%s: %s" instead.`, e, t.replace(_c, "")));
      }, Rg = function(e, t) {
        Zl || (Zl = !0, g("`NaN` is an invalid value for the `%s` css style property.", e));
      }, qp = function(e, t) {
        Jp || (Jp = !0, g("`Infinity` is an invalid value for the `%s` css style property.", e));
      };
      kc = function(e, t) {
        e.indexOf("-") > -1 ? zf(e) : Gp.test(e) ? Ag(e) : _c.test(t) && Of(e, t), typeof t == "number" && (isNaN(t) ? Rg(e, t) : isFinite(t) || qp(e, t));
      };
    }
    var Dg = kc;
    function Kp(e) {
      {
        var t = "", s = "";
        for (var l in e)
          if (!!e.hasOwnProperty(l)) {
            var d = e[l];
            if (d != null) {
              var p = l.indexOf("--") === 0;
              t += s + (p ? l : Yp(l)) + ":", t += Nc(l, d, p), s = ";";
            }
          }
        return t || null;
      }
    }
    function Lf(e, t) {
      var s = e.style;
      for (var l in t)
        if (!!t.hasOwnProperty(l)) {
          var d = l.indexOf("--") === 0;
          d || Dg(l, t[l]);
          var p = Nc(l, t[l], d);
          l === "float" && (l = "cssFloat"), d ? s.setProperty(l, p) : s[l] = p;
        }
    }
    function Ng(e) {
      return e == null || typeof e == "boolean" || e === "";
    }
    function Bf(e) {
      var t = {};
      for (var s in e)
        for (var l = $p[s] || [s], d = 0; d < l.length; d++)
          t[l[d]] = s;
      return t;
    }
    function em(e, t) {
      {
        if (!t)
          return;
        var s = Bf(e), l = Bf(t), d = {};
        for (var p in s) {
          var w = s[p], b = l[p];
          if (b && w !== b) {
            var E = w + "," + b;
            if (d[E])
              continue;
            d[E] = !0, g("%s a style property during rerender (%s) when a conflicting property is set (%s) can lead to styling bugs. To avoid this, don't mix shorthand and non-shorthand properties for the same value; instead, replace the shorthand with separate values.", Ng(e[w]) ? "Removing" : "Updating", w, b);
          }
        }
      }
    }
    var tm = {
      area: !0,
      base: !0,
      br: !0,
      col: !0,
      embed: !0,
      hr: !0,
      img: !0,
      input: !0,
      keygen: !0,
      link: !0,
      meta: !0,
      param: !0,
      source: !0,
      track: !0,
      wbr: !0
    }, nm = i({
      menuitem: !0
    }, tm), jf = "__html", Yl = null;
    Yl = m.ReactDebugCurrentFrame;
    function zc(e, t) {
      if (!!t) {
        if (nm[e] && !(t.children == null && t.dangerouslySetInnerHTML == null))
          throw Error(e + " is a void element tag and must neither have `children` nor use `dangerouslySetInnerHTML`." + Yl.getStackAddendum());
        if (t.dangerouslySetInnerHTML != null) {
          if (t.children != null)
            throw Error("Can only set one of `children` or `props.dangerouslySetInnerHTML`.");
          if (!(typeof t.dangerouslySetInnerHTML == "object" && jf in t.dangerouslySetInnerHTML))
            throw Error("`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. Please visit https://fb.me/react-invariant-dangerously-set-inner-html for more information.");
        }
        if (!t.suppressContentEditableWarning && t.contentEditable && t.children != null && g("A component is `contentEditable` and contains `children` managed by React. It is now your responsibility to guarantee that none of those nodes are unexpectedly modified or duplicated. This is probably not intentional."), !(t.style == null || typeof t.style == "object"))
          throw Error("The `style` prop expects a mapping from style properties to values, not a string. For example, style={{marginRight: spacing + 'em'}} when using JSX." + Yl.getStackAddendum());
      }
    }
    function da(e, t) {
      if (e.indexOf("-") === -1)
        return typeof t.is == "string";
      switch (e) {
        case "annotation-xml":
        case "color-profile":
        case "font-face":
        case "font-face-src":
        case "font-face-uri":
        case "font-face-format":
        case "font-face-name":
        case "missing-glyph":
          return !1;
        default:
          return !0;
      }
    }
    var Gl = {
      accept: "accept",
      acceptcharset: "acceptCharset",
      "accept-charset": "acceptCharset",
      accesskey: "accessKey",
      action: "action",
      allowfullscreen: "allowFullScreen",
      alt: "alt",
      as: "as",
      async: "async",
      autocapitalize: "autoCapitalize",
      autocomplete: "autoComplete",
      autocorrect: "autoCorrect",
      autofocus: "autoFocus",
      autoplay: "autoPlay",
      autosave: "autoSave",
      capture: "capture",
      cellpadding: "cellPadding",
      cellspacing: "cellSpacing",
      challenge: "challenge",
      charset: "charSet",
      checked: "checked",
      children: "children",
      cite: "cite",
      class: "className",
      classid: "classID",
      classname: "className",
      cols: "cols",
      colspan: "colSpan",
      content: "content",
      contenteditable: "contentEditable",
      contextmenu: "contextMenu",
      controls: "controls",
      controlslist: "controlsList",
      coords: "coords",
      crossorigin: "crossOrigin",
      dangerouslysetinnerhtml: "dangerouslySetInnerHTML",
      data: "data",
      datetime: "dateTime",
      default: "default",
      defaultchecked: "defaultChecked",
      defaultvalue: "defaultValue",
      defer: "defer",
      dir: "dir",
      disabled: "disabled",
      disablepictureinpicture: "disablePictureInPicture",
      download: "download",
      draggable: "draggable",
      enctype: "encType",
      for: "htmlFor",
      form: "form",
      formmethod: "formMethod",
      formaction: "formAction",
      formenctype: "formEncType",
      formnovalidate: "formNoValidate",
      formtarget: "formTarget",
      frameborder: "frameBorder",
      headers: "headers",
      height: "height",
      hidden: "hidden",
      high: "high",
      href: "href",
      hreflang: "hrefLang",
      htmlfor: "htmlFor",
      httpequiv: "httpEquiv",
      "http-equiv": "httpEquiv",
      icon: "icon",
      id: "id",
      innerhtml: "innerHTML",
      inputmode: "inputMode",
      integrity: "integrity",
      is: "is",
      itemid: "itemID",
      itemprop: "itemProp",
      itemref: "itemRef",
      itemscope: "itemScope",
      itemtype: "itemType",
      keyparams: "keyParams",
      keytype: "keyType",
      kind: "kind",
      label: "label",
      lang: "lang",
      list: "list",
      loop: "loop",
      low: "low",
      manifest: "manifest",
      marginwidth: "marginWidth",
      marginheight: "marginHeight",
      max: "max",
      maxlength: "maxLength",
      media: "media",
      mediagroup: "mediaGroup",
      method: "method",
      min: "min",
      minlength: "minLength",
      multiple: "multiple",
      muted: "muted",
      name: "name",
      nomodule: "noModule",
      nonce: "nonce",
      novalidate: "noValidate",
      open: "open",
      optimum: "optimum",
      pattern: "pattern",
      placeholder: "placeholder",
      playsinline: "playsInline",
      poster: "poster",
      preload: "preload",
      profile: "profile",
      radiogroup: "radioGroup",
      readonly: "readOnly",
      referrerpolicy: "referrerPolicy",
      rel: "rel",
      required: "required",
      reversed: "reversed",
      role: "role",
      rows: "rows",
      rowspan: "rowSpan",
      sandbox: "sandbox",
      scope: "scope",
      scoped: "scoped",
      scrolling: "scrolling",
      seamless: "seamless",
      selected: "selected",
      shape: "shape",
      size: "size",
      sizes: "sizes",
      span: "span",
      spellcheck: "spellCheck",
      src: "src",
      srcdoc: "srcDoc",
      srclang: "srcLang",
      srcset: "srcSet",
      start: "start",
      step: "step",
      style: "style",
      summary: "summary",
      tabindex: "tabIndex",
      target: "target",
      title: "title",
      type: "type",
      usemap: "useMap",
      value: "value",
      width: "width",
      wmode: "wmode",
      wrap: "wrap",
      about: "about",
      accentheight: "accentHeight",
      "accent-height": "accentHeight",
      accumulate: "accumulate",
      additive: "additive",
      alignmentbaseline: "alignmentBaseline",
      "alignment-baseline": "alignmentBaseline",
      allowreorder: "allowReorder",
      alphabetic: "alphabetic",
      amplitude: "amplitude",
      arabicform: "arabicForm",
      "arabic-form": "arabicForm",
      ascent: "ascent",
      attributename: "attributeName",
      attributetype: "attributeType",
      autoreverse: "autoReverse",
      azimuth: "azimuth",
      basefrequency: "baseFrequency",
      baselineshift: "baselineShift",
      "baseline-shift": "baselineShift",
      baseprofile: "baseProfile",
      bbox: "bbox",
      begin: "begin",
      bias: "bias",
      by: "by",
      calcmode: "calcMode",
      capheight: "capHeight",
      "cap-height": "capHeight",
      clip: "clip",
      clippath: "clipPath",
      "clip-path": "clipPath",
      clippathunits: "clipPathUnits",
      cliprule: "clipRule",
      "clip-rule": "clipRule",
      color: "color",
      colorinterpolation: "colorInterpolation",
      "color-interpolation": "colorInterpolation",
      colorinterpolationfilters: "colorInterpolationFilters",
      "color-interpolation-filters": "colorInterpolationFilters",
      colorprofile: "colorProfile",
      "color-profile": "colorProfile",
      colorrendering: "colorRendering",
      "color-rendering": "colorRendering",
      contentscripttype: "contentScriptType",
      contentstyletype: "contentStyleType",
      cursor: "cursor",
      cx: "cx",
      cy: "cy",
      d: "d",
      datatype: "datatype",
      decelerate: "decelerate",
      descent: "descent",
      diffuseconstant: "diffuseConstant",
      direction: "direction",
      display: "display",
      divisor: "divisor",
      dominantbaseline: "dominantBaseline",
      "dominant-baseline": "dominantBaseline",
      dur: "dur",
      dx: "dx",
      dy: "dy",
      edgemode: "edgeMode",
      elevation: "elevation",
      enablebackground: "enableBackground",
      "enable-background": "enableBackground",
      end: "end",
      exponent: "exponent",
      externalresourcesrequired: "externalResourcesRequired",
      fill: "fill",
      fillopacity: "fillOpacity",
      "fill-opacity": "fillOpacity",
      fillrule: "fillRule",
      "fill-rule": "fillRule",
      filter: "filter",
      filterres: "filterRes",
      filterunits: "filterUnits",
      floodopacity: "floodOpacity",
      "flood-opacity": "floodOpacity",
      floodcolor: "floodColor",
      "flood-color": "floodColor",
      focusable: "focusable",
      fontfamily: "fontFamily",
      "font-family": "fontFamily",
      fontsize: "fontSize",
      "font-size": "fontSize",
      fontsizeadjust: "fontSizeAdjust",
      "font-size-adjust": "fontSizeAdjust",
      fontstretch: "fontStretch",
      "font-stretch": "fontStretch",
      fontstyle: "fontStyle",
      "font-style": "fontStyle",
      fontvariant: "fontVariant",
      "font-variant": "fontVariant",
      fontweight: "fontWeight",
      "font-weight": "fontWeight",
      format: "format",
      from: "from",
      fx: "fx",
      fy: "fy",
      g1: "g1",
      g2: "g2",
      glyphname: "glyphName",
      "glyph-name": "glyphName",
      glyphorientationhorizontal: "glyphOrientationHorizontal",
      "glyph-orientation-horizontal": "glyphOrientationHorizontal",
      glyphorientationvertical: "glyphOrientationVertical",
      "glyph-orientation-vertical": "glyphOrientationVertical",
      glyphref: "glyphRef",
      gradienttransform: "gradientTransform",
      gradientunits: "gradientUnits",
      hanging: "hanging",
      horizadvx: "horizAdvX",
      "horiz-adv-x": "horizAdvX",
      horizoriginx: "horizOriginX",
      "horiz-origin-x": "horizOriginX",
      ideographic: "ideographic",
      imagerendering: "imageRendering",
      "image-rendering": "imageRendering",
      in2: "in2",
      in: "in",
      inlist: "inlist",
      intercept: "intercept",
      k1: "k1",
      k2: "k2",
      k3: "k3",
      k4: "k4",
      k: "k",
      kernelmatrix: "kernelMatrix",
      kernelunitlength: "kernelUnitLength",
      kerning: "kerning",
      keypoints: "keyPoints",
      keysplines: "keySplines",
      keytimes: "keyTimes",
      lengthadjust: "lengthAdjust",
      letterspacing: "letterSpacing",
      "letter-spacing": "letterSpacing",
      lightingcolor: "lightingColor",
      "lighting-color": "lightingColor",
      limitingconeangle: "limitingConeAngle",
      local: "local",
      markerend: "markerEnd",
      "marker-end": "markerEnd",
      markerheight: "markerHeight",
      markermid: "markerMid",
      "marker-mid": "markerMid",
      markerstart: "markerStart",
      "marker-start": "markerStart",
      markerunits: "markerUnits",
      markerwidth: "markerWidth",
      mask: "mask",
      maskcontentunits: "maskContentUnits",
      maskunits: "maskUnits",
      mathematical: "mathematical",
      mode: "mode",
      numoctaves: "numOctaves",
      offset: "offset",
      opacity: "opacity",
      operator: "operator",
      order: "order",
      orient: "orient",
      orientation: "orientation",
      origin: "origin",
      overflow: "overflow",
      overlineposition: "overlinePosition",
      "overline-position": "overlinePosition",
      overlinethickness: "overlineThickness",
      "overline-thickness": "overlineThickness",
      paintorder: "paintOrder",
      "paint-order": "paintOrder",
      panose1: "panose1",
      "panose-1": "panose1",
      pathlength: "pathLength",
      patterncontentunits: "patternContentUnits",
      patterntransform: "patternTransform",
      patternunits: "patternUnits",
      pointerevents: "pointerEvents",
      "pointer-events": "pointerEvents",
      points: "points",
      pointsatx: "pointsAtX",
      pointsaty: "pointsAtY",
      pointsatz: "pointsAtZ",
      prefix: "prefix",
      preservealpha: "preserveAlpha",
      preserveaspectratio: "preserveAspectRatio",
      primitiveunits: "primitiveUnits",
      property: "property",
      r: "r",
      radius: "radius",
      refx: "refX",
      refy: "refY",
      renderingintent: "renderingIntent",
      "rendering-intent": "renderingIntent",
      repeatcount: "repeatCount",
      repeatdur: "repeatDur",
      requiredextensions: "requiredExtensions",
      requiredfeatures: "requiredFeatures",
      resource: "resource",
      restart: "restart",
      result: "result",
      results: "results",
      rotate: "rotate",
      rx: "rx",
      ry: "ry",
      scale: "scale",
      security: "security",
      seed: "seed",
      shaperendering: "shapeRendering",
      "shape-rendering": "shapeRendering",
      slope: "slope",
      spacing: "spacing",
      specularconstant: "specularConstant",
      specularexponent: "specularExponent",
      speed: "speed",
      spreadmethod: "spreadMethod",
      startoffset: "startOffset",
      stddeviation: "stdDeviation",
      stemh: "stemh",
      stemv: "stemv",
      stitchtiles: "stitchTiles",
      stopcolor: "stopColor",
      "stop-color": "stopColor",
      stopopacity: "stopOpacity",
      "stop-opacity": "stopOpacity",
      strikethroughposition: "strikethroughPosition",
      "strikethrough-position": "strikethroughPosition",
      strikethroughthickness: "strikethroughThickness",
      "strikethrough-thickness": "strikethroughThickness",
      string: "string",
      stroke: "stroke",
      strokedasharray: "strokeDasharray",
      "stroke-dasharray": "strokeDasharray",
      strokedashoffset: "strokeDashoffset",
      "stroke-dashoffset": "strokeDashoffset",
      strokelinecap: "strokeLinecap",
      "stroke-linecap": "strokeLinecap",
      strokelinejoin: "strokeLinejoin",
      "stroke-linejoin": "strokeLinejoin",
      strokemiterlimit: "strokeMiterlimit",
      "stroke-miterlimit": "strokeMiterlimit",
      strokewidth: "strokeWidth",
      "stroke-width": "strokeWidth",
      strokeopacity: "strokeOpacity",
      "stroke-opacity": "strokeOpacity",
      suppresscontenteditablewarning: "suppressContentEditableWarning",
      suppresshydrationwarning: "suppressHydrationWarning",
      surfacescale: "surfaceScale",
      systemlanguage: "systemLanguage",
      tablevalues: "tableValues",
      targetx: "targetX",
      targety: "targetY",
      textanchor: "textAnchor",
      "text-anchor": "textAnchor",
      textdecoration: "textDecoration",
      "text-decoration": "textDecoration",
      textlength: "textLength",
      textrendering: "textRendering",
      "text-rendering": "textRendering",
      to: "to",
      transform: "transform",
      typeof: "typeof",
      u1: "u1",
      u2: "u2",
      underlineposition: "underlinePosition",
      "underline-position": "underlinePosition",
      underlinethickness: "underlineThickness",
      "underline-thickness": "underlineThickness",
      unicode: "unicode",
      unicodebidi: "unicodeBidi",
      "unicode-bidi": "unicodeBidi",
      unicoderange: "unicodeRange",
      "unicode-range": "unicodeRange",
      unitsperem: "unitsPerEm",
      "units-per-em": "unitsPerEm",
      unselectable: "unselectable",
      valphabetic: "vAlphabetic",
      "v-alphabetic": "vAlphabetic",
      values: "values",
      vectoreffect: "vectorEffect",
      "vector-effect": "vectorEffect",
      version: "version",
      vertadvy: "vertAdvY",
      "vert-adv-y": "vertAdvY",
      vertoriginx: "vertOriginX",
      "vert-origin-x": "vertOriginX",
      vertoriginy: "vertOriginY",
      "vert-origin-y": "vertOriginY",
      vhanging: "vHanging",
      "v-hanging": "vHanging",
      videographic: "vIdeographic",
      "v-ideographic": "vIdeographic",
      viewbox: "viewBox",
      viewtarget: "viewTarget",
      visibility: "visibility",
      vmathematical: "vMathematical",
      "v-mathematical": "vMathematical",
      vocab: "vocab",
      widths: "widths",
      wordspacing: "wordSpacing",
      "word-spacing": "wordSpacing",
      writingmode: "writingMode",
      "writing-mode": "writingMode",
      x1: "x1",
      x2: "x2",
      x: "x",
      xchannelselector: "xChannelSelector",
      xheight: "xHeight",
      "x-height": "xHeight",
      xlinkactuate: "xlinkActuate",
      "xlink:actuate": "xlinkActuate",
      xlinkarcrole: "xlinkArcrole",
      "xlink:arcrole": "xlinkArcrole",
      xlinkhref: "xlinkHref",
      "xlink:href": "xlinkHref",
      xlinkrole: "xlinkRole",
      "xlink:role": "xlinkRole",
      xlinkshow: "xlinkShow",
      "xlink:show": "xlinkShow",
      xlinktitle: "xlinkTitle",
      "xlink:title": "xlinkTitle",
      xlinktype: "xlinkType",
      "xlink:type": "xlinkType",
      xmlbase: "xmlBase",
      "xml:base": "xmlBase",
      xmllang: "xmlLang",
      "xml:lang": "xmlLang",
      xmlns: "xmlns",
      "xml:space": "xmlSpace",
      xmlnsxlink: "xmlnsXlink",
      "xmlns:xlink": "xmlnsXlink",
      xmlspace: "xmlSpace",
      y1: "y1",
      y2: "y2",
      y: "y",
      ychannelselector: "yChannelSelector",
      z: "z",
      zoomandpan: "zoomAndPan"
    }, im = {
      "aria-current": 0,
      "aria-details": 0,
      "aria-disabled": 0,
      "aria-hidden": 0,
      "aria-invalid": 0,
      "aria-keyshortcuts": 0,
      "aria-label": 0,
      "aria-roledescription": 0,
      "aria-autocomplete": 0,
      "aria-checked": 0,
      "aria-expanded": 0,
      "aria-haspopup": 0,
      "aria-level": 0,
      "aria-modal": 0,
      "aria-multiline": 0,
      "aria-multiselectable": 0,
      "aria-orientation": 0,
      "aria-placeholder": 0,
      "aria-pressed": 0,
      "aria-readonly": 0,
      "aria-required": 0,
      "aria-selected": 0,
      "aria-sort": 0,
      "aria-valuemax": 0,
      "aria-valuemin": 0,
      "aria-valuenow": 0,
      "aria-valuetext": 0,
      "aria-atomic": 0,
      "aria-busy": 0,
      "aria-live": 0,
      "aria-relevant": 0,
      "aria-dropeffect": 0,
      "aria-grabbed": 0,
      "aria-activedescendant": 0,
      "aria-colcount": 0,
      "aria-colindex": 0,
      "aria-colspan": 0,
      "aria-controls": 0,
      "aria-describedby": 0,
      "aria-errormessage": 0,
      "aria-flowto": 0,
      "aria-labelledby": 0,
      "aria-owns": 0,
      "aria-posinset": 0,
      "aria-rowcount": 0,
      "aria-rowindex": 0,
      "aria-rowspan": 0,
      "aria-setsize": 0
    }, Js = {}, rm = new RegExp("^(aria)-[" + ne + "]*$"), kg = new RegExp("^(aria)[A-Z][" + ne + "]*$"), Oc = Object.prototype.hasOwnProperty;
    function am(e, t) {
      {
        if (Oc.call(Js, t) && Js[t])
          return !0;
        if (kg.test(t)) {
          var s = "aria-" + t.slice(4).toLowerCase(), l = im.hasOwnProperty(s) ? s : null;
          if (l == null)
            return g("Invalid ARIA attribute `%s`. ARIA attributes follow the pattern aria-* and must be lowercase.", t), Js[t] = !0, !0;
          if (t !== l)
            return g("Invalid ARIA attribute `%s`. Did you mean `%s`?", t, l), Js[t] = !0, !0;
        }
        if (rm.test(t)) {
          var d = t.toLowerCase(), p = im.hasOwnProperty(d) ? d : null;
          if (p == null)
            return Js[t] = !0, !1;
          if (t !== p)
            return g("Unknown ARIA attribute `%s`. Did you mean `%s`?", t, p), Js[t] = !0, !0;
        }
      }
      return !0;
    }
    function zn(e, t) {
      {
        var s = [];
        for (var l in t) {
          var d = am(e, l);
          d || s.push(l);
        }
        var p = s.map(function(w) {
          return "`" + w + "`";
        }).join(", ");
        s.length === 1 ? g("Invalid aria prop %s on <%s> tag. For details, see https://fb.me/invalid-aria-prop", p, e) : s.length > 1 && g("Invalid aria props %s on <%s> tag. For details, see https://fb.me/invalid-aria-prop", p, e);
      }
    }
    function Uf(e, t) {
      da(e, t) || zn(e, t);
    }
    var Zi = !1;
    function jr(e, t) {
      {
        if (e !== "input" && e !== "textarea" && e !== "select")
          return;
        t != null && t.value === null && !Zi && (Zi = !0, e === "select" && t.multiple ? g("`value` prop on `%s` should not be null. Consider using an empty array when `multiple` is set to `true` to clear the component or `undefined` for uncontrolled components.", e) : g("`value` prop on `%s` should not be null. Consider using an empty string to clear the component or `undefined` for uncontrolled components.", e));
      }
    }
    var Ya = function() {
    };
    {
      var On = {}, sm = Object.prototype.hasOwnProperty, Xl = /^on./, Lc = /^on[^A-Z]/, Vf = new RegExp("^(aria)-[" + ne + "]*$"), at = new RegExp("^(aria)[A-Z][" + ne + "]*$");
      Ya = function(e, t, s, l) {
        if (sm.call(On, t) && On[t])
          return !0;
        var d = t.toLowerCase();
        if (d === "onfocusin" || d === "onfocusout")
          return g("React uses onFocus and onBlur instead of onFocusIn and onFocusOut. All React events are normalized to bubble, so onFocusIn and onFocusOut are not needed/supported by React."), On[t] = !0, !0;
        if (l) {
          if (He.hasOwnProperty(t))
            return !0;
          var p = Sn.hasOwnProperty(d) ? Sn[d] : null;
          if (p != null)
            return g("Invalid event handler property `%s`. Did you mean `%s`?", t, p), On[t] = !0, !0;
          if (Xl.test(t))
            return g("Unknown event handler property `%s`. It will be ignored.", t), On[t] = !0, !0;
        } else if (Xl.test(t))
          return Lc.test(t) && g("Invalid event handler property `%s`. React events use the camelCase naming convention, for example `onClick`.", t), On[t] = !0, !0;
        if (Vf.test(t) || at.test(t))
          return !0;
        if (d === "innerhtml")
          return g("Directly setting property `innerHTML` is not permitted. For more information, lookup documentation on `dangerouslySetInnerHTML`."), On[t] = !0, !0;
        if (d === "aria")
          return g("The `aria` attribute is reserved for future use in React. Pass individual `aria-` attributes instead."), On[t] = !0, !0;
        if (d === "is" && s !== null && s !== void 0 && typeof s != "string")
          return g("Received a `%s` for a string attribute `is`. If this is expected, cast the value to a string.", typeof s), On[t] = !0, !0;
        if (typeof s == "number" && isNaN(s))
          return g("Received NaN for the `%s` attribute. If this is expected, cast the value to a string.", t), On[t] = !0, !0;
        var w = bo(t), b = w !== null && w.type === qr;
        if (Gl.hasOwnProperty(d)) {
          var E = Gl[d];
          if (E !== t)
            return g("Invalid DOM property `%s`. Did you mean `%s`?", t, E), On[t] = !0, !0;
        } else if (!b && t !== d)
          return g("React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element.", t, d), On[t] = !0, !0;
        return typeof s == "boolean" && qt(t, s, w, !1) ? (s ? g('Received `%s` for a non-boolean attribute `%s`.\n\nIf you want to write it to the DOM, pass a string instead: %s="%s" or %s={value.toString()}.', s, t, t, s, t) : g('Received `%s` for a non-boolean attribute `%s`.\n\nIf you want to write it to the DOM, pass a string instead: %s="%s" or %s={value.toString()}.\n\nIf you used to conditionally omit it with %s={condition && value}, pass %s={condition ? value : undefined} instead.', s, t, t, s, t, t, t), On[t] = !0, !0) : b ? !0 : qt(t, s, w, !1) ? (On[t] = !0, !1) : ((s === "false" || s === "true") && w !== null && w.type === Un && (g("Received the string `%s` for the boolean attribute `%s`. %s Did you mean %s={%s}?", s, t, s === "false" ? "The browser will interpret it as a truthy value." : 'Although this works, it will not work as expected if you pass the string "false".', t, s), On[t] = !0), !0);
      };
    }
    var Ni = function(e, t, s) {
      {
        var l = [];
        for (var d in t) {
          var p = Ya(e, d, t[d], s);
          p || l.push(d);
        }
        var w = l.map(function(b) {
          return "`" + b + "`";
        }).join(", ");
        l.length === 1 ? g("Invalid value for prop %s on <%s> tag. Either remove it from the element, or pass a string or number value to keep it in the DOM. For details, see https://fb.me/react-attribute-behavior", w, e) : l.length > 1 && g("Invalid values for props %s on <%s> tag. Either remove them from the element, or pass a string or number value to keep them in the DOM. For details, see https://fb.me/react-attribute-behavior", w, e);
      }
    };
    function ot(e, t, s) {
      da(e, t) || Ni(e, t, s);
    }
    var Vt = !1, pn = "dangerouslySetInnerHTML", qs = "suppressContentEditableWarning", ki = "suppressHydrationWarning", Ho = "autoFocus", Ur = "children", dr = "style", Ks = "__html", Ga = hi.html, Bc, Le, eo, Wo, Yi, Jl, Xa, Fo, fr, $o;
    {
      Bc = {
        time: !0,
        dialog: !0,
        webview: !0
      }, eo = function(e, t) {
        Uf(e, t), jr(e, t), ot(
          e,
          t,
          !0
        );
      }, Fo = jn && !document.documentMode;
      var Hf = /\r\n?/g, jc = /\u0000|\uFFFD/g;
      fr = function(e) {
        var t = typeof e == "string" ? e : "" + e;
        return t.replace(Hf, `
`).replace(jc, "");
      }, Wo = function(e, t) {
        if (!Vt) {
          var s = fr(t), l = fr(e);
          l !== s && (Vt = !0, g('Text content did not match. Server: "%s" Client: "%s"', l, s));
        }
      }, Yi = function(e, t, s) {
        if (!Vt) {
          var l = fr(s), d = fr(t);
          d !== l && (Vt = !0, g("Prop `%s` did not match. Server: %s Client: %s", e, JSON.stringify(d), JSON.stringify(l)));
        }
      }, Jl = function(e) {
        if (!Vt) {
          Vt = !0;
          var t = [];
          e.forEach(function(s) {
            t.push(s);
          }), g("Extra attributes from the server: %s", t);
        }
      }, Xa = function(e, t) {
        t === !1 ? g("Expected `%s` listener to be a function, instead got `false`.\n\nIf you used to conditionally omit it with %s={condition && value}, pass %s={condition ? value : undefined} instead.", e, e, e) : g("Expected `%s` listener to be a function, instead got a value of `%s` type.", e, typeof t);
      }, $o = function(e, t) {
        var s = e.namespaceURI === Ga ? e.ownerDocument.createElement(e.tagName) : e.ownerDocument.createElementNS(e.namespaceURI, e.tagName);
        return s.innerHTML = t, s.innerHTML;
      };
    }
    function Ln(e, t) {
      var s = e.nodeType === ka || e.nodeType === qu, l = s ? e : e.ownerDocument;
      Ws(t, l);
    }
    function Ja(e) {
      return e.nodeType === ka ? e : e.ownerDocument;
    }
    function qa() {
    }
    function to(e) {
      e.onclick = qa;
    }
    function Uc(e, t, s, l, d) {
      for (var p in l)
        if (!!l.hasOwnProperty(p)) {
          var w = l[p];
          if (p === dr)
            w && Object.freeze(w), Lf(t, w);
          else if (p === pn) {
            var b = w ? w[Ks] : void 0;
            b != null && Rp(t, b);
          } else if (p === Ur)
            if (typeof w == "string") {
              var E = e !== "textarea" || w !== "";
              E && Ml(t, w);
            } else
              typeof w == "number" && Ml(t, "" + w);
          else
            p === qs || p === ki || p === Ho || (He.hasOwnProperty(p) ? w != null && (typeof w != "function" && Xa(p, w), Ln(s, p)) : w != null && M(t, p, w, d));
        }
    }
    function _i(e, t, s, l) {
      for (var d = 0; d < t.length; d += 2) {
        var p = t[d], w = t[d + 1];
        p === dr ? Lf(e, w) : p === pn ? Rp(e, w) : p === Ur ? Ml(e, w) : M(e, p, w, l);
      }
    }
    function om(e, t, s, l) {
      var d, p = Ja(s), w, b = l;
      if (b === Ga && (b = Zd(e)), b === Ga) {
        if (d = da(e, t), !d && e !== e.toLowerCase() && g("<%s /> is using incorrect casing. Use PascalCase for React components, or lowercase for HTML elements.", e), e === "script") {
          var E = p.createElement("div");
          E.innerHTML = "<script><\/script>";
          var N = E.firstChild;
          w = E.removeChild(N);
        } else if (typeof t.is == "string")
          w = p.createElement(e, {
            is: t.is
          });
        else if (w = p.createElement(e), e === "select") {
          var k = w;
          t.multiple ? k.multiple = !0 : t.size && (k.size = t.size);
        }
      } else
        w = p.createElementNS(b, e);
      return b === Ga && !d && Object.prototype.toString.call(w) === "[object HTMLUnknownElement]" && !Object.prototype.hasOwnProperty.call(Bc, e) && (Bc[e] = !0, g("The tag <%s> is unrecognized in this browser. If you meant to render a React component, start its name with an uppercase letter.", e)), w;
    }
    function Wf(e, t) {
      return Ja(t).createTextNode(e);
    }
    function _g(e, t, s, l) {
      var d = da(t, s);
      eo(t, s);
      var p;
      switch (t) {
        case "iframe":
        case "object":
        case "embed":
          Gt(Oa, e), p = s;
          break;
        case "video":
        case "audio":
          for (var w = 0; w < _o.length; w++)
            Gt(_o[w], e);
          p = s;
          break;
        case "source":
          Gt(Ii, e), p = s;
          break;
        case "img":
        case "image":
        case "link":
          Gt(Ii, e), Gt(Oa, e), p = s;
          break;
        case "form":
          Gt(En, e), Gt(js, e), p = s;
          break;
        case "details":
          Gt(ko, e), p = s;
          break;
        case "input":
          Hd(e, s), p = Fu(e, s), Gt(zr, e), Ln(l, "onChange");
          break;
        case "option":
          Fd(e, s), p = _r(e, s);
          break;
        case "select":
          Pr(e, s), p = xl(e, s), Gt(zr, e), Ln(l, "onChange");
          break;
        case "textarea":
          Ns(e, s), p = Qd(e, s), Gt(zr, e), Ln(l, "onChange");
          break;
        default:
          p = s;
      }
      switch (zc(t, p), Uc(t, e, l, p, d), t) {
        case "input":
          Ds(e), Qu(e, s, !1);
          break;
        case "textarea":
          Ds(e), Gu(e);
          break;
        case "option":
          $d(e, s);
          break;
        case "select":
          Ep(e, s);
          break;
        default:
          typeof p.onClick == "function" && to(e);
          break;
      }
    }
    function lm(e, t, s, l, d) {
      eo(t, l);
      var p = null, w, b;
      switch (t) {
        case "input":
          w = Fu(e, s), b = Fu(e, l), p = [];
          break;
        case "option":
          w = _r(e, s), b = _r(e, l), p = [];
          break;
        case "select":
          w = xl(e, s), b = xl(e, l), p = [];
          break;
        case "textarea":
          w = Qd(e, s), b = Qd(e, l), p = [];
          break;
        default:
          w = s, b = l, typeof w.onClick != "function" && typeof b.onClick == "function" && to(e);
          break;
      }
      zc(t, b);
      var E, N, k = null;
      for (E in w)
        if (!(b.hasOwnProperty(E) || !w.hasOwnProperty(E) || w[E] == null))
          if (E === dr) {
            var J = w[E];
            for (N in J)
              J.hasOwnProperty(N) && (k || (k = {}), k[N] = "");
          } else
            E === pn || E === Ur || E === qs || E === ki || E === Ho || (He.hasOwnProperty(E) ? p || (p = []) : (p = p || []).push(E, null));
      for (E in b) {
        var L = b[E], K = w != null ? w[E] : void 0;
        if (!(!b.hasOwnProperty(E) || L === K || L == null && K == null))
          if (E === dr)
            if (L && Object.freeze(L), K) {
              for (N in K)
                K.hasOwnProperty(N) && (!L || !L.hasOwnProperty(N)) && (k || (k = {}), k[N] = "");
              for (N in L)
                L.hasOwnProperty(N) && K[N] !== L[N] && (k || (k = {}), k[N] = L[N]);
            } else
              k || (p || (p = []), p.push(E, k)), k = L;
          else if (E === pn) {
            var me = L ? L[Ks] : void 0, we = K ? K[Ks] : void 0;
            me != null && we !== me && (p = p || []).push(E, me);
          } else
            E === Ur ? K !== L && (typeof L == "string" || typeof L == "number") && (p = p || []).push(E, "" + L) : E === qs || E === ki || (He.hasOwnProperty(E) ? (L != null && (typeof L != "function" && Xa(E, L), Ln(d, E)), !p && K !== L && (p = [])) : (p = p || []).push(E, L));
      }
      return k && (em(k, b[dr]), (p = p || []).push(dr, k)), p;
    }
    function um(e, t, s, l, d) {
      s === "input" && d.type === "radio" && d.name != null && $u(e, d);
      var p = da(s, l), w = da(s, d);
      switch (_i(e, t, p, w), s) {
        case "input":
          wl(e, d);
          break;
        case "textarea":
          ra(e, d);
          break;
        case "select":
          Ip(e, d);
          break;
      }
    }
    function no(e) {
      {
        var t = e.toLowerCase();
        return Gl.hasOwnProperty(t) && Gl[t] || null;
      }
    }
    function cm(e, t, s, l, d) {
      var p, w;
      switch (Le = s[ki] === !0, p = da(t, s), eo(t, s), t) {
        case "iframe":
        case "object":
        case "embed":
          Gt(Oa, e);
          break;
        case "video":
        case "audio":
          for (var b = 0; b < _o.length; b++)
            Gt(_o[b], e);
          break;
        case "source":
          Gt(Ii, e);
          break;
        case "img":
        case "image":
        case "link":
          Gt(Ii, e), Gt(Oa, e);
          break;
        case "form":
          Gt(En, e), Gt(js, e);
          break;
        case "details":
          Gt(ko, e);
          break;
        case "input":
          Hd(e, s), Gt(zr, e), Ln(d, "onChange");
          break;
        case "option":
          Fd(e, s);
          break;
        case "select":
          Pr(e, s), Gt(zr, e), Ln(d, "onChange");
          break;
        case "textarea":
          Ns(e, s), Gt(zr, e), Ln(d, "onChange");
          break;
      }
      zc(t, s);
      {
        w = /* @__PURE__ */ new Set();
        for (var E = e.attributes, N = 0; N < E.length; N++) {
          var k = E[N].name.toLowerCase();
          switch (k) {
            case "data-reactroot":
              break;
            case "value":
              break;
            case "checked":
              break;
            case "selected":
              break;
            default:
              w.add(E[N].name);
          }
        }
      }
      var J = null;
      for (var L in s)
        if (!!s.hasOwnProperty(L)) {
          var K = s[L];
          if (L === Ur)
            typeof K == "string" ? e.textContent !== K && (Le || Wo(e.textContent, K), J = [Ur, K]) : typeof K == "number" && e.textContent !== "" + K && (Le || Wo(e.textContent, K), J = [Ur, "" + K]);
          else if (He.hasOwnProperty(L))
            K != null && (typeof K != "function" && Xa(L, K), Ln(d, L));
          else if (typeof p == "boolean") {
            var me = void 0, we = bo(L);
            if (!Le) {
              if (!(L === qs || L === ki || L === "value" || L === "checked" || L === "selected")) {
                if (L === pn) {
                  var Ke = e.innerHTML, nt = K ? K[Ks] : void 0, Pt = $o(e, nt != null ? nt : "");
                  Pt !== Ke && Yi(L, Ke, Pt);
                } else if (L === dr) {
                  if (w.delete(L), Fo) {
                    var vt = Kp(K);
                    me = e.getAttribute("style"), vt !== me && Yi(L, me, vt);
                  }
                } else if (p)
                  w.delete(L.toLowerCase()), me = gl(e, L, K), K !== me && Yi(L, me, K);
                else if (!ti(L, we, p) && !Da(L, K, we, p)) {
                  var Qt = !1;
                  if (we !== null)
                    w.delete(we.attributeName), me = Bu(e, L, K, we);
                  else {
                    var F = l;
                    if (F === Ga && (F = Zd(t)), F === Ga)
                      w.delete(L.toLowerCase());
                    else {
                      var te = no(L);
                      te !== null && te !== L && (Qt = !0, w.delete(te)), w.delete(L);
                    }
                    me = gl(e, L, K);
                  }
                  K !== me && !Qt && Yi(L, me, K);
                }
              }
            }
          }
        }
      switch (w.size > 0 && !Le && Jl(w), t) {
        case "input":
          Ds(e), Qu(e, s, !0);
          break;
        case "textarea":
          Ds(e), Gu(e);
          break;
        case "select":
        case "option":
          break;
        default:
          typeof s.onClick == "function" && to(e);
          break;
      }
      return J;
    }
    function dm(e, t) {
      var s = e.nodeValue !== t;
      return s;
    }
    function Ff(e, t) {
      Wo(e.nodeValue, t);
    }
    function ql(e, t) {
      {
        if (Vt)
          return;
        Vt = !0, g("Did not expect server HTML to contain a <%s> in <%s>.", t.nodeName.toLowerCase(), e.nodeName.toLowerCase());
      }
    }
    function fm(e, t) {
      {
        if (Vt)
          return;
        Vt = !0, g('Did not expect server HTML to contain the text node "%s" in <%s>.', t.nodeValue, e.nodeName.toLowerCase());
      }
    }
    function hm(e, t, s) {
      {
        if (Vt)
          return;
        Vt = !0, g("Expected server HTML to contain a matching <%s> in <%s>.", t, e.nodeName.toLowerCase());
      }
    }
    function $f(e, t) {
      {
        if (t === "" || Vt)
          return;
        Vt = !0, g('Expected server HTML to contain a matching text node for "%s" in <%s>.', t, e.nodeName.toLowerCase());
      }
    }
    function pm(e, t, s) {
      switch (t) {
        case "input":
          Wd(e, s);
          return;
        case "textarea":
          Xu(e, s);
          return;
        case "select":
          Sg(e, s);
          return;
      }
    }
    function Kl(e) {
      if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u")
        return null;
      try {
        return e.activeElement || e.body;
      } catch {
        return e.body;
      }
    }
    function Ka(e) {
      for (; e && e.firstChild; )
        e = e.firstChild;
      return e;
    }
    function Pg(e) {
      for (; e; ) {
        if (e.nextSibling)
          return e.nextSibling;
        e = e.parentNode;
      }
    }
    function mm(e, t) {
      for (var s = Ka(e), l = 0, d = 0; s; ) {
        if (s.nodeType === sr) {
          if (d = l + s.textContent.length, l <= t && d >= t)
            return {
              node: s,
              offset: t - l
            };
          l = d;
        }
        s = Ka(Pg(s));
      }
    }
    function Qo(e) {
      var t = e.ownerDocument, s = t && t.defaultView || window, l = s.getSelection && s.getSelection();
      if (!l || l.rangeCount === 0)
        return null;
      var d = l.anchorNode, p = l.anchorOffset, w = l.focusNode, b = l.focusOffset;
      try {
        d.nodeType, w.nodeType;
      } catch {
        return null;
      }
      return zg(e, d, p, w, b);
    }
    function zg(e, t, s, l, d) {
      var p = 0, w = -1, b = -1, E = 0, N = 0, k = e, J = null;
      e:
        for (; ; ) {
          for (var L = null; k === t && (s === 0 || k.nodeType === sr) && (w = p + s), k === l && (d === 0 || k.nodeType === sr) && (b = p + d), k.nodeType === sr && (p += k.nodeValue.length), (L = k.firstChild) !== null; )
            J = k, k = L;
          for (; ; ) {
            if (k === e)
              break e;
            if (J === t && ++E === s && (w = p), J === l && ++N === d && (b = p), (L = k.nextSibling) !== null)
              break;
            k = J, J = k.parentNode;
          }
          k = L;
        }
      return w === -1 || b === -1 ? null : {
        start: w,
        end: b
      };
    }
    function vm(e, t) {
      var s = e.ownerDocument || document, l = s && s.defaultView || window;
      if (!!l.getSelection) {
        var d = l.getSelection(), p = e.textContent.length, w = Math.min(t.start, p), b = t.end === void 0 ? w : Math.min(t.end, p);
        if (!d.extend && w > b) {
          var E = b;
          b = w, w = E;
        }
        var N = mm(e, w), k = mm(e, b);
        if (N && k) {
          if (d.rangeCount === 1 && d.anchorNode === N.node && d.anchorOffset === N.offset && d.focusNode === k.node && d.focusOffset === k.offset)
            return;
          var J = s.createRange();
          J.setStart(N.node, N.offset), d.removeAllRanges(), w > b ? (d.addRange(J), d.extend(k.node, k.offset)) : (J.setEnd(k.node, k.offset), d.addRange(J));
        }
      }
    }
    function es(e) {
      return e && e.nodeType === sr;
    }
    function gm(e, t) {
      return !e || !t ? !1 : e === t ? !0 : es(e) ? !1 : es(t) ? gm(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1;
    }
    function Og(e) {
      return e && e.ownerDocument && gm(e.ownerDocument.documentElement, e);
    }
    function ym(e) {
      try {
        return typeof e.contentWindow.location.href == "string";
      } catch {
        return !1;
      }
    }
    function Vc() {
      for (var e = window, t = Kl(); t instanceof e.HTMLIFrameElement; ) {
        if (ym(t))
          e = t.contentWindow;
        else
          return t;
        t = Kl(e.document);
      }
      return t;
    }
    function eu(e) {
      var t = e && e.nodeName && e.nodeName.toLowerCase();
      return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
    }
    function Lg() {
      var e = Vc();
      return {
        activeElementDetached: null,
        focusedElem: e,
        selectionRange: eu(e) ? Vr(e) : null
      };
    }
    function Bg(e) {
      var t = Vc(), s = e.focusedElem, l = e.selectionRange;
      if (t !== s && Og(s)) {
        l !== null && eu(s) && Qf(s, l);
        for (var d = [], p = s; p = p.parentNode; )
          p.nodeType === ar && d.push({
            element: p,
            left: p.scrollLeft,
            top: p.scrollTop
          });
        typeof s.focus == "function" && s.focus();
        for (var w = 0; w < d.length; w++) {
          var b = d[w];
          b.element.scrollLeft = b.left, b.element.scrollTop = b.top;
        }
      }
    }
    function Vr(e) {
      var t;
      return "selectionStart" in e ? t = {
        start: e.selectionStart,
        end: e.selectionEnd
      } : t = Qo(e), t || {
        start: 0,
        end: 0
      };
    }
    function Qf(e, t) {
      var s = t.start, l = t.end;
      l === void 0 && (l = s), "selectionStart" in e ? (e.selectionStart = s, e.selectionEnd = Math.min(l, e.value.length)) : vm(e, t);
    }
    var tu = function() {
    }, hr = function() {
    };
    {
      var Hc = ["address", "applet", "area", "article", "aside", "base", "basefont", "bgsound", "blockquote", "body", "br", "button", "caption", "center", "col", "colgroup", "dd", "details", "dir", "div", "dl", "dt", "embed", "fieldset", "figcaption", "figure", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "iframe", "img", "input", "isindex", "li", "link", "listing", "main", "marquee", "menu", "menuitem", "meta", "nav", "noembed", "noframes", "noscript", "object", "ol", "p", "param", "plaintext", "pre", "script", "section", "select", "source", "style", "summary", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "title", "tr", "track", "ul", "wbr", "xmp"], fa = [
        "applet",
        "caption",
        "html",
        "table",
        "td",
        "th",
        "marquee",
        "object",
        "template",
        "foreignObject",
        "desc",
        "title"
      ], Zf = fa.concat(["button"]), Yf = ["dd", "dt", "li", "option", "optgroup", "p", "rp", "rt"], wm = {
        current: null,
        formTag: null,
        aTagInScope: null,
        buttonTagInScope: null,
        nobrTagInScope: null,
        pTagInButtonScope: null,
        listItemTagAutoclosing: null,
        dlItemTagAutoclosing: null
      };
      hr = function(e, t) {
        var s = i({}, e || wm), l = {
          tag: t
        };
        return fa.indexOf(t) !== -1 && (s.aTagInScope = null, s.buttonTagInScope = null, s.nobrTagInScope = null), Zf.indexOf(t) !== -1 && (s.pTagInButtonScope = null), Hc.indexOf(t) !== -1 && t !== "address" && t !== "div" && t !== "p" && (s.listItemTagAutoclosing = null, s.dlItemTagAutoclosing = null), s.current = l, t === "form" && (s.formTag = l), t === "a" && (s.aTagInScope = l), t === "button" && (s.buttonTagInScope = l), t === "nobr" && (s.nobrTagInScope = l), t === "p" && (s.pTagInButtonScope = l), t === "li" && (s.listItemTagAutoclosing = l), (t === "dd" || t === "dt") && (s.dlItemTagAutoclosing = l), s;
      };
      var bm = function(e, t) {
        switch (t) {
          case "select":
            return e === "option" || e === "optgroup" || e === "#text";
          case "optgroup":
            return e === "option" || e === "#text";
          case "option":
            return e === "#text";
          case "tr":
            return e === "th" || e === "td" || e === "style" || e === "script" || e === "template";
          case "tbody":
          case "thead":
          case "tfoot":
            return e === "tr" || e === "style" || e === "script" || e === "template";
          case "colgroup":
            return e === "col" || e === "template";
          case "table":
            return e === "caption" || e === "colgroup" || e === "tbody" || e === "tfoot" || e === "thead" || e === "style" || e === "script" || e === "template";
          case "head":
            return e === "base" || e === "basefont" || e === "bgsound" || e === "link" || e === "meta" || e === "title" || e === "noscript" || e === "noframes" || e === "style" || e === "script" || e === "template";
          case "html":
            return e === "head" || e === "body" || e === "frameset";
          case "frameset":
            return e === "frame";
          case "#document":
            return e === "html";
        }
        switch (e) {
          case "h1":
          case "h2":
          case "h3":
          case "h4":
          case "h5":
          case "h6":
            return t !== "h1" && t !== "h2" && t !== "h3" && t !== "h4" && t !== "h5" && t !== "h6";
          case "rp":
          case "rt":
            return Yf.indexOf(t) === -1;
          case "body":
          case "caption":
          case "col":
          case "colgroup":
          case "frameset":
          case "frame":
          case "head":
          case "html":
          case "tbody":
          case "td":
          case "tfoot":
          case "th":
          case "thead":
          case "tr":
            return t == null;
        }
        return !0;
      }, io = function(e, t) {
        switch (e) {
          case "address":
          case "article":
          case "aside":
          case "blockquote":
          case "center":
          case "details":
          case "dialog":
          case "dir":
          case "div":
          case "dl":
          case "fieldset":
          case "figcaption":
          case "figure":
          case "footer":
          case "header":
          case "hgroup":
          case "main":
          case "menu":
          case "nav":
          case "ol":
          case "p":
          case "section":
          case "summary":
          case "ul":
          case "pre":
          case "listing":
          case "table":
          case "hr":
          case "xmp":
          case "h1":
          case "h2":
          case "h3":
          case "h4":
          case "h5":
          case "h6":
            return t.pTagInButtonScope;
          case "form":
            return t.formTag || t.pTagInButtonScope;
          case "li":
            return t.listItemTagAutoclosing;
          case "dd":
          case "dt":
            return t.dlItemTagAutoclosing;
          case "button":
            return t.buttonTagInScope;
          case "a":
            return t.aTagInScope;
          case "nobr":
            return t.nobrTagInScope;
        }
        return null;
      }, Gf = {};
      tu = function(e, t, s) {
        s = s || wm;
        var l = s.current, d = l && l.tag;
        t != null && (e != null && g("validateDOMNesting: when childText is passed, childTag should be null"), e = "#text");
        var p = bm(e, d) ? null : l, w = p ? null : io(e, s), b = p || w;
        if (!!b) {
          var E = b.tag, N = ft(), k = !!p + "|" + e + "|" + E + "|" + N;
          if (!Gf[k]) {
            Gf[k] = !0;
            var J = e, L = "";
            if (e === "#text" ? /\S/.test(t) ? J = "Text nodes" : (J = "Whitespace text nodes", L = " Make sure you don't have any extra whitespace between tags on each line of your source code.") : J = "<" + e + ">", p) {
              var K = "";
              E === "table" && e === "tr" && (K += " Add a <tbody>, <thead> or <tfoot> to your code to match the DOM tree generated by the browser."), g("validateDOMNesting(...): %s cannot appear as a child of <%s>.%s%s", J, E, L, K);
            } else
              g("validateDOMNesting(...): %s cannot appear as a descendant of <%s>.", J, E);
          }
        }
      };
    }
    var ts;
    ts = "suppressHydrationWarning";
    var nu = "$", Wc = "/$", Fc = "$?", iu = "$!", Xf = "style", ro = null, Jf = null;
    function ru(e, t) {
      switch (e) {
        case "button":
        case "input":
        case "select":
        case "textarea":
          return !!t.autoFocus;
      }
      return !1;
    }
    function jg(e) {
      var t, s, l = e.nodeType;
      switch (l) {
        case ka:
        case qu: {
          t = l === ka ? "#document" : "#fragment";
          var d = e.documentElement;
          s = d ? d.namespaceURI : Yd(null, "");
          break;
        }
        default: {
          var p = l === ai ? e.parentNode : e, w = p.namespaceURI || null;
          t = p.tagName, s = Yd(w, t);
          break;
        }
      }
      {
        var b = t.toLowerCase(), E = hr(null, b);
        return {
          namespace: s,
          ancestorInfo: E
        };
      }
    }
    function Sm(e, t, s) {
      {
        var l = e, d = Yd(l.namespace, t), p = hr(l.ancestorInfo, t);
        return {
          namespace: d,
          ancestorInfo: p
        };
      }
    }
    function NS(e) {
      return e;
    }
    function n(e) {
      ro = Ac(), Jf = Lg(), kf(!1);
    }
    function a(e) {
      Bg(Jf), kf(ro), ro = null, Jf = null;
    }
    function u(e, t, s, l, d) {
      var p;
      {
        var w = l;
        if (tu(e, null, w.ancestorInfo), typeof t.children == "string" || typeof t.children == "number") {
          var b = "" + t.children, E = hr(w.ancestorInfo, e);
          tu(null, b, E);
        }
        p = w.namespace;
      }
      var N = om(e, t, s, p);
      return Cm(d, N), Fg(N, t), N;
    }
    function f(e, t) {
      e.appendChild(t);
    }
    function v(e, t, s, l, d) {
      return _g(e, t, s, l), ru(t, s);
    }
    function S(e, t, s, l, d, p) {
      {
        var w = p;
        if (typeof l.children != typeof s.children && (typeof l.children == "string" || typeof l.children == "number")) {
          var b = "" + l.children, E = hr(w.ancestorInfo, t);
          tu(null, b, E);
        }
      }
      return lm(e, t, s, l, d);
    }
    function T(e, t) {
      return e === "textarea" || e === "option" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
    }
    function R(e, t) {
      return !!t.hidden;
    }
    function W(e, t, s, l) {
      {
        var d = s;
        tu(null, e, d.ancestorInfo);
      }
      var p = Wf(e, t);
      return Cm(l, p), p;
    }
    var U = typeof setTimeout == "function" ? setTimeout : void 0, Me = typeof clearTimeout == "function" ? clearTimeout : void 0, De = -1;
    function mt(e, t, s, l) {
      ru(t, s) && e.focus();
    }
    function Et(e, t, s, l, d, p) {
      Fg(e, d), um(e, t, s, l, d);
    }
    function Pi(e) {
      Ml(e, "");
    }
    function Fn(e, t, s) {
      e.nodeValue = s;
    }
    function O(e, t) {
      e.appendChild(t);
    }
    function P(e, t) {
      var s;
      e.nodeType === ai ? (s = e.parentNode, s.insertBefore(t, e)) : (s = e, s.appendChild(t));
      var l = e._reactRootContainer;
      l == null && s.onclick === null && to(s);
    }
    function Q(e, t, s) {
      e.insertBefore(t, s);
    }
    function le(e, t, s) {
      e.nodeType === ai ? e.parentNode.insertBefore(t, s) : e.insertBefore(t, s);
    }
    function ye(e, t) {
      e.removeChild(t);
    }
    function _e(e, t) {
      e.nodeType === ai ? e.parentNode.removeChild(t) : e.removeChild(t);
    }
    function qe(e) {
      e = e;
      var t = e.style;
      typeof t.setProperty == "function" ? t.setProperty("display", "none", "important") : t.display = "none";
    }
    function bt(e) {
      e.nodeValue = "";
    }
    function un(e, t) {
      e = e;
      var s = t[Xf], l = s != null && s.hasOwnProperty("display") ? s.display : null;
      e.style.display = Nc("display", l);
    }
    function lt(e, t) {
      e.nodeValue = t;
    }
    function ns(e, t, s) {
      return e.nodeType !== ar || t.toLowerCase() !== e.nodeName.toLowerCase() ? null : e;
    }
    function Ug(e, t) {
      return t === "" || e.nodeType !== sr ? null : e;
    }
    function ZE(e) {
      return e.data === Fc;
    }
    function YE(e) {
      return e.data === iu;
    }
    function kS(e) {
      for (; e != null; e = e.nextSibling) {
        var t = e.nodeType;
        if (t === ar || t === sr)
          break;
      }
      return e;
    }
    function xm(e) {
      return kS(e.nextSibling);
    }
    function _S(e) {
      return kS(e.firstChild);
    }
    function GE(e, t, s, l, d, p) {
      Cm(p, e), Fg(e, s);
      var w;
      {
        var b = d;
        w = b.namespace;
      }
      return cm(e, t, s, w, l);
    }
    function XE(e, t, s) {
      return Cm(s, e), dm(e, t);
    }
    function JE(e) {
      for (var t = e.nextSibling, s = 0; t; ) {
        if (t.nodeType === ai) {
          var l = t.data;
          if (l === Wc) {
            if (s === 0)
              return xm(t);
            s--;
          } else
            (l === nu || l === iu || l === Fc) && s++;
        }
        t = t.nextSibling;
      }
      return null;
    }
    function PS(e) {
      for (var t = e.previousSibling, s = 0; t; ) {
        if (t.nodeType === ai) {
          var l = t.data;
          if (l === nu || l === iu || l === Fc) {
            if (s === 0)
              return t;
            s--;
          } else
            l === Wc && s++;
        }
        t = t.previousSibling;
      }
      return null;
    }
    function qE(e) {
      Cc(e);
    }
    function KE(e) {
      Cc(e);
    }
    function eI(e, t, s) {
      Ff(t, s);
    }
    function tI(e, t, s, l, d) {
      t[ts] !== !0 && Ff(l, d);
    }
    function nI(e, t) {
      t.nodeType === ar ? ql(e, t) : t.nodeType === ai || fm(e, t);
    }
    function iI(e, t, s, l) {
      t[ts] !== !0 && (l.nodeType === ar ? ql(s, l) : l.nodeType === ai || fm(s, l));
    }
    function rI(e, t, s) {
      hm(e, t);
    }
    function aI(e, t) {
      $f(e, t);
    }
    function sI(e, t, s, l, d) {
      t[ts] !== !0 && hm(s, l);
    }
    function oI(e, t, s, l) {
      t[ts] !== !0 && $f(s, l);
    }
    function lI(e, t, s) {
      t[ts];
    }
    var Vg = Math.random().toString(36).slice(2), qf = "__reactInternalInstance$" + Vg, zS = "__reactEventHandlers$" + Vg, Kf = "__reactContainere$" + Vg;
    function Cm(e, t) {
      t[qf] = e;
    }
    function uI(e, t) {
      t[Kf] = e;
    }
    function OS(e) {
      e[Kf] = null;
    }
    function Hg(e) {
      return !!e[Kf];
    }
    function eh(e) {
      var t = e[qf];
      if (t)
        return t;
      for (var s = e.parentNode; s; ) {
        if (t = s[Kf] || s[qf], t) {
          var l = t.alternate;
          if (t.child !== null || l !== null && l.child !== null)
            for (var d = PS(e); d !== null; ) {
              var p = d[qf];
              if (p)
                return p;
              d = PS(d);
            }
          return t;
        }
        e = s, s = e.parentNode;
      }
      return null;
    }
    function Zo(e) {
      var t = e[qf] || e[Kf];
      return t && (t.tag === Re || t.tag === $e || t.tag === ee || t.tag === Se) ? t : null;
    }
    function au(e) {
      if (e.tag === Re || e.tag === $e)
        return e.stateNode;
      throw Error("getNodeFromInstance: Invalid argument.");
    }
    function Wg(e) {
      return e[zS] || null;
    }
    function Fg(e, t) {
      e[zS] = t;
    }
    function ao(e) {
      do
        e = e.return;
      while (e && e.tag !== Re);
      return e || null;
    }
    function cI(e, t) {
      for (var s = 0, l = e; l; l = ao(l))
        s++;
      for (var d = 0, p = t; p; p = ao(p))
        d++;
      for (; s - d > 0; )
        e = ao(e), s--;
      for (; d - s > 0; )
        t = ao(t), d--;
      for (var w = s; w--; ) {
        if (e === t || e === t.alternate)
          return e;
        e = ao(e), t = ao(t);
      }
      return null;
    }
    function dI(e, t, s) {
      for (var l = []; e; )
        l.push(e), e = ao(e);
      var d;
      for (d = l.length; d-- > 0; )
        t(l[d], "captured", s);
      for (d = 0; d < l.length; d++)
        t(l[d], "bubbled", s);
    }
    function fI(e, t, s, l, d) {
      for (var p = e && t ? cI(e, t) : null, w = []; !(!e || e === p); ) {
        var b = e.alternate;
        if (b !== null && b === p)
          break;
        w.push(e), e = ao(e);
      }
      for (var E = []; !(!t || t === p); ) {
        var N = t.alternate;
        if (N !== null && N === p)
          break;
        E.push(t), t = ao(t);
      }
      for (var k = 0; k < w.length; k++)
        s(w[k], "bubbled", l);
      for (var J = E.length; J-- > 0; )
        s(E[J], "captured", d);
    }
    function hI(e) {
      return e === "button" || e === "input" || e === "select" || e === "textarea";
    }
    function pI(e, t, s) {
      switch (e) {
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
          return !!(s.disabled && hI(t));
        default:
          return !1;
      }
    }
    function LS(e, t) {
      var s, l = e.stateNode;
      if (!l)
        return null;
      var d = Fe(l);
      if (!d || (s = d[t], pI(t, e.type, d)))
        return null;
      if (!(!s || typeof s == "function"))
        throw Error("Expected `" + t + "` listener to be a function, instead got a value of `" + typeof s + "` type.");
      return s;
    }
    function mI(e, t, s) {
      var l = t.dispatchConfig.phasedRegistrationNames[s];
      return LS(e, l);
    }
    function vI(e, t, s) {
      e || g("Dispatching inst must not be null");
      var l = mI(e, s, t);
      l && (s._dispatchListeners = Vs(s._dispatchListeners, l), s._dispatchInstances = Vs(s._dispatchInstances, e));
    }
    function gI(e) {
      e && e.dispatchConfig.phasedRegistrationNames && dI(e._targetInst, vI, e);
    }
    function BS(e, t, s) {
      if (e && s && s.dispatchConfig.registrationName) {
        var l = s.dispatchConfig.registrationName, d = LS(e, l);
        d && (s._dispatchListeners = Vs(s._dispatchListeners, d), s._dispatchInstances = Vs(s._dispatchInstances, e));
      }
    }
    function yI(e) {
      e && e.dispatchConfig.registrationName && BS(e._targetInst, null, e);
    }
    function $c(e) {
      Oo(e, gI);
    }
    function wI(e, t, s, l) {
      fI(s, l, BS, e, t);
    }
    function bI(e) {
      Oo(e, yI);
    }
    var th = null, $g = null, nh = null;
    function SI(e) {
      return th = e, $g = US(), !0;
    }
    function xI() {
      th = null, $g = null, nh = null;
    }
    function jS() {
      if (nh)
        return nh;
      var e, t = $g, s = t.length, l, d = US(), p = d.length;
      for (e = 0; e < s && t[e] === d[e]; e++)
        ;
      var w = s - e;
      for (l = 1; l <= w && t[s - l] === d[p - l]; l++)
        ;
      var b = l > 1 ? 1 - l : void 0;
      return nh = d.slice(e, b), nh;
    }
    function US() {
      return "value" in th ? th.value : th.textContent;
    }
    var CI = 10, TI = {
      type: null,
      target: null,
      currentTarget: function() {
        return null;
      },
      eventPhase: null,
      bubbles: null,
      cancelable: null,
      timeStamp: function(e) {
        return e.timeStamp || Date.now();
      },
      defaultPrevented: null,
      isTrusted: null
    };
    function Tm() {
      return !0;
    }
    function su() {
      return !1;
    }
    function pr(e, t, s, l) {
      delete this.nativeEvent, delete this.preventDefault, delete this.stopPropagation, delete this.isDefaultPrevented, delete this.isPropagationStopped, this.dispatchConfig = e, this._targetInst = t, this.nativeEvent = s;
      var d = this.constructor.Interface;
      for (var p in d)
        if (!!d.hasOwnProperty(p)) {
          delete this[p];
          var w = d[p];
          w ? this[p] = w(s) : p === "target" ? this.target = l : this[p] = s[p];
        }
      var b = s.defaultPrevented != null ? s.defaultPrevented : s.returnValue === !1;
      return b ? this.isDefaultPrevented = Tm : this.isDefaultPrevented = su, this.isPropagationStopped = su, this;
    }
    i(pr.prototype, {
      preventDefault: function() {
        this.defaultPrevented = !0;
        var e = this.nativeEvent;
        !e || (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = Tm);
      },
      stopPropagation: function() {
        var e = this.nativeEvent;
        !e || (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = Tm);
      },
      persist: function() {
        this.isPersistent = Tm;
      },
      isPersistent: su,
      destructor: function() {
        var e = this.constructor.Interface;
        for (var t in e)
          Object.defineProperty(this, t, Qc(t, e[t]));
        this.dispatchConfig = null, this._targetInst = null, this.nativeEvent = null, this.isDefaultPrevented = su, this.isPropagationStopped = su, this._dispatchListeners = null, this._dispatchInstances = null, Object.defineProperty(this, "nativeEvent", Qc("nativeEvent", null)), Object.defineProperty(this, "isDefaultPrevented", Qc("isDefaultPrevented", su)), Object.defineProperty(this, "isPropagationStopped", Qc("isPropagationStopped", su)), Object.defineProperty(this, "preventDefault", Qc("preventDefault", function() {
        })), Object.defineProperty(this, "stopPropagation", Qc("stopPropagation", function() {
        }));
      }
    }), pr.Interface = TI, pr.extend = function(e) {
      var t = this, s = function() {
      };
      s.prototype = t.prototype;
      var l = new s();
      function d() {
        return t.apply(this, arguments);
      }
      return i(l, d.prototype), d.prototype = l, d.prototype.constructor = d, d.Interface = i({}, t.Interface, e), d.extend = t.extend, VS(d), d;
    }, VS(pr);
    function Qc(e, t) {
      var s = typeof t == "function";
      return {
        configurable: !0,
        set: l,
        get: d
      };
      function l(w) {
        var b = s ? "setting the method" : "setting the property";
        return p(b, "This is effectively a no-op"), w;
      }
      function d() {
        var w = s ? "accessing the method" : "accessing the property", b = s ? "This is a no-op function" : "This is set to null";
        return p(w, b), t;
      }
      function p(w, b) {
        g("This synthetic event is reused for performance reasons. If you're seeing this, you're %s `%s` on a released/nullified synthetic event. %s. If you must keep the original synthetic event around, use event.persist(). See https://fb.me/react-event-pooling for more information.", w, e, b);
      }
    }
    function MI(e, t, s, l) {
      var d = this;
      if (d.eventPool.length) {
        var p = d.eventPool.pop();
        return d.call(p, e, t, s, l), p;
      }
      return new d(e, t, s, l);
    }
    function EI(e) {
      var t = this;
      if (!(e instanceof t))
        throw Error("Trying to release an event instance into a pool of a different type.");
      e.destructor(), t.eventPool.length < CI && t.eventPool.push(e);
    }
    function VS(e) {
      e.eventPool = [], e.getPooled = MI, e.release = EI;
    }
    var II = pr.extend({
      data: null
    }), AI = pr.extend({
      data: null
    }), RI = [9, 13, 27, 32], HS = 229, Qg = jn && "CompositionEvent" in window, ih = null;
    jn && "documentMode" in document && (ih = document.documentMode);
    var DI = jn && "TextEvent" in window && !ih, WS = jn && (!Qg || ih && ih > 8 && ih <= 11), FS = 32, $S = String.fromCharCode(FS), so = {
      beforeInput: {
        phasedRegistrationNames: {
          bubbled: "onBeforeInput",
          captured: "onBeforeInputCapture"
        },
        dependencies: [aa, Fi, Ol, zl]
      },
      compositionEnd: {
        phasedRegistrationNames: {
          bubbled: "onCompositionEnd",
          captured: "onCompositionEndCapture"
        },
        dependencies: [Vn, aa, Hn, Fi, si, oa]
      },
      compositionStart: {
        phasedRegistrationNames: {
          bubbled: "onCompositionStart",
          captured: "onCompositionStartCapture"
        },
        dependencies: [Vn, Al, Hn, Fi, si, oa]
      },
      compositionUpdate: {
        phasedRegistrationNames: {
          bubbled: "onCompositionUpdate",
          captured: "onCompositionUpdateCapture"
        },
        dependencies: [Vn, qd, Hn, Fi, si, oa]
      }
    }, QS = !1;
    function NI(e) {
      return (e.ctrlKey || e.altKey || e.metaKey) && !(e.ctrlKey && e.altKey);
    }
    function kI(e) {
      switch (e) {
        case Al:
          return so.compositionStart;
        case aa:
          return so.compositionEnd;
        case qd:
          return so.compositionUpdate;
      }
    }
    function _I(e, t) {
      return e === Hn && t.keyCode === HS;
    }
    function ZS(e, t) {
      switch (e) {
        case si:
          return RI.indexOf(t.keyCode) !== -1;
        case Hn:
          return t.keyCode !== HS;
        case Fi:
        case oa:
        case Vn:
          return !0;
        default:
          return !1;
      }
    }
    function YS(e) {
      var t = e.detail;
      return typeof t == "object" && "data" in t ? t.data : null;
    }
    function GS(e) {
      return e.locale === "ko";
    }
    var Zc = !1;
    function PI(e, t, s, l) {
      var d, p;
      if (Qg ? d = kI(e) : Zc ? ZS(e, s) && (d = so.compositionEnd) : _I(e, s) && (d = so.compositionStart), !d)
        return null;
      WS && !GS(s) && (!Zc && d === so.compositionStart ? Zc = SI(l) : d === so.compositionEnd && Zc && (p = jS()));
      var w = II.getPooled(d, t, s, l);
      if (p)
        w.data = p;
      else {
        var b = YS(s);
        b !== null && (w.data = b);
      }
      return $c(w), w;
    }
    function zI(e, t) {
      switch (e) {
        case aa:
          return YS(t);
        case Fi:
          var s = t.which;
          return s !== FS ? null : (QS = !0, $S);
        case Ol:
          var l = t.data;
          return l === $S && QS ? null : l;
        default:
          return null;
      }
    }
    function OI(e, t) {
      if (Zc) {
        if (e === aa || !Qg && ZS(e, t)) {
          var s = jS();
          return xI(), Zc = !1, s;
        }
        return null;
      }
      switch (e) {
        case zl:
          return null;
        case Fi:
          if (!NI(t)) {
            if (t.char && t.char.length > 1)
              return t.char;
            if (t.which)
              return String.fromCharCode(t.which);
          }
          return null;
        case aa:
          return WS && !GS(t) ? null : t.data;
        default:
          return null;
      }
    }
    function LI(e, t, s, l) {
      var d;
      if (DI ? d = zI(e, s) : d = OI(e, s), !d)
        return null;
      var p = AI.getPooled(so.beforeInput, t, s, l);
      return p.data = d, $c(p), p;
    }
    var BI = {
      eventTypes: so,
      extractEvents: function(e, t, s, l, d) {
        var p = PI(e, t, s, l), w = LI(e, t, s, l);
        return p === null ? w : w === null ? p : [p, w];
      }
    }, jI = {
      color: !0,
      date: !0,
      datetime: !0,
      "datetime-local": !0,
      email: !0,
      month: !0,
      number: !0,
      password: !0,
      range: !0,
      search: !0,
      tel: !0,
      text: !0,
      time: !0,
      url: !0,
      week: !0
    };
    function XS(e) {
      var t = e && e.nodeName && e.nodeName.toLowerCase();
      return t === "input" ? !!jI[e.type] : t === "textarea";
    }
    var JS = {
      change: {
        phasedRegistrationNames: {
          bubbled: "onChange",
          captured: "onChangeCapture"
        },
        dependencies: [Vn, za, Il, Wi, kl, Hn, si, ja]
      }
    };
    function qS(e, t, s) {
      var l = pr.getPooled(JS.change, e, t, s);
      return l.type = "change", Ti(s), $c(l), l;
    }
    var rh = null, ah = null;
    function UI(e) {
      var t = e.nodeName && e.nodeName.toLowerCase();
      return t === "select" || t === "input" && e.type === "file";
    }
    function VI(e) {
      var t = qS(ah, e, jl(e));
      Jr(HI, t);
    }
    function HI(e) {
      mc(e);
    }
    function Mm(e) {
      var t = au(e);
      if (Hu(t))
        return e;
    }
    function WI(e, t) {
      if (e === za)
        return t;
    }
    var Zg = !1;
    jn && (Zg = Ul("input") && (!document.documentMode || document.documentMode > 9));
    function FI(e, t) {
      rh = e, ah = t, rh.attachEvent("onpropertychange", ex);
    }
    function KS() {
      !rh || (rh.detachEvent("onpropertychange", ex), rh = null, ah = null);
    }
    function ex(e) {
      e.propertyName === "value" && Mm(ah) && VI(e);
    }
    function $I(e, t, s) {
      e === Wi ? (KS(), FI(t, s)) : e === Vn && KS();
    }
    function QI(e, t) {
      if (e === ja || e === si || e === Hn)
        return Mm(ah);
    }
    function ZI(e) {
      var t = e.nodeName;
      return t && t.toLowerCase() === "input" && (e.type === "checkbox" || e.type === "radio");
    }
    function YI(e, t) {
      if (e === Il)
        return Mm(t);
    }
    function GI(e, t) {
      if (e === kl || e === za)
        return Mm(t);
    }
    function XI(e) {
      var t = e._wrapperState;
      !t || !t.controlled || e.type !== "number" || bl(e, "number", e.value);
    }
    var JI = {
      eventTypes: JS,
      _isInputEventSupported: Zg,
      extractEvents: function(e, t, s, l, d) {
        var p = t ? au(t) : window, w, b;
        if (UI(p) ? w = WI : XS(p) ? Zg ? w = GI : (w = QI, b = $I) : ZI(p) && (w = YI), w) {
          var E = w(e, t);
          if (E) {
            var N = qS(E, s, l);
            return N;
          }
        }
        b && b(e, p, t), e === Vn && XI(p);
      }
    }, sh = pr.extend({
      view: null,
      detail: null
    }), qI = {
      Alt: "altKey",
      Control: "ctrlKey",
      Meta: "metaKey",
      Shift: "shiftKey"
    };
    function KI(e) {
      var t = this, s = t.nativeEvent;
      if (s.getModifierState)
        return s.getModifierState(e);
      var l = qI[e];
      return l ? !!s[l] : !1;
    }
    function Yg(e) {
      return KI;
    }
    var tx = 0, nx = 0, ix = !1, rx = !1, oh = sh.extend({
      screenX: null,
      screenY: null,
      clientX: null,
      clientY: null,
      pageX: null,
      pageY: null,
      ctrlKey: null,
      shiftKey: null,
      altKey: null,
      metaKey: null,
      getModifierState: Yg,
      button: null,
      buttons: null,
      relatedTarget: function(e) {
        return e.relatedTarget || (e.fromElement === e.srcElement ? e.toElement : e.fromElement);
      },
      movementX: function(e) {
        if ("movementX" in e)
          return e.movementX;
        var t = tx;
        return tx = e.screenX, ix ? e.type === "mousemove" ? e.screenX - t : 0 : (ix = !0, 0);
      },
      movementY: function(e) {
        if ("movementY" in e)
          return e.movementY;
        var t = nx;
        return nx = e.screenY, rx ? e.type === "mousemove" ? e.screenY - t : 0 : (rx = !0, 0);
      }
    }), ax = oh.extend({
      pointerId: null,
      width: null,
      height: null,
      pressure: null,
      tangentialPressure: null,
      tiltX: null,
      tiltY: null,
      twist: null,
      pointerType: null,
      isPrimary: null
    }), lh = {
      mouseEnter: {
        registrationName: "onMouseEnter",
        dependencies: [La, la]
      },
      mouseLeave: {
        registrationName: "onMouseLeave",
        dependencies: [La, la]
      },
      pointerEnter: {
        registrationName: "onPointerEnter",
        dependencies: [Ai, St]
      },
      pointerLeave: {
        registrationName: "onPointerLeave",
        dependencies: [Ai, St]
      }
    }, eA = {
      eventTypes: lh,
      extractEvents: function(e, t, s, l, d) {
        var p = e === la || e === St, w = e === La || e === Ai;
        if (p && (d & Vi) === 0 && (s.relatedTarget || s.fromElement) || !w && !p)
          return null;
        var b;
        if (l.window === l)
          b = l;
        else {
          var E = l.ownerDocument;
          E ? b = E.defaultView || E.parentWindow : b = window;
        }
        var N, k;
        if (w) {
          N = t;
          var J = s.relatedTarget || s.toElement;
          if (k = J ? eh(J) : null, k !== null) {
            var L = vi(k);
            (k !== L || k.tag !== Re && k.tag !== $e) && (k = null);
          }
        } else
          N = null, k = t;
        if (N === k)
          return null;
        var K, me, we, Ke;
        e === La || e === la ? (K = oh, me = lh.mouseLeave, we = lh.mouseEnter, Ke = "mouse") : (e === Ai || e === St) && (K = ax, me = lh.pointerLeave, we = lh.pointerEnter, Ke = "pointer");
        var nt = N == null ? b : au(N), Pt = k == null ? b : au(k), vt = K.getPooled(me, N, s, l);
        vt.type = Ke + "leave", vt.target = nt, vt.relatedTarget = Pt;
        var Qt = K.getPooled(we, k, s, l);
        return Qt.type = Ke + "enter", Qt.target = Pt, Qt.relatedTarget = nt, wI(vt, Qt, N, k), (d & Ta) === 0 ? [vt] : [vt, Qt];
      }
    };
    function tA(e, t) {
      return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
    }
    var ou = typeof Object.is == "function" ? Object.is : tA, nA = Object.prototype.hasOwnProperty;
    function uh(e, t) {
      if (ou(e, t))
        return !0;
      if (typeof e != "object" || e === null || typeof t != "object" || t === null)
        return !1;
      var s = Object.keys(e), l = Object.keys(t);
      if (s.length !== l.length)
        return !1;
      for (var d = 0; d < s.length; d++)
        if (!nA.call(t, s[d]) || !ou(e[s[d]], t[s[d]]))
          return !1;
      return !0;
    }
    var iA = jn && "documentMode" in document && document.documentMode <= 11, sx = {
      select: {
        phasedRegistrationNames: {
          bubbled: "onSelect",
          captured: "onSelectCapture"
        },
        dependencies: [Vn, Rl, Dl, Wi, Hn, si, oa, Pl, ja]
      }
    }, Yc = null, Gg = null, ch = null, Xg = !1;
    function rA(e) {
      if ("selectionStart" in e && eu(e))
        return {
          start: e.selectionStart,
          end: e.selectionEnd
        };
      var t = e.ownerDocument && e.ownerDocument.defaultView || window, s = t.getSelection();
      return {
        anchorNode: s.anchorNode,
        anchorOffset: s.anchorOffset,
        focusNode: s.focusNode,
        focusOffset: s.focusOffset
      };
    }
    function ox(e) {
      return e.window === e ? e.document : e.nodeType === ka ? e : e.ownerDocument;
    }
    function lx(e, t) {
      var s = ox(t);
      if (Xg || Yc == null || Yc !== Kl(s))
        return null;
      var l = rA(Yc);
      if (!ch || !uh(ch, l)) {
        ch = l;
        var d = pr.getPooled(sx.select, Gg, e, t);
        return d.type = "select", d.target = Yc, $c(d), d;
      }
      return null;
    }
    var aA = {
      eventTypes: sx,
      extractEvents: function(e, t, s, l, d, p) {
        var w = p || ox(l);
        if (!w || !jo("onSelect", w))
          return null;
        var b = t ? au(t) : window;
        switch (e) {
          case Wi:
            (XS(b) || b.contentEditable === "true") && (Yc = b, Gg = t, ch = null);
            break;
          case Vn:
            Yc = null, Gg = null, ch = null;
            break;
          case oa:
            Xg = !0;
            break;
          case Rl:
          case Pl:
          case Dl:
            return Xg = !1, lx(s, l);
          case ja:
            if (iA)
              break;
          case Hn:
          case si:
            return lx(s, l);
        }
        return null;
      }
    }, sA = pr.extend({
      animationName: null,
      elapsedTime: null,
      pseudoElement: null
    }), oA = pr.extend({
      clipboardData: function(e) {
        return "clipboardData" in e ? e.clipboardData : window.clipboardData;
      }
    }), lA = sh.extend({
      relatedTarget: null
    });
    function Em(e) {
      var t, s = e.keyCode;
      return "charCode" in e ? (t = e.charCode, t === 0 && s === 13 && (t = 13)) : t = s, t === 10 && (t = 13), t >= 32 || t === 13 ? t : 0;
    }
    var uA = {
      Esc: "Escape",
      Spacebar: " ",
      Left: "ArrowLeft",
      Up: "ArrowUp",
      Right: "ArrowRight",
      Down: "ArrowDown",
      Del: "Delete",
      Win: "OS",
      Menu: "ContextMenu",
      Apps: "ContextMenu",
      Scroll: "ScrollLock",
      MozPrintableKey: "Unidentified"
    }, cA = {
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
    };
    function dA(e) {
      if (e.key) {
        var t = uA[e.key] || e.key;
        if (t !== "Unidentified")
          return t;
      }
      if (e.type === "keypress") {
        var s = Em(e);
        return s === 13 ? "Enter" : String.fromCharCode(s);
      }
      return e.type === "keydown" || e.type === "keyup" ? cA[e.keyCode] || "Unidentified" : "";
    }
    var fA = sh.extend({
      key: dA,
      location: null,
      ctrlKey: null,
      shiftKey: null,
      altKey: null,
      metaKey: null,
      repeat: null,
      locale: null,
      getModifierState: Yg,
      charCode: function(e) {
        return e.type === "keypress" ? Em(e) : 0;
      },
      keyCode: function(e) {
        return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
      },
      which: function(e) {
        return e.type === "keypress" ? Em(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
      }
    }), hA = oh.extend({
      dataTransfer: null
    }), pA = sh.extend({
      touches: null,
      targetTouches: null,
      changedTouches: null,
      altKey: null,
      metaKey: null,
      ctrlKey: null,
      shiftKey: null,
      getModifierState: Yg
    }), mA = pr.extend({
      propertyName: null,
      elapsedTime: null,
      pseudoElement: null
    }), vA = oh.extend({
      deltaX: function(e) {
        return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
      },
      deltaY: function(e) {
        return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
      },
      deltaZ: null,
      deltaMode: null
    }), gA = [Gd, ec, _s, Ps, Do, nc, Bs, af, sf, Ii, kl, zr, Oa, of, lf, ic, uf, cf, df, Or, Pn, En, Ba, Qn, sc, js, No, pf, ko, cc, dc], yA = {
      eventTypes: Nf,
      extractEvents: function(e, t, s, l, d) {
        var p = Mc.get(e);
        if (!p)
          return null;
        var w;
        switch (e) {
          case Fi:
            if (Em(s) === 0)
              return null;
          case Hn:
          case si:
            w = fA;
            break;
          case Vn:
          case Wi:
            w = lA;
            break;
          case Il:
            if (s.button === 2)
              return null;
          case zs:
          case tf:
          case oa:
          case _l:
          case Pl:
          case La:
          case la:
          case Rl:
            w = oh;
            break;
          case kp:
          case Dl:
          case Os:
          case nf:
          case Nl:
          case rf:
          case tc:
          case Ls:
            w = hA;
            break;
          case oc:
          case lc:
          case uc:
          case mf:
            w = pA;
            break;
          case Np:
          case Xd:
          case Jd:
            w = sA;
            break;
          case Ll:
            w = mA;
            break;
          case Lr:
            w = sh;
            break;
          case vf:
            w = vA;
            break;
          case Kd:
          case ef:
          case zl:
            w = oA;
            break;
          case sa:
          case rc:
          case ff:
          case hf:
          case ac:
          case Ai:
          case St:
          case sn:
            w = ax;
            break;
          default:
            gA.indexOf(e) === -1 && g("SimpleEventPlugin: Unhandled event type, `%s`. This warning is likely caused by a bug in React. Please file an issue.", e), w = pr;
            break;
        }
        var b = w.getPooled(p, t, s, l);
        return $c(b), b;
      }
    }, wA = ["ResponderEventPlugin", "SimpleEventPlugin", "EnterLeaveEventPlugin", "ChangeEventPlugin", "SelectEventPlugin", "BeforeInputEventPlugin"];
    ci(wA), fe(Wg, Zo, au), Mr({
      SimpleEventPlugin: yA,
      EnterLeaveEventPlugin: eA,
      ChangeEventPlugin: JI,
      SelectEventPlugin: aA,
      BeforeInputEventPlugin: BI
    });
    var ux = "\u269B", bA = "\u26D4", yi = typeof performance < "u" && typeof performance.mark == "function" && typeof performance.clearMarks == "function" && typeof performance.measure == "function" && typeof performance.clearMeasures == "function", lu = null, is = null, uu = null, Im = !1, Am = !1, Jg = !1, dh = 0, rs = 0, Rm = /* @__PURE__ */ new Set(), qg = function(e) {
      return ux + " " + e;
    }, SA = function(e, t) {
      var s = t ? bA + " " : ux + " ", l = t ? " Warning: " + t : "";
      return "" + s + e + l;
    }, Gc = function(e) {
      performance.mark(qg(e));
    }, xA = function(e) {
      performance.clearMarks(qg(e));
    }, Xc = function(e, t, s) {
      var l = qg(t), d = SA(e, s);
      try {
        performance.measure(d, l);
      } catch {
      }
      performance.clearMarks(l), performance.clearMeasures(d);
    }, Kg = function(e, t) {
      return e + " (#" + t + ")";
    }, ey = function(e, t, s) {
      return s === null ? e + " [" + (t ? "update" : "mount") + "]" : e + "." + s;
    }, ty = function(e, t) {
      var s = Te(e.type) || "Unknown", l = e._debugID, d = e.alternate !== null, p = ey(s, d, t);
      if (Im && Rm.has(p))
        return !1;
      Rm.add(p);
      var w = Kg(p, l);
      return Gc(w), !0;
    }, cx = function(e, t) {
      var s = Te(e.type) || "Unknown", l = e._debugID, d = e.alternate !== null, p = ey(s, d, t), w = Kg(p, l);
      xA(w);
    }, Dm = function(e, t, s) {
      var l = Te(e.type) || "Unknown", d = e._debugID, p = e.alternate !== null, w = ey(l, p, t), b = Kg(w, d);
      Xc(w, b, s);
    }, Nm = function(e) {
      switch (e.tag) {
        case Se:
        case Re:
        case $e:
        case Ve:
        case Tt:
        case re:
        case Ge:
        case Bt:
          return !0;
        default:
          return !1;
      }
    }, CA = function() {
      is !== null && uu !== null && cx(uu, is), uu = null, is = null, Jg = !1;
    }, TA = function() {
      for (var e = lu; e; )
        e._debugIsCurrentlyTiming && Dm(e, null, null), e = e.return;
    }, dx = function(e) {
      e.return !== null && dx(e.return), e._debugIsCurrentlyTiming && ty(e, null);
    }, MA = function() {
      lu !== null && dx(lu);
    };
    function km() {
      rs++;
    }
    function EA() {
      Im && (Am = !0), is !== null && is !== "componentWillMount" && is !== "componentWillReceiveProps" && (Jg = !0);
    }
    function fx(e) {
      {
        if (!yi || Nm(e) || (lu = e, !ty(e, null)))
          return;
        e._debugIsCurrentlyTiming = !0;
      }
    }
    function hx(e) {
      {
        if (!yi || Nm(e))
          return;
        e._debugIsCurrentlyTiming = !1, cx(e, null);
      }
    }
    function px(e) {
      {
        if (!yi || Nm(e) || (lu = e.return, !e._debugIsCurrentlyTiming))
          return;
        e._debugIsCurrentlyTiming = !1, Dm(e, null, null);
      }
    }
    function IA(e) {
      {
        if (!yi || Nm(e) || (lu = e.return, !e._debugIsCurrentlyTiming))
          return;
        e._debugIsCurrentlyTiming = !1;
        var t = e.tag === ee ? "Rendering was suspended" : "An error was thrown inside this error boundary";
        Dm(e, null, t);
      }
    }
    function as(e, t) {
      {
        if (!yi || (CA(), !ty(e, t)))
          return;
        uu = e, is = t;
      }
    }
    function ss() {
      {
        if (!yi)
          return;
        if (is !== null && uu !== null) {
          var e = Jg ? "Scheduled a cascading update" : null;
          Dm(uu, is, e);
        }
        is = null, uu = null;
      }
    }
    function mx(e) {
      {
        if (lu = e, !yi)
          return;
        dh = 0, Gc("(React Tree Reconciliation)"), MA();
      }
    }
    function vx(e, t) {
      {
        if (!yi)
          return;
        var s = null;
        if (e !== null)
          if (e.tag === Se)
            s = "A top-level update interrupted the previous render";
          else {
            var l = Te(e.type) || "Unknown";
            s = "An update to " + l + " interrupted the previous render";
          }
        else
          dh > 1 && (s = "There were cascading updates");
        dh = 0;
        var d = t ? "(React Tree Reconciliation: Completed Root)" : "(React Tree Reconciliation: Yielded)";
        TA(), Xc(d, "(React Tree Reconciliation)", s);
      }
    }
    function AA() {
      {
        if (!yi)
          return;
        Im = !0, Am = !1, Rm.clear(), Gc("(Committing Changes)");
      }
    }
    function RA() {
      {
        if (!yi)
          return;
        var e = null;
        Am ? e = "Lifecycle hook scheduled a cascading update" : dh > 0 && (e = "Caused by a cascading update in earlier commit"), Am = !1, dh++, Im = !1, Rm.clear(), Xc("(Committing Changes)", "(Committing Changes)", e);
      }
    }
    function gx() {
      {
        if (!yi)
          return;
        rs = 0, Gc("(Committing Snapshot Effects)");
      }
    }
    function yx() {
      {
        if (!yi)
          return;
        var e = rs;
        rs = 0, Xc("(Committing Snapshot Effects: " + e + " Total)", "(Committing Snapshot Effects)", null);
      }
    }
    function wx() {
      {
        if (!yi)
          return;
        rs = 0, Gc("(Committing Host Effects)");
      }
    }
    function bx() {
      {
        if (!yi)
          return;
        var e = rs;
        rs = 0, Xc("(Committing Host Effects: " + e + " Total)", "(Committing Host Effects)", null);
      }
    }
    function Sx() {
      {
        if (!yi)
          return;
        rs = 0, Gc("(Calling Lifecycle Methods)");
      }
    }
    function xx() {
      {
        if (!yi)
          return;
        var e = rs;
        rs = 0, Xc("(Calling Lifecycle Methods: " + e + " Total)", "(Calling Lifecycle Methods)", null);
      }
    }
    var ny = [], _m;
    _m = [];
    var oo = -1;
    function cu(e) {
      return {
        current: e
      };
    }
    function zi(e, t) {
      if (oo < 0) {
        g("Unexpected pop.");
        return;
      }
      t !== _m[oo] && g("Unexpected Fiber popped."), e.current = ny[oo], ny[oo] = null, _m[oo] = null, oo--;
    }
    function Oi(e, t, s) {
      oo++, ny[oo] = e.current, _m[oo] = s, e.current = t;
    }
    var iy;
    iy = {};
    var mr = {};
    Object.freeze(mr);
    var lo = cu(mr), os = cu(!1), ry = mr;
    function Jc(e, t, s) {
      return s && ls(t) ? ry : lo.current;
    }
    function Cx(e, t, s) {
      {
        var l = e.stateNode;
        l.__reactInternalMemoizedUnmaskedChildContext = t, l.__reactInternalMemoizedMaskedChildContext = s;
      }
    }
    function qc(e, t) {
      {
        var s = e.type, l = s.contextTypes;
        if (!l)
          return mr;
        var d = e.stateNode;
        if (d && d.__reactInternalMemoizedUnmaskedChildContext === t)
          return d.__reactInternalMemoizedMaskedChildContext;
        var p = {};
        for (var w in l)
          p[w] = t[w];
        {
          var b = Te(s) || "Unknown";
          c(l, p, "context", b, ft);
        }
        return d && Cx(e, t, p), p;
      }
    }
    function Pm() {
      return os.current;
    }
    function ls(e) {
      {
        var t = e.childContextTypes;
        return t != null;
      }
    }
    function zm(e) {
      zi(os, e), zi(lo, e);
    }
    function ay(e) {
      zi(os, e), zi(lo, e);
    }
    function Tx(e, t, s) {
      {
        if (lo.current !== mr)
          throw Error("Unexpected context found on stack. This error is likely caused by a bug in React. Please file an issue.");
        Oi(lo, t, e), Oi(os, s, e);
      }
    }
    function Mx(e, t, s) {
      {
        var l = e.stateNode, d = t.childContextTypes;
        if (typeof l.getChildContext != "function") {
          {
            var p = Te(t) || "Unknown";
            iy[p] || (iy[p] = !0, g("%s.childContextTypes is specified but there is no getChildContext() method on the instance. You can either define getChildContext() on %s or remove childContextTypes from it.", p, p));
          }
          return s;
        }
        var w;
        as(e, "getChildContext"), w = l.getChildContext(), ss();
        for (var b in w)
          if (!(b in d))
            throw Error((Te(t) || "Unknown") + '.getChildContext(): key "' + b + '" is not defined in childContextTypes.');
        {
          var E = Te(t) || "Unknown";
          c(
            d,
            w,
            "child context",
            E,
            ft
          );
        }
        return i({}, s, {}, w);
      }
    }
    function Om(e) {
      {
        var t = e.stateNode, s = t && t.__reactInternalMemoizedMergedChildContext || mr;
        return ry = lo.current, Oi(lo, s, e), Oi(os, os.current, e), !0;
      }
    }
    function Ex(e, t, s) {
      {
        var l = e.stateNode;
        if (!l)
          throw Error("Expected to have an instance by this point. This error is likely caused by a bug in React. Please file an issue.");
        if (s) {
          var d = Mx(e, t, ry);
          l.__reactInternalMemoizedMergedChildContext = d, zi(os, e), zi(lo, e), Oi(lo, d, e), Oi(os, s, e);
        } else
          zi(os, e), Oi(os, s, e);
      }
    }
    function DA(e) {
      {
        if (!(Ha(e) && e.tag === ce))
          throw Error("Expected subtree parent to be a mounted class component. This error is likely caused by a bug in React. Please file an issue.");
        var t = e;
        do {
          switch (t.tag) {
            case Se:
              return t.stateNode.context;
            case ce: {
              var s = t.type;
              if (ls(s))
                return t.stateNode.__reactInternalMemoizedMergedChildContext;
              break;
            }
          }
          t = t.return;
        } while (t !== null);
        throw Error("Found unexpected detached subtree parent. This error is likely caused by a bug in React. Please file an issue.");
      }
    }
    var Ix = 0, NA = 1, kA = 2, _A = o.unstable_runWithPriority, sy = o.unstable_scheduleCallback, Ax = o.unstable_cancelCallback, PA = o.unstable_shouldYield, Rx = o.unstable_requestPaint, oy = o.unstable_now, zA = o.unstable_getCurrentPriorityLevel, Lm = o.unstable_ImmediatePriority, Dx = o.unstable_UserBlockingPriority, Nx = o.unstable_NormalPriority, kx = o.unstable_LowPriority, _x = o.unstable_IdlePriority;
    if (!(h.__interactionsRef != null && h.__interactionsRef.current != null))
      throw Error("It is not supported to run the profiling version of a renderer (for example, `react-dom/profiling`) without also replacing the `scheduler/tracing` module with `scheduler/tracing-profiling`. Your bundler might have a setting for aliasing both modules. Learn more at http://fb.me/react-profiling");
    var Px = {}, Li = 99, Yo = 98, ha = 97, ly = 96, fh = 95, Kc = 90, OA = PA, LA = Rx !== void 0 ? Rx : function() {
    }, uo = null, Bm = null, uy = !1, zx = oy(), vr = zx < 1e4 ? oy : function() {
      return oy() - zx;
    };
    function ed() {
      switch (zA()) {
        case Lm:
          return Li;
        case Dx:
          return Yo;
        case Nx:
          return ha;
        case kx:
          return ly;
        case _x:
          return fh;
        default:
          throw Error("Unknown priority level.");
      }
    }
    function Ox(e) {
      switch (e) {
        case Li:
          return Lm;
        case Yo:
          return Dx;
        case ha:
          return Nx;
        case ly:
          return kx;
        case fh:
          return _x;
        default:
          throw Error("Unknown priority level.");
      }
    }
    function co(e, t) {
      var s = Ox(e);
      return _A(s, t);
    }
    function hh(e, t, s) {
      var l = Ox(e);
      return sy(l, t, s);
    }
    function Lx(e) {
      return uo === null ? (uo = [e], Bm = sy(Lm, Bx)) : uo.push(e), Px;
    }
    function BA(e) {
      e !== Px && Ax(e);
    }
    function us() {
      if (Bm !== null) {
        var e = Bm;
        Bm = null, Ax(e);
      }
      Bx();
    }
    function Bx() {
      if (!uy && uo !== null) {
        uy = !0;
        var e = 0;
        try {
          var t = !0, s = uo;
          co(Li, function() {
            for (; e < s.length; e++) {
              var l = s[e];
              do
                l = l(t);
              while (l !== null);
            }
          }), uo = null;
        } catch (l) {
          throw uo !== null && (uo = uo.slice(e + 1)), sy(Lm, us), l;
        } finally {
          uy = !1;
        }
      }
    }
    var oi = 0, yn = 1, Hr = 2, td = 4, cs = 8, ph = 1073741823, Ae = 0, ds = 1, du = 2, jx = 3, Ct = ph, Ux = Ct - 1, jm = 10, Um = Ux - 1;
    function cy(e) {
      return Um - (e / jm | 0);
    }
    function fu(e) {
      return (Um - e) * jm;
    }
    function jA(e, t) {
      return ((e / t | 0) + 1) * t;
    }
    function dy(e, t, s) {
      return Um - jA(Um - e + t / jm, s / jm);
    }
    var mh = 5e3, fy = 250;
    function UA(e) {
      return dy(e, mh, fy);
    }
    function VA(e, t) {
      return dy(e, t, fy);
    }
    var Vx = 500, Hx = 100;
    function Wx(e) {
      return dy(e, Vx, Hx);
    }
    function Fx(e, t) {
      if (t === Ct)
        return Li;
      if (t === ds || t === du)
        return fh;
      var s = fu(t) - fu(e);
      return s <= 0 ? Li : s <= Vx + Hx ? Yo : s <= mh + fy ? ha : fh;
    }
    var pa = {
      recordUnsafeLifecycleWarnings: function(e, t) {
      },
      flushPendingUnsafeLifecycleWarnings: function() {
      },
      recordLegacyContextWarning: function(e, t) {
      },
      flushLegacyContextWarning: function() {
      },
      discardPendingWarnings: function() {
      }
    };
    {
      var HA = function(e) {
        for (var t = null, s = e; s !== null; )
          s.mode & yn && (t = s), s = s.return;
        return t;
      }, hu = function(e) {
        var t = [];
        return e.forEach(function(s) {
          t.push(s);
        }), t.sort().join(", ");
      }, vh = [], gh = [], yh = [], wh = [], bh = [], Sh = [], pu = /* @__PURE__ */ new Set();
      pa.recordUnsafeLifecycleWarnings = function(e, t) {
        pu.has(e.type) || (typeof t.componentWillMount == "function" && t.componentWillMount.__suppressDeprecationWarning !== !0 && vh.push(e), e.mode & yn && typeof t.UNSAFE_componentWillMount == "function" && gh.push(e), typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps.__suppressDeprecationWarning !== !0 && yh.push(e), e.mode & yn && typeof t.UNSAFE_componentWillReceiveProps == "function" && wh.push(e), typeof t.componentWillUpdate == "function" && t.componentWillUpdate.__suppressDeprecationWarning !== !0 && bh.push(e), e.mode & yn && typeof t.UNSAFE_componentWillUpdate == "function" && Sh.push(e));
      }, pa.flushPendingUnsafeLifecycleWarnings = function() {
        var e = /* @__PURE__ */ new Set();
        vh.length > 0 && (vh.forEach(function(L) {
          e.add(Te(L.type) || "Component"), pu.add(L.type);
        }), vh = []);
        var t = /* @__PURE__ */ new Set();
        gh.length > 0 && (gh.forEach(function(L) {
          t.add(Te(L.type) || "Component"), pu.add(L.type);
        }), gh = []);
        var s = /* @__PURE__ */ new Set();
        yh.length > 0 && (yh.forEach(function(L) {
          s.add(Te(L.type) || "Component"), pu.add(L.type);
        }), yh = []);
        var l = /* @__PURE__ */ new Set();
        wh.length > 0 && (wh.forEach(function(L) {
          l.add(Te(L.type) || "Component"), pu.add(L.type);
        }), wh = []);
        var d = /* @__PURE__ */ new Set();
        bh.length > 0 && (bh.forEach(function(L) {
          d.add(Te(L.type) || "Component"), pu.add(L.type);
        }), bh = []);
        var p = /* @__PURE__ */ new Set();
        if (Sh.length > 0 && (Sh.forEach(function(L) {
          p.add(Te(L.type) || "Component"), pu.add(L.type);
        }), Sh = []), t.size > 0) {
          var w = hu(t);
          g(`Using UNSAFE_componentWillMount in strict mode is not recommended and may indicate bugs in your code. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move code with side effects to componentDidMount, and set initial state in the constructor.

Please update the following components: %s`, w);
        }
        if (l.size > 0) {
          var b = hu(l);
          g(`Using UNSAFE_componentWillReceiveProps in strict mode is not recommended and may indicate bugs in your code. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move data fetching code or side effects to componentDidUpdate.
* If you're updating state whenever props change, refactor your code to use memoization techniques or move it to static getDerivedStateFromProps. Learn more at: https://fb.me/react-derived-state

Please update the following components: %s`, b);
        }
        if (p.size > 0) {
          var E = hu(p);
          g(`Using UNSAFE_componentWillUpdate in strict mode is not recommended and may indicate bugs in your code. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move data fetching code or side effects to componentDidUpdate.

Please update the following components: %s`, E);
        }
        if (e.size > 0) {
          var N = hu(e);
          y(`componentWillMount has been renamed, and is not recommended for use. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move code with side effects to componentDidMount, and set initial state in the constructor.
* Rename componentWillMount to UNSAFE_componentWillMount to suppress this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: %s`, N);
        }
        if (s.size > 0) {
          var k = hu(s);
          y(`componentWillReceiveProps has been renamed, and is not recommended for use. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move data fetching code or side effects to componentDidUpdate.
* If you're updating state whenever props change, refactor your code to use memoization techniques or move it to static getDerivedStateFromProps. Learn more at: https://fb.me/react-derived-state
* Rename componentWillReceiveProps to UNSAFE_componentWillReceiveProps to suppress this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: %s`, k);
        }
        if (d.size > 0) {
          var J = hu(d);
          y(`componentWillUpdate has been renamed, and is not recommended for use. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move data fetching code or side effects to componentDidUpdate.
* Rename componentWillUpdate to UNSAFE_componentWillUpdate to suppress this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: %s`, J);
        }
      };
      var Vm = /* @__PURE__ */ new Map(), $x = /* @__PURE__ */ new Set();
      pa.recordLegacyContextWarning = function(e, t) {
        var s = HA(e);
        if (s === null) {
          g("Expected to find a StrictMode component in a strict mode tree. This error is likely caused by a bug in React. Please file an issue.");
          return;
        }
        if (!$x.has(e.type)) {
          var l = Vm.get(s);
          (e.type.contextTypes != null || e.type.childContextTypes != null || t !== null && typeof t.getChildContext == "function") && (l === void 0 && (l = [], Vm.set(s, l)), l.push(e));
        }
      }, pa.flushLegacyContextWarning = function() {
        Vm.forEach(function(e, t) {
          if (e.length !== 0) {
            var s = e[0], l = /* @__PURE__ */ new Set();
            e.forEach(function(w) {
              l.add(Te(w.type) || "Component"), $x.add(w.type);
            });
            var d = hu(l), p = $n(s);
            g(`Legacy context API has been detected within a strict-mode tree.

The old API will be supported in all 16.x releases, but applications using it should migrate to the new version.

Please update the following components: %s

Learn more about this warning here: https://fb.me/react-legacy-context%s`, d, p);
          }
        });
      }, pa.discardPendingWarnings = function() {
        vh = [], gh = [], yh = [], wh = [], bh = [], Sh = [], Vm = /* @__PURE__ */ new Map();
      };
    }
    var Wr = null, nd = null, WA = function(e) {
      Wr = e;
    };
    function id(e) {
      {
        if (Wr === null)
          return e;
        var t = Wr(e);
        return t === void 0 ? e : t.current;
      }
    }
    function hy(e) {
      return id(e);
    }
    function py(e) {
      {
        if (Wr === null)
          return e;
        var t = Wr(e);
        if (t === void 0) {
          if (e != null && typeof e.render == "function") {
            var s = id(e.render);
            if (e.render !== s) {
              var l = {
                $$typeof: ni,
                render: s
              };
              return e.displayName !== void 0 && (l.displayName = e.displayName), l;
            }
          }
          return e;
        }
        return t.current;
      }
    }
    function Qx(e, t) {
      {
        if (Wr === null)
          return !1;
        var s = e.elementType, l = t.type, d = !1, p = typeof l == "object" && l !== null ? l.$$typeof : null;
        switch (e.tag) {
          case ce: {
            typeof l == "function" && (d = !0);
            break;
          }
          case Oe: {
            (typeof l == "function" || p === ir) && (d = !0);
            break;
          }
          case D: {
            (p === ni || p === ir) && (d = !0);
            break;
          }
          case Ce:
          case ge: {
            (p === ta || p === ir) && (d = !0);
            break;
          }
          default:
            return !1;
        }
        if (d) {
          var w = Wr(s);
          if (w !== void 0 && w === Wr(l))
            return !0;
        }
        return !1;
      }
    }
    function Zx(e) {
      {
        if (Wr === null || typeof WeakSet != "function")
          return;
        nd === null && (nd = /* @__PURE__ */ new WeakSet()), nd.add(e);
      }
    }
    var FA = function(e, t) {
      {
        if (Wr === null)
          return;
        var s = t.staleFamilies, l = t.updatedFamilies;
        tl(), gC(function() {
          my(e.current, l, s);
        });
      }
    }, $A = function(e, t) {
      {
        if (e.context !== mr)
          return;
        tl(), gR(function() {
          Uh(t, e, null, null);
        });
      }
    };
    function my(e, t, s) {
      {
        var l = e.alternate, d = e.child, p = e.sibling, w = e.tag, b = e.type, E = null;
        switch (w) {
          case Oe:
          case ge:
          case ce:
            E = b;
            break;
          case D:
            E = b.render;
            break;
        }
        if (Wr === null)
          throw new Error("Expected resolveFamily to be set during hot reload.");
        var N = !1, k = !1;
        if (E !== null) {
          var J = Wr(E);
          J !== void 0 && (s.has(J) ? k = !0 : t.has(J) && (w === ce ? k = !0 : N = !0));
        }
        nd !== null && (nd.has(e) || l !== null && nd.has(l)) && (k = !0), k && (e._debugNeedsRemount = !0), (k || N) && Zr(e, Ct), d !== null && !k && my(d, t, s), p !== null && my(p, t, s);
      }
    }
    var QA = function(e, t) {
      {
        var s = /* @__PURE__ */ new Set(), l = new Set(t.map(function(d) {
          return d.current;
        }));
        return vy(e.current, l, s), s;
      }
    };
    function vy(e, t, s) {
      {
        var l = e.child, d = e.sibling, p = e.tag, w = e.type, b = null;
        switch (p) {
          case Oe:
          case ge:
          case ce:
            b = w;
            break;
          case D:
            b = w.render;
            break;
        }
        var E = !1;
        b !== null && t.has(b) && (E = !0), E ? ZA(e, s) : l !== null && vy(l, t, s), d !== null && vy(d, t, s);
      }
    }
    function ZA(e, t) {
      {
        var s = YA(e, t);
        if (s)
          return;
        for (var l = e; ; ) {
          switch (l.tag) {
            case Re:
              t.add(l.stateNode);
              return;
            case Ve:
              t.add(l.stateNode.containerInfo);
              return;
            case Se:
              t.add(l.stateNode.containerInfo);
              return;
          }
          if (l.return === null)
            throw new Error("Expected to reach root first.");
          l = l.return;
        }
      }
    }
    function YA(e, t) {
      for (var s = e, l = !1; ; ) {
        if (s.tag === Re)
          l = !0, t.add(s.stateNode);
        else if (s.child !== null) {
          s.child.return = s, s = s.child;
          continue;
        }
        if (s === e)
          return l;
        for (; s.sibling === null; ) {
          if (s.return === null || s.return === e)
            return l;
          s = s.return;
        }
        s.sibling.return = s.return, s = s.sibling;
      }
      return !1;
    }
    function ma(e, t) {
      if (e && e.defaultProps) {
        var s = i({}, t), l = e.defaultProps;
        for (var d in l)
          s[d] === void 0 && (s[d] = l[d]);
        return s;
      }
      return t;
    }
    function GA(e) {
      if (yp(e), e._status !== Rs)
        throw e._result;
      return e._result;
    }
    var gy = cu(null), yy;
    yy = {};
    var Hm = null, rd = null, Wm = null, Fm = !1;
    function $m() {
      Hm = null, rd = null, Wm = null, Fm = !1;
    }
    function Yx() {
      Fm = !0;
    }
    function Gx() {
      Fm = !1;
    }
    function Xx(e, t) {
      var s = e.type._context;
      Oi(gy, s._currentValue, e), s._currentValue = t, s._currentRenderer !== void 0 && s._currentRenderer !== null && s._currentRenderer !== yy && g("Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported."), s._currentRenderer = yy;
    }
    function wy(e) {
      var t = gy.current;
      zi(gy, e);
      var s = e.type._context;
      s._currentValue = t;
    }
    function XA(e, t, s) {
      if (ou(s, t))
        return 0;
      var l = typeof e._calculateChangedBits == "function" ? e._calculateChangedBits(s, t) : ph;
      return (l & ph) !== l && g("calculateChangedBits: Expected the return value to be a 31-bit integer. Instead received: %s", l), l | 0;
    }
    function Jx(e, t) {
      for (var s = e; s !== null; ) {
        var l = s.alternate;
        if (s.childExpirationTime < t)
          s.childExpirationTime = t, l !== null && l.childExpirationTime < t && (l.childExpirationTime = t);
        else if (l !== null && l.childExpirationTime < t)
          l.childExpirationTime = t;
        else
          break;
        s = s.return;
      }
    }
    function JA(e, t, s, l) {
      var d = e.child;
      for (d !== null && (d.return = e); d !== null; ) {
        var p = void 0, w = d.dependencies;
        if (w !== null) {
          p = d.child;
          for (var b = w.firstContext; b !== null; ) {
            if (b.context === t && (b.observedBits & s) !== 0) {
              if (d.tag === ce) {
                var E = Go(l, null);
                E.tag = Qm, Xo(d, E);
              }
              d.expirationTime < l && (d.expirationTime = l);
              var N = d.alternate;
              N !== null && N.expirationTime < l && (N.expirationTime = l), Jx(d.return, l), w.expirationTime < l && (w.expirationTime = l);
              break;
            }
            b = b.next;
          }
        } else
          d.tag === re ? p = d.type === e.type ? null : d.child : p = d.child;
        if (p !== null)
          p.return = d;
        else
          for (p = d; p !== null; ) {
            if (p === e) {
              p = null;
              break;
            }
            var k = p.sibling;
            if (k !== null) {
              k.return = p.return, p = k;
              break;
            }
            p = p.return;
          }
        d = p;
      }
    }
    function ad(e, t) {
      Hm = e, rd = null, Wm = null;
      var s = e.dependencies;
      if (s !== null) {
        var l = s.firstContext;
        l !== null && (s.expirationTime >= t && Tw(), s.firstContext = null);
      }
    }
    function Bn(e, t) {
      if (Fm && g("Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo()."), Wm !== e) {
        if (!(t === !1 || t === 0)) {
          var s;
          typeof t != "number" || t === ph ? (Wm = e, s = ph) : s = t;
          var l = {
            context: e,
            observedBits: s,
            next: null
          };
          if (rd === null) {
            if (Hm === null)
              throw Error("Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo().");
            rd = l, Hm.dependencies = {
              expirationTime: Ae,
              firstContext: l,
              responders: null
            };
          } else
            rd = rd.next = l;
        }
      }
      return e._currentValue;
    }
    var qx = 0, Kx = 1, Qm = 2, by = 3, Zm = !1, Sy, Ym;
    Sy = !1, Ym = null;
    function xy(e) {
      var t = {
        baseState: e.memoizedState,
        baseQueue: null,
        shared: {
          pending: null
        },
        effects: null
      };
      e.updateQueue = t;
    }
    function Cy(e, t) {
      var s = t.updateQueue, l = e.updateQueue;
      if (s === l) {
        var d = {
          baseState: l.baseState,
          baseQueue: l.baseQueue,
          shared: l.shared,
          effects: l.effects
        };
        t.updateQueue = d;
      }
    }
    function Go(e, t) {
      var s = {
        expirationTime: e,
        suspenseConfig: t,
        tag: qx,
        payload: null,
        callback: null,
        next: null
      };
      return s.next = s, s.priority = ed(), s;
    }
    function Xo(e, t) {
      var s = e.updateQueue;
      if (s !== null) {
        var l = s.shared, d = l.pending;
        d === null ? t.next = t : (t.next = d.next, d.next = t), l.pending = t, Ym === l && !Sy && (g("An update (setState, replaceState, or forceUpdate) was scheduled from inside an update function. Update functions should be pure, with zero side-effects. Consider using componentDidUpdate or a callback."), Sy = !0);
      }
    }
    function e0(e, t) {
      var s = e.alternate;
      s !== null && Cy(s, e);
      var l = e.updateQueue, d = l.baseQueue;
      d === null ? (l.baseQueue = t.next = t, t.next = t) : (t.next = d.next, d.next = t);
    }
    function qA(e, t, s, l, d, p) {
      switch (s.tag) {
        case Kx: {
          var w = s.payload;
          if (typeof w == "function") {
            Yx(), e.mode & yn && w.call(p, l, d);
            var b = w.call(p, l, d);
            return Gx(), b;
          }
          return w;
        }
        case by:
          e.effectTag = e.effectTag & ~mi | Ut;
        case qx: {
          var E = s.payload, N;
          return typeof E == "function" ? (Yx(), e.mode & yn && E.call(p, l, d), N = E.call(p, l, d), Gx()) : N = E, N == null ? l : i({}, l, N);
        }
        case Qm:
          return Zm = !0, l;
      }
      return l;
    }
    function xh(e, t, s, l) {
      var d = e.updateQueue;
      Zm = !1, Ym = d.shared;
      var p = d.baseQueue, w = d.shared.pending;
      if (w !== null) {
        if (p !== null) {
          var b = p.next, E = w.next;
          p.next = E, w.next = b;
        }
        p = w, d.shared.pending = null;
        var N = e.alternate;
        if (N !== null) {
          var k = N.updateQueue;
          k !== null && (k.baseQueue = w);
        }
      }
      if (p !== null) {
        var J = p.next, L = d.baseState, K = Ae, me = null, we = null, Ke = null;
        if (J !== null) {
          var nt = J;
          do {
            var Pt = nt.expirationTime;
            if (Pt < l) {
              var vt = {
                expirationTime: nt.expirationTime,
                suspenseConfig: nt.suspenseConfig,
                tag: nt.tag,
                payload: nt.payload,
                callback: nt.callback,
                next: null
              };
              Ke === null ? (we = Ke = vt, me = L) : Ke = Ke.next = vt, Pt > K && (K = Pt);
            } else {
              if (Ke !== null) {
                var Qt = {
                  expirationTime: Ct,
                  suspenseConfig: nt.suspenseConfig,
                  tag: nt.tag,
                  payload: nt.payload,
                  callback: nt.callback,
                  next: null
                };
                Ke = Ke.next = Qt;
              }
              SC(Pt, nt.suspenseConfig), L = qA(e, d, nt, L, t, s);
              var F = nt.callback;
              if (F !== null) {
                e.effectTag |= wf;
                var te = d.effects;
                te === null ? d.effects = [nt] : te.push(nt);
              }
            }
            if (nt = nt.next, nt === null || nt === J) {
              if (w = d.shared.pending, w === null)
                break;
              nt = p.next = w.next, w.next = J, d.baseQueue = p = w, d.shared.pending = null;
            }
          } while (!0);
        }
        Ke === null ? me = L : Ke.next = we, d.baseState = me, d.baseQueue = Ke, Ov(K), e.expirationTime = K, e.memoizedState = L;
      }
      Ym = null;
    }
    function KA(e, t) {
      if (typeof e != "function")
        throw Error("Invalid argument passed as callback. Expected a function. Instead received: " + e);
      e.call(t);
    }
    function t0() {
      Zm = !1;
    }
    function Gm() {
      return Zm;
    }
    function n0(e, t, s) {
      var l = t.effects;
      if (t.effects = null, l !== null)
        for (var d = 0; d < l.length; d++) {
          var p = l[d], w = p.callback;
          w !== null && (p.callback = null, KA(w, s));
        }
    }
    var e1 = m.ReactCurrentBatchConfig;
    function Ch() {
      return e1.suspense;
    }
    var Ty = {}, t1 = Array.isArray, i0 = new r.Component().refs, My, Ey, Iy, Ay, Ry, r0, Xm, Dy, Ny, ky;
    {
      My = /* @__PURE__ */ new Set(), Ey = /* @__PURE__ */ new Set(), Iy = /* @__PURE__ */ new Set(), Ay = /* @__PURE__ */ new Set(), Dy = /* @__PURE__ */ new Set(), Ry = /* @__PURE__ */ new Set(), Ny = /* @__PURE__ */ new Set(), ky = /* @__PURE__ */ new Set();
      var a0 = /* @__PURE__ */ new Set();
      Xm = function(e, t) {
        if (!(e === null || typeof e == "function")) {
          var s = t + "_" + e;
          a0.has(s) || (a0.add(s), g("%s(...): Expected the last optional `callback` argument to be a function. Instead received: %s.", t, e));
        }
      }, r0 = function(e, t) {
        if (t === void 0) {
          var s = Te(e) || "Component";
          Ry.has(s) || (Ry.add(s), g("%s.getDerivedStateFromProps(): A valid state object (or null) must be returned. You have returned undefined.", s));
        }
      }, Object.defineProperty(Ty, "_processChildContext", {
        enumerable: !1,
        value: function() {
          throw Error("_processChildContext is not available in React 16+. This likely means you have multiple copies of React and are attempting to nest a React 15 tree inside a React 16 tree using unstable_renderSubtreeIntoContainer, which isn't supported. Try to make sure you have only one copy of React (and ideally, switch to ReactDOM.createPortal).");
        }
      }), Object.freeze(Ty);
    }
    function Jm(e, t, s, l) {
      var d = e.memoizedState;
      e.mode & yn && s(l, d);
      var p = s(l, d);
      r0(t, p);
      var w = p == null ? d : i({}, d, p);
      if (e.memoizedState = w, e.expirationTime === Ae) {
        var b = e.updateQueue;
        b.baseState = w;
      }
    }
    var _y = {
      isMounted: Wa,
      enqueueSetState: function(e, t, s) {
        var l = ua(e), d = ps(), p = Ch(), w = Cu(d, l, p), b = Go(w, p);
        b.payload = t, s != null && (Xm(s, "setState"), b.callback = s), Xo(l, b), Zr(l, w);
      },
      enqueueReplaceState: function(e, t, s) {
        var l = ua(e), d = ps(), p = Ch(), w = Cu(d, l, p), b = Go(w, p);
        b.tag = Kx, b.payload = t, s != null && (Xm(s, "replaceState"), b.callback = s), Xo(l, b), Zr(l, w);
      },
      enqueueForceUpdate: function(e, t) {
        var s = ua(e), l = ps(), d = Ch(), p = Cu(l, s, d), w = Go(p, d);
        w.tag = Qm, t != null && (Xm(t, "forceUpdate"), w.callback = t), Xo(s, w), Zr(s, p);
      }
    };
    function s0(e, t, s, l, d, p, w) {
      var b = e.stateNode;
      if (typeof b.shouldComponentUpdate == "function") {
        e.mode & yn && b.shouldComponentUpdate(l, p, w), as(e, "shouldComponentUpdate");
        var E = b.shouldComponentUpdate(l, p, w);
        return ss(), E === void 0 && g("%s.shouldComponentUpdate(): Returned undefined instead of a boolean value. Make sure to return true or false.", Te(t) || "Component"), E;
      }
      return t.prototype && t.prototype.isPureReactComponent ? !uh(s, l) || !uh(d, p) : !0;
    }
    function n1(e, t, s) {
      var l = e.stateNode;
      {
        var d = Te(t) || "Component", p = l.render;
        p || (t.prototype && typeof t.prototype.render == "function" ? g("%s(...): No `render` method found on the returned component instance: did you accidentally return an object from the constructor?", d) : g("%s(...): No `render` method found on the returned component instance: you may have forgotten to define `render`.", d)), l.getInitialState && !l.getInitialState.isReactClassApproved && !l.state && g("getInitialState was defined on %s, a plain JavaScript class. This is only supported for classes created using React.createClass. Did you mean to define a state property instead?", d), l.getDefaultProps && !l.getDefaultProps.isReactClassApproved && g("getDefaultProps was defined on %s, a plain JavaScript class. This is only supported for classes created using React.createClass. Use a static property to define defaultProps instead.", d), l.propTypes && g("propTypes was defined as an instance property on %s. Use a static property to define propTypes instead.", d), l.contextType && g("contextType was defined as an instance property on %s. Use a static property to define contextType instead.", d), l.contextTypes && g("contextTypes was defined as an instance property on %s. Use a static property to define contextTypes instead.", d), t.contextType && t.contextTypes && !Ny.has(t) && (Ny.add(t), g("%s declares both contextTypes and contextType static properties. The legacy contextTypes property will be ignored.", d)), typeof l.componentShouldUpdate == "function" && g("%s has a method called componentShouldUpdate(). Did you mean shouldComponentUpdate()? The name is phrased as a question because the function is expected to return a value.", d), t.prototype && t.prototype.isPureReactComponent && typeof l.shouldComponentUpdate < "u" && g("%s has a method called shouldComponentUpdate(). shouldComponentUpdate should not be used when extending React.PureComponent. Please extend React.Component if shouldComponentUpdate is used.", Te(t) || "A pure component"), typeof l.componentDidUnmount == "function" && g("%s has a method called componentDidUnmount(). But there is no such lifecycle method. Did you mean componentWillUnmount()?", d), typeof l.componentDidReceiveProps == "function" && g("%s has a method called componentDidReceiveProps(). But there is no such lifecycle method. If you meant to update the state in response to changing props, use componentWillReceiveProps(). If you meant to fetch data or run side-effects or mutations after React has updated the UI, use componentDidUpdate().", d), typeof l.componentWillRecieveProps == "function" && g("%s has a method called componentWillRecieveProps(). Did you mean componentWillReceiveProps()?", d), typeof l.UNSAFE_componentWillRecieveProps == "function" && g("%s has a method called UNSAFE_componentWillRecieveProps(). Did you mean UNSAFE_componentWillReceiveProps()?", d);
        var w = l.props !== s;
        l.props !== void 0 && w && g("%s(...): When calling super() in `%s`, make sure to pass up the same props that your component's constructor was passed.", d, d), l.defaultProps && g("Setting defaultProps as an instance property on %s is not supported and will be ignored. Instead, define defaultProps as a static property on %s.", d, d), typeof l.getSnapshotBeforeUpdate == "function" && typeof l.componentDidUpdate != "function" && !Iy.has(t) && (Iy.add(t), g("%s: getSnapshotBeforeUpdate() should be used with componentDidUpdate(). This component defines getSnapshotBeforeUpdate() only.", Te(t))), typeof l.getDerivedStateFromProps == "function" && g("%s: getDerivedStateFromProps() is defined as an instance method and will be ignored. Instead, declare it as a static method.", d), typeof l.getDerivedStateFromError == "function" && g("%s: getDerivedStateFromError() is defined as an instance method and will be ignored. Instead, declare it as a static method.", d), typeof t.getSnapshotBeforeUpdate == "function" && g("%s: getSnapshotBeforeUpdate() is defined as a static method and will be ignored. Instead, declare it as an instance method.", d);
        var b = l.state;
        b && (typeof b != "object" || t1(b)) && g("%s.state: must be set to an object or null", d), typeof l.getChildContext == "function" && typeof t.childContextTypes != "object" && g("%s.getChildContext(): childContextTypes must be defined in order to use getChildContext().", d);
      }
    }
    function o0(e, t) {
      t.updater = _y, e.stateNode = t, Pp(t, e), t._reactInternalInstance = Ty;
    }
    function l0(e, t, s) {
      var l = !1, d = mr, p = mr, w = t.contextType;
      if ("contextType" in t) {
        var b = w === null || w !== void 0 && w.$$typeof === xn && w._context === void 0;
        if (!b && !ky.has(t)) {
          ky.add(t);
          var E = "";
          w === void 0 ? E = " However, it is set to undefined. This can be caused by a typo or by mixing up named and default imports. This can also happen due to a circular dependency, so try moving the createContext() call to a separate file." : typeof w != "object" ? E = " However, it is set to a " + typeof w + "." : w.$$typeof === gn ? E = " Did you accidentally pass the Context.Provider instead?" : w._context !== void 0 ? E = " Did you accidentally pass the Context.Consumer instead?" : E = " However, it is set to an object with keys {" + Object.keys(w).join(", ") + "}.", g("%s defines an invalid contextType. contextType should point to the Context object returned by React.createContext().%s", Te(t) || "Component", E);
        }
      }
      if (typeof w == "object" && w !== null)
        p = Bn(w);
      else {
        d = Jc(e, t, !0);
        var N = t.contextTypes;
        l = N != null, p = l ? qc(e, d) : mr;
      }
      e.mode & yn && new t(s, p);
      var k = new t(s, p), J = e.memoizedState = k.state !== null && k.state !== void 0 ? k.state : null;
      o0(e, k);
      {
        if (typeof t.getDerivedStateFromProps == "function" && J === null) {
          var L = Te(t) || "Component";
          Ey.has(L) || (Ey.add(L), g("`%s` uses `getDerivedStateFromProps` but its initial state is %s. This is not recommended. Instead, define the initial state by assigning an object to `this.state` in the constructor of `%s`. This ensures that `getDerivedStateFromProps` arguments have a consistent shape.", L, k.state === null ? "null" : "undefined", L));
        }
        if (typeof t.getDerivedStateFromProps == "function" || typeof k.getSnapshotBeforeUpdate == "function") {
          var K = null, me = null, we = null;
          if (typeof k.componentWillMount == "function" && k.componentWillMount.__suppressDeprecationWarning !== !0 ? K = "componentWillMount" : typeof k.UNSAFE_componentWillMount == "function" && (K = "UNSAFE_componentWillMount"), typeof k.componentWillReceiveProps == "function" && k.componentWillReceiveProps.__suppressDeprecationWarning !== !0 ? me = "componentWillReceiveProps" : typeof k.UNSAFE_componentWillReceiveProps == "function" && (me = "UNSAFE_componentWillReceiveProps"), typeof k.componentWillUpdate == "function" && k.componentWillUpdate.__suppressDeprecationWarning !== !0 ? we = "componentWillUpdate" : typeof k.UNSAFE_componentWillUpdate == "function" && (we = "UNSAFE_componentWillUpdate"), K !== null || me !== null || we !== null) {
            var Ke = Te(t) || "Component", nt = typeof t.getDerivedStateFromProps == "function" ? "getDerivedStateFromProps()" : "getSnapshotBeforeUpdate()";
            Ay.has(Ke) || (Ay.add(Ke), g(`Unsafe legacy lifecycles will not be called for components using new component APIs.

%s uses %s but also contains the following legacy lifecycles:%s%s%s

The above lifecycles should be removed. Learn more about this warning here:
https://fb.me/react-unsafe-component-lifecycles`, Ke, nt, K !== null ? `
  ` + K : "", me !== null ? `
  ` + me : "", we !== null ? `
  ` + we : ""));
          }
        }
      }
      return l && Cx(e, d, p), k;
    }
    function i1(e, t) {
      as(e, "componentWillMount");
      var s = t.state;
      typeof t.componentWillMount == "function" && t.componentWillMount(), typeof t.UNSAFE_componentWillMount == "function" && t.UNSAFE_componentWillMount(), ss(), s !== t.state && (g("%s.componentWillMount(): Assigning directly to this.state is deprecated (except inside a component's constructor). Use setState instead.", Te(e.type) || "Component"), _y.enqueueReplaceState(t, t.state, null));
    }
    function u0(e, t, s, l) {
      var d = t.state;
      if (as(e, "componentWillReceiveProps"), typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(s, l), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(s, l), ss(), t.state !== d) {
        {
          var p = Te(e.type) || "Component";
          My.has(p) || (My.add(p), g("%s.componentWillReceiveProps(): Assigning directly to this.state is deprecated (except inside a component's constructor). Use setState instead.", p));
        }
        _y.enqueueReplaceState(t, t.state, null);
      }
    }
    function Py(e, t, s, l) {
      n1(e, t, s);
      var d = e.stateNode;
      d.props = s, d.state = e.memoizedState, d.refs = i0, xy(e);
      var p = t.contextType;
      if (typeof p == "object" && p !== null)
        d.context = Bn(p);
      else {
        var w = Jc(e, t, !0);
        d.context = qc(e, w);
      }
      {
        if (d.state === s) {
          var b = Te(t) || "Component";
          Dy.has(b) || (Dy.add(b), g("%s: It is not recommended to assign props directly to state because updates to props won't be reflected in state. In most cases, it is better to use props directly.", b));
        }
        e.mode & yn && pa.recordLegacyContextWarning(e, d), pa.recordUnsafeLifecycleWarnings(e, d);
      }
      xh(e, s, d, l), d.state = e.memoizedState;
      var E = t.getDerivedStateFromProps;
      typeof E == "function" && (Jm(e, t, E, s), d.state = e.memoizedState), typeof t.getDerivedStateFromProps != "function" && typeof d.getSnapshotBeforeUpdate != "function" && (typeof d.UNSAFE_componentWillMount == "function" || typeof d.componentWillMount == "function") && (i1(e, d), xh(e, s, d, l), d.state = e.memoizedState), typeof d.componentDidMount == "function" && (e.effectTag |= xt);
    }
    function r1(e, t, s, l) {
      var d = e.stateNode, p = e.memoizedProps;
      d.props = p;
      var w = d.context, b = t.contextType, E = mr;
      if (typeof b == "object" && b !== null)
        E = Bn(b);
      else {
        var N = Jc(e, t, !0);
        E = qc(e, N);
      }
      var k = t.getDerivedStateFromProps, J = typeof k == "function" || typeof d.getSnapshotBeforeUpdate == "function";
      !J && (typeof d.UNSAFE_componentWillReceiveProps == "function" || typeof d.componentWillReceiveProps == "function") && (p !== s || w !== E) && u0(e, d, s, E), t0();
      var L = e.memoizedState, K = d.state = L;
      if (xh(e, s, d, l), K = e.memoizedState, p === s && L === K && !Pm() && !Gm())
        return typeof d.componentDidMount == "function" && (e.effectTag |= xt), !1;
      typeof k == "function" && (Jm(e, t, k, s), K = e.memoizedState);
      var me = Gm() || s0(e, t, p, s, L, K, E);
      return me ? (!J && (typeof d.UNSAFE_componentWillMount == "function" || typeof d.componentWillMount == "function") && (as(e, "componentWillMount"), typeof d.componentWillMount == "function" && d.componentWillMount(), typeof d.UNSAFE_componentWillMount == "function" && d.UNSAFE_componentWillMount(), ss()), typeof d.componentDidMount == "function" && (e.effectTag |= xt)) : (typeof d.componentDidMount == "function" && (e.effectTag |= xt), e.memoizedProps = s, e.memoizedState = K), d.props = s, d.state = K, d.context = E, me;
    }
    function a1(e, t, s, l, d) {
      var p = t.stateNode;
      Cy(e, t);
      var w = t.memoizedProps;
      p.props = t.type === t.elementType ? w : ma(t.type, w);
      var b = p.context, E = s.contextType, N = mr;
      if (typeof E == "object" && E !== null)
        N = Bn(E);
      else {
        var k = Jc(t, s, !0);
        N = qc(t, k);
      }
      var J = s.getDerivedStateFromProps, L = typeof J == "function" || typeof p.getSnapshotBeforeUpdate == "function";
      !L && (typeof p.UNSAFE_componentWillReceiveProps == "function" || typeof p.componentWillReceiveProps == "function") && (w !== l || b !== N) && u0(t, p, l, N), t0();
      var K = t.memoizedState, me = p.state = K;
      if (xh(t, l, p, d), me = t.memoizedState, w === l && K === me && !Pm() && !Gm())
        return typeof p.componentDidUpdate == "function" && (w !== e.memoizedProps || K !== e.memoizedState) && (t.effectTag |= xt), typeof p.getSnapshotBeforeUpdate == "function" && (w !== e.memoizedProps || K !== e.memoizedState) && (t.effectTag |= Ua), !1;
      typeof J == "function" && (Jm(t, s, J, l), me = t.memoizedState);
      var we = Gm() || s0(t, s, w, l, K, me, N);
      return we ? (!L && (typeof p.UNSAFE_componentWillUpdate == "function" || typeof p.componentWillUpdate == "function") && (as(t, "componentWillUpdate"), typeof p.componentWillUpdate == "function" && p.componentWillUpdate(l, me, N), typeof p.UNSAFE_componentWillUpdate == "function" && p.UNSAFE_componentWillUpdate(l, me, N), ss()), typeof p.componentDidUpdate == "function" && (t.effectTag |= xt), typeof p.getSnapshotBeforeUpdate == "function" && (t.effectTag |= Ua)) : (typeof p.componentDidUpdate == "function" && (w !== e.memoizedProps || K !== e.memoizedState) && (t.effectTag |= xt), typeof p.getSnapshotBeforeUpdate == "function" && (w !== e.memoizedProps || K !== e.memoizedState) && (t.effectTag |= Ua), t.memoizedProps = l, t.memoizedState = me), p.props = l, p.state = me, p.context = N, we;
    }
    var zy, Oy, Ly, By, jy, c0 = function(e) {
    };
    zy = !1, Oy = !1, Ly = {}, By = {}, jy = {}, c0 = function(e) {
      if (!(e === null || typeof e != "object") && !(!e._store || e._store.validated || e.key != null)) {
        if (typeof e._store != "object")
          throw Error("React Component in warnForMissingKey should have a _store. This error is likely caused by a bug in React. Please file an issue.");
        e._store.validated = !0;
        var t = 'Each child in a list should have a unique "key" prop. See https://fb.me/react-warning-keys for more information.' + ft();
        By[t] || (By[t] = !0, g('Each child in a list should have a unique "key" prop. See https://fb.me/react-warning-keys for more information.'));
      }
    };
    var qm = Array.isArray;
    function Th(e, t, s) {
      var l = s.ref;
      if (l !== null && typeof l != "function" && typeof l != "object") {
        if ((e.mode & yn || qn) && !(s._owner && s._self && s._owner.stateNode !== s._self)) {
          var d = Te(e.type) || "Component";
          Ly[d] || (g('A string ref, "%s", has been found within a strict mode tree. String refs are a source of potential bugs and should be avoided. We recommend using useRef() or createRef() instead. Learn more about using refs safely here: https://fb.me/react-strict-mode-string-ref%s', l, $n(e)), Ly[d] = !0);
        }
        if (s._owner) {
          var p = s._owner, w;
          if (p) {
            var b = p;
            if (b.tag !== ce)
              throw Error("Function components cannot have string refs. We recommend using useRef() instead. Learn more about using refs safely here: https://fb.me/react-strict-mode-string-ref");
            w = b.stateNode;
          }
          if (!w)
            throw Error("Missing owner for string ref " + l + ". This error is likely caused by a bug in React. Please file an issue.");
          var E = "" + l;
          if (t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === E)
            return t.ref;
          var N = function(k) {
            var J = w.refs;
            J === i0 && (J = w.refs = {}), k === null ? delete J[E] : J[E] = k;
          };
          return N._stringRef = E, N;
        } else {
          if (typeof l != "string")
            throw Error("Expected ref to be a function, a string, an object returned by React.createRef(), or null.");
          if (!s._owner)
            throw Error("Element ref was specified as a string (" + l + `) but no owner was set. This could happen for one of the following reasons:
1. You may be adding a ref to a function component
2. You may be adding a ref to a component that was not created inside a component's render method
3. You have multiple copies of React loaded
See https://fb.me/react-refs-must-have-owner for more information.`);
        }
      }
      return l;
    }
    function Km(e, t) {
      if (e.type !== "textarea") {
        var s = "";
        throw s = " If you meant to render a collection of children, use an array instead." + ft(), Error("Objects are not valid as a React child (found: " + (Object.prototype.toString.call(t) === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : t) + ")." + s);
      }
    }
    function ev() {
      {
        var e = "Functions are not valid as a React child. This may happen if you return a Component instead of <Component /> from render. Or maybe you meant to call this function rather than return it." + ft();
        if (jy[e])
          return;
        jy[e] = !0, g("Functions are not valid as a React child. This may happen if you return a Component instead of <Component /> from render. Or maybe you meant to call this function rather than return it.");
      }
    }
    function d0(e) {
      function t(F, te) {
        if (!!e) {
          var j = F.lastEffect;
          j !== null ? (j.nextEffect = te, F.lastEffect = te) : F.firstEffect = F.lastEffect = te, te.nextEffect = null, te.effectTag = Us;
        }
      }
      function s(F, te) {
        if (!e)
          return null;
        for (var j = te; j !== null; )
          t(F, j), j = j.sibling;
        return null;
      }
      function l(F, te) {
        for (var j = /* @__PURE__ */ new Map(), ve = te; ve !== null; )
          ve.key !== null ? j.set(ve.key, ve) : j.set(ve.index, ve), ve = ve.sibling;
        return j;
      }
      function d(F, te) {
        var j = Au(F, te);
        return j.index = 0, j.sibling = null, j;
      }
      function p(F, te, j) {
        if (F.index = j, !e)
          return te;
        var ve = F.alternate;
        if (ve !== null) {
          var pe = ve.index;
          return pe < te ? (F.effectTag = Cn, te) : pe;
        } else
          return F.effectTag = Cn, te;
      }
      function w(F) {
        return e && F.alternate === null && (F.effectTag = Cn), F;
      }
      function b(F, te, j, ve) {
        if (te === null || te.tag !== $e) {
          var pe = Kw(j, F.mode, ve);
          return pe.return = F, pe;
        } else {
          var Ee = d(te, j);
          return Ee.return = F, Ee;
        }
      }
      function E(F, te, j, ve) {
        if (te !== null && (te.elementType === j.type || Qx(te, j))) {
          var pe = d(te, j.props);
          return pe.ref = Th(F, te, j), pe.return = F, pe._debugSource = j._source, pe._debugOwner = j._owner, pe;
        }
        var Ee = qw(j, F.mode, ve);
        return Ee.ref = Th(F, te, j), Ee.return = F, Ee;
      }
      function N(F, te, j, ve) {
        if (te === null || te.tag !== Ve || te.stateNode.containerInfo !== j.containerInfo || te.stateNode.implementation !== j.implementation) {
          var pe = eb(j, F.mode, ve);
          return pe.return = F, pe;
        } else {
          var Ee = d(te, j.children || []);
          return Ee.return = F, Ee;
        }
      }
      function k(F, te, j, ve, pe) {
        if (te === null || te.tag !== Tt) {
          var Ee = il(j, F.mode, ve, pe);
          return Ee.return = F, Ee;
        } else {
          var yt = d(te, j);
          return yt.return = F, yt;
        }
      }
      function J(F, te, j) {
        if (typeof te == "string" || typeof te == "number") {
          var ve = Kw("" + te, F.mode, j);
          return ve.return = F, ve;
        }
        if (typeof te == "object" && te !== null) {
          switch (te.$$typeof) {
            case xe: {
              var pe = qw(te, F.mode, j);
              return pe.ref = Th(F, null, te), pe.return = F, pe;
            }
            case Ze: {
              var Ee = eb(te, F.mode, j);
              return Ee.return = F, Ee;
            }
          }
          if (qm(te) || Dr(te)) {
            var yt = il(te, F.mode, j, null);
            return yt.return = F, yt;
          }
          Km(F, te);
        }
        return typeof te == "function" && ev(), null;
      }
      function L(F, te, j, ve) {
        var pe = te !== null ? te.key : null;
        if (typeof j == "string" || typeof j == "number")
          return pe !== null ? null : b(F, te, "" + j, ve);
        if (typeof j == "object" && j !== null) {
          switch (j.$$typeof) {
            case xe:
              return j.key === pe ? j.type === je ? k(F, te, j.props.children, ve, pe) : E(F, te, j, ve) : null;
            case Ze:
              return j.key === pe ? N(F, te, j, ve) : null;
          }
          if (qm(j) || Dr(j))
            return pe !== null ? null : k(F, te, j, ve, null);
          Km(F, j);
        }
        return typeof j == "function" && ev(), null;
      }
      function K(F, te, j, ve, pe) {
        if (typeof ve == "string" || typeof ve == "number") {
          var Ee = F.get(j) || null;
          return b(te, Ee, "" + ve, pe);
        }
        if (typeof ve == "object" && ve !== null) {
          switch (ve.$$typeof) {
            case xe: {
              var yt = F.get(ve.key === null ? j : ve.key) || null;
              return ve.type === je ? k(te, yt, ve.props.children, pe, ve.key) : E(te, yt, ve, pe);
            }
            case Ze: {
              var It = F.get(ve.key === null ? j : ve.key) || null;
              return N(te, It, ve, pe);
            }
          }
          if (qm(ve) || Dr(ve)) {
            var Ht = F.get(j) || null;
            return k(te, Ht, ve, pe, null);
          }
          Km(te, ve);
        }
        return typeof ve == "function" && ev(), null;
      }
      function me(F, te) {
        {
          if (typeof F != "object" || F === null)
            return te;
          switch (F.$$typeof) {
            case xe:
            case Ze:
              c0(F);
              var j = F.key;
              if (typeof j != "string")
                break;
              if (te === null) {
                te = /* @__PURE__ */ new Set(), te.add(j);
                break;
              }
              if (!te.has(j)) {
                te.add(j);
                break;
              }
              g("Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted \u2014 the behavior is unsupported and could change in a future version.", j);
              break;
          }
        }
        return te;
      }
      function we(F, te, j, ve) {
        for (var pe = null, Ee = 0; Ee < j.length; Ee++) {
          var yt = j[Ee];
          pe = me(yt, pe);
        }
        for (var It = null, Ht = null, At = te, zt = 0, Rt = 0, cn = null; At !== null && Rt < j.length; Rt++) {
          At.index > Rt ? (cn = At, At = null) : cn = At.sibling;
          var An = L(F, At, j[Rt], ve);
          if (An === null) {
            At === null && (At = cn);
            break;
          }
          e && At && An.alternate === null && t(F, At), zt = p(An, zt, Rt), Ht === null ? It = An : Ht.sibling = An, Ht = An, At = cn;
        }
        if (Rt === j.length)
          return s(F, At), It;
        if (At === null) {
          for (; Rt < j.length; Rt++) {
            var Rn = J(F, j[Rt], ve);
            Rn !== null && (zt = p(Rn, zt, Rt), Ht === null ? It = Rn : Ht.sibling = Rn, Ht = Rn);
          }
          return It;
        }
        for (var bi = l(F, At); Rt < j.length; Rt++) {
          var tn = K(bi, F, Rt, j[Rt], ve);
          tn !== null && (e && tn.alternate !== null && bi.delete(tn.key === null ? Rt : tn.key), zt = p(tn, zt, Rt), Ht === null ? It = tn : Ht.sibling = tn, Ht = tn);
        }
        return e && bi.forEach(function(Bi) {
          return t(F, Bi);
        }), It;
      }
      function Ke(F, te, j, ve) {
        var pe = Dr(j);
        if (typeof pe != "function")
          throw Error("An object is not an iterable. This error is likely caused by a bug in React. Please file an issue.");
        {
          typeof Symbol == "function" && j[Symbol.toStringTag] === "Generator" && (Oy || g("Using Generators as children is unsupported and will likely yield unexpected results because enumerating a generator mutates it. You may convert it to an array with `Array.from()` or the `[...spread]` operator before rendering. Keep in mind you might need to polyfill these features for older browsers."), Oy = !0), j.entries === pe && (zy || g("Using Maps as children is unsupported and will likely yield unexpected results. Convert it to a sequence/iterable of keyed ReactElements instead."), zy = !0);
          var Ee = pe.call(j);
          if (Ee)
            for (var yt = null, It = Ee.next(); !It.done; It = Ee.next()) {
              var Ht = It.value;
              yt = me(Ht, yt);
            }
        }
        var At = pe.call(j);
        if (At == null)
          throw Error("An iterable object provided no iterator.");
        for (var zt = null, Rt = null, cn = te, An = 0, Rn = 0, bi = null, tn = At.next(); cn !== null && !tn.done; Rn++, tn = At.next()) {
          cn.index > Rn ? (bi = cn, cn = null) : bi = cn.sibling;
          var Bi = L(F, cn, tn.value, ve);
          if (Bi === null) {
            cn === null && (cn = bi);
            break;
          }
          e && cn && Bi.alternate === null && t(F, cn), An = p(Bi, An, Rn), Rt === null ? zt = Bi : Rt.sibling = Bi, Rt = Bi, cn = bi;
        }
        if (tn.done)
          return s(F, cn), zt;
        if (cn === null) {
          for (; !tn.done; Rn++, tn = At.next()) {
            var wa = J(F, tn.value, ve);
            wa !== null && (An = p(wa, An, Rn), Rt === null ? zt = wa : Rt.sibling = wa, Rt = wa);
          }
          return zt;
        }
        for (var ob = l(F, cn); !tn.done; Rn++, tn = At.next()) {
          var rl = K(ob, F, Rn, tn.value, ve);
          rl !== null && (e && rl.alternate !== null && ob.delete(rl.key === null ? Rn : rl.key), An = p(rl, An, Rn), Rt === null ? zt = rl : Rt.sibling = rl, Rt = rl);
        }
        return e && ob.forEach(function(WD) {
          return t(F, WD);
        }), zt;
      }
      function nt(F, te, j, ve) {
        if (te !== null && te.tag === $e) {
          s(F, te.sibling);
          var pe = d(te, j);
          return pe.return = F, pe;
        }
        s(F, te);
        var Ee = Kw(j, F.mode, ve);
        return Ee.return = F, Ee;
      }
      function Pt(F, te, j, ve) {
        for (var pe = j.key, Ee = te; Ee !== null; ) {
          if (Ee.key === pe) {
            switch (Ee.tag) {
              case Tt: {
                if (j.type === je) {
                  s(F, Ee.sibling);
                  var yt = d(Ee, j.props.children);
                  return yt.return = F, yt._debugSource = j._source, yt._debugOwner = j._owner, yt;
                }
                break;
              }
              case Mt:
              default: {
                if (Ee.elementType === j.type || Qx(Ee, j)) {
                  s(F, Ee.sibling);
                  var It = d(Ee, j.props);
                  return It.ref = Th(F, Ee, j), It.return = F, It._debugSource = j._source, It._debugOwner = j._owner, It;
                }
                break;
              }
            }
            s(F, Ee);
            break;
          } else
            t(F, Ee);
          Ee = Ee.sibling;
        }
        if (j.type === je) {
          var Ht = il(j.props.children, F.mode, ve, j.key);
          return Ht.return = F, Ht;
        } else {
          var At = qw(j, F.mode, ve);
          return At.ref = Th(F, te, j), At.return = F, At;
        }
      }
      function vt(F, te, j, ve) {
        for (var pe = j.key, Ee = te; Ee !== null; ) {
          if (Ee.key === pe)
            if (Ee.tag === Ve && Ee.stateNode.containerInfo === j.containerInfo && Ee.stateNode.implementation === j.implementation) {
              s(F, Ee.sibling);
              var yt = d(Ee, j.children || []);
              return yt.return = F, yt;
            } else {
              s(F, Ee);
              break;
            }
          else
            t(F, Ee);
          Ee = Ee.sibling;
        }
        var It = eb(j, F.mode, ve);
        return It.return = F, It;
      }
      function Qt(F, te, j, ve) {
        var pe = typeof j == "object" && j !== null && j.type === je && j.key === null;
        pe && (j = j.props.children);
        var Ee = typeof j == "object" && j !== null;
        if (Ee)
          switch (j.$$typeof) {
            case xe:
              return w(Pt(F, te, j, ve));
            case Ze:
              return w(vt(F, te, j, ve));
          }
        if (typeof j == "string" || typeof j == "number")
          return w(nt(F, te, "" + j, ve));
        if (qm(j))
          return we(F, te, j, ve);
        if (Dr(j))
          return Ke(F, te, j, ve);
        if (Ee && Km(F, j), typeof j == "function" && ev(), typeof j > "u" && !pe)
          switch (F.tag) {
            case ce: {
              var yt = F.stateNode;
              if (yt.render._isMockFunction)
                break;
            }
            case Oe: {
              var It = F.type;
              throw Error((It.displayName || It.name || "Component") + "(...): Nothing was returned from render. This usually means a return statement is missing. Or, to render nothing, return null.");
            }
          }
        return s(F, te);
      }
      return Qt;
    }
    var sd = d0(!0), Uy = d0(!1);
    function s1(e, t) {
      if (!(e === null || t.child === e.child))
        throw Error("Resuming work not yet implemented.");
      if (t.child !== null) {
        var s = t.child, l = Au(s, s.pendingProps);
        for (t.child = l, l.return = t; s.sibling !== null; )
          s = s.sibling, l = l.sibling = Au(s, s.pendingProps), l.return = t;
        l.sibling = null;
      }
    }
    function o1(e, t) {
      for (var s = e.child; s !== null; )
        cD(s, t), s = s.sibling;
    }
    var Mh = {}, Jo = cu(Mh), Eh = cu(Mh), tv = cu(Mh);
    function nv(e) {
      if (e === Mh)
        throw Error("Expected host context to exist. This error is likely caused by a bug in React. Please file an issue.");
      return e;
    }
    function f0() {
      var e = nv(tv.current);
      return e;
    }
    function Vy(e, t) {
      Oi(tv, t, e), Oi(Eh, e, e), Oi(Jo, Mh, e);
      var s = jg(t);
      zi(Jo, e), Oi(Jo, s, e);
    }
    function od(e) {
      zi(Jo, e), zi(Eh, e), zi(tv, e);
    }
    function Hy() {
      var e = nv(Jo.current);
      return e;
    }
    function h0(e) {
      nv(tv.current);
      var t = nv(Jo.current), s = Sm(t, e.type);
      t !== s && (Oi(Eh, e, e), Oi(Jo, s, e));
    }
    function Wy(e) {
      Eh.current === e && (zi(Jo, e), zi(Eh, e));
    }
    var l1 = 0, p0 = 1, Fy = 1, Ih = 2, va = cu(l1);
    function iv(e, t) {
      return (e & t) !== 0;
    }
    function Ah(e) {
      return e & p0;
    }
    function $y(e, t) {
      return e & p0 | t;
    }
    function u1(e, t) {
      return e | t;
    }
    function mu(e, t) {
      Oi(va, t, e);
    }
    function ld(e) {
      zi(va, e);
    }
    function c1(e, t) {
      var s = e.memoizedState;
      if (s !== null)
        return s.dehydrated !== null;
      var l = e.memoizedProps;
      return l.fallback === void 0 ? !1 : l.unstable_avoidThisFallback !== !0 ? !0 : !t;
    }
    function rv(e) {
      for (var t = e; t !== null; ) {
        if (t.tag === ee) {
          var s = t.memoizedState;
          if (s !== null) {
            var l = s.dehydrated;
            if (l === null || ZE(l) || YE(l))
              return t;
          }
        } else if (t.tag === dt && t.memoizedProps.revealOrder !== void 0) {
          var d = (t.effectTag & Ut) !== _t;
          if (d)
            return t;
        } else if (t.child !== null) {
          t.child.return = t, t = t.child;
          continue;
        }
        if (t === e)
          return null;
        for (; t.sibling === null; ) {
          if (t.return === null || t.return === e)
            return null;
          t = t.return;
        }
        t.sibling.return = t.return, t = t.sibling;
      }
      return null;
    }
    function vu(e, t) {
      var s = {
        responder: e,
        props: t
      };
      return Object.freeze(s), s;
    }
    var ud = 1, cd = 2, av = 4, Ie = m.ReactCurrentDispatcher, Fr = m.ReactCurrentBatchConfig, Qy;
    Qy = /* @__PURE__ */ new Set();
    var qo = Ae, Tn = null, wi = null, li = null, sv = !1, d1 = 25, ae = null, $r = null, Ko = -1, Zy = !1;
    function en() {
      {
        var e = ae;
        $r === null ? $r = [e] : $r.push(e);
      }
    }
    function ze() {
      {
        var e = ae;
        $r !== null && (Ko++, $r[Ko] !== e && f1(e));
      }
    }
    function Rh(e) {
      e != null && !Array.isArray(e) && g("%s received a final argument that is not an array (instead, received `%s`). When specified, the final argument must be an array.", ae, typeof e);
    }
    function f1(e) {
      {
        var t = Te(Tn.type);
        if (!Qy.has(t) && (Qy.add(t), $r !== null)) {
          for (var s = "", l = 30, d = 0; d <= Ko; d++) {
            for (var p = $r[d], w = d === Ko ? e : p, b = d + 1 + ". " + p; b.length < l; )
              b += " ";
            b += w + `
`, s += b;
          }
          g(`React has detected a change in the order of Hooks called by %s. This will lead to bugs and errors if not fixed. For more information, read the Rules of Hooks: https://fb.me/rules-of-hooks

   Previous render            Next render
   ------------------------------------------------------
%s   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
`, t, s);
        }
      }
    }
    function gr() {
      throw Error(`Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
1. You might have mismatching versions of React and the renderer (such as React DOM)
2. You might be breaking the Rules of Hooks
3. You might have more than one copy of React in the same app
See https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem.`);
    }
    function Yy(e, t) {
      if (Zy)
        return !1;
      if (t === null)
        return g("%s received a final argument during this render, but not during the previous render. Even though the final argument is optional, its type cannot change between renders.", ae), !1;
      e.length !== t.length && g(`The final argument passed to %s changed size between renders. The order and size of this array must remain constant.

Previous: %s
Incoming: %s`, ae, "[" + t.join(", ") + "]", "[" + e.join(", ") + "]");
      for (var s = 0; s < t.length && s < e.length; s++)
        if (!ou(e[s], t[s]))
          return !1;
      return !0;
    }
    function dd(e, t, s, l, d, p) {
      qo = p, Tn = t, $r = e !== null ? e._debugHookTypes : null, Ko = -1, Zy = e !== null && e.type !== t.type, t.memoizedState = null, t.updateQueue = null, t.expirationTime = Ae, e !== null && e.memoizedState !== null ? Ie.current = M0 : $r !== null ? Ie.current = T0 : Ie.current = C0;
      var w = s(l, d);
      if (t.expirationTime === qo) {
        var b = 0;
        do {
          if (t.expirationTime = Ae, !(b < d1))
            throw Error("Too many re-renders. React limits the number of renders to prevent an infinite loop.");
          b += 1, Zy = !1, wi = null, li = null, t.updateQueue = null, Ko = -1, Ie.current = E0, w = s(l, d);
        } while (t.expirationTime === qo);
      }
      Ie.current = vv, t._debugHookTypes = $r;
      var E = wi !== null && wi.next !== null;
      if (qo = Ae, Tn = null, wi = null, li = null, ae = null, $r = null, Ko = -1, sv = !1, E)
        throw Error("Rendered fewer hooks than expected. This may be caused by an accidental early return statement.");
      return w;
    }
    function m0(e, t, s) {
      t.updateQueue = e.updateQueue, t.effectTag &= ~(Va | xt), e.expirationTime <= s && (e.expirationTime = Ae);
    }
    function v0() {
      if (Ie.current = vv, sv)
        for (var e = Tn.memoizedState; e !== null; ) {
          var t = e.queue;
          t !== null && (t.pending = null), e = e.next;
        }
      qo = Ae, Tn = null, wi = null, li = null, $r = null, Ko = -1, ae = null, sv = !1;
    }
    function fd() {
      var e = {
        memoizedState: null,
        baseState: null,
        baseQueue: null,
        queue: null,
        next: null
      };
      return li === null ? Tn.memoizedState = li = e : li = li.next = e, li;
    }
    function hd() {
      var e;
      if (wi === null) {
        var t = Tn.alternate;
        t !== null ? e = t.memoizedState : e = null;
      } else
        e = wi.next;
      var s;
      if (li === null ? s = Tn.memoizedState : s = li.next, s !== null)
        li = s, s = li.next, wi = e;
      else {
        if (e === null)
          throw Error("Rendered more hooks than during the previous render.");
        wi = e;
        var l = {
          memoizedState: wi.memoizedState,
          baseState: wi.baseState,
          baseQueue: wi.baseQueue,
          queue: wi.queue,
          next: null
        };
        li === null ? Tn.memoizedState = li = l : li = li.next = l;
      }
      return li;
    }
    function h1() {
      return {
        lastEffect: null
      };
    }
    function Gy(e, t) {
      return typeof t == "function" ? t(e) : t;
    }
    function Xy(e, t, s) {
      var l = fd(), d;
      s !== void 0 ? d = s(t) : d = t, l.memoizedState = l.baseState = d;
      var p = l.queue = {
        pending: null,
        dispatch: null,
        lastRenderedReducer: e,
        lastRenderedState: d
      }, w = p.dispatch = x0.bind(null, Tn, p);
      return [l.memoizedState, w];
    }
    function Jy(e, t, s) {
      var l = hd(), d = l.queue;
      if (d === null)
        throw Error("Should have a queue. This is likely a bug in React. Please file an issue.");
      d.lastRenderedReducer = e;
      var p = wi, w = p.baseQueue, b = d.pending;
      if (b !== null) {
        if (w !== null) {
          var E = w.next, N = b.next;
          w.next = N, b.next = E;
        }
        p.baseQueue = w = b, d.pending = null;
      }
      if (w !== null) {
        var k = w.next, J = p.baseState, L = null, K = null, me = null, we = k;
        do {
          var Ke = we.expirationTime;
          if (Ke < qo) {
            var nt = {
              expirationTime: we.expirationTime,
              suspenseConfig: we.suspenseConfig,
              action: we.action,
              eagerReducer: we.eagerReducer,
              eagerState: we.eagerState,
              next: null
            };
            me === null ? (K = me = nt, L = J) : me = me.next = nt, Ke > Tn.expirationTime && (Tn.expirationTime = Ke, Ov(Ke));
          } else {
            if (me !== null) {
              var Pt = {
                expirationTime: Ct,
                suspenseConfig: we.suspenseConfig,
                action: we.action,
                eagerReducer: we.eagerReducer,
                eagerState: we.eagerState,
                next: null
              };
              me = me.next = Pt;
            }
            if (SC(Ke, we.suspenseConfig), we.eagerReducer === e)
              J = we.eagerState;
            else {
              var vt = we.action;
              J = e(J, vt);
            }
          }
          we = we.next;
        } while (we !== null && we !== k);
        me === null ? L = J : me.next = K, ou(J, l.memoizedState) || Tw(), l.memoizedState = J, l.baseState = L, l.baseQueue = me, d.lastRenderedState = J;
      }
      var Qt = d.dispatch;
      return [l.memoizedState, Qt];
    }
    function qy(e, t, s) {
      var l = hd(), d = l.queue;
      if (d === null)
        throw Error("Should have a queue. This is likely a bug in React. Please file an issue.");
      d.lastRenderedReducer = e;
      var p = d.dispatch, w = d.pending, b = l.memoizedState;
      if (w !== null) {
        d.pending = null;
        var E = w.next, N = E;
        do {
          var k = N.action;
          b = e(b, k), N = N.next;
        } while (N !== E);
        ou(b, l.memoizedState) || Tw(), l.memoizedState = b, l.baseQueue === null && (l.baseState = b), d.lastRenderedState = b;
      }
      return [b, p];
    }
    function Dh(e) {
      var t = fd();
      typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e;
      var s = t.queue = {
        pending: null,
        dispatch: null,
        lastRenderedReducer: Gy,
        lastRenderedState: e
      }, l = s.dispatch = x0.bind(null, Tn, s);
      return [t.memoizedState, l];
    }
    function ov(e) {
      return Jy(Gy);
    }
    function lv(e) {
      return qy(Gy);
    }
    function Ky(e, t, s, l) {
      var d = {
        tag: e,
        create: t,
        destroy: s,
        deps: l,
        next: null
      }, p = Tn.updateQueue;
      if (p === null)
        p = h1(), Tn.updateQueue = p, p.lastEffect = d.next = d;
      else {
        var w = p.lastEffect;
        if (w === null)
          p.lastEffect = d.next = d;
        else {
          var b = w.next;
          w.next = d, d.next = b, p.lastEffect = d;
        }
      }
      return d;
    }
    function ew(e) {
      var t = fd(), s = {
        current: e
      };
      return Object.seal(s), t.memoizedState = s, s;
    }
    function uv(e) {
      var t = hd();
      return t.memoizedState;
    }
    function tw(e, t, s, l) {
      var d = fd(), p = l === void 0 ? null : l;
      Tn.effectTag |= e, d.memoizedState = Ky(ud | t, s, void 0, p);
    }
    function nw(e, t, s, l) {
      var d = hd(), p = l === void 0 ? null : l, w = void 0;
      if (wi !== null) {
        var b = wi.memoizedState;
        if (w = b.destroy, p !== null) {
          var E = b.deps;
          if (Yy(p, E)) {
            Ky(t, s, w, p);
            return;
          }
        }
      }
      Tn.effectTag |= e, d.memoizedState = Ky(ud | t, s, w, p);
    }
    function cv(e, t) {
      return typeof jest < "u" && RC(Tn), tw(xt | Va, av, e, t);
    }
    function pd(e, t) {
      return typeof jest < "u" && RC(Tn), nw(xt | Va, av, e, t);
    }
    function iw(e, t) {
      return tw(xt, cd, e, t);
    }
    function dv(e, t) {
      return nw(xt, cd, e, t);
    }
    function g0(e, t) {
      if (typeof t == "function") {
        var s = t, l = e();
        return s(l), function() {
          s(null);
        };
      } else if (t != null) {
        var d = t;
        d.hasOwnProperty("current") || g("Expected useImperativeHandle() first argument to either be a ref callback or React.createRef() object. Instead received: %s.", "an object with keys {" + Object.keys(d).join(", ") + "}");
        var p = e();
        return d.current = p, function() {
          d.current = null;
        };
      }
    }
    function rw(e, t, s) {
      typeof t != "function" && g("Expected useImperativeHandle() second argument to be a function that creates a handle. Instead received: %s.", t !== null ? typeof t : "null");
      var l = s != null ? s.concat([e]) : null;
      return tw(xt, cd, g0.bind(null, t, e), l);
    }
    function fv(e, t, s) {
      typeof t != "function" && g("Expected useImperativeHandle() second argument to be a function that creates a handle. Instead received: %s.", t !== null ? typeof t : "null");
      var l = s != null ? s.concat([e]) : null;
      return nw(xt, cd, g0.bind(null, t, e), l);
    }
    function p1(e, t) {
    }
    var hv = p1;
    function pv(e, t) {
      var s = fd(), l = t === void 0 ? null : t;
      return s.memoizedState = [e, l], e;
    }
    function md(e, t) {
      var s = hd(), l = t === void 0 ? null : t, d = s.memoizedState;
      if (d !== null && l !== null) {
        var p = d[1];
        if (Yy(l, p))
          return d[0];
      }
      return s.memoizedState = [e, l], e;
    }
    function aw(e, t) {
      var s = fd(), l = t === void 0 ? null : t, d = e();
      return s.memoizedState = [d, l], d;
    }
    function mv(e, t) {
      var s = hd(), l = t === void 0 ? null : t, d = s.memoizedState;
      if (d !== null && l !== null) {
        var p = d[1];
        if (Yy(l, p))
          return d[0];
      }
      var w = e();
      return s.memoizedState = [w, l], w;
    }
    function sw(e, t) {
      var s = Dh(e), l = s[0], d = s[1];
      return cv(function() {
        var p = Fr.suspense;
        Fr.suspense = t === void 0 ? null : t;
        try {
          d(e);
        } finally {
          Fr.suspense = p;
        }
      }, [e, t]), l;
    }
    function y0(e, t) {
      var s = ov(), l = s[0], d = s[1];
      return pd(function() {
        var p = Fr.suspense;
        Fr.suspense = t === void 0 ? null : t;
        try {
          d(e);
        } finally {
          Fr.suspense = p;
        }
      }, [e, t]), l;
    }
    function w0(e, t) {
      var s = lv(), l = s[0], d = s[1];
      return pd(function() {
        var p = Fr.suspense;
        Fr.suspense = t === void 0 ? null : t;
        try {
          d(e);
        } finally {
          Fr.suspense = p;
        }
      }, [e, t]), l;
    }
    function ow(e, t, s) {
      var l = ed();
      co(l < Yo ? Yo : l, function() {
        e(!0);
      }), co(l > ha ? ha : l, function() {
        var d = Fr.suspense;
        Fr.suspense = t === void 0 ? null : t;
        try {
          e(!1), s();
        } finally {
          Fr.suspense = d;
        }
      });
    }
    function lw(e) {
      var t = Dh(!1), s = t[0], l = t[1], d = pv(ow.bind(null, l, e), [l, e]);
      return [d, s];
    }
    function b0(e) {
      var t = ov(), s = t[0], l = t[1], d = md(ow.bind(null, l, e), [l, e]);
      return [d, s];
    }
    function S0(e) {
      var t = lv(), s = t[0], l = t[1], d = md(ow.bind(null, l, e), [l, e]);
      return [d, s];
    }
    function x0(e, t, s) {
      typeof arguments[3] == "function" && g("State updates from the useState() and useReducer() Hooks don't support the second callback argument. To execute a side effect after rendering, declare it in the component body with useEffect().");
      var l = ps(), d = Ch(), p = Cu(l, e, d), w = {
        expirationTime: p,
        suspenseConfig: d,
        action: s,
        eagerReducer: null,
        eagerState: null,
        next: null
      };
      w.priority = ed();
      var b = t.pending;
      b === null ? w.next = w : (w.next = b.next, b.next = w), t.pending = w;
      var E = e.alternate;
      if (e === Tn || E !== null && E === Tn)
        sv = !0, w.expirationTime = qo, Tn.expirationTime = qo;
      else {
        if (e.expirationTime === Ae && (E === null || E.expirationTime === Ae)) {
          var N = t.lastRenderedReducer;
          if (N !== null) {
            var k;
            k = Ie.current, Ie.current = ga;
            try {
              var J = t.lastRenderedState, L = N(J, s);
              if (w.eagerReducer = N, w.eagerState = L, ou(L, J))
                return;
            } catch {
            } finally {
              Ie.current = k;
            }
          }
        }
        typeof jest < "u" && (AC(e), JR(e)), Zr(e, p);
      }
    }
    var vv = {
      readContext: Bn,
      useCallback: gr,
      useContext: gr,
      useEffect: gr,
      useImperativeHandle: gr,
      useLayoutEffect: gr,
      useMemo: gr,
      useReducer: gr,
      useRef: gr,
      useState: gr,
      useDebugValue: gr,
      useResponder: gr,
      useDeferredValue: gr,
      useTransition: gr
    }, C0 = null, T0 = null, M0 = null, E0 = null, fs = null, ga = null, gv = null;
    {
      var uw = function() {
        g("Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo().");
      }, ht = function() {
        g("Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. You can only call Hooks at the top level of your React function. For more information, see https://fb.me/rules-of-hooks");
      };
      C0 = {
        readContext: function(e, t) {
          return Bn(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", en(), Rh(t), pv(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", en(), Bn(e, t);
        },
        useEffect: function(e, t) {
          return ae = "useEffect", en(), Rh(t), cv(e, t);
        },
        useImperativeHandle: function(e, t, s) {
          return ae = "useImperativeHandle", en(), Rh(s), rw(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", en(), Rh(t), iw(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", en(), Rh(t);
          var s = Ie.current;
          Ie.current = fs;
          try {
            return aw(e, t);
          } finally {
            Ie.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", en();
          var l = Ie.current;
          Ie.current = fs;
          try {
            return Xy(e, t, s);
          } finally {
            Ie.current = l;
          }
        },
        useRef: function(e) {
          return ae = "useRef", en(), ew(e);
        },
        useState: function(e) {
          ae = "useState", en();
          var t = Ie.current;
          Ie.current = fs;
          try {
            return Dh(e);
          } finally {
            Ie.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return ae = "useDebugValue", en(), void 0;
        },
        useResponder: function(e, t) {
          return ae = "useResponder", en(), vu(e, t);
        },
        useDeferredValue: function(e, t) {
          return ae = "useDeferredValue", en(), sw(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", en(), lw(e);
        }
      }, T0 = {
        readContext: function(e, t) {
          return Bn(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", ze(), pv(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", ze(), Bn(e, t);
        },
        useEffect: function(e, t) {
          return ae = "useEffect", ze(), cv(e, t);
        },
        useImperativeHandle: function(e, t, s) {
          return ae = "useImperativeHandle", ze(), rw(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", ze(), iw(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", ze();
          var s = Ie.current;
          Ie.current = fs;
          try {
            return aw(e, t);
          } finally {
            Ie.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", ze();
          var l = Ie.current;
          Ie.current = fs;
          try {
            return Xy(e, t, s);
          } finally {
            Ie.current = l;
          }
        },
        useRef: function(e) {
          return ae = "useRef", ze(), ew(e);
        },
        useState: function(e) {
          ae = "useState", ze();
          var t = Ie.current;
          Ie.current = fs;
          try {
            return Dh(e);
          } finally {
            Ie.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return ae = "useDebugValue", ze(), void 0;
        },
        useResponder: function(e, t) {
          return ae = "useResponder", ze(), vu(e, t);
        },
        useDeferredValue: function(e, t) {
          return ae = "useDeferredValue", ze(), sw(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", ze(), lw(e);
        }
      }, M0 = {
        readContext: function(e, t) {
          return Bn(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", ze(), md(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", ze(), Bn(e, t);
        },
        useEffect: function(e, t) {
          return ae = "useEffect", ze(), pd(e, t);
        },
        useImperativeHandle: function(e, t, s) {
          return ae = "useImperativeHandle", ze(), fv(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", ze(), dv(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", ze();
          var s = Ie.current;
          Ie.current = ga;
          try {
            return mv(e, t);
          } finally {
            Ie.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", ze();
          var l = Ie.current;
          Ie.current = ga;
          try {
            return Jy(e, t, s);
          } finally {
            Ie.current = l;
          }
        },
        useRef: function(e) {
          return ae = "useRef", ze(), uv();
        },
        useState: function(e) {
          ae = "useState", ze();
          var t = Ie.current;
          Ie.current = ga;
          try {
            return ov(e);
          } finally {
            Ie.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return ae = "useDebugValue", ze(), hv();
        },
        useResponder: function(e, t) {
          return ae = "useResponder", ze(), vu(e, t);
        },
        useDeferredValue: function(e, t) {
          return ae = "useDeferredValue", ze(), y0(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", ze(), b0(e);
        }
      }, E0 = {
        readContext: function(e, t) {
          return Bn(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", ze(), md(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", ze(), Bn(e, t);
        },
        useEffect: function(e, t) {
          return ae = "useEffect", ze(), pd(e, t);
        },
        useImperativeHandle: function(e, t, s) {
          return ae = "useImperativeHandle", ze(), fv(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", ze(), dv(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", ze();
          var s = Ie.current;
          Ie.current = gv;
          try {
            return mv(e, t);
          } finally {
            Ie.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", ze();
          var l = Ie.current;
          Ie.current = gv;
          try {
            return qy(e, t, s);
          } finally {
            Ie.current = l;
          }
        },
        useRef: function(e) {
          return ae = "useRef", ze(), uv();
        },
        useState: function(e) {
          ae = "useState", ze();
          var t = Ie.current;
          Ie.current = gv;
          try {
            return lv(e);
          } finally {
            Ie.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return ae = "useDebugValue", ze(), hv();
        },
        useResponder: function(e, t) {
          return ae = "useResponder", ze(), vu(e, t);
        },
        useDeferredValue: function(e, t) {
          return ae = "useDeferredValue", ze(), w0(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", ze(), S0(e);
        }
      }, fs = {
        readContext: function(e, t) {
          return uw(), Bn(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", ht(), en(), pv(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", ht(), en(), Bn(e, t);
        },
        useEffect: function(e, t) {
          return ae = "useEffect", ht(), en(), cv(e, t);
        },
        useImperativeHandle: function(e, t, s) {
          return ae = "useImperativeHandle", ht(), en(), rw(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", ht(), en(), iw(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", ht(), en();
          var s = Ie.current;
          Ie.current = fs;
          try {
            return aw(e, t);
          } finally {
            Ie.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", ht(), en();
          var l = Ie.current;
          Ie.current = fs;
          try {
            return Xy(e, t, s);
          } finally {
            Ie.current = l;
          }
        },
        useRef: function(e) {
          return ae = "useRef", ht(), en(), ew(e);
        },
        useState: function(e) {
          ae = "useState", ht(), en();
          var t = Ie.current;
          Ie.current = fs;
          try {
            return Dh(e);
          } finally {
            Ie.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return ae = "useDebugValue", ht(), en(), void 0;
        },
        useResponder: function(e, t) {
          return ae = "useResponder", ht(), en(), vu(e, t);
        },
        useDeferredValue: function(e, t) {
          return ae = "useDeferredValue", ht(), en(), sw(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", ht(), en(), lw(e);
        }
      }, ga = {
        readContext: function(e, t) {
          return uw(), Bn(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", ht(), ze(), md(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", ht(), ze(), Bn(e, t);
        },
        useEffect: function(e, t) {
          return ae = "useEffect", ht(), ze(), pd(e, t);
        },
        useImperativeHandle: function(e, t, s) {
          return ae = "useImperativeHandle", ht(), ze(), fv(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", ht(), ze(), dv(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", ht(), ze();
          var s = Ie.current;
          Ie.current = ga;
          try {
            return mv(e, t);
          } finally {
            Ie.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", ht(), ze();
          var l = Ie.current;
          Ie.current = ga;
          try {
            return Jy(e, t, s);
          } finally {
            Ie.current = l;
          }
        },
        useRef: function(e) {
          return ae = "useRef", ht(), ze(), uv();
        },
        useState: function(e) {
          ae = "useState", ht(), ze();
          var t = Ie.current;
          Ie.current = ga;
          try {
            return ov(e);
          } finally {
            Ie.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return ae = "useDebugValue", ht(), ze(), hv();
        },
        useResponder: function(e, t) {
          return ae = "useResponder", ht(), ze(), vu(e, t);
        },
        useDeferredValue: function(e, t) {
          return ae = "useDeferredValue", ht(), ze(), y0(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", ht(), ze(), b0(e);
        }
      }, gv = {
        readContext: function(e, t) {
          return uw(), Bn(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", ht(), ze(), md(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", ht(), ze(), Bn(e, t);
        },
        useEffect: function(e, t) {
          return ae = "useEffect", ht(), ze(), pd(e, t);
        },
        useImperativeHandle: function(e, t, s) {
          return ae = "useImperativeHandle", ht(), ze(), fv(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", ht(), ze(), dv(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", ht(), ze();
          var s = Ie.current;
          Ie.current = ga;
          try {
            return mv(e, t);
          } finally {
            Ie.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", ht(), ze();
          var l = Ie.current;
          Ie.current = ga;
          try {
            return qy(e, t, s);
          } finally {
            Ie.current = l;
          }
        },
        useRef: function(e) {
          return ae = "useRef", ht(), ze(), uv();
        },
        useState: function(e) {
          ae = "useState", ht(), ze();
          var t = Ie.current;
          Ie.current = ga;
          try {
            return lv(e);
          } finally {
            Ie.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return ae = "useDebugValue", ht(), ze(), hv();
        },
        useResponder: function(e, t) {
          return ae = "useResponder", ht(), ze(), vu(e, t);
        },
        useDeferredValue: function(e, t) {
          return ae = "useDeferredValue", ht(), ze(), w0(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", ht(), ze(), S0(e);
        }
      };
    }
    var yv = o.unstable_now, I0 = 0, Nh = -1;
    function m1() {
      return I0;
    }
    function A0() {
      I0 = yv();
    }
    function cw(e) {
      Nh = yv(), e.actualStartTime < 0 && (e.actualStartTime = yv());
    }
    function R0(e) {
      Nh = -1;
    }
    function wv(e, t) {
      if (Nh >= 0) {
        var s = yv() - Nh;
        e.actualDuration += s, t && (e.selfBaseDuration = s), Nh = -1;
      }
    }
    var Qr = null, gu = null, yu = !1;
    function v1(e) {
      var t = e.stateNode.containerInfo;
      return gu = _S(t), Qr = e, yu = !0, !0;
    }
    function D0(e, t) {
      switch (e.tag) {
        case Se:
          nI(e.stateNode.containerInfo, t);
          break;
        case Re:
          iI(e.type, e.memoizedProps, e.stateNode, t);
          break;
      }
      var s = mD();
      s.stateNode = t, s.return = e, s.effectTag = Us, e.lastEffect !== null ? (e.lastEffect.nextEffect = s, e.lastEffect = s) : e.firstEffect = e.lastEffect = s;
    }
    function N0(e, t) {
      switch (t.effectTag = t.effectTag & ~$i | Cn, e.tag) {
        case Se: {
          var s = e.stateNode.containerInfo;
          switch (t.tag) {
            case Re:
              var l = t.type;
              t.pendingProps, rI(s, l);
              break;
            case $e:
              var d = t.pendingProps;
              aI(s, d);
              break;
          }
          break;
        }
        case Re: {
          var p = e.type, w = e.memoizedProps, b = e.stateNode;
          switch (t.tag) {
            case Re:
              var E = t.type;
              t.pendingProps, sI(p, w, b, E);
              break;
            case $e:
              var N = t.pendingProps;
              oI(p, w, b, N);
              break;
            case ee:
              lI(p, w);
              break;
          }
          break;
        }
        default:
          return;
      }
    }
    function k0(e, t) {
      switch (e.tag) {
        case Re: {
          var s = e.type;
          e.pendingProps;
          var l = ns(t, s);
          return l !== null ? (e.stateNode = l, !0) : !1;
        }
        case $e: {
          var d = e.pendingProps, p = Ug(t, d);
          return p !== null ? (e.stateNode = p, !0) : !1;
        }
        case ee:
          return !1;
        default:
          return !1;
      }
    }
    function dw(e) {
      if (!!yu) {
        var t = gu;
        if (!t) {
          N0(Qr, e), yu = !1, Qr = e;
          return;
        }
        var s = t;
        if (!k0(e, t)) {
          if (t = xm(s), !t || !k0(e, t)) {
            N0(Qr, e), yu = !1, Qr = e;
            return;
          }
          D0(Qr, s);
        }
        Qr = e, gu = _S(t);
      }
    }
    function g1(e, t, s) {
      var l = e.stateNode, d = GE(l, e.type, e.memoizedProps, t, s, e);
      return e.updateQueue = d, d !== null;
    }
    function y1(e) {
      var t = e.stateNode, s = e.memoizedProps, l = XE(t, s, e);
      if (l) {
        var d = Qr;
        if (d !== null)
          switch (d.tag) {
            case Se: {
              var p = d.stateNode.containerInfo;
              eI(p, t, s);
              break;
            }
            case Re: {
              var w = d.type, b = d.memoizedProps, E = d.stateNode;
              tI(w, b, E, t, s);
              break;
            }
          }
      }
      return l;
    }
    function w1(e) {
      var t = e.memoizedState, s = t !== null ? t.dehydrated : null;
      if (!s)
        throw Error("Expected to have a hydrated suspense instance. This error is likely caused by a bug in React. Please file an issue.");
      return JE(s);
    }
    function _0(e) {
      for (var t = e.return; t !== null && t.tag !== Re && t.tag !== Se && t.tag !== ee; )
        t = t.return;
      Qr = t;
    }
    function bv(e) {
      if (e !== Qr)
        return !1;
      if (!yu)
        return _0(e), yu = !0, !1;
      var t = e.type;
      if (e.tag !== Re || t !== "head" && t !== "body" && !T(t, e.memoizedProps))
        for (var s = gu; s; )
          D0(e, s), s = xm(s);
      return _0(e), e.tag === ee ? gu = w1(e) : gu = Qr ? xm(e.stateNode) : null, !0;
    }
    function fw() {
      Qr = null, gu = null, yu = !1;
    }
    var kh = m.ReactCurrentOwner, el = !1, hw, pw, mw, vw, gw, wu, yw, Sv;
    hw = {}, pw = {}, mw = {}, vw = {}, gw = {}, wu = !1, yw = {}, Sv = {};
    function yr(e, t, s, l) {
      e === null ? t.child = Uy(t, null, s, l) : t.child = sd(t, e.child, s, l);
    }
    function b1(e, t, s, l) {
      t.child = sd(t, e.child, null, l), t.child = sd(t, null, s, l);
    }
    function P0(e, t, s, l, d) {
      if (t.type !== t.elementType) {
        var p = s.propTypes;
        p && c(
          p,
          l,
          "prop",
          Te(s),
          ft
        );
      }
      var w = s.render, b = t.ref, E;
      return ad(t, d), kh.current = t, Nr(!0), E = dd(e, t, w, l, b, d), t.mode & yn && t.memoizedState !== null && (E = dd(e, t, w, l, b, d)), Nr(!1), e !== null && !el ? (m0(e, t, d), fo(e, t, d)) : (t.effectTag |= lr, yr(e, t, E, d), t.child);
    }
    function z0(e, t, s, l, d, p) {
      if (e === null) {
        var w = s.type;
        if (lD(w) && s.compare === null && s.defaultProps === void 0) {
          var b = w;
          return b = id(w), t.tag = ge, t.type = b, Sw(t, w), O0(e, t, b, l, d, p);
        }
        {
          var E = w.propTypes;
          E && c(
            E,
            l,
            "prop",
            Te(w),
            ft
          );
        }
        var N = Jw(s.type, null, l, null, t.mode, p);
        return N.ref = t.ref, N.return = t, t.child = N, N;
      }
      {
        var k = s.type, J = k.propTypes;
        J && c(
          J,
          l,
          "prop",
          Te(k),
          ft
        );
      }
      var L = e.child;
      if (d < p) {
        var K = L.memoizedProps, me = s.compare;
        if (me = me !== null ? me : uh, me(K, l) && e.ref === t.ref)
          return fo(e, t, p);
      }
      t.effectTag |= lr;
      var we = Au(L, l);
      return we.ref = t.ref, we.return = t, t.child = we, we;
    }
    function O0(e, t, s, l, d, p) {
      if (t.type !== t.elementType) {
        var w = t.elementType;
        w.$$typeof === ir && (w = zd(w));
        var b = w && w.propTypes;
        b && c(
          b,
          l,
          "prop",
          Te(w),
          ft
        );
      }
      if (e !== null) {
        var E = e.memoizedProps;
        if (uh(E, l) && e.ref === t.ref && t.type === e.type && (el = !1, d < p))
          return t.expirationTime = e.expirationTime, fo(e, t, p);
      }
      return ww(e, t, s, l, p);
    }
    function S1(e, t, s) {
      var l = t.pendingProps;
      return yr(e, t, l, s), t.child;
    }
    function x1(e, t, s) {
      var l = t.pendingProps.children;
      return yr(e, t, l, s), t.child;
    }
    function C1(e, t, s) {
      t.effectTag |= xt;
      var l = t.pendingProps, d = l.children;
      return yr(e, t, d, s), t.child;
    }
    function L0(e, t) {
      var s = t.ref;
      (e === null && s !== null || e !== null && e.ref !== s) && (t.effectTag |= pi);
    }
    function ww(e, t, s, l, d) {
      if (t.type !== t.elementType) {
        var p = s.propTypes;
        p && c(
          p,
          l,
          "prop",
          Te(s),
          ft
        );
      }
      var w;
      {
        var b = Jc(t, s, !0);
        w = qc(t, b);
      }
      var E;
      return ad(t, d), kh.current = t, Nr(!0), E = dd(e, t, s, l, w, d), t.mode & yn && t.memoizedState !== null && (E = dd(e, t, s, l, w, d)), Nr(!1), e !== null && !el ? (m0(e, t, d), fo(e, t, d)) : (t.effectTag |= lr, yr(e, t, E, d), t.child);
    }
    function B0(e, t, s, l, d) {
      if (t.type !== t.elementType) {
        var p = s.propTypes;
        p && c(
          p,
          l,
          "prop",
          Te(s),
          ft
        );
      }
      var w;
      ls(s) ? (w = !0, Om(t)) : w = !1, ad(t, d);
      var b = t.stateNode, E;
      b === null ? (e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= Cn), l0(t, s, l), Py(t, s, l, d), E = !0) : e === null ? E = r1(t, s, l, d) : E = a1(e, t, s, l, d);
      var N = bw(e, t, s, E, w, d);
      {
        var k = t.stateNode;
        k.props !== l && (wu || g("It looks like %s is reassigning its own `this.props` while rendering. This is not supported and can lead to confusing bugs.", Te(t.type) || "a component"), wu = !0);
      }
      return N;
    }
    function bw(e, t, s, l, d, p) {
      L0(e, t);
      var w = (t.effectTag & Ut) !== _t;
      if (!l && !w)
        return d && Ex(t, s, !1), fo(e, t, p);
      var b = t.stateNode;
      kh.current = t;
      var E;
      return w && typeof s.getDerivedStateFromError != "function" ? (E = null, R0()) : (Nr(!0), E = b.render(), t.mode & yn && b.render(), Nr(!1)), t.effectTag |= lr, e !== null && w ? b1(e, t, E, p) : yr(e, t, E, p), t.memoizedState = b.state, d && Ex(t, s, !0), t.child;
    }
    function j0(e) {
      var t = e.stateNode;
      t.pendingContext ? Tx(e, t.pendingContext, t.pendingContext !== t.context) : t.context && Tx(e, t.context, !1), Vy(e, t.containerInfo);
    }
    function T1(e, t, s) {
      j0(t);
      var l = t.updateQueue;
      if (!(e !== null && l !== null))
        throw Error("If the root does not have an updateQueue, we should have already bailed out. This error is likely caused by a bug in React. Please file an issue.");
      var d = t.pendingProps, p = t.memoizedState, w = p !== null ? p.element : null;
      Cy(e, t), xh(t, d, null, s);
      var b = t.memoizedState, E = b.element;
      if (E === w)
        return fw(), fo(e, t, s);
      var N = t.stateNode;
      if (N.hydrate && v1(t)) {
        var k = Uy(t, null, E, s);
        t.child = k;
        for (var J = k; J; )
          J.effectTag = J.effectTag & ~Cn | $i, J = J.sibling;
      } else
        yr(e, t, E, s), fw();
      return t.child;
    }
    function M1(e, t, s) {
      h0(t), e === null && dw(t);
      var l = t.type, d = t.pendingProps, p = e !== null ? e.memoizedProps : null, w = d.children, b = T(l, d);
      return b ? w = null : p !== null && T(l, p) && (t.effectTag |= Ri), L0(e, t), t.mode & td && s !== ds && R(l, d) ? ($w(ds), t.expirationTime = t.childExpirationTime = ds, null) : (yr(e, t, w, s), t.child);
    }
    function E1(e, t) {
      return e === null && dw(t), null;
    }
    function I1(e, t, s, l, d) {
      e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= Cn);
      var p = t.pendingProps;
      hx(t);
      var w = GA(s);
      t.type = w;
      var b = t.tag = uD(w);
      fx(t);
      var E = ma(w, p), N;
      switch (b) {
        case Oe:
          return Sw(t, w), t.type = w = id(w), N = ww(null, t, w, E, d), N;
        case ce:
          return t.type = w = hy(w), N = B0(null, t, w, E, d), N;
        case D:
          return t.type = w = py(w), N = P0(null, t, w, E, d), N;
        case Ce: {
          if (t.type !== t.elementType) {
            var k = w.propTypes;
            k && c(
              k,
              E,
              "prop",
              Te(w),
              ft
            );
          }
          return N = z0(
            null,
            t,
            w,
            ma(w.type, E),
            l,
            d
          ), N;
        }
      }
      var J = "";
      throw w !== null && typeof w == "object" && w.$$typeof === ir && (J = " Did you wrap a component in React.lazy() more than once?"), Error("Element type is invalid. Received a promise that resolves to: " + w + ". Lazy element type must resolve to a class or function." + J);
    }
    function A1(e, t, s, l, d) {
      e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= Cn), t.tag = ce;
      var p;
      return ls(s) ? (p = !0, Om(t)) : p = !1, ad(t, d), l0(t, s, l), Py(t, s, l, d), bw(null, t, s, !0, p, d);
    }
    function R1(e, t, s, l) {
      e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= Cn);
      var d = t.pendingProps, p;
      {
        var w = Jc(t, s, !1);
        p = qc(t, w);
      }
      ad(t, l);
      var b;
      {
        if (s.prototype && typeof s.prototype.render == "function") {
          var E = Te(s) || "Unknown";
          hw[E] || (g("The <%s /> component appears to have a render method, but doesn't extend React.Component. This is likely to cause errors. Change %s to extend React.Component instead.", E, E), hw[E] = !0);
        }
        t.mode & yn && pa.recordLegacyContextWarning(t, null), Nr(!0), kh.current = t, b = dd(null, t, s, d, p, l), Nr(!1);
      }
      if (t.effectTag |= lr, typeof b == "object" && b !== null && typeof b.render == "function" && b.$$typeof === void 0) {
        {
          var N = Te(s) || "Unknown";
          pw[N] || (g("The <%s /> component appears to be a function component that returns a class instance. Change %s to a class that extends React.Component instead. If you can't use a class try assigning the prototype on the function as a workaround. `%s.prototype = React.Component.prototype`. Don't use an arrow function since it cannot be called with `new` by React.", N, N, N), pw[N] = !0);
        }
        t.tag = ce, t.memoizedState = null, t.updateQueue = null;
        var k = !1;
        ls(s) ? (k = !0, Om(t)) : k = !1, t.memoizedState = b.state !== null && b.state !== void 0 ? b.state : null, xy(t);
        var J = s.getDerivedStateFromProps;
        return typeof J == "function" && Jm(t, s, J, d), o0(t, b), Py(t, s, d, l), bw(null, t, s, !0, k, l);
      } else
        return t.tag = Oe, t.mode & yn && t.memoizedState !== null && (b = dd(null, t, s, d, p, l)), yr(null, t, b, l), Sw(t, s), t.child;
    }
    function Sw(e, t) {
      {
        if (t && t.childContextTypes && g("%s(...): childContextTypes cannot be defined on a function component.", t.displayName || t.name || "Component"), e.ref !== null) {
          var s = "", l = Na();
          l && (s += `

Check the render method of \`` + l + "`.");
          var d = l || e._debugID || "", p = e._debugSource;
          p && (d = p.fileName + ":" + p.lineNumber), gw[d] || (gw[d] = !0, g("Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?%s", s));
        }
        if (typeof t.getDerivedStateFromProps == "function") {
          var w = Te(t) || "Unknown";
          vw[w] || (g("%s: Function components do not support getDerivedStateFromProps.", w), vw[w] = !0);
        }
        if (typeof t.contextType == "object" && t.contextType !== null) {
          var b = Te(t) || "Unknown";
          mw[b] || (g("%s: Function components do not support contextType.", b), mw[b] = !0);
        }
      }
    }
    var xw = {
      dehydrated: null,
      retryTime: Ae
    };
    function D1(e, t, s) {
      return iv(e, Ih) && (t === null || t.memoizedState !== null);
    }
    function U0(e, t, s) {
      var l = t.mode, d = t.pendingProps;
      MD(t) && (t.effectTag |= Ut);
      var p = va.current, w = !1, b = (t.effectTag & Ut) !== _t;
      if (b || D1(p, e) ? (w = !0, t.effectTag &= ~Ut) : (e === null || e.memoizedState !== null) && d.fallback !== void 0 && d.unstable_avoidThisFallback !== !0 && (p = u1(p, Fy)), p = Ah(p), mu(t, p), e === null)
        if (d.fallback !== void 0 && dw(t), w) {
          var E = d.fallback, N = il(null, l, Ae, null);
          if (N.return = t, (t.mode & Hr) === oi) {
            var k = t.memoizedState, J = k !== null ? t.child.child : t.child;
            N.child = J;
            for (var L = J; L !== null; )
              L.return = N, L = L.sibling;
          }
          var K = il(E, l, s, null);
          return K.return = t, N.sibling = K, t.memoizedState = xw, t.child = N, K;
        } else {
          var me = d.children;
          return t.memoizedState = null, t.child = Uy(t, null, me, s);
        }
      else {
        var we = e.memoizedState;
        if (we !== null) {
          var Ke = e.child, nt = Ke.sibling;
          if (w) {
            var Pt = d.fallback, vt = Au(Ke, Ke.pendingProps);
            if (vt.return = t, (t.mode & Hr) === oi) {
              var Qt = t.memoizedState, F = Qt !== null ? t.child.child : t.child;
              if (F !== Ke.child) {
                vt.child = F;
                for (var te = F; te !== null; )
                  te.return = vt, te = te.sibling;
              }
            }
            if (t.mode & cs) {
              for (var j = 0, ve = vt.child; ve !== null; )
                j += ve.treeBaseDuration, ve = ve.sibling;
              vt.treeBaseDuration = j;
            }
            var pe = Au(nt, Pt);
            return pe.return = t, vt.sibling = pe, vt.childExpirationTime = Ae, t.memoizedState = xw, t.child = vt, pe;
          } else {
            var Ee = d.children, yt = Ke.child, It = sd(t, yt, Ee, s);
            return t.memoizedState = null, t.child = It;
          }
        } else {
          var Ht = e.child;
          if (w) {
            var At = d.fallback, zt = il(
              null,
              l,
              Ae,
              null
            );
            if (zt.return = t, zt.child = Ht, Ht !== null && (Ht.return = zt), (t.mode & Hr) === oi) {
              var Rt = t.memoizedState, cn = Rt !== null ? t.child.child : t.child;
              zt.child = cn;
              for (var An = cn; An !== null; )
                An.return = zt, An = An.sibling;
            }
            if (t.mode & cs) {
              for (var Rn = 0, bi = zt.child; bi !== null; )
                Rn += bi.treeBaseDuration, bi = bi.sibling;
              zt.treeBaseDuration = Rn;
            }
            var tn = il(At, l, s, null);
            return tn.return = t, zt.sibling = tn, tn.effectTag |= Cn, zt.childExpirationTime = Ae, t.memoizedState = xw, t.child = zt, tn;
          } else {
            t.memoizedState = null;
            var Bi = d.children;
            return t.child = sd(t, Ht, Bi, s);
          }
        }
      }
    }
    function V0(e, t) {
      e.expirationTime < t && (e.expirationTime = t);
      var s = e.alternate;
      s !== null && s.expirationTime < t && (s.expirationTime = t), Jx(e.return, t);
    }
    function N1(e, t, s) {
      for (var l = t; l !== null; ) {
        if (l.tag === ee) {
          var d = l.memoizedState;
          d !== null && V0(l, s);
        } else if (l.tag === dt)
          V0(l, s);
        else if (l.child !== null) {
          l.child.return = l, l = l.child;
          continue;
        }
        if (l === e)
          return;
        for (; l.sibling === null; ) {
          if (l.return === null || l.return === e)
            return;
          l = l.return;
        }
        l.sibling.return = l.return, l = l.sibling;
      }
    }
    function k1(e) {
      for (var t = e, s = null; t !== null; ) {
        var l = t.alternate;
        l !== null && rv(l) === null && (s = t), t = t.sibling;
      }
      return s;
    }
    function _1(e) {
      if (e !== void 0 && e !== "forwards" && e !== "backwards" && e !== "together" && !yw[e])
        if (yw[e] = !0, typeof e == "string")
          switch (e.toLowerCase()) {
            case "together":
            case "forwards":
            case "backwards": {
              g('"%s" is not a valid value for revealOrder on <SuspenseList />. Use lowercase "%s" instead.', e, e.toLowerCase());
              break;
            }
            case "forward":
            case "backward": {
              g('"%s" is not a valid value for revealOrder on <SuspenseList />. React uses the -s suffix in the spelling. Use "%ss" instead.', e, e.toLowerCase());
              break;
            }
            default:
              g('"%s" is not a supported revealOrder on <SuspenseList />. Did you mean "together", "forwards" or "backwards"?', e);
              break;
          }
        else
          g('%s is not a supported value for revealOrder on <SuspenseList />. Did you mean "together", "forwards" or "backwards"?', e);
    }
    function P1(e, t) {
      e !== void 0 && !Sv[e] && (e !== "collapsed" && e !== "hidden" ? (Sv[e] = !0, g('"%s" is not a supported value for tail on <SuspenseList />. Did you mean "collapsed" or "hidden"?', e)) : t !== "forwards" && t !== "backwards" && (Sv[e] = !0, g('<SuspenseList tail="%s" /> is only valid if revealOrder is "forwards" or "backwards". Did you mean to specify revealOrder="forwards"?', e)));
    }
    function H0(e, t) {
      {
        var s = Array.isArray(e), l = !s && typeof Dr(e) == "function";
        if (s || l) {
          var d = s ? "array" : "iterable";
          return g("A nested %s was passed to row #%s in <SuspenseList />. Wrap it in an additional SuspenseList to configure its revealOrder: <SuspenseList revealOrder=...> ... <SuspenseList revealOrder=...>{%s}</SuspenseList> ... </SuspenseList>", d, t, d), !1;
        }
      }
      return !0;
    }
    function z1(e, t) {
      if ((t === "forwards" || t === "backwards") && e !== void 0 && e !== null && e !== !1)
        if (Array.isArray(e)) {
          for (var s = 0; s < e.length; s++)
            if (!H0(e[s], s))
              return;
        } else {
          var l = Dr(e);
          if (typeof l == "function") {
            var d = l.call(e);
            if (d)
              for (var p = d.next(), w = 0; !p.done; p = d.next()) {
                if (!H0(p.value, w))
                  return;
                w++;
              }
          } else
            g('A single row was passed to a <SuspenseList revealOrder="%s" />. This is not useful since it needs multiple rows. Did you mean to pass multiple children or an array?', t);
        }
    }
    function Cw(e, t, s, l, d, p) {
      var w = e.memoizedState;
      w === null ? e.memoizedState = {
        isBackwards: t,
        rendering: null,
        renderingStartTime: 0,
        last: l,
        tail: s,
        tailExpiration: 0,
        tailMode: d,
        lastEffect: p
      } : (w.isBackwards = t, w.rendering = null, w.renderingStartTime = 0, w.last = l, w.tail = s, w.tailExpiration = 0, w.tailMode = d, w.lastEffect = p);
    }
    function W0(e, t, s) {
      var l = t.pendingProps, d = l.revealOrder, p = l.tail, w = l.children;
      _1(d), P1(p, d), z1(w, d), yr(e, t, w, s);
      var b = va.current, E = iv(b, Ih);
      if (E)
        b = $y(b, Ih), t.effectTag |= Ut;
      else {
        var N = e !== null && (e.effectTag & Ut) !== _t;
        N && N1(t, t.child, s), b = Ah(b);
      }
      if (mu(t, b), (t.mode & Hr) === oi)
        t.memoizedState = null;
      else
        switch (d) {
          case "forwards": {
            var k = k1(t.child), J;
            k === null ? (J = t.child, t.child = null) : (J = k.sibling, k.sibling = null), Cw(
              t,
              !1,
              J,
              k,
              p,
              t.lastEffect
            );
            break;
          }
          case "backwards": {
            var L = null, K = t.child;
            for (t.child = null; K !== null; ) {
              var me = K.alternate;
              if (me !== null && rv(me) === null) {
                t.child = K;
                break;
              }
              var we = K.sibling;
              K.sibling = L, L = K, K = we;
            }
            Cw(
              t,
              !0,
              L,
              null,
              p,
              t.lastEffect
            );
            break;
          }
          case "together": {
            Cw(
              t,
              !1,
              null,
              null,
              void 0,
              t.lastEffect
            );
            break;
          }
          default:
            t.memoizedState = null;
        }
      return t.child;
    }
    function O1(e, t, s) {
      Vy(t, t.stateNode.containerInfo);
      var l = t.pendingProps;
      return e === null ? t.child = sd(t, null, l, s) : yr(e, t, l, s), t.child;
    }
    function L1(e, t, s) {
      var l = t.type, d = l._context, p = t.pendingProps, w = t.memoizedProps, b = p.value;
      {
        var E = t.type.propTypes;
        E && c(E, p, "prop", "Context.Provider", ft);
      }
      if (Xx(t, b), w !== null) {
        var N = w.value, k = XA(d, b, N);
        if (k === 0) {
          if (w.children === p.children && !Pm())
            return fo(e, t, s);
        } else
          JA(t, d, k, s);
      }
      var J = p.children;
      return yr(e, t, J, s), t.child;
    }
    var F0 = !1;
    function B1(e, t, s) {
      var l = t.type;
      l._context === void 0 ? l !== l.Consumer && (F0 || (F0 = !0, g("Rendering <Context> directly is not supported and will be removed in a future major release. Did you mean to render <Context.Consumer> instead?"))) : l = l._context;
      var d = t.pendingProps, p = d.children;
      typeof p != "function" && g("A context consumer was rendered with multiple children, or a child that isn't a function. A context consumer expects a single child that is a function. If you did pass a function, make sure there is no trailing or leading whitespace around it."), ad(t, s);
      var w = Bn(l, d.unstable_observedBits), b;
      return kh.current = t, Nr(!0), b = p(w), Nr(!1), t.effectTag |= lr, yr(e, t, b, s), t.child;
    }
    function Tw() {
      el = !0;
    }
    function fo(e, t, s) {
      hx(t), e !== null && (t.dependencies = e.dependencies), R0();
      var l = t.expirationTime;
      l !== Ae && Ov(l);
      var d = t.childExpirationTime;
      return d < s ? null : (s1(e, t), t.child);
    }
    function j1(e, t, s) {
      {
        var l = t.return;
        if (l === null)
          throw new Error("Cannot swap the root fiber.");
        if (e.alternate = null, t.alternate = null, s.index = t.index, s.sibling = t.sibling, s.return = t.return, s.ref = t.ref, t === l.child)
          l.child = s;
        else {
          var d = l.child;
          if (d === null)
            throw new Error("Expected parent to have a child.");
          for (; d.sibling !== t; )
            if (d = d.sibling, d === null)
              throw new Error("Expected to find the previous sibling.");
          d.sibling = s;
        }
        var p = l.lastEffect;
        return p !== null ? (p.nextEffect = e, l.lastEffect = e) : l.firstEffect = l.lastEffect = e, e.nextEffect = null, e.effectTag = Us, s.effectTag |= Cn, s;
      }
    }
    function $0(e, t, s) {
      var l = t.expirationTime;
      if (t._debugNeedsRemount && e !== null)
        return j1(e, t, Jw(t.type, t.key, t.pendingProps, t._debugOwner || null, t.mode, t.expirationTime));
      if (e !== null) {
        var d = e.memoizedProps, p = t.pendingProps;
        if (d !== p || Pm() || t.type !== e.type)
          el = !0;
        else if (l < s) {
          switch (el = !1, t.tag) {
            case Se:
              j0(t), fw();
              break;
            case Re:
              if (h0(t), t.mode & td && s !== ds && R(t.type, p))
                return $w(ds), t.expirationTime = t.childExpirationTime = ds, null;
              break;
            case ce: {
              var w = t.type;
              ls(w) && Om(t);
              break;
            }
            case Ve:
              Vy(t, t.stateNode.containerInfo);
              break;
            case re: {
              var b = t.memoizedProps.value;
              Xx(t, b);
              break;
            }
            case B:
              {
                var E = t.childExpirationTime >= s;
                E && (t.effectTag |= xt);
              }
              break;
            case ee: {
              var N = t.memoizedState;
              if (N !== null) {
                var k = t.child, J = k.childExpirationTime;
                if (J !== Ae && J >= s)
                  return U0(e, t, s);
                mu(t, Ah(va.current));
                var L = fo(e, t, s);
                return L !== null ? L.sibling : null;
              } else
                mu(t, Ah(va.current));
              break;
            }
            case dt: {
              var K = (e.effectTag & Ut) !== _t, me = t.childExpirationTime >= s;
              if (K) {
                if (me)
                  return W0(e, t, s);
                t.effectTag |= Ut;
              }
              var we = t.memoizedState;
              if (we !== null && (we.rendering = null, we.tail = null), mu(t, va.current), me)
                break;
              return null;
            }
          }
          return fo(e, t, s);
        } else
          el = !1;
      } else
        el = !1;
      switch (t.expirationTime = Ae, t.tag) {
        case Qe:
          return R1(e, t, t.type, s);
        case it: {
          var Ke = t.elementType;
          return I1(e, t, Ke, l, s);
        }
        case Oe: {
          var nt = t.type, Pt = t.pendingProps, vt = t.elementType === nt ? Pt : ma(nt, Pt);
          return ww(e, t, nt, vt, s);
        }
        case ce: {
          var Qt = t.type, F = t.pendingProps, te = t.elementType === Qt ? F : ma(Qt, F);
          return B0(e, t, Qt, te, s);
        }
        case Se:
          return T1(e, t, s);
        case Re:
          return M1(e, t, s);
        case $e:
          return E1(e, t);
        case ee:
          return U0(e, t, s);
        case Ve:
          return O1(e, t, s);
        case D: {
          var j = t.type, ve = t.pendingProps, pe = t.elementType === j ? ve : ma(j, ve);
          return P0(e, t, j, pe, s);
        }
        case Tt:
          return S1(e, t, s);
        case Bt:
          return x1(e, t, s);
        case B:
          return C1(e, t, s);
        case re:
          return L1(e, t, s);
        case Ge:
          return B1(e, t, s);
        case Ce: {
          var Ee = t.type, yt = t.pendingProps, It = ma(Ee, yt);
          if (t.type !== t.elementType) {
            var Ht = Ee.propTypes;
            Ht && c(
              Ht,
              It,
              "prop",
              Te(Ee),
              ft
            );
          }
          return It = ma(Ee.type, It), z0(e, t, Ee, It, l, s);
        }
        case ge:
          return O0(e, t, t.type, t.pendingProps, l, s);
        case Xe: {
          var At = t.type, zt = t.pendingProps, Rt = t.elementType === At ? zt : ma(At, zt);
          return A1(e, t, At, Rt, s);
        }
        case dt:
          return W0(e, t, s);
      }
      throw Error("Unknown unit of work tag (" + t.tag + "). This error is likely caused by a bug in React. Please file an issue.");
    }
    function vd(e) {
      e.effectTag |= xt;
    }
    function Q0(e) {
      e.effectTag |= pi;
    }
    var Z0, Mw, Y0, G0;
    Z0 = function(e, t, s, l) {
      for (var d = t.child; d !== null; ) {
        if (d.tag === Re || d.tag === $e)
          f(e, d.stateNode);
        else if (d.tag !== Ve) {
          if (d.child !== null) {
            d.child.return = d, d = d.child;
            continue;
          }
        }
        if (d === t)
          return;
        for (; d.sibling === null; ) {
          if (d.return === null || d.return === t)
            return;
          d = d.return;
        }
        d.sibling.return = d.return, d = d.sibling;
      }
    }, Mw = function(e) {
    }, Y0 = function(e, t, s, l, d) {
      var p = e.memoizedProps;
      if (p !== l) {
        var w = t.stateNode, b = Hy(), E = S(w, s, p, l, d, b);
        t.updateQueue = E, E && vd(t);
      }
    }, G0 = function(e, t, s, l) {
      s !== l && vd(t);
    };
    function xv(e, t) {
      switch (e.tailMode) {
        case "hidden": {
          for (var s = e.tail, l = null; s !== null; )
            s.alternate !== null && (l = s), s = s.sibling;
          l === null ? e.tail = null : l.sibling = null;
          break;
        }
        case "collapsed": {
          for (var d = e.tail, p = null; d !== null; )
            d.alternate !== null && (p = d), d = d.sibling;
          p === null ? !t && e.tail !== null ? e.tail.sibling = null : e.tail = null : p.sibling = null;
          break;
        }
      }
    }
    function X0(e, t, s) {
      var l = t.pendingProps;
      switch (t.tag) {
        case Qe:
        case it:
        case ge:
        case Oe:
        case D:
        case Tt:
        case Bt:
        case B:
        case Ge:
        case Ce:
          return null;
        case ce: {
          var d = t.type;
          return ls(d) && zm(t), null;
        }
        case Se: {
          od(t), ay(t);
          var p = t.stateNode;
          if (p.pendingContext && (p.context = p.pendingContext, p.pendingContext = null), e === null || e.child === null) {
            var w = bv(t);
            w && vd(t);
          }
          return Mw(t), null;
        }
        case Re: {
          Wy(t);
          var b = f0(), E = t.type;
          if (e !== null && t.stateNode != null)
            Y0(e, t, E, l, b), e.ref !== t.ref && Q0(t);
          else {
            if (!l) {
              if (t.stateNode === null)
                throw Error("We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue.");
              return null;
            }
            var N = Hy(), k = bv(t);
            if (k)
              g1(t, b, N) && vd(t);
            else {
              var J = u(E, l, b, N, t);
              Z0(J, t, !1, !1), t.stateNode = J, v(J, E, l, b) && vd(t);
            }
            t.ref !== null && Q0(t);
          }
          return null;
        }
        case $e: {
          var L = l;
          if (e && t.stateNode != null) {
            var K = e.memoizedProps;
            G0(e, t, K, L);
          } else {
            if (typeof L != "string" && t.stateNode === null)
              throw Error("We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue.");
            var me = f0(), we = Hy(), Ke = bv(t);
            Ke ? y1(t) && vd(t) : t.stateNode = W(L, me, we, t);
          }
          return null;
        }
        case ee: {
          ld(t);
          var nt = t.memoizedState;
          if ((t.effectTag & Ut) !== _t)
            return t.expirationTime = s, t;
          var Pt = nt !== null, vt = !1;
          if (e === null)
            t.memoizedProps.fallback !== void 0 && bv(t);
          else {
            var Qt = e.memoizedState;
            if (vt = Qt !== null, !Pt && Qt !== null) {
              var F = e.child.sibling;
              if (F !== null) {
                var te = t.firstEffect;
                te !== null ? (t.firstEffect = F, F.nextEffect = te) : (t.firstEffect = t.lastEffect = F, F.nextEffect = null), F.effectTag = Us;
              }
            }
          }
          if (Pt && !vt && (t.mode & Hr) !== oi) {
            var j = e === null && t.memoizedProps.unstable_avoidThisFallback !== !0;
            j || iv(va.current, Fy) ? xR() : CR();
          }
          return (Pt || vt) && (t.effectTag |= xt), null;
        }
        case Ve:
          return od(t), Mw(t), null;
        case re:
          return wy(t), null;
        case Xe: {
          var ve = t.type;
          return ls(ve) && zm(t), null;
        }
        case dt: {
          ld(t);
          var pe = t.memoizedState;
          if (pe === null)
            return null;
          var Ee = (t.effectTag & Ut) !== _t, yt = pe.rendering;
          if (yt === null)
            if (Ee)
              xv(pe, !1);
            else {
              var It = MR() && (e === null || (e.effectTag & Ut) === _t);
              if (!It)
                for (var Ht = t.child; Ht !== null; ) {
                  var At = rv(Ht);
                  if (At !== null) {
                    Ee = !0, t.effectTag |= Ut, xv(pe, !1);
                    var zt = At.updateQueue;
                    return zt !== null && (t.updateQueue = zt, t.effectTag |= xt), pe.lastEffect === null && (t.firstEffect = null), t.lastEffect = pe.lastEffect, o1(t, s), mu(t, $y(va.current, Ih)), t.child;
                  }
                  Ht = Ht.sibling;
                }
            }
          else {
            if (!Ee) {
              var Rt = rv(yt);
              if (Rt !== null) {
                t.effectTag |= Ut, Ee = !0;
                var cn = Rt.updateQueue;
                if (cn !== null && (t.updateQueue = cn, t.effectTag |= xt), xv(pe, !0), pe.tail === null && pe.tailMode === "hidden" && !yt.alternate) {
                  var An = t.lastEffect = pe.lastEffect;
                  return An !== null && (An.nextEffect = null), null;
                }
              } else if (vr() * 2 - pe.renderingStartTime > pe.tailExpiration && s > ds) {
                t.effectTag |= Ut, Ee = !0, xv(pe, !1);
                var Rn = s - 1;
                t.expirationTime = t.childExpirationTime = Rn, $w(Rn);
              }
            }
            if (pe.isBackwards)
              yt.sibling = t.child, t.child = yt;
            else {
              var bi = pe.last;
              bi !== null ? bi.sibling = yt : t.child = yt, pe.last = yt;
            }
          }
          if (pe.tail !== null) {
            if (pe.tailExpiration === 0) {
              var tn = 500;
              pe.tailExpiration = vr() + tn;
            }
            var Bi = pe.tail;
            pe.rendering = Bi, pe.tail = Bi.sibling, pe.lastEffect = t.lastEffect, pe.renderingStartTime = vr(), Bi.sibling = null;
            var wa = va.current;
            return Ee ? wa = $y(wa, Ih) : wa = Ah(wa), mu(t, wa), Bi;
          }
          return null;
        }
      }
      throw Error("Unknown unit of work tag (" + t.tag + "). This error is likely caused by a bug in React. Please file an issue.");
    }
    function U1(e, t) {
      switch (e.tag) {
        case ce: {
          var s = e.type;
          ls(s) && zm(e);
          var l = e.effectTag;
          return l & mi ? (e.effectTag = l & ~mi | Ut, e) : null;
        }
        case Se: {
          od(e), ay(e);
          var d = e.effectTag;
          if ((d & Ut) !== _t)
            throw Error("The root failed to unmount after an error. This is likely a bug in React. Please file an issue.");
          return e.effectTag = d & ~mi | Ut, e;
        }
        case Re:
          return Wy(e), null;
        case ee: {
          ld(e);
          var p = e.effectTag;
          return p & mi ? (e.effectTag = p & ~mi | Ut, e) : null;
        }
        case dt:
          return ld(e), null;
        case Ve:
          return od(e), null;
        case re:
          return wy(e), null;
        default:
          return null;
      }
    }
    function J0(e) {
      switch (e.tag) {
        case ce: {
          var t = e.type.childContextTypes;
          t != null && zm(e);
          break;
        }
        case Se: {
          od(e), ay(e);
          break;
        }
        case Re: {
          Wy(e);
          break;
        }
        case Ve:
          od(e);
          break;
        case ee:
          ld(e);
          break;
        case dt:
          ld(e);
          break;
        case re:
          wy(e);
          break;
      }
    }
    function Ew(e, t) {
      return {
        value: e,
        source: t,
        stack: $n(t)
      };
    }
    function V1(e) {
      var t = e.error;
      {
        var s = e.componentName, l = e.componentStack, d = e.errorBoundaryName, p = e.errorBoundaryFound, w = e.willRetry;
        if (t != null && t._suppressLogging) {
          if (p && w)
            return;
          console.error(t);
        }
        var b = s ? "The above error occurred in the <" + s + "> component:" : "The above error occurred in one of your React components:", E;
        p && d ? w ? E = "React will try to recreate this component tree from scratch " + ("using the error boundary you provided, " + d + ".") : E = "This error was initially handled by the error boundary " + d + `.
Recreating the tree from scratch failed so React will unmount the tree.` : E = `Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://fb.me/react-error-boundaries to learn more about error boundaries.`;
        var N = "" + b + l + `

` + ("" + E);
        console.error(N);
      }
    }
    var q0 = null;
    q0 = /* @__PURE__ */ new Set();
    var H1 = typeof WeakSet == "function" ? WeakSet : Set;
    function Iw(e, t) {
      var s = t.source, l = t.stack;
      l === null && s !== null && (l = $n(s));
      var d = {
        componentName: s !== null ? Te(s.type) : null,
        componentStack: l !== null ? l : "",
        error: t.value,
        errorBoundary: null,
        errorBoundaryName: null,
        errorBoundaryFound: !1,
        willRetry: !1
      };
      e !== null && e.tag === ce && (d.errorBoundary = e.stateNode, d.errorBoundaryName = Te(e.type), d.errorBoundaryFound = !0, d.willRetry = !0);
      try {
        V1(d);
      } catch (p) {
        setTimeout(function() {
          throw p;
        });
      }
    }
    var W1 = function(e, t) {
      as(e, "componentWillUnmount"), t.props = e.memoizedProps, t.state = e.memoizedState, t.componentWillUnmount(), ss();
    };
    function F1(e, t) {
      if (se(null, W1, null, e, t), oe()) {
        var s = Ne();
        Eu(e, s);
      }
    }
    function K0(e) {
      var t = e.ref;
      if (t !== null)
        if (typeof t == "function") {
          if (se(null, t, null, null), oe()) {
            var s = Ne();
            Eu(e, s);
          }
        } else
          t.current = null;
    }
    function $1(e, t) {
      if (se(null, t, null), oe()) {
        var s = Ne();
        Eu(e, s);
      }
    }
    function Q1(e, t) {
      switch (t.tag) {
        case Oe:
        case D:
        case ge:
        case Mt:
          return;
        case ce: {
          if (t.effectTag & Ua && e !== null) {
            var s = e.memoizedProps, l = e.memoizedState;
            as(t, "getSnapshotBeforeUpdate");
            var d = t.stateNode;
            t.type === t.elementType && !wu && (d.props !== t.memoizedProps && g("Expected %s props to match memoized props before getSnapshotBeforeUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(t.type) || "instance"), d.state !== t.memoizedState && g("Expected %s state to match memoized state before getSnapshotBeforeUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(t.type) || "instance"));
            var p = d.getSnapshotBeforeUpdate(t.elementType === t.type ? s : ma(t.type, s), l);
            {
              var w = q0;
              p === void 0 && !w.has(t.type) && (w.add(t.type), g("%s.getSnapshotBeforeUpdate(): A snapshot value (or null) must be returned. You have returned undefined.", Te(t.type)));
            }
            d.__reactInternalSnapshotBeforeUpdate = p, ss();
          }
          return;
        }
        case Se:
        case Re:
        case $e:
        case Ve:
        case Xe:
          return;
      }
      throw Error("This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue.");
    }
    function eC(e, t) {
      var s = t.updateQueue, l = s !== null ? s.lastEffect : null;
      if (l !== null) {
        var d = l.next, p = d;
        do {
          if ((p.tag & e) === e) {
            var w = p.destroy;
            p.destroy = void 0, w !== void 0 && w();
          }
          p = p.next;
        } while (p !== d);
      }
    }
    function tC(e, t) {
      var s = t.updateQueue, l = s !== null ? s.lastEffect : null;
      if (l !== null) {
        var d = l.next, p = d;
        do {
          if ((p.tag & e) === e) {
            var w = p.create;
            p.destroy = w();
            {
              var b = p.destroy;
              if (b !== void 0 && typeof b != "function") {
                var E = void 0;
                b === null ? E = " You returned null. If your effect does not require clean up, return undefined (or nothing)." : typeof b.then == "function" ? E = `

It looks like you wrote useEffect(async () => ...) or returned a Promise. Instead, write the async function inside your effect and call it immediately:

useEffect(() => {
  async function fetchData() {
    // You can await here
    const response = await MyAPI.getData(someId);
    // ...
  }
  fetchData();
}, [someId]); // Or [] if effect doesn't need props or state

Learn more about data fetching with Hooks: https://fb.me/react-hooks-data-fetching` : E = " You returned: " + b, g("An effect function must not return anything besides a function, which is used for clean-up.%s%s", E, $n(t));
              }
            }
          }
          p = p.next;
        } while (p !== d);
      }
    }
    function Z1(e) {
      if ((e.effectTag & Va) !== _t)
        switch (e.tag) {
          case Oe:
          case D:
          case ge:
          case Mt: {
            eC(av | ud, e), tC(av | ud, e);
            break;
          }
        }
    }
    function Y1(e, t, s, l) {
      switch (s.tag) {
        case Oe:
        case D:
        case ge:
        case Mt: {
          tC(cd | ud, s);
          return;
        }
        case ce: {
          var d = s.stateNode;
          if (s.effectTag & xt)
            if (t === null)
              as(s, "componentDidMount"), s.type === s.elementType && !wu && (d.props !== s.memoizedProps && g("Expected %s props to match memoized props before componentDidMount. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(s.type) || "instance"), d.state !== s.memoizedState && g("Expected %s state to match memoized state before componentDidMount. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(s.type) || "instance")), d.componentDidMount(), ss();
            else {
              var p = s.elementType === s.type ? t.memoizedProps : ma(s.type, t.memoizedProps), w = t.memoizedState;
              as(s, "componentDidUpdate"), s.type === s.elementType && !wu && (d.props !== s.memoizedProps && g("Expected %s props to match memoized props before componentDidUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(s.type) || "instance"), d.state !== s.memoizedState && g("Expected %s state to match memoized state before componentDidUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(s.type) || "instance")), d.componentDidUpdate(p, w, d.__reactInternalSnapshotBeforeUpdate), ss();
            }
          var b = s.updateQueue;
          b !== null && (s.type === s.elementType && !wu && (d.props !== s.memoizedProps && g("Expected %s props to match memoized props before processing the update queue. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(s.type) || "instance"), d.state !== s.memoizedState && g("Expected %s state to match memoized state before processing the update queue. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(s.type) || "instance")), n0(s, b, d));
          return;
        }
        case Se: {
          var E = s.updateQueue;
          if (E !== null) {
            var N = null;
            if (s.child !== null)
              switch (s.child.tag) {
                case Re:
                  N = s.child.stateNode;
                  break;
                case ce:
                  N = s.child.stateNode;
                  break;
              }
            n0(s, E, N);
          }
          return;
        }
        case Re: {
          var k = s.stateNode;
          if (t === null && s.effectTag & xt) {
            var J = s.type, L = s.memoizedProps;
            mt(k, J, L);
          }
          return;
        }
        case $e:
          return;
        case Ve:
          return;
        case B: {
          {
            var K = s.memoizedProps.onRender;
            typeof K == "function" && K(s.memoizedProps.id, t === null ? "mount" : "update", s.actualDuration, s.treeBaseDuration, s.actualStartTime, m1(), e.memoizedInteractions);
          }
          return;
        }
        case ee: {
          iR(e, s);
          return;
        }
        case dt:
        case Xe:
        case gt:
        case Zt:
          return;
      }
      throw Error("This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue.");
    }
    function G1(e, t) {
      for (var s = e; ; ) {
        if (s.tag === Re) {
          var l = s.stateNode;
          t ? qe(l) : un(s.stateNode, s.memoizedProps);
        } else if (s.tag === $e) {
          var d = s.stateNode;
          t ? bt(d) : lt(d, s.memoizedProps);
        } else if (s.tag === ee && s.memoizedState !== null && s.memoizedState.dehydrated === null) {
          var p = s.child.sibling;
          p.return = s, s = p;
          continue;
        } else if (s.child !== null) {
          s.child.return = s, s = s.child;
          continue;
        }
        if (s === e)
          return;
        for (; s.sibling === null; ) {
          if (s.return === null || s.return === e)
            return;
          s = s.return;
        }
        s.sibling.return = s.return, s = s.sibling;
      }
    }
    function X1(e) {
      var t = e.ref;
      if (t !== null) {
        var s = e.stateNode, l;
        switch (e.tag) {
          case Re:
            l = s;
            break;
          default:
            l = s;
        }
        typeof t == "function" ? t(l) : (t.hasOwnProperty("current") || g("Unexpected ref object provided for %s. Use either a ref-setter function or React.createRef().%s", Te(e.type), $n(e)), t.current = l);
      }
    }
    function J1(e) {
      var t = e.ref;
      t !== null && (typeof t == "function" ? t(null) : t.current = null);
    }
    function nC(e, t, s) {
      switch (iD(t), t.tag) {
        case Oe:
        case D:
        case Ce:
        case ge:
        case Mt: {
          var l = t.updateQueue;
          if (l !== null) {
            var d = l.lastEffect;
            if (d !== null) {
              var p = d.next;
              {
                var w = s > ha ? ha : s;
                co(w, function() {
                  var E = p;
                  do {
                    var N = E.destroy;
                    N !== void 0 && $1(t, N), E = E.next;
                  } while (E !== p);
                });
              }
            }
          }
          return;
        }
        case ce: {
          K0(t);
          var b = t.stateNode;
          typeof b.componentWillUnmount == "function" && F1(t, b);
          return;
        }
        case Re: {
          K0(t);
          return;
        }
        case Ve: {
          sC(e, t, s);
          return;
        }
        case gt:
          return;
        case Be:
          return;
        case Zt:
          return;
      }
    }
    function q1(e, t, s) {
      for (var l = t; ; ) {
        if (nC(e, l, s), l.child !== null && l.tag !== Ve) {
          l.child.return = l, l = l.child;
          continue;
        }
        if (l === t)
          return;
        for (; l.sibling === null; ) {
          if (l.return === null || l.return === t)
            return;
          l = l.return;
        }
        l.sibling.return = l.return, l = l.sibling;
      }
    }
    function iC(e) {
      var t = e.alternate;
      e.return = null, e.child = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.alternate = null, e.firstEffect = null, e.lastEffect = null, e.pendingProps = null, e.memoizedProps = null, e.stateNode = null, t !== null && iC(t);
    }
    function K1(e) {
      for (var t = e.return; t !== null; ) {
        if (rC(t))
          return t;
        t = t.return;
      }
      throw Error("Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue.");
    }
    function rC(e) {
      return e.tag === Re || e.tag === Se || e.tag === Ve;
    }
    function eR(e) {
      var t = e;
      e:
        for (; ; ) {
          for (; t.sibling === null; ) {
            if (t.return === null || rC(t.return))
              return null;
            t = t.return;
          }
          for (t.sibling.return = t.return, t = t.sibling; t.tag !== Re && t.tag !== $e && t.tag !== Be; ) {
            if (t.effectTag & Cn || t.child === null || t.tag === Ve)
              continue e;
            t.child.return = t, t = t.child;
          }
          if (!(t.effectTag & Cn))
            return t.stateNode;
        }
    }
    function aC(e) {
      var t = K1(e), s, l, d = t.stateNode;
      switch (t.tag) {
        case Re:
          s = d, l = !1;
          break;
        case Se:
          s = d.containerInfo, l = !0;
          break;
        case Ve:
          s = d.containerInfo, l = !0;
          break;
        case gt:
        default:
          throw Error("Invalid host parent fiber. This error is likely caused by a bug in React. Please file an issue.");
      }
      t.effectTag & Ri && (Pi(s), t.effectTag &= ~Ri);
      var p = eR(e);
      l ? Aw(e, p, s) : Rw(e, p, s);
    }
    function Aw(e, t, s) {
      var l = e.tag, d = l === Re || l === $e;
      if (d || vn) {
        var p = d ? e.stateNode : e.stateNode.instance;
        t ? le(s, p, t) : P(s, p);
      } else if (l !== Ve) {
        var w = e.child;
        if (w !== null) {
          Aw(w, t, s);
          for (var b = w.sibling; b !== null; )
            Aw(b, t, s), b = b.sibling;
        }
      }
    }
    function Rw(e, t, s) {
      var l = e.tag, d = l === Re || l === $e;
      if (d || vn) {
        var p = d ? e.stateNode : e.stateNode.instance;
        t ? Q(s, p, t) : O(s, p);
      } else if (l !== Ve) {
        var w = e.child;
        if (w !== null) {
          Rw(w, t, s);
          for (var b = w.sibling; b !== null; )
            Rw(b, t, s), b = b.sibling;
        }
      }
    }
    function sC(e, t, s) {
      for (var l = t, d = !1, p, w; ; ) {
        if (!d) {
          var b = l.return;
          e:
            for (; ; ) {
              if (b === null)
                throw Error("Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue.");
              var E = b.stateNode;
              switch (b.tag) {
                case Re:
                  p = E, w = !1;
                  break e;
                case Se:
                  p = E.containerInfo, w = !0;
                  break e;
                case Ve:
                  p = E.containerInfo, w = !0;
                  break e;
              }
              b = b.return;
            }
          d = !0;
        }
        if (l.tag === Re || l.tag === $e)
          q1(e, l, s), w ? _e(p, l.stateNode) : ye(p, l.stateNode);
        else if (l.tag === Ve) {
          if (l.child !== null) {
            p = l.stateNode.containerInfo, w = !0, l.child.return = l, l = l.child;
            continue;
          }
        } else if (nC(e, l, s), l.child !== null) {
          l.child.return = l, l = l.child;
          continue;
        }
        if (l === t)
          return;
        for (; l.sibling === null; ) {
          if (l.return === null || l.return === t)
            return;
          l = l.return, l.tag === Ve && (d = !1);
        }
        l.sibling.return = l.return, l = l.sibling;
      }
    }
    function tR(e, t, s) {
      sC(e, t, s), iC(t);
    }
    function Dw(e, t) {
      switch (t.tag) {
        case Oe:
        case D:
        case Ce:
        case ge:
        case Mt: {
          eC(cd | ud, t);
          return;
        }
        case ce:
          return;
        case Re: {
          var s = t.stateNode;
          if (s != null) {
            var l = t.memoizedProps, d = e !== null ? e.memoizedProps : l, p = t.type, w = t.updateQueue;
            t.updateQueue = null, w !== null && Et(s, w, p, d, l);
          }
          return;
        }
        case $e: {
          if (t.stateNode === null)
            throw Error("This should have a text node initialized. This error is likely caused by a bug in React. Please file an issue.");
          var b = t.stateNode, E = t.memoizedProps, N = e !== null ? e.memoizedProps : E;
          Fn(b, N, E);
          return;
        }
        case Se: {
          {
            var k = t.stateNode;
            k.hydrate && (k.hydrate = !1, qE(k.containerInfo));
          }
          return;
        }
        case B:
          return;
        case ee: {
          nR(t), oC(t);
          return;
        }
        case dt: {
          oC(t);
          return;
        }
        case Xe:
          return;
      }
      throw Error("This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue.");
    }
    function nR(e) {
      var t = e.memoizedState, s, l = e;
      t === null ? s = !1 : (s = !0, l = e.child, SR()), l !== null && G1(l, s);
    }
    function iR(e, t) {
      var s = t.memoizedState;
      if (s === null) {
        var l = t.alternate;
        if (l !== null) {
          var d = l.memoizedState;
          if (d !== null) {
            var p = d.dehydrated;
            p !== null && KE(p);
          }
        }
      }
    }
    function oC(e) {
      var t = e.updateQueue;
      if (t !== null) {
        e.updateQueue = null;
        var s = e.stateNode;
        s === null && (s = e.stateNode = new H1()), t.forEach(function(l) {
          var d = VR.bind(null, e, l);
          s.has(l) || (l.__reactDoNotTraceInteractions !== !0 && (d = h.unstable_wrap(d)), s.add(l), l.then(d, d));
        });
      }
    }
    function rR(e) {
      Pi(e.stateNode);
    }
    var aR = typeof WeakMap == "function" ? WeakMap : Map;
    function lC(e, t, s) {
      var l = Go(s, null);
      l.tag = by, l.payload = {
        element: null
      };
      var d = t.value;
      return l.callback = function() {
        BR(d), Iw(e, t);
      }, l;
    }
    function uC(e, t, s) {
      var l = Go(s, null);
      l.tag = by;
      var d = e.type.getDerivedStateFromError;
      if (typeof d == "function") {
        var p = t.value;
        l.payload = function() {
          return Iw(e, t), d(p);
        };
      }
      var w = e.stateNode;
      return w !== null && typeof w.componentDidCatch == "function" ? l.callback = function() {
        Zx(e), typeof d != "function" && (OR(this), Iw(e, t));
        var E = t.value, N = t.stack;
        this.componentDidCatch(E, {
          componentStack: N !== null ? N : ""
        }), typeof d != "function" && e.expirationTime !== Ct && g("%s: Error boundaries should implement getDerivedStateFromError(). In that method, return a state update to display an error message or fallback UI.", Te(e.type) || "Unknown");
      } : l.callback = function() {
        Zx(e);
      }, l;
    }
    function sR(e, t, s) {
      var l = e.pingCache, d;
      if (l === null ? (l = e.pingCache = new aR(), d = /* @__PURE__ */ new Set(), l.set(s, d)) : (d = l.get(s), d === void 0 && (d = /* @__PURE__ */ new Set(), l.set(s, d))), !d.has(t)) {
        d.add(t);
        var p = jR.bind(null, e, s, t);
        s.then(p, p);
      }
    }
    function oR(e, t, s, l, d) {
      if (s.effectTag |= Po, s.firstEffect = s.lastEffect = null, l !== null && typeof l == "object" && typeof l.then == "function") {
        var p = l;
        if ((s.mode & Hr) === oi) {
          var w = s.alternate;
          w ? (s.updateQueue = w.updateQueue, s.memoizedState = w.memoizedState, s.expirationTime = w.expirationTime) : (s.updateQueue = null, s.memoizedState = null);
        }
        var b = iv(va.current, Fy), E = t;
        do {
          if (E.tag === ee && c1(E, b)) {
            var N = E.updateQueue;
            if (N === null) {
              var k = /* @__PURE__ */ new Set();
              k.add(p), E.updateQueue = k;
            } else
              N.add(p);
            if ((E.mode & Hr) === oi) {
              if (E.effectTag |= Ut, s.effectTag &= ~(bf | Po), s.tag === ce) {
                var J = s.alternate;
                if (J === null)
                  s.tag = Xe;
                else {
                  var L = Go(Ct, null);
                  L.tag = Qm, Xo(s, L);
                }
              }
              s.expirationTime = Ct;
              return;
            }
            sR(e, d, p), E.effectTag |= mi, E.expirationTime = d;
            return;
          }
          E = E.return;
        } while (E !== null);
        l = new Error((Te(s.type) || "A React component") + ` suspended while rendering, but no fallback UI was specified.

Add a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display.` + $n(s));
      }
      TR(), l = Ew(l, s);
      var K = t;
      do {
        switch (K.tag) {
          case Se: {
            var me = l;
            K.effectTag |= mi, K.expirationTime = d;
            var we = lC(K, me, d);
            e0(K, we);
            return;
          }
          case ce:
            var Ke = l, nt = K.type, Pt = K.stateNode;
            if ((K.effectTag & Ut) === _t && (typeof nt.getDerivedStateFromError == "function" || Pt !== null && typeof Pt.componentDidCatch == "function" && !TC(Pt))) {
              K.effectTag |= mi, K.expirationTime = d;
              var vt = uC(K, Ke, d);
              e0(K, vt);
              return;
            }
            break;
        }
        K = K.return;
      } while (K !== null);
    }
    var lR = Math.ceil, Nw = m.ReactCurrentDispatcher, cC = m.ReactCurrentOwner, kw = m.IsSomeRendererActing, In = 0, Cv = 1, uR = 2, dC = 4, _w = 8, wr = 16, hs = 32, bu = 0, Tv = 1, fC = 2, Mv = 3, Ev = 4, Pw = 5, rt = In, Gi = null, We = null, ui = Ae, Yn = bu, Iv = null, ho = Ct, _h = Ct, Av = null, Ph = Ae, Rv = !1, zw = 0, hC = 500, Ue = null, Dv = !1, Ow = null, gd = null, zh = !1, yd = null, Oh = Kc, Lw = Ae, Su = null, cR = 50, Lh = 0, Bw = null, dR = 50, Nv = 0, Bh = null, xu = null, jh = Ae;
    function ps() {
      return (rt & (wr | hs)) !== In ? cy(vr()) : (jh !== Ae || (jh = cy(vr())), jh);
    }
    function fR() {
      return cy(vr());
    }
    function Cu(e, t, s) {
      var l = t.mode;
      if ((l & Hr) === oi)
        return Ct;
      var d = ed();
      if ((l & td) === oi)
        return d === Li ? Ct : Ux;
      if ((rt & wr) !== In)
        return ui;
      var p;
      if (s !== null)
        p = VA(e, s.timeoutMs | 0 || mh);
      else
        switch (d) {
          case Li:
            p = Ct;
            break;
          case Yo:
            p = Wx(e);
            break;
          case ha:
          case ly:
            p = UA(e);
            break;
          case fh:
            p = du;
            break;
          default:
            throw Error("Expected a valid priority level");
        }
      return Gi !== null && p === ui && (p -= 1), p;
    }
    function hR(e, t) {
      FR(), GR(e);
      var s = kv(e, t);
      if (s === null) {
        ZR(e);
        return;
      }
      QR(e, t), EA();
      var l = ed();
      if (t === Ct ? (rt & _w) !== In && (rt & (wr | hs)) === In ? (nl(s, t), jw(s)) : (br(s), nl(s, t), rt === In && us()) : (br(s), nl(s, t)), (rt & dC) !== In && (l === Yo || l === Li))
        if (Su === null)
          Su = /* @__PURE__ */ new Map([[s, t]]);
        else {
          var d = Su.get(s);
          (d === void 0 || d > t) && Su.set(s, t);
        }
    }
    var Zr = hR;
    function kv(e, t) {
      e.expirationTime < t && (e.expirationTime = t);
      var s = e.alternate;
      s !== null && s.expirationTime < t && (s.expirationTime = t);
      var l = e.return, d = null;
      if (l === null && e.tag === Se)
        d = e.stateNode;
      else
        for (; l !== null; ) {
          if (s = l.alternate, l.childExpirationTime < t && (l.childExpirationTime = t), s !== null && s.childExpirationTime < t && (s.childExpirationTime = t), l.return === null && l.tag === Se) {
            d = l.stateNode;
            break;
          }
          l = l.return;
        }
      return d !== null && (Gi === d && (Ov(t), Yn === Ev && Ru(d, ui)), LC(d, t)), d;
    }
    function _v(e) {
      var t = e.lastExpiredTime;
      if (t !== Ae)
        return t;
      var s = e.firstPendingTime;
      if (!OC(e, s))
        return s;
      var l = e.lastPingedTime, d = e.nextKnownPendingLevel, p = l > d ? l : d;
      return p <= du && s !== p ? Ae : p;
    }
    function br(e) {
      var t = e.lastExpiredTime;
      if (t !== Ae) {
        e.callbackExpirationTime = Ct, e.callbackPriority = Li, e.callbackNode = Lx(jw.bind(null, e));
        return;
      }
      var s = _v(e), l = e.callbackNode;
      if (s === Ae) {
        l !== null && (e.callbackNode = null, e.callbackExpirationTime = Ae, e.callbackPriority = Kc);
        return;
      }
      var d = ps(), p = Fx(d, s);
      if (l !== null) {
        var w = e.callbackPriority, b = e.callbackExpirationTime;
        if (b === s && w >= p)
          return;
        BA(l);
      }
      e.callbackExpirationTime = s, e.callbackPriority = p;
      var E;
      s === Ct ? E = Lx(jw.bind(null, e)) : E = hh(
        p,
        pC.bind(null, e),
        {
          timeout: fu(s) - vr()
        }
      ), e.callbackNode = E;
    }
    function pC(e, t) {
      if (jh = Ae, t) {
        var s = ps();
        return tb(e, s), br(e), null;
      }
      var l = _v(e);
      if (l !== Ae) {
        var d = e.callbackNode;
        if ((rt & (wr | hs)) !== In)
          throw Error("Should not already be working.");
        if (tl(), (e !== Gi || l !== ui) && (Tu(e, l), kC(e, l)), We !== null) {
          var p = rt;
          rt |= wr;
          var w = wC(), b = Pv(e);
          mx(We);
          do
            try {
              RR();
              break;
            } catch (k) {
              yC(e, k);
            }
          while (!0);
          if ($m(), rt = p, bC(w), zv(b), Yn === Tv) {
            var E = Iv;
            throw Vw(), Tu(e, l), Ru(e, l), br(e), E;
          }
          if (We !== null)
            Vw();
          else {
            EC();
            var N = e.finishedWork = e.current.alternate;
            e.finishedExpirationTime = l, pR(e, N, Yn, l);
          }
          if (br(e), e.callbackNode === d)
            return pC.bind(null, e);
        }
      }
      return null;
    }
    function pR(e, t, s, l) {
      switch (Gi = null, s) {
        case bu:
        case Tv:
          throw Error("Root did not complete. This is a bug in React.");
        case fC: {
          tb(e, l > du ? du : l);
          break;
        }
        case Mv: {
          Ru(e, l);
          var d = e.lastSuspendedTime;
          l === d && (e.nextKnownPendingLevel = Uw(t));
          var p = ho === Ct;
          if (p && !Iu.current) {
            var w = zw + hC - vr();
            if (w > 10) {
              if (Rv) {
                var b = e.lastPingedTime;
                if (b === Ae || b >= l) {
                  e.lastPingedTime = l, Tu(e, l);
                  break;
                }
              }
              var E = _v(e);
              if (E !== Ae && E !== l)
                break;
              if (d !== Ae && d !== l) {
                e.lastPingedTime = d;
                break;
              }
              e.timeoutHandle = U(Mu.bind(null, e), w);
              break;
            }
          }
          Mu(e);
          break;
        }
        case Ev: {
          Ru(e, l);
          var N = e.lastSuspendedTime;
          if (l === N && (e.nextKnownPendingLevel = Uw(t)), !Iu.current) {
            if (Rv) {
              var k = e.lastPingedTime;
              if (k === Ae || k >= l) {
                e.lastPingedTime = l, Tu(e, l);
                break;
              }
            }
            var J = _v(e);
            if (J !== Ae && J !== l)
              break;
            if (N !== Ae && N !== l) {
              e.lastPingedTime = N;
              break;
            }
            var L;
            if (_h !== Ct)
              L = fu(_h) - vr();
            else if (ho === Ct)
              L = 0;
            else {
              var K = ER(ho), me = vr(), we = fu(l) - me, Ke = me - K;
              Ke < 0 && (Ke = 0), L = HR(Ke) - Ke, we < L && (L = we);
            }
            if (L > 10) {
              e.timeoutHandle = U(Mu.bind(null, e), L);
              break;
            }
          }
          Mu(e);
          break;
        }
        case Pw: {
          if (!Iu.current && ho !== Ct && Av !== null) {
            var nt = WR(ho, l, Av);
            if (nt > 10) {
              Ru(e, l), e.timeoutHandle = U(Mu.bind(null, e), nt);
              break;
            }
          }
          Mu(e);
          break;
        }
        default:
          throw Error("Unknown root exit status.");
      }
    }
    function jw(e) {
      var t = e.lastExpiredTime, s = t !== Ae ? t : Ct;
      if ((rt & (wr | hs)) !== In)
        throw Error("Should not already be working.");
      if (tl(), (e !== Gi || s !== ui) && (Tu(e, s), kC(e, s)), We !== null) {
        var l = rt;
        rt |= wr;
        var d = wC(), p = Pv(e);
        mx(We);
        do
          try {
            AR();
            break;
          } catch (b) {
            yC(e, b);
          }
        while (!0);
        if ($m(), rt = l, bC(d), zv(p), Yn === Tv) {
          var w = Iv;
          throw Vw(), Tu(e, s), Ru(e, s), br(e), w;
        }
        if (We !== null)
          throw Error("Cannot commit an incomplete root. This error is likely caused by a bug in React. Please file an issue.");
        EC(), e.finishedWork = e.current.alternate, e.finishedExpirationTime = s, mR(e), br(e);
      }
      return null;
    }
    function mR(e) {
      Gi = null, Mu(e);
    }
    function vR() {
      if ((rt & (Cv | wr | hs)) !== In) {
        (rt & wr) !== In && g("unstable_flushDiscreteUpdates: Cannot flush updates when React is already rendering.");
        return;
      }
      yR(), tl();
    }
    function gR(e, t, s, l) {
      return co(Li, e.bind(null, t, s, l));
    }
    function yR() {
      if (Su !== null) {
        var e = Su;
        Su = null, e.forEach(function(t, s) {
          tb(s, t), br(s);
        }), us();
      }
    }
    function mC(e, t) {
      var s = rt;
      rt |= Cv;
      try {
        return e(t);
      } finally {
        rt = s, rt === In && us();
      }
    }
    function wR(e, t) {
      var s = rt;
      rt |= uR;
      try {
        return e(t);
      } finally {
        rt = s, rt === In && us();
      }
    }
    function bR(e, t, s, l, d) {
      var p = rt;
      rt |= dC;
      try {
        return co(Yo, e.bind(null, t, s, l, d));
      } finally {
        rt = p, rt === In && us();
      }
    }
    function vC(e, t) {
      var s = rt;
      rt &= ~Cv, rt |= _w;
      try {
        return e(t);
      } finally {
        rt = s, rt === In && us();
      }
    }
    function gC(e, t) {
      if ((rt & (wr | hs)) !== In)
        throw Error("flushSync was called from inside a lifecycle method. It cannot be called when React is already rendering.");
      var s = rt;
      rt |= Cv;
      try {
        return co(Li, e.bind(null, t));
      } finally {
        rt = s, us();
      }
    }
    function Tu(e, t) {
      e.finishedWork = null, e.finishedExpirationTime = Ae;
      var s = e.timeoutHandle;
      if (s !== De && (e.timeoutHandle = De, Me(s)), We !== null)
        for (var l = We.return; l !== null; )
          J0(l), l = l.return;
      Gi = e, We = Au(e.current, null), ui = t, Yn = bu, Iv = null, ho = Ct, _h = Ct, Av = null, Ph = Ae, Rv = !1, xu = null, pa.discardPendingWarnings();
    }
    function yC(e, t) {
      do {
        try {
          if ($m(), v0(), rr(), We === null || We.return === null)
            return Yn = Tv, Iv = t, We = null, null;
          Er && We.mode & cs && wv(We, !0), oR(e, We.return, We, t, ui), We = CC(We);
        } catch (s) {
          t = s;
          continue;
        }
        return;
      } while (!0);
    }
    function wC(e) {
      var t = Nw.current;
      return Nw.current = vv, t === null ? vv : t;
    }
    function bC(e) {
      Nw.current = e;
    }
    function Pv(e) {
      {
        var t = h.__interactionsRef.current;
        return h.__interactionsRef.current = e.memoizedInteractions, t;
      }
    }
    function zv(e) {
      h.__interactionsRef.current = e;
    }
    function SR() {
      zw = vr();
    }
    function SC(e, t) {
      e < ho && e > du && (ho = e), t !== null && e < _h && e > du && (_h = e, Av = t);
    }
    function Ov(e) {
      e > Ph && (Ph = e);
    }
    function xR() {
      Yn === bu && (Yn = Mv);
    }
    function CR() {
      (Yn === bu || Yn === Mv) && (Yn = Ev), Ph !== Ae && Gi !== null && (Ru(Gi, ui), LC(Gi, Ph));
    }
    function TR() {
      Yn !== Pw && (Yn = fC);
    }
    function MR() {
      return Yn === bu;
    }
    function ER(e) {
      var t = fu(e);
      return t - mh;
    }
    function IR(e, t) {
      var s = fu(e);
      return s - (t.timeoutMs | 0 || mh);
    }
    function AR() {
      for (; We !== null; )
        We = xC(We);
    }
    function RR() {
      for (; We !== null && !OA(); )
        We = xC(We);
    }
    function xC(e) {
      var t = e.alternate;
      fx(e), Co(e);
      var s;
      return (e.mode & cs) !== oi ? (cw(e), s = Hw(t, e, ui), wv(e, !0)) : s = Hw(t, e, ui), rr(), e.memoizedProps = e.pendingProps, s === null && (s = CC(e)), cC.current = null, s;
    }
    function CC(e) {
      We = e;
      do {
        var t = We.alternate, s = We.return;
        if ((We.effectTag & Po) === _t) {
          Co(We);
          var l = void 0;
          if ((We.mode & cs) === oi ? l = X0(t, We, ui) : (cw(We), l = X0(t, We, ui), wv(We, !1)), px(We), rr(), DR(We), l !== null)
            return l;
          if (s !== null && (s.effectTag & Po) === _t) {
            s.firstEffect === null && (s.firstEffect = We.firstEffect), We.lastEffect !== null && (s.lastEffect !== null && (s.lastEffect.nextEffect = We.firstEffect), s.lastEffect = We.lastEffect);
            var d = We.effectTag;
            d > lr && (s.lastEffect !== null ? s.lastEffect.nextEffect = We : s.firstEffect = We, s.lastEffect = We);
          }
        } else {
          var p = U1(We);
          if ((We.mode & cs) !== oi) {
            wv(We, !1);
            for (var w = We.actualDuration, b = We.child; b !== null; )
              w += b.actualDuration, b = b.sibling;
            We.actualDuration = w;
          }
          if (p !== null)
            return IA(We), p.effectTag &= Sf, p;
          px(We), s !== null && (s.firstEffect = s.lastEffect = null, s.effectTag |= Po);
        }
        var E = We.sibling;
        if (E !== null)
          return E;
        We = s;
      } while (We !== null);
      return Yn === bu && (Yn = Pw), null;
    }
    function Uw(e) {
      var t = e.expirationTime, s = e.childExpirationTime;
      return t > s ? t : s;
    }
    function DR(e) {
      if (!(ui !== ds && e.childExpirationTime === ds)) {
        var t = Ae;
        if ((e.mode & cs) !== oi) {
          for (var s = e.actualDuration, l = e.selfBaseDuration, d = e.alternate === null || e.child !== e.alternate.child, p = e.child; p !== null; ) {
            var w = p.expirationTime, b = p.childExpirationTime;
            w > t && (t = w), b > t && (t = b), d && (s += p.actualDuration), l += p.treeBaseDuration, p = p.sibling;
          }
          e.actualDuration = s, e.treeBaseDuration = l;
        } else
          for (var E = e.child; E !== null; ) {
            var N = E.expirationTime, k = E.childExpirationTime;
            N > t && (t = N), k > t && (t = k), E = E.sibling;
          }
        e.childExpirationTime = t;
      }
    }
    function Mu(e) {
      var t = ed();
      return co(Li, NR.bind(null, e, t)), null;
    }
    function NR(e, t) {
      do
        tl();
      while (yd !== null);
      if ($R(), (rt & (wr | hs)) !== In)
        throw Error("Should not already be working.");
      var s = e.finishedWork, l = e.finishedExpirationTime;
      if (s === null)
        return null;
      if (e.finishedWork = null, e.finishedExpirationTime = Ae, s === e.current)
        throw Error("Cannot commit the same tree as before. This error is likely caused by a bug in React. Please file an issue.");
      e.callbackNode = null, e.callbackExpirationTime = Ae, e.callbackPriority = Kc, e.nextKnownPendingLevel = Ae, AA();
      var d = Uw(s);
      yD(e, l, d), e === Gi && (Gi = null, We = null, ui = Ae);
      var p;
      if (s.effectTag > lr ? s.lastEffect !== null ? (s.lastEffect.nextEffect = s, p = s.firstEffect) : p = s : p = s.firstEffect, p !== null) {
        var w = rt;
        rt |= hs;
        var b = Pv(e);
        cC.current = null, gx(), n(e.containerInfo), Ue = p;
        do
          if (se(null, kR, null), oe()) {
            if (Ue === null)
              throw Error("Should be working on an effect.");
            var E = Ne();
            Eu(Ue, E), Ue = Ue.nextEffect;
          }
        while (Ue !== null);
        yx(), A0(), wx(), Ue = p;
        do
          if (se(null, _R, null, e, t), oe()) {
            if (Ue === null)
              throw Error("Should be working on an effect.");
            var N = Ne();
            Eu(Ue, N), Ue = Ue.nextEffect;
          }
        while (Ue !== null);
        bx(), a(e.containerInfo), e.current = s, Sx(), Ue = p;
        do
          if (se(null, PR, null, e, l), oe()) {
            if (Ue === null)
              throw Error("Should be working on an effect.");
            var k = Ne();
            Eu(Ue, k), Ue = Ue.nextEffect;
          }
        while (Ue !== null);
        xx(), Ue = null, LA(), zv(b), rt = w;
      } else
        e.current = s, gx(), yx(), A0(), wx(), bx(), Sx(), xx();
      RA();
      var J = zh;
      if (zh)
        zh = !1, yd = e, Lw = l, Oh = t;
      else
        for (Ue = p; Ue !== null; ) {
          var L = Ue.nextEffect;
          Ue.nextEffect = null, Ue = L;
        }
      var K = e.firstPendingTime;
      if (K !== Ae) {
        if (xu !== null) {
          var me = xu;
          xu = null;
          for (var we = 0; we < me.length; we++)
            NC(e, me[we], e.memoizedInteractions);
        }
        nl(e, K);
      } else
        gd = null;
      if (J || _C(e, l), K === Ct ? e === Bw ? Lh++ : (Lh = 0, Bw = e) : Lh = 0, nD(s.stateNode, l), br(e), Dv) {
        Dv = !1;
        var Ke = Ow;
        throw Ow = null, Ke;
      }
      return (rt & _w) !== In || us(), null;
    }
    function kR() {
      for (; Ue !== null; ) {
        var e = Ue.effectTag;
        if ((e & Ua) !== _t) {
          Co(Ue), km();
          var t = Ue.alternate;
          Q1(t, Ue), rr();
        }
        (e & Va) !== _t && (zh || (zh = !0, hh(ha, function() {
          return tl(), null;
        }))), Ue = Ue.nextEffect;
      }
    }
    function _R(e, t) {
      for (; Ue !== null; ) {
        Co(Ue);
        var s = Ue.effectTag;
        if (s & Ri && rR(Ue), s & pi) {
          var l = Ue.alternate;
          l !== null && J1(l);
        }
        var d = s & (Cn | xt | Us | $i);
        switch (d) {
          case Cn: {
            aC(Ue), Ue.effectTag &= ~Cn;
            break;
          }
          case zp: {
            aC(Ue), Ue.effectTag &= ~Cn;
            var p = Ue.alternate;
            Dw(p, Ue);
            break;
          }
          case $i: {
            Ue.effectTag &= ~$i;
            break;
          }
          case fc: {
            Ue.effectTag &= ~$i;
            var w = Ue.alternate;
            Dw(w, Ue);
            break;
          }
          case xt: {
            var b = Ue.alternate;
            Dw(b, Ue);
            break;
          }
          case Us: {
            tR(e, Ue, t);
            break;
          }
        }
        km(), rr(), Ue = Ue.nextEffect;
      }
    }
    function PR(e, t) {
      for (; Ue !== null; ) {
        Co(Ue);
        var s = Ue.effectTag;
        if (s & (xt | wf)) {
          km();
          var l = Ue.alternate;
          Y1(e, l, Ue);
        }
        s & pi && (km(), X1(Ue)), rr(), Ue = Ue.nextEffect;
      }
    }
    function tl() {
      if (Oh !== Kc) {
        var e = Oh > ha ? ha : Oh;
        return Oh = Kc, co(e, zR);
      }
    }
    function zR() {
      if (yd === null)
        return !1;
      var e = yd, t = Lw;
      if (yd = null, Lw = Ae, (rt & (wr | hs)) !== In)
        throw Error("Cannot flush passive effects while already rendering.");
      var s = rt;
      rt |= hs;
      for (var l = Pv(e), d = e.current.firstEffect; d !== null; ) {
        {
          if (Co(d), se(null, Z1, null, d), oe()) {
            if (d === null)
              throw Error("Should be working on an effect.");
            var p = Ne();
            Eu(d, p);
          }
          rr();
        }
        var w = d.nextEffect;
        d.nextEffect = null, d = w;
      }
      return zv(l), _C(e, t), rt = s, us(), Nv = yd === null ? 0 : Nv + 1, !0;
    }
    function TC(e) {
      return gd !== null && gd.has(e);
    }
    function OR(e) {
      gd === null ? gd = /* @__PURE__ */ new Set([e]) : gd.add(e);
    }
    function LR(e) {
      Dv || (Dv = !0, Ow = e);
    }
    var BR = LR;
    function MC(e, t, s) {
      var l = Ew(s, t), d = lC(e, l, Ct);
      Xo(e, d);
      var p = kv(e, Ct);
      p !== null && (br(p), nl(p, Ct));
    }
    function Eu(e, t) {
      if (e.tag === Se) {
        MC(e, e, t);
        return;
      }
      for (var s = e.return; s !== null; ) {
        if (s.tag === Se) {
          MC(s, e, t);
          return;
        } else if (s.tag === ce) {
          var l = s.type, d = s.stateNode;
          if (typeof l.getDerivedStateFromError == "function" || typeof d.componentDidCatch == "function" && !TC(d)) {
            var p = Ew(t, e), w = uC(
              s,
              p,
              Ct
            );
            Xo(s, w);
            var b = kv(s, Ct);
            b !== null && (br(b), nl(b, Ct));
            return;
          }
        }
        s = s.return;
      }
    }
    function jR(e, t, s) {
      var l = e.pingCache;
      if (l !== null && l.delete(t), Gi === e && ui === s) {
        Yn === Ev || Yn === Mv && ho === Ct && vr() - zw < hC ? Tu(e, ui) : Rv = !0;
        return;
      }
      if (!!OC(e, s)) {
        var d = e.lastPingedTime;
        d !== Ae && d < s || (e.lastPingedTime = s, br(e), nl(e, s));
      }
    }
    function UR(e, t) {
      if (t === Ae) {
        var s = null, l = ps();
        t = Cu(l, e, s);
      }
      var d = kv(e, t);
      d !== null && (br(d), nl(d, t));
    }
    function VR(e, t) {
      var s = Ae, l;
      l = e.stateNode, l !== null && l.delete(t), UR(e, s);
    }
    function HR(e) {
      return e < 120 ? 120 : e < 480 ? 480 : e < 1080 ? 1080 : e < 1920 ? 1920 : e < 3e3 ? 3e3 : e < 4320 ? 4320 : lR(e / 1960) * 1960;
    }
    function WR(e, t, s) {
      var l = s.busyMinDurationMs | 0;
      if (l <= 0)
        return 0;
      var d = s.busyDelayMs | 0, p = vr(), w = IR(e, s), b = p - w;
      if (b <= d)
        return 0;
      var E = d + l - b;
      return E;
    }
    function FR() {
      if (Lh > cR)
        throw Lh = 0, Bw = null, Error("Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.");
      Nv > dR && (Nv = 0, g("Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render."));
    }
    function $R() {
      pa.flushLegacyContextWarning(), pa.flushPendingUnsafeLifecycleWarnings();
    }
    function EC() {
      var e = !0;
      vx(Bh, e), Bh = null;
    }
    function Vw() {
      var e = !1;
      vx(Bh, e), Bh = null;
    }
    function QR(e, t) {
      Gi !== null && t > ui && (Bh = e);
    }
    var Lv = null;
    function ZR(e) {
      {
        var t = e.tag;
        if (t !== Se && t !== ce && t !== Oe && t !== D && t !== Ce && t !== ge && t !== Mt)
          return;
        var s = Te(e.type) || "ReactComponent";
        if (Lv !== null) {
          if (Lv.has(s))
            return;
          Lv.add(s);
        } else
          Lv = /* @__PURE__ */ new Set([s]);
        g("Can't perform a React state update on an unmounted component. This is a no-op, but it indicates a memory leak in your application. To fix, cancel all subscriptions and asynchronous tasks in %s.%s", t === ce ? "the componentWillUnmount method" : "a useEffect cleanup function", $n(e));
      }
    }
    var Hw;
    {
      var YR = null;
      Hw = function(e, t, s) {
        var l = zC(YR, t);
        try {
          return $0(e, t, s);
        } catch (p) {
          if (p !== null && typeof p == "object" && typeof p.then == "function")
            throw p;
          if ($m(), v0(), J0(t), zC(t, l), t.mode & cs && cw(t), se(null, $0, null, e, t, s), oe()) {
            var d = Ne();
            throw d;
          } else
            throw p;
        }
      };
    }
    var IC = !1, Ww;
    Ww = /* @__PURE__ */ new Set();
    function GR(e) {
      if (yl && (rt & wr) !== In)
        switch (e.tag) {
          case Oe:
          case D:
          case ge: {
            var t = We && Te(We.type) || "Unknown", s = t;
            if (!Ww.has(s)) {
              Ww.add(s);
              var l = Te(e.type) || "Unknown";
              g("Cannot update a component (`%s`) while rendering a different component (`%s`). To locate the bad setState() call inside `%s`, follow the stack trace as described in https://fb.me/setstate-in-render", l, t, t);
            }
            break;
          }
          case ce: {
            IC || (g("Cannot update during an existing state transition (such as within `render`). Render methods should be a pure function of props and state."), IC = !0);
            break;
          }
        }
    }
    var Iu = {
      current: !1
    };
    function AC(e) {
      kw.current === !0 && Iu.current !== !0 && g(`It looks like you're using the wrong act() around your test interactions.
Be sure to use the matching version of act() corresponding to your renderer:

// for react-dom:
import {act} from 'react-dom/test-utils';
// ...
act(() => ...);

// for react-test-renderer:
import TestRenderer from 'react-test-renderer';
const {act} = TestRenderer;
// ...
act(() => ...);%s`, $n(e));
    }
    function RC(e) {
      (e.mode & yn) !== oi && kw.current === !1 && Iu.current === !1 && g(`An update to %s ran an effect, but was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://fb.me/react-wrap-tests-with-act%s`, Te(e.type), $n(e));
    }
    function XR(e) {
      rt === In && kw.current === !1 && Iu.current === !1 && g(`An update to %s inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://fb.me/react-wrap-tests-with-act%s`, Te(e.type), $n(e));
    }
    var JR = XR, DC = !1;
    function qR(e) {
      DC === !1 && o.unstable_flushAllWithoutAsserting === void 0 && (e.mode & Hr || e.mode & td) && (DC = !0, g(`In Concurrent or Sync modes, the "scheduler" module needs to be mocked to guarantee consistent behaviour across tests and browsers. For example, with jest: 
jest.mock('scheduler', () => require('scheduler/unstable_mock'));

For more info, visit https://fb.me/react-mock-scheduler`));
    }
    function Fw(e, t) {
      return t * 1e3 + e.interactionThreadID;
    }
    function $w(e) {
      xu === null ? xu = [e] : xu.push(e);
    }
    function NC(e, t, s) {
      if (s.size > 0) {
        var l = e.pendingInteractionMap, d = l.get(t);
        d != null ? s.forEach(function(b) {
          d.has(b) || b.__count++, d.add(b);
        }) : (l.set(t, new Set(s)), s.forEach(function(b) {
          b.__count++;
        }));
        var p = h.__subscriberRef.current;
        if (p !== null) {
          var w = Fw(e, t);
          p.onWorkScheduled(s, w);
        }
      }
    }
    function nl(e, t) {
      NC(e, t, h.__interactionsRef.current);
    }
    function kC(e, t) {
      var s = /* @__PURE__ */ new Set();
      if (e.pendingInteractionMap.forEach(function(p, w) {
        w >= t && p.forEach(function(b) {
          return s.add(b);
        });
      }), e.memoizedInteractions = s, s.size > 0) {
        var l = h.__subscriberRef.current;
        if (l !== null) {
          var d = Fw(e, t);
          try {
            l.onWorkStarted(s, d);
          } catch (p) {
            hh(Li, function() {
              throw p;
            });
          }
        }
      }
    }
    function _C(e, t) {
      var s = e.firstPendingTime, l;
      try {
        if (l = h.__subscriberRef.current, l !== null && e.memoizedInteractions.size > 0) {
          var d = Fw(e, t);
          l.onWorkStopped(e.memoizedInteractions, d);
        }
      } catch (w) {
        hh(Li, function() {
          throw w;
        });
      } finally {
        var p = e.pendingInteractionMap;
        p.forEach(function(w, b) {
          b > s && (p.delete(b), w.forEach(function(E) {
            if (E.__count--, l !== null && E.__count === 0)
              try {
                l.onInteractionScheduledWorkCompleted(E);
              } catch (N) {
                hh(Li, function() {
                  throw N;
                });
              }
          }));
        });
      }
    }
    var Qw = null, Zw = null, Yw = null, wd = !1, KR = typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u";
    function eD(e) {
      if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u")
        return !1;
      var t = __REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (t.isDisabled)
        return !0;
      if (!t.supportsFiber)
        return g("The installed version of React DevTools is too old and will not work with the current version of React. Please update React DevTools. https://fb.me/react-devtools"), !0;
      try {
        var s = t.inject(e);
        typeof t.onScheduleFiberRoot == "function" && (Qw = function(l, d) {
          try {
            t.onScheduleFiberRoot(s, l, d);
          } catch (p) {
            wd || (wd = !0, g("React instrumentation encountered an error: %s", p));
          }
        }), Zw = function(l, d) {
          try {
            var p = (l.current.effectTag & Ut) === Ut;
            if (Er) {
              var w = fR(), b = Fx(w, d);
              t.onCommitFiberRoot(s, l, b, p);
            }
          } catch (E) {
            wd || (wd = !0, g("React instrumentation encountered an error: %s", E));
          }
        }, Yw = function(l) {
          try {
            t.onCommitFiberUnmount(s, l);
          } catch (d) {
            wd || (wd = !0, g("React instrumentation encountered an error: %s", d));
          }
        };
      } catch (l) {
        g("React instrumentation encountered an error: %s.", l);
      }
      return !0;
    }
    function tD(e, t) {
      typeof Qw == "function" && Qw(e, t);
    }
    function nD(e, t) {
      typeof Zw == "function" && Zw(e, t);
    }
    function iD(e) {
      typeof Yw == "function" && Yw(e);
    }
    var Gw;
    {
      Gw = !1;
      try {
        var PC = Object.preventExtensions({}), rD = /* @__PURE__ */ new Map([[PC, null]]), aD = /* @__PURE__ */ new Set([PC]);
        rD.set(0, 0), aD.add(0);
      } catch {
        Gw = !0;
      }
    }
    var sD = 1;
    function oD(e, t, s, l) {
      this.tag = e, this.key = s, this.elementType = null, this.type = null, this.stateNode = null, this.return = null, this.child = null, this.sibling = null, this.index = 0, this.ref = null, this.pendingProps = t, this.memoizedProps = null, this.updateQueue = null, this.memoizedState = null, this.dependencies = null, this.mode = l, this.effectTag = _t, this.nextEffect = null, this.firstEffect = null, this.lastEffect = null, this.expirationTime = Ae, this.childExpirationTime = Ae, this.alternate = null, this.actualDuration = Number.NaN, this.actualStartTime = Number.NaN, this.selfBaseDuration = Number.NaN, this.treeBaseDuration = Number.NaN, this.actualDuration = 0, this.actualStartTime = -1, this.selfBaseDuration = 0, this.treeBaseDuration = 0, this._debugID = sD++, this._debugIsCurrentlyTiming = !1, this._debugSource = null, this._debugOwner = null, this._debugNeedsRemount = !1, this._debugHookTypes = null, !Gw && typeof Object.preventExtensions == "function" && Object.preventExtensions(this);
    }
    var ya = function(e, t, s, l) {
      return new oD(e, t, s, l);
    };
    function Xw(e) {
      var t = e.prototype;
      return !!(t && t.isReactComponent);
    }
    function lD(e) {
      return typeof e == "function" && !Xw(e) && e.defaultProps === void 0;
    }
    function uD(e) {
      if (typeof e == "function")
        return Xw(e) ? ce : Oe;
      if (e != null) {
        var t = e.$$typeof;
        if (t === ni)
          return D;
        if (t === ta)
          return Ce;
      }
      return Qe;
    }
    function Au(e, t) {
      var s = e.alternate;
      s === null ? (s = ya(e.tag, t, e.key, e.mode), s.elementType = e.elementType, s.type = e.type, s.stateNode = e.stateNode, s._debugID = e._debugID, s._debugSource = e._debugSource, s._debugOwner = e._debugOwner, s._debugHookTypes = e._debugHookTypes, s.alternate = e, e.alternate = s) : (s.pendingProps = t, s.effectTag = _t, s.nextEffect = null, s.firstEffect = null, s.lastEffect = null, s.actualDuration = 0, s.actualStartTime = -1), s.childExpirationTime = e.childExpirationTime, s.expirationTime = e.expirationTime, s.child = e.child, s.memoizedProps = e.memoizedProps, s.memoizedState = e.memoizedState, s.updateQueue = e.updateQueue;
      var l = e.dependencies;
      switch (s.dependencies = l === null ? null : {
        expirationTime: l.expirationTime,
        firstContext: l.firstContext,
        responders: l.responders
      }, s.sibling = e.sibling, s.index = e.index, s.ref = e.ref, s.selfBaseDuration = e.selfBaseDuration, s.treeBaseDuration = e.treeBaseDuration, s._debugNeedsRemount = e._debugNeedsRemount, s.tag) {
        case Qe:
        case Oe:
        case ge:
          s.type = id(e.type);
          break;
        case ce:
          s.type = hy(e.type);
          break;
        case D:
          s.type = py(e.type);
          break;
      }
      return s;
    }
    function cD(e, t) {
      e.effectTag &= Cn, e.nextEffect = null, e.firstEffect = null, e.lastEffect = null;
      var s = e.alternate;
      if (s === null)
        e.childExpirationTime = Ae, e.expirationTime = t, e.child = null, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.selfBaseDuration = 0, e.treeBaseDuration = 0;
      else {
        e.childExpirationTime = s.childExpirationTime, e.expirationTime = s.expirationTime, e.child = s.child, e.memoizedProps = s.memoizedProps, e.memoizedState = s.memoizedState, e.updateQueue = s.updateQueue;
        var l = s.dependencies;
        e.dependencies = l === null ? null : {
          expirationTime: l.expirationTime,
          firstContext: l.firstContext,
          responders: l.responders
        }, e.selfBaseDuration = s.selfBaseDuration, e.treeBaseDuration = s.treeBaseDuration;
      }
      return e;
    }
    function dD(e) {
      var t;
      return e === kA ? t = td | Hr | yn : e === NA ? t = Hr | yn : t = oi, KR && (t |= cs), ya(Se, null, null, t);
    }
    function Jw(e, t, s, l, d, p) {
      var w, b = Qe, E = e;
      if (typeof e == "function")
        Xw(e) ? (b = ce, E = hy(E)) : E = id(E);
      else if (typeof e == "string")
        b = Re;
      else {
        e:
          switch (e) {
            case je:
              return il(s.children, d, p, t);
            case Mn:
              b = Bt, d |= td | Hr | yn;
              break;
            case et:
              b = Bt, d |= yn;
              break;
            case Nt:
              return fD(s, d, p, t);
            case ii:
              return hD(s, d, p, t);
            case So:
              return pD(s, d, p, t);
            default: {
              if (typeof e == "object" && e !== null)
                switch (e.$$typeof) {
                  case gn:
                    b = re;
                    break e;
                  case xn:
                    b = Ge;
                    break e;
                  case ni:
                    b = D, E = py(E);
                    break e;
                  case ta:
                    b = Ce;
                    break e;
                  case ir:
                    b = it, E = null;
                    break e;
                  case xo:
                    b = Mt;
                    break e;
                }
              var N = "";
              {
                (e === void 0 || typeof e == "object" && e !== null && Object.keys(e).length === 0) && (N += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");
                var k = l ? Te(l.type) : null;
                k && (N += `

Check the render method of \`` + k + "`.");
              }
              throw Error("Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: " + (e == null ? e : typeof e) + "." + N);
            }
          }
      }
      return w = ya(b, s, t, d), w.elementType = e, w.type = E, w.expirationTime = p, w;
    }
    function qw(e, t, s) {
      var l = null;
      l = e._owner;
      var d = e.type, p = e.key, w = e.props, b = Jw(d, p, w, l, t, s);
      return b._debugSource = e._source, b._debugOwner = e._owner, b;
    }
    function il(e, t, s, l) {
      var d = ya(Tt, e, l, t);
      return d.expirationTime = s, d;
    }
    function fD(e, t, s, l) {
      (typeof e.id != "string" || typeof e.onRender != "function") && g('Profiler must specify an "id" string and "onRender" function as props');
      var d = ya(B, e, l, t | cs);
      return d.elementType = Nt, d.type = Nt, d.expirationTime = s, d;
    }
    function hD(e, t, s, l) {
      var d = ya(ee, e, l, t);
      return d.type = ii, d.elementType = ii, d.expirationTime = s, d;
    }
    function pD(e, t, s, l) {
      var d = ya(dt, e, l, t);
      return d.type = So, d.elementType = So, d.expirationTime = s, d;
    }
    function Kw(e, t, s) {
      var l = ya($e, e, null, t);
      return l.expirationTime = s, l;
    }
    function mD() {
      var e = ya(Re, null, null, oi);
      return e.elementType = "DELETED", e.type = "DELETED", e;
    }
    function eb(e, t, s) {
      var l = e.children !== null ? e.children : [], d = ya(Ve, l, e.key, t);
      return d.expirationTime = s, d.stateNode = {
        containerInfo: e.containerInfo,
        pendingChildren: null,
        implementation: e.implementation
      }, d;
    }
    function zC(e, t) {
      return e === null && (e = ya(Qe, null, null, oi)), e.tag = t.tag, e.key = t.key, e.elementType = t.elementType, e.type = t.type, e.stateNode = t.stateNode, e.return = t.return, e.child = t.child, e.sibling = t.sibling, e.index = t.index, e.ref = t.ref, e.pendingProps = t.pendingProps, e.memoizedProps = t.memoizedProps, e.updateQueue = t.updateQueue, e.memoizedState = t.memoizedState, e.dependencies = t.dependencies, e.mode = t.mode, e.effectTag = t.effectTag, e.nextEffect = t.nextEffect, e.firstEffect = t.firstEffect, e.lastEffect = t.lastEffect, e.expirationTime = t.expirationTime, e.childExpirationTime = t.childExpirationTime, e.alternate = t.alternate, e.actualDuration = t.actualDuration, e.actualStartTime = t.actualStartTime, e.selfBaseDuration = t.selfBaseDuration, e.treeBaseDuration = t.treeBaseDuration, e._debugID = t._debugID, e._debugSource = t._debugSource, e._debugOwner = t._debugOwner, e._debugIsCurrentlyTiming = t._debugIsCurrentlyTiming, e._debugNeedsRemount = t._debugNeedsRemount, e._debugHookTypes = t._debugHookTypes, e;
    }
    function vD(e, t, s) {
      this.tag = t, this.current = null, this.containerInfo = e, this.pendingChildren = null, this.pingCache = null, this.finishedExpirationTime = Ae, this.finishedWork = null, this.timeoutHandle = De, this.context = null, this.pendingContext = null, this.hydrate = s, this.callbackNode = null, this.callbackPriority = Kc, this.firstPendingTime = Ae, this.firstSuspendedTime = Ae, this.lastSuspendedTime = Ae, this.nextKnownPendingLevel = Ae, this.lastPingedTime = Ae, this.lastExpiredTime = Ae, this.interactionThreadID = h.unstable_getThreadID(), this.memoizedInteractions = /* @__PURE__ */ new Set(), this.pendingInteractionMap = /* @__PURE__ */ new Map();
    }
    function gD(e, t, s, l) {
      var d = new vD(e, t, s), p = dD(t);
      return d.current = p, p.stateNode = d, xy(p), d;
    }
    function OC(e, t) {
      var s = e.firstSuspendedTime, l = e.lastSuspendedTime;
      return s !== Ae && s >= t && l <= t;
    }
    function Ru(e, t) {
      var s = e.firstSuspendedTime, l = e.lastSuspendedTime;
      s < t && (e.firstSuspendedTime = t), (l > t || s === Ae) && (e.lastSuspendedTime = t), t <= e.lastPingedTime && (e.lastPingedTime = Ae), t <= e.lastExpiredTime && (e.lastExpiredTime = Ae);
    }
    function LC(e, t) {
      var s = e.firstPendingTime;
      t > s && (e.firstPendingTime = t);
      var l = e.firstSuspendedTime;
      l !== Ae && (t >= l ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = Ae : t >= e.lastSuspendedTime && (e.lastSuspendedTime = t + 1), t > e.nextKnownPendingLevel && (e.nextKnownPendingLevel = t));
    }
    function yD(e, t, s) {
      e.firstPendingTime = s, t <= e.lastSuspendedTime ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = Ae : t <= e.firstSuspendedTime && (e.firstSuspendedTime = t - 1), t <= e.lastPingedTime && (e.lastPingedTime = Ae), t <= e.lastExpiredTime && (e.lastExpiredTime = Ae);
    }
    function tb(e, t) {
      var s = e.lastExpiredTime;
      (s === Ae || s > t) && (e.lastExpiredTime = t);
    }
    var nb, ib;
    nb = !1, ib = {};
    function wD(e) {
      if (!e)
        return mr;
      var t = ua(e), s = DA(t);
      if (t.tag === ce) {
        var l = t.type;
        if (ls(l))
          return Mx(t, l, s);
      }
      return s;
    }
    function bD(e, t) {
      {
        var s = ua(e);
        if (s === void 0)
          throw typeof e.render == "function" ? Error("Unable to find node on an unmounted component.") : Error("Argument appears to not be a ReactComponent. Keys: " + Object.keys(e));
        var l = Cf(s);
        if (l === null)
          return null;
        if (l.mode & yn) {
          var d = Te(s.type) || "Component";
          ib[d] || (ib[d] = !0, s.mode & yn ? g("%s is deprecated in StrictMode. %s was passed an instance of %s which is inside StrictMode. Instead, add a ref directly to the element you want to reference. Learn more about using refs safely here: https://fb.me/react-strict-mode-find-node%s", t, t, d, $n(l)) : g("%s is deprecated in StrictMode. %s was passed an instance of %s which renders StrictMode children. Instead, add a ref directly to the element you want to reference. Learn more about using refs safely here: https://fb.me/react-strict-mode-find-node%s", t, t, d, $n(l)));
        }
        return l.stateNode;
      }
    }
    function SD(e, t, s, l) {
      return gD(e, t, s);
    }
    function Uh(e, t, s, l) {
      tD(t, e);
      var d = t.current, p = ps();
      typeof jest < "u" && (qR(d), AC(d));
      var w = Ch(), b = Cu(p, d, w), E = wD(s);
      t.context === null ? t.context = E : t.pendingContext = E, yl && na !== null && !nb && (nb = !0, g(`Render methods should be a pure function of props and state; triggering nested component updates from render is not allowed. If necessary, trigger nested updates in componentDidUpdate.

Check the render method of %s.`, Te(na.type) || "Unknown"));
      var N = Go(b, w);
      return N.payload = {
        element: e
      }, l = l === void 0 ? null : l, l !== null && (typeof l != "function" && g("render(...): Expected the last optional `callback` argument to be a function. Instead received: %s.", l), N.callback = l), Xo(d, N), Zr(d, b), b;
    }
    function rb(e) {
      var t = e.current;
      if (!t.child)
        return null;
      switch (t.child.tag) {
        case Re:
          return t.child.stateNode;
        default:
          return t.child.stateNode;
      }
    }
    function BC(e, t) {
      var s = e.memoizedState;
      s !== null && s.dehydrated !== null && s.retryTime < t && (s.retryTime = t);
    }
    function ab(e, t) {
      BC(e, t);
      var s = e.alternate;
      s && BC(s, t);
    }
    function xD(e) {
      if (e.tag === ee) {
        var t = Wx(ps());
        Zr(e, t), ab(e, t);
      }
    }
    function CD(e) {
      e.tag === ee && (Zr(e, jx), ab(e, jx));
    }
    function TD(e) {
      if (e.tag === ee) {
        var t = ps(), s = Cu(t, e, null);
        Zr(e, s), ab(e, s);
      }
    }
    function jC(e) {
      var t = Bl(e);
      return t === null ? null : t.tag === gt ? t.stateNode.instance : t.stateNode;
    }
    var UC = function(e) {
      return !1;
    };
    function MD(e) {
      return UC(e);
    }
    var VC = null, HC = null, WC = null, FC = null;
    {
      var $C = function(e, t, s, l) {
        if (s >= t.length)
          return l;
        var d = t[s], p = Array.isArray(e) ? e.slice() : i({}, e);
        return p[d] = $C(e[d], t, s + 1, l), p;
      }, QC = function(e, t, s) {
        return $C(e, t, 0, s);
      };
      VC = function(e, t, s, l) {
        for (var d = e.memoizedState; d !== null && t > 0; )
          d = d.next, t--;
        if (d !== null) {
          var p = QC(d.memoizedState, s, l);
          d.memoizedState = p, d.baseState = p, e.memoizedProps = i({}, e.memoizedProps), Zr(e, Ct);
        }
      }, HC = function(e, t, s) {
        e.pendingProps = QC(e.memoizedProps, t, s), e.alternate && (e.alternate.pendingProps = e.pendingProps), Zr(e, Ct);
      }, WC = function(e) {
        Zr(e, Ct);
      }, FC = function(e) {
        UC = e;
      };
    }
    function ED(e) {
      var t = e.findFiberByHostInstance, s = m.ReactCurrentDispatcher;
      return eD(i({}, e, {
        overrideHookState: VC,
        overrideProps: HC,
        setSuspenseHandler: FC,
        scheduleUpdate: WC,
        currentDispatcherRef: s,
        findHostInstanceByFiber: function(l) {
          var d = Cf(l);
          return d === null ? null : d.stateNode;
        },
        findFiberByHostInstance: function(l) {
          return t ? t(l) : null;
        },
        findHostInstancesForRefresh: QA,
        scheduleRefresh: FA,
        scheduleRoot: $A,
        setRefreshHandler: WA,
        getCurrentFiber: function() {
          return na;
        }
      }));
    }
    m.IsSomeRendererActing;
    function sb(e, t, s) {
      this._internalRoot = ID(e, t, s);
    }
    sb.prototype.render = function(e) {
      var t = this._internalRoot;
      {
        typeof arguments[1] == "function" && g("render(...): does not support the second callback argument. To execute a side effect after rendering, declare it in a component body with useEffect().");
        var s = t.containerInfo;
        if (s.nodeType !== ai) {
          var l = jC(t.current);
          l && l.parentNode !== s && g("render(...): It looks like the React-rendered content of the root container was removed without using React. This is not supported and will cause errors. Instead, call root.unmount() to empty a root's container.");
        }
      }
      Uh(e, t, null, null);
    }, sb.prototype.unmount = function() {
      typeof arguments[0] == "function" && g("unmount(...): does not support a callback argument. To execute a side effect after rendering, declare it in a component body with useEffect().");
      var e = this._internalRoot, t = e.containerInfo;
      Uh(null, e, null, function() {
        OS(t);
      });
    };
    function ID(e, t, s) {
      var l = s != null && s.hydrate === !0;
      s != null && s.hydrationOptions;
      var d = SD(e, t, l);
      if (uI(d.current, e), l && t !== Ix) {
        var p = e.nodeType === ka ? e : e.ownerDocument;
        bc(e, p);
      }
      return d;
    }
    function AD(e, t) {
      return new sb(e, Ix, t);
    }
    function bd(e) {
      return !!(e && (e.nodeType === ar || e.nodeType === ka || e.nodeType === qu || e.nodeType === ai && e.nodeValue === " react-mount-point-unstable "));
    }
    var RD = m.ReactCurrentOwner, ZC, YC = !1;
    ZC = function(e) {
      if (e._reactRootContainer && e.nodeType !== ai) {
        var t = jC(e._reactRootContainer._internalRoot.current);
        t && t.parentNode !== e && g("render(...): It looks like the React-rendered content of this container was removed without using React. This is not supported and will cause errors. Instead, call ReactDOM.unmountComponentAtNode to empty a container.");
      }
      var s = !!e._reactRootContainer, l = Bv(e), d = !!(l && Zo(l));
      d && !s && g("render(...): Replacing React-rendered children with a new root component. If you intended to update the children of this node, you should instead have the existing children update their state and render the new components instead of calling ReactDOM.render."), e.nodeType === ar && e.tagName && e.tagName.toUpperCase() === "BODY" && g("render(): Rendering components directly into document.body is discouraged, since its children are often manipulated by third-party scripts and browser extensions. This may lead to subtle reconciliation issues. Try rendering into a container element created for your app.");
    };
    function Bv(e) {
      return e ? e.nodeType === ka ? e.documentElement : e.firstChild : null;
    }
    function DD(e) {
      var t = Bv(e);
      return !!(t && t.nodeType === ar && t.hasAttribute(de));
    }
    function ND(e, t) {
      var s = t || DD(e);
      if (!s)
        for (var l = !1, d; d = e.lastChild; )
          !l && d.nodeType === ar && d.hasAttribute(de) && (l = !0, g("render(): Target node has markup rendered by React, but there are unrelated nodes as well. This is most commonly caused by white-space inserted around server-rendered markup.")), e.removeChild(d);
      return s && !t && !YC && (YC = !0, y("render(): Calling ReactDOM.render() to hydrate server-rendered markup will stop working in React v17. Replace the ReactDOM.render() call with ReactDOM.hydrate() if you want React to attach to the server HTML.")), AD(e, s ? {
        hydrate: !0
      } : void 0);
    }
    function kD(e, t) {
      e !== null && typeof e != "function" && g("%s(...): Expected the last optional `callback` argument to be a function. Instead received: %s.", t, e);
    }
    function jv(e, t, s, l, d) {
      ZC(s), kD(d === void 0 ? null : d, "render");
      var p = s._reactRootContainer, w;
      if (p) {
        if (w = p._internalRoot, typeof d == "function") {
          var E = d;
          d = function() {
            var N = rb(w);
            E.call(N);
          };
        }
        Uh(t, w, e, d);
      } else {
        if (p = s._reactRootContainer = ND(s, l), w = p._internalRoot, typeof d == "function") {
          var b = d;
          d = function() {
            var N = rb(w);
            b.call(N);
          };
        }
        vC(function() {
          Uh(t, w, e, d);
        });
      }
      return rb(w);
    }
    function _D(e) {
      {
        var t = RD.current;
        if (t !== null && t.stateNode !== null) {
          var s = t.stateNode._warnedAboutRefsInRender;
          s || g("%s is accessing findDOMNode inside its render(). render() should be a pure function of props and state. It should never access something that requires stale data from the previous render, such as refs. Move this logic to componentDidMount and componentDidUpdate instead.", Te(t.type) || "A component"), t.stateNode._warnedAboutRefsInRender = !0;
        }
      }
      return e == null ? null : e.nodeType === ar ? e : bD(e, "findDOMNode");
    }
    function PD(e, t, s) {
      if (!bd(t))
        throw Error("Target container is not a DOM element.");
      {
        var l = Hg(t) && t._reactRootContainer === void 0;
        l && g("You are calling ReactDOM.hydrate() on a container that was previously passed to ReactDOM.createRoot(). This is not supported. Did you mean to call createRoot(container, {hydrate: true}).render(element)?");
      }
      return jv(null, e, t, !0, s);
    }
    function zD(e, t, s) {
      if (!bd(t))
        throw Error("Target container is not a DOM element.");
      {
        var l = Hg(t) && t._reactRootContainer === void 0;
        l && g("You are calling ReactDOM.render() on a container that was previously passed to ReactDOM.createRoot(). This is not supported. Did you mean to call root.render(element)?");
      }
      return jv(null, e, t, !1, s);
    }
    function OD(e, t, s, l) {
      if (!bd(s))
        throw Error("Target container is not a DOM element.");
      if (!(e != null && yf(e)))
        throw Error("parentComponent must be a valid React Component");
      return jv(e, t, s, !1, l);
    }
    function LD(e) {
      if (!bd(e))
        throw Error("unmountComponentAtNode(...): Target container is not a DOM element.");
      {
        var t = Hg(e) && e._reactRootContainer === void 0;
        t && g("You are calling ReactDOM.unmountComponentAtNode() on a container that was previously passed to ReactDOM.createRoot(). This is not supported. Did you mean to call root.unmount()?");
      }
      if (e._reactRootContainer) {
        {
          var s = Bv(e), l = s && !Zo(s);
          l && g("unmountComponentAtNode(): The node you're attempting to unmount was rendered by another copy of React.");
        }
        return vC(function() {
          jv(null, null, e, !1, function() {
            e._reactRootContainer = null, OS(e);
          });
        }), !0;
      } else {
        {
          var d = Bv(e), p = !!(d && Zo(d)), w = e.nodeType === ar && bd(e.parentNode) && !!e.parentNode._reactRootContainer;
          p && g("unmountComponentAtNode(): The node you're attempting to unmount was rendered by React and is not a top-level container. %s", w ? "You may have accidentally passed in a React root node instead of its container." : "Instead, have the parent component update its state and rerender in order to remove this component.");
        }
        return !1;
      }
    }
    function BD(e, t, s) {
      var l = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : null;
      return {
        $$typeof: Ze,
        key: l == null ? null : "" + l,
        children: e,
        containerInfo: t,
        implementation: s
      };
    }
    var GC = "16.14.0";
    Ef(xD), gc(CD), wc(TD);
    var XC = !1;
    (typeof Map != "function" || Map.prototype == null || typeof Map.prototype.forEach != "function" || typeof Set != "function" || Set.prototype == null || typeof Set.prototype.clear != "function" || typeof Set.prototype.forEach != "function") && g("React depends on Map and Set built-in types. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"), Ea(pm), Ts(mC, bR, vR, wR);
    function JC(e, t) {
      var s = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
      if (!bd(t))
        throw Error("Target container is not a DOM element.");
      return BD(e, t, null, s);
    }
    function jD(e, t, s, l) {
      return OD(e, t, s, l);
    }
    function UD(e, t) {
      var s = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
      return XC || (XC = !0, y('The ReactDOM.unstable_createPortal() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactDOM.createPortal() instead. It has the exact same API, but without the "unstable_" prefix.')), JC(e, t, s);
    }
    var VD = {
      Events: [Zo, au, Wg, Mr, st, $c, bI, Ti, Cs, Ql, mc, tl, Iu]
    }, HD = ED({
      findFiberByHostInstance: eh,
      bundleType: 1,
      version: GC,
      rendererPackageName: "react-dom"
    });
    if (!HD && jn && window.top === window.self && (navigator.userAgent.indexOf("Chrome") > -1 && navigator.userAgent.indexOf("Edge") === -1 || navigator.userAgent.indexOf("Firefox") > -1)) {
      var qC = window.location.protocol;
      /^(https?|file):$/.test(qC) && console.info("%cDownload the React DevTools for a better development experience: https://fb.me/react-devtools" + (qC === "file:" ? `
You might need to use a local HTTP server (instead of file://): https://fb.me/react-devtools-faq` : ""), "font-weight:bold");
    }
    xr.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = VD, xr.createPortal = JC, xr.findDOMNode = _D, xr.flushSync = gC, xr.hydrate = PD, xr.render = zD, xr.unmountComponentAtNode = LD, xr.unstable_batchedUpdates = mC, xr.unstable_createPortal = UD, xr.unstable_renderSubtreeIntoContainer = jD, xr.version = GC;
  }()), xr;
}
(function(r) {
  function i() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function")) {
      if (process.env.NODE_ENV !== "production")
        throw new Error("^_^");
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(i);
      } catch (o) {
        console.error(o);
      }
    }
  }
  process.env.NODE_ENV === "production" ? (i(), r.exports = hO()) : r.exports = gO();
})(UE);
const sM = /* @__PURE__ */ BE(UE.exports);
var yO = Object.defineProperty, wO = Object.defineProperties, bO = Object.getOwnPropertyDescriptors, oM = Object.getOwnPropertySymbols, SO = Object.prototype.hasOwnProperty, xO = Object.prototype.propertyIsEnumerable, lM = (r, i, o) => i in r ? yO(r, i, { enumerable: !0, configurable: !0, writable: !0, value: o }) : r[i] = o, Tr = (r, i) => {
  for (var o in i || (i = {}))
    SO.call(i, o) && lM(r, o, i[o]);
  if (oM)
    for (var o of oM(i))
      xO.call(i, o) && lM(r, o, i[o]);
  return r;
};
const HE = { src: "", currentTime: 0, hostTime: 0, muted: !1, paused: !0, volume: 1 }, WE = { currentTimeMaxError: 1, syncInterval: 1e3, retryInterval: 15e3, verbose: !1, log: console.log.bind(console) };
let mo = WE;
function FE(r) {
  mo = Tr(Tr({}, WE), r);
}
function Zv(r, i) {
  if (r.paused)
    return r.currentTime;
  const o = function(c) {
    if (c.player)
      return c.player.beginTimestamp + c.player.progressTime;
    if (c.room)
      return c.room.calibrationTimestamp;
  }(i);
  return o ? r.currentTime + (o - r.hostTime) / 1e3 : r.currentTime;
}
const CO = navigator.userAgent.includes("Safari"), TO = [".aac", ".mid", ".midi", ".mp3", ".ogg", ".oga", ".wav", ".weba"];
var MO = typeof global == "object" && global && global.Object === Object && global, EO = typeof self == "object" && self && self.Object === Object && self, $E = MO || EO || Function("return this")(), lg = $E.Symbol, QE = Object.prototype, IO = QE.hasOwnProperty, AO = QE.toString, $h = lg ? lg.toStringTag : void 0, RO = Object.prototype.toString, uM = lg ? lg.toStringTag : void 0;
function DO(r) {
  return r == null ? r === void 0 ? "[object Undefined]" : "[object Null]" : uM && uM in Object(r) ? function(i) {
    var o = IO.call(i, $h), c = i[$h];
    try {
      i[$h] = void 0;
      var h = !0;
    } catch {
    }
    var m = AO.call(i);
    return h && (o ? i[$h] = c : delete i[$h]), m;
  }(r) : function(i) {
    return RO.call(i);
  }(r);
}
var NO = /\s/, kO = /^\s+/;
function _O(r) {
  return r && r.slice(0, function(i) {
    for (var o = i.length; o-- && NO.test(i.charAt(o)); )
      ;
    return o;
  }(r) + 1).replace(kO, "");
}
function Kb(r) {
  var i = typeof r;
  return r != null && (i == "object" || i == "function");
}
var PO = /^[-+]0x[0-9a-f]+$/i, zO = /^0b[01]+$/i, OO = /^0o[0-7]+$/i, LO = parseInt;
function cM(r) {
  if (typeof r == "number")
    return r;
  if (function(c) {
    return typeof c == "symbol" || function(h) {
      return h != null && typeof h == "object";
    }(c) && DO(c) == "[object Symbol]";
  }(r))
    return NaN;
  if (Kb(r)) {
    var i = typeof r.valueOf == "function" ? r.valueOf() : r;
    r = Kb(i) ? i + "" : i;
  }
  if (typeof r != "string")
    return r === 0 ? r : +r;
  r = _O(r);
  var o = zO.test(r);
  return o || OO.test(r) ? LO(r.slice(2), o ? 2 : 8) : PO.test(r) ? NaN : +r;
}
var kb = function() {
  return $E.Date.now();
}, BO = Math.max, jO = Math.min;
function Yv(r, i, o) {
  var c, h, m, y, g, x, C = 0, I = !1, A = !1, z = !0;
  if (typeof r != "function")
    throw new TypeError("Expected a function");
  function $(Z) {
    var ue = c, oe = h;
    return c = h = void 0, C = Z, y = r.apply(oe, ue);
  }
  function V(Z) {
    return C = Z, g = setTimeout(G, i), I ? $(Z) : y;
  }
  function q(Z) {
    var ue = Z - x;
    return x === void 0 || ue >= i || ue < 0 || A && Z - C >= m;
  }
  function G() {
    var Z = kb();
    if (q(Z))
      return he(Z);
    g = setTimeout(G, function(ue) {
      var oe = i - (ue - x);
      return A ? jO(oe, m - (ue - C)) : oe;
    }(Z));
  }
  function he(Z) {
    return g = void 0, z && c ? $(Z) : (c = h = void 0, y);
  }
  function se() {
    var Z = kb(), ue = q(Z);
    if (c = arguments, h = this, x = Z, ue) {
      if (g === void 0)
        return V(x);
      if (A)
        return clearTimeout(g), g = setTimeout(G, i), $(x);
    }
    return g === void 0 && (g = setTimeout(G, i)), y;
  }
  return i = cM(i) || 0, Kb(o) && (I = !!o.leading, m = (A = "maxWait" in o) ? BO(cM(o.maxWait) || 0, i) : m, z = "trailing" in o ? !!o.trailing : z), se.cancel = function() {
    g !== void 0 && clearTimeout(g), C = 0, c = x = h = g = void 0;
  }, se.flush = function() {
    return g === void 0 ? y : he(kb());
  }, se;
}
class dM extends hl.exports.Component {
  constructor(i) {
    super(i), this.seeking = !1, this.mobileSeeking = !1, this.track = null, this.hoverTime = null, this.offset = 0, this.secondsPrefix = "00:00:", this.minutesPrefix = "00:", this.seekPause = !1, this.handleTouchSeeking = (o) => {
      let c = 0;
      for (let h = 0; h < o.changedTouches.length; h++)
        c = o.changedTouches[h].pageX;
      c = c < 0 ? 0 : c, this.mobileSeeking && this.changeCurrentTimePosition(c);
    }, this.handleSeeking = (o) => {
      this.seeking && this.changeCurrentTimePosition(o.pageX);
    }, this.setTrackWidthState = () => {
      this.track && this.setState({ trackWidth: this.track.offsetWidth });
    }, this.handleTrackHover = (o, c) => {
      if (this.track) {
        const h = this.props.scale || 1;
        let m;
        m = o ? 0 : (c.pageX - this.track.getBoundingClientRect().left) / h, this.setState({ seekHoverPosition: m, trackWidth: this.track.offsetWidth });
      }
    }, this.mouseSeekingHandler = (o) => {
      this.setSeeking(!1, o), this.onMouseUp();
    }, this.setSeeking = (o, c) => {
      c.preventDefault(), this.handleSeeking(c), this.seeking = o, this.setState({ seekHoverPosition: o ? this.state.seekHoverPosition : 0 });
    }, this.mobileTouchSeekingHandler = () => {
      this.setMobileSeeking(!1);
    }, this.setMobileSeeking = (o) => {
      this.mobileSeeking = o, this.setState({ seekHoverPosition: o ? this.state.seekHoverPosition : 0 });
    }, this.renderBufferProgress = () => {
      if (this.props.buffered) {
        const o = Tr(Tr({}, this.getPositionStyle(this.props.buffered)), this.props.bufferColor && { backgroundColor: this.props.bufferColor });
        return wt.createElement("div", { className: "buffered", style: o });
      }
      return null;
    }, this.renderProgress = () => {
      const o = Tr(Tr({}, this.getPositionStyle(this.props.current)), this.props.sliderColor && { backgroundColor: this.props.sliderColor });
      return wt.createElement("div", { className: "connect", style: o });
    }, this.renderHoverProgress = () => {
      const o = Tr(Tr({}, this.getSeekHoverPosition()), this.props.sliderHoverColor && { backgroundColor: this.props.sliderHoverColor });
      return wt.createElement("div", { className: "seek-hover", style: o });
    }, this.renderThumb = () => wt.createElement("div", { className: this.isThumbActive() ? "thumb active" : "thumb", style: this.getThumbHandlerPosition() }, wt.createElement("div", { style: { backgroundColor: this.props.thumbColor }, className: "handler" })), this.onMouseDown = (o) => {
      var c, h;
      this.props.pause && !this.props.paused && (this.props.pause(), this.seekPause = !0), this.setSeeking(!0, o), (h = (c = this.props).onSeekStart) == null || h.call(c);
    }, this.onMouseUp = () => {
      var o, c;
      this.props.play && this.seekPause && (this.props.play(), this.seekPause = !1), (c = (o = this.props).onSeekEnd) == null || c.call(o);
    }, this.props.secondsPrefix && (this.secondsPrefix = this.props.secondsPrefix), this.props.minutesPrefix && (this.minutesPrefix = this.props.minutesPrefix), this.state = { ready: !1, trackWidth: 0, seekHoverPosition: 0 };
  }
  componentDidMount() {
    this.setTrackWidthState(), window.addEventListener("resize", this.setTrackWidthState), window.addEventListener("mousemove", this.handleSeeking), window.addEventListener("mouseup", this.mouseSeekingHandler), window.addEventListener("touchmove", this.handleTouchSeeking), window.addEventListener("touchend", this.mobileTouchSeekingHandler);
  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.setTrackWidthState), window.removeEventListener("mousemove", this.handleSeeking), window.removeEventListener("mouseup", this.mouseSeekingHandler), window.removeEventListener("touchmove", this.handleTouchSeeking), window.removeEventListener("touchend", this.mobileTouchSeekingHandler);
  }
  changeCurrentTimePosition(i) {
    if (this.track) {
      const o = this.props.scale || 1;
      let c = (i - this.track.getBoundingClientRect().left) / o;
      c = Math.min(this.state.trackWidth, Math.max(0, c)), this.setState({ seekHoverPosition: c });
      const h = +(c / this.state.trackWidth * this.props.total).toFixed(0);
      this.props.onChange(h);
    }
  }
  getPositionStyle(i) {
    return { transform: `scaleX(${100 * i / this.props.total / 100})` };
  }
  getThumbHandlerPosition() {
    return { transform: `translateX(${this.state.trackWidth / (this.props.total / this.props.current)}px)` };
  }
  getSeekHoverPosition() {
    return { transform: `scaleX(${100 * this.state.seekHoverPosition / this.state.trackWidth / 100})` };
  }
  getHoverTimePosition() {
    let i = 0;
    return this.hoverTime && (i = this.state.seekHoverPosition - this.hoverTime.offsetWidth / 2, this.props.limitTimeTooltipBySides && (i < 0 ? i = 0 : i + this.hoverTime.offsetWidth > this.state.trackWidth && (i = this.state.trackWidth - this.hoverTime.offsetWidth))), { transform: `translateX(${i}px)` };
  }
  secondsToTime(i) {
    i = Math.round(i + this.offset);
    const o = Math.floor(i / 3600), c = i % 3600, h = Math.floor(c / 60), m = Math.ceil(c % 60);
    return { hh: o.toString(), mm: h < 10 ? "0" + h : h.toString(), ss: m < 10 ? "0" + m : m.toString() };
  }
  getHoverTime() {
    const i = 100 * this.state.seekHoverPosition / this.state.trackWidth, o = Math.floor(+i * (this.props.total / 100)), c = this.secondsToTime(o);
    return this.props.total + this.offset < 60 ? this.secondsPrefix + c.ss : this.props.total + this.offset < 3600 ? this.minutesPrefix + c.mm + ":" + c.ss : c.hh + ":" + c.mm + ":" + c.ss;
  }
  isThumbActive() {
    return this.state.seekHoverPosition > 0 || this.seeking;
  }
  drawHoverTime() {
    return this.props.hideHoverTime ? null : wt.createElement("div", { className: this.isThumbActive() ? "hover-time active" : "hover-time", style: this.getHoverTimePosition(), ref: (i) => this.hoverTime = i }, this.getHoverTime());
  }
  render() {
    return wt.createElement("div", { className: "seek-slider" }, wt.createElement("div", { className: "track", ref: (i) => this.track = i, onMouseMove: (i) => this.handleTrackHover(!1, i), onMouseLeave: (i) => this.handleTrackHover(!0, i), onMouseDown: this.onMouseDown, onTouchStart: (i) => {
      this.setMobileSeeking(!0), this.onMouseDown(i);
    }, onMouseUp: this.onMouseUp, onTouchEnd: this.onMouseUp }, wt.createElement("div", { className: "main" }, this.renderBufferProgress(), this.renderHoverProgress(), this.renderProgress())), this.drawHoverTime(), this.renderThumb());
  }
}
class UO extends hl.exports.Component {
  constructor(i) {
    super(i), this.stageVolume = 0, this.updateVolumeTimer = 0, this.onVolumeSeeking = !1, this.onClickOperationButton = () => {
      const { paused: o } = this.props;
      o ? this.props.play() : this.props.pause();
    }, this.operationButton = () => {
      const { paused: o } = this.props;
      return o ? wt.createElement("img", { src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBhcmlhLWhpZGRlbj0idHJ1ZSIgcm9sZT0iaW1nIiBjbGFzcz0iaWNvbmlmeSBpY29uaWZ5LS1tZGkiIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQgbWVldCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNOCA1LjE0djE0bDExLTdsLTExLTd6IiBmaWxsPSIjZmZmIj48L3BhdGg+PC9zdmc+Cg==" }) : wt.createElement("img", { src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBhcmlhLWhpZGRlbj0idHJ1ZSIgcm9sZT0iaW1nIiBjbGFzcz0iaWNvbmlmeSBpY29uaWZ5LS1tZGkiIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQgbWVldCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTQgMTloNFY1aC00TTYgMTloNFY1SDZ2MTR6IiBmaWxsPSIjZmZmIj48L3BhdGg+PC9zdmc+Cg==" });
    }, this.operationVolumeButton = () => this.props.volume > 0.9 ? wt.createElement("img", { src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBhcmlhLWhpZGRlbj0idHJ1ZSIgcm9sZT0iaW1nIiBjbGFzcz0iaWNvbmlmeSBpY29uaWZ5LS1tZGkiIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQgbWVldCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTQgMy4yM3YyLjA2YzIuODkuODYgNSAzLjU0IDUgNi43MXMtMi4xMSA1Ljg0LTUgNi43djIuMDdjNC0uOTEgNy00LjQ5IDctOC43N2MwLTQuMjgtMy03Ljg2LTctOC43N00xNi41IDEyYzAtMS43Ny0xLTMuMjktMi41LTQuMDNWMTZjMS41LS43MSAyLjUtMi4yNCAyLjUtNE0zIDl2Nmg0bDUgNVY0TDcgOUgzeiIgZmlsbD0iI2ZmZiI+PC9wYXRoPjwvc3ZnPgo=" }) : this.props.volume === 0 ? wt.createElement("img", { src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBhcmlhLWhpZGRlbj0idHJ1ZSIgcm9sZT0iaW1nIiBjbGFzcz0iaWNvbmlmeSBpY29uaWZ5LS1tZGkiIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQgbWVldCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNNyA5djZoNGw1IDVWNGwtNSA1SDd6IiBmaWxsPSIjZmZmIj48L3BhdGg+PC9zdmc+Cg==" }) : wt.createElement("img", { src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBhcmlhLWhpZGRlbj0idHJ1ZSIgcm9sZT0iaW1nIiBjbGFzcz0iaWNvbmlmeSBpY29uaWZ5LS1tZGkiIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQgbWVldCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNNSA5djZoNGw1IDVWNEw5IDltOS41IDNjMC0xLjc3LTEtMy4yOS0yLjUtNC4wM1YxNmMxLjUtLjcxIDIuNS0yLjI0IDIuNS00eiIgZmlsbD0iI2ZmZiI+PC9wYXRoPjwvc3ZnPgo=" }), this.handleClickVolume = () => {
      this.props.volume === 0 ? this.stageVolume !== 0 ? this.props.setVolume(this.stageVolume) : this.props.setVolume(1) : (this.stageVolume = this.props.volume, this.props.setVolume(0));
    }, this.onChange = (o) => {
      this.setState({ currentTime: o }), o && this.changeTime(o);
    }, this.changeTime = Yv((o) => {
      this.props.setCurrentTime(o);
    }, 50), this.onVolumeChange = (o) => {
      this.changeVolume(o), this.setState({ seekVolume: o / 100 });
    }, this.changeVolume = Yv((o) => {
      this.props.setVolume(o / 100);
    }, 50), this.onVolumeSeekStart = () => {
      this.onVolumeSeeking = !0;
    }, this.onVolumeSeekEnd = Yv(() => {
      this.onVolumeSeeking = !1;
    }, 500), this.onProgressSeekStart = () => this.setState({ isPlayerSeeking: !0 }), this.onProgressSeekEnd = Yv(() => {
      this.setState({ isPlayerSeeking: !1 });
    }, 500), this.state = { isPlayerSeeking: !1, isVolumeHover: !1, seekVolume: 1, visible: !0, currentTime: 0 }, this.stageVolume = i.volume;
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
    const { duration: i, currentTime: o } = this.props;
    return wt.createElement("div", { className: "player-controller", style: { opacity: this.props.visible ? "1" : "0" } }, wt.createElement("div", { className: "player-controller-progress" }, wt.createElement(dM, { total: i, current: this.state.currentTime, onChange: this.onChange, buffered: this.props.buffered, bufferColor: "rgba(255,255,255,0.3)", hideHoverTime: !0, limitTimeTooltipBySides: !0, onSeekStart: this.onProgressSeekStart, onSeekEnd: this.onProgressSeekEnd, play: this.props.play, pause: this.props.pause, paused: this.props.paused, scale: this.props.scale })), wt.createElement("div", { className: "player-controller-actions" }, wt.createElement("div", { className: "player-controller-actions-left" }, wt.createElement("div", { onClick: this.onClickOperationButton, className: "player-controller-play" }, this.operationButton()), wt.createElement("div", { className: "player-volume-box", onMouseEnter: () => this.setState({ isVolumeHover: !0 }), onMouseLeave: () => this.setState({ isVolumeHover: !1 }) }, wt.createElement("div", { onClick: this.handleClickVolume, className: "player-volume" }, this.operationVolumeButton()), wt.createElement("div", { className: "player-volume-slider" }, wt.createElement(dM, { total: 100, current: 100 * this.state.seekVolume, onChange: this.onVolumeChange, onSeekStart: this.onVolumeSeekStart, onSeekEnd: this.onVolumeSeekEnd, scale: this.props.scale, limitTimeTooltipBySides: !0, hideHoverTime: !0 })))), wt.createElement("div", { className: "player-mid-box-time" }, fM(Math.floor(o / 1e3)), " /", " ", fM(Math.floor(i / 1e3)))));
  }
}
function fM(r) {
  const i = r % 60, o = (r - i) / 60;
  if (o >= 60) {
    const c = o % 60;
    return `${Qh((o - c) / 60)}:${Qh(c)}:${Qh(i)}`;
  }
  return `${Qh(o)}:${Qh(i)}`;
}
function Qh(r) {
  return r <= 9 ? `0${r}` : `${r}`;
}
let VO = 99999;
var eS, Sd;
(Sd = eS || (eS = {}))[Sd.Idle = 0] = "Idle", Sd[Sd.Playing = 1] = "Playing", Sd[Sd.Paused = 2] = "Paused";
let ji = {};
function Gn(r, ...i) {
  mo.verbose && console.log(`[RTCEffect] ${r}`, ...i);
}
function HO(r, i, o) {
  function c(m) {
    ji[m].playState === 0 ? (r.playEffect(m, o, 0, 1, 0, 100, !1, 0).then(() => {
      Gn(">>> Play Success", { playingId: m });
    }), ji[m].playState = 1) : Gn(">>> Skip Play", { playingId: m, state: ji[m].playState });
  }
  function h(m) {
    ji[m].playState = 0, ji[m].previousVideoJSAdvance = 0, ji[m].previousSeekTargetTime = 0, ji[m].previousBeginSeekTime = 0;
  }
  i.one("ready", () => {
    var m;
    const y = ((m = i == null ? void 0 : i.tagAttributes) == null ? void 0 : m.src) || "";
    y.endsWith("mp3") || y.endsWith("wav") || y.endsWith("m4a") || (Gn(">>> Mute js player", { src: y }), i.muted(!0), i.muted = (x) => !1);
    const g = function() {
      const x = VO--, C = { playState: eS.Idle, previousVideoJSAdvance: 0, previousSeekTargetTime: 0, previousBeginSeekTime: 0 };
      return ji[x] = C, x;
    }();
    Gn(">>> Setup", { playingId: g, src: y }), r.addListener("error", (x) => {
      Gn(">>> Error", { soundId: x }), h(x);
    }), r.addListener("effectFinished", (x) => {
      Gn(">>> Finished", { soundId: x }), h(x);
    }), i.on("play", () => {
      switch (ji[g].playState) {
        case 0:
          Gn(">>> Start play", { playingId: g }), c(g);
          break;
        case 2:
          Gn(">>> Resume play", { playingId: g }), r.resumeEffect(g), ji[g].playState = 1;
      }
    }), i.on("pause", () => {
      const x = ji[g].playState;
      switch (x) {
        case 1:
          Gn(">>> Pause play", { playingId: g }), r.pauseEffect(g), ji[g].playState = 2;
          break;
        default:
          Gn(">>> Skip Pause", { playingId: g, currenState: x });
      }
    }), i.on("timeupdate", () => {
      r.getEffectCurrentPosition(g).then((x) => {
        const C = ji[g], I = x / 1e3, A = i.currentTime(), z = C.previousSeekTargetTime !== 0 && C.previousBeginSeekTime !== 0;
        if (Gn(`>>> EffectSecond rtc: ${I} js: ${A} seeking: ${z}`, { playingId: g }), C.playState == 0)
          return void (i.paused() || (Gn(">>> Play effect due to time update.", { playingId: g }), c(g)));
        if (z && I < C.previousSeekTargetTime)
          return;
        if (C.playState !== 1)
          return void Gn(">>> Skip timupdate", { playingId: g, state: C.playState, jsTime: i.currentTime(), rtcEffectTime: I });
        function $(q, G) {
          r.setEffectPosition(G, 1e3 * q), C.previousBeginSeekTime = Date.now() / 1e3, C.previousSeekTargetTime = q;
        }
        const V = C.previousBeginSeekTime;
        if (x > 0) {
          const q = A - I, G = Math.abs(q), he = 0.5;
          if (G > he)
            if (z) {
              const se = C.previousSeekTargetTime - I, Z = Date.now() / 1e3 - V, ue = Z + (q > 0 ? q : 0), oe = A + ue;
              $(oe, g), Gn(">>> Start seeking after seeking lag", { jsPlayerTime: A, rtcEffectTime: I, jsPlayerTimerAdvance: q, lastSeekingCost: Z, estimatedRTCLag: ue, targetRTCSeekTime: oe, previousBeginSeekTime: V, timeElapse: se });
            } else if (G > 10)
              $(A, g), Gn(">>> DirectSeek", { time: A, rtcEffectTime: I, jsPlayerTimerAdvance: q });
            else {
              const se = C.previousVideoJSAdvance, Z = 0, ue = A + Z;
              C.previousVideoJSAdvance = Z, $(ue, g), Gn(">>> Start seeking with lag", { jsPlayerTime: A, rtcEffectTime: I, jsPlayerTimerAdvance: q, previousAdvance: se, estimatedRTCLag: Z, targetRTCSeekTime: ue });
            }
          else
            z && (Gn(">>> SeekingFinish no lag", { jsPlayerTime: A, rtcEffectTime: I, jsPlayerTimerAdvance: q, previousBeginSeekTime: V, rtcLagTolerance: he }), C.previousBeginSeekTime = 0, C.previousSeekTargetTime = 0);
        }
      });
    }), i.on("dispose", () => {
      ji[g].playState && (r.stopEffect(g), delete ji[g], Gn(">>> Dispose", { playingId: g }));
    });
  });
}
class WO extends hl.exports.Component {
  constructor() {
    super(...arguments), this.putAttributes = (i) => {
      const { context: o } = this.props, c = o.getAttributes() || {};
      for (const h in i)
        c[h] !== i[h] && o.updateAttributes([h], i[h]);
    };
  }
  render() {
    const { context: i } = this.props, o = i.getRoom(), c = o ? void 0 : i.getDisplayer(), h = this.putAttributes;
    return wt.createElement(FO, { room: o, player: c, context: i, plugin: { putAttributes: h } });
  }
}
class FO extends hl.exports.Component {
  constructor(i) {
    super(i), this.alertMask = null, this.container = wt.createRef(), this.controllerHiddenTimer = 0, this.syncPlayerTimer = 0, this.retryCount = 0, this.decreaseRetryTimer = 0, this.noSoundSyncCount = 0, this.showController = () => {
      this.setState({ controllerVisible: !0 }), this.debounceHidingController();
    }, this.play = () => {
      var o;
      const c = (o = this.props.room) == null ? void 0 : o.calibrationTimestamp;
      this.debug(">>> play", { paused: !1, hostTime: c }), this.isEnabled() && this.props.plugin.putAttributes({ paused: !1, hostTime: c });
    }, this.pause = () => {
      const o = Zv(this.getAttributes(), this.props);
      this.debug(">>> pause", { paused: !0, currentTime: o }), this.isEnabled() && this.props.plugin.putAttributes({ paused: !0, currentTime: o });
    }, this.setVolume = (o) => {
      this.debug(">>> volume", { volume: o }), this.isEnabled() && this.props.plugin.putAttributes({ volume: o }), this.isEnabled() && this.props.plugin.putAttributes({ volume: o, muted: o === 0 });
    }, this.setCurrentTime = (o) => {
      var c;
      const h = (c = this.props.room) == null ? void 0 : c.calibrationTimestamp;
      this.debug(">>> seek", { currentTime: o / 1e3, hostTime: h }), this.isEnabled() && this.props.plugin.putAttributes({ currentTime: o / 1e3, hostTime: h });
    }, this.resetPlayer = () => {
      var o;
      (o = this.player) == null || o.autoplay(!1), this.state.NoSound || (this.debug(">>> ended", { paused: !0, currentTime: 0 }), this.isEnabled() && this.props.plugin.putAttributes({ paused: !0, currentTime: 0 }));
    }, this.syncPlayerWithAttributes = () => {
      var o;
      const c = this.getAttributes();
      if (!c)
        return;
      const h = this.player;
      if (!h || this.state.NoSound && (this.noSoundSyncCount += 1) % 8 != 0)
        return;
      h.paused() !== c.paused && (this.debug("<<< paused -> %o", c.paused), c.paused ? h.pause() : (o = h.play()) == null || o.catch(this.catchPlayFail)), h.muted() !== c.muted && (this.debug("<<< muted -> %o", c.muted), h.muted(c.muted)), h.volume() !== c.volume && (this.debug("<<< volume -> %o", c.volume), h.volume(c.volume));
      const m = Zv(c, this.props);
      let y = mo.currentTimeMaxError;
      this.state.NoSound && (y *= 3), m > h.duration() ? this.resetPlayer() : Math.abs(h.currentTime() - m) > y && (this.debug("<<< currentTime -> %o", m), h.currentTime(m));
    }, this.debounceHidingController = () => {
      this.controllerHiddenTimer && (clearTimeout(this.controllerHiddenTimer), this.controllerHiddenTimer = 0), this.controllerHiddenTimer = setTimeout(() => {
        this.setState({ controllerVisible: !1 }), this.controllerHiddenTimer = 0;
      }, 3e3);
    }, this.decreaseRetryCount = () => {
      this.player && this.retryCount > 0 && (this.retryCount = this.retryCount - 1);
    }, this.catchPlayFail = (o) => {
      var c, h;
      const m = String(o);
      if (CO && m.includes("NotAllowedError") || m.includes("interact"))
        (c = this.player) == null || c.autoplay("any"), this.setState({ NoSound: !0 });
      else {
        const y = (h = this.player) == null ? void 0 : h.error();
        y && (this.retryCount <= 3 ? (this.initPlayer(), this.retryCount = this.retryCount + 1) : (this.debug("catch videojs media error", y), this.setState({ MediaError: !0 }))), this.debug("catch error", o);
      }
    }, this.fixPlayFail = () => {
      this.debug("try to fix play state"), this.setState({ NoSound: !1 });
      const { muted: o, volume: c } = this.getAttributes();
      this.player && (this.player.muted(o), this.player.volume(c));
    }, this.initPlayer = async () => {
      var o;
      (o = this.player) == null || o.dispose(), this.player = void 0, this.debug("creating elements ...");
      const { type: c, src: h, poster: m } = this.getAttributes(), y = document.createElement("div");
      y.setAttribute("data-vjs-player", "");
      const g = document.createElement("video");
      g.className = "video-js", m && (g.poster = m), g.setAttribute("playsInline", ""), g.setAttribute("webkit-playsinline", "");
      const x = document.createElement("source");
      new URL(h).pathname.endsWith(".m3u8") ? x.type = "application/x-mpegURL" : g.src = h, x.src = h, c && (x.type = c), g.appendChild(x), y.appendChild(g), this.container.current.appendChild(y), await new Promise((A) => (window.requestAnimationFrame || window.setTimeout)(A)), this.debug("initializing videojs() ...");
      const C = tT(g);
      this.player = C, window.player = C, C.one("loadedmetadata", this.gracefullyUpdate);
      const I = window.__mediaPlayerAudioEffectClient;
      I !== void 0 && HO(I, C, h), C.on("ready", () => {
        var A;
        (A = mo.onPlayer) == null || A.call(mo, C), C.on("timeupdate", this.gracefullyUpdate), C.on("volumechange", this.gracefullyUpdate), C.on("seeked", this.gracefullyUpdate), C.on("play", this.gracefullyUpdate), C.on("pause", this.gracefullyUpdate), C.on("ended", this.resetPlayer);
      }), C.on("error", this.catchPlayFail), this.setState({ MediaError: !1 });
    }, this.gracefullyUpdate = () => this.setState({ updater: !this.state.updater }), this.setupAlert = (o) => {
      o && (o.addEventListener("touchstart", this.fixPlayFail), o.addEventListener("click", this.fixPlayFail)), this.alertMask = o;
    }, this.setupReload = (o) => {
      o && (o.addEventListener("touchstart", this.initPlayer), o.addEventListener("click", this.initPlayer));
    }, this.state = { NoSound: !1, MediaError: !1, updater: !1, controllerVisible: !1 }, i.room && function(o) {
      if (!o.calibrationTimestamp)
        throw new Error("@netless/app-media-player@0.1.0-alpha.5 requires white-web-sdk@^2.13.8 to work properly.");
    }(i.room);
  }
  getAttributes() {
    const { context: i } = this.props;
    let o = i.getAttributes();
    if (o) {
      if (o = Tr(Tr({}, HE), o), this.player) {
        let h = Zv(o, this.props), m = this.player.duration();
        !o.paused && h > m && (c = Tr({}, o), o = wO(c, bO({ currentTime: 0, paused: !0 })), this.resetPlayer());
      }
      var c;
      return o;
    }
  }
  isShowingPoster() {
    const i = this.getAttributes();
    return !(i != null && i.src) || TO.some((o) => i.src.endsWith(o));
  }
  render() {
    var i, o;
    if (!this.props.room && !this.props.player)
      return null;
    const c = this.getAttributes();
    if (!c)
      return null;
    const h = 1e3 * (((i = this.player) == null ? void 0 : i.duration()) || 1e3), m = ((o = this.player) == null ? void 0 : o.bufferedPercent()) || 0;
    return wt.createElement("div", { className: this.isEnabled() ? "vjs-p" : "vjs-p disabled", onMouseEnter: this.showController, onMouseMove: this.showController }, wt.createElement("div", { className: "video-js-plugin-player", ref: this.container }), this.isShowingPoster() && wt.createElement("div", { className: "video-js-plugin-poster" }, c.poster && wt.createElement("img", { src: c.poster, alt: "", draggable: !1 })), wt.createElement(UO, { duration: h, volume: c.volume, setVolume: this.setVolume, paused: c.paused, play: this.play, pause: this.pause, currentTime: 1e3 * Zv(c, this.props), setCurrentTime: this.setCurrentTime, buffered: h * m, visible: !0 }), this.state.NoSound && wt.createElement("div", { ref: this.setupAlert, className: "videojs-plugin-muted-alert" }), this.state.MediaError && wt.createElement("div", { className: "videojs-plugin-recovery-mode" }, wt.createElement("button", { ref: this.setupReload }, "Reload Player")));
  }
  debug(i, ...o) {
    mo.verbose && mo.log(`[MediaPlayer] ${i}`, ...o);
  }
  componentDidMount() {
    this.debug("app version =", "0.1.0-alpha.5"), this.debug("video.js version =", tT.VERSION), this.initPlayer(), this.props.context.emitter.on("attributesUpdate", this.syncPlayerWithAttributes), this.syncPlayerTimer = setInterval(this.syncPlayerWithAttributes, mo.syncInterval), this.decreaseRetryTimer = setInterval(this.decreaseRetryCount, mo.retryInterval);
  }
  componentWillUnmount() {
    var i;
    this.debug("unmount"), this.props.context.emitter.off("attributesUpdate", this.syncPlayerWithAttributes), (i = this.player) == null || i.dispose(), clearInterval(this.syncPlayerTimer), clearInterval(this.decreaseRetryTimer);
  }
  isEnabled() {
    return this.props.context.getIsWritable();
  }
}
const tS = { kind: "MediaPlayer", setup(r) {
  let i = r.getAttributes();
  if (!i || !i.src)
    return r.emitter.emit("destroy", { error: new Error("[MediaPlayer]: Missing 'attributes'.'src'.") });
  i = Tr(Tr({}, HE), i);
  const o = r.getBox();
  o.mountStyles(`.vjs-p{display:flex;flex-grow:1}.vjs-p *{pointer-events:auto}.vjs-p.disabled *{pointer-events:none}.vjs-p .video-js-plugin-poster{position:absolute;top:0;left:0;right:0;bottom:0;background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgQAAACACAYAAAB0vHFxAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAACBKADAAQAAAABAAAAgAAAAACE3oPTAAAKXUlEQVR4Ae3dYW4ktxEG0LW9FwkC2McycokAOUGAXMLwtQwYvomdP4akHUnNnm6SVUU+/xqpe8ji+yiDWz3a/e7L5v/98se//3pL8K9//O+7t19Hv85eX7RP9vnllz2h4/rkd+wz+ir/0cLfjv/9t1/6igABAgQIENhRwIFgx9StmQABAgQIPAg4EDyA+JIAAQIECOwo8HXHRVvzPIHRzwBHjz9PKudMo31Hj59TdZ2qsueXvb5sO0GHIFsi6iFAgAABAgECOgQB6KbsJ5Dtt0L6rWyPkeRXO+fs+WWvL1v6OgTZElEPAQIECBAIENAhCEA3ZT8Bzwj7WUaMJL8I9X5zZs8ve339kugzkg5BH0ejECBAgACB0gIOBKXjUzwBAgQIEOgj4EDQx9EoBAgQIECgtIADQen4FE+AAAECBPoIOBD0cTQKAQIECBAoLeC3DErHp/iWgE8Zt4RyX5df7nxa1Y3Ob/T4rfWtdl2HYLVErYcAAQIECFwQWL5DsPoJcvX1XdjTpd4iv1JxvStWfu9IfCORwLP7U4cgUXhKIUCAAAECUQIOBFHy5iVAgAABAokEHAgShaEUAgQIECAQJXD7MwTPPqOIWujVeUevb/T4V9ftfecE5HfOKetd8suajLoiBHQIItTNSYAAAQIEkgnc7hAkW0/3ckb/e9qjx+8OYsBvBOT3DUe5L+RXLjIFDxTQIRiIa2gCBAgQIFBFoNkh2P0Z2+j1jx4/+0asvv7q9d/dH9XXX73+3fO7u/7W+3fbHzoErR3hOgECBAgQ2ECg2SHwjG2DXRC4xOj9tdufAHpHLb/eonPHk9+xd7TPcXX9r+oQ9Dc1IgECBAgQKCfgQFAuMgUTIECAAIH+Ag4E/U2NSIAAAQIEygk0P0MQvaLsz3hb9bWu840WOJ5ffsc+2a/KL3tC6jsSmL1/dQiO0nCNAAECBAhsItDsEMw+oTzrHl1f61OorevPrvfZ+6N9WvVmr09+xwnKr7ZP9vyOdcdfze7Tuz4dgvF7ygwECBAgQCC9QLNDkH0F0X+C45NdoHZ99rf8aguofqRA7/8/6BCMTMvYBAgQIECgiED5DkHvZyhFcjtdJp/TVClvlF/KWE4XJb/TVG68INB7f+kQXAjBWwgQIECAwGoCDgSrJWo9BAgQIEDggoADwQU0byFAgAABAqsJfO39DGI1IOuJFbA/Y/3vzi6/u4Kx7189v7vru/v+2HTfz65D8N7EdwgQIECAwHYCw3/LYLUT1HY7pLFg+TaAkl+WX/KAGuXJrwEUfLlaPjoEwRvG9AQIECBAIIPA8A5B779JKQOaGl4F5PtqUfGV/Cqm9lqz/F4tMr6qlo8OQcZdpCYCBAgQIDBZYHiHoNozlMn+5aeTb+0I5Se/2gK5q6/286VDkHs/qY4AAQIECEwRcCCYwmwSAgQIECCQW8CBIHc+qiNAgAABAlMEhn+GYMoqTEKAAAEC7wSqPcN+twDfmCqgQzCV22QECBAgQCCnQHiHoPoJtlV/63rObfFaVfX6X1dy7VX19Vev/1pqr++qvv7q9b8m4dVHAtny1SH4KCXfI0CAAAECmwmEdwiq/U1Om+2PL/Kpnbj85FdbYO3qs/186hCsvd+sjgABAgQInBJwIDjF5CYCBAgQILC2gAPB2vlaHQECBAgQOCUQ/hmCbJ+yPKW20U3yqR22/ORXW2Dt6qN/Ph/n1yFYe79ZHQECBAgQOCXgQHCKyU0ECBAgQGBtAQeCtfO1OgIECBAgcErAgeAUk5sIECBAgMDaAg4Ea+drdQQIECBA4JTA1+///OGnoztd52N/fC7g58PPx+e748sX+8P+qLQ/dAiO0nKNAAECBAhsIuBAsEnQlkmAAAECBI4EHAiOdFwjQIAAAQKbCDgQbBK0ZRIgQIAAgSMBB4IjHdcIECBAgMAmAuH/lsHP//zvb5tYl1ymfErG9lK0/F4oSr6QX8nYThcdne/j/DoEp6NzIwECBAgQWFfAgWDdbK2MAAECBAicFnAgOE3lRgIECBAgsK5A+GcIfv39Pz++5X18pvH2mtfzBeQz37znjPLrqTl/LPnNN585Y7Z8dQhmpm8uAgQIECCQVCC8Q1C9I9Cqv3U96b54Kat6/S8Lufii+vqr138xtpe3VV9/9fpfgvDiQ4Fs+eoQfBiTbxIgQIAAgb0EwjsEe3FbLQECBOYJZPsT6LyVm+mKgA7BFTXvIUCAAAECiwk4ECwWqOUQIECAAIErAg4EV9S8hwABAgQILCYw/DMEnmEttmMeliPfB5BiX8qvWGAP5crvASTZl9Xy0SFItoGUQ4AAAQIEIgSGdwiy/U1MEcgrzynf2unKT361BXJXX+3nS4cg935SHQECBAgQmCIwvENQ7RnKFPWFJpFv7TDlJ7/aArmrr/bzpUOQez+pjgABAgQITBH4Wu0EM0XFJGkE7M80UVwqRH6X2NK8afX87q7v7vvTBP13IToE2RJRDwECBAgQCBBwIAhANyUBAgQIEMgm4ECQLRH1ECBAgACBAIHhv2Uwek2rPcPp7cWnt+jc8eQ317v3bPLrLWq8twK995cOwVtdrwkQIECAwKYC5TsE1f4mqNn7jM9s8b7zya+v5+zR5DdbfK/5eu8vHYK99o/VEiBAgACBDwWaHYLezyg+rOLGN6Pra53QWtdvLP3UW6N9WkVmr09+xwnKr7ZP9vyOdcdfze7Tuz4dgvF7ygwECBAgQCC9QLNDEL2C3ieg3utp1de63rueZ8fLXt+z6+l9f3af7PX1zuPZ8bL7ZK/vWW/39xWYvT90CPrmZzQCBAgQIFBSwIGgZGyKJkCAAAECfQUcCPp6Go0AAQIECJQUaH6GIPpT1iVVFX1aIHp/zX5GdxqmyI3yKxLUJ2XK7xOYv78d7XNcXf+rOgT9TY1IgAABAgTKCTQ7BLv/CWr0+kePn31HVl9/9frv7o/q669e/+753V1/6/277Q8dgtaOcJ0AAQIECGwg0OwQbGBwuMTRz5BGj3+4OBdvC8jvNmHoAPIL5Td5MgEdgmSBKIcAAQIECEQI3O4QrP6MZfT6Ro8fsal2mlN+tdOWX+38VN9XQIegr6fRCBAgQIBASQEHgpKxKZoAAQIECPQVcCDo62k0AgQIECBQUuD2Zwiyr3r1Z4Srry/7/rpbn/zuCsa+X36x/mY/Fnh2f+oQHHu6SoAAAQIEthBYvkOwRYoW+anAsyfkTwdyIURAfiHs3SYdnd/o8btBFBlIh6BIUMokQIAAAQIjBRwIRuoamwABAgQIFBFwICgSlDIJECBAgMBIAQeCkbrGJkCAAAECRQQcCIoEpUwCBAgQIDBSwG8ZjNQ19nABnzIeTjx0AvkN5R0+ePb8stc3PKAnJ9AheBLM7QQIECBAYEUBHYIVU91oTf49+9phy09+IwXsr+d0dQie83I3AQIECBBYUkCHYMlY8yxq9DO80ePnkYypZLTv6PFj1PaZNXt+2evLtlN0CLIloh4CBAgQIBAg4EAQgG5KAgQIECCQTcCBIFsi6iFAgAABAgEC/wdVfx9UuC8B6AAAAABJRU5ErkJggg==);background-repeat:repeat-x;background-position:0 50%;display:flex;align-items:center;justify-content:center}.vjs-p .video-js-plugin-poster img{box-shadow:0 0 5px 10px #0006}.vjs-p .player-controller,.vjs-p .videojs-plugin-muted-alert{pointer-events:auto}.vjs-p.disabled .videojs-plugin-close-icon,.vjs-p.disabled .player-controller{pointer-events:none}.vjs-p .video-js-plugin-player{position:absolute;top:0;left:0;right:0;bottom:0}.video-js,[data-vjs-player]{width:100%;height:100%}.vjs-p .videojs-plugin-muted-alert{pointer-events:auto;cursor:pointer;position:absolute;top:0;left:0;right:0;bottom:0;z-index:43}.vjs-p .videojs-plugin-muted-alert:before{pointer-events:auto;cursor:pointer;position:absolute;top:0;left:0;right:0;bottom:0;z-index:43;content:"\\f104";background:rgba(0,0,0,.3);font-family:VideoJS;font-size:2em;display:flex;align-items:center;justify-content:center;color:#fff}.vjs-p .videojs-plugin-recovery-mode{pointer-events:auto;cursor:pointer;position:absolute;top:0;left:0;right:0;bottom:0;z-index:44}.vjs-p .videojs-plugin-recovery-mode button{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}.vjs-p .seek-slider{position:relative;width:100%}.vjs-p .seek-slider:focus{outline:none}.vjs-p .seek-slider .track{padding:10px 0;cursor:pointer;outline:none}.vjs-p .seek-slider .track:focus{border:0;outline:none}.vjs-p .seek-slider .track .main{width:100%;height:3px;background-color:#ffffff4d;border-radius:30px;position:absolute;left:0;top:8.5px;transition:transform .4s;outline:none}.vjs-p .seek-slider .track .main:focus{border:0;outline:none}.vjs-p .seek-slider .track .main .buffered{position:absolute;background-color:#ffffff4d;width:100%;height:100%;transform:scaleX(.8);z-index:2;transform-origin:0 0}.vjs-p .seek-slider .track .main .seek-hover{position:absolute;background-color:#ffffff80;width:100%;height:100%;z-index:1;transform:scaleX(.6);transform-origin:0 0;opacity:0;transition:opacity .4s}.vjs-p .seek-slider .track .main .connect{position:absolute;background-color:#fff;width:100%;height:100%;z-index:3;left:0;transform:scaleX(.13);transform-origin:0 0}.vjs-p .seek-slider .track.active .main{transform:scaleY(2)}.vjs-p .seek-slider .thumb{pointer-events:none;position:absolute;width:12px;height:12px;left:-6px;top:4px;z-index:4;transform:translate(100px)}.vjs-p .seek-slider .thumb .handler{border-radius:100%;width:100%;height:100%;background-color:#fff;opacity:0;transform:scale(.4);cursor:pointer;transition:transform .2s;pointer-events:none}.vjs-p .seek-slider .thumb.active .handler{opacity:1;transform:scale(1)}.vjs-p .seek-slider .hover-time{position:absolute;background-color:#0000004d;line-height:18px;font-size:16px;color:#ddd;top:-25px;left:0;padding:5px 10px;border-radius:5px;box-shadow:0 0 5px #0000004d;opacity:0;transform:translate(150px);pointer-events:none}.vjs-p .seek-slider .hover-time.active{opacity:1}.vjs-p .seek-slider:hover .track .main .seek-hover{opacity:1}.vjs-p .player-controller{position:absolute;z-index:100;bottom:0px;left:0;width:100%;display:flex;flex-direction:column;justify-content:center;align-items:stretch;height:64px;background-image:linear-gradient(0deg,#000,transparent);transition:opacity .2s;color:#fff}.vjs-p .player-menu-box{display:flex;align-items:center;justify-content:center;flex-direction:column;margin-bottom:40px}.vjs-p .player-menu-cell{width:100%;text-align:center;font-size:12px;color:#7a7b7c}.vjs-p .player-multiple-play{width:64px;height:120px}.vjs-p .player-controller-actions-left{display:flex;justify-content:center;align-items:center;flex-shrink:0}.vjs-p .player-right-box{font-size:14px;color:#7a7b7c;cursor:pointer;margin-right:12px}.vjs-p .player-controller-actions{display:flex;flex-direction:row;justify-content:space-between;align-items:center;padding-left:8px;padding-right:8px;margin-top:2px}.vjs-p .player-mid-box-time{font-size:9px;display:flex;justify-content:center;align-items:center;color:#fff;flex-shrink:0;margin-right:8px;font-family:monospace}.vjs-p .player-controller-play{display:flex;align-items:center;justify-content:center;cursor:pointer;padding-right:4px}.vjs-p .player-controller-progress{width:calc(100% - 28px);margin-left:14px;display:flex;align-items:center;justify-content:center;margin-top:8px}.vjs-p .player-volume{display:flex;align-items:center;justify-content:center;cursor:pointer;margin-right:16px;margin-left:8px}.vjs-p .player-volume-slider{width:60px;margin-right:12px;display:flex;align-items:center}.vjs-p .player-volume-box{display:flex;flex-direction:row}.netless-app-media-player-container{display:flex;position:relative;height:100%}
`);
  const c = document.createElement("div");
  c.classList.add("netless-app-media-player-container"), sM.render(wt.createElement(WO, { context: r }), c), o.mountContent(c), r.emitter.on("destroy", () => {
    console.log("[MediaPlayer]: destroy"), sM.unmountComponentAtNode(c);
  });
} }, $O = () => {
  Wt.debug && FE({ verbose: !0 }), Wt.register({
    kind: qb.kind,
    src: qb
  }), Wt.register({
    kind: tS.kind,
    src: tS
  });
}, rL = {
  DocsViewer: qb.kind,
  MediaPlayer: tS.kind
};
var QO = /* @__PURE__ */ ((r) => (r.Init = "Init", r.AttributesUpdate = "AttributesUpdate", r.SetAttributes = "SetAttributes", r.RegisterMagixEvent = "RegisterMagixEvent", r.RemoveMagixEvent = "RemoveMagixEvent", r.RemoveAllMagixEvent = "RemoveAllMagixEvent", r.RoomStateChanged = "RoomStateChanged", r.DispatchMagixEvent = "DispatchMagixEvent", r.ReciveMagixEvent = "ReciveMagixEvent", r.NextPage = "NextPage", r.PrevPage = "PrevPage", r.SDKCreate = "SDKCreate", r.OnCreate = "OnCreate", r.SetPage = "SetPage", r.GetAttributes = "GetAttributes", r.Ready = "Ready", r.Destory = "Destory", r.StartCreate = "StartCreate", r.WrapperDidUpdate = "WrapperDidUpdate", r.DispayIframe = "DispayIframe", r.HideIframe = "HideIframe", r.GetRootRect = "GetRootRect", r.ReplayRootRect = "ReplayRootRect", r.PageTo = "PageTo", r))(QO || {}), ZO = /* @__PURE__ */ ((r) => (r.WrapperDidMount = "WrapperDidMount", r.IframeLoad = "IframeLoad", r))(ZO || {});
const al = {
  Ready: "Ready",
  RootRect: "ReplayRootRect",
  Message: "message",
  ComputeStyle: "computeStyle",
  Load: "load",
  DisplayerState: "displayerState",
  Show: "show",
  Hide: "hide"
}, YO = (r, i) => new Array(r).fill(0).map((o, c) => i(c)), dn = class {
  constructor(r, i) {
    this.manager = r, this.appManager = i, this.magixEventMap = /* @__PURE__ */ new Map(), this.cssList = [], this.allowAppliances = ["clicker"], this.bridgeDisposer = mM, this.rootRect = null, this.sideEffectManager = new up(), this.execListenIframe = xs((o) => {
      this.listenIframe(o);
    }, 50), this.onPhaseChangedListener = (o) => {
      o === eT.Playing && this.computedStyleAndIframeDisplay();
    }, this.stateChangeListener = (o) => {
      o = { ...o }, o.cameraState = this.manager.cameraState, this.postMessage({ kind: "RoomStateChanged", payload: o }), o.cameraState && (dn.emitter.emit("GetRootRect"), this.computedStyle(o)), o.memberState && (this.computedZindex(), this.updateStyle()), o.sceneState && this.computedIframeDisplay(o, this.attributes);
    }, this.displayer = dn.displayer = i.displayer, this.iframe = this._createIframe(), this.sideEffectManager.addDisposer(
      dn.emitter.on("ReplayRootRect", (o) => {
        this.rootRect = o;
      }),
      al.RootRect
    ), this.sideEffectManager.addDisposer(
      dn.emitter.on("HideIframe", () => {
        this.iframe.className = dn.hiddenClass;
      }),
      al.Hide
    ), this.sideEffectManager.addDisposer(
      dn.emitter.on("DispayIframe", () => {
        this.iframe.className = "";
      }),
      al.Show
    ), this.sideEffectManager.addDisposer(
      dn.emitter.on("created", () => {
        this.bridgeDisposer(), this.bridgeDisposer = Ss(() => {
          var c;
          const o = this.attributes;
          if (o.url) {
            const h = (c = this.iframe) == null ? void 0 : c.src;
            h && h !== o.url && this.execListenIframe(o);
          }
          o.displaySceneDir && this.computedIframeDisplay(this.displayer.state, o), (o.width || o.height) && this.iframe && (this.iframe.width = `${o.width}px`, this.iframe.height = `${o.height}px`), this.postMessage({ kind: "AttributesUpdate", payload: o });
        });
      })
    ), this.sideEffectManager.addDisposer(
      r.emitter.on("cameraStateChange", () => {
        this.computedStyle(this.displayer.state);
      })
    ), dn.onCreate(this);
  }
  static onCreate(r) {
    dn.emitter.emit("StartCreate"), dn.emitter.emit("OnCreate", r), dn.emitter.emit("created");
  }
  insert(r) {
    const i = {
      url: r.url,
      width: r.width,
      height: r.height,
      displaySceneDir: r.displaySceneDir,
      useClicker: r.useClicker || !1,
      useSelector: r.useSelector
    };
    this.setAttributes(i);
    const o = () => {
      this.getIframe(), this.listenIframe(this.attributes), this.listenDisplayerState(), dn.emitter.emit("GetRootRect");
    };
    if (this.getIframe())
      o();
    else {
      const c = this.sideEffectManager.addDisposer(
        dn.emitter.on("WrapperDidMount", () => {
          o(), this.sideEffectManager.flush(c);
        })
      ), h = this.sideEffectManager.addDisposer(
        dn.emitter.on("WrapperDidUpdate", () => {
          o(), this.sideEffectManager.flush(h);
        })
      );
    }
    return this.attributes.useSelector && this.allowAppliances.push("selector"), this.computedStyle(this.displayer.state), this.listenDisplayerCallbacks(), this.getComputedIframeStyle(), this.sideEffectManager.addEventListener(
      window,
      "message",
      this.messageListener.bind(this),
      void 0,
      al.Message
    ), dn.alreadyCreate = !0, this;
  }
  getComputedIframeStyle() {
    this.sideEffectManager.setTimeout(
      () => {
        this.iframe && getComputedStyle(this.iframe);
      },
      200,
      al.ComputeStyle
    );
  }
  destroy() {
    this.sideEffectManager.flushAll(), dn.emitter.emit("Destory"), dn.alreadyCreate = !1, dn.emitter.clearListeners();
  }
  getIframe() {
    return this.iframe || (this.iframe = this._createIframe()), this.iframe;
  }
  setIframeSize(r) {
    this.iframe && (this.iframe.width = `${r.width}px`, this.iframe.height = `${r.height}px`, this.setAttributes({ width: r.width, height: r.height }));
  }
  get attributes() {
    return this.appManager.store.getIframeBridge();
  }
  setAttributes(r) {
    this.appManager.store.setIframeBridge(r);
  }
  _createIframe() {
    const r = document.createElement("iframe");
    return r.id = "IframeBridge", r.className = dn.hiddenClass, this.appManager.mainView.divElement && this.appManager.mainView.divElement.appendChild(r), r;
  }
  scaleIframeToFit(r = zb.Immediately) {
    if (!this.inDisplaySceneDir)
      return;
    const { width: i = 1280, height: o = 720 } = this.attributes, c = i ? -i / 2 : 0, h = o ? -o / 2 : 0;
    this.manager.moveCameraToContain({
      originX: c,
      originY: h,
      width: i,
      height: o,
      animationMode: r
    });
  }
  get isReplay() {
    return this.manager.isReplay;
  }
  handleSetPage(r) {
    if (this.isReplay || !this.attributes.displaySceneDir)
      return;
    const i = r.payload, o = this.displayer, c = o.entireScenes()[this.attributes.displaySceneDir];
    if (!c || c.length !== i) {
      const h = YO(i, (m) => ({
        name: String(m + 1)
      }));
      o.putScenes(this.attributes.displaySceneDir, h), this.manager.setMainViewScenePath(this.attributes.displaySceneDir);
    }
  }
  listenIframe(r) {
    const i = (o) => {
      var c;
      this.postMessage({
        kind: "Init",
        payload: {
          attributes: this.attributes,
          roomState: (c = dn.displayer) == null ? void 0 : c.state,
          currentPage: this.currentPage,
          observerId: this.displayer.observerId
        }
      }), dn.emitter.emit("IframeLoad", o), this.sideEffectManager.addDisposer(
        dn.emitter.on("Ready", () => {
          var h;
          this.postMessage((h = this.attributes.lastEvent) == null ? void 0 : h.payload);
        }),
        al.Ready
      ), this.computedStyleAndIframeDisplay();
    };
    r.url && this.iframe.src !== r.url && (this.src_url_equal_anchor || (this.src_url_equal_anchor = document.createElement("a")), this.src_url_equal_anchor.href = r.url, this.src_url_equal_anchor.href !== this.iframe.src && (this.iframe.src = r.url)), this.iframe.width = `${r.width}px`, this.iframe.height = `${r.height}px`, this.sideEffectManager.addEventListener(
      this.iframe,
      "load",
      i,
      void 0,
      al.Load
    );
  }
  listenDisplayerState() {
    this.isReplay && (this.displayer._phase === eT.Playing && this.computedStyleAndIframeDisplay(), this.sideEffectManager.add(() => (this.displayer.callbacks.on("onPhaseChanged", this.onPhaseChangedListener), () => this.displayer.callbacks.off("onPhaseChanged", this.onPhaseChangedListener)), al.DisplayerState)), this.computedStyleAndIframeDisplay();
  }
  computedStyleAndIframeDisplay() {
    this.computedStyle(this.displayer.state), this.computedIframeDisplay(this.displayer.state, this.attributes);
  }
  listenDisplayerCallbacks() {
    this.displayer.callbacks.on(this.callbackName, this.stateChangeListener);
  }
  get callbackName() {
    return this.isReplay ? "onPlayerStateChanged" : "onRoomStateChanged";
  }
  computedStyle(r) {
    const i = this.manager.cameraState, o = this.attributes.width || 1280, c = this.attributes.height || 720;
    if (this.iframe) {
      const { width: h, height: m, scale: y, centerX: g, centerY: x } = i, C = this.rootRect || { x: 0, y: 0 }, I = `${h / 2 + C.x}px`, A = `${m / 2 + C.y}px`, z = `transform-origin: ${I} ${A};`, $ = (h - o) / 2 * y, V = (m - c) / 2 * y, q = -(g * y) + $, G = -(x * y) + V, he = `transform: translate(${q}px,${G}px) scale(${y}, ${y});`, Ne = ["position: absolute;", "border: 0.1px solid rgba(0,0,0,0);", "top: 0px;", "left: 0px;", z, he];
      this.cssList = Ne, this.computedZindex(), this.updateStyle();
    }
  }
  computedIframeDisplay(r, i) {
    this.inDisplaySceneDir ? dn.emitter.emit("DispayIframe") : dn.emitter.emit("HideIframe");
  }
  computedZindex() {
    const r = "z-index: -1;", i = this.cssList.findIndex((o) => o === r);
    i !== -1 && this.cssList.splice(i, 1), (!this.isClicker() || this.isDisableInput) && this.cssList.push(r);
  }
  updateStyle() {
    this.iframe.style.cssText = this.cssList.join(" ");
  }
  get iframeOrigin() {
    if (this.iframe)
      try {
        return new URL(this.iframe.src).origin;
      } catch (r) {
        console.warn(r);
      }
  }
  messageListener(r) {
    if (Ca("<<<", JSON.stringify(r.data)), r.origin !== this.iframeOrigin)
      return;
    const i = r.data;
    switch (i.kind) {
      case "SetAttributes": {
        this.handleSetAttributes(i);
        break;
      }
      case "RegisterMagixEvent": {
        this.handleRegisterMagixEvent(i);
        break;
      }
      case "RemoveMagixEvent": {
        this.handleRemoveMagixEvent(i);
        break;
      }
      case "DispatchMagixEvent": {
        this.handleDispatchMagixEvent(i);
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
        this.handleSetPage(i);
        break;
      }
      case "GetAttributes": {
        this.handleGetAttributes();
        break;
      }
      case "PageTo": {
        this.handlePageTo(i);
        break;
      }
      default: {
        Ca(`${i.kind} not allow event.`);
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
  handleDispatchMagixEvent(r) {
    const i = r.payload;
    this.appManager.safeDispatchMagixEvent(i.event, i.payload);
  }
  handleSetAttributes(r) {
    this.setAttributes(r.payload);
  }
  handleRegisterMagixEvent(r) {
    const i = r.payload, o = (c) => {
      c.authorId !== this.displayer.observerId && this.postMessage({ kind: "ReciveMagixEvent", payload: c });
    };
    this.magixEventMap.set(i, o), this.displayer.addMagixEventListener(i, o);
  }
  handleRemoveMagixEvent(r) {
    const i = r.payload, o = this.magixEventMap.get(i);
    this.displayer.removeMagixEventListener(i, o);
  }
  handleNextPage() {
    this.manager.canOperate && (this.manager.nextPage(), this.dispatchMagixEvent("NextPage", {}));
  }
  handlePrevPage() {
    this.manager.canOperate && (this.manager.prevPage(), this.dispatchMagixEvent("PrevPage", {}));
  }
  handlePageTo(r) {
    if (this.manager.canOperate) {
      const i = r.payload;
      if (!Number.isSafeInteger(i) || i <= 0)
        return;
      this.manager.setMainViewSceneIndex(i - 1), this.dispatchMagixEvent("PageTo", i - 1);
    }
  }
  handleRemoveAllMagixEvent() {
    this.magixEventMap.forEach((r, i) => {
      this.displayer.removeMagixEventListener(i, r);
    }), this.magixEventMap.clear();
  }
  handleGetAttributes() {
    this.postMessage({
      kind: "GetAttributes",
      payload: this.attributes
    });
  }
  postMessage(r) {
    var i;
    this.iframe && ((i = this.iframe.contentWindow) == null || i.postMessage(JSON.parse(JSON.stringify(r)), "*"));
  }
  dispatchMagixEvent(r, i) {
    this.manager.canOperate && (this.setAttributes({ lastEvent: { name: r, payload: i } }), this.displayer.dispatchMagixEvent(r, i));
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
    if (this.readonly)
      return !1;
    const r = this.displayer.state.memberState.currentApplianceName;
    return this.allowAppliances.includes(r);
  }
  get isDisableInput() {
    return "disableDeviceInputs" in this.displayer ? this.displayer.disableDeviceInputs : !0;
  }
};
let _d = dn;
_d.kind = "IframeBridge";
_d.hiddenClass = "netless-iframe-brdige-hidden";
_d.emitter = new Nd();
_d.displayer = null;
_d.alreadyCreate = !1;
const GO = new $_({ emitter: tt }), Ye = class extends eN {
  constructor(r) {
    super(r), this.version = "1.0.9", this.dependencies = { dependencies: { "@juggle/resize-observer": "^3.3.1", "@netless/telebox-insider": "github:veytu/telebox-insider", emittery: "^0.9.2", lodash: "^4.17.21", "p-retry": "^4.6.1", uuid: "^7.0.3", "video.js": ">=7" }, peerDependencies: { jspdf: "2.5.1", "white-web-sdk": "^2.16.52" }, devDependencies: { "@hyrious/dts": "^0.2.2", "@netless/app-media-player": "0.1.0-beta.9", "@netless/app-docs-viewer": "github:veytu/app-docs-viewer", "@rollup/plugin-commonjs": "^20.0.0", "@rollup/plugin-node-resolve": "^13.0.4", "@rollup/plugin-url": "^6.1.0", "@sveltejs/vite-plugin-svelte": "^1.4.0", "@tsconfig/svelte": "^2.0.1", "@types/debug": "^4.1.7", "@types/lodash": "^4.14.182", "@types/lodash-es": "^4.17.4", "@types/uuid": "^8.3.1", "@typescript-eslint/eslint-plugin": "^4.30.0", "@typescript-eslint/parser": "^4.30.0", "@vitest/ui": "^0.14.1", cypress: "^8.7.0", dotenv: "^10.0.0", eslint: "^7.32.0", "eslint-config-prettier": "^8.3.0", "eslint-plugin-svelte3": "^3.2.0", jsdom: "^19.0.0", jspdf: "^2.5.1", less: "^4.1.1", prettier: "^2.3.2", "prettier-plugin-svelte": "^2.4.0", "rollup-plugin-analyzer": "^4.0.0", "rollup-plugin-styles": "^3.14.1", "side-effect-manager": "0.1.5", svelte: "^3.42.4", typescript: "^4.5.5", vite: "^3.0.0", vitest: "^0.14.1", "white-web-sdk": "2.16.52" } }, this.emitter = Dt, this.viewMode = sl.Broadcaster, this.isReplay = rS(this.displayer), this._cursorUIDs = [], this._appReadonly = !1, this.containerSizeRatio = Ye.containerSizeRatio, Ye.displayer = r.displayer, window.NETLESS_DEPS = { dependencies: { "@juggle/resize-observer": "^3.3.1", "@netless/telebox-insider": "github:veytu/telebox-insider", emittery: "^0.9.2", lodash: "^4.17.21", "p-retry": "^4.6.1", uuid: "^7.0.3", "video.js": ">=7" }, peerDependencies: { jspdf: "2.5.1", "white-web-sdk": "^2.16.52" }, devDependencies: { "@hyrious/dts": "^0.2.2", "@netless/app-media-player": "0.1.0-beta.9", "@netless/app-docs-viewer": "github:veytu/app-docs-viewer", "@rollup/plugin-commonjs": "^20.0.0", "@rollup/plugin-node-resolve": "^13.0.4", "@rollup/plugin-url": "^6.1.0", "@sveltejs/vite-plugin-svelte": "^1.4.0", "@tsconfig/svelte": "^2.0.1", "@types/debug": "^4.1.7", "@types/lodash": "^4.14.182", "@types/lodash-es": "^4.17.4", "@types/uuid": "^8.3.1", "@typescript-eslint/eslint-plugin": "^4.30.0", "@typescript-eslint/parser": "^4.30.0", "@vitest/ui": "^0.14.1", cypress: "^8.7.0", dotenv: "^10.0.0", eslint: "^7.32.0", "eslint-config-prettier": "^8.3.0", "eslint-plugin-svelte3": "^3.2.0", jsdom: "^19.0.0", jspdf: "^2.5.1", less: "^4.1.1", prettier: "^2.3.2", "prettier-plugin-svelte": "^2.4.0", "rollup-plugin-analyzer": "^4.0.0", "rollup-plugin-styles": "^3.14.1", "side-effect-manager": "0.1.5", svelte: "^3.42.4", typescript: "^4.5.5", vite: "^3.0.0", vitest: "^0.14.1", "white-web-sdk": "2.16.52" } };
  }
  static onCreate(r) {
    Ye._resolve(r);
  }
  static async mount(r) {
    var y, g, x;
    const i = r.room;
    Ye.container = r.container, Ye.supportAppliancePlugin = r.supportAppliancePlugin;
    const o = r.containerSizeRatio, c = r.debug, h = r.cursor;
    Ye.params = r, Ye.displayer = r.room, XN();
    let m;
    if (ol(i)) {
      if (i.phase !== ll.Connected)
        throw new Error("[WindowManager]: Room only Connected can be mount");
      i.phase === ll.Connected && i.isWritable && (i.disableSerialization = !1), m = await this.initManager(i);
    }
    if (Ye.isCreated)
      throw new Error("[WindowManager]: Already created cannot be created again");
    if (this.debug = Boolean(c), this.debug && FE({ verbose: !0 }), Ca("Already insert room", m), ol(this.displayer)) {
      if (!m)
        throw new Error("[WindowManager]: init InvisiblePlugin failed");
    } else
      await pM(
        async (C) => {
          if (m = i.getInvisiblePlugin(Ye.kind), !m)
            throw Ca(`manager is empty. retrying ${C}`), new Error();
        },
        { retries: 10, maxTimeout: 5e3 }
      );
    if (!m)
      throw new Error("[WindowManager]: create manager failed");
    o && (Ye.containerSizeRatio = o), await m.ensureAttributes(), m._fullscreen = r.fullscreen, m.appManager = new YN(m), m.appManager.polling = r.polling || !1, m._pageState = new F_(m.appManager), m.cursorManager = new W_(
      m.appManager,
      Boolean(h),
      r.cursorOptions,
      r.applianceIcons
    ), o && (m.containerSizeRatio = o), r.container && m.bindContainer(r.container), Q_(i, m), tt.emit("onCreated"), Ye.isCreated = !0;
    try {
      await lN();
    } catch (C) {
      console.warn("[WindowManager]: indexedDB open failed"), console.log(C);
    }
    return (y = m == null ? void 0 : m.room) == null || y.addMagixEventListener("onScaleChange", (C) => {
      m == null || m._setScale(C.payload);
    }), (g = m == null ? void 0 : m.room) == null || g.addMagixEventListener("onMainViewBackgroundImgChange", (C) => {
      m == null || m._setBackgroundImg(C.payload);
    }), (x = m == null ? void 0 : m.room) == null || x.addMagixEventListener("onMainViewBackgroundColorChange", (C) => {
      m == null || m._setBackgroundColor(C.payload);
    }), tt.on("playgroundSizeChange", () => {
      m == null || m._updateMainViewWrapperSize();
    }), m._initAttribute(), m;
  }
  static initManager(r) {
    return JN(r);
  }
  static initContainer(r, i, o) {
    const { chessboard: c, overwriteStyles: h, fullscreen: m } = o;
    Ye.container || (Ye.container = i);
    const { playground: y, wrapper: g, sizer: x, mainViewElement: C, mainViewWrapper: I, extendWrapper: A } = GN(i);
    if (Ye.playground = y, c && x.classList.add("netless-window-manager-chess-sizer"), m && x.classList.add("netless-window-manager-fullscreen"), h) {
      const z = document.createElement("style");
      z.textContent = h, y.appendChild(z);
    }
    return r.containerResizeObserver = sS.create(
      y,
      x,
      g,
      tt
    ), Ye.wrapper = g, Ye.sizer = x, Ye.mainViewWrapper = I, Ye.extendWrapper = A, C;
  }
  static get registered() {
    return qi.registered;
  }
  bindContainer(r) {
    var i, o, c, h, m, y;
    if (ol(this.displayer) && this.room.phase !== ll.Connected)
      throw new zN();
    if (Ye.isCreated && Ye.container)
      Ye.container.firstChild && r.appendChild(Ye.container.firstChild);
    else if (Ye.params) {
      const g = Ye.params, x = Ye.initContainer(this, r, g);
      this.boxManager && this.boxManager.destroy();
      const C = c_(this, Dt, tt, po, {
        collectorContainer: g.collectorContainer,
        collectorStyles: g.collectorStyles,
        prefersColorScheme: g.prefersColorScheme
      });
      this.boxManager = C, (i = this.appManager) == null || i.setBoxManager(C), this.bindMainView(x, g.disableCameraTransform), Ye.wrapper && ((o = this.cursorManager) == null || o.setupWrapper(Ye.wrapper));
    }
    tt.emit("updateManagerRect"), (c = this.appManager) == null || c.refresh(), (h = this.appManager) == null || h.resetMaximized(), (m = this.appManager) == null || m.resetMinimized(), (y = this.appManager) == null || y.displayerWritableListener(!this.room.isWritable), Ye.container = r;
  }
  bindCollectorContainer(r) {
    Ye.isCreated && this.boxManager ? this.boxManager.setCollectorContainer(r) : Ye.params && (Ye.params.collectorContainer = r);
  }
  static register(r) {
    return qi.register(r);
  }
  static unregister(r) {
    return qi.unregister(r);
  }
  async addApp(r) {
    if (this.appManager)
      return this.appManager.rootDirRemoving ? new Promise((i, o) => {
        tt.once("rootDirRemoved").then(async () => {
          try {
            const c = await this._addApp(r);
            i(c);
          } catch (c) {
            o(c.message);
          }
        });
      }) : this._addApp(r);
    throw new ms();
  }
  async _addApp(r) {
    var i, o, c;
    if (this.appManager) {
      if (!r.kind || typeof r.kind != "string")
        throw new NN();
      r.src && typeof r.src == "string" && qi.register({ kind: r.kind, src: r.src });
      const h = await ((i = qi.appClasses.get(r.kind)) == null ? void 0 : i());
      if (h && ((o = h.config) == null ? void 0 : o.singleton) && this.appManager.appProxies.has(r.kind))
        throw new RN();
      const m = this.setupScenePath(r, this.appManager);
      return m === void 0 ? void 0 : ((c = r == null ? void 0 : r.options) != null && c.scenePath && (r.options.scenePath = EN(r.options.scenePath)), await this.appManager.addApp(r, Boolean(m)));
    } else
      throw new ms();
  }
  setupScenePath(r, i) {
    let o = !1;
    if (r.options) {
      const { scenePath: c, scenes: h } = r.options;
      if (c) {
        if (!MN(c))
          throw new _N();
        const m = Object.keys(this.apps || {});
        for (const y of m) {
          const g = i.store.getAppScenePath(y);
          if (g && g === c) {
            if (console.warn(`[WindowManager]: ScenePath "${c}" already opened`), this.boxManager) {
              const x = this.boxManager.getTopBox();
              x && (this.boxManager.setZIndex(y, x.zIndex + 1, !1), this.boxManager.focusBox({ appId: y }, !1));
            }
            return;
          }
        }
      }
      c && h && h.length > 0 && (this.isDynamicPPT(h) ? (o = !0, Ad(this.displayer)[c] || Xh(this.room, c, h)) : Ad(this.displayer)[c] || Xh(this.room, c, [{ name: h[0].name }])), c && h === void 0 && Xh(this.room, c, [{}]);
    }
    return o;
  }
  async setMainViewScenePath(r) {
    this.appManager && await this.appManager.setMainViewScenePath(r);
  }
  async setMainViewSceneIndex(r) {
    this.appManager && await this.appManager.setMainViewSceneIndex(r);
  }
  async nextPage() {
    if (this.appManager) {
      const r = this.mainViewSceneIndex + 1;
      return r >= this.mainViewScenesLength ? (console.warn("[WindowManager]: current page is the last page"), !1) : (await this.appManager.setMainViewSceneIndex(r), !0);
    } else
      return !1;
  }
  async prevPage() {
    if (this.appManager) {
      const r = this.mainViewSceneIndex - 1;
      return r < 0 ? (console.warn("[WindowManager]: current page is the first page"), !1) : (await this.appManager.setMainViewSceneIndex(r), !0);
    } else
      return !1;
  }
  async jumpPage(r) {
    return this.appManager ? r < 0 || r >= this.pageState.length ? (console.warn(`[WindowManager]: index ${r} out of range`), !1) : (await this.appManager.setMainViewSceneIndex(r), !0) : !1;
  }
  async addPage(r) {
    if (this.appManager) {
      const i = r == null ? void 0 : r.after, o = r == null ? void 0 : r.scene;
      if (i) {
        const c = this.mainViewSceneIndex + 1;
        this.room.putScenes(Cr, [o || {}], c);
      } else
        this.room.putScenes(Cr, [o || {}]);
    }
  }
  async removePage(r) {
    if (this.appManager) {
      const i = r === void 0 ? this.pageState.index : r;
      return this.pageState.length === 1 ? (console.warn("[WindowManager]: can not remove the last page"), !1) : i < 0 || i >= this.pageState.length ? (console.warn(`[WindowManager]: index ${r} out of range`), !1) : this.appManager.removeSceneByIndex(i);
    } else
      return !1;
  }
  getMainViewScenePath() {
    var r;
    return (r = this.appManager) == null ? void 0 : r.store.getMainViewScenePath();
  }
  getMainViewSceneIndex() {
    var r;
    return (r = this.appManager) == null ? void 0 : r.store.getMainViewSceneIndex();
  }
  setReadonly(r) {
    var i;
    this.readonly = r, (i = this.boxManager) == null || i.setReadonly(r), tt.emit("setReadonly", r);
  }
  switchMainViewToWriter() {
    var r;
    return (r = this.appManager) == null ? void 0 : r.mainViewProxy.mainViewClickHandler();
  }
  onAppDestroy(r, i) {
    CN(`destroy-${r}`, i);
  }
  onAppEvent(r, i) {
    return tt.on(`custom-${r}`, i);
  }
  setViewMode(r) {
    var i, o, c, h;
    (r === sl.Broadcaster || r === sl.Follower) && (this.canOperate && r === sl.Broadcaster && ((i = this.appManager) == null || i.mainViewProxy.setCameraAndSize()), (o = this.appManager) == null || o.mainViewProxy.start()), r === sl.Freedom && ((c = this.appManager) == null || c.mainViewProxy.stop()), this.viewMode = r, (h = this.appManager) == null || h.mainViewProxy.setViewMode(r);
  }
  setBoxState(r) {
    if (!!this.canOperate)
      switch (r) {
        case "normal":
          this.setMaximized(!1), this.setMinimized(!1);
          break;
        case "maximized":
          this.setMaximized(!0), this.setMinimized(!1);
          break;
        case "minimized":
          this.setMinimized(!0);
          break;
      }
  }
  setMaximized(r) {
    var i;
    !this.canOperate || (i = this.boxManager) == null || i.setMaximized(r, !1);
  }
  setMinimized(r) {
    var i;
    !this.canOperate || (i = this.boxManager) == null || i.setMinimized(r, !1);
  }
  setFullscreen(r) {
    var i;
    this._fullscreen !== r && (this._fullscreen = r, (i = Ye.sizer) == null || i.classList.toggle("netless-window-manager-fullscreen", r), Dt.emit("fullscreenChange", r));
  }
  get cursorUIDs() {
    return this._cursorUIDs;
  }
  setCursorUIDs(r) {
    var i, o;
    if (this._cursorUIDs = r || [], this._cursorUIDs.length === 0)
      (i = this._cursorUIDsStyleDOM) == null || i.remove();
    else {
      this._cursorUIDsStyleDOM || (this._cursorUIDsStyleDOM = document.createElement("style")), (o = Ye.playground) == null || o.appendChild(this._cursorUIDsStyleDOM);
      let c = "[data-cursor-uid] { display: none }";
      for (const h of this._cursorUIDs)
        c += `
[data-cursor-uid="${h}"] { display: flex }`;
      this._cursorUIDsStyleDOM.textContent = c;
    }
  }
  maximizedBoxNextPage() {
    var o, c;
    const r = this.getTopMaxBoxId();
    if (!r)
      return !1;
    const i = (o = this.appManager) == null ? void 0 : o.appProxies.get(r);
    return i ? (c = i == null ? void 0 : i.appContext) == null ? void 0 : c.nextPage() : !1;
  }
  maximizedBoxPrevPage() {
    var o, c;
    const r = this.getTopMaxBoxId();
    if (!r)
      return !1;
    const i = (o = this.appManager) == null ? void 0 : o.appProxies.get(r);
    return i ? (c = i == null ? void 0 : i.appContext) == null ? void 0 : c.prevPage() : !1;
  }
  getMaximizedBoxPageState() {
    var o, c;
    const r = this.getTopMaxBoxId();
    if (!r)
      return;
    const i = (o = this.appManager) == null ? void 0 : o.appProxies.get(r);
    if (!!i)
      return (c = i == null ? void 0 : i.appContext) == null ? void 0 : c.pageState;
  }
  getTopMaxBoxId() {
    var i, o;
    const r = (o = (i = this.appManager) == null ? void 0 : i.boxManager) == null ? void 0 : o.teleBoxManager.maximizedBoxes.filter((c) => {
      var h, m;
      return !((m = (h = this.appManager) == null ? void 0 : h.boxManager) != null && m.teleBoxManager.minimizedBoxes.includes(c));
    });
    if (!!(r != null && r.length))
      return r.reduce(
        (c, h) => {
          var m, y, g, x, C, I, A, z;
          return Number((x = (g = (y = (m = this.appManager) == null ? void 0 : m.boxManager) == null ? void 0 : y.getBox(c)) == null ? void 0 : g._zIndex$) == null ? void 0 : x.value) > Number((z = (A = (I = (C = this.appManager) == null ? void 0 : C.boxManager) == null ? void 0 : I.getBox(h)) == null ? void 0 : A._zIndex$) == null ? void 0 : z.value) ? c : h;
        }
      );
  }
  get mainView() {
    if (this.appManager)
      return this.appManager.mainViewProxy.view;
    throw new ms();
  }
  get camera() {
    if (this.appManager)
      return this.appManager.mainViewProxy.view.camera;
    throw new ms();
  }
  get cameraState() {
    if (this.appManager)
      return this.appManager.mainViewProxy.cameraState;
    throw new ms();
  }
  get apps() {
    var r;
    return (r = this.appManager) == null ? void 0 : r.store.apps();
  }
  get boxState() {
    var r;
    if (this.appManager)
      return (r = this.appManager.boxManager) == null ? void 0 : r.boxState;
    throw new ms();
  }
  get darkMode() {
    var r, i;
    return Boolean((i = (r = this.appManager) == null ? void 0 : r.boxManager) == null ? void 0 : i.darkMode);
  }
  get prefersColorScheme() {
    var r;
    if (this.appManager)
      return (r = this.appManager.boxManager) == null ? void 0 : r.prefersColorScheme;
    throw new ms();
  }
  get focused() {
    return this.attributes.focus;
  }
  get focusedView() {
    var r, i;
    return ((i = (r = this.appManager) == null ? void 0 : r.focusApp) == null ? void 0 : i.view) || this.mainView;
  }
  get polling() {
    var r;
    return ((r = this.appManager) == null ? void 0 : r.polling) || !1;
  }
  set polling(r) {
    this.appManager && (this.appManager.polling = r);
  }
  get cursorStyle() {
    var r;
    return ((r = this.cursorManager) == null ? void 0 : r.style) || "default";
  }
  set cursorStyle(r) {
    if (!this.cursorManager)
      throw new Error("[WindowManager]: cursor is not enabled, please set { cursor: true }.");
    this.cursorManager.style = r;
  }
  get mainViewSceneIndex() {
    var r;
    return ((r = this._pageState) == null ? void 0 : r.index) || 0;
  }
  get mainViewSceneDir() {
    var r;
    if (this.appManager)
      return (r = this.appManager) == null ? void 0 : r.getMainViewSceneDir();
    throw new ms();
  }
  get topApp() {
    var r, i;
    return (i = (r = this.boxManager) == null ? void 0 : r.getTopBox()) == null ? void 0 : i.id;
  }
  get mainViewScenesLength() {
    var r;
    return ((r = this._pageState) == null ? void 0 : r.length) || 0;
  }
  get canRedoSteps() {
    var r;
    return ((r = this.focusedView) == null ? void 0 : r.canRedoSteps) || 0;
  }
  get canUndoSteps() {
    var r;
    return ((r = this.focusedView) == null ? void 0 : r.canUndoSteps) || 0;
  }
  get sceneState() {
    if (this.appManager)
      return this.appManager.sceneState;
    throw new ms();
  }
  get pageState() {
    if (this._pageState)
      return this._pageState.toObject();
    throw new ms();
  }
  get fullscreen() {
    return Boolean(this._fullscreen);
  }
  get extendWrapper() {
    return Ye.extendWrapper;
  }
  queryAll() {
    var r;
    return Array.from(((r = this.appManager) == null ? void 0 : r.appProxies.values()) || []);
  }
  queryOne(r) {
    var i;
    return (i = this.appManager) == null ? void 0 : i.appProxies.get(r);
  }
  async closeApp(r) {
    var i;
    return (i = this.appManager) == null ? void 0 : i.closeApp(r);
  }
  focusApp(r) {
    var o, c, h;
    const i = (o = this.boxManager) == null ? void 0 : o.getBox(r);
    i && ((c = this.boxManager) == null || c.focusBox({ appId: r }, !1), ((h = this.boxManager) == null ? void 0 : h.teleBoxManager).makeBoxTop(i, !1));
  }
  moveCamera(r) {
    var c;
    const i = nS(r, ["animationMode"]), o = { ...this.mainView.camera };
    tg({ ...o, ...i }, o) || (this.mainView.moveCamera(r), (c = this.appManager) == null || c.dispatchInternalEvent(Xt.MoveCamera, r), setTimeout(() => {
      var h;
      (h = this.appManager) == null || h.mainViewProxy.setCameraAndSize();
    }, 500));
  }
  moveCameraToContain(r) {
    var i;
    this.mainView.moveCameraToContain(r), (i = this.appManager) == null || i.dispatchInternalEvent(Xt.MoveCameraToContain, r), setTimeout(() => {
      var o;
      (o = this.appManager) == null || o.mainViewProxy.setCameraAndSize();
    }, 500);
  }
  convertToPointInWorld(r) {
    return this.mainView.convertToPointInWorld(r);
  }
  setCameraBound(r) {
    this.mainView.setCameraBound(r);
  }
  onDestroy() {
    this._destroy();
  }
  destroy() {
    this._destroy();
  }
  _destroy() {
    var r, i, o, c, h;
    (r = this.containerResizeObserver) == null || r.disconnect(), (i = this.appManager) == null || i.destroy(), (o = this.cursorManager) == null || o.destroy(), Ye.container = void 0, Ye.wrapper = void 0, Ye.sizer = void 0, Ye.isCreated = !1, Ye.playground && ((c = Ye.playground.parentNode) == null || c.removeChild(Ye.playground)), Ye.params = void 0, (h = this._iframeBridge) == null || h.destroy(), this._iframeBridge = void 0, Ca("Destroyed");
  }
  bindMainView(r, i) {
    var o;
    this.appManager && (this.appManager.bindMainView(r, Boolean(i)), (o = this.cursorManager) == null || o.setMainViewDivElement(r));
  }
  get canOperate() {
    return ol(this.displayer) ? this.displayer.isWritable && this.displayer.phase === ll.Connected : !1;
  }
  get appReadonly() {
    return ol(this.displayer) ? this._appReadonly && this.displayer.phase === ll.Connected : !1;
  }
  get room() {
    return this.displayer;
  }
  setAppReadonly(r) {
    this._appReadonly = r;
  }
  safeSetAttributes(r) {
    var i;
    this.canOperate && ((i = this.room) == null || i.dispatchMagixEvent("Windowmanager_custom_attributes", r), this.setAttributes(r));
  }
  safeUpdateAttributes(r, i) {
    var o;
    this.canOperate && ((o = this.room) == null || o.dispatchMagixEvent("Windowmanager_custom_attributes", { keys: r, value: i }), this.updateAttributes(r, i));
  }
  setPrefersColorScheme(r) {
    var i, o;
    (o = (i = this.appManager) == null ? void 0 : i.boxManager) == null || o.setPrefersColorScheme(r);
  }
  cleanCurrentScene() {
    var r;
    Ca("clean current scene"), (r = this.focusedView) == null || r.cleanCurrentScene();
  }
  redo() {
    var r;
    return ((r = this.focusedView) == null ? void 0 : r.redo()) || 0;
  }
  undo() {
    var r;
    return ((r = this.focusedView) == null ? void 0 : r.undo()) || 0;
  }
  delete() {
    var r;
    (r = this.focusedView) == null || r.delete();
  }
  copy() {
    var r;
    (r = this.focusedView) == null || r.copy();
  }
  paste() {
    var r;
    (r = this.focusedView) == null || r.paste();
  }
  duplicate() {
    var r;
    (r = this.focusedView) == null || r.duplicate();
  }
  insertText(r, i, o) {
    var c;
    return ((c = this.focusedView) == null ? void 0 : c.insertText(r, i, o)) || "";
  }
  insertImage(r) {
    var i;
    return (i = this.focusedView) == null ? void 0 : i.insertImage(r);
  }
  completeImageUpload(r, i) {
    var o;
    return (o = this.focusedView) == null ? void 0 : o.completeImageUpload(r, i);
  }
  lockImage(r, i) {
    var o;
    return (o = this.focusedView) == null ? void 0 : o.lockImage(r, i);
  }
  lockImages(r) {
    var i;
    return (i = this.focusedView) == null ? void 0 : i.lockImages(r);
  }
  refresh() {
    var r;
    this._refresh(), (r = this.appManager) == null || r.dispatchInternalEvent(Xt.Refresh);
  }
  _refresh() {
    var r, i;
    (r = this.appManager) == null || r.mainViewProxy.rebind(), Ye.container && this.bindContainer(Ye.container), (i = this.appManager) == null || i.refresher.refresh();
  }
  setContainerSizeRatio(r) {
    if (!Pb(r) || !(r > 0))
      throw new Error(
        `[WindowManager]: updateContainerSizeRatio error, ratio must be a positive number. but got ${r}`
      );
    Ye.containerSizeRatio = r, this.containerSizeRatio = r, tt.emit("containerSizeRatioUpdate", r);
  }
  setScale(r) {
    this.room.dispatchMagixEvent("onScaleChange", r);
  }
  _updateMainViewWrapperSize(r) {
    var h;
    const i = (m) => {
      !Ye.mainViewWrapper || (Ye.mainViewWrapper.style.width = `${m.width}px`, Ye.mainViewWrapper.style.height = `${m.height}px`);
    }, o = (h = Ye.wrapper) == null ? void 0 : h.getBoundingClientRect();
    if (!o)
      return !1;
    const c = r != null ? r : this.getAttributesValue("scale");
    i({ width: (o == null ? void 0 : o.width) * c, height: (o == null ? void 0 : o.height) * c });
  }
  _setScale(r, i) {
    if (!Pb(r))
      return !1;
    let o = r;
    return o < 1 && (o = 1), i || tt.emit("onScaleChange", o), this.safeUpdateAttributes(["scale"], o), this._updateMainViewWrapperSize(o), !0;
  }
  isDynamicPPT(r) {
    var o, c;
    const i = (c = (o = r[0]) == null ? void 0 : o.ppt) == null ? void 0 : c.src;
    return i == null ? void 0 : i.startsWith("pptx://");
  }
  async ensureAttributes() {
    GD(this.attributes) && await bM(50), xa(this.attributes) && (this.attributes[xi.Apps] || this.safeSetAttributes({ [xi.Apps]: {} }), this.attributes[xi.Cursors] || this.safeSetAttributes({ [xi.Cursors]: {} }), this.attributes._mainScenePath || this.safeSetAttributes({ _mainScenePath: yM }), this.attributes._mainSceneIndex || this.safeSetAttributes({ _mainSceneIndex: 0 }), this.attributes[xi.Registered] || this.safeSetAttributes({ [xi.Registered]: {} }), this.attributes[xi.IframeBridge] || this.safeSetAttributes({ [xi.IframeBridge]: {} }), this.attributes.mainViewBackgroundColor || this.safeSetAttributes({ mainViewBackgroundColor: "" }), this.attributes.mainViewBackgroundImg || this.safeSetAttributes({ mainViewBackgroundImg: "" }), this.attributes.scale || this.safeSetAttributes({ scale: 1 }));
  }
  getIframeBridge() {
    if (!this.appManager)
      throw new Error("[WindowManager]: should call getIframeBridge() after await mount()");
    return this._iframeBridge || (this._iframeBridge = new _d(this, this.appManager)), this._iframeBridge;
  }
  getBackground() {
    if (this.attributes.mainViewBackgroundColor)
      return {
        type: "color",
        value: this.attributes.mainViewBackgroundColor
      };
    if (this.attributes.mainViewBackgroundImg)
      return {
        type: "img",
        value: this.attributes.mainViewBackgroundImg
      };
  }
  setBackgroundImg(r) {
    this.room.dispatchMagixEvent("onMainViewBackgroundColorChange", ""), this.room.dispatchMagixEvent("onMainViewBackgroundImgChange", r);
  }
  setBackgroundColor(r) {
    this.room.dispatchMagixEvent("onMainViewBackgroundImgChange", ""), this.room.dispatchMagixEvent("onMainViewBackgroundColorChange", r);
  }
  _setBackgroundColor(r) {
    !Ye.mainViewWrapper || (Ye.mainViewWrapper.style.backgroundColor = r, this.safeUpdateAttributes(["mainViewBackgroundColor"], r));
  }
  _setBackgroundImg(r) {
    !Ye.mainViewWrapper || (Ye.mainViewWrapper.style.backgroundImage = `url(${r})`, this.safeUpdateAttributes(["mainViewBackgroundImg"], r));
  }
  _initAttribute() {
    this.attributes.mainViewBackgroundImg && this._setBackgroundImg(this.attributes.mainViewBackgroundImg), this.attributes.mainViewBackgroundColor && this._setBackgroundColor(this.attributes.mainViewBackgroundColor), this.attributes.scale && this._setScale(this.attributes.scale);
  }
};
let Wt = Ye;
Wt.kind = "WindowManager";
Wt.debug = !1;
Wt.containerSizeRatio = aN;
Wt.isCreated = !1;
Wt._resolve = (r) => {
};
$O();
export {
  RN as AppCreateError,
  ms as AppManagerNotInitError,
  iL as AppNotRegisterError,
  zN as BindContainerRoomPhaseInvalidError,
  PN as BoxManagerNotFoundError,
  kN as BoxNotCreatedError,
  rL as BuiltinApps,
  ZO as DomEvents,
  _d as IframeBridge,
  QO as IframeEvents,
  _N as InvalidScenePath,
  NN as ParamsInvalidError,
  DN as WhiteWebSDKInvalidError,
  Wt as WindowManager,
  TM as calculateNextIndex,
  GO as reconnectRefresher
};
//# sourceMappingURL=index.mjs.map
