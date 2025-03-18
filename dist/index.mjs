import mM from "p-retry";
import kd from "emittery";
import { debounce as xs, isEqual as ng, omit as iS, isObject as xa, has as Pb, get as wn, size as QD, mapValues as ZD, noop as vM, pick as YD, isNumber as zb, isEmpty as Xh, isInteger as GD, orderBy as XD, isFunction as xd, isString as eT, isNull as JD } from "lodash";
import { ScenePathType as Xv, UpdateEventKind as gM, listenUpdated as ig, unlistenUpdated as rS, reaction as cg, autorun as Ss, toJS as qD, listenDisposed as KD, unlistenDisposed as ek, ViewMode as sl, AnimationMode as Ob, isPlayer as aS, isRoom as ol, WhiteVersion as tk, ApplianceNames as kn, RoomPhase as ll, PlayerPhase as tT, InvisiblePlugin as nk } from "white-web-sdk";
import { v4 as ik } from "uuid";
import { ResizeObserver as rk } from "@juggle/resize-observer";
import nT from "video.js";
import { createSideEffectBinder as ak, withValueEnhancer as sk } from "value-enhancer";
var Xt = /* @__PURE__ */ ((r) => (r.AppMove = "AppMove", r.AppFocus = "AppFocus", r.AppResize = "AppResize", r.AppBoxStateChange = "AppBoxStateChange", r.GetAttributes = "GetAttributes", r.UpdateWindowManagerWrapper = "UpdateWindowManagerWrapper", r.InitReplay = "InitReplay", r.WindowCreated = "WindowCreated", r.SetMainViewScenePath = "SetMainViewScenePath", r.SetMainViewSceneIndex = "SetMainViewSceneIndex", r.SetAppFocusIndex = "SetAppFocusIndex", r.SwitchViewsToFreedom = "SwitchViewsToFreedom", r.MoveCamera = "MoveCamera", r.MoveCameraToContain = "MoveCameraToContain", r.CursorMove = "CursorMove", r.RootDirRemoved = "RootDirRemoved", r.Refresh = "Refresh", r.InitMainViewCamera = "InitMainViewCamera", r))(Xt || {});
const Lb = "__WindowManger", ub = "__WindowMangerEnsureReconnected__";
var Ji = /* @__PURE__ */ ((r) => (r.Size = "size", r.Position = "position", r.SceneIndex = "SceneIndex", r.ZIndex = "zIndex", r))(Ji || {}), yM = /* @__PURE__ */ ((r) => (r.setBoxSize = "setBoxSize", r.setBoxMinSize = "setBoxMinSize", r.destroy = "destroy", r))(yM || {}), Bb = /* @__PURE__ */ ((r) => (r.StartCreate = "StartCreate", r))(Bb || {}), jb = /* @__PURE__ */ ((r) => (r.Leave = "leave", r.Normal = "normal", r))(jb || {});
const iT = "2.16.1", ok = 340 / 720, lk = 340 / 720, uk = 9 / 16, Cr = "/", wM = "/init", bM = 50, Dt = new kd();
class ck {
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
    }, bM), this.isEmit = !0;
  }
  empty() {
    this.list = [], this.clear();
  }
  destroy() {
    this.timer && this.clear();
  }
}
const tt = new kd(), dk = "__WindowManagerAppCache";
let rp, rT;
const fk = async () => {
  rp = await mk();
}, hk = (r, n) => {
  if (!!rp)
    return gk(rp, { kind: r, sourceCode: n });
}, pk = async (r) => rp ? await vk(rp, r) : null;
function mk() {
  return new Promise((r, n) => {
    const o = indexedDB.open(dk, 2);
    o.onerror = (l) => {
      n(l);
    }, o.onupgradeneeded = (l) => {
      const h = l.target.result;
      h.objectStoreNames.contains("apps") || (rT = h.createObjectStore("apps", { keyPath: "kind" }), rT.createIndex("kind", "kind", { unique: !0 }));
    }, o.onsuccess = () => {
      const l = o.result;
      r(l);
    };
  });
}
function vk(r, n) {
  return new Promise((o, l) => {
    const m = r.transaction(["apps"]).objectStore("apps").index("kind").get(n);
    m.onerror = (y) => l(y), m.onsuccess = () => {
      m.result ? o(m.result) : o(null);
    };
  });
}
function gk(r, n) {
  return new Promise((o, l) => {
    const h = r.transaction(["apps"], "readwrite").objectStore("apps").add(n);
    h.onsuccess = () => o(), h.onerror = () => l();
  });
}
const yk = "NetlessApp", wk = 1e4, bk = async (r) => {
  const n = await pk(r);
  if (n)
    return n.sourceCode;
  {
    const l = await (await Ck(r, { timeout: wk })).text();
    return await hk(r, l), l;
  }
}, aT = (r, n) => {
  let o = Function(r + `
;return ${n}`)();
  return typeof o > "u" && (o = window[n]), o;
}, Sk = async (r, n, o) => {
  const l = o || yk + n;
  Dt.emit("loadApp", { kind: n, status: "start" });
  let h;
  try {
    if (h = await bk(r), !h || h.length === 0)
      throw Dt.emit("loadApp", { kind: n, status: "failed", reason: "script is empty." }), new Error("[WindowManager]: script is empty.");
  } catch (m) {
    throw Dt.emit("loadApp", { kind: n, status: "failed", reason: m.message }), m;
  }
  return xk(h, l, n);
}, xk = (r, n, o) => {
  try {
    const l = aT(r, n);
    return Dt.emit("loadApp", { kind: o, status: "success" }), l;
  } catch (l) {
    if (l.message.includes("Can only have one anonymous define call per script file")) {
      const h = window.define;
      typeof h == "function" && h.amd && delete h.amd;
      const m = aT(r, n);
      return Dt.emit("loadApp", { kind: o, status: "success" }), m;
    }
    throw Dt.emit("loadApp", { kind: o, status: "failed", reason: l.message }), l;
  }
};
async function Ck(r, n) {
  const { timeout: o = 1e4 } = n, l = new AbortController(), h = setTimeout(() => l.abort(), o), m = await fetch(r, {
    ...n,
    signal: l.signal,
    headers: {
      "content-type": "text/plain"
    }
  });
  return clearTimeout(h), m;
}
class Tk {
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
      const h = await Sk(o, n.kind, n.name);
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
      const o = new kd();
      this.kindEmitters.set(n, o);
    }
    return this.kindEmitters.get(n);
  }
}
const qi = new Tk(), Mk = async (r) => {
  var o, l;
  const n = await ((o = qi.appClasses.get(r)) == null ? void 0 : o());
  return n && ((l = n.config) == null ? void 0 : l.singleton) ? r : `${r}-${ik().replace("-", "").slice(0, 8)}`;
}, Pu = (r, n) => {
  if (r.focusScenePath !== n)
    return r.focusScenePath = n, r;
}, Vb = (r, n) => {
  if (r && r.isWritable && r.state.sceneState.scenePath !== n) {
    const o = n === "/" ? "" : n;
    r.setScenePath(o);
  }
}, Ek = (r, n, o) => {
  var l;
  if (r && n) {
    const m = (l = Ad(r)[n]) == null ? void 0 : l[o];
    if (m)
      return `${n}/${m.name}`;
  }
}, Ub = (r, n, o) => {
  r && r.scenePathType(n) !== Xv.None && r.removeScenes(n, o);
}, Ik = (r, n) => {
  tt.once(r).then(n);
};
xs(
  (r, n) => {
    r.emit("mainViewModeChange", n);
  },
  200
);
const Ak = (r, n, o = 0) => {
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
}, Rk = (r) => r.startsWith("/"), cb = (r) => {
  const n = r.split("/");
  n.pop();
  let o = n.join("/");
  return o === "" && (o = "/"), o;
}, Dk = (r) => r.endsWith("/") ? r.slice(0, -1) : r, sT = (r) => {
  const n = r.split(".").map((o) => o.padStart(2, "0")).join("");
  return parseInt(n);
}, SM = (r) => new Promise((n) => setTimeout(n, r)), kk = (r) => r.split("").reduce((o, l) => (l === Cr && (o += 1), o), 0) === 1;
class Nk {
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
      ng(iS(o, ["animationMode"]), { ...this.manager.mainView.camera }) || this.manager.mainView.moveCamera(o);
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
        const l = this.manager.appProxies.get(o.appID);
        l && l.setSceneIndexWithoutSync(o.index);
      }
    };
  }
  get boxManager() {
    return this.manager.boxManager;
  }
  addListeners() {
    this.displayer.addMagixEventListener(Lb, this.mainMagixEventListener);
  }
  removeListeners() {
    this.displayer.removeMagixEventListener(Lb, this.mainMagixEventListener);
  }
}
class _k extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: app duplicate exists and cannot be created again";
  }
}
class dL extends Error {
  constructor(n) {
    super(`[WindowManager]: app ${n} need register or provide src`);
  }
}
class ms extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: AppManager must be initialized";
  }
}
class Pk extends Error {
  constructor(n) {
    super(`[WindowManager]: white-web-sdk version must large than ${n}`);
  }
}
class zk extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: kind must be a valid string";
  }
}
class Ok extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: box need created";
  }
}
class Lk extends Error {
  constructor() {
    super(...arguments), this.message = '[WindowManager]: ScenePath should start with "/"';
  }
}
class Bk extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: boxManager not found";
  }
}
class jk extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: room phase only Connected can be bindContainer";
  }
}
const xM = "!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", Vk = xM.length, oT = Array(20), Cd = () => {
  for (let r = 0; r < 20; r++)
    oT[r] = xM.charAt(Math.random() * Vk);
  return oT.join("");
};
class Nd {
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
const CM = (r) => (n, o) => {
  if (n !== void 0)
    if (ig) {
      const l = (h) => {
        h.map((y) => y.kind).includes(r) && o();
      };
      return ig(n, l), o(), () => rS(n, l);
    } else
      return cg(
        () => n,
        () => {
          o();
        },
        {
          fireImmediately: !0
        }
      );
}, TM = (r, n, o) => {
  let l = null;
  const h = cg(
    r,
    () => {
      l && (l(), l = null);
      const m = r();
      xa(m) ? (l = () => rS(m, n), ig(m, n)) : o == null || o(m);
    },
    { fireImmediately: !0 }
  );
  return () => {
    l == null || l(), h();
  };
}, Uk = CM(gM.Removed);
CM(gM.Inserted);
class Hk {
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
const db = Object.keys;
function lT(r) {
  return Boolean(Pb(r, "__isRef"));
}
function Wk(r) {
  return { k: Cd(), v: r, __isRef: !0 };
}
const ba = "_WM-STORAGE_";
class uT {
  constructor(n, o, l) {
    if (this._sideEffect = new Nd(), this._destroyed = !1, this._refMap = /* @__PURE__ */ new WeakMap(), this._lastValue = /* @__PURE__ */ new Map(), this.onStateChanged = new Hk(), l && !xa(l))
      throw new Error(`Default state for Storage ${o} is not an object.`);
    this._context = n, this.id = o || null, this._state = {};
    const h = this._getRawState(this._state);
    this._context.getIsWritable() && (this.id === null ? n.isAddApp && l && this.setState(l) : (h === this._state || !xa(h)) && (wn(this._context.getAttributes(), [ba]) || this._context.updateAttributes([ba], {}), this._context.updateAttributes([ba, this.id], this._state), l && this.setState(l))), db(h).forEach((m) => {
      if (!(this.id === null && m === ba))
        try {
          const y = xa(h[m]) ? JSON.parse(JSON.stringify(h[m])) : h[m];
          lT(y) ? (this._state[m] = y.v, xa(y.v) && this._refMap.set(y.v, y)) : this._state[m] = y;
        } catch (y) {
          console.error(y);
        }
    }), this._sideEffect.addDisposer(
      TM(
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
      db(n).reduce((o, l) => (Pb(this._state, l) || (o[l] = n[l]), o), {})
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
    const o = db(n);
    o.length > 0 && o.forEach((l) => {
      const h = n[l];
      if (h !== this._state[l])
        if (h === void 0)
          this._lastValue.set(l, this._state[l]), delete this._state[l], this._setRawState(l, h);
        else {
          this._lastValue.set(l, this._state[l]), this._state[l] = h;
          let m = h;
          if (xa(h)) {
            let y = this._refMap.get(h);
            y || (y = Wk(h), this._refMap.set(h, y)), m = y;
          }
          this._setRawState(l, m);
        }
    });
  }
  emptyStorage() {
    if (!(QD(this._state) <= 0)) {
      if (this._destroyed) {
        console.error(new Error(`Cannot empty destroyed Storage "${this.id}".`));
        return;
      }
      if (!this._context.getIsWritable()) {
        console.error(new Error(`Cannot empty Storage "${this.id}" without writable access.`));
        return;
      }
      this.setState(ZD(this._state, vM));
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
          const m = n[h], y = m.key;
          if (this.id === null && y === ba)
            continue;
          const g = xa(m.value) ? JSON.parse(JSON.stringify(m.value)) : m.value;
          let S;
          switch (this._lastValue.has(y) && (S = this._lastValue.get(y), this._lastValue.delete(y)), m.kind) {
            case 2: {
              Pb(this._state, y) && (S = this._state[y], delete this._state[y]), l[y] = { oldValue: S };
              break;
            }
            default: {
              let C = g;
              if (lT(g)) {
                const { k: I, v: A } = g, z = this._state[y];
                xa(z) && ((o = this._refMap.get(z)) == null ? void 0 : o.k) === I ? C = z : (C = A, xa(A) && this._refMap.set(A, g));
              }
              C !== this._state[y] && (S = this._state[y], this._state[y] = C), l[y] = { newValue: C, oldValue: S };
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
class Fk {
  constructor(n, o, l, h, m) {
    this.manager = n, this.boxManager = o, this.appId = l, this.appProxy = h, this.appOptions = m, this.mobxUtils = {
      autorun: Ss,
      reaction: cg,
      toJS: qD
    }, this.objectUtils = {
      listenUpdated: ig,
      unlistenUpdated: rS,
      listenDisposed: KD,
      unlistenDisposed: ek
    }, this.store = this.manager.store, this.isReplay = this.manager.isReplay, this.getDisplayer = () => this.manager.displayer, this.getAttributes = () => this.appProxy.attributes, this.getScenes = () => {
      const y = this.store.getAppAttributes(this.appId);
      return y != null && y.isDynamicPPT ? this.appProxy.scenes : y == null ? void 0 : y.options.scenes;
    }, this.getView = () => this.appProxy.view, this.mountView = (y) => {
      const g = this.getView();
      g && (g.divElement = y, setTimeout(() => {
        var S;
        (S = this.getRoom()) == null || S.refreshViewSize(), Dt.emit("onAppViewMounted", { appId: this.appId, view: g });
      }, 1e3));
    }, this.getInitScenePath = () => this.manager.getAppInitPath(this.appId), this.getIsWritable = () => this.manager.canOperate, this.getIsAppReadonly = () => this.manager.appReadonly, this.getBox = () => {
      const y = this.boxManager.getBox(this.appId);
      if (y)
        return y;
      throw new Ok();
    }, this.getRoom = () => this.manager.room, this.setAttributes = (y) => {
      this.manager.safeSetAttributes({ [this.appId]: y });
    }, this.updateAttributes = (y, g) => {
      this.manager.attributes[this.appId] && this.manager.safeUpdateAttributes([this.appId, ...y], g);
    }, this.setScenePath = async (y) => {
      var g;
      !this.appProxy.box || (this.appProxy.setFullPath(y), (g = this.getRoom()) == null || g.setScenePath(y));
    }, this.getAppOptions = () => typeof this.appOptions == "function" ? this.appOptions() : this.appOptions, this.createStorage = (y, g) => {
      const S = new uT(this, y, g);
      return this.emitter.on("destroy", () => {
        S.destroy();
      }), S;
    }, this.dispatchMagixEvent = (...y) => {
      var S;
      const g = `${this.appId}:${y[0]}`;
      return (S = this.manager.room) == null ? void 0 : S.dispatchMagixEvent(g, y[1]);
    }, this.addMagixEventListener = (y, g, S) => {
      const C = `${this.appId}:${y}`;
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
      const y = this.pageState.index + 1;
      return y > this.pageState.length - 1 ? (console.warn("[WindowManager] nextPage: index out of range"), !1) : (this.appProxy.setSceneIndex(y), !0);
    }, this.jumpPage = async (y) => 0 <= y && y < this.pageState.length ? (this.appProxy.setSceneIndex(y), !0) : (console.warn("[WindowManager] nextPage: index out of range"), !1), this.prevPage = async () => {
      const y = this.pageState.index - 1;
      return y < 0 ? (console.warn("[WindowManager] prevPage: index out of range"), !1) : (this.appProxy.setSceneIndex(y), !0);
    }, this.addPage = async (y) => {
      const g = y == null ? void 0 : y.after, S = y == null ? void 0 : y.scene, C = this.appProxy.scenePath;
      if (!!C)
        if (g) {
          const I = this.pageState.index + 1;
          Jh(this.manager.room, C, [S || {}], I);
        } else
          Jh(this.manager.room, C, [S || {}]);
    }, this.removePage = async (y) => {
      const g = y === void 0 ? this.pageState.index : y;
      return this.pageState.length === 1 ? (console.warn("[WindowManager]: can not remove the last page"), !1) : g < 0 || g >= this.pageState.length ? (console.warn(`[WindowManager]: page index ${y} out of range`), !1) : this.appProxy.removeSceneByIndex(g);
    }, this.emitter = h.appEmitter, this.isAddApp = h.isAddApp;
  }
  get storage() {
    return this._storage || (this._storage = new uT(this)), this._storage;
  }
  get pageState() {
    return this.appProxy.pageState;
  }
  get kind() {
    return this.appProxy.kind;
  }
  dispatchAppEvent(n, o) {
    tt.emit(`custom-${this.kind}`, {
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
class $k {
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
class Qk {
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
    const y = YD(n.options, m), g = { kind: n.kind, options: y, isDynamicPPT: l };
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
const Zk = new Qk({
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
}, MM = (r, n) => {
  let o = 0;
  const l = n.length - 1;
  return r === n.index ? r === l ? o = r - 1 : o = n.index + 1 : o = n.index, o;
}, po = new kd();
class sS {
  constructor(n, o, l, h) {
    var m;
    this.params = n, this.manager = o, this.boxManager = this.manager.boxManager, this.appProxies = this.manager.appProxies, this.viewManager = this.manager.viewManager, this.store = this.manager.store, this.status = "normal", this.getAppInitState = (y) => {
      var G, he;
      const g = this.store.getAppState(y);
      if (!g)
        return;
      const S = g == null ? void 0 : g[Ji.Position], C = this.store.focus, I = g == null ? void 0 : g[Ji.Size], A = g == null ? void 0 : g[Ji.SceneIndex], z = (G = this.attributes) == null ? void 0 : G.maximized, $ = (he = this.attributes) == null ? void 0 : he.minimized, U = g == null ? void 0 : g.zIndex;
      let q = { maximized: z, minimized: $, zIndex: U };
      return S && (q = { ...q, id: y, x: S.x, y: S.y }), C === y && (q = { ...q, focus: !0 }), I && (q = { ...q, width: I.width, height: I.height }), A && (q = { ...q, sceneIndex: A }), q;
    }, this.appAttributesUpdateListener = (y) => {
      this.manager.refresher.add(y, () => Ss(() => {
        const g = this.manager.attributes[y];
        g && this.appEmitter.emit("attributesUpdate", g);
      })), this.manager.refresher.add(this.stateKey, () => Ss(() => {
        var S, C, I, A;
        const g = (S = this.appAttributes) == null ? void 0 : S.state;
        (g == null ? void 0 : g.zIndex) > 0 && g.zIndex !== ((C = this.box) == null ? void 0 : C.zIndex) && ((I = this.boxManager) == null || I.setZIndex(y, g.zIndex), (A = this.boxManager) == null || A.focusBox({ appId: y }));
      })), this.manager.refresher.add(`${y}-fullPath`, () => Ss(() => {
        var S;
        const g = (S = this.appAttributes) == null ? void 0 : S.fullPath;
        this.setFocusScenePathHandler(g), this._prevFullPath !== g && (this.notifyPageStateChange(), this._prevFullPath = g);
      }));
    }, this.setFocusScenePathHandler = xs((y) => {
      var g;
      this.view && y && y !== ((g = this.view) == null ? void 0 : g.focusScenePath) && (Pu(this.view, y), Dt.emit("onAppScenePathChange", { appId: this.id, view: this.view }));
    }, 50), this.notifyPageStateChange = xs(() => {
      this.appEmitter.emit("pageStateChange", this.pageState);
    }, 50), this.kind = n.kind, this.id = l, this.stateKey = `${this.id}_state`, this.appProxies.set(this.id, this), this.appEmitter = new kd(), this.appListener = this.makeAppEventListener(this.id), this.isAddApp = h, this.initScenes(), (m = this.params.options) != null && m.scenePath && this.createView(), this._pageState = new $k({
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
    const n = wn(this.appAttributes, ["state", "SceneIndex"], 0), o = Ek(this.manager.room, this.scenePath, n);
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
    return tt.emit("updateManagerRect"), {
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
      throw new Bk();
    const y = new Fk(this.manager, this.boxManager, n, this, m);
    this.appContext = y;
    try {
      tt.once(`${n}${Xt.WindowCreated}`).then(async () => {
        var z, $, U, q, G, he, se, Z, ue, oe;
        let A;
        if (!o) {
          A = this.getAppInitState(n);
          const ke = (U = ($ = (z = this.boxManager) == null ? void 0 : z.teleBoxManager) == null ? void 0 : $.maximizedBoxes) == null ? void 0 : U.includes(n), Fe = (he = (G = (q = this.boxManager) == null ? void 0 : q.teleBoxManager) == null ? void 0 : G.minimizedBoxes) == null ? void 0 : he.includes(n);
          Object.assign(A || {}, { maximized: ke, minimized: Fe }), (se = this.boxManager) == null || se.updateBoxState(A);
          const Pe = (Z = this.boxManager) == null ? void 0 : Z.teleBoxManager.maximizedBoxes.filter((Y) => {
            var fe;
            return !((fe = this == null ? void 0 : this.boxManager) != null && fe.teleBoxManager.minimizedBoxes.includes(Y));
          });
          Pe != null && Pe.length && ((oe = (ue = this.boxManager) == null ? void 0 : ue.teleBoxManager) == null || oe.makeBoxTopFromMaximized());
        }
        this.appEmitter.onAny(this.appListener), this.appAttributesUpdateListener(n), this.setViewFocusScenePath(), setTimeout(async () => {
          console.log("setup app", l);
          const ke = await l.setup(y);
          this.appResult = ke, qi.notifyApp(this.kind, "created", { appId: n, result: ke }), this.afterSetupApp(A), this.fixMobileSize(), Dt.emit("onAppSetup", n);
        }, bM);
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
      const S = this.store.attributes.scale, C = this.store.attributes.mainViewBackgroundImg;
      let I = zb(S) ? S : 1;
      I < 1 && (I = 1), tt.emit("onScaleChange", I), tt.emit("onBackgroundImgChange", C);
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
    await new sS(l, this.manager, this.id, this.isAddApp).baseInsertApp(!0), (m = this.boxManager) == null || m.updateBoxState(o);
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
      var h, m, y, g;
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
            (y = this.boxManager) == null || y.setBoxTitle({ appId: n, title: l.title });
            break;
          }
          case yM.destroy: {
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
    this.manager.room && n && this.view && Vb(this.manager.room, n);
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
      const l = MM(n, this.pageState);
      return this.setSceneIndexWithoutSync(l), this.manager.dispatchInternalEvent(Xt.SetAppFocusIndex, {
        type: "app",
        appID: this.id,
        index: l
      }), setTimeout(() => {
        Ub(this.manager.room, o, n);
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
      } catch (y) {
        console.error("[WindowManager]: notifyApp error", y.message, y.stack);
      }
      this.appEmitter.clearListeners(), tt.emit(`destroy-${this.id}`, { error: h }), n && ((m = this.boxManager) == null || m.closeBox(this.id, l)), o && (this.store.cleanAppAttributes(this.id), this.scenePath && Ub(this.manager.room, this.scenePath)), this.appProxies.delete(this.id), this._pageState.destroy(), this.viewManager.destroyView(this.id), this.manager.appStatus.delete(this.id), this.manager.refresher.remove(this.id), this.manager.refresher.remove(this.stateKey), this.manager.refresher.remove(`${this.id}-fullPath`), this._prevFullPath = void 0;
    }
  }
  close() {
    return this.destroy(!0, !0, !1);
  }
}
class Yk {
  constructor(n) {
    this.displayer = n, this.views = /* @__PURE__ */ new Map();
  }
  createView(n) {
    const o = EM(this.displayer);
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
const EM = (r) => {
  const n = r.views.createView();
  return Gk(n), n;
}, Gk = (r) => {
  r.setCameraBound({
    maxContentMode: () => 10,
    minContentMode: () => 0.1
  });
};
class Xk {
  constructor(n) {
    this.manager = n, this.polling = !1, this.started = !1, this.mainViewIsAddListener = !1, this.store = this.manager.store, this.viewMode = this.manager.windowManger.viewMode, this.sideEffectManager = new Nd(), this.syncCamera = () => {
      if (!this.polling || this.viewMode !== sl.Broadcaster)
        return;
      const { mainViewCamera: l } = this;
      l && l.id !== this.manager.uid && this.moveCameraSizeByAttributes();
    }, this.startListenWritableChange = () => {
      this.sideEffectManager.add(() => tt.on("writableChange", (l) => {
        l && this.ensureCameraAndSize(), this.manager.room && this.syncMainView(this.manager.room);
      }));
    }, this.addCameraReaction = () => {
      this.manager.refresher.add(xi.MainViewCamera, this.cameraReaction);
    }, this.cameraReaction = () => cg(
      () => this.mainViewCamera,
      (l) => {
        l && l.id !== this.manager.uid && (this.moveCameraToContian(this.mainViewSize), this.moveCamera(l));
      },
      { fireImmediately: !0 }
    ), this.sizeChangeHandler = xs((l) => {
      l && (this.moveCameraToContian(l), this.moveCamera(this.mainViewCamera)), this.ensureMainViewSize();
    }, 30), this.onUpdateContainerSizeRatio = () => {
      const l = this.store.getMainViewSize();
      this.sizeChangeHandler(l);
    }, this.onCameraUpdatedByDevice = (l) => {
      this.viewMode !== sl.Follower && (this.store.setMainViewCamera({ ...l, id: this.manager.uid }), ng(this.mainViewSize, { ...this.mainView.size, id: this.manager.uid }) || this.setMainViewSize(this.view.size));
    }, this.mainViewClickListener = () => {
      this.mainViewClickHandler();
    }, this.setMainViewSize = xs((l) => {
      this.store.setMainViewSize({ ...l, id: this.manager.uid });
    }, 50), this._syncMainViewTimer = 0, this.onCameraOrSizeUpdated = () => {
      Dt.emit("cameraStateChange", this.cameraState), this.manager.room && this.manager.room.syncMainView && (clearTimeout(this._syncMainViewTimer), this._syncMainViewTimer = setTimeout(this.syncMainView, 100, this.manager.room)), this.ensureMainViewSize();
    }, this.syncMainView = (l) => {
      l.isWritable && l.syncMainView(this.mainView);
    }, this.setViewMode = (l) => {
      this.viewMode = l;
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
    const n = EM(this.manager.displayer), o = this.store.getMainViewScenePath();
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
      animationMode: Ob.Immediately
    }), this.scale = this.view.camera.scale);
  }
  moveCamera(n) {
    if (!Xh(n)) {
      if (ng(n, this.view.camera))
        return;
      const { centerX: o, centerY: l, scale: h } = n, m = h * (this.scale || 1);
      this.view.moveCamera({
        centerX: o,
        centerY: l,
        scale: m,
        animationMode: Ob.Immediately
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
class Jk {
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
    }, tt.on("focusedChange", (o) => {
      this.disposePrevFocusViewRedoUndoListeners(o.prev), setTimeout(() => {
        this.addRedoUndoListeners(o.focused);
      }, 0);
    }), tt.on("rootDirRemoved", () => {
      this.disposePrevFocusViewRedoUndoListeners(n.focus()), this.addRedoUndoListeners(n.focus());
    }), this.addRedoUndoListeners(n.focus());
  }
  destroy() {
    this.disposePrevFocusViewRedoUndoListeners(this.context.focus());
  }
}
class qk {
  constructor(n) {
    this.windowManger = n, this.appProxies = /* @__PURE__ */ new Map(), this.appStatus = /* @__PURE__ */ new Map(), this.store = Zk, this.isReplay = this.windowManger.isReplay, this.mainViewScenesLength = 0, this.callbacksNode = null, this.appCreateQueue = new ck(), this.sideEffectManager = new Nd(), this.sceneState = null, this.rootDirRemoving = !1, this.onRemoveScenes = async (o) => {
      var h, m;
      const { scenePath: l } = o;
      if (l === Cr) {
        await this.onRootDirRemoved(), this.dispatchInternalEvent(Xt.RootDirRemoved);
        return;
      }
      if (kk(l)) {
        let y = this.mainView.focusSceneIndex || 0, g = (h = this.callbacksNode) == null ? void 0 : h.scenes[y];
        g || (y = 0, g = (m = this.callbacksNode) == null ? void 0 : m.scenes[y]), g && this.setMainViewScenePath(`${Cr}${g}`), await this.setMainViewSceneIndex(y);
      } else
        this.appProxies.forEach((y) => {
          y.onRemoveScene(l);
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
          await this.onSceneChange(l), tt.emit("rootDirSceneRemoved", h);
        }
      }), this.callbacksNode && (this.updateSceneState(this.callbacksNode), this.mainViewScenesLength = this.callbacksNode.scenes.length, o && this.emitMainViewScenesChange(this.callbacksNode.scenes.length));
    }, this.removeSceneByIndex = async (o) => {
      var m;
      const l = MM(o, this.windowManger.pageState);
      this.setSceneIndexWithoutSync(l), this.dispatchInternalEvent(Xt.SetAppFocusIndex, { type: "main", index: l });
      const h = (m = this.callbacksNode) == null ? void 0 : m.scenes[o];
      return setTimeout(() => {
        h && Ub(this.room, `${Cr}${h}`, o);
      }, 100), new Promise((y, g) => {
        tt.once("rootDirSceneRemoved").then((S) => {
          S === h && y(!0);
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
      tt.emit("changePageState")
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
      this.refresher.add("apps", () => TM(
        () => this.attributes.apps,
        () => {
          this.attributesUpdateCallback(this.attributes.apps);
        }
      ));
    }, this.addAppCloseListener = () => {
      this.refresher.add("appsClose", () => Uk(this.attributes.apps, () => {
        this.onAppDelete(this.attributes.apps);
      }));
    }, this.onMainViewIndexChange = (o) => {
      o !== void 0 && this._prevSceneIndex !== o && (Dt.emit("mainViewSceneIndexChange", o), tt.emit("changePageState"), this.callbacksNode && this.updateSceneState(this.callbacksNode), this._prevSceneIndex = o);
    }, this.onFocusChange = (o) => {
      var l;
      this._prevFocused !== o && (Dt.emit("focusedChange", o), tt.emit("focusedChange", { focused: o, prev: this._prevFocused }), this._prevFocused = o, o !== void 0 && ((l = this.boxManager) == null || l.focusBox({ appId: o }), setTimeout(() => {
        const h = this.appProxies.get(o);
        h && qi.notifyApp(h.kind, "focus", { appId: o });
      }, 0)));
    }, this.attributesUpdateCallback = xs(
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
      }), tt.emit("observerIdChange", this.displayer.observerId);
    }, this.displayerWritableListener = (o) => {
      var m, y;
      const l = !o, h = this.windowManger.readonly === void 0 || this.windowManger.readonly === !1;
      this.windowManger.readonly === void 0 ? (m = this.boxManager) == null || m.setReadonly(o) : (y = this.boxManager) == null || y.setReadonly(!(l && h)), this.appProxies.forEach((g) => {
        g.emitAppIsWritableChange();
      }), tt.emit("writableChange", l);
    }, this.updateSceneIndex = () => {
      const o = this.store.getMainViewScenePath(), l = cb(o), h = Ad(this.displayer)[l];
      if (h.length) {
        const m = o.replace(l, "").replace("/", ""), y = h.findIndex((g) => g.name === m);
        GD(y) && y >= 0 && this.safeSetAttributes({ _mainSceneIndex: y });
      }
    }, this.updateRootDirRemoving = (o) => {
      this.rootDirRemoving = o;
    }, this.displayer = n.displayer, this.store.setContext({
      getAttributes: () => this.attributes,
      safeSetAttributes: (o) => this.safeSetAttributes(o),
      safeUpdateAttributes: (o, l) => this.safeUpdateAttributes(o, l)
    }), this.mainViewProxy = new Xk(this), this.viewManager = new Yk(this.displayer), this.appListeners = new Nk(this), this.displayer.callbacks.on(this.eventName, this.displayerStateListener), this.appListeners.addListeners(), this.refresher = nL, this.refresher.setRoom(this.room), this.refresher.setContext({ emitter: tt }), this.sideEffectManager.addDisposer(() => {
      var o, l;
      this.appCreateQueue.destroy(), this.mainViewProxy.destroy(), this.refresher.destroy(), this.viewManager.destroy(), (o = this.boxManager) == null || o.destroy(), (l = this.callbacksNode) == null || l.dispose();
    }), tt.once("onCreated").then(() => this.onCreated()), tt.on("onReconnected", () => this.onReconnected()), aS(this.displayer) && (tt.on("seekStart", this.onPlayerSeekStart), tt.on("seek", this.onPlayerSeekDone)), tt.on("removeScenes", this.onRemoveScenes), tt.on("setReadonly", this.onReadonlyChanged), this.createRootDirScenesCallback(), qi.setSyncRegisterApp((o) => {
      this.safeUpdateAttributes([xi.Registered, o.kind], o);
    });
  }
  getMemberState() {
    var n;
    return ((n = this.room) == null ? void 0 : n.state.memberState) || { strokeColor: [0, 0, 0] };
  }
  async onRootDirRemoved(n = !0) {
    this.setMainViewScenePath(wM), this.createRootDirScenesCallback();
    for (const [o, l] of this.appProxies.entries())
      l.view && await this.closeApp(o, n);
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
      return cb(n);
    throw new Error("[WindowManager]: mainViewSceneDir not found");
  }
  async onCreated() {
    var n;
    if (await this.attributesUpdateCallback(this.attributes.apps), tt.emit("updateManagerRect"), po.on("move", this.onBoxMove), po.on("resize", this.onBoxResize), po.on("focus", this.onBoxFocus), po.on("close", this.onBoxClose), po.on("boxStateChange", this.onBoxStateChange), this.addAppsChangeListener(), this.addAppCloseListener(), this.refresher.add("maximizedBoxes", () => Ss(() => {
      var l;
      const o = this.attributes.maximizedBoxes;
      (l = this.boxManager) == null || l.setMaximized(o);
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
    this.displayerWritableListener(!((n = this.room) != null && n.isWritable)), this.displayer.callbacks.on("onEnableWriteNowChanged", this.displayerWritableListener), this._prevFocused = this.attributes.focus, this.sideEffectManager.add(() => {
      const o = new Jk({
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
      const h = XD(
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
          const y = n[m];
          try {
            if (!this.attributes[m])
              throw new Error("appAttributes is undefined");
            this.appCreateQueue.push(() => (this.appStatus.set(m, Bb.StartCreate), this.baseInsertApp(
              {
                kind: y.kind,
                options: y.options,
                isDynamicPPT: y.isDynamicPPT
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
    l.disableCameraTransform = o, l.divElement = n, l.focusScenePath || this.setMainViewFocusPath(), tt.emit("mainViewMounted"), Dt.emit("onMainViewMounted", l);
  }
  setMainViewFocusPath(n) {
    var l;
    const o = n || this.store.getMainViewScenePath();
    if (o)
      return Pu(this.mainView, o), ((l = this.mainView) == null ? void 0 : l.focusScenePath) === o;
  }
  resetScenePath(n) {
    this.displayer.state.sceneState.scenePath !== n && Vb(this.room, n);
  }
  async addApp(n, o) {
    Ca("addApp", n);
    const { appId: l, needFocus: h } = await this.beforeAddApp(n, o), m = await this.baseInsertApp(n, l, !0, h);
    return this.afterAddApp(m), m == null ? void 0 : m.id;
  }
  async beforeAddApp(n, o) {
    var y, g;
    const l = await Mk(n.kind);
    this.appStatus.set(l, Bb.StartCreate);
    const h = (y = n.attributes) != null ? y : {};
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
    const m = new sS(n, this, o, l);
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
      if (cb(n) !== Cr)
        throw new Error('[WindowManager]: main view scenePath must in root dir "/"');
      if (o === Xv.None)
        throw new Error(`[WindowManager]: ${n} not valid scene`);
      if (o === Xv.Page)
        await this._setMainViewScenePath(n);
      else if (o === Xv.Dir) {
        const h = Ak(this.displayer, n);
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
    this.dispatchInternalEvent(Xt.SetMainViewScenePath, { nextScenePath: n }), Dt.emit("mainViewScenePathChange", n), Vb(this.room, n);
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
    this.safeDispatchMagixEvent(Lb, {
      eventName: n,
      payload: o
    });
  }
  destroy() {
    this.displayer.callbacks.off(this.eventName, this.displayerStateListener), this.displayer.callbacks.off("onEnableWriteNowChanged", this.displayerWritableListener), this.appListeners.removeListeners(), po.clearListeners(), tt.clearListeners(), this.appProxies.size && this.appProxies.forEach((n) => {
      n.destroy(!0, !1, !0);
    }), Dt.clearListeners(), this.sideEffectManager.flushAll(), this._prevFocused = void 0, this._prevSceneIndex = void 0;
  }
}
const Kk = (r) => {
  const n = document.createElement("div");
  n.className = "netless-window-manager-playground";
  const o = document.createElement("div");
  o.className = "netless-window-manager-sizer";
  const l = document.createElement("div");
  l.className = "netless-window-manager-wrapper";
  const h = document.createElement("div");
  h.className = "netless-window-manager-main-view-wrapper netless-window-manager-fancy-scrollbar";
  const m = document.createElement("div");
  m.className = "netless-window-manager-main-view-wrapper";
  const y = document.createElement("div");
  y.className = "netless-window-manager-main-view";
  const g = document.createElement("div");
  return g.style.display = "none", n.appendChild(o), n.appendChild(g), o.appendChild(l), m.appendChild(y), h.appendChild(m), l.appendChild(h), r.appendChild(n), Wt.wrapper = l, { playground: n, wrapper: l, sizer: o, mainViewElement: y, mainViewWrapper: m, extendWrapper: g, mainViewScrollWrapper: h };
}, eN = () => {
  if (sT(tk) < sT(iT))
    throw new Pk(iT);
}, Hb = (r, n) => {
  var m;
  const o = (r == null ? void 0 : r.state.roomMembers) || [];
  let l = -1, h;
  for (const y of o)
    ((m = y.payload) == null ? void 0 : m.uid) === n && l < y.memberId && (l = y.memberId, h = y);
  return h;
}, tN = async (r) => {
  let n = r.getInvisiblePlugin(Wt.kind);
  if (n)
    return n;
  let o;
  const l = new Promise((C) => {
    Wt._resolve = o = C;
  });
  let h = !1;
  const m = nN(r);
  !r.isWritable && m && (h = !0, await mM(
    async (C) => {
      Ca(`switching to writable (x${C})`), await r.setWritable(!0);
    },
    { retries: 10, maxTimeout: 5e3 }
  )), r.isWritable ? (Ca("creating InvisiblePlugin..."), r.createInvisiblePlugin(Wt, {}).catch(console.warn)) : (m && console.warn("[WindowManager]: failed to switch to writable"), console.warn("[WindowManager]: waiting for others to create the plugin..."));
  const y = setTimeout(() => {
    console.warn("[WindowManager]: no one called createInvisiblePlugin() after 20 seconds");
  }, 2e4), g = setTimeout(() => {
    throw new Error("[WindowManager]: no one called createInvisiblePlugin() after 60 seconds");
  }, 6e4), S = setInterval(() => {
    n = r.getInvisiblePlugin(Wt.kind), n && (clearTimeout(g), clearTimeout(y), clearInterval(S), o(n), h && r.isWritable && setTimeout(() => r.setWritable(!1).catch(console.warn), 500));
  }, 200);
  return l;
}, nN = (r) => {
  try {
    const n = atob(r.roomToken.slice(12)), o = n.indexOf("&role=");
    return +n[o + 6] < 2;
  } catch (n) {
    return console.error(n), !1;
  }
}, iN = window.ResizeObserver || rk;
class oS {
  constructor(n) {
    this.emitter = n;
  }
  static create(n, o, l, h) {
    const m = new oS(h);
    return m.observePlaygroundSize(n, o, l), m;
  }
  observePlaygroundSize(n, o, l) {
    this.updateSizer(n.getBoundingClientRect(), o, l), this.containerResizeObserver = new iN((h) => {
      var y;
      const m = (y = h[0]) == null ? void 0 : y.contentRect;
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
var IM = { exports: {} };
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
    var $ = new h(I, A || S, z), U = o ? o + C : C;
    return S._events[U] ? S._events[U].fn ? S._events[U] = [S._events[U], $] : S._events[U].push($) : (S._events[U] = $, S._eventsCount++), S;
  }
  function y(S, C) {
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
    for (var z = 0, $ = A.length, U = new Array($); z < $; z++)
      U[z] = A[z].fn;
    return U;
  }, g.prototype.listenerCount = function(C) {
    var I = o ? o + C : C, A = this._events[I];
    return A ? A.fn ? 1 : A.length : 0;
  }, g.prototype.emit = function(C, I, A, z, $, U) {
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
          return G.fn.call(G.context, I, A, z, $, U), !0;
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
    var U = this._events[$];
    if (U.fn)
      U.fn === I && (!z || U.once) && (!A || U.context === A) && y(this, $);
    else {
      for (var q = 0, G = [], he = U.length; q < he; q++)
        (U[q].fn !== I || z && !U[q].once || A && U[q].context !== A) && G.push(U[q]);
      G.length ? this._events[$] = G.length === 1 ? G[0] : G : y(this, $);
    }
    return this;
  }, g.prototype.removeAllListeners = function(C) {
    var I;
    return C ? (I = o ? o + C : C, this._events[I] && y(this, I)) : (this._events = new l(), this._eventsCount = 0), this;
  }, g.prototype.off = g.prototype.removeListener, g.prototype.addListener = g.prototype.on, g.prefixed = o, g.EventEmitter = g, r.exports = g;
})(IM);
var rg = IM.exports;
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
function lS(r, n) {
  var o = {};
  for (var l in r)
    Object.prototype.hasOwnProperty.call(r, l) && n.indexOf(l) < 0 && (o[l] = r[l]);
  if (r != null && typeof Object.getOwnPropertySymbols == "function")
    for (var h = 0, l = Object.getOwnPropertySymbols(r); h < l.length; h++)
      n.indexOf(l[h]) < 0 && Object.prototype.propertyIsEnumerable.call(r, l[h]) && (o[l[h]] = r[l[h]]);
  return o;
}
var fb = 0, AM = typeof window < "u" && window.requestAnimationFrame !== void 0 ? function(r) {
  return window.requestAnimationFrame(r);
} : function(r) {
  var n = Date.now(), o = Math.max(0, 16.7 - (n - fb));
  fb = n + o, setTimeout(function() {
    return r(fb);
  }, o);
}, rN = function(r) {
  var n = [], o = [], l = 0, h = !1, m = 0, y = /* @__PURE__ */ new WeakSet(), g = /* @__PURE__ */ new WeakSet(), S = {
    cancel: function(C) {
      var I = o.indexOf(C);
      y.add(C), I !== -1 && o.splice(I, 1);
    },
    process: function(C) {
      var I;
      if (h = !0, I = [o, n], n = I[0], o = I[1], o.length = 0, l = n.length, l) {
        var A;
        for (m = 0; m < l; m++)
          A = n[m], A(C), g.has(A) === !0 && !y.has(A) && (S.schedule(A), r(!0));
      }
      h = !1;
    },
    schedule: function(C, I, A) {
      I === void 0 && (I = !1), A === void 0 && (A = !1);
      var z = A && h, $ = z ? n : o;
      y.delete(C), I && g.add(C), $.indexOf(C) === -1 && ($.push(C), z && (l = n.length));
    }
  };
  return S;
}, aN = 40, cT = 1 / 60 * 1e3, Jv = !0, sp = !1, Wb = !1, Yh = {
  delta: 0,
  timestamp: 0
}, uS = ["read", "update", "preRender", "render", "postRender"], sN = function(r) {
  return sp = r;
}, RM = /* @__PURE__ */ uS.reduce(function(r, n) {
  return r[n] = rN(sN), r;
}, {}), oN = /* @__PURE__ */ uS.reduce(function(r, n) {
  var o = RM[n];
  return r[n] = function(l, h, m) {
    return h === void 0 && (h = !1), m === void 0 && (m = !1), sp || uN(), o.schedule(l, h, m), l;
  }, r;
}, {}), lN = function(r) {
  return RM[r].process(Yh);
}, DM = function(r) {
  sp = !1, Yh.delta = Jv ? cT : Math.max(Math.min(r - Yh.timestamp, aN), 1), Jv || (cT = Yh.delta), Yh.timestamp = r, Wb = !0, uS.forEach(lN), Wb = !1, sp && (Jv = !1, AM(DM));
}, uN = function() {
  sp = !0, Jv = !0, Wb || AM(DM);
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
}, kM = function(r, n) {
  return function(o) {
    return Math.max(Math.min(o, n), r);
  };
}, qv = function(r) {
  return r % 1 ? Number(r.toFixed(5)) : r;
}, NM = /^(#[0-9a-f]{3}|#(?:[0-9a-f]{2}){2,4}|(rgb|hsl)a?\((-?[\d\.]+%?[,\s]+){2,3}\s*\/*\s*[\d\.]+%?\))$/i, dg = {
  test: function(r) {
    return typeof r == "number";
  },
  parse: parseFloat,
  transform: function(r) {
    return r;
  }
}, qh = Yr(Yr({}, dg), { transform: kM(0, 1) }), Vv = Yr(Yr({}, dg), { default: 1 }), cS = function(r) {
  return {
    test: function(n) {
      return typeof n == "string" && n.endsWith(r) && n.split(" ").length === 1;
    },
    parse: parseFloat,
    transform: function(n) {
      return "" + n + r;
    }
  };
}, Du = cS("deg"), Kh = cS("%"), ut = cS("px"), dT = Yr(Yr({}, Kh), { parse: function(r) {
  return Kh.parse(r) / 100;
}, transform: function(r) {
  return Kh.transform(r * 100);
} }), cN = function(r) {
  return r.substring(r.indexOf("(") + 1, r.lastIndexOf(")"));
}, dN = kM(0, 255), Fb = function(r) {
  return r.red !== void 0;
}, $b = function(r) {
  return r.hue !== void 0;
};
function fN(r) {
  return cN(r).replace(/(,|\/)/g, " ").split(/ \s*/);
}
var _M = function(r) {
  return function(n) {
    if (typeof n != "string")
      return n;
    for (var o = {}, l = fN(n), h = 0; h < 4; h++)
      o[r[h]] = l[h] !== void 0 ? parseFloat(l[h]) : 1;
    return o;
  };
}, hN = function(r) {
  var n = r.red, o = r.green, l = r.blue, h = r.alpha, m = h === void 0 ? 1 : h;
  return "rgba(" + n + ", " + o + ", " + l + ", " + m + ")";
}, pN = function(r) {
  var n = r.hue, o = r.saturation, l = r.lightness, h = r.alpha, m = h === void 0 ? 1 : h;
  return "hsla(" + n + ", " + o + ", " + l + ", " + m + ")";
}, hb = Yr(Yr({}, dg), { transform: function(r) {
  return Math.round(dN(r));
} });
function dS(r, n) {
  return r.startsWith(n) && NM.test(r);
}
var Kv = {
  test: function(r) {
    return typeof r == "string" ? dS(r, "rgb") : Fb(r);
  },
  parse: _M(["red", "green", "blue", "alpha"]),
  transform: function(r) {
    var n = r.red, o = r.green, l = r.blue, h = r.alpha, m = h === void 0 ? 1 : h;
    return hN({
      red: hb.transform(n),
      green: hb.transform(o),
      blue: hb.transform(l),
      alpha: qv(qh.transform(m))
    });
  }
}, pb = {
  test: function(r) {
    return typeof r == "string" ? dS(r, "hsl") : $b(r);
  },
  parse: _M(["hue", "saturation", "lightness", "alpha"]),
  transform: function(r) {
    var n = r.hue, o = r.saturation, l = r.lightness, h = r.alpha, m = h === void 0 ? 1 : h;
    return pN({
      hue: Math.round(n),
      saturation: Kh.transform(qv(o)),
      lightness: Kh.transform(qv(l)),
      alpha: qv(qh.transform(m))
    });
  }
}, fT = Yr(Yr({}, Kv), { test: function(r) {
  return typeof r == "string" && dS(r, "#");
}, parse: function(r) {
  var n = "", o = "", l = "";
  return r.length > 4 ? (n = r.substr(1, 2), o = r.substr(3, 2), l = r.substr(5, 2)) : (n = r.substr(1, 1), o = r.substr(2, 1), l = r.substr(3, 1), n += n, o += o, l += l), {
    red: parseInt(n, 16),
    green: parseInt(o, 16),
    blue: parseInt(l, 16),
    alpha: 1
  };
} }), vs = {
  test: function(r) {
    return typeof r == "string" && NM.test(r) || Fb(r) || $b(r);
  },
  parse: function(r) {
    return Kv.test(r) ? Kv.parse(r) : pb.test(r) ? pb.parse(r) : fT.test(r) ? fT.parse(r) : r;
  },
  transform: function(r) {
    return Fb(r) ? Kv.transform(r) : $b(r) ? pb.transform(r) : r;
  }
}, fS = function(r) {
  var n = r.onRead, o = r.onRender, l = r.uncachedValues, h = l === void 0 ? /* @__PURE__ */ new Set() : l, m = r.useCache, y = m === void 0 ? !0 : m;
  return function(g) {
    g === void 0 && (g = {});
    var S = lS(g, []), C = {}, I = [], A = !1;
    function z(U, q) {
      U.startsWith("--") && (S.hasCSSVariable = !0);
      var G = C[U];
      C[U] = q, C[U] !== G && (I.indexOf(U) === -1 && I.push(U), A || (A = !0, oN.render($.render)));
    }
    var $ = {
      get: function(U, q) {
        q === void 0 && (q = !1);
        var G = !q && y && !h.has(U) && C[U] !== void 0;
        return G ? C[U] : n(U, S);
      },
      set: function(U, q) {
        if (typeof U == "string")
          z(U, q);
        else
          for (var G in U)
            z(G, U[G]);
        return this;
      },
      render: function(U) {
        return U === void 0 && (U = !1), (A || U === !0) && (o(C, S, I), A = !1, I.length = 0), this;
      }
    };
    return $;
  };
}, mN = /([a-z])([A-Z])/g, vN = "$1-$2", fg = function(r) {
  return r.replace(mN, vN).toLowerCase();
}, PM = /* @__PURE__ */ new Map(), hS = /* @__PURE__ */ new Map(), zM = ["Webkit", "Moz", "O", "ms", ""], gN = zM.length, yN = typeof document < "u", mb, OM = function(r, n) {
  return hS.set(r, fg(n));
}, wN = function(r) {
  mb = mb || document.createElement("div");
  for (var n = 0; n < gN; n++) {
    var o = zM[n], l = o === "", h = l ? r : o + r.charAt(0).toUpperCase() + r.slice(1);
    if (h in mb.style || l) {
      if (l && r === "clipPath" && hS.has(r))
        return;
      PM.set(r, h), OM(r, (l ? "" : "-") + fg(h));
    }
  }
}, bN = function(r) {
  return OM(r, r);
}, LM = function(r, n) {
  n === void 0 && (n = !1);
  var o = n ? hS : PM;
  return o.has(r) || (yN ? wN(r) : bN(r)), o.get(r) || r;
}, SN = ["", "X", "Y", "Z"], xN = ["translate", "scale", "rotate", "skew", "transformPerspective"], Qb = /* @__PURE__ */ xN.reduce(function(r, n) {
  return SN.reduce(function(o, l) {
    return o.push(n + l), o;
  }, r);
}, ["x", "y", "z"]), CN = /* @__PURE__ */ Qb.reduce(function(r, n) {
  return r[n] = !0, r;
}, {});
function pS(r) {
  return CN[r] === !0;
}
function TN(r, n) {
  return Qb.indexOf(r) - Qb.indexOf(n);
}
var MN = /* @__PURE__ */ new Set(["originX", "originY", "originZ"]);
function EN(r) {
  return MN.has(r);
}
var hT = /* @__PURE__ */ ap(/* @__PURE__ */ ap({}, dg), { transform: Math.round }), IN = {
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
  originX: dT,
  originY: dT,
  originZ: ut,
  zIndex: hT,
  fillOpacity: qh,
  strokeOpacity: qh,
  numOctaves: hT
}, mS = function(r) {
  return IN[r];
}, AN = function(r, n) {
  return n && typeof r == "number" ? n.transform(r) : r;
}, ep = "scrollLeft", tp = "scrollTop", BM = /* @__PURE__ */ new Set([ep, tp]), RN = /* @__PURE__ */ new Set([ep, tp, "transform"]), DN = {
  x: "translateX",
  y: "translateY",
  z: "translateZ"
};
function jM(r) {
  return typeof r == "function";
}
function kN(r, n, o, l, h, m) {
  m === void 0 && (m = !0);
  var y = "", g = !1;
  o.sort(TN);
  for (var S = o.length, C = 0; C < S; C++) {
    var I = o[C];
    y += (DN[I] || I) + "(" + n[I] + ") ", g = I === "z" ? !0 : g;
  }
  return !g && h ? y += "translateZ(0)" : y = y.trim(), jM(r.transform) ? y = r.transform(n, l ? "" : y) : m && l && (y = "none"), y;
}
function NN(r, n, o, l, h, m, y, g) {
  n === void 0 && (n = !0), o === void 0 && (o = {}), l === void 0 && (l = {}), h === void 0 && (h = {}), m === void 0 && (m = []), y === void 0 && (y = !1), g === void 0 && (g = !0);
  var S = !0, C = !1, I = !1;
  for (var A in r) {
    var z = r[A], $ = mS(A), U = AN(z, $);
    pS(A) ? (C = !0, l[A] = U, m.push(A), S && ($.default && z !== $.default || !$.default && z !== 0) && (S = !1)) : EN(A) ? (h[A] = U, I = !0) : (!RN.has(A) || !jM(U)) && (o[LM(A, y)] = U);
  }
  return (C || typeof r.transform == "function") && (o.transform = kN(r, l, m, S, n, g)), I && (o.transformOrigin = (h.originX || "50%") + " " + (h.originY || "50%") + " " + (h.originZ || 0)), o;
}
function vS(r) {
  var n = r === void 0 ? {} : r, o = n.enableHardwareAcceleration, l = o === void 0 ? !0 : o, h = n.isDashCase, m = h === void 0 ? !0 : h, y = n.allowTransformNone, g = y === void 0 ? !0 : y, S = {}, C = {}, I = {}, A = [];
  return function(z) {
    return A.length = 0, NN(z, l, S, C, I, A, m, g), S;
  };
}
function _N(r, n) {
  var o = n.element, l = n.preparseOutput, h = mS(r);
  if (pS(r))
    return h && h.default || 0;
  if (BM.has(r))
    return o[r];
  var m = window.getComputedStyle(o, null).getPropertyValue(LM(r, !0)) || 0;
  return l && h && h.test(m) && h.parse ? h.parse(m) : m;
}
function PN(r, n, o) {
  var l = n.element, h = n.buildStyles, m = n.hasCSSVariable;
  if (Object.assign(l.style, h(r)), m)
    for (var y = o.length, g = 0; g < y; g++) {
      var S = o[g];
      S.startsWith("--") && l.style.setProperty(S, r[S]);
    }
  o.indexOf(ep) !== -1 && (l[ep] = r[ep]), o.indexOf(tp) !== -1 && (l[tp] = r[tp]);
}
var zN = /* @__PURE__ */ fS({
  onRead: _N,
  onRender: PN,
  uncachedValues: BM
});
function ON(r, n) {
  n === void 0 && (n = {});
  var o = n.enableHardwareAcceleration, l = n.allowTransformNone, h = lS(n, ["enableHardwareAcceleration", "allowTransformNone"]);
  return zN(ap({ element: r, buildStyles: vS({
    enableHardwareAcceleration: o,
    allowTransformNone: l
  }), preparseOutput: !0 }, h));
}
var VM = /* @__PURE__ */ new Set(["baseFrequency", "diffuseConstant", "kernelMatrix", "kernelUnitLength", "keySplines", "keyTimes", "limitingConeAngle", "markerHeight", "markerWidth", "numOctaves", "targetX", "targetY", "surfaceScale", "specularConstant", "specularExponent", "stdDeviation", "tableValues"]), pT = 0.5, UM = function() {
  return {
    style: {}
  };
}, vb = function(r, n) {
  return ut.transform(r * n);
}, LN = { x: 0, y: 0, width: 0, height: 0 };
function mT(r, n, o) {
  return typeof r == "string" ? r : ut.transform(n + o * r);
}
function BN(r, n, o) {
  return mT(n, r.x, r.width) + " " + mT(o, r.y, r.height);
}
var HM = {
  enableHardwareAcceleration: !1,
  isDashCase: !1
};
function jN(r, n, o, l, h, m) {
  n === void 0 && (n = LN), l === void 0 && (l = vS(HM)), h === void 0 && (h = UM()), m === void 0 && (m = !0);
  var y = r.attrX, g = r.attrY, S = r.originX, C = r.originY, I = r.pathLength, A = r.pathSpacing, z = A === void 0 ? 1 : A, $ = r.pathOffset, U = $ === void 0 ? 0 : $, q = lS(r, ["attrX", "attrY", "originX", "originY", "pathLength", "pathSpacing", "pathOffset"]), G = l(q);
  for (var he in G)
    if (he === "transform")
      h.style.transform = G[he];
    else {
      var se = m && !VM.has(he) ? fg(he) : he;
      h[se] = G[he];
    }
  return (S !== void 0 || C !== void 0 || G.transform) && (h.style.transformOrigin = BN(n, S !== void 0 ? S : pT, C !== void 0 ? C : pT)), y !== void 0 && (h.x = y), g !== void 0 && (h.y = g), o !== void 0 && I !== void 0 && (h[m ? "stroke-dashoffset" : "strokeDashoffset"] = vb(-U, o), h[m ? "stroke-dasharray" : "strokeDasharray"] = vb(I, o) + " " + vb(z, o)), h;
}
function VN(r, n, o) {
  o === void 0 && (o = !0);
  var l = UM(), h = vS(HM);
  return function(m) {
    return jN(m, r, n, h, l, o);
  };
}
var UN = function(r) {
  return typeof r.getBBox == "function" ? r.getBBox() : r.getBoundingClientRect();
}, HN = function(r) {
  try {
    return UN(r);
  } catch {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
}, WN = function(r) {
  return r.tagName === "path";
}, FN = /* @__PURE__ */ fS({
  onRead: function(r, n) {
    var o = n.element;
    if (r = VM.has(r) ? r : fg(r), pS(r)) {
      var l = mS(r);
      return l && l.default || 0;
    } else
      return o.getAttribute(r);
  },
  onRender: function(r, n) {
    var o = n.element, l = n.buildAttrs, h = l(r);
    for (var m in h)
      m === "style" ? Object.assign(o.style, h.style) : o.setAttribute(m, h[m]);
  }
}), $N = function(r) {
  var n = HN(r), o = WN(r) && r.getTotalLength ? r.getTotalLength() : void 0;
  return FN({
    element: r,
    buildAttrs: VN(n, o)
  });
}, QN = /* @__PURE__ */ fS({
  useCache: !1,
  onRead: function(r) {
    return r === "scrollTop" ? window.pageYOffset : window.pageXOffset;
  },
  onRender: function(r) {
    var n = r.scrollTop, o = n === void 0 ? 0 : n, l = r.scrollLeft, h = l === void 0 ? 0 : l;
    return window.scrollTo(h, o);
  }
}), Zb = /* @__PURE__ */ new WeakMap(), ZN = function(r) {
  return r instanceof HTMLElement || typeof r.click == "function";
}, YN = function(r) {
  return r instanceof SVGElement || "ownerSVGElement" in r;
}, GN = function(r, n) {
  var o;
  return r === window ? o = QN(r) : ZN(r) ? o = ON(r, n) : YN(r) && (o = $N(r)), Zb.set(r, o), o;
}, XN = function(r, n) {
  return Zb.has(r) ? Zb.get(r) : GN(r, n);
};
function JN(r, n) {
  var o = typeof r == "string" ? document.querySelector(r) : r;
  return XN(o, n);
}
var ys = function(n, o, l, h) {
  var m = l ? l.call(h, n, o) : void 0;
  if (m !== void 0)
    return !!m;
  if (n === o)
    return !0;
  if (typeof n != "object" || !n || typeof o != "object" || !o)
    return !1;
  var y = Object.keys(n), g = Object.keys(o);
  if (y.length !== g.length)
    return !1;
  for (var S = Object.prototype.hasOwnProperty.bind(o), C = 0; C < y.length; C++) {
    var I = y[C];
    if (!S(I))
      return !1;
    var A = n[I], z = o[I];
    if (m = l ? l.call(h, A, z, I) : void 0, m === !1 || m === void 0 && A !== z)
      return !1;
  }
  return !0;
};
const WM = "!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", qN = WM.length, vT = Array(20), Td = () => {
  for (let r = 0; r < 20; r++)
    vT[r] = WM.charAt(Math.random() * qN);
  return vT.join("");
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
var KN = Object.defineProperty, gb = (typeof require < "u" && require, (r, n, o) => (((l, h, m) => {
  h in l ? KN(l, h, { enumerable: !0, configurable: !0, writable: !0, value: m }) : l[h] = m;
})(r, typeof n != "symbol" ? n + "" : n, o), o));
class cp {
  constructor(n, o) {
    gb(this, "_value"), gb(this, "_beforeDestroys"), gb(this, "_subscribers"), this._value = n, o && (this.compare = o);
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
    const h = new cp(n(this.value, void 0, l), o), m = this.reaction((y, g, S) => {
      h.setValue(n(y, g, S));
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
function e_(r, n, o, l) {
  let h = r.map((y) => y.value);
  const m = new cp(n(h, void 0, l), o);
  return r.forEach((y, g) => {
    const S = y.reaction((C, I, A) => {
      const z = h.slice();
      z[g] = C;
      const $ = h;
      h = z, m.setValue(n(z, $, A), A);
    });
    m.addBeforeDestroy(S);
  }), m;
}
function FM(r, n) {
  Object.keys(n).forEach((o) => {
    t_(r, o, n[o]);
  });
}
function t_(r, n, o) {
  var l;
  return Object.defineProperties(r, { [n]: { get: () => o.value }, [`_${n}$`]: { value: o }, [`set${l = n, l[0].toUpperCase() + l.slice(1)}`]: { value: (h, m) => o.setValue(h, m) } }), r;
}
function gS(r) {
  const n = (o) => {
    const l = r.addDisposer(() => {
      o.destroy();
    });
    return o.addBeforeDestroy(() => {
      r.remove(l);
    }), o;
  };
  return { bindSideEffect: n, combine: (o, l, h, m) => n(e_(o, l, h, m)), createVal: (o, l) => n(new cp(o, l)) };
}
var yS = /* @__PURE__ */ ((r) => (r.Light = "light", r.Dark = "dark", r.Auto = "auto", r))(yS || {}), nn = /* @__PURE__ */ ((r) => (r.Normal = "normal", r.Minimized = "minimized", r.Maximized = "maximized", r))(nn || {}), Xn = /* @__PURE__ */ ((r) => (r.DarkMode = "dark_mode", r.PrefersColorScheme = "prefers_color_scheme", r.Close = "close", r.Focus = "focus", r.Blur = "blur", r.Move = "move", r.Resize = "resize", r.IntrinsicMove = "intrinsic_move", r.IntrinsicResize = "intrinsic_resize", r.VisualResize = "visual_resize", r.ZIndex = "z_index", r.State = "state", r.Minimized = "minimized", r.Maximized = "maximized", r.Readonly = "readonly", r.Destroyed = "destroyed", r))(Xn || {}), Ki = /* @__PURE__ */ ((r) => (r.Close = "close", r.Maximize = "maximize", r.Minimize = "minimize", r))(Ki || {}), ws = /* @__PURE__ */ ((r) => (r.North = "n", r.South = "s", r.West = "w", r.East = "e", r.NorthWest = "nw", r.NorthEast = "ne", r.SouthEast = "se", r.SouthWest = "sw", r))(ws || {});
const yb = "dh";
function Xi(r, n, o) {
  return Math.min(Math.max(r, n), o);
}
function Ed(r) {
  r.stopPropagation(), r.cancelable && r.preventDefault();
}
let n_ = 1;
function i_() {
  return `New Box ${n_++}`;
}
function r_(r) {
  return Boolean(r);
}
function Uv(r) {
  return !r;
}
function gT(r) {
  return r.reduce((n, o) => (n.includes(o) || n.push(o), n), []);
}
function Hh(r, n) {
  const o = r.indexOf(n);
  if (o < 0)
    return r;
  const l = [...r];
  return l.splice(o, 1), l;
}
function a_(r, n, o) {
  const l = new Set(n), h = new Set(o);
  return r.filter((m) => !l.has(m) && !h.has(m));
}
function yT(r) {
  return r.touches ? r.touches[0] : r;
}
function s_() {
  return Date.now().toString().slice(6) + Math.random().toString().slice(2, 8);
}
class $M {
  constructor({
    readonly: n = !1,
    title: o,
    buttons: l,
    onEvent: h,
    onDragStart: m,
    namespace: y = "telebox",
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
    }, this.readonly = n, this.onEvent = h, this.onDragStart = m, this.namespace = y, this.title = o, this.state = g, this.buttons = l || [
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
      n.className = this.wrapClassName("title-area"), n.dataset.teleBoxHandle = yb, this.$title = document.createElement("h1"), this.$title.className = this.wrapClassName("title"), this.$title.dataset.teleBoxHandle = yb, this.title && (this.$title.textContent = this.title, this.$title.title = this.title), n.appendChild(this.$title), n.appendChild(this.$dragArea);
      const o = document.createElement("div");
      o.className = this.wrapClassName("titlebar-btns"), this.buttons.forEach(({ iconClassName: l, isActive: h }, m) => {
        const y = String(m), g = document.createElement("button");
        g.className = `${this.wrapClassName(
          "titlebar-btn"
        )} ${l}`, g.dataset.teleTitleBarBtnIndex = y, g.dataset.teleTitleBarNoDblClick = "true", h && g.classList.toggle("is-active", h(this.state)), this.$btns.push(g), o.appendChild(g);
      }), this.sideEffect.addEventListener(
        o,
        "click",
        (l) => {
          var h;
          if (this.readonly)
            return;
          const m = l.target, y = Number(
            (h = m.dataset) == null ? void 0 : h.teleTitleBarBtnIndex
          );
          if (!Number.isNaN(y) && y < this.buttons.length) {
            Ed(l);
            const g = this.buttons[y];
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
    return n.className = this.wrapClassName("drag-area"), n.dataset.teleBoxHandle = yb, this.sideEffect.addEventListener(
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
class o_ {
  constructor({
    id: n = s_(),
    title: o = i_(),
    prefersColorScheme: l = yS.Light,
    darkMode: h,
    visible: m = !0,
    width: y = 0.5,
    height: g = 0.5,
    minWidth: S = 0,
    minHeight: C = 0,
    x: I = 0.1,
    y: A = 0.1,
    minimized: z = !1,
    maximized: $ = !1,
    readonly: U = !1,
    resizable: q = !0,
    draggable: G = !0,
    fence: he = !0,
    fixRatio: se = !1,
    focus: Z = !1,
    zIndex: ue = 100,
    namespace: oe = "telebox",
    titleBar: ke,
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
    this._renderSideEffect = new op(), this.handleTrackStart = (Ne) => {
      var st;
      return (st = this._handleTrackStart) == null ? void 0 : st.call(this, Ne);
    }, this._sideEffect = new op(), this._valSideEffectBinder = gS(this._sideEffect);
    const { combine: Oe, createVal: ce } = this._valSideEffectBinder;
    this.addObserver = ct || wb, this.id = n, this.namespace = oe, this.events = new rg(), this._delegateEvents = new rg(), this.scale = ce(1), this.fixed = ie;
    const Ze = ce(l);
    Ze.reaction((Ne, st, He) => {
      He || this.events.emit(Xn.PrefersColorScheme, Ne);
    });
    const Se = ce(Boolean(h));
    h == null && Ze.subscribe((Ne, st, He) => {
      this._sideEffect.add(() => {
        if (Ne === "auto") {
          const jt = window.matchMedia("(prefers-color-scheme: dark)");
          if (jt) {
            Se.setValue(jt.matches, He);
            const Sn = (ci) => {
              Se.setValue(ci.matches, He);
            };
            return jt.addListener(Sn), () => jt.removeListener(Sn);
          } else
            return wb;
        } else
          return Se.setValue(Ne === "dark", He), wb;
      }, "prefers-color-scheme");
    }), Se.reaction((Ne, st, He) => {
      He || this.events.emit(Xn.DarkMode, Ne);
    });
    const Ue = ce(fe, ys), Re = ce(be, ys), Qe = ce(o);
    Qe.reaction((Ne, st, He) => {
      He || this.titleBar.setTitle(Ne);
    });
    const Tt = ce(m);
    Tt.reaction((Ne, st, He) => {
      !He && !Ne && this.events.emit(Xn.Close);
    });
    const Bt = ce(U);
    Bt.reaction((Ne, st, He) => {
      He || this.events.emit(Xn.Readonly, Ne);
    });
    const Ge = ce(q), re = ce(G), D = ce(he), B = ce(se), ee = ce(ue);
    ee.reaction((Ne, st, He) => {
      He || this.events.emit(Xn.ZIndex, Ne);
    });
    const Ce = ce(Z);
    Ce.reaction((Ne, st, He) => {
      He || this.events.emit(Ne ? Xn.Focus : Xn.Blur);
    });
    const ge = ce(z);
    ge.reaction((Ne, st, He) => {
      He || this.events.emit(Xn.Minimized, Ne);
    });
    const it = ce($);
    it.reaction((Ne, st, He) => {
      He || this.events.emit(Xn.Maximized, Ne);
    });
    const Xe = Oe(
      [ge, it],
      ([Ne, st]) => Ne ? nn.Minimized : st ? nn.Maximized : nn.Normal
    );
    Xe.reaction((Ne, st, He) => {
      He || this.events.emit(Xn.State, Ne);
    });
    const Be = ce(
      {
        width: Xi(S, 0, 1),
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
    Be.reaction((Ne, st, He) => {
      dt.setValue(
        {
          width: Xi(y, Ne.width, 1),
          height: Xi(g, Ne.height, 1)
        },
        He
      );
    }), dt.reaction((Ne, st, He) => {
      He || this.events.emit(Xn.IntrinsicResize, Ne);
    });
    const gt = Oe(
      [dt, it],
      ([Ne, st]) => st ? { width: 1, height: 1 } : Ne,
      ys
    );
    gt.reaction((Ne, st, He) => {
      He || this.events.emit(Xn.Resize, Ne);
    });
    const Zt = Oe(
      [gt, ge, Ue, Re],
      ([Ne, st, He, jt]) => st && jt ? {
        width: jt.width / Ne.width / He.width,
        height: jt.height / Ne.height / He.height
      } : Ne,
      ys
    );
    Zt.reaction((Ne, st, He) => {
      He || this.events.emit(Xn.VisualResize, Ne);
    });
    const Mt = ce({ x: Xi(I, 0, 1), y: Xi(A, 0, 1) }, ys);
    Mt.reaction((Ne, st, He) => {
      He || this.events.emit(Xn.IntrinsicMove, Ne);
    });
    const bn = Oe(
      [
        Mt,
        dt,
        Ue,
        Re,
        ge,
        it
      ],
      ([
        Ne,
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
      } : ci ? { x: 0, y: 0 } : Ne,
      ys
    );
    bn.reaction((Ne, st, He) => {
      He || this.events.emit(Xn.Move, Ne);
    }), this.titleBar = ke || new $M({
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
    const Ft = ce(Fe), Vi = ce(Pe), Ci = ce(Y);
    FM(this, {
      prefersColorScheme: Ze,
      darkMode: Se,
      containerRect: Ue,
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
      const y = this.intrinsicHeight / this.intrinsicWidth * l;
      o !== this.intrinsicY && (o -= y - h), h = y;
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
    const o = (A, z, $, U = r_) => this._renderSideEffect.add(() => {
      const q = this.wrapClassName($);
      return z.subscribe((G) => {
        A.classList.toggle(q, U(G));
      });
    });
    o(this.$box, this._readonly$, "readonly"), o(this.$box, this._draggable$, "no-drag", Uv), o(this.$box, this._resizable$, "no-resize", Uv), o(this.$box, this._focus$, "blur", Uv), o(this.$box, this._darkMode$, "color-scheme-dark"), o(this.$box, this._darkMode$, "color-scheme-light", Uv), this._renderSideEffect.add(() => {
      const A = this.wrapClassName("minimized"), z = this.wrapClassName("maximized"), $ = "box-maximized-timer";
      return this._state$.subscribe((U) => {
        this.$box.classList.toggle(A, U === nn.Minimized), U === nn.Maximized ? (this._renderSideEffect.flush($), this.$box.classList.toggle(z, !0)) : this._renderSideEffect.setTimeout(
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
    const l = JN(this.$box);
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
      ([A, z, $, U, q]) => {
        const G = z.width * U.width, he = z.height * U.height;
        return {
          width: G + ($ && q ? 1 : 0),
          height: he + ($ && q ? 1 : 0),
          x: A.x * U.width,
          y: A.y * U.height,
          scaleX: 1,
          scaleY: 1
        };
      },
      ys
    ).subscribe((A) => {
      l.set(A);
    }), l.set({ x: h, y: m });
    const y = document.createElement("div");
    y.className = this.wrapClassName("box-main"), this.$box.appendChild(y);
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
    }), y.appendChild(g), y.appendChild(S), y.appendChild(I), this.$contentWrap = S, this.addObserver(S, (A) => {
      const z = A.find(($) => $.target == S);
      (z == null ? void 0 : z.target) == S && (C.style.width = z.contentRect.width * this.scale.value + "px", C.style.height = z.contentRect.height * this.scale.value + "px");
    }), this.scale.reaction((A) => {
      C.style.width = S.getBoundingClientRect().width * A + "px", C.style.height = S.getBoundingClientRect().height * A + "px";
    }), this._renderResizeHandlers(), this.$box;
  }
  _renderResizeHandlers() {
    const n = document.createElement("div");
    n.className = this.wrapClassName("resize-handles"), Object.values(ws).forEach((q) => {
      const G = document.createElement("div");
      G.className = this.wrapClassName(q) + " " + this.wrapClassName("resize-handle"), G.dataset.teleBoxHandle = q, n.appendChild(G);
    }), this.$box.appendChild(n);
    const o = "handle-tracking-listener", l = this.wrapClassName("transforming");
    let h, m = 0, y = 0, g = 0, S = 0, C = 0, I = 0, A;
    const z = (q) => {
      if (this.state !== nn.Normal)
        return;
      Ed(q);
      let { pageX: G, pageY: he } = yT(q);
      he < 0 && (he = 0);
      const se = (G - C) / this.containerRect.width, Z = (he - I) / this.containerRect.height;
      switch (A) {
        case ws.North: {
          this.transform(
            this.x,
            y + Z,
            this.width,
            S - Z
          );
          break;
        }
        case ws.South: {
          this.transform(this.x, this.y, this.width, S + Z);
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
            S - Z
          );
          break;
        }
        case ws.NorthEast: {
          this.transform(
            this.x,
            y + Z,
            g + se,
            S - Z
          );
          break;
        }
        case ws.SouthEast: {
          this.transform(
            this.x,
            this.y,
            g + se,
            S + Z
          );
          break;
        }
        case ws.SouthWest: {
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
      A = void 0, h && (Ed(q), this.$box.classList.toggle(l, !1), this._sideEffect.flush(o), h.remove());
    }, U = (q) => {
      var G;
      if (this.readonly || q.button != null && q.button !== 0 || !this.draggable || A || this.state !== nn.Normal)
        return;
      const he = q.target;
      if ((G = he.dataset) != null && G.teleBoxHandle) {
        Ed(q), m = this.x, y = this.y, g = this.width, S = this.height, { pageX: C, pageY: I } = yT(q), A = he.dataset.teleBoxHandle, h || (h = document.createElement("div"));
        const se = A ? this.wrapClassName(`cursor-${A}`) : "";
        h.className = this.wrapClassName(`track-mask${se ? ` ${se}` : ""}`), this.$box.appendChild(h), this.$box.classList.add(l), this._sideEffect.add(() => (window.addEventListener("mousemove", z), window.addEventListener("touchmove", z, {
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
    this._handleTrackStart = U, this._sideEffect.addEventListener(
      n,
      "mousedown",
      U,
      {},
      "box-resizeHandles-mousedown"
    ), this._sideEffect.addEventListener(
      n,
      "touchstart",
      U,
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
function wb() {
}
var l_ = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzFfNDQyNDQpIj4KPGcgZmlsdGVyPSJ1cmwoI2ZpbHRlcjBfZF8xXzQ0MjQ0KSI+CjxwYXRoIGQ9Ik0xNC4wMDAyIDE2LjE5NTNDMTMuODI0NyAxNi4xOTUzIDEzLjY1MjIgMTYuMTQ5MSAxMy41MDAyIDE2LjA2MTVMNC41MDAxNyAxMC44NjQzQzQuMDIxNzggMTAuNTg3OSAzLjg1Nzk2IDkuOTc2MTIgNC4xMzQyOCA5LjQ5NzczQzQuMjIyMDQgOS4zNDU3OSA0LjM0ODIzIDkuMjE5NiA0LjUwMDE3IDkuMTMxODRMMTMuNTAwMiAzLjkzODQ4QzEzLjgwOTggMy43NjA3NCAxNC4xOTA1IDMuNzYwNzQgMTQuNTAwMiAzLjkzODQ4TDIzLjUwMDIgOS4xMzE4NEMyMy45Nzg2IDkuNDA4MTYgMjQuMTQyNCAxMC4wMiAyMy44NjYxIDEwLjQ5ODRDMjMuNzc4MyAxMC42NTAzIDIzLjY1MjEgMTAuNzc2NSAyMy41MDAyIDEwLjg2NDNMMTQuNTAwMiAxNi4wNjE1QzE0LjM0ODEgMTYuMTQ5MSAxNC4xNzU3IDE2LjE5NTMgMTQuMDAwMiAxNi4xOTUzWiIgZmlsbD0id2hpdGUiLz4KPC9nPgo8ZyBmaWx0ZXI9InVybCgjZmlsdGVyMV9kXzFfNDQyNDQpIj4KPHBhdGggZD0iTTIzLjUwMDIgMTMuMTMxOUwyMS41MzYxIDExLjk5ODVMMTQuNTAwMiAxNi4wNjE2QzE0LjE5MDcgMTYuMjQgMTMuODA5NiAxNi4yNCAxMy41MDAyIDE2LjA2MTZMNi40NjQyOCAxMS45OTg1TDQuNTAwMTcgMTMuMTMxOUM0LjAyMTc4IDEzLjQwODIgMy44NTc5NiAxNC4wMiA0LjEzNDI4IDE0LjQ5ODRDNC4yMjIwNCAxNC42NTA0IDQuMzQ4MjMgMTQuNzc2NiA0LjUwMDE3IDE0Ljg2NDNMMTMuNTAwMiAyMC4wNjE2QzEzLjgwOTYgMjAuMjQgMTQuMTkwNyAyMC4yNCAxNC41MDAyIDIwLjA2MTZMMjMuNTAwMiAxNC44NjQzQzIzLjk3ODYgMTQuNTg4IDI0LjE0MjQgMTMuOTc2MiAyMy44NjYxIDEzLjQ5NzhDMjMuNzc4MyAxMy4zNDU5IDIzLjY1MjEgMTMuMjE5NyAyMy41MDAyIDEzLjEzMTlaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjgiIHNoYXBlLXJlbmRlcmluZz0iY3Jpc3BFZGdlcyIvPgo8L2c+CjxnIGZpbHRlcj0idXJsKCNmaWx0ZXIyX2RfMV80NDI0NCkiPgo8cGF0aCBkPSJNMjMuNTAwMiAxNy4xMzE5TDIxLjUzNjEgMTUuOTk4NUwxNC41MDAyIDIwLjA2MTZDMTQuMTkwNyAyMC4yNCAxMy44MDk2IDIwLjI0IDEzLjUwMDIgMjAuMDYxNkw2LjQ2NDI4IDE1Ljk5ODVMNC41MDAxNyAxNy4xMzE5QzQuMDIxNzggMTcuNDA4MiAzLjg1Nzk2IDE4LjAyIDQuMTM0MjggMTguNDk4NEM0LjIyMjA0IDE4LjY1MDQgNC4zNDgyMyAxOC43NzY2IDQuNTAwMTcgMTguODY0M0wxMy41MDAyIDI0LjA2MTZDMTMuODA5NiAyNC4yNCAxNC4xOTA3IDI0LjI0IDE0LjUwMDIgMjQuMDYxNkwyMy41MDAyIDE4Ljg2NDNDMjMuOTc4NiAxOC41ODggMjQuMTQyNCAxNy45NzYyIDIzLjg2NjEgMTcuNDk3OEMyMy43NzgzIDE3LjM0NTkgMjMuNjUyMSAxNy4yMTk3IDIzLjUwMDIgMTcuMTMxOVoiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuNiIgc2hhcGUtcmVuZGVyaW5nPSJjcmlzcEVkZ2VzIi8+CjwvZz4KPC9nPgo8ZGVmcz4KPGZpbHRlciBpZD0iZmlsdGVyMF9kXzFfNDQyNDQiIHg9IjMiIHk9IjMuODA1MTgiIHdpZHRoPSIyMiIgaGVpZ2h0PSIxNC4zOTAxIiBmaWx0ZXJVbml0cz0idXNlclNwYWNlT25Vc2UiIGNvbG9yLWludGVycG9sYXRpb24tZmlsdGVycz0ic1JHQiI+CjxmZUZsb29kIGZsb29kLW9wYWNpdHk9IjAiIHJlc3VsdD0iQmFja2dyb3VuZEltYWdlRml4Ii8+CjxmZUNvbG9yTWF0cml4IGluPSJTb3VyY2VBbHBoYSIgdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDEyNyAwIiByZXN1bHQ9ImhhcmRBbHBoYSIvPgo8ZmVPZmZzZXQgZHk9IjEiLz4KPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMC41Ii8+CjxmZUNvbXBvc2l0ZSBpbjI9ImhhcmRBbHBoYSIgb3BlcmF0b3I9Im91dCIvPgo8ZmVDb2xvck1hdHJpeCB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMCAwIDAgMCAwLjU1Mjk0MSAwIDAgMCAwIDAuNTYwNzg0IDAgMCAwIDAgMC42NTA5OCAwIDAgMCAwLjE1IDAiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbjI9IkJhY2tncm91bmRJbWFnZUZpeCIgcmVzdWx0PSJlZmZlY3QxX2Ryb3BTaGFkb3dfMV80NDI0NCIvPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluPSJTb3VyY2VHcmFwaGljIiBpbjI9ImVmZmVjdDFfZHJvcFNoYWRvd18xXzQ0MjQ0IiByZXN1bHQ9InNoYXBlIi8+CjwvZmlsdGVyPgo8ZmlsdGVyIGlkPSJmaWx0ZXIxX2RfMV80NDI0NCIgeD0iMyIgeT0iMTEuOTk4NSIgd2lkdGg9IjIyIiBoZWlnaHQ9IjEwLjE5NjgiIGZpbHRlclVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj4KPGZlRmxvb2QgZmxvb2Qtb3BhY2l0eT0iMCIgcmVzdWx0PSJCYWNrZ3JvdW5kSW1hZ2VGaXgiLz4KPGZlQ29sb3JNYXRyaXggaW49IlNvdXJjZUFscGhhIiB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMTI3IDAiIHJlc3VsdD0iaGFyZEFscGhhIi8+CjxmZU9mZnNldCBkeT0iMSIvPgo8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIwLjUiLz4KPGZlQ29tcG9zaXRlIGluMj0iaGFyZEFscGhhIiBvcGVyYXRvcj0ib3V0Ii8+CjxmZUNvbG9yTWF0cml4IHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAuNTUyOTQxIDAgMCAwIDAgMC41NjA3ODQgMCAwIDAgMCAwLjY1MDk4IDAgMCAwIDAuMTUgMCIvPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluMj0iQmFja2dyb3VuZEltYWdlRml4IiByZXN1bHQ9ImVmZmVjdDFfZHJvcFNoYWRvd18xXzQ0MjQ0Ii8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0iZWZmZWN0MV9kcm9wU2hhZG93XzFfNDQyNDQiIHJlc3VsdD0ic2hhcGUiLz4KPC9maWx0ZXI+CjxmaWx0ZXIgaWQ9ImZpbHRlcjJfZF8xXzQ0MjQ0IiB4PSIzIiB5PSIxNS45OTg1IiB3aWR0aD0iMjIiIGhlaWdodD0iMTAuMTk2OCIgZmlsdGVyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiPgo8ZmVGbG9vZCBmbG9vZC1vcGFjaXR5PSIwIiByZXN1bHQ9IkJhY2tncm91bmRJbWFnZUZpeCIvPgo8ZmVDb2xvck1hdHJpeCBpbj0iU291cmNlQWxwaGEiIHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAxMjcgMCIgcmVzdWx0PSJoYXJkQWxwaGEiLz4KPGZlT2Zmc2V0IGR5PSIxIi8+CjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjAuNSIvPgo8ZmVDb21wb3NpdGUgaW4yPSJoYXJkQWxwaGEiIG9wZXJhdG9yPSJvdXQiLz4KPGZlQ29sb3JNYXRyaXggdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAgMCAwIDAgMC41NTI5NDEgMCAwIDAgMCAwLjU2MDc4NCAwIDAgMCAwIDAuNjUwOTggMCAwIDAgMC4xNSAwIi8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW4yPSJCYWNrZ3JvdW5kSW1hZ2VGaXgiIHJlc3VsdD0iZWZmZWN0MV9kcm9wU2hhZG93XzFfNDQyNDQiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJlZmZlY3QxX2Ryb3BTaGFkb3dfMV80NDI0NCIgcmVzdWx0PSJzaGFwZSIvPgo8L2ZpbHRlcj4KPGNsaXBQYXRoIGlkPSJjbGlwMF8xXzQ0MjQ0Ij4KPHJlY3Qgd2lkdGg9IjI4IiBoZWlnaHQ9IjI4IiBmaWxsPSJ3aGl0ZSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo=";
let Wh, Fh;
function u_(r, n = !1) {
  Wh ? n ? Fh == null || Fh.push(r) : Wh.push(r) : (Wh = n ? [] : [r], Fh = n ? [r] : [], Promise.resolve().then(() => {
    const o = Wh, l = Fh;
    Wh = void 0, Fh = void 0, l == null || l.forEach((h) => h()), o == null || o.forEach((h) => h());
  }));
}
function c_(r) {
  const n = r.cloneNode(!0);
  n.style.position = "absolute", n.style.top = "-99999px", n.style.float = "none", n.style.visibility = "hidden", n.style.display = "block", document.body.appendChild(n);
  const o = n.getBoundingClientRect();
  return document.body.removeChild(n), { height: o.height, width: o.width };
}
class QM {
  constructor({
    visible: n = !0,
    readonly: o = !1,
    darkMode: l = !1,
    namespace: h = "telebox",
    styles: m = {},
    onClick: y,
    minimizedBoxes: g = [],
    boxes: S = [],
    externalEvents: C
  } = {}) {
    this.handleCollectorClick = () => {
      !this._readonly && this.onClick && this.popupVisible$.setValue(!this.popupVisible$.value);
    }, this.externalEvents = C, this._sideEffect = new op();
    const { createVal: I } = gS(this._sideEffect);
    this._visible = n, this._readonly = o, this._darkMode = l, this.namespace = h, this.styles = m, this.minimizedBoxes = g, this.boxes = S, this.onClick = y, this.popupVisible$ = I(!1), this.popupVisible$.reaction((z) => {
      var $;
      ($ = this.$titles) == null || $.classList.toggle(
        this.wrapClassName("collector-hide"),
        !z
      ), requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          var U;
          (U = this.$titles) == null || U.classList.toggle(
            this.wrapClassName(
              "collector-titles-visible"
            ),
            z
          );
        });
      });
    });
    const A = (z) => {
      var $, U;
      !this.popupVisible$ || (U = ($ = z.target.className) == null ? void 0 : $.includes) != null && U.call($, "collector") || this.popupVisible$.setValue(!1);
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
    return this._readonly !== n && (this._readonly = n, this.$collector && this.$collector.classList.toggle(this.wrapClassName("collector-readonly"), n)), this;
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
    return this.$collector || (this.$collector = document.createElement("button"), this.$collector.className = this.wrapClassName("collector"), this.$collector.style.backgroundImage = `url('${l_}')`, this.wrp$ = document.createElement("div"), this.count$ = document.createElement("div"), this.wrp$.className = this.wrapClassName("collector-wrp"), this.count$.className = this.wrapClassName("collector-count"), this.wrp$.appendChild(this.count$), this.wrp$.appendChild(this.$collector), this.$collector.addEventListener("click", this.handleCollectorClick), this._visible && (this.$collector.classList.add(this.wrapClassName("collector-visible")), this.wrp$.classList.toggle(this.wrapClassName("collector-visible")), this.renderTitles()), this._readonly && this.$collector.classList.add(this.wrapClassName("collector-readonly")), this.$collector.classList.add(
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
    ), y = m != null ? m : document.createElement("div");
    y.className = this.wrapClassName("collector-titles-content"), m || (this.$titles.appendChild(y), this._sideEffect.addEventListener(
      y,
      "click",
      (C) => {
        var I, A, z, $;
        const U = C.target;
        (A = (I = U.dataset) == null ? void 0 : I.teleBoxID) != null && A.length && (($ = this.onClick) == null || $.call(this, (z = U.dataset) == null ? void 0 : z.teleBoxID));
      },
      {},
      "telebox-collector-titles-content-click"
    )), y.innerHTML = "";
    const g = (n = this.boxes) == null ? void 0 : n.filter((C) => {
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
    const S = (o = this.wrp$) == null ? void 0 : o.querySelector(
      `.${this.wrapClassName("collector-titles")}`
    );
    return S ? (h = this.wrp$) == null || h.replaceChild(this.$titles, S) : (l = this.wrp$) == null || l.appendChild(this.$titles), u_(() => {
      var C, I;
      if (!this.$titles || !this.wrp$ || !this.root)
        return;
      const A = (C = this.wrp$) == null ? void 0 : C.getBoundingClientRect(), z = (I = this.root) == null ? void 0 : I.getBoundingClientRect(), $ = c_(this.$titles);
      A.top - z.top > $.height;
      const U = A.x - z.x > $.width / 2 - A.width / 2, q = -$.height - 10;
      let G = -($.width / 2 - A.width / 2);
      U || (G = -(A.x - z.x - 4)), this.$titles.style.top = `${q}px`, this.$titles.style.left = `${G}px`;
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
class d_ extends $M {
  constructor(n) {
    super(n), this.boxes = n.boxes, this.focusedBox = n.focusedBox, this.containerRect = n.containerRect, this.darkMode = n.darkMode, this.maximizedBoxes$ = n.maximizedBoxes$, this.minimizedBoxes$ = n.minimizedBoxes$;
  }
  focusBox(n) {
    var o;
    if (!(this.focusedBox && this.focusedBox === n)) {
      if (this.$titles && this.state === nn.Maximized) {
        const { children: l } = this.$titles.firstElementChild;
        for (let h = l.length - 1; h >= 0; h -= 1) {
          const m = l[h], y = (o = m.dataset) == null ? void 0 : o.teleBoxID;
          y && (n && y === n.id ? m.classList.toggle(this.wrapClassName("titles-tab-focus"), !0) : this.focusedBox && y === this.focusedBox.id && m.classList.toggle(this.wrapClassName("titles-tab-focus"), !1));
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
function f_() {
  let r = /* @__PURE__ */ new Set();
  function n(y) {
    return r.add(y), () => {
      o(y);
    };
  }
  function o(y) {
    r.delete(y);
  }
  function l(...y) {
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
    runCallbacks: l,
    addCallback: n,
    removeCallback: o,
    hasCallbacks: h,
    removeAll: m
  };
}
class h_ {
  constructor({
    root: n = document.body,
    prefersColorScheme: o = yS.Light,
    fence: l = !0,
    containerRect: h = {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight
    },
    collector: m,
    namespace: y = "telebox",
    readonly: g = !1,
    minimizedBoxes: S = [],
    maximizedBoxes: C = []
  } = {}) {
    this.externalEvents = new rg(), this.events = new rg(), this._sideEffect = new op();
    const { combine: I, createVal: A } = gS(this._sideEffect);
    this.callbackManager = f_(), this.sizeObserver = new ResizeObserver(this.callbackManager.runCallbacks), this.elementObserverMap = /* @__PURE__ */ new Map(), this.root = n, this.namespace = y, this.boxes$ = A([]), this.topBox$ = this.boxes$.derive((Y) => {
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
    const U = A(o);
    U.reaction((Y, fe, be) => {
      this.boxes.forEach((ie) => ie.setPrefersColorScheme(Y, be)), be || this.events.emit(mn.PrefersColorScheme, Y);
    }), this._darkMode$ = I(
      [$, U],
      ([Y, fe]) => fe === "auto" ? Y : fe === "dark"
    ), this._darkMode$.reaction((Y, fe, be) => {
      this.boxes.forEach((ie) => ie.setDarkMode(Y, be)), be || this.events.emit(mn.DarkMode, Y);
    });
    const q = A(g);
    q.reaction((Y, fe, be) => {
      this.boxes.forEach((ie) => ie.setReadonly(Y, be));
    }), this.maximizedBoxes$ = A(C), this.minimizedBoxes$ = A(S), this.maximizedBoxes$.reaction((Y, fe, be) => {
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
    const he = A(l);
    he.subscribe((Y, fe, be) => {
      this.boxes.forEach((ie) => ie.setFence(Y, be));
    });
    const se = A(h, ys);
    se.reaction((Y, fe, be) => {
      this.boxes.forEach((ie) => ie.setContainerRect(Y, be)), this.maxTitleBar.setContainerRect(Y);
    });
    const Z = A(
      m === null ? null : m || new QM({
        visible: this.minimizedBoxes$.value.length > 0,
        readonly: q.value,
        namespace: y,
        minimizedBoxes: this.minimizedBoxes$.value,
        boxes: this.boxes$.value,
        externalEvents: this.externalEvents
      }).mount(n)
    );
    Z.subscribe((Y) => {
      Y && (Y.setVisible(this.minimizedBoxes$.value.length > 0), Y.setReadonly(q.value), Y.setDarkMode(this._darkMode$.value), this._sideEffect.add(() => (Y.onClick = (fe) => {
        var be;
        q.value || (this.setMinimizedBoxes(
          Hh(
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
      const Ze = Y.length > 0;
      (ie = Z.value) == null || ie.setVisible(Ze), (ct = this.collector) == null || ct.setMinimizedBoxes(Y), Ze && (Oe = Z.value) != null && Oe.$collector && oe.setValue(ue()), be || this.events.emit(mn.Minimized, Y);
    });
    const ke = this.wrapClassName("titlebar-icon-close"), Fe = (Y) => {
      var fe;
      if (q.value)
        return;
      const be = Y.target;
      if (!!be.tagName)
        for (let ie = be; ie; ie = ie.parentElement) {
          if (ie.classList && ie.classList.contains(ke))
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
    this._sideEffect.addEventListener(window, "mousedown", Fe, !0), this._sideEffect.addEventListener(window, "touchstart", Fe, !0), this.maxTitleBar = new d_({
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
              const Ze = (be = this.maxTitleBar.focusedBox) == null ? void 0 : be.id, Ue = this.maximizedBoxes$.value.includes(
                Ze
              ) ? Hh(
                [...this.maximizedBoxes$.value],
                Ze
              ) : gT([
                ...this.maximizedBoxes$.value,
                (ie = this.maxTitleBar.focusedBox) == null ? void 0 : ie.id
              ]);
              this.setMaximizedBoxes(Ue);
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
              const Ze = gT([
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
      prefersColorScheme: U,
      containerRect: se,
      collector: Z,
      collectorRect: oe,
      readonly: q,
      fence: he,
      maximizedBoxes: this.maximizedBoxes$,
      minimizedBoxes: this.minimizedBoxes$
    };
    FM(this, Pe), this._state$ = G, this.root.appendChild(this.maxTitleBar.render());
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
    const l = n.id || Td(), h = this.maximizedBoxes$.value.includes(l), m = this.maximizedBoxes$.value.includes(l), y = new o_({
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
    return y.mount(this.root), y.focus && (this.focusBox(y), o && this.makeBoxTop(y)), this.boxes$.setValue([...this.boxes, y]), y._delegateEvents.on(Ki.Maximize, () => {
      this.setMaximizedBoxes(this.boxes$.value.map((g) => g.id)), this.maxTitleBar.focusBox(y), this.externalEvents.emit(mn.Maximized, [y.id]);
    }), y._delegateEvents.on(Ki.Minimize, () => {
      this.setMinimizedBoxes([...this.minimizedBoxes$.value, l]), this.externalEvents.emit(mn.Minimized, [y.id]);
    }), y._delegateEvents.on(Ki.Close, () => {
      this.remove(y), this.makeBoxTopFromMaximized(y.id), this.focusTopBox(), this.externalEvents.emit(mn.Removed, [y]);
    }), y._coord$.reaction((g, S, C) => {
      C || this.events.emit(mn.Move, y);
    }), y._size$.reaction((g, S, C) => {
      C || this.events.emit(mn.Resize, y);
    }), y._intrinsicCoord$.reaction((g, S, C) => {
      C || this.events.emit(mn.IntrinsicMove, y);
    }), y._intrinsicSize$.reaction((g, S, C) => {
      C || this.events.emit(mn.IntrinsicResize, y);
    }), y._visualSize$.reaction((g, S, C) => {
      C || this.events.emit(mn.VisualResize, y);
    }), y._zIndex$.reaction((g, S, C) => {
      if (this.boxes.length > 0) {
        const I = this.boxes.reduce(
          (A, z) => A.zIndex > z.zIndex ? A : z
        );
        this.topBox$.setValue(I);
      }
      C || this.events.emit(mn.ZIndex, y);
    }), this.events.emit(mn.Created, y), y;
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
      const m = this.boxes.slice(), y = m.splice(h, 1);
      this.boxes$.setValue(m), y.forEach((S) => S.destroy());
      const g = (l = this.getBox(n)) == null ? void 0 : l.id;
      if (g) {
        this.setMaximizedBoxes(Hh(this.maximizedBoxes$.value, g)), this.setMinimizedBoxes(Hh(this.minimizedBoxes$.value, g));
        const S = this.elementObserverMap.get(g);
        S && S.forEach(({ el: C, cb: I }) => {
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
  setScaleContent(n) {
    this.boxes.forEach((o) => {
      o.setScaleContent(n);
    });
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
      let y = 20;
      this.topBox && (y = this.topBox.intrinsicX * this.containerRect.width + 20, y > this.containerRect.width - h * this.containerRect.width && (y = 20)), o = y / this.containerRect.width;
    }
    if (l == null) {
      let y = 20;
      this.topBox && (y = this.topBox.intrinsicY * this.containerRect.height + 20, y > this.containerRect.height - m * this.containerRect.height && (y = 20)), l = y / this.containerRect.height;
    }
    return { ...n, x: o, y: l, width: h, height: m };
  }
  makeBoxTop(n, o = !1) {
    if (this.topBox && n !== this.topBox)
      if (this.maximizedBoxes$.value.includes(n.id)) {
        const l = this.topBox.zIndex + 1, h = a_(
          this.boxes$.value.map((y) => y.id),
          this.maximizedBoxes$.value,
          this.minimizedBoxes$.value
        ), m = this.boxes$.value.filter(
          (y) => h.includes(y.id)
        );
        n._zIndex$.setValue(l, o), m.sort((y, g) => y._zIndex$.value - g._zIndex$.value).forEach((y, g) => {
          y._zIndex$.setValue(l + 1 + g, o);
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
var pM;
const np = (pM = window.navigator) == null ? void 0 : pM.userAgent;
np == null || np.match(/(Edge?)\/(\d+)/);
const wT = () => typeof navigator < "u" && typeof window < "u" && /iPad|iPhone|iPod/.test(np), bT = () => typeof navigator < "u" && /Android/.test(np), p_ = (r, n, o, l, h) => new m_(
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
    callbacks: n,
    emitter: o,
    boxEmitter: l
  },
  h
);
class m_ {
  constructor(n, o) {
    this.context = n, this.createTeleBoxManagerConfig = o;
    const { emitter: l, callbacks: h, boxEmitter: m } = n;
    this.teleBoxManager = this.setupBoxManager(o), this.teleBoxManager._state$.reaction((y) => {
      h.emit("boxStateChange", y), l.emit("boxStateChange", y);
    }), this.teleBoxManager._darkMode$.reaction((y) => {
      h.emit("darkModeChange", y);
    }), this.teleBoxManager._prefersColorScheme$.reaction((y) => {
      h.emit("prefersColorSchemeChange", y);
    }), this.teleBoxManager._minimizedBoxes$.reaction((y) => {
      y.length || setTimeout(() => {
        const g = 1e-3 * (Math.random() > 0.5 ? 1 : -1);
        this.teleBoxManager.boxes.forEach((S) => {
          S.resize(S.intrinsicWidth + g, S.intrinsicHeight + g, !0);
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
    }), l.on("playgroundSizeChange", () => this.updateManagerRect()), l.on("updateManagerRect", () => this.updateManagerRect()), l.on("onScaleChange", (y) => {
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
  changeScale(n) {
    this.teleBoxManager.setScaleContent(n);
  }
  createBox(n) {
    var C, I, A;
    if (!this.teleBoxManager)
      return;
    let { minwidth: o = ok, minheight: l = lk } = (C = n.app.config) != null ? C : {};
    const { width: h, height: m } = (I = n.app.config) != null ? I : {}, y = ((A = n.options) == null ? void 0 : A.title) || n.appId, g = this.teleBoxManager.containerRect;
    o > 1 && (o = o / g.width), l > 1 && (l = l / g.height);
    const S = {
      title: y,
      minWidth: o,
      minHeight: l,
      width: h,
      height: m,
      id: n.appId
    };
    this.teleBoxManager.create(S, n.smartPosition), this.context.emitter.emit(`${n.appId}${Xt.WindowCreated}`);
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
    }, m = new h_(h);
    this.teleBoxManager && this.teleBoxManager.destroy(), this.teleBoxManager = m;
    const y = (n == null ? void 0 : n.collectorContainer) || Wt.wrapper;
    return y && this.setCollectorContainer(y), m;
  }
  setCollectorContainer(n) {
    var l;
    const o = new QM({
      styles: (l = this.createTeleBoxManagerConfig) == null ? void 0 : l.collectorStyles,
      readonly: this.teleBoxManager.readonly
    }).mount(n);
    this.teleBoxManager.setCollector(o);
  }
  getBox(n) {
    return this.teleBoxManager.queryOne({ id: n });
  }
  closeBox(n, o = !1) {
    return this.teleBoxManager.remove(n, o);
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
    if (!!eT(n))
      try {
        this.teleBoxManager.setMaximizedBoxes(JSON.parse(n), o);
      } catch (l) {
        console.log(l);
      }
  }
  setMinimized(n, o = !0) {
    if (!!eT(n))
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
    this.teleBoxManager.setReadonly(n || wT() || bT()), (o = this.teleBoxManager._collector$.value) == null || o.setReadonly(n || wT() || bT());
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
function ag() {
}
function ZM(r) {
  return r();
}
function ST() {
  return /* @__PURE__ */ Object.create(null);
}
function hg(r) {
  r.forEach(ZM);
}
function v_(r) {
  return typeof r == "function";
}
function g_(r, n) {
  return r != r ? n == n : r !== n || r && typeof r == "object" || typeof r == "function";
}
let Hv;
function sg(r, n) {
  return Hv || (Hv = document.createElement("a")), Hv.href = n, r === Hv.href;
}
function y_(r) {
  return Object.keys(r).length === 0;
}
function vo(r, n) {
  r.appendChild(n);
}
function pg(r, n, o) {
  r.insertBefore(n, o || null);
}
function dp(r) {
  r.parentNode.removeChild(r);
}
function ul(r) {
  return document.createElement(r);
}
function wS(r) {
  return document.createTextNode(r);
}
function Yb() {
  return wS(" ");
}
function Dn(r, n, o) {
  o == null ? r.removeAttribute(n) : r.getAttribute(n) !== o && r.setAttribute(n, o);
}
function w_(r) {
  return Array.from(r.childNodes);
}
function YM(r, n) {
  n = "" + n, r.wholeText !== n && (r.data = n);
}
function Si(r, n, o, l) {
  r.style.setProperty(n, o, l ? "important" : "");
}
let GM;
function og(r) {
  GM = r;
}
const Gh = [], xT = [], eg = [], CT = [], b_ = Promise.resolve();
let Gb = !1;
function S_() {
  Gb || (Gb = !0, b_.then(XM));
}
function Xb(r) {
  eg.push(r);
}
let bb = !1;
const Sb = /* @__PURE__ */ new Set();
function XM() {
  if (!bb) {
    bb = !0;
    do {
      for (let r = 0; r < Gh.length; r += 1) {
        const n = Gh[r];
        og(n), x_(n.$$);
      }
      for (og(null), Gh.length = 0; xT.length; )
        xT.pop()();
      for (let r = 0; r < eg.length; r += 1) {
        const n = eg[r];
        Sb.has(n) || (Sb.add(n), n());
      }
      eg.length = 0;
    } while (Gh.length);
    for (; CT.length; )
      CT.pop()();
    Gb = !1, bb = !1, Sb.clear();
  }
}
function x_(r) {
  if (r.fragment !== null) {
    r.update(), hg(r.before_update);
    const n = r.dirty;
    r.dirty = [-1], r.fragment && r.fragment.p(r.ctx, n), r.after_update.forEach(Xb);
  }
}
const C_ = /* @__PURE__ */ new Set();
function T_(r, n) {
  r && r.i && (C_.delete(r), r.i(n));
}
function M_(r, n, o, l) {
  const { fragment: h, on_mount: m, on_destroy: y, after_update: g } = r.$$;
  h && h.m(n, o), l || Xb(() => {
    const S = m.map(ZM).filter(v_);
    y ? y.push(...S) : hg(S), r.$$.on_mount = [];
  }), g.forEach(Xb);
}
function E_(r, n) {
  const o = r.$$;
  o.fragment !== null && (hg(o.on_destroy), o.fragment && o.fragment.d(n), o.on_destroy = o.fragment = null, o.ctx = []);
}
function I_(r, n) {
  r.$$.dirty[0] === -1 && (Gh.push(r), S_(), r.$$.dirty.fill(0)), r.$$.dirty[n / 31 | 0] |= 1 << n % 31;
}
function A_(r, n, o, l, h, m, y, g = [-1]) {
  const S = GM;
  og(r);
  const C = r.$$ = {
    fragment: null,
    ctx: null,
    props: m,
    update: ag,
    not_equal: h,
    bound: ST(),
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(S ? S.$$.context : n.context || []),
    callbacks: ST(),
    dirty: g,
    skip_bound: !1,
    root: n.target || S.$$.root
  };
  y && y(C.root);
  let I = !1;
  if (C.ctx = o ? o(r, n.props || {}, (A, z, ...$) => {
    const U = $.length ? $[0] : z;
    return C.ctx && h(C.ctx[A], C.ctx[A] = U) && (!C.skip_bound && C.bound[A] && C.bound[A](U), I && I_(r, A)), z;
  }) : [], C.update(), I = !0, hg(C.before_update), C.fragment = l ? l(C.ctx) : !1, n.target) {
    if (n.hydrate) {
      const A = w_(n.target);
      C.fragment && C.fragment.l(A), A.forEach(dp);
    } else
      C.fragment && C.fragment.c();
    n.intro && T_(r.$$.fragment), M_(r, n.target, n.anchor, n.customElement), XM();
  }
  og(S);
}
class R_ {
  $destroy() {
    E_(this, 1), this.$destroy = ag;
  }
  $on(n, o) {
    const l = this.$$.callbacks[n] || (this.$$.callbacks[n] = []);
    return l.push(o), () => {
      const h = l.indexOf(o);
      h !== -1 && l.splice(h, 1);
    };
  }
  $set(n) {
    this.$$set && !y_(n) && (this.$$.skip_bound = !0, this.$$set(n), this.$$.skip_bound = !1);
  }
}
function TT(r) {
  let n, o, l, h, m, y, g, S = r[18] && MT(r), C = r[19] && ET(r);
  return {
    c() {
      n = ul("div"), o = ul("div"), S && S.c(), l = Yb(), h = ul("span"), m = wS(r[1]), y = Yb(), C && C.c(), Si(h, "overflow", "hidden"), Si(h, "white-space", "nowrap"), Si(h, "text-overflow", "ellipsis"), Si(h, "max-width", "80px"), Dn(o, "class", r[9]), Si(o, "background-color", r[3]), Si(o, "color", r[10]), Si(o, "opacity", r[12]), Dn(n, "class", g = "netless-window-manager-cursor-name " + r[16] + " " + r[15]);
    },
    m(I, A) {
      pg(I, n, A), vo(n, o), S && S.m(o, null), vo(o, l), vo(o, h), vo(h, m), vo(o, y), C && C.m(o, null);
    },
    p(I, A) {
      I[18] ? S ? S.p(I, A) : (S = MT(I), S.c(), S.m(o, l)) : S && (S.d(1), S = null), A & 2 && YM(m, I[1]), I[19] ? C ? C.p(I, A) : (C = ET(I), C.c(), C.m(o, null)) : C && (C.d(1), C = null), A & 512 && Dn(o, "class", I[9]), A & 8 && Si(o, "background-color", I[3]), A & 1024 && Si(o, "color", I[10]), A & 4096 && Si(o, "opacity", I[12]), A & 98304 && g !== (g = "netless-window-manager-cursor-name " + I[16] + " " + I[15]) && Dn(n, "class", g);
    },
    d(I) {
      I && dp(n), S && S.d(), C && C.d();
    }
  };
}
function MT(r) {
  let n, o;
  return {
    c() {
      n = ul("img"), Dn(n, "class", "netless-window-manager-cursor-selector-avatar"), Dn(n, "style", r[20]()), sg(n.src, o = r[8]) || Dn(n, "src", o), Dn(n, "alt", "avatar");
    },
    m(l, h) {
      pg(l, n, h);
    },
    p(l, h) {
      h & 256 && !sg(n.src, o = l[8]) && Dn(n, "src", o);
    },
    d(l) {
      l && dp(n);
    }
  };
}
function ET(r) {
  let n, o;
  return {
    c() {
      n = ul("span"), o = wS(r[2]), Dn(n, "class", "netless-window-manager-cursor-tag-name"), Si(n, "background-color", r[11]);
    },
    m(l, h) {
      pg(l, n, h), vo(n, o);
    },
    p(l, h) {
      h & 4 && YM(o, l[2]), h & 2048 && Si(n, "background-color", l[11]);
    },
    d(l) {
      l && dp(n);
    }
  };
}
function D_(r) {
  let n, o, l, h, m, y, g, S = !r[14] && TT(r);
  return {
    c() {
      n = ul("div"), S && S.c(), o = Yb(), l = ul("div"), h = ul("img"), Dn(h, "class", m = "netless-window-manager-cursor-" + r[4] + "-image " + r[15]), sg(h.src, y = r[7]) || Dn(h, "src", y), Dn(h, "alt", r[4]), Dn(l, "class", "cursor-image-wrapper"), Dn(n, "class", g = "netless-window-manager-cursor-mid" + (r[13] ? " netless-window-manager-cursor-custom" : "")), Si(n, "transform", "translateX(" + r[5] + "px) translateY(" + r[6] + "px)"), Si(n, "display", r[17]), Dn(n, "data-cursor-uid", r[0]);
    },
    m(C, I) {
      pg(C, n, I), S && S.m(n, null), vo(n, o), vo(n, l), vo(l, h);
    },
    p(C, [I]) {
      C[14] ? S && (S.d(1), S = null) : S ? S.p(C, I) : (S = TT(C), S.c(), S.m(n, o)), I & 32784 && m !== (m = "netless-window-manager-cursor-" + C[4] + "-image " + C[15]) && Dn(h, "class", m), I & 128 && !sg(h.src, y = C[7]) && Dn(h, "src", y), I & 16 && Dn(h, "alt", C[4]), I & 8192 && g !== (g = "netless-window-manager-cursor-mid" + (C[13] ? " netless-window-manager-cursor-custom" : "")) && Dn(n, "class", g), I & 96 && Si(n, "transform", "translateX(" + C[5] + "px) translateY(" + C[6] + "px)"), I & 131072 && Si(n, "display", C[17]), I & 1 && Dn(n, "data-cursor-uid", C[0]);
    },
    i: ag,
    o: ag,
    d(C) {
      C && dp(n), S && S.d();
    }
  };
}
function k_(r, n, o) {
  let l, h, m, y, g, S, C, I, { uid: A } = n, { cursorName: z } = n, { tagName: $ } = n, { backgroundColor: U } = n, { appliance: q } = n, { x: G } = n, { y: he } = n, { src: se } = n, { visible: Z } = n, { avatar: ue } = n, { theme: oe } = n, { color: ke } = n, { cursorTagBackgroundColor: Fe } = n, { opacity: Pe } = n, { pencilEraserSize: Y } = n, { custom: fe } = n;
  const be = () => Object.entries({
    width: (l ? 19 : 28) + "px",
    height: (l ? 19 : 28) + "px",
    position: l ? "initial" : "absolute",
    "border-color": l ? "white" : U,
    "margin-right": (l ? 4 : 0) + "px"
  }).map(([ie, ct]) => `${ie}: ${ct}`).join(";");
  return r.$$set = (ie) => {
    "uid" in ie && o(0, A = ie.uid), "cursorName" in ie && o(1, z = ie.cursorName), "tagName" in ie && o(2, $ = ie.tagName), "backgroundColor" in ie && o(3, U = ie.backgroundColor), "appliance" in ie && o(4, q = ie.appliance), "x" in ie && o(5, G = ie.x), "y" in ie && o(6, he = ie.y), "src" in ie && o(7, se = ie.src), "visible" in ie && o(21, Z = ie.visible), "avatar" in ie && o(8, ue = ie.avatar), "theme" in ie && o(9, oe = ie.theme), "color" in ie && o(10, ke = ie.color), "cursorTagBackgroundColor" in ie && o(11, Fe = ie.cursorTagBackgroundColor), "opacity" in ie && o(12, Pe = ie.opacity), "pencilEraserSize" in ie && o(22, Y = ie.pencilEraserSize), "custom" in ie && o(13, fe = ie.custom);
  }, r.$$.update = () => {
    r.$$.dirty & 2 && (l = !Xh(z)), r.$$.dirty & 4 && o(19, h = !Xh($)), r.$$.dirty & 256 && o(18, m = !Xh(ue)), r.$$.dirty & 2097152 && o(17, y = Z ? "" : "none"), r.$$.dirty & 16 && o(14, g = q === kn.laserPointer), r.$$.dirty & 16400 && o(23, S = g || q === kn.pencilEraser), r.$$.dirty & 8388608 && o(16, C = S ? "netless-window-manager-laserPointer-pencilEraser-offset" : ""), r.$$.dirty & 4194304 && o(15, I = Y === 3 ? "netless-window-manager-pencilEraser-3-offset" : "");
  }, [
    A,
    z,
    $,
    U,
    q,
    G,
    he,
    se,
    ue,
    oe,
    ke,
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
    S
  ];
}
class N_ extends R_ {
  constructor(n) {
    super(), A_(this, n, k_, D_, g_, {
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
const JM = "data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Ccircle cx='12' cy='12' r='2.5' stroke='%23000' stroke-linejoin='square'/%3E%3Ccircle cx='12' cy='12' r='3.5' stroke='%23FFF'/%3E%3C/g%3E%3C/svg%3E";
function qM(r) {
  return `data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Ccircle cx='12' cy='12' r='2.5' stroke='%23${r}' stroke-linejoin='square'/%3E%3Ccircle cx='12' cy='12' r='3.5' stroke='%23${r}'/%3E%3C/g%3E%3C/svg%3E`;
}
function Md(r) {
  return `data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg' fill='none'%3E%3Cpath d='M5 12H19' stroke='%23${r}' stroke-linejoin='round'/%3E%3Cpath d='M12 5V19' stroke='%23${r}' stroke-linejoin='round'/%3E%3C/svg%3E`;
}
function ku(r) {
  return `url("${r}") 12 12, auto`;
}
function __(r) {
  let n = "";
  for (const o in r)
    n += `.netless-whiteboard.${o} {cursor: ${r[o]}}
`;
  return n;
}
const Wv = document.createElement("style");
function P_(r) {
  const [n, o, l] = r.strokeColor, h = ((1 << 24) + (n << 16) + (o << 8) + l).toString(16).slice(1);
  return Wv.textContent = __({
    "cursor-pencil": ku(qM(h)),
    "cursor-eraser": ku(JM),
    "cursor-rectangle": ku(Md(h)),
    "cursor-ellipse": ku(Md(h)),
    "cursor-straight": ku(Md(h)),
    "cursor-arrow": ku(Md(h)),
    "cursor-shape": ku(Md(h))
  }), document.head.appendChild(Wv), () => {
    Wv.parentNode != null && document.head.removeChild(Wv);
  };
}
const z_ = /* @__PURE__ */ new Set([
  kn.rectangle,
  kn.ellipse,
  kn.straight,
  kn.arrow,
  kn.shape
]);
function IT(r, n) {
  if (r === kn.pencil)
    return qM(n);
  if (r === kn.eraser)
    return JM;
  if (z_.has(r))
    return Md(n);
}
class O_ {
  constructor(n, o, l, h) {
    this.manager = n, this.memberId = o, this.cursorManager = l, this.wrapper = h, this.style = "default", this.move = (m) => {
      var y;
      if (m.type === "main") {
        const g = this.cursorManager.wrapperRect;
        this.component && g && (this.autoHidden(), this.moveCursor(m, g, this.manager.mainView));
      } else {
        const g = this.cursorManager.focusView, S = (y = g == null ? void 0 : g.divElement) == null ? void 0 : y.getBoundingClientRect(), C = g == null ? void 0 : g.camera;
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
    const { x: h, y: m, type: y } = n, g = l == null ? void 0 : l.screen.convertPointToScreen(h, m);
    if (g) {
      let I = g.x - 2, A = g.y - 18;
      if (this.isCustomIcon() && (I -= 11, A += 4), y === "app") {
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
    this.member && this.wrapper && (this.component = new N_({
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
    m === kn.pencilEraser && (m = `${m}${((S = this.member) == null ? void 0 : S.memberState.pencilEraserSize) || 1}`);
    const y = m && l[m];
    if (y)
      return y;
    if (this.style === "custom" && n) {
      const C = IT(n, o);
      if (C)
        return C;
    }
    return h[m || kn.shape] || h[kn.shape];
  }
  isCustomIcon() {
    var y;
    if (!this.member)
      return !1;
    const { memberApplianceName: n, memberColorHex: o } = this, { userApplianceIcons: l } = this.cursorManager;
    let h = this.memberApplianceName;
    return h === kn.pencilEraser && (h = `${h}${((y = this.member) == null ? void 0 : y.memberState.pencilEraserSize) || 1}`), h && l[h] ? !1 : !!(this.style === "custom" && n && IT(n, o));
  }
  updateMember() {
    return this.member = Hb(this.manager.room, this.memberId), this.updateComponent(), this.member;
  }
  updateComponent() {
    var n;
    (n = this.component) == null || n.$set(iS(this.initProps(), ["x", "y"]));
  }
  destroy() {
    this.component && this.component.$destroy(), this.cursorManager.cursorInstances.delete(this.memberId), this.timer && clearTimeout(this.timer);
  }
  hide() {
    this.component && (this.component.$set({ visible: !1 }), this.destroy());
  }
}
const L_ = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAA0CAYAAADFeBvrAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAYISURBVHgB7ZpNSCtXFIBPEuvz+dMGpYUKD/sWFX+Qti6kK7Hqpm6e9q0rIoIUFUShPLV10VZx4+JZqa9v20LBhdq9fyBUCtKNPH8qYl2IOw3G38Rkek4y15y5uTOZJDOWggcOSSYzN/ebc+45554JwIM8iBCPyTEP+86T4vyMfsRN4b+nQTKIJp0vzuGvlpID7os8EQNEIBD4oKio6Bm9DwaDv/v9/n/076JgbtWUYPchwrW8qD7UnOvr6wFNkpubm+/wu7f0c7y6mrnlvQufxB0Iau7V1dX3BDA/P6/V1dVpzc3N2uLiIofK1c8VYHys/wRKBUN3/hGHqaysNOjc3FwMis6hc0FtLTHuvYLxCCZgci8uLn4wg5Gh6Fy8Jk+/NkcCAlAAuUkoW4g0B+d5tLS05O/r67O8eGxsDNra2uDy8nKsoKCAwCIQDxQa0yTxgrvCYXyTk5Ml+Orf2dlJeeHIyAigFSE/P38ELfUNqNdSkjgF5FF89jL1TU1NlQwODl5gZPujp6cHWltbUw7Koc7Pz8mkZpHPFeFrJuZeqLnoMoPoZqe0JjDP/IZgnyLUG/o8NDRkuo5Ua2pjY6MC4oFCFf1cA0oKzRSOp6enRfTaGh0d/QxBt+1CUVgnOTs7+xrHfQzGyOcKkK3QTJMnQffZ6e/v/xwttmsHqqmpKXbdycnJCxy7ABLh3FEgVZ6hZJhnFZoFFMF0d3c/w7v+dyookXBnZ2c/xvHfhriVcvXfdBRItsxjnOhYqjwjoAimq6vrCysoGofk+Ph4Esd/F/UdiFtJAGUd2DygTpp5dmBUUJ2dnc9VUALm8PDwJY7/BPU9VD8k3M4RC6kskxZMKigKIMLN9vf3p3H8DyWgfEhEOwOQD9IXOTz7EObbwsLC4YWFBRgeHrY9ECXYo6MjaGlpKWlsbPxkYGDgRW1tbSEWquVlZWXBzc3Nl1VVVa8hXiXc6ioqBqGaPDk7AACJTRZ3NS9lcUp86cJwoSQ7Pj4Op6enfxUXF3/V0NCQv7q6GsCvwrqGUG/01xAD4+VQTOxaSF43d5bBOisrGBJRCtXX17+/trb268rKSgASFgmz97KFkmo6OztWuVyPweiWGc4WRkhFRQVEIpHg8vJyQAIQVlLBROVxvBYQHsXnO8tk62ZcyN0wecLBwcEvYHSzEPscBqOLCRhLC4n9uqaA8UAWAcAKhtbQ3t7eTHl5+Y9gtAp3twhT056CDMQ7MRzIFTeTYKb1yYYVQFH9VdzsqNmYKpfTJBDX3Ixgdnd3XyHMT2AMALJlBBSPaMpNngrIsTyTCgaj288YDGakictrxizvKFNOjgSSBLS+vv6UYHDb7DgMVgsChjTEgCIKGG4ZU+EWkgNBzN1qamq+pAMTExPgFMzW1tZrhHkFyWE5KxgSszx0527RaDRmOSpRshEOU11dPQPG8CwHARHJlMnTSrwSRFIlfXt7m3V5ngJGuJtqzaQtZkFBVNJezN5ZAdmwjKo2k9tVtrcI3OXk4tPgcg7ChCDZ1URgMOu72Xa5VFHOkymQhWVU60YVmjN6wiC7k6p+S1syCACOwJBYFaexV+yhBekNPsMBO6KAEeE4BMaCU67RsoYhSbXgaT//ht709vZCaWmp6YkEbLFmVJWzas04+iBL7EKpm0J7duqu0B7+CTUpNJuyvb1NCfMj1CqI9wLKUOlOUMeG+gGFkHii4HizUF4z/KFUrPsJ8WbEIyx7nnZ0dDynME6BAuce09iFHo+GrnmGltltb2//E4wVAN82y7vOjKOZXSBhJdHNiT3TYWD8OY2PTUJkdd7MkJMnT5wZVQF2RFX6yBMUdzPMvvfqxz3sXHF+GNT9ANXit/10O1sgHkZvdQAOKvs9B5L7ARELGAAXLSTvM8QExTE+YbHe+HURhZp1aRyF4CJXClbbWwGketgkW9VsY+YaiBCVhfgE+XvxRwgZSM4jUVCDZFQ9pytmXR8hUTB2gnidx4XffVWydN0yQjwmx/jkAZJBrIBI5J7ZvQGZWUgVSuU/EqmOAzicKNMVu816DdRWUV1/7xAP8n+SfwF3Du3NF2sYhwAAAABJRU5ErkJggg==", B_ = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADEAAAAxCAYAAABznEEcAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAZoSURBVHgB7VlLSCRXFL3ljNEhEXTGhMQJmOjCz8ZNVLKICz9xIYhCNi7UgINkGEk2En8hW5cBUQNxo05GAoKikuCAmvGzGMdPcCUGjDPxD/4Vv/3JvWW97luvq7ur+hMZ8MKlqrteNfe8e965970GuLVbC5kpJr53+hjHx9yY3TUxJgLMAQG4ITARfp5T4Mri4uL9q6urnxwOxz/oY5eXl1/Pzs7e195X2FX4jZsIhAK7gx5ps9m6nGj9/f3OtbU1pzAE0318fPwVjYHrrN7R3AjU/wpOBwA9Cmf/9ejoqDMtLU31iooKGdA+ATo4OMiXAEWAHhBAGEApXj4rPAik0vPt7e0vCgoKPH4gMzMTSktLIS8vD2JiYgABvcHMTZyennbHxsaOg3udOJmLzwqEYB0ZgRCZENm4u7e39yQuLq65srISZmZmvP5Ybm4u5OfnQ0lJyXWUCAgzNLS+vt6SnJz8WgvYwV5xSlcRgyVg3ha2Dkxzc3MvfZmVlQW+bGxsDBobGyE7O1u94uJPjIqKqklKSvrbbrfPnp+ff7e8vJwMnlSTKWfJjDKhywJo6wLp0YcZ+dyIUr7s4cOHLsrRlQwBTSBFuzc2NiZYhjjVAIyzZBqEwgCQv0OOM/gNzuiP/ijlDxBRjgClpqa6AF1cXDydmpoaLCws3JcAGYHyC4JMzoKaibKysvienp6FtrY2IA/WCFB5ebkqCHSvARo8Ozt7igIxwIJ2gJ+seFMnDoIyEUV+dHT0G3qWVUr5M043DdAB0m2IKZwAYpgZX+qkywR6NFbuR0iDxmAoZRUQKRxSLTMnJ8eIaqqSeVMnIYUOdu+sq6vrp4f+VCoYo8khZaNs01VRlERUu2/BrWAA7sl2Anink1Ao18JGjyY/PDx8hq1GZqgp5c2mp6chMjLy2b179x7hRzvoqeUUwXIzqq4O5nZsNUaEbIbLqPLTou/s7FTvT05OpsA9sXJG1AVsZDwjutqBIN6gUlWjxod8XRBNKXgsrqpqYZfwEqX9h8TExD7wbFm8LmzxHQ0QHSlXKZVSqFC/hkqlaKapTaGgCQTK7PHW1lb/wsLC86KiokkccoV+qV1tcE0pO7AWxmhTxBszDzqRr66ujqanp2cRpQLNBgUsCh8BwQ54bn5+/s+mpqa+4eHhfS1gb52vwuP0trPjhSZCBtLQ0NA3MDDQQIFYAUHBYhuvzjpVbJr1lZWVP3p7e19UVVXNgHumXYrI4uBx6Yqevz02b0FcRQ8CoBQF3dXVpQLZ3d39C7n+ora29vfJyclDYFnWgFyxK3cxhss/+KoT/N6DVkQpKypFGUCp3Ozo6HgSHx//GLW/BwHsg57zl5pzADajwLn52mPL1ZHPloMoRYPMFL6EhAR18e7s7MxVV1fPsAAp4Avteq7dC/c1+wKI4g+EfGzDM+EYHBw8RDrNiA2QL6upqVGvKJ2/gHu2L1nA5wwEB2YDfSYMO1x/px0cgEc2zBY+eo67u6H29vZ/wU2VC8l58JxKNjDOgojNEp08aFVfX++3l6JMEdDx8fEB0FNIBsDXBc8ArwuW1EkeI1RKdLWmCx+1DhkZGRvR0dFfSsHKxYtnW0iqvJAN9xNm6MR/QO5sfapUSkqKmqW5ubmfwVgyZdpw/vPZl2kUEAinBMSUStG+gwra0NDQSynQKyloIxnlewafjDFLJzLRBJqiFMnqyMgIbG5uDuD996Dnv8iAPOMAPmbcm5lVJwA/vZRMKZGZlpaWVtAvUL4GZMqE1fjRJrUd76LHoX+InlhcXPwZnWW2tra6jjrpiBM3UK/weQr6J+gfodMh9HtwncG7YLA3CMSsLmxx5WuDCt8B7vZeicInTjCWlpb6wc15mfey7oc9E8LElpVmMgb9AXoC+qcTExOPKRu4NlTHs6Q10GfhgfYOvRsJQZ76BWMKuDtaolQs+gfoH6Mn436gDg+e+5BKXUQx/C5Je/a+NpbeiQJPKgUdlNXx/BCBKxVdxW5Q0I3XBqFKRhU4KLtjYawi3csuTKdc4FnIXNvKUJkVEGRG20QZAAUpA5DbaYAQLmQzfzxyk/ffdnCD4NWVnGdE7kQBQvQHC5lVEDxgMaM29lkxGCNLKrDnIbFAMkFmBIaDkHstU41coGZ1TZD5UjReCGUAYbNgdNqoXZB/T67yYbFAMiGML3BhYeH8rb0t9h/zgcTBcTNGiQAAAABJRU5ErkJggg==", j_ = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAA0CAYAAADFeBvrAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAgrSURBVHgB7ZprTBRXFIDP7gIt8lQppTwE5V0KaAn6o1pqNGkDDTEmTUhsgKRp+gNJw68CFkLbVC2QkDS+gD8KJdWmARvbFBNNWpuIRGPFWBXQRMPDqIki+KLATs+ZnTvcvXtnX8w2beJJToaduTP3fHPOPffcOwC8kP+2WCDwIvahGFxTuN8KmNSZmULPNjLeqF9F8rdPkIEGEn+r+vjx46LQ0NA8/Dsader58+e/h4WFDWntFO7ot6fMFAt3JLWi2lCDpqamCux2+2+KROj82NhYGrXT2lu5Z/DP/deFByElA4Pv3LlTiHY/nJ6eVnbv3q1s2bJFyc7OVrZu3arU1dUp4+PjxPUQoT+g9tp9PkMFgpo9kxljHRoaWp2Xl3duYmIiurKyEvDoclNCQgIcPnxYPc7MzHwcGRnZhaft4Ag7O9fUbRhaITCie4lgcnNzT7qDIaHz27dvh+vXr0NEREQneqoCHKFnAR+8ZCaQGGq2CxcurCGYycnJZHcwTNAzUFFRoUJFRUV1IFQ5OKBsXB9uxSwgl0TQ3d29Yt26dccwoyVXV1d7hGEiQmGi2AzOUHx/hob4K2yuYS9G987s7OwPISEh7xPM6dOnwVfBsIMjR45AZmbmo5s3b76Xnp7+J55egMVxBSAZT0v1ED+76yn66dOnLQSzd+9ev2BIyFP0MjBco1JTU/sxfFeDazp3cYgZHmKqdoaGNISHh9fv378fSJcqlPV6e3sBJ+I/goOD34VFL0k95Y+HxPHCYGxmw5DQ2NuzZw8EBQVtunXr1jvgwUP+hhz/QDXMMCNVE8zx48dNg2FCz6QQjI2N/RA8VBFmANnu3btXihnpG8pM9fX1EAi5du0aeWkVOAMBCF7yN+R0z4yOjq6NiYlpp9CgdBtIwXpPH6vgDKWLt0CygtM6MDCwBuUYZSKaOCksAiVY9wFOBePgDOOytPAGSKzNVCCC2bBhw69YdK7ypgpYimzbtk2dl7CM+hFcveOUHDylbTFO1YdhFbByx44dA1QFUP0VSJj4+Hjo6+sDq9U6iEmHKvFZTedQ50GYbN15SITVlwNlZWUnLRZL8s6dOwMOQ9UCTtKTra2ttdppt9V2kMF5cbmsjxuM43bMNrmUzc6fP6+GQiDGDoOJi4ubwb4qm5ubafyIE6nLxGqTPEsGo1cBOGNX0TyDYafC0CyOaxcVziyh53Z2dkJycvLMvn37PmpoaBgFR4jxYSbWdVIgI89Iq4CjR48CZjlYv369+tssqI6ODsjPz4f+/v668vLycxrEHHfkYdwC8SB6mGEV8Cl64cuuri5oa2tTG+EyGjZu3AiXLl1qefDgwV8lJSUFZkDV1tZCcXExXLx4sbWoqKgPFj0zx8GI9ZwO5W4M6ekZYeqpaqbqmaSqqkpNpcPDw4dwzfM9nrLduHEjEs+X0XV/Sx96LnqE1kLtBQUF3eDwCO8dGQyzV5rl+JyuegfXI29jRotiRlKnpFghHMzKyjqotVXS0tLacKPjF3bdHxjSq1evduAkepAD+ZsDYlC8V5w8ZBVg+PPq2MGMlkInqE4joTf45MmT4YyMjAPcA+ltLSQlJX2BafxnX6HI29QeK44TOTk57mCYZ0QoJ8OBM4yB6dkNkwGlSygsLFQvYtYB3BTMxFL+M+0eFgZqp4mJiU2+QKGX1fGIk/QIrn0aYXGsyDxjmAyMhO2jhaCGoUbX1NSkLSwsPMJqV8Fspu6lIZS6OYhjiOLwdU7fQM1HfRPD7wS1obZ0j0xpb4726Z49ezaJf2/S7s9ATUGNR41BjdJseRnke3WGwhrRTS9pD1mOGoeG15BxOOfoxuCkp0Ih6NeaEaSZGlieJyiCoc1FgsGldokGk8nBvAKOrWIGQ5uPsm0tt0BWDiicAaGuGhkZ+YqMw9StGzU4OKhCnT179hNsswY1FTXdE5QEJhc1S3tGogazXLOBwQSBl3tzIhQPtAL1VQJCTcNx8y1vHIUghSKFZE9PT7H2dlM1b+Wgrr1y5Uq77J75+fnplpaWMg2ch4nlYEI5z7hdensDpI4hrYNErcMMXJ32koG4ztf3pultz83NjWG99Ra2WQ0OL2VjZjwgeufUqVOqV8+cOdPIwdBLSNJeHg8TAh5WqJ6EfSmgt7IMNRJ1JThiOlnrOAMHshprmMKdoGSCpb9s3B3SYLIFGIqICJB7xisYi+RvfiypXw40DWGdlJaWRmMd141hk8V2OWm7ieYTXhBc3+BgaZyqAISjOYxSMVvXsBTNlzdiNQDgRao2AtK3pjggpmrqbGpqSsLPIN/dv38/gaBwUjTshMHcvn27JyUlpRmc5xpPMD599LIYnLNyUKKndKjGxsakXbt2deMCLIE8IVvs0YRM1fjdu3d/wrXN5+BcnzEgvor2uN3rjzAYMp5lPEoQlE5fA0fWo8GfhlCbKVFQ1pKNIfzcOHH58mWqaimVUwJI0+6n59D4pIlzmdZPMPiZzXjDjX47Le5g0Uu8x2zgPqWyKpjVe7x3+AUbq9NYjQbgp2dsBud5o8TP7d5kHAWcQchQfoEmLgn8HjOiBIF7o5hI1x6CEbLNP3bdqYAF44JzyWLzcN1i8DcT/o3awbm8Fz3DAy2A62INwPV/E3wWdx5inmBHuwChCBD6R2JwHge80TIQRQLjt7e8DTkGZgfX8cUMZTDAteFDkveaIlzjX9ySQs8X18r2t2VHUURPKoICmDR+eCO9aSdmOIub3/w9RgpgUpiJhvraXpa6jZKHGEqyusw0GLFzX+5RhN/8kYnMSNMMfyH/V/kHST6OYVElTPAAAAAASUVORK5CYII=", V_ = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNDBweCIgaGVpZ2h0PSI0MHB4IiB2aWV3Qm94PSIwIDAgNDAgNDAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDYwLjEgKDg4MTMzKSAtIGh0dHBzOi8vc2tldGNoLmNvbSAtLT4KICAgIDx0aXRsZT5zaGFwZS1jdXJzb3I8L3RpdGxlPgogICAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CiAgICA8ZGVmcz4KICAgICAgICA8cGF0aCBkPSJNMjAsMjEuNSBDMjAuMjQ1NDU5OSwyMS41IDIwLjQ0OTYwODQsMjEuNjc2ODc1MiAyMC40OTE5NDQzLDIxLjkxMDEyNDQgTDIwLjUsMjIgTDIwLjUsMjcgQzIwLjUsMjcuMjc2MTQyNCAyMC4yNzYxNDI0LDI3LjUgMjAsMjcuNSBDMTkuNzU0NTQwMSwyNy41IDE5LjU1MDM5MTYsMjcuMzIzMTI0OCAxOS41MDgwNTU3LDI3LjA4OTg3NTYgTDE5LjUsMjcgTDE5LjUsMjIgQzE5LjUsMjEuNzIzODU3NiAxOS43MjM4NTc2LDIxLjUgMjAsMjEuNSBaIE0yNywxOS41IEMyNy4yNzYxNDI0LDE5LjUgMjcuNSwxOS43MjM4NTc2IDI3LjUsMjAgQzI3LjUsMjAuMjQ1NDU5OSAyNy4zMjMxMjQ4LDIwLjQ0OTYwODQgMjcuMDg5ODc1NiwyMC40OTE5NDQzIEwyNywyMC41IEwyMiwyMC41IEMyMS43MjM4NTc2LDIwLjUgMjEuNSwyMC4yNzYxNDI0IDIxLjUsMjAgQzIxLjUsMTkuNzU0NTQwMSAyMS42NzY4NzUyLDE5LjU1MDM5MTYgMjEuOTEwMTI0NCwxOS41MDgwNTU3IEwyMiwxOS41IEwyNywxOS41IFogTTE4LDE5LjUgQzE4LjI3NjE0MjQsMTkuNSAxOC41LDE5LjcyMzg1NzYgMTguNSwyMCBDMTguNSwyMC4yNDU0NTk5IDE4LjMyMzEyNDgsMjAuNDQ5NjA4NCAxOC4wODk4NzU2LDIwLjQ5MTk0NDMgTDE4LDIwLjUgTDEzLDIwLjUgQzEyLjcyMzg1NzYsMjAuNSAxMi41LDIwLjI3NjE0MjQgMTIuNSwyMCBDMTIuNSwxOS43NTQ1NDAxIDEyLjY3Njg3NTIsMTkuNTUwMzkxNiAxMi45MTAxMjQ0LDE5LjUwODA1NTcgTDEzLDE5LjUgTDE4LDE5LjUgWiBNMjAsMTIuNSBDMjAuMjQ1NDU5OSwxMi41IDIwLjQ0OTYwODQsMTIuNjc2ODc1MiAyMC40OTE5NDQzLDEyLjkxMDEyNDQgTDIwLjUsMTMgTDIwLjUsMTggQzIwLjUsMTguMjc2MTQyNCAyMC4yNzYxNDI0LDE4LjUgMjAsMTguNSBDMTkuNzU0NTQwMSwxOC41IDE5LjU1MDM5MTYsMTguMzIzMTI0OCAxOS41MDgwNTU3LDE4LjA4OTg3NTYgTDE5LjUsMTggTDE5LjUsMTMgQzE5LjUsMTIuNzIzODU3NiAxOS43MjM4NTc2LDEyLjUgMjAsMTIuNSBaIiBpZD0icGF0aC0xIj48L3BhdGg+CiAgICAgICAgPGZpbHRlciB4PSItNjQuNiUiIHk9Ii01OS41JSIgd2lkdGg9IjIyOS4zJSIgaGVpZ2h0PSIyNDYuMSUiIGZpbHRlclVuaXRzPSJvYmplY3RCb3VuZGluZ0JveCIgaWQ9ImZpbHRlci0yIj4KICAgICAgICAgICAgPGZlTW9ycGhvbG9neSByYWRpdXM9IjEiIG9wZXJhdG9yPSJkaWxhdGUiIGluPSJTb3VyY2VBbHBoYSIgcmVzdWx0PSJzaGFkb3dTcHJlYWRPdXRlcjEiPjwvZmVNb3JwaG9sb2d5PgogICAgICAgICAgICA8ZmVPZmZzZXQgZHg9IjAiIGR5PSIyIiBpbj0ic2hhZG93U3ByZWFkT3V0ZXIxIiByZXN1bHQ9InNoYWRvd09mZnNldE91dGVyMSI+PC9mZU9mZnNldD4KICAgICAgICAgICAgPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMyIgaW49InNoYWRvd09mZnNldE91dGVyMSIgcmVzdWx0PSJzaGFkb3dCbHVyT3V0ZXIxIj48L2ZlR2F1c3NpYW5CbHVyPgogICAgICAgICAgICA8ZmVDb21wb3NpdGUgaW49InNoYWRvd0JsdXJPdXRlcjEiIGluMj0iU291cmNlQWxwaGEiIG9wZXJhdG9yPSJvdXQiIHJlc3VsdD0ic2hhZG93Qmx1ck91dGVyMSI+PC9mZUNvbXBvc2l0ZT4KICAgICAgICAgICAgPGZlQ29sb3JNYXRyaXggdmFsdWVzPSIwIDAgMCAwIDAgICAwIDAgMCAwIDAgICAwIDAgMCAwIDAgIDAgMCAwIDAuMTYgMCIgdHlwZT0ibWF0cml4IiBpbj0ic2hhZG93Qmx1ck91dGVyMSI+PC9mZUNvbG9yTWF0cml4PgogICAgICAgIDwvZmlsdGVyPgogICAgPC9kZWZzPgogICAgPGcgaWQ9Iumhtemdoi00IiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8ZyBpZD0iV2hpdGVib2FyZC1HdWlkZWxpbmVzIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMzQ0LjAwMDAwMCwgLTc1MS4wMDAwMDApIj4KICAgICAgICAgICAgPGcgaWQ9InNoYXBlLWN1cnNvciIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzQ0LjAwMDAwMCwgNzUxLjAwMDAwMCkiPgogICAgICAgICAgICAgICAgPHJlY3QgaWQ9IuefqeW9ouWkh+S7vS00NCIgZmlsbD0iI0ZGRkZGRiIgb3BhY2l0eT0iMC4wMSIgeD0iMCIgeT0iMCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMiI+PC9yZWN0PgogICAgICAgICAgICAgICAgPGcgaWQ9IuW9oueKtue7k+WQiCIgZmlsbC1ydWxlPSJub256ZXJvIj4KICAgICAgICAgICAgICAgICAgICA8dXNlIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjEiIGZpbHRlcj0idXJsKCNmaWx0ZXItMikiIHhsaW5rOmhyZWY9IiNwYXRoLTEiPjwvdXNlPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIxIiBkPSJNMjAsMjEgQzIwLjQ4NTQxMDMsMjEgMjAuODk4MDg1LDIxLjM0Nzk5OTMgMjAuOTg5OTQ3OSwyMS44NjU0ODc3IEwyMSwyMiBMMjEsMjcgQzIxLDI3LjU1MjI4NDcgMjAuNTUyMjg0NywyOCAyMCwyOCBDMTkuNTE0NTg5NywyOCAxOS4xMDE5MTUsMjcuNjUyMDAwNyAxOS4wMTAwNTIxLDI3LjEzNDUxMjMgTDE5LDI3IEwxOSwyMiBDMTksMjEuNDQ3NzE1MyAxOS40NDc3MTUzLDIxIDIwLDIxIFogTTI3LDE5IEMyNy41NTIyODQ3LDE5IDI4LDE5LjQ0NzcxNTMgMjgsMjAgQzI4LDIwLjQ4NTQxMDMgMjcuNjUyMDAwNywyMC44OTgwODUgMjcuMTM0NTEyMywyMC45ODk5NDc5IEwyNywyMSBMMjIsMjEgQzIxLjQ0NzcxNTMsMjEgMjEsMjAuNTUyMjg0NyAyMSwyMCBDMjEsMTkuNTE0NTg5NyAyMS4zNDc5OTkzLDE5LjEwMTkxNSAyMS44NjU0ODc3LDE5LjAxMDA1MjEgTDIyLDE5IEwyNywxOSBaIE0xOCwxOSBDMTguNTUyMjg0NywxOSAxOSwxOS40NDc3MTUzIDE5LDIwIEMxOSwyMC40ODU0MTAzIDE4LjY1MjAwMDcsMjAuODk4MDg1IDE4LjEzNDUxMjMsMjAuOTg5OTQ3OSBMMTgsMjEgTDEzLDIxIEMxMi40NDc3MTUzLDIxIDEyLDIwLjU1MjI4NDcgMTIsMjAgQzEyLDE5LjUxNDU4OTcgMTIuMzQ3OTk5MywxOS4xMDE5MTUgMTIuODY1NDg3NywxOS4wMTAwNTIxIEwxMywxOSBMMTgsMTkgWiBNMjAsMTIgQzIwLjQ4NTQxMDMsMTIgMjAuODk4MDg1LDEyLjM0Nzk5OTMgMjAuOTg5OTQ3OSwxMi44NjU0ODc3IEwyMSwxMyBMMjEsMTggQzIxLDE4LjU1MjI4NDcgMjAuNTUyMjg0NywxOSAyMCwxOSBDMTkuNTE0NTg5NywxOSAxOS4xMDE5MTUsMTguNjUyMDAwNyAxOS4wMTAwNTIxLDE4LjEzNDUxMjMgTDE5LDE4IEwxOSwxMyBDMTksMTIuNDQ3NzE1MyAxOS40NDc3MTUzLDEyIDIwLDEyIFoiIGZpbGw9IiMyMTIzMjQiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PC9wYXRoPgogICAgICAgICAgICAgICAgPC9nPgogICAgICAgICAgICAgICAgPHJlY3QgaWQ9IuefqeW9oiIgZmlsbD0iI0ZGRkZGRiIgeD0iMTguNSIgeT0iMTciIHdpZHRoPSIzIiBoZWlnaHQ9IjYiPjwvcmVjdD4KICAgICAgICAgICAgICAgIDxyZWN0IGlkPSLnn6nlvaIiIGZpbGw9IiNGRkZGRkYiIHg9IjE3IiB5PSIxOC41IiB3aWR0aD0iNiIgaGVpZ2h0PSIzIj48L3JlY3Q+CiAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMjAsMjEuNSBDMjAuMjQ1NDU5OSwyMS41IDIwLjQ0OTYwODQsMjEuNjc2ODc1MiAyMC40OTE5NDQzLDIxLjkxMDEyNDQgTDIwLjUsMjIgTDIwLjUsMjcgQzIwLjUsMjcuMjc2MTQyNCAyMC4yNzYxNDI0LDI3LjUgMjAsMjcuNSBDMTkuNzU0NTQwMSwyNy41IDE5LjU1MDM5MTYsMjcuMzIzMTI0OCAxOS41MDgwNTU3LDI3LjA4OTg3NTYgTDE5LjUsMjcgTDE5LjUsMjIgQzE5LjUsMjEuNzIzODU3NiAxOS43MjM4NTc2LDIxLjUgMjAsMjEuNSBaIE0yNywxOS41IEMyNy4yNzYxNDI0LDE5LjUgMjcuNSwxOS43MjM4NTc2IDI3LjUsMjAgQzI3LjUsMjAuMjQ1NDU5OSAyNy4zMjMxMjQ4LDIwLjQ0OTYwODQgMjcuMDg5ODc1NiwyMC40OTE5NDQzIEwyNywyMC41IEwyMiwyMC41IEMyMS43MjM4NTc2LDIwLjUgMjEuNSwyMC4yNzYxNDI0IDIxLjUsMjAgQzIxLjUsMTkuNzU0NTQwMSAyMS42NzY4NzUyLDE5LjU1MDM5MTYgMjEuOTEwMTI0NCwxOS41MDgwNTU3IEwyMiwxOS41IEwyNywxOS41IFogTTE4LDE5LjUgQzE4LjI3NjE0MjQsMTkuNSAxOC41LDE5LjcyMzg1NzYgMTguNSwyMCBDMTguNSwyMC4yNDU0NTk5IDE4LjMyMzEyNDgsMjAuNDQ5NjA4NCAxOC4wODk4NzU2LDIwLjQ5MTk0NDMgTDE4LDIwLjUgTDEzLDIwLjUgQzEyLjcyMzg1NzYsMjAuNSAxMi41LDIwLjI3NjE0MjQgMTIuNSwyMCBDMTIuNSwxOS43NTQ1NDAxIDEyLjY3Njg3NTIsMTkuNTUwMzkxNiAxMi45MTAxMjQ0LDE5LjUwODA1NTcgTDEzLDE5LjUgTDE4LDE5LjUgWiBNMjAsMTIuNSBDMjAuMjQ1NDU5OSwxMi41IDIwLjQ0OTYwODQsMTIuNjc2ODc1MiAyMC40OTE5NDQzLDEyLjkxMDEyNDQgTDIwLjUsMTMgTDIwLjUsMTggQzIwLjUsMTguMjc2MTQyNCAyMC4yNzYxNDI0LDE4LjUgMjAsMTguNSBDMTkuNzU0NTQwMSwxOC41IDE5LjU1MDM5MTYsMTguMzIzMTI0OCAxOS41MDgwNTU3LDE4LjA4OTg3NTYgTDE5LjUsMTggTDE5LjUsMTMgQzE5LjUsMTIuNzIzODU3NiAxOS43MjM4NTc2LDEyLjUgMjAsMTIuNSBaIiBpZD0i5b2i54q257uT5ZCIIiBmaWxsPSIjMjEyMzI0IiBmaWxsLXJ1bGU9Im5vbnplcm8iPjwvcGF0aD4KICAgICAgICAgICAgPC9nPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+", U_ = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNDdweCIgaGVpZ2h0PSI0MHB4IiB2aWV3Qm94PSIwIDAgNDcgNDAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDYwLjEgKDg4MTMzKSAtIGh0dHBzOi8vc2tldGNoLmNvbSAtLT4KICAgIDx0aXRsZT50ZXh0LWN1cnNvcjwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPgogICAgICAgIDxwYXRoIGQ9Ik0xNiwyNi41IEMxNS43MjM4NTc2LDI2LjUgMTUuNSwyNi4yNzYxNDI0IDE1LjUsMjYgQzE1LjUsMjUuNzU0NTQwMSAxNS42NzY4NzUyLDI1LjU1MDM5MTYgMTUuOTEwMTI0NCwyNS41MDgwNTU3IEwxNiwyNS41IEwxOS41LDI1LjUgTDE5LjUsMTQuNSBMMTYsMTQuNSBDMTUuNzIzODU3NiwxNC41IDE1LjUsMTQuMjc2MTQyNCAxNS41LDE0IEMxNS41LDEzLjc1NDU0MDEgMTUuNjc2ODc1MiwxMy41NTAzOTE2IDE1LjkxMDEyNDQsMTMuNTA4MDU1NyBMMTYsMTMuNSBMMjQsMTMuNSBDMjQuMjc2MTQyNCwxMy41IDI0LjUsMTMuNzIzODU3NiAyNC41LDE0IEMyNC41LDE0LjI0NTQ1OTkgMjQuMzIzMTI0OCwxNC40NDk2MDg0IDI0LjA4OTg3NTYsMTQuNDkxOTQ0MyBMMjQsMTQuNSBMMjAuNSwxNC41IEwyMC41LDI1LjUgTDI0LDI1LjUgQzI0LjI3NjE0MjQsMjUuNSAyNC41LDI1LjcyMzg1NzYgMjQuNSwyNiBDMjQuNSwyNi4yNDU0NTk5IDI0LjMyMzEyNDgsMjYuNDQ5NjA4NCAyNC4wODk4NzU2LDI2LjQ5MTk0NDMgTDI0LDI2LjUgTDE2LDI2LjUgWiIgaWQ9InBhdGgtMSI+PC9wYXRoPgogICAgICAgIDxmaWx0ZXIgeD0iLTI4NC4wJSIgeT0iLTgxLjUlIiB3aWR0aD0iNjY4LjElIiBoZWlnaHQ9IjI5My45JSIgZmlsdGVyVW5pdHM9Im9iamVjdEJvdW5kaW5nQm94IiBpZD0iZmlsdGVyLTIiPgogICAgICAgICAgICA8ZmVNb3JwaG9sb2d5IHJhZGl1cz0iMSIgb3BlcmF0b3I9ImRpbGF0ZSIgaW49IlNvdXJjZUFscGhhIiByZXN1bHQ9InNoYWRvd1NwcmVhZE91dGVyMSI+PC9mZU1vcnBob2xvZ3k+CiAgICAgICAgICAgIDxmZU9mZnNldCBkeD0iMCIgZHk9IjIiIGluPSJzaGFkb3dTcHJlYWRPdXRlcjEiIHJlc3VsdD0ic2hhZG93T2Zmc2V0T3V0ZXIxIj48L2ZlT2Zmc2V0PgogICAgICAgICAgICA8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIzIiBpbj0ic2hhZG93T2Zmc2V0T3V0ZXIxIiByZXN1bHQ9InNoYWRvd0JsdXJPdXRlcjEiPjwvZmVHYXVzc2lhbkJsdXI+CiAgICAgICAgICAgIDxmZUNvbXBvc2l0ZSBpbj0ic2hhZG93Qmx1ck91dGVyMSIgaW4yPSJTb3VyY2VBbHBoYSIgb3BlcmF0b3I9Im91dCIgcmVzdWx0PSJzaGFkb3dCbHVyT3V0ZXIxIj48L2ZlQ29tcG9zaXRlPgogICAgICAgICAgICA8ZmVDb2xvck1hdHJpeCB2YWx1ZXM9IjAgMCAwIDAgMCAgIDAgMCAwIDAgMCAgIDAgMCAwIDAgMCAgMCAwIDAgMC4xNiAwIiB0eXBlPSJtYXRyaXgiIGluPSJzaGFkb3dCbHVyT3V0ZXIxIj48L2ZlQ29sb3JNYXRyaXg+CiAgICAgICAgPC9maWx0ZXI+CiAgICA8L2RlZnM+CiAgICA8ZyBpZD0i6aG16Z2iLTQiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxnIGlkPSJXaGl0ZWJvYXJkLUd1aWRlbGluZXMiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zODguMDAwMDAwLCAtNjcyLjAwMDAwMCkiPgogICAgICAgICAgICA8ZyBpZD0idGV4dC1jdXJzb3IiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDM5Mi4wMDAwMDAsIDY3Mi4wMDAwMDApIj4KICAgICAgICAgICAgICAgIDxyZWN0IGlkPSLnn6nlvaLlpIfku70tNDAiIGZpbGw9IiNGRkZGRkYiIG9wYWNpdHk9IjAuMDEiIHg9IjAiIHk9IjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcng9IjIiPjwvcmVjdD4KICAgICAgICAgICAgICAgIDxnIGlkPSLlvaLnirbnu5PlkIgiIGZpbGwtcnVsZT0ibm9uemVybyI+CiAgICAgICAgICAgICAgICAgICAgPHVzZSBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIxIiBmaWx0ZXI9InVybCgjZmlsdGVyLTIpIiB4bGluazpocmVmPSIjcGF0aC0xIj48L3VzZT4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMSIgZD0iTTE5LDI1IEwxOSwxNSBMMTYsMTUgQzE1LjQ0NzcxNTMsMTUgMTUsMTQuNTUyMjg0NyAxNSwxNCBDMTUsMTMuNTE0NTg5NyAxNS4zNDc5OTkzLDEzLjEwMTkxNSAxNS44NjU0ODc3LDEzLjAxMDA1MjEgTDE2LDEzIEwyNCwxMyBDMjQuNTUyMjg0NywxMyAyNSwxMy40NDc3MTUzIDI1LDE0IEMyNSwxNC40ODU0MTAzIDI0LjY1MjAwMDcsMTQuODk4MDg1IDI0LjEzNDUxMjMsMTQuOTg5OTQ3OSBMMjQsMTUgTDIxLDE1IEwyMSwyNSBMMjQsMjUgQzI0LjU1MjI4NDcsMjUgMjUsMjUuNDQ3NzE1MyAyNSwyNiBDMjUsMjYuNDg1NDEwMyAyNC42NTIwMDA3LDI2Ljg5ODA4NSAyNC4xMzQ1MTIzLDI2Ljk4OTk0NzkgTDI0LDI3IEwxNiwyNyBDMTUuNDQ3NzE1MywyNyAxNSwyNi41NTIyODQ3IDE1LDI2IEMxNSwyNS41MTQ1ODk3IDE1LjM0Nzk5OTMsMjUuMTAxOTE1IDE1Ljg2NTQ4NzcsMjUuMDEwMDUyMSBMMTYsMjUgTDE5LDI1IFoiIGZpbGw9IiMyMTIzMjQiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PC9wYXRoPgogICAgICAgICAgICAgICAgPC9nPgogICAgICAgICAgICA8L2c+CiAgICAgICAgPC9nPgogICAgPC9nPgo8L3N2Zz4=", H_ = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMjhweCIgaGVpZ2h0PSIyOHB4IiB2aWV3Qm94PSIwIDAgMjggMjgiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDU1LjEgKDc4MTM2KSAtIGh0dHBzOi8vc2tldGNoYXBwLmNvbSAtLT4KICAgIDx0aXRsZT7nvJbnu4QgMjwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPgogICAgICAgIDxmaWx0ZXIgeD0iLTEyMC4wJSIgeT0iLTEyMC4wJSIgd2lkdGg9IjM0MC4wJSIgaGVpZ2h0PSIzNDAuMCUiIGZpbHRlclVuaXRzPSJvYmplY3RCb3VuZGluZ0JveCIgaWQ9ImZpbHRlci0xIj4KICAgICAgICAgICAgPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iNCIgaW49IlNvdXJjZUdyYXBoaWMiPjwvZmVHYXVzc2lhbkJsdXI+CiAgICAgICAgPC9maWx0ZXI+CiAgICA8L2RlZnM+CiAgICA8ZyBpZD0i6aG16Z2iMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9Iue8lue7hC0yIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg5LjAwMDAwMCwgOS4wMDAwMDApIiBmaWxsPSIjRkYwMTAwIj4KICAgICAgICAgICAgPGNpcmNsZSBpZD0i5qSt5ZyG5b2iIiBmaWx0ZXI9InVybCgjZmlsdGVyLTEpIiBjeD0iNSIgY3k9IjUiIHI9IjUiPjwvY2lyY2xlPgogICAgICAgICAgICA8cGF0aCBkPSJNNSw4IEM2LjY1Njg1NDI1LDggOCw2LjY1Njg1NDI1IDgsNSBDOCwzLjM0MzE0NTc1IDYuNjU2ODU0MjUsMiA1LDIgQzMuMzQzMTQ1NzUsMiAyLDMuMzQzMTQ1NzUgMiw1IEMyLDYuNjU2ODU0MjUgMy4zNDMxNDU3NSw4IDUsOCBaIE01LDYuMjg1NzE0MjkgQzQuMjg5OTE5NjEsNi4yODU3MTQyOSAzLjcxNDI4NTcxLDUuNzEwMDgwMzkgMy43MTQyODU3MSw1IEMzLjcxNDI4NTcxLDQuMjg5OTE5NjEgNC4yODk5MTk2MSwzLjcxNDI4NTcxIDUsMy43MTQyODU3MSBDNS43MTAwODAzOSwzLjcxNDI4NTcxIDYuMjg1NzE0MjksNC4yODk5MTk2MSA2LjI4NTcxNDI5LDUgQzYuMjg1NzE0MjksNS43MTAwODAzOSA1LjcxMDA4MDM5LDYuMjg1NzE0MjkgNSw2LjI4NTcxNDI5IFoiIGlkPSLmpK3lnIblvaIiIGZpbGwtcnVsZT0ibm9uemVybyI+PC9wYXRoPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+", W_ = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMjYiIHZpZXdCb3g9IjAgMCAxOCAyNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMC41IiB5PSIwLjUiIHdpZHRoPSIxNyIgaGVpZ2h0PSIyNSIgcng9IjMuNSIgZmlsbD0iYmxhY2siIGZpbGwtb3BhY2l0eT0iMC4zNSIgc3Ryb2tlPSJ3aGl0ZSIvPgo8L3N2Zz4K", F_ = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjYiIGhlaWdodD0iMzQiIHZpZXdCb3g9IjAgMCAyNiAzNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMC41IiB5PSIwLjUiIHdpZHRoPSIyNSIgaGVpZ2h0PSIzMyIgcng9IjMuNSIgZmlsbD0iYmxhY2siIGZpbGwtb3BhY2l0eT0iMC4zNSIgc3Ryb2tlPSJ3aGl0ZSIvPgo8L3N2Zz4K", $_ = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzQiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCAzNCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMC41IiB5PSIwLjUiIHdpZHRoPSIzMyIgaGVpZ2h0PSI0OSIgcng9IjMuNSIgZmlsbD0iYmxhY2siIGZpbGwtb3BhY2l0eT0iMC4zNSIgc3Ryb2tlPSJ3aGl0ZSIvPgo8L3N2Zz4K", Q_ = {
  [kn.pencil]: L_,
  [kn.selector]: B_,
  [kn.eraser]: j_,
  [kn.shape]: V_,
  [kn.text]: U_,
  [kn.laserPointer]: H_,
  pencilEraser1: W_,
  pencilEraser2: F_,
  pencilEraser3: $_
}, AT = "local-cursor";
class Z_ {
  constructor(n, o, l, h) {
    var g;
    this.manager = n, this.enableCursor = o, this.cursorInstances = /* @__PURE__ */ new Map(), this.userApplianceIcons = {}, this.sideEffectManager = new Nd(), this.store = this.manager.store, this.leaveFlag = !0, this._style = "default", this.onCursorMove = (S) => {
      const C = this.initCursorInstance(S.uid);
      if (S.state === jb.Leave)
        C.leave();
      else {
        const I = C.updateMember();
        this.canMoveCursor(I) && C.move(S.position);
      }
    }, this.initCursorInstance = (S) => {
      let C = this.cursorInstances.get(S);
      return C || (C = new O_(this.manager, S, this, Wt.wrapper), this.cursorInstances.set(S, C)), C;
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
            state: jb.Leave
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
    m && this.setupWrapper(m), this.sideEffectManager.add(() => tt.on("cursorMove", this.onCursorMove)), this.sideEffectManager.add(() => tt.on("playgroundSizeChange", () => this.updateContainerRect()));
    const y = this.manager.room;
    y && this.sideEffectManager.add(() => {
      const S = (C) => {
        this.style === "custom" && C.memberState && this.enableCustomCursor();
      };
      return y.callbacks.on("onRoomStateChanged", S), () => y.callbacks.off("onRoomStateChanged", S);
    }), h && (this.userApplianceIcons = h), this.style = (l == null ? void 0 : l.style) || "default";
  }
  get applianceIcons() {
    return { ...Q_, ...this.userApplianceIcons };
  }
  get style() {
    return this._style;
  }
  set style(n) {
    this._style !== n && (this._style = n, this.cursorInstances.forEach((o) => {
      o.setStyle(n);
    }), n === "custom" ? this.enableCustomCursor() : this.sideEffectManager.flush(AT));
  }
  enableCustomCursor() {
    this.sideEffectManager.add(
      () => P_(this.manager.getMemberState()),
      AT
    );
  }
  canMoveCursor(n) {
    const o = (n == null ? void 0 : n.memberState.currentApplianceName) === kn.laserPointer;
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
    const h = Hb(this.manager.room, this.manager.uid), m = (h == null ? void 0 : h.memberState.currentApplianceName) === kn.pencilEraser;
    if (this.wrapperRect && this.manager.canOperate && this.canMoveCursor(h) && m) {
      const y = n.type === "main" ? this.manager.mainView : this.focusView, g = this.getPoint(y, o, l);
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
    const h = Hb(this.manager.room, this.manager.uid);
    if (this.wrapperRect && this.manager.canOperate && this.canMoveCursor(h)) {
      const m = n.type === "main" ? this.manager.mainView : this.focusView, y = this.getPoint(m, o, l);
      y && this.manager.dispatchInternalEvent(Xt.CursorMove, {
        uid: this.manager.uid,
        position: {
          x: y.x,
          y: y.y,
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
class Y_ {
  constructor(n) {
    this.manager = n, tt.on("changePageState", () => {
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
class G_ {
  constructor(n) {
    this.ctx = n, this.reactors = /* @__PURE__ */ new Map(), this.disposers = /* @__PURE__ */ new Map(), this.onPhaseChanged = async (o) => {
      var l, h;
      o === ll.Reconnecting && this.ctx.emitter.emit("startReconnect"), o === ll.Connected && this.phase === ll.Reconnecting && ((l = this.room) != null && l.isWritable ? (h = this.room) == null || h.dispatchMagixEvent(ub, {}) : (await SM(500), this.onReconnected())), this.phase = o;
    }, this.onReconnected = xs(() => {
      this._onReconnected();
    }, 1e3), this._onReconnected = () => {
      Ca("onReconnected refresh reactors"), this.releaseDisposers(), this.reactors.forEach((o, l) => {
        xd(o) && this.disposers.set(l, o());
      }), this.ctx.emitter.emit("onReconnected");
    };
  }
  setRoom(n) {
    this.room = n, this.phase = n == null ? void 0 : n.phase, n && (n.callbacks.off("onPhaseChanged", this.onPhaseChanged), n.callbacks.on("onPhaseChanged", this.onPhaseChanged), n.addMagixEventListener(
      ub,
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
    (n = this.room) == null || n.callbacks.off("onPhaseChanged", this.onPhaseChanged), (o = this.room) == null || o.removeMagixEventListener(ub, this.onReconnected), this.releaseDisposers();
  }
}
const X_ = (r, n) => {
  if (aS(r))
    q_(r);
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
    }), r.moveCamera = (l) => n.moveCamera(l), r.moveCameraToContain = (...l) => n.moveCameraToContain(...l), r.convertToPointInWorld = (...l) => n.mainView.convertToPointInWorld(...l), r.setCameraBound = (...l) => n.mainView.setCameraBound(...l), r.scenePreview = (...l) => n.mainView.scenePreview(...l), r.fillSceneSnapshot = (...l) => n.mainView.fillSceneSnapshot(...l), r.generateScreenshot = (...l) => n.mainView.generateScreenshot(...l), r.setMemberState = (...l) => n.mainView.setMemberState(...l), r.redo = () => n.redo(), r.undo = () => n.undo(), r.cleanCurrentScene = () => n.cleanCurrentScene(), r.delete = () => n.delete(), r.copy = () => n.copy(), r.paste = () => n.paste(), r.duplicate = () => n.duplicate(), r.insertImage = (...l) => n.insertImage(...l), r.completeImageUpload = (...l) => n.completeImageUpload(...l), r.insertText = (...l) => n.insertText(...l), r.lockImage = (...l) => n.lockImage(...l), r.lockImages = (...l) => n.lockImages(...l), J_(r, n);
  }
}, J_ = (r, n) => {
  const o = r.removeScenes;
  r.removeScenes = (l, h) => {
    var y;
    l === Cr && ((y = n.appManager) == null || y.updateRootDirRemoving(!0));
    const m = o.call(r, l);
    return tt.emit("removeScenes", { scenePath: l, index: h }), m;
  };
}, q_ = (r) => {
  const n = r.seekToProgressTime;
  async function o(l) {
    await tt.emit("seekStart");
    const h = await n.call(r, l);
    return tt.emit("seek", l), h;
  }
  r.seekToProgressTime = o;
};
var K_ = Object.defineProperty, eP = Object.defineProperties, tP = Object.getOwnPropertyDescriptors, RT = Object.getOwnPropertySymbols, nP = Object.prototype.hasOwnProperty, iP = Object.prototype.propertyIsEnumerable, DT = (r, n, o) => n in r ? K_(r, n, { enumerable: !0, configurable: !0, writable: !0, value: o }) : r[n] = o, KM = (r, n) => {
  for (var o in n || (n = {}))
    nP.call(n, o) && DT(r, o, n[o]);
  if (RT)
    for (var o of RT(n))
      iP.call(n, o) && DT(r, o, n[o]);
  return r;
}, eE = (r, n) => eP(r, tP(n)), rP = /* @__PURE__ */ (() => `.netless-app-docs-viewer-content{position:relative;height:100%;overflow:hidden}.netless-app-docs-viewer-preview-mask{display:block;position:absolute;z-index:200;top:0;left:0;width:100%;height:100%}.netless-app-docs-viewer-preview{display:flex;flex-direction:column;align-items:center;z-index:300;top:0;right:0;width:23%;padding:12px;box-shadow:-4.8px -3.2px 20px #20233826;transition:transform .4s;background:#f5f5fc;border-radius:4px;-webkit-box-shadow:-4.8px -3.2px 20px rgba(32,35,56,.15);height:100%;position:absolute}.netless-app-docs-viewer-preview-active .netless-app-docs-viewer-preview-mask{display:block}.netless-app-docs-viewer-preview-active .netless-app-docs-viewer-preview{transform:translate(0);opacity:1}.netless-app-docs-viewer-preview-head{display:flex;align-items:center;justify-content:space-between;width:100%;margin-bottom:10px}.netless-app-docs-viewer-preview-head>h3{color:#484c70;font-weight:400;font-size:14px;width:calc(100% - 20px);overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;white-space:nowrap}.netless-app-docs-viewer-preview-head .netless-app-docs-viewer-close{width:25px;height:25px;padding:0;outline:none;border:none;background:#fff;display:flex;justify-content:center;align-items:center;border-radius:100%;cursor:pointer}.netless-app-docs-viewer-preview-head .netless-app-docs-viewer-close button{width:22px;height:22px;padding:0;outline:none;border:none;background:center/cover no-repeat;background-image:url(./icons/close.svg)}.netless-app-docs-viewer-preview-page{position:relative;display:flex;width:100%;margin-bottom:10px;font-size:0;color:transparent;outline:none;border-radius:4px;transition:border-color .3s;user-select:none;align-items:flex-end}.netless-app-docs-viewer-preview-page>img{width:calc(90% - 10px);height:auto;box-sizing:border-box;border:2px solid rgba(0,0,0,.5);border-radius:2px;background-color:#fff}.netless-app-docs-viewer-preview-page>img.netless-app-docs-viewer-active{border-color:#ff5353}.netless-app-docs-viewer-preview-page-name{text-align:right;font-size:12px;color:#8d8fa6;user-select:none;margin-right:10px;width:5%}.netless-app-docs-viewer-footer{box-sizing:border-box;height:40px;display:flex;align-items:center;padding:0 16px;color:#191919;background:#ebecfa}.netless-app-docs-viewer-float-footer{width:100%;min-height:40px;position:absolute;left:0;bottom:0;z-index:2000;transition:opacity .4s;color:#191919}.netless-app-docs-viewer-footer-btn{box-sizing:border-box;width:26px;height:26px;font-size:0;margin:0;padding:3px;border:none;border-radius:4px;outline:none;color:currentColor;background:transparent;transition:background .4s;cursor:pointer;user-select:none;-webkit-tap-highlight-color:rgba(0,0,0,0);color:#8d8fa6}.netless-app-docs-viewer-footer-btn.netless-app-docs-viewer-footer-btn-disable{color:#c6c7d2;cursor:not-allowed}.netless-app-docs-viewer-footer-btn.netless-app-docs-viewer-footer-btn-disable .arrow{fill:#c6c7d2}.netless-app-docs-viewer-footer-btn .arrow{fill:#8d8fa6}.netless-app-docs-viewer-footer-btn:hover{background-color:#1b1f4d0a}@media (hover: none){.netless-app-docs-viewer-footer-btn:hover{background:transparent!important}}.netless-app-docs-viewer-footer-btn>svg{width:100%;height:100%}.netless-app-docs-viewer-footer-btn>svg:nth-of-type(2){display:none}.netless-app-docs-viewer-footer-btn.netless-app-docs-viewer-footer-btn-playing>svg:nth-of-type(1){display:none}.netless-app-docs-viewer-footer-btn.netless-app-docs-viewer-footer-btn-playing>svg:nth-of-type(2){display:initial}.netless-app-docs-viewer-hide{display:none}.netless-app-docs-viewer-page-jumps{flex:1;display:flex;justify-content:center;align-items:center;gap:8px}.netless-app-docs-viewer-page-number{font-size:14px;color:#8d8fa6;user-select:none;white-space:nowrap;word-break:keep-all}.netless-app-docs-viewer-page-number-input{border:none;outline:none;width:3em;margin:0;padding:0 2px;text-align:right;font-size:13px;line-height:1;font-weight:400;font-family:inherit;border-radius:2px;color:currentColor;background:transparent;transition:background .4s;user-select:text;-webkit-tap-highlight-color:rgba(0,0,0,0)}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-footer-btn{cursor:not-allowed}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-footer-btn:hover{background:transparent}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input{cursor:not-allowed}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input:hover,.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input:focus,.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input:active{background:transparent;box-shadow:none}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input:disabled{color:inherit}.netless-app-docs-viewer-readonly.netless-app-docs-viewer-float-footer{display:none}.telebox-color-scheme-dark .netless-app-docs-viewer-page-number-input{color:#a6a6a8}.telebox-color-scheme-dark .netless-app-docs-viewer-page-number-input:active,.telebox-color-scheme-dark .netless-app-docs-viewer-page-number-input:focus,.telebox-color-scheme-dark .netless-app-docs-viewer-page-number-input:hover{color:#222}.telebox-color-scheme-dark .netless-app-docs-viewer-footer{color:#a6a6a8;background:#2d2d33;border-top:none}.telebox-color-scheme-dark .netless-app-docs-viewer-footer-btn:hover{background:#212126}.telebox-color-scheme-dark .netless-app-docs-viewer-preview{background:rgba(50,50,50,.9)}.netless-app-docs-viewer-static-scrollbar{position:absolute;top:0;right:0;z-index:2147483647;width:8px;min-height:30px;margin:0;padding:0;border:none;outline:none;border-radius:4px;background:rgba(68,78,96,.4);box-shadow:1px 1px 8px #ffffffb3;opacity:0;transition:background .4s,opacity .4s 3s,transform .2s;user-select:none}.netless-app-docs-viewer-static-scrollbar.netless-app-docs-viewer-static-scrollbar-dragging{background:rgba(68,78,96,.6);opacity:1;transition:background .4s,opacity .4s 3s!important}.netless-app-docs-viewer-static-scrollbar:hover,.netless-app-docs-viewer-static-scrollbar:focus{background:rgba(68,78,96,.5)}.netless-app-docs-viewer-static-scrollbar:active{background:rgba(68,78,96,.6)}.netless-app-docs-viewer-content:hover .netless-app-docs-viewer-static-scrollbar{opacity:1;transition:background .4s,opacity .4s,transform .2s}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-static-scrollbar{display:none}.netless-app-docs-viewer-static-pages:hover .netless-app-docs-viewer-static-scrollbar{opacity:1;transition:background .4s,opacity .4s,transform .2s}.page-renderer-pages-container{position:relative;overflow:hidden}.page-renderer-page{position:absolute;top:0;left:0;background-position:center;background-size:cover;background-repeat:no-repeat}.page-renderer-pages-container.is-hwa .page-renderer-page{will-change:transform}.page-renderer-page-img{display:block;width:100%;height:auto;user-select:none}.netless-app-docs-viewer-static-pages{overflow:hidden;position:relative;height:100%;user-select:none}.netless-app-docs-viewer-static-page{display:block;width:100%;height:auto;user-select:none}.netless-app-docs-viewer-static-wb-view,.netless-app-docs-viewer-dynamic-wb-view{position:absolute;top:0;left:0;width:100%;height:100%;z-index:100;overflow:auto}.netless-app-docs-viewer-dynamic-wb-view .cursor-clicker .ppt-event-source{cursor:pointer}
`)();
const aP = (r, n, o, l) => {
  if (o === "length" || o === "prototype" || o === "arguments" || o === "caller")
    return;
  const h = Object.getOwnPropertyDescriptor(r, o), m = Object.getOwnPropertyDescriptor(n, o);
  !sP(h, m) && l || Object.defineProperty(r, o, m);
}, sP = function(r, n) {
  return r === void 0 || r.configurable || r.writable === n.writable && r.enumerable === n.enumerable && r.configurable === n.configurable && (r.writable || r.value === n.value);
}, oP = (r, n) => {
  const o = Object.getPrototypeOf(n);
  o !== Object.getPrototypeOf(r) && Object.setPrototypeOf(r, o);
}, lP = (r, n) => `/* Wrapped ${r}*/
${n}`, uP = Object.getOwnPropertyDescriptor(Function.prototype, "toString"), cP = Object.getOwnPropertyDescriptor(Function.prototype.toString, "name"), dP = (r, n, o) => {
  const l = o === "" ? "" : `with ${o.trim()}() `, h = lP.bind(null, l, n.toString());
  Object.defineProperty(h, "name", cP), Object.defineProperty(r, "toString", eE(KM({}, uP), { value: h }));
};
function fP(r, n, { ignoreNonConfigurable: o = !1 } = {}) {
  const { name: l } = r;
  for (const h of Reflect.ownKeys(n))
    aP(r, n, h, o);
  return oP(r, n), dP(r, n, l), r;
}
const hP = (r, n = {}) => {
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
  let y, g, S;
  const C = function(...I) {
    const A = this, z = () => {
      y = void 0, g && (clearTimeout(g), g = void 0), m && (S = r.apply(A, I));
    }, $ = () => {
      g = void 0, y && (clearTimeout(y), y = void 0), m && (S = r.apply(A, I));
    }, U = h && !y;
    return clearTimeout(y), y = setTimeout(z, o), l > 0 && l !== Number.Infinity && !g && (g = setTimeout($, l)), U && (S = r.apply(A, I)), S;
  };
  return fP(C, r), C.cancel = () => {
    y && (clearTimeout(y), y = void 0), g && (clearTimeout(g), g = void 0);
  }, C;
}, pP = "!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", mP = 87, vP = 20, kT = [], gP = () => {
  for (let r = 0; r < vP; r++)
    kT[r] = pP.charAt(Math.random() * mP);
  return kT.join("");
};
function tE(r) {
  try {
    return r();
  } catch (n) {
    console.error(n);
  }
}
class mg {
  constructor() {
    this.push = this.addDisposer, this.disposers = /* @__PURE__ */ new Map();
  }
  addDisposer(n, o = this.genUID()) {
    return this.flush(o), this.disposers.set(o, Array.isArray(n) ? yP(n) : n), o;
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
    this.disposers.forEach(tE), this.disposers.clear();
  }
  genUID() {
    let n;
    do
      n = gP();
    while (this.disposers.has(n));
    return n;
  }
}
function yP(r) {
  return () => r.forEach(tE);
}
var Nu = [], wP = function() {
  return Nu.some(function(r) {
    return r.activeTargets.length > 0;
  });
}, bP = function() {
  return Nu.some(function(r) {
    return r.skippedTargets.length > 0;
  });
}, NT = "ResizeObserver loop completed with undelivered notifications.", SP = function() {
  var r;
  typeof ErrorEvent == "function" ? r = new ErrorEvent("error", {
    message: NT
  }) : (r = document.createEvent("Event"), r.initEvent("error", !1, !1), r.message = NT), window.dispatchEvent(r);
}, lp;
(function(r) {
  r.BORDER_BOX = "border-box", r.CONTENT_BOX = "content-box", r.DEVICE_PIXEL_CONTENT_BOX = "device-pixel-content-box";
})(lp || (lp = {}));
var _u = function(r) {
  return Object.freeze(r);
}, xP = function() {
  function r(n, o) {
    this.inlineSize = n, this.blockSize = o, _u(this);
  }
  return r;
}(), nE = function() {
  function r(n, o, l, h) {
    return this.x = n, this.y = o, this.width = l, this.height = h, this.top = this.y, this.left = this.x, this.bottom = this.top + this.height, this.right = this.left + this.width, _u(this);
  }
  return r.prototype.toJSON = function() {
    var n = this, o = n.x, l = n.y, h = n.top, m = n.right, y = n.bottom, g = n.left, S = n.width, C = n.height;
    return { x: o, y: l, top: h, right: m, bottom: y, left: g, width: S, height: C };
  }, r.fromRect = function(n) {
    return new r(n.x, n.y, n.width, n.height);
  }, r;
}(), bS = function(r) {
  return r instanceof SVGElement && "getBBox" in r;
}, iE = function(r) {
  if (bS(r)) {
    var n = r.getBBox(), o = n.width, l = n.height;
    return !o && !l;
  }
  var h = r, m = h.offsetWidth, y = h.offsetHeight;
  return !(m || y || r.getClientRects().length);
}, _T = function(r) {
  var n, o;
  if (r instanceof Element)
    return !0;
  var l = (o = (n = r) === null || n === void 0 ? void 0 : n.ownerDocument) === null || o === void 0 ? void 0 : o.defaultView;
  return !!(l && r instanceof l.Element);
}, CP = function(r) {
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
}, ip = typeof window < "u" ? window : {}, Fv = /* @__PURE__ */ new WeakMap(), PT = /auto|scroll/, TP = /^tb|vertical/, MP = /msie|trident/i.test(ip.navigator && ip.navigator.userAgent), gs = function(r) {
  return parseFloat(r || "0");
}, Id = function(r, n, o) {
  return r === void 0 && (r = 0), n === void 0 && (n = 0), o === void 0 && (o = !1), new xP((o ? n : r) || 0, (o ? r : n) || 0);
}, zT = _u({
  devicePixelContentBoxSize: Id(),
  borderBoxSize: Id(),
  contentBoxSize: Id(),
  contentRect: new nE(0, 0, 0, 0)
}), rE = function(r, n) {
  if (n === void 0 && (n = !1), Fv.has(r) && !n)
    return Fv.get(r);
  if (iE(r))
    return Fv.set(r, zT), zT;
  var o = getComputedStyle(r), l = bS(r) && r.ownerSVGElement && r.getBBox(), h = !MP && o.boxSizing === "border-box", m = TP.test(o.writingMode || ""), y = !l && PT.test(o.overflowY || ""), g = !l && PT.test(o.overflowX || ""), S = l ? 0 : gs(o.paddingTop), C = l ? 0 : gs(o.paddingRight), I = l ? 0 : gs(o.paddingBottom), A = l ? 0 : gs(o.paddingLeft), z = l ? 0 : gs(o.borderTopWidth), $ = l ? 0 : gs(o.borderRightWidth), U = l ? 0 : gs(o.borderBottomWidth), q = l ? 0 : gs(o.borderLeftWidth), G = A + C, he = S + I, se = q + $, Z = z + U, ue = g ? r.offsetHeight - Z - r.clientHeight : 0, oe = y ? r.offsetWidth - se - r.clientWidth : 0, ke = h ? G + se : 0, Fe = h ? he + Z : 0, Pe = l ? l.width : gs(o.width) - ke - oe, Y = l ? l.height : gs(o.height) - Fe - ue, fe = Pe + G + oe + se, be = Y + he + ue + Z, ie = _u({
    devicePixelContentBoxSize: Id(Math.round(Pe * devicePixelRatio), Math.round(Y * devicePixelRatio), m),
    borderBoxSize: Id(fe, be, m),
    contentBoxSize: Id(Pe, Y, m),
    contentRect: new nE(A, S, Pe, Y)
  });
  return Fv.set(r, ie), ie;
}, aE = function(r, n, o) {
  var l = rE(r, o), h = l.borderBoxSize, m = l.contentBoxSize, y = l.devicePixelContentBoxSize;
  switch (n) {
    case lp.DEVICE_PIXEL_CONTENT_BOX:
      return y;
    case lp.BORDER_BOX:
      return h;
    default:
      return m;
  }
}, EP = function() {
  function r(n) {
    var o = rE(n);
    this.target = n, this.contentRect = o.contentRect, this.borderBoxSize = _u([o.borderBoxSize]), this.contentBoxSize = _u([o.contentBoxSize]), this.devicePixelContentBoxSize = _u([o.devicePixelContentBoxSize]);
  }
  return r;
}(), sE = function(r) {
  if (iE(r))
    return 1 / 0;
  for (var n = 0, o = r.parentNode; o; )
    n += 1, o = o.parentNode;
  return n;
}, IP = function() {
  var r = 1 / 0, n = [];
  Nu.forEach(function(y) {
    if (y.activeTargets.length !== 0) {
      var g = [];
      y.activeTargets.forEach(function(C) {
        var I = new EP(C.target), A = sE(C.target);
        g.push(I), C.lastReportedSize = aE(C.target, C.observedBox), A < r && (r = A);
      }), n.push(function() {
        y.callback.call(y.observer, g, y.observer);
      }), y.activeTargets.splice(0, y.activeTargets.length);
    }
  });
  for (var o = 0, l = n; o < l.length; o++) {
    var h = l[o];
    h();
  }
  return r;
}, OT = function(r) {
  Nu.forEach(function(o) {
    o.activeTargets.splice(0, o.activeTargets.length), o.skippedTargets.splice(0, o.skippedTargets.length), o.observationTargets.forEach(function(h) {
      h.isActive() && (sE(h.target) > r ? o.activeTargets.push(h) : o.skippedTargets.push(h));
    });
  });
}, AP = function() {
  var r = 0;
  for (OT(r); wP(); )
    r = IP(), OT(r);
  return bP() && SP(), r > 0;
}, xb, oE = [], RP = function() {
  return oE.splice(0).forEach(function(r) {
    return r();
  });
}, DP = function(r) {
  if (!xb) {
    var n = 0, o = document.createTextNode(""), l = { characterData: !0 };
    new MutationObserver(function() {
      return RP();
    }).observe(o, l), xb = function() {
      o.textContent = "" + (n ? n-- : n++);
    };
  }
  oE.push(r), xb();
}, kP = function(r) {
  DP(function() {
    requestAnimationFrame(r);
  });
}, tg = 0, NP = function() {
  return !!tg;
}, _P = 250, PP = { attributes: !0, characterData: !0, childList: !0, subtree: !0 }, LT = [
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
], BT = function(r) {
  return r === void 0 && (r = 0), Date.now() + r;
}, Cb = !1, zP = function() {
  function r() {
    var n = this;
    this.stopped = !0, this.listener = function() {
      return n.schedule();
    };
  }
  return r.prototype.run = function(n) {
    var o = this;
    if (n === void 0 && (n = _P), !Cb) {
      Cb = !0;
      var l = BT(n);
      kP(function() {
        var h = !1;
        try {
          h = AP();
        } finally {
          if (Cb = !1, n = l - BT(), !NP())
            return;
          h ? o.run(1e3) : n > 0 ? o.run(n) : o.start();
        }
      });
    }
  }, r.prototype.schedule = function() {
    this.stop(), this.run();
  }, r.prototype.observe = function() {
    var n = this, o = function() {
      return n.observer && n.observer.observe(document.body, PP);
    };
    document.body ? o() : ip.addEventListener("DOMContentLoaded", o);
  }, r.prototype.start = function() {
    var n = this;
    this.stopped && (this.stopped = !1, this.observer = new MutationObserver(this.listener), this.observe(), LT.forEach(function(o) {
      return ip.addEventListener(o, n.listener, !0);
    }));
  }, r.prototype.stop = function() {
    var n = this;
    this.stopped || (this.observer && this.observer.disconnect(), LT.forEach(function(o) {
      return ip.removeEventListener(o, n.listener, !0);
    }), this.stopped = !0);
  }, r;
}(), Jb = new zP(), jT = function(r) {
  !tg && r > 0 && Jb.start(), tg += r, !tg && Jb.stop();
}, OP = function(r) {
  return !bS(r) && !CP(r) && getComputedStyle(r).display === "inline";
}, LP = function() {
  function r(n, o) {
    this.target = n, this.observedBox = o || lp.CONTENT_BOX, this.lastReportedSize = {
      inlineSize: 0,
      blockSize: 0
    };
  }
  return r.prototype.isActive = function() {
    var n = aE(this.target, this.observedBox, !0);
    return OP(this.target) && (this.lastReportedSize = n), this.lastReportedSize.inlineSize !== n.inlineSize || this.lastReportedSize.blockSize !== n.blockSize;
  }, r;
}(), BP = function() {
  function r(n, o) {
    this.activeTargets = [], this.skippedTargets = [], this.observationTargets = [], this.observer = n, this.callback = o;
  }
  return r;
}(), $v = /* @__PURE__ */ new WeakMap(), VT = function(r, n) {
  for (var o = 0; o < r.length; o += 1)
    if (r[o].target === n)
      return o;
  return -1;
}, Qv = function() {
  function r() {
  }
  return r.connect = function(n, o) {
    var l = new BP(n, o);
    $v.set(n, l);
  }, r.observe = function(n, o, l) {
    var h = $v.get(n), m = h.observationTargets.length === 0;
    VT(h.observationTargets, o) < 0 && (m && Nu.push(h), h.observationTargets.push(new LP(o, l && l.box)), jT(1), Jb.schedule());
  }, r.unobserve = function(n, o) {
    var l = $v.get(n), h = VT(l.observationTargets, o), m = l.observationTargets.length === 1;
    h >= 0 && (m && Nu.splice(Nu.indexOf(l), 1), l.observationTargets.splice(h, 1), jT(-1));
  }, r.disconnect = function(n) {
    var o = this, l = $v.get(n);
    l.observationTargets.slice().forEach(function(h) {
      return o.unobserve(n, h.target);
    }), l.activeTargets.splice(0, l.activeTargets.length);
  }, r;
}(), jP = function() {
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
    if (!_T(n))
      throw new TypeError("Failed to execute 'observe' on 'ResizeObserver': parameter 1 is not of type 'Element");
    Qv.observe(this, n, o);
  }, r.prototype.unobserve = function(n) {
    if (arguments.length === 0)
      throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': 1 argument required, but only 0 present.");
    if (!_T(n))
      throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': parameter 1 is not of type 'Element");
    Qv.unobserve(this, n);
  }, r.prototype.disconnect = function() {
    Qv.disconnect(this);
  }, r.toString = function() {
    return "function ResizeObserver () { [polyfill code] }";
  }, r;
}();
function VP(r) {
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
function UP(r) {
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
function HP(r) {
  const n = "http://www.w3.org/2000/svg", o = document.createElementNS(n, "svg");
  o.setAttribute("class", `${r}-footer-icon-play`), o.setAttribute("viewBox", "0 0 500 500");
  const l = document.createElementNS(n, "path");
  return l.setAttribute("fill", "currentColor"), l.setAttribute("d", "M418.158 257.419L174.663 413.33c-6.017 3.919-15.708 3.772-21.291-.29-2.791-2.018-4.295-4.483-4.295-7.084V94.109c0-5.65 6.883-10.289 15.271-10.289 4.298 0 8.391 1.307 11.181 3.332l242.629 155.484c6.016 3.917 6.451 10.292.649 14.491-.216.154-.432.154-.649.292zM170.621 391.288l223.116-141.301L170.71 107.753l-.089 283.535z"), o.appendChild(l), o;
}
function WP(r) {
  const n = "http://www.w3.org/2000/svg", o = document.createElementNS(n, "svg");
  o.setAttribute("class", `${r}-footer-icon-pause`), o.setAttribute("viewBox", "0 0 500 500");
  const l = document.createElementNS(n, "path");
  return l.setAttribute("fill", "currentColor"), l.setAttribute("d", "M312.491 78.261c0-6.159 4.893-11.213 11.04-11.213 6.158 0 11.211 5.054 11.211 11.213v343.478c0 6.159-5.053 11.213-11.211 11.213-6.147 0-11.04-5.054-11.04-11.213V78.261zM165.257 78.261c0-6.159 4.893-11.213 11.04-11.213 6.158 0 11.211 5.054 11.211 11.213v343.478c0 6.159-5.053 11.213-11.211 11.213-6.147 0-11.04-5.054-11.04-11.213V78.261z"), o.appendChild(l), o;
}
const dl = typeof window < "u", lE = dl && !("onscroll" in window) || typeof navigator < "u" && /(gle|ing|ro)bot|crawl|spider/i.test(navigator.userAgent), uE = dl && "IntersectionObserver" in window, cE = dl && "classList" in document.createElement("p"), dE = dl && window.devicePixelRatio > 1, FP = {
  elements_selector: ".lazy",
  container: lE || dl ? document : null,
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
}, fE = (r) => Object.assign({}, FP, r), UT = function(r, n) {
  let o;
  const l = "LazyLoad::Initialized", h = new r(n);
  try {
    o = new CustomEvent(l, { detail: { instance: h } });
  } catch {
    o = document.createEvent("CustomEvent"), o.initCustomEvent(l, !1, !1, { instance: h });
  }
  window.dispatchEvent(o);
}, $P = (r, n) => {
  if (!!n)
    if (!n.length)
      UT(r, n);
    else
      for (let o = 0, l; l = n[o]; o += 1)
        UT(r, l);
}, go = "src", SS = "srcset", xS = "sizes", hE = "poster", fp = "llOriginalAttrs", pE = "data", CS = "loading", mE = "loaded", vE = "applied", QP = "entered", TS = "error", gE = "native", yE = "data-", wE = "ll-status", er = (r, n) => r.getAttribute(yE + n), ZP = (r, n, o) => {
  var l = yE + n;
  if (o === null) {
    r.removeAttribute(l);
    return;
  }
  r.setAttribute(l, o);
}, hp = (r) => er(r, wE), Ou = (r, n) => ZP(r, wE, n), vg = (r) => Ou(r, null), MS = (r) => hp(r) === null, YP = (r) => hp(r) === CS, GP = (r) => hp(r) === TS, ES = (r) => hp(r) === gE, XP = [CS, mE, vE, TS], JP = (r) => XP.indexOf(hp(r)) >= 0, fl = (r, n, o, l) => {
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
  if (cE) {
    r.classList.add(n);
    return;
  }
  r.className += (r.className ? " " : "") + n;
}, bs = (r, n) => {
  if (cE) {
    r.classList.remove(n);
    return;
  }
  r.className = r.className.replace(new RegExp("(^|\\s+)" + n + "(\\s+|$)"), " ").replace(/^\s+/, "").replace(/\s+$/, "");
}, qP = (r) => {
  r.llTempImage = document.createElement("IMG");
}, KP = (r) => {
  delete r.llTempImage;
}, bE = (r) => r.llTempImage, gg = (r, n) => {
  if (!n)
    return;
  const o = n._observer;
  !o || o.unobserve(r);
}, ez = (r) => {
  r.disconnect();
}, tz = (r, n, o) => {
  n.unobserve_entered && gg(r, o);
}, IS = (r, n) => {
  !r || (r.loadingCount += n);
}, nz = (r) => {
  !r || (r.toLoadCount -= 1);
}, SE = (r, n) => {
  !r || (r.toLoadCount = n);
}, iz = (r) => r.loadingCount > 0, rz = (r) => r.toLoadCount > 0, xE = (r) => {
  let n = [];
  for (let o = 0, l; l = r.children[o]; o += 1)
    l.tagName === "SOURCE" && n.push(l);
  return n;
}, AS = (r, n) => {
  const o = r.parentNode;
  if (!o || o.tagName !== "PICTURE")
    return;
  xE(o).forEach(n);
}, CE = (r, n) => {
  xE(r).forEach(n);
}, yg = [go], TE = [go, hE], up = [go, SS, xS], ME = [pE], wg = (r) => !!r[fp], EE = (r) => r[fp], IE = (r) => delete r[fp], Rd = (r, n) => {
  if (wg(r))
    return;
  const o = {};
  n.forEach((l) => {
    o[l] = r.getAttribute(l);
  }), r[fp] = o;
}, az = (r) => {
  wg(r) || (r[fp] = { backgroundImage: r.style.backgroundImage });
}, sz = (r, n, o) => {
  if (!o) {
    r.removeAttribute(n);
    return;
  }
  r.setAttribute(n, o);
}, zu = (r, n) => {
  if (!wg(r))
    return;
  const o = EE(r);
  n.forEach((l) => {
    sz(r, l, o[l]);
  });
}, oz = (r) => {
  if (!wg(r))
    return;
  const n = EE(r);
  r.style.backgroundImage = n.backgroundImage;
}, AE = (r, n, o) => {
  _d(r, n.class_applied), Ou(r, vE), o && (n.unobserve_completed && gg(r, n), fl(n.callback_applied, r, o));
}, RE = (r, n, o) => {
  _d(r, n.class_loading), Ou(r, CS), o && (IS(o, 1), fl(n.callback_loading, r, o));
}, cl = (r, n, o) => {
  !o || r.setAttribute(n, o);
}, HT = (r, n) => {
  cl(r, xS, er(r, n.data_sizes)), cl(r, SS, er(r, n.data_srcset)), cl(r, go, er(r, n.data_src));
}, lz = (r, n) => {
  AS(r, (o) => {
    Rd(o, up), HT(o, n);
  }), Rd(r, up), HT(r, n);
}, uz = (r, n) => {
  Rd(r, yg), cl(r, go, er(r, n.data_src));
}, cz = (r, n) => {
  CE(r, (o) => {
    Rd(o, yg), cl(o, go, er(o, n.data_src));
  }), Rd(r, TE), cl(r, hE, er(r, n.data_poster)), cl(r, go, er(r, n.data_src)), r.load();
}, dz = (r, n) => {
  Rd(r, ME), cl(r, pE, er(r, n.data_src));
}, fz = (r, n, o) => {
  const l = er(r, n.data_bg), h = er(r, n.data_bg_hidpi), m = dE && h ? h : l;
  !m || (r.style.backgroundImage = `url("${m}")`, bE(r).setAttribute(go, m), RE(r, n, o));
}, hz = (r, n, o) => {
  const l = er(r, n.data_bg_multi), h = er(r, n.data_bg_multi_hidpi), m = dE && h ? h : l;
  !m || (r.style.backgroundImage = m, AE(r, n, o));
}, pz = (r, n, o) => {
  const l = er(r, n.data_bg_set);
  if (!l)
    return;
  const h = l.split("|");
  let m = h.map((y) => `image-set(${y})`);
  r.style.backgroundImage = m.join(), r.style.backgroundImage === "" && (m = h.map((y) => `-webkit-image-set(${y})`), r.style.backgroundImage = m.join()), AE(r, n, o);
}, DE = {
  IMG: lz,
  IFRAME: uz,
  VIDEO: cz,
  OBJECT: dz
}, mz = (r, n) => {
  const o = DE[r.tagName];
  !o || o(r, n);
}, vz = (r, n, o) => {
  const l = DE[r.tagName];
  !l || (l(r, n), RE(r, n, o));
}, gz = ["IMG", "IFRAME", "VIDEO", "OBJECT"], yz = (r) => gz.indexOf(r.tagName) > -1, kE = (r, n) => {
  n && !iz(n) && !rz(n) && fl(r.callback_finish, n);
}, WT = (r, n, o) => {
  r.addEventListener(n, o), r.llEvLisnrs[n] = o;
}, wz = (r, n, o) => {
  r.removeEventListener(n, o);
}, RS = (r) => !!r.llEvLisnrs, bz = (r, n, o) => {
  RS(r) || (r.llEvLisnrs = {});
  const l = r.tagName === "VIDEO" ? "loadeddata" : "load";
  WT(r, l, n), WT(r, "error", o);
}, qb = (r) => {
  if (!RS(r))
    return;
  const n = r.llEvLisnrs;
  for (let o in n) {
    const l = n[o];
    wz(r, o, l);
  }
  delete r.llEvLisnrs;
}, NE = (r, n, o) => {
  KP(r), IS(o, -1), nz(o), bs(r, n.class_loading), n.unobserve_completed && gg(r, o);
}, Sz = (r, n, o, l) => {
  const h = ES(n);
  NE(n, o, l), _d(n, o.class_loaded), Ou(n, mE), fl(o.callback_loaded, n, l), h || kE(o, l);
}, xz = (r, n, o, l) => {
  const h = ES(n);
  NE(n, o, l), _d(n, o.class_error), Ou(n, TS), fl(o.callback_error, n, l), o.restore_on_error && zu(n, up), h || kE(o, l);
}, DS = (r, n, o) => {
  const l = bE(r) || r;
  if (RS(l))
    return;
  bz(l, (y) => {
    Sz(y, r, n, o), qb(l);
  }, (y) => {
    xz(y, r, n, o), qb(l);
  });
}, Cz = (r, n, o) => {
  qP(r), DS(r, n, o), az(r), fz(r, n, o), hz(r, n, o), pz(r, n, o);
}, Tz = (r, n, o) => {
  DS(r, n, o), vz(r, n, o);
}, kS = (r, n, o) => {
  yz(r) ? Tz(r, n, o) : Cz(r, n, o);
}, Mz = (r, n, o) => {
  r.setAttribute("loading", "lazy"), DS(r, n, o), mz(r, n), Ou(r, gE);
}, FT = (r) => {
  r.removeAttribute(go), r.removeAttribute(SS), r.removeAttribute(xS);
}, Ez = (r) => {
  AS(r, (n) => {
    FT(n);
  }), FT(r);
}, _E = (r) => {
  AS(r, (n) => {
    zu(n, up);
  }), zu(r, up);
}, Iz = (r) => {
  CE(r, (n) => {
    zu(n, yg);
  }), zu(r, TE), r.load();
}, Az = (r) => {
  zu(r, yg);
}, Rz = (r) => {
  zu(r, ME);
}, Dz = {
  IMG: _E,
  IFRAME: Az,
  VIDEO: Iz,
  OBJECT: Rz
}, kz = (r) => {
  const n = Dz[r.tagName];
  if (!n) {
    oz(r);
    return;
  }
  n(r);
}, Nz = (r, n) => {
  MS(r) || ES(r) || (bs(r, n.class_entered), bs(r, n.class_exited), bs(r, n.class_applied), bs(r, n.class_loading), bs(r, n.class_loaded), bs(r, n.class_error));
}, _z = (r, n) => {
  kz(r), Nz(r, n), vg(r), IE(r);
}, Pz = (r, n, o, l) => {
  !o.cancel_on_exit || !YP(r) || r.tagName === "IMG" && (qb(r), Ez(r), _E(r), bs(r, o.class_loading), IS(l, -1), vg(r), fl(o.callback_cancel, r, n, l));
}, zz = (r, n, o, l) => {
  const h = JP(r);
  Ou(r, QP), _d(r, o.class_entered), bs(r, o.class_exited), tz(r, o, l), fl(o.callback_enter, r, n, l), !h && kS(r, o, l);
}, Oz = (r, n, o, l) => {
  MS(r) || (_d(r, o.class_exited), Pz(r, n, o, l), fl(o.callback_exit, r, n, l));
}, Lz = ["IMG", "IFRAME", "VIDEO"], PE = (r) => r.use_native && "loading" in HTMLImageElement.prototype, Bz = (r, n, o) => {
  r.forEach((l) => {
    Lz.indexOf(l.tagName) !== -1 && Mz(l, n, o);
  }), SE(o, 0);
}, jz = (r) => r.isIntersecting || r.intersectionRatio > 0, Vz = (r) => ({
  root: r.container === document ? null : r.container,
  rootMargin: r.thresholds || r.threshold + "px"
}), Uz = (r, n, o) => {
  r.forEach((l) => jz(l) ? zz(l.target, l, n, o) : Oz(l.target, l, n, o));
}, Hz = (r, n) => {
  n.forEach((o) => {
    r.observe(o);
  });
}, Wz = (r, n) => {
  ez(r), Hz(r, n);
}, Fz = (r, n) => {
  !uE || PE(r) || (n._observer = new IntersectionObserver((o) => {
    Uz(o, r, n);
  }, Vz(r)));
}, zE = (r) => Array.prototype.slice.call(r), lg = (r) => r.container.querySelectorAll(r.elements_selector), $z = (r) => zE(r).filter(MS), Qz = (r) => GP(r), Zz = (r) => zE(r).filter(Qz), $T = (r, n) => $z(r || lg(n)), Yz = (r, n) => {
  Zz(lg(r)).forEach((l) => {
    bs(l, r.class_error), vg(l);
  }), n.update();
}, Gz = (r, n) => {
  !dl || (n._onlineHandler = () => {
    Yz(r, n);
  }, window.addEventListener("online", n._onlineHandler));
}, Xz = (r) => {
  !dl || window.removeEventListener("online", r._onlineHandler);
}, pp = function(r, n) {
  const o = fE(r);
  this._settings = o, this.loadingCount = 0, Fz(o, this), Gz(o, this), this.update(n);
};
pp.prototype = {
  update: function(r) {
    const n = this._settings, o = $T(r, n);
    if (SE(this, o.length), lE || !uE) {
      this.loadAll(o);
      return;
    }
    if (PE(n)) {
      Bz(o, n, this);
      return;
    }
    Wz(this._observer, o);
  },
  destroy: function() {
    this._observer && this._observer.disconnect(), Xz(this), lg(this._settings).forEach((r) => {
      IE(r);
    }), delete this._observer, delete this._settings, delete this._onlineHandler, delete this.loadingCount, delete this.toLoadCount;
  },
  loadAll: function(r) {
    const n = this._settings;
    $T(r, n).forEach((l) => {
      gg(l, this), kS(l, n, this);
    });
  },
  restoreAll: function() {
    const r = this._settings;
    lg(r).forEach((n) => {
      _z(n, r);
    });
  }
};
pp.load = (r, n) => {
  const o = fE(n);
  kS(r, o);
};
pp.resetStatus = (r) => {
  vg(r);
};
dl && $P(pp, window.lazyLoadOptions);
class OE {
  constructor({ context: n, readonly: o, box: l, pages: h, onNewPageIndex: m, onPlay: y }) {
    if (this.pageIndex = 0, this.namespace = "netless-app-docs-viewer", this.isShowPreview = !1, this.isSmallBox = !1, this.sideEffect = new mg(), h.length <= 0)
      throw new Error("[DocsViewer] Empty pages.");
    this.context = n, this.readonly = o, this.box = l, this.pages = h, this.onNewPageIndex = m, this.onPlay = y, this.onPageIndexChanged = () => {
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
    const m = this.$preview.getBoundingClientRect(), y = h == null ? void 0 : h.getBoundingClientRect();
    y.top >= m.top && y.bottom <= m.bottom || this.$preview.scrollTo({
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
      this.pages.forEach((y, g) => {
        var S;
        const C = (S = y.thumbnail) != null ? S : y.src.startsWith("ppt") ? void 0 : y.src;
        if (!C)
          return;
        const I = String(g), A = document.createElement("a");
        A.className = h + " " + this.wrapClassName(`preview-page-${g}`), A.setAttribute("href", "#"), A.dataset.pageIndex = I;
        const z = document.createElement("span");
        z.className = m, z.textContent = String(g + 1), z.dataset.pageIndex = I;
        const $ = document.createElement("img");
        $.width = y.width, $.height = y.height, $.dataset.src = C, $.dataset.pageIndex = I, A.appendChild(z), A.appendChild($), n.appendChild(A), $.classList.toggle(this.wrapClassName("active"), this.pageIndex == g);
      }), this.sideEffect.addEventListener(n, "click", (y) => {
        var g;
        if (this.readonly)
          return;
        const S = (g = y.target.dataset) == null ? void 0 : g.pageIndex;
        S && (y.preventDefault(), y.stopPropagation(), y.stopImmediatePropagation(), this.onNewPageIndex(Number(S)));
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
      const l = this.renderFooterBtn("btn-page-back", VP(this.namespace));
      if (this.sideEffect.addEventListener(l, "click", () => {
        this.readonly || this.onNewPageIndex(this.pageIndex - 1);
      }), o.appendChild(l), this.$btnPageBack = l, this.onPlay) {
        const S = this.renderFooterBtn("btn-page-play", HP(this.namespace), WP(this.namespace)), C = () => {
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
      const y = document.createElement("span");
      y.textContent = " / " + this.pages.length, h.appendChild(m), h.appendChild(y), o.appendChild(h);
      const g = this.renderFooterBtn("btn-page-next", UP(this.namespace));
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
    var o, l, h, m, y, g, S;
    this.isShowPreview = n != null ? n : !this.isShowPreview, console.log((o = this.context) == null ? void 0 : o.extendWrapper), this.$content.classList.toggle(this.wrapClassName("preview-active"), this.isShowPreview), this.isShowPreview ? ((l = this.context) != null && l.extendWrapper && ((m = (h = this.context) == null ? void 0 : h.extendWrapper) == null || m.appendChild(this.renderPreviewMask()), (g = (y = this.context) == null ? void 0 : y.extendWrapper) == null || g.appendChild(this.renderPreview()), this.context.extendWrapper.style.display = "block"), setTimeout(() => {
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
function QT(r) {
  return r.touches ? r.touches[0] : r;
}
function LE(r) {
  r.stopPropagation(), r.cancelable && r.preventDefault();
}
function BE(r) {
  if (!r)
    return !1;
  const n = r.tagName;
  return n === "INPUT" || n === "TEXTAREA" || n === "SELECT";
}
class Jz {
  constructor(n) {
    var o, l, h;
    this.velocity = 0, this.paused = !0, this._animationFrameID = null, this._loopTimestamp = 0, this.looper = (m) => {
      if (this.paused)
        return;
      let y = Math.floor((m - this._loopTimestamp) / 1e3 * 60) + 1;
      for (this._loopTimestamp = m; y-- > 0; )
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
class qz {
  constructor(n, o, l, h) {
    this.scale = 1, this.lastVisit = Date.now(), this.pageOffsetY = 0, this.pageOffsetX = 0, this.visible = !0, this.index = n, this.page = o, this.scale = l, this.pageOffsetX = (h - o.width) / 2;
    const m = document.createElement("div");
    m.className = "page-renderer-page", m.dataset.index = `${n}`, m.style.width = `${o.width * l}px`, m.style.height = `${o.height * l}px`, o.thumbnail && (m.style.backgroundImage = `url("${o.thumbnail}")`);
    const y = document.createElement("img");
    y.className = "page-renderer-page-img", y.width = o.width, y.height = o.height, y.src = o.src, m.appendChild(y), this.$page = m;
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
const Kz = window.requestIdleCallback || ((r) => window.setTimeout(r, 5e3)), eO = window.cancelIdleCallback || window.clearTimeout;
class tO {
  constructor(n, o, l) {
    this.pages = n, this.pagesIntrinsicWidth = o, this.scale = l, this.els = /* @__PURE__ */ new Map(), this.maxElCount = 200, this.gcTimer = null, this.gc = () => {
      if (this.gcTimer = null, this.els.size > this.maxElCount) {
        const h = [...this.els.values()].sort((m, y) => y.lastVisit - m.lastVisit);
        for (let m = Math.floor(this.maxElCount / 4); m < h.length; m++)
          this.els.delete(h[m].index);
      }
    };
  }
  getEl(n) {
    let o = this.els.get(n);
    return o || (o = new qz(n, this.pages[n], this.scale, this.pagesIntrinsicWidth), this.els.set(n, o)), o.lastVisit = Date.now(), this.els.size > this.maxElCount && this.gcTimer === null && (this.gcTimer = Kz(this.gc)), o;
  }
  setScale(n) {
    n !== this.scale && (this.scale = n, this.els.forEach((o) => o.setScale(n)));
  }
  destroy() {
    this.els.clear(), this.gcTimer !== null && (eO(this.gcTimer), this.gcTimer = null);
  }
}
class nO {
  constructor(n) {
    this._hwaTimeout = NaN, this._turnOffHWA = () => {
      window.clearTimeout(this._hwaTimeout), this._hwaTimeout = NaN, this.$pages.classList.toggle("is-hwa", !1);
    }, this.pagesScrollTop = n.pagesScrollTop || 0, this.containerWidth = n.containerWidth || 1, this.containerHeight = n.containerHeight || 1, this.pages = n.pages.map((m) => {
      if (m.thumbnail)
        return m;
      try {
        const y = new URL(m.src);
        return y.searchParams.set("x-oss-process", "image/resize,l_50"), eE(KM({}, m), { thumbnail: y.toString() });
      } catch (y) {
        return console.error(y), m;
      }
    });
    const o = Array(this.pages.length);
    let l = 1 / 0, h = 0;
    this.pagesIntrinsicHeight = this.pages.reduce((m, y, g) => (o[g] = m, y.width > h && (h = y.width), y.height <= l && (l = y.height), m + y.height), 0), this.pagesIntrinsicWidth = h, this.pagesMinHeight = l, this.pagesIntrinsicYs = o, this.scale = this._calcScale(), this.threshold = this._calcThreshold(), this.onPageIndexChanged = n.onPageIndexChanged, this.pageScrollIndex = 0, this.pagesScrollTop !== 0 && (this.pageScrollIndex = this.findScrollPageIndex(), this.onPageIndexChanged && this.pageScrollIndex > 0 && this.onPageIndexChanged(this.pageScrollIndex)), this.pageElManager = new tO(this.pages, h, this.scale), this.$pages = this.renderPages();
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
      for (let y = 0; y < this.$pages.children.length; y++) {
        const g = this.$pages.children[y], S = Number(g.dataset.index);
        S >= h && S <= m || (g.remove(), y--);
      }
      for (let y = h; y <= m; y++) {
        const g = this.pageElManager.getEl(y);
        g.$page.parentElement !== this.$pages && this.$pages.appendChild(g.$page), g.translateY(this.pagesIntrinsicYs[y] - this.pagesScrollTop);
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
const iO = 30;
class rO {
  constructor(n) {
    this.sideEffect = new mg(), this.pagesScrollTop = n.pagesScrollTop || 0, this.containerWidth = n.containerWidth || 1, this.containerHeight = n.containerHeight || 1, this.pagesWidth = n.pagesWidth || 1, this.pagesHeight = n.pagesHeight || 1, this.scale = this._calcScale(), this.scrollbarMinHeight = n.scrollbarMinHeight || iO, this.scrollbarHeight = this._calcScrollbarHeight(), this.readonly = n.readonly, this.wrapClassName = n.wrapClassName, this.onDragScroll = n.onDragScroll, this.$scrollbar = this.renderScrollbar();
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
      LE(l);
      const h = this.wrapClassName("scrollbar-dragging");
      n.classList.toggle(h, !0);
      const m = this.pagesScrollTop, { clientY: y } = QT(l), g = (C) => {
        if (this.readonly)
          return;
        const { clientY: I } = QT(C), A = (I - y) / this.scale;
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
const aO = window.ResizeObserver || jP, $h = 640;
class sO {
  constructor({
    context: n,
    whiteboardView: o,
    readonly: l,
    box: h,
    pages: m,
    pageScrollTop: y = 0,
    mountWhiteboard: g,
    onUserScroll: S,
    baseScenePath: C,
    appId: I
  }) {
    this.sideEffect = new mg(), this.userScrolling = !1, this.onNewPageIndex = (U) => {
      this.scrollToPage(U);
    }, this.toPdf = async () => {
      const U = document.createElement("canvas"), q = U.getContext("2d");
      if (!q || !this.baseScenePath) {
        this.reportProgress(100, null);
        return;
      }
      const G = this.whiteboardView.focusScenePath || `${this.baseScenePath}/1`, he = this.pages[0], { jsPDF: se } = await import("jspdf"), Z = new se({
        format: [he.width, he.height],
        orientation: he.width > he.height ? "l" : "p",
        compress: !0
      });
      for (const [oe, ke] of this.pages.entries()) {
        const { width: Fe, height: Pe, src: Y } = ke;
        U.width = Fe, U.height = Pe;
        const fe = Fe > Pe ? "l" : "p";
        oe > 0 && Z.addPage([Fe, Pe], fe);
        const be = await this.getBase64FromUrl(Y), ie = document.createElement("img");
        ie.src = be, await new Promise((Ue) => ie.onload = Ue), q.drawImage(ie, 0, 0);
        const ct = U.toDataURL("image/jpeg", 0.6);
        q.clearRect(0, 0, Fe, Pe);
        const Oe = {
          centerX: Fe / 2,
          centerY: Pe / 2 + oe * Pe,
          scale: 1
        }, ce = this.context.manager.windowManger;
        ce._appliancePlugin ? await ce._appliancePlugin.screenshotToCanvasAsync(q, G, Fe, Pe, Oe) : this.whiteboardView.screenshotToCanvas(q, G, Fe, Pe, Oe);
        const Ze = U.toDataURL("image/png");
        Z.addImage(ct, "JPEG", 0, 0, Fe, Pe, "", "FAST"), Z.addImage(Ze, "PNG", 0, 0, Fe, Pe, "", "FAST"), q.clearRect(0, 0, Fe, Pe), Math.ceil((oe + 1) / this.pages.length * 100) < 100 && this.reportProgress(Math.ceil((oe + 1) / this.pages.length * 100), null);
      }
      const ue = Z.output("arraybuffer");
      this.reportProgress(100, { pdf: ue, title: this.box.title });
    }, this.context = n, this.whiteboardView = o, this.readonly = l, this.box = h, this.pages = m, this.baseScenePath = C, this.appId = I, this.mountWhiteboard = g, this._onUserScroll = S;
    const A = this.debounce(() => {
      this.userScrolling = !1, this._onUserScroll && this._onUserScroll(this.pageRenderer.pagesScrollTop);
    }, { wait: 80 }, "debounce-updateUserScroll");
    this.updateUserScroll = () => {
      this.userScrolling = !0, A();
    }, this.viewer = new OE({
      context: n,
      readonly: l,
      box: h,
      pages: m,
      onNewPageIndex: this.onNewPageIndex
    });
    const { width: z, height: $ } = this.whiteboardView.size;
    this.pageRenderer = new nO({
      pagesScrollTop: y,
      pages: this.pages,
      containerWidth: z,
      containerHeight: $,
      onPageIndexChanged: this.viewer.setPageIndex.bind(this.viewer)
    }), this.scrollbar = new rO({
      pagesScrollTop: this.pageRenderer.pagesScrollTop,
      containerWidth: z,
      containerHeight: $,
      pagesWidth: this.pageRenderer.pagesIntrinsicWidth,
      pagesHeight: this.pageRenderer.pagesIntrinsicHeight,
      readonly: this.readonly,
      wrapClassName: this.wrapClassName.bind(this),
      onDragScroll: (U) => {
        this.pageScrollTo(U), this.updateUserScroll();
      }
    }), this.pageScrollStepper = new Jz({
      start: this.pageRenderer.pagesScrollTop,
      onStep: (U) => {
        this.pageScrollTo(U);
      }
    }), this.render();
  }
  mount() {
    this.viewer.mount(), this.setupScrollListener();
    const n = this.debounce(this.renderRatioHeight.bind(this), {
      wait: 80
    });
    return this.sideEffect.add(() => {
      const o = new aO(n);
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
      const l = 26 / $h, h = 26 / n, m = 26 / $h, y = 0, g = Math.max((l + m - (h + y)) / 2, 0);
      if (this.box.$titleBar) {
        const S = h + g;
        this.box.$titleBar.style.height = `${S * 100}%`;
      }
      if (this.box.$footer) {
        const S = y + g;
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
      LE(n), this.readonly || (this.pageScrollTo(this.pageRenderer.pagesScrollTop + n.deltaY), this.updateUserScroll());
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
      if (this.readonly || !this.box.focus || this.box.minimized || BE(n.target))
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
    const h = hP(n, o);
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
        const y = m.result;
        h(y);
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
class oO {
  constructor({ context: n, whiteboardView: o, box: l, pages: h }) {
    this.sideEffect = new mg(), this.onPlayPPT = () => {
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
    }, this.context = n, this.whiteboardView = o, this.box = l, this.pages = h, this.displayer = n.getDisplayer(), this.viewer = new OE({
      context: n,
      readonly: !n.getIsWritable(),
      box: l,
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
      const m = this.context.getInitScenePath(), y = (h = (l = this.context.getScenes()) == null ? void 0 : l[n]) == null ? void 0 : h.name;
      m && y && this.context.setScenePath(`${m}/${y}`), this.scaleDocsToFit();
    }
    if (n !== this.viewer.pageIndex && this.viewer.setPageIndex(n), o) {
      const m = this.context.getRoom();
      if (m) {
        const y = m.state.globalState.__pptState;
        m.setGlobalState({
          __pptState: y && {
            uuid: y.uuid,
            pageIndex: n,
            disableAutoPlay: y.disableAutoPlay
          }
        });
      }
    }
  }
  render() {
    this.viewer.$content.appendChild(this.renderMask()), this.viewer.$content.appendChild(this.renderWhiteboardView()), this.sideEffect.addEventListener(window, "keydown", (n) => {
      var o;
      if (this.box.focus && !BE(n.target))
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
const lO = "DocsViewer", Kb = {
  kind: lO,
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
    return n.mountStyles(rP), h[0].src.startsWith("ppt") ? cO(r, l, n, h) : uO(r, l, n, h);
  }
};
function uO(r, n, o, l) {
  var h;
  n.disableCameraTransform = !r.getIsWritable();
  const m = new sO({
    context: r,
    whiteboardView: n,
    readonly: !r.getIsWritable(),
    box: o,
    pages: l,
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
    r.dispatchAppEvent("pageStateChange", { index: y, length: l.length });
  }, r.dispatchAppEvent("pageStateChange", {
    index: m.viewer.pageIndex,
    length: l.length
  }), r.emitter.on("attributesUpdate", (y) => {
    y && y.pageScrollTop != null && m.syncPageScrollTop(y.pageScrollTop);
  }), r.emitter.on("writableChange", (y) => {
    m.setReadonly(!y), n.disableCameraTransform = !y;
  }), {
    viewer: () => m,
    position: () => {
      const y = m == null ? void 0 : m.viewer;
      if (y)
        return [y.pageIndex, m.pages.length];
    }
  };
}
function cO(r, n, o, l) {
  n.disableCameraTransform = !0;
  const h = new oO({
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
  }), r.mountView(h.$whiteboardView), r.isAddApp && n.callbacks.once("onSizeUpdated", ({ width: m, height: y }) => {
    if (l.length > 0 && o.state !== "maximized") {
      const { width: g, height: S } = l[0], I = S / g * m - y;
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
function jE(r) {
  return r && r.__esModule && Object.prototype.hasOwnProperty.call(r, "default") ? r.default : r;
}
var hl = { exports: {} }, Ot = {};
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var Tb, ZT;
function bg() {
  if (ZT)
    return Tb;
  ZT = 1;
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
      for (var y = {}, g = 0; g < 10; g++)
        y["_" + String.fromCharCode(g)] = g;
      var S = Object.getOwnPropertyNames(y).map(function(I) {
        return y[I];
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
  return Tb = h() ? Object.assign : function(m, y) {
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
  }, Tb;
}
/** @license React v16.14.0
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var YT;
function dO() {
  if (YT)
    return Ot;
  YT = 1;
  var r = bg(), n = typeof Symbol == "function" && Symbol.for, o = n ? Symbol.for("react.element") : 60103, l = n ? Symbol.for("react.portal") : 60106, h = n ? Symbol.for("react.fragment") : 60107, m = n ? Symbol.for("react.strict_mode") : 60108, y = n ? Symbol.for("react.profiler") : 60114, g = n ? Symbol.for("react.provider") : 60109, S = n ? Symbol.for("react.context") : 60110, C = n ? Symbol.for("react.forward_ref") : 60112, I = n ? Symbol.for("react.suspense") : 60113, A = n ? Symbol.for("react.memo") : 60115, z = n ? Symbol.for("react.lazy") : 60116, $ = typeof Symbol == "function" && Symbol.iterator;
  function U(D) {
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
      throw Error(U(85));
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
  var oe = { current: null }, ke = Object.prototype.hasOwnProperty, Fe = { key: !0, ref: !0, __self: !0, __source: !0 };
  function Pe(D, B, ee) {
    var Ce, ge = {}, it = null, Xe = null;
    if (B != null)
      for (Ce in B.ref !== void 0 && (Xe = B.ref), B.key !== void 0 && (it = "" + B.key), B)
        ke.call(B, Ce) && !Fe.hasOwnProperty(Ce) && (ge[Ce] = B[Ce]);
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
      return ee(Ce, D, B === "" ? "." + Ue(D, 0) : B), 1;
    if (it = 0, B = B === "" ? "." : B + ":", Array.isArray(D))
      for (var Xe = 0; Xe < D.length; Xe++) {
        ge = D[Xe];
        var Be = B + Ue(ge, Xe);
        it += Ze(ge, Be, ee, Ce);
      }
    else if (D === null || typeof D != "object" ? Be = null : (Be = $ && D[$] || D["@@iterator"], Be = typeof Be == "function" ? Be : null), typeof Be == "function")
      for (D = Be.call(D), Xe = 0; !(ge = D.next()).done; )
        ge = ge.value, Be = B + Ue(ge, Xe++), it += Ze(ge, Be, ee, Ce);
    else if (ge === "object")
      throw ee = "" + D, Error(U(31, ee === "[object Object]" ? "object with keys {" + Object.keys(D).join(", ") + "}" : ee, ""));
    return it;
  }
  function Se(D, B, ee) {
    return D == null ? 0 : Ze(D, "", B, ee);
  }
  function Ue(D, B) {
    return typeof D == "object" && D !== null && D.key != null ? be(D.key) : B.toString(36);
  }
  function Re(D, B) {
    D.func.call(D.context, B, D.count++);
  }
  function Qe(D, B, ee) {
    var Ce = D.result, ge = D.keyPrefix;
    D = D.func.call(D.context, B, D.count++), Array.isArray(D) ? Tt(D, Ce, ee, function(it) {
      return it;
    }) : D != null && (fe(D) && (D = Y(D, ge + (!D.key || B && B.key === D.key ? "" : ("" + D.key).replace(ie, "$&/") + "/") + ee)), Ce.push(D));
  }
  function Tt(D, B, ee, Ce, ge) {
    var it = "";
    ee != null && (it = ("" + ee).replace(ie, "$&/") + "/"), B = Oe(B, it, Ce, ge), Se(D, Qe, B), ce(B);
  }
  var Bt = { current: null };
  function Ge() {
    var D = Bt.current;
    if (D === null)
      throw Error(U(321));
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
      throw Error(U(143));
    return D;
  } }, Ot.Component = he, Ot.Fragment = h, Ot.Profiler = y, Ot.PureComponent = Z, Ot.StrictMode = m, Ot.Suspense = I, Ot.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = re, Ot.cloneElement = function(D, B, ee) {
    if (D == null)
      throw Error(U(267, D));
    var Ce = r({}, D.props), ge = D.key, it = D.ref, Xe = D._owner;
    if (B != null) {
      if (B.ref !== void 0 && (it = B.ref, Xe = oe.current), B.key !== void 0 && (ge = "" + B.key), D.type && D.type.defaultProps)
        var Be = D.type.defaultProps;
      for (dt in B)
        ke.call(B, dt) && !Fe.hasOwnProperty(dt) && (Ce[dt] = B[dt] === void 0 && Be !== void 0 ? Be[dt] : B[dt]);
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
var Lt = {}, Mb, GT;
function fO() {
  if (GT)
    return Mb;
  GT = 1;
  var r = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return Mb = r, Mb;
}
var Eb, XT;
function hO() {
  return XT || (XT = 1, Eb = Function.call.bind(Object.prototype.hasOwnProperty)), Eb;
}
var Ib, JT;
function VE() {
  if (JT)
    return Ib;
  JT = 1;
  var r = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var n = fO(), o = {}, l = hO();
    r = function(m) {
      var y = "Warning: " + m;
      typeof console < "u" && console.error(y);
      try {
        throw new Error(y);
      } catch {
      }
    };
  }
  function h(m, y, g, S, C) {
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
            A = m[I](y, I, S, g, null, n);
          } catch (U) {
            A = U;
          }
          if (A && !(A instanceof Error) && r(
            (S || "React class") + ": type specification of " + g + " `" + I + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof A + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
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
  }, Ib = h, Ib;
}
/** @license React v16.14.0
 * react.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var qT;
function pO() {
  return qT || (qT = 1, process.env.NODE_ENV !== "production" && function() {
    var r = bg(), n = VE(), o = "16.14.0", l = typeof Symbol == "function" && Symbol.for, h = l ? Symbol.for("react.element") : 60103, m = l ? Symbol.for("react.portal") : 60106, y = l ? Symbol.for("react.fragment") : 60107, g = l ? Symbol.for("react.strict_mode") : 60108, S = l ? Symbol.for("react.profiler") : 60114, C = l ? Symbol.for("react.provider") : 60109, I = l ? Symbol.for("react.context") : 60110, A = l ? Symbol.for("react.concurrent_mode") : 60111, z = l ? Symbol.for("react.forward_ref") : 60112, $ = l ? Symbol.for("react.suspense") : 60113, U = l ? Symbol.for("react.suspense_list") : 60120, q = l ? Symbol.for("react.memo") : 60115, G = l ? Symbol.for("react.lazy") : 60116, he = l ? Symbol.for("react.block") : 60121, se = l ? Symbol.for("react.fundamental") : 60117, Z = l ? Symbol.for("react.responder") : 60118, ue = l ? Symbol.for("react.scope") : 60119, oe = typeof Symbol == "function" && Symbol.iterator, ke = "@@iterator";
    function Fe(M) {
      if (M === null || typeof M != "object")
        return null;
      var _ = oe && M[oe] || M[ke];
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
        var xe = _.fileName, Ye = xe.replace(be, "");
        if (/^index\./.test(Ye)) {
          var je = xe.match(be);
          if (je) {
            var et = je[1];
            if (et) {
              var kt = et.replace(be, "");
              Ye = kt + "/" + Ye;
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
        case y:
          return "Fragment";
        case m:
          return "Portal";
        case S:
          return "Profiler";
        case g:
          return "StrictMode";
        case $:
          return "Suspense";
        case U:
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
          case he:
            return Ze(M.render);
          case G: {
            var _ = M, H = Oe(_);
            if (H)
              return Ze(H);
            break;
          }
        }
      return null;
    }
    var Se = {}, Ue = null;
    function Re(M) {
      Ue = M;
    }
    Se.getCurrentStack = null, Se.getStackAddendum = function() {
      var M = "";
      if (Ue) {
        var _ = Ze(Ue.type), H = Ue._owner;
        M += ie(_, Ue._source, H && Ze(H.type));
      }
      var X = Se.getCurrentStack;
      return X && (M += X() || ""), M;
    };
    var Qe = {
      current: !1
    }, Tt = {
      ReactCurrentDispatcher: Pe,
      ReactCurrentBatchConfig: Y,
      ReactCurrentOwner: fe,
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
          var et = 0, kt = "Warning: " + _.replace(/%s/g, function() {
            return H[et++];
          });
          throw new Error(kt);
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
    function He(M, _) {
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
      if (typeof M.ref == "string" && fe.current && M.__self && fe.current.stateNode !== M.__self) {
        var _ = Ze(fe.current.type);
        Jn[_] || (Ge('Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. This case cannot be automatically converted to an arrow function. We ask you to manually fix this case by using useRef() or createRef() instead. Learn more about using refs safely here: https://fb.me/react-strict-mode-string-ref', Ze(fe.current.type), M.ref), Jn[_] = !0);
      }
    }
    var ci = function(M, _, H, X, xe, Ye, je) {
      var et = {
        $$typeof: h,
        type: M,
        key: _,
        ref: H,
        props: je,
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
        value: X
      }), Object.defineProperty(et, "_source", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: xe
      }), Object.freeze && (Object.freeze(et.props), Object.freeze(et)), et;
    };
    function Mr(M, _, H) {
      var X, xe = {}, Ye = null, je = null, et = null, kt = null;
      if (_ != null) {
        Ne(_) && (je = _.ref, Sn(_)), st(_) && (Ye = "" + _.key), et = _.__self === void 0 ? null : _.__self, kt = _.__source === void 0 ? null : _.__source;
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
        Ye && He(xe, ii), je && jt(xe, ii);
      }
      return ci(M, Ye, je, et, kt, fe.current, xe);
    }
    function jn(M, _) {
      var H = ci(M.type, _, M.ref, M._self, M._source, M._owner, M.props);
      return H;
    }
    function Gr(M, _, H) {
      if (M == null)
        throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + M + ".");
      var X, xe = r({}, M.props), Ye = M.key, je = M.ref, et = M._self, kt = M._source, gn = M._owner;
      if (_ != null) {
        Ne(_) && (je = _.ref, gn = fe.current), st(_) && (Ye = "" + _.key);
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
      return ci(M.type, Ye, je, et, kt, gn, xe);
    }
    function Ui(M) {
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
          _ === "" ? Ta + qn(M, 0) : _
        ), 1;
      var je, et, kt = 0, gn = _ === "" ? Ta : _ + Ma;
      if (Array.isArray(M))
        for (var xn = 0; xn < M.length; xn++)
          je = M[xn], et = gn + qn(je, xn), kt += Ir(je, et, H, X);
      else {
        var Mn = Fe(M);
        if (typeof Mn == "function") {
          Mn === M.entries && (tr || Bt("Using Maps as children is deprecated and will be removed in a future major release. Consider converting children to an array of keyed ReactElements instead."), tr = !0);
          for (var ni = Mn.call(M), ii, So = 0; !(ii = ni.next()).done; )
            je = ii.value, et = gn + qn(je, So++), kt += Ir(je, et, H, X);
        } else if (xe === "object") {
          var ta = "";
          ta = " If you meant to render a collection of children, use an array instead." + Se.getStackAddendum();
          var ir = "" + M;
          throw Error("Objects are not valid as a React child (found: " + (ir === "[object Object]" ? "object with keys {" + Object.keys(M).join(", ") + "}" : ir) + ")." + ta);
        }
      }
      return kt;
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
    function Nt(M, _, H) {
      if (M == null)
        return M;
      var X = Cs(null, null, _, H);
      vn(M, Ia, X), Er(X);
    }
    function rn(M, _, H) {
      var X = M.result, xe = M.keyPrefix, Ye = M.func, je = M.context, et = Ye.call(je, _, M.count++);
      Array.isArray(et) ? Mi(et, X, H, function(kt) {
        return kt;
      }) : et != null && (Ui(et) && (et = jn(
        et,
        xe + (et.key && (!_ || _.key !== et.key) ? Ea(et.key) + "/" : "") + H
      )), X.push(et));
    }
    function Mi(M, _, H, X, xe) {
      var Ye = "";
      H != null && (Ye = Ea(H) + "/");
      var je = Cs(_, Ye, X, xe);
      vn(M, rn, je), Er(je);
    }
    function Nn(M, _, H) {
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
      return typeof M == "string" || typeof M == "function" || M === y || M === A || M === S || M === g || M === $ || M === U || typeof M == "object" && M !== null && (M.$$typeof === G || M.$$typeof === q || M.$$typeof === C || M.$$typeof === I || M.$$typeof === z || M.$$typeof === se || M.$$typeof === Z || M.$$typeof === ue || M.$$typeof === he);
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
      if (fe.current) {
        var M = Ze(fe.current.type);
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
          M && M._owner && M._owner !== fe.current && (X = " It was passed a child from " + Ze(M._owner.type) + "."), Re(M), Ge('Each child in a list should have a unique "key" prop.%s%s See https://fb.me/react-warning-keys for more information.', H, X), Re(null);
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
          var xe = Fe(M);
          if (typeof xe == "function" && xe !== M.entries)
            for (var Ye = xe.call(M), je; !(je = Ye.next()).done; )
              Ui(je.value) && ti(je.value, _);
        }
      }
    }
    function Da(M) {
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
      var et = Mr.apply(this, arguments);
      if (et == null)
        return et;
      if (X)
        for (var kt = 2; kt < arguments.length; kt++)
          qt(arguments[kt], M);
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
      map: Nn,
      forEach: Nt,
      count: Ei,
      toArray: Kn,
      only: Jr
    };
    Lt.Children = gl, Lt.Component = ge, Lt.Fragment = y, Lt.Profiler = S, Lt.PureComponent = gt, Lt.StrictMode = g, Lt.Suspense = $, Lt.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Tt, Lt.cloneElement = vl, Lt.createContext = Aa, Lt.createElement = As, Lt.createFactory = Bu, Lt.createRef = Mt, Lt.forwardRef = wo, Lt.isValidElement = Ui, Lt.lazy = yo, Lt.memo = Ra, Lt.useCallback = Ms, Lt.useContext = Ar, Lt.useDebugValue = ne, Lt.useEffect = Vn, Lt.useImperativeHandle = Es, Lt.useLayoutEffect = nr, Lt.useMemo = Kr, Lt.useReducer = ei, Lt.useRef = Rr, Lt.useState = qr, Lt.version = o;
  }()), Lt;
}
(function(r) {
  process.env.NODE_ENV === "production" ? r.exports = dO() : r.exports = pO();
})(hl);
const wt = /* @__PURE__ */ jE(hl.exports);
var UE = { exports: {} }, Sr = {}, Ab = { exports: {} }, Rb = {};
/** @license React v0.19.1
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var KT;
function mO() {
  return KT || (KT = 1, function(r) {
    var n, o, l, h, m;
    if (typeof window > "u" || typeof MessageChannel != "function") {
      var y = null, g = null, S = function() {
        if (y !== null)
          try {
            var re = r.unstable_now();
            y(!0, re), y = null;
          } catch (D) {
            throw setTimeout(S, 0), D;
          }
      }, C = Date.now();
      r.unstable_now = function() {
        return Date.now() - C;
      }, n = function(re) {
        y !== null ? setTimeout(n, 0, re) : (y = re, setTimeout(S, 0));
      }, o = function(re, D) {
        g = setTimeout(re, D);
      }, l = function() {
        clearTimeout(g);
      }, h = function() {
        return !1;
      }, m = r.unstable_forceFrameRate = function() {
      };
    } else {
      var I = window.performance, A = window.Date, z = window.setTimeout, $ = window.clearTimeout;
      if (typeof console < "u") {
        var U = window.cancelAnimationFrame;
        typeof window.requestAnimationFrame != "function" && console.error("This browser doesn't support requestAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"), typeof U != "function" && console.error("This browser doesn't support cancelAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills");
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
      var oe = new MessageChannel(), ke = oe.port2;
      oe.port1.onmessage = function() {
        if (he !== null) {
          var re = r.unstable_now();
          ue = re + Z;
          try {
            he(!0, re) ? ke.postMessage(null) : (G = !1, he = null);
          } catch (D) {
            throw ke.postMessage(null), D;
          }
        } else
          G = !1;
      }, n = function(re) {
        he = re, G || (G = !0, ke.postMessage(null));
      }, o = function(re, D) {
        se = z(function() {
          re(r.unstable_now());
        }, D);
      }, l = function() {
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
    var be = [], ie = [], ct = 1, Oe = null, ce = 3, Ze = !1, Se = !1, Ue = !1;
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
    function Qe(re) {
      if (Ue = !1, Re(re), !Se)
        if (Pe(be) !== null)
          Se = !0, n(Tt);
        else {
          var D = Pe(ie);
          D !== null && o(Qe, D.startTime - re);
        }
    }
    function Tt(re, D) {
      Se = !1, Ue && (Ue = !1, l()), Ze = !0;
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
      return B = Ce + B, re = { id: ct++, callback: D, priorityLevel: re, startTime: Ce, expirationTime: B, sortIndex: -1 }, Ce > ee ? (re.sortIndex = Ce, Fe(ie, re), Pe(be) === null && re === Pe(ie) && (Ue ? l() : Ue = !0, o(Qe, Ce - ee))) : (re.sortIndex = B, Fe(be, re), Se || Ze || (Se = !0, n(Tt))), re;
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
  }(Rb)), Rb;
}
var Db = {};
/** @license React v0.19.1
 * scheduler.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var eM;
function vO() {
  return eM || (eM = 1, function(r) {
    process.env.NODE_ENV !== "production" && function() {
      var n = !1, o = !0, l, h, m, y, g;
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
        }, y = function() {
          return !1;
        }, g = r.unstable_forceFrameRate = function() {
        };
      } else {
        var z = window.performance, $ = window.Date, U = window.setTimeout, q = window.clearTimeout;
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
        var Z = !1, ue = null, oe = -1, ke = 5, Fe = 0;
        y = function() {
          return r.unstable_now() >= Fe;
        }, g = function() {
        }, r.unstable_forceFrameRate = function(ne) {
          if (ne < 0 || ne > 125) {
            console.error("forceFrameRate takes a positive int between 0 and 125, forcing framerates higher than 125 fps is not unsupported");
            return;
          }
          ne > 0 ? ke = Math.floor(1e3 / ne) : ke = 5;
        };
        var Pe = function() {
          if (ue !== null) {
            var ne = r.unstable_now();
            Fe = ne + ke;
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
        Y.port1.onmessage = Pe, l = function(ne) {
          ue = ne, Z || (Z = !0, fe.postMessage(null));
        }, h = function(ne, de) {
          oe = U(function() {
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
      var Se = 0, Ue = 1, Re = 2, Qe = 3, Tt = 4, Bt = 5, Ge = 0, re = 0, D = 4, B = typeof SharedArrayBuffer == "function" ? new SharedArrayBuffer(D * Int32Array.BYTES_PER_ELEMENT) : typeof ArrayBuffer == "function" ? new ArrayBuffer(D * Int32Array.BYTES_PER_ELEMENT) : null, ee = B !== null ? new Int32Array(B) : [], Ce = 0, ge = 1, it = 2, Xe = 3;
      ee[Ce] = Se, ee[Xe] = 0, ee[ge] = 0;
      var Be = 131072, dt = 524288, gt = 0, Zt = null, Mt = null, bn = 0, Ft = 1, Vi = 2, Ci = 3, Jn = 4, Ne = 5, st = 6, He = 7, jt = 8;
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
      function Ta(ne, de) {
        ee[Ce] = Se, ee[ge] = 0, ee[Xe]--, Mt !== null && Sn([Ci, de * 1e3, ne.id]);
      }
      function Ma(ne, de) {
        Ge++, ee[Ce] = ne.priorityLevel, ee[ge] = ne.id, ee[it] = Ge, Mt !== null && Sn([Ne, de * 1e3, ne.id, Ge]);
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
      var Ea = 1073741823, Ti = -1, Xr = 250, Cs = 5e3, Er = 1e4, Ir = Ea, vn = [], qn = [], Ia = 1, Nt = null, rn = Qe, Mi = !1, Nn = !1, Ei = !1;
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
        if (Ei = !1, Kn(ne), !Nn)
          if (ie(vn) !== null)
            Nn = !0, l(Aa);
          else {
            var de = ie(qn);
            de !== null && h(Jr, de.startTime - ne);
          }
      }
      function Aa(ne, de) {
        fi(de), Nn = !1, Ei && (Ei = !1, m()), Mi = !0;
        var Je = rn;
        try {
          if (o)
            try {
              return yo(ne, de);
            } catch (Yt) {
              if (Nt !== null) {
                var pt = r.unstable_now();
                Ta(Nt, pt), Nt.isQueued = !1;
              }
              throw Yt;
            }
        } finally {
          Nt = null, rn = Je, Mi = !1;
          {
            var Jt = r.unstable_now();
            tr(Jt);
          }
        }
      }
      function yo(ne, de) {
        var Je = de;
        for (Kn(Je), Nt = ie(vn); Nt !== null && !n && !(Nt.expirationTime > Je && (!ne || y())); ) {
          var pt = Nt.callback;
          if (pt !== null) {
            Nt.callback = null, rn = Nt.priorityLevel;
            var Jt = Nt.expirationTime <= Je;
            Ma(Nt, Je);
            var Yt = pt(Jt);
            Je = r.unstable_now(), typeof Yt == "function" ? (Nt.callback = Yt, di(Nt, Je)) : (Gr(Nt, Je), Nt.isQueued = !1, Nt === ie(vn) && ct(vn)), Kn(Je);
          } else
            ct(vn);
          Nt = ie(vn);
        }
        if (Nt !== null)
          return !0;
        var fn = ie(qn);
        return fn !== null && h(Jr, fn.startTime - Je), !1;
      }
      function wo(ne, de) {
        switch (ne) {
          case Ue:
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
          case Ue:
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
          case Ue:
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
          id: Ia++,
          callback: de,
          priorityLevel: ne,
          startTime: Jt,
          expirationTime: ti,
          sortIndex: -1
        };
        return qt.isQueued = !1, Jt > pt ? (qt.sortIndex = Jt, be(qn, qt), ie(vn) === null && qt === ie(qn) && (Ei ? m() : Ei = !0, h(Jr, Jt - pt))) : (qt.sortIndex = ti, be(vn, qt), jn(qt, pt), qt.isQueued = !0, !Nn && !Mi && (Nn = !0, l(Aa))), qt;
      }
      function qr() {
      }
      function ei() {
        !Nn && !Mi && (Nn = !0, l(Aa));
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
        return de !== Nt && Nt !== null && de !== null && de.callback !== null && de.startTime <= ne && de.expirationTime < Nt.expirationTime || y();
      }
      var Kr = g, Es = {
        startLoggingProfilingEvents: ci,
        stopLoggingProfilingEvents: Mr,
        sharedProfilingBuffer: B
      };
      r.unstable_IdlePriority = Bt, r.unstable_ImmediatePriority = Ue, r.unstable_LowPriority = Tt, r.unstable_NormalPriority = Qe, r.unstable_Profiling = Es, r.unstable_UserBlockingPriority = Re, r.unstable_cancelCallback = Vn, r.unstable_continueExecution = ei, r.unstable_getCurrentPriorityLevel = nr, r.unstable_getFirstCallbackNode = Rr, r.unstable_next = Ts, r.unstable_pauseExecution = qr, r.unstable_requestPaint = Kr, r.unstable_runWithPriority = wo, r.unstable_scheduleCallback = Ar, r.unstable_shouldYield = Ms, r.unstable_wrapCallback = Ra;
    }();
  }(Db)), Db;
}
var tM;
function HE() {
  return tM || (tM = 1, function(r) {
    process.env.NODE_ENV === "production" ? r.exports = mO() : r.exports = vO();
  }(Ab)), Ab.exports;
}
/** @license React v16.14.0
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var nM;
function gO() {
  if (nM)
    return Sr;
  nM = 1;
  var r = hl.exports, n = bg(), o = HE();
  function l(i) {
    for (var a = "https://reactjs.org/docs/error-decoder.html?invariant=" + i, c = 1; c < arguments.length; c++)
      a += "&args[]=" + encodeURIComponent(arguments[c]);
    return "Minified React error #" + i + "; visit " + a + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  if (!r)
    throw Error(l(227));
  function h(i, a, c, f, v, x, T, R, W) {
    var V = Array.prototype.slice.call(arguments, 3);
    try {
      a.apply(c, V);
    } catch (Me) {
      this.onError(Me);
    }
  }
  var m = !1, y = null, g = !1, S = null, C = { onError: function(i) {
    m = !0, y = i;
  } };
  function I(i, a, c, f, v, x, T, R, W) {
    m = !1, y = null, h.apply(C, arguments);
  }
  function A(i, a, c, f, v, x, T, R, W) {
    if (I.apply(this, arguments), m) {
      if (m) {
        var V = y;
        m = !1, y = null;
      } else
        throw Error(l(198));
      g || (g = !0, S = V);
    }
  }
  var z = null, $ = null, U = null;
  function q(i, a, c) {
    var f = i.type || "unknown-event";
    i.currentTarget = U(c), A(f, a, void 0, i), i.currentTarget = null;
  }
  var G = null, he = {};
  function se() {
    if (G)
      for (var i in he) {
        var a = he[i], c = G.indexOf(i);
        if (!(-1 < c))
          throw Error(l(96, i));
        if (!ue[c]) {
          if (!a.extractEvents)
            throw Error(l(97, i));
          ue[c] = a, c = a.eventTypes;
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
    ke[i] = a, Fe[i] = a.eventTypes[c].dependencies;
  }
  var ue = [], oe = {}, ke = {}, Fe = {};
  function Pe(i) {
    var a = !1, c;
    for (c in i)
      if (i.hasOwnProperty(c)) {
        var f = i[c];
        if (!he.hasOwnProperty(c) || he[c] !== f) {
          if (he[c])
            throw Error(l(102, c));
          he[c] = f, a = !0;
        }
      }
    a && se();
  }
  var Y = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), fe = null, be = null, ie = null;
  function ct(i) {
    if (i = $(i)) {
      if (typeof fe != "function")
        throw Error(l(280));
      var a = i.stateNode;
      a && (a = z(a), fe(i.stateNode, i.type, a));
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
  function Ue() {
  }
  var Re = Ze, Qe = !1, Tt = !1;
  function Bt() {
    (be !== null || ie !== null) && (Ue(), ce());
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
  var bn = /^(.*)[\\\/]/, Ft = typeof Symbol == "function" && Symbol.for, Vi = Ft ? Symbol.for("react.element") : 60103, Ci = Ft ? Symbol.for("react.portal") : 60106, Jn = Ft ? Symbol.for("react.fragment") : 60107, Ne = Ft ? Symbol.for("react.strict_mode") : 60108, st = Ft ? Symbol.for("react.profiler") : 60114, He = Ft ? Symbol.for("react.provider") : 60109, jt = Ft ? Symbol.for("react.context") : 60110, Sn = Ft ? Symbol.for("react.concurrent_mode") : 60111, ci = Ft ? Symbol.for("react.forward_ref") : 60112, Mr = Ft ? Symbol.for("react.suspense") : 60113, jn = Ft ? Symbol.for("react.suspense_list") : 60120, Gr = Ft ? Symbol.for("react.memo") : 60115, Ui = Ft ? Symbol.for("react.lazy") : 60116, Ta = Ft ? Symbol.for("react.block") : 60121, Ma = typeof Symbol == "function" && Symbol.iterator;
  function di(i) {
    return i === null || typeof i != "object" ? null : (i = Ma && i[Ma] || i["@@iterator"], typeof i == "function" ? i : null);
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
        case He:
          return "Context.Provider";
        case ci:
          var a = i.render;
          return a = a.displayName || a.name || "", i.displayName || (a !== "" ? "ForwardRef(" + a + ")" : "ForwardRef");
        case Gr:
          return fi(i.type);
        case Ta:
          return fi(i.render);
        case Ui:
          if (i = i._status === 1 ? i._result : null)
            return fi(i);
      }
    return null;
  }
  function Ea(i) {
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
  function Ia(i, a) {
    a = a.checked, a != null && Mt(i, "checked", a, !1);
  }
  function Nt(i, a) {
    Ia(i, a);
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
  function Nn(i) {
    var a = "";
    return r.Children.forEach(i, function(c) {
      c != null && (a += c);
    }), a;
  }
  function Ei(i, a) {
    return i = n({ children: void 0 }, a), (a = Nn(a.children)) && (i.children = a), i;
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
  function Aa(i, a) {
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
  function Ra(i) {
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
    return i == null || i === "http://www.w3.org/1999/xhtml" ? Ra(a) : i === "http://www.w3.org/2000/svg" && a === "foreignObject" ? "http://www.w3.org/1999/xhtml" : i;
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
  Y && (Ms = document.createElement("div").style, "AnimationEvent" in window || (delete Vn.animationend.animation, delete Vn.animationiteration.animation, delete Vn.animationstart.animation), "TransitionEvent" in window || delete Vn.transitionend.transition);
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
  function Da(i) {
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
    if (i = Da(i), !i)
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
    if (!Y)
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
      for (var R = null, W = 0; W < ue.length; W++) {
        var V = ue[W];
        V && (V = V.extractEvents(f, a, x, v, T)) && (R = an(R, V));
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
  var _, H, X, xe = !1, Ye = [], je = null, et = null, kt = null, gn = /* @__PURE__ */ new Map(), xn = /* @__PURE__ */ new Map(), Mn = [], ni = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput close cancel copy cut paste click change contextmenu reset submit".split(" "), ii = "focus blur dragenter dragleave mouseover mouseout pointerover pointerout gotpointercapture lostpointercapture".split(" ");
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
        et = null;
        break;
      case "mouseover":
      case "mouseout":
        kt = null;
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
        return et = xo(et, i, a, c, f, v), !0;
      case "mouseover":
        return kt = xo(kt, i, a, c, f, v), !0;
      case "pointerover":
        var x = v.pointerId;
        return gn.set(x, xo(gn.get(x) || null, i, a, c, f, v)), !0;
      case "gotpointercapture":
        return x = v.pointerId, xn.set(x, xo(xn.get(x) || null, i, a, c, f, v)), !0;
    }
    return !1;
  }
  function Sg(i) {
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
    var a = Nr(i.topLevelType, i.eventSystemFlags, i.container, i.nativeEvent);
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
      var a = Nr(i.topLevelType, i.eventSystemFlags, i.container, i.nativeEvent);
      a !== null ? i.blockedOn = a : Ye.shift();
    }
    je !== null && Dr(je) && (je = null), et !== null && Dr(et) && (et = null), kt !== null && Dr(kt) && (kt = null), gn.forEach(vp), xn.forEach(vp);
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
    for (je !== null && Rs(je, i), et !== null && Rs(et, i), kt !== null && Rs(kt, i), gn.forEach(a), xn.forEach(a), c = 0; c < Mn.length; c++)
      f = Mn[c], f.blockedOn === i && (f.blockedOn = null);
    for (; 0 < Mn.length && (c = Mn[0], c.blockedOn === null); )
      Sg(c), c.blockedOn === null && Mn.shift();
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
        f = kr.bind(null, a, 1, i);
        break;
      default:
        f = ri.bind(null, a, 1, i);
    }
    c ? i.addEventListener(a, f, !0) : i.addEventListener(a, f, !1);
  }
  function Co(i, a, c, f) {
    Qe || Ue();
    var v = ri, x = Qe;
    Qe = !0;
    try {
      Se(v, i, a, c, f);
    } finally {
      (Qe = x) || Bt();
    }
  }
  function kr(i, a, c, f) {
    yl(na, ri.bind(null, i, a, c, f));
  }
  function ri(i, a, c, f) {
    if (ka)
      if (0 < Ye.length && -1 < ni.indexOf(i))
        i = ta(null, i, a, c, f), Ye.push(i);
      else {
        var v = Nr(i, a, c, f);
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
  function Nr(i, a, c, f) {
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
    a = Fe[a];
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
  function xg(i) {
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
  function ks(i) {
    hn(i, xg);
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
  var Ju = hi.extend({ data: null }), Rp = hi.extend({ data: null }), ar = [9, 13, 27, 32], sr = Y && "CompositionEvent" in window, ai = null;
  Y && "documentMode" in document && (ai = document.documentMode);
  var Na = Y && "TextEvent" in window && !ai, qu = Y && (!sr || ai && 8 < ai && 11 >= ai), Ml = String.fromCharCode(32), _a = { beforeInput: { phasedRegistrationNames: { bubbled: "onBeforeInput", captured: "onBeforeInputCapture" }, dependencies: ["compositionend", "keypress", "textInput", "paste"] }, compositionEnd: { phasedRegistrationNames: { bubbled: "onCompositionEnd", captured: "onCompositionEndCapture" }, dependencies: "blur compositionend keydown keypress keyup mousedown".split(" ") }, compositionStart: { phasedRegistrationNames: {
    bubbled: "onCompositionStart",
    captured: "onCompositionStartCapture"
  }, dependencies: "blur compositionstart keydown keypress keyup mousedown".split(" ") }, compositionUpdate: { phasedRegistrationNames: { bubbled: "onCompositionUpdate", captured: "onCompositionUpdateCapture" }, dependencies: "blur compositionupdate keydown keypress keyup mousedown".split(" ") } }, Cg = !1;
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
  function Ns(i) {
    return i = i.detail, typeof i == "object" && "data" in i ? i.data : null;
  }
  var Pa = !1;
  function Dp(i, a) {
    switch (i) {
      case "compositionend":
        return Ns(a);
      case "keypress":
        return a.which !== 32 ? null : (Cg = !0, Ml);
      case "textInput":
        return i = a.data, i === Ml && Cg ? null : i;
      default:
        return null;
    }
  }
  function Ku(i, a) {
    if (Pa)
      return i === "compositionend" || !sr && El(i, a) ? (i = Cl(), Xu = Gu = ra = null, Pa = !1, i) : null;
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
  var Xd = { eventTypes: _a, extractEvents: function(i, a, c, f) {
    var v;
    if (sr)
      e: {
        switch (i) {
          case "compositionstart":
            var x = _a.compositionStart;
            break e;
          case "compositionend":
            x = _a.compositionEnd;
            break e;
          case "compositionupdate":
            x = _a.compositionUpdate;
            break e;
        }
        x = void 0;
      }
    else
      Pa ? El(i, c) && (x = _a.compositionEnd) : i === "keydown" && c.keyCode === 229 && (x = _a.compositionStart);
    return x ? (qu && c.locale !== "ko" && (Pa || x !== _a.compositionStart ? x === _a.compositionEnd && Pa && (v = Cl()) : (ra = f, Gu = "value" in ra ? ra.value : ra.textContent, Pa = !0)), x = Ju.getPooled(
      x,
      a,
      c,
      f
    ), v ? x.data = v : (v = Ns(c), v !== null && (x.data = v)), ks(x), v = x) : v = null, (i = Na ? Dp(i, c) : Ku(i, c)) ? (a = Rp.getPooled(_a.beforeInput, a, c, f), a.data = i, ks(a)) : a = null, v === null ? a : a === null ? v : [v, a];
  } }, kp = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
  function Jd(i) {
    var a = i && i.nodeName && i.nodeName.toLowerCase();
    return a === "input" ? !!kp[i.type] : a === "textarea";
  }
  var qd = { change: { phasedRegistrationNames: { bubbled: "onChange", captured: "onChangeCapture" }, dependencies: "blur change click focus input keydown keyup selectionchange".split(" ") } };
  function Un(i, a, c) {
    return i = hi.getPooled(qd.change, i, a, c), i.type = "change", Oe(c), ks(i), i;
  }
  var _s = null, Ps = null;
  function ec(i) {
    ea(i);
  }
  function za(i) {
    var a = Hi(i);
    if (Ir(a))
      return i;
  }
  function Il(i, a) {
    if (i === "change")
      return a;
  }
  var Do = !1;
  Y && (Do = Lu("input") && (!document.documentMode || 9 < document.documentMode));
  function aa() {
    _s && (_s.detachEvent("onpropertychange", Al), Ps = _s = null);
  }
  function Al(i) {
    if (i.propertyName === "value" && za(Ps))
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
      return za(Ps);
  }
  function ef(i, a) {
    if (i === "click")
      return za(a);
  }
  function tf(i, a) {
    if (i === "input" || i === "change")
      return za(a);
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
  } }, zs = hi.extend({ view: null, detail: null }), Np = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
  function Dl(i) {
    var a = this.nativeEvent;
    return a.getModifierState ? a.getModifierState(i) : (i = Np[i]) ? !!a[i] : !1;
  }
  function Os() {
    return Dl;
  }
  var rf = 0, kl = 0, af = !1, tc = !1, Ls = zs.extend({ screenX: null, screenY: null, clientX: null, clientY: null, pageX: null, pageY: null, ctrlKey: null, shiftKey: null, altKey: null, metaKey: null, getModifierState: Os, button: null, buttons: null, relatedTarget: function(i) {
    return i.relatedTarget || (i.fromElement === i.srcElement ? i.toElement : i.fromElement);
  }, movementX: function(i) {
    if ("movementX" in i)
      return i.movementX;
    var a = rf;
    return rf = i.screenX, af ? i.type === "mousemove" ? i.screenX - a : 0 : (af = !0, 0);
  }, movementY: function(i) {
    if ("movementY" in i)
      return i.movementY;
    var a = kl;
    return kl = i.screenY, tc ? i.type === "mousemove" ? i.screenY - a : 0 : (tc = !0, 0);
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
      var W = Ls, V = Bs.mouseLeave, Me = Bs.mouseEnter, De = "mouse";
    else
      (i === "pointerout" || i === "pointerover") && (W = nc, V = Bs.pointerLeave, Me = Bs.pointerEnter, De = "pointer");
    if (i = T == null ? x : Hi(T), x = a == null ? x : Hi(a), V = W.getPooled(V, T, c, f), V.type = De + "leave", V.target = i, V.relatedTarget = x, c = W.getPooled(Me, a, c, f), c.type = De + "enter", c.target = x, c.relatedTarget = i, f = T, De = a, f && De)
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
      Yu(W[De], "bubbled", V);
    for (De = f.length; 0 < De--; )
      Yu(f[De], "captured", c);
    return (v & 64) === 0 ? [V] : [V, c];
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
  var Nl = Y && "documentMode" in document && 11 >= document.documentMode, zr = { select: { phasedRegistrationNames: { bubbled: "onSelect", captured: "onSelectCapture" }, dependencies: "blur contextmenu dragend focus keydown keyup mousedown mouseup selectionchange".split(" ") } }, Hn = null, Fi = null, si = null, Oa = !1;
  function ic(i, a) {
    var c = a.window === a ? a.document : a.nodeType === 9 ? a : a.ownerDocument;
    return Oa || Hn == null || Hn !== Hu(c) ? null : (c = Hn, "selectionStart" in c && Wu(c) ? c = { start: c.selectionStart, end: c.selectionEnd } : (c = (c.ownerDocument && c.ownerDocument.defaultView || window).getSelection(), c = { anchorNode: c.anchorNode, anchorOffset: c.anchorOffset, focusNode: c.focusNode, focusOffset: c.focusOffset }), si && sa(si, c) ? null : (si = c, i = hi.getPooled(zr.select, Fi, i, a), i.type = "select", i.target = Hn, ks(i), i));
  }
  var lf = { eventTypes: zr, extractEvents: function(i, a, c, f, v, x) {
    if (v = x || (f.window === f ? f.document : f.nodeType === 9 ? f : f.ownerDocument), !(x = !v)) {
      e: {
        v = Yt(v), x = Fe.onSelect;
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
        Oa = !0;
        break;
      case "contextmenu":
      case "mouseup":
      case "dragend":
        return Oa = !1, ic(c, f);
      case "selectionchange":
        if (Nl)
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
  }, Pl = zs.extend({ key: function(i) {
    if (i.key) {
      var a = La[i.key] || i.key;
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
    return a = i.getPooled(v, a, c, f), ks(a), a;
  } };
  if (G)
    throw Error(l(101));
  G = Array.prototype.slice.call("ResponderEventPlugin SimpleEventPlugin EnterLeaveEventPlugin ChangeEventPlugin SelectEventPlugin BeforeInputEventPlugin".split(" ")), se();
  var pf = Sl;
  z = xl, $ = pf, U = Hi, Pe({ SimpleEventPlugin: hf, EnterLeaveEventPlugin: sf, ChangeEventPlugin: nf, SelectEventPlugin: lf, BeforeInputEventPlugin: Xd });
  var ac = [], Ai = -1;
  function St(i) {
    0 > Ai || (i.current = ac[Ai], ac[Ai] = null, Ai--);
  }
  function sn(i, a) {
    Ai++, ac[Ai] = i.current, i.current = a;
  }
  var Or = {}, Pn = { current: Or }, En = { current: !1 }, Lr = Or;
  function Ba(i, a) {
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
  function ja() {
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
  function ko(i) {
    return i = (i = i.stateNode) && i.__reactInternalMemoizedMergedChildContext || Or, Lr = Pn.current, sn(Pn, i), sn(En, En.current), !0;
  }
  function Ol(i, a, c) {
    var f = i.stateNode;
    if (!f)
      throw Error(l(169));
    c ? (i = js(i, a, Lr), f.__reactInternalMemoizedMergedChildContext = i, St(En), St(Pn), sn(Pn, i)) : St(En), sn(En, c);
  }
  var mf = o.unstable_runWithPriority, No = o.unstable_scheduleCallback, oc = o.unstable_cancelCallback, lc = o.unstable_requestPaint, uc = o.unstable_now, vf = o.unstable_getCurrentPriorityLevel, Ll = o.unstable_ImmediatePriority, cc = o.unstable_UserBlockingPriority, dc = o.unstable_NormalPriority, gf = o.unstable_LowPriority, _o = o.unstable_IdlePriority, yf = {}, Tg = o.unstable_shouldYield, _p = lc !== void 0 ? lc : function() {
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
    return i = Cn(i), No(i, a, c);
  }
  function Vs(i) {
    return or === null ? (or = [i], ua = No(Ll, bf)) : or.push(i), yf;
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
        throw or !== null && (or = or.slice(i + 1)), No(Ll, Ri), c;
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
  var Va = { current: null }, Ua = null, $i = null, fc = null;
  function Sf() {
    fc = $i = Ua = null;
  }
  function xf(i) {
    var a = Va.current;
    St(Va), i.type._context._currentValue = a;
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
    Ua = i, fc = $i = null, i = i.dependencies, i !== null && i.firstContext !== null && (i.expirationTime >= a && (cr = !0), i.firstContext = null);
  }
  function Qi(i, a) {
    if (fc !== i && a !== !1 && a !== 0)
      if ((typeof a != "number" || a === 1073741823) && (fc = i, a = 1073741823), a = { context: i, observedBits: a, next: null }, $i === null) {
        if (Ua === null)
          throw Error(l(308));
        $i = a, Ua.dependencies = { expirationTime: 0, firstContext: a, responders: null };
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
  function Ha(i, a) {
    return i = { expirationTime: i, suspenseConfig: a, tag: 0, payload: null, callback: null, next: null }, i.next = i;
  }
  function Wa(i, a) {
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
      var W = v.baseState, V = 0, Me = null, De = null, mt = null;
      if (R !== null) {
        var Et = R;
        do {
          if (T = Et.expirationTime, T < f) {
            var Pi = { expirationTime: Et.expirationTime, suspenseConfig: Et.suspenseConfig, tag: Et.tag, payload: Et.payload, callback: Et.callback, next: null };
            mt === null ? (De = mt = Pi, Me = W) : mt = mt.next = Pi, T > V && (V = T);
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
      mt === null ? Me = W : mt.next = De, v.baseState = Me, v.baseQueue = mt, ql(V), i.expirationTime = V, i.memoizedState = W;
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
  var Fa = { isMounted: function(i) {
    return (i = i._reactInternalFiber) ? fn(i) === i : !1;
  }, enqueueSetState: function(i, a, c) {
    i = i._reactInternalFiber;
    var f = Ln(), v = Bl.suspense;
    f = Ja(f, i, v), v = Ha(f, v), v.payload = a, c != null && (v.callback = c), Wa(i, v), qa(i, f);
  }, enqueueReplaceState: function(i, a, c) {
    i = i._reactInternalFiber;
    var f = Ln(), v = Bl.suspense;
    f = Ja(f, i, v), v = Ha(f, v), v.tag = 1, v.payload = a, c != null && (v.callback = c), Wa(i, v), qa(i, f);
  }, enqueueForceUpdate: function(i, a) {
    i = i._reactInternalFiber;
    var c = Ln(), f = Bl.suspense;
    c = Ja(c, i, f), f = Ha(c, f), f.tag = 2, a != null && (f.callback = a), Wa(i, f), qa(i, c);
  } };
  function Op(i, a, c, f, v, x, T) {
    return i = i.stateNode, typeof i.shouldComponentUpdate == "function" ? i.shouldComponentUpdate(f, x, T) : a.prototype && a.prototype.isPureReactComponent ? !sa(c, f) || !sa(v, x) : !0;
  }
  function Lp(i, a, c) {
    var f = !1, v = Or, x = a.contextType;
    return typeof x == "object" && x !== null ? x = Qi(x) : (v = Qn(a) ? Lr : Pn.current, f = a.contextTypes, x = (f = f != null) ? Ba(i, v) : Or), a = new a(c, x), i.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = Fa, i.stateNode = a, a._reactInternalFiber = i, f && (i = i.stateNode, i.__reactInternalMemoizedUnmaskedChildContext = v, i.__reactInternalMemoizedMaskedChildContext = x), a;
  }
  function mc(i, a, c, f) {
    i = a.state, typeof a.componentWillReceiveProps == "function" && a.componentWillReceiveProps(c, f), typeof a.UNSAFE_componentWillReceiveProps == "function" && a.UNSAFE_componentWillReceiveProps(c, f), a.state !== i && Fa.enqueueReplaceState(a, a.state, null);
  }
  function jl(i, a, c, f) {
    var v = i.stateNode;
    v.props = c, v.state = i.memoizedState, v.refs = Us, hc(i);
    var x = a.contextType;
    typeof x == "object" && x !== null ? v.context = Qi(x) : (x = Qn(a) ? Lr : Pn.current, v.context = Ba(i, x)), zo(i, c, v, f), v.state = i.memoizedState, x = a.getDerivedStateFromProps, typeof x == "function" && (Oo(i, a, x, c), v.state = i.memoizedState), typeof a.getDerivedStateFromProps == "function" || typeof v.getSnapshotBeforeUpdate == "function" || typeof v.UNSAFE_componentWillMount != "function" && typeof v.componentWillMount != "function" || (a = v.state, typeof v.componentWillMount == "function" && v.componentWillMount(), typeof v.UNSAFE_componentWillMount == "function" && v.UNSAFE_componentWillMount(), a !== v.state && Fa.enqueueReplaceState(v, v.state, null), zo(i, c, v, f), v.state = i.memoizedState), typeof v.componentDidMount == "function" && (i.effectTag |= 4);
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
    function R(O, P, Q, le) {
      return P === null || P.tag !== 6 ? (P = Yf(Q, O.mode, le), P.return = O, P) : (P = v(P, Q), P.return = O, P);
    }
    function W(O, P, Q, le) {
      return P !== null && P.elementType === Q.type ? (le = v(P, Q.props), le.ref = Ul(O, P, Q), le.return = O, le) : (le = Hc(Q.type, Q.key, Q.props, null, O.mode, le), le.ref = Ul(O, P, Q), le.return = O, le);
    }
    function V(O, P, Q, le) {
      return P === null || P.tag !== 4 || P.stateNode.containerInfo !== Q.containerInfo || P.stateNode.implementation !== Q.implementation ? (P = Gf(Q, O.mode, le), P.return = O, P) : (P = v(P, Q.children || []), P.return = O, P);
    }
    function Me(O, P, Q, le, ye) {
      return P === null || P.tag !== 7 ? (P = fa(Q, O.mode, le, ye), P.return = O, P) : (P = v(P, Q), P.return = O, P);
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
    function mt(O, P, Q, le) {
      var ye = P !== null ? P.key : null;
      if (typeof Q == "string" || typeof Q == "number")
        return ye !== null ? null : R(O, P, "" + Q, le);
      if (typeof Q == "object" && Q !== null) {
        switch (Q.$$typeof) {
          case Vi:
            return Q.key === ye ? Q.type === Jn ? Me(O, P, Q.props.children, le, ye) : W(O, P, Q, le) : null;
          case Ci:
            return Q.key === ye ? V(O, P, Q, le) : null;
        }
        if (Vl(Q) || di(Q))
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
          case Vi:
            return O = O.get(le.key === null ? Q : le.key) || null, le.type === Jn ? Me(P, O, le.props.children, ye, le.key) : W(P, O, le, ye);
          case Ci:
            return O = O.get(le.key === null ? Q : le.key) || null, V(P, O, le, ye);
        }
        if (Vl(le) || di(le))
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
        i && qe && lt.alternate === null && a(O, qe), P = x(lt, P, bt), _e === null ? ye = lt : _e.sibling = lt, _e = lt, qe = un;
      }
      if (bt === Q.length)
        return c(O, qe), ye;
      if (qe === null) {
        for (; bt < Q.length; bt++)
          qe = De(O, Q[bt], le), qe !== null && (P = x(qe, P, bt), _e === null ? ye = qe : _e.sibling = qe, _e = qe);
        return ye;
      }
      for (qe = f(O, qe); bt < Q.length; bt++)
        un = Et(qe, O, bt, Q[bt], le), un !== null && (i && un.alternate !== null && qe.delete(un.key === null ? bt : un.key), P = x(un, P, bt), _e === null ? ye = un : _e.sibling = un, _e = un);
      return i && qe.forEach(function(ns) {
        return a(O, ns);
      }), ye;
    }
    function Fn(O, P, Q, le) {
      var ye = di(Q);
      if (typeof ye != "function")
        throw Error(l(150));
      if (Q = ye.call(Q), Q == null)
        throw Error(l(151));
      for (var _e = ye = null, qe = P, bt = P = 0, un = null, lt = Q.next(); qe !== null && !lt.done; bt++, lt = Q.next()) {
        qe.index > bt ? (un = qe, qe = null) : un = qe.sibling;
        var ns = mt(O, qe, lt.value, le);
        if (ns === null) {
          qe === null && (qe = un);
          break;
        }
        i && qe && ns.alternate === null && a(O, qe), P = x(ns, P, bt), _e === null ? ye = ns : _e.sibling = ns, _e = ns, qe = un;
      }
      if (lt.done)
        return c(O, qe), ye;
      if (qe === null) {
        for (; !lt.done; bt++, lt = Q.next())
          lt = De(O, lt.value, le), lt !== null && (P = x(lt, P, bt), _e === null ? ye = lt : _e.sibling = lt, _e = lt);
        return ye;
      }
      for (qe = f(O, qe); !lt.done; bt++, lt = Q.next())
        lt = Et(qe, O, bt, lt.value, le), lt !== null && (i && lt.alternate !== null && qe.delete(lt.key === null ? bt : lt.key), P = x(lt, P, bt), _e === null ? ye = lt : _e.sibling = lt, _e = lt);
      return i && qe.forEach(function(Ug) {
        return a(O, Ug);
      }), ye;
    }
    return function(O, P, Q, le) {
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
              Q.type === Jn ? (P = fa(Q.props.children, O.mode, le, Q.key), P.return = O, O = P) : (le = Hc(Q.type, Q.key, Q.props, null, O.mode, le), le.ref = Ul(O, P, Q), le.return = O, O = le);
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
              P = Gf(Q, O.mode, le), P.return = O, O = P;
            }
            return T(O);
        }
      if (typeof Q == "string" || typeof Q == "number")
        return Q = "" + Q, P !== null && P.tag === 6 ? (c(O, P.sibling), P = v(P, Q), P.return = O, O = P) : (c(O, P), P = Yf(Q, O.mode, le), P.return = O, O = P), T(O);
      if (Vl(Q))
        return Pi(O, P, Q, le);
      if (di(Q))
        return Fn(O, P, Q, le);
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
  var wc = Zt.ReactCurrentDispatcher, gi = Zt.ReactCurrentBatchConfig, Zn = 0, $t = null, on = null, ln = null, $a = !1;
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
    if (Zn = x, $t = a, a.memoizedState = null, a.updateQueue = null, a.expirationTime = 0, wc.current = i === null || i.memoizedState === null ? Mg : Eg, i = c(f, v), a.expirationTime === Zn) {
      x = 0;
      do {
        if (a.expirationTime = 0, !(25 > x))
          throw Error(l(301));
        x += 1, ln = on = null, a.updateQueue = null, wc.current = Ig, i = c(f, v);
      } while (a.expirationTime === Zn);
    }
    if (wc.current = Ic, a = on !== null && on.next !== null, Zn = 0, ln = on = $t = null, $a = !1, a)
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
  function Qa(i, a) {
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
        var V = W.expirationTime;
        if (V < Zn) {
          var Me = { expirationTime: W.expirationTime, suspenseConfig: W.suspenseConfig, action: W.action, eagerReducer: W.eagerReducer, eagerState: W.eagerState, next: null };
          R === null ? (T = R = Me, x = f) : R = R.next = Me, V > $t.expirationTime && ($t.expirationTime = V, ql(V));
        } else
          R !== null && (R = R.next = { expirationTime: 1073741823, suspenseConfig: W.suspenseConfig, action: W.action, eagerReducer: W.eagerReducer, eagerState: W.eagerState, next: null }), $f(V, W.suspenseConfig), f = W.eagerReducer === i ? W.eagerState : i(f, W.action);
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
    return typeof i == "function" && (i = i()), a.memoizedState = a.baseState = i, i = a.queue = { pending: null, dispatch: null, lastRenderedReducer: Qa, lastRenderedState: i }, i = i.dispatch = Ec.bind(null, $t, i), [a.memoizedState, i];
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
  function kf(i, a) {
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
  function Nf(i, a) {
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
    f = Ja(f, i, v), v = { expirationTime: f, suspenseConfig: v, action: c, eagerReducer: null, eagerState: null, next: null };
    var x = a.pending;
    if (x === null ? v.next = v : (v.next = x.next, x.next = v), a.pending = v, x = i.alternate, i === $t || x !== null && x === $t)
      $a = !0, v.expirationTime = Zn, $t.expirationTime = Zn;
    else {
      if (i.expirationTime === 0 && (x === null || x.expirationTime === 0) && (x = a.lastRenderedReducer, x !== null))
        try {
          var T = a.lastRenderedState, R = x(T, c);
          if (v.eagerReducer = x, v.eagerState = R, Ii(R, T))
            return;
        } catch {
        } finally {
        }
      qa(
        i,
        f
      );
    }
  }
  var Ic = { readContext: Qi, useCallback: Wn, useContext: Wn, useEffect: Wn, useImperativeHandle: Wn, useLayoutEffect: Wn, useMemo: Wn, useReducer: Wn, useRef: Wn, useState: Wn, useDebugValue: Wn, useResponder: Wn, useDeferredValue: Wn, useTransition: Wn }, Mg = { readContext: Qi, useCallback: Up, useContext: Qi, useEffect: jp, useImperativeHandle: function(i, a, c) {
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
  } }, Eg = { readContext: Qi, useCallback: Tc, useContext: Qi, useEffect: Zs, useImperativeHandle: Uo, useLayoutEffect: kf, useMemo: Nf, useReducer: Fl, useRef: Rf, useState: function() {
    return Fl(Qa);
  }, useDebugValue: Cc, useResponder: yc, useDeferredValue: function(i, a) {
    var c = Fl(Qa), f = c[0], v = c[1];
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
    var a = Fl(Qa), c = a[0];
    return a = a[1], [Tc(Mc.bind(null, a, i), [a, i]), c];
  } }, Ig = { readContext: Qi, useCallback: Tc, useContext: Qi, useEffect: Zs, useImperativeHandle: Uo, useLayoutEffect: kf, useMemo: Nf, useReducer: bc, useRef: Rf, useState: function() {
    return bc(Qa);
  }, useDebugValue: Cc, useResponder: yc, useDeferredValue: function(i, a) {
    var c = bc(Qa), f = c[0], v = c[1];
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
    var a = bc(Qa), c = a[0];
    return a = a[1], [Tc(Mc.bind(
      null,
      a,
      i
    ), [a, i]), c];
  } }, ur = null, Za = null, Ys = !1;
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
      var a = Za;
      if (a) {
        var c = a;
        if (!Wp(i, a)) {
          if (a = Mo(c.nextSibling), !a || !Wp(i, a)) {
            i.effectTag = i.effectTag & -1025 | 2, Ys = !1, ur = i;
            return;
          }
          Hp(ur, c);
        }
        ur = i, Za = Mo(a.firstChild);
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
      for (a = Za; a; )
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
                Za = Mo(i.nextSibling);
                break e;
              }
              a--;
            } else
              c !== Fu && c !== wl && c !== $u || a++;
          }
          i = i.nextSibling;
        }
        Za = null;
      }
    } else
      Za = ur ? Mo(i.stateNode.nextSibling) : null;
    return !0;
  }
  function Gt() {
    Za = ur = null, Ys = !1;
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
    return x = Ba(a, x), mi(a, v), c = Af(i, a, c, f, x, v), i !== null && !cr ? (a.updateQueue = i.updateQueue, a.effectTag &= -517, i.expirationTime <= v && (i.expirationTime = 0), ca(i, a, v)) : (a.effectTag |= 1, Di(i, a, c, v), a.child);
  }
  function Qp(i, a, c, f, v) {
    if (Qn(c)) {
      var x = !0;
      ko(a);
    } else
      x = !1;
    if (mi(a, v), a.stateNode === null)
      i !== null && (i.alternate = null, a.alternate = null, a.effectTag |= 2), Lp(a, c, f), jl(a, c, f, v), f = !0;
    else if (i === null) {
      var T = a.stateNode, R = a.memoizedProps;
      T.props = R;
      var W = T.context, V = c.contextType;
      typeof V == "object" && V !== null ? V = Qi(V) : (V = Qn(c) ? Lr : Pn.current, V = Ba(a, V));
      var Me = c.getDerivedStateFromProps, De = typeof Me == "function" || typeof T.getSnapshotBeforeUpdate == "function";
      De || typeof T.UNSAFE_componentWillReceiveProps != "function" && typeof T.componentWillReceiveProps != "function" || (R !== f || W !== V) && mc(a, T, f, V), vi = !1;
      var mt = a.memoizedState;
      T.state = mt, zo(a, f, T, v), W = a.memoizedState, R !== f || mt !== W || En.current || vi ? (typeof Me == "function" && (Oo(a, c, Me, f), W = a.memoizedState), (R = vi || Op(a, c, R, f, mt, W, V)) ? (De || typeof T.UNSAFE_componentWillMount != "function" && typeof T.componentWillMount != "function" || (typeof T.componentWillMount == "function" && T.componentWillMount(), typeof T.UNSAFE_componentWillMount == "function" && T.UNSAFE_componentWillMount()), typeof T.componentDidMount == "function" && (a.effectTag |= 4)) : (typeof T.componentDidMount == "function" && (a.effectTag |= 4), a.memoizedProps = f, a.memoizedState = W), T.props = f, T.state = W, T.context = V, f = R) : (typeof T.componentDidMount == "function" && (a.effectTag |= 4), f = !1);
    } else
      T = a.stateNode, pc(i, a), R = a.memoizedProps, T.props = a.type === a.elementType ? R : pi(a.type, R), W = T.context, V = c.contextType, typeof V == "object" && V !== null ? V = Qi(V) : (V = Qn(c) ? Lr : Pn.current, V = Ba(a, V)), Me = c.getDerivedStateFromProps, (De = typeof Me == "function" || typeof T.getSnapshotBeforeUpdate == "function") || typeof T.UNSAFE_componentWillReceiveProps != "function" && typeof T.componentWillReceiveProps != "function" || (R !== f || W !== V) && mc(a, T, f, V), vi = !1, W = a.memoizedState, T.state = W, zo(a, f, T, v), mt = a.memoizedState, R !== f || W !== mt || En.current || vi ? (typeof Me == "function" && (Oo(a, c, Me, f), mt = a.memoizedState), (Me = vi || Op(a, c, R, f, W, mt, V)) ? (De || typeof T.UNSAFE_componentWillUpdate != "function" && typeof T.componentWillUpdate != "function" || (typeof T.componentWillUpdate == "function" && T.componentWillUpdate(
        f,
        mt,
        V
      ), typeof T.UNSAFE_componentWillUpdate == "function" && T.UNSAFE_componentWillUpdate(f, mt, V)), typeof T.componentDidUpdate == "function" && (a.effectTag |= 4), typeof T.getSnapshotBeforeUpdate == "function" && (a.effectTag |= 256)) : (typeof T.componentDidUpdate != "function" || R === i.memoizedProps && W === i.memoizedState || (a.effectTag |= 4), typeof T.getSnapshotBeforeUpdate != "function" || R === i.memoizedProps && W === i.memoizedState || (a.effectTag |= 256), a.memoizedProps = f, a.memoizedState = mt), T.props = f, T.state = mt, T.context = V, f = Me) : (typeof T.componentDidUpdate != "function" || R === i.memoizedProps && W === i.memoizedState || (a.effectTag |= 4), typeof T.getSnapshotBeforeUpdate != "function" || R === i.memoizedProps && W === i.memoizedState || (a.effectTag |= 256), f = !1);
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
  function kc(i) {
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
  function Nc(i, a, c, f, v, x) {
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
          c = v, c === null ? (v = a.child, a.child = null) : (v = c.sibling, c.sibling = null), Nc(a, !1, v, c, x, a.lastEffect);
          break;
        case "backwards":
          for (c = null, v = a.child, a.child = null; v !== null; ) {
            if (i = v.alternate, i !== null && gc(i) === null) {
              a.child = v;
              break;
            }
            i = v.sibling, v.sibling = c, c = v, v = i;
          }
          Nc(a, !0, c, null, x, a.lastEffect);
          break;
        case "together":
          Nc(a, !1, null, null, void 0, a.lastEffect);
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
        var V = f[R];
        if (T = x != null ? x[R] : void 0, f.hasOwnProperty(R) && V !== T && (V != null || T != null))
          if (R === "style")
            if (T) {
              for (W in T)
                !T.hasOwnProperty(W) || V && V.hasOwnProperty(W) || (c || (c = {}), c[W] = "");
              for (W in V)
                V.hasOwnProperty(W) && T[W] !== V[W] && (c || (c = {}), c[W] = V[W]);
            } else
              c || (i || (i = []), i.push(R, c)), c = V;
          else
            R === "dangerouslySetInnerHTML" ? (V = V ? V.__html : void 0, T = T ? T.__html : void 0, V != null && T !== V && (i = i || []).push(R, V)) : R === "children" ? T === V || typeof V != "string" && typeof V != "number" || (i = i || []).push(R, "" + V) : R !== "suppressContentEditableWarning" && R !== "suppressHydrationWarning" && (ke.hasOwnProperty(R) ? (V != null && ia(v, R), i || T === V || (i = [])) : (i = i || []).push(R, V));
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
        return Qn(a.type) && ja(), null;
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
                Aa(f, x), ft("invalid", f), ia(c, "onChange");
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
            switch (T = c.nodeType === 9 ? c : c.ownerDocument, i === Cp && (i = Ra(v)), i === Cp ? v === "script" ? (i = T.createElement("div"), i.innerHTML = "<script><\/script>", i = i.removeChild(i.firstChild)) : typeof f.is == "string" ? i = T.createElement(v, { is: f.is }) : (i = T.createElement(v), v === "select" && (T = i, f.multiple ? T.multiple = !0 : f.size && (T.size = f.size))) : i = T.createElementNS(i, v), i[_r] = a, i[Eo] = f, Xp(i, a, !1, !1), a.stateNode = i, T = Bd(v, f), v) {
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
                Aa(
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
                var V = W[x];
                x === "style" ? Sp(i, V) : x === "dangerouslySetInnerHTML" ? (V = V ? V.__html : void 0, V != null && qr(i, V)) : x === "children" ? typeof V == "string" ? (v !== "textarea" || V !== "") && ei(i, V) : typeof V == "number" && ei(i, "" + V) : x !== "suppressContentEditableWarning" && x !== "suppressHydrationWarning" && x !== "autoFocus" && (ke.hasOwnProperty(x) ? V != null && ia(c, x) : V != null && Mt(i, x, V, T));
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
        return St(Kt), f = a.memoizedState, (a.effectTag & 64) !== 0 ? (a.expirationTime = c, a) : (c = f !== null, f = !1, i === null ? a.memoizedProps.fallback !== void 0 && Ac(a) : (v = i.memoizedState, f = v !== null, c || v === null || (v = i.child.sibling, v !== null && (x = a.firstEffect, x !== null ? (a.firstEffect = v, v.nextEffect = x) : (a.firstEffect = a.lastEffect = v, v.nextEffect = null), v.effectTag = 8))), c && !f && (a.mode & 2) !== 0 && (i === null && a.memoizedProps.unstable_avoidThisFallback !== !0 || (Kt.current & 1) !== 0 ? pn === Ya && (pn = Xl) : ((pn === Ya || pn === Xl) && (pn = Lc), dr !== 0 && ki !== null && (io(ki, Ut), Xf(ki, dr)))), (c || f) && (a.effectTag |= 4), null);
      case 4:
        return jo(), _c(a), null;
      case 10:
        return xf(a), null;
      case 17:
        return Qn(a.type) && ja(), null;
      case 19:
        if (St(Kt), f = a.memoizedState, f === null)
          return null;
        if (v = (a.effectTag & 64) !== 0, x = f.rendering, x === null) {
          if (v)
            Zl(f, !1);
          else if (pn !== Ya || i !== null && (i.effectTag & 64) !== 0)
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
  function Ag(i) {
    switch (i.tag) {
      case 1:
        Qn(i.type) && ja();
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
    return { value: i, source: a, stack: Ea(a) };
  }
  var Rg = typeof WeakSet == "function" ? WeakSet : Set;
  function Lf(i, a) {
    var c = a.source, f = a.stack;
    f === null && c !== null && (f = Ea(c)), c !== null && fi(c.type), a = a.value, i !== null && i.tag === 1 && fi(i.type);
    try {
      console.error(a);
    } catch (v) {
      setTimeout(function() {
        throw v;
      });
    }
  }
  function Dg(i, a) {
    try {
      a.props = i.memoizedProps, a.state = i.memoizedState, a.componentWillUnmount();
    } catch (c) {
      es(i, c);
    }
  }
  function qp(i) {
    var a = i.ref;
    if (a !== null)
      if (typeof a == "function")
        try {
          a(null);
        } catch (c) {
          es(i, c);
        }
      else
        a.current = null;
  }
  function kg(i, a) {
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
  function Ng(i, a, c) {
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
                  es(T, R);
                }
              }
              v = v.next;
            } while (v !== f);
          });
        }
        break;
      case 1:
        qp(a), c = a.stateNode, typeof c.componentWillUnmount == "function" && Dg(a, c);
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
          for (var R = i, W = f, V = c, Me = W; ; )
            if (jf(R, Me, V), Me.child !== null && Me.tag !== 4)
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
            for (c[Eo] = f, i === "input" && f.type === "radio" && f.name != null && Ia(c, f), Bd(i, v), a = Bd(i, f), v = 0; v < x.length; v += 2) {
              var T = x[v], R = x[v + 1];
              T === "style" ? Sp(c, R) : T === "dangerouslySetInnerHTML" ? qr(c, R) : T === "children" ? ei(c, R) : Mt(c, T, R, a);
            }
            switch (i) {
              case "input":
                Nt(c, f);
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
        if (c = a, a.memoizedState === null ? f = !1 : (f = !0, c = a.child, Ga = _t()), c !== null)
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
      c === null && (c = i.stateNode = new Rg()), a.forEach(function(f) {
        var v = Lg.bind(null, i, f);
        c.has(f) || (c.add(f), f.then(v, v));
      });
    }
  }
  var im = typeof WeakMap == "function" ? WeakMap : Map;
  function Js(i, a, c) {
    c = Ha(c, null), c.tag = 3, c.payload = { element: null };
    var f = a.value;
    return c.callback = function() {
      eo || (eo = !0, Wo = f), Lf(i, a);
    }, c;
  }
  function rm(i, a, c) {
    c = Ha(c, null), c.tag = 3;
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
  var _g = Math.ceil, Oc = Zt.ReactCurrentDispatcher, am = Zt.ReactCurrentOwner, zn = 0, Uf = 8, Zi = 16, jr = 32, Ya = 0, On = 1, sm = 2, Xl = 3, Lc = 4, Hf = 5, at = zn, ki = null, ot = null, Ut = 0, pn = Ya, qs = null, Ni = 1073741823, Ho = 1073741823, Vr = null, dr = 0, Ks = !1, Ga = 0, Bc = 500, Le = null, eo = !1, Wo = null, Yi = null, Jl = !1, Xa = null, Fo = 90, fr = null, $o = 0, Wf = null, jc = 0;
  function Ln() {
    return (at & (Zi | jr)) !== zn ? 1073741821 - (_t() / 10 | 0) : jc !== 0 ? jc : jc = 1073741821 - (_t() / 10 | 0);
  }
  function Ja(i, a, c) {
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
    return ki !== null && i === Ut && --i, i;
  }
  function qa(i, a) {
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
    return v !== null && (ki === v && (ql(a), pn === Lc && io(v, Ut)), Xf(v, a)), v;
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
      return a = Ln(), ts(i, a), _i(i), null;
    var c = Vc(i);
    if (c !== 0) {
      if (a = i.callbackNode, (at & (Zi | jr)) !== zn)
        throw Error(l(327));
      if (Qo(), i === ki && c === Ut || no(i, c), ot !== null) {
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
          switch (v = i.finishedWork = i.current.alternate, i.finishedExpirationTime = c, f = pn, ki = null, f) {
            case Ya:
            case On:
              throw Error(l(345));
            case sm:
              ts(i, 2 < c ? 2 : c);
              break;
            case Xl:
              if (io(i, c), f = i.lastSuspendedTime, c === f && (i.nextKnownPendingLevel = Kl(v)), Ni === 1073741823 && (v = Ga + Bc - _t(), 10 < v)) {
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
                i.timeoutHandle = Zu(Ka.bind(null, i), v);
                break;
              }
              Ka(i);
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
              if (Ho !== 1073741823 ? f = 10 * (1073741821 - Ho) - _t() : Ni === 1073741823 ? f = 0 : (f = 10 * (1073741821 - Ni) - 5e3, v = _t(), c = 10 * (1073741821 - c) - v, f = v - f, 0 > f && (f = 0), f = (120 > f ? 120 : 480 > f ? 480 : 1080 > f ? 1080 : 1920 > f ? 1920 : 3e3 > f ? 3e3 : 4320 > f ? 4320 : 1960 * _g(f / 1960)) - f, c < f && (f = c)), 10 < f) {
                i.timeoutHandle = Zu(Ka.bind(null, i), f);
                break;
              }
              Ka(i);
              break;
            case Hf:
              if (Ni !== 1073741823 && Vr !== null) {
                x = Ni;
                var T = Vr;
                if (f = T.busyMinDurationMs | 0, 0 >= f ? f = 0 : (v = T.busyDelayMs | 0, x = _t() - (10 * (1073741821 - x) - (T.timeoutMs | 0 || 5e3)), f = x <= v ? 0 : v + f - x), 10 < f) {
                  io(i, c), i.timeoutHandle = Zu(Ka.bind(null, i), f);
                  break;
                }
              }
              Ka(i);
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
    if (Qo(), i === ki && a === Ut || no(i, a), ot !== null) {
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
      i.finishedWork = i.current.alternate, i.finishedExpirationTime = a, ki = null, Ka(i), _i(i);
    }
    return null;
  }
  function Pg() {
    if (fr !== null) {
      var i = fr;
      fr = null, i.forEach(function(a, c) {
        ts(c, a), _i(c);
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
            f = f.type.childContextTypes, f != null && ja();
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
    ki = i, ot = hr(i.current, null), Ut = a, pn = Ya, qs = null, Ho = Ni = 1073741823, Vr = null, dr = 0, Ks = !1;
  }
  function cm(i, a) {
    do {
      try {
        if (Sf(), wc.current = Ic, $a)
          for (var c = $t.memoizedState; c !== null; ) {
            var f = c.queue;
            f !== null && (f.pending = null), c = c.next;
          }
        if (Zn = 0, ln = on = $t = null, $a = !1, ot === null || ot.return === null)
          return pn = On, qs = a, ot = null;
        e: {
          var v = i, x = ot.return, T = ot, R = a;
          if (a = Ut, T.effectTag |= 2048, T.firstEffect = T.lastEffect = null, R !== null && typeof R == "object" && typeof R.then == "function") {
            var W = R;
            if ((T.mode & 2) === 0) {
              var V = T.alternate;
              V ? (T.updateQueue = V.updateQueue, T.memoizedState = V.memoizedState, T.expirationTime = V.expirationTime) : (T.updateQueue = null, T.memoizedState = null);
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
    i < Ni && 2 < i && (Ni = i), a !== null && i < Ho && 2 < i && (Ho = i, Vr = a);
  }
  function ql(i) {
    i > dr && (dr = i);
  }
  function fm() {
    for (; ot !== null; )
      ot = Qf(ot);
  }
  function hm() {
    for (; ot !== null && !Tg(); )
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
        if (a = Ag(ot), a !== null)
          return a.effectTag &= 2047, a;
        i !== null && (i.firstEffect = i.lastEffect = null, i.effectTag |= 2048);
      }
      if (a = ot.sibling, a !== null)
        return a;
      ot = i;
    } while (ot !== null);
    return pn === Ya && (pn = Hf), null;
  }
  function Kl(i) {
    var a = i.expirationTime;
    return i = i.childExpirationTime, a > i ? a : i;
  }
  function Ka(i) {
    var a = lr();
    return xt(99, zg.bind(null, i, a)), null;
  }
  function zg(i, a) {
    do
      Qo();
    while (Xa !== null);
    if ((at & (Zi | jr)) !== zn)
      throw Error(l(327));
    var c = i.finishedWork, f = i.finishedExpirationTime;
    if (c === null)
      return null;
    if (i.finishedWork = null, i.finishedExpirationTime = 0, c === i.current)
      throw Error(l(177));
    i.callbackNode = null, i.callbackExpirationTime = 0, i.callbackPriority = 90, i.nextKnownPendingLevel = 0;
    var v = Kl(c);
    if (i.firstPendingTime = v, f <= i.lastSuspendedTime ? i.firstSuspendedTime = i.lastSuspendedTime = i.nextKnownPendingLevel = 0 : f <= i.firstSuspendedTime && (i.firstSuspendedTime = f - 1), f <= i.lastPingedTime && (i.lastPingedTime = 0), f <= i.lastExpiredTime && (i.lastExpiredTime = 0), i === ki && (ot = ki = null, Ut = 0), 1 < c.effectTag ? c.lastEffect !== null ? (c.lastEffect.nextEffect = c, v = c.firstEffect) : v = c : v = c.firstEffect, v !== null) {
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
              var V = W.anchorOffset, Me = W.focusNode;
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
                  for (var Q; O !== R || V !== 0 && O.nodeType !== 3 || (mt = De + V), O !== Me || W !== 0 && O.nodeType !== 3 || (Et = De + W), O.nodeType === 3 && (De += O.nodeValue.length), (Q = O.firstChild) !== null; )
                    P = O, O = Q;
                  for (; ; ) {
                    if (O === T)
                      break t;
                    if (P === R && ++Pi === V && (mt = De), P === Me && ++Fn === W && (Et = De), (Q = O.nextSibling) !== null)
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
          es(Le, lt), Le = Le.nextEffect;
        }
      while (Le !== null);
      Le = v;
      do
        try {
          for (T = i, R = a; Le !== null; ) {
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
                V = Le, zc(T, V, R), em(V);
            }
            Le = Le.nextEffect;
          }
        } catch (lt) {
          if (Le === null)
            throw Error(l(330));
          es(Le, lt), Le = Le.nextEffect;
        }
      while (Le !== null);
      if (_e = Fd, ye = Hd(), le = _e.focusedElem, R = _e.selectionRange, ye !== le && le && le.ownerDocument && Ud(le.ownerDocument.documentElement, le)) {
        for (R !== null && Wu(le) && (ye = R.start, _e = R.end, _e === void 0 && (_e = ye), "selectionStart" in le ? (le.selectionStart = ye, le.selectionEnd = Math.min(_e, le.value.length)) : (_e = (ye = le.ownerDocument || document) && ye.defaultView || window, _e.getSelection && (_e = _e.getSelection(), V = le.textContent.length, T = Math.min(R.start, V), R = R.end === void 0 ? T : Math.min(R.end, V), !_e.extend && T > R && (V = R, R = T, T = V), V = Vd(le, T), Me = Vd(le, R), V && Me && (_e.rangeCount !== 1 || _e.anchorNode !== V.node || _e.anchorOffset !== V.offset || _e.focusNode !== Me.node || _e.focusOffset !== Me.offset) && (ye = ye.createRange(), ye.setStart(V.node, V.offset), _e.removeAllRanges(), T > R ? (_e.addRange(ye), _e.extend(Me.node, Me.offset)) : (ye.setEnd(Me.node, Me.offset), _e.addRange(ye)))))), ye = [], _e = le; _e = _e.parentNode; )
          _e.nodeType === 1 && ye.push({
            element: _e,
            left: _e.scrollLeft,
            top: _e.scrollTop
          });
        for (typeof le.focus == "function" && le.focus(), le = 0; le < ye.length; le++)
          _e = ye[le], _e.element.scrollLeft = _e.left, _e.element.scrollTop = _e.top;
      }
      ka = !!Qu, Fd = Qu = null, i.current = c, Le = v;
      do
        try {
          for (le = i; Le !== null; ) {
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
            throw Error(l(330));
          es(Le, lt), Le = Le.nextEffect;
        }
      while (Le !== null);
      Le = null, _p(), at = x;
    } else
      i.current = c;
    if (Jl)
      Jl = !1, Xa = i, Fo = a;
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
      (i & 256) !== 0 && kg(Le.alternate, Le), (i & 512) === 0 || Jl || (Jl = !0, zp(97, function() {
        return Qo(), null;
      })), Le = Le.nextEffect;
    }
  }
  function Qo() {
    if (Fo !== 90) {
      var i = 97 < Fo ? 97 : Fo;
      return Fo = 90, xt(i, Og);
    }
  }
  function Og() {
    if (Xa === null)
      return !1;
    var i = Xa;
    if (Xa = null, (at & (Zi | jr)) !== zn)
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
        es(i, f);
      }
      c = i.nextEffect, i.nextEffect = null, i = c;
    }
    return at = a, Ri(), !0;
  }
  function vm(i, a, c) {
    a = Of(c, a), a = Js(i, a, 1073741823), Wa(i, a), i = to(i, 1073741823), i !== null && _i(i);
  }
  function es(i, a) {
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
            i = Of(a, i), i = rm(c, i, 1073741823), Wa(c, i), c = to(c, 1073741823), c !== null && _i(c);
            break;
          }
        }
        c = c.return;
      }
  }
  function gm(i, a, c) {
    var f = i.pingCache;
    f !== null && f.delete(a), ki === i && Ut === c ? pn === Lc || pn === Xl && Ni === 1073741823 && _t() - Ga < Bc ? no(i, Ut) : Ks = !0 : bm(i, c) && (a = i.lastPingedTime, a !== 0 && a < c || (i.lastPingedTime = c, _i(i)));
  }
  function Lg(i, a) {
    var c = i.stateNode;
    c !== null && c.delete(a), a = 0, a === 0 && (a = Ln(), a = Ja(a, i, null)), i = to(i, a), i !== null && _i(i);
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
              kc(a), Gt();
              break;
            case 5:
              if (Ef(a), a.mode & 4 && c !== 1 && v.hidden)
                return a.expirationTime = a.childExpirationTime = 1, null;
              break;
            case 1:
              Qn(a.type) && ko(a);
              break;
            case 4:
              vc(a, a.stateNode.containerInfo);
              break;
            case 10:
              f = a.memoizedProps.value, v = a.type._context, sn(Va, v._currentValue), v._currentValue = f;
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
        if (f = a.type, i !== null && (i.alternate = null, a.alternate = null, a.effectTag |= 2), i = a.pendingProps, v = Ba(a, Pn.current), mi(a, c), v = Af(
          null,
          a,
          f,
          i,
          v,
          c
        ), a.effectTag |= 1, typeof v == "object" && v !== null && typeof v.render == "function" && v.$$typeof === void 0) {
          if (a.tag = 1, a.memoizedState = null, a.updateQueue = null, Qn(f)) {
            var x = !0;
            ko(a);
          } else
            x = !1;
          a.memoizedState = v.state !== null && v.state !== void 0 ? v.state : null, hc(a);
          var T = f.getDerivedStateFromProps;
          typeof T == "function" && Oo(a, f, T, i), v.updater = Fa, a.stateNode = v, v._reactInternalFiber = a, jl(a, f, i, c), a = Pf(null, a, f, !0, x, c);
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
        if (kc(a), f = a.updateQueue, i === null || f === null)
          throw Error(l(282));
        if (f = a.pendingProps, v = a.memoizedState, v = v !== null ? v.element : null, pc(i, a), zo(a, f, null, c), f = a.memoizedState.element, f === v)
          Gt(), a = ca(i, a, c);
        else {
          if ((v = a.stateNode.hydrate) && (Za = Mo(a.stateNode.containerInfo.firstChild), ur = a, v = Ys = !0), v)
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
          if (sn(Va, R._currentValue), R._currentValue = x, T !== null)
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
                  for (var V = W.firstContext; V !== null; ) {
                    if (V.context === f && (V.observedBits & x) !== 0) {
                      R.tag === 1 && (V = Ha(c, null), V.tag = 2, Wa(R, V)), R.expirationTime < c && (R.expirationTime = c), V = R.alternate, V !== null && V.expirationTime < c && (V.expirationTime = c), Po(R.return, c), W.expirationTime < c && (W.expirationTime = c);
                      break;
                    }
                    V = V.next;
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
        return f = a.type, v = a.pendingProps, v = a.elementType === f ? v : pi(f, v), i !== null && (i.alternate = null, a.alternate = null, a.effectTag |= 2), a.tag = 1, Qn(f) ? (i = !0, ko(a)) : i = !1, mi(a, c), Lp(a, f, v), jl(a, f, v, c), Pf(
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
  function Bg(i) {
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
  function jg(i, a, c, f) {
    this.tag = i, this.key = c, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = a, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = f, this.effectTag = 0, this.lastEffect = this.firstEffect = this.nextEffect = null, this.childExpirationTime = this.expirationTime = 0, this.alternate = null;
  }
  function Ur(i, a, c, f) {
    return new jg(i, a, c, f);
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
                case Ui:
                  T = 16, f = null;
                  break e;
                case Ta:
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
  function ts(i, a) {
    var c = i.lastExpiredTime;
    (c === 0 || c > a) && (i.lastExpiredTime = a);
  }
  function nu(i, a, c, f) {
    var v = a.current, x = Ln(), T = Bl.suspense;
    x = Ja(x, v, T);
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
    return a.context === null ? a.context = c : a.pendingContext = c, a = Ha(x, T), a.payload = { element: i }, f = f === void 0 ? null : f, f !== null && (a.callback = f), Wa(v, a), qa(v, x), x;
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
          var V = Wc(T);
          R.call(V);
        };
      }
      nu(a, T, i, v);
    } else {
      if (x = c._reactRootContainer = qf(c, f), T = x._internalRoot, typeof v == "function") {
        var W = v;
        v = function() {
          var V = Wc(T);
          W.call(V);
        };
      }
      um(function() {
        nu(a, T, i, v);
      });
    }
    return Wc(T);
  }
  function Vg(i, a, c) {
    var f = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return { $$typeof: Ci, key: f == null ? null : "" + f, children: i, containerInfo: a, implementation: c };
  }
  _ = function(i) {
    if (i.tag === 13) {
      var a = Vt(Ln(), 150, 100);
      qa(i, a), iu(i, a);
    }
  }, H = function(i) {
    i.tag === 13 && (qa(i, 3), iu(i, 3));
  }, X = function(i) {
    if (i.tag === 13) {
      var a = Ln();
      a = Ja(a, i, null), qa(i, a), iu(i, a);
    }
  }, fe = function(i, a, c) {
    switch (a) {
      case "input":
        if (Nt(i, c), a = c.name, c.type === "radio" && a != null) {
          for (c = i; c.parentNode; )
            c = c.parentNode;
          for (c = c.querySelectorAll("input[name=" + JSON.stringify("" + a) + '][type="radio"]'), a = 0; a < c.length; a++) {
            var f = c[a];
            if (f !== i && f.form === i.form) {
              var v = xl(f);
              if (!v)
                throw Error(l(90));
              Ir(f), Nt(f, v);
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
  }, Ue = function() {
    (at & (1 | Zi | jr)) === zn && (Pg(), Qo());
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
    return Vg(i, a, null, c);
  }
  var NS = { Events: [Sl, Hi, xl, Pe, oe, ks, function(i) {
    hn(i, Zd);
  }, Oe, ce, ri, ea, Qo, { current: !1 }] };
  return function(i) {
    var a = i.findFiberByHostInstance;
    return Bg(n({}, i, { overrideHookState: null, overrideProps: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: Zt.ReactCurrentDispatcher, findHostInstanceByFiber: function(c) {
      return c = bo(c), c === null ? null : c.stateNode;
    }, findFiberByHostInstance: function(c) {
      return a ? a(c) : null;
    }, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null }));
  }({
    findFiberByHostInstance: Ao,
    bundleType: 0,
    version: "16.14.0",
    rendererPackageName: "react-dom"
  }), Sr.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = NS, Sr.createPortal = Sm, Sr.findDOMNode = function(i) {
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
var xr = {}, kb = { exports: {} }, Sa = {};
/** @license React v0.19.1
 * scheduler-tracing.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var iM;
function yO() {
  if (iM)
    return Sa;
  iM = 1;
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
var Nb = {};
/** @license React v0.19.1
 * scheduler-tracing.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var rM;
function wO() {
  return rM || (rM = 1, function(r) {
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
      function y() {
        return ++l;
      }
      function g(se, Z, ue) {
        var oe = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : n, ke = {
          __count: 1,
          id: o++,
          name: se,
          timestamp: Z
        }, Fe = r.__interactionsRef.current, Pe = new Set(Fe);
        Pe.add(ke), r.__interactionsRef.current = Pe;
        var Y = r.__subscriberRef.current, fe;
        try {
          Y !== null && Y.onInteractionTraced(ke);
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
                ke.__count--, Y !== null && ke.__count === 0 && Y.onInteractionScheduledWorkCompleted(ke);
              }
            }
          }
        }
        return fe;
      }
      function S(se) {
        var Z = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : n, ue = r.__interactionsRef.current, oe = r.__subscriberRef.current;
        oe !== null && oe.onWorkScheduled(ue, Z), ue.forEach(function(Pe) {
          Pe.__count++;
        });
        var ke = !1;
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
            ke || (ke = !0, ue.forEach(function(fe) {
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
          onWorkScheduled: U,
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
          } catch (ke) {
            Z || (Z = !0, ue = ke);
          }
        }), Z)
          throw ue;
      }
      function $(se) {
        var Z = !1, ue = null;
        if (C.forEach(function(oe) {
          try {
            oe.onInteractionScheduledWorkCompleted(se);
          } catch (ke) {
            Z || (Z = !0, ue = ke);
          }
        }), Z)
          throw ue;
      }
      function U(se, Z) {
        var ue = !1, oe = null;
        if (C.forEach(function(ke) {
          try {
            ke.onWorkScheduled(se, Z);
          } catch (Fe) {
            ue || (ue = !0, oe = Fe);
          }
        }), ue)
          throw oe;
      }
      function q(se, Z) {
        var ue = !1, oe = null;
        if (C.forEach(function(ke) {
          try {
            ke.onWorkStarted(se, Z);
          } catch (Fe) {
            ue || (ue = !0, oe = Fe);
          }
        }), ue)
          throw oe;
      }
      function G(se, Z) {
        var ue = !1, oe = null;
        if (C.forEach(function(ke) {
          try {
            ke.onWorkStopped(se, Z);
          } catch (Fe) {
            ue || (ue = !0, oe = Fe);
          }
        }), ue)
          throw oe;
      }
      function he(se, Z) {
        var ue = !1, oe = null;
        if (C.forEach(function(ke) {
          try {
            ke.onWorkCanceled(se, Z);
          } catch (Fe) {
            ue || (ue = !0, oe = Fe);
          }
        }), ue)
          throw oe;
      }
      r.unstable_clear = h, r.unstable_getCurrent = m, r.unstable_getThreadID = y, r.unstable_subscribe = I, r.unstable_trace = g, r.unstable_unsubscribe = A, r.unstable_wrap = S;
    }();
  }(Nb)), Nb;
}
var aM;
function bO() {
  return aM || (aM = 1, function(r) {
    process.env.NODE_ENV === "production" ? r.exports = yO() : r.exports = wO();
  }(kb)), kb.exports;
}
/** @license React v16.14.0
 * react-dom.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var sM;
function SO() {
  return sM || (sM = 1, process.env.NODE_ENV !== "production" && function() {
    var r = hl.exports, n = bg(), o = HE(), l = VE(), h = bO(), m = r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    m.hasOwnProperty("ReactCurrentDispatcher") || (m.ReactCurrentDispatcher = {
      current: null
    }), m.hasOwnProperty("ReactCurrentBatchConfig") || (m.ReactCurrentBatchConfig = {
      suspense: null
    });
    function y(e) {
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
        var w = s.map(function(k) {
          return "" + k;
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
    var C = function(e, t, s, u, d, p, w, b, E) {
      var k = Array.prototype.slice.call(arguments, 3);
      try {
        t.apply(s, k);
      } catch (N) {
        this.onError(N);
      }
    };
    if (typeof window < "u" && typeof window.dispatchEvent == "function" && typeof document < "u" && typeof document.createEvent == "function") {
      var I = document.createElement("react"), A = function(e, t, s, u, d, p, w, b, E) {
        if (!(typeof document < "u"))
          throw Error("The `document` global was defined when React was initialized, but is not defined anymore. This can happen in a test environment if a component schedules an update from an asynchronous callback, but the test has already finished running. To solve this, you can either unmount the component at the end of your test (and ensure that any asynchronous operations get canceled in `componentWillUnmount`), or you can change the test itself to be asynchronous.");
        var k = document.createEvent("Event"), N = !0, J = window.event, L = Object.getOwnPropertyDescriptor(window, "event"), K = Array.prototype.slice.call(arguments, 3);
        function me() {
          I.removeEventListener(vt, me, !1), typeof window.event < "u" && window.hasOwnProperty("event") && (window.event = J), t.apply(s, K), N = !1;
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
        window.addEventListener("error", Pt), I.addEventListener(vt, me, !1), k.initEvent(vt, !1, !1), I.dispatchEvent(k), L && Object.defineProperty(window, "event", L), N && (Ke ? nt && (we = new Error("A cross-origin error was thrown. React doesn't have access to the actual error object in development. See https://fb.me/react-crossorigin-error for more information.")) : we = new Error(`An error was thrown inside one of your components, but React doesn't know what it was. This is likely due to browser flakiness. React does its best to preserve the "Pause on exceptions" behavior of the DevTools, which requires some DEV-mode only tricks. It's possible that these don't work in your browser. Try triggering the error in production mode, or switching to a modern browser. If you suspect that this is actually an issue with React, please file an issue.`), this.onError(we)), window.removeEventListener("error", Pt);
      };
      C = A;
    }
    var z = C, $ = !1, U = null, q = !1, G = null, he = {
      onError: function(e) {
        $ = !0, U = e;
      }
    };
    function se(e, t, s, u, d, p, w, b, E) {
      $ = !1, U = null, z.apply(he, arguments);
    }
    function Z(e, t, s, u, d, p, w, b, E) {
      if (se.apply(this, arguments), $) {
        var k = ke();
        q || (q = !0, G = k);
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
    function ke() {
      if ($) {
        var e = U;
        return $ = !1, U = null, e;
      } else
        throw Error("clearCaughtError was called but no error was captured. This error is likely caused by a bug in React. Please file an issue.");
    }
    var Fe = null, Pe = null, Y = null;
    function fe(e, t, s) {
      Fe = e, Pe = t, Y = s, (!Y || !Pe) && g("EventPluginUtils.setComponentTree(...): Injected module is missing getNodeFromInstance or getInstanceFromNode.");
    }
    var be;
    be = function(e) {
      var t = e._dispatchListeners, s = e._dispatchInstances, u = Array.isArray(t), d = u ? t.length : t ? 1 : 0, p = Array.isArray(s), w = p ? s.length : s ? 1 : 0;
      (p !== u || w !== d) && g("EventPluginUtils: Invalid `event`.");
    };
    function ie(e, t, s) {
      var u = e.type || "unknown-event";
      e.currentTarget = Y(s), Z(u, t, void 0, e), e.currentTarget = null;
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
    var Oe = 0, ce = 1, Ze = 2, Se = 3, Ue = 4, Re = 5, Qe = 6, Tt = 7, Bt = 8, Ge = 9, re = 10, D = 11, B = 12, ee = 13, Ce = 14, ge = 15, it = 16, Xe = 17, Be = 18, dt = 19, gt = 20, Zt = 21, Mt = 22, bn = null, Ft = {};
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
      if (He[e])
        throw Error("EventPluginRegistry: More than one plugin attempted to publish the same registration name, `" + e + "`.");
      He[e] = t, jt[e] = t.eventTypes[s].dependencies;
      {
        var u = e.toLowerCase();
        Sn[u] = e, e === "onDoubleClick" && (Sn.ondblclick = e);
      }
    }
    var Ne = [], st = {}, He = {}, jt = {}, Sn = {};
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
    var jn = typeof window < "u" && typeof window.document < "u" && typeof window.document.createElement < "u", Gr = 1, Ui = 1 << 5, Ta = 1 << 6, Ma = null, di = null, tr = null;
    function fi(e) {
      var t = Pe(e);
      if (!!t) {
        if (typeof Ma != "function")
          throw Error("setRestoreImplementation() needs to be called to handle a target for controlled events. This error is likely caused by a bug in React. Please file an issue.");
        var s = t.stateNode;
        if (s) {
          var u = Fe(s);
          Ma(t.stateNode, t.type, u);
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
    }, Nt = function(e, t, s, u, d) {
      return e(t, s, u, d);
    }, rn = function() {
    }, Mi = Ia, Nn = !1, Ei = !1;
    function Kn() {
      var e = Xr();
      e && (rn(), Cs());
    }
    function Jr(e, t) {
      if (Nn)
        return e(t);
      Nn = !0;
      try {
        return Ia(e, t);
      } finally {
        Nn = !1, Kn();
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
    function yo(e, t, s, u, d) {
      var p = Nn;
      Nn = !0;
      try {
        return Nt(e, t, s, u, d);
      } finally {
        Nn = p, Nn || Kn();
      }
    }
    function wo(e) {
      !Nn && !Ir && rn();
    }
    function Ts(e, t, s, u) {
      Ia = e, Nt = t, rn = s, Mi = u;
    }
    var Ra = 0, _n = 1, Ar = 2, qr = 0, ei = 1, Rr = 2, Vn = 3, nr = 4, Ms = 5, Kr = 6, Es = ":A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD", ne = Es + "\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040", de = "data-reactroot", Je = new RegExp("^[" + Es + "][" + ne + "]*$"), pt = Object.prototype.hasOwnProperty, Jt = {}, Yt = {};
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
    function Da(e, t, s, u) {
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
        var p = u.attributeName, w = null;
        if (u.type === nr) {
          if (e.hasAttribute(p)) {
            var b = e.getAttribute(p);
            return b === "" ? !0 : Da(t, s, u, !1) ? b : b === "" + s ? s : b;
          }
        } else if (e.hasAttribute(p)) {
          if (Da(t, s, u, !1))
            return e.getAttribute(p);
          if (u.type === Vn)
            return s;
          w = e.getAttribute(p);
        }
        return Da(t, s, u, !1) ? w === null ? s : w : w === "" + s ? s : w;
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
        if (Da(t, s, d, u) && (s = null), u || d === null) {
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
            e[b] = E === Vn ? !1 : "";
          } else
            e[b] = s;
          return;
        }
        var k = d.attributeName, N = d.attributeNamespace;
        if (s === null)
          e.removeAttribute(k);
        else {
          var J = d.type, L;
          J === Vn || J === nr && s === !0 ? L = "" : (L = "" + s, d.sanitizeURL && vl(L.toString())), N ? e.setAttributeNS(N, k, L) : e.setAttribute(k, L);
        }
      }
    }
    var _ = /^(.*)[\\\/]/;
    function H(e, t, s) {
      var u = "";
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
        u = " (at " + p + ":" + t.lineNumber + ")";
      } else
        s && (u = " (created by " + s + ")");
      return `
    in ` + (e || "Unknown") + u;
    }
    var X = typeof Symbol == "function" && Symbol.for, xe = X ? Symbol.for("react.element") : 60103, Ye = X ? Symbol.for("react.portal") : 60106, je = X ? Symbol.for("react.fragment") : 60107, et = X ? Symbol.for("react.strict_mode") : 60108, kt = X ? Symbol.for("react.profiler") : 60114, gn = X ? Symbol.for("react.provider") : 60109, xn = X ? Symbol.for("react.context") : 60110, Mn = X ? Symbol.for("react.concurrent_mode") : 60111, ni = X ? Symbol.for("react.forward_ref") : 60112, ii = X ? Symbol.for("react.suspense") : 60113, So = X ? Symbol.for("react.suspense_list") : 60120, ta = X ? Symbol.for("react.memo") : 60115, ir = X ? Symbol.for("react.lazy") : 60116, xo = X ? Symbol.for("react.block") : 60121, mp = typeof Symbol == "function" && Symbol.iterator, Sg = "@@iterator";
    function Dr(e) {
      if (e === null || typeof e != "object")
        return null;
      var t = mp && e[mp] || e[Sg];
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
        case kt:
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
        case Ue:
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
    function kr(e) {
      yl = e;
    }
    function ri(e) {
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
        var w = {
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
        return w;
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
        initialValue: Nr(t.value != null ? t.value : u),
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
      var d = Nr(t.value), p = t.type;
      if (d != null)
        p === "number" ? (d === 0 && s.value === "" || s.value != d) && (s.value = ri(d)) : s.value !== ri(d) && (s.value = ri(d));
      else if (p === "submit" || p === "reset") {
        s.removeAttribute("value");
        return;
      }
      t.hasOwnProperty("value") ? bl(s, t.type, d) : t.hasOwnProperty("defaultValue") && bl(s, t.type, Nr(t.defaultValue)), t.checked == null && t.defaultChecked != null && (s.defaultChecked = !!t.defaultChecked);
    }
    function Qu(e, t, s) {
      var u = e;
      if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
        var d = t.type, p = d === "submit" || d === "reset";
        if (p && (t.value === void 0 || t.value === null))
          return;
        var w = ri(u._wrapperState.initialValue);
        s || w !== u.value && (u.value = w), u.defaultValue = w;
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
          var w = d[p];
          if (!(w === e || w.form !== e.form)) {
            var b = Fg(w);
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
    function $d(e, t) {
      typeof t.children == "object" && t.children !== null && r.Children.forEach(t.children, function(s) {
        s != null && (typeof s == "string" || typeof s == "number" || typeof s.type == "string" && (Mp || (Mp = !0, g("Only strings and numbers are supported as <option> children."))));
      }), t.selected != null && !Zu && (g("Use the `defaultValue` or `value` props on <select> instead of setting `selected` on <option>."), Zu = !0);
    }
    function Qd(e, t) {
      t.value != null && e.setAttribute("value", ri(Nr(t.value)));
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
        for (var p = s, w = {}, b = 0; b < p.length; b++)
          w["$" + p[b]] = !0;
        for (var E = 0; E < d.length; E++) {
          var k = w.hasOwnProperty("$" + d[E].value);
          d[E].selected !== k && (d[E].selected = k), k && u && (d[E].defaultSelected = !0);
        }
      } else {
        for (var N = ri(Nr(s)), J = null, L = 0; L < d.length; L++) {
          if (d[L].value === N) {
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
    function xg(e, t) {
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
    function ks(e, t) {
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
        initialValue: Nr(u)
      };
    }
    function ra(e, t) {
      var s = e, u = Nr(t.value), d = Nr(t.defaultValue);
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
    }), ar = 1, sr = 3, ai = 8, Na = 9, qu = 11, Ml = function(e, t) {
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
    function Cg(e) {
      return e;
    }
    function El(e, t) {
      var s = {};
      return s[e.toLowerCase()] = t.toLowerCase(), s["Webkit" + e] = "webkit" + t, s["Moz" + e] = "moz" + t, s;
    }
    var Ns = {
      animationend: El("Animation", "AnimationEnd"),
      animationiteration: El("Animation", "AnimationIteration"),
      animationstart: El("Animation", "AnimationStart"),
      transitionend: El("Transition", "TransitionEnd")
    }, Pa = {}, Dp = {};
    jn && (Dp = document.createElement("div").style, "AnimationEvent" in window || (delete Ns.animationend.animation, delete Ns.animationiteration.animation, delete Ns.animationstart.animation), "TransitionEvent" in window || delete Ns.transitionend.transition);
    function Ku(e) {
      if (Pa[e])
        return Pa[e];
      if (!Ns[e])
        return e;
      var t = Ns[e];
      for (var s in t)
        if (t.hasOwnProperty(s) && s in Dp)
          return Pa[e] = t[s];
      return e;
    }
    var Xd = "abort", kp = Ku("animationend"), Jd = Ku("animationiteration"), qd = Ku("animationstart"), Un = "blur", _s = "canplay", Ps = "canplaythrough", ec = "cancel", za = "change", Il = "click", Do = "close", aa = "compositionend", Al = "compositionstart", Kd = "compositionupdate", Rl = "contextmenu", ef = "copy", tf = "cut", nf = "dblclick", zs = "auxclick", Np = "drag", Dl = "dragend", Os = "dragenter", rf = "dragexit", kl = "dragleave", af = "dragover", tc = "dragstart", Ls = "drop", nc = "durationchange", Bs = "emptied", sf = "encrypted", of = "ended", Ii = "error", Wi = "focus", sa = "gotpointercapture", Nl = "input", zr = "invalid", Hn = "keydown", Fi = "keypress", si = "keyup", Oa = "load", ic = "loadstart", lf = "loadeddata", uf = "loadedmetadata", rc = "lostpointercapture", oa = "mousedown", _l = "mousemove", La = "mouseout", la = "mouseover", Pl = "mouseup", zl = "paste", cf = "pause", df = "play", ff = "playing", hf = "pointercancel", pf = "pointerdown", ac = "pointermove", Ai = "pointerout", St = "pointerover", sn = "pointerup", Or = "progress", Pn = "ratechange", En = "reset", Lr = "scroll", Ba = "seeked", Qn = "seeking", ja = "selectionchange", sc = "stalled", js = "submit", ko = "suspend", Ol = "textInput", mf = "timeupdate", No = "toggle", oc = "touchcancel", lc = "touchend", uc = "touchmove", vf = "touchstart", Ll = Ku("transitionend"), cc = "volumechange", dc = "waiting", gf = "wheel", _o = [Xd, _s, Ps, nc, Bs, sf, of, Ii, lf, uf, ic, cf, df, ff, Or, Pn, Ba, Qn, sc, ko, mf, cc, dc];
    function yf(e) {
      return e;
    }
    var Tg = typeof WeakMap == "function" ? WeakMap : Map, _p = new Tg();
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
    var _t = 0, lr = 1, Cn = 2, xt = 4, zp = 6, Vs = 8, Ri = 16, bf = 32, Vt = 64, pi = 128, Va = 256, Ua = 512, $i = 1024, fc = 1028, Sf = 932, xf = 2047, Po = 2048, mi = 4096, Qi = m.ReactCurrentOwner;
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
    function Ha(e) {
      return vi(e) === e;
    }
    function Wa(e) {
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
        var w = p.alternate;
        if (w === null) {
          var b = p.return;
          if (b !== null) {
            u = d = b;
            continue;
          }
          break;
        }
        if (p.child === w.child) {
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
          u = p, d = w;
        else {
          for (var k = !1, N = p.child; N; ) {
            if (N === u) {
              k = !0, u = p, d = w;
              break;
            }
            if (N === d) {
              k = !0, d = p, u = w;
              break;
            }
            N = N.sibling;
          }
          if (!k) {
            for (N = w.child; N; ) {
              if (N === u) {
                k = !0, u = w, d = p;
                break;
              }
              if (N === d) {
                k = !0, d = w, u = p;
                break;
              }
              N = N.sibling;
            }
            if (!k)
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
        if (s.child && s.tag !== Ue) {
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
    var Fa = null, Op = function(e) {
      e && (ct(e), e.isPersistent() || e.constructor.release(e));
    }, Lp = function(e) {
      return Op(e);
    };
    function mc(e) {
      e !== null && (Fa = Us(Fa, e));
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
      for (var p = null, w = 0; w < Ne.length; w++) {
        var b = Ne[w];
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
      for (var w = 0; w < e.ancestors.length; w++) {
        t = e.ancestors[w];
        var b = jl(e.nativeEvent), E = e.topLevelType, k = e.nativeEvent, N = e.eventSystemFlags;
        w === 0 && (N |= Ta), Br(E, t, k, b, N);
      }
    }
    function Bo(e, t, s, u) {
      var d = Lo(e, s, u, t);
      try {
        Aa(Wl, d);
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
    var gi = !1, Zn = [], $t = null, on = null, ln = null, $a = /* @__PURE__ */ new Map(), Wn = /* @__PURE__ */ new Map(), Fs = [];
    function Af() {
      return Zn.length > 0;
    }
    var $s = [oa, Pl, oc, lc, vf, zs, nf, hf, pf, sn, Dl, tc, Ls, aa, Al, Hn, Fi, si, Nl, Ol, Do, ec, ef, tf, zl, Il, za, Rl, En, js], Vo = [Wi, Un, Os, kl, la, La, St, Ai, sa, rc];
    function Qa(e) {
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
        case kl:
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
          var u = t.pointerId;
          Wn.delete(u);
          break;
        }
      }
    }
    function Qs(e, t, s, u, d, p) {
      if (e === null || e.nativeEvent !== p) {
        var w = Sc(t, s, u, d, p);
        if (t !== null) {
          var b = Zo(t);
          b !== null && Kt(b);
        }
        return w;
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
          var w = d;
          return on = Qs(on, e, t, s, u, w), !0;
        }
        case la: {
          var b = d;
          return ln = Qs(ln, e, t, s, u, b), !0;
        }
        case St: {
          var E = d, k = E.pointerId;
          return $a.set(k, Qs($a.get(k) || null, e, t, s, u, E)), !0;
        }
        case sa: {
          var N = d, J = N.pointerId;
          return Wn.set(J, Qs(Wn.get(J) || null, e, t, s, u, N)), !0;
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
    function kf(e, t, s) {
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
      $t !== null && Zs($t) && ($t = null), on !== null && Zs(on) && (on = null), ln !== null && Zs(ln) && (ln = null), $a.forEach(kf), Wn.forEach(kf);
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
      $a.forEach(u), Wn.forEach(u);
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
    function Up(e, t, s) {
      e.addEventListener(t, s, !1);
    }
    function Tc(e, t, s) {
      e.addEventListener(t, s, !0);
    }
    var Nf = {}, Mc = /* @__PURE__ */ new Map(), Ec = /* @__PURE__ */ new Map(), Ic = [Un, "blur", ec, "cancel", Il, "click", Do, "close", Rl, "contextMenu", ef, "copy", tf, "cut", zs, "auxClick", nf, "doubleClick", Dl, "dragEnd", tc, "dragStart", Ls, "drop", Wi, "focus", Nl, "input", zr, "invalid", Hn, "keyDown", Fi, "keyPress", si, "keyUp", oa, "mouseDown", Pl, "mouseUp", zl, "paste", cf, "pause", df, "play", hf, "pointerCancel", pf, "pointerDown", sn, "pointerUp", Pn, "rateChange", En, "reset", Ba, "seeked", js, "submit", oc, "touchCancel", lc, "touchEnd", vf, "touchStart", cc, "volumeChange"], Mg = [za, ja, Ol, Al, aa, Kd], Eg = [Np, "drag", Os, "dragEnter", rf, "dragExit", kl, "dragLeave", af, "dragOver", _l, "mouseMove", La, "mouseOut", la, "mouseOver", ac, "pointerMove", Ai, "pointerOut", St, "pointerOver", Lr, "scroll", No, "toggle", uc, "touchMove", gf, "wheel"], Ig = [Xd, "abort", kp, "animationEnd", Jd, "animationIteration", qd, "animationStart", _s, "canPlay", Ps, "canPlayThrough", nc, "durationChange", Bs, "emptied", sf, "encrypted", of, "ended", Ii, "error", sa, "gotPointerCapture", Oa, "load", lf, "loadedData", uf, "loadedMetadata", ic, "loadStart", rc, "lostPointerCapture", ff, "playing", Or, "progress", Qn, "seeking", sc, "stalled", ko, "suspend", mf, "timeUpdate", Ll, "transitionEnd", dc, "waiting"];
    function ur(e, t) {
      for (var s = 0; s < e.length; s += 2) {
        var u = e[s], d = e[s + 1], p = d[0].toUpperCase() + d.slice(1), w = "on" + p, b = {
          phasedRegistrationNames: {
            bubbled: w,
            captured: w + "Capture"
          },
          dependencies: [u],
          eventPriority: t
        };
        Ec.set(u, t), Mc.set(u, b), Nf[d] = b;
      }
    }
    function Za(e, t) {
      for (var s = 0; s < e.length; s++)
        Ec.set(e[s], t);
    }
    ur(Ic, Ra), ur(Eg, _n), ur(Ig, Ar), Za(Mg, Ra);
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
        case Ra:
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
        if (Af() && Qa(e)) {
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
        if (Qa(e)) {
          xc(d, e, t, s, u);
          return;
        }
        Df(d, e, t, s, u) || (Rf(e, u), Bo(e, t, u, null));
      }
    }
    function Dc(e, t, s, u) {
      var d = jl(u), p = th(d);
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
            var k = w.stateNode;
            if (k.hydrate)
              return pc(w);
            p = null;
          } else
            w !== p && (p = null);
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
    function kc(e, t, s) {
      var u = t == null || typeof t == "boolean" || t === "";
      return u ? "" : !s && typeof t == "number" && t !== 0 && !(Gs.hasOwnProperty(e) && Gs[e]) ? t + "px" : ("" + t).trim();
    }
    var zf = /([A-Z])/g, Zp = /^ms-/;
    function Yp(e) {
      return e.replace(zf, "-$1").toLowerCase().replace(Zp, "-ms-");
    }
    var Nc = function() {
    };
    {
      var Gp = /^(?:webkit|moz|o)[A-Z]/, ca = /^-ms-/, Xp = /-(.)/g, _c = /;\s*$/, Xs = {}, Pc = {}, Zl = !1, Jp = !1, Ag = function(e) {
        return e.replace(Xp, function(t, s) {
          return s.toUpperCase();
        });
      }, Of = function(e) {
        Xs.hasOwnProperty(e) && Xs[e] || (Xs[e] = !0, g(
          "Unsupported style property %s. Did you mean %s?",
          e,
          Ag(e.replace(ca, "ms-"))
        ));
      }, Rg = function(e) {
        Xs.hasOwnProperty(e) && Xs[e] || (Xs[e] = !0, g("Unsupported vendor-prefixed style property %s. Did you mean %s?", e, e.charAt(0).toUpperCase() + e.slice(1)));
      }, Lf = function(e, t) {
        Pc.hasOwnProperty(t) && Pc[t] || (Pc[t] = !0, g(`Style property values shouldn't contain a semicolon. Try "%s: %s" instead.`, e, t.replace(_c, "")));
      }, Dg = function(e, t) {
        Zl || (Zl = !0, g("`NaN` is an invalid value for the `%s` css style property.", e));
      }, qp = function(e, t) {
        Jp || (Jp = !0, g("`Infinity` is an invalid value for the `%s` css style property.", e));
      };
      Nc = function(e, t) {
        e.indexOf("-") > -1 ? Of(e) : Gp.test(e) ? Rg(e) : _c.test(t) && Lf(e, t), typeof t == "number" && (isNaN(t) ? Dg(e, t) : isFinite(t) || qp(e, t));
      };
    }
    var kg = Nc;
    function Kp(e) {
      {
        var t = "", s = "";
        for (var u in e)
          if (!!e.hasOwnProperty(u)) {
            var d = e[u];
            if (d != null) {
              var p = u.indexOf("--") === 0;
              t += s + (p ? u : Yp(u)) + ":", t += kc(u, d, p), s = ";";
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
          d || kg(u, t[u]);
          var p = kc(u, t[u], d);
          u === "float" && (u = "cssFloat"), d ? s.setProperty(u, p) : s[u] = p;
        }
    }
    function Ng(e) {
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
          var w = s[p], b = u[p];
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
    }, Js = {}, rm = new RegExp("^(aria)-[" + ne + "]*$"), _g = new RegExp("^(aria)[A-Z][" + ne + "]*$"), Oc = Object.prototype.hasOwnProperty;
    function am(e, t) {
      {
        if (Oc.call(Js, t) && Js[t])
          return !0;
        if (_g.test(t)) {
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
      var On = {}, sm = Object.prototype.hasOwnProperty, Xl = /^on./, Lc = /^on[^A-Z]/, Hf = new RegExp("^(aria)-[" + ne + "]*$"), at = new RegExp("^(aria)[A-Z][" + ne + "]*$");
      Ya = function(e, t, s, u) {
        if (sm.call(On, t) && On[t])
          return !0;
        var d = t.toLowerCase();
        if (d === "onfocusin" || d === "onfocusout")
          return g("React uses onFocus and onBlur instead of onFocusIn and onFocusOut. All React events are normalized to bubble, so onFocusIn and onFocusOut are not needed/supported by React."), On[t] = !0, !0;
        if (u) {
          if (He.hasOwnProperty(t))
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
        var w = bo(t), b = w !== null && w.type === qr;
        if (Gl.hasOwnProperty(d)) {
          var E = Gl[d];
          if (E !== t)
            return g("Invalid DOM property `%s`. Did you mean `%s`?", t, E), On[t] = !0, !0;
        } else if (!b && t !== d)
          return g("React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element.", t, d), On[t] = !0, !0;
        return typeof s == "boolean" && qt(t, s, w, !1) ? (s ? g('Received `%s` for a non-boolean attribute `%s`.\n\nIf you want to write it to the DOM, pass a string instead: %s="%s" or %s={value.toString()}.', s, t, t, s, t) : g('Received `%s` for a non-boolean attribute `%s`.\n\nIf you want to write it to the DOM, pass a string instead: %s="%s" or %s={value.toString()}.\n\nIf you used to conditionally omit it with %s={condition && value}, pass %s={condition ? value : undefined} instead.', s, t, t, s, t, t, t), On[t] = !0, !0) : b ? !0 : qt(t, s, w, !1) ? (On[t] = !0, !1) : ((s === "false" || s === "true") && w !== null && w.type === Vn && (g("Received the string `%s` for the boolean attribute `%s`. %s Did you mean %s={%s}?", s, t, s === "false" ? "The browser will interpret it as a truthy value." : 'Although this works, it will not work as expected if you pass the string "false".', t, s), On[t] = !0), !0);
      };
    }
    var ki = function(e, t, s) {
      {
        var u = [];
        for (var d in t) {
          var p = Ya(e, d, t[d], s);
          p || u.push(d);
        }
        var w = u.map(function(b) {
          return "`" + b + "`";
        }).join(", ");
        u.length === 1 ? g("Invalid value for prop %s on <%s> tag. Either remove it from the element, or pass a string or number value to keep it in the DOM. For details, see https://fb.me/react-attribute-behavior", w, e) : u.length > 1 && g("Invalid values for props %s on <%s> tag. Either remove them from the element, or pass a string or number value to keep them in the DOM. For details, see https://fb.me/react-attribute-behavior", w, e);
      }
    };
    function ot(e, t, s) {
      da(e, t) || ki(e, t, s);
    }
    var Ut = !1, pn = "dangerouslySetInnerHTML", qs = "suppressContentEditableWarning", Ni = "suppressHydrationWarning", Ho = "autoFocus", Vr = "children", dr = "style", Ks = "__html", Ga = hi.html, Bc, Le, eo, Wo, Yi, Jl, Xa, Fo, fr, $o;
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
      }, Xa = function(e, t) {
        t === !1 ? g("Expected `%s` listener to be a function, instead got `false`.\n\nIf you used to conditionally omit it with %s={condition && value}, pass %s={condition ? value : undefined} instead.", e, e, e) : g("Expected `%s` listener to be a function, instead got a value of `%s` type.", e, typeof t);
      }, $o = function(e, t) {
        var s = e.namespaceURI === Ga ? e.ownerDocument.createElement(e.tagName) : e.ownerDocument.createElementNS(e.namespaceURI, e.tagName);
        return s.innerHTML = t, s.innerHTML;
      };
    }
    function Ln(e, t) {
      var s = e.nodeType === Na || e.nodeType === qu, u = s ? e : e.ownerDocument;
      Ws(t, u);
    }
    function Ja(e) {
      return e.nodeType === Na ? e : e.ownerDocument;
    }
    function qa() {
    }
    function to(e) {
      e.onclick = qa;
    }
    function Vc(e, t, s, u, d) {
      for (var p in u)
        if (!!u.hasOwnProperty(p)) {
          var w = u[p];
          if (p === dr)
            w && Object.freeze(w), Bf(t, w);
          else if (p === pn) {
            var b = w ? w[Ks] : void 0;
            b != null && Rp(t, b);
          } else if (p === Vr)
            if (typeof w == "string") {
              var E = e !== "textarea" || w !== "";
              E && Ml(t, w);
            } else
              typeof w == "number" && Ml(t, "" + w);
          else
            p === qs || p === Ni || p === Ho || (He.hasOwnProperty(p) ? w != null && (typeof w != "function" && Xa(p, w), Ln(s, p)) : w != null && M(t, p, w, d));
        }
    }
    function _i(e, t, s, u) {
      for (var d = 0; d < t.length; d += 2) {
        var p = t[d], w = t[d + 1];
        p === dr ? Bf(e, w) : p === pn ? Rp(e, w) : p === Vr ? Ml(e, w) : M(e, p, w, u);
      }
    }
    function om(e, t, s, u) {
      var d, p = Ja(s), w, b = u;
      if (b === Ga && (b = Yd(e)), b === Ga) {
        if (d = da(e, t), !d && e !== e.toLowerCase() && g("<%s /> is using incorrect casing. Use PascalCase for React components, or lowercase for HTML elements.", e), e === "script") {
          var E = p.createElement("div");
          E.innerHTML = "<script><\/script>";
          var k = E.firstChild;
          w = E.removeChild(k);
        } else if (typeof t.is == "string")
          w = p.createElement(e, {
            is: t.is
          });
        else if (w = p.createElement(e), e === "select") {
          var N = w;
          t.multiple ? N.multiple = !0 : t.size && (N.size = t.size);
        }
      } else
        w = p.createElementNS(b, e);
      return b === Ga && !d && Object.prototype.toString.call(w) === "[object HTMLUnknownElement]" && !Object.prototype.hasOwnProperty.call(Bc, e) && (Bc[e] = !0, g("The tag <%s> is unrecognized in this browser. If you meant to render a React component, start its name with an uppercase letter.", e)), w;
    }
    function Ff(e, t) {
      return Ja(t).createTextNode(e);
    }
    function Pg(e, t, s, u) {
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
          Gt(No, e), p = s;
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
          ks(e, s), p = Zd(e, s), Gt(zr, e), Ln(u, "onChange");
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
      var p = null, w, b;
      switch (t) {
        case "input":
          w = Fu(e, s), b = Fu(e, u), p = [];
          break;
        case "option":
          w = _r(e, s), b = _r(e, u), p = [];
          break;
        case "select":
          w = xl(e, s), b = xl(e, u), p = [];
          break;
        case "textarea":
          w = Zd(e, s), b = Zd(e, u), p = [];
          break;
        default:
          w = s, b = u, typeof w.onClick != "function" && typeof b.onClick == "function" && to(e);
          break;
      }
      zc(t, b);
      var E, k, N = null;
      for (E in w)
        if (!(b.hasOwnProperty(E) || !w.hasOwnProperty(E) || w[E] == null))
          if (E === dr) {
            var J = w[E];
            for (k in J)
              J.hasOwnProperty(k) && (N || (N = {}), N[k] = "");
          } else
            E === pn || E === Vr || E === qs || E === Ni || E === Ho || (He.hasOwnProperty(E) ? p || (p = []) : (p = p || []).push(E, null));
      for (E in b) {
        var L = b[E], K = w != null ? w[E] : void 0;
        if (!(!b.hasOwnProperty(E) || L === K || L == null && K == null))
          if (E === dr)
            if (L && Object.freeze(L), K) {
              for (k in K)
                K.hasOwnProperty(k) && (!L || !L.hasOwnProperty(k)) && (N || (N = {}), N[k] = "");
              for (k in L)
                L.hasOwnProperty(k) && K[k] !== L[k] && (N || (N = {}), N[k] = L[k]);
            } else
              N || (p || (p = []), p.push(E, N)), N = L;
          else if (E === pn) {
            var me = L ? L[Ks] : void 0, we = K ? K[Ks] : void 0;
            me != null && we !== me && (p = p || []).push(E, me);
          } else
            E === Vr ? K !== L && (typeof L == "string" || typeof L == "number") && (p = p || []).push(E, "" + L) : E === qs || E === Ni || (He.hasOwnProperty(E) ? (L != null && (typeof L != "function" && Xa(E, L), Ln(d, E)), !p && K !== L && (p = [])) : (p = p || []).push(E, L));
      }
      return N && (em(N, b[dr]), (p = p || []).push(dr, N)), p;
    }
    function um(e, t, s, u, d) {
      s === "input" && d.type === "radio" && d.name != null && $u(e, d);
      var p = da(s, u), w = da(s, d);
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
    function cm(e, t, s, u, d) {
      var p, w;
      switch (Le = s[Ni] === !0, p = da(t, s), eo(t, s), t) {
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
          Gt(No, e);
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
          ks(e, s), Gt(zr, e), Ln(d, "onChange");
          break;
      }
      zc(t, s);
      {
        w = /* @__PURE__ */ new Set();
        for (var E = e.attributes, k = 0; k < E.length; k++) {
          var N = E[k].name.toLowerCase();
          switch (N) {
            case "data-reactroot":
              break;
            case "value":
              break;
            case "checked":
              break;
            case "selected":
              break;
            default:
              w.add(E[k].name);
          }
        }
      }
      var J = null;
      for (var L in s)
        if (!!s.hasOwnProperty(L)) {
          var K = s[L];
          if (L === Vr)
            typeof K == "string" ? e.textContent !== K && (Le || Wo(e.textContent, K), J = [Vr, K]) : typeof K == "number" && e.textContent !== "" + K && (Le || Wo(e.textContent, K), J = [Vr, "" + K]);
          else if (He.hasOwnProperty(L))
            K != null && (typeof K != "function" && Xa(L, K), Ln(d, L));
          else if (typeof p == "boolean") {
            var me = void 0, we = bo(L);
            if (!Le) {
              if (!(L === qs || L === Ni || L === "value" || L === "checked" || L === "selected")) {
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
                    var F = u;
                    if (F === Ga && (F = Yd(t)), F === Ga)
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
          xg(e, s);
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
    function zg(e) {
      for (; e; ) {
        if (e.nextSibling)
          return e.nextSibling;
        e = e.parentNode;
      }
    }
    function mm(e, t) {
      for (var s = Ka(e), u = 0, d = 0; s; ) {
        if (s.nodeType === sr) {
          if (d = u + s.textContent.length, u <= t && d >= t)
            return {
              node: s,
              offset: t - u
            };
          u = d;
        }
        s = Ka(zg(s));
      }
    }
    function Qo(e) {
      var t = e.ownerDocument, s = t && t.defaultView || window, u = s.getSelection && s.getSelection();
      if (!u || u.rangeCount === 0)
        return null;
      var d = u.anchorNode, p = u.anchorOffset, w = u.focusNode, b = u.focusOffset;
      try {
        d.nodeType, w.nodeType;
      } catch {
        return null;
      }
      return Og(e, d, p, w, b);
    }
    function Og(e, t, s, u, d) {
      var p = 0, w = -1, b = -1, E = 0, k = 0, N = e, J = null;
      e:
        for (; ; ) {
          for (var L = null; N === t && (s === 0 || N.nodeType === sr) && (w = p + s), N === u && (d === 0 || N.nodeType === sr) && (b = p + d), N.nodeType === sr && (p += N.nodeValue.length), (L = N.firstChild) !== null; )
            J = N, N = L;
          for (; ; ) {
            if (N === e)
              break e;
            if (J === t && ++E === s && (w = p), J === u && ++k === d && (b = p), (L = N.nextSibling) !== null)
              break;
            N = J, J = N.parentNode;
          }
          N = L;
        }
      return w === -1 || b === -1 ? null : {
        start: w,
        end: b
      };
    }
    function vm(e, t) {
      var s = e.ownerDocument || document, u = s && s.defaultView || window;
      if (!!u.getSelection) {
        var d = u.getSelection(), p = e.textContent.length, w = Math.min(t.start, p), b = t.end === void 0 ? w : Math.min(t.end, p);
        if (!d.extend && w > b) {
          var E = b;
          b = w, w = E;
        }
        var k = mm(e, w), N = mm(e, b);
        if (k && N) {
          if (d.rangeCount === 1 && d.anchorNode === k.node && d.anchorOffset === k.offset && d.focusNode === N.node && d.focusOffset === N.offset)
            return;
          var J = s.createRange();
          J.setStart(k.node, k.offset), d.removeAllRanges(), w > b ? (d.addRange(J), d.extend(N.node, N.offset)) : (J.setEnd(N.node, N.offset), d.addRange(J));
        }
      }
    }
    function es(e) {
      return e && e.nodeType === sr;
    }
    function gm(e, t) {
      return !e || !t ? !1 : e === t ? !0 : es(e) ? !1 : es(t) ? gm(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1;
    }
    function Lg(e) {
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
    function Bg() {
      var e = Uc();
      return {
        activeElementDetached: null,
        focusedElem: e,
        selectionRange: eu(e) ? Ur(e) : null
      };
    }
    function jg(e) {
      var t = Uc(), s = e.focusedElem, u = e.selectionRange;
      if (t !== s && Lg(s)) {
        u !== null && eu(s) && Zf(s, u);
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
        var p = bm(e, d) ? null : u, w = p ? null : io(e, s), b = p || w;
        if (!!b) {
          var E = b.tag, k = ft(), N = !!p + "|" + e + "|" + E + "|" + k;
          if (!Xf[N]) {
            Xf[N] = !0;
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
    function Vg(e) {
      var t, s, u = e.nodeType;
      switch (u) {
        case Na:
        case qu: {
          t = u === Na ? "#document" : "#fragment";
          var d = e.documentElement;
          s = d ? d.namespaceURI : Gd(null, "");
          break;
        }
        default: {
          var p = u === ai ? e.parentNode : e, w = p.namespaceURI || null;
          t = p.tagName, s = Gd(w, t);
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
    function NS(e) {
      return e;
    }
    function i(e) {
      ro = Ac(), qf = Bg(), _f(!1);
    }
    function a(e) {
      jg(qf), _f(ro), ro = null, qf = null;
    }
    function c(e, t, s, u, d) {
      var p;
      {
        var w = u;
        if (tu(e, null, w.ancestorInfo), typeof t.children == "string" || typeof t.children == "number") {
          var b = "" + t.children, E = hr(w.ancestorInfo, e);
          tu(null, b, E);
        }
        p = w.namespace;
      }
      var k = om(e, t, s, p);
      return Cm(d, k), $g(k, t), k;
    }
    function f(e, t) {
      e.appendChild(t);
    }
    function v(e, t, s, u, d) {
      return Pg(e, t, s, u), ru(t, s);
    }
    function x(e, t, s, u, d, p) {
      {
        var w = p;
        if (typeof u.children != typeof s.children && (typeof u.children == "string" || typeof u.children == "number")) {
          var b = "" + u.children, E = hr(w.ancestorInfo, t);
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
    var V = typeof setTimeout == "function" ? setTimeout : void 0, Me = typeof clearTimeout == "function" ? clearTimeout : void 0, De = -1;
    function mt(e, t, s, u) {
      ru(t, s) && e.focus();
    }
    function Et(e, t, s, u, d, p) {
      $g(e, d), um(e, t, s, u, d);
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
      var s = t[Jf], u = s != null && s.hasOwnProperty("display") ? s.display : null;
      e.style.display = kc("display", u);
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
    function GE(e) {
      return e.data === Fc;
    }
    function XE(e) {
      return e.data === iu;
    }
    function _S(e) {
      for (; e != null; e = e.nextSibling) {
        var t = e.nodeType;
        if (t === ar || t === sr)
          break;
      }
      return e;
    }
    function xm(e) {
      return _S(e.nextSibling);
    }
    function PS(e) {
      return _S(e.firstChild);
    }
    function JE(e, t, s, u, d, p) {
      Cm(p, e), $g(e, s);
      var w;
      {
        var b = d;
        w = b.namespace;
      }
      return cm(e, t, s, w, u);
    }
    function qE(e, t, s) {
      return Cm(s, e), dm(e, t);
    }
    function KE(e) {
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
    function zS(e) {
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
    function eI(e) {
      Cc(e);
    }
    function tI(e) {
      Cc(e);
    }
    function nI(e, t, s) {
      $f(t, s);
    }
    function iI(e, t, s, u, d) {
      t[ts] !== !0 && $f(u, d);
    }
    function rI(e, t) {
      t.nodeType === ar ? ql(e, t) : t.nodeType === ai || fm(e, t);
    }
    function aI(e, t, s, u) {
      t[ts] !== !0 && (u.nodeType === ar ? ql(s, u) : u.nodeType === ai || fm(s, u));
    }
    function sI(e, t, s) {
      hm(e, t);
    }
    function oI(e, t) {
      Qf(e, t);
    }
    function lI(e, t, s, u, d) {
      t[ts] !== !0 && hm(s, u);
    }
    function uI(e, t, s, u) {
      t[ts] !== !0 && Qf(s, u);
    }
    function cI(e, t, s) {
      t[ts];
    }
    var Hg = Math.random().toString(36).slice(2), Kf = "__reactInternalInstance$" + Hg, OS = "__reactEventHandlers$" + Hg, eh = "__reactContainere$" + Hg;
    function Cm(e, t) {
      t[Kf] = e;
    }
    function dI(e, t) {
      t[eh] = e;
    }
    function LS(e) {
      e[eh] = null;
    }
    function Wg(e) {
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
            for (var d = zS(e); d !== null; ) {
              var p = d[Kf];
              if (p)
                return p;
              d = zS(d);
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
    function Fg(e) {
      return e[OS] || null;
    }
    function $g(e, t) {
      e[OS] = t;
    }
    function ao(e) {
      do
        e = e.return;
      while (e && e.tag !== Re);
      return e || null;
    }
    function fI(e, t) {
      for (var s = 0, u = e; u; u = ao(u))
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
    function hI(e, t, s) {
      for (var u = []; e; )
        u.push(e), e = ao(e);
      var d;
      for (d = u.length; d-- > 0; )
        t(u[d], "captured", s);
      for (d = 0; d < u.length; d++)
        t(u[d], "bubbled", s);
    }
    function pI(e, t, s, u, d) {
      for (var p = e && t ? fI(e, t) : null, w = []; !(!e || e === p); ) {
        var b = e.alternate;
        if (b !== null && b === p)
          break;
        w.push(e), e = ao(e);
      }
      for (var E = []; !(!t || t === p); ) {
        var k = t.alternate;
        if (k !== null && k === p)
          break;
        E.push(t), t = ao(t);
      }
      for (var N = 0; N < w.length; N++)
        s(w[N], "bubbled", u);
      for (var J = E.length; J-- > 0; )
        s(E[J], "captured", d);
    }
    function mI(e) {
      return e === "button" || e === "input" || e === "select" || e === "textarea";
    }
    function vI(e, t, s) {
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
          return !!(s.disabled && mI(t));
        default:
          return !1;
      }
    }
    function BS(e, t) {
      var s, u = e.stateNode;
      if (!u)
        return null;
      var d = Fe(u);
      if (!d || (s = d[t], vI(t, e.type, d)))
        return null;
      if (!(!s || typeof s == "function"))
        throw Error("Expected `" + t + "` listener to be a function, instead got a value of `" + typeof s + "` type.");
      return s;
    }
    function gI(e, t, s) {
      var u = t.dispatchConfig.phasedRegistrationNames[s];
      return BS(e, u);
    }
    function yI(e, t, s) {
      e || g("Dispatching inst must not be null");
      var u = gI(e, s, t);
      u && (s._dispatchListeners = Us(s._dispatchListeners, u), s._dispatchInstances = Us(s._dispatchInstances, e));
    }
    function wI(e) {
      e && e.dispatchConfig.phasedRegistrationNames && hI(e._targetInst, yI, e);
    }
    function jS(e, t, s) {
      if (e && s && s.dispatchConfig.registrationName) {
        var u = s.dispatchConfig.registrationName, d = BS(e, u);
        d && (s._dispatchListeners = Us(s._dispatchListeners, d), s._dispatchInstances = Us(s._dispatchInstances, e));
      }
    }
    function bI(e) {
      e && e.dispatchConfig.registrationName && jS(e._targetInst, null, e);
    }
    function $c(e) {
      Oo(e, wI);
    }
    function SI(e, t, s, u) {
      pI(s, u, jS, e, t);
    }
    function xI(e) {
      Oo(e, bI);
    }
    var nh = null, Qg = null, ih = null;
    function CI(e) {
      return nh = e, Qg = US(), !0;
    }
    function TI() {
      nh = null, Qg = null, ih = null;
    }
    function VS() {
      if (ih)
        return ih;
      var e, t = Qg, s = t.length, u, d = US(), p = d.length;
      for (e = 0; e < s && t[e] === d[e]; e++)
        ;
      var w = s - e;
      for (u = 1; u <= w && t[s - u] === d[p - u]; u++)
        ;
      var b = u > 1 ? 1 - u : void 0;
      return ih = d.slice(e, b), ih;
    }
    function US() {
      return "value" in nh ? nh.value : nh.textContent;
    }
    var MI = 10, EI = {
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
          var w = d[p];
          w ? this[p] = w(s) : p === "target" ? this.target = u : this[p] = s[p];
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
    }), pr.Interface = EI, pr.extend = function(e) {
      var t = this, s = function() {
      };
      s.prototype = t.prototype;
      var u = new s();
      function d() {
        return t.apply(this, arguments);
      }
      return n(u, d.prototype), d.prototype = u, d.prototype.constructor = d, d.Interface = n({}, t.Interface, e), d.extend = t.extend, HS(d), d;
    }, HS(pr);
    function Qc(e, t) {
      var s = typeof t == "function";
      return {
        configurable: !0,
        set: u,
        get: d
      };
      function u(w) {
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
    function II(e, t, s, u) {
      var d = this;
      if (d.eventPool.length) {
        var p = d.eventPool.pop();
        return d.call(p, e, t, s, u), p;
      }
      return new d(e, t, s, u);
    }
    function AI(e) {
      var t = this;
      if (!(e instanceof t))
        throw Error("Trying to release an event instance into a pool of a different type.");
      e.destructor(), t.eventPool.length < MI && t.eventPool.push(e);
    }
    function HS(e) {
      e.eventPool = [], e.getPooled = II, e.release = AI;
    }
    var RI = pr.extend({
      data: null
    }), DI = pr.extend({
      data: null
    }), kI = [9, 13, 27, 32], WS = 229, Zg = jn && "CompositionEvent" in window, rh = null;
    jn && "documentMode" in document && (rh = document.documentMode);
    var NI = jn && "TextEvent" in window && !rh, FS = jn && (!Zg || rh && rh > 8 && rh <= 11), $S = 32, QS = String.fromCharCode($S), so = {
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
    }, ZS = !1;
    function _I(e) {
      return (e.ctrlKey || e.altKey || e.metaKey) && !(e.ctrlKey && e.altKey);
    }
    function PI(e) {
      switch (e) {
        case Al:
          return so.compositionStart;
        case aa:
          return so.compositionEnd;
        case Kd:
          return so.compositionUpdate;
      }
    }
    function zI(e, t) {
      return e === Hn && t.keyCode === WS;
    }
    function YS(e, t) {
      switch (e) {
        case si:
          return kI.indexOf(t.keyCode) !== -1;
        case Hn:
          return t.keyCode !== WS;
        case Fi:
        case oa:
        case Un:
          return !0;
        default:
          return !1;
      }
    }
    function GS(e) {
      var t = e.detail;
      return typeof t == "object" && "data" in t ? t.data : null;
    }
    function XS(e) {
      return e.locale === "ko";
    }
    var Zc = !1;
    function OI(e, t, s, u) {
      var d, p;
      if (Zg ? d = PI(e) : Zc ? YS(e, s) && (d = so.compositionEnd) : zI(e, s) && (d = so.compositionStart), !d)
        return null;
      FS && !XS(s) && (!Zc && d === so.compositionStart ? Zc = CI(u) : d === so.compositionEnd && Zc && (p = VS()));
      var w = RI.getPooled(d, t, s, u);
      if (p)
        w.data = p;
      else {
        var b = GS(s);
        b !== null && (w.data = b);
      }
      return $c(w), w;
    }
    function LI(e, t) {
      switch (e) {
        case aa:
          return GS(t);
        case Fi:
          var s = t.which;
          return s !== $S ? null : (ZS = !0, QS);
        case Ol:
          var u = t.data;
          return u === QS && ZS ? null : u;
        default:
          return null;
      }
    }
    function BI(e, t) {
      if (Zc) {
        if (e === aa || !Zg && YS(e, t)) {
          var s = VS();
          return TI(), Zc = !1, s;
        }
        return null;
      }
      switch (e) {
        case zl:
          return null;
        case Fi:
          if (!_I(t)) {
            if (t.char && t.char.length > 1)
              return t.char;
            if (t.which)
              return String.fromCharCode(t.which);
          }
          return null;
        case aa:
          return FS && !XS(t) ? null : t.data;
        default:
          return null;
      }
    }
    function jI(e, t, s, u) {
      var d;
      if (NI ? d = LI(e, s) : d = BI(e, s), !d)
        return null;
      var p = DI.getPooled(so.beforeInput, t, s, u);
      return p.data = d, $c(p), p;
    }
    var VI = {
      eventTypes: so,
      extractEvents: function(e, t, s, u, d) {
        var p = OI(e, t, s, u), w = jI(e, t, s, u);
        return p === null ? w : w === null ? p : [p, w];
      }
    }, UI = {
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
    function JS(e) {
      var t = e && e.nodeName && e.nodeName.toLowerCase();
      return t === "input" ? !!UI[e.type] : t === "textarea";
    }
    var qS = {
      change: {
        phasedRegistrationNames: {
          bubbled: "onChange",
          captured: "onChangeCapture"
        },
        dependencies: [Un, za, Il, Wi, Nl, Hn, si, ja]
      }
    };
    function KS(e, t, s) {
      var u = pr.getPooled(qS.change, e, t, s);
      return u.type = "change", Ti(s), $c(u), u;
    }
    var ah = null, sh = null;
    function HI(e) {
      var t = e.nodeName && e.nodeName.toLowerCase();
      return t === "select" || t === "input" && e.type === "file";
    }
    function WI(e) {
      var t = KS(sh, e, jl(e));
      Jr(FI, t);
    }
    function FI(e) {
      mc(e);
    }
    function Mm(e) {
      var t = au(e);
      if (Hu(t))
        return e;
    }
    function $I(e, t) {
      if (e === za)
        return t;
    }
    var Yg = !1;
    jn && (Yg = Vl("input") && (!document.documentMode || document.documentMode > 9));
    function QI(e, t) {
      ah = e, sh = t, ah.attachEvent("onpropertychange", tx);
    }
    function ex() {
      !ah || (ah.detachEvent("onpropertychange", tx), ah = null, sh = null);
    }
    function tx(e) {
      e.propertyName === "value" && Mm(sh) && WI(e);
    }
    function ZI(e, t, s) {
      e === Wi ? (ex(), QI(t, s)) : e === Un && ex();
    }
    function YI(e, t) {
      if (e === ja || e === si || e === Hn)
        return Mm(sh);
    }
    function GI(e) {
      var t = e.nodeName;
      return t && t.toLowerCase() === "input" && (e.type === "checkbox" || e.type === "radio");
    }
    function XI(e, t) {
      if (e === Il)
        return Mm(t);
    }
    function JI(e, t) {
      if (e === Nl || e === za)
        return Mm(t);
    }
    function qI(e) {
      var t = e._wrapperState;
      !t || !t.controlled || e.type !== "number" || bl(e, "number", e.value);
    }
    var KI = {
      eventTypes: qS,
      _isInputEventSupported: Yg,
      extractEvents: function(e, t, s, u, d) {
        var p = t ? au(t) : window, w, b;
        if (HI(p) ? w = $I : JS(p) ? Yg ? w = JI : (w = YI, b = ZI) : GI(p) && (w = XI), w) {
          var E = w(e, t);
          if (E) {
            var k = KS(E, s, u);
            return k;
          }
        }
        b && b(e, p, t), e === Un && qI(p);
      }
    }, oh = pr.extend({
      view: null,
      detail: null
    }), eA = {
      Alt: "altKey",
      Control: "ctrlKey",
      Meta: "metaKey",
      Shift: "shiftKey"
    };
    function tA(e) {
      var t = this, s = t.nativeEvent;
      if (s.getModifierState)
        return s.getModifierState(e);
      var u = eA[e];
      return u ? !!s[u] : !1;
    }
    function Gg(e) {
      return tA;
    }
    var nx = 0, ix = 0, rx = !1, ax = !1, lh = oh.extend({
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
      getModifierState: Gg,
      button: null,
      buttons: null,
      relatedTarget: function(e) {
        return e.relatedTarget || (e.fromElement === e.srcElement ? e.toElement : e.fromElement);
      },
      movementX: function(e) {
        if ("movementX" in e)
          return e.movementX;
        var t = nx;
        return nx = e.screenX, rx ? e.type === "mousemove" ? e.screenX - t : 0 : (rx = !0, 0);
      },
      movementY: function(e) {
        if ("movementY" in e)
          return e.movementY;
        var t = ix;
        return ix = e.screenY, ax ? e.type === "mousemove" ? e.screenY - t : 0 : (ax = !0, 0);
      }
    }), sx = lh.extend({
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
    }, nA = {
      eventTypes: uh,
      extractEvents: function(e, t, s, u, d) {
        var p = e === la || e === St, w = e === La || e === Ai;
        if (p && (d & Ui) === 0 && (s.relatedTarget || s.fromElement) || !w && !p)
          return null;
        var b;
        if (u.window === u)
          b = u;
        else {
          var E = u.ownerDocument;
          E ? b = E.defaultView || E.parentWindow : b = window;
        }
        var k, N;
        if (w) {
          k = t;
          var J = s.relatedTarget || s.toElement;
          if (N = J ? th(J) : null, N !== null) {
            var L = vi(N);
            (N !== L || N.tag !== Re && N.tag !== Qe) && (N = null);
          }
        } else
          k = null, N = t;
        if (k === N)
          return null;
        var K, me, we, Ke;
        e === La || e === la ? (K = lh, me = uh.mouseLeave, we = uh.mouseEnter, Ke = "mouse") : (e === Ai || e === St) && (K = sx, me = uh.pointerLeave, we = uh.pointerEnter, Ke = "pointer");
        var nt = k == null ? b : au(k), Pt = N == null ? b : au(N), vt = K.getPooled(me, k, s, u);
        vt.type = Ke + "leave", vt.target = nt, vt.relatedTarget = Pt;
        var Qt = K.getPooled(we, N, s, u);
        return Qt.type = Ke + "enter", Qt.target = Pt, Qt.relatedTarget = nt, SI(vt, Qt, k, N), (d & Ta) === 0 ? [vt] : [vt, Qt];
      }
    };
    function iA(e, t) {
      return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
    }
    var ou = typeof Object.is == "function" ? Object.is : iA, rA = Object.prototype.hasOwnProperty;
    function ch(e, t) {
      if (ou(e, t))
        return !0;
      if (typeof e != "object" || e === null || typeof t != "object" || t === null)
        return !1;
      var s = Object.keys(e), u = Object.keys(t);
      if (s.length !== u.length)
        return !1;
      for (var d = 0; d < s.length; d++)
        if (!rA.call(t, s[d]) || !ou(e[s[d]], t[s[d]]))
          return !1;
      return !0;
    }
    var aA = jn && "documentMode" in document && document.documentMode <= 11, ox = {
      select: {
        phasedRegistrationNames: {
          bubbled: "onSelect",
          captured: "onSelectCapture"
        },
        dependencies: [Un, Rl, Dl, Wi, Hn, si, oa, Pl, ja]
      }
    }, Yc = null, Xg = null, dh = null, Jg = !1;
    function sA(e) {
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
    function lx(e) {
      return e.window === e ? e.document : e.nodeType === Na ? e : e.ownerDocument;
    }
    function ux(e, t) {
      var s = lx(t);
      if (Jg || Yc == null || Yc !== Kl(s))
        return null;
      var u = sA(Yc);
      if (!dh || !ch(dh, u)) {
        dh = u;
        var d = pr.getPooled(ox.select, Xg, e, t);
        return d.type = "select", d.target = Yc, $c(d), d;
      }
      return null;
    }
    var oA = {
      eventTypes: ox,
      extractEvents: function(e, t, s, u, d, p) {
        var w = p || lx(u);
        if (!w || !jo("onSelect", w))
          return null;
        var b = t ? au(t) : window;
        switch (e) {
          case Wi:
            (JS(b) || b.contentEditable === "true") && (Yc = b, Xg = t, dh = null);
            break;
          case Un:
            Yc = null, Xg = null, dh = null;
            break;
          case oa:
            Jg = !0;
            break;
          case Rl:
          case Pl:
          case Dl:
            return Jg = !1, ux(s, u);
          case ja:
            if (aA)
              break;
          case Hn:
          case si:
            return ux(s, u);
        }
        return null;
      }
    }, lA = pr.extend({
      animationName: null,
      elapsedTime: null,
      pseudoElement: null
    }), uA = pr.extend({
      clipboardData: function(e) {
        return "clipboardData" in e ? e.clipboardData : window.clipboardData;
      }
    }), cA = oh.extend({
      relatedTarget: null
    });
    function Em(e) {
      var t, s = e.keyCode;
      return "charCode" in e ? (t = e.charCode, t === 0 && s === 13 && (t = 13)) : t = s, t === 10 && (t = 13), t >= 32 || t === 13 ? t : 0;
    }
    var dA = {
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
    }, fA = {
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
    function hA(e) {
      if (e.key) {
        var t = dA[e.key] || e.key;
        if (t !== "Unidentified")
          return t;
      }
      if (e.type === "keypress") {
        var s = Em(e);
        return s === 13 ? "Enter" : String.fromCharCode(s);
      }
      return e.type === "keydown" || e.type === "keyup" ? fA[e.keyCode] || "Unidentified" : "";
    }
    var pA = oh.extend({
      key: hA,
      location: null,
      ctrlKey: null,
      shiftKey: null,
      altKey: null,
      metaKey: null,
      repeat: null,
      locale: null,
      getModifierState: Gg,
      charCode: function(e) {
        return e.type === "keypress" ? Em(e) : 0;
      },
      keyCode: function(e) {
        return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
      },
      which: function(e) {
        return e.type === "keypress" ? Em(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
      }
    }), mA = lh.extend({
      dataTransfer: null
    }), vA = oh.extend({
      touches: null,
      targetTouches: null,
      changedTouches: null,
      altKey: null,
      metaKey: null,
      ctrlKey: null,
      shiftKey: null,
      getModifierState: Gg
    }), gA = pr.extend({
      propertyName: null,
      elapsedTime: null,
      pseudoElement: null
    }), yA = lh.extend({
      deltaX: function(e) {
        return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
      },
      deltaY: function(e) {
        return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
      },
      deltaZ: null,
      deltaMode: null
    }), wA = [Xd, ec, _s, Ps, Do, nc, Bs, sf, of, Ii, Nl, zr, Oa, lf, uf, ic, cf, df, ff, Or, Pn, En, Ba, Qn, sc, js, ko, mf, No, cc, dc], bA = {
      eventTypes: Nf,
      extractEvents: function(e, t, s, u, d) {
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
            w = pA;
            break;
          case Un:
          case Wi:
            w = cA;
            break;
          case Il:
            if (s.button === 2)
              return null;
          case zs:
          case nf:
          case oa:
          case _l:
          case Pl:
          case La:
          case la:
          case Rl:
            w = lh;
            break;
          case Np:
          case Dl:
          case Os:
          case rf:
          case kl:
          case af:
          case tc:
          case Ls:
            w = mA;
            break;
          case oc:
          case lc:
          case uc:
          case vf:
            w = vA;
            break;
          case kp:
          case Jd:
          case qd:
            w = lA;
            break;
          case Ll:
            w = gA;
            break;
          case Lr:
            w = oh;
            break;
          case gf:
            w = yA;
            break;
          case ef:
          case tf:
          case zl:
            w = uA;
            break;
          case sa:
          case rc:
          case hf:
          case pf:
          case ac:
          case Ai:
          case St:
          case sn:
            w = sx;
            break;
          default:
            wA.indexOf(e) === -1 && g("SimpleEventPlugin: Unhandled event type, `%s`. This warning is likely caused by a bug in React. Please file an issue.", e), w = pr;
            break;
        }
        var b = w.getPooled(p, t, s, u);
        return $c(b), b;
      }
    }, SA = ["ResponderEventPlugin", "SimpleEventPlugin", "EnterLeaveEventPlugin", "ChangeEventPlugin", "SelectEventPlugin", "BeforeInputEventPlugin"];
    ci(SA), fe(Fg, Zo, au), Mr({
      SimpleEventPlugin: bA,
      EnterLeaveEventPlugin: nA,
      ChangeEventPlugin: KI,
      SelectEventPlugin: oA,
      BeforeInputEventPlugin: VI
    });
    var cx = "\u269B", xA = "\u26D4", yi = typeof performance < "u" && typeof performance.mark == "function" && typeof performance.clearMarks == "function" && typeof performance.measure == "function" && typeof performance.clearMeasures == "function", lu = null, is = null, uu = null, Im = !1, Am = !1, qg = !1, fh = 0, rs = 0, Rm = /* @__PURE__ */ new Set(), Kg = function(e) {
      return cx + " " + e;
    }, CA = function(e, t) {
      var s = t ? xA + " " : cx + " ", u = t ? " Warning: " + t : "";
      return "" + s + e + u;
    }, Gc = function(e) {
      performance.mark(Kg(e));
    }, TA = function(e) {
      performance.clearMarks(Kg(e));
    }, Xc = function(e, t, s) {
      var u = Kg(t), d = CA(e, s);
      try {
        performance.measure(d, u);
      } catch {
      }
      performance.clearMarks(u), performance.clearMeasures(d);
    }, ey = function(e, t) {
      return e + " (#" + t + ")";
    }, ty = function(e, t, s) {
      return s === null ? e + " [" + (t ? "update" : "mount") + "]" : e + "." + s;
    }, ny = function(e, t) {
      var s = Te(e.type) || "Unknown", u = e._debugID, d = e.alternate !== null, p = ty(s, d, t);
      if (Im && Rm.has(p))
        return !1;
      Rm.add(p);
      var w = ey(p, u);
      return Gc(w), !0;
    }, dx = function(e, t) {
      var s = Te(e.type) || "Unknown", u = e._debugID, d = e.alternate !== null, p = ty(s, d, t), w = ey(p, u);
      TA(w);
    }, Dm = function(e, t, s) {
      var u = Te(e.type) || "Unknown", d = e._debugID, p = e.alternate !== null, w = ty(u, p, t), b = ey(w, d);
      Xc(w, b, s);
    }, km = function(e) {
      switch (e.tag) {
        case Se:
        case Re:
        case Qe:
        case Ue:
        case Tt:
        case re:
        case Ge:
        case Bt:
          return !0;
        default:
          return !1;
      }
    }, MA = function() {
      is !== null && uu !== null && dx(uu, is), uu = null, is = null, qg = !1;
    }, EA = function() {
      for (var e = lu; e; )
        e._debugIsCurrentlyTiming && Dm(e, null, null), e = e.return;
    }, fx = function(e) {
      e.return !== null && fx(e.return), e._debugIsCurrentlyTiming && ny(e, null);
    }, IA = function() {
      lu !== null && fx(lu);
    };
    function Nm() {
      rs++;
    }
    function AA() {
      Im && (Am = !0), is !== null && is !== "componentWillMount" && is !== "componentWillReceiveProps" && (qg = !0);
    }
    function hx(e) {
      {
        if (!yi || km(e) || (lu = e, !ny(e, null)))
          return;
        e._debugIsCurrentlyTiming = !0;
      }
    }
    function px(e) {
      {
        if (!yi || km(e))
          return;
        e._debugIsCurrentlyTiming = !1, dx(e, null);
      }
    }
    function mx(e) {
      {
        if (!yi || km(e) || (lu = e.return, !e._debugIsCurrentlyTiming))
          return;
        e._debugIsCurrentlyTiming = !1, Dm(e, null, null);
      }
    }
    function RA(e) {
      {
        if (!yi || km(e) || (lu = e.return, !e._debugIsCurrentlyTiming))
          return;
        e._debugIsCurrentlyTiming = !1;
        var t = e.tag === ee ? "Rendering was suspended" : "An error was thrown inside this error boundary";
        Dm(e, null, t);
      }
    }
    function as(e, t) {
      {
        if (!yi || (MA(), !ny(e, t)))
          return;
        uu = e, is = t;
      }
    }
    function ss() {
      {
        if (!yi)
          return;
        if (is !== null && uu !== null) {
          var e = qg ? "Scheduled a cascading update" : null;
          Dm(uu, is, e);
        }
        is = null, uu = null;
      }
    }
    function vx(e) {
      {
        if (lu = e, !yi)
          return;
        fh = 0, Gc("(React Tree Reconciliation)"), IA();
      }
    }
    function gx(e, t) {
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
        EA(), Xc(d, "(React Tree Reconciliation)", s);
      }
    }
    function DA() {
      {
        if (!yi)
          return;
        Im = !0, Am = !1, Rm.clear(), Gc("(Committing Changes)");
      }
    }
    function kA() {
      {
        if (!yi)
          return;
        var e = null;
        Am ? e = "Lifecycle hook scheduled a cascading update" : fh > 0 && (e = "Caused by a cascading update in earlier commit"), Am = !1, fh++, Im = !1, Rm.clear(), Xc("(Committing Changes)", "(Committing Changes)", e);
      }
    }
    function yx() {
      {
        if (!yi)
          return;
        rs = 0, Gc("(Committing Snapshot Effects)");
      }
    }
    function wx() {
      {
        if (!yi)
          return;
        var e = rs;
        rs = 0, Xc("(Committing Snapshot Effects: " + e + " Total)", "(Committing Snapshot Effects)", null);
      }
    }
    function bx() {
      {
        if (!yi)
          return;
        rs = 0, Gc("(Committing Host Effects)");
      }
    }
    function Sx() {
      {
        if (!yi)
          return;
        var e = rs;
        rs = 0, Xc("(Committing Host Effects: " + e + " Total)", "(Committing Host Effects)", null);
      }
    }
    function xx() {
      {
        if (!yi)
          return;
        rs = 0, Gc("(Calling Lifecycle Methods)");
      }
    }
    function Cx() {
      {
        if (!yi)
          return;
        var e = rs;
        rs = 0, Xc("(Calling Lifecycle Methods: " + e + " Total)", "(Calling Lifecycle Methods)", null);
      }
    }
    var iy = [], _m;
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
      t !== _m[oo] && g("Unexpected Fiber popped."), e.current = iy[oo], iy[oo] = null, _m[oo] = null, oo--;
    }
    function Oi(e, t, s) {
      oo++, iy[oo] = e.current, _m[oo] = s, e.current = t;
    }
    var ry;
    ry = {};
    var mr = {};
    Object.freeze(mr);
    var lo = cu(mr), os = cu(!1), ay = mr;
    function Jc(e, t, s) {
      return s && ls(t) ? ay : lo.current;
    }
    function Tx(e, t, s) {
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
        for (var w in u)
          p[w] = t[w];
        {
          var b = Te(s) || "Unknown";
          l(u, p, "context", b, ft);
        }
        return d && Tx(e, t, p), p;
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
    function sy(e) {
      zi(os, e), zi(lo, e);
    }
    function Mx(e, t, s) {
      {
        if (lo.current !== mr)
          throw Error("Unexpected context found on stack. This error is likely caused by a bug in React. Please file an issue.");
        Oi(lo, t, e), Oi(os, s, e);
      }
    }
    function Ex(e, t, s) {
      {
        var u = e.stateNode, d = t.childContextTypes;
        if (typeof u.getChildContext != "function") {
          {
            var p = Te(t) || "Unknown";
            ry[p] || (ry[p] = !0, g("%s.childContextTypes is specified but there is no getChildContext() method on the instance. You can either define getChildContext() on %s or remove childContextTypes from it.", p, p));
          }
          return s;
        }
        var w;
        as(e, "getChildContext"), w = u.getChildContext(), ss();
        for (var b in w)
          if (!(b in d))
            throw Error((Te(t) || "Unknown") + '.getChildContext(): key "' + b + '" is not defined in childContextTypes.');
        {
          var E = Te(t) || "Unknown";
          l(
            d,
            w,
            "child context",
            E,
            ft
          );
        }
        return n({}, s, {}, w);
      }
    }
    function Om(e) {
      {
        var t = e.stateNode, s = t && t.__reactInternalMemoizedMergedChildContext || mr;
        return ay = lo.current, Oi(lo, s, e), Oi(os, os.current, e), !0;
      }
    }
    function Ix(e, t, s) {
      {
        var u = e.stateNode;
        if (!u)
          throw Error("Expected to have an instance by this point. This error is likely caused by a bug in React. Please file an issue.");
        if (s) {
          var d = Ex(e, t, ay);
          u.__reactInternalMemoizedMergedChildContext = d, zi(os, e), zi(lo, e), Oi(lo, d, e), Oi(os, s, e);
        } else
          zi(os, e), Oi(os, s, e);
      }
    }
    function NA(e) {
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
    var Ax = 0, _A = 1, PA = 2, zA = o.unstable_runWithPriority, oy = o.unstable_scheduleCallback, Rx = o.unstable_cancelCallback, OA = o.unstable_shouldYield, Dx = o.unstable_requestPaint, ly = o.unstable_now, LA = o.unstable_getCurrentPriorityLevel, Lm = o.unstable_ImmediatePriority, kx = o.unstable_UserBlockingPriority, Nx = o.unstable_NormalPriority, _x = o.unstable_LowPriority, Px = o.unstable_IdlePriority;
    if (!(h.__interactionsRef != null && h.__interactionsRef.current != null))
      throw Error("It is not supported to run the profiling version of a renderer (for example, `react-dom/profiling`) without also replacing the `scheduler/tracing` module with `scheduler/tracing-profiling`. Your bundler might have a setting for aliasing both modules. Learn more at http://fb.me/react-profiling");
    var zx = {}, Li = 99, Yo = 98, ha = 97, uy = 96, hh = 95, Kc = 90, BA = OA, jA = Dx !== void 0 ? Dx : function() {
    }, uo = null, Bm = null, cy = !1, Ox = ly(), vr = Ox < 1e4 ? ly : function() {
      return ly() - Ox;
    };
    function ed() {
      switch (LA()) {
        case Lm:
          return Li;
        case kx:
          return Yo;
        case Nx:
          return ha;
        case _x:
          return uy;
        case Px:
          return hh;
        default:
          throw Error("Unknown priority level.");
      }
    }
    function Lx(e) {
      switch (e) {
        case Li:
          return Lm;
        case Yo:
          return kx;
        case ha:
          return Nx;
        case uy:
          return _x;
        case hh:
          return Px;
        default:
          throw Error("Unknown priority level.");
      }
    }
    function co(e, t) {
      var s = Lx(e);
      return zA(s, t);
    }
    function ph(e, t, s) {
      var u = Lx(e);
      return oy(u, t, s);
    }
    function Bx(e) {
      return uo === null ? (uo = [e], Bm = oy(Lm, jx)) : uo.push(e), zx;
    }
    function VA(e) {
      e !== zx && Rx(e);
    }
    function us() {
      if (Bm !== null) {
        var e = Bm;
        Bm = null, Rx(e);
      }
      jx();
    }
    function jx() {
      if (!cy && uo !== null) {
        cy = !0;
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
          throw uo !== null && (uo = uo.slice(e + 1)), oy(Lm, us), u;
        } finally {
          cy = !1;
        }
      }
    }
    var oi = 0, yn = 1, Hr = 2, td = 4, cs = 8, mh = 1073741823, Ae = 0, ds = 1, du = 2, Vx = 3, Ct = mh, Ux = Ct - 1, jm = 10, Vm = Ux - 1;
    function dy(e) {
      return Vm - (e / jm | 0);
    }
    function fu(e) {
      return (Vm - e) * jm;
    }
    function UA(e, t) {
      return ((e / t | 0) + 1) * t;
    }
    function fy(e, t, s) {
      return Vm - UA(Vm - e + t / jm, s / jm);
    }
    var vh = 5e3, hy = 250;
    function HA(e) {
      return fy(e, vh, hy);
    }
    function WA(e, t) {
      return fy(e, t, hy);
    }
    var Hx = 500, Wx = 100;
    function Fx(e) {
      return fy(e, Hx, Wx);
    }
    function $x(e, t) {
      if (t === Ct)
        return Li;
      if (t === ds || t === du)
        return hh;
      var s = fu(t) - fu(e);
      return s <= 0 ? Li : s <= Hx + Wx ? Yo : s <= vh + hy ? ha : hh;
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
      var FA = function(e) {
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
          var w = hu(t);
          g(`Using UNSAFE_componentWillMount in strict mode is not recommended and may indicate bugs in your code. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move code with side effects to componentDidMount, and set initial state in the constructor.

Please update the following components: %s`, w);
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
          var k = hu(e);
          y(`componentWillMount has been renamed, and is not recommended for use. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move code with side effects to componentDidMount, and set initial state in the constructor.
* Rename componentWillMount to UNSAFE_componentWillMount to suppress this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: %s`, k);
        }
        if (s.size > 0) {
          var N = hu(s);
          y(`componentWillReceiveProps has been renamed, and is not recommended for use. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move data fetching code or side effects to componentDidUpdate.
* If you're updating state whenever props change, refactor your code to use memoization techniques or move it to static getDerivedStateFromProps. Learn more at: https://fb.me/react-derived-state
* Rename componentWillReceiveProps to UNSAFE_componentWillReceiveProps to suppress this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: %s`, N);
        }
        if (d.size > 0) {
          var J = hu(d);
          y(`componentWillUpdate has been renamed, and is not recommended for use. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move data fetching code or side effects to componentDidUpdate.
* Rename componentWillUpdate to UNSAFE_componentWillUpdate to suppress this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: %s`, J);
        }
      };
      var Um = /* @__PURE__ */ new Map(), Qx = /* @__PURE__ */ new Set();
      pa.recordLegacyContextWarning = function(e, t) {
        var s = FA(e);
        if (s === null) {
          g("Expected to find a StrictMode component in a strict mode tree. This error is likely caused by a bug in React. Please file an issue.");
          return;
        }
        if (!Qx.has(e.type)) {
          var u = Um.get(s);
          (e.type.contextTypes != null || e.type.childContextTypes != null || t !== null && typeof t.getChildContext == "function") && (u === void 0 && (u = [], Um.set(s, u)), u.push(e));
        }
      }, pa.flushLegacyContextWarning = function() {
        Um.forEach(function(e, t) {
          if (e.length !== 0) {
            var s = e[0], u = /* @__PURE__ */ new Set();
            e.forEach(function(w) {
              u.add(Te(w.type) || "Component"), Qx.add(w.type);
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
    var Wr = null, nd = null, $A = function(e) {
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
    function py(e) {
      return id(e);
    }
    function my(e) {
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
    function Zx(e, t) {
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
          var w = Wr(s);
          if (w !== void 0 && w === Wr(u))
            return !0;
        }
        return !1;
      }
    }
    function Yx(e) {
      {
        if (Wr === null || typeof WeakSet != "function")
          return;
        nd === null && (nd = /* @__PURE__ */ new WeakSet()), nd.add(e);
      }
    }
    var QA = function(e, t) {
      {
        if (Wr === null)
          return;
        var s = t.staleFamilies, u = t.updatedFamilies;
        tl(), yC(function() {
          vy(e.current, u, s);
        });
      }
    }, ZA = function(e, t) {
      {
        if (e.context !== mr)
          return;
        tl(), wR(function() {
          Uh(t, e, null, null);
        });
      }
    };
    function vy(e, t, s) {
      {
        var u = e.alternate, d = e.child, p = e.sibling, w = e.tag, b = e.type, E = null;
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
        var k = !1, N = !1;
        if (E !== null) {
          var J = Wr(E);
          J !== void 0 && (s.has(J) ? N = !0 : t.has(J) && (w === ce ? N = !0 : k = !0));
        }
        nd !== null && (nd.has(e) || u !== null && nd.has(u)) && (N = !0), N && (e._debugNeedsRemount = !0), (N || k) && Zr(e, Ct), d !== null && !N && vy(d, t, s), p !== null && vy(p, t, s);
      }
    }
    var YA = function(e, t) {
      {
        var s = /* @__PURE__ */ new Set(), u = new Set(t.map(function(d) {
          return d.current;
        }));
        return gy(e.current, u, s), s;
      }
    };
    function gy(e, t, s) {
      {
        var u = e.child, d = e.sibling, p = e.tag, w = e.type, b = null;
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
        b !== null && t.has(b) && (E = !0), E ? GA(e, s) : u !== null && gy(u, t, s), d !== null && gy(d, t, s);
      }
    }
    function GA(e, t) {
      {
        var s = XA(e, t);
        if (s)
          return;
        for (var u = e; ; ) {
          switch (u.tag) {
            case Re:
              t.add(u.stateNode);
              return;
            case Ue:
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
    function XA(e, t) {
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
    function JA(e) {
      if (yp(e), e._status !== Rs)
        throw e._result;
      return e._result;
    }
    var yy = cu(null), wy;
    wy = {};
    var Hm = null, rd = null, Wm = null, Fm = !1;
    function $m() {
      Hm = null, rd = null, Wm = null, Fm = !1;
    }
    function Gx() {
      Fm = !0;
    }
    function Xx() {
      Fm = !1;
    }
    function Jx(e, t) {
      var s = e.type._context;
      Oi(yy, s._currentValue, e), s._currentValue = t, s._currentRenderer !== void 0 && s._currentRenderer !== null && s._currentRenderer !== wy && g("Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported."), s._currentRenderer = wy;
    }
    function by(e) {
      var t = yy.current;
      zi(yy, e);
      var s = e.type._context;
      s._currentValue = t;
    }
    function qA(e, t, s) {
      if (ou(s, t))
        return 0;
      var u = typeof e._calculateChangedBits == "function" ? e._calculateChangedBits(s, t) : mh;
      return (u & mh) !== u && g("calculateChangedBits: Expected the return value to be a 31-bit integer. Instead received: %s", u), u | 0;
    }
    function qx(e, t) {
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
    function KA(e, t, s, u) {
      var d = e.child;
      for (d !== null && (d.return = e); d !== null; ) {
        var p = void 0, w = d.dependencies;
        if (w !== null) {
          p = d.child;
          for (var b = w.firstContext; b !== null; ) {
            if (b.context === t && (b.observedBits & s) !== 0) {
              if (d.tag === ce) {
                var E = Go(u, null);
                E.tag = Qm, Xo(d, E);
              }
              d.expirationTime < u && (d.expirationTime = u);
              var k = d.alternate;
              k !== null && k.expirationTime < u && (k.expirationTime = u), qx(d.return, u), w.expirationTime < u && (w.expirationTime = u);
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
            var N = p.sibling;
            if (N !== null) {
              N.return = p.return, p = N;
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
        u !== null && (s.expirationTime >= t && Mw(), s.firstContext = null);
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
    var Kx = 0, e0 = 1, Qm = 2, Sy = 3, Zm = !1, xy, Ym;
    xy = !1, Ym = null;
    function Cy(e) {
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
    function Ty(e, t) {
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
        tag: Kx,
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
        d === null ? t.next = t : (t.next = d.next, d.next = t), u.pending = t, Ym === u && !xy && (g("An update (setState, replaceState, or forceUpdate) was scheduled from inside an update function. Update functions should be pure, with zero side-effects. Consider using componentDidUpdate or a callback."), xy = !0);
      }
    }
    function t0(e, t) {
      var s = e.alternate;
      s !== null && Ty(s, e);
      var u = e.updateQueue, d = u.baseQueue;
      d === null ? (u.baseQueue = t.next = t, t.next = t) : (t.next = d.next, d.next = t);
    }
    function e1(e, t, s, u, d, p) {
      switch (s.tag) {
        case e0: {
          var w = s.payload;
          if (typeof w == "function") {
            Gx(), e.mode & yn && w.call(p, u, d);
            var b = w.call(p, u, d);
            return Xx(), b;
          }
          return w;
        }
        case Sy:
          e.effectTag = e.effectTag & ~mi | Vt;
        case Kx: {
          var E = s.payload, k;
          return typeof E == "function" ? (Gx(), e.mode & yn && E.call(p, u, d), k = E.call(p, u, d), Xx()) : k = E, k == null ? u : n({}, u, k);
        }
        case Qm:
          return Zm = !0, u;
      }
      return u;
    }
    function Ch(e, t, s, u) {
      var d = e.updateQueue;
      Zm = !1, Ym = d.shared;
      var p = d.baseQueue, w = d.shared.pending;
      if (w !== null) {
        if (p !== null) {
          var b = p.next, E = w.next;
          p.next = E, w.next = b;
        }
        p = w, d.shared.pending = null;
        var k = e.alternate;
        if (k !== null) {
          var N = k.updateQueue;
          N !== null && (N.baseQueue = w);
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
              xC(Pt, nt.suspenseConfig), L = e1(e, d, nt, L, t, s);
              var F = nt.callback;
              if (F !== null) {
                e.effectTag |= bf;
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
    function t1(e, t) {
      if (typeof e != "function")
        throw Error("Invalid argument passed as callback. Expected a function. Instead received: " + e);
      e.call(t);
    }
    function n0() {
      Zm = !1;
    }
    function Gm() {
      return Zm;
    }
    function i0(e, t, s) {
      var u = t.effects;
      if (t.effects = null, u !== null)
        for (var d = 0; d < u.length; d++) {
          var p = u[d], w = p.callback;
          w !== null && (p.callback = null, t1(w, s));
        }
    }
    var n1 = m.ReactCurrentBatchConfig;
    function Th() {
      return n1.suspense;
    }
    var My = {}, i1 = Array.isArray, r0 = new r.Component().refs, Ey, Iy, Ay, Ry, Dy, a0, Xm, ky, Ny, _y;
    {
      Ey = /* @__PURE__ */ new Set(), Iy = /* @__PURE__ */ new Set(), Ay = /* @__PURE__ */ new Set(), Ry = /* @__PURE__ */ new Set(), ky = /* @__PURE__ */ new Set(), Dy = /* @__PURE__ */ new Set(), Ny = /* @__PURE__ */ new Set(), _y = /* @__PURE__ */ new Set();
      var s0 = /* @__PURE__ */ new Set();
      Xm = function(e, t) {
        if (!(e === null || typeof e == "function")) {
          var s = t + "_" + e;
          s0.has(s) || (s0.add(s), g("%s(...): Expected the last optional `callback` argument to be a function. Instead received: %s.", t, e));
        }
      }, a0 = function(e, t) {
        if (t === void 0) {
          var s = Te(e) || "Component";
          Dy.has(s) || (Dy.add(s), g("%s.getDerivedStateFromProps(): A valid state object (or null) must be returned. You have returned undefined.", s));
        }
      }, Object.defineProperty(My, "_processChildContext", {
        enumerable: !1,
        value: function() {
          throw Error("_processChildContext is not available in React 16+. This likely means you have multiple copies of React and are attempting to nest a React 15 tree inside a React 16 tree using unstable_renderSubtreeIntoContainer, which isn't supported. Try to make sure you have only one copy of React (and ideally, switch to ReactDOM.createPortal).");
        }
      }), Object.freeze(My);
    }
    function Jm(e, t, s, u) {
      var d = e.memoizedState;
      e.mode & yn && s(u, d);
      var p = s(u, d);
      a0(t, p);
      var w = p == null ? d : n({}, d, p);
      if (e.memoizedState = w, e.expirationTime === Ae) {
        var b = e.updateQueue;
        b.baseState = w;
      }
    }
    var Py = {
      isMounted: Wa,
      enqueueSetState: function(e, t, s) {
        var u = ua(e), d = ps(), p = Th(), w = Cu(d, u, p), b = Go(w, p);
        b.payload = t, s != null && (Xm(s, "setState"), b.callback = s), Xo(u, b), Zr(u, w);
      },
      enqueueReplaceState: function(e, t, s) {
        var u = ua(e), d = ps(), p = Th(), w = Cu(d, u, p), b = Go(w, p);
        b.tag = e0, b.payload = t, s != null && (Xm(s, "replaceState"), b.callback = s), Xo(u, b), Zr(u, w);
      },
      enqueueForceUpdate: function(e, t) {
        var s = ua(e), u = ps(), d = Th(), p = Cu(u, s, d), w = Go(p, d);
        w.tag = Qm, t != null && (Xm(t, "forceUpdate"), w.callback = t), Xo(s, w), Zr(s, p);
      }
    };
    function o0(e, t, s, u, d, p, w) {
      var b = e.stateNode;
      if (typeof b.shouldComponentUpdate == "function") {
        e.mode & yn && b.shouldComponentUpdate(u, p, w), as(e, "shouldComponentUpdate");
        var E = b.shouldComponentUpdate(u, p, w);
        return ss(), E === void 0 && g("%s.shouldComponentUpdate(): Returned undefined instead of a boolean value. Make sure to return true or false.", Te(t) || "Component"), E;
      }
      return t.prototype && t.prototype.isPureReactComponent ? !ch(s, u) || !ch(d, p) : !0;
    }
    function r1(e, t, s) {
      var u = e.stateNode;
      {
        var d = Te(t) || "Component", p = u.render;
        p || (t.prototype && typeof t.prototype.render == "function" ? g("%s(...): No `render` method found on the returned component instance: did you accidentally return an object from the constructor?", d) : g("%s(...): No `render` method found on the returned component instance: you may have forgotten to define `render`.", d)), u.getInitialState && !u.getInitialState.isReactClassApproved && !u.state && g("getInitialState was defined on %s, a plain JavaScript class. This is only supported for classes created using React.createClass. Did you mean to define a state property instead?", d), u.getDefaultProps && !u.getDefaultProps.isReactClassApproved && g("getDefaultProps was defined on %s, a plain JavaScript class. This is only supported for classes created using React.createClass. Use a static property to define defaultProps instead.", d), u.propTypes && g("propTypes was defined as an instance property on %s. Use a static property to define propTypes instead.", d), u.contextType && g("contextType was defined as an instance property on %s. Use a static property to define contextType instead.", d), u.contextTypes && g("contextTypes was defined as an instance property on %s. Use a static property to define contextTypes instead.", d), t.contextType && t.contextTypes && !Ny.has(t) && (Ny.add(t), g("%s declares both contextTypes and contextType static properties. The legacy contextTypes property will be ignored.", d)), typeof u.componentShouldUpdate == "function" && g("%s has a method called componentShouldUpdate(). Did you mean shouldComponentUpdate()? The name is phrased as a question because the function is expected to return a value.", d), t.prototype && t.prototype.isPureReactComponent && typeof u.shouldComponentUpdate < "u" && g("%s has a method called shouldComponentUpdate(). shouldComponentUpdate should not be used when extending React.PureComponent. Please extend React.Component if shouldComponentUpdate is used.", Te(t) || "A pure component"), typeof u.componentDidUnmount == "function" && g("%s has a method called componentDidUnmount(). But there is no such lifecycle method. Did you mean componentWillUnmount()?", d), typeof u.componentDidReceiveProps == "function" && g("%s has a method called componentDidReceiveProps(). But there is no such lifecycle method. If you meant to update the state in response to changing props, use componentWillReceiveProps(). If you meant to fetch data or run side-effects or mutations after React has updated the UI, use componentDidUpdate().", d), typeof u.componentWillRecieveProps == "function" && g("%s has a method called componentWillRecieveProps(). Did you mean componentWillReceiveProps()?", d), typeof u.UNSAFE_componentWillRecieveProps == "function" && g("%s has a method called UNSAFE_componentWillRecieveProps(). Did you mean UNSAFE_componentWillReceiveProps()?", d);
        var w = u.props !== s;
        u.props !== void 0 && w && g("%s(...): When calling super() in `%s`, make sure to pass up the same props that your component's constructor was passed.", d, d), u.defaultProps && g("Setting defaultProps as an instance property on %s is not supported and will be ignored. Instead, define defaultProps as a static property on %s.", d, d), typeof u.getSnapshotBeforeUpdate == "function" && typeof u.componentDidUpdate != "function" && !Ay.has(t) && (Ay.add(t), g("%s: getSnapshotBeforeUpdate() should be used with componentDidUpdate(). This component defines getSnapshotBeforeUpdate() only.", Te(t))), typeof u.getDerivedStateFromProps == "function" && g("%s: getDerivedStateFromProps() is defined as an instance method and will be ignored. Instead, declare it as a static method.", d), typeof u.getDerivedStateFromError == "function" && g("%s: getDerivedStateFromError() is defined as an instance method and will be ignored. Instead, declare it as a static method.", d), typeof t.getSnapshotBeforeUpdate == "function" && g("%s: getSnapshotBeforeUpdate() is defined as a static method and will be ignored. Instead, declare it as an instance method.", d);
        var b = u.state;
        b && (typeof b != "object" || i1(b)) && g("%s.state: must be set to an object or null", d), typeof u.getChildContext == "function" && typeof t.childContextTypes != "object" && g("%s.getChildContext(): childContextTypes must be defined in order to use getChildContext().", d);
      }
    }
    function l0(e, t) {
      t.updater = Py, e.stateNode = t, Pp(t, e), t._reactInternalInstance = My;
    }
    function u0(e, t, s) {
      var u = !1, d = mr, p = mr, w = t.contextType;
      if ("contextType" in t) {
        var b = w === null || w !== void 0 && w.$$typeof === xn && w._context === void 0;
        if (!b && !_y.has(t)) {
          _y.add(t);
          var E = "";
          w === void 0 ? E = " However, it is set to undefined. This can be caused by a typo or by mixing up named and default imports. This can also happen due to a circular dependency, so try moving the createContext() call to a separate file." : typeof w != "object" ? E = " However, it is set to a " + typeof w + "." : w.$$typeof === gn ? E = " Did you accidentally pass the Context.Provider instead?" : w._context !== void 0 ? E = " Did you accidentally pass the Context.Consumer instead?" : E = " However, it is set to an object with keys {" + Object.keys(w).join(", ") + "}.", g("%s defines an invalid contextType. contextType should point to the Context object returned by React.createContext().%s", Te(t) || "Component", E);
        }
      }
      if (typeof w == "object" && w !== null)
        p = Bn(w);
      else {
        d = Jc(e, t, !0);
        var k = t.contextTypes;
        u = k != null, p = u ? qc(e, d) : mr;
      }
      e.mode & yn && new t(s, p);
      var N = new t(s, p), J = e.memoizedState = N.state !== null && N.state !== void 0 ? N.state : null;
      l0(e, N);
      {
        if (typeof t.getDerivedStateFromProps == "function" && J === null) {
          var L = Te(t) || "Component";
          Iy.has(L) || (Iy.add(L), g("`%s` uses `getDerivedStateFromProps` but its initial state is %s. This is not recommended. Instead, define the initial state by assigning an object to `this.state` in the constructor of `%s`. This ensures that `getDerivedStateFromProps` arguments have a consistent shape.", L, N.state === null ? "null" : "undefined", L));
        }
        if (typeof t.getDerivedStateFromProps == "function" || typeof N.getSnapshotBeforeUpdate == "function") {
          var K = null, me = null, we = null;
          if (typeof N.componentWillMount == "function" && N.componentWillMount.__suppressDeprecationWarning !== !0 ? K = "componentWillMount" : typeof N.UNSAFE_componentWillMount == "function" && (K = "UNSAFE_componentWillMount"), typeof N.componentWillReceiveProps == "function" && N.componentWillReceiveProps.__suppressDeprecationWarning !== !0 ? me = "componentWillReceiveProps" : typeof N.UNSAFE_componentWillReceiveProps == "function" && (me = "UNSAFE_componentWillReceiveProps"), typeof N.componentWillUpdate == "function" && N.componentWillUpdate.__suppressDeprecationWarning !== !0 ? we = "componentWillUpdate" : typeof N.UNSAFE_componentWillUpdate == "function" && (we = "UNSAFE_componentWillUpdate"), K !== null || me !== null || we !== null) {
            var Ke = Te(t) || "Component", nt = typeof t.getDerivedStateFromProps == "function" ? "getDerivedStateFromProps()" : "getSnapshotBeforeUpdate()";
            Ry.has(Ke) || (Ry.add(Ke), g(`Unsafe legacy lifecycles will not be called for components using new component APIs.

%s uses %s but also contains the following legacy lifecycles:%s%s%s

The above lifecycles should be removed. Learn more about this warning here:
https://fb.me/react-unsafe-component-lifecycles`, Ke, nt, K !== null ? `
  ` + K : "", me !== null ? `
  ` + me : "", we !== null ? `
  ` + we : ""));
          }
        }
      }
      return u && Tx(e, d, p), N;
    }
    function a1(e, t) {
      as(e, "componentWillMount");
      var s = t.state;
      typeof t.componentWillMount == "function" && t.componentWillMount(), typeof t.UNSAFE_componentWillMount == "function" && t.UNSAFE_componentWillMount(), ss(), s !== t.state && (g("%s.componentWillMount(): Assigning directly to this.state is deprecated (except inside a component's constructor). Use setState instead.", Te(e.type) || "Component"), Py.enqueueReplaceState(t, t.state, null));
    }
    function c0(e, t, s, u) {
      var d = t.state;
      if (as(e, "componentWillReceiveProps"), typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(s, u), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(s, u), ss(), t.state !== d) {
        {
          var p = Te(e.type) || "Component";
          Ey.has(p) || (Ey.add(p), g("%s.componentWillReceiveProps(): Assigning directly to this.state is deprecated (except inside a component's constructor). Use setState instead.", p));
        }
        Py.enqueueReplaceState(t, t.state, null);
      }
    }
    function zy(e, t, s, u) {
      r1(e, t, s);
      var d = e.stateNode;
      d.props = s, d.state = e.memoizedState, d.refs = r0, Cy(e);
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
          ky.has(b) || (ky.add(b), g("%s: It is not recommended to assign props directly to state because updates to props won't be reflected in state. In most cases, it is better to use props directly.", b));
        }
        e.mode & yn && pa.recordLegacyContextWarning(e, d), pa.recordUnsafeLifecycleWarnings(e, d);
      }
      Ch(e, s, d, u), d.state = e.memoizedState;
      var E = t.getDerivedStateFromProps;
      typeof E == "function" && (Jm(e, t, E, s), d.state = e.memoizedState), typeof t.getDerivedStateFromProps != "function" && typeof d.getSnapshotBeforeUpdate != "function" && (typeof d.UNSAFE_componentWillMount == "function" || typeof d.componentWillMount == "function") && (a1(e, d), Ch(e, s, d, u), d.state = e.memoizedState), typeof d.componentDidMount == "function" && (e.effectTag |= xt);
    }
    function s1(e, t, s, u) {
      var d = e.stateNode, p = e.memoizedProps;
      d.props = p;
      var w = d.context, b = t.contextType, E = mr;
      if (typeof b == "object" && b !== null)
        E = Bn(b);
      else {
        var k = Jc(e, t, !0);
        E = qc(e, k);
      }
      var N = t.getDerivedStateFromProps, J = typeof N == "function" || typeof d.getSnapshotBeforeUpdate == "function";
      !J && (typeof d.UNSAFE_componentWillReceiveProps == "function" || typeof d.componentWillReceiveProps == "function") && (p !== s || w !== E) && c0(e, d, s, E), n0();
      var L = e.memoizedState, K = d.state = L;
      if (Ch(e, s, d, u), K = e.memoizedState, p === s && L === K && !Pm() && !Gm())
        return typeof d.componentDidMount == "function" && (e.effectTag |= xt), !1;
      typeof N == "function" && (Jm(e, t, N, s), K = e.memoizedState);
      var me = Gm() || o0(e, t, p, s, L, K, E);
      return me ? (!J && (typeof d.UNSAFE_componentWillMount == "function" || typeof d.componentWillMount == "function") && (as(e, "componentWillMount"), typeof d.componentWillMount == "function" && d.componentWillMount(), typeof d.UNSAFE_componentWillMount == "function" && d.UNSAFE_componentWillMount(), ss()), typeof d.componentDidMount == "function" && (e.effectTag |= xt)) : (typeof d.componentDidMount == "function" && (e.effectTag |= xt), e.memoizedProps = s, e.memoizedState = K), d.props = s, d.state = K, d.context = E, me;
    }
    function o1(e, t, s, u, d) {
      var p = t.stateNode;
      Ty(e, t);
      var w = t.memoizedProps;
      p.props = t.type === t.elementType ? w : ma(t.type, w);
      var b = p.context, E = s.contextType, k = mr;
      if (typeof E == "object" && E !== null)
        k = Bn(E);
      else {
        var N = Jc(t, s, !0);
        k = qc(t, N);
      }
      var J = s.getDerivedStateFromProps, L = typeof J == "function" || typeof p.getSnapshotBeforeUpdate == "function";
      !L && (typeof p.UNSAFE_componentWillReceiveProps == "function" || typeof p.componentWillReceiveProps == "function") && (w !== u || b !== k) && c0(t, p, u, k), n0();
      var K = t.memoizedState, me = p.state = K;
      if (Ch(t, u, p, d), me = t.memoizedState, w === u && K === me && !Pm() && !Gm())
        return typeof p.componentDidUpdate == "function" && (w !== e.memoizedProps || K !== e.memoizedState) && (t.effectTag |= xt), typeof p.getSnapshotBeforeUpdate == "function" && (w !== e.memoizedProps || K !== e.memoizedState) && (t.effectTag |= Va), !1;
      typeof J == "function" && (Jm(t, s, J, u), me = t.memoizedState);
      var we = Gm() || o0(t, s, w, u, K, me, k);
      return we ? (!L && (typeof p.UNSAFE_componentWillUpdate == "function" || typeof p.componentWillUpdate == "function") && (as(t, "componentWillUpdate"), typeof p.componentWillUpdate == "function" && p.componentWillUpdate(u, me, k), typeof p.UNSAFE_componentWillUpdate == "function" && p.UNSAFE_componentWillUpdate(u, me, k), ss()), typeof p.componentDidUpdate == "function" && (t.effectTag |= xt), typeof p.getSnapshotBeforeUpdate == "function" && (t.effectTag |= Va)) : (typeof p.componentDidUpdate == "function" && (w !== e.memoizedProps || K !== e.memoizedState) && (t.effectTag |= xt), typeof p.getSnapshotBeforeUpdate == "function" && (w !== e.memoizedProps || K !== e.memoizedState) && (t.effectTag |= Va), t.memoizedProps = u, t.memoizedState = me), p.props = u, p.state = me, p.context = k, we;
    }
    var Oy, Ly, By, jy, Vy, d0 = function(e) {
    };
    Oy = !1, Ly = !1, By = {}, jy = {}, Vy = {}, d0 = function(e) {
      if (!(e === null || typeof e != "object") && !(!e._store || e._store.validated || e.key != null)) {
        if (typeof e._store != "object")
          throw Error("React Component in warnForMissingKey should have a _store. This error is likely caused by a bug in React. Please file an issue.");
        e._store.validated = !0;
        var t = 'Each child in a list should have a unique "key" prop. See https://fb.me/react-warning-keys for more information.' + ft();
        jy[t] || (jy[t] = !0, g('Each child in a list should have a unique "key" prop. See https://fb.me/react-warning-keys for more information.'));
      }
    };
    var qm = Array.isArray;
    function Mh(e, t, s) {
      var u = s.ref;
      if (u !== null && typeof u != "function" && typeof u != "object") {
        if ((e.mode & yn || qn) && !(s._owner && s._self && s._owner.stateNode !== s._self)) {
          var d = Te(e.type) || "Component";
          By[d] || (g('A string ref, "%s", has been found within a strict mode tree. String refs are a source of potential bugs and should be avoided. We recommend using useRef() or createRef() instead. Learn more about using refs safely here: https://fb.me/react-strict-mode-string-ref%s', u, $n(e)), By[d] = !0);
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
            throw Error("Missing owner for string ref " + u + ". This error is likely caused by a bug in React. Please file an issue.");
          var E = "" + u;
          if (t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === E)
            return t.ref;
          var k = function(N) {
            var J = w.refs;
            J === r0 && (J = w.refs = {}), N === null ? delete J[E] : J[E] = N;
          };
          return k._stringRef = E, k;
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
        if (Vy[e])
          return;
        Vy[e] = !0, g("Functions are not valid as a React child. This may happen if you return a Component instead of <Component /> from render. Or maybe you meant to call this function rather than return it.");
      }
    }
    function f0(e) {
      function t(F, te) {
        if (!!e) {
          var j = F.lastEffect;
          j !== null ? (j.nextEffect = te, F.lastEffect = te) : F.firstEffect = F.lastEffect = te, te.nextEffect = null, te.effectTag = Vs;
        }
      }
      function s(F, te) {
        if (!e)
          return null;
        for (var j = te; j !== null; )
          t(F, j), j = j.sibling;
        return null;
      }
      function u(F, te) {
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
        if (te === null || te.tag !== Qe) {
          var pe = eb(j, F.mode, ve);
          return pe.return = F, pe;
        } else {
          var Ee = d(te, j);
          return Ee.return = F, Ee;
        }
      }
      function E(F, te, j, ve) {
        if (te !== null && (te.elementType === j.type || Zx(te, j))) {
          var pe = d(te, j.props);
          return pe.ref = Mh(F, te, j), pe.return = F, pe._debugSource = j._source, pe._debugOwner = j._owner, pe;
        }
        var Ee = Kw(j, F.mode, ve);
        return Ee.ref = Mh(F, te, j), Ee.return = F, Ee;
      }
      function k(F, te, j, ve) {
        if (te === null || te.tag !== Ue || te.stateNode.containerInfo !== j.containerInfo || te.stateNode.implementation !== j.implementation) {
          var pe = tb(j, F.mode, ve);
          return pe.return = F, pe;
        } else {
          var Ee = d(te, j.children || []);
          return Ee.return = F, Ee;
        }
      }
      function N(F, te, j, ve, pe) {
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
          var ve = eb("" + te, F.mode, j);
          return ve.return = F, ve;
        }
        if (typeof te == "object" && te !== null) {
          switch (te.$$typeof) {
            case xe: {
              var pe = Kw(te, F.mode, j);
              return pe.ref = Mh(F, null, te), pe.return = F, pe;
            }
            case Ye: {
              var Ee = tb(te, F.mode, j);
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
              return j.key === pe ? j.type === je ? N(F, te, j.props.children, ve, pe) : E(F, te, j, ve) : null;
            case Ye:
              return j.key === pe ? k(F, te, j, ve) : null;
          }
          if (qm(j) || Dr(j))
            return pe !== null ? null : N(F, te, j, ve, null);
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
              return ve.type === je ? N(te, yt, ve.props.children, pe, ve.key) : E(te, yt, ve, pe);
            }
            case Ye: {
              var It = F.get(ve.key === null ? j : ve.key) || null;
              return k(te, It, ve, pe);
            }
          }
          if (qm(ve) || Dr(ve)) {
            var Ht = F.get(j) || null;
            return N(te, Ht, ve, pe, null);
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
            case Ye:
              d0(F);
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
        for (var bi = u(F, At); Rt < j.length; Rt++) {
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
          typeof Symbol == "function" && j[Symbol.toStringTag] === "Generator" && (Ly || g("Using Generators as children is unsupported and will likely yield unexpected results because enumerating a generator mutates it. You may convert it to an array with `Array.from()` or the `[...spread]` operator before rendering. Keep in mind you might need to polyfill these features for older browsers."), Ly = !0), j.entries === pe && (Oy || g("Using Maps as children is unsupported and will likely yield unexpected results. Convert it to a sequence/iterable of keyed ReactElements instead."), Oy = !0);
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
        for (var lb = u(F, cn); !tn.done; Rn++, tn = At.next()) {
          var rl = K(lb, F, Rn, tn.value, ve);
          rl !== null && (e && rl.alternate !== null && lb.delete(rl.key === null ? Rn : rl.key), An = p(rl, An, Rn), Rt === null ? zt = rl : Rt.sibling = rl, Rt = rl);
        }
        return e && lb.forEach(function($D) {
          return t(F, $D);
        }), zt;
      }
      function nt(F, te, j, ve) {
        if (te !== null && te.tag === Qe) {
          s(F, te.sibling);
          var pe = d(te, j);
          return pe.return = F, pe;
        }
        s(F, te);
        var Ee = eb(j, F.mode, ve);
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
                if (Ee.elementType === j.type || Zx(Ee, j)) {
                  s(F, Ee.sibling);
                  var It = d(Ee, j.props);
                  return It.ref = Mh(F, Ee, j), It.return = F, It._debugSource = j._source, It._debugOwner = j._owner, It;
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
          var At = Kw(j, F.mode, ve);
          return At.ref = Mh(F, te, j), At.return = F, At;
        }
      }
      function vt(F, te, j, ve) {
        for (var pe = j.key, Ee = te; Ee !== null; ) {
          if (Ee.key === pe)
            if (Ee.tag === Ue && Ee.stateNode.containerInfo === j.containerInfo && Ee.stateNode.implementation === j.implementation) {
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
        var It = tb(j, F.mode, ve);
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
            case Ye:
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
    var sd = f0(!0), Uy = f0(!1);
    function l1(e, t) {
      if (!(e === null || t.child === e.child))
        throw Error("Resuming work not yet implemented.");
      if (t.child !== null) {
        var s = t.child, u = Au(s, s.pendingProps);
        for (t.child = u, u.return = t; s.sibling !== null; )
          s = s.sibling, u = u.sibling = Au(s, s.pendingProps), u.return = t;
        u.sibling = null;
      }
    }
    function u1(e, t) {
      for (var s = e.child; s !== null; )
        fD(s, t), s = s.sibling;
    }
    var Eh = {}, Jo = cu(Eh), Ih = cu(Eh), tv = cu(Eh);
    function nv(e) {
      if (e === Eh)
        throw Error("Expected host context to exist. This error is likely caused by a bug in React. Please file an issue.");
      return e;
    }
    function h0() {
      var e = nv(tv.current);
      return e;
    }
    function Hy(e, t) {
      Oi(tv, t, e), Oi(Ih, e, e), Oi(Jo, Eh, e);
      var s = Vg(t);
      zi(Jo, e), Oi(Jo, s, e);
    }
    function od(e) {
      zi(Jo, e), zi(Ih, e), zi(tv, e);
    }
    function Wy() {
      var e = nv(Jo.current);
      return e;
    }
    function p0(e) {
      nv(tv.current);
      var t = nv(Jo.current), s = Sm(t, e.type);
      t !== s && (Oi(Ih, e, e), Oi(Jo, s, e));
    }
    function Fy(e) {
      Ih.current === e && (zi(Jo, e), zi(Ih, e));
    }
    var c1 = 0, m0 = 1, $y = 1, Ah = 2, va = cu(c1);
    function iv(e, t) {
      return (e & t) !== 0;
    }
    function Rh(e) {
      return e & m0;
    }
    function Qy(e, t) {
      return e & m0 | t;
    }
    function d1(e, t) {
      return e | t;
    }
    function mu(e, t) {
      Oi(va, t, e);
    }
    function ld(e) {
      zi(va, e);
    }
    function f1(e, t) {
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
            if (u === null || GE(u) || XE(u))
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
    var ud = 1, cd = 2, av = 4, Ie = m.ReactCurrentDispatcher, Fr = m.ReactCurrentBatchConfig, Zy;
    Zy = /* @__PURE__ */ new Set();
    var qo = Ae, Tn = null, wi = null, li = null, sv = !1, h1 = 25, ae = null, $r = null, Ko = -1, Yy = !1;
    function en() {
      {
        var e = ae;
        $r === null ? $r = [e] : $r.push(e);
      }
    }
    function ze() {
      {
        var e = ae;
        $r !== null && (Ko++, $r[Ko] !== e && p1(e));
      }
    }
    function Dh(e) {
      e != null && !Array.isArray(e) && g("%s received a final argument that is not an array (instead, received `%s`). When specified, the final argument must be an array.", ae, typeof e);
    }
    function p1(e) {
      {
        var t = Te(Tn.type);
        if (!Zy.has(t) && (Zy.add(t), $r !== null)) {
          for (var s = "", u = 30, d = 0; d <= Ko; d++) {
            for (var p = $r[d], w = d === Ko ? e : p, b = d + 1 + ". " + p; b.length < u; )
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
    function Gy(e, t) {
      if (Yy)
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
      qo = p, Tn = t, $r = e !== null ? e._debugHookTypes : null, Ko = -1, Yy = e !== null && e.type !== t.type, t.memoizedState = null, t.updateQueue = null, t.expirationTime = Ae, e !== null && e.memoizedState !== null ? Ie.current = E0 : $r !== null ? Ie.current = M0 : Ie.current = T0;
      var w = s(u, d);
      if (t.expirationTime === qo) {
        var b = 0;
        do {
          if (t.expirationTime = Ae, !(b < h1))
            throw Error("Too many re-renders. React limits the number of renders to prevent an infinite loop.");
          b += 1, Yy = !1, wi = null, li = null, t.updateQueue = null, Ko = -1, Ie.current = I0, w = s(u, d);
        } while (t.expirationTime === qo);
      }
      Ie.current = vv, t._debugHookTypes = $r;
      var E = wi !== null && wi.next !== null;
      if (qo = Ae, Tn = null, wi = null, li = null, ae = null, $r = null, Ko = -1, sv = !1, E)
        throw Error("Rendered fewer hooks than expected. This may be caused by an accidental early return statement.");
      return w;
    }
    function v0(e, t, s) {
      t.updateQueue = e.updateQueue, t.effectTag &= ~(Ua | xt), e.expirationTime <= s && (e.expirationTime = Ae);
    }
    function g0() {
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
    function m1() {
      return {
        lastEffect: null
      };
    }
    function Xy(e, t) {
      return typeof t == "function" ? t(e) : t;
    }
    function Jy(e, t, s) {
      var u = fd(), d;
      s !== void 0 ? d = s(t) : d = t, u.memoizedState = u.baseState = d;
      var p = u.queue = {
        pending: null,
        dispatch: null,
        lastRenderedReducer: e,
        lastRenderedState: d
      }, w = p.dispatch = C0.bind(null, Tn, p);
      return [u.memoizedState, w];
    }
    function qy(e, t, s) {
      var u = hd(), d = u.queue;
      if (d === null)
        throw Error("Should have a queue. This is likely a bug in React. Please file an issue.");
      d.lastRenderedReducer = e;
      var p = wi, w = p.baseQueue, b = d.pending;
      if (b !== null) {
        if (w !== null) {
          var E = w.next, k = b.next;
          w.next = k, b.next = E;
        }
        p.baseQueue = w = b, d.pending = null;
      }
      if (w !== null) {
        var N = w.next, J = p.baseState, L = null, K = null, me = null, we = N;
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
            if (xC(Ke, we.suspenseConfig), we.eagerReducer === e)
              J = we.eagerState;
            else {
              var vt = we.action;
              J = e(J, vt);
            }
          }
          we = we.next;
        } while (we !== null && we !== N);
        me === null ? L = J : me.next = K, ou(J, u.memoizedState) || Mw(), u.memoizedState = J, u.baseState = L, u.baseQueue = me, d.lastRenderedState = J;
      }
      var Qt = d.dispatch;
      return [u.memoizedState, Qt];
    }
    function Ky(e, t, s) {
      var u = hd(), d = u.queue;
      if (d === null)
        throw Error("Should have a queue. This is likely a bug in React. Please file an issue.");
      d.lastRenderedReducer = e;
      var p = d.dispatch, w = d.pending, b = u.memoizedState;
      if (w !== null) {
        d.pending = null;
        var E = w.next, k = E;
        do {
          var N = k.action;
          b = e(b, N), k = k.next;
        } while (k !== E);
        ou(b, u.memoizedState) || Mw(), u.memoizedState = b, u.baseQueue === null && (u.baseState = b), d.lastRenderedState = b;
      }
      return [b, p];
    }
    function kh(e) {
      var t = fd();
      typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e;
      var s = t.queue = {
        pending: null,
        dispatch: null,
        lastRenderedReducer: Xy,
        lastRenderedState: e
      }, u = s.dispatch = C0.bind(null, Tn, s);
      return [t.memoizedState, u];
    }
    function ov(e) {
      return qy(Xy);
    }
    function lv(e) {
      return Ky(Xy);
    }
    function ew(e, t, s, u) {
      var d = {
        tag: e,
        create: t,
        destroy: s,
        deps: u,
        next: null
      }, p = Tn.updateQueue;
      if (p === null)
        p = m1(), Tn.updateQueue = p, p.lastEffect = d.next = d;
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
    function tw(e) {
      var t = fd(), s = {
        current: e
      };
      return Object.seal(s), t.memoizedState = s, s;
    }
    function uv(e) {
      var t = hd();
      return t.memoizedState;
    }
    function nw(e, t, s, u) {
      var d = fd(), p = u === void 0 ? null : u;
      Tn.effectTag |= e, d.memoizedState = ew(ud | t, s, void 0, p);
    }
    function iw(e, t, s, u) {
      var d = hd(), p = u === void 0 ? null : u, w = void 0;
      if (wi !== null) {
        var b = wi.memoizedState;
        if (w = b.destroy, p !== null) {
          var E = b.deps;
          if (Gy(p, E)) {
            ew(t, s, w, p);
            return;
          }
        }
      }
      Tn.effectTag |= e, d.memoizedState = ew(ud | t, s, w, p);
    }
    function cv(e, t) {
      return typeof jest < "u" && DC(Tn), nw(xt | Ua, av, e, t);
    }
    function pd(e, t) {
      return typeof jest < "u" && DC(Tn), iw(xt | Ua, av, e, t);
    }
    function rw(e, t) {
      return nw(xt, cd, e, t);
    }
    function dv(e, t) {
      return iw(xt, cd, e, t);
    }
    function y0(e, t) {
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
    function aw(e, t, s) {
      typeof t != "function" && g("Expected useImperativeHandle() second argument to be a function that creates a handle. Instead received: %s.", t !== null ? typeof t : "null");
      var u = s != null ? s.concat([e]) : null;
      return nw(xt, cd, y0.bind(null, t, e), u);
    }
    function fv(e, t, s) {
      typeof t != "function" && g("Expected useImperativeHandle() second argument to be a function that creates a handle. Instead received: %s.", t !== null ? typeof t : "null");
      var u = s != null ? s.concat([e]) : null;
      return iw(xt, cd, y0.bind(null, t, e), u);
    }
    function v1(e, t) {
    }
    var hv = v1;
    function pv(e, t) {
      var s = fd(), u = t === void 0 ? null : t;
      return s.memoizedState = [e, u], e;
    }
    function md(e, t) {
      var s = hd(), u = t === void 0 ? null : t, d = s.memoizedState;
      if (d !== null && u !== null) {
        var p = d[1];
        if (Gy(u, p))
          return d[0];
      }
      return s.memoizedState = [e, u], e;
    }
    function sw(e, t) {
      var s = fd(), u = t === void 0 ? null : t, d = e();
      return s.memoizedState = [d, u], d;
    }
    function mv(e, t) {
      var s = hd(), u = t === void 0 ? null : t, d = s.memoizedState;
      if (d !== null && u !== null) {
        var p = d[1];
        if (Gy(u, p))
          return d[0];
      }
      var w = e();
      return s.memoizedState = [w, u], w;
    }
    function ow(e, t) {
      var s = kh(e), u = s[0], d = s[1];
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
    function w0(e, t) {
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
    function b0(e, t) {
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
    function lw(e, t, s) {
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
    function uw(e) {
      var t = kh(!1), s = t[0], u = t[1], d = pv(lw.bind(null, u, e), [u, e]);
      return [d, s];
    }
    function S0(e) {
      var t = ov(), s = t[0], u = t[1], d = md(lw.bind(null, u, e), [u, e]);
      return [d, s];
    }
    function x0(e) {
      var t = lv(), s = t[0], u = t[1], d = md(lw.bind(null, u, e), [u, e]);
      return [d, s];
    }
    function C0(e, t, s) {
      typeof arguments[3] == "function" && g("State updates from the useState() and useReducer() Hooks don't support the second callback argument. To execute a side effect after rendering, declare it in the component body with useEffect().");
      var u = ps(), d = Th(), p = Cu(u, e, d), w = {
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
          var k = t.lastRenderedReducer;
          if (k !== null) {
            var N;
            N = Ie.current, Ie.current = ga;
            try {
              var J = t.lastRenderedState, L = k(J, s);
              if (w.eagerReducer = k, w.eagerState = L, ou(L, J))
                return;
            } catch {
            } finally {
              Ie.current = N;
            }
          }
        }
        typeof jest < "u" && (RC(e), KR(e)), Zr(e, p);
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
    }, T0 = null, M0 = null, E0 = null, I0 = null, fs = null, ga = null, gv = null;
    {
      var cw = function() {
        g("Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo().");
      }, ht = function() {
        g("Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. You can only call Hooks at the top level of your React function. For more information, see https://fb.me/rules-of-hooks");
      };
      T0 = {
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
          return ae = "useImperativeHandle", en(), Dh(s), aw(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", en(), Dh(t), rw(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", en(), Dh(t);
          var s = Ie.current;
          Ie.current = fs;
          try {
            return sw(e, t);
          } finally {
            Ie.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", en();
          var u = Ie.current;
          Ie.current = fs;
          try {
            return Jy(e, t, s);
          } finally {
            Ie.current = u;
          }
        },
        useRef: function(e) {
          return ae = "useRef", en(), tw(e);
        },
        useState: function(e) {
          ae = "useState", en();
          var t = Ie.current;
          Ie.current = fs;
          try {
            return kh(e);
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
          return ae = "useDeferredValue", en(), ow(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", en(), uw(e);
        }
      }, M0 = {
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
          return ae = "useImperativeHandle", ze(), aw(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", ze(), rw(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", ze();
          var s = Ie.current;
          Ie.current = fs;
          try {
            return sw(e, t);
          } finally {
            Ie.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", ze();
          var u = Ie.current;
          Ie.current = fs;
          try {
            return Jy(e, t, s);
          } finally {
            Ie.current = u;
          }
        },
        useRef: function(e) {
          return ae = "useRef", ze(), tw(e);
        },
        useState: function(e) {
          ae = "useState", ze();
          var t = Ie.current;
          Ie.current = fs;
          try {
            return kh(e);
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
          return ae = "useDeferredValue", ze(), ow(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", ze(), uw(e);
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
          Ie.current = ga;
          try {
            return mv(e, t);
          } finally {
            Ie.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", ze();
          var u = Ie.current;
          Ie.current = ga;
          try {
            return qy(e, t, s);
          } finally {
            Ie.current = u;
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
          return ae = "useDeferredValue", ze(), w0(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", ze(), S0(e);
        }
      }, I0 = {
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
          var u = Ie.current;
          Ie.current = gv;
          try {
            return Ky(e, t, s);
          } finally {
            Ie.current = u;
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
          return ae = "useDeferredValue", ze(), b0(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", ze(), x0(e);
        }
      }, fs = {
        readContext: function(e, t) {
          return cw(), Bn(e, t);
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
          return ae = "useImperativeHandle", ht(), en(), aw(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", ht(), en(), rw(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", ht(), en();
          var s = Ie.current;
          Ie.current = fs;
          try {
            return sw(e, t);
          } finally {
            Ie.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", ht(), en();
          var u = Ie.current;
          Ie.current = fs;
          try {
            return Jy(e, t, s);
          } finally {
            Ie.current = u;
          }
        },
        useRef: function(e) {
          return ae = "useRef", ht(), en(), tw(e);
        },
        useState: function(e) {
          ae = "useState", ht(), en();
          var t = Ie.current;
          Ie.current = fs;
          try {
            return kh(e);
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
          return ae = "useDeferredValue", ht(), en(), ow(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", ht(), en(), uw(e);
        }
      }, ga = {
        readContext: function(e, t) {
          return cw(), Bn(e, t);
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
          var u = Ie.current;
          Ie.current = ga;
          try {
            return qy(e, t, s);
          } finally {
            Ie.current = u;
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
          return ae = "useDeferredValue", ht(), ze(), w0(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", ht(), ze(), S0(e);
        }
      }, gv = {
        readContext: function(e, t) {
          return cw(), Bn(e, t);
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
          var u = Ie.current;
          Ie.current = ga;
          try {
            return Ky(e, t, s);
          } finally {
            Ie.current = u;
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
          return ae = "useDeferredValue", ht(), ze(), b0(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", ht(), ze(), x0(e);
        }
      };
    }
    var yv = o.unstable_now, A0 = 0, Nh = -1;
    function g1() {
      return A0;
    }
    function R0() {
      A0 = yv();
    }
    function dw(e) {
      Nh = yv(), e.actualStartTime < 0 && (e.actualStartTime = yv());
    }
    function D0(e) {
      Nh = -1;
    }
    function wv(e, t) {
      if (Nh >= 0) {
        var s = yv() - Nh;
        e.actualDuration += s, t && (e.selfBaseDuration = s), Nh = -1;
      }
    }
    var Qr = null, gu = null, yu = !1;
    function y1(e) {
      var t = e.stateNode.containerInfo;
      return gu = PS(t), Qr = e, yu = !0, !0;
    }
    function k0(e, t) {
      switch (e.tag) {
        case Se:
          rI(e.stateNode.containerInfo, t);
          break;
        case Re:
          aI(e.type, e.memoizedProps, e.stateNode, t);
          break;
      }
      var s = gD();
      s.stateNode = t, s.return = e, s.effectTag = Vs, e.lastEffect !== null ? (e.lastEffect.nextEffect = s, e.lastEffect = s) : e.firstEffect = e.lastEffect = s;
    }
    function N0(e, t) {
      switch (t.effectTag = t.effectTag & ~$i | Cn, e.tag) {
        case Se: {
          var s = e.stateNode.containerInfo;
          switch (t.tag) {
            case Re:
              var u = t.type;
              t.pendingProps, sI(s, u);
              break;
            case Qe:
              var d = t.pendingProps;
              oI(s, d);
              break;
          }
          break;
        }
        case Re: {
          var p = e.type, w = e.memoizedProps, b = e.stateNode;
          switch (t.tag) {
            case Re:
              var E = t.type;
              t.pendingProps, lI(p, w, b, E);
              break;
            case Qe:
              var k = t.pendingProps;
              uI(p, w, b, k);
              break;
            case ee:
              cI(p, w);
              break;
          }
          break;
        }
        default:
          return;
      }
    }
    function _0(e, t) {
      switch (e.tag) {
        case Re: {
          var s = e.type;
          e.pendingProps;
          var u = ns(t, s);
          return u !== null ? (e.stateNode = u, !0) : !1;
        }
        case Qe: {
          var d = e.pendingProps, p = Ug(t, d);
          return p !== null ? (e.stateNode = p, !0) : !1;
        }
        case ee:
          return !1;
        default:
          return !1;
      }
    }
    function fw(e) {
      if (!!yu) {
        var t = gu;
        if (!t) {
          N0(Qr, e), yu = !1, Qr = e;
          return;
        }
        var s = t;
        if (!_0(e, t)) {
          if (t = xm(s), !t || !_0(e, t)) {
            N0(Qr, e), yu = !1, Qr = e;
            return;
          }
          k0(Qr, s);
        }
        Qr = e, gu = PS(t);
      }
    }
    function w1(e, t, s) {
      var u = e.stateNode, d = JE(u, e.type, e.memoizedProps, t, s, e);
      return e.updateQueue = d, d !== null;
    }
    function b1(e) {
      var t = e.stateNode, s = e.memoizedProps, u = qE(t, s, e);
      if (u) {
        var d = Qr;
        if (d !== null)
          switch (d.tag) {
            case Se: {
              var p = d.stateNode.containerInfo;
              nI(p, t, s);
              break;
            }
            case Re: {
              var w = d.type, b = d.memoizedProps, E = d.stateNode;
              iI(w, b, E, t, s);
              break;
            }
          }
      }
      return u;
    }
    function S1(e) {
      var t = e.memoizedState, s = t !== null ? t.dehydrated : null;
      if (!s)
        throw Error("Expected to have a hydrated suspense instance. This error is likely caused by a bug in React. Please file an issue.");
      return KE(s);
    }
    function P0(e) {
      for (var t = e.return; t !== null && t.tag !== Re && t.tag !== Se && t.tag !== ee; )
        t = t.return;
      Qr = t;
    }
    function bv(e) {
      if (e !== Qr)
        return !1;
      if (!yu)
        return P0(e), yu = !0, !1;
      var t = e.type;
      if (e.tag !== Re || t !== "head" && t !== "body" && !T(t, e.memoizedProps))
        for (var s = gu; s; )
          k0(e, s), s = xm(s);
      return P0(e), e.tag === ee ? gu = S1(e) : gu = Qr ? xm(e.stateNode) : null, !0;
    }
    function hw() {
      Qr = null, gu = null, yu = !1;
    }
    var _h = m.ReactCurrentOwner, el = !1, pw, mw, vw, gw, yw, wu, ww, Sv;
    pw = {}, mw = {}, vw = {}, gw = {}, yw = {}, wu = !1, ww = {}, Sv = {};
    function yr(e, t, s, u) {
      e === null ? t.child = Uy(t, null, s, u) : t.child = sd(t, e.child, s, u);
    }
    function x1(e, t, s, u) {
      t.child = sd(t, e.child, null, u), t.child = sd(t, null, s, u);
    }
    function z0(e, t, s, u, d) {
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
      var w = s.render, b = t.ref, E;
      return ad(t, d), _h.current = t, kr(!0), E = dd(e, t, w, u, b, d), t.mode & yn && t.memoizedState !== null && (E = dd(e, t, w, u, b, d)), kr(!1), e !== null && !el ? (v0(e, t, d), fo(e, t, d)) : (t.effectTag |= lr, yr(e, t, E, d), t.child);
    }
    function O0(e, t, s, u, d, p) {
      if (e === null) {
        var w = s.type;
        if (cD(w) && s.compare === null && s.defaultProps === void 0) {
          var b = w;
          return b = id(w), t.tag = ge, t.type = b, xw(t, w), L0(e, t, b, u, d, p);
        }
        {
          var E = w.propTypes;
          E && l(
            E,
            u,
            "prop",
            Te(w),
            ft
          );
        }
        var k = qw(s.type, null, u, null, t.mode, p);
        return k.ref = t.ref, k.return = t, t.child = k, k;
      }
      {
        var N = s.type, J = N.propTypes;
        J && l(
          J,
          u,
          "prop",
          Te(N),
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
    function L0(e, t, s, u, d, p) {
      if (t.type !== t.elementType) {
        var w = t.elementType;
        w.$$typeof === ir && (w = Od(w));
        var b = w && w.propTypes;
        b && l(
          b,
          u,
          "prop",
          Te(w),
          ft
        );
      }
      if (e !== null) {
        var E = e.memoizedProps;
        if (ch(E, u) && e.ref === t.ref && t.type === e.type && (el = !1, d < p))
          return t.expirationTime = e.expirationTime, fo(e, t, p);
      }
      return bw(e, t, s, u, p);
    }
    function C1(e, t, s) {
      var u = t.pendingProps;
      return yr(e, t, u, s), t.child;
    }
    function T1(e, t, s) {
      var u = t.pendingProps.children;
      return yr(e, t, u, s), t.child;
    }
    function M1(e, t, s) {
      t.effectTag |= xt;
      var u = t.pendingProps, d = u.children;
      return yr(e, t, d, s), t.child;
    }
    function B0(e, t) {
      var s = t.ref;
      (e === null && s !== null || e !== null && e.ref !== s) && (t.effectTag |= pi);
    }
    function bw(e, t, s, u, d) {
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
      var w;
      {
        var b = Jc(t, s, !0);
        w = qc(t, b);
      }
      var E;
      return ad(t, d), _h.current = t, kr(!0), E = dd(e, t, s, u, w, d), t.mode & yn && t.memoizedState !== null && (E = dd(e, t, s, u, w, d)), kr(!1), e !== null && !el ? (v0(e, t, d), fo(e, t, d)) : (t.effectTag |= lr, yr(e, t, E, d), t.child);
    }
    function j0(e, t, s, u, d) {
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
      var w;
      ls(s) ? (w = !0, Om(t)) : w = !1, ad(t, d);
      var b = t.stateNode, E;
      b === null ? (e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= Cn), u0(t, s, u), zy(t, s, u, d), E = !0) : e === null ? E = s1(t, s, u, d) : E = o1(e, t, s, u, d);
      var k = Sw(e, t, s, E, w, d);
      {
        var N = t.stateNode;
        N.props !== u && (wu || g("It looks like %s is reassigning its own `this.props` while rendering. This is not supported and can lead to confusing bugs.", Te(t.type) || "a component"), wu = !0);
      }
      return k;
    }
    function Sw(e, t, s, u, d, p) {
      B0(e, t);
      var w = (t.effectTag & Vt) !== _t;
      if (!u && !w)
        return d && Ix(t, s, !1), fo(e, t, p);
      var b = t.stateNode;
      _h.current = t;
      var E;
      return w && typeof s.getDerivedStateFromError != "function" ? (E = null, D0()) : (kr(!0), E = b.render(), t.mode & yn && b.render(), kr(!1)), t.effectTag |= lr, e !== null && w ? x1(e, t, E, p) : yr(e, t, E, p), t.memoizedState = b.state, d && Ix(t, s, !0), t.child;
    }
    function V0(e) {
      var t = e.stateNode;
      t.pendingContext ? Mx(e, t.pendingContext, t.pendingContext !== t.context) : t.context && Mx(e, t.context, !1), Hy(e, t.containerInfo);
    }
    function E1(e, t, s) {
      V0(t);
      var u = t.updateQueue;
      if (!(e !== null && u !== null))
        throw Error("If the root does not have an updateQueue, we should have already bailed out. This error is likely caused by a bug in React. Please file an issue.");
      var d = t.pendingProps, p = t.memoizedState, w = p !== null ? p.element : null;
      Ty(e, t), Ch(t, d, null, s);
      var b = t.memoizedState, E = b.element;
      if (E === w)
        return hw(), fo(e, t, s);
      var k = t.stateNode;
      if (k.hydrate && y1(t)) {
        var N = Uy(t, null, E, s);
        t.child = N;
        for (var J = N; J; )
          J.effectTag = J.effectTag & ~Cn | $i, J = J.sibling;
      } else
        yr(e, t, E, s), hw();
      return t.child;
    }
    function I1(e, t, s) {
      p0(t), e === null && fw(t);
      var u = t.type, d = t.pendingProps, p = e !== null ? e.memoizedProps : null, w = d.children, b = T(u, d);
      return b ? w = null : p !== null && T(u, p) && (t.effectTag |= Ri), B0(e, t), t.mode & td && s !== ds && R(u, d) ? (Qw(ds), t.expirationTime = t.childExpirationTime = ds, null) : (yr(e, t, w, s), t.child);
    }
    function A1(e, t) {
      return e === null && fw(t), null;
    }
    function R1(e, t, s, u, d) {
      e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= Cn);
      var p = t.pendingProps;
      px(t);
      var w = JA(s);
      t.type = w;
      var b = t.tag = dD(w);
      hx(t);
      var E = ma(w, p), k;
      switch (b) {
        case Oe:
          return xw(t, w), t.type = w = id(w), k = bw(null, t, w, E, d), k;
        case ce:
          return t.type = w = py(w), k = j0(null, t, w, E, d), k;
        case D:
          return t.type = w = my(w), k = z0(null, t, w, E, d), k;
        case Ce: {
          if (t.type !== t.elementType) {
            var N = w.propTypes;
            N && l(
              N,
              E,
              "prop",
              Te(w),
              ft
            );
          }
          return k = O0(
            null,
            t,
            w,
            ma(w.type, E),
            u,
            d
          ), k;
        }
      }
      var J = "";
      throw w !== null && typeof w == "object" && w.$$typeof === ir && (J = " Did you wrap a component in React.lazy() more than once?"), Error("Element type is invalid. Received a promise that resolves to: " + w + ". Lazy element type must resolve to a class or function." + J);
    }
    function D1(e, t, s, u, d) {
      e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= Cn), t.tag = ce;
      var p;
      return ls(s) ? (p = !0, Om(t)) : p = !1, ad(t, d), u0(t, s, u), zy(t, s, u, d), Sw(null, t, s, !0, p, d);
    }
    function k1(e, t, s, u) {
      e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= Cn);
      var d = t.pendingProps, p;
      {
        var w = Jc(t, s, !1);
        p = qc(t, w);
      }
      ad(t, u);
      var b;
      {
        if (s.prototype && typeof s.prototype.render == "function") {
          var E = Te(s) || "Unknown";
          pw[E] || (g("The <%s /> component appears to have a render method, but doesn't extend React.Component. This is likely to cause errors. Change %s to extend React.Component instead.", E, E), pw[E] = !0);
        }
        t.mode & yn && pa.recordLegacyContextWarning(t, null), kr(!0), _h.current = t, b = dd(null, t, s, d, p, u), kr(!1);
      }
      if (t.effectTag |= lr, typeof b == "object" && b !== null && typeof b.render == "function" && b.$$typeof === void 0) {
        {
          var k = Te(s) || "Unknown";
          mw[k] || (g("The <%s /> component appears to be a function component that returns a class instance. Change %s to a class that extends React.Component instead. If you can't use a class try assigning the prototype on the function as a workaround. `%s.prototype = React.Component.prototype`. Don't use an arrow function since it cannot be called with `new` by React.", k, k, k), mw[k] = !0);
        }
        t.tag = ce, t.memoizedState = null, t.updateQueue = null;
        var N = !1;
        ls(s) ? (N = !0, Om(t)) : N = !1, t.memoizedState = b.state !== null && b.state !== void 0 ? b.state : null, Cy(t);
        var J = s.getDerivedStateFromProps;
        return typeof J == "function" && Jm(t, s, J, d), l0(t, b), zy(t, s, d, u), Sw(null, t, s, !0, N, u);
      } else
        return t.tag = Oe, t.mode & yn && t.memoizedState !== null && (b = dd(null, t, s, d, p, u)), yr(null, t, b, u), xw(t, s), t.child;
    }
    function xw(e, t) {
      {
        if (t && t.childContextTypes && g("%s(...): childContextTypes cannot be defined on a function component.", t.displayName || t.name || "Component"), e.ref !== null) {
          var s = "", u = ka();
          u && (s += `

Check the render method of \`` + u + "`.");
          var d = u || e._debugID || "", p = e._debugSource;
          p && (d = p.fileName + ":" + p.lineNumber), yw[d] || (yw[d] = !0, g("Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?%s", s));
        }
        if (typeof t.getDerivedStateFromProps == "function") {
          var w = Te(t) || "Unknown";
          gw[w] || (g("%s: Function components do not support getDerivedStateFromProps.", w), gw[w] = !0);
        }
        if (typeof t.contextType == "object" && t.contextType !== null) {
          var b = Te(t) || "Unknown";
          vw[b] || (g("%s: Function components do not support contextType.", b), vw[b] = !0);
        }
      }
    }
    var Cw = {
      dehydrated: null,
      retryTime: Ae
    };
    function N1(e, t, s) {
      return iv(e, Ah) && (t === null || t.memoizedState !== null);
    }
    function U0(e, t, s) {
      var u = t.mode, d = t.pendingProps;
      ID(t) && (t.effectTag |= Vt);
      var p = va.current, w = !1, b = (t.effectTag & Vt) !== _t;
      if (b || N1(p, e) ? (w = !0, t.effectTag &= ~Vt) : (e === null || e.memoizedState !== null) && d.fallback !== void 0 && d.unstable_avoidThisFallback !== !0 && (p = d1(p, $y)), p = Rh(p), mu(t, p), e === null)
        if (d.fallback !== void 0 && fw(t), w) {
          var E = d.fallback, k = il(null, u, Ae, null);
          if (k.return = t, (t.mode & Hr) === oi) {
            var N = t.memoizedState, J = N !== null ? t.child.child : t.child;
            k.child = J;
            for (var L = J; L !== null; )
              L.return = k, L = L.sibling;
          }
          var K = il(E, u, s, null);
          return K.return = t, k.sibling = K, t.memoizedState = Cw, t.child = k, K;
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
            return pe.return = t, vt.sibling = pe, vt.childExpirationTime = Ae, t.memoizedState = Cw, t.child = vt, pe;
          } else {
            var Ee = d.children, yt = Ke.child, It = sd(t, yt, Ee, s);
            return t.memoizedState = null, t.child = It;
          }
        } else {
          var Ht = e.child;
          if (w) {
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
            if (t.mode & cs) {
              for (var Rn = 0, bi = zt.child; bi !== null; )
                Rn += bi.treeBaseDuration, bi = bi.sibling;
              zt.treeBaseDuration = Rn;
            }
            var tn = il(At, u, s, null);
            return tn.return = t, zt.sibling = tn, tn.effectTag |= Cn, zt.childExpirationTime = Ae, t.memoizedState = Cw, t.child = zt, tn;
          } else {
            t.memoizedState = null;
            var Bi = d.children;
            return t.child = sd(t, Ht, Bi, s);
          }
        }
      }
    }
    function H0(e, t) {
      e.expirationTime < t && (e.expirationTime = t);
      var s = e.alternate;
      s !== null && s.expirationTime < t && (s.expirationTime = t), qx(e.return, t);
    }
    function _1(e, t, s) {
      for (var u = t; u !== null; ) {
        if (u.tag === ee) {
          var d = u.memoizedState;
          d !== null && H0(u, s);
        } else if (u.tag === dt)
          H0(u, s);
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
    function P1(e) {
      for (var t = e, s = null; t !== null; ) {
        var u = t.alternate;
        u !== null && rv(u) === null && (s = t), t = t.sibling;
      }
      return s;
    }
    function z1(e) {
      if (e !== void 0 && e !== "forwards" && e !== "backwards" && e !== "together" && !ww[e])
        if (ww[e] = !0, typeof e == "string")
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
    function O1(e, t) {
      e !== void 0 && !Sv[e] && (e !== "collapsed" && e !== "hidden" ? (Sv[e] = !0, g('"%s" is not a supported value for tail on <SuspenseList />. Did you mean "collapsed" or "hidden"?', e)) : t !== "forwards" && t !== "backwards" && (Sv[e] = !0, g('<SuspenseList tail="%s" /> is only valid if revealOrder is "forwards" or "backwards". Did you mean to specify revealOrder="forwards"?', e)));
    }
    function W0(e, t) {
      {
        var s = Array.isArray(e), u = !s && typeof Dr(e) == "function";
        if (s || u) {
          var d = s ? "array" : "iterable";
          return g("A nested %s was passed to row #%s in <SuspenseList />. Wrap it in an additional SuspenseList to configure its revealOrder: <SuspenseList revealOrder=...> ... <SuspenseList revealOrder=...>{%s}</SuspenseList> ... </SuspenseList>", d, t, d), !1;
        }
      }
      return !0;
    }
    function L1(e, t) {
      if ((t === "forwards" || t === "backwards") && e !== void 0 && e !== null && e !== !1)
        if (Array.isArray(e)) {
          for (var s = 0; s < e.length; s++)
            if (!W0(e[s], s))
              return;
        } else {
          var u = Dr(e);
          if (typeof u == "function") {
            var d = u.call(e);
            if (d)
              for (var p = d.next(), w = 0; !p.done; p = d.next()) {
                if (!W0(p.value, w))
                  return;
                w++;
              }
          } else
            g('A single row was passed to a <SuspenseList revealOrder="%s" />. This is not useful since it needs multiple rows. Did you mean to pass multiple children or an array?', t);
        }
    }
    function Tw(e, t, s, u, d, p) {
      var w = e.memoizedState;
      w === null ? e.memoizedState = {
        isBackwards: t,
        rendering: null,
        renderingStartTime: 0,
        last: u,
        tail: s,
        tailExpiration: 0,
        tailMode: d,
        lastEffect: p
      } : (w.isBackwards = t, w.rendering = null, w.renderingStartTime = 0, w.last = u, w.tail = s, w.tailExpiration = 0, w.tailMode = d, w.lastEffect = p);
    }
    function F0(e, t, s) {
      var u = t.pendingProps, d = u.revealOrder, p = u.tail, w = u.children;
      z1(d), O1(p, d), L1(w, d), yr(e, t, w, s);
      var b = va.current, E = iv(b, Ah);
      if (E)
        b = Qy(b, Ah), t.effectTag |= Vt;
      else {
        var k = e !== null && (e.effectTag & Vt) !== _t;
        k && _1(t, t.child, s), b = Rh(b);
      }
      if (mu(t, b), (t.mode & Hr) === oi)
        t.memoizedState = null;
      else
        switch (d) {
          case "forwards": {
            var N = P1(t.child), J;
            N === null ? (J = t.child, t.child = null) : (J = N.sibling, N.sibling = null), Tw(
              t,
              !1,
              J,
              N,
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
            Tw(
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
            Tw(
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
    function B1(e, t, s) {
      Hy(t, t.stateNode.containerInfo);
      var u = t.pendingProps;
      return e === null ? t.child = sd(t, null, u, s) : yr(e, t, u, s), t.child;
    }
    function j1(e, t, s) {
      var u = t.type, d = u._context, p = t.pendingProps, w = t.memoizedProps, b = p.value;
      {
        var E = t.type.propTypes;
        E && l(E, p, "prop", "Context.Provider", ft);
      }
      if (Jx(t, b), w !== null) {
        var k = w.value, N = qA(d, b, k);
        if (N === 0) {
          if (w.children === p.children && !Pm())
            return fo(e, t, s);
        } else
          KA(t, d, N, s);
      }
      var J = p.children;
      return yr(e, t, J, s), t.child;
    }
    var $0 = !1;
    function V1(e, t, s) {
      var u = t.type;
      u._context === void 0 ? u !== u.Consumer && ($0 || ($0 = !0, g("Rendering <Context> directly is not supported and will be removed in a future major release. Did you mean to render <Context.Consumer> instead?"))) : u = u._context;
      var d = t.pendingProps, p = d.children;
      typeof p != "function" && g("A context consumer was rendered with multiple children, or a child that isn't a function. A context consumer expects a single child that is a function. If you did pass a function, make sure there is no trailing or leading whitespace around it."), ad(t, s);
      var w = Bn(u, d.unstable_observedBits), b;
      return _h.current = t, kr(!0), b = p(w), kr(!1), t.effectTag |= lr, yr(e, t, b, s), t.child;
    }
    function Mw() {
      el = !0;
    }
    function fo(e, t, s) {
      px(t), e !== null && (t.dependencies = e.dependencies), D0();
      var u = t.expirationTime;
      u !== Ae && Ov(u);
      var d = t.childExpirationTime;
      return d < s ? null : (l1(e, t), t.child);
    }
    function U1(e, t, s) {
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
    function Q0(e, t, s) {
      var u = t.expirationTime;
      if (t._debugNeedsRemount && e !== null)
        return U1(e, t, qw(t.type, t.key, t.pendingProps, t._debugOwner || null, t.mode, t.expirationTime));
      if (e !== null) {
        var d = e.memoizedProps, p = t.pendingProps;
        if (d !== p || Pm() || t.type !== e.type)
          el = !0;
        else if (u < s) {
          switch (el = !1, t.tag) {
            case Se:
              V0(t), hw();
              break;
            case Re:
              if (p0(t), t.mode & td && s !== ds && R(t.type, p))
                return Qw(ds), t.expirationTime = t.childExpirationTime = ds, null;
              break;
            case ce: {
              var w = t.type;
              ls(w) && Om(t);
              break;
            }
            case Ue:
              Hy(t, t.stateNode.containerInfo);
              break;
            case re: {
              var b = t.memoizedProps.value;
              Jx(t, b);
              break;
            }
            case B:
              {
                var E = t.childExpirationTime >= s;
                E && (t.effectTag |= xt);
              }
              break;
            case ee: {
              var k = t.memoizedState;
              if (k !== null) {
                var N = t.child, J = N.childExpirationTime;
                if (J !== Ae && J >= s)
                  return U0(e, t, s);
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
                  return F0(e, t, s);
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
          return k1(e, t, t.type, s);
        case it: {
          var Ke = t.elementType;
          return R1(e, t, Ke, u, s);
        }
        case Oe: {
          var nt = t.type, Pt = t.pendingProps, vt = t.elementType === nt ? Pt : ma(nt, Pt);
          return bw(e, t, nt, vt, s);
        }
        case ce: {
          var Qt = t.type, F = t.pendingProps, te = t.elementType === Qt ? F : ma(Qt, F);
          return j0(e, t, Qt, te, s);
        }
        case Se:
          return E1(e, t, s);
        case Re:
          return I1(e, t, s);
        case Qe:
          return A1(e, t);
        case ee:
          return U0(e, t, s);
        case Ue:
          return B1(e, t, s);
        case D: {
          var j = t.type, ve = t.pendingProps, pe = t.elementType === j ? ve : ma(j, ve);
          return z0(e, t, j, pe, s);
        }
        case Tt:
          return C1(e, t, s);
        case Bt:
          return T1(e, t, s);
        case B:
          return M1(e, t, s);
        case re:
          return j1(e, t, s);
        case Ge:
          return V1(e, t, s);
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
          return It = ma(Ee.type, It), O0(e, t, Ee, It, u, s);
        }
        case ge:
          return L0(e, t, t.type, t.pendingProps, u, s);
        case Xe: {
          var At = t.type, zt = t.pendingProps, Rt = t.elementType === At ? zt : ma(At, zt);
          return D1(e, t, At, Rt, s);
        }
        case dt:
          return F0(e, t, s);
      }
      throw Error("Unknown unit of work tag (" + t.tag + "). This error is likely caused by a bug in React. Please file an issue.");
    }
    function vd(e) {
      e.effectTag |= xt;
    }
    function Z0(e) {
      e.effectTag |= pi;
    }
    var Y0, Ew, G0, X0;
    Y0 = function(e, t, s, u) {
      for (var d = t.child; d !== null; ) {
        if (d.tag === Re || d.tag === Qe)
          f(e, d.stateNode);
        else if (d.tag !== Ue) {
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
    }, Ew = function(e) {
    }, G0 = function(e, t, s, u, d) {
      var p = e.memoizedProps;
      if (p !== u) {
        var w = t.stateNode, b = Wy(), E = x(w, s, p, u, d, b);
        t.updateQueue = E, E && vd(t);
      }
    }, X0 = function(e, t, s, u) {
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
    function J0(e, t, s) {
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
          return ls(d) && zm(t), null;
        }
        case Se: {
          od(t), sy(t);
          var p = t.stateNode;
          if (p.pendingContext && (p.context = p.pendingContext, p.pendingContext = null), e === null || e.child === null) {
            var w = bv(t);
            w && vd(t);
          }
          return Ew(t), null;
        }
        case Re: {
          Fy(t);
          var b = h0(), E = t.type;
          if (e !== null && t.stateNode != null)
            G0(e, t, E, u, b), e.ref !== t.ref && Z0(t);
          else {
            if (!u) {
              if (t.stateNode === null)
                throw Error("We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue.");
              return null;
            }
            var k = Wy(), N = bv(t);
            if (N)
              w1(t, b, k) && vd(t);
            else {
              var J = c(E, u, b, k, t);
              Y0(J, t, !1, !1), t.stateNode = J, v(J, E, u, b) && vd(t);
            }
            t.ref !== null && Z0(t);
          }
          return null;
        }
        case Qe: {
          var L = u;
          if (e && t.stateNode != null) {
            var K = e.memoizedProps;
            X0(e, t, K, L);
          } else {
            if (typeof L != "string" && t.stateNode === null)
              throw Error("We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue.");
            var me = h0(), we = Wy(), Ke = bv(t);
            Ke ? b1(t) && vd(t) : t.stateNode = W(L, me, we, t);
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
              var F = e.child.sibling;
              if (F !== null) {
                var te = t.firstEffect;
                te !== null ? (t.firstEffect = F, F.nextEffect = te) : (t.firstEffect = t.lastEffect = F, F.nextEffect = null), F.effectTag = Vs;
              }
            }
          }
          if (Pt && !vt && (t.mode & Hr) !== oi) {
            var j = e === null && t.memoizedProps.unstable_avoidThisFallback !== !0;
            j || iv(va.current, $y) ? TR() : MR();
          }
          return (Pt || vt) && (t.effectTag |= xt), null;
        }
        case Ue:
          return od(t), Ew(t), null;
        case re:
          return by(t), null;
        case Xe: {
          var ve = t.type;
          return ls(ve) && zm(t), null;
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
              var It = IR() && (e === null || (e.effectTag & Vt) === _t);
              if (!It)
                for (var Ht = t.child; Ht !== null; ) {
                  var At = rv(Ht);
                  if (At !== null) {
                    Ee = !0, t.effectTag |= Vt, xv(pe, !1);
                    var zt = At.updateQueue;
                    return zt !== null && (t.updateQueue = zt, t.effectTag |= xt), pe.lastEffect === null && (t.firstEffect = null), t.lastEffect = pe.lastEffect, u1(t, s), mu(t, Qy(va.current, Ah)), t.child;
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
              } else if (vr() * 2 - pe.renderingStartTime > pe.tailExpiration && s > ds) {
                t.effectTag |= Vt, Ee = !0, xv(pe, !1);
                var Rn = s - 1;
                t.expirationTime = t.childExpirationTime = Rn, Qw(Rn);
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
            return Ee ? wa = Qy(wa, Ah) : wa = Rh(wa), mu(t, wa), Bi;
          }
          return null;
        }
      }
      throw Error("Unknown unit of work tag (" + t.tag + "). This error is likely caused by a bug in React. Please file an issue.");
    }
    function H1(e, t) {
      switch (e.tag) {
        case ce: {
          var s = e.type;
          ls(s) && zm(e);
          var u = e.effectTag;
          return u & mi ? (e.effectTag = u & ~mi | Vt, e) : null;
        }
        case Se: {
          od(e), sy(e);
          var d = e.effectTag;
          if ((d & Vt) !== _t)
            throw Error("The root failed to unmount after an error. This is likely a bug in React. Please file an issue.");
          return e.effectTag = d & ~mi | Vt, e;
        }
        case Re:
          return Fy(e), null;
        case ee: {
          ld(e);
          var p = e.effectTag;
          return p & mi ? (e.effectTag = p & ~mi | Vt, e) : null;
        }
        case dt:
          return ld(e), null;
        case Ue:
          return od(e), null;
        case re:
          return by(e), null;
        default:
          return null;
      }
    }
    function q0(e) {
      switch (e.tag) {
        case ce: {
          var t = e.type.childContextTypes;
          t != null && zm(e);
          break;
        }
        case Se: {
          od(e), sy(e);
          break;
        }
        case Re: {
          Fy(e);
          break;
        }
        case Ue:
          od(e);
          break;
        case ee:
          ld(e);
          break;
        case dt:
          ld(e);
          break;
        case re:
          by(e);
          break;
      }
    }
    function Iw(e, t) {
      return {
        value: e,
        source: t,
        stack: $n(t)
      };
    }
    function W1(e) {
      var t = e.error;
      {
        var s = e.componentName, u = e.componentStack, d = e.errorBoundaryName, p = e.errorBoundaryFound, w = e.willRetry;
        if (t != null && t._suppressLogging) {
          if (p && w)
            return;
          console.error(t);
        }
        var b = s ? "The above error occurred in the <" + s + "> component:" : "The above error occurred in one of your React components:", E;
        p && d ? w ? E = "React will try to recreate this component tree from scratch " + ("using the error boundary you provided, " + d + ".") : E = "This error was initially handled by the error boundary " + d + `.
Recreating the tree from scratch failed so React will unmount the tree.` : E = `Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://fb.me/react-error-boundaries to learn more about error boundaries.`;
        var k = "" + b + u + `

` + ("" + E);
        console.error(k);
      }
    }
    var K0 = null;
    K0 = /* @__PURE__ */ new Set();
    var F1 = typeof WeakSet == "function" ? WeakSet : Set;
    function Aw(e, t) {
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
        W1(d);
      } catch (p) {
        setTimeout(function() {
          throw p;
        });
      }
    }
    var $1 = function(e, t) {
      as(e, "componentWillUnmount"), t.props = e.memoizedProps, t.state = e.memoizedState, t.componentWillUnmount(), ss();
    };
    function Q1(e, t) {
      if (se(null, $1, null, e, t), oe()) {
        var s = ke();
        Eu(e, s);
      }
    }
    function eC(e) {
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
    function Z1(e, t) {
      if (se(null, t, null), oe()) {
        var s = ke();
        Eu(e, s);
      }
    }
    function Y1(e, t) {
      switch (t.tag) {
        case Oe:
        case D:
        case ge:
        case Mt:
          return;
        case ce: {
          if (t.effectTag & Va && e !== null) {
            var s = e.memoizedProps, u = e.memoizedState;
            as(t, "getSnapshotBeforeUpdate");
            var d = t.stateNode;
            t.type === t.elementType && !wu && (d.props !== t.memoizedProps && g("Expected %s props to match memoized props before getSnapshotBeforeUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(t.type) || "instance"), d.state !== t.memoizedState && g("Expected %s state to match memoized state before getSnapshotBeforeUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(t.type) || "instance"));
            var p = d.getSnapshotBeforeUpdate(t.elementType === t.type ? s : ma(t.type, s), u);
            {
              var w = K0;
              p === void 0 && !w.has(t.type) && (w.add(t.type), g("%s.getSnapshotBeforeUpdate(): A snapshot value (or null) must be returned. You have returned undefined.", Te(t.type)));
            }
            d.__reactInternalSnapshotBeforeUpdate = p, ss();
          }
          return;
        }
        case Se:
        case Re:
        case Qe:
        case Ue:
        case Xe:
          return;
      }
      throw Error("This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue.");
    }
    function tC(e, t) {
      var s = t.updateQueue, u = s !== null ? s.lastEffect : null;
      if (u !== null) {
        var d = u.next, p = d;
        do {
          if ((p.tag & e) === e) {
            var w = p.destroy;
            p.destroy = void 0, w !== void 0 && w();
          }
          p = p.next;
        } while (p !== d);
      }
    }
    function nC(e, t) {
      var s = t.updateQueue, u = s !== null ? s.lastEffect : null;
      if (u !== null) {
        var d = u.next, p = d;
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
    function G1(e) {
      if ((e.effectTag & Ua) !== _t)
        switch (e.tag) {
          case Oe:
          case D:
          case ge:
          case Mt: {
            tC(av | ud, e), nC(av | ud, e);
            break;
          }
        }
    }
    function X1(e, t, s, u) {
      switch (s.tag) {
        case Oe:
        case D:
        case ge:
        case Mt: {
          nC(cd | ud, s);
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
          b !== null && (s.type === s.elementType && !wu && (d.props !== s.memoizedProps && g("Expected %s props to match memoized props before processing the update queue. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(s.type) || "instance"), d.state !== s.memoizedState && g("Expected %s state to match memoized state before processing the update queue. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Te(s.type) || "instance")), i0(s, b, d));
          return;
        }
        case Se: {
          var E = s.updateQueue;
          if (E !== null) {
            var k = null;
            if (s.child !== null)
              switch (s.child.tag) {
                case Re:
                  k = s.child.stateNode;
                  break;
                case ce:
                  k = s.child.stateNode;
                  break;
              }
            i0(s, E, k);
          }
          return;
        }
        case Re: {
          var N = s.stateNode;
          if (t === null && s.effectTag & xt) {
            var J = s.type, L = s.memoizedProps;
            mt(N, J, L);
          }
          return;
        }
        case Qe:
          return;
        case Ue:
          return;
        case B: {
          {
            var K = s.memoizedProps.onRender;
            typeof K == "function" && K(s.memoizedProps.id, t === null ? "mount" : "update", s.actualDuration, s.treeBaseDuration, s.actualStartTime, g1(), e.memoizedInteractions);
          }
          return;
        }
        case ee: {
          aR(e, s);
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
    function J1(e, t) {
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
    function q1(e) {
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
    function K1(e) {
      var t = e.ref;
      t !== null && (typeof t == "function" ? t(null) : t.current = null);
    }
    function iC(e, t, s) {
      switch (aD(t), t.tag) {
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
                var w = s > ha ? ha : s;
                co(w, function() {
                  var E = p;
                  do {
                    var k = E.destroy;
                    k !== void 0 && Z1(t, k), E = E.next;
                  } while (E !== p);
                });
              }
            }
          }
          return;
        }
        case ce: {
          eC(t);
          var b = t.stateNode;
          typeof b.componentWillUnmount == "function" && Q1(t, b);
          return;
        }
        case Re: {
          eC(t);
          return;
        }
        case Ue: {
          oC(e, t, s);
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
    function eR(e, t, s) {
      for (var u = t; ; ) {
        if (iC(e, u, s), u.child !== null && u.tag !== Ue) {
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
    function rC(e) {
      var t = e.alternate;
      e.return = null, e.child = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.alternate = null, e.firstEffect = null, e.lastEffect = null, e.pendingProps = null, e.memoizedProps = null, e.stateNode = null, t !== null && rC(t);
    }
    function tR(e) {
      for (var t = e.return; t !== null; ) {
        if (aC(t))
          return t;
        t = t.return;
      }
      throw Error("Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue.");
    }
    function aC(e) {
      return e.tag === Re || e.tag === Se || e.tag === Ue;
    }
    function nR(e) {
      var t = e;
      e:
        for (; ; ) {
          for (; t.sibling === null; ) {
            if (t.return === null || aC(t.return))
              return null;
            t = t.return;
          }
          for (t.sibling.return = t.return, t = t.sibling; t.tag !== Re && t.tag !== Qe && t.tag !== Be; ) {
            if (t.effectTag & Cn || t.child === null || t.tag === Ue)
              continue e;
            t.child.return = t, t = t.child;
          }
          if (!(t.effectTag & Cn))
            return t.stateNode;
        }
    }
    function sC(e) {
      var t = tR(e), s, u, d = t.stateNode;
      switch (t.tag) {
        case Re:
          s = d, u = !1;
          break;
        case Se:
          s = d.containerInfo, u = !0;
          break;
        case Ue:
          s = d.containerInfo, u = !0;
          break;
        case gt:
        default:
          throw Error("Invalid host parent fiber. This error is likely caused by a bug in React. Please file an issue.");
      }
      t.effectTag & Ri && (Pi(s), t.effectTag &= ~Ri);
      var p = nR(e);
      u ? Rw(e, p, s) : Dw(e, p, s);
    }
    function Rw(e, t, s) {
      var u = e.tag, d = u === Re || u === Qe;
      if (d || vn) {
        var p = d ? e.stateNode : e.stateNode.instance;
        t ? le(s, p, t) : P(s, p);
      } else if (u !== Ue) {
        var w = e.child;
        if (w !== null) {
          Rw(w, t, s);
          for (var b = w.sibling; b !== null; )
            Rw(b, t, s), b = b.sibling;
        }
      }
    }
    function Dw(e, t, s) {
      var u = e.tag, d = u === Re || u === Qe;
      if (d || vn) {
        var p = d ? e.stateNode : e.stateNode.instance;
        t ? Q(s, p, t) : O(s, p);
      } else if (u !== Ue) {
        var w = e.child;
        if (w !== null) {
          Dw(w, t, s);
          for (var b = w.sibling; b !== null; )
            Dw(b, t, s), b = b.sibling;
        }
      }
    }
    function oC(e, t, s) {
      for (var u = t, d = !1, p, w; ; ) {
        if (!d) {
          var b = u.return;
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
                case Ue:
                  p = E.containerInfo, w = !0;
                  break e;
              }
              b = b.return;
            }
          d = !0;
        }
        if (u.tag === Re || u.tag === Qe)
          eR(e, u, s), w ? _e(p, u.stateNode) : ye(p, u.stateNode);
        else if (u.tag === Ue) {
          if (u.child !== null) {
            p = u.stateNode.containerInfo, w = !0, u.child.return = u, u = u.child;
            continue;
          }
        } else if (iC(e, u, s), u.child !== null) {
          u.child.return = u, u = u.child;
          continue;
        }
        if (u === t)
          return;
        for (; u.sibling === null; ) {
          if (u.return === null || u.return === t)
            return;
          u = u.return, u.tag === Ue && (d = !1);
        }
        u.sibling.return = u.return, u = u.sibling;
      }
    }
    function iR(e, t, s) {
      oC(e, t, s), rC(t);
    }
    function kw(e, t) {
      switch (t.tag) {
        case Oe:
        case D:
        case Ce:
        case ge:
        case Mt: {
          tC(cd | ud, t);
          return;
        }
        case ce:
          return;
        case Re: {
          var s = t.stateNode;
          if (s != null) {
            var u = t.memoizedProps, d = e !== null ? e.memoizedProps : u, p = t.type, w = t.updateQueue;
            t.updateQueue = null, w !== null && Et(s, w, p, d, u);
          }
          return;
        }
        case Qe: {
          if (t.stateNode === null)
            throw Error("This should have a text node initialized. This error is likely caused by a bug in React. Please file an issue.");
          var b = t.stateNode, E = t.memoizedProps, k = e !== null ? e.memoizedProps : E;
          Fn(b, k, E);
          return;
        }
        case Se: {
          {
            var N = t.stateNode;
            N.hydrate && (N.hydrate = !1, eI(N.containerInfo));
          }
          return;
        }
        case B:
          return;
        case ee: {
          rR(t), lC(t);
          return;
        }
        case dt: {
          lC(t);
          return;
        }
        case Xe:
          return;
      }
      throw Error("This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue.");
    }
    function rR(e) {
      var t = e.memoizedState, s, u = e;
      t === null ? s = !1 : (s = !0, u = e.child, CR()), u !== null && J1(u, s);
    }
    function aR(e, t) {
      var s = t.memoizedState;
      if (s === null) {
        var u = t.alternate;
        if (u !== null) {
          var d = u.memoizedState;
          if (d !== null) {
            var p = d.dehydrated;
            p !== null && tI(p);
          }
        }
      }
    }
    function lC(e) {
      var t = e.updateQueue;
      if (t !== null) {
        e.updateQueue = null;
        var s = e.stateNode;
        s === null && (s = e.stateNode = new F1()), t.forEach(function(u) {
          var d = WR.bind(null, e, u);
          s.has(u) || (u.__reactDoNotTraceInteractions !== !0 && (d = h.unstable_wrap(d)), s.add(u), u.then(d, d));
        });
      }
    }
    function sR(e) {
      Pi(e.stateNode);
    }
    var oR = typeof WeakMap == "function" ? WeakMap : Map;
    function uC(e, t, s) {
      var u = Go(s, null);
      u.tag = Sy, u.payload = {
        element: null
      };
      var d = t.value;
      return u.callback = function() {
        VR(d), Aw(e, t);
      }, u;
    }
    function cC(e, t, s) {
      var u = Go(s, null);
      u.tag = Sy;
      var d = e.type.getDerivedStateFromError;
      if (typeof d == "function") {
        var p = t.value;
        u.payload = function() {
          return Aw(e, t), d(p);
        };
      }
      var w = e.stateNode;
      return w !== null && typeof w.componentDidCatch == "function" ? u.callback = function() {
        Yx(e), typeof d != "function" && (BR(this), Aw(e, t));
        var E = t.value, k = t.stack;
        this.componentDidCatch(E, {
          componentStack: k !== null ? k : ""
        }), typeof d != "function" && e.expirationTime !== Ct && g("%s: Error boundaries should implement getDerivedStateFromError(). In that method, return a state update to display an error message or fallback UI.", Te(e.type) || "Unknown");
      } : u.callback = function() {
        Yx(e);
      }, u;
    }
    function lR(e, t, s) {
      var u = e.pingCache, d;
      if (u === null ? (u = e.pingCache = new oR(), d = /* @__PURE__ */ new Set(), u.set(s, d)) : (d = u.get(s), d === void 0 && (d = /* @__PURE__ */ new Set(), u.set(s, d))), !d.has(t)) {
        d.add(t);
        var p = UR.bind(null, e, s, t);
        s.then(p, p);
      }
    }
    function uR(e, t, s, u, d) {
      if (s.effectTag |= Po, s.firstEffect = s.lastEffect = null, u !== null && typeof u == "object" && typeof u.then == "function") {
        var p = u;
        if ((s.mode & Hr) === oi) {
          var w = s.alternate;
          w ? (s.updateQueue = w.updateQueue, s.memoizedState = w.memoizedState, s.expirationTime = w.expirationTime) : (s.updateQueue = null, s.memoizedState = null);
        }
        var b = iv(va.current, $y), E = t;
        do {
          if (E.tag === ee && f1(E, b)) {
            var k = E.updateQueue;
            if (k === null) {
              var N = /* @__PURE__ */ new Set();
              N.add(p), E.updateQueue = N;
            } else
              k.add(p);
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
            lR(e, d, p), E.effectTag |= mi, E.expirationTime = d;
            return;
          }
          E = E.return;
        } while (E !== null);
        u = new Error((Te(s.type) || "A React component") + ` suspended while rendering, but no fallback UI was specified.

Add a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display.` + $n(s));
      }
      ER(), u = Iw(u, s);
      var K = t;
      do {
        switch (K.tag) {
          case Se: {
            var me = u;
            K.effectTag |= mi, K.expirationTime = d;
            var we = uC(K, me, d);
            t0(K, we);
            return;
          }
          case ce:
            var Ke = u, nt = K.type, Pt = K.stateNode;
            if ((K.effectTag & Vt) === _t && (typeof nt.getDerivedStateFromError == "function" || Pt !== null && typeof Pt.componentDidCatch == "function" && !MC(Pt))) {
              K.effectTag |= mi, K.expirationTime = d;
              var vt = cC(K, Ke, d);
              t0(K, vt);
              return;
            }
            break;
        }
        K = K.return;
      } while (K !== null);
    }
    var cR = Math.ceil, Nw = m.ReactCurrentDispatcher, dC = m.ReactCurrentOwner, _w = m.IsSomeRendererActing, In = 0, Cv = 1, dR = 2, fC = 4, Pw = 8, wr = 16, hs = 32, bu = 0, Tv = 1, hC = 2, Mv = 3, Ev = 4, zw = 5, rt = In, Gi = null, We = null, ui = Ae, Yn = bu, Iv = null, ho = Ct, Ph = Ct, Av = null, zh = Ae, Rv = !1, Ow = 0, pC = 500, Ve = null, Dv = !1, Lw = null, gd = null, Oh = !1, yd = null, Lh = Kc, Bw = Ae, Su = null, fR = 50, Bh = 0, jw = null, hR = 50, kv = 0, jh = null, xu = null, Vh = Ae;
    function ps() {
      return (rt & (wr | hs)) !== In ? dy(vr()) : (Vh !== Ae || (Vh = dy(vr())), Vh);
    }
    function pR() {
      return dy(vr());
    }
    function Cu(e, t, s) {
      var u = t.mode;
      if ((u & Hr) === oi)
        return Ct;
      var d = ed();
      if ((u & td) === oi)
        return d === Li ? Ct : Ux;
      if ((rt & wr) !== In)
        return ui;
      var p;
      if (s !== null)
        p = WA(e, s.timeoutMs | 0 || vh);
      else
        switch (d) {
          case Li:
            p = Ct;
            break;
          case Yo:
            p = Fx(e);
            break;
          case ha:
          case uy:
            p = HA(e);
            break;
          case hh:
            p = du;
            break;
          default:
            throw Error("Expected a valid priority level");
        }
      return Gi !== null && p === ui && (p -= 1), p;
    }
    function mR(e, t) {
      QR(), JR(e);
      var s = Nv(e, t);
      if (s === null) {
        GR(e);
        return;
      }
      YR(e, t), AA();
      var u = ed();
      if (t === Ct ? (rt & Pw) !== In && (rt & (wr | hs)) === In ? (nl(s, t), Vw(s)) : (br(s), nl(s, t), rt === In && us()) : (br(s), nl(s, t)), (rt & fC) !== In && (u === Yo || u === Li))
        if (Su === null)
          Su = /* @__PURE__ */ new Map([[s, t]]);
        else {
          var d = Su.get(s);
          (d === void 0 || d > t) && Su.set(s, t);
        }
    }
    var Zr = mR;
    function Nv(e, t) {
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
      return d !== null && (Gi === d && (Ov(t), Yn === Ev && Ru(d, ui)), BC(d, t)), d;
    }
    function _v(e) {
      var t = e.lastExpiredTime;
      if (t !== Ae)
        return t;
      var s = e.firstPendingTime;
      if (!LC(e, s))
        return s;
      var u = e.lastPingedTime, d = e.nextKnownPendingLevel, p = u > d ? u : d;
      return p <= du && s !== p ? Ae : p;
    }
    function br(e) {
      var t = e.lastExpiredTime;
      if (t !== Ae) {
        e.callbackExpirationTime = Ct, e.callbackPriority = Li, e.callbackNode = Bx(Vw.bind(null, e));
        return;
      }
      var s = _v(e), u = e.callbackNode;
      if (s === Ae) {
        u !== null && (e.callbackNode = null, e.callbackExpirationTime = Ae, e.callbackPriority = Kc);
        return;
      }
      var d = ps(), p = $x(d, s);
      if (u !== null) {
        var w = e.callbackPriority, b = e.callbackExpirationTime;
        if (b === s && w >= p)
          return;
        VA(u);
      }
      e.callbackExpirationTime = s, e.callbackPriority = p;
      var E;
      s === Ct ? E = Bx(Vw.bind(null, e)) : E = ph(
        p,
        mC.bind(null, e),
        {
          timeout: fu(s) - vr()
        }
      ), e.callbackNode = E;
    }
    function mC(e, t) {
      if (Vh = Ae, t) {
        var s = ps();
        return nb(e, s), br(e), null;
      }
      var u = _v(e);
      if (u !== Ae) {
        var d = e.callbackNode;
        if ((rt & (wr | hs)) !== In)
          throw Error("Should not already be working.");
        if (tl(), (e !== Gi || u !== ui) && (Tu(e, u), _C(e, u)), We !== null) {
          var p = rt;
          rt |= wr;
          var w = bC(), b = Pv(e);
          vx(We);
          do
            try {
              kR();
              break;
            } catch (N) {
              wC(e, N);
            }
          while (!0);
          if ($m(), rt = p, SC(w), zv(b), Yn === Tv) {
            var E = Iv;
            throw Hw(), Tu(e, u), Ru(e, u), br(e), E;
          }
          if (We !== null)
            Hw();
          else {
            IC();
            var k = e.finishedWork = e.current.alternate;
            e.finishedExpirationTime = u, vR(e, k, Yn, u);
          }
          if (br(e), e.callbackNode === d)
            return mC.bind(null, e);
        }
      }
      return null;
    }
    function vR(e, t, s, u) {
      switch (Gi = null, s) {
        case bu:
        case Tv:
          throw Error("Root did not complete. This is a bug in React.");
        case hC: {
          nb(e, u > du ? du : u);
          break;
        }
        case Mv: {
          Ru(e, u);
          var d = e.lastSuspendedTime;
          u === d && (e.nextKnownPendingLevel = Uw(t));
          var p = ho === Ct;
          if (p && !Iu.current) {
            var w = Ow + pC - vr();
            if (w > 10) {
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
              e.timeoutHandle = V(Mu.bind(null, e), w);
              break;
            }
          }
          Mu(e);
          break;
        }
        case Ev: {
          Ru(e, u);
          var k = e.lastSuspendedTime;
          if (u === k && (e.nextKnownPendingLevel = Uw(t)), !Iu.current) {
            if (Rv) {
              var N = e.lastPingedTime;
              if (N === Ae || N >= u) {
                e.lastPingedTime = u, Tu(e, u);
                break;
              }
            }
            var J = _v(e);
            if (J !== Ae && J !== u)
              break;
            if (k !== Ae && k !== u) {
              e.lastPingedTime = k;
              break;
            }
            var L;
            if (Ph !== Ct)
              L = fu(Ph) - vr();
            else if (ho === Ct)
              L = 0;
            else {
              var K = AR(ho), me = vr(), we = fu(u) - me, Ke = me - K;
              Ke < 0 && (Ke = 0), L = FR(Ke) - Ke, we < L && (L = we);
            }
            if (L > 10) {
              e.timeoutHandle = V(Mu.bind(null, e), L);
              break;
            }
          }
          Mu(e);
          break;
        }
        case zw: {
          if (!Iu.current && ho !== Ct && Av !== null) {
            var nt = $R(ho, u, Av);
            if (nt > 10) {
              Ru(e, u), e.timeoutHandle = V(Mu.bind(null, e), nt);
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
    function Vw(e) {
      var t = e.lastExpiredTime, s = t !== Ae ? t : Ct;
      if ((rt & (wr | hs)) !== In)
        throw Error("Should not already be working.");
      if (tl(), (e !== Gi || s !== ui) && (Tu(e, s), _C(e, s)), We !== null) {
        var u = rt;
        rt |= wr;
        var d = bC(), p = Pv(e);
        vx(We);
        do
          try {
            DR();
            break;
          } catch (b) {
            wC(e, b);
          }
        while (!0);
        if ($m(), rt = u, SC(d), zv(p), Yn === Tv) {
          var w = Iv;
          throw Hw(), Tu(e, s), Ru(e, s), br(e), w;
        }
        if (We !== null)
          throw Error("Cannot commit an incomplete root. This error is likely caused by a bug in React. Please file an issue.");
        IC(), e.finishedWork = e.current.alternate, e.finishedExpirationTime = s, gR(e), br(e);
      }
      return null;
    }
    function gR(e) {
      Gi = null, Mu(e);
    }
    function yR() {
      if ((rt & (Cv | wr | hs)) !== In) {
        (rt & wr) !== In && g("unstable_flushDiscreteUpdates: Cannot flush updates when React is already rendering.");
        return;
      }
      bR(), tl();
    }
    function wR(e, t, s, u) {
      return co(Li, e.bind(null, t, s, u));
    }
    function bR() {
      if (Su !== null) {
        var e = Su;
        Su = null, e.forEach(function(t, s) {
          nb(s, t), br(s);
        }), us();
      }
    }
    function vC(e, t) {
      var s = rt;
      rt |= Cv;
      try {
        return e(t);
      } finally {
        rt = s, rt === In && us();
      }
    }
    function SR(e, t) {
      var s = rt;
      rt |= dR;
      try {
        return e(t);
      } finally {
        rt = s, rt === In && us();
      }
    }
    function xR(e, t, s, u, d) {
      var p = rt;
      rt |= fC;
      try {
        return co(Yo, e.bind(null, t, s, u, d));
      } finally {
        rt = p, rt === In && us();
      }
    }
    function gC(e, t) {
      var s = rt;
      rt &= ~Cv, rt |= Pw;
      try {
        return e(t);
      } finally {
        rt = s, rt === In && us();
      }
    }
    function yC(e, t) {
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
        for (var u = We.return; u !== null; )
          q0(u), u = u.return;
      Gi = e, We = Au(e.current, null), ui = t, Yn = bu, Iv = null, ho = Ct, Ph = Ct, Av = null, zh = Ae, Rv = !1, xu = null, pa.discardPendingWarnings();
    }
    function wC(e, t) {
      do {
        try {
          if ($m(), g0(), rr(), We === null || We.return === null)
            return Yn = Tv, Iv = t, We = null, null;
          Er && We.mode & cs && wv(We, !0), uR(e, We.return, We, t, ui), We = TC(We);
        } catch (s) {
          t = s;
          continue;
        }
        return;
      } while (!0);
    }
    function bC(e) {
      var t = Nw.current;
      return Nw.current = vv, t === null ? vv : t;
    }
    function SC(e) {
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
    function CR() {
      Ow = vr();
    }
    function xC(e, t) {
      e < ho && e > du && (ho = e), t !== null && e < Ph && e > du && (Ph = e, Av = t);
    }
    function Ov(e) {
      e > zh && (zh = e);
    }
    function TR() {
      Yn === bu && (Yn = Mv);
    }
    function MR() {
      (Yn === bu || Yn === Mv) && (Yn = Ev), zh !== Ae && Gi !== null && (Ru(Gi, ui), BC(Gi, zh));
    }
    function ER() {
      Yn !== zw && (Yn = hC);
    }
    function IR() {
      return Yn === bu;
    }
    function AR(e) {
      var t = fu(e);
      return t - vh;
    }
    function RR(e, t) {
      var s = fu(e);
      return s - (t.timeoutMs | 0 || vh);
    }
    function DR() {
      for (; We !== null; )
        We = CC(We);
    }
    function kR() {
      for (; We !== null && !BA(); )
        We = CC(We);
    }
    function CC(e) {
      var t = e.alternate;
      hx(e), Co(e);
      var s;
      return (e.mode & cs) !== oi ? (dw(e), s = Ww(t, e, ui), wv(e, !0)) : s = Ww(t, e, ui), rr(), e.memoizedProps = e.pendingProps, s === null && (s = TC(e)), dC.current = null, s;
    }
    function TC(e) {
      We = e;
      do {
        var t = We.alternate, s = We.return;
        if ((We.effectTag & Po) === _t) {
          Co(We);
          var u = void 0;
          if ((We.mode & cs) === oi ? u = J0(t, We, ui) : (dw(We), u = J0(t, We, ui), wv(We, !1)), mx(We), rr(), NR(We), u !== null)
            return u;
          if (s !== null && (s.effectTag & Po) === _t) {
            s.firstEffect === null && (s.firstEffect = We.firstEffect), We.lastEffect !== null && (s.lastEffect !== null && (s.lastEffect.nextEffect = We.firstEffect), s.lastEffect = We.lastEffect);
            var d = We.effectTag;
            d > lr && (s.lastEffect !== null ? s.lastEffect.nextEffect = We : s.firstEffect = We, s.lastEffect = We);
          }
        } else {
          var p = H1(We);
          if ((We.mode & cs) !== oi) {
            wv(We, !1);
            for (var w = We.actualDuration, b = We.child; b !== null; )
              w += b.actualDuration, b = b.sibling;
            We.actualDuration = w;
          }
          if (p !== null)
            return RA(We), p.effectTag &= xf, p;
          mx(We), s !== null && (s.firstEffect = s.lastEffect = null, s.effectTag |= Po);
        }
        var E = We.sibling;
        if (E !== null)
          return E;
        We = s;
      } while (We !== null);
      return Yn === bu && (Yn = zw), null;
    }
    function Uw(e) {
      var t = e.expirationTime, s = e.childExpirationTime;
      return t > s ? t : s;
    }
    function NR(e) {
      if (!(ui !== ds && e.childExpirationTime === ds)) {
        var t = Ae;
        if ((e.mode & cs) !== oi) {
          for (var s = e.actualDuration, u = e.selfBaseDuration, d = e.alternate === null || e.child !== e.alternate.child, p = e.child; p !== null; ) {
            var w = p.expirationTime, b = p.childExpirationTime;
            w > t && (t = w), b > t && (t = b), d && (s += p.actualDuration), u += p.treeBaseDuration, p = p.sibling;
          }
          e.actualDuration = s, e.treeBaseDuration = u;
        } else
          for (var E = e.child; E !== null; ) {
            var k = E.expirationTime, N = E.childExpirationTime;
            k > t && (t = k), N > t && (t = N), E = E.sibling;
          }
        e.childExpirationTime = t;
      }
    }
    function Mu(e) {
      var t = ed();
      return co(Li, _R.bind(null, e, t)), null;
    }
    function _R(e, t) {
      do
        tl();
      while (yd !== null);
      if (ZR(), (rt & (wr | hs)) !== In)
        throw Error("Should not already be working.");
      var s = e.finishedWork, u = e.finishedExpirationTime;
      if (s === null)
        return null;
      if (e.finishedWork = null, e.finishedExpirationTime = Ae, s === e.current)
        throw Error("Cannot commit the same tree as before. This error is likely caused by a bug in React. Please file an issue.");
      e.callbackNode = null, e.callbackExpirationTime = Ae, e.callbackPriority = Kc, e.nextKnownPendingLevel = Ae, DA();
      var d = Uw(s);
      bD(e, u, d), e === Gi && (Gi = null, We = null, ui = Ae);
      var p;
      if (s.effectTag > lr ? s.lastEffect !== null ? (s.lastEffect.nextEffect = s, p = s.firstEffect) : p = s : p = s.firstEffect, p !== null) {
        var w = rt;
        rt |= hs;
        var b = Pv(e);
        dC.current = null, yx(), i(e.containerInfo), Ve = p;
        do
          if (se(null, PR, null), oe()) {
            if (Ve === null)
              throw Error("Should be working on an effect.");
            var E = ke();
            Eu(Ve, E), Ve = Ve.nextEffect;
          }
        while (Ve !== null);
        wx(), R0(), bx(), Ve = p;
        do
          if (se(null, zR, null, e, t), oe()) {
            if (Ve === null)
              throw Error("Should be working on an effect.");
            var k = ke();
            Eu(Ve, k), Ve = Ve.nextEffect;
          }
        while (Ve !== null);
        Sx(), a(e.containerInfo), e.current = s, xx(), Ve = p;
        do
          if (se(null, OR, null, e, u), oe()) {
            if (Ve === null)
              throw Error("Should be working on an effect.");
            var N = ke();
            Eu(Ve, N), Ve = Ve.nextEffect;
          }
        while (Ve !== null);
        Cx(), Ve = null, jA(), zv(b), rt = w;
      } else
        e.current = s, yx(), wx(), R0(), bx(), Sx(), xx(), Cx();
      kA();
      var J = Oh;
      if (Oh)
        Oh = !1, yd = e, Bw = u, Lh = t;
      else
        for (Ve = p; Ve !== null; ) {
          var L = Ve.nextEffect;
          Ve.nextEffect = null, Ve = L;
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
      if (J || PC(e, u), K === Ct ? e === jw ? Bh++ : (Bh = 0, jw = e) : Bh = 0, rD(s.stateNode, u), br(e), Dv) {
        Dv = !1;
        var Ke = Lw;
        throw Lw = null, Ke;
      }
      return (rt & Pw) !== In || us(), null;
    }
    function PR() {
      for (; Ve !== null; ) {
        var e = Ve.effectTag;
        if ((e & Va) !== _t) {
          Co(Ve), Nm();
          var t = Ve.alternate;
          Y1(t, Ve), rr();
        }
        (e & Ua) !== _t && (Oh || (Oh = !0, ph(ha, function() {
          return tl(), null;
        }))), Ve = Ve.nextEffect;
      }
    }
    function zR(e, t) {
      for (; Ve !== null; ) {
        Co(Ve);
        var s = Ve.effectTag;
        if (s & Ri && sR(Ve), s & pi) {
          var u = Ve.alternate;
          u !== null && K1(u);
        }
        var d = s & (Cn | xt | Vs | $i);
        switch (d) {
          case Cn: {
            sC(Ve), Ve.effectTag &= ~Cn;
            break;
          }
          case zp: {
            sC(Ve), Ve.effectTag &= ~Cn;
            var p = Ve.alternate;
            kw(p, Ve);
            break;
          }
          case $i: {
            Ve.effectTag &= ~$i;
            break;
          }
          case fc: {
            Ve.effectTag &= ~$i;
            var w = Ve.alternate;
            kw(w, Ve);
            break;
          }
          case xt: {
            var b = Ve.alternate;
            kw(b, Ve);
            break;
          }
          case Vs: {
            iR(e, Ve, t);
            break;
          }
        }
        Nm(), rr(), Ve = Ve.nextEffect;
      }
    }
    function OR(e, t) {
      for (; Ve !== null; ) {
        Co(Ve);
        var s = Ve.effectTag;
        if (s & (xt | bf)) {
          Nm();
          var u = Ve.alternate;
          X1(e, u, Ve);
        }
        s & pi && (Nm(), q1(Ve)), rr(), Ve = Ve.nextEffect;
      }
    }
    function tl() {
      if (Lh !== Kc) {
        var e = Lh > ha ? ha : Lh;
        return Lh = Kc, co(e, LR);
      }
    }
    function LR() {
      if (yd === null)
        return !1;
      var e = yd, t = Bw;
      if (yd = null, Bw = Ae, (rt & (wr | hs)) !== In)
        throw Error("Cannot flush passive effects while already rendering.");
      var s = rt;
      rt |= hs;
      for (var u = Pv(e), d = e.current.firstEffect; d !== null; ) {
        {
          if (Co(d), se(null, G1, null, d), oe()) {
            if (d === null)
              throw Error("Should be working on an effect.");
            var p = ke();
            Eu(d, p);
          }
          rr();
        }
        var w = d.nextEffect;
        d.nextEffect = null, d = w;
      }
      return zv(u), PC(e, t), rt = s, us(), kv = yd === null ? 0 : kv + 1, !0;
    }
    function MC(e) {
      return gd !== null && gd.has(e);
    }
    function BR(e) {
      gd === null ? gd = /* @__PURE__ */ new Set([e]) : gd.add(e);
    }
    function jR(e) {
      Dv || (Dv = !0, Lw = e);
    }
    var VR = jR;
    function EC(e, t, s) {
      var u = Iw(s, t), d = uC(e, u, Ct);
      Xo(e, d);
      var p = Nv(e, Ct);
      p !== null && (br(p), nl(p, Ct));
    }
    function Eu(e, t) {
      if (e.tag === Se) {
        EC(e, e, t);
        return;
      }
      for (var s = e.return; s !== null; ) {
        if (s.tag === Se) {
          EC(s, e, t);
          return;
        } else if (s.tag === ce) {
          var u = s.type, d = s.stateNode;
          if (typeof u.getDerivedStateFromError == "function" || typeof d.componentDidCatch == "function" && !MC(d)) {
            var p = Iw(t, e), w = cC(
              s,
              p,
              Ct
            );
            Xo(s, w);
            var b = Nv(s, Ct);
            b !== null && (br(b), nl(b, Ct));
            return;
          }
        }
        s = s.return;
      }
    }
    function UR(e, t, s) {
      var u = e.pingCache;
      if (u !== null && u.delete(t), Gi === e && ui === s) {
        Yn === Ev || Yn === Mv && ho === Ct && vr() - Ow < pC ? Tu(e, ui) : Rv = !0;
        return;
      }
      if (!!LC(e, s)) {
        var d = e.lastPingedTime;
        d !== Ae && d < s || (e.lastPingedTime = s, br(e), nl(e, s));
      }
    }
    function HR(e, t) {
      if (t === Ae) {
        var s = null, u = ps();
        t = Cu(u, e, s);
      }
      var d = Nv(e, t);
      d !== null && (br(d), nl(d, t));
    }
    function WR(e, t) {
      var s = Ae, u;
      u = e.stateNode, u !== null && u.delete(t), HR(e, s);
    }
    function FR(e) {
      return e < 120 ? 120 : e < 480 ? 480 : e < 1080 ? 1080 : e < 1920 ? 1920 : e < 3e3 ? 3e3 : e < 4320 ? 4320 : cR(e / 1960) * 1960;
    }
    function $R(e, t, s) {
      var u = s.busyMinDurationMs | 0;
      if (u <= 0)
        return 0;
      var d = s.busyDelayMs | 0, p = vr(), w = RR(e, s), b = p - w;
      if (b <= d)
        return 0;
      var E = d + u - b;
      return E;
    }
    function QR() {
      if (Bh > fR)
        throw Bh = 0, jw = null, Error("Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.");
      kv > hR && (kv = 0, g("Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render."));
    }
    function ZR() {
      pa.flushLegacyContextWarning(), pa.flushPendingUnsafeLifecycleWarnings();
    }
    function IC() {
      var e = !0;
      gx(jh, e), jh = null;
    }
    function Hw() {
      var e = !1;
      gx(jh, e), jh = null;
    }
    function YR(e, t) {
      Gi !== null && t > ui && (jh = e);
    }
    var Lv = null;
    function GR(e) {
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
    var Ww;
    {
      var XR = null;
      Ww = function(e, t, s) {
        var u = OC(XR, t);
        try {
          return Q0(e, t, s);
        } catch (p) {
          if (p !== null && typeof p == "object" && typeof p.then == "function")
            throw p;
          if ($m(), g0(), q0(t), OC(t, u), t.mode & cs && dw(t), se(null, Q0, null, e, t, s), oe()) {
            var d = ke();
            throw d;
          } else
            throw p;
        }
      };
    }
    var AC = !1, Fw;
    Fw = /* @__PURE__ */ new Set();
    function JR(e) {
      if (yl && (rt & wr) !== In)
        switch (e.tag) {
          case Oe:
          case D:
          case ge: {
            var t = We && Te(We.type) || "Unknown", s = t;
            if (!Fw.has(s)) {
              Fw.add(s);
              var u = Te(e.type) || "Unknown";
              g("Cannot update a component (`%s`) while rendering a different component (`%s`). To locate the bad setState() call inside `%s`, follow the stack trace as described in https://fb.me/setstate-in-render", u, t, t);
            }
            break;
          }
          case ce: {
            AC || (g("Cannot update during an existing state transition (such as within `render`). Render methods should be a pure function of props and state."), AC = !0);
            break;
          }
        }
    }
    var Iu = {
      current: !1
    };
    function RC(e) {
      _w.current === !0 && Iu.current !== !0 && g(`It looks like you're using the wrong act() around your test interactions.
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
    function DC(e) {
      (e.mode & yn) !== oi && _w.current === !1 && Iu.current === !1 && g(`An update to %s ran an effect, but was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://fb.me/react-wrap-tests-with-act%s`, Te(e.type), $n(e));
    }
    function qR(e) {
      rt === In && _w.current === !1 && Iu.current === !1 && g(`An update to %s inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://fb.me/react-wrap-tests-with-act%s`, Te(e.type), $n(e));
    }
    var KR = qR, kC = !1;
    function eD(e) {
      kC === !1 && o.unstable_flushAllWithoutAsserting === void 0 && (e.mode & Hr || e.mode & td) && (kC = !0, g(`In Concurrent or Sync modes, the "scheduler" module needs to be mocked to guarantee consistent behaviour across tests and browsers. For example, with jest: 
jest.mock('scheduler', () => require('scheduler/unstable_mock'));

For more info, visit https://fb.me/react-mock-scheduler`));
    }
    function $w(e, t) {
      return t * 1e3 + e.interactionThreadID;
    }
    function Qw(e) {
      xu === null ? xu = [e] : xu.push(e);
    }
    function NC(e, t, s) {
      if (s.size > 0) {
        var u = e.pendingInteractionMap, d = u.get(t);
        d != null ? s.forEach(function(b) {
          d.has(b) || b.__count++, d.add(b);
        }) : (u.set(t, new Set(s)), s.forEach(function(b) {
          b.__count++;
        }));
        var p = h.__subscriberRef.current;
        if (p !== null) {
          var w = $w(e, t);
          p.onWorkScheduled(s, w);
        }
      }
    }
    function nl(e, t) {
      NC(e, t, h.__interactionsRef.current);
    }
    function _C(e, t) {
      var s = /* @__PURE__ */ new Set();
      if (e.pendingInteractionMap.forEach(function(p, w) {
        w >= t && p.forEach(function(b) {
          return s.add(b);
        });
      }), e.memoizedInteractions = s, s.size > 0) {
        var u = h.__subscriberRef.current;
        if (u !== null) {
          var d = $w(e, t);
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
    function PC(e, t) {
      var s = e.firstPendingTime, u;
      try {
        if (u = h.__subscriberRef.current, u !== null && e.memoizedInteractions.size > 0) {
          var d = $w(e, t);
          u.onWorkStopped(e.memoizedInteractions, d);
        }
      } catch (w) {
        ph(Li, function() {
          throw w;
        });
      } finally {
        var p = e.pendingInteractionMap;
        p.forEach(function(w, b) {
          b > s && (p.delete(b), w.forEach(function(E) {
            if (E.__count--, u !== null && E.__count === 0)
              try {
                u.onInteractionScheduledWorkCompleted(E);
              } catch (k) {
                ph(Li, function() {
                  throw k;
                });
              }
          }));
        });
      }
    }
    var Zw = null, Yw = null, Gw = null, wd = !1, tD = typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u";
    function nD(e) {
      if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u")
        return !1;
      var t = __REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (t.isDisabled)
        return !0;
      if (!t.supportsFiber)
        return g("The installed version of React DevTools is too old and will not work with the current version of React. Please update React DevTools. https://fb.me/react-devtools"), !0;
      try {
        var s = t.inject(e);
        typeof t.onScheduleFiberRoot == "function" && (Zw = function(u, d) {
          try {
            t.onScheduleFiberRoot(s, u, d);
          } catch (p) {
            wd || (wd = !0, g("React instrumentation encountered an error: %s", p));
          }
        }), Yw = function(u, d) {
          try {
            var p = (u.current.effectTag & Vt) === Vt;
            if (Er) {
              var w = pR(), b = $x(w, d);
              t.onCommitFiberRoot(s, u, b, p);
            }
          } catch (E) {
            wd || (wd = !0, g("React instrumentation encountered an error: %s", E));
          }
        }, Gw = function(u) {
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
    function iD(e, t) {
      typeof Zw == "function" && Zw(e, t);
    }
    function rD(e, t) {
      typeof Yw == "function" && Yw(e, t);
    }
    function aD(e) {
      typeof Gw == "function" && Gw(e);
    }
    var Xw;
    {
      Xw = !1;
      try {
        var zC = Object.preventExtensions({}), sD = /* @__PURE__ */ new Map([[zC, null]]), oD = /* @__PURE__ */ new Set([zC]);
        sD.set(0, 0), oD.add(0);
      } catch {
        Xw = !0;
      }
    }
    var lD = 1;
    function uD(e, t, s, u) {
      this.tag = e, this.key = s, this.elementType = null, this.type = null, this.stateNode = null, this.return = null, this.child = null, this.sibling = null, this.index = 0, this.ref = null, this.pendingProps = t, this.memoizedProps = null, this.updateQueue = null, this.memoizedState = null, this.dependencies = null, this.mode = u, this.effectTag = _t, this.nextEffect = null, this.firstEffect = null, this.lastEffect = null, this.expirationTime = Ae, this.childExpirationTime = Ae, this.alternate = null, this.actualDuration = Number.NaN, this.actualStartTime = Number.NaN, this.selfBaseDuration = Number.NaN, this.treeBaseDuration = Number.NaN, this.actualDuration = 0, this.actualStartTime = -1, this.selfBaseDuration = 0, this.treeBaseDuration = 0, this._debugID = lD++, this._debugIsCurrentlyTiming = !1, this._debugSource = null, this._debugOwner = null, this._debugNeedsRemount = !1, this._debugHookTypes = null, !Xw && typeof Object.preventExtensions == "function" && Object.preventExtensions(this);
    }
    var ya = function(e, t, s, u) {
      return new uD(e, t, s, u);
    };
    function Jw(e) {
      var t = e.prototype;
      return !!(t && t.isReactComponent);
    }
    function cD(e) {
      return typeof e == "function" && !Jw(e) && e.defaultProps === void 0;
    }
    function dD(e) {
      if (typeof e == "function")
        return Jw(e) ? ce : Oe;
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
          s.type = py(e.type);
          break;
        case D:
          s.type = my(e.type);
          break;
      }
      return s;
    }
    function fD(e, t) {
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
    function hD(e) {
      var t;
      return e === PA ? t = td | Hr | yn : e === _A ? t = Hr | yn : t = oi, tD && (t |= cs), ya(Se, null, null, t);
    }
    function qw(e, t, s, u, d, p) {
      var w, b = Ze, E = e;
      if (typeof e == "function")
        Jw(e) ? (b = ce, E = py(E)) : E = id(E);
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
            case kt:
              return pD(s, d, p, t);
            case ii:
              return mD(s, d, p, t);
            case So:
              return vD(s, d, p, t);
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
                    b = D, E = my(E);
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
              var k = "";
              {
                (e === void 0 || typeof e == "object" && e !== null && Object.keys(e).length === 0) && (k += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");
                var N = u ? Te(u.type) : null;
                N && (k += `

Check the render method of \`` + N + "`.");
              }
              throw Error("Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: " + (e == null ? e : typeof e) + "." + k);
            }
          }
      }
      return w = ya(b, s, t, d), w.elementType = e, w.type = E, w.expirationTime = p, w;
    }
    function Kw(e, t, s) {
      var u = null;
      u = e._owner;
      var d = e.type, p = e.key, w = e.props, b = qw(d, p, w, u, t, s);
      return b._debugSource = e._source, b._debugOwner = e._owner, b;
    }
    function il(e, t, s, u) {
      var d = ya(Tt, e, u, t);
      return d.expirationTime = s, d;
    }
    function pD(e, t, s, u) {
      (typeof e.id != "string" || typeof e.onRender != "function") && g('Profiler must specify an "id" string and "onRender" function as props');
      var d = ya(B, e, u, t | cs);
      return d.elementType = kt, d.type = kt, d.expirationTime = s, d;
    }
    function mD(e, t, s, u) {
      var d = ya(ee, e, u, t);
      return d.type = ii, d.elementType = ii, d.expirationTime = s, d;
    }
    function vD(e, t, s, u) {
      var d = ya(dt, e, u, t);
      return d.type = So, d.elementType = So, d.expirationTime = s, d;
    }
    function eb(e, t, s) {
      var u = ya(Qe, e, null, t);
      return u.expirationTime = s, u;
    }
    function gD() {
      var e = ya(Re, null, null, oi);
      return e.elementType = "DELETED", e.type = "DELETED", e;
    }
    function tb(e, t, s) {
      var u = e.children !== null ? e.children : [], d = ya(Ue, u, e.key, t);
      return d.expirationTime = s, d.stateNode = {
        containerInfo: e.containerInfo,
        pendingChildren: null,
        implementation: e.implementation
      }, d;
    }
    function OC(e, t) {
      return e === null && (e = ya(Ze, null, null, oi)), e.tag = t.tag, e.key = t.key, e.elementType = t.elementType, e.type = t.type, e.stateNode = t.stateNode, e.return = t.return, e.child = t.child, e.sibling = t.sibling, e.index = t.index, e.ref = t.ref, e.pendingProps = t.pendingProps, e.memoizedProps = t.memoizedProps, e.updateQueue = t.updateQueue, e.memoizedState = t.memoizedState, e.dependencies = t.dependencies, e.mode = t.mode, e.effectTag = t.effectTag, e.nextEffect = t.nextEffect, e.firstEffect = t.firstEffect, e.lastEffect = t.lastEffect, e.expirationTime = t.expirationTime, e.childExpirationTime = t.childExpirationTime, e.alternate = t.alternate, e.actualDuration = t.actualDuration, e.actualStartTime = t.actualStartTime, e.selfBaseDuration = t.selfBaseDuration, e.treeBaseDuration = t.treeBaseDuration, e._debugID = t._debugID, e._debugSource = t._debugSource, e._debugOwner = t._debugOwner, e._debugIsCurrentlyTiming = t._debugIsCurrentlyTiming, e._debugNeedsRemount = t._debugNeedsRemount, e._debugHookTypes = t._debugHookTypes, e;
    }
    function yD(e, t, s) {
      this.tag = t, this.current = null, this.containerInfo = e, this.pendingChildren = null, this.pingCache = null, this.finishedExpirationTime = Ae, this.finishedWork = null, this.timeoutHandle = De, this.context = null, this.pendingContext = null, this.hydrate = s, this.callbackNode = null, this.callbackPriority = Kc, this.firstPendingTime = Ae, this.firstSuspendedTime = Ae, this.lastSuspendedTime = Ae, this.nextKnownPendingLevel = Ae, this.lastPingedTime = Ae, this.lastExpiredTime = Ae, this.interactionThreadID = h.unstable_getThreadID(), this.memoizedInteractions = /* @__PURE__ */ new Set(), this.pendingInteractionMap = /* @__PURE__ */ new Map();
    }
    function wD(e, t, s, u) {
      var d = new yD(e, t, s), p = hD(t);
      return d.current = p, p.stateNode = d, Cy(p), d;
    }
    function LC(e, t) {
      var s = e.firstSuspendedTime, u = e.lastSuspendedTime;
      return s !== Ae && s >= t && u <= t;
    }
    function Ru(e, t) {
      var s = e.firstSuspendedTime, u = e.lastSuspendedTime;
      s < t && (e.firstSuspendedTime = t), (u > t || s === Ae) && (e.lastSuspendedTime = t), t <= e.lastPingedTime && (e.lastPingedTime = Ae), t <= e.lastExpiredTime && (e.lastExpiredTime = Ae);
    }
    function BC(e, t) {
      var s = e.firstPendingTime;
      t > s && (e.firstPendingTime = t);
      var u = e.firstSuspendedTime;
      u !== Ae && (t >= u ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = Ae : t >= e.lastSuspendedTime && (e.lastSuspendedTime = t + 1), t > e.nextKnownPendingLevel && (e.nextKnownPendingLevel = t));
    }
    function bD(e, t, s) {
      e.firstPendingTime = s, t <= e.lastSuspendedTime ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = Ae : t <= e.firstSuspendedTime && (e.firstSuspendedTime = t - 1), t <= e.lastPingedTime && (e.lastPingedTime = Ae), t <= e.lastExpiredTime && (e.lastExpiredTime = Ae);
    }
    function nb(e, t) {
      var s = e.lastExpiredTime;
      (s === Ae || s > t) && (e.lastExpiredTime = t);
    }
    var ib, rb;
    ib = !1, rb = {};
    function SD(e) {
      if (!e)
        return mr;
      var t = ua(e), s = NA(t);
      if (t.tag === ce) {
        var u = t.type;
        if (ls(u))
          return Ex(t, u, s);
      }
      return s;
    }
    function xD(e, t) {
      {
        var s = ua(e);
        if (s === void 0)
          throw typeof e.render == "function" ? Error("Unable to find node on an unmounted component.") : Error("Argument appears to not be a ReactComponent. Keys: " + Object.keys(e));
        var u = Tf(s);
        if (u === null)
          return null;
        if (u.mode & yn) {
          var d = Te(s.type) || "Component";
          rb[d] || (rb[d] = !0, s.mode & yn ? g("%s is deprecated in StrictMode. %s was passed an instance of %s which is inside StrictMode. Instead, add a ref directly to the element you want to reference. Learn more about using refs safely here: https://fb.me/react-strict-mode-find-node%s", t, t, d, $n(u)) : g("%s is deprecated in StrictMode. %s was passed an instance of %s which renders StrictMode children. Instead, add a ref directly to the element you want to reference. Learn more about using refs safely here: https://fb.me/react-strict-mode-find-node%s", t, t, d, $n(u)));
        }
        return u.stateNode;
      }
    }
    function CD(e, t, s, u) {
      return wD(e, t, s);
    }
    function Uh(e, t, s, u) {
      iD(t, e);
      var d = t.current, p = ps();
      typeof jest < "u" && (eD(d), RC(d));
      var w = Th(), b = Cu(p, d, w), E = SD(s);
      t.context === null ? t.context = E : t.pendingContext = E, yl && na !== null && !ib && (ib = !0, g(`Render methods should be a pure function of props and state; triggering nested component updates from render is not allowed. If necessary, trigger nested updates in componentDidUpdate.

Check the render method of %s.`, Te(na.type) || "Unknown"));
      var k = Go(b, w);
      return k.payload = {
        element: e
      }, u = u === void 0 ? null : u, u !== null && (typeof u != "function" && g("render(...): Expected the last optional `callback` argument to be a function. Instead received: %s.", u), k.callback = u), Xo(d, k), Zr(d, b), b;
    }
    function ab(e) {
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
    function jC(e, t) {
      var s = e.memoizedState;
      s !== null && s.dehydrated !== null && s.retryTime < t && (s.retryTime = t);
    }
    function sb(e, t) {
      jC(e, t);
      var s = e.alternate;
      s && jC(s, t);
    }
    function TD(e) {
      if (e.tag === ee) {
        var t = Fx(ps());
        Zr(e, t), sb(e, t);
      }
    }
    function MD(e) {
      e.tag === ee && (Zr(e, Vx), sb(e, Vx));
    }
    function ED(e) {
      if (e.tag === ee) {
        var t = ps(), s = Cu(t, e, null);
        Zr(e, s), sb(e, s);
      }
    }
    function VC(e) {
      var t = Bl(e);
      return t === null ? null : t.tag === gt ? t.stateNode.instance : t.stateNode;
    }
    var UC = function(e) {
      return !1;
    };
    function ID(e) {
      return UC(e);
    }
    var HC = null, WC = null, FC = null, $C = null;
    {
      var QC = function(e, t, s, u) {
        if (s >= t.length)
          return u;
        var d = t[s], p = Array.isArray(e) ? e.slice() : n({}, e);
        return p[d] = QC(e[d], t, s + 1, u), p;
      }, ZC = function(e, t, s) {
        return QC(e, t, 0, s);
      };
      HC = function(e, t, s, u) {
        for (var d = e.memoizedState; d !== null && t > 0; )
          d = d.next, t--;
        if (d !== null) {
          var p = ZC(d.memoizedState, s, u);
          d.memoizedState = p, d.baseState = p, e.memoizedProps = n({}, e.memoizedProps), Zr(e, Ct);
        }
      }, WC = function(e, t, s) {
        e.pendingProps = ZC(e.memoizedProps, t, s), e.alternate && (e.alternate.pendingProps = e.pendingProps), Zr(e, Ct);
      }, FC = function(e) {
        Zr(e, Ct);
      }, $C = function(e) {
        UC = e;
      };
    }
    function AD(e) {
      var t = e.findFiberByHostInstance, s = m.ReactCurrentDispatcher;
      return nD(n({}, e, {
        overrideHookState: HC,
        overrideProps: WC,
        setSuspenseHandler: $C,
        scheduleUpdate: FC,
        currentDispatcherRef: s,
        findHostInstanceByFiber: function(u) {
          var d = Tf(u);
          return d === null ? null : d.stateNode;
        },
        findFiberByHostInstance: function(u) {
          return t ? t(u) : null;
        },
        findHostInstancesForRefresh: YA,
        scheduleRefresh: QA,
        scheduleRoot: ZA,
        setRefreshHandler: $A,
        getCurrentFiber: function() {
          return na;
        }
      }));
    }
    m.IsSomeRendererActing;
    function ob(e, t, s) {
      this._internalRoot = RD(e, t, s);
    }
    ob.prototype.render = function(e) {
      var t = this._internalRoot;
      {
        typeof arguments[1] == "function" && g("render(...): does not support the second callback argument. To execute a side effect after rendering, declare it in a component body with useEffect().");
        var s = t.containerInfo;
        if (s.nodeType !== ai) {
          var u = VC(t.current);
          u && u.parentNode !== s && g("render(...): It looks like the React-rendered content of the root container was removed without using React. This is not supported and will cause errors. Instead, call root.unmount() to empty a root's container.");
        }
      }
      Uh(e, t, null, null);
    }, ob.prototype.unmount = function() {
      typeof arguments[0] == "function" && g("unmount(...): does not support a callback argument. To execute a side effect after rendering, declare it in a component body with useEffect().");
      var e = this._internalRoot, t = e.containerInfo;
      Uh(null, e, null, function() {
        LS(t);
      });
    };
    function RD(e, t, s) {
      var u = s != null && s.hydrate === !0;
      s != null && s.hydrationOptions;
      var d = CD(e, t, u);
      if (dI(d.current, e), u && t !== Ax) {
        var p = e.nodeType === Na ? e : e.ownerDocument;
        bc(e, p);
      }
      return d;
    }
    function DD(e, t) {
      return new ob(e, Ax, t);
    }
    function bd(e) {
      return !!(e && (e.nodeType === ar || e.nodeType === Na || e.nodeType === qu || e.nodeType === ai && e.nodeValue === " react-mount-point-unstable "));
    }
    var kD = m.ReactCurrentOwner, YC, GC = !1;
    YC = function(e) {
      if (e._reactRootContainer && e.nodeType !== ai) {
        var t = VC(e._reactRootContainer._internalRoot.current);
        t && t.parentNode !== e && g("render(...): It looks like the React-rendered content of this container was removed without using React. This is not supported and will cause errors. Instead, call ReactDOM.unmountComponentAtNode to empty a container.");
      }
      var s = !!e._reactRootContainer, u = Bv(e), d = !!(u && Zo(u));
      d && !s && g("render(...): Replacing React-rendered children with a new root component. If you intended to update the children of this node, you should instead have the existing children update their state and render the new components instead of calling ReactDOM.render."), e.nodeType === ar && e.tagName && e.tagName.toUpperCase() === "BODY" && g("render(): Rendering components directly into document.body is discouraged, since its children are often manipulated by third-party scripts and browser extensions. This may lead to subtle reconciliation issues. Try rendering into a container element created for your app.");
    };
    function Bv(e) {
      return e ? e.nodeType === Na ? e.documentElement : e.firstChild : null;
    }
    function ND(e) {
      var t = Bv(e);
      return !!(t && t.nodeType === ar && t.hasAttribute(de));
    }
    function _D(e, t) {
      var s = t || ND(e);
      if (!s)
        for (var u = !1, d; d = e.lastChild; )
          !u && d.nodeType === ar && d.hasAttribute(de) && (u = !0, g("render(): Target node has markup rendered by React, but there are unrelated nodes as well. This is most commonly caused by white-space inserted around server-rendered markup.")), e.removeChild(d);
      return s && !t && !GC && (GC = !0, y("render(): Calling ReactDOM.render() to hydrate server-rendered markup will stop working in React v17. Replace the ReactDOM.render() call with ReactDOM.hydrate() if you want React to attach to the server HTML.")), DD(e, s ? {
        hydrate: !0
      } : void 0);
    }
    function PD(e, t) {
      e !== null && typeof e != "function" && g("%s(...): Expected the last optional `callback` argument to be a function. Instead received: %s.", t, e);
    }
    function jv(e, t, s, u, d) {
      YC(s), PD(d === void 0 ? null : d, "render");
      var p = s._reactRootContainer, w;
      if (p) {
        if (w = p._internalRoot, typeof d == "function") {
          var E = d;
          d = function() {
            var k = ab(w);
            E.call(k);
          };
        }
        Uh(t, w, e, d);
      } else {
        if (p = s._reactRootContainer = _D(s, u), w = p._internalRoot, typeof d == "function") {
          var b = d;
          d = function() {
            var k = ab(w);
            b.call(k);
          };
        }
        gC(function() {
          Uh(t, w, e, d);
        });
      }
      return ab(w);
    }
    function zD(e) {
      {
        var t = kD.current;
        if (t !== null && t.stateNode !== null) {
          var s = t.stateNode._warnedAboutRefsInRender;
          s || g("%s is accessing findDOMNode inside its render(). render() should be a pure function of props and state. It should never access something that requires stale data from the previous render, such as refs. Move this logic to componentDidMount and componentDidUpdate instead.", Te(t.type) || "A component"), t.stateNode._warnedAboutRefsInRender = !0;
        }
      }
      return e == null ? null : e.nodeType === ar ? e : xD(e, "findDOMNode");
    }
    function OD(e, t, s) {
      if (!bd(t))
        throw Error("Target container is not a DOM element.");
      {
        var u = Wg(t) && t._reactRootContainer === void 0;
        u && g("You are calling ReactDOM.hydrate() on a container that was previously passed to ReactDOM.createRoot(). This is not supported. Did you mean to call createRoot(container, {hydrate: true}).render(element)?");
      }
      return jv(null, e, t, !0, s);
    }
    function LD(e, t, s) {
      if (!bd(t))
        throw Error("Target container is not a DOM element.");
      {
        var u = Wg(t) && t._reactRootContainer === void 0;
        u && g("You are calling ReactDOM.render() on a container that was previously passed to ReactDOM.createRoot(). This is not supported. Did you mean to call root.render(element)?");
      }
      return jv(null, e, t, !1, s);
    }
    function BD(e, t, s, u) {
      if (!bd(s))
        throw Error("Target container is not a DOM element.");
      if (!(e != null && wf(e)))
        throw Error("parentComponent must be a valid React Component");
      return jv(e, t, s, !1, u);
    }
    function jD(e) {
      if (!bd(e))
        throw Error("unmountComponentAtNode(...): Target container is not a DOM element.");
      {
        var t = Wg(e) && e._reactRootContainer === void 0;
        t && g("You are calling ReactDOM.unmountComponentAtNode() on a container that was previously passed to ReactDOM.createRoot(). This is not supported. Did you mean to call root.unmount()?");
      }
      if (e._reactRootContainer) {
        {
          var s = Bv(e), u = s && !Zo(s);
          u && g("unmountComponentAtNode(): The node you're attempting to unmount was rendered by another copy of React.");
        }
        return gC(function() {
          jv(null, null, e, !1, function() {
            e._reactRootContainer = null, LS(e);
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
    function VD(e, t, s) {
      var u = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : null;
      return {
        $$typeof: Ye,
        key: u == null ? null : "" + u,
        children: e,
        containerInfo: t,
        implementation: s
      };
    }
    var XC = "16.14.0";
    If(TD), gc(MD), wc(ED);
    var JC = !1;
    (typeof Map != "function" || Map.prototype == null || typeof Map.prototype.forEach != "function" || typeof Set != "function" || Set.prototype == null || typeof Set.prototype.clear != "function" || typeof Set.prototype.forEach != "function") && g("React depends on Map and Set built-in types. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"), Ea(pm), Ts(vC, xR, yR, SR);
    function qC(e, t) {
      var s = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
      if (!bd(t))
        throw Error("Target container is not a DOM element.");
      return VD(e, t, null, s);
    }
    function UD(e, t, s, u) {
      return BD(e, t, s, u);
    }
    function HD(e, t) {
      var s = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
      return JC || (JC = !0, y('The ReactDOM.unstable_createPortal() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactDOM.createPortal() instead. It has the exact same API, but without the "unstable_" prefix.')), qC(e, t, s);
    }
    var WD = {
      Events: [Zo, au, Fg, Mr, st, $c, xI, Ti, Cs, Ql, mc, tl, Iu]
    }, FD = AD({
      findFiberByHostInstance: th,
      bundleType: 1,
      version: XC,
      rendererPackageName: "react-dom"
    });
    if (!FD && jn && window.top === window.self && (navigator.userAgent.indexOf("Chrome") > -1 && navigator.userAgent.indexOf("Edge") === -1 || navigator.userAgent.indexOf("Firefox") > -1)) {
      var KC = window.location.protocol;
      /^(https?|file):$/.test(KC) && console.info("%cDownload the React DevTools for a better development experience: https://fb.me/react-devtools" + (KC === "file:" ? `
You might need to use a local HTTP server (instead of file://): https://fb.me/react-devtools-faq` : ""), "font-weight:bold");
    }
    xr.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = WD, xr.createPortal = qC, xr.findDOMNode = zD, xr.flushSync = yC, xr.hydrate = OD, xr.render = LD, xr.unmountComponentAtNode = jD, xr.unstable_batchedUpdates = vC, xr.unstable_createPortal = HD, xr.unstable_renderSubtreeIntoContainer = UD, xr.version = XC;
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
  process.env.NODE_ENV === "production" ? (n(), r.exports = gO()) : r.exports = SO();
})(UE);
const oM = /* @__PURE__ */ jE(UE.exports);
var xO = Object.defineProperty, CO = Object.defineProperties, TO = Object.getOwnPropertyDescriptors, lM = Object.getOwnPropertySymbols, MO = Object.prototype.hasOwnProperty, EO = Object.prototype.propertyIsEnumerable, uM = (r, n, o) => n in r ? xO(r, n, { enumerable: !0, configurable: !0, writable: !0, value: o }) : r[n] = o, Tr = (r, n) => {
  for (var o in n || (n = {}))
    MO.call(n, o) && uM(r, o, n[o]);
  if (lM)
    for (var o of lM(n))
      EO.call(n, o) && uM(r, o, n[o]);
  return r;
};
const WE = { src: "", currentTime: 0, hostTime: 0, muted: !1, paused: !0, volume: 1 }, FE = { currentTimeMaxError: 1, syncInterval: 1e3, retryInterval: 15e3, verbose: !1, log: console.log.bind(console) };
let mo = FE;
function $E(r) {
  mo = Tr(Tr({}, FE), r);
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
const IO = navigator.userAgent.includes("Safari"), AO = [".aac", ".mid", ".midi", ".mp3", ".ogg", ".oga", ".wav", ".weba"];
var RO = typeof global == "object" && global && global.Object === Object && global, DO = typeof self == "object" && self && self.Object === Object && self, QE = RO || DO || Function("return this")(), ug = QE.Symbol, ZE = Object.prototype, kO = ZE.hasOwnProperty, NO = ZE.toString, Qh = ug ? ug.toStringTag : void 0, _O = Object.prototype.toString, cM = ug ? ug.toStringTag : void 0;
function PO(r) {
  return r == null ? r === void 0 ? "[object Undefined]" : "[object Null]" : cM && cM in Object(r) ? function(n) {
    var o = kO.call(n, Qh), l = n[Qh];
    try {
      n[Qh] = void 0;
      var h = !0;
    } catch {
    }
    var m = NO.call(n);
    return h && (o ? n[Qh] = l : delete n[Qh]), m;
  }(r) : function(n) {
    return _O.call(n);
  }(r);
}
var zO = /\s/, OO = /^\s+/;
function LO(r) {
  return r && r.slice(0, function(n) {
    for (var o = n.length; o-- && zO.test(n.charAt(o)); )
      ;
    return o;
  }(r) + 1).replace(OO, "");
}
function eS(r) {
  var n = typeof r;
  return r != null && (n == "object" || n == "function");
}
var BO = /^[-+]0x[0-9a-f]+$/i, jO = /^0b[01]+$/i, VO = /^0o[0-7]+$/i, UO = parseInt;
function dM(r) {
  if (typeof r == "number")
    return r;
  if (function(l) {
    return typeof l == "symbol" || function(h) {
      return h != null && typeof h == "object";
    }(l) && PO(l) == "[object Symbol]";
  }(r))
    return NaN;
  if (eS(r)) {
    var n = typeof r.valueOf == "function" ? r.valueOf() : r;
    r = eS(n) ? n + "" : n;
  }
  if (typeof r != "string")
    return r === 0 ? r : +r;
  r = LO(r);
  var o = jO.test(r);
  return o || VO.test(r) ? UO(r.slice(2), o ? 2 : 8) : BO.test(r) ? NaN : +r;
}
var _b = function() {
  return QE.Date.now();
}, HO = Math.max, WO = Math.min;
function Yv(r, n, o) {
  var l, h, m, y, g, S, C = 0, I = !1, A = !1, z = !0;
  if (typeof r != "function")
    throw new TypeError("Expected a function");
  function $(Z) {
    var ue = l, oe = h;
    return l = h = void 0, C = Z, y = r.apply(oe, ue);
  }
  function U(Z) {
    return C = Z, g = setTimeout(G, n), I ? $(Z) : y;
  }
  function q(Z) {
    var ue = Z - S;
    return S === void 0 || ue >= n || ue < 0 || A && Z - C >= m;
  }
  function G() {
    var Z = _b();
    if (q(Z))
      return he(Z);
    g = setTimeout(G, function(ue) {
      var oe = n - (ue - S);
      return A ? WO(oe, m - (ue - C)) : oe;
    }(Z));
  }
  function he(Z) {
    return g = void 0, z && l ? $(Z) : (l = h = void 0, y);
  }
  function se() {
    var Z = _b(), ue = q(Z);
    if (l = arguments, h = this, S = Z, ue) {
      if (g === void 0)
        return U(S);
      if (A)
        return clearTimeout(g), g = setTimeout(G, n), $(S);
    }
    return g === void 0 && (g = setTimeout(G, n)), y;
  }
  return n = dM(n) || 0, eS(o) && (I = !!o.leading, m = (A = "maxWait" in o) ? HO(dM(o.maxWait) || 0, n) : m, z = "trailing" in o ? !!o.trailing : z), se.cancel = function() {
    g !== void 0 && clearTimeout(g), C = 0, l = S = h = g = void 0;
  }, se.flush = function() {
    return g === void 0 ? y : he(_b());
  }, se;
}
class fM extends hl.exports.Component {
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
class FO extends hl.exports.Component {
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
    return wt.createElement("div", { className: "player-controller", style: { opacity: this.props.visible ? "1" : "0" } }, wt.createElement("div", { className: "player-controller-progress" }, wt.createElement(fM, { total: n, current: this.state.currentTime, onChange: this.onChange, buffered: this.props.buffered, bufferColor: "rgba(255,255,255,0.3)", hideHoverTime: !0, limitTimeTooltipBySides: !0, onSeekStart: this.onProgressSeekStart, onSeekEnd: this.onProgressSeekEnd, play: this.props.play, pause: this.props.pause, paused: this.props.paused, scale: this.props.scale })), wt.createElement("div", { className: "player-controller-actions" }, wt.createElement("div", { className: "player-controller-actions-left" }, wt.createElement("div", { onClick: this.onClickOperationButton, className: "player-controller-play" }, this.operationButton()), wt.createElement("div", { className: "player-volume-box", onMouseEnter: () => this.setState({ isVolumeHover: !0 }), onMouseLeave: () => this.setState({ isVolumeHover: !1 }) }, wt.createElement("div", { onClick: this.handleClickVolume, className: "player-volume" }, this.operationVolumeButton()), wt.createElement("div", { className: "player-volume-slider" }, wt.createElement(fM, { total: 100, current: 100 * this.state.seekVolume, onChange: this.onVolumeChange, onSeekStart: this.onVolumeSeekStart, onSeekEnd: this.onVolumeSeekEnd, scale: this.props.scale, limitTimeTooltipBySides: !0, hideHoverTime: !0 })))), wt.createElement("div", { className: "player-mid-box-time" }, hM(Math.floor(o / 1e3)), " /", " ", hM(Math.floor(n / 1e3)))));
  }
}
function hM(r) {
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
let $O = 99999;
var tS, Sd;
(Sd = tS || (tS = {}))[Sd.Idle = 0] = "Idle", Sd[Sd.Playing = 1] = "Playing", Sd[Sd.Paused = 2] = "Paused";
let ji = {};
function Gn(r, ...n) {
  mo.verbose && console.log(`[RTCEffect] ${r}`, ...n);
}
function QO(r, n, o) {
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
    const y = ((m = n == null ? void 0 : n.tagAttributes) == null ? void 0 : m.src) || "";
    y.endsWith("mp3") || y.endsWith("wav") || y.endsWith("m4a") || (Gn(">>> Mute js player", { src: y }), n.muted(!0), n.muted = (S) => !1);
    const g = function() {
      const S = $O--, C = { playState: tS.Idle, previousVideoJSAdvance: 0, previousSeekTargetTime: 0, previousBeginSeekTime: 0 };
      return ji[S] = C, S;
    }();
    Gn(">>> Setup", { playingId: g, src: y }), r.addListener("error", (S) => {
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
        function $(q, G) {
          r.setEffectPosition(G, 1e3 * q), C.previousBeginSeekTime = Date.now() / 1e3, C.previousSeekTargetTime = q;
        }
        const U = C.previousBeginSeekTime;
        if (S > 0) {
          const q = A - I, G = Math.abs(q), he = 0.5;
          if (G > he)
            if (z) {
              const se = C.previousSeekTargetTime - I, Z = Date.now() / 1e3 - U, ue = Z + (q > 0 ? q : 0), oe = A + ue;
              $(oe, g), Gn(">>> Start seeking after seeking lag", { jsPlayerTime: A, rtcEffectTime: I, jsPlayerTimerAdvance: q, lastSeekingCost: Z, estimatedRTCLag: ue, targetRTCSeekTime: oe, previousBeginSeekTime: U, timeElapse: se });
            } else if (G > 10)
              $(A, g), Gn(">>> DirectSeek", { time: A, rtcEffectTime: I, jsPlayerTimerAdvance: q });
            else {
              const se = C.previousVideoJSAdvance, Z = 0, ue = A + Z;
              C.previousVideoJSAdvance = Z, $(ue, g), Gn(">>> Start seeking with lag", { jsPlayerTime: A, rtcEffectTime: I, jsPlayerTimerAdvance: q, previousAdvance: se, estimatedRTCLag: Z, targetRTCSeekTime: ue });
            }
          else
            z && (Gn(">>> SeekingFinish no lag", { jsPlayerTime: A, rtcEffectTime: I, jsPlayerTimerAdvance: q, previousBeginSeekTime: U, rtcLagTolerance: he }), C.previousBeginSeekTime = 0, C.previousSeekTargetTime = 0);
        }
      });
    }), n.on("dispose", () => {
      ji[g].playState && (r.stopEffect(g), delete ji[g], Gn(">>> Dispose", { playingId: g }));
    });
  });
}
class ZO extends hl.exports.Component {
  constructor() {
    super(...arguments), this.putAttributes = (n) => {
      const { context: o } = this.props, l = o.getAttributes() || {};
      for (const h in n)
        l[h] !== n[h] && o.updateAttributes([h], n[h]);
    };
  }
  render() {
    const { context: n } = this.props, o = n.getRoom(), l = o ? void 0 : n.getDisplayer(), h = this.putAttributes;
    return wt.createElement(YO, { room: o, player: l, context: n, plugin: { putAttributes: h } });
  }
}
class YO extends hl.exports.Component {
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
      let y = mo.currentTimeMaxError;
      this.state.NoSound && (y *= 3), m > h.duration() ? this.resetPlayer() : Math.abs(h.currentTime() - m) > y && (this.debug("<<< currentTime -> %o", m), h.currentTime(m));
    }, this.debounceHidingController = () => {
      this.controllerHiddenTimer && (clearTimeout(this.controllerHiddenTimer), this.controllerHiddenTimer = 0), this.controllerHiddenTimer = setTimeout(() => {
        this.setState({ controllerVisible: !1 }), this.controllerHiddenTimer = 0;
      }, 3e3);
    }, this.decreaseRetryCount = () => {
      this.player && this.retryCount > 0 && (this.retryCount = this.retryCount - 1);
    }, this.catchPlayFail = (o) => {
      var l, h;
      const m = String(o);
      if (IO && m.includes("NotAllowedError") || m.includes("interact"))
        (l = this.player) == null || l.autoplay("any"), this.setState({ NoSound: !0 });
      else {
        const y = (h = this.player) == null ? void 0 : h.error();
        y && (this.retryCount <= 3 ? (this.initPlayer(), this.retryCount = this.retryCount + 1) : (this.debug("catch videojs media error", y), this.setState({ MediaError: !0 }))), this.debug("catch error", o);
      }
    }, this.fixPlayFail = () => {
      this.debug("try to fix play state"), this.setState({ NoSound: !1 });
      const { muted: o, volume: l } = this.getAttributes();
      this.player && (this.player.muted(o), this.player.volume(l));
    }, this.initPlayer = async () => {
      var o;
      (o = this.player) == null || o.dispose(), this.player = void 0, this.debug("creating elements ...");
      const { type: l, src: h, poster: m } = this.getAttributes(), y = document.createElement("div");
      y.setAttribute("data-vjs-player", "");
      const g = document.createElement("video");
      g.className = "video-js", m && (g.poster = m), g.setAttribute("playsInline", ""), g.setAttribute("webkit-playsinline", "");
      const S = document.createElement("source");
      new URL(h).pathname.endsWith(".m3u8") ? S.type = "application/x-mpegURL" : g.src = h, S.src = h, l && (S.type = l), g.appendChild(S), y.appendChild(g), this.container.current.appendChild(y), await new Promise((A) => (window.requestAnimationFrame || window.setTimeout)(A)), this.debug("initializing videojs() ...");
      const C = nT(g);
      this.player = C, window.player = C, C.one("loadedmetadata", this.gracefullyUpdate);
      const I = window.__mediaPlayerAudioEffectClient;
      I !== void 0 && QO(I, C, h), C.on("ready", () => {
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
      if (o = Tr(Tr({}, WE), o), this.player) {
        let h = Zv(o, this.props), m = this.player.duration();
        !o.paused && h > m && (l = Tr({}, o), o = CO(l, TO({ currentTime: 0, paused: !0 })), this.resetPlayer());
      }
      var l;
      return o;
    }
  }
  isShowingPoster() {
    const n = this.getAttributes();
    return !(n != null && n.src) || AO.some((o) => n.src.endsWith(o));
  }
  render() {
    var n, o;
    if (!this.props.room && !this.props.player)
      return null;
    const l = this.getAttributes();
    if (!l)
      return null;
    const h = 1e3 * (((n = this.player) == null ? void 0 : n.duration()) || 1e3), m = ((o = this.player) == null ? void 0 : o.bufferedPercent()) || 0;
    return wt.createElement("div", { className: this.isEnabled() ? "vjs-p" : "vjs-p disabled", onMouseEnter: this.showController, onMouseMove: this.showController }, wt.createElement("div", { className: "video-js-plugin-player", ref: this.container }), this.isShowingPoster() && wt.createElement("div", { className: "video-js-plugin-poster" }, l.poster && wt.createElement("img", { src: l.poster, alt: "", draggable: !1 })), wt.createElement(FO, { duration: h, volume: l.volume, setVolume: this.setVolume, paused: l.paused, play: this.play, pause: this.pause, currentTime: 1e3 * Zv(l, this.props), setCurrentTime: this.setCurrentTime, buffered: h * m, visible: !0 }), this.state.NoSound && wt.createElement("div", { ref: this.setupAlert, className: "videojs-plugin-muted-alert" }), this.state.MediaError && wt.createElement("div", { className: "videojs-plugin-recovery-mode" }, wt.createElement("button", { ref: this.setupReload }, "Reload Player")));
  }
  debug(n, ...o) {
    mo.verbose && mo.log(`[MediaPlayer] ${n}`, ...o);
  }
  componentDidMount() {
    this.debug("app version =", "0.1.0-alpha.5"), this.debug("video.js version =", nT.VERSION), this.initPlayer(), this.props.context.emitter.on("attributesUpdate", this.syncPlayerWithAttributes), this.syncPlayerTimer = setInterval(this.syncPlayerWithAttributes, mo.syncInterval), this.decreaseRetryTimer = setInterval(this.decreaseRetryCount, mo.retryInterval);
  }
  componentWillUnmount() {
    var n;
    this.debug("unmount"), this.props.context.emitter.off("attributesUpdate", this.syncPlayerWithAttributes), (n = this.player) == null || n.dispose(), clearInterval(this.syncPlayerTimer), clearInterval(this.decreaseRetryTimer);
  }
  isEnabled() {
    return this.props.context.getIsWritable();
  }
}
const nS = { kind: "MediaPlayer", setup(r) {
  let n = r.getAttributes();
  if (!n || !n.src)
    return r.emitter.emit("destroy", { error: new Error("[MediaPlayer]: Missing 'attributes'.'src'.") });
  n = Tr(Tr({}, WE), n);
  const o = r.getBox();
  o.mountStyles(`.vjs-p{display:flex;flex-grow:1}.vjs-p *{pointer-events:auto}.vjs-p.disabled *{pointer-events:none}.vjs-p .video-js-plugin-poster{position:absolute;top:0;left:0;right:0;bottom:0;background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgQAAACACAYAAAB0vHFxAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAACBKADAAQAAAABAAAAgAAAAACE3oPTAAAKXUlEQVR4Ae3dYW4ktxEG0LW9FwkC2McycokAOUGAXMLwtQwYvomdP4akHUnNnm6SVUU+/xqpe8ji+yiDWz3a/e7L5v/98se//3pL8K9//O+7t19Hv85eX7RP9vnllz2h4/rkd+wz+ir/0cLfjv/9t1/6igABAgQIENhRwIFgx9StmQABAgQIPAg4EDyA+JIAAQIECOwo8HXHRVvzPIHRzwBHjz9PKudMo31Hj59TdZ2qsueXvb5sO0GHIFsi6iFAgAABAgECOgQB6KbsJ5Dtt0L6rWyPkeRXO+fs+WWvL1v6OgTZElEPAQIECBAIENAhCEA3ZT8Bzwj7WUaMJL8I9X5zZs8ve339kugzkg5BH0ejECBAgACB0gIOBKXjUzwBAgQIEOgj4EDQx9EoBAgQIECgtIADQen4FE+AAAECBPoIOBD0cTQKAQIECBAoLeC3DErHp/iWgE8Zt4RyX5df7nxa1Y3Ob/T4rfWtdl2HYLVErYcAAQIECFwQWL5DsPoJcvX1XdjTpd4iv1JxvStWfu9IfCORwLP7U4cgUXhKIUCAAAECUQIOBFHy5iVAgAABAokEHAgShaEUAgQIECAQJXD7MwTPPqOIWujVeUevb/T4V9ftfecE5HfOKetd8suajLoiBHQIItTNSYAAAQIEkgnc7hAkW0/3ckb/e9qjx+8OYsBvBOT3DUe5L+RXLjIFDxTQIRiIa2gCBAgQIFBFoNkh2P0Z2+j1jx4/+0asvv7q9d/dH9XXX73+3fO7u/7W+3fbHzoErR3hOgECBAgQ2ECg2SHwjG2DXRC4xOj9tdufAHpHLb/eonPHk9+xd7TPcXX9r+oQ9Dc1IgECBAgQKCfgQFAuMgUTIECAAIH+Ag4E/U2NSIAAAQIEygk0P0MQvaLsz3hb9bWu840WOJ5ffsc+2a/KL3tC6jsSmL1/dQiO0nCNAAECBAhsItDsEMw+oTzrHl1f61OorevPrvfZ+6N9WvVmr09+xwnKr7ZP9vyOdcdfze7Tuz4dgvF7ygwECBAgQCC9QLNDkH0F0X+C45NdoHZ99rf8aguofqRA7/8/6BCMTMvYBAgQIECgiED5DkHvZyhFcjtdJp/TVClvlF/KWE4XJb/TVG68INB7f+kQXAjBWwgQIECAwGoCDgSrJWo9BAgQIEDggoADwQU0byFAgAABAqsJfO39DGI1IOuJFbA/Y/3vzi6/u4Kx7189v7vru/v+2HTfz65D8N7EdwgQIECAwHYCw3/LYLUT1HY7pLFg+TaAkl+WX/KAGuXJrwEUfLlaPjoEwRvG9AQIECBAIIPA8A5B779JKQOaGl4F5PtqUfGV/Cqm9lqz/F4tMr6qlo8OQcZdpCYCBAgQIDBZYHiHoNozlMn+5aeTb+0I5Se/2gK5q6/286VDkHs/qY4AAQIECEwRcCCYwmwSAgQIECCQW8CBIHc+qiNAgAABAlMEhn+GYMoqTEKAAAEC7wSqPcN+twDfmCqgQzCV22QECBAgQCCnQHiHoPoJtlV/63rObfFaVfX6X1dy7VX19Vev/1pqr++qvv7q9b8m4dVHAtny1SH4KCXfI0CAAAECmwmEdwiq/U1Om+2PL/Kpnbj85FdbYO3qs/186hCsvd+sjgABAgQInBJwIDjF5CYCBAgQILC2gAPB2vlaHQECBAgQOCUQ/hmCbJ+yPKW20U3yqR22/ORXW2Dt6qN/Ph/n1yFYe79ZHQECBAgQOCXgQHCKyU0ECBAgQGBtAQeCtfO1OgIECBAgcErAgeAUk5sIECBAgMDaAg4Ea+drdQQIECBA4JTA1+///OGnoztd52N/fC7g58PPx+e748sX+8P+qLQ/dAiO0nKNAAECBAhsIuBAsEnQlkmAAAECBI4EHAiOdFwjQIAAAQKbCDgQbBK0ZRIgQIAAgSMBB4IjHdcIECBAgMAmAuH/lsHP//zvb5tYl1ymfErG9lK0/F4oSr6QX8nYThcdne/j/DoEp6NzIwECBAgQWFfAgWDdbK2MAAECBAicFnAgOE3lRgIECBAgsK5A+GcIfv39Pz++5X18pvH2mtfzBeQz37znjPLrqTl/LPnNN585Y7Z8dQhmpm8uAgQIECCQVCC8Q1C9I9Cqv3U96b54Kat6/S8Lufii+vqr138xtpe3VV9/9fpfgvDiQ4Fs+eoQfBiTbxIgQIAAgb0EwjsEe3FbLQECBOYJZPsT6LyVm+mKgA7BFTXvIUCAAAECiwk4ECwWqOUQIECAAIErAg4EV9S8hwABAgQILCYw/DMEnmEttmMeliPfB5BiX8qvWGAP5crvASTZl9Xy0SFItoGUQ4AAAQIEIgSGdwiy/U1MEcgrzynf2unKT361BXJXX+3nS4cg935SHQECBAgQmCIwvENQ7RnKFPWFJpFv7TDlJ7/aArmrr/bzpUOQez+pjgABAgQITBH4Wu0EM0XFJGkE7M80UVwqRH6X2NK8afX87q7v7vvTBP13IToE2RJRDwECBAgQCBBwIAhANyUBAgQIEMgm4ECQLRH1ECBAgACBAIHhv2Uwek2rPcPp7cWnt+jc8eQ317v3bPLrLWq8twK995cOwVtdrwkQIECAwKYC5TsE1f4mqNn7jM9s8b7zya+v5+zR5DdbfK/5eu8vHYK99o/VEiBAgACBDwWaHYLezyg+rOLGN6Pra53QWtdvLP3UW6N9WkVmr09+xwnKr7ZP9vyOdcdfze7Tuz4dgvF7ygwECBAgQCC9QLNDEL2C3ieg3utp1de63rueZ8fLXt+z6+l9f3af7PX1zuPZ8bL7ZK/vWW/39xWYvT90CPrmZzQCBAgQIFBSwIGgZGyKJkCAAAECfQUcCPp6Go0AAQIECJQUaH6GIPpT1iVVFX1aIHp/zX5GdxqmyI3yKxLUJ2XK7xOYv78d7XNcXf+rOgT9TY1IgAABAgTKCTQ7BLv/CWr0+kePn31HVl9/9frv7o/q669e/+753V1/6/277Q8dgtaOcJ0AAQIECGwg0OwQbGBwuMTRz5BGj3+4OBdvC8jvNmHoAPIL5Td5MgEdgmSBKIcAAQIECEQI3O4QrP6MZfT6Ro8fsal2mlN+tdOWX+38VN9XQIegr6fRCBAgQIBASQEHgpKxKZoAAQIECPQVcCDo62k0AgQIECBQUuD2Zwiyr3r1Z4Srry/7/rpbn/zuCsa+X36x/mY/Fnh2f+oQHHu6SoAAAQIEthBYvkOwRYoW+anAsyfkTwdyIURAfiHs3SYdnd/o8btBFBlIh6BIUMokQIAAAQIjBRwIRuoamwABAgQIFBFwICgSlDIJECBAgMBIAQeCkbrGJkCAAAECRQQcCIoEpUwCBAgQIDBSwG8ZjNQ19nABnzIeTjx0AvkN5R0+ePb8stc3PKAnJ9AheBLM7QQIECBAYEUBHYIVU91oTf49+9phy09+IwXsr+d0dQie83I3AQIECBBYUkCHYMlY8yxq9DO80ePnkYypZLTv6PFj1PaZNXt+2evLtlN0CLIloh4CBAgQIBAg4EAQgG5KAgQIECCQTcCBIFsi6iFAgAABAgEC/wdVfx9UuC8B6AAAAABJRU5ErkJggg==);background-repeat:repeat-x;background-position:0 50%;display:flex;align-items:center;justify-content:center}.vjs-p .video-js-plugin-poster img{box-shadow:0 0 5px 10px #0006}.vjs-p .player-controller,.vjs-p .videojs-plugin-muted-alert{pointer-events:auto}.vjs-p.disabled .videojs-plugin-close-icon,.vjs-p.disabled .player-controller{pointer-events:none}.vjs-p .video-js-plugin-player{position:absolute;top:0;left:0;right:0;bottom:0}.video-js,[data-vjs-player]{width:100%;height:100%}.vjs-p .videojs-plugin-muted-alert{pointer-events:auto;cursor:pointer;position:absolute;top:0;left:0;right:0;bottom:0;z-index:43}.vjs-p .videojs-plugin-muted-alert:before{pointer-events:auto;cursor:pointer;position:absolute;top:0;left:0;right:0;bottom:0;z-index:43;content:"\\f104";background:rgba(0,0,0,.3);font-family:VideoJS;font-size:2em;display:flex;align-items:center;justify-content:center;color:#fff}.vjs-p .videojs-plugin-recovery-mode{pointer-events:auto;cursor:pointer;position:absolute;top:0;left:0;right:0;bottom:0;z-index:44}.vjs-p .videojs-plugin-recovery-mode button{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}.vjs-p .seek-slider{position:relative;width:100%}.vjs-p .seek-slider:focus{outline:none}.vjs-p .seek-slider .track{padding:10px 0;cursor:pointer;outline:none}.vjs-p .seek-slider .track:focus{border:0;outline:none}.vjs-p .seek-slider .track .main{width:100%;height:3px;background-color:#ffffff4d;border-radius:30px;position:absolute;left:0;top:8.5px;transition:transform .4s;outline:none}.vjs-p .seek-slider .track .main:focus{border:0;outline:none}.vjs-p .seek-slider .track .main .buffered{position:absolute;background-color:#ffffff4d;width:100%;height:100%;transform:scaleX(.8);z-index:2;transform-origin:0 0}.vjs-p .seek-slider .track .main .seek-hover{position:absolute;background-color:#ffffff80;width:100%;height:100%;z-index:1;transform:scaleX(.6);transform-origin:0 0;opacity:0;transition:opacity .4s}.vjs-p .seek-slider .track .main .connect{position:absolute;background-color:#fff;width:100%;height:100%;z-index:3;left:0;transform:scaleX(.13);transform-origin:0 0}.vjs-p .seek-slider .track.active .main{transform:scaleY(2)}.vjs-p .seek-slider .thumb{pointer-events:none;position:absolute;width:12px;height:12px;left:-6px;top:4px;z-index:4;transform:translate(100px)}.vjs-p .seek-slider .thumb .handler{border-radius:100%;width:100%;height:100%;background-color:#fff;opacity:0;transform:scale(.4);cursor:pointer;transition:transform .2s;pointer-events:none}.vjs-p .seek-slider .thumb.active .handler{opacity:1;transform:scale(1)}.vjs-p .seek-slider .hover-time{position:absolute;background-color:#0000004d;line-height:18px;font-size:16px;color:#ddd;top:-25px;left:0;padding:5px 10px;border-radius:5px;box-shadow:0 0 5px #0000004d;opacity:0;transform:translate(150px);pointer-events:none}.vjs-p .seek-slider .hover-time.active{opacity:1}.vjs-p .seek-slider:hover .track .main .seek-hover{opacity:1}.vjs-p .player-controller{position:absolute;z-index:100;bottom:0px;left:0;width:100%;display:flex;flex-direction:column;justify-content:center;align-items:stretch;height:64px;background-image:linear-gradient(0deg,#000,transparent);transition:opacity .2s;color:#fff}.vjs-p .player-menu-box{display:flex;align-items:center;justify-content:center;flex-direction:column;margin-bottom:40px}.vjs-p .player-menu-cell{width:100%;text-align:center;font-size:12px;color:#7a7b7c}.vjs-p .player-multiple-play{width:64px;height:120px}.vjs-p .player-controller-actions-left{display:flex;justify-content:center;align-items:center;flex-shrink:0}.vjs-p .player-right-box{font-size:14px;color:#7a7b7c;cursor:pointer;margin-right:12px}.vjs-p .player-controller-actions{display:flex;flex-direction:row;justify-content:space-between;align-items:center;padding-left:8px;padding-right:8px;margin-top:2px}.vjs-p .player-mid-box-time{font-size:9px;display:flex;justify-content:center;align-items:center;color:#fff;flex-shrink:0;margin-right:8px;font-family:monospace}.vjs-p .player-controller-play{display:flex;align-items:center;justify-content:center;cursor:pointer;padding-right:4px}.vjs-p .player-controller-progress{width:calc(100% - 28px);margin-left:14px;display:flex;align-items:center;justify-content:center;margin-top:8px}.vjs-p .player-volume{display:flex;align-items:center;justify-content:center;cursor:pointer;margin-right:16px;margin-left:8px}.vjs-p .player-volume-slider{width:60px;margin-right:12px;display:flex;align-items:center}.vjs-p .player-volume-box{display:flex;flex-direction:row}.netless-app-media-player-container{display:flex;position:relative;height:100%}
`);
  const l = document.createElement("div");
  l.classList.add("netless-app-media-player-container"), oM.render(wt.createElement(ZO, { context: r }), l), o.mountContent(l), r.emitter.on("destroy", () => {
    console.log("[MediaPlayer]: destroy"), oM.unmountComponentAtNode(l);
  });
} }, GO = () => {
  Wt.debug && $E({ verbose: !0 }), Wt.register({
    kind: Kb.kind,
    src: Kb
  }), Wt.register({
    kind: nS.kind,
    src: nS
  });
}, fL = {
  DocsViewer: Kb.kind,
  MediaPlayer: nS.kind
};
var XO = /* @__PURE__ */ ((r) => (r.Init = "Init", r.AttributesUpdate = "AttributesUpdate", r.SetAttributes = "SetAttributes", r.RegisterMagixEvent = "RegisterMagixEvent", r.RemoveMagixEvent = "RemoveMagixEvent", r.RemoveAllMagixEvent = "RemoveAllMagixEvent", r.RoomStateChanged = "RoomStateChanged", r.DispatchMagixEvent = "DispatchMagixEvent", r.ReciveMagixEvent = "ReciveMagixEvent", r.NextPage = "NextPage", r.PrevPage = "PrevPage", r.SDKCreate = "SDKCreate", r.OnCreate = "OnCreate", r.SetPage = "SetPage", r.GetAttributes = "GetAttributes", r.Ready = "Ready", r.Destory = "Destory", r.StartCreate = "StartCreate", r.WrapperDidUpdate = "WrapperDidUpdate", r.DispayIframe = "DispayIframe", r.HideIframe = "HideIframe", r.GetRootRect = "GetRootRect", r.ReplayRootRect = "ReplayRootRect", r.PageTo = "PageTo", r))(XO || {}), JO = /* @__PURE__ */ ((r) => (r.WrapperDidMount = "WrapperDidMount", r.IframeLoad = "IframeLoad", r))(JO || {});
const al = {
  Ready: "Ready",
  RootRect: "ReplayRootRect",
  Message: "message",
  ComputeStyle: "computeStyle",
  Load: "load",
  DisplayerState: "displayerState",
  Show: "show",
  Hide: "hide"
}, qO = (r, n) => new Array(r).fill(0).map((o, l) => n(l)), dn = class {
  constructor(r, n) {
    this.manager = r, this.appManager = n, this.magixEventMap = /* @__PURE__ */ new Map(), this.cssList = [], this.allowAppliances = ["clicker"], this.bridgeDisposer = vM, this.rootRect = null, this.sideEffectManager = new Nd(), this.execListenIframe = xs((o) => {
      this.listenIframe(o);
    }, 50), this.onPhaseChangedListener = (o) => {
      o === tT.Playing && this.computedStyleAndIframeDisplay();
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
        this.bridgeDisposer(), this.bridgeDisposer = Ss(() => {
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
  scaleIframeToFit(r = Ob.Immediately) {
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
      const h = qO(n, (m) => ({
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
    this.isReplay && (this.displayer._phase === tT.Playing && this.computedStyleAndIframeDisplay(), this.sideEffectManager.add(() => (this.displayer.callbacks.on("onPhaseChanged", this.onPhaseChangedListener), () => this.displayer.callbacks.off("onPhaseChanged", this.onPhaseChangedListener)), al.DisplayerState)), this.computedStyleAndIframeDisplay();
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
      const { width: h, height: m, scale: y, centerX: g, centerY: S } = n, C = this.rootRect || { x: 0, y: 0 }, I = `${h / 2 + C.x}px`, A = `${m / 2 + C.y}px`, z = `transform-origin: ${I} ${A};`, $ = (h - o) / 2 * y, U = (m - l) / 2 * y, q = -(g * y) + $, G = -(S * y) + U, he = `transform: translate(${q}px,${G}px) scale(${y}, ${y});`, ke = ["position: absolute;", "border: 0.1px solid rgba(0,0,0,0);", "top: 0px;", "left: 0px;", z, he];
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
Pd.emitter = new kd();
Pd.displayer = null;
Pd.alreadyCreate = !1;
function KO() {
  let r = /* @__PURE__ */ new Set();
  function n(y) {
    return r.add(y), () => {
      o(y);
    };
  }
  function o(y) {
    r.delete(y);
  }
  function l(...y) {
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
    runCallbacks: l,
    addCallback: n,
    removeCallback: o,
    hasCallbacks: h,
    removeAll: m
  };
}
const Gv = "scrollData";
class eL {
  constructor(n) {
    this.baseScrollTop = 0, this.baseScrollLeft = 0, this._sideEffect = new Nd();
    const { createVal: o } = ak(this._sideEffect);
    this._scrollingElement = n.scrollElement, this.manager = n.manager, this.appId = n.appId, this.baseScrollTop = this._scrollingElement.scrollHeight - this._scrollingElement.clientHeight, this.baseScrollLeft = this._scrollingElement.scrollWidth - this._scrollingElement.clientWidth, this.crood = o(this.getAttribute()), this.scroll(), this.crood.reaction(() => {
      this.scroll();
    });
    const l = {
      $crood: this.crood
    };
    sk(this, l), this._sideEffect.addEventListener(this._scrollingElement, "scroll", this.onScroll.bind(this), !0), this.callbackManager = KO(), this.sizeObserver = new ResizeObserver(this.callbackManager.runCallbacks), this.callbackManager.addCallback(this.updateSize.bind(this)), this.sizeObserver.observe(this._scrollingElement), this.sizeObserver.observe(this._scrollingElement.firstElementChild);
  }
  updateSize() {
    this.baseScrollTop = this._scrollingElement.scrollHeight - this._scrollingElement.clientHeight, this.baseScrollLeft = this._scrollingElement.scrollWidth - this._scrollingElement.clientWidth;
  }
  onScroll() {
    var l;
    const { x: n, y: o } = this.calcLocalToCoord(this.getLocalCoord());
    (l = this.manager.room) == null || l.dispatchMagixEvent(YE, { appId: this.appId, x: n, y: o });
  }
  scroll() {
    if (!this._scrollingElement)
      return;
    const { x: n, y: o } = this.calcCoordToLocal();
    this.scrollLeft(n), this.scrollTop(o);
  }
  setCoord(n) {
    this.crood.setValue({
      x: n.x || this.crood.value.x,
      y: n.y || this.crood.value.y
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
    const { x: n, y: o } = this.crood.value, l = { x: 0, y: 0 };
    return n && (l.x = n * this.baseScrollLeft), o && (l.y = o * this.baseScrollTop), l;
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
    return o && (h.x = o / this.baseScrollLeft), l && (h.y = l / this.baseScrollTop), h;
  }
  scrollLeft(n) {
    this._scrollingElement.scrollTo({ left: n, behavior: "auto" });
  }
  scrollTop(n) {
    this._scrollingElement.scrollTo({ top: n, behavior: "auto" });
  }
  destroy() {
    this._sideEffect.flushAll(), this.callbackManager.removeAll(), this.sizeObserver.disconnect();
  }
}
const YE = "window-mananer-app-scrolling";
class tL {
  constructor({ manager: n }) {
    var o;
    this.scrollers = [], this.manager = n, (o = n.room) == null || o.addMagixEventListener(YE, this.onAppScrolling.bind(this));
  }
  onAppScrolling({ payload: n }) {
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
    const o = new eL(n);
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
const nL = new G_({ emitter: tt }), $e = class extends nk {
  constructor(r) {
    super(r), this.version = "1.0.10", this.dependencies = { dependencies: { "@juggle/resize-observer": "^3.3.1", "@netless/telebox-insider": "github:veytu/telebox-insider", emittery: "^0.9.2", lodash: "^4.17.21", "p-retry": "^4.6.1", uuid: "^7.0.3", "value-enhancer": "0.0.8", "video.js": ">=7" }, peerDependencies: { jspdf: "2.5.1", "white-web-sdk": "^2.16.52" }, devDependencies: { "@hyrious/dts": "^0.2.2", "@netless/app-docs-viewer": "github:veytu/app-docs-viewer", "@netless/app-media-player": "0.1.0-beta.9", "@rollup/plugin-commonjs": "^20.0.0", "@rollup/plugin-node-resolve": "^13.0.4", "@rollup/plugin-url": "^6.1.0", "@sveltejs/vite-plugin-svelte": "^1.4.0", "@tsconfig/svelte": "^2.0.1", "@types/debug": "^4.1.7", "@types/lodash": "^4.14.182", "@types/lodash-es": "^4.17.4", "@types/uuid": "^8.3.1", "@typescript-eslint/eslint-plugin": "^4.30.0", "@typescript-eslint/parser": "^4.30.0", "@vitest/ui": "^0.14.1", cypress: "^8.7.0", dotenv: "^10.0.0", eslint: "^7.32.0", "eslint-config-prettier": "^8.3.0", "eslint-plugin-svelte3": "^3.2.0", jsdom: "^19.0.0", jspdf: "^2.5.1", less: "^4.1.1", prettier: "^2.3.2", "prettier-plugin-svelte": "^2.4.0", "rollup-plugin-analyzer": "^4.0.0", "rollup-plugin-styles": "^3.14.1", "side-effect-manager": "0.1.5", svelte: "^3.42.4", typescript: "^4.5.5", vite: "^3.0.0", vitest: "^0.14.1", "white-web-sdk": "2.16.52" } }, this.emitter = Dt, this.viewMode = sl.Broadcaster, this.isReplay = aS(this.displayer), this._cursorUIDs = [], this._appReadonly = !1, this.containerSizeRatio = $e.containerSizeRatio, $e.displayer = r.displayer, window.NETLESS_DEPS = { dependencies: { "@juggle/resize-observer": "^3.3.1", "@netless/telebox-insider": "github:veytu/telebox-insider", emittery: "^0.9.2", lodash: "^4.17.21", "p-retry": "^4.6.1", uuid: "^7.0.3", "value-enhancer": "0.0.8", "video.js": ">=7" }, peerDependencies: { jspdf: "2.5.1", "white-web-sdk": "^2.16.52" }, devDependencies: { "@hyrious/dts": "^0.2.2", "@netless/app-docs-viewer": "github:veytu/app-docs-viewer", "@netless/app-media-player": "0.1.0-beta.9", "@rollup/plugin-commonjs": "^20.0.0", "@rollup/plugin-node-resolve": "^13.0.4", "@rollup/plugin-url": "^6.1.0", "@sveltejs/vite-plugin-svelte": "^1.4.0", "@tsconfig/svelte": "^2.0.1", "@types/debug": "^4.1.7", "@types/lodash": "^4.14.182", "@types/lodash-es": "^4.17.4", "@types/uuid": "^8.3.1", "@typescript-eslint/eslint-plugin": "^4.30.0", "@typescript-eslint/parser": "^4.30.0", "@vitest/ui": "^0.14.1", cypress: "^8.7.0", dotenv: "^10.0.0", eslint: "^7.32.0", "eslint-config-prettier": "^8.3.0", "eslint-plugin-svelte3": "^3.2.0", jsdom: "^19.0.0", jspdf: "^2.5.1", less: "^4.1.1", prettier: "^2.3.2", "prettier-plugin-svelte": "^2.4.0", "rollup-plugin-analyzer": "^4.0.0", "rollup-plugin-styles": "^3.14.1", "side-effect-manager": "0.1.5", svelte: "^3.42.4", typescript: "^4.5.5", vite: "^3.0.0", vitest: "^0.14.1", "white-web-sdk": "2.16.52" } };
  }
  static onCreate(r) {
    $e._resolve(r);
  }
  static async mount(r) {
    var y, g, S;
    const n = r.room;
    $e.container = r.container, $e.supportAppliancePlugin = r.supportAppliancePlugin;
    const o = r.containerSizeRatio, l = r.debug, h = r.cursor;
    $e.params = r, $e.displayer = r.room, eN();
    let m;
    if (ol(n)) {
      if (n.phase !== ll.Connected)
        throw new Error("[WindowManager]: Room only Connected can be mount");
      n.phase === ll.Connected && n.isWritable && (n.disableSerialization = !1), m = await this.initManager(n);
    }
    if ($e.isCreated)
      throw new Error("[WindowManager]: Already created cannot be created again");
    if (this.debug = Boolean(l), this.debug && $E({ verbose: !0 }), Ca("Already insert room", m), ol(this.displayer)) {
      if (!m)
        throw new Error("[WindowManager]: init InvisiblePlugin failed");
    } else
      await mM(
        async (C) => {
          if (m = n.getInvisiblePlugin($e.kind), !m)
            throw Ca(`manager is empty. retrying ${C}`), new Error();
        },
        { retries: 10, maxTimeout: 5e3 }
      );
    if (!m)
      throw new Error("[WindowManager]: create manager failed");
    o && ($e.containerSizeRatio = o), await m.ensureAttributes(), m._fullscreen = r.fullscreen, m.appManager = new qk(m), m.appManager.polling = r.polling || !1, m._pageState = new Y_(m.appManager), m.cursorManager = new Z_(
      m.appManager,
      Boolean(h),
      r.cursorOptions,
      r.applianceIcons
    ), m.scrollerManager = new tL({ manager: m }), o && (m.containerSizeRatio = o), r.container && m.bindContainer(r.container), X_(n, m), tt.emit("onCreated"), $e.isCreated = !0;
    try {
      await fk();
    } catch (C) {
      console.warn("[WindowManager]: indexedDB open failed"), console.log(C);
    }
    return (y = m == null ? void 0 : m.room) == null || y.addMagixEventListener("onScaleChange", (C) => {
      m == null || m._setScale(C.payload);
    }), (g = m == null ? void 0 : m.room) == null || g.addMagixEventListener("onMainViewBackgroundImgChange", (C) => {
      m == null || m._setBackgroundImg(C.payload);
    }), (S = m == null ? void 0 : m.room) == null || S.addMagixEventListener("onMainViewBackgroundColorChange", (C) => {
      m == null || m._setBackgroundColor(C.payload);
    }), tt.on("playgroundSizeChange", () => {
      m == null || m._updateMainViewWrapperSize();
    }), m._initAttribute(), m;
  }
  static initManager(r) {
    return tN(r);
  }
  static initContainer(r, n, o) {
    const { chessboard: l, overwriteStyles: h, fullscreen: m } = o;
    $e.container || ($e.container = n);
    const { playground: y, wrapper: g, sizer: S, mainViewElement: C, mainViewWrapper: I, extendWrapper: A, mainViewScrollWrapper: z } = Kk(n);
    if ($e.playground = y, l && S.classList.add("netless-window-manager-chess-sizer"), m && S.classList.add("netless-window-manager-fullscreen"), h) {
      const $ = document.createElement("style");
      $.textContent = h, y.appendChild($);
    }
    return r.containerResizeObserver = oS.create(
      y,
      S,
      g,
      tt
    ), $e.wrapper = g, $e.sizer = S, $e.mainViewWrapper = I, $e.extendWrapper = A, $e.mainViewScrollWrapper = z, C;
  }
  static get registered() {
    return qi.registered;
  }
  bindContainer(r) {
    var n, o, l, h, m, y, g;
    if (ol(this.displayer) && this.room.phase !== ll.Connected)
      throw new jk();
    if ($e.isCreated && $e.container)
      $e.container.firstChild && r.appendChild($e.container.firstChild);
    else if ($e.params) {
      const S = $e.params, C = $e.initContainer(this, r, S);
      this.boxManager && this.boxManager.destroy();
      const I = p_(this, Dt, tt, po, {
        collectorContainer: S.collectorContainer,
        collectorStyles: S.collectorStyles,
        prefersColorScheme: S.prefersColorScheme
      });
      this.boxManager = I, (n = this.appManager) == null || n.setBoxManager(I), $e.mainViewWrapper && ((o = this.scrollerManager) == null || o.add({ appId: "mainView", scrollElement: $e.mainViewScrollWrapper, manager: this })), this.bindMainView(C, S.disableCameraTransform), $e.wrapper && ((l = this.cursorManager) == null || l.setupWrapper($e.wrapper));
    }
    tt.emit("updateManagerRect"), (h = this.appManager) == null || h.refresh(), (m = this.appManager) == null || m.resetMaximized(), (y = this.appManager) == null || y.resetMinimized(), (g = this.appManager) == null || g.displayerWritableListener(!this.room.isWritable), $e.container = r;
  }
  bindCollectorContainer(r) {
    $e.isCreated && this.boxManager ? this.boxManager.setCollectorContainer(r) : $e.params && ($e.params.collectorContainer = r);
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
        tt.once("rootDirRemoved").then(async () => {
          try {
            const l = await this._addApp(r);
            n(l);
          } catch (l) {
            o(l.message);
          }
        });
      }) : this._addApp(r);
    throw new ms();
  }
  async _addApp(r) {
    var n, o, l, h, m, y;
    if (this.appManager) {
      if (!r.kind || typeof r.kind != "string")
        throw new zk();
      r.src && typeof r.src == "string" && qi.register({ kind: r.kind, src: r.src });
      const g = await ((n = qi.appClasses.get(r.kind)) == null ? void 0 : n());
      if (g && ((o = g.config) == null ? void 0 : o.singleton) && this.appManager.appProxies.has(r.kind))
        throw new _k();
      const S = this.setupScenePath(r, this.appManager);
      if (S === void 0)
        return;
      (l = r == null ? void 0 : r.options) != null && l.scenePath && (r.options.scenePath = Dk(r.options.scenePath));
      const C = await this.appManager.addApp(r, Boolean(S));
      return (y = this.scrollerManager) == null || y.add({ appId: C, manager: this, scrollElement: (m = (h = this.appManager.boxManager) == null ? void 0 : h.getBox(C)) == null ? void 0 : m.$contentWrap }), C;
    } else
      throw new ms();
  }
  setupScenePath(r, n) {
    let o = !1;
    if (r.options) {
      const { scenePath: l, scenes: h } = r.options;
      if (l) {
        if (!Rk(l))
          throw new Lk();
        const m = Object.keys(this.apps || {});
        for (const y of m) {
          const g = n.store.getAppScenePath(y);
          if (g && g === l) {
            if (console.warn(`[WindowManager]: ScenePath "${l}" already opened`), this.boxManager) {
              const S = this.boxManager.getTopBox();
              S && (this.boxManager.setZIndex(y, S.zIndex + 1, !1), this.boxManager.focusBox({ appId: y }, !1));
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
    this.readonly = r, (n = this.boxManager) == null || n.setReadonly(r), tt.emit("setReadonly", r);
  }
  switchMainViewToWriter() {
    var r;
    return (r = this.appManager) == null ? void 0 : r.mainViewProxy.mainViewClickHandler();
  }
  onAppDestroy(r, n) {
    Ik(`destroy-${r}`, n);
  }
  onAppEvent(r, n) {
    return tt.on(`custom-${r}`, n);
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
    this._fullscreen !== r && (this._fullscreen = r, (n = $e.sizer) == null || n.classList.toggle("netless-window-manager-fullscreen", r), Dt.emit("fullscreenChange", r));
  }
  get cursorUIDs() {
    return this._cursorUIDs;
  }
  setCursorUIDs(r) {
    var n, o;
    if (this._cursorUIDs = r || [], this._cursorUIDs.length === 0)
      (n = this._cursorUIDsStyleDOM) == null || n.remove();
    else {
      this._cursorUIDsStyleDOM || (this._cursorUIDsStyleDOM = document.createElement("style")), (o = $e.playground) == null || o.appendChild(this._cursorUIDsStyleDOM);
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
          var m, y, g, S, C, I, A, z;
          return Number((S = (g = (y = (m = this.appManager) == null ? void 0 : m.boxManager) == null ? void 0 : y.getBox(l)) == null ? void 0 : g._zIndex$) == null ? void 0 : S.value) > Number((z = (A = (I = (C = this.appManager) == null ? void 0 : C.boxManager) == null ? void 0 : I.getBox(h)) == null ? void 0 : A._zIndex$) == null ? void 0 : z.value) ? l : h;
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
    var r, n;
    return Boolean((n = (r = this.appManager) == null ? void 0 : r.boxManager) == null ? void 0 : n.darkMode);
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
    throw new ms();
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
    return $e.extendWrapper;
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
    const n = iS(r, ["animationMode"]), o = { ...this.mainView.camera };
    ng({ ...o, ...n }, o) || (this.mainView.moveCamera(r), (l = this.appManager) == null || l.dispatchInternalEvent(Xt.MoveCamera, r), setTimeout(() => {
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
    (r = this.containerResizeObserver) == null || r.disconnect(), (n = this.appManager) == null || n.destroy(), (o = this.cursorManager) == null || o.destroy(), $e.container = void 0, $e.wrapper = void 0, $e.sizer = void 0, $e.isCreated = !1, $e.playground && ((l = $e.playground.parentNode) == null || l.removeChild($e.playground)), $e.params = void 0, (h = this._iframeBridge) == null || h.destroy(), this._iframeBridge = void 0, Ca("Destroyed");
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
    this._appReadonly = r;
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
    (r = this.appManager) == null || r.mainViewProxy.rebind(), $e.container && this.bindContainer($e.container), (n = this.appManager) == null || n.refresher.refresh();
  }
  setContainerSizeRatio(r) {
    if (!zb(r) || !(r > 0))
      throw new Error(
        `[WindowManager]: updateContainerSizeRatio error, ratio must be a positive number. but got ${r}`
      );
    $e.containerSizeRatio = r, this.containerSizeRatio = r, tt.emit("containerSizeRatioUpdate", r);
  }
  setScale(r) {
    this.room.dispatchMagixEvent("onScaleChange", r);
  }
  _updateMainViewWrapperSize(r) {
    var h;
    const n = (m) => {
      !$e.mainViewWrapper || ($e.mainViewWrapper.style.width = `${m.width}px`, $e.mainViewWrapper.style.height = `${m.height}px`);
    }, o = (h = $e.wrapper) == null ? void 0 : h.getBoundingClientRect();
    if (!o)
      return !1;
    const l = r != null ? r : this.getAttributesValue("scale");
    n({ width: (o == null ? void 0 : o.width) * l, height: (o == null ? void 0 : o.height) * l }), this.room.moveCamera({
      centerX: 0,
      centerY: 0,
      scale: l
    });
  }
  _setScale(r, n) {
    if (!zb(r))
      return !1;
    let o = r;
    return o < 1 && (o = 1), n || tt.emit("onScaleChange", o), this.safeUpdateAttributes(["scale"], o), this._updateMainViewWrapperSize(o), !0;
  }
  getScale() {
    return this.getAttributesValue(["scale"]) || 1;
  }
  isDynamicPPT(r) {
    var o, l;
    const n = (l = (o = r[0]) == null ? void 0 : o.ppt) == null ? void 0 : l.src;
    return n == null ? void 0 : n.startsWith("pptx://");
  }
  async ensureAttributes() {
    JD(this.attributes) && await SM(50), xa(this.attributes) && (this.attributes[xi.Apps] || this.safeSetAttributes({ [xi.Apps]: {} }), this.attributes[xi.Cursors] || this.safeSetAttributes({ [xi.Cursors]: {} }), this.attributes._mainScenePath || this.safeSetAttributes({ _mainScenePath: wM }), this.attributes._mainSceneIndex || this.safeSetAttributes({ _mainSceneIndex: 0 }), this.attributes[xi.Registered] || this.safeSetAttributes({ [xi.Registered]: {} }), this.attributes[xi.IframeBridge] || this.safeSetAttributes({ [xi.IframeBridge]: {} }), this.attributes.mainViewBackgroundColor || this.safeSetAttributes({ mainViewBackgroundColor: "" }), this.attributes.mainViewBackgroundImg || this.safeSetAttributes({ mainViewBackgroundImg: "" }), this.attributes.scale || this.safeSetAttributes({ scale: 1 }));
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
    !$e.mainViewWrapper || ($e.mainViewWrapper.style.backgroundColor = r, this.safeUpdateAttributes(["mainViewBackgroundColor"], r));
  }
  _setBackgroundImg(r) {
    !$e.mainViewWrapper || ($e.mainViewWrapper.style.backgroundImage = `url(${r})`, this.safeUpdateAttributes(["mainViewBackgroundImg"], r));
  }
  _initAttribute() {
    this.attributes.mainViewBackgroundImg && this._setBackgroundImg(this.attributes.mainViewBackgroundImg), this.attributes.mainViewBackgroundColor && this._setBackgroundColor(this.attributes.mainViewBackgroundColor), this.attributes.scale && this._setScale(this.attributes.scale);
  }
};
let Wt = $e;
Wt.kind = "WindowManager";
Wt.debug = !1;
Wt.containerSizeRatio = uk;
Wt.isCreated = !1;
Wt._resolve = (r) => {
};
GO();
export {
  _k as AppCreateError,
  ms as AppManagerNotInitError,
  dL as AppNotRegisterError,
  jk as BindContainerRoomPhaseInvalidError,
  Bk as BoxManagerNotFoundError,
  Ok as BoxNotCreatedError,
  fL as BuiltinApps,
  JO as DomEvents,
  Pd as IframeBridge,
  XO as IframeEvents,
  Lk as InvalidScenePath,
  zk as ParamsInvalidError,
  Pk as WhiteWebSDKInvalidError,
  Wt as WindowManager,
  MM as calculateNextIndex,
  nL as reconnectRefresher
};
//# sourceMappingURL=index.mjs.map
