import cM from "p-retry";
import Nd from "emittery";
import { debounce as xs, isEqual as tg, omit as tS, isObject as Ca, has as Nb, get as yn, size as UD, mapValues as VD, noop as dM, pick as HD, isNumber as kb, isEmpty as Gh, isInteger as WD, orderBy as FD, isFunction as xd, isString as jv, isNull as $D } from "lodash";
import { ScenePathType as Gv, UpdateEventKind as fM, listenUpdated as ng, unlistenUpdated as nS, reaction as lg, autorun as Ss, toJS as QD, listenDisposed as ZD, unlistenDisposed as YD, ViewMode as sl, AnimationMode as Pb, isPlayer as iS, isRoom as Du, WhiteVersion as GD, ApplianceNames as Rn, RoomPhase as Nu, PlayerPhase as qC, InvisiblePlugin as XD } from "white-web-sdk";
import { v4 as JD } from "uuid";
import { ResizeObserver as qD } from "@juggle/resize-observer";
import KC from "video.js";
var Gt = /* @__PURE__ */ ((r) => (r.AppMove = "AppMove", r.AppFocus = "AppFocus", r.AppResize = "AppResize", r.AppBoxStateChange = "AppBoxStateChange", r.GetAttributes = "GetAttributes", r.UpdateWindowManagerWrapper = "UpdateWindowManagerWrapper", r.InitReplay = "InitReplay", r.WindowCreated = "WindowCreated", r.SetMainViewScenePath = "SetMainViewScenePath", r.SetMainViewSceneIndex = "SetMainViewSceneIndex", r.SetAppFocusIndex = "SetAppFocusIndex", r.SwitchViewsToFreedom = "SwitchViewsToFreedom", r.MoveCamera = "MoveCamera", r.MoveCameraToContain = "MoveCameraToContain", r.CursorMove = "CursorMove", r.RootDirRemoved = "RootDirRemoved", r.Refresh = "Refresh", r.InitMainViewCamera = "InitMainViewCamera", r))(Gt || {});
const _b = "__WindowManger", ob = "__WindowMangerEnsureReconnected__";
var Xi = /* @__PURE__ */ ((r) => (r.Size = "size", r.Position = "position", r.SceneIndex = "SceneIndex", r.ZIndex = "zIndex", r))(Xi || {}), hM = /* @__PURE__ */ ((r) => (r.setBoxSize = "setBoxSize", r.setBoxMinSize = "setBoxMinSize", r.destroy = "destroy", r))(hM || {}), zb = /* @__PURE__ */ ((r) => (r.StartCreate = "StartCreate", r))(zb || {}), Ob = /* @__PURE__ */ ((r) => (r.Leave = "leave", r.Normal = "normal", r))(Ob || {});
const eT = "2.16.1", KD = 340 / 720, eN = 340 / 720, tN = 9 / 16, xr = "/", pM = "/init", mM = 50, Nt = new Nd();
class nN {
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
      Nt.emit("ready");
    }, mM), this.isEmit = !0;
  }
  empty() {
    this.list = [], this.clear();
  }
  destroy() {
    this.timer && this.clear();
  }
}
const Ke = new Nd(), iN = "__WindowManagerAppCache";
let np, tT;
const rN = async () => {
  np = await oN();
}, aN = (r, i) => {
  if (!!np)
    return uN(np, { kind: r, sourceCode: i });
}, sN = async (r) => np ? await lN(np, r) : null;
function oN() {
  return new Promise((r, i) => {
    const o = indexedDB.open(iN, 2);
    o.onerror = (c) => {
      i(c);
    }, o.onupgradeneeded = (c) => {
      const h = c.target.result;
      h.objectStoreNames.contains("apps") || (tT = h.createObjectStore("apps", { keyPath: "kind" }), tT.createIndex("kind", "kind", { unique: !0 }));
    }, o.onsuccess = () => {
      const c = o.result;
      r(c);
    };
  });
}
function lN(r, i) {
  return new Promise((o, c) => {
    const m = r.transaction(["apps"]).objectStore("apps").index("kind").get(i);
    m.onerror = (w) => c(w), m.onsuccess = () => {
      m.result ? o(m.result) : o(null);
    };
  });
}
function uN(r, i) {
  return new Promise((o, c) => {
    const h = r.transaction(["apps"], "readwrite").objectStore("apps").add(i);
    h.onsuccess = () => o(), h.onerror = () => c();
  });
}
const cN = "NetlessApp", dN = 1e4, fN = async (r) => {
  const i = await sN(r);
  if (i)
    return i.sourceCode;
  {
    const c = await (await mN(r, { timeout: dN })).text();
    return await aN(r, c), c;
  }
}, nT = (r, i) => {
  let o = Function(r + `
;return ${i}`)();
  return typeof o > "u" && (o = window[i]), o;
}, hN = async (r, i, o) => {
  const c = o || cN + i;
  Nt.emit("loadApp", { kind: i, status: "start" });
  let h;
  try {
    if (h = await fN(r), !h || h.length === 0)
      throw Nt.emit("loadApp", { kind: i, status: "failed", reason: "script is empty." }), new Error("[WindowManager]: script is empty.");
  } catch (m) {
    throw Nt.emit("loadApp", { kind: i, status: "failed", reason: m.message }), m;
  }
  return pN(h, c, i);
}, pN = (r, i, o) => {
  try {
    const c = nT(r, i);
    return Nt.emit("loadApp", { kind: o, status: "success" }), c;
  } catch (c) {
    if (c.message.includes("Can only have one anonymous define call per script file")) {
      const h = window.define;
      typeof h == "function" && h.amd && delete h.amd;
      const m = nT(r, i);
      return Nt.emit("loadApp", { kind: o, status: "success" }), m;
    }
    throw Nt.emit("loadApp", { kind: o, status: "failed", reason: c.message }), c;
  }
};
async function mN(r, i) {
  const { timeout: o = 1e4 } = i, c = new AbortController(), h = setTimeout(() => c.abort(), o), m = await fetch(r, {
    ...i,
    signal: c.signal,
    headers: {
      "content-type": "text/plain"
    }
  });
  return clearTimeout(h), m;
}
class vN {
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
      const h = await hN(o, i.kind, i.name);
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
const Ji = new vN(), gN = async (r) => {
  var o, c;
  const i = await ((o = Ji.appClasses.get(r)) == null ? void 0 : o());
  return i && ((c = i.config) == null ? void 0 : c.singleton) ? r : `${r}-${JD().replace("-", "").slice(0, 8)}`;
}, _u = (r, i) => {
  if (r.focusScenePath !== i)
    return r.focusScenePath = i, r;
}, Lb = (r, i) => {
  if (r && r.isWritable && r.state.sceneState.scenePath !== i) {
    const o = i === "/" ? "" : i;
    r.setScenePath(o);
  }
}, yN = (r, i, o) => {
  var c;
  if (r && i) {
    const m = (c = Ad(r)[i]) == null ? void 0 : c[o];
    if (m)
      return `${i}/${m.name}`;
  }
}, Bb = (r, i, o) => {
  r && r.scenePathType(i) !== Gv.None && r.removeScenes(i, o);
}, wN = (r, i) => {
  Ke.once(r).then(i);
};
xs(
  (r, i) => {
    r.emit("mainViewModeChange", i);
  },
  200
);
const bN = (r, i, o = 0) => {
  const c = Ad(r)[i];
  if (!c)
    return;
  const h = c[o];
  if (!h)
    return;
  const m = h.name;
  return i === xr ? `/${m}` : `${i}/${m}`;
}, Ad = (r) => r.entireScenes(), Xh = (r, i, o, c) => {
  var h;
  for (let m = 0; m < o.length; ++m)
    if ((h = o[m].name) != null && h.includes("/"))
      throw new Error("scenes name can not have '/'");
  return r == null ? void 0 : r.putScenes(i, o, c);
}, SN = (r) => r.startsWith("/"), lb = (r) => {
  const i = r.split("/");
  i.pop();
  let o = i.join("/");
  return o === "" && (o = "/"), o;
}, xN = (r) => r.endsWith("/") ? r.slice(0, -1) : r, iT = (r) => {
  const i = r.split(".").map((o) => o.padStart(2, "0")).join("");
  return parseInt(i);
}, vM = (r) => new Promise((i) => setTimeout(i, r)), CN = (r) => r.split("").reduce((o, c) => (c === xr && (o += 1), o), 0) === 1;
class TN {
  constructor(i) {
    this.manager = i, this.displayer = this.manager.displayer, this.mainMagixEventListener = (o) => {
      if (o.authorId !== this.displayer.observerId) {
        const c = o.payload;
        switch (c.eventName) {
          case Gt.AppMove: {
            this.appMoveHandler(c.payload);
            break;
          }
          case Gt.AppResize: {
            this.appResizeHandler(c.payload);
            break;
          }
          case Gt.AppBoxStateChange: {
            this.boxStateChangeHandler(c.payload);
            break;
          }
          case Gt.SetMainViewScenePath: {
            this.setMainViewScenePathHandler(c.payload);
            break;
          }
          case Gt.MoveCamera: {
            this.moveCameraHandler(c.payload);
            break;
          }
          case Gt.MoveCameraToContain: {
            this.moveCameraToContainHandler(c.payload);
            break;
          }
          case Gt.CursorMove: {
            this.cursorMoveHandler(c.payload);
            break;
          }
          case Gt.RootDirRemoved: {
            this.rootDirRemovedHandler();
            break;
          }
          case Gt.Refresh: {
            this.refreshHandler();
            break;
          }
          case Gt.InitMainViewCamera: {
            this.initMainViewCameraHandler();
            break;
          }
          case Gt.SetAppFocusIndex: {
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
      Nt.emit("boxStateChange", o);
    }, this.setMainViewScenePathHandler = ({ nextScenePath: o }) => {
      _u(this.manager.mainView, o), Nt.emit("mainViewScenePathChange", o);
    }, this.moveCameraHandler = (o) => {
      tg(tS(o, ["animationMode"]), { ...this.manager.mainView.camera }) || this.manager.mainView.moveCamera(o);
    }, this.moveCameraToContainHandler = (o) => {
      this.manager.mainView.moveCameraToContain(o);
    }, this.cursorMoveHandler = (o) => {
      Ke.emit("cursorMove", o);
    }, this.rootDirRemovedHandler = () => {
      this.manager.createRootDirScenesCallback(), this.manager.mainViewProxy.rebind(), Ke.emit("rootDirRemoved");
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
    this.displayer.addMagixEventListener(_b, this.mainMagixEventListener);
  }
  removeListeners() {
    this.displayer.removeMagixEventListener(_b, this.mainMagixEventListener);
  }
}
class MN extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: app duplicate exists and cannot be created again";
  }
}
class qO extends Error {
  constructor(i) {
    super(`[WindowManager]: app ${i} need register or provide src`);
  }
}
class vs extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: AppManager must be initialized";
  }
}
class EN extends Error {
  constructor(i) {
    super(`[WindowManager]: white-web-sdk version must large than ${i}`);
  }
}
class IN extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: kind must be a valid string";
  }
}
class AN extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: box need created";
  }
}
class RN extends Error {
  constructor() {
    super(...arguments), this.message = '[WindowManager]: ScenePath should start with "/"';
  }
}
class DN extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: boxManager not found";
  }
}
class NN extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: room phase only Connected can be bindContainer";
  }
}
const gM = "!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", kN = gM.length, rT = Array(20), Cd = () => {
  for (let r = 0; r < 20; r++)
    rT[r] = gM.charAt(Math.random() * kN);
  return rT.join("");
};
class lp {
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
const yM = (r) => (i, o) => {
  if (i !== void 0)
    if (ng) {
      const c = (h) => {
        h.map((w) => w.kind).includes(r) && o();
      };
      return ng(i, c), o(), () => nS(i, c);
    } else
      return lg(
        () => i,
        () => {
          o();
        },
        {
          fireImmediately: !0
        }
      );
}, wM = (r, i, o) => {
  let c = null;
  const h = lg(
    r,
    () => {
      c && (c(), c = null);
      const m = r();
      Ca(m) ? (c = () => nS(m, i), ng(m, i)) : o == null || o(m);
    },
    { fireImmediately: !0 }
  );
  return () => {
    c == null || c(), h();
  };
}, PN = yM(fM.Removed);
yM(fM.Inserted);
class _N {
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
const ub = Object.keys;
function aT(r) {
  return Boolean(Nb(r, "__isRef"));
}
function zN(r) {
  return { k: Cd(), v: r, __isRef: !0 };
}
const ba = "_WM-STORAGE_";
class sT {
  constructor(i, o, c) {
    if (this._sideEffect = new lp(), this._destroyed = !1, this._refMap = /* @__PURE__ */ new WeakMap(), this._lastValue = /* @__PURE__ */ new Map(), this.onStateChanged = new _N(), c && !Ca(c))
      throw new Error(`Default state for Storage ${o} is not an object.`);
    this._context = i, this.id = o || null, this._state = {};
    const h = this._getRawState(this._state);
    this._context.getIsWritable() && (this.id === null ? i.isAddApp && c && this.setState(c) : (h === this._state || !Ca(h)) && (yn(this._context.getAttributes(), [ba]) || this._context.updateAttributes([ba], {}), this._context.updateAttributes([ba, this.id], this._state), c && this.setState(c))), ub(h).forEach((m) => {
      if (!(this.id === null && m === ba))
        try {
          const w = Ca(h[m]) ? JSON.parse(JSON.stringify(h[m])) : h[m];
          aT(w) ? (this._state[m] = w.v, Ca(w.v) && this._refMap.set(w.v, w)) : this._state[m] = w;
        } catch (w) {
          console.error(w);
        }
    }), this._sideEffect.addDisposer(
      wM(
        () => this.id === null ? i.getAttributes() : yn(i.getAttributes(), [ba, this.id]),
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
      ub(i).reduce((o, c) => (Nb(this._state, c) || (o[c] = i[c]), o), {})
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
    const o = ub(i);
    o.length > 0 && o.forEach((c) => {
      const h = i[c];
      if (h !== this._state[c])
        if (h === void 0)
          this._lastValue.set(c, this._state[c]), delete this._state[c], this._setRawState(c, h);
        else {
          this._lastValue.set(c, this._state[c]), this._state[c] = h;
          let m = h;
          if (Ca(h)) {
            let w = this._refMap.get(h);
            w || (w = zN(h), this._refMap.set(h, w)), m = w;
          }
          this._setRawState(c, m);
        }
    });
  }
  emptyStorage() {
    if (!(UD(this._state) <= 0)) {
      if (this._destroyed) {
        console.error(new Error(`Cannot empty destroyed Storage "${this.id}".`));
        return;
      }
      if (!this._context.getIsWritable()) {
        console.error(new Error(`Cannot empty Storage "${this.id}" without writable access.`));
        return;
      }
      this.setState(VD(this._state, dM));
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
    return this.id === null ? (o = this._context.getAttributes()) != null ? o : i : yn(this._context.getAttributes(), [ba, this.id], i);
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
          const m = i[h], w = m.key;
          if (this.id === null && w === ba)
            continue;
          const g = Ca(m.value) ? JSON.parse(JSON.stringify(m.value)) : m.value;
          let x;
          switch (this._lastValue.has(w) && (x = this._lastValue.get(w), this._lastValue.delete(w)), m.kind) {
            case 2: {
              Nb(this._state, w) && (x = this._state[w], delete this._state[w]), c[w] = { oldValue: x };
              break;
            }
            default: {
              let T = g;
              if (aT(g)) {
                const { k: A, v: I } = g, z = this._state[w];
                Ca(z) && ((o = this._refMap.get(z)) == null ? void 0 : o.k) === A ? T = z : (T = I, Ca(I) && this._refMap.set(I, g));
              }
              T !== this._state[w] && (x = this._state[w], this._state[w] = T), c[w] = { newValue: T, oldValue: x };
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
class ON {
  constructor(i, o, c, h, m) {
    this.manager = i, this.boxManager = o, this.appId = c, this.appProxy = h, this.appOptions = m, this.mobxUtils = {
      autorun: Ss,
      reaction: lg,
      toJS: QD
    }, this.objectUtils = {
      listenUpdated: ng,
      unlistenUpdated: nS,
      listenDisposed: ZD,
      unlistenDisposed: YD
    }, this.store = this.manager.store, this.isReplay = this.manager.isReplay, this.getDisplayer = () => this.manager.displayer, this.getAttributes = () => this.appProxy.attributes, this.getScenes = () => {
      const w = this.store.getAppAttributes(this.appId);
      return w != null && w.isDynamicPPT ? this.appProxy.scenes : w == null ? void 0 : w.options.scenes;
    }, this.getView = () => this.appProxy.view, this.mountView = (w) => {
      const g = this.getView();
      g && (g.divElement = w, setTimeout(() => {
        var x;
        (x = this.getRoom()) == null || x.refreshViewSize(), Nt.emit("onAppViewMounted", { appId: this.appId, view: g });
      }, 1e3));
    }, this.getInitScenePath = () => this.manager.getAppInitPath(this.appId), this.getIsWritable = () => this.manager.canOperate, this.getBox = () => {
      const w = this.boxManager.getBox(this.appId);
      if (w)
        return w;
      throw new AN();
    }, this.getRoom = () => this.manager.room, this.setAttributes = (w) => {
      this.manager.safeSetAttributes({ [this.appId]: w });
    }, this.updateAttributes = (w, g) => {
      this.manager.attributes[this.appId] && this.manager.safeUpdateAttributes([this.appId, ...w], g);
    }, this.setScenePath = async (w) => {
      var g;
      !this.appProxy.box || (this.appProxy.setFullPath(w), (g = this.getRoom()) == null || g.setScenePath(w));
    }, this.getAppOptions = () => typeof this.appOptions == "function" ? this.appOptions() : this.appOptions, this.createStorage = (w, g) => {
      const x = new sT(this, w, g);
      return this.emitter.on("destroy", () => {
        x.destroy();
      }), x;
    }, this.dispatchMagixEvent = (...w) => {
      var x;
      const g = `${this.appId}:${w[0]}`;
      return (x = this.manager.room) == null ? void 0 : x.dispatchMagixEvent(g, w[1]);
    }, this.addMagixEventListener = (w, g, x) => {
      const T = `${this.appId}:${w}`;
      return this.manager.displayer.addMagixEventListener(
        T,
        g,
        x
      ), () => this.manager.displayer.removeMagixEventListener(
        T,
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
      const g = w == null ? void 0 : w.after, x = w == null ? void 0 : w.scene, T = this.appProxy.scenePath;
      if (!!T)
        if (g) {
          const A = this.pageState.index + 1;
          Xh(this.manager.room, T, [x || {}], A);
        } else
          Xh(this.manager.room, T, [x || {}]);
    }, this.removePage = async (w) => {
      const g = w === void 0 ? this.pageState.index : w;
      return this.pageState.length === 1 ? (console.warn("[WindowManager]: can not remove the last page"), !1) : g < 0 || g >= this.pageState.length ? (console.warn(`[WindowManager]: page index ${w} out of range`), !1) : this.appProxy.removeSceneByIndex(g);
    }, this.emitter = h.appEmitter, this.isAddApp = h.isAddApp;
  }
  get storage() {
    return this._storage || (this._storage = new sT(this)), this._storage;
  }
  get pageState() {
    return this.appProxy.pageState;
  }
  get kind() {
    return this.appProxy.kind;
  }
  dispatchAppEvent(i, o) {
    Ke.emit(`custom-${this.kind}`, {
      kind: this.kind,
      appId: this.appId,
      type: i,
      value: o
    });
  }
}
class LN {
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
var bi = /* @__PURE__ */ ((r) => (r.Apps = "apps", r.Focus = "focus", r.State = "state", r.BoxState = "boxState", r.MainViewCamera = "mainViewCamera", r.MainViewSize = "mainViewSize", r.Broadcaster = "broadcaster", r.Cursors = "cursors", r.Position = "position", r.CursorState = "cursorState", r.FullPath = "fullPath", r.Registered = "registered", r.IframeBridge = "iframeBridge", r))(bi || {});
class BN {
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
    return yn(this.attributes, ["apps"]);
  }
  get focus() {
    return yn(this.attributes, ["focus"]);
  }
  getAppAttributes(i) {
    return yn(this.apps(), [i]);
  }
  getAppState(i) {
    return yn(this.apps(), [i, "state"]);
  }
  getMaximized() {
    return yn(this.attributes, ["maximizedBoxes"]);
  }
  getMinimized() {
    return yn(this.attributes, ["minimizedBoxes"]);
  }
  setupAppAttributes(i, o, c) {
    this.attributes.apps || this.context.safeSetAttributes({ apps: {} });
    const m = ["scenePath", "title"];
    c || m.push("scenes");
    const w = HD(i.options, m), g = { kind: i.kind, options: w, isDynamicPPT: c };
    typeof i.src == "string" && (g.src = i.src), g.createdAt = Date.now(), this.context.safeUpdateAttributes(["apps", o], g), this.context.safeUpdateAttributes(["apps", o, "state"], {
      [Xi.Size]: {},
      [Xi.Position]: {},
      [Xi.SceneIndex]: 0
    });
  }
  updateAppState(i, o, c) {
    yn(this.attributes, ["apps", i, "state"]) && this.context.safeUpdateAttributes(["apps", i, "state", o], c);
  }
  cleanAppAttributes(i) {
    this.context.safeUpdateAttributes(["apps", i], void 0), this.context.safeSetAttributes({ [i]: void 0 }), this.attributes.focus === i && this.cleanFocus();
  }
  cleanFocus() {
    this.context.safeSetAttributes({ focus: void 0 });
  }
  getAppSceneIndex(i) {
    var o;
    return (o = this.getAppState(i)) == null ? void 0 : o[Xi.SceneIndex];
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
    return yn(this.attributes, ["mainViewCamera"]);
  }
  getMainViewSize() {
    return yn(this.attributes, ["mainViewSize"]);
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
    yn(this.attributes, ["cursors"]) || this.context.safeUpdateAttributes(["cursors"], {}), yn(this.attributes, ["cursors", i]) || this.context.safeUpdateAttributes(["cursors", i], {}), this.context.safeUpdateAttributes(["cursors", i, "position"], o);
  }
  updateCursorState(i, o) {
    yn(this.attributes, ["cursors", i]) || this.context.safeUpdateAttributes(["cursors", i], {}), this.context.safeUpdateAttributes(["cursors", i, "cursorState"], o);
  }
  getCursorState(i) {
    return yn(this.attributes, ["cursors", i, "cursorState"]);
  }
  cleanCursor(i) {
    this.context.safeUpdateAttributes(["cursors", i], void 0);
  }
  setMainViewFocusPath(i) {
    const o = this.getMainViewScenePath();
    o && _u(i, o);
  }
  getIframeBridge() {
    return yn(this.attributes, ["iframeBridge"]);
  }
  setIframeBridge(i) {
    if (Ca(i)) {
      const o = this.getIframeBridge();
      for (const c in i) {
        const h = i[c];
        o[c] !== h && this.context.safeUpdateAttributes(["iframeBridge", c], h);
      }
    }
  }
}
const jN = new BN({
  getAttributes: () => {
    throw new Error("getAttributes not implemented");
  },
  safeSetAttributes: () => {
    throw new Error("safeSetAttributes not implemented");
  },
  safeUpdateAttributes: () => {
    throw new Error("safeUpdateAttributes not implemented");
  }
}), Ta = (...r) => {
  Ht.debug && console.log("[WindowManager]:", ...r);
}, bM = (r, i) => {
  let o = 0;
  const c = i.length - 1;
  return r === i.index ? r === c ? o = r - 1 : o = i.index + 1 : o = i.index, o;
}, po = new Nd();
class rS {
  constructor(i, o, c, h) {
    var m;
    this.params = i, this.manager = o, this.boxManager = this.manager.boxManager, this.appProxies = this.manager.appProxies, this.viewManager = this.manager.viewManager, this.store = this.manager.store, this.status = "normal", this.getAppInitState = (w) => {
      var q, de;
      const g = this.store.getAppState(w);
      if (!g)
        return;
      const x = g == null ? void 0 : g[Xi.Position], T = this.store.focus, A = g == null ? void 0 : g[Xi.Size], I = g == null ? void 0 : g[Xi.SceneIndex], z = (q = this.attributes) == null ? void 0 : q.maximized, F = (de = this.attributes) == null ? void 0 : de.minimized, $ = g == null ? void 0 : g.zIndex;
      let J = { maximized: z, minimized: F, zIndex: $ };
      return x && (J = { ...J, id: w, x: x.x, y: x.y }), T === w && (J = { ...J, focus: !0 }), A && (J = { ...J, width: A.width, height: A.height }), I && (J = { ...J, sceneIndex: I }), J;
    }, this.appAttributesUpdateListener = (w) => {
      this.manager.refresher.add(w, () => Ss(() => {
        const g = this.manager.attributes[w];
        g && this.appEmitter.emit("attributesUpdate", g);
      })), this.manager.refresher.add(this.stateKey, () => Ss(() => {
        var x, T, A, I;
        const g = (x = this.appAttributes) == null ? void 0 : x.state;
        (g == null ? void 0 : g.zIndex) > 0 && g.zIndex !== ((T = this.box) == null ? void 0 : T.zIndex) && ((A = this.boxManager) == null || A.setZIndex(w, g.zIndex), (I = this.boxManager) == null || I.focusBox({ appId: w }));
      })), this.manager.refresher.add(`${w}-fullPath`, () => Ss(() => {
        var x;
        const g = (x = this.appAttributes) == null ? void 0 : x.fullPath;
        this.setFocusScenePathHandler(g), this._prevFullPath !== g && (this.notifyPageStateChange(), this._prevFullPath = g);
      }));
    }, this.setFocusScenePathHandler = xs((w) => {
      var g;
      this.view && w && w !== ((g = this.view) == null ? void 0 : g.focusScenePath) && (_u(this.view, w), Nt.emit("onAppScenePathChange", { appId: this.id, view: this.view }));
    }, 50), this.notifyPageStateChange = xs(() => {
      this.appEmitter.emit("pageStateChange", this.pageState);
    }, 50), this.kind = i.kind, this.id = c, this.stateKey = `${this.id}_state`, this.appProxies.set(this.id, this), this.appEmitter = new Nd(), this.appListener = this.makeAppEventListener(this.id), this.isAddApp = h, this.initScenes(), (m = this.params.options) != null && m.scenePath && this.createView(), this._pageState = new LN({
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
      return yn(this.appAttributes, [bi.FullPath]) || this.getFullScenePathFromScenes();
  }
  getFullScenePathFromScenes() {
    const i = yn(this.appAttributes, ["state", "SceneIndex"], 0), o = yN(this.manager.room, this.scenePath, i);
    return o && this.setFullPath(o), o;
  }
  setFullPath(i) {
    this.manager.safeUpdateAttributes(["apps", this.id, bi.FullPath], i);
  }
  async baseInsertApp(i = !1) {
    var m;
    const o = this.params;
    if (!o.kind)
      throw new Error("[WindowManager]: kind require");
    const c = await ((m = Ji.appClasses.get(o.kind)) == null ? void 0 : m()), h = Ji.registered.get(o.kind);
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
    return Ke.emit("updateManagerRect"), {
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
    if (Ta("setupApp", i, c, h), !this.boxManager)
      throw new DN();
    const w = new ON(this.manager, this.boxManager, i, this, m);
    this.appContext = w;
    try {
      Ke.once(`${i}${Gt.WindowCreated}`).then(async () => {
        var z;
        let I;
        o || (I = this.getAppInitState(i), (z = this.boxManager) == null || z.updateBoxState(I)), this.appEmitter.onAny(this.appListener), this.appAttributesUpdateListener(i), this.setViewFocusScenePath(), setTimeout(async () => {
          console.log("setup app", c);
          const F = await c.setup(w);
          this.appResult = F, Ji.notifyApp(this.kind, "created", { appId: i, result: F }), this.afterSetupApp(I), this.fixMobileSize(), Nt.emit("onAppSetup", i);
        }, mM);
      }), (g = this.boxManager) == null || g.createBox({
        appId: i,
        app: c,
        options: h,
        canOperate: this.manager.canOperate,
        smartPosition: this.isAddApp
      }), this.isAddApp && this.box && (this.store.updateAppState(i, Xi.ZIndex, this.box.zIndex), this.store.updateAppState(i, Xi.Size, {
        width: this.box.intrinsicWidth,
        height: this.box.intrinsicHeight
      }), this.boxManager.focusBox({ appId: i }, !1));
      const x = this.store.attributes.scale, T = this.store.attributes.mainViewBackgroundImg;
      let A = kb(x) ? x : 1;
      A < 1 && (A = 1), Ke.emit("onScaleChange", A), Ke.emit("onBackgroundImgChange", T);
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
    await new rS(c, this.manager, this.id, this.isAddApp).baseInsertApp(!0), (m = this.boxManager) == null || m.updateBoxState(o);
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
      var h, m, w, g;
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
            (w = this.boxManager) == null || w.setBoxTitle({ appId: i, title: c.title });
            break;
          }
          case hM.destroy: {
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
    this.manager.room && i && this.view && Lb(this.manager.room, i);
  }
  setViewFocusScenePath() {
    const i = this.getFullScenePath();
    return i && this.view && _u(this.view, i), i;
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
      const c = bM(i, this.pageState);
      return this.setSceneIndexWithoutSync(c), this.manager.dispatchInternalEvent(Gt.SetAppFocusIndex, {
        type: "app",
        appID: this.id,
        index: c
      }), setTimeout(() => {
        Bb(this.manager.room, o, i);
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
        await Ji.notifyApp(this.kind, "destroy", { appId: this.id }), await this.appEmitter.emit("destroy", { error: h });
      } catch (w) {
        console.error("[WindowManager]: notifyApp error", w.message, w.stack);
      }
      this.appEmitter.clearListeners(), Ke.emit(`destroy-${this.id}`, { error: h }), i && ((m = this.boxManager) == null || m.closeBox(this.id, c)), o && (this.store.cleanAppAttributes(this.id), this.scenePath && Bb(this.manager.room, this.scenePath)), this.appProxies.delete(this.id), this._pageState.destroy(), this.viewManager.destroyView(this.id), this.manager.appStatus.delete(this.id), this.manager.refresher.remove(this.id), this.manager.refresher.remove(this.stateKey), this.manager.refresher.remove(`${this.id}-fullPath`), this._prevFullPath = void 0;
    }
  }
  close() {
    return this.destroy(!0, !0, !1);
  }
}
class UN {
  constructor(i) {
    this.displayer = i, this.views = /* @__PURE__ */ new Map();
  }
  createView(i) {
    const o = SM(this.displayer);
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
const SM = (r) => {
  const i = r.views.createView();
  return VN(i), i;
}, VN = (r) => {
  r.setCameraBound({
    maxContentMode: () => 10,
    minContentMode: () => 0.1
  });
};
class HN {
  constructor(i) {
    this.manager = i, this.polling = !1, this.started = !1, this.mainViewIsAddListener = !1, this.store = this.manager.store, this.viewMode = this.manager.windowManger.viewMode, this.sideEffectManager = new lp(), this.syncCamera = () => {
      if (!this.polling || this.viewMode !== sl.Broadcaster)
        return;
      const { mainViewCamera: c } = this;
      c && c.id !== this.manager.uid && this.moveCameraSizeByAttributes();
    }, this.startListenWritableChange = () => {
      this.sideEffectManager.add(() => Ke.on("writableChange", (c) => {
        c && this.ensureCameraAndSize(), this.manager.room && this.syncMainView(this.manager.room);
      }));
    }, this.addCameraReaction = () => {
      this.manager.refresher.add(bi.MainViewCamera, this.cameraReaction);
    }, this.cameraReaction = () => lg(
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
      Nt.emit("cameraStateChange", this.cameraState), this.manager.room && this.manager.room.syncMainView && (clearTimeout(this._syncMainViewTimer), this._syncMainViewTimer = setTimeout(this.syncMainView, 100, this.manager.room)), this.ensureMainViewSize();
    }, this.syncMainView = (c) => {
      c.isWritable && c.syncMainView(this.mainView);
    }, this.setViewMode = (c) => {
      this.viewMode = c;
    }, this.mainView = this.createMainView(), this.moveCameraSizeByAttributes(), Ke.once("mainViewMounted").then(() => {
      this.addMainViewListener(), this.start(), this.ensureCameraAndSize(), this.startListenWritableChange();
    });
    const o = () => {
      this.sizeChangeHandler(this.mainViewSize);
    };
    this.sideEffectManager.add(() => Ke.on("playgroundSizeChange", o)), this.sideEffectManager.add(() => Ke.on("containerSizeRatioUpdate", this.onUpdateContainerSizeRatio)), this.sideEffectManager.add(() => Ke.on("startReconnect", () => {
      this.didRelease || this.mainView.release();
    })), this.sideEffectManager.setInterval(this.syncCamera, 1500);
  }
  ensureCameraAndSize() {
    this.viewMode === sl.Broadcaster && (!this.mainViewCamera || !this.mainViewSize) && (this.manager.dispatchInternalEvent(Gt.InitMainViewCamera), this.setCameraAndSize());
  }
  get mainViewCamera() {
    return this.store.getMainViewCamera();
  }
  get mainViewSize() {
    return this.store.getMainViewSize();
  }
  get didRelease() {
    return yn(this.view, ["didRelease"]);
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
    const i = SM(this.manager.displayer), o = this.store.getMainViewScenePath();
    return o && _u(i, o), i;
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
      return _u(this.view, i);
  }
  rebind() {
    const i = this.mainView.divElement, o = this.mainView.disableCameraTransform;
    this.stop(), this.didRelease || this.mainView.release(), this.removeMainViewListener(), this.mainView = this.createMainView(), this.mainView.disableCameraTransform = o, this.mainView.divElement = i, this.addMainViewListener(), this.start(), Nt.emit("onMainViewRebind", this.mainView);
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
      animationMode: Pb.Immediately
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
        animationMode: Pb.Immediately
      });
    }
  }
  stop() {
    this.removeCameraListener(), this.manager.refresher.remove(bi.MainViewCamera), this.manager.refresher.remove(bi.MainViewSize), this.started = !1;
  }
  destroy() {
    this.removeMainViewListener(), this.stop(), this.sideEffectManager.flushAll();
  }
}
class WN {
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
      Nt.emit("canRedoStepsChange", o);
    }, this.onCanUndoStepsUpdate = (o) => {
      Nt.emit("canUndoStepsChange", o);
    }, this.disposePrevFocusViewRedoUndoListeners = (o) => {
      let c;
      if (o === void 0)
        c = this.context.mainView();
      else {
        const h = this.context.getAppProxy(o);
        h && h.view && (c = h.view);
      }
      c && this.disposeViewCallbacks(c);
    }, Ke.on("focusedChange", (o) => {
      this.disposePrevFocusViewRedoUndoListeners(o.prev), setTimeout(() => {
        this.addRedoUndoListeners(o.focused);
      }, 0);
    }), Ke.on("rootDirRemoved", () => {
      this.disposePrevFocusViewRedoUndoListeners(i.focus()), this.addRedoUndoListeners(i.focus());
    }), this.addRedoUndoListeners(i.focus());
  }
  destroy() {
    this.disposePrevFocusViewRedoUndoListeners(this.context.focus());
  }
}
class FN {
  constructor(i) {
    this.windowManger = i, this.appProxies = /* @__PURE__ */ new Map(), this.appStatus = /* @__PURE__ */ new Map(), this.store = jN, this.isReplay = this.windowManger.isReplay, this.mainViewScenesLength = 0, this.callbacksNode = null, this.appCreateQueue = new nN(), this.sideEffectManager = new lp(), this.sceneState = null, this.rootDirRemoving = !1, this.onRemoveScenes = async (o) => {
      var h, m;
      const { scenePath: c } = o;
      if (c === xr) {
        await this.onRootDirRemoved(), this.dispatchInternalEvent(Gt.RootDirRemoved);
        return;
      }
      if (CN(c)) {
        let w = this.mainView.focusSceneIndex || 0, g = (h = this.callbacksNode) == null ? void 0 : h.scenes[w];
        g || (w = 0, g = (m = this.callbacksNode) == null ? void 0 : m.scenes[w]), g && this.setMainViewScenePath(`${xr}${g}`), await this.setMainViewSceneIndex(w);
      } else
        this.appProxies.forEach((w) => {
          w.onRemoveScene(c);
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
      this.callbacksNode && (this.callbacksNode.dispose(), o = !0), this.callbacksNode = this.displayer.createScenesCallback(xr, {
        onAddScene: this.onSceneChange,
        onRemoveScene: async (c, h) => {
          await this.onSceneChange(c), Ke.emit("rootDirSceneRemoved", h);
        }
      }), this.callbacksNode && (this.updateSceneState(this.callbacksNode), this.mainViewScenesLength = this.callbacksNode.scenes.length, o && this.emitMainViewScenesChange(this.callbacksNode.scenes.length));
    }, this.removeSceneByIndex = async (o) => {
      var m;
      const c = bM(o, this.windowManger.pageState);
      this.setSceneIndexWithoutSync(c), this.dispatchInternalEvent(Gt.SetAppFocusIndex, { type: "main", index: c });
      const h = (m = this.callbacksNode) == null ? void 0 : m.scenes[o];
      return setTimeout(() => {
        h && Bb(this.room, `${xr}${h}`, o);
      }, 100), new Promise((w, g) => {
        Ke.once("rootDirSceneRemoved").then((x) => {
          x === h && w(!0);
        }).catch((x) => {
          console.log(`[WindowManager]: removePage error: ${x}`), g(!1);
        });
      });
    }, this.setSceneIndexWithoutSync = (o) => {
      var h;
      const c = (h = this.callbacksNode) == null ? void 0 : h.scenes[o];
      c && this.mainViewProxy.setFocusScenePath(`${xr}${c}`);
    }, this.onSceneChange = (o) => (this.mainViewScenesLength = o.scenes.length, this.updateSceneState(o), this.emitMainViewScenesChange(this.mainViewScenesLength)), this.emitMainViewScenesChange = (o) => Promise.all([
      Nt.emit("mainViewScenesLengthChange", o),
      Ke.emit("changePageState")
    ]), this.updateSceneState = (o) => {
      const c = this.store.getMainViewSceneIndex() || 0;
      let h = o.scenes[c];
      h || (h = o.scenes[this.mainView.focusSceneIndex || 0]), this.sceneState = {
        scenePath: `${xr}${h}`,
        contextPath: o.path,
        index: c,
        scenes: o.scenes.map((m) => ({
          name: m
        })),
        sceneName: h
      }, Nt.emit("sceneStateChange", this.sceneState);
    }, this.onBoxMove = (o) => {
      this.dispatchInternalEvent(Gt.AppMove, o), this.store.updateAppState(o.appId, Xi.Position, {
        x: o.x,
        y: o.y
      }), Nt.emit("onBoxMove", o);
    }, this.onBoxResize = (o) => {
      o.width && o.height && (this.dispatchInternalEvent(Gt.AppResize, o), this.store.updateAppState(o.appId, Xi.Size, {
        width: o.width,
        height: o.height
      }), Nt.emit("onBoxResize", o));
    }, this.onBoxFocus = (o) => {
      this.windowManger.safeSetAttributes({ focus: o.appId }), Nt.emit("onBoxFocus", o);
    }, this.onBoxClose = (o) => {
      const c = this.appProxies.get(o.appId);
      c && c.destroy(!1, !0, !0, o.error), Nt.emit("onBoxClose", o);
    }, this.onBoxStateChange = (o) => {
      this.dispatchInternalEvent(Gt.AppBoxStateChange, o), Nt.emit("onBoxStateChange", o);
    }, this.addAppsChangeListener = () => {
      this.refresher.add("apps", () => wM(
        () => this.attributes.apps,
        () => {
          this.attributesUpdateCallback(this.attributes.apps);
        }
      ));
    }, this.addAppCloseListener = () => {
      this.refresher.add("appsClose", () => PN(this.attributes.apps, () => {
        this.onAppDelete(this.attributes.apps);
      }));
    }, this.onMainViewIndexChange = (o) => {
      o !== void 0 && this._prevSceneIndex !== o && (Nt.emit("mainViewSceneIndexChange", o), Ke.emit("changePageState"), this.callbacksNode && this.updateSceneState(this.callbacksNode), this._prevSceneIndex = o);
    }, this.onFocusChange = (o) => {
      var c;
      this._prevFocused !== o && (Nt.emit("focusedChange", o), Ke.emit("focusedChange", { focused: o, prev: this._prevFocused }), this._prevFocused = o, o !== void 0 && ((c = this.boxManager) == null || c.focusBox({ appId: o }), setTimeout(() => {
        const h = this.appProxies.get(o);
        h && Ji.notifyApp(h.kind, "focus", { appId: o });
      }, 0)));
    }, this.attributesUpdateCallback = xs(
      (o) => this._attributesUpdateCallback(o),
      100
    ), this._appIds = [], this.onRegisteredChange = (o) => {
      !o || Object.entries(o).forEach(([c, h]) => {
        Ji.appClasses.has(c) || Ji.register({
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
      }), Ke.emit("observerIdChange", this.displayer.observerId);
    }, this.displayerWritableListener = (o) => {
      var m, w;
      const c = !o, h = this.windowManger.readonly === void 0 || this.windowManger.readonly === !1;
      this.windowManger.readonly === void 0 ? (m = this.boxManager) == null || m.setReadonly(o) : (w = this.boxManager) == null || w.setReadonly(!(c && h)), this.appProxies.forEach((g) => {
        g.emitAppIsWritableChange();
      }), Ke.emit("writableChange", c);
    }, this.updateSceneIndex = () => {
      const o = this.store.getMainViewScenePath(), c = lb(o), h = Ad(this.displayer)[c];
      if (h.length) {
        const m = o.replace(c, "").replace("/", ""), w = h.findIndex((g) => g.name === m);
        WD(w) && w >= 0 && this.safeSetAttributes({ _mainSceneIndex: w });
      }
    }, this.updateRootDirRemoving = (o) => {
      this.rootDirRemoving = o;
    }, this.displayer = i.displayer, this.store.setContext({
      getAttributes: () => this.attributes,
      safeSetAttributes: (o) => this.safeSetAttributes(o),
      safeUpdateAttributes: (o, c) => this.safeUpdateAttributes(o, c)
    }), this.mainViewProxy = new HN(this), this.viewManager = new UN(this.displayer), this.appListeners = new TN(this), this.displayer.callbacks.on(this.eventName, this.displayerStateListener), this.appListeners.addListeners(), this.refresher = FO, this.refresher.setRoom(this.room), this.refresher.setContext({ emitter: Ke }), this.sideEffectManager.addDisposer(() => {
      var o, c;
      this.appCreateQueue.destroy(), this.mainViewProxy.destroy(), this.refresher.destroy(), this.viewManager.destroy(), (o = this.boxManager) == null || o.destroy(), (c = this.callbacksNode) == null || c.dispose();
    }), Ke.once("onCreated").then(() => this.onCreated()), Ke.on("onReconnected", () => this.onReconnected()), iS(this.displayer) && (Ke.on("seekStart", this.onPlayerSeekStart), Ke.on("seek", this.onPlayerSeekDone)), Ke.on("removeScenes", this.onRemoveScenes), Ke.on("setReadonly", this.onReadonlyChanged), this.createRootDirScenesCallback(), Ji.setSyncRegisterApp((o) => {
      this.safeUpdateAttributes([bi.Registered, o.kind], o);
    });
  }
  getMemberState() {
    var i;
    return ((i = this.room) == null ? void 0 : i.state.memberState) || { strokeColor: [0, 0, 0] };
  }
  async onRootDirRemoved(i = !0) {
    this.setMainViewScenePath(pM), this.createRootDirScenesCallback();
    for (const [o, c] of this.appProxies.entries())
      c.view && await this.closeApp(o, i);
    this.mainViewProxy.rebind(), Ke.emit("rootDirRemoved"), this.updateRootDirRemoving(!1);
  }
  get eventName() {
    return Du(this.displayer) ? "onRoomStateChanged" : "onPlayerStateChanged";
  }
  get attributes() {
    return this.windowManger.attributes;
  }
  get canOperate() {
    return this.windowManger.canOperate;
  }
  get room() {
    return Du(this.displayer) ? this.displayer : void 0;
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
  get uid() {
    var i;
    return ((i = this.room) == null ? void 0 : i.uid) || "";
  }
  getMainViewSceneDir() {
    const i = this.store.getMainViewScenePath();
    if (i)
      return lb(i);
    throw new Error("[WindowManager]: mainViewSceneDir not found");
  }
  async onCreated() {
    var i;
    if (await this.attributesUpdateCallback(this.attributes.apps), Ke.emit("updateManagerRect"), po.on("move", this.onBoxMove), po.on("resize", this.onBoxResize), po.on("focus", this.onBoxFocus), po.on("close", this.onBoxClose), po.on("boxStateChange", this.onBoxStateChange), this.addAppsChangeListener(), this.addAppCloseListener(), this.refresher.add("maximizedBoxes", () => Ss(() => {
      var c;
      const o = this.attributes.maximizedBoxes;
      (c = this.boxManager) == null || c.setMaximized(o);
    })), this.refresher.add("minimizedBoxes", () => Ss(() => {
      const o = this.attributes.minimizedBoxes;
      this.onMinimized(o);
    })), this.refresher.add("mainViewIndex", () => Ss(() => {
      const o = yn(this.attributes, "_mainSceneIndex");
      this.onMainViewIndexChange(o);
    })), this.refresher.add("focusedChange", () => Ss(() => {
      const o = yn(this.attributes, "focus");
      this.onFocusChange(o);
    })), this.refresher.add("registeredChange", () => Ss(() => {
      const o = yn(this.attributes, bi.Registered);
      this.onRegisteredChange(o);
    })), !this.attributes.apps || Object.keys(this.attributes.apps).length === 0) {
      const o = this.store.getMainViewScenePath();
      if (!o)
        return;
      this.resetScenePath(o);
    }
    this.displayerWritableListener(!((i = this.room) != null && i.isWritable)), this.displayer.callbacks.on("onEnableWriteNowChanged", this.displayerWritableListener), this._prevFocused = this.attributes.focus, this.sideEffectManager.add(() => {
      const o = new WN({
        mainView: () => this.mainViewProxy.view,
        focus: () => this.attributes.focus,
        getAppProxy: (c) => this.appProxies.get(c)
      });
      return () => o.destroy();
    });
  }
  notifyAppsChange(i) {
    (this._appIds.length !== i.length || !this._appIds.every((o) => i.includes(o))) && (this._appIds = i, Nt.emit("appsChange", i));
  }
  async _attributesUpdateCallback(i) {
    if (i && Ht.container) {
      const o = Object.keys(i);
      o.length === 0 && this.appCreateQueue.emitReady();
      const h = FD(
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
          const w = i[m];
          try {
            if (!this.attributes[m])
              throw new Error("appAttributes is undefined");
            this.appCreateQueue.push(() => (this.appStatus.set(m, zb.StartCreate), this.baseInsertApp(
              {
                kind: w.kind,
                options: w.options,
                isDynamicPPT: w.isDynamicPPT
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
    c.disableCameraTransform = o, c.divElement = i, c.focusScenePath || this.setMainViewFocusPath(), Ke.emit("mainViewMounted"), Nt.emit("onMainViewMounted", c);
  }
  setMainViewFocusPath(i) {
    var c;
    const o = i || this.store.getMainViewScenePath();
    if (o)
      return _u(this.mainView, o), ((c = this.mainView) == null ? void 0 : c.focusScenePath) === o;
  }
  resetScenePath(i) {
    this.displayer.state.sceneState.scenePath !== i && Lb(this.room, i);
  }
  async addApp(i, o) {
    Ta("addApp", i);
    const { appId: c, needFocus: h } = await this.beforeAddApp(i, o), m = await this.baseInsertApp(i, c, !0, h);
    return this.afterAddApp(m), m == null ? void 0 : m.id;
  }
  async beforeAddApp(i, o) {
    var w, g;
    const c = await gN(i.kind);
    this.appStatus.set(c, zb.StartCreate);
    const h = (w = i.attributes) != null ? w : {};
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
      }), this.store.updateAppState(i.id, Xi.ZIndex, c.zIndex);
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
    const m = new rS(i, this, o, c);
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
      if (lb(i) !== xr)
        throw new Error('[WindowManager]: main view scenePath must in root dir "/"');
      if (o === Gv.None)
        throw new Error(`[WindowManager]: ${i} not valid scene`);
      if (o === Gv.Page)
        await this._setMainViewScenePath(i);
      else if (o === Gv.Dir) {
        const h = bN(this.displayer, i);
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
      const c = (o = this.callbacksNode) == null ? void 0 : o.scenes[i], h = `${xr}${c}`;
      if (c)
        this.setMainViewFocusPath(h) && (this.store.setMainViewScenePath(h), this.store.setMainViewSceneIndex(i), this.dispatchSetMainViewScenePath(h));
      else
        throw new Error(`[WindowManager]: ${i} not valid index`);
    }
  }
  dispatchSetMainViewScenePath(i) {
    this.dispatchInternalEvent(Gt.SetMainViewScenePath, { nextScenePath: i }), Nt.emit("mainViewScenePathChange", i), Lb(this.room, i);
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
    this.safeDispatchMagixEvent(_b, {
      eventName: i,
      payload: o
    });
  }
  destroy() {
    this.displayer.callbacks.off(this.eventName, this.displayerStateListener), this.displayer.callbacks.off("onEnableWriteNowChanged", this.displayerWritableListener), this.appListeners.removeListeners(), po.clearListeners(), Ke.clearListeners(), this.appProxies.size && this.appProxies.forEach((i) => {
      i.destroy(!0, !1, !0);
    }), Nt.clearListeners(), this.sideEffectManager.flushAll(), this._prevFocused = void 0, this._prevSceneIndex = void 0;
  }
}
const $N = (r) => {
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
  const w = document.createElement("div");
  return w.className = "netless-window-manager-main-view", i.appendChild(o), o.appendChild(c), m.appendChild(w), h.appendChild(m), c.appendChild(h), r.appendChild(i), Ht.wrapper = c, { playground: i, wrapper: c, sizer: o, mainViewElement: w, mainViewWrapper: m };
}, QN = () => {
  if (iT(GD) < iT(eT))
    throw new EN(eT);
}, jb = (r, i) => {
  var m;
  const o = (r == null ? void 0 : r.state.roomMembers) || [];
  let c = -1, h;
  for (const w of o)
    ((m = w.payload) == null ? void 0 : m.uid) === i && c < w.memberId && (c = w.memberId, h = w);
  return h;
}, ZN = async (r) => {
  let i = r.getInvisiblePlugin(Ht.kind);
  if (i)
    return i;
  let o;
  const c = new Promise((T) => {
    Ht._resolve = o = T;
  });
  let h = !1;
  const m = YN(r);
  !r.isWritable && m && (h = !0, await cM(
    async (T) => {
      Ta(`switching to writable (x${T})`), await r.setWritable(!0);
    },
    { retries: 10, maxTimeout: 5e3 }
  )), r.isWritable ? (Ta("creating InvisiblePlugin..."), r.createInvisiblePlugin(Ht, {}).catch(console.warn)) : (m && console.warn("[WindowManager]: failed to switch to writable"), console.warn("[WindowManager]: waiting for others to create the plugin..."));
  const w = setTimeout(() => {
    console.warn("[WindowManager]: no one called createInvisiblePlugin() after 20 seconds");
  }, 2e4), g = setTimeout(() => {
    throw new Error("[WindowManager]: no one called createInvisiblePlugin() after 60 seconds");
  }, 6e4), x = setInterval(() => {
    i = r.getInvisiblePlugin(Ht.kind), i && (clearTimeout(g), clearTimeout(w), clearInterval(x), o(i), h && r.isWritable && setTimeout(() => r.setWritable(!1).catch(console.warn), 500));
  }, 200);
  return c;
}, YN = (r) => {
  try {
    const i = atob(r.roomToken.slice(12)), o = i.indexOf("&role=");
    return +i[o + 6] < 2;
  } catch (i) {
    return console.error(i), !1;
  }
}, GN = window.ResizeObserver || qD;
class aS {
  constructor(i) {
    this.emitter = i;
  }
  static create(i, o, c, h) {
    const m = new aS(h);
    return m.observePlaygroundSize(i, o, c), m;
  }
  observePlaygroundSize(i, o, c) {
    this.updateSizer(i.getBoundingClientRect(), o, c), this.containerResizeObserver = new GN((h) => {
      var w;
      const m = (w = h[0]) == null ? void 0 : w.contentRect;
      m && (this.updateSizer(m, o, c), this.emitter.emit("playgroundSizeChange", m));
    }), this.disposer = this.emitter.on("containerSizeRatioUpdate", () => {
      const h = i.getBoundingClientRect();
      this.updateSizer(h, o, c), this.emitter.emit("playgroundSizeChange", h);
    }), this.containerResizeObserver.observe(i);
  }
  updateSizer({ width: i, height: o }, c, h) {
    i && o && (o / i > Ht.containerSizeRatio ? (o = i * Ht.containerSizeRatio, c.classList.toggle("netless-window-manager-sizer-horizontal", !0)) : (i = o / Ht.containerSizeRatio, c.classList.toggle("netless-window-manager-sizer-horizontal", !1)), h.style.width = `${i}px`, h.style.height = `${o}px`);
  }
  disconnect() {
    var i;
    (i = this.containerResizeObserver) == null || i.disconnect(), xd(this.disposer) && (this.disposer(), this.disposer = void 0);
  }
}
var xM = { exports: {} };
(function(r) {
  var i = Object.prototype.hasOwnProperty, o = "~";
  function c() {
  }
  Object.create && (c.prototype = /* @__PURE__ */ Object.create(null), new c().__proto__ || (o = !1));
  function h(x, T, A) {
    this.fn = x, this.context = T, this.once = A || !1;
  }
  function m(x, T, A, I, z) {
    if (typeof A != "function")
      throw new TypeError("The listener must be a function");
    var F = new h(A, I || x, z), $ = o ? o + T : T;
    return x._events[$] ? x._events[$].fn ? x._events[$] = [x._events[$], F] : x._events[$].push(F) : (x._events[$] = F, x._eventsCount++), x;
  }
  function w(x, T) {
    --x._eventsCount === 0 ? x._events = new c() : delete x._events[T];
  }
  function g() {
    this._events = new c(), this._eventsCount = 0;
  }
  g.prototype.eventNames = function() {
    var T = [], A, I;
    if (this._eventsCount === 0)
      return T;
    for (I in A = this._events)
      i.call(A, I) && T.push(o ? I.slice(1) : I);
    return Object.getOwnPropertySymbols ? T.concat(Object.getOwnPropertySymbols(A)) : T;
  }, g.prototype.listeners = function(T) {
    var A = o ? o + T : T, I = this._events[A];
    if (!I)
      return [];
    if (I.fn)
      return [I.fn];
    for (var z = 0, F = I.length, $ = new Array(F); z < F; z++)
      $[z] = I[z].fn;
    return $;
  }, g.prototype.listenerCount = function(T) {
    var A = o ? o + T : T, I = this._events[A];
    return I ? I.fn ? 1 : I.length : 0;
  }, g.prototype.emit = function(T, A, I, z, F, $) {
    var J = o ? o + T : T;
    if (!this._events[J])
      return !1;
    var q = this._events[J], de = arguments.length, se, Z;
    if (q.fn) {
      switch (q.once && this.removeListener(T, q.fn, void 0, !0), de) {
        case 1:
          return q.fn.call(q.context), !0;
        case 2:
          return q.fn.call(q.context, A), !0;
        case 3:
          return q.fn.call(q.context, A, I), !0;
        case 4:
          return q.fn.call(q.context, A, I, z), !0;
        case 5:
          return q.fn.call(q.context, A, I, z, F), !0;
        case 6:
          return q.fn.call(q.context, A, I, z, F, $), !0;
      }
      for (Z = 1, se = new Array(de - 1); Z < de; Z++)
        se[Z - 1] = arguments[Z];
      q.fn.apply(q.context, se);
    } else {
      var ue = q.length, oe;
      for (Z = 0; Z < ue; Z++)
        switch (q[Z].once && this.removeListener(T, q[Z].fn, void 0, !0), de) {
          case 1:
            q[Z].fn.call(q[Z].context);
            break;
          case 2:
            q[Z].fn.call(q[Z].context, A);
            break;
          case 3:
            q[Z].fn.call(q[Z].context, A, I);
            break;
          case 4:
            q[Z].fn.call(q[Z].context, A, I, z);
            break;
          default:
            if (!se)
              for (oe = 1, se = new Array(de - 1); oe < de; oe++)
                se[oe - 1] = arguments[oe];
            q[Z].fn.apply(q[Z].context, se);
        }
    }
    return !0;
  }, g.prototype.on = function(T, A, I) {
    return m(this, T, A, I, !1);
  }, g.prototype.once = function(T, A, I) {
    return m(this, T, A, I, !0);
  }, g.prototype.removeListener = function(T, A, I, z) {
    var F = o ? o + T : T;
    if (!this._events[F])
      return this;
    if (!A)
      return w(this, F), this;
    var $ = this._events[F];
    if ($.fn)
      $.fn === A && (!z || $.once) && (!I || $.context === I) && w(this, F);
    else {
      for (var J = 0, q = [], de = $.length; J < de; J++)
        ($[J].fn !== A || z && !$[J].once || I && $[J].context !== I) && q.push($[J]);
      q.length ? this._events[F] = q.length === 1 ? q[0] : q : w(this, F);
    }
    return this;
  }, g.prototype.removeAllListeners = function(T) {
    var A;
    return T ? (A = o ? o + T : T, this._events[A] && w(this, A)) : (this._events = new c(), this._eventsCount = 0), this;
  }, g.prototype.off = g.prototype.removeListener, g.prototype.addListener = g.prototype.on, g.prefixed = o, g.EventEmitter = g, r.exports = g;
})(xM);
var Ub = xM.exports;
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
var ip = function() {
  return ip = Object.assign || function(i) {
    for (var o, c = 1, h = arguments.length; c < h; c++) {
      o = arguments[c];
      for (var m in o)
        Object.prototype.hasOwnProperty.call(o, m) && (i[m] = o[m]);
    }
    return i;
  }, ip.apply(this, arguments);
};
function sS(r, i) {
  var o = {};
  for (var c in r)
    Object.prototype.hasOwnProperty.call(r, c) && i.indexOf(c) < 0 && (o[c] = r[c]);
  if (r != null && typeof Object.getOwnPropertySymbols == "function")
    for (var h = 0, c = Object.getOwnPropertySymbols(r); h < c.length; h++)
      i.indexOf(c[h]) < 0 && Object.prototype.propertyIsEnumerable.call(r, c[h]) && (o[c[h]] = r[c[h]]);
  return o;
}
var cb = 0, CM = typeof window < "u" && window.requestAnimationFrame !== void 0 ? function(r) {
  return window.requestAnimationFrame(r);
} : function(r) {
  var i = Date.now(), o = Math.max(0, 16.7 - (i - cb));
  cb = i + o, setTimeout(function() {
    return r(cb);
  }, o);
}, XN = function(r) {
  var i = [], o = [], c = 0, h = !1, m = 0, w = /* @__PURE__ */ new WeakSet(), g = /* @__PURE__ */ new WeakSet(), x = {
    cancel: function(T) {
      var A = o.indexOf(T);
      w.add(T), A !== -1 && o.splice(A, 1);
    },
    process: function(T) {
      var A;
      if (h = !0, A = [o, i], i = A[0], o = A[1], o.length = 0, c = i.length, c) {
        var I;
        for (m = 0; m < c; m++)
          I = i[m], I(T), g.has(I) === !0 && !w.has(I) && (x.schedule(I), r(!0));
      }
      h = !1;
    },
    schedule: function(T, A, I) {
      A === void 0 && (A = !1), I === void 0 && (I = !1);
      var z = I && h, F = z ? i : o;
      w.delete(T), A && g.add(T), F.indexOf(T) === -1 && (F.push(T), z && (c = i.length));
    }
  };
  return x;
}, JN = 40, oT = 1 / 60 * 1e3, Xv = !0, rp = !1, Vb = !1, Zh = {
  delta: 0,
  timestamp: 0
}, oS = ["read", "update", "preRender", "render", "postRender"], qN = function(r) {
  return rp = r;
}, TM = /* @__PURE__ */ oS.reduce(function(r, i) {
  return r[i] = XN(qN), r;
}, {}), KN = /* @__PURE__ */ oS.reduce(function(r, i) {
  var o = TM[i];
  return r[i] = function(c, h, m) {
    return h === void 0 && (h = !1), m === void 0 && (m = !1), rp || tk(), o.schedule(c, h, m), c;
  }, r;
}, {}), ek = function(r) {
  return TM[r].process(Zh);
}, MM = function(r) {
  rp = !1, Zh.delta = Xv ? oT : Math.max(Math.min(r - Zh.timestamp, JN), 1), Xv || (oT = Zh.delta), Zh.timestamp = r, Vb = !0, oS.forEach(ek), Vb = !1, rp && (Xv = !1, CM(MM));
}, tk = function() {
  rp = !0, Xv = !0, Vb || CM(MM);
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
var Zr = function() {
  return Zr = Object.assign || function(i) {
    for (var o, c = 1, h = arguments.length; c < h; c++) {
      o = arguments[c];
      for (var m in o)
        Object.prototype.hasOwnProperty.call(o, m) && (i[m] = o[m]);
    }
    return i;
  }, Zr.apply(this, arguments);
}, EM = function(r, i) {
  return function(o) {
    return Math.max(Math.min(o, i), r);
  };
}, Jv = function(r) {
  return r % 1 ? Number(r.toFixed(5)) : r;
}, IM = /^(#[0-9a-f]{3}|#(?:[0-9a-f]{2}){2,4}|(rgb|hsl)a?\((-?[\d\.]+%?[,\s]+){2,3}\s*\/*\s*[\d\.]+%?\))$/i, ug = {
  test: function(r) {
    return typeof r == "number";
  },
  parse: parseFloat,
  transform: function(r) {
    return r;
  }
}, Jh = Zr(Zr({}, ug), { transform: EM(0, 1) }), Uv = Zr(Zr({}, ug), { default: 1 }), lS = function(r) {
  return {
    test: function(i) {
      return typeof i == "string" && i.endsWith(r) && i.split(" ").length === 1;
    },
    parse: parseFloat,
    transform: function(i) {
      return "" + i + r;
    }
  };
}, Au = lS("deg"), qh = lS("%"), ct = lS("px"), lT = Zr(Zr({}, qh), { parse: function(r) {
  return qh.parse(r) / 100;
}, transform: function(r) {
  return qh.transform(r * 100);
} }), nk = function(r) {
  return r.substring(r.indexOf("(") + 1, r.lastIndexOf(")"));
}, ik = EM(0, 255), Hb = function(r) {
  return r.red !== void 0;
}, Wb = function(r) {
  return r.hue !== void 0;
};
function rk(r) {
  return nk(r).replace(/(,|\/)/g, " ").split(/ \s*/);
}
var AM = function(r) {
  return function(i) {
    if (typeof i != "string")
      return i;
    for (var o = {}, c = rk(i), h = 0; h < 4; h++)
      o[r[h]] = c[h] !== void 0 ? parseFloat(c[h]) : 1;
    return o;
  };
}, ak = function(r) {
  var i = r.red, o = r.green, c = r.blue, h = r.alpha, m = h === void 0 ? 1 : h;
  return "rgba(" + i + ", " + o + ", " + c + ", " + m + ")";
}, sk = function(r) {
  var i = r.hue, o = r.saturation, c = r.lightness, h = r.alpha, m = h === void 0 ? 1 : h;
  return "hsla(" + i + ", " + o + ", " + c + ", " + m + ")";
}, db = Zr(Zr({}, ug), { transform: function(r) {
  return Math.round(ik(r));
} });
function uS(r, i) {
  return r.startsWith(i) && IM.test(r);
}
var qv = {
  test: function(r) {
    return typeof r == "string" ? uS(r, "rgb") : Hb(r);
  },
  parse: AM(["red", "green", "blue", "alpha"]),
  transform: function(r) {
    var i = r.red, o = r.green, c = r.blue, h = r.alpha, m = h === void 0 ? 1 : h;
    return ak({
      red: db.transform(i),
      green: db.transform(o),
      blue: db.transform(c),
      alpha: Jv(Jh.transform(m))
    });
  }
}, fb = {
  test: function(r) {
    return typeof r == "string" ? uS(r, "hsl") : Wb(r);
  },
  parse: AM(["hue", "saturation", "lightness", "alpha"]),
  transform: function(r) {
    var i = r.hue, o = r.saturation, c = r.lightness, h = r.alpha, m = h === void 0 ? 1 : h;
    return sk({
      hue: Math.round(i),
      saturation: qh.transform(Jv(o)),
      lightness: qh.transform(Jv(c)),
      alpha: Jv(Jh.transform(m))
    });
  }
}, uT = Zr(Zr({}, qv), { test: function(r) {
  return typeof r == "string" && uS(r, "#");
}, parse: function(r) {
  var i = "", o = "", c = "";
  return r.length > 4 ? (i = r.substr(1, 2), o = r.substr(3, 2), c = r.substr(5, 2)) : (i = r.substr(1, 1), o = r.substr(2, 1), c = r.substr(3, 1), i += i, o += o, c += c), {
    red: parseInt(i, 16),
    green: parseInt(o, 16),
    blue: parseInt(c, 16),
    alpha: 1
  };
} }), gs = {
  test: function(r) {
    return typeof r == "string" && IM.test(r) || Hb(r) || Wb(r);
  },
  parse: function(r) {
    return qv.test(r) ? qv.parse(r) : fb.test(r) ? fb.parse(r) : uT.test(r) ? uT.parse(r) : r;
  },
  transform: function(r) {
    return Hb(r) ? qv.transform(r) : Wb(r) ? fb.transform(r) : r;
  }
}, cS = function(r) {
  var i = r.onRead, o = r.onRender, c = r.uncachedValues, h = c === void 0 ? /* @__PURE__ */ new Set() : c, m = r.useCache, w = m === void 0 ? !0 : m;
  return function(g) {
    g === void 0 && (g = {});
    var x = sS(g, []), T = {}, A = [], I = !1;
    function z($, J) {
      $.startsWith("--") && (x.hasCSSVariable = !0);
      var q = T[$];
      T[$] = J, T[$] !== q && (A.indexOf($) === -1 && A.push($), I || (I = !0, KN.render(F.render)));
    }
    var F = {
      get: function($, J) {
        J === void 0 && (J = !1);
        var q = !J && w && !h.has($) && T[$] !== void 0;
        return q ? T[$] : i($, x);
      },
      set: function($, J) {
        if (typeof $ == "string")
          z($, J);
        else
          for (var q in $)
            z(q, $[q]);
        return this;
      },
      render: function($) {
        return $ === void 0 && ($ = !1), (I || $ === !0) && (o(T, x, A), I = !1, A.length = 0), this;
      }
    };
    return F;
  };
}, ok = /([a-z])([A-Z])/g, lk = "$1-$2", cg = function(r) {
  return r.replace(ok, lk).toLowerCase();
}, RM = /* @__PURE__ */ new Map(), dS = /* @__PURE__ */ new Map(), DM = ["Webkit", "Moz", "O", "ms", ""], uk = DM.length, ck = typeof document < "u", hb, NM = function(r, i) {
  return dS.set(r, cg(i));
}, dk = function(r) {
  hb = hb || document.createElement("div");
  for (var i = 0; i < uk; i++) {
    var o = DM[i], c = o === "", h = c ? r : o + r.charAt(0).toUpperCase() + r.slice(1);
    if (h in hb.style || c) {
      if (c && r === "clipPath" && dS.has(r))
        return;
      RM.set(r, h), NM(r, (c ? "" : "-") + cg(h));
    }
  }
}, fk = function(r) {
  return NM(r, r);
}, kM = function(r, i) {
  i === void 0 && (i = !1);
  var o = i ? dS : RM;
  return o.has(r) || (ck ? dk(r) : fk(r)), o.get(r) || r;
}, hk = ["", "X", "Y", "Z"], pk = ["translate", "scale", "rotate", "skew", "transformPerspective"], Fb = /* @__PURE__ */ pk.reduce(function(r, i) {
  return hk.reduce(function(o, c) {
    return o.push(i + c), o;
  }, r);
}, ["x", "y", "z"]), mk = /* @__PURE__ */ Fb.reduce(function(r, i) {
  return r[i] = !0, r;
}, {});
function fS(r) {
  return mk[r] === !0;
}
function vk(r, i) {
  return Fb.indexOf(r) - Fb.indexOf(i);
}
var gk = /* @__PURE__ */ new Set(["originX", "originY", "originZ"]);
function yk(r) {
  return gk.has(r);
}
var cT = /* @__PURE__ */ ip(/* @__PURE__ */ ip({}, ug), { transform: Math.round }), wk = {
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
  borderWidth: ct,
  borderTopWidth: ct,
  borderRightWidth: ct,
  borderBottomWidth: ct,
  borderLeftWidth: ct,
  borderRadius: ct,
  radius: ct,
  borderTopLeftRadius: ct,
  borderTopRightRadius: ct,
  borderBottomRightRadius: ct,
  borderBottomLeftRadius: ct,
  width: ct,
  maxWidth: ct,
  height: ct,
  maxHeight: ct,
  size: ct,
  top: ct,
  right: ct,
  bottom: ct,
  left: ct,
  padding: ct,
  paddingTop: ct,
  paddingRight: ct,
  paddingBottom: ct,
  paddingLeft: ct,
  margin: ct,
  marginTop: ct,
  marginRight: ct,
  marginBottom: ct,
  marginLeft: ct,
  rotate: Au,
  rotateX: Au,
  rotateY: Au,
  rotateZ: Au,
  scale: Uv,
  scaleX: Uv,
  scaleY: Uv,
  scaleZ: Uv,
  skew: Au,
  skewX: Au,
  skewY: Au,
  distance: ct,
  translateX: ct,
  translateY: ct,
  translateZ: ct,
  x: ct,
  y: ct,
  z: ct,
  perspective: ct,
  opacity: Jh,
  originX: lT,
  originY: lT,
  originZ: ct,
  zIndex: cT,
  fillOpacity: Jh,
  strokeOpacity: Jh,
  numOctaves: cT
}, hS = function(r) {
  return wk[r];
}, bk = function(r, i) {
  return i && typeof r == "number" ? i.transform(r) : r;
}, Kh = "scrollLeft", ep = "scrollTop", PM = /* @__PURE__ */ new Set([Kh, ep]), Sk = /* @__PURE__ */ new Set([Kh, ep, "transform"]), xk = {
  x: "translateX",
  y: "translateY",
  z: "translateZ"
};
function _M(r) {
  return typeof r == "function";
}
function Ck(r, i, o, c, h, m) {
  m === void 0 && (m = !0);
  var w = "", g = !1;
  o.sort(vk);
  for (var x = o.length, T = 0; T < x; T++) {
    var A = o[T];
    w += (xk[A] || A) + "(" + i[A] + ") ", g = A === "z" ? !0 : g;
  }
  return !g && h ? w += "translateZ(0)" : w = w.trim(), _M(r.transform) ? w = r.transform(i, c ? "" : w) : m && c && (w = "none"), w;
}
function Tk(r, i, o, c, h, m, w, g) {
  i === void 0 && (i = !0), o === void 0 && (o = {}), c === void 0 && (c = {}), h === void 0 && (h = {}), m === void 0 && (m = []), w === void 0 && (w = !1), g === void 0 && (g = !0);
  var x = !0, T = !1, A = !1;
  for (var I in r) {
    var z = r[I], F = hS(I), $ = bk(z, F);
    fS(I) ? (T = !0, c[I] = $, m.push(I), x && (F.default && z !== F.default || !F.default && z !== 0) && (x = !1)) : yk(I) ? (h[I] = $, A = !0) : (!Sk.has(I) || !_M($)) && (o[kM(I, w)] = $);
  }
  return (T || typeof r.transform == "function") && (o.transform = Ck(r, c, m, x, i, g)), A && (o.transformOrigin = (h.originX || "50%") + " " + (h.originY || "50%") + " " + (h.originZ || 0)), o;
}
function pS(r) {
  var i = r === void 0 ? {} : r, o = i.enableHardwareAcceleration, c = o === void 0 ? !0 : o, h = i.isDashCase, m = h === void 0 ? !0 : h, w = i.allowTransformNone, g = w === void 0 ? !0 : w, x = {}, T = {}, A = {}, I = [];
  return function(z) {
    return I.length = 0, Tk(z, c, x, T, A, I, m, g), x;
  };
}
function Mk(r, i) {
  var o = i.element, c = i.preparseOutput, h = hS(r);
  if (fS(r))
    return h && h.default || 0;
  if (PM.has(r))
    return o[r];
  var m = window.getComputedStyle(o, null).getPropertyValue(kM(r, !0)) || 0;
  return c && h && h.test(m) && h.parse ? h.parse(m) : m;
}
function Ek(r, i, o) {
  var c = i.element, h = i.buildStyles, m = i.hasCSSVariable;
  if (Object.assign(c.style, h(r)), m)
    for (var w = o.length, g = 0; g < w; g++) {
      var x = o[g];
      x.startsWith("--") && c.style.setProperty(x, r[x]);
    }
  o.indexOf(Kh) !== -1 && (c[Kh] = r[Kh]), o.indexOf(ep) !== -1 && (c[ep] = r[ep]);
}
var Ik = /* @__PURE__ */ cS({
  onRead: Mk,
  onRender: Ek,
  uncachedValues: PM
});
function Ak(r, i) {
  i === void 0 && (i = {});
  var o = i.enableHardwareAcceleration, c = i.allowTransformNone, h = sS(i, ["enableHardwareAcceleration", "allowTransformNone"]);
  return Ik(ip({ element: r, buildStyles: pS({
    enableHardwareAcceleration: o,
    allowTransformNone: c
  }), preparseOutput: !0 }, h));
}
var zM = /* @__PURE__ */ new Set(["baseFrequency", "diffuseConstant", "kernelMatrix", "kernelUnitLength", "keySplines", "keyTimes", "limitingConeAngle", "markerHeight", "markerWidth", "numOctaves", "targetX", "targetY", "surfaceScale", "specularConstant", "specularExponent", "stdDeviation", "tableValues"]), dT = 0.5, OM = function() {
  return {
    style: {}
  };
}, pb = function(r, i) {
  return ct.transform(r * i);
}, Rk = { x: 0, y: 0, width: 0, height: 0 };
function fT(r, i, o) {
  return typeof r == "string" ? r : ct.transform(i + o * r);
}
function Dk(r, i, o) {
  return fT(i, r.x, r.width) + " " + fT(o, r.y, r.height);
}
var LM = {
  enableHardwareAcceleration: !1,
  isDashCase: !1
};
function Nk(r, i, o, c, h, m) {
  i === void 0 && (i = Rk), c === void 0 && (c = pS(LM)), h === void 0 && (h = OM()), m === void 0 && (m = !0);
  var w = r.attrX, g = r.attrY, x = r.originX, T = r.originY, A = r.pathLength, I = r.pathSpacing, z = I === void 0 ? 1 : I, F = r.pathOffset, $ = F === void 0 ? 0 : F, J = sS(r, ["attrX", "attrY", "originX", "originY", "pathLength", "pathSpacing", "pathOffset"]), q = c(J);
  for (var de in q)
    if (de === "transform")
      h.style.transform = q[de];
    else {
      var se = m && !zM.has(de) ? cg(de) : de;
      h[se] = q[de];
    }
  return (x !== void 0 || T !== void 0 || q.transform) && (h.style.transformOrigin = Dk(i, x !== void 0 ? x : dT, T !== void 0 ? T : dT)), w !== void 0 && (h.x = w), g !== void 0 && (h.y = g), o !== void 0 && A !== void 0 && (h[m ? "stroke-dashoffset" : "strokeDashoffset"] = pb(-$, o), h[m ? "stroke-dasharray" : "strokeDasharray"] = pb(A, o) + " " + pb(z, o)), h;
}
function kk(r, i, o) {
  o === void 0 && (o = !0);
  var c = OM(), h = pS(LM);
  return function(m) {
    return Nk(m, r, i, h, c, o);
  };
}
var Pk = function(r) {
  return typeof r.getBBox == "function" ? r.getBBox() : r.getBoundingClientRect();
}, _k = function(r) {
  try {
    return Pk(r);
  } catch {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
}, zk = function(r) {
  return r.tagName === "path";
}, Ok = /* @__PURE__ */ cS({
  onRead: function(r, i) {
    var o = i.element;
    if (r = zM.has(r) ? r : cg(r), fS(r)) {
      var c = hS(r);
      return c && c.default || 0;
    } else
      return o.getAttribute(r);
  },
  onRender: function(r, i) {
    var o = i.element, c = i.buildAttrs, h = c(r);
    for (var m in h)
      m === "style" ? Object.assign(o.style, h.style) : o.setAttribute(m, h[m]);
  }
}), Lk = function(r) {
  var i = _k(r), o = zk(r) && r.getTotalLength ? r.getTotalLength() : void 0;
  return Ok({
    element: r,
    buildAttrs: kk(i, o)
  });
}, Bk = /* @__PURE__ */ cS({
  useCache: !1,
  onRead: function(r) {
    return r === "scrollTop" ? window.pageYOffset : window.pageXOffset;
  },
  onRender: function(r) {
    var i = r.scrollTop, o = i === void 0 ? 0 : i, c = r.scrollLeft, h = c === void 0 ? 0 : c;
    return window.scrollTo(h, o);
  }
}), $b = /* @__PURE__ */ new WeakMap(), jk = function(r) {
  return r instanceof HTMLElement || typeof r.click == "function";
}, Uk = function(r) {
  return r instanceof SVGElement || "ownerSVGElement" in r;
}, Vk = function(r, i) {
  var o;
  return r === window ? o = Bk(r) : jk(r) ? o = Ak(r, i) : Uk(r) && (o = Lk(r)), $b.set(r, o), o;
}, Hk = function(r, i) {
  return $b.has(r) ? $b.get(r) : Vk(r, i);
};
function Wk(r, i) {
  var o = typeof r == "string" ? document.querySelector(r) : r;
  return Hk(o, i);
}
var xa = function(i, o, c, h) {
  var m = c ? c.call(h, i, o) : void 0;
  if (m !== void 0)
    return !!m;
  if (i === o)
    return !0;
  if (typeof i != "object" || !i || typeof o != "object" || !o)
    return !1;
  var w = Object.keys(i), g = Object.keys(o);
  if (w.length !== g.length)
    return !1;
  for (var x = Object.prototype.hasOwnProperty.bind(o), T = 0; T < w.length; T++) {
    var A = w[T];
    if (!x(A))
      return !1;
    var I = i[A], z = o[A];
    if (m = c ? c.call(h, I, z, A) : void 0, m === !1 || m === void 0 && I !== z)
      return !1;
  }
  return !0;
};
const BM = "!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", Fk = BM.length, hT = Array(20), Td = () => {
  for (let r = 0; r < 20; r++)
    hT[r] = BM.charAt(Math.random() * Fk);
  return hT.join("");
};
class ap {
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
var $k = Object.defineProperty, mb = (typeof require < "u" && require, (r, i, o) => (((c, h, m) => {
  h in c ? $k(c, h, { enumerable: !0, configurable: !0, writable: !0, value: m }) : c[h] = m;
})(r, typeof i != "symbol" ? i + "" : i, o), o));
class up {
  constructor(i, o) {
    mb(this, "_value"), mb(this, "_beforeDestroys"), mb(this, "_subscribers"), this._value = i, o && (this.compare = o);
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
    const h = new up(i(this.value, void 0, c), o), m = this.reaction((w, g, x) => {
      h.setValue(i(w, g, x));
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
function Qk(r, i, o, c) {
  let h = r.map((w) => w.value);
  const m = new up(i(h, void 0, c), o);
  return r.forEach((w, g) => {
    const x = w.reaction((T, A, I) => {
      const z = h.slice();
      z[g] = T;
      const F = h;
      h = z, m.setValue(i(z, F, I), I);
    });
    m.addBeforeDestroy(x);
  }), m;
}
function jM(r, i) {
  Object.keys(i).forEach((o) => {
    Zk(r, o, i[o]);
  });
}
function Zk(r, i, o) {
  var c;
  return Object.defineProperties(r, { [i]: { get: () => o.value }, [`_${i}$`]: { value: o }, [`set${c = i, c[0].toUpperCase() + c.slice(1)}`]: { value: (h, m) => o.setValue(h, m) } }), r;
}
function mS(r) {
  const i = (o) => {
    const c = r.addDisposer(() => {
      o.destroy();
    });
    return o.addBeforeDestroy(() => {
      r.remove(c);
    }), o;
  };
  return { bindSideEffect: i, combine: (o, c, h, m) => i(Qk(o, c, h, m)), createVal: (o, c) => i(new up(o, c)) };
}
var vS = /* @__PURE__ */ ((r) => (r.Light = "light", r.Dark = "dark", r.Auto = "auto", r))(vS || {}), dn = /* @__PURE__ */ ((r) => (r.Normal = "normal", r.Minimized = "minimized", r.Maximized = "maximized", r))(dn || {}), Xn = /* @__PURE__ */ ((r) => (r.DarkMode = "dark_mode", r.PrefersColorScheme = "prefers_color_scheme", r.Close = "close", r.Focus = "focus", r.Blur = "blur", r.Move = "move", r.Resize = "resize", r.IntrinsicMove = "intrinsic_move", r.IntrinsicResize = "intrinsic_resize", r.VisualResize = "visual_resize", r.ZIndex = "z_index", r.State = "state", r.Minimized = "minimized", r.Maximized = "maximized", r.Readonly = "readonly", r.Destroyed = "destroyed", r))(Xn || {}), qi = /* @__PURE__ */ ((r) => (r.Close = "close", r.Maximize = "maximize", r.Minimize = "minimize", r))(qi || {}), ws = /* @__PURE__ */ ((r) => (r.North = "n", r.South = "s", r.West = "w", r.East = "e", r.NorthWest = "nw", r.NorthEast = "ne", r.SouthEast = "se", r.SouthWest = "sw", r))(ws || {});
const vb = "dh";
function Gi(r, i, o) {
  return Math.min(Math.max(r, i), o);
}
function Ed(r) {
  r.stopPropagation(), r.cancelable && r.preventDefault();
}
let Yk = 1;
function Gk() {
  return `New Box ${Yk++}`;
}
function Xk(r) {
  return Boolean(r);
}
function Vv(r) {
  return !r;
}
function pT(r) {
  return r.reduce((i, o) => (i.includes(o) || i.push(o), i), []);
}
function Vh(r, i) {
  const o = r.indexOf(i);
  if (o < 0)
    return r;
  const c = [...r];
  return c.splice(o, 1), c;
}
function Jk(r, i, o) {
  const c = new Set(i), h = new Set(o);
  return r.filter((m) => !c.has(m) && !h.has(m));
}
function mT(r) {
  return r.touches ? r.touches[0] : r;
}
function qk() {
  return Date.now().toString().slice(6) + Math.random().toString().slice(2, 8);
}
class UM {
  constructor({
    readonly: i = !1,
    title: o,
    buttons: c,
    onEvent: h,
    onDragStart: m,
    namespace: w = "telebox",
    state: g = dn.Normal
  } = {}) {
    this.$btns = [], this.sideEffect = new ap(), this.lastTitleBarClick = {
      timestamp: 0,
      clientX: -100,
      clientY: -100
    }, this.handleTitleBarClick = (x) => {
      var T;
      if (this.readonly || x.button !== 0 || (T = x.target.dataset) != null && T.teleTitleBarNoDblClick)
        return;
      Ed(x);
      const A = Date.now();
      A - this.lastTitleBarClick.timestamp <= 500 ? Math.abs(x.clientX - this.lastTitleBarClick.clientX) <= 5 && Math.abs(x.clientY - this.lastTitleBarClick.clientY) <= 5 && this.onEvent && this.onEvent({ type: qi.Maximize }) : this.onDragStart && this.onDragStart(x), this.lastTitleBarClick.timestamp = A, this.lastTitleBarClick.clientX = x.clientX, this.lastTitleBarClick.clientY = x.clientY;
    }, this.lastTitleBarTouch = {
      timestamp: 0,
      clientX: -100,
      clientY: -100
    }, this.handleTitleBarTouch = (x) => {
      var T;
      if (this.readonly || (T = x.target.dataset) != null && T.teleTitleBarNoDblClick)
        return;
      Ed(x);
      const A = Date.now(), {
        clientX: I = this.lastTitleBarTouch.clientX + 100,
        clientY: z = this.lastTitleBarTouch.clientY + 100
      } = x.touches[0] || {};
      A - this.lastTitleBarTouch.timestamp <= 500 ? Math.abs(I - this.lastTitleBarTouch.clientX) <= 10 && Math.abs(z - this.lastTitleBarTouch.clientY) <= 10 && this.onEvent && this.onEvent({ type: qi.Maximize }) : this.onDragStart && this.onDragStart(x), this.lastTitleBarTouch.timestamp = A, this.lastTitleBarTouch.clientX = I, this.lastTitleBarTouch.clientY = z;
    }, this.readonly = i, this.onEvent = h, this.onDragStart = m, this.namespace = w, this.title = o, this.state = g, this.buttons = c || [
      {
        type: qi.Minimize,
        iconClassName: this.wrapClassName("titlebar-icon-minimize")
      },
      {
        type: qi.Maximize,
        iconClassName: this.wrapClassName("titlebar-icon-maximize"),
        isActive: (x) => x === dn.Maximized
      },
      {
        type: qi.Close,
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
      i.className = this.wrapClassName("title-area"), i.dataset.teleBoxHandle = vb, this.$title = document.createElement("h1"), this.$title.className = this.wrapClassName("title"), this.$title.dataset.teleBoxHandle = vb, this.title && (this.$title.textContent = this.title, this.$title.title = this.title), i.appendChild(this.$title), i.appendChild(this.$dragArea);
      const o = document.createElement("div");
      o.className = this.wrapClassName("titlebar-btns"), this.buttons.forEach(({ iconClassName: c, isActive: h }, m) => {
        const w = String(m), g = document.createElement("button");
        g.className = `${this.wrapClassName(
          "titlebar-btn"
        )} ${c}`, g.dataset.teleTitleBarBtnIndex = w, g.dataset.teleTitleBarNoDblClick = "true", h && g.classList.toggle("is-active", h(this.state)), this.$btns.push(g), o.appendChild(g);
      }), this.sideEffect.addEventListener(
        o,
        "click",
        (c) => {
          var h;
          if (this.readonly)
            return;
          const m = c.target, w = Number(
            (h = m.dataset) == null ? void 0 : h.teleTitleBarBtnIndex
          );
          if (!Number.isNaN(w) && w < this.buttons.length) {
            Ed(c);
            const g = this.buttons[w];
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
    return i.className = this.wrapClassName("drag-area"), i.dataset.teleBoxHandle = vb, this.sideEffect.addEventListener(
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
class Kk {
  constructor({
    id: i = qk(),
    title: o = Gk(),
    prefersColorScheme: c = vS.Light,
    darkMode: h,
    visible: m = !0,
    width: w = 0.5,
    height: g = 0.5,
    minWidth: x = 0,
    minHeight: T = 0,
    x: A = 0.1,
    y: I = 0.1,
    minimized: z = !1,
    maximized: F = !1,
    readonly: $ = !1,
    resizable: J = !0,
    draggable: q = !0,
    fence: de = !0,
    fixRatio: se = !1,
    focus: Z = !1,
    zIndex: ue = 100,
    namespace: oe = "telebox",
    titleBar: Le,
    content: Qe,
    footer: je,
    styles: Y,
    containerRect: he = {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight
    },
    collectorRect: Ie,
    fixed: ie = !1
  } = {}) {
    this._renderSideEffect = new ap(), this.handleTrackStart = (Ae) => {
      var at;
      return (at = this._handleTrackStart) == null ? void 0 : at.call(this, Ae);
    }, this._sideEffect = new ap(), this._valSideEffectBinder = mS(this._sideEffect);
    const { combine: st, createVal: fe } = this._valSideEffectBinder;
    this.id = i, this.namespace = oe, this.events = new Ub(), this._delegateEvents = new Ub(), this.scale = fe(1), this.fixed = ie;
    const xe = fe(
      c
    );
    xe.reaction((Ae, at, Fe) => {
      Fe || this.events.emit(
        Xn.PrefersColorScheme,
        Ae
      );
    });
    const We = fe(Boolean(h));
    h == null && xe.subscribe(
      (Ae, at, Fe) => {
        this._sideEffect.add(() => {
          if (Ae === "auto") {
            const Et = window.matchMedia(
              "(prefers-color-scheme: dark)"
            );
            if (Et) {
              We.setValue(
                Et.matches,
                Fe
              );
              const Si = (wn) => {
                We.setValue(wn.matches, Fe);
              };
              return Et.addListener(Si), () => Et.removeListener(Si);
            } else
              return vT;
          } else
            return We.setValue(
              Ae === "dark",
              Fe
            ), vT;
        }, "prefers-color-scheme");
      }
    ), We.reaction((Ae, at, Fe) => {
      Fe || this.events.emit(Xn.DarkMode, Ae);
    });
    const Ce = fe(he, xa), Ve = fe(Ie, xa), Ne = fe(o);
    Ne.reaction((Ae, at, Fe) => {
      Fe || this.titleBar.setTitle(Ae);
    });
    const $e = fe(m);
    $e.reaction((Ae, at, Fe) => {
      !Fe && !Ae && this.events.emit(Xn.Close);
    });
    const bt = fe($);
    bt.reaction((Ae, at, Fe) => {
      Fe || this.events.emit(Xn.Readonly, Ae);
    });
    const Xt = fe(J), Ge = fe(q), re = fe(de), D = fe(se), B = fe(ue);
    B.reaction((Ae, at, Fe) => {
      Fe || this.events.emit(Xn.ZIndex, Ae);
    });
    const ee = fe(Z);
    ee.reaction((Ae, at, Fe) => {
      Fe || this.events.emit(
        Ae ? Xn.Focus : Xn.Blur
      );
    });
    const ye = fe(z);
    ye.reaction((Ae, at, Fe) => {
      Fe || this.events.emit(Xn.Minimized, Ae);
    });
    const me = fe(F);
    me.reaction((Ae, at, Fe) => {
      Fe || this.events.emit(Xn.Maximized, Ae);
    });
    const ot = st(
      [ye, me],
      ([Ae, at]) => Ae ? dn.Minimized : at ? dn.Maximized : dn.Normal
    );
    ot.reaction((Ae, at, Fe) => {
      Fe || this.events.emit(Xn.State, Ae);
    });
    const Ze = fe(
      {
        width: Gi(x, 0, 1),
        height: Gi(T, 0, 1)
      },
      xa
    ), ze = fe(
      {
        width: Gi(w, Ze.value.width, 1),
        height: Gi(g, Ze.value.height, 1)
      },
      xa
    );
    Ze.reaction((Ae, at, Fe) => {
      ze.setValue(
        {
          width: Gi(w, Ae.width, 1),
          height: Gi(g, Ae.height, 1)
        },
        Fe
      );
    }), ze.reaction((Ae, at, Fe) => {
      Fe || this.events.emit(Xn.IntrinsicResize, Ae);
    });
    const dt = st(
      [ze, me],
      ([Ae, at]) => at ? { width: 1, height: 1 } : Ae,
      xa
    );
    dt.reaction((Ae, at, Fe) => {
      Fe || this.events.emit(Xn.Resize, Ae);
    });
    const Mt = st(
      [dt, ye, Ce, Ve],
      ([Ae, at, Fe, Et]) => at && Et ? {
        width: Et.width / Ae.width / Fe.width,
        height: Et.height / Ae.height / Fe.height
      } : Ae,
      xa
    );
    Mt.reaction((Ae, at, Fe) => {
      Fe || this.events.emit(Xn.VisualResize, Ae);
    });
    const Wt = fe(
      { x: Gi(A, 0, 1), y: Gi(I, 0, 1) },
      xa
    );
    Wt.reaction((Ae, at, Fe) => {
      Fe || this.events.emit(Xn.IntrinsicMove, Ae);
    });
    const St = st(
      [
        Wt,
        ze,
        Ce,
        Ve,
        ye,
        me
      ],
      ([
        Ae,
        at,
        Fe,
        Et,
        Si,
        wn
      ]) => Si && Et ? wn ? {
        x: (Et.x + Et.width / 2) / Fe.width - 1 / 2,
        y: (Et.y + Et.height / 2) / Fe.height - 1 / 2
      } : {
        x: (Et.x + Et.width / 2) / Fe.width - at.width / 2,
        y: (Et.y + Et.height / 2) / Fe.height - at.height / 2
      } : wn ? { x: 0, y: 0 } : Ae,
      xa
    );
    St.reaction((Ae, at, Fe) => {
      Fe || this.events.emit(Xn.Move, Ae);
    }), this.titleBar = Le || new UM({
      readonly: bt.value,
      title: Ne.value,
      namespace: this.namespace,
      onDragStart: (Ae) => {
        var at;
        return (at = this._handleTrackStart) == null ? void 0 : at.call(this, Ae);
      },
      onEvent: (Ae) => {
        if (this._delegateEvents.listeners.length > 0)
          this._delegateEvents.emit(Ae.type);
        else
          switch (Ae.type) {
            case qi.Maximize: {
              me.setValue(!me.value);
              break;
            }
            case qi.Minimize: {
              ye.setValue(!0);
              break;
            }
            case qi.Close: {
              $e.setValue(!1);
              break;
            }
            default: {
              console.error(
                "Unsupported titleBar event:",
                Ae
              );
              break;
            }
          }
      }
    }), bt.reaction((Ae) => {
      this.titleBar.setReadonly(Ae);
    });
    const Ln = fe(Qe), Ft = fe(je), Bi = fe(Y);
    jM(this, {
      prefersColorScheme: xe,
      darkMode: We,
      containerRect: Ce,
      collectorRect: Ve,
      title: Ne,
      visible: $e,
      readonly: bt,
      resizable: Xt,
      draggable: Ge,
      fence: re,
      fixRatio: D,
      focus: ee,
      zIndex: B,
      minimized: ye,
      maximized: me,
      $userContent: Ln,
      $userFooter: Ft,
      $userStyles: Bi
    }), this._state$ = ot, this._minSize$ = Ze, this._size$ = dt, this._intrinsicSize$ = ze, this._visualSize$ = Mt, this._coord$ = St, this._intrinsicCoord$ = Wt, this.fixRatio && this.transform(
      St.value.x,
      St.value.y,
      dt.value.width,
      dt.value.height,
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
      case dn.Maximized: {
        this.setMinimized(!1, o), this.setMaximized(!0, o);
        break;
      }
      case dn.Minimized: {
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
    return this._minSize$.setValue(
      { width: i, height: this.minHeight },
      o
    ), this;
  }
  setMinHeight(i, o = !1) {
    return this._minSize$.setValue(
      { width: this.minWidth, height: i },
      o
    ), this;
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
      const w = this.intrinsicHeight / this.intrinsicWidth * c;
      o !== this.intrinsicY && (o -= w - h), h = w;
    }
    return o < 0 && (o = 0, h > this.intrinsicHeight && (h = this.intrinsicHeight)), this.fixed || this._intrinsicCoord$.setValue(
      {
        x: c >= this.minWidth ? i : this.intrinsicX,
        y: h >= this.minHeight ? o : this.intrinsicY
      },
      m
    ), this._intrinsicSize$.setValue(
      {
        width: Gi(c, this.minWidth, 1),
        height: Gi(h, this.minHeight, 1)
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
    const o = (I, z, F, $ = Xk) => this._renderSideEffect.add(() => {
      const J = this.wrapClassName(F);
      return z.subscribe((q) => {
        I.classList.toggle(J, $(q));
      });
    });
    o(this.$box, this._readonly$, "readonly"), o(this.$box, this._draggable$, "no-drag", Vv), o(this.$box, this._resizable$, "no-resize", Vv), o(this.$box, this._focus$, "blur", Vv), o(this.$box, this._darkMode$, "color-scheme-dark"), o(
      this.$box,
      this._darkMode$,
      "color-scheme-light",
      Vv
    ), this._renderSideEffect.add(() => {
      const I = this.wrapClassName("minimized"), z = this.wrapClassName("maximized"), F = "box-maximized-timer";
      return this._state$.subscribe(($) => {
        this.$box.classList.toggle(
          I,
          $ === dn.Minimized
        ), $ === dn.Maximized ? (this._renderSideEffect.flush(F), this.$box.classList.toggle(z, !0)) : this._renderSideEffect.setTimeout(
          () => {
            this.$box.classList.toggle(
              z,
              !1
            );
          },
          0,
          F
        );
      });
    }), this._renderSideEffect.add(
      () => this._visible$.subscribe((I) => {
        this.$box.style.display = I ? "block" : "none";
      })
    ), this._renderSideEffect.add(
      () => this._zIndex$.subscribe((I) => {
        this.$box.style.zIndex = String(I);
      })
    );
    const c = Wk(this.$box);
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
      ([I, z, F, $, J]) => {
        const q = z.width * $.width, de = z.height * $.height;
        return {
          width: q + (F && J ? 1 : 0),
          height: de + (F && J ? 1 : 0),
          x: I.x * $.width,
          y: I.y * $.height,
          scaleX: F && J ? J.width / q : 1,
          scaleY: F && J ? J.height / de : 1
        };
      },
      xa
    ).subscribe((I) => {
      c.set(I);
    }), c.set({ x: h, y: m });
    const w = document.createElement("div");
    w.className = this.wrapClassName("box-main"), this.$box.appendChild(w);
    const g = document.createElement("div");
    g.className = this.wrapClassName("titlebar-wrap"), g.appendChild(this.titleBar.render()), this.$titleBar = g;
    const x = document.createElement("div");
    x.className = this.wrapClassName("content-wrap") + " tele-fancy-scrollbar";
    const T = document.createElement("div");
    T.className = this.wrapClassName("content") + " tele-fancy-scrollbar", this.$content = T, this._valSideEffectBinder.combine(
      [
        this._size$,
        this._containerRect$,
        this.scale
      ],
      ([I, z, F]) => {
        const $ = I.width * z.width, J = I.height * z.height;
        return {
          width: $ * F,
          height: J * F
        };
      },
      xa
    ).subscribe((I) => {
      T.style.width = I.width + "px", T.style.height = I.height + "px";
    }), this._renderSideEffect.add(() => {
      let I;
      return this._$userStyles$.subscribe((z) => {
        I && I.remove(), I = z, z && x.appendChild(z);
      });
    }), this._renderSideEffect.add(() => {
      let I;
      return this._$userContent$.subscribe((z) => {
        I && I.remove(), I = z, z && T.appendChild(z);
      });
    }), x.appendChild(T);
    const A = document.createElement("div");
    return A.className = this.wrapClassName("footer-wrap"), this.$footer = A, this._renderSideEffect.add(() => {
      let I;
      return this._$userFooter$.subscribe((z) => {
        I && I.remove(), I = z, z && A.appendChild(z);
      });
    }), w.appendChild(g), w.appendChild(x), w.appendChild(A), this.$contentWrap = x, this._renderResizeHandlers(), this.$box;
  }
  _renderResizeHandlers() {
    const i = document.createElement("div");
    i.className = this.wrapClassName("resize-handles"), Object.values(ws).forEach((J) => {
      const q = document.createElement("div");
      q.className = this.wrapClassName(J) + " " + this.wrapClassName("resize-handle"), q.dataset.teleBoxHandle = J, i.appendChild(q);
    }), this.$box.appendChild(i);
    const o = "handle-tracking-listener", c = this.wrapClassName("transforming");
    let h, m = 0, w = 0, g = 0, x = 0, T = 0, A = 0, I;
    const z = (J) => {
      if (this.state !== dn.Normal)
        return;
      Ed(J);
      let { pageX: q, pageY: de } = mT(J);
      de < 0 && (de = 0);
      const se = (q - T) / this.containerRect.width, Z = (de - A) / this.containerRect.height;
      switch (I) {
        case ws.North: {
          this.transform(
            this.x,
            w + Z,
            this.width,
            x - Z
          );
          break;
        }
        case ws.South: {
          this.transform(
            this.x,
            this.y,
            this.width,
            x + Z
          );
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
          this.transform(
            this.x,
            this.y,
            g + se,
            this.height
          );
          break;
        }
        case ws.NorthWest: {
          this.transform(
            m + se,
            w + Z,
            g - se,
            x - Z
          );
          break;
        }
        case ws.NorthEast: {
          this.transform(
            this.x,
            w + Z,
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
              Gi(m + se, 0, 1 - this.width),
              Gi(w + Z, 0, 1 - this.height)
            );
          else {
            const ue = 20 / this.containerRect.width, oe = 20 / this.containerRect.height;
            this.move(
              Gi(
                m + se,
                ue - this.width,
                1 - ue
              ),
              Gi(w + Z, 0, 1 - oe)
            );
          }
          break;
        }
      }
    }, F = (J) => {
      I = void 0, h && (Ed(J), this.$box.classList.toggle(c, !1), this._sideEffect.flush(o), h.remove());
    }, $ = (J) => {
      var q;
      if (this.readonly || J.button != null && J.button !== 0 || !this.draggable || I || this.state !== dn.Normal)
        return;
      const de = J.target;
      if ((q = de.dataset) != null && q.teleBoxHandle) {
        Ed(J), m = this.x, w = this.y, g = this.width, x = this.height, { pageX: T, pageY: A } = mT(J), I = de.dataset.teleBoxHandle, h || (h = document.createElement("div"));
        const se = I ? this.wrapClassName(`cursor-${I}`) : "";
        h.className = this.wrapClassName(
          `track-mask${se ? ` ${se}` : ""}`
        ), this.$box.appendChild(h), this.$box.classList.add(c), this._sideEffect.add(() => (window.addEventListener("mousemove", z), window.addEventListener("touchmove", z, {
          passive: !1
        }), window.addEventListener("mouseup", F), window.addEventListener("touchend", F, {
          passive: !1
        }), window.addEventListener("touchcancel", F, {
          passive: !1
        }), () => {
          window.removeEventListener("mousemove", z), window.removeEventListener("touchmove", z), window.removeEventListener("mouseup", F), window.removeEventListener("touchend", F), window.removeEventListener(
            "touchcancel",
            F
          );
        }), o);
      }
    };
    this._handleTrackStart = $, this._sideEffect.addEventListener(
      i,
      "mousedown",
      $,
      {},
      "box-resizeHandles-mousedown"
    ), this._sideEffect.addEventListener(
      i,
      "touchstart",
      $,
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
function vT() {
}
var eP = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzFfNDQyNDQpIj4KPGcgZmlsdGVyPSJ1cmwoI2ZpbHRlcjBfZF8xXzQ0MjQ0KSI+CjxwYXRoIGQ9Ik0xNC4wMDAyIDE2LjE5NTNDMTMuODI0NyAxNi4xOTUzIDEzLjY1MjIgMTYuMTQ5MSAxMy41MDAyIDE2LjA2MTVMNC41MDAxNyAxMC44NjQzQzQuMDIxNzggMTAuNTg3OSAzLjg1Nzk2IDkuOTc2MTIgNC4xMzQyOCA5LjQ5NzczQzQuMjIyMDQgOS4zNDU3OSA0LjM0ODIzIDkuMjE5NiA0LjUwMDE3IDkuMTMxODRMMTMuNTAwMiAzLjkzODQ4QzEzLjgwOTggMy43NjA3NCAxNC4xOTA1IDMuNzYwNzQgMTQuNTAwMiAzLjkzODQ4TDIzLjUwMDIgOS4xMzE4NEMyMy45Nzg2IDkuNDA4MTYgMjQuMTQyNCAxMC4wMiAyMy44NjYxIDEwLjQ5ODRDMjMuNzc4MyAxMC42NTAzIDIzLjY1MjEgMTAuNzc2NSAyMy41MDAyIDEwLjg2NDNMMTQuNTAwMiAxNi4wNjE1QzE0LjM0ODEgMTYuMTQ5MSAxNC4xNzU3IDE2LjE5NTMgMTQuMDAwMiAxNi4xOTUzWiIgZmlsbD0id2hpdGUiLz4KPC9nPgo8ZyBmaWx0ZXI9InVybCgjZmlsdGVyMV9kXzFfNDQyNDQpIj4KPHBhdGggZD0iTTIzLjUwMDIgMTMuMTMxOUwyMS41MzYxIDExLjk5ODVMMTQuNTAwMiAxNi4wNjE2QzE0LjE5MDcgMTYuMjQgMTMuODA5NiAxNi4yNCAxMy41MDAyIDE2LjA2MTZMNi40NjQyOCAxMS45OTg1TDQuNTAwMTcgMTMuMTMxOUM0LjAyMTc4IDEzLjQwODIgMy44NTc5NiAxNC4wMiA0LjEzNDI4IDE0LjQ5ODRDNC4yMjIwNCAxNC42NTA0IDQuMzQ4MjMgMTQuNzc2NiA0LjUwMDE3IDE0Ljg2NDNMMTMuNTAwMiAyMC4wNjE2QzEzLjgwOTYgMjAuMjQgMTQuMTkwNyAyMC4yNCAxNC41MDAyIDIwLjA2MTZMMjMuNTAwMiAxNC44NjQzQzIzLjk3ODYgMTQuNTg4IDI0LjE0MjQgMTMuOTc2MiAyMy44NjYxIDEzLjQ5NzhDMjMuNzc4MyAxMy4zNDU5IDIzLjY1MjEgMTMuMjE5NyAyMy41MDAyIDEzLjEzMTlaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjgiIHNoYXBlLXJlbmRlcmluZz0iY3Jpc3BFZGdlcyIvPgo8L2c+CjxnIGZpbHRlcj0idXJsKCNmaWx0ZXIyX2RfMV80NDI0NCkiPgo8cGF0aCBkPSJNMjMuNTAwMiAxNy4xMzE5TDIxLjUzNjEgMTUuOTk4NUwxNC41MDAyIDIwLjA2MTZDMTQuMTkwNyAyMC4yNCAxMy44MDk2IDIwLjI0IDEzLjUwMDIgMjAuMDYxNkw2LjQ2NDI4IDE1Ljk5ODVMNC41MDAxNyAxNy4xMzE5QzQuMDIxNzggMTcuNDA4MiAzLjg1Nzk2IDE4LjAyIDQuMTM0MjggMTguNDk4NEM0LjIyMjA0IDE4LjY1MDQgNC4zNDgyMyAxOC43NzY2IDQuNTAwMTcgMTguODY0M0wxMy41MDAyIDI0LjA2MTZDMTMuODA5NiAyNC4yNCAxNC4xOTA3IDI0LjI0IDE0LjUwMDIgMjQuMDYxNkwyMy41MDAyIDE4Ljg2NDNDMjMuOTc4NiAxOC41ODggMjQuMTQyNCAxNy45NzYyIDIzLjg2NjEgMTcuNDk3OEMyMy43NzgzIDE3LjM0NTkgMjMuNjUyMSAxNy4yMTk3IDIzLjUwMDIgMTcuMTMxOVoiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuNiIgc2hhcGUtcmVuZGVyaW5nPSJjcmlzcEVkZ2VzIi8+CjwvZz4KPC9nPgo8ZGVmcz4KPGZpbHRlciBpZD0iZmlsdGVyMF9kXzFfNDQyNDQiIHg9IjMiIHk9IjMuODA1MTgiIHdpZHRoPSIyMiIgaGVpZ2h0PSIxNC4zOTAxIiBmaWx0ZXJVbml0cz0idXNlclNwYWNlT25Vc2UiIGNvbG9yLWludGVycG9sYXRpb24tZmlsdGVycz0ic1JHQiI+CjxmZUZsb29kIGZsb29kLW9wYWNpdHk9IjAiIHJlc3VsdD0iQmFja2dyb3VuZEltYWdlRml4Ii8+CjxmZUNvbG9yTWF0cml4IGluPSJTb3VyY2VBbHBoYSIgdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDEyNyAwIiByZXN1bHQ9ImhhcmRBbHBoYSIvPgo8ZmVPZmZzZXQgZHk9IjEiLz4KPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMC41Ii8+CjxmZUNvbXBvc2l0ZSBpbjI9ImhhcmRBbHBoYSIgb3BlcmF0b3I9Im91dCIvPgo8ZmVDb2xvck1hdHJpeCB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMCAwIDAgMCAwLjU1Mjk0MSAwIDAgMCAwIDAuNTYwNzg0IDAgMCAwIDAgMC42NTA5OCAwIDAgMCAwLjE1IDAiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbjI9IkJhY2tncm91bmRJbWFnZUZpeCIgcmVzdWx0PSJlZmZlY3QxX2Ryb3BTaGFkb3dfMV80NDI0NCIvPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluPSJTb3VyY2VHcmFwaGljIiBpbjI9ImVmZmVjdDFfZHJvcFNoYWRvd18xXzQ0MjQ0IiByZXN1bHQ9InNoYXBlIi8+CjwvZmlsdGVyPgo8ZmlsdGVyIGlkPSJmaWx0ZXIxX2RfMV80NDI0NCIgeD0iMyIgeT0iMTEuOTk4NSIgd2lkdGg9IjIyIiBoZWlnaHQ9IjEwLjE5NjgiIGZpbHRlclVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj4KPGZlRmxvb2QgZmxvb2Qtb3BhY2l0eT0iMCIgcmVzdWx0PSJCYWNrZ3JvdW5kSW1hZ2VGaXgiLz4KPGZlQ29sb3JNYXRyaXggaW49IlNvdXJjZUFscGhhIiB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMTI3IDAiIHJlc3VsdD0iaGFyZEFscGhhIi8+CjxmZU9mZnNldCBkeT0iMSIvPgo8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIwLjUiLz4KPGZlQ29tcG9zaXRlIGluMj0iaGFyZEFscGhhIiBvcGVyYXRvcj0ib3V0Ii8+CjxmZUNvbG9yTWF0cml4IHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAuNTUyOTQxIDAgMCAwIDAgMC41NjA3ODQgMCAwIDAgMCAwLjY1MDk4IDAgMCAwIDAuMTUgMCIvPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluMj0iQmFja2dyb3VuZEltYWdlRml4IiByZXN1bHQ9ImVmZmVjdDFfZHJvcFNoYWRvd18xXzQ0MjQ0Ii8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0iZWZmZWN0MV9kcm9wU2hhZG93XzFfNDQyNDQiIHJlc3VsdD0ic2hhcGUiLz4KPC9maWx0ZXI+CjxmaWx0ZXIgaWQ9ImZpbHRlcjJfZF8xXzQ0MjQ0IiB4PSIzIiB5PSIxNS45OTg1IiB3aWR0aD0iMjIiIGhlaWdodD0iMTAuMTk2OCIgZmlsdGVyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiPgo8ZmVGbG9vZCBmbG9vZC1vcGFjaXR5PSIwIiByZXN1bHQ9IkJhY2tncm91bmRJbWFnZUZpeCIvPgo8ZmVDb2xvck1hdHJpeCBpbj0iU291cmNlQWxwaGEiIHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAxMjcgMCIgcmVzdWx0PSJoYXJkQWxwaGEiLz4KPGZlT2Zmc2V0IGR5PSIxIi8+CjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjAuNSIvPgo8ZmVDb21wb3NpdGUgaW4yPSJoYXJkQWxwaGEiIG9wZXJhdG9yPSJvdXQiLz4KPGZlQ29sb3JNYXRyaXggdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAgMCAwIDAgMC41NTI5NDEgMCAwIDAgMCAwLjU2MDc4NCAwIDAgMCAwIDAuNjUwOTggMCAwIDAgMC4xNSAwIi8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW4yPSJCYWNrZ3JvdW5kSW1hZ2VGaXgiIHJlc3VsdD0iZWZmZWN0MV9kcm9wU2hhZG93XzFfNDQyNDQiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJlZmZlY3QxX2Ryb3BTaGFkb3dfMV80NDI0NCIgcmVzdWx0PSJzaGFwZSIvPgo8L2ZpbHRlcj4KPGNsaXBQYXRoIGlkPSJjbGlwMF8xXzQ0MjQ0Ij4KPHJlY3Qgd2lkdGg9IjI4IiBoZWlnaHQ9IjI4IiBmaWxsPSJ3aGl0ZSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo=";
let Hh, Wh;
function tP(r, i = !1) {
  Hh ? i ? Wh == null || Wh.push(r) : Hh.push(r) : (Hh = i ? [] : [r], Wh = i ? [r] : [], Promise.resolve().then(() => {
    const o = Hh, c = Wh;
    Hh = void 0, Wh = void 0, c == null || c.forEach((h) => h()), o == null || o.forEach((h) => h());
  }));
}
function nP(r) {
  const i = r.cloneNode(!0);
  i.style.position = "absolute", i.style.top = "-99999px", i.style.float = "none", i.style.visibility = "hidden", i.style.display = "block", document.body.appendChild(i);
  const o = i.getBoundingClientRect();
  return document.body.removeChild(i), { height: o.height, width: o.width };
}
class VM {
  constructor({
    visible: i = !0,
    readonly: o = !1,
    darkMode: c = !1,
    namespace: h = "telebox",
    styles: m = {},
    onClick: w,
    minimizedBoxes: g = [],
    boxes: x = []
  } = {}) {
    this.handleCollectorClick = () => {
      !this._readonly && this.onClick && this.popupVisible$.setValue(!this.popupVisible$.value);
    }, this._sideEffect = new ap();
    const { createVal: T } = mS(this._sideEffect);
    this._visible = i, this._readonly = o, this._darkMode = c, this.namespace = h, this.styles = m, this.minimizedBoxes = g, this.boxes = x, this.onClick = w, this.popupVisible$ = T(!1), this.popupVisible$.reaction((I) => {
      var z;
      (z = this.$titles) == null || z.classList.toggle(
        this.wrapClassName("collector-hide"),
        !I
      ), requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          var F;
          (F = this.$titles) == null || F.classList.toggle(
            this.wrapClassName(
              "collector-titles-visible"
            ),
            I
          );
        });
      });
    });
    const A = (I) => {
      var z, F;
      !this.popupVisible$ || (F = (z = I.target.className) == null ? void 0 : z.includes) != null && F.call(z, "collector") || this.popupVisible$.setValue(!1);
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
    return this.$collector || (this.$collector = document.createElement("button"), this.$collector.className = this.wrapClassName("collector"), this.$collector.style.backgroundImage = `url('${eP}')`, this.wrp$ = document.createElement("div"), this.count$ = document.createElement("div"), this.wrp$.className = this.wrapClassName("collector-wrp"), this.count$.className = this.wrapClassName("collector-count"), this.wrp$.appendChild(this.count$), this.wrp$.appendChild(this.$collector), this.$collector.addEventListener("click", this.handleCollectorClick), this._visible && (this.$collector.classList.add(this.wrapClassName("collector-visible")), this.wrp$.classList.toggle(this.wrapClassName("collector-visible")), this.renderTitles()), this._readonly && this.$collector.classList.add(this.wrapClassName("collector-readonly")), this.$collector.classList.add(
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
      (T) => {
        T.deltaX || T.currentTarget.scrollBy({
          left: T.deltaY > 0 ? 250 : -250,
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
      (T) => {
        var A, I, z, F;
        const $ = T.target;
        (I = (A = $.dataset) == null ? void 0 : A.teleBoxID) != null && I.length && ((F = this.onClick) == null || F.call(this, (z = $.dataset) == null ? void 0 : z.teleBoxID));
      },
      {},
      "telebox-collector-titles-content-click"
    )), w.innerHTML = "";
    const g = (i = this.boxes) == null ? void 0 : i.filter((T) => {
      var A;
      return (A = this.minimizedBoxes) == null ? void 0 : A.includes(T.id);
    }).map((T) => {
      const A = document.createElement("button");
      return A.className = this.wrapClassName("collector-titles-tab"), A.textContent = T.title, A.dataset.teleBoxID = T.id, A.dataset.teleTitleBarNoDblClick = "true", w.appendChild(A), T._title$.reaction((I) => A.textContent = I);
    });
    this._sideEffect.addDisposer(
      () => g == null ? void 0 : g.forEach((T) => T()),
      "min-popup-render-tab-titles"
    );
    const x = (o = this.wrp$) == null ? void 0 : o.querySelector(
      `.${this.wrapClassName("collector-titles")}`
    );
    return x ? (h = this.wrp$) == null || h.replaceChild(this.$titles, x) : (c = this.wrp$) == null || c.appendChild(this.$titles), tP(() => {
      var T, A;
      if (!this.$titles || !this.wrp$ || !this.root)
        return;
      const I = (T = this.wrp$) == null ? void 0 : T.getBoundingClientRect(), z = (A = this.root) == null ? void 0 : A.getBoundingClientRect(), F = nP(this.$titles), $ = I.top - z.top > F.height, J = I.x - z.x > F.width / 2 - I.width / 2, q = -F.height - 10;
      let de = -(F.width / 2 - I.width / 2);
      if (!$) {
        const se = I.top > 60 ? I.top : 60;
        this.$titles.style.height = `${se}px`;
      }
      J || (de = -(I.x - z.x - 4)), this.$titles.style.top = `${q}px`, this.$titles.style.left = `${de}px`;
    }), this.$titles;
  }
  destroy() {
    this.$collector && (this.$collector.removeEventListener("click", this.handleCollectorClick), this.$collector.remove(), this.$collector = void 0), this.onClick = void 0;
  }
  wrapClassName(i) {
    return `${this.namespace}-${i}`;
  }
}
var Gn = /* @__PURE__ */ ((r) => (r.Focused = "focused", r.Blurred = "blurred", r.Created = "created", r.Removed = "removed", r.State = "state", r.Maximized = "maximized", r.Minimized = "minimized", r.Move = "move", r.Resize = "resize", r.IntrinsicMove = "intrinsic_move", r.IntrinsicResize = "intrinsic_resize", r.VisualResize = "visual_resize", r.ZIndex = "z_index", r.PrefersColorScheme = "prefers_color_scheme", r.DarkMode = "dark_mode", r))(Gn || {});
class iP extends UM {
  constructor(i) {
    super(i), this.boxes = i.boxes, this.focusedBox = i.focusedBox, this.containerRect = i.containerRect, this.darkMode = i.darkMode, this.maximizedBoxes$ = i.maximizedBoxes$, this.minimizedBoxes$ = i.minimizedBoxes$;
  }
  focusBox(i) {
    var o;
    if (!(this.focusedBox && this.focusedBox === i)) {
      if (this.$titles && this.state === dn.Maximized) {
        const { children: c } = this.$titles.firstElementChild;
        for (let h = c.length - 1; h >= 0; h -= 1) {
          const m = c[h], w = (o = m.dataset) == null ? void 0 : o.teleBoxID;
          w && (i && w === i.id ? m.classList.toggle(this.wrapClassName("titles-tab-focus"), !0) : this.focusedBox && w === this.focusedBox.id && m.classList.toggle(this.wrapClassName("titles-tab-focus"), !1));
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
      i === dn.Maximized
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
      this.state === dn.Maximized
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
class rP {
  constructor({
    root: i = document.body,
    prefersColorScheme: o = vS.Light,
    fence: c = !0,
    containerRect: h = {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight
    },
    collector: m,
    namespace: w = "telebox",
    readonly: g = !1,
    minimizedBoxes: x = [],
    maximizedBoxes: T = []
  } = {}) {
    this.events = new Ub(), this._sideEffect = new ap();
    const { combine: A, createVal: I } = mS(this._sideEffect);
    this.root = i, this.namespace = w, this.boxes$ = I([]), this.topBox$ = this.boxes$.derive((Y) => {
      if (Y.length > 0)
        return Y.reduce(
          (Ie, ie) => Ie.zIndex > ie.zIndex ? Ie : ie
        );
    });
    const z = window.matchMedia("(prefers-color-scheme: dark)"), F = I(!1);
    z && (F.setValue(z.matches), this._sideEffect.add(() => {
      const Y = (he) => {
        F.setValue(he.matches);
      };
      return z.addListener(Y), () => z.removeListener(Y);
    }));
    const $ = I(o);
    $.reaction((Y, he, Ie) => {
      this.boxes.forEach((ie) => ie.setPrefersColorScheme(Y, Ie)), Ie || this.events.emit(Gn.PrefersColorScheme, Y);
    }), this._darkMode$ = A(
      [F, $],
      ([Y, he]) => he === "auto" ? Y : he === "dark"
    ), this._darkMode$.reaction((Y, he, Ie) => {
      this.boxes.forEach((ie) => ie.setDarkMode(Y, Ie)), Ie || this.events.emit(Gn.DarkMode, Y);
    });
    const J = I(g);
    J.reaction((Y, he, Ie) => {
      this.boxes.forEach((ie) => ie.setReadonly(Y, Ie));
    }), this.maximizedBoxes$ = I(T), this.minimizedBoxes$ = I(x), this.maximizedBoxes$.reaction((Y, he, Ie) => {
      this.boxes.forEach((st) => st.setMaximized(Y.includes(st.id), Ie));
      const ie = Y.filter((st) => !this.minimizedBoxes$.value.includes(st));
      this.maxTitleBar.setState(ie.length > 0 ? dn.Maximized : dn.Normal), this.maxTitleBar.setMaximizedBoxes(Y), Ie || this.events.emit(Gn.Maximized, Y);
    });
    const q = A(
      [this.minimizedBoxes$, this.maximizedBoxes$],
      ([Y, he]) => Y.length ? dn.Minimized : he.length ? dn.Maximized : dn.Normal
    );
    q.reaction((Y, he, Ie) => {
      this.maxTitleBar.setState(Y), Ie || this.events.emit(Gn.State, Y);
    });
    const de = I(c);
    de.subscribe((Y, he, Ie) => {
      this.boxes.forEach((ie) => ie.setFence(Y, Ie));
    });
    const se = I(h, xa);
    se.reaction((Y, he, Ie) => {
      this.boxes.forEach((ie) => ie.setContainerRect(Y, Ie)), this.maxTitleBar.setContainerRect(Y);
    });
    const Z = I(
      m === null ? null : m || new VM({
        visible: this.minimizedBoxes$.value.length > 0,
        readonly: g,
        namespace: w,
        minimizedBoxes: this.minimizedBoxes$.value,
        boxes: this.boxes$.value
      }).mount(i)
    );
    Z.subscribe((Y) => {
      Y && (Y.setVisible(this.minimizedBoxes$.value.length > 0), Y.setReadonly(J.value), Y.setDarkMode(this._darkMode$.value), this._sideEffect.add(() => (Y.onClick = (he) => {
        J.value || this.setMinimizedBoxes(
          Vh(
            this.minimizedBoxes$.value.filter(Boolean),
            he
          )
        );
      }, () => Y.destroy()), "collect-onClick"));
    }), J.subscribe((Y) => {
      var he;
      return (he = Z.value) == null ? void 0 : he.setReadonly(Y);
    }), this._darkMode$.subscribe((Y) => {
      var he;
      (he = Z.value) == null || he.setDarkMode(Y);
    });
    const ue = () => {
      var Y;
      if ((Y = Z.value) != null && Y.$collector) {
        const { x: he, y: Ie, width: ie, height: st } = Z.value.$collector.getBoundingClientRect(), fe = this.root.getBoundingClientRect();
        return {
          x: he - fe.x,
          y: Ie - fe.y,
          width: ie,
          height: st
        };
      }
    }, oe = I(this.minimizedBoxes$.value.length > 0 ? ue() : void 0);
    oe.subscribe((Y, he, Ie) => {
      this.boxes.forEach((ie) => {
        ie.setCollectorRect(Y, Ie);
      });
    }), this.minimizedBoxes$.reaction((Y, he, Ie) => {
      var ie, st, fe;
      this.boxes.forEach((Ce) => Ce.setMinimized(Y.includes(Ce.id), Ie));
      const xe = this.maximizedBoxes$.value.filter((Ce) => !Y.includes(Ce));
      this.maxTitleBar.setState(xe.length > 0 ? dn.Maximized : dn.Normal), this.maxTitleBar.setMinimizedBoxes(Y);
      const We = Y.length > 0;
      (ie = Z.value) == null || ie.setVisible(We), (st = this.collector) == null || st.setMinimizedBoxes(Y), We && (fe = Z.value) != null && fe.$collector && oe.setValue(ue()), Ie || this.events.emit(Gn.Minimized, Y);
    });
    const Le = this.wrapClassName("titlebar-icon-close"), Qe = (Y) => {
      var he;
      if (J.value)
        return;
      const Ie = Y.target;
      if (!!Ie.tagName)
        for (let ie = Ie; ie; ie = ie.parentElement) {
          if (ie.classList && ie.classList.contains(Le))
            return;
          const st = (he = ie.dataset) == null ? void 0 : he.teleBoxID;
          if (st) {
            const fe = this.getBox(st);
            if (fe) {
              this.focusBox(fe), this.makeBoxTop(fe);
              return;
            }
          }
        }
    };
    this._sideEffect.addEventListener(window, "mousedown", Qe, !0), this._sideEffect.addEventListener(window, "touchstart", Qe, !0), this.maxTitleBar = new iP({
      darkMode: this.darkMode,
      readonly: J.value,
      namespace: this.namespace,
      state: q.value,
      boxes: this.boxes$.value,
      containerRect: se.value,
      maximizedBoxes$: this.maximizedBoxes$.value,
      minimizedBoxes$: this.minimizedBoxes$.value,
      onEvent: (Y) => {
        var he, Ie, ie, st, fe, xe;
        switch (Y.type) {
          case qi.Maximize: {
            if ((he = this.maxTitleBar.focusedBox) != null && he.id) {
              const We = (Ie = this.maxTitleBar.focusedBox) == null ? void 0 : Ie.id, Ve = this.maximizedBoxes$.value.includes(
                We
              ) ? Vh(
                [...this.maximizedBoxes$.value],
                We
              ) : pT([
                ...this.maximizedBoxes$.value,
                (ie = this.maxTitleBar.focusedBox) == null ? void 0 : ie.id
              ]);
              this.setMaximizedBoxes(Ve);
              const Ne = this.makeBoxTopFromMaximized(), $e = this.boxes$.value.find(
                (bt) => bt.id == We
              );
              $e && this.makeBoxTop($e), Ne || this.setMaximizedBoxes([]);
            } else
              this.setMaximizedBoxes([]);
            break;
          }
          case qi.Minimize: {
            if ((st = this.maxTitleBar.focusedBox) != null && st.id) {
              const We = pT([
                ...this.minimizedBoxes$.value,
                (fe = this.maxTitleBar.focusedBox) == null ? void 0 : fe.id
              ]);
              this.makeBoxTopFromMaximized(), this.setMinimizedBoxes(We);
            }
            break;
          }
          case Xn.Close: {
            const We = (xe = this.maxTitleBar.focusedBox) == null ? void 0 : xe.id;
            We && (this.remove(We), this.makeBoxTopFromMaximized(), this.setMaximizedBoxes(Vh(this.maximizedBoxes$.value, We))), this.focusTopBox();
            break;
          }
        }
      }
    }), J.subscribe((Y) => this.maxTitleBar.setReadonly(Y)), this._darkMode$.subscribe((Y) => {
      this.maxTitleBar.setDarkMode(Y);
    }), this.boxes$.reaction((Y) => {
      var he;
      this.maxTitleBar.setBoxes(Y), (he = this.collector) == null || he.setBoxes(Y);
    }), this.maximizedBoxes$.reaction((Y) => {
      this.maxTitleBar.setMaximizedBoxes(Y);
    }), this.minimizedBoxes$.reaction((Y) => {
      this.maxTitleBar.setMinimizedBoxes(Y);
    });
    const je = {
      prefersColorScheme: $,
      containerRect: se,
      collector: Z,
      collectorRect: oe,
      readonly: J,
      fence: de,
      maximizedBoxes: this.maximizedBoxes$,
      minimizedBoxes: this.minimizedBoxes$
    };
    jM(this, je), this._state$ = q, this.root.appendChild(this.maxTitleBar.render());
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
      case dn.Maximized:
        break;
      case dn.Minimized:
        break;
    }
    return this;
  }
  create(i = {}, o = !0) {
    const c = i.id || Td(), h = this.maximizedBoxes$.value.includes(c), m = this.maximizedBoxes$.value.includes(c), w = new Kk({
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
      id: c
    });
    return w.mount(this.root), w.focus && (this.focusBox(w), o && this.makeBoxTop(w)), this.boxes$.setValue([...this.boxes, w]), w._delegateEvents.on(qi.Maximize, () => {
      this.setMaximizedBoxes(this.boxes$.value.map((g) => g.id)), this.maxTitleBar.focusBox(w);
    }), w._delegateEvents.on(qi.Minimize, () => {
      this.setMinimizedBoxes([...this.minimizedBoxes$.value, c]);
    }), w._delegateEvents.on(qi.Close, () => {
      this.remove(w), this.makeBoxTopFromMaximized(w.id), this.focusTopBox();
    }), w._coord$.reaction((g, x, T) => {
      T || this.events.emit(Gn.Move, w);
    }), w._size$.reaction((g, x, T) => {
      T || this.events.emit(Gn.Resize, w);
    }), w._intrinsicCoord$.reaction((g, x, T) => {
      T || this.events.emit(Gn.IntrinsicMove, w);
    }), w._intrinsicSize$.reaction((g, x, T) => {
      T || this.events.emit(Gn.IntrinsicResize, w);
    }), w._visualSize$.reaction((g, x, T) => {
      T || this.events.emit(Gn.VisualResize, w);
    }), w._zIndex$.reaction((g, x, T) => {
      if (this.boxes.length > 0) {
        const A = this.boxes.reduce(
          (I, z) => I.zIndex > z.zIndex ? I : z
        );
        this.topBox$.setValue(A);
      }
      T || this.events.emit(Gn.ZIndex, w);
    }), this.events.emit(Gn.Created, w), w;
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
      const m = this.boxes.slice(), w = m.splice(h, 1);
      this.boxes$.setValue(m), w.forEach((x) => x.destroy());
      const g = (c = this.getBox(i)) == null ? void 0 : c.id;
      return g && (this.setMaximizedBoxes(Vh(this.maximizedBoxes$.value, g)), this.setMinimizedBoxes(Vh(this.minimizedBoxes$.value, g))), o || (this.boxes.length <= 0 && (this.setMaximizedBoxes([]), this.setMinimizedBoxes([])), this.events.emit(Gn.Removed, w)), w[0];
    }
  }
  removeTopBox() {
    if (this.topBox)
      return this.remove(this.topBox);
  }
  removeAll(i = !1) {
    const o = this.boxes$.value;
    return this.boxes$.setValue([]), o.forEach((c) => c.destroy()), i || (this.boxes.length <= 0 && (this.setMaximizedBoxes([]), this.setMinimizedBoxes([])), this.events.emit(Gn.Removed, o)), o;
  }
  destroy(i = !1) {
    this.events.removeAllListeners(), this._sideEffect.flushAll(), this.removeAll(i), Object.keys(this).forEach((o) => {
      const c = this[o];
      c instanceof up && c.destroy();
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
        c.focus || (m = !0, c.setFocus(!0, o)), m && !o && this.events.emit(Gn.Focused, c);
      } else
        h.focus && (this.maximizedBoxes$.value.includes(h.id) || this.blurBox(h, o));
    }), this.maximizedBoxes$.value.length > 0 ? this.maximizedBoxes$.value.includes(c.id) && this.maxTitleBar.focusBox(c) : this.maxTitleBar.focusBox(c));
  }
  focusTopBox() {
    if (this.topBox && !this.topBox.focus)
      return this.focusBox(this.topBox);
  }
  blurBox(i, o = !1) {
    const c = this.getBox(i);
    c && (c.focus && (c.setFocus(!1, o), o || this.events.emit(Gn.Blurred, c)), this.maxTitleBar.focusedBox === c && this.maxTitleBar.focusBox());
  }
  blurAll(i = !1) {
    this.boxes.forEach((o) => {
      o.focus && (o.setFocus(!1, i), i || this.events.emit(Gn.Blurred, o));
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
    ), o.title != null && (i.setTitle(o.title), this.maxTitleBar.updateTitles()), o.visible != null && i.setVisible(o.visible, c), o.minHeight != null && i.setMinHeight(o.minHeight, c), o.minWidth != null && i.setMinWidth(o.minWidth, c), o.resizable != null && i.setResizable(o.resizable, c), o.draggable != null && i.setDraggable(o.draggable, c), o.fixRatio != null && i.setFixRatio(o.fixRatio, c), o.zIndex != null && i.setZIndex(o.zIndex, c), o.content != null && i.mountContent(o.content), o.footer != null && i.mountFooter(o.footer);
  }
  smartPosition(i = {}) {
    let { x: o, y: c } = i;
    const { width: h = 0.5, height: m = 0.5 } = i;
    if (o == null) {
      let w = 20;
      this.topBox && (w = this.topBox.intrinsicX * this.containerRect.width + 20, w > this.containerRect.width - h * this.containerRect.width && (w = 20)), o = w / this.containerRect.width;
    }
    if (c == null) {
      let w = 20;
      this.topBox && (w = this.topBox.intrinsicY * this.containerRect.height + 20, w > this.containerRect.height - m * this.containerRect.height && (w = 20)), c = w / this.containerRect.height;
    }
    return { ...i, x: o, y: c, width: h, height: m };
  }
  makeBoxTop(i, o = !1) {
    if (this.topBox && i !== this.topBox)
      if (this.maximizedBoxes$.value.includes(i.id)) {
        const c = this.topBox.zIndex + 1, h = Jk(
          this.boxes$.value.map((w) => w.id),
          this.maximizedBoxes$.value,
          this.minimizedBoxes$.value
        ), m = this.boxes$.value.filter(
          (w) => h.includes(w.id)
        );
        i._zIndex$.setValue(c, o), m.sort((w, g) => w._zIndex$.value - g._zIndex$.value).forEach((w, g) => {
          w._zIndex$.setValue(c + 1 + g, o);
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
  getBox(i) {
    return typeof i == "string" ? this.boxes.find((o) => o.id === i) : i;
  }
}
const aP = (r, i, o, c, h) => new sP(
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
    callbacks: i,
    emitter: o,
    boxEmitter: c
  },
  h
);
class sP {
  constructor(i, o) {
    this.context = i, this.createTeleBoxManagerConfig = o;
    const { emitter: c, callbacks: h, boxEmitter: m } = i;
    this.teleBoxManager = this.setupBoxManager(o), this.teleBoxManager._state$.reaction((w) => {
      h.emit("boxStateChange", w), c.emit("boxStateChange", w);
    }), this.teleBoxManager._darkMode$.reaction((w) => {
      h.emit("darkModeChange", w);
    }), this.teleBoxManager._prefersColorScheme$.reaction((w) => {
      h.emit("prefersColorSchemeChange", w);
    }), this.teleBoxManager._minimizedBoxes$.reaction((w) => {
      w.length || setTimeout(() => {
        const g = 1e-3 * (Math.random() > 0.5 ? 1 : -1);
        this.teleBoxManager.boxes.forEach((x) => {
          x.resize(x.intrinsicWidth + g, x.intrinsicHeight + g, !0);
        });
      }, 400);
    }), this.teleBoxManager.events.on("minimized", (w) => {
      this.context.safeSetAttributes({ minimizedBoxes: JSON.stringify(w) });
    }), this.teleBoxManager.events.on("maximized", (w) => {
      this.context.safeSetAttributes({ maximizedBoxes: JSON.stringify(w) });
    }), this.teleBoxManager.events.on("removed", (w) => {
      w.forEach((g) => {
        m.emit("close", { appId: g.id });
      });
    }), this.teleBoxManager.events.on(
      "intrinsic_move",
      xs((w) => {
        m.emit("move", { appId: w.id, x: w.intrinsicX, y: w.intrinsicY });
      }, 50)
    ), this.teleBoxManager.events.on(
      "intrinsic_resize",
      xs((w) => {
        m.emit("resize", {
          appId: w.id,
          width: w.intrinsicWidth,
          height: w.intrinsicHeight
        });
      }, 200)
    ), this.teleBoxManager.events.on("focused", (w) => {
      w && (this.canOperate ? m.emit("focus", { appId: w.id }) : this.teleBoxManager.blurBox(w.id));
    }), this.teleBoxManager.events.on("z_index", (w) => {
      this.context.updateAppState(w.id, Xi.ZIndex, w.zIndex);
    }), c.on("playgroundSizeChange", () => this.updateManagerRect()), c.on("updateManagerRect", () => this.updateManagerRect()), c.on("onScaleChange", (w) => {
      this.changeScale(w);
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
    var T, A, I;
    if (!this.teleBoxManager)
      return;
    let { minwidth: o = KD, minheight: c = eN } = (T = i.app.config) != null ? T : {};
    const { width: h, height: m } = (A = i.app.config) != null ? A : {}, w = ((I = i.options) == null ? void 0 : I.title) || i.appId, g = this.teleBoxManager.containerRect;
    o > 1 && (o = o / g.width), c > 1 && (c = c / g.height);
    const x = {
      title: w,
      minWidth: o,
      minHeight: c,
      width: h,
      height: m,
      id: i.appId
    };
    this.teleBoxManager.create(x, i.smartPosition), this.context.emitter.emit(`${i.appId}${Gt.WindowCreated}`);
  }
  setBoxInitState(i) {
    const o = this.teleBoxManager.queryOne({ id: i });
    o && o.state === dn.Maximized && this.context.boxEmitter.emit("resize", {
      appId: i,
      x: o.x,
      y: o.y,
      width: o.intrinsicWidth,
      height: o.intrinsicHeight
    });
  }
  setupBoxManager(i) {
    const o = Ht.wrapper ? Ht.wrapper : document.body, c = o.getBoundingClientRect(), h = {
      root: o,
      containerRect: {
        x: 0,
        y: 0,
        width: c.width,
        height: c.height
      },
      fence: !1,
      prefersColorScheme: i == null ? void 0 : i.prefersColorScheme
    }, m = new rP(h);
    this.teleBoxManager && this.teleBoxManager.destroy(), this.teleBoxManager = m;
    const w = (i == null ? void 0 : i.collectorContainer) || Ht.wrapper;
    return w && this.setCollectorContainer(w), m;
  }
  setCollectorContainer(i) {
    var c;
    const o = new VM({
      styles: (c = this.createTeleBoxManagerConfig) == null ? void 0 : c.collectorStyles
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
      !0
    ), setTimeout(() => {
      i.focus && this.teleBoxManager.focusBox(o.id, !0), i.maximized != null && this.teleBoxManager.setMaximizedBoxes(jv(i.maximizedBoxes) ? JSON.parse(i.maximizedBoxes) : [], !0), i.minimized != null && this.teleBoxManager.setMinimizedBoxes(jv(i.minimizedBoxes) ? JSON.parse(i.minimizedBoxes) : [], !0);
    }, 50), this.context.callbacks.emit("boxStateChange", this.teleBoxManager.state));
  }
  updateManagerRect() {
    var o;
    const i = (o = Ht.wrapper) == null ? void 0 : o.getBoundingClientRect();
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
    if (!!jv(i))
      try {
        this.teleBoxManager.setMaximizedBoxes(JSON.parse(i), o);
      } catch (c) {
        console.log(c);
      }
  }
  setMinimized(i, o = !0) {
    if (!!jv(i))
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
    this.teleBoxManager.setReadonly(i);
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
function ig() {
}
function HM(r) {
  return r();
}
function gT() {
  return /* @__PURE__ */ Object.create(null);
}
function dg(r) {
  r.forEach(HM);
}
function oP(r) {
  return typeof r == "function";
}
function lP(r, i) {
  return r != r ? i == i : r !== i || r && typeof r == "object" || typeof r == "function";
}
let Hv;
function rg(r, i) {
  return Hv || (Hv = document.createElement("a")), Hv.href = i, r === Hv.href;
}
function uP(r) {
  return Object.keys(r).length === 0;
}
function vo(r, i) {
  r.appendChild(i);
}
function fg(r, i, o) {
  r.insertBefore(i, o || null);
}
function cp(r) {
  r.parentNode.removeChild(r);
}
function ol(r) {
  return document.createElement(r);
}
function gS(r) {
  return document.createTextNode(r);
}
function Qb() {
  return gS(" ");
}
function An(r, i, o) {
  o == null ? r.removeAttribute(i) : r.getAttribute(i) !== o && r.setAttribute(i, o);
}
function cP(r) {
  return Array.from(r.childNodes);
}
function WM(r, i) {
  i = "" + i, r.wholeText !== i && (r.data = i);
}
function wi(r, i, o, c) {
  r.style.setProperty(i, o, c ? "important" : "");
}
let FM;
function ag(r) {
  FM = r;
}
const Yh = [], yT = [], Kv = [], wT = [], dP = Promise.resolve();
let Zb = !1;
function fP() {
  Zb || (Zb = !0, dP.then($M));
}
function Yb(r) {
  Kv.push(r);
}
let gb = !1;
const yb = /* @__PURE__ */ new Set();
function $M() {
  if (!gb) {
    gb = !0;
    do {
      for (let r = 0; r < Yh.length; r += 1) {
        const i = Yh[r];
        ag(i), hP(i.$$);
      }
      for (ag(null), Yh.length = 0; yT.length; )
        yT.pop()();
      for (let r = 0; r < Kv.length; r += 1) {
        const i = Kv[r];
        yb.has(i) || (yb.add(i), i());
      }
      Kv.length = 0;
    } while (Yh.length);
    for (; wT.length; )
      wT.pop()();
    Zb = !1, gb = !1, yb.clear();
  }
}
function hP(r) {
  if (r.fragment !== null) {
    r.update(), dg(r.before_update);
    const i = r.dirty;
    r.dirty = [-1], r.fragment && r.fragment.p(r.ctx, i), r.after_update.forEach(Yb);
  }
}
const pP = /* @__PURE__ */ new Set();
function mP(r, i) {
  r && r.i && (pP.delete(r), r.i(i));
}
function vP(r, i, o, c) {
  const { fragment: h, on_mount: m, on_destroy: w, after_update: g } = r.$$;
  h && h.m(i, o), c || Yb(() => {
    const x = m.map(HM).filter(oP);
    w ? w.push(...x) : dg(x), r.$$.on_mount = [];
  }), g.forEach(Yb);
}
function gP(r, i) {
  const o = r.$$;
  o.fragment !== null && (dg(o.on_destroy), o.fragment && o.fragment.d(i), o.on_destroy = o.fragment = null, o.ctx = []);
}
function yP(r, i) {
  r.$$.dirty[0] === -1 && (Yh.push(r), fP(), r.$$.dirty.fill(0)), r.$$.dirty[i / 31 | 0] |= 1 << i % 31;
}
function wP(r, i, o, c, h, m, w, g = [-1]) {
  const x = FM;
  ag(r);
  const T = r.$$ = {
    fragment: null,
    ctx: null,
    props: m,
    update: ig,
    not_equal: h,
    bound: gT(),
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(x ? x.$$.context : i.context || []),
    callbacks: gT(),
    dirty: g,
    skip_bound: !1,
    root: i.target || x.$$.root
  };
  w && w(T.root);
  let A = !1;
  if (T.ctx = o ? o(r, i.props || {}, (I, z, ...F) => {
    const $ = F.length ? F[0] : z;
    return T.ctx && h(T.ctx[I], T.ctx[I] = $) && (!T.skip_bound && T.bound[I] && T.bound[I]($), A && yP(r, I)), z;
  }) : [], T.update(), A = !0, dg(T.before_update), T.fragment = c ? c(T.ctx) : !1, i.target) {
    if (i.hydrate) {
      const I = cP(i.target);
      T.fragment && T.fragment.l(I), I.forEach(cp);
    } else
      T.fragment && T.fragment.c();
    i.intro && mP(r.$$.fragment), vP(r, i.target, i.anchor, i.customElement), $M();
  }
  ag(x);
}
class bP {
  $destroy() {
    gP(this, 1), this.$destroy = ig;
  }
  $on(i, o) {
    const c = this.$$.callbacks[i] || (this.$$.callbacks[i] = []);
    return c.push(o), () => {
      const h = c.indexOf(o);
      h !== -1 && c.splice(h, 1);
    };
  }
  $set(i) {
    this.$$set && !uP(i) && (this.$$.skip_bound = !0, this.$$set(i), this.$$.skip_bound = !1);
  }
}
function bT(r) {
  let i, o, c, h, m, w, g, x = r[18] && ST(r), T = r[19] && xT(r);
  return {
    c() {
      i = ol("div"), o = ol("div"), x && x.c(), c = Qb(), h = ol("span"), m = gS(r[1]), w = Qb(), T && T.c(), wi(h, "overflow", "hidden"), wi(h, "white-space", "nowrap"), wi(h, "text-overflow", "ellipsis"), wi(h, "max-width", "80px"), An(o, "class", r[9]), wi(o, "background-color", r[3]), wi(o, "color", r[10]), wi(o, "opacity", r[12]), An(i, "class", g = "netless-window-manager-cursor-name " + r[16] + " " + r[15]);
    },
    m(A, I) {
      fg(A, i, I), vo(i, o), x && x.m(o, null), vo(o, c), vo(o, h), vo(h, m), vo(o, w), T && T.m(o, null);
    },
    p(A, I) {
      A[18] ? x ? x.p(A, I) : (x = ST(A), x.c(), x.m(o, c)) : x && (x.d(1), x = null), I & 2 && WM(m, A[1]), A[19] ? T ? T.p(A, I) : (T = xT(A), T.c(), T.m(o, null)) : T && (T.d(1), T = null), I & 512 && An(o, "class", A[9]), I & 8 && wi(o, "background-color", A[3]), I & 1024 && wi(o, "color", A[10]), I & 4096 && wi(o, "opacity", A[12]), I & 98304 && g !== (g = "netless-window-manager-cursor-name " + A[16] + " " + A[15]) && An(i, "class", g);
    },
    d(A) {
      A && cp(i), x && x.d(), T && T.d();
    }
  };
}
function ST(r) {
  let i, o;
  return {
    c() {
      i = ol("img"), An(i, "class", "netless-window-manager-cursor-selector-avatar"), An(i, "style", r[20]()), rg(i.src, o = r[8]) || An(i, "src", o), An(i, "alt", "avatar");
    },
    m(c, h) {
      fg(c, i, h);
    },
    p(c, h) {
      h & 256 && !rg(i.src, o = c[8]) && An(i, "src", o);
    },
    d(c) {
      c && cp(i);
    }
  };
}
function xT(r) {
  let i, o;
  return {
    c() {
      i = ol("span"), o = gS(r[2]), An(i, "class", "netless-window-manager-cursor-tag-name"), wi(i, "background-color", r[11]);
    },
    m(c, h) {
      fg(c, i, h), vo(i, o);
    },
    p(c, h) {
      h & 4 && WM(o, c[2]), h & 2048 && wi(i, "background-color", c[11]);
    },
    d(c) {
      c && cp(i);
    }
  };
}
function SP(r) {
  let i, o, c, h, m, w, g, x = !r[14] && bT(r);
  return {
    c() {
      i = ol("div"), x && x.c(), o = Qb(), c = ol("div"), h = ol("img"), An(h, "class", m = "netless-window-manager-cursor-" + r[4] + "-image " + r[15]), rg(h.src, w = r[7]) || An(h, "src", w), An(h, "alt", r[4]), An(c, "class", "cursor-image-wrapper"), An(i, "class", g = "netless-window-manager-cursor-mid" + (r[13] ? " netless-window-manager-cursor-custom" : "")), wi(i, "transform", "translateX(" + r[5] + "px) translateY(" + r[6] + "px)"), wi(i, "display", r[17]), An(i, "data-cursor-uid", r[0]);
    },
    m(T, A) {
      fg(T, i, A), x && x.m(i, null), vo(i, o), vo(i, c), vo(c, h);
    },
    p(T, [A]) {
      T[14] ? x && (x.d(1), x = null) : x ? x.p(T, A) : (x = bT(T), x.c(), x.m(i, o)), A & 32784 && m !== (m = "netless-window-manager-cursor-" + T[4] + "-image " + T[15]) && An(h, "class", m), A & 128 && !rg(h.src, w = T[7]) && An(h, "src", w), A & 16 && An(h, "alt", T[4]), A & 8192 && g !== (g = "netless-window-manager-cursor-mid" + (T[13] ? " netless-window-manager-cursor-custom" : "")) && An(i, "class", g), A & 96 && wi(i, "transform", "translateX(" + T[5] + "px) translateY(" + T[6] + "px)"), A & 131072 && wi(i, "display", T[17]), A & 1 && An(i, "data-cursor-uid", T[0]);
    },
    i: ig,
    o: ig,
    d(T) {
      T && cp(i), x && x.d();
    }
  };
}
function xP(r, i, o) {
  let c, h, m, w, g, x, T, A, { uid: I } = i, { cursorName: z } = i, { tagName: F } = i, { backgroundColor: $ } = i, { appliance: J } = i, { x: q } = i, { y: de } = i, { src: se } = i, { visible: Z } = i, { avatar: ue } = i, { theme: oe } = i, { color: Le } = i, { cursorTagBackgroundColor: Qe } = i, { opacity: je } = i, { pencilEraserSize: Y } = i, { custom: he } = i;
  const Ie = () => Object.entries({
    width: (c ? 19 : 28) + "px",
    height: (c ? 19 : 28) + "px",
    position: c ? "initial" : "absolute",
    "border-color": c ? "white" : $,
    "margin-right": (c ? 4 : 0) + "px"
  }).map(([ie, st]) => `${ie}: ${st}`).join(";");
  return r.$$set = (ie) => {
    "uid" in ie && o(0, I = ie.uid), "cursorName" in ie && o(1, z = ie.cursorName), "tagName" in ie && o(2, F = ie.tagName), "backgroundColor" in ie && o(3, $ = ie.backgroundColor), "appliance" in ie && o(4, J = ie.appliance), "x" in ie && o(5, q = ie.x), "y" in ie && o(6, de = ie.y), "src" in ie && o(7, se = ie.src), "visible" in ie && o(21, Z = ie.visible), "avatar" in ie && o(8, ue = ie.avatar), "theme" in ie && o(9, oe = ie.theme), "color" in ie && o(10, Le = ie.color), "cursorTagBackgroundColor" in ie && o(11, Qe = ie.cursorTagBackgroundColor), "opacity" in ie && o(12, je = ie.opacity), "pencilEraserSize" in ie && o(22, Y = ie.pencilEraserSize), "custom" in ie && o(13, he = ie.custom);
  }, r.$$.update = () => {
    r.$$.dirty & 2 && (c = !Gh(z)), r.$$.dirty & 4 && o(19, h = !Gh(F)), r.$$.dirty & 256 && o(18, m = !Gh(ue)), r.$$.dirty & 2097152 && o(17, w = Z ? "" : "none"), r.$$.dirty & 16 && o(14, g = J === Rn.laserPointer), r.$$.dirty & 16400 && o(23, x = g || J === Rn.pencilEraser), r.$$.dirty & 8388608 && o(16, T = x ? "netless-window-manager-laserPointer-pencilEraser-offset" : ""), r.$$.dirty & 4194304 && o(15, A = Y === 3 ? "netless-window-manager-pencilEraser-3-offset" : "");
  }, [
    I,
    z,
    F,
    $,
    J,
    q,
    de,
    se,
    ue,
    oe,
    Le,
    Qe,
    je,
    he,
    g,
    A,
    T,
    w,
    m,
    h,
    Ie,
    Z,
    Y,
    x
  ];
}
class CP extends bP {
  constructor(i) {
    super(), wP(this, i, xP, SP, lP, {
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
const QM = "data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Ccircle cx='12' cy='12' r='2.5' stroke='%23000' stroke-linejoin='square'/%3E%3Ccircle cx='12' cy='12' r='3.5' stroke='%23FFF'/%3E%3C/g%3E%3C/svg%3E";
function ZM(r) {
  return `data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Ccircle cx='12' cy='12' r='2.5' stroke='%23${r}' stroke-linejoin='square'/%3E%3Ccircle cx='12' cy='12' r='3.5' stroke='%23${r}'/%3E%3C/g%3E%3C/svg%3E`;
}
function Md(r) {
  return `data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg' fill='none'%3E%3Cpath d='M5 12H19' stroke='%23${r}' stroke-linejoin='round'/%3E%3Cpath d='M12 5V19' stroke='%23${r}' stroke-linejoin='round'/%3E%3C/svg%3E`;
}
function Ru(r) {
  return `url("${r}") 12 12, auto`;
}
function TP(r) {
  let i = "";
  for (const o in r)
    i += `.netless-whiteboard.${o} {cursor: ${r[o]}}
`;
  return i;
}
const Wv = document.createElement("style");
function MP(r) {
  const [i, o, c] = r.strokeColor, h = ((1 << 24) + (i << 16) + (o << 8) + c).toString(16).slice(1);
  return Wv.textContent = TP({
    "cursor-pencil": Ru(ZM(h)),
    "cursor-eraser": Ru(QM),
    "cursor-rectangle": Ru(Md(h)),
    "cursor-ellipse": Ru(Md(h)),
    "cursor-straight": Ru(Md(h)),
    "cursor-arrow": Ru(Md(h)),
    "cursor-shape": Ru(Md(h))
  }), document.head.appendChild(Wv), () => {
    Wv.parentNode != null && document.head.removeChild(Wv);
  };
}
const EP = /* @__PURE__ */ new Set([
  Rn.rectangle,
  Rn.ellipse,
  Rn.straight,
  Rn.arrow,
  Rn.shape
]);
function CT(r, i) {
  if (r === Rn.pencil)
    return ZM(i);
  if (r === Rn.eraser)
    return QM;
  if (EP.has(r))
    return Md(i);
}
class IP {
  constructor(i, o, c, h) {
    this.manager = i, this.memberId = o, this.cursorManager = c, this.wrapper = h, this.style = "default", this.move = (m) => {
      var w;
      if (m.type === "main") {
        const g = this.cursorManager.wrapperRect;
        this.component && g && (this.autoHidden(), this.moveCursor(m, g, this.manager.mainView));
      } else {
        const g = this.cursorManager.focusView, x = (w = g == null ? void 0 : g.divElement) == null ? void 0 : w.getBoundingClientRect(), T = g == null ? void 0 : g.camera;
        g && x && T && this.component && (this.autoHidden(), this.moveCursor(m, x, g));
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
    var x, T;
    const { x: h, y: m, type: w } = i, g = c == null ? void 0 : c.screen.convertPointToScreen(h, m);
    if (g) {
      let A = g.x - 2, I = g.y - 18;
      if (this.isCustomIcon() && (A -= 11, I += 4), w === "app") {
        const z = this.cursorManager.wrapperRect;
        z && (A = A + o.x - z.x, I = I + o.y - z.y);
      }
      g.x < 0 || g.x > o.width || g.y < 0 || g.y > o.height ? (x = this.component) == null || x.$set({ visible: !1, x: A, y: I }) : (T = this.component) == null || T.$set({ visible: !0, x: A, y: I });
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
    this.member && this.wrapper && (this.component = new CP({
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
    m === Rn.pencilEraser && (m = `${m}${((x = this.member) == null ? void 0 : x.memberState.pencilEraserSize) || 1}`);
    const w = m && c[m];
    if (w)
      return w;
    if (this.style === "custom" && i) {
      const T = CT(i, o);
      if (T)
        return T;
    }
    return h[m || Rn.shape] || h[Rn.shape];
  }
  isCustomIcon() {
    var w;
    if (!this.member)
      return !1;
    const { memberApplianceName: i, memberColorHex: o } = this, { userApplianceIcons: c } = this.cursorManager;
    let h = this.memberApplianceName;
    return h === Rn.pencilEraser && (h = `${h}${((w = this.member) == null ? void 0 : w.memberState.pencilEraserSize) || 1}`), h && c[h] ? !1 : !!(this.style === "custom" && i && CT(i, o));
  }
  updateMember() {
    return this.member = jb(this.manager.room, this.memberId), this.updateComponent(), this.member;
  }
  updateComponent() {
    var i;
    (i = this.component) == null || i.$set(tS(this.initProps(), ["x", "y"]));
  }
  destroy() {
    this.component && this.component.$destroy(), this.cursorManager.cursorInstances.delete(this.memberId), this.timer && clearTimeout(this.timer);
  }
  hide() {
    this.component && (this.component.$set({ visible: !1 }), this.destroy());
  }
}
const AP = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAA0CAYAAADFeBvrAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAYISURBVHgB7ZpNSCtXFIBPEuvz+dMGpYUKD/sWFX+Qti6kK7Hqpm6e9q0rIoIUFUShPLV10VZx4+JZqa9v20LBhdq9fyBUCtKNPH8qYl2IOw3G38Rkek4y15y5uTOZJDOWggcOSSYzN/ebc+45554JwIM8iBCPyTEP+86T4vyMfsRN4b+nQTKIJp0vzuGvlpID7os8EQNEIBD4oKio6Bm9DwaDv/v9/n/076JgbtWUYPchwrW8qD7UnOvr6wFNkpubm+/wu7f0c7y6mrnlvQufxB0Iau7V1dX3BDA/P6/V1dVpzc3N2uLiIofK1c8VYHys/wRKBUN3/hGHqaysNOjc3FwMis6hc0FtLTHuvYLxCCZgci8uLn4wg5Gh6Fy8Jk+/NkcCAlAAuUkoW4g0B+d5tLS05O/r67O8eGxsDNra2uDy8nKsoKCAwCIQDxQa0yTxgrvCYXyTk5Ml+Orf2dlJeeHIyAigFSE/P38ELfUNqNdSkjgF5FF89jL1TU1NlQwODl5gZPujp6cHWltbUw7Koc7Pz8mkZpHPFeFrJuZeqLnoMoPoZqe0JjDP/IZgnyLUG/o8NDRkuo5Ua2pjY6MC4oFCFf1cA0oKzRSOp6enRfTaGh0d/QxBt+1CUVgnOTs7+xrHfQzGyOcKkK3QTJMnQffZ6e/v/xwttmsHqqmpKXbdycnJCxy7ABLh3FEgVZ6hZJhnFZoFFMF0d3c/w7v+dyookXBnZ2c/xvHfhriVcvXfdBRItsxjnOhYqjwjoAimq6vrCysoGofk+Ph4Esd/F/UdiFtJAGUd2DygTpp5dmBUUJ2dnc9VUALm8PDwJY7/BPU9VD8k3M4RC6kskxZMKigKIMLN9vf3p3H8DyWgfEhEOwOQD9IXOTz7EObbwsLC4YWFBRgeHrY9ECXYo6MjaGlpKWlsbPxkYGDgRW1tbSEWquVlZWXBzc3Nl1VVVa8hXiXc6ioqBqGaPDk7AACJTRZ3NS9lcUp86cJwoSQ7Pj4Op6enfxUXF3/V0NCQv7q6GsCvwrqGUG/01xAD4+VQTOxaSF43d5bBOisrGBJRCtXX17+/trb268rKSgASFgmz97KFkmo6OztWuVyPweiWGc4WRkhFRQVEIpHg8vJyQAIQVlLBROVxvBYQHsXnO8tk62ZcyN0wecLBwcEvYHSzEPscBqOLCRhLC4n9uqaA8UAWAcAKhtbQ3t7eTHl5+Y9gtAp3twhT056CDMQ7MRzIFTeTYKb1yYYVQFH9VdzsqNmYKpfTJBDX3Ixgdnd3XyHMT2AMALJlBBSPaMpNngrIsTyTCgaj288YDGakictrxizvKFNOjgSSBLS+vv6UYHDb7DgMVgsChjTEgCIKGG4ZU+EWkgNBzN1qamq+pAMTExPgFMzW1tZrhHkFyWE5KxgSszx0527RaDRmOSpRshEOU11dPQPG8CwHARHJlMnTSrwSRFIlfXt7m3V5ngJGuJtqzaQtZkFBVNJezN5ZAdmwjKo2k9tVtrcI3OXk4tPgcg7ChCDZ1URgMOu72Xa5VFHOkymQhWVU60YVmjN6wiC7k6p+S1syCACOwJBYFaexV+yhBekNPsMBO6KAEeE4BMaCU67RsoYhSbXgaT//ht709vZCaWmp6YkEbLFmVJWzas04+iBL7EKpm0J7duqu0B7+CTUpNJuyvb1NCfMj1CqI9wLKUOlOUMeG+gGFkHii4HizUF4z/KFUrPsJ8WbEIyx7nnZ0dDynME6BAuce09iFHo+GrnmGltltb2//E4wVAN82y7vOjKOZXSBhJdHNiT3TYWD8OY2PTUJkdd7MkJMnT5wZVQF2RFX6yBMUdzPMvvfqxz3sXHF+GNT9ANXit/10O1sgHkZvdQAOKvs9B5L7ARELGAAXLSTvM8QExTE+YbHe+HURhZp1aRyF4CJXClbbWwGketgkW9VsY+YaiBCVhfgE+XvxRwgZSM4jUVCDZFQ9pytmXR8hUTB2gnidx4XffVWydN0yQjwmx/jkAZJBrIBI5J7ZvQGZWUgVSuU/EqmOAzicKNMVu816DdRWUV1/7xAP8n+SfwF3Du3NF2sYhwAAAABJRU5ErkJggg==", RP = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADEAAAAxCAYAAABznEEcAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAZoSURBVHgB7VlLSCRXFL3ljNEhEXTGhMQJmOjCz8ZNVLKICz9xIYhCNi7UgINkGEk2En8hW5cBUQNxo05GAoKikuCAmvGzGMdPcCUGjDPxD/4Vv/3JvWW97luvq7ur+hMZ8MKlqrteNfe8e965970GuLVbC5kpJr53+hjHx9yY3TUxJgLMAQG4ITARfp5T4Mri4uL9q6urnxwOxz/oY5eXl1/Pzs7e195X2FX4jZsIhAK7gx5ps9m6nGj9/f3OtbU1pzAE0318fPwVjYHrrN7R3AjU/wpOBwA9Cmf/9ejoqDMtLU31iooKGdA+ATo4OMiXAEWAHhBAGEApXj4rPAik0vPt7e0vCgoKPH4gMzMTSktLIS8vD2JiYgABvcHMTZyennbHxsaOg3udOJmLzwqEYB0ZgRCZENm4u7e39yQuLq65srISZmZmvP5Ybm4u5OfnQ0lJyXWUCAgzNLS+vt6SnJz8WgvYwV5xSlcRgyVg3ha2Dkxzc3MvfZmVlQW+bGxsDBobGyE7O1u94uJPjIqKqklKSvrbbrfPnp+ff7e8vJwMnlSTKWfJjDKhywJo6wLp0YcZ+dyIUr7s4cOHLsrRlQwBTSBFuzc2NiZYhjjVAIyzZBqEwgCQv0OOM/gNzuiP/ijlDxBRjgClpqa6AF1cXDydmpoaLCws3JcAGYHyC4JMzoKaibKysvienp6FtrY2IA/WCFB5ebkqCHSvARo8Ozt7igIxwIJ2gJ+seFMnDoIyEUV+dHT0G3qWVUr5M043DdAB0m2IKZwAYpgZX+qkywR6NFbuR0iDxmAoZRUQKRxSLTMnJ8eIaqqSeVMnIYUOdu+sq6vrp4f+VCoYo8khZaNs01VRlERUu2/BrWAA7sl2Anink1Ao18JGjyY/PDx8hq1GZqgp5c2mp6chMjLy2b179x7hRzvoqeUUwXIzqq4O5nZsNUaEbIbLqPLTou/s7FTvT05OpsA9sXJG1AVsZDwjutqBIN6gUlWjxod8XRBNKXgsrqpqYZfwEqX9h8TExD7wbFm8LmzxHQ0QHSlXKZVSqFC/hkqlaKapTaGgCQTK7PHW1lb/wsLC86KiokkccoV+qV1tcE0pO7AWxmhTxBszDzqRr66ujqanp2cRpQLNBgUsCh8BwQ54bn5+/s+mpqa+4eHhfS1gb52vwuP0trPjhSZCBtLQ0NA3MDDQQIFYAUHBYhuvzjpVbJr1lZWVP3p7e19UVVXNgHumXYrI4uBx6Yqevz02b0FcRQ8CoBQF3dXVpQLZ3d39C7n+ora29vfJyclDYFnWgFyxK3cxhss/+KoT/N6DVkQpKypFGUCp3Ozo6HgSHx//GLW/BwHsg57zl5pzADajwLn52mPL1ZHPloMoRYPMFL6EhAR18e7s7MxVV1fPsAAp4Avteq7dC/c1+wKI4g+EfGzDM+EYHBw8RDrNiA2QL6upqVGvKJ2/gHu2L1nA5wwEB2YDfSYMO1x/px0cgEc2zBY+eo67u6H29vZ/wU2VC8l58JxKNjDOgojNEp08aFVfX++3l6JMEdDx8fEB0FNIBsDXBc8ArwuW1EkeI1RKdLWmCx+1DhkZGRvR0dFfSsHKxYtnW0iqvJAN9xNm6MR/QO5sfapUSkqKmqW5ubmfwVgyZdpw/vPZl2kUEAinBMSUStG+gwra0NDQSynQKyloIxnlewafjDFLJzLRBJqiFMnqyMgIbG5uDuD996Dnv8iAPOMAPmbcm5lVJwA/vZRMKZGZlpaWVtAvUL4GZMqE1fjRJrUd76LHoX+InlhcXPwZnWW2tra6jjrpiBM3UK/weQr6J+gfodMh9HtwncG7YLA3CMSsLmxx5WuDCt8B7vZeicInTjCWlpb6wc15mfey7oc9E8LElpVmMgb9AXoC+qcTExOPKRu4NlTHs6Q10GfhgfYOvRsJQZ76BWMKuDtaolQs+gfoH6Mn436gDg+e+5BKXUQx/C5Je/a+NpbeiQJPKgUdlNXx/BCBKxVdxW5Q0I3XBqFKRhU4KLtjYawi3csuTKdc4FnIXNvKUJkVEGRG20QZAAUpA5DbaYAQLmQzfzxyk/ffdnCD4NWVnGdE7kQBQvQHC5lVEDxgMaM29lkxGCNLKrDnIbFAMkFmBIaDkHstU41coGZ1TZD5UjReCGUAYbNgdNqoXZB/T67yYbFAMiGML3BhYeH8rb0t9h/zgcTBcTNGiQAAAABJRU5ErkJggg==", DP = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAA0CAYAAADFeBvrAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAgrSURBVHgB7ZprTBRXFIDP7gIt8lQppTwE5V0KaAn6o1pqNGkDDTEmTUhsgKRp+gNJw68CFkLbVC2QkDS+gD8KJdWmARvbFBNNWpuIRGPFWBXQRMPDqIki+KLATs+ZnTvcvXtnX8w2beJJToaduTP3fHPOPffcOwC8kP+2WCDwIvahGFxTuN8KmNSZmULPNjLeqF9F8rdPkIEGEn+r+vjx46LQ0NA8/Dsader58+e/h4WFDWntFO7ot6fMFAt3JLWi2lCDpqamCux2+2+KROj82NhYGrXT2lu5Z/DP/deFByElA4Pv3LlTiHY/nJ6eVnbv3q1s2bJFyc7OVrZu3arU1dUp4+PjxPUQoT+g9tp9PkMFgpo9kxljHRoaWp2Xl3duYmIiurKyEvDoclNCQgIcPnxYPc7MzHwcGRnZhaft4Ag7O9fUbRhaITCie4lgcnNzT7qDIaHz27dvh+vXr0NEREQneqoCHKFnAR+8ZCaQGGq2CxcurCGYycnJZHcwTNAzUFFRoUJFRUV1IFQ5OKBsXB9uxSwgl0TQ3d29Yt26dccwoyVXV1d7hGEiQmGi2AzOUHx/hob4K2yuYS9G987s7OwPISEh7xPM6dOnwVfBsIMjR45AZmbmo5s3b76Xnp7+J55egMVxBSAZT0v1ED+76yn66dOnLQSzd+9ev2BIyFP0MjBco1JTU/sxfFeDazp3cYgZHmKqdoaGNISHh9fv378fSJcqlPV6e3sBJ+I/goOD34VFL0k95Y+HxPHCYGxmw5DQ2NuzZw8EBQVtunXr1jvgwUP+hhz/QDXMMCNVE8zx48dNg2FCz6QQjI2N/RA8VBFmANnu3btXihnpG8pM9fX1EAi5du0aeWkVOAMBCF7yN+R0z4yOjq6NiYlpp9CgdBtIwXpPH6vgDKWLt0CygtM6MDCwBuUYZSKaOCksAiVY9wFOBePgDOOytPAGSKzNVCCC2bBhw69YdK7ypgpYimzbtk2dl7CM+hFcveOUHDylbTFO1YdhFbByx44dA1QFUP0VSJj4+Hjo6+sDq9U6iEmHKvFZTedQ50GYbN15SITVlwNlZWUnLRZL8s6dOwMOQ9UCTtKTra2ttdppt9V2kMF5cbmsjxuM43bMNrmUzc6fP6+GQiDGDoOJi4ubwb4qm5ubafyIE6nLxGqTPEsGo1cBOGNX0TyDYafC0CyOaxcVziyh53Z2dkJycvLMvn37PmpoaBgFR4jxYSbWdVIgI89Iq4CjR48CZjlYv369+tssqI6ODsjPz4f+/v668vLycxrEHHfkYdwC8SB6mGEV8Cl64cuuri5oa2tTG+EyGjZu3AiXLl1qefDgwV8lJSUFZkDV1tZCcXExXLx4sbWoqKgPFj0zx8GI9ZwO5W4M6ekZYeqpaqbqmaSqqkpNpcPDw4dwzfM9nrLduHEjEs+X0XV/Sx96LnqE1kLtBQUF3eDwCO8dGQyzV5rl+JyuegfXI29jRotiRlKnpFghHMzKyjqotVXS0tLacKPjF3bdHxjSq1evduAkepAD+ZsDYlC8V5w8ZBVg+PPq2MGMlkInqE4joTf45MmT4YyMjAPcA+ltLSQlJX2BafxnX6HI29QeK44TOTk57mCYZ0QoJ8OBM4yB6dkNkwGlSygsLFQvYtYB3BTMxFL+M+0eFgZqp4mJiU2+QKGX1fGIk/QIrn0aYXGsyDxjmAyMhO2jhaCGoUbX1NSkLSwsPMJqV8Fspu6lIZS6OYhjiOLwdU7fQM1HfRPD7wS1obZ0j0xpb4726Z49ezaJf2/S7s9ATUGNR41BjdJseRnke3WGwhrRTS9pD1mOGoeG15BxOOfoxuCkp0Ih6NeaEaSZGlieJyiCoc1FgsGldokGk8nBvAKOrWIGQ5uPsm0tt0BWDiicAaGuGhkZ+YqMw9StGzU4OKhCnT179hNsswY1FTXdE5QEJhc1S3tGogazXLOBwQSBl3tzIhQPtAL1VQJCTcNx8y1vHIUghSKFZE9PT7H2dlM1b+Wgrr1y5Uq77J75+fnplpaWMg2ch4nlYEI5z7hdensDpI4hrYNErcMMXJ32koG4ztf3pultz83NjWG99Ra2WQ0OL2VjZjwgeufUqVOqV8+cOdPIwdBLSNJeHg8TAh5WqJ6EfSmgt7IMNRJ1JThiOlnrOAMHshprmMKdoGSCpb9s3B3SYLIFGIqICJB7xisYi+RvfiypXw40DWGdlJaWRmMd141hk8V2OWm7ieYTXhBc3+BgaZyqAISjOYxSMVvXsBTNlzdiNQDgRao2AtK3pjggpmrqbGpqSsLPIN/dv38/gaBwUjTshMHcvn27JyUlpRmc5xpPMD599LIYnLNyUKKndKjGxsakXbt2deMCLIE8IVvs0YRM1fjdu3d/wrXN5+BcnzEgvor2uN3rjzAYMp5lPEoQlE5fA0fWo8GfhlCbKVFQ1pKNIfzcOHH58mWqaimVUwJI0+6n59D4pIlzmdZPMPiZzXjDjX47Le5g0Uu8x2zgPqWyKpjVe7x3+AUbq9NYjQbgp2dsBud5o8TP7d5kHAWcQchQfoEmLgn8HjOiBIF7o5hI1x6CEbLNP3bdqYAF44JzyWLzcN1i8DcT/o3awbm8Fz3DAy2A62INwPV/E3wWdx5inmBHuwChCBD6R2JwHge80TIQRQLjt7e8DTkGZgfX8cUMZTDAteFDkveaIlzjX9ySQs8X18r2t2VHUURPKoICmDR+eCO9aSdmOIub3/w9RgpgUpiJhvraXpa6jZKHGEqyusw0GLFzX+5RhN/8kYnMSNMMfyH/V/kHST6OYVElTPAAAAAASUVORK5CYII=", NP = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNDBweCIgaGVpZ2h0PSI0MHB4IiB2aWV3Qm94PSIwIDAgNDAgNDAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDYwLjEgKDg4MTMzKSAtIGh0dHBzOi8vc2tldGNoLmNvbSAtLT4KICAgIDx0aXRsZT5zaGFwZS1jdXJzb3I8L3RpdGxlPgogICAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CiAgICA8ZGVmcz4KICAgICAgICA8cGF0aCBkPSJNMjAsMjEuNSBDMjAuMjQ1NDU5OSwyMS41IDIwLjQ0OTYwODQsMjEuNjc2ODc1MiAyMC40OTE5NDQzLDIxLjkxMDEyNDQgTDIwLjUsMjIgTDIwLjUsMjcgQzIwLjUsMjcuMjc2MTQyNCAyMC4yNzYxNDI0LDI3LjUgMjAsMjcuNSBDMTkuNzU0NTQwMSwyNy41IDE5LjU1MDM5MTYsMjcuMzIzMTI0OCAxOS41MDgwNTU3LDI3LjA4OTg3NTYgTDE5LjUsMjcgTDE5LjUsMjIgQzE5LjUsMjEuNzIzODU3NiAxOS43MjM4NTc2LDIxLjUgMjAsMjEuNSBaIE0yNywxOS41IEMyNy4yNzYxNDI0LDE5LjUgMjcuNSwxOS43MjM4NTc2IDI3LjUsMjAgQzI3LjUsMjAuMjQ1NDU5OSAyNy4zMjMxMjQ4LDIwLjQ0OTYwODQgMjcuMDg5ODc1NiwyMC40OTE5NDQzIEwyNywyMC41IEwyMiwyMC41IEMyMS43MjM4NTc2LDIwLjUgMjEuNSwyMC4yNzYxNDI0IDIxLjUsMjAgQzIxLjUsMTkuNzU0NTQwMSAyMS42NzY4NzUyLDE5LjU1MDM5MTYgMjEuOTEwMTI0NCwxOS41MDgwNTU3IEwyMiwxOS41IEwyNywxOS41IFogTTE4LDE5LjUgQzE4LjI3NjE0MjQsMTkuNSAxOC41LDE5LjcyMzg1NzYgMTguNSwyMCBDMTguNSwyMC4yNDU0NTk5IDE4LjMyMzEyNDgsMjAuNDQ5NjA4NCAxOC4wODk4NzU2LDIwLjQ5MTk0NDMgTDE4LDIwLjUgTDEzLDIwLjUgQzEyLjcyMzg1NzYsMjAuNSAxMi41LDIwLjI3NjE0MjQgMTIuNSwyMCBDMTIuNSwxOS43NTQ1NDAxIDEyLjY3Njg3NTIsMTkuNTUwMzkxNiAxMi45MTAxMjQ0LDE5LjUwODA1NTcgTDEzLDE5LjUgTDE4LDE5LjUgWiBNMjAsMTIuNSBDMjAuMjQ1NDU5OSwxMi41IDIwLjQ0OTYwODQsMTIuNjc2ODc1MiAyMC40OTE5NDQzLDEyLjkxMDEyNDQgTDIwLjUsMTMgTDIwLjUsMTggQzIwLjUsMTguMjc2MTQyNCAyMC4yNzYxNDI0LDE4LjUgMjAsMTguNSBDMTkuNzU0NTQwMSwxOC41IDE5LjU1MDM5MTYsMTguMzIzMTI0OCAxOS41MDgwNTU3LDE4LjA4OTg3NTYgTDE5LjUsMTggTDE5LjUsMTMgQzE5LjUsMTIuNzIzODU3NiAxOS43MjM4NTc2LDEyLjUgMjAsMTIuNSBaIiBpZD0icGF0aC0xIj48L3BhdGg+CiAgICAgICAgPGZpbHRlciB4PSItNjQuNiUiIHk9Ii01OS41JSIgd2lkdGg9IjIyOS4zJSIgaGVpZ2h0PSIyNDYuMSUiIGZpbHRlclVuaXRzPSJvYmplY3RCb3VuZGluZ0JveCIgaWQ9ImZpbHRlci0yIj4KICAgICAgICAgICAgPGZlTW9ycGhvbG9neSByYWRpdXM9IjEiIG9wZXJhdG9yPSJkaWxhdGUiIGluPSJTb3VyY2VBbHBoYSIgcmVzdWx0PSJzaGFkb3dTcHJlYWRPdXRlcjEiPjwvZmVNb3JwaG9sb2d5PgogICAgICAgICAgICA8ZmVPZmZzZXQgZHg9IjAiIGR5PSIyIiBpbj0ic2hhZG93U3ByZWFkT3V0ZXIxIiByZXN1bHQ9InNoYWRvd09mZnNldE91dGVyMSI+PC9mZU9mZnNldD4KICAgICAgICAgICAgPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMyIgaW49InNoYWRvd09mZnNldE91dGVyMSIgcmVzdWx0PSJzaGFkb3dCbHVyT3V0ZXIxIj48L2ZlR2F1c3NpYW5CbHVyPgogICAgICAgICAgICA8ZmVDb21wb3NpdGUgaW49InNoYWRvd0JsdXJPdXRlcjEiIGluMj0iU291cmNlQWxwaGEiIG9wZXJhdG9yPSJvdXQiIHJlc3VsdD0ic2hhZG93Qmx1ck91dGVyMSI+PC9mZUNvbXBvc2l0ZT4KICAgICAgICAgICAgPGZlQ29sb3JNYXRyaXggdmFsdWVzPSIwIDAgMCAwIDAgICAwIDAgMCAwIDAgICAwIDAgMCAwIDAgIDAgMCAwIDAuMTYgMCIgdHlwZT0ibWF0cml4IiBpbj0ic2hhZG93Qmx1ck91dGVyMSI+PC9mZUNvbG9yTWF0cml4PgogICAgICAgIDwvZmlsdGVyPgogICAgPC9kZWZzPgogICAgPGcgaWQ9Iumhtemdoi00IiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8ZyBpZD0iV2hpdGVib2FyZC1HdWlkZWxpbmVzIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMzQ0LjAwMDAwMCwgLTc1MS4wMDAwMDApIj4KICAgICAgICAgICAgPGcgaWQ9InNoYXBlLWN1cnNvciIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzQ0LjAwMDAwMCwgNzUxLjAwMDAwMCkiPgogICAgICAgICAgICAgICAgPHJlY3QgaWQ9IuefqeW9ouWkh+S7vS00NCIgZmlsbD0iI0ZGRkZGRiIgb3BhY2l0eT0iMC4wMSIgeD0iMCIgeT0iMCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMiI+PC9yZWN0PgogICAgICAgICAgICAgICAgPGcgaWQ9IuW9oueKtue7k+WQiCIgZmlsbC1ydWxlPSJub256ZXJvIj4KICAgICAgICAgICAgICAgICAgICA8dXNlIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjEiIGZpbHRlcj0idXJsKCNmaWx0ZXItMikiIHhsaW5rOmhyZWY9IiNwYXRoLTEiPjwvdXNlPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIxIiBkPSJNMjAsMjEgQzIwLjQ4NTQxMDMsMjEgMjAuODk4MDg1LDIxLjM0Nzk5OTMgMjAuOTg5OTQ3OSwyMS44NjU0ODc3IEwyMSwyMiBMMjEsMjcgQzIxLDI3LjU1MjI4NDcgMjAuNTUyMjg0NywyOCAyMCwyOCBDMTkuNTE0NTg5NywyOCAxOS4xMDE5MTUsMjcuNjUyMDAwNyAxOS4wMTAwNTIxLDI3LjEzNDUxMjMgTDE5LDI3IEwxOSwyMiBDMTksMjEuNDQ3NzE1MyAxOS40NDc3MTUzLDIxIDIwLDIxIFogTTI3LDE5IEMyNy41NTIyODQ3LDE5IDI4LDE5LjQ0NzcxNTMgMjgsMjAgQzI4LDIwLjQ4NTQxMDMgMjcuNjUyMDAwNywyMC44OTgwODUgMjcuMTM0NTEyMywyMC45ODk5NDc5IEwyNywyMSBMMjIsMjEgQzIxLjQ0NzcxNTMsMjEgMjEsMjAuNTUyMjg0NyAyMSwyMCBDMjEsMTkuNTE0NTg5NyAyMS4zNDc5OTkzLDE5LjEwMTkxNSAyMS44NjU0ODc3LDE5LjAxMDA1MjEgTDIyLDE5IEwyNywxOSBaIE0xOCwxOSBDMTguNTUyMjg0NywxOSAxOSwxOS40NDc3MTUzIDE5LDIwIEMxOSwyMC40ODU0MTAzIDE4LjY1MjAwMDcsMjAuODk4MDg1IDE4LjEzNDUxMjMsMjAuOTg5OTQ3OSBMMTgsMjEgTDEzLDIxIEMxMi40NDc3MTUzLDIxIDEyLDIwLjU1MjI4NDcgMTIsMjAgQzEyLDE5LjUxNDU4OTcgMTIuMzQ3OTk5MywxOS4xMDE5MTUgMTIuODY1NDg3NywxOS4wMTAwNTIxIEwxMywxOSBMMTgsMTkgWiBNMjAsMTIgQzIwLjQ4NTQxMDMsMTIgMjAuODk4MDg1LDEyLjM0Nzk5OTMgMjAuOTg5OTQ3OSwxMi44NjU0ODc3IEwyMSwxMyBMMjEsMTggQzIxLDE4LjU1MjI4NDcgMjAuNTUyMjg0NywxOSAyMCwxOSBDMTkuNTE0NTg5NywxOSAxOS4xMDE5MTUsMTguNjUyMDAwNyAxOS4wMTAwNTIxLDE4LjEzNDUxMjMgTDE5LDE4IEwxOSwxMyBDMTksMTIuNDQ3NzE1MyAxOS40NDc3MTUzLDEyIDIwLDEyIFoiIGZpbGw9IiMyMTIzMjQiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PC9wYXRoPgogICAgICAgICAgICAgICAgPC9nPgogICAgICAgICAgICAgICAgPHJlY3QgaWQ9IuefqeW9oiIgZmlsbD0iI0ZGRkZGRiIgeD0iMTguNSIgeT0iMTciIHdpZHRoPSIzIiBoZWlnaHQ9IjYiPjwvcmVjdD4KICAgICAgICAgICAgICAgIDxyZWN0IGlkPSLnn6nlvaIiIGZpbGw9IiNGRkZGRkYiIHg9IjE3IiB5PSIxOC41IiB3aWR0aD0iNiIgaGVpZ2h0PSIzIj48L3JlY3Q+CiAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMjAsMjEuNSBDMjAuMjQ1NDU5OSwyMS41IDIwLjQ0OTYwODQsMjEuNjc2ODc1MiAyMC40OTE5NDQzLDIxLjkxMDEyNDQgTDIwLjUsMjIgTDIwLjUsMjcgQzIwLjUsMjcuMjc2MTQyNCAyMC4yNzYxNDI0LDI3LjUgMjAsMjcuNSBDMTkuNzU0NTQwMSwyNy41IDE5LjU1MDM5MTYsMjcuMzIzMTI0OCAxOS41MDgwNTU3LDI3LjA4OTg3NTYgTDE5LjUsMjcgTDE5LjUsMjIgQzE5LjUsMjEuNzIzODU3NiAxOS43MjM4NTc2LDIxLjUgMjAsMjEuNSBaIE0yNywxOS41IEMyNy4yNzYxNDI0LDE5LjUgMjcuNSwxOS43MjM4NTc2IDI3LjUsMjAgQzI3LjUsMjAuMjQ1NDU5OSAyNy4zMjMxMjQ4LDIwLjQ0OTYwODQgMjcuMDg5ODc1NiwyMC40OTE5NDQzIEwyNywyMC41IEwyMiwyMC41IEMyMS43MjM4NTc2LDIwLjUgMjEuNSwyMC4yNzYxNDI0IDIxLjUsMjAgQzIxLjUsMTkuNzU0NTQwMSAyMS42NzY4NzUyLDE5LjU1MDM5MTYgMjEuOTEwMTI0NCwxOS41MDgwNTU3IEwyMiwxOS41IEwyNywxOS41IFogTTE4LDE5LjUgQzE4LjI3NjE0MjQsMTkuNSAxOC41LDE5LjcyMzg1NzYgMTguNSwyMCBDMTguNSwyMC4yNDU0NTk5IDE4LjMyMzEyNDgsMjAuNDQ5NjA4NCAxOC4wODk4NzU2LDIwLjQ5MTk0NDMgTDE4LDIwLjUgTDEzLDIwLjUgQzEyLjcyMzg1NzYsMjAuNSAxMi41LDIwLjI3NjE0MjQgMTIuNSwyMCBDMTIuNSwxOS43NTQ1NDAxIDEyLjY3Njg3NTIsMTkuNTUwMzkxNiAxMi45MTAxMjQ0LDE5LjUwODA1NTcgTDEzLDE5LjUgTDE4LDE5LjUgWiBNMjAsMTIuNSBDMjAuMjQ1NDU5OSwxMi41IDIwLjQ0OTYwODQsMTIuNjc2ODc1MiAyMC40OTE5NDQzLDEyLjkxMDEyNDQgTDIwLjUsMTMgTDIwLjUsMTggQzIwLjUsMTguMjc2MTQyNCAyMC4yNzYxNDI0LDE4LjUgMjAsMTguNSBDMTkuNzU0NTQwMSwxOC41IDE5LjU1MDM5MTYsMTguMzIzMTI0OCAxOS41MDgwNTU3LDE4LjA4OTg3NTYgTDE5LjUsMTggTDE5LjUsMTMgQzE5LjUsMTIuNzIzODU3NiAxOS43MjM4NTc2LDEyLjUgMjAsMTIuNSBaIiBpZD0i5b2i54q257uT5ZCIIiBmaWxsPSIjMjEyMzI0IiBmaWxsLXJ1bGU9Im5vbnplcm8iPjwvcGF0aD4KICAgICAgICAgICAgPC9nPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+", kP = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNDdweCIgaGVpZ2h0PSI0MHB4IiB2aWV3Qm94PSIwIDAgNDcgNDAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDYwLjEgKDg4MTMzKSAtIGh0dHBzOi8vc2tldGNoLmNvbSAtLT4KICAgIDx0aXRsZT50ZXh0LWN1cnNvcjwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPgogICAgICAgIDxwYXRoIGQ9Ik0xNiwyNi41IEMxNS43MjM4NTc2LDI2LjUgMTUuNSwyNi4yNzYxNDI0IDE1LjUsMjYgQzE1LjUsMjUuNzU0NTQwMSAxNS42NzY4NzUyLDI1LjU1MDM5MTYgMTUuOTEwMTI0NCwyNS41MDgwNTU3IEwxNiwyNS41IEwxOS41LDI1LjUgTDE5LjUsMTQuNSBMMTYsMTQuNSBDMTUuNzIzODU3NiwxNC41IDE1LjUsMTQuMjc2MTQyNCAxNS41LDE0IEMxNS41LDEzLjc1NDU0MDEgMTUuNjc2ODc1MiwxMy41NTAzOTE2IDE1LjkxMDEyNDQsMTMuNTA4MDU1NyBMMTYsMTMuNSBMMjQsMTMuNSBDMjQuMjc2MTQyNCwxMy41IDI0LjUsMTMuNzIzODU3NiAyNC41LDE0IEMyNC41LDE0LjI0NTQ1OTkgMjQuMzIzMTI0OCwxNC40NDk2MDg0IDI0LjA4OTg3NTYsMTQuNDkxOTQ0MyBMMjQsMTQuNSBMMjAuNSwxNC41IEwyMC41LDI1LjUgTDI0LDI1LjUgQzI0LjI3NjE0MjQsMjUuNSAyNC41LDI1LjcyMzg1NzYgMjQuNSwyNiBDMjQuNSwyNi4yNDU0NTk5IDI0LjMyMzEyNDgsMjYuNDQ5NjA4NCAyNC4wODk4NzU2LDI2LjQ5MTk0NDMgTDI0LDI2LjUgTDE2LDI2LjUgWiIgaWQ9InBhdGgtMSI+PC9wYXRoPgogICAgICAgIDxmaWx0ZXIgeD0iLTI4NC4wJSIgeT0iLTgxLjUlIiB3aWR0aD0iNjY4LjElIiBoZWlnaHQ9IjI5My45JSIgZmlsdGVyVW5pdHM9Im9iamVjdEJvdW5kaW5nQm94IiBpZD0iZmlsdGVyLTIiPgogICAgICAgICAgICA8ZmVNb3JwaG9sb2d5IHJhZGl1cz0iMSIgb3BlcmF0b3I9ImRpbGF0ZSIgaW49IlNvdXJjZUFscGhhIiByZXN1bHQ9InNoYWRvd1NwcmVhZE91dGVyMSI+PC9mZU1vcnBob2xvZ3k+CiAgICAgICAgICAgIDxmZU9mZnNldCBkeD0iMCIgZHk9IjIiIGluPSJzaGFkb3dTcHJlYWRPdXRlcjEiIHJlc3VsdD0ic2hhZG93T2Zmc2V0T3V0ZXIxIj48L2ZlT2Zmc2V0PgogICAgICAgICAgICA8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIzIiBpbj0ic2hhZG93T2Zmc2V0T3V0ZXIxIiByZXN1bHQ9InNoYWRvd0JsdXJPdXRlcjEiPjwvZmVHYXVzc2lhbkJsdXI+CiAgICAgICAgICAgIDxmZUNvbXBvc2l0ZSBpbj0ic2hhZG93Qmx1ck91dGVyMSIgaW4yPSJTb3VyY2VBbHBoYSIgb3BlcmF0b3I9Im91dCIgcmVzdWx0PSJzaGFkb3dCbHVyT3V0ZXIxIj48L2ZlQ29tcG9zaXRlPgogICAgICAgICAgICA8ZmVDb2xvck1hdHJpeCB2YWx1ZXM9IjAgMCAwIDAgMCAgIDAgMCAwIDAgMCAgIDAgMCAwIDAgMCAgMCAwIDAgMC4xNiAwIiB0eXBlPSJtYXRyaXgiIGluPSJzaGFkb3dCbHVyT3V0ZXIxIj48L2ZlQ29sb3JNYXRyaXg+CiAgICAgICAgPC9maWx0ZXI+CiAgICA8L2RlZnM+CiAgICA8ZyBpZD0i6aG16Z2iLTQiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxnIGlkPSJXaGl0ZWJvYXJkLUd1aWRlbGluZXMiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zODguMDAwMDAwLCAtNjcyLjAwMDAwMCkiPgogICAgICAgICAgICA8ZyBpZD0idGV4dC1jdXJzb3IiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDM5Mi4wMDAwMDAsIDY3Mi4wMDAwMDApIj4KICAgICAgICAgICAgICAgIDxyZWN0IGlkPSLnn6nlvaLlpIfku70tNDAiIGZpbGw9IiNGRkZGRkYiIG9wYWNpdHk9IjAuMDEiIHg9IjAiIHk9IjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcng9IjIiPjwvcmVjdD4KICAgICAgICAgICAgICAgIDxnIGlkPSLlvaLnirbnu5PlkIgiIGZpbGwtcnVsZT0ibm9uemVybyI+CiAgICAgICAgICAgICAgICAgICAgPHVzZSBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIxIiBmaWx0ZXI9InVybCgjZmlsdGVyLTIpIiB4bGluazpocmVmPSIjcGF0aC0xIj48L3VzZT4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMSIgZD0iTTE5LDI1IEwxOSwxNSBMMTYsMTUgQzE1LjQ0NzcxNTMsMTUgMTUsMTQuNTUyMjg0NyAxNSwxNCBDMTUsMTMuNTE0NTg5NyAxNS4zNDc5OTkzLDEzLjEwMTkxNSAxNS44NjU0ODc3LDEzLjAxMDA1MjEgTDE2LDEzIEwyNCwxMyBDMjQuNTUyMjg0NywxMyAyNSwxMy40NDc3MTUzIDI1LDE0IEMyNSwxNC40ODU0MTAzIDI0LjY1MjAwMDcsMTQuODk4MDg1IDI0LjEzNDUxMjMsMTQuOTg5OTQ3OSBMMjQsMTUgTDIxLDE1IEwyMSwyNSBMMjQsMjUgQzI0LjU1MjI4NDcsMjUgMjUsMjUuNDQ3NzE1MyAyNSwyNiBDMjUsMjYuNDg1NDEwMyAyNC42NTIwMDA3LDI2Ljg5ODA4NSAyNC4xMzQ1MTIzLDI2Ljk4OTk0NzkgTDI0LDI3IEwxNiwyNyBDMTUuNDQ3NzE1MywyNyAxNSwyNi41NTIyODQ3IDE1LDI2IEMxNSwyNS41MTQ1ODk3IDE1LjM0Nzk5OTMsMjUuMTAxOTE1IDE1Ljg2NTQ4NzcsMjUuMDEwMDUyMSBMMTYsMjUgTDE5LDI1IFoiIGZpbGw9IiMyMTIzMjQiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PC9wYXRoPgogICAgICAgICAgICAgICAgPC9nPgogICAgICAgICAgICA8L2c+CiAgICAgICAgPC9nPgogICAgPC9nPgo8L3N2Zz4=", PP = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMjhweCIgaGVpZ2h0PSIyOHB4IiB2aWV3Qm94PSIwIDAgMjggMjgiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDU1LjEgKDc4MTM2KSAtIGh0dHBzOi8vc2tldGNoYXBwLmNvbSAtLT4KICAgIDx0aXRsZT7nvJbnu4QgMjwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPgogICAgICAgIDxmaWx0ZXIgeD0iLTEyMC4wJSIgeT0iLTEyMC4wJSIgd2lkdGg9IjM0MC4wJSIgaGVpZ2h0PSIzNDAuMCUiIGZpbHRlclVuaXRzPSJvYmplY3RCb3VuZGluZ0JveCIgaWQ9ImZpbHRlci0xIj4KICAgICAgICAgICAgPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iNCIgaW49IlNvdXJjZUdyYXBoaWMiPjwvZmVHYXVzc2lhbkJsdXI+CiAgICAgICAgPC9maWx0ZXI+CiAgICA8L2RlZnM+CiAgICA8ZyBpZD0i6aG16Z2iMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9Iue8lue7hC0yIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg5LjAwMDAwMCwgOS4wMDAwMDApIiBmaWxsPSIjRkYwMTAwIj4KICAgICAgICAgICAgPGNpcmNsZSBpZD0i5qSt5ZyG5b2iIiBmaWx0ZXI9InVybCgjZmlsdGVyLTEpIiBjeD0iNSIgY3k9IjUiIHI9IjUiPjwvY2lyY2xlPgogICAgICAgICAgICA8cGF0aCBkPSJNNSw4IEM2LjY1Njg1NDI1LDggOCw2LjY1Njg1NDI1IDgsNSBDOCwzLjM0MzE0NTc1IDYuNjU2ODU0MjUsMiA1LDIgQzMuMzQzMTQ1NzUsMiAyLDMuMzQzMTQ1NzUgMiw1IEMyLDYuNjU2ODU0MjUgMy4zNDMxNDU3NSw4IDUsOCBaIE01LDYuMjg1NzE0MjkgQzQuMjg5OTE5NjEsNi4yODU3MTQyOSAzLjcxNDI4NTcxLDUuNzEwMDgwMzkgMy43MTQyODU3MSw1IEMzLjcxNDI4NTcxLDQuMjg5OTE5NjEgNC4yODk5MTk2MSwzLjcxNDI4NTcxIDUsMy43MTQyODU3MSBDNS43MTAwODAzOSwzLjcxNDI4NTcxIDYuMjg1NzE0MjksNC4yODk5MTk2MSA2LjI4NTcxNDI5LDUgQzYuMjg1NzE0MjksNS43MTAwODAzOSA1LjcxMDA4MDM5LDYuMjg1NzE0MjkgNSw2LjI4NTcxNDI5IFoiIGlkPSLmpK3lnIblvaIiIGZpbGwtcnVsZT0ibm9uemVybyI+PC9wYXRoPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+", _P = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMjYiIHZpZXdCb3g9IjAgMCAxOCAyNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMC41IiB5PSIwLjUiIHdpZHRoPSIxNyIgaGVpZ2h0PSIyNSIgcng9IjMuNSIgZmlsbD0iYmxhY2siIGZpbGwtb3BhY2l0eT0iMC4zNSIgc3Ryb2tlPSJ3aGl0ZSIvPgo8L3N2Zz4K", zP = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjYiIGhlaWdodD0iMzQiIHZpZXdCb3g9IjAgMCAyNiAzNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMC41IiB5PSIwLjUiIHdpZHRoPSIyNSIgaGVpZ2h0PSIzMyIgcng9IjMuNSIgZmlsbD0iYmxhY2siIGZpbGwtb3BhY2l0eT0iMC4zNSIgc3Ryb2tlPSJ3aGl0ZSIvPgo8L3N2Zz4K", OP = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzQiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCAzNCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMC41IiB5PSIwLjUiIHdpZHRoPSIzMyIgaGVpZ2h0PSI0OSIgcng9IjMuNSIgZmlsbD0iYmxhY2siIGZpbGwtb3BhY2l0eT0iMC4zNSIgc3Ryb2tlPSJ3aGl0ZSIvPgo8L3N2Zz4K", LP = {
  [Rn.pencil]: AP,
  [Rn.selector]: RP,
  [Rn.eraser]: DP,
  [Rn.shape]: NP,
  [Rn.text]: kP,
  [Rn.laserPointer]: PP,
  pencilEraser1: _P,
  pencilEraser2: zP,
  pencilEraser3: OP
}, TT = "local-cursor";
class BP {
  constructor(i, o, c, h) {
    var g;
    this.manager = i, this.enableCursor = o, this.cursorInstances = /* @__PURE__ */ new Map(), this.userApplianceIcons = {}, this.sideEffectManager = new lp(), this.store = this.manager.store, this.leaveFlag = !0, this._style = "default", this.onCursorMove = (x) => {
      const T = this.initCursorInstance(x.uid);
      if (x.state === Ob.Leave)
        T.leave();
      else {
        const A = T.updateMember();
        this.canMoveCursor(A) && T.move(x.position);
      }
    }, this.initCursorInstance = (x) => {
      let T = this.cursorInstances.get(x);
      return T || (T = new IP(this.manager, x, this, Ht.wrapper), this.cursorInstances.set(x, T)), T;
    }, this.mouseMoveListener_ = (x, T) => {
      const A = this.getType(x);
      this.updateCursor(A, x.clientX, x.clientY), T && this.showPencilEraserIfNeeded(A, x.clientX, x.clientY);
    }, this.mouseMoveTimer = 0, this.mouseMoveListener = (x) => {
      const T = x.pointerType === "touch";
      if (T && !x.isPrimary)
        return;
      const A = Date.now();
      if (A - this.mouseMoveTimer > 48) {
        if (this.mouseMoveTimer = A, Ht.supportAppliancePlugin && Du(Ht.displayer) && Ht.displayer.disableDeviceInputs) {
          this.leaveFlag && (this.manager.dispatchInternalEvent(Gt.CursorMove, {
            uid: this.manager.uid,
            state: Ob.Leave
          }), this.leaveFlag = !1);
          return;
        }
        this.mouseMoveListener_(x, T), this.leaveFlag = !0;
      }
    }, this.mouseLeaveListener = () => {
      this.hideCursor(this.manager.uid);
    }, this.getPoint = (x, T, A) => {
      var z;
      const I = (z = x == null ? void 0 : x.divElement) == null ? void 0 : z.getBoundingClientRect();
      if (I)
        return x == null ? void 0 : x.convertToPointInWorld({
          x: T - I.x,
          y: A - I.y
        });
    }, this.getType = (x) => {
      var I;
      const T = x.target, A = this.manager.focusApp;
      switch (T.parentElement) {
        case this.mainViewElement:
          return { type: "main" };
        case ((I = A == null ? void 0 : A.view) == null ? void 0 : I.divElement):
          return { type: "app" };
        default:
          return { type: "main" };
      }
    }, this.roomMembers = (g = this.manager.room) == null ? void 0 : g.state.roomMembers;
    const m = Ht.wrapper;
    m && this.setupWrapper(m), this.sideEffectManager.add(() => Ke.on("cursorMove", this.onCursorMove)), this.sideEffectManager.add(() => Ke.on("playgroundSizeChange", () => this.updateContainerRect()));
    const w = this.manager.room;
    w && this.sideEffectManager.add(() => {
      const x = (T) => {
        this.style === "custom" && T.memberState && this.enableCustomCursor();
      };
      return w.callbacks.on("onRoomStateChanged", x), () => w.callbacks.off("onRoomStateChanged", x);
    }), h && (this.userApplianceIcons = h), this.style = (c == null ? void 0 : c.style) || "default";
  }
  get applianceIcons() {
    return { ...LP, ...this.userApplianceIcons };
  }
  get style() {
    return this._style;
  }
  set style(i) {
    this._style !== i && (this._style = i, this.cursorInstances.forEach((o) => {
      o.setStyle(i);
    }), i === "custom" ? this.enableCustomCursor() : this.sideEffectManager.flush(TT));
  }
  enableCustomCursor() {
    this.sideEffectManager.add(
      () => MP(this.manager.getMemberState()),
      TT
    );
  }
  canMoveCursor(i) {
    const o = (i == null ? void 0 : i.memberState.currentApplianceName) === Rn.laserPointer;
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
    const h = jb(this.manager.room, this.manager.uid), m = (h == null ? void 0 : h.memberState.currentApplianceName) === Rn.pencilEraser;
    if (this.wrapperRect && this.manager.canOperate && this.canMoveCursor(h) && m) {
      const w = i.type === "main" ? this.manager.mainView : this.focusView, g = this.getPoint(w, o, c);
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
    const h = jb(this.manager.room, this.manager.uid);
    if (this.wrapperRect && this.manager.canOperate && this.canMoveCursor(h)) {
      const m = i.type === "main" ? this.manager.mainView : this.focusView, w = this.getPoint(m, o, c);
      w && this.manager.dispatchInternalEvent(Gt.CursorMove, {
        uid: this.manager.uid,
        position: {
          x: w.x,
          y: w.y,
          type: i.type
        }
      });
    }
  }
  updateContainerRect() {
    var i, o;
    this.containerRect = (i = Ht.container) == null ? void 0 : i.getBoundingClientRect(), this.wrapperRect = (o = Ht.wrapper) == null ? void 0 : o.getBoundingClientRect();
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
class jP {
  constructor(i) {
    this.manager = i, Ke.on("changePageState", () => {
      Nt.emit("pageStateChange", this.toObject());
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
class UP {
  constructor(i) {
    this.ctx = i, this.reactors = /* @__PURE__ */ new Map(), this.disposers = /* @__PURE__ */ new Map(), this.onPhaseChanged = async (o) => {
      var c, h;
      o === Nu.Reconnecting && this.ctx.emitter.emit("startReconnect"), o === Nu.Connected && this.phase === Nu.Reconnecting && ((c = this.room) != null && c.isWritable ? (h = this.room) == null || h.dispatchMagixEvent(ob, {}) : (await vM(500), this.onReconnected())), this.phase = o;
    }, this.onReconnected = xs(() => {
      this._onReconnected();
    }, 1e3), this._onReconnected = () => {
      Ta("onReconnected refresh reactors"), this.releaseDisposers(), this.reactors.forEach((o, c) => {
        xd(o) && this.disposers.set(c, o());
      }), this.ctx.emitter.emit("onReconnected");
    };
  }
  setRoom(i) {
    this.room = i, this.phase = i == null ? void 0 : i.phase, i && (i.callbacks.off("onPhaseChanged", this.onPhaseChanged), i.callbacks.on("onPhaseChanged", this.onPhaseChanged), i.addMagixEventListener(
      ob,
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
    (i = this.room) == null || i.callbacks.off("onPhaseChanged", this.onPhaseChanged), (o = this.room) == null || o.removeMagixEventListener(ob, this.onReconnected), this.releaseDisposers();
  }
}
const VP = (r, i) => {
  if (iS(r))
    WP(r);
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
    }), r.moveCamera = (c) => i.moveCamera(c), r.moveCameraToContain = (...c) => i.moveCameraToContain(...c), r.convertToPointInWorld = (...c) => i.mainView.convertToPointInWorld(...c), r.setCameraBound = (...c) => i.mainView.setCameraBound(...c), r.scenePreview = (...c) => i.mainView.scenePreview(...c), r.fillSceneSnapshot = (...c) => i.mainView.fillSceneSnapshot(...c), r.generateScreenshot = (...c) => i.mainView.generateScreenshot(...c), r.setMemberState = (...c) => i.mainView.setMemberState(...c), r.redo = () => i.redo(), r.undo = () => i.undo(), r.cleanCurrentScene = () => i.cleanCurrentScene(), r.delete = () => i.delete(), r.copy = () => i.copy(), r.paste = () => i.paste(), r.duplicate = () => i.duplicate(), r.insertImage = (...c) => i.insertImage(...c), r.completeImageUpload = (...c) => i.completeImageUpload(...c), r.insertText = (...c) => i.insertText(...c), r.lockImage = (...c) => i.lockImage(...c), r.lockImages = (...c) => i.lockImages(...c), HP(r, i);
  }
}, HP = (r, i) => {
  const o = r.removeScenes;
  r.removeScenes = (c, h) => {
    var w;
    c === xr && ((w = i.appManager) == null || w.updateRootDirRemoving(!0));
    const m = o.call(r, c);
    return Ke.emit("removeScenes", { scenePath: c, index: h }), m;
  };
}, WP = (r) => {
  const i = r.seekToProgressTime;
  async function o(c) {
    await Ke.emit("seekStart");
    const h = await i.call(r, c);
    return Ke.emit("seek", c), h;
  }
  r.seekToProgressTime = o;
};
var FP = Object.defineProperty, $P = Object.defineProperties, QP = Object.getOwnPropertyDescriptors, MT = Object.getOwnPropertySymbols, ZP = Object.prototype.hasOwnProperty, YP = Object.prototype.propertyIsEnumerable, ET = (r, i, o) => i in r ? FP(r, i, { enumerable: !0, configurable: !0, writable: !0, value: o }) : r[i] = o, YM = (r, i) => {
  for (var o in i || (i = {}))
    ZP.call(i, o) && ET(r, o, i[o]);
  if (MT)
    for (var o of MT(i))
      YP.call(i, o) && ET(r, o, i[o]);
  return r;
}, GM = (r, i) => $P(r, QP(i)), GP = /* @__PURE__ */ (() => `.netless-app-docs-viewer-content{position:relative;height:100%;overflow:hidden}.netless-app-docs-viewer-preview-mask{display:none;position:absolute;z-index:200;top:0;left:0;width:100%;height:100%}.netless-app-docs-viewer-preview{display:flex;flex-direction:column;align-items:center;z-index:300;top:0;right:0;width:23%;padding:12px;transform:translate(100%);box-shadow:-4.8px -3.2px 20px #20233826;transition:transform .4s;background:#f5f5fc;border-radius:4px;-webkit-box-shadow:-4.8px -3.2px 20px rgba(32,35,56,.15);height:100%;position:absolute;opacity:0}.netless-app-docs-viewer-preview-active .netless-app-docs-viewer-preview-mask{display:block}.netless-app-docs-viewer-preview-active .netless-app-docs-viewer-preview{transform:translate(0);opacity:1}.netless-app-docs-viewer-preview-head{display:flex;align-items:center;justify-content:space-between;width:100%;margin-bottom:10px}.netless-app-docs-viewer-preview-head>h3{color:#484c70;font-weight:400;font-size:14px;width:calc(100% - 20px);overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;white-space:nowrap}.netless-app-docs-viewer-preview-head .netless-app-docs-viewer-close{width:25px;height:25px;padding:0;outline:none;border:none;background:#fff;display:flex;justify-content:center;align-items:center;border-radius:100%;cursor:pointer}.netless-app-docs-viewer-preview-head .netless-app-docs-viewer-close button{width:22px;height:22px;padding:0;outline:none;border:none;background:center/cover no-repeat;background-image:url(./icons/close.svg)}.netless-app-docs-viewer-preview-page{position:relative;display:flex;width:100%;margin-bottom:10px;font-size:0;color:transparent;outline:none;border-radius:4px;transition:border-color .3s;user-select:none;align-items:flex-end}.netless-app-docs-viewer-preview-page>img{width:calc(90% - 10px);height:auto;box-sizing:border-box;border:2px solid rgba(0,0,0,.5);border-radius:2px;background-color:#fff}.netless-app-docs-viewer-preview-page>img.netless-app-docs-viewer-active{border-color:#ff5353}.netless-app-docs-viewer-preview-page-name{text-align:right;font-size:12px;color:#8d8fa6;user-select:none;margin-right:10px;width:5%}.netless-app-docs-viewer-footer{box-sizing:border-box;height:40px;display:flex;align-items:center;padding:0 16px;color:#191919;background:#ebecfa}.netless-app-docs-viewer-float-footer{width:100%;min-height:40px;position:absolute;left:0;bottom:0;z-index:2000;transition:opacity .4s;color:#191919}.netless-app-docs-viewer-footer-btn{box-sizing:border-box;width:26px;height:26px;font-size:0;margin:0;padding:3px;border:none;border-radius:4px;outline:none;color:currentColor;background:transparent;transition:background .4s;cursor:pointer;user-select:none;-webkit-tap-highlight-color:rgba(0,0,0,0);color:#8d8fa6}.netless-app-docs-viewer-footer-btn.netless-app-docs-viewer-footer-btn-disable{color:#c6c7d2;cursor:not-allowed}.netless-app-docs-viewer-footer-btn.netless-app-docs-viewer-footer-btn-disable .arrow{fill:#c6c7d2}.netless-app-docs-viewer-footer-btn .arrow{fill:#8d8fa6}.netless-app-docs-viewer-footer-btn:hover{background-color:#1b1f4d0a}@media (hover: none){.netless-app-docs-viewer-footer-btn:hover{background:transparent!important}}.netless-app-docs-viewer-footer-btn>svg{width:100%;height:100%}.netless-app-docs-viewer-footer-btn>svg:nth-of-type(2){display:none}.netless-app-docs-viewer-footer-btn.netless-app-docs-viewer-footer-btn-playing>svg:nth-of-type(1){display:none}.netless-app-docs-viewer-footer-btn.netless-app-docs-viewer-footer-btn-playing>svg:nth-of-type(2){display:initial}.netless-app-docs-viewer-hide{display:none}.netless-app-docs-viewer-page-jumps{flex:1;display:flex;justify-content:center;align-items:center;gap:8px}.netless-app-docs-viewer-page-number{font-size:14px;color:#8d8fa6;user-select:none;white-space:nowrap;word-break:keep-all}.netless-app-docs-viewer-page-number-input{border:none;outline:none;width:3em;margin:0;padding:0 2px;text-align:right;font-size:13px;line-height:1;font-weight:400;font-family:inherit;border-radius:2px;color:currentColor;background:transparent;transition:background .4s;user-select:text;-webkit-tap-highlight-color:rgba(0,0,0,0)}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-footer-btn{cursor:not-allowed}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-footer-btn:hover{background:transparent}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input{cursor:not-allowed}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input:hover,.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input:focus,.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input:active{background:transparent;box-shadow:none}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input:disabled{color:inherit}.netless-app-docs-viewer-readonly.netless-app-docs-viewer-float-footer{display:none}.telebox-color-scheme-dark .netless-app-docs-viewer-page-number-input{color:#a6a6a8}.telebox-color-scheme-dark .netless-app-docs-viewer-page-number-input:active,.telebox-color-scheme-dark .netless-app-docs-viewer-page-number-input:focus,.telebox-color-scheme-dark .netless-app-docs-viewer-page-number-input:hover{color:#222}.telebox-color-scheme-dark .netless-app-docs-viewer-footer{color:#a6a6a8;background:#2d2d33;border-top:none}.telebox-color-scheme-dark .netless-app-docs-viewer-footer-btn:hover{background:#212126}.telebox-color-scheme-dark .netless-app-docs-viewer-preview{background:rgba(50,50,50,.9)}.netless-app-docs-viewer-static-scrollbar{position:absolute;top:0;right:0;z-index:2147483647;width:8px;min-height:30px;margin:0;padding:0;border:none;outline:none;border-radius:4px;background:rgba(68,78,96,.4);box-shadow:1px 1px 8px #ffffffb3;opacity:0;transition:background .4s,opacity .4s 3s,transform .2s;user-select:none}.netless-app-docs-viewer-static-scrollbar.netless-app-docs-viewer-static-scrollbar-dragging{background:rgba(68,78,96,.6);opacity:1;transition:background .4s,opacity .4s 3s!important}.netless-app-docs-viewer-static-scrollbar:hover,.netless-app-docs-viewer-static-scrollbar:focus{background:rgba(68,78,96,.5)}.netless-app-docs-viewer-static-scrollbar:active{background:rgba(68,78,96,.6)}.netless-app-docs-viewer-content:hover .netless-app-docs-viewer-static-scrollbar{opacity:1;transition:background .4s,opacity .4s,transform .2s}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-static-scrollbar{display:none}.netless-app-docs-viewer-static-pages:hover .netless-app-docs-viewer-static-scrollbar{opacity:1;transition:background .4s,opacity .4s,transform .2s}.page-renderer-pages-container{position:relative;overflow:hidden}.page-renderer-page{position:absolute;top:0;left:0;background-position:center;background-size:cover;background-repeat:no-repeat}.page-renderer-pages-container.is-hwa .page-renderer-page{will-change:transform}.page-renderer-page-img{display:block;width:100%;height:auto;user-select:none}.netless-app-docs-viewer-static-pages{overflow:hidden;position:relative;height:100%;user-select:none}.netless-app-docs-viewer-static-page{display:block;width:100%;height:auto;user-select:none}.netless-app-docs-viewer-static-wb-view,.netless-app-docs-viewer-dynamic-wb-view{position:absolute;top:0;left:0;width:100%;height:100%;z-index:100;overflow:auto}.netless-app-docs-viewer-dynamic-wb-view .cursor-clicker .ppt-event-source{cursor:pointer}
`)();
const XP = (r, i, o, c) => {
  if (o === "length" || o === "prototype" || o === "arguments" || o === "caller")
    return;
  const h = Object.getOwnPropertyDescriptor(r, o), m = Object.getOwnPropertyDescriptor(i, o);
  !JP(h, m) && c || Object.defineProperty(r, o, m);
}, JP = function(r, i) {
  return r === void 0 || r.configurable || r.writable === i.writable && r.enumerable === i.enumerable && r.configurable === i.configurable && (r.writable || r.value === i.value);
}, qP = (r, i) => {
  const o = Object.getPrototypeOf(i);
  o !== Object.getPrototypeOf(r) && Object.setPrototypeOf(r, o);
}, KP = (r, i) => `/* Wrapped ${r}*/
${i}`, e_ = Object.getOwnPropertyDescriptor(Function.prototype, "toString"), t_ = Object.getOwnPropertyDescriptor(Function.prototype.toString, "name"), n_ = (r, i, o) => {
  const c = o === "" ? "" : `with ${o.trim()}() `, h = KP.bind(null, c, i.toString());
  Object.defineProperty(h, "name", t_), Object.defineProperty(r, "toString", GM(YM({}, e_), { value: h }));
};
function i_(r, i, { ignoreNonConfigurable: o = !1 } = {}) {
  const { name: c } = r;
  for (const h of Reflect.ownKeys(i))
    XP(r, i, h, o);
  return qP(r, i), n_(r, i, c), r;
}
const r_ = (r, i = {}) => {
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
  let w, g, x;
  const T = function(...A) {
    const I = this, z = () => {
      w = void 0, g && (clearTimeout(g), g = void 0), m && (x = r.apply(I, A));
    }, F = () => {
      g = void 0, w && (clearTimeout(w), w = void 0), m && (x = r.apply(I, A));
    }, $ = h && !w;
    return clearTimeout(w), w = setTimeout(z, o), c > 0 && c !== Number.Infinity && !g && (g = setTimeout(F, c)), $ && (x = r.apply(I, A)), x;
  };
  return i_(T, r), T.cancel = () => {
    w && (clearTimeout(w), w = void 0), g && (clearTimeout(g), g = void 0);
  }, T;
}, a_ = "!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", s_ = 87, o_ = 20, IT = [], l_ = () => {
  for (let r = 0; r < o_; r++)
    IT[r] = a_.charAt(Math.random() * s_);
  return IT.join("");
};
function XM(r) {
  try {
    return r();
  } catch (i) {
    console.error(i);
  }
}
class hg {
  constructor() {
    this.push = this.addDisposer, this.disposers = /* @__PURE__ */ new Map();
  }
  addDisposer(i, o = this.genUID()) {
    return this.flush(o), this.disposers.set(o, Array.isArray(i) ? u_(i) : i), o;
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
    this.disposers.forEach(XM), this.disposers.clear();
  }
  genUID() {
    let i;
    do
      i = l_();
    while (this.disposers.has(i));
    return i;
  }
}
function u_(r) {
  return () => r.forEach(XM);
}
var ku = [], c_ = function() {
  return ku.some(function(r) {
    return r.activeTargets.length > 0;
  });
}, d_ = function() {
  return ku.some(function(r) {
    return r.skippedTargets.length > 0;
  });
}, AT = "ResizeObserver loop completed with undelivered notifications.", f_ = function() {
  var r;
  typeof ErrorEvent == "function" ? r = new ErrorEvent("error", {
    message: AT
  }) : (r = document.createEvent("Event"), r.initEvent("error", !1, !1), r.message = AT), window.dispatchEvent(r);
}, sp;
(function(r) {
  r.BORDER_BOX = "border-box", r.CONTENT_BOX = "content-box", r.DEVICE_PIXEL_CONTENT_BOX = "device-pixel-content-box";
})(sp || (sp = {}));
var Pu = function(r) {
  return Object.freeze(r);
}, h_ = function() {
  function r(i, o) {
    this.inlineSize = i, this.blockSize = o, Pu(this);
  }
  return r;
}(), JM = function() {
  function r(i, o, c, h) {
    return this.x = i, this.y = o, this.width = c, this.height = h, this.top = this.y, this.left = this.x, this.bottom = this.top + this.height, this.right = this.left + this.width, Pu(this);
  }
  return r.prototype.toJSON = function() {
    var i = this, o = i.x, c = i.y, h = i.top, m = i.right, w = i.bottom, g = i.left, x = i.width, T = i.height;
    return { x: o, y: c, top: h, right: m, bottom: w, left: g, width: x, height: T };
  }, r.fromRect = function(i) {
    return new r(i.x, i.y, i.width, i.height);
  }, r;
}(), yS = function(r) {
  return r instanceof SVGElement && "getBBox" in r;
}, qM = function(r) {
  if (yS(r)) {
    var i = r.getBBox(), o = i.width, c = i.height;
    return !o && !c;
  }
  var h = r, m = h.offsetWidth, w = h.offsetHeight;
  return !(m || w || r.getClientRects().length);
}, RT = function(r) {
  var i, o;
  if (r instanceof Element)
    return !0;
  var c = (o = (i = r) === null || i === void 0 ? void 0 : i.ownerDocument) === null || o === void 0 ? void 0 : o.defaultView;
  return !!(c && r instanceof c.Element);
}, p_ = function(r) {
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
}, tp = typeof window < "u" ? window : {}, Fv = /* @__PURE__ */ new WeakMap(), DT = /auto|scroll/, m_ = /^tb|vertical/, v_ = /msie|trident/i.test(tp.navigator && tp.navigator.userAgent), ys = function(r) {
  return parseFloat(r || "0");
}, Id = function(r, i, o) {
  return r === void 0 && (r = 0), i === void 0 && (i = 0), o === void 0 && (o = !1), new h_((o ? i : r) || 0, (o ? r : i) || 0);
}, NT = Pu({
  devicePixelContentBoxSize: Id(),
  borderBoxSize: Id(),
  contentBoxSize: Id(),
  contentRect: new JM(0, 0, 0, 0)
}), KM = function(r, i) {
  if (i === void 0 && (i = !1), Fv.has(r) && !i)
    return Fv.get(r);
  if (qM(r))
    return Fv.set(r, NT), NT;
  var o = getComputedStyle(r), c = yS(r) && r.ownerSVGElement && r.getBBox(), h = !v_ && o.boxSizing === "border-box", m = m_.test(o.writingMode || ""), w = !c && DT.test(o.overflowY || ""), g = !c && DT.test(o.overflowX || ""), x = c ? 0 : ys(o.paddingTop), T = c ? 0 : ys(o.paddingRight), A = c ? 0 : ys(o.paddingBottom), I = c ? 0 : ys(o.paddingLeft), z = c ? 0 : ys(o.borderTopWidth), F = c ? 0 : ys(o.borderRightWidth), $ = c ? 0 : ys(o.borderBottomWidth), J = c ? 0 : ys(o.borderLeftWidth), q = I + T, de = x + A, se = J + F, Z = z + $, ue = g ? r.offsetHeight - Z - r.clientHeight : 0, oe = w ? r.offsetWidth - se - r.clientWidth : 0, Le = h ? q + se : 0, Qe = h ? de + Z : 0, je = c ? c.width : ys(o.width) - Le - oe, Y = c ? c.height : ys(o.height) - Qe - ue, he = je + q + oe + se, Ie = Y + de + ue + Z, ie = Pu({
    devicePixelContentBoxSize: Id(Math.round(je * devicePixelRatio), Math.round(Y * devicePixelRatio), m),
    borderBoxSize: Id(he, Ie, m),
    contentBoxSize: Id(je, Y, m),
    contentRect: new JM(I, x, je, Y)
  });
  return Fv.set(r, ie), ie;
}, eE = function(r, i, o) {
  var c = KM(r, o), h = c.borderBoxSize, m = c.contentBoxSize, w = c.devicePixelContentBoxSize;
  switch (i) {
    case sp.DEVICE_PIXEL_CONTENT_BOX:
      return w;
    case sp.BORDER_BOX:
      return h;
    default:
      return m;
  }
}, g_ = function() {
  function r(i) {
    var o = KM(i);
    this.target = i, this.contentRect = o.contentRect, this.borderBoxSize = Pu([o.borderBoxSize]), this.contentBoxSize = Pu([o.contentBoxSize]), this.devicePixelContentBoxSize = Pu([o.devicePixelContentBoxSize]);
  }
  return r;
}(), tE = function(r) {
  if (qM(r))
    return 1 / 0;
  for (var i = 0, o = r.parentNode; o; )
    i += 1, o = o.parentNode;
  return i;
}, y_ = function() {
  var r = 1 / 0, i = [];
  ku.forEach(function(w) {
    if (w.activeTargets.length !== 0) {
      var g = [];
      w.activeTargets.forEach(function(T) {
        var A = new g_(T.target), I = tE(T.target);
        g.push(A), T.lastReportedSize = eE(T.target, T.observedBox), I < r && (r = I);
      }), i.push(function() {
        w.callback.call(w.observer, g, w.observer);
      }), w.activeTargets.splice(0, w.activeTargets.length);
    }
  });
  for (var o = 0, c = i; o < c.length; o++) {
    var h = c[o];
    h();
  }
  return r;
}, kT = function(r) {
  ku.forEach(function(o) {
    o.activeTargets.splice(0, o.activeTargets.length), o.skippedTargets.splice(0, o.skippedTargets.length), o.observationTargets.forEach(function(h) {
      h.isActive() && (tE(h.target) > r ? o.activeTargets.push(h) : o.skippedTargets.push(h));
    });
  });
}, w_ = function() {
  var r = 0;
  for (kT(r); c_(); )
    r = y_(), kT(r);
  return d_() && f_(), r > 0;
}, wb, nE = [], b_ = function() {
  return nE.splice(0).forEach(function(r) {
    return r();
  });
}, S_ = function(r) {
  if (!wb) {
    var i = 0, o = document.createTextNode(""), c = { characterData: !0 };
    new MutationObserver(function() {
      return b_();
    }).observe(o, c), wb = function() {
      o.textContent = "" + (i ? i-- : i++);
    };
  }
  nE.push(r), wb();
}, x_ = function(r) {
  S_(function() {
    requestAnimationFrame(r);
  });
}, eg = 0, C_ = function() {
  return !!eg;
}, T_ = 250, M_ = { attributes: !0, characterData: !0, childList: !0, subtree: !0 }, PT = [
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
], _T = function(r) {
  return r === void 0 && (r = 0), Date.now() + r;
}, bb = !1, E_ = function() {
  function r() {
    var i = this;
    this.stopped = !0, this.listener = function() {
      return i.schedule();
    };
  }
  return r.prototype.run = function(i) {
    var o = this;
    if (i === void 0 && (i = T_), !bb) {
      bb = !0;
      var c = _T(i);
      x_(function() {
        var h = !1;
        try {
          h = w_();
        } finally {
          if (bb = !1, i = c - _T(), !C_())
            return;
          h ? o.run(1e3) : i > 0 ? o.run(i) : o.start();
        }
      });
    }
  }, r.prototype.schedule = function() {
    this.stop(), this.run();
  }, r.prototype.observe = function() {
    var i = this, o = function() {
      return i.observer && i.observer.observe(document.body, M_);
    };
    document.body ? o() : tp.addEventListener("DOMContentLoaded", o);
  }, r.prototype.start = function() {
    var i = this;
    this.stopped && (this.stopped = !1, this.observer = new MutationObserver(this.listener), this.observe(), PT.forEach(function(o) {
      return tp.addEventListener(o, i.listener, !0);
    }));
  }, r.prototype.stop = function() {
    var i = this;
    this.stopped || (this.observer && this.observer.disconnect(), PT.forEach(function(o) {
      return tp.removeEventListener(o, i.listener, !0);
    }), this.stopped = !0);
  }, r;
}(), Gb = new E_(), zT = function(r) {
  !eg && r > 0 && Gb.start(), eg += r, !eg && Gb.stop();
}, I_ = function(r) {
  return !yS(r) && !p_(r) && getComputedStyle(r).display === "inline";
}, A_ = function() {
  function r(i, o) {
    this.target = i, this.observedBox = o || sp.CONTENT_BOX, this.lastReportedSize = {
      inlineSize: 0,
      blockSize: 0
    };
  }
  return r.prototype.isActive = function() {
    var i = eE(this.target, this.observedBox, !0);
    return I_(this.target) && (this.lastReportedSize = i), this.lastReportedSize.inlineSize !== i.inlineSize || this.lastReportedSize.blockSize !== i.blockSize;
  }, r;
}(), R_ = function() {
  function r(i, o) {
    this.activeTargets = [], this.skippedTargets = [], this.observationTargets = [], this.observer = i, this.callback = o;
  }
  return r;
}(), $v = /* @__PURE__ */ new WeakMap(), OT = function(r, i) {
  for (var o = 0; o < r.length; o += 1)
    if (r[o].target === i)
      return o;
  return -1;
}, Qv = function() {
  function r() {
  }
  return r.connect = function(i, o) {
    var c = new R_(i, o);
    $v.set(i, c);
  }, r.observe = function(i, o, c) {
    var h = $v.get(i), m = h.observationTargets.length === 0;
    OT(h.observationTargets, o) < 0 && (m && ku.push(h), h.observationTargets.push(new A_(o, c && c.box)), zT(1), Gb.schedule());
  }, r.unobserve = function(i, o) {
    var c = $v.get(i), h = OT(c.observationTargets, o), m = c.observationTargets.length === 1;
    h >= 0 && (m && ku.splice(ku.indexOf(c), 1), c.observationTargets.splice(h, 1), zT(-1));
  }, r.disconnect = function(i) {
    var o = this, c = $v.get(i);
    c.observationTargets.slice().forEach(function(h) {
      return o.unobserve(i, h.target);
    }), c.activeTargets.splice(0, c.activeTargets.length);
  }, r;
}(), D_ = function() {
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
    if (!RT(i))
      throw new TypeError("Failed to execute 'observe' on 'ResizeObserver': parameter 1 is not of type 'Element");
    Qv.observe(this, i, o);
  }, r.prototype.unobserve = function(i) {
    if (arguments.length === 0)
      throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': 1 argument required, but only 0 present.");
    if (!RT(i))
      throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': parameter 1 is not of type 'Element");
    Qv.unobserve(this, i);
  }, r.prototype.disconnect = function() {
    Qv.disconnect(this);
  }, r.toString = function() {
    return "function ResizeObserver () { [polyfill code] }";
  }, r;
}();
function N_(r) {
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
function k_(r) {
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
function P_(r) {
  const i = "http://www.w3.org/2000/svg", o = document.createElementNS(i, "svg");
  o.setAttribute("class", `${r}-footer-icon-play`), o.setAttribute("viewBox", "0 0 500 500");
  const c = document.createElementNS(i, "path");
  return c.setAttribute("fill", "currentColor"), c.setAttribute("d", "M418.158 257.419L174.663 413.33c-6.017 3.919-15.708 3.772-21.291-.29-2.791-2.018-4.295-4.483-4.295-7.084V94.109c0-5.65 6.883-10.289 15.271-10.289 4.298 0 8.391 1.307 11.181 3.332l242.629 155.484c6.016 3.917 6.451 10.292.649 14.491-.216.154-.432.154-.649.292zM170.621 391.288l223.116-141.301L170.71 107.753l-.089 283.535z"), o.appendChild(c), o;
}
function __(r) {
  const i = "http://www.w3.org/2000/svg", o = document.createElementNS(i, "svg");
  o.setAttribute("class", `${r}-footer-icon-pause`), o.setAttribute("viewBox", "0 0 500 500");
  const c = document.createElementNS(i, "path");
  return c.setAttribute("fill", "currentColor"), c.setAttribute("d", "M312.491 78.261c0-6.159 4.893-11.213 11.04-11.213 6.158 0 11.211 5.054 11.211 11.213v343.478c0 6.159-5.053 11.213-11.211 11.213-6.147 0-11.04-5.054-11.04-11.213V78.261zM165.257 78.261c0-6.159 4.893-11.213 11.04-11.213 6.158 0 11.211 5.054 11.211 11.213v343.478c0 6.159-5.053 11.213-11.211 11.213-6.147 0-11.04-5.054-11.04-11.213V78.261z"), o.appendChild(c), o;
}
const ul = typeof window < "u", iE = ul && !("onscroll" in window) || typeof navigator < "u" && /(gle|ing|ro)bot|crawl|spider/i.test(navigator.userAgent), rE = ul && "IntersectionObserver" in window, aE = ul && "classList" in document.createElement("p"), sE = ul && window.devicePixelRatio > 1, z_ = {
  elements_selector: ".lazy",
  container: iE || ul ? document : null,
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
}, oE = (r) => Object.assign({}, z_, r), LT = function(r, i) {
  let o;
  const c = "LazyLoad::Initialized", h = new r(i);
  try {
    o = new CustomEvent(c, { detail: { instance: h } });
  } catch {
    o = document.createEvent("CustomEvent"), o.initCustomEvent(c, !1, !1, { instance: h });
  }
  window.dispatchEvent(o);
}, O_ = (r, i) => {
  if (!!i)
    if (!i.length)
      LT(r, i);
    else
      for (let o = 0, c; c = i[o]; o += 1)
        LT(r, c);
}, go = "src", wS = "srcset", bS = "sizes", lE = "poster", dp = "llOriginalAttrs", uE = "data", SS = "loading", cE = "loaded", dE = "applied", L_ = "entered", xS = "error", fE = "native", hE = "data-", pE = "ll-status", Ki = (r, i) => r.getAttribute(hE + i), B_ = (r, i, o) => {
  var c = hE + i;
  if (o === null) {
    r.removeAttribute(c);
    return;
  }
  r.setAttribute(c, o);
}, fp = (r) => Ki(r, pE), Ou = (r, i) => B_(r, pE, i), pg = (r) => Ou(r, null), CS = (r) => fp(r) === null, j_ = (r) => fp(r) === SS, U_ = (r) => fp(r) === xS, TS = (r) => fp(r) === fE, V_ = [SS, cE, dE, xS], H_ = (r) => V_.indexOf(fp(r)) >= 0, cl = (r, i, o, c) => {
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
  if (aE) {
    r.classList.add(i);
    return;
  }
  r.className += (r.className ? " " : "") + i;
}, bs = (r, i) => {
  if (aE) {
    r.classList.remove(i);
    return;
  }
  r.className = r.className.replace(new RegExp("(^|\\s+)" + i + "(\\s+|$)"), " ").replace(/^\s+/, "").replace(/\s+$/, "");
}, W_ = (r) => {
  r.llTempImage = document.createElement("IMG");
}, F_ = (r) => {
  delete r.llTempImage;
}, mE = (r) => r.llTempImage, mg = (r, i) => {
  if (!i)
    return;
  const o = i._observer;
  !o || o.unobserve(r);
}, $_ = (r) => {
  r.disconnect();
}, Q_ = (r, i, o) => {
  i.unobserve_entered && mg(r, o);
}, MS = (r, i) => {
  !r || (r.loadingCount += i);
}, Z_ = (r) => {
  !r || (r.toLoadCount -= 1);
}, vE = (r, i) => {
  !r || (r.toLoadCount = i);
}, Y_ = (r) => r.loadingCount > 0, G_ = (r) => r.toLoadCount > 0, gE = (r) => {
  let i = [];
  for (let o = 0, c; c = r.children[o]; o += 1)
    c.tagName === "SOURCE" && i.push(c);
  return i;
}, ES = (r, i) => {
  const o = r.parentNode;
  if (!o || o.tagName !== "PICTURE")
    return;
  gE(o).forEach(i);
}, yE = (r, i) => {
  gE(r).forEach(i);
}, vg = [go], wE = [go, lE], op = [go, wS, bS], bE = [uE], gg = (r) => !!r[dp], SE = (r) => r[dp], xE = (r) => delete r[dp], Rd = (r, i) => {
  if (gg(r))
    return;
  const o = {};
  i.forEach((c) => {
    o[c] = r.getAttribute(c);
  }), r[dp] = o;
}, X_ = (r) => {
  gg(r) || (r[dp] = { backgroundImage: r.style.backgroundImage });
}, J_ = (r, i, o) => {
  if (!o) {
    r.removeAttribute(i);
    return;
  }
  r.setAttribute(i, o);
}, zu = (r, i) => {
  if (!gg(r))
    return;
  const o = SE(r);
  i.forEach((c) => {
    J_(r, c, o[c]);
  });
}, q_ = (r) => {
  if (!gg(r))
    return;
  const i = SE(r);
  r.style.backgroundImage = i.backgroundImage;
}, CE = (r, i, o) => {
  kd(r, i.class_applied), Ou(r, dE), o && (i.unobserve_completed && mg(r, i), cl(i.callback_applied, r, o));
}, TE = (r, i, o) => {
  kd(r, i.class_loading), Ou(r, SS), o && (MS(o, 1), cl(i.callback_loading, r, o));
}, ll = (r, i, o) => {
  !o || r.setAttribute(i, o);
}, BT = (r, i) => {
  ll(r, bS, Ki(r, i.data_sizes)), ll(r, wS, Ki(r, i.data_srcset)), ll(r, go, Ki(r, i.data_src));
}, K_ = (r, i) => {
  ES(r, (o) => {
    Rd(o, op), BT(o, i);
  }), Rd(r, op), BT(r, i);
}, ez = (r, i) => {
  Rd(r, vg), ll(r, go, Ki(r, i.data_src));
}, tz = (r, i) => {
  yE(r, (o) => {
    Rd(o, vg), ll(o, go, Ki(o, i.data_src));
  }), Rd(r, wE), ll(r, lE, Ki(r, i.data_poster)), ll(r, go, Ki(r, i.data_src)), r.load();
}, nz = (r, i) => {
  Rd(r, bE), ll(r, uE, Ki(r, i.data_src));
}, iz = (r, i, o) => {
  const c = Ki(r, i.data_bg), h = Ki(r, i.data_bg_hidpi), m = sE && h ? h : c;
  !m || (r.style.backgroundImage = `url("${m}")`, mE(r).setAttribute(go, m), TE(r, i, o));
}, rz = (r, i, o) => {
  const c = Ki(r, i.data_bg_multi), h = Ki(r, i.data_bg_multi_hidpi), m = sE && h ? h : c;
  !m || (r.style.backgroundImage = m, CE(r, i, o));
}, az = (r, i, o) => {
  const c = Ki(r, i.data_bg_set);
  if (!c)
    return;
  const h = c.split("|");
  let m = h.map((w) => `image-set(${w})`);
  r.style.backgroundImage = m.join(), r.style.backgroundImage === "" && (m = h.map((w) => `-webkit-image-set(${w})`), r.style.backgroundImage = m.join()), CE(r, i, o);
}, ME = {
  IMG: K_,
  IFRAME: ez,
  VIDEO: tz,
  OBJECT: nz
}, sz = (r, i) => {
  const o = ME[r.tagName];
  !o || o(r, i);
}, oz = (r, i, o) => {
  const c = ME[r.tagName];
  !c || (c(r, i), TE(r, i, o));
}, lz = ["IMG", "IFRAME", "VIDEO", "OBJECT"], uz = (r) => lz.indexOf(r.tagName) > -1, EE = (r, i) => {
  i && !Y_(i) && !G_(i) && cl(r.callback_finish, i);
}, jT = (r, i, o) => {
  r.addEventListener(i, o), r.llEvLisnrs[i] = o;
}, cz = (r, i, o) => {
  r.removeEventListener(i, o);
}, IS = (r) => !!r.llEvLisnrs, dz = (r, i, o) => {
  IS(r) || (r.llEvLisnrs = {});
  const c = r.tagName === "VIDEO" ? "loadeddata" : "load";
  jT(r, c, i), jT(r, "error", o);
}, Xb = (r) => {
  if (!IS(r))
    return;
  const i = r.llEvLisnrs;
  for (let o in i) {
    const c = i[o];
    cz(r, o, c);
  }
  delete r.llEvLisnrs;
}, IE = (r, i, o) => {
  F_(r), MS(o, -1), Z_(o), bs(r, i.class_loading), i.unobserve_completed && mg(r, o);
}, fz = (r, i, o, c) => {
  const h = TS(i);
  IE(i, o, c), kd(i, o.class_loaded), Ou(i, cE), cl(o.callback_loaded, i, c), h || EE(o, c);
}, hz = (r, i, o, c) => {
  const h = TS(i);
  IE(i, o, c), kd(i, o.class_error), Ou(i, xS), cl(o.callback_error, i, c), o.restore_on_error && zu(i, op), h || EE(o, c);
}, AS = (r, i, o) => {
  const c = mE(r) || r;
  if (IS(c))
    return;
  dz(c, (w) => {
    fz(w, r, i, o), Xb(c);
  }, (w) => {
    hz(w, r, i, o), Xb(c);
  });
}, pz = (r, i, o) => {
  W_(r), AS(r, i, o), X_(r), iz(r, i, o), rz(r, i, o), az(r, i, o);
}, mz = (r, i, o) => {
  AS(r, i, o), oz(r, i, o);
}, RS = (r, i, o) => {
  uz(r) ? mz(r, i, o) : pz(r, i, o);
}, vz = (r, i, o) => {
  r.setAttribute("loading", "lazy"), AS(r, i, o), sz(r, i), Ou(r, fE);
}, UT = (r) => {
  r.removeAttribute(go), r.removeAttribute(wS), r.removeAttribute(bS);
}, gz = (r) => {
  ES(r, (i) => {
    UT(i);
  }), UT(r);
}, AE = (r) => {
  ES(r, (i) => {
    zu(i, op);
  }), zu(r, op);
}, yz = (r) => {
  yE(r, (i) => {
    zu(i, vg);
  }), zu(r, wE), r.load();
}, wz = (r) => {
  zu(r, vg);
}, bz = (r) => {
  zu(r, bE);
}, Sz = {
  IMG: AE,
  IFRAME: wz,
  VIDEO: yz,
  OBJECT: bz
}, xz = (r) => {
  const i = Sz[r.tagName];
  if (!i) {
    q_(r);
    return;
  }
  i(r);
}, Cz = (r, i) => {
  CS(r) || TS(r) || (bs(r, i.class_entered), bs(r, i.class_exited), bs(r, i.class_applied), bs(r, i.class_loading), bs(r, i.class_loaded), bs(r, i.class_error));
}, Tz = (r, i) => {
  xz(r), Cz(r, i), pg(r), xE(r);
}, Mz = (r, i, o, c) => {
  !o.cancel_on_exit || !j_(r) || r.tagName === "IMG" && (Xb(r), gz(r), AE(r), bs(r, o.class_loading), MS(c, -1), pg(r), cl(o.callback_cancel, r, i, c));
}, Ez = (r, i, o, c) => {
  const h = H_(r);
  Ou(r, L_), kd(r, o.class_entered), bs(r, o.class_exited), Q_(r, o, c), cl(o.callback_enter, r, i, c), !h && RS(r, o, c);
}, Iz = (r, i, o, c) => {
  CS(r) || (kd(r, o.class_exited), Mz(r, i, o, c), cl(o.callback_exit, r, i, c));
}, Az = ["IMG", "IFRAME", "VIDEO"], RE = (r) => r.use_native && "loading" in HTMLImageElement.prototype, Rz = (r, i, o) => {
  r.forEach((c) => {
    Az.indexOf(c.tagName) !== -1 && vz(c, i, o);
  }), vE(o, 0);
}, Dz = (r) => r.isIntersecting || r.intersectionRatio > 0, Nz = (r) => ({
  root: r.container === document ? null : r.container,
  rootMargin: r.thresholds || r.threshold + "px"
}), kz = (r, i, o) => {
  r.forEach((c) => Dz(c) ? Ez(c.target, c, i, o) : Iz(c.target, c, i, o));
}, Pz = (r, i) => {
  i.forEach((o) => {
    r.observe(o);
  });
}, _z = (r, i) => {
  $_(r), Pz(r, i);
}, zz = (r, i) => {
  !rE || RE(r) || (i._observer = new IntersectionObserver((o) => {
    kz(o, r, i);
  }, Nz(r)));
}, DE = (r) => Array.prototype.slice.call(r), sg = (r) => r.container.querySelectorAll(r.elements_selector), Oz = (r) => DE(r).filter(CS), Lz = (r) => U_(r), Bz = (r) => DE(r).filter(Lz), VT = (r, i) => Oz(r || sg(i)), jz = (r, i) => {
  Bz(sg(r)).forEach((c) => {
    bs(c, r.class_error), pg(c);
  }), i.update();
}, Uz = (r, i) => {
  !ul || (i._onlineHandler = () => {
    jz(r, i);
  }, window.addEventListener("online", i._onlineHandler));
}, Vz = (r) => {
  !ul || window.removeEventListener("online", r._onlineHandler);
}, hp = function(r, i) {
  const o = oE(r);
  this._settings = o, this.loadingCount = 0, zz(o, this), Uz(o, this), this.update(i);
};
hp.prototype = {
  update: function(r) {
    const i = this._settings, o = VT(r, i);
    if (vE(this, o.length), iE || !rE) {
      this.loadAll(o);
      return;
    }
    if (RE(i)) {
      Rz(o, i, this);
      return;
    }
    _z(this._observer, o);
  },
  destroy: function() {
    this._observer && this._observer.disconnect(), Vz(this), sg(this._settings).forEach((r) => {
      xE(r);
    }), delete this._observer, delete this._settings, delete this._onlineHandler, delete this.loadingCount, delete this.toLoadCount;
  },
  loadAll: function(r) {
    const i = this._settings;
    VT(r, i).forEach((c) => {
      mg(c, this), RS(c, i, this);
    });
  },
  restoreAll: function() {
    const r = this._settings;
    sg(r).forEach((i) => {
      Tz(i, r);
    });
  }
};
hp.load = (r, i) => {
  const o = oE(i);
  RS(r, o);
};
hp.resetStatus = (r) => {
  pg(r);
};
ul && O_(hp, window.lazyLoadOptions);
class NE {
  constructor({ readonly: i, box: o, pages: c, onNewPageIndex: h, onPlay: m }) {
    if (this.pageIndex = 0, this.namespace = "netless-app-docs-viewer", this.isShowPreview = !1, this.isSmallBox = !1, this.sideEffect = new hg(), c.length <= 0)
      throw new Error("[DocsViewer] Empty pages.");
    this.readonly = i, this.box = o, this.pages = c, this.onNewPageIndex = h, this.onPlay = m, this.onPageIndexChanged = () => {
    }, this.render();
  }
  mount() {
    this.box.mountContent(this.$content), this.box.mountFooter(this.$footer), this.sideEffect.add(() => {
      const i = new hp({
        container: this.$preview,
        elements_selector: `.${this.wrapClassName("preview-page>img")}`
      });
      return () => i.destroy();
    }, "preview-lazyload"), this.box.events.on("maximized", (i) => {
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
    c == null || c.forEach((x, T) => {
      var A;
      (A = x.querySelector("img")) == null || A.classList.toggle(this.wrapClassName("active"), Number(i) == T);
    });
    const h = Array.prototype.slice.call(c).find((x) => x.querySelector("img").className.includes(this.wrapClassName("active")));
    if (!h)
      return;
    const m = this.$preview.getBoundingClientRect(), w = h == null ? void 0 : h.getBoundingClientRect();
    w.top >= m.top && w.bottom <= m.bottom || this.$preview.scrollTo({
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
      i.className = this.wrapClassName("content"), this.$content = i, this.readonly && i.classList.add(this.wrapClassName("readonly")), i.appendChild(this.renderPreviewMask()), i.appendChild(this.renderPreview());
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
      this.pages.forEach((w, g) => {
        var x;
        const T = (x = w.thumbnail) != null ? x : w.src.startsWith("ppt") ? void 0 : w.src;
        if (!T)
          return;
        const A = String(g), I = document.createElement("a");
        I.className = h + " " + this.wrapClassName(`preview-page-${g}`), I.setAttribute("href", "#"), I.dataset.pageIndex = A;
        const z = document.createElement("span");
        z.className = m, z.textContent = String(g + 1), z.dataset.pageIndex = A;
        const F = document.createElement("img");
        F.width = w.width, F.height = w.height, F.dataset.src = T, F.dataset.pageIndex = A, I.appendChild(z), I.appendChild(F), i.appendChild(I), F.classList.toggle(this.wrapClassName("active"), this.pageIndex == g);
      }), this.sideEffect.addEventListener(i, "click", (w) => {
        var g;
        if (this.readonly)
          return;
        const x = (g = w.target.dataset) == null ? void 0 : g.pageIndex;
        x && (w.preventDefault(), w.stopPropagation(), w.stopImmediatePropagation(), this.onNewPageIndex(Number(x)));
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
      const c = this.renderFooterBtn("btn-page-back", N_(this.namespace));
      if (this.sideEffect.addEventListener(c, "click", () => {
        this.readonly || this.onNewPageIndex(this.pageIndex - 1);
      }), o.appendChild(c), this.$btnPageBack = c, this.onPlay) {
        const x = this.renderFooterBtn("btn-page-play", P_(this.namespace), __(this.namespace)), T = () => {
          this.sideEffect.setTimeout(() => {
            x.classList.toggle(this.wrapClassName("footer-btn-playing"), !1);
          }, 500, "returnPlay");
        };
        this.sideEffect.addEventListener(x, "click", () => {
          var A;
          this.readonly || (x.classList.toggle(this.wrapClassName("footer-btn-playing"), !0), (A = this.onPlay) == null || A.call(this), T());
        }), this.$footer.appendChild(x);
      }
      const h = document.createElement("div");
      h.className = this.wrapClassName("page-number");
      const m = document.createElement("span");
      m.className = this.wrapClassName("page-number-input"), m.textContent = String(this.pageIndex + 1), this.$pageNumberInput = m;
      const w = document.createElement("span");
      w.textContent = " / " + this.pages.length, h.appendChild(m), h.appendChild(w), o.appendChild(h);
      const g = this.renderFooterBtn("btn-page-next", k_(this.namespace));
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
    if (this.isShowPreview = i != null ? i : !this.isShowPreview, this.$content.classList.toggle(this.wrapClassName("preview-active"), this.isShowPreview), this.isShowPreview) {
      const o = this.$preview.querySelector("." + this.wrapClassName(`preview-page-${this.pageIndex}`));
      o && this.$preview.scrollTo({
        top: o.offsetTop - 16
      });
    }
  }
  wrapClassName(i) {
    return `${this.namespace}-${i}`;
  }
}
function Dd(r, i, o) {
  return Math.min(Math.max(r, i), o);
}
function HT(r) {
  return r.touches ? r.touches[0] : r;
}
function kE(r) {
  r.stopPropagation(), r.cancelable && r.preventDefault();
}
function PE(r) {
  if (!r)
    return !1;
  const i = r.tagName;
  return i === "INPUT" || i === "TEXTAREA" || i === "SELECT";
}
class Hz {
  constructor(i) {
    var o, c, h;
    this.velocity = 0, this.paused = !0, this._animationFrameID = null, this._loopTimestamp = 0, this.looper = (m) => {
      if (this.paused)
        return;
      let w = Math.floor((m - this._loopTimestamp) / 1e3 * 60) + 1;
      for (this._loopTimestamp = m; w-- > 0; )
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
class Wz {
  constructor(i, o, c, h) {
    this.scale = 1, this.lastVisit = Date.now(), this.pageOffsetY = 0, this.pageOffsetX = 0, this.visible = !0, this.index = i, this.page = o, this.scale = c, this.pageOffsetX = (h - o.width) / 2;
    const m = document.createElement("div");
    m.className = "page-renderer-page", m.dataset.index = `${i}`, m.style.width = `${o.width * c}px`, m.style.height = `${o.height * c}px`, o.thumbnail && (m.style.backgroundImage = `url("${o.thumbnail}")`);
    const w = document.createElement("img");
    w.className = "page-renderer-page-img", w.width = o.width, w.height = o.height, w.src = o.src, m.appendChild(w), this.$page = m;
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
const Fz = window.requestIdleCallback || ((r) => window.setTimeout(r, 5e3)), $z = window.cancelIdleCallback || window.clearTimeout;
class Qz {
  constructor(i, o, c) {
    this.pages = i, this.pagesIntrinsicWidth = o, this.scale = c, this.els = /* @__PURE__ */ new Map(), this.maxElCount = 200, this.gcTimer = null, this.gc = () => {
      if (this.gcTimer = null, this.els.size > this.maxElCount) {
        const h = [...this.els.values()].sort((m, w) => w.lastVisit - m.lastVisit);
        for (let m = Math.floor(this.maxElCount / 4); m < h.length; m++)
          this.els.delete(h[m].index);
      }
    };
  }
  getEl(i) {
    let o = this.els.get(i);
    return o || (o = new Wz(i, this.pages[i], this.scale, this.pagesIntrinsicWidth), this.els.set(i, o)), o.lastVisit = Date.now(), this.els.size > this.maxElCount && this.gcTimer === null && (this.gcTimer = Fz(this.gc)), o;
  }
  setScale(i) {
    i !== this.scale && (this.scale = i, this.els.forEach((o) => o.setScale(i)));
  }
  destroy() {
    this.els.clear(), this.gcTimer !== null && ($z(this.gcTimer), this.gcTimer = null);
  }
}
class Zz {
  constructor(i) {
    this._hwaTimeout = NaN, this._turnOffHWA = () => {
      window.clearTimeout(this._hwaTimeout), this._hwaTimeout = NaN, this.$pages.classList.toggle("is-hwa", !1);
    }, this.pagesScrollTop = i.pagesScrollTop || 0, this.containerWidth = i.containerWidth || 1, this.containerHeight = i.containerHeight || 1, this.pages = i.pages.map((m) => {
      if (m.thumbnail)
        return m;
      try {
        const w = new URL(m.src);
        return w.searchParams.set("x-oss-process", "image/resize,l_50"), GM(YM({}, m), { thumbnail: w.toString() });
      } catch (w) {
        return console.error(w), m;
      }
    });
    const o = Array(this.pages.length);
    let c = 1 / 0, h = 0;
    this.pagesIntrinsicHeight = this.pages.reduce((m, w, g) => (o[g] = m, w.width > h && (h = w.width), w.height <= c && (c = w.height), m + w.height), 0), this.pagesIntrinsicWidth = h, this.pagesMinHeight = c, this.pagesIntrinsicYs = o, this.scale = this._calcScale(), this.threshold = this._calcThreshold(), this.onPageIndexChanged = i.onPageIndexChanged, this.pageScrollIndex = 0, this.pagesScrollTop !== 0 && (this.pageScrollIndex = this.findScrollPageIndex(), this.onPageIndexChanged && this.pageScrollIndex > 0 && this.onPageIndexChanged(this.pageScrollIndex)), this.pageElManager = new Qz(this.pages, h, this.scale), this.$pages = this.renderPages();
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
      for (let w = 0; w < this.$pages.children.length; w++) {
        const g = this.$pages.children[w], x = Number(g.dataset.index);
        x >= h && x <= m || (g.remove(), w--);
      }
      for (let w = h; w <= m; w++) {
        const g = this.pageElManager.getEl(w);
        g.$page.parentElement !== this.$pages && this.$pages.appendChild(g.$page), g.translateY(this.pagesIntrinsicYs[w] - this.pagesScrollTop);
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
const Yz = 30;
class Gz {
  constructor(i) {
    this.sideEffect = new hg(), this.pagesScrollTop = i.pagesScrollTop || 0, this.containerWidth = i.containerWidth || 1, this.containerHeight = i.containerHeight || 1, this.pagesWidth = i.pagesWidth || 1, this.pagesHeight = i.pagesHeight || 1, this.scale = this._calcScale(), this.scrollbarMinHeight = i.scrollbarMinHeight || Yz, this.scrollbarHeight = this._calcScrollbarHeight(), this.readonly = i.readonly, this.wrapClassName = i.wrapClassName, this.onDragScroll = i.onDragScroll, this.$scrollbar = this.renderScrollbar();
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
      kE(c);
      const h = this.wrapClassName("scrollbar-dragging");
      i.classList.toggle(h, !0);
      const m = this.pagesScrollTop, { clientY: w } = HT(c), g = (T) => {
        if (this.readonly)
          return;
        const { clientY: A } = HT(T), I = (A - w) / this.scale;
        Math.abs(I) > 0 && this.onDragScroll && this.onDragScroll(m + I * (this.pagesHeight * this.scale / this.containerHeight));
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
const Xz = window.ResizeObserver || D_, Fh = 640;
class Jz {
  constructor({
    context: i,
    whiteboardView: o,
    readonly: c,
    box: h,
    pages: m,
    pageScrollTop: w = 0,
    mountWhiteboard: g,
    onUserScroll: x,
    baseScenePath: T,
    appId: A
  }) {
    this.sideEffect = new hg(), this.userScrolling = !1, this.onNewPageIndex = ($) => {
      this.scrollToPage($);
    }, this.toPdf = async () => {
      const $ = document.createElement("canvas"), J = $.getContext("2d");
      if (!J || !this.baseScenePath) {
        this.reportProgress(100, null);
        return;
      }
      const q = this.whiteboardView.focusScenePath || `${this.baseScenePath}/1`, de = this.pages[0], { jsPDF: se } = await import("jspdf"), Z = new se({
        format: [de.width, de.height],
        orientation: de.width > de.height ? "l" : "p",
        compress: !0
      });
      for (const [oe, Le] of this.pages.entries()) {
        const { width: Qe, height: je, src: Y } = Le;
        $.width = Qe, $.height = je;
        const he = Qe > je ? "l" : "p";
        oe > 0 && Z.addPage([Qe, je], he);
        const Ie = await this.getBase64FromUrl(Y), ie = document.createElement("img");
        ie.src = Ie, await new Promise((Ve) => ie.onload = Ve), J.drawImage(ie, 0, 0);
        const st = $.toDataURL("image/jpeg", 0.6);
        J.clearRect(0, 0, Qe, je);
        const fe = {
          centerX: Qe / 2,
          centerY: je / 2 + oe * je,
          scale: 1
        }, xe = this.context.manager.windowManger;
        xe._appliancePlugin ? await xe._appliancePlugin.screenshotToCanvasAsync(J, q, Qe, je, fe) : this.whiteboardView.screenshotToCanvas(J, q, Qe, je, fe);
        const We = $.toDataURL("image/png");
        Z.addImage(st, "JPEG", 0, 0, Qe, je, "", "FAST"), Z.addImage(We, "PNG", 0, 0, Qe, je, "", "FAST"), J.clearRect(0, 0, Qe, je), Math.ceil((oe + 1) / this.pages.length * 100) < 100 && this.reportProgress(Math.ceil((oe + 1) / this.pages.length * 100), null);
      }
      const ue = Z.output("arraybuffer");
      this.reportProgress(100, { pdf: ue, title: this.box.title });
    }, this.context = i, this.whiteboardView = o, this.readonly = c, this.box = h, this.pages = m, this.baseScenePath = T, this.appId = A, this.mountWhiteboard = g, this._onUserScroll = x;
    const I = this.debounce(() => {
      this.userScrolling = !1, this._onUserScroll && this._onUserScroll(this.pageRenderer.pagesScrollTop);
    }, { wait: 80 }, "debounce-updateUserScroll");
    this.updateUserScroll = () => {
      this.userScrolling = !0, I();
    }, this.viewer = new NE({
      readonly: c,
      box: h,
      pages: m,
      onNewPageIndex: this.onNewPageIndex
    });
    const { width: z, height: F } = this.whiteboardView.size;
    this.pageRenderer = new Zz({
      pagesScrollTop: w,
      pages: this.pages,
      containerWidth: z,
      containerHeight: F,
      onPageIndexChanged: this.viewer.setPageIndex.bind(this.viewer)
    }), this.scrollbar = new Gz({
      pagesScrollTop: this.pageRenderer.pagesScrollTop,
      containerWidth: z,
      containerHeight: F,
      pagesWidth: this.pageRenderer.pagesIntrinsicWidth,
      pagesHeight: this.pageRenderer.pagesIntrinsicHeight,
      readonly: this.readonly,
      wrapClassName: this.wrapClassName.bind(this),
      onDragScroll: ($) => {
        this.pageScrollTo($), this.updateUserScroll();
      }
    }), this.pageScrollStepper = new Hz({
      start: this.pageRenderer.pagesScrollTop,
      onStep: ($) => {
        this.pageScrollTo($);
      }
    }), this.render();
  }
  mount() {
    this.viewer.mount(), this.setupScrollListener();
    const i = this.debounce(this.renderRatioHeight.bind(this), {
      wait: 80
    });
    return this.sideEffect.add(() => {
      const o = new Xz(i);
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
      const c = 26 / Fh, h = 26 / i, m = 26 / Fh, w = 0, g = Math.max((c + m - (h + w)) / 2, 0);
      if (this.box.$titleBar) {
        const x = h + g;
        this.box.$titleBar.style.height = `${x * 100}%`;
      }
      if (this.box.$footer) {
        const x = w + g;
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
      kE(i), this.readonly || (this.pageScrollTo(this.pageRenderer.pagesScrollTop + i.deltaY), this.updateUserScroll());
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
      if (this.readonly || !this.box.focus || this.box.minimized || PE(i.target))
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
    const h = r_(i, o);
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
        const w = m.result;
        h(w);
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
class qz {
  constructor({ context: i, whiteboardView: o, box: c, pages: h }) {
    this.sideEffect = new hg(), this.onPlayPPT = () => {
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
    }, this.context = i, this.whiteboardView = o, this.box = c, this.pages = h, this.displayer = i.getDisplayer(), this.viewer = new NE({
      readonly: !i.getIsWritable(),
      box: c,
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
      const m = this.context.getInitScenePath(), w = (h = (c = this.context.getScenes()) == null ? void 0 : c[i]) == null ? void 0 : h.name;
      m && w && this.context.setScenePath(`${m}/${w}`), this.scaleDocsToFit();
    }
    if (i !== this.viewer.pageIndex && this.viewer.setPageIndex(i), o) {
      const m = this.context.getRoom();
      if (m) {
        const w = m.state.globalState.__pptState;
        m.setGlobalState({
          __pptState: w && {
            uuid: w.uuid,
            pageIndex: i,
            disableAutoPlay: w.disableAutoPlay
          }
        });
      }
    }
  }
  render() {
    this.viewer.$content.appendChild(this.renderMask()), this.viewer.$content.appendChild(this.renderWhiteboardView()), this.sideEffect.addEventListener(window, "keydown", (i) => {
      var o;
      if (this.box.focus && !PE(i.target))
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
const Kz = "DocsViewer", Jb = {
  kind: Kz,
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
    return i.mountStyles(GP), h[0].src.startsWith("ppt") ? tO(r, c, i, h) : eO(r, c, i, h);
  }
};
function eO(r, i, o, c) {
  var h;
  i.disableCameraTransform = !r.getIsWritable();
  const m = new Jz({
    context: r,
    whiteboardView: i,
    readonly: !r.getIsWritable(),
    box: o,
    pages: c,
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
    r.dispatchAppEvent("pageStateChange", { index: w, length: c.length });
  }, r.dispatchAppEvent("pageStateChange", {
    index: m.viewer.pageIndex,
    length: c.length
  }), r.emitter.on("attributesUpdate", (w) => {
    w && w.pageScrollTop != null && m.syncPageScrollTop(w.pageScrollTop);
  }), r.emitter.on("writableChange", (w) => {
    m.setReadonly(!w), i.disableCameraTransform = !w;
  }), {
    viewer: () => m,
    position: () => {
      const w = m == null ? void 0 : m.viewer;
      if (w)
        return [w.pageIndex, m.pages.length];
    }
  };
}
function tO(r, i, o, c) {
  i.disableCameraTransform = !0;
  const h = new qz({
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
  }), r.mountView(h.$whiteboardView), r.isAddApp && i.callbacks.once("onSizeUpdated", ({ width: m, height: w }) => {
    if (c.length > 0 && o.state !== "maximized") {
      const { width: g, height: x } = c[0], A = x / g * m - w;
      A !== 0 && r.getIsWritable() && r.emitter.emit("setBoxSize", {
        width: o.width,
        height: o.height + A / o.containerRect.height
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
function _E(r) {
  return r && r.__esModule && Object.prototype.hasOwnProperty.call(r, "default") ? r.default : r;
}
var dl = { exports: {} }, Lt = {};
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var Sb, WT;
function yg() {
  if (WT)
    return Sb;
  WT = 1;
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
      for (var w = {}, g = 0; g < 10; g++)
        w["_" + String.fromCharCode(g)] = g;
      var x = Object.getOwnPropertyNames(w).map(function(A) {
        return w[A];
      });
      if (x.join("") !== "0123456789")
        return !1;
      var T = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(A) {
        T[A] = A;
      }), Object.keys(Object.assign({}, T)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return Sb = h() ? Object.assign : function(m, w) {
    for (var g, x = c(m), T, A = 1; A < arguments.length; A++) {
      g = Object(arguments[A]);
      for (var I in g)
        i.call(g, I) && (x[I] = g[I]);
      if (r) {
        T = r(g);
        for (var z = 0; z < T.length; z++)
          o.call(g, T[z]) && (x[T[z]] = g[T[z]]);
      }
    }
    return x;
  }, Sb;
}
/** @license React v16.14.0
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var FT;
function nO() {
  if (FT)
    return Lt;
  FT = 1;
  var r = yg(), i = typeof Symbol == "function" && Symbol.for, o = i ? Symbol.for("react.element") : 60103, c = i ? Symbol.for("react.portal") : 60106, h = i ? Symbol.for("react.fragment") : 60107, m = i ? Symbol.for("react.strict_mode") : 60108, w = i ? Symbol.for("react.profiler") : 60114, g = i ? Symbol.for("react.provider") : 60109, x = i ? Symbol.for("react.context") : 60110, T = i ? Symbol.for("react.forward_ref") : 60112, A = i ? Symbol.for("react.suspense") : 60113, I = i ? Symbol.for("react.memo") : 60115, z = i ? Symbol.for("react.lazy") : 60116, F = typeof Symbol == "function" && Symbol.iterator;
  function $(D) {
    for (var B = "https://reactjs.org/docs/error-decoder.html?invariant=" + D, ee = 1; ee < arguments.length; ee++)
      B += "&args[]=" + encodeURIComponent(arguments[ee]);
    return "Minified React error #" + D + "; visit " + B + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  var J = { isMounted: function() {
    return !1;
  }, enqueueForceUpdate: function() {
  }, enqueueReplaceState: function() {
  }, enqueueSetState: function() {
  } }, q = {};
  function de(D, B, ee) {
    this.props = D, this.context = B, this.refs = q, this.updater = ee || J;
  }
  de.prototype.isReactComponent = {}, de.prototype.setState = function(D, B) {
    if (typeof D != "object" && typeof D != "function" && D != null)
      throw Error($(85));
    this.updater.enqueueSetState(this, D, B, "setState");
  }, de.prototype.forceUpdate = function(D) {
    this.updater.enqueueForceUpdate(this, D, "forceUpdate");
  };
  function se() {
  }
  se.prototype = de.prototype;
  function Z(D, B, ee) {
    this.props = D, this.context = B, this.refs = q, this.updater = ee || J;
  }
  var ue = Z.prototype = new se();
  ue.constructor = Z, r(ue, de.prototype), ue.isPureReactComponent = !0;
  var oe = { current: null }, Le = Object.prototype.hasOwnProperty, Qe = { key: !0, ref: !0, __self: !0, __source: !0 };
  function je(D, B, ee) {
    var ye, me = {}, ot = null, Ze = null;
    if (B != null)
      for (ye in B.ref !== void 0 && (Ze = B.ref), B.key !== void 0 && (ot = "" + B.key), B)
        Le.call(B, ye) && !Qe.hasOwnProperty(ye) && (me[ye] = B[ye]);
    var ze = arguments.length - 2;
    if (ze === 1)
      me.children = ee;
    else if (1 < ze) {
      for (var dt = Array(ze), Mt = 0; Mt < ze; Mt++)
        dt[Mt] = arguments[Mt + 2];
      me.children = dt;
    }
    if (D && D.defaultProps)
      for (ye in ze = D.defaultProps, ze)
        me[ye] === void 0 && (me[ye] = ze[ye]);
    return { $$typeof: o, type: D, key: ot, ref: Ze, props: me, _owner: oe.current };
  }
  function Y(D, B) {
    return { $$typeof: o, type: D.type, key: B, ref: D.ref, props: D.props, _owner: D._owner };
  }
  function he(D) {
    return typeof D == "object" && D !== null && D.$$typeof === o;
  }
  function Ie(D) {
    var B = { "=": "=0", ":": "=2" };
    return "$" + ("" + D).replace(/[=:]/g, function(ee) {
      return B[ee];
    });
  }
  var ie = /\/+/g, st = [];
  function fe(D, B, ee, ye) {
    if (st.length) {
      var me = st.pop();
      return me.result = D, me.keyPrefix = B, me.func = ee, me.context = ye, me.count = 0, me;
    }
    return { result: D, keyPrefix: B, func: ee, context: ye, count: 0 };
  }
  function xe(D) {
    D.result = null, D.keyPrefix = null, D.func = null, D.context = null, D.count = 0, 10 > st.length && st.push(D);
  }
  function We(D, B, ee, ye) {
    var me = typeof D;
    (me === "undefined" || me === "boolean") && (D = null);
    var ot = !1;
    if (D === null)
      ot = !0;
    else
      switch (me) {
        case "string":
        case "number":
          ot = !0;
          break;
        case "object":
          switch (D.$$typeof) {
            case o:
            case c:
              ot = !0;
          }
      }
    if (ot)
      return ee(ye, D, B === "" ? "." + Ve(D, 0) : B), 1;
    if (ot = 0, B = B === "" ? "." : B + ":", Array.isArray(D))
      for (var Ze = 0; Ze < D.length; Ze++) {
        me = D[Ze];
        var ze = B + Ve(me, Ze);
        ot += We(me, ze, ee, ye);
      }
    else if (D === null || typeof D != "object" ? ze = null : (ze = F && D[F] || D["@@iterator"], ze = typeof ze == "function" ? ze : null), typeof ze == "function")
      for (D = ze.call(D), Ze = 0; !(me = D.next()).done; )
        me = me.value, ze = B + Ve(me, Ze++), ot += We(me, ze, ee, ye);
    else if (me === "object")
      throw ee = "" + D, Error($(31, ee === "[object Object]" ? "object with keys {" + Object.keys(D).join(", ") + "}" : ee, ""));
    return ot;
  }
  function Ce(D, B, ee) {
    return D == null ? 0 : We(D, "", B, ee);
  }
  function Ve(D, B) {
    return typeof D == "object" && D !== null && D.key != null ? Ie(D.key) : B.toString(36);
  }
  function Ne(D, B) {
    D.func.call(D.context, B, D.count++);
  }
  function $e(D, B, ee) {
    var ye = D.result, me = D.keyPrefix;
    D = D.func.call(D.context, B, D.count++), Array.isArray(D) ? bt(D, ye, ee, function(ot) {
      return ot;
    }) : D != null && (he(D) && (D = Y(D, me + (!D.key || B && B.key === D.key ? "" : ("" + D.key).replace(ie, "$&/") + "/") + ee)), ye.push(D));
  }
  function bt(D, B, ee, ye, me) {
    var ot = "";
    ee != null && (ot = ("" + ee).replace(ie, "$&/") + "/"), B = fe(B, ot, ye, me), Ce(D, $e, B), xe(B);
  }
  var Xt = { current: null };
  function Ge() {
    var D = Xt.current;
    if (D === null)
      throw Error($(321));
    return D;
  }
  var re = { ReactCurrentDispatcher: Xt, ReactCurrentBatchConfig: { suspense: null }, ReactCurrentOwner: oe, IsSomeRendererActing: { current: !1 }, assign: r };
  return Lt.Children = { map: function(D, B, ee) {
    if (D == null)
      return D;
    var ye = [];
    return bt(D, ye, null, B, ee), ye;
  }, forEach: function(D, B, ee) {
    if (D == null)
      return D;
    B = fe(null, null, B, ee), Ce(D, Ne, B), xe(B);
  }, count: function(D) {
    return Ce(D, function() {
      return null;
    }, null);
  }, toArray: function(D) {
    var B = [];
    return bt(D, B, null, function(ee) {
      return ee;
    }), B;
  }, only: function(D) {
    if (!he(D))
      throw Error($(143));
    return D;
  } }, Lt.Component = de, Lt.Fragment = h, Lt.Profiler = w, Lt.PureComponent = Z, Lt.StrictMode = m, Lt.Suspense = A, Lt.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = re, Lt.cloneElement = function(D, B, ee) {
    if (D == null)
      throw Error($(267, D));
    var ye = r({}, D.props), me = D.key, ot = D.ref, Ze = D._owner;
    if (B != null) {
      if (B.ref !== void 0 && (ot = B.ref, Ze = oe.current), B.key !== void 0 && (me = "" + B.key), D.type && D.type.defaultProps)
        var ze = D.type.defaultProps;
      for (dt in B)
        Le.call(B, dt) && !Qe.hasOwnProperty(dt) && (ye[dt] = B[dt] === void 0 && ze !== void 0 ? ze[dt] : B[dt]);
    }
    var dt = arguments.length - 2;
    if (dt === 1)
      ye.children = ee;
    else if (1 < dt) {
      ze = Array(dt);
      for (var Mt = 0; Mt < dt; Mt++)
        ze[Mt] = arguments[Mt + 2];
      ye.children = ze;
    }
    return {
      $$typeof: o,
      type: D.type,
      key: me,
      ref: ot,
      props: ye,
      _owner: Ze
    };
  }, Lt.createContext = function(D, B) {
    return B === void 0 && (B = null), D = { $$typeof: x, _calculateChangedBits: B, _currentValue: D, _currentValue2: D, _threadCount: 0, Provider: null, Consumer: null }, D.Provider = { $$typeof: g, _context: D }, D.Consumer = D;
  }, Lt.createElement = je, Lt.createFactory = function(D) {
    var B = je.bind(null, D);
    return B.type = D, B;
  }, Lt.createRef = function() {
    return { current: null };
  }, Lt.forwardRef = function(D) {
    return { $$typeof: T, render: D };
  }, Lt.isValidElement = he, Lt.lazy = function(D) {
    return { $$typeof: z, _ctor: D, _status: -1, _result: null };
  }, Lt.memo = function(D, B) {
    return { $$typeof: I, type: D, compare: B === void 0 ? null : B };
  }, Lt.useCallback = function(D, B) {
    return Ge().useCallback(D, B);
  }, Lt.useContext = function(D, B) {
    return Ge().useContext(D, B);
  }, Lt.useDebugValue = function() {
  }, Lt.useEffect = function(D, B) {
    return Ge().useEffect(D, B);
  }, Lt.useImperativeHandle = function(D, B, ee) {
    return Ge().useImperativeHandle(D, B, ee);
  }, Lt.useLayoutEffect = function(D, B) {
    return Ge().useLayoutEffect(D, B);
  }, Lt.useMemo = function(D, B) {
    return Ge().useMemo(D, B);
  }, Lt.useReducer = function(D, B, ee) {
    return Ge().useReducer(D, B, ee);
  }, Lt.useRef = function(D) {
    return Ge().useRef(D);
  }, Lt.useState = function(D) {
    return Ge().useState(D);
  }, Lt.version = "16.14.0", Lt;
}
var Bt = {}, xb, $T;
function iO() {
  if ($T)
    return xb;
  $T = 1;
  var r = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return xb = r, xb;
}
var Cb, QT;
function rO() {
  return QT || (QT = 1, Cb = Function.call.bind(Object.prototype.hasOwnProperty)), Cb;
}
var Tb, ZT;
function zE() {
  if (ZT)
    return Tb;
  ZT = 1;
  var r = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var i = iO(), o = {}, c = rO();
    r = function(m) {
      var w = "Warning: " + m;
      typeof console < "u" && console.error(w);
      try {
        throw new Error(w);
      } catch {
      }
    };
  }
  function h(m, w, g, x, T) {
    if (process.env.NODE_ENV !== "production") {
      for (var A in m)
        if (c(m, A)) {
          var I;
          try {
            if (typeof m[A] != "function") {
              var z = Error(
                (x || "React class") + ": " + g + " type `" + A + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof m[A] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw z.name = "Invariant Violation", z;
            }
            I = m[A](w, A, x, g, null, i);
          } catch ($) {
            I = $;
          }
          if (I && !(I instanceof Error) && r(
            (x || "React class") + ": type specification of " + g + " `" + A + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof I + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), I instanceof Error && !(I.message in o)) {
            o[I.message] = !0;
            var F = T ? T() : "";
            r(
              "Failed " + g + " type: " + I.message + (F != null ? F : "")
            );
          }
        }
    }
  }
  return h.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (o = {});
  }, Tb = h, Tb;
}
/** @license React v16.14.0
 * react.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var YT;
function aO() {
  return YT || (YT = 1, process.env.NODE_ENV !== "production" && function() {
    var r = yg(), i = zE(), o = "16.14.0", c = typeof Symbol == "function" && Symbol.for, h = c ? Symbol.for("react.element") : 60103, m = c ? Symbol.for("react.portal") : 60106, w = c ? Symbol.for("react.fragment") : 60107, g = c ? Symbol.for("react.strict_mode") : 60108, x = c ? Symbol.for("react.profiler") : 60114, T = c ? Symbol.for("react.provider") : 60109, A = c ? Symbol.for("react.context") : 60110, I = c ? Symbol.for("react.concurrent_mode") : 60111, z = c ? Symbol.for("react.forward_ref") : 60112, F = c ? Symbol.for("react.suspense") : 60113, $ = c ? Symbol.for("react.suspense_list") : 60120, J = c ? Symbol.for("react.memo") : 60115, q = c ? Symbol.for("react.lazy") : 60116, de = c ? Symbol.for("react.block") : 60121, se = c ? Symbol.for("react.fundamental") : 60117, Z = c ? Symbol.for("react.responder") : 60118, ue = c ? Symbol.for("react.scope") : 60119, oe = typeof Symbol == "function" && Symbol.iterator, Le = "@@iterator";
    function Qe(M) {
      if (M === null || typeof M != "object")
        return null;
      var P = oe && M[oe] || M[Le];
      return typeof P == "function" ? P : null;
    }
    var je = {
      current: null
    }, Y = {
      suspense: null
    }, he = {
      current: null
    }, Ie = /^(.*)[\\\/]/;
    function ie(M, P, V) {
      var G = "";
      if (P) {
        var Se = P.fileName, Ye = Se.replace(Ie, "");
        if (/^index\./.test(Ye)) {
          var Be = Se.match(Ie);
          if (Be) {
            var et = Be[1];
            if (et) {
              var kt = et.replace(Ie, "");
              Ye = kt + "/" + Ye;
            }
          }
        }
        G = " (at " + Ye + ":" + P.lineNumber + ")";
      } else
        V && (G = " (created by " + V + ")");
      return `
    in ` + (M || "Unknown") + G;
    }
    var st = 1;
    function fe(M) {
      return M._status === st ? M._result : null;
    }
    function xe(M, P, V) {
      var G = P.displayName || P.name || "";
      return M.displayName || (G !== "" ? V + "(" + G + ")" : V);
    }
    function We(M) {
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
        case x:
          return "Profiler";
        case g:
          return "StrictMode";
        case F:
          return "Suspense";
        case $:
          return "SuspenseList";
      }
      if (typeof M == "object")
        switch (M.$$typeof) {
          case A:
            return "Context.Consumer";
          case T:
            return "Context.Provider";
          case z:
            return xe(M, M.render, "ForwardRef");
          case J:
            return We(M.type);
          case de:
            return We(M.render);
          case q: {
            var P = M, V = fe(P);
            if (V)
              return We(V);
            break;
          }
        }
      return null;
    }
    var Ce = {}, Ve = null;
    function Ne(M) {
      Ve = M;
    }
    Ce.getCurrentStack = null, Ce.getStackAddendum = function() {
      var M = "";
      if (Ve) {
        var P = We(Ve.type), V = Ve._owner;
        M += ie(P, Ve._source, V && We(V.type));
      }
      var G = Ce.getCurrentStack;
      return G && (M += G() || ""), M;
    };
    var $e = {
      current: !1
    }, bt = {
      ReactCurrentDispatcher: je,
      ReactCurrentBatchConfig: Y,
      ReactCurrentOwner: he,
      IsSomeRendererActing: $e,
      assign: r
    };
    r(bt, {
      ReactDebugCurrentFrame: Ce,
      ReactComponentTreeHook: {}
    });
    function Xt(M) {
      {
        for (var P = arguments.length, V = new Array(P > 1 ? P - 1 : 0), G = 1; G < P; G++)
          V[G - 1] = arguments[G];
        re("warn", M, V);
      }
    }
    function Ge(M) {
      {
        for (var P = arguments.length, V = new Array(P > 1 ? P - 1 : 0), G = 1; G < P; G++)
          V[G - 1] = arguments[G];
        re("error", M, V);
      }
    }
    function re(M, P, V) {
      {
        var G = V.length > 0 && typeof V[V.length - 1] == "string" && V[V.length - 1].indexOf(`
    in`) === 0;
        if (!G) {
          var Se = bt.ReactDebugCurrentFrame, Ye = Se.getStackAddendum();
          Ye !== "" && (P += "%s", V = V.concat([Ye]));
        }
        var Be = V.map(function(vn) {
          return "" + vn;
        });
        Be.unshift("Warning: " + P), Function.prototype.apply.call(console[M], console, Be);
        try {
          var et = 0, kt = "Warning: " + P.replace(/%s/g, function() {
            return V[et++];
          });
          throw new Error(kt);
        } catch {
        }
      }
    }
    var D = {};
    function B(M, P) {
      {
        var V = M.constructor, G = V && (V.displayName || V.name) || "ReactClass", Se = G + "." + P;
        if (D[Se])
          return;
        Ge("Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.", P, G), D[Se] = !0;
      }
    }
    var ee = {
      isMounted: function(M) {
        return !1;
      },
      enqueueForceUpdate: function(M, P, V) {
        B(M, "forceUpdate");
      },
      enqueueReplaceState: function(M, P, V, G) {
        B(M, "replaceState");
      },
      enqueueSetState: function(M, P, V, G) {
        B(M, "setState");
      }
    }, ye = {};
    Object.freeze(ye);
    function me(M, P, V) {
      this.props = M, this.context = P, this.refs = ye, this.updater = V || ee;
    }
    me.prototype.isReactComponent = {}, me.prototype.setState = function(M, P) {
      if (!(typeof M == "object" || typeof M == "function" || M == null))
        throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
      this.updater.enqueueSetState(this, M, P, "setState");
    }, me.prototype.forceUpdate = function(M) {
      this.updater.enqueueForceUpdate(this, M, "forceUpdate");
    };
    {
      var ot = {
        isMounted: ["isMounted", "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."],
        replaceState: ["replaceState", "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."]
      }, Ze = function(M, P) {
        Object.defineProperty(me.prototype, M, {
          get: function() {
            Xt("%s(...) is deprecated in plain JavaScript React classes. %s", P[0], P[1]);
          }
        });
      };
      for (var ze in ot)
        ot.hasOwnProperty(ze) && Ze(ze, ot[ze]);
    }
    function dt() {
    }
    dt.prototype = me.prototype;
    function Mt(M, P, V) {
      this.props = M, this.context = P, this.refs = ye, this.updater = V || ee;
    }
    var Wt = Mt.prototype = new dt();
    Wt.constructor = Mt, r(Wt, me.prototype), Wt.isPureReactComponent = !0;
    function St() {
      var M = {
        current: null
      };
      return Object.seal(M), M;
    }
    var Ln = Object.prototype.hasOwnProperty, Ft = {
      key: !0,
      ref: !0,
      __self: !0,
      __source: !0
    }, Bi, ji, Ae;
    Ae = {};
    function at(M) {
      if (Ln.call(M, "ref")) {
        var P = Object.getOwnPropertyDescriptor(M, "ref").get;
        if (P && P.isReactWarning)
          return !1;
      }
      return M.ref !== void 0;
    }
    function Fe(M) {
      if (Ln.call(M, "key")) {
        var P = Object.getOwnPropertyDescriptor(M, "key").get;
        if (P && P.isReactWarning)
          return !1;
      }
      return M.key !== void 0;
    }
    function Et(M, P) {
      var V = function() {
        Bi || (Bi = !0, Ge("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://fb.me/react-special-props)", P));
      };
      V.isReactWarning = !0, Object.defineProperty(M, "key", {
        get: V,
        configurable: !0
      });
    }
    function Si(M, P) {
      var V = function() {
        ji || (ji = !0, Ge("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://fb.me/react-special-props)", P));
      };
      V.isReactWarning = !0, Object.defineProperty(M, "ref", {
        get: V,
        configurable: !0
      });
    }
    function wn(M) {
      if (typeof M.ref == "string" && he.current && M.__self && he.current.stateNode !== M.__self) {
        var P = We(he.current.type);
        Ae[P] || (Ge('Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. This case cannot be automatically converted to an arrow function. We ask you to manually fix this case by using useRef() or createRef() instead. Learn more about using refs safely here: https://fb.me/react-strict-mode-string-ref', We(he.current.type), M.ref), Ae[P] = !0);
      }
    }
    var Yr = function(M, P, V, G, Se, Ye, Be) {
      var et = {
        $$typeof: h,
        type: M,
        key: P,
        ref: V,
        props: Be,
        _owner: Ye
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
        value: G
      }), Object.defineProperty(et, "_source", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: Se
      }), Object.freeze && (Object.freeze(et.props), Object.freeze(et)), et;
    };
    function Tr(M, P, V) {
      var G, Se = {}, Ye = null, Be = null, et = null, kt = null;
      if (P != null) {
        at(P) && (Be = P.ref, wn(P)), Fe(P) && (Ye = "" + P.key), et = P.__self === void 0 ? null : P.__self, kt = P.__source === void 0 ? null : P.__source;
        for (G in P)
          Ln.call(P, G) && !Ft.hasOwnProperty(G) && (Se[G] = P[G]);
      }
      var vn = arguments.length - 2;
      if (vn === 1)
        Se.children = V;
      else if (vn > 1) {
        for (var bn = Array(vn), Cn = 0; Cn < vn; Cn++)
          bn[Cn] = arguments[Cn + 2];
        Object.freeze && Object.freeze(bn), Se.children = bn;
      }
      if (M && M.defaultProps) {
        var ti = M.defaultProps;
        for (G in ti)
          Se[G] === void 0 && (Se[G] = ti[G]);
      }
      if (Ye || Be) {
        var ni = typeof M == "function" ? M.displayName || M.name || "Unknown" : M;
        Ye && Et(Se, ni), Be && Si(Se, ni);
      }
      return Yr(M, Ye, Be, et, kt, he.current, Se);
    }
    function Bn(M, P) {
      var V = Yr(M.type, P, M.ref, M._self, M._source, M._owner, M.props);
      return V;
    }
    function Gr(M, P, V) {
      if (M == null)
        throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + M + ".");
      var G, Se = r({}, M.props), Ye = M.key, Be = M.ref, et = M._self, kt = M._source, vn = M._owner;
      if (P != null) {
        at(P) && (Be = P.ref, vn = he.current), Fe(P) && (Ye = "" + P.key);
        var bn;
        M.type && M.type.defaultProps && (bn = M.type.defaultProps);
        for (G in P)
          Ln.call(P, G) && !Ft.hasOwnProperty(G) && (P[G] === void 0 && bn !== void 0 ? Se[G] = bn[G] : Se[G] = P[G]);
      }
      var Cn = arguments.length - 2;
      if (Cn === 1)
        Se.children = V;
      else if (Cn > 1) {
        for (var ti = Array(Cn), ni = 0; ni < Cn; ni++)
          ti[ni] = arguments[ni + 2];
        Se.children = ti;
      }
      return Yr(M.type, Ye, Be, et, kt, vn, Se);
    }
    function Ui(M) {
      return typeof M == "object" && M !== null && M.$$typeof === h;
    }
    var Ma = ".", Ea = ":";
    function ui(M) {
      var P = /[=:]/g, V = {
        "=": "=0",
        ":": "=2"
      }, G = ("" + M).replace(P, function(Se) {
        return V[Se];
      });
      return "$" + G;
    }
    var er = !1, ci = /\/+/g;
    function Ia(M) {
      return ("" + M).replace(ci, "$&/");
    }
    var xi = 10, Xr = [];
    function Cs(M, P, V, G) {
      if (Xr.length) {
        var Se = Xr.pop();
        return Se.result = M, Se.keyPrefix = P, Se.func = V, Se.context = G, Se.count = 0, Se;
      } else
        return {
          result: M,
          keyPrefix: P,
          func: V,
          context: G,
          count: 0
        };
    }
    function Mr(M) {
      M.result = null, M.keyPrefix = null, M.func = null, M.context = null, M.count = 0, Xr.length < xi && Xr.push(M);
    }
    function Er(M, P, V, G) {
      var Se = typeof M;
      (Se === "undefined" || Se === "boolean") && (M = null);
      var Ye = !1;
      if (M === null)
        Ye = !0;
      else
        switch (Se) {
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
        return V(
          G,
          M,
          P === "" ? Ma + Jn(M, 0) : P
        ), 1;
      var Be, et, kt = 0, vn = P === "" ? Ma : P + Ea;
      if (Array.isArray(M))
        for (var bn = 0; bn < M.length; bn++)
          Be = M[bn], et = vn + Jn(Be, bn), kt += Er(Be, et, V, G);
      else {
        var Cn = Qe(M);
        if (typeof Cn == "function") {
          Cn === M.entries && (er || Xt("Using Maps as children is deprecated and will be removed in a future major release. Consider converting children to an array of keyed ReactElements instead."), er = !0);
          for (var ti = Cn.call(M), ni, So = 0; !(ni = ti.next()).done; )
            Be = ni.value, et = vn + Jn(Be, So++), kt += Er(Be, et, V, G);
        } else if (Se === "object") {
          var ta = "";
          ta = " If you meant to render a collection of children, use an array instead." + Ce.getStackAddendum();
          var nr = "" + M;
          throw Error("Objects are not valid as a React child (found: " + (nr === "[object Object]" ? "object with keys {" + Object.keys(M).join(", ") + "}" : nr) + ")." + ta);
        }
      }
      return kt;
    }
    function mn(M, P, V) {
      return M == null ? 0 : Er(M, "", P, V);
    }
    function Jn(M, P) {
      return typeof M == "object" && M !== null && M.key != null ? ui(M.key) : P.toString(36);
    }
    function Aa(M, P, V) {
      var G = M.func, Se = M.context;
      G.call(Se, P, M.count++);
    }
    function Pt(M, P, V) {
      if (M == null)
        return M;
      var G = Cs(null, null, P, V);
      mn(M, Aa, G), Mr(G);
    }
    function nn(M, P, V) {
      var G = M.result, Se = M.keyPrefix, Ye = M.func, Be = M.context, et = Ye.call(Be, P, M.count++);
      Array.isArray(et) ? Ci(et, G, V, function(kt) {
        return kt;
      }) : et != null && (Ui(et) && (et = Bn(
        et,
        Se + (et.key && (!P || P.key !== et.key) ? Ia(et.key) + "/" : "") + V
      )), G.push(et));
    }
    function Ci(M, P, V, G, Se) {
      var Ye = "";
      V != null && (Ye = Ia(V) + "/");
      var Be = Cs(P, Ye, G, Se);
      mn(M, nn, Be), Mr(Be);
    }
    function Dn(M, P, V) {
      if (M == null)
        return M;
      var G = [];
      return Ci(M, G, null, P, V), G;
    }
    function Ti(M) {
      return mn(M, function() {
        return null;
      }, null);
    }
    function qn(M) {
      var P = [];
      return Ci(M, P, null, function(V) {
        return V;
      }), P;
    }
    function Jr(M) {
      if (!Ui(M))
        throw Error("React.Children.only expected to receive a single React element child.");
      return M;
    }
    function Ra(M, P) {
      P === void 0 ? P = null : P !== null && typeof P != "function" && Ge("createContext: Expected the optional second argument to be a function. Instead received: %s", P);
      var V = {
        $$typeof: A,
        _calculateChangedBits: P,
        _currentValue: M,
        _currentValue2: M,
        _threadCount: 0,
        Provider: null,
        Consumer: null
      };
      V.Provider = {
        $$typeof: T,
        _context: V
      };
      var G = !1, Se = !1;
      {
        var Ye = {
          $$typeof: A,
          _context: V,
          _calculateChangedBits: V._calculateChangedBits
        };
        Object.defineProperties(Ye, {
          Provider: {
            get: function() {
              return Se || (Se = !0, Ge("Rendering <Context.Consumer.Provider> is not supported and will be removed in a future major release. Did you mean to render <Context.Provider> instead?")), V.Provider;
            },
            set: function(Be) {
              V.Provider = Be;
            }
          },
          _currentValue: {
            get: function() {
              return V._currentValue;
            },
            set: function(Be) {
              V._currentValue = Be;
            }
          },
          _currentValue2: {
            get: function() {
              return V._currentValue2;
            },
            set: function(Be) {
              V._currentValue2 = Be;
            }
          },
          _threadCount: {
            get: function() {
              return V._threadCount;
            },
            set: function(Be) {
              V._threadCount = Be;
            }
          },
          Consumer: {
            get: function() {
              return G || (G = !0, Ge("Rendering <Context.Consumer.Consumer> is not supported and will be removed in a future major release. Did you mean to render <Context.Consumer> instead?")), V.Consumer;
            }
          }
        }), V.Consumer = Ye;
      }
      return V._currentRenderer = null, V._currentRenderer2 = null, V;
    }
    function yo(M) {
      var P = {
        $$typeof: q,
        _ctor: M,
        _status: -1,
        _result: null
      };
      {
        var V, G;
        Object.defineProperties(P, {
          defaultProps: {
            configurable: !0,
            get: function() {
              return V;
            },
            set: function(Se) {
              Ge("React.lazy(...): It is not supported to assign `defaultProps` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it."), V = Se, Object.defineProperty(P, "defaultProps", {
                enumerable: !0
              });
            }
          },
          propTypes: {
            configurable: !0,
            get: function() {
              return G;
            },
            set: function(Se) {
              Ge("React.lazy(...): It is not supported to assign `propTypes` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it."), G = Se, Object.defineProperty(P, "propTypes", {
                enumerable: !0
              });
            }
          }
        });
      }
      return P;
    }
    function wo(M) {
      return M != null && M.$$typeof === J ? Ge("forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...)).") : typeof M != "function" ? Ge("forwardRef requires a render function but was given %s.", M === null ? "null" : typeof M) : M.length !== 0 && M.length !== 2 && Ge("forwardRef render functions accept exactly two parameters: props and ref. %s", M.length === 1 ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined."), M != null && (M.defaultProps != null || M.propTypes != null) && Ge("forwardRef render functions do not support propTypes or defaultProps. Did you accidentally pass a React component?"), {
        $$typeof: z,
        render: M
      };
    }
    function Ts(M) {
      return typeof M == "string" || typeof M == "function" || M === w || M === I || M === x || M === g || M === F || M === $ || typeof M == "object" && M !== null && (M.$$typeof === q || M.$$typeof === J || M.$$typeof === T || M.$$typeof === A || M.$$typeof === z || M.$$typeof === se || M.$$typeof === Z || M.$$typeof === ue || M.$$typeof === de);
    }
    function Da(M, P) {
      return Ts(M) || Ge("memo: The first argument must be a component. Instead received: %s", M === null ? "null" : typeof M), {
        $$typeof: J,
        type: M,
        compare: P === void 0 ? null : P
      };
    }
    function Nn() {
      var M = je.current;
      if (M === null)
        throw Error(`Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
1. You might have mismatching versions of React and the renderer (such as React DOM)
2. You might be breaking the Rules of Hooks
3. You might have more than one copy of React in the same app
See https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem.`);
      return M;
    }
    function Ir(M, P) {
      var V = Nn();
      if (P !== void 0 && Ge("useContext() second argument is reserved for future use in React. Passing it is not supported. You passed: %s.%s", P, typeof P == "number" && Array.isArray(arguments[2]) ? `

Did you call array.map(useContext)? Calling Hooks inside a loop is not supported. Learn more at https://fb.me/rules-of-hooks` : ""), M._context !== void 0) {
        var G = M._context;
        G.Consumer === M ? Ge("Calling useContext(Context.Consumer) is not supported, may cause bugs, and will be removed in a future major release. Did you mean to call useContext(Context) instead?") : G.Provider === M && Ge("Calling useContext(Context.Provider) is not supported. Did you mean to call useContext(Context) instead?");
      }
      return V.useContext(M, P);
    }
    function qr(M) {
      var P = Nn();
      return P.useState(M);
    }
    function Kn(M, P, V) {
      var G = Nn();
      return G.useReducer(M, P, V);
    }
    function Ar(M) {
      var P = Nn();
      return P.useRef(M);
    }
    function jn(M, P) {
      var V = Nn();
      return V.useEffect(M, P);
    }
    function tr(M, P) {
      var V = Nn();
      return V.useLayoutEffect(M, P);
    }
    function Ms(M, P) {
      var V = Nn();
      return V.useCallback(M, P);
    }
    function Kr(M, P) {
      var V = Nn();
      return V.useMemo(M, P);
    }
    function Es(M, P, V) {
      var G = Nn();
      return G.useImperativeHandle(M, P, V);
    }
    function ne(M, P) {
      {
        var V = Nn();
        return V.useDebugValue(M, P);
      }
    }
    var ce;
    ce = !1;
    function Xe() {
      if (he.current) {
        var M = We(he.current.type);
        if (M)
          return `

Check the render method of \`` + M + "`.";
      }
      return "";
    }
    function pt(M) {
      if (M !== void 0) {
        var P = M.fileName.replace(/^.*[\\\/]/, ""), V = M.lineNumber;
        return `

Check your code at ` + P + ":" + V + ".";
      }
      return "";
    }
    function Jt(M) {
      return M != null ? pt(M.__source) : "";
    }
    var Zt = {};
    function fn(M) {
      var P = Xe();
      if (!P) {
        var V = typeof M == "string" ? M : M.displayName || M.name;
        V && (P = `

Check the top-level render call using <` + V + ">.");
      }
      return P;
    }
    function ei(M, P) {
      if (!(!M._store || M._store.validated || M.key != null)) {
        M._store.validated = !0;
        var V = fn(P);
        if (!Zt[V]) {
          Zt[V] = !0;
          var G = "";
          M && M._owner && M._owner !== he.current && (G = " It was passed a child from " + We(M._owner.type) + "."), Ne(M), Ge('Each child in a list should have a unique "key" prop.%s%s See https://fb.me/react-warning-keys for more information.', V, G), Ne(null);
        }
      }
    }
    function qt(M, P) {
      if (typeof M == "object") {
        if (Array.isArray(M))
          for (var V = 0; V < M.length; V++) {
            var G = M[V];
            Ui(G) && ei(G, P);
          }
        else if (Ui(M))
          M._store && (M._store.validated = !0);
        else if (M) {
          var Se = Qe(M);
          if (typeof Se == "function" && Se !== M.entries)
            for (var Ye = Se.call(M), Be; !(Be = Ye.next()).done; )
              Ui(Be.value) && ei(Be.value, P);
        }
      }
    }
    function Na(M) {
      {
        var P = M.type;
        if (P == null || typeof P == "string")
          return;
        var V = We(P), G;
        if (typeof P == "function")
          G = P.propTypes;
        else if (typeof P == "object" && (P.$$typeof === z || P.$$typeof === J))
          G = P.propTypes;
        else
          return;
        G ? (Ne(M), i(G, M.props, "prop", V, Ce.getStackAddendum), Ne(null)) : P.PropTypes !== void 0 && !ce && (ce = !0, Ge("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", V || "Unknown")), typeof P.getDefaultProps == "function" && !P.getDefaultProps.isReactClassApproved && Ge("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
      }
    }
    function bo(M) {
      {
        Ne(M);
        for (var P = Object.keys(M.props), V = 0; V < P.length; V++) {
          var G = P[V];
          if (G !== "children" && G !== "key") {
            Ge("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", G);
            break;
          }
        }
        M.ref !== null && Ge("Invalid attribute `ref` supplied to `React.Fragment`."), Ne(null);
      }
    }
    function rn(M, P, V) {
      var G = Ts(M);
      if (!G) {
        var Se = "";
        (M === void 0 || typeof M == "object" && M !== null && Object.keys(M).length === 0) && (Se += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");
        var Ye = Jt(P);
        Ye ? Se += Ye : Se += Xe();
        var Be;
        M === null ? Be = "null" : Array.isArray(M) ? Be = "array" : M !== void 0 && M.$$typeof === h ? (Be = "<" + (We(M.type) || "Unknown") + " />", Se = " Did you accidentally export a JSX literal instead of a component?") : Be = typeof M, Ge("React.createElement: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", Be, Se);
      }
      var et = Tr.apply(this, arguments);
      if (et == null)
        return et;
      if (G)
        for (var kt = 2; kt < arguments.length; kt++)
          qt(arguments[kt], M);
      return M === w ? bo(et) : Na(et), et;
    }
    var hn = !1;
    function Is(M) {
      var P = rn.bind(null, M);
      return P.type = M, hn || (hn = !0, Xt("React.createFactory() is deprecated and will be removed in a future major release. Consider using JSX or use React.createElement() directly instead.")), Object.defineProperty(P, "type", {
        enumerable: !1,
        get: function() {
          return Xt("Factory.type is deprecated. Access the class directly before passing it to createFactory."), Object.defineProperty(this, "type", {
            value: M
          }), M;
        }
      }), P;
    }
    function fl(M, P, V) {
      for (var G = Gr.apply(this, arguments), Se = 2; Se < arguments.length; Se++)
        qt(arguments[Se], G.type);
      return Na(G), G;
    }
    try {
      var ea = Object.freeze({}), hl = /* @__PURE__ */ new Map([[ea, null]]), Lu = /* @__PURE__ */ new Set([ea]);
      hl.set(0, 0), Lu.add(0);
    } catch {
    }
    var As = rn, pl = fl, Bu = Is, ml = {
      map: Dn,
      forEach: Pt,
      count: Ti,
      toArray: qn,
      only: Jr
    };
    Bt.Children = ml, Bt.Component = me, Bt.Fragment = w, Bt.Profiler = x, Bt.PureComponent = Mt, Bt.StrictMode = g, Bt.Suspense = F, Bt.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = bt, Bt.cloneElement = pl, Bt.createContext = Ra, Bt.createElement = As, Bt.createFactory = Bu, Bt.createRef = St, Bt.forwardRef = wo, Bt.isValidElement = Ui, Bt.lazy = yo, Bt.memo = Da, Bt.useCallback = Ms, Bt.useContext = Ir, Bt.useDebugValue = ne, Bt.useEffect = jn, Bt.useImperativeHandle = Es, Bt.useLayoutEffect = tr, Bt.useMemo = Kr, Bt.useReducer = Kn, Bt.useRef = Ar, Bt.useState = qr, Bt.version = o;
  }()), Bt;
}
(function(r) {
  process.env.NODE_ENV === "production" ? r.exports = nO() : r.exports = aO();
})(dl);
const yt = /* @__PURE__ */ _E(dl.exports);
var OE = { exports: {} }, br = {}, Mb = { exports: {} }, Eb = {};
/** @license React v0.19.1
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var GT;
function sO() {
  return GT || (GT = 1, function(r) {
    var i, o, c, h, m;
    if (typeof window > "u" || typeof MessageChannel != "function") {
      var w = null, g = null, x = function() {
        if (w !== null)
          try {
            var re = r.unstable_now();
            w(!0, re), w = null;
          } catch (D) {
            throw setTimeout(x, 0), D;
          }
      }, T = Date.now();
      r.unstable_now = function() {
        return Date.now() - T;
      }, i = function(re) {
        w !== null ? setTimeout(i, 0, re) : (w = re, setTimeout(x, 0));
      }, o = function(re, D) {
        g = setTimeout(re, D);
      }, c = function() {
        clearTimeout(g);
      }, h = function() {
        return !1;
      }, m = r.unstable_forceFrameRate = function() {
      };
    } else {
      var A = window.performance, I = window.Date, z = window.setTimeout, F = window.clearTimeout;
      if (typeof console < "u") {
        var $ = window.cancelAnimationFrame;
        typeof window.requestAnimationFrame != "function" && console.error("This browser doesn't support requestAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"), typeof $ != "function" && console.error("This browser doesn't support cancelAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills");
      }
      if (typeof A == "object" && typeof A.now == "function")
        r.unstable_now = function() {
          return A.now();
        };
      else {
        var J = I.now();
        r.unstable_now = function() {
          return I.now() - J;
        };
      }
      var q = !1, de = null, se = -1, Z = 5, ue = 0;
      h = function() {
        return r.unstable_now() >= ue;
      }, m = function() {
      }, r.unstable_forceFrameRate = function(re) {
        0 > re || 125 < re ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing framerates higher than 125 fps is not unsupported") : Z = 0 < re ? Math.floor(1e3 / re) : 5;
      };
      var oe = new MessageChannel(), Le = oe.port2;
      oe.port1.onmessage = function() {
        if (de !== null) {
          var re = r.unstable_now();
          ue = re + Z;
          try {
            de(!0, re) ? Le.postMessage(null) : (q = !1, de = null);
          } catch (D) {
            throw Le.postMessage(null), D;
          }
        } else
          q = !1;
      }, i = function(re) {
        de = re, q || (q = !0, Le.postMessage(null));
      }, o = function(re, D) {
        se = z(function() {
          re(r.unstable_now());
        }, D);
      }, c = function() {
        F(se), se = -1;
      };
    }
    function Qe(re, D) {
      var B = re.length;
      re.push(D);
      e:
        for (; ; ) {
          var ee = B - 1 >>> 1, ye = re[ee];
          if (ye !== void 0 && 0 < he(ye, D))
            re[ee] = D, re[B] = ye, B = ee;
          else
            break e;
        }
    }
    function je(re) {
      return re = re[0], re === void 0 ? null : re;
    }
    function Y(re) {
      var D = re[0];
      if (D !== void 0) {
        var B = re.pop();
        if (B !== D) {
          re[0] = B;
          e:
            for (var ee = 0, ye = re.length; ee < ye; ) {
              var me = 2 * (ee + 1) - 1, ot = re[me], Ze = me + 1, ze = re[Ze];
              if (ot !== void 0 && 0 > he(ot, B))
                ze !== void 0 && 0 > he(ze, ot) ? (re[ee] = ze, re[Ze] = B, ee = Ze) : (re[ee] = ot, re[me] = B, ee = me);
              else if (ze !== void 0 && 0 > he(ze, B))
                re[ee] = ze, re[Ze] = B, ee = Ze;
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
    var Ie = [], ie = [], st = 1, fe = null, xe = 3, We = !1, Ce = !1, Ve = !1;
    function Ne(re) {
      for (var D = je(ie); D !== null; ) {
        if (D.callback === null)
          Y(ie);
        else if (D.startTime <= re)
          Y(ie), D.sortIndex = D.expirationTime, Qe(Ie, D);
        else
          break;
        D = je(ie);
      }
    }
    function $e(re) {
      if (Ve = !1, Ne(re), !Ce)
        if (je(Ie) !== null)
          Ce = !0, i(bt);
        else {
          var D = je(ie);
          D !== null && o($e, D.startTime - re);
        }
    }
    function bt(re, D) {
      Ce = !1, Ve && (Ve = !1, c()), We = !0;
      var B = xe;
      try {
        for (Ne(D), fe = je(Ie); fe !== null && (!(fe.expirationTime > D) || re && !h()); ) {
          var ee = fe.callback;
          if (ee !== null) {
            fe.callback = null, xe = fe.priorityLevel;
            var ye = ee(fe.expirationTime <= D);
            D = r.unstable_now(), typeof ye == "function" ? fe.callback = ye : fe === je(Ie) && Y(Ie), Ne(D);
          } else
            Y(Ie);
          fe = je(Ie);
        }
        if (fe !== null)
          var me = !0;
        else {
          var ot = je(ie);
          ot !== null && o($e, ot.startTime - D), me = !1;
        }
        return me;
      } finally {
        fe = null, xe = B, We = !1;
      }
    }
    function Xt(re) {
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
      Ce || We || (Ce = !0, i(bt));
    }, r.unstable_getCurrentPriorityLevel = function() {
      return xe;
    }, r.unstable_getFirstCallbackNode = function() {
      return je(Ie);
    }, r.unstable_next = function(re) {
      switch (xe) {
        case 1:
        case 2:
        case 3:
          var D = 3;
          break;
        default:
          D = xe;
      }
      var B = xe;
      xe = D;
      try {
        return re();
      } finally {
        xe = B;
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
      var B = xe;
      xe = re;
      try {
        return D();
      } finally {
        xe = B;
      }
    }, r.unstable_scheduleCallback = function(re, D, B) {
      var ee = r.unstable_now();
      if (typeof B == "object" && B !== null) {
        var ye = B.delay;
        ye = typeof ye == "number" && 0 < ye ? ee + ye : ee, B = typeof B.timeout == "number" ? B.timeout : Xt(re);
      } else
        B = Xt(re), ye = ee;
      return B = ye + B, re = { id: st++, callback: D, priorityLevel: re, startTime: ye, expirationTime: B, sortIndex: -1 }, ye > ee ? (re.sortIndex = ye, Qe(ie, re), je(Ie) === null && re === je(ie) && (Ve ? c() : Ve = !0, o($e, ye - ee))) : (re.sortIndex = B, Qe(Ie, re), Ce || We || (Ce = !0, i(bt))), re;
    }, r.unstable_shouldYield = function() {
      var re = r.unstable_now();
      Ne(re);
      var D = je(Ie);
      return D !== fe && fe !== null && D !== null && D.callback !== null && D.startTime <= re && D.expirationTime < fe.expirationTime || h();
    }, r.unstable_wrapCallback = function(re) {
      var D = xe;
      return function() {
        var B = xe;
        xe = D;
        try {
          return re.apply(this, arguments);
        } finally {
          xe = B;
        }
      };
    };
  }(Eb)), Eb;
}
var Ib = {};
/** @license React v0.19.1
 * scheduler.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var XT;
function oO() {
  return XT || (XT = 1, function(r) {
    process.env.NODE_ENV !== "production" && function() {
      var i = !1, o = !0, c, h, m, w, g;
      if (typeof window > "u" || typeof MessageChannel != "function") {
        var x = null, T = null, A = function() {
          if (x !== null)
            try {
              var ne = r.unstable_now(), ce = !0;
              x(ce, ne), x = null;
            } catch (Xe) {
              throw setTimeout(A, 0), Xe;
            }
        }, I = Date.now();
        r.unstable_now = function() {
          return Date.now() - I;
        }, c = function(ne) {
          x !== null ? setTimeout(c, 0, ne) : (x = ne, setTimeout(A, 0));
        }, h = function(ne, ce) {
          T = setTimeout(ne, ce);
        }, m = function() {
          clearTimeout(T);
        }, w = function() {
          return !1;
        }, g = r.unstable_forceFrameRate = function() {
        };
      } else {
        var z = window.performance, F = window.Date, $ = window.setTimeout, J = window.clearTimeout;
        if (typeof console < "u") {
          var q = window.requestAnimationFrame, de = window.cancelAnimationFrame;
          typeof q != "function" && console.error("This browser doesn't support requestAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"), typeof de != "function" && console.error("This browser doesn't support cancelAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills");
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
        var Z = !1, ue = null, oe = -1, Le = 5, Qe = 0;
        w = function() {
          return r.unstable_now() >= Qe;
        }, g = function() {
        }, r.unstable_forceFrameRate = function(ne) {
          if (ne < 0 || ne > 125) {
            console.error("forceFrameRate takes a positive int between 0 and 125, forcing framerates higher than 125 fps is not unsupported");
            return;
          }
          ne > 0 ? Le = Math.floor(1e3 / ne) : Le = 5;
        };
        var je = function() {
          if (ue !== null) {
            var ne = r.unstable_now();
            Qe = ne + Le;
            var ce = !0;
            try {
              var Xe = ue(ce, ne);
              Xe ? he.postMessage(null) : (Z = !1, ue = null);
            } catch (pt) {
              throw he.postMessage(null), pt;
            }
          } else
            Z = !1;
        }, Y = new MessageChannel(), he = Y.port2;
        Y.port1.onmessage = je, c = function(ne) {
          ue = ne, Z || (Z = !0, he.postMessage(null));
        }, h = function(ne, ce) {
          oe = $(function() {
            ne(r.unstable_now());
          }, ce);
        }, m = function() {
          J(oe), oe = -1;
        };
      }
      function Ie(ne, ce) {
        var Xe = ne.length;
        ne.push(ce), fe(ne, ce, Xe);
      }
      function ie(ne) {
        var ce = ne[0];
        return ce === void 0 ? null : ce;
      }
      function st(ne) {
        var ce = ne[0];
        if (ce !== void 0) {
          var Xe = ne.pop();
          return Xe !== ce && (ne[0] = Xe, xe(ne, Xe, 0)), ce;
        } else
          return null;
      }
      function fe(ne, ce, Xe) {
        for (var pt = Xe; ; ) {
          var Jt = pt - 1 >>> 1, Zt = ne[Jt];
          if (Zt !== void 0 && We(Zt, ce) > 0)
            ne[Jt] = ce, ne[pt] = Zt, pt = Jt;
          else
            return;
        }
      }
      function xe(ne, ce, Xe) {
        for (var pt = Xe, Jt = ne.length; pt < Jt; ) {
          var Zt = (pt + 1) * 2 - 1, fn = ne[Zt], ei = Zt + 1, qt = ne[ei];
          if (fn !== void 0 && We(fn, ce) < 0)
            qt !== void 0 && We(qt, fn) < 0 ? (ne[pt] = qt, ne[ei] = ce, pt = ei) : (ne[pt] = fn, ne[Zt] = ce, pt = Zt);
          else if (qt !== void 0 && We(qt, ce) < 0)
            ne[pt] = qt, ne[ei] = ce, pt = ei;
          else
            return;
        }
      }
      function We(ne, ce) {
        var Xe = ne.sortIndex - ce.sortIndex;
        return Xe !== 0 ? Xe : ne.id - ce.id;
      }
      var Ce = 0, Ve = 1, Ne = 2, $e = 3, bt = 4, Xt = 5, Ge = 0, re = 0, D = 4, B = typeof SharedArrayBuffer == "function" ? new SharedArrayBuffer(D * Int32Array.BYTES_PER_ELEMENT) : typeof ArrayBuffer == "function" ? new ArrayBuffer(D * Int32Array.BYTES_PER_ELEMENT) : null, ee = B !== null ? new Int32Array(B) : [], ye = 0, me = 1, ot = 2, Ze = 3;
      ee[ye] = Ce, ee[Ze] = 0, ee[me] = 0;
      var ze = 131072, dt = 524288, Mt = 0, Wt = null, St = null, Ln = 0, Ft = 1, Bi = 2, ji = 3, Ae = 4, at = 5, Fe = 6, Et = 7, Si = 8;
      function wn(ne) {
        if (St !== null) {
          var ce = Ln;
          if (Ln += ne.length, Ln + 1 > Mt) {
            if (Mt *= 2, Mt > dt) {
              console.error("Scheduler Profiling: Event log exceeded maximum size. Don't forget to call `stopLoggingProfilingEvents()`."), Tr();
              return;
            }
            var Xe = new Int32Array(Mt * 4);
            Xe.set(St), Wt = Xe.buffer, St = Xe;
          }
          St.set(ne, ce);
        }
      }
      function Yr() {
        Mt = ze, Wt = new ArrayBuffer(Mt * 4), St = new Int32Array(Wt), Ln = 0;
      }
      function Tr() {
        var ne = Wt;
        return Mt = 0, Wt = null, St = null, Ln = 0, ne;
      }
      function Bn(ne, ce) {
        ee[Ze]++, St !== null && wn([Ft, ce * 1e3, ne.id, ne.priorityLevel]);
      }
      function Gr(ne, ce) {
        ee[ye] = Ce, ee[me] = 0, ee[Ze]--, St !== null && wn([Bi, ce * 1e3, ne.id]);
      }
      function Ui(ne, ce) {
        ee[Ze]--, St !== null && wn([Ae, ce * 1e3, ne.id]);
      }
      function Ma(ne, ce) {
        ee[ye] = Ce, ee[me] = 0, ee[Ze]--, St !== null && wn([ji, ce * 1e3, ne.id]);
      }
      function Ea(ne, ce) {
        Ge++, ee[ye] = ne.priorityLevel, ee[me] = ne.id, ee[ot] = Ge, St !== null && wn([at, ce * 1e3, ne.id, Ge]);
      }
      function ui(ne, ce) {
        ee[ye] = Ce, ee[me] = 0, ee[ot] = 0, St !== null && wn([Fe, ce * 1e3, ne.id, Ge]);
      }
      function er(ne) {
        re++, St !== null && wn([Et, ne * 1e3, re]);
      }
      function ci(ne) {
        St !== null && wn([Si, ne * 1e3, re]);
      }
      var Ia = 1073741823, xi = -1, Xr = 250, Cs = 5e3, Mr = 1e4, Er = Ia, mn = [], Jn = [], Aa = 1, Pt = null, nn = $e, Ci = !1, Dn = !1, Ti = !1;
      function qn(ne) {
        for (var ce = ie(Jn); ce !== null; ) {
          if (ce.callback === null)
            st(Jn);
          else if (ce.startTime <= ne)
            st(Jn), ce.sortIndex = ce.expirationTime, Ie(mn, ce), Bn(ce, ne), ce.isQueued = !0;
          else
            return;
          ce = ie(Jn);
        }
      }
      function Jr(ne) {
        if (Ti = !1, qn(ne), !Dn)
          if (ie(mn) !== null)
            Dn = !0, c(Ra);
          else {
            var ce = ie(Jn);
            ce !== null && h(Jr, ce.startTime - ne);
          }
      }
      function Ra(ne, ce) {
        ci(ce), Dn = !1, Ti && (Ti = !1, m()), Ci = !0;
        var Xe = nn;
        try {
          if (o)
            try {
              return yo(ne, ce);
            } catch (Zt) {
              if (Pt !== null) {
                var pt = r.unstable_now();
                Ma(Pt, pt), Pt.isQueued = !1;
              }
              throw Zt;
            }
        } finally {
          Pt = null, nn = Xe, Ci = !1;
          {
            var Jt = r.unstable_now();
            er(Jt);
          }
        }
      }
      function yo(ne, ce) {
        var Xe = ce;
        for (qn(Xe), Pt = ie(mn); Pt !== null && !i && !(Pt.expirationTime > Xe && (!ne || w())); ) {
          var pt = Pt.callback;
          if (pt !== null) {
            Pt.callback = null, nn = Pt.priorityLevel;
            var Jt = Pt.expirationTime <= Xe;
            Ea(Pt, Xe);
            var Zt = pt(Jt);
            Xe = r.unstable_now(), typeof Zt == "function" ? (Pt.callback = Zt, ui(Pt, Xe)) : (Gr(Pt, Xe), Pt.isQueued = !1, Pt === ie(mn) && st(mn)), qn(Xe);
          } else
            st(mn);
          Pt = ie(mn);
        }
        if (Pt !== null)
          return !0;
        var fn = ie(Jn);
        return fn !== null && h(Jr, fn.startTime - Xe), !1;
      }
      function wo(ne, ce) {
        switch (ne) {
          case Ve:
          case Ne:
          case $e:
          case bt:
          case Xt:
            break;
          default:
            ne = $e;
        }
        var Xe = nn;
        nn = ne;
        try {
          return ce();
        } finally {
          nn = Xe;
        }
      }
      function Ts(ne) {
        var ce;
        switch (nn) {
          case Ve:
          case Ne:
          case $e:
            ce = $e;
            break;
          default:
            ce = nn;
            break;
        }
        var Xe = nn;
        nn = ce;
        try {
          return ne();
        } finally {
          nn = Xe;
        }
      }
      function Da(ne) {
        var ce = nn;
        return function() {
          var Xe = nn;
          nn = ce;
          try {
            return ne.apply(this, arguments);
          } finally {
            nn = Xe;
          }
        };
      }
      function Nn(ne) {
        switch (ne) {
          case Ve:
            return xi;
          case Ne:
            return Xr;
          case Xt:
            return Er;
          case bt:
            return Mr;
          case $e:
          default:
            return Cs;
        }
      }
      function Ir(ne, ce, Xe) {
        var pt = r.unstable_now(), Jt, Zt;
        if (typeof Xe == "object" && Xe !== null) {
          var fn = Xe.delay;
          typeof fn == "number" && fn > 0 ? Jt = pt + fn : Jt = pt, Zt = typeof Xe.timeout == "number" ? Xe.timeout : Nn(ne);
        } else
          Zt = Nn(ne), Jt = pt;
        var ei = Jt + Zt, qt = {
          id: Aa++,
          callback: ce,
          priorityLevel: ne,
          startTime: Jt,
          expirationTime: ei,
          sortIndex: -1
        };
        return qt.isQueued = !1, Jt > pt ? (qt.sortIndex = Jt, Ie(Jn, qt), ie(mn) === null && qt === ie(Jn) && (Ti ? m() : Ti = !0, h(Jr, Jt - pt))) : (qt.sortIndex = ei, Ie(mn, qt), Bn(qt, pt), qt.isQueued = !0, !Dn && !Ci && (Dn = !0, c(Ra))), qt;
      }
      function qr() {
      }
      function Kn() {
        !Dn && !Ci && (Dn = !0, c(Ra));
      }
      function Ar() {
        return ie(mn);
      }
      function jn(ne) {
        if (ne.isQueued) {
          var ce = r.unstable_now();
          Ui(ne, ce), ne.isQueued = !1;
        }
        ne.callback = null;
      }
      function tr() {
        return nn;
      }
      function Ms() {
        var ne = r.unstable_now();
        qn(ne);
        var ce = ie(mn);
        return ce !== Pt && Pt !== null && ce !== null && ce.callback !== null && ce.startTime <= ne && ce.expirationTime < Pt.expirationTime || w();
      }
      var Kr = g, Es = {
        startLoggingProfilingEvents: Yr,
        stopLoggingProfilingEvents: Tr,
        sharedProfilingBuffer: B
      };
      r.unstable_IdlePriority = Xt, r.unstable_ImmediatePriority = Ve, r.unstable_LowPriority = bt, r.unstable_NormalPriority = $e, r.unstable_Profiling = Es, r.unstable_UserBlockingPriority = Ne, r.unstable_cancelCallback = jn, r.unstable_continueExecution = Kn, r.unstable_getCurrentPriorityLevel = tr, r.unstable_getFirstCallbackNode = Ar, r.unstable_next = Ts, r.unstable_pauseExecution = qr, r.unstable_requestPaint = Kr, r.unstable_runWithPriority = wo, r.unstable_scheduleCallback = Ir, r.unstable_shouldYield = Ms, r.unstable_wrapCallback = Da;
    }();
  }(Ib)), Ib;
}
var JT;
function LE() {
  return JT || (JT = 1, function(r) {
    process.env.NODE_ENV === "production" ? r.exports = sO() : r.exports = oO();
  }(Mb)), Mb.exports;
}
/** @license React v16.14.0
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var qT;
function lO() {
  if (qT)
    return br;
  qT = 1;
  var r = dl.exports, i = yg(), o = LE();
  function c(n) {
    for (var a = "https://reactjs.org/docs/error-decoder.html?invariant=" + n, u = 1; u < arguments.length; u++)
      a += "&args[]=" + encodeURIComponent(arguments[u]);
    return "Minified React error #" + n + "; visit " + a + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  if (!r)
    throw Error(c(227));
  function h(n, a, u, f, v, S, C, R, H) {
    var U = Array.prototype.slice.call(arguments, 3);
    try {
      a.apply(u, U);
    } catch (Me) {
      this.onError(Me);
    }
  }
  var m = !1, w = null, g = !1, x = null, T = { onError: function(n) {
    m = !0, w = n;
  } };
  function A(n, a, u, f, v, S, C, R, H) {
    m = !1, w = null, h.apply(T, arguments);
  }
  function I(n, a, u, f, v, S, C, R, H) {
    if (A.apply(this, arguments), m) {
      if (m) {
        var U = w;
        m = !1, w = null;
      } else
        throw Error(c(198));
      g || (g = !0, x = U);
    }
  }
  var z = null, F = null, $ = null;
  function J(n, a, u) {
    var f = n.type || "unknown-event";
    n.currentTarget = $(u), I(f, a, void 0, n), n.currentTarget = null;
  }
  var q = null, de = {};
  function se() {
    if (q)
      for (var n in de) {
        var a = de[n], u = q.indexOf(n);
        if (!(-1 < u))
          throw Error(c(96, n));
        if (!ue[u]) {
          if (!a.extractEvents)
            throw Error(c(97, n));
          ue[u] = a, u = a.eventTypes;
          for (var f in u) {
            var v = void 0, S = u[f], C = a, R = f;
            if (oe.hasOwnProperty(R))
              throw Error(c(99, R));
            oe[R] = S;
            var H = S.phasedRegistrationNames;
            if (H) {
              for (v in H)
                H.hasOwnProperty(v) && Z(H[v], C, R);
              v = !0;
            } else
              S.registrationName ? (Z(S.registrationName, C, R), v = !0) : v = !1;
            if (!v)
              throw Error(c(98, f, n));
          }
        }
      }
  }
  function Z(n, a, u) {
    if (Le[n])
      throw Error(c(100, n));
    Le[n] = a, Qe[n] = a.eventTypes[u].dependencies;
  }
  var ue = [], oe = {}, Le = {}, Qe = {};
  function je(n) {
    var a = !1, u;
    for (u in n)
      if (n.hasOwnProperty(u)) {
        var f = n[u];
        if (!de.hasOwnProperty(u) || de[u] !== f) {
          if (de[u])
            throw Error(c(102, u));
          de[u] = f, a = !0;
        }
      }
    a && se();
  }
  var Y = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), he = null, Ie = null, ie = null;
  function st(n) {
    if (n = F(n)) {
      if (typeof he != "function")
        throw Error(c(280));
      var a = n.stateNode;
      a && (a = z(a), he(n.stateNode, n.type, a));
    }
  }
  function fe(n) {
    Ie ? ie ? ie.push(n) : ie = [n] : Ie = n;
  }
  function xe() {
    if (Ie) {
      var n = Ie, a = ie;
      if (ie = Ie = null, st(n), a)
        for (n = 0; n < a.length; n++)
          st(a[n]);
    }
  }
  function We(n, a) {
    return n(a);
  }
  function Ce(n, a, u, f, v) {
    return n(a, u, f, v);
  }
  function Ve() {
  }
  var Ne = We, $e = !1, bt = !1;
  function Xt() {
    (Ie !== null || ie !== null) && (Ve(), xe());
  }
  function Ge(n, a, u) {
    if (bt)
      return n(a, u);
    bt = !0;
    try {
      return Ne(n, a, u);
    } finally {
      bt = !1, Xt();
    }
  }
  var re = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, D = Object.prototype.hasOwnProperty, B = {}, ee = {};
  function ye(n) {
    return D.call(ee, n) ? !0 : D.call(B, n) ? !1 : re.test(n) ? ee[n] = !0 : (B[n] = !0, !1);
  }
  function me(n, a, u, f) {
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
  function ot(n, a, u, f) {
    if (a === null || typeof a > "u" || me(n, a, u, f))
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
  function Ze(n, a, u, f, v, S) {
    this.acceptsBooleans = a === 2 || a === 3 || a === 4, this.attributeName = f, this.attributeNamespace = v, this.mustUseProperty = u, this.propertyName = n, this.type = a, this.sanitizeURL = S;
  }
  var ze = {};
  "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(n) {
    ze[n] = new Ze(n, 0, !1, n, null, !1);
  }), [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(n) {
    var a = n[0];
    ze[a] = new Ze(a, 1, !1, n[1], null, !1);
  }), ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(n) {
    ze[n] = new Ze(n, 2, !1, n.toLowerCase(), null, !1);
  }), ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(n) {
    ze[n] = new Ze(n, 2, !1, n, null, !1);
  }), "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(n) {
    ze[n] = new Ze(n, 3, !1, n.toLowerCase(), null, !1);
  }), ["checked", "multiple", "muted", "selected"].forEach(function(n) {
    ze[n] = new Ze(n, 3, !0, n, null, !1);
  }), ["capture", "download"].forEach(function(n) {
    ze[n] = new Ze(n, 4, !1, n, null, !1);
  }), ["cols", "rows", "size", "span"].forEach(function(n) {
    ze[n] = new Ze(n, 6, !1, n, null, !1);
  }), ["rowSpan", "start"].forEach(function(n) {
    ze[n] = new Ze(n, 5, !1, n.toLowerCase(), null, !1);
  });
  var dt = /[\-:]([a-z])/g;
  function Mt(n) {
    return n[1].toUpperCase();
  }
  "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(n) {
    var a = n.replace(
      dt,
      Mt
    );
    ze[a] = new Ze(a, 1, !1, n, null, !1);
  }), "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(n) {
    var a = n.replace(dt, Mt);
    ze[a] = new Ze(a, 1, !1, n, "http://www.w3.org/1999/xlink", !1);
  }), ["xml:base", "xml:lang", "xml:space"].forEach(function(n) {
    var a = n.replace(dt, Mt);
    ze[a] = new Ze(a, 1, !1, n, "http://www.w3.org/XML/1998/namespace", !1);
  }), ["tabIndex", "crossOrigin"].forEach(function(n) {
    ze[n] = new Ze(n, 1, !1, n.toLowerCase(), null, !1);
  }), ze.xlinkHref = new Ze("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0), ["src", "href", "action", "formAction"].forEach(function(n) {
    ze[n] = new Ze(n, 1, !1, n.toLowerCase(), null, !0);
  });
  var Wt = r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  Wt.hasOwnProperty("ReactCurrentDispatcher") || (Wt.ReactCurrentDispatcher = { current: null }), Wt.hasOwnProperty("ReactCurrentBatchConfig") || (Wt.ReactCurrentBatchConfig = { suspense: null });
  function St(n, a, u, f) {
    var v = ze.hasOwnProperty(a) ? ze[a] : null, S = v !== null ? v.type === 0 : f ? !1 : !(!(2 < a.length) || a[0] !== "o" && a[0] !== "O" || a[1] !== "n" && a[1] !== "N");
    S || (ot(a, u, v, f) && (u = null), f || v === null ? ye(a) && (u === null ? n.removeAttribute(a) : n.setAttribute(a, "" + u)) : v.mustUseProperty ? n[v.propertyName] = u === null ? v.type === 3 ? !1 : "" : u : (a = v.attributeName, f = v.attributeNamespace, u === null ? n.removeAttribute(a) : (v = v.type, u = v === 3 || v === 4 && u === !0 ? "" : "" + u, f ? n.setAttributeNS(f, a, u) : n.setAttribute(a, u))));
  }
  var Ln = /^(.*)[\\\/]/, Ft = typeof Symbol == "function" && Symbol.for, Bi = Ft ? Symbol.for("react.element") : 60103, ji = Ft ? Symbol.for("react.portal") : 60106, Ae = Ft ? Symbol.for("react.fragment") : 60107, at = Ft ? Symbol.for("react.strict_mode") : 60108, Fe = Ft ? Symbol.for("react.profiler") : 60114, Et = Ft ? Symbol.for("react.provider") : 60109, Si = Ft ? Symbol.for("react.context") : 60110, wn = Ft ? Symbol.for("react.concurrent_mode") : 60111, Yr = Ft ? Symbol.for("react.forward_ref") : 60112, Tr = Ft ? Symbol.for("react.suspense") : 60113, Bn = Ft ? Symbol.for("react.suspense_list") : 60120, Gr = Ft ? Symbol.for("react.memo") : 60115, Ui = Ft ? Symbol.for("react.lazy") : 60116, Ma = Ft ? Symbol.for("react.block") : 60121, Ea = typeof Symbol == "function" && Symbol.iterator;
  function ui(n) {
    return n === null || typeof n != "object" ? null : (n = Ea && n[Ea] || n["@@iterator"], typeof n == "function" ? n : null);
  }
  function er(n) {
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
  function ci(n) {
    if (n == null)
      return null;
    if (typeof n == "function")
      return n.displayName || n.name || null;
    if (typeof n == "string")
      return n;
    switch (n) {
      case Ae:
        return "Fragment";
      case ji:
        return "Portal";
      case Fe:
        return "Profiler";
      case at:
        return "StrictMode";
      case Tr:
        return "Suspense";
      case Bn:
        return "SuspenseList";
    }
    if (typeof n == "object")
      switch (n.$$typeof) {
        case Si:
          return "Context.Consumer";
        case Et:
          return "Context.Provider";
        case Yr:
          var a = n.render;
          return a = a.displayName || a.name || "", n.displayName || (a !== "" ? "ForwardRef(" + a + ")" : "ForwardRef");
        case Gr:
          return ci(n.type);
        case Ma:
          return ci(n.render);
        case Ui:
          if (n = n._status === 1 ? n._result : null)
            return ci(n);
      }
    return null;
  }
  function Ia(n) {
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
            var f = n._debugOwner, v = n._debugSource, S = ci(n.type);
            u = null, f && (u = ci(f.type)), f = S, S = "", v ? S = " (at " + v.fileName.replace(Ln, "") + ":" + v.lineNumber + ")" : u && (S = " (created by " + u + ")"), u = `
    in ` + (f || "Unknown") + S;
        }
      a += u, n = n.return;
    } while (n);
    return a;
  }
  function xi(n) {
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
      }, set: function(C) {
        f = "" + C, S.call(this, C);
      } }), Object.defineProperty(n, a, { enumerable: u.enumerable }), { getValue: function() {
        return f;
      }, setValue: function(C) {
        f = "" + C;
      }, stopTracking: function() {
        n._valueTracker = null, delete n[a];
      } };
    }
  }
  function Mr(n) {
    n._valueTracker || (n._valueTracker = Cs(n));
  }
  function Er(n) {
    if (!n)
      return !1;
    var a = n._valueTracker;
    if (!a)
      return !0;
    var u = a.getValue(), f = "";
    return n && (f = Xr(n) ? n.checked ? "true" : "false" : n.value), n = f, n !== u ? (a.setValue(n), !0) : !1;
  }
  function mn(n, a) {
    var u = a.checked;
    return i({}, a, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: u != null ? u : n._wrapperState.initialChecked });
  }
  function Jn(n, a) {
    var u = a.defaultValue == null ? "" : a.defaultValue, f = a.checked != null ? a.checked : a.defaultChecked;
    u = xi(a.value != null ? a.value : u), n._wrapperState = { initialChecked: f, initialValue: u, controlled: a.type === "checkbox" || a.type === "radio" ? a.checked != null : a.value != null };
  }
  function Aa(n, a) {
    a = a.checked, a != null && St(n, "checked", a, !1);
  }
  function Pt(n, a) {
    Aa(n, a);
    var u = xi(a.value), f = a.type;
    if (u != null)
      f === "number" ? (u === 0 && n.value === "" || n.value != u) && (n.value = "" + u) : n.value !== "" + u && (n.value = "" + u);
    else if (f === "submit" || f === "reset") {
      n.removeAttribute("value");
      return;
    }
    a.hasOwnProperty("value") ? Ci(n, a.type, u) : a.hasOwnProperty("defaultValue") && Ci(n, a.type, xi(a.defaultValue)), a.checked == null && a.defaultChecked != null && (n.defaultChecked = !!a.defaultChecked);
  }
  function nn(n, a, u) {
    if (a.hasOwnProperty("value") || a.hasOwnProperty("defaultValue")) {
      var f = a.type;
      if (!(f !== "submit" && f !== "reset" || a.value !== void 0 && a.value !== null))
        return;
      a = "" + n._wrapperState.initialValue, u || a === n.value || (n.value = a), n.defaultValue = a;
    }
    u = n.name, u !== "" && (n.name = ""), n.defaultChecked = !!n._wrapperState.initialChecked, u !== "" && (n.name = u);
  }
  function Ci(n, a, u) {
    (a !== "number" || n.ownerDocument.activeElement !== n) && (u == null ? n.defaultValue = "" + n._wrapperState.initialValue : n.defaultValue !== "" + u && (n.defaultValue = "" + u));
  }
  function Dn(n) {
    var a = "";
    return r.Children.forEach(n, function(u) {
      u != null && (a += u);
    }), a;
  }
  function Ti(n, a) {
    return n = i({ children: void 0 }, a), (a = Dn(a.children)) && (n.children = a), n;
  }
  function qn(n, a, u, f) {
    if (n = n.options, a) {
      a = {};
      for (var v = 0; v < u.length; v++)
        a["$" + u[v]] = !0;
      for (u = 0; u < n.length; u++)
        v = a.hasOwnProperty("$" + n[u].value), n[u].selected !== v && (n[u].selected = v), v && f && (n[u].defaultSelected = !0);
    } else {
      for (u = "" + xi(u), a = null, v = 0; v < n.length; v++) {
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
  function Ra(n, a) {
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
    n._wrapperState = { initialValue: xi(u) };
  }
  function yo(n, a) {
    var u = xi(a.value), f = xi(a.defaultValue);
    u != null && (u = "" + u, u !== n.value && (n.value = u), a.defaultValue == null && n.defaultValue !== u && (n.defaultValue = u)), f != null && (n.defaultValue = "" + f);
  }
  function wo(n) {
    var a = n.textContent;
    a === n._wrapperState.initialValue && a !== "" && a !== null && (n.value = a);
  }
  var Ts = { html: "http://www.w3.org/1999/xhtml", mathml: "http://www.w3.org/1998/Math/MathML", svg: "http://www.w3.org/2000/svg" };
  function Da(n) {
    switch (n) {
      case "svg":
        return "http://www.w3.org/2000/svg";
      case "math":
        return "http://www.w3.org/1998/Math/MathML";
      default:
        return "http://www.w3.org/1999/xhtml";
    }
  }
  function Nn(n, a) {
    return n == null || n === "http://www.w3.org/1999/xhtml" ? Da(a) : n === "http://www.w3.org/2000/svg" && a === "foreignObject" ? "http://www.w3.org/1999/xhtml" : n;
  }
  var Ir, qr = function(n) {
    return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(a, u, f, v) {
      MSApp.execUnsafeLocalFunction(function() {
        return n(a, u, f, v);
      });
    } : n;
  }(function(n, a) {
    if (n.namespaceURI !== Ts.svg || "innerHTML" in n)
      n.innerHTML = a;
    else {
      for (Ir = Ir || document.createElement("div"), Ir.innerHTML = "<svg>" + a.valueOf().toString() + "</svg>", a = Ir.firstChild; n.firstChild; )
        n.removeChild(n.firstChild);
      for (; a.firstChild; )
        n.appendChild(a.firstChild);
    }
  });
  function Kn(n, a) {
    if (a) {
      var u = n.firstChild;
      if (u && u === n.lastChild && u.nodeType === 3) {
        u.nodeValue = a;
        return;
      }
    }
    n.textContent = a;
  }
  function Ar(n, a) {
    var u = {};
    return u[n.toLowerCase()] = a.toLowerCase(), u["Webkit" + n] = "webkit" + a, u["Moz" + n] = "moz" + a, u;
  }
  var jn = { animationend: Ar("Animation", "AnimationEnd"), animationiteration: Ar("Animation", "AnimationIteration"), animationstart: Ar("Animation", "AnimationStart"), transitionend: Ar("Transition", "TransitionEnd") }, tr = {}, Ms = {};
  Y && (Ms = document.createElement("div").style, "AnimationEvent" in window || (delete jn.animationend.animation, delete jn.animationiteration.animation, delete jn.animationstart.animation), "TransitionEvent" in window || delete jn.transitionend.transition);
  function Kr(n) {
    if (tr[n])
      return tr[n];
    if (!jn[n])
      return n;
    var a = jn[n], u;
    for (u in a)
      if (a.hasOwnProperty(u) && u in Ms)
        return tr[n] = a[u];
    return n;
  }
  var Es = Kr("animationend"), ne = Kr("animationiteration"), ce = Kr("animationstart"), Xe = Kr("transitionend"), pt = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), Jt = new (typeof WeakMap == "function" ? WeakMap : Map)();
  function Zt(n) {
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
  function ei(n) {
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
  function Na(n) {
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
        for (var C = !1, R = v.child; R; ) {
          if (R === u) {
            C = !0, u = v, f = S;
            break;
          }
          if (R === f) {
            C = !0, f = v, u = S;
            break;
          }
          R = R.sibling;
        }
        if (!C) {
          for (R = S.child; R; ) {
            if (R === u) {
              C = !0, u = S, f = v;
              break;
            }
            if (R === f) {
              C = !0, f = S, u = v;
              break;
            }
            R = R.sibling;
          }
          if (!C)
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
    if (n = Na(n), !n)
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
  function rn(n, a) {
    if (a == null)
      throw Error(c(30));
    return n == null ? a : Array.isArray(n) ? Array.isArray(a) ? (n.push.apply(n, a), n) : (n.push(a), n) : Array.isArray(a) ? [n].concat(a) : [n, a];
  }
  function hn(n, a, u) {
    Array.isArray(n) ? n.forEach(a, u) : n && a.call(u, n);
  }
  var Is = null;
  function fl(n) {
    if (n) {
      var a = n._dispatchListeners, u = n._dispatchInstances;
      if (Array.isArray(a))
        for (var f = 0; f < a.length && !n.isPropagationStopped(); f++)
          J(n, a[f], u[f]);
      else
        a && J(n, a, u);
      n._dispatchListeners = null, n._dispatchInstances = null, n.isPersistent() || n.constructor.release(n);
    }
  }
  function ea(n) {
    if (n !== null && (Is = rn(Is, n)), n = Is, Is = null, n) {
      if (hn(n, fl), Is)
        throw Error(c(95));
      if (g)
        throw n = x, g = !1, x = null, n;
    }
  }
  function hl(n) {
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
  function pl(n) {
    n.topLevelType = null, n.nativeEvent = null, n.targetInst = null, n.ancestors.length = 0, 10 > As.length && As.push(n);
  }
  function Bu(n, a, u, f) {
    if (As.length) {
      var v = As.pop();
      return v.topLevelType = n, v.eventSystemFlags = f, v.nativeEvent = a, v.targetInst = u, v;
    }
    return { topLevelType: n, eventSystemFlags: f, nativeEvent: a, targetInst: u, ancestors: [] };
  }
  function ml(n) {
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
      var v = hl(n.nativeEvent);
      f = n.topLevelType;
      var S = n.nativeEvent, C = n.eventSystemFlags;
      u === 0 && (C |= 64);
      for (var R = null, H = 0; H < ue.length; H++) {
        var U = ue[H];
        U && (U = U.extractEvents(f, a, S, v, C)) && (R = rn(R, U));
      }
      ea(R);
    }
  }
  function M(n, a, u) {
    if (!u.has(n)) {
      switch (n) {
        case "scroll":
          ir(a, "scroll", !0);
          break;
        case "focus":
        case "blur":
          ir(a, "focus", !0), ir(a, "blur", !0), u.set("blur", null), u.set("focus", null);
          break;
        case "cancel":
        case "close":
          Lu(n) && ir(a, n, !0);
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
  var P, V, G, Se = !1, Ye = [], Be = null, et = null, kt = null, vn = /* @__PURE__ */ new Map(), bn = /* @__PURE__ */ new Map(), Cn = [], ti = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput close cancel copy cut paste click change contextmenu reset submit".split(" "), ni = "focus blur dragenter dragleave mouseover mouseout pointerover pointerout gotpointercapture lostpointercapture".split(" ");
  function So(n, a) {
    var u = Zt(a);
    ti.forEach(function(f) {
      M(f, a, u);
    }), ni.forEach(function(f) {
      M(f, a, u);
    });
  }
  function ta(n, a, u, f, v) {
    return { blockedOn: n, topLevelType: a, eventSystemFlags: u | 32, nativeEvent: v, container: f };
  }
  function nr(n, a) {
    switch (n) {
      case "focus":
      case "blur":
        Be = null;
        break;
      case "dragenter":
      case "dragleave":
        et = null;
        break;
      case "mouseover":
      case "mouseout":
        kt = null;
        break;
      case "pointerover":
      case "pointerout":
        vn.delete(a.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        bn.delete(a.pointerId);
    }
  }
  function xo(n, a, u, f, v, S) {
    return n === null || n.nativeEvent !== S ? (n = ta(a, u, f, v, S), a !== null && (a = wl(a), a !== null && V(a)), n) : (n.eventSystemFlags |= f, n);
  }
  function pp(n, a, u, f, v) {
    switch (a) {
      case "focus":
        return Be = xo(Be, n, a, u, f, v), !0;
      case "dragenter":
        return et = xo(et, n, a, u, f, v), !0;
      case "mouseover":
        return kt = xo(kt, n, a, u, f, v), !0;
      case "pointerover":
        var S = v.pointerId;
        return vn.set(S, xo(vn.get(S) || null, n, a, u, f, v)), !0;
      case "gotpointercapture":
        return S = v.pointerId, bn.set(S, xo(bn.get(S) || null, n, a, u, f, v)), !0;
    }
    return !1;
  }
  function wg(n) {
    var a = Ao(n.target);
    if (a !== null) {
      var u = fn(a);
      if (u !== null) {
        if (a = u.tag, a === 13) {
          if (a = ei(u), a !== null) {
            n.blockedOn = a, o.unstable_runWithPriority(n.priority, function() {
              G(u);
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
  function Rr(n) {
    if (n.blockedOn !== null)
      return !1;
    var a = Nr(n.topLevelType, n.eventSystemFlags, n.container, n.nativeEvent);
    if (a !== null) {
      var u = wl(a);
      return u !== null && V(u), n.blockedOn = a, !1;
    }
    return !0;
  }
  function mp(n, a, u) {
    Rr(n) && u.delete(a);
  }
  function _d() {
    for (Se = !1; 0 < Ye.length; ) {
      var n = Ye[0];
      if (n.blockedOn !== null) {
        n = wl(n.blockedOn), n !== null && P(n);
        break;
      }
      var a = Nr(n.topLevelType, n.eventSystemFlags, n.container, n.nativeEvent);
      a !== null ? n.blockedOn = a : Ye.shift();
    }
    Be !== null && Rr(Be) && (Be = null), et !== null && Rr(et) && (et = null), kt !== null && Rr(kt) && (kt = null), vn.forEach(mp), bn.forEach(mp);
  }
  function Rs(n, a) {
    n.blockedOn === a && (n.blockedOn = null, Se || (Se = !0, o.unstable_scheduleCallback(o.unstable_NormalPriority, _d)));
  }
  function vp(n) {
    function a(v) {
      return Rs(v, n);
    }
    if (0 < Ye.length) {
      Rs(Ye[0], n);
      for (var u = 1; u < Ye.length; u++) {
        var f = Ye[u];
        f.blockedOn === n && (f.blockedOn = null);
      }
    }
    for (Be !== null && Rs(Be, n), et !== null && Rs(et, n), kt !== null && Rs(kt, n), vn.forEach(a), bn.forEach(a), u = 0; u < Cn.length; u++)
      f = Cn[u], f.blockedOn === n && (f.blockedOn = null);
    for (; 0 < Cn.length && (u = Cn[0], u.blockedOn === null); )
      wg(u), u.blockedOn === null && Cn.shift();
  }
  var zd = {}, gp = /* @__PURE__ */ new Map(), Od = /* @__PURE__ */ new Map(), Te = [
    "abort",
    "abort",
    Es,
    "animationEnd",
    ne,
    "animationIteration",
    ce,
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
    Xe,
    "transitionEnd",
    "waiting",
    "waiting"
  ];
  function ju(n, a) {
    for (var u = 0; u < n.length; u += 2) {
      var f = n[u], v = n[u + 1], S = "on" + (v[0].toUpperCase() + v.slice(1));
      S = { phasedRegistrationNames: { bubbled: S, captured: S + "Capture" }, dependencies: [f], eventPriority: a }, Od.set(f, a), gp.set(f, S), zd[v] = S;
    }
  }
  ju("blur blur cancel cancel click click close close contextmenu contextMenu copy copy cut cut auxclick auxClick dblclick doubleClick dragend dragEnd dragstart dragStart drop drop focus focus input input invalid invalid keydown keyDown keypress keyPress keyup keyUp mousedown mouseDown mouseup mouseUp paste paste pause pause play play pointercancel pointerCancel pointerdown pointerDown pointerup pointerUp ratechange rateChange reset reset seeked seeked submit submit touchcancel touchCancel touchend touchEnd touchstart touchStart volumechange volumeChange".split(" "), 0), ju("drag drag dragenter dragEnter dragexit dragExit dragleave dragLeave dragover dragOver mousemove mouseMove mouseout mouseOut mouseover mouseOver pointermove pointerMove pointerout pointerOut pointerover pointerOver scroll scroll toggle toggle touchmove touchMove wheel wheel".split(" "), 1), ju(Te, 2);
  for (var yp = "change selectionchange textInput compositionstart compositionend compositionupdate".split(" "), Fn = 0; Fn < yp.length; Fn++)
    Od.set(yp[Fn], 0);
  var na = o.unstable_UserBlockingPriority, vl = o.unstable_runWithPriority, ka = !0;
  function ft(n, a) {
    ir(a, n, !1);
  }
  function ir(n, a, u) {
    var f = Od.get(a);
    switch (f === void 0 ? 2 : f) {
      case 0:
        f = Co.bind(null, a, 1, n);
        break;
      case 1:
        f = Dr.bind(null, a, 1, n);
        break;
      default:
        f = ii.bind(null, a, 1, n);
    }
    u ? n.addEventListener(a, f, !0) : n.addEventListener(a, f, !1);
  }
  function Co(n, a, u, f) {
    $e || Ve();
    var v = ii, S = $e;
    $e = !0;
    try {
      Ce(v, n, a, u, f);
    } finally {
      ($e = S) || Xt();
    }
  }
  function Dr(n, a, u, f) {
    vl(na, ii.bind(null, n, a, u, f));
  }
  function ii(n, a, u, f) {
    if (ka)
      if (0 < Ye.length && -1 < ti.indexOf(n))
        n = ta(null, n, a, u, f), Ye.push(n);
      else {
        var v = Nr(n, a, u, f);
        if (v === null)
          nr(n, f);
        else if (-1 < ti.indexOf(n))
          n = ta(v, n, a, u, f), Ye.push(n);
        else if (!pp(v, n, a, u, f)) {
          nr(n, f), n = Bu(n, f, null, a);
          try {
            Ge(ml, n);
          } finally {
            pl(n);
          }
        }
      }
  }
  function Nr(n, a, u, f) {
    if (u = hl(f), u = Ao(u), u !== null) {
      var v = fn(u);
      if (v === null)
        u = null;
      else {
        var S = v.tag;
        if (S === 13) {
          if (u = ei(v), u !== null)
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
      Ge(ml, n);
    } finally {
      pl(n);
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
  function wp(n, a, u) {
    return a == null || typeof a == "boolean" || a === "" ? "" : u || typeof a != "number" || a === 0 || To.hasOwnProperty(n) && To[n] ? ("" + a).trim() : a + "px";
  }
  function bp(n, a) {
    n = n.style;
    for (var u in a)
      if (a.hasOwnProperty(u)) {
        var f = u.indexOf("--") === 0, v = wp(u, a[u], f);
        u === "float" && (u = "cssFloat"), f ? n.setProperty(u, v) : n[u] = v;
      }
  }
  var Sp = i({ menuitem: !0 }, { area: !0, base: !0, br: !0, col: !0, embed: !0, hr: !0, img: !0, input: !0, keygen: !0, link: !0, meta: !0, param: !0, source: !0, track: !0, wbr: !0 });
  function Vu(n, a) {
    if (a) {
      if (Sp[n] && (a.children != null || a.dangerouslySetInnerHTML != null))
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
  var xp = Ts.html;
  function ia(n, a) {
    n = n.nodeType === 9 || n.nodeType === 11 ? n : n.ownerDocument;
    var u = Zt(n);
    a = Qe[a];
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
  var Fu = "$", Hd = "/$", $u = "$?", gl = "$!", Qu = null, Wd = null;
  function Cp(n, a) {
    switch (n) {
      case "button":
      case "input":
      case "select":
      case "textarea":
        return !!a.autoFocus;
    }
    return !1;
  }
  function yl(n, a) {
    return n === "textarea" || n === "option" || n === "noscript" || typeof a.children == "string" || typeof a.children == "number" || typeof a.dangerouslySetInnerHTML == "object" && a.dangerouslySetInnerHTML !== null && a.dangerouslySetInnerHTML.__html != null;
  }
  var Zu = typeof setTimeout == "function" ? setTimeout : void 0, Tp = typeof clearTimeout == "function" ? clearTimeout : void 0;
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
        if (u === Fu || u === gl || u === $u) {
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
  var $d = Math.random().toString(36).slice(2), kr = "__reactInternalInstance$" + $d, Eo = "__reactEventHandlers$" + $d, Io = "__reactContainere$" + $d;
  function Ao(n) {
    var a = n[kr];
    if (a)
      return a;
    for (var u = n.parentNode; u; ) {
      if (a = u[Io] || u[kr]) {
        if (u = a.alternate, a.child !== null || u !== null && u.child !== null)
          for (n = Fd(n); n !== null; ) {
            if (u = n[kr])
              return u;
            n = Fd(n);
          }
        return a;
      }
      n = u, u = n.parentNode;
    }
    return null;
  }
  function wl(n) {
    return n = n[kr] || n[Io], !n || n.tag !== 5 && n.tag !== 6 && n.tag !== 13 && n.tag !== 3 ? null : n;
  }
  function Vi(n) {
    if (n.tag === 5 || n.tag === 6)
      return n.stateNode;
    throw Error(c(33));
  }
  function bl(n) {
    return n[Eo] || null;
  }
  function Pr(n) {
    do
      n = n.return;
    while (n && n.tag !== 5);
    return n || null;
  }
  function Mp(n, a) {
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
  function Ep(n, a, u) {
    (a = Mp(n, u.dispatchConfig.phasedRegistrationNames[a])) && (u._dispatchListeners = rn(u._dispatchListeners, a), u._dispatchInstances = rn(u._dispatchInstances, n));
  }
  function bg(n) {
    if (n && n.dispatchConfig.phasedRegistrationNames) {
      for (var a = n._targetInst, u = []; a; )
        u.push(a), a = Pr(a);
      for (a = u.length; 0 < a--; )
        Ep(u[a], "captured", n);
      for (a = 0; a < u.length; a++)
        Ep(u[a], "bubbled", n);
    }
  }
  function Yu(n, a, u) {
    n && u && u.dispatchConfig.registrationName && (a = Mp(n, u.dispatchConfig.registrationName)) && (u._dispatchListeners = rn(u._dispatchListeners, a), u._dispatchInstances = rn(u._dispatchInstances, n));
  }
  function Qd(n) {
    n && n.dispatchConfig.registrationName && Yu(n._targetInst, null, n);
  }
  function Ns(n) {
    hn(n, bg);
  }
  var ra = null, Gu = null, Xu = null;
  function Sl() {
    if (Xu)
      return Xu;
    var n, a = Gu, u = a.length, f, v = "value" in ra ? ra.value : ra.textContent, S = v.length;
    for (n = 0; n < u && a[n] === v[n]; n++)
      ;
    var C = u - n;
    for (f = 1; f <= C && a[u - f] === v[S - f]; f++)
      ;
    return Xu = v.slice(n, 1 < f ? 1 - f : void 0);
  }
  function xl() {
    return !0;
  }
  function Ro() {
    return !1;
  }
  function di(n, a, u, f) {
    this.dispatchConfig = n, this._targetInst = a, this.nativeEvent = u, n = this.constructor.Interface;
    for (var v in n)
      n.hasOwnProperty(v) && ((a = n[v]) ? this[v] = a(u) : v === "target" ? this.target = f : this[v] = u[v]);
    return this.isDefaultPrevented = (u.defaultPrevented != null ? u.defaultPrevented : u.returnValue === !1) ? xl : Ro, this.isPropagationStopped = Ro, this;
  }
  i(di.prototype, { preventDefault: function() {
    this.defaultPrevented = !0;
    var n = this.nativeEvent;
    n && (n.preventDefault ? n.preventDefault() : typeof n.returnValue != "unknown" && (n.returnValue = !1), this.isDefaultPrevented = xl);
  }, stopPropagation: function() {
    var n = this.nativeEvent;
    n && (n.stopPropagation ? n.stopPropagation() : typeof n.cancelBubble != "unknown" && (n.cancelBubble = !0), this.isPropagationStopped = xl);
  }, persist: function() {
    this.isPersistent = xl;
  }, isPersistent: Ro, destructor: function() {
    var n = this.constructor.Interface, a;
    for (a in n)
      this[a] = null;
    this.nativeEvent = this._targetInst = this.dispatchConfig = null, this.isPropagationStopped = this.isDefaultPrevented = Ro, this._dispatchInstances = this._dispatchListeners = null;
  } }), di.Interface = { type: null, target: null, currentTarget: function() {
    return null;
  }, eventPhase: null, bubbles: null, cancelable: null, timeStamp: function(n) {
    return n.timeStamp || Date.now();
  }, defaultPrevented: null, isTrusted: null }, di.extend = function(n) {
    function a() {
    }
    function u() {
      return f.apply(this, arguments);
    }
    var f = this;
    a.prototype = f.prototype;
    var v = new a();
    return i(v, u.prototype), u.prototype = v, u.prototype.constructor = u, u.Interface = i({}, f.Interface, n), u.extend = f.extend, Ip(u), u;
  }, Ip(di);
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
  function Ip(n) {
    n.eventPool = [], n.getPooled = Zd, n.release = Yd;
  }
  var Ju = di.extend({ data: null }), Ap = di.extend({ data: null }), rr = [9, 13, 27, 32], ar = Y && "CompositionEvent" in window, ri = null;
  Y && "documentMode" in document && (ri = document.documentMode);
  var Pa = Y && "TextEvent" in window && !ri, qu = Y && (!ar || ri && 8 < ri && 11 >= ri), Cl = String.fromCharCode(32), _a = { beforeInput: { phasedRegistrationNames: { bubbled: "onBeforeInput", captured: "onBeforeInputCapture" }, dependencies: ["compositionend", "keypress", "textInput", "paste"] }, compositionEnd: { phasedRegistrationNames: { bubbled: "onCompositionEnd", captured: "onCompositionEndCapture" }, dependencies: "blur compositionend keydown keypress keyup mousedown".split(" ") }, compositionStart: { phasedRegistrationNames: {
    bubbled: "onCompositionStart",
    captured: "onCompositionStartCapture"
  }, dependencies: "blur compositionstart keydown keypress keyup mousedown".split(" ") }, compositionUpdate: { phasedRegistrationNames: { bubbled: "onCompositionUpdate", captured: "onCompositionUpdateCapture" }, dependencies: "blur compositionupdate keydown keypress keyup mousedown".split(" ") } }, Sg = !1;
  function Tl(n, a) {
    switch (n) {
      case "keyup":
        return rr.indexOf(a.keyCode) !== -1;
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
  var za = !1;
  function Rp(n, a) {
    switch (n) {
      case "compositionend":
        return ks(a);
      case "keypress":
        return a.which !== 32 ? null : (Sg = !0, Cl);
      case "textInput":
        return n = a.data, n === Cl && Sg ? null : n;
      default:
        return null;
    }
  }
  function Ku(n, a) {
    if (za)
      return n === "compositionend" || !ar && Tl(n, a) ? (n = Sl(), Xu = Gu = ra = null, za = !1, n) : null;
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
    if (ar)
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
      za ? Tl(n, u) && (S = _a.compositionEnd) : n === "keydown" && u.keyCode === 229 && (S = _a.compositionStart);
    return S ? (qu && u.locale !== "ko" && (za || S !== _a.compositionStart ? S === _a.compositionEnd && za && (v = Sl()) : (ra = f, Gu = "value" in ra ? ra.value : ra.textContent, za = !0)), S = Ju.getPooled(
      S,
      a,
      u,
      f
    ), v ? S.data = v : (v = ks(u), v !== null && (S.data = v)), Ns(S), v = S) : v = null, (n = Pa ? Rp(n, u) : Ku(n, u)) ? (a = Ap.getPooled(_a.beforeInput, a, u, f), a.data = n, Ns(a)) : a = null, v === null ? a : a === null ? v : [v, a];
  } }, Dp = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
  function Xd(n) {
    var a = n && n.nodeName && n.nodeName.toLowerCase();
    return a === "input" ? !!Dp[n.type] : a === "textarea";
  }
  var Jd = { change: { phasedRegistrationNames: { bubbled: "onChange", captured: "onChangeCapture" }, dependencies: "blur change click focus input keydown keyup selectionchange".split(" ") } };
  function Un(n, a, u) {
    return n = di.getPooled(Jd.change, n, a, u), n.type = "change", fe(u), Ns(n), n;
  }
  var Ps = null, _s = null;
  function ec(n) {
    ea(n);
  }
  function Oa(n) {
    var a = Vi(n);
    if (Er(a))
      return n;
  }
  function Ml(n, a) {
    if (n === "change")
      return a;
  }
  var Do = !1;
  Y && (Do = Lu("input") && (!document.documentMode || 9 < document.documentMode));
  function aa() {
    Ps && (Ps.detachEvent("onpropertychange", El), _s = Ps = null);
  }
  function El(n) {
    if (n.propertyName === "value" && Oa(_s))
      if (n = Un(_s, n, hl(n)), $e)
        ea(n);
      else {
        $e = !0;
        try {
          We(ec, n);
        } finally {
          $e = !1, Xt();
        }
      }
  }
  function qd(n, a, u) {
    n === "focus" ? (aa(), Ps = a, _s = u, Ps.attachEvent("onpropertychange", El)) : n === "blur" && aa();
  }
  function Il(n) {
    if (n === "selectionchange" || n === "keyup" || n === "keydown")
      return Oa(_s);
  }
  function Kd(n, a) {
    if (n === "click")
      return Oa(a);
  }
  function ef(n, a) {
    if (n === "input" || n === "change")
      return Oa(a);
  }
  var tf = { eventTypes: Jd, _isInputEventSupported: Do, extractEvents: function(n, a, u, f) {
    var v = a ? Vi(a) : window, S = v.nodeName && v.nodeName.toLowerCase();
    if (S === "select" || S === "input" && v.type === "file")
      var C = Ml;
    else if (Xd(v))
      if (Do)
        C = ef;
      else {
        C = Il;
        var R = qd;
      }
    else
      (S = v.nodeName) && S.toLowerCase() === "input" && (v.type === "checkbox" || v.type === "radio") && (C = Kd);
    if (C && (C = C(n, a)))
      return Un(C, u, f);
    R && R(n, v, a), n === "blur" && (n = v._wrapperState) && n.controlled && v.type === "number" && Ci(v, "number", v.value);
  } }, zs = di.extend({ view: null, detail: null }), Np = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
  function Al(n) {
    var a = this.nativeEvent;
    return a.getModifierState ? a.getModifierState(n) : (n = Np[n]) ? !!a[n] : !1;
  }
  function Os() {
    return Al;
  }
  var nf = 0, Rl = 0, rf = !1, tc = !1, Ls = zs.extend({ screenX: null, screenY: null, clientX: null, clientY: null, pageX: null, pageY: null, ctrlKey: null, shiftKey: null, altKey: null, metaKey: null, getModifierState: Os, button: null, buttons: null, relatedTarget: function(n) {
    return n.relatedTarget || (n.fromElement === n.srcElement ? n.toElement : n.fromElement);
  }, movementX: function(n) {
    if ("movementX" in n)
      return n.movementX;
    var a = nf;
    return nf = n.screenX, rf ? n.type === "mousemove" ? n.screenX - a : 0 : (rf = !0, 0);
  }, movementY: function(n) {
    if ("movementY" in n)
      return n.movementY;
    var a = Rl;
    return Rl = n.screenY, tc ? n.type === "mousemove" ? n.screenY - a : 0 : (tc = !0, 0);
  } }), nc = Ls.extend({ pointerId: null, width: null, height: null, pressure: null, tangentialPressure: null, tiltX: null, tiltY: null, twist: null, pointerType: null, isPrimary: null }), Bs = { mouseEnter: { registrationName: "onMouseEnter", dependencies: ["mouseout", "mouseover"] }, mouseLeave: { registrationName: "onMouseLeave", dependencies: ["mouseout", "mouseover"] }, pointerEnter: { registrationName: "onPointerEnter", dependencies: ["pointerout", "pointerover"] }, pointerLeave: {
    registrationName: "onPointerLeave",
    dependencies: ["pointerout", "pointerover"]
  } }, af = { eventTypes: Bs, extractEvents: function(n, a, u, f, v) {
    var S = n === "mouseover" || n === "pointerover", C = n === "mouseout" || n === "pointerout";
    if (S && (v & 32) === 0 && (u.relatedTarget || u.fromElement) || !C && !S)
      return null;
    if (S = f.window === f ? f : (S = f.ownerDocument) ? S.defaultView || S.parentWindow : window, C) {
      if (C = a, a = (a = u.relatedTarget || u.toElement) ? Ao(a) : null, a !== null) {
        var R = fn(a);
        (a !== R || a.tag !== 5 && a.tag !== 6) && (a = null);
      }
    } else
      C = null;
    if (C === a)
      return null;
    if (n === "mouseout" || n === "mouseover")
      var H = Ls, U = Bs.mouseLeave, Me = Bs.mouseEnter, ke = "mouse";
    else
      (n === "pointerout" || n === "pointerover") && (H = nc, U = Bs.pointerLeave, Me = Bs.pointerEnter, ke = "pointer");
    if (n = C == null ? S : Vi(C), S = a == null ? S : Vi(a), U = H.getPooled(U, C, u, f), U.type = ke + "leave", U.target = n, U.relatedTarget = S, u = H.getPooled(Me, a, u, f), u.type = ke + "enter", u.target = S, u.relatedTarget = n, f = C, ke = a, f && ke)
      e: {
        for (H = f, Me = ke, C = 0, n = H; n; n = Pr(n))
          C++;
        for (n = 0, a = Me; a; a = Pr(a))
          n++;
        for (; 0 < C - n; )
          H = Pr(H), C--;
        for (; 0 < n - C; )
          Me = Pr(Me), n--;
        for (; C--; ) {
          if (H === Me || H === Me.alternate)
            break e;
          H = Pr(H), Me = Pr(Me);
        }
        H = null;
      }
    else
      H = null;
    for (Me = H, H = []; f && f !== Me && (C = f.alternate, !(C !== null && C === Me)); )
      H.push(f), f = Pr(f);
    for (f = []; ke && ke !== Me && (C = ke.alternate, !(C !== null && C === Me)); )
      f.push(ke), ke = Pr(ke);
    for (ke = 0; ke < H.length; ke++)
      Yu(H[ke], "bubbled", U);
    for (ke = f.length; 0 < ke--; )
      Yu(f[ke], "captured", u);
    return (v & 64) === 0 ? [U] : [U, u];
  } };
  function sf(n, a) {
    return n === a && (n !== 0 || 1 / n === 1 / a) || n !== n && a !== a;
  }
  var Mi = typeof Object.is == "function" ? Object.is : sf, Hi = Object.prototype.hasOwnProperty;
  function sa(n, a) {
    if (Mi(n, a))
      return !0;
    if (typeof n != "object" || n === null || typeof a != "object" || a === null)
      return !1;
    var u = Object.keys(n), f = Object.keys(a);
    if (u.length !== f.length)
      return !1;
    for (f = 0; f < u.length; f++)
      if (!Hi.call(a, u[f]) || !Mi(n[u[f]], a[u[f]]))
        return !1;
    return !0;
  }
  var Dl = Y && "documentMode" in document && 11 >= document.documentMode, _r = { select: { phasedRegistrationNames: { bubbled: "onSelect", captured: "onSelectCapture" }, dependencies: "blur contextmenu dragend focus keydown keyup mousedown mouseup selectionchange".split(" ") } }, Vn = null, Wi = null, ai = null, La = !1;
  function ic(n, a) {
    var u = a.window === a ? a.document : a.nodeType === 9 ? a : a.ownerDocument;
    return La || Vn == null || Vn !== Hu(u) ? null : (u = Vn, "selectionStart" in u && Wu(u) ? u = { start: u.selectionStart, end: u.selectionEnd } : (u = (u.ownerDocument && u.ownerDocument.defaultView || window).getSelection(), u = { anchorNode: u.anchorNode, anchorOffset: u.anchorOffset, focusNode: u.focusNode, focusOffset: u.focusOffset }), ai && sa(ai, u) ? null : (ai = u, n = di.getPooled(_r.select, Wi, n, a), n.type = "select", n.target = Vn, Ns(n), n));
  }
  var of = { eventTypes: _r, extractEvents: function(n, a, u, f, v, S) {
    if (v = S || (f.window === f ? f.document : f.nodeType === 9 ? f : f.ownerDocument), !(S = !v)) {
      e: {
        v = Zt(v), S = Qe.onSelect;
        for (var C = 0; C < S.length; C++)
          if (!v.has(S[C])) {
            v = !1;
            break e;
          }
        v = !0;
      }
      S = !v;
    }
    if (S)
      return null;
    switch (v = a ? Vi(a) : window, n) {
      case "focus":
        (Xd(v) || v.contentEditable === "true") && (Vn = v, Wi = a, ai = null);
        break;
      case "blur":
        ai = Wi = Vn = null;
        break;
      case "mousedown":
        La = !0;
        break;
      case "contextmenu":
      case "mouseup":
      case "dragend":
        return La = !1, ic(u, f);
      case "selectionchange":
        if (Dl)
          break;
      case "keydown":
      case "keyup":
        return ic(u, f);
    }
    return null;
  } }, lf = di.extend({ animationName: null, elapsedTime: null, pseudoElement: null }), rc = di.extend({ clipboardData: function(n) {
    return "clipboardData" in n ? n.clipboardData : window.clipboardData;
  } }), oa = zs.extend({ relatedTarget: null });
  function Nl(n) {
    var a = n.keyCode;
    return "charCode" in n ? (n = n.charCode, n === 0 && a === 13 && (n = 13)) : n = a, n === 10 && (n = 13), 32 <= n || n === 13 ? n : 0;
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
  }, kl = zs.extend({ key: function(n) {
    if (n.key) {
      var a = Ba[n.key] || n.key;
      if (a !== "Unidentified")
        return a;
    }
    return n.type === "keypress" ? (n = Nl(n), n === 13 ? "Enter" : String.fromCharCode(n)) : n.type === "keydown" || n.type === "keyup" ? la[n.keyCode] || "Unidentified" : "";
  }, location: null, ctrlKey: null, shiftKey: null, altKey: null, metaKey: null, repeat: null, locale: null, getModifierState: Os, charCode: function(n) {
    return n.type === "keypress" ? Nl(n) : 0;
  }, keyCode: function(n) {
    return n.type === "keydown" || n.type === "keyup" ? n.keyCode : 0;
  }, which: function(n) {
    return n.type === "keypress" ? Nl(n) : n.type === "keydown" || n.type === "keyup" ? n.keyCode : 0;
  } }), Pl = Ls.extend({ dataTransfer: null }), uf = zs.extend({ touches: null, targetTouches: null, changedTouches: null, altKey: null, metaKey: null, ctrlKey: null, shiftKey: null, getModifierState: Os }), cf = di.extend({ propertyName: null, elapsedTime: null, pseudoElement: null }), df = Ls.extend({ deltaX: function(n) {
    return "deltaX" in n ? n.deltaX : "wheelDeltaX" in n ? -n.wheelDeltaX : 0;
  }, deltaY: function(n) {
    return "deltaY" in n ? n.deltaY : "wheelDeltaY" in n ? -n.wheelDeltaY : "wheelDelta" in n ? -n.wheelDelta : 0;
  }, deltaZ: null, deltaMode: null }), ff = { eventTypes: zd, extractEvents: function(n, a, u, f) {
    var v = gp.get(n);
    if (!v)
      return null;
    switch (n) {
      case "keypress":
        if (Nl(u) === 0)
          return null;
      case "keydown":
      case "keyup":
        n = kl;
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
        n = Pl;
        break;
      case "touchcancel":
      case "touchend":
      case "touchmove":
      case "touchstart":
        n = uf;
        break;
      case Es:
      case ne:
      case ce:
        n = lf;
        break;
      case Xe:
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
        n = di;
    }
    return a = n.getPooled(v, a, u, f), Ns(a), a;
  } };
  if (q)
    throw Error(c(101));
  q = Array.prototype.slice.call("ResponderEventPlugin SimpleEventPlugin EnterLeaveEventPlugin ChangeEventPlugin SelectEventPlugin BeforeInputEventPlugin".split(" ")), se();
  var hf = wl;
  z = bl, F = hf, $ = Vi, je({ SimpleEventPlugin: ff, EnterLeaveEventPlugin: af, ChangeEventPlugin: tf, SelectEventPlugin: of, BeforeInputEventPlugin: Gd });
  var ac = [], Ei = -1;
  function xt(n) {
    0 > Ei || (n.current = ac[Ei], ac[Ei] = null, Ei--);
  }
  function an(n, a) {
    Ei++, ac[Ei] = n.current, n.current = a;
  }
  var zr = {}, kn = { current: zr }, Tn = { current: !1 }, Or = zr;
  function ja(n, a) {
    var u = n.type.contextTypes;
    if (!u)
      return zr;
    var f = n.stateNode;
    if (f && f.__reactInternalMemoizedUnmaskedChildContext === a)
      return f.__reactInternalMemoizedMaskedChildContext;
    var v = {}, S;
    for (S in u)
      v[S] = a[S];
    return f && (n = n.stateNode, n.__reactInternalMemoizedUnmaskedChildContext = a, n.__reactInternalMemoizedMaskedChildContext = v), v;
  }
  function $n(n) {
    return n = n.childContextTypes, n != null;
  }
  function Ua() {
    xt(Tn), xt(kn);
  }
  function sc(n, a, u) {
    if (kn.current !== zr)
      throw Error(c(168));
    an(kn, a), an(Tn, u);
  }
  function js(n, a, u) {
    var f = n.stateNode;
    if (n = a.childContextTypes, typeof f.getChildContext != "function")
      return u;
    f = f.getChildContext();
    for (var v in f)
      if (!(v in n))
        throw Error(c(108, ci(a) || "Unknown", v));
    return i({}, u, {}, f);
  }
  function No(n) {
    return n = (n = n.stateNode) && n.__reactInternalMemoizedMergedChildContext || zr, Or = kn.current, an(kn, n), an(Tn, Tn.current), !0;
  }
  function _l(n, a, u) {
    var f = n.stateNode;
    if (!f)
      throw Error(c(169));
    u ? (n = js(n, a, Or), f.__reactInternalMemoizedMergedChildContext = n, xt(Tn), xt(kn), an(kn, n)) : xt(Tn), an(Tn, u);
  }
  var pf = o.unstable_runWithPriority, ko = o.unstable_scheduleCallback, oc = o.unstable_cancelCallback, lc = o.unstable_requestPaint, uc = o.unstable_now, mf = o.unstable_getCurrentPriorityLevel, zl = o.unstable_ImmediatePriority, cc = o.unstable_UserBlockingPriority, dc = o.unstable_NormalPriority, vf = o.unstable_LowPriority, Po = o.unstable_IdlePriority, gf = {}, xg = o.unstable_shouldYield, kp = lc !== void 0 ? lc : function() {
  }, sr = null, ua = null, yf = !1, Pp = uc(), _t = 1e4 > Pp ? uc : function() {
    return uc() - Pp;
  };
  function or() {
    switch (mf()) {
      case zl:
        return 99;
      case cc:
        return 98;
      case dc:
        return 97;
      case vf:
        return 96;
      case Po:
        return 95;
      default:
        throw Error(c(332));
    }
  }
  function Sn(n) {
    switch (n) {
      case 99:
        return zl;
      case 98:
        return cc;
      case 97:
        return dc;
      case 96:
        return vf;
      case 95:
        return Po;
      default:
        throw Error(c(332));
    }
  }
  function Ct(n, a) {
    return n = Sn(n), pf(n, a);
  }
  function _p(n, a, u) {
    return n = Sn(n), ko(n, a, u);
  }
  function Us(n) {
    return sr === null ? (sr = [n], ua = ko(zl, wf)) : sr.push(n), gf;
  }
  function Ii() {
    if (ua !== null) {
      var n = ua;
      ua = null, oc(n);
    }
    wf();
  }
  function wf() {
    if (!yf && sr !== null) {
      yf = !0;
      var n = 0;
      try {
        var a = sr;
        Ct(99, function() {
          for (; n < a.length; n++) {
            var u = a[n];
            do
              u = u(!0);
            while (u !== null);
          }
        }), sr = null;
      } catch (u) {
        throw sr !== null && (sr = sr.slice(n + 1)), ko(zl, Ii), u;
      } finally {
        yf = !1;
      }
    }
  }
  function jt(n, a, u) {
    return u /= 10, 1073741821 - (((1073741821 - n + a / 10) / u | 0) + 1) * u;
  }
  function fi(n, a) {
    if (n && n.defaultProps) {
      a = i({}, a), n = n.defaultProps;
      for (var u in n)
        a[u] === void 0 && (a[u] = n[u]);
    }
    return a;
  }
  var Va = { current: null }, Ha = null, Fi = null, fc = null;
  function bf() {
    fc = Fi = Ha = null;
  }
  function Sf(n) {
    var a = Va.current;
    xt(Va), n.type._context._currentValue = a;
  }
  function _o(n, a) {
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
  function hi(n, a) {
    Ha = n, fc = Fi = null, n = n.dependencies, n !== null && n.firstContext !== null && (n.expirationTime >= a && (ur = !0), n.firstContext = null);
  }
  function $i(n, a) {
    if (fc !== n && a !== !1 && a !== 0)
      if ((typeof a != "number" || a === 1073741823) && (fc = n, a = 1073741823), a = { context: n, observedBits: a, next: null }, Fi === null) {
        if (Ha === null)
          throw Error(c(308));
        Fi = a, Ha.dependencies = { expirationTime: 0, firstContext: a, responders: null };
      } else
        Fi = Fi.next = a;
    return n._currentValue;
  }
  var pi = !1;
  function hc(n) {
    n.updateQueue = { baseState: n.memoizedState, baseQueue: null, shared: { pending: null }, effects: null };
  }
  function pc(n, a) {
    n = n.updateQueue, a.updateQueue === n && (a.updateQueue = { baseState: n.baseState, baseQueue: n.baseQueue, shared: n.shared, effects: n.effects });
  }
  function Wa(n, a) {
    return n = { expirationTime: n, suspenseConfig: a, tag: 0, payload: null, callback: null, next: null }, n.next = n;
  }
  function Fa(n, a) {
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
    pi = !1;
    var S = v.baseQueue, C = v.shared.pending;
    if (C !== null) {
      if (S !== null) {
        var R = S.next;
        S.next = C.next, C.next = R;
      }
      S = C, v.shared.pending = null, R = n.alternate, R !== null && (R = R.updateQueue, R !== null && (R.baseQueue = C));
    }
    if (S !== null) {
      R = S.next;
      var H = v.baseState, U = 0, Me = null, ke = null, mt = null;
      if (R !== null) {
        var It = R;
        do {
          if (C = It.expirationTime, C < f) {
            var ki = { expirationTime: It.expirationTime, suspenseConfig: It.suspenseConfig, tag: It.tag, payload: It.payload, callback: It.callback, next: null };
            mt === null ? (ke = mt = ki, Me = H) : mt = mt.next = ki, C > U && (U = C);
          } else {
            mt !== null && (mt = mt.next = { expirationTime: 1073741823, suspenseConfig: It.suspenseConfig, tag: It.tag, payload: It.payload, callback: It.callback, next: null }), Ff(C, It.suspenseConfig);
            e: {
              var Wn = n, O = It;
              switch (C = a, ki = u, O.tag) {
                case 1:
                  if (Wn = O.payload, typeof Wn == "function") {
                    H = Wn.call(ki, H, C);
                    break e;
                  }
                  H = Wn;
                  break e;
                case 3:
                  Wn.effectTag = Wn.effectTag & -4097 | 64;
                case 0:
                  if (Wn = O.payload, C = typeof Wn == "function" ? Wn.call(ki, H, C) : Wn, C == null)
                    break e;
                  H = i({}, H, C);
                  break e;
                case 2:
                  pi = !0;
              }
            }
            It.callback !== null && (n.effectTag |= 32, C = v.effects, C === null ? v.effects = [It] : C.push(It));
          }
          if (It = It.next, It === null || It === R) {
            if (C = v.shared.pending, C === null)
              break;
            It = S.next = C.next, C.next = R, v.baseQueue = S = C, v.shared.pending = null;
          }
        } while (1);
      }
      mt === null ? Me = H : mt.next = ke, v.baseState = Me, v.baseQueue = mt, Xl(U), n.expirationTime = U, n.memoizedState = H;
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
  var Ol = Wt.ReactCurrentBatchConfig, Vs = new r.Component().refs;
  function Oo(n, a, u, f) {
    a = n.memoizedState, u = u(f, a), u = u == null ? a : i({}, a, u), n.memoizedState = u, n.expirationTime === 0 && (n.updateQueue.baseState = u);
  }
  var $a = { isMounted: function(n) {
    return (n = n._reactInternalFiber) ? fn(n) === n : !1;
  }, enqueueSetState: function(n, a, u) {
    n = n._reactInternalFiber;
    var f = zn(), v = Ol.suspense;
    f = qa(f, n, v), v = Wa(f, v), v.payload = a, u != null && (v.callback = u), Fa(n, v), Ka(n, f);
  }, enqueueReplaceState: function(n, a, u) {
    n = n._reactInternalFiber;
    var f = zn(), v = Ol.suspense;
    f = qa(f, n, v), v = Wa(f, v), v.tag = 1, v.payload = a, u != null && (v.callback = u), Fa(n, v), Ka(n, f);
  }, enqueueForceUpdate: function(n, a) {
    n = n._reactInternalFiber;
    var u = zn(), f = Ol.suspense;
    u = qa(u, n, f), f = Wa(u, f), f.tag = 2, a != null && (f.callback = a), Fa(n, f), Ka(n, u);
  } };
  function zp(n, a, u, f, v, S, C) {
    return n = n.stateNode, typeof n.shouldComponentUpdate == "function" ? n.shouldComponentUpdate(f, S, C) : a.prototype && a.prototype.isPureReactComponent ? !sa(u, f) || !sa(v, S) : !0;
  }
  function Op(n, a, u) {
    var f = !1, v = zr, S = a.contextType;
    return typeof S == "object" && S !== null ? S = $i(S) : (v = $n(a) ? Or : kn.current, f = a.contextTypes, S = (f = f != null) ? ja(n, v) : zr), a = new a(u, S), n.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = $a, n.stateNode = a, a._reactInternalFiber = n, f && (n = n.stateNode, n.__reactInternalMemoizedUnmaskedChildContext = v, n.__reactInternalMemoizedMaskedChildContext = S), a;
  }
  function mc(n, a, u, f) {
    n = a.state, typeof a.componentWillReceiveProps == "function" && a.componentWillReceiveProps(u, f), typeof a.UNSAFE_componentWillReceiveProps == "function" && a.UNSAFE_componentWillReceiveProps(u, f), a.state !== n && $a.enqueueReplaceState(a, a.state, null);
  }
  function Ll(n, a, u, f) {
    var v = n.stateNode;
    v.props = u, v.state = n.memoizedState, v.refs = Vs, hc(n);
    var S = a.contextType;
    typeof S == "object" && S !== null ? v.context = $i(S) : (S = $n(a) ? Or : kn.current, v.context = ja(n, S)), zo(n, u, v, f), v.state = n.memoizedState, S = a.getDerivedStateFromProps, typeof S == "function" && (Oo(n, a, S, u), v.state = n.memoizedState), typeof a.getDerivedStateFromProps == "function" || typeof v.getSnapshotBeforeUpdate == "function" || typeof v.UNSAFE_componentWillMount != "function" && typeof v.componentWillMount != "function" || (a = v.state, typeof v.componentWillMount == "function" && v.componentWillMount(), typeof v.UNSAFE_componentWillMount == "function" && v.UNSAFE_componentWillMount(), a !== v.state && $a.enqueueReplaceState(v, v.state, null), zo(n, u, v, f), v.state = n.memoizedState), typeof v.componentDidMount == "function" && (n.effectTag |= 4);
  }
  var Bl = Array.isArray;
  function jl(n, a, u) {
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
          var C = f.refs;
          C === Vs && (C = f.refs = {}), S === null ? delete C[v] : C[v] = S;
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
  function Lp(n) {
    function a(O, _) {
      if (n) {
        var Q = O.lastEffect;
        Q !== null ? (Q.nextEffect = _, O.lastEffect = _) : O.firstEffect = O.lastEffect = _, _.nextEffect = null, _.effectTag = 8;
      }
    }
    function u(O, _) {
      if (!n)
        return null;
      for (; _ !== null; )
        a(O, _), _ = _.sibling;
      return null;
    }
    function f(O, _) {
      for (O = /* @__PURE__ */ new Map(); _ !== null; )
        _.key !== null ? O.set(_.key, _) : O.set(_.index, _), _ = _.sibling;
      return O;
    }
    function v(O, _) {
      return O = fr(O, _), O.index = 0, O.sibling = null, O;
    }
    function S(O, _, Q) {
      return O.index = Q, n ? (Q = O.alternate, Q !== null ? (Q = Q.index, Q < _ ? (O.effectTag = 2, _) : Q) : (O.effectTag = 2, _)) : _;
    }
    function C(O) {
      return n && O.alternate === null && (O.effectTag = 2), O;
    }
    function R(O, _, Q, le) {
      return _ === null || _.tag !== 6 ? (_ = Zf(Q, O.mode, le), _.return = O, _) : (_ = v(_, Q), _.return = O, _);
    }
    function H(O, _, Q, le) {
      return _ !== null && _.elementType === Q.type ? (le = v(_, Q.props), le.ref = jl(O, _, Q), le.return = O, le) : (le = Hc(Q.type, Q.key, Q.props, null, O.mode, le), le.ref = jl(O, _, Q), le.return = O, le);
    }
    function U(O, _, Q, le) {
      return _ === null || _.tag !== 4 || _.stateNode.containerInfo !== Q.containerInfo || _.stateNode.implementation !== Q.implementation ? (_ = Yf(Q, O.mode, le), _.return = O, _) : (_ = v(_, Q.children || []), _.return = O, _);
    }
    function Me(O, _, Q, le, we) {
      return _ === null || _.tag !== 7 ? (_ = fa(Q, O.mode, le, we), _.return = O, _) : (_ = v(_, Q), _.return = O, _);
    }
    function ke(O, _, Q) {
      if (typeof _ == "string" || typeof _ == "number")
        return _ = Zf("" + _, O.mode, Q), _.return = O, _;
      if (typeof _ == "object" && _ !== null) {
        switch (_.$$typeof) {
          case Bi:
            return Q = Hc(_.type, _.key, _.props, null, O.mode, Q), Q.ref = jl(O, null, _), Q.return = O, Q;
          case ji:
            return _ = Yf(_, O.mode, Q), _.return = O, _;
        }
        if (Bl(_) || ui(_))
          return _ = fa(_, O.mode, Q, null), _.return = O, _;
        Hs(O, _);
      }
      return null;
    }
    function mt(O, _, Q, le) {
      var we = _ !== null ? _.key : null;
      if (typeof Q == "string" || typeof Q == "number")
        return we !== null ? null : R(O, _, "" + Q, le);
      if (typeof Q == "object" && Q !== null) {
        switch (Q.$$typeof) {
          case Bi:
            return Q.key === we ? Q.type === Ae ? Me(O, _, Q.props.children, le, we) : H(O, _, Q, le) : null;
          case ji:
            return Q.key === we ? U(O, _, Q, le) : null;
        }
        if (Bl(Q) || ui(Q))
          return we !== null ? null : Me(O, _, Q, le, null);
        Hs(O, Q);
      }
      return null;
    }
    function It(O, _, Q, le, we) {
      if (typeof le == "string" || typeof le == "number")
        return O = O.get(Q) || null, R(_, O, "" + le, we);
      if (typeof le == "object" && le !== null) {
        switch (le.$$typeof) {
          case Bi:
            return O = O.get(le.key === null ? Q : le.key) || null, le.type === Ae ? Me(_, O, le.props.children, we, le.key) : H(_, O, le, we);
          case ji:
            return O = O.get(le.key === null ? Q : le.key) || null, U(_, O, le, we);
        }
        if (Bl(le) || ui(le))
          return O = O.get(Q) || null, Me(_, O, le, we, null);
        Hs(_, le);
      }
      return null;
    }
    function ki(O, _, Q, le) {
      for (var we = null, Pe = null, Je = _, wt = _ = 0, ln = null; Je !== null && wt < Q.length; wt++) {
        Je.index > wt ? (ln = Je, Je = null) : ln = Je.sibling;
        var ut = mt(O, Je, Q[wt], le);
        if (ut === null) {
          Je === null && (Je = ln);
          break;
        }
        n && Je && ut.alternate === null && a(O, Je), _ = S(ut, _, wt), Pe === null ? we = ut : Pe.sibling = ut, Pe = ut, Je = ln;
      }
      if (wt === Q.length)
        return u(O, Je), we;
      if (Je === null) {
        for (; wt < Q.length; wt++)
          Je = ke(O, Q[wt], le), Je !== null && (_ = S(Je, _, wt), Pe === null ? we = Je : Pe.sibling = Je, Pe = Je);
        return we;
      }
      for (Je = f(O, Je); wt < Q.length; wt++)
        ln = It(Je, O, wt, Q[wt], le), ln !== null && (n && ln.alternate !== null && Je.delete(ln.key === null ? wt : ln.key), _ = S(ln, _, wt), Pe === null ? we = ln : Pe.sibling = ln, Pe = ln);
      return n && Je.forEach(function(is) {
        return a(O, is);
      }), we;
    }
    function Wn(O, _, Q, le) {
      var we = ui(Q);
      if (typeof we != "function")
        throw Error(c(150));
      if (Q = we.call(Q), Q == null)
        throw Error(c(151));
      for (var Pe = we = null, Je = _, wt = _ = 0, ln = null, ut = Q.next(); Je !== null && !ut.done; wt++, ut = Q.next()) {
        Je.index > wt ? (ln = Je, Je = null) : ln = Je.sibling;
        var is = mt(O, Je, ut.value, le);
        if (is === null) {
          Je === null && (Je = ln);
          break;
        }
        n && Je && is.alternate === null && a(O, Je), _ = S(is, _, wt), Pe === null ? we = is : Pe.sibling = is, Pe = is, Je = ln;
      }
      if (ut.done)
        return u(O, Je), we;
      if (Je === null) {
        for (; !ut.done; wt++, ut = Q.next())
          ut = ke(O, ut.value, le), ut !== null && (_ = S(ut, _, wt), Pe === null ? we = ut : Pe.sibling = ut, Pe = ut);
        return we;
      }
      for (Je = f(O, Je); !ut.done; wt++, ut = Q.next())
        ut = It(Je, O, wt, ut.value, le), ut !== null && (n && ut.alternate !== null && Je.delete(ut.key === null ? wt : ut.key), _ = S(ut, _, wt), Pe === null ? we = ut : Pe.sibling = ut, Pe = ut);
      return n && Je.forEach(function(jg) {
        return a(O, jg);
      }), we;
    }
    return function(O, _, Q, le) {
      var we = typeof Q == "object" && Q !== null && Q.type === Ae && Q.key === null;
      we && (Q = Q.props.children);
      var Pe = typeof Q == "object" && Q !== null;
      if (Pe)
        switch (Q.$$typeof) {
          case Bi:
            e: {
              for (Pe = Q.key, we = _; we !== null; ) {
                if (we.key === Pe) {
                  switch (we.tag) {
                    case 7:
                      if (Q.type === Ae) {
                        u(O, we.sibling), _ = v(we, Q.props.children), _.return = O, O = _;
                        break e;
                      }
                      break;
                    default:
                      if (we.elementType === Q.type) {
                        u(
                          O,
                          we.sibling
                        ), _ = v(we, Q.props), _.ref = jl(O, we, Q), _.return = O, O = _;
                        break e;
                      }
                  }
                  u(O, we);
                  break;
                } else
                  a(O, we);
                we = we.sibling;
              }
              Q.type === Ae ? (_ = fa(Q.props.children, O.mode, le, Q.key), _.return = O, O = _) : (le = Hc(Q.type, Q.key, Q.props, null, O.mode, le), le.ref = jl(O, _, Q), le.return = O, O = le);
            }
            return C(O);
          case ji:
            e: {
              for (we = Q.key; _ !== null; ) {
                if (_.key === we)
                  if (_.tag === 4 && _.stateNode.containerInfo === Q.containerInfo && _.stateNode.implementation === Q.implementation) {
                    u(O, _.sibling), _ = v(_, Q.children || []), _.return = O, O = _;
                    break e;
                  } else {
                    u(O, _);
                    break;
                  }
                else
                  a(O, _);
                _ = _.sibling;
              }
              _ = Yf(Q, O.mode, le), _.return = O, O = _;
            }
            return C(O);
        }
      if (typeof Q == "string" || typeof Q == "number")
        return Q = "" + Q, _ !== null && _.tag === 6 ? (u(O, _.sibling), _ = v(_, Q), _.return = O, O = _) : (u(O, _), _ = Zf(Q, O.mode, le), _.return = O, O = _), C(O);
      if (Bl(Q))
        return ki(O, _, Q, le);
      if (ui(Q))
        return Wn(O, _, Q, le);
      if (Pe && Hs(O, Q), typeof Q > "u" && !we)
        switch (O.tag) {
          case 1:
          case 0:
            throw O = O.type, Error(c(152, O.displayName || O.name || "Component"));
        }
      return u(O, _);
    };
  }
  var Lo = Lp(!0), Tf = Lp(!1), Ul = {}, Lr = { current: Ul }, Vl = { current: Ul }, Bo = { current: Ul };
  function Ws(n) {
    if (n === Ul)
      throw Error(c(174));
    return n;
  }
  function vc(n, a) {
    switch (an(Bo, a), an(Vl, n), an(Lr, Ul), n = a.nodeType, n) {
      case 9:
      case 11:
        a = (a = a.documentElement) ? a.namespaceURI : Nn(null, "");
        break;
      default:
        n = n === 8 ? a.parentNode : a, a = n.namespaceURI || null, n = n.tagName, a = Nn(a, n);
    }
    xt(Lr), an(Lr, a);
  }
  function jo() {
    xt(Lr), xt(Vl), xt(Bo);
  }
  function Mf(n) {
    Ws(Bo.current);
    var a = Ws(Lr.current), u = Nn(a, n.type);
    a !== u && (an(Vl, n), an(Lr, u));
  }
  function Ef(n) {
    Vl.current === n && (xt(Lr), xt(Vl));
  }
  var Kt = { current: 0 };
  function gc(n) {
    for (var a = n; a !== null; ) {
      if (a.tag === 13) {
        var u = a.memoizedState;
        if (u !== null && (u = u.dehydrated, u === null || u.data === $u || u.data === gl))
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
  var wc = Wt.ReactCurrentDispatcher, mi = Wt.ReactCurrentBatchConfig, Qn = 0, $t = null, sn = null, on = null, Qa = !1;
  function Hn() {
    throw Error(c(321));
  }
  function Fs(n, a) {
    if (a === null)
      return !1;
    for (var u = 0; u < a.length && u < n.length; u++)
      if (!Mi(n[u], a[u]))
        return !1;
    return !0;
  }
  function If(n, a, u, f, v, S) {
    if (Qn = S, $t = a, a.memoizedState = null, a.updateQueue = null, a.expirationTime = 0, wc.current = n === null || n.memoizedState === null ? Cg : Tg, n = u(f, v), a.expirationTime === Qn) {
      S = 0;
      do {
        if (a.expirationTime = 0, !(25 > S))
          throw Error(c(301));
        S += 1, on = sn = null, a.updateQueue = null, wc.current = Mg, n = u(f, v);
      } while (a.expirationTime === Qn);
    }
    if (wc.current = Ic, a = sn !== null && sn.next !== null, Qn = 0, on = sn = $t = null, Qa = !1, a)
      throw Error(c(300));
    return n;
  }
  function $s() {
    var n = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
    return on === null ? $t.memoizedState = on = n : on = on.next = n, on;
  }
  function Uo() {
    if (sn === null) {
      var n = $t.alternate;
      n = n !== null ? n.memoizedState : null;
    } else
      n = sn.next;
    var a = on === null ? $t.memoizedState : on.next;
    if (a !== null)
      on = a, sn = n;
    else {
      if (n === null)
        throw Error(c(310));
      sn = n, n = { memoizedState: sn.memoizedState, baseState: sn.baseState, baseQueue: sn.baseQueue, queue: sn.queue, next: null }, on === null ? $t.memoizedState = on = n : on = on.next = n;
    }
    return on;
  }
  function Za(n, a) {
    return typeof a == "function" ? a(n) : a;
  }
  function Hl(n) {
    var a = Uo(), u = a.queue;
    if (u === null)
      throw Error(c(311));
    u.lastRenderedReducer = n;
    var f = sn, v = f.baseQueue, S = u.pending;
    if (S !== null) {
      if (v !== null) {
        var C = v.next;
        v.next = S.next, S.next = C;
      }
      f.baseQueue = v = S, u.pending = null;
    }
    if (v !== null) {
      v = v.next, f = f.baseState;
      var R = C = S = null, H = v;
      do {
        var U = H.expirationTime;
        if (U < Qn) {
          var Me = { expirationTime: H.expirationTime, suspenseConfig: H.suspenseConfig, action: H.action, eagerReducer: H.eagerReducer, eagerState: H.eagerState, next: null };
          R === null ? (C = R = Me, S = f) : R = R.next = Me, U > $t.expirationTime && ($t.expirationTime = U, Xl(U));
        } else
          R !== null && (R = R.next = { expirationTime: 1073741823, suspenseConfig: H.suspenseConfig, action: H.action, eagerReducer: H.eagerReducer, eagerState: H.eagerState, next: null }), Ff(U, H.suspenseConfig), f = H.eagerReducer === n ? H.eagerState : n(f, H.action);
        H = H.next;
      } while (H !== null && H !== v);
      R === null ? S = f : R.next = C, Mi(f, a.memoizedState) || (ur = !0), a.memoizedState = f, a.baseState = S, a.baseQueue = R, u.lastRenderedState = f;
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
      var C = v = v.next;
      do
        S = n(S, C.action), C = C.next;
      while (C !== v);
      Mi(S, a.memoizedState) || (ur = !0), a.memoizedState = S, a.baseQueue === null && (a.baseState = S), u.lastRenderedState = S;
    }
    return [S, f];
  }
  function Sc(n) {
    var a = $s();
    return typeof n == "function" && (n = n()), a.memoizedState = a.baseState = n, n = a.queue = { pending: null, dispatch: null, lastRenderedReducer: Za, lastRenderedState: n }, n = n.dispatch = Ec.bind(null, $t, n), [a.memoizedState, n];
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
    if (sn !== null) {
      var C = sn.memoizedState;
      if (S = C.destroy, f !== null && Fs(f, C.deps)) {
        xc(a, u, S, f);
        return;
      }
    }
    $t.effectTag |= n, v.memoizedState = xc(1 | a, u, S, f);
  }
  function Bp(n, a) {
    return Qs(516, 4, n, a);
  }
  function Zs(n, a) {
    return Rf(516, 4, n, a);
  }
  function Df(n, a) {
    return Rf(4, 2, n, a);
  }
  function jp(n, a) {
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
    return u = u != null ? u.concat([n]) : null, Rf(4, 2, jp.bind(null, a, n), u);
  }
  function Cc() {
  }
  function Up(n, a) {
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
    var f = or();
    Ct(98 > f ? 98 : f, function() {
      n(!0);
    }), Ct(97 < f ? 97 : f, function() {
      var v = mi.suspense;
      mi.suspense = a === void 0 ? null : a;
      try {
        n(!1), u();
      } finally {
        mi.suspense = v;
      }
    });
  }
  function Ec(n, a, u) {
    var f = zn(), v = Ol.suspense;
    f = qa(f, n, v), v = { expirationTime: f, suspenseConfig: v, action: u, eagerReducer: null, eagerState: null, next: null };
    var S = a.pending;
    if (S === null ? v.next = v : (v.next = S.next, S.next = v), a.pending = v, S = n.alternate, n === $t || S !== null && S === $t)
      Qa = !0, v.expirationTime = Qn, $t.expirationTime = Qn;
    else {
      if (n.expirationTime === 0 && (S === null || S.expirationTime === 0) && (S = a.lastRenderedReducer, S !== null))
        try {
          var C = a.lastRenderedState, R = S(C, u);
          if (v.eagerReducer = S, v.eagerState = R, Mi(R, C))
            return;
        } catch {
        } finally {
        }
      Ka(
        n,
        f
      );
    }
  }
  var Ic = { readContext: $i, useCallback: Hn, useContext: Hn, useEffect: Hn, useImperativeHandle: Hn, useLayoutEffect: Hn, useMemo: Hn, useReducer: Hn, useRef: Hn, useState: Hn, useDebugValue: Hn, useResponder: Hn, useDeferredValue: Hn, useTransition: Hn }, Cg = { readContext: $i, useCallback: Up, useContext: $i, useEffect: Bp, useImperativeHandle: function(n, a, u) {
    return u = u != null ? u.concat([n]) : null, Qs(4, 2, jp.bind(null, a, n), u);
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
    return Bp(function() {
      var S = mi.suspense;
      mi.suspense = a === void 0 ? null : a;
      try {
        v(n);
      } finally {
        mi.suspense = S;
      }
    }, [n, a]), f;
  }, useTransition: function(n) {
    var a = Sc(!1), u = a[0];
    return a = a[1], [Up(Mc.bind(null, a, n), [a, n]), u];
  } }, Tg = { readContext: $i, useCallback: Tc, useContext: $i, useEffect: Zs, useImperativeHandle: Vo, useLayoutEffect: Df, useMemo: Nf, useReducer: Hl, useRef: Af, useState: function() {
    return Hl(Za);
  }, useDebugValue: Cc, useResponder: yc, useDeferredValue: function(n, a) {
    var u = Hl(Za), f = u[0], v = u[1];
    return Zs(function() {
      var S = mi.suspense;
      mi.suspense = a === void 0 ? null : a;
      try {
        v(n);
      } finally {
        mi.suspense = S;
      }
    }, [n, a]), f;
  }, useTransition: function(n) {
    var a = Hl(Za), u = a[0];
    return a = a[1], [Tc(Mc.bind(null, a, n), [a, n]), u];
  } }, Mg = { readContext: $i, useCallback: Tc, useContext: $i, useEffect: Zs, useImperativeHandle: Vo, useLayoutEffect: Df, useMemo: Nf, useReducer: bc, useRef: Af, useState: function() {
    return bc(Za);
  }, useDebugValue: Cc, useResponder: yc, useDeferredValue: function(n, a) {
    var u = bc(Za), f = u[0], v = u[1];
    return Zs(function() {
      var S = mi.suspense;
      mi.suspense = a === void 0 ? null : a;
      try {
        v(n);
      } finally {
        mi.suspense = S;
      }
    }, [n, a]), f;
  }, useTransition: function(n) {
    var a = bc(Za), u = a[0];
    return a = a[1], [Tc(Mc.bind(
      null,
      a,
      n
    ), [a, n]), u];
  } }, lr = null, Ya = null, Ys = !1;
  function Vp(n, a) {
    var u = Ur(5, null, null, 0);
    u.elementType = "DELETED", u.type = "DELETED", u.stateNode = a, u.return = n, u.effectTag = 8, n.lastEffect !== null ? (n.lastEffect.nextEffect = u, n.lastEffect = u) : n.firstEffect = n.lastEffect = u;
  }
  function Hp(n, a) {
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
  function Wl(n) {
    if (Ys) {
      var a = Ya;
      if (a) {
        var u = a;
        if (!Hp(n, a)) {
          if (a = Mo(u.nextSibling), !a || !Hp(n, a)) {
            n.effectTag = n.effectTag & -1025 | 2, Ys = !1, lr = n;
            return;
          }
          Vp(lr, u);
        }
        lr = n, Ya = Mo(a.firstChild);
      } else
        n.effectTag = n.effectTag & -1025 | 2, Ys = !1, lr = n;
    }
  }
  function kf(n) {
    for (n = n.return; n !== null && n.tag !== 5 && n.tag !== 3 && n.tag !== 13; )
      n = n.return;
    lr = n;
  }
  function Ac(n) {
    if (n !== lr)
      return !1;
    if (!Ys)
      return kf(n), Ys = !0, !1;
    var a = n.type;
    if (n.tag !== 5 || a !== "head" && a !== "body" && !yl(a, n.memoizedProps))
      for (a = Ya; a; )
        Vp(n, a), a = Mo(a.nextSibling);
    if (kf(n), n.tag === 13) {
      if (n = n.memoizedState, n = n !== null ? n.dehydrated : null, !n)
        throw Error(c(317));
      e: {
        for (n = n.nextSibling, a = 0; n; ) {
          if (n.nodeType === 8) {
            var u = n.data;
            if (u === Hd) {
              if (a === 0) {
                Ya = Mo(n.nextSibling);
                break e;
              }
              a--;
            } else
              u !== Fu && u !== gl && u !== $u || a++;
          }
          n = n.nextSibling;
        }
        Ya = null;
      }
    } else
      Ya = lr ? Mo(n.stateNode.nextSibling) : null;
    return !0;
  }
  function Yt() {
    Ya = lr = null, Ys = !1;
  }
  var Rc = Wt.ReactCurrentOwner, ur = !1;
  function Ai(n, a, u, f) {
    a.child = n === null ? Tf(a, null, u, f) : Lo(a, n.child, u, f);
  }
  function Wp(n, a, u, f, v) {
    u = u.render;
    var S = a.ref;
    return hi(a, v), f = If(n, a, u, f, S, v), n !== null && !ur ? (a.updateQueue = n.updateQueue, a.effectTag &= -517, n.expirationTime <= v && (n.expirationTime = 0), ca(n, a, v)) : (a.effectTag |= 1, Ai(n, a, f, v), a.child);
  }
  function Fl(n, a, u, f, v, S) {
    if (n === null) {
      var C = u.type;
      return typeof C == "function" && !Qf(C) && C.defaultProps === void 0 && u.compare === null && u.defaultProps === void 0 ? (a.tag = 15, a.type = C, Dc(n, a, C, f, v, S)) : (n = Hc(u.type, null, f, null, a.mode, S), n.ref = a.ref, n.return = a, a.child = n);
    }
    return C = n.child, v < S && (v = C.memoizedProps, u = u.compare, u = u !== null ? u : sa, u(v, f) && n.ref === a.ref) ? ca(n, a, S) : (a.effectTag |= 1, n = fr(C, f), n.ref = a.ref, n.return = a, a.child = n);
  }
  function Dc(n, a, u, f, v, S) {
    return n !== null && sa(n.memoizedProps, f) && n.ref === a.ref && (ur = !1, v < S) ? (a.expirationTime = n.expirationTime, ca(n, a, S)) : Gs(n, a, u, f, S);
  }
  function Fp(n, a) {
    var u = a.ref;
    (n === null && u !== null || n !== null && n.ref !== u) && (a.effectTag |= 128);
  }
  function Gs(n, a, u, f, v) {
    var S = $n(u) ? Or : kn.current;
    return S = ja(a, S), hi(a, v), u = If(n, a, u, f, S, v), n !== null && !ur ? (a.updateQueue = n.updateQueue, a.effectTag &= -517, n.expirationTime <= v && (n.expirationTime = 0), ca(n, a, v)) : (a.effectTag |= 1, Ai(n, a, u, v), a.child);
  }
  function $p(n, a, u, f, v) {
    if ($n(u)) {
      var S = !0;
      No(a);
    } else
      S = !1;
    if (hi(a, v), a.stateNode === null)
      n !== null && (n.alternate = null, a.alternate = null, a.effectTag |= 2), Op(a, u, f), Ll(a, u, f, v), f = !0;
    else if (n === null) {
      var C = a.stateNode, R = a.memoizedProps;
      C.props = R;
      var H = C.context, U = u.contextType;
      typeof U == "object" && U !== null ? U = $i(U) : (U = $n(u) ? Or : kn.current, U = ja(a, U));
      var Me = u.getDerivedStateFromProps, ke = typeof Me == "function" || typeof C.getSnapshotBeforeUpdate == "function";
      ke || typeof C.UNSAFE_componentWillReceiveProps != "function" && typeof C.componentWillReceiveProps != "function" || (R !== f || H !== U) && mc(a, C, f, U), pi = !1;
      var mt = a.memoizedState;
      C.state = mt, zo(a, f, C, v), H = a.memoizedState, R !== f || mt !== H || Tn.current || pi ? (typeof Me == "function" && (Oo(a, u, Me, f), H = a.memoizedState), (R = pi || zp(a, u, R, f, mt, H, U)) ? (ke || typeof C.UNSAFE_componentWillMount != "function" && typeof C.componentWillMount != "function" || (typeof C.componentWillMount == "function" && C.componentWillMount(), typeof C.UNSAFE_componentWillMount == "function" && C.UNSAFE_componentWillMount()), typeof C.componentDidMount == "function" && (a.effectTag |= 4)) : (typeof C.componentDidMount == "function" && (a.effectTag |= 4), a.memoizedProps = f, a.memoizedState = H), C.props = f, C.state = H, C.context = U, f = R) : (typeof C.componentDidMount == "function" && (a.effectTag |= 4), f = !1);
    } else
      C = a.stateNode, pc(n, a), R = a.memoizedProps, C.props = a.type === a.elementType ? R : fi(a.type, R), H = C.context, U = u.contextType, typeof U == "object" && U !== null ? U = $i(U) : (U = $n(u) ? Or : kn.current, U = ja(a, U)), Me = u.getDerivedStateFromProps, (ke = typeof Me == "function" || typeof C.getSnapshotBeforeUpdate == "function") || typeof C.UNSAFE_componentWillReceiveProps != "function" && typeof C.componentWillReceiveProps != "function" || (R !== f || H !== U) && mc(a, C, f, U), pi = !1, H = a.memoizedState, C.state = H, zo(a, f, C, v), mt = a.memoizedState, R !== f || H !== mt || Tn.current || pi ? (typeof Me == "function" && (Oo(a, u, Me, f), mt = a.memoizedState), (Me = pi || zp(a, u, R, f, H, mt, U)) ? (ke || typeof C.UNSAFE_componentWillUpdate != "function" && typeof C.componentWillUpdate != "function" || (typeof C.componentWillUpdate == "function" && C.componentWillUpdate(
        f,
        mt,
        U
      ), typeof C.UNSAFE_componentWillUpdate == "function" && C.UNSAFE_componentWillUpdate(f, mt, U)), typeof C.componentDidUpdate == "function" && (a.effectTag |= 4), typeof C.getSnapshotBeforeUpdate == "function" && (a.effectTag |= 256)) : (typeof C.componentDidUpdate != "function" || R === n.memoizedProps && H === n.memoizedState || (a.effectTag |= 4), typeof C.getSnapshotBeforeUpdate != "function" || R === n.memoizedProps && H === n.memoizedState || (a.effectTag |= 256), a.memoizedProps = f, a.memoizedState = mt), C.props = f, C.state = mt, C.context = U, f = Me) : (typeof C.componentDidUpdate != "function" || R === n.memoizedProps && H === n.memoizedState || (a.effectTag |= 4), typeof C.getSnapshotBeforeUpdate != "function" || R === n.memoizedProps && H === n.memoizedState || (a.effectTag |= 256), f = !1);
    return Pf(n, a, u, f, S, v);
  }
  function Pf(n, a, u, f, v, S) {
    Fp(n, a);
    var C = (a.effectTag & 64) !== 0;
    if (!f && !C)
      return v && _l(a, u, !1), ca(n, a, S);
    f = a.stateNode, Rc.current = a;
    var R = C && typeof u.getDerivedStateFromError != "function" ? null : f.render();
    return a.effectTag |= 1, n !== null && C ? (a.child = Lo(a, n.child, null, S), a.child = Lo(a, null, R, S)) : Ai(n, a, R, S), a.memoizedState = f.state, v && _l(a, u, !0), a.child;
  }
  function Nc(n) {
    var a = n.stateNode;
    a.pendingContext ? sc(n, a.pendingContext, a.pendingContext !== a.context) : a.context && sc(n, a.context, !1), vc(n, a.containerInfo);
  }
  var _f = { dehydrated: null, retryTime: 0 };
  function Qp(n, a, u) {
    var f = a.mode, v = a.pendingProps, S = Kt.current, C = !1, R;
    if ((R = (a.effectTag & 64) !== 0) || (R = (S & 2) !== 0 && (n === null || n.memoizedState !== null)), R ? (C = !0, a.effectTag &= -65) : n !== null && n.memoizedState === null || v.fallback === void 0 || v.unstable_avoidThisFallback === !0 || (S |= 1), an(Kt, S & 1), n === null) {
      if (v.fallback !== void 0 && Wl(a), C) {
        if (C = v.fallback, v = fa(null, f, 0, null), v.return = a, (a.mode & 2) === 0)
          for (n = a.memoizedState !== null ? a.child.child : a.child, v.child = n; n !== null; )
            n.return = v, n = n.sibling;
        return u = fa(C, f, u, null), u.return = a, v.sibling = u, a.memoizedState = _f, a.child = v, u;
      }
      return f = v.children, a.memoizedState = null, a.child = Tf(a, null, f, u);
    }
    if (n.memoizedState !== null) {
      if (n = n.child, f = n.sibling, C) {
        if (v = v.fallback, u = fr(n, n.pendingProps), u.return = a, (a.mode & 2) === 0 && (C = a.memoizedState !== null ? a.child.child : a.child, C !== n.child))
          for (u.child = C; C !== null; )
            C.return = u, C = C.sibling;
        return f = fr(f, v), f.return = a, u.sibling = f, u.childExpirationTime = 0, a.memoizedState = _f, a.child = u, f;
      }
      return u = Lo(a, n.child, v.children, u), a.memoizedState = null, a.child = u;
    }
    if (n = n.child, C) {
      if (C = v.fallback, v = fa(null, f, 0, null), v.return = a, v.child = n, n !== null && (n.return = v), (a.mode & 2) === 0)
        for (n = a.memoizedState !== null ? a.child.child : a.child, v.child = n; n !== null; )
          n.return = v, n = n.sibling;
      return u = fa(C, f, u, null), u.return = a, v.sibling = u, u.effectTag |= 2, v.childExpirationTime = 0, a.memoizedState = _f, a.child = v, u;
    }
    return a.memoizedState = null, a.child = Lo(a, n, v.children, u);
  }
  function Zp(n, a) {
    n.expirationTime < a && (n.expirationTime = a);
    var u = n.alternate;
    u !== null && u.expirationTime < a && (u.expirationTime = a), _o(n.return, a);
  }
  function kc(n, a, u, f, v, S) {
    var C = n.memoizedState;
    C === null ? n.memoizedState = { isBackwards: a, rendering: null, renderingStartTime: 0, last: f, tail: u, tailExpiration: 0, tailMode: v, lastEffect: S } : (C.isBackwards = a, C.rendering = null, C.renderingStartTime = 0, C.last = f, C.tail = u, C.tailExpiration = 0, C.tailMode = v, C.lastEffect = S);
  }
  function Yp(n, a, u) {
    var f = a.pendingProps, v = f.revealOrder, S = f.tail;
    if (Ai(n, a, f.children, u), f = Kt.current, (f & 2) !== 0)
      f = f & 1 | 2, a.effectTag |= 64;
    else {
      if (n !== null && (n.effectTag & 64) !== 0)
        e:
          for (n = a.child; n !== null; ) {
            if (n.tag === 13)
              n.memoizedState !== null && Zp(n, u);
            else if (n.tag === 19)
              Zp(n, u);
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
    if (an(Kt, f), (a.mode & 2) === 0)
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
    if (f !== 0 && Xl(f), a.childExpirationTime < u)
      return null;
    if (n !== null && a.child !== n.child)
      throw Error(c(153));
    if (a.child !== null) {
      for (n = a.child, u = fr(n, n.pendingProps), a.child = u, u.return = a; n.sibling !== null; )
        n = n.sibling, u = u.sibling = fr(n, n.pendingProps), u.return = a;
      u.sibling = null;
    }
    return a.child;
  }
  var Gp, Pc, Xs, _c;
  Gp = function(n, a) {
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
  }, Pc = function() {
  }, Xs = function(n, a, u, f, v) {
    var S = n.memoizedProps;
    if (S !== f) {
      var C = a.stateNode;
      switch (Ws(Lr.current), n = null, u) {
        case "input":
          S = mn(C, S), f = mn(C, f), n = [];
          break;
        case "option":
          S = Ti(C, S), f = Ti(C, f), n = [];
          break;
        case "select":
          S = i({}, S, { value: void 0 }), f = i({}, f, { value: void 0 }), n = [];
          break;
        case "textarea":
          S = Jr(C, S), f = Jr(C, f), n = [];
          break;
        default:
          typeof S.onClick != "function" && typeof f.onClick == "function" && (C.onclick = Ds);
      }
      Vu(u, f);
      var R, H;
      u = null;
      for (R in S)
        if (!f.hasOwnProperty(R) && S.hasOwnProperty(R) && S[R] != null)
          if (R === "style")
            for (H in C = S[R], C)
              C.hasOwnProperty(H) && (u || (u = {}), u[H] = "");
          else
            R !== "dangerouslySetInnerHTML" && R !== "children" && R !== "suppressContentEditableWarning" && R !== "suppressHydrationWarning" && R !== "autoFocus" && (Le.hasOwnProperty(R) ? n || (n = []) : (n = n || []).push(R, null));
      for (R in f) {
        var U = f[R];
        if (C = S != null ? S[R] : void 0, f.hasOwnProperty(R) && U !== C && (U != null || C != null))
          if (R === "style")
            if (C) {
              for (H in C)
                !C.hasOwnProperty(H) || U && U.hasOwnProperty(H) || (u || (u = {}), u[H] = "");
              for (H in U)
                U.hasOwnProperty(H) && C[H] !== U[H] && (u || (u = {}), u[H] = U[H]);
            } else
              u || (n || (n = []), n.push(R, u)), u = U;
          else
            R === "dangerouslySetInnerHTML" ? (U = U ? U.__html : void 0, C = C ? C.__html : void 0, U != null && C !== U && (n = n || []).push(R, U)) : R === "children" ? C === U || typeof U != "string" && typeof U != "number" || (n = n || []).push(R, "" + U) : R !== "suppressContentEditableWarning" && R !== "suppressHydrationWarning" && (Le.hasOwnProperty(R) ? (U != null && ia(v, R), n || C === U || (n = [])) : (n = n || []).push(R, U));
      }
      u && (n = n || []).push("style", u), v = n, (a.updateQueue = v) && (a.effectTag |= 4);
    }
  }, _c = function(n, a, u, f) {
    u !== f && (a.effectTag |= 4);
  };
  function $l(n, a) {
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
  function Xp(n, a, u) {
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
        return $n(a.type) && Ua(), null;
      case 3:
        return jo(), xt(Tn), xt(kn), u = a.stateNode, u.pendingContext && (u.context = u.pendingContext, u.pendingContext = null), n !== null && n.child !== null || !Ac(a) || (a.effectTag |= 4), Pc(a), null;
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
          if (n = Ws(Lr.current), Ac(a)) {
            f = a.stateNode, v = a.type;
            var S = a.memoizedProps;
            switch (f[kr] = a, f[Eo] = S, v) {
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
                Jn(f, S), ft("invalid", f), ia(u, "onChange");
                break;
              case "select":
                f._wrapperState = { wasMultiple: !!S.multiple }, ft("invalid", f), ia(u, "onChange");
                break;
              case "textarea":
                Ra(f, S), ft("invalid", f), ia(u, "onChange");
            }
            Vu(v, S), n = null;
            for (var C in S)
              if (S.hasOwnProperty(C)) {
                var R = S[C];
                C === "children" ? typeof R == "string" ? f.textContent !== R && (n = ["children", R]) : typeof R == "number" && f.textContent !== "" + R && (n = ["children", "" + R]) : Le.hasOwnProperty(C) && R != null && ia(u, C);
              }
            switch (v) {
              case "input":
                Mr(f), nn(f, S, !0);
                break;
              case "textarea":
                Mr(f), wo(f);
                break;
              case "select":
              case "option":
                break;
              default:
                typeof S.onClick == "function" && (f.onclick = Ds);
            }
            u = n, a.updateQueue = u, u !== null && (a.effectTag |= 4);
          } else {
            switch (C = u.nodeType === 9 ? u : u.ownerDocument, n === xp && (n = Da(v)), n === xp ? v === "script" ? (n = C.createElement("div"), n.innerHTML = "<script><\/script>", n = n.removeChild(n.firstChild)) : typeof f.is == "string" ? n = C.createElement(v, { is: f.is }) : (n = C.createElement(v), v === "select" && (C = n, f.multiple ? C.multiple = !0 : f.size && (C.size = f.size))) : n = C.createElementNS(n, v), n[kr] = a, n[Eo] = f, Gp(n, a, !1, !1), a.stateNode = n, C = Ld(v, f), v) {
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
                Jn(n, f), R = mn(n, f), ft("invalid", n), ia(u, "onChange");
                break;
              case "option":
                R = Ti(n, f);
                break;
              case "select":
                n._wrapperState = { wasMultiple: !!f.multiple }, R = i({}, f, { value: void 0 }), ft("invalid", n), ia(u, "onChange");
                break;
              case "textarea":
                Ra(
                  n,
                  f
                ), R = Jr(n, f), ft("invalid", n), ia(u, "onChange");
                break;
              default:
                R = f;
            }
            Vu(v, R);
            var H = R;
            for (S in H)
              if (H.hasOwnProperty(S)) {
                var U = H[S];
                S === "style" ? bp(n, U) : S === "dangerouslySetInnerHTML" ? (U = U ? U.__html : void 0, U != null && qr(n, U)) : S === "children" ? typeof U == "string" ? (v !== "textarea" || U !== "") && Kn(n, U) : typeof U == "number" && Kn(n, "" + U) : S !== "suppressContentEditableWarning" && S !== "suppressHydrationWarning" && S !== "autoFocus" && (Le.hasOwnProperty(S) ? U != null && ia(u, S) : U != null && St(n, S, U, C));
              }
            switch (v) {
              case "input":
                Mr(n), nn(n, f, !1);
                break;
              case "textarea":
                Mr(n), wo(n);
                break;
              case "option":
                f.value != null && n.setAttribute("value", "" + xi(f.value));
                break;
              case "select":
                n.multiple = !!f.multiple, u = f.value, u != null ? qn(n, !!f.multiple, u, !1) : f.defaultValue != null && qn(n, !!f.multiple, f.defaultValue, !0);
                break;
              default:
                typeof R.onClick == "function" && (n.onclick = Ds);
            }
            Cp(v, f) && (a.effectTag |= 4);
          }
          a.ref !== null && (a.effectTag |= 128);
        }
        return null;
      case 6:
        if (n && a.stateNode != null)
          _c(n, a, n.memoizedProps, f);
        else {
          if (typeof f != "string" && a.stateNode === null)
            throw Error(c(166));
          u = Ws(Bo.current), Ws(Lr.current), Ac(a) ? (u = a.stateNode, f = a.memoizedProps, u[kr] = a, u.nodeValue !== f && (a.effectTag |= 4)) : (u = (u.nodeType === 9 ? u : u.ownerDocument).createTextNode(f), u[kr] = a, a.stateNode = u);
        }
        return null;
      case 13:
        return xt(Kt), f = a.memoizedState, (a.effectTag & 64) !== 0 ? (a.expirationTime = u, a) : (u = f !== null, f = !1, n === null ? a.memoizedProps.fallback !== void 0 && Ac(a) : (v = n.memoizedState, f = v !== null, u || v === null || (v = n.child.sibling, v !== null && (S = a.firstEffect, S !== null ? (a.firstEffect = v, v.nextEffect = S) : (a.firstEffect = a.lastEffect = v, v.nextEffect = null), v.effectTag = 8))), u && !f && (a.mode & 2) !== 0 && (n === null && a.memoizedProps.unstable_avoidThisFallback !== !0 || (Kt.current & 1) !== 0 ? pn === Ga && (pn = Yl) : ((pn === Ga || pn === Yl) && (pn = Lc), cr !== 0 && Ri !== null && (io(Ri, Ut), Gf(Ri, cr)))), (u || f) && (a.effectTag |= 4), null);
      case 4:
        return jo(), Pc(a), null;
      case 10:
        return Sf(a), null;
      case 17:
        return $n(a.type) && Ua(), null;
      case 19:
        if (xt(Kt), f = a.memoizedState, f === null)
          return null;
        if (v = (a.effectTag & 64) !== 0, S = f.rendering, S === null) {
          if (v)
            $l(f, !1);
          else if (pn !== Ga || n !== null && (n.effectTag & 64) !== 0)
            for (S = a.child; S !== null; ) {
              if (n = gc(S), n !== null) {
                for (a.effectTag |= 64, $l(f, !1), v = n.updateQueue, v !== null && (a.updateQueue = v, a.effectTag |= 4), f.lastEffect === null && (a.firstEffect = null), a.lastEffect = f.lastEffect, f = a.child; f !== null; )
                  v = f, S = u, v.effectTag &= 2, v.nextEffect = null, v.firstEffect = null, v.lastEffect = null, n = v.alternate, n === null ? (v.childExpirationTime = 0, v.expirationTime = S, v.child = null, v.memoizedProps = null, v.memoizedState = null, v.updateQueue = null, v.dependencies = null) : (v.childExpirationTime = n.childExpirationTime, v.expirationTime = n.expirationTime, v.child = n.child, v.memoizedProps = n.memoizedProps, v.memoizedState = n.memoizedState, v.updateQueue = n.updateQueue, S = n.dependencies, v.dependencies = S === null ? null : { expirationTime: S.expirationTime, firstContext: S.firstContext, responders: S.responders }), f = f.sibling;
                return an(Kt, Kt.current & 1 | 2), a.child;
              }
              S = S.sibling;
            }
        } else {
          if (!v)
            if (n = gc(S), n !== null) {
              if (a.effectTag |= 64, v = !0, u = n.updateQueue, u !== null && (a.updateQueue = u, a.effectTag |= 4), $l(f, !0), f.tail === null && f.tailMode === "hidden" && !S.alternate)
                return a = a.lastEffect = f.lastEffect, a !== null && (a.nextEffect = null), null;
            } else
              2 * _t() - f.renderingStartTime > f.tailExpiration && 1 < u && (a.effectTag |= 64, v = !0, $l(f, !1), a.expirationTime = a.childExpirationTime = u - 1);
          f.isBackwards ? (S.sibling = a.child, a.child = S) : (u = f.last, u !== null ? u.sibling = S : a.child = S, f.last = S);
        }
        return f.tail !== null ? (f.tailExpiration === 0 && (f.tailExpiration = _t() + 500), u = f.tail, f.rendering = u, f.tail = u.sibling, f.lastEffect = a.lastEffect, f.renderingStartTime = _t(), u.sibling = null, a = Kt.current, an(Kt, v ? a & 1 | 2 : a & 1), u) : null;
    }
    throw Error(c(
      156,
      a.tag
    ));
  }
  function Eg(n) {
    switch (n.tag) {
      case 1:
        $n(n.type) && Ua();
        var a = n.effectTag;
        return a & 4096 ? (n.effectTag = a & -4097 | 64, n) : null;
      case 3:
        if (jo(), xt(Tn), xt(kn), a = n.effectTag, (a & 64) !== 0)
          throw Error(c(285));
        return n.effectTag = a & -4097 | 64, n;
      case 5:
        return Ef(n), null;
      case 13:
        return xt(Kt), a = n.effectTag, a & 4096 ? (n.effectTag = a & -4097 | 64, n) : null;
      case 19:
        return xt(Kt), null;
      case 4:
        return jo(), null;
      case 10:
        return Sf(n), null;
      default:
        return null;
    }
  }
  function zf(n, a) {
    return { value: n, source: a, stack: Ia(a) };
  }
  var Ig = typeof WeakSet == "function" ? WeakSet : Set;
  function Of(n, a) {
    var u = a.source, f = a.stack;
    f === null && u !== null && (f = Ia(u)), u !== null && ci(u.type), a = a.value, n !== null && n.tag === 1 && ci(n.type);
    try {
      console.error(a);
    } catch (v) {
      setTimeout(function() {
        throw v;
      });
    }
  }
  function Ag(n, a) {
    try {
      a.props = n.memoizedProps, a.state = n.memoizedState, a.componentWillUnmount();
    } catch (u) {
      ts(n, u);
    }
  }
  function Jp(n) {
    var a = n.ref;
    if (a !== null)
      if (typeof a == "function")
        try {
          a(null);
        } catch (u) {
          ts(n, u);
        }
      else
        a.current = null;
  }
  function Rg(n, a) {
    switch (a.tag) {
      case 0:
      case 11:
      case 15:
      case 22:
        return;
      case 1:
        if (a.effectTag & 256 && n !== null) {
          var u = n.memoizedProps, f = n.memoizedState;
          n = a.stateNode, a = n.getSnapshotBeforeUpdate(a.elementType === a.type ? u : fi(a.type, u), f), n.__reactInternalSnapshotBeforeUpdate = a;
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
  function qp(n, a) {
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
  function Dg(n, a, u) {
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
            var f = u.elementType === u.type ? a.memoizedProps : fi(u.type, a.memoizedProps);
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
        n = u.stateNode, a === null && u.effectTag & 4 && Cp(u.type, u.memoizedProps) && n.focus();
        return;
      case 6:
        return;
      case 4:
        return;
      case 12:
        return;
      case 13:
        u.memoizedState === null && (u = u.alternate, u !== null && (u = u.memoizedState, u !== null && (u = u.dehydrated, u !== null && vp(u))));
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
    switch (typeof ql == "function" && ql(a), a.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
      case 22:
        if (n = a.updateQueue, n !== null && (n = n.lastEffect, n !== null)) {
          var f = n.next;
          Ct(97 < u ? 97 : u, function() {
            var v = f;
            do {
              var S = v.destroy;
              if (S !== void 0) {
                var C = a;
                try {
                  S();
                } catch (R) {
                  ts(C, R);
                }
              }
              v = v.next;
            } while (v !== f);
          });
        }
        break;
      case 1:
        Jp(a), u = a.stateNode, typeof u.componentWillUnmount == "function" && Ag(a, u);
        break;
      case 5:
        Jp(a);
        break;
      case 4:
        zc(n, a, u);
    }
  }
  function Kp(n) {
    var a = n.alternate;
    n.return = null, n.child = null, n.memoizedState = null, n.updateQueue = null, n.dependencies = null, n.alternate = null, n.firstEffect = null, n.lastEffect = null, n.pendingProps = null, n.memoizedProps = null, n.stateNode = null, a !== null && Kp(a);
  }
  function em(n) {
    return n.tag === 5 || n.tag === 3 || n.tag === 4;
  }
  function tm(n) {
    e: {
      for (var a = n.return; a !== null; ) {
        if (em(a)) {
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
    u.effectTag & 16 && (Kn(a, ""), u.effectTag &= -17);
    e:
      t:
        for (u = n; ; ) {
          for (; u.sibling === null; ) {
            if (u.return === null || em(u.return)) {
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
    f ? jf(n, u, a) : Ql(n, u, a);
  }
  function jf(n, a, u) {
    var f = n.tag, v = f === 5 || f === 6;
    if (v)
      n = v ? n.stateNode : n.stateNode.instance, a ? u.nodeType === 8 ? u.parentNode.insertBefore(n, a) : u.insertBefore(n, a) : (u.nodeType === 8 ? (a = u.parentNode, a.insertBefore(n, u)) : (a = u, a.appendChild(n)), u = u._reactRootContainer, u != null || a.onclick !== null || (a.onclick = Ds));
    else if (f !== 4 && (n = n.child, n !== null))
      for (jf(n, a, u), n = n.sibling; n !== null; )
        jf(n, a, u), n = n.sibling;
  }
  function Ql(n, a, u) {
    var f = n.tag, v = f === 5 || f === 6;
    if (v)
      n = v ? n.stateNode : n.stateNode.instance, a ? u.insertBefore(n, a) : u.appendChild(n);
    else if (f !== 4 && (n = n.child, n !== null))
      for (Ql(n, a, u), n = n.sibling; n !== null; )
        Ql(n, a, u), n = n.sibling;
  }
  function zc(n, a, u) {
    for (var f = a, v = !1, S, C; ; ) {
      if (!v) {
        v = f.return;
        e:
          for (; ; ) {
            if (v === null)
              throw Error(c(160));
            switch (S = v.stateNode, v.tag) {
              case 5:
                C = !1;
                break e;
              case 3:
                S = S.containerInfo, C = !0;
                break e;
              case 4:
                S = S.containerInfo, C = !0;
                break e;
            }
            v = v.return;
          }
        v = !0;
      }
      if (f.tag === 5 || f.tag === 6) {
        e:
          for (var R = n, H = f, U = u, Me = H; ; )
            if (Bf(R, Me, U), Me.child !== null && Me.tag !== 4)
              Me.child.return = Me, Me = Me.child;
            else {
              if (Me === H)
                break e;
              for (; Me.sibling === null; ) {
                if (Me.return === null || Me.return === H)
                  break e;
                Me = Me.return;
              }
              Me.sibling.return = Me.return, Me = Me.sibling;
            }
        C ? (R = S, H = f.stateNode, R.nodeType === 8 ? R.parentNode.removeChild(H) : R.removeChild(H)) : S.removeChild(f.stateNode);
      } else if (f.tag === 4) {
        if (f.child !== null) {
          S = f.stateNode.containerInfo, C = !0, f.child.return = f, f = f.child;
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
        qp(3, a);
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
            for (u[Eo] = f, n === "input" && f.type === "radio" && f.name != null && Aa(u, f), Ld(n, v), a = Ld(n, f), v = 0; v < S.length; v += 2) {
              var C = S[v], R = S[v + 1];
              C === "style" ? bp(u, R) : C === "dangerouslySetInnerHTML" ? qr(u, R) : C === "children" ? Kn(u, R) : St(u, C, R, a);
            }
            switch (n) {
              case "input":
                Pt(u, f);
                break;
              case "textarea":
                yo(u, f);
                break;
              case "select":
                a = u._wrapperState.wasMultiple, u._wrapperState.wasMultiple = !!f.multiple, n = f.value, n != null ? qn(u, !!f.multiple, n, !1) : a !== !!f.multiple && (f.defaultValue != null ? qn(u, !!f.multiple, f.defaultValue, !0) : qn(u, !!f.multiple, f.multiple ? [] : "", !1));
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
        a = a.stateNode, a.hydrate && (a.hydrate = !1, vp(a.containerInfo));
        return;
      case 12:
        return;
      case 13:
        if (u = a, a.memoizedState === null ? f = !1 : (f = !0, u = a.child, Xa = _t()), u !== null)
          e:
            for (n = u; ; ) {
              if (n.tag === 5)
                S = n.stateNode, f ? (S = S.style, typeof S.setProperty == "function" ? S.setProperty("display", "none", "important") : S.display = "none") : (S = n.stateNode, v = n.memoizedProps.style, v = v != null && v.hasOwnProperty("display") ? v.display : null, S.style.display = wp("display", v));
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
        Zl(a);
        return;
      case 19:
        Zl(a);
        return;
      case 17:
        return;
    }
    throw Error(c(163));
  }
  function Zl(n) {
    var a = n.updateQueue;
    if (a !== null) {
      n.updateQueue = null;
      var u = n.stateNode;
      u === null && (u = n.stateNode = new Ig()), a.forEach(function(f) {
        var v = zg.bind(null, n, f);
        u.has(f) || (u.add(f), f.then(v, v));
      });
    }
  }
  var nm = typeof WeakMap == "function" ? WeakMap : Map;
  function Js(n, a, u) {
    u = Wa(u, null), u.tag = 3, u.payload = { element: null };
    var f = a.value;
    return u.callback = function() {
      eo || (eo = !0, Wo = f), Of(n, a);
    }, u;
  }
  function im(n, a, u) {
    u = Wa(u, null), u.tag = 3;
    var f = n.type.getDerivedStateFromError;
    if (typeof f == "function") {
      var v = a.value;
      u.payload = function() {
        return Of(n, a), f(v);
      };
    }
    var S = n.stateNode;
    return S !== null && typeof S.componentDidCatch == "function" && (u.callback = function() {
      typeof f != "function" && (Zi === null ? Zi = /* @__PURE__ */ new Set([this]) : Zi.add(this), Of(n, a));
      var C = a.stack;
      this.componentDidCatch(a.value, { componentStack: C !== null ? C : "" });
    }), u;
  }
  var Ng = Math.ceil, Oc = Wt.ReactCurrentDispatcher, rm = Wt.ReactCurrentOwner, Pn = 0, Uf = 8, Qi = 16, Br = 32, Ga = 0, _n = 1, am = 2, Yl = 3, Lc = 4, Vf = 5, rt = Pn, Ri = null, lt = null, Ut = 0, pn = Ga, qs = null, Di = 1073741823, Ho = 1073741823, jr = null, cr = 0, Ks = !1, Xa = 0, Bc = 500, Oe = null, eo = !1, Wo = null, Zi = null, Gl = !1, Ja = null, Fo = 90, dr = null, $o = 0, Hf = null, jc = 0;
  function zn() {
    return (rt & (Qi | Br)) !== Pn ? 1073741821 - (_t() / 10 | 0) : jc !== 0 ? jc : jc = 1073741821 - (_t() / 10 | 0);
  }
  function qa(n, a, u) {
    if (a = a.mode, (a & 2) === 0)
      return 1073741823;
    var f = or();
    if ((a & 4) === 0)
      return f === 99 ? 1073741823 : 1073741822;
    if ((rt & Qi) !== Pn)
      return Ut;
    if (u !== null)
      n = jt(n, u.timeoutMs | 0 || 5e3, 250);
    else
      switch (f) {
        case 99:
          n = 1073741823;
          break;
        case 98:
          n = jt(n, 150, 100);
          break;
        case 97:
        case 96:
          n = jt(n, 5e3, 250);
          break;
        case 95:
          n = 2;
          break;
        default:
          throw Error(c(326));
      }
    return Ri !== null && n === Ut && --n, n;
  }
  function Ka(n, a) {
    if (50 < $o)
      throw $o = 0, Hf = null, Error(c(185));
    if (n = to(n, a), n !== null) {
      var u = or();
      a === 1073741823 ? (rt & Uf) !== Pn && (rt & (Qi | Br)) === Pn ? Wf(n) : (Ni(n), rt === Pn && Ii()) : Ni(n), (rt & 4) === Pn || u !== 98 && u !== 99 || (dr === null ? dr = /* @__PURE__ */ new Map([[n, a]]) : (u = dr.get(n), (u === void 0 || u > a) && dr.set(n, a)));
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
    return v !== null && (Ri === v && (Xl(a), pn === Lc && io(v, Ut)), Gf(v, a)), v;
  }
  function Uc(n) {
    var a = n.lastExpiredTime;
    if (a !== 0 || (a = n.firstPendingTime, !wm(n, a)))
      return a;
    var u = n.lastPingedTime;
    return n = n.nextKnownPendingLevel, n = u > n ? u : n, 2 >= n && a !== n ? 0 : n;
  }
  function Ni(n) {
    if (n.lastExpiredTime !== 0)
      n.callbackExpirationTime = 1073741823, n.callbackPriority = 99, n.callbackNode = Us(Wf.bind(null, n));
    else {
      var a = Uc(n), u = n.callbackNode;
      if (a === 0)
        u !== null && (n.callbackNode = null, n.callbackExpirationTime = 0, n.callbackPriority = 90);
      else {
        var f = zn();
        if (a === 1073741823 ? f = 99 : a === 1 || a === 2 ? f = 95 : (f = 10 * (1073741821 - a) - 10 * (1073741821 - f), f = 0 >= f ? 99 : 250 >= f ? 98 : 5250 >= f ? 97 : 95), u !== null) {
          var v = n.callbackPriority;
          if (n.callbackExpirationTime === a && v >= f)
            return;
          u !== gf && oc(u);
        }
        n.callbackExpirationTime = a, n.callbackPriority = f, a = a === 1073741823 ? Us(Wf.bind(null, n)) : _p(f, sm.bind(null, n), { timeout: 10 * (1073741821 - a) - _t() }), n.callbackNode = a;
      }
    }
  }
  function sm(n, a) {
    if (jc = 0, a)
      return a = zn(), ns(n, a), Ni(n), null;
    var u = Uc(n);
    if (u !== 0) {
      if (a = n.callbackNode, (rt & (Qi | Br)) !== Pn)
        throw Error(c(327));
      if (Qo(), n === Ri && u === Ut || no(n, u), lt !== null) {
        var f = rt;
        rt |= Qi;
        var v = cm();
        do
          try {
            fm();
            break;
          } catch (R) {
            um(n, R);
          }
        while (1);
        if (bf(), rt = f, Oc.current = v, pn === _n)
          throw a = qs, no(n, u), io(n, u), Ni(n), a;
        if (lt === null)
          switch (v = n.finishedWork = n.current.alternate, n.finishedExpirationTime = u, f = pn, Ri = null, f) {
            case Ga:
            case _n:
              throw Error(c(345));
            case am:
              ns(n, 2 < u ? 2 : u);
              break;
            case Yl:
              if (io(n, u), f = n.lastSuspendedTime, u === f && (n.nextKnownPendingLevel = Jl(v)), Di === 1073741823 && (v = Xa + Bc - _t(), 10 < v)) {
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
                n.timeoutHandle = Zu(es.bind(null, n), v);
                break;
              }
              es(n);
              break;
            case Lc:
              if (io(n, u), f = n.lastSuspendedTime, u === f && (n.nextKnownPendingLevel = Jl(v)), Ks && (v = n.lastPingedTime, v === 0 || v >= u)) {
                n.lastPingedTime = u, no(n, u);
                break;
              }
              if (v = Uc(n), v !== 0 && v !== u)
                break;
              if (f !== 0 && f !== u) {
                n.lastPingedTime = f;
                break;
              }
              if (Ho !== 1073741823 ? f = 10 * (1073741821 - Ho) - _t() : Di === 1073741823 ? f = 0 : (f = 10 * (1073741821 - Di) - 5e3, v = _t(), u = 10 * (1073741821 - u) - v, f = v - f, 0 > f && (f = 0), f = (120 > f ? 120 : 480 > f ? 480 : 1080 > f ? 1080 : 1920 > f ? 1920 : 3e3 > f ? 3e3 : 4320 > f ? 4320 : 1960 * Ng(f / 1960)) - f, u < f && (f = u)), 10 < f) {
                n.timeoutHandle = Zu(es.bind(null, n), f);
                break;
              }
              es(n);
              break;
            case Vf:
              if (Di !== 1073741823 && jr !== null) {
                S = Di;
                var C = jr;
                if (f = C.busyMinDurationMs | 0, 0 >= f ? f = 0 : (v = C.busyDelayMs | 0, S = _t() - (10 * (1073741821 - S) - (C.timeoutMs | 0 || 5e3)), f = S <= v ? 0 : v + f - S), 10 < f) {
                  io(n, u), n.timeoutHandle = Zu(es.bind(null, n), f);
                  break;
                }
              }
              es(n);
              break;
            default:
              throw Error(c(329));
          }
        if (Ni(n), n.callbackNode === a)
          return sm.bind(null, n);
      }
    }
    return null;
  }
  function Wf(n) {
    var a = n.lastExpiredTime;
    if (a = a !== 0 ? a : 1073741823, (rt & (Qi | Br)) !== Pn)
      throw Error(c(327));
    if (Qo(), n === Ri && a === Ut || no(n, a), lt !== null) {
      var u = rt;
      rt |= Qi;
      var f = cm();
      do
        try {
          dm();
          break;
        } catch (v) {
          um(n, v);
        }
      while (1);
      if (bf(), rt = u, Oc.current = f, pn === _n)
        throw u = qs, no(n, a), io(n, a), Ni(n), u;
      if (lt !== null)
        throw Error(c(261));
      n.finishedWork = n.current.alternate, n.finishedExpirationTime = a, Ri = null, es(n), Ni(n);
    }
    return null;
  }
  function kg() {
    if (dr !== null) {
      var n = dr;
      dr = null, n.forEach(function(a, u) {
        ns(u, a), Ni(u);
      }), Ii();
    }
  }
  function om(n, a) {
    var u = rt;
    rt |= 1;
    try {
      return n(a);
    } finally {
      rt = u, rt === Pn && Ii();
    }
  }
  function lm(n, a) {
    var u = rt;
    rt &= -2, rt |= Uf;
    try {
      return n(a);
    } finally {
      rt = u, rt === Pn && Ii();
    }
  }
  function no(n, a) {
    n.finishedWork = null, n.finishedExpirationTime = 0;
    var u = n.timeoutHandle;
    if (u !== -1 && (n.timeoutHandle = -1, Tp(u)), lt !== null)
      for (u = lt.return; u !== null; ) {
        var f = u;
        switch (f.tag) {
          case 1:
            f = f.type.childContextTypes, f != null && Ua();
            break;
          case 3:
            jo(), xt(Tn), xt(kn);
            break;
          case 5:
            Ef(f);
            break;
          case 4:
            jo();
            break;
          case 13:
            xt(Kt);
            break;
          case 19:
            xt(Kt);
            break;
          case 10:
            Sf(f);
        }
        u = u.return;
      }
    Ri = n, lt = fr(n.current, null), Ut = a, pn = Ga, qs = null, Ho = Di = 1073741823, jr = null, cr = 0, Ks = !1;
  }
  function um(n, a) {
    do {
      try {
        if (bf(), wc.current = Ic, Qa)
          for (var u = $t.memoizedState; u !== null; ) {
            var f = u.queue;
            f !== null && (f.pending = null), u = u.next;
          }
        if (Qn = 0, on = sn = $t = null, Qa = !1, lt === null || lt.return === null)
          return pn = _n, qs = a, lt = null;
        e: {
          var v = n, S = lt.return, C = lt, R = a;
          if (a = Ut, C.effectTag |= 2048, C.firstEffect = C.lastEffect = null, R !== null && typeof R == "object" && typeof R.then == "function") {
            var H = R;
            if ((C.mode & 2) === 0) {
              var U = C.alternate;
              U ? (C.updateQueue = U.updateQueue, C.memoizedState = U.memoizedState, C.expirationTime = U.expirationTime) : (C.updateQueue = null, C.memoizedState = null);
            }
            var Me = (Kt.current & 1) !== 0, ke = S;
            do {
              var mt;
              if (mt = ke.tag === 13) {
                var It = ke.memoizedState;
                if (It !== null)
                  mt = It.dehydrated !== null;
                else {
                  var ki = ke.memoizedProps;
                  mt = ki.fallback === void 0 ? !1 : ki.unstable_avoidThisFallback !== !0 ? !0 : !Me;
                }
              }
              if (mt) {
                var Wn = ke.updateQueue;
                if (Wn === null) {
                  var O = /* @__PURE__ */ new Set();
                  O.add(H), ke.updateQueue = O;
                } else
                  Wn.add(H);
                if ((ke.mode & 2) === 0) {
                  if (ke.effectTag |= 64, C.effectTag &= -2981, C.tag === 1)
                    if (C.alternate === null)
                      C.tag = 17;
                    else {
                      var _ = Wa(1073741823, null);
                      _.tag = 2, Fa(C, _);
                    }
                  C.expirationTime = 1073741823;
                  break e;
                }
                R = void 0, C = a;
                var Q = v.pingCache;
                if (Q === null ? (Q = v.pingCache = new nm(), R = /* @__PURE__ */ new Set(), Q.set(H, R)) : (R = Q.get(H), R === void 0 && (R = /* @__PURE__ */ new Set(), Q.set(H, R))), !R.has(C)) {
                  R.add(C);
                  var le = vm.bind(null, v, H, C);
                  H.then(le, le);
                }
                ke.effectTag |= 4096, ke.expirationTime = a;
                break e;
              }
              ke = ke.return;
            } while (ke !== null);
            R = Error((ci(C.type) || "A React component") + ` suspended while rendering, but no fallback UI was specified.

Add a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display.` + Ia(C));
          }
          pn !== Vf && (pn = am), R = zf(R, C), ke = S;
          do {
            switch (ke.tag) {
              case 3:
                H = R, ke.effectTag |= 4096, ke.expirationTime = a;
                var we = Js(ke, H, a);
                xf(ke, we);
                break e;
              case 1:
                H = R;
                var Pe = ke.type, Je = ke.stateNode;
                if ((ke.effectTag & 64) === 0 && (typeof Pe.getDerivedStateFromError == "function" || Je !== null && typeof Je.componentDidCatch == "function" && (Zi === null || !Zi.has(Je)))) {
                  ke.effectTag |= 4096, ke.expirationTime = a;
                  var wt = im(ke, H, a);
                  xf(ke, wt);
                  break e;
                }
            }
            ke = ke.return;
          } while (ke !== null);
        }
        lt = hm(lt);
      } catch (ln) {
        a = ln;
        continue;
      }
      break;
    } while (1);
  }
  function cm() {
    var n = Oc.current;
    return Oc.current = Ic, n === null ? Ic : n;
  }
  function Ff(n, a) {
    n < Di && 2 < n && (Di = n), a !== null && n < Ho && 2 < n && (Ho = n, jr = a);
  }
  function Xl(n) {
    n > cr && (cr = n);
  }
  function dm() {
    for (; lt !== null; )
      lt = $f(lt);
  }
  function fm() {
    for (; lt !== null && !xg(); )
      lt = $f(lt);
  }
  function $f(n) {
    var a = gm(n.alternate, n, Ut);
    return n.memoizedProps = n.pendingProps, a === null && (a = hm(n)), rm.current = null, a;
  }
  function hm(n) {
    lt = n;
    do {
      var a = lt.alternate;
      if (n = lt.return, (lt.effectTag & 2048) === 0) {
        if (a = Xp(a, lt, Ut), Ut === 1 || lt.childExpirationTime !== 1) {
          for (var u = 0, f = lt.child; f !== null; ) {
            var v = f.expirationTime, S = f.childExpirationTime;
            v > u && (u = v), S > u && (u = S), f = f.sibling;
          }
          lt.childExpirationTime = u;
        }
        if (a !== null)
          return a;
        n !== null && (n.effectTag & 2048) === 0 && (n.firstEffect === null && (n.firstEffect = lt.firstEffect), lt.lastEffect !== null && (n.lastEffect !== null && (n.lastEffect.nextEffect = lt.firstEffect), n.lastEffect = lt.lastEffect), 1 < lt.effectTag && (n.lastEffect !== null ? n.lastEffect.nextEffect = lt : n.firstEffect = lt, n.lastEffect = lt));
      } else {
        if (a = Eg(lt), a !== null)
          return a.effectTag &= 2047, a;
        n !== null && (n.firstEffect = n.lastEffect = null, n.effectTag |= 2048);
      }
      if (a = lt.sibling, a !== null)
        return a;
      lt = n;
    } while (lt !== null);
    return pn === Ga && (pn = Vf), null;
  }
  function Jl(n) {
    var a = n.expirationTime;
    return n = n.childExpirationTime, a > n ? a : n;
  }
  function es(n) {
    var a = or();
    return Ct(99, Pg.bind(null, n, a)), null;
  }
  function Pg(n, a) {
    do
      Qo();
    while (Ja !== null);
    if ((rt & (Qi | Br)) !== Pn)
      throw Error(c(327));
    var u = n.finishedWork, f = n.finishedExpirationTime;
    if (u === null)
      return null;
    if (n.finishedWork = null, n.finishedExpirationTime = 0, u === n.current)
      throw Error(c(177));
    n.callbackNode = null, n.callbackExpirationTime = 0, n.callbackPriority = 90, n.nextKnownPendingLevel = 0;
    var v = Jl(u);
    if (n.firstPendingTime = v, f <= n.lastSuspendedTime ? n.firstSuspendedTime = n.lastSuspendedTime = n.nextKnownPendingLevel = 0 : f <= n.firstSuspendedTime && (n.firstSuspendedTime = f - 1), f <= n.lastPingedTime && (n.lastPingedTime = 0), f <= n.lastExpiredTime && (n.lastExpiredTime = 0), n === Ri && (lt = Ri = null, Ut = 0), 1 < u.effectTag ? u.lastEffect !== null ? (u.lastEffect.nextEffect = u, v = u.firstEffect) : v = u : v = u.firstEffect, v !== null) {
      var S = rt;
      rt |= Br, rm.current = null, Qu = ka;
      var C = Vd();
      if (Wu(C)) {
        if ("selectionStart" in C)
          var R = { start: C.selectionStart, end: C.selectionEnd };
        else
          e: {
            R = (R = C.ownerDocument) && R.defaultView || window;
            var H = R.getSelection && R.getSelection();
            if (H && H.rangeCount !== 0) {
              R = H.anchorNode;
              var U = H.anchorOffset, Me = H.focusNode;
              H = H.focusOffset;
              try {
                R.nodeType, Me.nodeType;
              } catch {
                R = null;
                break e;
              }
              var ke = 0, mt = -1, It = -1, ki = 0, Wn = 0, O = C, _ = null;
              t:
                for (; ; ) {
                  for (var Q; O !== R || U !== 0 && O.nodeType !== 3 || (mt = ke + U), O !== Me || H !== 0 && O.nodeType !== 3 || (It = ke + H), O.nodeType === 3 && (ke += O.nodeValue.length), (Q = O.firstChild) !== null; )
                    _ = O, O = Q;
                  for (; ; ) {
                    if (O === C)
                      break t;
                    if (_ === R && ++ki === U && (mt = ke), _ === Me && ++Wn === H && (It = ke), (Q = O.nextSibling) !== null)
                      break;
                    O = _, _ = O.parentNode;
                  }
                  O = Q;
                }
              R = mt === -1 || It === -1 ? null : { start: mt, end: It };
            } else
              R = null;
          }
        R = R || { start: 0, end: 0 };
      } else
        R = null;
      Wd = { activeElementDetached: null, focusedElem: C, selectionRange: R }, ka = !1, Oe = v;
      do
        try {
          pm();
        } catch (ut) {
          if (Oe === null)
            throw Error(c(330));
          ts(Oe, ut), Oe = Oe.nextEffect;
        }
      while (Oe !== null);
      Oe = v;
      do
        try {
          for (C = n, R = a; Oe !== null; ) {
            var le = Oe.effectTag;
            if (le & 16 && Kn(Oe.stateNode, ""), le & 128) {
              var we = Oe.alternate;
              if (we !== null) {
                var Pe = we.ref;
                Pe !== null && (typeof Pe == "function" ? Pe(null) : Pe.current = null);
              }
            }
            switch (le & 1038) {
              case 2:
                tm(Oe), Oe.effectTag &= -3;
                break;
              case 6:
                tm(Oe), Oe.effectTag &= -3, da(Oe.alternate, Oe);
                break;
              case 1024:
                Oe.effectTag &= -1025;
                break;
              case 1028:
                Oe.effectTag &= -1025, da(Oe.alternate, Oe);
                break;
              case 4:
                da(Oe.alternate, Oe);
                break;
              case 8:
                U = Oe, zc(C, U, R), Kp(U);
            }
            Oe = Oe.nextEffect;
          }
        } catch (ut) {
          if (Oe === null)
            throw Error(c(330));
          ts(Oe, ut), Oe = Oe.nextEffect;
        }
      while (Oe !== null);
      if (Pe = Wd, we = Vd(), le = Pe.focusedElem, R = Pe.selectionRange, we !== le && le && le.ownerDocument && Ud(le.ownerDocument.documentElement, le)) {
        for (R !== null && Wu(le) && (we = R.start, Pe = R.end, Pe === void 0 && (Pe = we), "selectionStart" in le ? (le.selectionStart = we, le.selectionEnd = Math.min(Pe, le.value.length)) : (Pe = (we = le.ownerDocument || document) && we.defaultView || window, Pe.getSelection && (Pe = Pe.getSelection(), U = le.textContent.length, C = Math.min(R.start, U), R = R.end === void 0 ? C : Math.min(R.end, U), !Pe.extend && C > R && (U = R, R = C, C = U), U = jd(le, C), Me = jd(le, R), U && Me && (Pe.rangeCount !== 1 || Pe.anchorNode !== U.node || Pe.anchorOffset !== U.offset || Pe.focusNode !== Me.node || Pe.focusOffset !== Me.offset) && (we = we.createRange(), we.setStart(U.node, U.offset), Pe.removeAllRanges(), C > R ? (Pe.addRange(we), Pe.extend(Me.node, Me.offset)) : (we.setEnd(Me.node, Me.offset), Pe.addRange(we)))))), we = [], Pe = le; Pe = Pe.parentNode; )
          Pe.nodeType === 1 && we.push({
            element: Pe,
            left: Pe.scrollLeft,
            top: Pe.scrollTop
          });
        for (typeof le.focus == "function" && le.focus(), le = 0; le < we.length; le++)
          Pe = we[le], Pe.element.scrollLeft = Pe.left, Pe.element.scrollTop = Pe.top;
      }
      ka = !!Qu, Wd = Qu = null, n.current = u, Oe = v;
      do
        try {
          for (le = n; Oe !== null; ) {
            var Je = Oe.effectTag;
            if (Je & 36 && Dg(le, Oe.alternate, Oe), Je & 128) {
              we = void 0;
              var wt = Oe.ref;
              if (wt !== null) {
                var ln = Oe.stateNode;
                switch (Oe.tag) {
                  case 5:
                    we = ln;
                    break;
                  default:
                    we = ln;
                }
                typeof wt == "function" ? wt(we) : wt.current = we;
              }
            }
            Oe = Oe.nextEffect;
          }
        } catch (ut) {
          if (Oe === null)
            throw Error(c(330));
          ts(Oe, ut), Oe = Oe.nextEffect;
        }
      while (Oe !== null);
      Oe = null, kp(), rt = S;
    } else
      n.current = u;
    if (Gl)
      Gl = !1, Ja = n, Fo = a;
    else
      for (Oe = v; Oe !== null; )
        a = Oe.nextEffect, Oe.nextEffect = null, Oe = a;
    if (a = n.firstPendingTime, a === 0 && (Zi = null), a === 1073741823 ? n === Hf ? $o++ : ($o = 0, Hf = n) : $o = 0, typeof Vc == "function" && Vc(u.stateNode, f), Ni(n), eo)
      throw eo = !1, n = Wo, Wo = null, n;
    return (rt & Uf) !== Pn || Ii(), null;
  }
  function pm() {
    for (; Oe !== null; ) {
      var n = Oe.effectTag;
      (n & 256) !== 0 && Rg(Oe.alternate, Oe), (n & 512) === 0 || Gl || (Gl = !0, _p(97, function() {
        return Qo(), null;
      })), Oe = Oe.nextEffect;
    }
  }
  function Qo() {
    if (Fo !== 90) {
      var n = 97 < Fo ? 97 : Fo;
      return Fo = 90, Ct(n, _g);
    }
  }
  function _g() {
    if (Ja === null)
      return !1;
    var n = Ja;
    if (Ja = null, (rt & (Qi | Br)) !== Pn)
      throw Error(c(331));
    var a = rt;
    for (rt |= Br, n = n.current.firstEffect; n !== null; ) {
      try {
        var u = n;
        if ((u.effectTag & 512) !== 0)
          switch (u.tag) {
            case 0:
            case 11:
            case 15:
            case 22:
              qp(5, u), Lf(5, u);
          }
      } catch (f) {
        if (n === null)
          throw Error(c(330));
        ts(n, f);
      }
      u = n.nextEffect, n.nextEffect = null, n = u;
    }
    return rt = a, Ii(), !0;
  }
  function mm(n, a, u) {
    a = zf(u, a), a = Js(n, a, 1073741823), Fa(n, a), n = to(n, 1073741823), n !== null && Ni(n);
  }
  function ts(n, a) {
    if (n.tag === 3)
      mm(n, n, a);
    else
      for (var u = n.return; u !== null; ) {
        if (u.tag === 3) {
          mm(u, n, a);
          break;
        } else if (u.tag === 1) {
          var f = u.stateNode;
          if (typeof u.type.getDerivedStateFromError == "function" || typeof f.componentDidCatch == "function" && (Zi === null || !Zi.has(f))) {
            n = zf(a, n), n = im(u, n, 1073741823), Fa(u, n), u = to(u, 1073741823), u !== null && Ni(u);
            break;
          }
        }
        u = u.return;
      }
  }
  function vm(n, a, u) {
    var f = n.pingCache;
    f !== null && f.delete(a), Ri === n && Ut === u ? pn === Lc || pn === Yl && Di === 1073741823 && _t() - Xa < Bc ? no(n, Ut) : Ks = !0 : wm(n, u) && (a = n.lastPingedTime, a !== 0 && a < u || (n.lastPingedTime = u, Ni(n)));
  }
  function zg(n, a) {
    var u = n.stateNode;
    u !== null && u.delete(a), a = 0, a === 0 && (a = zn(), a = qa(a, n, null)), n = to(n, a), n !== null && Ni(n);
  }
  var gm;
  gm = function(n, a, u) {
    var f = a.expirationTime;
    if (n !== null) {
      var v = a.pendingProps;
      if (n.memoizedProps !== v || Tn.current)
        ur = !0;
      else {
        if (f < u) {
          switch (ur = !1, a.tag) {
            case 3:
              Nc(a), Yt();
              break;
            case 5:
              if (Mf(a), a.mode & 4 && u !== 1 && v.hidden)
                return a.expirationTime = a.childExpirationTime = 1, null;
              break;
            case 1:
              $n(a.type) && No(a);
              break;
            case 4:
              vc(a, a.stateNode.containerInfo);
              break;
            case 10:
              f = a.memoizedProps.value, v = a.type._context, an(Va, v._currentValue), v._currentValue = f;
              break;
            case 13:
              if (a.memoizedState !== null)
                return f = a.child.childExpirationTime, f !== 0 && f >= u ? Qp(n, a, u) : (an(Kt, Kt.current & 1), a = ca(n, a, u), a !== null ? a.sibling : null);
              an(Kt, Kt.current & 1);
              break;
            case 19:
              if (f = a.childExpirationTime >= u, (n.effectTag & 64) !== 0) {
                if (f)
                  return Yp(n, a, u);
                a.effectTag |= 64;
              }
              if (v = a.memoizedState, v !== null && (v.rendering = null, v.tail = null), an(Kt, Kt.current), !f)
                return null;
          }
          return ca(n, a, u);
        }
        ur = !1;
      }
    } else
      ur = !1;
    switch (a.expirationTime = 0, a.tag) {
      case 2:
        if (f = a.type, n !== null && (n.alternate = null, a.alternate = null, a.effectTag |= 2), n = a.pendingProps, v = ja(a, kn.current), hi(a, u), v = If(
          null,
          a,
          f,
          n,
          v,
          u
        ), a.effectTag |= 1, typeof v == "object" && v !== null && typeof v.render == "function" && v.$$typeof === void 0) {
          if (a.tag = 1, a.memoizedState = null, a.updateQueue = null, $n(f)) {
            var S = !0;
            No(a);
          } else
            S = !1;
          a.memoizedState = v.state !== null && v.state !== void 0 ? v.state : null, hc(a);
          var C = f.getDerivedStateFromProps;
          typeof C == "function" && Oo(a, f, C, n), v.updater = $a, a.stateNode = v, v._reactInternalFiber = a, Ll(a, f, n, u), a = Pf(null, a, f, !0, S, u);
        } else
          a.tag = 0, Ai(null, a, v, u), a = a.child;
        return a;
      case 16:
        e: {
          if (v = a.elementType, n !== null && (n.alternate = null, a.alternate = null, a.effectTag |= 2), n = a.pendingProps, er(v), v._status !== 1)
            throw v._result;
          switch (v = v._result, a.type = v, S = a.tag = Kl(v), n = fi(v, n), S) {
            case 0:
              a = Gs(null, a, v, n, u);
              break e;
            case 1:
              a = $p(null, a, v, n, u);
              break e;
            case 11:
              a = Wp(null, a, v, n, u);
              break e;
            case 14:
              a = Fl(null, a, v, fi(v.type, n), f, u);
              break e;
          }
          throw Error(c(306, v, ""));
        }
        return a;
      case 0:
        return f = a.type, v = a.pendingProps, v = a.elementType === f ? v : fi(f, v), Gs(n, a, f, v, u);
      case 1:
        return f = a.type, v = a.pendingProps, v = a.elementType === f ? v : fi(f, v), $p(n, a, f, v, u);
      case 3:
        if (Nc(a), f = a.updateQueue, n === null || f === null)
          throw Error(c(282));
        if (f = a.pendingProps, v = a.memoizedState, v = v !== null ? v.element : null, pc(n, a), zo(a, f, null, u), f = a.memoizedState.element, f === v)
          Yt(), a = ca(n, a, u);
        else {
          if ((v = a.stateNode.hydrate) && (Ya = Mo(a.stateNode.containerInfo.firstChild), lr = a, v = Ys = !0), v)
            for (u = Tf(a, null, f, u), a.child = u; u; )
              u.effectTag = u.effectTag & -3 | 1024, u = u.sibling;
          else
            Ai(n, a, f, u), Yt();
          a = a.child;
        }
        return a;
      case 5:
        return Mf(a), n === null && Wl(a), f = a.type, v = a.pendingProps, S = n !== null ? n.memoizedProps : null, C = v.children, yl(f, v) ? C = null : S !== null && yl(f, S) && (a.effectTag |= 16), Fp(n, a), a.mode & 4 && u !== 1 && v.hidden ? (a.expirationTime = a.childExpirationTime = 1, a = null) : (Ai(n, a, C, u), a = a.child), a;
      case 6:
        return n === null && Wl(a), null;
      case 13:
        return Qp(n, a, u);
      case 4:
        return vc(a, a.stateNode.containerInfo), f = a.pendingProps, n === null ? a.child = Lo(a, null, f, u) : Ai(n, a, f, u), a.child;
      case 11:
        return f = a.type, v = a.pendingProps, v = a.elementType === f ? v : fi(f, v), Wp(n, a, f, v, u);
      case 7:
        return Ai(n, a, a.pendingProps, u), a.child;
      case 8:
        return Ai(
          n,
          a,
          a.pendingProps.children,
          u
        ), a.child;
      case 12:
        return Ai(n, a, a.pendingProps.children, u), a.child;
      case 10:
        e: {
          f = a.type._context, v = a.pendingProps, C = a.memoizedProps, S = v.value;
          var R = a.type._context;
          if (an(Va, R._currentValue), R._currentValue = S, C !== null)
            if (R = C.value, S = Mi(R, S) ? 0 : (typeof f._calculateChangedBits == "function" ? f._calculateChangedBits(R, S) : 1073741823) | 0, S === 0) {
              if (C.children === v.children && !Tn.current) {
                a = ca(n, a, u);
                break e;
              }
            } else
              for (R = a.child, R !== null && (R.return = a); R !== null; ) {
                var H = R.dependencies;
                if (H !== null) {
                  C = R.child;
                  for (var U = H.firstContext; U !== null; ) {
                    if (U.context === f && (U.observedBits & S) !== 0) {
                      R.tag === 1 && (U = Wa(u, null), U.tag = 2, Fa(R, U)), R.expirationTime < u && (R.expirationTime = u), U = R.alternate, U !== null && U.expirationTime < u && (U.expirationTime = u), _o(R.return, u), H.expirationTime < u && (H.expirationTime = u);
                      break;
                    }
                    U = U.next;
                  }
                } else
                  C = R.tag === 10 && R.type === a.type ? null : R.child;
                if (C !== null)
                  C.return = R;
                else
                  for (C = R; C !== null; ) {
                    if (C === a) {
                      C = null;
                      break;
                    }
                    if (R = C.sibling, R !== null) {
                      R.return = C.return, C = R;
                      break;
                    }
                    C = C.return;
                  }
                R = C;
              }
          Ai(n, a, v.children, u), a = a.child;
        }
        return a;
      case 9:
        return v = a.type, S = a.pendingProps, f = S.children, hi(a, u), v = $i(v, S.unstable_observedBits), f = f(v), a.effectTag |= 1, Ai(n, a, f, u), a.child;
      case 14:
        return v = a.type, S = fi(v, a.pendingProps), S = fi(v.type, S), Fl(n, a, v, S, f, u);
      case 15:
        return Dc(n, a, a.type, a.pendingProps, f, u);
      case 17:
        return f = a.type, v = a.pendingProps, v = a.elementType === f ? v : fi(f, v), n !== null && (n.alternate = null, a.alternate = null, a.effectTag |= 2), a.tag = 1, $n(f) ? (n = !0, No(a)) : n = !1, hi(a, u), Op(a, f, v), Ll(a, f, v, u), Pf(
          null,
          a,
          f,
          !0,
          n,
          u
        );
      case 19:
        return Yp(n, a, u);
    }
    throw Error(c(156, a.tag));
  };
  var Vc = null, ql = null;
  function Og(n) {
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
      }, ql = function(f) {
        try {
          a.onCommitFiberUnmount(u, f);
        } catch {
        }
      };
    } catch {
    }
    return !0;
  }
  function Lg(n, a, u, f) {
    this.tag = n, this.key = u, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = a, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = f, this.effectTag = 0, this.lastEffect = this.firstEffect = this.nextEffect = null, this.childExpirationTime = this.expirationTime = 0, this.alternate = null;
  }
  function Ur(n, a, u, f) {
    return new Lg(n, a, u, f);
  }
  function Qf(n) {
    return n = n.prototype, !(!n || !n.isReactComponent);
  }
  function Kl(n) {
    if (typeof n == "function")
      return Qf(n) ? 1 : 0;
    if (n != null) {
      if (n = n.$$typeof, n === Yr)
        return 11;
      if (n === Gr)
        return 14;
    }
    return 2;
  }
  function fr(n, a) {
    var u = n.alternate;
    return u === null ? (u = Ur(n.tag, a, n.key, n.mode), u.elementType = n.elementType, u.type = n.type, u.stateNode = n.stateNode, u.alternate = n, n.alternate = u) : (u.pendingProps = a, u.effectTag = 0, u.nextEffect = null, u.firstEffect = null, u.lastEffect = null), u.childExpirationTime = n.childExpirationTime, u.expirationTime = n.expirationTime, u.child = n.child, u.memoizedProps = n.memoizedProps, u.memoizedState = n.memoizedState, u.updateQueue = n.updateQueue, a = n.dependencies, u.dependencies = a === null ? null : {
      expirationTime: a.expirationTime,
      firstContext: a.firstContext,
      responders: a.responders
    }, u.sibling = n.sibling, u.index = n.index, u.ref = n.ref, u;
  }
  function Hc(n, a, u, f, v, S) {
    var C = 2;
    if (f = n, typeof n == "function")
      Qf(n) && (C = 1);
    else if (typeof n == "string")
      C = 5;
    else
      e:
        switch (n) {
          case Ae:
            return fa(u.children, v, S, a);
          case wn:
            C = 8, v |= 7;
            break;
          case at:
            C = 8, v |= 1;
            break;
          case Fe:
            return n = Ur(12, u, a, v | 8), n.elementType = Fe, n.type = Fe, n.expirationTime = S, n;
          case Tr:
            return n = Ur(13, u, a, v), n.type = Tr, n.elementType = Tr, n.expirationTime = S, n;
          case Bn:
            return n = Ur(19, u, a, v), n.elementType = Bn, n.expirationTime = S, n;
          default:
            if (typeof n == "object" && n !== null)
              switch (n.$$typeof) {
                case Et:
                  C = 10;
                  break e;
                case Si:
                  C = 9;
                  break e;
                case Yr:
                  C = 11;
                  break e;
                case Gr:
                  C = 14;
                  break e;
                case Ui:
                  C = 16, f = null;
                  break e;
                case Ma:
                  C = 22;
                  break e;
              }
            throw Error(c(130, n == null ? n : typeof n, ""));
        }
    return a = Ur(C, u, a, v), a.elementType = n, a.type = f, a.expirationTime = S, a;
  }
  function fa(n, a, u, f) {
    return n = Ur(7, n, f, a), n.expirationTime = u, n;
  }
  function Zf(n, a, u) {
    return n = Ur(6, n, null, a), n.expirationTime = u, n;
  }
  function Yf(n, a, u) {
    return a = Ur(4, n.children !== null ? n.children : [], n.key, a), a.expirationTime = u, a.stateNode = { containerInfo: n.containerInfo, pendingChildren: null, implementation: n.implementation }, a;
  }
  function ym(n, a, u) {
    this.tag = a, this.current = null, this.containerInfo = n, this.pingCache = this.pendingChildren = null, this.finishedExpirationTime = 0, this.finishedWork = null, this.timeoutHandle = -1, this.pendingContext = this.context = null, this.hydrate = u, this.callbackNode = null, this.callbackPriority = 90, this.lastExpiredTime = this.lastPingedTime = this.nextKnownPendingLevel = this.lastSuspendedTime = this.firstSuspendedTime = this.firstPendingTime = 0;
  }
  function wm(n, a) {
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
  function ns(n, a) {
    var u = n.lastExpiredTime;
    (u === 0 || u > a) && (n.lastExpiredTime = a);
  }
  function eu(n, a, u, f) {
    var v = a.current, S = zn(), C = Ol.suspense;
    S = qa(S, v, C);
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
                if ($n(R.type)) {
                  R = R.stateNode.__reactInternalMemoizedMergedChildContext;
                  break t;
                }
            }
            R = R.return;
          } while (R !== null);
          throw Error(c(171));
        }
        if (u.tag === 1) {
          var H = u.type;
          if ($n(H)) {
            u = js(u, H, R);
            break e;
          }
        }
        u = R;
      } else
        u = zr;
    return a.context === null ? a.context = u : a.pendingContext = u, a = Wa(S, C), a.payload = { element: n }, f = f === void 0 ? null : f, f !== null && (a.callback = f), Fa(v, a), Ka(v, S), S;
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
  function tu(n, a) {
    Fc(n, a), (n = n.alternate) && Fc(n, a);
  }
  function Xf(n, a, u) {
    u = u != null && u.hydrate === !0;
    var f = new ym(n, a, u), v = Ur(3, null, null, a === 2 ? 7 : a === 1 ? 3 : 0);
    f.current = v, v.stateNode = f, hc(v), n[Io] = f.current, u && a !== 0 && So(n, n.nodeType === 9 ? n : n.ownerDocument), this._internalRoot = f;
  }
  Xf.prototype.render = function(n) {
    eu(n, this._internalRoot, null, null);
  }, Xf.prototype.unmount = function() {
    var n = this._internalRoot, a = n.containerInfo;
    eu(null, n, null, function() {
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
  function nu(n, a, u, f, v) {
    var S = u._reactRootContainer;
    if (S) {
      var C = S._internalRoot;
      if (typeof v == "function") {
        var R = v;
        v = function() {
          var U = Wc(C);
          R.call(U);
        };
      }
      eu(a, C, n, v);
    } else {
      if (S = u._reactRootContainer = Jf(u, f), C = S._internalRoot, typeof v == "function") {
        var H = v;
        v = function() {
          var U = Wc(C);
          H.call(U);
        };
      }
      lm(function() {
        eu(a, C, n, v);
      });
    }
    return Wc(C);
  }
  function Bg(n, a, u) {
    var f = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return { $$typeof: ji, key: f == null ? null : "" + f, children: n, containerInfo: a, implementation: u };
  }
  P = function(n) {
    if (n.tag === 13) {
      var a = jt(zn(), 150, 100);
      Ka(n, a), tu(n, a);
    }
  }, V = function(n) {
    n.tag === 13 && (Ka(n, 3), tu(n, 3));
  }, G = function(n) {
    if (n.tag === 13) {
      var a = zn();
      a = qa(a, n, null), Ka(n, a), tu(n, a);
    }
  }, he = function(n, a, u) {
    switch (a) {
      case "input":
        if (Pt(n, u), a = u.name, u.type === "radio" && a != null) {
          for (u = n; u.parentNode; )
            u = u.parentNode;
          for (u = u.querySelectorAll("input[name=" + JSON.stringify("" + a) + '][type="radio"]'), a = 0; a < u.length; a++) {
            var f = u[a];
            if (f !== n && f.form === n.form) {
              var v = bl(f);
              if (!v)
                throw Error(c(90));
              Er(f), Pt(f, v);
            }
          }
        }
        break;
      case "textarea":
        yo(n, u);
        break;
      case "select":
        a = u.value, a != null && qn(n, !!u.multiple, a, !1);
    }
  }, We = om, Ce = function(n, a, u, f, v) {
    var S = rt;
    rt |= 4;
    try {
      return Ct(98, n.bind(null, a, u, f, v));
    } finally {
      rt = S, rt === Pn && Ii();
    }
  }, Ve = function() {
    (rt & (1 | Qi | Br)) === Pn && (kg(), Qo());
  }, Ne = function(n, a) {
    var u = rt;
    rt |= 2;
    try {
      return n(a);
    } finally {
      rt = u, rt === Pn && Ii();
    }
  };
  function bm(n, a) {
    var u = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!ro(a))
      throw Error(c(200));
    return Bg(n, a, null, u);
  }
  var DS = { Events: [wl, Vi, bl, je, oe, Ns, function(n) {
    hn(n, Qd);
  }, fe, xe, ii, ea, Qo, { current: !1 }] };
  return function(n) {
    var a = n.findFiberByHostInstance;
    return Og(i({}, n, { overrideHookState: null, overrideProps: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: Wt.ReactCurrentDispatcher, findHostInstanceByFiber: function(u) {
      return u = bo(u), u === null ? null : u.stateNode;
    }, findFiberByHostInstance: function(u) {
      return a ? a(u) : null;
    }, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null }));
  }({
    findFiberByHostInstance: Ao,
    bundleType: 0,
    version: "16.14.0",
    rendererPackageName: "react-dom"
  }), br.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = DS, br.createPortal = bm, br.findDOMNode = function(n) {
    if (n == null)
      return null;
    if (n.nodeType === 1)
      return n;
    var a = n._reactInternalFiber;
    if (a === void 0)
      throw typeof n.render == "function" ? Error(c(188)) : Error(c(268, Object.keys(n)));
    return n = bo(a), n = n === null ? null : n.stateNode, n;
  }, br.flushSync = function(n, a) {
    if ((rt & (Qi | Br)) !== Pn)
      throw Error(c(187));
    var u = rt;
    rt |= 1;
    try {
      return Ct(99, n.bind(null, a));
    } finally {
      rt = u, Ii();
    }
  }, br.hydrate = function(n, a, u) {
    if (!ro(a))
      throw Error(c(200));
    return nu(null, n, a, !0, u);
  }, br.render = function(n, a, u) {
    if (!ro(a))
      throw Error(c(200));
    return nu(null, n, a, !1, u);
  }, br.unmountComponentAtNode = function(n) {
    if (!ro(n))
      throw Error(c(40));
    return n._reactRootContainer ? (lm(function() {
      nu(null, null, n, !1, function() {
        n._reactRootContainer = null, n[Io] = null;
      });
    }), !0) : !1;
  }, br.unstable_batchedUpdates = om, br.unstable_createPortal = function(n, a) {
    return bm(n, a, 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null);
  }, br.unstable_renderSubtreeIntoContainer = function(n, a, u, f) {
    if (!ro(u))
      throw Error(c(200));
    if (n == null || n._reactInternalFiber === void 0)
      throw Error(c(38));
    return nu(n, a, u, !1, f);
  }, br.version = "16.14.0", br;
}
var Sr = {}, Ab = { exports: {} }, Sa = {};
/** @license React v0.19.1
 * scheduler-tracing.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var KT;
function uO() {
  if (KT)
    return Sa;
  KT = 1;
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
var Rb = {};
/** @license React v0.19.1
 * scheduler-tracing.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var eM;
function cO() {
  return eM || (eM = 1, function(r) {
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
      function w() {
        return ++c;
      }
      function g(se, Z, ue) {
        var oe = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : i, Le = {
          __count: 1,
          id: o++,
          name: se,
          timestamp: Z
        }, Qe = r.__interactionsRef.current, je = new Set(Qe);
        je.add(Le), r.__interactionsRef.current = je;
        var Y = r.__subscriberRef.current, he;
        try {
          Y !== null && Y.onInteractionTraced(Le);
        } finally {
          try {
            Y !== null && Y.onWorkStarted(je, oe);
          } finally {
            try {
              he = ue();
            } finally {
              r.__interactionsRef.current = Qe;
              try {
                Y !== null && Y.onWorkStopped(je, oe);
              } finally {
                Le.__count--, Y !== null && Le.__count === 0 && Y.onInteractionScheduledWorkCompleted(Le);
              }
            }
          }
        }
        return he;
      }
      function x(se) {
        var Z = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : i, ue = r.__interactionsRef.current, oe = r.__subscriberRef.current;
        oe !== null && oe.onWorkScheduled(ue, Z), ue.forEach(function(je) {
          je.__count++;
        });
        var Le = !1;
        function Qe() {
          var je = r.__interactionsRef.current;
          r.__interactionsRef.current = ue, oe = r.__subscriberRef.current;
          try {
            var Y;
            try {
              oe !== null && oe.onWorkStarted(ue, Z);
            } finally {
              try {
                Y = se.apply(void 0, arguments);
              } finally {
                r.__interactionsRef.current = je, oe !== null && oe.onWorkStopped(ue, Z);
              }
            }
            return Y;
          } finally {
            Le || (Le = !0, ue.forEach(function(he) {
              he.__count--, oe !== null && he.__count === 0 && oe.onInteractionScheduledWorkCompleted(he);
            }));
          }
        }
        return Qe.cancel = function() {
          oe = r.__subscriberRef.current;
          try {
            oe !== null && oe.onWorkCanceled(ue, Z);
          } finally {
            ue.forEach(function(Y) {
              Y.__count--, oe && Y.__count === 0 && oe.onInteractionScheduledWorkCompleted(Y);
            });
          }
        }, Qe;
      }
      var T = null;
      T = /* @__PURE__ */ new Set();
      function A(se) {
        T.add(se), T.size === 1 && (r.__subscriberRef.current = {
          onInteractionScheduledWorkCompleted: F,
          onInteractionTraced: z,
          onWorkCanceled: de,
          onWorkScheduled: $,
          onWorkStarted: J,
          onWorkStopped: q
        });
      }
      function I(se) {
        T.delete(se), T.size === 0 && (r.__subscriberRef.current = null);
      }
      function z(se) {
        var Z = !1, ue = null;
        if (T.forEach(function(oe) {
          try {
            oe.onInteractionTraced(se);
          } catch (Le) {
            Z || (Z = !0, ue = Le);
          }
        }), Z)
          throw ue;
      }
      function F(se) {
        var Z = !1, ue = null;
        if (T.forEach(function(oe) {
          try {
            oe.onInteractionScheduledWorkCompleted(se);
          } catch (Le) {
            Z || (Z = !0, ue = Le);
          }
        }), Z)
          throw ue;
      }
      function $(se, Z) {
        var ue = !1, oe = null;
        if (T.forEach(function(Le) {
          try {
            Le.onWorkScheduled(se, Z);
          } catch (Qe) {
            ue || (ue = !0, oe = Qe);
          }
        }), ue)
          throw oe;
      }
      function J(se, Z) {
        var ue = !1, oe = null;
        if (T.forEach(function(Le) {
          try {
            Le.onWorkStarted(se, Z);
          } catch (Qe) {
            ue || (ue = !0, oe = Qe);
          }
        }), ue)
          throw oe;
      }
      function q(se, Z) {
        var ue = !1, oe = null;
        if (T.forEach(function(Le) {
          try {
            Le.onWorkStopped(se, Z);
          } catch (Qe) {
            ue || (ue = !0, oe = Qe);
          }
        }), ue)
          throw oe;
      }
      function de(se, Z) {
        var ue = !1, oe = null;
        if (T.forEach(function(Le) {
          try {
            Le.onWorkCanceled(se, Z);
          } catch (Qe) {
            ue || (ue = !0, oe = Qe);
          }
        }), ue)
          throw oe;
      }
      r.unstable_clear = h, r.unstable_getCurrent = m, r.unstable_getThreadID = w, r.unstable_subscribe = A, r.unstable_trace = g, r.unstable_unsubscribe = I, r.unstable_wrap = x;
    }();
  }(Rb)), Rb;
}
var tM;
function dO() {
  return tM || (tM = 1, function(r) {
    process.env.NODE_ENV === "production" ? r.exports = uO() : r.exports = cO();
  }(Ab)), Ab.exports;
}
/** @license React v16.14.0
 * react-dom.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var nM;
function fO() {
  return nM || (nM = 1, process.env.NODE_ENV !== "production" && function() {
    var r = dl.exports, i = yg(), o = LE(), c = zE(), h = dO(), m = r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    m.hasOwnProperty("ReactCurrentDispatcher") || (m.ReactCurrentDispatcher = {
      current: null
    }), m.hasOwnProperty("ReactCurrentBatchConfig") || (m.ReactCurrentBatchConfig = {
      suspense: null
    });
    function w(e) {
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
    var T = function(e, t, s, l, d, p, y, b, E) {
      var N = Array.prototype.slice.call(arguments, 3);
      try {
        t.apply(s, N);
      } catch (k) {
        this.onError(k);
      }
    };
    if (typeof window < "u" && typeof window.dispatchEvent == "function" && typeof document < "u" && typeof document.createEvent == "function") {
      var A = document.createElement("react"), I = function(e, t, s, l, d, p, y, b, E) {
        if (!(typeof document < "u"))
          throw Error("The `document` global was defined when React was initialized, but is not defined anymore. This can happen in a test environment if a component schedules an update from an asynchronous callback, but the test has already finished running. To solve this, you can either unmount the component at the end of your test (and ensure that any asynchronous operations get canceled in `componentWillUnmount`), or you can change the test itself to be asynchronous.");
        var N = document.createEvent("Event"), k = !0, X = window.event, L = Object.getOwnPropertyDescriptor(window, "event"), K = Array.prototype.slice.call(arguments, 3);
        function ve() {
          A.removeEventListener(vt, ve, !1), typeof window.event < "u" && window.hasOwnProperty("event") && (window.event = X), t.apply(s, K), k = !1;
        }
        var be, qe = !1, nt = !1;
        function zt(Qt) {
          if (be = Qt.error, qe = !0, be === null && Qt.colno === 0 && Qt.lineno === 0 && (nt = !0), Qt.defaultPrevented && be != null && typeof be == "object")
            try {
              be._suppressLogging = !0;
            } catch {
            }
        }
        var vt = "react-" + (e || "invokeguardedcallback");
        window.addEventListener("error", zt), A.addEventListener(vt, ve, !1), N.initEvent(vt, !1, !1), A.dispatchEvent(N), L && Object.defineProperty(window, "event", L), k && (qe ? nt && (be = new Error("A cross-origin error was thrown. React doesn't have access to the actual error object in development. See https://fb.me/react-crossorigin-error for more information.")) : be = new Error(`An error was thrown inside one of your components, but React doesn't know what it was. This is likely due to browser flakiness. React does its best to preserve the "Pause on exceptions" behavior of the DevTools, which requires some DEV-mode only tricks. It's possible that these don't work in your browser. Try triggering the error in production mode, or switching to a modern browser. If you suspect that this is actually an issue with React, please file an issue.`), this.onError(be)), window.removeEventListener("error", zt);
      };
      T = I;
    }
    var z = T, F = !1, $ = null, J = !1, q = null, de = {
      onError: function(e) {
        F = !0, $ = e;
      }
    };
    function se(e, t, s, l, d, p, y, b, E) {
      F = !1, $ = null, z.apply(de, arguments);
    }
    function Z(e, t, s, l, d, p, y, b, E) {
      if (se.apply(this, arguments), F) {
        var N = Le();
        J || (J = !0, q = N);
      }
    }
    function ue() {
      if (J) {
        var e = q;
        throw J = !1, q = null, e;
      }
    }
    function oe() {
      return F;
    }
    function Le() {
      if (F) {
        var e = $;
        return F = !1, $ = null, e;
      } else
        throw Error("clearCaughtError was called but no error was captured. This error is likely caused by a bug in React. Please file an issue.");
    }
    var Qe = null, je = null, Y = null;
    function he(e, t, s) {
      Qe = e, je = t, Y = s, (!Y || !je) && g("EventPluginUtils.setComponentTree(...): Injected module is missing getNodeFromInstance or getInstanceFromNode.");
    }
    var Ie;
    Ie = function(e) {
      var t = e._dispatchListeners, s = e._dispatchInstances, l = Array.isArray(t), d = l ? t.length : t ? 1 : 0, p = Array.isArray(s), y = p ? s.length : s ? 1 : 0;
      (p !== l || y !== d) && g("EventPluginUtils: Invalid `event`.");
    };
    function ie(e, t, s) {
      var l = e.type || "unknown-event";
      e.currentTarget = Y(s), Z(l, t, void 0, e), e.currentTarget = null;
    }
    function st(e) {
      var t = e._dispatchListeners, s = e._dispatchInstances;
      if (Ie(e), Array.isArray(t))
        for (var l = 0; l < t.length && !e.isPropagationStopped(); l++)
          ie(e, t[l], s[l]);
      else
        t && ie(e, t, s);
      e._dispatchListeners = null, e._dispatchInstances = null;
    }
    var fe = 0, xe = 1, We = 2, Ce = 3, Ve = 4, Ne = 5, $e = 6, bt = 7, Xt = 8, Ge = 9, re = 10, D = 11, B = 12, ee = 13, ye = 14, me = 15, ot = 16, Ze = 17, ze = 18, dt = 19, Mt = 20, Wt = 21, St = 22, Ln = null, Ft = {};
    function Bi() {
      if (!!Ln)
        for (var e in Ft) {
          var t = Ft[e], s = Ln.indexOf(e);
          if (!(s > -1))
            throw Error("EventPluginRegistry: Cannot inject event plugins that do not exist in the plugin ordering, `" + e + "`.");
          if (!at[s]) {
            if (!t.extractEvents)
              throw Error("EventPluginRegistry: Event plugins must implement an `extractEvents` method, but `" + e + "` does not.");
            at[s] = t;
            var l = t.eventTypes;
            for (var d in l)
              if (!ji(l[d], t, d))
                throw Error("EventPluginRegistry: Failed to publish event `" + d + "` for plugin `" + e + "`.");
          }
        }
    }
    function ji(e, t, s) {
      if (Fe.hasOwnProperty(s))
        throw Error("EventPluginRegistry: More than one plugin attempted to publish the same event name, `" + s + "`.");
      Fe[s] = e;
      var l = e.phasedRegistrationNames;
      if (l) {
        for (var d in l)
          if (l.hasOwnProperty(d)) {
            var p = l[d];
            Ae(p, t, s);
          }
        return !0;
      } else if (e.registrationName)
        return Ae(e.registrationName, t, s), !0;
      return !1;
    }
    function Ae(e, t, s) {
      if (Et[e])
        throw Error("EventPluginRegistry: More than one plugin attempted to publish the same registration name, `" + e + "`.");
      Et[e] = t, Si[e] = t.eventTypes[s].dependencies;
      {
        var l = e.toLowerCase();
        wn[l] = e, e === "onDoubleClick" && (wn.ondblclick = e);
      }
    }
    var at = [], Fe = {}, Et = {}, Si = {}, wn = {};
    function Yr(e) {
      if (Ln)
        throw Error("EventPluginRegistry: Cannot inject event plugin ordering more than once. You are likely trying to load more than one copy of React.");
      Ln = Array.prototype.slice.call(e), Bi();
    }
    function Tr(e) {
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
      t && Bi();
    }
    var Bn = typeof window < "u" && typeof window.document < "u" && typeof window.document.createElement < "u", Gr = 1, Ui = 1 << 5, Ma = 1 << 6, Ea = null, ui = null, er = null;
    function ci(e) {
      var t = je(e);
      if (!!t) {
        if (typeof Ea != "function")
          throw Error("setRestoreImplementation() needs to be called to handle a target for controlled events. This error is likely caused by a bug in React. Please file an issue.");
        var s = t.stateNode;
        if (s) {
          var l = Qe(s);
          Ea(t.stateNode, t.type, l);
        }
      }
    }
    function Ia(e) {
      Ea = e;
    }
    function xi(e) {
      ui ? er ? er.push(e) : er = [e] : ui = e;
    }
    function Xr() {
      return ui !== null || er !== null;
    }
    function Cs() {
      if (!!ui) {
        var e = ui, t = er;
        if (ui = null, er = null, ci(e), t)
          for (var s = 0; s < t.length; s++)
            ci(t[s]);
      }
    }
    var Mr = !0, Er = !1, mn = !1, Jn = !1, Aa = function(e, t) {
      return e(t);
    }, Pt = function(e, t, s, l, d) {
      return e(t, s, l, d);
    }, nn = function() {
    }, Ci = Aa, Dn = !1, Ti = !1;
    function qn() {
      var e = Xr();
      e && (nn(), Cs());
    }
    function Jr(e, t) {
      if (Dn)
        return e(t);
      Dn = !0;
      try {
        return Aa(e, t);
      } finally {
        Dn = !1, qn();
      }
    }
    function Ra(e, t, s) {
      if (Ti)
        return e(t, s);
      Ti = !0;
      try {
        return Ci(e, t, s);
      } finally {
        Ti = !1, qn();
      }
    }
    function yo(e, t, s, l, d) {
      var p = Dn;
      Dn = !0;
      try {
        return Pt(e, t, s, l, d);
      } finally {
        Dn = p, Dn || qn();
      }
    }
    function wo(e) {
      !Dn && !Er && nn();
    }
    function Ts(e, t, s, l) {
      Aa = e, Pt = t, nn = s, Ci = l;
    }
    var Da = 0, Nn = 1, Ir = 2, qr = 0, Kn = 1, Ar = 2, jn = 3, tr = 4, Ms = 5, Kr = 6, Es = ":A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD", ne = Es + "\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040", ce = "data-reactroot", Xe = new RegExp("^[" + Es + "][" + ne + "]*$"), pt = Object.prototype.hasOwnProperty, Jt = {}, Zt = {};
    function fn(e) {
      return pt.call(Zt, e) ? !0 : pt.call(Jt, e) ? !1 : Xe.test(e) ? (Zt[e] = !0, !0) : (Jt[e] = !0, g("Invalid attribute name: `%s`", e), !1);
    }
    function ei(e, t, s) {
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
    function Na(e, t, s, l) {
      if (t === null || typeof t > "u" || qt(e, t, s, l))
        return !0;
      if (l)
        return !1;
      if (s !== null)
        switch (s.type) {
          case jn:
            return !t;
          case tr:
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
    function rn(e, t, s, l, d, p) {
      this.acceptsBooleans = t === Ar || t === jn || t === tr, this.attributeName = l, this.attributeNamespace = d, this.mustUseProperty = s, this.propertyName = e, this.type = t, this.sanitizeURL = p;
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
      hn[e] = new rn(
        e,
        qr,
        !1,
        e,
        null,
        !1
      );
    }), [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(e) {
      var t = e[0], s = e[1];
      hn[t] = new rn(
        t,
        Kn,
        !1,
        s,
        null,
        !1
      );
    }), ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(e) {
      hn[e] = new rn(
        e,
        Ar,
        !1,
        e.toLowerCase(),
        null,
        !1
      );
    }), ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(e) {
      hn[e] = new rn(
        e,
        Ar,
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
      hn[e] = new rn(
        e,
        jn,
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
      hn[e] = new rn(
        e,
        jn,
        !0,
        e,
        null,
        !1
      );
    }), [
      "capture",
      "download"
    ].forEach(function(e) {
      hn[e] = new rn(
        e,
        tr,
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
      hn[e] = new rn(
        e,
        Kr,
        !1,
        e,
        null,
        !1
      );
    }), ["rowSpan", "start"].forEach(function(e) {
      hn[e] = new rn(
        e,
        Ms,
        !1,
        e.toLowerCase(),
        null,
        !1
      );
    });
    var fl = /[\-\:]([a-z])/g, ea = function(e) {
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
      var t = e.replace(fl, ea);
      hn[t] = new rn(
        t,
        Kn,
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
      var t = e.replace(fl, ea);
      hn[t] = new rn(
        t,
        Kn,
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
      var t = e.replace(fl, ea);
      hn[t] = new rn(
        t,
        Kn,
        !1,
        e,
        "http://www.w3.org/XML/1998/namespace",
        !1
      );
    }), ["tabIndex", "crossOrigin"].forEach(function(e) {
      hn[e] = new rn(
        e,
        Kn,
        !1,
        e.toLowerCase(),
        null,
        !1
      );
    });
    var hl = "xlinkHref";
    hn[hl] = new rn(
      "xlinkHref",
      Kn,
      !1,
      "xlink:href",
      "http://www.w3.org/1999/xlink",
      !0
    ), ["src", "href", "action", "formAction"].forEach(function(e) {
      hn[e] = new rn(
        e,
        Kn,
        !1,
        e.toLowerCase(),
        null,
        !0
      );
    }), m.ReactDebugCurrentFrame;
    var Lu = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*\:/i, As = !1;
    function pl(e) {
      !As && Lu.test(e) && (As = !0, g("A future version of React will block javascript: URLs as a security precaution. Use event handlers instead if you can. If you need to generate unsafe HTML try using dangerouslySetInnerHTML instead. React was passed %s.", JSON.stringify(e)));
    }
    function Bu(e, t, s, l) {
      if (l.mustUseProperty) {
        var d = l.propertyName;
        return e[d];
      } else {
        l.sanitizeURL && pl("" + s);
        var p = l.attributeName, y = null;
        if (l.type === tr) {
          if (e.hasAttribute(p)) {
            var b = e.getAttribute(p);
            return b === "" ? !0 : Na(t, s, l, !1) ? b : b === "" + s ? s : b;
          }
        } else if (e.hasAttribute(p)) {
          if (Na(t, s, l, !1))
            return e.getAttribute(p);
          if (l.type === jn)
            return s;
          y = e.getAttribute(p);
        }
        return Na(t, s, l, !1) ? y === null ? s : y : y === "" + s ? s : y;
      }
    }
    function ml(e, t, s) {
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
      if (!ei(t, d, l)) {
        if (Na(t, s, d, l) && (s = null), l || d === null) {
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
            e[b] = E === jn ? !1 : "";
          } else
            e[b] = s;
          return;
        }
        var N = d.attributeName, k = d.attributeNamespace;
        if (s === null)
          e.removeAttribute(N);
        else {
          var X = d.type, L;
          X === jn || X === tr && s === !0 ? L = "" : (L = "" + s, d.sanitizeURL && pl(L.toString())), k ? e.setAttributeNS(k, N, L) : e.setAttribute(N, L);
        }
      }
    }
    var P = /^(.*)[\\\/]/;
    function V(e, t, s) {
      var l = "";
      if (t) {
        var d = t.fileName, p = d.replace(P, "");
        if (/^index\./.test(p)) {
          var y = d.match(P);
          if (y) {
            var b = y[1];
            if (b) {
              var E = b.replace(P, "");
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
    var G = typeof Symbol == "function" && Symbol.for, Se = G ? Symbol.for("react.element") : 60103, Ye = G ? Symbol.for("react.portal") : 60106, Be = G ? Symbol.for("react.fragment") : 60107, et = G ? Symbol.for("react.strict_mode") : 60108, kt = G ? Symbol.for("react.profiler") : 60114, vn = G ? Symbol.for("react.provider") : 60109, bn = G ? Symbol.for("react.context") : 60110, Cn = G ? Symbol.for("react.concurrent_mode") : 60111, ti = G ? Symbol.for("react.forward_ref") : 60112, ni = G ? Symbol.for("react.suspense") : 60113, So = G ? Symbol.for("react.suspense_list") : 60120, ta = G ? Symbol.for("react.memo") : 60115, nr = G ? Symbol.for("react.lazy") : 60116, xo = G ? Symbol.for("react.block") : 60121, pp = typeof Symbol == "function" && Symbol.iterator, wg = "@@iterator";
    function Rr(e) {
      if (e === null || typeof e != "object")
        return null;
      var t = pp && e[pp] || e[wg];
      return typeof t == "function" ? t : null;
    }
    var mp = -1, _d = 0, Rs = 1, vp = 2;
    function zd(e) {
      return e._status === Rs ? e._result : null;
    }
    function gp(e) {
      if (e._status === mp) {
        e._status = _d;
        var t = e._ctor, s = t();
        e._result = s, s.then(function(l) {
          if (e._status === _d) {
            var d = l.default;
            d === void 0 && g(`lazy: Expected the result of a dynamic import() call. Instead received: %s

Your code should look like: 
  const MyComponent = lazy(() => import('./MyComponent'))`, l), e._status = Rs, e._result = d;
          }
        }, function(l) {
          e._status === _d && (e._status = vp, e._result = l);
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
        case Be:
          return "Fragment";
        case Ye:
          return "Portal";
        case kt:
          return "Profiler";
        case et:
          return "StrictMode";
        case ni:
          return "Suspense";
        case So:
          return "SuspenseList";
      }
      if (typeof e == "object")
        switch (e.$$typeof) {
          case bn:
            return "Context.Consumer";
          case vn:
            return "Context.Provider";
          case ti:
            return Od(e, e.render, "ForwardRef");
          case ta:
            return Te(e.type);
          case xo:
            return Te(e.render);
          case nr: {
            var t = e, s = zd(t);
            if (s)
              return Te(s);
            break;
          }
        }
      return null;
    }
    var ju = m.ReactDebugCurrentFrame;
    function yp(e) {
      switch (e.tag) {
        case Ce:
        case Ve:
        case $e:
        case bt:
        case re:
        case Ge:
          return "";
        default:
          var t = e._debugOwner, s = e._debugSource, l = Te(e.type), d = null;
          return t && (d = Te(t.type)), V(l, s, d);
      }
    }
    function Fn(e) {
      var t = "", s = e;
      do
        t += yp(s), s = s.return;
      while (s);
      return t;
    }
    var na = null, vl = !1;
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
      return na === null ? "" : Fn(na);
    }
    function ir() {
      ju.getCurrentStack = null, na = null, vl = !1;
    }
    function Co(e) {
      ju.getCurrentStack = ft, na = e, vl = !1;
    }
    function Dr(e) {
      vl = e;
    }
    function ii(e) {
      return "" + e;
    }
    function Nr(e) {
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
      var wp = {
        button: !0,
        checkbox: !0,
        image: !0,
        hidden: !0,
        radio: !0,
        reset: !0,
        submit: !0
      }, bp = {
        value: function(e, t, s) {
          return wp[e.type] || e.onChange || e.readOnly || e.disabled || e[t] == null || Er ? null : new Error("You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`.");
        },
        checked: function(e, t, s) {
          return e.onChange || e.readOnly || e.disabled || e[t] == null || Er ? null : new Error("You provided a `checked` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultChecked`. Otherwise, set either `onChange` or `readOnly`.");
        }
      };
      Uu.checkPropTypes = function(e, t) {
        c(bp, t, "prop", e, To.getStackAddendum);
      };
    }
    function Sp(e) {
      var t = e.type, s = e.nodeName;
      return s && s.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
    }
    function Vu(e) {
      return e._valueTracker;
    }
    function Ld(e) {
      e._valueTracker = null;
    }
    function xp(e) {
      var t = "";
      return e && (Sp(e) ? t = e.checked ? "true" : "false" : t = e.value), t;
    }
    function ia(e) {
      var t = Sp(e) ? "checked" : "value", s = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), l = "" + e[t];
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
        var y = {
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
        return y;
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
      var s = t.getValue(), l = xp(e);
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
      Uu.checkPropTypes("input", t), t.checked !== void 0 && t.defaultChecked !== void 0 && !jd && (g("%s contains an input of type %s with both checked and defaultChecked props. Input elements must be either controlled or uncontrolled (specify either the checked prop, or the defaultChecked prop, but not both). Decide between using a controlled or uncontrolled input element and remove one of these props. More info: https://fb.me/react-controlled-components", ka() || "A component", t.type), jd = !0), t.value !== void 0 && t.defaultValue !== void 0 && !Bd && (g("%s contains an input of type %s with both value and defaultValue props. Input elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled input element and remove one of these props. More info: https://fb.me/react-controlled-components", ka() || "A component", t.type), Bd = !0);
      var s = e, l = t.defaultValue == null ? "" : t.defaultValue;
      s._wrapperState = {
        initialChecked: t.checked != null ? t.checked : t.defaultChecked,
        initialValue: Nr(t.value != null ? t.value : l),
        controlled: Wu(t)
      };
    }
    function $u(e, t) {
      var s = e, l = t.checked;
      l != null && M(s, "checked", l, !1);
    }
    function gl(e, t) {
      var s = e;
      {
        var l = Wu(t);
        !s._wrapperState.controlled && l && !Vd && (g("A component is changing an uncontrolled input of type %s to be controlled. Input elements should not switch from uncontrolled to controlled (or vice versa). Decide between using a controlled or uncontrolled input element for the lifetime of the component. More info: https://fb.me/react-controlled-components", t.type), Vd = !0), s._wrapperState.controlled && !l && !Ud && (g("A component is changing a controlled input of type %s to be uncontrolled. Input elements should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled input element for the lifetime of the component. More info: https://fb.me/react-controlled-components", t.type), Ud = !0);
      }
      $u(e, t);
      var d = Nr(t.value), p = t.type;
      if (d != null)
        p === "number" ? (d === 0 && s.value === "" || s.value != d) && (s.value = ii(d)) : s.value !== ii(d) && (s.value = ii(d));
      else if (p === "submit" || p === "reset") {
        s.removeAttribute("value");
        return;
      }
      t.hasOwnProperty("value") ? yl(s, t.type, d) : t.hasOwnProperty("defaultValue") && yl(s, t.type, Nr(t.defaultValue)), t.checked == null && t.defaultChecked != null && (s.defaultChecked = !!t.defaultChecked);
    }
    function Qu(e, t, s) {
      var l = e;
      if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
        var d = t.type, p = d === "submit" || d === "reset";
        if (p && (t.value === void 0 || t.value === null))
          return;
        var y = ii(l._wrapperState.initialValue);
        s || y !== l.value && (l.value = y), l.defaultValue = y;
      }
      var b = l.name;
      b !== "" && (l.name = ""), l.defaultChecked = !l.defaultChecked, l.defaultChecked = !!l._wrapperState.initialChecked, b !== "" && (l.name = b);
    }
    function Wd(e, t) {
      var s = e;
      gl(s, t), Cp(s, t);
    }
    function Cp(e, t) {
      var s = t.name;
      if (t.type === "radio" && s != null) {
        for (var l = e; l.parentNode; )
          l = l.parentNode;
        for (var d = l.querySelectorAll("input[name=" + JSON.stringify("" + s) + '][type="radio"]'), p = 0; p < d.length; p++) {
          var y = d[p];
          if (!(y === e || y.form !== e.form)) {
            var b = Hg(y);
            if (!b)
              throw Error("ReactDOMInput: Mixing React and non-React radio inputs with the same `name` is not supported.");
            Hu(y), gl(y, b);
          }
        }
      }
    }
    function yl(e, t, s) {
      (t !== "number" || e.ownerDocument.activeElement !== e) && (s == null ? e.defaultValue = ii(e._wrapperState.initialValue) : e.defaultValue !== ii(s) && (e.defaultValue = ii(s)));
    }
    var Zu = !1, Tp = !1;
    function Mo(e) {
      var t = "";
      return r.Children.forEach(e, function(s) {
        s != null && (t += s);
      }), t;
    }
    function Fd(e, t) {
      typeof t.children == "object" && t.children !== null && r.Children.forEach(t.children, function(s) {
        s != null && (typeof s == "string" || typeof s == "number" || typeof s.type == "string" && (Tp || (Tp = !0, g("Only strings and numbers are supported as <option> children."))));
      }), t.selected != null && !Zu && (g("Use the `defaultValue` or `value` props on <select> instead of setting `selected` on <option>."), Zu = !0);
    }
    function $d(e, t) {
      t.value != null && e.setAttribute("value", ii(Nr(t.value)));
    }
    function kr(e, t) {
      var s = i({
        children: void 0
      }, t), l = Mo(t.children);
      return l && (s.children = l), s;
    }
    var Eo;
    Eo = !1;
    function Io() {
      var e = ka();
      return e ? `

Check the render method of \`` + e + "`." : "";
    }
    var Ao = ["value", "defaultValue"];
    function wl(e) {
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
    function Vi(e, t, s, l) {
      var d = e.options;
      if (t) {
        for (var p = s, y = {}, b = 0; b < p.length; b++)
          y["$" + p[b]] = !0;
        for (var E = 0; E < d.length; E++) {
          var N = y.hasOwnProperty("$" + d[E].value);
          d[E].selected !== N && (d[E].selected = N), N && l && (d[E].defaultSelected = !0);
        }
      } else {
        for (var k = ii(Nr(s)), X = null, L = 0; L < d.length; L++) {
          if (d[L].value === k) {
            d[L].selected = !0, l && (d[L].defaultSelected = !0);
            return;
          }
          X === null && !d[L].disabled && (X = d[L]);
        }
        X !== null && (X.selected = !0);
      }
    }
    function bl(e, t) {
      return i({}, t, {
        value: void 0
      });
    }
    function Pr(e, t) {
      var s = e;
      wl(t), s._wrapperState = {
        wasMultiple: !!t.multiple
      }, t.value !== void 0 && t.defaultValue !== void 0 && !Eo && (g("Select elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled select element and remove one of these props. More info: https://fb.me/react-controlled-components"), Eo = !0);
    }
    function Mp(e, t) {
      var s = e;
      s.multiple = !!t.multiple;
      var l = t.value;
      l != null ? Vi(s, !!t.multiple, l, !1) : t.defaultValue != null && Vi(s, !!t.multiple, t.defaultValue, !0);
    }
    function Ep(e, t) {
      var s = e, l = s._wrapperState.wasMultiple;
      s._wrapperState.wasMultiple = !!t.multiple;
      var d = t.value;
      d != null ? Vi(s, !!t.multiple, d, !1) : l !== !!t.multiple && (t.defaultValue != null ? Vi(s, !!t.multiple, t.defaultValue, !0) : Vi(s, !!t.multiple, t.multiple ? [] : "", !1));
    }
    function bg(e, t) {
      var s = e, l = t.value;
      l != null && Vi(s, !!t.multiple, l, !1);
    }
    var Yu = !1;
    function Qd(e, t) {
      var s = e;
      if (t.dangerouslySetInnerHTML != null)
        throw Error("`dangerouslySetInnerHTML` does not make sense on <textarea>.");
      var l = i({}, t, {
        value: void 0,
        defaultValue: void 0,
        children: ii(s._wrapperState.initialValue)
      });
      return l;
    }
    function Ns(e, t) {
      var s = e;
      Uu.checkPropTypes("textarea", t), t.value !== void 0 && t.defaultValue !== void 0 && !Yu && (g("%s contains a textarea with both value and defaultValue props. Textarea elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled textarea and remove one of these props. More info: https://fb.me/react-controlled-components", ka() || "A component"), Yu = !0);
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
        initialValue: Nr(l)
      };
    }
    function ra(e, t) {
      var s = e, l = Nr(t.value), d = Nr(t.defaultValue);
      if (l != null) {
        var p = ii(l);
        p !== s.value && (s.value = p), t.defaultValue == null && s.defaultValue !== p && (s.defaultValue = p);
      }
      d != null && (s.defaultValue = ii(d));
    }
    function Gu(e, t) {
      var s = e, l = s.textContent;
      l === s._wrapperState.initialValue && l !== "" && l !== null && (s.value = l);
    }
    function Xu(e, t) {
      ra(e, t);
    }
    var Sl = "http://www.w3.org/1999/xhtml", xl = "http://www.w3.org/1998/Math/MathML", Ro = "http://www.w3.org/2000/svg", di = {
      html: Sl,
      mathml: xl,
      svg: Ro
    };
    function Zd(e) {
      switch (e) {
        case "svg":
          return Ro;
        case "math":
          return xl;
        default:
          return Sl;
      }
    }
    function Yd(e, t) {
      return e == null || e === Sl ? Zd(t) : e === Ro && t === "foreignObject" ? Sl : e;
    }
    var Ip = function(e) {
      return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, s, l, d) {
        MSApp.execUnsafeLocalFunction(function() {
          return e(t, s, l, d);
        });
      } : e;
    }, Ju, Ap = Ip(function(e, t) {
      if (e.namespaceURI === di.svg && !("innerHTML" in e)) {
        Ju = Ju || document.createElement("div"), Ju.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>";
        for (var s = Ju.firstChild; e.firstChild; )
          e.removeChild(e.firstChild);
        for (; s.firstChild; )
          e.appendChild(s.firstChild);
        return;
      }
      e.innerHTML = t;
    }), rr = 1, ar = 3, ri = 8, Pa = 9, qu = 11, Cl = function(e, t) {
      if (t) {
        var s = e.firstChild;
        if (s && s === e.lastChild && s.nodeType === ar) {
          s.nodeValue = t;
          return;
        }
      }
      e.textContent = t;
    };
    function _a(e) {
      return e;
    }
    function Sg(e) {
      return e;
    }
    function Tl(e, t) {
      var s = {};
      return s[e.toLowerCase()] = t.toLowerCase(), s["Webkit" + e] = "webkit" + t, s["Moz" + e] = "moz" + t, s;
    }
    var ks = {
      animationend: Tl("Animation", "AnimationEnd"),
      animationiteration: Tl("Animation", "AnimationIteration"),
      animationstart: Tl("Animation", "AnimationStart"),
      transitionend: Tl("Transition", "TransitionEnd")
    }, za = {}, Rp = {};
    Bn && (Rp = document.createElement("div").style, "AnimationEvent" in window || (delete ks.animationend.animation, delete ks.animationiteration.animation, delete ks.animationstart.animation), "TransitionEvent" in window || delete ks.transitionend.transition);
    function Ku(e) {
      if (za[e])
        return za[e];
      if (!ks[e])
        return e;
      var t = ks[e];
      for (var s in t)
        if (t.hasOwnProperty(s) && s in Rp)
          return za[e] = t[s];
      return e;
    }
    var Gd = "abort", Dp = Ku("animationend"), Xd = Ku("animationiteration"), Jd = Ku("animationstart"), Un = "blur", Ps = "canplay", _s = "canplaythrough", ec = "cancel", Oa = "change", Ml = "click", Do = "close", aa = "compositionend", El = "compositionstart", qd = "compositionupdate", Il = "contextmenu", Kd = "copy", ef = "cut", tf = "dblclick", zs = "auxclick", Np = "drag", Al = "dragend", Os = "dragenter", nf = "dragexit", Rl = "dragleave", rf = "dragover", tc = "dragstart", Ls = "drop", nc = "durationchange", Bs = "emptied", af = "encrypted", sf = "ended", Mi = "error", Hi = "focus", sa = "gotpointercapture", Dl = "input", _r = "invalid", Vn = "keydown", Wi = "keypress", ai = "keyup", La = "load", ic = "loadstart", of = "loadeddata", lf = "loadedmetadata", rc = "lostpointercapture", oa = "mousedown", Nl = "mousemove", Ba = "mouseout", la = "mouseover", kl = "mouseup", Pl = "paste", uf = "pause", cf = "play", df = "playing", ff = "pointercancel", hf = "pointerdown", ac = "pointermove", Ei = "pointerout", xt = "pointerover", an = "pointerup", zr = "progress", kn = "ratechange", Tn = "reset", Or = "scroll", ja = "seeked", $n = "seeking", Ua = "selectionchange", sc = "stalled", js = "submit", No = "suspend", _l = "textInput", pf = "timeupdate", ko = "toggle", oc = "touchcancel", lc = "touchend", uc = "touchmove", mf = "touchstart", zl = Ku("transitionend"), cc = "volumechange", dc = "waiting", vf = "wheel", Po = [Gd, Ps, _s, nc, Bs, af, sf, Mi, of, lf, ic, uf, cf, df, zr, kn, ja, $n, sc, No, pf, cc, dc];
    function gf(e) {
      return e;
    }
    var xg = typeof WeakMap == "function" ? WeakMap : Map, kp = new xg();
    function sr(e) {
      var t = kp.get(e);
      return t === void 0 && (t = /* @__PURE__ */ new Map(), kp.set(e, t)), t;
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
    var _t = 0, or = 1, Sn = 2, Ct = 4, _p = 6, Us = 8, Ii = 16, wf = 32, jt = 64, fi = 128, Va = 256, Ha = 512, Fi = 1024, fc = 1028, bf = 932, Sf = 2047, _o = 2048, hi = 4096, $i = m.ReactCurrentOwner;
    function pi(e) {
      var t = e, s = e;
      if (e.alternate)
        for (; t.return; )
          t = t.return;
      else {
        var l = t;
        do
          t = l, (t.effectTag & (Sn | Fi)) !== _t && (s = t.return), l = t.return;
        while (l);
      }
      return t.tag === Ce ? s : null;
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
      return e.tag === Ce ? e.stateNode.containerInfo : null;
    }
    function Wa(e) {
      return pi(e) === e;
    }
    function Fa(e) {
      {
        var t = $i.current;
        if (t !== null && t.tag === xe) {
          var s = t, l = s.stateNode;
          l._warnedAboutRefsInRender || g("%s is accessing isMounted inside its render() function. render() should be a pure function of props and state. It should never access something that requires stale data from the previous render, such as refs. Move this logic to componentDidMount and componentDidUpdate instead.", Te(s.type) || "A component"), l._warnedAboutRefsInRender = !0;
        }
      }
      var d = ua(e);
      return d ? pi(d) === d : !1;
    }
    function xf(e) {
      if (pi(e) !== e)
        throw Error("Unable to find node on an unmounted component.");
    }
    function zo(e) {
      var t = e.alternate;
      if (!t) {
        var s = pi(e);
        if (s === null)
          throw Error("Unable to find node on an unmounted component.");
        return s !== e ? null : e;
      }
      for (var l = e, d = t; ; ) {
        var p = l.return;
        if (p === null)
          break;
        var y = p.alternate;
        if (y === null) {
          var b = p.return;
          if (b !== null) {
            l = d = b;
            continue;
          }
          break;
        }
        if (p.child === y.child) {
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
          l = p, d = y;
        else {
          for (var N = !1, k = p.child; k; ) {
            if (k === l) {
              N = !0, l = p, d = y;
              break;
            }
            if (k === d) {
              N = !0, d = p, l = y;
              break;
            }
            k = k.sibling;
          }
          if (!N) {
            for (k = y.child; k; ) {
              if (k === l) {
                N = !0, l = y, d = p;
                break;
              }
              if (k === d) {
                N = !0, d = y, l = p;
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
      if (l.tag !== Ce)
        throw Error("Unable to find node on an unmounted component.");
      return l.stateNode.current === l ? e : t;
    }
    function Cf(e) {
      var t = zo(e);
      if (!t)
        return null;
      for (var s = t; ; ) {
        if (s.tag === Ne || s.tag === $e)
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
    function Ol(e) {
      var t = zo(e);
      if (!t)
        return null;
      for (var s = t; ; ) {
        if (s.tag === Ne || s.tag === $e || mn)
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
    var $a = null, zp = function(e) {
      e && (st(e), e.isPersistent() || e.constructor.release(e));
    }, Op = function(e) {
      return zp(e);
    };
    function mc(e) {
      e !== null && ($a = Vs($a, e));
      var t = $a;
      if ($a = null, !!t) {
        if (Oo(t, Op), $a)
          throw Error("processEventQueue(): Additional events were enqueued while processing an event queue. Support for this has not yet been implemented.");
        ue();
      }
    }
    function Ll(e) {
      var t = e.target || e.srcElement || window;
      return t.correspondingUseElement && (t = t.correspondingUseElement), t.nodeType === ar ? t.parentNode : t;
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
    function Bl(e) {
      if (!Bn)
        return !1;
      var t = "on" + e, s = t in document;
      if (!s) {
        var l = document.createElement("div");
        l.setAttribute(t, "return;"), s = typeof l[t] == "function";
      }
      return s;
    }
    var jl = 10, Hs = [];
    function Lp(e) {
      e.topLevelType = null, e.nativeEvent = null, e.targetInst = null, e.ancestors.length = 0, Hs.length < jl && Hs.push(e);
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
      if (e.tag === Ce)
        return e.stateNode.containerInfo;
      for (; e.return; )
        e = e.return;
      return e.tag !== Ce ? null : e.stateNode.containerInfo;
    }
    function Ul(e, t, s, l, d) {
      for (var p = null, y = 0; y < at.length; y++) {
        var b = at[y];
        if (b) {
          var E = b.extractEvents(e, t, s, l, d);
          E && (p = Vs(p, E));
        }
      }
      return p;
    }
    function Lr(e, t, s, l, d) {
      var p = Ul(e, t, s, l, d);
      mc(p);
    }
    function Vl(e) {
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
        (p === Ne || p === $e) && e.ancestors.push(s), s = eh(d);
      } while (s);
      for (var y = 0; y < e.ancestors.length; y++) {
        t = e.ancestors[y];
        var b = Ll(e.nativeEvent), E = e.topLevelType, N = e.nativeEvent, k = e.eventSystemFlags;
        y === 0 && (k |= Ma), Lr(E, t, N, b, k);
      }
    }
    function Bo(e, t, s, l) {
      var d = Lo(e, s, l, t);
      try {
        Ra(Vl, d);
      } finally {
        Lp(d);
      }
    }
    function Ws(e, t) {
      for (var s = sr(t), l = Si[e], d = 0; d < l.length; d++) {
        var p = l[d];
        vc(p, t, s);
      }
    }
    function vc(e, t, s) {
      if (!s.has(e)) {
        switch (e) {
          case Or:
            Rc(Or, t);
            break;
          case Hi:
          case Un:
            Rc(Hi, t), Rc(Un, t), s.set(Un, null), s.set(Hi, null);
            break;
          case ec:
          case Do:
            Bl(gf(e)) && Rc(e, t);
            break;
          case _r:
          case js:
          case Tn:
            break;
          default:
            var l = Po.indexOf(e) !== -1;
            l || Yt(e, t);
            break;
        }
        s.set(e, null);
      }
    }
    function jo(e, t) {
      for (var s = sr(t), l = Si[e], d = 0; d < l.length; d++) {
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
    var mi = !1, Qn = [], $t = null, sn = null, on = null, Qa = /* @__PURE__ */ new Map(), Hn = /* @__PURE__ */ new Map(), Fs = [];
    function If() {
      return Qn.length > 0;
    }
    var $s = [oa, kl, oc, lc, mf, zs, tf, ff, hf, an, Al, tc, Ls, aa, El, Vn, Wi, ai, Dl, _l, Do, ec, Kd, ef, Pl, Ml, Oa, Il, Tn, js], Uo = [Hi, Un, Os, Rl, la, Ba, xt, Ei, sa, rc];
    function Za(e) {
      return $s.indexOf(e) > -1;
    }
    function Hl(e, t, s) {
      vc(e, t, s);
    }
    function bc(e, t) {
      var s = sr(t);
      $s.forEach(function(l) {
        Hl(l, t, s);
      }), Uo.forEach(function(l) {
        Hl(l, t, s);
      });
    }
    function Sc(e, t, s, l, d) {
      return {
        blockedOn: e,
        topLevelType: t,
        eventSystemFlags: s | Ui,
        nativeEvent: d,
        container: l
      };
    }
    function xc(e, t, s, l, d) {
      var p = Sc(e, t, s, l, d);
      Qn.push(p);
    }
    function Af(e, t) {
      switch (e) {
        case Hi:
        case Un:
          $t = null;
          break;
        case Os:
        case Rl:
          sn = null;
          break;
        case la:
        case Ba:
          on = null;
          break;
        case xt:
        case Ei: {
          var s = t.pointerId;
          Qa.delete(s);
          break;
        }
        case sa:
        case rc: {
          var l = t.pointerId;
          Hn.delete(l);
          break;
        }
      }
    }
    function Qs(e, t, s, l, d, p) {
      if (e === null || e.nativeEvent !== p) {
        var y = Sc(t, s, l, d, p);
        if (t !== null) {
          var b = Zo(t);
          b !== null && Kt(b);
        }
        return y;
      }
      return e.eventSystemFlags |= l, e;
    }
    function Rf(e, t, s, l, d) {
      switch (t) {
        case Hi: {
          var p = d;
          return $t = Qs($t, e, t, s, l, p), !0;
        }
        case Os: {
          var y = d;
          return sn = Qs(sn, e, t, s, l, y), !0;
        }
        case la: {
          var b = d;
          return on = Qs(on, e, t, s, l, b), !0;
        }
        case xt: {
          var E = d, N = E.pointerId;
          return Qa.set(N, Qs(Qa.get(N) || null, e, t, s, l, E)), !0;
        }
        case sa: {
          var k = d, X = k.pointerId;
          return Hn.set(X, Qs(Hn.get(X) || null, e, t, s, l, k)), !0;
        }
      }
      return !1;
    }
    function Bp(e) {
      var t = eh(e.target);
      if (t !== null) {
        var s = pi(t);
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
          } else if (l === Ce) {
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
    function jp() {
      for (mi = !1; Qn.length > 0; ) {
        var e = Qn[0];
        if (e.blockedOn !== null) {
          var t = Zo(e.blockedOn);
          t !== null && Mf(t);
          break;
        }
        var s = Dc(e.topLevelType, e.eventSystemFlags, e.container, e.nativeEvent);
        s !== null ? e.blockedOn = s : Qn.shift();
      }
      $t !== null && Zs($t) && ($t = null), sn !== null && Zs(sn) && (sn = null), on !== null && Zs(on) && (on = null), Qa.forEach(Df), Hn.forEach(Df);
    }
    function Vo(e, t) {
      e.blockedOn === t && (e.blockedOn = null, mi || (mi = !0, o.unstable_scheduleCallback(o.unstable_NormalPriority, jp)));
    }
    function Cc(e) {
      if (Qn.length > 0) {
        Vo(Qn[0], e);
        for (var t = 1; t < Qn.length; t++) {
          var s = Qn[t];
          s.blockedOn === e && (s.blockedOn = null);
        }
      }
      $t !== null && Vo($t, e), sn !== null && Vo(sn, e), on !== null && Vo(on, e);
      var l = function(b) {
        return Vo(b, e);
      };
      Qa.forEach(l), Hn.forEach(l);
      for (var d = 0; d < Fs.length; d++) {
        var p = Fs[d];
        p.blockedOn === e && (p.blockedOn = null);
      }
      for (; Fs.length > 0; ) {
        var y = Fs[0];
        if (y.blockedOn !== null)
          break;
        Bp(y), y.blockedOn === null && Fs.shift();
      }
    }
    function Up(e, t, s) {
      e.addEventListener(t, s, !1);
    }
    function Tc(e, t, s) {
      e.addEventListener(t, s, !0);
    }
    var Nf = {}, Mc = /* @__PURE__ */ new Map(), Ec = /* @__PURE__ */ new Map(), Ic = [Un, "blur", ec, "cancel", Ml, "click", Do, "close", Il, "contextMenu", Kd, "copy", ef, "cut", zs, "auxClick", tf, "doubleClick", Al, "dragEnd", tc, "dragStart", Ls, "drop", Hi, "focus", Dl, "input", _r, "invalid", Vn, "keyDown", Wi, "keyPress", ai, "keyUp", oa, "mouseDown", kl, "mouseUp", Pl, "paste", uf, "pause", cf, "play", ff, "pointerCancel", hf, "pointerDown", an, "pointerUp", kn, "rateChange", Tn, "reset", ja, "seeked", js, "submit", oc, "touchCancel", lc, "touchEnd", mf, "touchStart", cc, "volumeChange"], Cg = [Oa, Ua, _l, El, aa, qd], Tg = [Np, "drag", Os, "dragEnter", nf, "dragExit", Rl, "dragLeave", rf, "dragOver", Nl, "mouseMove", Ba, "mouseOut", la, "mouseOver", ac, "pointerMove", Ei, "pointerOut", xt, "pointerOver", Or, "scroll", ko, "toggle", uc, "touchMove", vf, "wheel"], Mg = [Gd, "abort", Dp, "animationEnd", Xd, "animationIteration", Jd, "animationStart", Ps, "canPlay", _s, "canPlayThrough", nc, "durationChange", Bs, "emptied", af, "encrypted", sf, "ended", Mi, "error", sa, "gotPointerCapture", La, "load", of, "loadedData", lf, "loadedMetadata", ic, "loadStart", rc, "lostPointerCapture", df, "playing", zr, "progress", $n, "seeking", sc, "stalled", No, "suspend", pf, "timeUpdate", zl, "transitionEnd", dc, "waiting"];
    function lr(e, t) {
      for (var s = 0; s < e.length; s += 2) {
        var l = e[s], d = e[s + 1], p = d[0].toUpperCase() + d.slice(1), y = "on" + p, b = {
          phasedRegistrationNames: {
            bubbled: y,
            captured: y + "Capture"
          },
          dependencies: [l],
          eventPriority: t
        };
        Ec.set(l, t), Mc.set(l, b), Nf[d] = b;
      }
    }
    function Ya(e, t) {
      for (var s = 0; s < e.length; s++)
        Ec.set(e[s], t);
    }
    lr(Ic, Da), lr(Tg, Nn), lr(Mg, Ir), Ya(Cg, Da);
    function Ys(e) {
      var t = Ec.get(e);
      return t === void 0 ? Ir : t;
    }
    var Vp = o.unstable_UserBlockingPriority, Hp = o.unstable_runWithPriority, Wl = !0;
    function kf(e) {
      Wl = !!e;
    }
    function Ac() {
      return Wl;
    }
    function Yt(e, t) {
      ur(t, e, !1);
    }
    function Rc(e, t) {
      ur(t, e, !0);
    }
    function ur(e, t, s) {
      var l;
      switch (Ys(t)) {
        case Da:
          l = Ai.bind(null, t, Gr, e);
          break;
        case Nn:
          l = Wp.bind(null, t, Gr, e);
          break;
        case Ir:
        default:
          l = Fl.bind(null, t, Gr, e);
          break;
      }
      var d = gf(t);
      s ? Tc(e, d, l) : Up(e, d, l);
    }
    function Ai(e, t, s, l) {
      wo(l.timeStamp), yo(Fl, e, t, s, l);
    }
    function Wp(e, t, s, l) {
      Hp(Vp, Fl.bind(null, e, t, s, l));
    }
    function Fl(e, t, s, l) {
      if (!!Wl) {
        if (If() && Za(e)) {
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
        if (Za(e)) {
          xc(d, e, t, s, l);
          return;
        }
        Rf(d, e, t, s, l) || (Af(e, l), Bo(e, t, l, null));
      }
    }
    function Dc(e, t, s, l) {
      var d = Ll(l), p = eh(d);
      if (p !== null) {
        var y = pi(p);
        if (y === null)
          p = null;
        else {
          var b = y.tag;
          if (b === ee) {
            var E = hc(y);
            if (E !== null)
              return E;
            p = null;
          } else if (b === Ce) {
            var N = y.stateNode;
            if (N.hydrate)
              return pc(y);
            p = null;
          } else
            y !== p && (p = null);
        }
      }
      return Bo(e, t, l, p), null;
    }
    var Fp = {
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
    function $p(e, t) {
      return e + t.charAt(0).toUpperCase() + t.substring(1);
    }
    var Pf = ["Webkit", "ms", "Moz", "O"];
    Object.keys(Gs).forEach(function(e) {
      Pf.forEach(function(t) {
        Gs[$p(t, e)] = Gs[e];
      });
    });
    function Nc(e, t, s) {
      var l = t == null || typeof t == "boolean" || t === "";
      return l ? "" : !s && typeof t == "number" && t !== 0 && !(Gs.hasOwnProperty(e) && Gs[e]) ? t + "px" : ("" + t).trim();
    }
    var _f = /([A-Z])/g, Qp = /^ms-/;
    function Zp(e) {
      return e.replace(_f, "-$1").toLowerCase().replace(Qp, "-ms-");
    }
    var kc = function() {
    };
    {
      var Yp = /^(?:webkit|moz|o)[A-Z]/, ca = /^-ms-/, Gp = /-(.)/g, Pc = /;\s*$/, Xs = {}, _c = {}, $l = !1, Xp = !1, Eg = function(e) {
        return e.replace(Gp, function(t, s) {
          return s.toUpperCase();
        });
      }, zf = function(e) {
        Xs.hasOwnProperty(e) && Xs[e] || (Xs[e] = !0, g(
          "Unsupported style property %s. Did you mean %s?",
          e,
          Eg(e.replace(ca, "ms-"))
        ));
      }, Ig = function(e) {
        Xs.hasOwnProperty(e) && Xs[e] || (Xs[e] = !0, g("Unsupported vendor-prefixed style property %s. Did you mean %s?", e, e.charAt(0).toUpperCase() + e.slice(1)));
      }, Of = function(e, t) {
        _c.hasOwnProperty(t) && _c[t] || (_c[t] = !0, g(`Style property values shouldn't contain a semicolon. Try "%s: %s" instead.`, e, t.replace(Pc, "")));
      }, Ag = function(e, t) {
        $l || ($l = !0, g("`NaN` is an invalid value for the `%s` css style property.", e));
      }, Jp = function(e, t) {
        Xp || (Xp = !0, g("`Infinity` is an invalid value for the `%s` css style property.", e));
      };
      kc = function(e, t) {
        e.indexOf("-") > -1 ? zf(e) : Yp.test(e) ? Ig(e) : Pc.test(t) && Of(e, t), typeof t == "number" && (isNaN(t) ? Ag(e, t) : isFinite(t) || Jp(e, t));
      };
    }
    var Rg = kc;
    function qp(e) {
      {
        var t = "", s = "";
        for (var l in e)
          if (!!e.hasOwnProperty(l)) {
            var d = e[l];
            if (d != null) {
              var p = l.indexOf("--") === 0;
              t += s + (p ? l : Zp(l)) + ":", t += Nc(l, d, p), s = ";";
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
          d || Rg(l, t[l]);
          var p = Nc(l, t[l], d);
          l === "float" && (l = "cssFloat"), d ? s.setProperty(l, p) : s[l] = p;
        }
    }
    function Dg(e) {
      return e == null || typeof e == "boolean" || e === "";
    }
    function Bf(e) {
      var t = {};
      for (var s in e)
        for (var l = Fp[s] || [s], d = 0; d < l.length; d++)
          t[l[d]] = s;
      return t;
    }
    function Kp(e, t) {
      {
        if (!t)
          return;
        var s = Bf(e), l = Bf(t), d = {};
        for (var p in s) {
          var y = s[p], b = l[p];
          if (b && y !== b) {
            var E = y + "," + b;
            if (d[E])
              continue;
            d[E] = !0, g("%s a style property during rerender (%s) when a conflicting property is set (%s) can lead to styling bugs. To avoid this, don't mix shorthand and non-shorthand properties for the same value; instead, replace the shorthand with separate values.", Dg(e[y]) ? "Removing" : "Updating", y, b);
          }
        }
      }
    }
    var em = {
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
    }, tm = i({
      menuitem: !0
    }, em), jf = "__html", Ql = null;
    Ql = m.ReactDebugCurrentFrame;
    function zc(e, t) {
      if (!!t) {
        if (tm[e] && !(t.children == null && t.dangerouslySetInnerHTML == null))
          throw Error(e + " is a void element tag and must neither have `children` nor use `dangerouslySetInnerHTML`." + Ql.getStackAddendum());
        if (t.dangerouslySetInnerHTML != null) {
          if (t.children != null)
            throw Error("Can only set one of `children` or `props.dangerouslySetInnerHTML`.");
          if (!(typeof t.dangerouslySetInnerHTML == "object" && jf in t.dangerouslySetInnerHTML))
            throw Error("`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. Please visit https://fb.me/react-invariant-dangerously-set-inner-html for more information.");
        }
        if (!t.suppressContentEditableWarning && t.contentEditable && t.children != null && g("A component is `contentEditable` and contains `children` managed by React. It is now your responsibility to guarantee that none of those nodes are unexpectedly modified or duplicated. This is probably not intentional."), !(t.style == null || typeof t.style == "object"))
          throw Error("The `style` prop expects a mapping from style properties to values, not a string. For example, style={{marginRight: spacing + 'em'}} when using JSX." + Ql.getStackAddendum());
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
    var Zl = {
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
    }, nm = {
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
    }, Js = {}, im = new RegExp("^(aria)-[" + ne + "]*$"), Ng = new RegExp("^(aria)[A-Z][" + ne + "]*$"), Oc = Object.prototype.hasOwnProperty;
    function rm(e, t) {
      {
        if (Oc.call(Js, t) && Js[t])
          return !0;
        if (Ng.test(t)) {
          var s = "aria-" + t.slice(4).toLowerCase(), l = nm.hasOwnProperty(s) ? s : null;
          if (l == null)
            return g("Invalid ARIA attribute `%s`. ARIA attributes follow the pattern aria-* and must be lowercase.", t), Js[t] = !0, !0;
          if (t !== l)
            return g("Invalid ARIA attribute `%s`. Did you mean `%s`?", t, l), Js[t] = !0, !0;
        }
        if (im.test(t)) {
          var d = t.toLowerCase(), p = nm.hasOwnProperty(d) ? d : null;
          if (p == null)
            return Js[t] = !0, !1;
          if (t !== p)
            return g("Unknown ARIA attribute `%s`. Did you mean `%s`?", t, p), Js[t] = !0, !0;
        }
      }
      return !0;
    }
    function Pn(e, t) {
      {
        var s = [];
        for (var l in t) {
          var d = rm(e, l);
          d || s.push(l);
        }
        var p = s.map(function(y) {
          return "`" + y + "`";
        }).join(", ");
        s.length === 1 ? g("Invalid aria prop %s on <%s> tag. For details, see https://fb.me/invalid-aria-prop", p, e) : s.length > 1 && g("Invalid aria props %s on <%s> tag. For details, see https://fb.me/invalid-aria-prop", p, e);
      }
    }
    function Uf(e, t) {
      da(e, t) || Pn(e, t);
    }
    var Qi = !1;
    function Br(e, t) {
      {
        if (e !== "input" && e !== "textarea" && e !== "select")
          return;
        t != null && t.value === null && !Qi && (Qi = !0, e === "select" && t.multiple ? g("`value` prop on `%s` should not be null. Consider using an empty array when `multiple` is set to `true` to clear the component or `undefined` for uncontrolled components.", e) : g("`value` prop on `%s` should not be null. Consider using an empty string to clear the component or `undefined` for uncontrolled components.", e));
      }
    }
    var Ga = function() {
    };
    {
      var _n = {}, am = Object.prototype.hasOwnProperty, Yl = /^on./, Lc = /^on[^A-Z]/, Vf = new RegExp("^(aria)-[" + ne + "]*$"), rt = new RegExp("^(aria)[A-Z][" + ne + "]*$");
      Ga = function(e, t, s, l) {
        if (am.call(_n, t) && _n[t])
          return !0;
        var d = t.toLowerCase();
        if (d === "onfocusin" || d === "onfocusout")
          return g("React uses onFocus and onBlur instead of onFocusIn and onFocusOut. All React events are normalized to bubble, so onFocusIn and onFocusOut are not needed/supported by React."), _n[t] = !0, !0;
        if (l) {
          if (Et.hasOwnProperty(t))
            return !0;
          var p = wn.hasOwnProperty(d) ? wn[d] : null;
          if (p != null)
            return g("Invalid event handler property `%s`. Did you mean `%s`?", t, p), _n[t] = !0, !0;
          if (Yl.test(t))
            return g("Unknown event handler property `%s`. It will be ignored.", t), _n[t] = !0, !0;
        } else if (Yl.test(t))
          return Lc.test(t) && g("Invalid event handler property `%s`. React events use the camelCase naming convention, for example `onClick`.", t), _n[t] = !0, !0;
        if (Vf.test(t) || rt.test(t))
          return !0;
        if (d === "innerhtml")
          return g("Directly setting property `innerHTML` is not permitted. For more information, lookup documentation on `dangerouslySetInnerHTML`."), _n[t] = !0, !0;
        if (d === "aria")
          return g("The `aria` attribute is reserved for future use in React. Pass individual `aria-` attributes instead."), _n[t] = !0, !0;
        if (d === "is" && s !== null && s !== void 0 && typeof s != "string")
          return g("Received a `%s` for a string attribute `is`. If this is expected, cast the value to a string.", typeof s), _n[t] = !0, !0;
        if (typeof s == "number" && isNaN(s))
          return g("Received NaN for the `%s` attribute. If this is expected, cast the value to a string.", t), _n[t] = !0, !0;
        var y = bo(t), b = y !== null && y.type === qr;
        if (Zl.hasOwnProperty(d)) {
          var E = Zl[d];
          if (E !== t)
            return g("Invalid DOM property `%s`. Did you mean `%s`?", t, E), _n[t] = !0, !0;
        } else if (!b && t !== d)
          return g("React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element.", t, d), _n[t] = !0, !0;
        return typeof s == "boolean" && qt(t, s, y, !1) ? (s ? g('Received `%s` for a non-boolean attribute `%s`.\n\nIf you want to write it to the DOM, pass a string instead: %s="%s" or %s={value.toString()}.', s, t, t, s, t) : g('Received `%s` for a non-boolean attribute `%s`.\n\nIf you want to write it to the DOM, pass a string instead: %s="%s" or %s={value.toString()}.\n\nIf you used to conditionally omit it with %s={condition && value}, pass %s={condition ? value : undefined} instead.', s, t, t, s, t, t, t), _n[t] = !0, !0) : b ? !0 : qt(t, s, y, !1) ? (_n[t] = !0, !1) : ((s === "false" || s === "true") && y !== null && y.type === jn && (g("Received the string `%s` for the boolean attribute `%s`. %s Did you mean %s={%s}?", s, t, s === "false" ? "The browser will interpret it as a truthy value." : 'Although this works, it will not work as expected if you pass the string "false".', t, s), _n[t] = !0), !0);
      };
    }
    var Ri = function(e, t, s) {
      {
        var l = [];
        for (var d in t) {
          var p = Ga(e, d, t[d], s);
          p || l.push(d);
        }
        var y = l.map(function(b) {
          return "`" + b + "`";
        }).join(", ");
        l.length === 1 ? g("Invalid value for prop %s on <%s> tag. Either remove it from the element, or pass a string or number value to keep it in the DOM. For details, see https://fb.me/react-attribute-behavior", y, e) : l.length > 1 && g("Invalid values for props %s on <%s> tag. Either remove them from the element, or pass a string or number value to keep them in the DOM. For details, see https://fb.me/react-attribute-behavior", y, e);
      }
    };
    function lt(e, t, s) {
      da(e, t) || Ri(e, t, s);
    }
    var Ut = !1, pn = "dangerouslySetInnerHTML", qs = "suppressContentEditableWarning", Di = "suppressHydrationWarning", Ho = "autoFocus", jr = "children", cr = "style", Ks = "__html", Xa = di.html, Bc, Oe, eo, Wo, Zi, Gl, Ja, Fo, dr, $o;
    {
      Bc = {
        time: !0,
        dialog: !0,
        webview: !0
      }, eo = function(e, t) {
        Uf(e, t), Br(e, t), lt(
          e,
          t,
          !0
        );
      }, Fo = Bn && !document.documentMode;
      var Hf = /\r\n?/g, jc = /\u0000|\uFFFD/g;
      dr = function(e) {
        var t = typeof e == "string" ? e : "" + e;
        return t.replace(Hf, `
`).replace(jc, "");
      }, Wo = function(e, t) {
        if (!Ut) {
          var s = dr(t), l = dr(e);
          l !== s && (Ut = !0, g('Text content did not match. Server: "%s" Client: "%s"', l, s));
        }
      }, Zi = function(e, t, s) {
        if (!Ut) {
          var l = dr(s), d = dr(t);
          d !== l && (Ut = !0, g("Prop `%s` did not match. Server: %s Client: %s", e, JSON.stringify(d), JSON.stringify(l)));
        }
      }, Gl = function(e) {
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
    function zn(e, t) {
      var s = e.nodeType === Pa || e.nodeType === qu, l = s ? e : e.ownerDocument;
      Ws(t, l);
    }
    function qa(e) {
      return e.nodeType === Pa ? e : e.ownerDocument;
    }
    function Ka() {
    }
    function to(e) {
      e.onclick = Ka;
    }
    function Uc(e, t, s, l, d) {
      for (var p in l)
        if (!!l.hasOwnProperty(p)) {
          var y = l[p];
          if (p === cr)
            y && Object.freeze(y), Lf(t, y);
          else if (p === pn) {
            var b = y ? y[Ks] : void 0;
            b != null && Ap(t, b);
          } else if (p === jr)
            if (typeof y == "string") {
              var E = e !== "textarea" || y !== "";
              E && Cl(t, y);
            } else
              typeof y == "number" && Cl(t, "" + y);
          else
            p === qs || p === Di || p === Ho || (Et.hasOwnProperty(p) ? y != null && (typeof y != "function" && Ja(p, y), zn(s, p)) : y != null && M(t, p, y, d));
        }
    }
    function Ni(e, t, s, l) {
      for (var d = 0; d < t.length; d += 2) {
        var p = t[d], y = t[d + 1];
        p === cr ? Lf(e, y) : p === pn ? Ap(e, y) : p === jr ? Cl(e, y) : M(e, p, y, l);
      }
    }
    function sm(e, t, s, l) {
      var d, p = qa(s), y, b = l;
      if (b === Xa && (b = Zd(e)), b === Xa) {
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
    function Wf(e, t) {
      return qa(t).createTextNode(e);
    }
    function kg(e, t, s, l) {
      var d = da(t, s);
      eo(t, s);
      var p;
      switch (t) {
        case "iframe":
        case "object":
        case "embed":
          Yt(La, e), p = s;
          break;
        case "video":
        case "audio":
          for (var y = 0; y < Po.length; y++)
            Yt(Po[y], e);
          p = s;
          break;
        case "source":
          Yt(Mi, e), p = s;
          break;
        case "img":
        case "image":
        case "link":
          Yt(Mi, e), Yt(La, e), p = s;
          break;
        case "form":
          Yt(Tn, e), Yt(js, e), p = s;
          break;
        case "details":
          Yt(ko, e), p = s;
          break;
        case "input":
          Hd(e, s), p = Fu(e, s), Yt(_r, e), zn(l, "onChange");
          break;
        case "option":
          Fd(e, s), p = kr(e, s);
          break;
        case "select":
          Pr(e, s), p = bl(e, s), Yt(_r, e), zn(l, "onChange");
          break;
        case "textarea":
          Ns(e, s), p = Qd(e, s), Yt(_r, e), zn(l, "onChange");
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
          Mp(e, s);
          break;
        default:
          typeof p.onClick == "function" && to(e);
          break;
      }
    }
    function om(e, t, s, l, d) {
      eo(t, l);
      var p = null, y, b;
      switch (t) {
        case "input":
          y = Fu(e, s), b = Fu(e, l), p = [];
          break;
        case "option":
          y = kr(e, s), b = kr(e, l), p = [];
          break;
        case "select":
          y = bl(e, s), b = bl(e, l), p = [];
          break;
        case "textarea":
          y = Qd(e, s), b = Qd(e, l), p = [];
          break;
        default:
          y = s, b = l, typeof y.onClick != "function" && typeof b.onClick == "function" && to(e);
          break;
      }
      zc(t, b);
      var E, N, k = null;
      for (E in y)
        if (!(b.hasOwnProperty(E) || !y.hasOwnProperty(E) || y[E] == null))
          if (E === cr) {
            var X = y[E];
            for (N in X)
              X.hasOwnProperty(N) && (k || (k = {}), k[N] = "");
          } else
            E === pn || E === jr || E === qs || E === Di || E === Ho || (Et.hasOwnProperty(E) ? p || (p = []) : (p = p || []).push(E, null));
      for (E in b) {
        var L = b[E], K = y != null ? y[E] : void 0;
        if (!(!b.hasOwnProperty(E) || L === K || L == null && K == null))
          if (E === cr)
            if (L && Object.freeze(L), K) {
              for (N in K)
                K.hasOwnProperty(N) && (!L || !L.hasOwnProperty(N)) && (k || (k = {}), k[N] = "");
              for (N in L)
                L.hasOwnProperty(N) && K[N] !== L[N] && (k || (k = {}), k[N] = L[N]);
            } else
              k || (p || (p = []), p.push(E, k)), k = L;
          else if (E === pn) {
            var ve = L ? L[Ks] : void 0, be = K ? K[Ks] : void 0;
            ve != null && be !== ve && (p = p || []).push(E, ve);
          } else
            E === jr ? K !== L && (typeof L == "string" || typeof L == "number") && (p = p || []).push(E, "" + L) : E === qs || E === Di || (Et.hasOwnProperty(E) ? (L != null && (typeof L != "function" && Ja(E, L), zn(d, E)), !p && K !== L && (p = [])) : (p = p || []).push(E, L));
      }
      return k && (Kp(k, b[cr]), (p = p || []).push(cr, k)), p;
    }
    function lm(e, t, s, l, d) {
      s === "input" && d.type === "radio" && d.name != null && $u(e, d);
      var p = da(s, l), y = da(s, d);
      switch (Ni(e, t, p, y), s) {
        case "input":
          gl(e, d);
          break;
        case "textarea":
          ra(e, d);
          break;
        case "select":
          Ep(e, d);
          break;
      }
    }
    function no(e) {
      {
        var t = e.toLowerCase();
        return Zl.hasOwnProperty(t) && Zl[t] || null;
      }
    }
    function um(e, t, s, l, d) {
      var p, y;
      switch (Oe = s[Di] === !0, p = da(t, s), eo(t, s), t) {
        case "iframe":
        case "object":
        case "embed":
          Yt(La, e);
          break;
        case "video":
        case "audio":
          for (var b = 0; b < Po.length; b++)
            Yt(Po[b], e);
          break;
        case "source":
          Yt(Mi, e);
          break;
        case "img":
        case "image":
        case "link":
          Yt(Mi, e), Yt(La, e);
          break;
        case "form":
          Yt(Tn, e), Yt(js, e);
          break;
        case "details":
          Yt(ko, e);
          break;
        case "input":
          Hd(e, s), Yt(_r, e), zn(d, "onChange");
          break;
        case "option":
          Fd(e, s);
          break;
        case "select":
          Pr(e, s), Yt(_r, e), zn(d, "onChange");
          break;
        case "textarea":
          Ns(e, s), Yt(_r, e), zn(d, "onChange");
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
      var X = null;
      for (var L in s)
        if (!!s.hasOwnProperty(L)) {
          var K = s[L];
          if (L === jr)
            typeof K == "string" ? e.textContent !== K && (Oe || Wo(e.textContent, K), X = [jr, K]) : typeof K == "number" && e.textContent !== "" + K && (Oe || Wo(e.textContent, K), X = [jr, "" + K]);
          else if (Et.hasOwnProperty(L))
            K != null && (typeof K != "function" && Ja(L, K), zn(d, L));
          else if (typeof p == "boolean") {
            var ve = void 0, be = bo(L);
            if (!Oe) {
              if (!(L === qs || L === Di || L === "value" || L === "checked" || L === "selected")) {
                if (L === pn) {
                  var qe = e.innerHTML, nt = K ? K[Ks] : void 0, zt = $o(e, nt != null ? nt : "");
                  zt !== qe && Zi(L, qe, zt);
                } else if (L === cr) {
                  if (y.delete(L), Fo) {
                    var vt = qp(K);
                    ve = e.getAttribute("style"), vt !== ve && Zi(L, ve, vt);
                  }
                } else if (p)
                  y.delete(L.toLowerCase()), ve = ml(e, L, K), K !== ve && Zi(L, ve, K);
                else if (!ei(L, be, p) && !Na(L, K, be, p)) {
                  var Qt = !1;
                  if (be !== null)
                    y.delete(be.attributeName), ve = Bu(e, L, K, be);
                  else {
                    var W = l;
                    if (W === Xa && (W = Zd(t)), W === Xa)
                      y.delete(L.toLowerCase());
                    else {
                      var te = no(L);
                      te !== null && te !== L && (Qt = !0, y.delete(te)), y.delete(L);
                    }
                    ve = ml(e, L, K);
                  }
                  K !== ve && !Qt && Zi(L, ve, K);
                }
              }
            }
          }
        }
      switch (y.size > 0 && !Oe && Gl(y), t) {
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
      return X;
    }
    function cm(e, t) {
      var s = e.nodeValue !== t;
      return s;
    }
    function Ff(e, t) {
      Wo(e.nodeValue, t);
    }
    function Xl(e, t) {
      {
        if (Ut)
          return;
        Ut = !0, g("Did not expect server HTML to contain a <%s> in <%s>.", t.nodeName.toLowerCase(), e.nodeName.toLowerCase());
      }
    }
    function dm(e, t) {
      {
        if (Ut)
          return;
        Ut = !0, g('Did not expect server HTML to contain the text node "%s" in <%s>.', t.nodeValue, e.nodeName.toLowerCase());
      }
    }
    function fm(e, t, s) {
      {
        if (Ut)
          return;
        Ut = !0, g("Expected server HTML to contain a matching <%s> in <%s>.", t, e.nodeName.toLowerCase());
      }
    }
    function $f(e, t) {
      {
        if (t === "" || Ut)
          return;
        Ut = !0, g('Expected server HTML to contain a matching text node for "%s" in <%s>.', t, e.nodeName.toLowerCase());
      }
    }
    function hm(e, t, s) {
      switch (t) {
        case "input":
          Wd(e, s);
          return;
        case "textarea":
          Xu(e, s);
          return;
        case "select":
          bg(e, s);
          return;
      }
    }
    function Jl(e) {
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
    function Pg(e) {
      for (; e; ) {
        if (e.nextSibling)
          return e.nextSibling;
        e = e.parentNode;
      }
    }
    function pm(e, t) {
      for (var s = es(e), l = 0, d = 0; s; ) {
        if (s.nodeType === ar) {
          if (d = l + s.textContent.length, l <= t && d >= t)
            return {
              node: s,
              offset: t - l
            };
          l = d;
        }
        s = es(Pg(s));
      }
    }
    function Qo(e) {
      var t = e.ownerDocument, s = t && t.defaultView || window, l = s.getSelection && s.getSelection();
      if (!l || l.rangeCount === 0)
        return null;
      var d = l.anchorNode, p = l.anchorOffset, y = l.focusNode, b = l.focusOffset;
      try {
        d.nodeType, y.nodeType;
      } catch {
        return null;
      }
      return _g(e, d, p, y, b);
    }
    function _g(e, t, s, l, d) {
      var p = 0, y = -1, b = -1, E = 0, N = 0, k = e, X = null;
      e:
        for (; ; ) {
          for (var L = null; k === t && (s === 0 || k.nodeType === ar) && (y = p + s), k === l && (d === 0 || k.nodeType === ar) && (b = p + d), k.nodeType === ar && (p += k.nodeValue.length), (L = k.firstChild) !== null; )
            X = k, k = L;
          for (; ; ) {
            if (k === e)
              break e;
            if (X === t && ++E === s && (y = p), X === l && ++N === d && (b = p), (L = k.nextSibling) !== null)
              break;
            k = X, X = k.parentNode;
          }
          k = L;
        }
      return y === -1 || b === -1 ? null : {
        start: y,
        end: b
      };
    }
    function mm(e, t) {
      var s = e.ownerDocument || document, l = s && s.defaultView || window;
      if (!!l.getSelection) {
        var d = l.getSelection(), p = e.textContent.length, y = Math.min(t.start, p), b = t.end === void 0 ? y : Math.min(t.end, p);
        if (!d.extend && y > b) {
          var E = b;
          b = y, y = E;
        }
        var N = pm(e, y), k = pm(e, b);
        if (N && k) {
          if (d.rangeCount === 1 && d.anchorNode === N.node && d.anchorOffset === N.offset && d.focusNode === k.node && d.focusOffset === k.offset)
            return;
          var X = s.createRange();
          X.setStart(N.node, N.offset), d.removeAllRanges(), y > b ? (d.addRange(X), d.extend(k.node, k.offset)) : (X.setEnd(k.node, k.offset), d.addRange(X));
        }
      }
    }
    function ts(e) {
      return e && e.nodeType === ar;
    }
    function vm(e, t) {
      return !e || !t ? !1 : e === t ? !0 : ts(e) ? !1 : ts(t) ? vm(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1;
    }
    function zg(e) {
      return e && e.ownerDocument && vm(e.ownerDocument.documentElement, e);
    }
    function gm(e) {
      try {
        return typeof e.contentWindow.location.href == "string";
      } catch {
        return !1;
      }
    }
    function Vc() {
      for (var e = window, t = Jl(); t instanceof e.HTMLIFrameElement; ) {
        if (gm(t))
          e = t.contentWindow;
        else
          return t;
        t = Jl(e.document);
      }
      return t;
    }
    function ql(e) {
      var t = e && e.nodeName && e.nodeName.toLowerCase();
      return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
    }
    function Og() {
      var e = Vc();
      return {
        activeElementDetached: null,
        focusedElem: e,
        selectionRange: ql(e) ? Ur(e) : null
      };
    }
    function Lg(e) {
      var t = Vc(), s = e.focusedElem, l = e.selectionRange;
      if (t !== s && zg(s)) {
        l !== null && ql(s) && Qf(s, l);
        for (var d = [], p = s; p = p.parentNode; )
          p.nodeType === rr && d.push({
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
    function Qf(e, t) {
      var s = t.start, l = t.end;
      l === void 0 && (l = s), "selectionStart" in e ? (e.selectionStart = s, e.selectionEnd = Math.min(l, e.value.length)) : mm(e, t);
    }
    var Kl = function() {
    }, fr = function() {
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
      ], Zf = fa.concat(["button"]), Yf = ["dd", "dt", "li", "option", "optgroup", "p", "rp", "rt"], ym = {
        current: null,
        formTag: null,
        aTagInScope: null,
        buttonTagInScope: null,
        nobrTagInScope: null,
        pTagInButtonScope: null,
        listItemTagAutoclosing: null,
        dlItemTagAutoclosing: null
      };
      fr = function(e, t) {
        var s = i({}, e || ym), l = {
          tag: t
        };
        return fa.indexOf(t) !== -1 && (s.aTagInScope = null, s.buttonTagInScope = null, s.nobrTagInScope = null), Zf.indexOf(t) !== -1 && (s.pTagInButtonScope = null), Hc.indexOf(t) !== -1 && t !== "address" && t !== "div" && t !== "p" && (s.listItemTagAutoclosing = null, s.dlItemTagAutoclosing = null), s.current = l, t === "form" && (s.formTag = l), t === "a" && (s.aTagInScope = l), t === "button" && (s.buttonTagInScope = l), t === "nobr" && (s.nobrTagInScope = l), t === "p" && (s.pTagInButtonScope = l), t === "li" && (s.listItemTagAutoclosing = l), (t === "dd" || t === "dt") && (s.dlItemTagAutoclosing = l), s;
      };
      var wm = function(e, t) {
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
      Kl = function(e, t, s) {
        s = s || ym;
        var l = s.current, d = l && l.tag;
        t != null && (e != null && g("validateDOMNesting: when childText is passed, childTag should be null"), e = "#text");
        var p = wm(e, d) ? null : l, y = p ? null : io(e, s), b = p || y;
        if (!!b) {
          var E = b.tag, N = ft(), k = !!p + "|" + e + "|" + E + "|" + N;
          if (!Gf[k]) {
            Gf[k] = !0;
            var X = e, L = "";
            if (e === "#text" ? /\S/.test(t) ? X = "Text nodes" : (X = "Whitespace text nodes", L = " Make sure you don't have any extra whitespace between tags on each line of your source code.") : X = "<" + e + ">", p) {
              var K = "";
              E === "table" && e === "tr" && (K += " Add a <tbody>, <thead> or <tfoot> to your code to match the DOM tree generated by the browser."), g("validateDOMNesting(...): %s cannot appear as a child of <%s>.%s%s", X, E, L, K);
            } else
              g("validateDOMNesting(...): %s cannot appear as a descendant of <%s>.", X, E);
          }
        }
      };
    }
    var ns;
    ns = "suppressHydrationWarning";
    var eu = "$", Wc = "/$", Fc = "$?", tu = "$!", Xf = "style", ro = null, Jf = null;
    function nu(e, t) {
      switch (e) {
        case "button":
        case "input":
        case "select":
        case "textarea":
          return !!t.autoFocus;
      }
      return !1;
    }
    function Bg(e) {
      var t, s, l = e.nodeType;
      switch (l) {
        case Pa:
        case qu: {
          t = l === Pa ? "#document" : "#fragment";
          var d = e.documentElement;
          s = d ? d.namespaceURI : Yd(null, "");
          break;
        }
        default: {
          var p = l === ri ? e.parentNode : e, y = p.namespaceURI || null;
          t = p.tagName, s = Yd(y, t);
          break;
        }
      }
      {
        var b = t.toLowerCase(), E = fr(null, b);
        return {
          namespace: s,
          ancestorInfo: E
        };
      }
    }
    function bm(e, t, s) {
      {
        var l = e, d = Yd(l.namespace, t), p = fr(l.ancestorInfo, t);
        return {
          namespace: d,
          ancestorInfo: p
        };
      }
    }
    function DS(e) {
      return e;
    }
    function n(e) {
      ro = Ac(), Jf = Og(), kf(!1);
    }
    function a(e) {
      Lg(Jf), kf(ro), ro = null, Jf = null;
    }
    function u(e, t, s, l, d) {
      var p;
      {
        var y = l;
        if (Kl(e, null, y.ancestorInfo), typeof t.children == "string" || typeof t.children == "number") {
          var b = "" + t.children, E = fr(y.ancestorInfo, e);
          Kl(null, b, E);
        }
        p = y.namespace;
      }
      var N = sm(e, t, s, p);
      return xm(d, N), Wg(N, t), N;
    }
    function f(e, t) {
      e.appendChild(t);
    }
    function v(e, t, s, l, d) {
      return kg(e, t, s, l), nu(t, s);
    }
    function S(e, t, s, l, d, p) {
      {
        var y = p;
        if (typeof l.children != typeof s.children && (typeof l.children == "string" || typeof l.children == "number")) {
          var b = "" + l.children, E = fr(y.ancestorInfo, t);
          Kl(null, b, E);
        }
      }
      return om(e, t, s, l, d);
    }
    function C(e, t) {
      return e === "textarea" || e === "option" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
    }
    function R(e, t) {
      return !!t.hidden;
    }
    function H(e, t, s, l) {
      {
        var d = s;
        Kl(null, e, d.ancestorInfo);
      }
      var p = Wf(e, t);
      return xm(l, p), p;
    }
    var U = typeof setTimeout == "function" ? setTimeout : void 0, Me = typeof clearTimeout == "function" ? clearTimeout : void 0, ke = -1;
    function mt(e, t, s, l) {
      nu(t, s) && e.focus();
    }
    function It(e, t, s, l, d, p) {
      Wg(e, d), lm(e, t, s, l, d);
    }
    function ki(e) {
      Cl(e, "");
    }
    function Wn(e, t, s) {
      e.nodeValue = s;
    }
    function O(e, t) {
      e.appendChild(t);
    }
    function _(e, t) {
      var s;
      e.nodeType === ri ? (s = e.parentNode, s.insertBefore(t, e)) : (s = e, s.appendChild(t));
      var l = e._reactRootContainer;
      l == null && s.onclick === null && to(s);
    }
    function Q(e, t, s) {
      e.insertBefore(t, s);
    }
    function le(e, t, s) {
      e.nodeType === ri ? e.parentNode.insertBefore(t, s) : e.insertBefore(t, s);
    }
    function we(e, t) {
      e.removeChild(t);
    }
    function Pe(e, t) {
      e.nodeType === ri ? e.parentNode.removeChild(t) : e.removeChild(t);
    }
    function Je(e) {
      e = e;
      var t = e.style;
      typeof t.setProperty == "function" ? t.setProperty("display", "none", "important") : t.display = "none";
    }
    function wt(e) {
      e.nodeValue = "";
    }
    function ln(e, t) {
      e = e;
      var s = t[Xf], l = s != null && s.hasOwnProperty("display") ? s.display : null;
      e.style.display = Nc("display", l);
    }
    function ut(e, t) {
      e.nodeValue = t;
    }
    function is(e, t, s) {
      return e.nodeType !== rr || t.toLowerCase() !== e.nodeName.toLowerCase() ? null : e;
    }
    function jg(e, t) {
      return t === "" || e.nodeType !== ar ? null : e;
    }
    function WE(e) {
      return e.data === Fc;
    }
    function FE(e) {
      return e.data === tu;
    }
    function NS(e) {
      for (; e != null; e = e.nextSibling) {
        var t = e.nodeType;
        if (t === rr || t === ar)
          break;
      }
      return e;
    }
    function Sm(e) {
      return NS(e.nextSibling);
    }
    function kS(e) {
      return NS(e.firstChild);
    }
    function $E(e, t, s, l, d, p) {
      xm(p, e), Wg(e, s);
      var y;
      {
        var b = d;
        y = b.namespace;
      }
      return um(e, t, s, y, l);
    }
    function QE(e, t, s) {
      return xm(s, e), cm(e, t);
    }
    function ZE(e) {
      for (var t = e.nextSibling, s = 0; t; ) {
        if (t.nodeType === ri) {
          var l = t.data;
          if (l === Wc) {
            if (s === 0)
              return Sm(t);
            s--;
          } else
            (l === eu || l === tu || l === Fc) && s++;
        }
        t = t.nextSibling;
      }
      return null;
    }
    function PS(e) {
      for (var t = e.previousSibling, s = 0; t; ) {
        if (t.nodeType === ri) {
          var l = t.data;
          if (l === eu || l === tu || l === Fc) {
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
    function YE(e) {
      Cc(e);
    }
    function GE(e) {
      Cc(e);
    }
    function XE(e, t, s) {
      Ff(t, s);
    }
    function JE(e, t, s, l, d) {
      t[ns] !== !0 && Ff(l, d);
    }
    function qE(e, t) {
      t.nodeType === rr ? Xl(e, t) : t.nodeType === ri || dm(e, t);
    }
    function KE(e, t, s, l) {
      t[ns] !== !0 && (l.nodeType === rr ? Xl(s, l) : l.nodeType === ri || dm(s, l));
    }
    function eI(e, t, s) {
      fm(e, t);
    }
    function tI(e, t) {
      $f(e, t);
    }
    function nI(e, t, s, l, d) {
      t[ns] !== !0 && fm(s, l);
    }
    function iI(e, t, s, l) {
      t[ns] !== !0 && $f(s, l);
    }
    function rI(e, t, s) {
      t[ns];
    }
    var Ug = Math.random().toString(36).slice(2), qf = "__reactInternalInstance$" + Ug, _S = "__reactEventHandlers$" + Ug, Kf = "__reactContainere$" + Ug;
    function xm(e, t) {
      t[qf] = e;
    }
    function aI(e, t) {
      t[Kf] = e;
    }
    function zS(e) {
      e[Kf] = null;
    }
    function Vg(e) {
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
      return t && (t.tag === Ne || t.tag === $e || t.tag === ee || t.tag === Ce) ? t : null;
    }
    function iu(e) {
      if (e.tag === Ne || e.tag === $e)
        return e.stateNode;
      throw Error("getNodeFromInstance: Invalid argument.");
    }
    function Hg(e) {
      return e[_S] || null;
    }
    function Wg(e, t) {
      e[_S] = t;
    }
    function ao(e) {
      do
        e = e.return;
      while (e && e.tag !== Ne);
      return e || null;
    }
    function sI(e, t) {
      for (var s = 0, l = e; l; l = ao(l))
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
    function oI(e, t, s) {
      for (var l = []; e; )
        l.push(e), e = ao(e);
      var d;
      for (d = l.length; d-- > 0; )
        t(l[d], "captured", s);
      for (d = 0; d < l.length; d++)
        t(l[d], "bubbled", s);
    }
    function lI(e, t, s, l, d) {
      for (var p = e && t ? sI(e, t) : null, y = []; !(!e || e === p); ) {
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
        s(y[k], "bubbled", l);
      for (var X = E.length; X-- > 0; )
        s(E[X], "captured", d);
    }
    function uI(e) {
      return e === "button" || e === "input" || e === "select" || e === "textarea";
    }
    function cI(e, t, s) {
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
          return !!(s.disabled && uI(t));
        default:
          return !1;
      }
    }
    function OS(e, t) {
      var s, l = e.stateNode;
      if (!l)
        return null;
      var d = Qe(l);
      if (!d || (s = d[t], cI(t, e.type, d)))
        return null;
      if (!(!s || typeof s == "function"))
        throw Error("Expected `" + t + "` listener to be a function, instead got a value of `" + typeof s + "` type.");
      return s;
    }
    function dI(e, t, s) {
      var l = t.dispatchConfig.phasedRegistrationNames[s];
      return OS(e, l);
    }
    function fI(e, t, s) {
      e || g("Dispatching inst must not be null");
      var l = dI(e, s, t);
      l && (s._dispatchListeners = Vs(s._dispatchListeners, l), s._dispatchInstances = Vs(s._dispatchInstances, e));
    }
    function hI(e) {
      e && e.dispatchConfig.phasedRegistrationNames && oI(e._targetInst, fI, e);
    }
    function LS(e, t, s) {
      if (e && s && s.dispatchConfig.registrationName) {
        var l = s.dispatchConfig.registrationName, d = OS(e, l);
        d && (s._dispatchListeners = Vs(s._dispatchListeners, d), s._dispatchInstances = Vs(s._dispatchInstances, e));
      }
    }
    function pI(e) {
      e && e.dispatchConfig.registrationName && LS(e._targetInst, null, e);
    }
    function $c(e) {
      Oo(e, hI);
    }
    function mI(e, t, s, l) {
      lI(s, l, LS, e, t);
    }
    function vI(e) {
      Oo(e, pI);
    }
    var th = null, Fg = null, nh = null;
    function gI(e) {
      return th = e, Fg = jS(), !0;
    }
    function yI() {
      th = null, Fg = null, nh = null;
    }
    function BS() {
      if (nh)
        return nh;
      var e, t = Fg, s = t.length, l, d = jS(), p = d.length;
      for (e = 0; e < s && t[e] === d[e]; e++)
        ;
      var y = s - e;
      for (l = 1; l <= y && t[s - l] === d[p - l]; l++)
        ;
      var b = l > 1 ? 1 - l : void 0;
      return nh = d.slice(e, b), nh;
    }
    function jS() {
      return "value" in th ? th.value : th.textContent;
    }
    var wI = 10, bI = {
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
    function Cm() {
      return !0;
    }
    function ru() {
      return !1;
    }
    function hr(e, t, s, l) {
      delete this.nativeEvent, delete this.preventDefault, delete this.stopPropagation, delete this.isDefaultPrevented, delete this.isPropagationStopped, this.dispatchConfig = e, this._targetInst = t, this.nativeEvent = s;
      var d = this.constructor.Interface;
      for (var p in d)
        if (!!d.hasOwnProperty(p)) {
          delete this[p];
          var y = d[p];
          y ? this[p] = y(s) : p === "target" ? this.target = l : this[p] = s[p];
        }
      var b = s.defaultPrevented != null ? s.defaultPrevented : s.returnValue === !1;
      return b ? this.isDefaultPrevented = Cm : this.isDefaultPrevented = ru, this.isPropagationStopped = ru, this;
    }
    i(hr.prototype, {
      preventDefault: function() {
        this.defaultPrevented = !0;
        var e = this.nativeEvent;
        !e || (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = Cm);
      },
      stopPropagation: function() {
        var e = this.nativeEvent;
        !e || (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = Cm);
      },
      persist: function() {
        this.isPersistent = Cm;
      },
      isPersistent: ru,
      destructor: function() {
        var e = this.constructor.Interface;
        for (var t in e)
          Object.defineProperty(this, t, Qc(t, e[t]));
        this.dispatchConfig = null, this._targetInst = null, this.nativeEvent = null, this.isDefaultPrevented = ru, this.isPropagationStopped = ru, this._dispatchListeners = null, this._dispatchInstances = null, Object.defineProperty(this, "nativeEvent", Qc("nativeEvent", null)), Object.defineProperty(this, "isDefaultPrevented", Qc("isDefaultPrevented", ru)), Object.defineProperty(this, "isPropagationStopped", Qc("isPropagationStopped", ru)), Object.defineProperty(this, "preventDefault", Qc("preventDefault", function() {
        })), Object.defineProperty(this, "stopPropagation", Qc("stopPropagation", function() {
        }));
      }
    }), hr.Interface = bI, hr.extend = function(e) {
      var t = this, s = function() {
      };
      s.prototype = t.prototype;
      var l = new s();
      function d() {
        return t.apply(this, arguments);
      }
      return i(l, d.prototype), d.prototype = l, d.prototype.constructor = d, d.Interface = i({}, t.Interface, e), d.extend = t.extend, US(d), d;
    }, US(hr);
    function Qc(e, t) {
      var s = typeof t == "function";
      return {
        configurable: !0,
        set: l,
        get: d
      };
      function l(y) {
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
    function SI(e, t, s, l) {
      var d = this;
      if (d.eventPool.length) {
        var p = d.eventPool.pop();
        return d.call(p, e, t, s, l), p;
      }
      return new d(e, t, s, l);
    }
    function xI(e) {
      var t = this;
      if (!(e instanceof t))
        throw Error("Trying to release an event instance into a pool of a different type.");
      e.destructor(), t.eventPool.length < wI && t.eventPool.push(e);
    }
    function US(e) {
      e.eventPool = [], e.getPooled = SI, e.release = xI;
    }
    var CI = hr.extend({
      data: null
    }), TI = hr.extend({
      data: null
    }), MI = [9, 13, 27, 32], VS = 229, $g = Bn && "CompositionEvent" in window, ih = null;
    Bn && "documentMode" in document && (ih = document.documentMode);
    var EI = Bn && "TextEvent" in window && !ih, HS = Bn && (!$g || ih && ih > 8 && ih <= 11), WS = 32, FS = String.fromCharCode(WS), so = {
      beforeInput: {
        phasedRegistrationNames: {
          bubbled: "onBeforeInput",
          captured: "onBeforeInputCapture"
        },
        dependencies: [aa, Wi, _l, Pl]
      },
      compositionEnd: {
        phasedRegistrationNames: {
          bubbled: "onCompositionEnd",
          captured: "onCompositionEndCapture"
        },
        dependencies: [Un, aa, Vn, Wi, ai, oa]
      },
      compositionStart: {
        phasedRegistrationNames: {
          bubbled: "onCompositionStart",
          captured: "onCompositionStartCapture"
        },
        dependencies: [Un, El, Vn, Wi, ai, oa]
      },
      compositionUpdate: {
        phasedRegistrationNames: {
          bubbled: "onCompositionUpdate",
          captured: "onCompositionUpdateCapture"
        },
        dependencies: [Un, qd, Vn, Wi, ai, oa]
      }
    }, $S = !1;
    function II(e) {
      return (e.ctrlKey || e.altKey || e.metaKey) && !(e.ctrlKey && e.altKey);
    }
    function AI(e) {
      switch (e) {
        case El:
          return so.compositionStart;
        case aa:
          return so.compositionEnd;
        case qd:
          return so.compositionUpdate;
      }
    }
    function RI(e, t) {
      return e === Vn && t.keyCode === VS;
    }
    function QS(e, t) {
      switch (e) {
        case ai:
          return MI.indexOf(t.keyCode) !== -1;
        case Vn:
          return t.keyCode !== VS;
        case Wi:
        case oa:
        case Un:
          return !0;
        default:
          return !1;
      }
    }
    function ZS(e) {
      var t = e.detail;
      return typeof t == "object" && "data" in t ? t.data : null;
    }
    function YS(e) {
      return e.locale === "ko";
    }
    var Zc = !1;
    function DI(e, t, s, l) {
      var d, p;
      if ($g ? d = AI(e) : Zc ? QS(e, s) && (d = so.compositionEnd) : RI(e, s) && (d = so.compositionStart), !d)
        return null;
      HS && !YS(s) && (!Zc && d === so.compositionStart ? Zc = gI(l) : d === so.compositionEnd && Zc && (p = BS()));
      var y = CI.getPooled(d, t, s, l);
      if (p)
        y.data = p;
      else {
        var b = ZS(s);
        b !== null && (y.data = b);
      }
      return $c(y), y;
    }
    function NI(e, t) {
      switch (e) {
        case aa:
          return ZS(t);
        case Wi:
          var s = t.which;
          return s !== WS ? null : ($S = !0, FS);
        case _l:
          var l = t.data;
          return l === FS && $S ? null : l;
        default:
          return null;
      }
    }
    function kI(e, t) {
      if (Zc) {
        if (e === aa || !$g && QS(e, t)) {
          var s = BS();
          return yI(), Zc = !1, s;
        }
        return null;
      }
      switch (e) {
        case Pl:
          return null;
        case Wi:
          if (!II(t)) {
            if (t.char && t.char.length > 1)
              return t.char;
            if (t.which)
              return String.fromCharCode(t.which);
          }
          return null;
        case aa:
          return HS && !YS(t) ? null : t.data;
        default:
          return null;
      }
    }
    function PI(e, t, s, l) {
      var d;
      if (EI ? d = NI(e, s) : d = kI(e, s), !d)
        return null;
      var p = TI.getPooled(so.beforeInput, t, s, l);
      return p.data = d, $c(p), p;
    }
    var _I = {
      eventTypes: so,
      extractEvents: function(e, t, s, l, d) {
        var p = DI(e, t, s, l), y = PI(e, t, s, l);
        return p === null ? y : y === null ? p : [p, y];
      }
    }, zI = {
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
    function GS(e) {
      var t = e && e.nodeName && e.nodeName.toLowerCase();
      return t === "input" ? !!zI[e.type] : t === "textarea";
    }
    var XS = {
      change: {
        phasedRegistrationNames: {
          bubbled: "onChange",
          captured: "onChangeCapture"
        },
        dependencies: [Un, Oa, Ml, Hi, Dl, Vn, ai, Ua]
      }
    };
    function JS(e, t, s) {
      var l = hr.getPooled(XS.change, e, t, s);
      return l.type = "change", xi(s), $c(l), l;
    }
    var rh = null, ah = null;
    function OI(e) {
      var t = e.nodeName && e.nodeName.toLowerCase();
      return t === "select" || t === "input" && e.type === "file";
    }
    function LI(e) {
      var t = JS(ah, e, Ll(e));
      Jr(BI, t);
    }
    function BI(e) {
      mc(e);
    }
    function Tm(e) {
      var t = iu(e);
      if (Hu(t))
        return e;
    }
    function jI(e, t) {
      if (e === Oa)
        return t;
    }
    var Qg = !1;
    Bn && (Qg = Bl("input") && (!document.documentMode || document.documentMode > 9));
    function UI(e, t) {
      rh = e, ah = t, rh.attachEvent("onpropertychange", KS);
    }
    function qS() {
      !rh || (rh.detachEvent("onpropertychange", KS), rh = null, ah = null);
    }
    function KS(e) {
      e.propertyName === "value" && Tm(ah) && LI(e);
    }
    function VI(e, t, s) {
      e === Hi ? (qS(), UI(t, s)) : e === Un && qS();
    }
    function HI(e, t) {
      if (e === Ua || e === ai || e === Vn)
        return Tm(ah);
    }
    function WI(e) {
      var t = e.nodeName;
      return t && t.toLowerCase() === "input" && (e.type === "checkbox" || e.type === "radio");
    }
    function FI(e, t) {
      if (e === Ml)
        return Tm(t);
    }
    function $I(e, t) {
      if (e === Dl || e === Oa)
        return Tm(t);
    }
    function QI(e) {
      var t = e._wrapperState;
      !t || !t.controlled || e.type !== "number" || yl(e, "number", e.value);
    }
    var ZI = {
      eventTypes: XS,
      _isInputEventSupported: Qg,
      extractEvents: function(e, t, s, l, d) {
        var p = t ? iu(t) : window, y, b;
        if (OI(p) ? y = jI : GS(p) ? Qg ? y = $I : (y = HI, b = VI) : WI(p) && (y = FI), y) {
          var E = y(e, t);
          if (E) {
            var N = JS(E, s, l);
            return N;
          }
        }
        b && b(e, p, t), e === Un && QI(p);
      }
    }, sh = hr.extend({
      view: null,
      detail: null
    }), YI = {
      Alt: "altKey",
      Control: "ctrlKey",
      Meta: "metaKey",
      Shift: "shiftKey"
    };
    function GI(e) {
      var t = this, s = t.nativeEvent;
      if (s.getModifierState)
        return s.getModifierState(e);
      var l = YI[e];
      return l ? !!s[l] : !1;
    }
    function Zg(e) {
      return GI;
    }
    var ex = 0, tx = 0, nx = !1, ix = !1, oh = sh.extend({
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
      getModifierState: Zg,
      button: null,
      buttons: null,
      relatedTarget: function(e) {
        return e.relatedTarget || (e.fromElement === e.srcElement ? e.toElement : e.fromElement);
      },
      movementX: function(e) {
        if ("movementX" in e)
          return e.movementX;
        var t = ex;
        return ex = e.screenX, nx ? e.type === "mousemove" ? e.screenX - t : 0 : (nx = !0, 0);
      },
      movementY: function(e) {
        if ("movementY" in e)
          return e.movementY;
        var t = tx;
        return tx = e.screenY, ix ? e.type === "mousemove" ? e.screenY - t : 0 : (ix = !0, 0);
      }
    }), rx = oh.extend({
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
        dependencies: [Ba, la]
      },
      mouseLeave: {
        registrationName: "onMouseLeave",
        dependencies: [Ba, la]
      },
      pointerEnter: {
        registrationName: "onPointerEnter",
        dependencies: [Ei, xt]
      },
      pointerLeave: {
        registrationName: "onPointerLeave",
        dependencies: [Ei, xt]
      }
    }, XI = {
      eventTypes: lh,
      extractEvents: function(e, t, s, l, d) {
        var p = e === la || e === xt, y = e === Ba || e === Ei;
        if (p && (d & Ui) === 0 && (s.relatedTarget || s.fromElement) || !y && !p)
          return null;
        var b;
        if (l.window === l)
          b = l;
        else {
          var E = l.ownerDocument;
          E ? b = E.defaultView || E.parentWindow : b = window;
        }
        var N, k;
        if (y) {
          N = t;
          var X = s.relatedTarget || s.toElement;
          if (k = X ? eh(X) : null, k !== null) {
            var L = pi(k);
            (k !== L || k.tag !== Ne && k.tag !== $e) && (k = null);
          }
        } else
          N = null, k = t;
        if (N === k)
          return null;
        var K, ve, be, qe;
        e === Ba || e === la ? (K = oh, ve = lh.mouseLeave, be = lh.mouseEnter, qe = "mouse") : (e === Ei || e === xt) && (K = rx, ve = lh.pointerLeave, be = lh.pointerEnter, qe = "pointer");
        var nt = N == null ? b : iu(N), zt = k == null ? b : iu(k), vt = K.getPooled(ve, N, s, l);
        vt.type = qe + "leave", vt.target = nt, vt.relatedTarget = zt;
        var Qt = K.getPooled(be, k, s, l);
        return Qt.type = qe + "enter", Qt.target = zt, Qt.relatedTarget = nt, mI(vt, Qt, N, k), (d & Ma) === 0 ? [vt] : [vt, Qt];
      }
    };
    function JI(e, t) {
      return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
    }
    var au = typeof Object.is == "function" ? Object.is : JI, qI = Object.prototype.hasOwnProperty;
    function uh(e, t) {
      if (au(e, t))
        return !0;
      if (typeof e != "object" || e === null || typeof t != "object" || t === null)
        return !1;
      var s = Object.keys(e), l = Object.keys(t);
      if (s.length !== l.length)
        return !1;
      for (var d = 0; d < s.length; d++)
        if (!qI.call(t, s[d]) || !au(e[s[d]], t[s[d]]))
          return !1;
      return !0;
    }
    var KI = Bn && "documentMode" in document && document.documentMode <= 11, ax = {
      select: {
        phasedRegistrationNames: {
          bubbled: "onSelect",
          captured: "onSelectCapture"
        },
        dependencies: [Un, Il, Al, Hi, Vn, ai, oa, kl, Ua]
      }
    }, Yc = null, Yg = null, ch = null, Gg = !1;
    function eA(e) {
      if ("selectionStart" in e && ql(e))
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
    function sx(e) {
      return e.window === e ? e.document : e.nodeType === Pa ? e : e.ownerDocument;
    }
    function ox(e, t) {
      var s = sx(t);
      if (Gg || Yc == null || Yc !== Jl(s))
        return null;
      var l = eA(Yc);
      if (!ch || !uh(ch, l)) {
        ch = l;
        var d = hr.getPooled(ax.select, Yg, e, t);
        return d.type = "select", d.target = Yc, $c(d), d;
      }
      return null;
    }
    var tA = {
      eventTypes: ax,
      extractEvents: function(e, t, s, l, d, p) {
        var y = p || sx(l);
        if (!y || !jo("onSelect", y))
          return null;
        var b = t ? iu(t) : window;
        switch (e) {
          case Hi:
            (GS(b) || b.contentEditable === "true") && (Yc = b, Yg = t, ch = null);
            break;
          case Un:
            Yc = null, Yg = null, ch = null;
            break;
          case oa:
            Gg = !0;
            break;
          case Il:
          case kl:
          case Al:
            return Gg = !1, ox(s, l);
          case Ua:
            if (KI)
              break;
          case Vn:
          case ai:
            return ox(s, l);
        }
        return null;
      }
    }, nA = hr.extend({
      animationName: null,
      elapsedTime: null,
      pseudoElement: null
    }), iA = hr.extend({
      clipboardData: function(e) {
        return "clipboardData" in e ? e.clipboardData : window.clipboardData;
      }
    }), rA = sh.extend({
      relatedTarget: null
    });
    function Mm(e) {
      var t, s = e.keyCode;
      return "charCode" in e ? (t = e.charCode, t === 0 && s === 13 && (t = 13)) : t = s, t === 10 && (t = 13), t >= 32 || t === 13 ? t : 0;
    }
    var aA = {
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
    }, sA = {
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
    function oA(e) {
      if (e.key) {
        var t = aA[e.key] || e.key;
        if (t !== "Unidentified")
          return t;
      }
      if (e.type === "keypress") {
        var s = Mm(e);
        return s === 13 ? "Enter" : String.fromCharCode(s);
      }
      return e.type === "keydown" || e.type === "keyup" ? sA[e.keyCode] || "Unidentified" : "";
    }
    var lA = sh.extend({
      key: oA,
      location: null,
      ctrlKey: null,
      shiftKey: null,
      altKey: null,
      metaKey: null,
      repeat: null,
      locale: null,
      getModifierState: Zg,
      charCode: function(e) {
        return e.type === "keypress" ? Mm(e) : 0;
      },
      keyCode: function(e) {
        return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
      },
      which: function(e) {
        return e.type === "keypress" ? Mm(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
      }
    }), uA = oh.extend({
      dataTransfer: null
    }), cA = sh.extend({
      touches: null,
      targetTouches: null,
      changedTouches: null,
      altKey: null,
      metaKey: null,
      ctrlKey: null,
      shiftKey: null,
      getModifierState: Zg
    }), dA = hr.extend({
      propertyName: null,
      elapsedTime: null,
      pseudoElement: null
    }), fA = oh.extend({
      deltaX: function(e) {
        return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
      },
      deltaY: function(e) {
        return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
      },
      deltaZ: null,
      deltaMode: null
    }), hA = [Gd, ec, Ps, _s, Do, nc, Bs, af, sf, Mi, Dl, _r, La, of, lf, ic, uf, cf, df, zr, kn, Tn, ja, $n, sc, js, No, pf, ko, cc, dc], pA = {
      eventTypes: Nf,
      extractEvents: function(e, t, s, l, d) {
        var p = Mc.get(e);
        if (!p)
          return null;
        var y;
        switch (e) {
          case Wi:
            if (Mm(s) === 0)
              return null;
          case Vn:
          case ai:
            y = lA;
            break;
          case Un:
          case Hi:
            y = rA;
            break;
          case Ml:
            if (s.button === 2)
              return null;
          case zs:
          case tf:
          case oa:
          case Nl:
          case kl:
          case Ba:
          case la:
          case Il:
            y = oh;
            break;
          case Np:
          case Al:
          case Os:
          case nf:
          case Rl:
          case rf:
          case tc:
          case Ls:
            y = uA;
            break;
          case oc:
          case lc:
          case uc:
          case mf:
            y = cA;
            break;
          case Dp:
          case Xd:
          case Jd:
            y = nA;
            break;
          case zl:
            y = dA;
            break;
          case Or:
            y = sh;
            break;
          case vf:
            y = fA;
            break;
          case Kd:
          case ef:
          case Pl:
            y = iA;
            break;
          case sa:
          case rc:
          case ff:
          case hf:
          case ac:
          case Ei:
          case xt:
          case an:
            y = rx;
            break;
          default:
            hA.indexOf(e) === -1 && g("SimpleEventPlugin: Unhandled event type, `%s`. This warning is likely caused by a bug in React. Please file an issue.", e), y = hr;
            break;
        }
        var b = y.getPooled(p, t, s, l);
        return $c(b), b;
      }
    }, mA = ["ResponderEventPlugin", "SimpleEventPlugin", "EnterLeaveEventPlugin", "ChangeEventPlugin", "SelectEventPlugin", "BeforeInputEventPlugin"];
    Yr(mA), he(Hg, Zo, iu), Tr({
      SimpleEventPlugin: pA,
      EnterLeaveEventPlugin: XI,
      ChangeEventPlugin: ZI,
      SelectEventPlugin: tA,
      BeforeInputEventPlugin: _I
    });
    var lx = "\u269B", vA = "\u26D4", vi = typeof performance < "u" && typeof performance.mark == "function" && typeof performance.clearMarks == "function" && typeof performance.measure == "function" && typeof performance.clearMeasures == "function", su = null, rs = null, ou = null, Em = !1, Im = !1, Xg = !1, dh = 0, as = 0, Am = /* @__PURE__ */ new Set(), Jg = function(e) {
      return lx + " " + e;
    }, gA = function(e, t) {
      var s = t ? vA + " " : lx + " ", l = t ? " Warning: " + t : "";
      return "" + s + e + l;
    }, Gc = function(e) {
      performance.mark(Jg(e));
    }, yA = function(e) {
      performance.clearMarks(Jg(e));
    }, Xc = function(e, t, s) {
      var l = Jg(t), d = gA(e, s);
      try {
        performance.measure(d, l);
      } catch {
      }
      performance.clearMarks(l), performance.clearMeasures(d);
    }, qg = function(e, t) {
      return e + " (#" + t + ")";
    }, Kg = function(e, t, s) {
      return s === null ? e + " [" + (t ? "update" : "mount") + "]" : e + "." + s;
    }, ey = function(e, t) {
      var s = Te(e.type) || "Unknown", l = e._debugID, d = e.alternate !== null, p = Kg(s, d, t);
      if (Em && Am.has(p))
        return !1;
      Am.add(p);
      var y = qg(p, l);
      return Gc(y), !0;
    }, ux = function(e, t) {
      var s = Te(e.type) || "Unknown", l = e._debugID, d = e.alternate !== null, p = Kg(s, d, t), y = qg(p, l);
      yA(y);
    }, Rm = function(e, t, s) {
      var l = Te(e.type) || "Unknown", d = e._debugID, p = e.alternate !== null, y = Kg(l, p, t), b = qg(y, d);
      Xc(y, b, s);
    }, Dm = function(e) {
      switch (e.tag) {
        case Ce:
        case Ne:
        case $e:
        case Ve:
        case bt:
        case re:
        case Ge:
        case Xt:
          return !0;
        default:
          return !1;
      }
    }, wA = function() {
      rs !== null && ou !== null && ux(ou, rs), ou = null, rs = null, Xg = !1;
    }, bA = function() {
      for (var e = su; e; )
        e._debugIsCurrentlyTiming && Rm(e, null, null), e = e.return;
    }, cx = function(e) {
      e.return !== null && cx(e.return), e._debugIsCurrentlyTiming && ey(e, null);
    }, SA = function() {
      su !== null && cx(su);
    };
    function Nm() {
      as++;
    }
    function xA() {
      Em && (Im = !0), rs !== null && rs !== "componentWillMount" && rs !== "componentWillReceiveProps" && (Xg = !0);
    }
    function dx(e) {
      {
        if (!vi || Dm(e) || (su = e, !ey(e, null)))
          return;
        e._debugIsCurrentlyTiming = !0;
      }
    }
    function fx(e) {
      {
        if (!vi || Dm(e))
          return;
        e._debugIsCurrentlyTiming = !1, ux(e, null);
      }
    }
    function hx(e) {
      {
        if (!vi || Dm(e) || (su = e.return, !e._debugIsCurrentlyTiming))
          return;
        e._debugIsCurrentlyTiming = !1, Rm(e, null, null);
      }
    }
    function CA(e) {
      {
        if (!vi || Dm(e) || (su = e.return, !e._debugIsCurrentlyTiming))
          return;
        e._debugIsCurrentlyTiming = !1;
        var t = e.tag === ee ? "Rendering was suspended" : "An error was thrown inside this error boundary";
        Rm(e, null, t);
      }
    }
    function ss(e, t) {
      {
        if (!vi || (wA(), !ey(e, t)))
          return;
        ou = e, rs = t;
      }
    }
    function os() {
      {
        if (!vi)
          return;
        if (rs !== null && ou !== null) {
          var e = Xg ? "Scheduled a cascading update" : null;
          Rm(ou, rs, e);
        }
        rs = null, ou = null;
      }
    }
    function px(e) {
      {
        if (su = e, !vi)
          return;
        dh = 0, Gc("(React Tree Reconciliation)"), SA();
      }
    }
    function mx(e, t) {
      {
        if (!vi)
          return;
        var s = null;
        if (e !== null)
          if (e.tag === Ce)
            s = "A top-level update interrupted the previous render";
          else {
            var l = Te(e.type) || "Unknown";
            s = "An update to " + l + " interrupted the previous render";
          }
        else
          dh > 1 && (s = "There were cascading updates");
        dh = 0;
        var d = t ? "(React Tree Reconciliation: Completed Root)" : "(React Tree Reconciliation: Yielded)";
        bA(), Xc(d, "(React Tree Reconciliation)", s);
      }
    }
    function TA() {
      {
        if (!vi)
          return;
        Em = !0, Im = !1, Am.clear(), Gc("(Committing Changes)");
      }
    }
    function MA() {
      {
        if (!vi)
          return;
        var e = null;
        Im ? e = "Lifecycle hook scheduled a cascading update" : dh > 0 && (e = "Caused by a cascading update in earlier commit"), Im = !1, dh++, Em = !1, Am.clear(), Xc("(Committing Changes)", "(Committing Changes)", e);
      }
    }
    function vx() {
      {
        if (!vi)
          return;
        as = 0, Gc("(Committing Snapshot Effects)");
      }
    }
    function gx() {
      {
        if (!vi)
          return;
        var e = as;
        as = 0, Xc("(Committing Snapshot Effects: " + e + " Total)", "(Committing Snapshot Effects)", null);
      }
    }
    function yx() {
      {
        if (!vi)
          return;
        as = 0, Gc("(Committing Host Effects)");
      }
    }
    function wx() {
      {
        if (!vi)
          return;
        var e = as;
        as = 0, Xc("(Committing Host Effects: " + e + " Total)", "(Committing Host Effects)", null);
      }
    }
    function bx() {
      {
        if (!vi)
          return;
        as = 0, Gc("(Calling Lifecycle Methods)");
      }
    }
    function Sx() {
      {
        if (!vi)
          return;
        var e = as;
        as = 0, Xc("(Calling Lifecycle Methods: " + e + " Total)", "(Calling Lifecycle Methods)", null);
      }
    }
    var ty = [], km;
    km = [];
    var oo = -1;
    function lu(e) {
      return {
        current: e
      };
    }
    function Pi(e, t) {
      if (oo < 0) {
        g("Unexpected pop.");
        return;
      }
      t !== km[oo] && g("Unexpected Fiber popped."), e.current = ty[oo], ty[oo] = null, km[oo] = null, oo--;
    }
    function _i(e, t, s) {
      oo++, ty[oo] = e.current, km[oo] = s, e.current = t;
    }
    var ny;
    ny = {};
    var pr = {};
    Object.freeze(pr);
    var lo = lu(pr), ls = lu(!1), iy = pr;
    function Jc(e, t, s) {
      return s && us(t) ? iy : lo.current;
    }
    function xx(e, t, s) {
      {
        var l = e.stateNode;
        l.__reactInternalMemoizedUnmaskedChildContext = t, l.__reactInternalMemoizedMaskedChildContext = s;
      }
    }
    function qc(e, t) {
      {
        var s = e.type, l = s.contextTypes;
        if (!l)
          return pr;
        var d = e.stateNode;
        if (d && d.__reactInternalMemoizedUnmaskedChildContext === t)
          return d.__reactInternalMemoizedMaskedChildContext;
        var p = {};
        for (var y in l)
          p[y] = t[y];
        {
          var b = Te(s) || "Unknown";
          c(l, p, "context", b, ft);
        }
        return d && xx(e, t, p), p;
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
    function _m(e) {
      Pi(ls, e), Pi(lo, e);
    }
    function ry(e) {
      Pi(ls, e), Pi(lo, e);
    }
    function Cx(e, t, s) {
      {
        if (lo.current !== pr)
          throw Error("Unexpected context found on stack. This error is likely caused by a bug in React. Please file an issue.");
        _i(lo, t, e), _i(ls, s, e);
      }
    }
    function Tx(e, t, s) {
      {
        var l = e.stateNode, d = t.childContextTypes;
        if (typeof l.getChildContext != "function") {
          {
            var p = Te(t) || "Unknown";
            ny[p] || (ny[p] = !0, g("%s.childContextTypes is specified but there is no getChildContext() method on the instance. You can either define getChildContext() on %s or remove childContextTypes from it.", p, p));
          }
          return s;
        }
        var y;
        ss(e, "getChildContext"), y = l.getChildContext(), os();
        for (var b in y)
          if (!(b in d))
            throw Error((Te(t) || "Unknown") + '.getChildContext(): key "' + b + '" is not defined in childContextTypes.');
        {
          var E = Te(t) || "Unknown";
          c(
            d,
            y,
            "child context",
            E,
            ft
          );
        }
        return i({}, s, {}, y);
      }
    }
    function zm(e) {
      {
        var t = e.stateNode, s = t && t.__reactInternalMemoizedMergedChildContext || pr;
        return iy = lo.current, _i(lo, s, e), _i(ls, ls.current, e), !0;
      }
    }
    function Mx(e, t, s) {
      {
        var l = e.stateNode;
        if (!l)
          throw Error("Expected to have an instance by this point. This error is likely caused by a bug in React. Please file an issue.");
        if (s) {
          var d = Tx(e, t, iy);
          l.__reactInternalMemoizedMergedChildContext = d, Pi(ls, e), Pi(lo, e), _i(lo, d, e), _i(ls, s, e);
        } else
          Pi(ls, e), _i(ls, s, e);
      }
    }
    function EA(e) {
      {
        if (!(Wa(e) && e.tag === xe))
          throw Error("Expected subtree parent to be a mounted class component. This error is likely caused by a bug in React. Please file an issue.");
        var t = e;
        do {
          switch (t.tag) {
            case Ce:
              return t.stateNode.context;
            case xe: {
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
    var Ex = 0, IA = 1, AA = 2, RA = o.unstable_runWithPriority, ay = o.unstable_scheduleCallback, Ix = o.unstable_cancelCallback, DA = o.unstable_shouldYield, Ax = o.unstable_requestPaint, sy = o.unstable_now, NA = o.unstable_getCurrentPriorityLevel, Om = o.unstable_ImmediatePriority, Rx = o.unstable_UserBlockingPriority, Dx = o.unstable_NormalPriority, Nx = o.unstable_LowPriority, kx = o.unstable_IdlePriority;
    if (!(h.__interactionsRef != null && h.__interactionsRef.current != null))
      throw Error("It is not supported to run the profiling version of a renderer (for example, `react-dom/profiling`) without also replacing the `scheduler/tracing` module with `scheduler/tracing-profiling`. Your bundler might have a setting for aliasing both modules. Learn more at http://fb.me/react-profiling");
    var Px = {}, zi = 99, Yo = 98, ha = 97, oy = 96, fh = 95, Kc = 90, kA = DA, PA = Ax !== void 0 ? Ax : function() {
    }, uo = null, Lm = null, ly = !1, _x = sy(), mr = _x < 1e4 ? sy : function() {
      return sy() - _x;
    };
    function ed() {
      switch (NA()) {
        case Om:
          return zi;
        case Rx:
          return Yo;
        case Dx:
          return ha;
        case Nx:
          return oy;
        case kx:
          return fh;
        default:
          throw Error("Unknown priority level.");
      }
    }
    function zx(e) {
      switch (e) {
        case zi:
          return Om;
        case Yo:
          return Rx;
        case ha:
          return Dx;
        case oy:
          return Nx;
        case fh:
          return kx;
        default:
          throw Error("Unknown priority level.");
      }
    }
    function co(e, t) {
      var s = zx(e);
      return RA(s, t);
    }
    function hh(e, t, s) {
      var l = zx(e);
      return ay(l, t, s);
    }
    function Ox(e) {
      return uo === null ? (uo = [e], Lm = ay(Om, Lx)) : uo.push(e), Px;
    }
    function _A(e) {
      e !== Px && Ix(e);
    }
    function cs() {
      if (Lm !== null) {
        var e = Lm;
        Lm = null, Ix(e);
      }
      Lx();
    }
    function Lx() {
      if (!ly && uo !== null) {
        ly = !0;
        var e = 0;
        try {
          var t = !0, s = uo;
          co(zi, function() {
            for (; e < s.length; e++) {
              var l = s[e];
              do
                l = l(t);
              while (l !== null);
            }
          }), uo = null;
        } catch (l) {
          throw uo !== null && (uo = uo.slice(e + 1)), ay(Om, cs), l;
        } finally {
          ly = !1;
        }
      }
    }
    var si = 0, gn = 1, Vr = 2, td = 4, ds = 8, ph = 1073741823, De = 0, fs = 1, uu = 2, Bx = 3, Tt = ph, jx = Tt - 1, Bm = 10, jm = jx - 1;
    function uy(e) {
      return jm - (e / Bm | 0);
    }
    function cu(e) {
      return (jm - e) * Bm;
    }
    function zA(e, t) {
      return ((e / t | 0) + 1) * t;
    }
    function cy(e, t, s) {
      return jm - zA(jm - e + t / Bm, s / Bm);
    }
    var mh = 5e3, dy = 250;
    function OA(e) {
      return cy(e, mh, dy);
    }
    function LA(e, t) {
      return cy(e, t, dy);
    }
    var Ux = 500, Vx = 100;
    function Hx(e) {
      return cy(e, Ux, Vx);
    }
    function Wx(e, t) {
      if (t === Tt)
        return zi;
      if (t === fs || t === uu)
        return fh;
      var s = cu(t) - cu(e);
      return s <= 0 ? zi : s <= Ux + Vx ? Yo : s <= mh + dy ? ha : fh;
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
      var BA = function(e) {
        for (var t = null, s = e; s !== null; )
          s.mode & gn && (t = s), s = s.return;
        return t;
      }, du = function(e) {
        var t = [];
        return e.forEach(function(s) {
          t.push(s);
        }), t.sort().join(", ");
      }, vh = [], gh = [], yh = [], wh = [], bh = [], Sh = [], fu = /* @__PURE__ */ new Set();
      pa.recordUnsafeLifecycleWarnings = function(e, t) {
        fu.has(e.type) || (typeof t.componentWillMount == "function" && t.componentWillMount.__suppressDeprecationWarning !== !0 && vh.push(e), e.mode & gn && typeof t.UNSAFE_componentWillMount == "function" && gh.push(e), typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps.__suppressDeprecationWarning !== !0 && yh.push(e), e.mode & gn && typeof t.UNSAFE_componentWillReceiveProps == "function" && wh.push(e), typeof t.componentWillUpdate == "function" && t.componentWillUpdate.__suppressDeprecationWarning !== !0 && bh.push(e), e.mode & gn && typeof t.UNSAFE_componentWillUpdate == "function" && Sh.push(e));
      }, pa.flushPendingUnsafeLifecycleWarnings = function() {
        var e = /* @__PURE__ */ new Set();
        vh.length > 0 && (vh.forEach(function(L) {
          e.add(Te(L.type) || "Component"), fu.add(L.type);
        }), vh = []);
        var t = /* @__PURE__ */ new Set();
        gh.length > 0 && (gh.forEach(function(L) {
          t.add(Te(L.type) || "Component"), fu.add(L.type);
        }), gh = []);
        var s = /* @__PURE__ */ new Set();
        yh.length > 0 && (yh.forEach(function(L) {
          s.add(Te(L.type) || "Component"), fu.add(L.type);
        }), yh = []);
        var l = /* @__PURE__ */ new Set();
        wh.length > 0 && (wh.forEach(function(L) {
          l.add(Te(L.type) || "Component"), fu.add(L.type);
        }), wh = []);
        var d = /* @__PURE__ */ new Set();
        bh.length > 0 && (bh.forEach(function(L) {
          d.add(Te(L.type) || "Component"), fu.add(L.type);
        }), bh = []);
        var p = /* @__PURE__ */ new Set();
        if (Sh.length > 0 && (Sh.forEach(function(L) {
          p.add(Te(L.type) || "Component"), fu.add(L.type);
        }), Sh = []), t.size > 0) {
          var y = du(t);
          g(`Using UNSAFE_componentWillMount in strict mode is not recommended and may indicate bugs in your code. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move code with side effects to componentDidMount, and set initial state in the constructor.

Please update the following components: %s`, y);
        }
        if (l.size > 0) {
          var b = du(l);
          g(`Using UNSAFE_componentWillReceiveProps in strict mode is not recommended and may indicate bugs in your code. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move data fetching code or side effects to componentDidUpdate.
* If you're updating state whenever props change, refactor your code to use memoization techniques or move it to static getDerivedStateFromProps. Learn more at: https://fb.me/react-derived-state

Please update the following components: %s`, b);
        }
        if (p.size > 0) {
          var E = du(p);
          g(`Using UNSAFE_componentWillUpdate in strict mode is not recommended and may indicate bugs in your code. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move data fetching code or side effects to componentDidUpdate.

Please update the following components: %s`, E);
        }
        if (e.size > 0) {
          var N = du(e);
          w(`componentWillMount has been renamed, and is not recommended for use. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move code with side effects to componentDidMount, and set initial state in the constructor.
* Rename componentWillMount to UNSAFE_componentWillMount to suppress this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: %s`, N);
        }
        if (s.size > 0) {
          var k = du(s);
          w(`componentWillReceiveProps has been renamed, and is not recommended for use. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move data fetching code or side effects to componentDidUpdate.
* If you're updating state whenever props change, refactor your code to use memoization techniques or move it to static getDerivedStateFromProps. Learn more at: https://fb.me/react-derived-state
* Rename componentWillReceiveProps to UNSAFE_componentWillReceiveProps to suppress this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: %s`, k);
        }
        if (d.size > 0) {
          var X = du(d);
          w(`componentWillUpdate has been renamed, and is not recommended for use. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move data fetching code or side effects to componentDidUpdate.
* Rename componentWillUpdate to UNSAFE_componentWillUpdate to suppress this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: %s`, X);
        }
      };
      var Um = /* @__PURE__ */ new Map(), Fx = /* @__PURE__ */ new Set();
      pa.recordLegacyContextWarning = function(e, t) {
        var s = BA(e);
        if (s === null) {
          g("Expected to find a StrictMode component in a strict mode tree. This error is likely caused by a bug in React. Please file an issue.");
          return;
        }
        if (!Fx.has(e.type)) {
          var l = Um.get(s);
          (e.type.contextTypes != null || e.type.childContextTypes != null || t !== null && typeof t.getChildContext == "function") && (l === void 0 && (l = [], Um.set(s, l)), l.push(e));
        }
      }, pa.flushLegacyContextWarning = function() {
        Um.forEach(function(e, t) {
          if (e.length !== 0) {
            var s = e[0], l = /* @__PURE__ */ new Set();
            e.forEach(function(y) {
              l.add(Te(y.type) || "Component"), Fx.add(y.type);
            });
            var d = du(l), p = Fn(s);
            g(`Legacy context API has been detected within a strict-mode tree.

The old API will be supported in all 16.x releases, but applications using it should migrate to the new version.

Please update the following components: %s

Learn more about this warning here: https://fb.me/react-legacy-context%s`, d, p);
          }
        });
      }, pa.discardPendingWarnings = function() {
        vh = [], gh = [], yh = [], wh = [], bh = [], Sh = [], Um = /* @__PURE__ */ new Map();
      };
    }
    var Hr = null, nd = null, jA = function(e) {
      Hr = e;
    };
    function id(e) {
      {
        if (Hr === null)
          return e;
        var t = Hr(e);
        return t === void 0 ? e : t.current;
      }
    }
    function fy(e) {
      return id(e);
    }
    function hy(e) {
      {
        if (Hr === null)
          return e;
        var t = Hr(e);
        if (t === void 0) {
          if (e != null && typeof e.render == "function") {
            var s = id(e.render);
            if (e.render !== s) {
              var l = {
                $$typeof: ti,
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
    function $x(e, t) {
      {
        if (Hr === null)
          return !1;
        var s = e.elementType, l = t.type, d = !1, p = typeof l == "object" && l !== null ? l.$$typeof : null;
        switch (e.tag) {
          case xe: {
            typeof l == "function" && (d = !0);
            break;
          }
          case fe: {
            (typeof l == "function" || p === nr) && (d = !0);
            break;
          }
          case D: {
            (p === ti || p === nr) && (d = !0);
            break;
          }
          case ye:
          case me: {
            (p === ta || p === nr) && (d = !0);
            break;
          }
          default:
            return !1;
        }
        if (d) {
          var y = Hr(s);
          if (y !== void 0 && y === Hr(l))
            return !0;
        }
        return !1;
      }
    }
    function Qx(e) {
      {
        if (Hr === null || typeof WeakSet != "function")
          return;
        nd === null && (nd = /* @__PURE__ */ new WeakSet()), nd.add(e);
      }
    }
    var UA = function(e, t) {
      {
        if (Hr === null)
          return;
        var s = t.staleFamilies, l = t.updatedFamilies;
        tl(), vC(function() {
          py(e.current, l, s);
        });
      }
    }, VA = function(e, t) {
      {
        if (e.context !== pr)
          return;
        tl(), hR(function() {
          Uh(t, e, null, null);
        });
      }
    };
    function py(e, t, s) {
      {
        var l = e.alternate, d = e.child, p = e.sibling, y = e.tag, b = e.type, E = null;
        switch (y) {
          case fe:
          case me:
          case xe:
            E = b;
            break;
          case D:
            E = b.render;
            break;
        }
        if (Hr === null)
          throw new Error("Expected resolveFamily to be set during hot reload.");
        var N = !1, k = !1;
        if (E !== null) {
          var X = Hr(E);
          X !== void 0 && (s.has(X) ? k = !0 : t.has(X) && (y === xe ? k = !0 : N = !0));
        }
        nd !== null && (nd.has(e) || l !== null && nd.has(l)) && (k = !0), k && (e._debugNeedsRemount = !0), (k || N) && Qr(e, Tt), d !== null && !k && py(d, t, s), p !== null && py(p, t, s);
      }
    }
    var HA = function(e, t) {
      {
        var s = /* @__PURE__ */ new Set(), l = new Set(t.map(function(d) {
          return d.current;
        }));
        return my(e.current, l, s), s;
      }
    };
    function my(e, t, s) {
      {
        var l = e.child, d = e.sibling, p = e.tag, y = e.type, b = null;
        switch (p) {
          case fe:
          case me:
          case xe:
            b = y;
            break;
          case D:
            b = y.render;
            break;
        }
        var E = !1;
        b !== null && t.has(b) && (E = !0), E ? WA(e, s) : l !== null && my(l, t, s), d !== null && my(d, t, s);
      }
    }
    function WA(e, t) {
      {
        var s = FA(e, t);
        if (s)
          return;
        for (var l = e; ; ) {
          switch (l.tag) {
            case Ne:
              t.add(l.stateNode);
              return;
            case Ve:
              t.add(l.stateNode.containerInfo);
              return;
            case Ce:
              t.add(l.stateNode.containerInfo);
              return;
          }
          if (l.return === null)
            throw new Error("Expected to reach root first.");
          l = l.return;
        }
      }
    }
    function FA(e, t) {
      for (var s = e, l = !1; ; ) {
        if (s.tag === Ne)
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
    function $A(e) {
      if (gp(e), e._status !== Rs)
        throw e._result;
      return e._result;
    }
    var vy = lu(null), gy;
    gy = {};
    var Vm = null, rd = null, Hm = null, Wm = !1;
    function Fm() {
      Vm = null, rd = null, Hm = null, Wm = !1;
    }
    function Zx() {
      Wm = !0;
    }
    function Yx() {
      Wm = !1;
    }
    function Gx(e, t) {
      var s = e.type._context;
      _i(vy, s._currentValue, e), s._currentValue = t, s._currentRenderer !== void 0 && s._currentRenderer !== null && s._currentRenderer !== gy && g("Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported."), s._currentRenderer = gy;
    }
    function yy(e) {
      var t = vy.current;
      Pi(vy, e);
      var s = e.type._context;
      s._currentValue = t;
    }
    function QA(e, t, s) {
      if (au(s, t))
        return 0;
      var l = typeof e._calculateChangedBits == "function" ? e._calculateChangedBits(s, t) : ph;
      return (l & ph) !== l && g("calculateChangedBits: Expected the return value to be a 31-bit integer. Instead received: %s", l), l | 0;
    }
    function Xx(e, t) {
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
    function ZA(e, t, s, l) {
      var d = e.child;
      for (d !== null && (d.return = e); d !== null; ) {
        var p = void 0, y = d.dependencies;
        if (y !== null) {
          p = d.child;
          for (var b = y.firstContext; b !== null; ) {
            if (b.context === t && (b.observedBits & s) !== 0) {
              if (d.tag === xe) {
                var E = Go(l, null);
                E.tag = $m, Xo(d, E);
              }
              d.expirationTime < l && (d.expirationTime = l);
              var N = d.alternate;
              N !== null && N.expirationTime < l && (N.expirationTime = l), Xx(d.return, l), y.expirationTime < l && (y.expirationTime = l);
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
      Vm = e, rd = null, Hm = null;
      var s = e.dependencies;
      if (s !== null) {
        var l = s.firstContext;
        l !== null && (s.expirationTime >= t && Cw(), s.firstContext = null);
      }
    }
    function On(e, t) {
      if (Wm && g("Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo()."), Hm !== e) {
        if (!(t === !1 || t === 0)) {
          var s;
          typeof t != "number" || t === ph ? (Hm = e, s = ph) : s = t;
          var l = {
            context: e,
            observedBits: s,
            next: null
          };
          if (rd === null) {
            if (Vm === null)
              throw Error("Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo().");
            rd = l, Vm.dependencies = {
              expirationTime: De,
              firstContext: l,
              responders: null
            };
          } else
            rd = rd.next = l;
        }
      }
      return e._currentValue;
    }
    var Jx = 0, qx = 1, $m = 2, wy = 3, Qm = !1, by, Zm;
    by = !1, Zm = null;
    function Sy(e) {
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
    function xy(e, t) {
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
        tag: Jx,
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
        d === null ? t.next = t : (t.next = d.next, d.next = t), l.pending = t, Zm === l && !by && (g("An update (setState, replaceState, or forceUpdate) was scheduled from inside an update function. Update functions should be pure, with zero side-effects. Consider using componentDidUpdate or a callback."), by = !0);
      }
    }
    function Kx(e, t) {
      var s = e.alternate;
      s !== null && xy(s, e);
      var l = e.updateQueue, d = l.baseQueue;
      d === null ? (l.baseQueue = t.next = t, t.next = t) : (t.next = d.next, d.next = t);
    }
    function YA(e, t, s, l, d, p) {
      switch (s.tag) {
        case qx: {
          var y = s.payload;
          if (typeof y == "function") {
            Zx(), e.mode & gn && y.call(p, l, d);
            var b = y.call(p, l, d);
            return Yx(), b;
          }
          return y;
        }
        case wy:
          e.effectTag = e.effectTag & ~hi | jt;
        case Jx: {
          var E = s.payload, N;
          return typeof E == "function" ? (Zx(), e.mode & gn && E.call(p, l, d), N = E.call(p, l, d), Yx()) : N = E, N == null ? l : i({}, l, N);
        }
        case $m:
          return Qm = !0, l;
      }
      return l;
    }
    function xh(e, t, s, l) {
      var d = e.updateQueue;
      Qm = !1, Zm = d.shared;
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
        var X = p.next, L = d.baseState, K = De, ve = null, be = null, qe = null;
        if (X !== null) {
          var nt = X;
          do {
            var zt = nt.expirationTime;
            if (zt < l) {
              var vt = {
                expirationTime: nt.expirationTime,
                suspenseConfig: nt.suspenseConfig,
                tag: nt.tag,
                payload: nt.payload,
                callback: nt.callback,
                next: null
              };
              qe === null ? (be = qe = vt, ve = L) : qe = qe.next = vt, zt > K && (K = zt);
            } else {
              if (qe !== null) {
                var Qt = {
                  expirationTime: Tt,
                  suspenseConfig: nt.suspenseConfig,
                  tag: nt.tag,
                  payload: nt.payload,
                  callback: nt.callback,
                  next: null
                };
                qe = qe.next = Qt;
              }
              bC(zt, nt.suspenseConfig), L = YA(e, d, nt, L, t, s);
              var W = nt.callback;
              if (W !== null) {
                e.effectTag |= wf;
                var te = d.effects;
                te === null ? d.effects = [nt] : te.push(nt);
              }
            }
            if (nt = nt.next, nt === null || nt === X) {
              if (y = d.shared.pending, y === null)
                break;
              nt = p.next = y.next, y.next = X, d.baseQueue = p = y, d.shared.pending = null;
            }
          } while (!0);
        }
        qe === null ? ve = L : qe.next = be, d.baseState = ve, d.baseQueue = qe, zv(K), e.expirationTime = K, e.memoizedState = L;
      }
      Zm = null;
    }
    function GA(e, t) {
      if (typeof e != "function")
        throw Error("Invalid argument passed as callback. Expected a function. Instead received: " + e);
      e.call(t);
    }
    function e0() {
      Qm = !1;
    }
    function Ym() {
      return Qm;
    }
    function t0(e, t, s) {
      var l = t.effects;
      if (t.effects = null, l !== null)
        for (var d = 0; d < l.length; d++) {
          var p = l[d], y = p.callback;
          y !== null && (p.callback = null, GA(y, s));
        }
    }
    var XA = m.ReactCurrentBatchConfig;
    function Ch() {
      return XA.suspense;
    }
    var Cy = {}, JA = Array.isArray, n0 = new r.Component().refs, Ty, My, Ey, Iy, Ay, i0, Gm, Ry, Dy, Ny;
    {
      Ty = /* @__PURE__ */ new Set(), My = /* @__PURE__ */ new Set(), Ey = /* @__PURE__ */ new Set(), Iy = /* @__PURE__ */ new Set(), Ry = /* @__PURE__ */ new Set(), Ay = /* @__PURE__ */ new Set(), Dy = /* @__PURE__ */ new Set(), Ny = /* @__PURE__ */ new Set();
      var r0 = /* @__PURE__ */ new Set();
      Gm = function(e, t) {
        if (!(e === null || typeof e == "function")) {
          var s = t + "_" + e;
          r0.has(s) || (r0.add(s), g("%s(...): Expected the last optional `callback` argument to be a function. Instead received: %s.", t, e));
        }
      }, i0 = function(e, t) {
        if (t === void 0) {
          var s = Te(e) || "Component";
          Ay.has(s) || (Ay.add(s), g("%s.getDerivedStateFromProps(): A valid state object (or null) must be returned. You have returned undefined.", s));
        }
      }, Object.defineProperty(Cy, "_processChildContext", {
        enumerable: !1,
        value: function() {
          throw Error("_processChildContext is not available in React 16+. This likely means you have multiple copies of React and are attempting to nest a React 15 tree inside a React 16 tree using unstable_renderSubtreeIntoContainer, which isn't supported. Try to make sure you have only one copy of React (and ideally, switch to ReactDOM.createPortal).");
        }
      }), Object.freeze(Cy);
    }
    function Xm(e, t, s, l) {
      var d = e.memoizedState;
      e.mode & gn && s(l, d);
      var p = s(l, d);
      i0(t, p);
      var y = p == null ? d : i({}, d, p);
      if (e.memoizedState = y, e.expirationTime === De) {
        var b = e.updateQueue;
        b.baseState = y;
      }
    }
    var ky = {
      isMounted: Fa,
      enqueueSetState: function(e, t, s) {
        var l = ua(e), d = ms(), p = Ch(), y = Su(d, l, p), b = Go(y, p);
        b.payload = t, s != null && (Gm(s, "setState"), b.callback = s), Xo(l, b), Qr(l, y);
      },
      enqueueReplaceState: function(e, t, s) {
        var l = ua(e), d = ms(), p = Ch(), y = Su(d, l, p), b = Go(y, p);
        b.tag = qx, b.payload = t, s != null && (Gm(s, "replaceState"), b.callback = s), Xo(l, b), Qr(l, y);
      },
      enqueueForceUpdate: function(e, t) {
        var s = ua(e), l = ms(), d = Ch(), p = Su(l, s, d), y = Go(p, d);
        y.tag = $m, t != null && (Gm(t, "forceUpdate"), y.callback = t), Xo(s, y), Qr(s, p);
      }
    };
    function a0(e, t, s, l, d, p, y) {
      var b = e.stateNode;
      if (typeof b.shouldComponentUpdate == "function") {
        e.mode & gn && b.shouldComponentUpdate(l, p, y), ss(e, "shouldComponentUpdate");
        var E = b.shouldComponentUpdate(l, p, y);
        return os(), E === void 0 && g("%s.shouldComponentUpdate(): Returned undefined instead of a boolean value. Make sure to return true or false.", Te(t) || "Component"), E;
      }
      return t.prototype && t.prototype.isPureReactComponent ? !uh(s, l) || !uh(d, p) : !0;
    }
    function qA(e, t, s) {
      var l = e.stateNode;
      {
        var d = Te(t) || "Component", p = l.render;
        p || (t.prototype && typeof t.prototype.render == "function" ? g("%s(...): No `render` method found on the returned component instance: did you accidentally return an object from the constructor?", d) : g("%s(...): No `render` method found on the returned component instance: you may have forgotten to define `render`.", d)), l.getInitialState && !l.getInitialState.isReactClassApproved && !l.state && g("getInitialState was defined on %s, a plain JavaScript class. This is only supported for classes created using React.createClass. Did you mean to define a state property instead?", d), l.getDefaultProps && !l.getDefaultProps.isReactClassApproved && g("getDefaultProps was defined on %s, a plain JavaScript class. This is only supported for classes created using React.createClass. Use a static property to define defaultProps instead.", d), l.propTypes && g("propTypes was defined as an instance property on %s. Use a static property to define propTypes instead.", d), l.contextType && g("contextType was defined as an instance property on %s. Use a static property to define contextType instead.", d), l.contextTypes && g("contextTypes was defined as an instance property on %s. Use a static property to define contextTypes instead.", d), t.contextType && t.contextTypes && !Dy.has(t) && (Dy.add(t), g("%s declares both contextTypes and contextType static properties. The legacy contextTypes property will be ignored.", d)), typeof l.componentShouldUpdate == "function" && g("%s has a method called componentShouldUpdate(). Did you mean shouldComponentUpdate()? The name is phrased as a question because the function is expected to return a value.", d), t.prototype && t.prototype.isPureReactComponent && typeof l.shouldComponentUpdate < "u" && g("%s has a method called shouldComponentUpdate(). shouldComponentUpdate should not be used when extending React.PureComponent. Please extend React.Component if shouldComponentUpdate is used.", Te(t) || "A pure component"), typeof l.componentDidUnmount == "function" && g("%s has a method called componentDidUnmount(). But there is no such lifecycle method. Did you mean componentWillUnmount()?", d), typeof l.componentDidReceiveProps == "function" && g("%s has a method called componentDidReceiveProps(). But there is no such lifecycle method. If you meant to update the state in response to changing props, use componentWillReceiveProps(). If you meant to fetch data or run side-effects or mutations after React has updated the UI, use componentDidUpdate().", d), typeof l.componentWillRecieveProps == "function" && g("%s has a method called componentWillRecieveProps(). Did you mean componentWillReceiveProps()?", d), typeof l.UNSAFE_componentWillRecieveProps == "function" && g("%s has a method called UNSAFE_componentWillRecieveProps(). Did you mean UNSAFE_componentWillReceiveProps()?", d);
        var y = l.props !== s;
        l.props !== void 0 && y && g("%s(...): When calling super() in `%s`, make sure to pass up the same props that your component's constructor was passed.", d, d), l.defaultProps && g("Setting defaultProps as an instance property on %s is not supported and will be ignored. Instead, define defaultProps as a static property on %s.", d, d), typeof l.getSnapshotBeforeUpdate == "function" && typeof l.componentDidUpdate != "function" && !Ey.has(t) && (Ey.add(t), g("%s: getSnapshotBeforeUpdate() should be used with componentDidUpdate(). This component defines getSnapshotBeforeUpdate() only.", Te(t))), typeof l.getDerivedStateFromProps == "function" && g("%s: getDerivedStateFromProps() is defined as an instance method and will be ignored. Instead, declare it as a static method.", d), typeof l.getDerivedStateFromError == "function" && g("%s: getDerivedStateFromError() is defined as an instance method and will be ignored. Instead, declare it as a static method.", d), typeof t.getSnapshotBeforeUpdate == "function" && g("%s: getSnapshotBeforeUpdate() is defined as a static method and will be ignored. Instead, declare it as an instance method.", d);
        var b = l.state;
        b && (typeof b != "object" || JA(b)) && g("%s.state: must be set to an object or null", d), typeof l.getChildContext == "function" && typeof t.childContextTypes != "object" && g("%s.getChildContext(): childContextTypes must be defined in order to use getChildContext().", d);
      }
    }
    function s0(e, t) {
      t.updater = ky, e.stateNode = t, Pp(t, e), t._reactInternalInstance = Cy;
    }
    function o0(e, t, s) {
      var l = !1, d = pr, p = pr, y = t.contextType;
      if ("contextType" in t) {
        var b = y === null || y !== void 0 && y.$$typeof === bn && y._context === void 0;
        if (!b && !Ny.has(t)) {
          Ny.add(t);
          var E = "";
          y === void 0 ? E = " However, it is set to undefined. This can be caused by a typo or by mixing up named and default imports. This can also happen due to a circular dependency, so try moving the createContext() call to a separate file." : typeof y != "object" ? E = " However, it is set to a " + typeof y + "." : y.$$typeof === vn ? E = " Did you accidentally pass the Context.Provider instead?" : y._context !== void 0 ? E = " Did you accidentally pass the Context.Consumer instead?" : E = " However, it is set to an object with keys {" + Object.keys(y).join(", ") + "}.", g("%s defines an invalid contextType. contextType should point to the Context object returned by React.createContext().%s", Te(t) || "Component", E);
        }
      }
      if (typeof y == "object" && y !== null)
        p = On(y);
      else {
        d = Jc(e, t, !0);
        var N = t.contextTypes;
        l = N != null, p = l ? qc(e, d) : pr;
      }
      e.mode & gn && new t(s, p);
      var k = new t(s, p), X = e.memoizedState = k.state !== null && k.state !== void 0 ? k.state : null;
      s0(e, k);
      {
        if (typeof t.getDerivedStateFromProps == "function" && X === null) {
          var L = Te(t) || "Component";
          My.has(L) || (My.add(L), g("`%s` uses `getDerivedStateFromProps` but its initial state is %s. This is not recommended. Instead, define the initial state by assigning an object to `this.state` in the constructor of `%s`. This ensures that `getDerivedStateFromProps` arguments have a consistent shape.", L, k.state === null ? "null" : "undefined", L));
        }
        if (typeof t.getDerivedStateFromProps == "function" || typeof k.getSnapshotBeforeUpdate == "function") {
          var K = null, ve = null, be = null;
          if (typeof k.componentWillMount == "function" && k.componentWillMount.__suppressDeprecationWarning !== !0 ? K = "componentWillMount" : typeof k.UNSAFE_componentWillMount == "function" && (K = "UNSAFE_componentWillMount"), typeof k.componentWillReceiveProps == "function" && k.componentWillReceiveProps.__suppressDeprecationWarning !== !0 ? ve = "componentWillReceiveProps" : typeof k.UNSAFE_componentWillReceiveProps == "function" && (ve = "UNSAFE_componentWillReceiveProps"), typeof k.componentWillUpdate == "function" && k.componentWillUpdate.__suppressDeprecationWarning !== !0 ? be = "componentWillUpdate" : typeof k.UNSAFE_componentWillUpdate == "function" && (be = "UNSAFE_componentWillUpdate"), K !== null || ve !== null || be !== null) {
            var qe = Te(t) || "Component", nt = typeof t.getDerivedStateFromProps == "function" ? "getDerivedStateFromProps()" : "getSnapshotBeforeUpdate()";
            Iy.has(qe) || (Iy.add(qe), g(`Unsafe legacy lifecycles will not be called for components using new component APIs.

%s uses %s but also contains the following legacy lifecycles:%s%s%s

The above lifecycles should be removed. Learn more about this warning here:
https://fb.me/react-unsafe-component-lifecycles`, qe, nt, K !== null ? `
  ` + K : "", ve !== null ? `
  ` + ve : "", be !== null ? `
  ` + be : ""));
          }
        }
      }
      return l && xx(e, d, p), k;
    }
    function KA(e, t) {
      ss(e, "componentWillMount");
      var s = t.state;
      typeof t.componentWillMount == "function" && t.componentWillMount(), typeof t.UNSAFE_componentWillMount == "function" && t.UNSAFE_componentWillMount(), os(), s !== t.state && (g("%s.componentWillMount(): Assigning directly to this.state is deprecated (except inside a component's constructor). Use setState instead.", Te(e.type) || "Component"), ky.enqueueReplaceState(t, t.state, null));
    }
    function l0(e, t, s, l) {
      var d = t.state;
      if (ss(e, "componentWillReceiveProps"), typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(s, l), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(s, l), os(), t.state !== d) {
        {
          var p = Te(e.type) || "Component";
          Ty.has(p) || (Ty.add(p), g("%s.componentWillReceiveProps(): Assigning directly to this.state is deprecated (except inside a component's constructor). Use setState instead.", p));
        }
        ky.enqueueReplaceState(t, t.state, null);
      }
    }
    function Py(e, t, s, l) {
      qA(e, t, s);
      var d = e.stateNode;
      d.props = s, d.state = e.memoizedState, d.refs = n0, Sy(e);
      var p = t.contextType;
      if (typeof p == "object" && p !== null)
        d.context = On(p);
      else {
        var y = Jc(e, t, !0);
        d.context = qc(e, y);
      }
      {
        if (d.state === s) {
          var b = Te(t) || "Component";
          Ry.has(b) || (Ry.add(b), g("%s: It is not recommended to assign props directly to state because updates to props won't be reflected in state. In most cases, it is better to use props directly.", b));
        }
        e.mode & gn && pa.recordLegacyContextWarning(e, d), pa.recordUnsafeLifecycleWarnings(e, d);
      }
      xh(e, s, d, l), d.state = e.memoizedState;
      var E = t.getDerivedStateFromProps;
      typeof E == "function" && (Xm(e, t, E, s), d.state = e.memoizedState), typeof t.getDerivedStateFromProps != "function" && typeof d.getSnapshotBeforeUpdate != "function" && (typeof d.UNSAFE_componentWillMount == "function" || typeof d.componentWillMount == "function") && (KA(e, d), xh(e, s, d, l), d.state = e.memoizedState), typeof d.componentDidMount == "function" && (e.effectTag |= Ct);
    }
    function e1(e, t, s, l) {
      var d = e.stateNode, p = e.memoizedProps;
      d.props = p;
      var y = d.context, b = t.contextType, E = pr;
      if (typeof b == "object" && b !== null)
        E = On(b);
      else {
        var N = Jc(e, t, !0);
        E = qc(e, N);
      }
      var k = t.getDerivedStateFromProps, X = typeof k == "function" || typeof d.getSnapshotBeforeUpdate == "function";
      !X && (typeof d.UNSAFE_componentWillReceiveProps == "function" || typeof d.componentWillReceiveProps == "function") && (p !== s || y !== E) && l0(e, d, s, E), e0();
      var L = e.memoizedState, K = d.state = L;
      if (xh(e, s, d, l), K = e.memoizedState, p === s && L === K && !Pm() && !Ym())
        return typeof d.componentDidMount == "function" && (e.effectTag |= Ct), !1;
      typeof k == "function" && (Xm(e, t, k, s), K = e.memoizedState);
      var ve = Ym() || a0(e, t, p, s, L, K, E);
      return ve ? (!X && (typeof d.UNSAFE_componentWillMount == "function" || typeof d.componentWillMount == "function") && (ss(e, "componentWillMount"), typeof d.componentWillMount == "function" && d.componentWillMount(), typeof d.UNSAFE_componentWillMount == "function" && d.UNSAFE_componentWillMount(), os()), typeof d.componentDidMount == "function" && (e.effectTag |= Ct)) : (typeof d.componentDidMount == "function" && (e.effectTag |= Ct), e.memoizedProps = s, e.memoizedState = K), d.props = s, d.state = K, d.context = E, ve;
    }
    function t1(e, t, s, l, d) {
      var p = t.stateNode;
      xy(e, t);
      var y = t.memoizedProps;
      p.props = t.type === t.elementType ? y : ma(t.type, y);
      var b = p.context, E = s.contextType, N = pr;
      if (typeof E == "object" && E !== null)
        N = On(E);
      else {
        var k = Jc(t, s, !0);
        N = qc(t, k);
      }
      var X = s.getDerivedStateFromProps, L = typeof X == "function" || typeof p.getSnapshotBeforeUpdate == "function";
      !L && (typeof p.UNSAFE_componentWillReceiveProps == "function" || typeof p.componentWillReceiveProps == "function") && (y !== l || b !== N) && l0(t, p, l, N), e0();
      var K = t.memoizedState, ve = p.state = K;
      if (xh(t, l, p, d), ve = t.memoizedState, y === l && K === ve && !Pm() && !Ym())
        return typeof p.componentDidUpdate == "function" && (y !== e.memoizedProps || K !== e.memoizedState) && (t.effectTag |= Ct), typeof p.getSnapshotBeforeUpdate == "function" && (y !== e.memoizedProps || K !== e.memoizedState) && (t.effectTag |= Va), !1;
      typeof X == "function" && (Xm(t, s, X, l), ve = t.memoizedState);
      var be = Ym() || a0(t, s, y, l, K, ve, N);
      return be ? (!L && (typeof p.UNSAFE_componentWillUpdate == "function" || typeof p.componentWillUpdate == "function") && (ss(t, "componentWillUpdate"), typeof p.componentWillUpdate == "function" && p.componentWillUpdate(l, ve, N), typeof p.UNSAFE_componentWillUpdate == "function" && p.UNSAFE_componentWillUpdate(l, ve, N), os()), typeof p.componentDidUpdate == "function" && (t.effectTag |= Ct), typeof p.getSnapshotBeforeUpdate == "function" && (t.effectTag |= Va)) : (typeof p.componentDidUpdate == "function" && (y !== e.memoizedProps || K !== e.memoizedState) && (t.effectTag |= Ct), typeof p.getSnapshotBeforeUpdate == "function" && (y !== e.memoizedProps || K !== e.memoizedState) && (t.effectTag |= Va), t.memoizedProps = l, t.memoizedState = ve), p.props = l, p.state = ve, p.context = N, be;
    }
    var _y, zy, Oy, Ly, By, u0 = function(e) {
    };
    _y = !1, zy = !1, Oy = {}, Ly = {}, By = {}, u0 = function(e) {
      if (!(e === null || typeof e != "object") && !(!e._store || e._store.validated || e.key != null)) {
        if (typeof e._store != "object")
          throw Error("React Component in warnForMissingKey should have a _store. This error is likely caused by a bug in React. Please file an issue.");
        e._store.validated = !0;
        var t = 'Each child in a list should have a unique "key" prop. See https://fb.me/react-warning-keys for more information.' + ft();
        Ly[t] || (Ly[t] = !0, g('Each child in a list should have a unique "key" prop. See https://fb.me/react-warning-keys for more information.'));
      }
    };
    var Jm = Array.isArray;
    function Th(e, t, s) {
      var l = s.ref;
      if (l !== null && typeof l != "function" && typeof l != "object") {
        if ((e.mode & gn || Jn) && !(s._owner && s._self && s._owner.stateNode !== s._self)) {
          var d = Te(e.type) || "Component";
          Oy[d] || (g('A string ref, "%s", has been found within a strict mode tree. String refs are a source of potential bugs and should be avoided. We recommend using useRef() or createRef() instead. Learn more about using refs safely here: https://fb.me/react-strict-mode-string-ref%s', l, Fn(e)), Oy[d] = !0);
        }
        if (s._owner) {
          var p = s._owner, y;
          if (p) {
            var b = p;
            if (b.tag !== xe)
              throw Error("Function components cannot have string refs. We recommend using useRef() instead. Learn more about using refs safely here: https://fb.me/react-strict-mode-string-ref");
            y = b.stateNode;
          }
          if (!y)
            throw Error("Missing owner for string ref " + l + ". This error is likely caused by a bug in React. Please file an issue.");
          var E = "" + l;
          if (t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === E)
            return t.ref;
          var N = function(k) {
            var X = y.refs;
            X === n0 && (X = y.refs = {}), k === null ? delete X[E] : X[E] = k;
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
    function qm(e, t) {
      if (e.type !== "textarea") {
        var s = "";
        throw s = " If you meant to render a collection of children, use an array instead." + ft(), Error("Objects are not valid as a React child (found: " + (Object.prototype.toString.call(t) === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : t) + ")." + s);
      }
    }
    function Km() {
      {
        var e = "Functions are not valid as a React child. This may happen if you return a Component instead of <Component /> from render. Or maybe you meant to call this function rather than return it." + ft();
        if (By[e])
          return;
        By[e] = !0, g("Functions are not valid as a React child. This may happen if you return a Component instead of <Component /> from render. Or maybe you meant to call this function rather than return it.");
      }
    }
    function c0(e) {
      function t(W, te) {
        if (!!e) {
          var j = W.lastEffect;
          j !== null ? (j.nextEffect = te, W.lastEffect = te) : W.firstEffect = W.lastEffect = te, te.nextEffect = null, te.effectTag = Us;
        }
      }
      function s(W, te) {
        if (!e)
          return null;
        for (var j = te; j !== null; )
          t(W, j), j = j.sibling;
        return null;
      }
      function l(W, te) {
        for (var j = /* @__PURE__ */ new Map(), ge = te; ge !== null; )
          ge.key !== null ? j.set(ge.key, ge) : j.set(ge.index, ge), ge = ge.sibling;
        return j;
      }
      function d(W, te) {
        var j = Eu(W, te);
        return j.index = 0, j.sibling = null, j;
      }
      function p(W, te, j) {
        if (W.index = j, !e)
          return te;
        var ge = W.alternate;
        if (ge !== null) {
          var pe = ge.index;
          return pe < te ? (W.effectTag = Sn, te) : pe;
        } else
          return W.effectTag = Sn, te;
      }
      function y(W) {
        return e && W.alternate === null && (W.effectTag = Sn), W;
      }
      function b(W, te, j, ge) {
        if (te === null || te.tag !== $e) {
          var pe = qw(j, W.mode, ge);
          return pe.return = W, pe;
        } else {
          var Ee = d(te, j);
          return Ee.return = W, Ee;
        }
      }
      function E(W, te, j, ge) {
        if (te !== null && (te.elementType === j.type || $x(te, j))) {
          var pe = d(te, j.props);
          return pe.ref = Th(W, te, j), pe.return = W, pe._debugSource = j._source, pe._debugOwner = j._owner, pe;
        }
        var Ee = Jw(j, W.mode, ge);
        return Ee.ref = Th(W, te, j), Ee.return = W, Ee;
      }
      function N(W, te, j, ge) {
        if (te === null || te.tag !== Ve || te.stateNode.containerInfo !== j.containerInfo || te.stateNode.implementation !== j.implementation) {
          var pe = Kw(j, W.mode, ge);
          return pe.return = W, pe;
        } else {
          var Ee = d(te, j.children || []);
          return Ee.return = W, Ee;
        }
      }
      function k(W, te, j, ge, pe) {
        if (te === null || te.tag !== bt) {
          var Ee = il(j, W.mode, ge, pe);
          return Ee.return = W, Ee;
        } else {
          var gt = d(te, j);
          return gt.return = W, gt;
        }
      }
      function X(W, te, j) {
        if (typeof te == "string" || typeof te == "number") {
          var ge = qw("" + te, W.mode, j);
          return ge.return = W, ge;
        }
        if (typeof te == "object" && te !== null) {
          switch (te.$$typeof) {
            case Se: {
              var pe = Jw(te, W.mode, j);
              return pe.ref = Th(W, null, te), pe.return = W, pe;
            }
            case Ye: {
              var Ee = Kw(te, W.mode, j);
              return Ee.return = W, Ee;
            }
          }
          if (Jm(te) || Rr(te)) {
            var gt = il(te, W.mode, j, null);
            return gt.return = W, gt;
          }
          qm(W, te);
        }
        return typeof te == "function" && Km(), null;
      }
      function L(W, te, j, ge) {
        var pe = te !== null ? te.key : null;
        if (typeof j == "string" || typeof j == "number")
          return pe !== null ? null : b(W, te, "" + j, ge);
        if (typeof j == "object" && j !== null) {
          switch (j.$$typeof) {
            case Se:
              return j.key === pe ? j.type === Be ? k(W, te, j.props.children, ge, pe) : E(W, te, j, ge) : null;
            case Ye:
              return j.key === pe ? N(W, te, j, ge) : null;
          }
          if (Jm(j) || Rr(j))
            return pe !== null ? null : k(W, te, j, ge, null);
          qm(W, j);
        }
        return typeof j == "function" && Km(), null;
      }
      function K(W, te, j, ge, pe) {
        if (typeof ge == "string" || typeof ge == "number") {
          var Ee = W.get(j) || null;
          return b(te, Ee, "" + ge, pe);
        }
        if (typeof ge == "object" && ge !== null) {
          switch (ge.$$typeof) {
            case Se: {
              var gt = W.get(ge.key === null ? j : ge.key) || null;
              return ge.type === Be ? k(te, gt, ge.props.children, pe, ge.key) : E(te, gt, ge, pe);
            }
            case Ye: {
              var At = W.get(ge.key === null ? j : ge.key) || null;
              return N(te, At, ge, pe);
            }
          }
          if (Jm(ge) || Rr(ge)) {
            var Vt = W.get(j) || null;
            return k(te, Vt, ge, pe, null);
          }
          qm(te, ge);
        }
        return typeof ge == "function" && Km(), null;
      }
      function ve(W, te) {
        {
          if (typeof W != "object" || W === null)
            return te;
          switch (W.$$typeof) {
            case Se:
            case Ye:
              u0(W);
              var j = W.key;
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
      function be(W, te, j, ge) {
        for (var pe = null, Ee = 0; Ee < j.length; Ee++) {
          var gt = j[Ee];
          pe = ve(gt, pe);
        }
        for (var At = null, Vt = null, Rt = te, Ot = 0, Dt = 0, un = null; Rt !== null && Dt < j.length; Dt++) {
          Rt.index > Dt ? (un = Rt, Rt = null) : un = Rt.sibling;
          var En = L(W, Rt, j[Dt], ge);
          if (En === null) {
            Rt === null && (Rt = un);
            break;
          }
          e && Rt && En.alternate === null && t(W, Rt), Ot = p(En, Ot, Dt), Vt === null ? At = En : Vt.sibling = En, Vt = En, Rt = un;
        }
        if (Dt === j.length)
          return s(W, Rt), At;
        if (Rt === null) {
          for (; Dt < j.length; Dt++) {
            var In = X(W, j[Dt], ge);
            In !== null && (Ot = p(In, Ot, Dt), Vt === null ? At = In : Vt.sibling = In, Vt = In);
          }
          return At;
        }
        for (var yi = l(W, Rt); Dt < j.length; Dt++) {
          var tn = K(yi, W, Dt, j[Dt], ge);
          tn !== null && (e && tn.alternate !== null && yi.delete(tn.key === null ? Dt : tn.key), Ot = p(tn, Ot, Dt), Vt === null ? At = tn : Vt.sibling = tn, Vt = tn);
        }
        return e && yi.forEach(function(Oi) {
          return t(W, Oi);
        }), At;
      }
      function qe(W, te, j, ge) {
        var pe = Rr(j);
        if (typeof pe != "function")
          throw Error("An object is not an iterable. This error is likely caused by a bug in React. Please file an issue.");
        {
          typeof Symbol == "function" && j[Symbol.toStringTag] === "Generator" && (zy || g("Using Generators as children is unsupported and will likely yield unexpected results because enumerating a generator mutates it. You may convert it to an array with `Array.from()` or the `[...spread]` operator before rendering. Keep in mind you might need to polyfill these features for older browsers."), zy = !0), j.entries === pe && (_y || g("Using Maps as children is unsupported and will likely yield unexpected results. Convert it to a sequence/iterable of keyed ReactElements instead."), _y = !0);
          var Ee = pe.call(j);
          if (Ee)
            for (var gt = null, At = Ee.next(); !At.done; At = Ee.next()) {
              var Vt = At.value;
              gt = ve(Vt, gt);
            }
        }
        var Rt = pe.call(j);
        if (Rt == null)
          throw Error("An iterable object provided no iterator.");
        for (var Ot = null, Dt = null, un = te, En = 0, In = 0, yi = null, tn = Rt.next(); un !== null && !tn.done; In++, tn = Rt.next()) {
          un.index > In ? (yi = un, un = null) : yi = un.sibling;
          var Oi = L(W, un, tn.value, ge);
          if (Oi === null) {
            un === null && (un = yi);
            break;
          }
          e && un && Oi.alternate === null && t(W, un), En = p(Oi, En, In), Dt === null ? Ot = Oi : Dt.sibling = Oi, Dt = Oi, un = yi;
        }
        if (tn.done)
          return s(W, un), Ot;
        if (un === null) {
          for (; !tn.done; In++, tn = Rt.next()) {
            var wa = X(W, tn.value, ge);
            wa !== null && (En = p(wa, En, In), Dt === null ? Ot = wa : Dt.sibling = wa, Dt = wa);
          }
          return Ot;
        }
        for (var sb = l(W, un); !tn.done; In++, tn = Rt.next()) {
          var rl = K(sb, W, In, tn.value, ge);
          rl !== null && (e && rl.alternate !== null && sb.delete(rl.key === null ? In : rl.key), En = p(rl, En, In), Dt === null ? Ot = rl : Dt.sibling = rl, Dt = rl);
        }
        return e && sb.forEach(function(jD) {
          return t(W, jD);
        }), Ot;
      }
      function nt(W, te, j, ge) {
        if (te !== null && te.tag === $e) {
          s(W, te.sibling);
          var pe = d(te, j);
          return pe.return = W, pe;
        }
        s(W, te);
        var Ee = qw(j, W.mode, ge);
        return Ee.return = W, Ee;
      }
      function zt(W, te, j, ge) {
        for (var pe = j.key, Ee = te; Ee !== null; ) {
          if (Ee.key === pe) {
            switch (Ee.tag) {
              case bt: {
                if (j.type === Be) {
                  s(W, Ee.sibling);
                  var gt = d(Ee, j.props.children);
                  return gt.return = W, gt._debugSource = j._source, gt._debugOwner = j._owner, gt;
                }
                break;
              }
              case St:
              default: {
                if (Ee.elementType === j.type || $x(Ee, j)) {
                  s(W, Ee.sibling);
                  var At = d(Ee, j.props);
                  return At.ref = Th(W, Ee, j), At.return = W, At._debugSource = j._source, At._debugOwner = j._owner, At;
                }
                break;
              }
            }
            s(W, Ee);
            break;
          } else
            t(W, Ee);
          Ee = Ee.sibling;
        }
        if (j.type === Be) {
          var Vt = il(j.props.children, W.mode, ge, j.key);
          return Vt.return = W, Vt;
        } else {
          var Rt = Jw(j, W.mode, ge);
          return Rt.ref = Th(W, te, j), Rt.return = W, Rt;
        }
      }
      function vt(W, te, j, ge) {
        for (var pe = j.key, Ee = te; Ee !== null; ) {
          if (Ee.key === pe)
            if (Ee.tag === Ve && Ee.stateNode.containerInfo === j.containerInfo && Ee.stateNode.implementation === j.implementation) {
              s(W, Ee.sibling);
              var gt = d(Ee, j.children || []);
              return gt.return = W, gt;
            } else {
              s(W, Ee);
              break;
            }
          else
            t(W, Ee);
          Ee = Ee.sibling;
        }
        var At = Kw(j, W.mode, ge);
        return At.return = W, At;
      }
      function Qt(W, te, j, ge) {
        var pe = typeof j == "object" && j !== null && j.type === Be && j.key === null;
        pe && (j = j.props.children);
        var Ee = typeof j == "object" && j !== null;
        if (Ee)
          switch (j.$$typeof) {
            case Se:
              return y(zt(W, te, j, ge));
            case Ye:
              return y(vt(W, te, j, ge));
          }
        if (typeof j == "string" || typeof j == "number")
          return y(nt(W, te, "" + j, ge));
        if (Jm(j))
          return be(W, te, j, ge);
        if (Rr(j))
          return qe(W, te, j, ge);
        if (Ee && qm(W, j), typeof j == "function" && Km(), typeof j > "u" && !pe)
          switch (W.tag) {
            case xe: {
              var gt = W.stateNode;
              if (gt.render._isMockFunction)
                break;
            }
            case fe: {
              var At = W.type;
              throw Error((At.displayName || At.name || "Component") + "(...): Nothing was returned from render. This usually means a return statement is missing. Or, to render nothing, return null.");
            }
          }
        return s(W, te);
      }
      return Qt;
    }
    var sd = c0(!0), jy = c0(!1);
    function n1(e, t) {
      if (!(e === null || t.child === e.child))
        throw Error("Resuming work not yet implemented.");
      if (t.child !== null) {
        var s = t.child, l = Eu(s, s.pendingProps);
        for (t.child = l, l.return = t; s.sibling !== null; )
          s = s.sibling, l = l.sibling = Eu(s, s.pendingProps), l.return = t;
        l.sibling = null;
      }
    }
    function i1(e, t) {
      for (var s = e.child; s !== null; )
        sD(s, t), s = s.sibling;
    }
    var Mh = {}, Jo = lu(Mh), Eh = lu(Mh), ev = lu(Mh);
    function tv(e) {
      if (e === Mh)
        throw Error("Expected host context to exist. This error is likely caused by a bug in React. Please file an issue.");
      return e;
    }
    function d0() {
      var e = tv(ev.current);
      return e;
    }
    function Uy(e, t) {
      _i(ev, t, e), _i(Eh, e, e), _i(Jo, Mh, e);
      var s = Bg(t);
      Pi(Jo, e), _i(Jo, s, e);
    }
    function od(e) {
      Pi(Jo, e), Pi(Eh, e), Pi(ev, e);
    }
    function Vy() {
      var e = tv(Jo.current);
      return e;
    }
    function f0(e) {
      tv(ev.current);
      var t = tv(Jo.current), s = bm(t, e.type);
      t !== s && (_i(Eh, e, e), _i(Jo, s, e));
    }
    function Hy(e) {
      Eh.current === e && (Pi(Jo, e), Pi(Eh, e));
    }
    var r1 = 0, h0 = 1, Wy = 1, Ih = 2, va = lu(r1);
    function nv(e, t) {
      return (e & t) !== 0;
    }
    function Ah(e) {
      return e & h0;
    }
    function Fy(e, t) {
      return e & h0 | t;
    }
    function a1(e, t) {
      return e | t;
    }
    function hu(e, t) {
      _i(va, t, e);
    }
    function ld(e) {
      Pi(va, e);
    }
    function s1(e, t) {
      var s = e.memoizedState;
      if (s !== null)
        return s.dehydrated !== null;
      var l = e.memoizedProps;
      return l.fallback === void 0 ? !1 : l.unstable_avoidThisFallback !== !0 ? !0 : !t;
    }
    function iv(e) {
      for (var t = e; t !== null; ) {
        if (t.tag === ee) {
          var s = t.memoizedState;
          if (s !== null) {
            var l = s.dehydrated;
            if (l === null || WE(l) || FE(l))
              return t;
          }
        } else if (t.tag === dt && t.memoizedProps.revealOrder !== void 0) {
          var d = (t.effectTag & jt) !== _t;
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
    function pu(e, t) {
      var s = {
        responder: e,
        props: t
      };
      return Object.freeze(s), s;
    }
    var ud = 1, cd = 2, rv = 4, Re = m.ReactCurrentDispatcher, Wr = m.ReactCurrentBatchConfig, $y;
    $y = /* @__PURE__ */ new Set();
    var qo = De, xn = null, gi = null, oi = null, av = !1, o1 = 25, ae = null, Fr = null, Ko = -1, Qy = !1;
    function en() {
      {
        var e = ae;
        Fr === null ? Fr = [e] : Fr.push(e);
      }
    }
    function _e() {
      {
        var e = ae;
        Fr !== null && (Ko++, Fr[Ko] !== e && l1(e));
      }
    }
    function Rh(e) {
      e != null && !Array.isArray(e) && g("%s received a final argument that is not an array (instead, received `%s`). When specified, the final argument must be an array.", ae, typeof e);
    }
    function l1(e) {
      {
        var t = Te(xn.type);
        if (!$y.has(t) && ($y.add(t), Fr !== null)) {
          for (var s = "", l = 30, d = 0; d <= Ko; d++) {
            for (var p = Fr[d], y = d === Ko ? e : p, b = d + 1 + ". " + p; b.length < l; )
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
    function vr() {
      throw Error(`Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
1. You might have mismatching versions of React and the renderer (such as React DOM)
2. You might be breaking the Rules of Hooks
3. You might have more than one copy of React in the same app
See https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem.`);
    }
    function Zy(e, t) {
      if (Qy)
        return !1;
      if (t === null)
        return g("%s received a final argument during this render, but not during the previous render. Even though the final argument is optional, its type cannot change between renders.", ae), !1;
      e.length !== t.length && g(`The final argument passed to %s changed size between renders. The order and size of this array must remain constant.

Previous: %s
Incoming: %s`, ae, "[" + t.join(", ") + "]", "[" + e.join(", ") + "]");
      for (var s = 0; s < t.length && s < e.length; s++)
        if (!au(e[s], t[s]))
          return !1;
      return !0;
    }
    function dd(e, t, s, l, d, p) {
      qo = p, xn = t, Fr = e !== null ? e._debugHookTypes : null, Ko = -1, Qy = e !== null && e.type !== t.type, t.memoizedState = null, t.updateQueue = null, t.expirationTime = De, e !== null && e.memoizedState !== null ? Re.current = T0 : Fr !== null ? Re.current = C0 : Re.current = x0;
      var y = s(l, d);
      if (t.expirationTime === qo) {
        var b = 0;
        do {
          if (t.expirationTime = De, !(b < o1))
            throw Error("Too many re-renders. React limits the number of renders to prevent an infinite loop.");
          b += 1, Qy = !1, gi = null, oi = null, t.updateQueue = null, Ko = -1, Re.current = M0, y = s(l, d);
        } while (t.expirationTime === qo);
      }
      Re.current = mv, t._debugHookTypes = Fr;
      var E = gi !== null && gi.next !== null;
      if (qo = De, xn = null, gi = null, oi = null, ae = null, Fr = null, Ko = -1, av = !1, E)
        throw Error("Rendered fewer hooks than expected. This may be caused by an accidental early return statement.");
      return y;
    }
    function p0(e, t, s) {
      t.updateQueue = e.updateQueue, t.effectTag &= ~(Ha | Ct), e.expirationTime <= s && (e.expirationTime = De);
    }
    function m0() {
      if (Re.current = mv, av)
        for (var e = xn.memoizedState; e !== null; ) {
          var t = e.queue;
          t !== null && (t.pending = null), e = e.next;
        }
      qo = De, xn = null, gi = null, oi = null, Fr = null, Ko = -1, ae = null, av = !1;
    }
    function fd() {
      var e = {
        memoizedState: null,
        baseState: null,
        baseQueue: null,
        queue: null,
        next: null
      };
      return oi === null ? xn.memoizedState = oi = e : oi = oi.next = e, oi;
    }
    function hd() {
      var e;
      if (gi === null) {
        var t = xn.alternate;
        t !== null ? e = t.memoizedState : e = null;
      } else
        e = gi.next;
      var s;
      if (oi === null ? s = xn.memoizedState : s = oi.next, s !== null)
        oi = s, s = oi.next, gi = e;
      else {
        if (e === null)
          throw Error("Rendered more hooks than during the previous render.");
        gi = e;
        var l = {
          memoizedState: gi.memoizedState,
          baseState: gi.baseState,
          baseQueue: gi.baseQueue,
          queue: gi.queue,
          next: null
        };
        oi === null ? xn.memoizedState = oi = l : oi = oi.next = l;
      }
      return oi;
    }
    function u1() {
      return {
        lastEffect: null
      };
    }
    function Yy(e, t) {
      return typeof t == "function" ? t(e) : t;
    }
    function Gy(e, t, s) {
      var l = fd(), d;
      s !== void 0 ? d = s(t) : d = t, l.memoizedState = l.baseState = d;
      var p = l.queue = {
        pending: null,
        dispatch: null,
        lastRenderedReducer: e,
        lastRenderedState: d
      }, y = p.dispatch = S0.bind(null, xn, p);
      return [l.memoizedState, y];
    }
    function Xy(e, t, s) {
      var l = hd(), d = l.queue;
      if (d === null)
        throw Error("Should have a queue. This is likely a bug in React. Please file an issue.");
      d.lastRenderedReducer = e;
      var p = gi, y = p.baseQueue, b = d.pending;
      if (b !== null) {
        if (y !== null) {
          var E = y.next, N = b.next;
          y.next = N, b.next = E;
        }
        p.baseQueue = y = b, d.pending = null;
      }
      if (y !== null) {
        var k = y.next, X = p.baseState, L = null, K = null, ve = null, be = k;
        do {
          var qe = be.expirationTime;
          if (qe < qo) {
            var nt = {
              expirationTime: be.expirationTime,
              suspenseConfig: be.suspenseConfig,
              action: be.action,
              eagerReducer: be.eagerReducer,
              eagerState: be.eagerState,
              next: null
            };
            ve === null ? (K = ve = nt, L = X) : ve = ve.next = nt, qe > xn.expirationTime && (xn.expirationTime = qe, zv(qe));
          } else {
            if (ve !== null) {
              var zt = {
                expirationTime: Tt,
                suspenseConfig: be.suspenseConfig,
                action: be.action,
                eagerReducer: be.eagerReducer,
                eagerState: be.eagerState,
                next: null
              };
              ve = ve.next = zt;
            }
            if (bC(qe, be.suspenseConfig), be.eagerReducer === e)
              X = be.eagerState;
            else {
              var vt = be.action;
              X = e(X, vt);
            }
          }
          be = be.next;
        } while (be !== null && be !== k);
        ve === null ? L = X : ve.next = K, au(X, l.memoizedState) || Cw(), l.memoizedState = X, l.baseState = L, l.baseQueue = ve, d.lastRenderedState = X;
      }
      var Qt = d.dispatch;
      return [l.memoizedState, Qt];
    }
    function Jy(e, t, s) {
      var l = hd(), d = l.queue;
      if (d === null)
        throw Error("Should have a queue. This is likely a bug in React. Please file an issue.");
      d.lastRenderedReducer = e;
      var p = d.dispatch, y = d.pending, b = l.memoizedState;
      if (y !== null) {
        d.pending = null;
        var E = y.next, N = E;
        do {
          var k = N.action;
          b = e(b, k), N = N.next;
        } while (N !== E);
        au(b, l.memoizedState) || Cw(), l.memoizedState = b, l.baseQueue === null && (l.baseState = b), d.lastRenderedState = b;
      }
      return [b, p];
    }
    function Dh(e) {
      var t = fd();
      typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e;
      var s = t.queue = {
        pending: null,
        dispatch: null,
        lastRenderedReducer: Yy,
        lastRenderedState: e
      }, l = s.dispatch = S0.bind(null, xn, s);
      return [t.memoizedState, l];
    }
    function sv(e) {
      return Xy(Yy);
    }
    function ov(e) {
      return Jy(Yy);
    }
    function qy(e, t, s, l) {
      var d = {
        tag: e,
        create: t,
        destroy: s,
        deps: l,
        next: null
      }, p = xn.updateQueue;
      if (p === null)
        p = u1(), xn.updateQueue = p, p.lastEffect = d.next = d;
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
    function Ky(e) {
      var t = fd(), s = {
        current: e
      };
      return Object.seal(s), t.memoizedState = s, s;
    }
    function lv(e) {
      var t = hd();
      return t.memoizedState;
    }
    function ew(e, t, s, l) {
      var d = fd(), p = l === void 0 ? null : l;
      xn.effectTag |= e, d.memoizedState = qy(ud | t, s, void 0, p);
    }
    function tw(e, t, s, l) {
      var d = hd(), p = l === void 0 ? null : l, y = void 0;
      if (gi !== null) {
        var b = gi.memoizedState;
        if (y = b.destroy, p !== null) {
          var E = b.deps;
          if (Zy(p, E)) {
            qy(t, s, y, p);
            return;
          }
        }
      }
      xn.effectTag |= e, d.memoizedState = qy(ud | t, s, y, p);
    }
    function uv(e, t) {
      return typeof jest < "u" && AC(xn), ew(Ct | Ha, rv, e, t);
    }
    function pd(e, t) {
      return typeof jest < "u" && AC(xn), tw(Ct | Ha, rv, e, t);
    }
    function nw(e, t) {
      return ew(Ct, cd, e, t);
    }
    function cv(e, t) {
      return tw(Ct, cd, e, t);
    }
    function v0(e, t) {
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
    function iw(e, t, s) {
      typeof t != "function" && g("Expected useImperativeHandle() second argument to be a function that creates a handle. Instead received: %s.", t !== null ? typeof t : "null");
      var l = s != null ? s.concat([e]) : null;
      return ew(Ct, cd, v0.bind(null, t, e), l);
    }
    function dv(e, t, s) {
      typeof t != "function" && g("Expected useImperativeHandle() second argument to be a function that creates a handle. Instead received: %s.", t !== null ? typeof t : "null");
      var l = s != null ? s.concat([e]) : null;
      return tw(Ct, cd, v0.bind(null, t, e), l);
    }
    function c1(e, t) {
    }
    var fv = c1;
    function hv(e, t) {
      var s = fd(), l = t === void 0 ? null : t;
      return s.memoizedState = [e, l], e;
    }
    function md(e, t) {
      var s = hd(), l = t === void 0 ? null : t, d = s.memoizedState;
      if (d !== null && l !== null) {
        var p = d[1];
        if (Zy(l, p))
          return d[0];
      }
      return s.memoizedState = [e, l], e;
    }
    function rw(e, t) {
      var s = fd(), l = t === void 0 ? null : t, d = e();
      return s.memoizedState = [d, l], d;
    }
    function pv(e, t) {
      var s = hd(), l = t === void 0 ? null : t, d = s.memoizedState;
      if (d !== null && l !== null) {
        var p = d[1];
        if (Zy(l, p))
          return d[0];
      }
      var y = e();
      return s.memoizedState = [y, l], y;
    }
    function aw(e, t) {
      var s = Dh(e), l = s[0], d = s[1];
      return uv(function() {
        var p = Wr.suspense;
        Wr.suspense = t === void 0 ? null : t;
        try {
          d(e);
        } finally {
          Wr.suspense = p;
        }
      }, [e, t]), l;
    }
    function g0(e, t) {
      var s = sv(), l = s[0], d = s[1];
      return pd(function() {
        var p = Wr.suspense;
        Wr.suspense = t === void 0 ? null : t;
        try {
          d(e);
        } finally {
          Wr.suspense = p;
        }
      }, [e, t]), l;
    }
    function y0(e, t) {
      var s = ov(), l = s[0], d = s[1];
      return pd(function() {
        var p = Wr.suspense;
        Wr.suspense = t === void 0 ? null : t;
        try {
          d(e);
        } finally {
          Wr.suspense = p;
        }
      }, [e, t]), l;
    }
    function sw(e, t, s) {
      var l = ed();
      co(l < Yo ? Yo : l, function() {
        e(!0);
      }), co(l > ha ? ha : l, function() {
        var d = Wr.suspense;
        Wr.suspense = t === void 0 ? null : t;
        try {
          e(!1), s();
        } finally {
          Wr.suspense = d;
        }
      });
    }
    function ow(e) {
      var t = Dh(!1), s = t[0], l = t[1], d = hv(sw.bind(null, l, e), [l, e]);
      return [d, s];
    }
    function w0(e) {
      var t = sv(), s = t[0], l = t[1], d = md(sw.bind(null, l, e), [l, e]);
      return [d, s];
    }
    function b0(e) {
      var t = ov(), s = t[0], l = t[1], d = md(sw.bind(null, l, e), [l, e]);
      return [d, s];
    }
    function S0(e, t, s) {
      typeof arguments[3] == "function" && g("State updates from the useState() and useReducer() Hooks don't support the second callback argument. To execute a side effect after rendering, declare it in the component body with useEffect().");
      var l = ms(), d = Ch(), p = Su(l, e, d), y = {
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
      if (e === xn || E !== null && E === xn)
        av = !0, y.expirationTime = qo, xn.expirationTime = qo;
      else {
        if (e.expirationTime === De && (E === null || E.expirationTime === De)) {
          var N = t.lastRenderedReducer;
          if (N !== null) {
            var k;
            k = Re.current, Re.current = ga;
            try {
              var X = t.lastRenderedState, L = N(X, s);
              if (y.eagerReducer = N, y.eagerState = L, au(L, X))
                return;
            } catch {
            } finally {
              Re.current = k;
            }
          }
        }
        typeof jest < "u" && (IC(e), ZR(e)), Qr(e, p);
      }
    }
    var mv = {
      readContext: On,
      useCallback: vr,
      useContext: vr,
      useEffect: vr,
      useImperativeHandle: vr,
      useLayoutEffect: vr,
      useMemo: vr,
      useReducer: vr,
      useRef: vr,
      useState: vr,
      useDebugValue: vr,
      useResponder: vr,
      useDeferredValue: vr,
      useTransition: vr
    }, x0 = null, C0 = null, T0 = null, M0 = null, hs = null, ga = null, vv = null;
    {
      var lw = function() {
        g("Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo().");
      }, ht = function() {
        g("Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. You can only call Hooks at the top level of your React function. For more information, see https://fb.me/rules-of-hooks");
      };
      x0 = {
        readContext: function(e, t) {
          return On(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", en(), Rh(t), hv(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", en(), On(e, t);
        },
        useEffect: function(e, t) {
          return ae = "useEffect", en(), Rh(t), uv(e, t);
        },
        useImperativeHandle: function(e, t, s) {
          return ae = "useImperativeHandle", en(), Rh(s), iw(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", en(), Rh(t), nw(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", en(), Rh(t);
          var s = Re.current;
          Re.current = hs;
          try {
            return rw(e, t);
          } finally {
            Re.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", en();
          var l = Re.current;
          Re.current = hs;
          try {
            return Gy(e, t, s);
          } finally {
            Re.current = l;
          }
        },
        useRef: function(e) {
          return ae = "useRef", en(), Ky(e);
        },
        useState: function(e) {
          ae = "useState", en();
          var t = Re.current;
          Re.current = hs;
          try {
            return Dh(e);
          } finally {
            Re.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return ae = "useDebugValue", en(), void 0;
        },
        useResponder: function(e, t) {
          return ae = "useResponder", en(), pu(e, t);
        },
        useDeferredValue: function(e, t) {
          return ae = "useDeferredValue", en(), aw(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", en(), ow(e);
        }
      }, C0 = {
        readContext: function(e, t) {
          return On(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", _e(), hv(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", _e(), On(e, t);
        },
        useEffect: function(e, t) {
          return ae = "useEffect", _e(), uv(e, t);
        },
        useImperativeHandle: function(e, t, s) {
          return ae = "useImperativeHandle", _e(), iw(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", _e(), nw(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", _e();
          var s = Re.current;
          Re.current = hs;
          try {
            return rw(e, t);
          } finally {
            Re.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", _e();
          var l = Re.current;
          Re.current = hs;
          try {
            return Gy(e, t, s);
          } finally {
            Re.current = l;
          }
        },
        useRef: function(e) {
          return ae = "useRef", _e(), Ky(e);
        },
        useState: function(e) {
          ae = "useState", _e();
          var t = Re.current;
          Re.current = hs;
          try {
            return Dh(e);
          } finally {
            Re.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return ae = "useDebugValue", _e(), void 0;
        },
        useResponder: function(e, t) {
          return ae = "useResponder", _e(), pu(e, t);
        },
        useDeferredValue: function(e, t) {
          return ae = "useDeferredValue", _e(), aw(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", _e(), ow(e);
        }
      }, T0 = {
        readContext: function(e, t) {
          return On(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", _e(), md(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", _e(), On(e, t);
        },
        useEffect: function(e, t) {
          return ae = "useEffect", _e(), pd(e, t);
        },
        useImperativeHandle: function(e, t, s) {
          return ae = "useImperativeHandle", _e(), dv(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", _e(), cv(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", _e();
          var s = Re.current;
          Re.current = ga;
          try {
            return pv(e, t);
          } finally {
            Re.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", _e();
          var l = Re.current;
          Re.current = ga;
          try {
            return Xy(e, t, s);
          } finally {
            Re.current = l;
          }
        },
        useRef: function(e) {
          return ae = "useRef", _e(), lv();
        },
        useState: function(e) {
          ae = "useState", _e();
          var t = Re.current;
          Re.current = ga;
          try {
            return sv(e);
          } finally {
            Re.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return ae = "useDebugValue", _e(), fv();
        },
        useResponder: function(e, t) {
          return ae = "useResponder", _e(), pu(e, t);
        },
        useDeferredValue: function(e, t) {
          return ae = "useDeferredValue", _e(), g0(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", _e(), w0(e);
        }
      }, M0 = {
        readContext: function(e, t) {
          return On(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", _e(), md(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", _e(), On(e, t);
        },
        useEffect: function(e, t) {
          return ae = "useEffect", _e(), pd(e, t);
        },
        useImperativeHandle: function(e, t, s) {
          return ae = "useImperativeHandle", _e(), dv(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", _e(), cv(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", _e();
          var s = Re.current;
          Re.current = vv;
          try {
            return pv(e, t);
          } finally {
            Re.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", _e();
          var l = Re.current;
          Re.current = vv;
          try {
            return Jy(e, t, s);
          } finally {
            Re.current = l;
          }
        },
        useRef: function(e) {
          return ae = "useRef", _e(), lv();
        },
        useState: function(e) {
          ae = "useState", _e();
          var t = Re.current;
          Re.current = vv;
          try {
            return ov(e);
          } finally {
            Re.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return ae = "useDebugValue", _e(), fv();
        },
        useResponder: function(e, t) {
          return ae = "useResponder", _e(), pu(e, t);
        },
        useDeferredValue: function(e, t) {
          return ae = "useDeferredValue", _e(), y0(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", _e(), b0(e);
        }
      }, hs = {
        readContext: function(e, t) {
          return lw(), On(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", ht(), en(), hv(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", ht(), en(), On(e, t);
        },
        useEffect: function(e, t) {
          return ae = "useEffect", ht(), en(), uv(e, t);
        },
        useImperativeHandle: function(e, t, s) {
          return ae = "useImperativeHandle", ht(), en(), iw(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", ht(), en(), nw(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", ht(), en();
          var s = Re.current;
          Re.current = hs;
          try {
            return rw(e, t);
          } finally {
            Re.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", ht(), en();
          var l = Re.current;
          Re.current = hs;
          try {
            return Gy(e, t, s);
          } finally {
            Re.current = l;
          }
        },
        useRef: function(e) {
          return ae = "useRef", ht(), en(), Ky(e);
        },
        useState: function(e) {
          ae = "useState", ht(), en();
          var t = Re.current;
          Re.current = hs;
          try {
            return Dh(e);
          } finally {
            Re.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return ae = "useDebugValue", ht(), en(), void 0;
        },
        useResponder: function(e, t) {
          return ae = "useResponder", ht(), en(), pu(e, t);
        },
        useDeferredValue: function(e, t) {
          return ae = "useDeferredValue", ht(), en(), aw(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", ht(), en(), ow(e);
        }
      }, ga = {
        readContext: function(e, t) {
          return lw(), On(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", ht(), _e(), md(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", ht(), _e(), On(e, t);
        },
        useEffect: function(e, t) {
          return ae = "useEffect", ht(), _e(), pd(e, t);
        },
        useImperativeHandle: function(e, t, s) {
          return ae = "useImperativeHandle", ht(), _e(), dv(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", ht(), _e(), cv(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", ht(), _e();
          var s = Re.current;
          Re.current = ga;
          try {
            return pv(e, t);
          } finally {
            Re.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", ht(), _e();
          var l = Re.current;
          Re.current = ga;
          try {
            return Xy(e, t, s);
          } finally {
            Re.current = l;
          }
        },
        useRef: function(e) {
          return ae = "useRef", ht(), _e(), lv();
        },
        useState: function(e) {
          ae = "useState", ht(), _e();
          var t = Re.current;
          Re.current = ga;
          try {
            return sv(e);
          } finally {
            Re.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return ae = "useDebugValue", ht(), _e(), fv();
        },
        useResponder: function(e, t) {
          return ae = "useResponder", ht(), _e(), pu(e, t);
        },
        useDeferredValue: function(e, t) {
          return ae = "useDeferredValue", ht(), _e(), g0(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", ht(), _e(), w0(e);
        }
      }, vv = {
        readContext: function(e, t) {
          return lw(), On(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", ht(), _e(), md(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", ht(), _e(), On(e, t);
        },
        useEffect: function(e, t) {
          return ae = "useEffect", ht(), _e(), pd(e, t);
        },
        useImperativeHandle: function(e, t, s) {
          return ae = "useImperativeHandle", ht(), _e(), dv(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", ht(), _e(), cv(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", ht(), _e();
          var s = Re.current;
          Re.current = ga;
          try {
            return pv(e, t);
          } finally {
            Re.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", ht(), _e();
          var l = Re.current;
          Re.current = ga;
          try {
            return Jy(e, t, s);
          } finally {
            Re.current = l;
          }
        },
        useRef: function(e) {
          return ae = "useRef", ht(), _e(), lv();
        },
        useState: function(e) {
          ae = "useState", ht(), _e();
          var t = Re.current;
          Re.current = ga;
          try {
            return ov(e);
          } finally {
            Re.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return ae = "useDebugValue", ht(), _e(), fv();
        },
        useResponder: function(e, t) {
          return ae = "useResponder", ht(), _e(), pu(e, t);
        },
        useDeferredValue: function(e, t) {
          return ae = "useDeferredValue", ht(), _e(), y0(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", ht(), _e(), b0(e);
        }
      };
    }
    var gv = o.unstable_now, E0 = 0, Nh = -1;
    function d1() {
      return E0;
    }
    function I0() {
      E0 = gv();
    }
    function uw(e) {
      Nh = gv(), e.actualStartTime < 0 && (e.actualStartTime = gv());
    }
    function A0(e) {
      Nh = -1;
    }
    function yv(e, t) {
      if (Nh >= 0) {
        var s = gv() - Nh;
        e.actualDuration += s, t && (e.selfBaseDuration = s), Nh = -1;
      }
    }
    var $r = null, mu = null, vu = !1;
    function f1(e) {
      var t = e.stateNode.containerInfo;
      return mu = kS(t), $r = e, vu = !0, !0;
    }
    function R0(e, t) {
      switch (e.tag) {
        case Ce:
          qE(e.stateNode.containerInfo, t);
          break;
        case Ne:
          KE(e.type, e.memoizedProps, e.stateNode, t);
          break;
      }
      var s = dD();
      s.stateNode = t, s.return = e, s.effectTag = Us, e.lastEffect !== null ? (e.lastEffect.nextEffect = s, e.lastEffect = s) : e.firstEffect = e.lastEffect = s;
    }
    function D0(e, t) {
      switch (t.effectTag = t.effectTag & ~Fi | Sn, e.tag) {
        case Ce: {
          var s = e.stateNode.containerInfo;
          switch (t.tag) {
            case Ne:
              var l = t.type;
              t.pendingProps, eI(s, l);
              break;
            case $e:
              var d = t.pendingProps;
              tI(s, d);
              break;
          }
          break;
        }
        case Ne: {
          var p = e.type, y = e.memoizedProps, b = e.stateNode;
          switch (t.tag) {
            case Ne:
              var E = t.type;
              t.pendingProps, nI(p, y, b, E);
              break;
            case $e:
              var N = t.pendingProps;
              iI(p, y, b, N);
              break;
            case ee:
              rI(p, y);
              break;
          }
          break;
        }
        default:
          return;
      }
    }
    function N0(e, t) {
      switch (e.tag) {
        case Ne: {
          var s = e.type;
          e.pendingProps;
          var l = is(t, s);
          return l !== null ? (e.stateNode = l, !0) : !1;
        }
        case $e: {
          var d = e.pendingProps, p = jg(t, d);
          return p !== null ? (e.stateNode = p, !0) : !1;
        }
        case ee:
          return !1;
        default:
          return !1;
      }
    }
    function cw(e) {
      if (!!vu) {
        var t = mu;
        if (!t) {
          D0($r, e), vu = !1, $r = e;
          return;
        }
        var s = t;
        if (!N0(e, t)) {
          if (t = Sm(s), !t || !N0(e, t)) {
            D0($r, e), vu = !1, $r = e;
            return;
          }
          R0($r, s);
        }
        $r = e, mu = kS(t);
      }
    }
    function h1(e, t, s) {
      var l = e.stateNode, d = $E(l, e.type, e.memoizedProps, t, s, e);
      return e.updateQueue = d, d !== null;
    }
    function p1(e) {
      var t = e.stateNode, s = e.memoizedProps, l = QE(t, s, e);
      if (l) {
        var d = $r;
        if (d !== null)
          switch (d.tag) {
            case Ce: {
              var p = d.stateNode.containerInfo;
              XE(p, t, s);
              break;
            }
            case Ne: {
              var y = d.type, b = d.memoizedProps, E = d.stateNode;
              JE(y, b, E, t, s);
              break;
            }
          }
      }
      return l;
    }
    function m1(e) {
      var t = e.memoizedState, s = t !== null ? t.dehydrated : null;
      if (!s)
        throw Error("Expected to have a hydrated suspense instance. This error is likely caused by a bug in React. Please file an issue.");
      return ZE(s);
    }
    function k0(e) {
      for (var t = e.return; t !== null && t.tag !== Ne && t.tag !== Ce && t.tag !== ee; )
        t = t.return;
      $r = t;
    }
    function wv(e) {
      if (e !== $r)
        return !1;
      if (!vu)
        return k0(e), vu = !0, !1;
      var t = e.type;
      if (e.tag !== Ne || t !== "head" && t !== "body" && !C(t, e.memoizedProps))
        for (var s = mu; s; )
          R0(e, s), s = Sm(s);
      return k0(e), e.tag === ee ? mu = m1(e) : mu = $r ? Sm(e.stateNode) : null, !0;
    }
    function dw() {
      $r = null, mu = null, vu = !1;
    }
    var kh = m.ReactCurrentOwner, el = !1, fw, hw, pw, mw, vw, gu, gw, bv;
    fw = {}, hw = {}, pw = {}, mw = {}, vw = {}, gu = !1, gw = {}, bv = {};
    function gr(e, t, s, l) {
      e === null ? t.child = jy(t, null, s, l) : t.child = sd(t, e.child, s, l);
    }
    function v1(e, t, s, l) {
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
      var y = s.render, b = t.ref, E;
      return ad(t, d), kh.current = t, Dr(!0), E = dd(e, t, y, l, b, d), t.mode & gn && t.memoizedState !== null && (E = dd(e, t, y, l, b, d)), Dr(!1), e !== null && !el ? (p0(e, t, d), fo(e, t, d)) : (t.effectTag |= or, gr(e, t, E, d), t.child);
    }
    function _0(e, t, s, l, d, p) {
      if (e === null) {
        var y = s.type;
        if (rD(y) && s.compare === null && s.defaultProps === void 0) {
          var b = y;
          return b = id(y), t.tag = me, t.type = b, bw(t, y), z0(e, t, b, l, d, p);
        }
        {
          var E = y.propTypes;
          E && c(
            E,
            l,
            "prop",
            Te(y),
            ft
          );
        }
        var N = Xw(s.type, null, l, null, t.mode, p);
        return N.ref = t.ref, N.return = t, t.child = N, N;
      }
      {
        var k = s.type, X = k.propTypes;
        X && c(
          X,
          l,
          "prop",
          Te(k),
          ft
        );
      }
      var L = e.child;
      if (d < p) {
        var K = L.memoizedProps, ve = s.compare;
        if (ve = ve !== null ? ve : uh, ve(K, l) && e.ref === t.ref)
          return fo(e, t, p);
      }
      t.effectTag |= or;
      var be = Eu(L, l);
      return be.ref = t.ref, be.return = t, t.child = be, be;
    }
    function z0(e, t, s, l, d, p) {
      if (t.type !== t.elementType) {
        var y = t.elementType;
        y.$$typeof === nr && (y = zd(y));
        var b = y && y.propTypes;
        b && c(
          b,
          l,
          "prop",
          Te(y),
          ft
        );
      }
      if (e !== null) {
        var E = e.memoizedProps;
        if (uh(E, l) && e.ref === t.ref && t.type === e.type && (el = !1, d < p))
          return t.expirationTime = e.expirationTime, fo(e, t, p);
      }
      return yw(e, t, s, l, p);
    }
    function g1(e, t, s) {
      var l = t.pendingProps;
      return gr(e, t, l, s), t.child;
    }
    function y1(e, t, s) {
      var l = t.pendingProps.children;
      return gr(e, t, l, s), t.child;
    }
    function w1(e, t, s) {
      t.effectTag |= Ct;
      var l = t.pendingProps, d = l.children;
      return gr(e, t, d, s), t.child;
    }
    function O0(e, t) {
      var s = t.ref;
      (e === null && s !== null || e !== null && e.ref !== s) && (t.effectTag |= fi);
    }
    function yw(e, t, s, l, d) {
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
      var y;
      {
        var b = Jc(t, s, !0);
        y = qc(t, b);
      }
      var E;
      return ad(t, d), kh.current = t, Dr(!0), E = dd(e, t, s, l, y, d), t.mode & gn && t.memoizedState !== null && (E = dd(e, t, s, l, y, d)), Dr(!1), e !== null && !el ? (p0(e, t, d), fo(e, t, d)) : (t.effectTag |= or, gr(e, t, E, d), t.child);
    }
    function L0(e, t, s, l, d) {
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
      var y;
      us(s) ? (y = !0, zm(t)) : y = !1, ad(t, d);
      var b = t.stateNode, E;
      b === null ? (e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= Sn), o0(t, s, l), Py(t, s, l, d), E = !0) : e === null ? E = e1(t, s, l, d) : E = t1(e, t, s, l, d);
      var N = ww(e, t, s, E, y, d);
      {
        var k = t.stateNode;
        k.props !== l && (gu || g("It looks like %s is reassigning its own `this.props` while rendering. This is not supported and can lead to confusing bugs.", Te(t.type) || "a component"), gu = !0);
      }
      return N;
    }
    function ww(e, t, s, l, d, p) {
      O0(e, t);
      var y = (t.effectTag & jt) !== _t;
      if (!l && !y)
        return d && Mx(t, s, !1), fo(e, t, p);
      var b = t.stateNode;
      kh.current = t;
      var E;
      return y && typeof s.getDerivedStateFromError != "function" ? (E = null, A0()) : (Dr(!0), E = b.render(), t.mode & gn && b.render(), Dr(!1)), t.effectTag |= or, e !== null && y ? v1(e, t, E, p) : gr(e, t, E, p), t.memoizedState = b.state, d && Mx(t, s, !0), t.child;
    }
    function B0(e) {
      var t = e.stateNode;
      t.pendingContext ? Cx(e, t.pendingContext, t.pendingContext !== t.context) : t.context && Cx(e, t.context, !1), Uy(e, t.containerInfo);
    }
    function b1(e, t, s) {
      B0(t);
      var l = t.updateQueue;
      if (!(e !== null && l !== null))
        throw Error("If the root does not have an updateQueue, we should have already bailed out. This error is likely caused by a bug in React. Please file an issue.");
      var d = t.pendingProps, p = t.memoizedState, y = p !== null ? p.element : null;
      xy(e, t), xh(t, d, null, s);
      var b = t.memoizedState, E = b.element;
      if (E === y)
        return dw(), fo(e, t, s);
      var N = t.stateNode;
      if (N.hydrate && f1(t)) {
        var k = jy(t, null, E, s);
        t.child = k;
        for (var X = k; X; )
          X.effectTag = X.effectTag & ~Sn | Fi, X = X.sibling;
      } else
        gr(e, t, E, s), dw();
      return t.child;
    }
    function S1(e, t, s) {
      f0(t), e === null && cw(t);
      var l = t.type, d = t.pendingProps, p = e !== null ? e.memoizedProps : null, y = d.children, b = C(l, d);
      return b ? y = null : p !== null && C(l, p) && (t.effectTag |= Ii), O0(e, t), t.mode & td && s !== fs && R(l, d) ? (Fw(fs), t.expirationTime = t.childExpirationTime = fs, null) : (gr(e, t, y, s), t.child);
    }
    function x1(e, t) {
      return e === null && cw(t), null;
    }
    function C1(e, t, s, l, d) {
      e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= Sn);
      var p = t.pendingProps;
      fx(t);
      var y = $A(s);
      t.type = y;
      var b = t.tag = aD(y);
      dx(t);
      var E = ma(y, p), N;
      switch (b) {
        case fe:
          return bw(t, y), t.type = y = id(y), N = yw(null, t, y, E, d), N;
        case xe:
          return t.type = y = fy(y), N = L0(null, t, y, E, d), N;
        case D:
          return t.type = y = hy(y), N = P0(null, t, y, E, d), N;
        case ye: {
          if (t.type !== t.elementType) {
            var k = y.propTypes;
            k && c(
              k,
              E,
              "prop",
              Te(y),
              ft
            );
          }
          return N = _0(
            null,
            t,
            y,
            ma(y.type, E),
            l,
            d
          ), N;
        }
      }
      var X = "";
      throw y !== null && typeof y == "object" && y.$$typeof === nr && (X = " Did you wrap a component in React.lazy() more than once?"), Error("Element type is invalid. Received a promise that resolves to: " + y + ". Lazy element type must resolve to a class or function." + X);
    }
    function T1(e, t, s, l, d) {
      e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= Sn), t.tag = xe;
      var p;
      return us(s) ? (p = !0, zm(t)) : p = !1, ad(t, d), o0(t, s, l), Py(t, s, l, d), ww(null, t, s, !0, p, d);
    }
    function M1(e, t, s, l) {
      e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= Sn);
      var d = t.pendingProps, p;
      {
        var y = Jc(t, s, !1);
        p = qc(t, y);
      }
      ad(t, l);
      var b;
      {
        if (s.prototype && typeof s.prototype.render == "function") {
          var E = Te(s) || "Unknown";
          fw[E] || (g("The <%s /> component appears to have a render method, but doesn't extend React.Component. This is likely to cause errors. Change %s to extend React.Component instead.", E, E), fw[E] = !0);
        }
        t.mode & gn && pa.recordLegacyContextWarning(t, null), Dr(!0), kh.current = t, b = dd(null, t, s, d, p, l), Dr(!1);
      }
      if (t.effectTag |= or, typeof b == "object" && b !== null && typeof b.render == "function" && b.$$typeof === void 0) {
        {
          var N = Te(s) || "Unknown";
          hw[N] || (g("The <%s /> component appears to be a function component that returns a class instance. Change %s to a class that extends React.Component instead. If you can't use a class try assigning the prototype on the function as a workaround. `%s.prototype = React.Component.prototype`. Don't use an arrow function since it cannot be called with `new` by React.", N, N, N), hw[N] = !0);
        }
        t.tag = xe, t.memoizedState = null, t.updateQueue = null;
        var k = !1;
        us(s) ? (k = !0, zm(t)) : k = !1, t.memoizedState = b.state !== null && b.state !== void 0 ? b.state : null, Sy(t);
        var X = s.getDerivedStateFromProps;
        return typeof X == "function" && Xm(t, s, X, d), s0(t, b), Py(t, s, d, l), ww(null, t, s, !0, k, l);
      } else
        return t.tag = fe, t.mode & gn && t.memoizedState !== null && (b = dd(null, t, s, d, p, l)), gr(null, t, b, l), bw(t, s), t.child;
    }
    function bw(e, t) {
      {
        if (t && t.childContextTypes && g("%s(...): childContextTypes cannot be defined on a function component.", t.displayName || t.name || "Component"), e.ref !== null) {
          var s = "", l = ka();
          l && (s += `

Check the render method of \`` + l + "`.");
          var d = l || e._debugID || "", p = e._debugSource;
          p && (d = p.fileName + ":" + p.lineNumber), vw[d] || (vw[d] = !0, g("Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?%s", s));
        }
        if (typeof t.getDerivedStateFromProps == "function") {
          var y = Te(t) || "Unknown";
          mw[y] || (g("%s: Function components do not support getDerivedStateFromProps.", y), mw[y] = !0);
        }
        if (typeof t.contextType == "object" && t.contextType !== null) {
          var b = Te(t) || "Unknown";
          pw[b] || (g("%s: Function components do not support contextType.", b), pw[b] = !0);
        }
      }
    }
    var Sw = {
      dehydrated: null,
      retryTime: De
    };
    function E1(e, t, s) {
      return nv(e, Ih) && (t === null || t.memoizedState !== null);
    }
    function j0(e, t, s) {
      var l = t.mode, d = t.pendingProps;
      SD(t) && (t.effectTag |= jt);
      var p = va.current, y = !1, b = (t.effectTag & jt) !== _t;
      if (b || E1(p, e) ? (y = !0, t.effectTag &= ~jt) : (e === null || e.memoizedState !== null) && d.fallback !== void 0 && d.unstable_avoidThisFallback !== !0 && (p = a1(p, Wy)), p = Ah(p), hu(t, p), e === null)
        if (d.fallback !== void 0 && cw(t), y) {
          var E = d.fallback, N = il(null, l, De, null);
          if (N.return = t, (t.mode & Vr) === si) {
            var k = t.memoizedState, X = k !== null ? t.child.child : t.child;
            N.child = X;
            for (var L = X; L !== null; )
              L.return = N, L = L.sibling;
          }
          var K = il(E, l, s, null);
          return K.return = t, N.sibling = K, t.memoizedState = Sw, t.child = N, K;
        } else {
          var ve = d.children;
          return t.memoizedState = null, t.child = jy(t, null, ve, s);
        }
      else {
        var be = e.memoizedState;
        if (be !== null) {
          var qe = e.child, nt = qe.sibling;
          if (y) {
            var zt = d.fallback, vt = Eu(qe, qe.pendingProps);
            if (vt.return = t, (t.mode & Vr) === si) {
              var Qt = t.memoizedState, W = Qt !== null ? t.child.child : t.child;
              if (W !== qe.child) {
                vt.child = W;
                for (var te = W; te !== null; )
                  te.return = vt, te = te.sibling;
              }
            }
            if (t.mode & ds) {
              for (var j = 0, ge = vt.child; ge !== null; )
                j += ge.treeBaseDuration, ge = ge.sibling;
              vt.treeBaseDuration = j;
            }
            var pe = Eu(nt, zt);
            return pe.return = t, vt.sibling = pe, vt.childExpirationTime = De, t.memoizedState = Sw, t.child = vt, pe;
          } else {
            var Ee = d.children, gt = qe.child, At = sd(t, gt, Ee, s);
            return t.memoizedState = null, t.child = At;
          }
        } else {
          var Vt = e.child;
          if (y) {
            var Rt = d.fallback, Ot = il(
              null,
              l,
              De,
              null
            );
            if (Ot.return = t, Ot.child = Vt, Vt !== null && (Vt.return = Ot), (t.mode & Vr) === si) {
              var Dt = t.memoizedState, un = Dt !== null ? t.child.child : t.child;
              Ot.child = un;
              for (var En = un; En !== null; )
                En.return = Ot, En = En.sibling;
            }
            if (t.mode & ds) {
              for (var In = 0, yi = Ot.child; yi !== null; )
                In += yi.treeBaseDuration, yi = yi.sibling;
              Ot.treeBaseDuration = In;
            }
            var tn = il(Rt, l, s, null);
            return tn.return = t, Ot.sibling = tn, tn.effectTag |= Sn, Ot.childExpirationTime = De, t.memoizedState = Sw, t.child = Ot, tn;
          } else {
            t.memoizedState = null;
            var Oi = d.children;
            return t.child = sd(t, Vt, Oi, s);
          }
        }
      }
    }
    function U0(e, t) {
      e.expirationTime < t && (e.expirationTime = t);
      var s = e.alternate;
      s !== null && s.expirationTime < t && (s.expirationTime = t), Xx(e.return, t);
    }
    function I1(e, t, s) {
      for (var l = t; l !== null; ) {
        if (l.tag === ee) {
          var d = l.memoizedState;
          d !== null && U0(l, s);
        } else if (l.tag === dt)
          U0(l, s);
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
    function A1(e) {
      for (var t = e, s = null; t !== null; ) {
        var l = t.alternate;
        l !== null && iv(l) === null && (s = t), t = t.sibling;
      }
      return s;
    }
    function R1(e) {
      if (e !== void 0 && e !== "forwards" && e !== "backwards" && e !== "together" && !gw[e])
        if (gw[e] = !0, typeof e == "string")
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
    function D1(e, t) {
      e !== void 0 && !bv[e] && (e !== "collapsed" && e !== "hidden" ? (bv[e] = !0, g('"%s" is not a supported value for tail on <SuspenseList />. Did you mean "collapsed" or "hidden"?', e)) : t !== "forwards" && t !== "backwards" && (bv[e] = !0, g('<SuspenseList tail="%s" /> is only valid if revealOrder is "forwards" or "backwards". Did you mean to specify revealOrder="forwards"?', e)));
    }
    function V0(e, t) {
      {
        var s = Array.isArray(e), l = !s && typeof Rr(e) == "function";
        if (s || l) {
          var d = s ? "array" : "iterable";
          return g("A nested %s was passed to row #%s in <SuspenseList />. Wrap it in an additional SuspenseList to configure its revealOrder: <SuspenseList revealOrder=...> ... <SuspenseList revealOrder=...>{%s}</SuspenseList> ... </SuspenseList>", d, t, d), !1;
        }
      }
      return !0;
    }
    function N1(e, t) {
      if ((t === "forwards" || t === "backwards") && e !== void 0 && e !== null && e !== !1)
        if (Array.isArray(e)) {
          for (var s = 0; s < e.length; s++)
            if (!V0(e[s], s))
              return;
        } else {
          var l = Rr(e);
          if (typeof l == "function") {
            var d = l.call(e);
            if (d)
              for (var p = d.next(), y = 0; !p.done; p = d.next()) {
                if (!V0(p.value, y))
                  return;
                y++;
              }
          } else
            g('A single row was passed to a <SuspenseList revealOrder="%s" />. This is not useful since it needs multiple rows. Did you mean to pass multiple children or an array?', t);
        }
    }
    function xw(e, t, s, l, d, p) {
      var y = e.memoizedState;
      y === null ? e.memoizedState = {
        isBackwards: t,
        rendering: null,
        renderingStartTime: 0,
        last: l,
        tail: s,
        tailExpiration: 0,
        tailMode: d,
        lastEffect: p
      } : (y.isBackwards = t, y.rendering = null, y.renderingStartTime = 0, y.last = l, y.tail = s, y.tailExpiration = 0, y.tailMode = d, y.lastEffect = p);
    }
    function H0(e, t, s) {
      var l = t.pendingProps, d = l.revealOrder, p = l.tail, y = l.children;
      R1(d), D1(p, d), N1(y, d), gr(e, t, y, s);
      var b = va.current, E = nv(b, Ih);
      if (E)
        b = Fy(b, Ih), t.effectTag |= jt;
      else {
        var N = e !== null && (e.effectTag & jt) !== _t;
        N && I1(t, t.child, s), b = Ah(b);
      }
      if (hu(t, b), (t.mode & Vr) === si)
        t.memoizedState = null;
      else
        switch (d) {
          case "forwards": {
            var k = A1(t.child), X;
            k === null ? (X = t.child, t.child = null) : (X = k.sibling, k.sibling = null), xw(
              t,
              !1,
              X,
              k,
              p,
              t.lastEffect
            );
            break;
          }
          case "backwards": {
            var L = null, K = t.child;
            for (t.child = null; K !== null; ) {
              var ve = K.alternate;
              if (ve !== null && iv(ve) === null) {
                t.child = K;
                break;
              }
              var be = K.sibling;
              K.sibling = L, L = K, K = be;
            }
            xw(
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
            xw(
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
    function k1(e, t, s) {
      Uy(t, t.stateNode.containerInfo);
      var l = t.pendingProps;
      return e === null ? t.child = sd(t, null, l, s) : gr(e, t, l, s), t.child;
    }
    function P1(e, t, s) {
      var l = t.type, d = l._context, p = t.pendingProps, y = t.memoizedProps, b = p.value;
      {
        var E = t.type.propTypes;
        E && c(E, p, "prop", "Context.Provider", ft);
      }
      if (Gx(t, b), y !== null) {
        var N = y.value, k = QA(d, b, N);
        if (k === 0) {
          if (y.children === p.children && !Pm())
            return fo(e, t, s);
        } else
          ZA(t, d, k, s);
      }
      var X = p.children;
      return gr(e, t, X, s), t.child;
    }
    var W0 = !1;
    function _1(e, t, s) {
      var l = t.type;
      l._context === void 0 ? l !== l.Consumer && (W0 || (W0 = !0, g("Rendering <Context> directly is not supported and will be removed in a future major release. Did you mean to render <Context.Consumer> instead?"))) : l = l._context;
      var d = t.pendingProps, p = d.children;
      typeof p != "function" && g("A context consumer was rendered with multiple children, or a child that isn't a function. A context consumer expects a single child that is a function. If you did pass a function, make sure there is no trailing or leading whitespace around it."), ad(t, s);
      var y = On(l, d.unstable_observedBits), b;
      return kh.current = t, Dr(!0), b = p(y), Dr(!1), t.effectTag |= or, gr(e, t, b, s), t.child;
    }
    function Cw() {
      el = !0;
    }
    function fo(e, t, s) {
      fx(t), e !== null && (t.dependencies = e.dependencies), A0();
      var l = t.expirationTime;
      l !== De && zv(l);
      var d = t.childExpirationTime;
      return d < s ? null : (n1(e, t), t.child);
    }
    function z1(e, t, s) {
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
        return p !== null ? (p.nextEffect = e, l.lastEffect = e) : l.firstEffect = l.lastEffect = e, e.nextEffect = null, e.effectTag = Us, s.effectTag |= Sn, s;
      }
    }
    function F0(e, t, s) {
      var l = t.expirationTime;
      if (t._debugNeedsRemount && e !== null)
        return z1(e, t, Xw(t.type, t.key, t.pendingProps, t._debugOwner || null, t.mode, t.expirationTime));
      if (e !== null) {
        var d = e.memoizedProps, p = t.pendingProps;
        if (d !== p || Pm() || t.type !== e.type)
          el = !0;
        else if (l < s) {
          switch (el = !1, t.tag) {
            case Ce:
              B0(t), dw();
              break;
            case Ne:
              if (f0(t), t.mode & td && s !== fs && R(t.type, p))
                return Fw(fs), t.expirationTime = t.childExpirationTime = fs, null;
              break;
            case xe: {
              var y = t.type;
              us(y) && zm(t);
              break;
            }
            case Ve:
              Uy(t, t.stateNode.containerInfo);
              break;
            case re: {
              var b = t.memoizedProps.value;
              Gx(t, b);
              break;
            }
            case B:
              {
                var E = t.childExpirationTime >= s;
                E && (t.effectTag |= Ct);
              }
              break;
            case ee: {
              var N = t.memoizedState;
              if (N !== null) {
                var k = t.child, X = k.childExpirationTime;
                if (X !== De && X >= s)
                  return j0(e, t, s);
                hu(t, Ah(va.current));
                var L = fo(e, t, s);
                return L !== null ? L.sibling : null;
              } else
                hu(t, Ah(va.current));
              break;
            }
            case dt: {
              var K = (e.effectTag & jt) !== _t, ve = t.childExpirationTime >= s;
              if (K) {
                if (ve)
                  return H0(e, t, s);
                t.effectTag |= jt;
              }
              var be = t.memoizedState;
              if (be !== null && (be.rendering = null, be.tail = null), hu(t, va.current), ve)
                break;
              return null;
            }
          }
          return fo(e, t, s);
        } else
          el = !1;
      } else
        el = !1;
      switch (t.expirationTime = De, t.tag) {
        case We:
          return M1(e, t, t.type, s);
        case ot: {
          var qe = t.elementType;
          return C1(e, t, qe, l, s);
        }
        case fe: {
          var nt = t.type, zt = t.pendingProps, vt = t.elementType === nt ? zt : ma(nt, zt);
          return yw(e, t, nt, vt, s);
        }
        case xe: {
          var Qt = t.type, W = t.pendingProps, te = t.elementType === Qt ? W : ma(Qt, W);
          return L0(e, t, Qt, te, s);
        }
        case Ce:
          return b1(e, t, s);
        case Ne:
          return S1(e, t, s);
        case $e:
          return x1(e, t);
        case ee:
          return j0(e, t, s);
        case Ve:
          return k1(e, t, s);
        case D: {
          var j = t.type, ge = t.pendingProps, pe = t.elementType === j ? ge : ma(j, ge);
          return P0(e, t, j, pe, s);
        }
        case bt:
          return g1(e, t, s);
        case Xt:
          return y1(e, t, s);
        case B:
          return w1(e, t, s);
        case re:
          return P1(e, t, s);
        case Ge:
          return _1(e, t, s);
        case ye: {
          var Ee = t.type, gt = t.pendingProps, At = ma(Ee, gt);
          if (t.type !== t.elementType) {
            var Vt = Ee.propTypes;
            Vt && c(
              Vt,
              At,
              "prop",
              Te(Ee),
              ft
            );
          }
          return At = ma(Ee.type, At), _0(e, t, Ee, At, l, s);
        }
        case me:
          return z0(e, t, t.type, t.pendingProps, l, s);
        case Ze: {
          var Rt = t.type, Ot = t.pendingProps, Dt = t.elementType === Rt ? Ot : ma(Rt, Ot);
          return T1(e, t, Rt, Dt, s);
        }
        case dt:
          return H0(e, t, s);
      }
      throw Error("Unknown unit of work tag (" + t.tag + "). This error is likely caused by a bug in React. Please file an issue.");
    }
    function vd(e) {
      e.effectTag |= Ct;
    }
    function $0(e) {
      e.effectTag |= fi;
    }
    var Q0, Tw, Z0, Y0;
    Q0 = function(e, t, s, l) {
      for (var d = t.child; d !== null; ) {
        if (d.tag === Ne || d.tag === $e)
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
    }, Tw = function(e) {
    }, Z0 = function(e, t, s, l, d) {
      var p = e.memoizedProps;
      if (p !== l) {
        var y = t.stateNode, b = Vy(), E = S(y, s, p, l, d, b);
        t.updateQueue = E, E && vd(t);
      }
    }, Y0 = function(e, t, s, l) {
      s !== l && vd(t);
    };
    function Sv(e, t) {
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
    function G0(e, t, s) {
      var l = t.pendingProps;
      switch (t.tag) {
        case We:
        case ot:
        case me:
        case fe:
        case D:
        case bt:
        case Xt:
        case B:
        case Ge:
        case ye:
          return null;
        case xe: {
          var d = t.type;
          return us(d) && _m(t), null;
        }
        case Ce: {
          od(t), ry(t);
          var p = t.stateNode;
          if (p.pendingContext && (p.context = p.pendingContext, p.pendingContext = null), e === null || e.child === null) {
            var y = wv(t);
            y && vd(t);
          }
          return Tw(t), null;
        }
        case Ne: {
          Hy(t);
          var b = d0(), E = t.type;
          if (e !== null && t.stateNode != null)
            Z0(e, t, E, l, b), e.ref !== t.ref && $0(t);
          else {
            if (!l) {
              if (t.stateNode === null)
                throw Error("We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue.");
              return null;
            }
            var N = Vy(), k = wv(t);
            if (k)
              h1(t, b, N) && vd(t);
            else {
              var X = u(E, l, b, N, t);
              Q0(X, t, !1, !1), t.stateNode = X, v(X, E, l, b) && vd(t);
            }
            t.ref !== null && $0(t);
          }
          return null;
        }
        case $e: {
          var L = l;
          if (e && t.stateNode != null) {
            var K = e.memoizedProps;
            Y0(e, t, K, L);
          } else {
            if (typeof L != "string" && t.stateNode === null)
              throw Error("We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue.");
            var ve = d0(), be = Vy(), qe = wv(t);
            qe ? p1(t) && vd(t) : t.stateNode = H(L, ve, be, t);
          }
          return null;
        }
        case ee: {
          ld(t);
          var nt = t.memoizedState;
          if ((t.effectTag & jt) !== _t)
            return t.expirationTime = s, t;
          var zt = nt !== null, vt = !1;
          if (e === null)
            t.memoizedProps.fallback !== void 0 && wv(t);
          else {
            var Qt = e.memoizedState;
            if (vt = Qt !== null, !zt && Qt !== null) {
              var W = e.child.sibling;
              if (W !== null) {
                var te = t.firstEffect;
                te !== null ? (t.firstEffect = W, W.nextEffect = te) : (t.firstEffect = t.lastEffect = W, W.nextEffect = null), W.effectTag = Us;
              }
            }
          }
          if (zt && !vt && (t.mode & Vr) !== si) {
            var j = e === null && t.memoizedProps.unstable_avoidThisFallback !== !0;
            j || nv(va.current, Wy) ? yR() : wR();
          }
          return (zt || vt) && (t.effectTag |= Ct), null;
        }
        case Ve:
          return od(t), Tw(t), null;
        case re:
          return yy(t), null;
        case Ze: {
          var ge = t.type;
          return us(ge) && _m(t), null;
        }
        case dt: {
          ld(t);
          var pe = t.memoizedState;
          if (pe === null)
            return null;
          var Ee = (t.effectTag & jt) !== _t, gt = pe.rendering;
          if (gt === null)
            if (Ee)
              Sv(pe, !1);
            else {
              var At = SR() && (e === null || (e.effectTag & jt) === _t);
              if (!At)
                for (var Vt = t.child; Vt !== null; ) {
                  var Rt = iv(Vt);
                  if (Rt !== null) {
                    Ee = !0, t.effectTag |= jt, Sv(pe, !1);
                    var Ot = Rt.updateQueue;
                    return Ot !== null && (t.updateQueue = Ot, t.effectTag |= Ct), pe.lastEffect === null && (t.firstEffect = null), t.lastEffect = pe.lastEffect, i1(t, s), hu(t, Fy(va.current, Ih)), t.child;
                  }
                  Vt = Vt.sibling;
                }
            }
          else {
            if (!Ee) {
              var Dt = iv(gt);
              if (Dt !== null) {
                t.effectTag |= jt, Ee = !0;
                var un = Dt.updateQueue;
                if (un !== null && (t.updateQueue = un, t.effectTag |= Ct), Sv(pe, !0), pe.tail === null && pe.tailMode === "hidden" && !gt.alternate) {
                  var En = t.lastEffect = pe.lastEffect;
                  return En !== null && (En.nextEffect = null), null;
                }
              } else if (mr() * 2 - pe.renderingStartTime > pe.tailExpiration && s > fs) {
                t.effectTag |= jt, Ee = !0, Sv(pe, !1);
                var In = s - 1;
                t.expirationTime = t.childExpirationTime = In, Fw(In);
              }
            }
            if (pe.isBackwards)
              gt.sibling = t.child, t.child = gt;
            else {
              var yi = pe.last;
              yi !== null ? yi.sibling = gt : t.child = gt, pe.last = gt;
            }
          }
          if (pe.tail !== null) {
            if (pe.tailExpiration === 0) {
              var tn = 500;
              pe.tailExpiration = mr() + tn;
            }
            var Oi = pe.tail;
            pe.rendering = Oi, pe.tail = Oi.sibling, pe.lastEffect = t.lastEffect, pe.renderingStartTime = mr(), Oi.sibling = null;
            var wa = va.current;
            return Ee ? wa = Fy(wa, Ih) : wa = Ah(wa), hu(t, wa), Oi;
          }
          return null;
        }
      }
      throw Error("Unknown unit of work tag (" + t.tag + "). This error is likely caused by a bug in React. Please file an issue.");
    }
    function O1(e, t) {
      switch (e.tag) {
        case xe: {
          var s = e.type;
          us(s) && _m(e);
          var l = e.effectTag;
          return l & hi ? (e.effectTag = l & ~hi | jt, e) : null;
        }
        case Ce: {
          od(e), ry(e);
          var d = e.effectTag;
          if ((d & jt) !== _t)
            throw Error("The root failed to unmount after an error. This is likely a bug in React. Please file an issue.");
          return e.effectTag = d & ~hi | jt, e;
        }
        case Ne:
          return Hy(e), null;
        case ee: {
          ld(e);
          var p = e.effectTag;
          return p & hi ? (e.effectTag = p & ~hi | jt, e) : null;
        }
        case dt:
          return ld(e), null;
        case Ve:
          return od(e), null;
        case re:
          return yy(e), null;
        default:
          return null;
      }
    }
    function X0(e) {
      switch (e.tag) {
        case xe: {
          var t = e.type.childContextTypes;
          t != null && _m(e);
          break;
        }
        case Ce: {
          od(e), ry(e);
          break;
        }
        case Ne: {
          Hy(e);
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
          yy(e);
          break;
      }
    }
    function Mw(e, t) {
      return {
        value: e,
        source: t,
        stack: Fn(t)
      };
    }
    function L1(e) {
      var t = e.error;
      {
        var s = e.componentName, l = e.componentStack, d = e.errorBoundaryName, p = e.errorBoundaryFound, y = e.willRetry;
        if (t != null && t._suppressLogging) {
          if (p && y)
            return;
          console.error(t);
        }
        var b = s ? "The above error occurred in the <" + s + "> component:" : "The above error occurred in one of your React components:", E;
        p && d ? y ? E = "React will try to recreate this component tree from scratch " + ("using the error boundary you provided, " + d + ".") : E = "This error was initially handled by the error boundary " + d + `.
Recreating the tree from scratch failed so React will unmount the tree.` : E = `Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://fb.me/react-error-boundaries to learn more about error boundaries.`;
        var N = "" + b + l + `

` + ("" + E);
        console.error(N);
      }
    }
    var J0 = null;
    J0 = /* @__PURE__ */ new Set();
    var B1 = typeof WeakSet == "function" ? WeakSet : Set;
    function Ew(e, t) {
      var s = t.source, l = t.stack;
      l === null && s !== null && (l = Fn(s));
      var d = {
        componentName: s !== null ? Te(s.type) : null,
        componentStack: l !== null ? l : "",
        error: t.value,
        errorBoundary: null,
        errorBoundaryName: null,
        errorBoundaryFound: !1,
        willRetry: !1
      };
      e !== null && e.tag === xe && (d.errorBoundary = e.stateNode, d.errorBoundaryName = Te(e.type), d.errorBoundaryFound = !0, d.willRetry = !0);
      try {
        L1(d);
      } catch (p) {
        setTimeout(function() {
          throw p;
        });
      }
    }
    var j1 = function(e, t) {
      ss(e, "componentWillUnmount"), t.props = e.memoizedProps, t.state = e.memoizedState, t.componentWillUnmount(), os();
    };
    function U1(e, t) {
      if (se(null, j1, null, e, t), oe()) {
        var s = Le();
        Tu(e, s);
      }
    }
    function q0(e) {
      var t = e.ref;
      if (t !== null)
        if (typeof t == "function") {
          if (se(null, t, null, null), oe()) {
            var s = Le();
            Tu(e, s);
          }
        } else
          t.current = null;
    }
    function V1(e, t) {
      if (se(null, t, null), oe()) {
        var s = Le();
        Tu(e, s);
      }
    }
    function H1(e, t) {
      switch (t.tag) {
        case fe:
        case D:
        case me:
        case St:
          return;
        case xe: {
          if (t.effectTag & Va && e !== null) {
            var s = e.memoizedProps, l = e.memoizedState;
            ss(t, "getSnapshotBeforeUpdate");
            var d = t.stateNode;
            t.type === t.elementType && !gu && (d.props !== t.memoizedProps && g("Expected %s props to match memoized props before getSnapshotBeforeUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(t.type) || "instance"), d.state !== t.memoizedState && g("Expected %s state to match memoized state before getSnapshotBeforeUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(t.type) || "instance"));
            var p = d.getSnapshotBeforeUpdate(t.elementType === t.type ? s : ma(t.type, s), l);
            {
              var y = J0;
              p === void 0 && !y.has(t.type) && (y.add(t.type), g("%s.getSnapshotBeforeUpdate(): A snapshot value (or null) must be returned. You have returned undefined.", Te(t.type)));
            }
            d.__reactInternalSnapshotBeforeUpdate = p, os();
          }
          return;
        }
        case Ce:
        case Ne:
        case $e:
        case Ve:
        case Ze:
          return;
      }
      throw Error("This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue.");
    }
    function K0(e, t) {
      var s = t.updateQueue, l = s !== null ? s.lastEffect : null;
      if (l !== null) {
        var d = l.next, p = d;
        do {
          if ((p.tag & e) === e) {
            var y = p.destroy;
            p.destroy = void 0, y !== void 0 && y();
          }
          p = p.next;
        } while (p !== d);
      }
    }
    function eC(e, t) {
      var s = t.updateQueue, l = s !== null ? s.lastEffect : null;
      if (l !== null) {
        var d = l.next, p = d;
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

Learn more about data fetching with Hooks: https://fb.me/react-hooks-data-fetching` : E = " You returned: " + b, g("An effect function must not return anything besides a function, which is used for clean-up.%s%s", E, Fn(t));
              }
            }
          }
          p = p.next;
        } while (p !== d);
      }
    }
    function W1(e) {
      if ((e.effectTag & Ha) !== _t)
        switch (e.tag) {
          case fe:
          case D:
          case me:
          case St: {
            K0(rv | ud, e), eC(rv | ud, e);
            break;
          }
        }
    }
    function F1(e, t, s, l) {
      switch (s.tag) {
        case fe:
        case D:
        case me:
        case St: {
          eC(cd | ud, s);
          return;
        }
        case xe: {
          var d = s.stateNode;
          if (s.effectTag & Ct)
            if (t === null)
              ss(s, "componentDidMount"), s.type === s.elementType && !gu && (d.props !== s.memoizedProps && g("Expected %s props to match memoized props before componentDidMount. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(s.type) || "instance"), d.state !== s.memoizedState && g("Expected %s state to match memoized state before componentDidMount. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(s.type) || "instance")), d.componentDidMount(), os();
            else {
              var p = s.elementType === s.type ? t.memoizedProps : ma(s.type, t.memoizedProps), y = t.memoizedState;
              ss(s, "componentDidUpdate"), s.type === s.elementType && !gu && (d.props !== s.memoizedProps && g("Expected %s props to match memoized props before componentDidUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(s.type) || "instance"), d.state !== s.memoizedState && g("Expected %s state to match memoized state before componentDidUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(s.type) || "instance")), d.componentDidUpdate(p, y, d.__reactInternalSnapshotBeforeUpdate), os();
            }
          var b = s.updateQueue;
          b !== null && (s.type === s.elementType && !gu && (d.props !== s.memoizedProps && g("Expected %s props to match memoized props before processing the update queue. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(s.type) || "instance"), d.state !== s.memoizedState && g("Expected %s state to match memoized state before processing the update queue. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(s.type) || "instance")), t0(s, b, d));
          return;
        }
        case Ce: {
          var E = s.updateQueue;
          if (E !== null) {
            var N = null;
            if (s.child !== null)
              switch (s.child.tag) {
                case Ne:
                  N = s.child.stateNode;
                  break;
                case xe:
                  N = s.child.stateNode;
                  break;
              }
            t0(s, E, N);
          }
          return;
        }
        case Ne: {
          var k = s.stateNode;
          if (t === null && s.effectTag & Ct) {
            var X = s.type, L = s.memoizedProps;
            mt(k, X, L);
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
            typeof K == "function" && K(s.memoizedProps.id, t === null ? "mount" : "update", s.actualDuration, s.treeBaseDuration, s.actualStartTime, d1(), e.memoizedInteractions);
          }
          return;
        }
        case ee: {
          K1(e, s);
          return;
        }
        case dt:
        case Ze:
        case Mt:
        case Wt:
          return;
      }
      throw Error("This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue.");
    }
    function $1(e, t) {
      for (var s = e; ; ) {
        if (s.tag === Ne) {
          var l = s.stateNode;
          t ? Je(l) : ln(s.stateNode, s.memoizedProps);
        } else if (s.tag === $e) {
          var d = s.stateNode;
          t ? wt(d) : ut(d, s.memoizedProps);
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
    function Q1(e) {
      var t = e.ref;
      if (t !== null) {
        var s = e.stateNode, l;
        switch (e.tag) {
          case Ne:
            l = s;
            break;
          default:
            l = s;
        }
        typeof t == "function" ? t(l) : (t.hasOwnProperty("current") || g("Unexpected ref object provided for %s. Use either a ref-setter function or React.createRef().%s", Te(e.type), Fn(e)), t.current = l);
      }
    }
    function Z1(e) {
      var t = e.ref;
      t !== null && (typeof t == "function" ? t(null) : t.current = null);
    }
    function tC(e, t, s) {
      switch (KR(t), t.tag) {
        case fe:
        case D:
        case ye:
        case me:
        case St: {
          var l = t.updateQueue;
          if (l !== null) {
            var d = l.lastEffect;
            if (d !== null) {
              var p = d.next;
              {
                var y = s > ha ? ha : s;
                co(y, function() {
                  var E = p;
                  do {
                    var N = E.destroy;
                    N !== void 0 && V1(t, N), E = E.next;
                  } while (E !== p);
                });
              }
            }
          }
          return;
        }
        case xe: {
          q0(t);
          var b = t.stateNode;
          typeof b.componentWillUnmount == "function" && U1(t, b);
          return;
        }
        case Ne: {
          q0(t);
          return;
        }
        case Ve: {
          aC(e, t, s);
          return;
        }
        case Mt:
          return;
        case ze:
          return;
        case Wt:
          return;
      }
    }
    function Y1(e, t, s) {
      for (var l = t; ; ) {
        if (tC(e, l, s), l.child !== null && l.tag !== Ve) {
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
    function nC(e) {
      var t = e.alternate;
      e.return = null, e.child = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.alternate = null, e.firstEffect = null, e.lastEffect = null, e.pendingProps = null, e.memoizedProps = null, e.stateNode = null, t !== null && nC(t);
    }
    function G1(e) {
      for (var t = e.return; t !== null; ) {
        if (iC(t))
          return t;
        t = t.return;
      }
      throw Error("Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue.");
    }
    function iC(e) {
      return e.tag === Ne || e.tag === Ce || e.tag === Ve;
    }
    function X1(e) {
      var t = e;
      e:
        for (; ; ) {
          for (; t.sibling === null; ) {
            if (t.return === null || iC(t.return))
              return null;
            t = t.return;
          }
          for (t.sibling.return = t.return, t = t.sibling; t.tag !== Ne && t.tag !== $e && t.tag !== ze; ) {
            if (t.effectTag & Sn || t.child === null || t.tag === Ve)
              continue e;
            t.child.return = t, t = t.child;
          }
          if (!(t.effectTag & Sn))
            return t.stateNode;
        }
    }
    function rC(e) {
      var t = G1(e), s, l, d = t.stateNode;
      switch (t.tag) {
        case Ne:
          s = d, l = !1;
          break;
        case Ce:
          s = d.containerInfo, l = !0;
          break;
        case Ve:
          s = d.containerInfo, l = !0;
          break;
        case Mt:
        default:
          throw Error("Invalid host parent fiber. This error is likely caused by a bug in React. Please file an issue.");
      }
      t.effectTag & Ii && (ki(s), t.effectTag &= ~Ii);
      var p = X1(e);
      l ? Iw(e, p, s) : Aw(e, p, s);
    }
    function Iw(e, t, s) {
      var l = e.tag, d = l === Ne || l === $e;
      if (d || mn) {
        var p = d ? e.stateNode : e.stateNode.instance;
        t ? le(s, p, t) : _(s, p);
      } else if (l !== Ve) {
        var y = e.child;
        if (y !== null) {
          Iw(y, t, s);
          for (var b = y.sibling; b !== null; )
            Iw(b, t, s), b = b.sibling;
        }
      }
    }
    function Aw(e, t, s) {
      var l = e.tag, d = l === Ne || l === $e;
      if (d || mn) {
        var p = d ? e.stateNode : e.stateNode.instance;
        t ? Q(s, p, t) : O(s, p);
      } else if (l !== Ve) {
        var y = e.child;
        if (y !== null) {
          Aw(y, t, s);
          for (var b = y.sibling; b !== null; )
            Aw(b, t, s), b = b.sibling;
        }
      }
    }
    function aC(e, t, s) {
      for (var l = t, d = !1, p, y; ; ) {
        if (!d) {
          var b = l.return;
          e:
            for (; ; ) {
              if (b === null)
                throw Error("Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue.");
              var E = b.stateNode;
              switch (b.tag) {
                case Ne:
                  p = E, y = !1;
                  break e;
                case Ce:
                  p = E.containerInfo, y = !0;
                  break e;
                case Ve:
                  p = E.containerInfo, y = !0;
                  break e;
              }
              b = b.return;
            }
          d = !0;
        }
        if (l.tag === Ne || l.tag === $e)
          Y1(e, l, s), y ? Pe(p, l.stateNode) : we(p, l.stateNode);
        else if (l.tag === Ve) {
          if (l.child !== null) {
            p = l.stateNode.containerInfo, y = !0, l.child.return = l, l = l.child;
            continue;
          }
        } else if (tC(e, l, s), l.child !== null) {
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
    function J1(e, t, s) {
      aC(e, t, s), nC(t);
    }
    function Rw(e, t) {
      switch (t.tag) {
        case fe:
        case D:
        case ye:
        case me:
        case St: {
          K0(cd | ud, t);
          return;
        }
        case xe:
          return;
        case Ne: {
          var s = t.stateNode;
          if (s != null) {
            var l = t.memoizedProps, d = e !== null ? e.memoizedProps : l, p = t.type, y = t.updateQueue;
            t.updateQueue = null, y !== null && It(s, y, p, d, l);
          }
          return;
        }
        case $e: {
          if (t.stateNode === null)
            throw Error("This should have a text node initialized. This error is likely caused by a bug in React. Please file an issue.");
          var b = t.stateNode, E = t.memoizedProps, N = e !== null ? e.memoizedProps : E;
          Wn(b, N, E);
          return;
        }
        case Ce: {
          {
            var k = t.stateNode;
            k.hydrate && (k.hydrate = !1, YE(k.containerInfo));
          }
          return;
        }
        case B:
          return;
        case ee: {
          q1(t), sC(t);
          return;
        }
        case dt: {
          sC(t);
          return;
        }
        case Ze:
          return;
      }
      throw Error("This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue.");
    }
    function q1(e) {
      var t = e.memoizedState, s, l = e;
      t === null ? s = !1 : (s = !0, l = e.child, gR()), l !== null && $1(l, s);
    }
    function K1(e, t) {
      var s = t.memoizedState;
      if (s === null) {
        var l = t.alternate;
        if (l !== null) {
          var d = l.memoizedState;
          if (d !== null) {
            var p = d.dehydrated;
            p !== null && GE(p);
          }
        }
      }
    }
    function sC(e) {
      var t = e.updateQueue;
      if (t !== null) {
        e.updateQueue = null;
        var s = e.stateNode;
        s === null && (s = e.stateNode = new B1()), t.forEach(function(l) {
          var d = LR.bind(null, e, l);
          s.has(l) || (l.__reactDoNotTraceInteractions !== !0 && (d = h.unstable_wrap(d)), s.add(l), l.then(d, d));
        });
      }
    }
    function eR(e) {
      ki(e.stateNode);
    }
    var tR = typeof WeakMap == "function" ? WeakMap : Map;
    function oC(e, t, s) {
      var l = Go(s, null);
      l.tag = wy, l.payload = {
        element: null
      };
      var d = t.value;
      return l.callback = function() {
        _R(d), Ew(e, t);
      }, l;
    }
    function lC(e, t, s) {
      var l = Go(s, null);
      l.tag = wy;
      var d = e.type.getDerivedStateFromError;
      if (typeof d == "function") {
        var p = t.value;
        l.payload = function() {
          return Ew(e, t), d(p);
        };
      }
      var y = e.stateNode;
      return y !== null && typeof y.componentDidCatch == "function" ? l.callback = function() {
        Qx(e), typeof d != "function" && (kR(this), Ew(e, t));
        var E = t.value, N = t.stack;
        this.componentDidCatch(E, {
          componentStack: N !== null ? N : ""
        }), typeof d != "function" && e.expirationTime !== Tt && g("%s: Error boundaries should implement getDerivedStateFromError(). In that method, return a state update to display an error message or fallback UI.", Te(e.type) || "Unknown");
      } : l.callback = function() {
        Qx(e);
      }, l;
    }
    function nR(e, t, s) {
      var l = e.pingCache, d;
      if (l === null ? (l = e.pingCache = new tR(), d = /* @__PURE__ */ new Set(), l.set(s, d)) : (d = l.get(s), d === void 0 && (d = /* @__PURE__ */ new Set(), l.set(s, d))), !d.has(t)) {
        d.add(t);
        var p = zR.bind(null, e, s, t);
        s.then(p, p);
      }
    }
    function iR(e, t, s, l, d) {
      if (s.effectTag |= _o, s.firstEffect = s.lastEffect = null, l !== null && typeof l == "object" && typeof l.then == "function") {
        var p = l;
        if ((s.mode & Vr) === si) {
          var y = s.alternate;
          y ? (s.updateQueue = y.updateQueue, s.memoizedState = y.memoizedState, s.expirationTime = y.expirationTime) : (s.updateQueue = null, s.memoizedState = null);
        }
        var b = nv(va.current, Wy), E = t;
        do {
          if (E.tag === ee && s1(E, b)) {
            var N = E.updateQueue;
            if (N === null) {
              var k = /* @__PURE__ */ new Set();
              k.add(p), E.updateQueue = k;
            } else
              N.add(p);
            if ((E.mode & Vr) === si) {
              if (E.effectTag |= jt, s.effectTag &= ~(bf | _o), s.tag === xe) {
                var X = s.alternate;
                if (X === null)
                  s.tag = Ze;
                else {
                  var L = Go(Tt, null);
                  L.tag = $m, Xo(s, L);
                }
              }
              s.expirationTime = Tt;
              return;
            }
            nR(e, d, p), E.effectTag |= hi, E.expirationTime = d;
            return;
          }
          E = E.return;
        } while (E !== null);
        l = new Error((Te(s.type) || "A React component") + ` suspended while rendering, but no fallback UI was specified.

Add a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display.` + Fn(s));
      }
      bR(), l = Mw(l, s);
      var K = t;
      do {
        switch (K.tag) {
          case Ce: {
            var ve = l;
            K.effectTag |= hi, K.expirationTime = d;
            var be = oC(K, ve, d);
            Kx(K, be);
            return;
          }
          case xe:
            var qe = l, nt = K.type, zt = K.stateNode;
            if ((K.effectTag & jt) === _t && (typeof nt.getDerivedStateFromError == "function" || zt !== null && typeof zt.componentDidCatch == "function" && !CC(zt))) {
              K.effectTag |= hi, K.expirationTime = d;
              var vt = lC(K, qe, d);
              Kx(K, vt);
              return;
            }
            break;
        }
        K = K.return;
      } while (K !== null);
    }
    var rR = Math.ceil, Dw = m.ReactCurrentDispatcher, uC = m.ReactCurrentOwner, Nw = m.IsSomeRendererActing, Mn = 0, xv = 1, aR = 2, cC = 4, kw = 8, yr = 16, ps = 32, yu = 0, Cv = 1, dC = 2, Tv = 3, Mv = 4, Pw = 5, it = Mn, Yi = null, He = null, li = De, Zn = yu, Ev = null, ho = Tt, Ph = Tt, Iv = null, _h = De, Av = !1, _w = 0, fC = 500, Ue = null, Rv = !1, zw = null, gd = null, zh = !1, yd = null, Oh = Kc, Ow = De, wu = null, sR = 50, Lh = 0, Lw = null, oR = 50, Dv = 0, Bh = null, bu = null, jh = De;
    function ms() {
      return (it & (yr | ps)) !== Mn ? uy(mr()) : (jh !== De || (jh = uy(mr())), jh);
    }
    function lR() {
      return uy(mr());
    }
    function Su(e, t, s) {
      var l = t.mode;
      if ((l & Vr) === si)
        return Tt;
      var d = ed();
      if ((l & td) === si)
        return d === zi ? Tt : jx;
      if ((it & yr) !== Mn)
        return li;
      var p;
      if (s !== null)
        p = LA(e, s.timeoutMs | 0 || mh);
      else
        switch (d) {
          case zi:
            p = Tt;
            break;
          case Yo:
            p = Hx(e);
            break;
          case ha:
          case oy:
            p = OA(e);
            break;
          case fh:
            p = uu;
            break;
          default:
            throw Error("Expected a valid priority level");
        }
      return Yi !== null && p === li && (p -= 1), p;
    }
    function uR(e, t) {
      UR(), $R(e);
      var s = Nv(e, t);
      if (s === null) {
        WR(e);
        return;
      }
      HR(e, t), xA();
      var l = ed();
      if (t === Tt ? (it & kw) !== Mn && (it & (yr | ps)) === Mn ? (nl(s, t), Bw(s)) : (wr(s), nl(s, t), it === Mn && cs()) : (wr(s), nl(s, t)), (it & cC) !== Mn && (l === Yo || l === zi))
        if (wu === null)
          wu = /* @__PURE__ */ new Map([[s, t]]);
        else {
          var d = wu.get(s);
          (d === void 0 || d > t) && wu.set(s, t);
        }
    }
    var Qr = uR;
    function Nv(e, t) {
      e.expirationTime < t && (e.expirationTime = t);
      var s = e.alternate;
      s !== null && s.expirationTime < t && (s.expirationTime = t);
      var l = e.return, d = null;
      if (l === null && e.tag === Ce)
        d = e.stateNode;
      else
        for (; l !== null; ) {
          if (s = l.alternate, l.childExpirationTime < t && (l.childExpirationTime = t), s !== null && s.childExpirationTime < t && (s.childExpirationTime = t), l.return === null && l.tag === Ce) {
            d = l.stateNode;
            break;
          }
          l = l.return;
        }
      return d !== null && (Yi === d && (zv(t), Zn === Mv && Iu(d, li)), OC(d, t)), d;
    }
    function kv(e) {
      var t = e.lastExpiredTime;
      if (t !== De)
        return t;
      var s = e.firstPendingTime;
      if (!zC(e, s))
        return s;
      var l = e.lastPingedTime, d = e.nextKnownPendingLevel, p = l > d ? l : d;
      return p <= uu && s !== p ? De : p;
    }
    function wr(e) {
      var t = e.lastExpiredTime;
      if (t !== De) {
        e.callbackExpirationTime = Tt, e.callbackPriority = zi, e.callbackNode = Ox(Bw.bind(null, e));
        return;
      }
      var s = kv(e), l = e.callbackNode;
      if (s === De) {
        l !== null && (e.callbackNode = null, e.callbackExpirationTime = De, e.callbackPriority = Kc);
        return;
      }
      var d = ms(), p = Wx(d, s);
      if (l !== null) {
        var y = e.callbackPriority, b = e.callbackExpirationTime;
        if (b === s && y >= p)
          return;
        _A(l);
      }
      e.callbackExpirationTime = s, e.callbackPriority = p;
      var E;
      s === Tt ? E = Ox(Bw.bind(null, e)) : E = hh(
        p,
        hC.bind(null, e),
        {
          timeout: cu(s) - mr()
        }
      ), e.callbackNode = E;
    }
    function hC(e, t) {
      if (jh = De, t) {
        var s = ms();
        return eb(e, s), wr(e), null;
      }
      var l = kv(e);
      if (l !== De) {
        var d = e.callbackNode;
        if ((it & (yr | ps)) !== Mn)
          throw Error("Should not already be working.");
        if (tl(), (e !== Yi || l !== li) && (xu(e, l), NC(e, l)), He !== null) {
          var p = it;
          it |= yr;
          var y = yC(), b = Pv(e);
          px(He);
          do
            try {
              MR();
              break;
            } catch (k) {
              gC(e, k);
            }
          while (!0);
          if (Fm(), it = p, wC(y), _v(b), Zn === Cv) {
            var E = Ev;
            throw Uw(), xu(e, l), Iu(e, l), wr(e), E;
          }
          if (He !== null)
            Uw();
          else {
            MC();
            var N = e.finishedWork = e.current.alternate;
            e.finishedExpirationTime = l, cR(e, N, Zn, l);
          }
          if (wr(e), e.callbackNode === d)
            return hC.bind(null, e);
        }
      }
      return null;
    }
    function cR(e, t, s, l) {
      switch (Yi = null, s) {
        case yu:
        case Cv:
          throw Error("Root did not complete. This is a bug in React.");
        case dC: {
          eb(e, l > uu ? uu : l);
          break;
        }
        case Tv: {
          Iu(e, l);
          var d = e.lastSuspendedTime;
          l === d && (e.nextKnownPendingLevel = jw(t));
          var p = ho === Tt;
          if (p && !Mu.current) {
            var y = _w + fC - mr();
            if (y > 10) {
              if (Av) {
                var b = e.lastPingedTime;
                if (b === De || b >= l) {
                  e.lastPingedTime = l, xu(e, l);
                  break;
                }
              }
              var E = kv(e);
              if (E !== De && E !== l)
                break;
              if (d !== De && d !== l) {
                e.lastPingedTime = d;
                break;
              }
              e.timeoutHandle = U(Cu.bind(null, e), y);
              break;
            }
          }
          Cu(e);
          break;
        }
        case Mv: {
          Iu(e, l);
          var N = e.lastSuspendedTime;
          if (l === N && (e.nextKnownPendingLevel = jw(t)), !Mu.current) {
            if (Av) {
              var k = e.lastPingedTime;
              if (k === De || k >= l) {
                e.lastPingedTime = l, xu(e, l);
                break;
              }
            }
            var X = kv(e);
            if (X !== De && X !== l)
              break;
            if (N !== De && N !== l) {
              e.lastPingedTime = N;
              break;
            }
            var L;
            if (Ph !== Tt)
              L = cu(Ph) - mr();
            else if (ho === Tt)
              L = 0;
            else {
              var K = xR(ho), ve = mr(), be = cu(l) - ve, qe = ve - K;
              qe < 0 && (qe = 0), L = BR(qe) - qe, be < L && (L = be);
            }
            if (L > 10) {
              e.timeoutHandle = U(Cu.bind(null, e), L);
              break;
            }
          }
          Cu(e);
          break;
        }
        case Pw: {
          if (!Mu.current && ho !== Tt && Iv !== null) {
            var nt = jR(ho, l, Iv);
            if (nt > 10) {
              Iu(e, l), e.timeoutHandle = U(Cu.bind(null, e), nt);
              break;
            }
          }
          Cu(e);
          break;
        }
        default:
          throw Error("Unknown root exit status.");
      }
    }
    function Bw(e) {
      var t = e.lastExpiredTime, s = t !== De ? t : Tt;
      if ((it & (yr | ps)) !== Mn)
        throw Error("Should not already be working.");
      if (tl(), (e !== Yi || s !== li) && (xu(e, s), NC(e, s)), He !== null) {
        var l = it;
        it |= yr;
        var d = yC(), p = Pv(e);
        px(He);
        do
          try {
            TR();
            break;
          } catch (b) {
            gC(e, b);
          }
        while (!0);
        if (Fm(), it = l, wC(d), _v(p), Zn === Cv) {
          var y = Ev;
          throw Uw(), xu(e, s), Iu(e, s), wr(e), y;
        }
        if (He !== null)
          throw Error("Cannot commit an incomplete root. This error is likely caused by a bug in React. Please file an issue.");
        MC(), e.finishedWork = e.current.alternate, e.finishedExpirationTime = s, dR(e), wr(e);
      }
      return null;
    }
    function dR(e) {
      Yi = null, Cu(e);
    }
    function fR() {
      if ((it & (xv | yr | ps)) !== Mn) {
        (it & yr) !== Mn && g("unstable_flushDiscreteUpdates: Cannot flush updates when React is already rendering.");
        return;
      }
      pR(), tl();
    }
    function hR(e, t, s, l) {
      return co(zi, e.bind(null, t, s, l));
    }
    function pR() {
      if (wu !== null) {
        var e = wu;
        wu = null, e.forEach(function(t, s) {
          eb(s, t), wr(s);
        }), cs();
      }
    }
    function pC(e, t) {
      var s = it;
      it |= xv;
      try {
        return e(t);
      } finally {
        it = s, it === Mn && cs();
      }
    }
    function mR(e, t) {
      var s = it;
      it |= aR;
      try {
        return e(t);
      } finally {
        it = s, it === Mn && cs();
      }
    }
    function vR(e, t, s, l, d) {
      var p = it;
      it |= cC;
      try {
        return co(Yo, e.bind(null, t, s, l, d));
      } finally {
        it = p, it === Mn && cs();
      }
    }
    function mC(e, t) {
      var s = it;
      it &= ~xv, it |= kw;
      try {
        return e(t);
      } finally {
        it = s, it === Mn && cs();
      }
    }
    function vC(e, t) {
      if ((it & (yr | ps)) !== Mn)
        throw Error("flushSync was called from inside a lifecycle method. It cannot be called when React is already rendering.");
      var s = it;
      it |= xv;
      try {
        return co(zi, e.bind(null, t));
      } finally {
        it = s, cs();
      }
    }
    function xu(e, t) {
      e.finishedWork = null, e.finishedExpirationTime = De;
      var s = e.timeoutHandle;
      if (s !== ke && (e.timeoutHandle = ke, Me(s)), He !== null)
        for (var l = He.return; l !== null; )
          X0(l), l = l.return;
      Yi = e, He = Eu(e.current, null), li = t, Zn = yu, Ev = null, ho = Tt, Ph = Tt, Iv = null, _h = De, Av = !1, bu = null, pa.discardPendingWarnings();
    }
    function gC(e, t) {
      do {
        try {
          if (Fm(), m0(), ir(), He === null || He.return === null)
            return Zn = Cv, Ev = t, He = null, null;
          Mr && He.mode & ds && yv(He, !0), iR(e, He.return, He, t, li), He = xC(He);
        } catch (s) {
          t = s;
          continue;
        }
        return;
      } while (!0);
    }
    function yC(e) {
      var t = Dw.current;
      return Dw.current = mv, t === null ? mv : t;
    }
    function wC(e) {
      Dw.current = e;
    }
    function Pv(e) {
      {
        var t = h.__interactionsRef.current;
        return h.__interactionsRef.current = e.memoizedInteractions, t;
      }
    }
    function _v(e) {
      h.__interactionsRef.current = e;
    }
    function gR() {
      _w = mr();
    }
    function bC(e, t) {
      e < ho && e > uu && (ho = e), t !== null && e < Ph && e > uu && (Ph = e, Iv = t);
    }
    function zv(e) {
      e > _h && (_h = e);
    }
    function yR() {
      Zn === yu && (Zn = Tv);
    }
    function wR() {
      (Zn === yu || Zn === Tv) && (Zn = Mv), _h !== De && Yi !== null && (Iu(Yi, li), OC(Yi, _h));
    }
    function bR() {
      Zn !== Pw && (Zn = dC);
    }
    function SR() {
      return Zn === yu;
    }
    function xR(e) {
      var t = cu(e);
      return t - mh;
    }
    function CR(e, t) {
      var s = cu(e);
      return s - (t.timeoutMs | 0 || mh);
    }
    function TR() {
      for (; He !== null; )
        He = SC(He);
    }
    function MR() {
      for (; He !== null && !kA(); )
        He = SC(He);
    }
    function SC(e) {
      var t = e.alternate;
      dx(e), Co(e);
      var s;
      return (e.mode & ds) !== si ? (uw(e), s = Vw(t, e, li), yv(e, !0)) : s = Vw(t, e, li), ir(), e.memoizedProps = e.pendingProps, s === null && (s = xC(e)), uC.current = null, s;
    }
    function xC(e) {
      He = e;
      do {
        var t = He.alternate, s = He.return;
        if ((He.effectTag & _o) === _t) {
          Co(He);
          var l = void 0;
          if ((He.mode & ds) === si ? l = G0(t, He, li) : (uw(He), l = G0(t, He, li), yv(He, !1)), hx(He), ir(), ER(He), l !== null)
            return l;
          if (s !== null && (s.effectTag & _o) === _t) {
            s.firstEffect === null && (s.firstEffect = He.firstEffect), He.lastEffect !== null && (s.lastEffect !== null && (s.lastEffect.nextEffect = He.firstEffect), s.lastEffect = He.lastEffect);
            var d = He.effectTag;
            d > or && (s.lastEffect !== null ? s.lastEffect.nextEffect = He : s.firstEffect = He, s.lastEffect = He);
          }
        } else {
          var p = O1(He);
          if ((He.mode & ds) !== si) {
            yv(He, !1);
            for (var y = He.actualDuration, b = He.child; b !== null; )
              y += b.actualDuration, b = b.sibling;
            He.actualDuration = y;
          }
          if (p !== null)
            return CA(He), p.effectTag &= Sf, p;
          hx(He), s !== null && (s.firstEffect = s.lastEffect = null, s.effectTag |= _o);
        }
        var E = He.sibling;
        if (E !== null)
          return E;
        He = s;
      } while (He !== null);
      return Zn === yu && (Zn = Pw), null;
    }
    function jw(e) {
      var t = e.expirationTime, s = e.childExpirationTime;
      return t > s ? t : s;
    }
    function ER(e) {
      if (!(li !== fs && e.childExpirationTime === fs)) {
        var t = De;
        if ((e.mode & ds) !== si) {
          for (var s = e.actualDuration, l = e.selfBaseDuration, d = e.alternate === null || e.child !== e.alternate.child, p = e.child; p !== null; ) {
            var y = p.expirationTime, b = p.childExpirationTime;
            y > t && (t = y), b > t && (t = b), d && (s += p.actualDuration), l += p.treeBaseDuration, p = p.sibling;
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
    function Cu(e) {
      var t = ed();
      return co(zi, IR.bind(null, e, t)), null;
    }
    function IR(e, t) {
      do
        tl();
      while (yd !== null);
      if (VR(), (it & (yr | ps)) !== Mn)
        throw Error("Should not already be working.");
      var s = e.finishedWork, l = e.finishedExpirationTime;
      if (s === null)
        return null;
      if (e.finishedWork = null, e.finishedExpirationTime = De, s === e.current)
        throw Error("Cannot commit the same tree as before. This error is likely caused by a bug in React. Please file an issue.");
      e.callbackNode = null, e.callbackExpirationTime = De, e.callbackPriority = Kc, e.nextKnownPendingLevel = De, TA();
      var d = jw(s);
      pD(e, l, d), e === Yi && (Yi = null, He = null, li = De);
      var p;
      if (s.effectTag > or ? s.lastEffect !== null ? (s.lastEffect.nextEffect = s, p = s.firstEffect) : p = s : p = s.firstEffect, p !== null) {
        var y = it;
        it |= ps;
        var b = Pv(e);
        uC.current = null, vx(), n(e.containerInfo), Ue = p;
        do
          if (se(null, AR, null), oe()) {
            if (Ue === null)
              throw Error("Should be working on an effect.");
            var E = Le();
            Tu(Ue, E), Ue = Ue.nextEffect;
          }
        while (Ue !== null);
        gx(), I0(), yx(), Ue = p;
        do
          if (se(null, RR, null, e, t), oe()) {
            if (Ue === null)
              throw Error("Should be working on an effect.");
            var N = Le();
            Tu(Ue, N), Ue = Ue.nextEffect;
          }
        while (Ue !== null);
        wx(), a(e.containerInfo), e.current = s, bx(), Ue = p;
        do
          if (se(null, DR, null, e, l), oe()) {
            if (Ue === null)
              throw Error("Should be working on an effect.");
            var k = Le();
            Tu(Ue, k), Ue = Ue.nextEffect;
          }
        while (Ue !== null);
        Sx(), Ue = null, PA(), _v(b), it = y;
      } else
        e.current = s, vx(), gx(), I0(), yx(), wx(), bx(), Sx();
      MA();
      var X = zh;
      if (zh)
        zh = !1, yd = e, Ow = l, Oh = t;
      else
        for (Ue = p; Ue !== null; ) {
          var L = Ue.nextEffect;
          Ue.nextEffect = null, Ue = L;
        }
      var K = e.firstPendingTime;
      if (K !== De) {
        if (bu !== null) {
          var ve = bu;
          bu = null;
          for (var be = 0; be < ve.length; be++)
            DC(e, ve[be], e.memoizedInteractions);
        }
        nl(e, K);
      } else
        gd = null;
      if (X || kC(e, l), K === Tt ? e === Lw ? Lh++ : (Lh = 0, Lw = e) : Lh = 0, qR(s.stateNode, l), wr(e), Rv) {
        Rv = !1;
        var qe = zw;
        throw zw = null, qe;
      }
      return (it & kw) !== Mn || cs(), null;
    }
    function AR() {
      for (; Ue !== null; ) {
        var e = Ue.effectTag;
        if ((e & Va) !== _t) {
          Co(Ue), Nm();
          var t = Ue.alternate;
          H1(t, Ue), ir();
        }
        (e & Ha) !== _t && (zh || (zh = !0, hh(ha, function() {
          return tl(), null;
        }))), Ue = Ue.nextEffect;
      }
    }
    function RR(e, t) {
      for (; Ue !== null; ) {
        Co(Ue);
        var s = Ue.effectTag;
        if (s & Ii && eR(Ue), s & fi) {
          var l = Ue.alternate;
          l !== null && Z1(l);
        }
        var d = s & (Sn | Ct | Us | Fi);
        switch (d) {
          case Sn: {
            rC(Ue), Ue.effectTag &= ~Sn;
            break;
          }
          case _p: {
            rC(Ue), Ue.effectTag &= ~Sn;
            var p = Ue.alternate;
            Rw(p, Ue);
            break;
          }
          case Fi: {
            Ue.effectTag &= ~Fi;
            break;
          }
          case fc: {
            Ue.effectTag &= ~Fi;
            var y = Ue.alternate;
            Rw(y, Ue);
            break;
          }
          case Ct: {
            var b = Ue.alternate;
            Rw(b, Ue);
            break;
          }
          case Us: {
            J1(e, Ue, t);
            break;
          }
        }
        Nm(), ir(), Ue = Ue.nextEffect;
      }
    }
    function DR(e, t) {
      for (; Ue !== null; ) {
        Co(Ue);
        var s = Ue.effectTag;
        if (s & (Ct | wf)) {
          Nm();
          var l = Ue.alternate;
          F1(e, l, Ue);
        }
        s & fi && (Nm(), Q1(Ue)), ir(), Ue = Ue.nextEffect;
      }
    }
    function tl() {
      if (Oh !== Kc) {
        var e = Oh > ha ? ha : Oh;
        return Oh = Kc, co(e, NR);
      }
    }
    function NR() {
      if (yd === null)
        return !1;
      var e = yd, t = Ow;
      if (yd = null, Ow = De, (it & (yr | ps)) !== Mn)
        throw Error("Cannot flush passive effects while already rendering.");
      var s = it;
      it |= ps;
      for (var l = Pv(e), d = e.current.firstEffect; d !== null; ) {
        {
          if (Co(d), se(null, W1, null, d), oe()) {
            if (d === null)
              throw Error("Should be working on an effect.");
            var p = Le();
            Tu(d, p);
          }
          ir();
        }
        var y = d.nextEffect;
        d.nextEffect = null, d = y;
      }
      return _v(l), kC(e, t), it = s, cs(), Dv = yd === null ? 0 : Dv + 1, !0;
    }
    function CC(e) {
      return gd !== null && gd.has(e);
    }
    function kR(e) {
      gd === null ? gd = /* @__PURE__ */ new Set([e]) : gd.add(e);
    }
    function PR(e) {
      Rv || (Rv = !0, zw = e);
    }
    var _R = PR;
    function TC(e, t, s) {
      var l = Mw(s, t), d = oC(e, l, Tt);
      Xo(e, d);
      var p = Nv(e, Tt);
      p !== null && (wr(p), nl(p, Tt));
    }
    function Tu(e, t) {
      if (e.tag === Ce) {
        TC(e, e, t);
        return;
      }
      for (var s = e.return; s !== null; ) {
        if (s.tag === Ce) {
          TC(s, e, t);
          return;
        } else if (s.tag === xe) {
          var l = s.type, d = s.stateNode;
          if (typeof l.getDerivedStateFromError == "function" || typeof d.componentDidCatch == "function" && !CC(d)) {
            var p = Mw(t, e), y = lC(
              s,
              p,
              Tt
            );
            Xo(s, y);
            var b = Nv(s, Tt);
            b !== null && (wr(b), nl(b, Tt));
            return;
          }
        }
        s = s.return;
      }
    }
    function zR(e, t, s) {
      var l = e.pingCache;
      if (l !== null && l.delete(t), Yi === e && li === s) {
        Zn === Mv || Zn === Tv && ho === Tt && mr() - _w < fC ? xu(e, li) : Av = !0;
        return;
      }
      if (!!zC(e, s)) {
        var d = e.lastPingedTime;
        d !== De && d < s || (e.lastPingedTime = s, wr(e), nl(e, s));
      }
    }
    function OR(e, t) {
      if (t === De) {
        var s = null, l = ms();
        t = Su(l, e, s);
      }
      var d = Nv(e, t);
      d !== null && (wr(d), nl(d, t));
    }
    function LR(e, t) {
      var s = De, l;
      l = e.stateNode, l !== null && l.delete(t), OR(e, s);
    }
    function BR(e) {
      return e < 120 ? 120 : e < 480 ? 480 : e < 1080 ? 1080 : e < 1920 ? 1920 : e < 3e3 ? 3e3 : e < 4320 ? 4320 : rR(e / 1960) * 1960;
    }
    function jR(e, t, s) {
      var l = s.busyMinDurationMs | 0;
      if (l <= 0)
        return 0;
      var d = s.busyDelayMs | 0, p = mr(), y = CR(e, s), b = p - y;
      if (b <= d)
        return 0;
      var E = d + l - b;
      return E;
    }
    function UR() {
      if (Lh > sR)
        throw Lh = 0, Lw = null, Error("Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.");
      Dv > oR && (Dv = 0, g("Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render."));
    }
    function VR() {
      pa.flushLegacyContextWarning(), pa.flushPendingUnsafeLifecycleWarnings();
    }
    function MC() {
      var e = !0;
      mx(Bh, e), Bh = null;
    }
    function Uw() {
      var e = !1;
      mx(Bh, e), Bh = null;
    }
    function HR(e, t) {
      Yi !== null && t > li && (Bh = e);
    }
    var Ov = null;
    function WR(e) {
      {
        var t = e.tag;
        if (t !== Ce && t !== xe && t !== fe && t !== D && t !== ye && t !== me && t !== St)
          return;
        var s = Te(e.type) || "ReactComponent";
        if (Ov !== null) {
          if (Ov.has(s))
            return;
          Ov.add(s);
        } else
          Ov = /* @__PURE__ */ new Set([s]);
        g("Can't perform a React state update on an unmounted component. This is a no-op, but it indicates a memory leak in your application. To fix, cancel all subscriptions and asynchronous tasks in %s.%s", t === xe ? "the componentWillUnmount method" : "a useEffect cleanup function", Fn(e));
      }
    }
    var Vw;
    {
      var FR = null;
      Vw = function(e, t, s) {
        var l = _C(FR, t);
        try {
          return F0(e, t, s);
        } catch (p) {
          if (p !== null && typeof p == "object" && typeof p.then == "function")
            throw p;
          if (Fm(), m0(), X0(t), _C(t, l), t.mode & ds && uw(t), se(null, F0, null, e, t, s), oe()) {
            var d = Le();
            throw d;
          } else
            throw p;
        }
      };
    }
    var EC = !1, Hw;
    Hw = /* @__PURE__ */ new Set();
    function $R(e) {
      if (vl && (it & yr) !== Mn)
        switch (e.tag) {
          case fe:
          case D:
          case me: {
            var t = He && Te(He.type) || "Unknown", s = t;
            if (!Hw.has(s)) {
              Hw.add(s);
              var l = Te(e.type) || "Unknown";
              g("Cannot update a component (`%s`) while rendering a different component (`%s`). To locate the bad setState() call inside `%s`, follow the stack trace as described in https://fb.me/setstate-in-render", l, t, t);
            }
            break;
          }
          case xe: {
            EC || (g("Cannot update during an existing state transition (such as within `render`). Render methods should be a pure function of props and state."), EC = !0);
            break;
          }
        }
    }
    var Mu = {
      current: !1
    };
    function IC(e) {
      Nw.current === !0 && Mu.current !== !0 && g(`It looks like you're using the wrong act() around your test interactions.
Be sure to use the matching version of act() corresponding to your renderer:

// for react-dom:
import {act} from 'react-dom/test-utils';
// ...
act(() => ...);

// for react-test-renderer:
import TestRenderer from 'react-test-renderer';
const {act} = TestRenderer;
// ...
act(() => ...);%s`, Fn(e));
    }
    function AC(e) {
      (e.mode & gn) !== si && Nw.current === !1 && Mu.current === !1 && g(`An update to %s ran an effect, but was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://fb.me/react-wrap-tests-with-act%s`, Te(e.type), Fn(e));
    }
    function QR(e) {
      it === Mn && Nw.current === !1 && Mu.current === !1 && g(`An update to %s inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://fb.me/react-wrap-tests-with-act%s`, Te(e.type), Fn(e));
    }
    var ZR = QR, RC = !1;
    function YR(e) {
      RC === !1 && o.unstable_flushAllWithoutAsserting === void 0 && (e.mode & Vr || e.mode & td) && (RC = !0, g(`In Concurrent or Sync modes, the "scheduler" module needs to be mocked to guarantee consistent behaviour across tests and browsers. For example, with jest: 
jest.mock('scheduler', () => require('scheduler/unstable_mock'));

For more info, visit https://fb.me/react-mock-scheduler`));
    }
    function Ww(e, t) {
      return t * 1e3 + e.interactionThreadID;
    }
    function Fw(e) {
      bu === null ? bu = [e] : bu.push(e);
    }
    function DC(e, t, s) {
      if (s.size > 0) {
        var l = e.pendingInteractionMap, d = l.get(t);
        d != null ? s.forEach(function(b) {
          d.has(b) || b.__count++, d.add(b);
        }) : (l.set(t, new Set(s)), s.forEach(function(b) {
          b.__count++;
        }));
        var p = h.__subscriberRef.current;
        if (p !== null) {
          var y = Ww(e, t);
          p.onWorkScheduled(s, y);
        }
      }
    }
    function nl(e, t) {
      DC(e, t, h.__interactionsRef.current);
    }
    function NC(e, t) {
      var s = /* @__PURE__ */ new Set();
      if (e.pendingInteractionMap.forEach(function(p, y) {
        y >= t && p.forEach(function(b) {
          return s.add(b);
        });
      }), e.memoizedInteractions = s, s.size > 0) {
        var l = h.__subscriberRef.current;
        if (l !== null) {
          var d = Ww(e, t);
          try {
            l.onWorkStarted(s, d);
          } catch (p) {
            hh(zi, function() {
              throw p;
            });
          }
        }
      }
    }
    function kC(e, t) {
      var s = e.firstPendingTime, l;
      try {
        if (l = h.__subscriberRef.current, l !== null && e.memoizedInteractions.size > 0) {
          var d = Ww(e, t);
          l.onWorkStopped(e.memoizedInteractions, d);
        }
      } catch (y) {
        hh(zi, function() {
          throw y;
        });
      } finally {
        var p = e.pendingInteractionMap;
        p.forEach(function(y, b) {
          b > s && (p.delete(b), y.forEach(function(E) {
            if (E.__count--, l !== null && E.__count === 0)
              try {
                l.onInteractionScheduledWorkCompleted(E);
              } catch (N) {
                hh(zi, function() {
                  throw N;
                });
              }
          }));
        });
      }
    }
    var $w = null, Qw = null, Zw = null, wd = !1, GR = typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u";
    function XR(e) {
      if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u")
        return !1;
      var t = __REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (t.isDisabled)
        return !0;
      if (!t.supportsFiber)
        return g("The installed version of React DevTools is too old and will not work with the current version of React. Please update React DevTools. https://fb.me/react-devtools"), !0;
      try {
        var s = t.inject(e);
        typeof t.onScheduleFiberRoot == "function" && ($w = function(l, d) {
          try {
            t.onScheduleFiberRoot(s, l, d);
          } catch (p) {
            wd || (wd = !0, g("React instrumentation encountered an error: %s", p));
          }
        }), Qw = function(l, d) {
          try {
            var p = (l.current.effectTag & jt) === jt;
            if (Mr) {
              var y = lR(), b = Wx(y, d);
              t.onCommitFiberRoot(s, l, b, p);
            }
          } catch (E) {
            wd || (wd = !0, g("React instrumentation encountered an error: %s", E));
          }
        }, Zw = function(l) {
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
    function JR(e, t) {
      typeof $w == "function" && $w(e, t);
    }
    function qR(e, t) {
      typeof Qw == "function" && Qw(e, t);
    }
    function KR(e) {
      typeof Zw == "function" && Zw(e);
    }
    var Yw;
    {
      Yw = !1;
      try {
        var PC = Object.preventExtensions({}), eD = /* @__PURE__ */ new Map([[PC, null]]), tD = /* @__PURE__ */ new Set([PC]);
        eD.set(0, 0), tD.add(0);
      } catch {
        Yw = !0;
      }
    }
    var nD = 1;
    function iD(e, t, s, l) {
      this.tag = e, this.key = s, this.elementType = null, this.type = null, this.stateNode = null, this.return = null, this.child = null, this.sibling = null, this.index = 0, this.ref = null, this.pendingProps = t, this.memoizedProps = null, this.updateQueue = null, this.memoizedState = null, this.dependencies = null, this.mode = l, this.effectTag = _t, this.nextEffect = null, this.firstEffect = null, this.lastEffect = null, this.expirationTime = De, this.childExpirationTime = De, this.alternate = null, this.actualDuration = Number.NaN, this.actualStartTime = Number.NaN, this.selfBaseDuration = Number.NaN, this.treeBaseDuration = Number.NaN, this.actualDuration = 0, this.actualStartTime = -1, this.selfBaseDuration = 0, this.treeBaseDuration = 0, this._debugID = nD++, this._debugIsCurrentlyTiming = !1, this._debugSource = null, this._debugOwner = null, this._debugNeedsRemount = !1, this._debugHookTypes = null, !Yw && typeof Object.preventExtensions == "function" && Object.preventExtensions(this);
    }
    var ya = function(e, t, s, l) {
      return new iD(e, t, s, l);
    };
    function Gw(e) {
      var t = e.prototype;
      return !!(t && t.isReactComponent);
    }
    function rD(e) {
      return typeof e == "function" && !Gw(e) && e.defaultProps === void 0;
    }
    function aD(e) {
      if (typeof e == "function")
        return Gw(e) ? xe : fe;
      if (e != null) {
        var t = e.$$typeof;
        if (t === ti)
          return D;
        if (t === ta)
          return ye;
      }
      return We;
    }
    function Eu(e, t) {
      var s = e.alternate;
      s === null ? (s = ya(e.tag, t, e.key, e.mode), s.elementType = e.elementType, s.type = e.type, s.stateNode = e.stateNode, s._debugID = e._debugID, s._debugSource = e._debugSource, s._debugOwner = e._debugOwner, s._debugHookTypes = e._debugHookTypes, s.alternate = e, e.alternate = s) : (s.pendingProps = t, s.effectTag = _t, s.nextEffect = null, s.firstEffect = null, s.lastEffect = null, s.actualDuration = 0, s.actualStartTime = -1), s.childExpirationTime = e.childExpirationTime, s.expirationTime = e.expirationTime, s.child = e.child, s.memoizedProps = e.memoizedProps, s.memoizedState = e.memoizedState, s.updateQueue = e.updateQueue;
      var l = e.dependencies;
      switch (s.dependencies = l === null ? null : {
        expirationTime: l.expirationTime,
        firstContext: l.firstContext,
        responders: l.responders
      }, s.sibling = e.sibling, s.index = e.index, s.ref = e.ref, s.selfBaseDuration = e.selfBaseDuration, s.treeBaseDuration = e.treeBaseDuration, s._debugNeedsRemount = e._debugNeedsRemount, s.tag) {
        case We:
        case fe:
        case me:
          s.type = id(e.type);
          break;
        case xe:
          s.type = fy(e.type);
          break;
        case D:
          s.type = hy(e.type);
          break;
      }
      return s;
    }
    function sD(e, t) {
      e.effectTag &= Sn, e.nextEffect = null, e.firstEffect = null, e.lastEffect = null;
      var s = e.alternate;
      if (s === null)
        e.childExpirationTime = De, e.expirationTime = t, e.child = null, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.selfBaseDuration = 0, e.treeBaseDuration = 0;
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
    function oD(e) {
      var t;
      return e === AA ? t = td | Vr | gn : e === IA ? t = Vr | gn : t = si, GR && (t |= ds), ya(Ce, null, null, t);
    }
    function Xw(e, t, s, l, d, p) {
      var y, b = We, E = e;
      if (typeof e == "function")
        Gw(e) ? (b = xe, E = fy(E)) : E = id(E);
      else if (typeof e == "string")
        b = Ne;
      else {
        e:
          switch (e) {
            case Be:
              return il(s.children, d, p, t);
            case Cn:
              b = Xt, d |= td | Vr | gn;
              break;
            case et:
              b = Xt, d |= gn;
              break;
            case kt:
              return lD(s, d, p, t);
            case ni:
              return uD(s, d, p, t);
            case So:
              return cD(s, d, p, t);
            default: {
              if (typeof e == "object" && e !== null)
                switch (e.$$typeof) {
                  case vn:
                    b = re;
                    break e;
                  case bn:
                    b = Ge;
                    break e;
                  case ti:
                    b = D, E = hy(E);
                    break e;
                  case ta:
                    b = ye;
                    break e;
                  case nr:
                    b = ot, E = null;
                    break e;
                  case xo:
                    b = St;
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
      return y = ya(b, s, t, d), y.elementType = e, y.type = E, y.expirationTime = p, y;
    }
    function Jw(e, t, s) {
      var l = null;
      l = e._owner;
      var d = e.type, p = e.key, y = e.props, b = Xw(d, p, y, l, t, s);
      return b._debugSource = e._source, b._debugOwner = e._owner, b;
    }
    function il(e, t, s, l) {
      var d = ya(bt, e, l, t);
      return d.expirationTime = s, d;
    }
    function lD(e, t, s, l) {
      (typeof e.id != "string" || typeof e.onRender != "function") && g('Profiler must specify an "id" string and "onRender" function as props');
      var d = ya(B, e, l, t | ds);
      return d.elementType = kt, d.type = kt, d.expirationTime = s, d;
    }
    function uD(e, t, s, l) {
      var d = ya(ee, e, l, t);
      return d.type = ni, d.elementType = ni, d.expirationTime = s, d;
    }
    function cD(e, t, s, l) {
      var d = ya(dt, e, l, t);
      return d.type = So, d.elementType = So, d.expirationTime = s, d;
    }
    function qw(e, t, s) {
      var l = ya($e, e, null, t);
      return l.expirationTime = s, l;
    }
    function dD() {
      var e = ya(Ne, null, null, si);
      return e.elementType = "DELETED", e.type = "DELETED", e;
    }
    function Kw(e, t, s) {
      var l = e.children !== null ? e.children : [], d = ya(Ve, l, e.key, t);
      return d.expirationTime = s, d.stateNode = {
        containerInfo: e.containerInfo,
        pendingChildren: null,
        implementation: e.implementation
      }, d;
    }
    function _C(e, t) {
      return e === null && (e = ya(We, null, null, si)), e.tag = t.tag, e.key = t.key, e.elementType = t.elementType, e.type = t.type, e.stateNode = t.stateNode, e.return = t.return, e.child = t.child, e.sibling = t.sibling, e.index = t.index, e.ref = t.ref, e.pendingProps = t.pendingProps, e.memoizedProps = t.memoizedProps, e.updateQueue = t.updateQueue, e.memoizedState = t.memoizedState, e.dependencies = t.dependencies, e.mode = t.mode, e.effectTag = t.effectTag, e.nextEffect = t.nextEffect, e.firstEffect = t.firstEffect, e.lastEffect = t.lastEffect, e.expirationTime = t.expirationTime, e.childExpirationTime = t.childExpirationTime, e.alternate = t.alternate, e.actualDuration = t.actualDuration, e.actualStartTime = t.actualStartTime, e.selfBaseDuration = t.selfBaseDuration, e.treeBaseDuration = t.treeBaseDuration, e._debugID = t._debugID, e._debugSource = t._debugSource, e._debugOwner = t._debugOwner, e._debugIsCurrentlyTiming = t._debugIsCurrentlyTiming, e._debugNeedsRemount = t._debugNeedsRemount, e._debugHookTypes = t._debugHookTypes, e;
    }
    function fD(e, t, s) {
      this.tag = t, this.current = null, this.containerInfo = e, this.pendingChildren = null, this.pingCache = null, this.finishedExpirationTime = De, this.finishedWork = null, this.timeoutHandle = ke, this.context = null, this.pendingContext = null, this.hydrate = s, this.callbackNode = null, this.callbackPriority = Kc, this.firstPendingTime = De, this.firstSuspendedTime = De, this.lastSuspendedTime = De, this.nextKnownPendingLevel = De, this.lastPingedTime = De, this.lastExpiredTime = De, this.interactionThreadID = h.unstable_getThreadID(), this.memoizedInteractions = /* @__PURE__ */ new Set(), this.pendingInteractionMap = /* @__PURE__ */ new Map();
    }
    function hD(e, t, s, l) {
      var d = new fD(e, t, s), p = oD(t);
      return d.current = p, p.stateNode = d, Sy(p), d;
    }
    function zC(e, t) {
      var s = e.firstSuspendedTime, l = e.lastSuspendedTime;
      return s !== De && s >= t && l <= t;
    }
    function Iu(e, t) {
      var s = e.firstSuspendedTime, l = e.lastSuspendedTime;
      s < t && (e.firstSuspendedTime = t), (l > t || s === De) && (e.lastSuspendedTime = t), t <= e.lastPingedTime && (e.lastPingedTime = De), t <= e.lastExpiredTime && (e.lastExpiredTime = De);
    }
    function OC(e, t) {
      var s = e.firstPendingTime;
      t > s && (e.firstPendingTime = t);
      var l = e.firstSuspendedTime;
      l !== De && (t >= l ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = De : t >= e.lastSuspendedTime && (e.lastSuspendedTime = t + 1), t > e.nextKnownPendingLevel && (e.nextKnownPendingLevel = t));
    }
    function pD(e, t, s) {
      e.firstPendingTime = s, t <= e.lastSuspendedTime ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = De : t <= e.firstSuspendedTime && (e.firstSuspendedTime = t - 1), t <= e.lastPingedTime && (e.lastPingedTime = De), t <= e.lastExpiredTime && (e.lastExpiredTime = De);
    }
    function eb(e, t) {
      var s = e.lastExpiredTime;
      (s === De || s > t) && (e.lastExpiredTime = t);
    }
    var tb, nb;
    tb = !1, nb = {};
    function mD(e) {
      if (!e)
        return pr;
      var t = ua(e), s = EA(t);
      if (t.tag === xe) {
        var l = t.type;
        if (us(l))
          return Tx(t, l, s);
      }
      return s;
    }
    function vD(e, t) {
      {
        var s = ua(e);
        if (s === void 0)
          throw typeof e.render == "function" ? Error("Unable to find node on an unmounted component.") : Error("Argument appears to not be a ReactComponent. Keys: " + Object.keys(e));
        var l = Cf(s);
        if (l === null)
          return null;
        if (l.mode & gn) {
          var d = Te(s.type) || "Component";
          nb[d] || (nb[d] = !0, s.mode & gn ? g("%s is deprecated in StrictMode. %s was passed an instance of %s which is inside StrictMode. Instead, add a ref directly to the element you want to reference. Learn more about using refs safely here: https://fb.me/react-strict-mode-find-node%s", t, t, d, Fn(l)) : g("%s is deprecated in StrictMode. %s was passed an instance of %s which renders StrictMode children. Instead, add a ref directly to the element you want to reference. Learn more about using refs safely here: https://fb.me/react-strict-mode-find-node%s", t, t, d, Fn(l)));
        }
        return l.stateNode;
      }
    }
    function gD(e, t, s, l) {
      return hD(e, t, s);
    }
    function Uh(e, t, s, l) {
      JR(t, e);
      var d = t.current, p = ms();
      typeof jest < "u" && (YR(d), IC(d));
      var y = Ch(), b = Su(p, d, y), E = mD(s);
      t.context === null ? t.context = E : t.pendingContext = E, vl && na !== null && !tb && (tb = !0, g(`Render methods should be a pure function of props and state; triggering nested component updates from render is not allowed. If necessary, trigger nested updates in componentDidUpdate.

Check the render method of %s.`, Te(na.type) || "Unknown"));
      var N = Go(b, y);
      return N.payload = {
        element: e
      }, l = l === void 0 ? null : l, l !== null && (typeof l != "function" && g("render(...): Expected the last optional `callback` argument to be a function. Instead received: %s.", l), N.callback = l), Xo(d, N), Qr(d, b), b;
    }
    function ib(e) {
      var t = e.current;
      if (!t.child)
        return null;
      switch (t.child.tag) {
        case Ne:
          return t.child.stateNode;
        default:
          return t.child.stateNode;
      }
    }
    function LC(e, t) {
      var s = e.memoizedState;
      s !== null && s.dehydrated !== null && s.retryTime < t && (s.retryTime = t);
    }
    function rb(e, t) {
      LC(e, t);
      var s = e.alternate;
      s && LC(s, t);
    }
    function yD(e) {
      if (e.tag === ee) {
        var t = Hx(ms());
        Qr(e, t), rb(e, t);
      }
    }
    function wD(e) {
      e.tag === ee && (Qr(e, Bx), rb(e, Bx));
    }
    function bD(e) {
      if (e.tag === ee) {
        var t = ms(), s = Su(t, e, null);
        Qr(e, s), rb(e, s);
      }
    }
    function BC(e) {
      var t = Ol(e);
      return t === null ? null : t.tag === Mt ? t.stateNode.instance : t.stateNode;
    }
    var jC = function(e) {
      return !1;
    };
    function SD(e) {
      return jC(e);
    }
    var UC = null, VC = null, HC = null, WC = null;
    {
      var FC = function(e, t, s, l) {
        if (s >= t.length)
          return l;
        var d = t[s], p = Array.isArray(e) ? e.slice() : i({}, e);
        return p[d] = FC(e[d], t, s + 1, l), p;
      }, $C = function(e, t, s) {
        return FC(e, t, 0, s);
      };
      UC = function(e, t, s, l) {
        for (var d = e.memoizedState; d !== null && t > 0; )
          d = d.next, t--;
        if (d !== null) {
          var p = $C(d.memoizedState, s, l);
          d.memoizedState = p, d.baseState = p, e.memoizedProps = i({}, e.memoizedProps), Qr(e, Tt);
        }
      }, VC = function(e, t, s) {
        e.pendingProps = $C(e.memoizedProps, t, s), e.alternate && (e.alternate.pendingProps = e.pendingProps), Qr(e, Tt);
      }, HC = function(e) {
        Qr(e, Tt);
      }, WC = function(e) {
        jC = e;
      };
    }
    function xD(e) {
      var t = e.findFiberByHostInstance, s = m.ReactCurrentDispatcher;
      return XR(i({}, e, {
        overrideHookState: UC,
        overrideProps: VC,
        setSuspenseHandler: WC,
        scheduleUpdate: HC,
        currentDispatcherRef: s,
        findHostInstanceByFiber: function(l) {
          var d = Cf(l);
          return d === null ? null : d.stateNode;
        },
        findFiberByHostInstance: function(l) {
          return t ? t(l) : null;
        },
        findHostInstancesForRefresh: HA,
        scheduleRefresh: UA,
        scheduleRoot: VA,
        setRefreshHandler: jA,
        getCurrentFiber: function() {
          return na;
        }
      }));
    }
    m.IsSomeRendererActing;
    function ab(e, t, s) {
      this._internalRoot = CD(e, t, s);
    }
    ab.prototype.render = function(e) {
      var t = this._internalRoot;
      {
        typeof arguments[1] == "function" && g("render(...): does not support the second callback argument. To execute a side effect after rendering, declare it in a component body with useEffect().");
        var s = t.containerInfo;
        if (s.nodeType !== ri) {
          var l = BC(t.current);
          l && l.parentNode !== s && g("render(...): It looks like the React-rendered content of the root container was removed without using React. This is not supported and will cause errors. Instead, call root.unmount() to empty a root's container.");
        }
      }
      Uh(e, t, null, null);
    }, ab.prototype.unmount = function() {
      typeof arguments[0] == "function" && g("unmount(...): does not support a callback argument. To execute a side effect after rendering, declare it in a component body with useEffect().");
      var e = this._internalRoot, t = e.containerInfo;
      Uh(null, e, null, function() {
        zS(t);
      });
    };
    function CD(e, t, s) {
      var l = s != null && s.hydrate === !0;
      s != null && s.hydrationOptions;
      var d = gD(e, t, l);
      if (aI(d.current, e), l && t !== Ex) {
        var p = e.nodeType === Pa ? e : e.ownerDocument;
        bc(e, p);
      }
      return d;
    }
    function TD(e, t) {
      return new ab(e, Ex, t);
    }
    function bd(e) {
      return !!(e && (e.nodeType === rr || e.nodeType === Pa || e.nodeType === qu || e.nodeType === ri && e.nodeValue === " react-mount-point-unstable "));
    }
    var MD = m.ReactCurrentOwner, QC, ZC = !1;
    QC = function(e) {
      if (e._reactRootContainer && e.nodeType !== ri) {
        var t = BC(e._reactRootContainer._internalRoot.current);
        t && t.parentNode !== e && g("render(...): It looks like the React-rendered content of this container was removed without using React. This is not supported and will cause errors. Instead, call ReactDOM.unmountComponentAtNode to empty a container.");
      }
      var s = !!e._reactRootContainer, l = Lv(e), d = !!(l && Zo(l));
      d && !s && g("render(...): Replacing React-rendered children with a new root component. If you intended to update the children of this node, you should instead have the existing children update their state and render the new components instead of calling ReactDOM.render."), e.nodeType === rr && e.tagName && e.tagName.toUpperCase() === "BODY" && g("render(): Rendering components directly into document.body is discouraged, since its children are often manipulated by third-party scripts and browser extensions. This may lead to subtle reconciliation issues. Try rendering into a container element created for your app.");
    };
    function Lv(e) {
      return e ? e.nodeType === Pa ? e.documentElement : e.firstChild : null;
    }
    function ED(e) {
      var t = Lv(e);
      return !!(t && t.nodeType === rr && t.hasAttribute(ce));
    }
    function ID(e, t) {
      var s = t || ED(e);
      if (!s)
        for (var l = !1, d; d = e.lastChild; )
          !l && d.nodeType === rr && d.hasAttribute(ce) && (l = !0, g("render(): Target node has markup rendered by React, but there are unrelated nodes as well. This is most commonly caused by white-space inserted around server-rendered markup.")), e.removeChild(d);
      return s && !t && !ZC && (ZC = !0, w("render(): Calling ReactDOM.render() to hydrate server-rendered markup will stop working in React v17. Replace the ReactDOM.render() call with ReactDOM.hydrate() if you want React to attach to the server HTML.")), TD(e, s ? {
        hydrate: !0
      } : void 0);
    }
    function AD(e, t) {
      e !== null && typeof e != "function" && g("%s(...): Expected the last optional `callback` argument to be a function. Instead received: %s.", t, e);
    }
    function Bv(e, t, s, l, d) {
      QC(s), AD(d === void 0 ? null : d, "render");
      var p = s._reactRootContainer, y;
      if (p) {
        if (y = p._internalRoot, typeof d == "function") {
          var E = d;
          d = function() {
            var N = ib(y);
            E.call(N);
          };
        }
        Uh(t, y, e, d);
      } else {
        if (p = s._reactRootContainer = ID(s, l), y = p._internalRoot, typeof d == "function") {
          var b = d;
          d = function() {
            var N = ib(y);
            b.call(N);
          };
        }
        mC(function() {
          Uh(t, y, e, d);
        });
      }
      return ib(y);
    }
    function RD(e) {
      {
        var t = MD.current;
        if (t !== null && t.stateNode !== null) {
          var s = t.stateNode._warnedAboutRefsInRender;
          s || g("%s is accessing findDOMNode inside its render(). render() should be a pure function of props and state. It should never access something that requires stale data from the previous render, such as refs. Move this logic to componentDidMount and componentDidUpdate instead.", Te(t.type) || "A component"), t.stateNode._warnedAboutRefsInRender = !0;
        }
      }
      return e == null ? null : e.nodeType === rr ? e : vD(e, "findDOMNode");
    }
    function DD(e, t, s) {
      if (!bd(t))
        throw Error("Target container is not a DOM element.");
      {
        var l = Vg(t) && t._reactRootContainer === void 0;
        l && g("You are calling ReactDOM.hydrate() on a container that was previously passed to ReactDOM.createRoot(). This is not supported. Did you mean to call createRoot(container, {hydrate: true}).render(element)?");
      }
      return Bv(null, e, t, !0, s);
    }
    function ND(e, t, s) {
      if (!bd(t))
        throw Error("Target container is not a DOM element.");
      {
        var l = Vg(t) && t._reactRootContainer === void 0;
        l && g("You are calling ReactDOM.render() on a container that was previously passed to ReactDOM.createRoot(). This is not supported. Did you mean to call root.render(element)?");
      }
      return Bv(null, e, t, !1, s);
    }
    function kD(e, t, s, l) {
      if (!bd(s))
        throw Error("Target container is not a DOM element.");
      if (!(e != null && yf(e)))
        throw Error("parentComponent must be a valid React Component");
      return Bv(e, t, s, !1, l);
    }
    function PD(e) {
      if (!bd(e))
        throw Error("unmountComponentAtNode(...): Target container is not a DOM element.");
      {
        var t = Vg(e) && e._reactRootContainer === void 0;
        t && g("You are calling ReactDOM.unmountComponentAtNode() on a container that was previously passed to ReactDOM.createRoot(). This is not supported. Did you mean to call root.unmount()?");
      }
      if (e._reactRootContainer) {
        {
          var s = Lv(e), l = s && !Zo(s);
          l && g("unmountComponentAtNode(): The node you're attempting to unmount was rendered by another copy of React.");
        }
        return mC(function() {
          Bv(null, null, e, !1, function() {
            e._reactRootContainer = null, zS(e);
          });
        }), !0;
      } else {
        {
          var d = Lv(e), p = !!(d && Zo(d)), y = e.nodeType === rr && bd(e.parentNode) && !!e.parentNode._reactRootContainer;
          p && g("unmountComponentAtNode(): The node you're attempting to unmount was rendered by React and is not a top-level container. %s", y ? "You may have accidentally passed in a React root node instead of its container." : "Instead, have the parent component update its state and rerender in order to remove this component.");
        }
        return !1;
      }
    }
    function _D(e, t, s) {
      var l = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : null;
      return {
        $$typeof: Ye,
        key: l == null ? null : "" + l,
        children: e,
        containerInfo: t,
        implementation: s
      };
    }
    var YC = "16.14.0";
    Ef(yD), gc(wD), wc(bD);
    var GC = !1;
    (typeof Map != "function" || Map.prototype == null || typeof Map.prototype.forEach != "function" || typeof Set != "function" || Set.prototype == null || typeof Set.prototype.clear != "function" || typeof Set.prototype.forEach != "function") && g("React depends on Map and Set built-in types. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"), Ia(hm), Ts(pC, vR, fR, mR);
    function XC(e, t) {
      var s = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
      if (!bd(t))
        throw Error("Target container is not a DOM element.");
      return _D(e, t, null, s);
    }
    function zD(e, t, s, l) {
      return kD(e, t, s, l);
    }
    function OD(e, t) {
      var s = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
      return GC || (GC = !0, w('The ReactDOM.unstable_createPortal() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactDOM.createPortal() instead. It has the exact same API, but without the "unstable_" prefix.')), XC(e, t, s);
    }
    var LD = {
      Events: [Zo, iu, Hg, Tr, Fe, $c, vI, xi, Cs, Fl, mc, tl, Mu]
    }, BD = xD({
      findFiberByHostInstance: eh,
      bundleType: 1,
      version: YC,
      rendererPackageName: "react-dom"
    });
    if (!BD && Bn && window.top === window.self && (navigator.userAgent.indexOf("Chrome") > -1 && navigator.userAgent.indexOf("Edge") === -1 || navigator.userAgent.indexOf("Firefox") > -1)) {
      var JC = window.location.protocol;
      /^(https?|file):$/.test(JC) && console.info("%cDownload the React DevTools for a better development experience: https://fb.me/react-devtools" + (JC === "file:" ? `
You might need to use a local HTTP server (instead of file://): https://fb.me/react-devtools-faq` : ""), "font-weight:bold");
    }
    Sr.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = LD, Sr.createPortal = XC, Sr.findDOMNode = RD, Sr.flushSync = vC, Sr.hydrate = DD, Sr.render = ND, Sr.unmountComponentAtNode = PD, Sr.unstable_batchedUpdates = pC, Sr.unstable_createPortal = OD, Sr.unstable_renderSubtreeIntoContainer = zD, Sr.version = YC;
  }()), Sr;
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
  process.env.NODE_ENV === "production" ? (i(), r.exports = lO()) : r.exports = fO();
})(OE);
const iM = /* @__PURE__ */ _E(OE.exports);
var hO = Object.defineProperty, pO = Object.defineProperties, mO = Object.getOwnPropertyDescriptors, rM = Object.getOwnPropertySymbols, vO = Object.prototype.hasOwnProperty, gO = Object.prototype.propertyIsEnumerable, aM = (r, i, o) => i in r ? hO(r, i, { enumerable: !0, configurable: !0, writable: !0, value: o }) : r[i] = o, Cr = (r, i) => {
  for (var o in i || (i = {}))
    vO.call(i, o) && aM(r, o, i[o]);
  if (rM)
    for (var o of rM(i))
      gO.call(i, o) && aM(r, o, i[o]);
  return r;
};
const BE = { src: "", currentTime: 0, hostTime: 0, muted: !1, paused: !0, volume: 1 }, jE = { currentTimeMaxError: 1, syncInterval: 1e3, retryInterval: 15e3, verbose: !1, log: console.log.bind(console) };
let mo = jE;
function UE(r) {
  mo = Cr(Cr({}, jE), r);
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
const yO = navigator.userAgent.includes("Safari"), wO = [".aac", ".mid", ".midi", ".mp3", ".ogg", ".oga", ".wav", ".weba"];
var bO = typeof global == "object" && global && global.Object === Object && global, SO = typeof self == "object" && self && self.Object === Object && self, VE = bO || SO || Function("return this")(), og = VE.Symbol, HE = Object.prototype, xO = HE.hasOwnProperty, CO = HE.toString, $h = og ? og.toStringTag : void 0, TO = Object.prototype.toString, sM = og ? og.toStringTag : void 0;
function MO(r) {
  return r == null ? r === void 0 ? "[object Undefined]" : "[object Null]" : sM && sM in Object(r) ? function(i) {
    var o = xO.call(i, $h), c = i[$h];
    try {
      i[$h] = void 0;
      var h = !0;
    } catch {
    }
    var m = CO.call(i);
    return h && (o ? i[$h] = c : delete i[$h]), m;
  }(r) : function(i) {
    return TO.call(i);
  }(r);
}
var EO = /\s/, IO = /^\s+/;
function AO(r) {
  return r && r.slice(0, function(i) {
    for (var o = i.length; o-- && EO.test(i.charAt(o)); )
      ;
    return o;
  }(r) + 1).replace(IO, "");
}
function qb(r) {
  var i = typeof r;
  return r != null && (i == "object" || i == "function");
}
var RO = /^[-+]0x[0-9a-f]+$/i, DO = /^0b[01]+$/i, NO = /^0o[0-7]+$/i, kO = parseInt;
function oM(r) {
  if (typeof r == "number")
    return r;
  if (function(c) {
    return typeof c == "symbol" || function(h) {
      return h != null && typeof h == "object";
    }(c) && MO(c) == "[object Symbol]";
  }(r))
    return NaN;
  if (qb(r)) {
    var i = typeof r.valueOf == "function" ? r.valueOf() : r;
    r = qb(i) ? i + "" : i;
  }
  if (typeof r != "string")
    return r === 0 ? r : +r;
  r = AO(r);
  var o = DO.test(r);
  return o || NO.test(r) ? kO(r.slice(2), o ? 2 : 8) : RO.test(r) ? NaN : +r;
}
var Db = function() {
  return VE.Date.now();
}, PO = Math.max, _O = Math.min;
function Yv(r, i, o) {
  var c, h, m, w, g, x, T = 0, A = !1, I = !1, z = !0;
  if (typeof r != "function")
    throw new TypeError("Expected a function");
  function F(Z) {
    var ue = c, oe = h;
    return c = h = void 0, T = Z, w = r.apply(oe, ue);
  }
  function $(Z) {
    return T = Z, g = setTimeout(q, i), A ? F(Z) : w;
  }
  function J(Z) {
    var ue = Z - x;
    return x === void 0 || ue >= i || ue < 0 || I && Z - T >= m;
  }
  function q() {
    var Z = Db();
    if (J(Z))
      return de(Z);
    g = setTimeout(q, function(ue) {
      var oe = i - (ue - x);
      return I ? _O(oe, m - (ue - T)) : oe;
    }(Z));
  }
  function de(Z) {
    return g = void 0, z && c ? F(Z) : (c = h = void 0, w);
  }
  function se() {
    var Z = Db(), ue = J(Z);
    if (c = arguments, h = this, x = Z, ue) {
      if (g === void 0)
        return $(x);
      if (I)
        return clearTimeout(g), g = setTimeout(q, i), F(x);
    }
    return g === void 0 && (g = setTimeout(q, i)), w;
  }
  return i = oM(i) || 0, qb(o) && (A = !!o.leading, m = (I = "maxWait" in o) ? PO(oM(o.maxWait) || 0, i) : m, z = "trailing" in o ? !!o.trailing : z), se.cancel = function() {
    g !== void 0 && clearTimeout(g), T = 0, c = x = h = g = void 0;
  }, se.flush = function() {
    return g === void 0 ? w : de(Db());
  }, se;
}
class lM extends dl.exports.Component {
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
        const o = Cr(Cr({}, this.getPositionStyle(this.props.buffered)), this.props.bufferColor && { backgroundColor: this.props.bufferColor });
        return yt.createElement("div", { className: "buffered", style: o });
      }
      return null;
    }, this.renderProgress = () => {
      const o = Cr(Cr({}, this.getPositionStyle(this.props.current)), this.props.sliderColor && { backgroundColor: this.props.sliderColor });
      return yt.createElement("div", { className: "connect", style: o });
    }, this.renderHoverProgress = () => {
      const o = Cr(Cr({}, this.getSeekHoverPosition()), this.props.sliderHoverColor && { backgroundColor: this.props.sliderHoverColor });
      return yt.createElement("div", { className: "seek-hover", style: o });
    }, this.renderThumb = () => yt.createElement("div", { className: this.isThumbActive() ? "thumb active" : "thumb", style: this.getThumbHandlerPosition() }, yt.createElement("div", { style: { backgroundColor: this.props.thumbColor }, className: "handler" })), this.onMouseDown = (o) => {
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
    return this.props.hideHoverTime ? null : yt.createElement("div", { className: this.isThumbActive() ? "hover-time active" : "hover-time", style: this.getHoverTimePosition(), ref: (i) => this.hoverTime = i }, this.getHoverTime());
  }
  render() {
    return yt.createElement("div", { className: "seek-slider" }, yt.createElement("div", { className: "track", ref: (i) => this.track = i, onMouseMove: (i) => this.handleTrackHover(!1, i), onMouseLeave: (i) => this.handleTrackHover(!0, i), onMouseDown: this.onMouseDown, onTouchStart: (i) => {
      this.setMobileSeeking(!0), this.onMouseDown(i);
    }, onMouseUp: this.onMouseUp, onTouchEnd: this.onMouseUp }, yt.createElement("div", { className: "main" }, this.renderBufferProgress(), this.renderHoverProgress(), this.renderProgress())), this.drawHoverTime(), this.renderThumb());
  }
}
class zO extends dl.exports.Component {
  constructor(i) {
    super(i), this.stageVolume = 0, this.updateVolumeTimer = 0, this.onVolumeSeeking = !1, this.onClickOperationButton = () => {
      const { paused: o } = this.props;
      o ? this.props.play() : this.props.pause();
    }, this.operationButton = () => {
      const { paused: o } = this.props;
      return o ? yt.createElement("img", { src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBhcmlhLWhpZGRlbj0idHJ1ZSIgcm9sZT0iaW1nIiBjbGFzcz0iaWNvbmlmeSBpY29uaWZ5LS1tZGkiIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQgbWVldCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNOCA1LjE0djE0bDExLTdsLTExLTd6IiBmaWxsPSIjZmZmIj48L3BhdGg+PC9zdmc+Cg==" }) : yt.createElement("img", { src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBhcmlhLWhpZGRlbj0idHJ1ZSIgcm9sZT0iaW1nIiBjbGFzcz0iaWNvbmlmeSBpY29uaWZ5LS1tZGkiIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQgbWVldCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTQgMTloNFY1aC00TTYgMTloNFY1SDZ2MTR6IiBmaWxsPSIjZmZmIj48L3BhdGg+PC9zdmc+Cg==" });
    }, this.operationVolumeButton = () => this.props.volume > 0.9 ? yt.createElement("img", { src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBhcmlhLWhpZGRlbj0idHJ1ZSIgcm9sZT0iaW1nIiBjbGFzcz0iaWNvbmlmeSBpY29uaWZ5LS1tZGkiIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQgbWVldCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTQgMy4yM3YyLjA2YzIuODkuODYgNSAzLjU0IDUgNi43MXMtMi4xMSA1Ljg0LTUgNi43djIuMDdjNC0uOTEgNy00LjQ5IDctOC43N2MwLTQuMjgtMy03Ljg2LTctOC43N00xNi41IDEyYzAtMS43Ny0xLTMuMjktMi41LTQuMDNWMTZjMS41LS43MSAyLjUtMi4yNCAyLjUtNE0zIDl2Nmg0bDUgNVY0TDcgOUgzeiIgZmlsbD0iI2ZmZiI+PC9wYXRoPjwvc3ZnPgo=" }) : this.props.volume === 0 ? yt.createElement("img", { src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBhcmlhLWhpZGRlbj0idHJ1ZSIgcm9sZT0iaW1nIiBjbGFzcz0iaWNvbmlmeSBpY29uaWZ5LS1tZGkiIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQgbWVldCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNNyA5djZoNGw1IDVWNGwtNSA1SDd6IiBmaWxsPSIjZmZmIj48L3BhdGg+PC9zdmc+Cg==" }) : yt.createElement("img", { src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBhcmlhLWhpZGRlbj0idHJ1ZSIgcm9sZT0iaW1nIiBjbGFzcz0iaWNvbmlmeSBpY29uaWZ5LS1tZGkiIHdpZHRoPSIyMiIgaGVpZ2h0PSIyMiIgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQgbWVldCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNNSA5djZoNGw1IDVWNEw5IDltOS41IDNjMC0xLjc3LTEtMy4yOS0yLjUtNC4wM1YxNmMxLjUtLjcxIDIuNS0yLjI0IDIuNS00eiIgZmlsbD0iI2ZmZiI+PC9wYXRoPjwvc3ZnPgo=" }), this.handleClickVolume = () => {
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
    return yt.createElement("div", { className: "player-controller", style: { opacity: this.props.visible ? "1" : "0" } }, yt.createElement("div", { className: "player-controller-progress" }, yt.createElement(lM, { total: i, current: this.state.currentTime, onChange: this.onChange, buffered: this.props.buffered, bufferColor: "rgba(255,255,255,0.3)", hideHoverTime: !0, limitTimeTooltipBySides: !0, onSeekStart: this.onProgressSeekStart, onSeekEnd: this.onProgressSeekEnd, play: this.props.play, pause: this.props.pause, paused: this.props.paused, scale: this.props.scale })), yt.createElement("div", { className: "player-controller-actions" }, yt.createElement("div", { className: "player-controller-actions-left" }, yt.createElement("div", { onClick: this.onClickOperationButton, className: "player-controller-play" }, this.operationButton()), yt.createElement("div", { className: "player-volume-box", onMouseEnter: () => this.setState({ isVolumeHover: !0 }), onMouseLeave: () => this.setState({ isVolumeHover: !1 }) }, yt.createElement("div", { onClick: this.handleClickVolume, className: "player-volume" }, this.operationVolumeButton()), yt.createElement("div", { className: "player-volume-slider" }, yt.createElement(lM, { total: 100, current: 100 * this.state.seekVolume, onChange: this.onVolumeChange, onSeekStart: this.onVolumeSeekStart, onSeekEnd: this.onVolumeSeekEnd, scale: this.props.scale, limitTimeTooltipBySides: !0, hideHoverTime: !0 })))), yt.createElement("div", { className: "player-mid-box-time" }, uM(Math.floor(o / 1e3)), " /", " ", uM(Math.floor(i / 1e3)))));
  }
}
function uM(r) {
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
let OO = 99999;
var Kb, Sd;
(Sd = Kb || (Kb = {}))[Sd.Idle = 0] = "Idle", Sd[Sd.Playing = 1] = "Playing", Sd[Sd.Paused = 2] = "Paused";
let Li = {};
function Yn(r, ...i) {
  mo.verbose && console.log(`[RTCEffect] ${r}`, ...i);
}
function LO(r, i, o) {
  function c(m) {
    Li[m].playState === 0 ? (r.playEffect(m, o, 0, 1, 0, 100, !1, 0).then(() => {
      Yn(">>> Play Success", { playingId: m });
    }), Li[m].playState = 1) : Yn(">>> Skip Play", { playingId: m, state: Li[m].playState });
  }
  function h(m) {
    Li[m].playState = 0, Li[m].previousVideoJSAdvance = 0, Li[m].previousSeekTargetTime = 0, Li[m].previousBeginSeekTime = 0;
  }
  i.one("ready", () => {
    var m;
    const w = ((m = i == null ? void 0 : i.tagAttributes) == null ? void 0 : m.src) || "";
    w.endsWith("mp3") || w.endsWith("wav") || w.endsWith("m4a") || (Yn(">>> Mute js player", { src: w }), i.muted(!0), i.muted = (x) => !1);
    const g = function() {
      const x = OO--, T = { playState: Kb.Idle, previousVideoJSAdvance: 0, previousSeekTargetTime: 0, previousBeginSeekTime: 0 };
      return Li[x] = T, x;
    }();
    Yn(">>> Setup", { playingId: g, src: w }), r.addListener("error", (x) => {
      Yn(">>> Error", { soundId: x }), h(x);
    }), r.addListener("effectFinished", (x) => {
      Yn(">>> Finished", { soundId: x }), h(x);
    }), i.on("play", () => {
      switch (Li[g].playState) {
        case 0:
          Yn(">>> Start play", { playingId: g }), c(g);
          break;
        case 2:
          Yn(">>> Resume play", { playingId: g }), r.resumeEffect(g), Li[g].playState = 1;
      }
    }), i.on("pause", () => {
      const x = Li[g].playState;
      switch (x) {
        case 1:
          Yn(">>> Pause play", { playingId: g }), r.pauseEffect(g), Li[g].playState = 2;
          break;
        default:
          Yn(">>> Skip Pause", { playingId: g, currenState: x });
      }
    }), i.on("timeupdate", () => {
      r.getEffectCurrentPosition(g).then((x) => {
        const T = Li[g], A = x / 1e3, I = i.currentTime(), z = T.previousSeekTargetTime !== 0 && T.previousBeginSeekTime !== 0;
        if (Yn(`>>> EffectSecond rtc: ${A} js: ${I} seeking: ${z}`, { playingId: g }), T.playState == 0)
          return void (i.paused() || (Yn(">>> Play effect due to time update.", { playingId: g }), c(g)));
        if (z && A < T.previousSeekTargetTime)
          return;
        if (T.playState !== 1)
          return void Yn(">>> Skip timupdate", { playingId: g, state: T.playState, jsTime: i.currentTime(), rtcEffectTime: A });
        function F(J, q) {
          r.setEffectPosition(q, 1e3 * J), T.previousBeginSeekTime = Date.now() / 1e3, T.previousSeekTargetTime = J;
        }
        const $ = T.previousBeginSeekTime;
        if (x > 0) {
          const J = I - A, q = Math.abs(J), de = 0.5;
          if (q > de)
            if (z) {
              const se = T.previousSeekTargetTime - A, Z = Date.now() / 1e3 - $, ue = Z + (J > 0 ? J : 0), oe = I + ue;
              F(oe, g), Yn(">>> Start seeking after seeking lag", { jsPlayerTime: I, rtcEffectTime: A, jsPlayerTimerAdvance: J, lastSeekingCost: Z, estimatedRTCLag: ue, targetRTCSeekTime: oe, previousBeginSeekTime: $, timeElapse: se });
            } else if (q > 10)
              F(I, g), Yn(">>> DirectSeek", { time: I, rtcEffectTime: A, jsPlayerTimerAdvance: J });
            else {
              const se = T.previousVideoJSAdvance, Z = 0, ue = I + Z;
              T.previousVideoJSAdvance = Z, F(ue, g), Yn(">>> Start seeking with lag", { jsPlayerTime: I, rtcEffectTime: A, jsPlayerTimerAdvance: J, previousAdvance: se, estimatedRTCLag: Z, targetRTCSeekTime: ue });
            }
          else
            z && (Yn(">>> SeekingFinish no lag", { jsPlayerTime: I, rtcEffectTime: A, jsPlayerTimerAdvance: J, previousBeginSeekTime: $, rtcLagTolerance: de }), T.previousBeginSeekTime = 0, T.previousSeekTargetTime = 0);
        }
      });
    }), i.on("dispose", () => {
      Li[g].playState && (r.stopEffect(g), delete Li[g], Yn(">>> Dispose", { playingId: g }));
    });
  });
}
class BO extends dl.exports.Component {
  constructor() {
    super(...arguments), this.putAttributes = (i) => {
      const { context: o } = this.props, c = o.getAttributes() || {};
      for (const h in i)
        c[h] !== i[h] && o.updateAttributes([h], i[h]);
    };
  }
  render() {
    const { context: i } = this.props, o = i.getRoom(), c = o ? void 0 : i.getDisplayer(), h = this.putAttributes;
    return yt.createElement(jO, { room: o, player: c, context: i, plugin: { putAttributes: h } });
  }
}
class jO extends dl.exports.Component {
  constructor(i) {
    super(i), this.alertMask = null, this.container = yt.createRef(), this.controllerHiddenTimer = 0, this.syncPlayerTimer = 0, this.retryCount = 0, this.decreaseRetryTimer = 0, this.noSoundSyncCount = 0, this.showController = () => {
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
      let w = mo.currentTimeMaxError;
      this.state.NoSound && (w *= 3), m > h.duration() ? this.resetPlayer() : Math.abs(h.currentTime() - m) > w && (this.debug("<<< currentTime -> %o", m), h.currentTime(m));
    }, this.debounceHidingController = () => {
      this.controllerHiddenTimer && (clearTimeout(this.controllerHiddenTimer), this.controllerHiddenTimer = 0), this.controllerHiddenTimer = setTimeout(() => {
        this.setState({ controllerVisible: !1 }), this.controllerHiddenTimer = 0;
      }, 3e3);
    }, this.decreaseRetryCount = () => {
      this.player && this.retryCount > 0 && (this.retryCount = this.retryCount - 1);
    }, this.catchPlayFail = (o) => {
      var c, h;
      const m = String(o);
      if (yO && m.includes("NotAllowedError") || m.includes("interact"))
        (c = this.player) == null || c.autoplay("any"), this.setState({ NoSound: !0 });
      else {
        const w = (h = this.player) == null ? void 0 : h.error();
        w && (this.retryCount <= 3 ? (this.initPlayer(), this.retryCount = this.retryCount + 1) : (this.debug("catch videojs media error", w), this.setState({ MediaError: !0 }))), this.debug("catch error", o);
      }
    }, this.fixPlayFail = () => {
      this.debug("try to fix play state"), this.setState({ NoSound: !1 });
      const { muted: o, volume: c } = this.getAttributes();
      this.player && (this.player.muted(o), this.player.volume(c));
    }, this.initPlayer = async () => {
      var o;
      (o = this.player) == null || o.dispose(), this.player = void 0, this.debug("creating elements ...");
      const { type: c, src: h, poster: m } = this.getAttributes(), w = document.createElement("div");
      w.setAttribute("data-vjs-player", "");
      const g = document.createElement("video");
      g.className = "video-js", m && (g.poster = m), g.setAttribute("playsInline", ""), g.setAttribute("webkit-playsinline", "");
      const x = document.createElement("source");
      new URL(h).pathname.endsWith(".m3u8") ? x.type = "application/x-mpegURL" : g.src = h, x.src = h, c && (x.type = c), g.appendChild(x), w.appendChild(g), this.container.current.appendChild(w), await new Promise((I) => (window.requestAnimationFrame || window.setTimeout)(I)), this.debug("initializing videojs() ...");
      const T = KC(g);
      this.player = T, window.player = T, T.one("loadedmetadata", this.gracefullyUpdate);
      const A = window.__mediaPlayerAudioEffectClient;
      A !== void 0 && LO(A, T, h), T.on("ready", () => {
        var I;
        (I = mo.onPlayer) == null || I.call(mo, T), T.on("timeupdate", this.gracefullyUpdate), T.on("volumechange", this.gracefullyUpdate), T.on("seeked", this.gracefullyUpdate), T.on("play", this.gracefullyUpdate), T.on("pause", this.gracefullyUpdate), T.on("ended", this.resetPlayer);
      }), T.on("error", this.catchPlayFail), this.setState({ MediaError: !1 });
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
      if (o = Cr(Cr({}, BE), o), this.player) {
        let h = Zv(o, this.props), m = this.player.duration();
        !o.paused && h > m && (c = Cr({}, o), o = pO(c, mO({ currentTime: 0, paused: !0 })), this.resetPlayer());
      }
      var c;
      return o;
    }
  }
  isShowingPoster() {
    const i = this.getAttributes();
    return !(i != null && i.src) || wO.some((o) => i.src.endsWith(o));
  }
  render() {
    var i, o;
    if (!this.props.room && !this.props.player)
      return null;
    const c = this.getAttributes();
    if (!c)
      return null;
    const h = 1e3 * (((i = this.player) == null ? void 0 : i.duration()) || 1e3), m = ((o = this.player) == null ? void 0 : o.bufferedPercent()) || 0;
    return yt.createElement("div", { className: this.isEnabled() ? "vjs-p" : "vjs-p disabled", onMouseEnter: this.showController, onMouseMove: this.showController }, yt.createElement("div", { className: "video-js-plugin-player", ref: this.container }), this.isShowingPoster() && yt.createElement("div", { className: "video-js-plugin-poster" }, c.poster && yt.createElement("img", { src: c.poster, alt: "", draggable: !1 })), yt.createElement(zO, { duration: h, volume: c.volume, setVolume: this.setVolume, paused: c.paused, play: this.play, pause: this.pause, currentTime: 1e3 * Zv(c, this.props), setCurrentTime: this.setCurrentTime, buffered: h * m, visible: !0 }), this.state.NoSound && yt.createElement("div", { ref: this.setupAlert, className: "videojs-plugin-muted-alert" }), this.state.MediaError && yt.createElement("div", { className: "videojs-plugin-recovery-mode" }, yt.createElement("button", { ref: this.setupReload }, "Reload Player")));
  }
  debug(i, ...o) {
    mo.verbose && mo.log(`[MediaPlayer] ${i}`, ...o);
  }
  componentDidMount() {
    this.debug("app version =", "0.1.0-alpha.5"), this.debug("video.js version =", KC.VERSION), this.initPlayer(), this.props.context.emitter.on("attributesUpdate", this.syncPlayerWithAttributes), this.syncPlayerTimer = setInterval(this.syncPlayerWithAttributes, mo.syncInterval), this.decreaseRetryTimer = setInterval(this.decreaseRetryCount, mo.retryInterval);
  }
  componentWillUnmount() {
    var i;
    this.debug("unmount"), this.props.context.emitter.off("attributesUpdate", this.syncPlayerWithAttributes), (i = this.player) == null || i.dispose(), clearInterval(this.syncPlayerTimer), clearInterval(this.decreaseRetryTimer);
  }
  isEnabled() {
    return this.props.context.getIsWritable();
  }
}
const eS = { kind: "MediaPlayer", setup(r) {
  let i = r.getAttributes();
  if (!i || !i.src)
    return r.emitter.emit("destroy", { error: new Error("[MediaPlayer]: Missing 'attributes'.'src'.") });
  i = Cr(Cr({}, BE), i);
  const o = r.getBox();
  o.mountStyles(`.vjs-p{display:flex;flex-grow:1}.vjs-p *{pointer-events:auto}.vjs-p.disabled *{pointer-events:none}.vjs-p .video-js-plugin-poster{position:absolute;top:0;left:0;right:0;bottom:0;background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgQAAACACAYAAAB0vHFxAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAACBKADAAQAAAABAAAAgAAAAACE3oPTAAAKXUlEQVR4Ae3dYW4ktxEG0LW9FwkC2McycokAOUGAXMLwtQwYvomdP4akHUnNnm6SVUU+/xqpe8ji+yiDWz3a/e7L5v/98se//3pL8K9//O+7t19Hv85eX7RP9vnllz2h4/rkd+wz+ir/0cLfjv/9t1/6igABAgQIENhRwIFgx9StmQABAgQIPAg4EDyA+JIAAQIECOwo8HXHRVvzPIHRzwBHjz9PKudMo31Hj59TdZ2qsueXvb5sO0GHIFsi6iFAgAABAgECOgQB6KbsJ5Dtt0L6rWyPkeRXO+fs+WWvL1v6OgTZElEPAQIECBAIENAhCEA3ZT8Bzwj7WUaMJL8I9X5zZs8ve339kugzkg5BH0ejECBAgACB0gIOBKXjUzwBAgQIEOgj4EDQx9EoBAgQIECgtIADQen4FE+AAAECBPoIOBD0cTQKAQIECBAoLeC3DErHp/iWgE8Zt4RyX5df7nxa1Y3Ob/T4rfWtdl2HYLVErYcAAQIECFwQWL5DsPoJcvX1XdjTpd4iv1JxvStWfu9IfCORwLP7U4cgUXhKIUCAAAECUQIOBFHy5iVAgAABAokEHAgShaEUAgQIECAQJXD7MwTPPqOIWujVeUevb/T4V9ftfecE5HfOKetd8suajLoiBHQIItTNSYAAAQIEkgnc7hAkW0/3ckb/e9qjx+8OYsBvBOT3DUe5L+RXLjIFDxTQIRiIa2gCBAgQIFBFoNkh2P0Z2+j1jx4/+0asvv7q9d/dH9XXX73+3fO7u/7W+3fbHzoErR3hOgECBAgQ2ECg2SHwjG2DXRC4xOj9tdufAHpHLb/eonPHk9+xd7TPcXX9r+oQ9Dc1IgECBAgQKCfgQFAuMgUTIECAAIH+Ag4E/U2NSIAAAQIEygk0P0MQvaLsz3hb9bWu840WOJ5ffsc+2a/KL3tC6jsSmL1/dQiO0nCNAAECBAhsItDsEMw+oTzrHl1f61OorevPrvfZ+6N9WvVmr09+xwnKr7ZP9vyOdcdfze7Tuz4dgvF7ygwECBAgQCC9QLNDkH0F0X+C45NdoHZ99rf8aguofqRA7/8/6BCMTMvYBAgQIECgiED5DkHvZyhFcjtdJp/TVClvlF/KWE4XJb/TVG68INB7f+kQXAjBWwgQIECAwGoCDgSrJWo9BAgQIEDggoADwQU0byFAgAABAqsJfO39DGI1IOuJFbA/Y/3vzi6/u4Kx7189v7vru/v+2HTfz65D8N7EdwgQIECAwHYCw3/LYLUT1HY7pLFg+TaAkl+WX/KAGuXJrwEUfLlaPjoEwRvG9AQIECBAIIPA8A5B779JKQOaGl4F5PtqUfGV/Cqm9lqz/F4tMr6qlo8OQcZdpCYCBAgQIDBZYHiHoNozlMn+5aeTb+0I5Se/2gK5q6/286VDkHs/qY4AAQIECEwRcCCYwmwSAgQIECCQW8CBIHc+qiNAgAABAlMEhn+GYMoqTEKAAAEC7wSqPcN+twDfmCqgQzCV22QECBAgQCCnQHiHoPoJtlV/63rObfFaVfX6X1dy7VX19Vev/1pqr++qvv7q9b8m4dVHAtny1SH4KCXfI0CAAAECmwmEdwiq/U1Om+2PL/Kpnbj85FdbYO3qs/186hCsvd+sjgABAgQInBJwIDjF5CYCBAgQILC2gAPB2vlaHQECBAgQOCUQ/hmCbJ+yPKW20U3yqR22/ORXW2Dt6qN/Ph/n1yFYe79ZHQECBAgQOCXgQHCKyU0ECBAgQGBtAQeCtfO1OgIECBAgcErAgeAUk5sIECBAgMDaAg4Ea+drdQQIECBA4JTA1+///OGnoztd52N/fC7g58PPx+e748sX+8P+qLQ/dAiO0nKNAAECBAhsIuBAsEnQlkmAAAECBI4EHAiOdFwjQIAAAQKbCDgQbBK0ZRIgQIAAgSMBB4IjHdcIECBAgMAmAuH/lsHP//zvb5tYl1ymfErG9lK0/F4oSr6QX8nYThcdne/j/DoEp6NzIwECBAgQWFfAgWDdbK2MAAECBAicFnAgOE3lRgIECBAgsK5A+GcIfv39Pz++5X18pvH2mtfzBeQz37znjPLrqTl/LPnNN585Y7Z8dQhmpm8uAgQIECCQVCC8Q1C9I9Cqv3U96b54Kat6/S8Lufii+vqr138xtpe3VV9/9fpfgvDiQ4Fs+eoQfBiTbxIgQIAAgb0EwjsEe3FbLQECBOYJZPsT6LyVm+mKgA7BFTXvIUCAAAECiwk4ECwWqOUQIECAAIErAg4EV9S8hwABAgQILCYw/DMEnmEttmMeliPfB5BiX8qvWGAP5crvASTZl9Xy0SFItoGUQ4AAAQIEIgSGdwiy/U1MEcgrzynf2unKT361BXJXX+3nS4cg935SHQECBAgQmCIwvENQ7RnKFPWFJpFv7TDlJ7/aArmrr/bzpUOQez+pjgABAgQITBH4Wu0EM0XFJGkE7M80UVwqRH6X2NK8afX87q7v7vvTBP13IToE2RJRDwECBAgQCBBwIAhANyUBAgQIEMgm4ECQLRH1ECBAgACBAIHhv2Uwek2rPcPp7cWnt+jc8eQ317v3bPLrLWq8twK995cOwVtdrwkQIECAwKYC5TsE1f4mqNn7jM9s8b7zya+v5+zR5DdbfK/5eu8vHYK99o/VEiBAgACBDwWaHYLezyg+rOLGN6Pra53QWtdvLP3UW6N9WkVmr09+xwnKr7ZP9vyOdcdfze7Tuz4dgvF7ygwECBAgQCC9QLNDEL2C3ieg3utp1de63rueZ8fLXt+z6+l9f3af7PX1zuPZ8bL7ZK/vWW/39xWYvT90CPrmZzQCBAgQIFBSwIGgZGyKJkCAAAECfQUcCPp6Go0AAQIECJQUaH6GIPpT1iVVFX1aIHp/zX5GdxqmyI3yKxLUJ2XK7xOYv78d7XNcXf+rOgT9TY1IgAABAgTKCTQ7BLv/CWr0+kePn31HVl9/9frv7o/q669e/+753V1/6/277Q8dgtaOcJ0AAQIECGwg0OwQbGBwuMTRz5BGj3+4OBdvC8jvNmHoAPIL5Td5MgEdgmSBKIcAAQIECEQI3O4QrP6MZfT6Ro8fsal2mlN+tdOWX+38VN9XQIegr6fRCBAgQIBASQEHgpKxKZoAAQIECPQVcCDo62k0AgQIECBQUuD2Zwiyr3r1Z4Srry/7/rpbn/zuCsa+X36x/mY/Fnh2f+oQHHu6SoAAAQIEthBYvkOwRYoW+anAsyfkTwdyIURAfiHs3SYdnd/o8btBFBlIh6BIUMokQIAAAQIjBRwIRuoamwABAgQIFBFwICgSlDIJECBAgMBIAQeCkbrGJkCAAAECRQQcCIoEpUwCBAgQIDBSwG8ZjNQ19nABnzIeTjx0AvkN5R0+ePb8stc3PKAnJ9AheBLM7QQIECBAYEUBHYIVU91oTf49+9phy09+IwXsr+d0dQie83I3AQIECBBYUkCHYMlY8yxq9DO80ePnkYypZLTv6PFj1PaZNXt+2evLtlN0CLIloh4CBAgQIBAg4EAQgG5KAgQIECCQTcCBIFsi6iFAgAABAgEC/wdVfx9UuC8B6AAAAABJRU5ErkJggg==);background-repeat:repeat-x;background-position:0 50%;display:flex;align-items:center;justify-content:center}.vjs-p .video-js-plugin-poster img{box-shadow:0 0 5px 10px #0006}.vjs-p .player-controller,.vjs-p .videojs-plugin-muted-alert{pointer-events:auto}.vjs-p.disabled .videojs-plugin-close-icon,.vjs-p.disabled .player-controller{pointer-events:none}.vjs-p .video-js-plugin-player{position:absolute;top:0;left:0;right:0;bottom:0}.video-js,[data-vjs-player]{width:100%;height:100%}.vjs-p .videojs-plugin-muted-alert{pointer-events:auto;cursor:pointer;position:absolute;top:0;left:0;right:0;bottom:0;z-index:43}.vjs-p .videojs-plugin-muted-alert:before{pointer-events:auto;cursor:pointer;position:absolute;top:0;left:0;right:0;bottom:0;z-index:43;content:"\\f104";background:rgba(0,0,0,.3);font-family:VideoJS;font-size:2em;display:flex;align-items:center;justify-content:center;color:#fff}.vjs-p .videojs-plugin-recovery-mode{pointer-events:auto;cursor:pointer;position:absolute;top:0;left:0;right:0;bottom:0;z-index:44}.vjs-p .videojs-plugin-recovery-mode button{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}.vjs-p .seek-slider{position:relative;width:100%}.vjs-p .seek-slider:focus{outline:none}.vjs-p .seek-slider .track{padding:10px 0;cursor:pointer;outline:none}.vjs-p .seek-slider .track:focus{border:0;outline:none}.vjs-p .seek-slider .track .main{width:100%;height:3px;background-color:#ffffff4d;border-radius:30px;position:absolute;left:0;top:8.5px;transition:transform .4s;outline:none}.vjs-p .seek-slider .track .main:focus{border:0;outline:none}.vjs-p .seek-slider .track .main .buffered{position:absolute;background-color:#ffffff4d;width:100%;height:100%;transform:scaleX(.8);z-index:2;transform-origin:0 0}.vjs-p .seek-slider .track .main .seek-hover{position:absolute;background-color:#ffffff80;width:100%;height:100%;z-index:1;transform:scaleX(.6);transform-origin:0 0;opacity:0;transition:opacity .4s}.vjs-p .seek-slider .track .main .connect{position:absolute;background-color:#fff;width:100%;height:100%;z-index:3;left:0;transform:scaleX(.13);transform-origin:0 0}.vjs-p .seek-slider .track.active .main{transform:scaleY(2)}.vjs-p .seek-slider .thumb{pointer-events:none;position:absolute;width:12px;height:12px;left:-6px;top:4px;z-index:4;transform:translate(100px)}.vjs-p .seek-slider .thumb .handler{border-radius:100%;width:100%;height:100%;background-color:#fff;opacity:0;transform:scale(.4);cursor:pointer;transition:transform .2s;pointer-events:none}.vjs-p .seek-slider .thumb.active .handler{opacity:1;transform:scale(1)}.vjs-p .seek-slider .hover-time{position:absolute;background-color:#0000004d;line-height:18px;font-size:16px;color:#ddd;top:-25px;left:0;padding:5px 10px;border-radius:5px;box-shadow:0 0 5px #0000004d;opacity:0;transform:translate(150px);pointer-events:none}.vjs-p .seek-slider .hover-time.active{opacity:1}.vjs-p .seek-slider:hover .track .main .seek-hover{opacity:1}.vjs-p .player-controller{position:absolute;z-index:100;bottom:0px;left:0;width:100%;display:flex;flex-direction:column;justify-content:center;align-items:stretch;height:64px;background-image:linear-gradient(0deg,#000,transparent);transition:opacity .2s;color:#fff}.vjs-p .player-menu-box{display:flex;align-items:center;justify-content:center;flex-direction:column;margin-bottom:40px}.vjs-p .player-menu-cell{width:100%;text-align:center;font-size:12px;color:#7a7b7c}.vjs-p .player-multiple-play{width:64px;height:120px}.vjs-p .player-controller-actions-left{display:flex;justify-content:center;align-items:center;flex-shrink:0}.vjs-p .player-right-box{font-size:14px;color:#7a7b7c;cursor:pointer;margin-right:12px}.vjs-p .player-controller-actions{display:flex;flex-direction:row;justify-content:space-between;align-items:center;padding-left:8px;padding-right:8px;margin-top:2px}.vjs-p .player-mid-box-time{font-size:9px;display:flex;justify-content:center;align-items:center;color:#fff;flex-shrink:0;margin-right:8px;font-family:monospace}.vjs-p .player-controller-play{display:flex;align-items:center;justify-content:center;cursor:pointer;padding-right:4px}.vjs-p .player-controller-progress{width:calc(100% - 28px);margin-left:14px;display:flex;align-items:center;justify-content:center;margin-top:8px}.vjs-p .player-volume{display:flex;align-items:center;justify-content:center;cursor:pointer;margin-right:16px;margin-left:8px}.vjs-p .player-volume-slider{width:60px;margin-right:12px;display:flex;align-items:center}.vjs-p .player-volume-box{display:flex;flex-direction:row}.netless-app-media-player-container{display:flex;position:relative;height:100%}
`);
  const c = document.createElement("div");
  c.classList.add("netless-app-media-player-container"), iM.render(yt.createElement(BO, { context: r }), c), o.mountContent(c), r.emitter.on("destroy", () => {
    console.log("[MediaPlayer]: destroy"), iM.unmountComponentAtNode(c);
  });
} }, UO = () => {
  Ht.debug && UE({ verbose: !0 }), Ht.register({
    kind: Jb.kind,
    src: Jb
  }), Ht.register({
    kind: eS.kind,
    src: eS
  });
}, KO = {
  DocsViewer: Jb.kind,
  MediaPlayer: eS.kind
};
var VO = /* @__PURE__ */ ((r) => (r.Init = "Init", r.AttributesUpdate = "AttributesUpdate", r.SetAttributes = "SetAttributes", r.RegisterMagixEvent = "RegisterMagixEvent", r.RemoveMagixEvent = "RemoveMagixEvent", r.RemoveAllMagixEvent = "RemoveAllMagixEvent", r.RoomStateChanged = "RoomStateChanged", r.DispatchMagixEvent = "DispatchMagixEvent", r.ReciveMagixEvent = "ReciveMagixEvent", r.NextPage = "NextPage", r.PrevPage = "PrevPage", r.SDKCreate = "SDKCreate", r.OnCreate = "OnCreate", r.SetPage = "SetPage", r.GetAttributes = "GetAttributes", r.Ready = "Ready", r.Destory = "Destory", r.StartCreate = "StartCreate", r.WrapperDidUpdate = "WrapperDidUpdate", r.DispayIframe = "DispayIframe", r.HideIframe = "HideIframe", r.GetRootRect = "GetRootRect", r.ReplayRootRect = "ReplayRootRect", r.PageTo = "PageTo", r))(VO || {}), HO = /* @__PURE__ */ ((r) => (r.WrapperDidMount = "WrapperDidMount", r.IframeLoad = "IframeLoad", r))(HO || {});
const al = {
  Ready: "Ready",
  RootRect: "ReplayRootRect",
  Message: "message",
  ComputeStyle: "computeStyle",
  Load: "load",
  DisplayerState: "displayerState",
  Show: "show",
  Hide: "hide"
}, WO = (r, i) => new Array(r).fill(0).map((o, c) => i(c)), cn = class {
  constructor(r, i) {
    this.manager = r, this.appManager = i, this.magixEventMap = /* @__PURE__ */ new Map(), this.cssList = [], this.allowAppliances = ["clicker"], this.bridgeDisposer = dM, this.rootRect = null, this.sideEffectManager = new lp(), this.execListenIframe = xs((o) => {
      this.listenIframe(o);
    }, 50), this.onPhaseChangedListener = (o) => {
      o === qC.Playing && this.computedStyleAndIframeDisplay();
    }, this.stateChangeListener = (o) => {
      o = { ...o }, o.cameraState = this.manager.cameraState, this.postMessage({ kind: "RoomStateChanged", payload: o }), o.cameraState && (cn.emitter.emit("GetRootRect"), this.computedStyle(o)), o.memberState && (this.computedZindex(), this.updateStyle()), o.sceneState && this.computedIframeDisplay(o, this.attributes);
    }, this.displayer = cn.displayer = i.displayer, this.iframe = this._createIframe(), this.sideEffectManager.addDisposer(
      cn.emitter.on("ReplayRootRect", (o) => {
        this.rootRect = o;
      }),
      al.RootRect
    ), this.sideEffectManager.addDisposer(
      cn.emitter.on("HideIframe", () => {
        this.iframe.className = cn.hiddenClass;
      }),
      al.Hide
    ), this.sideEffectManager.addDisposer(
      cn.emitter.on("DispayIframe", () => {
        this.iframe.className = "";
      }),
      al.Show
    ), this.sideEffectManager.addDisposer(
      cn.emitter.on("created", () => {
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
    ), cn.onCreate(this);
  }
  static onCreate(r) {
    cn.emitter.emit("StartCreate"), cn.emitter.emit("OnCreate", r), cn.emitter.emit("created");
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
      this.getIframe(), this.listenIframe(this.attributes), this.listenDisplayerState(), cn.emitter.emit("GetRootRect");
    };
    if (this.getIframe())
      o();
    else {
      const c = this.sideEffectManager.addDisposer(
        cn.emitter.on("WrapperDidMount", () => {
          o(), this.sideEffectManager.flush(c);
        })
      ), h = this.sideEffectManager.addDisposer(
        cn.emitter.on("WrapperDidUpdate", () => {
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
    ), cn.alreadyCreate = !0, this;
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
    this.sideEffectManager.flushAll(), cn.emitter.emit("Destory"), cn.alreadyCreate = !1, cn.emitter.clearListeners();
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
    return r.id = "IframeBridge", r.className = cn.hiddenClass, this.appManager.mainView.divElement && this.appManager.mainView.divElement.appendChild(r), r;
  }
  scaleIframeToFit(r = Pb.Immediately) {
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
      const h = WO(i, (m) => ({
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
          roomState: (c = cn.displayer) == null ? void 0 : c.state,
          currentPage: this.currentPage,
          observerId: this.displayer.observerId
        }
      }), cn.emitter.emit("IframeLoad", o), this.sideEffectManager.addDisposer(
        cn.emitter.on("Ready", () => {
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
    this.isReplay && (this.displayer._phase === qC.Playing && this.computedStyleAndIframeDisplay(), this.sideEffectManager.add(() => (this.displayer.callbacks.on("onPhaseChanged", this.onPhaseChangedListener), () => this.displayer.callbacks.off("onPhaseChanged", this.onPhaseChangedListener)), al.DisplayerState)), this.computedStyleAndIframeDisplay();
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
      const { width: h, height: m, scale: w, centerX: g, centerY: x } = i, T = this.rootRect || { x: 0, y: 0 }, A = `${h / 2 + T.x}px`, I = `${m / 2 + T.y}px`, z = `transform-origin: ${A} ${I};`, F = (h - o) / 2 * w, $ = (m - c) / 2 * w, J = -(g * w) + F, q = -(x * w) + $, de = `transform: translate(${J}px,${q}px) scale(${w}, ${w});`, Le = ["position: absolute;", "border: 0.1px solid rgba(0,0,0,0);", "top: 0px;", "left: 0px;", z, de];
      this.cssList = Le, this.computedZindex(), this.updateStyle();
    }
  }
  computedIframeDisplay(r, i) {
    this.inDisplaySceneDir ? cn.emitter.emit("DispayIframe") : cn.emitter.emit("HideIframe");
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
    if (Ta("<<<", JSON.stringify(r.data)), r.origin !== this.iframeOrigin)
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
        Ta(`${i.kind} not allow event.`);
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
let Pd = cn;
Pd.kind = "IframeBridge";
Pd.hiddenClass = "netless-iframe-brdige-hidden";
Pd.emitter = new Nd();
Pd.displayer = null;
Pd.alreadyCreate = !1;
const FO = new UP({ emitter: Ke }), tt = class extends XD {
  constructor(r) {
    super(r), this.version = "1.0.5", this.dependencies = { dependencies: { "@juggle/resize-observer": "^3.3.1", "@netless/telebox-insider": "github:veytu/telebox-insider", emittery: "^0.9.2", lodash: "^4.17.21", "p-retry": "^4.6.1", uuid: "^7.0.3", "video.js": ">=7" }, peerDependencies: { jspdf: "2.5.1", "white-web-sdk": "^2.16.52" }, devDependencies: { "@hyrious/dts": "^0.2.2", "@netless/app-media-player": "0.1.0-beta.9", "@netless/app-docs-viewer": "github:veytu/app-docs-viewer", "@rollup/plugin-commonjs": "^20.0.0", "@rollup/plugin-node-resolve": "^13.0.4", "@rollup/plugin-url": "^6.1.0", "@sveltejs/vite-plugin-svelte": "^1.4.0", "@tsconfig/svelte": "^2.0.1", "@types/debug": "^4.1.7", "@types/lodash": "^4.14.182", "@types/lodash-es": "^4.17.4", "@types/uuid": "^8.3.1", "@typescript-eslint/eslint-plugin": "^4.30.0", "@typescript-eslint/parser": "^4.30.0", "@vitest/ui": "^0.14.1", cypress: "^8.7.0", dotenv: "^10.0.0", eslint: "^7.32.0", "eslint-config-prettier": "^8.3.0", "eslint-plugin-svelte3": "^3.2.0", jsdom: "^19.0.0", jspdf: "^2.5.1", less: "^4.1.1", prettier: "^2.3.2", "prettier-plugin-svelte": "^2.4.0", "rollup-plugin-analyzer": "^4.0.0", "rollup-plugin-styles": "^3.14.1", "side-effect-manager": "0.1.5", svelte: "^3.42.4", typescript: "^4.5.5", vite: "^3.0.0", vitest: "^0.14.1", "white-web-sdk": "2.16.52" } }, this.emitter = Nt, this.viewMode = sl.Broadcaster, this.isReplay = iS(this.displayer), this._cursorUIDs = [], this.containerSizeRatio = tt.containerSizeRatio, tt.displayer = r.displayer, window.NETLESS_DEPS = { dependencies: { "@juggle/resize-observer": "^3.3.1", "@netless/telebox-insider": "github:veytu/telebox-insider", emittery: "^0.9.2", lodash: "^4.17.21", "p-retry": "^4.6.1", uuid: "^7.0.3", "video.js": ">=7" }, peerDependencies: { jspdf: "2.5.1", "white-web-sdk": "^2.16.52" }, devDependencies: { "@hyrious/dts": "^0.2.2", "@netless/app-media-player": "0.1.0-beta.9", "@netless/app-docs-viewer": "github:veytu/app-docs-viewer", "@rollup/plugin-commonjs": "^20.0.0", "@rollup/plugin-node-resolve": "^13.0.4", "@rollup/plugin-url": "^6.1.0", "@sveltejs/vite-plugin-svelte": "^1.4.0", "@tsconfig/svelte": "^2.0.1", "@types/debug": "^4.1.7", "@types/lodash": "^4.14.182", "@types/lodash-es": "^4.17.4", "@types/uuid": "^8.3.1", "@typescript-eslint/eslint-plugin": "^4.30.0", "@typescript-eslint/parser": "^4.30.0", "@vitest/ui": "^0.14.1", cypress: "^8.7.0", dotenv: "^10.0.0", eslint: "^7.32.0", "eslint-config-prettier": "^8.3.0", "eslint-plugin-svelte3": "^3.2.0", jsdom: "^19.0.0", jspdf: "^2.5.1", less: "^4.1.1", prettier: "^2.3.2", "prettier-plugin-svelte": "^2.4.0", "rollup-plugin-analyzer": "^4.0.0", "rollup-plugin-styles": "^3.14.1", "side-effect-manager": "0.1.5", svelte: "^3.42.4", typescript: "^4.5.5", vite: "^3.0.0", vitest: "^0.14.1", "white-web-sdk": "2.16.52" } };
  }
  static onCreate(r) {
    tt._resolve(r);
  }
  static async mount(r) {
    var w, g;
    const i = r.room;
    tt.container = r.container, tt.supportAppliancePlugin = r.supportAppliancePlugin;
    const o = r.containerSizeRatio, c = r.debug, h = r.cursor;
    tt.params = r, tt.displayer = r.room, QN();
    let m;
    if (Du(i)) {
      if (i.phase !== Nu.Connected)
        throw new Error("[WindowManager]: Room only Connected can be mount");
      i.phase === Nu.Connected && i.isWritable && (i.disableSerialization = !1), m = await this.initManager(i);
    }
    if (tt.isCreated)
      throw new Error("[WindowManager]: Already created cannot be created again");
    if (this.debug = Boolean(c), this.debug && UE({ verbose: !0 }), Ta("Already insert room", m), Du(this.displayer)) {
      if (!m)
        throw new Error("[WindowManager]: init InvisiblePlugin failed");
    } else
      await cM(
        async (x) => {
          if (m = i.getInvisiblePlugin(tt.kind), !m)
            throw Ta(`manager is empty. retrying ${x}`), new Error();
        },
        { retries: 10, maxTimeout: 5e3 }
      );
    if (!m)
      throw new Error("[WindowManager]: create manager failed");
    o && (tt.containerSizeRatio = o), await m.ensureAttributes(), m._fullscreen = r.fullscreen, m.appManager = new FN(m), m.appManager.polling = r.polling || !1, m._pageState = new jP(m.appManager), m.cursorManager = new BP(
      m.appManager,
      Boolean(h),
      r.cursorOptions,
      r.applianceIcons
    ), o && (m.containerSizeRatio = o), r.container && m.bindContainer(r.container), VP(i, m), Ke.emit("onCreated"), tt.isCreated = !0;
    try {
      await rN();
    } catch (x) {
      console.warn("[WindowManager]: indexedDB open failed"), console.log(x);
    }
    return (w = m == null ? void 0 : m.room) == null || w.addMagixEventListener("onScaleChange", (x) => {
      m == null || m._setScale(x.payload);
    }), (g = m == null ? void 0 : m.room) == null || g.addMagixEventListener("onMainViewBackgroundImgChange", (x) => {
      m == null || m._setBackgroundImg(x.payload);
    }), Ke.on("onScaleChange", (x) => {
      m == null || m._setScale(x, !0);
    }), Ke.on("onBackgroundImgChange", (x) => {
      m == null || m._setBackgroundImg(x || "");
    }), m;
  }
  static initManager(r) {
    return ZN(r);
  }
  static initContainer(r, i, o) {
    const { chessboard: c, overwriteStyles: h, fullscreen: m } = o;
    tt.container || (tt.container = i);
    const { playground: w, wrapper: g, sizer: x, mainViewElement: T, mainViewWrapper: A } = $N(i);
    if (tt.playground = w, c && x.classList.add("netless-window-manager-chess-sizer"), m && x.classList.add("netless-window-manager-fullscreen"), h) {
      const I = document.createElement("style");
      I.textContent = h, w.appendChild(I);
    }
    return r.containerResizeObserver = aS.create(
      w,
      x,
      g,
      Ke
    ), tt.wrapper = g, tt.sizer = x, tt.mainViewWrapper = A, T;
  }
  static get registered() {
    return Ji.registered;
  }
  bindContainer(r) {
    var i, o, c, h, m, w;
    if (Du(this.displayer) && this.room.phase !== Nu.Connected)
      throw new NN();
    if (tt.isCreated && tt.container)
      tt.container.firstChild && r.appendChild(tt.container.firstChild);
    else if (tt.params) {
      const g = tt.params, x = tt.initContainer(this, r, g);
      this.boxManager && this.boxManager.destroy();
      const T = aP(this, Nt, Ke, po, {
        collectorContainer: g.collectorContainer,
        collectorStyles: g.collectorStyles,
        prefersColorScheme: g.prefersColorScheme
      });
      this.boxManager = T, (i = this.appManager) == null || i.setBoxManager(T), this.bindMainView(x, g.disableCameraTransform), tt.wrapper && ((o = this.cursorManager) == null || o.setupWrapper(tt.wrapper));
    }
    Ke.emit("updateManagerRect"), (c = this.appManager) == null || c.refresh(), (h = this.appManager) == null || h.resetMaximized(), (m = this.appManager) == null || m.resetMinimized(), (w = this.appManager) == null || w.displayerWritableListener(!this.room.isWritable), tt.container = r;
  }
  bindCollectorContainer(r) {
    tt.isCreated && this.boxManager ? this.boxManager.setCollectorContainer(r) : tt.params && (tt.params.collectorContainer = r);
  }
  static register(r) {
    return Ji.register(r);
  }
  static unregister(r) {
    return Ji.unregister(r);
  }
  async addApp(r) {
    if (this.appManager)
      return this.appManager.rootDirRemoving ? new Promise((i, o) => {
        Ke.once("rootDirRemoved").then(async () => {
          try {
            const c = await this._addApp(r);
            i(c);
          } catch (c) {
            o(c.message);
          }
        });
      }) : this._addApp(r);
    throw new vs();
  }
  async _addApp(r) {
    var i, o, c;
    if (this.appManager) {
      if (!r.kind || typeof r.kind != "string")
        throw new IN();
      r.src && typeof r.src == "string" && Ji.register({ kind: r.kind, src: r.src });
      const h = await ((i = Ji.appClasses.get(r.kind)) == null ? void 0 : i());
      if (h && ((o = h.config) == null ? void 0 : o.singleton) && this.appManager.appProxies.has(r.kind))
        throw new MN();
      const m = this.setupScenePath(r, this.appManager);
      return m === void 0 ? void 0 : ((c = r == null ? void 0 : r.options) != null && c.scenePath && (r.options.scenePath = xN(r.options.scenePath)), await this.appManager.addApp(r, Boolean(m)));
    } else
      throw new vs();
  }
  setupScenePath(r, i) {
    let o = !1;
    if (r.options) {
      const { scenePath: c, scenes: h } = r.options;
      if (c) {
        if (!SN(c))
          throw new RN();
        const m = Object.keys(this.apps || {});
        for (const w of m) {
          const g = i.store.getAppScenePath(w);
          if (g && g === c) {
            if (console.warn(`[WindowManager]: ScenePath "${c}" already opened`), this.boxManager) {
              const x = this.boxManager.getTopBox();
              x && (this.boxManager.setZIndex(w, x.zIndex + 1, !1), this.boxManager.focusBox({ appId: w }, !1));
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
        this.room.putScenes(xr, [o || {}], c);
      } else
        this.room.putScenes(xr, [o || {}]);
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
    this.readonly = r, (i = this.boxManager) == null || i.setReadonly(r), Ke.emit("setReadonly", r);
  }
  switchMainViewToWriter() {
    var r;
    return (r = this.appManager) == null ? void 0 : r.mainViewProxy.mainViewClickHandler();
  }
  onAppDestroy(r, i) {
    wN(`destroy-${r}`, i);
  }
  onAppEvent(r, i) {
    return Ke.on(`custom-${r}`, i);
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
    this._fullscreen !== r && (this._fullscreen = r, (i = tt.sizer) == null || i.classList.toggle("netless-window-manager-fullscreen", r), Nt.emit("fullscreenChange", r));
  }
  get cursorUIDs() {
    return this._cursorUIDs;
  }
  setCursorUIDs(r) {
    var i, o;
    if (this._cursorUIDs = r || [], this._cursorUIDs.length === 0)
      (i = this._cursorUIDsStyleDOM) == null || i.remove();
    else {
      this._cursorUIDsStyleDOM || (this._cursorUIDsStyleDOM = document.createElement("style")), (o = tt.playground) == null || o.appendChild(this._cursorUIDsStyleDOM);
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
          var m, w, g, x, T, A, I, z;
          return Number((x = (g = (w = (m = this.appManager) == null ? void 0 : m.boxManager) == null ? void 0 : w.getBox(c)) == null ? void 0 : g._zIndex$) == null ? void 0 : x.value) > Number((z = (I = (A = (T = this.appManager) == null ? void 0 : T.boxManager) == null ? void 0 : A.getBox(h)) == null ? void 0 : I._zIndex$) == null ? void 0 : z.value) ? c : h;
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
    var r, i;
    return Boolean((i = (r = this.appManager) == null ? void 0 : r.boxManager) == null ? void 0 : i.darkMode);
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
    throw new vs();
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
    const i = tS(r, ["animationMode"]), o = { ...this.mainView.camera };
    tg({ ...o, ...i }, o) || (this.mainView.moveCamera(r), (c = this.appManager) == null || c.dispatchInternalEvent(Gt.MoveCamera, r), setTimeout(() => {
      var h;
      (h = this.appManager) == null || h.mainViewProxy.setCameraAndSize();
    }, 500));
  }
  moveCameraToContain(r) {
    var i;
    this.mainView.moveCameraToContain(r), (i = this.appManager) == null || i.dispatchInternalEvent(Gt.MoveCameraToContain, r), setTimeout(() => {
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
    (r = this.containerResizeObserver) == null || r.disconnect(), (i = this.appManager) == null || i.destroy(), (o = this.cursorManager) == null || o.destroy(), tt.container = void 0, tt.wrapper = void 0, tt.sizer = void 0, tt.isCreated = !1, tt.playground && ((c = tt.playground.parentNode) == null || c.removeChild(tt.playground)), tt.params = void 0, (h = this._iframeBridge) == null || h.destroy(), this._iframeBridge = void 0, Ta("Destroyed");
  }
  bindMainView(r, i) {
    var o;
    this.appManager && (this.appManager.bindMainView(r, Boolean(i)), (o = this.cursorManager) == null || o.setMainViewDivElement(r));
  }
  get canOperate() {
    return Du(this.displayer) ? this.displayer.isWritable && this.displayer.phase === Nu.Connected : !1;
  }
  get room() {
    return this.displayer;
  }
  safeSetAttributes(r) {
    this.canOperate && this.setAttributes(r);
  }
  safeUpdateAttributes(r, i) {
    this.canOperate && this.updateAttributes(r, i);
  }
  setPrefersColorScheme(r) {
    var i, o;
    (o = (i = this.appManager) == null ? void 0 : i.boxManager) == null || o.setPrefersColorScheme(r);
  }
  cleanCurrentScene() {
    var r;
    Ta("clean current scene"), (r = this.focusedView) == null || r.cleanCurrentScene();
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
    this._refresh(), (r = this.appManager) == null || r.dispatchInternalEvent(Gt.Refresh);
  }
  _refresh() {
    var r, i;
    (r = this.appManager) == null || r.mainViewProxy.rebind(), tt.container && this.bindContainer(tt.container), (i = this.appManager) == null || i.refresher.refresh();
  }
  setContainerSizeRatio(r) {
    if (!kb(r) || !(r > 0))
      throw new Error(
        `[WindowManager]: updateContainerSizeRatio error, ratio must be a positive number. but got ${r}`
      );
    tt.containerSizeRatio = r, this.containerSizeRatio = r, Ke.emit("containerSizeRatioUpdate", r);
  }
  setScale(r) {
    this.room.dispatchMagixEvent("onScaleChange", r);
  }
  _setScale(r, i) {
    var h;
    if (!kb(r))
      return !1;
    const o = (m) => {
      !tt.mainViewWrapper || (tt.mainViewWrapper.style.width = `${m.width}px`, tt.mainViewWrapper.style.height = `${m.height}px`);
    }, c = (h = tt.wrapper) == null ? void 0 : h.getBoundingClientRect();
    return c ? (o({ width: (c == null ? void 0 : c.width) * r, height: (c == null ? void 0 : c.height) * r }), i || Ke.emit("onScaleChange", r), this.safeUpdateAttributes(["scale"], r), !0) : !1;
  }
  isDynamicPPT(r) {
    var o, c;
    const i = (c = (o = r[0]) == null ? void 0 : o.ppt) == null ? void 0 : c.src;
    return i == null ? void 0 : i.startsWith("pptx://");
  }
  async ensureAttributes() {
    $D(this.attributes) && await vM(50), Ca(this.attributes) && (this.attributes[bi.Apps] || this.safeSetAttributes({ [bi.Apps]: {} }), this.attributes[bi.Cursors] || this.safeSetAttributes({ [bi.Cursors]: {} }), this.attributes._mainScenePath || this.safeSetAttributes({ _mainScenePath: pM }), this.attributes._mainSceneIndex || this.safeSetAttributes({ _mainSceneIndex: 0 }), this.attributes[bi.Registered] || this.safeSetAttributes({ [bi.Registered]: {} }), this.attributes[bi.IframeBridge] || this.safeSetAttributes({ [bi.IframeBridge]: {} }));
  }
  getIframeBridge() {
    if (!this.appManager)
      throw new Error("[WindowManager]: should call getIframeBridge() after await mount()");
    return this._iframeBridge || (this._iframeBridge = new Pd(this, this.appManager)), this._iframeBridge;
  }
  setBackgroundImg(r) {
    this.room.dispatchMagixEvent("onMainViewBackgroundImgChange", r);
  }
  _setBackgroundImg(r) {
    !tt.mainViewWrapper || (tt.mainViewWrapper.style.backgroundImage = `url(${r})`, this.safeUpdateAttributes(["mainViewBackgroundImg"], r));
  }
};
let Ht = tt;
Ht.kind = "WindowManager";
Ht.debug = !1;
Ht.containerSizeRatio = tN;
Ht.isCreated = !1;
Ht._resolve = (r) => {
};
UO();
export {
  MN as AppCreateError,
  vs as AppManagerNotInitError,
  qO as AppNotRegisterError,
  NN as BindContainerRoomPhaseInvalidError,
  DN as BoxManagerNotFoundError,
  AN as BoxNotCreatedError,
  KO as BuiltinApps,
  HO as DomEvents,
  Pd as IframeBridge,
  VO as IframeEvents,
  RN as InvalidScenePath,
  IN as ParamsInvalidError,
  EN as WhiteWebSDKInvalidError,
  Ht as WindowManager,
  bM as calculateNextIndex,
  FO as reconnectRefresher
};
//# sourceMappingURL=index.mjs.map
