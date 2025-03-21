import yM from "p-retry";
import Nd from "emittery";
import { debounce as Ta, isEqual as rg, omit as sS, isObject as xa, has as Bb, get as wn, size as YD, mapValues as GD, noop as wM, pick as XD, isEmpty as Xh, isInteger as JD, orderBy as qD, isFunction as xd, isString as iT, isNumber as jb, isNull as KD } from "lodash";
import { ScenePathType as qv, UpdateEventKind as bM, listenUpdated as ag, unlistenUpdated as oS, reaction as pg, autorun as xs, toJS as eN, listenDisposed as tN, unlistenDisposed as nN, ViewMode as sl, AnimationMode as sg, isPlayer as lS, isRoom as ol, WhiteVersion as iN, ApplianceNames as Nn, RoomPhase as ll, PlayerPhase as rT, InvisiblePlugin as rN } from "white-web-sdk";
import { v4 as aN } from "uuid";
import { ResizeObserver as sN } from "@juggle/resize-observer";
import aT from "video.js";
import { createSideEffectBinder as oN, withValueEnhancer as lN } from "value-enhancer";
var Xt = /* @__PURE__ */ ((r) => (r.AppMove = "AppMove", r.AppFocus = "AppFocus", r.AppResize = "AppResize", r.AppBoxStateChange = "AppBoxStateChange", r.GetAttributes = "GetAttributes", r.UpdateWindowManagerWrapper = "UpdateWindowManagerWrapper", r.InitReplay = "InitReplay", r.WindowCreated = "WindowCreated", r.SetMainViewScenePath = "SetMainViewScenePath", r.SetMainViewSceneIndex = "SetMainViewSceneIndex", r.SetAppFocusIndex = "SetAppFocusIndex", r.SwitchViewsToFreedom = "SwitchViewsToFreedom", r.MoveCamera = "MoveCamera", r.MoveCameraToContain = "MoveCameraToContain", r.CursorMove = "CursorMove", r.RootDirRemoved = "RootDirRemoved", r.Refresh = "Refresh", r.InitMainViewCamera = "InitMainViewCamera", r))(Xt || {});
const Vb = "__WindowManger", hb = "__WindowMangerEnsureReconnected__";
var Ji = /* @__PURE__ */ ((r) => (r.Size = "size", r.Position = "position", r.SceneIndex = "SceneIndex", r.ZIndex = "zIndex", r))(Ji || {}), SM = /* @__PURE__ */ ((r) => (r.setBoxSize = "setBoxSize", r.setBoxMinSize = "setBoxMinSize", r.destroy = "destroy", r))(SM || {}), Ub = /* @__PURE__ */ ((r) => (r.StartCreate = "StartCreate", r))(Ub || {}), Hb = /* @__PURE__ */ ((r) => (r.Leave = "leave", r.Normal = "normal", r))(Hb || {});
const sT = "2.16.1", uN = 340 / 720, cN = 340 / 720, dN = 9 / 16, Cr = "/", xM = "/init", CM = 50, Dt = new Nd();
class fN {
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
  push(n) {
    this.list.push(n), this.invoke(), this.timer === void 0 && this.list.length > 0 && (this.timer = this.initInterval());
  }
  invoke() {
    if (this.list.length === 0 || this.currentInvoker !== void 0)
      return;
    const n = this.list.shift();
    n && (this.currentInvoker = n, n().then(() => {
      this.invoked();
    }).catch((o) => {
      console.error(`[WindowManager]: create app error: ${o.message}`), this.invoked();
    }));
  }
  emitReady() {
    this.isEmit || setTimeout(() => {
      Dt.emit("ready");
    }, CM), this.isEmit = !0;
  }
  empty() {
    this.list = [], this.clear();
  }
  destroy() {
    this.timer && this.clear();
  }
}
const et = new Nd(), hN = "__WindowManagerAppCache";
let rp, oT;
const pN = async () => {
  rp = await gN();
}, mN = (r, n) => {
  if (!!rp)
    return wN(rp, { kind: r, sourceCode: n });
}, vN = async (r) => rp ? await yN(rp, r) : null;
function gN() {
  return new Promise((r, n) => {
    const o = indexedDB.open(hN, 2);
    o.onerror = (l) => {
      n(l);
    }, o.onupgradeneeded = (l) => {
      const h = l.target.result;
      h.objectStoreNames.contains("apps") || (oT = h.createObjectStore("apps", { keyPath: "kind" }), oT.createIndex("kind", "kind", { unique: !0 }));
    }, o.onsuccess = () => {
      const l = o.result;
      r(l);
    };
  });
}
function yN(r, n) {
  return new Promise((o, l) => {
    const m = r.transaction(["apps"]).objectStore("apps").index("kind").get(n);
    m.onerror = (w) => l(w), m.onsuccess = () => {
      m.result ? o(m.result) : o(null);
    };
  });
}
function wN(r, n) {
  return new Promise((o, l) => {
    const h = r.transaction(["apps"], "readwrite").objectStore("apps").add(n);
    h.onsuccess = () => o(), h.onerror = () => l();
  });
}
const bN = "NetlessApp", SN = 1e4, xN = async (r) => {
  const n = await vN(r);
  if (n)
    return n.sourceCode;
  {
    const l = await (await MN(r, { timeout: SN })).text();
    return await mN(r, l), l;
  }
}, lT = (r, n) => {
  let o = Function(r + `
;return ${n}`)();
  return typeof o > "u" && (o = window[n]), o;
}, CN = async (r, n, o) => {
  const l = o || bN + n;
  Dt.emit("loadApp", { kind: n, status: "start" });
  let h;
  try {
    if (h = await xN(r), !h || h.length === 0)
      throw Dt.emit("loadApp", { kind: n, status: "failed", reason: "script is empty." }), new Error("[WindowManager]: script is empty.");
  } catch (m) {
    throw Dt.emit("loadApp", { kind: n, status: "failed", reason: m.message }), m;
  }
  return TN(h, l, n);
}, TN = (r, n, o) => {
  try {
    const l = lT(r, n);
    return Dt.emit("loadApp", { kind: o, status: "success" }), l;
  } catch (l) {
    if (l.message.includes("Can only have one anonymous define call per script file")) {
      const h = window.define;
      typeof h == "function" && h.amd && delete h.amd;
      const m = lT(r, n);
      return Dt.emit("loadApp", { kind: o, status: "success" }), m;
    }
    throw Dt.emit("loadApp", { kind: o, status: "failed", reason: l.message }), l;
  }
};
async function MN(r, n) {
  const { timeout: o = 1e4 } = n, l = new AbortController(), h = setTimeout(() => l.abort(), o), m = await fetch(r, {
    ...n,
    signal: l.signal,
    headers: {
      "content-type": "text/plain"
    }
  });
  return clearTimeout(h), m;
}
class EN {
  constructor() {
    this.kindEmitters = /* @__PURE__ */ new Map(), this.registered = /* @__PURE__ */ new Map(), this.appClassesCache = /* @__PURE__ */ new Map(), this.appClasses = /* @__PURE__ */ new Map(), this.syncRegisterApp = null, this.onSyncRegisterAppChange = (n) => {
      this.register({ kind: n.kind, src: n.src });
    };
  }
  setSyncRegisterApp(n) {
    this.syncRegisterApp = n;
  }
  async register(n) {
    this.appClassesCache.delete(n.kind), this.registered.set(n.kind, n);
    const o = n.src;
    let l;
    if (typeof o == "string" && (l = async () => {
      const h = await CN(o, n.kind, n.name);
      return h.__esModule ? h.default : h;
    }, this.syncRegisterApp && this.syncRegisterApp({ kind: n.kind, src: o, name: n.name })), typeof o == "function" && (l = async () => {
      let h = await o();
      if (h)
        return (h.__esModule || h.default) && (h = h.default), h;
      throw new Error(`[WindowManager]: load remote script failed, ${o}`);
    }), typeof o == "object" && (l = async () => o), this.appClasses.set(n.kind, async () => {
      let h = this.appClassesCache.get(n.kind);
      return h || (h = l(), this.appClassesCache.set(n.kind, h)), h;
    }), n.addHooks) {
      const h = this.createKindEmitter(n.kind);
      h && n.addHooks(h);
    }
  }
  unregister(n) {
    this.appClasses.delete(n), this.appClassesCache.delete(n), this.registered.delete(n);
    const o = this.kindEmitters.get(n);
    o && (o.clearListeners(), this.kindEmitters.delete(n));
  }
  async notifyApp(n, o, l) {
    const h = this.kindEmitters.get(n);
    await (h == null ? void 0 : h.emit(o, l));
  }
  createKindEmitter(n) {
    if (!this.kindEmitters.has(n)) {
      const o = new Nd();
      this.kindEmitters.set(n, o);
    }
    return this.kindEmitters.get(n);
  }
}
const qi = new EN(), IN = async (r) => {
  var o, l;
  const n = await ((o = qi.appClasses.get(r)) == null ? void 0 : o());
  return n && ((l = n.config) == null ? void 0 : l.singleton) ? r : `${r}-${aN().replace("-", "").slice(0, 8)}`;
}, Pu = (r, n) => {
  if (r.focusScenePath !== n)
    return r.focusScenePath = n, r;
}, Wb = (r, n) => {
  if (r && r.isWritable && r.state.sceneState.scenePath !== n) {
    const o = n === "/" ? "" : n;
    r.setScenePath(o);
  }
}, AN = (r, n, o) => {
  var l;
  if (r && n) {
    const m = (l = Ad(r)[n]) == null ? void 0 : l[o];
    if (m)
      return `${n}/${m.name}`;
  }
}, Fb = (r, n, o) => {
  r && r.scenePathType(n) !== qv.None && r.removeScenes(n, o);
}, RN = (r, n) => {
  et.once(r).then(n);
};
Ta(
  (r, n) => {
    r.emit("mainViewModeChange", n);
  },
  200
);
const DN = (r, n, o = 0) => {
  const l = Ad(r)[n];
  if (!l)
    return;
  const h = l[o];
  if (!h)
    return;
  const m = h.name;
  return n === Cr ? `/${m}` : `${n}/${m}`;
}, Ad = (r) => r.entireScenes(), Jh = (r, n, o, l) => {
  var h;
  for (let m = 0; m < o.length; ++m)
    if ((h = o[m].name) != null && h.includes("/"))
      throw new Error("scenes name can not have '/'");
  return r == null ? void 0 : r.putScenes(n, o, l);
}, NN = (r) => r.startsWith("/"), pb = (r) => {
  const n = r.split("/");
  n.pop();
  let o = n.join("/");
  return o === "" && (o = "/"), o;
}, kN = (r) => r.endsWith("/") ? r.slice(0, -1) : r, uT = (r) => {
  const n = r.split(".").map((o) => o.padStart(2, "0")).join("");
  return parseInt(n);
}, TM = (r) => new Promise((n) => setTimeout(n, r)), _N = (r) => r.split("").reduce((o, l) => (l === Cr && (o += 1), o), 0) === 1;
class PN {
  constructor(n) {
    this.manager = n, this.displayer = this.manager.displayer, this.mainMagixEventListener = (o) => {
      if (o.authorId !== this.displayer.observerId) {
        const l = o.payload;
        switch (l.eventName) {
          case Xt.AppMove: {
            this.appMoveHandler(l.payload);
            break;
          }
          case Xt.AppResize: {
            this.appResizeHandler(l.payload);
            break;
          }
          case Xt.AppBoxStateChange: {
            this.boxStateChangeHandler(l.payload);
            break;
          }
          case Xt.SetMainViewScenePath: {
            this.setMainViewScenePathHandler(l.payload);
            break;
          }
          case Xt.MoveCamera: {
            this.moveCameraHandler(l.payload);
            break;
          }
          case Xt.MoveCameraToContain: {
            this.moveCameraToContainHandler(l.payload);
            break;
          }
          case Xt.CursorMove: {
            this.cursorMoveHandler(l.payload);
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
            this.setAppFocusViewIndexHandler(l.payload);
            break;
          }
        }
      }
    }, this.appMoveHandler = (o) => {
      var l;
      (l = this.boxManager) == null || l.moveBox(o);
    }, this.appResizeHandler = (o) => {
      var l, h;
      (l = this.boxManager) == null || l.resizeBox(Object.assign(o, { skipUpdate: !0 })), (h = this.manager.room) == null || h.refreshViewSize();
    }, this.boxStateChangeHandler = (o) => {
      Dt.emit("boxStateChange", o);
    }, this.setMainViewScenePathHandler = ({ nextScenePath: o }) => {
      Pu(this.manager.mainView, o), Dt.emit("mainViewScenePathChange", o);
    }, this.moveCameraHandler = (o) => {
      rg(sS(o, ["animationMode"]), { ...this.manager.mainView.camera }) || this.manager.mainView.moveCamera(o);
    }, this.moveCameraToContainHandler = (o) => {
      this.manager.mainView.moveCameraToContain(o);
    }, this.cursorMoveHandler = (o) => {
      et.emit("cursorMove", o);
    }, this.rootDirRemovedHandler = () => {
      this.manager.createRootDirScenesCallback(), this.manager.mainViewProxy.rebind(), et.emit("rootDirRemoved");
    }, this.refreshHandler = () => {
      this.manager.windowManger._refresh();
    }, this.initMainViewCameraHandler = () => {
      this.manager.mainViewProxy.addCameraReaction();
    }, this.setAppFocusViewIndexHandler = (o) => {
      if (o.type === "main")
        this.manager.setSceneIndexWithoutSync(o.index);
      else if (o.type === "app" && o.appID) {
        const l = this.manager.appProxies.get(o.appID);
        l && l.setSceneIndexWithoutSync(o.index);
      }
    };
  }
  get boxManager() {
    return this.manager.boxManager;
  }
  addListeners() {
    this.displayer.addMagixEventListener(Vb, this.mainMagixEventListener);
  }
  removeListeners() {
    this.displayer.removeMagixEventListener(Vb, this.mainMagixEventListener);
  }
}
class zN extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: app duplicate exists and cannot be created again";
  }
}
class mL extends Error {
  constructor(n) {
    super(`[WindowManager]: app ${n} need register or provide src`);
  }
}
class vs extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: AppManager must be initialized";
  }
}
class ON extends Error {
  constructor(n) {
    super(`[WindowManager]: white-web-sdk version must large than ${n}`);
  }
}
class LN extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: kind must be a valid string";
  }
}
class BN extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: box need created";
  }
}
class jN extends Error {
  constructor() {
    super(...arguments), this.message = '[WindowManager]: ScenePath should start with "/"';
  }
}
class VN extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: boxManager not found";
  }
}
class UN extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: room phase only Connected can be bindContainer";
  }
}
const MM = "!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", HN = MM.length, cT = Array(20), Cd = () => {
  for (let r = 0; r < 20; r++)
    cT[r] = MM.charAt(Math.random() * HN);
  return cT.join("");
};
class kd {
  constructor() {
    this.disposers = /* @__PURE__ */ new Map();
  }
  add(n, o = Cd()) {
    return this.flush(o), this.disposers.set(o, n()), o;
  }
  addDisposer(n, o = Cd()) {
    return this.flush(o), this.disposers.set(o, n), o;
  }
  addEventListener(n, o, l, h, m = Cd()) {
    return this.add(() => (n.addEventListener(o, l, h), () => n.removeEventListener(o, l, h)), m), m;
  }
  setTimeout(n, o, l = Cd()) {
    return this.add(() => {
      const h = window.setTimeout(() => {
        this.remove(l), n();
      }, o);
      return () => window.clearTimeout(h);
    }, l);
  }
  setInterval(n, o, l = Cd()) {
    return this.add(() => {
      const h = window.setInterval(n, o);
      return () => window.clearInterval(h);
    }, l);
  }
  remove(n) {
    const o = this.disposers.get(n);
    return this.disposers.delete(n), o;
  }
  flush(n) {
    const o = this.remove(n);
    if (o)
      try {
        o();
      } catch (l) {
        console.error(l);
      }
  }
  flushAll() {
    this.disposers.forEach((n) => {
      try {
        n();
      } catch (o) {
        console.error(o);
      }
    }), this.disposers.clear();
  }
}
const EM = (r) => (n, o) => {
  if (n !== void 0)
    if (ag) {
      const l = (h) => {
        h.map((w) => w.kind).includes(r) && o();
      };
      return ag(n, l), o(), () => oS(n, l);
    } else
      return pg(
        () => n,
        () => {
          o();
        },
        {
          fireImmediately: !0
        }
      );
}, IM = (r, n, o) => {
  let l = null;
  const h = pg(
    r,
    () => {
      l && (l(), l = null);
      const m = r();
      xa(m) ? (l = () => oS(m, n), ag(m, n)) : o == null || o(m);
    },
    { fireImmediately: !0 }
  );
  return () => {
    l == null || l(), h();
  };
}, WN = EM(bM.Removed);
EM(bM.Inserted);
class FN {
  constructor() {
    this.listeners = /* @__PURE__ */ new Set();
  }
  get length() {
    return this.listeners.size;
  }
  dispatch(n) {
    this.listeners.forEach((o) => o(n));
  }
  addListener(n) {
    this.listeners.add(n);
  }
  removeListener(n) {
    this.listeners.delete(n);
  }
}
const mb = Object.keys;
function dT(r) {
  return Boolean(Bb(r, "__isRef"));
}
function $N(r) {
  return { k: Cd(), v: r, __isRef: !0 };
}
const ba = "_WM-STORAGE_";
class fT {
  constructor(n, o, l) {
    if (this._sideEffect = new kd(), this._destroyed = !1, this._refMap = /* @__PURE__ */ new WeakMap(), this._lastValue = /* @__PURE__ */ new Map(), this.onStateChanged = new FN(), l && !xa(l))
      throw new Error(`Default state for Storage ${o} is not an object.`);
    this._context = n, this.id = o || null, this._state = {};
    const h = this._getRawState(this._state);
    this._context.getIsWritable() && (this.id === null ? n.isAddApp && l && this.setState(l) : (h === this._state || !xa(h)) && (wn(this._context.getAttributes(), [ba]) || this._context.updateAttributes([ba], {}), this._context.updateAttributes([ba, this.id], this._state), l && this.setState(l))), mb(h).forEach((m) => {
      if (!(this.id === null && m === ba))
        try {
          const w = xa(h[m]) ? JSON.parse(JSON.stringify(h[m])) : h[m];
          dT(w) ? (this._state[m] = w.v, xa(w.v) && this._refMap.set(w.v, w)) : this._state[m] = w;
        } catch (w) {
          console.error(w);
        }
    }), this._sideEffect.addDisposer(
      IM(
        () => this.id === null ? n.getAttributes() : wn(n.getAttributes(), [ba, this.id]),
        this._updateProperties.bind(this),
        this.destroy.bind(this)
      )
    );
  }
  get state() {
    return this._destroyed && console.warn(`Accessing state on destroyed Storage "${this.id}"`), this._state;
  }
  addStateChangedListener(n) {
    return this.onStateChanged.addListener(n), () => this.onStateChanged.removeListener(n);
  }
  ensureState(n) {
    return this.setState(
      mb(n).reduce((o, l) => (Bb(this._state, l) || (o[l] = n[l]), o), {})
    );
  }
  setState(n) {
    if (this._destroyed) {
      console.error(new Error(`Cannot call setState on destroyed Storage "${this.id}".`));
      return;
    }
    if (!this._context.getIsWritable()) {
      console.error(
        new Error(`Cannot setState on Storage "${this.id}" without writable access`),
        n
      );
      return;
    }
    const o = mb(n);
    o.length > 0 && o.forEach((l) => {
      const h = n[l];
      if (h !== this._state[l])
        if (h === void 0)
          this._lastValue.set(l, this._state[l]), delete this._state[l], this._setRawState(l, h);
        else {
          this._lastValue.set(l, this._state[l]), this._state[l] = h;
          let m = h;
          if (xa(h)) {
            let w = this._refMap.get(h);
            w || (w = $N(h), this._refMap.set(h, w)), m = w;
          }
          this._setRawState(l, m);
        }
    });
  }
  emptyStorage() {
    if (!(YD(this._state) <= 0)) {
      if (this._destroyed) {
        console.error(new Error(`Cannot empty destroyed Storage "${this.id}".`));
        return;
      }
      if (!this._context.getIsWritable()) {
        console.error(new Error(`Cannot empty Storage "${this.id}" without writable access.`));
        return;
      }
      this.setState(GD(this._state, wM));
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
  _getRawState(n) {
    var o;
    return this.id === null ? (o = this._context.getAttributes()) != null ? o : n : wn(this._context.getAttributes(), [ba, this.id], n);
  }
  _setRawState(n, o) {
    if (this.id === null) {
      if (n === ba)
        throw new Error(`Cannot set attribute internal filed "${ba}"`);
      return this._context.updateAttributes([n], o);
    } else
      return this._context.updateAttributes([ba, this.id, n], o);
  }
  _updateProperties(n) {
    var o;
    if (this._destroyed) {
      console.error(
        new Error(`Cannot call _updateProperties on destroyed Storage "${this.id}".`)
      );
      return;
    }
    if (n.length > 0) {
      const l = {};
      for (let h = 0; h < n.length; h++)
        try {
          const m = n[h], w = m.key;
          if (this.id === null && w === ba)
            continue;
          const g = xa(m.value) ? JSON.parse(JSON.stringify(m.value)) : m.value;
          let S;
          switch (this._lastValue.has(w) && (S = this._lastValue.get(w), this._lastValue.delete(w)), m.kind) {
            case 2: {
              Bb(this._state, w) && (S = this._state[w], delete this._state[w]), l[w] = { oldValue: S };
              break;
            }
            default: {
              let C = g;
              if (dT(g)) {
                const { k: I, v: A } = g, z = this._state[w];
                xa(z) && ((o = this._refMap.get(z)) == null ? void 0 : o.k) === I ? C = z : (C = A, xa(A) && this._refMap.set(A, g));
              }
              C !== this._state[w] && (S = this._state[w], this._state[w] = C), l[w] = { newValue: C, oldValue: S };
              break;
            }
          }
        } catch (m) {
          console.error(m);
        }
      this.onStateChanged.dispatch(l);
    }
  }
}
class QN {
  constructor(n, o, l, h, m) {
    this.manager = n, this.boxManager = o, this.appId = l, this.appProxy = h, this.appOptions = m, this.mobxUtils = {
      autorun: xs,
      reaction: pg,
      toJS: eN
    }, this.objectUtils = {
      listenUpdated: ag,
      unlistenUpdated: oS,
      listenDisposed: tN,
      unlistenDisposed: nN
    }, this.store = this.manager.store, this.isReplay = this.manager.isReplay, this.getDisplayer = () => this.manager.displayer, this.getAttributes = () => this.appProxy.attributes, this.getScenes = () => {
      const w = this.store.getAppAttributes(this.appId);
      return w != null && w.isDynamicPPT ? this.appProxy.scenes : w == null ? void 0 : w.options.scenes;
    }, this.getView = () => this.appProxy.view, this.mountView = (w) => {
      const g = this.getView();
      g && (g.divElement = w, setTimeout(() => {
        var S;
        (S = this.getRoom()) == null || S.refreshViewSize(), Dt.emit("onAppViewMounted", { appId: this.appId, view: g });
      }, 1e3));
    }, this.getInitScenePath = () => this.manager.getAppInitPath(this.appId), this.getIsWritable = () => this.manager.canOperate, this.getIsAppReadonly = () => this.manager.appReadonly, this.getBox = () => {
      const w = this.boxManager.getBox(this.appId);
      if (w)
        return w;
      throw new BN();
    }, this.getRoom = () => this.manager.room, this.setAttributes = (w) => {
      this.manager.safeSetAttributes({ [this.appId]: w });
    }, this.updateAttributes = (w, g) => {
      this.manager.attributes[this.appId] && this.manager.safeUpdateAttributes([this.appId, ...w], g);
    }, this.setScenePath = async (w) => {
      var g;
      !this.appProxy.box || (this.appProxy.setFullPath(w), (g = this.getRoom()) == null || g.setScenePath(w));
    }, this.getAppOptions = () => typeof this.appOptions == "function" ? this.appOptions() : this.appOptions, this.createStorage = (w, g) => {
      const S = new fT(this, w, g);
      return this.emitter.on("destroy", () => {
        S.destroy();
      }), S;
    }, this.dispatchMagixEvent = (...w) => {
      var S;
      const g = `${this.appId}:${w[0]}`;
      return (S = this.manager.room) == null ? void 0 : S.dispatchMagixEvent(g, w[1]);
    }, this.addMagixEventListener = (w, g, S) => {
      const C = `${this.appId}:${w}`;
      return this.manager.displayer.addMagixEventListener(
        C,
        g,
        S
      ), () => this.manager.displayer.removeMagixEventListener(
        C,
        g
      );
    }, this.removeMagixEventListener = this.manager.displayer.removeMagixEventListener.bind(
      this.manager.displayer
    ), this.nextPage = async () => {
      const w = this.pageState.index + 1;
      return w > this.pageState.length - 1 ? (console.warn("[WindowManager] nextPage: index out of range"), !1) : (this.appProxy.setSceneIndex(w), !0);
    }, this.jumpPage = async (w) => 0 <= w && w < this.pageState.length ? (this.appProxy.setSceneIndex(w), !0) : (console.warn("[WindowManager] nextPage: index out of range"), !1), this.prevPage = async () => {
      const w = this.pageState.index - 1;
      return w < 0 ? (console.warn("[WindowManager] prevPage: index out of range"), !1) : (this.appProxy.setSceneIndex(w), !0);
    }, this.addPage = async (w) => {
      const g = w == null ? void 0 : w.after, S = w == null ? void 0 : w.scene, C = this.appProxy.scenePath;
      if (!!C)
        if (g) {
          const I = this.pageState.index + 1;
          Jh(this.manager.room, C, [S || {}], I);
        } else
          Jh(this.manager.room, C, [S || {}]);
    }, this.removePage = async (w) => {
      const g = w === void 0 ? this.pageState.index : w;
      return this.pageState.length === 1 ? (console.warn("[WindowManager]: can not remove the last page"), !1) : g < 0 || g >= this.pageState.length ? (console.warn(`[WindowManager]: page index ${w} out of range`), !1) : this.appProxy.removeSceneByIndex(g);
    }, this.emitter = h.appEmitter, this.isAddApp = h.isAddApp;
  }
  get storage() {
    return this._storage || (this._storage = new fT(this)), this._storage;
  }
  get pageState() {
    return this.appProxy.pageState;
  }
  get kind() {
    return this.appProxy.kind;
  }
  dispatchAppEvent(n, o) {
    et.emit(`custom-${this.kind}`, {
      kind: this.kind,
      appId: this.appId,
      type: n,
      value: o
    });
  }
  get extendWrapper() {
    return this.manager.extendWrapper;
  }
}
class ZN {
  constructor(n) {
    this.params = n, this.sceneNode = null, this.onSceneChange = (h) => {
      this.sceneNode = h, this.params.notifyPageStateChange();
    };
    const { displayer: o, scenePath: l } = this.params;
    l && (this.sceneNode = o.createScenesCallback(l, {
      onAddScene: this.onSceneChange,
      onRemoveScene: this.onSceneChange
    }));
  }
  getFullPath(n) {
    var l;
    const o = (l = this.sceneNode) == null ? void 0 : l.scenes;
    if (this.params.scenePath && o) {
      const h = o[n];
      if (h)
        return `${this.params.scenePath}/${h}`;
    }
  }
  toObject() {
    var n, o;
    return {
      index: ((n = this.params.view) == null ? void 0 : n.focusSceneIndex) || 0,
      length: ((o = this.sceneNode) == null ? void 0 : o.scenes.length) || 0
    };
  }
  destroy() {
    var n;
    (n = this.sceneNode) == null || n.dispose();
  }
}
var xi = /* @__PURE__ */ ((r) => (r.Apps = "apps", r.Focus = "focus", r.State = "state", r.BoxState = "boxState", r.MainViewCamera = "mainViewCamera", r.MainViewSize = "mainViewSize", r.Broadcaster = "broadcaster", r.Cursors = "cursors", r.Position = "position", r.CursorState = "cursorState", r.FullPath = "fullPath", r.Registered = "registered", r.IframeBridge = "iframeBridge", r))(xi || {});
class YN {
  constructor(n) {
    this.context = n, this.setAppFocus = (o, l) => {
      l ? this.context.safeSetAttributes({ focus: o }) : this.context.safeSetAttributes({ focus: void 0 });
    };
  }
  setContext(n) {
    this.context = n;
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
  getAppAttributes(n) {
    return wn(this.apps(), [n]);
  }
  getAppState(n) {
    return wn(this.apps(), [n, "state"]);
  }
  getMaximized() {
    return wn(this.attributes, ["maximizedBoxes"]);
  }
  getMinimized() {
    return wn(this.attributes, ["minimizedBoxes"]);
  }
  setupAppAttributes(n, o, l) {
    this.attributes.apps || this.context.safeSetAttributes({ apps: {} });
    const m = ["scenePath", "title"];
    l || m.push("scenes");
    const w = XD(n.options, m), g = { kind: n.kind, options: w, isDynamicPPT: l };
    typeof n.src == "string" && (g.src = n.src), g.createdAt = Date.now(), this.context.safeUpdateAttributes(["apps", o], g), this.context.safeUpdateAttributes(["apps", o, "state"], {
      [Ji.Size]: {},
      [Ji.Position]: {},
      [Ji.SceneIndex]: 0
    });
  }
  updateAppState(n, o, l) {
    wn(this.attributes, ["apps", n, "state"]) && this.context.safeUpdateAttributes(["apps", n, "state", o], l);
  }
  cleanAppAttributes(n) {
    this.context.safeUpdateAttributes(["apps", n], void 0), this.context.safeSetAttributes({ [n]: void 0 }), this.attributes.focus === n && this.cleanFocus();
  }
  cleanFocus() {
    this.context.safeSetAttributes({ focus: void 0 });
  }
  getAppSceneIndex(n) {
    var o;
    return (o = this.getAppState(n)) == null ? void 0 : o[Ji.SceneIndex];
  }
  getAppScenePath(n) {
    var o, l;
    return (l = (o = this.getAppAttributes(n)) == null ? void 0 : o.options) == null ? void 0 : l.scenePath;
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
  setMainViewScenePath(n) {
    this.context.safeSetAttributes({ _mainScenePath: n });
  }
  setMainViewSceneIndex(n) {
    this.context.safeSetAttributes({ _mainSceneIndex: n });
  }
  getMainViewCamera() {
    return wn(this.attributes, ["mainViewCamera"]);
  }
  getMainViewSize() {
    return wn(this.attributes, ["mainViewSize"]);
  }
  setMainViewCamera(n) {
    this.context.safeSetAttributes({ mainViewCamera: { ...n } });
  }
  setMainViewSize(n) {
    n.width === 0 || n.height === 0 || this.context.safeSetAttributes({ mainViewSize: { ...n } });
  }
  setMainViewCameraAndSize(n, o) {
    o.width === 0 || o.height === 0 || this.context.safeSetAttributes({
      mainViewCamera: { ...n },
      mainViewSize: { ...o }
    });
  }
  updateCursor(n, o) {
    wn(this.attributes, ["cursors"]) || this.context.safeUpdateAttributes(["cursors"], {}), wn(this.attributes, ["cursors", n]) || this.context.safeUpdateAttributes(["cursors", n], {}), this.context.safeUpdateAttributes(["cursors", n, "position"], o);
  }
  updateCursorState(n, o) {
    wn(this.attributes, ["cursors", n]) || this.context.safeUpdateAttributes(["cursors", n], {}), this.context.safeUpdateAttributes(["cursors", n, "cursorState"], o);
  }
  getCursorState(n) {
    return wn(this.attributes, ["cursors", n, "cursorState"]);
  }
  cleanCursor(n) {
    this.context.safeUpdateAttributes(["cursors", n], void 0);
  }
  setMainViewFocusPath(n) {
    const o = this.getMainViewScenePath();
    o && Pu(n, o);
  }
  getIframeBridge() {
    return wn(this.attributes, ["iframeBridge"]);
  }
  setIframeBridge(n) {
    if (xa(n)) {
      const o = this.getIframeBridge();
      for (const l in n) {
        const h = n[l];
        o[l] !== h && this.context.safeUpdateAttributes(["iframeBridge", l], h);
      }
    }
  }
}
const GN = new YN({
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
}, AM = (r, n) => {
  let o = 0;
  const l = n.length - 1;
  return r === n.index ? r === l ? o = r - 1 : o = n.index + 1 : o = n.index, o;
}, po = new Nd();
class uS {
  constructor(n, o, l, h) {
    var m;
    this.params = n, this.manager = o, this.boxManager = this.manager.boxManager, this.appProxies = this.manager.appProxies, this.viewManager = this.manager.viewManager, this.store = this.manager.store, this.status = "normal", this.getAppInitState = (w) => {
      var Y, fe;
      const g = this.store.getAppState(w);
      if (!g)
        return;
      const S = g == null ? void 0 : g[Ji.Position], C = this.store.focus, I = g == null ? void 0 : g[Ji.Size], A = g == null ? void 0 : g[Ji.SceneIndex], z = (Y = this.attributes) == null ? void 0 : Y.maximized, F = (fe = this.attributes) == null ? void 0 : fe.minimized, j = g == null ? void 0 : g.zIndex;
      let q = { maximized: z, minimized: F, zIndex: j };
      return S && (q = { ...q, id: w, x: S.x, y: S.y }), C === w && (q = { ...q, focus: !0 }), I && (q = { ...q, width: I.width, height: I.height }), A && (q = { ...q, sceneIndex: A }), q;
    }, this.appAttributesUpdateListener = (w) => {
      this.manager.refresher.add(w, () => xs(() => {
        const g = this.manager.attributes[w];
        g && this.appEmitter.emit("attributesUpdate", g);
      })), this.manager.refresher.add(this.stateKey, () => xs(() => {
        var S, C, I, A;
        const g = (S = this.appAttributes) == null ? void 0 : S.state;
        (g == null ? void 0 : g.zIndex) > 0 && g.zIndex !== ((C = this.box) == null ? void 0 : C.zIndex) && ((I = this.boxManager) == null || I.setZIndex(w, g.zIndex), (A = this.boxManager) == null || A.focusBox({ appId: w }));
      })), this.manager.refresher.add(`${w}-fullPath`, () => xs(() => {
        var S;
        const g = (S = this.appAttributes) == null ? void 0 : S.fullPath;
        this.setFocusScenePathHandler(g), this._prevFullPath !== g && (this.notifyPageStateChange(), this._prevFullPath = g);
      }));
    }, this.setFocusScenePathHandler = Ta((w) => {
      var g;
      this.view && w && w !== ((g = this.view) == null ? void 0 : g.focusScenePath) && (Pu(this.view, w), Dt.emit("onAppScenePathChange", { appId: this.id, view: this.view }));
    }, 50), this.notifyPageStateChange = Ta(() => {
      this.appEmitter.emit("pageStateChange", this.pageState);
    }, 50), this.kind = n.kind, this.id = l, this.stateKey = `${this.id}_state`, this.appProxies.set(this.id, this), this.appEmitter = new Nd(), this.appListener = this.makeAppEventListener(this.id), this.isAddApp = h, this.initScenes(), (m = this.params.options) != null && m.scenePath && this.createView(), this._pageState = new ZN({
      displayer: this.manager.displayer,
      scenePath: this.scenePath,
      view: this.view,
      notifyPageStateChange: this.notifyPageStateChange
    });
  }
  initScenes() {
    var o;
    const n = this.params.options;
    n && (this.scenePath = n.scenePath, ((o = this.appAttributes) == null ? void 0 : o.isDynamicPPT) && this.scenePath ? this.scenes = Ad(this.manager.displayer)[this.scenePath] : this.scenes = n.scenes);
  }
  get view() {
    return this.manager.viewManager.getView(this.id);
  }
  get viewIndex() {
    var n;
    return (n = this.view) == null ? void 0 : n.focusSceneIndex;
  }
  get isWritable() {
    var n;
    return this.manager.canOperate && !((n = this.box) != null && n.readonly);
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
    const n = wn(this.appAttributes, ["state", "SceneIndex"], 0), o = AN(this.manager.room, this.scenePath, n);
    return o && this.setFullPath(o), o;
  }
  setFullPath(n) {
    this.manager.safeUpdateAttributes(["apps", this.id, xi.FullPath], n);
  }
  async baseInsertApp(n = !1) {
    var m;
    const o = this.params;
    if (!o.kind)
      throw new Error("[WindowManager]: kind require");
    const l = await ((m = qi.appClasses.get(o.kind)) == null ? void 0 : m()), h = qi.registered.get(o.kind);
    if (l)
      await this.setupApp(
        this.id,
        n,
        l,
        o.options,
        h == null ? void 0 : h.appOptions
      );
    else
      throw new Error(`[WindowManager]: app load failed ${o.kind} ${o.src}`);
    return et.emit("updateManagerRect"), {
      appId: this.id,
      app: l
    };
  }
  get box() {
    var n;
    return (n = this.boxManager) == null ? void 0 : n.getBox(this.id);
  }
  async setupApp(n, o, l, h, m) {
    var g;
    if (Ca("setupApp", n, l, h), !this.boxManager)
      throw new VN();
    const w = new QN(this.manager, this.boxManager, n, this, m);
    this.appContext = w;
    try {
      et.once(`${n}${Xt.WindowCreated}`).then(async () => {
        var I, A, z, F, j, q, Y, fe, se, Z;
        let C;
        if (!o) {
          C = this.getAppInitState(n);
          const le = (z = (A = (I = this.boxManager) == null ? void 0 : I.teleBoxManager) == null ? void 0 : A.maximizedBoxes) == null ? void 0 : z.includes(n), oe = (q = (j = (F = this.boxManager) == null ? void 0 : F.teleBoxManager) == null ? void 0 : j.minimizedBoxes) == null ? void 0 : q.includes(n);
          Object.assign(C || {}, { maximized: le, minimized: oe }), (Y = this.boxManager) == null || Y.updateBoxState(C);
          const ke = (fe = this.boxManager) == null ? void 0 : fe.teleBoxManager.maximizedBoxes.filter(($e) => {
            var ze;
            return !((ze = this == null ? void 0 : this.boxManager) != null && ze.teleBoxManager.minimizedBoxes.includes($e));
          });
          ke != null && ke.length && ((Z = (se = this.boxManager) == null ? void 0 : se.teleBoxManager) == null || Z.makeBoxTopFromMaximized());
        }
        this.appEmitter.onAny(this.appListener), this.appAttributesUpdateListener(n), this.setViewFocusScenePath(), setTimeout(async () => {
          console.log("setup app", l);
          const le = await l.setup(w);
          this.appResult = le, qi.notifyApp(this.kind, "created", { appId: n, result: le }), this.afterSetupApp(C), this.fixMobileSize(), Dt.emit("onAppSetup", n);
        }, CM);
      }), (g = this.boxManager) == null || g.createBox({
        appId: n,
        app: l,
        options: h,
        canOperate: this.manager.canOperate,
        smartPosition: this.isAddApp
      }), this.isAddApp && this.box && (this.store.updateAppState(n, Ji.ZIndex, this.box.zIndex), this.store.updateAppState(n, Ji.Size, {
        width: this.box.intrinsicWidth,
        height: this.box.intrinsicHeight
      }), this.boxManager.focusBox({ appId: n }, !1));
      const S = this.store.attributes.mainViewBackgroundImg;
      et.emit("onBackgroundImgChange", S);
    } catch (S) {
      throw console.error(S), new Error(`[WindowManager]: app setup error: ${S.message}`);
    }
  }
  fixMobileSize() {
    var o, l;
    const n = (o = this.boxManager) == null ? void 0 : o.getBox(this.id);
    n && ((l = this.boxManager) == null || l.resizeBox({
      appId: this.id,
      width: n.intrinsicWidth + 1e-3,
      height: n.intrinsicHeight + 1e-3,
      skipUpdate: !0
    }));
  }
  afterSetupApp(n) {
    var o;
    n && (!(n != null && n.x) || !n.y) && ((o = this.boxManager) == null || o.setBoxInitState(this.id));
  }
  async onSeek(n) {
    var l;
    this.appEmitter.emit("seek", n).catch((h) => {
      console.log(`[WindowManager]: emit seek error: ${h.message}`);
    });
    const o = this.getAppInitState(this.id);
    (l = this.boxManager) == null || l.updateBoxState(o);
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
    const l = this.params;
    await new uS(l, this.manager, this.id, this.isAddApp).baseInsertApp(!0), (m = this.boxManager) == null || m.updateBoxState(o);
  }
  async onRemoveScene(n) {
    if (this.scenePath && n.startsWith(this.scenePath + "/")) {
      let o = this.pageState.index, l = this._pageState.getFullPath(o);
      l || (o = 0, l = this._pageState.getFullPath(o)), l && this.setFullPath(l), this.setViewFocusScenePath(), this.view && (this.view.focusSceneIndex = o);
    }
  }
  emitAppSceneStateChange(n) {
    this.appEmitter.emit("sceneStateChange", n);
  }
  emitAppIsWritableChange() {
    this.appEmitter.emit("writableChange", this.isWritable);
  }
  makeAppEventListener(n) {
    return (o, l) => {
      var h, m, w, g;
      if (!!this.manager.canOperate)
        switch (o) {
          case "setBoxSize": {
            (h = this.boxManager) == null || h.resizeBox({
              appId: n,
              width: l.width,
              height: l.height,
              skipUpdate: !1
            });
            break;
          }
          case "setBoxMinSize": {
            (m = this.boxManager) == null || m.setBoxMinSize({
              appId: n,
              minWidth: l.minwidth,
              minHeight: l.minheight
            });
            break;
          }
          case "setBoxTitle": {
            (w = this.boxManager) == null || w.setBoxTitle({ appId: n, title: l.title });
            break;
          }
          case SM.destroy: {
            if (this.status === "destroyed")
              return;
            this.destroy(!0, !1, !0, l == null ? void 0 : l.error), l != null && l.error && console.error(l == null ? void 0 : l.error);
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
    const n = this.getFullScenePath();
    this.manager.room && n && this.view && Wb(this.manager.room, n);
  }
  setViewFocusScenePath() {
    const n = this.getFullScenePath();
    return n && this.view && Pu(this.view, n), n;
  }
  async createView() {
    const n = await this.viewManager.createView(this.id);
    return this.setViewFocusScenePath(), n;
  }
  get pageState() {
    return this._pageState.toObject();
  }
  async removeSceneByIndex(n) {
    const o = this._pageState.getFullPath(n);
    if (o) {
      const l = AM(n, this.pageState);
      return this.setSceneIndexWithoutSync(l), this.manager.dispatchInternalEvent(Xt.SetAppFocusIndex, {
        type: "app",
        appID: this.id,
        index: l
      }), setTimeout(() => {
        Fb(this.manager.room, o, n);
      }, 100), !0;
    } else
      return !1;
  }
  setSceneIndexWithoutSync(n) {
    this.view && (this.view.focusSceneIndex = n);
  }
  setSceneIndex(n) {
    if (this.view) {
      this.view.focusSceneIndex = n;
      const o = this._pageState.getFullPath(n);
      o && this.setFullPath(o);
    }
  }
  async destroy(n, o, l, h) {
    var m;
    if (this.status !== "destroyed") {
      this.status = "destroyed";
      try {
        await qi.notifyApp(this.kind, "destroy", { appId: this.id }), await this.appEmitter.emit("destroy", { error: h });
      } catch (w) {
        console.error("[WindowManager]: notifyApp error", w.message, w.stack);
      }
      this.appEmitter.clearListeners(), et.emit(`destroy-${this.id}`, { error: h }), n && ((m = this.boxManager) == null || m.closeBox(this.id, l)), o && (this.store.cleanAppAttributes(this.id), this.scenePath && Fb(this.manager.room, this.scenePath)), this.appProxies.delete(this.id), this._pageState.destroy(), this.viewManager.destroyView(this.id), this.manager.appStatus.delete(this.id), this.manager.refresher.remove(this.id), this.manager.refresher.remove(this.stateKey), this.manager.refresher.remove(`${this.id}-fullPath`), this._prevFullPath = void 0;
    }
  }
  close() {
    return this.destroy(!0, !0, !1);
  }
}
class XN {
  constructor(n) {
    this.displayer = n, this.views = /* @__PURE__ */ new Map();
  }
  createView(n) {
    const o = RM(this.displayer);
    return this.views.set(n, o), o;
  }
  getView(n) {
    return this.views.get(n);
  }
  destroyView(n) {
    const o = this.views.get(n);
    if (o) {
      try {
        o.release();
      } catch {
      }
      this.views.delete(n);
    }
  }
  setViewScenePath(n, o) {
    const l = this.views.get(n);
    l && (l.focusScenePath = o);
  }
  destroy() {
    this.views.forEach((n) => {
      try {
        n.release();
      } catch {
      }
    }), this.views.clear();
  }
}
const RM = (r) => {
  const n = r.views.createView();
  return JN(n), n;
}, JN = (r) => {
  r.setCameraBound({
    maxContentMode: () => 10,
    minContentMode: () => 0.1
  });
};
class qN {
  constructor(n) {
    this.manager = n, this.polling = !1, this.started = !1, this.mainViewIsAddListener = !1, this.store = this.manager.store, this.viewMode = this.manager.windowManger.viewMode, this.sideEffectManager = new kd(), this.syncCamera = () => {
      if (!this.polling || this.viewMode !== sl.Broadcaster)
        return;
      const { mainViewCamera: l } = this;
      l && l.id !== this.manager.uid && this.moveCameraSizeByAttributes();
    }, this.startListenWritableChange = () => {
      this.sideEffectManager.add(() => et.on("writableChange", (l) => {
        l && this.ensureCameraAndSize(), this.manager.room && this.syncMainView(this.manager.room);
      }));
    }, this.addCameraReaction = () => {
      this.manager.refresher.add(xi.MainViewCamera, this.cameraReaction);
    }, this.cameraReaction = () => pg(
      () => this.mainViewCamera,
      (l) => {
        l && l.id !== this.manager.uid && (this.moveCameraToContian(this.mainViewSize), this.moveCamera(l));
      },
      { fireImmediately: !0 }
    ), this.sizeChangeHandler = Ta((l) => {
      l && (this.moveCameraToContian(l), this.moveCamera(this.mainViewCamera)), this.ensureMainViewSize();
    }, 30), this.onUpdateContainerSizeRatio = () => {
      const l = this.store.getMainViewSize();
      this.sizeChangeHandler(l);
    }, this.onCameraUpdatedByDevice = (l) => {
      this.viewMode !== sl.Follower && (this.store.setMainViewCamera({ ...l, id: this.manager.uid }), rg(this.mainViewSize, { ...this.mainView.size, id: this.manager.uid }) || this.setMainViewSize(this.view.size));
    }, this.mainViewClickListener = () => {
      this.mainViewClickHandler();
    }, this.setMainViewSize = Ta((l) => {
      this.store.setMainViewSize({ ...l, id: this.manager.uid });
    }, 50), this._syncMainViewTimer = 0, this.onCameraOrSizeUpdated = () => {
      Dt.emit("cameraStateChange", this.cameraState), this.manager.room && this.manager.room.syncMainView && (clearTimeout(this._syncMainViewTimer), this._syncMainViewTimer = setTimeout(this.syncMainView, 100, this.manager.room)), this.ensureMainViewSize();
    }, this.syncMainView = (l) => {
      l.isWritable && l.syncMainView(this.mainView);
    }, this.setViewMode = (l) => {
      this.viewMode = l;
    }, this.mainView = this.createMainView(), this.moveCameraSizeByAttributes(), et.once("mainViewMounted").then(() => {
      this.addMainViewListener(), this.start(), this.ensureCameraAndSize(), this.startListenWritableChange();
    });
    const o = () => {
      this.sizeChangeHandler(this.mainViewSize);
    };
    this.sideEffectManager.add(() => et.on("playgroundSizeChange", o)), this.sideEffectManager.add(() => et.on("containerSizeRatioUpdate", this.onUpdateContainerSizeRatio)), this.sideEffectManager.add(() => et.on("startReconnect", () => {
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
    const n = { ...this.mainView.camera, id: this.manager.uid }, o = { ...this.mainView.size, id: this.manager.uid };
    this.store.setMainViewCameraAndSize(n, o);
  }
  get view() {
    return this.mainView;
  }
  get cameraState() {
    return { ...this.view.camera, ...this.view.size };
  }
  createMainView() {
    const n = RM(this.manager.displayer), o = this.store.getMainViewScenePath();
    return o && Pu(n, o), n;
  }
  onReconnect() {
    if (this.didRelease)
      this.rebind();
    else {
      const n = this.store.getMainViewScenePath();
      this.setFocusScenePath(n);
    }
  }
  setFocusScenePath(n) {
    if (n)
      return Pu(this.view, n);
  }
  rebind() {
    const n = this.mainView.divElement, o = this.mainView.disableCameraTransform;
    this.stop(), this.didRelease || this.mainView.release(), this.removeMainViewListener(), this.mainView = this.createMainView(), this.mainView.disableCameraTransform = o, this.mainView.divElement = n, this.addMainViewListener(), this.start(), Dt.emit("onMainViewRebind", this.mainView);
  }
  addMainViewListener() {
    this.mainViewIsAddListener || this.view.divElement && (this.view.divElement.addEventListener("click", this.mainViewClickListener), this.view.divElement.addEventListener("touchend", this.mainViewClickListener), this.mainViewIsAddListener = !0);
  }
  removeMainViewListener() {
    this.view.divElement && (this.view.divElement.removeEventListener("click", this.mainViewClickListener), this.view.divElement.removeEventListener("touchend", this.mainViewClickListener)), this.mainViewIsAddListener = !1;
  }
  async mainViewClickHandler() {
    var n;
    !this.manager.canOperate || (this.store.cleanFocus(), (n = this.manager.boxManager) == null || n.blurAllBox());
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
  moveCameraToContian(n) {
    Xh(n) || (this.view.moveCameraToContain({
      width: n.width,
      height: n.height,
      originX: -n.width / 2,
      originY: -n.height / 2,
      animationMode: sg.Immediately
    }), this.scale = this.view.camera.scale);
  }
  moveCamera(n) {
    if (!Xh(n)) {
      if (rg(n, this.view.camera))
        return;
      const { centerX: o, centerY: l, scale: h } = n, m = h * (this.scale || 1);
      this.view.moveCamera({
        centerX: o,
        centerY: l,
        scale: m,
        animationMode: sg.Immediately
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
class KN {
  constructor(n) {
    this.context = n, this.addRedoUndoListeners = (o) => {
      if (o === void 0)
        this.addViewCallbacks(
          this.context.mainView(),
          this.onCanRedoStepsUpdate,
          this.onCanUndoStepsUpdate
        );
      else {
        const l = this.context.getAppProxy(o);
        l && l.view && this.addViewCallbacks(
          l.view,
          this.onCanRedoStepsUpdate,
          this.onCanUndoStepsUpdate
        );
      }
    }, this.addViewCallbacks = (o, l, h) => {
      l(o.canRedoSteps), h(o.canUndoSteps), o.callbacks.on("onCanRedoStepsUpdate", l), o.callbacks.on("onCanUndoStepsUpdate", h);
    }, this.disposeViewCallbacks = (o) => {
      o.callbacks.off("onCanRedoStepsUpdate", this.onCanRedoStepsUpdate), o.callbacks.off("onCanUndoStepsUpdate", this.onCanUndoStepsUpdate);
    }, this.onCanRedoStepsUpdate = (o) => {
      Dt.emit("canRedoStepsChange", o);
    }, this.onCanUndoStepsUpdate = (o) => {
      Dt.emit("canUndoStepsChange", o);
    }, this.disposePrevFocusViewRedoUndoListeners = (o) => {
      let l;
      if (o === void 0)
        l = this.context.mainView();
      else {
        const h = this.context.getAppProxy(o);
        h && h.view && (l = h.view);
      }
      l && this.disposeViewCallbacks(l);
    }, et.on("focusedChange", (o) => {
      this.disposePrevFocusViewRedoUndoListeners(o.prev), setTimeout(() => {
        this.addRedoUndoListeners(o.focused);
      }, 0);
    }), et.on("rootDirRemoved", () => {
      this.disposePrevFocusViewRedoUndoListeners(n.focus()), this.addRedoUndoListeners(n.focus());
    }), this.addRedoUndoListeners(n.focus());
  }
  destroy() {
    this.disposePrevFocusViewRedoUndoListeners(this.context.focus());
  }
}
class ek {
  constructor(n) {
    this.windowManger = n, this.appProxies = /* @__PURE__ */ new Map(), this.appStatus = /* @__PURE__ */ new Map(), this.store = GN, this.isReplay = this.windowManger.isReplay, this.mainViewScenesLength = 0, this.callbacksNode = null, this.appCreateQueue = new fN(), this.sideEffectManager = new kd(), this.sceneState = null, this.rootDirRemoving = !1, this.onRemoveScenes = async (o) => {
      var h, m;
      const { scenePath: l } = o;
      if (l === Cr) {
        await this.onRootDirRemoved(), this.dispatchInternalEvent(Xt.RootDirRemoved);
        return;
      }
      if (_N(l)) {
        let w = this.mainView.focusSceneIndex || 0, g = (h = this.callbacksNode) == null ? void 0 : h.scenes[w];
        g || (w = 0, g = (m = this.callbacksNode) == null ? void 0 : m.scenes[w]), g && this.setMainViewScenePath(`${Cr}${g}`), await this.setMainViewSceneIndex(w);
      } else
        this.appProxies.forEach((w) => {
          w.onRemoveScene(l);
        });
    }, this.onReadonlyChanged = () => {
      this.appProxies.forEach((o) => {
        o.emitAppIsWritableChange();
      });
    }, this.onPlayerSeekStart = async () => {
      await this.closeAll();
    }, this.onPlayerSeekDone = async (o) => {
      await this.attributesUpdateCallback(this.attributes.apps), this.appProxies.forEach((l) => {
        l.onSeek(o);
      });
    }, this.createRootDirScenesCallback = () => {
      let o = !1;
      this.callbacksNode && (this.callbacksNode.dispose(), o = !0), this.callbacksNode = this.displayer.createScenesCallback(Cr, {
        onAddScene: this.onSceneChange,
        onRemoveScene: async (l, h) => {
          await this.onSceneChange(l), et.emit("rootDirSceneRemoved", h);
        }
      }), this.callbacksNode && (this.updateSceneState(this.callbacksNode), this.mainViewScenesLength = this.callbacksNode.scenes.length, o && this.emitMainViewScenesChange(this.callbacksNode.scenes.length));
    }, this.removeSceneByIndex = async (o) => {
      var m;
      const l = AM(o, this.windowManger.pageState);
      this.setSceneIndexWithoutSync(l), this.dispatchInternalEvent(Xt.SetAppFocusIndex, { type: "main", index: l });
      const h = (m = this.callbacksNode) == null ? void 0 : m.scenes[o];
      return setTimeout(() => {
        h && Fb(this.room, `${Cr}${h}`, o);
      }, 100), new Promise((w, g) => {
        et.once("rootDirSceneRemoved").then((S) => {
          S === h && w(!0);
        }).catch((S) => {
          console.log(`[WindowManager]: removePage error: ${S}`), g(!1);
        });
      });
    }, this.setSceneIndexWithoutSync = (o) => {
      var h;
      const l = (h = this.callbacksNode) == null ? void 0 : h.scenes[o];
      l && this.mainViewProxy.setFocusScenePath(`${Cr}${l}`);
    }, this.onSceneChange = (o) => (this.mainViewScenesLength = o.scenes.length, this.updateSceneState(o), this.emitMainViewScenesChange(this.mainViewScenesLength)), this.emitMainViewScenesChange = (o) => Promise.all([
      Dt.emit("mainViewScenesLengthChange", o),
      et.emit("changePageState")
    ]), this.updateSceneState = (o) => {
      const l = this.store.getMainViewSceneIndex() || 0;
      let h = o.scenes[l];
      h || (h = o.scenes[this.mainView.focusSceneIndex || 0]), this.sceneState = {
        scenePath: `${Cr}${h}`,
        contextPath: o.path,
        index: l,
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
      const l = this.appProxies.get(o.appId);
      l && l.destroy(!1, !0, !0, o.error), Dt.emit("onBoxClose", o);
    }, this.onBoxStateChange = (o) => {
      this.dispatchInternalEvent(Xt.AppBoxStateChange, o), Dt.emit("onBoxStateChange", o);
    }, this.addAppsChangeListener = () => {
      this.refresher.add("apps", () => IM(
        () => this.attributes.apps,
        () => {
          this.attributesUpdateCallback(this.attributes.apps);
        }
      ));
    }, this.addAppCloseListener = () => {
      this.refresher.add("appsClose", () => WN(this.attributes.apps, () => {
        this.onAppDelete(this.attributes.apps);
      }));
    }, this.onMainViewIndexChange = (o) => {
      o !== void 0 && this._prevSceneIndex !== o && (Dt.emit("mainViewSceneIndexChange", o), et.emit("changePageState"), this.callbacksNode && this.updateSceneState(this.callbacksNode), this._prevSceneIndex = o);
    }, this.onFocusChange = (o) => {
      var l;
      this._prevFocused !== o && (Dt.emit("focusedChange", o), et.emit("focusedChange", { focused: o, prev: this._prevFocused }), this._prevFocused = o, o !== void 0 && ((l = this.boxManager) == null || l.focusBox({ appId: o }), setTimeout(() => {
        const h = this.appProxies.get(o);
        h && qi.notifyApp(h.kind, "focus", { appId: o });
      }, 0)));
    }, this.attributesUpdateCallback = Ta(
      (o) => this._attributesUpdateCallback(o),
      100
    ), this._appIds = [], this.onRegisteredChange = (o) => {
      !o || Object.entries(o).forEach(([l, h]) => {
        qi.appClasses.has(l) || qi.register({
          kind: l,
          src: h.src,
          name: h.name
        });
      });
    }, this.onMinimized = (o) => {
      var l;
      ((l = this.boxManager) == null ? void 0 : l.minimized) !== o && setTimeout(() => {
        var h;
        (h = this.boxManager) == null || h.setMinimized(o);
      }, 0);
    }, this.onAppDelete = async (o) => {
      const l = Object.keys(o);
      for (const [h, m] of this.appProxies.entries())
        l.includes(h) || await m.destroy(!0, !1, !0);
    }, this.closeAll = async () => {
      for (const [o, l] of this.appProxies.entries())
        await l.destroy(!0, !1, !0);
    }, this.displayerStateListener = (o) => {
      this.appProxies.forEach((l) => {
        l.appEmitter.emit("roomStateChange", o);
      }), et.emit("observerIdChange", this.displayer.observerId);
    }, this.displayerWritableListener = (o) => {
      var m, w;
      const l = !o, h = this.windowManger.readonly === void 0 || this.windowManger.readonly === !1;
      this.windowManger.readonly === void 0 ? (m = this.boxManager) == null || m.setReadonly(o) : (w = this.boxManager) == null || w.setReadonly(!(l && h)), this.appProxies.forEach((g) => {
        g.emitAppIsWritableChange();
      }), et.emit("writableChange", l);
    }, this.updateSceneIndex = () => {
      const o = this.store.getMainViewScenePath(), l = pb(o), h = Ad(this.displayer)[l];
      if (h.length) {
        const m = o.replace(l, "").replace("/", ""), w = h.findIndex((g) => g.name === m);
        JD(w) && w >= 0 && this.safeSetAttributes({ _mainSceneIndex: w });
      }
    }, this.updateRootDirRemoving = (o) => {
      this.rootDirRemoving = o;
    }, this.displayer = n.displayer, this.store.setContext({
      getAttributes: () => this.attributes,
      safeSetAttributes: (o) => this.safeSetAttributes(o),
      safeUpdateAttributes: (o, l) => this.safeUpdateAttributes(o, l)
    }), this.mainViewProxy = new qN(this), this.viewManager = new XN(this.displayer), this.appListeners = new PN(this), this.displayer.callbacks.on(this.eventName, this.displayerStateListener), this.appListeners.addListeners(), this.refresher = sL, this.refresher.setRoom(this.room), this.refresher.setContext({ emitter: et }), this.sideEffectManager.addDisposer(() => {
      var o, l;
      this.appCreateQueue.destroy(), this.mainViewProxy.destroy(), this.refresher.destroy(), this.viewManager.destroy(), (o = this.boxManager) == null || o.destroy(), (l = this.callbacksNode) == null || l.dispose();
    }), et.once("onCreated").then(() => this.onCreated()), et.on("onReconnected", () => this.onReconnected()), lS(this.displayer) && (et.on("seekStart", this.onPlayerSeekStart), et.on("seek", this.onPlayerSeekDone)), et.on("removeScenes", this.onRemoveScenes), et.on("setReadonly", this.onReadonlyChanged), this.createRootDirScenesCallback(), qi.setSyncRegisterApp((o) => {
      this.safeUpdateAttributes([xi.Registered, o.kind], o);
    });
  }
  getMemberState() {
    var n;
    return ((n = this.room) == null ? void 0 : n.state.memberState) || { strokeColor: [0, 0, 0] };
  }
  async onRootDirRemoved(n = !0) {
    this.setMainViewScenePath(xM), this.createRootDirScenesCallback();
    for (const [o, l] of this.appProxies.entries())
      l.view && await this.closeApp(o, n);
    this.mainViewProxy.rebind(), et.emit("rootDirRemoved"), this.updateRootDirRemoving(!1);
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
  set polling(n) {
    this.mainViewProxy.polling = n;
  }
  get focusApp() {
    if (this.store.focus)
      return this.appProxies.get(this.store.focus);
  }
  get extendWrapper() {
    return this.windowManger.extendWrapper;
  }
  get uid() {
    var n;
    return ((n = this.room) == null ? void 0 : n.uid) || "";
  }
  getMainViewSceneDir() {
    const n = this.store.getMainViewScenePath();
    if (n)
      return pb(n);
    throw new Error("[WindowManager]: mainViewSceneDir not found");
  }
  async onCreated() {
    var n;
    if (await this.attributesUpdateCallback(this.attributes.apps), et.emit("updateManagerRect"), po.on("move", this.onBoxMove), po.on("resize", this.onBoxResize), po.on("focus", this.onBoxFocus), po.on("close", this.onBoxClose), po.on("boxStateChange", this.onBoxStateChange), this.addAppsChangeListener(), this.addAppCloseListener(), this.refresher.add("maximizedBoxes", () => xs(() => {
      var l;
      const o = this.attributes.maximizedBoxes;
      (l = this.boxManager) == null || l.setMaximized(o);
    })), this.refresher.add("minimizedBoxes", () => xs(() => {
      const o = this.attributes.minimizedBoxes;
      this.onMinimized(o);
    })), this.refresher.add("mainViewIndex", () => xs(() => {
      const o = wn(this.attributes, "_mainSceneIndex");
      this.onMainViewIndexChange(o);
    })), this.refresher.add("focusedChange", () => xs(() => {
      const o = wn(this.attributes, "focus");
      this.onFocusChange(o);
    })), this.refresher.add("registeredChange", () => xs(() => {
      const o = wn(this.attributes, xi.Registered);
      this.onRegisteredChange(o);
    })), !this.attributes.apps || Object.keys(this.attributes.apps).length === 0) {
      const o = this.store.getMainViewScenePath();
      if (!o)
        return;
      this.resetScenePath(o);
    }
    this.displayerWritableListener(!((n = this.room) != null && n.isWritable)), this.displayer.callbacks.on("onEnableWriteNowChanged", this.displayerWritableListener), this._prevFocused = this.attributes.focus, this.sideEffectManager.add(() => {
      const o = new KN({
        mainView: () => this.mainViewProxy.view,
        focus: () => this.attributes.focus,
        getAppProxy: (l) => this.appProxies.get(l)
      });
      return () => o.destroy();
    });
  }
  notifyAppsChange(n) {
    (this._appIds.length !== n.length || !this._appIds.every((o) => n.includes(o))) && (this._appIds = n, Dt.emit("appsChange", n));
  }
  async _attributesUpdateCallback(n) {
    if (n && Wt.container) {
      const o = Object.keys(n);
      o.length === 0 && this.appCreateQueue.emitReady();
      const h = qD(
        o.map((m) => ({
          id: m,
          createdAt: n[m].createdAt
        })),
        "createdAt",
        "asc"
      ).map(({ id: m }) => m);
      this.notifyAppsChange(h);
      for (const m of h)
        if (!this.appProxies.has(m) && !this.appStatus.has(m)) {
          const w = n[m];
          try {
            if (!this.attributes[m])
              throw new Error("appAttributes is undefined");
            this.appCreateQueue.push(() => (this.appStatus.set(m, Ub.StartCreate), this.baseInsertApp(
              {
                kind: w.kind,
                options: w.options,
                isDynamicPPT: w.isDynamicPPT
              },
              m,
              !1
            ))), this.focusByAttributes(n);
          } catch (g) {
            console.warn("[WindowManager]: Insert App Error", g);
          }
        }
    }
  }
  refresh() {
    this.attributesUpdateCallback(this.attributes.apps);
  }
  setBoxManager(n) {
    this.boxManager = n;
  }
  resetMaximized() {
    var n;
    (n = this.boxManager) == null || n.setMaximized(this.store.getMaximized() ? this.store.getMaximized() : []);
  }
  resetMinimized() {
    var n;
    (n = this.boxManager) == null || n.setMinimized(this.store.getMinimized() ? this.store.getMinimized() : []);
  }
  bindMainView(n, o) {
    const l = this.mainViewProxy.view;
    l.disableCameraTransform = o, l.divElement = n, l.focusScenePath || this.setMainViewFocusPath(), et.emit("mainViewMounted"), Dt.emit("onMainViewMounted", l);
  }
  setMainViewFocusPath(n) {
    var l;
    const o = n || this.store.getMainViewScenePath();
    if (o)
      return Pu(this.mainView, o), ((l = this.mainView) == null ? void 0 : l.focusScenePath) === o;
  }
  resetScenePath(n) {
    this.displayer.state.sceneState.scenePath !== n && Wb(this.room, n);
  }
  async addApp(n, o) {
    Ca("addApp", n);
    const { appId: l, needFocus: h } = await this.beforeAddApp(n, o), m = await this.baseInsertApp(n, l, !0, h);
    return this.afterAddApp(m), m == null ? void 0 : m.id;
  }
  async beforeAddApp(n, o) {
    var w, g;
    const l = await IN(n.kind);
    this.appStatus.set(l, Ub.StartCreate);
    const h = (w = n.attributes) != null ? w : {};
    this.safeUpdateAttributes([l], h), this.store.setupAppAttributes(n, l, o);
    const m = !((g = this.boxManager) != null && g.minimized);
    return m && this.store.setAppFocus(l, !0), { appId: l, needFocus: m };
  }
  afterAddApp(n) {
    var o;
    if (n && n.box) {
      const l = n.box;
      po.emit("move", {
        appId: n.id,
        x: l == null ? void 0 : l.intrinsicX,
        y: l == null ? void 0 : l.intrinsicY
      }), this.store.updateAppState(n.id, Ji.ZIndex, l.zIndex);
    }
    (o = this.boxManager) != null && o.minimized;
  }
  async closeApp(n, o = !0) {
    const l = this.appProxies.get(n);
    l && l.destroy(!0, o, !1);
  }
  async baseInsertApp(n, o, l, h) {
    if (this.appProxies.has(o)) {
      console.warn("[WindowManager]: app duplicate exists and cannot be created again");
      return;
    }
    const m = new uS(n, this, o, l);
    if (m)
      return await m.baseInsertApp(h), this.appStatus.delete(o), m;
    throw this.appStatus.delete(o), new Error("[WindowManger]: initialize AppProxy failed");
  }
  safeSetAttributes(n) {
    this.windowManger.safeSetAttributes(n);
  }
  safeUpdateAttributes(n, o) {
    this.windowManger.safeUpdateAttributes(n, o);
  }
  async setMainViewScenePath(n) {
    if (this.room) {
      const o = this.displayer.scenePathType(n);
      if (pb(n) !== Cr)
        throw new Error('[WindowManager]: main view scenePath must in root dir "/"');
      if (o === qv.None)
        throw new Error(`[WindowManager]: ${n} not valid scene`);
      if (o === qv.Page)
        await this._setMainViewScenePath(n);
      else if (o === qv.Dir) {
        const h = DN(this.displayer, n);
        h && await this._setMainViewScenePath(h);
      }
    }
  }
  async _setMainViewScenePath(n) {
    this.setMainViewFocusPath(n) && (this.safeSetAttributes({ _mainScenePath: n }), this.store.setMainViewFocusPath(this.mainView), this.updateSceneIndex(), this.dispatchSetMainViewScenePath(n));
  }
  async setMainViewSceneIndex(n) {
    var o;
    if (this.room) {
      if (this.store.getMainViewSceneIndex() === n)
        return;
      const l = (o = this.callbacksNode) == null ? void 0 : o.scenes[n], h = `${Cr}${l}`;
      if (l)
        this.setMainViewFocusPath(h) && (this.store.setMainViewScenePath(h), this.store.setMainViewSceneIndex(n), this.dispatchSetMainViewScenePath(h));
      else
        throw new Error(`[WindowManager]: ${n} not valid index`);
    }
  }
  dispatchSetMainViewScenePath(n) {
    this.dispatchInternalEvent(Xt.SetMainViewScenePath, { nextScenePath: n }), Dt.emit("mainViewScenePathChange", n), Wb(this.room, n);
  }
  getAppInitPath(n) {
    var l;
    const o = this.store.getAppAttributes(n);
    if (o)
      return (l = o == null ? void 0 : o.options) == null ? void 0 : l.scenePath;
  }
  safeDispatchMagixEvent(n, o) {
    this.canOperate && this.displayer.dispatchMagixEvent(n, o);
  }
  focusByAttributes(n) {
    var o;
    if (n && Object.keys(n).length === ((o = this.boxManager) == null ? void 0 : o.boxSize)) {
      const l = this.store.focus;
      l && this.boxManager.focusBox({ appId: l });
    }
  }
  async onReconnected() {
    this.attributesUpdateCallback(this.attributes.apps);
    const o = Array.from(this.appProxies.values()).map((l) => l.onReconnected());
    this.mainViewProxy.onReconnect(), await Promise.all(o), this.callbacksNode && this.onSceneChange(this.callbacksNode);
  }
  notifyContainerRectUpdate(n) {
    this.appProxies.forEach((o) => {
      o.appEmitter.emit("containerRectUpdate", n);
    });
  }
  dispatchInternalEvent(n, o) {
    this.safeDispatchMagixEvent(Vb, {
      eventName: n,
      payload: o
    });
  }
  destroy() {
    this.displayer.callbacks.off(this.eventName, this.displayerStateListener), this.displayer.callbacks.off("onEnableWriteNowChanged", this.displayerWritableListener), this.appListeners.removeListeners(), po.clearListeners(), et.clearListeners(), this.appProxies.size && this.appProxies.forEach((n) => {
      n.destroy(!0, !1, !0);
    }), Dt.clearListeners(), this.sideEffectManager.flushAll(), this._prevFocused = void 0, this._prevSceneIndex = void 0;
  }
}
const tk = (r) => {
  const n = document.createElement("div");
  n.className = "netless-window-manager-playground";
  const o = document.createElement("div");
  o.className = "netless-window-manager-sizer";
  const l = document.createElement("div");
  l.className = "netless-window-manager-wrapper";
  const h = document.createElement("div");
  h.className = "netless-window-manager-main-view-wrapper netless-window-manager-fancy-scrollbar";
  const m = document.createElement("div");
  m.className = "netless-window-manager-main-view-wrapper netless-window-manager-main-view-wrapper-shadow";
  const w = document.createElement("div");
  w.className = "netless-window-manager-main-view-wrapper netless-window-manager-main-view-wrp";
  const g = document.createElement("div");
  g.className = "netless-window-manager-main-view";
  const S = document.createElement("div");
  return S.style.display = "none", n.appendChild(o), n.appendChild(S), o.appendChild(l), w.appendChild(g), h.appendChild(m), h.appendChild(w), l.appendChild(h), r.appendChild(n), Wt.wrapper = l, { playground: n, wrapper: l, sizer: o, mainViewElement: g, mainViewWrapperShadow: m, mainViewWrapper: w, extendWrapper: S, mainViewScrollWrapper: h };
}, nk = () => {
  if (uT(iN) < uT(sT))
    throw new ON(sT);
}, $b = (r, n) => {
  var m;
  const o = (r == null ? void 0 : r.state.roomMembers) || [];
  let l = -1, h;
  for (const w of o)
    ((m = w.payload) == null ? void 0 : m.uid) === n && l < w.memberId && (l = w.memberId, h = w);
  return h;
}, ik = async (r) => {
  let n = r.getInvisiblePlugin(Wt.kind);
  if (n)
    return n;
  let o;
  const l = new Promise((C) => {
    Wt._resolve = o = C;
  });
  let h = !1;
  const m = rk(r);
  !r.isWritable && m && (h = !0, await yM(
    async (C) => {
      Ca(`switching to writable (x${C})`), await r.setWritable(!0);
    },
    { retries: 10, maxTimeout: 5e3 }
  )), r.isWritable ? (Ca("creating InvisiblePlugin..."), r.createInvisiblePlugin(Wt, {}).catch(console.warn)) : (m && console.warn("[WindowManager]: failed to switch to writable"), console.warn("[WindowManager]: waiting for others to create the plugin..."));
  const w = setTimeout(() => {
    console.warn("[WindowManager]: no one called createInvisiblePlugin() after 20 seconds");
  }, 2e4), g = setTimeout(() => {
    throw new Error("[WindowManager]: no one called createInvisiblePlugin() after 60 seconds");
  }, 6e4), S = setInterval(() => {
    n = r.getInvisiblePlugin(Wt.kind), n && (clearTimeout(g), clearTimeout(w), clearInterval(S), o(n), h && r.isWritable && setTimeout(() => r.setWritable(!1).catch(console.warn), 500));
  }, 200);
  return l;
}, rk = (r) => {
  try {
    const n = atob(r.roomToken.slice(12)), o = n.indexOf("&role=");
    return +n[o + 6] < 2;
  } catch (n) {
    return console.error(n), !1;
  }
}, ak = window.ResizeObserver || sN;
class cS {
  constructor(n) {
    this.emitter = n;
  }
  static create(n, o, l, h) {
    const m = new cS(h);
    return m.observePlaygroundSize(n, o, l), m;
  }
  observePlaygroundSize(n, o, l) {
    this.updateSizer(n.getBoundingClientRect(), o, l), this.containerResizeObserver = new ak((h) => {
      var w;
      const m = (w = h[0]) == null ? void 0 : w.contentRect;
      m && (this.updateSizer(m, o, l), this.emitter.emit("playgroundSizeChange", m));
    }), this.disposer = this.emitter.on("containerSizeRatioUpdate", () => {
      const h = n.getBoundingClientRect();
      this.updateSizer(h, o, l), this.emitter.emit("playgroundSizeChange", h);
    }), this.containerResizeObserver.observe(n);
  }
  updateSizer({ width: n, height: o }, l, h) {
    n && o && (o / n > Wt.containerSizeRatio ? (o = n * Wt.containerSizeRatio, l.classList.toggle("netless-window-manager-sizer-horizontal", !0)) : (n = o / Wt.containerSizeRatio, l.classList.toggle("netless-window-manager-sizer-horizontal", !1)), h.style.width = `${n}px`, h.style.height = `${o}px`);
  }
  disconnect() {
    var n;
    (n = this.containerResizeObserver) == null || n.disconnect(), xd(this.disposer) && (this.disposer(), this.disposer = void 0);
  }
}
var DM = { exports: {} };
(function(r) {
  var n = Object.prototype.hasOwnProperty, o = "~";
  function l() {
  }
  Object.create && (l.prototype = /* @__PURE__ */ Object.create(null), new l().__proto__ || (o = !1));
  function h(S, C, I) {
    this.fn = S, this.context = C, this.once = I || !1;
  }
  function m(S, C, I, A, z) {
    if (typeof I != "function")
      throw new TypeError("The listener must be a function");
    var F = new h(I, A || S, z), j = o ? o + C : C;
    return S._events[j] ? S._events[j].fn ? S._events[j] = [S._events[j], F] : S._events[j].push(F) : (S._events[j] = F, S._eventsCount++), S;
  }
  function w(S, C) {
    --S._eventsCount === 0 ? S._events = new l() : delete S._events[C];
  }
  function g() {
    this._events = new l(), this._eventsCount = 0;
  }
  g.prototype.eventNames = function() {
    var C = [], I, A;
    if (this._eventsCount === 0)
      return C;
    for (A in I = this._events)
      n.call(I, A) && C.push(o ? A.slice(1) : A);
    return Object.getOwnPropertySymbols ? C.concat(Object.getOwnPropertySymbols(I)) : C;
  }, g.prototype.listeners = function(C) {
    var I = o ? o + C : C, A = this._events[I];
    if (!A)
      return [];
    if (A.fn)
      return [A.fn];
    for (var z = 0, F = A.length, j = new Array(F); z < F; z++)
      j[z] = A[z].fn;
    return j;
  }, g.prototype.listenerCount = function(C) {
    var I = o ? o + C : C, A = this._events[I];
    return A ? A.fn ? 1 : A.length : 0;
  }, g.prototype.emit = function(C, I, A, z, F, j) {
    var q = o ? o + C : C;
    if (!this._events[q])
      return !1;
    var Y = this._events[q], fe = arguments.length, se, Z;
    if (Y.fn) {
      switch (Y.once && this.removeListener(C, Y.fn, void 0, !0), fe) {
        case 1:
          return Y.fn.call(Y.context), !0;
        case 2:
          return Y.fn.call(Y.context, I), !0;
        case 3:
          return Y.fn.call(Y.context, I, A), !0;
        case 4:
          return Y.fn.call(Y.context, I, A, z), !0;
        case 5:
          return Y.fn.call(Y.context, I, A, z, F), !0;
        case 6:
          return Y.fn.call(Y.context, I, A, z, F, j), !0;
      }
      for (Z = 1, se = new Array(fe - 1); Z < fe; Z++)
        se[Z - 1] = arguments[Z];
      Y.fn.apply(Y.context, se);
    } else {
      var le = Y.length, oe;
      for (Z = 0; Z < le; Z++)
        switch (Y[Z].once && this.removeListener(C, Y[Z].fn, void 0, !0), fe) {
          case 1:
            Y[Z].fn.call(Y[Z].context);
            break;
          case 2:
            Y[Z].fn.call(Y[Z].context, I);
            break;
          case 3:
            Y[Z].fn.call(Y[Z].context, I, A);
            break;
          case 4:
            Y[Z].fn.call(Y[Z].context, I, A, z);
            break;
          default:
            if (!se)
              for (oe = 1, se = new Array(fe - 1); oe < fe; oe++)
                se[oe - 1] = arguments[oe];
            Y[Z].fn.apply(Y[Z].context, se);
        }
    }
    return !0;
  }, g.prototype.on = function(C, I, A) {
    return m(this, C, I, A, !1);
  }, g.prototype.once = function(C, I, A) {
    return m(this, C, I, A, !0);
  }, g.prototype.removeListener = function(C, I, A, z) {
    var F = o ? o + C : C;
    if (!this._events[F])
      return this;
    if (!I)
      return w(this, F), this;
    var j = this._events[F];
    if (j.fn)
      j.fn === I && (!z || j.once) && (!A || j.context === A) && w(this, F);
    else {
      for (var q = 0, Y = [], fe = j.length; q < fe; q++)
        (j[q].fn !== I || z && !j[q].once || A && j[q].context !== A) && Y.push(j[q]);
      Y.length ? this._events[F] = Y.length === 1 ? Y[0] : Y : w(this, F);
    }
    return this;
  }, g.prototype.removeAllListeners = function(C) {
    var I;
    return C ? (I = o ? o + C : C, this._events[I] && w(this, I)) : (this._events = new l(), this._eventsCount = 0), this;
  }, g.prototype.off = g.prototype.removeListener, g.prototype.addListener = g.prototype.on, g.prefixed = o, g.EventEmitter = g, r.exports = g;
})(DM);
var og = DM.exports;
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
var ap = function() {
  return ap = Object.assign || function(n) {
    for (var o, l = 1, h = arguments.length; l < h; l++) {
      o = arguments[l];
      for (var m in o)
        Object.prototype.hasOwnProperty.call(o, m) && (n[m] = o[m]);
    }
    return n;
  }, ap.apply(this, arguments);
};
function dS(r, n) {
  var o = {};
  for (var l in r)
    Object.prototype.hasOwnProperty.call(r, l) && n.indexOf(l) < 0 && (o[l] = r[l]);
  if (r != null && typeof Object.getOwnPropertySymbols == "function")
    for (var h = 0, l = Object.getOwnPropertySymbols(r); h < l.length; h++)
      n.indexOf(l[h]) < 0 && Object.prototype.propertyIsEnumerable.call(r, l[h]) && (o[l[h]] = r[l[h]]);
  return o;
}
var vb = 0, NM = typeof window < "u" && window.requestAnimationFrame !== void 0 ? function(r) {
  return window.requestAnimationFrame(r);
} : function(r) {
  var n = Date.now(), o = Math.max(0, 16.7 - (n - vb));
  vb = n + o, setTimeout(function() {
    return r(vb);
  }, o);
}, sk = function(r) {
  var n = [], o = [], l = 0, h = !1, m = 0, w = /* @__PURE__ */ new WeakSet(), g = /* @__PURE__ */ new WeakSet(), S = {
    cancel: function(C) {
      var I = o.indexOf(C);
      w.add(C), I !== -1 && o.splice(I, 1);
    },
    process: function(C) {
      var I;
      if (h = !0, I = [o, n], n = I[0], o = I[1], o.length = 0, l = n.length, l) {
        var A;
        for (m = 0; m < l; m++)
          A = n[m], A(C), g.has(A) === !0 && !w.has(A) && (S.schedule(A), r(!0));
      }
      h = !1;
    },
    schedule: function(C, I, A) {
      I === void 0 && (I = !1), A === void 0 && (A = !1);
      var z = A && h, F = z ? n : o;
      w.delete(C), I && g.add(C), F.indexOf(C) === -1 && (F.push(C), z && (l = n.length));
    }
  };
  return S;
}, ok = 40, hT = 1 / 60 * 1e3, Kv = !0, sp = !1, Qb = !1, Yh = {
  delta: 0,
  timestamp: 0
}, fS = ["read", "update", "preRender", "render", "postRender"], lk = function(r) {
  return sp = r;
}, kM = /* @__PURE__ */ fS.reduce(function(r, n) {
  return r[n] = sk(lk), r;
}, {}), uk = /* @__PURE__ */ fS.reduce(function(r, n) {
  var o = kM[n];
  return r[n] = function(l, h, m) {
    return h === void 0 && (h = !1), m === void 0 && (m = !1), sp || dk(), o.schedule(l, h, m), l;
  }, r;
}, {}), ck = function(r) {
  return kM[r].process(Yh);
}, _M = function(r) {
  sp = !1, Yh.delta = Kv ? hT : Math.max(Math.min(r - Yh.timestamp, ok), 1), Kv || (hT = Yh.delta), Yh.timestamp = r, Qb = !0, fS.forEach(ck), Qb = !1, sp && (Kv = !1, NM(_M));
}, dk = function() {
  sp = !0, Kv = !0, Qb || NM(_M);
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
  return Yr = Object.assign || function(n) {
    for (var o, l = 1, h = arguments.length; l < h; l++) {
      o = arguments[l];
      for (var m in o)
        Object.prototype.hasOwnProperty.call(o, m) && (n[m] = o[m]);
    }
    return n;
  }, Yr.apply(this, arguments);
}, PM = function(r, n) {
  return function(o) {
    return Math.max(Math.min(o, n), r);
  };
}, eg = function(r) {
  return r % 1 ? Number(r.toFixed(5)) : r;
}, zM = /^(#[0-9a-f]{3}|#(?:[0-9a-f]{2}){2,4}|(rgb|hsl)a?\((-?[\d\.]+%?[,\s]+){2,3}\s*\/*\s*[\d\.]+%?\))$/i, mg = {
  test: function(r) {
    return typeof r == "number";
  },
  parse: parseFloat,
  transform: function(r) {
    return r;
  }
}, qh = Yr(Yr({}, mg), { transform: PM(0, 1) }), Vv = Yr(Yr({}, mg), { default: 1 }), hS = function(r) {
  return {
    test: function(n) {
      return typeof n == "string" && n.endsWith(r) && n.split(" ").length === 1;
    },
    parse: parseFloat,
    transform: function(n) {
      return "" + n + r;
    }
  };
}, Du = hS("deg"), Kh = hS("%"), ut = hS("px"), pT = Yr(Yr({}, Kh), { parse: function(r) {
  return Kh.parse(r) / 100;
}, transform: function(r) {
  return Kh.transform(r * 100);
} }), fk = function(r) {
  return r.substring(r.indexOf("(") + 1, r.lastIndexOf(")"));
}, hk = PM(0, 255), Zb = function(r) {
  return r.red !== void 0;
}, Yb = function(r) {
  return r.hue !== void 0;
};
function pk(r) {
  return fk(r).replace(/(,|\/)/g, " ").split(/ \s*/);
}
var OM = function(r) {
  return function(n) {
    if (typeof n != "string")
      return n;
    for (var o = {}, l = pk(n), h = 0; h < 4; h++)
      o[r[h]] = l[h] !== void 0 ? parseFloat(l[h]) : 1;
    return o;
  };
}, mk = function(r) {
  var n = r.red, o = r.green, l = r.blue, h = r.alpha, m = h === void 0 ? 1 : h;
  return "rgba(" + n + ", " + o + ", " + l + ", " + m + ")";
}, vk = function(r) {
  var n = r.hue, o = r.saturation, l = r.lightness, h = r.alpha, m = h === void 0 ? 1 : h;
  return "hsla(" + n + ", " + o + ", " + l + ", " + m + ")";
}, gb = Yr(Yr({}, mg), { transform: function(r) {
  return Math.round(hk(r));
} });
function pS(r, n) {
  return r.startsWith(n) && zM.test(r);
}
var tg = {
  test: function(r) {
    return typeof r == "string" ? pS(r, "rgb") : Zb(r);
  },
  parse: OM(["red", "green", "blue", "alpha"]),
  transform: function(r) {
    var n = r.red, o = r.green, l = r.blue, h = r.alpha, m = h === void 0 ? 1 : h;
    return mk({
      red: gb.transform(n),
      green: gb.transform(o),
      blue: gb.transform(l),
      alpha: eg(qh.transform(m))
    });
  }
}, yb = {
  test: function(r) {
    return typeof r == "string" ? pS(r, "hsl") : Yb(r);
  },
  parse: OM(["hue", "saturation", "lightness", "alpha"]),
  transform: function(r) {
    var n = r.hue, o = r.saturation, l = r.lightness, h = r.alpha, m = h === void 0 ? 1 : h;
    return vk({
      hue: Math.round(n),
      saturation: Kh.transform(eg(o)),
      lightness: Kh.transform(eg(l)),
      alpha: eg(qh.transform(m))
    });
  }
}, mT = Yr(Yr({}, tg), { test: function(r) {
  return typeof r == "string" && pS(r, "#");
}, parse: function(r) {
  var n = "", o = "", l = "";
  return r.length > 4 ? (n = r.substr(1, 2), o = r.substr(3, 2), l = r.substr(5, 2)) : (n = r.substr(1, 1), o = r.substr(2, 1), l = r.substr(3, 1), n += n, o += o, l += l), {
    red: parseInt(n, 16),
    green: parseInt(o, 16),
    blue: parseInt(l, 16),
    alpha: 1
  };
} }), gs = {
  test: function(r) {
    return typeof r == "string" && zM.test(r) || Zb(r) || Yb(r);
  },
  parse: function(r) {
    return tg.test(r) ? tg.parse(r) : yb.test(r) ? yb.parse(r) : mT.test(r) ? mT.parse(r) : r;
  },
  transform: function(r) {
    return Zb(r) ? tg.transform(r) : Yb(r) ? yb.transform(r) : r;
  }
}, mS = function(r) {
  var n = r.onRead, o = r.onRender, l = r.uncachedValues, h = l === void 0 ? /* @__PURE__ */ new Set() : l, m = r.useCache, w = m === void 0 ? !0 : m;
  return function(g) {
    g === void 0 && (g = {});
    var S = dS(g, []), C = {}, I = [], A = !1;
    function z(j, q) {
      j.startsWith("--") && (S.hasCSSVariable = !0);
      var Y = C[j];
      C[j] = q, C[j] !== Y && (I.indexOf(j) === -1 && I.push(j), A || (A = !0, uk.render(F.render)));
    }
    var F = {
      get: function(j, q) {
        q === void 0 && (q = !1);
        var Y = !q && w && !h.has(j) && C[j] !== void 0;
        return Y ? C[j] : n(j, S);
      },
      set: function(j, q) {
        if (typeof j == "string")
          z(j, q);
        else
          for (var Y in j)
            z(Y, j[Y]);
        return this;
      },
      render: function(j) {
        return j === void 0 && (j = !1), (A || j === !0) && (o(C, S, I), A = !1, I.length = 0), this;
      }
    };
    return F;
  };
}, gk = /([a-z])([A-Z])/g, yk = "$1-$2", vg = function(r) {
  return r.replace(gk, yk).toLowerCase();
}, LM = /* @__PURE__ */ new Map(), vS = /* @__PURE__ */ new Map(), BM = ["Webkit", "Moz", "O", "ms", ""], wk = BM.length, bk = typeof document < "u", wb, jM = function(r, n) {
  return vS.set(r, vg(n));
}, Sk = function(r) {
  wb = wb || document.createElement("div");
  for (var n = 0; n < wk; n++) {
    var o = BM[n], l = o === "", h = l ? r : o + r.charAt(0).toUpperCase() + r.slice(1);
    if (h in wb.style || l) {
      if (l && r === "clipPath" && vS.has(r))
        return;
      LM.set(r, h), jM(r, (l ? "" : "-") + vg(h));
    }
  }
}, xk = function(r) {
  return jM(r, r);
}, VM = function(r, n) {
  n === void 0 && (n = !1);
  var o = n ? vS : LM;
  return o.has(r) || (bk ? Sk(r) : xk(r)), o.get(r) || r;
}, Ck = ["", "X", "Y", "Z"], Tk = ["translate", "scale", "rotate", "skew", "transformPerspective"], Gb = /* @__PURE__ */ Tk.reduce(function(r, n) {
  return Ck.reduce(function(o, l) {
    return o.push(n + l), o;
  }, r);
}, ["x", "y", "z"]), Mk = /* @__PURE__ */ Gb.reduce(function(r, n) {
  return r[n] = !0, r;
}, {});
function gS(r) {
  return Mk[r] === !0;
}
function Ek(r, n) {
  return Gb.indexOf(r) - Gb.indexOf(n);
}
var Ik = /* @__PURE__ */ new Set(["originX", "originY", "originZ"]);
function Ak(r) {
  return Ik.has(r);
}
var vT = /* @__PURE__ */ ap(/* @__PURE__ */ ap({}, mg), { transform: Math.round }), Rk = {
  color: gs,
  backgroundColor: gs,
  outlineColor: gs,
  fill: gs,
  stroke: gs,
  borderColor: gs,
  borderTopColor: gs,
  borderRightColor: gs,
  borderBottomColor: gs,
  borderLeftColor: gs,
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
  scale: Vv,
  scaleX: Vv,
  scaleY: Vv,
  scaleZ: Vv,
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
  opacity: qh,
  originX: pT,
  originY: pT,
  originZ: ut,
  zIndex: vT,
  fillOpacity: qh,
  strokeOpacity: qh,
  numOctaves: vT
}, yS = function(r) {
  return Rk[r];
}, Dk = function(r, n) {
  return n && typeof r == "number" ? n.transform(r) : r;
}, ep = "scrollLeft", tp = "scrollTop", UM = /* @__PURE__ */ new Set([ep, tp]), Nk = /* @__PURE__ */ new Set([ep, tp, "transform"]), kk = {
  x: "translateX",
  y: "translateY",
  z: "translateZ"
};
function HM(r) {
  return typeof r == "function";
}
function _k(r, n, o, l, h, m) {
  m === void 0 && (m = !0);
  var w = "", g = !1;
  o.sort(Ek);
  for (var S = o.length, C = 0; C < S; C++) {
    var I = o[C];
    w += (kk[I] || I) + "(" + n[I] + ") ", g = I === "z" ? !0 : g;
  }
  return !g && h ? w += "translateZ(0)" : w = w.trim(), HM(r.transform) ? w = r.transform(n, l ? "" : w) : m && l && (w = "none"), w;
}
function Pk(r, n, o, l, h, m, w, g) {
  n === void 0 && (n = !0), o === void 0 && (o = {}), l === void 0 && (l = {}), h === void 0 && (h = {}), m === void 0 && (m = []), w === void 0 && (w = !1), g === void 0 && (g = !0);
  var S = !0, C = !1, I = !1;
  for (var A in r) {
    var z = r[A], F = yS(A), j = Dk(z, F);
    gS(A) ? (C = !0, l[A] = j, m.push(A), S && (F.default && z !== F.default || !F.default && z !== 0) && (S = !1)) : Ak(A) ? (h[A] = j, I = !0) : (!Nk.has(A) || !HM(j)) && (o[VM(A, w)] = j);
  }
  return (C || typeof r.transform == "function") && (o.transform = _k(r, l, m, S, n, g)), I && (o.transformOrigin = (h.originX || "50%") + " " + (h.originY || "50%") + " " + (h.originZ || 0)), o;
}
function wS(r) {
  var n = r === void 0 ? {} : r, o = n.enableHardwareAcceleration, l = o === void 0 ? !0 : o, h = n.isDashCase, m = h === void 0 ? !0 : h, w = n.allowTransformNone, g = w === void 0 ? !0 : w, S = {}, C = {}, I = {}, A = [];
  return function(z) {
    return A.length = 0, Pk(z, l, S, C, I, A, m, g), S;
  };
}
function zk(r, n) {
  var o = n.element, l = n.preparseOutput, h = yS(r);
  if (gS(r))
    return h && h.default || 0;
  if (UM.has(r))
    return o[r];
  var m = window.getComputedStyle(o, null).getPropertyValue(VM(r, !0)) || 0;
  return l && h && h.test(m) && h.parse ? h.parse(m) : m;
}
function Ok(r, n, o) {
  var l = n.element, h = n.buildStyles, m = n.hasCSSVariable;
  if (Object.assign(l.style, h(r)), m)
    for (var w = o.length, g = 0; g < w; g++) {
      var S = o[g];
      S.startsWith("--") && l.style.setProperty(S, r[S]);
    }
  o.indexOf(ep) !== -1 && (l[ep] = r[ep]), o.indexOf(tp) !== -1 && (l[tp] = r[tp]);
}
var Lk = /* @__PURE__ */ mS({
  onRead: zk,
  onRender: Ok,
  uncachedValues: UM
});
function Bk(r, n) {
  n === void 0 && (n = {});
  var o = n.enableHardwareAcceleration, l = n.allowTransformNone, h = dS(n, ["enableHardwareAcceleration", "allowTransformNone"]);
  return Lk(ap({ element: r, buildStyles: wS({
    enableHardwareAcceleration: o,
    allowTransformNone: l
  }), preparseOutput: !0 }, h));
}
var WM = /* @__PURE__ */ new Set(["baseFrequency", "diffuseConstant", "kernelMatrix", "kernelUnitLength", "keySplines", "keyTimes", "limitingConeAngle", "markerHeight", "markerWidth", "numOctaves", "targetX", "targetY", "surfaceScale", "specularConstant", "specularExponent", "stdDeviation", "tableValues"]), gT = 0.5, FM = function() {
  return {
    style: {}
  };
}, bb = function(r, n) {
  return ut.transform(r * n);
}, jk = { x: 0, y: 0, width: 0, height: 0 };
function yT(r, n, o) {
  return typeof r == "string" ? r : ut.transform(n + o * r);
}
function Vk(r, n, o) {
  return yT(n, r.x, r.width) + " " + yT(o, r.y, r.height);
}
var $M = {
  enableHardwareAcceleration: !1,
  isDashCase: !1
};
function Uk(r, n, o, l, h, m) {
  n === void 0 && (n = jk), l === void 0 && (l = wS($M)), h === void 0 && (h = FM()), m === void 0 && (m = !0);
  var w = r.attrX, g = r.attrY, S = r.originX, C = r.originY, I = r.pathLength, A = r.pathSpacing, z = A === void 0 ? 1 : A, F = r.pathOffset, j = F === void 0 ? 0 : F, q = dS(r, ["attrX", "attrY", "originX", "originY", "pathLength", "pathSpacing", "pathOffset"]), Y = l(q);
  for (var fe in Y)
    if (fe === "transform")
      h.style.transform = Y[fe];
    else {
      var se = m && !WM.has(fe) ? vg(fe) : fe;
      h[se] = Y[fe];
    }
  return (S !== void 0 || C !== void 0 || Y.transform) && (h.style.transformOrigin = Vk(n, S !== void 0 ? S : gT, C !== void 0 ? C : gT)), w !== void 0 && (h.x = w), g !== void 0 && (h.y = g), o !== void 0 && I !== void 0 && (h[m ? "stroke-dashoffset" : "strokeDashoffset"] = bb(-j, o), h[m ? "stroke-dasharray" : "strokeDasharray"] = bb(I, o) + " " + bb(z, o)), h;
}
function Hk(r, n, o) {
  o === void 0 && (o = !0);
  var l = FM(), h = wS($M);
  return function(m) {
    return Uk(m, r, n, h, l, o);
  };
}
var Wk = function(r) {
  return typeof r.getBBox == "function" ? r.getBBox() : r.getBoundingClientRect();
}, Fk = function(r) {
  try {
    return Wk(r);
  } catch {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
}, $k = function(r) {
  return r.tagName === "path";
}, Qk = /* @__PURE__ */ mS({
  onRead: function(r, n) {
    var o = n.element;
    if (r = WM.has(r) ? r : vg(r), gS(r)) {
      var l = yS(r);
      return l && l.default || 0;
    } else
      return o.getAttribute(r);
  },
  onRender: function(r, n) {
    var o = n.element, l = n.buildAttrs, h = l(r);
    for (var m in h)
      m === "style" ? Object.assign(o.style, h.style) : o.setAttribute(m, h[m]);
  }
}), Zk = function(r) {
  var n = Fk(r), o = $k(r) && r.getTotalLength ? r.getTotalLength() : void 0;
  return Qk({
    element: r,
    buildAttrs: Hk(n, o)
  });
}, Yk = /* @__PURE__ */ mS({
  useCache: !1,
  onRead: function(r) {
    return r === "scrollTop" ? window.pageYOffset : window.pageXOffset;
  },
  onRender: function(r) {
    var n = r.scrollTop, o = n === void 0 ? 0 : n, l = r.scrollLeft, h = l === void 0 ? 0 : l;
    return window.scrollTo(h, o);
  }
}), Xb = /* @__PURE__ */ new WeakMap(), Gk = function(r) {
  return r instanceof HTMLElement || typeof r.click == "function";
}, Xk = function(r) {
  return r instanceof SVGElement || "ownerSVGElement" in r;
}, Jk = function(r, n) {
  var o;
  return r === window ? o = Yk(r) : Gk(r) ? o = Bk(r, n) : Xk(r) && (o = Zk(r)), Xb.set(r, o), o;
}, qk = function(r, n) {
  return Xb.has(r) ? Xb.get(r) : Jk(r, n);
};
function Kk(r, n) {
  var o = typeof r == "string" ? document.querySelector(r) : r;
  return qk(o, n);
}
var ws = function(n, o, l, h) {
  var m = l ? l.call(h, n, o) : void 0;
  if (m !== void 0)
    return !!m;
  if (n === o)
    return !0;
  if (typeof n != "object" || !n || typeof o != "object" || !o)
    return !1;
  var w = Object.keys(n), g = Object.keys(o);
  if (w.length !== g.length)
    return !1;
  for (var S = Object.prototype.hasOwnProperty.bind(o), C = 0; C < w.length; C++) {
    var I = w[C];
    if (!S(I))
      return !1;
    var A = n[I], z = o[I];
    if (m = l ? l.call(h, A, z, I) : void 0, m === !1 || m === void 0 && A !== z)
      return !1;
  }
  return !0;
};
const QM = "!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", e_ = QM.length, wT = Array(20), Td = () => {
  for (let r = 0; r < 20; r++)
    wT[r] = QM.charAt(Math.random() * e_);
  return wT.join("");
};
class op {
  constructor() {
    this.disposers = /* @__PURE__ */ new Map();
  }
  add(n, o = Td()) {
    return this.flush(o), this.disposers.set(o, n()), o;
  }
  addDisposer(n, o = Td()) {
    return this.flush(o), this.disposers.set(o, n), o;
  }
  addEventListener(n, o, l, h, m = Td()) {
    return this.add(() => (n.addEventListener(o, l, h), () => n.removeEventListener(o, l, h)), m), m;
  }
  setTimeout(n, o, l = Td()) {
    return this.add(() => {
      const h = window.setTimeout(() => {
        this.remove(l), n();
      }, o);
      return () => window.clearTimeout(h);
    }, l);
  }
  setInterval(n, o, l = Td()) {
    return this.add(() => {
      const h = window.setInterval(n, o);
      return () => window.clearInterval(h);
    }, l);
  }
  remove(n) {
    const o = this.disposers.get(n);
    return this.disposers.delete(n), o;
  }
  flush(n) {
    const o = this.remove(n);
    if (o)
      try {
        o();
      } catch (l) {
        console.error(l);
      }
  }
  flushAll() {
    this.disposers.forEach((n) => {
      try {
        n();
      } catch (o) {
        console.error(o);
      }
    }), this.disposers.clear();
  }
}
var t_ = Object.defineProperty, Sb = (typeof require < "u" && require, (r, n, o) => (((l, h, m) => {
  h in l ? t_(l, h, { enumerable: !0, configurable: !0, writable: !0, value: m }) : l[h] = m;
})(r, typeof n != "symbol" ? n + "" : n, o), o));
class cp {
  constructor(n, o) {
    Sb(this, "_value"), Sb(this, "_beforeDestroys"), Sb(this, "_subscribers"), this._value = n, o && (this.compare = o);
  }
  get value() {
    return this._value;
  }
  setValue(n, o) {
    if (!this.compare(n, this._value)) {
      const l = this._value;
      this._value = n, this._subscribers && this._subscribers.forEach((h) => h(n, l, o));
    }
  }
  reaction(n) {
    return this._subscribers || (this._subscribers = /* @__PURE__ */ new Set()), this._subscribers.add(n), () => {
      this._subscribers && this._subscribers.delete(n);
    };
  }
  subscribe(n, o) {
    const l = this.reaction(n);
    return n(this._value, void 0, o), l;
  }
  derive(n, o, l) {
    const h = new cp(n(this.value, void 0, l), o), m = this.reaction((w, g, S) => {
      h.setValue(n(w, g, S));
    });
    return h.addBeforeDestroy(m), h;
  }
  destroy() {
    this._beforeDestroys && (this._beforeDestroys.forEach((n) => n()), this._beforeDestroys.clear()), this._subscribers && this._subscribers.clear();
  }
  addBeforeDestroy(n) {
    return this._beforeDestroys || (this._beforeDestroys = /* @__PURE__ */ new Set()), this._beforeDestroys.add(n), () => {
      this._beforeDestroys && this._beforeDestroys.delete(n);
    };
  }
  compare(n, o) {
    return n === o;
  }
}
function n_(r, n, o, l) {
  let h = r.map((w) => w.value);
  const m = new cp(n(h, void 0, l), o);
  return r.forEach((w, g) => {
    const S = w.reaction((C, I, A) => {
      const z = h.slice();
      z[g] = C;
      const F = h;
      h = z, m.setValue(n(z, F, A), A);
    });
    m.addBeforeDestroy(S);
  }), m;
}
function ZM(r, n) {
  Object.keys(n).forEach((o) => {
    i_(r, o, n[o]);
  });
}
function i_(r, n, o) {
  var l;
  return Object.defineProperties(r, { [n]: { get: () => o.value }, [`_${n}$`]: { value: o }, [`set${l = n, l[0].toUpperCase() + l.slice(1)}`]: { value: (h, m) => o.setValue(h, m) } }), r;
}
function bS(r) {
  const n = (o) => {
    const l = r.addDisposer(() => {
      o.destroy();
    });
    return o.addBeforeDestroy(() => {
      r.remove(l);
    }), o;
  };
  return { bindSideEffect: n, combine: (o, l, h, m) => n(n_(o, l, h, m)), createVal: (o, l) => n(new cp(o, l)) };
}
var SS = /* @__PURE__ */ ((r) => (r.Light = "light", r.Dark = "dark", r.Auto = "auto", r))(SS || {}), nn = /* @__PURE__ */ ((r) => (r.Normal = "normal", r.Minimized = "minimized", r.Maximized = "maximized", r))(nn || {}), Xn = /* @__PURE__ */ ((r) => (r.DarkMode = "dark_mode", r.PrefersColorScheme = "prefers_color_scheme", r.Close = "close", r.Focus = "focus", r.Blur = "blur", r.Move = "move", r.Resize = "resize", r.IntrinsicMove = "intrinsic_move", r.IntrinsicResize = "intrinsic_resize", r.VisualResize = "visual_resize", r.ZIndex = "z_index", r.State = "state", r.Minimized = "minimized", r.Maximized = "maximized", r.Readonly = "readonly", r.Destroyed = "destroyed", r))(Xn || {}), Ki = /* @__PURE__ */ ((r) => (r.Close = "close", r.Maximize = "maximize", r.Minimize = "minimize", r))(Ki || {}), bs = /* @__PURE__ */ ((r) => (r.North = "n", r.South = "s", r.West = "w", r.East = "e", r.NorthWest = "nw", r.NorthEast = "ne", r.SouthEast = "se", r.SouthWest = "sw", r))(bs || {});
const xb = "dh";
function Xi(r, n, o) {
  return Math.min(Math.max(r, n), o);
}
function Ed(r) {
  r.stopPropagation(), r.cancelable && r.preventDefault();
}
let r_ = 1;
function a_() {
  return `New Box ${r_++}`;
}
function s_(r) {
  return Boolean(r);
}
function Uv(r) {
  return !r;
}
function bT(r) {
  return r.reduce((n, o) => (n.includes(o) || n.push(o), n), []);
}
function Hh(r, n) {
  const o = r.indexOf(n);
  if (o < 0)
    return r;
  const l = [...r];
  return l.splice(o, 1), l;
}
function o_(r, n, o) {
  const l = new Set(n), h = new Set(o);
  return r.filter((m) => !l.has(m) && !h.has(m));
}
const l_ = () => typeof navigator < "u" && typeof window < "u" && /iPad|iPhone|iPod/.test(window.navigator.userAgent), u_ = () => typeof navigator < "u" && /Android/.test(window.navigator.userAgent);
function ST(r) {
  return r.touches ? r.touches[0] : r;
}
function c_() {
  return Date.now().toString().slice(6) + Math.random().toString().slice(2, 8);
}
class YM {
  constructor({
    readonly: n = !1,
    title: o,
    buttons: l,
    onEvent: h,
    onDragStart: m,
    namespace: w = "telebox",
    state: g = nn.Normal
  } = {}) {
    this.$btns = [], this.sideEffect = new op(), this.lastTitleBarClick = {
      timestamp: 0,
      clientX: -100,
      clientY: -100
    }, this.handleTitleBarClick = (S) => {
      var C;
      if (this.readonly || S.button !== 0 || (C = S.target.dataset) != null && C.teleTitleBarNoDblClick)
        return;
      Ed(S);
      const I = Date.now();
      I - this.lastTitleBarClick.timestamp <= 500 ? Math.abs(S.clientX - this.lastTitleBarClick.clientX) <= 5 && Math.abs(S.clientY - this.lastTitleBarClick.clientY) <= 5 && this.onEvent && this.onEvent({ type: Ki.Maximize }) : this.onDragStart && this.onDragStart(S), this.lastTitleBarClick.timestamp = I, this.lastTitleBarClick.clientX = S.clientX, this.lastTitleBarClick.clientY = S.clientY;
    }, this.lastTitleBarTouch = {
      timestamp: 0,
      clientX: -100,
      clientY: -100
    }, this.handleTitleBarTouch = (S) => {
      var C;
      if (this.readonly || (C = S.target.dataset) != null && C.teleTitleBarNoDblClick)
        return;
      Ed(S);
      const I = Date.now(), {
        clientX: A = this.lastTitleBarTouch.clientX + 100,
        clientY: z = this.lastTitleBarTouch.clientY + 100
      } = S.touches[0] || {};
      I - this.lastTitleBarTouch.timestamp <= 500 ? Math.abs(A - this.lastTitleBarTouch.clientX) <= 10 && Math.abs(z - this.lastTitleBarTouch.clientY) <= 10 && this.onEvent && this.onEvent({ type: Ki.Maximize }) : this.onDragStart && this.onDragStart(S), this.lastTitleBarTouch.timestamp = I, this.lastTitleBarTouch.clientX = A, this.lastTitleBarTouch.clientY = z;
    }, this.readonly = n, this.onEvent = h, this.onDragStart = m, this.namespace = w, this.title = o, this.state = g, this.buttons = l || [
      {
        type: Ki.Minimize,
        iconClassName: this.wrapClassName("titlebar-icon-minimize")
      },
      {
        type: Ki.Maximize,
        iconClassName: this.wrapClassName("titlebar-icon-maximize"),
        isActive: (S) => S === nn.Maximized
      },
      {
        type: Ki.Close,
        iconClassName: this.wrapClassName("titlebar-icon-close")
      }
    ], this.$dragArea = this.renderDragArea();
  }
  setTitle(n) {
    this.title = n, this.$title && (this.$title.textContent = n, this.$title.title = n);
  }
  setState(n) {
    this.state !== n && (this.state = n, this.buttons.forEach((o, l) => {
      o.isActive && this.$btns[l].classList.toggle(
        "is-active",
        o.isActive(n)
      );
    }));
  }
  setReadonly(n) {
    this.readonly !== n && (this.readonly = n);
  }
  render() {
    if (!this.$titleBar) {
      this.$titleBar = document.createElement("div"), this.$titleBar.className = this.wrapClassName("titlebar");
      const n = document.createElement("div");
      n.className = this.wrapClassName("title-area"), n.dataset.teleBoxHandle = xb, this.$title = document.createElement("h1"), this.$title.className = this.wrapClassName("title"), this.$title.dataset.teleBoxHandle = xb, this.title && (this.$title.textContent = this.title, this.$title.title = this.title), n.appendChild(this.$title), n.appendChild(this.$dragArea);
      const o = document.createElement("div");
      o.className = this.wrapClassName("titlebar-btns"), this.buttons.forEach(({ iconClassName: l, isActive: h }, m) => {
        const w = String(m), g = document.createElement("button");
        g.className = `${this.wrapClassName(
          "titlebar-btn"
        )} ${l}`, g.dataset.teleTitleBarBtnIndex = w, g.dataset.teleTitleBarNoDblClick = "true", h && g.classList.toggle("is-active", h(this.state)), this.$btns.push(g), o.appendChild(g);
      }), this.sideEffect.addEventListener(
        o,
        "click",
        (l) => {
          var h;
          if (this.readonly)
            return;
          const m = l.target, w = Number(
            (h = m.dataset) == null ? void 0 : h.teleTitleBarBtnIndex
          );
          if (!Number.isNaN(w) && w < this.buttons.length) {
            Ed(l);
            const g = this.buttons[w];
            this.onEvent && this.onEvent({
              type: g.type,
              value: g.value
            });
          }
        }
      ), this.$titleBar.appendChild(n), this.$titleBar.appendChild(o);
    }
    return this.$titleBar;
  }
  renderDragArea() {
    const n = document.createElement("div");
    return n.className = this.wrapClassName("drag-area"), n.dataset.teleBoxHandle = xb, this.sideEffect.addEventListener(
      n,
      "mousedown",
      this.handleTitleBarClick
    ), this.sideEffect.addEventListener(
      n,
      "touchstart",
      this.handleTitleBarTouch,
      { passive: !0 }
    ), n;
  }
  dragHandle() {
    return this.$titleBar;
  }
  wrapClassName(n) {
    return `${this.namespace}-${n}`;
  }
  destroy() {
    this.sideEffect.flushAll(), this.$titleBar && (this.$titleBar = void 0, this.$title = void 0, this.$btns.length = 0, this.onDragStart = void 0, this.onEvent = void 0);
  }
}
class d_ {
  constructor({
    id: n = c_(),
    title: o = a_(),
    prefersColorScheme: l = SS.Light,
    darkMode: h,
    visible: m = !0,
    width: w = 0.5,
    height: g = 0.5,
    minWidth: S = 0,
    minHeight: C = 0,
    x: I = 0.1,
    y: A = 0.1,
    minimized: z = !1,
    maximized: F = !1,
    readonly: j = !1,
    resizable: q = !0,
    draggable: Y = !0,
    fence: fe = !0,
    fixRatio: se = !1,
    focus: Z = !1,
    zIndex: le = 100,
    namespace: oe = "telebox",
    titleBar: ke,
    content: $e,
    footer: ze,
    styles: G,
    containerRect: he = {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight
    },
    collectorRect: be,
    fixed: ie = !1,
    addObserver: ct
  } = {}) {
    this._renderSideEffect = new op(), this.handleTrackStart = (Ne) => {
      var st;
      return (st = this._handleTrackStart) == null ? void 0 : st.call(this, Ne);
    }, this._sideEffect = new op(), this._valSideEffectBinder = bS(this._sideEffect);
    const { combine: Oe, createVal: ce } = this._valSideEffectBinder;
    this.addObserver = ct || Cb, this.id = n, this.namespace = oe, this.events = new og(), this._delegateEvents = new og(), this.scale = ce(1), this.fixed = ie;
    const Ze = ce(l);
    Ze.reaction((Ne, st, We) => {
      We || this.events.emit(Xn.PrefersColorScheme, Ne);
    });
    const Se = ce(Boolean(h));
    h == null && Ze.subscribe((Ne, st, We) => {
      this._sideEffect.add(() => {
        if (Ne === "auto") {
          const jt = window.matchMedia("(prefers-color-scheme: dark)");
          if (jt) {
            Se.setValue(jt.matches, We);
            const Sn = (ci) => {
              Se.setValue(ci.matches, We);
            };
            return jt.addListener(Sn), () => jt.removeListener(Sn);
          } else
            return Cb;
        } else
          return Se.setValue(Ne === "dark", We), Cb;
      }, "prefers-color-scheme");
    }), Se.reaction((Ne, st, We) => {
      We || this.events.emit(Xn.DarkMode, Ne);
    });
    const He = ce(he, ws), Re = ce(be, ws), Qe = ce(o);
    Qe.reaction((Ne, st, We) => {
      We || this.titleBar.setTitle(Ne);
    });
    const Tt = ce(m);
    Tt.reaction((Ne, st, We) => {
      !We && !Ne && this.events.emit(Xn.Close);
    });
    const Bt = ce(j);
    Bt.reaction((Ne, st, We) => {
      We || this.events.emit(Xn.Readonly, Ne);
    });
    const Ge = ce(q), re = ce(Y), D = ce(fe), B = ce(se), ee = ce(le);
    ee.reaction((Ne, st, We) => {
      We || this.events.emit(Xn.ZIndex, Ne);
    });
    const Ce = ce(Z);
    Ce.reaction((Ne, st, We) => {
      We || this.events.emit(Ne ? Xn.Focus : Xn.Blur);
    });
    const ge = ce(z);
    ge.reaction((Ne, st, We) => {
      We || this.events.emit(Xn.Minimized, Ne);
    });
    const it = ce(F);
    it.reaction((Ne, st, We) => {
      We || this.events.emit(Xn.Maximized, Ne);
    });
    const Xe = Oe(
      [ge, it],
      ([Ne, st]) => Ne ? nn.Minimized : st ? nn.Maximized : nn.Normal
    );
    Xe.reaction((Ne, st, We) => {
      We || this.events.emit(Xn.State, Ne);
    });
    const Be = ce(
      {
        width: Xi(S, 0, 1),
        height: Xi(C, 0, 1)
      },
      ws
    ), dt = ce(
      {
        width: Xi(w, Be.value.width, 1),
        height: Xi(g, Be.value.height, 1)
      },
      ws
    );
    Be.reaction((Ne, st, We) => {
      dt.setValue(
        {
          width: Xi(w, Ne.width, 1),
          height: Xi(g, Ne.height, 1)
        },
        We
      );
    }), dt.reaction((Ne, st, We) => {
      We || this.events.emit(Xn.IntrinsicResize, Ne);
    });
    const gt = Oe(
      [dt, it],
      ([Ne, st]) => st ? { width: 1, height: 1 } : Ne,
      ws
    );
    gt.reaction((Ne, st, We) => {
      We || this.events.emit(Xn.Resize, Ne);
    });
    const Zt = Oe(
      [gt, ge, He, Re],
      ([Ne, st, We, jt]) => st && jt ? {
        width: jt.width / Ne.width / We.width,
        height: jt.height / Ne.height / We.height
      } : Ne,
      ws
    );
    Zt.reaction((Ne, st, We) => {
      We || this.events.emit(Xn.VisualResize, Ne);
    });
    const Mt = ce({ x: Xi(I, 0, 1), y: Xi(A, 0, 1) }, ws);
    Mt.reaction((Ne, st, We) => {
      We || this.events.emit(Xn.IntrinsicMove, Ne);
    });
    const bn = Oe(
      [
        Mt,
        dt,
        He,
        Re,
        ge,
        it
      ],
      ([
        Ne,
        st,
        We,
        jt,
        Sn,
        ci
      ]) => Sn && jt ? ci ? {
        x: (jt.x + jt.width / 2) / We.width - 1 / 2,
        y: (jt.y + jt.height / 2) / We.height - 1 / 2
      } : {
        x: (jt.x + jt.width / 2) / We.width - st.width / 2,
        y: (jt.y + jt.height / 2) / We.height - st.height / 2
      } : ci ? { x: 0, y: 0 } : Ne,
      ws
    );
    bn.reaction((Ne, st, We) => {
      We || this.events.emit(Xn.Move, Ne);
    }), this.titleBar = ke || new YM({
      readonly: Bt.value,
      title: Qe.value,
      namespace: this.namespace,
      onDragStart: (Ne) => {
        var st;
        return (st = this._handleTrackStart) == null ? void 0 : st.call(this, Ne);
      },
      onEvent: (Ne) => {
        if (this._delegateEvents.listeners.length > 0)
          this._delegateEvents.emit(Ne.type);
        else
          switch (Ne.type) {
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
              console.error("Unsupported titleBar event:", Ne);
              break;
            }
          }
      }
    }), Bt.reaction((Ne) => {
      this.titleBar.setReadonly(Ne);
    });
    const Ft = ce($e), Vi = ce(ze), Ci = ce(G);
    ZM(this, {
      prefersColorScheme: Ze,
      darkMode: Se,
      containerRect: He,
      collectorRect: Re,
      title: Qe,
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
      $userFooter: Vi,
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
  setState(n, o = !1) {
    switch (n) {
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
  setMinWidth(n, o = !1) {
    return this._minSize$.setValue({ width: n, height: this.minHeight }, o), this;
  }
  setMinHeight(n, o = !1) {
    return this._minSize$.setValue({ width: this.minWidth, height: n }, o), this;
  }
  get intrinsicWidth() {
    return this._intrinsicSize$.value.width;
  }
  get intrinsicHeight() {
    return this._intrinsicSize$.value.height;
  }
  resize(n, o, l = !1) {
    return this._intrinsicSize$.setValue({ width: n, height: o }, l), this;
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
  move(n, o, l = !1) {
    return this.fixed ? this : (this._intrinsicCoord$.setValue({ x: n, y: o }, l), this);
  }
  get x() {
    return this._coord$.value.x;
  }
  get y() {
    return this._coord$.value.y;
  }
  transform(n, o, l, h, m = !1) {
    if (this.fixRatio) {
      const w = this.intrinsicHeight / this.intrinsicWidth * l;
      o !== this.intrinsicY && (o -= w - h), h = w;
    }
    return o < 0 && (o = 0, h > this.intrinsicHeight && (h = this.intrinsicHeight)), this.fixed || this._intrinsicCoord$.setValue(
      {
        x: l >= this.minWidth ? n : this.intrinsicX,
        y: h >= this.minHeight ? o : this.intrinsicY
      },
      m
    ), this._intrinsicSize$.setValue(
      {
        width: Xi(l, this.minWidth, 1),
        height: Xi(h, this.minHeight, 1)
      },
      m
    ), this;
  }
  mount(n) {
    return n.appendChild(this.render()), this;
  }
  unmount() {
    return this.$box && this.$box.remove(), this;
  }
  mountContent(n) {
    return this.set$userContent(n), this;
  }
  unmountContent() {
    return this.set$userContent(void 0), this;
  }
  mountFooter(n) {
    return this.set$userFooter(n), this;
  }
  unmountFooter() {
    return this.set$userFooter(void 0), this;
  }
  getUserStyles() {
    return this.$userStyles;
  }
  mountStyles(n) {
    let o;
    return typeof n == "string" ? (o = document.createElement("style"), o.textContent = n) : o = n, this.set$userStyles(o), this;
  }
  unmountStyles() {
    return this.set$userStyles(void 0), this;
  }
  setFixed(n) {
    this.fixed = n;
  }
  render(n) {
    if (n) {
      if (n === this.$box)
        return this.$box;
      this.$box = n;
    } else {
      if (this.$box)
        return this.$box;
      this.$box = document.createElement("div");
    }
    this._renderSideEffect.flushAll(), this.$box.classList.add(this.wrapClassName("box"));
    const o = (A, z, F, j = s_) => this._renderSideEffect.add(() => {
      const q = this.wrapClassName(F);
      return z.subscribe((Y) => {
        A.classList.toggle(q, j(Y));
      });
    });
    o(this.$box, this._readonly$, "readonly"), o(this.$box, this._draggable$, "no-drag", Uv), o(this.$box, this._resizable$, "no-resize", Uv), o(this.$box, this._focus$, "blur", Uv), o(this.$box, this._darkMode$, "color-scheme-dark"), o(this.$box, this._darkMode$, "color-scheme-light", Uv), this._renderSideEffect.add(() => {
      const A = this.wrapClassName("minimized"), z = this.wrapClassName("maximized"), F = "box-maximized-timer";
      return this._state$.subscribe((j) => {
        this.$box.classList.toggle(A, j === nn.Minimized), j === nn.Maximized ? (this._renderSideEffect.flush(F), this.$box.classList.toggle(z, !0)) : this._renderSideEffect.setTimeout(
          () => {
            this.$box.classList.toggle(z, !1);
          },
          0,
          F
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
    const l = Kk(this.$box);
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
      ([A, z, F, j, q]) => {
        const Y = z.width * j.width, fe = z.height * j.height;
        return {
          width: Y + (F && q ? 1 : 0),
          height: fe + (F && q ? 1 : 0),
          x: A.x * j.width,
          y: A.y * j.height,
          scaleX: 1,
          scaleY: 1
        };
      },
      ws
    ).subscribe((A) => {
      l.set(A);
    }), l.set({ x: h, y: m });
    const w = document.createElement("div");
    w.className = this.wrapClassName("box-main"), this.$box.appendChild(w);
    const g = document.createElement("div");
    g.className = this.wrapClassName("titlebar-wrap"), g.appendChild(this.titleBar.render()), this.$titleBar = g;
    const S = document.createElement("div");
    S.className = this.wrapClassName("content-wrap") + " tele-fancy-scrollbar";
    const C = document.createElement("div");
    C.className = this.wrapClassName("content") + " tele-fancy-scrollbar", this.$content = C, this._renderSideEffect.add(() => {
      let A;
      return this._$userStyles$.subscribe((z) => {
        A && A.remove(), A = z, z && S.appendChild(z);
      });
    }), this._renderSideEffect.add(() => {
      let A;
      return this._$userContent$.subscribe((z) => {
        A && A.remove(), A = z, z && C.appendChild(z);
      });
    }), S.appendChild(C);
    const I = document.createElement("div");
    return I.className = this.wrapClassName("footer-wrap"), this.$footer = I, this._renderSideEffect.add(() => {
      let A;
      return this._$userFooter$.subscribe((z) => {
        A && A.remove(), A = z, z && I.appendChild(z);
      });
    }), this._state$.reaction((A) => {
      I.classList.toggle(this.wrapClassName("footer-hide"), A == nn.Maximized);
    }), w.appendChild(g), w.appendChild(S), w.appendChild(I), this.$contentWrap = S, this.addObserver(S, (A) => {
      const z = A.find((F) => F.target == S);
      (z == null ? void 0 : z.target) == S && (C.style.width = z.contentRect.width * this.scale.value + "px", C.style.height = z.contentRect.height * this.scale.value + "px");
    }), this.scale.reaction((A) => {
      C.style.width = S.getBoundingClientRect().width * A + "px", C.style.height = S.getBoundingClientRect().height * A + "px";
    }), this._renderResizeHandlers(), this.$box;
  }
  _renderResizeHandlers() {
    const n = document.createElement("div");
    n.className = this.wrapClassName("resize-handles"), Object.values(bs).forEach((q) => {
      const Y = document.createElement("div");
      Y.className = this.wrapClassName(q) + " " + this.wrapClassName("resize-handle"), Y.dataset.teleBoxHandle = q, n.appendChild(Y);
    }), this.$box.appendChild(n);
    const o = "handle-tracking-listener", l = this.wrapClassName("transforming");
    let h, m = 0, w = 0, g = 0, S = 0, C = 0, I = 0, A;
    const z = (q) => {
      if (this.state !== nn.Normal)
        return;
      Ed(q);
      let { pageX: Y, pageY: fe } = ST(q);
      fe < 0 && (fe = 0);
      const se = (Y - C) / this.containerRect.width, Z = (fe - I) / this.containerRect.height;
      switch (A) {
        case bs.North: {
          this.transform(
            this.x,
            w + Z,
            this.width,
            S - Z
          );
          break;
        }
        case bs.South: {
          this.transform(this.x, this.y, this.width, S + Z);
          break;
        }
        case bs.West: {
          this.transform(
            m + se,
            this.y,
            g - se,
            this.height
          );
          break;
        }
        case bs.East: {
          this.transform(this.x, this.y, g + se, this.height);
          break;
        }
        case bs.NorthWest: {
          this.transform(
            m + se,
            w + Z,
            g - se,
            S - Z
          );
          break;
        }
        case bs.NorthEast: {
          this.transform(
            this.x,
            w + Z,
            g + se,
            S - Z
          );
          break;
        }
        case bs.SouthEast: {
          this.transform(
            this.x,
            this.y,
            g + se,
            S + Z
          );
          break;
        }
        case bs.SouthWest: {
          this.transform(
            m + se,
            this.y,
            g - se,
            S + Z
          );
          break;
        }
        default: {
          if (this.fence)
            this.move(
              Xi(m + se, 0, 1 - this.width),
              Xi(w + Z, 0, 1 - this.height)
            );
          else {
            const le = 20 / this.containerRect.width, oe = 20 / this.containerRect.height;
            this.move(
              Xi(
                m + se,
                le - this.width,
                1 - le
              ),
              Xi(w + Z, 0, 1 - oe)
            );
          }
          break;
        }
      }
    }, F = (q) => {
      A = void 0, h && (Ed(q), this.$box.classList.toggle(l, !1), this._sideEffect.flush(o), h.remove());
    }, j = (q) => {
      var Y;
      if (this.readonly || q.button != null && q.button !== 0 || !this.draggable || A || this.state !== nn.Normal)
        return;
      const fe = q.target;
      if ((Y = fe.dataset) != null && Y.teleBoxHandle) {
        Ed(q), m = this.x, w = this.y, g = this.width, S = this.height, { pageX: C, pageY: I } = ST(q), A = fe.dataset.teleBoxHandle, h || (h = document.createElement("div"));
        const se = A ? this.wrapClassName(`cursor-${A}`) : "";
        h.className = this.wrapClassName(`track-mask${se ? ` ${se}` : ""}`), this.$box.appendChild(h), this.$box.classList.add(l), this._sideEffect.add(() => (window.addEventListener("mousemove", z), window.addEventListener("touchmove", z, {
          passive: !1
        }), window.addEventListener("mouseup", F), window.addEventListener("touchend", F, {
          passive: !1
        }), window.addEventListener("touchcancel", F, {
          passive: !1
        }), () => {
          window.removeEventListener("mousemove", z), window.removeEventListener("touchmove", z), window.removeEventListener("mouseup", F), window.removeEventListener("touchend", F), window.removeEventListener("touchcancel", F);
        }), o);
      }
    };
    this._handleTrackStart = j, this._sideEffect.addEventListener(
      n,
      "mousedown",
      j,
      {},
      "box-resizeHandles-mousedown"
    ), this._sideEffect.addEventListener(
      n,
      "touchstart",
      j,
      { passive: !1 },
      "box-resizeHandles-touchstart"
    );
  }
  setScaleContent(n) {
    this.scale.setValue(n);
  }
  destroy() {
    this.$box.remove(), this.events.emit(Xn.Destroyed), this._sideEffect.flushAll(), this._renderSideEffect.flushAll(), this.events.removeAllListeners(), this._delegateEvents.removeAllListeners();
  }
  wrapClassName(n) {
    return `${this.namespace}-${n}`;
  }
}
function Cb() {
}
var f_ = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzFfNDQyNDQpIj4KPGcgZmlsdGVyPSJ1cmwoI2ZpbHRlcjBfZF8xXzQ0MjQ0KSI+CjxwYXRoIGQ9Ik0xNC4wMDAyIDE2LjE5NTNDMTMuODI0NyAxNi4xOTUzIDEzLjY1MjIgMTYuMTQ5MSAxMy41MDAyIDE2LjA2MTVMNC41MDAxNyAxMC44NjQzQzQuMDIxNzggMTAuNTg3OSAzLjg1Nzk2IDkuOTc2MTIgNC4xMzQyOCA5LjQ5NzczQzQuMjIyMDQgOS4zNDU3OSA0LjM0ODIzIDkuMjE5NiA0LjUwMDE3IDkuMTMxODRMMTMuNTAwMiAzLjkzODQ4QzEzLjgwOTggMy43NjA3NCAxNC4xOTA1IDMuNzYwNzQgMTQuNTAwMiAzLjkzODQ4TDIzLjUwMDIgOS4xMzE4NEMyMy45Nzg2IDkuNDA4MTYgMjQuMTQyNCAxMC4wMiAyMy44NjYxIDEwLjQ5ODRDMjMuNzc4MyAxMC42NTAzIDIzLjY1MjEgMTAuNzc2NSAyMy41MDAyIDEwLjg2NDNMMTQuNTAwMiAxNi4wNjE1QzE0LjM0ODEgMTYuMTQ5MSAxNC4xNzU3IDE2LjE5NTMgMTQuMDAwMiAxNi4xOTUzWiIgZmlsbD0id2hpdGUiLz4KPC9nPgo8ZyBmaWx0ZXI9InVybCgjZmlsdGVyMV9kXzFfNDQyNDQpIj4KPHBhdGggZD0iTTIzLjUwMDIgMTMuMTMxOUwyMS41MzYxIDExLjk5ODVMMTQuNTAwMiAxNi4wNjE2QzE0LjE5MDcgMTYuMjQgMTMuODA5NiAxNi4yNCAxMy41MDAyIDE2LjA2MTZMNi40NjQyOCAxMS45OTg1TDQuNTAwMTcgMTMuMTMxOUM0LjAyMTc4IDEzLjQwODIgMy44NTc5NiAxNC4wMiA0LjEzNDI4IDE0LjQ5ODRDNC4yMjIwNCAxNC42NTA0IDQuMzQ4MjMgMTQuNzc2NiA0LjUwMDE3IDE0Ljg2NDNMMTMuNTAwMiAyMC4wNjE2QzEzLjgwOTYgMjAuMjQgMTQuMTkwNyAyMC4yNCAxNC41MDAyIDIwLjA2MTZMMjMuNTAwMiAxNC44NjQzQzIzLjk3ODYgMTQuNTg4IDI0LjE0MjQgMTMuOTc2MiAyMy44NjYxIDEzLjQ5NzhDMjMuNzc4MyAxMy4zNDU5IDIzLjY1MjEgMTMuMjE5NyAyMy41MDAyIDEzLjEzMTlaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjgiIHNoYXBlLXJlbmRlcmluZz0iY3Jpc3BFZGdlcyIvPgo8L2c+CjxnIGZpbHRlcj0idXJsKCNmaWx0ZXIyX2RfMV80NDI0NCkiPgo8cGF0aCBkPSJNMjMuNTAwMiAxNy4xMzE5TDIxLjUzNjEgMTUuOTk4NUwxNC41MDAyIDIwLjA2MTZDMTQuMTkwNyAyMC4yNCAxMy44MDk2IDIwLjI0IDEzLjUwMDIgMjAuMDYxNkw2LjQ2NDI4IDE1Ljk5ODVMNC41MDAxNyAxNy4xMzE5QzQuMDIxNzggMTcuNDA4MiAzLjg1Nzk2IDE4LjAyIDQuMTM0MjggMTguNDk4NEM0LjIyMjA0IDE4LjY1MDQgNC4zNDgyMyAxOC43NzY2IDQuNTAwMTcgMTguODY0M0wxMy41MDAyIDI0LjA2MTZDMTMuODA5NiAyNC4yNCAxNC4xOTA3IDI0LjI0IDE0LjUwMDIgMjQuMDYxNkwyMy41MDAyIDE4Ljg2NDNDMjMuOTc4NiAxOC41ODggMjQuMTQyNCAxNy45NzYyIDIzLjg2NjEgMTcuNDk3OEMyMy43NzgzIDE3LjM0NTkgMjMuNjUyMSAxNy4yMTk3IDIzLjUwMDIgMTcuMTMxOVoiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuNiIgc2hhcGUtcmVuZGVyaW5nPSJjcmlzcEVkZ2VzIi8+CjwvZz4KPC9nPgo8ZGVmcz4KPGZpbHRlciBpZD0iZmlsdGVyMF9kXzFfNDQyNDQiIHg9IjMiIHk9IjMuODA1MTgiIHdpZHRoPSIyMiIgaGVpZ2h0PSIxNC4zOTAxIiBmaWx0ZXJVbml0cz0idXNlclNwYWNlT25Vc2UiIGNvbG9yLWludGVycG9sYXRpb24tZmlsdGVycz0ic1JHQiI+CjxmZUZsb29kIGZsb29kLW9wYWNpdHk9IjAiIHJlc3VsdD0iQmFja2dyb3VuZEltYWdlRml4Ii8+CjxmZUNvbG9yTWF0cml4IGluPSJTb3VyY2VBbHBoYSIgdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDEyNyAwIiByZXN1bHQ9ImhhcmRBbHBoYSIvPgo8ZmVPZmZzZXQgZHk9IjEiLz4KPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMC41Ii8+CjxmZUNvbXBvc2l0ZSBpbjI9ImhhcmRBbHBoYSIgb3BlcmF0b3I9Im91dCIvPgo8ZmVDb2xvck1hdHJpeCB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMCAwIDAgMCAwLjU1Mjk0MSAwIDAgMCAwIDAuNTYwNzg0IDAgMCAwIDAgMC42NTA5OCAwIDAgMCAwLjE1IDAiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbjI9IkJhY2tncm91bmRJbWFnZUZpeCIgcmVzdWx0PSJlZmZlY3QxX2Ryb3BTaGFkb3dfMV80NDI0NCIvPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluPSJTb3VyY2VHcmFwaGljIiBpbjI9ImVmZmVjdDFfZHJvcFNoYWRvd18xXzQ0MjQ0IiByZXN1bHQ9InNoYXBlIi8+CjwvZmlsdGVyPgo8ZmlsdGVyIGlkPSJmaWx0ZXIxX2RfMV80NDI0NCIgeD0iMyIgeT0iMTEuOTk4NSIgd2lkdGg9IjIyIiBoZWlnaHQ9IjEwLjE5NjgiIGZpbHRlclVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj4KPGZlRmxvb2QgZmxvb2Qtb3BhY2l0eT0iMCIgcmVzdWx0PSJCYWNrZ3JvdW5kSW1hZ2VGaXgiLz4KPGZlQ29sb3JNYXRyaXggaW49IlNvdXJjZUFscGhhIiB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMTI3IDAiIHJlc3VsdD0iaGFyZEFscGhhIi8+CjxmZU9mZnNldCBkeT0iMSIvPgo8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIwLjUiLz4KPGZlQ29tcG9zaXRlIGluMj0iaGFyZEFscGhhIiBvcGVyYXRvcj0ib3V0Ii8+CjxmZUNvbG9yTWF0cml4IHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAuNTUyOTQxIDAgMCAwIDAgMC41NjA3ODQgMCAwIDAgMCAwLjY1MDk4IDAgMCAwIDAuMTUgMCIvPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluMj0iQmFja2dyb3VuZEltYWdlRml4IiByZXN1bHQ9ImVmZmVjdDFfZHJvcFNoYWRvd18xXzQ0MjQ0Ii8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0iZWZmZWN0MV9kcm9wU2hhZG93XzFfNDQyNDQiIHJlc3VsdD0ic2hhcGUiLz4KPC9maWx0ZXI+CjxmaWx0ZXIgaWQ9ImZpbHRlcjJfZF8xXzQ0MjQ0IiB4PSIzIiB5PSIxNS45OTg1IiB3aWR0aD0iMjIiIGhlaWdodD0iMTAuMTk2OCIgZmlsdGVyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiPgo8ZmVGbG9vZCBmbG9vZC1vcGFjaXR5PSIwIiByZXN1bHQ9IkJhY2tncm91bmRJbWFnZUZpeCIvPgo8ZmVDb2xvck1hdHJpeCBpbj0iU291cmNlQWxwaGEiIHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAxMjcgMCIgcmVzdWx0PSJoYXJkQWxwaGEiLz4KPGZlT2Zmc2V0IGR5PSIxIi8+CjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjAuNSIvPgo8ZmVDb21wb3NpdGUgaW4yPSJoYXJkQWxwaGEiIG9wZXJhdG9yPSJvdXQiLz4KPGZlQ29sb3JNYXRyaXggdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAgMCAwIDAgMC41NTI5NDEgMCAwIDAgMCAwLjU2MDc4NCAwIDAgMCAwIDAuNjUwOTggMCAwIDAgMC4xNSAwIi8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW4yPSJCYWNrZ3JvdW5kSW1hZ2VGaXgiIHJlc3VsdD0iZWZmZWN0MV9kcm9wU2hhZG93XzFfNDQyNDQiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJlZmZlY3QxX2Ryb3BTaGFkb3dfMV80NDI0NCIgcmVzdWx0PSJzaGFwZSIvPgo8L2ZpbHRlcj4KPGNsaXBQYXRoIGlkPSJjbGlwMF8xXzQ0MjQ0Ij4KPHJlY3Qgd2lkdGg9IjI4IiBoZWlnaHQ9IjI4IiBmaWxsPSJ3aGl0ZSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo=";
let Wh, Fh;
function h_(r, n = !1) {
  Wh ? n ? Fh == null || Fh.push(r) : Wh.push(r) : (Wh = n ? [] : [r], Fh = n ? [r] : [], Promise.resolve().then(() => {
    const o = Wh, l = Fh;
    Wh = void 0, Fh = void 0, l == null || l.forEach((h) => h()), o == null || o.forEach((h) => h());
  }));
}
function p_(r) {
  const n = r.cloneNode(!0);
  n.style.position = "absolute", n.style.top = "-99999px", n.style.float = "none", n.style.visibility = "hidden", n.style.display = "block", document.body.appendChild(n);
  const o = n.getBoundingClientRect();
  return document.body.removeChild(n), { height: o.height, width: o.width };
}
class GM {
  constructor({
    visible: n = !0,
    readonly: o = !1,
    darkMode: l = !1,
    namespace: h = "telebox",
    styles: m = {},
    onClick: w,
    minimizedBoxes: g = [],
    boxes: S = [],
    externalEvents: C
  } = {}) {
    this.handleCollectorClick = () => {
      !this._readonly && this.onClick && this.popupVisible$.setValue(!this.popupVisible$.value);
    }, this.externalEvents = C, this._sideEffect = new op();
    const { createVal: I } = bS(this._sideEffect);
    this._visible = n, this._readonly = o, this._darkMode = l, this.namespace = h, this.styles = m, this.minimizedBoxes = g, this.boxes = S, this.onClick = w, this.popupVisible$ = I(!1), this.popupVisible$.reaction((z) => {
      var F;
      (F = this.$titles) == null || F.classList.toggle(
        this.wrapClassName("collector-hide"),
        !z
      ), requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          var j;
          (j = this.$titles) == null || j.classList.toggle(
            this.wrapClassName(
              "collector-titles-visible"
            ),
            z
          );
        });
      });
    });
    const A = (z) => {
      var F, j;
      !this.popupVisible$ || (j = (F = z.target.className) == null ? void 0 : F.includes) != null && j.call(F, "collector") || this.popupVisible$.setValue(!1);
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
  mount(n) {
    return this.render(n), this.root = n, this;
  }
  unmount() {
    return this.$collector && this.$collector.remove(), this;
  }
  setVisible(n) {
    var o;
    return this._visible !== n && (this._visible = n, this.$collector && (this.$collector.classList.toggle(this.wrapClassName("collector-visible"), n), (o = this.wrp$) == null || o.classList.toggle(this.wrapClassName("collector-visible"), n), n ? this.renderTitles() : this.popupVisible$.setValue(!1))), this;
  }
  setReadonly(n) {
    return this._readonly !== n && (this._readonly = n, this.$collector && (this.$collector.classList.toggle(this.wrapClassName("collector-readonly"), n), this.$collector.classList.toggle(this.wrapClassName("collector-hide"), n))), this;
  }
  setDarkMode(n) {
    return this._darkMode !== n && (this._darkMode = n, this.$collector && (this.$collector.classList.toggle(this.wrapClassName("color-scheme-dark"), n), this.$collector.classList.toggle(
      this.wrapClassName("color-scheme-light"),
      !n
    ))), this;
  }
  setStyles(n) {
    if (Object.assign(this.styles, n), this.wrp$) {
      const o = this.wrp$;
      Object.keys(n).forEach((l) => {
        const h = n[l];
        h != null && (o.style[l] = h);
      });
    }
    return this;
  }
  setMinimizedBoxes(n) {
    var o;
    this.minimizedBoxes = n, this.count$ && (this.count$.textContent = String((o = this.minimizedBoxes) == null ? void 0 : o.length) || "0"), this.renderTitles();
  }
  setBoxes(n) {
    this.boxes = n, this.renderTitles();
  }
  render(n) {
    if (u_() || l_()) {
      const o = document.createElement("div");
      return o.className = this.wrapClassName("collector-hide"), o;
    }
    return this.$collector || (this.$collector = document.createElement("button"), this.$collector.className = this.wrapClassName("collector"), this.$collector.style.backgroundImage = `url('${f_}')`, this.wrp$ = document.createElement("div"), this.count$ = document.createElement("div"), this.wrp$.className = this.wrapClassName("collector-wrp"), this.count$.className = this.wrapClassName("collector-count"), this.wrp$.appendChild(this.count$), this.wrp$.appendChild(this.$collector), this.$collector.addEventListener("click", this.handleCollectorClick), this._visible && (this.$collector.classList.add(this.wrapClassName("collector-visible")), this.wrp$.classList.toggle(this.wrapClassName("collector-visible")), this.renderTitles()), this._readonly && this.$collector.classList.add(this.wrapClassName("collector-readonly")), this.$collector.classList.add(
      this.wrapClassName(this._darkMode ? "color-scheme-dark" : "color-scheme-light")
    ), this.setStyles(this.styles), n.appendChild(this.wrp$)), this.$collector;
  }
  renderTitles() {
    var n, o, l, h;
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
    ), w = m != null ? m : document.createElement("div");
    w.className = this.wrapClassName("collector-titles-content"), m || (this.$titles.appendChild(w), this._sideEffect.addEventListener(
      w,
      "click",
      (C) => {
        var I, A, z, F;
        const j = C.target;
        (A = (I = j.dataset) == null ? void 0 : I.teleBoxID) != null && A.length && ((F = this.onClick) == null || F.call(this, (z = j.dataset) == null ? void 0 : z.teleBoxID));
      },
      {},
      "telebox-collector-titles-content-click"
    )), w.innerHTML = "";
    const g = (n = this.boxes) == null ? void 0 : n.filter((C) => {
      var I;
      return (I = this.minimizedBoxes) == null ? void 0 : I.includes(C.id);
    }).map((C) => {
      const I = document.createElement("button");
      return I.className = this.wrapClassName("collector-titles-tab"), I.textContent = C.title, I.dataset.teleBoxID = C.id, I.dataset.teleTitleBarNoDblClick = "true", w.appendChild(I), C._title$.reaction((A) => I.textContent = A);
    });
    this._sideEffect.addDisposer(
      () => g == null ? void 0 : g.forEach((C) => C()),
      "min-popup-render-tab-titles"
    );
    const S = (o = this.wrp$) == null ? void 0 : o.querySelector(
      `.${this.wrapClassName("collector-titles")}`
    );
    return S ? (h = this.wrp$) == null || h.replaceChild(this.$titles, S) : (l = this.wrp$) == null || l.appendChild(this.$titles), h_(() => {
      var C, I;
      if (!this.$titles || !this.wrp$ || !this.root)
        return;
      const A = (C = this.wrp$) == null ? void 0 : C.getBoundingClientRect(), z = (I = this.root) == null ? void 0 : I.getBoundingClientRect(), F = p_(this.$titles);
      A.top - z.top > F.height;
      const j = A.x - z.x > F.width / 2 - A.width / 2, q = -F.height - 10;
      let Y = -(F.width / 2 - A.width / 2);
      j || (Y = -(A.x - z.x - 4)), this.$titles.style.top = `${q}px`, this.$titles.style.left = `${Y}px`;
    }), this.$titles;
  }
  destroy() {
    this.$collector && (this.$collector.removeEventListener("click", this.handleCollectorClick), this.$collector.remove(), this.$collector = void 0), this.onClick = void 0;
  }
  wrapClassName(n) {
    return `${this.namespace}-${n}`;
  }
}
var mn = /* @__PURE__ */ ((r) => (r.Focused = "focused", r.Blurred = "blurred", r.Created = "created", r.Removed = "removed", r.State = "state", r.Maximized = "maximized", r.Minimized = "minimized", r.Move = "move", r.Resize = "resize", r.IntrinsicMove = "intrinsic_move", r.IntrinsicResize = "intrinsic_resize", r.VisualResize = "visual_resize", r.ZIndex = "z_index", r.PrefersColorScheme = "prefers_color_scheme", r.DarkMode = "dark_mode", r))(mn || {});
class m_ extends YM {
  constructor(n) {
    super(n), this.boxes = n.boxes, this.focusedBox = n.focusedBox, this.containerRect = n.containerRect, this.darkMode = n.darkMode, this.maximizedBoxes$ = n.maximizedBoxes$, this.minimizedBoxes$ = n.minimizedBoxes$;
  }
  focusBox(n) {
    var o;
    if (!(this.focusedBox && this.focusedBox === n)) {
      if (this.$titles && this.state === nn.Maximized) {
        const { children: l } = this.$titles.firstElementChild;
        for (let h = l.length - 1; h >= 0; h -= 1) {
          const m = l[h], w = (o = m.dataset) == null ? void 0 : o.teleBoxID;
          w && (n && w === n.id ? m.classList.toggle(this.wrapClassName("titles-tab-focus"), !0) : this.focusedBox && w === this.focusedBox.id && m.classList.toggle(this.wrapClassName("titles-tab-focus"), !1));
        }
      }
      this.focusedBox = n;
    }
  }
  setContainerRect(n) {
    if (this.containerRect = n, this.$titleBar) {
      const { x: o, y: l, width: h } = n;
      this.$titleBar.style.transform = `translate(${o}px, ${l}px)`, this.$titleBar.style.width = h + "px";
    }
  }
  setBoxes(n) {
    this.boxes = n, this.updateTitles();
  }
  setMaximizedBoxes(n) {
    this.maximizedBoxes$ = n, this.updateTitles();
  }
  setMinimizedBoxes(n) {
    this.minimizedBoxes$ = n, this.updateTitles();
  }
  setState(n) {
    super.setState(n), this.$titleBar && this.$titleBar.classList.toggle(
      this.wrapClassName("max-titlebar-maximized"),
      n === nn.Maximized
    ), this.updateTitles();
  }
  setReadonly(n) {
    super.setReadonly(n), this.$titleBar && this.$titleBar.classList.toggle(this.wrapClassName("readonly"), this.readonly);
  }
  setDarkMode(n) {
    n !== this.darkMode && (this.darkMode = n, this.$titleBar && (this.$titleBar.classList.toggle(this.wrapClassName("color-scheme-dark"), n), this.$titleBar.classList.toggle(this.wrapClassName("color-scheme-light"), !n)));
  }
  render() {
    const n = super.render(), { x: o, y: l, width: h } = this.containerRect;
    n.style.transform = `translate(${o}px, ${l}px)`, n.style.width = h + "px", n.classList.add(this.wrapClassName("max-titlebar")), n.classList.toggle(
      this.wrapClassName("max-titlebar-maximized"),
      this.state === nn.Maximized
    ), n.classList.toggle(this.wrapClassName("readonly"), this.readonly), n.classList.add(
      this.wrapClassName(this.darkMode ? "color-scheme-dark" : "color-scheme-light")
    );
    const m = document.createElement("div");
    return m.classList.add(this.wrapClassName("titles-area")), n.insertBefore(m, n.firstElementChild), this.updateTitles(), n;
  }
  destroy() {
    super.destroy(), this.$titles = void 0, this.boxes.length = 0, this.focusedBox = void 0;
  }
  updateTitles() {
    var n;
    (n = this.$titleBar) == null || n.classList.toggle(
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
    const n = document.createElement("div");
    return n.className = this.wrapClassName("titles-content"), this.$titles.appendChild(n), this.boxes.filter((o) => this.maximizedBoxes$.includes(o.id)).filter((o) => !this.minimizedBoxes$.includes(o.id)).forEach((o) => {
      const l = document.createElement("button");
      l.className = this.wrapClassName("titles-tab"), l.textContent = o.title, l.dataset.teleBoxID = o.id, l.dataset.teleTitleBarNoDblClick = "true", this.focusedBox && o.id === this.focusedBox.id && l.classList.add(this.wrapClassName("titles-tab-focus")), n.appendChild(l);
    }), this.$titles;
  }
}
function v_() {
  let r = /* @__PURE__ */ new Set();
  function n(w) {
    return r.add(w), () => {
      o(w);
    };
  }
  function o(w) {
    r.delete(w);
  }
  function l(...w) {
    r.forEach((g) => {
      g(...w);
    });
  }
  function h() {
    return Boolean(r.size);
  }
  function m() {
    r = /* @__PURE__ */ new Set();
  }
  return {
    runCallbacks: l,
    addCallback: n,
    removeCallback: o,
    hasCallbacks: h,
    removeAll: m
  };
}
class g_ {
  constructor({
    root: n = document.body,
    prefersColorScheme: o = SS.Light,
    fence: l = !0,
    containerRect: h = {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight
    },
    collector: m,
    namespace: w = "telebox",
    readonly: g = !1,
    minimizedBoxes: S = [],
    maximizedBoxes: C = []
  } = {}) {
    this.externalEvents = new og(), this.events = new og(), this._sideEffect = new op();
    const { combine: I, createVal: A } = bS(this._sideEffect);
    this.callbackManager = v_(), this.sizeObserver = new ResizeObserver(this.callbackManager.runCallbacks), this.elementObserverMap = /* @__PURE__ */ new Map(), this.root = n, this.namespace = w, this.boxes$ = A([]), this.topBox$ = this.boxes$.derive((G) => {
      if (G.length > 0)
        return G.reduce(
          (be, ie) => be.zIndex > ie.zIndex ? be : ie
        );
    });
    const z = window.matchMedia("(prefers-color-scheme: dark)"), F = A(!1);
    z && (F.setValue(z.matches), this._sideEffect.add(() => {
      const G = (he) => {
        F.setValue(he.matches);
      };
      return z.addListener(G), () => z.removeListener(G);
    }));
    const j = A(o);
    j.reaction((G, he, be) => {
      this.boxes.forEach((ie) => ie.setPrefersColorScheme(G, be)), be || this.events.emit(mn.PrefersColorScheme, G);
    }), this._darkMode$ = I(
      [F, j],
      ([G, he]) => he === "auto" ? G : he === "dark"
    ), this._darkMode$.reaction((G, he, be) => {
      this.boxes.forEach((ie) => ie.setDarkMode(G, be)), be || this.events.emit(mn.DarkMode, G);
    });
    const q = A(g);
    q.reaction((G, he, be) => {
      this.boxes.forEach((ie) => ie.setReadonly(G, be));
    }), this.maximizedBoxes$ = A(C), this.minimizedBoxes$ = A(S), this.maximizedBoxes$.reaction((G, he, be) => {
      this.boxes.forEach((ct) => ct.setMaximized(G.includes(ct.id), be));
      const ie = G.filter((ct) => !this.minimizedBoxes$.value.includes(ct));
      this.maxTitleBar.setState(ie.length > 0 ? nn.Maximized : nn.Normal), this.maxTitleBar.setMaximizedBoxes(G), be || this.events.emit(mn.Maximized, G);
    });
    const Y = I(
      [this.minimizedBoxes$, this.maximizedBoxes$],
      ([G, he]) => G.length ? nn.Minimized : he.length ? nn.Maximized : nn.Normal
    );
    Y.reaction((G, he, be) => {
      this.maxTitleBar.setState(G), be || this.events.emit(mn.State, G);
    });
    const fe = A(l);
    fe.subscribe((G, he, be) => {
      this.boxes.forEach((ie) => ie.setFence(G, be));
    });
    const se = A(h, ws);
    se.reaction((G, he, be) => {
      this.boxes.forEach((ie) => ie.setContainerRect(G, be)), this.maxTitleBar.setContainerRect(G);
    });
    const Z = A(
      m === null ? null : m || new GM({
        visible: this.minimizedBoxes$.value.length > 0,
        readonly: q.value,
        namespace: w,
        minimizedBoxes: this.minimizedBoxes$.value,
        boxes: this.boxes$.value,
        externalEvents: this.externalEvents
      }).mount(n)
    );
    Z.subscribe((G) => {
      G && (G.setVisible(this.minimizedBoxes$.value.length > 0), G.setReadonly(q.value), G.setDarkMode(this._darkMode$.value), this._sideEffect.add(() => (G.onClick = (he) => {
        var be;
        q.value || (this.setMinimizedBoxes(
          Hh(
            this.minimizedBoxes$.value.filter(Boolean),
            he
          )
        ), (be = this.externalEvents) == null || be.emit("OpenMiniBox", []));
      }, () => G.destroy()), "collect-onClick"));
    }), q.subscribe((G) => {
      var he;
      return (he = Z.value) == null ? void 0 : he.setReadonly(G);
    }), this._darkMode$.subscribe((G) => {
      var he;
      (he = Z.value) == null || he.setDarkMode(G);
    });
    const le = () => {
      var G;
      if ((G = Z.value) != null && G.$collector) {
        const { x: he, y: be, width: ie, height: ct } = Z.value.$collector.getBoundingClientRect(), Oe = this.root.getBoundingClientRect();
        return {
          x: he - Oe.x,
          y: be - Oe.y,
          width: ie,
          height: ct
        };
      }
    }, oe = A(this.minimizedBoxes$.value.length > 0 ? le() : void 0);
    oe.subscribe((G, he, be) => {
      this.boxes.forEach((ie) => {
        ie.setCollectorRect(G, be);
      });
    }), this.minimizedBoxes$.reaction((G, he, be) => {
      var ie, ct, Oe;
      this.boxes.forEach((Se) => Se.setMinimized(G.includes(Se.id), be));
      const ce = this.maximizedBoxes$.value.filter((Se) => !G.includes(Se));
      this.maxTitleBar.setState(ce.length > 0 ? nn.Maximized : nn.Normal), this.maxTitleBar.setMinimizedBoxes(G);
      const Ze = G.length > 0;
      (ie = Z.value) == null || ie.setVisible(Ze), (ct = this.collector) == null || ct.setMinimizedBoxes(G), Ze && (Oe = Z.value) != null && Oe.$collector && oe.setValue(le()), be || this.events.emit(mn.Minimized, G);
    });
    const ke = this.wrapClassName("titlebar-icon-close"), $e = (G) => {
      var he;
      if (q.value)
        return;
      const be = G.target;
      if (!!be.tagName)
        for (let ie = be; ie; ie = ie.parentElement) {
          if (ie.classList && ie.classList.contains(ke))
            return;
          const ct = (he = ie.dataset) == null ? void 0 : he.teleBoxID;
          if (ct) {
            const Oe = this.getBox(ct);
            if (Oe) {
              this.focusBox(Oe), this.makeBoxTop(Oe);
              return;
            }
          }
        }
    };
    this._sideEffect.addEventListener(window, "mousedown", $e, !0), this._sideEffect.addEventListener(window, "touchstart", $e, !0), this.maxTitleBar = new m_({
      darkMode: this.darkMode,
      readonly: q.value,
      namespace: this.namespace,
      state: Y.value,
      boxes: this.boxes$.value,
      containerRect: se.value,
      maximizedBoxes$: this.maximizedBoxes$.value,
      minimizedBoxes$: this.minimizedBoxes$.value,
      onEvent: (G) => {
        var he, be, ie, ct, Oe, ce;
        switch (G.type) {
          case Ki.Maximize: {
            if ((he = this.maxTitleBar.focusedBox) != null && he.id) {
              const Ze = (be = this.maxTitleBar.focusedBox) == null ? void 0 : be.id, He = this.maximizedBoxes$.value.includes(
                Ze
              ) ? Hh(
                [...this.maximizedBoxes$.value],
                Ze
              ) : bT([
                ...this.maximizedBoxes$.value,
                (ie = this.maxTitleBar.focusedBox) == null ? void 0 : ie.id
              ]);
              this.setMaximizedBoxes(He);
              const Re = this.makeBoxTopFromMaximized(), Qe = this.boxes$.value.find(
                (Tt) => Tt.id == Ze
              );
              Qe && this.makeBoxTop(Qe), Re || this.setMaximizedBoxes([]);
            } else
              this.setMaximizedBoxes([]);
            this.externalEvents.emit(mn.Maximized, []);
            break;
          }
          case Ki.Minimize: {
            if ((ct = this.maxTitleBar.focusedBox) != null && ct.id) {
              const Ze = bT([
                ...this.minimizedBoxes$.value,
                (Oe = this.maxTitleBar.focusedBox) == null ? void 0 : Oe.id
              ]);
              this.makeBoxTopFromMaximized(), this.setMinimizedBoxes(Ze);
            }
            this.externalEvents.emit(mn.Minimized, this.minimizedBoxes$.value);
            break;
          }
          case Xn.Close: {
            const Ze = (ce = this.maxTitleBar.focusedBox) == null ? void 0 : ce.id;
            Ze && (this.remove(Ze), this.makeBoxTopFromMaximized(), this.setMaximizedBoxes(Hh(this.maximizedBoxes$.value, Ze))), this.externalEvents.emit(mn.Removed, []), this.focusTopBox();
            break;
          }
        }
      }
    }), q.subscribe((G) => this.maxTitleBar.setReadonly(G)), this._darkMode$.subscribe((G) => {
      this.maxTitleBar.setDarkMode(G);
    }), this.boxes$.reaction((G) => {
      var he;
      this.maxTitleBar.setBoxes(G), (he = this.collector) == null || he.setBoxes(G);
    }), this.maximizedBoxes$.reaction((G) => {
      this.maxTitleBar.setMaximizedBoxes(G);
    }), this.minimizedBoxes$.reaction((G) => {
      this.maxTitleBar.setMinimizedBoxes(G);
    });
    const ze = {
      prefersColorScheme: j,
      containerRect: se,
      collector: Z,
      collectorRect: oe,
      readonly: q,
      fence: fe,
      maximizedBoxes: this.maximizedBoxes$,
      minimizedBoxes: this.minimizedBoxes$
    };
    ZM(this, ze), this._state$ = Y, this.root.appendChild(this.maxTitleBar.render());
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
  setMinimized(n, o = !1) {
    console.log("mini", n, o);
  }
  setMaximized(n, o = !1) {
    console.log("max", n, o);
  }
  setState(n, o = !1) {
    switch (console.log(o), n) {
      case nn.Maximized:
        break;
      case nn.Minimized:
        break;
    }
    return this;
  }
  create(n = {}, o = !0) {
    const l = n.id || Td(), h = this.maximizedBoxes$.value.includes(l), m = this.maximizedBoxes$.value.includes(l), w = new d_({
      zIndex: this.topBox ? this.topBox.zIndex + 1 : 100,
      ...o ? this.smartPosition(n) : n,
      darkMode: this.darkMode,
      prefersColorScheme: this.prefersColorScheme,
      maximized: h,
      minimized: m,
      fence: this.fence,
      namespace: this.namespace,
      containerRect: this.containerRect,
      readonly: this.readonly,
      collectorRect: this.collectorRect,
      id: l,
      addObserver: (g, S) => {
        const C = this.elementObserverMap.get(l);
        C ? C.push({ el: g, cb: S }) : this.elementObserverMap.set(l, [{ el: g, cb: S }]), this.callbackManager.addCallback(S), this.sizeObserver.observe(g);
      }
    });
    return w.mount(this.root), w.focus && (this.focusBox(w), o && this.makeBoxTop(w)), this.boxes$.setValue([...this.boxes, w]), w._delegateEvents.on(Ki.Maximize, () => {
      this.setMaximizedBoxes(this.boxes$.value.map((g) => g.id)), this.maxTitleBar.focusBox(w), this.externalEvents.emit(mn.Maximized, [w.id]);
    }), w._delegateEvents.on(Ki.Minimize, () => {
      this.setMinimizedBoxes([...this.minimizedBoxes$.value, l]), this.externalEvents.emit(mn.Minimized, [w.id]);
    }), w._delegateEvents.on(Ki.Close, () => {
      this.remove(w), this.makeBoxTopFromMaximized(w.id), this.focusTopBox(), this.externalEvents.emit(mn.Removed, [w]);
    }), w._coord$.reaction((g, S, C) => {
      C || this.events.emit(mn.Move, w);
    }), w._size$.reaction((g, S, C) => {
      C || this.events.emit(mn.Resize, w);
    }), w._intrinsicCoord$.reaction((g, S, C) => {
      C || this.events.emit(mn.IntrinsicMove, w);
    }), w._intrinsicSize$.reaction((g, S, C) => {
      C || this.events.emit(mn.IntrinsicResize, w);
    }), w._visualSize$.reaction((g, S, C) => {
      C || this.events.emit(mn.VisualResize, w);
    }), w._zIndex$.reaction((g, S, C) => {
      if (this.boxes.length > 0) {
        const I = this.boxes.reduce(
          (A, z) => A.zIndex > z.zIndex ? A : z
        );
        this.topBox$.setValue(I);
      }
      C || this.events.emit(mn.ZIndex, w);
    }), this.events.emit(mn.Created, w), w;
  }
  query(n) {
    return n ? this.boxes.filter(this.teleBoxMatcher(n)) : [...this.boxes];
  }
  queryOne(n) {
    return n ? this.boxes.find(this.teleBoxMatcher(n)) : this.boxes[0];
  }
  update(n, o, l = !1) {
    const h = this.boxes.find((m) => m.id === n);
    if (h)
      return this.updateBox(h, o, l);
  }
  updateAll(n, o = !1) {
    this.boxes.forEach((l) => {
      this.updateBox(l, n, o);
    });
  }
  remove(n, o = !1) {
    var l;
    const h = this.getBoxIndex(n);
    if (h >= 0) {
      const m = this.boxes.slice(), w = m.splice(h, 1);
      this.boxes$.setValue(m), w.forEach((S) => S.destroy());
      const g = (l = this.getBox(n)) == null ? void 0 : l.id;
      if (g) {
        this.setMaximizedBoxes(Hh(this.maximizedBoxes$.value, g)), this.setMinimizedBoxes(Hh(this.minimizedBoxes$.value, g));
        const S = this.elementObserverMap.get(g);
        S && S.forEach(({ el: C, cb: I }) => {
          this.callbackManager.removeCallback(I), this.sizeObserver.unobserve(C), this.elementObserverMap.delete(g);
        });
      }
      return o || (this.boxes.length <= 0 && (this.setMaximizedBoxes([]), this.setMinimizedBoxes([])), this.events.emit(mn.Removed, w)), w[0];
    }
  }
  removeTopBox() {
    if (this.topBox)
      return this.remove(this.topBox);
  }
  removeAll(n = !1) {
    const o = this.boxes$.value;
    return this.boxes$.setValue([]), o.forEach((l) => l.destroy()), this.sizeObserver.disconnect(), this.elementObserverMap = /* @__PURE__ */ new Map(), this.callbackManager.removeAll(), n || (this.boxes.length <= 0 && (this.setMaximizedBoxes([]), this.setMinimizedBoxes([])), this.events.emit(mn.Removed, o)), o;
  }
  destroy(n = !1) {
    this.events.removeAllListeners(), this._sideEffect.flushAll(), this.removeAll(n), this.sizeObserver.disconnect(), this.callbackManager.removeAll(), Object.keys(this).forEach((o) => {
      const l = this[o];
      l instanceof cp && l.destroy();
    });
  }
  wrapClassName(n) {
    return `${this.namespace}-${n}`;
  }
  focusBox(n, o = !1) {
    const l = this.getBox(n);
    l && (this.boxes.forEach((h) => {
      if (l === h) {
        let m = !1;
        l.focus || (m = !0, l.setFocus(!0, o)), m && !o && this.events.emit(mn.Focused, l);
      } else
        h.focus && this.blurBox(h, o);
    }), this.maximizedBoxes$.value.length > 0 ? this.maximizedBoxes$.value.includes(l.id) && this.maxTitleBar.focusBox(l) : this.maxTitleBar.focusBox(l));
  }
  focusTopBox() {
    if (this.topBox && !this.topBox.focus)
      return this.focusBox(this.topBox);
  }
  blurBox(n, o = !1) {
    const l = this.getBox(n);
    l && l.focus && (l.setFocus(!1, o), o || this.events.emit(mn.Blurred, l));
  }
  blurAll(n = !1) {
    this.boxes.forEach((o) => {
      o.focus && (o.setFocus(!1, n), n || this.events.emit(mn.Blurred, o));
    }), this.maxTitleBar.focusedBox && this.maxTitleBar.focusBox();
  }
  setScaleContent(n, o) {
    const l = this.boxes.find((h) => h.id == n);
    l && l.setScaleContent(o);
  }
  teleBoxMatcher(n) {
    const o = Object.keys(n);
    return (l) => o.every((h) => n[h] === l[h]);
  }
  updateBox(n, o, l = !1) {
    (o.x != null || o.y != null) && n.move(
      o.x == null ? n.intrinsicX : o.x,
      o.y == null ? n.intrinsicY : o.y,
      l
    ), (o.width != null || o.height != null) && n.resize(
      o.width == null ? n.intrinsicWidth : o.width,
      o.height == null ? n.intrinsicHeight : o.height,
      l
    ), o.title != null && (n.setTitle(o.title), this.maxTitleBar.updateTitles()), o.visible != null && n.setVisible(o.visible, l), o.minHeight != null && n.setMinHeight(o.minHeight, l), o.minWidth != null && n.setMinWidth(o.minWidth, l), o.resizable != null && n.setResizable(o.resizable, l), o.draggable != null && n.setDraggable(o.draggable, l), o.fixRatio != null && n.setFixRatio(o.fixRatio, l), o.zIndex != null && n.setZIndex(o.zIndex, l), o.content != null && n.mountContent(o.content), o.footer != null && n.mountFooter(o.footer), o.maximized != null && n.setMaximized(o.maximized, l), o.minimized != null && n.setMinimized(o.minimized, l);
  }
  smartPosition(n = {}) {
    let { x: o, y: l } = n;
    const { width: h = 0.5, height: m = 0.5 } = n;
    if (o == null) {
      let w = 20;
      this.topBox && (w = this.topBox.intrinsicX * this.containerRect.width + 20, w > this.containerRect.width - h * this.containerRect.width && (w = 20)), o = w / this.containerRect.width;
    }
    if (l == null) {
      let w = 20;
      this.topBox && (w = this.topBox.intrinsicY * this.containerRect.height + 20, w > this.containerRect.height - m * this.containerRect.height && (w = 20)), l = w / this.containerRect.height;
    }
    return { ...n, x: o, y: l, width: h, height: m };
  }
  makeBoxTop(n, o = !1) {
    if (this.topBox && n !== this.topBox)
      if (this.maximizedBoxes$.value.includes(n.id)) {
        const l = this.topBox.zIndex + 1, h = o_(
          this.boxes$.value.map((w) => w.id),
          this.maximizedBoxes$.value,
          this.minimizedBoxes$.value
        ), m = this.boxes$.value.filter(
          (w) => h.includes(w.id)
        );
        n._zIndex$.setValue(l, o), m.sort((w, g) => w._zIndex$.value - g._zIndex$.value).forEach((w, g) => {
          w._zIndex$.setValue(l + 1 + g, o);
        });
      } else
        n._zIndex$.setValue(this.topBox.zIndex + 1, o);
  }
  makeBoxTopFromMaximized(n) {
    let o;
    if (n)
      this.maximizedBoxes$.value.includes(n) && !this.minimizedBoxes$.value.includes(n) && (o = this.boxes$.value.find((l) => l.id === n));
    else {
      const l = this.boxes$.value.filter((h) => {
        var m;
        return h.id != ((m = this.maxTitleBar.focusedBox) == null ? void 0 : m.id) && this.maximizedBoxes$.value.includes(h.id) && !this.minimizedBoxes$.value.includes(h.id);
      });
      o = l.length ? l.reduce((h, m) => m._zIndex$.value > h._zIndex$.value ? m : h) : void 0, o && this.maxTitleBar.focusBox(o);
    }
    return !!o;
  }
  getBoxIndex(n) {
    return typeof n == "string" ? this.boxes.findIndex((o) => o.id === n) : this.boxes.findIndex((o) => o === n);
  }
  setMaxTitleFocus(n) {
    this.getBox(n) && this.maxTitleBar.focusBox(this.getBox(n));
  }
  getBox(n) {
    return typeof n == "string" ? this.boxes.find((o) => o.id === n) : n;
  }
}
var gM;
const np = (gM = window.navigator) == null ? void 0 : gM.userAgent;
np == null || np.match(/(Edge?)\/(\d+)/);
const xT = () => typeof navigator < "u" && typeof window < "u" && /iPad|iPhone|iPod/.test(np), CT = () => typeof navigator < "u" && /Android/.test(np), y_ = (r, n, o, l, h) => new w_(
  {
    safeSetAttributes: (m) => r.safeSetAttributes(m),
    getMainView: () => r.mainView,
    updateAppState: (...m) => {
      var w;
      return (w = r.appManager) == null ? void 0 : w.store.updateAppState(...m);
    },
    canOperate: () => r.canOperate,
    notifyContainerRectUpdate: (m) => {
      var w;
      return (w = r.appManager) == null ? void 0 : w.notifyContainerRectUpdate(m);
    },
    cleanFocus: () => {
      var m;
      return (m = r.appManager) == null ? void 0 : m.store.cleanFocus();
    },
    setAppFocus: (m) => {
      var w;
      return (w = r.appManager) == null ? void 0 : w.store.setAppFocus(m, !0);
    },
    callbacks: n,
    emitter: o,
    boxEmitter: l,
    manager: r
  },
  h
);
class w_ {
  constructor(n, o) {
    this.context = n, this.createTeleBoxManagerConfig = o;
    const { emitter: l, callbacks: h, boxEmitter: m, manager: w } = n;
    this.manager = w, this.teleBoxManager = this.setupBoxManager(o), this.teleBoxManager._state$.reaction((g) => {
      h.emit("boxStateChange", g), l.emit("boxStateChange", g);
    }), this.teleBoxManager._darkMode$.reaction((g) => {
      h.emit("darkModeChange", g);
    }), this.teleBoxManager._prefersColorScheme$.reaction((g) => {
      h.emit("prefersColorSchemeChange", g);
    }), this.teleBoxManager._minimizedBoxes$.reaction((g) => {
      g.length || setTimeout(() => {
        const S = 1e-3 * (Math.random() > 0.5 ? 1 : -1);
        this.teleBoxManager.boxes.forEach((C) => {
          C.resize(C.intrinsicWidth + S, C.intrinsicHeight + S, !0);
        });
      }, 400);
    }), this.teleBoxManager.events.on("minimized", (g) => {
      this.context.safeSetAttributes({ minimizedBoxes: JSON.stringify(g) }), h.emit("onMinimized", JSON.stringify(g));
    }), this.teleBoxManager.events.on("maximized", (g) => {
      this.context.safeSetAttributes({ maximizedBoxes: JSON.stringify(g) }), h.emit("onMaximized", JSON.stringify(g));
    }), this.teleBoxManager.events.on("removed", (g) => {
      g.forEach((S) => {
        m.emit("close", { appId: S.id });
      });
    }), this.teleBoxManager.events.on(
      "intrinsic_move",
      Ta((g) => {
        m.emit("move", { appId: g.id, x: g.intrinsicX, y: g.intrinsicY });
      }, 50)
    ), this.teleBoxManager.events.on(
      "intrinsic_resize",
      Ta((g) => {
        m.emit("resize", {
          appId: g.id,
          width: g.intrinsicWidth,
          height: g.intrinsicHeight
        });
      }, 200)
    ), this.teleBoxManager.events.on("focused", (g) => {
      g && (this.canOperate ? m.emit("focus", { appId: g.id }) : this.teleBoxManager.blurBox(g.id));
    }), this.teleBoxManager.events.on("z_index", (g) => {
      this.context.updateAppState(g.id, Ji.ZIndex, g.zIndex), h.emit("appZIndexChange", { appId: g.id, box: g });
    }), l.on("playgroundSizeChange", () => this.updateManagerRect()), l.on("updateManagerRect", () => this.updateManagerRect()), l.on("onScaleChange", ({ appId: g, scale: S }) => {
      this.changeScale(g, S);
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
  changeScale(n, o) {
    this.teleBoxManager.setScaleContent(n, o);
  }
  createBox(n) {
    var I, A, z, F;
    if (!this.teleBoxManager)
      return;
    let { minwidth: o = uN, minheight: l = cN } = (I = n.app.config) != null ? I : {};
    const { width: h, height: m } = (A = n.app.config) != null ? A : {}, w = ((z = n.options) == null ? void 0 : z.title) || n.appId, g = this.teleBoxManager.containerRect;
    o > 1 && (o = o / g.width), l > 1 && (l = l / g.height);
    const S = {
      title: w,
      minWidth: o,
      minHeight: l,
      width: h,
      height: m,
      id: n.appId
    }, C = this.teleBoxManager.create(S, n.smartPosition);
    this.context.emitter.emit(`${n.appId}${Xt.WindowCreated}`), (F = this.manager.scrollerManager) == null || F.add({ appId: n.appId, manager: this.manager, scrollElement: C == null ? void 0 : C.$contentWrap });
  }
  setBoxInitState(n) {
    const o = this.teleBoxManager.queryOne({ id: n });
    o && o.state === nn.Maximized && this.context.boxEmitter.emit("resize", {
      appId: n,
      x: o.x,
      y: o.y,
      width: o.intrinsicWidth,
      height: o.intrinsicHeight
    });
  }
  setupBoxManager(n) {
    const o = Wt.wrapper ? Wt.wrapper : document.body, l = o.getBoundingClientRect(), h = {
      root: o,
      containerRect: {
        x: 0,
        y: 0,
        width: l.width,
        height: l.height
      },
      fence: !1,
      prefersColorScheme: n == null ? void 0 : n.prefersColorScheme
    }, m = new g_(h);
    this.teleBoxManager && this.teleBoxManager.destroy(), this.teleBoxManager = m;
    const w = (n == null ? void 0 : n.collectorContainer) || Wt.wrapper;
    return w && this.setCollectorContainer(w), m;
  }
  setCollectorContainer(n) {
    var l;
    const o = new GM({
      styles: (l = this.createTeleBoxManagerConfig) == null ? void 0 : l.collectorStyles,
      readonly: this.teleBoxManager.readonly
    }).mount(n);
    this.teleBoxManager.setCollector(o);
  }
  getBox(n) {
    return this.teleBoxManager.queryOne({ id: n });
  }
  closeBox(n, o = !1) {
    var l;
    return (l = this.manager.scrollerManager) == null || l.remove(n), this.teleBoxManager.remove(n, o);
  }
  boxIsFocus(n) {
    const o = this.getBox(n);
    return o == null ? void 0 : o.focus;
  }
  getFocusBox() {
    return this.teleBoxManager.query({ focus: !0 })[0];
  }
  getTopBox() {
    return this.teleBoxManager.topBox;
  }
  updateBoxState(n) {
    if (console.log(n), !n)
      return;
    const o = this.getBox(n.id);
    o && (this.teleBoxManager.update(
      o.id,
      {
        x: n.x,
        y: n.y,
        width: n.width || 0.5,
        height: n.height || 0.5,
        zIndex: n.zIndex
      },
      !1
    ), setTimeout(() => {
      n.focus && this.teleBoxManager.focusBox(o.id, !0);
    }, 50), this.context.callbacks.emit("boxStateChange", this.teleBoxManager.state));
  }
  updateManagerRect() {
    var o;
    const n = (o = Wt.wrapper) == null ? void 0 : o.getBoundingClientRect();
    if (n && n.width > 0 && n.height > 0) {
      const l = { x: 0, y: 0, width: n.width, height: n.height };
      this.teleBoxManager.setContainerRect(l), this.context.notifyContainerRectUpdate(l);
    }
  }
  moveBox({ appId: n, x: o, y: l }) {
    this.teleBoxManager.update(n, { x: o, y: l }, !0);
  }
  focusBox({ appId: n }, o = !0) {
    this.teleBoxManager.focusBox(n, o);
  }
  resizeBox({ appId: n, width: o, height: l, skipUpdate: h }) {
    this.teleBoxManager.update(n, { width: o, height: l }, h);
  }
  setBoxMinSize(n) {
    this.teleBoxManager.update(
      n.appId,
      {
        minWidth: n.minWidth,
        minHeight: n.minHeight
      },
      !0
    );
  }
  setBoxTitle(n) {
    this.teleBoxManager.update(n.appId, { title: n.title }, !0);
  }
  blurAllBox() {
    this.teleBoxManager.blurAll();
  }
  updateAll(n) {
    this.teleBoxManager.updateAll(n);
  }
  setMaximized(n, o = !0) {
    if (!!iT(n))
      try {
        this.teleBoxManager.setMaximizedBoxes(JSON.parse(n), o);
      } catch (l) {
        console.log(l);
      }
  }
  setMinimized(n, o = !0) {
    if (!!iT(n))
      try {
        this.teleBoxManager.setMinimizedBoxes(JSON.parse(n), o);
      } catch (l) {
        console.log(l);
      }
  }
  focusTopBox() {
    if (this.teleBoxManager.query().length >= 1) {
      const o = this.getTopBox();
      o && this.focusBox({ appId: o.id }, !1);
    }
  }
  updateBox(n, o, l = !0) {
    this.teleBoxManager.update(n, o, l);
  }
  setReadonly(n) {
    var o;
    this.teleBoxManager.setReadonly(n || xT() || CT()), (o = this.teleBoxManager._collector$.value) == null || o.setReadonly(n || xT() || CT());
  }
  setPrefersColorScheme(n) {
    this.teleBoxManager.setPrefersColorScheme(n);
  }
  setZIndex(n, o, l = !0) {
    this.teleBoxManager.update(n, { zIndex: o }, l);
  }
  destroy() {
    this.teleBoxManager.destroy();
  }
}
function lg() {
}
function XM(r) {
  return r();
}
function TT() {
  return /* @__PURE__ */ Object.create(null);
}
function gg(r) {
  r.forEach(XM);
}
function b_(r) {
  return typeof r == "function";
}
function S_(r, n) {
  return r != r ? n == n : r !== n || r && typeof r == "object" || typeof r == "function";
}
let Hv;
function ug(r, n) {
  return Hv || (Hv = document.createElement("a")), Hv.href = n, r === Hv.href;
}
function x_(r) {
  return Object.keys(r).length === 0;
}
function vo(r, n) {
  r.appendChild(n);
}
function yg(r, n, o) {
  r.insertBefore(n, o || null);
}
function dp(r) {
  r.parentNode.removeChild(r);
}
function ul(r) {
  return document.createElement(r);
}
function xS(r) {
  return document.createTextNode(r);
}
function Jb() {
  return xS(" ");
}
function Dn(r, n, o) {
  o == null ? r.removeAttribute(n) : r.getAttribute(n) !== o && r.setAttribute(n, o);
}
function C_(r) {
  return Array.from(r.childNodes);
}
function JM(r, n) {
  n = "" + n, r.wholeText !== n && (r.data = n);
}
function Si(r, n, o, l) {
  r.style.setProperty(n, o, l ? "important" : "");
}
let qM;
function cg(r) {
  qM = r;
}
const Gh = [], MT = [], ng = [], ET = [], T_ = Promise.resolve();
let qb = !1;
function M_() {
  qb || (qb = !0, T_.then(KM));
}
function Kb(r) {
  ng.push(r);
}
let Tb = !1;
const Mb = /* @__PURE__ */ new Set();
function KM() {
  if (!Tb) {
    Tb = !0;
    do {
      for (let r = 0; r < Gh.length; r += 1) {
        const n = Gh[r];
        cg(n), E_(n.$$);
      }
      for (cg(null), Gh.length = 0; MT.length; )
        MT.pop()();
      for (let r = 0; r < ng.length; r += 1) {
        const n = ng[r];
        Mb.has(n) || (Mb.add(n), n());
      }
      ng.length = 0;
    } while (Gh.length);
    for (; ET.length; )
      ET.pop()();
    qb = !1, Tb = !1, Mb.clear();
  }
}
function E_(r) {
  if (r.fragment !== null) {
    r.update(), gg(r.before_update);
    const n = r.dirty;
    r.dirty = [-1], r.fragment && r.fragment.p(r.ctx, n), r.after_update.forEach(Kb);
  }
}
const I_ = /* @__PURE__ */ new Set();
function A_(r, n) {
  r && r.i && (I_.delete(r), r.i(n));
}
function R_(r, n, o, l) {
  const { fragment: h, on_mount: m, on_destroy: w, after_update: g } = r.$$;
  h && h.m(n, o), l || Kb(() => {
    const S = m.map(XM).filter(b_);
    w ? w.push(...S) : gg(S), r.$$.on_mount = [];
  }), g.forEach(Kb);
}
function D_(r, n) {
  const o = r.$$;
  o.fragment !== null && (gg(o.on_destroy), o.fragment && o.fragment.d(n), o.on_destroy = o.fragment = null, o.ctx = []);
}
function N_(r, n) {
  r.$$.dirty[0] === -1 && (Gh.push(r), M_(), r.$$.dirty.fill(0)), r.$$.dirty[n / 31 | 0] |= 1 << n % 31;
}
function k_(r, n, o, l, h, m, w, g = [-1]) {
  const S = qM;
  cg(r);
  const C = r.$$ = {
    fragment: null,
    ctx: null,
    props: m,
    update: lg,
    not_equal: h,
    bound: TT(),
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(S ? S.$$.context : n.context || []),
    callbacks: TT(),
    dirty: g,
    skip_bound: !1,
    root: n.target || S.$$.root
  };
  w && w(C.root);
  let I = !1;
  if (C.ctx = o ? o(r, n.props || {}, (A, z, ...F) => {
    const j = F.length ? F[0] : z;
    return C.ctx && h(C.ctx[A], C.ctx[A] = j) && (!C.skip_bound && C.bound[A] && C.bound[A](j), I && N_(r, A)), z;
  }) : [], C.update(), I = !0, gg(C.before_update), C.fragment = l ? l(C.ctx) : !1, n.target) {
    if (n.hydrate) {
      const A = C_(n.target);
      C.fragment && C.fragment.l(A), A.forEach(dp);
    } else
      C.fragment && C.fragment.c();
    n.intro && A_(r.$$.fragment), R_(r, n.target, n.anchor, n.customElement), KM();
  }
  cg(S);
}
class __ {
  $destroy() {
    D_(this, 1), this.$destroy = lg;
  }
  $on(n, o) {
    const l = this.$$.callbacks[n] || (this.$$.callbacks[n] = []);
    return l.push(o), () => {
      const h = l.indexOf(o);
      h !== -1 && l.splice(h, 1);
    };
  }
  $set(n) {
    this.$$set && !x_(n) && (this.$$.skip_bound = !0, this.$$set(n), this.$$.skip_bound = !1);
  }
}
function IT(r) {
  let n, o, l, h, m, w, g, S = r[18] && AT(r), C = r[19] && RT(r);
  return {
    c() {
      n = ul("div"), o = ul("div"), S && S.c(), l = Jb(), h = ul("span"), m = xS(r[1]), w = Jb(), C && C.c(), Si(h, "overflow", "hidden"), Si(h, "white-space", "nowrap"), Si(h, "text-overflow", "ellipsis"), Si(h, "max-width", "80px"), Dn(o, "class", r[9]), Si(o, "background-color", r[3]), Si(o, "color", r[10]), Si(o, "opacity", r[12]), Dn(n, "class", g = "netless-window-manager-cursor-name " + r[16] + " " + r[15]);
    },
    m(I, A) {
      yg(I, n, A), vo(n, o), S && S.m(o, null), vo(o, l), vo(o, h), vo(h, m), vo(o, w), C && C.m(o, null);
    },
    p(I, A) {
      I[18] ? S ? S.p(I, A) : (S = AT(I), S.c(), S.m(o, l)) : S && (S.d(1), S = null), A & 2 && JM(m, I[1]), I[19] ? C ? C.p(I, A) : (C = RT(I), C.c(), C.m(o, null)) : C && (C.d(1), C = null), A & 512 && Dn(o, "class", I[9]), A & 8 && Si(o, "background-color", I[3]), A & 1024 && Si(o, "color", I[10]), A & 4096 && Si(o, "opacity", I[12]), A & 98304 && g !== (g = "netless-window-manager-cursor-name " + I[16] + " " + I[15]) && Dn(n, "class", g);
    },
    d(I) {
      I && dp(n), S && S.d(), C && C.d();
    }
  };
}
function AT(r) {
  let n, o;
  return {
    c() {
      n = ul("img"), Dn(n, "class", "netless-window-manager-cursor-selector-avatar"), Dn(n, "style", r[20]()), ug(n.src, o = r[8]) || Dn(n, "src", o), Dn(n, "alt", "avatar");
    },
    m(l, h) {
      yg(l, n, h);
    },
    p(l, h) {
      h & 256 && !ug(n.src, o = l[8]) && Dn(n, "src", o);
    },
    d(l) {
      l && dp(n);
    }
  };
}
function RT(r) {
  let n, o;
  return {
    c() {
      n = ul("span"), o = xS(r[2]), Dn(n, "class", "netless-window-manager-cursor-tag-name"), Si(n, "background-color", r[11]);
    },
    m(l, h) {
      yg(l, n, h), vo(n, o);
    },
    p(l, h) {
      h & 4 && JM(o, l[2]), h & 2048 && Si(n, "background-color", l[11]);
    },
    d(l) {
      l && dp(n);
    }
  };
}
function P_(r) {
  let n, o, l, h, m, w, g, S = !r[14] && IT(r);
  return {
    c() {
      n = ul("div"), S && S.c(), o = Jb(), l = ul("div"), h = ul("img"), Dn(h, "class", m = "netless-window-manager-cursor-" + r[4] + "-image " + r[15]), ug(h.src, w = r[7]) || Dn(h, "src", w), Dn(h, "alt", r[4]), Dn(l, "class", "cursor-image-wrapper"), Dn(n, "class", g = "netless-window-manager-cursor-mid" + (r[13] ? " netless-window-manager-cursor-custom" : "")), Si(n, "transform", "translateX(" + r[5] + "px) translateY(" + r[6] + "px)"), Si(n, "display", r[17]), Dn(n, "data-cursor-uid", r[0]);
    },
    m(C, I) {
      yg(C, n, I), S && S.m(n, null), vo(n, o), vo(n, l), vo(l, h);
    },
    p(C, [I]) {
      C[14] ? S && (S.d(1), S = null) : S ? S.p(C, I) : (S = IT(C), S.c(), S.m(n, o)), I & 32784 && m !== (m = "netless-window-manager-cursor-" + C[4] + "-image " + C[15]) && Dn(h, "class", m), I & 128 && !ug(h.src, w = C[7]) && Dn(h, "src", w), I & 16 && Dn(h, "alt", C[4]), I & 8192 && g !== (g = "netless-window-manager-cursor-mid" + (C[13] ? " netless-window-manager-cursor-custom" : "")) && Dn(n, "class", g), I & 96 && Si(n, "transform", "translateX(" + C[5] + "px) translateY(" + C[6] + "px)"), I & 131072 && Si(n, "display", C[17]), I & 1 && Dn(n, "data-cursor-uid", C[0]);
    },
    i: lg,
    o: lg,
    d(C) {
      C && dp(n), S && S.d();
    }
  };
}
function z_(r, n, o) {
  let l, h, m, w, g, S, C, I, { uid: A } = n, { cursorName: z } = n, { tagName: F } = n, { backgroundColor: j } = n, { appliance: q } = n, { x: Y } = n, { y: fe } = n, { src: se } = n, { visible: Z } = n, { avatar: le } = n, { theme: oe } = n, { color: ke } = n, { cursorTagBackgroundColor: $e } = n, { opacity: ze } = n, { pencilEraserSize: G } = n, { custom: he } = n;
  const be = () => Object.entries({
    width: (l ? 19 : 28) + "px",
    height: (l ? 19 : 28) + "px",
    position: l ? "initial" : "absolute",
    "border-color": l ? "white" : j,
    "margin-right": (l ? 4 : 0) + "px"
  }).map(([ie, ct]) => `${ie}: ${ct}`).join(";");
  return r.$$set = (ie) => {
    "uid" in ie && o(0, A = ie.uid), "cursorName" in ie && o(1, z = ie.cursorName), "tagName" in ie && o(2, F = ie.tagName), "backgroundColor" in ie && o(3, j = ie.backgroundColor), "appliance" in ie && o(4, q = ie.appliance), "x" in ie && o(5, Y = ie.x), "y" in ie && o(6, fe = ie.y), "src" in ie && o(7, se = ie.src), "visible" in ie && o(21, Z = ie.visible), "avatar" in ie && o(8, le = ie.avatar), "theme" in ie && o(9, oe = ie.theme), "color" in ie && o(10, ke = ie.color), "cursorTagBackgroundColor" in ie && o(11, $e = ie.cursorTagBackgroundColor), "opacity" in ie && o(12, ze = ie.opacity), "pencilEraserSize" in ie && o(22, G = ie.pencilEraserSize), "custom" in ie && o(13, he = ie.custom);
  }, r.$$.update = () => {
    r.$$.dirty & 2 && (l = !Xh(z)), r.$$.dirty & 4 && o(19, h = !Xh(F)), r.$$.dirty & 256 && o(18, m = !Xh(le)), r.$$.dirty & 2097152 && o(17, w = Z ? "" : "none"), r.$$.dirty & 16 && o(14, g = q === Nn.laserPointer), r.$$.dirty & 16400 && o(23, S = g || q === Nn.pencilEraser), r.$$.dirty & 8388608 && o(16, C = S ? "netless-window-manager-laserPointer-pencilEraser-offset" : ""), r.$$.dirty & 4194304 && o(15, I = G === 3 ? "netless-window-manager-pencilEraser-3-offset" : "");
  }, [
    A,
    z,
    F,
    j,
    q,
    Y,
    fe,
    se,
    le,
    oe,
    ke,
    $e,
    ze,
    he,
    g,
    I,
    C,
    w,
    m,
    h,
    be,
    Z,
    G,
    S
  ];
}
class O_ extends __ {
  constructor(n) {
    super(), k_(this, n, z_, P_, S_, {
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
const eE = "data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Ccircle cx='12' cy='12' r='2.5' stroke='%23000' stroke-linejoin='square'/%3E%3Ccircle cx='12' cy='12' r='3.5' stroke='%23FFF'/%3E%3C/g%3E%3C/svg%3E";
function tE(r) {
  return `data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Ccircle cx='12' cy='12' r='2.5' stroke='%23${r}' stroke-linejoin='square'/%3E%3Ccircle cx='12' cy='12' r='3.5' stroke='%23${r}'/%3E%3C/g%3E%3C/svg%3E`;
}
function Md(r) {
  return `data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg' fill='none'%3E%3Cpath d='M5 12H19' stroke='%23${r}' stroke-linejoin='round'/%3E%3Cpath d='M12 5V19' stroke='%23${r}' stroke-linejoin='round'/%3E%3C/svg%3E`;
}
function Nu(r) {
  return `url("${r}") 12 12, auto`;
}
function L_(r) {
  let n = "";
  for (const o in r)
    n += `.netless-whiteboard.${o} {cursor: ${r[o]}}
`;
  return n;
}
const Wv = document.createElement("style");
function B_(r) {
  const [n, o, l] = r.strokeColor, h = ((1 << 24) + (n << 16) + (o << 8) + l).toString(16).slice(1);
  return Wv.textContent = L_({
    "cursor-pencil": Nu(tE(h)),
    "cursor-eraser": Nu(eE),
    "cursor-rectangle": Nu(Md(h)),
    "cursor-ellipse": Nu(Md(h)),
    "cursor-straight": Nu(Md(h)),
    "cursor-arrow": Nu(Md(h)),
    "cursor-shape": Nu(Md(h))
  }), document.head.appendChild(Wv), () => {
    Wv.parentNode != null && document.head.removeChild(Wv);
  };
}
const j_ = /* @__PURE__ */ new Set([
  Nn.rectangle,
  Nn.ellipse,
  Nn.straight,
  Nn.arrow,
  Nn.shape
]);
function DT(r, n) {
  if (r === Nn.pencil)
    return tE(n);
  if (r === Nn.eraser)
    return eE;
  if (j_.has(r))
    return Md(n);
}
class V_ {
  constructor(n, o, l, h) {
    this.manager = n, this.memberId = o, this.cursorManager = l, this.wrapper = h, this.style = "default", this.move = (m) => {
      var w;
      if (m.type === "main") {
        const g = this.cursorManager.wrapperRect;
        this.component && g && (this.autoHidden(), this.moveCursor(m, g, this.manager.mainView));
      } else {
        const g = this.cursorManager.focusView, S = (w = g == null ? void 0 : g.divElement) == null ? void 0 : w.getBoundingClientRect(), C = g == null ? void 0 : g.camera;
        g && S && C && this.component && (this.autoHidden(), this.moveCursor(m, S, g));
      }
    }, this.setStyle = (m) => {
      this.style = m, this.component && this.component.$set({
        src: this.getIcon(),
        custom: this.isCustomIcon()
      });
    }, this.leave = () => {
      this.hide();
    }, this.updateMember(), this.createCursor(), this.autoHidden(), this.setStyle(l.style);
  }
  moveCursor(n, o, l) {
    var S, C;
    const { x: h, y: m, type: w } = n, g = l == null ? void 0 : l.screen.convertPointToScreen(h, m);
    if (g) {
      let I = g.x - 2, A = g.y - 18;
      if (this.isCustomIcon() && (I -= 11, A += 4), w === "app") {
        const z = this.cursorManager.wrapperRect;
        z && (I = I + o.x - z.x, A = A + o.y - z.y);
      }
      g.x < 0 || g.x > o.width || g.y < 0 || g.y > o.height ? (S = this.component) == null || S.$set({ visible: !1, x: I, y: A }) : (C = this.component) == null || C.$set({ visible: !0, x: I, y: A });
    }
  }
  get memberApplianceName() {
    var n, o;
    return (o = (n = this.member) == null ? void 0 : n.memberState) == null ? void 0 : o.currentApplianceName;
  }
  get memberColor() {
    var o, l;
    return `rgb(${(l = (o = this.member) == null ? void 0 : o.memberState) == null ? void 0 : l.strokeColor.join(",")})`;
  }
  get memberColorHex() {
    var h, m;
    const [n, o, l] = ((m = (h = this.member) == null ? void 0 : h.memberState) == null ? void 0 : m.strokeColor) || [236, 52, 85];
    return ((1 << 24) + (n << 16) + (o << 8) + l).toString(16).slice(1);
  }
  get payload() {
    var n;
    return (n = this.member) == null ? void 0 : n.payload;
  }
  get memberCursorName() {
    var n, o;
    return ((n = this.payload) == null ? void 0 : n.nickName) || ((o = this.payload) == null ? void 0 : o.cursorName) || this.memberId;
  }
  get memberTheme() {
    var n;
    return (n = this.payload) != null && n.theme ? "netless-window-manager-cursor-inner-mellow" : "netless-window-manager-cursor-inner";
  }
  get memberCursorTextColor() {
    var n;
    return ((n = this.payload) == null ? void 0 : n.cursorTextColor) || "#FFFFFF";
  }
  get memberCursorTagBackgroundColor() {
    var n;
    return ((n = this.payload) == null ? void 0 : n.cursorTagBackgroundColor) || this.memberColor;
  }
  get memberAvatar() {
    var n;
    return (n = this.payload) == null ? void 0 : n.avatar;
  }
  get memberOpacity() {
    return !this.memberCursorName && !this.memberAvatar ? 0 : 1;
  }
  get memberTagName() {
    var n;
    return (n = this.payload) == null ? void 0 : n.cursorTagName;
  }
  autoHidden() {
    this.timer && clearTimeout(this.timer), this.timer = window.setTimeout(() => {
      this.hide();
    }, 1e3 * 10);
  }
  async createCursor() {
    this.member && this.wrapper && (this.component = new O_({
      target: this.wrapper,
      props: this.initProps()
    }));
  }
  initProps() {
    var n;
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
      pencilEraserSize: (n = this.member) == null ? void 0 : n.memberState.pencilEraserSize
    };
  }
  getIcon() {
    var S;
    if (!this.member)
      return;
    const { memberApplianceName: n, memberColorHex: o } = this, { userApplianceIcons: l, applianceIcons: h } = this.cursorManager;
    let m = this.memberApplianceName;
    m === Nn.pencilEraser && (m = `${m}${((S = this.member) == null ? void 0 : S.memberState.pencilEraserSize) || 1}`);
    const w = m && l[m];
    if (w)
      return w;
    if (this.style === "custom" && n) {
      const C = DT(n, o);
      if (C)
        return C;
    }
    return h[m || Nn.shape] || h[Nn.shape];
  }
  isCustomIcon() {
    var w;
    if (!this.member)
      return !1;
    const { memberApplianceName: n, memberColorHex: o } = this, { userApplianceIcons: l } = this.cursorManager;
    let h = this.memberApplianceName;
    return h === Nn.pencilEraser && (h = `${h}${((w = this.member) == null ? void 0 : w.memberState.pencilEraserSize) || 1}`), h && l[h] ? !1 : !!(this.style === "custom" && n && DT(n, o));
  }
  updateMember() {
    return this.member = $b(this.manager.room, this.memberId), this.updateComponent(), this.member;
  }
  updateComponent() {
    var n;
    (n = this.component) == null || n.$set(sS(this.initProps(), ["x", "y"]));
  }
  destroy() {
    this.component && this.component.$destroy(), this.cursorManager.cursorInstances.delete(this.memberId), this.timer && clearTimeout(this.timer);
  }
  hide() {
    this.component && (this.component.$set({ visible: !1 }), this.destroy());
  }
}
const U_ = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAA0CAYAAADFeBvrAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAYISURBVHgB7ZpNSCtXFIBPEuvz+dMGpYUKD/sWFX+Qti6kK7Hqpm6e9q0rIoIUFUShPLV10VZx4+JZqa9v20LBhdq9fyBUCtKNPH8qYl2IOw3G38Rkek4y15y5uTOZJDOWggcOSSYzN/ebc+45554JwIM8iBCPyTEP+86T4vyMfsRN4b+nQTKIJp0vzuGvlpID7os8EQNEIBD4oKio6Bm9DwaDv/v9/n/076JgbtWUYPchwrW8qD7UnOvr6wFNkpubm+/wu7f0c7y6mrnlvQufxB0Iau7V1dX3BDA/P6/V1dVpzc3N2uLiIofK1c8VYHys/wRKBUN3/hGHqaysNOjc3FwMis6hc0FtLTHuvYLxCCZgci8uLn4wg5Gh6Fy8Jk+/NkcCAlAAuUkoW4g0B+d5tLS05O/r67O8eGxsDNra2uDy8nKsoKCAwCIQDxQa0yTxgrvCYXyTk5Ml+Orf2dlJeeHIyAigFSE/P38ELfUNqNdSkjgF5FF89jL1TU1NlQwODl5gZPujp6cHWltbUw7Koc7Pz8mkZpHPFeFrJuZeqLnoMoPoZqe0JjDP/IZgnyLUG/o8NDRkuo5Ua2pjY6MC4oFCFf1cA0oKzRSOp6enRfTaGh0d/QxBt+1CUVgnOTs7+xrHfQzGyOcKkK3QTJMnQffZ6e/v/xwttmsHqqmpKXbdycnJCxy7ABLh3FEgVZ6hZJhnFZoFFMF0d3c/w7v+dyookXBnZ2c/xvHfhriVcvXfdBRItsxjnOhYqjwjoAimq6vrCysoGofk+Ph4Esd/F/UdiFtJAGUd2DygTpp5dmBUUJ2dnc9VUALm8PDwJY7/BPU9VD8k3M4RC6kskxZMKigKIMLN9vf3p3H8DyWgfEhEOwOQD9IXOTz7EObbwsLC4YWFBRgeHrY9ECXYo6MjaGlpKWlsbPxkYGDgRW1tbSEWquVlZWXBzc3Nl1VVVa8hXiXc6ioqBqGaPDk7AACJTRZ3NS9lcUp86cJwoSQ7Pj4Op6enfxUXF3/V0NCQv7q6GsCvwrqGUG/01xAD4+VQTOxaSF43d5bBOisrGBJRCtXX17+/trb268rKSgASFgmz97KFkmo6OztWuVyPweiWGc4WRkhFRQVEIpHg8vJyQAIQVlLBROVxvBYQHsXnO8tk62ZcyN0wecLBwcEvYHSzEPscBqOLCRhLC4n9uqaA8UAWAcAKhtbQ3t7eTHl5+Y9gtAp3twhT056CDMQ7MRzIFTeTYKb1yYYVQFH9VdzsqNmYKpfTJBDX3Ixgdnd3XyHMT2AMALJlBBSPaMpNngrIsTyTCgaj288YDGakictrxizvKFNOjgSSBLS+vv6UYHDb7DgMVgsChjTEgCIKGG4ZU+EWkgNBzN1qamq+pAMTExPgFMzW1tZrhHkFyWE5KxgSszx0527RaDRmOSpRshEOU11dPQPG8CwHARHJlMnTSrwSRFIlfXt7m3V5ngJGuJtqzaQtZkFBVNJezN5ZAdmwjKo2k9tVtrcI3OXk4tPgcg7ChCDZ1URgMOu72Xa5VFHOkymQhWVU60YVmjN6wiC7k6p+S1syCACOwJBYFaexV+yhBekNPsMBO6KAEeE4BMaCU67RsoYhSbXgaT//ht709vZCaWmp6YkEbLFmVJWzas04+iBL7EKpm0J7duqu0B7+CTUpNJuyvb1NCfMj1CqI9wLKUOlOUMeG+gGFkHii4HizUF4z/KFUrPsJ8WbEIyx7nnZ0dDynME6BAuce09iFHo+GrnmGltltb2//E4wVAN82y7vOjKOZXSBhJdHNiT3TYWD8OY2PTUJkdd7MkJMnT5wZVQF2RFX6yBMUdzPMvvfqxz3sXHF+GNT9ANXit/10O1sgHkZvdQAOKvs9B5L7ARELGAAXLSTvM8QExTE+YbHe+HURhZp1aRyF4CJXClbbWwGketgkW9VsY+YaiBCVhfgE+XvxRwgZSM4jUVCDZFQ9pytmXR8hUTB2gnidx4XffVWydN0yQjwmx/jkAZJBrIBI5J7ZvQGZWUgVSuU/EqmOAzicKNMVu816DdRWUV1/7xAP8n+SfwF3Du3NF2sYhwAAAABJRU5ErkJggg==", H_ = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADEAAAAxCAYAAABznEEcAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAZoSURBVHgB7VlLSCRXFL3ljNEhEXTGhMQJmOjCz8ZNVLKICz9xIYhCNi7UgINkGEk2En8hW5cBUQNxo05GAoKikuCAmvGzGMdPcCUGjDPxD/4Vv/3JvWW97luvq7ur+hMZ8MKlqrteNfe8e965970GuLVbC5kpJr53+hjHx9yY3TUxJgLMAQG4ITARfp5T4Mri4uL9q6urnxwOxz/oY5eXl1/Pzs7e195X2FX4jZsIhAK7gx5ps9m6nGj9/f3OtbU1pzAE0318fPwVjYHrrN7R3AjU/wpOBwA9Cmf/9ejoqDMtLU31iooKGdA+ATo4OMiXAEWAHhBAGEApXj4rPAik0vPt7e0vCgoKPH4gMzMTSktLIS8vD2JiYgABvcHMTZyennbHxsaOg3udOJmLzwqEYB0ZgRCZENm4u7e39yQuLq65srISZmZmvP5Ybm4u5OfnQ0lJyXWUCAgzNLS+vt6SnJz8WgvYwV5xSlcRgyVg3ha2Dkxzc3MvfZmVlQW+bGxsDBobGyE7O1u94uJPjIqKqklKSvrbbrfPnp+ff7e8vJwMnlSTKWfJjDKhywJo6wLp0YcZ+dyIUr7s4cOHLsrRlQwBTSBFuzc2NiZYhjjVAIyzZBqEwgCQv0OOM/gNzuiP/ijlDxBRjgClpqa6AF1cXDydmpoaLCws3JcAGYHyC4JMzoKaibKysvienp6FtrY2IA/WCFB5ebkqCHSvARo8Ozt7igIxwIJ2gJ+seFMnDoIyEUV+dHT0G3qWVUr5M043DdAB0m2IKZwAYpgZX+qkywR6NFbuR0iDxmAoZRUQKRxSLTMnJ8eIaqqSeVMnIYUOdu+sq6vrp4f+VCoYo8khZaNs01VRlERUu2/BrWAA7sl2Anink1Ao18JGjyY/PDx8hq1GZqgp5c2mp6chMjLy2b179x7hRzvoqeUUwXIzqq4O5nZsNUaEbIbLqPLTou/s7FTvT05OpsA9sXJG1AVsZDwjutqBIN6gUlWjxod8XRBNKXgsrqpqYZfwEqX9h8TExD7wbFm8LmzxHQ0QHSlXKZVSqFC/hkqlaKapTaGgCQTK7PHW1lb/wsLC86KiokkccoV+qV1tcE0pO7AWxmhTxBszDzqRr66ujqanp2cRpQLNBgUsCh8BwQ54bn5+/s+mpqa+4eHhfS1gb52vwuP0trPjhSZCBtLQ0NA3MDDQQIFYAUHBYhuvzjpVbJr1lZWVP3p7e19UVVXNgHumXYrI4uBx6Yqevz02b0FcRQ8CoBQF3dXVpQLZ3d39C7n+ora29vfJyclDYFnWgFyxK3cxhss/+KoT/N6DVkQpKypFGUCp3Ozo6HgSHx//GLW/BwHsg57zl5pzADajwLn52mPL1ZHPloMoRYPMFL6EhAR18e7s7MxVV1fPsAAp4Avteq7dC/c1+wKI4g+EfGzDM+EYHBw8RDrNiA2QL6upqVGvKJ2/gHu2L1nA5wwEB2YDfSYMO1x/px0cgEc2zBY+eo67u6H29vZ/wU2VC8l58JxKNjDOgojNEp08aFVfX++3l6JMEdDx8fEB0FNIBsDXBc8ArwuW1EkeI1RKdLWmCx+1DhkZGRvR0dFfSsHKxYtnW0iqvJAN9xNm6MR/QO5sfapUSkqKmqW5ubmfwVgyZdpw/vPZl2kUEAinBMSUStG+gwra0NDQSynQKyloIxnlewafjDFLJzLRBJqiFMnqyMgIbG5uDuD996Dnv8iAPOMAPmbcm5lVJwA/vZRMKZGZlpaWVtAvUL4GZMqE1fjRJrUd76LHoX+InlhcXPwZnWW2tra6jjrpiBM3UK/weQr6J+gfodMh9HtwncG7YLA3CMSsLmxx5WuDCt8B7vZeicInTjCWlpb6wc15mfey7oc9E8LElpVmMgb9AXoC+qcTExOPKRu4NlTHs6Q10GfhgfYOvRsJQZ76BWMKuDtaolQs+gfoH6Mn436gDg+e+5BKXUQx/C5Je/a+NpbeiQJPKgUdlNXx/BCBKxVdxW5Q0I3XBqFKRhU4KLtjYawi3csuTKdc4FnIXNvKUJkVEGRG20QZAAUpA5DbaYAQLmQzfzxyk/ffdnCD4NWVnGdE7kQBQvQHC5lVEDxgMaM29lkxGCNLKrDnIbFAMkFmBIaDkHstU41coGZ1TZD5UjReCGUAYbNgdNqoXZB/T67yYbFAMiGML3BhYeH8rb0t9h/zgcTBcTNGiQAAAABJRU5ErkJggg==", W_ = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAA0CAYAAADFeBvrAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAgrSURBVHgB7ZprTBRXFIDP7gIt8lQppTwE5V0KaAn6o1pqNGkDDTEmTUhsgKRp+gNJw68CFkLbVC2QkDS+gD8KJdWmARvbFBNNWpuIRGPFWBXQRMPDqIki+KLATs+ZnTvcvXtnX8w2beJJToaduTP3fHPOPffcOwC8kP+2WCDwIvahGFxTuN8KmNSZmULPNjLeqF9F8rdPkIEGEn+r+vjx46LQ0NA8/Dsader58+e/h4WFDWntFO7ot6fMFAt3JLWi2lCDpqamCux2+2+KROj82NhYGrXT2lu5Z/DP/deFByElA4Pv3LlTiHY/nJ6eVnbv3q1s2bJFyc7OVrZu3arU1dUp4+PjxPUQoT+g9tp9PkMFgpo9kxljHRoaWp2Xl3duYmIiurKyEvDoclNCQgIcPnxYPc7MzHwcGRnZhaft4Ag7O9fUbRhaITCie4lgcnNzT7qDIaHz27dvh+vXr0NEREQneqoCHKFnAR+8ZCaQGGq2CxcurCGYycnJZHcwTNAzUFFRoUJFRUV1IFQ5OKBsXB9uxSwgl0TQ3d29Yt26dccwoyVXV1d7hGEiQmGi2AzOUHx/hob4K2yuYS9G987s7OwPISEh7xPM6dOnwVfBsIMjR45AZmbmo5s3b76Xnp7+J55egMVxBSAZT0v1ED+76yn66dOnLQSzd+9ev2BIyFP0MjBco1JTU/sxfFeDazp3cYgZHmKqdoaGNISHh9fv378fSJcqlPV6e3sBJ+I/goOD34VFL0k95Y+HxPHCYGxmw5DQ2NuzZw8EBQVtunXr1jvgwUP+hhz/QDXMMCNVE8zx48dNg2FCz6QQjI2N/RA8VBFmANnu3btXihnpG8pM9fX1EAi5du0aeWkVOAMBCF7yN+R0z4yOjq6NiYlpp9CgdBtIwXpPH6vgDKWLt0CygtM6MDCwBuUYZSKaOCksAiVY9wFOBePgDOOytPAGSKzNVCCC2bBhw69YdK7ypgpYimzbtk2dl7CM+hFcveOUHDylbTFO1YdhFbByx44dA1QFUP0VSJj4+Hjo6+sDq9U6iEmHKvFZTedQ50GYbN15SITVlwNlZWUnLRZL8s6dOwMOQ9UCTtKTra2ttdppt9V2kMF5cbmsjxuM43bMNrmUzc6fP6+GQiDGDoOJi4ubwb4qm5ubafyIE6nLxGqTPEsGo1cBOGNX0TyDYafC0CyOaxcVziyh53Z2dkJycvLMvn37PmpoaBgFR4jxYSbWdVIgI89Iq4CjR48CZjlYv369+tssqI6ODsjPz4f+/v668vLycxrEHHfkYdwC8SB6mGEV8Cl64cuuri5oa2tTG+EyGjZu3AiXLl1qefDgwV8lJSUFZkDV1tZCcXExXLx4sbWoqKgPFj0zx8GI9ZwO5W4M6ekZYeqpaqbqmaSqqkpNpcPDw4dwzfM9nrLduHEjEs+X0XV/Sx96LnqE1kLtBQUF3eDwCO8dGQyzV5rl+JyuegfXI29jRotiRlKnpFghHMzKyjqotVXS0tLacKPjF3bdHxjSq1evduAkepAD+ZsDYlC8V5w8ZBVg+PPq2MGMlkInqE4joTf45MmT4YyMjAPcA+ltLSQlJX2BafxnX6HI29QeK44TOTk57mCYZ0QoJ8OBM4yB6dkNkwGlSygsLFQvYtYB3BTMxFL+M+0eFgZqp4mJiU2+QKGX1fGIk/QIrn0aYXGsyDxjmAyMhO2jhaCGoUbX1NSkLSwsPMJqV8Fspu6lIZS6OYhjiOLwdU7fQM1HfRPD7wS1obZ0j0xpb4726Z49ezaJf2/S7s9ATUGNR41BjdJseRnke3WGwhrRTS9pD1mOGoeG15BxOOfoxuCkp0Ih6NeaEaSZGlieJyiCoc1FgsGldokGk8nBvAKOrWIGQ5uPsm0tt0BWDiicAaGuGhkZ+YqMw9StGzU4OKhCnT179hNsswY1FTXdE5QEJhc1S3tGogazXLOBwQSBl3tzIhQPtAL1VQJCTcNx8y1vHIUghSKFZE9PT7H2dlM1b+Wgrr1y5Uq77J75+fnplpaWMg2ch4nlYEI5z7hdensDpI4hrYNErcMMXJ32koG4ztf3pultz83NjWG99Ra2WQ0OL2VjZjwgeufUqVOqV8+cOdPIwdBLSNJeHg8TAh5WqJ6EfSmgt7IMNRJ1JThiOlnrOAMHshprmMKdoGSCpb9s3B3SYLIFGIqICJB7xisYi+RvfiypXw40DWGdlJaWRmMd141hk8V2OWm7ieYTXhBc3+BgaZyqAISjOYxSMVvXsBTNlzdiNQDgRao2AtK3pjggpmrqbGpqSsLPIN/dv38/gaBwUjTshMHcvn27JyUlpRmc5xpPMD599LIYnLNyUKKndKjGxsakXbt2deMCLIE8IVvs0YRM1fjdu3d/wrXN5+BcnzEgvor2uN3rjzAYMp5lPEoQlE5fA0fWo8GfhlCbKVFQ1pKNIfzcOHH58mWqaimVUwJI0+6n59D4pIlzmdZPMPiZzXjDjX47Le5g0Uu8x2zgPqWyKpjVe7x3+AUbq9NYjQbgp2dsBud5o8TP7d5kHAWcQchQfoEmLgn8HjOiBIF7o5hI1x6CEbLNP3bdqYAF44JzyWLzcN1i8DcT/o3awbm8Fz3DAy2A62INwPV/E3wWdx5inmBHuwChCBD6R2JwHge80TIQRQLjt7e8DTkGZgfX8cUMZTDAteFDkveaIlzjX9ySQs8X18r2t2VHUURPKoICmDR+eCO9aSdmOIub3/w9RgpgUpiJhvraXpa6jZKHGEqyusw0GLFzX+5RhN/8kYnMSNMMfyH/V/kHST6OYVElTPAAAAAASUVORK5CYII=", F_ = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNDBweCIgaGVpZ2h0PSI0MHB4IiB2aWV3Qm94PSIwIDAgNDAgNDAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDYwLjEgKDg4MTMzKSAtIGh0dHBzOi8vc2tldGNoLmNvbSAtLT4KICAgIDx0aXRsZT5zaGFwZS1jdXJzb3I8L3RpdGxlPgogICAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CiAgICA8ZGVmcz4KICAgICAgICA8cGF0aCBkPSJNMjAsMjEuNSBDMjAuMjQ1NDU5OSwyMS41IDIwLjQ0OTYwODQsMjEuNjc2ODc1MiAyMC40OTE5NDQzLDIxLjkxMDEyNDQgTDIwLjUsMjIgTDIwLjUsMjcgQzIwLjUsMjcuMjc2MTQyNCAyMC4yNzYxNDI0LDI3LjUgMjAsMjcuNSBDMTkuNzU0NTQwMSwyNy41IDE5LjU1MDM5MTYsMjcuMzIzMTI0OCAxOS41MDgwNTU3LDI3LjA4OTg3NTYgTDE5LjUsMjcgTDE5LjUsMjIgQzE5LjUsMjEuNzIzODU3NiAxOS43MjM4NTc2LDIxLjUgMjAsMjEuNSBaIE0yNywxOS41IEMyNy4yNzYxNDI0LDE5LjUgMjcuNSwxOS43MjM4NTc2IDI3LjUsMjAgQzI3LjUsMjAuMjQ1NDU5OSAyNy4zMjMxMjQ4LDIwLjQ0OTYwODQgMjcuMDg5ODc1NiwyMC40OTE5NDQzIEwyNywyMC41IEwyMiwyMC41IEMyMS43MjM4NTc2LDIwLjUgMjEuNSwyMC4yNzYxNDI0IDIxLjUsMjAgQzIxLjUsMTkuNzU0NTQwMSAyMS42NzY4NzUyLDE5LjU1MDM5MTYgMjEuOTEwMTI0NCwxOS41MDgwNTU3IEwyMiwxOS41IEwyNywxOS41IFogTTE4LDE5LjUgQzE4LjI3NjE0MjQsMTkuNSAxOC41LDE5LjcyMzg1NzYgMTguNSwyMCBDMTguNSwyMC4yNDU0NTk5IDE4LjMyMzEyNDgsMjAuNDQ5NjA4NCAxOC4wODk4NzU2LDIwLjQ5MTk0NDMgTDE4LDIwLjUgTDEzLDIwLjUgQzEyLjcyMzg1NzYsMjAuNSAxMi41LDIwLjI3NjE0MjQgMTIuNSwyMCBDMTIuNSwxOS43NTQ1NDAxIDEyLjY3Njg3NTIsMTkuNTUwMzkxNiAxMi45MTAxMjQ0LDE5LjUwODA1NTcgTDEzLDE5LjUgTDE4LDE5LjUgWiBNMjAsMTIuNSBDMjAuMjQ1NDU5OSwxMi41IDIwLjQ0OTYwODQsMTIuNjc2ODc1MiAyMC40OTE5NDQzLDEyLjkxMDEyNDQgTDIwLjUsMTMgTDIwLjUsMTggQzIwLjUsMTguMjc2MTQyNCAyMC4yNzYxNDI0LDE4LjUgMjAsMTguNSBDMTkuNzU0NTQwMSwxOC41IDE5LjU1MDM5MTYsMTguMzIzMTI0OCAxOS41MDgwNTU3LDE4LjA4OTg3NTYgTDE5LjUsMTggTDE5LjUsMTMgQzE5LjUsMTIuNzIzODU3NiAxOS43MjM4NTc2LDEyLjUgMjAsMTIuNSBaIiBpZD0icGF0aC0xIj48L3BhdGg+CiAgICAgICAgPGZpbHRlciB4PSItNjQuNiUiIHk9Ii01OS41JSIgd2lkdGg9IjIyOS4zJSIgaGVpZ2h0PSIyNDYuMSUiIGZpbHRlclVuaXRzPSJvYmplY3RCb3VuZGluZ0JveCIgaWQ9ImZpbHRlci0yIj4KICAgICAgICAgICAgPGZlTW9ycGhvbG9neSByYWRpdXM9IjEiIG9wZXJhdG9yPSJkaWxhdGUiIGluPSJTb3VyY2VBbHBoYSIgcmVzdWx0PSJzaGFkb3dTcHJlYWRPdXRlcjEiPjwvZmVNb3JwaG9sb2d5PgogICAgICAgICAgICA8ZmVPZmZzZXQgZHg9IjAiIGR5PSIyIiBpbj0ic2hhZG93U3ByZWFkT3V0ZXIxIiByZXN1bHQ9InNoYWRvd09mZnNldE91dGVyMSI+PC9mZU9mZnNldD4KICAgICAgICAgICAgPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMyIgaW49InNoYWRvd09mZnNldE91dGVyMSIgcmVzdWx0PSJzaGFkb3dCbHVyT3V0ZXIxIj48L2ZlR2F1c3NpYW5CbHVyPgogICAgICAgICAgICA8ZmVDb21wb3NpdGUgaW49InNoYWRvd0JsdXJPdXRlcjEiIGluMj0iU291cmNlQWxwaGEiIG9wZXJhdG9yPSJvdXQiIHJlc3VsdD0ic2hhZG93Qmx1ck91dGVyMSI+PC9mZUNvbXBvc2l0ZT4KICAgICAgICAgICAgPGZlQ29sb3JNYXRyaXggdmFsdWVzPSIwIDAgMCAwIDAgICAwIDAgMCAwIDAgICAwIDAgMCAwIDAgIDAgMCAwIDAuMTYgMCIgdHlwZT0ibWF0cml4IiBpbj0ic2hhZG93Qmx1ck91dGVyMSI+PC9mZUNvbG9yTWF0cml4PgogICAgICAgIDwvZmlsdGVyPgogICAgPC9kZWZzPgogICAgPGcgaWQ9Iumhtemdoi00IiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8ZyBpZD0iV2hpdGVib2FyZC1HdWlkZWxpbmVzIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMzQ0LjAwMDAwMCwgLTc1MS4wMDAwMDApIj4KICAgICAgICAgICAgPGcgaWQ9InNoYXBlLWN1cnNvciIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzQ0LjAwMDAwMCwgNzUxLjAwMDAwMCkiPgogICAgICAgICAgICAgICAgPHJlY3QgaWQ9IuefqeW9ouWkh+S7vS00NCIgZmlsbD0iI0ZGRkZGRiIgb3BhY2l0eT0iMC4wMSIgeD0iMCIgeT0iMCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMiI+PC9yZWN0PgogICAgICAgICAgICAgICAgPGcgaWQ9IuW9oueKtue7k+WQiCIgZmlsbC1ydWxlPSJub256ZXJvIj4KICAgICAgICAgICAgICAgICAgICA8dXNlIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjEiIGZpbHRlcj0idXJsKCNmaWx0ZXItMikiIHhsaW5rOmhyZWY9IiNwYXRoLTEiPjwvdXNlPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIxIiBkPSJNMjAsMjEgQzIwLjQ4NTQxMDMsMjEgMjAuODk4MDg1LDIxLjM0Nzk5OTMgMjAuOTg5OTQ3OSwyMS44NjU0ODc3IEwyMSwyMiBMMjEsMjcgQzIxLDI3LjU1MjI4NDcgMjAuNTUyMjg0NywyOCAyMCwyOCBDMTkuNTE0NTg5NywyOCAxOS4xMDE5MTUsMjcuNjUyMDAwNyAxOS4wMTAwNTIxLDI3LjEzNDUxMjMgTDE5LDI3IEwxOSwyMiBDMTksMjEuNDQ3NzE1MyAxOS40NDc3MTUzLDIxIDIwLDIxIFogTTI3LDE5IEMyNy41NTIyODQ3LDE5IDI4LDE5LjQ0NzcxNTMgMjgsMjAgQzI4LDIwLjQ4NTQxMDMgMjcuNjUyMDAwNywyMC44OTgwODUgMjcuMTM0NTEyMywyMC45ODk5NDc5IEwyNywyMSBMMjIsMjEgQzIxLjQ0NzcxNTMsMjEgMjEsMjAuNTUyMjg0NyAyMSwyMCBDMjEsMTkuNTE0NTg5NyAyMS4zNDc5OTkzLDE5LjEwMTkxNSAyMS44NjU0ODc3LDE5LjAxMDA1MjEgTDIyLDE5IEwyNywxOSBaIE0xOCwxOSBDMTguNTUyMjg0NywxOSAxOSwxOS40NDc3MTUzIDE5LDIwIEMxOSwyMC40ODU0MTAzIDE4LjY1MjAwMDcsMjAuODk4MDg1IDE4LjEzNDUxMjMsMjAuOTg5OTQ3OSBMMTgsMjEgTDEzLDIxIEMxMi40NDc3MTUzLDIxIDEyLDIwLjU1MjI4NDcgMTIsMjAgQzEyLDE5LjUxNDU4OTcgMTIuMzQ3OTk5MywxOS4xMDE5MTUgMTIuODY1NDg3NywxOS4wMTAwNTIxIEwxMywxOSBMMTgsMTkgWiBNMjAsMTIgQzIwLjQ4NTQxMDMsMTIgMjAuODk4MDg1LDEyLjM0Nzk5OTMgMjAuOTg5OTQ3OSwxMi44NjU0ODc3IEwyMSwxMyBMMjEsMTggQzIxLDE4LjU1MjI4NDcgMjAuNTUyMjg0NywxOSAyMCwxOSBDMTkuNTE0NTg5NywxOSAxOS4xMDE5MTUsMTguNjUyMDAwNyAxOS4wMTAwNTIxLDE4LjEzNDUxMjMgTDE5LDE4IEwxOSwxMyBDMTksMTIuNDQ3NzE1MyAxOS40NDc3MTUzLDEyIDIwLDEyIFoiIGZpbGw9IiMyMTIzMjQiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PC9wYXRoPgogICAgICAgICAgICAgICAgPC9nPgogICAgICAgICAgICAgICAgPHJlY3QgaWQ9IuefqeW9oiIgZmlsbD0iI0ZGRkZGRiIgeD0iMTguNSIgeT0iMTciIHdpZHRoPSIzIiBoZWlnaHQ9IjYiPjwvcmVjdD4KICAgICAgICAgICAgICAgIDxyZWN0IGlkPSLnn6nlvaIiIGZpbGw9IiNGRkZGRkYiIHg9IjE3IiB5PSIxOC41IiB3aWR0aD0iNiIgaGVpZ2h0PSIzIj48L3JlY3Q+CiAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMjAsMjEuNSBDMjAuMjQ1NDU5OSwyMS41IDIwLjQ0OTYwODQsMjEuNjc2ODc1MiAyMC40OTE5NDQzLDIxLjkxMDEyNDQgTDIwLjUsMjIgTDIwLjUsMjcgQzIwLjUsMjcuMjc2MTQyNCAyMC4yNzYxNDI0LDI3LjUgMjAsMjcuNSBDMTkuNzU0NTQwMSwyNy41IDE5LjU1MDM5MTYsMjcuMzIzMTI0OCAxOS41MDgwNTU3LDI3LjA4OTg3NTYgTDE5LjUsMjcgTDE5LjUsMjIgQzE5LjUsMjEuNzIzODU3NiAxOS43MjM4NTc2LDIxLjUgMjAsMjEuNSBaIE0yNywxOS41IEMyNy4yNzYxNDI0LDE5LjUgMjcuNSwxOS43MjM4NTc2IDI3LjUsMjAgQzI3LjUsMjAuMjQ1NDU5OSAyNy4zMjMxMjQ4LDIwLjQ0OTYwODQgMjcuMDg5ODc1NiwyMC40OTE5NDQzIEwyNywyMC41IEwyMiwyMC41IEMyMS43MjM4NTc2LDIwLjUgMjEuNSwyMC4yNzYxNDI0IDIxLjUsMjAgQzIxLjUsMTkuNzU0NTQwMSAyMS42NzY4NzUyLDE5LjU1MDM5MTYgMjEuOTEwMTI0NCwxOS41MDgwNTU3IEwyMiwxOS41IEwyNywxOS41IFogTTE4LDE5LjUgQzE4LjI3NjE0MjQsMTkuNSAxOC41LDE5LjcyMzg1NzYgMTguNSwyMCBDMTguNSwyMC4yNDU0NTk5IDE4LjMyMzEyNDgsMjAuNDQ5NjA4NCAxOC4wODk4NzU2LDIwLjQ5MTk0NDMgTDE4LDIwLjUgTDEzLDIwLjUgQzEyLjcyMzg1NzYsMjAuNSAxMi41LDIwLjI3NjE0MjQgMTIuNSwyMCBDMTIuNSwxOS43NTQ1NDAxIDEyLjY3Njg3NTIsMTkuNTUwMzkxNiAxMi45MTAxMjQ0LDE5LjUwODA1NTcgTDEzLDE5LjUgTDE4LDE5LjUgWiBNMjAsMTIuNSBDMjAuMjQ1NDU5OSwxMi41IDIwLjQ0OTYwODQsMTIuNjc2ODc1MiAyMC40OTE5NDQzLDEyLjkxMDEyNDQgTDIwLjUsMTMgTDIwLjUsMTggQzIwLjUsMTguMjc2MTQyNCAyMC4yNzYxNDI0LDE4LjUgMjAsMTguNSBDMTkuNzU0NTQwMSwxOC41IDE5LjU1MDM5MTYsMTguMzIzMTI0OCAxOS41MDgwNTU3LDE4LjA4OTg3NTYgTDE5LjUsMTggTDE5LjUsMTMgQzE5LjUsMTIuNzIzODU3NiAxOS43MjM4NTc2LDEyLjUgMjAsMTIuNSBaIiBpZD0i5b2i54q257uT5ZCIIiBmaWxsPSIjMjEyMzI0IiBmaWxsLXJ1bGU9Im5vbnplcm8iPjwvcGF0aD4KICAgICAgICAgICAgPC9nPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+", $_ = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNDdweCIgaGVpZ2h0PSI0MHB4IiB2aWV3Qm94PSIwIDAgNDcgNDAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDYwLjEgKDg4MTMzKSAtIGh0dHBzOi8vc2tldGNoLmNvbSAtLT4KICAgIDx0aXRsZT50ZXh0LWN1cnNvcjwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPgogICAgICAgIDxwYXRoIGQ9Ik0xNiwyNi41IEMxNS43MjM4NTc2LDI2LjUgMTUuNSwyNi4yNzYxNDI0IDE1LjUsMjYgQzE1LjUsMjUuNzU0NTQwMSAxNS42NzY4NzUyLDI1LjU1MDM5MTYgMTUuOTEwMTI0NCwyNS41MDgwNTU3IEwxNiwyNS41IEwxOS41LDI1LjUgTDE5LjUsMTQuNSBMMTYsMTQuNSBDMTUuNzIzODU3NiwxNC41IDE1LjUsMTQuMjc2MTQyNCAxNS41LDE0IEMxNS41LDEzLjc1NDU0MDEgMTUuNjc2ODc1MiwxMy41NTAzOTE2IDE1LjkxMDEyNDQsMTMuNTA4MDU1NyBMMTYsMTMuNSBMMjQsMTMuNSBDMjQuMjc2MTQyNCwxMy41IDI0LjUsMTMuNzIzODU3NiAyNC41LDE0IEMyNC41LDE0LjI0NTQ1OTkgMjQuMzIzMTI0OCwxNC40NDk2MDg0IDI0LjA4OTg3NTYsMTQuNDkxOTQ0MyBMMjQsMTQuNSBMMjAuNSwxNC41IEwyMC41LDI1LjUgTDI0LDI1LjUgQzI0LjI3NjE0MjQsMjUuNSAyNC41LDI1LjcyMzg1NzYgMjQuNSwyNiBDMjQuNSwyNi4yNDU0NTk5IDI0LjMyMzEyNDgsMjYuNDQ5NjA4NCAyNC4wODk4NzU2LDI2LjQ5MTk0NDMgTDI0LDI2LjUgTDE2LDI2LjUgWiIgaWQ9InBhdGgtMSI+PC9wYXRoPgogICAgICAgIDxmaWx0ZXIgeD0iLTI4NC4wJSIgeT0iLTgxLjUlIiB3aWR0aD0iNjY4LjElIiBoZWlnaHQ9IjI5My45JSIgZmlsdGVyVW5pdHM9Im9iamVjdEJvdW5kaW5nQm94IiBpZD0iZmlsdGVyLTIiPgogICAgICAgICAgICA8ZmVNb3JwaG9sb2d5IHJhZGl1cz0iMSIgb3BlcmF0b3I9ImRpbGF0ZSIgaW49IlNvdXJjZUFscGhhIiByZXN1bHQ9InNoYWRvd1NwcmVhZE91dGVyMSI+PC9mZU1vcnBob2xvZ3k+CiAgICAgICAgICAgIDxmZU9mZnNldCBkeD0iMCIgZHk9IjIiIGluPSJzaGFkb3dTcHJlYWRPdXRlcjEiIHJlc3VsdD0ic2hhZG93T2Zmc2V0T3V0ZXIxIj48L2ZlT2Zmc2V0PgogICAgICAgICAgICA8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIzIiBpbj0ic2hhZG93T2Zmc2V0T3V0ZXIxIiByZXN1bHQ9InNoYWRvd0JsdXJPdXRlcjEiPjwvZmVHYXVzc2lhbkJsdXI+CiAgICAgICAgICAgIDxmZUNvbXBvc2l0ZSBpbj0ic2hhZG93Qmx1ck91dGVyMSIgaW4yPSJTb3VyY2VBbHBoYSIgb3BlcmF0b3I9Im91dCIgcmVzdWx0PSJzaGFkb3dCbHVyT3V0ZXIxIj48L2ZlQ29tcG9zaXRlPgogICAgICAgICAgICA8ZmVDb2xvck1hdHJpeCB2YWx1ZXM9IjAgMCAwIDAgMCAgIDAgMCAwIDAgMCAgIDAgMCAwIDAgMCAgMCAwIDAgMC4xNiAwIiB0eXBlPSJtYXRyaXgiIGluPSJzaGFkb3dCbHVyT3V0ZXIxIj48L2ZlQ29sb3JNYXRyaXg+CiAgICAgICAgPC9maWx0ZXI+CiAgICA8L2RlZnM+CiAgICA8ZyBpZD0i6aG16Z2iLTQiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxnIGlkPSJXaGl0ZWJvYXJkLUd1aWRlbGluZXMiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zODguMDAwMDAwLCAtNjcyLjAwMDAwMCkiPgogICAgICAgICAgICA8ZyBpZD0idGV4dC1jdXJzb3IiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDM5Mi4wMDAwMDAsIDY3Mi4wMDAwMDApIj4KICAgICAgICAgICAgICAgIDxyZWN0IGlkPSLnn6nlvaLlpIfku70tNDAiIGZpbGw9IiNGRkZGRkYiIG9wYWNpdHk9IjAuMDEiIHg9IjAiIHk9IjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcng9IjIiPjwvcmVjdD4KICAgICAgICAgICAgICAgIDxnIGlkPSLlvaLnirbnu5PlkIgiIGZpbGwtcnVsZT0ibm9uemVybyI+CiAgICAgICAgICAgICAgICAgICAgPHVzZSBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIxIiBmaWx0ZXI9InVybCgjZmlsdGVyLTIpIiB4bGluazpocmVmPSIjcGF0aC0xIj48L3VzZT4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMSIgZD0iTTE5LDI1IEwxOSwxNSBMMTYsMTUgQzE1LjQ0NzcxNTMsMTUgMTUsMTQuNTUyMjg0NyAxNSwxNCBDMTUsMTMuNTE0NTg5NyAxNS4zNDc5OTkzLDEzLjEwMTkxNSAxNS44NjU0ODc3LDEzLjAxMDA1MjEgTDE2LDEzIEwyNCwxMyBDMjQuNTUyMjg0NywxMyAyNSwxMy40NDc3MTUzIDI1LDE0IEMyNSwxNC40ODU0MTAzIDI0LjY1MjAwMDcsMTQuODk4MDg1IDI0LjEzNDUxMjMsMTQuOTg5OTQ3OSBMMjQsMTUgTDIxLDE1IEwyMSwyNSBMMjQsMjUgQzI0LjU1MjI4NDcsMjUgMjUsMjUuNDQ3NzE1MyAyNSwyNiBDMjUsMjYuNDg1NDEwMyAyNC42NTIwMDA3LDI2Ljg5ODA4NSAyNC4xMzQ1MTIzLDI2Ljk4OTk0NzkgTDI0LDI3IEwxNiwyNyBDMTUuNDQ3NzE1MywyNyAxNSwyNi41NTIyODQ3IDE1LDI2IEMxNSwyNS41MTQ1ODk3IDE1LjM0Nzk5OTMsMjUuMTAxOTE1IDE1Ljg2NTQ4NzcsMjUuMDEwMDUyMSBMMTYsMjUgTDE5LDI1IFoiIGZpbGw9IiMyMTIzMjQiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PC9wYXRoPgogICAgICAgICAgICAgICAgPC9nPgogICAgICAgICAgICA8L2c+CiAgICAgICAgPC9nPgogICAgPC9nPgo8L3N2Zz4=", Q_ = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMjhweCIgaGVpZ2h0PSIyOHB4IiB2aWV3Qm94PSIwIDAgMjggMjgiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDU1LjEgKDc4MTM2KSAtIGh0dHBzOi8vc2tldGNoYXBwLmNvbSAtLT4KICAgIDx0aXRsZT7nvJbnu4QgMjwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPgogICAgICAgIDxmaWx0ZXIgeD0iLTEyMC4wJSIgeT0iLTEyMC4wJSIgd2lkdGg9IjM0MC4wJSIgaGVpZ2h0PSIzNDAuMCUiIGZpbHRlclVuaXRzPSJvYmplY3RCb3VuZGluZ0JveCIgaWQ9ImZpbHRlci0xIj4KICAgICAgICAgICAgPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iNCIgaW49IlNvdXJjZUdyYXBoaWMiPjwvZmVHYXVzc2lhbkJsdXI+CiAgICAgICAgPC9maWx0ZXI+CiAgICA8L2RlZnM+CiAgICA8ZyBpZD0i6aG16Z2iMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9Iue8lue7hC0yIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg5LjAwMDAwMCwgOS4wMDAwMDApIiBmaWxsPSIjRkYwMTAwIj4KICAgICAgICAgICAgPGNpcmNsZSBpZD0i5qSt5ZyG5b2iIiBmaWx0ZXI9InVybCgjZmlsdGVyLTEpIiBjeD0iNSIgY3k9IjUiIHI9IjUiPjwvY2lyY2xlPgogICAgICAgICAgICA8cGF0aCBkPSJNNSw4IEM2LjY1Njg1NDI1LDggOCw2LjY1Njg1NDI1IDgsNSBDOCwzLjM0MzE0NTc1IDYuNjU2ODU0MjUsMiA1LDIgQzMuMzQzMTQ1NzUsMiAyLDMuMzQzMTQ1NzUgMiw1IEMyLDYuNjU2ODU0MjUgMy4zNDMxNDU3NSw4IDUsOCBaIE01LDYuMjg1NzE0MjkgQzQuMjg5OTE5NjEsNi4yODU3MTQyOSAzLjcxNDI4NTcxLDUuNzEwMDgwMzkgMy43MTQyODU3MSw1IEMzLjcxNDI4NTcxLDQuMjg5OTE5NjEgNC4yODk5MTk2MSwzLjcxNDI4NTcxIDUsMy43MTQyODU3MSBDNS43MTAwODAzOSwzLjcxNDI4NTcxIDYuMjg1NzE0MjksNC4yODk5MTk2MSA2LjI4NTcxNDI5LDUgQzYuMjg1NzE0MjksNS43MTAwODAzOSA1LjcxMDA4MDM5LDYuMjg1NzE0MjkgNSw2LjI4NTcxNDI5IFoiIGlkPSLmpK3lnIblvaIiIGZpbGwtcnVsZT0ibm9uemVybyI+PC9wYXRoPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+", Z_ = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMjYiIHZpZXdCb3g9IjAgMCAxOCAyNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMC41IiB5PSIwLjUiIHdpZHRoPSIxNyIgaGVpZ2h0PSIyNSIgcng9IjMuNSIgZmlsbD0iYmxhY2siIGZpbGwtb3BhY2l0eT0iMC4zNSIgc3Ryb2tlPSJ3aGl0ZSIvPgo8L3N2Zz4K", Y_ = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjYiIGhlaWdodD0iMzQiIHZpZXdCb3g9IjAgMCAyNiAzNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMC41IiB5PSIwLjUiIHdpZHRoPSIyNSIgaGVpZ2h0PSIzMyIgcng9IjMuNSIgZmlsbD0iYmxhY2siIGZpbGwtb3BhY2l0eT0iMC4zNSIgc3Ryb2tlPSJ3aGl0ZSIvPgo8L3N2Zz4K", G_ = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzQiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCAzNCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMC41IiB5PSIwLjUiIHdpZHRoPSIzMyIgaGVpZ2h0PSI0OSIgcng9IjMuNSIgZmlsbD0iYmxhY2siIGZpbGwtb3BhY2l0eT0iMC4zNSIgc3Ryb2tlPSJ3aGl0ZSIvPgo8L3N2Zz4K", X_ = {
  [Nn.pencil]: U_,
  [Nn.selector]: H_,
  [Nn.eraser]: W_,
  [Nn.shape]: F_,
  [Nn.text]: $_,
  [Nn.laserPointer]: Q_,
  pencilEraser1: Z_,
  pencilEraser2: Y_,
  pencilEraser3: G_
}, NT = "local-cursor";
class J_ {
  constructor(n, o, l, h) {
    var g;
    this.manager = n, this.enableCursor = o, this.cursorInstances = /* @__PURE__ */ new Map(), this.userApplianceIcons = {}, this.sideEffectManager = new kd(), this.store = this.manager.store, this.leaveFlag = !0, this._style = "default", this.onCursorMove = (S) => {
      const C = this.initCursorInstance(S.uid);
      if (S.state === Hb.Leave)
        C.leave();
      else {
        const I = C.updateMember();
        this.canMoveCursor(I) && C.move(S.position);
      }
    }, this.initCursorInstance = (S) => {
      let C = this.cursorInstances.get(S);
      return C || (C = new V_(this.manager, S, this, Wt.wrapper), this.cursorInstances.set(S, C)), C;
    }, this.mouseMoveListener_ = (S, C) => {
      const I = this.getType(S);
      this.updateCursor(I, S.clientX, S.clientY), C && this.showPencilEraserIfNeeded(I, S.clientX, S.clientY);
    }, this.mouseMoveTimer = 0, this.mouseMoveListener = (S) => {
      const C = S.pointerType === "touch";
      if (C && !S.isPrimary)
        return;
      const I = Date.now();
      if (I - this.mouseMoveTimer > 48) {
        if (this.mouseMoveTimer = I, Wt.supportAppliancePlugin && ol(Wt.displayer) && Wt.displayer.disableDeviceInputs) {
          this.leaveFlag && (this.manager.dispatchInternalEvent(Xt.CursorMove, {
            uid: this.manager.uid,
            state: Hb.Leave
          }), this.leaveFlag = !1);
          return;
        }
        this.mouseMoveListener_(S, C), this.leaveFlag = !0;
      }
    }, this.mouseLeaveListener = () => {
      this.hideCursor(this.manager.uid);
    }, this.getPoint = (S, C, I) => {
      var z;
      const A = (z = S == null ? void 0 : S.divElement) == null ? void 0 : z.getBoundingClientRect();
      if (A)
        return S == null ? void 0 : S.convertToPointInWorld({
          x: C - A.x,
          y: I - A.y
        });
    }, this.getType = (S) => {
      var A;
      const C = S.target, I = this.manager.focusApp;
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
    m && this.setupWrapper(m), this.sideEffectManager.add(() => et.on("cursorMove", this.onCursorMove)), this.sideEffectManager.add(() => et.on("playgroundSizeChange", () => this.updateContainerRect()));
    const w = this.manager.room;
    w && this.sideEffectManager.add(() => {
      const S = (C) => {
        this.style === "custom" && C.memberState && this.enableCustomCursor();
      };
      return w.callbacks.on("onRoomStateChanged", S), () => w.callbacks.off("onRoomStateChanged", S);
    }), h && (this.userApplianceIcons = h), this.style = (l == null ? void 0 : l.style) || "default";
  }
  get applianceIcons() {
    return { ...X_, ...this.userApplianceIcons };
  }
  get style() {
    return this._style;
  }
  set style(n) {
    this._style !== n && (this._style = n, this.cursorInstances.forEach((o) => {
      o.setStyle(n);
    }), n === "custom" ? this.enableCustomCursor() : this.sideEffectManager.flush(NT));
  }
  enableCustomCursor() {
    this.sideEffectManager.add(
      () => B_(this.manager.getMemberState()),
      NT
    );
  }
  canMoveCursor(n) {
    const o = (n == null ? void 0 : n.memberState.currentApplianceName) === Nn.laserPointer;
    return this.enableCursor || o;
  }
  setupWrapper(n) {
    this.sideEffectManager.add(() => (n.addEventListener("pointerenter", this.mouseMoveListener), n.addEventListener("pointermove", this.mouseMoveListener), n.addEventListener("pointerleave", this.mouseLeaveListener), () => {
      n.removeEventListener("pointerenter", this.mouseMoveListener), n.removeEventListener("pointermove", this.mouseMoveListener), n.removeEventListener("pointerleave", this.mouseLeaveListener);
    })), this.wrapperRect = n.getBoundingClientRect();
  }
  setMainViewDivElement(n) {
    this.mainViewElement = n;
  }
  get boxState() {
    return this.store.getBoxState();
  }
  get focusView() {
    var n;
    return (n = this.manager.focusApp) == null ? void 0 : n.view;
  }
  showPencilEraserIfNeeded(n, o, l) {
    const h = $b(this.manager.room, this.manager.uid), m = (h == null ? void 0 : h.memberState.currentApplianceName) === Nn.pencilEraser;
    if (this.wrapperRect && this.manager.canOperate && this.canMoveCursor(h) && m) {
      const w = n.type === "main" ? this.manager.mainView : this.focusView, g = this.getPoint(w, o, l);
      g && this.onCursorMove({
        uid: this.manager.uid,
        position: {
          x: g.x,
          y: g.y,
          type: n.type
        }
      });
    }
  }
  updateCursor(n, o, l) {
    const h = $b(this.manager.room, this.manager.uid);
    if (this.wrapperRect && this.manager.canOperate && this.canMoveCursor(h)) {
      const m = n.type === "main" ? this.manager.mainView : this.focusView, w = this.getPoint(m, o, l);
      w && this.manager.dispatchInternalEvent(Xt.CursorMove, {
        uid: this.manager.uid,
        position: {
          x: w.x,
          y: w.y,
          type: n.type
        }
      });
    }
  }
  updateContainerRect() {
    var n, o;
    this.containerRect = (n = Wt.container) == null ? void 0 : n.getBoundingClientRect(), this.wrapperRect = (o = Wt.wrapper) == null ? void 0 : o.getBoundingClientRect();
  }
  deleteCursor(n) {
    this.store.cleanCursor(n);
    const o = this.cursorInstances.get(n);
    o && o.destroy();
  }
  hideCursor(n) {
    const o = this.cursorInstances.get(n);
    o && o.hide();
  }
  destroy() {
    this.sideEffectManager.flushAll(), this.cursorInstances.size && (this.cursorInstances.forEach((n) => {
      n.destroy();
    }), this.cursorInstances.clear());
  }
}
class q_ {
  constructor(n) {
    this.manager = n, et.on("changePageState", () => {
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
class K_ {
  constructor(n) {
    this.ctx = n, this.reactors = /* @__PURE__ */ new Map(), this.disposers = /* @__PURE__ */ new Map(), this.onPhaseChanged = async (o) => {
      var l, h;
      o === ll.Reconnecting && this.ctx.emitter.emit("startReconnect"), o === ll.Connected && this.phase === ll.Reconnecting && ((l = this.room) != null && l.isWritable ? (h = this.room) == null || h.dispatchMagixEvent(hb, {}) : (await TM(500), this.onReconnected())), this.phase = o;
    }, this.onReconnected = Ta(() => {
      this._onReconnected();
    }, 1e3), this._onReconnected = () => {
      Ca("onReconnected refresh reactors"), this.releaseDisposers(), this.reactors.forEach((o, l) => {
        xd(o) && this.disposers.set(l, o());
      }), this.ctx.emitter.emit("onReconnected");
    };
  }
  setRoom(n) {
    this.room = n, this.phase = n == null ? void 0 : n.phase, n && (n.callbacks.off("onPhaseChanged", this.onPhaseChanged), n.callbacks.on("onPhaseChanged", this.onPhaseChanged), n.addMagixEventListener(
      hb,
      (o) => {
        o.authorId === n.observerId && this.onReconnected();
      },
      { fireSelfEventAfterCommit: !0 }
    ));
  }
  setContext(n) {
    this.ctx = n;
  }
  releaseDisposers() {
    this.disposers.forEach((n) => {
      xd(n) && n();
    }), this.disposers.clear();
  }
  refresh() {
    this._onReconnected();
  }
  add(n, o) {
    const l = this.disposers.get(n);
    l && xd(l) && l(), xd(o) && (this.reactors.set(n, o), this.disposers.set(n, o()));
  }
  remove(n) {
    this.reactors.has(n) && this.reactors.delete(n);
    const o = this.disposers.get(n);
    o && (xd(o) && o(), this.disposers.delete(n));
  }
  hasReactor(n) {
    return this.reactors.has(n);
  }
  destroy() {
    var n, o;
    (n = this.room) == null || n.callbacks.off("onPhaseChanged", this.onPhaseChanged), (o = this.room) == null || o.removeMagixEventListener(hb, this.onReconnected), this.releaseDisposers();
  }
}
const eP = (r, n) => {
  if (lS(r))
    nP(r);
  else {
    if (r = r, Object.getOwnPropertyDescriptor(r, "disableCameraTransform"))
      return;
    Object.defineProperty(r, "disableCameraTransform", {
      get() {
        return n.mainView.disableCameraTransform;
      },
      set(l) {
        n.mainView.disableCameraTransform = l;
      }
    }), Object.defineProperty(r, "canUndoSteps", {
      get() {
        return n.canUndoSteps;
      }
    }), Object.defineProperty(r, "canRedoSteps", {
      get() {
        return n.canRedoSteps;
      }
    }), r.moveCamera = (l) => n.moveCamera(l), r.moveCameraToContain = (...l) => n.moveCameraToContain(...l), r.convertToPointInWorld = (...l) => n.mainView.convertToPointInWorld(...l), r.setCameraBound = (...l) => n.mainView.setCameraBound(...l), r.scenePreview = (...l) => n.mainView.scenePreview(...l), r.fillSceneSnapshot = (...l) => n.mainView.fillSceneSnapshot(...l), r.generateScreenshot = (...l) => n.mainView.generateScreenshot(...l), r.setMemberState = (...l) => n.mainView.setMemberState(...l), r.redo = () => n.redo(), r.undo = () => n.undo(), r.cleanCurrentScene = () => n.cleanCurrentScene(), r.delete = () => n.delete(), r.copy = () => n.copy(), r.paste = () => n.paste(), r.duplicate = () => n.duplicate(), r.insertImage = (...l) => n.insertImage(...l), r.completeImageUpload = (...l) => n.completeImageUpload(...l), r.insertText = (...l) => n.insertText(...l), r.lockImage = (...l) => n.lockImage(...l), r.lockImages = (...l) => n.lockImages(...l), tP(r, n);
  }
}, tP = (r, n) => {
  const o = r.removeScenes;
  r.removeScenes = (l, h) => {
    var w;
    l === Cr && ((w = n.appManager) == null || w.updateRootDirRemoving(!0));
    const m = o.call(r, l);
    return et.emit("removeScenes", { scenePath: l, index: h }), m;
  };
}, nP = (r) => {
  const n = r.seekToProgressTime;
  async function o(l) {
    await et.emit("seekStart");
    const h = await n.call(r, l);
    return et.emit("seek", l), h;
  }
  r.seekToProgressTime = o;
};
var iP = Object.defineProperty, rP = Object.defineProperties, aP = Object.getOwnPropertyDescriptors, kT = Object.getOwnPropertySymbols, sP = Object.prototype.hasOwnProperty, oP = Object.prototype.propertyIsEnumerable, _T = (r, n, o) => n in r ? iP(r, n, { enumerable: !0, configurable: !0, writable: !0, value: o }) : r[n] = o, nE = (r, n) => {
  for (var o in n || (n = {}))
    sP.call(n, o) && _T(r, o, n[o]);
  if (kT)
    for (var o of kT(n))
      oP.call(n, o) && _T(r, o, n[o]);
  return r;
}, iE = (r, n) => rP(r, aP(n)), lP = /* @__PURE__ */ (() => `.netless-app-docs-viewer-content{position:relative;height:100%;overflow:hidden}.netless-app-docs-viewer-preview-mask{display:block;position:absolute;z-index:200;top:0;left:0;width:100%;height:100%}.netless-app-docs-viewer-preview{display:flex;flex-direction:column;align-items:center;z-index:300;top:0;right:0;width:23%;padding:12px;box-shadow:-4.8px -3.2px 20px #20233826;transition:transform .4s;background:#f5f5fc;border-radius:4px;-webkit-box-shadow:-4.8px -3.2px 20px rgba(32,35,56,.15);height:100%;position:absolute}.netless-app-docs-viewer-preview-active .netless-app-docs-viewer-preview-mask{display:block}.netless-app-docs-viewer-preview-active .netless-app-docs-viewer-preview{transform:translate(0);opacity:1}.netless-app-docs-viewer-preview-head{display:flex;align-items:center;justify-content:space-between;width:100%;margin-bottom:10px}.netless-app-docs-viewer-preview-head>h3{color:#484c70;font-weight:400;font-size:14px;width:calc(100% - 20px);overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;white-space:nowrap}.netless-app-docs-viewer-preview-head .netless-app-docs-viewer-close{width:25px;height:25px;padding:0;outline:none;border:none;background:#fff;display:flex;justify-content:center;align-items:center;border-radius:100%;cursor:pointer}.netless-app-docs-viewer-preview-head .netless-app-docs-viewer-close button{width:22px;height:22px;padding:0;outline:none;border:none;background:center/cover no-repeat;background-image:url(./icons/close.svg)}.netless-app-docs-viewer-preview-page{position:relative;display:flex;width:100%;margin-bottom:10px;font-size:0;color:transparent;outline:none;border-radius:4px;transition:border-color .3s;user-select:none;align-items:flex-end}.netless-app-docs-viewer-preview-page>img{width:calc(90% - 10px);height:auto;box-sizing:border-box;border:2px solid rgba(0,0,0,.5);border-radius:2px;background-color:#fff}.netless-app-docs-viewer-preview-page>img.netless-app-docs-viewer-active{border-color:#ff5353}.netless-app-docs-viewer-preview-page-name{text-align:right;font-size:12px;color:#8d8fa6;user-select:none;margin-right:10px;width:5%}.netless-app-docs-viewer-footer{box-sizing:border-box;height:40px;display:flex;align-items:center;padding:0 16px;color:#191919;background:#ebecfa}.netless-app-docs-viewer-float-footer{width:100%;min-height:40px;position:absolute;left:0;bottom:0;z-index:2000;transition:opacity .4s;color:#191919}.netless-app-docs-viewer-footer-btn{box-sizing:border-box;width:26px;height:26px;font-size:0;margin:0;padding:3px;border:none;border-radius:4px;outline:none;color:currentColor;background:transparent;transition:background .4s;cursor:pointer;user-select:none;-webkit-tap-highlight-color:rgba(0,0,0,0);color:#8d8fa6}.netless-app-docs-viewer-footer-btn.netless-app-docs-viewer-footer-btn-disable{color:#c6c7d2;cursor:not-allowed}.netless-app-docs-viewer-footer-btn.netless-app-docs-viewer-footer-btn-disable .arrow{fill:#c6c7d2}.netless-app-docs-viewer-footer-btn .arrow{fill:#8d8fa6}.netless-app-docs-viewer-footer-btn:hover{background-color:#1b1f4d0a}@media (hover: none){.netless-app-docs-viewer-footer-btn:hover{background:transparent!important}}.netless-app-docs-viewer-footer-btn>svg{width:100%;height:100%}.netless-app-docs-viewer-footer-btn>svg:nth-of-type(2){display:none}.netless-app-docs-viewer-footer-btn.netless-app-docs-viewer-footer-btn-playing>svg:nth-of-type(1){display:none}.netless-app-docs-viewer-footer-btn.netless-app-docs-viewer-footer-btn-playing>svg:nth-of-type(2){display:initial}.netless-app-docs-viewer-hide{display:none}.netless-app-docs-viewer-page-jumps{flex:1;display:flex;justify-content:center;align-items:center;gap:8px}.netless-app-docs-viewer-page-number{font-size:14px;color:#8d8fa6;user-select:none;white-space:nowrap;word-break:keep-all}.netless-app-docs-viewer-page-number-input{border:none;outline:none;width:3em;margin:0;padding:0 2px;text-align:right;font-size:13px;line-height:1;font-weight:400;font-family:inherit;border-radius:2px;color:currentColor;background:transparent;transition:background .4s;user-select:text;-webkit-tap-highlight-color:rgba(0,0,0,0)}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-footer-btn{cursor:not-allowed}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-footer-btn:hover{background:transparent}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input{cursor:not-allowed}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input:hover,.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input:focus,.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input:active{background:transparent;box-shadow:none}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input:disabled{color:inherit}.netless-app-docs-viewer-readonly.netless-app-docs-viewer-float-footer{display:none}.telebox-color-scheme-dark .netless-app-docs-viewer-page-number-input{color:#a6a6a8}.telebox-color-scheme-dark .netless-app-docs-viewer-page-number-input:active,.telebox-color-scheme-dark .netless-app-docs-viewer-page-number-input:focus,.telebox-color-scheme-dark .netless-app-docs-viewer-page-number-input:hover{color:#222}.telebox-color-scheme-dark .netless-app-docs-viewer-footer{color:#a6a6a8;background:#2d2d33;border-top:none}.telebox-color-scheme-dark .netless-app-docs-viewer-footer-btn:hover{background:#212126}.telebox-color-scheme-dark .netless-app-docs-viewer-preview{background:rgba(50,50,50,.9)}.netless-app-docs-viewer-static-scrollbar{position:absolute;top:0;right:0;z-index:2147483647;width:8px;min-height:30px;margin:0;padding:0;border:none;outline:none;border-radius:4px;background:rgba(68,78,96,.4);box-shadow:1px 1px 8px #ffffffb3;opacity:0;transition:background .4s,opacity .4s 3s,transform .2s;user-select:none}.netless-app-docs-viewer-static-scrollbar.netless-app-docs-viewer-static-scrollbar-dragging{background:rgba(68,78,96,.6);opacity:1;transition:background .4s,opacity .4s 3s!important}.netless-app-docs-viewer-static-scrollbar:hover,.netless-app-docs-viewer-static-scrollbar:focus{background:rgba(68,78,96,.5)}.netless-app-docs-viewer-static-scrollbar:active{background:rgba(68,78,96,.6)}.netless-app-docs-viewer-content:hover .netless-app-docs-viewer-static-scrollbar{opacity:1;transition:background .4s,opacity .4s,transform .2s}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-static-scrollbar{display:none}.netless-app-docs-viewer-static-pages:hover .netless-app-docs-viewer-static-scrollbar{opacity:1;transition:background .4s,opacity .4s,transform .2s}.page-renderer-pages-container{position:relative;overflow:hidden}.page-renderer-page{position:absolute;top:0;left:0;background-position:center;background-size:cover;background-repeat:no-repeat}.page-renderer-pages-container.is-hwa .page-renderer-page{will-change:transform}.page-renderer-page-img{display:block;width:100%;height:auto;user-select:none}.netless-app-docs-viewer-static-pages{overflow:hidden;position:relative;height:100%;user-select:none}.netless-app-docs-viewer-static-page{display:block;width:100%;height:auto;user-select:none}.netless-app-docs-viewer-static-wb-view,.netless-app-docs-viewer-dynamic-wb-view{position:absolute;top:0;left:0;width:100%;height:100%;z-index:100;overflow:auto}.netless-app-docs-viewer-dynamic-wb-view .cursor-clicker .ppt-event-source{cursor:pointer}
`)();
const uP = (r, n, o, l) => {
  if (o === "length" || o === "prototype" || o === "arguments" || o === "caller")
    return;
  const h = Object.getOwnPropertyDescriptor(r, o), m = Object.getOwnPropertyDescriptor(n, o);
  !cP(h, m) && l || Object.defineProperty(r, o, m);
}, cP = function(r, n) {
  return r === void 0 || r.configurable || r.writable === n.writable && r.enumerable === n.enumerable && r.configurable === n.configurable && (r.writable || r.value === n.value);
}, dP = (r, n) => {
  const o = Object.getPrototypeOf(n);
  o !== Object.getPrototypeOf(r) && Object.setPrototypeOf(r, o);
}, fP = (r, n) => `/* Wrapped ${r}*/
${n}`, hP = Object.getOwnPropertyDescriptor(Function.prototype, "toString"), pP = Object.getOwnPropertyDescriptor(Function.prototype.toString, "name"), mP = (r, n, o) => {
  const l = o === "" ? "" : `with ${o.trim()}() `, h = fP.bind(null, l, n.toString());
  Object.defineProperty(h, "name", pP), Object.defineProperty(r, "toString", iE(nE({}, hP), { value: h }));
};
function vP(r, n, { ignoreNonConfigurable: o = !1 } = {}) {
  const { name: l } = r;
  for (const h of Reflect.ownKeys(n))
    uP(r, n, h, o);
  return dP(r, n), mP(r, n, l), r;
}
const gP = (r, n = {}) => {
  if (typeof r != "function")
    throw new TypeError(`Expected the first argument to be a function, got \`${typeof r}\``);
  const {
    wait: o = 0,
    maxWait: l = Number.Infinity,
    before: h = !1,
    after: m = !0
  } = n;
  if (!h && !m)
    throw new Error("Both `before` and `after` are false, function wouldn't be called.");
  let w, g, S;
  const C = function(...I) {
    const A = this, z = () => {
      w = void 0, g && (clearTimeout(g), g = void 0), m && (S = r.apply(A, I));
    }, F = () => {
      g = void 0, w && (clearTimeout(w), w = void 0), m && (S = r.apply(A, I));
    }, j = h && !w;
    return clearTimeout(w), w = setTimeout(z, o), l > 0 && l !== Number.Infinity && !g && (g = setTimeout(F, l)), j && (S = r.apply(A, I)), S;
  };
  return vP(C, r), C.cancel = () => {
    w && (clearTimeout(w), w = void 0), g && (clearTimeout(g), g = void 0);
  }, C;
}, yP = "!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", wP = 87, bP = 20, PT = [], SP = () => {
  for (let r = 0; r < bP; r++)
    PT[r] = yP.charAt(Math.random() * wP);
  return PT.join("");
};
function rE(r) {
  try {
    return r();
  } catch (n) {
    console.error(n);
  }
}
class wg {
  constructor() {
    this.push = this.addDisposer, this.disposers = /* @__PURE__ */ new Map();
  }
  addDisposer(n, o = this.genUID()) {
    return this.flush(o), this.disposers.set(o, Array.isArray(n) ? xP(n) : n), o;
  }
  add(n, o = this.genUID()) {
    const l = n();
    return l ? this.addDisposer(l, o) : o;
  }
  addEventListener(n, o, l, h, m = this.genUID()) {
    return n.addEventListener(o, l, h), this.addDisposer(() => n.removeEventListener(o, l, h), m), m;
  }
  setTimeout(n, o, l = this.genUID()) {
    const h = window.setTimeout(() => {
      this.remove(l), n();
    }, o);
    return this.addDisposer(() => window.clearTimeout(h), l);
  }
  setInterval(n, o, l = this.genUID()) {
    const h = window.setInterval(n, o);
    return this.addDisposer(() => window.clearInterval(h), l);
  }
  remove(n) {
    const o = this.disposers.get(n);
    return this.disposers.delete(n), o;
  }
  flush(n) {
    const o = this.remove(n);
    o && o();
  }
  flushAll() {
    this.disposers.forEach(rE), this.disposers.clear();
  }
  genUID() {
    let n;
    do
      n = SP();
    while (this.disposers.has(n));
    return n;
  }
}
function xP(r) {
  return () => r.forEach(rE);
}
var ku = [], CP = function() {
  return ku.some(function(r) {
    return r.activeTargets.length > 0;
  });
}, TP = function() {
  return ku.some(function(r) {
    return r.skippedTargets.length > 0;
  });
}, zT = "ResizeObserver loop completed with undelivered notifications.", MP = function() {
  var r;
  typeof ErrorEvent == "function" ? r = new ErrorEvent("error", {
    message: zT
  }) : (r = document.createEvent("Event"), r.initEvent("error", !1, !1), r.message = zT), window.dispatchEvent(r);
}, lp;
(function(r) {
  r.BORDER_BOX = "border-box", r.CONTENT_BOX = "content-box", r.DEVICE_PIXEL_CONTENT_BOX = "device-pixel-content-box";
})(lp || (lp = {}));
var _u = function(r) {
  return Object.freeze(r);
}, EP = function() {
  function r(n, o) {
    this.inlineSize = n, this.blockSize = o, _u(this);
  }
  return r;
}(), aE = function() {
  function r(n, o, l, h) {
    return this.x = n, this.y = o, this.width = l, this.height = h, this.top = this.y, this.left = this.x, this.bottom = this.top + this.height, this.right = this.left + this.width, _u(this);
  }
  return r.prototype.toJSON = function() {
    var n = this, o = n.x, l = n.y, h = n.top, m = n.right, w = n.bottom, g = n.left, S = n.width, C = n.height;
    return { x: o, y: l, top: h, right: m, bottom: w, left: g, width: S, height: C };
  }, r.fromRect = function(n) {
    return new r(n.x, n.y, n.width, n.height);
  }, r;
}(), CS = function(r) {
  return r instanceof SVGElement && "getBBox" in r;
}, sE = function(r) {
  if (CS(r)) {
    var n = r.getBBox(), o = n.width, l = n.height;
    return !o && !l;
  }
  var h = r, m = h.offsetWidth, w = h.offsetHeight;
  return !(m || w || r.getClientRects().length);
}, OT = function(r) {
  var n, o;
  if (r instanceof Element)
    return !0;
  var l = (o = (n = r) === null || n === void 0 ? void 0 : n.ownerDocument) === null || o === void 0 ? void 0 : o.defaultView;
  return !!(l && r instanceof l.Element);
}, IP = function(r) {
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
}, ip = typeof window < "u" ? window : {}, Fv = /* @__PURE__ */ new WeakMap(), LT = /auto|scroll/, AP = /^tb|vertical/, RP = /msie|trident/i.test(ip.navigator && ip.navigator.userAgent), ys = function(r) {
  return parseFloat(r || "0");
}, Id = function(r, n, o) {
  return r === void 0 && (r = 0), n === void 0 && (n = 0), o === void 0 && (o = !1), new EP((o ? n : r) || 0, (o ? r : n) || 0);
}, BT = _u({
  devicePixelContentBoxSize: Id(),
  borderBoxSize: Id(),
  contentBoxSize: Id(),
  contentRect: new aE(0, 0, 0, 0)
}), oE = function(r, n) {
  if (n === void 0 && (n = !1), Fv.has(r) && !n)
    return Fv.get(r);
  if (sE(r))
    return Fv.set(r, BT), BT;
  var o = getComputedStyle(r), l = CS(r) && r.ownerSVGElement && r.getBBox(), h = !RP && o.boxSizing === "border-box", m = AP.test(o.writingMode || ""), w = !l && LT.test(o.overflowY || ""), g = !l && LT.test(o.overflowX || ""), S = l ? 0 : ys(o.paddingTop), C = l ? 0 : ys(o.paddingRight), I = l ? 0 : ys(o.paddingBottom), A = l ? 0 : ys(o.paddingLeft), z = l ? 0 : ys(o.borderTopWidth), F = l ? 0 : ys(o.borderRightWidth), j = l ? 0 : ys(o.borderBottomWidth), q = l ? 0 : ys(o.borderLeftWidth), Y = A + C, fe = S + I, se = q + F, Z = z + j, le = g ? r.offsetHeight - Z - r.clientHeight : 0, oe = w ? r.offsetWidth - se - r.clientWidth : 0, ke = h ? Y + se : 0, $e = h ? fe + Z : 0, ze = l ? l.width : ys(o.width) - ke - oe, G = l ? l.height : ys(o.height) - $e - le, he = ze + Y + oe + se, be = G + fe + le + Z, ie = _u({
    devicePixelContentBoxSize: Id(Math.round(ze * devicePixelRatio), Math.round(G * devicePixelRatio), m),
    borderBoxSize: Id(he, be, m),
    contentBoxSize: Id(ze, G, m),
    contentRect: new aE(A, S, ze, G)
  });
  return Fv.set(r, ie), ie;
}, lE = function(r, n, o) {
  var l = oE(r, o), h = l.borderBoxSize, m = l.contentBoxSize, w = l.devicePixelContentBoxSize;
  switch (n) {
    case lp.DEVICE_PIXEL_CONTENT_BOX:
      return w;
    case lp.BORDER_BOX:
      return h;
    default:
      return m;
  }
}, DP = function() {
  function r(n) {
    var o = oE(n);
    this.target = n, this.contentRect = o.contentRect, this.borderBoxSize = _u([o.borderBoxSize]), this.contentBoxSize = _u([o.contentBoxSize]), this.devicePixelContentBoxSize = _u([o.devicePixelContentBoxSize]);
  }
  return r;
}(), uE = function(r) {
  if (sE(r))
    return 1 / 0;
  for (var n = 0, o = r.parentNode; o; )
    n += 1, o = o.parentNode;
  return n;
}, NP = function() {
  var r = 1 / 0, n = [];
  ku.forEach(function(w) {
    if (w.activeTargets.length !== 0) {
      var g = [];
      w.activeTargets.forEach(function(C) {
        var I = new DP(C.target), A = uE(C.target);
        g.push(I), C.lastReportedSize = lE(C.target, C.observedBox), A < r && (r = A);
      }), n.push(function() {
        w.callback.call(w.observer, g, w.observer);
      }), w.activeTargets.splice(0, w.activeTargets.length);
    }
  });
  for (var o = 0, l = n; o < l.length; o++) {
    var h = l[o];
    h();
  }
  return r;
}, jT = function(r) {
  ku.forEach(function(o) {
    o.activeTargets.splice(0, o.activeTargets.length), o.skippedTargets.splice(0, o.skippedTargets.length), o.observationTargets.forEach(function(h) {
      h.isActive() && (uE(h.target) > r ? o.activeTargets.push(h) : o.skippedTargets.push(h));
    });
  });
}, kP = function() {
  var r = 0;
  for (jT(r); CP(); )
    r = NP(), jT(r);
  return TP() && MP(), r > 0;
}, Eb, cE = [], _P = function() {
  return cE.splice(0).forEach(function(r) {
    return r();
  });
}, PP = function(r) {
  if (!Eb) {
    var n = 0, o = document.createTextNode(""), l = { characterData: !0 };
    new MutationObserver(function() {
      return _P();
    }).observe(o, l), Eb = function() {
      o.textContent = "" + (n ? n-- : n++);
    };
  }
  cE.push(r), Eb();
}, zP = function(r) {
  PP(function() {
    requestAnimationFrame(r);
  });
}, ig = 0, OP = function() {
  return !!ig;
}, LP = 250, BP = { attributes: !0, characterData: !0, childList: !0, subtree: !0 }, VT = [
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
], UT = function(r) {
  return r === void 0 && (r = 0), Date.now() + r;
}, Ib = !1, jP = function() {
  function r() {
    var n = this;
    this.stopped = !0, this.listener = function() {
      return n.schedule();
    };
  }
  return r.prototype.run = function(n) {
    var o = this;
    if (n === void 0 && (n = LP), !Ib) {
      Ib = !0;
      var l = UT(n);
      zP(function() {
        var h = !1;
        try {
          h = kP();
        } finally {
          if (Ib = !1, n = l - UT(), !OP())
            return;
          h ? o.run(1e3) : n > 0 ? o.run(n) : o.start();
        }
      });
    }
  }, r.prototype.schedule = function() {
    this.stop(), this.run();
  }, r.prototype.observe = function() {
    var n = this, o = function() {
      return n.observer && n.observer.observe(document.body, BP);
    };
    document.body ? o() : ip.addEventListener("DOMContentLoaded", o);
  }, r.prototype.start = function() {
    var n = this;
    this.stopped && (this.stopped = !1, this.observer = new MutationObserver(this.listener), this.observe(), VT.forEach(function(o) {
      return ip.addEventListener(o, n.listener, !0);
    }));
  }, r.prototype.stop = function() {
    var n = this;
    this.stopped || (this.observer && this.observer.disconnect(), VT.forEach(function(o) {
      return ip.removeEventListener(o, n.listener, !0);
    }), this.stopped = !0);
  }, r;
}(), eS = new jP(), HT = function(r) {
  !ig && r > 0 && eS.start(), ig += r, !ig && eS.stop();
}, VP = function(r) {
  return !CS(r) && !IP(r) && getComputedStyle(r).display === "inline";
}, UP = function() {
  function r(n, o) {
    this.target = n, this.observedBox = o || lp.CONTENT_BOX, this.lastReportedSize = {
      inlineSize: 0,
      blockSize: 0
    };
  }
  return r.prototype.isActive = function() {
    var n = lE(this.target, this.observedBox, !0);
    return VP(this.target) && (this.lastReportedSize = n), this.lastReportedSize.inlineSize !== n.inlineSize || this.lastReportedSize.blockSize !== n.blockSize;
  }, r;
}(), HP = function() {
  function r(n, o) {
    this.activeTargets = [], this.skippedTargets = [], this.observationTargets = [], this.observer = n, this.callback = o;
  }
  return r;
}(), $v = /* @__PURE__ */ new WeakMap(), WT = function(r, n) {
  for (var o = 0; o < r.length; o += 1)
    if (r[o].target === n)
      return o;
  return -1;
}, Qv = function() {
  function r() {
  }
  return r.connect = function(n, o) {
    var l = new HP(n, o);
    $v.set(n, l);
  }, r.observe = function(n, o, l) {
    var h = $v.get(n), m = h.observationTargets.length === 0;
    WT(h.observationTargets, o) < 0 && (m && ku.push(h), h.observationTargets.push(new UP(o, l && l.box)), HT(1), eS.schedule());
  }, r.unobserve = function(n, o) {
    var l = $v.get(n), h = WT(l.observationTargets, o), m = l.observationTargets.length === 1;
    h >= 0 && (m && ku.splice(ku.indexOf(l), 1), l.observationTargets.splice(h, 1), HT(-1));
  }, r.disconnect = function(n) {
    var o = this, l = $v.get(n);
    l.observationTargets.slice().forEach(function(h) {
      return o.unobserve(n, h.target);
    }), l.activeTargets.splice(0, l.activeTargets.length);
  }, r;
}(), WP = function() {
  function r(n) {
    if (arguments.length === 0)
      throw new TypeError("Failed to construct 'ResizeObserver': 1 argument required, but only 0 present.");
    if (typeof n != "function")
      throw new TypeError("Failed to construct 'ResizeObserver': The callback provided as parameter 1 is not a function.");
    Qv.connect(this, n);
  }
  return r.prototype.observe = function(n, o) {
    if (arguments.length === 0)
      throw new TypeError("Failed to execute 'observe' on 'ResizeObserver': 1 argument required, but only 0 present.");
    if (!OT(n))
      throw new TypeError("Failed to execute 'observe' on 'ResizeObserver': parameter 1 is not of type 'Element");
    Qv.observe(this, n, o);
  }, r.prototype.unobserve = function(n) {
    if (arguments.length === 0)
      throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': 1 argument required, but only 0 present.");
    if (!OT(n))
      throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': parameter 1 is not of type 'Element");
    Qv.unobserve(this, n);
  }, r.prototype.disconnect = function() {
    Qv.disconnect(this);
  }, r.toString = function() {
    return "function ResizeObserver () { [polyfill code] }";
  }, r;
}();
function FP(r) {
  const n = "http://www.w3.org/2000/svg", o = document.createElementNS(n, "svg");
  return o.setAttribute("class", `${r}-footer-icon-arrow-left`), o.setAttribute("viewBox", "0 0 20 20"), o.innerHTML = `<g clip-path="url(#clip0_11800_99864)">
<path fill-rule="evenodd" clip-rule="evenodd" d="M11.5283 4.86182L12.4711 5.80463L8.22849 10.0473L12.4711 14.2899L11.5283 15.2327L6.34287 10.0473L11.5283 4.86182Z" class="arrow" />
</g>
<defs>
<clipPath id="clip0_11800_99864">
<rect width="16" height="16" fill="white" transform="translate(2 2)"/>
</clipPath>
</defs>`, o;
}
function $P(r) {
  const n = "http://www.w3.org/2000/svg", o = document.createElementNS(n, "svg");
  return o.setAttribute("class", `${r}-footer-icon-arrow-right`), o.setAttribute("viewBox", "0 0 20 20"), o.innerHTML = `<g clip-path="url(#clip0_11800_99870)">
<path fill-rule="evenodd" clip-rule="evenodd" d="M8.1377 4.86182L7.19489 5.80463L11.4375 10.0473L7.19489 14.2899L8.1377 15.2327L13.3231 10.0473L8.1377 4.86182Z" class="arrow" />
</g>
<defs>
<clipPath id="clip0_11800_99870">
<rect width="16" height="16" fill="white" transform="translate(2 2)"/>
</clipPath>
</defs>`, o;
}
function QP(r) {
  const n = "http://www.w3.org/2000/svg", o = document.createElementNS(n, "svg");
  o.setAttribute("class", `${r}-footer-icon-play`), o.setAttribute("viewBox", "0 0 500 500");
  const l = document.createElementNS(n, "path");
  return l.setAttribute("fill", "currentColor"), l.setAttribute("d", "M418.158 257.419L174.663 413.33c-6.017 3.919-15.708 3.772-21.291-.29-2.791-2.018-4.295-4.483-4.295-7.084V94.109c0-5.65 6.883-10.289 15.271-10.289 4.298 0 8.391 1.307 11.181 3.332l242.629 155.484c6.016 3.917 6.451 10.292.649 14.491-.216.154-.432.154-.649.292zM170.621 391.288l223.116-141.301L170.71 107.753l-.089 283.535z"), o.appendChild(l), o;
}
function ZP(r) {
  const n = "http://www.w3.org/2000/svg", o = document.createElementNS(n, "svg");
  o.setAttribute("class", `${r}-footer-icon-pause`), o.setAttribute("viewBox", "0 0 500 500");
  const l = document.createElementNS(n, "path");
  return l.setAttribute("fill", "currentColor"), l.setAttribute("d", "M312.491 78.261c0-6.159 4.893-11.213 11.04-11.213 6.158 0 11.211 5.054 11.211 11.213v343.478c0 6.159-5.053 11.213-11.211 11.213-6.147 0-11.04-5.054-11.04-11.213V78.261zM165.257 78.261c0-6.159 4.893-11.213 11.04-11.213 6.158 0 11.211 5.054 11.211 11.213v343.478c0 6.159-5.053 11.213-11.211 11.213-6.147 0-11.04-5.054-11.04-11.213V78.261z"), o.appendChild(l), o;
}
const dl = typeof window < "u", dE = dl && !("onscroll" in window) || typeof navigator < "u" && /(gle|ing|ro)bot|crawl|spider/i.test(navigator.userAgent), fE = dl && "IntersectionObserver" in window, hE = dl && "classList" in document.createElement("p"), pE = dl && window.devicePixelRatio > 1, YP = {
  elements_selector: ".lazy",
  container: dE || dl ? document : null,
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
}, mE = (r) => Object.assign({}, YP, r), FT = function(r, n) {
  let o;
  const l = "LazyLoad::Initialized", h = new r(n);
  try {
    o = new CustomEvent(l, { detail: { instance: h } });
  } catch {
    o = document.createEvent("CustomEvent"), o.initCustomEvent(l, !1, !1, { instance: h });
  }
  window.dispatchEvent(o);
}, GP = (r, n) => {
  if (!!n)
    if (!n.length)
      FT(r, n);
    else
      for (let o = 0, l; l = n[o]; o += 1)
        FT(r, l);
}, go = "src", TS = "srcset", MS = "sizes", vE = "poster", fp = "llOriginalAttrs", gE = "data", ES = "loading", yE = "loaded", wE = "applied", XP = "entered", IS = "error", bE = "native", SE = "data-", xE = "ll-status", er = (r, n) => r.getAttribute(SE + n), JP = (r, n, o) => {
  var l = SE + n;
  if (o === null) {
    r.removeAttribute(l);
    return;
  }
  r.setAttribute(l, o);
}, hp = (r) => er(r, xE), Ou = (r, n) => JP(r, xE, n), bg = (r) => Ou(r, null), AS = (r) => hp(r) === null, qP = (r) => hp(r) === ES, KP = (r) => hp(r) === IS, RS = (r) => hp(r) === bE, ez = [ES, yE, wE, IS], tz = (r) => ez.indexOf(hp(r)) >= 0, fl = (r, n, o, l) => {
  if (!!r) {
    if (l !== void 0) {
      r(n, o, l);
      return;
    }
    if (o !== void 0) {
      r(n, o);
      return;
    }
    r(n);
  }
}, _d = (r, n) => {
  if (hE) {
    r.classList.add(n);
    return;
  }
  r.className += (r.className ? " " : "") + n;
}, Ss = (r, n) => {
  if (hE) {
    r.classList.remove(n);
    return;
  }
  r.className = r.className.replace(new RegExp("(^|\\s+)" + n + "(\\s+|$)"), " ").replace(/^\s+/, "").replace(/\s+$/, "");
}, nz = (r) => {
  r.llTempImage = document.createElement("IMG");
}, iz = (r) => {
  delete r.llTempImage;
}, CE = (r) => r.llTempImage, Sg = (r, n) => {
  if (!n)
    return;
  const o = n._observer;
  !o || o.unobserve(r);
}, rz = (r) => {
  r.disconnect();
}, az = (r, n, o) => {
  n.unobserve_entered && Sg(r, o);
}, DS = (r, n) => {
  !r || (r.loadingCount += n);
}, sz = (r) => {
  !r || (r.toLoadCount -= 1);
}, TE = (r, n) => {
  !r || (r.toLoadCount = n);
}, oz = (r) => r.loadingCount > 0, lz = (r) => r.toLoadCount > 0, ME = (r) => {
  let n = [];
  for (let o = 0, l; l = r.children[o]; o += 1)
    l.tagName === "SOURCE" && n.push(l);
  return n;
}, NS = (r, n) => {
  const o = r.parentNode;
  if (!o || o.tagName !== "PICTURE")
    return;
  ME(o).forEach(n);
}, EE = (r, n) => {
  ME(r).forEach(n);
}, xg = [go], IE = [go, vE], up = [go, TS, MS], AE = [gE], Cg = (r) => !!r[fp], RE = (r) => r[fp], DE = (r) => delete r[fp], Rd = (r, n) => {
  if (Cg(r))
    return;
  const o = {};
  n.forEach((l) => {
    o[l] = r.getAttribute(l);
  }), r[fp] = o;
}, uz = (r) => {
  Cg(r) || (r[fp] = { backgroundImage: r.style.backgroundImage });
}, cz = (r, n, o) => {
  if (!o) {
    r.removeAttribute(n);
    return;
  }
  r.setAttribute(n, o);
}, zu = (r, n) => {
  if (!Cg(r))
    return;
  const o = RE(r);
  n.forEach((l) => {
    cz(r, l, o[l]);
  });
}, dz = (r) => {
  if (!Cg(r))
    return;
  const n = RE(r);
  r.style.backgroundImage = n.backgroundImage;
}, NE = (r, n, o) => {
  _d(r, n.class_applied), Ou(r, wE), o && (n.unobserve_completed && Sg(r, n), fl(n.callback_applied, r, o));
}, kE = (r, n, o) => {
  _d(r, n.class_loading), Ou(r, ES), o && (DS(o, 1), fl(n.callback_loading, r, o));
}, cl = (r, n, o) => {
  !o || r.setAttribute(n, o);
}, $T = (r, n) => {
  cl(r, MS, er(r, n.data_sizes)), cl(r, TS, er(r, n.data_srcset)), cl(r, go, er(r, n.data_src));
}, fz = (r, n) => {
  NS(r, (o) => {
    Rd(o, up), $T(o, n);
  }), Rd(r, up), $T(r, n);
}, hz = (r, n) => {
  Rd(r, xg), cl(r, go, er(r, n.data_src));
}, pz = (r, n) => {
  EE(r, (o) => {
    Rd(o, xg), cl(o, go, er(o, n.data_src));
  }), Rd(r, IE), cl(r, vE, er(r, n.data_poster)), cl(r, go, er(r, n.data_src)), r.load();
}, mz = (r, n) => {
  Rd(r, AE), cl(r, gE, er(r, n.data_src));
}, vz = (r, n, o) => {
  const l = er(r, n.data_bg), h = er(r, n.data_bg_hidpi), m = pE && h ? h : l;
  !m || (r.style.backgroundImage = `url("${m}")`, CE(r).setAttribute(go, m), kE(r, n, o));
}, gz = (r, n, o) => {
  const l = er(r, n.data_bg_multi), h = er(r, n.data_bg_multi_hidpi), m = pE && h ? h : l;
  !m || (r.style.backgroundImage = m, NE(r, n, o));
}, yz = (r, n, o) => {
  const l = er(r, n.data_bg_set);
  if (!l)
    return;
  const h = l.split("|");
  let m = h.map((w) => `image-set(${w})`);
  r.style.backgroundImage = m.join(), r.style.backgroundImage === "" && (m = h.map((w) => `-webkit-image-set(${w})`), r.style.backgroundImage = m.join()), NE(r, n, o);
}, _E = {
  IMG: fz,
  IFRAME: hz,
  VIDEO: pz,
  OBJECT: mz
}, wz = (r, n) => {
  const o = _E[r.tagName];
  !o || o(r, n);
}, bz = (r, n, o) => {
  const l = _E[r.tagName];
  !l || (l(r, n), kE(r, n, o));
}, Sz = ["IMG", "IFRAME", "VIDEO", "OBJECT"], xz = (r) => Sz.indexOf(r.tagName) > -1, PE = (r, n) => {
  n && !oz(n) && !lz(n) && fl(r.callback_finish, n);
}, QT = (r, n, o) => {
  r.addEventListener(n, o), r.llEvLisnrs[n] = o;
}, Cz = (r, n, o) => {
  r.removeEventListener(n, o);
}, kS = (r) => !!r.llEvLisnrs, Tz = (r, n, o) => {
  kS(r) || (r.llEvLisnrs = {});
  const l = r.tagName === "VIDEO" ? "loadeddata" : "load";
  QT(r, l, n), QT(r, "error", o);
}, tS = (r) => {
  if (!kS(r))
    return;
  const n = r.llEvLisnrs;
  for (let o in n) {
    const l = n[o];
    Cz(r, o, l);
  }
  delete r.llEvLisnrs;
}, zE = (r, n, o) => {
  iz(r), DS(o, -1), sz(o), Ss(r, n.class_loading), n.unobserve_completed && Sg(r, o);
}, Mz = (r, n, o, l) => {
  const h = RS(n);
  zE(n, o, l), _d(n, o.class_loaded), Ou(n, yE), fl(o.callback_loaded, n, l), h || PE(o, l);
}, Ez = (r, n, o, l) => {
  const h = RS(n);
  zE(n, o, l), _d(n, o.class_error), Ou(n, IS), fl(o.callback_error, n, l), o.restore_on_error && zu(n, up), h || PE(o, l);
}, _S = (r, n, o) => {
  const l = CE(r) || r;
  if (kS(l))
    return;
  Tz(l, (w) => {
    Mz(w, r, n, o), tS(l);
  }, (w) => {
    Ez(w, r, n, o), tS(l);
  });
}, Iz = (r, n, o) => {
  nz(r), _S(r, n, o), uz(r), vz(r, n, o), gz(r, n, o), yz(r, n, o);
}, Az = (r, n, o) => {
  _S(r, n, o), bz(r, n, o);
}, PS = (r, n, o) => {
  xz(r) ? Az(r, n, o) : Iz(r, n, o);
}, Rz = (r, n, o) => {
  r.setAttribute("loading", "lazy"), _S(r, n, o), wz(r, n), Ou(r, bE);
}, ZT = (r) => {
  r.removeAttribute(go), r.removeAttribute(TS), r.removeAttribute(MS);
}, Dz = (r) => {
  NS(r, (n) => {
    ZT(n);
  }), ZT(r);
}, OE = (r) => {
  NS(r, (n) => {
    zu(n, up);
  }), zu(r, up);
}, Nz = (r) => {
  EE(r, (n) => {
    zu(n, xg);
  }), zu(r, IE), r.load();
}, kz = (r) => {
  zu(r, xg);
}, _z = (r) => {
  zu(r, AE);
}, Pz = {
  IMG: OE,
  IFRAME: kz,
  VIDEO: Nz,
  OBJECT: _z
}, zz = (r) => {
  const n = Pz[r.tagName];
  if (!n) {
    dz(r);
    return;
  }
  n(r);
}, Oz = (r, n) => {
  AS(r) || RS(r) || (Ss(r, n.class_entered), Ss(r, n.class_exited), Ss(r, n.class_applied), Ss(r, n.class_loading), Ss(r, n.class_loaded), Ss(r, n.class_error));
}, Lz = (r, n) => {
  zz(r), Oz(r, n), bg(r), DE(r);
}, Bz = (r, n, o, l) => {
  !o.cancel_on_exit || !qP(r) || r.tagName === "IMG" && (tS(r), Dz(r), OE(r), Ss(r, o.class_loading), DS(l, -1), bg(r), fl(o.callback_cancel, r, n, l));
}, jz = (r, n, o, l) => {
  const h = tz(r);
  Ou(r, XP), _d(r, o.class_entered), Ss(r, o.class_exited), az(r, o, l), fl(o.callback_enter, r, n, l), !h && PS(r, o, l);
}, Vz = (r, n, o, l) => {
  AS(r) || (_d(r, o.class_exited), Bz(r, n, o, l), fl(o.callback_exit, r, n, l));
}, Uz = ["IMG", "IFRAME", "VIDEO"], LE = (r) => r.use_native && "loading" in HTMLImageElement.prototype, Hz = (r, n, o) => {
  r.forEach((l) => {
    Uz.indexOf(l.tagName) !== -1 && Rz(l, n, o);
  }), TE(o, 0);
}, Wz = (r) => r.isIntersecting || r.intersectionRatio > 0, Fz = (r) => ({
  root: r.container === document ? null : r.container,
  rootMargin: r.thresholds || r.threshold + "px"
}), $z = (r, n, o) => {
  r.forEach((l) => Wz(l) ? jz(l.target, l, n, o) : Vz(l.target, l, n, o));
}, Qz = (r, n) => {
  n.forEach((o) => {
    r.observe(o);
  });
}, Zz = (r, n) => {
  rz(r), Qz(r, n);
}, Yz = (r, n) => {
  !fE || LE(r) || (n._observer = new IntersectionObserver((o) => {
    $z(o, r, n);
  }, Fz(r)));
}, BE = (r) => Array.prototype.slice.call(r), dg = (r) => r.container.querySelectorAll(r.elements_selector), Gz = (r) => BE(r).filter(AS), Xz = (r) => KP(r), Jz = (r) => BE(r).filter(Xz), YT = (r, n) => Gz(r || dg(n)), qz = (r, n) => {
  Jz(dg(r)).forEach((l) => {
    Ss(l, r.class_error), bg(l);
  }), n.update();
}, Kz = (r, n) => {
  !dl || (n._onlineHandler = () => {
    qz(r, n);
  }, window.addEventListener("online", n._onlineHandler));
}, eO = (r) => {
  !dl || window.removeEventListener("online", r._onlineHandler);
}, pp = function(r, n) {
  const o = mE(r);
  this._settings = o, this.loadingCount = 0, Yz(o, this), Kz(o, this), this.update(n);
};
pp.prototype = {
  update: function(r) {
    const n = this._settings, o = YT(r, n);
    if (TE(this, o.length), dE || !fE) {
      this.loadAll(o);
      return;
    }
    if (LE(n)) {
      Hz(o, n, this);
      return;
    }
    Zz(this._observer, o);
  },
  destroy: function() {
    this._observer && this._observer.disconnect(), eO(this), dg(this._settings).forEach((r) => {
      DE(r);
    }), delete this._observer, delete this._settings, delete this._onlineHandler, delete this.loadingCount, delete this.toLoadCount;
  },
  loadAll: function(r) {
    const n = this._settings;
    YT(r, n).forEach((l) => {
      Sg(l, this), PS(l, n, this);
    });
  },
  restoreAll: function() {
    const r = this._settings;
    dg(r).forEach((n) => {
      Lz(n, r);
    });
  }
};
pp.load = (r, n) => {
  const o = mE(n);
  PS(r, o);
};
pp.resetStatus = (r) => {
  bg(r);
};
dl && GP(pp, window.lazyLoadOptions);
class jE {
  constructor({ context: n, readonly: o, box: l, pages: h, onNewPageIndex: m, onPlay: w }) {
    if (this.pageIndex = 0, this.namespace = "netless-app-docs-viewer", this.isShowPreview = !1, this.isSmallBox = !1, this.sideEffect = new wg(), h.length <= 0)
      throw new Error("[DocsViewer] Empty pages.");
    this.context = n, this.readonly = o, this.box = l, this.pages = h, this.onNewPageIndex = m, this.onPlay = w, this.onPageIndexChanged = () => {
    }, this.render();
  }
  mount() {
    this.box.mountContent(this.$content), this.box.mountFooter(this.$footer), this.box.events.on("maximized", (n) => {
      this.$footer.classList.toggle(this.wrapClassName("hide"), n);
    }), this.$footer.classList.toggle(this.wrapClassName("hide"), this.box.maximized);
  }
  unmount() {
    this.$content.remove(), this.$footer.remove();
  }
  setReadonly(n) {
    this.readonly !== n && (this.readonly = n, this.$content.classList.toggle(this.wrapClassName("readonly"), n), this.$footer.classList.toggle(this.wrapClassName("readonly"), n));
  }
  destroy() {
    this.sideEffect.flushAll(), this.unmount();
  }
  setPageIndex(n) {
    Number.isNaN(n) || (this.scrollPreview(n), this.pageIndex = n, this.$pageNumberInput.textContent = String(n + 1), this.onPageIndexChanged(n), this.$btnPageBack.classList.toggle(this.wrapClassName("footer-btn-disable"), n == 0), this.$btnPageNext.classList.toggle(this.wrapClassName("footer-btn-disable"), n == this.pages.length - 1));
  }
  scrollPreview(n) {
    var o;
    const l = (o = this.$preview) == null ? void 0 : o.querySelectorAll("." + this.wrapClassName("preview-page"));
    if (l == null || l.forEach((S, C) => {
      var I;
      (I = S.querySelector("img")) == null || I.classList.toggle(this.wrapClassName("active"), Number(n) == C);
    }), !l)
      return;
    const h = Array.prototype.slice.call(l).find((S) => S.querySelector("img").className.includes(this.wrapClassName("active")));
    if (!h)
      return;
    const m = this.$preview.getBoundingClientRect(), w = h == null ? void 0 : h.getBoundingClientRect();
    w.top >= m.top && w.bottom <= m.bottom || this.$preview.scrollTo({
      top: h.offsetTop - 16,
      behavior: this.isShowPreview ? "smooth" : "auto"
    });
  }
  setSmallBox(n) {
    this.isSmallBox !== n && (this.isSmallBox = n, this.$footer.classList.toggle(this.wrapClassName("float-footer"), n));
  }
  render() {
    return this.renderContent(), this.renderFooter(), this.$content;
  }
  renderContent() {
    if (!this.$content) {
      const n = document.createElement("div");
      n.className = this.wrapClassName("content"), this.$content = n, this.readonly && n.classList.add(this.wrapClassName("readonly"));
    }
    return this.$content;
  }
  renderPreview() {
    if (!this.$preview) {
      const n = document.createElement("div");
      n.className = this.wrapClassName("preview") + " tele-fancy-scrollbar", this.$preview = n;
      const o = document.createElement("div");
      o.className = this.wrapClassName("preview-head");
      const l = document.createElement("h3");
      l.textContent = this.box.title, o.appendChild(l), this.$preview.appendChild(o);
      const h = this.wrapClassName("preview-page"), m = this.wrapClassName("preview-page-name");
      this.pages.forEach((w, g) => {
        var S;
        const C = (S = w.thumbnail) != null ? S : w.src.startsWith("ppt") ? void 0 : w.src;
        if (!C)
          return;
        const I = String(g), A = document.createElement("a");
        A.className = h + " " + this.wrapClassName(`preview-page-${g}`), A.setAttribute("href", "#"), A.dataset.pageIndex = I;
        const z = document.createElement("span");
        z.className = m, z.textContent = String(g + 1), z.dataset.pageIndex = I;
        const F = document.createElement("img");
        F.width = w.width, F.height = w.height, F.dataset.src = C, F.dataset.pageIndex = I, A.appendChild(z), A.appendChild(F), n.appendChild(A), F.classList.toggle(this.wrapClassName("active"), this.pageIndex == g);
      }), this.sideEffect.addEventListener(n, "click", (w) => {
        var g;
        if (this.readonly)
          return;
        const S = (g = w.target.dataset) == null ? void 0 : g.pageIndex;
        S && (w.preventDefault(), w.stopPropagation(), w.stopImmediatePropagation(), this.onNewPageIndex(Number(S)));
      });
    }
    return this.$preview;
  }
  renderPreviewMask() {
    return this.$previewMask || (this.$previewMask = document.createElement("div"), this.$previewMask.className = this.wrapClassName("preview-mask"), this.sideEffect.addEventListener(this.$previewMask, "click", (n) => {
      this.readonly || n.target === this.$previewMask && this.togglePreview(!1);
    })), this.$previewMask;
  }
  renderFooter() {
    if (!this.$footer) {
      const n = document.createElement("div");
      n.className = this.wrapClassName("footer"), this.$footer = n, this.readonly && n.classList.add(this.wrapClassName("readonly")), this.isSmallBox && n.classList.add(this.wrapClassName("float-footer")), this.pages.some((S) => S.thumbnail || !S.src.startsWith("ppt"));
      const o = document.createElement("div");
      o.className = this.wrapClassName("page-jumps");
      const l = this.renderFooterBtn("btn-page-back", FP(this.namespace));
      if (this.sideEffect.addEventListener(l, "click", () => {
        this.readonly || this.onNewPageIndex(this.pageIndex - 1);
      }), o.appendChild(l), this.$btnPageBack = l, this.onPlay) {
        const S = this.renderFooterBtn("btn-page-play", QP(this.namespace), ZP(this.namespace)), C = () => {
          this.sideEffect.setTimeout(() => {
            S.classList.toggle(this.wrapClassName("footer-btn-playing"), !1);
          }, 500, "returnPlay");
        };
        this.sideEffect.addEventListener(S, "click", () => {
          var I;
          this.readonly || (S.classList.toggle(this.wrapClassName("footer-btn-playing"), !0), (I = this.onPlay) == null || I.call(this), C());
        }), this.$footer.appendChild(S);
      }
      const h = document.createElement("div");
      h.className = this.wrapClassName("page-number");
      const m = document.createElement("span");
      m.className = this.wrapClassName("page-number-input"), m.textContent = String(this.pageIndex + 1), this.$pageNumberInput = m;
      const w = document.createElement("span");
      w.textContent = " / " + this.pages.length, h.appendChild(m), h.appendChild(w), o.appendChild(h);
      const g = this.renderFooterBtn("btn-page-next", $P(this.namespace));
      this.sideEffect.addEventListener(g, "click", () => {
        this.readonly || this.onNewPageIndex(this.pageIndex + 1);
      }), o.appendChild(g), this.$btnPageNext = g, this.$footer.appendChild(o);
    }
    return this.$footer;
  }
  renderFooterBtn(n, o, l) {
    const h = document.createElement("button");
    return h.className = this.wrapClassName("footer-btn") + " " + this.wrapClassName(n), h.appendChild(o), l && h.appendChild(l), h;
  }
  togglePreview(n) {
    var o, l, h, m, w, g, S;
    this.isShowPreview = n != null ? n : !this.isShowPreview, console.log((o = this.context) == null ? void 0 : o.extendWrapper), this.$content.classList.toggle(this.wrapClassName("preview-active"), this.isShowPreview), this.isShowPreview ? ((l = this.context) != null && l.extendWrapper && ((m = (h = this.context) == null ? void 0 : h.extendWrapper) == null || m.appendChild(this.renderPreviewMask()), (g = (w = this.context) == null ? void 0 : w.extendWrapper) == null || g.appendChild(this.renderPreview()), this.context.extendWrapper.style.display = "block"), setTimeout(() => {
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
    })) : (S = this.context) != null && S.extendWrapper && (this.context.extendWrapper.style.display = "none", this.context.extendWrapper.innerHTML = "");
  }
  wrapClassName(n) {
    return `${this.namespace}-${n}`;
  }
}
function Dd(r, n, o) {
  return Math.min(Math.max(r, n), o);
}
function GT(r) {
  return r.touches ? r.touches[0] : r;
}
function VE(r) {
  r.stopPropagation(), r.cancelable && r.preventDefault();
}
function UE(r) {
  if (!r)
    return !1;
  const n = r.tagName;
  return n === "INPUT" || n === "TEXTAREA" || n === "SELECT";
}
class tO {
  constructor(n) {
    var o, l, h;
    this.velocity = 0, this.paused = !0, this._animationFrameID = null, this._loopTimestamp = 0, this.looper = (m) => {
      if (this.paused)
        return;
      let w = Math.floor((m - this._loopTimestamp) / 1e3 * 60) + 1;
      for (this._loopTimestamp = m; w-- > 0; )
        this.stepper();
      this.onStep(this.current, this), !this.paused && this.current !== this.target && window.requestAnimationFrame(this.looper);
    }, this.current = (o = n.start) != null ? o : 0, this.target = this.current, this.stiffness = (l = n.stiffness) != null ? l : 170, this.damping = (h = n.damping) != null ? h : 26, this.onStep = n.onStep;
  }
  stepTo(n, o) {
    this.paused && o != null && (this.current = o), this.paused = !1, this.target = n, this.onStep(this.current, this), this._loopTimestamp = Date.now(), window.requestAnimationFrame(this.looper);
  }
  pause() {
    this.paused = !0;
  }
  destroy() {
    this.pause();
  }
  stepper() {
    const n = -this.stiffness * (this.current - this.target), o = -this.damping * this.velocity, l = this.velocity + (n + o) / 60, h = this.current + l / 60;
    Math.abs(l - 0) < 0.01 && Math.abs(h - this.target) < 0.01 ? (this.current = this.target, this.velocity = 0) : (this.current = h, this.velocity = l);
  }
}
class nO {
  constructor(n, o, l, h) {
    this.scale = 1, this.lastVisit = Date.now(), this.pageOffsetY = 0, this.pageOffsetX = 0, this.visible = !0, this.index = n, this.page = o, this.scale = l, this.pageOffsetX = (h - o.width) / 2;
    const m = document.createElement("div");
    m.className = "page-renderer-page", m.dataset.index = `${n}`, m.style.width = `${o.width * l}px`, m.style.height = `${o.height * l}px`, o.thumbnail && (m.style.backgroundImage = `url("${o.thumbnail}")`);
    const w = document.createElement("img");
    w.className = "page-renderer-page-img", w.width = o.width, w.height = o.height, w.src = o.src, m.appendChild(w), this.$page = m;
  }
  translateY(n) {
    Math.abs(n - this.pageOffsetY) >= 1e-3 && (this.pageOffsetY = n, this.$page.style.transform = `translate(${this.pageOffsetX * this.scale}px, ${this.pageOffsetY * this.scale}px)`);
  }
  setScale(n) {
    Math.abs(n - this.scale) >= 1e-3 && (this.scale = n, this.$page.style.width = `${this.page.width * this.scale}px`, this.$page.style.height = `${this.page.height * this.scale}px`, this.$page.style.transform = `translate(${this.pageOffsetX * this.scale}px, ${this.pageOffsetY * this.scale}px)`);
  }
  setVisible(n) {
    n !== this.visible && (this.visible = n, this.$page.style.opacity = n ? "1" : "0");
  }
}
const iO = window.requestIdleCallback || ((r) => window.setTimeout(r, 5e3)), rO = window.cancelIdleCallback || window.clearTimeout;
class aO {
  constructor(n, o, l) {
    this.pages = n, this.pagesIntrinsicWidth = o, this.scale = l, this.els = /* @__PURE__ */ new Map(), this.maxElCount = 200, this.gcTimer = null, this.gc = () => {
      if (this.gcTimer = null, this.els.size > this.maxElCount) {
        const h = [...this.els.values()].sort((m, w) => w.lastVisit - m.lastVisit);
        for (let m = Math.floor(this.maxElCount / 4); m < h.length; m++)
          this.els.delete(h[m].index);
      }
    };
  }
  getEl(n) {
    let o = this.els.get(n);
    return o || (o = new nO(n, this.pages[n], this.scale, this.pagesIntrinsicWidth), this.els.set(n, o)), o.lastVisit = Date.now(), this.els.size > this.maxElCount && this.gcTimer === null && (this.gcTimer = iO(this.gc)), o;
  }
  setScale(n) {
    n !== this.scale && (this.scale = n, this.els.forEach((o) => o.setScale(n)));
  }
  destroy() {
    this.els.clear(), this.gcTimer !== null && (rO(this.gcTimer), this.gcTimer = null);
  }
}
class sO {
  constructor(n) {
    this._hwaTimeout = NaN, this._turnOffHWA = () => {
      window.clearTimeout(this._hwaTimeout), this._hwaTimeout = NaN, this.$pages.classList.toggle("is-hwa", !1);
    }, this.pagesScrollTop = n.pagesScrollTop || 0, this.containerWidth = n.containerWidth || 1, this.containerHeight = n.containerHeight || 1, this.pages = n.pages.map((m) => {
      if (m.thumbnail)
        return m;
      try {
        const w = new URL(m.src);
        return w.searchParams.set("x-oss-process", "image/resize,l_50"), iE(nE({}, m), { thumbnail: w.toString() });
      } catch (w) {
        return console.error(w), m;
      }
    });
    const o = Array(this.pages.length);
    let l = 1 / 0, h = 0;
    this.pagesIntrinsicHeight = this.pages.reduce((m, w, g) => (o[g] = m, w.width > h && (h = w.width), w.height <= l && (l = w.height), m + w.height), 0), this.pagesIntrinsicWidth = h, this.pagesMinHeight = l, this.pagesIntrinsicYs = o, this.scale = this._calcScale(), this.threshold = this._calcThreshold(), this.onPageIndexChanged = n.onPageIndexChanged, this.pageScrollIndex = 0, this.pagesScrollTop !== 0 && (this.pageScrollIndex = this.findScrollPageIndex(), this.onPageIndexChanged && this.pageScrollIndex > 0 && this.onPageIndexChanged(this.pageScrollIndex)), this.pageElManager = new aO(this.pages, h, this.scale), this.$pages = this.renderPages();
  }
  setContainerSize(n, o) {
    n > 0 && o > 0 && (n !== this.containerWidth || o !== this.containerHeight) && (this.containerWidth = n, this.containerHeight = o, this.$pages.style.width = `${this.containerWidth}px`, this.$pages.style.height = `${this.containerHeight}px`, this.scale = this._calcScale(), this.threshold = this._calcThreshold(), this.pageElManager.setScale(this.scale), this.$pages.parentElement && this.pagesScrollTo(this.pagesScrollTop, !0));
  }
  renderPages() {
    const n = document.createElement("div");
    return n.className = "page-renderer-pages-container", n.style.width = `${this.containerWidth}px`, n.style.height = `${this.containerHeight}px`, n;
  }
  pagesScrollTo(n, o) {
    if (n = Dd(n, 0, this.pagesIntrinsicHeight - this.containerHeight / this.scale), o || Math.abs(n - this.pagesScrollTop) >= 1e-3) {
      this._turnOnHWA(), this.pagesScrollTop = n;
      const l = this.findScrollPageIndex(), h = Math.max(l - this.threshold, 0), m = Math.min(l + this.threshold, this.pages.length - 1);
      for (let w = 0; w < this.$pages.children.length; w++) {
        const g = this.$pages.children[w], S = Number(g.dataset.index);
        S >= h && S <= m || (g.remove(), w--);
      }
      for (let w = h; w <= m; w++) {
        const g = this.pageElManager.getEl(w);
        g.$page.parentElement !== this.$pages && this.$pages.appendChild(g.$page), g.translateY(this.pagesIntrinsicYs[w] - this.pagesScrollTop);
      }
      l !== this.pageScrollIndex && (this.pageScrollIndex = l, this.onPageIndexChanged && this.onPageIndexChanged(l));
    }
  }
  findScrollPageIndex() {
    for (let n = 0; n < this.pagesIntrinsicYs.length; n++)
      if (this.pagesIntrinsicYs[n] + this.pages[n].height - this.pagesScrollTop >= 1e-3)
        return n;
    return this.pagesIntrinsicYs.length - 1;
  }
  mount(n) {
    n.appendChild(this.$pages), this.pagesScrollTo(this.pagesScrollTop, !0);
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
const oO = 30;
class lO {
  constructor(n) {
    this.sideEffect = new wg(), this.pagesScrollTop = n.pagesScrollTop || 0, this.containerWidth = n.containerWidth || 1, this.containerHeight = n.containerHeight || 1, this.pagesWidth = n.pagesWidth || 1, this.pagesHeight = n.pagesHeight || 1, this.scale = this._calcScale(), this.scrollbarMinHeight = n.scrollbarMinHeight || oO, this.scrollbarHeight = this._calcScrollbarHeight(), this.readonly = n.readonly, this.wrapClassName = n.wrapClassName, this.onDragScroll = n.onDragScroll, this.$scrollbar = this.renderScrollbar();
  }
  mount(n) {
    n.appendChild(this.$scrollbar), this.pagesScrollTo(this.pagesScrollTop, !0);
  }
  unmount() {
    this.$scrollbar.remove();
  }
  setReadonly(n) {
    this.readonly = n;
  }
  setContainerSize(n, o) {
    n > 0 && o > 0 && (n !== this.containerWidth || o !== this.containerHeight) && (this.containerWidth = n, this.containerHeight = o, this.scale = this._calcScale(), this._updateScrollbarHeight(), this.$scrollbar.parentElement && this.pagesScrollTo(this.pagesScrollTop, !0));
  }
  pagesScrollTo(n, o) {
    if (n = Dd(n, 0, this.pagesHeight - this.containerHeight / this.scale), o || Math.abs(n - this.pagesScrollTop) >= 1e-3) {
      this.pagesScrollTop = n;
      const l = this.pagesScrollTop * this.scale, h = this.pagesHeight * this.scale, m = l / (h - this.containerHeight) * (this.containerHeight - this.scrollbarHeight);
      window.requestAnimationFrame ? window.requestAnimationFrame(() => {
        this.$scrollbar.style.transform = `translateY(${m}px)`;
      }) : this.$scrollbar.style.transform = `translateY(${m}px)`;
    }
  }
  destroy() {
    this.unmount(), this.onDragScroll = void 0, this.sideEffect.flushAll();
  }
  renderScrollbar() {
    const n = document.createElement("button");
    n.className = this.wrapClassName("scrollbar"), n.style.minHeight = `${this.scrollbarMinHeight}px`, n.style.height = `${this.scrollbarHeight}px`;
    const o = (l) => {
      if (this.readonly || l.button != null && l.button !== 0)
        return;
      VE(l);
      const h = this.wrapClassName("scrollbar-dragging");
      n.classList.toggle(h, !0);
      const m = this.pagesScrollTop, { clientY: w } = GT(l), g = (C) => {
        if (this.readonly)
          return;
        const { clientY: I } = GT(C), A = (I - w) / this.scale;
        Math.abs(A) > 0 && this.onDragScroll && this.onDragScroll(m + A * (this.pagesHeight * this.scale / this.containerHeight));
      }, S = () => {
        n.classList.toggle(h, !1), window.removeEventListener("mousemove", g, !0), window.removeEventListener("touchmove", g, !0), window.removeEventListener("mouseup", S, !0), window.removeEventListener("touchend", S, !0), window.removeEventListener("touchcancel", S, !0);
      };
      window.addEventListener("mousemove", g, !0), window.addEventListener("touchmove", g, !0), window.addEventListener("mouseup", S, !0), window.addEventListener("touchend", S, !0), window.addEventListener("touchcancel", S, !0);
    };
    return this.sideEffect.addEventListener(n, "mousedown", o), this.sideEffect.addEventListener(n, "touchstart", o), n;
  }
  _calcScale() {
    return this.containerWidth / this.pagesWidth || 1;
  }
  _calcScrollbarHeight() {
    return Dd(this.containerHeight / (this.pagesHeight * this.scale) * this.containerHeight, this.scrollbarMinHeight, this.containerHeight);
  }
  _updateScrollbarHeight() {
    const n = this._calcScrollbarHeight();
    Math.abs(n - this.scrollbarHeight) > 1e-3 && (this.scrollbarHeight = n, this.$scrollbar.style.height = `${n}px`);
  }
}
const uO = window.ResizeObserver || WP, $h = 640;
class cO {
  constructor({
    context: n,
    whiteboardView: o,
    readonly: l,
    box: h,
    pages: m,
    pageScrollTop: w = 0,
    mountWhiteboard: g,
    onUserScroll: S,
    baseScenePath: C,
    appId: I
  }) {
    this.sideEffect = new wg(), this.userScrolling = !1, this.onNewPageIndex = (j) => {
      this.scrollToPage(j);
    }, this.toPdf = async () => {
      const j = document.createElement("canvas"), q = j.getContext("2d");
      if (!q || !this.baseScenePath) {
        this.reportProgress(100, null);
        return;
      }
      const Y = this.whiteboardView.focusScenePath || `${this.baseScenePath}/1`, fe = this.pages[0], { jsPDF: se } = await import("jspdf"), Z = new se({
        format: [fe.width, fe.height],
        orientation: fe.width > fe.height ? "l" : "p",
        compress: !0
      });
      for (const [oe, ke] of this.pages.entries()) {
        const { width: $e, height: ze, src: G } = ke;
        j.width = $e, j.height = ze;
        const he = $e > ze ? "l" : "p";
        oe > 0 && Z.addPage([$e, ze], he);
        const be = await this.getBase64FromUrl(G), ie = document.createElement("img");
        ie.src = be, await new Promise((He) => ie.onload = He), q.drawImage(ie, 0, 0);
        const ct = j.toDataURL("image/jpeg", 0.6);
        q.clearRect(0, 0, $e, ze);
        const Oe = {
          centerX: $e / 2,
          centerY: ze / 2 + oe * ze,
          scale: 1
        }, ce = this.context.manager.windowManger;
        ce._appliancePlugin ? await ce._appliancePlugin.screenshotToCanvasAsync(q, Y, $e, ze, Oe) : this.whiteboardView.screenshotToCanvas(q, Y, $e, ze, Oe);
        const Ze = j.toDataURL("image/png");
        Z.addImage(ct, "JPEG", 0, 0, $e, ze, "", "FAST"), Z.addImage(Ze, "PNG", 0, 0, $e, ze, "", "FAST"), q.clearRect(0, 0, $e, ze), Math.ceil((oe + 1) / this.pages.length * 100) < 100 && this.reportProgress(Math.ceil((oe + 1) / this.pages.length * 100), null);
      }
      const le = Z.output("arraybuffer");
      this.reportProgress(100, { pdf: le, title: this.box.title });
    }, this.context = n, this.whiteboardView = o, this.readonly = l, this.box = h, this.pages = m, this.baseScenePath = C, this.appId = I, this.mountWhiteboard = g, this._onUserScroll = S;
    const A = this.debounce(() => {
      this.userScrolling = !1, this._onUserScroll && this._onUserScroll(this.pageRenderer.pagesScrollTop);
    }, { wait: 80 }, "debounce-updateUserScroll");
    this.updateUserScroll = () => {
      this.userScrolling = !0, A();
    }, this.viewer = new jE({
      context: n,
      readonly: l,
      box: h,
      pages: m,
      onNewPageIndex: this.onNewPageIndex
    });
    const { width: z, height: F } = this.whiteboardView.size;
    this.pageRenderer = new sO({
      pagesScrollTop: w,
      pages: this.pages,
      containerWidth: z,
      containerHeight: F,
      onPageIndexChanged: this.viewer.setPageIndex.bind(this.viewer)
    }), this.scrollbar = new lO({
      pagesScrollTop: this.pageRenderer.pagesScrollTop,
      containerWidth: z,
      containerHeight: F,
      pagesWidth: this.pageRenderer.pagesIntrinsicWidth,
      pagesHeight: this.pageRenderer.pagesIntrinsicHeight,
      readonly: this.readonly,
      wrapClassName: this.wrapClassName.bind(this),
      onDragScroll: (j) => {
        this.pageScrollTo(j), this.updateUserScroll();
      }
    }), this.pageScrollStepper = new tO({
      start: this.pageRenderer.pagesScrollTop,
      onStep: (j) => {
        this.pageScrollTo(j);
      }
    }), this.render();
  }
  mount() {
    this.viewer.mount(), this.setupScrollListener();
    const n = this.debounce(this.renderRatioHeight.bind(this), {
      wait: 80
    });
    return this.sideEffect.add(() => {
      const o = new uO(n);
      return o.observe(this.viewer.$content), () => o.disconnect();
    }), this.sideEffect.setTimeout(() => {
      this.userScrolling || this.pageScrollTo(this.pageRenderer.pagesScrollTop);
    }, 100), this.sideEffect.add(() => {
      const o = (l) => {
        l.data.type === "@netless/_request_save_pdf_" && l.data.appId === this.appId && this.toPdf().catch(() => this.reportProgress(100, null));
      };
      return window.addEventListener("message", o), () => {
        window.removeEventListener("message", o);
      };
    }), this;
  }
  unmount() {
    return this.viewer.unmount(), this;
  }
  setReadonly(n) {
    this.readonly !== n && (this.readonly = n, this.viewer.setReadonly(n), this.scrollbar.setReadonly(n));
  }
  destroy() {
    this.sideEffect.flushAll(), this.pageScrollStepper.destroy(), this._onUserScroll = void 0, this.unmount(), this.viewer.destroy(), this.pageRenderer.destroy(), this.scrollbar.destroy();
  }
  syncPageScrollTop(n) {
    !this.userScrolling && n >= 0 && Math.abs(this.pageRenderer.pagesScrollTop - n) > 0.01 && this.pageScrollStepper.stepTo(n, this.pageRenderer.pagesScrollTop);
  }
  render() {
    this.pageRenderer.mount(this.viewer.$content), this.viewer.$content.appendChild(this.renderWhiteboardView()), this.scrollbar.mount(this.viewer.$content), this.renderRatioHeight();
  }
  renderRatioHeight() {
    const n = this.box.absoluteHeight, o = n <= $h;
    if (this.viewer.setSmallBox(o), o) {
      const l = 26 / $h, h = 26 / n, m = 26 / $h, w = 0, g = Math.max((l + m - (h + w)) / 2, 0);
      if (this.box.$titleBar) {
        const S = h + g;
        this.box.$titleBar.style.height = `${S * 100}%`;
      }
      if (this.box.$footer) {
        const S = w + g;
        this.box.$footer.style.height = `${S * 100}%`;
      }
    } else {
      if (this.box.$titleBar) {
        const l = Math.max(26 / $h, 26 / n);
        this.box.$titleBar.style.height = `${l * 100}%`;
      }
      if (this.box.$footer) {
        const l = Math.max(26 / $h, 26 / n);
        this.box.$footer.style.height = `${l * 100}%`;
      }
    }
  }
  renderWhiteboardView() {
    return this.$whiteboardView || (this.$whiteboardView = document.createElement("div"), this.$whiteboardView.className = this.wrapClassName("wb-view"), this.mountWhiteboard(this.$whiteboardView), this.sideEffect.addEventListener(this.$whiteboardView, "wheel", (n) => {
      VE(n), this.readonly || (this.pageScrollTo(this.pageRenderer.pagesScrollTop + n.deltaY), this.updateUserScroll());
    }, { passive: !1, capture: !0 }), this.sideEffect.addEventListener(this.$whiteboardView, "touchmove", (n) => {
      this.readonly || n.touches.length <= 1 || this.updateUserScroll();
    }, { passive: !0, capture: !0 })), this.$whiteboardView;
  }
  scrollTopPageToEl(n) {
    return n * this.pageRenderer.scale;
  }
  scrollTopElToPage(n) {
    return n / this.pageRenderer.scale;
  }
  elScrollTo(n) {
    this.pageScrollTo(this.scrollTopElToPage(n));
  }
  pageScrollTo(n) {
    const o = this.scrollTopElToPage(this.whiteboardView.size.height / 2);
    this.whiteboardView.moveCamera({
      centerY: Dd(n + o, o, this.pageRenderer.pagesIntrinsicHeight - o),
      animationMode: "immediately"
    });
  }
  scrollToPage(n) {
    if (!this.readonly && !Number.isNaN(n)) {
      const o = this.pageRenderer.pagesIntrinsicYs[n];
      o >= 0 && (this.pageScrollTo(o + 5 / this.pageRenderer.scale), this.updateUserScroll());
    }
  }
  setupScrollListener() {
    this.sideEffect.add(() => {
      const n = (o) => {
        const { width: l, height: h } = this.whiteboardView.size;
        if (l <= 0 || h <= 0)
          return;
        const m = o.centerY - this.pageRenderer.containerHeight / this.pageRenderer.scale / 2;
        this.pageRenderer.pagesScrollTo(m), this.scrollbar.pagesScrollTo(m);
      };
      return this.whiteboardView.callbacks.on("onCameraUpdated", n), () => this.whiteboardView.callbacks.off("onCameraUpdated", n);
    }), this.sideEffect.add(() => {
      const { updateUserScroll: n } = this;
      return this.whiteboardView.callbacks.on("onCameraUpdatedByDevice", n), () => this.whiteboardView.callbacks.off("onCameraUpdatedByDevice", n);
    }), this.sideEffect.add(() => {
      const n = ({ width: o, height: l }) => {
        if (o <= 0 || l <= 0)
          return;
        this.pageRenderer.setContainerSize(o, l), this.scrollbar.setContainerSize(o, l);
        const { pagesIntrinsicWidth: h, pagesIntrinsicHeight: m } = this.pageRenderer;
        this.whiteboardView.moveCameraToContain({
          originX: 0,
          originY: this.pageRenderer.pagesScrollTop,
          width: h,
          height: l / this.pageRenderer.scale,
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
      return this.whiteboardView.callbacks.on("onSizeUpdated", n), () => {
        this.whiteboardView.callbacks.off("onSizeUpdated", n);
      };
    }, "whiteboard-size-update"), this.sideEffect.addEventListener(window, "keyup", (n) => {
      if (this.readonly || !this.box.focus || this.box.minimized || UE(n.target))
        return;
      let o = null;
      switch (n.key) {
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
  debounce(n, o, l) {
    const h = gP(n, o);
    return this.sideEffect.addDisposer(() => h.cancel(), l), h;
  }
  wrapClassName(n) {
    return "netless-app-docs-viewer-static-" + n;
  }
  async getBase64FromUrl(n) {
    const l = await (await fetch(this._invalidate(n))).blob();
    return new Promise((h) => {
      const m = new FileReader();
      m.readAsDataURL(l), m.onloadend = () => {
        const w = m.result;
        h(w);
      };
    });
  }
  _invalidate(n) {
    try {
      const o = new URL(n);
      return o.searchParams.set("t", Date.now().toString()), o.toString();
    } catch {
      return n;
    }
  }
  reportProgress(n, o) {
    window.postMessage({
      type: "@netless/_result_save_pdf_",
      appId: this.appId,
      progress: n,
      result: o
    });
  }
}
class dO {
  constructor({ context: n, whiteboardView: o, box: l, pages: h }) {
    this.sideEffect = new wg(), this.onPlayPPT = () => {
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
    }, this.context = n, this.whiteboardView = o, this.box = l, this.pages = h, this.displayer = n.getDisplayer(), this.viewer = new jE({
      context: n,
      readonly: !n.getIsWritable(),
      box: l,
      pages: h,
      onNewPageIndex: this.onNewPageIndex,
      onPlay: this.onPlayPPT
    }), this.render(), this.sideEffect.add(() => {
      const m = (w) => {
        this.viewer.setReadonly(!w);
      };
      return this.context.emitter.on("writableChange", m), () => this.context.emitter.off("writableChange", m);
    }), this.sideEffect.add(() => {
      const m = (w) => {
        this.jumpToPage(w.index);
      };
      return this.context.emitter.on("sceneStateChange", m), () => this.context.emitter.off("sceneStateChange", m);
    }), this.sideEffect.add(() => {
      const m = (w) => {
        this.jumpToPage(w.index);
      };
      return this.context.emitter.on("pageStateChange", m), () => this.context.emitter.off("pageStateChange", m);
    }), this.sideEffect.add(() => {
      const m = (w) => {
        this.viewer.togglePreview(w);
      };
      return this.context.emitter.on("togglePreview", m), () => this.context.emitter.off("togglePreview", m);
    });
  }
  mount() {
    this.viewer.mount();
    const n = this.getPageIndex();
    return n !== 0 && this.jumpToPage(n), this.scaleDocsToFit(), this.sideEffect.add(() => (this.whiteboardView.callbacks.on("onSizeUpdated", this.scaleDocsToFit), () => {
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
  jumpToPage(n, o) {
    var l, h;
    if (n = Dd(n, 0, this.pages.length - 1), n !== this.getPageIndex() && this.context.getIsWritable()) {
      const m = this.context.getInitScenePath(), w = (h = (l = this.context.getScenes()) == null ? void 0 : l[n]) == null ? void 0 : h.name;
      m && w && this.context.setScenePath(`${m}/${w}`), this.scaleDocsToFit();
    }
    if (n !== this.viewer.pageIndex && this.viewer.setPageIndex(n), o) {
      const m = this.context.getRoom();
      if (m) {
        const w = m.state.globalState.__pptState;
        m.setGlobalState({
          __pptState: w && {
            uuid: w.uuid,
            pageIndex: n,
            disableAutoPlay: w.disableAutoPlay
          }
        });
      }
    }
  }
  render() {
    this.viewer.$content.appendChild(this.renderMask()), this.viewer.$content.appendChild(this.renderWhiteboardView()), this.sideEffect.addEventListener(window, "keydown", (n) => {
      var o;
      if (this.box.focus && !UE(n.target))
        switch (n.key) {
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
      const n = document.createElement("div");
      n.className = this.wrapClassName("mask"), this.$mask = n;
      const o = document.createElement("button");
      o.className = this.wrapClassName("back");
      const l = document.createElement("button");
      l.className = this.wrapClassName("next");
    }
    return this.$mask;
  }
  renderWhiteboardView() {
    return this.$whiteboardView || (this.$whiteboardView = document.createElement("div"), this.$whiteboardView.className = this.wrapClassName("wb-view"), this.sideEffect.addEventListener(this.$whiteboardView, "click", (n) => {
      var o;
      const l = this.context.getRoom();
      if (l && l.state.memberState.currentApplianceName === "clicker") {
        for (let h = n.target; h; h = h.parentElement)
          if ((o = h.classList) != null && o.contains("ppt-event-source"))
            return;
        l.pptNextStep();
      }
    }), this.context.mountView(this.$whiteboardView)), this.$whiteboardView;
  }
  wrapClassName(n) {
    return "netless-app-docs-viewer-dynamic-" + n;
  }
}
const fO = "DocsViewer", nS = {
  kind: fO,
  setup(r) {
    const n = r.getBox(), o = r.getScenes();
    if (!o)
      throw new Error("[Docs Viewer]: scenes not found.");
    const l = r.getView();
    if (console.log(r.storage.state), !l)
      throw new Error("[Docs Viewer]: no whiteboard view.");
    const h = o.map(({ ppt: m }) => m ? {
      width: m.width,
      height: m.height,
      src: m.src,
      thumbnail: m.previewURL
    } : null).filter((m) => Boolean(m));
    if (h.length <= 0)
      throw new Error("[Docs Viewer]: empty scenes.");
    return n.mountStyles(lP), h[0].src.startsWith("ppt") ? pO(r, l, n, h) : hO(r, l, n, h);
  }
};
function hO(r, n, o, l) {
  var h;
  n.disableCameraTransform = !r.getIsWritable();
  const m = new cO({
    context: r,
    whiteboardView: n,
    readonly: !r.getIsWritable(),
    box: o,
    pages: l,
    pageScrollTop: (h = r.getAttributes()) == null ? void 0 : h.pageScrollTop,
    mountWhiteboard: r.mountView.bind(r),
    onUserScroll: (w) => {
      var g;
      ((g = r.getAttributes()) == null ? void 0 : g.pageScrollTop) !== w && !o.readonly && r.updateAttributes(["pageScrollTop"], w);
    },
    baseScenePath: r.getInitScenePath(),
    appId: r.appId
  }).mount();
  return m.viewer.onPageIndexChanged = (w) => {
    r.dispatchAppEvent("pageStateChange", { index: w, length: l.length });
  }, r.dispatchAppEvent("pageStateChange", {
    index: m.viewer.pageIndex,
    length: l.length
  }), r.emitter.on("attributesUpdate", (w) => {
    w && w.pageScrollTop != null && m.syncPageScrollTop(w.pageScrollTop);
  }), r.emitter.on("writableChange", (w) => {
    m.setReadonly(!w), n.disableCameraTransform = !w;
  }), {
    viewer: () => m,
    position: () => {
      const w = m == null ? void 0 : m.viewer;
      if (w)
        return [w.pageIndex, m.pages.length];
    }
  };
}
function pO(r, n, o, l) {
  n.disableCameraTransform = !0;
  const h = new dO({
    context: r,
    whiteboardView: n,
    box: o,
    pages: l
  }).mount();
  return h.viewer.onPageIndexChanged = (m) => {
    r.dispatchAppEvent("pageStateChange", { index: m, length: l.length });
  }, r.dispatchAppEvent("pageStateChange", {
    index: h.getPageIndex(),
    length: l.length
  }), r.mountView(h.$whiteboardView), r.isAddApp && n.callbacks.once("onSizeUpdated", ({ width: m, height: w }) => {
    if (l.length > 0 && o.state !== "maximized") {
      const { width: g, height: S } = l[0], I = S / g * m - w;
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
function HE(r) {
  return r && r.__esModule && Object.prototype.hasOwnProperty.call(r, "default") ? r.default : r;
}
var hl = { exports: {} }, Ot = {};
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var Ab, XT;
function Tg() {
  if (XT)
    return Ab;
  XT = 1;
  var r = Object.getOwnPropertySymbols, n = Object.prototype.hasOwnProperty, o = Object.prototype.propertyIsEnumerable;
  function l(m) {
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
      for (var w = {}, g = 0; g < 10; g++)
        w["_" + String.fromCharCode(g)] = g;
      var S = Object.getOwnPropertyNames(w).map(function(I) {
        return w[I];
      });
      if (S.join("") !== "0123456789")
        return !1;
      var C = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(I) {
        C[I] = I;
      }), Object.keys(Object.assign({}, C)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return Ab = h() ? Object.assign : function(m, w) {
    for (var g, S = l(m), C, I = 1; I < arguments.length; I++) {
      g = Object(arguments[I]);
      for (var A in g)
        n.call(g, A) && (S[A] = g[A]);
      if (r) {
        C = r(g);
        for (var z = 0; z < C.length; z++)
          o.call(g, C[z]) && (S[C[z]] = g[C[z]]);
      }
    }
    return S;
  }, Ab;
}
/** @license React v16.14.0
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var JT;
function mO() {
  if (JT)
    return Ot;
  JT = 1;
  var r = Tg(), n = typeof Symbol == "function" && Symbol.for, o = n ? Symbol.for("react.element") : 60103, l = n ? Symbol.for("react.portal") : 60106, h = n ? Symbol.for("react.fragment") : 60107, m = n ? Symbol.for("react.strict_mode") : 60108, w = n ? Symbol.for("react.profiler") : 60114, g = n ? Symbol.for("react.provider") : 60109, S = n ? Symbol.for("react.context") : 60110, C = n ? Symbol.for("react.forward_ref") : 60112, I = n ? Symbol.for("react.suspense") : 60113, A = n ? Symbol.for("react.memo") : 60115, z = n ? Symbol.for("react.lazy") : 60116, F = typeof Symbol == "function" && Symbol.iterator;
  function j(D) {
    for (var B = "https://reactjs.org/docs/error-decoder.html?invariant=" + D, ee = 1; ee < arguments.length; ee++)
      B += "&args[]=" + encodeURIComponent(arguments[ee]);
    return "Minified React error #" + D + "; visit " + B + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  var q = { isMounted: function() {
    return !1;
  }, enqueueForceUpdate: function() {
  }, enqueueReplaceState: function() {
  }, enqueueSetState: function() {
  } }, Y = {};
  function fe(D, B, ee) {
    this.props = D, this.context = B, this.refs = Y, this.updater = ee || q;
  }
  fe.prototype.isReactComponent = {}, fe.prototype.setState = function(D, B) {
    if (typeof D != "object" && typeof D != "function" && D != null)
      throw Error(j(85));
    this.updater.enqueueSetState(this, D, B, "setState");
  }, fe.prototype.forceUpdate = function(D) {
    this.updater.enqueueForceUpdate(this, D, "forceUpdate");
  };
  function se() {
  }
  se.prototype = fe.prototype;
  function Z(D, B, ee) {
    this.props = D, this.context = B, this.refs = Y, this.updater = ee || q;
  }
  var le = Z.prototype = new se();
  le.constructor = Z, r(le, fe.prototype), le.isPureReactComponent = !0;
  var oe = { current: null }, ke = Object.prototype.hasOwnProperty, $e = { key: !0, ref: !0, __self: !0, __source: !0 };
  function ze(D, B, ee) {
    var Ce, ge = {}, it = null, Xe = null;
    if (B != null)
      for (Ce in B.ref !== void 0 && (Xe = B.ref), B.key !== void 0 && (it = "" + B.key), B)
        ke.call(B, Ce) && !$e.hasOwnProperty(Ce) && (ge[Ce] = B[Ce]);
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
  function G(D, B) {
    return { $$typeof: o, type: D.type, key: B, ref: D.ref, props: D.props, _owner: D._owner };
  }
  function he(D) {
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
  function Ze(D, B, ee, Ce) {
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
            case l:
              it = !0;
          }
      }
    if (it)
      return ee(Ce, D, B === "" ? "." + He(D, 0) : B), 1;
    if (it = 0, B = B === "" ? "." : B + ":", Array.isArray(D))
      for (var Xe = 0; Xe < D.length; Xe++) {
        ge = D[Xe];
        var Be = B + He(ge, Xe);
        it += Ze(ge, Be, ee, Ce);
      }
    else if (D === null || typeof D != "object" ? Be = null : (Be = F && D[F] || D["@@iterator"], Be = typeof Be == "function" ? Be : null), typeof Be == "function")
      for (D = Be.call(D), Xe = 0; !(ge = D.next()).done; )
        ge = ge.value, Be = B + He(ge, Xe++), it += Ze(ge, Be, ee, Ce);
    else if (ge === "object")
      throw ee = "" + D, Error(j(31, ee === "[object Object]" ? "object with keys {" + Object.keys(D).join(", ") + "}" : ee, ""));
    return it;
  }
  function Se(D, B, ee) {
    return D == null ? 0 : Ze(D, "", B, ee);
  }
  function He(D, B) {
    return typeof D == "object" && D !== null && D.key != null ? be(D.key) : B.toString(36);
  }
  function Re(D, B) {
    D.func.call(D.context, B, D.count++);
  }
  function Qe(D, B, ee) {
    var Ce = D.result, ge = D.keyPrefix;
    D = D.func.call(D.context, B, D.count++), Array.isArray(D) ? Tt(D, Ce, ee, function(it) {
      return it;
    }) : D != null && (he(D) && (D = G(D, ge + (!D.key || B && B.key === D.key ? "" : ("" + D.key).replace(ie, "$&/") + "/") + ee)), Ce.push(D));
  }
  function Tt(D, B, ee, Ce, ge) {
    var it = "";
    ee != null && (it = ("" + ee).replace(ie, "$&/") + "/"), B = Oe(B, it, Ce, ge), Se(D, Qe, B), ce(B);
  }
  var Bt = { current: null };
  function Ge() {
    var D = Bt.current;
    if (D === null)
      throw Error(j(321));
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
    if (!he(D))
      throw Error(j(143));
    return D;
  } }, Ot.Component = fe, Ot.Fragment = h, Ot.Profiler = w, Ot.PureComponent = Z, Ot.StrictMode = m, Ot.Suspense = I, Ot.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = re, Ot.cloneElement = function(D, B, ee) {
    if (D == null)
      throw Error(j(267, D));
    var Ce = r({}, D.props), ge = D.key, it = D.ref, Xe = D._owner;
    if (B != null) {
      if (B.ref !== void 0 && (it = B.ref, Xe = oe.current), B.key !== void 0 && (ge = "" + B.key), D.type && D.type.defaultProps)
        var Be = D.type.defaultProps;
      for (dt in B)
        ke.call(B, dt) && !$e.hasOwnProperty(dt) && (Ce[dt] = B[dt] === void 0 && Be !== void 0 ? Be[dt] : B[dt]);
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
    return B === void 0 && (B = null), D = { $$typeof: S, _calculateChangedBits: B, _currentValue: D, _currentValue2: D, _threadCount: 0, Provider: null, Consumer: null }, D.Provider = { $$typeof: g, _context: D }, D.Consumer = D;
  }, Ot.createElement = ze, Ot.createFactory = function(D) {
    var B = ze.bind(null, D);
    return B.type = D, B;
  }, Ot.createRef = function() {
    return { current: null };
  }, Ot.forwardRef = function(D) {
    return { $$typeof: C, render: D };
  }, Ot.isValidElement = he, Ot.lazy = function(D) {
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
var Lt = {}, Rb, qT;
function vO() {
  if (qT)
    return Rb;
  qT = 1;
  var r = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return Rb = r, Rb;
}
var Db, KT;
function gO() {
  return KT || (KT = 1, Db = Function.call.bind(Object.prototype.hasOwnProperty)), Db;
}
var Nb, eM;
function WE() {
  if (eM)
    return Nb;
  eM = 1;
  var r = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var n = vO(), o = {}, l = gO();
    r = function(m) {
      var w = "Warning: " + m;
      typeof console < "u" && console.error(w);
      try {
        throw new Error(w);
      } catch {
      }
    };
  }
  function h(m, w, g, S, C) {
    if (process.env.NODE_ENV !== "production") {
      for (var I in m)
        if (l(m, I)) {
          var A;
          try {
            if (typeof m[I] != "function") {
              var z = Error(
                (S || "React class") + ": " + g + " type `" + I + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof m[I] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw z.name = "Invariant Violation", z;
            }
            A = m[I](w, I, S, g, null, n);
          } catch (j) {
            A = j;
          }
          if (A && !(A instanceof Error) && r(
            (S || "React class") + ": type specification of " + g + " `" + I + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof A + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), A instanceof Error && !(A.message in o)) {
            o[A.message] = !0;
            var F = C ? C() : "";
            r(
              "Failed " + g + " type: " + A.message + (F != null ? F : "")
            );
          }
        }
    }
  }
  return h.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (o = {});
  }, Nb = h, Nb;
}
/** @license React v16.14.0
 * react.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var tM;
function yO() {
  return tM || (tM = 1, process.env.NODE_ENV !== "production" && function() {
    var r = Tg(), n = WE(), o = "16.14.0", l = typeof Symbol == "function" && Symbol.for, h = l ? Symbol.for("react.element") : 60103, m = l ? Symbol.for("react.portal") : 60106, w = l ? Symbol.for("react.fragment") : 60107, g = l ? Symbol.for("react.strict_mode") : 60108, S = l ? Symbol.for("react.profiler") : 60114, C = l ? Symbol.for("react.provider") : 60109, I = l ? Symbol.for("react.context") : 60110, A = l ? Symbol.for("react.concurrent_mode") : 60111, z = l ? Symbol.for("react.forward_ref") : 60112, F = l ? Symbol.for("react.suspense") : 60113, j = l ? Symbol.for("react.suspense_list") : 60120, q = l ? Symbol.for("react.memo") : 60115, Y = l ? Symbol.for("react.lazy") : 60116, fe = l ? Symbol.for("react.block") : 60121, se = l ? Symbol.for("react.fundamental") : 60117, Z = l ? Symbol.for("react.responder") : 60118, le = l ? Symbol.for("react.scope") : 60119, oe = typeof Symbol == "function" && Symbol.iterator, ke = "@@iterator";
    function $e(M) {
      if (M === null || typeof M != "object")
        return null;
      var _ = oe && M[oe] || M[ke];
      return typeof _ == "function" ? _ : null;
    }
    var ze = {
      current: null
    }, G = {
      suspense: null
    }, he = {
      current: null
    }, be = /^(.*)[\\\/]/;
    function ie(M, _, H) {
      var X = "";
      if (_) {
        var xe = _.fileName, Ye = xe.replace(be, "");
        if (/^index\./.test(Ye)) {
          var je = xe.match(be);
          if (je) {
            var tt = je[1];
            if (tt) {
              var Nt = tt.replace(be, "");
              Ye = Nt + "/" + Ye;
            }
          }
        }
        X = " (at " + Ye + ":" + _.lineNumber + ")";
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
    function Ze(M) {
      if (M == null)
        return null;
      if (typeof M.tag == "number" && Ge("Received an unexpected object in getComponentName(). This is likely a bug in React. Please file an issue."), typeof M == "function")
        return M.displayName || M.name || null;
      if (typeof M == "string")
        return M;
      switch (M) {
        case w:
          return "Fragment";
        case m:
          return "Portal";
        case S:
          return "Profiler";
        case g:
          return "StrictMode";
        case F:
          return "Suspense";
        case j:
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
            return Ze(M.type);
          case fe:
            return Ze(M.render);
          case Y: {
            var _ = M, H = Oe(_);
            if (H)
              return Ze(H);
            break;
          }
        }
      return null;
    }
    var Se = {}, He = null;
    function Re(M) {
      He = M;
    }
    Se.getCurrentStack = null, Se.getStackAddendum = function() {
      var M = "";
      if (He) {
        var _ = Ze(He.type), H = He._owner;
        M += ie(_, He._source, H && Ze(H.type));
      }
      var X = Se.getCurrentStack;
      return X && (M += X() || ""), M;
    };
    var Qe = {
      current: !1
    }, Tt = {
      ReactCurrentDispatcher: ze,
      ReactCurrentBatchConfig: G,
      ReactCurrentOwner: he,
      IsSomeRendererActing: Qe,
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
          var xe = Tt.ReactDebugCurrentFrame, Ye = xe.getStackAddendum();
          Ye !== "" && (_ += "%s", H = H.concat([Ye]));
        }
        var je = H.map(function(gn) {
          return "" + gn;
        });
        je.unshift("Warning: " + _), Function.prototype.apply.call(console[M], console, je);
        try {
          var tt = 0, Nt = "Warning: " + _.replace(/%s/g, function() {
            return H[tt++];
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
    }, Vi, Ci, Jn;
    Jn = {};
    function Ne(M) {
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
    function We(M, _) {
      var H = function() {
        Vi || (Vi = !0, Ge("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://fb.me/react-special-props)", _));
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
      if (typeof M.ref == "string" && he.current && M.__self && he.current.stateNode !== M.__self) {
        var _ = Ze(he.current.type);
        Jn[_] || (Ge('Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. This case cannot be automatically converted to an arrow function. We ask you to manually fix this case by using useRef() or createRef() instead. Learn more about using refs safely here: https://fb.me/react-strict-mode-string-ref', Ze(he.current.type), M.ref), Jn[_] = !0);
      }
    }
    var ci = function(M, _, H, X, xe, Ye, je) {
      var tt = {
        $$typeof: h,
        type: M,
        key: _,
        ref: H,
        props: je,
        _owner: Ye
      };
      return tt._store = {}, Object.defineProperty(tt._store, "validated", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: !1
      }), Object.defineProperty(tt, "_self", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: X
      }), Object.defineProperty(tt, "_source", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: xe
      }), Object.freeze && (Object.freeze(tt.props), Object.freeze(tt)), tt;
    };
    function Mr(M, _, H) {
      var X, xe = {}, Ye = null, je = null, tt = null, Nt = null;
      if (_ != null) {
        Ne(_) && (je = _.ref, Sn(_)), st(_) && (Ye = "" + _.key), tt = _.__self === void 0 ? null : _.__self, Nt = _.__source === void 0 ? null : _.__source;
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
      if (Ye || je) {
        var ii = typeof M == "function" ? M.displayName || M.name || "Unknown" : M;
        Ye && We(xe, ii), je && jt(xe, ii);
      }
      return ci(M, Ye, je, tt, Nt, he.current, xe);
    }
    function jn(M, _) {
      var H = ci(M.type, _, M.ref, M._self, M._source, M._owner, M.props);
      return H;
    }
    function Gr(M, _, H) {
      if (M == null)
        throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + M + ".");
      var X, xe = r({}, M.props), Ye = M.key, je = M.ref, tt = M._self, Nt = M._source, gn = M._owner;
      if (_ != null) {
        Ne(_) && (je = _.ref, gn = he.current), st(_) && (Ye = "" + _.key);
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
      return ci(M.type, Ye, je, tt, Nt, gn, xe);
    }
    function Ui(M) {
      return typeof M == "object" && M !== null && M.$$typeof === h;
    }
    var Ma = ".", Ea = ":";
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
    function Ia(M) {
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
      var Ye = !1;
      if (M === null)
        Ye = !0;
      else
        switch (xe) {
          case "string":
          case "number":
            Ye = !0;
            break;
          case "object":
            switch (M.$$typeof) {
              case h:
              case m:
                Ye = !0;
            }
        }
      if (Ye)
        return H(
          X,
          M,
          _ === "" ? Ma + qn(M, 0) : _
        ), 1;
      var je, tt, Nt = 0, gn = _ === "" ? Ma : _ + Ea;
      if (Array.isArray(M))
        for (var xn = 0; xn < M.length; xn++)
          je = M[xn], tt = gn + qn(je, xn), Nt += Ir(je, tt, H, X);
      else {
        var Mn = $e(M);
        if (typeof Mn == "function") {
          Mn === M.entries && (tr || Bt("Using Maps as children is deprecated and will be removed in a future major release. Consider converting children to an array of keyed ReactElements instead."), tr = !0);
          for (var ni = Mn.call(M), ii, So = 0; !(ii = ni.next()).done; )
            je = ii.value, tt = gn + qn(je, So++), Nt += Ir(je, tt, H, X);
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
    function Aa(M, _, H) {
      var X = M.func, xe = M.context;
      X.call(xe, _, M.count++);
    }
    function kt(M, _, H) {
      if (M == null)
        return M;
      var X = Cs(null, null, _, H);
      vn(M, Aa, X), Er(X);
    }
    function rn(M, _, H) {
      var X = M.result, xe = M.keyPrefix, Ye = M.func, je = M.context, tt = Ye.call(je, _, M.count++);
      Array.isArray(tt) ? Mi(tt, X, H, function(Nt) {
        return Nt;
      }) : tt != null && (Ui(tt) && (tt = jn(
        tt,
        xe + (tt.key && (!_ || _.key !== tt.key) ? Ia(tt.key) + "/" : "") + H
      )), X.push(tt));
    }
    function Mi(M, _, H, X, xe) {
      var Ye = "";
      H != null && (Ye = Ia(H) + "/");
      var je = Cs(_, Ye, X, xe);
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
      if (!Ui(M))
        throw Error("React.Children.only expected to receive a single React element child.");
      return M;
    }
    function Ra(M, _) {
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
        var Ye = {
          $$typeof: I,
          _context: H,
          _calculateChangedBits: H._calculateChangedBits
        };
        Object.defineProperties(Ye, {
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
        }), H.Consumer = Ye;
      }
      return H._currentRenderer = null, H._currentRenderer2 = null, H;
    }
    function yo(M) {
      var _ = {
        $$typeof: Y,
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
      return typeof M == "string" || typeof M == "function" || M === w || M === A || M === S || M === g || M === F || M === j || typeof M == "object" && M !== null && (M.$$typeof === Y || M.$$typeof === q || M.$$typeof === C || M.$$typeof === I || M.$$typeof === z || M.$$typeof === se || M.$$typeof === Z || M.$$typeof === le || M.$$typeof === fe);
    }
    function Da(M, _) {
      return Ts(M) || Ge("memo: The first argument must be a component. Instead received: %s", M === null ? "null" : typeof M), {
        $$typeof: q,
        type: M,
        compare: _ === void 0 ? null : _
      };
    }
    function _n() {
      var M = ze.current;
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
    function Vn(M, _) {
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
      if (he.current) {
        var M = Ze(he.current.type);
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
          M && M._owner && M._owner !== he.current && (X = " It was passed a child from " + Ze(M._owner.type) + "."), Re(M), Ge('Each child in a list should have a unique "key" prop.%s%s See https://fb.me/react-warning-keys for more information.', H, X), Re(null);
        }
      }
    }
    function qt(M, _) {
      if (typeof M == "object") {
        if (Array.isArray(M))
          for (var H = 0; H < M.length; H++) {
            var X = M[H];
            Ui(X) && ti(X, _);
          }
        else if (Ui(M))
          M._store && (M._store.validated = !0);
        else if (M) {
          var xe = $e(M);
          if (typeof xe == "function" && xe !== M.entries)
            for (var Ye = xe.call(M), je; !(je = Ye.next()).done; )
              Ui(je.value) && ti(je.value, _);
        }
      }
    }
    function Na(M) {
      {
        var _ = M.type;
        if (_ == null || typeof _ == "string")
          return;
        var H = Ze(_), X;
        if (typeof _ == "function")
          X = _.propTypes;
        else if (typeof _ == "object" && (_.$$typeof === z || _.$$typeof === q))
          X = _.propTypes;
        else
          return;
        X ? (Re(M), n(X, M.props, "prop", H, Se.getStackAddendum), Re(null)) : _.PropTypes !== void 0 && !de && (de = !0, Ge("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", H || "Unknown")), typeof _.getDefaultProps == "function" && !_.getDefaultProps.isReactClassApproved && Ge("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
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
        var Ye = Jt(_);
        Ye ? xe += Ye : xe += Je();
        var je;
        M === null ? je = "null" : Array.isArray(M) ? je = "array" : M !== void 0 && M.$$typeof === h ? (je = "<" + (Ze(M.type) || "Unknown") + " />", xe = " Did you accidentally export a JSX literal instead of a component?") : je = typeof M, Ge("React.createElement: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", je, xe);
      }
      var tt = Mr.apply(this, arguments);
      if (tt == null)
        return tt;
      if (X)
        for (var Nt = 2; Nt < arguments.length; Nt++)
          qt(arguments[Nt], M);
      return M === w ? bo(tt) : Na(tt), tt;
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
      return Na(X), X;
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
    Lt.Children = gl, Lt.Component = ge, Lt.Fragment = w, Lt.Profiler = S, Lt.PureComponent = gt, Lt.StrictMode = g, Lt.Suspense = F, Lt.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Tt, Lt.cloneElement = vl, Lt.createContext = Ra, Lt.createElement = As, Lt.createFactory = Bu, Lt.createRef = Mt, Lt.forwardRef = wo, Lt.isValidElement = Ui, Lt.lazy = yo, Lt.memo = Da, Lt.useCallback = Ms, Lt.useContext = Ar, Lt.useDebugValue = ne, Lt.useEffect = Vn, Lt.useImperativeHandle = Es, Lt.useLayoutEffect = nr, Lt.useMemo = Kr, Lt.useReducer = ei, Lt.useRef = Rr, Lt.useState = qr, Lt.version = o;
  }()), Lt;
}
(function(r) {
  process.env.NODE_ENV === "production" ? r.exports = mO() : r.exports = yO();
})(hl);
const wt = /* @__PURE__ */ HE(hl.exports);
var FE = { exports: {} }, Sr = {}, kb = { exports: {} }, _b = {};
/** @license React v0.19.1
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var nM;
function wO() {
  return nM || (nM = 1, function(r) {
    var n, o, l, h, m;
    if (typeof window > "u" || typeof MessageChannel != "function") {
      var w = null, g = null, S = function() {
        if (w !== null)
          try {
            var re = r.unstable_now();
            w(!0, re), w = null;
          } catch (D) {
            throw setTimeout(S, 0), D;
          }
      }, C = Date.now();
      r.unstable_now = function() {
        return Date.now() - C;
      }, n = function(re) {
        w !== null ? setTimeout(n, 0, re) : (w = re, setTimeout(S, 0));
      }, o = function(re, D) {
        g = setTimeout(re, D);
      }, l = function() {
        clearTimeout(g);
      }, h = function() {
        return !1;
      }, m = r.unstable_forceFrameRate = function() {
      };
    } else {
      var I = window.performance, A = window.Date, z = window.setTimeout, F = window.clearTimeout;
      if (typeof console < "u") {
        var j = window.cancelAnimationFrame;
        typeof window.requestAnimationFrame != "function" && console.error("This browser doesn't support requestAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"), typeof j != "function" && console.error("This browser doesn't support cancelAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills");
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
      var Y = !1, fe = null, se = -1, Z = 5, le = 0;
      h = function() {
        return r.unstable_now() >= le;
      }, m = function() {
      }, r.unstable_forceFrameRate = function(re) {
        0 > re || 125 < re ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing framerates higher than 125 fps is not unsupported") : Z = 0 < re ? Math.floor(1e3 / re) : 5;
      };
      var oe = new MessageChannel(), ke = oe.port2;
      oe.port1.onmessage = function() {
        if (fe !== null) {
          var re = r.unstable_now();
          le = re + Z;
          try {
            fe(!0, re) ? ke.postMessage(null) : (Y = !1, fe = null);
          } catch (D) {
            throw ke.postMessage(null), D;
          }
        } else
          Y = !1;
      }, n = function(re) {
        fe = re, Y || (Y = !0, ke.postMessage(null));
      }, o = function(re, D) {
        se = z(function() {
          re(r.unstable_now());
        }, D);
      }, l = function() {
        F(se), se = -1;
      };
    }
    function $e(re, D) {
      var B = re.length;
      re.push(D);
      e:
        for (; ; ) {
          var ee = B - 1 >>> 1, Ce = re[ee];
          if (Ce !== void 0 && 0 < he(Ce, D))
            re[ee] = D, re[B] = Ce, B = ee;
          else
            break e;
        }
    }
    function ze(re) {
      return re = re[0], re === void 0 ? null : re;
    }
    function G(re) {
      var D = re[0];
      if (D !== void 0) {
        var B = re.pop();
        if (B !== D) {
          re[0] = B;
          e:
            for (var ee = 0, Ce = re.length; ee < Ce; ) {
              var ge = 2 * (ee + 1) - 1, it = re[ge], Xe = ge + 1, Be = re[Xe];
              if (it !== void 0 && 0 > he(it, B))
                Be !== void 0 && 0 > he(Be, it) ? (re[ee] = Be, re[Xe] = B, ee = Xe) : (re[ee] = it, re[ge] = B, ee = ge);
              else if (Be !== void 0 && 0 > he(Be, B))
                re[ee] = Be, re[Xe] = B, ee = Xe;
              else
                break e;
            }
        }
        return D;
      }
      return null;
    }
    function he(re, D) {
      var B = re.sortIndex - D.sortIndex;
      return B !== 0 ? B : re.id - D.id;
    }
    var be = [], ie = [], ct = 1, Oe = null, ce = 3, Ze = !1, Se = !1, He = !1;
    function Re(re) {
      for (var D = ze(ie); D !== null; ) {
        if (D.callback === null)
          G(ie);
        else if (D.startTime <= re)
          G(ie), D.sortIndex = D.expirationTime, $e(be, D);
        else
          break;
        D = ze(ie);
      }
    }
    function Qe(re) {
      if (He = !1, Re(re), !Se)
        if (ze(be) !== null)
          Se = !0, n(Tt);
        else {
          var D = ze(ie);
          D !== null && o(Qe, D.startTime - re);
        }
    }
    function Tt(re, D) {
      Se = !1, He && (He = !1, l()), Ze = !0;
      var B = ce;
      try {
        for (Re(D), Oe = ze(be); Oe !== null && (!(Oe.expirationTime > D) || re && !h()); ) {
          var ee = Oe.callback;
          if (ee !== null) {
            Oe.callback = null, ce = Oe.priorityLevel;
            var Ce = ee(Oe.expirationTime <= D);
            D = r.unstable_now(), typeof Ce == "function" ? Oe.callback = Ce : Oe === ze(be) && G(be), Re(D);
          } else
            G(be);
          Oe = ze(be);
        }
        if (Oe !== null)
          var ge = !0;
        else {
          var it = ze(ie);
          it !== null && o(Qe, it.startTime - D), ge = !1;
        }
        return ge;
      } finally {
        Oe = null, ce = B, Ze = !1;
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
      Se || Ze || (Se = !0, n(Tt));
    }, r.unstable_getCurrentPriorityLevel = function() {
      return ce;
    }, r.unstable_getFirstCallbackNode = function() {
      return ze(be);
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
      return B = Ce + B, re = { id: ct++, callback: D, priorityLevel: re, startTime: Ce, expirationTime: B, sortIndex: -1 }, Ce > ee ? (re.sortIndex = Ce, $e(ie, re), ze(be) === null && re === ze(ie) && (He ? l() : He = !0, o(Qe, Ce - ee))) : (re.sortIndex = B, $e(be, re), Se || Ze || (Se = !0, n(Tt))), re;
    }, r.unstable_shouldYield = function() {
      var re = r.unstable_now();
      Re(re);
      var D = ze(be);
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
  }(_b)), _b;
}
var Pb = {};
/** @license React v0.19.1
 * scheduler.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var iM;
function bO() {
  return iM || (iM = 1, function(r) {
    process.env.NODE_ENV !== "production" && function() {
      var n = !1, o = !0, l, h, m, w, g;
      if (typeof window > "u" || typeof MessageChannel != "function") {
        var S = null, C = null, I = function() {
          if (S !== null)
            try {
              var ne = r.unstable_now(), de = !0;
              S(de, ne), S = null;
            } catch (Je) {
              throw setTimeout(I, 0), Je;
            }
        }, A = Date.now();
        r.unstable_now = function() {
          return Date.now() - A;
        }, l = function(ne) {
          S !== null ? setTimeout(l, 0, ne) : (S = ne, setTimeout(I, 0));
        }, h = function(ne, de) {
          C = setTimeout(ne, de);
        }, m = function() {
          clearTimeout(C);
        }, w = function() {
          return !1;
        }, g = r.unstable_forceFrameRate = function() {
        };
      } else {
        var z = window.performance, F = window.Date, j = window.setTimeout, q = window.clearTimeout;
        if (typeof console < "u") {
          var Y = window.requestAnimationFrame, fe = window.cancelAnimationFrame;
          typeof Y != "function" && console.error("This browser doesn't support requestAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"), typeof fe != "function" && console.error("This browser doesn't support cancelAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills");
        }
        if (typeof z == "object" && typeof z.now == "function")
          r.unstable_now = function() {
            return z.now();
          };
        else {
          var se = F.now();
          r.unstable_now = function() {
            return F.now() - se;
          };
        }
        var Z = !1, le = null, oe = -1, ke = 5, $e = 0;
        w = function() {
          return r.unstable_now() >= $e;
        }, g = function() {
        }, r.unstable_forceFrameRate = function(ne) {
          if (ne < 0 || ne > 125) {
            console.error("forceFrameRate takes a positive int between 0 and 125, forcing framerates higher than 125 fps is not unsupported");
            return;
          }
          ne > 0 ? ke = Math.floor(1e3 / ne) : ke = 5;
        };
        var ze = function() {
          if (le !== null) {
            var ne = r.unstable_now();
            $e = ne + ke;
            var de = !0;
            try {
              var Je = le(de, ne);
              Je ? he.postMessage(null) : (Z = !1, le = null);
            } catch (pt) {
              throw he.postMessage(null), pt;
            }
          } else
            Z = !1;
        }, G = new MessageChannel(), he = G.port2;
        G.port1.onmessage = ze, l = function(ne) {
          le = ne, Z || (Z = !0, he.postMessage(null));
        }, h = function(ne, de) {
          oe = j(function() {
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
          if (Yt !== void 0 && Ze(Yt, de) > 0)
            ne[Jt] = de, ne[pt] = Yt, pt = Jt;
          else
            return;
        }
      }
      function ce(ne, de, Je) {
        for (var pt = Je, Jt = ne.length; pt < Jt; ) {
          var Yt = (pt + 1) * 2 - 1, fn = ne[Yt], ti = Yt + 1, qt = ne[ti];
          if (fn !== void 0 && Ze(fn, de) < 0)
            qt !== void 0 && Ze(qt, fn) < 0 ? (ne[pt] = qt, ne[ti] = de, pt = ti) : (ne[pt] = fn, ne[Yt] = de, pt = Yt);
          else if (qt !== void 0 && Ze(qt, de) < 0)
            ne[pt] = qt, ne[ti] = de, pt = ti;
          else
            return;
        }
      }
      function Ze(ne, de) {
        var Je = ne.sortIndex - de.sortIndex;
        return Je !== 0 ? Je : ne.id - de.id;
      }
      var Se = 0, He = 1, Re = 2, Qe = 3, Tt = 4, Bt = 5, Ge = 0, re = 0, D = 4, B = typeof SharedArrayBuffer == "function" ? new SharedArrayBuffer(D * Int32Array.BYTES_PER_ELEMENT) : typeof ArrayBuffer == "function" ? new ArrayBuffer(D * Int32Array.BYTES_PER_ELEMENT) : null, ee = B !== null ? new Int32Array(B) : [], Ce = 0, ge = 1, it = 2, Xe = 3;
      ee[Ce] = Se, ee[Xe] = 0, ee[ge] = 0;
      var Be = 131072, dt = 524288, gt = 0, Zt = null, Mt = null, bn = 0, Ft = 1, Vi = 2, Ci = 3, Jn = 4, Ne = 5, st = 6, We = 7, jt = 8;
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
        ee[Ce] = Se, ee[ge] = 0, ee[Xe]--, Mt !== null && Sn([Vi, de * 1e3, ne.id]);
      }
      function Ui(ne, de) {
        ee[Xe]--, Mt !== null && Sn([Jn, de * 1e3, ne.id]);
      }
      function Ma(ne, de) {
        ee[Ce] = Se, ee[ge] = 0, ee[Xe]--, Mt !== null && Sn([Ci, de * 1e3, ne.id]);
      }
      function Ea(ne, de) {
        Ge++, ee[Ce] = ne.priorityLevel, ee[ge] = ne.id, ee[it] = Ge, Mt !== null && Sn([Ne, de * 1e3, ne.id, Ge]);
      }
      function di(ne, de) {
        ee[Ce] = Se, ee[ge] = 0, ee[it] = 0, Mt !== null && Sn([st, de * 1e3, ne.id, Ge]);
      }
      function tr(ne) {
        re++, Mt !== null && Sn([We, ne * 1e3, re]);
      }
      function fi(ne) {
        Mt !== null && Sn([jt, ne * 1e3, re]);
      }
      var Ia = 1073741823, Ti = -1, Xr = 250, Cs = 5e3, Er = 1e4, Ir = Ia, vn = [], qn = [], Aa = 1, kt = null, rn = Qe, Mi = !1, kn = !1, Ei = !1;
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
            kn = !0, l(Ra);
          else {
            var de = ie(qn);
            de !== null && h(Jr, de.startTime - ne);
          }
      }
      function Ra(ne, de) {
        fi(de), kn = !1, Ei && (Ei = !1, m()), Mi = !0;
        var Je = rn;
        try {
          if (o)
            try {
              return yo(ne, de);
            } catch (Yt) {
              if (kt !== null) {
                var pt = r.unstable_now();
                Ma(kt, pt), kt.isQueued = !1;
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
        for (Kn(Je), kt = ie(vn); kt !== null && !n && !(kt.expirationTime > Je && (!ne || w())); ) {
          var pt = kt.callback;
          if (pt !== null) {
            kt.callback = null, rn = kt.priorityLevel;
            var Jt = kt.expirationTime <= Je;
            Ea(kt, Je);
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
          case He:
          case Re:
          case Qe:
          case Tt:
          case Bt:
            break;
          default:
            ne = Qe;
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
          case He:
          case Re:
          case Qe:
            de = Qe;
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
      function Da(ne) {
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
          case He:
            return Ti;
          case Re:
            return Xr;
          case Bt:
            return Ir;
          case Tt:
            return Er;
          case Qe:
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
          id: Aa++,
          callback: de,
          priorityLevel: ne,
          startTime: Jt,
          expirationTime: ti,
          sortIndex: -1
        };
        return qt.isQueued = !1, Jt > pt ? (qt.sortIndex = Jt, be(qn, qt), ie(vn) === null && qt === ie(qn) && (Ei ? m() : Ei = !0, h(Jr, Jt - pt))) : (qt.sortIndex = ti, be(vn, qt), jn(qt, pt), qt.isQueued = !0, !kn && !Mi && (kn = !0, l(Ra))), qt;
      }
      function qr() {
      }
      function ei() {
        !kn && !Mi && (kn = !0, l(Ra));
      }
      function Rr() {
        return ie(vn);
      }
      function Vn(ne) {
        if (ne.isQueued) {
          var de = r.unstable_now();
          Ui(ne, de), ne.isQueued = !1;
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
        return de !== kt && kt !== null && de !== null && de.callback !== null && de.startTime <= ne && de.expirationTime < kt.expirationTime || w();
      }
      var Kr = g, Es = {
        startLoggingProfilingEvents: ci,
        stopLoggingProfilingEvents: Mr,
        sharedProfilingBuffer: B
      };
      r.unstable_IdlePriority = Bt, r.unstable_ImmediatePriority = He, r.unstable_LowPriority = Tt, r.unstable_NormalPriority = Qe, r.unstable_Profiling = Es, r.unstable_UserBlockingPriority = Re, r.unstable_cancelCallback = Vn, r.unstable_continueExecution = ei, r.unstable_getCurrentPriorityLevel = nr, r.unstable_getFirstCallbackNode = Rr, r.unstable_next = Ts, r.unstable_pauseExecution = qr, r.unstable_requestPaint = Kr, r.unstable_runWithPriority = wo, r.unstable_scheduleCallback = Ar, r.unstable_shouldYield = Ms, r.unstable_wrapCallback = Da;
    }();
  }(Pb)), Pb;
}
var rM;
function $E() {
  return rM || (rM = 1, function(r) {
    process.env.NODE_ENV === "production" ? r.exports = wO() : r.exports = bO();
  }(kb)), kb.exports;
}
/** @license React v16.14.0
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var aM;
function SO() {
  if (aM)
    return Sr;
  aM = 1;
  var r = hl.exports, n = Tg(), o = $E();
  function l(i) {
    for (var a = "https://reactjs.org/docs/error-decoder.html?invariant=" + i, c = 1; c < arguments.length; c++)
      a += "&args[]=" + encodeURIComponent(arguments[c]);
    return "Minified React error #" + i + "; visit " + a + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  if (!r)
    throw Error(l(227));
  function h(i, a, c, f, v, x, T, R, W) {
    var U = Array.prototype.slice.call(arguments, 3);
    try {
      a.apply(c, U);
    } catch (Me) {
      this.onError(Me);
    }
  }
  var m = !1, w = null, g = !1, S = null, C = { onError: function(i) {
    m = !0, w = i;
  } };
  function I(i, a, c, f, v, x, T, R, W) {
    m = !1, w = null, h.apply(C, arguments);
  }
  function A(i, a, c, f, v, x, T, R, W) {
    if (I.apply(this, arguments), m) {
      if (m) {
        var U = w;
        m = !1, w = null;
      } else
        throw Error(l(198));
      g || (g = !0, S = U);
    }
  }
  var z = null, F = null, j = null;
  function q(i, a, c) {
    var f = i.type || "unknown-event";
    i.currentTarget = j(c), A(f, a, void 0, i), i.currentTarget = null;
  }
  var Y = null, fe = {};
  function se() {
    if (Y)
      for (var i in fe) {
        var a = fe[i], c = Y.indexOf(i);
        if (!(-1 < c))
          throw Error(l(96, i));
        if (!le[c]) {
          if (!a.extractEvents)
            throw Error(l(97, i));
          le[c] = a, c = a.eventTypes;
          for (var f in c) {
            var v = void 0, x = c[f], T = a, R = f;
            if (oe.hasOwnProperty(R))
              throw Error(l(99, R));
            oe[R] = x;
            var W = x.phasedRegistrationNames;
            if (W) {
              for (v in W)
                W.hasOwnProperty(v) && Z(W[v], T, R);
              v = !0;
            } else
              x.registrationName ? (Z(x.registrationName, T, R), v = !0) : v = !1;
            if (!v)
              throw Error(l(98, f, i));
          }
        }
      }
  }
  function Z(i, a, c) {
    if (ke[i])
      throw Error(l(100, i));
    ke[i] = a, $e[i] = a.eventTypes[c].dependencies;
  }
  var le = [], oe = {}, ke = {}, $e = {};
  function ze(i) {
    var a = !1, c;
    for (c in i)
      if (i.hasOwnProperty(c)) {
        var f = i[c];
        if (!fe.hasOwnProperty(c) || fe[c] !== f) {
          if (fe[c])
            throw Error(l(102, c));
          fe[c] = f, a = !0;
        }
      }
    a && se();
  }
  var G = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), he = null, be = null, ie = null;
  function ct(i) {
    if (i = F(i)) {
      if (typeof he != "function")
        throw Error(l(280));
      var a = i.stateNode;
      a && (a = z(a), he(i.stateNode, i.type, a));
    }
  }
  function Oe(i) {
    be ? ie ? ie.push(i) : ie = [i] : be = i;
  }
  function ce() {
    if (be) {
      var i = be, a = ie;
      if (ie = be = null, ct(i), a)
        for (i = 0; i < a.length; i++)
          ct(a[i]);
    }
  }
  function Ze(i, a) {
    return i(a);
  }
  function Se(i, a, c, f, v) {
    return i(a, c, f, v);
  }
  function He() {
  }
  var Re = Ze, Qe = !1, Tt = !1;
  function Bt() {
    (be !== null || ie !== null) && (He(), ce());
  }
  function Ge(i, a, c) {
    if (Tt)
      return i(a, c);
    Tt = !0;
    try {
      return Re(i, a, c);
    } finally {
      Tt = !1, Bt();
    }
  }
  var re = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, D = Object.prototype.hasOwnProperty, B = {}, ee = {};
  function Ce(i) {
    return D.call(ee, i) ? !0 : D.call(B, i) ? !1 : re.test(i) ? ee[i] = !0 : (B[i] = !0, !1);
  }
  function ge(i, a, c, f) {
    if (c !== null && c.type === 0)
      return !1;
    switch (typeof a) {
      case "function":
      case "symbol":
        return !0;
      case "boolean":
        return f ? !1 : c !== null ? !c.acceptsBooleans : (i = i.toLowerCase().slice(0, 5), i !== "data-" && i !== "aria-");
      default:
        return !1;
    }
  }
  function it(i, a, c, f) {
    if (a === null || typeof a > "u" || ge(i, a, c, f))
      return !0;
    if (f)
      return !1;
    if (c !== null)
      switch (c.type) {
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
  function Xe(i, a, c, f, v, x) {
    this.acceptsBooleans = a === 2 || a === 3 || a === 4, this.attributeName = f, this.attributeNamespace = v, this.mustUseProperty = c, this.propertyName = i, this.type = a, this.sanitizeURL = x;
  }
  var Be = {};
  "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(i) {
    Be[i] = new Xe(i, 0, !1, i, null, !1);
  }), [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(i) {
    var a = i[0];
    Be[a] = new Xe(a, 1, !1, i[1], null, !1);
  }), ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(i) {
    Be[i] = new Xe(i, 2, !1, i.toLowerCase(), null, !1);
  }), ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(i) {
    Be[i] = new Xe(i, 2, !1, i, null, !1);
  }), "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(i) {
    Be[i] = new Xe(i, 3, !1, i.toLowerCase(), null, !1);
  }), ["checked", "multiple", "muted", "selected"].forEach(function(i) {
    Be[i] = new Xe(i, 3, !0, i, null, !1);
  }), ["capture", "download"].forEach(function(i) {
    Be[i] = new Xe(i, 4, !1, i, null, !1);
  }), ["cols", "rows", "size", "span"].forEach(function(i) {
    Be[i] = new Xe(i, 6, !1, i, null, !1);
  }), ["rowSpan", "start"].forEach(function(i) {
    Be[i] = new Xe(i, 5, !1, i.toLowerCase(), null, !1);
  });
  var dt = /[\-:]([a-z])/g;
  function gt(i) {
    return i[1].toUpperCase();
  }
  "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(i) {
    var a = i.replace(
      dt,
      gt
    );
    Be[a] = new Xe(a, 1, !1, i, null, !1);
  }), "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(i) {
    var a = i.replace(dt, gt);
    Be[a] = new Xe(a, 1, !1, i, "http://www.w3.org/1999/xlink", !1);
  }), ["xml:base", "xml:lang", "xml:space"].forEach(function(i) {
    var a = i.replace(dt, gt);
    Be[a] = new Xe(a, 1, !1, i, "http://www.w3.org/XML/1998/namespace", !1);
  }), ["tabIndex", "crossOrigin"].forEach(function(i) {
    Be[i] = new Xe(i, 1, !1, i.toLowerCase(), null, !1);
  }), Be.xlinkHref = new Xe("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0), ["src", "href", "action", "formAction"].forEach(function(i) {
    Be[i] = new Xe(i, 1, !1, i.toLowerCase(), null, !0);
  });
  var Zt = r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  Zt.hasOwnProperty("ReactCurrentDispatcher") || (Zt.ReactCurrentDispatcher = { current: null }), Zt.hasOwnProperty("ReactCurrentBatchConfig") || (Zt.ReactCurrentBatchConfig = { suspense: null });
  function Mt(i, a, c, f) {
    var v = Be.hasOwnProperty(a) ? Be[a] : null, x = v !== null ? v.type === 0 : f ? !1 : !(!(2 < a.length) || a[0] !== "o" && a[0] !== "O" || a[1] !== "n" && a[1] !== "N");
    x || (it(a, c, v, f) && (c = null), f || v === null ? Ce(a) && (c === null ? i.removeAttribute(a) : i.setAttribute(a, "" + c)) : v.mustUseProperty ? i[v.propertyName] = c === null ? v.type === 3 ? !1 : "" : c : (a = v.attributeName, f = v.attributeNamespace, c === null ? i.removeAttribute(a) : (v = v.type, c = v === 3 || v === 4 && c === !0 ? "" : "" + c, f ? i.setAttributeNS(f, a, c) : i.setAttribute(a, c))));
  }
  var bn = /^(.*)[\\\/]/, Ft = typeof Symbol == "function" && Symbol.for, Vi = Ft ? Symbol.for("react.element") : 60103, Ci = Ft ? Symbol.for("react.portal") : 60106, Jn = Ft ? Symbol.for("react.fragment") : 60107, Ne = Ft ? Symbol.for("react.strict_mode") : 60108, st = Ft ? Symbol.for("react.profiler") : 60114, We = Ft ? Symbol.for("react.provider") : 60109, jt = Ft ? Symbol.for("react.context") : 60110, Sn = Ft ? Symbol.for("react.concurrent_mode") : 60111, ci = Ft ? Symbol.for("react.forward_ref") : 60112, Mr = Ft ? Symbol.for("react.suspense") : 60113, jn = Ft ? Symbol.for("react.suspense_list") : 60120, Gr = Ft ? Symbol.for("react.memo") : 60115, Ui = Ft ? Symbol.for("react.lazy") : 60116, Ma = Ft ? Symbol.for("react.block") : 60121, Ea = typeof Symbol == "function" && Symbol.iterator;
  function di(i) {
    return i === null || typeof i != "object" ? null : (i = Ea && i[Ea] || i["@@iterator"], typeof i == "function" ? i : null);
  }
  function tr(i) {
    if (i._status === -1) {
      i._status = 0;
      var a = i._ctor;
      a = a(), i._result = a, a.then(function(c) {
        i._status === 0 && (c = c.default, i._status = 1, i._result = c);
      }, function(c) {
        i._status === 0 && (i._status = 2, i._result = c);
      });
    }
  }
  function fi(i) {
    if (i == null)
      return null;
    if (typeof i == "function")
      return i.displayName || i.name || null;
    if (typeof i == "string")
      return i;
    switch (i) {
      case Jn:
        return "Fragment";
      case Ci:
        return "Portal";
      case st:
        return "Profiler";
      case Ne:
        return "StrictMode";
      case Mr:
        return "Suspense";
      case jn:
        return "SuspenseList";
    }
    if (typeof i == "object")
      switch (i.$$typeof) {
        case jt:
          return "Context.Consumer";
        case We:
          return "Context.Provider";
        case ci:
          var a = i.render;
          return a = a.displayName || a.name || "", i.displayName || (a !== "" ? "ForwardRef(" + a + ")" : "ForwardRef");
        case Gr:
          return fi(i.type);
        case Ma:
          return fi(i.render);
        case Ui:
          if (i = i._status === 1 ? i._result : null)
            return fi(i);
      }
    return null;
  }
  function Ia(i) {
    var a = "";
    do {
      e:
        switch (i.tag) {
          case 3:
          case 4:
          case 6:
          case 7:
          case 10:
          case 9:
            var c = "";
            break e;
          default:
            var f = i._debugOwner, v = i._debugSource, x = fi(i.type);
            c = null, f && (c = fi(f.type)), f = x, x = "", v ? x = " (at " + v.fileName.replace(bn, "") + ":" + v.lineNumber + ")" : c && (x = " (created by " + c + ")"), c = `
    in ` + (f || "Unknown") + x;
        }
      a += c, i = i.return;
    } while (i);
    return a;
  }
  function Ti(i) {
    switch (typeof i) {
      case "boolean":
      case "number":
      case "object":
      case "string":
      case "undefined":
        return i;
      default:
        return "";
    }
  }
  function Xr(i) {
    var a = i.type;
    return (i = i.nodeName) && i.toLowerCase() === "input" && (a === "checkbox" || a === "radio");
  }
  function Cs(i) {
    var a = Xr(i) ? "checked" : "value", c = Object.getOwnPropertyDescriptor(i.constructor.prototype, a), f = "" + i[a];
    if (!i.hasOwnProperty(a) && typeof c < "u" && typeof c.get == "function" && typeof c.set == "function") {
      var v = c.get, x = c.set;
      return Object.defineProperty(i, a, { configurable: !0, get: function() {
        return v.call(this);
      }, set: function(T) {
        f = "" + T, x.call(this, T);
      } }), Object.defineProperty(i, a, { enumerable: c.enumerable }), { getValue: function() {
        return f;
      }, setValue: function(T) {
        f = "" + T;
      }, stopTracking: function() {
        i._valueTracker = null, delete i[a];
      } };
    }
  }
  function Er(i) {
    i._valueTracker || (i._valueTracker = Cs(i));
  }
  function Ir(i) {
    if (!i)
      return !1;
    var a = i._valueTracker;
    if (!a)
      return !0;
    var c = a.getValue(), f = "";
    return i && (f = Xr(i) ? i.checked ? "true" : "false" : i.value), i = f, i !== c ? (a.setValue(i), !0) : !1;
  }
  function vn(i, a) {
    var c = a.checked;
    return n({}, a, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: c != null ? c : i._wrapperState.initialChecked });
  }
  function qn(i, a) {
    var c = a.defaultValue == null ? "" : a.defaultValue, f = a.checked != null ? a.checked : a.defaultChecked;
    c = Ti(a.value != null ? a.value : c), i._wrapperState = { initialChecked: f, initialValue: c, controlled: a.type === "checkbox" || a.type === "radio" ? a.checked != null : a.value != null };
  }
  function Aa(i, a) {
    a = a.checked, a != null && Mt(i, "checked", a, !1);
  }
  function kt(i, a) {
    Aa(i, a);
    var c = Ti(a.value), f = a.type;
    if (c != null)
      f === "number" ? (c === 0 && i.value === "" || i.value != c) && (i.value = "" + c) : i.value !== "" + c && (i.value = "" + c);
    else if (f === "submit" || f === "reset") {
      i.removeAttribute("value");
      return;
    }
    a.hasOwnProperty("value") ? Mi(i, a.type, c) : a.hasOwnProperty("defaultValue") && Mi(i, a.type, Ti(a.defaultValue)), a.checked == null && a.defaultChecked != null && (i.defaultChecked = !!a.defaultChecked);
  }
  function rn(i, a, c) {
    if (a.hasOwnProperty("value") || a.hasOwnProperty("defaultValue")) {
      var f = a.type;
      if (!(f !== "submit" && f !== "reset" || a.value !== void 0 && a.value !== null))
        return;
      a = "" + i._wrapperState.initialValue, c || a === i.value || (i.value = a), i.defaultValue = a;
    }
    c = i.name, c !== "" && (i.name = ""), i.defaultChecked = !!i._wrapperState.initialChecked, c !== "" && (i.name = c);
  }
  function Mi(i, a, c) {
    (a !== "number" || i.ownerDocument.activeElement !== i) && (c == null ? i.defaultValue = "" + i._wrapperState.initialValue : i.defaultValue !== "" + c && (i.defaultValue = "" + c));
  }
  function kn(i) {
    var a = "";
    return r.Children.forEach(i, function(c) {
      c != null && (a += c);
    }), a;
  }
  function Ei(i, a) {
    return i = n({ children: void 0 }, a), (a = kn(a.children)) && (i.children = a), i;
  }
  function Kn(i, a, c, f) {
    if (i = i.options, a) {
      a = {};
      for (var v = 0; v < c.length; v++)
        a["$" + c[v]] = !0;
      for (c = 0; c < i.length; c++)
        v = a.hasOwnProperty("$" + i[c].value), i[c].selected !== v && (i[c].selected = v), v && f && (i[c].defaultSelected = !0);
    } else {
      for (c = "" + Ti(c), a = null, v = 0; v < i.length; v++) {
        if (i[v].value === c) {
          i[v].selected = !0, f && (i[v].defaultSelected = !0);
          return;
        }
        a !== null || i[v].disabled || (a = i[v]);
      }
      a !== null && (a.selected = !0);
    }
  }
  function Jr(i, a) {
    if (a.dangerouslySetInnerHTML != null)
      throw Error(l(91));
    return n({}, a, { value: void 0, defaultValue: void 0, children: "" + i._wrapperState.initialValue });
  }
  function Ra(i, a) {
    var c = a.value;
    if (c == null) {
      if (c = a.children, a = a.defaultValue, c != null) {
        if (a != null)
          throw Error(l(92));
        if (Array.isArray(c)) {
          if (!(1 >= c.length))
            throw Error(l(93));
          c = c[0];
        }
        a = c;
      }
      a == null && (a = ""), c = a;
    }
    i._wrapperState = { initialValue: Ti(c) };
  }
  function yo(i, a) {
    var c = Ti(a.value), f = Ti(a.defaultValue);
    c != null && (c = "" + c, c !== i.value && (i.value = c), a.defaultValue == null && i.defaultValue !== c && (i.defaultValue = c)), f != null && (i.defaultValue = "" + f);
  }
  function wo(i) {
    var a = i.textContent;
    a === i._wrapperState.initialValue && a !== "" && a !== null && (i.value = a);
  }
  var Ts = { html: "http://www.w3.org/1999/xhtml", mathml: "http://www.w3.org/1998/Math/MathML", svg: "http://www.w3.org/2000/svg" };
  function Da(i) {
    switch (i) {
      case "svg":
        return "http://www.w3.org/2000/svg";
      case "math":
        return "http://www.w3.org/1998/Math/MathML";
      default:
        return "http://www.w3.org/1999/xhtml";
    }
  }
  function _n(i, a) {
    return i == null || i === "http://www.w3.org/1999/xhtml" ? Da(a) : i === "http://www.w3.org/2000/svg" && a === "foreignObject" ? "http://www.w3.org/1999/xhtml" : i;
  }
  var Ar, qr = function(i) {
    return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(a, c, f, v) {
      MSApp.execUnsafeLocalFunction(function() {
        return i(a, c, f, v);
      });
    } : i;
  }(function(i, a) {
    if (i.namespaceURI !== Ts.svg || "innerHTML" in i)
      i.innerHTML = a;
    else {
      for (Ar = Ar || document.createElement("div"), Ar.innerHTML = "<svg>" + a.valueOf().toString() + "</svg>", a = Ar.firstChild; i.firstChild; )
        i.removeChild(i.firstChild);
      for (; a.firstChild; )
        i.appendChild(a.firstChild);
    }
  });
  function ei(i, a) {
    if (a) {
      var c = i.firstChild;
      if (c && c === i.lastChild && c.nodeType === 3) {
        c.nodeValue = a;
        return;
      }
    }
    i.textContent = a;
  }
  function Rr(i, a) {
    var c = {};
    return c[i.toLowerCase()] = a.toLowerCase(), c["Webkit" + i] = "webkit" + a, c["Moz" + i] = "moz" + a, c;
  }
  var Vn = { animationend: Rr("Animation", "AnimationEnd"), animationiteration: Rr("Animation", "AnimationIteration"), animationstart: Rr("Animation", "AnimationStart"), transitionend: Rr("Transition", "TransitionEnd") }, nr = {}, Ms = {};
  G && (Ms = document.createElement("div").style, "AnimationEvent" in window || (delete Vn.animationend.animation, delete Vn.animationiteration.animation, delete Vn.animationstart.animation), "TransitionEvent" in window || delete Vn.transitionend.transition);
  function Kr(i) {
    if (nr[i])
      return nr[i];
    if (!Vn[i])
      return i;
    var a = Vn[i], c;
    for (c in a)
      if (a.hasOwnProperty(c) && c in Ms)
        return nr[i] = a[c];
    return i;
  }
  var Es = Kr("animationend"), ne = Kr("animationiteration"), de = Kr("animationstart"), Je = Kr("transitionend"), pt = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), Jt = new (typeof WeakMap == "function" ? WeakMap : Map)();
  function Yt(i) {
    var a = Jt.get(i);
    return a === void 0 && (a = /* @__PURE__ */ new Map(), Jt.set(i, a)), a;
  }
  function fn(i) {
    var a = i, c = i;
    if (i.alternate)
      for (; a.return; )
        a = a.return;
    else {
      i = a;
      do
        a = i, (a.effectTag & 1026) !== 0 && (c = a.return), i = a.return;
      while (i);
    }
    return a.tag === 3 ? c : null;
  }
  function ti(i) {
    if (i.tag === 13) {
      var a = i.memoizedState;
      if (a === null && (i = i.alternate, i !== null && (a = i.memoizedState)), a !== null)
        return a.dehydrated;
    }
    return null;
  }
  function qt(i) {
    if (fn(i) !== i)
      throw Error(l(188));
  }
  function Na(i) {
    var a = i.alternate;
    if (!a) {
      if (a = fn(i), a === null)
        throw Error(l(188));
      return a !== i ? null : i;
    }
    for (var c = i, f = a; ; ) {
      var v = c.return;
      if (v === null)
        break;
      var x = v.alternate;
      if (x === null) {
        if (f = v.return, f !== null) {
          c = f;
          continue;
        }
        break;
      }
      if (v.child === x.child) {
        for (x = v.child; x; ) {
          if (x === c)
            return qt(v), i;
          if (x === f)
            return qt(v), a;
          x = x.sibling;
        }
        throw Error(l(188));
      }
      if (c.return !== f.return)
        c = v, f = x;
      else {
        for (var T = !1, R = v.child; R; ) {
          if (R === c) {
            T = !0, c = v, f = x;
            break;
          }
          if (R === f) {
            T = !0, f = v, c = x;
            break;
          }
          R = R.sibling;
        }
        if (!T) {
          for (R = x.child; R; ) {
            if (R === c) {
              T = !0, c = x, f = v;
              break;
            }
            if (R === f) {
              T = !0, f = x, c = v;
              break;
            }
            R = R.sibling;
          }
          if (!T)
            throw Error(l(189));
        }
      }
      if (c.alternate !== f)
        throw Error(l(190));
    }
    if (c.tag !== 3)
      throw Error(l(188));
    return c.stateNode.current === c ? i : a;
  }
  function bo(i) {
    if (i = Na(i), !i)
      return null;
    for (var a = i; ; ) {
      if (a.tag === 5 || a.tag === 6)
        return a;
      if (a.child)
        a.child.return = a, a = a.child;
      else {
        if (a === i)
          break;
        for (; !a.sibling; ) {
          if (!a.return || a.return === i)
            return null;
          a = a.return;
        }
        a.sibling.return = a.return, a = a.sibling;
      }
    }
    return null;
  }
  function an(i, a) {
    if (a == null)
      throw Error(l(30));
    return i == null ? a : Array.isArray(i) ? Array.isArray(a) ? (i.push.apply(i, a), i) : (i.push(a), i) : Array.isArray(a) ? [i].concat(a) : [i, a];
  }
  function hn(i, a, c) {
    Array.isArray(i) ? i.forEach(a, c) : i && a.call(c, i);
  }
  var Is = null;
  function pl(i) {
    if (i) {
      var a = i._dispatchListeners, c = i._dispatchInstances;
      if (Array.isArray(a))
        for (var f = 0; f < a.length && !i.isPropagationStopped(); f++)
          q(i, a[f], c[f]);
      else
        a && q(i, a, c);
      i._dispatchListeners = null, i._dispatchInstances = null, i.isPersistent() || i.constructor.release(i);
    }
  }
  function ea(i) {
    if (i !== null && (Is = an(Is, i)), i = Is, Is = null, i) {
      if (hn(i, pl), Is)
        throw Error(l(95));
      if (g)
        throw i = S, g = !1, S = null, i;
    }
  }
  function ml(i) {
    return i = i.target || i.srcElement || window, i.correspondingUseElement && (i = i.correspondingUseElement), i.nodeType === 3 ? i.parentNode : i;
  }
  function Lu(i) {
    if (!G)
      return !1;
    i = "on" + i;
    var a = i in document;
    return a || (a = document.createElement("div"), a.setAttribute(i, "return;"), a = typeof a[i] == "function"), a;
  }
  var As = [];
  function vl(i) {
    i.topLevelType = null, i.nativeEvent = null, i.targetInst = null, i.ancestors.length = 0, 10 > As.length && As.push(i);
  }
  function Bu(i, a, c, f) {
    if (As.length) {
      var v = As.pop();
      return v.topLevelType = i, v.eventSystemFlags = f, v.nativeEvent = a, v.targetInst = c, v;
    }
    return { topLevelType: i, eventSystemFlags: f, nativeEvent: a, targetInst: c, ancestors: [] };
  }
  function gl(i) {
    var a = i.targetInst, c = a;
    do {
      if (!c) {
        i.ancestors.push(c);
        break;
      }
      var f = c;
      if (f.tag === 3)
        f = f.stateNode.containerInfo;
      else {
        for (; f.return; )
          f = f.return;
        f = f.tag !== 3 ? null : f.stateNode.containerInfo;
      }
      if (!f)
        break;
      a = c.tag, a !== 5 && a !== 6 || i.ancestors.push(c), c = Ao(f);
    } while (c);
    for (c = 0; c < i.ancestors.length; c++) {
      a = i.ancestors[c];
      var v = ml(i.nativeEvent);
      f = i.topLevelType;
      var x = i.nativeEvent, T = i.eventSystemFlags;
      c === 0 && (T |= 64);
      for (var R = null, W = 0; W < le.length; W++) {
        var U = le[W];
        U && (U = U.extractEvents(f, a, x, v, T)) && (R = an(R, U));
      }
      ea(R);
    }
  }
  function M(i, a, c) {
    if (!c.has(i)) {
      switch (i) {
        case "scroll":
          rr(a, "scroll", !0);
          break;
        case "focus":
        case "blur":
          rr(a, "focus", !0), rr(a, "blur", !0), c.set("blur", null), c.set("focus", null);
          break;
        case "cancel":
        case "close":
          Lu(i) && rr(a, i, !0);
          break;
        case "invalid":
        case "submit":
        case "reset":
          break;
        default:
          pt.indexOf(i) === -1 && ft(i, a);
      }
      c.set(i, null);
    }
  }
  var _, H, X, xe = !1, Ye = [], je = null, tt = null, Nt = null, gn = /* @__PURE__ */ new Map(), xn = /* @__PURE__ */ new Map(), Mn = [], ni = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput close cancel copy cut paste click change contextmenu reset submit".split(" "), ii = "focus blur dragenter dragleave mouseover mouseout pointerover pointerout gotpointercapture lostpointercapture".split(" ");
  function So(i, a) {
    var c = Yt(a);
    ni.forEach(function(f) {
      M(f, a, c);
    }), ii.forEach(function(f) {
      M(f, a, c);
    });
  }
  function ta(i, a, c, f, v) {
    return { blockedOn: i, topLevelType: a, eventSystemFlags: c | 32, nativeEvent: v, container: f };
  }
  function ir(i, a) {
    switch (i) {
      case "focus":
      case "blur":
        je = null;
        break;
      case "dragenter":
      case "dragleave":
        tt = null;
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
  function xo(i, a, c, f, v, x) {
    return i === null || i.nativeEvent !== x ? (i = ta(a, c, f, v, x), a !== null && (a = Sl(a), a !== null && H(a)), i) : (i.eventSystemFlags |= f, i);
  }
  function mp(i, a, c, f, v) {
    switch (a) {
      case "focus":
        return je = xo(je, i, a, c, f, v), !0;
      case "dragenter":
        return tt = xo(tt, i, a, c, f, v), !0;
      case "mouseover":
        return Nt = xo(Nt, i, a, c, f, v), !0;
      case "pointerover":
        var x = v.pointerId;
        return gn.set(x, xo(gn.get(x) || null, i, a, c, f, v)), !0;
      case "gotpointercapture":
        return x = v.pointerId, xn.set(x, xo(xn.get(x) || null, i, a, c, f, v)), !0;
    }
    return !1;
  }
  function Mg(i) {
    var a = Ao(i.target);
    if (a !== null) {
      var c = fn(a);
      if (c !== null) {
        if (a = c.tag, a === 13) {
          if (a = ti(c), a !== null) {
            i.blockedOn = a, o.unstable_runWithPriority(i.priority, function() {
              X(c);
            });
            return;
          }
        } else if (a === 3 && c.stateNode.hydrate) {
          i.blockedOn = c.tag === 3 ? c.stateNode.containerInfo : null;
          return;
        }
      }
    }
    i.blockedOn = null;
  }
  function Dr(i) {
    if (i.blockedOn !== null)
      return !1;
    var a = kr(i.topLevelType, i.eventSystemFlags, i.container, i.nativeEvent);
    if (a !== null) {
      var c = Sl(a);
      return c !== null && H(c), i.blockedOn = a, !1;
    }
    return !0;
  }
  function vp(i, a, c) {
    Dr(i) && c.delete(a);
  }
  function zd() {
    for (xe = !1; 0 < Ye.length; ) {
      var i = Ye[0];
      if (i.blockedOn !== null) {
        i = Sl(i.blockedOn), i !== null && _(i);
        break;
      }
      var a = kr(i.topLevelType, i.eventSystemFlags, i.container, i.nativeEvent);
      a !== null ? i.blockedOn = a : Ye.shift();
    }
    je !== null && Dr(je) && (je = null), tt !== null && Dr(tt) && (tt = null), Nt !== null && Dr(Nt) && (Nt = null), gn.forEach(vp), xn.forEach(vp);
  }
  function Rs(i, a) {
    i.blockedOn === a && (i.blockedOn = null, xe || (xe = !0, o.unstable_scheduleCallback(o.unstable_NormalPriority, zd)));
  }
  function gp(i) {
    function a(v) {
      return Rs(v, i);
    }
    if (0 < Ye.length) {
      Rs(Ye[0], i);
      for (var c = 1; c < Ye.length; c++) {
        var f = Ye[c];
        f.blockedOn === i && (f.blockedOn = null);
      }
    }
    for (je !== null && Rs(je, i), tt !== null && Rs(tt, i), Nt !== null && Rs(Nt, i), gn.forEach(a), xn.forEach(a), c = 0; c < Mn.length; c++)
      f = Mn[c], f.blockedOn === i && (f.blockedOn = null);
    for (; 0 < Mn.length && (c = Mn[0], c.blockedOn === null); )
      Mg(c), c.blockedOn === null && Mn.shift();
  }
  var Od = {}, yp = /* @__PURE__ */ new Map(), Ld = /* @__PURE__ */ new Map(), Te = [
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
  function ju(i, a) {
    for (var c = 0; c < i.length; c += 2) {
      var f = i[c], v = i[c + 1], x = "on" + (v[0].toUpperCase() + v.slice(1));
      x = { phasedRegistrationNames: { bubbled: x, captured: x + "Capture" }, dependencies: [f], eventPriority: a }, Ld.set(f, a), yp.set(f, x), Od[v] = x;
    }
  }
  ju("blur blur cancel cancel click click close close contextmenu contextMenu copy copy cut cut auxclick auxClick dblclick doubleClick dragend dragEnd dragstart dragStart drop drop focus focus input input invalid invalid keydown keyDown keypress keyPress keyup keyUp mousedown mouseDown mouseup mouseUp paste paste pause pause play play pointercancel pointerCancel pointerdown pointerDown pointerup pointerUp ratechange rateChange reset reset seeked seeked submit submit touchcancel touchCancel touchend touchEnd touchstart touchStart volumechange volumeChange".split(" "), 0), ju("drag drag dragenter dragEnter dragexit dragExit dragleave dragLeave dragover dragOver mousemove mouseMove mouseout mouseOut mouseover mouseOver pointermove pointerMove pointerout pointerOut pointerover pointerOver scroll scroll toggle toggle touchmove touchMove wheel wheel".split(" "), 1), ju(Te, 2);
  for (var wp = "change selectionchange textInput compositionstart compositionend compositionupdate".split(" "), $n = 0; $n < wp.length; $n++)
    Ld.set(wp[$n], 0);
  var na = o.unstable_UserBlockingPriority, yl = o.unstable_runWithPriority, ka = !0;
  function ft(i, a) {
    rr(a, i, !1);
  }
  function rr(i, a, c) {
    var f = Ld.get(a);
    switch (f === void 0 ? 2 : f) {
      case 0:
        f = Co.bind(null, a, 1, i);
        break;
      case 1:
        f = Nr.bind(null, a, 1, i);
        break;
      default:
        f = ri.bind(null, a, 1, i);
    }
    c ? i.addEventListener(a, f, !0) : i.addEventListener(a, f, !1);
  }
  function Co(i, a, c, f) {
    Qe || He();
    var v = ri, x = Qe;
    Qe = !0;
    try {
      Se(v, i, a, c, f);
    } finally {
      (Qe = x) || Bt();
    }
  }
  function Nr(i, a, c, f) {
    yl(na, ri.bind(null, i, a, c, f));
  }
  function ri(i, a, c, f) {
    if (ka)
      if (0 < Ye.length && -1 < ni.indexOf(i))
        i = ta(null, i, a, c, f), Ye.push(i);
      else {
        var v = kr(i, a, c, f);
        if (v === null)
          ir(i, f);
        else if (-1 < ni.indexOf(i))
          i = ta(v, i, a, c, f), Ye.push(i);
        else if (!mp(v, i, a, c, f)) {
          ir(i, f), i = Bu(i, f, null, a);
          try {
            Ge(gl, i);
          } finally {
            vl(i);
          }
        }
      }
  }
  function kr(i, a, c, f) {
    if (c = ml(f), c = Ao(c), c !== null) {
      var v = fn(c);
      if (v === null)
        c = null;
      else {
        var x = v.tag;
        if (x === 13) {
          if (c = ti(v), c !== null)
            return c;
          c = null;
        } else if (x === 3) {
          if (v.stateNode.hydrate)
            return v.tag === 3 ? v.stateNode.containerInfo : null;
          c = null;
        } else
          v !== c && (c = null);
      }
    }
    i = Bu(i, f, c, a);
    try {
      Ge(gl, i);
    } finally {
      vl(i);
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
  }, Vu = ["Webkit", "ms", "Moz", "O"];
  Object.keys(To).forEach(function(i) {
    Vu.forEach(function(a) {
      a = a + i.charAt(0).toUpperCase() + i.substring(1), To[a] = To[i];
    });
  });
  function bp(i, a, c) {
    return a == null || typeof a == "boolean" || a === "" ? "" : c || typeof a != "number" || a === 0 || To.hasOwnProperty(i) && To[i] ? ("" + a).trim() : a + "px";
  }
  function Sp(i, a) {
    i = i.style;
    for (var c in a)
      if (a.hasOwnProperty(c)) {
        var f = c.indexOf("--") === 0, v = bp(c, a[c], f);
        c === "float" && (c = "cssFloat"), f ? i.setProperty(c, v) : i[c] = v;
      }
  }
  var xp = n({ menuitem: !0 }, { area: !0, base: !0, br: !0, col: !0, embed: !0, hr: !0, img: !0, input: !0, keygen: !0, link: !0, meta: !0, param: !0, source: !0, track: !0, wbr: !0 });
  function Uu(i, a) {
    if (a) {
      if (xp[i] && (a.children != null || a.dangerouslySetInnerHTML != null))
        throw Error(l(137, i, ""));
      if (a.dangerouslySetInnerHTML != null) {
        if (a.children != null)
          throw Error(l(60));
        if (!(typeof a.dangerouslySetInnerHTML == "object" && "__html" in a.dangerouslySetInnerHTML))
          throw Error(l(61));
      }
      if (a.style != null && typeof a.style != "object")
        throw Error(l(62, ""));
    }
  }
  function Bd(i, a) {
    if (i.indexOf("-") === -1)
      return typeof a.is == "string";
    switch (i) {
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
  function ia(i, a) {
    i = i.nodeType === 9 || i.nodeType === 11 ? i : i.ownerDocument;
    var c = Yt(i);
    a = $e[a];
    for (var f = 0; f < a.length; f++)
      M(a[f], i, c);
  }
  function Ds() {
  }
  function Hu(i) {
    if (i = i || (typeof document < "u" ? document : void 0), typeof i > "u")
      return null;
    try {
      return i.activeElement || i.body;
    } catch {
      return i.body;
    }
  }
  function jd(i) {
    for (; i && i.firstChild; )
      i = i.firstChild;
    return i;
  }
  function Vd(i, a) {
    var c = jd(i);
    i = 0;
    for (var f; c; ) {
      if (c.nodeType === 3) {
        if (f = i + c.textContent.length, i <= a && f >= a)
          return { node: c, offset: a - i };
        i = f;
      }
      e: {
        for (; c; ) {
          if (c.nextSibling) {
            c = c.nextSibling;
            break e;
          }
          c = c.parentNode;
        }
        c = void 0;
      }
      c = jd(c);
    }
  }
  function Ud(i, a) {
    return i && a ? i === a ? !0 : i && i.nodeType === 3 ? !1 : a && a.nodeType === 3 ? Ud(i, a.parentNode) : "contains" in i ? i.contains(a) : i.compareDocumentPosition ? !!(i.compareDocumentPosition(a) & 16) : !1 : !1;
  }
  function Hd() {
    for (var i = window, a = Hu(); a instanceof i.HTMLIFrameElement; ) {
      try {
        var c = typeof a.contentWindow.location.href == "string";
      } catch {
        c = !1;
      }
      if (c)
        i = a.contentWindow;
      else
        break;
      a = Hu(i.document);
    }
    return a;
  }
  function Wu(i) {
    var a = i && i.nodeName && i.nodeName.toLowerCase();
    return a && (a === "input" && (i.type === "text" || i.type === "search" || i.type === "tel" || i.type === "url" || i.type === "password") || a === "textarea" || i.contentEditable === "true");
  }
  var Fu = "$", Wd = "/$", $u = "$?", wl = "$!", Qu = null, Fd = null;
  function Tp(i, a) {
    switch (i) {
      case "button":
      case "input":
      case "select":
      case "textarea":
        return !!a.autoFocus;
    }
    return !1;
  }
  function bl(i, a) {
    return i === "textarea" || i === "option" || i === "noscript" || typeof a.children == "string" || typeof a.children == "number" || typeof a.dangerouslySetInnerHTML == "object" && a.dangerouslySetInnerHTML !== null && a.dangerouslySetInnerHTML.__html != null;
  }
  var Zu = typeof setTimeout == "function" ? setTimeout : void 0, Mp = typeof clearTimeout == "function" ? clearTimeout : void 0;
  function Mo(i) {
    for (; i != null; i = i.nextSibling) {
      var a = i.nodeType;
      if (a === 1 || a === 3)
        break;
    }
    return i;
  }
  function $d(i) {
    i = i.previousSibling;
    for (var a = 0; i; ) {
      if (i.nodeType === 8) {
        var c = i.data;
        if (c === Fu || c === wl || c === $u) {
          if (a === 0)
            return i;
          a--;
        } else
          c === Wd && a++;
      }
      i = i.previousSibling;
    }
    return null;
  }
  var Qd = Math.random().toString(36).slice(2), _r = "__reactInternalInstance$" + Qd, Eo = "__reactEventHandlers$" + Qd, Io = "__reactContainere$" + Qd;
  function Ao(i) {
    var a = i[_r];
    if (a)
      return a;
    for (var c = i.parentNode; c; ) {
      if (a = c[Io] || c[_r]) {
        if (c = a.alternate, a.child !== null || c !== null && c.child !== null)
          for (i = $d(i); i !== null; ) {
            if (c = i[_r])
              return c;
            i = $d(i);
          }
        return a;
      }
      i = c, c = i.parentNode;
    }
    return null;
  }
  function Sl(i) {
    return i = i[_r] || i[Io], !i || i.tag !== 5 && i.tag !== 6 && i.tag !== 13 && i.tag !== 3 ? null : i;
  }
  function Hi(i) {
    if (i.tag === 5 || i.tag === 6)
      return i.stateNode;
    throw Error(l(33));
  }
  function xl(i) {
    return i[Eo] || null;
  }
  function Pr(i) {
    do
      i = i.return;
    while (i && i.tag !== 5);
    return i || null;
  }
  function Ep(i, a) {
    var c = i.stateNode;
    if (!c)
      return null;
    var f = z(c);
    if (!f)
      return null;
    c = f[a];
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
          (f = !f.disabled) || (i = i.type, f = !(i === "button" || i === "input" || i === "select" || i === "textarea")), i = !f;
          break e;
        default:
          i = !1;
      }
    if (i)
      return null;
    if (c && typeof c != "function")
      throw Error(l(
        231,
        a,
        typeof c
      ));
    return c;
  }
  function Ip(i, a, c) {
    (a = Ep(i, c.dispatchConfig.phasedRegistrationNames[a])) && (c._dispatchListeners = an(c._dispatchListeners, a), c._dispatchInstances = an(c._dispatchInstances, i));
  }
  function Eg(i) {
    if (i && i.dispatchConfig.phasedRegistrationNames) {
      for (var a = i._targetInst, c = []; a; )
        c.push(a), a = Pr(a);
      for (a = c.length; 0 < a--; )
        Ip(c[a], "captured", i);
      for (a = 0; a < c.length; a++)
        Ip(c[a], "bubbled", i);
    }
  }
  function Yu(i, a, c) {
    i && c && c.dispatchConfig.registrationName && (a = Ep(i, c.dispatchConfig.registrationName)) && (c._dispatchListeners = an(c._dispatchListeners, a), c._dispatchInstances = an(c._dispatchInstances, i));
  }
  function Zd(i) {
    i && i.dispatchConfig.registrationName && Yu(i._targetInst, null, i);
  }
  function Ns(i) {
    hn(i, Eg);
  }
  var ra = null, Gu = null, Xu = null;
  function Cl() {
    if (Xu)
      return Xu;
    var i, a = Gu, c = a.length, f, v = "value" in ra ? ra.value : ra.textContent, x = v.length;
    for (i = 0; i < c && a[i] === v[i]; i++)
      ;
    var T = c - i;
    for (f = 1; f <= T && a[c - f] === v[x - f]; f++)
      ;
    return Xu = v.slice(i, 1 < f ? 1 - f : void 0);
  }
  function Tl() {
    return !0;
  }
  function Ro() {
    return !1;
  }
  function hi(i, a, c, f) {
    this.dispatchConfig = i, this._targetInst = a, this.nativeEvent = c, i = this.constructor.Interface;
    for (var v in i)
      i.hasOwnProperty(v) && ((a = i[v]) ? this[v] = a(c) : v === "target" ? this.target = f : this[v] = c[v]);
    return this.isDefaultPrevented = (c.defaultPrevented != null ? c.defaultPrevented : c.returnValue === !1) ? Tl : Ro, this.isPropagationStopped = Ro, this;
  }
  n(hi.prototype, { preventDefault: function() {
    this.defaultPrevented = !0;
    var i = this.nativeEvent;
    i && (i.preventDefault ? i.preventDefault() : typeof i.returnValue != "unknown" && (i.returnValue = !1), this.isDefaultPrevented = Tl);
  }, stopPropagation: function() {
    var i = this.nativeEvent;
    i && (i.stopPropagation ? i.stopPropagation() : typeof i.cancelBubble != "unknown" && (i.cancelBubble = !0), this.isPropagationStopped = Tl);
  }, persist: function() {
    this.isPersistent = Tl;
  }, isPersistent: Ro, destructor: function() {
    var i = this.constructor.Interface, a;
    for (a in i)
      this[a] = null;
    this.nativeEvent = this._targetInst = this.dispatchConfig = null, this.isPropagationStopped = this.isDefaultPrevented = Ro, this._dispatchInstances = this._dispatchListeners = null;
  } }), hi.Interface = { type: null, target: null, currentTarget: function() {
    return null;
  }, eventPhase: null, bubbles: null, cancelable: null, timeStamp: function(i) {
    return i.timeStamp || Date.now();
  }, defaultPrevented: null, isTrusted: null }, hi.extend = function(i) {
    function a() {
    }
    function c() {
      return f.apply(this, arguments);
    }
    var f = this;
    a.prototype = f.prototype;
    var v = new a();
    return n(v, c.prototype), c.prototype = v, c.prototype.constructor = c, c.Interface = n({}, f.Interface, i), c.extend = f.extend, Ap(c), c;
  }, Ap(hi);
  function Yd(i, a, c, f) {
    if (this.eventPool.length) {
      var v = this.eventPool.pop();
      return this.call(v, i, a, c, f), v;
    }
    return new this(i, a, c, f);
  }
  function Gd(i) {
    if (!(i instanceof this))
      throw Error(l(279));
    i.destructor(), 10 > this.eventPool.length && this.eventPool.push(i);
  }
  function Ap(i) {
    i.eventPool = [], i.getPooled = Yd, i.release = Gd;
  }
  var Ju = hi.extend({ data: null }), Rp = hi.extend({ data: null }), ar = [9, 13, 27, 32], sr = G && "CompositionEvent" in window, ai = null;
  G && "documentMode" in document && (ai = document.documentMode);
  var _a = G && "TextEvent" in window && !ai, qu = G && (!sr || ai && 8 < ai && 11 >= ai), Ml = String.fromCharCode(32), Pa = { beforeInput: { phasedRegistrationNames: { bubbled: "onBeforeInput", captured: "onBeforeInputCapture" }, dependencies: ["compositionend", "keypress", "textInput", "paste"] }, compositionEnd: { phasedRegistrationNames: { bubbled: "onCompositionEnd", captured: "onCompositionEndCapture" }, dependencies: "blur compositionend keydown keypress keyup mousedown".split(" ") }, compositionStart: { phasedRegistrationNames: {
    bubbled: "onCompositionStart",
    captured: "onCompositionStartCapture"
  }, dependencies: "blur compositionstart keydown keypress keyup mousedown".split(" ") }, compositionUpdate: { phasedRegistrationNames: { bubbled: "onCompositionUpdate", captured: "onCompositionUpdateCapture" }, dependencies: "blur compositionupdate keydown keypress keyup mousedown".split(" ") } }, Ig = !1;
  function El(i, a) {
    switch (i) {
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
  function ks(i) {
    return i = i.detail, typeof i == "object" && "data" in i ? i.data : null;
  }
  var za = !1;
  function Dp(i, a) {
    switch (i) {
      case "compositionend":
        return ks(a);
      case "keypress":
        return a.which !== 32 ? null : (Ig = !0, Ml);
      case "textInput":
        return i = a.data, i === Ml && Ig ? null : i;
      default:
        return null;
    }
  }
  function Ku(i, a) {
    if (za)
      return i === "compositionend" || !sr && El(i, a) ? (i = Cl(), Xu = Gu = ra = null, za = !1, i) : null;
    switch (i) {
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
  var Xd = { eventTypes: Pa, extractEvents: function(i, a, c, f) {
    var v;
    if (sr)
      e: {
        switch (i) {
          case "compositionstart":
            var x = Pa.compositionStart;
            break e;
          case "compositionend":
            x = Pa.compositionEnd;
            break e;
          case "compositionupdate":
            x = Pa.compositionUpdate;
            break e;
        }
        x = void 0;
      }
    else
      za ? El(i, c) && (x = Pa.compositionEnd) : i === "keydown" && c.keyCode === 229 && (x = Pa.compositionStart);
    return x ? (qu && c.locale !== "ko" && (za || x !== Pa.compositionStart ? x === Pa.compositionEnd && za && (v = Cl()) : (ra = f, Gu = "value" in ra ? ra.value : ra.textContent, za = !0)), x = Ju.getPooled(
      x,
      a,
      c,
      f
    ), v ? x.data = v : (v = ks(c), v !== null && (x.data = v)), Ns(x), v = x) : v = null, (i = _a ? Dp(i, c) : Ku(i, c)) ? (a = Rp.getPooled(Pa.beforeInput, a, c, f), a.data = i, Ns(a)) : a = null, v === null ? a : a === null ? v : [v, a];
  } }, Np = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
  function Jd(i) {
    var a = i && i.nodeName && i.nodeName.toLowerCase();
    return a === "input" ? !!Np[i.type] : a === "textarea";
  }
  var qd = { change: { phasedRegistrationNames: { bubbled: "onChange", captured: "onChangeCapture" }, dependencies: "blur change click focus input keydown keyup selectionchange".split(" ") } };
  function Un(i, a, c) {
    return i = hi.getPooled(qd.change, i, a, c), i.type = "change", Oe(c), Ns(i), i;
  }
  var _s = null, Ps = null;
  function ec(i) {
    ea(i);
  }
  function Oa(i) {
    var a = Hi(i);
    if (Ir(a))
      return i;
  }
  function Il(i, a) {
    if (i === "change")
      return a;
  }
  var Do = !1;
  G && (Do = Lu("input") && (!document.documentMode || 9 < document.documentMode));
  function aa() {
    _s && (_s.detachEvent("onpropertychange", Al), Ps = _s = null);
  }
  function Al(i) {
    if (i.propertyName === "value" && Oa(Ps))
      if (i = Un(Ps, i, ml(i)), Qe)
        ea(i);
      else {
        Qe = !0;
        try {
          Ze(ec, i);
        } finally {
          Qe = !1, Bt();
        }
      }
  }
  function Kd(i, a, c) {
    i === "focus" ? (aa(), _s = a, Ps = c, _s.attachEvent("onpropertychange", Al)) : i === "blur" && aa();
  }
  function Rl(i) {
    if (i === "selectionchange" || i === "keyup" || i === "keydown")
      return Oa(Ps);
  }
  function ef(i, a) {
    if (i === "click")
      return Oa(a);
  }
  function tf(i, a) {
    if (i === "input" || i === "change")
      return Oa(a);
  }
  var nf = { eventTypes: qd, _isInputEventSupported: Do, extractEvents: function(i, a, c, f) {
    var v = a ? Hi(a) : window, x = v.nodeName && v.nodeName.toLowerCase();
    if (x === "select" || x === "input" && v.type === "file")
      var T = Il;
    else if (Jd(v))
      if (Do)
        T = tf;
      else {
        T = Rl;
        var R = Kd;
      }
    else
      (x = v.nodeName) && x.toLowerCase() === "input" && (v.type === "checkbox" || v.type === "radio") && (T = ef);
    if (T && (T = T(i, a)))
      return Un(T, c, f);
    R && R(i, v, a), i === "blur" && (i = v._wrapperState) && i.controlled && v.type === "number" && Mi(v, "number", v.value);
  } }, zs = hi.extend({ view: null, detail: null }), kp = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
  function Dl(i) {
    var a = this.nativeEvent;
    return a.getModifierState ? a.getModifierState(i) : (i = kp[i]) ? !!a[i] : !1;
  }
  function Os() {
    return Dl;
  }
  var rf = 0, Nl = 0, af = !1, tc = !1, Ls = zs.extend({ screenX: null, screenY: null, clientX: null, clientY: null, pageX: null, pageY: null, ctrlKey: null, shiftKey: null, altKey: null, metaKey: null, getModifierState: Os, button: null, buttons: null, relatedTarget: function(i) {
    return i.relatedTarget || (i.fromElement === i.srcElement ? i.toElement : i.fromElement);
  }, movementX: function(i) {
    if ("movementX" in i)
      return i.movementX;
    var a = rf;
    return rf = i.screenX, af ? i.type === "mousemove" ? i.screenX - a : 0 : (af = !0, 0);
  }, movementY: function(i) {
    if ("movementY" in i)
      return i.movementY;
    var a = Nl;
    return Nl = i.screenY, tc ? i.type === "mousemove" ? i.screenY - a : 0 : (tc = !0, 0);
  } }), nc = Ls.extend({ pointerId: null, width: null, height: null, pressure: null, tangentialPressure: null, tiltX: null, tiltY: null, twist: null, pointerType: null, isPrimary: null }), Bs = { mouseEnter: { registrationName: "onMouseEnter", dependencies: ["mouseout", "mouseover"] }, mouseLeave: { registrationName: "onMouseLeave", dependencies: ["mouseout", "mouseover"] }, pointerEnter: { registrationName: "onPointerEnter", dependencies: ["pointerout", "pointerover"] }, pointerLeave: {
    registrationName: "onPointerLeave",
    dependencies: ["pointerout", "pointerover"]
  } }, sf = { eventTypes: Bs, extractEvents: function(i, a, c, f, v) {
    var x = i === "mouseover" || i === "pointerover", T = i === "mouseout" || i === "pointerout";
    if (x && (v & 32) === 0 && (c.relatedTarget || c.fromElement) || !T && !x)
      return null;
    if (x = f.window === f ? f : (x = f.ownerDocument) ? x.defaultView || x.parentWindow : window, T) {
      if (T = a, a = (a = c.relatedTarget || c.toElement) ? Ao(a) : null, a !== null) {
        var R = fn(a);
        (a !== R || a.tag !== 5 && a.tag !== 6) && (a = null);
      }
    } else
      T = null;
    if (T === a)
      return null;
    if (i === "mouseout" || i === "mouseover")
      var W = Ls, U = Bs.mouseLeave, Me = Bs.mouseEnter, De = "mouse";
    else
      (i === "pointerout" || i === "pointerover") && (W = nc, U = Bs.pointerLeave, Me = Bs.pointerEnter, De = "pointer");
    if (i = T == null ? x : Hi(T), x = a == null ? x : Hi(a), U = W.getPooled(U, T, c, f), U.type = De + "leave", U.target = i, U.relatedTarget = x, c = W.getPooled(Me, a, c, f), c.type = De + "enter", c.target = x, c.relatedTarget = i, f = T, De = a, f && De)
      e: {
        for (W = f, Me = De, T = 0, i = W; i; i = Pr(i))
          T++;
        for (i = 0, a = Me; a; a = Pr(a))
          i++;
        for (; 0 < T - i; )
          W = Pr(W), T--;
        for (; 0 < i - T; )
          Me = Pr(Me), i--;
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
      Yu(f[De], "captured", c);
    return (v & 64) === 0 ? [U] : [U, c];
  } };
  function of(i, a) {
    return i === a && (i !== 0 || 1 / i === 1 / a) || i !== i && a !== a;
  }
  var Ii = typeof Object.is == "function" ? Object.is : of, Wi = Object.prototype.hasOwnProperty;
  function sa(i, a) {
    if (Ii(i, a))
      return !0;
    if (typeof i != "object" || i === null || typeof a != "object" || a === null)
      return !1;
    var c = Object.keys(i), f = Object.keys(a);
    if (c.length !== f.length)
      return !1;
    for (f = 0; f < c.length; f++)
      if (!Wi.call(a, c[f]) || !Ii(i[c[f]], a[c[f]]))
        return !1;
    return !0;
  }
  var kl = G && "documentMode" in document && 11 >= document.documentMode, zr = { select: { phasedRegistrationNames: { bubbled: "onSelect", captured: "onSelectCapture" }, dependencies: "blur contextmenu dragend focus keydown keyup mousedown mouseup selectionchange".split(" ") } }, Hn = null, Fi = null, si = null, La = !1;
  function ic(i, a) {
    var c = a.window === a ? a.document : a.nodeType === 9 ? a : a.ownerDocument;
    return La || Hn == null || Hn !== Hu(c) ? null : (c = Hn, "selectionStart" in c && Wu(c) ? c = { start: c.selectionStart, end: c.selectionEnd } : (c = (c.ownerDocument && c.ownerDocument.defaultView || window).getSelection(), c = { anchorNode: c.anchorNode, anchorOffset: c.anchorOffset, focusNode: c.focusNode, focusOffset: c.focusOffset }), si && sa(si, c) ? null : (si = c, i = hi.getPooled(zr.select, Fi, i, a), i.type = "select", i.target = Hn, Ns(i), i));
  }
  var lf = { eventTypes: zr, extractEvents: function(i, a, c, f, v, x) {
    if (v = x || (f.window === f ? f.document : f.nodeType === 9 ? f : f.ownerDocument), !(x = !v)) {
      e: {
        v = Yt(v), x = $e.onSelect;
        for (var T = 0; T < x.length; T++)
          if (!v.has(x[T])) {
            v = !1;
            break e;
          }
        v = !0;
      }
      x = !v;
    }
    if (x)
      return null;
    switch (v = a ? Hi(a) : window, i) {
      case "focus":
        (Jd(v) || v.contentEditable === "true") && (Hn = v, Fi = a, si = null);
        break;
      case "blur":
        si = Fi = Hn = null;
        break;
      case "mousedown":
        La = !0;
        break;
      case "contextmenu":
      case "mouseup":
      case "dragend":
        return La = !1, ic(c, f);
      case "selectionchange":
        if (kl)
          break;
      case "keydown":
      case "keyup":
        return ic(c, f);
    }
    return null;
  } }, uf = hi.extend({ animationName: null, elapsedTime: null, pseudoElement: null }), rc = hi.extend({ clipboardData: function(i) {
    return "clipboardData" in i ? i.clipboardData : window.clipboardData;
  } }), oa = zs.extend({ relatedTarget: null });
  function _l(i) {
    var a = i.keyCode;
    return "charCode" in i ? (i = i.charCode, i === 0 && a === 13 && (i = 13)) : i = a, i === 10 && (i = 13), 32 <= i || i === 13 ? i : 0;
  }
  var Ba = { Esc: "Escape", Spacebar: " ", Left: "ArrowLeft", Up: "ArrowUp", Right: "ArrowRight", Down: "ArrowDown", Del: "Delete", Win: "OS", Menu: "ContextMenu", Apps: "ContextMenu", Scroll: "ScrollLock", MozPrintableKey: "Unidentified" }, la = {
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
  }, Pl = zs.extend({ key: function(i) {
    if (i.key) {
      var a = Ba[i.key] || i.key;
      if (a !== "Unidentified")
        return a;
    }
    return i.type === "keypress" ? (i = _l(i), i === 13 ? "Enter" : String.fromCharCode(i)) : i.type === "keydown" || i.type === "keyup" ? la[i.keyCode] || "Unidentified" : "";
  }, location: null, ctrlKey: null, shiftKey: null, altKey: null, metaKey: null, repeat: null, locale: null, getModifierState: Os, charCode: function(i) {
    return i.type === "keypress" ? _l(i) : 0;
  }, keyCode: function(i) {
    return i.type === "keydown" || i.type === "keyup" ? i.keyCode : 0;
  }, which: function(i) {
    return i.type === "keypress" ? _l(i) : i.type === "keydown" || i.type === "keyup" ? i.keyCode : 0;
  } }), zl = Ls.extend({ dataTransfer: null }), cf = zs.extend({ touches: null, targetTouches: null, changedTouches: null, altKey: null, metaKey: null, ctrlKey: null, shiftKey: null, getModifierState: Os }), df = hi.extend({ propertyName: null, elapsedTime: null, pseudoElement: null }), ff = Ls.extend({ deltaX: function(i) {
    return "deltaX" in i ? i.deltaX : "wheelDeltaX" in i ? -i.wheelDeltaX : 0;
  }, deltaY: function(i) {
    return "deltaY" in i ? i.deltaY : "wheelDeltaY" in i ? -i.wheelDeltaY : "wheelDelta" in i ? -i.wheelDelta : 0;
  }, deltaZ: null, deltaMode: null }), hf = { eventTypes: Od, extractEvents: function(i, a, c, f) {
    var v = yp.get(i);
    if (!v)
      return null;
    switch (i) {
      case "keypress":
        if (_l(c) === 0)
          return null;
      case "keydown":
      case "keyup":
        i = Pl;
        break;
      case "blur":
      case "focus":
        i = oa;
        break;
      case "click":
        if (c.button === 2)
          return null;
      case "auxclick":
      case "dblclick":
      case "mousedown":
      case "mousemove":
      case "mouseup":
      case "mouseout":
      case "mouseover":
      case "contextmenu":
        i = Ls;
        break;
      case "drag":
      case "dragend":
      case "dragenter":
      case "dragexit":
      case "dragleave":
      case "dragover":
      case "dragstart":
      case "drop":
        i = zl;
        break;
      case "touchcancel":
      case "touchend":
      case "touchmove":
      case "touchstart":
        i = cf;
        break;
      case Es:
      case ne:
      case de:
        i = uf;
        break;
      case Je:
        i = df;
        break;
      case "scroll":
        i = zs;
        break;
      case "wheel":
        i = ff;
        break;
      case "copy":
      case "cut":
      case "paste":
        i = rc;
        break;
      case "gotpointercapture":
      case "lostpointercapture":
      case "pointercancel":
      case "pointerdown":
      case "pointermove":
      case "pointerout":
      case "pointerover":
      case "pointerup":
        i = nc;
        break;
      default:
        i = hi;
    }
    return a = i.getPooled(v, a, c, f), Ns(a), a;
  } };
  if (Y)
    throw Error(l(101));
  Y = Array.prototype.slice.call("ResponderEventPlugin SimpleEventPlugin EnterLeaveEventPlugin ChangeEventPlugin SelectEventPlugin BeforeInputEventPlugin".split(" ")), se();
  var pf = Sl;
  z = xl, F = pf, j = Hi, ze({ SimpleEventPlugin: hf, EnterLeaveEventPlugin: sf, ChangeEventPlugin: nf, SelectEventPlugin: lf, BeforeInputEventPlugin: Xd });
  var ac = [], Ai = -1;
  function St(i) {
    0 > Ai || (i.current = ac[Ai], ac[Ai] = null, Ai--);
  }
  function sn(i, a) {
    Ai++, ac[Ai] = i.current, i.current = a;
  }
  var Or = {}, Pn = { current: Or }, En = { current: !1 }, Lr = Or;
  function ja(i, a) {
    var c = i.type.contextTypes;
    if (!c)
      return Or;
    var f = i.stateNode;
    if (f && f.__reactInternalMemoizedUnmaskedChildContext === a)
      return f.__reactInternalMemoizedMaskedChildContext;
    var v = {}, x;
    for (x in c)
      v[x] = a[x];
    return f && (i = i.stateNode, i.__reactInternalMemoizedUnmaskedChildContext = a, i.__reactInternalMemoizedMaskedChildContext = v), v;
  }
  function Qn(i) {
    return i = i.childContextTypes, i != null;
  }
  function Va() {
    St(En), St(Pn);
  }
  function sc(i, a, c) {
    if (Pn.current !== Or)
      throw Error(l(168));
    sn(Pn, a), sn(En, c);
  }
  function js(i, a, c) {
    var f = i.stateNode;
    if (i = a.childContextTypes, typeof f.getChildContext != "function")
      return c;
    f = f.getChildContext();
    for (var v in f)
      if (!(v in i))
        throw Error(l(108, fi(a) || "Unknown", v));
    return n({}, c, {}, f);
  }
  function No(i) {
    return i = (i = i.stateNode) && i.__reactInternalMemoizedMergedChildContext || Or, Lr = Pn.current, sn(Pn, i), sn(En, En.current), !0;
  }
  function Ol(i, a, c) {
    var f = i.stateNode;
    if (!f)
      throw Error(l(169));
    c ? (i = js(i, a, Lr), f.__reactInternalMemoizedMergedChildContext = i, St(En), St(Pn), sn(Pn, i)) : St(En), sn(En, c);
  }
  var mf = o.unstable_runWithPriority, ko = o.unstable_scheduleCallback, oc = o.unstable_cancelCallback, lc = o.unstable_requestPaint, uc = o.unstable_now, vf = o.unstable_getCurrentPriorityLevel, Ll = o.unstable_ImmediatePriority, cc = o.unstable_UserBlockingPriority, dc = o.unstable_NormalPriority, gf = o.unstable_LowPriority, _o = o.unstable_IdlePriority, yf = {}, Ag = o.unstable_shouldYield, _p = lc !== void 0 ? lc : function() {
  }, or = null, ua = null, wf = !1, Pp = uc(), _t = 1e4 > Pp ? uc : function() {
    return uc() - Pp;
  };
  function lr() {
    switch (vf()) {
      case Ll:
        return 99;
      case cc:
        return 98;
      case dc:
        return 97;
      case gf:
        return 96;
      case _o:
        return 95;
      default:
        throw Error(l(332));
    }
  }
  function Cn(i) {
    switch (i) {
      case 99:
        return Ll;
      case 98:
        return cc;
      case 97:
        return dc;
      case 96:
        return gf;
      case 95:
        return _o;
      default:
        throw Error(l(332));
    }
  }
  function xt(i, a) {
    return i = Cn(i), mf(i, a);
  }
  function zp(i, a, c) {
    return i = Cn(i), ko(i, a, c);
  }
  function Vs(i) {
    return or === null ? (or = [i], ua = ko(Ll, bf)) : or.push(i), yf;
  }
  function Ri() {
    if (ua !== null) {
      var i = ua;
      ua = null, oc(i);
    }
    bf();
  }
  function bf() {
    if (!wf && or !== null) {
      wf = !0;
      var i = 0;
      try {
        var a = or;
        xt(99, function() {
          for (; i < a.length; i++) {
            var c = a[i];
            do
              c = c(!0);
            while (c !== null);
          }
        }), or = null;
      } catch (c) {
        throw or !== null && (or = or.slice(i + 1)), ko(Ll, Ri), c;
      } finally {
        wf = !1;
      }
    }
  }
  function Vt(i, a, c) {
    return c /= 10, 1073741821 - (((1073741821 - i + a / 10) / c | 0) + 1) * c;
  }
  function pi(i, a) {
    if (i && i.defaultProps) {
      a = n({}, a), i = i.defaultProps;
      for (var c in i)
        a[c] === void 0 && (a[c] = i[c]);
    }
    return a;
  }
  var Ua = { current: null }, Ha = null, $i = null, fc = null;
  function Sf() {
    fc = $i = Ha = null;
  }
  function xf(i) {
    var a = Ua.current;
    St(Ua), i.type._context._currentValue = a;
  }
  function Po(i, a) {
    for (; i !== null; ) {
      var c = i.alternate;
      if (i.childExpirationTime < a)
        i.childExpirationTime = a, c !== null && c.childExpirationTime < a && (c.childExpirationTime = a);
      else if (c !== null && c.childExpirationTime < a)
        c.childExpirationTime = a;
      else
        break;
      i = i.return;
    }
  }
  function mi(i, a) {
    Ha = i, fc = $i = null, i = i.dependencies, i !== null && i.firstContext !== null && (i.expirationTime >= a && (cr = !0), i.firstContext = null);
  }
  function Qi(i, a) {
    if (fc !== i && a !== !1 && a !== 0)
      if ((typeof a != "number" || a === 1073741823) && (fc = i, a = 1073741823), a = { context: i, observedBits: a, next: null }, $i === null) {
        if (Ha === null)
          throw Error(l(308));
        $i = a, Ha.dependencies = { expirationTime: 0, firstContext: a, responders: null };
      } else
        $i = $i.next = a;
    return i._currentValue;
  }
  var vi = !1;
  function hc(i) {
    i.updateQueue = { baseState: i.memoizedState, baseQueue: null, shared: { pending: null }, effects: null };
  }
  function pc(i, a) {
    i = i.updateQueue, a.updateQueue === i && (a.updateQueue = { baseState: i.baseState, baseQueue: i.baseQueue, shared: i.shared, effects: i.effects });
  }
  function Wa(i, a) {
    return i = { expirationTime: i, suspenseConfig: a, tag: 0, payload: null, callback: null, next: null }, i.next = i;
  }
  function Fa(i, a) {
    if (i = i.updateQueue, i !== null) {
      i = i.shared;
      var c = i.pending;
      c === null ? a.next = a : (a.next = c.next, c.next = a), i.pending = a;
    }
  }
  function Cf(i, a) {
    var c = i.alternate;
    c !== null && pc(c, i), i = i.updateQueue, c = i.baseQueue, c === null ? (i.baseQueue = a.next = a, a.next = a) : (a.next = c.next, c.next = a);
  }
  function zo(i, a, c, f) {
    var v = i.updateQueue;
    vi = !1;
    var x = v.baseQueue, T = v.shared.pending;
    if (T !== null) {
      if (x !== null) {
        var R = x.next;
        x.next = T.next, T.next = R;
      }
      x = T, v.shared.pending = null, R = i.alternate, R !== null && (R = R.updateQueue, R !== null && (R.baseQueue = T));
    }
    if (x !== null) {
      R = x.next;
      var W = v.baseState, U = 0, Me = null, De = null, mt = null;
      if (R !== null) {
        var Et = R;
        do {
          if (T = Et.expirationTime, T < f) {
            var Pi = { expirationTime: Et.expirationTime, suspenseConfig: Et.suspenseConfig, tag: Et.tag, payload: Et.payload, callback: Et.callback, next: null };
            mt === null ? (De = mt = Pi, Me = W) : mt = mt.next = Pi, T > U && (U = T);
          } else {
            mt !== null && (mt = mt.next = { expirationTime: 1073741823, suspenseConfig: Et.suspenseConfig, tag: Et.tag, payload: Et.payload, callback: Et.callback, next: null }), $f(T, Et.suspenseConfig);
            e: {
              var Fn = i, O = Et;
              switch (T = a, Pi = c, O.tag) {
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
                  W = n({}, W, T);
                  break e;
                case 2:
                  vi = !0;
              }
            }
            Et.callback !== null && (i.effectTag |= 32, T = v.effects, T === null ? v.effects = [Et] : T.push(Et));
          }
          if (Et = Et.next, Et === null || Et === R) {
            if (T = v.shared.pending, T === null)
              break;
            Et = x.next = T.next, T.next = R, v.baseQueue = x = T, v.shared.pending = null;
          }
        } while (1);
      }
      mt === null ? Me = W : mt.next = De, v.baseState = Me, v.baseQueue = mt, ql(U), i.expirationTime = U, i.memoizedState = W;
    }
  }
  function Tf(i, a, c) {
    if (i = a.effects, a.effects = null, i !== null)
      for (a = 0; a < i.length; a++) {
        var f = i[a], v = f.callback;
        if (v !== null) {
          if (f.callback = null, f = v, v = c, typeof f != "function")
            throw Error(l(191, f));
          f.call(v);
        }
      }
  }
  var Bl = Zt.ReactCurrentBatchConfig, Us = new r.Component().refs;
  function Oo(i, a, c, f) {
    a = i.memoizedState, c = c(f, a), c = c == null ? a : n({}, a, c), i.memoizedState = c, i.expirationTime === 0 && (i.updateQueue.baseState = c);
  }
  var $a = { isMounted: function(i) {
    return (i = i._reactInternalFiber) ? fn(i) === i : !1;
  }, enqueueSetState: function(i, a, c) {
    i = i._reactInternalFiber;
    var f = Ln(), v = Bl.suspense;
    f = qa(f, i, v), v = Wa(f, v), v.payload = a, c != null && (v.callback = c), Fa(i, v), Ka(i, f);
  }, enqueueReplaceState: function(i, a, c) {
    i = i._reactInternalFiber;
    var f = Ln(), v = Bl.suspense;
    f = qa(f, i, v), v = Wa(f, v), v.tag = 1, v.payload = a, c != null && (v.callback = c), Fa(i, v), Ka(i, f);
  }, enqueueForceUpdate: function(i, a) {
    i = i._reactInternalFiber;
    var c = Ln(), f = Bl.suspense;
    c = qa(c, i, f), f = Wa(c, f), f.tag = 2, a != null && (f.callback = a), Fa(i, f), Ka(i, c);
  } };
  function Op(i, a, c, f, v, x, T) {
    return i = i.stateNode, typeof i.shouldComponentUpdate == "function" ? i.shouldComponentUpdate(f, x, T) : a.prototype && a.prototype.isPureReactComponent ? !sa(c, f) || !sa(v, x) : !0;
  }
  function Lp(i, a, c) {
    var f = !1, v = Or, x = a.contextType;
    return typeof x == "object" && x !== null ? x = Qi(x) : (v = Qn(a) ? Lr : Pn.current, f = a.contextTypes, x = (f = f != null) ? ja(i, v) : Or), a = new a(c, x), i.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = $a, i.stateNode = a, a._reactInternalFiber = i, f && (i = i.stateNode, i.__reactInternalMemoizedUnmaskedChildContext = v, i.__reactInternalMemoizedMaskedChildContext = x), a;
  }
  function mc(i, a, c, f) {
    i = a.state, typeof a.componentWillReceiveProps == "function" && a.componentWillReceiveProps(c, f), typeof a.UNSAFE_componentWillReceiveProps == "function" && a.UNSAFE_componentWillReceiveProps(c, f), a.state !== i && $a.enqueueReplaceState(a, a.state, null);
  }
  function jl(i, a, c, f) {
    var v = i.stateNode;
    v.props = c, v.state = i.memoizedState, v.refs = Us, hc(i);
    var x = a.contextType;
    typeof x == "object" && x !== null ? v.context = Qi(x) : (x = Qn(a) ? Lr : Pn.current, v.context = ja(i, x)), zo(i, c, v, f), v.state = i.memoizedState, x = a.getDerivedStateFromProps, typeof x == "function" && (Oo(i, a, x, c), v.state = i.memoizedState), typeof a.getDerivedStateFromProps == "function" || typeof v.getSnapshotBeforeUpdate == "function" || typeof v.UNSAFE_componentWillMount != "function" && typeof v.componentWillMount != "function" || (a = v.state, typeof v.componentWillMount == "function" && v.componentWillMount(), typeof v.UNSAFE_componentWillMount == "function" && v.UNSAFE_componentWillMount(), a !== v.state && $a.enqueueReplaceState(v, v.state, null), zo(i, c, v, f), v.state = i.memoizedState), typeof v.componentDidMount == "function" && (i.effectTag |= 4);
  }
  var Vl = Array.isArray;
  function Ul(i, a, c) {
    if (i = c.ref, i !== null && typeof i != "function" && typeof i != "object") {
      if (c._owner) {
        if (c = c._owner, c) {
          if (c.tag !== 1)
            throw Error(l(309));
          var f = c.stateNode;
        }
        if (!f)
          throw Error(l(147, i));
        var v = "" + i;
        return a !== null && a.ref !== null && typeof a.ref == "function" && a.ref._stringRef === v ? a.ref : (a = function(x) {
          var T = f.refs;
          T === Us && (T = f.refs = {}), x === null ? delete T[v] : T[v] = x;
        }, a._stringRef = v, a);
      }
      if (typeof i != "string")
        throw Error(l(284));
      if (!c._owner)
        throw Error(l(290, i));
    }
    return i;
  }
  function Hs(i, a) {
    if (i.type !== "textarea")
      throw Error(l(31, Object.prototype.toString.call(a) === "[object Object]" ? "object with keys {" + Object.keys(a).join(", ") + "}" : a, ""));
  }
  function Bp(i) {
    function a(O, P) {
      if (i) {
        var Q = O.lastEffect;
        Q !== null ? (Q.nextEffect = P, O.lastEffect = P) : O.firstEffect = O.lastEffect = P, P.nextEffect = null, P.effectTag = 8;
      }
    }
    function c(O, P) {
      if (!i)
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
    function x(O, P, Q) {
      return O.index = Q, i ? (Q = O.alternate, Q !== null ? (Q = Q.index, Q < P ? (O.effectTag = 2, P) : Q) : (O.effectTag = 2, P)) : P;
    }
    function T(O) {
      return i && O.alternate === null && (O.effectTag = 2), O;
    }
    function R(O, P, Q, ue) {
      return P === null || P.tag !== 6 ? (P = Yf(Q, O.mode, ue), P.return = O, P) : (P = v(P, Q), P.return = O, P);
    }
    function W(O, P, Q, ue) {
      return P !== null && P.elementType === Q.type ? (ue = v(P, Q.props), ue.ref = Ul(O, P, Q), ue.return = O, ue) : (ue = Hc(Q.type, Q.key, Q.props, null, O.mode, ue), ue.ref = Ul(O, P, Q), ue.return = O, ue);
    }
    function U(O, P, Q, ue) {
      return P === null || P.tag !== 4 || P.stateNode.containerInfo !== Q.containerInfo || P.stateNode.implementation !== Q.implementation ? (P = Gf(Q, O.mode, ue), P.return = O, P) : (P = v(P, Q.children || []), P.return = O, P);
    }
    function Me(O, P, Q, ue, ye) {
      return P === null || P.tag !== 7 ? (P = fa(Q, O.mode, ue, ye), P.return = O, P) : (P = v(P, Q), P.return = O, P);
    }
    function De(O, P, Q) {
      if (typeof P == "string" || typeof P == "number")
        return P = Yf("" + P, O.mode, Q), P.return = O, P;
      if (typeof P == "object" && P !== null) {
        switch (P.$$typeof) {
          case Vi:
            return Q = Hc(P.type, P.key, P.props, null, O.mode, Q), Q.ref = Ul(O, null, P), Q.return = O, Q;
          case Ci:
            return P = Gf(P, O.mode, Q), P.return = O, P;
        }
        if (Vl(P) || di(P))
          return P = fa(P, O.mode, Q, null), P.return = O, P;
        Hs(O, P);
      }
      return null;
    }
    function mt(O, P, Q, ue) {
      var ye = P !== null ? P.key : null;
      if (typeof Q == "string" || typeof Q == "number")
        return ye !== null ? null : R(O, P, "" + Q, ue);
      if (typeof Q == "object" && Q !== null) {
        switch (Q.$$typeof) {
          case Vi:
            return Q.key === ye ? Q.type === Jn ? Me(O, P, Q.props.children, ue, ye) : W(O, P, Q, ue) : null;
          case Ci:
            return Q.key === ye ? U(O, P, Q, ue) : null;
        }
        if (Vl(Q) || di(Q))
          return ye !== null ? null : Me(O, P, Q, ue, null);
        Hs(O, Q);
      }
      return null;
    }
    function Et(O, P, Q, ue, ye) {
      if (typeof ue == "string" || typeof ue == "number")
        return O = O.get(Q) || null, R(P, O, "" + ue, ye);
      if (typeof ue == "object" && ue !== null) {
        switch (ue.$$typeof) {
          case Vi:
            return O = O.get(ue.key === null ? Q : ue.key) || null, ue.type === Jn ? Me(P, O, ue.props.children, ye, ue.key) : W(P, O, ue, ye);
          case Ci:
            return O = O.get(ue.key === null ? Q : ue.key) || null, U(P, O, ue, ye);
        }
        if (Vl(ue) || di(ue))
          return O = O.get(Q) || null, Me(P, O, ue, ye, null);
        Hs(P, ue);
      }
      return null;
    }
    function Pi(O, P, Q, ue) {
      for (var ye = null, _e = null, qe = P, bt = P = 0, un = null; qe !== null && bt < Q.length; bt++) {
        qe.index > bt ? (un = qe, qe = null) : un = qe.sibling;
        var lt = mt(O, qe, Q[bt], ue);
        if (lt === null) {
          qe === null && (qe = un);
          break;
        }
        i && qe && lt.alternate === null && a(O, qe), P = x(lt, P, bt), _e === null ? ye = lt : _e.sibling = lt, _e = lt, qe = un;
      }
      if (bt === Q.length)
        return c(O, qe), ye;
      if (qe === null) {
        for (; bt < Q.length; bt++)
          qe = De(O, Q[bt], ue), qe !== null && (P = x(qe, P, bt), _e === null ? ye = qe : _e.sibling = qe, _e = qe);
        return ye;
      }
      for (qe = f(O, qe); bt < Q.length; bt++)
        un = Et(qe, O, bt, Q[bt], ue), un !== null && (i && un.alternate !== null && qe.delete(un.key === null ? bt : un.key), P = x(un, P, bt), _e === null ? ye = un : _e.sibling = un, _e = un);
      return i && qe.forEach(function(is) {
        return a(O, is);
      }), ye;
    }
    function Fn(O, P, Q, ue) {
      var ye = di(Q);
      if (typeof ye != "function")
        throw Error(l(150));
      if (Q = ye.call(Q), Q == null)
        throw Error(l(151));
      for (var _e = ye = null, qe = P, bt = P = 0, un = null, lt = Q.next(); qe !== null && !lt.done; bt++, lt = Q.next()) {
        qe.index > bt ? (un = qe, qe = null) : un = qe.sibling;
        var is = mt(O, qe, lt.value, ue);
        if (is === null) {
          qe === null && (qe = un);
          break;
        }
        i && qe && is.alternate === null && a(O, qe), P = x(is, P, bt), _e === null ? ye = is : _e.sibling = is, _e = is, qe = un;
      }
      if (lt.done)
        return c(O, qe), ye;
      if (qe === null) {
        for (; !lt.done; bt++, lt = Q.next())
          lt = De(O, lt.value, ue), lt !== null && (P = x(lt, P, bt), _e === null ? ye = lt : _e.sibling = lt, _e = lt);
        return ye;
      }
      for (qe = f(O, qe); !lt.done; bt++, lt = Q.next())
        lt = Et(qe, O, bt, lt.value, ue), lt !== null && (i && lt.alternate !== null && qe.delete(lt.key === null ? bt : lt.key), P = x(lt, P, bt), _e === null ? ye = lt : _e.sibling = lt, _e = lt);
      return i && qe.forEach(function($g) {
        return a(O, $g);
      }), ye;
    }
    return function(O, P, Q, ue) {
      var ye = typeof Q == "object" && Q !== null && Q.type === Jn && Q.key === null;
      ye && (Q = Q.props.children);
      var _e = typeof Q == "object" && Q !== null;
      if (_e)
        switch (Q.$$typeof) {
          case Vi:
            e: {
              for (_e = Q.key, ye = P; ye !== null; ) {
                if (ye.key === _e) {
                  switch (ye.tag) {
                    case 7:
                      if (Q.type === Jn) {
                        c(O, ye.sibling), P = v(ye, Q.props.children), P.return = O, O = P;
                        break e;
                      }
                      break;
                    default:
                      if (ye.elementType === Q.type) {
                        c(
                          O,
                          ye.sibling
                        ), P = v(ye, Q.props), P.ref = Ul(O, ye, Q), P.return = O, O = P;
                        break e;
                      }
                  }
                  c(O, ye);
                  break;
                } else
                  a(O, ye);
                ye = ye.sibling;
              }
              Q.type === Jn ? (P = fa(Q.props.children, O.mode, ue, Q.key), P.return = O, O = P) : (ue = Hc(Q.type, Q.key, Q.props, null, O.mode, ue), ue.ref = Ul(O, P, Q), ue.return = O, O = ue);
            }
            return T(O);
          case Ci:
            e: {
              for (ye = Q.key; P !== null; ) {
                if (P.key === ye)
                  if (P.tag === 4 && P.stateNode.containerInfo === Q.containerInfo && P.stateNode.implementation === Q.implementation) {
                    c(O, P.sibling), P = v(P, Q.children || []), P.return = O, O = P;
                    break e;
                  } else {
                    c(O, P);
                    break;
                  }
                else
                  a(O, P);
                P = P.sibling;
              }
              P = Gf(Q, O.mode, ue), P.return = O, O = P;
            }
            return T(O);
        }
      if (typeof Q == "string" || typeof Q == "number")
        return Q = "" + Q, P !== null && P.tag === 6 ? (c(O, P.sibling), P = v(P, Q), P.return = O, O = P) : (c(O, P), P = Yf(Q, O.mode, ue), P.return = O, O = P), T(O);
      if (Vl(Q))
        return Pi(O, P, Q, ue);
      if (di(Q))
        return Fn(O, P, Q, ue);
      if (_e && Hs(O, Q), typeof Q > "u" && !ye)
        switch (O.tag) {
          case 1:
          case 0:
            throw O = O.type, Error(l(152, O.displayName || O.name || "Component"));
        }
      return c(O, P);
    };
  }
  var Lo = Bp(!0), Mf = Bp(!1), Hl = {}, Br = { current: Hl }, Wl = { current: Hl }, Bo = { current: Hl };
  function Ws(i) {
    if (i === Hl)
      throw Error(l(174));
    return i;
  }
  function vc(i, a) {
    switch (sn(Bo, a), sn(Wl, i), sn(Br, Hl), i = a.nodeType, i) {
      case 9:
      case 11:
        a = (a = a.documentElement) ? a.namespaceURI : _n(null, "");
        break;
      default:
        i = i === 8 ? a.parentNode : a, a = i.namespaceURI || null, i = i.tagName, a = _n(a, i);
    }
    St(Br), sn(Br, a);
  }
  function jo() {
    St(Br), St(Wl), St(Bo);
  }
  function Ef(i) {
    Ws(Bo.current);
    var a = Ws(Br.current), c = _n(a, i.type);
    a !== c && (sn(Wl, i), sn(Br, c));
  }
  function If(i) {
    Wl.current === i && (St(Br), St(Wl));
  }
  var Kt = { current: 0 };
  function gc(i) {
    for (var a = i; a !== null; ) {
      if (a.tag === 13) {
        var c = a.memoizedState;
        if (c !== null && (c = c.dehydrated, c === null || c.data === $u || c.data === wl))
          return a;
      } else if (a.tag === 19 && a.memoizedProps.revealOrder !== void 0) {
        if ((a.effectTag & 64) !== 0)
          return a;
      } else if (a.child !== null) {
        a.child.return = a, a = a.child;
        continue;
      }
      if (a === i)
        break;
      for (; a.sibling === null; ) {
        if (a.return === null || a.return === i)
          return null;
        a = a.return;
      }
      a.sibling.return = a.return, a = a.sibling;
    }
    return null;
  }
  function yc(i, a) {
    return { responder: i, props: a };
  }
  var wc = Zt.ReactCurrentDispatcher, gi = Zt.ReactCurrentBatchConfig, Zn = 0, $t = null, on = null, ln = null, Qa = !1;
  function Wn() {
    throw Error(l(321));
  }
  function Fs(i, a) {
    if (a === null)
      return !1;
    for (var c = 0; c < a.length && c < i.length; c++)
      if (!Ii(i[c], a[c]))
        return !1;
    return !0;
  }
  function Af(i, a, c, f, v, x) {
    if (Zn = x, $t = a, a.memoizedState = null, a.updateQueue = null, a.expirationTime = 0, wc.current = i === null || i.memoizedState === null ? Rg : Dg, i = c(f, v), a.expirationTime === Zn) {
      x = 0;
      do {
        if (a.expirationTime = 0, !(25 > x))
          throw Error(l(301));
        x += 1, ln = on = null, a.updateQueue = null, wc.current = Ng, i = c(f, v);
      } while (a.expirationTime === Zn);
    }
    if (wc.current = Ic, a = on !== null && on.next !== null, Zn = 0, ln = on = $t = null, Qa = !1, a)
      throw Error(l(300));
    return i;
  }
  function $s() {
    var i = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
    return ln === null ? $t.memoizedState = ln = i : ln = ln.next = i, ln;
  }
  function Vo() {
    if (on === null) {
      var i = $t.alternate;
      i = i !== null ? i.memoizedState : null;
    } else
      i = on.next;
    var a = ln === null ? $t.memoizedState : ln.next;
    if (a !== null)
      ln = a, on = i;
    else {
      if (i === null)
        throw Error(l(310));
      on = i, i = { memoizedState: on.memoizedState, baseState: on.baseState, baseQueue: on.baseQueue, queue: on.queue, next: null }, ln === null ? $t.memoizedState = ln = i : ln = ln.next = i;
    }
    return ln;
  }
  function Za(i, a) {
    return typeof a == "function" ? a(i) : a;
  }
  function Fl(i) {
    var a = Vo(), c = a.queue;
    if (c === null)
      throw Error(l(311));
    c.lastRenderedReducer = i;
    var f = on, v = f.baseQueue, x = c.pending;
    if (x !== null) {
      if (v !== null) {
        var T = v.next;
        v.next = x.next, x.next = T;
      }
      f.baseQueue = v = x, c.pending = null;
    }
    if (v !== null) {
      v = v.next, f = f.baseState;
      var R = T = x = null, W = v;
      do {
        var U = W.expirationTime;
        if (U < Zn) {
          var Me = { expirationTime: W.expirationTime, suspenseConfig: W.suspenseConfig, action: W.action, eagerReducer: W.eagerReducer, eagerState: W.eagerState, next: null };
          R === null ? (T = R = Me, x = f) : R = R.next = Me, U > $t.expirationTime && ($t.expirationTime = U, ql(U));
        } else
          R !== null && (R = R.next = { expirationTime: 1073741823, suspenseConfig: W.suspenseConfig, action: W.action, eagerReducer: W.eagerReducer, eagerState: W.eagerState, next: null }), $f(U, W.suspenseConfig), f = W.eagerReducer === i ? W.eagerState : i(f, W.action);
        W = W.next;
      } while (W !== null && W !== v);
      R === null ? x = f : R.next = T, Ii(f, a.memoizedState) || (cr = !0), a.memoizedState = f, a.baseState = x, a.baseQueue = R, c.lastRenderedState = f;
    }
    return [a.memoizedState, c.dispatch];
  }
  function bc(i) {
    var a = Vo(), c = a.queue;
    if (c === null)
      throw Error(l(311));
    c.lastRenderedReducer = i;
    var f = c.dispatch, v = c.pending, x = a.memoizedState;
    if (v !== null) {
      c.pending = null;
      var T = v = v.next;
      do
        x = i(x, T.action), T = T.next;
      while (T !== v);
      Ii(x, a.memoizedState) || (cr = !0), a.memoizedState = x, a.baseQueue === null && (a.baseState = x), c.lastRenderedState = x;
    }
    return [x, f];
  }
  function Sc(i) {
    var a = $s();
    return typeof i == "function" && (i = i()), a.memoizedState = a.baseState = i, i = a.queue = { pending: null, dispatch: null, lastRenderedReducer: Za, lastRenderedState: i }, i = i.dispatch = Ec.bind(null, $t, i), [a.memoizedState, i];
  }
  function xc(i, a, c, f) {
    return i = { tag: i, create: a, destroy: c, deps: f, next: null }, a = $t.updateQueue, a === null ? (a = { lastEffect: null }, $t.updateQueue = a, a.lastEffect = i.next = i) : (c = a.lastEffect, c === null ? a.lastEffect = i.next = i : (f = c.next, c.next = i, i.next = f, a.lastEffect = i)), i;
  }
  function Rf() {
    return Vo().memoizedState;
  }
  function Qs(i, a, c, f) {
    var v = $s();
    $t.effectTag |= i, v.memoizedState = xc(1 | a, c, void 0, f === void 0 ? null : f);
  }
  function Df(i, a, c, f) {
    var v = Vo();
    f = f === void 0 ? null : f;
    var x = void 0;
    if (on !== null) {
      var T = on.memoizedState;
      if (x = T.destroy, f !== null && Fs(f, T.deps)) {
        xc(a, c, x, f);
        return;
      }
    }
    $t.effectTag |= i, v.memoizedState = xc(1 | a, c, x, f);
  }
  function jp(i, a) {
    return Qs(516, 4, i, a);
  }
  function Zs(i, a) {
    return Df(516, 4, i, a);
  }
  function Nf(i, a) {
    return Df(4, 2, i, a);
  }
  function Vp(i, a) {
    if (typeof a == "function")
      return i = i(), a(i), function() {
        a(null);
      };
    if (a != null)
      return i = i(), a.current = i, function() {
        a.current = null;
      };
  }
  function Uo(i, a, c) {
    return c = c != null ? c.concat([i]) : null, Df(4, 2, Vp.bind(null, a, i), c);
  }
  function Cc() {
  }
  function Up(i, a) {
    return $s().memoizedState = [i, a === void 0 ? null : a], i;
  }
  function Tc(i, a) {
    var c = Vo();
    a = a === void 0 ? null : a;
    var f = c.memoizedState;
    return f !== null && a !== null && Fs(a, f[1]) ? f[0] : (c.memoizedState = [i, a], i);
  }
  function kf(i, a) {
    var c = Vo();
    a = a === void 0 ? null : a;
    var f = c.memoizedState;
    return f !== null && a !== null && Fs(a, f[1]) ? f[0] : (i = i(), c.memoizedState = [i, a], i);
  }
  function Mc(i, a, c) {
    var f = lr();
    xt(98 > f ? 98 : f, function() {
      i(!0);
    }), xt(97 < f ? 97 : f, function() {
      var v = gi.suspense;
      gi.suspense = a === void 0 ? null : a;
      try {
        i(!1), c();
      } finally {
        gi.suspense = v;
      }
    });
  }
  function Ec(i, a, c) {
    var f = Ln(), v = Bl.suspense;
    f = qa(f, i, v), v = { expirationTime: f, suspenseConfig: v, action: c, eagerReducer: null, eagerState: null, next: null };
    var x = a.pending;
    if (x === null ? v.next = v : (v.next = x.next, x.next = v), a.pending = v, x = i.alternate, i === $t || x !== null && x === $t)
      Qa = !0, v.expirationTime = Zn, $t.expirationTime = Zn;
    else {
      if (i.expirationTime === 0 && (x === null || x.expirationTime === 0) && (x = a.lastRenderedReducer, x !== null))
        try {
          var T = a.lastRenderedState, R = x(T, c);
          if (v.eagerReducer = x, v.eagerState = R, Ii(R, T))
            return;
        } catch {
        } finally {
        }
      Ka(
        i,
        f
      );
    }
  }
  var Ic = { readContext: Qi, useCallback: Wn, useContext: Wn, useEffect: Wn, useImperativeHandle: Wn, useLayoutEffect: Wn, useMemo: Wn, useReducer: Wn, useRef: Wn, useState: Wn, useDebugValue: Wn, useResponder: Wn, useDeferredValue: Wn, useTransition: Wn }, Rg = { readContext: Qi, useCallback: Up, useContext: Qi, useEffect: jp, useImperativeHandle: function(i, a, c) {
    return c = c != null ? c.concat([i]) : null, Qs(4, 2, Vp.bind(null, a, i), c);
  }, useLayoutEffect: function(i, a) {
    return Qs(4, 2, i, a);
  }, useMemo: function(i, a) {
    var c = $s();
    return a = a === void 0 ? null : a, i = i(), c.memoizedState = [
      i,
      a
    ], i;
  }, useReducer: function(i, a, c) {
    var f = $s();
    return a = c !== void 0 ? c(a) : a, f.memoizedState = f.baseState = a, i = f.queue = { pending: null, dispatch: null, lastRenderedReducer: i, lastRenderedState: a }, i = i.dispatch = Ec.bind(null, $t, i), [f.memoizedState, i];
  }, useRef: function(i) {
    var a = $s();
    return i = { current: i }, a.memoizedState = i;
  }, useState: Sc, useDebugValue: Cc, useResponder: yc, useDeferredValue: function(i, a) {
    var c = Sc(i), f = c[0], v = c[1];
    return jp(function() {
      var x = gi.suspense;
      gi.suspense = a === void 0 ? null : a;
      try {
        v(i);
      } finally {
        gi.suspense = x;
      }
    }, [i, a]), f;
  }, useTransition: function(i) {
    var a = Sc(!1), c = a[0];
    return a = a[1], [Up(Mc.bind(null, a, i), [a, i]), c];
  } }, Dg = { readContext: Qi, useCallback: Tc, useContext: Qi, useEffect: Zs, useImperativeHandle: Uo, useLayoutEffect: Nf, useMemo: kf, useReducer: Fl, useRef: Rf, useState: function() {
    return Fl(Za);
  }, useDebugValue: Cc, useResponder: yc, useDeferredValue: function(i, a) {
    var c = Fl(Za), f = c[0], v = c[1];
    return Zs(function() {
      var x = gi.suspense;
      gi.suspense = a === void 0 ? null : a;
      try {
        v(i);
      } finally {
        gi.suspense = x;
      }
    }, [i, a]), f;
  }, useTransition: function(i) {
    var a = Fl(Za), c = a[0];
    return a = a[1], [Tc(Mc.bind(null, a, i), [a, i]), c];
  } }, Ng = { readContext: Qi, useCallback: Tc, useContext: Qi, useEffect: Zs, useImperativeHandle: Uo, useLayoutEffect: Nf, useMemo: kf, useReducer: bc, useRef: Rf, useState: function() {
    return bc(Za);
  }, useDebugValue: Cc, useResponder: yc, useDeferredValue: function(i, a) {
    var c = bc(Za), f = c[0], v = c[1];
    return Zs(function() {
      var x = gi.suspense;
      gi.suspense = a === void 0 ? null : a;
      try {
        v(i);
      } finally {
        gi.suspense = x;
      }
    }, [i, a]), f;
  }, useTransition: function(i) {
    var a = bc(Za), c = a[0];
    return a = a[1], [Tc(Mc.bind(
      null,
      a,
      i
    ), [a, i]), c];
  } }, ur = null, Ya = null, Ys = !1;
  function Hp(i, a) {
    var c = Ur(5, null, null, 0);
    c.elementType = "DELETED", c.type = "DELETED", c.stateNode = a, c.return = i, c.effectTag = 8, i.lastEffect !== null ? (i.lastEffect.nextEffect = c, i.lastEffect = c) : i.firstEffect = i.lastEffect = c;
  }
  function Wp(i, a) {
    switch (i.tag) {
      case 5:
        var c = i.type;
        return a = a.nodeType !== 1 || c.toLowerCase() !== a.nodeName.toLowerCase() ? null : a, a !== null ? (i.stateNode = a, !0) : !1;
      case 6:
        return a = i.pendingProps === "" || a.nodeType !== 3 ? null : a, a !== null ? (i.stateNode = a, !0) : !1;
      case 13:
        return !1;
      default:
        return !1;
    }
  }
  function $l(i) {
    if (Ys) {
      var a = Ya;
      if (a) {
        var c = a;
        if (!Wp(i, a)) {
          if (a = Mo(c.nextSibling), !a || !Wp(i, a)) {
            i.effectTag = i.effectTag & -1025 | 2, Ys = !1, ur = i;
            return;
          }
          Hp(ur, c);
        }
        ur = i, Ya = Mo(a.firstChild);
      } else
        i.effectTag = i.effectTag & -1025 | 2, Ys = !1, ur = i;
    }
  }
  function _f(i) {
    for (i = i.return; i !== null && i.tag !== 5 && i.tag !== 3 && i.tag !== 13; )
      i = i.return;
    ur = i;
  }
  function Ac(i) {
    if (i !== ur)
      return !1;
    if (!Ys)
      return _f(i), Ys = !0, !1;
    var a = i.type;
    if (i.tag !== 5 || a !== "head" && a !== "body" && !bl(a, i.memoizedProps))
      for (a = Ya; a; )
        Hp(i, a), a = Mo(a.nextSibling);
    if (_f(i), i.tag === 13) {
      if (i = i.memoizedState, i = i !== null ? i.dehydrated : null, !i)
        throw Error(l(317));
      e: {
        for (i = i.nextSibling, a = 0; i; ) {
          if (i.nodeType === 8) {
            var c = i.data;
            if (c === Wd) {
              if (a === 0) {
                Ya = Mo(i.nextSibling);
                break e;
              }
              a--;
            } else
              c !== Fu && c !== wl && c !== $u || a++;
          }
          i = i.nextSibling;
        }
        Ya = null;
      }
    } else
      Ya = ur ? Mo(i.stateNode.nextSibling) : null;
    return !0;
  }
  function Gt() {
    Ya = ur = null, Ys = !1;
  }
  var Rc = Zt.ReactCurrentOwner, cr = !1;
  function Di(i, a, c, f) {
    a.child = i === null ? Mf(a, null, c, f) : Lo(a, i.child, c, f);
  }
  function Fp(i, a, c, f, v) {
    c = c.render;
    var x = a.ref;
    return mi(a, v), f = Af(i, a, c, f, x, v), i !== null && !cr ? (a.updateQueue = i.updateQueue, a.effectTag &= -517, i.expirationTime <= v && (i.expirationTime = 0), ca(i, a, v)) : (a.effectTag |= 1, Di(i, a, f, v), a.child);
  }
  function Ql(i, a, c, f, v, x) {
    if (i === null) {
      var T = c.type;
      return typeof T == "function" && !Zf(T) && T.defaultProps === void 0 && c.compare === null && c.defaultProps === void 0 ? (a.tag = 15, a.type = T, Dc(i, a, T, f, v, x)) : (i = Hc(c.type, null, f, null, a.mode, x), i.ref = a.ref, i.return = a, a.child = i);
    }
    return T = i.child, v < x && (v = T.memoizedProps, c = c.compare, c = c !== null ? c : sa, c(v, f) && i.ref === a.ref) ? ca(i, a, x) : (a.effectTag |= 1, i = hr(T, f), i.ref = a.ref, i.return = a, a.child = i);
  }
  function Dc(i, a, c, f, v, x) {
    return i !== null && sa(i.memoizedProps, f) && i.ref === a.ref && (cr = !1, v < x) ? (a.expirationTime = i.expirationTime, ca(i, a, x)) : Gs(i, a, c, f, x);
  }
  function $p(i, a) {
    var c = a.ref;
    (i === null && c !== null || i !== null && i.ref !== c) && (a.effectTag |= 128);
  }
  function Gs(i, a, c, f, v) {
    var x = Qn(c) ? Lr : Pn.current;
    return x = ja(a, x), mi(a, v), c = Af(i, a, c, f, x, v), i !== null && !cr ? (a.updateQueue = i.updateQueue, a.effectTag &= -517, i.expirationTime <= v && (i.expirationTime = 0), ca(i, a, v)) : (a.effectTag |= 1, Di(i, a, c, v), a.child);
  }
  function Qp(i, a, c, f, v) {
    if (Qn(c)) {
      var x = !0;
      No(a);
    } else
      x = !1;
    if (mi(a, v), a.stateNode === null)
      i !== null && (i.alternate = null, a.alternate = null, a.effectTag |= 2), Lp(a, c, f), jl(a, c, f, v), f = !0;
    else if (i === null) {
      var T = a.stateNode, R = a.memoizedProps;
      T.props = R;
      var W = T.context, U = c.contextType;
      typeof U == "object" && U !== null ? U = Qi(U) : (U = Qn(c) ? Lr : Pn.current, U = ja(a, U));
      var Me = c.getDerivedStateFromProps, De = typeof Me == "function" || typeof T.getSnapshotBeforeUpdate == "function";
      De || typeof T.UNSAFE_componentWillReceiveProps != "function" && typeof T.componentWillReceiveProps != "function" || (R !== f || W !== U) && mc(a, T, f, U), vi = !1;
      var mt = a.memoizedState;
      T.state = mt, zo(a, f, T, v), W = a.memoizedState, R !== f || mt !== W || En.current || vi ? (typeof Me == "function" && (Oo(a, c, Me, f), W = a.memoizedState), (R = vi || Op(a, c, R, f, mt, W, U)) ? (De || typeof T.UNSAFE_componentWillMount != "function" && typeof T.componentWillMount != "function" || (typeof T.componentWillMount == "function" && T.componentWillMount(), typeof T.UNSAFE_componentWillMount == "function" && T.UNSAFE_componentWillMount()), typeof T.componentDidMount == "function" && (a.effectTag |= 4)) : (typeof T.componentDidMount == "function" && (a.effectTag |= 4), a.memoizedProps = f, a.memoizedState = W), T.props = f, T.state = W, T.context = U, f = R) : (typeof T.componentDidMount == "function" && (a.effectTag |= 4), f = !1);
    } else
      T = a.stateNode, pc(i, a), R = a.memoizedProps, T.props = a.type === a.elementType ? R : pi(a.type, R), W = T.context, U = c.contextType, typeof U == "object" && U !== null ? U = Qi(U) : (U = Qn(c) ? Lr : Pn.current, U = ja(a, U)), Me = c.getDerivedStateFromProps, (De = typeof Me == "function" || typeof T.getSnapshotBeforeUpdate == "function") || typeof T.UNSAFE_componentWillReceiveProps != "function" && typeof T.componentWillReceiveProps != "function" || (R !== f || W !== U) && mc(a, T, f, U), vi = !1, W = a.memoizedState, T.state = W, zo(a, f, T, v), mt = a.memoizedState, R !== f || W !== mt || En.current || vi ? (typeof Me == "function" && (Oo(a, c, Me, f), mt = a.memoizedState), (Me = vi || Op(a, c, R, f, W, mt, U)) ? (De || typeof T.UNSAFE_componentWillUpdate != "function" && typeof T.componentWillUpdate != "function" || (typeof T.componentWillUpdate == "function" && T.componentWillUpdate(
        f,
        mt,
        U
      ), typeof T.UNSAFE_componentWillUpdate == "function" && T.UNSAFE_componentWillUpdate(f, mt, U)), typeof T.componentDidUpdate == "function" && (a.effectTag |= 4), typeof T.getSnapshotBeforeUpdate == "function" && (a.effectTag |= 256)) : (typeof T.componentDidUpdate != "function" || R === i.memoizedProps && W === i.memoizedState || (a.effectTag |= 4), typeof T.getSnapshotBeforeUpdate != "function" || R === i.memoizedProps && W === i.memoizedState || (a.effectTag |= 256), a.memoizedProps = f, a.memoizedState = mt), T.props = f, T.state = mt, T.context = U, f = Me) : (typeof T.componentDidUpdate != "function" || R === i.memoizedProps && W === i.memoizedState || (a.effectTag |= 4), typeof T.getSnapshotBeforeUpdate != "function" || R === i.memoizedProps && W === i.memoizedState || (a.effectTag |= 256), f = !1);
    return Pf(i, a, c, f, x, v);
  }
  function Pf(i, a, c, f, v, x) {
    $p(i, a);
    var T = (a.effectTag & 64) !== 0;
    if (!f && !T)
      return v && Ol(a, c, !1), ca(i, a, x);
    f = a.stateNode, Rc.current = a;
    var R = T && typeof c.getDerivedStateFromError != "function" ? null : f.render();
    return a.effectTag |= 1, i !== null && T ? (a.child = Lo(a, i.child, null, x), a.child = Lo(a, null, R, x)) : Di(i, a, R, x), a.memoizedState = f.state, v && Ol(a, c, !0), a.child;
  }
  function Nc(i) {
    var a = i.stateNode;
    a.pendingContext ? sc(i, a.pendingContext, a.pendingContext !== a.context) : a.context && sc(i, a.context, !1), vc(i, a.containerInfo);
  }
  var zf = { dehydrated: null, retryTime: 0 };
  function Zp(i, a, c) {
    var f = a.mode, v = a.pendingProps, x = Kt.current, T = !1, R;
    if ((R = (a.effectTag & 64) !== 0) || (R = (x & 2) !== 0 && (i === null || i.memoizedState !== null)), R ? (T = !0, a.effectTag &= -65) : i !== null && i.memoizedState === null || v.fallback === void 0 || v.unstable_avoidThisFallback === !0 || (x |= 1), sn(Kt, x & 1), i === null) {
      if (v.fallback !== void 0 && $l(a), T) {
        if (T = v.fallback, v = fa(null, f, 0, null), v.return = a, (a.mode & 2) === 0)
          for (i = a.memoizedState !== null ? a.child.child : a.child, v.child = i; i !== null; )
            i.return = v, i = i.sibling;
        return c = fa(T, f, c, null), c.return = a, v.sibling = c, a.memoizedState = zf, a.child = v, c;
      }
      return f = v.children, a.memoizedState = null, a.child = Mf(a, null, f, c);
    }
    if (i.memoizedState !== null) {
      if (i = i.child, f = i.sibling, T) {
        if (v = v.fallback, c = hr(i, i.pendingProps), c.return = a, (a.mode & 2) === 0 && (T = a.memoizedState !== null ? a.child.child : a.child, T !== i.child))
          for (c.child = T; T !== null; )
            T.return = c, T = T.sibling;
        return f = hr(f, v), f.return = a, c.sibling = f, c.childExpirationTime = 0, a.memoizedState = zf, a.child = c, f;
      }
      return c = Lo(a, i.child, v.children, c), a.memoizedState = null, a.child = c;
    }
    if (i = i.child, T) {
      if (T = v.fallback, v = fa(null, f, 0, null), v.return = a, v.child = i, i !== null && (i.return = v), (a.mode & 2) === 0)
        for (i = a.memoizedState !== null ? a.child.child : a.child, v.child = i; i !== null; )
          i.return = v, i = i.sibling;
      return c = fa(T, f, c, null), c.return = a, v.sibling = c, c.effectTag |= 2, v.childExpirationTime = 0, a.memoizedState = zf, a.child = v, c;
    }
    return a.memoizedState = null, a.child = Lo(a, i, v.children, c);
  }
  function Yp(i, a) {
    i.expirationTime < a && (i.expirationTime = a);
    var c = i.alternate;
    c !== null && c.expirationTime < a && (c.expirationTime = a), Po(i.return, a);
  }
  function kc(i, a, c, f, v, x) {
    var T = i.memoizedState;
    T === null ? i.memoizedState = { isBackwards: a, rendering: null, renderingStartTime: 0, last: f, tail: c, tailExpiration: 0, tailMode: v, lastEffect: x } : (T.isBackwards = a, T.rendering = null, T.renderingStartTime = 0, T.last = f, T.tail = c, T.tailExpiration = 0, T.tailMode = v, T.lastEffect = x);
  }
  function Gp(i, a, c) {
    var f = a.pendingProps, v = f.revealOrder, x = f.tail;
    if (Di(i, a, f.children, c), f = Kt.current, (f & 2) !== 0)
      f = f & 1 | 2, a.effectTag |= 64;
    else {
      if (i !== null && (i.effectTag & 64) !== 0)
        e:
          for (i = a.child; i !== null; ) {
            if (i.tag === 13)
              i.memoizedState !== null && Yp(i, c);
            else if (i.tag === 19)
              Yp(i, c);
            else if (i.child !== null) {
              i.child.return = i, i = i.child;
              continue;
            }
            if (i === a)
              break e;
            for (; i.sibling === null; ) {
              if (i.return === null || i.return === a)
                break e;
              i = i.return;
            }
            i.sibling.return = i.return, i = i.sibling;
          }
      f &= 1;
    }
    if (sn(Kt, f), (a.mode & 2) === 0)
      a.memoizedState = null;
    else
      switch (v) {
        case "forwards":
          for (c = a.child, v = null; c !== null; )
            i = c.alternate, i !== null && gc(i) === null && (v = c), c = c.sibling;
          c = v, c === null ? (v = a.child, a.child = null) : (v = c.sibling, c.sibling = null), kc(a, !1, v, c, x, a.lastEffect);
          break;
        case "backwards":
          for (c = null, v = a.child, a.child = null; v !== null; ) {
            if (i = v.alternate, i !== null && gc(i) === null) {
              a.child = v;
              break;
            }
            i = v.sibling, v.sibling = c, c = v, v = i;
          }
          kc(a, !0, c, null, x, a.lastEffect);
          break;
        case "together":
          kc(a, !1, null, null, void 0, a.lastEffect);
          break;
        default:
          a.memoizedState = null;
      }
    return a.child;
  }
  function ca(i, a, c) {
    i !== null && (a.dependencies = i.dependencies);
    var f = a.expirationTime;
    if (f !== 0 && ql(f), a.childExpirationTime < c)
      return null;
    if (i !== null && a.child !== i.child)
      throw Error(l(153));
    if (a.child !== null) {
      for (i = a.child, c = hr(i, i.pendingProps), a.child = c, c.return = a; i.sibling !== null; )
        i = i.sibling, c = c.sibling = hr(i, i.pendingProps), c.return = a;
      c.sibling = null;
    }
    return a.child;
  }
  var Xp, _c, Xs, Pc;
  Xp = function(i, a) {
    for (var c = a.child; c !== null; ) {
      if (c.tag === 5 || c.tag === 6)
        i.appendChild(c.stateNode);
      else if (c.tag !== 4 && c.child !== null) {
        c.child.return = c, c = c.child;
        continue;
      }
      if (c === a)
        break;
      for (; c.sibling === null; ) {
        if (c.return === null || c.return === a)
          return;
        c = c.return;
      }
      c.sibling.return = c.return, c = c.sibling;
    }
  }, _c = function() {
  }, Xs = function(i, a, c, f, v) {
    var x = i.memoizedProps;
    if (x !== f) {
      var T = a.stateNode;
      switch (Ws(Br.current), i = null, c) {
        case "input":
          x = vn(T, x), f = vn(T, f), i = [];
          break;
        case "option":
          x = Ei(T, x), f = Ei(T, f), i = [];
          break;
        case "select":
          x = n({}, x, { value: void 0 }), f = n({}, f, { value: void 0 }), i = [];
          break;
        case "textarea":
          x = Jr(T, x), f = Jr(T, f), i = [];
          break;
        default:
          typeof x.onClick != "function" && typeof f.onClick == "function" && (T.onclick = Ds);
      }
      Uu(c, f);
      var R, W;
      c = null;
      for (R in x)
        if (!f.hasOwnProperty(R) && x.hasOwnProperty(R) && x[R] != null)
          if (R === "style")
            for (W in T = x[R], T)
              T.hasOwnProperty(W) && (c || (c = {}), c[W] = "");
          else
            R !== "dangerouslySetInnerHTML" && R !== "children" && R !== "suppressContentEditableWarning" && R !== "suppressHydrationWarning" && R !== "autoFocus" && (ke.hasOwnProperty(R) ? i || (i = []) : (i = i || []).push(R, null));
      for (R in f) {
        var U = f[R];
        if (T = x != null ? x[R] : void 0, f.hasOwnProperty(R) && U !== T && (U != null || T != null))
          if (R === "style")
            if (T) {
              for (W in T)
                !T.hasOwnProperty(W) || U && U.hasOwnProperty(W) || (c || (c = {}), c[W] = "");
              for (W in U)
                U.hasOwnProperty(W) && T[W] !== U[W] && (c || (c = {}), c[W] = U[W]);
            } else
              c || (i || (i = []), i.push(R, c)), c = U;
          else
            R === "dangerouslySetInnerHTML" ? (U = U ? U.__html : void 0, T = T ? T.__html : void 0, U != null && T !== U && (i = i || []).push(R, U)) : R === "children" ? T === U || typeof U != "string" && typeof U != "number" || (i = i || []).push(R, "" + U) : R !== "suppressContentEditableWarning" && R !== "suppressHydrationWarning" && (ke.hasOwnProperty(R) ? (U != null && ia(v, R), i || T === U || (i = [])) : (i = i || []).push(R, U));
      }
      c && (i = i || []).push("style", c), v = i, (a.updateQueue = v) && (a.effectTag |= 4);
    }
  }, Pc = function(i, a, c, f) {
    c !== f && (a.effectTag |= 4);
  };
  function Zl(i, a) {
    switch (i.tailMode) {
      case "hidden":
        a = i.tail;
        for (var c = null; a !== null; )
          a.alternate !== null && (c = a), a = a.sibling;
        c === null ? i.tail = null : c.sibling = null;
        break;
      case "collapsed":
        c = i.tail;
        for (var f = null; c !== null; )
          c.alternate !== null && (f = c), c = c.sibling;
        f === null ? a || i.tail === null ? i.tail = null : i.tail.sibling = null : f.sibling = null;
    }
  }
  function Jp(i, a, c) {
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
        return Qn(a.type) && Va(), null;
      case 3:
        return jo(), St(En), St(Pn), c = a.stateNode, c.pendingContext && (c.context = c.pendingContext, c.pendingContext = null), i !== null && i.child !== null || !Ac(a) || (a.effectTag |= 4), _c(a), null;
      case 5:
        If(a), c = Ws(Bo.current);
        var v = a.type;
        if (i !== null && a.stateNode != null)
          Xs(i, a, v, f, c), i.ref !== a.ref && (a.effectTag |= 128);
        else {
          if (!f) {
            if (a.stateNode === null)
              throw Error(l(166));
            return null;
          }
          if (i = Ws(Br.current), Ac(a)) {
            f = a.stateNode, v = a.type;
            var x = a.memoizedProps;
            switch (f[_r] = a, f[Eo] = x, v) {
              case "iframe":
              case "object":
              case "embed":
                ft("load", f);
                break;
              case "video":
              case "audio":
                for (i = 0; i < pt.length; i++)
                  ft(pt[i], f);
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
                qn(f, x), ft("invalid", f), ia(c, "onChange");
                break;
              case "select":
                f._wrapperState = { wasMultiple: !!x.multiple }, ft("invalid", f), ia(c, "onChange");
                break;
              case "textarea":
                Ra(f, x), ft("invalid", f), ia(c, "onChange");
            }
            Uu(v, x), i = null;
            for (var T in x)
              if (x.hasOwnProperty(T)) {
                var R = x[T];
                T === "children" ? typeof R == "string" ? f.textContent !== R && (i = ["children", R]) : typeof R == "number" && f.textContent !== "" + R && (i = ["children", "" + R]) : ke.hasOwnProperty(T) && R != null && ia(c, T);
              }
            switch (v) {
              case "input":
                Er(f), rn(f, x, !0);
                break;
              case "textarea":
                Er(f), wo(f);
                break;
              case "select":
              case "option":
                break;
              default:
                typeof x.onClick == "function" && (f.onclick = Ds);
            }
            c = i, a.updateQueue = c, c !== null && (a.effectTag |= 4);
          } else {
            switch (T = c.nodeType === 9 ? c : c.ownerDocument, i === Cp && (i = Da(v)), i === Cp ? v === "script" ? (i = T.createElement("div"), i.innerHTML = "<script><\/script>", i = i.removeChild(i.firstChild)) : typeof f.is == "string" ? i = T.createElement(v, { is: f.is }) : (i = T.createElement(v), v === "select" && (T = i, f.multiple ? T.multiple = !0 : f.size && (T.size = f.size))) : i = T.createElementNS(i, v), i[_r] = a, i[Eo] = f, Xp(i, a, !1, !1), a.stateNode = i, T = Bd(v, f), v) {
              case "iframe":
              case "object":
              case "embed":
                ft(
                  "load",
                  i
                ), R = f;
                break;
              case "video":
              case "audio":
                for (R = 0; R < pt.length; R++)
                  ft(pt[R], i);
                R = f;
                break;
              case "source":
                ft("error", i), R = f;
                break;
              case "img":
              case "image":
              case "link":
                ft("error", i), ft("load", i), R = f;
                break;
              case "form":
                ft("reset", i), ft("submit", i), R = f;
                break;
              case "details":
                ft("toggle", i), R = f;
                break;
              case "input":
                qn(i, f), R = vn(i, f), ft("invalid", i), ia(c, "onChange");
                break;
              case "option":
                R = Ei(i, f);
                break;
              case "select":
                i._wrapperState = { wasMultiple: !!f.multiple }, R = n({}, f, { value: void 0 }), ft("invalid", i), ia(c, "onChange");
                break;
              case "textarea":
                Ra(
                  i,
                  f
                ), R = Jr(i, f), ft("invalid", i), ia(c, "onChange");
                break;
              default:
                R = f;
            }
            Uu(v, R);
            var W = R;
            for (x in W)
              if (W.hasOwnProperty(x)) {
                var U = W[x];
                x === "style" ? Sp(i, U) : x === "dangerouslySetInnerHTML" ? (U = U ? U.__html : void 0, U != null && qr(i, U)) : x === "children" ? typeof U == "string" ? (v !== "textarea" || U !== "") && ei(i, U) : typeof U == "number" && ei(i, "" + U) : x !== "suppressContentEditableWarning" && x !== "suppressHydrationWarning" && x !== "autoFocus" && (ke.hasOwnProperty(x) ? U != null && ia(c, x) : U != null && Mt(i, x, U, T));
              }
            switch (v) {
              case "input":
                Er(i), rn(i, f, !1);
                break;
              case "textarea":
                Er(i), wo(i);
                break;
              case "option":
                f.value != null && i.setAttribute("value", "" + Ti(f.value));
                break;
              case "select":
                i.multiple = !!f.multiple, c = f.value, c != null ? Kn(i, !!f.multiple, c, !1) : f.defaultValue != null && Kn(i, !!f.multiple, f.defaultValue, !0);
                break;
              default:
                typeof R.onClick == "function" && (i.onclick = Ds);
            }
            Tp(v, f) && (a.effectTag |= 4);
          }
          a.ref !== null && (a.effectTag |= 128);
        }
        return null;
      case 6:
        if (i && a.stateNode != null)
          Pc(i, a, i.memoizedProps, f);
        else {
          if (typeof f != "string" && a.stateNode === null)
            throw Error(l(166));
          c = Ws(Bo.current), Ws(Br.current), Ac(a) ? (c = a.stateNode, f = a.memoizedProps, c[_r] = a, c.nodeValue !== f && (a.effectTag |= 4)) : (c = (c.nodeType === 9 ? c : c.ownerDocument).createTextNode(f), c[_r] = a, a.stateNode = c);
        }
        return null;
      case 13:
        return St(Kt), f = a.memoizedState, (a.effectTag & 64) !== 0 ? (a.expirationTime = c, a) : (c = f !== null, f = !1, i === null ? a.memoizedProps.fallback !== void 0 && Ac(a) : (v = i.memoizedState, f = v !== null, c || v === null || (v = i.child.sibling, v !== null && (x = a.firstEffect, x !== null ? (a.firstEffect = v, v.nextEffect = x) : (a.firstEffect = a.lastEffect = v, v.nextEffect = null), v.effectTag = 8))), c && !f && (a.mode & 2) !== 0 && (i === null && a.memoizedProps.unstable_avoidThisFallback !== !0 || (Kt.current & 1) !== 0 ? pn === Ga && (pn = Xl) : ((pn === Ga || pn === Xl) && (pn = Lc), dr !== 0 && Ni !== null && (io(Ni, Ut), Xf(Ni, dr)))), (c || f) && (a.effectTag |= 4), null);
      case 4:
        return jo(), _c(a), null;
      case 10:
        return xf(a), null;
      case 17:
        return Qn(a.type) && Va(), null;
      case 19:
        if (St(Kt), f = a.memoizedState, f === null)
          return null;
        if (v = (a.effectTag & 64) !== 0, x = f.rendering, x === null) {
          if (v)
            Zl(f, !1);
          else if (pn !== Ga || i !== null && (i.effectTag & 64) !== 0)
            for (x = a.child; x !== null; ) {
              if (i = gc(x), i !== null) {
                for (a.effectTag |= 64, Zl(f, !1), v = i.updateQueue, v !== null && (a.updateQueue = v, a.effectTag |= 4), f.lastEffect === null && (a.firstEffect = null), a.lastEffect = f.lastEffect, f = a.child; f !== null; )
                  v = f, x = c, v.effectTag &= 2, v.nextEffect = null, v.firstEffect = null, v.lastEffect = null, i = v.alternate, i === null ? (v.childExpirationTime = 0, v.expirationTime = x, v.child = null, v.memoizedProps = null, v.memoizedState = null, v.updateQueue = null, v.dependencies = null) : (v.childExpirationTime = i.childExpirationTime, v.expirationTime = i.expirationTime, v.child = i.child, v.memoizedProps = i.memoizedProps, v.memoizedState = i.memoizedState, v.updateQueue = i.updateQueue, x = i.dependencies, v.dependencies = x === null ? null : { expirationTime: x.expirationTime, firstContext: x.firstContext, responders: x.responders }), f = f.sibling;
                return sn(Kt, Kt.current & 1 | 2), a.child;
              }
              x = x.sibling;
            }
        } else {
          if (!v)
            if (i = gc(x), i !== null) {
              if (a.effectTag |= 64, v = !0, c = i.updateQueue, c !== null && (a.updateQueue = c, a.effectTag |= 4), Zl(f, !0), f.tail === null && f.tailMode === "hidden" && !x.alternate)
                return a = a.lastEffect = f.lastEffect, a !== null && (a.nextEffect = null), null;
            } else
              2 * _t() - f.renderingStartTime > f.tailExpiration && 1 < c && (a.effectTag |= 64, v = !0, Zl(f, !1), a.expirationTime = a.childExpirationTime = c - 1);
          f.isBackwards ? (x.sibling = a.child, a.child = x) : (c = f.last, c !== null ? c.sibling = x : a.child = x, f.last = x);
        }
        return f.tail !== null ? (f.tailExpiration === 0 && (f.tailExpiration = _t() + 500), c = f.tail, f.rendering = c, f.tail = c.sibling, f.lastEffect = a.lastEffect, f.renderingStartTime = _t(), c.sibling = null, a = Kt.current, sn(Kt, v ? a & 1 | 2 : a & 1), c) : null;
    }
    throw Error(l(
      156,
      a.tag
    ));
  }
  function kg(i) {
    switch (i.tag) {
      case 1:
        Qn(i.type) && Va();
        var a = i.effectTag;
        return a & 4096 ? (i.effectTag = a & -4097 | 64, i) : null;
      case 3:
        if (jo(), St(En), St(Pn), a = i.effectTag, (a & 64) !== 0)
          throw Error(l(285));
        return i.effectTag = a & -4097 | 64, i;
      case 5:
        return If(i), null;
      case 13:
        return St(Kt), a = i.effectTag, a & 4096 ? (i.effectTag = a & -4097 | 64, i) : null;
      case 19:
        return St(Kt), null;
      case 4:
        return jo(), null;
      case 10:
        return xf(i), null;
      default:
        return null;
    }
  }
  function Of(i, a) {
    return { value: i, source: a, stack: Ia(a) };
  }
  var _g = typeof WeakSet == "function" ? WeakSet : Set;
  function Lf(i, a) {
    var c = a.source, f = a.stack;
    f === null && c !== null && (f = Ia(c)), c !== null && fi(c.type), a = a.value, i !== null && i.tag === 1 && fi(i.type);
    try {
      console.error(a);
    } catch (v) {
      setTimeout(function() {
        throw v;
      });
    }
  }
  function Pg(i, a) {
    try {
      a.props = i.memoizedProps, a.state = i.memoizedState, a.componentWillUnmount();
    } catch (c) {
      ts(i, c);
    }
  }
  function qp(i) {
    var a = i.ref;
    if (a !== null)
      if (typeof a == "function")
        try {
          a(null);
        } catch (c) {
          ts(i, c);
        }
      else
        a.current = null;
  }
  function zg(i, a) {
    switch (a.tag) {
      case 0:
      case 11:
      case 15:
      case 22:
        return;
      case 1:
        if (a.effectTag & 256 && i !== null) {
          var c = i.memoizedProps, f = i.memoizedState;
          i = a.stateNode, a = i.getSnapshotBeforeUpdate(a.elementType === a.type ? c : pi(a.type, c), f), i.__reactInternalSnapshotBeforeUpdate = a;
        }
        return;
      case 3:
      case 5:
      case 6:
      case 4:
      case 17:
        return;
    }
    throw Error(l(163));
  }
  function Kp(i, a) {
    if (a = a.updateQueue, a = a !== null ? a.lastEffect : null, a !== null) {
      var c = a = a.next;
      do {
        if ((c.tag & i) === i) {
          var f = c.destroy;
          c.destroy = void 0, f !== void 0 && f();
        }
        c = c.next;
      } while (c !== a);
    }
  }
  function Bf(i, a) {
    if (a = a.updateQueue, a = a !== null ? a.lastEffect : null, a !== null) {
      var c = a = a.next;
      do {
        if ((c.tag & i) === i) {
          var f = c.create;
          c.destroy = f();
        }
        c = c.next;
      } while (c !== a);
    }
  }
  function Og(i, a, c) {
    switch (c.tag) {
      case 0:
      case 11:
      case 15:
      case 22:
        Bf(3, c);
        return;
      case 1:
        if (i = c.stateNode, c.effectTag & 4)
          if (a === null)
            i.componentDidMount();
          else {
            var f = c.elementType === c.type ? a.memoizedProps : pi(c.type, a.memoizedProps);
            i.componentDidUpdate(f, a.memoizedState, i.__reactInternalSnapshotBeforeUpdate);
          }
        a = c.updateQueue, a !== null && Tf(c, a, i);
        return;
      case 3:
        if (a = c.updateQueue, a !== null) {
          if (i = null, c.child !== null)
            switch (c.child.tag) {
              case 5:
                i = c.child.stateNode;
                break;
              case 1:
                i = c.child.stateNode;
            }
          Tf(c, a, i);
        }
        return;
      case 5:
        i = c.stateNode, a === null && c.effectTag & 4 && Tp(c.type, c.memoizedProps) && i.focus();
        return;
      case 6:
        return;
      case 4:
        return;
      case 12:
        return;
      case 13:
        c.memoizedState === null && (c = c.alternate, c !== null && (c = c.memoizedState, c !== null && (c = c.dehydrated, c !== null && gp(c))));
        return;
      case 19:
      case 17:
      case 20:
      case 21:
        return;
    }
    throw Error(l(163));
  }
  function jf(i, a, c) {
    switch (typeof eu == "function" && eu(a), a.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
      case 22:
        if (i = a.updateQueue, i !== null && (i = i.lastEffect, i !== null)) {
          var f = i.next;
          xt(97 < c ? 97 : c, function() {
            var v = f;
            do {
              var x = v.destroy;
              if (x !== void 0) {
                var T = a;
                try {
                  x();
                } catch (R) {
                  ts(T, R);
                }
              }
              v = v.next;
            } while (v !== f);
          });
        }
        break;
      case 1:
        qp(a), c = a.stateNode, typeof c.componentWillUnmount == "function" && Pg(a, c);
        break;
      case 5:
        qp(a);
        break;
      case 4:
        zc(i, a, c);
    }
  }
  function em(i) {
    var a = i.alternate;
    i.return = null, i.child = null, i.memoizedState = null, i.updateQueue = null, i.dependencies = null, i.alternate = null, i.firstEffect = null, i.lastEffect = null, i.pendingProps = null, i.memoizedProps = null, i.stateNode = null, a !== null && em(a);
  }
  function tm(i) {
    return i.tag === 5 || i.tag === 3 || i.tag === 4;
  }
  function nm(i) {
    e: {
      for (var a = i.return; a !== null; ) {
        if (tm(a)) {
          var c = a;
          break e;
        }
        a = a.return;
      }
      throw Error(l(160));
    }
    switch (a = c.stateNode, c.tag) {
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
        throw Error(l(161));
    }
    c.effectTag & 16 && (ei(a, ""), c.effectTag &= -17);
    e:
      t:
        for (c = i; ; ) {
          for (; c.sibling === null; ) {
            if (c.return === null || tm(c.return)) {
              c = null;
              break e;
            }
            c = c.return;
          }
          for (c.sibling.return = c.return, c = c.sibling; c.tag !== 5 && c.tag !== 6 && c.tag !== 18; ) {
            if (c.effectTag & 2 || c.child === null || c.tag === 4)
              continue t;
            c.child.return = c, c = c.child;
          }
          if (!(c.effectTag & 2)) {
            c = c.stateNode;
            break e;
          }
        }
    f ? Vf(i, c, a) : Yl(i, c, a);
  }
  function Vf(i, a, c) {
    var f = i.tag, v = f === 5 || f === 6;
    if (v)
      i = v ? i.stateNode : i.stateNode.instance, a ? c.nodeType === 8 ? c.parentNode.insertBefore(i, a) : c.insertBefore(i, a) : (c.nodeType === 8 ? (a = c.parentNode, a.insertBefore(i, c)) : (a = c, a.appendChild(i)), c = c._reactRootContainer, c != null || a.onclick !== null || (a.onclick = Ds));
    else if (f !== 4 && (i = i.child, i !== null))
      for (Vf(i, a, c), i = i.sibling; i !== null; )
        Vf(i, a, c), i = i.sibling;
  }
  function Yl(i, a, c) {
    var f = i.tag, v = f === 5 || f === 6;
    if (v)
      i = v ? i.stateNode : i.stateNode.instance, a ? c.insertBefore(i, a) : c.appendChild(i);
    else if (f !== 4 && (i = i.child, i !== null))
      for (Yl(i, a, c), i = i.sibling; i !== null; )
        Yl(i, a, c), i = i.sibling;
  }
  function zc(i, a, c) {
    for (var f = a, v = !1, x, T; ; ) {
      if (!v) {
        v = f.return;
        e:
          for (; ; ) {
            if (v === null)
              throw Error(l(160));
            switch (x = v.stateNode, v.tag) {
              case 5:
                T = !1;
                break e;
              case 3:
                x = x.containerInfo, T = !0;
                break e;
              case 4:
                x = x.containerInfo, T = !0;
                break e;
            }
            v = v.return;
          }
        v = !0;
      }
      if (f.tag === 5 || f.tag === 6) {
        e:
          for (var R = i, W = f, U = c, Me = W; ; )
            if (jf(R, Me, U), Me.child !== null && Me.tag !== 4)
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
        T ? (R = x, W = f.stateNode, R.nodeType === 8 ? R.parentNode.removeChild(W) : R.removeChild(W)) : x.removeChild(f.stateNode);
      } else if (f.tag === 4) {
        if (f.child !== null) {
          x = f.stateNode.containerInfo, T = !0, f.child.return = f, f = f.child;
          continue;
        }
      } else if (jf(i, f, c), f.child !== null) {
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
  function da(i, a) {
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
        var c = a.stateNode;
        if (c != null) {
          var f = a.memoizedProps, v = i !== null ? i.memoizedProps : f;
          i = a.type;
          var x = a.updateQueue;
          if (a.updateQueue = null, x !== null) {
            for (c[Eo] = f, i === "input" && f.type === "radio" && f.name != null && Aa(c, f), Bd(i, v), a = Bd(i, f), v = 0; v < x.length; v += 2) {
              var T = x[v], R = x[v + 1];
              T === "style" ? Sp(c, R) : T === "dangerouslySetInnerHTML" ? qr(c, R) : T === "children" ? ei(c, R) : Mt(c, T, R, a);
            }
            switch (i) {
              case "input":
                kt(c, f);
                break;
              case "textarea":
                yo(c, f);
                break;
              case "select":
                a = c._wrapperState.wasMultiple, c._wrapperState.wasMultiple = !!f.multiple, i = f.value, i != null ? Kn(c, !!f.multiple, i, !1) : a !== !!f.multiple && (f.defaultValue != null ? Kn(c, !!f.multiple, f.defaultValue, !0) : Kn(c, !!f.multiple, f.multiple ? [] : "", !1));
            }
          }
        }
        return;
      case 6:
        if (a.stateNode === null)
          throw Error(l(162));
        a.stateNode.nodeValue = a.memoizedProps;
        return;
      case 3:
        a = a.stateNode, a.hydrate && (a.hydrate = !1, gp(a.containerInfo));
        return;
      case 12:
        return;
      case 13:
        if (c = a, a.memoizedState === null ? f = !1 : (f = !0, c = a.child, Xa = _t()), c !== null)
          e:
            for (i = c; ; ) {
              if (i.tag === 5)
                x = i.stateNode, f ? (x = x.style, typeof x.setProperty == "function" ? x.setProperty("display", "none", "important") : x.display = "none") : (x = i.stateNode, v = i.memoizedProps.style, v = v != null && v.hasOwnProperty("display") ? v.display : null, x.style.display = bp("display", v));
              else if (i.tag === 6)
                i.stateNode.nodeValue = f ? "" : i.memoizedProps;
              else if (i.tag === 13 && i.memoizedState !== null && i.memoizedState.dehydrated === null) {
                x = i.child.sibling, x.return = i, i = x;
                continue;
              } else if (i.child !== null) {
                i.child.return = i, i = i.child;
                continue;
              }
              if (i === c)
                break;
              for (; i.sibling === null; ) {
                if (i.return === null || i.return === c)
                  break e;
                i = i.return;
              }
              i.sibling.return = i.return, i = i.sibling;
            }
        Gl(a);
        return;
      case 19:
        Gl(a);
        return;
      case 17:
        return;
    }
    throw Error(l(163));
  }
  function Gl(i) {
    var a = i.updateQueue;
    if (a !== null) {
      i.updateQueue = null;
      var c = i.stateNode;
      c === null && (c = i.stateNode = new _g()), a.forEach(function(f) {
        var v = Ug.bind(null, i, f);
        c.has(f) || (c.add(f), f.then(v, v));
      });
    }
  }
  var im = typeof WeakMap == "function" ? WeakMap : Map;
  function Js(i, a, c) {
    c = Wa(c, null), c.tag = 3, c.payload = { element: null };
    var f = a.value;
    return c.callback = function() {
      eo || (eo = !0, Wo = f), Lf(i, a);
    }, c;
  }
  function rm(i, a, c) {
    c = Wa(c, null), c.tag = 3;
    var f = i.type.getDerivedStateFromError;
    if (typeof f == "function") {
      var v = a.value;
      c.payload = function() {
        return Lf(i, a), f(v);
      };
    }
    var x = i.stateNode;
    return x !== null && typeof x.componentDidCatch == "function" && (c.callback = function() {
      typeof f != "function" && (Yi === null ? Yi = /* @__PURE__ */ new Set([this]) : Yi.add(this), Lf(i, a));
      var T = a.stack;
      this.componentDidCatch(a.value, { componentStack: T !== null ? T : "" });
    }), c;
  }
  var Lg = Math.ceil, Oc = Zt.ReactCurrentDispatcher, am = Zt.ReactCurrentOwner, zn = 0, Uf = 8, Zi = 16, jr = 32, Ga = 0, On = 1, sm = 2, Xl = 3, Lc = 4, Hf = 5, at = zn, Ni = null, ot = null, Ut = 0, pn = Ga, qs = null, ki = 1073741823, Ho = 1073741823, Vr = null, dr = 0, Ks = !1, Xa = 0, Bc = 500, Le = null, eo = !1, Wo = null, Yi = null, Jl = !1, Ja = null, Fo = 90, fr = null, $o = 0, Wf = null, jc = 0;
  function Ln() {
    return (at & (Zi | jr)) !== zn ? 1073741821 - (_t() / 10 | 0) : jc !== 0 ? jc : jc = 1073741821 - (_t() / 10 | 0);
  }
  function qa(i, a, c) {
    if (a = a.mode, (a & 2) === 0)
      return 1073741823;
    var f = lr();
    if ((a & 4) === 0)
      return f === 99 ? 1073741823 : 1073741822;
    if ((at & Zi) !== zn)
      return Ut;
    if (c !== null)
      i = Vt(i, c.timeoutMs | 0 || 5e3, 250);
    else
      switch (f) {
        case 99:
          i = 1073741823;
          break;
        case 98:
          i = Vt(i, 150, 100);
          break;
        case 97:
        case 96:
          i = Vt(i, 5e3, 250);
          break;
        case 95:
          i = 2;
          break;
        default:
          throw Error(l(326));
      }
    return Ni !== null && i === Ut && --i, i;
  }
  function Ka(i, a) {
    if (50 < $o)
      throw $o = 0, Wf = null, Error(l(185));
    if (i = to(i, a), i !== null) {
      var c = lr();
      a === 1073741823 ? (at & Uf) !== zn && (at & (Zi | jr)) === zn ? Ff(i) : (_i(i), at === zn && Ri()) : _i(i), (at & 4) === zn || c !== 98 && c !== 99 || (fr === null ? fr = /* @__PURE__ */ new Map([[i, a]]) : (c = fr.get(i), (c === void 0 || c > a) && fr.set(i, a)));
    }
  }
  function to(i, a) {
    i.expirationTime < a && (i.expirationTime = a);
    var c = i.alternate;
    c !== null && c.expirationTime < a && (c.expirationTime = a);
    var f = i.return, v = null;
    if (f === null && i.tag === 3)
      v = i.stateNode;
    else
      for (; f !== null; ) {
        if (c = f.alternate, f.childExpirationTime < a && (f.childExpirationTime = a), c !== null && c.childExpirationTime < a && (c.childExpirationTime = a), f.return === null && f.tag === 3) {
          v = f.stateNode;
          break;
        }
        f = f.return;
      }
    return v !== null && (Ni === v && (ql(a), pn === Lc && io(v, Ut)), Xf(v, a)), v;
  }
  function Vc(i) {
    var a = i.lastExpiredTime;
    if (a !== 0 || (a = i.firstPendingTime, !bm(i, a)))
      return a;
    var c = i.lastPingedTime;
    return i = i.nextKnownPendingLevel, i = c > i ? c : i, 2 >= i && a !== i ? 0 : i;
  }
  function _i(i) {
    if (i.lastExpiredTime !== 0)
      i.callbackExpirationTime = 1073741823, i.callbackPriority = 99, i.callbackNode = Vs(Ff.bind(null, i));
    else {
      var a = Vc(i), c = i.callbackNode;
      if (a === 0)
        c !== null && (i.callbackNode = null, i.callbackExpirationTime = 0, i.callbackPriority = 90);
      else {
        var f = Ln();
        if (a === 1073741823 ? f = 99 : a === 1 || a === 2 ? f = 95 : (f = 10 * (1073741821 - a) - 10 * (1073741821 - f), f = 0 >= f ? 99 : 250 >= f ? 98 : 5250 >= f ? 97 : 95), c !== null) {
          var v = i.callbackPriority;
          if (i.callbackExpirationTime === a && v >= f)
            return;
          c !== yf && oc(c);
        }
        i.callbackExpirationTime = a, i.callbackPriority = f, a = a === 1073741823 ? Vs(Ff.bind(null, i)) : zp(f, om.bind(null, i), { timeout: 10 * (1073741821 - a) - _t() }), i.callbackNode = a;
      }
    }
  }
  function om(i, a) {
    if (jc = 0, a)
      return a = Ln(), ns(i, a), _i(i), null;
    var c = Vc(i);
    if (c !== 0) {
      if (a = i.callbackNode, (at & (Zi | jr)) !== zn)
        throw Error(l(327));
      if (Qo(), i === Ni && c === Ut || no(i, c), ot !== null) {
        var f = at;
        at |= Zi;
        var v = dm();
        do
          try {
            hm();
            break;
          } catch (R) {
            cm(i, R);
          }
        while (1);
        if (Sf(), at = f, Oc.current = v, pn === On)
          throw a = qs, no(i, c), io(i, c), _i(i), a;
        if (ot === null)
          switch (v = i.finishedWork = i.current.alternate, i.finishedExpirationTime = c, f = pn, Ni = null, f) {
            case Ga:
            case On:
              throw Error(l(345));
            case sm:
              ns(i, 2 < c ? 2 : c);
              break;
            case Xl:
              if (io(i, c), f = i.lastSuspendedTime, c === f && (i.nextKnownPendingLevel = Kl(v)), ki === 1073741823 && (v = Xa + Bc - _t(), 10 < v)) {
                if (Ks) {
                  var x = i.lastPingedTime;
                  if (x === 0 || x >= c) {
                    i.lastPingedTime = c, no(i, c);
                    break;
                  }
                }
                if (x = Vc(i), x !== 0 && x !== c)
                  break;
                if (f !== 0 && f !== c) {
                  i.lastPingedTime = f;
                  break;
                }
                i.timeoutHandle = Zu(es.bind(null, i), v);
                break;
              }
              es(i);
              break;
            case Lc:
              if (io(i, c), f = i.lastSuspendedTime, c === f && (i.nextKnownPendingLevel = Kl(v)), Ks && (v = i.lastPingedTime, v === 0 || v >= c)) {
                i.lastPingedTime = c, no(i, c);
                break;
              }
              if (v = Vc(i), v !== 0 && v !== c)
                break;
              if (f !== 0 && f !== c) {
                i.lastPingedTime = f;
                break;
              }
              if (Ho !== 1073741823 ? f = 10 * (1073741821 - Ho) - _t() : ki === 1073741823 ? f = 0 : (f = 10 * (1073741821 - ki) - 5e3, v = _t(), c = 10 * (1073741821 - c) - v, f = v - f, 0 > f && (f = 0), f = (120 > f ? 120 : 480 > f ? 480 : 1080 > f ? 1080 : 1920 > f ? 1920 : 3e3 > f ? 3e3 : 4320 > f ? 4320 : 1960 * Lg(f / 1960)) - f, c < f && (f = c)), 10 < f) {
                i.timeoutHandle = Zu(es.bind(null, i), f);
                break;
              }
              es(i);
              break;
            case Hf:
              if (ki !== 1073741823 && Vr !== null) {
                x = ki;
                var T = Vr;
                if (f = T.busyMinDurationMs | 0, 0 >= f ? f = 0 : (v = T.busyDelayMs | 0, x = _t() - (10 * (1073741821 - x) - (T.timeoutMs | 0 || 5e3)), f = x <= v ? 0 : v + f - x), 10 < f) {
                  io(i, c), i.timeoutHandle = Zu(es.bind(null, i), f);
                  break;
                }
              }
              es(i);
              break;
            default:
              throw Error(l(329));
          }
        if (_i(i), i.callbackNode === a)
          return om.bind(null, i);
      }
    }
    return null;
  }
  function Ff(i) {
    var a = i.lastExpiredTime;
    if (a = a !== 0 ? a : 1073741823, (at & (Zi | jr)) !== zn)
      throw Error(l(327));
    if (Qo(), i === Ni && a === Ut || no(i, a), ot !== null) {
      var c = at;
      at |= Zi;
      var f = dm();
      do
        try {
          fm();
          break;
        } catch (v) {
          cm(i, v);
        }
      while (1);
      if (Sf(), at = c, Oc.current = f, pn === On)
        throw c = qs, no(i, a), io(i, a), _i(i), c;
      if (ot !== null)
        throw Error(l(261));
      i.finishedWork = i.current.alternate, i.finishedExpirationTime = a, Ni = null, es(i), _i(i);
    }
    return null;
  }
  function Bg() {
    if (fr !== null) {
      var i = fr;
      fr = null, i.forEach(function(a, c) {
        ns(c, a), _i(c);
      }), Ri();
    }
  }
  function lm(i, a) {
    var c = at;
    at |= 1;
    try {
      return i(a);
    } finally {
      at = c, at === zn && Ri();
    }
  }
  function um(i, a) {
    var c = at;
    at &= -2, at |= Uf;
    try {
      return i(a);
    } finally {
      at = c, at === zn && Ri();
    }
  }
  function no(i, a) {
    i.finishedWork = null, i.finishedExpirationTime = 0;
    var c = i.timeoutHandle;
    if (c !== -1 && (i.timeoutHandle = -1, Mp(c)), ot !== null)
      for (c = ot.return; c !== null; ) {
        var f = c;
        switch (f.tag) {
          case 1:
            f = f.type.childContextTypes, f != null && Va();
            break;
          case 3:
            jo(), St(En), St(Pn);
            break;
          case 5:
            If(f);
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
            xf(f);
        }
        c = c.return;
      }
    Ni = i, ot = hr(i.current, null), Ut = a, pn = Ga, qs = null, Ho = ki = 1073741823, Vr = null, dr = 0, Ks = !1;
  }
  function cm(i, a) {
    do {
      try {
        if (Sf(), wc.current = Ic, Qa)
          for (var c = $t.memoizedState; c !== null; ) {
            var f = c.queue;
            f !== null && (f.pending = null), c = c.next;
          }
        if (Zn = 0, ln = on = $t = null, Qa = !1, ot === null || ot.return === null)
          return pn = On, qs = a, ot = null;
        e: {
          var v = i, x = ot.return, T = ot, R = a;
          if (a = Ut, T.effectTag |= 2048, T.firstEffect = T.lastEffect = null, R !== null && typeof R == "object" && typeof R.then == "function") {
            var W = R;
            if ((T.mode & 2) === 0) {
              var U = T.alternate;
              U ? (T.updateQueue = U.updateQueue, T.memoizedState = U.memoizedState, T.expirationTime = U.expirationTime) : (T.updateQueue = null, T.memoizedState = null);
            }
            var Me = (Kt.current & 1) !== 0, De = x;
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
                      var P = Wa(1073741823, null);
                      P.tag = 2, Fa(T, P);
                    }
                  T.expirationTime = 1073741823;
                  break e;
                }
                R = void 0, T = a;
                var Q = v.pingCache;
                if (Q === null ? (Q = v.pingCache = new im(), R = /* @__PURE__ */ new Set(), Q.set(W, R)) : (R = Q.get(W), R === void 0 && (R = /* @__PURE__ */ new Set(), Q.set(W, R))), !R.has(T)) {
                  R.add(T);
                  var ue = gm.bind(null, v, W, T);
                  W.then(ue, ue);
                }
                De.effectTag |= 4096, De.expirationTime = a;
                break e;
              }
              De = De.return;
            } while (De !== null);
            R = Error((fi(T.type) || "A React component") + ` suspended while rendering, but no fallback UI was specified.

Add a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display.` + Ia(T));
          }
          pn !== Hf && (pn = sm), R = Of(R, T), De = x;
          do {
            switch (De.tag) {
              case 3:
                W = R, De.effectTag |= 4096, De.expirationTime = a;
                var ye = Js(De, W, a);
                Cf(De, ye);
                break e;
              case 1:
                W = R;
                var _e = De.type, qe = De.stateNode;
                if ((De.effectTag & 64) === 0 && (typeof _e.getDerivedStateFromError == "function" || qe !== null && typeof qe.componentDidCatch == "function" && (Yi === null || !Yi.has(qe)))) {
                  De.effectTag |= 4096, De.expirationTime = a;
                  var bt = rm(De, W, a);
                  Cf(De, bt);
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
    var i = Oc.current;
    return Oc.current = Ic, i === null ? Ic : i;
  }
  function $f(i, a) {
    i < ki && 2 < i && (ki = i), a !== null && i < Ho && 2 < i && (Ho = i, Vr = a);
  }
  function ql(i) {
    i > dr && (dr = i);
  }
  function fm() {
    for (; ot !== null; )
      ot = Qf(ot);
  }
  function hm() {
    for (; ot !== null && !Ag(); )
      ot = Qf(ot);
  }
  function Qf(i) {
    var a = ym(i.alternate, i, Ut);
    return i.memoizedProps = i.pendingProps, a === null && (a = pm(i)), am.current = null, a;
  }
  function pm(i) {
    ot = i;
    do {
      var a = ot.alternate;
      if (i = ot.return, (ot.effectTag & 2048) === 0) {
        if (a = Jp(a, ot, Ut), Ut === 1 || ot.childExpirationTime !== 1) {
          for (var c = 0, f = ot.child; f !== null; ) {
            var v = f.expirationTime, x = f.childExpirationTime;
            v > c && (c = v), x > c && (c = x), f = f.sibling;
          }
          ot.childExpirationTime = c;
        }
        if (a !== null)
          return a;
        i !== null && (i.effectTag & 2048) === 0 && (i.firstEffect === null && (i.firstEffect = ot.firstEffect), ot.lastEffect !== null && (i.lastEffect !== null && (i.lastEffect.nextEffect = ot.firstEffect), i.lastEffect = ot.lastEffect), 1 < ot.effectTag && (i.lastEffect !== null ? i.lastEffect.nextEffect = ot : i.firstEffect = ot, i.lastEffect = ot));
      } else {
        if (a = kg(ot), a !== null)
          return a.effectTag &= 2047, a;
        i !== null && (i.firstEffect = i.lastEffect = null, i.effectTag |= 2048);
      }
      if (a = ot.sibling, a !== null)
        return a;
      ot = i;
    } while (ot !== null);
    return pn === Ga && (pn = Hf), null;
  }
  function Kl(i) {
    var a = i.expirationTime;
    return i = i.childExpirationTime, a > i ? a : i;
  }
  function es(i) {
    var a = lr();
    return xt(99, jg.bind(null, i, a)), null;
  }
  function jg(i, a) {
    do
      Qo();
    while (Ja !== null);
    if ((at & (Zi | jr)) !== zn)
      throw Error(l(327));
    var c = i.finishedWork, f = i.finishedExpirationTime;
    if (c === null)
      return null;
    if (i.finishedWork = null, i.finishedExpirationTime = 0, c === i.current)
      throw Error(l(177));
    i.callbackNode = null, i.callbackExpirationTime = 0, i.callbackPriority = 90, i.nextKnownPendingLevel = 0;
    var v = Kl(c);
    if (i.firstPendingTime = v, f <= i.lastSuspendedTime ? i.firstSuspendedTime = i.lastSuspendedTime = i.nextKnownPendingLevel = 0 : f <= i.firstSuspendedTime && (i.firstSuspendedTime = f - 1), f <= i.lastPingedTime && (i.lastPingedTime = 0), f <= i.lastExpiredTime && (i.lastExpiredTime = 0), i === Ni && (ot = Ni = null, Ut = 0), 1 < c.effectTag ? c.lastEffect !== null ? (c.lastEffect.nextEffect = c, v = c.firstEffect) : v = c : v = c.firstEffect, v !== null) {
      var x = at;
      at |= jr, am.current = null, Qu = ka;
      var T = Hd();
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
      Fd = { activeElementDetached: null, focusedElem: T, selectionRange: R }, ka = !1, Le = v;
      do
        try {
          mm();
        } catch (lt) {
          if (Le === null)
            throw Error(l(330));
          ts(Le, lt), Le = Le.nextEffect;
        }
      while (Le !== null);
      Le = v;
      do
        try {
          for (T = i, R = a; Le !== null; ) {
            var ue = Le.effectTag;
            if (ue & 16 && ei(Le.stateNode, ""), ue & 128) {
              var ye = Le.alternate;
              if (ye !== null) {
                var _e = ye.ref;
                _e !== null && (typeof _e == "function" ? _e(null) : _e.current = null);
              }
            }
            switch (ue & 1038) {
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
            throw Error(l(330));
          ts(Le, lt), Le = Le.nextEffect;
        }
      while (Le !== null);
      if (_e = Fd, ye = Hd(), ue = _e.focusedElem, R = _e.selectionRange, ye !== ue && ue && ue.ownerDocument && Ud(ue.ownerDocument.documentElement, ue)) {
        for (R !== null && Wu(ue) && (ye = R.start, _e = R.end, _e === void 0 && (_e = ye), "selectionStart" in ue ? (ue.selectionStart = ye, ue.selectionEnd = Math.min(_e, ue.value.length)) : (_e = (ye = ue.ownerDocument || document) && ye.defaultView || window, _e.getSelection && (_e = _e.getSelection(), U = ue.textContent.length, T = Math.min(R.start, U), R = R.end === void 0 ? T : Math.min(R.end, U), !_e.extend && T > R && (U = R, R = T, T = U), U = Vd(ue, T), Me = Vd(ue, R), U && Me && (_e.rangeCount !== 1 || _e.anchorNode !== U.node || _e.anchorOffset !== U.offset || _e.focusNode !== Me.node || _e.focusOffset !== Me.offset) && (ye = ye.createRange(), ye.setStart(U.node, U.offset), _e.removeAllRanges(), T > R ? (_e.addRange(ye), _e.extend(Me.node, Me.offset)) : (ye.setEnd(Me.node, Me.offset), _e.addRange(ye)))))), ye = [], _e = ue; _e = _e.parentNode; )
          _e.nodeType === 1 && ye.push({
            element: _e,
            left: _e.scrollLeft,
            top: _e.scrollTop
          });
        for (typeof ue.focus == "function" && ue.focus(), ue = 0; ue < ye.length; ue++)
          _e = ye[ue], _e.element.scrollLeft = _e.left, _e.element.scrollTop = _e.top;
      }
      ka = !!Qu, Fd = Qu = null, i.current = c, Le = v;
      do
        try {
          for (ue = i; Le !== null; ) {
            var qe = Le.effectTag;
            if (qe & 36 && Og(ue, Le.alternate, Le), qe & 128) {
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
            throw Error(l(330));
          ts(Le, lt), Le = Le.nextEffect;
        }
      while (Le !== null);
      Le = null, _p(), at = x;
    } else
      i.current = c;
    if (Jl)
      Jl = !1, Ja = i, Fo = a;
    else
      for (Le = v; Le !== null; )
        a = Le.nextEffect, Le.nextEffect = null, Le = a;
    if (a = i.firstPendingTime, a === 0 && (Yi = null), a === 1073741823 ? i === Wf ? $o++ : ($o = 0, Wf = i) : $o = 0, typeof Uc == "function" && Uc(c.stateNode, f), _i(i), eo)
      throw eo = !1, i = Wo, Wo = null, i;
    return (at & Uf) !== zn || Ri(), null;
  }
  function mm() {
    for (; Le !== null; ) {
      var i = Le.effectTag;
      (i & 256) !== 0 && zg(Le.alternate, Le), (i & 512) === 0 || Jl || (Jl = !0, zp(97, function() {
        return Qo(), null;
      })), Le = Le.nextEffect;
    }
  }
  function Qo() {
    if (Fo !== 90) {
      var i = 97 < Fo ? 97 : Fo;
      return Fo = 90, xt(i, Vg);
    }
  }
  function Vg() {
    if (Ja === null)
      return !1;
    var i = Ja;
    if (Ja = null, (at & (Zi | jr)) !== zn)
      throw Error(l(331));
    var a = at;
    for (at |= jr, i = i.current.firstEffect; i !== null; ) {
      try {
        var c = i;
        if ((c.effectTag & 512) !== 0)
          switch (c.tag) {
            case 0:
            case 11:
            case 15:
            case 22:
              Kp(5, c), Bf(5, c);
          }
      } catch (f) {
        if (i === null)
          throw Error(l(330));
        ts(i, f);
      }
      c = i.nextEffect, i.nextEffect = null, i = c;
    }
    return at = a, Ri(), !0;
  }
  function vm(i, a, c) {
    a = Of(c, a), a = Js(i, a, 1073741823), Fa(i, a), i = to(i, 1073741823), i !== null && _i(i);
  }
  function ts(i, a) {
    if (i.tag === 3)
      vm(i, i, a);
    else
      for (var c = i.return; c !== null; ) {
        if (c.tag === 3) {
          vm(c, i, a);
          break;
        } else if (c.tag === 1) {
          var f = c.stateNode;
          if (typeof c.type.getDerivedStateFromError == "function" || typeof f.componentDidCatch == "function" && (Yi === null || !Yi.has(f))) {
            i = Of(a, i), i = rm(c, i, 1073741823), Fa(c, i), c = to(c, 1073741823), c !== null && _i(c);
            break;
          }
        }
        c = c.return;
      }
  }
  function gm(i, a, c) {
    var f = i.pingCache;
    f !== null && f.delete(a), Ni === i && Ut === c ? pn === Lc || pn === Xl && ki === 1073741823 && _t() - Xa < Bc ? no(i, Ut) : Ks = !0 : bm(i, c) && (a = i.lastPingedTime, a !== 0 && a < c || (i.lastPingedTime = c, _i(i)));
  }
  function Ug(i, a) {
    var c = i.stateNode;
    c !== null && c.delete(a), a = 0, a === 0 && (a = Ln(), a = qa(a, i, null)), i = to(i, a), i !== null && _i(i);
  }
  var ym;
  ym = function(i, a, c) {
    var f = a.expirationTime;
    if (i !== null) {
      var v = a.pendingProps;
      if (i.memoizedProps !== v || En.current)
        cr = !0;
      else {
        if (f < c) {
          switch (cr = !1, a.tag) {
            case 3:
              Nc(a), Gt();
              break;
            case 5:
              if (Ef(a), a.mode & 4 && c !== 1 && v.hidden)
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
                return f = a.child.childExpirationTime, f !== 0 && f >= c ? Zp(i, a, c) : (sn(Kt, Kt.current & 1), a = ca(i, a, c), a !== null ? a.sibling : null);
              sn(Kt, Kt.current & 1);
              break;
            case 19:
              if (f = a.childExpirationTime >= c, (i.effectTag & 64) !== 0) {
                if (f)
                  return Gp(i, a, c);
                a.effectTag |= 64;
              }
              if (v = a.memoizedState, v !== null && (v.rendering = null, v.tail = null), sn(Kt, Kt.current), !f)
                return null;
          }
          return ca(i, a, c);
        }
        cr = !1;
      }
    } else
      cr = !1;
    switch (a.expirationTime = 0, a.tag) {
      case 2:
        if (f = a.type, i !== null && (i.alternate = null, a.alternate = null, a.effectTag |= 2), i = a.pendingProps, v = ja(a, Pn.current), mi(a, c), v = Af(
          null,
          a,
          f,
          i,
          v,
          c
        ), a.effectTag |= 1, typeof v == "object" && v !== null && typeof v.render == "function" && v.$$typeof === void 0) {
          if (a.tag = 1, a.memoizedState = null, a.updateQueue = null, Qn(f)) {
            var x = !0;
            No(a);
          } else
            x = !1;
          a.memoizedState = v.state !== null && v.state !== void 0 ? v.state : null, hc(a);
          var T = f.getDerivedStateFromProps;
          typeof T == "function" && Oo(a, f, T, i), v.updater = $a, a.stateNode = v, v._reactInternalFiber = a, jl(a, f, i, c), a = Pf(null, a, f, !0, x, c);
        } else
          a.tag = 0, Di(null, a, v, c), a = a.child;
        return a;
      case 16:
        e: {
          if (v = a.elementType, i !== null && (i.alternate = null, a.alternate = null, a.effectTag |= 2), i = a.pendingProps, tr(v), v._status !== 1)
            throw v._result;
          switch (v = v._result, a.type = v, x = a.tag = tu(v), i = pi(v, i), x) {
            case 0:
              a = Gs(null, a, v, i, c);
              break e;
            case 1:
              a = Qp(null, a, v, i, c);
              break e;
            case 11:
              a = Fp(null, a, v, i, c);
              break e;
            case 14:
              a = Ql(null, a, v, pi(v.type, i), f, c);
              break e;
          }
          throw Error(l(306, v, ""));
        }
        return a;
      case 0:
        return f = a.type, v = a.pendingProps, v = a.elementType === f ? v : pi(f, v), Gs(i, a, f, v, c);
      case 1:
        return f = a.type, v = a.pendingProps, v = a.elementType === f ? v : pi(f, v), Qp(i, a, f, v, c);
      case 3:
        if (Nc(a), f = a.updateQueue, i === null || f === null)
          throw Error(l(282));
        if (f = a.pendingProps, v = a.memoizedState, v = v !== null ? v.element : null, pc(i, a), zo(a, f, null, c), f = a.memoizedState.element, f === v)
          Gt(), a = ca(i, a, c);
        else {
          if ((v = a.stateNode.hydrate) && (Ya = Mo(a.stateNode.containerInfo.firstChild), ur = a, v = Ys = !0), v)
            for (c = Mf(a, null, f, c), a.child = c; c; )
              c.effectTag = c.effectTag & -3 | 1024, c = c.sibling;
          else
            Di(i, a, f, c), Gt();
          a = a.child;
        }
        return a;
      case 5:
        return Ef(a), i === null && $l(a), f = a.type, v = a.pendingProps, x = i !== null ? i.memoizedProps : null, T = v.children, bl(f, v) ? T = null : x !== null && bl(f, x) && (a.effectTag |= 16), $p(i, a), a.mode & 4 && c !== 1 && v.hidden ? (a.expirationTime = a.childExpirationTime = 1, a = null) : (Di(i, a, T, c), a = a.child), a;
      case 6:
        return i === null && $l(a), null;
      case 13:
        return Zp(i, a, c);
      case 4:
        return vc(a, a.stateNode.containerInfo), f = a.pendingProps, i === null ? a.child = Lo(a, null, f, c) : Di(i, a, f, c), a.child;
      case 11:
        return f = a.type, v = a.pendingProps, v = a.elementType === f ? v : pi(f, v), Fp(i, a, f, v, c);
      case 7:
        return Di(i, a, a.pendingProps, c), a.child;
      case 8:
        return Di(
          i,
          a,
          a.pendingProps.children,
          c
        ), a.child;
      case 12:
        return Di(i, a, a.pendingProps.children, c), a.child;
      case 10:
        e: {
          f = a.type._context, v = a.pendingProps, T = a.memoizedProps, x = v.value;
          var R = a.type._context;
          if (sn(Ua, R._currentValue), R._currentValue = x, T !== null)
            if (R = T.value, x = Ii(R, x) ? 0 : (typeof f._calculateChangedBits == "function" ? f._calculateChangedBits(R, x) : 1073741823) | 0, x === 0) {
              if (T.children === v.children && !En.current) {
                a = ca(i, a, c);
                break e;
              }
            } else
              for (R = a.child, R !== null && (R.return = a); R !== null; ) {
                var W = R.dependencies;
                if (W !== null) {
                  T = R.child;
                  for (var U = W.firstContext; U !== null; ) {
                    if (U.context === f && (U.observedBits & x) !== 0) {
                      R.tag === 1 && (U = Wa(c, null), U.tag = 2, Fa(R, U)), R.expirationTime < c && (R.expirationTime = c), U = R.alternate, U !== null && U.expirationTime < c && (U.expirationTime = c), Po(R.return, c), W.expirationTime < c && (W.expirationTime = c);
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
          Di(i, a, v.children, c), a = a.child;
        }
        return a;
      case 9:
        return v = a.type, x = a.pendingProps, f = x.children, mi(a, c), v = Qi(v, x.unstable_observedBits), f = f(v), a.effectTag |= 1, Di(i, a, f, c), a.child;
      case 14:
        return v = a.type, x = pi(v, a.pendingProps), x = pi(v.type, x), Ql(i, a, v, x, f, c);
      case 15:
        return Dc(i, a, a.type, a.pendingProps, f, c);
      case 17:
        return f = a.type, v = a.pendingProps, v = a.elementType === f ? v : pi(f, v), i !== null && (i.alternate = null, a.alternate = null, a.effectTag |= 2), a.tag = 1, Qn(f) ? (i = !0, No(a)) : i = !1, mi(a, c), Lp(a, f, v), jl(a, f, v, c), Pf(
          null,
          a,
          f,
          !0,
          i,
          c
        );
      case 19:
        return Gp(i, a, c);
    }
    throw Error(l(156, a.tag));
  };
  var Uc = null, eu = null;
  function Hg(i) {
    if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u")
      return !1;
    var a = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (a.isDisabled || !a.supportsFiber)
      return !0;
    try {
      var c = a.inject(i);
      Uc = function(f) {
        try {
          a.onCommitFiberRoot(c, f, void 0, (f.current.effectTag & 64) === 64);
        } catch {
        }
      }, eu = function(f) {
        try {
          a.onCommitFiberUnmount(c, f);
        } catch {
        }
      };
    } catch {
    }
    return !0;
  }
  function Wg(i, a, c, f) {
    this.tag = i, this.key = c, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = a, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = f, this.effectTag = 0, this.lastEffect = this.firstEffect = this.nextEffect = null, this.childExpirationTime = this.expirationTime = 0, this.alternate = null;
  }
  function Ur(i, a, c, f) {
    return new Wg(i, a, c, f);
  }
  function Zf(i) {
    return i = i.prototype, !(!i || !i.isReactComponent);
  }
  function tu(i) {
    if (typeof i == "function")
      return Zf(i) ? 1 : 0;
    if (i != null) {
      if (i = i.$$typeof, i === ci)
        return 11;
      if (i === Gr)
        return 14;
    }
    return 2;
  }
  function hr(i, a) {
    var c = i.alternate;
    return c === null ? (c = Ur(i.tag, a, i.key, i.mode), c.elementType = i.elementType, c.type = i.type, c.stateNode = i.stateNode, c.alternate = i, i.alternate = c) : (c.pendingProps = a, c.effectTag = 0, c.nextEffect = null, c.firstEffect = null, c.lastEffect = null), c.childExpirationTime = i.childExpirationTime, c.expirationTime = i.expirationTime, c.child = i.child, c.memoizedProps = i.memoizedProps, c.memoizedState = i.memoizedState, c.updateQueue = i.updateQueue, a = i.dependencies, c.dependencies = a === null ? null : {
      expirationTime: a.expirationTime,
      firstContext: a.firstContext,
      responders: a.responders
    }, c.sibling = i.sibling, c.index = i.index, c.ref = i.ref, c;
  }
  function Hc(i, a, c, f, v, x) {
    var T = 2;
    if (f = i, typeof i == "function")
      Zf(i) && (T = 1);
    else if (typeof i == "string")
      T = 5;
    else
      e:
        switch (i) {
          case Jn:
            return fa(c.children, v, x, a);
          case Sn:
            T = 8, v |= 7;
            break;
          case Ne:
            T = 8, v |= 1;
            break;
          case st:
            return i = Ur(12, c, a, v | 8), i.elementType = st, i.type = st, i.expirationTime = x, i;
          case Mr:
            return i = Ur(13, c, a, v), i.type = Mr, i.elementType = Mr, i.expirationTime = x, i;
          case jn:
            return i = Ur(19, c, a, v), i.elementType = jn, i.expirationTime = x, i;
          default:
            if (typeof i == "object" && i !== null)
              switch (i.$$typeof) {
                case We:
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
                case Ui:
                  T = 16, f = null;
                  break e;
                case Ma:
                  T = 22;
                  break e;
              }
            throw Error(l(130, i == null ? i : typeof i, ""));
        }
    return a = Ur(T, c, a, v), a.elementType = i, a.type = f, a.expirationTime = x, a;
  }
  function fa(i, a, c, f) {
    return i = Ur(7, i, f, a), i.expirationTime = c, i;
  }
  function Yf(i, a, c) {
    return i = Ur(6, i, null, a), i.expirationTime = c, i;
  }
  function Gf(i, a, c) {
    return a = Ur(4, i.children !== null ? i.children : [], i.key, a), a.expirationTime = c, a.stateNode = { containerInfo: i.containerInfo, pendingChildren: null, implementation: i.implementation }, a;
  }
  function wm(i, a, c) {
    this.tag = a, this.current = null, this.containerInfo = i, this.pingCache = this.pendingChildren = null, this.finishedExpirationTime = 0, this.finishedWork = null, this.timeoutHandle = -1, this.pendingContext = this.context = null, this.hydrate = c, this.callbackNode = null, this.callbackPriority = 90, this.lastExpiredTime = this.lastPingedTime = this.nextKnownPendingLevel = this.lastSuspendedTime = this.firstSuspendedTime = this.firstPendingTime = 0;
  }
  function bm(i, a) {
    var c = i.firstSuspendedTime;
    return i = i.lastSuspendedTime, c !== 0 && c >= a && i <= a;
  }
  function io(i, a) {
    var c = i.firstSuspendedTime, f = i.lastSuspendedTime;
    c < a && (i.firstSuspendedTime = a), (f > a || c === 0) && (i.lastSuspendedTime = a), a <= i.lastPingedTime && (i.lastPingedTime = 0), a <= i.lastExpiredTime && (i.lastExpiredTime = 0);
  }
  function Xf(i, a) {
    a > i.firstPendingTime && (i.firstPendingTime = a);
    var c = i.firstSuspendedTime;
    c !== 0 && (a >= c ? i.firstSuspendedTime = i.lastSuspendedTime = i.nextKnownPendingLevel = 0 : a >= i.lastSuspendedTime && (i.lastSuspendedTime = a + 1), a > i.nextKnownPendingLevel && (i.nextKnownPendingLevel = a));
  }
  function ns(i, a) {
    var c = i.lastExpiredTime;
    (c === 0 || c > a) && (i.lastExpiredTime = a);
  }
  function nu(i, a, c, f) {
    var v = a.current, x = Ln(), T = Bl.suspense;
    x = qa(x, v, T);
    e:
      if (c) {
        c = c._reactInternalFiber;
        t: {
          if (fn(c) !== c || c.tag !== 1)
            throw Error(l(170));
          var R = c;
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
          throw Error(l(171));
        }
        if (c.tag === 1) {
          var W = c.type;
          if (Qn(W)) {
            c = js(c, W, R);
            break e;
          }
        }
        c = R;
      } else
        c = Or;
    return a.context === null ? a.context = c : a.pendingContext = c, a = Wa(x, T), a.payload = { element: i }, f = f === void 0 ? null : f, f !== null && (a.callback = f), Fa(v, a), Ka(v, x), x;
  }
  function Wc(i) {
    if (i = i.current, !i.child)
      return null;
    switch (i.child.tag) {
      case 5:
        return i.child.stateNode;
      default:
        return i.child.stateNode;
    }
  }
  function Fc(i, a) {
    i = i.memoizedState, i !== null && i.dehydrated !== null && i.retryTime < a && (i.retryTime = a);
  }
  function iu(i, a) {
    Fc(i, a), (i = i.alternate) && Fc(i, a);
  }
  function Jf(i, a, c) {
    c = c != null && c.hydrate === !0;
    var f = new wm(i, a, c), v = Ur(3, null, null, a === 2 ? 7 : a === 1 ? 3 : 0);
    f.current = v, v.stateNode = f, hc(v), i[Io] = f.current, c && a !== 0 && So(i, i.nodeType === 9 ? i : i.ownerDocument), this._internalRoot = f;
  }
  Jf.prototype.render = function(i) {
    nu(i, this._internalRoot, null, null);
  }, Jf.prototype.unmount = function() {
    var i = this._internalRoot, a = i.containerInfo;
    nu(null, i, null, function() {
      a[Io] = null;
    });
  };
  function ro(i) {
    return !(!i || i.nodeType !== 1 && i.nodeType !== 9 && i.nodeType !== 11 && (i.nodeType !== 8 || i.nodeValue !== " react-mount-point-unstable "));
  }
  function qf(i, a) {
    if (a || (a = i ? i.nodeType === 9 ? i.documentElement : i.firstChild : null, a = !(!a || a.nodeType !== 1 || !a.hasAttribute("data-reactroot"))), !a)
      for (var c; c = i.lastChild; )
        i.removeChild(c);
    return new Jf(i, 0, a ? { hydrate: !0 } : void 0);
  }
  function ru(i, a, c, f, v) {
    var x = c._reactRootContainer;
    if (x) {
      var T = x._internalRoot;
      if (typeof v == "function") {
        var R = v;
        v = function() {
          var U = Wc(T);
          R.call(U);
        };
      }
      nu(a, T, i, v);
    } else {
      if (x = c._reactRootContainer = qf(c, f), T = x._internalRoot, typeof v == "function") {
        var W = v;
        v = function() {
          var U = Wc(T);
          W.call(U);
        };
      }
      um(function() {
        nu(a, T, i, v);
      });
    }
    return Wc(T);
  }
  function Fg(i, a, c) {
    var f = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return { $$typeof: Ci, key: f == null ? null : "" + f, children: i, containerInfo: a, implementation: c };
  }
  _ = function(i) {
    if (i.tag === 13) {
      var a = Vt(Ln(), 150, 100);
      Ka(i, a), iu(i, a);
    }
  }, H = function(i) {
    i.tag === 13 && (Ka(i, 3), iu(i, 3));
  }, X = function(i) {
    if (i.tag === 13) {
      var a = Ln();
      a = qa(a, i, null), Ka(i, a), iu(i, a);
    }
  }, he = function(i, a, c) {
    switch (a) {
      case "input":
        if (kt(i, c), a = c.name, c.type === "radio" && a != null) {
          for (c = i; c.parentNode; )
            c = c.parentNode;
          for (c = c.querySelectorAll("input[name=" + JSON.stringify("" + a) + '][type="radio"]'), a = 0; a < c.length; a++) {
            var f = c[a];
            if (f !== i && f.form === i.form) {
              var v = xl(f);
              if (!v)
                throw Error(l(90));
              Ir(f), kt(f, v);
            }
          }
        }
        break;
      case "textarea":
        yo(i, c);
        break;
      case "select":
        a = c.value, a != null && Kn(i, !!c.multiple, a, !1);
    }
  }, Ze = lm, Se = function(i, a, c, f, v) {
    var x = at;
    at |= 4;
    try {
      return xt(98, i.bind(null, a, c, f, v));
    } finally {
      at = x, at === zn && Ri();
    }
  }, He = function() {
    (at & (1 | Zi | jr)) === zn && (Bg(), Qo());
  }, Re = function(i, a) {
    var c = at;
    at |= 2;
    try {
      return i(a);
    } finally {
      at = c, at === zn && Ri();
    }
  };
  function Sm(i, a) {
    var c = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!ro(a))
      throw Error(l(200));
    return Fg(i, a, null, c);
  }
  var zS = { Events: [Sl, Hi, xl, ze, oe, Ns, function(i) {
    hn(i, Zd);
  }, Oe, ce, ri, ea, Qo, { current: !1 }] };
  return function(i) {
    var a = i.findFiberByHostInstance;
    return Hg(n({}, i, { overrideHookState: null, overrideProps: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: Zt.ReactCurrentDispatcher, findHostInstanceByFiber: function(c) {
      return c = bo(c), c === null ? null : c.stateNode;
    }, findFiberByHostInstance: function(c) {
      return a ? a(c) : null;
    }, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null }));
  }({
    findFiberByHostInstance: Ao,
    bundleType: 0,
    version: "16.14.0",
    rendererPackageName: "react-dom"
  }), Sr.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = zS, Sr.createPortal = Sm, Sr.findDOMNode = function(i) {
    if (i == null)
      return null;
    if (i.nodeType === 1)
      return i;
    var a = i._reactInternalFiber;
    if (a === void 0)
      throw typeof i.render == "function" ? Error(l(188)) : Error(l(268, Object.keys(i)));
    return i = bo(a), i = i === null ? null : i.stateNode, i;
  }, Sr.flushSync = function(i, a) {
    if ((at & (Zi | jr)) !== zn)
      throw Error(l(187));
    var c = at;
    at |= 1;
    try {
      return xt(99, i.bind(null, a));
    } finally {
      at = c, Ri();
    }
  }, Sr.hydrate = function(i, a, c) {
    if (!ro(a))
      throw Error(l(200));
    return ru(null, i, a, !0, c);
  }, Sr.render = function(i, a, c) {
    if (!ro(a))
      throw Error(l(200));
    return ru(null, i, a, !1, c);
  }, Sr.unmountComponentAtNode = function(i) {
    if (!ro(i))
      throw Error(l(40));
    return i._reactRootContainer ? (um(function() {
      ru(null, null, i, !1, function() {
        i._reactRootContainer = null, i[Io] = null;
      });
    }), !0) : !1;
  }, Sr.unstable_batchedUpdates = lm, Sr.unstable_createPortal = function(i, a) {
    return Sm(i, a, 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null);
  }, Sr.unstable_renderSubtreeIntoContainer = function(i, a, c, f) {
    if (!ro(c))
      throw Error(l(200));
    if (i == null || i._reactInternalFiber === void 0)
      throw Error(l(38));
    return ru(i, a, c, !1, f);
  }, Sr.version = "16.14.0", Sr;
}
var xr = {}, zb = { exports: {} }, Sa = {};
/** @license React v0.19.1
 * scheduler-tracing.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var sM;
function xO() {
  if (sM)
    return Sa;
  sM = 1;
  var r = 0;
  return Sa.__interactionsRef = null, Sa.__subscriberRef = null, Sa.unstable_clear = function(n) {
    return n();
  }, Sa.unstable_getCurrent = function() {
    return null;
  }, Sa.unstable_getThreadID = function() {
    return ++r;
  }, Sa.unstable_subscribe = function() {
  }, Sa.unstable_trace = function(n, o, l) {
    return l();
  }, Sa.unstable_unsubscribe = function() {
  }, Sa.unstable_wrap = function(n) {
    return n;
  }, Sa;
}
var Ob = {};
/** @license React v0.19.1
 * scheduler-tracing.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var oM;
function CO() {
  return oM || (oM = 1, function(r) {
    process.env.NODE_ENV !== "production" && function() {
      var n = 0, o = 0, l = 0;
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
      function w() {
        return ++l;
      }
      function g(se, Z, le) {
        var oe = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : n, ke = {
          __count: 1,
          id: o++,
          name: se,
          timestamp: Z
        }, $e = r.__interactionsRef.current, ze = new Set($e);
        ze.add(ke), r.__interactionsRef.current = ze;
        var G = r.__subscriberRef.current, he;
        try {
          G !== null && G.onInteractionTraced(ke);
        } finally {
          try {
            G !== null && G.onWorkStarted(ze, oe);
          } finally {
            try {
              he = le();
            } finally {
              r.__interactionsRef.current = $e;
              try {
                G !== null && G.onWorkStopped(ze, oe);
              } finally {
                ke.__count--, G !== null && ke.__count === 0 && G.onInteractionScheduledWorkCompleted(ke);
              }
            }
          }
        }
        return he;
      }
      function S(se) {
        var Z = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : n, le = r.__interactionsRef.current, oe = r.__subscriberRef.current;
        oe !== null && oe.onWorkScheduled(le, Z), le.forEach(function(ze) {
          ze.__count++;
        });
        var ke = !1;
        function $e() {
          var ze = r.__interactionsRef.current;
          r.__interactionsRef.current = le, oe = r.__subscriberRef.current;
          try {
            var G;
            try {
              oe !== null && oe.onWorkStarted(le, Z);
            } finally {
              try {
                G = se.apply(void 0, arguments);
              } finally {
                r.__interactionsRef.current = ze, oe !== null && oe.onWorkStopped(le, Z);
              }
            }
            return G;
          } finally {
            ke || (ke = !0, le.forEach(function(he) {
              he.__count--, oe !== null && he.__count === 0 && oe.onInteractionScheduledWorkCompleted(he);
            }));
          }
        }
        return $e.cancel = function() {
          oe = r.__subscriberRef.current;
          try {
            oe !== null && oe.onWorkCanceled(le, Z);
          } finally {
            le.forEach(function(G) {
              G.__count--, oe && G.__count === 0 && oe.onInteractionScheduledWorkCompleted(G);
            });
          }
        }, $e;
      }
      var C = null;
      C = /* @__PURE__ */ new Set();
      function I(se) {
        C.add(se), C.size === 1 && (r.__subscriberRef.current = {
          onInteractionScheduledWorkCompleted: F,
          onInteractionTraced: z,
          onWorkCanceled: fe,
          onWorkScheduled: j,
          onWorkStarted: q,
          onWorkStopped: Y
        });
      }
      function A(se) {
        C.delete(se), C.size === 0 && (r.__subscriberRef.current = null);
      }
      function z(se) {
        var Z = !1, le = null;
        if (C.forEach(function(oe) {
          try {
            oe.onInteractionTraced(se);
          } catch (ke) {
            Z || (Z = !0, le = ke);
          }
        }), Z)
          throw le;
      }
      function F(se) {
        var Z = !1, le = null;
        if (C.forEach(function(oe) {
          try {
            oe.onInteractionScheduledWorkCompleted(se);
          } catch (ke) {
            Z || (Z = !0, le = ke);
          }
        }), Z)
          throw le;
      }
      function j(se, Z) {
        var le = !1, oe = null;
        if (C.forEach(function(ke) {
          try {
            ke.onWorkScheduled(se, Z);
          } catch ($e) {
            le || (le = !0, oe = $e);
          }
        }), le)
          throw oe;
      }
      function q(se, Z) {
        var le = !1, oe = null;
        if (C.forEach(function(ke) {
          try {
            ke.onWorkStarted(se, Z);
          } catch ($e) {
            le || (le = !0, oe = $e);
          }
        }), le)
          throw oe;
      }
      function Y(se, Z) {
        var le = !1, oe = null;
        if (C.forEach(function(ke) {
          try {
            ke.onWorkStopped(se, Z);
          } catch ($e) {
            le || (le = !0, oe = $e);
          }
        }), le)
          throw oe;
      }
      function fe(se, Z) {
        var le = !1, oe = null;
        if (C.forEach(function(ke) {
          try {
            ke.onWorkCanceled(se, Z);
          } catch ($e) {
            le || (le = !0, oe = $e);
          }
        }), le)
          throw oe;
      }
      r.unstable_clear = h, r.unstable_getCurrent = m, r.unstable_getThreadID = w, r.unstable_subscribe = I, r.unstable_trace = g, r.unstable_unsubscribe = A, r.unstable_wrap = S;
    }();
  }(Ob)), Ob;
}
var lM;
function TO() {
  return lM || (lM = 1, function(r) {
    process.env.NODE_ENV === "production" ? r.exports = xO() : r.exports = CO();
  }(zb)), zb.exports;
}
/** @license React v16.14.0
 * react-dom.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var uM;
function MO() {
  return uM || (uM = 1, process.env.NODE_ENV !== "production" && function() {
    var r = hl.exports, n = Tg(), o = $E(), l = WE(), h = TO(), m = r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    m.hasOwnProperty("ReactCurrentDispatcher") || (m.ReactCurrentDispatcher = {
      current: null
    }), m.hasOwnProperty("ReactCurrentBatchConfig") || (m.ReactCurrentBatchConfig = {
      suspense: null
    });
    function w(e) {
      {
        for (var t = arguments.length, s = new Array(t > 1 ? t - 1 : 0), u = 1; u < t; u++)
          s[u - 1] = arguments[u];
        S("warn", e, s);
      }
    }
    function g(e) {
      {
        for (var t = arguments.length, s = new Array(t > 1 ? t - 1 : 0), u = 1; u < t; u++)
          s[u - 1] = arguments[u];
        S("error", e, s);
      }
    }
    function S(e, t, s) {
      {
        var u = s.length > 0 && typeof s[s.length - 1] == "string" && s[s.length - 1].indexOf(`
    in`) === 0;
        if (!u) {
          var d = m.ReactDebugCurrentFrame, p = d.getStackAddendum();
          p !== "" && (t += "%s", s = s.concat([p]));
        }
        var y = s.map(function(N) {
          return "" + N;
        });
        y.unshift("Warning: " + t), Function.prototype.apply.call(console[e], console, y);
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
    var C = function(e, t, s, u, d, p, y, b, E) {
      var N = Array.prototype.slice.call(arguments, 3);
      try {
        t.apply(s, N);
      } catch (k) {
        this.onError(k);
      }
    };
    if (typeof window < "u" && typeof window.dispatchEvent == "function" && typeof document < "u" && typeof document.createEvent == "function") {
      var I = document.createElement("react"), A = function(e, t, s, u, d, p, y, b, E) {
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
    var z = C, F = !1, j = null, q = !1, Y = null, fe = {
      onError: function(e) {
        F = !0, j = e;
      }
    };
    function se(e, t, s, u, d, p, y, b, E) {
      F = !1, j = null, z.apply(fe, arguments);
    }
    function Z(e, t, s, u, d, p, y, b, E) {
      if (se.apply(this, arguments), F) {
        var N = ke();
        q || (q = !0, Y = N);
      }
    }
    function le() {
      if (q) {
        var e = Y;
        throw q = !1, Y = null, e;
      }
    }
    function oe() {
      return F;
    }
    function ke() {
      if (F) {
        var e = j;
        return F = !1, j = null, e;
      } else
        throw Error("clearCaughtError was called but no error was captured. This error is likely caused by a bug in React. Please file an issue.");
    }
    var $e = null, ze = null, G = null;
    function he(e, t, s) {
      $e = e, ze = t, G = s, (!G || !ze) && g("EventPluginUtils.setComponentTree(...): Injected module is missing getNodeFromInstance or getInstanceFromNode.");
    }
    var be;
    be = function(e) {
      var t = e._dispatchListeners, s = e._dispatchInstances, u = Array.isArray(t), d = u ? t.length : t ? 1 : 0, p = Array.isArray(s), y = p ? s.length : s ? 1 : 0;
      (p !== u || y !== d) && g("EventPluginUtils: Invalid `event`.");
    };
    function ie(e, t, s) {
      var u = e.type || "unknown-event";
      e.currentTarget = G(s), Z(u, t, void 0, e), e.currentTarget = null;
    }
    function ct(e) {
      var t = e._dispatchListeners, s = e._dispatchInstances;
      if (be(e), Array.isArray(t))
        for (var u = 0; u < t.length && !e.isPropagationStopped(); u++)
          ie(e, t[u], s[u]);
      else
        t && ie(e, t, s);
      e._dispatchListeners = null, e._dispatchInstances = null;
    }
    var Oe = 0, ce = 1, Ze = 2, Se = 3, He = 4, Re = 5, Qe = 6, Tt = 7, Bt = 8, Ge = 9, re = 10, D = 11, B = 12, ee = 13, Ce = 14, ge = 15, it = 16, Xe = 17, Be = 18, dt = 19, gt = 20, Zt = 21, Mt = 22, bn = null, Ft = {};
    function Vi() {
      if (!!bn)
        for (var e in Ft) {
          var t = Ft[e], s = bn.indexOf(e);
          if (!(s > -1))
            throw Error("EventPluginRegistry: Cannot inject event plugins that do not exist in the plugin ordering, `" + e + "`.");
          if (!Ne[s]) {
            if (!t.extractEvents)
              throw Error("EventPluginRegistry: Event plugins must implement an `extractEvents` method, but `" + e + "` does not.");
            Ne[s] = t;
            var u = t.eventTypes;
            for (var d in u)
              if (!Ci(u[d], t, d))
                throw Error("EventPluginRegistry: Failed to publish event `" + d + "` for plugin `" + e + "`.");
          }
        }
    }
    function Ci(e, t, s) {
      if (st.hasOwnProperty(s))
        throw Error("EventPluginRegistry: More than one plugin attempted to publish the same event name, `" + s + "`.");
      st[s] = e;
      var u = e.phasedRegistrationNames;
      if (u) {
        for (var d in u)
          if (u.hasOwnProperty(d)) {
            var p = u[d];
            Jn(p, t, s);
          }
        return !0;
      } else if (e.registrationName)
        return Jn(e.registrationName, t, s), !0;
      return !1;
    }
    function Jn(e, t, s) {
      if (We[e])
        throw Error("EventPluginRegistry: More than one plugin attempted to publish the same registration name, `" + e + "`.");
      We[e] = t, jt[e] = t.eventTypes[s].dependencies;
      {
        var u = e.toLowerCase();
        Sn[u] = e, e === "onDoubleClick" && (Sn.ondblclick = e);
      }
    }
    var Ne = [], st = {}, We = {}, jt = {}, Sn = {};
    function ci(e) {
      if (bn)
        throw Error("EventPluginRegistry: Cannot inject event plugin ordering more than once. You are likely trying to load more than one copy of React.");
      bn = Array.prototype.slice.call(e), Vi();
    }
    function Mr(e) {
      var t = !1;
      for (var s in e)
        if (!!e.hasOwnProperty(s)) {
          var u = e[s];
          if (!Ft.hasOwnProperty(s) || Ft[s] !== u) {
            if (Ft[s])
              throw Error("EventPluginRegistry: Cannot inject two different event plugins using the same name, `" + s + "`.");
            Ft[s] = u, t = !0;
          }
        }
      t && Vi();
    }
    var jn = typeof window < "u" && typeof window.document < "u" && typeof window.document.createElement < "u", Gr = 1, Ui = 1 << 5, Ma = 1 << 6, Ea = null, di = null, tr = null;
    function fi(e) {
      var t = ze(e);
      if (!!t) {
        if (typeof Ea != "function")
          throw Error("setRestoreImplementation() needs to be called to handle a target for controlled events. This error is likely caused by a bug in React. Please file an issue.");
        var s = t.stateNode;
        if (s) {
          var u = $e(s);
          Ea(t.stateNode, t.type, u);
        }
      }
    }
    function Ia(e) {
      Ea = e;
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
    var Er = !0, Ir = !1, vn = !1, qn = !1, Aa = function(e, t) {
      return e(t);
    }, kt = function(e, t, s, u, d) {
      return e(t, s, u, d);
    }, rn = function() {
    }, Mi = Aa, kn = !1, Ei = !1;
    function Kn() {
      var e = Xr();
      e && (rn(), Cs());
    }
    function Jr(e, t) {
      if (kn)
        return e(t);
      kn = !0;
      try {
        return Aa(e, t);
      } finally {
        kn = !1, Kn();
      }
    }
    function Ra(e, t, s) {
      if (Ei)
        return e(t, s);
      Ei = !0;
      try {
        return Mi(e, t, s);
      } finally {
        Ei = !1, Kn();
      }
    }
    function yo(e, t, s, u, d) {
      var p = kn;
      kn = !0;
      try {
        return kt(e, t, s, u, d);
      } finally {
        kn = p, kn || Kn();
      }
    }
    function wo(e) {
      !kn && !Ir && rn();
    }
    function Ts(e, t, s, u) {
      Aa = e, kt = t, rn = s, Mi = u;
    }
    var Da = 0, _n = 1, Ar = 2, qr = 0, ei = 1, Rr = 2, Vn = 3, nr = 4, Ms = 5, Kr = 6, Es = ":A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD", ne = Es + "\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040", de = "data-reactroot", Je = new RegExp("^[" + Es + "][" + ne + "]*$"), pt = Object.prototype.hasOwnProperty, Jt = {}, Yt = {};
    function fn(e) {
      return pt.call(Yt, e) ? !0 : pt.call(Jt, e) ? !1 : Je.test(e) ? (Yt[e] = !0, !0) : (Jt[e] = !0, g("Invalid attribute name: `%s`", e), !1);
    }
    function ti(e, t, s) {
      return t !== null ? t.type === qr : s ? !1 : e.length > 2 && (e[0] === "o" || e[0] === "O") && (e[1] === "n" || e[1] === "N");
    }
    function qt(e, t, s, u) {
      if (s !== null && s.type === qr)
        return !1;
      switch (typeof t) {
        case "function":
        case "symbol":
          return !0;
        case "boolean": {
          if (u)
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
    function Na(e, t, s, u) {
      if (t === null || typeof t > "u" || qt(e, t, s, u))
        return !0;
      if (u)
        return !1;
      if (s !== null)
        switch (s.type) {
          case Vn:
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
    function an(e, t, s, u, d, p) {
      this.acceptsBooleans = t === Rr || t === Vn || t === nr, this.attributeName = u, this.attributeNamespace = d, this.mustUseProperty = s, this.propertyName = e, this.type = t, this.sanitizeURL = p;
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
        Vn,
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
        Vn,
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
    function Bu(e, t, s, u) {
      if (u.mustUseProperty) {
        var d = u.propertyName;
        return e[d];
      } else {
        u.sanitizeURL && vl("" + s);
        var p = u.attributeName, y = null;
        if (u.type === nr) {
          if (e.hasAttribute(p)) {
            var b = e.getAttribute(p);
            return b === "" ? !0 : Na(t, s, u, !1) ? b : b === "" + s ? s : b;
          }
        } else if (e.hasAttribute(p)) {
          if (Na(t, s, u, !1))
            return e.getAttribute(p);
          if (u.type === Vn)
            return s;
          y = e.getAttribute(p);
        }
        return Na(t, s, u, !1) ? y === null ? s : y : y === "" + s ? s : y;
      }
    }
    function gl(e, t, s) {
      {
        if (!fn(t))
          return;
        if (!e.hasAttribute(t))
          return s === void 0 ? void 0 : null;
        var u = e.getAttribute(t);
        return u === "" + s ? s : u;
      }
    }
    function M(e, t, s, u) {
      var d = bo(t);
      if (!ti(t, d, u)) {
        if (Na(t, s, d, u) && (s = null), u || d === null) {
          if (fn(t)) {
            var p = t;
            s === null ? e.removeAttribute(p) : e.setAttribute(p, "" + s);
          }
          return;
        }
        var y = d.mustUseProperty;
        if (y) {
          var b = d.propertyName;
          if (s === null) {
            var E = d.type;
            e[b] = E === Vn ? !1 : "";
          } else
            e[b] = s;
          return;
        }
        var N = d.attributeName, k = d.attributeNamespace;
        if (s === null)
          e.removeAttribute(N);
        else {
          var J = d.type, L;
          J === Vn || J === nr && s === !0 ? L = "" : (L = "" + s, d.sanitizeURL && vl(L.toString())), k ? e.setAttributeNS(k, N, L) : e.setAttribute(N, L);
        }
      }
    }
    var _ = /^(.*)[\\\/]/;
    function H(e, t, s) {
      var u = "";
      if (t) {
        var d = t.fileName, p = d.replace(_, "");
        if (/^index\./.test(p)) {
          var y = d.match(_);
          if (y) {
            var b = y[1];
            if (b) {
              var E = b.replace(_, "");
              p = E + "/" + p;
            }
          }
        }
        u = " (at " + p + ":" + t.lineNumber + ")";
      } else
        s && (u = " (created by " + s + ")");
      return `
    in ` + (e || "Unknown") + u;
    }
    var X = typeof Symbol == "function" && Symbol.for, xe = X ? Symbol.for("react.element") : 60103, Ye = X ? Symbol.for("react.portal") : 60106, je = X ? Symbol.for("react.fragment") : 60107, tt = X ? Symbol.for("react.strict_mode") : 60108, Nt = X ? Symbol.for("react.profiler") : 60114, gn = X ? Symbol.for("react.provider") : 60109, xn = X ? Symbol.for("react.context") : 60110, Mn = X ? Symbol.for("react.concurrent_mode") : 60111, ni = X ? Symbol.for("react.forward_ref") : 60112, ii = X ? Symbol.for("react.suspense") : 60113, So = X ? Symbol.for("react.suspense_list") : 60120, ta = X ? Symbol.for("react.memo") : 60115, ir = X ? Symbol.for("react.lazy") : 60116, xo = X ? Symbol.for("react.block") : 60121, mp = typeof Symbol == "function" && Symbol.iterator, Mg = "@@iterator";
    function Dr(e) {
      if (e === null || typeof e != "object")
        return null;
      var t = mp && e[mp] || e[Mg];
      return typeof t == "function" ? t : null;
    }
    var vp = -1, zd = 0, Rs = 1, gp = 2;
    function Od(e) {
      return e._status === Rs ? e._result : null;
    }
    function yp(e) {
      if (e._status === vp) {
        e._status = zd;
        var t = e._ctor, s = t();
        e._result = s, s.then(function(u) {
          if (e._status === zd) {
            var d = u.default;
            d === void 0 && g(`lazy: Expected the result of a dynamic import() call. Instead received: %s

Your code should look like: 
  const MyComponent = lazy(() => import('./MyComponent'))`, u), e._status = Rs, e._result = d;
          }
        }, function(u) {
          e._status === zd && (e._status = gp, e._result = u);
        });
      }
    }
    function Ld(e, t, s) {
      var u = t.displayName || t.name || "";
      return e.displayName || (u !== "" ? s + "(" + u + ")" : s);
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
        case Ye:
          return "Portal";
        case Nt:
          return "Profiler";
        case tt:
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
            return Ld(e, e.render, "ForwardRef");
          case ta:
            return Te(e.type);
          case xo:
            return Te(e.render);
          case ir: {
            var t = e, s = Od(t);
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
        case He:
        case Qe:
        case Tt:
        case re:
        case Ge:
          return "";
        default:
          var t = e._debugOwner, s = e._debugSource, u = Te(e.type), d = null;
          return t && (d = Te(t.type)), H(u, s, d);
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
    function ka() {
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
    var To = null, Vu = {
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
      Vu.checkPropTypes = function(e, t) {
        l(Sp, t, "prop", e, To.getStackAddendum);
      };
    }
    function xp(e) {
      var t = e.type, s = e.nodeName;
      return s && s.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
    }
    function Uu(e) {
      return e._valueTracker;
    }
    function Bd(e) {
      e._valueTracker = null;
    }
    function Cp(e) {
      var t = "";
      return e && (xp(e) ? t = e.checked ? "true" : "false" : t = e.value), t;
    }
    function ia(e) {
      var t = xp(e) ? "checked" : "value", s = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), u = "" + e[t];
      if (!(e.hasOwnProperty(t) || typeof s > "u" || typeof s.get != "function" || typeof s.set != "function")) {
        var d = s.get, p = s.set;
        Object.defineProperty(e, t, {
          configurable: !0,
          get: function() {
            return d.call(this);
          },
          set: function(b) {
            u = "" + b, p.call(this, b);
          }
        }), Object.defineProperty(e, t, {
          enumerable: s.enumerable
        });
        var y = {
          getValue: function() {
            return u;
          },
          setValue: function(b) {
            u = "" + b;
          },
          stopTracking: function() {
            Bd(e), delete e[t];
          }
        };
        return y;
      }
    }
    function Ds(e) {
      Uu(e) || (e._valueTracker = ia(e));
    }
    function Hu(e) {
      if (!e)
        return !1;
      var t = Uu(e);
      if (!t)
        return !0;
      var s = t.getValue(), u = Cp(e);
      return u !== s ? (t.setValue(u), !0) : !1;
    }
    var jd = !1, Vd = !1, Ud = !1, Hd = !1;
    function Wu(e) {
      var t = e.type === "checkbox" || e.type === "radio";
      return t ? e.checked != null : e.value != null;
    }
    function Fu(e, t) {
      var s = e, u = t.checked, d = n({}, t, {
        defaultChecked: void 0,
        defaultValue: void 0,
        value: void 0,
        checked: u != null ? u : s._wrapperState.initialChecked
      });
      return d;
    }
    function Wd(e, t) {
      Vu.checkPropTypes("input", t), t.checked !== void 0 && t.defaultChecked !== void 0 && !Vd && (g("%s contains an input of type %s with both checked and defaultChecked props. Input elements must be either controlled or uncontrolled (specify either the checked prop, or the defaultChecked prop, but not both). Decide between using a controlled or uncontrolled input element and remove one of these props. More info: https://fb.me/react-controlled-components", ka() || "A component", t.type), Vd = !0), t.value !== void 0 && t.defaultValue !== void 0 && !jd && (g("%s contains an input of type %s with both value and defaultValue props. Input elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled input element and remove one of these props. More info: https://fb.me/react-controlled-components", ka() || "A component", t.type), jd = !0);
      var s = e, u = t.defaultValue == null ? "" : t.defaultValue;
      s._wrapperState = {
        initialChecked: t.checked != null ? t.checked : t.defaultChecked,
        initialValue: kr(t.value != null ? t.value : u),
        controlled: Wu(t)
      };
    }
    function $u(e, t) {
      var s = e, u = t.checked;
      u != null && M(s, "checked", u, !1);
    }
    function wl(e, t) {
      var s = e;
      {
        var u = Wu(t);
        !s._wrapperState.controlled && u && !Hd && (g("A component is changing an uncontrolled input of type %s to be controlled. Input elements should not switch from uncontrolled to controlled (or vice versa). Decide between using a controlled or uncontrolled input element for the lifetime of the component. More info: https://fb.me/react-controlled-components", t.type), Hd = !0), s._wrapperState.controlled && !u && !Ud && (g("A component is changing a controlled input of type %s to be uncontrolled. Input elements should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled input element for the lifetime of the component. More info: https://fb.me/react-controlled-components", t.type), Ud = !0);
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
      var u = e;
      if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
        var d = t.type, p = d === "submit" || d === "reset";
        if (p && (t.value === void 0 || t.value === null))
          return;
        var y = ri(u._wrapperState.initialValue);
        s || y !== u.value && (u.value = y), u.defaultValue = y;
      }
      var b = u.name;
      b !== "" && (u.name = ""), u.defaultChecked = !u.defaultChecked, u.defaultChecked = !!u._wrapperState.initialChecked, b !== "" && (u.name = b);
    }
    function Fd(e, t) {
      var s = e;
      wl(s, t), Tp(s, t);
    }
    function Tp(e, t) {
      var s = t.name;
      if (t.type === "radio" && s != null) {
        for (var u = e; u.parentNode; )
          u = u.parentNode;
        for (var d = u.querySelectorAll("input[name=" + JSON.stringify("" + s) + '][type="radio"]'), p = 0; p < d.length; p++) {
          var y = d[p];
          if (!(y === e || y.form !== e.form)) {
            var b = Yg(y);
            if (!b)
              throw Error("ReactDOMInput: Mixing React and non-React radio inputs with the same `name` is not supported.");
            Hu(y), wl(y, b);
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
    function $d(e, t) {
      typeof t.children == "object" && t.children !== null && r.Children.forEach(t.children, function(s) {
        s != null && (typeof s == "string" || typeof s == "number" || typeof s.type == "string" && (Mp || (Mp = !0, g("Only strings and numbers are supported as <option> children."))));
      }), t.selected != null && !Zu && (g("Use the `defaultValue` or `value` props on <select> instead of setting `selected` on <option>."), Zu = !0);
    }
    function Qd(e, t) {
      t.value != null && e.setAttribute("value", ri(kr(t.value)));
    }
    function _r(e, t) {
      var s = n({
        children: void 0
      }, t), u = Mo(t.children);
      return u && (s.children = u), s;
    }
    var Eo;
    Eo = !1;
    function Io() {
      var e = ka();
      return e ? `

Check the render method of \`` + e + "`." : "";
    }
    var Ao = ["value", "defaultValue"];
    function Sl(e) {
      {
        Vu.checkPropTypes("select", e);
        for (var t = 0; t < Ao.length; t++) {
          var s = Ao[t];
          if (e[s] != null) {
            var u = Array.isArray(e[s]);
            e.multiple && !u ? g("The `%s` prop supplied to <select> must be an array if `multiple` is true.%s", s, Io()) : !e.multiple && u && g("The `%s` prop supplied to <select> must be a scalar value if `multiple` is false.%s", s, Io());
          }
        }
      }
    }
    function Hi(e, t, s, u) {
      var d = e.options;
      if (t) {
        for (var p = s, y = {}, b = 0; b < p.length; b++)
          y["$" + p[b]] = !0;
        for (var E = 0; E < d.length; E++) {
          var N = y.hasOwnProperty("$" + d[E].value);
          d[E].selected !== N && (d[E].selected = N), N && u && (d[E].defaultSelected = !0);
        }
      } else {
        for (var k = ri(kr(s)), J = null, L = 0; L < d.length; L++) {
          if (d[L].value === k) {
            d[L].selected = !0, u && (d[L].defaultSelected = !0);
            return;
          }
          J === null && !d[L].disabled && (J = d[L]);
        }
        J !== null && (J.selected = !0);
      }
    }
    function xl(e, t) {
      return n({}, t, {
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
      var u = t.value;
      u != null ? Hi(s, !!t.multiple, u, !1) : t.defaultValue != null && Hi(s, !!t.multiple, t.defaultValue, !0);
    }
    function Ip(e, t) {
      var s = e, u = s._wrapperState.wasMultiple;
      s._wrapperState.wasMultiple = !!t.multiple;
      var d = t.value;
      d != null ? Hi(s, !!t.multiple, d, !1) : u !== !!t.multiple && (t.defaultValue != null ? Hi(s, !!t.multiple, t.defaultValue, !0) : Hi(s, !!t.multiple, t.multiple ? [] : "", !1));
    }
    function Eg(e, t) {
      var s = e, u = t.value;
      u != null && Hi(s, !!t.multiple, u, !1);
    }
    var Yu = !1;
    function Zd(e, t) {
      var s = e;
      if (t.dangerouslySetInnerHTML != null)
        throw Error("`dangerouslySetInnerHTML` does not make sense on <textarea>.");
      var u = n({}, t, {
        value: void 0,
        defaultValue: void 0,
        children: ri(s._wrapperState.initialValue)
      });
      return u;
    }
    function Ns(e, t) {
      var s = e;
      Vu.checkPropTypes("textarea", t), t.value !== void 0 && t.defaultValue !== void 0 && !Yu && (g("%s contains a textarea with both value and defaultValue props. Textarea elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled textarea and remove one of these props. More info: https://fb.me/react-controlled-components", ka() || "A component"), Yu = !0);
      var u = t.value;
      if (u == null) {
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
        p == null && (p = ""), u = p;
      }
      s._wrapperState = {
        initialValue: kr(u)
      };
    }
    function ra(e, t) {
      var s = e, u = kr(t.value), d = kr(t.defaultValue);
      if (u != null) {
        var p = ri(u);
        p !== s.value && (s.value = p), t.defaultValue == null && s.defaultValue !== p && (s.defaultValue = p);
      }
      d != null && (s.defaultValue = ri(d));
    }
    function Gu(e, t) {
      var s = e, u = s.textContent;
      u === s._wrapperState.initialValue && u !== "" && u !== null && (s.value = u);
    }
    function Xu(e, t) {
      ra(e, t);
    }
    var Cl = "http://www.w3.org/1999/xhtml", Tl = "http://www.w3.org/1998/Math/MathML", Ro = "http://www.w3.org/2000/svg", hi = {
      html: Cl,
      mathml: Tl,
      svg: Ro
    };
    function Yd(e) {
      switch (e) {
        case "svg":
          return Ro;
        case "math":
          return Tl;
        default:
          return Cl;
      }
    }
    function Gd(e, t) {
      return e == null || e === Cl ? Yd(t) : e === Ro && t === "foreignObject" ? Cl : e;
    }
    var Ap = function(e) {
      return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, s, u, d) {
        MSApp.execUnsafeLocalFunction(function() {
          return e(t, s, u, d);
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
    }), ar = 1, sr = 3, ai = 8, _a = 9, qu = 11, Ml = function(e, t) {
      if (t) {
        var s = e.firstChild;
        if (s && s === e.lastChild && s.nodeType === sr) {
          s.nodeValue = t;
          return;
        }
      }
      e.textContent = t;
    };
    function Pa(e) {
      return e;
    }
    function Ig(e) {
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
    }, za = {}, Dp = {};
    jn && (Dp = document.createElement("div").style, "AnimationEvent" in window || (delete ks.animationend.animation, delete ks.animationiteration.animation, delete ks.animationstart.animation), "TransitionEvent" in window || delete ks.transitionend.transition);
    function Ku(e) {
      if (za[e])
        return za[e];
      if (!ks[e])
        return e;
      var t = ks[e];
      for (var s in t)
        if (t.hasOwnProperty(s) && s in Dp)
          return za[e] = t[s];
      return e;
    }
    var Xd = "abort", Np = Ku("animationend"), Jd = Ku("animationiteration"), qd = Ku("animationstart"), Un = "blur", _s = "canplay", Ps = "canplaythrough", ec = "cancel", Oa = "change", Il = "click", Do = "close", aa = "compositionend", Al = "compositionstart", Kd = "compositionupdate", Rl = "contextmenu", ef = "copy", tf = "cut", nf = "dblclick", zs = "auxclick", kp = "drag", Dl = "dragend", Os = "dragenter", rf = "dragexit", Nl = "dragleave", af = "dragover", tc = "dragstart", Ls = "drop", nc = "durationchange", Bs = "emptied", sf = "encrypted", of = "ended", Ii = "error", Wi = "focus", sa = "gotpointercapture", kl = "input", zr = "invalid", Hn = "keydown", Fi = "keypress", si = "keyup", La = "load", ic = "loadstart", lf = "loadeddata", uf = "loadedmetadata", rc = "lostpointercapture", oa = "mousedown", _l = "mousemove", Ba = "mouseout", la = "mouseover", Pl = "mouseup", zl = "paste", cf = "pause", df = "play", ff = "playing", hf = "pointercancel", pf = "pointerdown", ac = "pointermove", Ai = "pointerout", St = "pointerover", sn = "pointerup", Or = "progress", Pn = "ratechange", En = "reset", Lr = "scroll", ja = "seeked", Qn = "seeking", Va = "selectionchange", sc = "stalled", js = "submit", No = "suspend", Ol = "textInput", mf = "timeupdate", ko = "toggle", oc = "touchcancel", lc = "touchend", uc = "touchmove", vf = "touchstart", Ll = Ku("transitionend"), cc = "volumechange", dc = "waiting", gf = "wheel", _o = [Xd, _s, Ps, nc, Bs, sf, of, Ii, lf, uf, ic, cf, df, ff, Or, Pn, ja, Qn, sc, No, mf, cc, dc];
    function yf(e) {
      return e;
    }
    var Ag = typeof WeakMap == "function" ? WeakMap : Map, _p = new Ag();
    function or(e) {
      var t = _p.get(e);
      return t === void 0 && (t = /* @__PURE__ */ new Map(), _p.set(e, t)), t;
    }
    function ua(e) {
      return e._reactInternalFiber;
    }
    function wf(e) {
      return e._reactInternalFiber !== void 0;
    }
    function Pp(e, t) {
      e._reactInternalFiber = t;
    }
    var _t = 0, lr = 1, Cn = 2, xt = 4, zp = 6, Vs = 8, Ri = 16, bf = 32, Vt = 64, pi = 128, Ua = 256, Ha = 512, $i = 1024, fc = 1028, Sf = 932, xf = 2047, Po = 2048, mi = 4096, Qi = m.ReactCurrentOwner;
    function vi(e) {
      var t = e, s = e;
      if (e.alternate)
        for (; t.return; )
          t = t.return;
      else {
        var u = t;
        do
          t = u, (t.effectTag & (Cn | $i)) !== _t && (s = t.return), u = t.return;
        while (u);
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
    function Wa(e) {
      return vi(e) === e;
    }
    function Fa(e) {
      {
        var t = Qi.current;
        if (t !== null && t.tag === ce) {
          var s = t, u = s.stateNode;
          u._warnedAboutRefsInRender || g("%s is accessing isMounted inside its render() function. render() should be a pure function of props and state. It should never access something that requires stale data from the previous render, such as refs. Move this logic to componentDidMount and componentDidUpdate instead.", Te(s.type) || "A component"), u._warnedAboutRefsInRender = !0;
        }
      }
      var d = ua(e);
      return d ? vi(d) === d : !1;
    }
    function Cf(e) {
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
      for (var u = e, d = t; ; ) {
        var p = u.return;
        if (p === null)
          break;
        var y = p.alternate;
        if (y === null) {
          var b = p.return;
          if (b !== null) {
            u = d = b;
            continue;
          }
          break;
        }
        if (p.child === y.child) {
          for (var E = p.child; E; ) {
            if (E === u)
              return Cf(p), e;
            if (E === d)
              return Cf(p), t;
            E = E.sibling;
          }
          throw Error("Unable to find node on an unmounted component.");
        }
        if (u.return !== d.return)
          u = p, d = y;
        else {
          for (var N = !1, k = p.child; k; ) {
            if (k === u) {
              N = !0, u = p, d = y;
              break;
            }
            if (k === d) {
              N = !0, d = p, u = y;
              break;
            }
            k = k.sibling;
          }
          if (!N) {
            for (k = y.child; k; ) {
              if (k === u) {
                N = !0, u = y, d = p;
                break;
              }
              if (k === d) {
                N = !0, d = y, u = p;
                break;
              }
              k = k.sibling;
            }
            if (!N)
              throw Error("Child was not found in either parent set. This indicates a bug in React related to the return pointer. Please file an issue.");
          }
        }
        if (u.alternate !== d)
          throw Error("Return fibers should always be each others' alternates. This error is likely caused by a bug in React. Please file an issue.");
      }
      if (u.tag !== Se)
        throw Error("Unable to find node on an unmounted component.");
      return u.stateNode.current === u ? e : t;
    }
    function Tf(e) {
      var t = zo(e);
      if (!t)
        return null;
      for (var s = t; ; ) {
        if (s.tag === Re || s.tag === Qe)
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
        if (s.tag === Re || s.tag === Qe || vn)
          return s;
        if (s.child && s.tag !== He) {
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
    function Us(e, t) {
      if (t == null)
        throw Error("accumulateInto(...): Accumulated items must not be null or undefined.");
      return e == null ? t : Array.isArray(e) ? Array.isArray(t) ? (e.push.apply(e, t), e) : (e.push(t), e) : Array.isArray(t) ? [e].concat(t) : [e, t];
    }
    function Oo(e, t, s) {
      Array.isArray(e) ? e.forEach(t, s) : e && t.call(s, e);
    }
    var $a = null, Op = function(e) {
      e && (ct(e), e.isPersistent() || e.constructor.release(e));
    }, Lp = function(e) {
      return Op(e);
    };
    function mc(e) {
      e !== null && ($a = Us($a, e));
      var t = $a;
      if ($a = null, !!t) {
        if (Oo(t, Lp), $a)
          throw Error("processEventQueue(): Additional events were enqueued while processing an event queue. Support for this has not yet been implemented.");
        le();
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
    function Vl(e) {
      if (!jn)
        return !1;
      var t = "on" + e, s = t in document;
      if (!s) {
        var u = document.createElement("div");
        u.setAttribute(t, "return;"), s = typeof u[t] == "function";
      }
      return s;
    }
    var Ul = 10, Hs = [];
    function Bp(e) {
      e.topLevelType = null, e.nativeEvent = null, e.targetInst = null, e.ancestors.length = 0, Hs.length < Ul && Hs.push(e);
    }
    function Lo(e, t, s, u) {
      if (Hs.length) {
        var d = Hs.pop();
        return d.topLevelType = e, d.eventSystemFlags = u, d.nativeEvent = t, d.targetInst = s, d;
      }
      return {
        topLevelType: e,
        eventSystemFlags: u,
        nativeEvent: t,
        targetInst: s,
        ancestors: []
      };
    }
    function Mf(e) {
      if (e.tag === Se)
        return e.stateNode.containerInfo;
      for (; e.return; )
        e = e.return;
      return e.tag !== Se ? null : e.stateNode.containerInfo;
    }
    function Hl(e, t, s, u, d) {
      for (var p = null, y = 0; y < Ne.length; y++) {
        var b = Ne[y];
        if (b) {
          var E = b.extractEvents(e, t, s, u, d);
          E && (p = Us(p, E));
        }
      }
      return p;
    }
    function Br(e, t, s, u, d) {
      var p = Hl(e, t, s, u, d);
      mc(p);
    }
    function Wl(e) {
      var t = e.targetInst, s = t;
      do {
        if (!s) {
          var u = e.ancestors;
          u.push(s);
          break;
        }
        var d = Mf(s);
        if (!d)
          break;
        var p = s.tag;
        (p === Re || p === Qe) && e.ancestors.push(s), s = th(d);
      } while (s);
      for (var y = 0; y < e.ancestors.length; y++) {
        t = e.ancestors[y];
        var b = jl(e.nativeEvent), E = e.topLevelType, N = e.nativeEvent, k = e.eventSystemFlags;
        y === 0 && (k |= Ma), Br(E, t, N, b, k);
      }
    }
    function Bo(e, t, s, u) {
      var d = Lo(e, s, u, t);
      try {
        Ra(Wl, d);
      } finally {
        Bp(d);
      }
    }
    function Ws(e, t) {
      for (var s = or(t), u = jt[e], d = 0; d < u.length; d++) {
        var p = u[d];
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
          case Un:
            Rc(Wi, t), Rc(Un, t), s.set(Un, null), s.set(Wi, null);
            break;
          case ec:
          case Do:
            Vl(yf(e)) && Rc(e, t);
            break;
          case zr:
          case js:
          case En:
            break;
          default:
            var u = _o.indexOf(e) !== -1;
            u || Gt(e, t);
            break;
        }
        s.set(e, null);
      }
    }
    function jo(e, t) {
      for (var s = or(t), u = jt[e], d = 0; d < u.length; d++) {
        var p = u[d];
        if (!s.has(p))
          return !1;
      }
      return !0;
    }
    var Ef;
    function If(e) {
      Ef = e;
    }
    var Kt;
    function gc(e) {
      Kt = e;
    }
    var yc;
    function wc(e) {
      yc = e;
    }
    var gi = !1, Zn = [], $t = null, on = null, ln = null, Qa = /* @__PURE__ */ new Map(), Wn = /* @__PURE__ */ new Map(), Fs = [];
    function Af() {
      return Zn.length > 0;
    }
    var $s = [oa, Pl, oc, lc, vf, zs, nf, hf, pf, sn, Dl, tc, Ls, aa, Al, Hn, Fi, si, kl, Ol, Do, ec, ef, tf, zl, Il, Oa, Rl, En, js], Vo = [Wi, Un, Os, Nl, la, Ba, St, Ai, sa, rc];
    function Za(e) {
      return $s.indexOf(e) > -1;
    }
    function Fl(e, t, s) {
      vc(e, t, s);
    }
    function bc(e, t) {
      var s = or(t);
      $s.forEach(function(u) {
        Fl(u, t, s);
      }), Vo.forEach(function(u) {
        Fl(u, t, s);
      });
    }
    function Sc(e, t, s, u, d) {
      return {
        blockedOn: e,
        topLevelType: t,
        eventSystemFlags: s | Ui,
        nativeEvent: d,
        container: u
      };
    }
    function xc(e, t, s, u, d) {
      var p = Sc(e, t, s, u, d);
      Zn.push(p);
    }
    function Rf(e, t) {
      switch (e) {
        case Wi:
        case Un:
          $t = null;
          break;
        case Os:
        case Nl:
          on = null;
          break;
        case la:
        case Ba:
          ln = null;
          break;
        case St:
        case Ai: {
          var s = t.pointerId;
          Qa.delete(s);
          break;
        }
        case sa:
        case rc: {
          var u = t.pointerId;
          Wn.delete(u);
          break;
        }
      }
    }
    function Qs(e, t, s, u, d, p) {
      if (e === null || e.nativeEvent !== p) {
        var y = Sc(t, s, u, d, p);
        if (t !== null) {
          var b = Zo(t);
          b !== null && Kt(b);
        }
        return y;
      }
      return e.eventSystemFlags |= u, e;
    }
    function Df(e, t, s, u, d) {
      switch (t) {
        case Wi: {
          var p = d;
          return $t = Qs($t, e, t, s, u, p), !0;
        }
        case Os: {
          var y = d;
          return on = Qs(on, e, t, s, u, y), !0;
        }
        case la: {
          var b = d;
          return ln = Qs(ln, e, t, s, u, b), !0;
        }
        case St: {
          var E = d, N = E.pointerId;
          return Qa.set(N, Qs(Qa.get(N) || null, e, t, s, u, E)), !0;
        }
        case sa: {
          var k = d, J = k.pointerId;
          return Wn.set(J, Qs(Wn.get(J) || null, e, t, s, u, k)), !0;
        }
      }
      return !1;
    }
    function jp(e) {
      var t = th(e.target);
      if (t !== null) {
        var s = vi(t);
        if (s !== null) {
          var u = s.tag;
          if (u === ee) {
            var d = hc(s);
            if (d !== null) {
              e.blockedOn = d, o.unstable_runWithPriority(e.priority, function() {
                yc(s);
              });
              return;
            }
          } else if (u === Se) {
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
    function Nf(e, t, s) {
      Zs(e) && s.delete(t);
    }
    function Vp() {
      for (gi = !1; Zn.length > 0; ) {
        var e = Zn[0];
        if (e.blockedOn !== null) {
          var t = Zo(e.blockedOn);
          t !== null && Ef(t);
          break;
        }
        var s = Dc(e.topLevelType, e.eventSystemFlags, e.container, e.nativeEvent);
        s !== null ? e.blockedOn = s : Zn.shift();
      }
      $t !== null && Zs($t) && ($t = null), on !== null && Zs(on) && (on = null), ln !== null && Zs(ln) && (ln = null), Qa.forEach(Nf), Wn.forEach(Nf);
    }
    function Uo(e, t) {
      e.blockedOn === t && (e.blockedOn = null, gi || (gi = !0, o.unstable_scheduleCallback(o.unstable_NormalPriority, Vp)));
    }
    function Cc(e) {
      if (Zn.length > 0) {
        Uo(Zn[0], e);
        for (var t = 1; t < Zn.length; t++) {
          var s = Zn[t];
          s.blockedOn === e && (s.blockedOn = null);
        }
      }
      $t !== null && Uo($t, e), on !== null && Uo(on, e), ln !== null && Uo(ln, e);
      var u = function(b) {
        return Uo(b, e);
      };
      Qa.forEach(u), Wn.forEach(u);
      for (var d = 0; d < Fs.length; d++) {
        var p = Fs[d];
        p.blockedOn === e && (p.blockedOn = null);
      }
      for (; Fs.length > 0; ) {
        var y = Fs[0];
        if (y.blockedOn !== null)
          break;
        jp(y), y.blockedOn === null && Fs.shift();
      }
    }
    function Up(e, t, s) {
      e.addEventListener(t, s, !1);
    }
    function Tc(e, t, s) {
      e.addEventListener(t, s, !0);
    }
    var kf = {}, Mc = /* @__PURE__ */ new Map(), Ec = /* @__PURE__ */ new Map(), Ic = [Un, "blur", ec, "cancel", Il, "click", Do, "close", Rl, "contextMenu", ef, "copy", tf, "cut", zs, "auxClick", nf, "doubleClick", Dl, "dragEnd", tc, "dragStart", Ls, "drop", Wi, "focus", kl, "input", zr, "invalid", Hn, "keyDown", Fi, "keyPress", si, "keyUp", oa, "mouseDown", Pl, "mouseUp", zl, "paste", cf, "pause", df, "play", hf, "pointerCancel", pf, "pointerDown", sn, "pointerUp", Pn, "rateChange", En, "reset", ja, "seeked", js, "submit", oc, "touchCancel", lc, "touchEnd", vf, "touchStart", cc, "volumeChange"], Rg = [Oa, Va, Ol, Al, aa, Kd], Dg = [kp, "drag", Os, "dragEnter", rf, "dragExit", Nl, "dragLeave", af, "dragOver", _l, "mouseMove", Ba, "mouseOut", la, "mouseOver", ac, "pointerMove", Ai, "pointerOut", St, "pointerOver", Lr, "scroll", ko, "toggle", uc, "touchMove", gf, "wheel"], Ng = [Xd, "abort", Np, "animationEnd", Jd, "animationIteration", qd, "animationStart", _s, "canPlay", Ps, "canPlayThrough", nc, "durationChange", Bs, "emptied", sf, "encrypted", of, "ended", Ii, "error", sa, "gotPointerCapture", La, "load", lf, "loadedData", uf, "loadedMetadata", ic, "loadStart", rc, "lostPointerCapture", ff, "playing", Or, "progress", Qn, "seeking", sc, "stalled", No, "suspend", mf, "timeUpdate", Ll, "transitionEnd", dc, "waiting"];
    function ur(e, t) {
      for (var s = 0; s < e.length; s += 2) {
        var u = e[s], d = e[s + 1], p = d[0].toUpperCase() + d.slice(1), y = "on" + p, b = {
          phasedRegistrationNames: {
            bubbled: y,
            captured: y + "Capture"
          },
          dependencies: [u],
          eventPriority: t
        };
        Ec.set(u, t), Mc.set(u, b), kf[d] = b;
      }
    }
    function Ya(e, t) {
      for (var s = 0; s < e.length; s++)
        Ec.set(e[s], t);
    }
    ur(Ic, Da), ur(Dg, _n), ur(Ng, Ar), Ya(Rg, Da);
    function Ys(e) {
      var t = Ec.get(e);
      return t === void 0 ? Ar : t;
    }
    var Hp = o.unstable_UserBlockingPriority, Wp = o.unstable_runWithPriority, $l = !0;
    function _f(e) {
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
      var u;
      switch (Ys(t)) {
        case Da:
          u = Di.bind(null, t, Gr, e);
          break;
        case _n:
          u = Fp.bind(null, t, Gr, e);
          break;
        case Ar:
        default:
          u = Ql.bind(null, t, Gr, e);
          break;
      }
      var d = yf(t);
      s ? Tc(e, d, u) : Up(e, d, u);
    }
    function Di(e, t, s, u) {
      wo(u.timeStamp), yo(Ql, e, t, s, u);
    }
    function Fp(e, t, s, u) {
      Wp(Hp, Ql.bind(null, e, t, s, u));
    }
    function Ql(e, t, s, u) {
      if (!!$l) {
        if (Af() && Za(e)) {
          xc(
            null,
            e,
            t,
            s,
            u
          );
          return;
        }
        var d = Dc(e, t, s, u);
        if (d === null) {
          Rf(e, u);
          return;
        }
        if (Za(e)) {
          xc(d, e, t, s, u);
          return;
        }
        Df(d, e, t, s, u) || (Rf(e, u), Bo(e, t, u, null));
      }
    }
    function Dc(e, t, s, u) {
      var d = jl(u), p = th(d);
      if (p !== null) {
        var y = vi(p);
        if (y === null)
          p = null;
        else {
          var b = y.tag;
          if (b === ee) {
            var E = hc(y);
            if (E !== null)
              return E;
            p = null;
          } else if (b === Se) {
            var N = y.stateNode;
            if (N.hydrate)
              return pc(y);
            p = null;
          } else
            y !== p && (p = null);
        }
      }
      return Bo(e, t, u, p), null;
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
    var Pf = ["Webkit", "ms", "Moz", "O"];
    Object.keys(Gs).forEach(function(e) {
      Pf.forEach(function(t) {
        Gs[Qp(t, e)] = Gs[e];
      });
    });
    function Nc(e, t, s) {
      var u = t == null || typeof t == "boolean" || t === "";
      return u ? "" : !s && typeof t == "number" && t !== 0 && !(Gs.hasOwnProperty(e) && Gs[e]) ? t + "px" : ("" + t).trim();
    }
    var zf = /([A-Z])/g, Zp = /^ms-/;
    function Yp(e) {
      return e.replace(zf, "-$1").toLowerCase().replace(Zp, "-ms-");
    }
    var kc = function() {
    };
    {
      var Gp = /^(?:webkit|moz|o)[A-Z]/, ca = /^-ms-/, Xp = /-(.)/g, _c = /;\s*$/, Xs = {}, Pc = {}, Zl = !1, Jp = !1, kg = function(e) {
        return e.replace(Xp, function(t, s) {
          return s.toUpperCase();
        });
      }, Of = function(e) {
        Xs.hasOwnProperty(e) && Xs[e] || (Xs[e] = !0, g(
          "Unsupported style property %s. Did you mean %s?",
          e,
          kg(e.replace(ca, "ms-"))
        ));
      }, _g = function(e) {
        Xs.hasOwnProperty(e) && Xs[e] || (Xs[e] = !0, g("Unsupported vendor-prefixed style property %s. Did you mean %s?", e, e.charAt(0).toUpperCase() + e.slice(1)));
      }, Lf = function(e, t) {
        Pc.hasOwnProperty(t) && Pc[t] || (Pc[t] = !0, g(`Style property values shouldn't contain a semicolon. Try "%s: %s" instead.`, e, t.replace(_c, "")));
      }, Pg = function(e, t) {
        Zl || (Zl = !0, g("`NaN` is an invalid value for the `%s` css style property.", e));
      }, qp = function(e, t) {
        Jp || (Jp = !0, g("`Infinity` is an invalid value for the `%s` css style property.", e));
      };
      kc = function(e, t) {
        e.indexOf("-") > -1 ? Of(e) : Gp.test(e) ? _g(e) : _c.test(t) && Lf(e, t), typeof t == "number" && (isNaN(t) ? Pg(e, t) : isFinite(t) || qp(e, t));
      };
    }
    var zg = kc;
    function Kp(e) {
      {
        var t = "", s = "";
        for (var u in e)
          if (!!e.hasOwnProperty(u)) {
            var d = e[u];
            if (d != null) {
              var p = u.indexOf("--") === 0;
              t += s + (p ? u : Yp(u)) + ":", t += Nc(u, d, p), s = ";";
            }
          }
        return t || null;
      }
    }
    function Bf(e, t) {
      var s = e.style;
      for (var u in t)
        if (!!t.hasOwnProperty(u)) {
          var d = u.indexOf("--") === 0;
          d || zg(u, t[u]);
          var p = Nc(u, t[u], d);
          u === "float" && (u = "cssFloat"), d ? s.setProperty(u, p) : s[u] = p;
        }
    }
    function Og(e) {
      return e == null || typeof e == "boolean" || e === "";
    }
    function jf(e) {
      var t = {};
      for (var s in e)
        for (var u = $p[s] || [s], d = 0; d < u.length; d++)
          t[u[d]] = s;
      return t;
    }
    function em(e, t) {
      {
        if (!t)
          return;
        var s = jf(e), u = jf(t), d = {};
        for (var p in s) {
          var y = s[p], b = u[p];
          if (b && y !== b) {
            var E = y + "," + b;
            if (d[E])
              continue;
            d[E] = !0, g("%s a style property during rerender (%s) when a conflicting property is set (%s) can lead to styling bugs. To avoid this, don't mix shorthand and non-shorthand properties for the same value; instead, replace the shorthand with separate values.", Og(e[y]) ? "Removing" : "Updating", y, b);
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
    }, nm = n({
      menuitem: !0
    }, tm), Vf = "__html", Yl = null;
    Yl = m.ReactDebugCurrentFrame;
    function zc(e, t) {
      if (!!t) {
        if (nm[e] && !(t.children == null && t.dangerouslySetInnerHTML == null))
          throw Error(e + " is a void element tag and must neither have `children` nor use `dangerouslySetInnerHTML`." + Yl.getStackAddendum());
        if (t.dangerouslySetInnerHTML != null) {
          if (t.children != null)
            throw Error("Can only set one of `children` or `props.dangerouslySetInnerHTML`.");
          if (!(typeof t.dangerouslySetInnerHTML == "object" && Vf in t.dangerouslySetInnerHTML))
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
    }, Js = {}, rm = new RegExp("^(aria)-[" + ne + "]*$"), Lg = new RegExp("^(aria)[A-Z][" + ne + "]*$"), Oc = Object.prototype.hasOwnProperty;
    function am(e, t) {
      {
        if (Oc.call(Js, t) && Js[t])
          return !0;
        if (Lg.test(t)) {
          var s = "aria-" + t.slice(4).toLowerCase(), u = im.hasOwnProperty(s) ? s : null;
          if (u == null)
            return g("Invalid ARIA attribute `%s`. ARIA attributes follow the pattern aria-* and must be lowercase.", t), Js[t] = !0, !0;
          if (t !== u)
            return g("Invalid ARIA attribute `%s`. Did you mean `%s`?", t, u), Js[t] = !0, !0;
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
        for (var u in t) {
          var d = am(e, u);
          d || s.push(u);
        }
        var p = s.map(function(y) {
          return "`" + y + "`";
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
    var Ga = function() {
    };
    {
      var On = {}, sm = Object.prototype.hasOwnProperty, Xl = /^on./, Lc = /^on[^A-Z]/, Hf = new RegExp("^(aria)-[" + ne + "]*$"), at = new RegExp("^(aria)[A-Z][" + ne + "]*$");
      Ga = function(e, t, s, u) {
        if (sm.call(On, t) && On[t])
          return !0;
        var d = t.toLowerCase();
        if (d === "onfocusin" || d === "onfocusout")
          return g("React uses onFocus and onBlur instead of onFocusIn and onFocusOut. All React events are normalized to bubble, so onFocusIn and onFocusOut are not needed/supported by React."), On[t] = !0, !0;
        if (u) {
          if (We.hasOwnProperty(t))
            return !0;
          var p = Sn.hasOwnProperty(d) ? Sn[d] : null;
          if (p != null)
            return g("Invalid event handler property `%s`. Did you mean `%s`?", t, p), On[t] = !0, !0;
          if (Xl.test(t))
            return g("Unknown event handler property `%s`. It will be ignored.", t), On[t] = !0, !0;
        } else if (Xl.test(t))
          return Lc.test(t) && g("Invalid event handler property `%s`. React events use the camelCase naming convention, for example `onClick`.", t), On[t] = !0, !0;
        if (Hf.test(t) || at.test(t))
          return !0;
        if (d === "innerhtml")
          return g("Directly setting property `innerHTML` is not permitted. For more information, lookup documentation on `dangerouslySetInnerHTML`."), On[t] = !0, !0;
        if (d === "aria")
          return g("The `aria` attribute is reserved for future use in React. Pass individual `aria-` attributes instead."), On[t] = !0, !0;
        if (d === "is" && s !== null && s !== void 0 && typeof s != "string")
          return g("Received a `%s` for a string attribute `is`. If this is expected, cast the value to a string.", typeof s), On[t] = !0, !0;
        if (typeof s == "number" && isNaN(s))
          return g("Received NaN for the `%s` attribute. If this is expected, cast the value to a string.", t), On[t] = !0, !0;
        var y = bo(t), b = y !== null && y.type === qr;
        if (Gl.hasOwnProperty(d)) {
          var E = Gl[d];
          if (E !== t)
            return g("Invalid DOM property `%s`. Did you mean `%s`?", t, E), On[t] = !0, !0;
        } else if (!b && t !== d)
          return g("React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element.", t, d), On[t] = !0, !0;
        return typeof s == "boolean" && qt(t, s, y, !1) ? (s ? g('Received `%s` for a non-boolean attribute `%s`.\n\nIf you want to write it to the DOM, pass a string instead: %s="%s" or %s={value.toString()}.', s, t, t, s, t) : g('Received `%s` for a non-boolean attribute `%s`.\n\nIf you want to write it to the DOM, pass a string instead: %s="%s" or %s={value.toString()}.\n\nIf you used to conditionally omit it with %s={condition && value}, pass %s={condition ? value : undefined} instead.', s, t, t, s, t, t, t), On[t] = !0, !0) : b ? !0 : qt(t, s, y, !1) ? (On[t] = !0, !1) : ((s === "false" || s === "true") && y !== null && y.type === Vn && (g("Received the string `%s` for the boolean attribute `%s`. %s Did you mean %s={%s}?", s, t, s === "false" ? "The browser will interpret it as a truthy value." : 'Although this works, it will not work as expected if you pass the string "false".', t, s), On[t] = !0), !0);
      };
    }
    var Ni = function(e, t, s) {
      {
        var u = [];
        for (var d in t) {
          var p = Ga(e, d, t[d], s);
          p || u.push(d);
        }
        var y = u.map(function(b) {
          return "`" + b + "`";
        }).join(", ");
        u.length === 1 ? g("Invalid value for prop %s on <%s> tag. Either remove it from the element, or pass a string or number value to keep it in the DOM. For details, see https://fb.me/react-attribute-behavior", y, e) : u.length > 1 && g("Invalid values for props %s on <%s> tag. Either remove them from the element, or pass a string or number value to keep them in the DOM. For details, see https://fb.me/react-attribute-behavior", y, e);
      }
    };
    function ot(e, t, s) {
      da(e, t) || Ni(e, t, s);
    }
    var Ut = !1, pn = "dangerouslySetInnerHTML", qs = "suppressContentEditableWarning", ki = "suppressHydrationWarning", Ho = "autoFocus", Vr = "children", dr = "style", Ks = "__html", Xa = hi.html, Bc, Le, eo, Wo, Yi, Jl, Ja, Fo, fr, $o;
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
      var Wf = /\r\n?/g, jc = /\u0000|\uFFFD/g;
      fr = function(e) {
        var t = typeof e == "string" ? e : "" + e;
        return t.replace(Wf, `
`).replace(jc, "");
      }, Wo = function(e, t) {
        if (!Ut) {
          var s = fr(t), u = fr(e);
          u !== s && (Ut = !0, g('Text content did not match. Server: "%s" Client: "%s"', u, s));
        }
      }, Yi = function(e, t, s) {
        if (!Ut) {
          var u = fr(s), d = fr(t);
          d !== u && (Ut = !0, g("Prop `%s` did not match. Server: %s Client: %s", e, JSON.stringify(d), JSON.stringify(u)));
        }
      }, Jl = function(e) {
        if (!Ut) {
          Ut = !0;
          var t = [];
          e.forEach(function(s) {
            t.push(s);
          }), g("Extra attributes from the server: %s", t);
        }
      }, Ja = function(e, t) {
        t === !1 ? g("Expected `%s` listener to be a function, instead got `false`.\n\nIf you used to conditionally omit it with %s={condition && value}, pass %s={condition ? value : undefined} instead.", e, e, e) : g("Expected `%s` listener to be a function, instead got a value of `%s` type.", e, typeof t);
      }, $o = function(e, t) {
        var s = e.namespaceURI === Xa ? e.ownerDocument.createElement(e.tagName) : e.ownerDocument.createElementNS(e.namespaceURI, e.tagName);
        return s.innerHTML = t, s.innerHTML;
      };
    }
    function Ln(e, t) {
      var s = e.nodeType === _a || e.nodeType === qu, u = s ? e : e.ownerDocument;
      Ws(t, u);
    }
    function qa(e) {
      return e.nodeType === _a ? e : e.ownerDocument;
    }
    function Ka() {
    }
    function to(e) {
      e.onclick = Ka;
    }
    function Vc(e, t, s, u, d) {
      for (var p in u)
        if (!!u.hasOwnProperty(p)) {
          var y = u[p];
          if (p === dr)
            y && Object.freeze(y), Bf(t, y);
          else if (p === pn) {
            var b = y ? y[Ks] : void 0;
            b != null && Rp(t, b);
          } else if (p === Vr)
            if (typeof y == "string") {
              var E = e !== "textarea" || y !== "";
              E && Ml(t, y);
            } else
              typeof y == "number" && Ml(t, "" + y);
          else
            p === qs || p === ki || p === Ho || (We.hasOwnProperty(p) ? y != null && (typeof y != "function" && Ja(p, y), Ln(s, p)) : y != null && M(t, p, y, d));
        }
    }
    function _i(e, t, s, u) {
      for (var d = 0; d < t.length; d += 2) {
        var p = t[d], y = t[d + 1];
        p === dr ? Bf(e, y) : p === pn ? Rp(e, y) : p === Vr ? Ml(e, y) : M(e, p, y, u);
      }
    }
    function om(e, t, s, u) {
      var d, p = qa(s), y, b = u;
      if (b === Xa && (b = Yd(e)), b === Xa) {
        if (d = da(e, t), !d && e !== e.toLowerCase() && g("<%s /> is using incorrect casing. Use PascalCase for React components, or lowercase for HTML elements.", e), e === "script") {
          var E = p.createElement("div");
          E.innerHTML = "<script><\/script>";
          var N = E.firstChild;
          y = E.removeChild(N);
        } else if (typeof t.is == "string")
          y = p.createElement(e, {
            is: t.is
          });
        else if (y = p.createElement(e), e === "select") {
          var k = y;
          t.multiple ? k.multiple = !0 : t.size && (k.size = t.size);
        }
      } else
        y = p.createElementNS(b, e);
      return b === Xa && !d && Object.prototype.toString.call(y) === "[object HTMLUnknownElement]" && !Object.prototype.hasOwnProperty.call(Bc, e) && (Bc[e] = !0, g("The tag <%s> is unrecognized in this browser. If you meant to render a React component, start its name with an uppercase letter.", e)), y;
    }
    function Ff(e, t) {
      return qa(t).createTextNode(e);
    }
    function Bg(e, t, s, u) {
      var d = da(t, s);
      eo(t, s);
      var p;
      switch (t) {
        case "iframe":
        case "object":
        case "embed":
          Gt(La, e), p = s;
          break;
        case "video":
        case "audio":
          for (var y = 0; y < _o.length; y++)
            Gt(_o[y], e);
          p = s;
          break;
        case "source":
          Gt(Ii, e), p = s;
          break;
        case "img":
        case "image":
        case "link":
          Gt(Ii, e), Gt(La, e), p = s;
          break;
        case "form":
          Gt(En, e), Gt(js, e), p = s;
          break;
        case "details":
          Gt(ko, e), p = s;
          break;
        case "input":
          Wd(e, s), p = Fu(e, s), Gt(zr, e), Ln(u, "onChange");
          break;
        case "option":
          $d(e, s), p = _r(e, s);
          break;
        case "select":
          Pr(e, s), p = xl(e, s), Gt(zr, e), Ln(u, "onChange");
          break;
        case "textarea":
          Ns(e, s), p = Zd(e, s), Gt(zr, e), Ln(u, "onChange");
          break;
        default:
          p = s;
      }
      switch (zc(t, p), Vc(t, e, u, p, d), t) {
        case "input":
          Ds(e), Qu(e, s, !1);
          break;
        case "textarea":
          Ds(e), Gu(e);
          break;
        case "option":
          Qd(e, s);
          break;
        case "select":
          Ep(e, s);
          break;
        default:
          typeof p.onClick == "function" && to(e);
          break;
      }
    }
    function lm(e, t, s, u, d) {
      eo(t, u);
      var p = null, y, b;
      switch (t) {
        case "input":
          y = Fu(e, s), b = Fu(e, u), p = [];
          break;
        case "option":
          y = _r(e, s), b = _r(e, u), p = [];
          break;
        case "select":
          y = xl(e, s), b = xl(e, u), p = [];
          break;
        case "textarea":
          y = Zd(e, s), b = Zd(e, u), p = [];
          break;
        default:
          y = s, b = u, typeof y.onClick != "function" && typeof b.onClick == "function" && to(e);
          break;
      }
      zc(t, b);
      var E, N, k = null;
      for (E in y)
        if (!(b.hasOwnProperty(E) || !y.hasOwnProperty(E) || y[E] == null))
          if (E === dr) {
            var J = y[E];
            for (N in J)
              J.hasOwnProperty(N) && (k || (k = {}), k[N] = "");
          } else
            E === pn || E === Vr || E === qs || E === ki || E === Ho || (We.hasOwnProperty(E) ? p || (p = []) : (p = p || []).push(E, null));
      for (E in b) {
        var L = b[E], K = y != null ? y[E] : void 0;
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
            E === Vr ? K !== L && (typeof L == "string" || typeof L == "number") && (p = p || []).push(E, "" + L) : E === qs || E === ki || (We.hasOwnProperty(E) ? (L != null && (typeof L != "function" && Ja(E, L), Ln(d, E)), !p && K !== L && (p = [])) : (p = p || []).push(E, L));
      }
      return k && (em(k, b[dr]), (p = p || []).push(dr, k)), p;
    }
    function um(e, t, s, u, d) {
      s === "input" && d.type === "radio" && d.name != null && $u(e, d);
      var p = da(s, u), y = da(s, d);
      switch (_i(e, t, p, y), s) {
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
    function cm(e, t, s, u, d) {
      var p, y;
      switch (Le = s[ki] === !0, p = da(t, s), eo(t, s), t) {
        case "iframe":
        case "object":
        case "embed":
          Gt(La, e);
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
          Gt(Ii, e), Gt(La, e);
          break;
        case "form":
          Gt(En, e), Gt(js, e);
          break;
        case "details":
          Gt(ko, e);
          break;
        case "input":
          Wd(e, s), Gt(zr, e), Ln(d, "onChange");
          break;
        case "option":
          $d(e, s);
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
        y = /* @__PURE__ */ new Set();
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
              y.add(E[N].name);
          }
        }
      }
      var J = null;
      for (var L in s)
        if (!!s.hasOwnProperty(L)) {
          var K = s[L];
          if (L === Vr)
            typeof K == "string" ? e.textContent !== K && (Le || Wo(e.textContent, K), J = [Vr, K]) : typeof K == "number" && e.textContent !== "" + K && (Le || Wo(e.textContent, K), J = [Vr, "" + K]);
          else if (We.hasOwnProperty(L))
            K != null && (typeof K != "function" && Ja(L, K), Ln(d, L));
          else if (typeof p == "boolean") {
            var me = void 0, we = bo(L);
            if (!Le) {
              if (!(L === qs || L === ki || L === "value" || L === "checked" || L === "selected")) {
                if (L === pn) {
                  var Ke = e.innerHTML, nt = K ? K[Ks] : void 0, Pt = $o(e, nt != null ? nt : "");
                  Pt !== Ke && Yi(L, Ke, Pt);
                } else if (L === dr) {
                  if (y.delete(L), Fo) {
                    var vt = Kp(K);
                    me = e.getAttribute("style"), vt !== me && Yi(L, me, vt);
                  }
                } else if (p)
                  y.delete(L.toLowerCase()), me = gl(e, L, K), K !== me && Yi(L, me, K);
                else if (!ti(L, we, p) && !Na(L, K, we, p)) {
                  var Qt = !1;
                  if (we !== null)
                    y.delete(we.attributeName), me = Bu(e, L, K, we);
                  else {
                    var $ = u;
                    if ($ === Xa && ($ = Yd(t)), $ === Xa)
                      y.delete(L.toLowerCase());
                    else {
                      var te = no(L);
                      te !== null && te !== L && (Qt = !0, y.delete(te)), y.delete(L);
                    }
                    me = gl(e, L, K);
                  }
                  K !== me && !Qt && Yi(L, me, K);
                }
              }
            }
          }
        }
      switch (y.size > 0 && !Le && Jl(y), t) {
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
    function $f(e, t) {
      Wo(e.nodeValue, t);
    }
    function ql(e, t) {
      {
        if (Ut)
          return;
        Ut = !0, g("Did not expect server HTML to contain a <%s> in <%s>.", t.nodeName.toLowerCase(), e.nodeName.toLowerCase());
      }
    }
    function fm(e, t) {
      {
        if (Ut)
          return;
        Ut = !0, g('Did not expect server HTML to contain the text node "%s" in <%s>.', t.nodeValue, e.nodeName.toLowerCase());
      }
    }
    function hm(e, t, s) {
      {
        if (Ut)
          return;
        Ut = !0, g("Expected server HTML to contain a matching <%s> in <%s>.", t, e.nodeName.toLowerCase());
      }
    }
    function Qf(e, t) {
      {
        if (t === "" || Ut)
          return;
        Ut = !0, g('Expected server HTML to contain a matching text node for "%s" in <%s>.', t, e.nodeName.toLowerCase());
      }
    }
    function pm(e, t, s) {
      switch (t) {
        case "input":
          Fd(e, s);
          return;
        case "textarea":
          Xu(e, s);
          return;
        case "select":
          Eg(e, s);
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
    function es(e) {
      for (; e && e.firstChild; )
        e = e.firstChild;
      return e;
    }
    function jg(e) {
      for (; e; ) {
        if (e.nextSibling)
          return e.nextSibling;
        e = e.parentNode;
      }
    }
    function mm(e, t) {
      for (var s = es(e), u = 0, d = 0; s; ) {
        if (s.nodeType === sr) {
          if (d = u + s.textContent.length, u <= t && d >= t)
            return {
              node: s,
              offset: t - u
            };
          u = d;
        }
        s = es(jg(s));
      }
    }
    function Qo(e) {
      var t = e.ownerDocument, s = t && t.defaultView || window, u = s.getSelection && s.getSelection();
      if (!u || u.rangeCount === 0)
        return null;
      var d = u.anchorNode, p = u.anchorOffset, y = u.focusNode, b = u.focusOffset;
      try {
        d.nodeType, y.nodeType;
      } catch {
        return null;
      }
      return Vg(e, d, p, y, b);
    }
    function Vg(e, t, s, u, d) {
      var p = 0, y = -1, b = -1, E = 0, N = 0, k = e, J = null;
      e:
        for (; ; ) {
          for (var L = null; k === t && (s === 0 || k.nodeType === sr) && (y = p + s), k === u && (d === 0 || k.nodeType === sr) && (b = p + d), k.nodeType === sr && (p += k.nodeValue.length), (L = k.firstChild) !== null; )
            J = k, k = L;
          for (; ; ) {
            if (k === e)
              break e;
            if (J === t && ++E === s && (y = p), J === u && ++N === d && (b = p), (L = k.nextSibling) !== null)
              break;
            k = J, J = k.parentNode;
          }
          k = L;
        }
      return y === -1 || b === -1 ? null : {
        start: y,
        end: b
      };
    }
    function vm(e, t) {
      var s = e.ownerDocument || document, u = s && s.defaultView || window;
      if (!!u.getSelection) {
        var d = u.getSelection(), p = e.textContent.length, y = Math.min(t.start, p), b = t.end === void 0 ? y : Math.min(t.end, p);
        if (!d.extend && y > b) {
          var E = b;
          b = y, y = E;
        }
        var N = mm(e, y), k = mm(e, b);
        if (N && k) {
          if (d.rangeCount === 1 && d.anchorNode === N.node && d.anchorOffset === N.offset && d.focusNode === k.node && d.focusOffset === k.offset)
            return;
          var J = s.createRange();
          J.setStart(N.node, N.offset), d.removeAllRanges(), y > b ? (d.addRange(J), d.extend(k.node, k.offset)) : (J.setEnd(k.node, k.offset), d.addRange(J));
        }
      }
    }
    function ts(e) {
      return e && e.nodeType === sr;
    }
    function gm(e, t) {
      return !e || !t ? !1 : e === t ? !0 : ts(e) ? !1 : ts(t) ? gm(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1;
    }
    function Ug(e) {
      return e && e.ownerDocument && gm(e.ownerDocument.documentElement, e);
    }
    function ym(e) {
      try {
        return typeof e.contentWindow.location.href == "string";
      } catch {
        return !1;
      }
    }
    function Uc() {
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
    function Hg() {
      var e = Uc();
      return {
        activeElementDetached: null,
        focusedElem: e,
        selectionRange: eu(e) ? Ur(e) : null
      };
    }
    function Wg(e) {
      var t = Uc(), s = e.focusedElem, u = e.selectionRange;
      if (t !== s && Ug(s)) {
        u !== null && eu(s) && Zf(s, u);
        for (var d = [], p = s; p = p.parentNode; )
          p.nodeType === ar && d.push({
            element: p,
            left: p.scrollLeft,
            top: p.scrollTop
          });
        typeof s.focus == "function" && s.focus();
        for (var y = 0; y < d.length; y++) {
          var b = d[y];
          b.element.scrollLeft = b.left, b.element.scrollTop = b.top;
        }
      }
    }
    function Ur(e) {
      var t;
      return "selectionStart" in e ? t = {
        start: e.selectionStart,
        end: e.selectionEnd
      } : t = Qo(e), t || {
        start: 0,
        end: 0
      };
    }
    function Zf(e, t) {
      var s = t.start, u = t.end;
      u === void 0 && (u = s), "selectionStart" in e ? (e.selectionStart = s, e.selectionEnd = Math.min(u, e.value.length)) : vm(e, t);
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
      ], Yf = fa.concat(["button"]), Gf = ["dd", "dt", "li", "option", "optgroup", "p", "rp", "rt"], wm = {
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
        var s = n({}, e || wm), u = {
          tag: t
        };
        return fa.indexOf(t) !== -1 && (s.aTagInScope = null, s.buttonTagInScope = null, s.nobrTagInScope = null), Yf.indexOf(t) !== -1 && (s.pTagInButtonScope = null), Hc.indexOf(t) !== -1 && t !== "address" && t !== "div" && t !== "p" && (s.listItemTagAutoclosing = null, s.dlItemTagAutoclosing = null), s.current = u, t === "form" && (s.formTag = u), t === "a" && (s.aTagInScope = u), t === "button" && (s.buttonTagInScope = u), t === "nobr" && (s.nobrTagInScope = u), t === "p" && (s.pTagInButtonScope = u), t === "li" && (s.listItemTagAutoclosing = u), (t === "dd" || t === "dt") && (s.dlItemTagAutoclosing = u), s;
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
            return Gf.indexOf(t) === -1;
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
      }, Xf = {};
      tu = function(e, t, s) {
        s = s || wm;
        var u = s.current, d = u && u.tag;
        t != null && (e != null && g("validateDOMNesting: when childText is passed, childTag should be null"), e = "#text");
        var p = bm(e, d) ? null : u, y = p ? null : io(e, s), b = p || y;
        if (!!b) {
          var E = b.tag, N = ft(), k = !!p + "|" + e + "|" + E + "|" + N;
          if (!Xf[k]) {
            Xf[k] = !0;
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
    var ns;
    ns = "suppressHydrationWarning";
    var nu = "$", Wc = "/$", Fc = "$?", iu = "$!", Jf = "style", ro = null, qf = null;
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
    function Fg(e) {
      var t, s, u = e.nodeType;
      switch (u) {
        case _a:
        case qu: {
          t = u === _a ? "#document" : "#fragment";
          var d = e.documentElement;
          s = d ? d.namespaceURI : Gd(null, "");
          break;
        }
        default: {
          var p = u === ai ? e.parentNode : e, y = p.namespaceURI || null;
          t = p.tagName, s = Gd(y, t);
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
        var u = e, d = Gd(u.namespace, t), p = hr(u.ancestorInfo, t);
        return {
          namespace: d,
          ancestorInfo: p
        };
      }
    }
    function zS(e) {
      return e;
    }
    function i(e) {
      ro = Ac(), qf = Hg(), _f(!1);
    }
    function a(e) {
      Wg(qf), _f(ro), ro = null, qf = null;
    }
    function c(e, t, s, u, d) {
      var p;
      {
        var y = u;
        if (tu(e, null, y.ancestorInfo), typeof t.children == "string" || typeof t.children == "number") {
          var b = "" + t.children, E = hr(y.ancestorInfo, e);
          tu(null, b, E);
        }
        p = y.namespace;
      }
      var N = om(e, t, s, p);
      return Cm(d, N), Gg(N, t), N;
    }
    function f(e, t) {
      e.appendChild(t);
    }
    function v(e, t, s, u, d) {
      return Bg(e, t, s, u), ru(t, s);
    }
    function x(e, t, s, u, d, p) {
      {
        var y = p;
        if (typeof u.children != typeof s.children && (typeof u.children == "string" || typeof u.children == "number")) {
          var b = "" + u.children, E = hr(y.ancestorInfo, t);
          tu(null, b, E);
        }
      }
      return lm(e, t, s, u, d);
    }
    function T(e, t) {
      return e === "textarea" || e === "option" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
    }
    function R(e, t) {
      return !!t.hidden;
    }
    function W(e, t, s, u) {
      {
        var d = s;
        tu(null, e, d.ancestorInfo);
      }
      var p = Ff(e, t);
      return Cm(u, p), p;
    }
    var U = typeof setTimeout == "function" ? setTimeout : void 0, Me = typeof clearTimeout == "function" ? clearTimeout : void 0, De = -1;
    function mt(e, t, s, u) {
      ru(t, s) && e.focus();
    }
    function Et(e, t, s, u, d, p) {
      Gg(e, d), um(e, t, s, u, d);
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
      var u = e._reactRootContainer;
      u == null && s.onclick === null && to(s);
    }
    function Q(e, t, s) {
      e.insertBefore(t, s);
    }
    function ue(e, t, s) {
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
      var s = t[Jf], u = s != null && s.hasOwnProperty("display") ? s.display : null;
      e.style.display = Nc("display", u);
    }
    function lt(e, t) {
      e.nodeValue = t;
    }
    function is(e, t, s) {
      return e.nodeType !== ar || t.toLowerCase() !== e.nodeName.toLowerCase() ? null : e;
    }
    function $g(e, t) {
      return t === "" || e.nodeType !== sr ? null : e;
    }
    function JE(e) {
      return e.data === Fc;
    }
    function qE(e) {
      return e.data === iu;
    }
    function OS(e) {
      for (; e != null; e = e.nextSibling) {
        var t = e.nodeType;
        if (t === ar || t === sr)
          break;
      }
      return e;
    }
    function xm(e) {
      return OS(e.nextSibling);
    }
    function LS(e) {
      return OS(e.firstChild);
    }
    function KE(e, t, s, u, d, p) {
      Cm(p, e), Gg(e, s);
      var y;
      {
        var b = d;
        y = b.namespace;
      }
      return cm(e, t, s, y, u);
    }
    function eI(e, t, s) {
      return Cm(s, e), dm(e, t);
    }
    function tI(e) {
      for (var t = e.nextSibling, s = 0; t; ) {
        if (t.nodeType === ai) {
          var u = t.data;
          if (u === Wc) {
            if (s === 0)
              return xm(t);
            s--;
          } else
            (u === nu || u === iu || u === Fc) && s++;
        }
        t = t.nextSibling;
      }
      return null;
    }
    function BS(e) {
      for (var t = e.previousSibling, s = 0; t; ) {
        if (t.nodeType === ai) {
          var u = t.data;
          if (u === nu || u === iu || u === Fc) {
            if (s === 0)
              return t;
            s--;
          } else
            u === Wc && s++;
        }
        t = t.previousSibling;
      }
      return null;
    }
    function nI(e) {
      Cc(e);
    }
    function iI(e) {
      Cc(e);
    }
    function rI(e, t, s) {
      $f(t, s);
    }
    function aI(e, t, s, u, d) {
      t[ns] !== !0 && $f(u, d);
    }
    function sI(e, t) {
      t.nodeType === ar ? ql(e, t) : t.nodeType === ai || fm(e, t);
    }
    function oI(e, t, s, u) {
      t[ns] !== !0 && (u.nodeType === ar ? ql(s, u) : u.nodeType === ai || fm(s, u));
    }
    function lI(e, t, s) {
      hm(e, t);
    }
    function uI(e, t) {
      Qf(e, t);
    }
    function cI(e, t, s, u, d) {
      t[ns] !== !0 && hm(s, u);
    }
    function dI(e, t, s, u) {
      t[ns] !== !0 && Qf(s, u);
    }
    function fI(e, t, s) {
      t[ns];
    }
    var Qg = Math.random().toString(36).slice(2), Kf = "__reactInternalInstance$" + Qg, jS = "__reactEventHandlers$" + Qg, eh = "__reactContainere$" + Qg;
    function Cm(e, t) {
      t[Kf] = e;
    }
    function hI(e, t) {
      t[eh] = e;
    }
    function VS(e) {
      e[eh] = null;
    }
    function Zg(e) {
      return !!e[eh];
    }
    function th(e) {
      var t = e[Kf];
      if (t)
        return t;
      for (var s = e.parentNode; s; ) {
        if (t = s[eh] || s[Kf], t) {
          var u = t.alternate;
          if (t.child !== null || u !== null && u.child !== null)
            for (var d = BS(e); d !== null; ) {
              var p = d[Kf];
              if (p)
                return p;
              d = BS(d);
            }
          return t;
        }
        e = s, s = e.parentNode;
      }
      return null;
    }
    function Zo(e) {
      var t = e[Kf] || e[eh];
      return t && (t.tag === Re || t.tag === Qe || t.tag === ee || t.tag === Se) ? t : null;
    }
    function au(e) {
      if (e.tag === Re || e.tag === Qe)
        return e.stateNode;
      throw Error("getNodeFromInstance: Invalid argument.");
    }
    function Yg(e) {
      return e[jS] || null;
    }
    function Gg(e, t) {
      e[jS] = t;
    }
    function ao(e) {
      do
        e = e.return;
      while (e && e.tag !== Re);
      return e || null;
    }
    function pI(e, t) {
      for (var s = 0, u = e; u; u = ao(u))
        s++;
      for (var d = 0, p = t; p; p = ao(p))
        d++;
      for (; s - d > 0; )
        e = ao(e), s--;
      for (; d - s > 0; )
        t = ao(t), d--;
      for (var y = s; y--; ) {
        if (e === t || e === t.alternate)
          return e;
        e = ao(e), t = ao(t);
      }
      return null;
    }
    function mI(e, t, s) {
      for (var u = []; e; )
        u.push(e), e = ao(e);
      var d;
      for (d = u.length; d-- > 0; )
        t(u[d], "captured", s);
      for (d = 0; d < u.length; d++)
        t(u[d], "bubbled", s);
    }
    function vI(e, t, s, u, d) {
      for (var p = e && t ? pI(e, t) : null, y = []; !(!e || e === p); ) {
        var b = e.alternate;
        if (b !== null && b === p)
          break;
        y.push(e), e = ao(e);
      }
      for (var E = []; !(!t || t === p); ) {
        var N = t.alternate;
        if (N !== null && N === p)
          break;
        E.push(t), t = ao(t);
      }
      for (var k = 0; k < y.length; k++)
        s(y[k], "bubbled", u);
      for (var J = E.length; J-- > 0; )
        s(E[J], "captured", d);
    }
    function gI(e) {
      return e === "button" || e === "input" || e === "select" || e === "textarea";
    }
    function yI(e, t, s) {
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
          return !!(s.disabled && gI(t));
        default:
          return !1;
      }
    }
    function US(e, t) {
      var s, u = e.stateNode;
      if (!u)
        return null;
      var d = $e(u);
      if (!d || (s = d[t], yI(t, e.type, d)))
        return null;
      if (!(!s || typeof s == "function"))
        throw Error("Expected `" + t + "` listener to be a function, instead got a value of `" + typeof s + "` type.");
      return s;
    }
    function wI(e, t, s) {
      var u = t.dispatchConfig.phasedRegistrationNames[s];
      return US(e, u);
    }
    function bI(e, t, s) {
      e || g("Dispatching inst must not be null");
      var u = wI(e, s, t);
      u && (s._dispatchListeners = Us(s._dispatchListeners, u), s._dispatchInstances = Us(s._dispatchInstances, e));
    }
    function SI(e) {
      e && e.dispatchConfig.phasedRegistrationNames && mI(e._targetInst, bI, e);
    }
    function HS(e, t, s) {
      if (e && s && s.dispatchConfig.registrationName) {
        var u = s.dispatchConfig.registrationName, d = US(e, u);
        d && (s._dispatchListeners = Us(s._dispatchListeners, d), s._dispatchInstances = Us(s._dispatchInstances, e));
      }
    }
    function xI(e) {
      e && e.dispatchConfig.registrationName && HS(e._targetInst, null, e);
    }
    function $c(e) {
      Oo(e, SI);
    }
    function CI(e, t, s, u) {
      vI(s, u, HS, e, t);
    }
    function TI(e) {
      Oo(e, xI);
    }
    var nh = null, Xg = null, ih = null;
    function MI(e) {
      return nh = e, Xg = FS(), !0;
    }
    function EI() {
      nh = null, Xg = null, ih = null;
    }
    function WS() {
      if (ih)
        return ih;
      var e, t = Xg, s = t.length, u, d = FS(), p = d.length;
      for (e = 0; e < s && t[e] === d[e]; e++)
        ;
      var y = s - e;
      for (u = 1; u <= y && t[s - u] === d[p - u]; u++)
        ;
      var b = u > 1 ? 1 - u : void 0;
      return ih = d.slice(e, b), ih;
    }
    function FS() {
      return "value" in nh ? nh.value : nh.textContent;
    }
    var II = 10, AI = {
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
    function pr(e, t, s, u) {
      delete this.nativeEvent, delete this.preventDefault, delete this.stopPropagation, delete this.isDefaultPrevented, delete this.isPropagationStopped, this.dispatchConfig = e, this._targetInst = t, this.nativeEvent = s;
      var d = this.constructor.Interface;
      for (var p in d)
        if (!!d.hasOwnProperty(p)) {
          delete this[p];
          var y = d[p];
          y ? this[p] = y(s) : p === "target" ? this.target = u : this[p] = s[p];
        }
      var b = s.defaultPrevented != null ? s.defaultPrevented : s.returnValue === !1;
      return b ? this.isDefaultPrevented = Tm : this.isDefaultPrevented = su, this.isPropagationStopped = su, this;
    }
    n(pr.prototype, {
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
    }), pr.Interface = AI, pr.extend = function(e) {
      var t = this, s = function() {
      };
      s.prototype = t.prototype;
      var u = new s();
      function d() {
        return t.apply(this, arguments);
      }
      return n(u, d.prototype), d.prototype = u, d.prototype.constructor = d, d.Interface = n({}, t.Interface, e), d.extend = t.extend, $S(d), d;
    }, $S(pr);
    function Qc(e, t) {
      var s = typeof t == "function";
      return {
        configurable: !0,
        set: u,
        get: d
      };
      function u(y) {
        var b = s ? "setting the method" : "setting the property";
        return p(b, "This is effectively a no-op"), y;
      }
      function d() {
        var y = s ? "accessing the method" : "accessing the property", b = s ? "This is a no-op function" : "This is set to null";
        return p(y, b), t;
      }
      function p(y, b) {
        g("This synthetic event is reused for performance reasons. If you're seeing this, you're %s `%s` on a released/nullified synthetic event. %s. If you must keep the original synthetic event around, use event.persist(). See https://fb.me/react-event-pooling for more information.", y, e, b);
      }
    }
    function RI(e, t, s, u) {
      var d = this;
      if (d.eventPool.length) {
        var p = d.eventPool.pop();
        return d.call(p, e, t, s, u), p;
      }
      return new d(e, t, s, u);
    }
    function DI(e) {
      var t = this;
      if (!(e instanceof t))
        throw Error("Trying to release an event instance into a pool of a different type.");
      e.destructor(), t.eventPool.length < II && t.eventPool.push(e);
    }
    function $S(e) {
      e.eventPool = [], e.getPooled = RI, e.release = DI;
    }
    var NI = pr.extend({
      data: null
    }), kI = pr.extend({
      data: null
    }), _I = [9, 13, 27, 32], QS = 229, Jg = jn && "CompositionEvent" in window, rh = null;
    jn && "documentMode" in document && (rh = document.documentMode);
    var PI = jn && "TextEvent" in window && !rh, ZS = jn && (!Jg || rh && rh > 8 && rh <= 11), YS = 32, GS = String.fromCharCode(YS), so = {
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
        dependencies: [Un, aa, Hn, Fi, si, oa]
      },
      compositionStart: {
        phasedRegistrationNames: {
          bubbled: "onCompositionStart",
          captured: "onCompositionStartCapture"
        },
        dependencies: [Un, Al, Hn, Fi, si, oa]
      },
      compositionUpdate: {
        phasedRegistrationNames: {
          bubbled: "onCompositionUpdate",
          captured: "onCompositionUpdateCapture"
        },
        dependencies: [Un, Kd, Hn, Fi, si, oa]
      }
    }, XS = !1;
    function zI(e) {
      return (e.ctrlKey || e.altKey || e.metaKey) && !(e.ctrlKey && e.altKey);
    }
    function OI(e) {
      switch (e) {
        case Al:
          return so.compositionStart;
        case aa:
          return so.compositionEnd;
        case Kd:
          return so.compositionUpdate;
      }
    }
    function LI(e, t) {
      return e === Hn && t.keyCode === QS;
    }
    function JS(e, t) {
      switch (e) {
        case si:
          return _I.indexOf(t.keyCode) !== -1;
        case Hn:
          return t.keyCode !== QS;
        case Fi:
        case oa:
        case Un:
          return !0;
        default:
          return !1;
      }
    }
    function qS(e) {
      var t = e.detail;
      return typeof t == "object" && "data" in t ? t.data : null;
    }
    function KS(e) {
      return e.locale === "ko";
    }
    var Zc = !1;
    function BI(e, t, s, u) {
      var d, p;
      if (Jg ? d = OI(e) : Zc ? JS(e, s) && (d = so.compositionEnd) : LI(e, s) && (d = so.compositionStart), !d)
        return null;
      ZS && !KS(s) && (!Zc && d === so.compositionStart ? Zc = MI(u) : d === so.compositionEnd && Zc && (p = WS()));
      var y = NI.getPooled(d, t, s, u);
      if (p)
        y.data = p;
      else {
        var b = qS(s);
        b !== null && (y.data = b);
      }
      return $c(y), y;
    }
    function jI(e, t) {
      switch (e) {
        case aa:
          return qS(t);
        case Fi:
          var s = t.which;
          return s !== YS ? null : (XS = !0, GS);
        case Ol:
          var u = t.data;
          return u === GS && XS ? null : u;
        default:
          return null;
      }
    }
    function VI(e, t) {
      if (Zc) {
        if (e === aa || !Jg && JS(e, t)) {
          var s = WS();
          return EI(), Zc = !1, s;
        }
        return null;
      }
      switch (e) {
        case zl:
          return null;
        case Fi:
          if (!zI(t)) {
            if (t.char && t.char.length > 1)
              return t.char;
            if (t.which)
              return String.fromCharCode(t.which);
          }
          return null;
        case aa:
          return ZS && !KS(t) ? null : t.data;
        default:
          return null;
      }
    }
    function UI(e, t, s, u) {
      var d;
      if (PI ? d = jI(e, s) : d = VI(e, s), !d)
        return null;
      var p = kI.getPooled(so.beforeInput, t, s, u);
      return p.data = d, $c(p), p;
    }
    var HI = {
      eventTypes: so,
      extractEvents: function(e, t, s, u, d) {
        var p = BI(e, t, s, u), y = UI(e, t, s, u);
        return p === null ? y : y === null ? p : [p, y];
      }
    }, WI = {
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
    function ex(e) {
      var t = e && e.nodeName && e.nodeName.toLowerCase();
      return t === "input" ? !!WI[e.type] : t === "textarea";
    }
    var tx = {
      change: {
        phasedRegistrationNames: {
          bubbled: "onChange",
          captured: "onChangeCapture"
        },
        dependencies: [Un, Oa, Il, Wi, kl, Hn, si, Va]
      }
    };
    function nx(e, t, s) {
      var u = pr.getPooled(tx.change, e, t, s);
      return u.type = "change", Ti(s), $c(u), u;
    }
    var ah = null, sh = null;
    function FI(e) {
      var t = e.nodeName && e.nodeName.toLowerCase();
      return t === "select" || t === "input" && e.type === "file";
    }
    function $I(e) {
      var t = nx(sh, e, jl(e));
      Jr(QI, t);
    }
    function QI(e) {
      mc(e);
    }
    function Mm(e) {
      var t = au(e);
      if (Hu(t))
        return e;
    }
    function ZI(e, t) {
      if (e === Oa)
        return t;
    }
    var qg = !1;
    jn && (qg = Vl("input") && (!document.documentMode || document.documentMode > 9));
    function YI(e, t) {
      ah = e, sh = t, ah.attachEvent("onpropertychange", rx);
    }
    function ix() {
      !ah || (ah.detachEvent("onpropertychange", rx), ah = null, sh = null);
    }
    function rx(e) {
      e.propertyName === "value" && Mm(sh) && $I(e);
    }
    function GI(e, t, s) {
      e === Wi ? (ix(), YI(t, s)) : e === Un && ix();
    }
    function XI(e, t) {
      if (e === Va || e === si || e === Hn)
        return Mm(sh);
    }
    function JI(e) {
      var t = e.nodeName;
      return t && t.toLowerCase() === "input" && (e.type === "checkbox" || e.type === "radio");
    }
    function qI(e, t) {
      if (e === Il)
        return Mm(t);
    }
    function KI(e, t) {
      if (e === kl || e === Oa)
        return Mm(t);
    }
    function eA(e) {
      var t = e._wrapperState;
      !t || !t.controlled || e.type !== "number" || bl(e, "number", e.value);
    }
    var tA = {
      eventTypes: tx,
      _isInputEventSupported: qg,
      extractEvents: function(e, t, s, u, d) {
        var p = t ? au(t) : window, y, b;
        if (FI(p) ? y = ZI : ex(p) ? qg ? y = KI : (y = XI, b = GI) : JI(p) && (y = qI), y) {
          var E = y(e, t);
          if (E) {
            var N = nx(E, s, u);
            return N;
          }
        }
        b && b(e, p, t), e === Un && eA(p);
      }
    }, oh = pr.extend({
      view: null,
      detail: null
    }), nA = {
      Alt: "altKey",
      Control: "ctrlKey",
      Meta: "metaKey",
      Shift: "shiftKey"
    };
    function iA(e) {
      var t = this, s = t.nativeEvent;
      if (s.getModifierState)
        return s.getModifierState(e);
      var u = nA[e];
      return u ? !!s[u] : !1;
    }
    function Kg(e) {
      return iA;
    }
    var ax = 0, sx = 0, ox = !1, lx = !1, lh = oh.extend({
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
      getModifierState: Kg,
      button: null,
      buttons: null,
      relatedTarget: function(e) {
        return e.relatedTarget || (e.fromElement === e.srcElement ? e.toElement : e.fromElement);
      },
      movementX: function(e) {
        if ("movementX" in e)
          return e.movementX;
        var t = ax;
        return ax = e.screenX, ox ? e.type === "mousemove" ? e.screenX - t : 0 : (ox = !0, 0);
      },
      movementY: function(e) {
        if ("movementY" in e)
          return e.movementY;
        var t = sx;
        return sx = e.screenY, lx ? e.type === "mousemove" ? e.screenY - t : 0 : (lx = !0, 0);
      }
    }), ux = lh.extend({
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
    }), uh = {
      mouseEnter: {
        registrationName: "onMouseEnter",
        dependencies: [Ba, la]
      },
      mouseLeave: {
        registrationName: "onMouseLeave",
        dependencies: [Ba, la]
      },
      pointerEnter: {
        registrationName: "onPointerEnter",
        dependencies: [Ai, St]
      },
      pointerLeave: {
        registrationName: "onPointerLeave",
        dependencies: [Ai, St]
      }
    }, rA = {
      eventTypes: uh,
      extractEvents: function(e, t, s, u, d) {
        var p = e === la || e === St, y = e === Ba || e === Ai;
        if (p && (d & Ui) === 0 && (s.relatedTarget || s.fromElement) || !y && !p)
          return null;
        var b;
        if (u.window === u)
          b = u;
        else {
          var E = u.ownerDocument;
          E ? b = E.defaultView || E.parentWindow : b = window;
        }
        var N, k;
        if (y) {
          N = t;
          var J = s.relatedTarget || s.toElement;
          if (k = J ? th(J) : null, k !== null) {
            var L = vi(k);
            (k !== L || k.tag !== Re && k.tag !== Qe) && (k = null);
          }
        } else
          N = null, k = t;
        if (N === k)
          return null;
        var K, me, we, Ke;
        e === Ba || e === la ? (K = lh, me = uh.mouseLeave, we = uh.mouseEnter, Ke = "mouse") : (e === Ai || e === St) && (K = ux, me = uh.pointerLeave, we = uh.pointerEnter, Ke = "pointer");
        var nt = N == null ? b : au(N), Pt = k == null ? b : au(k), vt = K.getPooled(me, N, s, u);
        vt.type = Ke + "leave", vt.target = nt, vt.relatedTarget = Pt;
        var Qt = K.getPooled(we, k, s, u);
        return Qt.type = Ke + "enter", Qt.target = Pt, Qt.relatedTarget = nt, CI(vt, Qt, N, k), (d & Ma) === 0 ? [vt] : [vt, Qt];
      }
    };
    function aA(e, t) {
      return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
    }
    var ou = typeof Object.is == "function" ? Object.is : aA, sA = Object.prototype.hasOwnProperty;
    function ch(e, t) {
      if (ou(e, t))
        return !0;
      if (typeof e != "object" || e === null || typeof t != "object" || t === null)
        return !1;
      var s = Object.keys(e), u = Object.keys(t);
      if (s.length !== u.length)
        return !1;
      for (var d = 0; d < s.length; d++)
        if (!sA.call(t, s[d]) || !ou(e[s[d]], t[s[d]]))
          return !1;
      return !0;
    }
    var oA = jn && "documentMode" in document && document.documentMode <= 11, cx = {
      select: {
        phasedRegistrationNames: {
          bubbled: "onSelect",
          captured: "onSelectCapture"
        },
        dependencies: [Un, Rl, Dl, Wi, Hn, si, oa, Pl, Va]
      }
    }, Yc = null, ey = null, dh = null, ty = !1;
    function lA(e) {
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
    function dx(e) {
      return e.window === e ? e.document : e.nodeType === _a ? e : e.ownerDocument;
    }
    function fx(e, t) {
      var s = dx(t);
      if (ty || Yc == null || Yc !== Kl(s))
        return null;
      var u = lA(Yc);
      if (!dh || !ch(dh, u)) {
        dh = u;
        var d = pr.getPooled(cx.select, ey, e, t);
        return d.type = "select", d.target = Yc, $c(d), d;
      }
      return null;
    }
    var uA = {
      eventTypes: cx,
      extractEvents: function(e, t, s, u, d, p) {
        var y = p || dx(u);
        if (!y || !jo("onSelect", y))
          return null;
        var b = t ? au(t) : window;
        switch (e) {
          case Wi:
            (ex(b) || b.contentEditable === "true") && (Yc = b, ey = t, dh = null);
            break;
          case Un:
            Yc = null, ey = null, dh = null;
            break;
          case oa:
            ty = !0;
            break;
          case Rl:
          case Pl:
          case Dl:
            return ty = !1, fx(s, u);
          case Va:
            if (oA)
              break;
          case Hn:
          case si:
            return fx(s, u);
        }
        return null;
      }
    }, cA = pr.extend({
      animationName: null,
      elapsedTime: null,
      pseudoElement: null
    }), dA = pr.extend({
      clipboardData: function(e) {
        return "clipboardData" in e ? e.clipboardData : window.clipboardData;
      }
    }), fA = oh.extend({
      relatedTarget: null
    });
    function Em(e) {
      var t, s = e.keyCode;
      return "charCode" in e ? (t = e.charCode, t === 0 && s === 13 && (t = 13)) : t = s, t === 10 && (t = 13), t >= 32 || t === 13 ? t : 0;
    }
    var hA = {
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
    }, pA = {
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
    function mA(e) {
      if (e.key) {
        var t = hA[e.key] || e.key;
        if (t !== "Unidentified")
          return t;
      }
      if (e.type === "keypress") {
        var s = Em(e);
        return s === 13 ? "Enter" : String.fromCharCode(s);
      }
      return e.type === "keydown" || e.type === "keyup" ? pA[e.keyCode] || "Unidentified" : "";
    }
    var vA = oh.extend({
      key: mA,
      location: null,
      ctrlKey: null,
      shiftKey: null,
      altKey: null,
      metaKey: null,
      repeat: null,
      locale: null,
      getModifierState: Kg,
      charCode: function(e) {
        return e.type === "keypress" ? Em(e) : 0;
      },
      keyCode: function(e) {
        return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
      },
      which: function(e) {
        return e.type === "keypress" ? Em(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
      }
    }), gA = lh.extend({
      dataTransfer: null
    }), yA = oh.extend({
      touches: null,
      targetTouches: null,
      changedTouches: null,
      altKey: null,
      metaKey: null,
      ctrlKey: null,
      shiftKey: null,
      getModifierState: Kg
    }), wA = pr.extend({
      propertyName: null,
      elapsedTime: null,
      pseudoElement: null
    }), bA = lh.extend({
      deltaX: function(e) {
        return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
      },
      deltaY: function(e) {
        return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
      },
      deltaZ: null,
      deltaMode: null
    }), SA = [Xd, ec, _s, Ps, Do, nc, Bs, sf, of, Ii, kl, zr, La, lf, uf, ic, cf, df, ff, Or, Pn, En, ja, Qn, sc, js, No, mf, ko, cc, dc], xA = {
      eventTypes: kf,
      extractEvents: function(e, t, s, u, d) {
        var p = Mc.get(e);
        if (!p)
          return null;
        var y;
        switch (e) {
          case Fi:
            if (Em(s) === 0)
              return null;
          case Hn:
          case si:
            y = vA;
            break;
          case Un:
          case Wi:
            y = fA;
            break;
          case Il:
            if (s.button === 2)
              return null;
          case zs:
          case nf:
          case oa:
          case _l:
          case Pl:
          case Ba:
          case la:
          case Rl:
            y = lh;
            break;
          case kp:
          case Dl:
          case Os:
          case rf:
          case Nl:
          case af:
          case tc:
          case Ls:
            y = gA;
            break;
          case oc:
          case lc:
          case uc:
          case vf:
            y = yA;
            break;
          case Np:
          case Jd:
          case qd:
            y = cA;
            break;
          case Ll:
            y = wA;
            break;
          case Lr:
            y = oh;
            break;
          case gf:
            y = bA;
            break;
          case ef:
          case tf:
          case zl:
            y = dA;
            break;
          case sa:
          case rc:
          case hf:
          case pf:
          case ac:
          case Ai:
          case St:
          case sn:
            y = ux;
            break;
          default:
            SA.indexOf(e) === -1 && g("SimpleEventPlugin: Unhandled event type, `%s`. This warning is likely caused by a bug in React. Please file an issue.", e), y = pr;
            break;
        }
        var b = y.getPooled(p, t, s, u);
        return $c(b), b;
      }
    }, CA = ["ResponderEventPlugin", "SimpleEventPlugin", "EnterLeaveEventPlugin", "ChangeEventPlugin", "SelectEventPlugin", "BeforeInputEventPlugin"];
    ci(CA), he(Yg, Zo, au), Mr({
      SimpleEventPlugin: xA,
      EnterLeaveEventPlugin: rA,
      ChangeEventPlugin: tA,
      SelectEventPlugin: uA,
      BeforeInputEventPlugin: HI
    });
    var hx = "\u269B", TA = "\u26D4", yi = typeof performance < "u" && typeof performance.mark == "function" && typeof performance.clearMarks == "function" && typeof performance.measure == "function" && typeof performance.clearMeasures == "function", lu = null, rs = null, uu = null, Im = !1, Am = !1, ny = !1, fh = 0, as = 0, Rm = /* @__PURE__ */ new Set(), iy = function(e) {
      return hx + " " + e;
    }, MA = function(e, t) {
      var s = t ? TA + " " : hx + " ", u = t ? " Warning: " + t : "";
      return "" + s + e + u;
    }, Gc = function(e) {
      performance.mark(iy(e));
    }, EA = function(e) {
      performance.clearMarks(iy(e));
    }, Xc = function(e, t, s) {
      var u = iy(t), d = MA(e, s);
      try {
        performance.measure(d, u);
      } catch {
      }
      performance.clearMarks(u), performance.clearMeasures(d);
    }, ry = function(e, t) {
      return e + " (#" + t + ")";
    }, ay = function(e, t, s) {
      return s === null ? e + " [" + (t ? "update" : "mount") + "]" : e + "." + s;
    }, sy = function(e, t) {
      var s = Te(e.type) || "Unknown", u = e._debugID, d = e.alternate !== null, p = ay(s, d, t);
      if (Im && Rm.has(p))
        return !1;
      Rm.add(p);
      var y = ry(p, u);
      return Gc(y), !0;
    }, px = function(e, t) {
      var s = Te(e.type) || "Unknown", u = e._debugID, d = e.alternate !== null, p = ay(s, d, t), y = ry(p, u);
      EA(y);
    }, Dm = function(e, t, s) {
      var u = Te(e.type) || "Unknown", d = e._debugID, p = e.alternate !== null, y = ay(u, p, t), b = ry(y, d);
      Xc(y, b, s);
    }, Nm = function(e) {
      switch (e.tag) {
        case Se:
        case Re:
        case Qe:
        case He:
        case Tt:
        case re:
        case Ge:
        case Bt:
          return !0;
        default:
          return !1;
      }
    }, IA = function() {
      rs !== null && uu !== null && px(uu, rs), uu = null, rs = null, ny = !1;
    }, AA = function() {
      for (var e = lu; e; )
        e._debugIsCurrentlyTiming && Dm(e, null, null), e = e.return;
    }, mx = function(e) {
      e.return !== null && mx(e.return), e._debugIsCurrentlyTiming && sy(e, null);
    }, RA = function() {
      lu !== null && mx(lu);
    };
    function km() {
      as++;
    }
    function DA() {
      Im && (Am = !0), rs !== null && rs !== "componentWillMount" && rs !== "componentWillReceiveProps" && (ny = !0);
    }
    function vx(e) {
      {
        if (!yi || Nm(e) || (lu = e, !sy(e, null)))
          return;
        e._debugIsCurrentlyTiming = !0;
      }
    }
    function gx(e) {
      {
        if (!yi || Nm(e))
          return;
        e._debugIsCurrentlyTiming = !1, px(e, null);
      }
    }
    function yx(e) {
      {
        if (!yi || Nm(e) || (lu = e.return, !e._debugIsCurrentlyTiming))
          return;
        e._debugIsCurrentlyTiming = !1, Dm(e, null, null);
      }
    }
    function NA(e) {
      {
        if (!yi || Nm(e) || (lu = e.return, !e._debugIsCurrentlyTiming))
          return;
        e._debugIsCurrentlyTiming = !1;
        var t = e.tag === ee ? "Rendering was suspended" : "An error was thrown inside this error boundary";
        Dm(e, null, t);
      }
    }
    function ss(e, t) {
      {
        if (!yi || (IA(), !sy(e, t)))
          return;
        uu = e, rs = t;
      }
    }
    function os() {
      {
        if (!yi)
          return;
        if (rs !== null && uu !== null) {
          var e = ny ? "Scheduled a cascading update" : null;
          Dm(uu, rs, e);
        }
        rs = null, uu = null;
      }
    }
    function wx(e) {
      {
        if (lu = e, !yi)
          return;
        fh = 0, Gc("(React Tree Reconciliation)"), RA();
      }
    }
    function bx(e, t) {
      {
        if (!yi)
          return;
        var s = null;
        if (e !== null)
          if (e.tag === Se)
            s = "A top-level update interrupted the previous render";
          else {
            var u = Te(e.type) || "Unknown";
            s = "An update to " + u + " interrupted the previous render";
          }
        else
          fh > 1 && (s = "There were cascading updates");
        fh = 0;
        var d = t ? "(React Tree Reconciliation: Completed Root)" : "(React Tree Reconciliation: Yielded)";
        AA(), Xc(d, "(React Tree Reconciliation)", s);
      }
    }
    function kA() {
      {
        if (!yi)
          return;
        Im = !0, Am = !1, Rm.clear(), Gc("(Committing Changes)");
      }
    }
    function _A() {
      {
        if (!yi)
          return;
        var e = null;
        Am ? e = "Lifecycle hook scheduled a cascading update" : fh > 0 && (e = "Caused by a cascading update in earlier commit"), Am = !1, fh++, Im = !1, Rm.clear(), Xc("(Committing Changes)", "(Committing Changes)", e);
      }
    }
    function Sx() {
      {
        if (!yi)
          return;
        as = 0, Gc("(Committing Snapshot Effects)");
      }
    }
    function xx() {
      {
        if (!yi)
          return;
        var e = as;
        as = 0, Xc("(Committing Snapshot Effects: " + e + " Total)", "(Committing Snapshot Effects)", null);
      }
    }
    function Cx() {
      {
        if (!yi)
          return;
        as = 0, Gc("(Committing Host Effects)");
      }
    }
    function Tx() {
      {
        if (!yi)
          return;
        var e = as;
        as = 0, Xc("(Committing Host Effects: " + e + " Total)", "(Committing Host Effects)", null);
      }
    }
    function Mx() {
      {
        if (!yi)
          return;
        as = 0, Gc("(Calling Lifecycle Methods)");
      }
    }
    function Ex() {
      {
        if (!yi)
          return;
        var e = as;
        as = 0, Xc("(Calling Lifecycle Methods: " + e + " Total)", "(Calling Lifecycle Methods)", null);
      }
    }
    var oy = [], _m;
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
      t !== _m[oo] && g("Unexpected Fiber popped."), e.current = oy[oo], oy[oo] = null, _m[oo] = null, oo--;
    }
    function Oi(e, t, s) {
      oo++, oy[oo] = e.current, _m[oo] = s, e.current = t;
    }
    var ly;
    ly = {};
    var mr = {};
    Object.freeze(mr);
    var lo = cu(mr), ls = cu(!1), uy = mr;
    function Jc(e, t, s) {
      return s && us(t) ? uy : lo.current;
    }
    function Ix(e, t, s) {
      {
        var u = e.stateNode;
        u.__reactInternalMemoizedUnmaskedChildContext = t, u.__reactInternalMemoizedMaskedChildContext = s;
      }
    }
    function qc(e, t) {
      {
        var s = e.type, u = s.contextTypes;
        if (!u)
          return mr;
        var d = e.stateNode;
        if (d && d.__reactInternalMemoizedUnmaskedChildContext === t)
          return d.__reactInternalMemoizedMaskedChildContext;
        var p = {};
        for (var y in u)
          p[y] = t[y];
        {
          var b = Te(s) || "Unknown";
          l(u, p, "context", b, ft);
        }
        return d && Ix(e, t, p), p;
      }
    }
    function Pm() {
      return ls.current;
    }
    function us(e) {
      {
        var t = e.childContextTypes;
        return t != null;
      }
    }
    function zm(e) {
      zi(ls, e), zi(lo, e);
    }
    function cy(e) {
      zi(ls, e), zi(lo, e);
    }
    function Ax(e, t, s) {
      {
        if (lo.current !== mr)
          throw Error("Unexpected context found on stack. This error is likely caused by a bug in React. Please file an issue.");
        Oi(lo, t, e), Oi(ls, s, e);
      }
    }
    function Rx(e, t, s) {
      {
        var u = e.stateNode, d = t.childContextTypes;
        if (typeof u.getChildContext != "function") {
          {
            var p = Te(t) || "Unknown";
            ly[p] || (ly[p] = !0, g("%s.childContextTypes is specified but there is no getChildContext() method on the instance. You can either define getChildContext() on %s or remove childContextTypes from it.", p, p));
          }
          return s;
        }
        var y;
        ss(e, "getChildContext"), y = u.getChildContext(), os();
        for (var b in y)
          if (!(b in d))
            throw Error((Te(t) || "Unknown") + '.getChildContext(): key "' + b + '" is not defined in childContextTypes.');
        {
          var E = Te(t) || "Unknown";
          l(
            d,
            y,
            "child context",
            E,
            ft
          );
        }
        return n({}, s, {}, y);
      }
    }
    function Om(e) {
      {
        var t = e.stateNode, s = t && t.__reactInternalMemoizedMergedChildContext || mr;
        return uy = lo.current, Oi(lo, s, e), Oi(ls, ls.current, e), !0;
      }
    }
    function Dx(e, t, s) {
      {
        var u = e.stateNode;
        if (!u)
          throw Error("Expected to have an instance by this point. This error is likely caused by a bug in React. Please file an issue.");
        if (s) {
          var d = Rx(e, t, uy);
          u.__reactInternalMemoizedMergedChildContext = d, zi(ls, e), zi(lo, e), Oi(lo, d, e), Oi(ls, s, e);
        } else
          zi(ls, e), Oi(ls, s, e);
      }
    }
    function PA(e) {
      {
        if (!(Wa(e) && e.tag === ce))
          throw Error("Expected subtree parent to be a mounted class component. This error is likely caused by a bug in React. Please file an issue.");
        var t = e;
        do {
          switch (t.tag) {
            case Se:
              return t.stateNode.context;
            case ce: {
              var s = t.type;
              if (us(s))
                return t.stateNode.__reactInternalMemoizedMergedChildContext;
              break;
            }
          }
          t = t.return;
        } while (t !== null);
        throw Error("Found unexpected detached subtree parent. This error is likely caused by a bug in React. Please file an issue.");
      }
    }
    var Nx = 0, zA = 1, OA = 2, LA = o.unstable_runWithPriority, dy = o.unstable_scheduleCallback, kx = o.unstable_cancelCallback, BA = o.unstable_shouldYield, _x = o.unstable_requestPaint, fy = o.unstable_now, jA = o.unstable_getCurrentPriorityLevel, Lm = o.unstable_ImmediatePriority, Px = o.unstable_UserBlockingPriority, zx = o.unstable_NormalPriority, Ox = o.unstable_LowPriority, Lx = o.unstable_IdlePriority;
    if (!(h.__interactionsRef != null && h.__interactionsRef.current != null))
      throw Error("It is not supported to run the profiling version of a renderer (for example, `react-dom/profiling`) without also replacing the `scheduler/tracing` module with `scheduler/tracing-profiling`. Your bundler might have a setting for aliasing both modules. Learn more at http://fb.me/react-profiling");
    var Bx = {}, Li = 99, Yo = 98, ha = 97, hy = 96, hh = 95, Kc = 90, VA = BA, UA = _x !== void 0 ? _x : function() {
    }, uo = null, Bm = null, py = !1, jx = fy(), vr = jx < 1e4 ? fy : function() {
      return fy() - jx;
    };
    function ed() {
      switch (jA()) {
        case Lm:
          return Li;
        case Px:
          return Yo;
        case zx:
          return ha;
        case Ox:
          return hy;
        case Lx:
          return hh;
        default:
          throw Error("Unknown priority level.");
      }
    }
    function Vx(e) {
      switch (e) {
        case Li:
          return Lm;
        case Yo:
          return Px;
        case ha:
          return zx;
        case hy:
          return Ox;
        case hh:
          return Lx;
        default:
          throw Error("Unknown priority level.");
      }
    }
    function co(e, t) {
      var s = Vx(e);
      return LA(s, t);
    }
    function ph(e, t, s) {
      var u = Vx(e);
      return dy(u, t, s);
    }
    function Ux(e) {
      return uo === null ? (uo = [e], Bm = dy(Lm, Hx)) : uo.push(e), Bx;
    }
    function HA(e) {
      e !== Bx && kx(e);
    }
    function cs() {
      if (Bm !== null) {
        var e = Bm;
        Bm = null, kx(e);
      }
      Hx();
    }
    function Hx() {
      if (!py && uo !== null) {
        py = !0;
        var e = 0;
        try {
          var t = !0, s = uo;
          co(Li, function() {
            for (; e < s.length; e++) {
              var u = s[e];
              do
                u = u(t);
              while (u !== null);
            }
          }), uo = null;
        } catch (u) {
          throw uo !== null && (uo = uo.slice(e + 1)), dy(Lm, cs), u;
        } finally {
          py = !1;
        }
      }
    }
    var oi = 0, yn = 1, Hr = 2, td = 4, ds = 8, mh = 1073741823, Ae = 0, fs = 1, du = 2, Wx = 3, Ct = mh, Fx = Ct - 1, jm = 10, Vm = Fx - 1;
    function my(e) {
      return Vm - (e / jm | 0);
    }
    function fu(e) {
      return (Vm - e) * jm;
    }
    function WA(e, t) {
      return ((e / t | 0) + 1) * t;
    }
    function vy(e, t, s) {
      return Vm - WA(Vm - e + t / jm, s / jm);
    }
    var vh = 5e3, gy = 250;
    function FA(e) {
      return vy(e, vh, gy);
    }
    function $A(e, t) {
      return vy(e, t, gy);
    }
    var $x = 500, Qx = 100;
    function Zx(e) {
      return vy(e, $x, Qx);
    }
    function Yx(e, t) {
      if (t === Ct)
        return Li;
      if (t === fs || t === du)
        return hh;
      var s = fu(t) - fu(e);
      return s <= 0 ? Li : s <= $x + Qx ? Yo : s <= vh + gy ? ha : hh;
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
      var QA = function(e) {
        for (var t = null, s = e; s !== null; )
          s.mode & yn && (t = s), s = s.return;
        return t;
      }, hu = function(e) {
        var t = [];
        return e.forEach(function(s) {
          t.push(s);
        }), t.sort().join(", ");
      }, gh = [], yh = [], wh = [], bh = [], Sh = [], xh = [], pu = /* @__PURE__ */ new Set();
      pa.recordUnsafeLifecycleWarnings = function(e, t) {
        pu.has(e.type) || (typeof t.componentWillMount == "function" && t.componentWillMount.__suppressDeprecationWarning !== !0 && gh.push(e), e.mode & yn && typeof t.UNSAFE_componentWillMount == "function" && yh.push(e), typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps.__suppressDeprecationWarning !== !0 && wh.push(e), e.mode & yn && typeof t.UNSAFE_componentWillReceiveProps == "function" && bh.push(e), typeof t.componentWillUpdate == "function" && t.componentWillUpdate.__suppressDeprecationWarning !== !0 && Sh.push(e), e.mode & yn && typeof t.UNSAFE_componentWillUpdate == "function" && xh.push(e));
      }, pa.flushPendingUnsafeLifecycleWarnings = function() {
        var e = /* @__PURE__ */ new Set();
        gh.length > 0 && (gh.forEach(function(L) {
          e.add(Te(L.type) || "Component"), pu.add(L.type);
        }), gh = []);
        var t = /* @__PURE__ */ new Set();
        yh.length > 0 && (yh.forEach(function(L) {
          t.add(Te(L.type) || "Component"), pu.add(L.type);
        }), yh = []);
        var s = /* @__PURE__ */ new Set();
        wh.length > 0 && (wh.forEach(function(L) {
          s.add(Te(L.type) || "Component"), pu.add(L.type);
        }), wh = []);
        var u = /* @__PURE__ */ new Set();
        bh.length > 0 && (bh.forEach(function(L) {
          u.add(Te(L.type) || "Component"), pu.add(L.type);
        }), bh = []);
        var d = /* @__PURE__ */ new Set();
        Sh.length > 0 && (Sh.forEach(function(L) {
          d.add(Te(L.type) || "Component"), pu.add(L.type);
        }), Sh = []);
        var p = /* @__PURE__ */ new Set();
        if (xh.length > 0 && (xh.forEach(function(L) {
          p.add(Te(L.type) || "Component"), pu.add(L.type);
        }), xh = []), t.size > 0) {
          var y = hu(t);
          g(`Using UNSAFE_componentWillMount in strict mode is not recommended and may indicate bugs in your code. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move code with side effects to componentDidMount, and set initial state in the constructor.

Please update the following components: %s`, y);
        }
        if (u.size > 0) {
          var b = hu(u);
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
          w(`componentWillMount has been renamed, and is not recommended for use. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move code with side effects to componentDidMount, and set initial state in the constructor.
* Rename componentWillMount to UNSAFE_componentWillMount to suppress this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: %s`, N);
        }
        if (s.size > 0) {
          var k = hu(s);
          w(`componentWillReceiveProps has been renamed, and is not recommended for use. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move data fetching code or side effects to componentDidUpdate.
* If you're updating state whenever props change, refactor your code to use memoization techniques or move it to static getDerivedStateFromProps. Learn more at: https://fb.me/react-derived-state
* Rename componentWillReceiveProps to UNSAFE_componentWillReceiveProps to suppress this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: %s`, k);
        }
        if (d.size > 0) {
          var J = hu(d);
          w(`componentWillUpdate has been renamed, and is not recommended for use. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move data fetching code or side effects to componentDidUpdate.
* Rename componentWillUpdate to UNSAFE_componentWillUpdate to suppress this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: %s`, J);
        }
      };
      var Um = /* @__PURE__ */ new Map(), Gx = /* @__PURE__ */ new Set();
      pa.recordLegacyContextWarning = function(e, t) {
        var s = QA(e);
        if (s === null) {
          g("Expected to find a StrictMode component in a strict mode tree. This error is likely caused by a bug in React. Please file an issue.");
          return;
        }
        if (!Gx.has(e.type)) {
          var u = Um.get(s);
          (e.type.contextTypes != null || e.type.childContextTypes != null || t !== null && typeof t.getChildContext == "function") && (u === void 0 && (u = [], Um.set(s, u)), u.push(e));
        }
      }, pa.flushLegacyContextWarning = function() {
        Um.forEach(function(e, t) {
          if (e.length !== 0) {
            var s = e[0], u = /* @__PURE__ */ new Set();
            e.forEach(function(y) {
              u.add(Te(y.type) || "Component"), Gx.add(y.type);
            });
            var d = hu(u), p = $n(s);
            g(`Legacy context API has been detected within a strict-mode tree.

The old API will be supported in all 16.x releases, but applications using it should migrate to the new version.

Please update the following components: %s

Learn more about this warning here: https://fb.me/react-legacy-context%s`, d, p);
          }
        });
      }, pa.discardPendingWarnings = function() {
        gh = [], yh = [], wh = [], bh = [], Sh = [], xh = [], Um = /* @__PURE__ */ new Map();
      };
    }
    var Wr = null, nd = null, ZA = function(e) {
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
    function yy(e) {
      return id(e);
    }
    function wy(e) {
      {
        if (Wr === null)
          return e;
        var t = Wr(e);
        if (t === void 0) {
          if (e != null && typeof e.render == "function") {
            var s = id(e.render);
            if (e.render !== s) {
              var u = {
                $$typeof: ni,
                render: s
              };
              return e.displayName !== void 0 && (u.displayName = e.displayName), u;
            }
          }
          return e;
        }
        return t.current;
      }
    }
    function Xx(e, t) {
      {
        if (Wr === null)
          return !1;
        var s = e.elementType, u = t.type, d = !1, p = typeof u == "object" && u !== null ? u.$$typeof : null;
        switch (e.tag) {
          case ce: {
            typeof u == "function" && (d = !0);
            break;
          }
          case Oe: {
            (typeof u == "function" || p === ir) && (d = !0);
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
          var y = Wr(s);
          if (y !== void 0 && y === Wr(u))
            return !0;
        }
        return !1;
      }
    }
    function Jx(e) {
      {
        if (Wr === null || typeof WeakSet != "function")
          return;
        nd === null && (nd = /* @__PURE__ */ new WeakSet()), nd.add(e);
      }
    }
    var YA = function(e, t) {
      {
        if (Wr === null)
          return;
        var s = t.staleFamilies, u = t.updatedFamilies;
        tl(), SC(function() {
          by(e.current, u, s);
        });
      }
    }, GA = function(e, t) {
      {
        if (e.context !== mr)
          return;
        tl(), SR(function() {
          Uh(t, e, null, null);
        });
      }
    };
    function by(e, t, s) {
      {
        var u = e.alternate, d = e.child, p = e.sibling, y = e.tag, b = e.type, E = null;
        switch (y) {
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
          J !== void 0 && (s.has(J) ? k = !0 : t.has(J) && (y === ce ? k = !0 : N = !0));
        }
        nd !== null && (nd.has(e) || u !== null && nd.has(u)) && (k = !0), k && (e._debugNeedsRemount = !0), (k || N) && Zr(e, Ct), d !== null && !k && by(d, t, s), p !== null && by(p, t, s);
      }
    }
    var XA = function(e, t) {
      {
        var s = /* @__PURE__ */ new Set(), u = new Set(t.map(function(d) {
          return d.current;
        }));
        return Sy(e.current, u, s), s;
      }
    };
    function Sy(e, t, s) {
      {
        var u = e.child, d = e.sibling, p = e.tag, y = e.type, b = null;
        switch (p) {
          case Oe:
          case ge:
          case ce:
            b = y;
            break;
          case D:
            b = y.render;
            break;
        }
        var E = !1;
        b !== null && t.has(b) && (E = !0), E ? JA(e, s) : u !== null && Sy(u, t, s), d !== null && Sy(d, t, s);
      }
    }
    function JA(e, t) {
      {
        var s = qA(e, t);
        if (s)
          return;
        for (var u = e; ; ) {
          switch (u.tag) {
            case Re:
              t.add(u.stateNode);
              return;
            case He:
              t.add(u.stateNode.containerInfo);
              return;
            case Se:
              t.add(u.stateNode.containerInfo);
              return;
          }
          if (u.return === null)
            throw new Error("Expected to reach root first.");
          u = u.return;
        }
      }
    }
    function qA(e, t) {
      for (var s = e, u = !1; ; ) {
        if (s.tag === Re)
          u = !0, t.add(s.stateNode);
        else if (s.child !== null) {
          s.child.return = s, s = s.child;
          continue;
        }
        if (s === e)
          return u;
        for (; s.sibling === null; ) {
          if (s.return === null || s.return === e)
            return u;
          s = s.return;
        }
        s.sibling.return = s.return, s = s.sibling;
      }
      return !1;
    }
    function ma(e, t) {
      if (e && e.defaultProps) {
        var s = n({}, t), u = e.defaultProps;
        for (var d in u)
          s[d] === void 0 && (s[d] = u[d]);
        return s;
      }
      return t;
    }
    function KA(e) {
      if (yp(e), e._status !== Rs)
        throw e._result;
      return e._result;
    }
    var xy = cu(null), Cy;
    Cy = {};
    var Hm = null, rd = null, Wm = null, Fm = !1;
    function $m() {
      Hm = null, rd = null, Wm = null, Fm = !1;
    }
    function qx() {
      Fm = !0;
    }
    function Kx() {
      Fm = !1;
    }
    function e0(e, t) {
      var s = e.type._context;
      Oi(xy, s._currentValue, e), s._currentValue = t, s._currentRenderer !== void 0 && s._currentRenderer !== null && s._currentRenderer !== Cy && g("Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported."), s._currentRenderer = Cy;
    }
    function Ty(e) {
      var t = xy.current;
      zi(xy, e);
      var s = e.type._context;
      s._currentValue = t;
    }
    function e1(e, t, s) {
      if (ou(s, t))
        return 0;
      var u = typeof e._calculateChangedBits == "function" ? e._calculateChangedBits(s, t) : mh;
      return (u & mh) !== u && g("calculateChangedBits: Expected the return value to be a 31-bit integer. Instead received: %s", u), u | 0;
    }
    function t0(e, t) {
      for (var s = e; s !== null; ) {
        var u = s.alternate;
        if (s.childExpirationTime < t)
          s.childExpirationTime = t, u !== null && u.childExpirationTime < t && (u.childExpirationTime = t);
        else if (u !== null && u.childExpirationTime < t)
          u.childExpirationTime = t;
        else
          break;
        s = s.return;
      }
    }
    function t1(e, t, s, u) {
      var d = e.child;
      for (d !== null && (d.return = e); d !== null; ) {
        var p = void 0, y = d.dependencies;
        if (y !== null) {
          p = d.child;
          for (var b = y.firstContext; b !== null; ) {
            if (b.context === t && (b.observedBits & s) !== 0) {
              if (d.tag === ce) {
                var E = Go(u, null);
                E.tag = Qm, Xo(d, E);
              }
              d.expirationTime < u && (d.expirationTime = u);
              var N = d.alternate;
              N !== null && N.expirationTime < u && (N.expirationTime = u), t0(d.return, u), y.expirationTime < u && (y.expirationTime = u);
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
        var u = s.firstContext;
        u !== null && (s.expirationTime >= t && Rw(), s.firstContext = null);
      }
    }
    function Bn(e, t) {
      if (Fm && g("Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo()."), Wm !== e) {
        if (!(t === !1 || t === 0)) {
          var s;
          typeof t != "number" || t === mh ? (Wm = e, s = mh) : s = t;
          var u = {
            context: e,
            observedBits: s,
            next: null
          };
          if (rd === null) {
            if (Hm === null)
              throw Error("Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo().");
            rd = u, Hm.dependencies = {
              expirationTime: Ae,
              firstContext: u,
              responders: null
            };
          } else
            rd = rd.next = u;
        }
      }
      return e._currentValue;
    }
    var n0 = 0, i0 = 1, Qm = 2, My = 3, Zm = !1, Ey, Ym;
    Ey = !1, Ym = null;
    function Iy(e) {
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
    function Ay(e, t) {
      var s = t.updateQueue, u = e.updateQueue;
      if (s === u) {
        var d = {
          baseState: u.baseState,
          baseQueue: u.baseQueue,
          shared: u.shared,
          effects: u.effects
        };
        t.updateQueue = d;
      }
    }
    function Go(e, t) {
      var s = {
        expirationTime: e,
        suspenseConfig: t,
        tag: n0,
        payload: null,
        callback: null,
        next: null
      };
      return s.next = s, s.priority = ed(), s;
    }
    function Xo(e, t) {
      var s = e.updateQueue;
      if (s !== null) {
        var u = s.shared, d = u.pending;
        d === null ? t.next = t : (t.next = d.next, d.next = t), u.pending = t, Ym === u && !Ey && (g("An update (setState, replaceState, or forceUpdate) was scheduled from inside an update function. Update functions should be pure, with zero side-effects. Consider using componentDidUpdate or a callback."), Ey = !0);
      }
    }
    function r0(e, t) {
      var s = e.alternate;
      s !== null && Ay(s, e);
      var u = e.updateQueue, d = u.baseQueue;
      d === null ? (u.baseQueue = t.next = t, t.next = t) : (t.next = d.next, d.next = t);
    }
    function n1(e, t, s, u, d, p) {
      switch (s.tag) {
        case i0: {
          var y = s.payload;
          if (typeof y == "function") {
            qx(), e.mode & yn && y.call(p, u, d);
            var b = y.call(p, u, d);
            return Kx(), b;
          }
          return y;
        }
        case My:
          e.effectTag = e.effectTag & ~mi | Vt;
        case n0: {
          var E = s.payload, N;
          return typeof E == "function" ? (qx(), e.mode & yn && E.call(p, u, d), N = E.call(p, u, d), Kx()) : N = E, N == null ? u : n({}, u, N);
        }
        case Qm:
          return Zm = !0, u;
      }
      return u;
    }
    function Ch(e, t, s, u) {
      var d = e.updateQueue;
      Zm = !1, Ym = d.shared;
      var p = d.baseQueue, y = d.shared.pending;
      if (y !== null) {
        if (p !== null) {
          var b = p.next, E = y.next;
          p.next = E, y.next = b;
        }
        p = y, d.shared.pending = null;
        var N = e.alternate;
        if (N !== null) {
          var k = N.updateQueue;
          k !== null && (k.baseQueue = y);
        }
      }
      if (p !== null) {
        var J = p.next, L = d.baseState, K = Ae, me = null, we = null, Ke = null;
        if (J !== null) {
          var nt = J;
          do {
            var Pt = nt.expirationTime;
            if (Pt < u) {
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
              MC(Pt, nt.suspenseConfig), L = n1(e, d, nt, L, t, s);
              var $ = nt.callback;
              if ($ !== null) {
                e.effectTag |= bf;
                var te = d.effects;
                te === null ? d.effects = [nt] : te.push(nt);
              }
            }
            if (nt = nt.next, nt === null || nt === J) {
              if (y = d.shared.pending, y === null)
                break;
              nt = p.next = y.next, y.next = J, d.baseQueue = p = y, d.shared.pending = null;
            }
          } while (!0);
        }
        Ke === null ? me = L : Ke.next = we, d.baseState = me, d.baseQueue = Ke, Ov(K), e.expirationTime = K, e.memoizedState = L;
      }
      Ym = null;
    }
    function i1(e, t) {
      if (typeof e != "function")
        throw Error("Invalid argument passed as callback. Expected a function. Instead received: " + e);
      e.call(t);
    }
    function a0() {
      Zm = !1;
    }
    function Gm() {
      return Zm;
    }
    function s0(e, t, s) {
      var u = t.effects;
      if (t.effects = null, u !== null)
        for (var d = 0; d < u.length; d++) {
          var p = u[d], y = p.callback;
          y !== null && (p.callback = null, i1(y, s));
        }
    }
    var r1 = m.ReactCurrentBatchConfig;
    function Th() {
      return r1.suspense;
    }
    var Ry = {}, a1 = Array.isArray, o0 = new r.Component().refs, Dy, Ny, ky, _y, Py, l0, Xm, zy, Oy, Ly;
    {
      Dy = /* @__PURE__ */ new Set(), Ny = /* @__PURE__ */ new Set(), ky = /* @__PURE__ */ new Set(), _y = /* @__PURE__ */ new Set(), zy = /* @__PURE__ */ new Set(), Py = /* @__PURE__ */ new Set(), Oy = /* @__PURE__ */ new Set(), Ly = /* @__PURE__ */ new Set();
      var u0 = /* @__PURE__ */ new Set();
      Xm = function(e, t) {
        if (!(e === null || typeof e == "function")) {
          var s = t + "_" + e;
          u0.has(s) || (u0.add(s), g("%s(...): Expected the last optional `callback` argument to be a function. Instead received: %s.", t, e));
        }
      }, l0 = function(e, t) {
        if (t === void 0) {
          var s = Te(e) || "Component";
          Py.has(s) || (Py.add(s), g("%s.getDerivedStateFromProps(): A valid state object (or null) must be returned. You have returned undefined.", s));
        }
      }, Object.defineProperty(Ry, "_processChildContext", {
        enumerable: !1,
        value: function() {
          throw Error("_processChildContext is not available in React 16+. This likely means you have multiple copies of React and are attempting to nest a React 15 tree inside a React 16 tree using unstable_renderSubtreeIntoContainer, which isn't supported. Try to make sure you have only one copy of React (and ideally, switch to ReactDOM.createPortal).");
        }
      }), Object.freeze(Ry);
    }
    function Jm(e, t, s, u) {
      var d = e.memoizedState;
      e.mode & yn && s(u, d);
      var p = s(u, d);
      l0(t, p);
      var y = p == null ? d : n({}, d, p);
      if (e.memoizedState = y, e.expirationTime === Ae) {
        var b = e.updateQueue;
        b.baseState = y;
      }
    }
    var By = {
      isMounted: Fa,
      enqueueSetState: function(e, t, s) {
        var u = ua(e), d = ms(), p = Th(), y = Cu(d, u, p), b = Go(y, p);
        b.payload = t, s != null && (Xm(s, "setState"), b.callback = s), Xo(u, b), Zr(u, y);
      },
      enqueueReplaceState: function(e, t, s) {
        var u = ua(e), d = ms(), p = Th(), y = Cu(d, u, p), b = Go(y, p);
        b.tag = i0, b.payload = t, s != null && (Xm(s, "replaceState"), b.callback = s), Xo(u, b), Zr(u, y);
      },
      enqueueForceUpdate: function(e, t) {
        var s = ua(e), u = ms(), d = Th(), p = Cu(u, s, d), y = Go(p, d);
        y.tag = Qm, t != null && (Xm(t, "forceUpdate"), y.callback = t), Xo(s, y), Zr(s, p);
      }
    };
    function c0(e, t, s, u, d, p, y) {
      var b = e.stateNode;
      if (typeof b.shouldComponentUpdate == "function") {
        e.mode & yn && b.shouldComponentUpdate(u, p, y), ss(e, "shouldComponentUpdate");
        var E = b.shouldComponentUpdate(u, p, y);
        return os(), E === void 0 && g("%s.shouldComponentUpdate(): Returned undefined instead of a boolean value. Make sure to return true or false.", Te(t) || "Component"), E;
      }
      return t.prototype && t.prototype.isPureReactComponent ? !ch(s, u) || !ch(d, p) : !0;
    }
    function s1(e, t, s) {
      var u = e.stateNode;
      {
        var d = Te(t) || "Component", p = u.render;
        p || (t.prototype && typeof t.prototype.render == "function" ? g("%s(...): No `render` method found on the returned component instance: did you accidentally return an object from the constructor?", d) : g("%s(...): No `render` method found on the returned component instance: you may have forgotten to define `render`.", d)), u.getInitialState && !u.getInitialState.isReactClassApproved && !u.state && g("getInitialState was defined on %s, a plain JavaScript class. This is only supported for classes created using React.createClass. Did you mean to define a state property instead?", d), u.getDefaultProps && !u.getDefaultProps.isReactClassApproved && g("getDefaultProps was defined on %s, a plain JavaScript class. This is only supported for classes created using React.createClass. Use a static property to define defaultProps instead.", d), u.propTypes && g("propTypes was defined as an instance property on %s. Use a static property to define propTypes instead.", d), u.contextType && g("contextType was defined as an instance property on %s. Use a static property to define contextType instead.", d), u.contextTypes && g("contextTypes was defined as an instance property on %s. Use a static property to define contextTypes instead.", d), t.contextType && t.contextTypes && !Oy.has(t) && (Oy.add(t), g("%s declares both contextTypes and contextType static properties. The legacy contextTypes property will be ignored.", d)), typeof u.componentShouldUpdate == "function" && g("%s has a method called componentShouldUpdate(). Did you mean shouldComponentUpdate()? The name is phrased as a question because the function is expected to return a value.", d), t.prototype && t.prototype.isPureReactComponent && typeof u.shouldComponentUpdate < "u" && g("%s has a method called shouldComponentUpdate(). shouldComponentUpdate should not be used when extending React.PureComponent. Please extend React.Component if shouldComponentUpdate is used.", Te(t) || "A pure component"), typeof u.componentDidUnmount == "function" && g("%s has a method called componentDidUnmount(). But there is no such lifecycle method. Did you mean componentWillUnmount()?", d), typeof u.componentDidReceiveProps == "function" && g("%s has a method called componentDidReceiveProps(). But there is no such lifecycle method. If you meant to update the state in response to changing props, use componentWillReceiveProps(). If you meant to fetch data or run side-effects or mutations after React has updated the UI, use componentDidUpdate().", d), typeof u.componentWillRecieveProps == "function" && g("%s has a method called componentWillRecieveProps(). Did you mean componentWillReceiveProps()?", d), typeof u.UNSAFE_componentWillRecieveProps == "function" && g("%s has a method called UNSAFE_componentWillRecieveProps(). Did you mean UNSAFE_componentWillReceiveProps()?", d);
        var y = u.props !== s;
        u.props !== void 0 && y && g("%s(...): When calling super() in `%s`, make sure to pass up the same props that your component's constructor was passed.", d, d), u.defaultProps && g("Setting defaultProps as an instance property on %s is not supported and will be ignored. Instead, define defaultProps as a static property on %s.", d, d), typeof u.getSnapshotBeforeUpdate == "function" && typeof u.componentDidUpdate != "function" && !ky.has(t) && (ky.add(t), g("%s: getSnapshotBeforeUpdate() should be used with componentDidUpdate(). This component defines getSnapshotBeforeUpdate() only.", Te(t))), typeof u.getDerivedStateFromProps == "function" && g("%s: getDerivedStateFromProps() is defined as an instance method and will be ignored. Instead, declare it as a static method.", d), typeof u.getDerivedStateFromError == "function" && g("%s: getDerivedStateFromError() is defined as an instance method and will be ignored. Instead, declare it as a static method.", d), typeof t.getSnapshotBeforeUpdate == "function" && g("%s: getSnapshotBeforeUpdate() is defined as a static method and will be ignored. Instead, declare it as an instance method.", d);
        var b = u.state;
        b && (typeof b != "object" || a1(b)) && g("%s.state: must be set to an object or null", d), typeof u.getChildContext == "function" && typeof t.childContextTypes != "object" && g("%s.getChildContext(): childContextTypes must be defined in order to use getChildContext().", d);
      }
    }
    function d0(e, t) {
      t.updater = By, e.stateNode = t, Pp(t, e), t._reactInternalInstance = Ry;
    }
    function f0(e, t, s) {
      var u = !1, d = mr, p = mr, y = t.contextType;
      if ("contextType" in t) {
        var b = y === null || y !== void 0 && y.$$typeof === xn && y._context === void 0;
        if (!b && !Ly.has(t)) {
          Ly.add(t);
          var E = "";
          y === void 0 ? E = " However, it is set to undefined. This can be caused by a typo or by mixing up named and default imports. This can also happen due to a circular dependency, so try moving the createContext() call to a separate file." : typeof y != "object" ? E = " However, it is set to a " + typeof y + "." : y.$$typeof === gn ? E = " Did you accidentally pass the Context.Provider instead?" : y._context !== void 0 ? E = " Did you accidentally pass the Context.Consumer instead?" : E = " However, it is set to an object with keys {" + Object.keys(y).join(", ") + "}.", g("%s defines an invalid contextType. contextType should point to the Context object returned by React.createContext().%s", Te(t) || "Component", E);
        }
      }
      if (typeof y == "object" && y !== null)
        p = Bn(y);
      else {
        d = Jc(e, t, !0);
        var N = t.contextTypes;
        u = N != null, p = u ? qc(e, d) : mr;
      }
      e.mode & yn && new t(s, p);
      var k = new t(s, p), J = e.memoizedState = k.state !== null && k.state !== void 0 ? k.state : null;
      d0(e, k);
      {
        if (typeof t.getDerivedStateFromProps == "function" && J === null) {
          var L = Te(t) || "Component";
          Ny.has(L) || (Ny.add(L), g("`%s` uses `getDerivedStateFromProps` but its initial state is %s. This is not recommended. Instead, define the initial state by assigning an object to `this.state` in the constructor of `%s`. This ensures that `getDerivedStateFromProps` arguments have a consistent shape.", L, k.state === null ? "null" : "undefined", L));
        }
        if (typeof t.getDerivedStateFromProps == "function" || typeof k.getSnapshotBeforeUpdate == "function") {
          var K = null, me = null, we = null;
          if (typeof k.componentWillMount == "function" && k.componentWillMount.__suppressDeprecationWarning !== !0 ? K = "componentWillMount" : typeof k.UNSAFE_componentWillMount == "function" && (K = "UNSAFE_componentWillMount"), typeof k.componentWillReceiveProps == "function" && k.componentWillReceiveProps.__suppressDeprecationWarning !== !0 ? me = "componentWillReceiveProps" : typeof k.UNSAFE_componentWillReceiveProps == "function" && (me = "UNSAFE_componentWillReceiveProps"), typeof k.componentWillUpdate == "function" && k.componentWillUpdate.__suppressDeprecationWarning !== !0 ? we = "componentWillUpdate" : typeof k.UNSAFE_componentWillUpdate == "function" && (we = "UNSAFE_componentWillUpdate"), K !== null || me !== null || we !== null) {
            var Ke = Te(t) || "Component", nt = typeof t.getDerivedStateFromProps == "function" ? "getDerivedStateFromProps()" : "getSnapshotBeforeUpdate()";
            _y.has(Ke) || (_y.add(Ke), g(`Unsafe legacy lifecycles will not be called for components using new component APIs.

%s uses %s but also contains the following legacy lifecycles:%s%s%s

The above lifecycles should be removed. Learn more about this warning here:
https://fb.me/react-unsafe-component-lifecycles`, Ke, nt, K !== null ? `
  ` + K : "", me !== null ? `
  ` + me : "", we !== null ? `
  ` + we : ""));
          }
        }
      }
      return u && Ix(e, d, p), k;
    }
    function o1(e, t) {
      ss(e, "componentWillMount");
      var s = t.state;
      typeof t.componentWillMount == "function" && t.componentWillMount(), typeof t.UNSAFE_componentWillMount == "function" && t.UNSAFE_componentWillMount(), os(), s !== t.state && (g("%s.componentWillMount(): Assigning directly to this.state is deprecated (except inside a component's constructor). Use setState instead.", Te(e.type) || "Component"), By.enqueueReplaceState(t, t.state, null));
    }
    function h0(e, t, s, u) {
      var d = t.state;
      if (ss(e, "componentWillReceiveProps"), typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(s, u), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(s, u), os(), t.state !== d) {
        {
          var p = Te(e.type) || "Component";
          Dy.has(p) || (Dy.add(p), g("%s.componentWillReceiveProps(): Assigning directly to this.state is deprecated (except inside a component's constructor). Use setState instead.", p));
        }
        By.enqueueReplaceState(t, t.state, null);
      }
    }
    function jy(e, t, s, u) {
      s1(e, t, s);
      var d = e.stateNode;
      d.props = s, d.state = e.memoizedState, d.refs = o0, Iy(e);
      var p = t.contextType;
      if (typeof p == "object" && p !== null)
        d.context = Bn(p);
      else {
        var y = Jc(e, t, !0);
        d.context = qc(e, y);
      }
      {
        if (d.state === s) {
          var b = Te(t) || "Component";
          zy.has(b) || (zy.add(b), g("%s: It is not recommended to assign props directly to state because updates to props won't be reflected in state. In most cases, it is better to use props directly.", b));
        }
        e.mode & yn && pa.recordLegacyContextWarning(e, d), pa.recordUnsafeLifecycleWarnings(e, d);
      }
      Ch(e, s, d, u), d.state = e.memoizedState;
      var E = t.getDerivedStateFromProps;
      typeof E == "function" && (Jm(e, t, E, s), d.state = e.memoizedState), typeof t.getDerivedStateFromProps != "function" && typeof d.getSnapshotBeforeUpdate != "function" && (typeof d.UNSAFE_componentWillMount == "function" || typeof d.componentWillMount == "function") && (o1(e, d), Ch(e, s, d, u), d.state = e.memoizedState), typeof d.componentDidMount == "function" && (e.effectTag |= xt);
    }
    function l1(e, t, s, u) {
      var d = e.stateNode, p = e.memoizedProps;
      d.props = p;
      var y = d.context, b = t.contextType, E = mr;
      if (typeof b == "object" && b !== null)
        E = Bn(b);
      else {
        var N = Jc(e, t, !0);
        E = qc(e, N);
      }
      var k = t.getDerivedStateFromProps, J = typeof k == "function" || typeof d.getSnapshotBeforeUpdate == "function";
      !J && (typeof d.UNSAFE_componentWillReceiveProps == "function" || typeof d.componentWillReceiveProps == "function") && (p !== s || y !== E) && h0(e, d, s, E), a0();
      var L = e.memoizedState, K = d.state = L;
      if (Ch(e, s, d, u), K = e.memoizedState, p === s && L === K && !Pm() && !Gm())
        return typeof d.componentDidMount == "function" && (e.effectTag |= xt), !1;
      typeof k == "function" && (Jm(e, t, k, s), K = e.memoizedState);
      var me = Gm() || c0(e, t, p, s, L, K, E);
      return me ? (!J && (typeof d.UNSAFE_componentWillMount == "function" || typeof d.componentWillMount == "function") && (ss(e, "componentWillMount"), typeof d.componentWillMount == "function" && d.componentWillMount(), typeof d.UNSAFE_componentWillMount == "function" && d.UNSAFE_componentWillMount(), os()), typeof d.componentDidMount == "function" && (e.effectTag |= xt)) : (typeof d.componentDidMount == "function" && (e.effectTag |= xt), e.memoizedProps = s, e.memoizedState = K), d.props = s, d.state = K, d.context = E, me;
    }
    function u1(e, t, s, u, d) {
      var p = t.stateNode;
      Ay(e, t);
      var y = t.memoizedProps;
      p.props = t.type === t.elementType ? y : ma(t.type, y);
      var b = p.context, E = s.contextType, N = mr;
      if (typeof E == "object" && E !== null)
        N = Bn(E);
      else {
        var k = Jc(t, s, !0);
        N = qc(t, k);
      }
      var J = s.getDerivedStateFromProps, L = typeof J == "function" || typeof p.getSnapshotBeforeUpdate == "function";
      !L && (typeof p.UNSAFE_componentWillReceiveProps == "function" || typeof p.componentWillReceiveProps == "function") && (y !== u || b !== N) && h0(t, p, u, N), a0();
      var K = t.memoizedState, me = p.state = K;
      if (Ch(t, u, p, d), me = t.memoizedState, y === u && K === me && !Pm() && !Gm())
        return typeof p.componentDidUpdate == "function" && (y !== e.memoizedProps || K !== e.memoizedState) && (t.effectTag |= xt), typeof p.getSnapshotBeforeUpdate == "function" && (y !== e.memoizedProps || K !== e.memoizedState) && (t.effectTag |= Ua), !1;
      typeof J == "function" && (Jm(t, s, J, u), me = t.memoizedState);
      var we = Gm() || c0(t, s, y, u, K, me, N);
      return we ? (!L && (typeof p.UNSAFE_componentWillUpdate == "function" || typeof p.componentWillUpdate == "function") && (ss(t, "componentWillUpdate"), typeof p.componentWillUpdate == "function" && p.componentWillUpdate(u, me, N), typeof p.UNSAFE_componentWillUpdate == "function" && p.UNSAFE_componentWillUpdate(u, me, N), os()), typeof p.componentDidUpdate == "function" && (t.effectTag |= xt), typeof p.getSnapshotBeforeUpdate == "function" && (t.effectTag |= Ua)) : (typeof p.componentDidUpdate == "function" && (y !== e.memoizedProps || K !== e.memoizedState) && (t.effectTag |= xt), typeof p.getSnapshotBeforeUpdate == "function" && (y !== e.memoizedProps || K !== e.memoizedState) && (t.effectTag |= Ua), t.memoizedProps = u, t.memoizedState = me), p.props = u, p.state = me, p.context = N, we;
    }
    var Vy, Uy, Hy, Wy, Fy, p0 = function(e) {
    };
    Vy = !1, Uy = !1, Hy = {}, Wy = {}, Fy = {}, p0 = function(e) {
      if (!(e === null || typeof e != "object") && !(!e._store || e._store.validated || e.key != null)) {
        if (typeof e._store != "object")
          throw Error("React Component in warnForMissingKey should have a _store. This error is likely caused by a bug in React. Please file an issue.");
        e._store.validated = !0;
        var t = 'Each child in a list should have a unique "key" prop. See https://fb.me/react-warning-keys for more information.' + ft();
        Wy[t] || (Wy[t] = !0, g('Each child in a list should have a unique "key" prop. See https://fb.me/react-warning-keys for more information.'));
      }
    };
    var qm = Array.isArray;
    function Mh(e, t, s) {
      var u = s.ref;
      if (u !== null && typeof u != "function" && typeof u != "object") {
        if ((e.mode & yn || qn) && !(s._owner && s._self && s._owner.stateNode !== s._self)) {
          var d = Te(e.type) || "Component";
          Hy[d] || (g('A string ref, "%s", has been found within a strict mode tree. String refs are a source of potential bugs and should be avoided. We recommend using useRef() or createRef() instead. Learn more about using refs safely here: https://fb.me/react-strict-mode-string-ref%s', u, $n(e)), Hy[d] = !0);
        }
        if (s._owner) {
          var p = s._owner, y;
          if (p) {
            var b = p;
            if (b.tag !== ce)
              throw Error("Function components cannot have string refs. We recommend using useRef() instead. Learn more about using refs safely here: https://fb.me/react-strict-mode-string-ref");
            y = b.stateNode;
          }
          if (!y)
            throw Error("Missing owner for string ref " + u + ". This error is likely caused by a bug in React. Please file an issue.");
          var E = "" + u;
          if (t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === E)
            return t.ref;
          var N = function(k) {
            var J = y.refs;
            J === o0 && (J = y.refs = {}), k === null ? delete J[E] : J[E] = k;
          };
          return N._stringRef = E, N;
        } else {
          if (typeof u != "string")
            throw Error("Expected ref to be a function, a string, an object returned by React.createRef(), or null.");
          if (!s._owner)
            throw Error("Element ref was specified as a string (" + u + `) but no owner was set. This could happen for one of the following reasons:
1. You may be adding a ref to a function component
2. You may be adding a ref to a component that was not created inside a component's render method
3. You have multiple copies of React loaded
See https://fb.me/react-refs-must-have-owner for more information.`);
        }
      }
      return u;
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
        if (Fy[e])
          return;
        Fy[e] = !0, g("Functions are not valid as a React child. This may happen if you return a Component instead of <Component /> from render. Or maybe you meant to call this function rather than return it.");
      }
    }
    function m0(e) {
      function t($, te) {
        if (!!e) {
          var V = $.lastEffect;
          V !== null ? (V.nextEffect = te, $.lastEffect = te) : $.firstEffect = $.lastEffect = te, te.nextEffect = null, te.effectTag = Vs;
        }
      }
      function s($, te) {
        if (!e)
          return null;
        for (var V = te; V !== null; )
          t($, V), V = V.sibling;
        return null;
      }
      function u($, te) {
        for (var V = /* @__PURE__ */ new Map(), ve = te; ve !== null; )
          ve.key !== null ? V.set(ve.key, ve) : V.set(ve.index, ve), ve = ve.sibling;
        return V;
      }
      function d($, te) {
        var V = Au($, te);
        return V.index = 0, V.sibling = null, V;
      }
      function p($, te, V) {
        if ($.index = V, !e)
          return te;
        var ve = $.alternate;
        if (ve !== null) {
          var pe = ve.index;
          return pe < te ? ($.effectTag = Cn, te) : pe;
        } else
          return $.effectTag = Cn, te;
      }
      function y($) {
        return e && $.alternate === null && ($.effectTag = Cn), $;
      }
      function b($, te, V, ve) {
        if (te === null || te.tag !== Qe) {
          var pe = rb(V, $.mode, ve);
          return pe.return = $, pe;
        } else {
          var Ee = d(te, V);
          return Ee.return = $, Ee;
        }
      }
      function E($, te, V, ve) {
        if (te !== null && (te.elementType === V.type || Xx(te, V))) {
          var pe = d(te, V.props);
          return pe.ref = Mh($, te, V), pe.return = $, pe._debugSource = V._source, pe._debugOwner = V._owner, pe;
        }
        var Ee = ib(V, $.mode, ve);
        return Ee.ref = Mh($, te, V), Ee.return = $, Ee;
      }
      function N($, te, V, ve) {
        if (te === null || te.tag !== He || te.stateNode.containerInfo !== V.containerInfo || te.stateNode.implementation !== V.implementation) {
          var pe = ab(V, $.mode, ve);
          return pe.return = $, pe;
        } else {
          var Ee = d(te, V.children || []);
          return Ee.return = $, Ee;
        }
      }
      function k($, te, V, ve, pe) {
        if (te === null || te.tag !== Tt) {
          var Ee = il(V, $.mode, ve, pe);
          return Ee.return = $, Ee;
        } else {
          var yt = d(te, V);
          return yt.return = $, yt;
        }
      }
      function J($, te, V) {
        if (typeof te == "string" || typeof te == "number") {
          var ve = rb("" + te, $.mode, V);
          return ve.return = $, ve;
        }
        if (typeof te == "object" && te !== null) {
          switch (te.$$typeof) {
            case xe: {
              var pe = ib(te, $.mode, V);
              return pe.ref = Mh($, null, te), pe.return = $, pe;
            }
            case Ye: {
              var Ee = ab(te, $.mode, V);
              return Ee.return = $, Ee;
            }
          }
          if (qm(te) || Dr(te)) {
            var yt = il(te, $.mode, V, null);
            return yt.return = $, yt;
          }
          Km($, te);
        }
        return typeof te == "function" && ev(), null;
      }
      function L($, te, V, ve) {
        var pe = te !== null ? te.key : null;
        if (typeof V == "string" || typeof V == "number")
          return pe !== null ? null : b($, te, "" + V, ve);
        if (typeof V == "object" && V !== null) {
          switch (V.$$typeof) {
            case xe:
              return V.key === pe ? V.type === je ? k($, te, V.props.children, ve, pe) : E($, te, V, ve) : null;
            case Ye:
              return V.key === pe ? N($, te, V, ve) : null;
          }
          if (qm(V) || Dr(V))
            return pe !== null ? null : k($, te, V, ve, null);
          Km($, V);
        }
        return typeof V == "function" && ev(), null;
      }
      function K($, te, V, ve, pe) {
        if (typeof ve == "string" || typeof ve == "number") {
          var Ee = $.get(V) || null;
          return b(te, Ee, "" + ve, pe);
        }
        if (typeof ve == "object" && ve !== null) {
          switch (ve.$$typeof) {
            case xe: {
              var yt = $.get(ve.key === null ? V : ve.key) || null;
              return ve.type === je ? k(te, yt, ve.props.children, pe, ve.key) : E(te, yt, ve, pe);
            }
            case Ye: {
              var It = $.get(ve.key === null ? V : ve.key) || null;
              return N(te, It, ve, pe);
            }
          }
          if (qm(ve) || Dr(ve)) {
            var Ht = $.get(V) || null;
            return k(te, Ht, ve, pe, null);
          }
          Km(te, ve);
        }
        return typeof ve == "function" && ev(), null;
      }
      function me($, te) {
        {
          if (typeof $ != "object" || $ === null)
            return te;
          switch ($.$$typeof) {
            case xe:
            case Ye:
              p0($);
              var V = $.key;
              if (typeof V != "string")
                break;
              if (te === null) {
                te = /* @__PURE__ */ new Set(), te.add(V);
                break;
              }
              if (!te.has(V)) {
                te.add(V);
                break;
              }
              g("Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted \u2014 the behavior is unsupported and could change in a future version.", V);
              break;
          }
        }
        return te;
      }
      function we($, te, V, ve) {
        for (var pe = null, Ee = 0; Ee < V.length; Ee++) {
          var yt = V[Ee];
          pe = me(yt, pe);
        }
        for (var It = null, Ht = null, At = te, zt = 0, Rt = 0, cn = null; At !== null && Rt < V.length; Rt++) {
          At.index > Rt ? (cn = At, At = null) : cn = At.sibling;
          var An = L($, At, V[Rt], ve);
          if (An === null) {
            At === null && (At = cn);
            break;
          }
          e && At && An.alternate === null && t($, At), zt = p(An, zt, Rt), Ht === null ? It = An : Ht.sibling = An, Ht = An, At = cn;
        }
        if (Rt === V.length)
          return s($, At), It;
        if (At === null) {
          for (; Rt < V.length; Rt++) {
            var Rn = J($, V[Rt], ve);
            Rn !== null && (zt = p(Rn, zt, Rt), Ht === null ? It = Rn : Ht.sibling = Rn, Ht = Rn);
          }
          return It;
        }
        for (var bi = u($, At); Rt < V.length; Rt++) {
          var tn = K(bi, $, Rt, V[Rt], ve);
          tn !== null && (e && tn.alternate !== null && bi.delete(tn.key === null ? Rt : tn.key), zt = p(tn, zt, Rt), Ht === null ? It = tn : Ht.sibling = tn, Ht = tn);
        }
        return e && bi.forEach(function(Bi) {
          return t($, Bi);
        }), It;
      }
      function Ke($, te, V, ve) {
        var pe = Dr(V);
        if (typeof pe != "function")
          throw Error("An object is not an iterable. This error is likely caused by a bug in React. Please file an issue.");
        {
          typeof Symbol == "function" && V[Symbol.toStringTag] === "Generator" && (Uy || g("Using Generators as children is unsupported and will likely yield unexpected results because enumerating a generator mutates it. You may convert it to an array with `Array.from()` or the `[...spread]` operator before rendering. Keep in mind you might need to polyfill these features for older browsers."), Uy = !0), V.entries === pe && (Vy || g("Using Maps as children is unsupported and will likely yield unexpected results. Convert it to a sequence/iterable of keyed ReactElements instead."), Vy = !0);
          var Ee = pe.call(V);
          if (Ee)
            for (var yt = null, It = Ee.next(); !It.done; It = Ee.next()) {
              var Ht = It.value;
              yt = me(Ht, yt);
            }
        }
        var At = pe.call(V);
        if (At == null)
          throw Error("An iterable object provided no iterator.");
        for (var zt = null, Rt = null, cn = te, An = 0, Rn = 0, bi = null, tn = At.next(); cn !== null && !tn.done; Rn++, tn = At.next()) {
          cn.index > Rn ? (bi = cn, cn = null) : bi = cn.sibling;
          var Bi = L($, cn, tn.value, ve);
          if (Bi === null) {
            cn === null && (cn = bi);
            break;
          }
          e && cn && Bi.alternate === null && t($, cn), An = p(Bi, An, Rn), Rt === null ? zt = Bi : Rt.sibling = Bi, Rt = Bi, cn = bi;
        }
        if (tn.done)
          return s($, cn), zt;
        if (cn === null) {
          for (; !tn.done; Rn++, tn = At.next()) {
            var wa = J($, tn.value, ve);
            wa !== null && (An = p(wa, An, Rn), Rt === null ? zt = wa : Rt.sibling = wa, Rt = wa);
          }
          return zt;
        }
        for (var fb = u($, cn); !tn.done; Rn++, tn = At.next()) {
          var rl = K(fb, $, Rn, tn.value, ve);
          rl !== null && (e && rl.alternate !== null && fb.delete(rl.key === null ? Rn : rl.key), An = p(rl, An, Rn), Rt === null ? zt = rl : Rt.sibling = rl, Rt = rl);
        }
        return e && fb.forEach(function(ZD) {
          return t($, ZD);
        }), zt;
      }
      function nt($, te, V, ve) {
        if (te !== null && te.tag === Qe) {
          s($, te.sibling);
          var pe = d(te, V);
          return pe.return = $, pe;
        }
        s($, te);
        var Ee = rb(V, $.mode, ve);
        return Ee.return = $, Ee;
      }
      function Pt($, te, V, ve) {
        for (var pe = V.key, Ee = te; Ee !== null; ) {
          if (Ee.key === pe) {
            switch (Ee.tag) {
              case Tt: {
                if (V.type === je) {
                  s($, Ee.sibling);
                  var yt = d(Ee, V.props.children);
                  return yt.return = $, yt._debugSource = V._source, yt._debugOwner = V._owner, yt;
                }
                break;
              }
              case Mt:
              default: {
                if (Ee.elementType === V.type || Xx(Ee, V)) {
                  s($, Ee.sibling);
                  var It = d(Ee, V.props);
                  return It.ref = Mh($, Ee, V), It.return = $, It._debugSource = V._source, It._debugOwner = V._owner, It;
                }
                break;
              }
            }
            s($, Ee);
            break;
          } else
            t($, Ee);
          Ee = Ee.sibling;
        }
        if (V.type === je) {
          var Ht = il(V.props.children, $.mode, ve, V.key);
          return Ht.return = $, Ht;
        } else {
          var At = ib(V, $.mode, ve);
          return At.ref = Mh($, te, V), At.return = $, At;
        }
      }
      function vt($, te, V, ve) {
        for (var pe = V.key, Ee = te; Ee !== null; ) {
          if (Ee.key === pe)
            if (Ee.tag === He && Ee.stateNode.containerInfo === V.containerInfo && Ee.stateNode.implementation === V.implementation) {
              s($, Ee.sibling);
              var yt = d(Ee, V.children || []);
              return yt.return = $, yt;
            } else {
              s($, Ee);
              break;
            }
          else
            t($, Ee);
          Ee = Ee.sibling;
        }
        var It = ab(V, $.mode, ve);
        return It.return = $, It;
      }
      function Qt($, te, V, ve) {
        var pe = typeof V == "object" && V !== null && V.type === je && V.key === null;
        pe && (V = V.props.children);
        var Ee = typeof V == "object" && V !== null;
        if (Ee)
          switch (V.$$typeof) {
            case xe:
              return y(Pt($, te, V, ve));
            case Ye:
              return y(vt($, te, V, ve));
          }
        if (typeof V == "string" || typeof V == "number")
          return y(nt($, te, "" + V, ve));
        if (qm(V))
          return we($, te, V, ve);
        if (Dr(V))
          return Ke($, te, V, ve);
        if (Ee && Km($, V), typeof V == "function" && ev(), typeof V > "u" && !pe)
          switch ($.tag) {
            case ce: {
              var yt = $.stateNode;
              if (yt.render._isMockFunction)
                break;
            }
            case Oe: {
              var It = $.type;
              throw Error((It.displayName || It.name || "Component") + "(...): Nothing was returned from render. This usually means a return statement is missing. Or, to render nothing, return null.");
            }
          }
        return s($, te);
      }
      return Qt;
    }
    var sd = m0(!0), $y = m0(!1);
    function c1(e, t) {
      if (!(e === null || t.child === e.child))
        throw Error("Resuming work not yet implemented.");
      if (t.child !== null) {
        var s = t.child, u = Au(s, s.pendingProps);
        for (t.child = u, u.return = t; s.sibling !== null; )
          s = s.sibling, u = u.sibling = Au(s, s.pendingProps), u.return = t;
        u.sibling = null;
      }
    }
    function d1(e, t) {
      for (var s = e.child; s !== null; )
        pD(s, t), s = s.sibling;
    }
    var Eh = {}, Jo = cu(Eh), Ih = cu(Eh), tv = cu(Eh);
    function nv(e) {
      if (e === Eh)
        throw Error("Expected host context to exist. This error is likely caused by a bug in React. Please file an issue.");
      return e;
    }
    function v0() {
      var e = nv(tv.current);
      return e;
    }
    function Qy(e, t) {
      Oi(tv, t, e), Oi(Ih, e, e), Oi(Jo, Eh, e);
      var s = Fg(t);
      zi(Jo, e), Oi(Jo, s, e);
    }
    function od(e) {
      zi(Jo, e), zi(Ih, e), zi(tv, e);
    }
    function Zy() {
      var e = nv(Jo.current);
      return e;
    }
    function g0(e) {
      nv(tv.current);
      var t = nv(Jo.current), s = Sm(t, e.type);
      t !== s && (Oi(Ih, e, e), Oi(Jo, s, e));
    }
    function Yy(e) {
      Ih.current === e && (zi(Jo, e), zi(Ih, e));
    }
    var f1 = 0, y0 = 1, Gy = 1, Ah = 2, va = cu(f1);
    function iv(e, t) {
      return (e & t) !== 0;
    }
    function Rh(e) {
      return e & y0;
    }
    function Xy(e, t) {
      return e & y0 | t;
    }
    function h1(e, t) {
      return e | t;
    }
    function mu(e, t) {
      Oi(va, t, e);
    }
    function ld(e) {
      zi(va, e);
    }
    function p1(e, t) {
      var s = e.memoizedState;
      if (s !== null)
        return s.dehydrated !== null;
      var u = e.memoizedProps;
      return u.fallback === void 0 ? !1 : u.unstable_avoidThisFallback !== !0 ? !0 : !t;
    }
    function rv(e) {
      for (var t = e; t !== null; ) {
        if (t.tag === ee) {
          var s = t.memoizedState;
          if (s !== null) {
            var u = s.dehydrated;
            if (u === null || JE(u) || qE(u))
              return t;
          }
        } else if (t.tag === dt && t.memoizedProps.revealOrder !== void 0) {
          var d = (t.effectTag & Vt) !== _t;
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
    var ud = 1, cd = 2, av = 4, Ie = m.ReactCurrentDispatcher, Fr = m.ReactCurrentBatchConfig, Jy;
    Jy = /* @__PURE__ */ new Set();
    var qo = Ae, Tn = null, wi = null, li = null, sv = !1, m1 = 25, ae = null, $r = null, Ko = -1, qy = !1;
    function en() {
      {
        var e = ae;
        $r === null ? $r = [e] : $r.push(e);
      }
    }
    function Pe() {
      {
        var e = ae;
        $r !== null && (Ko++, $r[Ko] !== e && v1(e));
      }
    }
    function Dh(e) {
      e != null && !Array.isArray(e) && g("%s received a final argument that is not an array (instead, received `%s`). When specified, the final argument must be an array.", ae, typeof e);
    }
    function v1(e) {
      {
        var t = Te(Tn.type);
        if (!Jy.has(t) && (Jy.add(t), $r !== null)) {
          for (var s = "", u = 30, d = 0; d <= Ko; d++) {
            for (var p = $r[d], y = d === Ko ? e : p, b = d + 1 + ". " + p; b.length < u; )
              b += " ";
            b += y + `
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
    function Ky(e, t) {
      if (qy)
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
    function dd(e, t, s, u, d, p) {
      qo = p, Tn = t, $r = e !== null ? e._debugHookTypes : null, Ko = -1, qy = e !== null && e.type !== t.type, t.memoizedState = null, t.updateQueue = null, t.expirationTime = Ae, e !== null && e.memoizedState !== null ? Ie.current = R0 : $r !== null ? Ie.current = A0 : Ie.current = I0;
      var y = s(u, d);
      if (t.expirationTime === qo) {
        var b = 0;
        do {
          if (t.expirationTime = Ae, !(b < m1))
            throw Error("Too many re-renders. React limits the number of renders to prevent an infinite loop.");
          b += 1, qy = !1, wi = null, li = null, t.updateQueue = null, Ko = -1, Ie.current = D0, y = s(u, d);
        } while (t.expirationTime === qo);
      }
      Ie.current = vv, t._debugHookTypes = $r;
      var E = wi !== null && wi.next !== null;
      if (qo = Ae, Tn = null, wi = null, li = null, ae = null, $r = null, Ko = -1, sv = !1, E)
        throw Error("Rendered fewer hooks than expected. This may be caused by an accidental early return statement.");
      return y;
    }
    function w0(e, t, s) {
      t.updateQueue = e.updateQueue, t.effectTag &= ~(Ha | xt), e.expirationTime <= s && (e.expirationTime = Ae);
    }
    function b0() {
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
        var u = {
          memoizedState: wi.memoizedState,
          baseState: wi.baseState,
          baseQueue: wi.baseQueue,
          queue: wi.queue,
          next: null
        };
        li === null ? Tn.memoizedState = li = u : li = li.next = u;
      }
      return li;
    }
    function g1() {
      return {
        lastEffect: null
      };
    }
    function ew(e, t) {
      return typeof t == "function" ? t(e) : t;
    }
    function tw(e, t, s) {
      var u = fd(), d;
      s !== void 0 ? d = s(t) : d = t, u.memoizedState = u.baseState = d;
      var p = u.queue = {
        pending: null,
        dispatch: null,
        lastRenderedReducer: e,
        lastRenderedState: d
      }, y = p.dispatch = E0.bind(null, Tn, p);
      return [u.memoizedState, y];
    }
    function nw(e, t, s) {
      var u = hd(), d = u.queue;
      if (d === null)
        throw Error("Should have a queue. This is likely a bug in React. Please file an issue.");
      d.lastRenderedReducer = e;
      var p = wi, y = p.baseQueue, b = d.pending;
      if (b !== null) {
        if (y !== null) {
          var E = y.next, N = b.next;
          y.next = N, b.next = E;
        }
        p.baseQueue = y = b, d.pending = null;
      }
      if (y !== null) {
        var k = y.next, J = p.baseState, L = null, K = null, me = null, we = k;
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
            if (MC(Ke, we.suspenseConfig), we.eagerReducer === e)
              J = we.eagerState;
            else {
              var vt = we.action;
              J = e(J, vt);
            }
          }
          we = we.next;
        } while (we !== null && we !== k);
        me === null ? L = J : me.next = K, ou(J, u.memoizedState) || Rw(), u.memoizedState = J, u.baseState = L, u.baseQueue = me, d.lastRenderedState = J;
      }
      var Qt = d.dispatch;
      return [u.memoizedState, Qt];
    }
    function iw(e, t, s) {
      var u = hd(), d = u.queue;
      if (d === null)
        throw Error("Should have a queue. This is likely a bug in React. Please file an issue.");
      d.lastRenderedReducer = e;
      var p = d.dispatch, y = d.pending, b = u.memoizedState;
      if (y !== null) {
        d.pending = null;
        var E = y.next, N = E;
        do {
          var k = N.action;
          b = e(b, k), N = N.next;
        } while (N !== E);
        ou(b, u.memoizedState) || Rw(), u.memoizedState = b, u.baseQueue === null && (u.baseState = b), d.lastRenderedState = b;
      }
      return [b, p];
    }
    function Nh(e) {
      var t = fd();
      typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e;
      var s = t.queue = {
        pending: null,
        dispatch: null,
        lastRenderedReducer: ew,
        lastRenderedState: e
      }, u = s.dispatch = E0.bind(null, Tn, s);
      return [t.memoizedState, u];
    }
    function ov(e) {
      return nw(ew);
    }
    function lv(e) {
      return iw(ew);
    }
    function rw(e, t, s, u) {
      var d = {
        tag: e,
        create: t,
        destroy: s,
        deps: u,
        next: null
      }, p = Tn.updateQueue;
      if (p === null)
        p = g1(), Tn.updateQueue = p, p.lastEffect = d.next = d;
      else {
        var y = p.lastEffect;
        if (y === null)
          p.lastEffect = d.next = d;
        else {
          var b = y.next;
          y.next = d, d.next = b, p.lastEffect = d;
        }
      }
      return d;
    }
    function aw(e) {
      var t = fd(), s = {
        current: e
      };
      return Object.seal(s), t.memoizedState = s, s;
    }
    function uv(e) {
      var t = hd();
      return t.memoizedState;
    }
    function sw(e, t, s, u) {
      var d = fd(), p = u === void 0 ? null : u;
      Tn.effectTag |= e, d.memoizedState = rw(ud | t, s, void 0, p);
    }
    function ow(e, t, s, u) {
      var d = hd(), p = u === void 0 ? null : u, y = void 0;
      if (wi !== null) {
        var b = wi.memoizedState;
        if (y = b.destroy, p !== null) {
          var E = b.deps;
          if (Ky(p, E)) {
            rw(t, s, y, p);
            return;
          }
        }
      }
      Tn.effectTag |= e, d.memoizedState = rw(ud | t, s, y, p);
    }
    function cv(e, t) {
      return typeof jest < "u" && _C(Tn), sw(xt | Ha, av, e, t);
    }
    function pd(e, t) {
      return typeof jest < "u" && _C(Tn), ow(xt | Ha, av, e, t);
    }
    function lw(e, t) {
      return sw(xt, cd, e, t);
    }
    function dv(e, t) {
      return ow(xt, cd, e, t);
    }
    function S0(e, t) {
      if (typeof t == "function") {
        var s = t, u = e();
        return s(u), function() {
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
    function uw(e, t, s) {
      typeof t != "function" && g("Expected useImperativeHandle() second argument to be a function that creates a handle. Instead received: %s.", t !== null ? typeof t : "null");
      var u = s != null ? s.concat([e]) : null;
      return sw(xt, cd, S0.bind(null, t, e), u);
    }
    function fv(e, t, s) {
      typeof t != "function" && g("Expected useImperativeHandle() second argument to be a function that creates a handle. Instead received: %s.", t !== null ? typeof t : "null");
      var u = s != null ? s.concat([e]) : null;
      return ow(xt, cd, S0.bind(null, t, e), u);
    }
    function y1(e, t) {
    }
    var hv = y1;
    function pv(e, t) {
      var s = fd(), u = t === void 0 ? null : t;
      return s.memoizedState = [e, u], e;
    }
    function md(e, t) {
      var s = hd(), u = t === void 0 ? null : t, d = s.memoizedState;
      if (d !== null && u !== null) {
        var p = d[1];
        if (Ky(u, p))
          return d[0];
      }
      return s.memoizedState = [e, u], e;
    }
    function cw(e, t) {
      var s = fd(), u = t === void 0 ? null : t, d = e();
      return s.memoizedState = [d, u], d;
    }
    function mv(e, t) {
      var s = hd(), u = t === void 0 ? null : t, d = s.memoizedState;
      if (d !== null && u !== null) {
        var p = d[1];
        if (Ky(u, p))
          return d[0];
      }
      var y = e();
      return s.memoizedState = [y, u], y;
    }
    function dw(e, t) {
      var s = Nh(e), u = s[0], d = s[1];
      return cv(function() {
        var p = Fr.suspense;
        Fr.suspense = t === void 0 ? null : t;
        try {
          d(e);
        } finally {
          Fr.suspense = p;
        }
      }, [e, t]), u;
    }
    function x0(e, t) {
      var s = ov(), u = s[0], d = s[1];
      return pd(function() {
        var p = Fr.suspense;
        Fr.suspense = t === void 0 ? null : t;
        try {
          d(e);
        } finally {
          Fr.suspense = p;
        }
      }, [e, t]), u;
    }
    function C0(e, t) {
      var s = lv(), u = s[0], d = s[1];
      return pd(function() {
        var p = Fr.suspense;
        Fr.suspense = t === void 0 ? null : t;
        try {
          d(e);
        } finally {
          Fr.suspense = p;
        }
      }, [e, t]), u;
    }
    function fw(e, t, s) {
      var u = ed();
      co(u < Yo ? Yo : u, function() {
        e(!0);
      }), co(u > ha ? ha : u, function() {
        var d = Fr.suspense;
        Fr.suspense = t === void 0 ? null : t;
        try {
          e(!1), s();
        } finally {
          Fr.suspense = d;
        }
      });
    }
    function hw(e) {
      var t = Nh(!1), s = t[0], u = t[1], d = pv(fw.bind(null, u, e), [u, e]);
      return [d, s];
    }
    function T0(e) {
      var t = ov(), s = t[0], u = t[1], d = md(fw.bind(null, u, e), [u, e]);
      return [d, s];
    }
    function M0(e) {
      var t = lv(), s = t[0], u = t[1], d = md(fw.bind(null, u, e), [u, e]);
      return [d, s];
    }
    function E0(e, t, s) {
      typeof arguments[3] == "function" && g("State updates from the useState() and useReducer() Hooks don't support the second callback argument. To execute a side effect after rendering, declare it in the component body with useEffect().");
      var u = ms(), d = Th(), p = Cu(u, e, d), y = {
        expirationTime: p,
        suspenseConfig: d,
        action: s,
        eagerReducer: null,
        eagerState: null,
        next: null
      };
      y.priority = ed();
      var b = t.pending;
      b === null ? y.next = y : (y.next = b.next, b.next = y), t.pending = y;
      var E = e.alternate;
      if (e === Tn || E !== null && E === Tn)
        sv = !0, y.expirationTime = qo, Tn.expirationTime = qo;
      else {
        if (e.expirationTime === Ae && (E === null || E.expirationTime === Ae)) {
          var N = t.lastRenderedReducer;
          if (N !== null) {
            var k;
            k = Ie.current, Ie.current = ga;
            try {
              var J = t.lastRenderedState, L = N(J, s);
              if (y.eagerReducer = N, y.eagerState = L, ou(L, J))
                return;
            } catch {
            } finally {
              Ie.current = k;
            }
          }
        }
        typeof jest < "u" && (kC(e), tD(e)), Zr(e, p);
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
    }, I0 = null, A0 = null, R0 = null, D0 = null, hs = null, ga = null, gv = null;
    {
      var pw = function() {
        g("Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo().");
      }, ht = function() {
        g("Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. You can only call Hooks at the top level of your React function. For more information, see https://fb.me/rules-of-hooks");
      };
      I0 = {
        readContext: function(e, t) {
          return Bn(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", en(), Dh(t), pv(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", en(), Bn(e, t);
        },
        useEffect: function(e, t) {
          return ae = "useEffect", en(), Dh(t), cv(e, t);
        },
        useImperativeHandle: function(e, t, s) {
          return ae = "useImperativeHandle", en(), Dh(s), uw(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", en(), Dh(t), lw(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", en(), Dh(t);
          var s = Ie.current;
          Ie.current = hs;
          try {
            return cw(e, t);
          } finally {
            Ie.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", en();
          var u = Ie.current;
          Ie.current = hs;
          try {
            return tw(e, t, s);
          } finally {
            Ie.current = u;
          }
        },
        useRef: function(e) {
          return ae = "useRef", en(), aw(e);
        },
        useState: function(e) {
          ae = "useState", en();
          var t = Ie.current;
          Ie.current = hs;
          try {
            return Nh(e);
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
          return ae = "useDeferredValue", en(), dw(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", en(), hw(e);
        }
      }, A0 = {
        readContext: function(e, t) {
          return Bn(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", Pe(), pv(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", Pe(), Bn(e, t);
        },
        useEffect: function(e, t) {
          return ae = "useEffect", Pe(), cv(e, t);
        },
        useImperativeHandle: function(e, t, s) {
          return ae = "useImperativeHandle", Pe(), uw(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", Pe(), lw(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", Pe();
          var s = Ie.current;
          Ie.current = hs;
          try {
            return cw(e, t);
          } finally {
            Ie.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", Pe();
          var u = Ie.current;
          Ie.current = hs;
          try {
            return tw(e, t, s);
          } finally {
            Ie.current = u;
          }
        },
        useRef: function(e) {
          return ae = "useRef", Pe(), aw(e);
        },
        useState: function(e) {
          ae = "useState", Pe();
          var t = Ie.current;
          Ie.current = hs;
          try {
            return Nh(e);
          } finally {
            Ie.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return ae = "useDebugValue", Pe(), void 0;
        },
        useResponder: function(e, t) {
          return ae = "useResponder", Pe(), vu(e, t);
        },
        useDeferredValue: function(e, t) {
          return ae = "useDeferredValue", Pe(), dw(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", Pe(), hw(e);
        }
      }, R0 = {
        readContext: function(e, t) {
          return Bn(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", Pe(), md(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", Pe(), Bn(e, t);
        },
        useEffect: function(e, t) {
          return ae = "useEffect", Pe(), pd(e, t);
        },
        useImperativeHandle: function(e, t, s) {
          return ae = "useImperativeHandle", Pe(), fv(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", Pe(), dv(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", Pe();
          var s = Ie.current;
          Ie.current = ga;
          try {
            return mv(e, t);
          } finally {
            Ie.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", Pe();
          var u = Ie.current;
          Ie.current = ga;
          try {
            return nw(e, t, s);
          } finally {
            Ie.current = u;
          }
        },
        useRef: function(e) {
          return ae = "useRef", Pe(), uv();
        },
        useState: function(e) {
          ae = "useState", Pe();
          var t = Ie.current;
          Ie.current = ga;
          try {
            return ov(e);
          } finally {
            Ie.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return ae = "useDebugValue", Pe(), hv();
        },
        useResponder: function(e, t) {
          return ae = "useResponder", Pe(), vu(e, t);
        },
        useDeferredValue: function(e, t) {
          return ae = "useDeferredValue", Pe(), x0(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", Pe(), T0(e);
        }
      }, D0 = {
        readContext: function(e, t) {
          return Bn(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", Pe(), md(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", Pe(), Bn(e, t);
        },
        useEffect: function(e, t) {
          return ae = "useEffect", Pe(), pd(e, t);
        },
        useImperativeHandle: function(e, t, s) {
          return ae = "useImperativeHandle", Pe(), fv(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", Pe(), dv(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", Pe();
          var s = Ie.current;
          Ie.current = gv;
          try {
            return mv(e, t);
          } finally {
            Ie.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", Pe();
          var u = Ie.current;
          Ie.current = gv;
          try {
            return iw(e, t, s);
          } finally {
            Ie.current = u;
          }
        },
        useRef: function(e) {
          return ae = "useRef", Pe(), uv();
        },
        useState: function(e) {
          ae = "useState", Pe();
          var t = Ie.current;
          Ie.current = gv;
          try {
            return lv(e);
          } finally {
            Ie.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return ae = "useDebugValue", Pe(), hv();
        },
        useResponder: function(e, t) {
          return ae = "useResponder", Pe(), vu(e, t);
        },
        useDeferredValue: function(e, t) {
          return ae = "useDeferredValue", Pe(), C0(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", Pe(), M0(e);
        }
      }, hs = {
        readContext: function(e, t) {
          return pw(), Bn(e, t);
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
          return ae = "useImperativeHandle", ht(), en(), uw(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", ht(), en(), lw(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", ht(), en();
          var s = Ie.current;
          Ie.current = hs;
          try {
            return cw(e, t);
          } finally {
            Ie.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", ht(), en();
          var u = Ie.current;
          Ie.current = hs;
          try {
            return tw(e, t, s);
          } finally {
            Ie.current = u;
          }
        },
        useRef: function(e) {
          return ae = "useRef", ht(), en(), aw(e);
        },
        useState: function(e) {
          ae = "useState", ht(), en();
          var t = Ie.current;
          Ie.current = hs;
          try {
            return Nh(e);
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
          return ae = "useDeferredValue", ht(), en(), dw(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", ht(), en(), hw(e);
        }
      }, ga = {
        readContext: function(e, t) {
          return pw(), Bn(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", ht(), Pe(), md(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", ht(), Pe(), Bn(e, t);
        },
        useEffect: function(e, t) {
          return ae = "useEffect", ht(), Pe(), pd(e, t);
        },
        useImperativeHandle: function(e, t, s) {
          return ae = "useImperativeHandle", ht(), Pe(), fv(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", ht(), Pe(), dv(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", ht(), Pe();
          var s = Ie.current;
          Ie.current = ga;
          try {
            return mv(e, t);
          } finally {
            Ie.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", ht(), Pe();
          var u = Ie.current;
          Ie.current = ga;
          try {
            return nw(e, t, s);
          } finally {
            Ie.current = u;
          }
        },
        useRef: function(e) {
          return ae = "useRef", ht(), Pe(), uv();
        },
        useState: function(e) {
          ae = "useState", ht(), Pe();
          var t = Ie.current;
          Ie.current = ga;
          try {
            return ov(e);
          } finally {
            Ie.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return ae = "useDebugValue", ht(), Pe(), hv();
        },
        useResponder: function(e, t) {
          return ae = "useResponder", ht(), Pe(), vu(e, t);
        },
        useDeferredValue: function(e, t) {
          return ae = "useDeferredValue", ht(), Pe(), x0(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", ht(), Pe(), T0(e);
        }
      }, gv = {
        readContext: function(e, t) {
          return pw(), Bn(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", ht(), Pe(), md(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", ht(), Pe(), Bn(e, t);
        },
        useEffect: function(e, t) {
          return ae = "useEffect", ht(), Pe(), pd(e, t);
        },
        useImperativeHandle: function(e, t, s) {
          return ae = "useImperativeHandle", ht(), Pe(), fv(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", ht(), Pe(), dv(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", ht(), Pe();
          var s = Ie.current;
          Ie.current = ga;
          try {
            return mv(e, t);
          } finally {
            Ie.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", ht(), Pe();
          var u = Ie.current;
          Ie.current = ga;
          try {
            return iw(e, t, s);
          } finally {
            Ie.current = u;
          }
        },
        useRef: function(e) {
          return ae = "useRef", ht(), Pe(), uv();
        },
        useState: function(e) {
          ae = "useState", ht(), Pe();
          var t = Ie.current;
          Ie.current = ga;
          try {
            return lv(e);
          } finally {
            Ie.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return ae = "useDebugValue", ht(), Pe(), hv();
        },
        useResponder: function(e, t) {
          return ae = "useResponder", ht(), Pe(), vu(e, t);
        },
        useDeferredValue: function(e, t) {
          return ae = "useDeferredValue", ht(), Pe(), C0(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", ht(), Pe(), M0(e);
        }
      };
    }
    var yv = o.unstable_now, N0 = 0, kh = -1;
    function w1() {
      return N0;
    }
    function k0() {
      N0 = yv();
    }
    function mw(e) {
      kh = yv(), e.actualStartTime < 0 && (e.actualStartTime = yv());
    }
    function _0(e) {
      kh = -1;
    }
    function wv(e, t) {
      if (kh >= 0) {
        var s = yv() - kh;
        e.actualDuration += s, t && (e.selfBaseDuration = s), kh = -1;
      }
    }
    var Qr = null, gu = null, yu = !1;
    function b1(e) {
      var t = e.stateNode.containerInfo;
      return gu = LS(t), Qr = e, yu = !0, !0;
    }
    function P0(e, t) {
      switch (e.tag) {
        case Se:
          sI(e.stateNode.containerInfo, t);
          break;
        case Re:
          oI(e.type, e.memoizedProps, e.stateNode, t);
          break;
      }
      var s = wD();
      s.stateNode = t, s.return = e, s.effectTag = Vs, e.lastEffect !== null ? (e.lastEffect.nextEffect = s, e.lastEffect = s) : e.firstEffect = e.lastEffect = s;
    }
    function z0(e, t) {
      switch (t.effectTag = t.effectTag & ~$i | Cn, e.tag) {
        case Se: {
          var s = e.stateNode.containerInfo;
          switch (t.tag) {
            case Re:
              var u = t.type;
              t.pendingProps, lI(s, u);
              break;
            case Qe:
              var d = t.pendingProps;
              uI(s, d);
              break;
          }
          break;
        }
        case Re: {
          var p = e.type, y = e.memoizedProps, b = e.stateNode;
          switch (t.tag) {
            case Re:
              var E = t.type;
              t.pendingProps, cI(p, y, b, E);
              break;
            case Qe:
              var N = t.pendingProps;
              dI(p, y, b, N);
              break;
            case ee:
              fI(p, y);
              break;
          }
          break;
        }
        default:
          return;
      }
    }
    function O0(e, t) {
      switch (e.tag) {
        case Re: {
          var s = e.type;
          e.pendingProps;
          var u = is(t, s);
          return u !== null ? (e.stateNode = u, !0) : !1;
        }
        case Qe: {
          var d = e.pendingProps, p = $g(t, d);
          return p !== null ? (e.stateNode = p, !0) : !1;
        }
        case ee:
          return !1;
        default:
          return !1;
      }
    }
    function vw(e) {
      if (!!yu) {
        var t = gu;
        if (!t) {
          z0(Qr, e), yu = !1, Qr = e;
          return;
        }
        var s = t;
        if (!O0(e, t)) {
          if (t = xm(s), !t || !O0(e, t)) {
            z0(Qr, e), yu = !1, Qr = e;
            return;
          }
          P0(Qr, s);
        }
        Qr = e, gu = LS(t);
      }
    }
    function S1(e, t, s) {
      var u = e.stateNode, d = KE(u, e.type, e.memoizedProps, t, s, e);
      return e.updateQueue = d, d !== null;
    }
    function x1(e) {
      var t = e.stateNode, s = e.memoizedProps, u = eI(t, s, e);
      if (u) {
        var d = Qr;
        if (d !== null)
          switch (d.tag) {
            case Se: {
              var p = d.stateNode.containerInfo;
              rI(p, t, s);
              break;
            }
            case Re: {
              var y = d.type, b = d.memoizedProps, E = d.stateNode;
              aI(y, b, E, t, s);
              break;
            }
          }
      }
      return u;
    }
    function C1(e) {
      var t = e.memoizedState, s = t !== null ? t.dehydrated : null;
      if (!s)
        throw Error("Expected to have a hydrated suspense instance. This error is likely caused by a bug in React. Please file an issue.");
      return tI(s);
    }
    function L0(e) {
      for (var t = e.return; t !== null && t.tag !== Re && t.tag !== Se && t.tag !== ee; )
        t = t.return;
      Qr = t;
    }
    function bv(e) {
      if (e !== Qr)
        return !1;
      if (!yu)
        return L0(e), yu = !0, !1;
      var t = e.type;
      if (e.tag !== Re || t !== "head" && t !== "body" && !T(t, e.memoizedProps))
        for (var s = gu; s; )
          P0(e, s), s = xm(s);
      return L0(e), e.tag === ee ? gu = C1(e) : gu = Qr ? xm(e.stateNode) : null, !0;
    }
    function gw() {
      Qr = null, gu = null, yu = !1;
    }
    var _h = m.ReactCurrentOwner, el = !1, yw, ww, bw, Sw, xw, wu, Cw, Sv;
    yw = {}, ww = {}, bw = {}, Sw = {}, xw = {}, wu = !1, Cw = {}, Sv = {};
    function yr(e, t, s, u) {
      e === null ? t.child = $y(t, null, s, u) : t.child = sd(t, e.child, s, u);
    }
    function T1(e, t, s, u) {
      t.child = sd(t, e.child, null, u), t.child = sd(t, null, s, u);
    }
    function B0(e, t, s, u, d) {
      if (t.type !== t.elementType) {
        var p = s.propTypes;
        p && l(
          p,
          u,
          "prop",
          Te(s),
          ft
        );
      }
      var y = s.render, b = t.ref, E;
      return ad(t, d), _h.current = t, Nr(!0), E = dd(e, t, y, u, b, d), t.mode & yn && t.memoizedState !== null && (E = dd(e, t, y, u, b, d)), Nr(!1), e !== null && !el ? (w0(e, t, d), fo(e, t, d)) : (t.effectTag |= lr, yr(e, t, E, d), t.child);
    }
    function j0(e, t, s, u, d, p) {
      if (e === null) {
        var y = s.type;
        if (fD(y) && s.compare === null && s.defaultProps === void 0) {
          var b = y;
          return b = id(y), t.tag = ge, t.type = b, Ew(t, y), V0(e, t, b, u, d, p);
        }
        {
          var E = y.propTypes;
          E && l(
            E,
            u,
            "prop",
            Te(y),
            ft
          );
        }
        var N = nb(s.type, null, u, null, t.mode, p);
        return N.ref = t.ref, N.return = t, t.child = N, N;
      }
      {
        var k = s.type, J = k.propTypes;
        J && l(
          J,
          u,
          "prop",
          Te(k),
          ft
        );
      }
      var L = e.child;
      if (d < p) {
        var K = L.memoizedProps, me = s.compare;
        if (me = me !== null ? me : ch, me(K, u) && e.ref === t.ref)
          return fo(e, t, p);
      }
      t.effectTag |= lr;
      var we = Au(L, u);
      return we.ref = t.ref, we.return = t, t.child = we, we;
    }
    function V0(e, t, s, u, d, p) {
      if (t.type !== t.elementType) {
        var y = t.elementType;
        y.$$typeof === ir && (y = Od(y));
        var b = y && y.propTypes;
        b && l(
          b,
          u,
          "prop",
          Te(y),
          ft
        );
      }
      if (e !== null) {
        var E = e.memoizedProps;
        if (ch(E, u) && e.ref === t.ref && t.type === e.type && (el = !1, d < p))
          return t.expirationTime = e.expirationTime, fo(e, t, p);
      }
      return Tw(e, t, s, u, p);
    }
    function M1(e, t, s) {
      var u = t.pendingProps;
      return yr(e, t, u, s), t.child;
    }
    function E1(e, t, s) {
      var u = t.pendingProps.children;
      return yr(e, t, u, s), t.child;
    }
    function I1(e, t, s) {
      t.effectTag |= xt;
      var u = t.pendingProps, d = u.children;
      return yr(e, t, d, s), t.child;
    }
    function U0(e, t) {
      var s = t.ref;
      (e === null && s !== null || e !== null && e.ref !== s) && (t.effectTag |= pi);
    }
    function Tw(e, t, s, u, d) {
      if (t.type !== t.elementType) {
        var p = s.propTypes;
        p && l(
          p,
          u,
          "prop",
          Te(s),
          ft
        );
      }
      var y;
      {
        var b = Jc(t, s, !0);
        y = qc(t, b);
      }
      var E;
      return ad(t, d), _h.current = t, Nr(!0), E = dd(e, t, s, u, y, d), t.mode & yn && t.memoizedState !== null && (E = dd(e, t, s, u, y, d)), Nr(!1), e !== null && !el ? (w0(e, t, d), fo(e, t, d)) : (t.effectTag |= lr, yr(e, t, E, d), t.child);
    }
    function H0(e, t, s, u, d) {
      if (t.type !== t.elementType) {
        var p = s.propTypes;
        p && l(
          p,
          u,
          "prop",
          Te(s),
          ft
        );
      }
      var y;
      us(s) ? (y = !0, Om(t)) : y = !1, ad(t, d);
      var b = t.stateNode, E;
      b === null ? (e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= Cn), f0(t, s, u), jy(t, s, u, d), E = !0) : e === null ? E = l1(t, s, u, d) : E = u1(e, t, s, u, d);
      var N = Mw(e, t, s, E, y, d);
      {
        var k = t.stateNode;
        k.props !== u && (wu || g("It looks like %s is reassigning its own `this.props` while rendering. This is not supported and can lead to confusing bugs.", Te(t.type) || "a component"), wu = !0);
      }
      return N;
    }
    function Mw(e, t, s, u, d, p) {
      U0(e, t);
      var y = (t.effectTag & Vt) !== _t;
      if (!u && !y)
        return d && Dx(t, s, !1), fo(e, t, p);
      var b = t.stateNode;
      _h.current = t;
      var E;
      return y && typeof s.getDerivedStateFromError != "function" ? (E = null, _0()) : (Nr(!0), E = b.render(), t.mode & yn && b.render(), Nr(!1)), t.effectTag |= lr, e !== null && y ? T1(e, t, E, p) : yr(e, t, E, p), t.memoizedState = b.state, d && Dx(t, s, !0), t.child;
    }
    function W0(e) {
      var t = e.stateNode;
      t.pendingContext ? Ax(e, t.pendingContext, t.pendingContext !== t.context) : t.context && Ax(e, t.context, !1), Qy(e, t.containerInfo);
    }
    function A1(e, t, s) {
      W0(t);
      var u = t.updateQueue;
      if (!(e !== null && u !== null))
        throw Error("If the root does not have an updateQueue, we should have already bailed out. This error is likely caused by a bug in React. Please file an issue.");
      var d = t.pendingProps, p = t.memoizedState, y = p !== null ? p.element : null;
      Ay(e, t), Ch(t, d, null, s);
      var b = t.memoizedState, E = b.element;
      if (E === y)
        return gw(), fo(e, t, s);
      var N = t.stateNode;
      if (N.hydrate && b1(t)) {
        var k = $y(t, null, E, s);
        t.child = k;
        for (var J = k; J; )
          J.effectTag = J.effectTag & ~Cn | $i, J = J.sibling;
      } else
        yr(e, t, E, s), gw();
      return t.child;
    }
    function R1(e, t, s) {
      g0(t), e === null && vw(t);
      var u = t.type, d = t.pendingProps, p = e !== null ? e.memoizedProps : null, y = d.children, b = T(u, d);
      return b ? y = null : p !== null && T(u, p) && (t.effectTag |= Ri), U0(e, t), t.mode & td && s !== fs && R(u, d) ? (Xw(fs), t.expirationTime = t.childExpirationTime = fs, null) : (yr(e, t, y, s), t.child);
    }
    function D1(e, t) {
      return e === null && vw(t), null;
    }
    function N1(e, t, s, u, d) {
      e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= Cn);
      var p = t.pendingProps;
      gx(t);
      var y = KA(s);
      t.type = y;
      var b = t.tag = hD(y);
      vx(t);
      var E = ma(y, p), N;
      switch (b) {
        case Oe:
          return Ew(t, y), t.type = y = id(y), N = Tw(null, t, y, E, d), N;
        case ce:
          return t.type = y = yy(y), N = H0(null, t, y, E, d), N;
        case D:
          return t.type = y = wy(y), N = B0(null, t, y, E, d), N;
        case Ce: {
          if (t.type !== t.elementType) {
            var k = y.propTypes;
            k && l(
              k,
              E,
              "prop",
              Te(y),
              ft
            );
          }
          return N = j0(
            null,
            t,
            y,
            ma(y.type, E),
            u,
            d
          ), N;
        }
      }
      var J = "";
      throw y !== null && typeof y == "object" && y.$$typeof === ir && (J = " Did you wrap a component in React.lazy() more than once?"), Error("Element type is invalid. Received a promise that resolves to: " + y + ". Lazy element type must resolve to a class or function." + J);
    }
    function k1(e, t, s, u, d) {
      e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= Cn), t.tag = ce;
      var p;
      return us(s) ? (p = !0, Om(t)) : p = !1, ad(t, d), f0(t, s, u), jy(t, s, u, d), Mw(null, t, s, !0, p, d);
    }
    function _1(e, t, s, u) {
      e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= Cn);
      var d = t.pendingProps, p;
      {
        var y = Jc(t, s, !1);
        p = qc(t, y);
      }
      ad(t, u);
      var b;
      {
        if (s.prototype && typeof s.prototype.render == "function") {
          var E = Te(s) || "Unknown";
          yw[E] || (g("The <%s /> component appears to have a render method, but doesn't extend React.Component. This is likely to cause errors. Change %s to extend React.Component instead.", E, E), yw[E] = !0);
        }
        t.mode & yn && pa.recordLegacyContextWarning(t, null), Nr(!0), _h.current = t, b = dd(null, t, s, d, p, u), Nr(!1);
      }
      if (t.effectTag |= lr, typeof b == "object" && b !== null && typeof b.render == "function" && b.$$typeof === void 0) {
        {
          var N = Te(s) || "Unknown";
          ww[N] || (g("The <%s /> component appears to be a function component that returns a class instance. Change %s to a class that extends React.Component instead. If you can't use a class try assigning the prototype on the function as a workaround. `%s.prototype = React.Component.prototype`. Don't use an arrow function since it cannot be called with `new` by React.", N, N, N), ww[N] = !0);
        }
        t.tag = ce, t.memoizedState = null, t.updateQueue = null;
        var k = !1;
        us(s) ? (k = !0, Om(t)) : k = !1, t.memoizedState = b.state !== null && b.state !== void 0 ? b.state : null, Iy(t);
        var J = s.getDerivedStateFromProps;
        return typeof J == "function" && Jm(t, s, J, d), d0(t, b), jy(t, s, d, u), Mw(null, t, s, !0, k, u);
      } else
        return t.tag = Oe, t.mode & yn && t.memoizedState !== null && (b = dd(null, t, s, d, p, u)), yr(null, t, b, u), Ew(t, s), t.child;
    }
    function Ew(e, t) {
      {
        if (t && t.childContextTypes && g("%s(...): childContextTypes cannot be defined on a function component.", t.displayName || t.name || "Component"), e.ref !== null) {
          var s = "", u = ka();
          u && (s += `

Check the render method of \`` + u + "`.");
          var d = u || e._debugID || "", p = e._debugSource;
          p && (d = p.fileName + ":" + p.lineNumber), xw[d] || (xw[d] = !0, g("Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?%s", s));
        }
        if (typeof t.getDerivedStateFromProps == "function") {
          var y = Te(t) || "Unknown";
          Sw[y] || (g("%s: Function components do not support getDerivedStateFromProps.", y), Sw[y] = !0);
        }
        if (typeof t.contextType == "object" && t.contextType !== null) {
          var b = Te(t) || "Unknown";
          bw[b] || (g("%s: Function components do not support contextType.", b), bw[b] = !0);
        }
      }
    }
    var Iw = {
      dehydrated: null,
      retryTime: Ae
    };
    function P1(e, t, s) {
      return iv(e, Ah) && (t === null || t.memoizedState !== null);
    }
    function F0(e, t, s) {
      var u = t.mode, d = t.pendingProps;
      RD(t) && (t.effectTag |= Vt);
      var p = va.current, y = !1, b = (t.effectTag & Vt) !== _t;
      if (b || P1(p, e) ? (y = !0, t.effectTag &= ~Vt) : (e === null || e.memoizedState !== null) && d.fallback !== void 0 && d.unstable_avoidThisFallback !== !0 && (p = h1(p, Gy)), p = Rh(p), mu(t, p), e === null)
        if (d.fallback !== void 0 && vw(t), y) {
          var E = d.fallback, N = il(null, u, Ae, null);
          if (N.return = t, (t.mode & Hr) === oi) {
            var k = t.memoizedState, J = k !== null ? t.child.child : t.child;
            N.child = J;
            for (var L = J; L !== null; )
              L.return = N, L = L.sibling;
          }
          var K = il(E, u, s, null);
          return K.return = t, N.sibling = K, t.memoizedState = Iw, t.child = N, K;
        } else {
          var me = d.children;
          return t.memoizedState = null, t.child = $y(t, null, me, s);
        }
      else {
        var we = e.memoizedState;
        if (we !== null) {
          var Ke = e.child, nt = Ke.sibling;
          if (y) {
            var Pt = d.fallback, vt = Au(Ke, Ke.pendingProps);
            if (vt.return = t, (t.mode & Hr) === oi) {
              var Qt = t.memoizedState, $ = Qt !== null ? t.child.child : t.child;
              if ($ !== Ke.child) {
                vt.child = $;
                for (var te = $; te !== null; )
                  te.return = vt, te = te.sibling;
              }
            }
            if (t.mode & ds) {
              for (var V = 0, ve = vt.child; ve !== null; )
                V += ve.treeBaseDuration, ve = ve.sibling;
              vt.treeBaseDuration = V;
            }
            var pe = Au(nt, Pt);
            return pe.return = t, vt.sibling = pe, vt.childExpirationTime = Ae, t.memoizedState = Iw, t.child = vt, pe;
          } else {
            var Ee = d.children, yt = Ke.child, It = sd(t, yt, Ee, s);
            return t.memoizedState = null, t.child = It;
          }
        } else {
          var Ht = e.child;
          if (y) {
            var At = d.fallback, zt = il(
              null,
              u,
              Ae,
              null
            );
            if (zt.return = t, zt.child = Ht, Ht !== null && (Ht.return = zt), (t.mode & Hr) === oi) {
              var Rt = t.memoizedState, cn = Rt !== null ? t.child.child : t.child;
              zt.child = cn;
              for (var An = cn; An !== null; )
                An.return = zt, An = An.sibling;
            }
            if (t.mode & ds) {
              for (var Rn = 0, bi = zt.child; bi !== null; )
                Rn += bi.treeBaseDuration, bi = bi.sibling;
              zt.treeBaseDuration = Rn;
            }
            var tn = il(At, u, s, null);
            return tn.return = t, zt.sibling = tn, tn.effectTag |= Cn, zt.childExpirationTime = Ae, t.memoizedState = Iw, t.child = zt, tn;
          } else {
            t.memoizedState = null;
            var Bi = d.children;
            return t.child = sd(t, Ht, Bi, s);
          }
        }
      }
    }
    function $0(e, t) {
      e.expirationTime < t && (e.expirationTime = t);
      var s = e.alternate;
      s !== null && s.expirationTime < t && (s.expirationTime = t), t0(e.return, t);
    }
    function z1(e, t, s) {
      for (var u = t; u !== null; ) {
        if (u.tag === ee) {
          var d = u.memoizedState;
          d !== null && $0(u, s);
        } else if (u.tag === dt)
          $0(u, s);
        else if (u.child !== null) {
          u.child.return = u, u = u.child;
          continue;
        }
        if (u === e)
          return;
        for (; u.sibling === null; ) {
          if (u.return === null || u.return === e)
            return;
          u = u.return;
        }
        u.sibling.return = u.return, u = u.sibling;
      }
    }
    function O1(e) {
      for (var t = e, s = null; t !== null; ) {
        var u = t.alternate;
        u !== null && rv(u) === null && (s = t), t = t.sibling;
      }
      return s;
    }
    function L1(e) {
      if (e !== void 0 && e !== "forwards" && e !== "backwards" && e !== "together" && !Cw[e])
        if (Cw[e] = !0, typeof e == "string")
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
    function B1(e, t) {
      e !== void 0 && !Sv[e] && (e !== "collapsed" && e !== "hidden" ? (Sv[e] = !0, g('"%s" is not a supported value for tail on <SuspenseList />. Did you mean "collapsed" or "hidden"?', e)) : t !== "forwards" && t !== "backwards" && (Sv[e] = !0, g('<SuspenseList tail="%s" /> is only valid if revealOrder is "forwards" or "backwards". Did you mean to specify revealOrder="forwards"?', e)));
    }
    function Q0(e, t) {
      {
        var s = Array.isArray(e), u = !s && typeof Dr(e) == "function";
        if (s || u) {
          var d = s ? "array" : "iterable";
          return g("A nested %s was passed to row #%s in <SuspenseList />. Wrap it in an additional SuspenseList to configure its revealOrder: <SuspenseList revealOrder=...> ... <SuspenseList revealOrder=...>{%s}</SuspenseList> ... </SuspenseList>", d, t, d), !1;
        }
      }
      return !0;
    }
    function j1(e, t) {
      if ((t === "forwards" || t === "backwards") && e !== void 0 && e !== null && e !== !1)
        if (Array.isArray(e)) {
          for (var s = 0; s < e.length; s++)
            if (!Q0(e[s], s))
              return;
        } else {
          var u = Dr(e);
          if (typeof u == "function") {
            var d = u.call(e);
            if (d)
              for (var p = d.next(), y = 0; !p.done; p = d.next()) {
                if (!Q0(p.value, y))
                  return;
                y++;
              }
          } else
            g('A single row was passed to a <SuspenseList revealOrder="%s" />. This is not useful since it needs multiple rows. Did you mean to pass multiple children or an array?', t);
        }
    }
    function Aw(e, t, s, u, d, p) {
      var y = e.memoizedState;
      y === null ? e.memoizedState = {
        isBackwards: t,
        rendering: null,
        renderingStartTime: 0,
        last: u,
        tail: s,
        tailExpiration: 0,
        tailMode: d,
        lastEffect: p
      } : (y.isBackwards = t, y.rendering = null, y.renderingStartTime = 0, y.last = u, y.tail = s, y.tailExpiration = 0, y.tailMode = d, y.lastEffect = p);
    }
    function Z0(e, t, s) {
      var u = t.pendingProps, d = u.revealOrder, p = u.tail, y = u.children;
      L1(d), B1(p, d), j1(y, d), yr(e, t, y, s);
      var b = va.current, E = iv(b, Ah);
      if (E)
        b = Xy(b, Ah), t.effectTag |= Vt;
      else {
        var N = e !== null && (e.effectTag & Vt) !== _t;
        N && z1(t, t.child, s), b = Rh(b);
      }
      if (mu(t, b), (t.mode & Hr) === oi)
        t.memoizedState = null;
      else
        switch (d) {
          case "forwards": {
            var k = O1(t.child), J;
            k === null ? (J = t.child, t.child = null) : (J = k.sibling, k.sibling = null), Aw(
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
            Aw(
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
            Aw(
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
    function V1(e, t, s) {
      Qy(t, t.stateNode.containerInfo);
      var u = t.pendingProps;
      return e === null ? t.child = sd(t, null, u, s) : yr(e, t, u, s), t.child;
    }
    function U1(e, t, s) {
      var u = t.type, d = u._context, p = t.pendingProps, y = t.memoizedProps, b = p.value;
      {
        var E = t.type.propTypes;
        E && l(E, p, "prop", "Context.Provider", ft);
      }
      if (e0(t, b), y !== null) {
        var N = y.value, k = e1(d, b, N);
        if (k === 0) {
          if (y.children === p.children && !Pm())
            return fo(e, t, s);
        } else
          t1(t, d, k, s);
      }
      var J = p.children;
      return yr(e, t, J, s), t.child;
    }
    var Y0 = !1;
    function H1(e, t, s) {
      var u = t.type;
      u._context === void 0 ? u !== u.Consumer && (Y0 || (Y0 = !0, g("Rendering <Context> directly is not supported and will be removed in a future major release. Did you mean to render <Context.Consumer> instead?"))) : u = u._context;
      var d = t.pendingProps, p = d.children;
      typeof p != "function" && g("A context consumer was rendered with multiple children, or a child that isn't a function. A context consumer expects a single child that is a function. If you did pass a function, make sure there is no trailing or leading whitespace around it."), ad(t, s);
      var y = Bn(u, d.unstable_observedBits), b;
      return _h.current = t, Nr(!0), b = p(y), Nr(!1), t.effectTag |= lr, yr(e, t, b, s), t.child;
    }
    function Rw() {
      el = !0;
    }
    function fo(e, t, s) {
      gx(t), e !== null && (t.dependencies = e.dependencies), _0();
      var u = t.expirationTime;
      u !== Ae && Ov(u);
      var d = t.childExpirationTime;
      return d < s ? null : (c1(e, t), t.child);
    }
    function W1(e, t, s) {
      {
        var u = t.return;
        if (u === null)
          throw new Error("Cannot swap the root fiber.");
        if (e.alternate = null, t.alternate = null, s.index = t.index, s.sibling = t.sibling, s.return = t.return, s.ref = t.ref, t === u.child)
          u.child = s;
        else {
          var d = u.child;
          if (d === null)
            throw new Error("Expected parent to have a child.");
          for (; d.sibling !== t; )
            if (d = d.sibling, d === null)
              throw new Error("Expected to find the previous sibling.");
          d.sibling = s;
        }
        var p = u.lastEffect;
        return p !== null ? (p.nextEffect = e, u.lastEffect = e) : u.firstEffect = u.lastEffect = e, e.nextEffect = null, e.effectTag = Vs, s.effectTag |= Cn, s;
      }
    }
    function G0(e, t, s) {
      var u = t.expirationTime;
      if (t._debugNeedsRemount && e !== null)
        return W1(e, t, nb(t.type, t.key, t.pendingProps, t._debugOwner || null, t.mode, t.expirationTime));
      if (e !== null) {
        var d = e.memoizedProps, p = t.pendingProps;
        if (d !== p || Pm() || t.type !== e.type)
          el = !0;
        else if (u < s) {
          switch (el = !1, t.tag) {
            case Se:
              W0(t), gw();
              break;
            case Re:
              if (g0(t), t.mode & td && s !== fs && R(t.type, p))
                return Xw(fs), t.expirationTime = t.childExpirationTime = fs, null;
              break;
            case ce: {
              var y = t.type;
              us(y) && Om(t);
              break;
            }
            case He:
              Qy(t, t.stateNode.containerInfo);
              break;
            case re: {
              var b = t.memoizedProps.value;
              e0(t, b);
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
                  return F0(e, t, s);
                mu(t, Rh(va.current));
                var L = fo(e, t, s);
                return L !== null ? L.sibling : null;
              } else
                mu(t, Rh(va.current));
              break;
            }
            case dt: {
              var K = (e.effectTag & Vt) !== _t, me = t.childExpirationTime >= s;
              if (K) {
                if (me)
                  return Z0(e, t, s);
                t.effectTag |= Vt;
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
        case Ze:
          return _1(e, t, t.type, s);
        case it: {
          var Ke = t.elementType;
          return N1(e, t, Ke, u, s);
        }
        case Oe: {
          var nt = t.type, Pt = t.pendingProps, vt = t.elementType === nt ? Pt : ma(nt, Pt);
          return Tw(e, t, nt, vt, s);
        }
        case ce: {
          var Qt = t.type, $ = t.pendingProps, te = t.elementType === Qt ? $ : ma(Qt, $);
          return H0(e, t, Qt, te, s);
        }
        case Se:
          return A1(e, t, s);
        case Re:
          return R1(e, t, s);
        case Qe:
          return D1(e, t);
        case ee:
          return F0(e, t, s);
        case He:
          return V1(e, t, s);
        case D: {
          var V = t.type, ve = t.pendingProps, pe = t.elementType === V ? ve : ma(V, ve);
          return B0(e, t, V, pe, s);
        }
        case Tt:
          return M1(e, t, s);
        case Bt:
          return E1(e, t, s);
        case B:
          return I1(e, t, s);
        case re:
          return U1(e, t, s);
        case Ge:
          return H1(e, t, s);
        case Ce: {
          var Ee = t.type, yt = t.pendingProps, It = ma(Ee, yt);
          if (t.type !== t.elementType) {
            var Ht = Ee.propTypes;
            Ht && l(
              Ht,
              It,
              "prop",
              Te(Ee),
              ft
            );
          }
          return It = ma(Ee.type, It), j0(e, t, Ee, It, u, s);
        }
        case ge:
          return V0(e, t, t.type, t.pendingProps, u, s);
        case Xe: {
          var At = t.type, zt = t.pendingProps, Rt = t.elementType === At ? zt : ma(At, zt);
          return k1(e, t, At, Rt, s);
        }
        case dt:
          return Z0(e, t, s);
      }
      throw Error("Unknown unit of work tag (" + t.tag + "). This error is likely caused by a bug in React. Please file an issue.");
    }
    function vd(e) {
      e.effectTag |= xt;
    }
    function X0(e) {
      e.effectTag |= pi;
    }
    var J0, Dw, q0, K0;
    J0 = function(e, t, s, u) {
      for (var d = t.child; d !== null; ) {
        if (d.tag === Re || d.tag === Qe)
          f(e, d.stateNode);
        else if (d.tag !== He) {
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
    }, Dw = function(e) {
    }, q0 = function(e, t, s, u, d) {
      var p = e.memoizedProps;
      if (p !== u) {
        var y = t.stateNode, b = Zy(), E = x(y, s, p, u, d, b);
        t.updateQueue = E, E && vd(t);
      }
    }, K0 = function(e, t, s, u) {
      s !== u && vd(t);
    };
    function xv(e, t) {
      switch (e.tailMode) {
        case "hidden": {
          for (var s = e.tail, u = null; s !== null; )
            s.alternate !== null && (u = s), s = s.sibling;
          u === null ? e.tail = null : u.sibling = null;
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
    function eC(e, t, s) {
      var u = t.pendingProps;
      switch (t.tag) {
        case Ze:
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
          return us(d) && zm(t), null;
        }
        case Se: {
          od(t), cy(t);
          var p = t.stateNode;
          if (p.pendingContext && (p.context = p.pendingContext, p.pendingContext = null), e === null || e.child === null) {
            var y = bv(t);
            y && vd(t);
          }
          return Dw(t), null;
        }
        case Re: {
          Yy(t);
          var b = v0(), E = t.type;
          if (e !== null && t.stateNode != null)
            q0(e, t, E, u, b), e.ref !== t.ref && X0(t);
          else {
            if (!u) {
              if (t.stateNode === null)
                throw Error("We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue.");
              return null;
            }
            var N = Zy(), k = bv(t);
            if (k)
              S1(t, b, N) && vd(t);
            else {
              var J = c(E, u, b, N, t);
              J0(J, t, !1, !1), t.stateNode = J, v(J, E, u, b) && vd(t);
            }
            t.ref !== null && X0(t);
          }
          return null;
        }
        case Qe: {
          var L = u;
          if (e && t.stateNode != null) {
            var K = e.memoizedProps;
            K0(e, t, K, L);
          } else {
            if (typeof L != "string" && t.stateNode === null)
              throw Error("We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue.");
            var me = v0(), we = Zy(), Ke = bv(t);
            Ke ? x1(t) && vd(t) : t.stateNode = W(L, me, we, t);
          }
          return null;
        }
        case ee: {
          ld(t);
          var nt = t.memoizedState;
          if ((t.effectTag & Vt) !== _t)
            return t.expirationTime = s, t;
          var Pt = nt !== null, vt = !1;
          if (e === null)
            t.memoizedProps.fallback !== void 0 && bv(t);
          else {
            var Qt = e.memoizedState;
            if (vt = Qt !== null, !Pt && Qt !== null) {
              var $ = e.child.sibling;
              if ($ !== null) {
                var te = t.firstEffect;
                te !== null ? (t.firstEffect = $, $.nextEffect = te) : (t.firstEffect = t.lastEffect = $, $.nextEffect = null), $.effectTag = Vs;
              }
            }
          }
          if (Pt && !vt && (t.mode & Hr) !== oi) {
            var V = e === null && t.memoizedProps.unstable_avoidThisFallback !== !0;
            V || iv(va.current, Gy) ? ER() : IR();
          }
          return (Pt || vt) && (t.effectTag |= xt), null;
        }
        case He:
          return od(t), Dw(t), null;
        case re:
          return Ty(t), null;
        case Xe: {
          var ve = t.type;
          return us(ve) && zm(t), null;
        }
        case dt: {
          ld(t);
          var pe = t.memoizedState;
          if (pe === null)
            return null;
          var Ee = (t.effectTag & Vt) !== _t, yt = pe.rendering;
          if (yt === null)
            if (Ee)
              xv(pe, !1);
            else {
              var It = RR() && (e === null || (e.effectTag & Vt) === _t);
              if (!It)
                for (var Ht = t.child; Ht !== null; ) {
                  var At = rv(Ht);
                  if (At !== null) {
                    Ee = !0, t.effectTag |= Vt, xv(pe, !1);
                    var zt = At.updateQueue;
                    return zt !== null && (t.updateQueue = zt, t.effectTag |= xt), pe.lastEffect === null && (t.firstEffect = null), t.lastEffect = pe.lastEffect, d1(t, s), mu(t, Xy(va.current, Ah)), t.child;
                  }
                  Ht = Ht.sibling;
                }
            }
          else {
            if (!Ee) {
              var Rt = rv(yt);
              if (Rt !== null) {
                t.effectTag |= Vt, Ee = !0;
                var cn = Rt.updateQueue;
                if (cn !== null && (t.updateQueue = cn, t.effectTag |= xt), xv(pe, !0), pe.tail === null && pe.tailMode === "hidden" && !yt.alternate) {
                  var An = t.lastEffect = pe.lastEffect;
                  return An !== null && (An.nextEffect = null), null;
                }
              } else if (vr() * 2 - pe.renderingStartTime > pe.tailExpiration && s > fs) {
                t.effectTag |= Vt, Ee = !0, xv(pe, !1);
                var Rn = s - 1;
                t.expirationTime = t.childExpirationTime = Rn, Xw(Rn);
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
            return Ee ? wa = Xy(wa, Ah) : wa = Rh(wa), mu(t, wa), Bi;
          }
          return null;
        }
      }
      throw Error("Unknown unit of work tag (" + t.tag + "). This error is likely caused by a bug in React. Please file an issue.");
    }
    function F1(e, t) {
      switch (e.tag) {
        case ce: {
          var s = e.type;
          us(s) && zm(e);
          var u = e.effectTag;
          return u & mi ? (e.effectTag = u & ~mi | Vt, e) : null;
        }
        case Se: {
          od(e), cy(e);
          var d = e.effectTag;
          if ((d & Vt) !== _t)
            throw Error("The root failed to unmount after an error. This is likely a bug in React. Please file an issue.");
          return e.effectTag = d & ~mi | Vt, e;
        }
        case Re:
          return Yy(e), null;
        case ee: {
          ld(e);
          var p = e.effectTag;
          return p & mi ? (e.effectTag = p & ~mi | Vt, e) : null;
        }
        case dt:
          return ld(e), null;
        case He:
          return od(e), null;
        case re:
          return Ty(e), null;
        default:
          return null;
      }
    }
    function tC(e) {
      switch (e.tag) {
        case ce: {
          var t = e.type.childContextTypes;
          t != null && zm(e);
          break;
        }
        case Se: {
          od(e), cy(e);
          break;
        }
        case Re: {
          Yy(e);
          break;
        }
        case He:
          od(e);
          break;
        case ee:
          ld(e);
          break;
        case dt:
          ld(e);
          break;
        case re:
          Ty(e);
          break;
      }
    }
    function Nw(e, t) {
      return {
        value: e,
        source: t,
        stack: $n(t)
      };
    }
    function $1(e) {
      var t = e.error;
      {
        var s = e.componentName, u = e.componentStack, d = e.errorBoundaryName, p = e.errorBoundaryFound, y = e.willRetry;
        if (t != null && t._suppressLogging) {
          if (p && y)
            return;
          console.error(t);
        }
        var b = s ? "The above error occurred in the <" + s + "> component:" : "The above error occurred in one of your React components:", E;
        p && d ? y ? E = "React will try to recreate this component tree from scratch " + ("using the error boundary you provided, " + d + ".") : E = "This error was initially handled by the error boundary " + d + `.
Recreating the tree from scratch failed so React will unmount the tree.` : E = `Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://fb.me/react-error-boundaries to learn more about error boundaries.`;
        var N = "" + b + u + `

` + ("" + E);
        console.error(N);
      }
    }
    var nC = null;
    nC = /* @__PURE__ */ new Set();
    var Q1 = typeof WeakSet == "function" ? WeakSet : Set;
    function kw(e, t) {
      var s = t.source, u = t.stack;
      u === null && s !== null && (u = $n(s));
      var d = {
        componentName: s !== null ? Te(s.type) : null,
        componentStack: u !== null ? u : "",
        error: t.value,
        errorBoundary: null,
        errorBoundaryName: null,
        errorBoundaryFound: !1,
        willRetry: !1
      };
      e !== null && e.tag === ce && (d.errorBoundary = e.stateNode, d.errorBoundaryName = Te(e.type), d.errorBoundaryFound = !0, d.willRetry = !0);
      try {
        $1(d);
      } catch (p) {
        setTimeout(function() {
          throw p;
        });
      }
    }
    var Z1 = function(e, t) {
      ss(e, "componentWillUnmount"), t.props = e.memoizedProps, t.state = e.memoizedState, t.componentWillUnmount(), os();
    };
    function Y1(e, t) {
      if (se(null, Z1, null, e, t), oe()) {
        var s = ke();
        Eu(e, s);
      }
    }
    function iC(e) {
      var t = e.ref;
      if (t !== null)
        if (typeof t == "function") {
          if (se(null, t, null, null), oe()) {
            var s = ke();
            Eu(e, s);
          }
        } else
          t.current = null;
    }
    function G1(e, t) {
      if (se(null, t, null), oe()) {
        var s = ke();
        Eu(e, s);
      }
    }
    function X1(e, t) {
      switch (t.tag) {
        case Oe:
        case D:
        case ge:
        case Mt:
          return;
        case ce: {
          if (t.effectTag & Ua && e !== null) {
            var s = e.memoizedProps, u = e.memoizedState;
            ss(t, "getSnapshotBeforeUpdate");
            var d = t.stateNode;
            t.type === t.elementType && !wu && (d.props !== t.memoizedProps && g("Expected %s props to match memoized props before getSnapshotBeforeUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(t.type) || "instance"), d.state !== t.memoizedState && g("Expected %s state to match memoized state before getSnapshotBeforeUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(t.type) || "instance"));
            var p = d.getSnapshotBeforeUpdate(t.elementType === t.type ? s : ma(t.type, s), u);
            {
              var y = nC;
              p === void 0 && !y.has(t.type) && (y.add(t.type), g("%s.getSnapshotBeforeUpdate(): A snapshot value (or null) must be returned. You have returned undefined.", Te(t.type)));
            }
            d.__reactInternalSnapshotBeforeUpdate = p, os();
          }
          return;
        }
        case Se:
        case Re:
        case Qe:
        case He:
        case Xe:
          return;
      }
      throw Error("This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue.");
    }
    function rC(e, t) {
      var s = t.updateQueue, u = s !== null ? s.lastEffect : null;
      if (u !== null) {
        var d = u.next, p = d;
        do {
          if ((p.tag & e) === e) {
            var y = p.destroy;
            p.destroy = void 0, y !== void 0 && y();
          }
          p = p.next;
        } while (p !== d);
      }
    }
    function aC(e, t) {
      var s = t.updateQueue, u = s !== null ? s.lastEffect : null;
      if (u !== null) {
        var d = u.next, p = d;
        do {
          if ((p.tag & e) === e) {
            var y = p.create;
            p.destroy = y();
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
    function J1(e) {
      if ((e.effectTag & Ha) !== _t)
        switch (e.tag) {
          case Oe:
          case D:
          case ge:
          case Mt: {
            rC(av | ud, e), aC(av | ud, e);
            break;
          }
        }
    }
    function q1(e, t, s, u) {
      switch (s.tag) {
        case Oe:
        case D:
        case ge:
        case Mt: {
          aC(cd | ud, s);
          return;
        }
        case ce: {
          var d = s.stateNode;
          if (s.effectTag & xt)
            if (t === null)
              ss(s, "componentDidMount"), s.type === s.elementType && !wu && (d.props !== s.memoizedProps && g("Expected %s props to match memoized props before componentDidMount. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(s.type) || "instance"), d.state !== s.memoizedState && g("Expected %s state to match memoized state before componentDidMount. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(s.type) || "instance")), d.componentDidMount(), os();
            else {
              var p = s.elementType === s.type ? t.memoizedProps : ma(s.type, t.memoizedProps), y = t.memoizedState;
              ss(s, "componentDidUpdate"), s.type === s.elementType && !wu && (d.props !== s.memoizedProps && g("Expected %s props to match memoized props before componentDidUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(s.type) || "instance"), d.state !== s.memoizedState && g("Expected %s state to match memoized state before componentDidUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(s.type) || "instance")), d.componentDidUpdate(p, y, d.__reactInternalSnapshotBeforeUpdate), os();
            }
          var b = s.updateQueue;
          b !== null && (s.type === s.elementType && !wu && (d.props !== s.memoizedProps && g("Expected %s props to match memoized props before processing the update queue. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(s.type) || "instance"), d.state !== s.memoizedState && g("Expected %s state to match memoized state before processing the update queue. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(s.type) || "instance")), s0(s, b, d));
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
            s0(s, E, N);
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
        case Qe:
          return;
        case He:
          return;
        case B: {
          {
            var K = s.memoizedProps.onRender;
            typeof K == "function" && K(s.memoizedProps.id, t === null ? "mount" : "update", s.actualDuration, s.treeBaseDuration, s.actualStartTime, w1(), e.memoizedInteractions);
          }
          return;
        }
        case ee: {
          oR(e, s);
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
    function K1(e, t) {
      for (var s = e; ; ) {
        if (s.tag === Re) {
          var u = s.stateNode;
          t ? qe(u) : un(s.stateNode, s.memoizedProps);
        } else if (s.tag === Qe) {
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
    function eR(e) {
      var t = e.ref;
      if (t !== null) {
        var s = e.stateNode, u;
        switch (e.tag) {
          case Re:
            u = s;
            break;
          default:
            u = s;
        }
        typeof t == "function" ? t(u) : (t.hasOwnProperty("current") || g("Unexpected ref object provided for %s. Use either a ref-setter function or React.createRef().%s", Te(e.type), $n(e)), t.current = u);
      }
    }
    function tR(e) {
      var t = e.ref;
      t !== null && (typeof t == "function" ? t(null) : t.current = null);
    }
    function sC(e, t, s) {
      switch (oD(t), t.tag) {
        case Oe:
        case D:
        case Ce:
        case ge:
        case Mt: {
          var u = t.updateQueue;
          if (u !== null) {
            var d = u.lastEffect;
            if (d !== null) {
              var p = d.next;
              {
                var y = s > ha ? ha : s;
                co(y, function() {
                  var E = p;
                  do {
                    var N = E.destroy;
                    N !== void 0 && G1(t, N), E = E.next;
                  } while (E !== p);
                });
              }
            }
          }
          return;
        }
        case ce: {
          iC(t);
          var b = t.stateNode;
          typeof b.componentWillUnmount == "function" && Y1(t, b);
          return;
        }
        case Re: {
          iC(t);
          return;
        }
        case He: {
          cC(e, t, s);
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
    function nR(e, t, s) {
      for (var u = t; ; ) {
        if (sC(e, u, s), u.child !== null && u.tag !== He) {
          u.child.return = u, u = u.child;
          continue;
        }
        if (u === t)
          return;
        for (; u.sibling === null; ) {
          if (u.return === null || u.return === t)
            return;
          u = u.return;
        }
        u.sibling.return = u.return, u = u.sibling;
      }
    }
    function oC(e) {
      var t = e.alternate;
      e.return = null, e.child = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.alternate = null, e.firstEffect = null, e.lastEffect = null, e.pendingProps = null, e.memoizedProps = null, e.stateNode = null, t !== null && oC(t);
    }
    function iR(e) {
      for (var t = e.return; t !== null; ) {
        if (lC(t))
          return t;
        t = t.return;
      }
      throw Error("Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue.");
    }
    function lC(e) {
      return e.tag === Re || e.tag === Se || e.tag === He;
    }
    function rR(e) {
      var t = e;
      e:
        for (; ; ) {
          for (; t.sibling === null; ) {
            if (t.return === null || lC(t.return))
              return null;
            t = t.return;
          }
          for (t.sibling.return = t.return, t = t.sibling; t.tag !== Re && t.tag !== Qe && t.tag !== Be; ) {
            if (t.effectTag & Cn || t.child === null || t.tag === He)
              continue e;
            t.child.return = t, t = t.child;
          }
          if (!(t.effectTag & Cn))
            return t.stateNode;
        }
    }
    function uC(e) {
      var t = iR(e), s, u, d = t.stateNode;
      switch (t.tag) {
        case Re:
          s = d, u = !1;
          break;
        case Se:
          s = d.containerInfo, u = !0;
          break;
        case He:
          s = d.containerInfo, u = !0;
          break;
        case gt:
        default:
          throw Error("Invalid host parent fiber. This error is likely caused by a bug in React. Please file an issue.");
      }
      t.effectTag & Ri && (Pi(s), t.effectTag &= ~Ri);
      var p = rR(e);
      u ? _w(e, p, s) : Pw(e, p, s);
    }
    function _w(e, t, s) {
      var u = e.tag, d = u === Re || u === Qe;
      if (d || vn) {
        var p = d ? e.stateNode : e.stateNode.instance;
        t ? ue(s, p, t) : P(s, p);
      } else if (u !== He) {
        var y = e.child;
        if (y !== null) {
          _w(y, t, s);
          for (var b = y.sibling; b !== null; )
            _w(b, t, s), b = b.sibling;
        }
      }
    }
    function Pw(e, t, s) {
      var u = e.tag, d = u === Re || u === Qe;
      if (d || vn) {
        var p = d ? e.stateNode : e.stateNode.instance;
        t ? Q(s, p, t) : O(s, p);
      } else if (u !== He) {
        var y = e.child;
        if (y !== null) {
          Pw(y, t, s);
          for (var b = y.sibling; b !== null; )
            Pw(b, t, s), b = b.sibling;
        }
      }
    }
    function cC(e, t, s) {
      for (var u = t, d = !1, p, y; ; ) {
        if (!d) {
          var b = u.return;
          e:
            for (; ; ) {
              if (b === null)
                throw Error("Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue.");
              var E = b.stateNode;
              switch (b.tag) {
                case Re:
                  p = E, y = !1;
                  break e;
                case Se:
                  p = E.containerInfo, y = !0;
                  break e;
                case He:
                  p = E.containerInfo, y = !0;
                  break e;
              }
              b = b.return;
            }
          d = !0;
        }
        if (u.tag === Re || u.tag === Qe)
          nR(e, u, s), y ? _e(p, u.stateNode) : ye(p, u.stateNode);
        else if (u.tag === He) {
          if (u.child !== null) {
            p = u.stateNode.containerInfo, y = !0, u.child.return = u, u = u.child;
            continue;
          }
        } else if (sC(e, u, s), u.child !== null) {
          u.child.return = u, u = u.child;
          continue;
        }
        if (u === t)
          return;
        for (; u.sibling === null; ) {
          if (u.return === null || u.return === t)
            return;
          u = u.return, u.tag === He && (d = !1);
        }
        u.sibling.return = u.return, u = u.sibling;
      }
    }
    function aR(e, t, s) {
      cC(e, t, s), oC(t);
    }
    function zw(e, t) {
      switch (t.tag) {
        case Oe:
        case D:
        case Ce:
        case ge:
        case Mt: {
          rC(cd | ud, t);
          return;
        }
        case ce:
          return;
        case Re: {
          var s = t.stateNode;
          if (s != null) {
            var u = t.memoizedProps, d = e !== null ? e.memoizedProps : u, p = t.type, y = t.updateQueue;
            t.updateQueue = null, y !== null && Et(s, y, p, d, u);
          }
          return;
        }
        case Qe: {
          if (t.stateNode === null)
            throw Error("This should have a text node initialized. This error is likely caused by a bug in React. Please file an issue.");
          var b = t.stateNode, E = t.memoizedProps, N = e !== null ? e.memoizedProps : E;
          Fn(b, N, E);
          return;
        }
        case Se: {
          {
            var k = t.stateNode;
            k.hydrate && (k.hydrate = !1, nI(k.containerInfo));
          }
          return;
        }
        case B:
          return;
        case ee: {
          sR(t), dC(t);
          return;
        }
        case dt: {
          dC(t);
          return;
        }
        case Xe:
          return;
      }
      throw Error("This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue.");
    }
    function sR(e) {
      var t = e.memoizedState, s, u = e;
      t === null ? s = !1 : (s = !0, u = e.child, MR()), u !== null && K1(u, s);
    }
    function oR(e, t) {
      var s = t.memoizedState;
      if (s === null) {
        var u = t.alternate;
        if (u !== null) {
          var d = u.memoizedState;
          if (d !== null) {
            var p = d.dehydrated;
            p !== null && iI(p);
          }
        }
      }
    }
    function dC(e) {
      var t = e.updateQueue;
      if (t !== null) {
        e.updateQueue = null;
        var s = e.stateNode;
        s === null && (s = e.stateNode = new Q1()), t.forEach(function(u) {
          var d = $R.bind(null, e, u);
          s.has(u) || (u.__reactDoNotTraceInteractions !== !0 && (d = h.unstable_wrap(d)), s.add(u), u.then(d, d));
        });
      }
    }
    function lR(e) {
      Pi(e.stateNode);
    }
    var uR = typeof WeakMap == "function" ? WeakMap : Map;
    function fC(e, t, s) {
      var u = Go(s, null);
      u.tag = My, u.payload = {
        element: null
      };
      var d = t.value;
      return u.callback = function() {
        HR(d), kw(e, t);
      }, u;
    }
    function hC(e, t, s) {
      var u = Go(s, null);
      u.tag = My;
      var d = e.type.getDerivedStateFromError;
      if (typeof d == "function") {
        var p = t.value;
        u.payload = function() {
          return kw(e, t), d(p);
        };
      }
      var y = e.stateNode;
      return y !== null && typeof y.componentDidCatch == "function" ? u.callback = function() {
        Jx(e), typeof d != "function" && (VR(this), kw(e, t));
        var E = t.value, N = t.stack;
        this.componentDidCatch(E, {
          componentStack: N !== null ? N : ""
        }), typeof d != "function" && e.expirationTime !== Ct && g("%s: Error boundaries should implement getDerivedStateFromError(). In that method, return a state update to display an error message or fallback UI.", Te(e.type) || "Unknown");
      } : u.callback = function() {
        Jx(e);
      }, u;
    }
    function cR(e, t, s) {
      var u = e.pingCache, d;
      if (u === null ? (u = e.pingCache = new uR(), d = /* @__PURE__ */ new Set(), u.set(s, d)) : (d = u.get(s), d === void 0 && (d = /* @__PURE__ */ new Set(), u.set(s, d))), !d.has(t)) {
        d.add(t);
        var p = WR.bind(null, e, s, t);
        s.then(p, p);
      }
    }
    function dR(e, t, s, u, d) {
      if (s.effectTag |= Po, s.firstEffect = s.lastEffect = null, u !== null && typeof u == "object" && typeof u.then == "function") {
        var p = u;
        if ((s.mode & Hr) === oi) {
          var y = s.alternate;
          y ? (s.updateQueue = y.updateQueue, s.memoizedState = y.memoizedState, s.expirationTime = y.expirationTime) : (s.updateQueue = null, s.memoizedState = null);
        }
        var b = iv(va.current, Gy), E = t;
        do {
          if (E.tag === ee && p1(E, b)) {
            var N = E.updateQueue;
            if (N === null) {
              var k = /* @__PURE__ */ new Set();
              k.add(p), E.updateQueue = k;
            } else
              N.add(p);
            if ((E.mode & Hr) === oi) {
              if (E.effectTag |= Vt, s.effectTag &= ~(Sf | Po), s.tag === ce) {
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
            cR(e, d, p), E.effectTag |= mi, E.expirationTime = d;
            return;
          }
          E = E.return;
        } while (E !== null);
        u = new Error((Te(s.type) || "A React component") + ` suspended while rendering, but no fallback UI was specified.

Add a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display.` + $n(s));
      }
      AR(), u = Nw(u, s);
      var K = t;
      do {
        switch (K.tag) {
          case Se: {
            var me = u;
            K.effectTag |= mi, K.expirationTime = d;
            var we = fC(K, me, d);
            r0(K, we);
            return;
          }
          case ce:
            var Ke = u, nt = K.type, Pt = K.stateNode;
            if ((K.effectTag & Vt) === _t && (typeof nt.getDerivedStateFromError == "function" || Pt !== null && typeof Pt.componentDidCatch == "function" && !AC(Pt))) {
              K.effectTag |= mi, K.expirationTime = d;
              var vt = hC(K, Ke, d);
              r0(K, vt);
              return;
            }
            break;
        }
        K = K.return;
      } while (K !== null);
    }
    var fR = Math.ceil, Ow = m.ReactCurrentDispatcher, pC = m.ReactCurrentOwner, Lw = m.IsSomeRendererActing, In = 0, Cv = 1, hR = 2, mC = 4, Bw = 8, wr = 16, ps = 32, bu = 0, Tv = 1, vC = 2, Mv = 3, Ev = 4, jw = 5, rt = In, Gi = null, Fe = null, ui = Ae, Yn = bu, Iv = null, ho = Ct, Ph = Ct, Av = null, zh = Ae, Rv = !1, Vw = 0, gC = 500, Ue = null, Dv = !1, Uw = null, gd = null, Oh = !1, yd = null, Lh = Kc, Hw = Ae, Su = null, pR = 50, Bh = 0, Ww = null, mR = 50, Nv = 0, jh = null, xu = null, Vh = Ae;
    function ms() {
      return (rt & (wr | ps)) !== In ? my(vr()) : (Vh !== Ae || (Vh = my(vr())), Vh);
    }
    function vR() {
      return my(vr());
    }
    function Cu(e, t, s) {
      var u = t.mode;
      if ((u & Hr) === oi)
        return Ct;
      var d = ed();
      if ((u & td) === oi)
        return d === Li ? Ct : Fx;
      if ((rt & wr) !== In)
        return ui;
      var p;
      if (s !== null)
        p = $A(e, s.timeoutMs | 0 || vh);
      else
        switch (d) {
          case Li:
            p = Ct;
            break;
          case Yo:
            p = Zx(e);
            break;
          case ha:
          case hy:
            p = FA(e);
            break;
          case hh:
            p = du;
            break;
          default:
            throw Error("Expected a valid priority level");
        }
      return Gi !== null && p === ui && (p -= 1), p;
    }
    function gR(e, t) {
      YR(), KR(e);
      var s = kv(e, t);
      if (s === null) {
        JR(e);
        return;
      }
      XR(e, t), DA();
      var u = ed();
      if (t === Ct ? (rt & Bw) !== In && (rt & (wr | ps)) === In ? (nl(s, t), Fw(s)) : (br(s), nl(s, t), rt === In && cs()) : (br(s), nl(s, t)), (rt & mC) !== In && (u === Yo || u === Li))
        if (Su === null)
          Su = /* @__PURE__ */ new Map([[s, t]]);
        else {
          var d = Su.get(s);
          (d === void 0 || d > t) && Su.set(s, t);
        }
    }
    var Zr = gR;
    function kv(e, t) {
      e.expirationTime < t && (e.expirationTime = t);
      var s = e.alternate;
      s !== null && s.expirationTime < t && (s.expirationTime = t);
      var u = e.return, d = null;
      if (u === null && e.tag === Se)
        d = e.stateNode;
      else
        for (; u !== null; ) {
          if (s = u.alternate, u.childExpirationTime < t && (u.childExpirationTime = t), s !== null && s.childExpirationTime < t && (s.childExpirationTime = t), u.return === null && u.tag === Se) {
            d = u.stateNode;
            break;
          }
          u = u.return;
        }
      return d !== null && (Gi === d && (Ov(t), Yn === Ev && Ru(d, ui)), UC(d, t)), d;
    }
    function _v(e) {
      var t = e.lastExpiredTime;
      if (t !== Ae)
        return t;
      var s = e.firstPendingTime;
      if (!VC(e, s))
        return s;
      var u = e.lastPingedTime, d = e.nextKnownPendingLevel, p = u > d ? u : d;
      return p <= du && s !== p ? Ae : p;
    }
    function br(e) {
      var t = e.lastExpiredTime;
      if (t !== Ae) {
        e.callbackExpirationTime = Ct, e.callbackPriority = Li, e.callbackNode = Ux(Fw.bind(null, e));
        return;
      }
      var s = _v(e), u = e.callbackNode;
      if (s === Ae) {
        u !== null && (e.callbackNode = null, e.callbackExpirationTime = Ae, e.callbackPriority = Kc);
        return;
      }
      var d = ms(), p = Yx(d, s);
      if (u !== null) {
        var y = e.callbackPriority, b = e.callbackExpirationTime;
        if (b === s && y >= p)
          return;
        HA(u);
      }
      e.callbackExpirationTime = s, e.callbackPriority = p;
      var E;
      s === Ct ? E = Ux(Fw.bind(null, e)) : E = ph(
        p,
        yC.bind(null, e),
        {
          timeout: fu(s) - vr()
        }
      ), e.callbackNode = E;
    }
    function yC(e, t) {
      if (Vh = Ae, t) {
        var s = ms();
        return sb(e, s), br(e), null;
      }
      var u = _v(e);
      if (u !== Ae) {
        var d = e.callbackNode;
        if ((rt & (wr | ps)) !== In)
          throw Error("Should not already be working.");
        if (tl(), (e !== Gi || u !== ui) && (Tu(e, u), OC(e, u)), Fe !== null) {
          var p = rt;
          rt |= wr;
          var y = CC(), b = Pv(e);
          wx(Fe);
          do
            try {
              _R();
              break;
            } catch (k) {
              xC(e, k);
            }
          while (!0);
          if ($m(), rt = p, TC(y), zv(b), Yn === Tv) {
            var E = Iv;
            throw Qw(), Tu(e, u), Ru(e, u), br(e), E;
          }
          if (Fe !== null)
            Qw();
          else {
            DC();
            var N = e.finishedWork = e.current.alternate;
            e.finishedExpirationTime = u, yR(e, N, Yn, u);
          }
          if (br(e), e.callbackNode === d)
            return yC.bind(null, e);
        }
      }
      return null;
    }
    function yR(e, t, s, u) {
      switch (Gi = null, s) {
        case bu:
        case Tv:
          throw Error("Root did not complete. This is a bug in React.");
        case vC: {
          sb(e, u > du ? du : u);
          break;
        }
        case Mv: {
          Ru(e, u);
          var d = e.lastSuspendedTime;
          u === d && (e.nextKnownPendingLevel = $w(t));
          var p = ho === Ct;
          if (p && !Iu.current) {
            var y = Vw + gC - vr();
            if (y > 10) {
              if (Rv) {
                var b = e.lastPingedTime;
                if (b === Ae || b >= u) {
                  e.lastPingedTime = u, Tu(e, u);
                  break;
                }
              }
              var E = _v(e);
              if (E !== Ae && E !== u)
                break;
              if (d !== Ae && d !== u) {
                e.lastPingedTime = d;
                break;
              }
              e.timeoutHandle = U(Mu.bind(null, e), y);
              break;
            }
          }
          Mu(e);
          break;
        }
        case Ev: {
          Ru(e, u);
          var N = e.lastSuspendedTime;
          if (u === N && (e.nextKnownPendingLevel = $w(t)), !Iu.current) {
            if (Rv) {
              var k = e.lastPingedTime;
              if (k === Ae || k >= u) {
                e.lastPingedTime = u, Tu(e, u);
                break;
              }
            }
            var J = _v(e);
            if (J !== Ae && J !== u)
              break;
            if (N !== Ae && N !== u) {
              e.lastPingedTime = N;
              break;
            }
            var L;
            if (Ph !== Ct)
              L = fu(Ph) - vr();
            else if (ho === Ct)
              L = 0;
            else {
              var K = DR(ho), me = vr(), we = fu(u) - me, Ke = me - K;
              Ke < 0 && (Ke = 0), L = QR(Ke) - Ke, we < L && (L = we);
            }
            if (L > 10) {
              e.timeoutHandle = U(Mu.bind(null, e), L);
              break;
            }
          }
          Mu(e);
          break;
        }
        case jw: {
          if (!Iu.current && ho !== Ct && Av !== null) {
            var nt = ZR(ho, u, Av);
            if (nt > 10) {
              Ru(e, u), e.timeoutHandle = U(Mu.bind(null, e), nt);
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
    function Fw(e) {
      var t = e.lastExpiredTime, s = t !== Ae ? t : Ct;
      if ((rt & (wr | ps)) !== In)
        throw Error("Should not already be working.");
      if (tl(), (e !== Gi || s !== ui) && (Tu(e, s), OC(e, s)), Fe !== null) {
        var u = rt;
        rt |= wr;
        var d = CC(), p = Pv(e);
        wx(Fe);
        do
          try {
            kR();
            break;
          } catch (b) {
            xC(e, b);
          }
        while (!0);
        if ($m(), rt = u, TC(d), zv(p), Yn === Tv) {
          var y = Iv;
          throw Qw(), Tu(e, s), Ru(e, s), br(e), y;
        }
        if (Fe !== null)
          throw Error("Cannot commit an incomplete root. This error is likely caused by a bug in React. Please file an issue.");
        DC(), e.finishedWork = e.current.alternate, e.finishedExpirationTime = s, wR(e), br(e);
      }
      return null;
    }
    function wR(e) {
      Gi = null, Mu(e);
    }
    function bR() {
      if ((rt & (Cv | wr | ps)) !== In) {
        (rt & wr) !== In && g("unstable_flushDiscreteUpdates: Cannot flush updates when React is already rendering.");
        return;
      }
      xR(), tl();
    }
    function SR(e, t, s, u) {
      return co(Li, e.bind(null, t, s, u));
    }
    function xR() {
      if (Su !== null) {
        var e = Su;
        Su = null, e.forEach(function(t, s) {
          sb(s, t), br(s);
        }), cs();
      }
    }
    function wC(e, t) {
      var s = rt;
      rt |= Cv;
      try {
        return e(t);
      } finally {
        rt = s, rt === In && cs();
      }
    }
    function CR(e, t) {
      var s = rt;
      rt |= hR;
      try {
        return e(t);
      } finally {
        rt = s, rt === In && cs();
      }
    }
    function TR(e, t, s, u, d) {
      var p = rt;
      rt |= mC;
      try {
        return co(Yo, e.bind(null, t, s, u, d));
      } finally {
        rt = p, rt === In && cs();
      }
    }
    function bC(e, t) {
      var s = rt;
      rt &= ~Cv, rt |= Bw;
      try {
        return e(t);
      } finally {
        rt = s, rt === In && cs();
      }
    }
    function SC(e, t) {
      if ((rt & (wr | ps)) !== In)
        throw Error("flushSync was called from inside a lifecycle method. It cannot be called when React is already rendering.");
      var s = rt;
      rt |= Cv;
      try {
        return co(Li, e.bind(null, t));
      } finally {
        rt = s, cs();
      }
    }
    function Tu(e, t) {
      e.finishedWork = null, e.finishedExpirationTime = Ae;
      var s = e.timeoutHandle;
      if (s !== De && (e.timeoutHandle = De, Me(s)), Fe !== null)
        for (var u = Fe.return; u !== null; )
          tC(u), u = u.return;
      Gi = e, Fe = Au(e.current, null), ui = t, Yn = bu, Iv = null, ho = Ct, Ph = Ct, Av = null, zh = Ae, Rv = !1, xu = null, pa.discardPendingWarnings();
    }
    function xC(e, t) {
      do {
        try {
          if ($m(), b0(), rr(), Fe === null || Fe.return === null)
            return Yn = Tv, Iv = t, Fe = null, null;
          Er && Fe.mode & ds && wv(Fe, !0), dR(e, Fe.return, Fe, t, ui), Fe = IC(Fe);
        } catch (s) {
          t = s;
          continue;
        }
        return;
      } while (!0);
    }
    function CC(e) {
      var t = Ow.current;
      return Ow.current = vv, t === null ? vv : t;
    }
    function TC(e) {
      Ow.current = e;
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
    function MR() {
      Vw = vr();
    }
    function MC(e, t) {
      e < ho && e > du && (ho = e), t !== null && e < Ph && e > du && (Ph = e, Av = t);
    }
    function Ov(e) {
      e > zh && (zh = e);
    }
    function ER() {
      Yn === bu && (Yn = Mv);
    }
    function IR() {
      (Yn === bu || Yn === Mv) && (Yn = Ev), zh !== Ae && Gi !== null && (Ru(Gi, ui), UC(Gi, zh));
    }
    function AR() {
      Yn !== jw && (Yn = vC);
    }
    function RR() {
      return Yn === bu;
    }
    function DR(e) {
      var t = fu(e);
      return t - vh;
    }
    function NR(e, t) {
      var s = fu(e);
      return s - (t.timeoutMs | 0 || vh);
    }
    function kR() {
      for (; Fe !== null; )
        Fe = EC(Fe);
    }
    function _R() {
      for (; Fe !== null && !VA(); )
        Fe = EC(Fe);
    }
    function EC(e) {
      var t = e.alternate;
      vx(e), Co(e);
      var s;
      return (e.mode & ds) !== oi ? (mw(e), s = Zw(t, e, ui), wv(e, !0)) : s = Zw(t, e, ui), rr(), e.memoizedProps = e.pendingProps, s === null && (s = IC(e)), pC.current = null, s;
    }
    function IC(e) {
      Fe = e;
      do {
        var t = Fe.alternate, s = Fe.return;
        if ((Fe.effectTag & Po) === _t) {
          Co(Fe);
          var u = void 0;
          if ((Fe.mode & ds) === oi ? u = eC(t, Fe, ui) : (mw(Fe), u = eC(t, Fe, ui), wv(Fe, !1)), yx(Fe), rr(), PR(Fe), u !== null)
            return u;
          if (s !== null && (s.effectTag & Po) === _t) {
            s.firstEffect === null && (s.firstEffect = Fe.firstEffect), Fe.lastEffect !== null && (s.lastEffect !== null && (s.lastEffect.nextEffect = Fe.firstEffect), s.lastEffect = Fe.lastEffect);
            var d = Fe.effectTag;
            d > lr && (s.lastEffect !== null ? s.lastEffect.nextEffect = Fe : s.firstEffect = Fe, s.lastEffect = Fe);
          }
        } else {
          var p = F1(Fe);
          if ((Fe.mode & ds) !== oi) {
            wv(Fe, !1);
            for (var y = Fe.actualDuration, b = Fe.child; b !== null; )
              y += b.actualDuration, b = b.sibling;
            Fe.actualDuration = y;
          }
          if (p !== null)
            return NA(Fe), p.effectTag &= xf, p;
          yx(Fe), s !== null && (s.firstEffect = s.lastEffect = null, s.effectTag |= Po);
        }
        var E = Fe.sibling;
        if (E !== null)
          return E;
        Fe = s;
      } while (Fe !== null);
      return Yn === bu && (Yn = jw), null;
    }
    function $w(e) {
      var t = e.expirationTime, s = e.childExpirationTime;
      return t > s ? t : s;
    }
    function PR(e) {
      if (!(ui !== fs && e.childExpirationTime === fs)) {
        var t = Ae;
        if ((e.mode & ds) !== oi) {
          for (var s = e.actualDuration, u = e.selfBaseDuration, d = e.alternate === null || e.child !== e.alternate.child, p = e.child; p !== null; ) {
            var y = p.expirationTime, b = p.childExpirationTime;
            y > t && (t = y), b > t && (t = b), d && (s += p.actualDuration), u += p.treeBaseDuration, p = p.sibling;
          }
          e.actualDuration = s, e.treeBaseDuration = u;
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
      return co(Li, zR.bind(null, e, t)), null;
    }
    function zR(e, t) {
      do
        tl();
      while (yd !== null);
      if (GR(), (rt & (wr | ps)) !== In)
        throw Error("Should not already be working.");
      var s = e.finishedWork, u = e.finishedExpirationTime;
      if (s === null)
        return null;
      if (e.finishedWork = null, e.finishedExpirationTime = Ae, s === e.current)
        throw Error("Cannot commit the same tree as before. This error is likely caused by a bug in React. Please file an issue.");
      e.callbackNode = null, e.callbackExpirationTime = Ae, e.callbackPriority = Kc, e.nextKnownPendingLevel = Ae, kA();
      var d = $w(s);
      xD(e, u, d), e === Gi && (Gi = null, Fe = null, ui = Ae);
      var p;
      if (s.effectTag > lr ? s.lastEffect !== null ? (s.lastEffect.nextEffect = s, p = s.firstEffect) : p = s : p = s.firstEffect, p !== null) {
        var y = rt;
        rt |= ps;
        var b = Pv(e);
        pC.current = null, Sx(), i(e.containerInfo), Ue = p;
        do
          if (se(null, OR, null), oe()) {
            if (Ue === null)
              throw Error("Should be working on an effect.");
            var E = ke();
            Eu(Ue, E), Ue = Ue.nextEffect;
          }
        while (Ue !== null);
        xx(), k0(), Cx(), Ue = p;
        do
          if (se(null, LR, null, e, t), oe()) {
            if (Ue === null)
              throw Error("Should be working on an effect.");
            var N = ke();
            Eu(Ue, N), Ue = Ue.nextEffect;
          }
        while (Ue !== null);
        Tx(), a(e.containerInfo), e.current = s, Mx(), Ue = p;
        do
          if (se(null, BR, null, e, u), oe()) {
            if (Ue === null)
              throw Error("Should be working on an effect.");
            var k = ke();
            Eu(Ue, k), Ue = Ue.nextEffect;
          }
        while (Ue !== null);
        Ex(), Ue = null, UA(), zv(b), rt = y;
      } else
        e.current = s, Sx(), xx(), k0(), Cx(), Tx(), Mx(), Ex();
      _A();
      var J = Oh;
      if (Oh)
        Oh = !1, yd = e, Hw = u, Lh = t;
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
            zC(e, me[we], e.memoizedInteractions);
        }
        nl(e, K);
      } else
        gd = null;
      if (J || LC(e, u), K === Ct ? e === Ww ? Bh++ : (Bh = 0, Ww = e) : Bh = 0, sD(s.stateNode, u), br(e), Dv) {
        Dv = !1;
        var Ke = Uw;
        throw Uw = null, Ke;
      }
      return (rt & Bw) !== In || cs(), null;
    }
    function OR() {
      for (; Ue !== null; ) {
        var e = Ue.effectTag;
        if ((e & Ua) !== _t) {
          Co(Ue), km();
          var t = Ue.alternate;
          X1(t, Ue), rr();
        }
        (e & Ha) !== _t && (Oh || (Oh = !0, ph(ha, function() {
          return tl(), null;
        }))), Ue = Ue.nextEffect;
      }
    }
    function LR(e, t) {
      for (; Ue !== null; ) {
        Co(Ue);
        var s = Ue.effectTag;
        if (s & Ri && lR(Ue), s & pi) {
          var u = Ue.alternate;
          u !== null && tR(u);
        }
        var d = s & (Cn | xt | Vs | $i);
        switch (d) {
          case Cn: {
            uC(Ue), Ue.effectTag &= ~Cn;
            break;
          }
          case zp: {
            uC(Ue), Ue.effectTag &= ~Cn;
            var p = Ue.alternate;
            zw(p, Ue);
            break;
          }
          case $i: {
            Ue.effectTag &= ~$i;
            break;
          }
          case fc: {
            Ue.effectTag &= ~$i;
            var y = Ue.alternate;
            zw(y, Ue);
            break;
          }
          case xt: {
            var b = Ue.alternate;
            zw(b, Ue);
            break;
          }
          case Vs: {
            aR(e, Ue, t);
            break;
          }
        }
        km(), rr(), Ue = Ue.nextEffect;
      }
    }
    function BR(e, t) {
      for (; Ue !== null; ) {
        Co(Ue);
        var s = Ue.effectTag;
        if (s & (xt | bf)) {
          km();
          var u = Ue.alternate;
          q1(e, u, Ue);
        }
        s & pi && (km(), eR(Ue)), rr(), Ue = Ue.nextEffect;
      }
    }
    function tl() {
      if (Lh !== Kc) {
        var e = Lh > ha ? ha : Lh;
        return Lh = Kc, co(e, jR);
      }
    }
    function jR() {
      if (yd === null)
        return !1;
      var e = yd, t = Hw;
      if (yd = null, Hw = Ae, (rt & (wr | ps)) !== In)
        throw Error("Cannot flush passive effects while already rendering.");
      var s = rt;
      rt |= ps;
      for (var u = Pv(e), d = e.current.firstEffect; d !== null; ) {
        {
          if (Co(d), se(null, J1, null, d), oe()) {
            if (d === null)
              throw Error("Should be working on an effect.");
            var p = ke();
            Eu(d, p);
          }
          rr();
        }
        var y = d.nextEffect;
        d.nextEffect = null, d = y;
      }
      return zv(u), LC(e, t), rt = s, cs(), Nv = yd === null ? 0 : Nv + 1, !0;
    }
    function AC(e) {
      return gd !== null && gd.has(e);
    }
    function VR(e) {
      gd === null ? gd = /* @__PURE__ */ new Set([e]) : gd.add(e);
    }
    function UR(e) {
      Dv || (Dv = !0, Uw = e);
    }
    var HR = UR;
    function RC(e, t, s) {
      var u = Nw(s, t), d = fC(e, u, Ct);
      Xo(e, d);
      var p = kv(e, Ct);
      p !== null && (br(p), nl(p, Ct));
    }
    function Eu(e, t) {
      if (e.tag === Se) {
        RC(e, e, t);
        return;
      }
      for (var s = e.return; s !== null; ) {
        if (s.tag === Se) {
          RC(s, e, t);
          return;
        } else if (s.tag === ce) {
          var u = s.type, d = s.stateNode;
          if (typeof u.getDerivedStateFromError == "function" || typeof d.componentDidCatch == "function" && !AC(d)) {
            var p = Nw(t, e), y = hC(
              s,
              p,
              Ct
            );
            Xo(s, y);
            var b = kv(s, Ct);
            b !== null && (br(b), nl(b, Ct));
            return;
          }
        }
        s = s.return;
      }
    }
    function WR(e, t, s) {
      var u = e.pingCache;
      if (u !== null && u.delete(t), Gi === e && ui === s) {
        Yn === Ev || Yn === Mv && ho === Ct && vr() - Vw < gC ? Tu(e, ui) : Rv = !0;
        return;
      }
      if (!!VC(e, s)) {
        var d = e.lastPingedTime;
        d !== Ae && d < s || (e.lastPingedTime = s, br(e), nl(e, s));
      }
    }
    function FR(e, t) {
      if (t === Ae) {
        var s = null, u = ms();
        t = Cu(u, e, s);
      }
      var d = kv(e, t);
      d !== null && (br(d), nl(d, t));
    }
    function $R(e, t) {
      var s = Ae, u;
      u = e.stateNode, u !== null && u.delete(t), FR(e, s);
    }
    function QR(e) {
      return e < 120 ? 120 : e < 480 ? 480 : e < 1080 ? 1080 : e < 1920 ? 1920 : e < 3e3 ? 3e3 : e < 4320 ? 4320 : fR(e / 1960) * 1960;
    }
    function ZR(e, t, s) {
      var u = s.busyMinDurationMs | 0;
      if (u <= 0)
        return 0;
      var d = s.busyDelayMs | 0, p = vr(), y = NR(e, s), b = p - y;
      if (b <= d)
        return 0;
      var E = d + u - b;
      return E;
    }
    function YR() {
      if (Bh > pR)
        throw Bh = 0, Ww = null, Error("Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.");
      Nv > mR && (Nv = 0, g("Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render."));
    }
    function GR() {
      pa.flushLegacyContextWarning(), pa.flushPendingUnsafeLifecycleWarnings();
    }
    function DC() {
      var e = !0;
      bx(jh, e), jh = null;
    }
    function Qw() {
      var e = !1;
      bx(jh, e), jh = null;
    }
    function XR(e, t) {
      Gi !== null && t > ui && (jh = e);
    }
    var Lv = null;
    function JR(e) {
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
    var Zw;
    {
      var qR = null;
      Zw = function(e, t, s) {
        var u = jC(qR, t);
        try {
          return G0(e, t, s);
        } catch (p) {
          if (p !== null && typeof p == "object" && typeof p.then == "function")
            throw p;
          if ($m(), b0(), tC(t), jC(t, u), t.mode & ds && mw(t), se(null, G0, null, e, t, s), oe()) {
            var d = ke();
            throw d;
          } else
            throw p;
        }
      };
    }
    var NC = !1, Yw;
    Yw = /* @__PURE__ */ new Set();
    function KR(e) {
      if (yl && (rt & wr) !== In)
        switch (e.tag) {
          case Oe:
          case D:
          case ge: {
            var t = Fe && Te(Fe.type) || "Unknown", s = t;
            if (!Yw.has(s)) {
              Yw.add(s);
              var u = Te(e.type) || "Unknown";
              g("Cannot update a component (`%s`) while rendering a different component (`%s`). To locate the bad setState() call inside `%s`, follow the stack trace as described in https://fb.me/setstate-in-render", u, t, t);
            }
            break;
          }
          case ce: {
            NC || (g("Cannot update during an existing state transition (such as within `render`). Render methods should be a pure function of props and state."), NC = !0);
            break;
          }
        }
    }
    var Iu = {
      current: !1
    };
    function kC(e) {
      Lw.current === !0 && Iu.current !== !0 && g(`It looks like you're using the wrong act() around your test interactions.
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
    function _C(e) {
      (e.mode & yn) !== oi && Lw.current === !1 && Iu.current === !1 && g(`An update to %s ran an effect, but was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://fb.me/react-wrap-tests-with-act%s`, Te(e.type), $n(e));
    }
    function eD(e) {
      rt === In && Lw.current === !1 && Iu.current === !1 && g(`An update to %s inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://fb.me/react-wrap-tests-with-act%s`, Te(e.type), $n(e));
    }
    var tD = eD, PC = !1;
    function nD(e) {
      PC === !1 && o.unstable_flushAllWithoutAsserting === void 0 && (e.mode & Hr || e.mode & td) && (PC = !0, g(`In Concurrent or Sync modes, the "scheduler" module needs to be mocked to guarantee consistent behaviour across tests and browsers. For example, with jest: 
jest.mock('scheduler', () => require('scheduler/unstable_mock'));

For more info, visit https://fb.me/react-mock-scheduler`));
    }
    function Gw(e, t) {
      return t * 1e3 + e.interactionThreadID;
    }
    function Xw(e) {
      xu === null ? xu = [e] : xu.push(e);
    }
    function zC(e, t, s) {
      if (s.size > 0) {
        var u = e.pendingInteractionMap, d = u.get(t);
        d != null ? s.forEach(function(b) {
          d.has(b) || b.__count++, d.add(b);
        }) : (u.set(t, new Set(s)), s.forEach(function(b) {
          b.__count++;
        }));
        var p = h.__subscriberRef.current;
        if (p !== null) {
          var y = Gw(e, t);
          p.onWorkScheduled(s, y);
        }
      }
    }
    function nl(e, t) {
      zC(e, t, h.__interactionsRef.current);
    }
    function OC(e, t) {
      var s = /* @__PURE__ */ new Set();
      if (e.pendingInteractionMap.forEach(function(p, y) {
        y >= t && p.forEach(function(b) {
          return s.add(b);
        });
      }), e.memoizedInteractions = s, s.size > 0) {
        var u = h.__subscriberRef.current;
        if (u !== null) {
          var d = Gw(e, t);
          try {
            u.onWorkStarted(s, d);
          } catch (p) {
            ph(Li, function() {
              throw p;
            });
          }
        }
      }
    }
    function LC(e, t) {
      var s = e.firstPendingTime, u;
      try {
        if (u = h.__subscriberRef.current, u !== null && e.memoizedInteractions.size > 0) {
          var d = Gw(e, t);
          u.onWorkStopped(e.memoizedInteractions, d);
        }
      } catch (y) {
        ph(Li, function() {
          throw y;
        });
      } finally {
        var p = e.pendingInteractionMap;
        p.forEach(function(y, b) {
          b > s && (p.delete(b), y.forEach(function(E) {
            if (E.__count--, u !== null && E.__count === 0)
              try {
                u.onInteractionScheduledWorkCompleted(E);
              } catch (N) {
                ph(Li, function() {
                  throw N;
                });
              }
          }));
        });
      }
    }
    var Jw = null, qw = null, Kw = null, wd = !1, iD = typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u";
    function rD(e) {
      if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u")
        return !1;
      var t = __REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (t.isDisabled)
        return !0;
      if (!t.supportsFiber)
        return g("The installed version of React DevTools is too old and will not work with the current version of React. Please update React DevTools. https://fb.me/react-devtools"), !0;
      try {
        var s = t.inject(e);
        typeof t.onScheduleFiberRoot == "function" && (Jw = function(u, d) {
          try {
            t.onScheduleFiberRoot(s, u, d);
          } catch (p) {
            wd || (wd = !0, g("React instrumentation encountered an error: %s", p));
          }
        }), qw = function(u, d) {
          try {
            var p = (u.current.effectTag & Vt) === Vt;
            if (Er) {
              var y = vR(), b = Yx(y, d);
              t.onCommitFiberRoot(s, u, b, p);
            }
          } catch (E) {
            wd || (wd = !0, g("React instrumentation encountered an error: %s", E));
          }
        }, Kw = function(u) {
          try {
            t.onCommitFiberUnmount(s, u);
          } catch (d) {
            wd || (wd = !0, g("React instrumentation encountered an error: %s", d));
          }
        };
      } catch (u) {
        g("React instrumentation encountered an error: %s.", u);
      }
      return !0;
    }
    function aD(e, t) {
      typeof Jw == "function" && Jw(e, t);
    }
    function sD(e, t) {
      typeof qw == "function" && qw(e, t);
    }
    function oD(e) {
      typeof Kw == "function" && Kw(e);
    }
    var eb;
    {
      eb = !1;
      try {
        var BC = Object.preventExtensions({}), lD = /* @__PURE__ */ new Map([[BC, null]]), uD = /* @__PURE__ */ new Set([BC]);
        lD.set(0, 0), uD.add(0);
      } catch {
        eb = !0;
      }
    }
    var cD = 1;
    function dD(e, t, s, u) {
      this.tag = e, this.key = s, this.elementType = null, this.type = null, this.stateNode = null, this.return = null, this.child = null, this.sibling = null, this.index = 0, this.ref = null, this.pendingProps = t, this.memoizedProps = null, this.updateQueue = null, this.memoizedState = null, this.dependencies = null, this.mode = u, this.effectTag = _t, this.nextEffect = null, this.firstEffect = null, this.lastEffect = null, this.expirationTime = Ae, this.childExpirationTime = Ae, this.alternate = null, this.actualDuration = Number.NaN, this.actualStartTime = Number.NaN, this.selfBaseDuration = Number.NaN, this.treeBaseDuration = Number.NaN, this.actualDuration = 0, this.actualStartTime = -1, this.selfBaseDuration = 0, this.treeBaseDuration = 0, this._debugID = cD++, this._debugIsCurrentlyTiming = !1, this._debugSource = null, this._debugOwner = null, this._debugNeedsRemount = !1, this._debugHookTypes = null, !eb && typeof Object.preventExtensions == "function" && Object.preventExtensions(this);
    }
    var ya = function(e, t, s, u) {
      return new dD(e, t, s, u);
    };
    function tb(e) {
      var t = e.prototype;
      return !!(t && t.isReactComponent);
    }
    function fD(e) {
      return typeof e == "function" && !tb(e) && e.defaultProps === void 0;
    }
    function hD(e) {
      if (typeof e == "function")
        return tb(e) ? ce : Oe;
      if (e != null) {
        var t = e.$$typeof;
        if (t === ni)
          return D;
        if (t === ta)
          return Ce;
      }
      return Ze;
    }
    function Au(e, t) {
      var s = e.alternate;
      s === null ? (s = ya(e.tag, t, e.key, e.mode), s.elementType = e.elementType, s.type = e.type, s.stateNode = e.stateNode, s._debugID = e._debugID, s._debugSource = e._debugSource, s._debugOwner = e._debugOwner, s._debugHookTypes = e._debugHookTypes, s.alternate = e, e.alternate = s) : (s.pendingProps = t, s.effectTag = _t, s.nextEffect = null, s.firstEffect = null, s.lastEffect = null, s.actualDuration = 0, s.actualStartTime = -1), s.childExpirationTime = e.childExpirationTime, s.expirationTime = e.expirationTime, s.child = e.child, s.memoizedProps = e.memoizedProps, s.memoizedState = e.memoizedState, s.updateQueue = e.updateQueue;
      var u = e.dependencies;
      switch (s.dependencies = u === null ? null : {
        expirationTime: u.expirationTime,
        firstContext: u.firstContext,
        responders: u.responders
      }, s.sibling = e.sibling, s.index = e.index, s.ref = e.ref, s.selfBaseDuration = e.selfBaseDuration, s.treeBaseDuration = e.treeBaseDuration, s._debugNeedsRemount = e._debugNeedsRemount, s.tag) {
        case Ze:
        case Oe:
        case ge:
          s.type = id(e.type);
          break;
        case ce:
          s.type = yy(e.type);
          break;
        case D:
          s.type = wy(e.type);
          break;
      }
      return s;
    }
    function pD(e, t) {
      e.effectTag &= Cn, e.nextEffect = null, e.firstEffect = null, e.lastEffect = null;
      var s = e.alternate;
      if (s === null)
        e.childExpirationTime = Ae, e.expirationTime = t, e.child = null, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.selfBaseDuration = 0, e.treeBaseDuration = 0;
      else {
        e.childExpirationTime = s.childExpirationTime, e.expirationTime = s.expirationTime, e.child = s.child, e.memoizedProps = s.memoizedProps, e.memoizedState = s.memoizedState, e.updateQueue = s.updateQueue;
        var u = s.dependencies;
        e.dependencies = u === null ? null : {
          expirationTime: u.expirationTime,
          firstContext: u.firstContext,
          responders: u.responders
        }, e.selfBaseDuration = s.selfBaseDuration, e.treeBaseDuration = s.treeBaseDuration;
      }
      return e;
    }
    function mD(e) {
      var t;
      return e === OA ? t = td | Hr | yn : e === zA ? t = Hr | yn : t = oi, iD && (t |= ds), ya(Se, null, null, t);
    }
    function nb(e, t, s, u, d, p) {
      var y, b = Ze, E = e;
      if (typeof e == "function")
        tb(e) ? (b = ce, E = yy(E)) : E = id(E);
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
            case tt:
              b = Bt, d |= yn;
              break;
            case Nt:
              return vD(s, d, p, t);
            case ii:
              return gD(s, d, p, t);
            case So:
              return yD(s, d, p, t);
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
                    b = D, E = wy(E);
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
                var k = u ? Te(u.type) : null;
                k && (N += `

Check the render method of \`` + k + "`.");
              }
              throw Error("Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: " + (e == null ? e : typeof e) + "." + N);
            }
          }
      }
      return y = ya(b, s, t, d), y.elementType = e, y.type = E, y.expirationTime = p, y;
    }
    function ib(e, t, s) {
      var u = null;
      u = e._owner;
      var d = e.type, p = e.key, y = e.props, b = nb(d, p, y, u, t, s);
      return b._debugSource = e._source, b._debugOwner = e._owner, b;
    }
    function il(e, t, s, u) {
      var d = ya(Tt, e, u, t);
      return d.expirationTime = s, d;
    }
    function vD(e, t, s, u) {
      (typeof e.id != "string" || typeof e.onRender != "function") && g('Profiler must specify an "id" string and "onRender" function as props');
      var d = ya(B, e, u, t | ds);
      return d.elementType = Nt, d.type = Nt, d.expirationTime = s, d;
    }
    function gD(e, t, s, u) {
      var d = ya(ee, e, u, t);
      return d.type = ii, d.elementType = ii, d.expirationTime = s, d;
    }
    function yD(e, t, s, u) {
      var d = ya(dt, e, u, t);
      return d.type = So, d.elementType = So, d.expirationTime = s, d;
    }
    function rb(e, t, s) {
      var u = ya(Qe, e, null, t);
      return u.expirationTime = s, u;
    }
    function wD() {
      var e = ya(Re, null, null, oi);
      return e.elementType = "DELETED", e.type = "DELETED", e;
    }
    function ab(e, t, s) {
      var u = e.children !== null ? e.children : [], d = ya(He, u, e.key, t);
      return d.expirationTime = s, d.stateNode = {
        containerInfo: e.containerInfo,
        pendingChildren: null,
        implementation: e.implementation
      }, d;
    }
    function jC(e, t) {
      return e === null && (e = ya(Ze, null, null, oi)), e.tag = t.tag, e.key = t.key, e.elementType = t.elementType, e.type = t.type, e.stateNode = t.stateNode, e.return = t.return, e.child = t.child, e.sibling = t.sibling, e.index = t.index, e.ref = t.ref, e.pendingProps = t.pendingProps, e.memoizedProps = t.memoizedProps, e.updateQueue = t.updateQueue, e.memoizedState = t.memoizedState, e.dependencies = t.dependencies, e.mode = t.mode, e.effectTag = t.effectTag, e.nextEffect = t.nextEffect, e.firstEffect = t.firstEffect, e.lastEffect = t.lastEffect, e.expirationTime = t.expirationTime, e.childExpirationTime = t.childExpirationTime, e.alternate = t.alternate, e.actualDuration = t.actualDuration, e.actualStartTime = t.actualStartTime, e.selfBaseDuration = t.selfBaseDuration, e.treeBaseDuration = t.treeBaseDuration, e._debugID = t._debugID, e._debugSource = t._debugSource, e._debugOwner = t._debugOwner, e._debugIsCurrentlyTiming = t._debugIsCurrentlyTiming, e._debugNeedsRemount = t._debugNeedsRemount, e._debugHookTypes = t._debugHookTypes, e;
    }
    function bD(e, t, s) {
      this.tag = t, this.current = null, this.containerInfo = e, this.pendingChildren = null, this.pingCache = null, this.finishedExpirationTime = Ae, this.finishedWork = null, this.timeoutHandle = De, this.context = null, this.pendingContext = null, this.hydrate = s, this.callbackNode = null, this.callbackPriority = Kc, this.firstPendingTime = Ae, this.firstSuspendedTime = Ae, this.lastSuspendedTime = Ae, this.nextKnownPendingLevel = Ae, this.lastPingedTime = Ae, this.lastExpiredTime = Ae, this.interactionThreadID = h.unstable_getThreadID(), this.memoizedInteractions = /* @__PURE__ */ new Set(), this.pendingInteractionMap = /* @__PURE__ */ new Map();
    }
    function SD(e, t, s, u) {
      var d = new bD(e, t, s), p = mD(t);
      return d.current = p, p.stateNode = d, Iy(p), d;
    }
    function VC(e, t) {
      var s = e.firstSuspendedTime, u = e.lastSuspendedTime;
      return s !== Ae && s >= t && u <= t;
    }
    function Ru(e, t) {
      var s = e.firstSuspendedTime, u = e.lastSuspendedTime;
      s < t && (e.firstSuspendedTime = t), (u > t || s === Ae) && (e.lastSuspendedTime = t), t <= e.lastPingedTime && (e.lastPingedTime = Ae), t <= e.lastExpiredTime && (e.lastExpiredTime = Ae);
    }
    function UC(e, t) {
      var s = e.firstPendingTime;
      t > s && (e.firstPendingTime = t);
      var u = e.firstSuspendedTime;
      u !== Ae && (t >= u ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = Ae : t >= e.lastSuspendedTime && (e.lastSuspendedTime = t + 1), t > e.nextKnownPendingLevel && (e.nextKnownPendingLevel = t));
    }
    function xD(e, t, s) {
      e.firstPendingTime = s, t <= e.lastSuspendedTime ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = Ae : t <= e.firstSuspendedTime && (e.firstSuspendedTime = t - 1), t <= e.lastPingedTime && (e.lastPingedTime = Ae), t <= e.lastExpiredTime && (e.lastExpiredTime = Ae);
    }
    function sb(e, t) {
      var s = e.lastExpiredTime;
      (s === Ae || s > t) && (e.lastExpiredTime = t);
    }
    var ob, lb;
    ob = !1, lb = {};
    function CD(e) {
      if (!e)
        return mr;
      var t = ua(e), s = PA(t);
      if (t.tag === ce) {
        var u = t.type;
        if (us(u))
          return Rx(t, u, s);
      }
      return s;
    }
    function TD(e, t) {
      {
        var s = ua(e);
        if (s === void 0)
          throw typeof e.render == "function" ? Error("Unable to find node on an unmounted component.") : Error("Argument appears to not be a ReactComponent. Keys: " + Object.keys(e));
        var u = Tf(s);
        if (u === null)
          return null;
        if (u.mode & yn) {
          var d = Te(s.type) || "Component";
          lb[d] || (lb[d] = !0, s.mode & yn ? g("%s is deprecated in StrictMode. %s was passed an instance of %s which is inside StrictMode. Instead, add a ref directly to the element you want to reference. Learn more about using refs safely here: https://fb.me/react-strict-mode-find-node%s", t, t, d, $n(u)) : g("%s is deprecated in StrictMode. %s was passed an instance of %s which renders StrictMode children. Instead, add a ref directly to the element you want to reference. Learn more about using refs safely here: https://fb.me/react-strict-mode-find-node%s", t, t, d, $n(u)));
        }
        return u.stateNode;
      }
    }
    function MD(e, t, s, u) {
      return SD(e, t, s);
    }
    function Uh(e, t, s, u) {
      aD(t, e);
      var d = t.current, p = ms();
      typeof jest < "u" && (nD(d), kC(d));
      var y = Th(), b = Cu(p, d, y), E = CD(s);
      t.context === null ? t.context = E : t.pendingContext = E, yl && na !== null && !ob && (ob = !0, g(`Render methods should be a pure function of props and state; triggering nested component updates from render is not allowed. If necessary, trigger nested updates in componentDidUpdate.

Check the render method of %s.`, Te(na.type) || "Unknown"));
      var N = Go(b, y);
      return N.payload = {
        element: e
      }, u = u === void 0 ? null : u, u !== null && (typeof u != "function" && g("render(...): Expected the last optional `callback` argument to be a function. Instead received: %s.", u), N.callback = u), Xo(d, N), Zr(d, b), b;
    }
    function ub(e) {
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
    function HC(e, t) {
      var s = e.memoizedState;
      s !== null && s.dehydrated !== null && s.retryTime < t && (s.retryTime = t);
    }
    function cb(e, t) {
      HC(e, t);
      var s = e.alternate;
      s && HC(s, t);
    }
    function ED(e) {
      if (e.tag === ee) {
        var t = Zx(ms());
        Zr(e, t), cb(e, t);
      }
    }
    function ID(e) {
      e.tag === ee && (Zr(e, Wx), cb(e, Wx));
    }
    function AD(e) {
      if (e.tag === ee) {
        var t = ms(), s = Cu(t, e, null);
        Zr(e, s), cb(e, s);
      }
    }
    function WC(e) {
      var t = Bl(e);
      return t === null ? null : t.tag === gt ? t.stateNode.instance : t.stateNode;
    }
    var FC = function(e) {
      return !1;
    };
    function RD(e) {
      return FC(e);
    }
    var $C = null, QC = null, ZC = null, YC = null;
    {
      var GC = function(e, t, s, u) {
        if (s >= t.length)
          return u;
        var d = t[s], p = Array.isArray(e) ? e.slice() : n({}, e);
        return p[d] = GC(e[d], t, s + 1, u), p;
      }, XC = function(e, t, s) {
        return GC(e, t, 0, s);
      };
      $C = function(e, t, s, u) {
        for (var d = e.memoizedState; d !== null && t > 0; )
          d = d.next, t--;
        if (d !== null) {
          var p = XC(d.memoizedState, s, u);
          d.memoizedState = p, d.baseState = p, e.memoizedProps = n({}, e.memoizedProps), Zr(e, Ct);
        }
      }, QC = function(e, t, s) {
        e.pendingProps = XC(e.memoizedProps, t, s), e.alternate && (e.alternate.pendingProps = e.pendingProps), Zr(e, Ct);
      }, ZC = function(e) {
        Zr(e, Ct);
      }, YC = function(e) {
        FC = e;
      };
    }
    function DD(e) {
      var t = e.findFiberByHostInstance, s = m.ReactCurrentDispatcher;
      return rD(n({}, e, {
        overrideHookState: $C,
        overrideProps: QC,
        setSuspenseHandler: YC,
        scheduleUpdate: ZC,
        currentDispatcherRef: s,
        findHostInstanceByFiber: function(u) {
          var d = Tf(u);
          return d === null ? null : d.stateNode;
        },
        findFiberByHostInstance: function(u) {
          return t ? t(u) : null;
        },
        findHostInstancesForRefresh: XA,
        scheduleRefresh: YA,
        scheduleRoot: GA,
        setRefreshHandler: ZA,
        getCurrentFiber: function() {
          return na;
        }
      }));
    }
    m.IsSomeRendererActing;
    function db(e, t, s) {
      this._internalRoot = ND(e, t, s);
    }
    db.prototype.render = function(e) {
      var t = this._internalRoot;
      {
        typeof arguments[1] == "function" && g("render(...): does not support the second callback argument. To execute a side effect after rendering, declare it in a component body with useEffect().");
        var s = t.containerInfo;
        if (s.nodeType !== ai) {
          var u = WC(t.current);
          u && u.parentNode !== s && g("render(...): It looks like the React-rendered content of the root container was removed without using React. This is not supported and will cause errors. Instead, call root.unmount() to empty a root's container.");
        }
      }
      Uh(e, t, null, null);
    }, db.prototype.unmount = function() {
      typeof arguments[0] == "function" && g("unmount(...): does not support a callback argument. To execute a side effect after rendering, declare it in a component body with useEffect().");
      var e = this._internalRoot, t = e.containerInfo;
      Uh(null, e, null, function() {
        VS(t);
      });
    };
    function ND(e, t, s) {
      var u = s != null && s.hydrate === !0;
      s != null && s.hydrationOptions;
      var d = MD(e, t, u);
      if (hI(d.current, e), u && t !== Nx) {
        var p = e.nodeType === _a ? e : e.ownerDocument;
        bc(e, p);
      }
      return d;
    }
    function kD(e, t) {
      return new db(e, Nx, t);
    }
    function bd(e) {
      return !!(e && (e.nodeType === ar || e.nodeType === _a || e.nodeType === qu || e.nodeType === ai && e.nodeValue === " react-mount-point-unstable "));
    }
    var _D = m.ReactCurrentOwner, JC, qC = !1;
    JC = function(e) {
      if (e._reactRootContainer && e.nodeType !== ai) {
        var t = WC(e._reactRootContainer._internalRoot.current);
        t && t.parentNode !== e && g("render(...): It looks like the React-rendered content of this container was removed without using React. This is not supported and will cause errors. Instead, call ReactDOM.unmountComponentAtNode to empty a container.");
      }
      var s = !!e._reactRootContainer, u = Bv(e), d = !!(u && Zo(u));
      d && !s && g("render(...): Replacing React-rendered children with a new root component. If you intended to update the children of this node, you should instead have the existing children update their state and render the new components instead of calling ReactDOM.render."), e.nodeType === ar && e.tagName && e.tagName.toUpperCase() === "BODY" && g("render(): Rendering components directly into document.body is discouraged, since its children are often manipulated by third-party scripts and browser extensions. This may lead to subtle reconciliation issues. Try rendering into a container element created for your app.");
    };
    function Bv(e) {
      return e ? e.nodeType === _a ? e.documentElement : e.firstChild : null;
    }
    function PD(e) {
      var t = Bv(e);
      return !!(t && t.nodeType === ar && t.hasAttribute(de));
    }
    function zD(e, t) {
      var s = t || PD(e);
      if (!s)
        for (var u = !1, d; d = e.lastChild; )
          !u && d.nodeType === ar && d.hasAttribute(de) && (u = !0, g("render(): Target node has markup rendered by React, but there are unrelated nodes as well. This is most commonly caused by white-space inserted around server-rendered markup.")), e.removeChild(d);
      return s && !t && !qC && (qC = !0, w("render(): Calling ReactDOM.render() to hydrate server-rendered markup will stop working in React v17. Replace the ReactDOM.render() call with ReactDOM.hydrate() if you want React to attach to the server HTML.")), kD(e, s ? {
        hydrate: !0
      } : void 0);
    }
    function OD(e, t) {
      e !== null && typeof e != "function" && g("%s(...): Expected the last optional `callback` argument to be a function. Instead received: %s.", t, e);
    }
    function jv(e, t, s, u, d) {
      JC(s), OD(d === void 0 ? null : d, "render");
      var p = s._reactRootContainer, y;
      if (p) {
        if (y = p._internalRoot, typeof d == "function") {
          var E = d;
          d = function() {
            var N = ub(y);
            E.call(N);
          };
        }
        Uh(t, y, e, d);
      } else {
        if (p = s._reactRootContainer = zD(s, u), y = p._internalRoot, typeof d == "function") {
          var b = d;
          d = function() {
            var N = ub(y);
            b.call(N);
          };
        }
        bC(function() {
          Uh(t, y, e, d);
        });
      }
      return ub(y);
    }
    function LD(e) {
      {
        var t = _D.current;
        if (t !== null && t.stateNode !== null) {
          var s = t.stateNode._warnedAboutRefsInRender;
          s || g("%s is accessing findDOMNode inside its render(). render() should be a pure function of props and state. It should never access something that requires stale data from the previous render, such as refs. Move this logic to componentDidMount and componentDidUpdate instead.", Te(t.type) || "A component"), t.stateNode._warnedAboutRefsInRender = !0;
        }
      }
      return e == null ? null : e.nodeType === ar ? e : TD(e, "findDOMNode");
    }
    function BD(e, t, s) {
      if (!bd(t))
        throw Error("Target container is not a DOM element.");
      {
        var u = Zg(t) && t._reactRootContainer === void 0;
        u && g("You are calling ReactDOM.hydrate() on a container that was previously passed to ReactDOM.createRoot(). This is not supported. Did you mean to call createRoot(container, {hydrate: true}).render(element)?");
      }
      return jv(null, e, t, !0, s);
    }
    function jD(e, t, s) {
      if (!bd(t))
        throw Error("Target container is not a DOM element.");
      {
        var u = Zg(t) && t._reactRootContainer === void 0;
        u && g("You are calling ReactDOM.render() on a container that was previously passed to ReactDOM.createRoot(). This is not supported. Did you mean to call root.render(element)?");
      }
      return jv(null, e, t, !1, s);
    }
    function VD(e, t, s, u) {
      if (!bd(s))
        throw Error("Target container is not a DOM element.");
      if (!(e != null && wf(e)))
        throw Error("parentComponent must be a valid React Component");
      return jv(e, t, s, !1, u);
    }
    function UD(e) {
      if (!bd(e))
        throw Error("unmountComponentAtNode(...): Target container is not a DOM element.");
      {
        var t = Zg(e) && e._reactRootContainer === void 0;
        t && g("You are calling ReactDOM.unmountComponentAtNode() on a container that was previously passed to ReactDOM.createRoot(). This is not supported. Did you mean to call root.unmount()?");
      }
      if (e._reactRootContainer) {
        {
          var s = Bv(e), u = s && !Zo(s);
          u && g("unmountComponentAtNode(): The node you're attempting to unmount was rendered by another copy of React.");
        }
        return bC(function() {
          jv(null, null, e, !1, function() {
            e._reactRootContainer = null, VS(e);
          });
        }), !0;
      } else {
        {
          var d = Bv(e), p = !!(d && Zo(d)), y = e.nodeType === ar && bd(e.parentNode) && !!e.parentNode._reactRootContainer;
          p && g("unmountComponentAtNode(): The node you're attempting to unmount was rendered by React and is not a top-level container. %s", y ? "You may have accidentally passed in a React root node instead of its container." : "Instead, have the parent component update its state and rerender in order to remove this component.");
        }
        return !1;
      }
    }
    function HD(e, t, s) {
      var u = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : null;
      return {
        $$typeof: Ye,
        key: u == null ? null : "" + u,
        children: e,
        containerInfo: t,
        implementation: s
      };
    }
    var KC = "16.14.0";
    If(ED), gc(ID), wc(AD);
    var eT = !1;
    (typeof Map != "function" || Map.prototype == null || typeof Map.prototype.forEach != "function" || typeof Set != "function" || Set.prototype == null || typeof Set.prototype.clear != "function" || typeof Set.prototype.forEach != "function") && g("React depends on Map and Set built-in types. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"), Ia(pm), Ts(wC, TR, bR, CR);
    function tT(e, t) {
      var s = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
      if (!bd(t))
        throw Error("Target container is not a DOM element.");
      return HD(e, t, null, s);
    }
    function WD(e, t, s, u) {
      return VD(e, t, s, u);
    }
    function FD(e, t) {
      var s = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
      return eT || (eT = !0, w('The ReactDOM.unstable_createPortal() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactDOM.createPortal() instead. It has the exact same API, but without the "unstable_" prefix.')), tT(e, t, s);
    }
    var $D = {
      Events: [Zo, au, Yg, Mr, st, $c, TI, Ti, Cs, Ql, mc, tl, Iu]
    }, QD = DD({
      findFiberByHostInstance: th,
      bundleType: 1,
      version: KC,
      rendererPackageName: "react-dom"
    });
    if (!QD && jn && window.top === window.self && (navigator.userAgent.indexOf("Chrome") > -1 && navigator.userAgent.indexOf("Edge") === -1 || navigator.userAgent.indexOf("Firefox") > -1)) {
      var nT = window.location.protocol;
      /^(https?|file):$/.test(nT) && console.info("%cDownload the React DevTools for a better development experience: https://fb.me/react-devtools" + (nT === "file:" ? `
You might need to use a local HTTP server (instead of file://): https://fb.me/react-devtools-faq` : ""), "font-weight:bold");
    }
    xr.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = $D, xr.createPortal = tT, xr.findDOMNode = LD, xr.flushSync = SC, xr.hydrate = BD, xr.render = jD, xr.unmountComponentAtNode = UD, xr.unstable_batchedUpdates = wC, xr.unstable_createPortal = FD, xr.unstable_renderSubtreeIntoContainer = WD, xr.version = KC;
  }()), xr;
}
(function(r) {
  function n() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function")) {
      if (process.env.NODE_ENV !== "production")
        throw new Error("^_^");
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
      } catch (o) {
        console.error(o);
      }
    }
  }
  process.env.NODE_ENV === "production" ? (n(), r.exports = SO()) : r.exports = MO();
})(FE);
const cM = /* @__PURE__ */ HE(FE.exports);
var EO = Object.defineProperty, IO = Object.defineProperties, AO = Object.getOwnPropertyDescriptors, dM = Object.getOwnPropertySymbols, RO = Object.prototype.hasOwnProperty, DO = Object.prototype.propertyIsEnumerable, fM = (r, n, o) => n in r ? EO(r, n, { enumerable: !0, configurable: !0, writable: !0, value: o }) : r[n] = o, Tr = (r, n) => {
  for (var o in n || (n = {}))
    RO.call(n, o) && fM(r, o, n[o]);
  if (dM)
    for (var o of dM(n))
      DO.call(n, o) && fM(r, o, n[o]);
  return r;
};
const QE = { src: "", currentTime: 0, hostTime: 0, muted: !1, paused: !0, volume: 1 }, ZE = { currentTimeMaxError: 1, syncInterval: 1e3, retryInterval: 15e3, verbose: !1, log: console.log.bind(console) };
let mo = ZE;
function YE(r) {
  mo = Tr(Tr({}, ZE), r);
}
function Zv(r, n) {
  if (r.paused)
    return r.currentTime;
  const o = function(l) {
    if (l.player)
      return l.player.beginTimestamp + l.player.progressTime;
    if (l.room)
      return l.room.calibrationTimestamp;
  }(n);
  return o ? r.currentTime + (o - r.hostTime) / 1e3 : r.currentTime;
}
const NO = navigator.userAgent.includes("Safari"), kO = [".aac", ".mid", ".midi", ".mp3", ".ogg", ".oga", ".wav", ".weba"];
var _O = typeof global == "object" && global && global.Object === Object && global, PO = typeof self == "object" && self && self.Object === Object && self, GE = _O || PO || Function("return this")(), fg = GE.Symbol, XE = Object.prototype, zO = XE.hasOwnProperty, OO = XE.toString, Qh = fg ? fg.toStringTag : void 0, LO = Object.prototype.toString, hM = fg ? fg.toStringTag : void 0;
function BO(r) {
  return r == null ? r === void 0 ? "[object Undefined]" : "[object Null]" : hM && hM in Object(r) ? function(n) {
    var o = zO.call(n, Qh), l = n[Qh];
    try {
      n[Qh] = void 0;
      var h = !0;
    } catch {
    }
    var m = OO.call(n);
    return h && (o ? n[Qh] = l : delete n[Qh]), m;
  }(r) : function(n) {
    return LO.call(n);
  }(r);
}
var jO = /\s/, VO = /^\s+/;
function UO(r) {
  return r && r.slice(0, function(n) {
    for (var o = n.length; o-- && jO.test(n.charAt(o)); )
      ;
    return o;
  }(r) + 1).replace(VO, "");
}
function iS(r) {
  var n = typeof r;
  return r != null && (n == "object" || n == "function");
}
var HO = /^[-+]0x[0-9a-f]+$/i, WO = /^0b[01]+$/i, FO = /^0o[0-7]+$/i, $O = parseInt;
function pM(r) {
  if (typeof r == "number")
    return r;
  if (function(l) {
    return typeof l == "symbol" || function(h) {
      return h != null && typeof h == "object";
    }(l) && BO(l) == "[object Symbol]";
  }(r))
    return NaN;
  if (iS(r)) {
    var n = typeof r.valueOf == "function" ? r.valueOf() : r;
    r = iS(n) ? n + "" : n;
  }
  if (typeof r != "string")
    return r === 0 ? r : +r;
  r = UO(r);
  var o = WO.test(r);
  return o || FO.test(r) ? $O(r.slice(2), o ? 2 : 8) : HO.test(r) ? NaN : +r;
}
var Lb = function() {
  return GE.Date.now();
}, QO = Math.max, ZO = Math.min;
function Yv(r, n, o) {
  var l, h, m, w, g, S, C = 0, I = !1, A = !1, z = !0;
  if (typeof r != "function")
    throw new TypeError("Expected a function");
  function F(Z) {
    var le = l, oe = h;
    return l = h = void 0, C = Z, w = r.apply(oe, le);
  }
  function j(Z) {
    return C = Z, g = setTimeout(Y, n), I ? F(Z) : w;
  }
  function q(Z) {
    var le = Z - S;
    return S === void 0 || le >= n || le < 0 || A && Z - C >= m;
  }
  function Y() {
    var Z = Lb();
    if (q(Z))
      return fe(Z);
    g = setTimeout(Y, function(le) {
      var oe = n - (le - S);
      return A ? ZO(oe, m - (le - C)) : oe;
    }(Z));
  }
  function fe(Z) {
    return g = void 0, z && l ? F(Z) : (l = h = void 0, w);
  }
  function se() {
    var Z = Lb(), le = q(Z);
    if (l = arguments, h = this, S = Z, le) {
      if (g === void 0)
        return j(S);
      if (A)
        return clearTimeout(g), g = setTimeout(Y, n), F(S);
    }
    return g === void 0 && (g = setTimeout(Y, n)), w;
  }
  return n = pM(n) || 0, iS(o) && (I = !!o.leading, m = (A = "maxWait" in o) ? QO(pM(o.maxWait) || 0, n) : m, z = "trailing" in o ? !!o.trailing : z), se.cancel = function() {
    g !== void 0 && clearTimeout(g), C = 0, l = S = h = g = void 0;
  }, se.flush = function() {
    return g === void 0 ? w : fe(Lb());
  }, se;
}
class mM extends hl.exports.Component {
  constructor(n) {
    super(n), this.seeking = !1, this.mobileSeeking = !1, this.track = null, this.hoverTime = null, this.offset = 0, this.secondsPrefix = "00:00:", this.minutesPrefix = "00:", this.seekPause = !1, this.handleTouchSeeking = (o) => {
      let l = 0;
      for (let h = 0; h < o.changedTouches.length; h++)
        l = o.changedTouches[h].pageX;
      l = l < 0 ? 0 : l, this.mobileSeeking && this.changeCurrentTimePosition(l);
    }, this.handleSeeking = (o) => {
      this.seeking && this.changeCurrentTimePosition(o.pageX);
    }, this.setTrackWidthState = () => {
      this.track && this.setState({ trackWidth: this.track.offsetWidth });
    }, this.handleTrackHover = (o, l) => {
      if (this.track) {
        const h = this.props.scale || 1;
        let m;
        m = o ? 0 : (l.pageX - this.track.getBoundingClientRect().left) / h, this.setState({ seekHoverPosition: m, trackWidth: this.track.offsetWidth });
      }
    }, this.mouseSeekingHandler = (o) => {
      this.setSeeking(!1, o), this.onMouseUp();
    }, this.setSeeking = (o, l) => {
      l.preventDefault(), this.handleSeeking(l), this.seeking = o, this.setState({ seekHoverPosition: o ? this.state.seekHoverPosition : 0 });
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
      var l, h;
      this.props.pause && !this.props.paused && (this.props.pause(), this.seekPause = !0), this.setSeeking(!0, o), (h = (l = this.props).onSeekStart) == null || h.call(l);
    }, this.onMouseUp = () => {
      var o, l;
      this.props.play && this.seekPause && (this.props.play(), this.seekPause = !1), (l = (o = this.props).onSeekEnd) == null || l.call(o);
    }, this.props.secondsPrefix && (this.secondsPrefix = this.props.secondsPrefix), this.props.minutesPrefix && (this.minutesPrefix = this.props.minutesPrefix), this.state = { ready: !1, trackWidth: 0, seekHoverPosition: 0 };
  }
  componentDidMount() {
    this.setTrackWidthState(), window.addEventListener("resize", this.setTrackWidthState), window.addEventListener("mousemove", this.handleSeeking), window.addEventListener("mouseup", this.mouseSeekingHandler), window.addEventListener("touchmove", this.handleTouchSeeking), window.addEventListener("touchend", this.mobileTouchSeekingHandler);
  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.setTrackWidthState), window.removeEventListener("mousemove", this.handleSeeking), window.removeEventListener("mouseup", this.mouseSeekingHandler), window.removeEventListener("touchmove", this.handleTouchSeeking), window.removeEventListener("touchend", this.mobileTouchSeekingHandler);
  }
  changeCurrentTimePosition(n) {
    if (this.track) {
      const o = this.props.scale || 1;
      let l = (n - this.track.getBoundingClientRect().left) / o;
      l = Math.min(this.state.trackWidth, Math.max(0, l)), this.setState({ seekHoverPosition: l });
      const h = +(l / this.state.trackWidth * this.props.total).toFixed(0);
      this.props.onChange(h);
    }
  }
  getPositionStyle(n) {
    return { transform: `scaleX(${100 * n / this.props.total / 100})` };
  }
  getThumbHandlerPosition() {
    return { transform: `translateX(${this.state.trackWidth / (this.props.total / this.props.current)}px)` };
  }
  getSeekHoverPosition() {
    return { transform: `scaleX(${100 * this.state.seekHoverPosition / this.state.trackWidth / 100})` };
  }
  getHoverTimePosition() {
    let n = 0;
    return this.hoverTime && (n = this.state.seekHoverPosition - this.hoverTime.offsetWidth / 2, this.props.limitTimeTooltipBySides && (n < 0 ? n = 0 : n + this.hoverTime.offsetWidth > this.state.trackWidth && (n = this.state.trackWidth - this.hoverTime.offsetWidth))), { transform: `translateX(${n}px)` };
  }
  secondsToTime(n) {
    n = Math.round(n + this.offset);
    const o = Math.floor(n / 3600), l = n % 3600, h = Math.floor(l / 60), m = Math.ceil(l % 60);
    return { hh: o.toString(), mm: h < 10 ? "0" + h : h.toString(), ss: m < 10 ? "0" + m : m.toString() };
  }
  getHoverTime() {
    const n = 100 * this.state.seekHoverPosition / this.state.trackWidth, o = Math.floor(+n * (this.props.total / 100)), l = this.secondsToTime(o);
    return this.props.total + this.offset < 60 ? this.secondsPrefix + l.ss : this.props.total + this.offset < 3600 ? this.minutesPrefix + l.mm + ":" + l.ss : l.hh + ":" + l.mm + ":" + l.ss;
  }
  isThumbActive() {
    return this.state.seekHoverPosition > 0 || this.seeking;
  }
  drawHoverTime() {
    return this.props.hideHoverTime ? null : wt.createElement("div", { className: this.isThumbActive() ? "hover-time active" : "hover-time", style: this.getHoverTimePosition(), ref: (n) => this.hoverTime = n }, this.getHoverTime());
  }
  render() {
    return wt.createElement("div", { className: "seek-slider" }, wt.createElement("div", { className: "track", ref: (n) => this.track = n, onMouseMove: (n) => this.handleTrackHover(!1, n), onMouseLeave: (n) => this.handleTrackHover(!0, n), onMouseDown: this.onMouseDown, onTouchStart: (n) => {
      this.setMobileSeeking(!0), this.onMouseDown(n);
    }, onMouseUp: this.onMouseUp, onTouchEnd: this.onMouseUp }, wt.createElement("div", { className: "main" }, this.renderBufferProgress(), this.renderHoverProgress(), this.renderProgress())), this.drawHoverTime(), this.renderThumb());
  }
}
class YO extends hl.exports.Component {
  constructor(n) {
    super(n), this.stageVolume = 0, this.updateVolumeTimer = 0, this.onVolumeSeeking = !1, this.onClickOperationButton = () => {
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
    }, 500), this.state = { isPlayerSeeking: !1, isVolumeHover: !1, seekVolume: 1, visible: !0, currentTime: 0 }, this.stageVolume = n.volume;
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
    const { duration: n, currentTime: o } = this.props;
    return wt.createElement("div", { className: "player-controller", style: { opacity: this.props.visible ? "1" : "0" } }, wt.createElement("div", { className: "player-controller-progress" }, wt.createElement(mM, { total: n, current: this.state.currentTime, onChange: this.onChange, buffered: this.props.buffered, bufferColor: "rgba(255,255,255,0.3)", hideHoverTime: !0, limitTimeTooltipBySides: !0, onSeekStart: this.onProgressSeekStart, onSeekEnd: this.onProgressSeekEnd, play: this.props.play, pause: this.props.pause, paused: this.props.paused, scale: this.props.scale })), wt.createElement("div", { className: "player-controller-actions" }, wt.createElement("div", { className: "player-controller-actions-left" }, wt.createElement("div", { onClick: this.onClickOperationButton, className: "player-controller-play" }, this.operationButton()), wt.createElement("div", { className: "player-volume-box", onMouseEnter: () => this.setState({ isVolumeHover: !0 }), onMouseLeave: () => this.setState({ isVolumeHover: !1 }) }, wt.createElement("div", { onClick: this.handleClickVolume, className: "player-volume" }, this.operationVolumeButton()), wt.createElement("div", { className: "player-volume-slider" }, wt.createElement(mM, { total: 100, current: 100 * this.state.seekVolume, onChange: this.onVolumeChange, onSeekStart: this.onVolumeSeekStart, onSeekEnd: this.onVolumeSeekEnd, scale: this.props.scale, limitTimeTooltipBySides: !0, hideHoverTime: !0 })))), wt.createElement("div", { className: "player-mid-box-time" }, vM(Math.floor(o / 1e3)), " /", " ", vM(Math.floor(n / 1e3)))));
  }
}
function vM(r) {
  const n = r % 60, o = (r - n) / 60;
  if (o >= 60) {
    const l = o % 60;
    return `${Zh((o - l) / 60)}:${Zh(l)}:${Zh(n)}`;
  }
  return `${Zh(o)}:${Zh(n)}`;
}
function Zh(r) {
  return r <= 9 ? `0${r}` : `${r}`;
}
let GO = 99999;
var rS, Sd;
(Sd = rS || (rS = {}))[Sd.Idle = 0] = "Idle", Sd[Sd.Playing = 1] = "Playing", Sd[Sd.Paused = 2] = "Paused";
let ji = {};
function Gn(r, ...n) {
  mo.verbose && console.log(`[RTCEffect] ${r}`, ...n);
}
function XO(r, n, o) {
  function l(m) {
    ji[m].playState === 0 ? (r.playEffect(m, o, 0, 1, 0, 100, !1, 0).then(() => {
      Gn(">>> Play Success", { playingId: m });
    }), ji[m].playState = 1) : Gn(">>> Skip Play", { playingId: m, state: ji[m].playState });
  }
  function h(m) {
    ji[m].playState = 0, ji[m].previousVideoJSAdvance = 0, ji[m].previousSeekTargetTime = 0, ji[m].previousBeginSeekTime = 0;
  }
  n.one("ready", () => {
    var m;
    const w = ((m = n == null ? void 0 : n.tagAttributes) == null ? void 0 : m.src) || "";
    w.endsWith("mp3") || w.endsWith("wav") || w.endsWith("m4a") || (Gn(">>> Mute js player", { src: w }), n.muted(!0), n.muted = (S) => !1);
    const g = function() {
      const S = GO--, C = { playState: rS.Idle, previousVideoJSAdvance: 0, previousSeekTargetTime: 0, previousBeginSeekTime: 0 };
      return ji[S] = C, S;
    }();
    Gn(">>> Setup", { playingId: g, src: w }), r.addListener("error", (S) => {
      Gn(">>> Error", { soundId: S }), h(S);
    }), r.addListener("effectFinished", (S) => {
      Gn(">>> Finished", { soundId: S }), h(S);
    }), n.on("play", () => {
      switch (ji[g].playState) {
        case 0:
          Gn(">>> Start play", { playingId: g }), l(g);
          break;
        case 2:
          Gn(">>> Resume play", { playingId: g }), r.resumeEffect(g), ji[g].playState = 1;
      }
    }), n.on("pause", () => {
      const S = ji[g].playState;
      switch (S) {
        case 1:
          Gn(">>> Pause play", { playingId: g }), r.pauseEffect(g), ji[g].playState = 2;
          break;
        default:
          Gn(">>> Skip Pause", { playingId: g, currenState: S });
      }
    }), n.on("timeupdate", () => {
      r.getEffectCurrentPosition(g).then((S) => {
        const C = ji[g], I = S / 1e3, A = n.currentTime(), z = C.previousSeekTargetTime !== 0 && C.previousBeginSeekTime !== 0;
        if (Gn(`>>> EffectSecond rtc: ${I} js: ${A} seeking: ${z}`, { playingId: g }), C.playState == 0)
          return void (n.paused() || (Gn(">>> Play effect due to time update.", { playingId: g }), l(g)));
        if (z && I < C.previousSeekTargetTime)
          return;
        if (C.playState !== 1)
          return void Gn(">>> Skip timupdate", { playingId: g, state: C.playState, jsTime: n.currentTime(), rtcEffectTime: I });
        function F(q, Y) {
          r.setEffectPosition(Y, 1e3 * q), C.previousBeginSeekTime = Date.now() / 1e3, C.previousSeekTargetTime = q;
        }
        const j = C.previousBeginSeekTime;
        if (S > 0) {
          const q = A - I, Y = Math.abs(q), fe = 0.5;
          if (Y > fe)
            if (z) {
              const se = C.previousSeekTargetTime - I, Z = Date.now() / 1e3 - j, le = Z + (q > 0 ? q : 0), oe = A + le;
              F(oe, g), Gn(">>> Start seeking after seeking lag", { jsPlayerTime: A, rtcEffectTime: I, jsPlayerTimerAdvance: q, lastSeekingCost: Z, estimatedRTCLag: le, targetRTCSeekTime: oe, previousBeginSeekTime: j, timeElapse: se });
            } else if (Y > 10)
              F(A, g), Gn(">>> DirectSeek", { time: A, rtcEffectTime: I, jsPlayerTimerAdvance: q });
            else {
              const se = C.previousVideoJSAdvance, Z = 0, le = A + Z;
              C.previousVideoJSAdvance = Z, F(le, g), Gn(">>> Start seeking with lag", { jsPlayerTime: A, rtcEffectTime: I, jsPlayerTimerAdvance: q, previousAdvance: se, estimatedRTCLag: Z, targetRTCSeekTime: le });
            }
          else
            z && (Gn(">>> SeekingFinish no lag", { jsPlayerTime: A, rtcEffectTime: I, jsPlayerTimerAdvance: q, previousBeginSeekTime: j, rtcLagTolerance: fe }), C.previousBeginSeekTime = 0, C.previousSeekTargetTime = 0);
        }
      });
    }), n.on("dispose", () => {
      ji[g].playState && (r.stopEffect(g), delete ji[g], Gn(">>> Dispose", { playingId: g }));
    });
  });
}
class JO extends hl.exports.Component {
  constructor() {
    super(...arguments), this.putAttributes = (n) => {
      const { context: o } = this.props, l = o.getAttributes() || {};
      for (const h in n)
        l[h] !== n[h] && o.updateAttributes([h], n[h]);
    };
  }
  render() {
    const { context: n } = this.props, o = n.getRoom(), l = o ? void 0 : n.getDisplayer(), h = this.putAttributes;
    return wt.createElement(qO, { room: o, player: l, context: n, plugin: { putAttributes: h } });
  }
}
class qO extends hl.exports.Component {
  constructor(n) {
    super(n), this.alertMask = null, this.container = wt.createRef(), this.controllerHiddenTimer = 0, this.syncPlayerTimer = 0, this.retryCount = 0, this.decreaseRetryTimer = 0, this.noSoundSyncCount = 0, this.showController = () => {
      this.setState({ controllerVisible: !0 }), this.debounceHidingController();
    }, this.play = () => {
      var o;
      const l = (o = this.props.room) == null ? void 0 : o.calibrationTimestamp;
      this.debug(">>> play", { paused: !1, hostTime: l }), this.isEnabled() && this.props.plugin.putAttributes({ paused: !1, hostTime: l });
    }, this.pause = () => {
      const o = Zv(this.getAttributes(), this.props);
      this.debug(">>> pause", { paused: !0, currentTime: o }), this.isEnabled() && this.props.plugin.putAttributes({ paused: !0, currentTime: o });
    }, this.setVolume = (o) => {
      this.debug(">>> volume", { volume: o }), this.isEnabled() && this.props.plugin.putAttributes({ volume: o }), this.isEnabled() && this.props.plugin.putAttributes({ volume: o, muted: o === 0 });
    }, this.setCurrentTime = (o) => {
      var l;
      const h = (l = this.props.room) == null ? void 0 : l.calibrationTimestamp;
      this.debug(">>> seek", { currentTime: o / 1e3, hostTime: h }), this.isEnabled() && this.props.plugin.putAttributes({ currentTime: o / 1e3, hostTime: h });
    }, this.resetPlayer = () => {
      var o;
      (o = this.player) == null || o.autoplay(!1), this.state.NoSound || (this.debug(">>> ended", { paused: !0, currentTime: 0 }), this.isEnabled() && this.props.plugin.putAttributes({ paused: !0, currentTime: 0 }));
    }, this.syncPlayerWithAttributes = () => {
      var o;
      const l = this.getAttributes();
      if (!l)
        return;
      const h = this.player;
      if (!h || this.state.NoSound && (this.noSoundSyncCount += 1) % 8 != 0)
        return;
      h.paused() !== l.paused && (this.debug("<<< paused -> %o", l.paused), l.paused ? h.pause() : (o = h.play()) == null || o.catch(this.catchPlayFail)), h.muted() !== l.muted && (this.debug("<<< muted -> %o", l.muted), h.muted(l.muted)), h.volume() !== l.volume && (this.debug("<<< volume -> %o", l.volume), h.volume(l.volume));
      const m = Zv(l, this.props);
      let w = mo.currentTimeMaxError;
      this.state.NoSound && (w *= 3), m > h.duration() ? this.resetPlayer() : Math.abs(h.currentTime() - m) > w && (this.debug("<<< currentTime -> %o", m), h.currentTime(m));
    }, this.debounceHidingController = () => {
      this.controllerHiddenTimer && (clearTimeout(this.controllerHiddenTimer), this.controllerHiddenTimer = 0), this.controllerHiddenTimer = setTimeout(() => {
        this.setState({ controllerVisible: !1 }), this.controllerHiddenTimer = 0;
      }, 3e3);
    }, this.decreaseRetryCount = () => {
      this.player && this.retryCount > 0 && (this.retryCount = this.retryCount - 1);
    }, this.catchPlayFail = (o) => {
      var l, h;
      const m = String(o);
      if (NO && m.includes("NotAllowedError") || m.includes("interact"))
        (l = this.player) == null || l.autoplay("any"), this.setState({ NoSound: !0 });
      else {
        const w = (h = this.player) == null ? void 0 : h.error();
        w && (this.retryCount <= 3 ? (this.initPlayer(), this.retryCount = this.retryCount + 1) : (this.debug("catch videojs media error", w), this.setState({ MediaError: !0 }))), this.debug("catch error", o);
      }
    }, this.fixPlayFail = () => {
      this.debug("try to fix play state"), this.setState({ NoSound: !1 });
      const { muted: o, volume: l } = this.getAttributes();
      this.player && (this.player.muted(o), this.player.volume(l));
    }, this.initPlayer = async () => {
      var o;
      (o = this.player) == null || o.dispose(), this.player = void 0, this.debug("creating elements ...");
      const { type: l, src: h, poster: m } = this.getAttributes(), w = document.createElement("div");
      w.setAttribute("data-vjs-player", "");
      const g = document.createElement("video");
      g.className = "video-js", m && (g.poster = m), g.setAttribute("playsInline", ""), g.setAttribute("webkit-playsinline", "");
      const S = document.createElement("source");
      new URL(h).pathname.endsWith(".m3u8") ? S.type = "application/x-mpegURL" : g.src = h, S.src = h, l && (S.type = l), g.appendChild(S), w.appendChild(g), this.container.current.appendChild(w), await new Promise((A) => (window.requestAnimationFrame || window.setTimeout)(A)), this.debug("initializing videojs() ...");
      const C = aT(g);
      this.player = C, window.player = C, C.one("loadedmetadata", this.gracefullyUpdate);
      const I = window.__mediaPlayerAudioEffectClient;
      I !== void 0 && XO(I, C, h), C.on("ready", () => {
        var A;
        (A = mo.onPlayer) == null || A.call(mo, C), C.on("timeupdate", this.gracefullyUpdate), C.on("volumechange", this.gracefullyUpdate), C.on("seeked", this.gracefullyUpdate), C.on("play", this.gracefullyUpdate), C.on("pause", this.gracefullyUpdate), C.on("ended", this.resetPlayer);
      }), C.on("error", this.catchPlayFail), this.setState({ MediaError: !1 });
    }, this.gracefullyUpdate = () => this.setState({ updater: !this.state.updater }), this.setupAlert = (o) => {
      o && (o.addEventListener("touchstart", this.fixPlayFail), o.addEventListener("click", this.fixPlayFail)), this.alertMask = o;
    }, this.setupReload = (o) => {
      o && (o.addEventListener("touchstart", this.initPlayer), o.addEventListener("click", this.initPlayer));
    }, this.state = { NoSound: !1, MediaError: !1, updater: !1, controllerVisible: !1 }, n.room && function(o) {
      if (!o.calibrationTimestamp)
        throw new Error("@netless/app-media-player@0.1.0-alpha.5 requires white-web-sdk@^2.13.8 to work properly.");
    }(n.room);
  }
  getAttributes() {
    const { context: n } = this.props;
    let o = n.getAttributes();
    if (o) {
      if (o = Tr(Tr({}, QE), o), this.player) {
        let h = Zv(o, this.props), m = this.player.duration();
        !o.paused && h > m && (l = Tr({}, o), o = IO(l, AO({ currentTime: 0, paused: !0 })), this.resetPlayer());
      }
      var l;
      return o;
    }
  }
  isShowingPoster() {
    const n = this.getAttributes();
    return !(n != null && n.src) || kO.some((o) => n.src.endsWith(o));
  }
  render() {
    var n, o;
    if (!this.props.room && !this.props.player)
      return null;
    const l = this.getAttributes();
    if (!l)
      return null;
    const h = 1e3 * (((n = this.player) == null ? void 0 : n.duration()) || 1e3), m = ((o = this.player) == null ? void 0 : o.bufferedPercent()) || 0;
    return wt.createElement("div", { className: this.isEnabled() ? "vjs-p" : "vjs-p disabled", onMouseEnter: this.showController, onMouseMove: this.showController }, wt.createElement("div", { className: "video-js-plugin-player", ref: this.container }), this.isShowingPoster() && wt.createElement("div", { className: "video-js-plugin-poster" }, l.poster && wt.createElement("img", { src: l.poster, alt: "", draggable: !1 })), wt.createElement(YO, { duration: h, volume: l.volume, setVolume: this.setVolume, paused: l.paused, play: this.play, pause: this.pause, currentTime: 1e3 * Zv(l, this.props), setCurrentTime: this.setCurrentTime, buffered: h * m, visible: !0 }), this.state.NoSound && wt.createElement("div", { ref: this.setupAlert, className: "videojs-plugin-muted-alert" }), this.state.MediaError && wt.createElement("div", { className: "videojs-plugin-recovery-mode" }, wt.createElement("button", { ref: this.setupReload }, "Reload Player")));
  }
  debug(n, ...o) {
    mo.verbose && mo.log(`[MediaPlayer] ${n}`, ...o);
  }
  componentDidMount() {
    this.debug("app version =", "0.1.0-alpha.5"), this.debug("video.js version =", aT.VERSION), this.initPlayer(), this.props.context.emitter.on("attributesUpdate", this.syncPlayerWithAttributes), this.syncPlayerTimer = setInterval(this.syncPlayerWithAttributes, mo.syncInterval), this.decreaseRetryTimer = setInterval(this.decreaseRetryCount, mo.retryInterval);
  }
  componentWillUnmount() {
    var n;
    this.debug("unmount"), this.props.context.emitter.off("attributesUpdate", this.syncPlayerWithAttributes), (n = this.player) == null || n.dispose(), clearInterval(this.syncPlayerTimer), clearInterval(this.decreaseRetryTimer);
  }
  isEnabled() {
    return this.props.context.getIsWritable();
  }
}
const aS = { kind: "MediaPlayer", setup(r) {
  let n = r.getAttributes();
  if (!n || !n.src)
    return r.emitter.emit("destroy", { error: new Error("[MediaPlayer]: Missing 'attributes'.'src'.") });
  n = Tr(Tr({}, QE), n);
  const o = r.getBox();
  o.mountStyles(`.vjs-p{display:flex;flex-grow:1}.vjs-p *{pointer-events:auto}.vjs-p.disabled *{pointer-events:none}.vjs-p .video-js-plugin-poster{position:absolute;top:0;left:0;right:0;bottom:0;background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgQAAACACAYAAAB0vHFxAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAACBKADAAQAAAABAAAAgAAAAACE3oPTAAAKXUlEQVR4Ae3dYW4ktxEG0LW9FwkC2McycokAOUGAXMLwtQwYvomdP4akHUnNnm6SVUU+/xqpe8ji+yiDWz3a/e7L5v/98se//3pL8K9//O+7t19Hv85eX7RP9vnllz2h4/rkd+wz+ir/0cLfjv/9t1/6igABAgQIENhRwIFgx9StmQABAgQIPAg4EDyA+JIAAQIECOwo8HXHRVvzPIHRzwBHjz9PKudMo31Hj59TdZ2qsueXvb5sO0GHIFsi6iFAgAABAgECOgQB6KbsJ5Dtt0L6rWyPkeRXO+fs+WWvL1v6OgTZElEPAQIECBAIENAhCEA3ZT8Bzwj7WUaMJL8I9X5zZs8ve339kugzkg5BH0ejECBAgACB0gIOBKXjUzwBAgQIEOgj4EDQx9EoBAgQIECgtIADQen4FE+AAAECBPoIOBD0cTQKAQIECBAoLeC3DErHp/iWgE8Zt4RyX5df7nxa1Y3Ob/T4rfWtdl2HYLVErYcAAQIECFwQWL5DsPoJcvX1XdjTpd4iv1JxvStWfu9IfCORwLP7U4cgUXhKIUCAAAECUQIOBFHy5iVAgAABAokEHAgShaEUAgQIECAQJXD7MwTPPqOIWujVeUevb/T4V9ftfecE5HfOKetd8suajLoiBHQIItTNSYAAAQIEkgnc7hAkW0/3ckb/e9qjx+8OYsBvBOT3DUe5L+RXLjIFDxTQIRiIa2gCBAgQIFBFoNkh2P0Z2+j1jx4/+0asvv7q9d/dH9XXX73+3fO7u/7W+3fbHzoErR3hOgECBAgQ2ECg2SHwjG2DXRC4xOj9tdufAHpHLb/eonPHk9+xd7TPcXX9r+oQ9Dc1IgECBAgQKCfgQFAuMgUTIECAAIH+Ag4E/U2NSIAAAQIEygk0P0MQvaLsz3hb9bWu840WOJ5ffsc+2a/KL3tC6jsSmL1/dQiO0nCNAAECBAhsItDsEMw+oTzrHl1f61OorevPrvfZ+6N9WvVmr09+xwnKr7ZP9vyOdcdfze7Tuz4dgvF7ygwECBAgQCC9QLNDkH0F0X+C45NdoHZ99rf8aguofqRA7/8/6BCMTMvYBAgQIECgiED5DkHvZyhFcjtdJp/TVClvlF/KWE4XJb/TVG68INB7f+kQXAjBWwgQIECAwGoCDgSrJWo9BAgQIEDggoADwQU0byFAgAABAqsJfO39DGI1IOuJFbA/Y/3vzi6/u4Kx7189v7vru/v+2HTfz65D8N7EdwgQIECAwHYCw3/LYLUT1HY7pLFg+TaAkl+WX/KAGuXJrwEUfLlaPjoEwRvG9AQIECBAIIPA8A5B779JKQOaGl4F5PtqUfGV/Cqm9lqz/F4tMr6qlo8OQcZdpCYCBAgQIDBZYHiHoNozlMn+5aeTb+0I5Se/2gK5q6/286VDkHs/qY4AAQIECEwRcCCYwmwSAgQIECCQW8CBIHc+qiNAgAABAlMEhn+GYMoqTEKAAAEC7wSqPcN+twDfmCqgQzCV22QECBAgQCCnQHiHoPoJtlV/63rObfFaVfX6X1dy7VX19Vev/1pqr++qvv7q9b8m4dVHAtny1SH4KCXfI0CAAAECmwmEdwiq/U1Om+2PL/Kpnbj85FdbYO3qs/186hCsvd+sjgABAgQInBJwIDjF5CYCBAgQILC2gAPB2vlaHQECBAgQOCUQ/hmCbJ+yPKW20U3yqR22/ORXW2Dt6qN/Ph/n1yFYe79ZHQECBAgQOCXgQHCKyU0ECBAgQGBtAQeCtfO1OgIECBAgcErAgeAUk5sIECBAgMDaAg4Ea+drdQQIECBA4JTA1+///OGnoztd52N/fC7g58PPx+e748sX+8P+qLQ/dAiO0nKNAAECBAhsIuBAsEnQlkmAAAECBI4EHAiOdFwjQIAAAQKbCDgQbBK0ZRIgQIAAgSMBB4IjHdcIECBAgMAmAuH/lsHP//zvb5tYl1ymfErG9lK0/F4oSr6QX8nYThcdne/j/DoEp6NzIwECBAgQWFfAgWDdbK2MAAECBAicFnAgOE3lRgIECBAgsK5A+GcIfv39Pz++5X18pvH2mtfzBeQz37znjPLrqTl/LPnNN585Y7Z8dQhmpm8uAgQIECCQVCC8Q1C9I9Cqv3U96b54Kat6/S8Lufii+vqr138xtpe3VV9/9fpfgvDiQ4Fs+eoQfBiTbxIgQIAAgb0EwjsEe3FbLQECBOYJZPsT6LyVm+mKgA7BFTXvIUCAAAECiwk4ECwWqOUQIECAAIErAg4EV9S8hwABAgQILCYw/DMEnmEttmMeliPfB5BiX8qvWGAP5crvASTZl9Xy0SFItoGUQ4AAAQIEIgSGdwiy/U1MEcgrzynf2unKT361BXJXX+3nS4cg935SHQECBAgQmCIwvENQ7RnKFPWFJpFv7TDlJ7/aArmrr/bzpUOQez+pjgABAgQITBH4Wu0EM0XFJGkE7M80UVwqRH6X2NK8afX87q7v7vvTBP13IToE2RJRDwECBAgQCBBwIAhANyUBAgQIEMgm4ECQLRH1ECBAgACBAIHhv2Uwek2rPcPp7cWnt+jc8eQ317v3bPLrLWq8twK995cOwVtdrwkQIECAwKYC5TsE1f4mqNn7jM9s8b7zya+v5+zR5DdbfK/5eu8vHYK99o/VEiBAgACBDwWaHYLezyg+rOLGN6Pra53QWtdvLP3UW6N9WkVmr09+xwnKr7ZP9vyOdcdfze7Tuz4dgvF7ygwECBAgQCC9QLNDEL2C3ieg3utp1de63rueZ8fLXt+z6+l9f3af7PX1zuPZ8bL7ZK/vWW/39xWYvT90CPrmZzQCBAgQIFBSwIGgZGyKJkCAAAECfQUcCPp6Go0AAQIECJQUaH6GIPpT1iVVFX1aIHp/zX5GdxqmyI3yKxLUJ2XK7xOYv78d7XNcXf+rOgT9TY1IgAABAgTKCTQ7BLv/CWr0+kePn31HVl9/9frv7o/q669e/+753V1/6/277Q8dgtaOcJ0AAQIECGwg0OwQbGBwuMTRz5BGj3+4OBdvC8jvNmHoAPIL5Td5MgEdgmSBKIcAAQIECEQI3O4QrP6MZfT6Ro8fsal2mlN+tdOWX+38VN9XQIegr6fRCBAgQIBASQEHgpKxKZoAAQIECPQVcCDo62k0AgQIECBQUuD2Zwiyr3r1Z4Srry/7/rpbn/zuCsa+X36x/mY/Fnh2f+oQHHu6SoAAAQIEthBYvkOwRYoW+anAsyfkTwdyIURAfiHs3SYdnd/o8btBFBlIh6BIUMokQIAAAQIjBRwIRuoamwABAgQIFBFwICgSlDIJECBAgMBIAQeCkbrGJkCAAAECRQQcCIoEpUwCBAgQIDBSwG8ZjNQ19nABnzIeTjx0AvkN5R0+ePb8stc3PKAnJ9AheBLM7QQIECBAYEUBHYIVU91oTf49+9phy09+IwXsr+d0dQie83I3AQIECBBYUkCHYMlY8yxq9DO80ePnkYypZLTv6PFj1PaZNXt+2evLtlN0CLIloh4CBAgQIBAg4EAQgG5KAgQIECCQTcCBIFsi6iFAgAABAgEC/wdVfx9UuC8B6AAAAABJRU5ErkJggg==);background-repeat:repeat-x;background-position:0 50%;display:flex;align-items:center;justify-content:center}.vjs-p .video-js-plugin-poster img{box-shadow:0 0 5px 10px #0006}.vjs-p .player-controller,.vjs-p .videojs-plugin-muted-alert{pointer-events:auto}.vjs-p.disabled .videojs-plugin-close-icon,.vjs-p.disabled .player-controller{pointer-events:none}.vjs-p .video-js-plugin-player{position:absolute;top:0;left:0;right:0;bottom:0}.video-js,[data-vjs-player]{width:100%;height:100%}.vjs-p .videojs-plugin-muted-alert{pointer-events:auto;cursor:pointer;position:absolute;top:0;left:0;right:0;bottom:0;z-index:43}.vjs-p .videojs-plugin-muted-alert:before{pointer-events:auto;cursor:pointer;position:absolute;top:0;left:0;right:0;bottom:0;z-index:43;content:"\\f104";background:rgba(0,0,0,.3);font-family:VideoJS;font-size:2em;display:flex;align-items:center;justify-content:center;color:#fff}.vjs-p .videojs-plugin-recovery-mode{pointer-events:auto;cursor:pointer;position:absolute;top:0;left:0;right:0;bottom:0;z-index:44}.vjs-p .videojs-plugin-recovery-mode button{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}.vjs-p .seek-slider{position:relative;width:100%}.vjs-p .seek-slider:focus{outline:none}.vjs-p .seek-slider .track{padding:10px 0;cursor:pointer;outline:none}.vjs-p .seek-slider .track:focus{border:0;outline:none}.vjs-p .seek-slider .track .main{width:100%;height:3px;background-color:#ffffff4d;border-radius:30px;position:absolute;left:0;top:8.5px;transition:transform .4s;outline:none}.vjs-p .seek-slider .track .main:focus{border:0;outline:none}.vjs-p .seek-slider .track .main .buffered{position:absolute;background-color:#ffffff4d;width:100%;height:100%;transform:scaleX(.8);z-index:2;transform-origin:0 0}.vjs-p .seek-slider .track .main .seek-hover{position:absolute;background-color:#ffffff80;width:100%;height:100%;z-index:1;transform:scaleX(.6);transform-origin:0 0;opacity:0;transition:opacity .4s}.vjs-p .seek-slider .track .main .connect{position:absolute;background-color:#fff;width:100%;height:100%;z-index:3;left:0;transform:scaleX(.13);transform-origin:0 0}.vjs-p .seek-slider .track.active .main{transform:scaleY(2)}.vjs-p .seek-slider .thumb{pointer-events:none;position:absolute;width:12px;height:12px;left:-6px;top:4px;z-index:4;transform:translate(100px)}.vjs-p .seek-slider .thumb .handler{border-radius:100%;width:100%;height:100%;background-color:#fff;opacity:0;transform:scale(.4);cursor:pointer;transition:transform .2s;pointer-events:none}.vjs-p .seek-slider .thumb.active .handler{opacity:1;transform:scale(1)}.vjs-p .seek-slider .hover-time{position:absolute;background-color:#0000004d;line-height:18px;font-size:16px;color:#ddd;top:-25px;left:0;padding:5px 10px;border-radius:5px;box-shadow:0 0 5px #0000004d;opacity:0;transform:translate(150px);pointer-events:none}.vjs-p .seek-slider .hover-time.active{opacity:1}.vjs-p .seek-slider:hover .track .main .seek-hover{opacity:1}.vjs-p .player-controller{position:absolute;z-index:100;bottom:0px;left:0;width:100%;display:flex;flex-direction:column;justify-content:center;align-items:stretch;height:64px;background-image:linear-gradient(0deg,#000,transparent);transition:opacity .2s;color:#fff}.vjs-p .player-menu-box{display:flex;align-items:center;justify-content:center;flex-direction:column;margin-bottom:40px}.vjs-p .player-menu-cell{width:100%;text-align:center;font-size:12px;color:#7a7b7c}.vjs-p .player-multiple-play{width:64px;height:120px}.vjs-p .player-controller-actions-left{display:flex;justify-content:center;align-items:center;flex-shrink:0}.vjs-p .player-right-box{font-size:14px;color:#7a7b7c;cursor:pointer;margin-right:12px}.vjs-p .player-controller-actions{display:flex;flex-direction:row;justify-content:space-between;align-items:center;padding-left:8px;padding-right:8px;margin-top:2px}.vjs-p .player-mid-box-time{font-size:9px;display:flex;justify-content:center;align-items:center;color:#fff;flex-shrink:0;margin-right:8px;font-family:monospace}.vjs-p .player-controller-play{display:flex;align-items:center;justify-content:center;cursor:pointer;padding-right:4px}.vjs-p .player-controller-progress{width:calc(100% - 28px);margin-left:14px;display:flex;align-items:center;justify-content:center;margin-top:8px}.vjs-p .player-volume{display:flex;align-items:center;justify-content:center;cursor:pointer;margin-right:16px;margin-left:8px}.vjs-p .player-volume-slider{width:60px;margin-right:12px;display:flex;align-items:center}.vjs-p .player-volume-box{display:flex;flex-direction:row}.netless-app-media-player-container{display:flex;position:relative;height:100%}
`);
  const l = document.createElement("div");
  l.classList.add("netless-app-media-player-container"), cM.render(wt.createElement(JO, { context: r }), l), o.mountContent(l), r.emitter.on("destroy", () => {
    console.log("[MediaPlayer]: destroy"), cM.unmountComponentAtNode(l);
  });
} }, KO = () => {
  Wt.debug && YE({ verbose: !0 }), Wt.register({
    kind: nS.kind,
    src: nS
  }), Wt.register({
    kind: aS.kind,
    src: aS
  });
}, vL = {
  DocsViewer: nS.kind,
  MediaPlayer: aS.kind
};
var eL = /* @__PURE__ */ ((r) => (r.Init = "Init", r.AttributesUpdate = "AttributesUpdate", r.SetAttributes = "SetAttributes", r.RegisterMagixEvent = "RegisterMagixEvent", r.RemoveMagixEvent = "RemoveMagixEvent", r.RemoveAllMagixEvent = "RemoveAllMagixEvent", r.RoomStateChanged = "RoomStateChanged", r.DispatchMagixEvent = "DispatchMagixEvent", r.ReciveMagixEvent = "ReciveMagixEvent", r.NextPage = "NextPage", r.PrevPage = "PrevPage", r.SDKCreate = "SDKCreate", r.OnCreate = "OnCreate", r.SetPage = "SetPage", r.GetAttributes = "GetAttributes", r.Ready = "Ready", r.Destory = "Destory", r.StartCreate = "StartCreate", r.WrapperDidUpdate = "WrapperDidUpdate", r.DispayIframe = "DispayIframe", r.HideIframe = "HideIframe", r.GetRootRect = "GetRootRect", r.ReplayRootRect = "ReplayRootRect", r.PageTo = "PageTo", r))(eL || {}), tL = /* @__PURE__ */ ((r) => (r.WrapperDidMount = "WrapperDidMount", r.IframeLoad = "IframeLoad", r))(tL || {});
const al = {
  Ready: "Ready",
  RootRect: "ReplayRootRect",
  Message: "message",
  ComputeStyle: "computeStyle",
  Load: "load",
  DisplayerState: "displayerState",
  Show: "show",
  Hide: "hide"
}, nL = (r, n) => new Array(r).fill(0).map((o, l) => n(l)), dn = class {
  constructor(r, n) {
    this.manager = r, this.appManager = n, this.magixEventMap = /* @__PURE__ */ new Map(), this.cssList = [], this.allowAppliances = ["clicker"], this.bridgeDisposer = wM, this.rootRect = null, this.sideEffectManager = new kd(), this.execListenIframe = Ta((o) => {
      this.listenIframe(o);
    }, 50), this.onPhaseChangedListener = (o) => {
      o === rT.Playing && this.computedStyleAndIframeDisplay();
    }, this.stateChangeListener = (o) => {
      o = { ...o }, o.cameraState = this.manager.cameraState, this.postMessage({ kind: "RoomStateChanged", payload: o }), o.cameraState && (dn.emitter.emit("GetRootRect"), this.computedStyle(o)), o.memberState && (this.computedZindex(), this.updateStyle()), o.sceneState && this.computedIframeDisplay(o, this.attributes);
    }, this.displayer = dn.displayer = n.displayer, this.iframe = this._createIframe(), this.sideEffectManager.addDisposer(
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
        this.bridgeDisposer(), this.bridgeDisposer = xs(() => {
          var l;
          const o = this.attributes;
          if (o.url) {
            const h = (l = this.iframe) == null ? void 0 : l.src;
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
    const n = {
      url: r.url,
      width: r.width,
      height: r.height,
      displaySceneDir: r.displaySceneDir,
      useClicker: r.useClicker || !1,
      useSelector: r.useSelector
    };
    this.setAttributes(n);
    const o = () => {
      this.getIframe(), this.listenIframe(this.attributes), this.listenDisplayerState(), dn.emitter.emit("GetRootRect");
    };
    if (this.getIframe())
      o();
    else {
      const l = this.sideEffectManager.addDisposer(
        dn.emitter.on("WrapperDidMount", () => {
          o(), this.sideEffectManager.flush(l);
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
  scaleIframeToFit(r = sg.Immediately) {
    if (!this.inDisplaySceneDir)
      return;
    const { width: n = 1280, height: o = 720 } = this.attributes, l = n ? -n / 2 : 0, h = o ? -o / 2 : 0;
    this.manager.moveCameraToContain({
      originX: l,
      originY: h,
      width: n,
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
    const n = r.payload, o = this.displayer, l = o.entireScenes()[this.attributes.displaySceneDir];
    if (!l || l.length !== n) {
      const h = nL(n, (m) => ({
        name: String(m + 1)
      }));
      o.putScenes(this.attributes.displaySceneDir, h), this.manager.setMainViewScenePath(this.attributes.displaySceneDir);
    }
  }
  listenIframe(r) {
    const n = (o) => {
      var l;
      this.postMessage({
        kind: "Init",
        payload: {
          attributes: this.attributes,
          roomState: (l = dn.displayer) == null ? void 0 : l.state,
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
      n,
      void 0,
      al.Load
    );
  }
  listenDisplayerState() {
    this.isReplay && (this.displayer._phase === rT.Playing && this.computedStyleAndIframeDisplay(), this.sideEffectManager.add(() => (this.displayer.callbacks.on("onPhaseChanged", this.onPhaseChangedListener), () => this.displayer.callbacks.off("onPhaseChanged", this.onPhaseChangedListener)), al.DisplayerState)), this.computedStyleAndIframeDisplay();
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
    const n = this.manager.cameraState, o = this.attributes.width || 1280, l = this.attributes.height || 720;
    if (this.iframe) {
      const { width: h, height: m, scale: w, centerX: g, centerY: S } = n, C = this.rootRect || { x: 0, y: 0 }, I = `${h / 2 + C.x}px`, A = `${m / 2 + C.y}px`, z = `transform-origin: ${I} ${A};`, F = (h - o) / 2 * w, j = (m - l) / 2 * w, q = -(g * w) + F, Y = -(S * w) + j, fe = `transform: translate(${q}px,${Y}px) scale(${w}, ${w});`, ke = ["position: absolute;", "border: 0.1px solid rgba(0,0,0,0);", "top: 0px;", "left: 0px;", z, fe];
      this.cssList = ke, this.computedZindex(), this.updateStyle();
    }
  }
  computedIframeDisplay(r, n) {
    this.inDisplaySceneDir ? dn.emitter.emit("DispayIframe") : dn.emitter.emit("HideIframe");
  }
  computedZindex() {
    const r = "z-index: -1;", n = this.cssList.findIndex((o) => o === r);
    n !== -1 && this.cssList.splice(n, 1), (!this.isClicker() || this.isDisableInput) && this.cssList.push(r);
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
    const n = r.data;
    switch (n.kind) {
      case "SetAttributes": {
        this.handleSetAttributes(n);
        break;
      }
      case "RegisterMagixEvent": {
        this.handleRegisterMagixEvent(n);
        break;
      }
      case "RemoveMagixEvent": {
        this.handleRemoveMagixEvent(n);
        break;
      }
      case "DispatchMagixEvent": {
        this.handleDispatchMagixEvent(n);
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
        this.handleSetPage(n);
        break;
      }
      case "GetAttributes": {
        this.handleGetAttributes();
        break;
      }
      case "PageTo": {
        this.handlePageTo(n);
        break;
      }
      default: {
        Ca(`${n.kind} not allow event.`);
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
    const n = r.payload;
    this.appManager.safeDispatchMagixEvent(n.event, n.payload);
  }
  handleSetAttributes(r) {
    this.setAttributes(r.payload);
  }
  handleRegisterMagixEvent(r) {
    const n = r.payload, o = (l) => {
      l.authorId !== this.displayer.observerId && this.postMessage({ kind: "ReciveMagixEvent", payload: l });
    };
    this.magixEventMap.set(n, o), this.displayer.addMagixEventListener(n, o);
  }
  handleRemoveMagixEvent(r) {
    const n = r.payload, o = this.magixEventMap.get(n);
    this.displayer.removeMagixEventListener(n, o);
  }
  handleNextPage() {
    this.manager.canOperate && (this.manager.nextPage(), this.dispatchMagixEvent("NextPage", {}));
  }
  handlePrevPage() {
    this.manager.canOperate && (this.manager.prevPage(), this.dispatchMagixEvent("PrevPage", {}));
  }
  handlePageTo(r) {
    if (this.manager.canOperate) {
      const n = r.payload;
      if (!Number.isSafeInteger(n) || n <= 0)
        return;
      this.manager.setMainViewSceneIndex(n - 1), this.dispatchMagixEvent("PageTo", n - 1);
    }
  }
  handleRemoveAllMagixEvent() {
    this.magixEventMap.forEach((r, n) => {
      this.displayer.removeMagixEventListener(n, r);
    }), this.magixEventMap.clear();
  }
  handleGetAttributes() {
    this.postMessage({
      kind: "GetAttributes",
      payload: this.attributes
    });
  }
  postMessage(r) {
    var n;
    this.iframe && ((n = this.iframe.contentWindow) == null || n.postMessage(JSON.parse(JSON.stringify(r)), "*"));
  }
  dispatchMagixEvent(r, n) {
    this.manager.canOperate && (this.setAttributes({ lastEvent: { name: r, payload: n } }), this.displayer.dispatchMagixEvent(r, n));
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
let Pd = dn;
Pd.kind = "IframeBridge";
Pd.hiddenClass = "netless-iframe-brdige-hidden";
Pd.emitter = new Nd();
Pd.displayer = null;
Pd.alreadyCreate = !1;
function iL() {
  let r = /* @__PURE__ */ new Set();
  function n(w) {
    return r.add(w), () => {
      o(w);
    };
  }
  function o(w) {
    r.delete(w);
  }
  function l(...w) {
    r.forEach((g) => {
      g(...w);
    });
  }
  function h() {
    return Boolean(r.size);
  }
  function m() {
    r = /* @__PURE__ */ new Set();
  }
  return {
    runCallbacks: l,
    addCallback: n,
    removeCallback: o,
    hasCallbacks: h,
    removeAll: m
  };
}
const Gv = "scrollData", Xv = (r) => jb(r) && !Number.isNaN(r);
class rL {
  constructor(n) {
    this.baseScrollTop = 0, this.baseScrollLeft = 0, this.updateSize = () => {
      this.baseScrollTop = this._scrollingElement.scrollHeight - this._scrollingElement.clientHeight, this.baseScrollLeft = this._scrollingElement.scrollWidth - this._scrollingElement.clientWidth, this.scroll();
    }, this.dispatchScrollEvent = Ta(({ x: h, y: m }) => {
      var w;
      (w = this.manager.room) == null || w.dispatchMagixEvent(hg, { appId: this.appId, x: h, y: m });
    }, 200), this._sideEffect = new kd();
    const { createVal: o } = oN(this._sideEffect);
    this._scrollingElement = n.scrollElement, this.manager = n.manager, this.appId = n.appId, this.crood = o(this.getAttribute());
    const l = {
      $crood: this.crood
    };
    lN(this, l), this.updateSize(), this._sideEffect.addEventListener(this._scrollingElement, "scroll", this.onScroll.bind(this), !0), this.callbackManager = iL(), this.sizeObserver = new ResizeObserver(this.callbackManager.runCallbacks), this.callbackManager.addCallback(this.updateSize.bind(this)), this.sizeObserver.observe(this._scrollingElement), this.sizeObserver.observe(this._scrollingElement.firstElementChild), this.crood.reaction(() => {
      this.scroll();
    }), setTimeout(() => {
      this.updateSize(), this.scroll();
    });
  }
  onScroll() {
    if (this.manager.readonly)
      return;
    const { x: n, y: o } = this.calcLocalToCoord(this.getLocalCoord());
    this.dispatchScrollEvent({ x: n, y: o });
  }
  scroll() {
    if (!this._scrollingElement)
      return;
    const { x: n, y: o } = this.calcCoordToLocal();
    this._scrollingElement.scrollTo({ left: n, top: o, behavior: "instant" });
  }
  setCoord(n) {
    this.crood.setValue({
      x: Xv(n.x) ? n.x : this.crood.value.x,
      y: Xv(n.y) ? n.y : this.crood.value.y
    }), this.setAttribute();
  }
  setAttribute() {
    const n = this.manager.getAttributesValue([Gv]);
    n ? this.manager.updateAttributes([Gv], {
      ...n,
      [this.appId]: this.crood.value
    }) : this.manager.safeSetAttributes({
      [Gv]: { [this.appId]: this.crood.value }
    });
  }
  getAttribute() {
    const n = this.manager.getAttributesValue([Gv]);
    return (n == null ? void 0 : n[this.appId]) || { x: 0, y: 0 };
  }
  calcCoordToLocal() {
    if (!this._scrollingElement)
      return { x: 0, y: 0 };
    const { x: n, y: o } = this.crood.value;
    return { x: n * this.baseScrollLeft, y: o * this.baseScrollTop };
  }
  getLocalCoord() {
    return {
      x: this._scrollingElement.scrollLeft,
      y: this._scrollingElement.scrollTop
    };
  }
  calcLocalToCoord(n) {
    if (!this._scrollingElement)
      return { x: 0, y: 0 };
    const { x: o, y: l } = n, h = { x: 0, y: 0 };
    return Xv(o) && (h.x = Number((o / this.baseScrollLeft).toFixed(2))), Xv(l) && (h.y = Number((l / this.baseScrollTop).toFixed(2))), h;
  }
  destroy() {
    this._sideEffect.flushAll(), this.callbackManager.removeAll(), this.sizeObserver.disconnect();
  }
}
const hg = "windowMananerAppScrolling";
class aL {
  constructor({ manager: n }) {
    this.scrollers = [], this.manager = n, et.on(hg, this.onAppScrolling.bind(this));
  }
  onAppScrolling(n) {
    const {
      appId: o,
      x: l,
      y: h
    } = n;
    this.scrollTo(o, { x: l, y: h });
  }
  add(n) {
    if (this.scrollers.find((l) => l.appId == n.appId))
      return;
    const o = new rL(n);
    this.scrollers.push(o);
  }
  scrollTo(n, o) {
    const l = this.getScroller(n);
    !l || l.setCoord(o);
  }
  moveToCenter(n) {
    const o = { x: 0.5, y: 0.5 };
    if (n) {
      const l = this.getScroller(n);
      l && this.scrollTo(l == null ? void 0 : l.appId, o);
    } else
      this.scrollers.forEach((l) => this.scrollTo(l == null ? void 0 : l.appId, o));
  }
  getScroller(n) {
    if (!!n)
      return this.scrollers.find((o) => o.appId == n);
  }
  remove(n) {
    const o = this.getScroller(n);
    !o || (o.destroy(), this.scrollers = this.scrollers.filter((l) => l.appId != n));
  }
}
const sL = new K_({ emitter: et }), Jv = "mainView", Ve = class extends rN {
  constructor(r) {
    super(r), this.version = "1.0.42", this.dependencies = { dependencies: { "@juggle/resize-observer": "^3.3.1", "@netless/telebox-insider": "github:veytu/telebox-insider", emittery: "^0.9.2", lodash: "^4.17.21", "p-retry": "^4.6.1", uuid: "^7.0.3", "value-enhancer": "0.0.8", "video.js": ">=7" }, peerDependencies: { jspdf: "2.5.1", "white-web-sdk": "^2.16.52" }, devDependencies: { "@hyrious/dts": "^0.2.2", "@netless/app-docs-viewer": "github:veytu/app-docs-viewer", "@netless/app-media-player": "0.1.0-beta.9", "@rollup/plugin-commonjs": "^20.0.0", "@rollup/plugin-node-resolve": "^13.0.4", "@rollup/plugin-url": "^6.1.0", "@sveltejs/vite-plugin-svelte": "^1.4.0", "@tsconfig/svelte": "^2.0.1", "@types/debug": "^4.1.7", "@types/lodash": "^4.14.182", "@types/lodash-es": "^4.17.4", "@types/uuid": "^8.3.1", "@typescript-eslint/eslint-plugin": "^4.30.0", "@typescript-eslint/parser": "^4.30.0", "@vitest/ui": "^0.14.1", cypress: "^8.7.0", dotenv: "^10.0.0", eslint: "^7.32.0", "eslint-config-prettier": "^8.3.0", "eslint-plugin-svelte3": "^3.2.0", jsdom: "^19.0.0", jspdf: "^2.5.1", less: "^4.1.1", prettier: "^2.3.2", "prettier-plugin-svelte": "^2.4.0", "rollup-plugin-analyzer": "^4.0.0", "rollup-plugin-styles": "^3.14.1", "side-effect-manager": "0.1.5", svelte: "^3.42.4", typescript: "^4.5.5", vite: "^3.0.0", vitest: "^0.14.1", "white-web-sdk": "2.16.52" } }, this.emitter = Dt, this.viewMode = sl.Broadcaster, this.isReplay = lS(this.displayer), this._cursorUIDs = [], this._appReadonly = !1, this.containerSizeRatio = Ve.containerSizeRatio, Ve.displayer = r.displayer, window.NETLESS_DEPS = { dependencies: { "@juggle/resize-observer": "^3.3.1", "@netless/telebox-insider": "github:veytu/telebox-insider", emittery: "^0.9.2", lodash: "^4.17.21", "p-retry": "^4.6.1", uuid: "^7.0.3", "value-enhancer": "0.0.8", "video.js": ">=7" }, peerDependencies: { jspdf: "2.5.1", "white-web-sdk": "^2.16.52" }, devDependencies: { "@hyrious/dts": "^0.2.2", "@netless/app-docs-viewer": "github:veytu/app-docs-viewer", "@netless/app-media-player": "0.1.0-beta.9", "@rollup/plugin-commonjs": "^20.0.0", "@rollup/plugin-node-resolve": "^13.0.4", "@rollup/plugin-url": "^6.1.0", "@sveltejs/vite-plugin-svelte": "^1.4.0", "@tsconfig/svelte": "^2.0.1", "@types/debug": "^4.1.7", "@types/lodash": "^4.14.182", "@types/lodash-es": "^4.17.4", "@types/uuid": "^8.3.1", "@typescript-eslint/eslint-plugin": "^4.30.0", "@typescript-eslint/parser": "^4.30.0", "@vitest/ui": "^0.14.1", cypress: "^8.7.0", dotenv: "^10.0.0", eslint: "^7.32.0", "eslint-config-prettier": "^8.3.0", "eslint-plugin-svelte3": "^3.2.0", jsdom: "^19.0.0", jspdf: "^2.5.1", less: "^4.1.1", prettier: "^2.3.2", "prettier-plugin-svelte": "^2.4.0", "rollup-plugin-analyzer": "^4.0.0", "rollup-plugin-styles": "^3.14.1", "side-effect-manager": "0.1.5", svelte: "^3.42.4", typescript: "^4.5.5", vite: "^3.0.0", vitest: "^0.14.1", "white-web-sdk": "2.16.52" } };
  }
  static onCreate(r) {
    Ve._resolve(r);
  }
  static async mount(r) {
    var w, g, S, C;
    const n = r.room;
    Ve.container = r.container, Ve.supportAppliancePlugin = r.supportAppliancePlugin;
    const o = r.containerSizeRatio, l = r.debug, h = r.cursor;
    Ve.params = r, Ve.displayer = r.room, nk();
    let m;
    if (ol(n)) {
      if (n.phase !== ll.Connected)
        throw new Error("[WindowManager]: Room only Connected can be mount");
      n.phase === ll.Connected && n.isWritable && (n.disableSerialization = !1), m = await this.initManager(n);
    }
    if (Ve.isCreated)
      throw new Error("[WindowManager]: Already created cannot be created again");
    if (this.debug = Boolean(l), this.debug && YE({ verbose: !0 }), Ca("Already insert room", m), ol(this.displayer)) {
      if (!m)
        throw new Error("[WindowManager]: init InvisiblePlugin failed");
    } else
      await yM(
        async (I) => {
          if (m = n.getInvisiblePlugin(Ve.kind), !m)
            throw Ca(`manager is empty. retrying ${I}`), new Error();
        },
        { retries: 10, maxTimeout: 5e3 }
      );
    if (!m)
      throw new Error("[WindowManager]: create manager failed");
    o && (Ve.containerSizeRatio = o), await m.ensureAttributes(), m._fullscreen = r.fullscreen, m.appManager = new ek(m), m.appManager.polling = r.polling || !1, m._pageState = new q_(m.appManager), m.cursorManager = new J_(
      m.appManager,
      Boolean(h),
      r.cursorOptions,
      r.applianceIcons
    ), m.scrollerManager = new aL({ manager: m }), o && (m.containerSizeRatio = o), r.container && m.bindContainer(r.container), eP(n, m), et.emit("onCreated"), Ve.isCreated = !0;
    try {
      await pN();
    } catch (I) {
      console.warn("[WindowManager]: indexedDB open failed"), console.log(I);
    }
    return (w = m == null ? void 0 : m.room) == null || w.addMagixEventListener("onScaleChange", (I) => {
      m == null || m._setScale(I.payload);
    }), (g = m == null ? void 0 : m.room) == null || g.addMagixEventListener("onMainViewBackgroundImgChange", (I) => {
      m == null || m._setBackgroundImg(I.payload);
    }), (S = m == null ? void 0 : m.room) == null || S.addMagixEventListener("onMainViewBackgroundColorChange", (I) => {
      m == null || m._setBackgroundColor(I.payload);
    }), (C = m.room) == null || C.addMagixEventListener(hg, (I) => {
      et.emit(hg, I.payload);
    }), et.on("playgroundSizeChange", () => {
      m == null || m._updateMainViewWrapperSize();
    }), m._initAttribute(), m;
  }
  static initManager(r) {
    return ik(r);
  }
  static initContainer(r, n, o) {
    const { chessboard: l, overwriteStyles: h, fullscreen: m } = o;
    Ve.container || (Ve.container = n);
    const { playground: w, wrapper: g, sizer: S, mainViewElement: C, mainViewWrapperShadow: I, mainViewWrapper: A, extendWrapper: z, mainViewScrollWrapper: F } = tk(n);
    if (Ve.playground = w, l && S.classList.add("netless-window-manager-chess-sizer"), m && S.classList.add("netless-window-manager-fullscreen"), h) {
      const j = document.createElement("style");
      j.textContent = h, w.appendChild(j);
    }
    return r.containerResizeObserver = cS.create(
      w,
      S,
      g,
      et
    ), Ve.wrapper = g, Ve.sizer = S, Ve.mainViewWrapper = A, Ve.extendWrapper = z, Ve.mainViewScrollWrapper = F, Ve.mainViewWrapperShadow = I, C;
  }
  static get registered() {
    return qi.registered;
  }
  bindContainer(r) {
    var n, o, l, h, m, w, g;
    if (ol(this.displayer) && this.room.phase !== ll.Connected)
      throw new UN();
    if (Ve.isCreated && Ve.container)
      Ve.container.firstChild && r.appendChild(Ve.container.firstChild);
    else if (Ve.params) {
      const S = Ve.params, C = Ve.initContainer(this, r, S);
      this.boxManager && this.boxManager.destroy();
      const I = y_(this, Dt, et, po, {
        collectorContainer: S.collectorContainer,
        collectorStyles: S.collectorStyles,
        prefersColorScheme: S.prefersColorScheme
      });
      this.boxManager = I, (n = this.appManager) == null || n.setBoxManager(I), Ve.mainViewScrollWrapper && ((o = this.scrollerManager) == null || o.add({ appId: Jv, scrollElement: Ve.mainViewScrollWrapper, manager: this })), this.bindMainView(C, S.disableCameraTransform), Ve.wrapper && ((l = this.cursorManager) == null || l.setupWrapper(Ve.wrapper));
    }
    et.emit("updateManagerRect"), (h = this.appManager) == null || h.refresh(), (m = this.appManager) == null || m.resetMaximized(), (w = this.appManager) == null || w.resetMinimized(), (g = this.appManager) == null || g.displayerWritableListener(!this.room.isWritable), Ve.container = r;
  }
  bindCollectorContainer(r) {
    Ve.isCreated && this.boxManager ? this.boxManager.setCollectorContainer(r) : Ve.params && (Ve.params.collectorContainer = r);
  }
  static register(r) {
    return qi.register(r);
  }
  static unregister(r) {
    return qi.unregister(r);
  }
  async addApp(r) {
    if (this.appManager)
      return this.appManager.rootDirRemoving ? new Promise((n, o) => {
        et.once("rootDirRemoved").then(async () => {
          try {
            const l = await this._addApp(r);
            n(l);
          } catch (l) {
            o(l.message);
          }
        });
      }) : this._addApp(r);
    throw new vs();
  }
  async _addApp(r) {
    var n, o, l;
    if (this.appManager) {
      if (!r.kind || typeof r.kind != "string")
        throw new LN();
      r.src && typeof r.src == "string" && qi.register({ kind: r.kind, src: r.src });
      const h = await ((n = qi.appClasses.get(r.kind)) == null ? void 0 : n());
      if (h && ((o = h.config) == null ? void 0 : o.singleton) && this.appManager.appProxies.has(r.kind))
        throw new zN();
      const m = this.setupScenePath(r, this.appManager);
      return m === void 0 ? void 0 : ((l = r == null ? void 0 : r.options) != null && l.scenePath && (r.options.scenePath = kN(r.options.scenePath)), await this.appManager.addApp(r, Boolean(m)));
    } else
      throw new vs();
  }
  setupScenePath(r, n) {
    let o = !1;
    if (r.options) {
      const { scenePath: l, scenes: h } = r.options;
      if (l) {
        if (!NN(l))
          throw new jN();
        const m = Object.keys(this.apps || {});
        for (const w of m) {
          const g = n.store.getAppScenePath(w);
          if (g && g === l) {
            if (console.warn(`[WindowManager]: ScenePath "${l}" already opened`), this.boxManager) {
              const S = this.boxManager.getTopBox();
              S && (this.boxManager.setZIndex(w, S.zIndex + 1, !1), this.boxManager.focusBox({ appId: w }, !1));
            }
            return;
          }
        }
      }
      l && h && h.length > 0 && (this.isDynamicPPT(h) ? (o = !0, Ad(this.displayer)[l] || Jh(this.room, l, h)) : Ad(this.displayer)[l] || Jh(this.room, l, [{ name: h[0].name }])), l && h === void 0 && Jh(this.room, l, [{}]);
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
      const n = r == null ? void 0 : r.after, o = r == null ? void 0 : r.scene;
      if (n) {
        const l = this.mainViewSceneIndex + 1;
        this.room.putScenes(Cr, [o || {}], l);
      } else
        this.room.putScenes(Cr, [o || {}]);
    }
  }
  async removePage(r) {
    if (this.appManager) {
      const n = r === void 0 ? this.pageState.index : r;
      return this.pageState.length === 1 ? (console.warn("[WindowManager]: can not remove the last page"), !1) : n < 0 || n >= this.pageState.length ? (console.warn(`[WindowManager]: index ${r} out of range`), !1) : this.appManager.removeSceneByIndex(n);
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
    var n;
    this.readonly = r, (n = this.boxManager) == null || n.setReadonly(r), et.emit("setReadonly", r);
  }
  switchMainViewToWriter() {
    var r;
    return (r = this.appManager) == null ? void 0 : r.mainViewProxy.mainViewClickHandler();
  }
  onAppDestroy(r, n) {
    RN(`destroy-${r}`, n);
  }
  onAppEvent(r, n) {
    return et.on(`custom-${r}`, n);
  }
  setViewMode(r) {
    var n, o, l, h;
    (r === sl.Broadcaster || r === sl.Follower) && (this.canOperate && r === sl.Broadcaster && ((n = this.appManager) == null || n.mainViewProxy.setCameraAndSize()), (o = this.appManager) == null || o.mainViewProxy.start()), r === sl.Freedom && ((l = this.appManager) == null || l.mainViewProxy.stop()), this.viewMode = r, (h = this.appManager) == null || h.mainViewProxy.setViewMode(r);
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
    var n;
    !this.canOperate || (n = this.boxManager) == null || n.setMaximized(r, !1);
  }
  setMinimized(r) {
    var n;
    !this.canOperate || (n = this.boxManager) == null || n.setMinimized(r, !1);
  }
  setFullscreen(r) {
    var n;
    this._fullscreen !== r && (this._fullscreen = r, (n = Ve.sizer) == null || n.classList.toggle("netless-window-manager-fullscreen", r), Dt.emit("fullscreenChange", r));
  }
  get cursorUIDs() {
    return this._cursorUIDs;
  }
  setCursorUIDs(r) {
    var n, o;
    if (this._cursorUIDs = r || [], this._cursorUIDs.length === 0)
      (n = this._cursorUIDsStyleDOM) == null || n.remove();
    else {
      this._cursorUIDsStyleDOM || (this._cursorUIDsStyleDOM = document.createElement("style")), (o = Ve.playground) == null || o.appendChild(this._cursorUIDsStyleDOM);
      let l = "[data-cursor-uid] { display: none }";
      for (const h of this._cursorUIDs)
        l += `
[data-cursor-uid="${h}"] { display: flex }`;
      this._cursorUIDsStyleDOM.textContent = l;
    }
  }
  maximizedBoxNextPage() {
    var o, l;
    const r = this.getTopMaxBoxId();
    if (!r)
      return !1;
    const n = (o = this.appManager) == null ? void 0 : o.appProxies.get(r);
    return n ? (l = n == null ? void 0 : n.appContext) == null ? void 0 : l.nextPage() : !1;
  }
  maximizedBoxPrevPage() {
    var o, l;
    const r = this.getTopMaxBoxId();
    if (!r)
      return !1;
    const n = (o = this.appManager) == null ? void 0 : o.appProxies.get(r);
    return n ? (l = n == null ? void 0 : n.appContext) == null ? void 0 : l.prevPage() : !1;
  }
  getMaximizedBoxPageState() {
    var o, l;
    const r = this.getTopMaxBoxId();
    if (!r)
      return;
    const n = (o = this.appManager) == null ? void 0 : o.appProxies.get(r);
    if (!!n)
      return (l = n == null ? void 0 : n.appContext) == null ? void 0 : l.pageState;
  }
  getTopMaxBoxId() {
    var n, o;
    const r = (o = (n = this.appManager) == null ? void 0 : n.boxManager) == null ? void 0 : o.teleBoxManager.maximizedBoxes.filter((l) => {
      var h, m;
      return !((m = (h = this.appManager) == null ? void 0 : h.boxManager) != null && m.teleBoxManager.minimizedBoxes.includes(l));
    });
    if (!!(r != null && r.length))
      return r.reduce(
        (l, h) => {
          var m, w, g, S, C, I, A, z;
          return Number((S = (g = (w = (m = this.appManager) == null ? void 0 : m.boxManager) == null ? void 0 : w.getBox(l)) == null ? void 0 : g._zIndex$) == null ? void 0 : S.value) > Number((z = (A = (I = (C = this.appManager) == null ? void 0 : C.boxManager) == null ? void 0 : I.getBox(h)) == null ? void 0 : A._zIndex$) == null ? void 0 : z.value) ? l : h;
        }
      );
  }
  get mainView() {
    if (this.appManager)
      return this.appManager.mainViewProxy.view;
    throw new vs();
  }
  get camera() {
    if (this.appManager)
      return this.appManager.mainViewProxy.view.camera;
    throw new vs();
  }
  get cameraState() {
    if (this.appManager)
      return this.appManager.mainViewProxy.cameraState;
    throw new vs();
  }
  get apps() {
    var r;
    return (r = this.appManager) == null ? void 0 : r.store.apps();
  }
  get boxState() {
    var r;
    if (this.appManager)
      return (r = this.appManager.boxManager) == null ? void 0 : r.boxState;
    throw new vs();
  }
  get darkMode() {
    var r, n;
    return Boolean((n = (r = this.appManager) == null ? void 0 : r.boxManager) == null ? void 0 : n.darkMode);
  }
  get prefersColorScheme() {
    var r;
    if (this.appManager)
      return (r = this.appManager.boxManager) == null ? void 0 : r.prefersColorScheme;
    throw new vs();
  }
  get focused() {
    return this.attributes.focus;
  }
  get focusedView() {
    var r, n;
    return ((n = (r = this.appManager) == null ? void 0 : r.focusApp) == null ? void 0 : n.view) || this.mainView;
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
    throw new vs();
  }
  get topApp() {
    var r, n;
    return (n = (r = this.boxManager) == null ? void 0 : r.getTopBox()) == null ? void 0 : n.id;
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
    throw new vs();
  }
  get pageState() {
    if (this._pageState)
      return this._pageState.toObject();
    throw new vs();
  }
  get fullscreen() {
    return Boolean(this._fullscreen);
  }
  get extendWrapper() {
    return Ve.extendWrapper;
  }
  queryAll() {
    var r;
    return Array.from(((r = this.appManager) == null ? void 0 : r.appProxies.values()) || []);
  }
  queryOne(r) {
    var n;
    return (n = this.appManager) == null ? void 0 : n.appProxies.get(r);
  }
  async closeApp(r) {
    var n;
    return (n = this.appManager) == null ? void 0 : n.closeApp(r);
  }
  focusApp(r) {
    var o, l, h;
    const n = (o = this.boxManager) == null ? void 0 : o.getBox(r);
    n && ((l = this.boxManager) == null || l.focusBox({ appId: r }, !1), ((h = this.boxManager) == null ? void 0 : h.teleBoxManager).makeBoxTop(n, !1));
  }
  moveCamera(r) {
    var l;
    const n = sS(r, ["animationMode"]), o = { ...this.mainView.camera };
    rg({ ...o, ...n }, o) || (this.mainView.moveCamera(r), (l = this.appManager) == null || l.dispatchInternalEvent(Xt.MoveCamera, r), setTimeout(() => {
      var h;
      (h = this.appManager) == null || h.mainViewProxy.setCameraAndSize();
    }, 500));
  }
  moveCameraToContain(r) {
    var n;
    this.mainView.moveCameraToContain(r), (n = this.appManager) == null || n.dispatchInternalEvent(Xt.MoveCameraToContain, r), setTimeout(() => {
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
    var r, n, o, l, h;
    (r = this.containerResizeObserver) == null || r.disconnect(), (n = this.appManager) == null || n.destroy(), (o = this.cursorManager) == null || o.destroy(), Ve.container = void 0, Ve.wrapper = void 0, Ve.sizer = void 0, Ve.isCreated = !1, Ve.playground && ((l = Ve.playground.parentNode) == null || l.removeChild(Ve.playground)), Ve.params = void 0, (h = this._iframeBridge) == null || h.destroy(), this._iframeBridge = void 0, Ca("Destroyed");
  }
  bindMainView(r, n) {
    var o;
    this.appManager && (this.appManager.bindMainView(r, Boolean(n)), (o = this.cursorManager) == null || o.setMainViewDivElement(r));
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
    var n;
    this._appReadonly = r, (n = Ve.mainViewScrollWrapper) == null || n.classList.toggle("netless-window-manager-fancy-scrollbar-readonly", r);
  }
  safeSetAttributes(r) {
    var n;
    this.canOperate && ((n = this.room) == null || n.dispatchMagixEvent("Windowmanager_custom_attributes", r), this.setAttributes(r));
  }
  safeUpdateAttributes(r, n) {
    var o;
    this.canOperate && ((o = this.room) == null || o.dispatchMagixEvent("Windowmanager_custom_attributes", { keys: r, value: n }), this.updateAttributes(r, n));
  }
  setPrefersColorScheme(r) {
    var n, o;
    (o = (n = this.appManager) == null ? void 0 : n.boxManager) == null || o.setPrefersColorScheme(r);
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
  insertText(r, n, o) {
    var l;
    return ((l = this.focusedView) == null ? void 0 : l.insertText(r, n, o)) || "";
  }
  insertImage(r) {
    var n;
    return (n = this.focusedView) == null ? void 0 : n.insertImage(r);
  }
  completeImageUpload(r, n) {
    var o;
    return (o = this.focusedView) == null ? void 0 : o.completeImageUpload(r, n);
  }
  lockImage(r, n) {
    var o;
    return (o = this.focusedView) == null ? void 0 : o.lockImage(r, n);
  }
  lockImages(r) {
    var n;
    return (n = this.focusedView) == null ? void 0 : n.lockImages(r);
  }
  refresh() {
    var r;
    this._refresh(), (r = this.appManager) == null || r.dispatchInternalEvent(Xt.Refresh);
  }
  _refresh() {
    var r, n;
    (r = this.appManager) == null || r.mainViewProxy.rebind(), Ve.container && this.bindContainer(Ve.container), (n = this.appManager) == null || n.refresher.refresh();
  }
  setContainerSizeRatio(r) {
    if (!jb(r) || !(r > 0))
      throw new Error(
        `[WindowManager]: updateContainerSizeRatio error, ratio must be a positive number. but got ${r}`
      );
    Ve.containerSizeRatio = r, this.containerSizeRatio = r, et.emit("containerSizeRatioUpdate", r);
  }
  setScale(r, n) {
    this.room.dispatchMagixEvent("onScaleChange", { appId: r, scale: n });
  }
  _updateMainViewWrapperSize(r) {
    var l;
    const n = (l = Ve.wrapper) == null ? void 0 : l.getBoundingClientRect();
    if (!n)
      return !1;
    const o = r != null ? r : this.getAttributesValue("scale")[Jv];
    !Ve.mainViewWrapper || !Ve.mainViewWrapperShadow || (Ve.mainViewWrapper.style.width = `${(n == null ? void 0 : n.width) * o}px`, Ve.mainViewWrapper.style.height = `${(n == null ? void 0 : n.height) * o}px`, Ve.mainViewWrapperShadow.style.width = `${(n == null ? void 0 : n.width) * o}px`, Ve.mainViewWrapperShadow.style.height = `${(n == null ? void 0 : n.height) * o}px`, this.moveCamera({
      animationMode: sg.Immediately,
      scale: o,
      centerX: 0,
      centerY: 0
    }), this.room.disableCameraTransform = !0);
  }
  _setScale(r, n) {
    var m;
    const { appId: o, scale: l } = r;
    if (!jb(l))
      return !1;
    let h = l;
    return h < 1 && (h = 1), n || et.emit("onScaleChange", { appId: o, scale: h }), this.safeUpdateAttributes(["scale"], { ...this.getAttributesValue(["scale"]), [o]: h }), o == Jv && this._updateMainViewWrapperSize(h), h != 1 && ((m = this.scrollerManager) == null || m.moveToCenter(o)), !0;
  }
  getScale() {
    return this.getAttributesValue(["scale"]);
  }
  getAppScale(r) {
    return this.getAttributesValue(["scale"])[r];
  }
  isDynamicPPT(r) {
    var o, l;
    const n = (l = (o = r[0]) == null ? void 0 : o.ppt) == null ? void 0 : l.src;
    return n == null ? void 0 : n.startsWith("pptx://");
  }
  async ensureAttributes() {
    KD(this.attributes) && await TM(50), xa(this.attributes) && (this.attributes[xi.Apps] || this.safeSetAttributes({ [xi.Apps]: {} }), this.attributes[xi.Cursors] || this.safeSetAttributes({ [xi.Cursors]: {} }), this.attributes._mainScenePath || this.safeSetAttributes({ _mainScenePath: xM }), this.attributes._mainSceneIndex || this.safeSetAttributes({ _mainSceneIndex: 0 }), this.attributes[xi.Registered] || this.safeSetAttributes({ [xi.Registered]: {} }), this.attributes[xi.IframeBridge] || this.safeSetAttributes({ [xi.IframeBridge]: {} }), this.attributes.mainViewBackgroundColor || this.safeSetAttributes({ mainViewBackgroundColor: "" }), this.attributes.mainViewBackgroundImg || this.safeSetAttributes({ mainViewBackgroundImg: "" }), this.attributes.scale || this.safeSetAttributes({ scale: {
      [Jv]: 1
    } }));
  }
  getIframeBridge() {
    if (!this.appManager)
      throw new Error("[WindowManager]: should call getIframeBridge() after await mount()");
    return this._iframeBridge || (this._iframeBridge = new Pd(this, this.appManager)), this._iframeBridge;
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
    !Ve.mainViewWrapper || (Ve.mainViewWrapper.style.backgroundColor = r, this.safeUpdateAttributes(["mainViewBackgroundColor"], r));
  }
  _setBackgroundImg(r) {
    !Ve.mainViewWrapper || (Ve.mainViewWrapper.style.backgroundImage = `url(${r})`, this.safeUpdateAttributes(["mainViewBackgroundImg"], r));
  }
  _initAttribute() {
    if (this.attributes.mainViewBackgroundImg && this._setBackgroundImg(this.attributes.mainViewBackgroundImg), this.attributes.mainViewBackgroundColor && this._setBackgroundColor(this.attributes.mainViewBackgroundColor), this.attributes.scale) {
      const r = this.attributes.scale;
      Object.keys(r).forEach((n) => {
        this._setScale({ appId: n, scale: r[n] }), setTimeout(() => {
          var o;
          (o = this.scrollerManager) == null || o.moveToCenter(n);
        });
      });
    }
  }
};
let Wt = Ve;
Wt.kind = "WindowManager";
Wt.debug = !1;
Wt.containerSizeRatio = dN;
Wt.isCreated = !1;
Wt._resolve = (r) => {
};
KO();
export {
  zN as AppCreateError,
  vs as AppManagerNotInitError,
  mL as AppNotRegisterError,
  UN as BindContainerRoomPhaseInvalidError,
  VN as BoxManagerNotFoundError,
  BN as BoxNotCreatedError,
  vL as BuiltinApps,
  tL as DomEvents,
  Pd as IframeBridge,
  eL as IframeEvents,
  jN as InvalidScenePath,
  LN as ParamsInvalidError,
  ON as WhiteWebSDKInvalidError,
  Wt as WindowManager,
  AM as calculateNextIndex,
  Jv as mainViewField,
  sL as reconnectRefresher
};
//# sourceMappingURL=index.mjs.map
