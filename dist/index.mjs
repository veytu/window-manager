import cM from "p-retry";
import Nd from "emittery";
import { debounce as xs, isEqual as tg, omit as nS, isObject as xa, has as kb, get as yn, size as jD, mapValues as UD, noop as dM, pick as VD, isNumber as Pb, isEmpty as Gh, isInteger as HD, orderBy as WD, isFunction as xd, isString as jv, isNull as FD } from "lodash";
import { ScenePathType as Gv, UpdateEventKind as fM, listenUpdated as ng, unlistenUpdated as iS, reaction as lg, autorun as Ss, toJS as $D, listenDisposed as QD, unlistenDisposed as ZD, ViewMode as sl, AnimationMode as _b, isPlayer as rS, isRoom as Du, WhiteVersion as YD, ApplianceNames as Dn, RoomPhase as Nu, PlayerPhase as KC, InvisiblePlugin as GD } from "white-web-sdk";
import { v4 as XD } from "uuid";
import { ResizeObserver as JD } from "@juggle/resize-observer";
import eT from "video.js";
var Xt = /* @__PURE__ */ ((r) => (r.AppMove = "AppMove", r.AppFocus = "AppFocus", r.AppResize = "AppResize", r.AppBoxStateChange = "AppBoxStateChange", r.GetAttributes = "GetAttributes", r.UpdateWindowManagerWrapper = "UpdateWindowManagerWrapper", r.InitReplay = "InitReplay", r.WindowCreated = "WindowCreated", r.SetMainViewScenePath = "SetMainViewScenePath", r.SetMainViewSceneIndex = "SetMainViewSceneIndex", r.SetAppFocusIndex = "SetAppFocusIndex", r.SwitchViewsToFreedom = "SwitchViewsToFreedom", r.MoveCamera = "MoveCamera", r.MoveCameraToContain = "MoveCameraToContain", r.CursorMove = "CursorMove", r.RootDirRemoved = "RootDirRemoved", r.Refresh = "Refresh", r.InitMainViewCamera = "InitMainViewCamera", r))(Xt || {});
const zb = "__WindowManger", ob = "__WindowMangerEnsureReconnected__";
var Ji = /* @__PURE__ */ ((r) => (r.Size = "size", r.Position = "position", r.SceneIndex = "SceneIndex", r.ZIndex = "zIndex", r))(Ji || {}), hM = /* @__PURE__ */ ((r) => (r.setBoxSize = "setBoxSize", r.setBoxMinSize = "setBoxMinSize", r.destroy = "destroy", r))(hM || {}), Ob = /* @__PURE__ */ ((r) => (r.StartCreate = "StartCreate", r))(Ob || {}), Lb = /* @__PURE__ */ ((r) => (r.Leave = "leave", r.Normal = "normal", r))(Lb || {});
const tT = "2.16.1", qD = 340 / 720, KD = 340 / 720, eN = 9 / 16, Cr = "/", pM = "/init", mM = 50, Dt = new Nd();
class tN {
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
    }, mM), this.isEmit = !0;
  }
  empty() {
    this.list = [], this.clear();
  }
  destroy() {
    this.timer && this.clear();
  }
}
const Ke = new Nd(), nN = "__WindowManagerAppCache";
let np, nT;
const iN = async () => {
  np = await sN();
}, rN = (r, i) => {
  if (!!np)
    return lN(np, { kind: r, sourceCode: i });
}, aN = async (r) => np ? await oN(np, r) : null;
function sN() {
  return new Promise((r, i) => {
    const o = indexedDB.open(nN, 2);
    o.onerror = (c) => {
      i(c);
    }, o.onupgradeneeded = (c) => {
      const h = c.target.result;
      h.objectStoreNames.contains("apps") || (nT = h.createObjectStore("apps", { keyPath: "kind" }), nT.createIndex("kind", "kind", { unique: !0 }));
    }, o.onsuccess = () => {
      const c = o.result;
      r(c);
    };
  });
}
function oN(r, i) {
  return new Promise((o, c) => {
    const m = r.transaction(["apps"]).objectStore("apps").index("kind").get(i);
    m.onerror = (y) => c(y), m.onsuccess = () => {
      m.result ? o(m.result) : o(null);
    };
  });
}
function lN(r, i) {
  return new Promise((o, c) => {
    const h = r.transaction(["apps"], "readwrite").objectStore("apps").add(i);
    h.onsuccess = () => o(), h.onerror = () => c();
  });
}
const uN = "NetlessApp", cN = 1e4, dN = async (r) => {
  const i = await aN(r);
  if (i)
    return i.sourceCode;
  {
    const c = await (await pN(r, { timeout: cN })).text();
    return await rN(r, c), c;
  }
}, iT = (r, i) => {
  let o = Function(r + `
;return ${i}`)();
  return typeof o > "u" && (o = window[i]), o;
}, fN = async (r, i, o) => {
  const c = o || uN + i;
  Dt.emit("loadApp", { kind: i, status: "start" });
  let h;
  try {
    if (h = await dN(r), !h || h.length === 0)
      throw Dt.emit("loadApp", { kind: i, status: "failed", reason: "script is empty." }), new Error("[WindowManager]: script is empty.");
  } catch (m) {
    throw Dt.emit("loadApp", { kind: i, status: "failed", reason: m.message }), m;
  }
  return hN(h, c, i);
}, hN = (r, i, o) => {
  try {
    const c = iT(r, i);
    return Dt.emit("loadApp", { kind: o, status: "success" }), c;
  } catch (c) {
    if (c.message.includes("Can only have one anonymous define call per script file")) {
      const h = window.define;
      typeof h == "function" && h.amd && delete h.amd;
      const m = iT(r, i);
      return Dt.emit("loadApp", { kind: o, status: "success" }), m;
    }
    throw Dt.emit("loadApp", { kind: o, status: "failed", reason: c.message }), c;
  }
};
async function pN(r, i) {
  const { timeout: o = 1e4 } = i, c = new AbortController(), h = setTimeout(() => c.abort(), o), m = await fetch(r, {
    ...i,
    signal: c.signal,
    headers: {
      "content-type": "text/plain"
    }
  });
  return clearTimeout(h), m;
}
class mN {
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
      const h = await fN(o, i.kind, i.name);
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
const qi = new mN(), vN = async (r) => {
  var o, c;
  const i = await ((o = qi.appClasses.get(r)) == null ? void 0 : o());
  return i && ((c = i.config) == null ? void 0 : c.singleton) ? r : `${r}-${XD().replace("-", "").slice(0, 8)}`;
}, _u = (r, i) => {
  if (r.focusScenePath !== i)
    return r.focusScenePath = i, r;
}, Bb = (r, i) => {
  if (r && r.isWritable && r.state.sceneState.scenePath !== i) {
    const o = i === "/" ? "" : i;
    r.setScenePath(o);
  }
}, gN = (r, i, o) => {
  var c;
  if (r && i) {
    const m = (c = Ad(r)[i]) == null ? void 0 : c[o];
    if (m)
      return `${i}/${m.name}`;
  }
}, jb = (r, i, o) => {
  r && r.scenePathType(i) !== Gv.None && r.removeScenes(i, o);
}, yN = (r, i) => {
  Ke.once(r).then(i);
};
xs(
  (r, i) => {
    r.emit("mainViewModeChange", i);
  },
  200
);
const wN = (r, i, o = 0) => {
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
}, bN = (r) => r.startsWith("/"), lb = (r) => {
  const i = r.split("/");
  i.pop();
  let o = i.join("/");
  return o === "" && (o = "/"), o;
}, SN = (r) => r.endsWith("/") ? r.slice(0, -1) : r, rT = (r) => {
  const i = r.split(".").map((o) => o.padStart(2, "0")).join("");
  return parseInt(i);
}, vM = (r) => new Promise((i) => setTimeout(i, r)), xN = (r) => r.split("").reduce((o, c) => (c === Cr && (o += 1), o), 0) === 1;
class CN {
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
      _u(this.manager.mainView, o), Dt.emit("mainViewScenePathChange", o);
    }, this.moveCameraHandler = (o) => {
      tg(nS(o, ["animationMode"]), { ...this.manager.mainView.camera }) || this.manager.mainView.moveCamera(o);
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
    this.displayer.addMagixEventListener(zb, this.mainMagixEventListener);
  }
  removeListeners() {
    this.displayer.removeMagixEventListener(zb, this.mainMagixEventListener);
  }
}
class TN extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: app duplicate exists and cannot be created again";
  }
}
class KO extends Error {
  constructor(i) {
    super(`[WindowManager]: app ${i} need register or provide src`);
  }
}
class ms extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: AppManager must be initialized";
  }
}
class MN extends Error {
  constructor(i) {
    super(`[WindowManager]: white-web-sdk version must large than ${i}`);
  }
}
class EN extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: kind must be a valid string";
  }
}
class IN extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: box need created";
  }
}
class AN extends Error {
  constructor() {
    super(...arguments), this.message = '[WindowManager]: ScenePath should start with "/"';
  }
}
class RN extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: boxManager not found";
  }
}
class DN extends Error {
  constructor() {
    super(...arguments), this.message = "[WindowManager]: room phase only Connected can be bindContainer";
  }
}
const gM = "!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", NN = gM.length, aT = Array(20), Cd = () => {
  for (let r = 0; r < 20; r++)
    aT[r] = gM.charAt(Math.random() * NN);
  return aT.join("");
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
        h.map((y) => y.kind).includes(r) && o();
      };
      return ng(i, c), o(), () => iS(i, c);
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
      xa(m) ? (c = () => iS(m, i), ng(m, i)) : o == null || o(m);
    },
    { fireImmediately: !0 }
  );
  return () => {
    c == null || c(), h();
  };
}, kN = yM(fM.Removed);
yM(fM.Inserted);
class PN {
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
function sT(r) {
  return Boolean(kb(r, "__isRef"));
}
function _N(r) {
  return { k: Cd(), v: r, __isRef: !0 };
}
const ba = "_WM-STORAGE_";
class oT {
  constructor(i, o, c) {
    if (this._sideEffect = new lp(), this._destroyed = !1, this._refMap = /* @__PURE__ */ new WeakMap(), this._lastValue = /* @__PURE__ */ new Map(), this.onStateChanged = new PN(), c && !xa(c))
      throw new Error(`Default state for Storage ${o} is not an object.`);
    this._context = i, this.id = o || null, this._state = {};
    const h = this._getRawState(this._state);
    this._context.getIsWritable() && (this.id === null ? i.isAddApp && c && this.setState(c) : (h === this._state || !xa(h)) && (yn(this._context.getAttributes(), [ba]) || this._context.updateAttributes([ba], {}), this._context.updateAttributes([ba, this.id], this._state), c && this.setState(c))), ub(h).forEach((m) => {
      if (!(this.id === null && m === ba))
        try {
          const y = xa(h[m]) ? JSON.parse(JSON.stringify(h[m])) : h[m];
          sT(y) ? (this._state[m] = y.v, xa(y.v) && this._refMap.set(y.v, y)) : this._state[m] = y;
        } catch (y) {
          console.error(y);
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
      ub(i).reduce((o, c) => (kb(this._state, c) || (o[c] = i[c]), o), {})
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
          if (xa(h)) {
            let y = this._refMap.get(h);
            y || (y = _N(h), this._refMap.set(h, y)), m = y;
          }
          this._setRawState(c, m);
        }
    });
  }
  emptyStorage() {
    if (!(jD(this._state) <= 0)) {
      if (this._destroyed) {
        console.error(new Error(`Cannot empty destroyed Storage "${this.id}".`));
        return;
      }
      if (!this._context.getIsWritable()) {
        console.error(new Error(`Cannot empty Storage "${this.id}" without writable access.`));
        return;
      }
      this.setState(UD(this._state, dM));
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
          const m = i[h], y = m.key;
          if (this.id === null && y === ba)
            continue;
          const g = xa(m.value) ? JSON.parse(JSON.stringify(m.value)) : m.value;
          let S;
          switch (this._lastValue.has(y) && (S = this._lastValue.get(y), this._lastValue.delete(y)), m.kind) {
            case 2: {
              kb(this._state, y) && (S = this._state[y], delete this._state[y]), c[y] = { oldValue: S };
              break;
            }
            default: {
              let C = g;
              if (sT(g)) {
                const { k: A, v: I } = g, z = this._state[y];
                xa(z) && ((o = this._refMap.get(z)) == null ? void 0 : o.k) === A ? C = z : (C = I, xa(I) && this._refMap.set(I, g));
              }
              C !== this._state[y] && (S = this._state[y], this._state[y] = C), c[y] = { newValue: C, oldValue: S };
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
class zN {
  constructor(i, o, c, h, m) {
    this.manager = i, this.boxManager = o, this.appId = c, this.appProxy = h, this.appOptions = m, this.mobxUtils = {
      autorun: Ss,
      reaction: lg,
      toJS: $D
    }, this.objectUtils = {
      listenUpdated: ng,
      unlistenUpdated: iS,
      listenDisposed: QD,
      unlistenDisposed: ZD
    }, this.store = this.manager.store, this.isReplay = this.manager.isReplay, this.getDisplayer = () => this.manager.displayer, this.getAttributes = () => this.appProxy.attributes, this.getScenes = () => {
      const y = this.store.getAppAttributes(this.appId);
      return y != null && y.isDynamicPPT ? this.appProxy.scenes : y == null ? void 0 : y.options.scenes;
    }, this.getView = () => this.appProxy.view, this.mountView = (y) => {
      const g = this.getView();
      g && (g.divElement = y, setTimeout(() => {
        var S;
        (S = this.getRoom()) == null || S.refreshViewSize(), Dt.emit("onAppViewMounted", { appId: this.appId, view: g });
      }, 1e3));
    }, this.getInitScenePath = () => this.manager.getAppInitPath(this.appId), this.getIsWritable = () => this.manager.canOperate, this.getBox = () => {
      const y = this.boxManager.getBox(this.appId);
      if (y)
        return y;
      throw new IN();
    }, this.getRoom = () => this.manager.room, this.setAttributes = (y) => {
      this.manager.safeSetAttributes({ [this.appId]: y });
    }, this.updateAttributes = (y, g) => {
      this.manager.attributes[this.appId] && this.manager.safeUpdateAttributes([this.appId, ...y], g);
    }, this.setScenePath = async (y) => {
      var g;
      !this.appProxy.box || (this.appProxy.setFullPath(y), (g = this.getRoom()) == null || g.setScenePath(y));
    }, this.getAppOptions = () => typeof this.appOptions == "function" ? this.appOptions() : this.appOptions, this.createStorage = (y, g) => {
      const S = new oT(this, y, g);
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
          const A = this.pageState.index + 1;
          Xh(this.manager.room, C, [S || {}], A);
        } else
          Xh(this.manager.room, C, [S || {}]);
    }, this.removePage = async (y) => {
      const g = y === void 0 ? this.pageState.index : y;
      return this.pageState.length === 1 ? (console.warn("[WindowManager]: can not remove the last page"), !1) : g < 0 || g >= this.pageState.length ? (console.warn(`[WindowManager]: page index ${y} out of range`), !1) : this.appProxy.removeSceneByIndex(g);
    }, this.emitter = h.appEmitter, this.isAddApp = h.isAddApp;
  }
  get storage() {
    return this._storage || (this._storage = new oT(this)), this._storage;
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
class ON {
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
class LN {
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
    const y = VD(i.options, m), g = { kind: i.kind, options: y, isDynamicPPT: c };
    typeof i.src == "string" && (g.src = i.src), g.createdAt = Date.now(), this.context.safeUpdateAttributes(["apps", o], g), this.context.safeUpdateAttributes(["apps", o, "state"], {
      [Ji.Size]: {},
      [Ji.Position]: {},
      [Ji.SceneIndex]: 0
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
    if (xa(i)) {
      const o = this.getIframeBridge();
      for (const c in i) {
        const h = i[c];
        o[c] !== h && this.context.safeUpdateAttributes(["iframeBridge", c], h);
      }
    }
  }
}
const BN = new LN({
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
  Qt.debug && console.log("[WindowManager]:", ...r);
}, bM = (r, i) => {
  let o = 0;
  const c = i.length - 1;
  return r === i.index ? r === c ? o = r - 1 : o = i.index + 1 : o = i.index, o;
}, po = new Nd();
class aS {
  constructor(i, o, c, h) {
    var m;
    this.params = i, this.manager = o, this.boxManager = this.manager.boxManager, this.appProxies = this.manager.appProxies, this.viewManager = this.manager.viewManager, this.store = this.manager.store, this.status = "normal", this.getAppInitState = (y) => {
      var q, fe;
      const g = this.store.getAppState(y);
      if (!g)
        return;
      const S = g == null ? void 0 : g[Ji.Position], C = this.store.focus, A = g == null ? void 0 : g[Ji.Size], I = g == null ? void 0 : g[Ji.SceneIndex], z = (q = this.attributes) == null ? void 0 : q.maximized, F = (fe = this.attributes) == null ? void 0 : fe.minimized, $ = g == null ? void 0 : g.zIndex;
      let K = { maximized: z, minimized: F, zIndex: $ };
      return S && (K = { ...K, id: y, x: S.x, y: S.y }), C === y && (K = { ...K, focus: !0 }), A && (K = { ...K, width: A.width, height: A.height }), I && (K = { ...K, sceneIndex: I }), K;
    }, this.appAttributesUpdateListener = (y) => {
      this.manager.refresher.add(y, () => Ss(() => {
        const g = this.manager.attributes[y];
        g && this.appEmitter.emit("attributesUpdate", g);
      })), this.manager.refresher.add(this.stateKey, () => Ss(() => {
        var S, C, A, I;
        const g = (S = this.appAttributes) == null ? void 0 : S.state;
        (g == null ? void 0 : g.zIndex) > 0 && g.zIndex !== ((C = this.box) == null ? void 0 : C.zIndex) && ((A = this.boxManager) == null || A.setZIndex(y, g.zIndex), (I = this.boxManager) == null || I.focusBox({ appId: y }));
      })), this.manager.refresher.add(`${y}-fullPath`, () => Ss(() => {
        var S;
        const g = (S = this.appAttributes) == null ? void 0 : S.fullPath;
        this.setFocusScenePathHandler(g), this._prevFullPath !== g && (this.notifyPageStateChange(), this._prevFullPath = g);
      }));
    }, this.setFocusScenePathHandler = xs((y) => {
      var g;
      this.view && y && y !== ((g = this.view) == null ? void 0 : g.focusScenePath) && (_u(this.view, y), Dt.emit("onAppScenePathChange", { appId: this.id, view: this.view }));
    }, 50), this.notifyPageStateChange = xs(() => {
      this.appEmitter.emit("pageStateChange", this.pageState);
    }, 50), this.kind = i.kind, this.id = c, this.stateKey = `${this.id}_state`, this.appProxies.set(this.id, this), this.appEmitter = new Nd(), this.appListener = this.makeAppEventListener(this.id), this.isAddApp = h, this.initScenes(), (m = this.params.options) != null && m.scenePath && this.createView(), this._pageState = new ON({
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
      return yn(this.appAttributes, [xi.FullPath]) || this.getFullScenePathFromScenes();
  }
  getFullScenePathFromScenes() {
    const i = yn(this.appAttributes, ["state", "SceneIndex"], 0), o = gN(this.manager.room, this.scenePath, i);
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
    if (Ca("setupApp", i, c, h), !this.boxManager)
      throw new RN();
    const y = new zN(this.manager, this.boxManager, i, this, m);
    this.appContext = y;
    try {
      Ke.once(`${i}${Xt.WindowCreated}`).then(async () => {
        var z;
        let I;
        o || (I = this.getAppInitState(i), (z = this.boxManager) == null || z.updateBoxState(I)), this.appEmitter.onAny(this.appListener), this.appAttributesUpdateListener(i), this.setViewFocusScenePath(), setTimeout(async () => {
          console.log("setup app", c);
          const F = await c.setup(y);
          this.appResult = F, qi.notifyApp(this.kind, "created", { appId: i, result: F }), this.afterSetupApp(I), this.fixMobileSize(), Dt.emit("onAppSetup", i);
        }, mM);
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
      const S = this.store.attributes.scale, C = this.store.attributes.mainViewBackgroundImg;
      let A = Pb(S) ? S : 1;
      A < 1 && (A = 1), Ke.emit("onScaleChange", A), Ke.emit("onBackgroundImgChange", C);
    } catch (S) {
      throw console.error(S), new Error(`[WindowManager]: app setup error: ${S.message}`);
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
    this.manager.room && i && this.view && Bb(this.manager.room, i);
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
      return this.setSceneIndexWithoutSync(c), this.manager.dispatchInternalEvent(Xt.SetAppFocusIndex, {
        type: "app",
        appID: this.id,
        index: c
      }), setTimeout(() => {
        jb(this.manager.room, o, i);
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
      this.appEmitter.clearListeners(), Ke.emit(`destroy-${this.id}`, { error: h }), i && ((m = this.boxManager) == null || m.closeBox(this.id, c)), o && (this.store.cleanAppAttributes(this.id), this.scenePath && jb(this.manager.room, this.scenePath)), this.appProxies.delete(this.id), this._pageState.destroy(), this.viewManager.destroyView(this.id), this.manager.appStatus.delete(this.id), this.manager.refresher.remove(this.id), this.manager.refresher.remove(this.stateKey), this.manager.refresher.remove(`${this.id}-fullPath`), this._prevFullPath = void 0;
    }
  }
  close() {
    return this.destroy(!0, !0, !1);
  }
}
class jN {
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
  return UN(i), i;
}, UN = (r) => {
  r.setCameraBound({
    maxContentMode: () => 10,
    minContentMode: () => 0.1
  });
};
class VN {
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
      this.manager.refresher.add(xi.MainViewCamera, this.cameraReaction);
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
      Dt.emit("cameraStateChange", this.cameraState), this.manager.room && this.manager.room.syncMainView && (clearTimeout(this._syncMainViewTimer), this._syncMainViewTimer = setTimeout(this.syncMainView, 100, this.manager.room)), this.ensureMainViewSize();
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
    this.viewMode === sl.Broadcaster && (!this.mainViewCamera || !this.mainViewSize) && (this.manager.dispatchInternalEvent(Xt.InitMainViewCamera), this.setCameraAndSize());
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
      animationMode: _b.Immediately
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
        animationMode: _b.Immediately
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
class HN {
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
class WN {
  constructor(i) {
    this.windowManger = i, this.appProxies = /* @__PURE__ */ new Map(), this.appStatus = /* @__PURE__ */ new Map(), this.store = BN, this.isReplay = this.windowManger.isReplay, this.mainViewScenesLength = 0, this.callbacksNode = null, this.appCreateQueue = new tN(), this.sideEffectManager = new lp(), this.sceneState = null, this.rootDirRemoving = !1, this.onRemoveScenes = async (o) => {
      var h, m;
      const { scenePath: c } = o;
      if (c === Cr) {
        await this.onRootDirRemoved(), this.dispatchInternalEvent(Xt.RootDirRemoved);
        return;
      }
      if (xN(c)) {
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
          await this.onSceneChange(c), Ke.emit("rootDirSceneRemoved", h);
        }
      }), this.callbacksNode && (this.updateSceneState(this.callbacksNode), this.mainViewScenesLength = this.callbacksNode.scenes.length, o && this.emitMainViewScenesChange(this.callbacksNode.scenes.length));
    }, this.removeSceneByIndex = async (o) => {
      var m;
      const c = bM(o, this.windowManger.pageState);
      this.setSceneIndexWithoutSync(c), this.dispatchInternalEvent(Xt.SetAppFocusIndex, { type: "main", index: c });
      const h = (m = this.callbacksNode) == null ? void 0 : m.scenes[o];
      return setTimeout(() => {
        h && jb(this.room, `${Cr}${h}`, o);
      }, 100), new Promise((y, g) => {
        Ke.once("rootDirSceneRemoved").then((S) => {
          S === h && y(!0);
        }).catch((S) => {
          console.log(`[WindowManager]: removePage error: ${S}`), g(!1);
        });
      });
    }, this.setSceneIndexWithoutSync = (o) => {
      var h;
      const c = (h = this.callbacksNode) == null ? void 0 : h.scenes[o];
      c && this.mainViewProxy.setFocusScenePath(`${Cr}${c}`);
    }, this.onSceneChange = (o) => (this.mainViewScenesLength = o.scenes.length, this.updateSceneState(o), this.emitMainViewScenesChange(this.mainViewScenesLength)), this.emitMainViewScenesChange = (o) => Promise.all([
      Dt.emit("mainViewScenesLengthChange", o),
      Ke.emit("changePageState")
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
      this.refresher.add("apps", () => wM(
        () => this.attributes.apps,
        () => {
          this.attributesUpdateCallback(this.attributes.apps);
        }
      ));
    }, this.addAppCloseListener = () => {
      this.refresher.add("appsClose", () => kN(this.attributes.apps, () => {
        this.onAppDelete(this.attributes.apps);
      }));
    }, this.onMainViewIndexChange = (o) => {
      o !== void 0 && this._prevSceneIndex !== o && (Dt.emit("mainViewSceneIndexChange", o), Ke.emit("changePageState"), this.callbacksNode && this.updateSceneState(this.callbacksNode), this._prevSceneIndex = o);
    }, this.onFocusChange = (o) => {
      var c;
      this._prevFocused !== o && (Dt.emit("focusedChange", o), Ke.emit("focusedChange", { focused: o, prev: this._prevFocused }), this._prevFocused = o, o !== void 0 && ((c = this.boxManager) == null || c.focusBox({ appId: o }), setTimeout(() => {
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
      }), Ke.emit("observerIdChange", this.displayer.observerId);
    }, this.displayerWritableListener = (o) => {
      var m, y;
      const c = !o, h = this.windowManger.readonly === void 0 || this.windowManger.readonly === !1;
      this.windowManger.readonly === void 0 ? (m = this.boxManager) == null || m.setReadonly(o) : (y = this.boxManager) == null || y.setReadonly(!(c && h)), this.appProxies.forEach((g) => {
        g.emitAppIsWritableChange();
      }), Ke.emit("writableChange", c);
    }, this.updateSceneIndex = () => {
      const o = this.store.getMainViewScenePath(), c = lb(o), h = Ad(this.displayer)[c];
      if (h.length) {
        const m = o.replace(c, "").replace("/", ""), y = h.findIndex((g) => g.name === m);
        HD(y) && y >= 0 && this.safeSetAttributes({ _mainSceneIndex: y });
      }
    }, this.updateRootDirRemoving = (o) => {
      this.rootDirRemoving = o;
    }, this.displayer = i.displayer, this.store.setContext({
      getAttributes: () => this.attributes,
      safeSetAttributes: (o) => this.safeSetAttributes(o),
      safeUpdateAttributes: (o, c) => this.safeUpdateAttributes(o, c)
    }), this.mainViewProxy = new VN(this), this.viewManager = new jN(this.displayer), this.appListeners = new CN(this), this.displayer.callbacks.on(this.eventName, this.displayerStateListener), this.appListeners.addListeners(), this.refresher = $O, this.refresher.setRoom(this.room), this.refresher.setContext({ emitter: Ke }), this.sideEffectManager.addDisposer(() => {
      var o, c;
      this.appCreateQueue.destroy(), this.mainViewProxy.destroy(), this.refresher.destroy(), this.viewManager.destroy(), (o = this.boxManager) == null || o.destroy(), (c = this.callbacksNode) == null || c.dispose();
    }), Ke.once("onCreated").then(() => this.onCreated()), Ke.on("onReconnected", () => this.onReconnected()), rS(this.displayer) && (Ke.on("seekStart", this.onPlayerSeekStart), Ke.on("seek", this.onPlayerSeekDone)), Ke.on("removeScenes", this.onRemoveScenes), Ke.on("setReadonly", this.onReadonlyChanged), this.createRootDirScenesCallback(), qi.setSyncRegisterApp((o) => {
      this.safeUpdateAttributes([xi.Registered, o.kind], o);
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
      const o = yn(this.attributes, xi.Registered);
      this.onRegisteredChange(o);
    })), !this.attributes.apps || Object.keys(this.attributes.apps).length === 0) {
      const o = this.store.getMainViewScenePath();
      if (!o)
        return;
      this.resetScenePath(o);
    }
    this.displayerWritableListener(!((i = this.room) != null && i.isWritable)), this.displayer.callbacks.on("onEnableWriteNowChanged", this.displayerWritableListener), this._prevFocused = this.attributes.focus, this.sideEffectManager.add(() => {
      const o = new HN({
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
    if (i && Qt.container) {
      const o = Object.keys(i);
      o.length === 0 && this.appCreateQueue.emitReady();
      const h = WD(
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
            this.appCreateQueue.push(() => (this.appStatus.set(m, Ob.StartCreate), this.baseInsertApp(
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
    c.disableCameraTransform = o, c.divElement = i, c.focusScenePath || this.setMainViewFocusPath(), Ke.emit("mainViewMounted"), Dt.emit("onMainViewMounted", c);
  }
  setMainViewFocusPath(i) {
    var c;
    const o = i || this.store.getMainViewScenePath();
    if (o)
      return _u(this.mainView, o), ((c = this.mainView) == null ? void 0 : c.focusScenePath) === o;
  }
  resetScenePath(i) {
    this.displayer.state.sceneState.scenePath !== i && Bb(this.room, i);
  }
  async addApp(i, o) {
    Ca("addApp", i);
    const { appId: c, needFocus: h } = await this.beforeAddApp(i, o), m = await this.baseInsertApp(i, c, !0, h);
    return this.afterAddApp(m), m == null ? void 0 : m.id;
  }
  async beforeAddApp(i, o) {
    var y, g;
    const c = await vN(i.kind);
    this.appStatus.set(c, Ob.StartCreate);
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
      if (lb(i) !== Cr)
        throw new Error('[WindowManager]: main view scenePath must in root dir "/"');
      if (o === Gv.None)
        throw new Error(`[WindowManager]: ${i} not valid scene`);
      if (o === Gv.Page)
        await this._setMainViewScenePath(i);
      else if (o === Gv.Dir) {
        const h = wN(this.displayer, i);
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
    this.dispatchInternalEvent(Xt.SetMainViewScenePath, { nextScenePath: i }), Dt.emit("mainViewScenePathChange", i), Bb(this.room, i);
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
    this.safeDispatchMagixEvent(zb, {
      eventName: i,
      payload: o
    });
  }
  destroy() {
    this.displayer.callbacks.off(this.eventName, this.displayerStateListener), this.displayer.callbacks.off("onEnableWriteNowChanged", this.displayerWritableListener), this.appListeners.removeListeners(), po.clearListeners(), Ke.clearListeners(), this.appProxies.size && this.appProxies.forEach((i) => {
      i.destroy(!0, !1, !0);
    }), Dt.clearListeners(), this.sideEffectManager.flushAll(), this._prevFocused = void 0, this._prevSceneIndex = void 0;
  }
}
const FN = (r) => {
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
  return y.className = "netless-window-manager-main-view", i.appendChild(o), o.appendChild(c), m.appendChild(y), h.appendChild(m), c.appendChild(h), r.appendChild(i), Qt.wrapper = c, { playground: i, wrapper: c, sizer: o, mainViewElement: y, mainViewWrapper: m };
}, $N = () => {
  if (rT(YD) < rT(tT))
    throw new MN(tT);
}, Ub = (r, i) => {
  var m;
  const o = (r == null ? void 0 : r.state.roomMembers) || [];
  let c = -1, h;
  for (const y of o)
    ((m = y.payload) == null ? void 0 : m.uid) === i && c < y.memberId && (c = y.memberId, h = y);
  return h;
}, QN = async (r) => {
  let i = r.getInvisiblePlugin(Qt.kind);
  if (i)
    return i;
  let o;
  const c = new Promise((C) => {
    Qt._resolve = o = C;
  });
  let h = !1;
  const m = ZN(r);
  !r.isWritable && m && (h = !0, await cM(
    async (C) => {
      Ca(`switching to writable (x${C})`), await r.setWritable(!0);
    },
    { retries: 10, maxTimeout: 5e3 }
  )), r.isWritable ? (Ca("creating InvisiblePlugin..."), r.createInvisiblePlugin(Qt, {}).catch(console.warn)) : (m && console.warn("[WindowManager]: failed to switch to writable"), console.warn("[WindowManager]: waiting for others to create the plugin..."));
  const y = setTimeout(() => {
    console.warn("[WindowManager]: no one called createInvisiblePlugin() after 20 seconds");
  }, 2e4), g = setTimeout(() => {
    throw new Error("[WindowManager]: no one called createInvisiblePlugin() after 60 seconds");
  }, 6e4), S = setInterval(() => {
    i = r.getInvisiblePlugin(Qt.kind), i && (clearTimeout(g), clearTimeout(y), clearInterval(S), o(i), h && r.isWritable && setTimeout(() => r.setWritable(!1).catch(console.warn), 500));
  }, 200);
  return c;
}, ZN = (r) => {
  try {
    const i = atob(r.roomToken.slice(12)), o = i.indexOf("&role=");
    return +i[o + 6] < 2;
  } catch (i) {
    return console.error(i), !1;
  }
}, YN = window.ResizeObserver || JD;
class sS {
  constructor(i) {
    this.emitter = i;
  }
  static create(i, o, c, h) {
    const m = new sS(h);
    return m.observePlaygroundSize(i, o, c), m;
  }
  observePlaygroundSize(i, o, c) {
    this.updateSizer(i.getBoundingClientRect(), o, c), this.containerResizeObserver = new YN((h) => {
      var y;
      const m = (y = h[0]) == null ? void 0 : y.contentRect;
      m && (this.updateSizer(m, o, c), this.emitter.emit("playgroundSizeChange", m));
    }), this.disposer = this.emitter.on("containerSizeRatioUpdate", () => {
      const h = i.getBoundingClientRect();
      this.updateSizer(h, o, c), this.emitter.emit("playgroundSizeChange", h);
    }), this.containerResizeObserver.observe(i);
  }
  updateSizer({ width: i, height: o }, c, h) {
    i && o && (o / i > Qt.containerSizeRatio ? (o = i * Qt.containerSizeRatio, c.classList.toggle("netless-window-manager-sizer-horizontal", !0)) : (i = o / Qt.containerSizeRatio, c.classList.toggle("netless-window-manager-sizer-horizontal", !1)), h.style.width = `${i}px`, h.style.height = `${o}px`);
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
  function h(S, C, A) {
    this.fn = S, this.context = C, this.once = A || !1;
  }
  function m(S, C, A, I, z) {
    if (typeof A != "function")
      throw new TypeError("The listener must be a function");
    var F = new h(A, I || S, z), $ = o ? o + C : C;
    return S._events[$] ? S._events[$].fn ? S._events[$] = [S._events[$], F] : S._events[$].push(F) : (S._events[$] = F, S._eventsCount++), S;
  }
  function y(S, C) {
    --S._eventsCount === 0 ? S._events = new c() : delete S._events[C];
  }
  function g() {
    this._events = new c(), this._eventsCount = 0;
  }
  g.prototype.eventNames = function() {
    var C = [], A, I;
    if (this._eventsCount === 0)
      return C;
    for (I in A = this._events)
      i.call(A, I) && C.push(o ? I.slice(1) : I);
    return Object.getOwnPropertySymbols ? C.concat(Object.getOwnPropertySymbols(A)) : C;
  }, g.prototype.listeners = function(C) {
    var A = o ? o + C : C, I = this._events[A];
    if (!I)
      return [];
    if (I.fn)
      return [I.fn];
    for (var z = 0, F = I.length, $ = new Array(F); z < F; z++)
      $[z] = I[z].fn;
    return $;
  }, g.prototype.listenerCount = function(C) {
    var A = o ? o + C : C, I = this._events[A];
    return I ? I.fn ? 1 : I.length : 0;
  }, g.prototype.emit = function(C, A, I, z, F, $) {
    var K = o ? o + C : C;
    if (!this._events[K])
      return !1;
    var q = this._events[K], fe = arguments.length, se, Z;
    if (q.fn) {
      switch (q.once && this.removeListener(C, q.fn, void 0, !0), fe) {
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
      for (Z = 1, se = new Array(fe - 1); Z < fe; Z++)
        se[Z - 1] = arguments[Z];
      q.fn.apply(q.context, se);
    } else {
      var ce = q.length, oe;
      for (Z = 0; Z < ce; Z++)
        switch (q[Z].once && this.removeListener(C, q[Z].fn, void 0, !0), fe) {
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
              for (oe = 1, se = new Array(fe - 1); oe < fe; oe++)
                se[oe - 1] = arguments[oe];
            q[Z].fn.apply(q[Z].context, se);
        }
    }
    return !0;
  }, g.prototype.on = function(C, A, I) {
    return m(this, C, A, I, !1);
  }, g.prototype.once = function(C, A, I) {
    return m(this, C, A, I, !0);
  }, g.prototype.removeListener = function(C, A, I, z) {
    var F = o ? o + C : C;
    if (!this._events[F])
      return this;
    if (!A)
      return y(this, F), this;
    var $ = this._events[F];
    if ($.fn)
      $.fn === A && (!z || $.once) && (!I || $.context === I) && y(this, F);
    else {
      for (var K = 0, q = [], fe = $.length; K < fe; K++)
        ($[K].fn !== A || z && !$[K].once || I && $[K].context !== I) && q.push($[K]);
      q.length ? this._events[F] = q.length === 1 ? q[0] : q : y(this, F);
    }
    return this;
  }, g.prototype.removeAllListeners = function(C) {
    var A;
    return C ? (A = o ? o + C : C, this._events[A] && y(this, A)) : (this._events = new c(), this._eventsCount = 0), this;
  }, g.prototype.off = g.prototype.removeListener, g.prototype.addListener = g.prototype.on, g.prefixed = o, g.EventEmitter = g, r.exports = g;
})(xM);
var Vb = xM.exports;
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
function oS(r, i) {
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
}, GN = function(r) {
  var i = [], o = [], c = 0, h = !1, m = 0, y = /* @__PURE__ */ new WeakSet(), g = /* @__PURE__ */ new WeakSet(), S = {
    cancel: function(C) {
      var A = o.indexOf(C);
      y.add(C), A !== -1 && o.splice(A, 1);
    },
    process: function(C) {
      var A;
      if (h = !0, A = [o, i], i = A[0], o = A[1], o.length = 0, c = i.length, c) {
        var I;
        for (m = 0; m < c; m++)
          I = i[m], I(C), g.has(I) === !0 && !y.has(I) && (S.schedule(I), r(!0));
      }
      h = !1;
    },
    schedule: function(C, A, I) {
      A === void 0 && (A = !1), I === void 0 && (I = !1);
      var z = I && h, F = z ? i : o;
      y.delete(C), A && g.add(C), F.indexOf(C) === -1 && (F.push(C), z && (c = i.length));
    }
  };
  return S;
}, XN = 40, lT = 1 / 60 * 1e3, Xv = !0, rp = !1, Hb = !1, Zh = {
  delta: 0,
  timestamp: 0
}, lS = ["read", "update", "preRender", "render", "postRender"], JN = function(r) {
  return rp = r;
}, TM = /* @__PURE__ */ lS.reduce(function(r, i) {
  return r[i] = GN(JN), r;
}, {}), qN = /* @__PURE__ */ lS.reduce(function(r, i) {
  var o = TM[i];
  return r[i] = function(c, h, m) {
    return h === void 0 && (h = !1), m === void 0 && (m = !1), rp || ek(), o.schedule(c, h, m), c;
  }, r;
}, {}), KN = function(r) {
  return TM[r].process(Zh);
}, MM = function(r) {
  rp = !1, Zh.delta = Xv ? lT : Math.max(Math.min(r - Zh.timestamp, XN), 1), Xv || (lT = Zh.delta), Zh.timestamp = r, Hb = !0, lS.forEach(KN), Hb = !1, rp && (Xv = !1, CM(MM));
}, ek = function() {
  rp = !0, Xv = !0, Hb || CM(MM);
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
}, Jh = Yr(Yr({}, ug), { transform: EM(0, 1) }), Uv = Yr(Yr({}, ug), { default: 1 }), uS = function(r) {
  return {
    test: function(i) {
      return typeof i == "string" && i.endsWith(r) && i.split(" ").length === 1;
    },
    parse: parseFloat,
    transform: function(i) {
      return "" + i + r;
    }
  };
}, Au = uS("deg"), qh = uS("%"), ut = uS("px"), uT = Yr(Yr({}, qh), { parse: function(r) {
  return qh.parse(r) / 100;
}, transform: function(r) {
  return qh.transform(r * 100);
} }), tk = function(r) {
  return r.substring(r.indexOf("(") + 1, r.lastIndexOf(")"));
}, nk = EM(0, 255), Wb = function(r) {
  return r.red !== void 0;
}, Fb = function(r) {
  return r.hue !== void 0;
};
function ik(r) {
  return tk(r).replace(/(,|\/)/g, " ").split(/ \s*/);
}
var AM = function(r) {
  return function(i) {
    if (typeof i != "string")
      return i;
    for (var o = {}, c = ik(i), h = 0; h < 4; h++)
      o[r[h]] = c[h] !== void 0 ? parseFloat(c[h]) : 1;
    return o;
  };
}, rk = function(r) {
  var i = r.red, o = r.green, c = r.blue, h = r.alpha, m = h === void 0 ? 1 : h;
  return "rgba(" + i + ", " + o + ", " + c + ", " + m + ")";
}, ak = function(r) {
  var i = r.hue, o = r.saturation, c = r.lightness, h = r.alpha, m = h === void 0 ? 1 : h;
  return "hsla(" + i + ", " + o + ", " + c + ", " + m + ")";
}, db = Yr(Yr({}, ug), { transform: function(r) {
  return Math.round(nk(r));
} });
function cS(r, i) {
  return r.startsWith(i) && IM.test(r);
}
var qv = {
  test: function(r) {
    return typeof r == "string" ? cS(r, "rgb") : Wb(r);
  },
  parse: AM(["red", "green", "blue", "alpha"]),
  transform: function(r) {
    var i = r.red, o = r.green, c = r.blue, h = r.alpha, m = h === void 0 ? 1 : h;
    return rk({
      red: db.transform(i),
      green: db.transform(o),
      blue: db.transform(c),
      alpha: Jv(Jh.transform(m))
    });
  }
}, fb = {
  test: function(r) {
    return typeof r == "string" ? cS(r, "hsl") : Fb(r);
  },
  parse: AM(["hue", "saturation", "lightness", "alpha"]),
  transform: function(r) {
    var i = r.hue, o = r.saturation, c = r.lightness, h = r.alpha, m = h === void 0 ? 1 : h;
    return ak({
      hue: Math.round(i),
      saturation: qh.transform(Jv(o)),
      lightness: qh.transform(Jv(c)),
      alpha: Jv(Jh.transform(m))
    });
  }
}, cT = Yr(Yr({}, qv), { test: function(r) {
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
    return typeof r == "string" && IM.test(r) || Wb(r) || Fb(r);
  },
  parse: function(r) {
    return qv.test(r) ? qv.parse(r) : fb.test(r) ? fb.parse(r) : cT.test(r) ? cT.parse(r) : r;
  },
  transform: function(r) {
    return Wb(r) ? qv.transform(r) : Fb(r) ? fb.transform(r) : r;
  }
}, dS = function(r) {
  var i = r.onRead, o = r.onRender, c = r.uncachedValues, h = c === void 0 ? /* @__PURE__ */ new Set() : c, m = r.useCache, y = m === void 0 ? !0 : m;
  return function(g) {
    g === void 0 && (g = {});
    var S = oS(g, []), C = {}, A = [], I = !1;
    function z($, K) {
      $.startsWith("--") && (S.hasCSSVariable = !0);
      var q = C[$];
      C[$] = K, C[$] !== q && (A.indexOf($) === -1 && A.push($), I || (I = !0, qN.render(F.render)));
    }
    var F = {
      get: function($, K) {
        K === void 0 && (K = !1);
        var q = !K && y && !h.has($) && C[$] !== void 0;
        return q ? C[$] : i($, S);
      },
      set: function($, K) {
        if (typeof $ == "string")
          z($, K);
        else
          for (var q in $)
            z(q, $[q]);
        return this;
      },
      render: function($) {
        return $ === void 0 && ($ = !1), (I || $ === !0) && (o(C, S, A), I = !1, A.length = 0), this;
      }
    };
    return F;
  };
}, sk = /([a-z])([A-Z])/g, ok = "$1-$2", cg = function(r) {
  return r.replace(sk, ok).toLowerCase();
}, RM = /* @__PURE__ */ new Map(), fS = /* @__PURE__ */ new Map(), DM = ["Webkit", "Moz", "O", "ms", ""], lk = DM.length, uk = typeof document < "u", hb, NM = function(r, i) {
  return fS.set(r, cg(i));
}, ck = function(r) {
  hb = hb || document.createElement("div");
  for (var i = 0; i < lk; i++) {
    var o = DM[i], c = o === "", h = c ? r : o + r.charAt(0).toUpperCase() + r.slice(1);
    if (h in hb.style || c) {
      if (c && r === "clipPath" && fS.has(r))
        return;
      RM.set(r, h), NM(r, (c ? "" : "-") + cg(h));
    }
  }
}, dk = function(r) {
  return NM(r, r);
}, kM = function(r, i) {
  i === void 0 && (i = !1);
  var o = i ? fS : RM;
  return o.has(r) || (uk ? ck(r) : dk(r)), o.get(r) || r;
}, fk = ["", "X", "Y", "Z"], hk = ["translate", "scale", "rotate", "skew", "transformPerspective"], $b = /* @__PURE__ */ hk.reduce(function(r, i) {
  return fk.reduce(function(o, c) {
    return o.push(i + c), o;
  }, r);
}, ["x", "y", "z"]), pk = /* @__PURE__ */ $b.reduce(function(r, i) {
  return r[i] = !0, r;
}, {});
function hS(r) {
  return pk[r] === !0;
}
function mk(r, i) {
  return $b.indexOf(r) - $b.indexOf(i);
}
var vk = /* @__PURE__ */ new Set(["originX", "originY", "originZ"]);
function gk(r) {
  return vk.has(r);
}
var dT = /* @__PURE__ */ ip(/* @__PURE__ */ ip({}, ug), { transform: Math.round }), yk = {
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
  distance: ut,
  translateX: ut,
  translateY: ut,
  translateZ: ut,
  x: ut,
  y: ut,
  z: ut,
  perspective: ut,
  opacity: Jh,
  originX: uT,
  originY: uT,
  originZ: ut,
  zIndex: dT,
  fillOpacity: Jh,
  strokeOpacity: Jh,
  numOctaves: dT
}, pS = function(r) {
  return yk[r];
}, wk = function(r, i) {
  return i && typeof r == "number" ? i.transform(r) : r;
}, Kh = "scrollLeft", ep = "scrollTop", PM = /* @__PURE__ */ new Set([Kh, ep]), bk = /* @__PURE__ */ new Set([Kh, ep, "transform"]), Sk = {
  x: "translateX",
  y: "translateY",
  z: "translateZ"
};
function _M(r) {
  return typeof r == "function";
}
function xk(r, i, o, c, h, m) {
  m === void 0 && (m = !0);
  var y = "", g = !1;
  o.sort(mk);
  for (var S = o.length, C = 0; C < S; C++) {
    var A = o[C];
    y += (Sk[A] || A) + "(" + i[A] + ") ", g = A === "z" ? !0 : g;
  }
  return !g && h ? y += "translateZ(0)" : y = y.trim(), _M(r.transform) ? y = r.transform(i, c ? "" : y) : m && c && (y = "none"), y;
}
function Ck(r, i, o, c, h, m, y, g) {
  i === void 0 && (i = !0), o === void 0 && (o = {}), c === void 0 && (c = {}), h === void 0 && (h = {}), m === void 0 && (m = []), y === void 0 && (y = !1), g === void 0 && (g = !0);
  var S = !0, C = !1, A = !1;
  for (var I in r) {
    var z = r[I], F = pS(I), $ = wk(z, F);
    hS(I) ? (C = !0, c[I] = $, m.push(I), S && (F.default && z !== F.default || !F.default && z !== 0) && (S = !1)) : gk(I) ? (h[I] = $, A = !0) : (!bk.has(I) || !_M($)) && (o[kM(I, y)] = $);
  }
  return (C || typeof r.transform == "function") && (o.transform = xk(r, c, m, S, i, g)), A && (o.transformOrigin = (h.originX || "50%") + " " + (h.originY || "50%") + " " + (h.originZ || 0)), o;
}
function mS(r) {
  var i = r === void 0 ? {} : r, o = i.enableHardwareAcceleration, c = o === void 0 ? !0 : o, h = i.isDashCase, m = h === void 0 ? !0 : h, y = i.allowTransformNone, g = y === void 0 ? !0 : y, S = {}, C = {}, A = {}, I = [];
  return function(z) {
    return I.length = 0, Ck(z, c, S, C, A, I, m, g), S;
  };
}
function Tk(r, i) {
  var o = i.element, c = i.preparseOutput, h = pS(r);
  if (hS(r))
    return h && h.default || 0;
  if (PM.has(r))
    return o[r];
  var m = window.getComputedStyle(o, null).getPropertyValue(kM(r, !0)) || 0;
  return c && h && h.test(m) && h.parse ? h.parse(m) : m;
}
function Mk(r, i, o) {
  var c = i.element, h = i.buildStyles, m = i.hasCSSVariable;
  if (Object.assign(c.style, h(r)), m)
    for (var y = o.length, g = 0; g < y; g++) {
      var S = o[g];
      S.startsWith("--") && c.style.setProperty(S, r[S]);
    }
  o.indexOf(Kh) !== -1 && (c[Kh] = r[Kh]), o.indexOf(ep) !== -1 && (c[ep] = r[ep]);
}
var Ek = /* @__PURE__ */ dS({
  onRead: Tk,
  onRender: Mk,
  uncachedValues: PM
});
function Ik(r, i) {
  i === void 0 && (i = {});
  var o = i.enableHardwareAcceleration, c = i.allowTransformNone, h = oS(i, ["enableHardwareAcceleration", "allowTransformNone"]);
  return Ek(ip({ element: r, buildStyles: mS({
    enableHardwareAcceleration: o,
    allowTransformNone: c
  }), preparseOutput: !0 }, h));
}
var zM = /* @__PURE__ */ new Set(["baseFrequency", "diffuseConstant", "kernelMatrix", "kernelUnitLength", "keySplines", "keyTimes", "limitingConeAngle", "markerHeight", "markerWidth", "numOctaves", "targetX", "targetY", "surfaceScale", "specularConstant", "specularExponent", "stdDeviation", "tableValues"]), fT = 0.5, OM = function() {
  return {
    style: {}
  };
}, pb = function(r, i) {
  return ut.transform(r * i);
}, Ak = { x: 0, y: 0, width: 0, height: 0 };
function hT(r, i, o) {
  return typeof r == "string" ? r : ut.transform(i + o * r);
}
function Rk(r, i, o) {
  return hT(i, r.x, r.width) + " " + hT(o, r.y, r.height);
}
var LM = {
  enableHardwareAcceleration: !1,
  isDashCase: !1
};
function Dk(r, i, o, c, h, m) {
  i === void 0 && (i = Ak), c === void 0 && (c = mS(LM)), h === void 0 && (h = OM()), m === void 0 && (m = !0);
  var y = r.attrX, g = r.attrY, S = r.originX, C = r.originY, A = r.pathLength, I = r.pathSpacing, z = I === void 0 ? 1 : I, F = r.pathOffset, $ = F === void 0 ? 0 : F, K = oS(r, ["attrX", "attrY", "originX", "originY", "pathLength", "pathSpacing", "pathOffset"]), q = c(K);
  for (var fe in q)
    if (fe === "transform")
      h.style.transform = q[fe];
    else {
      var se = m && !zM.has(fe) ? cg(fe) : fe;
      h[se] = q[fe];
    }
  return (S !== void 0 || C !== void 0 || q.transform) && (h.style.transformOrigin = Rk(i, S !== void 0 ? S : fT, C !== void 0 ? C : fT)), y !== void 0 && (h.x = y), g !== void 0 && (h.y = g), o !== void 0 && A !== void 0 && (h[m ? "stroke-dashoffset" : "strokeDashoffset"] = pb(-$, o), h[m ? "stroke-dasharray" : "strokeDasharray"] = pb(A, o) + " " + pb(z, o)), h;
}
function Nk(r, i, o) {
  o === void 0 && (o = !0);
  var c = OM(), h = mS(LM);
  return function(m) {
    return Dk(m, r, i, h, c, o);
  };
}
var kk = function(r) {
  return typeof r.getBBox == "function" ? r.getBBox() : r.getBoundingClientRect();
}, Pk = function(r) {
  try {
    return kk(r);
  } catch {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
}, _k = function(r) {
  return r.tagName === "path";
}, zk = /* @__PURE__ */ dS({
  onRead: function(r, i) {
    var o = i.element;
    if (r = zM.has(r) ? r : cg(r), hS(r)) {
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
}), Ok = function(r) {
  var i = Pk(r), o = _k(r) && r.getTotalLength ? r.getTotalLength() : void 0;
  return zk({
    element: r,
    buildAttrs: Nk(i, o)
  });
}, Lk = /* @__PURE__ */ dS({
  useCache: !1,
  onRead: function(r) {
    return r === "scrollTop" ? window.pageYOffset : window.pageXOffset;
  },
  onRender: function(r) {
    var i = r.scrollTop, o = i === void 0 ? 0 : i, c = r.scrollLeft, h = c === void 0 ? 0 : c;
    return window.scrollTo(h, o);
  }
}), Qb = /* @__PURE__ */ new WeakMap(), Bk = function(r) {
  return r instanceof HTMLElement || typeof r.click == "function";
}, jk = function(r) {
  return r instanceof SVGElement || "ownerSVGElement" in r;
}, Uk = function(r, i) {
  var o;
  return r === window ? o = Lk(r) : Bk(r) ? o = Ik(r, i) : jk(r) && (o = Ok(r)), Qb.set(r, o), o;
}, Vk = function(r, i) {
  return Qb.has(r) ? Qb.get(r) : Uk(r, i);
};
function Hk(r, i) {
  var o = typeof r == "string" ? document.querySelector(r) : r;
  return Vk(o, i);
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
  for (var S = Object.prototype.hasOwnProperty.bind(o), C = 0; C < y.length; C++) {
    var A = y[C];
    if (!S(A))
      return !1;
    var I = i[A], z = o[A];
    if (m = c ? c.call(h, I, z, A) : void 0, m === !1 || m === void 0 && I !== z)
      return !1;
  }
  return !0;
};
const BM = "!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", Wk = BM.length, pT = Array(20), Td = () => {
  for (let r = 0; r < 20; r++)
    pT[r] = BM.charAt(Math.random() * Wk);
  return pT.join("");
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
var Fk = Object.defineProperty, mb = (typeof require < "u" && require, (r, i, o) => (((c, h, m) => {
  h in c ? Fk(c, h, { enumerable: !0, configurable: !0, writable: !0, value: m }) : c[h] = m;
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
    const h = new up(i(this.value, void 0, c), o), m = this.reaction((y, g, S) => {
      h.setValue(i(y, g, S));
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
function $k(r, i, o, c) {
  let h = r.map((y) => y.value);
  const m = new up(i(h, void 0, c), o);
  return r.forEach((y, g) => {
    const S = y.reaction((C, A, I) => {
      const z = h.slice();
      z[g] = C;
      const F = h;
      h = z, m.setValue(i(z, F, I), I);
    });
    m.addBeforeDestroy(S);
  }), m;
}
function jM(r, i) {
  Object.keys(i).forEach((o) => {
    Qk(r, o, i[o]);
  });
}
function Qk(r, i, o) {
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
  return { bindSideEffect: i, combine: (o, c, h, m) => i($k(o, c, h, m)), createVal: (o, c) => i(new up(o, c)) };
}
var gS = /* @__PURE__ */ ((r) => (r.Light = "light", r.Dark = "dark", r.Auto = "auto", r))(gS || {}), nn = /* @__PURE__ */ ((r) => (r.Normal = "normal", r.Minimized = "minimized", r.Maximized = "maximized", r))(nn || {}), Xn = /* @__PURE__ */ ((r) => (r.DarkMode = "dark_mode", r.PrefersColorScheme = "prefers_color_scheme", r.Close = "close", r.Focus = "focus", r.Blur = "blur", r.Move = "move", r.Resize = "resize", r.IntrinsicMove = "intrinsic_move", r.IntrinsicResize = "intrinsic_resize", r.VisualResize = "visual_resize", r.ZIndex = "z_index", r.State = "state", r.Minimized = "minimized", r.Maximized = "maximized", r.Readonly = "readonly", r.Destroyed = "destroyed", r))(Xn || {}), Ki = /* @__PURE__ */ ((r) => (r.Close = "close", r.Maximize = "maximize", r.Minimize = "minimize", r))(Ki || {}), ws = /* @__PURE__ */ ((r) => (r.North = "n", r.South = "s", r.West = "w", r.East = "e", r.NorthWest = "nw", r.NorthEast = "ne", r.SouthEast = "se", r.SouthWest = "sw", r))(ws || {});
const vb = "dh";
function Xi(r, i, o) {
  return Math.min(Math.max(r, i), o);
}
function Ed(r) {
  r.stopPropagation(), r.cancelable && r.preventDefault();
}
let Zk = 1;
function Yk() {
  return `New Box ${Zk++}`;
}
function Gk(r) {
  return Boolean(r);
}
function Vv(r) {
  return !r;
}
function mT(r) {
  return r.reduce((i, o) => (i.includes(o) || i.push(o), i), []);
}
function Vh(r, i) {
  const o = r.indexOf(i);
  if (o < 0)
    return r;
  const c = [...r];
  return c.splice(o, 1), c;
}
function Xk(r, i, o) {
  const c = new Set(i), h = new Set(o);
  return r.filter((m) => !c.has(m) && !h.has(m));
}
function vT(r) {
  return r.touches ? r.touches[0] : r;
}
function Jk() {
  return Date.now().toString().slice(6) + Math.random().toString().slice(2, 8);
}
class UM {
  constructor({
    readonly: i = !1,
    title: o,
    buttons: c,
    onEvent: h,
    onDragStart: m,
    namespace: y = "telebox",
    state: g = nn.Normal
  } = {}) {
    this.$btns = [], this.sideEffect = new ap(), this.lastTitleBarClick = {
      timestamp: 0,
      clientX: -100,
      clientY: -100
    }, this.handleTitleBarClick = (S) => {
      var C;
      if (this.readonly || S.button !== 0 || (C = S.target.dataset) != null && C.teleTitleBarNoDblClick)
        return;
      Ed(S);
      const A = Date.now();
      A - this.lastTitleBarClick.timestamp <= 500 ? Math.abs(S.clientX - this.lastTitleBarClick.clientX) <= 5 && Math.abs(S.clientY - this.lastTitleBarClick.clientY) <= 5 && this.onEvent && this.onEvent({ type: Ki.Maximize }) : this.onDragStart && this.onDragStart(S), this.lastTitleBarClick.timestamp = A, this.lastTitleBarClick.clientX = S.clientX, this.lastTitleBarClick.clientY = S.clientY;
    }, this.lastTitleBarTouch = {
      timestamp: 0,
      clientX: -100,
      clientY: -100
    }, this.handleTitleBarTouch = (S) => {
      var C;
      if (this.readonly || (C = S.target.dataset) != null && C.teleTitleBarNoDblClick)
        return;
      Ed(S);
      const A = Date.now(), {
        clientX: I = this.lastTitleBarTouch.clientX + 100,
        clientY: z = this.lastTitleBarTouch.clientY + 100
      } = S.touches[0] || {};
      A - this.lastTitleBarTouch.timestamp <= 500 ? Math.abs(I - this.lastTitleBarTouch.clientX) <= 10 && Math.abs(z - this.lastTitleBarTouch.clientY) <= 10 && this.onEvent && this.onEvent({ type: Ki.Maximize }) : this.onDragStart && this.onDragStart(S), this.lastTitleBarTouch.timestamp = A, this.lastTitleBarTouch.clientX = I, this.lastTitleBarTouch.clientY = z;
    }, this.readonly = i, this.onEvent = h, this.onDragStart = m, this.namespace = y, this.title = o, this.state = g, this.buttons = c || [
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
class qk {
  constructor({
    id: i = Jk(),
    title: o = Yk(),
    prefersColorScheme: c = gS.Light,
    darkMode: h,
    visible: m = !0,
    width: y = 0.5,
    height: g = 0.5,
    minWidth: S = 0,
    minHeight: C = 0,
    x: A = 0.1,
    y: I = 0.1,
    minimized: z = !1,
    maximized: F = !1,
    readonly: $ = !1,
    resizable: K = !0,
    draggable: q = !0,
    fence: fe = !0,
    fixRatio: se = !1,
    focus: Z = !1,
    zIndex: ce = 100,
    namespace: oe = "telebox",
    titleBar: Oe,
    content: $e,
    footer: je,
    styles: Y,
    containerRect: he = {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight
    },
    collectorRect: Ee,
    fixed: ie = !1,
    addObserver: ct
  } = {}) {
    this._renderSideEffect = new ap(), this.handleTrackStart = (Ne) => {
      var st;
      return (st = this._handleTrackStart) == null ? void 0 : st.call(this, Ne);
    }, this._sideEffect = new ap(), this._valSideEffectBinder = vS(this._sideEffect);
    const { combine: _e, createVal: ue } = this._valSideEffectBinder;
    this.addObserver = ct || gb, this.id = i, this.namespace = oe, this.events = new Vb(), this._delegateEvents = new Vb(), this.scale = ue(1), this.fixed = ie;
    const Qe = ue(c);
    Qe.reaction((Ne, st, He) => {
      He || this.events.emit(Xn.PrefersColorScheme, Ne);
    });
    const be = ue(Boolean(h));
    h == null && Qe.subscribe((Ne, st, He) => {
      this._sideEffect.add(() => {
        if (Ne === "auto") {
          const jt = window.matchMedia("(prefers-color-scheme: dark)");
          if (jt) {
            be.setValue(jt.matches, He);
            const bn = (ci) => {
              be.setValue(ci.matches, He);
            };
            return jt.addListener(bn), () => jt.removeListener(bn);
          } else
            return gb;
        } else
          return be.setValue(Ne === "dark", He), gb;
      }, "prefers-color-scheme");
    }), be.reaction((Ne, st, He) => {
      He || this.events.emit(Xn.DarkMode, Ne);
    });
    const Ve = ue(he, ys), Re = ue(Ee, ys), Fe = ue(o);
    Fe.reaction((Ne, st, He) => {
      He || this.titleBar.setTitle(Ne);
    });
    const Tt = ue(m);
    Tt.reaction((Ne, st, He) => {
      !He && !Ne && this.events.emit(Xn.Close);
    });
    const Bt = ue($);
    Bt.reaction((Ne, st, He) => {
      He || this.events.emit(Xn.Readonly, Ne);
    });
    const Ye = ue(K), re = ue(q), D = ue(fe), B = ue(se), ee = ue(ce);
    ee.reaction((Ne, st, He) => {
      He || this.events.emit(Xn.ZIndex, Ne);
    });
    const xe = ue(Z);
    xe.reaction((Ne, st, He) => {
      He || this.events.emit(Ne ? Xn.Focus : Xn.Blur);
    });
    const ge = ue(z);
    ge.reaction((Ne, st, He) => {
      He || this.events.emit(Xn.Minimized, Ne);
    });
    const it = ue(F);
    it.reaction((Ne, st, He) => {
      He || this.events.emit(Xn.Maximized, Ne);
    });
    const Ge = _e(
      [ge, it],
      ([Ne, st]) => Ne ? nn.Minimized : st ? nn.Maximized : nn.Normal
    );
    Ge.reaction((Ne, st, He) => {
      He || this.events.emit(Xn.State, Ne);
    });
    const Le = ue(
      {
        width: Xi(S, 0, 1),
        height: Xi(C, 0, 1)
      },
      ys
    ), dt = ue(
      {
        width: Xi(y, Le.value.width, 1),
        height: Xi(g, Le.value.height, 1)
      },
      ys
    );
    Le.reaction((Ne, st, He) => {
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
    const gt = _e(
      [dt, it],
      ([Ne, st]) => st ? { width: 1, height: 1 } : Ne,
      ys
    );
    gt.reaction((Ne, st, He) => {
      He || this.events.emit(Xn.Resize, Ne);
    });
    const Zt = _e(
      [gt, ge, Ve, Re],
      ([Ne, st, He, jt]) => st && jt ? {
        width: jt.width / Ne.width / He.width,
        height: jt.height / Ne.height / He.height
      } : Ne,
      ys
    );
    Zt.reaction((Ne, st, He) => {
      He || this.events.emit(Xn.VisualResize, Ne);
    });
    const Mt = ue({ x: Xi(A, 0, 1), y: Xi(I, 0, 1) }, ys);
    Mt.reaction((Ne, st, He) => {
      He || this.events.emit(Xn.IntrinsicMove, Ne);
    });
    const wn = _e(
      [
        Mt,
        dt,
        Ve,
        Re,
        ge,
        it
      ],
      ([
        Ne,
        st,
        He,
        jt,
        bn,
        ci
      ]) => bn && jt ? ci ? {
        x: (jt.x + jt.width / 2) / He.width - 1 / 2,
        y: (jt.y + jt.height / 2) / He.height - 1 / 2
      } : {
        x: (jt.x + jt.width / 2) / He.width - st.width / 2,
        y: (jt.y + jt.height / 2) / He.height - st.height / 2
      } : ci ? { x: 0, y: 0 } : Ne,
      ys
    );
    wn.reaction((Ne, st, He) => {
      He || this.events.emit(Xn.Move, Ne);
    }), this.titleBar = Oe || new UM({
      readonly: Bt.value,
      title: Fe.value,
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
    const Wt = ue($e), Ui = ue(je), Ci = ue(Y);
    jM(this, {
      prefersColorScheme: Qe,
      darkMode: be,
      containerRect: Ve,
      collectorRect: Re,
      title: Fe,
      visible: Tt,
      readonly: Bt,
      resizable: Ye,
      draggable: re,
      fence: D,
      fixRatio: B,
      focus: xe,
      zIndex: ee,
      minimized: ge,
      maximized: it,
      $userContent: Wt,
      $userFooter: Ui,
      $userStyles: Ci
    }), this._state$ = Ge, this._minSize$ = Le, this._size$ = gt, this._intrinsicSize$ = dt, this._visualSize$ = Zt, this._coord$ = wn, this._intrinsicCoord$ = Mt, this.fixRatio && this.transform(
      wn.value.x,
      wn.value.y,
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
    const o = (I, z, F, $ = Gk) => this._renderSideEffect.add(() => {
      const K = this.wrapClassName(F);
      return z.subscribe((q) => {
        I.classList.toggle(K, $(q));
      });
    });
    o(this.$box, this._readonly$, "readonly"), o(this.$box, this._draggable$, "no-drag", Vv), o(this.$box, this._resizable$, "no-resize", Vv), o(this.$box, this._focus$, "blur", Vv), o(this.$box, this._darkMode$, "color-scheme-dark"), o(this.$box, this._darkMode$, "color-scheme-light", Vv), this._renderSideEffect.add(() => {
      const I = this.wrapClassName("minimized"), z = this.wrapClassName("maximized"), F = "box-maximized-timer";
      return this._state$.subscribe(($) => {
        this.$box.classList.toggle(I, $ === nn.Minimized), $ === nn.Maximized ? (this._renderSideEffect.flush(F), this.$box.classList.toggle(z, !0)) : this._renderSideEffect.setTimeout(
          () => {
            this.$box.classList.toggle(z, !1);
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
    const c = Hk(this.$box);
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
      ([I, z, F, $, K]) => {
        const q = z.width * $.width, fe = z.height * $.height;
        return {
          width: q + (F && K ? 1 : 0),
          height: fe + (F && K ? 1 : 0),
          x: I.x * $.width,
          y: I.y * $.height,
          scaleX: 1,
          scaleY: 1
        };
      },
      ys
    ).subscribe((I) => {
      c.set(I);
    }), c.set({ x: h, y: m });
    const y = document.createElement("div");
    y.className = this.wrapClassName("box-main"), this.$box.appendChild(y);
    const g = document.createElement("div");
    g.className = this.wrapClassName("titlebar-wrap"), g.appendChild(this.titleBar.render()), this.$titleBar = g;
    const S = document.createElement("div");
    S.className = this.wrapClassName("content-wrap") + " tele-fancy-scrollbar";
    const C = document.createElement("div");
    C.className = this.wrapClassName("content") + " tele-fancy-scrollbar", this.$content = C, this._renderSideEffect.add(() => {
      let I;
      return this._$userStyles$.subscribe((z) => {
        I && I.remove(), I = z, z && S.appendChild(z);
      });
    }), this._renderSideEffect.add(() => {
      let I;
      return this._$userContent$.subscribe((z) => {
        I && I.remove(), I = z, z && C.appendChild(z);
      });
    }), S.appendChild(C);
    const A = document.createElement("div");
    return A.className = this.wrapClassName("footer-wrap"), this.$footer = A, this._renderSideEffect.add(() => {
      let I;
      return this._$userFooter$.subscribe((z) => {
        I && I.remove(), I = z, z && A.appendChild(z);
      });
    }), this._state$.reaction((I) => {
      A.classList.toggle(this.wrapClassName("footer-hide"), I == nn.Maximized);
    }), y.appendChild(g), y.appendChild(S), y.appendChild(A), this.$contentWrap = S, this.addObserver(S, (I) => {
      const z = I.find((F) => F.target == S);
      (z == null ? void 0 : z.target) == S && (C.style.width = z.contentRect.width * this.scale.value + "px", C.style.height = z.contentRect.height * this.scale.value + "px");
    }), this.scale.reaction((I) => {
      C.style.width = S.getBoundingClientRect().width * I + "px", C.style.height = S.getBoundingClientRect().height * I + "px";
    }), this._renderResizeHandlers(), this.$box;
  }
  _renderResizeHandlers() {
    const i = document.createElement("div");
    i.className = this.wrapClassName("resize-handles"), Object.values(ws).forEach((K) => {
      const q = document.createElement("div");
      q.className = this.wrapClassName(K) + " " + this.wrapClassName("resize-handle"), q.dataset.teleBoxHandle = K, i.appendChild(q);
    }), this.$box.appendChild(i);
    const o = "handle-tracking-listener", c = this.wrapClassName("transforming");
    let h, m = 0, y = 0, g = 0, S = 0, C = 0, A = 0, I;
    const z = (K) => {
      if (this.state !== nn.Normal)
        return;
      Ed(K);
      let { pageX: q, pageY: fe } = vT(K);
      fe < 0 && (fe = 0);
      const se = (q - C) / this.containerRect.width, Z = (fe - A) / this.containerRect.height;
      switch (I) {
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
            const ce = 20 / this.containerRect.width, oe = 20 / this.containerRect.height;
            this.move(
              Xi(
                m + se,
                ce - this.width,
                1 - ce
              ),
              Xi(y + Z, 0, 1 - oe)
            );
          }
          break;
        }
      }
    }, F = (K) => {
      I = void 0, h && (Ed(K), this.$box.classList.toggle(c, !1), this._sideEffect.flush(o), h.remove());
    }, $ = (K) => {
      var q;
      if (this.readonly || K.button != null && K.button !== 0 || !this.draggable || I || this.state !== nn.Normal)
        return;
      const fe = K.target;
      if ((q = fe.dataset) != null && q.teleBoxHandle) {
        Ed(K), m = this.x, y = this.y, g = this.width, S = this.height, { pageX: C, pageY: A } = vT(K), I = fe.dataset.teleBoxHandle, h || (h = document.createElement("div"));
        const se = I ? this.wrapClassName(`cursor-${I}`) : "";
        h.className = this.wrapClassName(`track-mask${se ? ` ${se}` : ""}`), this.$box.appendChild(h), this.$box.classList.add(c), this._sideEffect.add(() => (window.addEventListener("mousemove", z), window.addEventListener("touchmove", z, {
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
function gb() {
}
var Kk = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzFfNDQyNDQpIj4KPGcgZmlsdGVyPSJ1cmwoI2ZpbHRlcjBfZF8xXzQ0MjQ0KSI+CjxwYXRoIGQ9Ik0xNC4wMDAyIDE2LjE5NTNDMTMuODI0NyAxNi4xOTUzIDEzLjY1MjIgMTYuMTQ5MSAxMy41MDAyIDE2LjA2MTVMNC41MDAxNyAxMC44NjQzQzQuMDIxNzggMTAuNTg3OSAzLjg1Nzk2IDkuOTc2MTIgNC4xMzQyOCA5LjQ5NzczQzQuMjIyMDQgOS4zNDU3OSA0LjM0ODIzIDkuMjE5NiA0LjUwMDE3IDkuMTMxODRMMTMuNTAwMiAzLjkzODQ4QzEzLjgwOTggMy43NjA3NCAxNC4xOTA1IDMuNzYwNzQgMTQuNTAwMiAzLjkzODQ4TDIzLjUwMDIgOS4xMzE4NEMyMy45Nzg2IDkuNDA4MTYgMjQuMTQyNCAxMC4wMiAyMy44NjYxIDEwLjQ5ODRDMjMuNzc4MyAxMC42NTAzIDIzLjY1MjEgMTAuNzc2NSAyMy41MDAyIDEwLjg2NDNMMTQuNTAwMiAxNi4wNjE1QzE0LjM0ODEgMTYuMTQ5MSAxNC4xNzU3IDE2LjE5NTMgMTQuMDAwMiAxNi4xOTUzWiIgZmlsbD0id2hpdGUiLz4KPC9nPgo8ZyBmaWx0ZXI9InVybCgjZmlsdGVyMV9kXzFfNDQyNDQpIj4KPHBhdGggZD0iTTIzLjUwMDIgMTMuMTMxOUwyMS41MzYxIDExLjk5ODVMMTQuNTAwMiAxNi4wNjE2QzE0LjE5MDcgMTYuMjQgMTMuODA5NiAxNi4yNCAxMy41MDAyIDE2LjA2MTZMNi40NjQyOCAxMS45OTg1TDQuNTAwMTcgMTMuMTMxOUM0LjAyMTc4IDEzLjQwODIgMy44NTc5NiAxNC4wMiA0LjEzNDI4IDE0LjQ5ODRDNC4yMjIwNCAxNC42NTA0IDQuMzQ4MjMgMTQuNzc2NiA0LjUwMDE3IDE0Ljg2NDNMMTMuNTAwMiAyMC4wNjE2QzEzLjgwOTYgMjAuMjQgMTQuMTkwNyAyMC4yNCAxNC41MDAyIDIwLjA2MTZMMjMuNTAwMiAxNC44NjQzQzIzLjk3ODYgMTQuNTg4IDI0LjE0MjQgMTMuOTc2MiAyMy44NjYxIDEzLjQ5NzhDMjMuNzc4MyAxMy4zNDU5IDIzLjY1MjEgMTMuMjE5NyAyMy41MDAyIDEzLjEzMTlaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjgiIHNoYXBlLXJlbmRlcmluZz0iY3Jpc3BFZGdlcyIvPgo8L2c+CjxnIGZpbHRlcj0idXJsKCNmaWx0ZXIyX2RfMV80NDI0NCkiPgo8cGF0aCBkPSJNMjMuNTAwMiAxNy4xMzE5TDIxLjUzNjEgMTUuOTk4NUwxNC41MDAyIDIwLjA2MTZDMTQuMTkwNyAyMC4yNCAxMy44MDk2IDIwLjI0IDEzLjUwMDIgMjAuMDYxNkw2LjQ2NDI4IDE1Ljk5ODVMNC41MDAxNyAxNy4xMzE5QzQuMDIxNzggMTcuNDA4MiAzLjg1Nzk2IDE4LjAyIDQuMTM0MjggMTguNDk4NEM0LjIyMjA0IDE4LjY1MDQgNC4zNDgyMyAxOC43NzY2IDQuNTAwMTcgMTguODY0M0wxMy41MDAyIDI0LjA2MTZDMTMuODA5NiAyNC4yNCAxNC4xOTA3IDI0LjI0IDE0LjUwMDIgMjQuMDYxNkwyMy41MDAyIDE4Ljg2NDNDMjMuOTc4NiAxOC41ODggMjQuMTQyNCAxNy45NzYyIDIzLjg2NjEgMTcuNDk3OEMyMy43NzgzIDE3LjM0NTkgMjMuNjUyMSAxNy4yMTk3IDIzLjUwMDIgMTcuMTMxOVoiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuNiIgc2hhcGUtcmVuZGVyaW5nPSJjcmlzcEVkZ2VzIi8+CjwvZz4KPC9nPgo8ZGVmcz4KPGZpbHRlciBpZD0iZmlsdGVyMF9kXzFfNDQyNDQiIHg9IjMiIHk9IjMuODA1MTgiIHdpZHRoPSIyMiIgaGVpZ2h0PSIxNC4zOTAxIiBmaWx0ZXJVbml0cz0idXNlclNwYWNlT25Vc2UiIGNvbG9yLWludGVycG9sYXRpb24tZmlsdGVycz0ic1JHQiI+CjxmZUZsb29kIGZsb29kLW9wYWNpdHk9IjAiIHJlc3VsdD0iQmFja2dyb3VuZEltYWdlRml4Ii8+CjxmZUNvbG9yTWF0cml4IGluPSJTb3VyY2VBbHBoYSIgdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDEyNyAwIiByZXN1bHQ9ImhhcmRBbHBoYSIvPgo8ZmVPZmZzZXQgZHk9IjEiLz4KPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMC41Ii8+CjxmZUNvbXBvc2l0ZSBpbjI9ImhhcmRBbHBoYSIgb3BlcmF0b3I9Im91dCIvPgo8ZmVDb2xvck1hdHJpeCB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMCAwIDAgMCAwLjU1Mjk0MSAwIDAgMCAwIDAuNTYwNzg0IDAgMCAwIDAgMC42NTA5OCAwIDAgMCAwLjE1IDAiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbjI9IkJhY2tncm91bmRJbWFnZUZpeCIgcmVzdWx0PSJlZmZlY3QxX2Ryb3BTaGFkb3dfMV80NDI0NCIvPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluPSJTb3VyY2VHcmFwaGljIiBpbjI9ImVmZmVjdDFfZHJvcFNoYWRvd18xXzQ0MjQ0IiByZXN1bHQ9InNoYXBlIi8+CjwvZmlsdGVyPgo8ZmlsdGVyIGlkPSJmaWx0ZXIxX2RfMV80NDI0NCIgeD0iMyIgeT0iMTEuOTk4NSIgd2lkdGg9IjIyIiBoZWlnaHQ9IjEwLjE5NjgiIGZpbHRlclVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj4KPGZlRmxvb2QgZmxvb2Qtb3BhY2l0eT0iMCIgcmVzdWx0PSJCYWNrZ3JvdW5kSW1hZ2VGaXgiLz4KPGZlQ29sb3JNYXRyaXggaW49IlNvdXJjZUFscGhhIiB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMTI3IDAiIHJlc3VsdD0iaGFyZEFscGhhIi8+CjxmZU9mZnNldCBkeT0iMSIvPgo8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIwLjUiLz4KPGZlQ29tcG9zaXRlIGluMj0iaGFyZEFscGhhIiBvcGVyYXRvcj0ib3V0Ii8+CjxmZUNvbG9yTWF0cml4IHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAuNTUyOTQxIDAgMCAwIDAgMC41NjA3ODQgMCAwIDAgMCAwLjY1MDk4IDAgMCAwIDAuMTUgMCIvPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluMj0iQmFja2dyb3VuZEltYWdlRml4IiByZXN1bHQ9ImVmZmVjdDFfZHJvcFNoYWRvd18xXzQ0MjQ0Ii8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0iZWZmZWN0MV9kcm9wU2hhZG93XzFfNDQyNDQiIHJlc3VsdD0ic2hhcGUiLz4KPC9maWx0ZXI+CjxmaWx0ZXIgaWQ9ImZpbHRlcjJfZF8xXzQ0MjQ0IiB4PSIzIiB5PSIxNS45OTg1IiB3aWR0aD0iMjIiIGhlaWdodD0iMTAuMTk2OCIgZmlsdGVyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiPgo8ZmVGbG9vZCBmbG9vZC1vcGFjaXR5PSIwIiByZXN1bHQ9IkJhY2tncm91bmRJbWFnZUZpeCIvPgo8ZmVDb2xvck1hdHJpeCBpbj0iU291cmNlQWxwaGEiIHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAxMjcgMCIgcmVzdWx0PSJoYXJkQWxwaGEiLz4KPGZlT2Zmc2V0IGR5PSIxIi8+CjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjAuNSIvPgo8ZmVDb21wb3NpdGUgaW4yPSJoYXJkQWxwaGEiIG9wZXJhdG9yPSJvdXQiLz4KPGZlQ29sb3JNYXRyaXggdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAgMCAwIDAgMC41NTI5NDEgMCAwIDAgMCAwLjU2MDc4NCAwIDAgMCAwIDAuNjUwOTggMCAwIDAgMC4xNSAwIi8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW4yPSJCYWNrZ3JvdW5kSW1hZ2VGaXgiIHJlc3VsdD0iZWZmZWN0MV9kcm9wU2hhZG93XzFfNDQyNDQiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJlZmZlY3QxX2Ryb3BTaGFkb3dfMV80NDI0NCIgcmVzdWx0PSJzaGFwZSIvPgo8L2ZpbHRlcj4KPGNsaXBQYXRoIGlkPSJjbGlwMF8xXzQ0MjQ0Ij4KPHJlY3Qgd2lkdGg9IjI4IiBoZWlnaHQ9IjI4IiBmaWxsPSJ3aGl0ZSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo=";
let Hh, Wh;
function eP(r, i = !1) {
  Hh ? i ? Wh == null || Wh.push(r) : Hh.push(r) : (Hh = i ? [] : [r], Wh = i ? [r] : [], Promise.resolve().then(() => {
    const o = Hh, c = Wh;
    Hh = void 0, Wh = void 0, c == null || c.forEach((h) => h()), o == null || o.forEach((h) => h());
  }));
}
function tP(r) {
  const i = r.cloneNode(!0);
  i.style.position = "absolute", i.style.top = "-99999px", i.style.float = "none", i.style.visibility = "hidden", i.style.display = "block", document.body.appendChild(i);
  const o = i.getBoundingClientRect();
  return document.body.removeChild(i), { height: o.height, width: o.width };
}
class nP {
  constructor({
    visible: i = !0,
    readonly: o = !1,
    darkMode: c = !1,
    namespace: h = "telebox",
    styles: m = {},
    onClick: y,
    minimizedBoxes: g = [],
    boxes: S = []
  } = {}) {
    this.handleCollectorClick = () => {
      console.log(this.readonly), !this._readonly && this.onClick && this.popupVisible$.setValue(!this.popupVisible$.value);
    }, this._sideEffect = new ap();
    const { createVal: C } = vS(this._sideEffect);
    this._visible = i, this._readonly = o, this._darkMode = c, this.namespace = h, this.styles = m, this.minimizedBoxes = g, this.boxes = S, this.onClick = y, this.popupVisible$ = C(!1), this.popupVisible$.reaction((I) => {
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
    console.log("collector", i);
    debugger;
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
    return this.$collector || (this.$collector = document.createElement("button"), this.$collector.className = this.wrapClassName("collector"), this.$collector.style.backgroundImage = `url('${Kk}')`, this.wrp$ = document.createElement("div"), this.count$ = document.createElement("div"), this.wrp$.className = this.wrapClassName("collector-wrp"), this.count$.className = this.wrapClassName("collector-count"), this.wrp$.appendChild(this.count$), this.wrp$.appendChild(this.$collector), this.$collector.addEventListener("click", this.handleCollectorClick), this._visible && (this.$collector.classList.add(this.wrapClassName("collector-visible")), this.wrp$.classList.toggle(this.wrapClassName("collector-visible")), this.renderTitles()), this._readonly && this.$collector.classList.add(this.wrapClassName("collector-readonly")), this.$collector.classList.add(
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
        var A, I, z, F;
        const $ = C.target;
        (I = (A = $.dataset) == null ? void 0 : A.teleBoxID) != null && I.length && ((F = this.onClick) == null || F.call(this, (z = $.dataset) == null ? void 0 : z.teleBoxID));
      },
      {},
      "telebox-collector-titles-content-click"
    )), y.innerHTML = "";
    const g = (i = this.boxes) == null ? void 0 : i.filter((C) => {
      var A;
      return (A = this.minimizedBoxes) == null ? void 0 : A.includes(C.id);
    }).map((C) => {
      const A = document.createElement("button");
      return A.className = this.wrapClassName("collector-titles-tab"), A.textContent = C.title, A.dataset.teleBoxID = C.id, A.dataset.teleTitleBarNoDblClick = "true", y.appendChild(A), C._title$.reaction((I) => A.textContent = I);
    });
    this._sideEffect.addDisposer(
      () => g == null ? void 0 : g.forEach((C) => C()),
      "min-popup-render-tab-titles"
    );
    const S = (o = this.wrp$) == null ? void 0 : o.querySelector(
      `.${this.wrapClassName("collector-titles")}`
    );
    return S ? (h = this.wrp$) == null || h.replaceChild(this.$titles, S) : (c = this.wrp$) == null || c.appendChild(this.$titles), eP(() => {
      var C, A;
      if (!this.$titles || !this.wrp$ || !this.root)
        return;
      const I = (C = this.wrp$) == null ? void 0 : C.getBoundingClientRect(), z = (A = this.root) == null ? void 0 : A.getBoundingClientRect(), F = tP(this.$titles), $ = I.top - z.top > F.height, K = I.x - z.x > F.width / 2 - I.width / 2, q = -F.height - 10;
      let fe = -(F.width / 2 - I.width / 2);
      if (!$) {
        const se = I.top > 60 ? I.top : 60;
        this.$titles.style.height = `${se}px`;
      }
      K || (fe = -(I.x - z.x - 4)), this.$titles.style.top = `${q}px`, this.$titles.style.left = `${fe}px`;
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
function rP() {
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
class aP {
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
    minimizedBoxes: S = [],
    maximizedBoxes: C = []
  } = {}) {
    this.events = new Vb(), this._sideEffect = new ap();
    const { combine: A, createVal: I } = vS(this._sideEffect);
    this.callbackManager = rP(), this.sizeObserver = new ResizeObserver(this.callbackManager.runCallbacks), this.elementObserverMap = /* @__PURE__ */ new Map(), this.root = i, this.namespace = y, this.boxes$ = I([]), this.topBox$ = this.boxes$.derive((Y) => {
      if (Y.length > 0)
        return Y.reduce(
          (Ee, ie) => Ee.zIndex > ie.zIndex ? Ee : ie
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
    $.reaction((Y, he, Ee) => {
      this.boxes.forEach((ie) => ie.setPrefersColorScheme(Y, Ee)), Ee || this.events.emit(Gn.PrefersColorScheme, Y);
    }), this._darkMode$ = A(
      [F, $],
      ([Y, he]) => he === "auto" ? Y : he === "dark"
    ), this._darkMode$.reaction((Y, he, Ee) => {
      this.boxes.forEach((ie) => ie.setDarkMode(Y, Ee)), Ee || this.events.emit(Gn.DarkMode, Y);
    });
    const K = I(g);
    K.reaction((Y, he, Ee) => {
      this.boxes.forEach((ie) => ie.setReadonly(Y, Ee));
    }), this.maximizedBoxes$ = I(C), this.minimizedBoxes$ = I(S), this.maximizedBoxes$.reaction((Y, he, Ee) => {
      this.boxes.forEach((ct) => ct.setMaximized(Y.includes(ct.id), Ee));
      const ie = Y.filter((ct) => !this.minimizedBoxes$.value.includes(ct));
      this.maxTitleBar.setState(ie.length > 0 ? nn.Maximized : nn.Normal), this.maxTitleBar.setMaximizedBoxes(Y), Ee || this.events.emit(Gn.Maximized, Y);
    });
    const q = A(
      [this.minimizedBoxes$, this.maximizedBoxes$],
      ([Y, he]) => Y.length ? nn.Minimized : he.length ? nn.Maximized : nn.Normal
    );
    q.reaction((Y, he, Ee) => {
      this.maxTitleBar.setState(Y), Ee || this.events.emit(Gn.State, Y);
    });
    const fe = I(c);
    fe.subscribe((Y, he, Ee) => {
      this.boxes.forEach((ie) => ie.setFence(Y, Ee));
    });
    const se = I(h, ys);
    se.reaction((Y, he, Ee) => {
      this.boxes.forEach((ie) => ie.setContainerRect(Y, Ee)), this.maxTitleBar.setContainerRect(Y);
    });
    const Z = I(
      m === null ? null : m || new nP({
        visible: this.minimizedBoxes$.value.length > 0,
        readonly: K.value,
        namespace: y,
        minimizedBoxes: this.minimizedBoxes$.value,
        boxes: this.boxes$.value
      }).mount(i)
    );
    Z.subscribe((Y) => {
      Y && (Y.setVisible(this.minimizedBoxes$.value.length > 0), Y.setReadonly(K.value), Y.setDarkMode(this._darkMode$.value), this._sideEffect.add(() => (Y.onClick = (he) => {
        K.value || this.setMinimizedBoxes(
          Vh(
            this.minimizedBoxes$.value.filter(Boolean),
            he
          )
        );
      }, () => Y.destroy()), "collect-onClick"));
    }), K.subscribe((Y) => {
      var he;
      return (he = Z.value) == null ? void 0 : he.setReadonly(Y);
    }), this._darkMode$.subscribe((Y) => {
      var he;
      (he = Z.value) == null || he.setDarkMode(Y);
    });
    const ce = () => {
      var Y;
      if ((Y = Z.value) != null && Y.$collector) {
        const { x: he, y: Ee, width: ie, height: ct } = Z.value.$collector.getBoundingClientRect(), _e = this.root.getBoundingClientRect();
        return {
          x: he - _e.x,
          y: Ee - _e.y,
          width: ie,
          height: ct
        };
      }
    }, oe = I(this.minimizedBoxes$.value.length > 0 ? ce() : void 0);
    oe.subscribe((Y, he, Ee) => {
      this.boxes.forEach((ie) => {
        ie.setCollectorRect(Y, Ee);
      });
    }), this.minimizedBoxes$.reaction((Y, he, Ee) => {
      var ie, ct, _e;
      this.boxes.forEach((be) => be.setMinimized(Y.includes(be.id), Ee));
      const ue = this.maximizedBoxes$.value.filter((be) => !Y.includes(be));
      this.maxTitleBar.setState(ue.length > 0 ? nn.Maximized : nn.Normal), this.maxTitleBar.setMinimizedBoxes(Y);
      const Qe = Y.length > 0;
      (ie = Z.value) == null || ie.setVisible(Qe), (ct = this.collector) == null || ct.setMinimizedBoxes(Y), Qe && (_e = Z.value) != null && _e.$collector && oe.setValue(ce()), Ee || this.events.emit(Gn.Minimized, Y);
    });
    const Oe = this.wrapClassName("titlebar-icon-close"), $e = (Y) => {
      var he;
      if (K.value)
        return;
      const Ee = Y.target;
      if (!!Ee.tagName)
        for (let ie = Ee; ie; ie = ie.parentElement) {
          if (ie.classList && ie.classList.contains(Oe))
            return;
          const ct = (he = ie.dataset) == null ? void 0 : he.teleBoxID;
          if (ct) {
            const _e = this.getBox(ct);
            if (_e) {
              this.focusBox(_e), this.makeBoxTop(_e);
              return;
            }
          }
        }
    };
    this._sideEffect.addEventListener(window, "mousedown", $e, !0), this._sideEffect.addEventListener(window, "touchstart", $e, !0), this.maxTitleBar = new iP({
      darkMode: this.darkMode,
      readonly: K.value,
      namespace: this.namespace,
      state: q.value,
      boxes: this.boxes$.value,
      containerRect: se.value,
      maximizedBoxes$: this.maximizedBoxes$.value,
      minimizedBoxes$: this.minimizedBoxes$.value,
      onEvent: (Y) => {
        var he, Ee, ie, ct, _e, ue;
        switch (Y.type) {
          case Ki.Maximize: {
            if ((he = this.maxTitleBar.focusedBox) != null && he.id) {
              const Qe = (Ee = this.maxTitleBar.focusedBox) == null ? void 0 : Ee.id, Ve = this.maximizedBoxes$.value.includes(
                Qe
              ) ? Vh(
                [...this.maximizedBoxes$.value],
                Qe
              ) : mT([
                ...this.maximizedBoxes$.value,
                (ie = this.maxTitleBar.focusedBox) == null ? void 0 : ie.id
              ]);
              this.setMaximizedBoxes(Ve);
              const Re = this.makeBoxTopFromMaximized(), Fe = this.boxes$.value.find(
                (Tt) => Tt.id == Qe
              );
              Fe && this.makeBoxTop(Fe), Re || this.setMaximizedBoxes([]);
            } else
              this.setMaximizedBoxes([]);
            break;
          }
          case Ki.Minimize: {
            if ((ct = this.maxTitleBar.focusedBox) != null && ct.id) {
              const Qe = mT([
                ...this.minimizedBoxes$.value,
                (_e = this.maxTitleBar.focusedBox) == null ? void 0 : _e.id
              ]);
              this.makeBoxTopFromMaximized(), this.setMinimizedBoxes(Qe);
            }
            break;
          }
          case Xn.Close: {
            const Qe = (ue = this.maxTitleBar.focusedBox) == null ? void 0 : ue.id;
            Qe && (this.remove(Qe), this.makeBoxTopFromMaximized(), this.setMaximizedBoxes(Vh(this.maximizedBoxes$.value, Qe))), this.focusTopBox();
            break;
          }
        }
      }
    }), K.subscribe((Y) => this.maxTitleBar.setReadonly(Y)), this._darkMode$.subscribe((Y) => {
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
      readonly: K,
      fence: fe,
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
      case nn.Maximized:
        break;
      case nn.Minimized:
        break;
    }
    return this;
  }
  create(i = {}, o = !0) {
    const c = i.id || Td(), h = this.maximizedBoxes$.value.includes(c), m = this.maximizedBoxes$.value.includes(c), y = new qk({
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
      addObserver: (g, S) => {
        const C = this.elementObserverMap.get(c);
        C ? C.push({ el: g, cb: S }) : this.elementObserverMap.set(c, [{ el: g, cb: S }]), this.callbackManager.addCallback(S), this.sizeObserver.observe(g);
      }
    });
    return y.mount(this.root), y.focus && (this.focusBox(y), o && this.makeBoxTop(y)), this.boxes$.setValue([...this.boxes, y]), y._delegateEvents.on(Ki.Maximize, () => {
      this.setMaximizedBoxes(this.boxes$.value.map((g) => g.id)), this.maxTitleBar.focusBox(y);
    }), y._delegateEvents.on(Ki.Minimize, () => {
      this.setMinimizedBoxes([...this.minimizedBoxes$.value, c]);
    }), y._delegateEvents.on(Ki.Close, () => {
      this.remove(y), this.makeBoxTopFromMaximized(y.id), this.focusTopBox();
    }), y._coord$.reaction((g, S, C) => {
      C || this.events.emit(Gn.Move, y);
    }), y._size$.reaction((g, S, C) => {
      C || this.events.emit(Gn.Resize, y);
    }), y._intrinsicCoord$.reaction((g, S, C) => {
      C || this.events.emit(Gn.IntrinsicMove, y);
    }), y._intrinsicSize$.reaction((g, S, C) => {
      C || this.events.emit(Gn.IntrinsicResize, y);
    }), y._visualSize$.reaction((g, S, C) => {
      C || this.events.emit(Gn.VisualResize, y);
    }), y._zIndex$.reaction((g, S, C) => {
      if (this.boxes.length > 0) {
        const A = this.boxes.reduce(
          (I, z) => I.zIndex > z.zIndex ? I : z
        );
        this.topBox$.setValue(A);
      }
      C || this.events.emit(Gn.ZIndex, y);
    }), this.events.emit(Gn.Created, y), y;
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
      this.boxes$.setValue(m), y.forEach((S) => S.destroy());
      const g = (c = this.getBox(i)) == null ? void 0 : c.id;
      if (g) {
        this.setMaximizedBoxes(Vh(this.maximizedBoxes$.value, g)), this.setMinimizedBoxes(Vh(this.minimizedBoxes$.value, g));
        const S = this.elementObserverMap.get(g);
        S && S.forEach(({ el: C, cb: A }) => {
          this.callbackManager.removeCallback(A), this.sizeObserver.unobserve(C), this.elementObserverMap.delete(g);
        });
      }
      return o || (this.boxes.length <= 0 && (this.setMaximizedBoxes([]), this.setMinimizedBoxes([])), this.events.emit(Gn.Removed, y)), y[0];
    }
  }
  removeTopBox() {
    if (this.topBox)
      return this.remove(this.topBox);
  }
  removeAll(i = !1) {
    const o = this.boxes$.value;
    return this.boxes$.setValue([]), o.forEach((c) => c.destroy()), this.sizeObserver.disconnect(), this.elementObserverMap = /* @__PURE__ */ new Map(), this.callbackManager.removeAll(), i || (this.boxes.length <= 0 && (this.setMaximizedBoxes([]), this.setMinimizedBoxes([])), this.events.emit(Gn.Removed, o)), o;
  }
  destroy(i = !1) {
    this.events.removeAllListeners(), this._sideEffect.flushAll(), this.removeAll(i), this.sizeObserver.disconnect(), this.callbackManager.removeAll(), Object.keys(this).forEach((o) => {
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
        h.focus && this.blurBox(h, o);
    }), this.maximizedBoxes$.value.length > 0 ? this.maximizedBoxes$.value.includes(c.id) && this.maxTitleBar.focusBox(c) : this.maxTitleBar.focusBox(c));
  }
  focusTopBox() {
    if (this.topBox && !this.topBox.focus)
      return this.focusBox(this.topBox);
  }
  blurBox(i, o = !1) {
    const c = this.getBox(i);
    c && c.focus && (c.setFocus(!1, o), o || this.events.emit(Gn.Blurred, c));
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
        const c = this.topBox.zIndex + 1, h = Xk(
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
  getBox(i) {
    return typeof i == "string" ? this.boxes.find((o) => o.id === i) : i;
  }
}
const sP = (r, i, o, c, h) => new oP(
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
class oP {
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
        this.teleBoxManager.boxes.forEach((S) => {
          S.resize(S.intrinsicWidth + g, S.intrinsicHeight + g, !0);
        });
      }, 400);
    }), this.teleBoxManager.events.on("minimized", (y) => {
      this.context.safeSetAttributes({ minimizedBoxes: JSON.stringify(y) });
    }), this.teleBoxManager.events.on("maximized", (y) => {
      this.context.safeSetAttributes({ maximizedBoxes: JSON.stringify(y) });
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
      this.context.updateAppState(y.id, Ji.ZIndex, y.zIndex);
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
    var C, A, I;
    if (!this.teleBoxManager)
      return;
    let { minwidth: o = qD, minheight: c = KD } = (C = i.app.config) != null ? C : {};
    const { width: h, height: m } = (A = i.app.config) != null ? A : {}, y = ((I = i.options) == null ? void 0 : I.title) || i.appId, g = this.teleBoxManager.containerRect;
    o > 1 && (o = o / g.width), c > 1 && (c = c / g.height);
    const S = {
      title: y,
      minWidth: o,
      minHeight: c,
      width: h,
      height: m,
      id: i.appId
    };
    this.teleBoxManager.create(S, i.smartPosition), this.context.emitter.emit(`${i.appId}${Xt.WindowCreated}`);
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
    const o = Qt.wrapper ? Qt.wrapper : document.body, c = o.getBoundingClientRect(), h = {
      root: o,
      containerRect: {
        x: 0,
        y: 0,
        width: c.width,
        height: c.height
      },
      fence: !1,
      prefersColorScheme: i == null ? void 0 : i.prefersColorScheme
    }, m = new aP(h);
    return this.teleBoxManager && this.teleBoxManager.destroy(), this.teleBoxManager = m, m;
  }
  setCollectorContainer(i) {
    console.log(i);
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
    const i = (o = Qt.wrapper) == null ? void 0 : o.getBoundingClientRect();
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
    var o;
    this.teleBoxManager.setReadonly(i), (o = this.teleBoxManager._collector$.value) == null || o.setReadonly(i);
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
function VM(r) {
  return r();
}
function gT() {
  return /* @__PURE__ */ Object.create(null);
}
function dg(r) {
  r.forEach(VM);
}
function lP(r) {
  return typeof r == "function";
}
function uP(r, i) {
  return r != r ? i == i : r !== i || r && typeof r == "object" || typeof r == "function";
}
let Hv;
function rg(r, i) {
  return Hv || (Hv = document.createElement("a")), Hv.href = i, r === Hv.href;
}
function cP(r) {
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
function yS(r) {
  return document.createTextNode(r);
}
function Zb() {
  return yS(" ");
}
function Rn(r, i, o) {
  o == null ? r.removeAttribute(i) : r.getAttribute(i) !== o && r.setAttribute(i, o);
}
function dP(r) {
  return Array.from(r.childNodes);
}
function HM(r, i) {
  i = "" + i, r.wholeText !== i && (r.data = i);
}
function Si(r, i, o, c) {
  r.style.setProperty(i, o, c ? "important" : "");
}
let WM;
function ag(r) {
  WM = r;
}
const Yh = [], yT = [], Kv = [], wT = [], fP = Promise.resolve();
let Yb = !1;
function hP() {
  Yb || (Yb = !0, fP.then(FM));
}
function Gb(r) {
  Kv.push(r);
}
let yb = !1;
const wb = /* @__PURE__ */ new Set();
function FM() {
  if (!yb) {
    yb = !0;
    do {
      for (let r = 0; r < Yh.length; r += 1) {
        const i = Yh[r];
        ag(i), pP(i.$$);
      }
      for (ag(null), Yh.length = 0; yT.length; )
        yT.pop()();
      for (let r = 0; r < Kv.length; r += 1) {
        const i = Kv[r];
        wb.has(i) || (wb.add(i), i());
      }
      Kv.length = 0;
    } while (Yh.length);
    for (; wT.length; )
      wT.pop()();
    Yb = !1, yb = !1, wb.clear();
  }
}
function pP(r) {
  if (r.fragment !== null) {
    r.update(), dg(r.before_update);
    const i = r.dirty;
    r.dirty = [-1], r.fragment && r.fragment.p(r.ctx, i), r.after_update.forEach(Gb);
  }
}
const mP = /* @__PURE__ */ new Set();
function vP(r, i) {
  r && r.i && (mP.delete(r), r.i(i));
}
function gP(r, i, o, c) {
  const { fragment: h, on_mount: m, on_destroy: y, after_update: g } = r.$$;
  h && h.m(i, o), c || Gb(() => {
    const S = m.map(VM).filter(lP);
    y ? y.push(...S) : dg(S), r.$$.on_mount = [];
  }), g.forEach(Gb);
}
function yP(r, i) {
  const o = r.$$;
  o.fragment !== null && (dg(o.on_destroy), o.fragment && o.fragment.d(i), o.on_destroy = o.fragment = null, o.ctx = []);
}
function wP(r, i) {
  r.$$.dirty[0] === -1 && (Yh.push(r), hP(), r.$$.dirty.fill(0)), r.$$.dirty[i / 31 | 0] |= 1 << i % 31;
}
function bP(r, i, o, c, h, m, y, g = [-1]) {
  const S = WM;
  ag(r);
  const C = r.$$ = {
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
    context: new Map(S ? S.$$.context : i.context || []),
    callbacks: gT(),
    dirty: g,
    skip_bound: !1,
    root: i.target || S.$$.root
  };
  y && y(C.root);
  let A = !1;
  if (C.ctx = o ? o(r, i.props || {}, (I, z, ...F) => {
    const $ = F.length ? F[0] : z;
    return C.ctx && h(C.ctx[I], C.ctx[I] = $) && (!C.skip_bound && C.bound[I] && C.bound[I]($), A && wP(r, I)), z;
  }) : [], C.update(), A = !0, dg(C.before_update), C.fragment = c ? c(C.ctx) : !1, i.target) {
    if (i.hydrate) {
      const I = dP(i.target);
      C.fragment && C.fragment.l(I), I.forEach(cp);
    } else
      C.fragment && C.fragment.c();
    i.intro && vP(r.$$.fragment), gP(r, i.target, i.anchor, i.customElement), FM();
  }
  ag(S);
}
class SP {
  $destroy() {
    yP(this, 1), this.$destroy = ig;
  }
  $on(i, o) {
    const c = this.$$.callbacks[i] || (this.$$.callbacks[i] = []);
    return c.push(o), () => {
      const h = c.indexOf(o);
      h !== -1 && c.splice(h, 1);
    };
  }
  $set(i) {
    this.$$set && !cP(i) && (this.$$.skip_bound = !0, this.$$set(i), this.$$.skip_bound = !1);
  }
}
function bT(r) {
  let i, o, c, h, m, y, g, S = r[18] && ST(r), C = r[19] && xT(r);
  return {
    c() {
      i = ol("div"), o = ol("div"), S && S.c(), c = Zb(), h = ol("span"), m = yS(r[1]), y = Zb(), C && C.c(), Si(h, "overflow", "hidden"), Si(h, "white-space", "nowrap"), Si(h, "text-overflow", "ellipsis"), Si(h, "max-width", "80px"), Rn(o, "class", r[9]), Si(o, "background-color", r[3]), Si(o, "color", r[10]), Si(o, "opacity", r[12]), Rn(i, "class", g = "netless-window-manager-cursor-name " + r[16] + " " + r[15]);
    },
    m(A, I) {
      fg(A, i, I), vo(i, o), S && S.m(o, null), vo(o, c), vo(o, h), vo(h, m), vo(o, y), C && C.m(o, null);
    },
    p(A, I) {
      A[18] ? S ? S.p(A, I) : (S = ST(A), S.c(), S.m(o, c)) : S && (S.d(1), S = null), I & 2 && HM(m, A[1]), A[19] ? C ? C.p(A, I) : (C = xT(A), C.c(), C.m(o, null)) : C && (C.d(1), C = null), I & 512 && Rn(o, "class", A[9]), I & 8 && Si(o, "background-color", A[3]), I & 1024 && Si(o, "color", A[10]), I & 4096 && Si(o, "opacity", A[12]), I & 98304 && g !== (g = "netless-window-manager-cursor-name " + A[16] + " " + A[15]) && Rn(i, "class", g);
    },
    d(A) {
      A && cp(i), S && S.d(), C && C.d();
    }
  };
}
function ST(r) {
  let i, o;
  return {
    c() {
      i = ol("img"), Rn(i, "class", "netless-window-manager-cursor-selector-avatar"), Rn(i, "style", r[20]()), rg(i.src, o = r[8]) || Rn(i, "src", o), Rn(i, "alt", "avatar");
    },
    m(c, h) {
      fg(c, i, h);
    },
    p(c, h) {
      h & 256 && !rg(i.src, o = c[8]) && Rn(i, "src", o);
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
      i = ol("span"), o = yS(r[2]), Rn(i, "class", "netless-window-manager-cursor-tag-name"), Si(i, "background-color", r[11]);
    },
    m(c, h) {
      fg(c, i, h), vo(i, o);
    },
    p(c, h) {
      h & 4 && HM(o, c[2]), h & 2048 && Si(i, "background-color", c[11]);
    },
    d(c) {
      c && cp(i);
    }
  };
}
function xP(r) {
  let i, o, c, h, m, y, g, S = !r[14] && bT(r);
  return {
    c() {
      i = ol("div"), S && S.c(), o = Zb(), c = ol("div"), h = ol("img"), Rn(h, "class", m = "netless-window-manager-cursor-" + r[4] + "-image " + r[15]), rg(h.src, y = r[7]) || Rn(h, "src", y), Rn(h, "alt", r[4]), Rn(c, "class", "cursor-image-wrapper"), Rn(i, "class", g = "netless-window-manager-cursor-mid" + (r[13] ? " netless-window-manager-cursor-custom" : "")), Si(i, "transform", "translateX(" + r[5] + "px) translateY(" + r[6] + "px)"), Si(i, "display", r[17]), Rn(i, "data-cursor-uid", r[0]);
    },
    m(C, A) {
      fg(C, i, A), S && S.m(i, null), vo(i, o), vo(i, c), vo(c, h);
    },
    p(C, [A]) {
      C[14] ? S && (S.d(1), S = null) : S ? S.p(C, A) : (S = bT(C), S.c(), S.m(i, o)), A & 32784 && m !== (m = "netless-window-manager-cursor-" + C[4] + "-image " + C[15]) && Rn(h, "class", m), A & 128 && !rg(h.src, y = C[7]) && Rn(h, "src", y), A & 16 && Rn(h, "alt", C[4]), A & 8192 && g !== (g = "netless-window-manager-cursor-mid" + (C[13] ? " netless-window-manager-cursor-custom" : "")) && Rn(i, "class", g), A & 96 && Si(i, "transform", "translateX(" + C[5] + "px) translateY(" + C[6] + "px)"), A & 131072 && Si(i, "display", C[17]), A & 1 && Rn(i, "data-cursor-uid", C[0]);
    },
    i: ig,
    o: ig,
    d(C) {
      C && cp(i), S && S.d();
    }
  };
}
function CP(r, i, o) {
  let c, h, m, y, g, S, C, A, { uid: I } = i, { cursorName: z } = i, { tagName: F } = i, { backgroundColor: $ } = i, { appliance: K } = i, { x: q } = i, { y: fe } = i, { src: se } = i, { visible: Z } = i, { avatar: ce } = i, { theme: oe } = i, { color: Oe } = i, { cursorTagBackgroundColor: $e } = i, { opacity: je } = i, { pencilEraserSize: Y } = i, { custom: he } = i;
  const Ee = () => Object.entries({
    width: (c ? 19 : 28) + "px",
    height: (c ? 19 : 28) + "px",
    position: c ? "initial" : "absolute",
    "border-color": c ? "white" : $,
    "margin-right": (c ? 4 : 0) + "px"
  }).map(([ie, ct]) => `${ie}: ${ct}`).join(";");
  return r.$$set = (ie) => {
    "uid" in ie && o(0, I = ie.uid), "cursorName" in ie && o(1, z = ie.cursorName), "tagName" in ie && o(2, F = ie.tagName), "backgroundColor" in ie && o(3, $ = ie.backgroundColor), "appliance" in ie && o(4, K = ie.appliance), "x" in ie && o(5, q = ie.x), "y" in ie && o(6, fe = ie.y), "src" in ie && o(7, se = ie.src), "visible" in ie && o(21, Z = ie.visible), "avatar" in ie && o(8, ce = ie.avatar), "theme" in ie && o(9, oe = ie.theme), "color" in ie && o(10, Oe = ie.color), "cursorTagBackgroundColor" in ie && o(11, $e = ie.cursorTagBackgroundColor), "opacity" in ie && o(12, je = ie.opacity), "pencilEraserSize" in ie && o(22, Y = ie.pencilEraserSize), "custom" in ie && o(13, he = ie.custom);
  }, r.$$.update = () => {
    r.$$.dirty & 2 && (c = !Gh(z)), r.$$.dirty & 4 && o(19, h = !Gh(F)), r.$$.dirty & 256 && o(18, m = !Gh(ce)), r.$$.dirty & 2097152 && o(17, y = Z ? "" : "none"), r.$$.dirty & 16 && o(14, g = K === Dn.laserPointer), r.$$.dirty & 16400 && o(23, S = g || K === Dn.pencilEraser), r.$$.dirty & 8388608 && o(16, C = S ? "netless-window-manager-laserPointer-pencilEraser-offset" : ""), r.$$.dirty & 4194304 && o(15, A = Y === 3 ? "netless-window-manager-pencilEraser-3-offset" : "");
  }, [
    I,
    z,
    F,
    $,
    K,
    q,
    fe,
    se,
    ce,
    oe,
    Oe,
    $e,
    je,
    he,
    g,
    A,
    C,
    y,
    m,
    h,
    Ee,
    Z,
    Y,
    S
  ];
}
class TP extends SP {
  constructor(i) {
    super(), bP(this, i, CP, xP, uP, {
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
const $M = "data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Ccircle cx='12' cy='12' r='2.5' stroke='%23000' stroke-linejoin='square'/%3E%3Ccircle cx='12' cy='12' r='3.5' stroke='%23FFF'/%3E%3C/g%3E%3C/svg%3E";
function QM(r) {
  return `data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Ccircle cx='12' cy='12' r='2.5' stroke='%23${r}' stroke-linejoin='square'/%3E%3Ccircle cx='12' cy='12' r='3.5' stroke='%23${r}'/%3E%3C/g%3E%3C/svg%3E`;
}
function Md(r) {
  return `data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg' fill='none'%3E%3Cpath d='M5 12H19' stroke='%23${r}' stroke-linejoin='round'/%3E%3Cpath d='M12 5V19' stroke='%23${r}' stroke-linejoin='round'/%3E%3C/svg%3E`;
}
function Ru(r) {
  return `url("${r}") 12 12, auto`;
}
function MP(r) {
  let i = "";
  for (const o in r)
    i += `.netless-whiteboard.${o} {cursor: ${r[o]}}
`;
  return i;
}
const Wv = document.createElement("style");
function EP(r) {
  const [i, o, c] = r.strokeColor, h = ((1 << 24) + (i << 16) + (o << 8) + c).toString(16).slice(1);
  return Wv.textContent = MP({
    "cursor-pencil": Ru(QM(h)),
    "cursor-eraser": Ru($M),
    "cursor-rectangle": Ru(Md(h)),
    "cursor-ellipse": Ru(Md(h)),
    "cursor-straight": Ru(Md(h)),
    "cursor-arrow": Ru(Md(h)),
    "cursor-shape": Ru(Md(h))
  }), document.head.appendChild(Wv), () => {
    Wv.parentNode != null && document.head.removeChild(Wv);
  };
}
const IP = /* @__PURE__ */ new Set([
  Dn.rectangle,
  Dn.ellipse,
  Dn.straight,
  Dn.arrow,
  Dn.shape
]);
function CT(r, i) {
  if (r === Dn.pencil)
    return QM(i);
  if (r === Dn.eraser)
    return $M;
  if (IP.has(r))
    return Md(i);
}
class AP {
  constructor(i, o, c, h) {
    this.manager = i, this.memberId = o, this.cursorManager = c, this.wrapper = h, this.style = "default", this.move = (m) => {
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
    }, this.updateMember(), this.createCursor(), this.autoHidden(), this.setStyle(c.style);
  }
  moveCursor(i, o, c) {
    var S, C;
    const { x: h, y: m, type: y } = i, g = c == null ? void 0 : c.screen.convertPointToScreen(h, m);
    if (g) {
      let A = g.x - 2, I = g.y - 18;
      if (this.isCustomIcon() && (A -= 11, I += 4), y === "app") {
        const z = this.cursorManager.wrapperRect;
        z && (A = A + o.x - z.x, I = I + o.y - z.y);
      }
      g.x < 0 || g.x > o.width || g.y < 0 || g.y > o.height ? (S = this.component) == null || S.$set({ visible: !1, x: A, y: I }) : (C = this.component) == null || C.$set({ visible: !0, x: A, y: I });
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
    this.member && this.wrapper && (this.component = new TP({
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
    var S;
    if (!this.member)
      return;
    const { memberApplianceName: i, memberColorHex: o } = this, { userApplianceIcons: c, applianceIcons: h } = this.cursorManager;
    let m = this.memberApplianceName;
    m === Dn.pencilEraser && (m = `${m}${((S = this.member) == null ? void 0 : S.memberState.pencilEraserSize) || 1}`);
    const y = m && c[m];
    if (y)
      return y;
    if (this.style === "custom" && i) {
      const C = CT(i, o);
      if (C)
        return C;
    }
    return h[m || Dn.shape] || h[Dn.shape];
  }
  isCustomIcon() {
    var y;
    if (!this.member)
      return !1;
    const { memberApplianceName: i, memberColorHex: o } = this, { userApplianceIcons: c } = this.cursorManager;
    let h = this.memberApplianceName;
    return h === Dn.pencilEraser && (h = `${h}${((y = this.member) == null ? void 0 : y.memberState.pencilEraserSize) || 1}`), h && c[h] ? !1 : !!(this.style === "custom" && i && CT(i, o));
  }
  updateMember() {
    return this.member = Ub(this.manager.room, this.memberId), this.updateComponent(), this.member;
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
const RP = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAA0CAYAAADFeBvrAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAYISURBVHgB7ZpNSCtXFIBPEuvz+dMGpYUKD/sWFX+Qti6kK7Hqpm6e9q0rIoIUFUShPLV10VZx4+JZqa9v20LBhdq9fyBUCtKNPH8qYl2IOw3G38Rkek4y15y5uTOZJDOWggcOSSYzN/ebc+45554JwIM8iBCPyTEP+86T4vyMfsRN4b+nQTKIJp0vzuGvlpID7os8EQNEIBD4oKio6Bm9DwaDv/v9/n/076JgbtWUYPchwrW8qD7UnOvr6wFNkpubm+/wu7f0c7y6mrnlvQufxB0Iau7V1dX3BDA/P6/V1dVpzc3N2uLiIofK1c8VYHys/wRKBUN3/hGHqaysNOjc3FwMis6hc0FtLTHuvYLxCCZgci8uLn4wg5Gh6Fy8Jk+/NkcCAlAAuUkoW4g0B+d5tLS05O/r67O8eGxsDNra2uDy8nKsoKCAwCIQDxQa0yTxgrvCYXyTk5Ml+Orf2dlJeeHIyAigFSE/P38ELfUNqNdSkjgF5FF89jL1TU1NlQwODl5gZPujp6cHWltbUw7Koc7Pz8mkZpHPFeFrJuZeqLnoMoPoZqe0JjDP/IZgnyLUG/o8NDRkuo5Ua2pjY6MC4oFCFf1cA0oKzRSOp6enRfTaGh0d/QxBt+1CUVgnOTs7+xrHfQzGyOcKkK3QTJMnQffZ6e/v/xwttmsHqqmpKXbdycnJCxy7ABLh3FEgVZ6hZJhnFZoFFMF0d3c/w7v+dyookXBnZ2c/xvHfhriVcvXfdBRItsxjnOhYqjwjoAimq6vrCysoGofk+Ph4Esd/F/UdiFtJAGUd2DygTpp5dmBUUJ2dnc9VUALm8PDwJY7/BPU9VD8k3M4RC6kskxZMKigKIMLN9vf3p3H8DyWgfEhEOwOQD9IXOTz7EObbwsLC4YWFBRgeHrY9ECXYo6MjaGlpKWlsbPxkYGDgRW1tbSEWquVlZWXBzc3Nl1VVVa8hXiXc6ioqBqGaPDk7AACJTRZ3NS9lcUp86cJwoSQ7Pj4Op6enfxUXF3/V0NCQv7q6GsCvwrqGUG/01xAD4+VQTOxaSF43d5bBOisrGBJRCtXX17+/trb268rKSgASFgmz97KFkmo6OztWuVyPweiWGc4WRkhFRQVEIpHg8vJyQAIQVlLBROVxvBYQHsXnO8tk62ZcyN0wecLBwcEvYHSzEPscBqOLCRhLC4n9uqaA8UAWAcAKhtbQ3t7eTHl5+Y9gtAp3twhT056CDMQ7MRzIFTeTYKb1yYYVQFH9VdzsqNmYKpfTJBDX3Ixgdnd3XyHMT2AMALJlBBSPaMpNngrIsTyTCgaj288YDGakictrxizvKFNOjgSSBLS+vv6UYHDb7DgMVgsChjTEgCIKGG4ZU+EWkgNBzN1qamq+pAMTExPgFMzW1tZrhHkFyWE5KxgSszx0527RaDRmOSpRshEOU11dPQPG8CwHARHJlMnTSrwSRFIlfXt7m3V5ngJGuJtqzaQtZkFBVNJezN5ZAdmwjKo2k9tVtrcI3OXk4tPgcg7ChCDZ1URgMOu72Xa5VFHOkymQhWVU60YVmjN6wiC7k6p+S1syCACOwJBYFaexV+yhBekNPsMBO6KAEeE4BMaCU67RsoYhSbXgaT//ht709vZCaWmp6YkEbLFmVJWzas04+iBL7EKpm0J7duqu0B7+CTUpNJuyvb1NCfMj1CqI9wLKUOlOUMeG+gGFkHii4HizUF4z/KFUrPsJ8WbEIyx7nnZ0dDynME6BAuce09iFHo+GrnmGltltb2//E4wVAN82y7vOjKOZXSBhJdHNiT3TYWD8OY2PTUJkdd7MkJMnT5wZVQF2RFX6yBMUdzPMvvfqxz3sXHF+GNT9ANXit/10O1sgHkZvdQAOKvs9B5L7ARELGAAXLSTvM8QExTE+YbHe+HURhZp1aRyF4CJXClbbWwGketgkW9VsY+YaiBCVhfgE+XvxRwgZSM4jUVCDZFQ9pytmXR8hUTB2gnidx4XffVWydN0yQjwmx/jkAZJBrIBI5J7ZvQGZWUgVSuU/EqmOAzicKNMVu816DdRWUV1/7xAP8n+SfwF3Du3NF2sYhwAAAABJRU5ErkJggg==", DP = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADEAAAAxCAYAAABznEEcAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAZoSURBVHgB7VlLSCRXFL3ljNEhEXTGhMQJmOjCz8ZNVLKICz9xIYhCNi7UgINkGEk2En8hW5cBUQNxo05GAoKikuCAmvGzGMdPcCUGjDPxD/4Vv/3JvWW97luvq7ur+hMZ8MKlqrteNfe8e965970GuLVbC5kpJr53+hjHx9yY3TUxJgLMAQG4ITARfp5T4Mri4uL9q6urnxwOxz/oY5eXl1/Pzs7e195X2FX4jZsIhAK7gx5ps9m6nGj9/f3OtbU1pzAE0318fPwVjYHrrN7R3AjU/wpOBwA9Cmf/9ejoqDMtLU31iooKGdA+ATo4OMiXAEWAHhBAGEApXj4rPAik0vPt7e0vCgoKPH4gMzMTSktLIS8vD2JiYgABvcHMTZyennbHxsaOg3udOJmLzwqEYB0ZgRCZENm4u7e39yQuLq65srISZmZmvP5Ybm4u5OfnQ0lJyXWUCAgzNLS+vt6SnJz8WgvYwV5xSlcRgyVg3ha2Dkxzc3MvfZmVlQW+bGxsDBobGyE7O1u94uJPjIqKqklKSvrbbrfPnp+ff7e8vJwMnlSTKWfJjDKhywJo6wLp0YcZ+dyIUr7s4cOHLsrRlQwBTSBFuzc2NiZYhjjVAIyzZBqEwgCQv0OOM/gNzuiP/ijlDxBRjgClpqa6AF1cXDydmpoaLCws3JcAGYHyC4JMzoKaibKysvienp6FtrY2IA/WCFB5ebkqCHSvARo8Ozt7igIxwIJ2gJ+seFMnDoIyEUV+dHT0G3qWVUr5M043DdAB0m2IKZwAYpgZX+qkywR6NFbuR0iDxmAoZRUQKRxSLTMnJ8eIaqqSeVMnIYUOdu+sq6vrp4f+VCoYo8khZaNs01VRlERUu2/BrWAA7sl2Anink1Ao18JGjyY/PDx8hq1GZqgp5c2mp6chMjLy2b179x7hRzvoqeUUwXIzqq4O5nZsNUaEbIbLqPLTou/s7FTvT05OpsA9sXJG1AVsZDwjutqBIN6gUlWjxod8XRBNKXgsrqpqYZfwEqX9h8TExD7wbFm8LmzxHQ0QHSlXKZVSqFC/hkqlaKapTaGgCQTK7PHW1lb/wsLC86KiokkccoV+qV1tcE0pO7AWxmhTxBszDzqRr66ujqanp2cRpQLNBgUsCh8BwQ54bn5+/s+mpqa+4eHhfS1gb52vwuP0trPjhSZCBtLQ0NA3MDDQQIFYAUHBYhuvzjpVbJr1lZWVP3p7e19UVVXNgHumXYrI4uBx6Yqevz02b0FcRQ8CoBQF3dXVpQLZ3d39C7n+ora29vfJyclDYFnWgFyxK3cxhss/+KoT/N6DVkQpKypFGUCp3Ozo6HgSHx//GLW/BwHsg57zl5pzADajwLn52mPL1ZHPloMoRYPMFL6EhAR18e7s7MxVV1fPsAAp4Avteq7dC/c1+wKI4g+EfGzDM+EYHBw8RDrNiA2QL6upqVGvKJ2/gHu2L1nA5wwEB2YDfSYMO1x/px0cgEc2zBY+eo67u6H29vZ/wU2VC8l58JxKNjDOgojNEp08aFVfX++3l6JMEdDx8fEB0FNIBsDXBc8ArwuW1EkeI1RKdLWmCx+1DhkZGRvR0dFfSsHKxYtnW0iqvJAN9xNm6MR/QO5sfapUSkqKmqW5ubmfwVgyZdpw/vPZl2kUEAinBMSUStG+gwra0NDQSynQKyloIxnlewafjDFLJzLRBJqiFMnqyMgIbG5uDuD996Dnv8iAPOMAPmbcm5lVJwA/vZRMKZGZlpaWVtAvUL4GZMqE1fjRJrUd76LHoX+InlhcXPwZnWW2tra6jjrpiBM3UK/weQr6J+gfodMh9HtwncG7YLA3CMSsLmxx5WuDCt8B7vZeicInTjCWlpb6wc15mfey7oc9E8LElpVmMgb9AXoC+qcTExOPKRu4NlTHs6Q10GfhgfYOvRsJQZ76BWMKuDtaolQs+gfoH6Mn436gDg+e+5BKXUQx/C5Je/a+NpbeiQJPKgUdlNXx/BCBKxVdxW5Q0I3XBqFKRhU4KLtjYawi3csuTKdc4FnIXNvKUJkVEGRG20QZAAUpA5DbaYAQLmQzfzxyk/ffdnCD4NWVnGdE7kQBQvQHC5lVEDxgMaM29lkxGCNLKrDnIbFAMkFmBIaDkHstU41coGZ1TZD5UjReCGUAYbNgdNqoXZB/T67yYbFAMiGML3BhYeH8rb0t9h/zgcTBcTNGiQAAAABJRU5ErkJggg==", NP = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAA0CAYAAADFeBvrAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAgrSURBVHgB7ZprTBRXFIDP7gIt8lQppTwE5V0KaAn6o1pqNGkDDTEmTUhsgKRp+gNJw68CFkLbVC2QkDS+gD8KJdWmARvbFBNNWpuIRGPFWBXQRMPDqIki+KLATs+ZnTvcvXtnX8w2beJJToaduTP3fHPOPffcOwC8kP+2WCDwIvahGFxTuN8KmNSZmULPNjLeqF9F8rdPkIEGEn+r+vjx46LQ0NA8/Dsader58+e/h4WFDWntFO7ot6fMFAt3JLWi2lCDpqamCux2+2+KROj82NhYGrXT2lu5Z/DP/deFByElA4Pv3LlTiHY/nJ6eVnbv3q1s2bJFyc7OVrZu3arU1dUp4+PjxPUQoT+g9tp9PkMFgpo9kxljHRoaWp2Xl3duYmIiurKyEvDoclNCQgIcPnxYPc7MzHwcGRnZhaft4Ag7O9fUbRhaITCie4lgcnNzT7qDIaHz27dvh+vXr0NEREQneqoCHKFnAR+8ZCaQGGq2CxcurCGYycnJZHcwTNAzUFFRoUJFRUV1IFQ5OKBsXB9uxSwgl0TQ3d29Yt26dccwoyVXV1d7hGEiQmGi2AzOUHx/hob4K2yuYS9G987s7OwPISEh7xPM6dOnwVfBsIMjR45AZmbmo5s3b76Xnp7+J55egMVxBSAZT0v1ED+76yn66dOnLQSzd+9ev2BIyFP0MjBco1JTU/sxfFeDazp3cYgZHmKqdoaGNISHh9fv378fSJcqlPV6e3sBJ+I/goOD34VFL0k95Y+HxPHCYGxmw5DQ2NuzZw8EBQVtunXr1jvgwUP+hhz/QDXMMCNVE8zx48dNg2FCz6QQjI2N/RA8VBFmANnu3btXihnpG8pM9fX1EAi5du0aeWkVOAMBCF7yN+R0z4yOjq6NiYlpp9CgdBtIwXpPH6vgDKWLt0CygtM6MDCwBuUYZSKaOCksAiVY9wFOBePgDOOytPAGSKzNVCCC2bBhw69YdK7ypgpYimzbtk2dl7CM+hFcveOUHDylbTFO1YdhFbByx44dA1QFUP0VSJj4+Hjo6+sDq9U6iEmHKvFZTedQ50GYbN15SITVlwNlZWUnLRZL8s6dOwMOQ9UCTtKTra2ttdppt9V2kMF5cbmsjxuM43bMNrmUzc6fP6+GQiDGDoOJi4ubwb4qm5ubafyIE6nLxGqTPEsGo1cBOGNX0TyDYafC0CyOaxcVziyh53Z2dkJycvLMvn37PmpoaBgFR4jxYSbWdVIgI89Iq4CjR48CZjlYv369+tssqI6ODsjPz4f+/v668vLycxrEHHfkYdwC8SB6mGEV8Cl64cuuri5oa2tTG+EyGjZu3AiXLl1qefDgwV8lJSUFZkDV1tZCcXExXLx4sbWoqKgPFj0zx8GI9ZwO5W4M6ekZYeqpaqbqmaSqqkpNpcPDw4dwzfM9nrLduHEjEs+X0XV/Sx96LnqE1kLtBQUF3eDwCO8dGQyzV5rl+JyuegfXI29jRotiRlKnpFghHMzKyjqotVXS0tLacKPjF3bdHxjSq1evduAkepAD+ZsDYlC8V5w8ZBVg+PPq2MGMlkInqE4joTf45MmT4YyMjAPcA+ltLSQlJX2BafxnX6HI29QeK44TOTk57mCYZ0QoJ8OBM4yB6dkNkwGlSygsLFQvYtYB3BTMxFL+M+0eFgZqp4mJiU2+QKGX1fGIk/QIrn0aYXGsyDxjmAyMhO2jhaCGoUbX1NSkLSwsPMJqV8Fspu6lIZS6OYhjiOLwdU7fQM1HfRPD7wS1obZ0j0xpb4726Z49ezaJf2/S7s9ATUGNR41BjdJseRnke3WGwhrRTS9pD1mOGoeG15BxOOfoxuCkp0Ih6NeaEaSZGlieJyiCoc1FgsGldokGk8nBvAKOrWIGQ5uPsm0tt0BWDiicAaGuGhkZ+YqMw9StGzU4OKhCnT179hNsswY1FTXdE5QEJhc1S3tGogazXLOBwQSBl3tzIhQPtAL1VQJCTcNx8y1vHIUghSKFZE9PT7H2dlM1b+Wgrr1y5Uq77J75+fnplpaWMg2ch4nlYEI5z7hdensDpI4hrYNErcMMXJ32koG4ztf3pultz83NjWG99Ra2WQ0OL2VjZjwgeufUqVOqV8+cOdPIwdBLSNJeHg8TAh5WqJ6EfSmgt7IMNRJ1JThiOlnrOAMHshprmMKdoGSCpb9s3B3SYLIFGIqICJB7xisYi+RvfiypXw40DWGdlJaWRmMd141hk8V2OWm7ieYTXhBc3+BgaZyqAISjOYxSMVvXsBTNlzdiNQDgRao2AtK3pjggpmrqbGpqSsLPIN/dv38/gaBwUjTshMHcvn27JyUlpRmc5xpPMD599LIYnLNyUKKndKjGxsakXbt2deMCLIE8IVvs0YRM1fjdu3d/wrXN5+BcnzEgvor2uN3rjzAYMp5lPEoQlE5fA0fWo8GfhlCbKVFQ1pKNIfzcOHH58mWqaimVUwJI0+6n59D4pIlzmdZPMPiZzXjDjX47Le5g0Uu8x2zgPqWyKpjVe7x3+AUbq9NYjQbgp2dsBud5o8TP7d5kHAWcQchQfoEmLgn8HjOiBIF7o5hI1x6CEbLNP3bdqYAF44JzyWLzcN1i8DcT/o3awbm8Fz3DAy2A62INwPV/E3wWdx5inmBHuwChCBD6R2JwHge80TIQRQLjt7e8DTkGZgfX8cUMZTDAteFDkveaIlzjX9ySQs8X18r2t2VHUURPKoICmDR+eCO9aSdmOIub3/w9RgpgUpiJhvraXpa6jZKHGEqyusw0GLFzX+5RhN/8kYnMSNMMfyH/V/kHST6OYVElTPAAAAAASUVORK5CYII=", kP = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNDBweCIgaGVpZ2h0PSI0MHB4IiB2aWV3Qm94PSIwIDAgNDAgNDAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDYwLjEgKDg4MTMzKSAtIGh0dHBzOi8vc2tldGNoLmNvbSAtLT4KICAgIDx0aXRsZT5zaGFwZS1jdXJzb3I8L3RpdGxlPgogICAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CiAgICA8ZGVmcz4KICAgICAgICA8cGF0aCBkPSJNMjAsMjEuNSBDMjAuMjQ1NDU5OSwyMS41IDIwLjQ0OTYwODQsMjEuNjc2ODc1MiAyMC40OTE5NDQzLDIxLjkxMDEyNDQgTDIwLjUsMjIgTDIwLjUsMjcgQzIwLjUsMjcuMjc2MTQyNCAyMC4yNzYxNDI0LDI3LjUgMjAsMjcuNSBDMTkuNzU0NTQwMSwyNy41IDE5LjU1MDM5MTYsMjcuMzIzMTI0OCAxOS41MDgwNTU3LDI3LjA4OTg3NTYgTDE5LjUsMjcgTDE5LjUsMjIgQzE5LjUsMjEuNzIzODU3NiAxOS43MjM4NTc2LDIxLjUgMjAsMjEuNSBaIE0yNywxOS41IEMyNy4yNzYxNDI0LDE5LjUgMjcuNSwxOS43MjM4NTc2IDI3LjUsMjAgQzI3LjUsMjAuMjQ1NDU5OSAyNy4zMjMxMjQ4LDIwLjQ0OTYwODQgMjcuMDg5ODc1NiwyMC40OTE5NDQzIEwyNywyMC41IEwyMiwyMC41IEMyMS43MjM4NTc2LDIwLjUgMjEuNSwyMC4yNzYxNDI0IDIxLjUsMjAgQzIxLjUsMTkuNzU0NTQwMSAyMS42NzY4NzUyLDE5LjU1MDM5MTYgMjEuOTEwMTI0NCwxOS41MDgwNTU3IEwyMiwxOS41IEwyNywxOS41IFogTTE4LDE5LjUgQzE4LjI3NjE0MjQsMTkuNSAxOC41LDE5LjcyMzg1NzYgMTguNSwyMCBDMTguNSwyMC4yNDU0NTk5IDE4LjMyMzEyNDgsMjAuNDQ5NjA4NCAxOC4wODk4NzU2LDIwLjQ5MTk0NDMgTDE4LDIwLjUgTDEzLDIwLjUgQzEyLjcyMzg1NzYsMjAuNSAxMi41LDIwLjI3NjE0MjQgMTIuNSwyMCBDMTIuNSwxOS43NTQ1NDAxIDEyLjY3Njg3NTIsMTkuNTUwMzkxNiAxMi45MTAxMjQ0LDE5LjUwODA1NTcgTDEzLDE5LjUgTDE4LDE5LjUgWiBNMjAsMTIuNSBDMjAuMjQ1NDU5OSwxMi41IDIwLjQ0OTYwODQsMTIuNjc2ODc1MiAyMC40OTE5NDQzLDEyLjkxMDEyNDQgTDIwLjUsMTMgTDIwLjUsMTggQzIwLjUsMTguMjc2MTQyNCAyMC4yNzYxNDI0LDE4LjUgMjAsMTguNSBDMTkuNzU0NTQwMSwxOC41IDE5LjU1MDM5MTYsMTguMzIzMTI0OCAxOS41MDgwNTU3LDE4LjA4OTg3NTYgTDE5LjUsMTggTDE5LjUsMTMgQzE5LjUsMTIuNzIzODU3NiAxOS43MjM4NTc2LDEyLjUgMjAsMTIuNSBaIiBpZD0icGF0aC0xIj48L3BhdGg+CiAgICAgICAgPGZpbHRlciB4PSItNjQuNiUiIHk9Ii01OS41JSIgd2lkdGg9IjIyOS4zJSIgaGVpZ2h0PSIyNDYuMSUiIGZpbHRlclVuaXRzPSJvYmplY3RCb3VuZGluZ0JveCIgaWQ9ImZpbHRlci0yIj4KICAgICAgICAgICAgPGZlTW9ycGhvbG9neSByYWRpdXM9IjEiIG9wZXJhdG9yPSJkaWxhdGUiIGluPSJTb3VyY2VBbHBoYSIgcmVzdWx0PSJzaGFkb3dTcHJlYWRPdXRlcjEiPjwvZmVNb3JwaG9sb2d5PgogICAgICAgICAgICA8ZmVPZmZzZXQgZHg9IjAiIGR5PSIyIiBpbj0ic2hhZG93U3ByZWFkT3V0ZXIxIiByZXN1bHQ9InNoYWRvd09mZnNldE91dGVyMSI+PC9mZU9mZnNldD4KICAgICAgICAgICAgPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMyIgaW49InNoYWRvd09mZnNldE91dGVyMSIgcmVzdWx0PSJzaGFkb3dCbHVyT3V0ZXIxIj48L2ZlR2F1c3NpYW5CbHVyPgogICAgICAgICAgICA8ZmVDb21wb3NpdGUgaW49InNoYWRvd0JsdXJPdXRlcjEiIGluMj0iU291cmNlQWxwaGEiIG9wZXJhdG9yPSJvdXQiIHJlc3VsdD0ic2hhZG93Qmx1ck91dGVyMSI+PC9mZUNvbXBvc2l0ZT4KICAgICAgICAgICAgPGZlQ29sb3JNYXRyaXggdmFsdWVzPSIwIDAgMCAwIDAgICAwIDAgMCAwIDAgICAwIDAgMCAwIDAgIDAgMCAwIDAuMTYgMCIgdHlwZT0ibWF0cml4IiBpbj0ic2hhZG93Qmx1ck91dGVyMSI+PC9mZUNvbG9yTWF0cml4PgogICAgICAgIDwvZmlsdGVyPgogICAgPC9kZWZzPgogICAgPGcgaWQ9Iumhtemdoi00IiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8ZyBpZD0iV2hpdGVib2FyZC1HdWlkZWxpbmVzIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMzQ0LjAwMDAwMCwgLTc1MS4wMDAwMDApIj4KICAgICAgICAgICAgPGcgaWQ9InNoYXBlLWN1cnNvciIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzQ0LjAwMDAwMCwgNzUxLjAwMDAwMCkiPgogICAgICAgICAgICAgICAgPHJlY3QgaWQ9IuefqeW9ouWkh+S7vS00NCIgZmlsbD0iI0ZGRkZGRiIgb3BhY2l0eT0iMC4wMSIgeD0iMCIgeT0iMCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMiI+PC9yZWN0PgogICAgICAgICAgICAgICAgPGcgaWQ9IuW9oueKtue7k+WQiCIgZmlsbC1ydWxlPSJub256ZXJvIj4KICAgICAgICAgICAgICAgICAgICA8dXNlIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjEiIGZpbHRlcj0idXJsKCNmaWx0ZXItMikiIHhsaW5rOmhyZWY9IiNwYXRoLTEiPjwvdXNlPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIxIiBkPSJNMjAsMjEgQzIwLjQ4NTQxMDMsMjEgMjAuODk4MDg1LDIxLjM0Nzk5OTMgMjAuOTg5OTQ3OSwyMS44NjU0ODc3IEwyMSwyMiBMMjEsMjcgQzIxLDI3LjU1MjI4NDcgMjAuNTUyMjg0NywyOCAyMCwyOCBDMTkuNTE0NTg5NywyOCAxOS4xMDE5MTUsMjcuNjUyMDAwNyAxOS4wMTAwNTIxLDI3LjEzNDUxMjMgTDE5LDI3IEwxOSwyMiBDMTksMjEuNDQ3NzE1MyAxOS40NDc3MTUzLDIxIDIwLDIxIFogTTI3LDE5IEMyNy41NTIyODQ3LDE5IDI4LDE5LjQ0NzcxNTMgMjgsMjAgQzI4LDIwLjQ4NTQxMDMgMjcuNjUyMDAwNywyMC44OTgwODUgMjcuMTM0NTEyMywyMC45ODk5NDc5IEwyNywyMSBMMjIsMjEgQzIxLjQ0NzcxNTMsMjEgMjEsMjAuNTUyMjg0NyAyMSwyMCBDMjEsMTkuNTE0NTg5NyAyMS4zNDc5OTkzLDE5LjEwMTkxNSAyMS44NjU0ODc3LDE5LjAxMDA1MjEgTDIyLDE5IEwyNywxOSBaIE0xOCwxOSBDMTguNTUyMjg0NywxOSAxOSwxOS40NDc3MTUzIDE5LDIwIEMxOSwyMC40ODU0MTAzIDE4LjY1MjAwMDcsMjAuODk4MDg1IDE4LjEzNDUxMjMsMjAuOTg5OTQ3OSBMMTgsMjEgTDEzLDIxIEMxMi40NDc3MTUzLDIxIDEyLDIwLjU1MjI4NDcgMTIsMjAgQzEyLDE5LjUxNDU4OTcgMTIuMzQ3OTk5MywxOS4xMDE5MTUgMTIuODY1NDg3NywxOS4wMTAwNTIxIEwxMywxOSBMMTgsMTkgWiBNMjAsMTIgQzIwLjQ4NTQxMDMsMTIgMjAuODk4MDg1LDEyLjM0Nzk5OTMgMjAuOTg5OTQ3OSwxMi44NjU0ODc3IEwyMSwxMyBMMjEsMTggQzIxLDE4LjU1MjI4NDcgMjAuNTUyMjg0NywxOSAyMCwxOSBDMTkuNTE0NTg5NywxOSAxOS4xMDE5MTUsMTguNjUyMDAwNyAxOS4wMTAwNTIxLDE4LjEzNDUxMjMgTDE5LDE4IEwxOSwxMyBDMTksMTIuNDQ3NzE1MyAxOS40NDc3MTUzLDEyIDIwLDEyIFoiIGZpbGw9IiMyMTIzMjQiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PC9wYXRoPgogICAgICAgICAgICAgICAgPC9nPgogICAgICAgICAgICAgICAgPHJlY3QgaWQ9IuefqeW9oiIgZmlsbD0iI0ZGRkZGRiIgeD0iMTguNSIgeT0iMTciIHdpZHRoPSIzIiBoZWlnaHQ9IjYiPjwvcmVjdD4KICAgICAgICAgICAgICAgIDxyZWN0IGlkPSLnn6nlvaIiIGZpbGw9IiNGRkZGRkYiIHg9IjE3IiB5PSIxOC41IiB3aWR0aD0iNiIgaGVpZ2h0PSIzIj48L3JlY3Q+CiAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMjAsMjEuNSBDMjAuMjQ1NDU5OSwyMS41IDIwLjQ0OTYwODQsMjEuNjc2ODc1MiAyMC40OTE5NDQzLDIxLjkxMDEyNDQgTDIwLjUsMjIgTDIwLjUsMjcgQzIwLjUsMjcuMjc2MTQyNCAyMC4yNzYxNDI0LDI3LjUgMjAsMjcuNSBDMTkuNzU0NTQwMSwyNy41IDE5LjU1MDM5MTYsMjcuMzIzMTI0OCAxOS41MDgwNTU3LDI3LjA4OTg3NTYgTDE5LjUsMjcgTDE5LjUsMjIgQzE5LjUsMjEuNzIzODU3NiAxOS43MjM4NTc2LDIxLjUgMjAsMjEuNSBaIE0yNywxOS41IEMyNy4yNzYxNDI0LDE5LjUgMjcuNSwxOS43MjM4NTc2IDI3LjUsMjAgQzI3LjUsMjAuMjQ1NDU5OSAyNy4zMjMxMjQ4LDIwLjQ0OTYwODQgMjcuMDg5ODc1NiwyMC40OTE5NDQzIEwyNywyMC41IEwyMiwyMC41IEMyMS43MjM4NTc2LDIwLjUgMjEuNSwyMC4yNzYxNDI0IDIxLjUsMjAgQzIxLjUsMTkuNzU0NTQwMSAyMS42NzY4NzUyLDE5LjU1MDM5MTYgMjEuOTEwMTI0NCwxOS41MDgwNTU3IEwyMiwxOS41IEwyNywxOS41IFogTTE4LDE5LjUgQzE4LjI3NjE0MjQsMTkuNSAxOC41LDE5LjcyMzg1NzYgMTguNSwyMCBDMTguNSwyMC4yNDU0NTk5IDE4LjMyMzEyNDgsMjAuNDQ5NjA4NCAxOC4wODk4NzU2LDIwLjQ5MTk0NDMgTDE4LDIwLjUgTDEzLDIwLjUgQzEyLjcyMzg1NzYsMjAuNSAxMi41LDIwLjI3NjE0MjQgMTIuNSwyMCBDMTIuNSwxOS43NTQ1NDAxIDEyLjY3Njg3NTIsMTkuNTUwMzkxNiAxMi45MTAxMjQ0LDE5LjUwODA1NTcgTDEzLDE5LjUgTDE4LDE5LjUgWiBNMjAsMTIuNSBDMjAuMjQ1NDU5OSwxMi41IDIwLjQ0OTYwODQsMTIuNjc2ODc1MiAyMC40OTE5NDQzLDEyLjkxMDEyNDQgTDIwLjUsMTMgTDIwLjUsMTggQzIwLjUsMTguMjc2MTQyNCAyMC4yNzYxNDI0LDE4LjUgMjAsMTguNSBDMTkuNzU0NTQwMSwxOC41IDE5LjU1MDM5MTYsMTguMzIzMTI0OCAxOS41MDgwNTU3LDE4LjA4OTg3NTYgTDE5LjUsMTggTDE5LjUsMTMgQzE5LjUsMTIuNzIzODU3NiAxOS43MjM4NTc2LDEyLjUgMjAsMTIuNSBaIiBpZD0i5b2i54q257uT5ZCIIiBmaWxsPSIjMjEyMzI0IiBmaWxsLXJ1bGU9Im5vbnplcm8iPjwvcGF0aD4KICAgICAgICAgICAgPC9nPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+", PP = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNDdweCIgaGVpZ2h0PSI0MHB4IiB2aWV3Qm94PSIwIDAgNDcgNDAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDYwLjEgKDg4MTMzKSAtIGh0dHBzOi8vc2tldGNoLmNvbSAtLT4KICAgIDx0aXRsZT50ZXh0LWN1cnNvcjwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPgogICAgICAgIDxwYXRoIGQ9Ik0xNiwyNi41IEMxNS43MjM4NTc2LDI2LjUgMTUuNSwyNi4yNzYxNDI0IDE1LjUsMjYgQzE1LjUsMjUuNzU0NTQwMSAxNS42NzY4NzUyLDI1LjU1MDM5MTYgMTUuOTEwMTI0NCwyNS41MDgwNTU3IEwxNiwyNS41IEwxOS41LDI1LjUgTDE5LjUsMTQuNSBMMTYsMTQuNSBDMTUuNzIzODU3NiwxNC41IDE1LjUsMTQuMjc2MTQyNCAxNS41LDE0IEMxNS41LDEzLjc1NDU0MDEgMTUuNjc2ODc1MiwxMy41NTAzOTE2IDE1LjkxMDEyNDQsMTMuNTA4MDU1NyBMMTYsMTMuNSBMMjQsMTMuNSBDMjQuMjc2MTQyNCwxMy41IDI0LjUsMTMuNzIzODU3NiAyNC41LDE0IEMyNC41LDE0LjI0NTQ1OTkgMjQuMzIzMTI0OCwxNC40NDk2MDg0IDI0LjA4OTg3NTYsMTQuNDkxOTQ0MyBMMjQsMTQuNSBMMjAuNSwxNC41IEwyMC41LDI1LjUgTDI0LDI1LjUgQzI0LjI3NjE0MjQsMjUuNSAyNC41LDI1LjcyMzg1NzYgMjQuNSwyNiBDMjQuNSwyNi4yNDU0NTk5IDI0LjMyMzEyNDgsMjYuNDQ5NjA4NCAyNC4wODk4NzU2LDI2LjQ5MTk0NDMgTDI0LDI2LjUgTDE2LDI2LjUgWiIgaWQ9InBhdGgtMSI+PC9wYXRoPgogICAgICAgIDxmaWx0ZXIgeD0iLTI4NC4wJSIgeT0iLTgxLjUlIiB3aWR0aD0iNjY4LjElIiBoZWlnaHQ9IjI5My45JSIgZmlsdGVyVW5pdHM9Im9iamVjdEJvdW5kaW5nQm94IiBpZD0iZmlsdGVyLTIiPgogICAgICAgICAgICA8ZmVNb3JwaG9sb2d5IHJhZGl1cz0iMSIgb3BlcmF0b3I9ImRpbGF0ZSIgaW49IlNvdXJjZUFscGhhIiByZXN1bHQ9InNoYWRvd1NwcmVhZE91dGVyMSI+PC9mZU1vcnBob2xvZ3k+CiAgICAgICAgICAgIDxmZU9mZnNldCBkeD0iMCIgZHk9IjIiIGluPSJzaGFkb3dTcHJlYWRPdXRlcjEiIHJlc3VsdD0ic2hhZG93T2Zmc2V0T3V0ZXIxIj48L2ZlT2Zmc2V0PgogICAgICAgICAgICA8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIzIiBpbj0ic2hhZG93T2Zmc2V0T3V0ZXIxIiByZXN1bHQ9InNoYWRvd0JsdXJPdXRlcjEiPjwvZmVHYXVzc2lhbkJsdXI+CiAgICAgICAgICAgIDxmZUNvbXBvc2l0ZSBpbj0ic2hhZG93Qmx1ck91dGVyMSIgaW4yPSJTb3VyY2VBbHBoYSIgb3BlcmF0b3I9Im91dCIgcmVzdWx0PSJzaGFkb3dCbHVyT3V0ZXIxIj48L2ZlQ29tcG9zaXRlPgogICAgICAgICAgICA8ZmVDb2xvck1hdHJpeCB2YWx1ZXM9IjAgMCAwIDAgMCAgIDAgMCAwIDAgMCAgIDAgMCAwIDAgMCAgMCAwIDAgMC4xNiAwIiB0eXBlPSJtYXRyaXgiIGluPSJzaGFkb3dCbHVyT3V0ZXIxIj48L2ZlQ29sb3JNYXRyaXg+CiAgICAgICAgPC9maWx0ZXI+CiAgICA8L2RlZnM+CiAgICA8ZyBpZD0i6aG16Z2iLTQiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxnIGlkPSJXaGl0ZWJvYXJkLUd1aWRlbGluZXMiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zODguMDAwMDAwLCAtNjcyLjAwMDAwMCkiPgogICAgICAgICAgICA8ZyBpZD0idGV4dC1jdXJzb3IiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDM5Mi4wMDAwMDAsIDY3Mi4wMDAwMDApIj4KICAgICAgICAgICAgICAgIDxyZWN0IGlkPSLnn6nlvaLlpIfku70tNDAiIGZpbGw9IiNGRkZGRkYiIG9wYWNpdHk9IjAuMDEiIHg9IjAiIHk9IjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcng9IjIiPjwvcmVjdD4KICAgICAgICAgICAgICAgIDxnIGlkPSLlvaLnirbnu5PlkIgiIGZpbGwtcnVsZT0ibm9uemVybyI+CiAgICAgICAgICAgICAgICAgICAgPHVzZSBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIxIiBmaWx0ZXI9InVybCgjZmlsdGVyLTIpIiB4bGluazpocmVmPSIjcGF0aC0xIj48L3VzZT4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMSIgZD0iTTE5LDI1IEwxOSwxNSBMMTYsMTUgQzE1LjQ0NzcxNTMsMTUgMTUsMTQuNTUyMjg0NyAxNSwxNCBDMTUsMTMuNTE0NTg5NyAxNS4zNDc5OTkzLDEzLjEwMTkxNSAxNS44NjU0ODc3LDEzLjAxMDA1MjEgTDE2LDEzIEwyNCwxMyBDMjQuNTUyMjg0NywxMyAyNSwxMy40NDc3MTUzIDI1LDE0IEMyNSwxNC40ODU0MTAzIDI0LjY1MjAwMDcsMTQuODk4MDg1IDI0LjEzNDUxMjMsMTQuOTg5OTQ3OSBMMjQsMTUgTDIxLDE1IEwyMSwyNSBMMjQsMjUgQzI0LjU1MjI4NDcsMjUgMjUsMjUuNDQ3NzE1MyAyNSwyNiBDMjUsMjYuNDg1NDEwMyAyNC42NTIwMDA3LDI2Ljg5ODA4NSAyNC4xMzQ1MTIzLDI2Ljk4OTk0NzkgTDI0LDI3IEwxNiwyNyBDMTUuNDQ3NzE1MywyNyAxNSwyNi41NTIyODQ3IDE1LDI2IEMxNSwyNS41MTQ1ODk3IDE1LjM0Nzk5OTMsMjUuMTAxOTE1IDE1Ljg2NTQ4NzcsMjUuMDEwMDUyMSBMMTYsMjUgTDE5LDI1IFoiIGZpbGw9IiMyMTIzMjQiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PC9wYXRoPgogICAgICAgICAgICAgICAgPC9nPgogICAgICAgICAgICA8L2c+CiAgICAgICAgPC9nPgogICAgPC9nPgo8L3N2Zz4=", _P = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMjhweCIgaGVpZ2h0PSIyOHB4IiB2aWV3Qm94PSIwIDAgMjggMjgiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDU1LjEgKDc4MTM2KSAtIGh0dHBzOi8vc2tldGNoYXBwLmNvbSAtLT4KICAgIDx0aXRsZT7nvJbnu4QgMjwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPgogICAgICAgIDxmaWx0ZXIgeD0iLTEyMC4wJSIgeT0iLTEyMC4wJSIgd2lkdGg9IjM0MC4wJSIgaGVpZ2h0PSIzNDAuMCUiIGZpbHRlclVuaXRzPSJvYmplY3RCb3VuZGluZ0JveCIgaWQ9ImZpbHRlci0xIj4KICAgICAgICAgICAgPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iNCIgaW49IlNvdXJjZUdyYXBoaWMiPjwvZmVHYXVzc2lhbkJsdXI+CiAgICAgICAgPC9maWx0ZXI+CiAgICA8L2RlZnM+CiAgICA8ZyBpZD0i6aG16Z2iMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9Iue8lue7hC0yIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg5LjAwMDAwMCwgOS4wMDAwMDApIiBmaWxsPSIjRkYwMTAwIj4KICAgICAgICAgICAgPGNpcmNsZSBpZD0i5qSt5ZyG5b2iIiBmaWx0ZXI9InVybCgjZmlsdGVyLTEpIiBjeD0iNSIgY3k9IjUiIHI9IjUiPjwvY2lyY2xlPgogICAgICAgICAgICA8cGF0aCBkPSJNNSw4IEM2LjY1Njg1NDI1LDggOCw2LjY1Njg1NDI1IDgsNSBDOCwzLjM0MzE0NTc1IDYuNjU2ODU0MjUsMiA1LDIgQzMuMzQzMTQ1NzUsMiAyLDMuMzQzMTQ1NzUgMiw1IEMyLDYuNjU2ODU0MjUgMy4zNDMxNDU3NSw4IDUsOCBaIE01LDYuMjg1NzE0MjkgQzQuMjg5OTE5NjEsNi4yODU3MTQyOSAzLjcxNDI4NTcxLDUuNzEwMDgwMzkgMy43MTQyODU3MSw1IEMzLjcxNDI4NTcxLDQuMjg5OTE5NjEgNC4yODk5MTk2MSwzLjcxNDI4NTcxIDUsMy43MTQyODU3MSBDNS43MTAwODAzOSwzLjcxNDI4NTcxIDYuMjg1NzE0MjksNC4yODk5MTk2MSA2LjI4NTcxNDI5LDUgQzYuMjg1NzE0MjksNS43MTAwODAzOSA1LjcxMDA4MDM5LDYuMjg1NzE0MjkgNSw2LjI4NTcxNDI5IFoiIGlkPSLmpK3lnIblvaIiIGZpbGwtcnVsZT0ibm9uemVybyI+PC9wYXRoPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+", zP = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMjYiIHZpZXdCb3g9IjAgMCAxOCAyNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMC41IiB5PSIwLjUiIHdpZHRoPSIxNyIgaGVpZ2h0PSIyNSIgcng9IjMuNSIgZmlsbD0iYmxhY2siIGZpbGwtb3BhY2l0eT0iMC4zNSIgc3Ryb2tlPSJ3aGl0ZSIvPgo8L3N2Zz4K", OP = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjYiIGhlaWdodD0iMzQiIHZpZXdCb3g9IjAgMCAyNiAzNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMC41IiB5PSIwLjUiIHdpZHRoPSIyNSIgaGVpZ2h0PSIzMyIgcng9IjMuNSIgZmlsbD0iYmxhY2siIGZpbGwtb3BhY2l0eT0iMC4zNSIgc3Ryb2tlPSJ3aGl0ZSIvPgo8L3N2Zz4K", LP = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzQiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCAzNCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMC41IiB5PSIwLjUiIHdpZHRoPSIzMyIgaGVpZ2h0PSI0OSIgcng9IjMuNSIgZmlsbD0iYmxhY2siIGZpbGwtb3BhY2l0eT0iMC4zNSIgc3Ryb2tlPSJ3aGl0ZSIvPgo8L3N2Zz4K", BP = {
  [Dn.pencil]: RP,
  [Dn.selector]: DP,
  [Dn.eraser]: NP,
  [Dn.shape]: kP,
  [Dn.text]: PP,
  [Dn.laserPointer]: _P,
  pencilEraser1: zP,
  pencilEraser2: OP,
  pencilEraser3: LP
}, TT = "local-cursor";
class jP {
  constructor(i, o, c, h) {
    var g;
    this.manager = i, this.enableCursor = o, this.cursorInstances = /* @__PURE__ */ new Map(), this.userApplianceIcons = {}, this.sideEffectManager = new lp(), this.store = this.manager.store, this.leaveFlag = !0, this._style = "default", this.onCursorMove = (S) => {
      const C = this.initCursorInstance(S.uid);
      if (S.state === Lb.Leave)
        C.leave();
      else {
        const A = C.updateMember();
        this.canMoveCursor(A) && C.move(S.position);
      }
    }, this.initCursorInstance = (S) => {
      let C = this.cursorInstances.get(S);
      return C || (C = new AP(this.manager, S, this, Qt.wrapper), this.cursorInstances.set(S, C)), C;
    }, this.mouseMoveListener_ = (S, C) => {
      const A = this.getType(S);
      this.updateCursor(A, S.clientX, S.clientY), C && this.showPencilEraserIfNeeded(A, S.clientX, S.clientY);
    }, this.mouseMoveTimer = 0, this.mouseMoveListener = (S) => {
      const C = S.pointerType === "touch";
      if (C && !S.isPrimary)
        return;
      const A = Date.now();
      if (A - this.mouseMoveTimer > 48) {
        if (this.mouseMoveTimer = A, Qt.supportAppliancePlugin && Du(Qt.displayer) && Qt.displayer.disableDeviceInputs) {
          this.leaveFlag && (this.manager.dispatchInternalEvent(Xt.CursorMove, {
            uid: this.manager.uid,
            state: Lb.Leave
          }), this.leaveFlag = !1);
          return;
        }
        this.mouseMoveListener_(S, C), this.leaveFlag = !0;
      }
    }, this.mouseLeaveListener = () => {
      this.hideCursor(this.manager.uid);
    }, this.getPoint = (S, C, A) => {
      var z;
      const I = (z = S == null ? void 0 : S.divElement) == null ? void 0 : z.getBoundingClientRect();
      if (I)
        return S == null ? void 0 : S.convertToPointInWorld({
          x: C - I.x,
          y: A - I.y
        });
    }, this.getType = (S) => {
      var I;
      const C = S.target, A = this.manager.focusApp;
      switch (C.parentElement) {
        case this.mainViewElement:
          return { type: "main" };
        case ((I = A == null ? void 0 : A.view) == null ? void 0 : I.divElement):
          return { type: "app" };
        default:
          return { type: "main" };
      }
    }, this.roomMembers = (g = this.manager.room) == null ? void 0 : g.state.roomMembers;
    const m = Qt.wrapper;
    m && this.setupWrapper(m), this.sideEffectManager.add(() => Ke.on("cursorMove", this.onCursorMove)), this.sideEffectManager.add(() => Ke.on("playgroundSizeChange", () => this.updateContainerRect()));
    const y = this.manager.room;
    y && this.sideEffectManager.add(() => {
      const S = (C) => {
        this.style === "custom" && C.memberState && this.enableCustomCursor();
      };
      return y.callbacks.on("onRoomStateChanged", S), () => y.callbacks.off("onRoomStateChanged", S);
    }), h && (this.userApplianceIcons = h), this.style = (c == null ? void 0 : c.style) || "default";
  }
  get applianceIcons() {
    return { ...BP, ...this.userApplianceIcons };
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
      () => EP(this.manager.getMemberState()),
      TT
    );
  }
  canMoveCursor(i) {
    const o = (i == null ? void 0 : i.memberState.currentApplianceName) === Dn.laserPointer;
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
    const h = Ub(this.manager.room, this.manager.uid), m = (h == null ? void 0 : h.memberState.currentApplianceName) === Dn.pencilEraser;
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
    const h = Ub(this.manager.room, this.manager.uid);
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
    this.containerRect = (i = Qt.container) == null ? void 0 : i.getBoundingClientRect(), this.wrapperRect = (o = Qt.wrapper) == null ? void 0 : o.getBoundingClientRect();
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
class UP {
  constructor(i) {
    this.manager = i, Ke.on("changePageState", () => {
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
class VP {
  constructor(i) {
    this.ctx = i, this.reactors = /* @__PURE__ */ new Map(), this.disposers = /* @__PURE__ */ new Map(), this.onPhaseChanged = async (o) => {
      var c, h;
      o === Nu.Reconnecting && this.ctx.emitter.emit("startReconnect"), o === Nu.Connected && this.phase === Nu.Reconnecting && ((c = this.room) != null && c.isWritable ? (h = this.room) == null || h.dispatchMagixEvent(ob, {}) : (await vM(500), this.onReconnected())), this.phase = o;
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
const HP = (r, i) => {
  if (rS(r))
    FP(r);
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
    }), r.moveCamera = (c) => i.moveCamera(c), r.moveCameraToContain = (...c) => i.moveCameraToContain(...c), r.convertToPointInWorld = (...c) => i.mainView.convertToPointInWorld(...c), r.setCameraBound = (...c) => i.mainView.setCameraBound(...c), r.scenePreview = (...c) => i.mainView.scenePreview(...c), r.fillSceneSnapshot = (...c) => i.mainView.fillSceneSnapshot(...c), r.generateScreenshot = (...c) => i.mainView.generateScreenshot(...c), r.setMemberState = (...c) => i.mainView.setMemberState(...c), r.redo = () => i.redo(), r.undo = () => i.undo(), r.cleanCurrentScene = () => i.cleanCurrentScene(), r.delete = () => i.delete(), r.copy = () => i.copy(), r.paste = () => i.paste(), r.duplicate = () => i.duplicate(), r.insertImage = (...c) => i.insertImage(...c), r.completeImageUpload = (...c) => i.completeImageUpload(...c), r.insertText = (...c) => i.insertText(...c), r.lockImage = (...c) => i.lockImage(...c), r.lockImages = (...c) => i.lockImages(...c), WP(r, i);
  }
}, WP = (r, i) => {
  const o = r.removeScenes;
  r.removeScenes = (c, h) => {
    var y;
    c === Cr && ((y = i.appManager) == null || y.updateRootDirRemoving(!0));
    const m = o.call(r, c);
    return Ke.emit("removeScenes", { scenePath: c, index: h }), m;
  };
}, FP = (r) => {
  const i = r.seekToProgressTime;
  async function o(c) {
    await Ke.emit("seekStart");
    const h = await i.call(r, c);
    return Ke.emit("seek", c), h;
  }
  r.seekToProgressTime = o;
};
var $P = Object.defineProperty, QP = Object.defineProperties, ZP = Object.getOwnPropertyDescriptors, MT = Object.getOwnPropertySymbols, YP = Object.prototype.hasOwnProperty, GP = Object.prototype.propertyIsEnumerable, ET = (r, i, o) => i in r ? $P(r, i, { enumerable: !0, configurable: !0, writable: !0, value: o }) : r[i] = o, ZM = (r, i) => {
  for (var o in i || (i = {}))
    YP.call(i, o) && ET(r, o, i[o]);
  if (MT)
    for (var o of MT(i))
      GP.call(i, o) && ET(r, o, i[o]);
  return r;
}, YM = (r, i) => QP(r, ZP(i)), XP = /* @__PURE__ */ (() => `.netless-app-docs-viewer-content{position:relative;height:100%;overflow:hidden}.netless-app-docs-viewer-preview-mask{display:none;position:absolute;z-index:200;top:0;left:0;width:100%;height:100%}.netless-app-docs-viewer-preview{display:flex;flex-direction:column;align-items:center;z-index:300;top:0;right:0;width:23%;padding:12px;transform:translate(100%);box-shadow:-4.8px -3.2px 20px #20233826;transition:transform .4s;background:#f5f5fc;border-radius:4px;-webkit-box-shadow:-4.8px -3.2px 20px rgba(32,35,56,.15);height:100%;position:absolute;opacity:0}.netless-app-docs-viewer-preview-active .netless-app-docs-viewer-preview-mask{display:block}.netless-app-docs-viewer-preview-active .netless-app-docs-viewer-preview{transform:translate(0);opacity:1}.netless-app-docs-viewer-preview-head{display:flex;align-items:center;justify-content:space-between;width:100%;margin-bottom:10px}.netless-app-docs-viewer-preview-head>h3{color:#484c70;font-weight:400;font-size:14px;width:calc(100% - 20px);overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;white-space:nowrap}.netless-app-docs-viewer-preview-head .netless-app-docs-viewer-close{width:25px;height:25px;padding:0;outline:none;border:none;background:#fff;display:flex;justify-content:center;align-items:center;border-radius:100%;cursor:pointer}.netless-app-docs-viewer-preview-head .netless-app-docs-viewer-close button{width:22px;height:22px;padding:0;outline:none;border:none;background:center/cover no-repeat;background-image:url(./icons/close.svg)}.netless-app-docs-viewer-preview-page{position:relative;display:flex;width:100%;margin-bottom:10px;font-size:0;color:transparent;outline:none;border-radius:4px;transition:border-color .3s;user-select:none;align-items:flex-end}.netless-app-docs-viewer-preview-page>img{width:calc(90% - 10px);height:auto;box-sizing:border-box;border:2px solid rgba(0,0,0,.5);border-radius:2px;background-color:#fff}.netless-app-docs-viewer-preview-page>img.netless-app-docs-viewer-active{border-color:#ff5353}.netless-app-docs-viewer-preview-page-name{text-align:right;font-size:12px;color:#8d8fa6;user-select:none;margin-right:10px;width:5%}.netless-app-docs-viewer-footer{box-sizing:border-box;height:40px;display:flex;align-items:center;padding:0 16px;color:#191919;background:#ebecfa}.netless-app-docs-viewer-float-footer{width:100%;min-height:40px;position:absolute;left:0;bottom:0;z-index:2000;transition:opacity .4s;color:#191919}.netless-app-docs-viewer-footer-btn{box-sizing:border-box;width:26px;height:26px;font-size:0;margin:0;padding:3px;border:none;border-radius:4px;outline:none;color:currentColor;background:transparent;transition:background .4s;cursor:pointer;user-select:none;-webkit-tap-highlight-color:rgba(0,0,0,0);color:#8d8fa6}.netless-app-docs-viewer-footer-btn.netless-app-docs-viewer-footer-btn-disable{color:#c6c7d2;cursor:not-allowed}.netless-app-docs-viewer-footer-btn.netless-app-docs-viewer-footer-btn-disable .arrow{fill:#c6c7d2}.netless-app-docs-viewer-footer-btn .arrow{fill:#8d8fa6}.netless-app-docs-viewer-footer-btn:hover{background-color:#1b1f4d0a}@media (hover: none){.netless-app-docs-viewer-footer-btn:hover{background:transparent!important}}.netless-app-docs-viewer-footer-btn>svg{width:100%;height:100%}.netless-app-docs-viewer-footer-btn>svg:nth-of-type(2){display:none}.netless-app-docs-viewer-footer-btn.netless-app-docs-viewer-footer-btn-playing>svg:nth-of-type(1){display:none}.netless-app-docs-viewer-footer-btn.netless-app-docs-viewer-footer-btn-playing>svg:nth-of-type(2){display:initial}.netless-app-docs-viewer-hide{display:none}.netless-app-docs-viewer-page-jumps{flex:1;display:flex;justify-content:center;align-items:center;gap:8px}.netless-app-docs-viewer-page-number{font-size:14px;color:#8d8fa6;user-select:none;white-space:nowrap;word-break:keep-all}.netless-app-docs-viewer-page-number-input{border:none;outline:none;width:3em;margin:0;padding:0 2px;text-align:right;font-size:13px;line-height:1;font-weight:400;font-family:inherit;border-radius:2px;color:currentColor;background:transparent;transition:background .4s;user-select:text;-webkit-tap-highlight-color:rgba(0,0,0,0)}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-footer-btn{cursor:not-allowed}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-footer-btn:hover{background:transparent}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input{cursor:not-allowed}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input:hover,.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input:focus,.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input:active{background:transparent;box-shadow:none}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-page-number-input:disabled{color:inherit}.netless-app-docs-viewer-readonly.netless-app-docs-viewer-float-footer{display:none}.telebox-color-scheme-dark .netless-app-docs-viewer-page-number-input{color:#a6a6a8}.telebox-color-scheme-dark .netless-app-docs-viewer-page-number-input:active,.telebox-color-scheme-dark .netless-app-docs-viewer-page-number-input:focus,.telebox-color-scheme-dark .netless-app-docs-viewer-page-number-input:hover{color:#222}.telebox-color-scheme-dark .netless-app-docs-viewer-footer{color:#a6a6a8;background:#2d2d33;border-top:none}.telebox-color-scheme-dark .netless-app-docs-viewer-footer-btn:hover{background:#212126}.telebox-color-scheme-dark .netless-app-docs-viewer-preview{background:rgba(50,50,50,.9)}.netless-app-docs-viewer-static-scrollbar{position:absolute;top:0;right:0;z-index:2147483647;width:8px;min-height:30px;margin:0;padding:0;border:none;outline:none;border-radius:4px;background:rgba(68,78,96,.4);box-shadow:1px 1px 8px #ffffffb3;opacity:0;transition:background .4s,opacity .4s 3s,transform .2s;user-select:none}.netless-app-docs-viewer-static-scrollbar.netless-app-docs-viewer-static-scrollbar-dragging{background:rgba(68,78,96,.6);opacity:1;transition:background .4s,opacity .4s 3s!important}.netless-app-docs-viewer-static-scrollbar:hover,.netless-app-docs-viewer-static-scrollbar:focus{background:rgba(68,78,96,.5)}.netless-app-docs-viewer-static-scrollbar:active{background:rgba(68,78,96,.6)}.netless-app-docs-viewer-content:hover .netless-app-docs-viewer-static-scrollbar{opacity:1;transition:background .4s,opacity .4s,transform .2s}.netless-app-docs-viewer-readonly .netless-app-docs-viewer-static-scrollbar{display:none}.netless-app-docs-viewer-static-pages:hover .netless-app-docs-viewer-static-scrollbar{opacity:1;transition:background .4s,opacity .4s,transform .2s}.page-renderer-pages-container{position:relative;overflow:hidden}.page-renderer-page{position:absolute;top:0;left:0;background-position:center;background-size:cover;background-repeat:no-repeat}.page-renderer-pages-container.is-hwa .page-renderer-page{will-change:transform}.page-renderer-page-img{display:block;width:100%;height:auto;user-select:none}.netless-app-docs-viewer-static-pages{overflow:hidden;position:relative;height:100%;user-select:none}.netless-app-docs-viewer-static-page{display:block;width:100%;height:auto;user-select:none}.netless-app-docs-viewer-static-wb-view,.netless-app-docs-viewer-dynamic-wb-view{position:absolute;top:0;left:0;width:100%;height:100%;z-index:100;overflow:auto}.netless-app-docs-viewer-dynamic-wb-view .cursor-clicker .ppt-event-source{cursor:pointer}
`)();
const JP = (r, i, o, c) => {
  if (o === "length" || o === "prototype" || o === "arguments" || o === "caller")
    return;
  const h = Object.getOwnPropertyDescriptor(r, o), m = Object.getOwnPropertyDescriptor(i, o);
  !qP(h, m) && c || Object.defineProperty(r, o, m);
}, qP = function(r, i) {
  return r === void 0 || r.configurable || r.writable === i.writable && r.enumerable === i.enumerable && r.configurable === i.configurable && (r.writable || r.value === i.value);
}, KP = (r, i) => {
  const o = Object.getPrototypeOf(i);
  o !== Object.getPrototypeOf(r) && Object.setPrototypeOf(r, o);
}, e_ = (r, i) => `/* Wrapped ${r}*/
${i}`, t_ = Object.getOwnPropertyDescriptor(Function.prototype, "toString"), n_ = Object.getOwnPropertyDescriptor(Function.prototype.toString, "name"), i_ = (r, i, o) => {
  const c = o === "" ? "" : `with ${o.trim()}() `, h = e_.bind(null, c, i.toString());
  Object.defineProperty(h, "name", n_), Object.defineProperty(r, "toString", YM(ZM({}, t_), { value: h }));
};
function r_(r, i, { ignoreNonConfigurable: o = !1 } = {}) {
  const { name: c } = r;
  for (const h of Reflect.ownKeys(i))
    JP(r, i, h, o);
  return KP(r, i), i_(r, i, c), r;
}
const a_ = (r, i = {}) => {
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
  let y, g, S;
  const C = function(...A) {
    const I = this, z = () => {
      y = void 0, g && (clearTimeout(g), g = void 0), m && (S = r.apply(I, A));
    }, F = () => {
      g = void 0, y && (clearTimeout(y), y = void 0), m && (S = r.apply(I, A));
    }, $ = h && !y;
    return clearTimeout(y), y = setTimeout(z, o), c > 0 && c !== Number.Infinity && !g && (g = setTimeout(F, c)), $ && (S = r.apply(I, A)), S;
  };
  return r_(C, r), C.cancel = () => {
    y && (clearTimeout(y), y = void 0), g && (clearTimeout(g), g = void 0);
  }, C;
}, s_ = "!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", o_ = 87, l_ = 20, IT = [], u_ = () => {
  for (let r = 0; r < l_; r++)
    IT[r] = s_.charAt(Math.random() * o_);
  return IT.join("");
};
function GM(r) {
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
    return this.flush(o), this.disposers.set(o, Array.isArray(i) ? c_(i) : i), o;
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
    this.disposers.forEach(GM), this.disposers.clear();
  }
  genUID() {
    let i;
    do
      i = u_();
    while (this.disposers.has(i));
    return i;
  }
}
function c_(r) {
  return () => r.forEach(GM);
}
var ku = [], d_ = function() {
  return ku.some(function(r) {
    return r.activeTargets.length > 0;
  });
}, f_ = function() {
  return ku.some(function(r) {
    return r.skippedTargets.length > 0;
  });
}, AT = "ResizeObserver loop completed with undelivered notifications.", h_ = function() {
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
}, p_ = function() {
  function r(i, o) {
    this.inlineSize = i, this.blockSize = o, Pu(this);
  }
  return r;
}(), XM = function() {
  function r(i, o, c, h) {
    return this.x = i, this.y = o, this.width = c, this.height = h, this.top = this.y, this.left = this.x, this.bottom = this.top + this.height, this.right = this.left + this.width, Pu(this);
  }
  return r.prototype.toJSON = function() {
    var i = this, o = i.x, c = i.y, h = i.top, m = i.right, y = i.bottom, g = i.left, S = i.width, C = i.height;
    return { x: o, y: c, top: h, right: m, bottom: y, left: g, width: S, height: C };
  }, r.fromRect = function(i) {
    return new r(i.x, i.y, i.width, i.height);
  }, r;
}(), wS = function(r) {
  return r instanceof SVGElement && "getBBox" in r;
}, JM = function(r) {
  if (wS(r)) {
    var i = r.getBBox(), o = i.width, c = i.height;
    return !o && !c;
  }
  var h = r, m = h.offsetWidth, y = h.offsetHeight;
  return !(m || y || r.getClientRects().length);
}, RT = function(r) {
  var i, o;
  if (r instanceof Element)
    return !0;
  var c = (o = (i = r) === null || i === void 0 ? void 0 : i.ownerDocument) === null || o === void 0 ? void 0 : o.defaultView;
  return !!(c && r instanceof c.Element);
}, m_ = function(r) {
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
}, tp = typeof window < "u" ? window : {}, Fv = /* @__PURE__ */ new WeakMap(), DT = /auto|scroll/, v_ = /^tb|vertical/, g_ = /msie|trident/i.test(tp.navigator && tp.navigator.userAgent), gs = function(r) {
  return parseFloat(r || "0");
}, Id = function(r, i, o) {
  return r === void 0 && (r = 0), i === void 0 && (i = 0), o === void 0 && (o = !1), new p_((o ? i : r) || 0, (o ? r : i) || 0);
}, NT = Pu({
  devicePixelContentBoxSize: Id(),
  borderBoxSize: Id(),
  contentBoxSize: Id(),
  contentRect: new XM(0, 0, 0, 0)
}), qM = function(r, i) {
  if (i === void 0 && (i = !1), Fv.has(r) && !i)
    return Fv.get(r);
  if (JM(r))
    return Fv.set(r, NT), NT;
  var o = getComputedStyle(r), c = wS(r) && r.ownerSVGElement && r.getBBox(), h = !g_ && o.boxSizing === "border-box", m = v_.test(o.writingMode || ""), y = !c && DT.test(o.overflowY || ""), g = !c && DT.test(o.overflowX || ""), S = c ? 0 : gs(o.paddingTop), C = c ? 0 : gs(o.paddingRight), A = c ? 0 : gs(o.paddingBottom), I = c ? 0 : gs(o.paddingLeft), z = c ? 0 : gs(o.borderTopWidth), F = c ? 0 : gs(o.borderRightWidth), $ = c ? 0 : gs(o.borderBottomWidth), K = c ? 0 : gs(o.borderLeftWidth), q = I + C, fe = S + A, se = K + F, Z = z + $, ce = g ? r.offsetHeight - Z - r.clientHeight : 0, oe = y ? r.offsetWidth - se - r.clientWidth : 0, Oe = h ? q + se : 0, $e = h ? fe + Z : 0, je = c ? c.width : gs(o.width) - Oe - oe, Y = c ? c.height : gs(o.height) - $e - ce, he = je + q + oe + se, Ee = Y + fe + ce + Z, ie = Pu({
    devicePixelContentBoxSize: Id(Math.round(je * devicePixelRatio), Math.round(Y * devicePixelRatio), m),
    borderBoxSize: Id(he, Ee, m),
    contentBoxSize: Id(je, Y, m),
    contentRect: new XM(I, S, je, Y)
  });
  return Fv.set(r, ie), ie;
}, KM = function(r, i, o) {
  var c = qM(r, o), h = c.borderBoxSize, m = c.contentBoxSize, y = c.devicePixelContentBoxSize;
  switch (i) {
    case sp.DEVICE_PIXEL_CONTENT_BOX:
      return y;
    case sp.BORDER_BOX:
      return h;
    default:
      return m;
  }
}, y_ = function() {
  function r(i) {
    var o = qM(i);
    this.target = i, this.contentRect = o.contentRect, this.borderBoxSize = Pu([o.borderBoxSize]), this.contentBoxSize = Pu([o.contentBoxSize]), this.devicePixelContentBoxSize = Pu([o.devicePixelContentBoxSize]);
  }
  return r;
}(), eE = function(r) {
  if (JM(r))
    return 1 / 0;
  for (var i = 0, o = r.parentNode; o; )
    i += 1, o = o.parentNode;
  return i;
}, w_ = function() {
  var r = 1 / 0, i = [];
  ku.forEach(function(y) {
    if (y.activeTargets.length !== 0) {
      var g = [];
      y.activeTargets.forEach(function(C) {
        var A = new y_(C.target), I = eE(C.target);
        g.push(A), C.lastReportedSize = KM(C.target, C.observedBox), I < r && (r = I);
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
}, kT = function(r) {
  ku.forEach(function(o) {
    o.activeTargets.splice(0, o.activeTargets.length), o.skippedTargets.splice(0, o.skippedTargets.length), o.observationTargets.forEach(function(h) {
      h.isActive() && (eE(h.target) > r ? o.activeTargets.push(h) : o.skippedTargets.push(h));
    });
  });
}, b_ = function() {
  var r = 0;
  for (kT(r); d_(); )
    r = w_(), kT(r);
  return f_() && h_(), r > 0;
}, bb, tE = [], S_ = function() {
  return tE.splice(0).forEach(function(r) {
    return r();
  });
}, x_ = function(r) {
  if (!bb) {
    var i = 0, o = document.createTextNode(""), c = { characterData: !0 };
    new MutationObserver(function() {
      return S_();
    }).observe(o, c), bb = function() {
      o.textContent = "" + (i ? i-- : i++);
    };
  }
  tE.push(r), bb();
}, C_ = function(r) {
  x_(function() {
    requestAnimationFrame(r);
  });
}, eg = 0, T_ = function() {
  return !!eg;
}, M_ = 250, E_ = { attributes: !0, characterData: !0, childList: !0, subtree: !0 }, PT = [
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
}, Sb = !1, I_ = function() {
  function r() {
    var i = this;
    this.stopped = !0, this.listener = function() {
      return i.schedule();
    };
  }
  return r.prototype.run = function(i) {
    var o = this;
    if (i === void 0 && (i = M_), !Sb) {
      Sb = !0;
      var c = _T(i);
      C_(function() {
        var h = !1;
        try {
          h = b_();
        } finally {
          if (Sb = !1, i = c - _T(), !T_())
            return;
          h ? o.run(1e3) : i > 0 ? o.run(i) : o.start();
        }
      });
    }
  }, r.prototype.schedule = function() {
    this.stop(), this.run();
  }, r.prototype.observe = function() {
    var i = this, o = function() {
      return i.observer && i.observer.observe(document.body, E_);
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
}(), Xb = new I_(), zT = function(r) {
  !eg && r > 0 && Xb.start(), eg += r, !eg && Xb.stop();
}, A_ = function(r) {
  return !wS(r) && !m_(r) && getComputedStyle(r).display === "inline";
}, R_ = function() {
  function r(i, o) {
    this.target = i, this.observedBox = o || sp.CONTENT_BOX, this.lastReportedSize = {
      inlineSize: 0,
      blockSize: 0
    };
  }
  return r.prototype.isActive = function() {
    var i = KM(this.target, this.observedBox, !0);
    return A_(this.target) && (this.lastReportedSize = i), this.lastReportedSize.inlineSize !== i.inlineSize || this.lastReportedSize.blockSize !== i.blockSize;
  }, r;
}(), D_ = function() {
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
    var c = new D_(i, o);
    $v.set(i, c);
  }, r.observe = function(i, o, c) {
    var h = $v.get(i), m = h.observationTargets.length === 0;
    OT(h.observationTargets, o) < 0 && (m && ku.push(h), h.observationTargets.push(new R_(o, c && c.box)), zT(1), Xb.schedule());
  }, r.unobserve = function(i, o) {
    var c = $v.get(i), h = OT(c.observationTargets, o), m = c.observationTargets.length === 1;
    h >= 0 && (m && ku.splice(ku.indexOf(c), 1), c.observationTargets.splice(h, 1), zT(-1));
  }, r.disconnect = function(i) {
    var o = this, c = $v.get(i);
    c.observationTargets.slice().forEach(function(h) {
      return o.unobserve(i, h.target);
    }), c.activeTargets.splice(0, c.activeTargets.length);
  }, r;
}(), N_ = function() {
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
function k_(r) {
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
function P_(r) {
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
function __(r) {
  const i = "http://www.w3.org/2000/svg", o = document.createElementNS(i, "svg");
  o.setAttribute("class", `${r}-footer-icon-play`), o.setAttribute("viewBox", "0 0 500 500");
  const c = document.createElementNS(i, "path");
  return c.setAttribute("fill", "currentColor"), c.setAttribute("d", "M418.158 257.419L174.663 413.33c-6.017 3.919-15.708 3.772-21.291-.29-2.791-2.018-4.295-4.483-4.295-7.084V94.109c0-5.65 6.883-10.289 15.271-10.289 4.298 0 8.391 1.307 11.181 3.332l242.629 155.484c6.016 3.917 6.451 10.292.649 14.491-.216.154-.432.154-.649.292zM170.621 391.288l223.116-141.301L170.71 107.753l-.089 283.535z"), o.appendChild(c), o;
}
function z_(r) {
  const i = "http://www.w3.org/2000/svg", o = document.createElementNS(i, "svg");
  o.setAttribute("class", `${r}-footer-icon-pause`), o.setAttribute("viewBox", "0 0 500 500");
  const c = document.createElementNS(i, "path");
  return c.setAttribute("fill", "currentColor"), c.setAttribute("d", "M312.491 78.261c0-6.159 4.893-11.213 11.04-11.213 6.158 0 11.211 5.054 11.211 11.213v343.478c0 6.159-5.053 11.213-11.211 11.213-6.147 0-11.04-5.054-11.04-11.213V78.261zM165.257 78.261c0-6.159 4.893-11.213 11.04-11.213 6.158 0 11.211 5.054 11.211 11.213v343.478c0 6.159-5.053 11.213-11.211 11.213-6.147 0-11.04-5.054-11.04-11.213V78.261z"), o.appendChild(c), o;
}
const ul = typeof window < "u", nE = ul && !("onscroll" in window) || typeof navigator < "u" && /(gle|ing|ro)bot|crawl|spider/i.test(navigator.userAgent), iE = ul && "IntersectionObserver" in window, rE = ul && "classList" in document.createElement("p"), aE = ul && window.devicePixelRatio > 1, O_ = {
  elements_selector: ".lazy",
  container: nE || ul ? document : null,
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
}, sE = (r) => Object.assign({}, O_, r), LT = function(r, i) {
  let o;
  const c = "LazyLoad::Initialized", h = new r(i);
  try {
    o = new CustomEvent(c, { detail: { instance: h } });
  } catch {
    o = document.createEvent("CustomEvent"), o.initCustomEvent(c, !1, !1, { instance: h });
  }
  window.dispatchEvent(o);
}, L_ = (r, i) => {
  if (!!i)
    if (!i.length)
      LT(r, i);
    else
      for (let o = 0, c; c = i[o]; o += 1)
        LT(r, c);
}, go = "src", bS = "srcset", SS = "sizes", oE = "poster", dp = "llOriginalAttrs", lE = "data", xS = "loading", uE = "loaded", cE = "applied", B_ = "entered", CS = "error", dE = "native", fE = "data-", hE = "ll-status", er = (r, i) => r.getAttribute(fE + i), j_ = (r, i, o) => {
  var c = fE + i;
  if (o === null) {
    r.removeAttribute(c);
    return;
  }
  r.setAttribute(c, o);
}, fp = (r) => er(r, hE), Ou = (r, i) => j_(r, hE, i), pg = (r) => Ou(r, null), TS = (r) => fp(r) === null, U_ = (r) => fp(r) === xS, V_ = (r) => fp(r) === CS, MS = (r) => fp(r) === dE, H_ = [xS, uE, cE, CS], W_ = (r) => H_.indexOf(fp(r)) >= 0, cl = (r, i, o, c) => {
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
  if (rE) {
    r.classList.add(i);
    return;
  }
  r.className += (r.className ? " " : "") + i;
}, bs = (r, i) => {
  if (rE) {
    r.classList.remove(i);
    return;
  }
  r.className = r.className.replace(new RegExp("(^|\\s+)" + i + "(\\s+|$)"), " ").replace(/^\s+/, "").replace(/\s+$/, "");
}, F_ = (r) => {
  r.llTempImage = document.createElement("IMG");
}, $_ = (r) => {
  delete r.llTempImage;
}, pE = (r) => r.llTempImage, mg = (r, i) => {
  if (!i)
    return;
  const o = i._observer;
  !o || o.unobserve(r);
}, Q_ = (r) => {
  r.disconnect();
}, Z_ = (r, i, o) => {
  i.unobserve_entered && mg(r, o);
}, ES = (r, i) => {
  !r || (r.loadingCount += i);
}, Y_ = (r) => {
  !r || (r.toLoadCount -= 1);
}, mE = (r, i) => {
  !r || (r.toLoadCount = i);
}, G_ = (r) => r.loadingCount > 0, X_ = (r) => r.toLoadCount > 0, vE = (r) => {
  let i = [];
  for (let o = 0, c; c = r.children[o]; o += 1)
    c.tagName === "SOURCE" && i.push(c);
  return i;
}, IS = (r, i) => {
  const o = r.parentNode;
  if (!o || o.tagName !== "PICTURE")
    return;
  vE(o).forEach(i);
}, gE = (r, i) => {
  vE(r).forEach(i);
}, vg = [go], yE = [go, oE], op = [go, bS, SS], wE = [lE], gg = (r) => !!r[dp], bE = (r) => r[dp], SE = (r) => delete r[dp], Rd = (r, i) => {
  if (gg(r))
    return;
  const o = {};
  i.forEach((c) => {
    o[c] = r.getAttribute(c);
  }), r[dp] = o;
}, J_ = (r) => {
  gg(r) || (r[dp] = { backgroundImage: r.style.backgroundImage });
}, q_ = (r, i, o) => {
  if (!o) {
    r.removeAttribute(i);
    return;
  }
  r.setAttribute(i, o);
}, zu = (r, i) => {
  if (!gg(r))
    return;
  const o = bE(r);
  i.forEach((c) => {
    q_(r, c, o[c]);
  });
}, K_ = (r) => {
  if (!gg(r))
    return;
  const i = bE(r);
  r.style.backgroundImage = i.backgroundImage;
}, xE = (r, i, o) => {
  kd(r, i.class_applied), Ou(r, cE), o && (i.unobserve_completed && mg(r, i), cl(i.callback_applied, r, o));
}, CE = (r, i, o) => {
  kd(r, i.class_loading), Ou(r, xS), o && (ES(o, 1), cl(i.callback_loading, r, o));
}, ll = (r, i, o) => {
  !o || r.setAttribute(i, o);
}, BT = (r, i) => {
  ll(r, SS, er(r, i.data_sizes)), ll(r, bS, er(r, i.data_srcset)), ll(r, go, er(r, i.data_src));
}, ez = (r, i) => {
  IS(r, (o) => {
    Rd(o, op), BT(o, i);
  }), Rd(r, op), BT(r, i);
}, tz = (r, i) => {
  Rd(r, vg), ll(r, go, er(r, i.data_src));
}, nz = (r, i) => {
  gE(r, (o) => {
    Rd(o, vg), ll(o, go, er(o, i.data_src));
  }), Rd(r, yE), ll(r, oE, er(r, i.data_poster)), ll(r, go, er(r, i.data_src)), r.load();
}, iz = (r, i) => {
  Rd(r, wE), ll(r, lE, er(r, i.data_src));
}, rz = (r, i, o) => {
  const c = er(r, i.data_bg), h = er(r, i.data_bg_hidpi), m = aE && h ? h : c;
  !m || (r.style.backgroundImage = `url("${m}")`, pE(r).setAttribute(go, m), CE(r, i, o));
}, az = (r, i, o) => {
  const c = er(r, i.data_bg_multi), h = er(r, i.data_bg_multi_hidpi), m = aE && h ? h : c;
  !m || (r.style.backgroundImage = m, xE(r, i, o));
}, sz = (r, i, o) => {
  const c = er(r, i.data_bg_set);
  if (!c)
    return;
  const h = c.split("|");
  let m = h.map((y) => `image-set(${y})`);
  r.style.backgroundImage = m.join(), r.style.backgroundImage === "" && (m = h.map((y) => `-webkit-image-set(${y})`), r.style.backgroundImage = m.join()), xE(r, i, o);
}, TE = {
  IMG: ez,
  IFRAME: tz,
  VIDEO: nz,
  OBJECT: iz
}, oz = (r, i) => {
  const o = TE[r.tagName];
  !o || o(r, i);
}, lz = (r, i, o) => {
  const c = TE[r.tagName];
  !c || (c(r, i), CE(r, i, o));
}, uz = ["IMG", "IFRAME", "VIDEO", "OBJECT"], cz = (r) => uz.indexOf(r.tagName) > -1, ME = (r, i) => {
  i && !G_(i) && !X_(i) && cl(r.callback_finish, i);
}, jT = (r, i, o) => {
  r.addEventListener(i, o), r.llEvLisnrs[i] = o;
}, dz = (r, i, o) => {
  r.removeEventListener(i, o);
}, AS = (r) => !!r.llEvLisnrs, fz = (r, i, o) => {
  AS(r) || (r.llEvLisnrs = {});
  const c = r.tagName === "VIDEO" ? "loadeddata" : "load";
  jT(r, c, i), jT(r, "error", o);
}, Jb = (r) => {
  if (!AS(r))
    return;
  const i = r.llEvLisnrs;
  for (let o in i) {
    const c = i[o];
    dz(r, o, c);
  }
  delete r.llEvLisnrs;
}, EE = (r, i, o) => {
  $_(r), ES(o, -1), Y_(o), bs(r, i.class_loading), i.unobserve_completed && mg(r, o);
}, hz = (r, i, o, c) => {
  const h = MS(i);
  EE(i, o, c), kd(i, o.class_loaded), Ou(i, uE), cl(o.callback_loaded, i, c), h || ME(o, c);
}, pz = (r, i, o, c) => {
  const h = MS(i);
  EE(i, o, c), kd(i, o.class_error), Ou(i, CS), cl(o.callback_error, i, c), o.restore_on_error && zu(i, op), h || ME(o, c);
}, RS = (r, i, o) => {
  const c = pE(r) || r;
  if (AS(c))
    return;
  fz(c, (y) => {
    hz(y, r, i, o), Jb(c);
  }, (y) => {
    pz(y, r, i, o), Jb(c);
  });
}, mz = (r, i, o) => {
  F_(r), RS(r, i, o), J_(r), rz(r, i, o), az(r, i, o), sz(r, i, o);
}, vz = (r, i, o) => {
  RS(r, i, o), lz(r, i, o);
}, DS = (r, i, o) => {
  cz(r) ? vz(r, i, o) : mz(r, i, o);
}, gz = (r, i, o) => {
  r.setAttribute("loading", "lazy"), RS(r, i, o), oz(r, i), Ou(r, dE);
}, UT = (r) => {
  r.removeAttribute(go), r.removeAttribute(bS), r.removeAttribute(SS);
}, yz = (r) => {
  IS(r, (i) => {
    UT(i);
  }), UT(r);
}, IE = (r) => {
  IS(r, (i) => {
    zu(i, op);
  }), zu(r, op);
}, wz = (r) => {
  gE(r, (i) => {
    zu(i, vg);
  }), zu(r, yE), r.load();
}, bz = (r) => {
  zu(r, vg);
}, Sz = (r) => {
  zu(r, wE);
}, xz = {
  IMG: IE,
  IFRAME: bz,
  VIDEO: wz,
  OBJECT: Sz
}, Cz = (r) => {
  const i = xz[r.tagName];
  if (!i) {
    K_(r);
    return;
  }
  i(r);
}, Tz = (r, i) => {
  TS(r) || MS(r) || (bs(r, i.class_entered), bs(r, i.class_exited), bs(r, i.class_applied), bs(r, i.class_loading), bs(r, i.class_loaded), bs(r, i.class_error));
}, Mz = (r, i) => {
  Cz(r), Tz(r, i), pg(r), SE(r);
}, Ez = (r, i, o, c) => {
  !o.cancel_on_exit || !U_(r) || r.tagName === "IMG" && (Jb(r), yz(r), IE(r), bs(r, o.class_loading), ES(c, -1), pg(r), cl(o.callback_cancel, r, i, c));
}, Iz = (r, i, o, c) => {
  const h = W_(r);
  Ou(r, B_), kd(r, o.class_entered), bs(r, o.class_exited), Z_(r, o, c), cl(o.callback_enter, r, i, c), !h && DS(r, o, c);
}, Az = (r, i, o, c) => {
  TS(r) || (kd(r, o.class_exited), Ez(r, i, o, c), cl(o.callback_exit, r, i, c));
}, Rz = ["IMG", "IFRAME", "VIDEO"], AE = (r) => r.use_native && "loading" in HTMLImageElement.prototype, Dz = (r, i, o) => {
  r.forEach((c) => {
    Rz.indexOf(c.tagName) !== -1 && gz(c, i, o);
  }), mE(o, 0);
}, Nz = (r) => r.isIntersecting || r.intersectionRatio > 0, kz = (r) => ({
  root: r.container === document ? null : r.container,
  rootMargin: r.thresholds || r.threshold + "px"
}), Pz = (r, i, o) => {
  r.forEach((c) => Nz(c) ? Iz(c.target, c, i, o) : Az(c.target, c, i, o));
}, _z = (r, i) => {
  i.forEach((o) => {
    r.observe(o);
  });
}, zz = (r, i) => {
  Q_(r), _z(r, i);
}, Oz = (r, i) => {
  !iE || AE(r) || (i._observer = new IntersectionObserver((o) => {
    Pz(o, r, i);
  }, kz(r)));
}, RE = (r) => Array.prototype.slice.call(r), sg = (r) => r.container.querySelectorAll(r.elements_selector), Lz = (r) => RE(r).filter(TS), Bz = (r) => V_(r), jz = (r) => RE(r).filter(Bz), VT = (r, i) => Lz(r || sg(i)), Uz = (r, i) => {
  jz(sg(r)).forEach((c) => {
    bs(c, r.class_error), pg(c);
  }), i.update();
}, Vz = (r, i) => {
  !ul || (i._onlineHandler = () => {
    Uz(r, i);
  }, window.addEventListener("online", i._onlineHandler));
}, Hz = (r) => {
  !ul || window.removeEventListener("online", r._onlineHandler);
}, hp = function(r, i) {
  const o = sE(r);
  this._settings = o, this.loadingCount = 0, Oz(o, this), Vz(o, this), this.update(i);
};
hp.prototype = {
  update: function(r) {
    const i = this._settings, o = VT(r, i);
    if (mE(this, o.length), nE || !iE) {
      this.loadAll(o);
      return;
    }
    if (AE(i)) {
      Dz(o, i, this);
      return;
    }
    zz(this._observer, o);
  },
  destroy: function() {
    this._observer && this._observer.disconnect(), Hz(this), sg(this._settings).forEach((r) => {
      SE(r);
    }), delete this._observer, delete this._settings, delete this._onlineHandler, delete this.loadingCount, delete this.toLoadCount;
  },
  loadAll: function(r) {
    const i = this._settings;
    VT(r, i).forEach((c) => {
      mg(c, this), DS(c, i, this);
    });
  },
  restoreAll: function() {
    const r = this._settings;
    sg(r).forEach((i) => {
      Mz(i, r);
    });
  }
};
hp.load = (r, i) => {
  const o = sE(i);
  DS(r, o);
};
hp.resetStatus = (r) => {
  pg(r);
};
ul && L_(hp, window.lazyLoadOptions);
class DE {
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
    c == null || c.forEach((S, C) => {
      var A;
      (A = S.querySelector("img")) == null || A.classList.toggle(this.wrapClassName("active"), Number(i) == C);
    });
    const h = Array.prototype.slice.call(c).find((S) => S.querySelector("img").className.includes(this.wrapClassName("active")));
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
      this.pages.forEach((y, g) => {
        var S;
        const C = (S = y.thumbnail) != null ? S : y.src.startsWith("ppt") ? void 0 : y.src;
        if (!C)
          return;
        const A = String(g), I = document.createElement("a");
        I.className = h + " " + this.wrapClassName(`preview-page-${g}`), I.setAttribute("href", "#"), I.dataset.pageIndex = A;
        const z = document.createElement("span");
        z.className = m, z.textContent = String(g + 1), z.dataset.pageIndex = A;
        const F = document.createElement("img");
        F.width = y.width, F.height = y.height, F.dataset.src = C, F.dataset.pageIndex = A, I.appendChild(z), I.appendChild(F), i.appendChild(I), F.classList.toggle(this.wrapClassName("active"), this.pageIndex == g);
      }), this.sideEffect.addEventListener(i, "click", (y) => {
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
    return this.$previewMask || (this.$previewMask = document.createElement("div"), this.$previewMask.className = this.wrapClassName("preview-mask"), this.sideEffect.addEventListener(this.$previewMask, "click", (i) => {
      this.readonly || i.target === this.$previewMask && this.togglePreview(!1);
    })), this.$previewMask;
  }
  renderFooter() {
    if (!this.$footer) {
      const i = document.createElement("div");
      i.className = this.wrapClassName("footer"), this.$footer = i, this.readonly && i.classList.add(this.wrapClassName("readonly")), this.isSmallBox && i.classList.add(this.wrapClassName("float-footer")), this.pages.some((S) => S.thumbnail || !S.src.startsWith("ppt"));
      const o = document.createElement("div");
      o.className = this.wrapClassName("page-jumps");
      const c = this.renderFooterBtn("btn-page-back", k_(this.namespace));
      if (this.sideEffect.addEventListener(c, "click", () => {
        this.readonly || this.onNewPageIndex(this.pageIndex - 1);
      }), o.appendChild(c), this.$btnPageBack = c, this.onPlay) {
        const S = this.renderFooterBtn("btn-page-play", __(this.namespace), z_(this.namespace)), C = () => {
          this.sideEffect.setTimeout(() => {
            S.classList.toggle(this.wrapClassName("footer-btn-playing"), !1);
          }, 500, "returnPlay");
        };
        this.sideEffect.addEventListener(S, "click", () => {
          var A;
          this.readonly || (S.classList.toggle(this.wrapClassName("footer-btn-playing"), !0), (A = this.onPlay) == null || A.call(this), C());
        }), this.$footer.appendChild(S);
      }
      const h = document.createElement("div");
      h.className = this.wrapClassName("page-number");
      const m = document.createElement("span");
      m.className = this.wrapClassName("page-number-input"), m.textContent = String(this.pageIndex + 1), this.$pageNumberInput = m;
      const y = document.createElement("span");
      y.textContent = " / " + this.pages.length, h.appendChild(m), h.appendChild(y), o.appendChild(h);
      const g = this.renderFooterBtn("btn-page-next", P_(this.namespace));
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
function NE(r) {
  r.stopPropagation(), r.cancelable && r.preventDefault();
}
function kE(r) {
  if (!r)
    return !1;
  const i = r.tagName;
  return i === "INPUT" || i === "TEXTAREA" || i === "SELECT";
}
class Wz {
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
class Fz {
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
const $z = window.requestIdleCallback || ((r) => window.setTimeout(r, 5e3)), Qz = window.cancelIdleCallback || window.clearTimeout;
class Zz {
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
    return o || (o = new Fz(i, this.pages[i], this.scale, this.pagesIntrinsicWidth), this.els.set(i, o)), o.lastVisit = Date.now(), this.els.size > this.maxElCount && this.gcTimer === null && (this.gcTimer = $z(this.gc)), o;
  }
  setScale(i) {
    i !== this.scale && (this.scale = i, this.els.forEach((o) => o.setScale(i)));
  }
  destroy() {
    this.els.clear(), this.gcTimer !== null && (Qz(this.gcTimer), this.gcTimer = null);
  }
}
class Yz {
  constructor(i) {
    this._hwaTimeout = NaN, this._turnOffHWA = () => {
      window.clearTimeout(this._hwaTimeout), this._hwaTimeout = NaN, this.$pages.classList.toggle("is-hwa", !1);
    }, this.pagesScrollTop = i.pagesScrollTop || 0, this.containerWidth = i.containerWidth || 1, this.containerHeight = i.containerHeight || 1, this.pages = i.pages.map((m) => {
      if (m.thumbnail)
        return m;
      try {
        const y = new URL(m.src);
        return y.searchParams.set("x-oss-process", "image/resize,l_50"), YM(ZM({}, m), { thumbnail: y.toString() });
      } catch (y) {
        return console.error(y), m;
      }
    });
    const o = Array(this.pages.length);
    let c = 1 / 0, h = 0;
    this.pagesIntrinsicHeight = this.pages.reduce((m, y, g) => (o[g] = m, y.width > h && (h = y.width), y.height <= c && (c = y.height), m + y.height), 0), this.pagesIntrinsicWidth = h, this.pagesMinHeight = c, this.pagesIntrinsicYs = o, this.scale = this._calcScale(), this.threshold = this._calcThreshold(), this.onPageIndexChanged = i.onPageIndexChanged, this.pageScrollIndex = 0, this.pagesScrollTop !== 0 && (this.pageScrollIndex = this.findScrollPageIndex(), this.onPageIndexChanged && this.pageScrollIndex > 0 && this.onPageIndexChanged(this.pageScrollIndex)), this.pageElManager = new Zz(this.pages, h, this.scale), this.$pages = this.renderPages();
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
        const g = this.$pages.children[y], S = Number(g.dataset.index);
        S >= h && S <= m || (g.remove(), y--);
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
const Gz = 30;
class Xz {
  constructor(i) {
    this.sideEffect = new hg(), this.pagesScrollTop = i.pagesScrollTop || 0, this.containerWidth = i.containerWidth || 1, this.containerHeight = i.containerHeight || 1, this.pagesWidth = i.pagesWidth || 1, this.pagesHeight = i.pagesHeight || 1, this.scale = this._calcScale(), this.scrollbarMinHeight = i.scrollbarMinHeight || Gz, this.scrollbarHeight = this._calcScrollbarHeight(), this.readonly = i.readonly, this.wrapClassName = i.wrapClassName, this.onDragScroll = i.onDragScroll, this.$scrollbar = this.renderScrollbar();
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
      NE(c);
      const h = this.wrapClassName("scrollbar-dragging");
      i.classList.toggle(h, !0);
      const m = this.pagesScrollTop, { clientY: y } = HT(c), g = (C) => {
        if (this.readonly)
          return;
        const { clientY: A } = HT(C), I = (A - y) / this.scale;
        Math.abs(I) > 0 && this.onDragScroll && this.onDragScroll(m + I * (this.pagesHeight * this.scale / this.containerHeight));
      }, S = () => {
        i.classList.toggle(h, !1), window.removeEventListener("mousemove", g, !0), window.removeEventListener("touchmove", g, !0), window.removeEventListener("mouseup", S, !0), window.removeEventListener("touchend", S, !0), window.removeEventListener("touchcancel", S, !0);
      };
      window.addEventListener("mousemove", g, !0), window.addEventListener("touchmove", g, !0), window.addEventListener("mouseup", S, !0), window.addEventListener("touchend", S, !0), window.addEventListener("touchcancel", S, !0);
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
const Jz = window.ResizeObserver || N_, Fh = 640;
class qz {
  constructor({
    context: i,
    whiteboardView: o,
    readonly: c,
    box: h,
    pages: m,
    pageScrollTop: y = 0,
    mountWhiteboard: g,
    onUserScroll: S,
    baseScenePath: C,
    appId: A
  }) {
    this.sideEffect = new hg(), this.userScrolling = !1, this.onNewPageIndex = ($) => {
      this.scrollToPage($);
    }, this.toPdf = async () => {
      const $ = document.createElement("canvas"), K = $.getContext("2d");
      if (!K || !this.baseScenePath) {
        this.reportProgress(100, null);
        return;
      }
      const q = this.whiteboardView.focusScenePath || `${this.baseScenePath}/1`, fe = this.pages[0], { jsPDF: se } = await import("jspdf"), Z = new se({
        format: [fe.width, fe.height],
        orientation: fe.width > fe.height ? "l" : "p",
        compress: !0
      });
      for (const [oe, Oe] of this.pages.entries()) {
        const { width: $e, height: je, src: Y } = Oe;
        $.width = $e, $.height = je;
        const he = $e > je ? "l" : "p";
        oe > 0 && Z.addPage([$e, je], he);
        const Ee = await this.getBase64FromUrl(Y), ie = document.createElement("img");
        ie.src = Ee, await new Promise((Ve) => ie.onload = Ve), K.drawImage(ie, 0, 0);
        const ct = $.toDataURL("image/jpeg", 0.6);
        K.clearRect(0, 0, $e, je);
        const _e = {
          centerX: $e / 2,
          centerY: je / 2 + oe * je,
          scale: 1
        }, ue = this.context.manager.windowManger;
        ue._appliancePlugin ? await ue._appliancePlugin.screenshotToCanvasAsync(K, q, $e, je, _e) : this.whiteboardView.screenshotToCanvas(K, q, $e, je, _e);
        const Qe = $.toDataURL("image/png");
        Z.addImage(ct, "JPEG", 0, 0, $e, je, "", "FAST"), Z.addImage(Qe, "PNG", 0, 0, $e, je, "", "FAST"), K.clearRect(0, 0, $e, je), Math.ceil((oe + 1) / this.pages.length * 100) < 100 && this.reportProgress(Math.ceil((oe + 1) / this.pages.length * 100), null);
      }
      const ce = Z.output("arraybuffer");
      this.reportProgress(100, { pdf: ce, title: this.box.title });
    }, this.context = i, this.whiteboardView = o, this.readonly = c, this.box = h, this.pages = m, this.baseScenePath = C, this.appId = A, this.mountWhiteboard = g, this._onUserScroll = S;
    const I = this.debounce(() => {
      this.userScrolling = !1, this._onUserScroll && this._onUserScroll(this.pageRenderer.pagesScrollTop);
    }, { wait: 80 }, "debounce-updateUserScroll");
    this.updateUserScroll = () => {
      this.userScrolling = !0, I();
    }, this.viewer = new DE({
      readonly: c,
      box: h,
      pages: m,
      onNewPageIndex: this.onNewPageIndex
    });
    const { width: z, height: F } = this.whiteboardView.size;
    this.pageRenderer = new Yz({
      pagesScrollTop: y,
      pages: this.pages,
      containerWidth: z,
      containerHeight: F,
      onPageIndexChanged: this.viewer.setPageIndex.bind(this.viewer)
    }), this.scrollbar = new Xz({
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
    }), this.pageScrollStepper = new Wz({
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
      const o = new Jz(i);
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
        const S = h + g;
        this.box.$titleBar.style.height = `${S * 100}%`;
      }
      if (this.box.$footer) {
        const S = y + g;
        this.box.$footer.style.height = `${S * 100}%`;
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
      NE(i), this.readonly || (this.pageScrollTo(this.pageRenderer.pagesScrollTop + i.deltaY), this.updateUserScroll());
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
      if (this.readonly || !this.box.focus || this.box.minimized || kE(i.target))
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
    const h = a_(i, o);
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
class Kz {
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
    }, this.context = i, this.whiteboardView = o, this.box = c, this.pages = h, this.displayer = i.getDisplayer(), this.viewer = new DE({
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
      if (this.box.focus && !kE(i.target))
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
const eO = "DocsViewer", qb = {
  kind: eO,
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
    return i.mountStyles(XP), h[0].src.startsWith("ppt") ? nO(r, c, i, h) : tO(r, c, i, h);
  }
};
function tO(r, i, o, c) {
  var h;
  i.disableCameraTransform = !r.getIsWritable();
  const m = new qz({
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
function nO(r, i, o, c) {
  i.disableCameraTransform = !0;
  const h = new Kz({
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
      const { width: g, height: S } = c[0], A = S / g * m - y;
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
function PE(r) {
  return r && r.__esModule && Object.prototype.hasOwnProperty.call(r, "default") ? r.default : r;
}
var dl = { exports: {} }, Ot = {};
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var xb, WT;
function yg() {
  if (WT)
    return xb;
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
      for (var y = {}, g = 0; g < 10; g++)
        y["_" + String.fromCharCode(g)] = g;
      var S = Object.getOwnPropertyNames(y).map(function(A) {
        return y[A];
      });
      if (S.join("") !== "0123456789")
        return !1;
      var C = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(A) {
        C[A] = A;
      }), Object.keys(Object.assign({}, C)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return xb = h() ? Object.assign : function(m, y) {
    for (var g, S = c(m), C, A = 1; A < arguments.length; A++) {
      g = Object(arguments[A]);
      for (var I in g)
        i.call(g, I) && (S[I] = g[I]);
      if (r) {
        C = r(g);
        for (var z = 0; z < C.length; z++)
          o.call(g, C[z]) && (S[C[z]] = g[C[z]]);
      }
    }
    return S;
  }, xb;
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
function iO() {
  if (FT)
    return Ot;
  FT = 1;
  var r = yg(), i = typeof Symbol == "function" && Symbol.for, o = i ? Symbol.for("react.element") : 60103, c = i ? Symbol.for("react.portal") : 60106, h = i ? Symbol.for("react.fragment") : 60107, m = i ? Symbol.for("react.strict_mode") : 60108, y = i ? Symbol.for("react.profiler") : 60114, g = i ? Symbol.for("react.provider") : 60109, S = i ? Symbol.for("react.context") : 60110, C = i ? Symbol.for("react.forward_ref") : 60112, A = i ? Symbol.for("react.suspense") : 60113, I = i ? Symbol.for("react.memo") : 60115, z = i ? Symbol.for("react.lazy") : 60116, F = typeof Symbol == "function" && Symbol.iterator;
  function $(D) {
    for (var B = "https://reactjs.org/docs/error-decoder.html?invariant=" + D, ee = 1; ee < arguments.length; ee++)
      B += "&args[]=" + encodeURIComponent(arguments[ee]);
    return "Minified React error #" + D + "; visit " + B + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  var K = { isMounted: function() {
    return !1;
  }, enqueueForceUpdate: function() {
  }, enqueueReplaceState: function() {
  }, enqueueSetState: function() {
  } }, q = {};
  function fe(D, B, ee) {
    this.props = D, this.context = B, this.refs = q, this.updater = ee || K;
  }
  fe.prototype.isReactComponent = {}, fe.prototype.setState = function(D, B) {
    if (typeof D != "object" && typeof D != "function" && D != null)
      throw Error($(85));
    this.updater.enqueueSetState(this, D, B, "setState");
  }, fe.prototype.forceUpdate = function(D) {
    this.updater.enqueueForceUpdate(this, D, "forceUpdate");
  };
  function se() {
  }
  se.prototype = fe.prototype;
  function Z(D, B, ee) {
    this.props = D, this.context = B, this.refs = q, this.updater = ee || K;
  }
  var ce = Z.prototype = new se();
  ce.constructor = Z, r(ce, fe.prototype), ce.isPureReactComponent = !0;
  var oe = { current: null }, Oe = Object.prototype.hasOwnProperty, $e = { key: !0, ref: !0, __self: !0, __source: !0 };
  function je(D, B, ee) {
    var xe, ge = {}, it = null, Ge = null;
    if (B != null)
      for (xe in B.ref !== void 0 && (Ge = B.ref), B.key !== void 0 && (it = "" + B.key), B)
        Oe.call(B, xe) && !$e.hasOwnProperty(xe) && (ge[xe] = B[xe]);
    var Le = arguments.length - 2;
    if (Le === 1)
      ge.children = ee;
    else if (1 < Le) {
      for (var dt = Array(Le), gt = 0; gt < Le; gt++)
        dt[gt] = arguments[gt + 2];
      ge.children = dt;
    }
    if (D && D.defaultProps)
      for (xe in Le = D.defaultProps, Le)
        ge[xe] === void 0 && (ge[xe] = Le[xe]);
    return { $$typeof: o, type: D, key: it, ref: Ge, props: ge, _owner: oe.current };
  }
  function Y(D, B) {
    return { $$typeof: o, type: D.type, key: B, ref: D.ref, props: D.props, _owner: D._owner };
  }
  function he(D) {
    return typeof D == "object" && D !== null && D.$$typeof === o;
  }
  function Ee(D) {
    var B = { "=": "=0", ":": "=2" };
    return "$" + ("" + D).replace(/[=:]/g, function(ee) {
      return B[ee];
    });
  }
  var ie = /\/+/g, ct = [];
  function _e(D, B, ee, xe) {
    if (ct.length) {
      var ge = ct.pop();
      return ge.result = D, ge.keyPrefix = B, ge.func = ee, ge.context = xe, ge.count = 0, ge;
    }
    return { result: D, keyPrefix: B, func: ee, context: xe, count: 0 };
  }
  function ue(D) {
    D.result = null, D.keyPrefix = null, D.func = null, D.context = null, D.count = 0, 10 > ct.length && ct.push(D);
  }
  function Qe(D, B, ee, xe) {
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
      return ee(xe, D, B === "" ? "." + Ve(D, 0) : B), 1;
    if (it = 0, B = B === "" ? "." : B + ":", Array.isArray(D))
      for (var Ge = 0; Ge < D.length; Ge++) {
        ge = D[Ge];
        var Le = B + Ve(ge, Ge);
        it += Qe(ge, Le, ee, xe);
      }
    else if (D === null || typeof D != "object" ? Le = null : (Le = F && D[F] || D["@@iterator"], Le = typeof Le == "function" ? Le : null), typeof Le == "function")
      for (D = Le.call(D), Ge = 0; !(ge = D.next()).done; )
        ge = ge.value, Le = B + Ve(ge, Ge++), it += Qe(ge, Le, ee, xe);
    else if (ge === "object")
      throw ee = "" + D, Error($(31, ee === "[object Object]" ? "object with keys {" + Object.keys(D).join(", ") + "}" : ee, ""));
    return it;
  }
  function be(D, B, ee) {
    return D == null ? 0 : Qe(D, "", B, ee);
  }
  function Ve(D, B) {
    return typeof D == "object" && D !== null && D.key != null ? Ee(D.key) : B.toString(36);
  }
  function Re(D, B) {
    D.func.call(D.context, B, D.count++);
  }
  function Fe(D, B, ee) {
    var xe = D.result, ge = D.keyPrefix;
    D = D.func.call(D.context, B, D.count++), Array.isArray(D) ? Tt(D, xe, ee, function(it) {
      return it;
    }) : D != null && (he(D) && (D = Y(D, ge + (!D.key || B && B.key === D.key ? "" : ("" + D.key).replace(ie, "$&/") + "/") + ee)), xe.push(D));
  }
  function Tt(D, B, ee, xe, ge) {
    var it = "";
    ee != null && (it = ("" + ee).replace(ie, "$&/") + "/"), B = _e(B, it, xe, ge), be(D, Fe, B), ue(B);
  }
  var Bt = { current: null };
  function Ye() {
    var D = Bt.current;
    if (D === null)
      throw Error($(321));
    return D;
  }
  var re = { ReactCurrentDispatcher: Bt, ReactCurrentBatchConfig: { suspense: null }, ReactCurrentOwner: oe, IsSomeRendererActing: { current: !1 }, assign: r };
  return Ot.Children = { map: function(D, B, ee) {
    if (D == null)
      return D;
    var xe = [];
    return Tt(D, xe, null, B, ee), xe;
  }, forEach: function(D, B, ee) {
    if (D == null)
      return D;
    B = _e(null, null, B, ee), be(D, Re, B), ue(B);
  }, count: function(D) {
    return be(D, function() {
      return null;
    }, null);
  }, toArray: function(D) {
    var B = [];
    return Tt(D, B, null, function(ee) {
      return ee;
    }), B;
  }, only: function(D) {
    if (!he(D))
      throw Error($(143));
    return D;
  } }, Ot.Component = fe, Ot.Fragment = h, Ot.Profiler = y, Ot.PureComponent = Z, Ot.StrictMode = m, Ot.Suspense = A, Ot.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = re, Ot.cloneElement = function(D, B, ee) {
    if (D == null)
      throw Error($(267, D));
    var xe = r({}, D.props), ge = D.key, it = D.ref, Ge = D._owner;
    if (B != null) {
      if (B.ref !== void 0 && (it = B.ref, Ge = oe.current), B.key !== void 0 && (ge = "" + B.key), D.type && D.type.defaultProps)
        var Le = D.type.defaultProps;
      for (dt in B)
        Oe.call(B, dt) && !$e.hasOwnProperty(dt) && (xe[dt] = B[dt] === void 0 && Le !== void 0 ? Le[dt] : B[dt]);
    }
    var dt = arguments.length - 2;
    if (dt === 1)
      xe.children = ee;
    else if (1 < dt) {
      Le = Array(dt);
      for (var gt = 0; gt < dt; gt++)
        Le[gt] = arguments[gt + 2];
      xe.children = Le;
    }
    return {
      $$typeof: o,
      type: D.type,
      key: ge,
      ref: it,
      props: xe,
      _owner: Ge
    };
  }, Ot.createContext = function(D, B) {
    return B === void 0 && (B = null), D = { $$typeof: S, _calculateChangedBits: B, _currentValue: D, _currentValue2: D, _threadCount: 0, Provider: null, Consumer: null }, D.Provider = { $$typeof: g, _context: D }, D.Consumer = D;
  }, Ot.createElement = je, Ot.createFactory = function(D) {
    var B = je.bind(null, D);
    return B.type = D, B;
  }, Ot.createRef = function() {
    return { current: null };
  }, Ot.forwardRef = function(D) {
    return { $$typeof: C, render: D };
  }, Ot.isValidElement = he, Ot.lazy = function(D) {
    return { $$typeof: z, _ctor: D, _status: -1, _result: null };
  }, Ot.memo = function(D, B) {
    return { $$typeof: I, type: D, compare: B === void 0 ? null : B };
  }, Ot.useCallback = function(D, B) {
    return Ye().useCallback(D, B);
  }, Ot.useContext = function(D, B) {
    return Ye().useContext(D, B);
  }, Ot.useDebugValue = function() {
  }, Ot.useEffect = function(D, B) {
    return Ye().useEffect(D, B);
  }, Ot.useImperativeHandle = function(D, B, ee) {
    return Ye().useImperativeHandle(D, B, ee);
  }, Ot.useLayoutEffect = function(D, B) {
    return Ye().useLayoutEffect(D, B);
  }, Ot.useMemo = function(D, B) {
    return Ye().useMemo(D, B);
  }, Ot.useReducer = function(D, B, ee) {
    return Ye().useReducer(D, B, ee);
  }, Ot.useRef = function(D) {
    return Ye().useRef(D);
  }, Ot.useState = function(D) {
    return Ye().useState(D);
  }, Ot.version = "16.14.0", Ot;
}
var Lt = {}, Cb, $T;
function rO() {
  if ($T)
    return Cb;
  $T = 1;
  var r = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return Cb = r, Cb;
}
var Tb, QT;
function aO() {
  return QT || (QT = 1, Tb = Function.call.bind(Object.prototype.hasOwnProperty)), Tb;
}
var Mb, ZT;
function _E() {
  if (ZT)
    return Mb;
  ZT = 1;
  var r = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var i = rO(), o = {}, c = aO();
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
      for (var A in m)
        if (c(m, A)) {
          var I;
          try {
            if (typeof m[A] != "function") {
              var z = Error(
                (S || "React class") + ": " + g + " type `" + A + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof m[A] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw z.name = "Invariant Violation", z;
            }
            I = m[A](y, A, S, g, null, i);
          } catch ($) {
            I = $;
          }
          if (I && !(I instanceof Error) && r(
            (S || "React class") + ": type specification of " + g + " `" + A + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof I + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), I instanceof Error && !(I.message in o)) {
            o[I.message] = !0;
            var F = C ? C() : "";
            r(
              "Failed " + g + " type: " + I.message + (F != null ? F : "")
            );
          }
        }
    }
  }
  return h.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (o = {});
  }, Mb = h, Mb;
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
function sO() {
  return YT || (YT = 1, process.env.NODE_ENV !== "production" && function() {
    var r = yg(), i = _E(), o = "16.14.0", c = typeof Symbol == "function" && Symbol.for, h = c ? Symbol.for("react.element") : 60103, m = c ? Symbol.for("react.portal") : 60106, y = c ? Symbol.for("react.fragment") : 60107, g = c ? Symbol.for("react.strict_mode") : 60108, S = c ? Symbol.for("react.profiler") : 60114, C = c ? Symbol.for("react.provider") : 60109, A = c ? Symbol.for("react.context") : 60110, I = c ? Symbol.for("react.concurrent_mode") : 60111, z = c ? Symbol.for("react.forward_ref") : 60112, F = c ? Symbol.for("react.suspense") : 60113, $ = c ? Symbol.for("react.suspense_list") : 60120, K = c ? Symbol.for("react.memo") : 60115, q = c ? Symbol.for("react.lazy") : 60116, fe = c ? Symbol.for("react.block") : 60121, se = c ? Symbol.for("react.fundamental") : 60117, Z = c ? Symbol.for("react.responder") : 60118, ce = c ? Symbol.for("react.scope") : 60119, oe = typeof Symbol == "function" && Symbol.iterator, Oe = "@@iterator";
    function $e(M) {
      if (M === null || typeof M != "object")
        return null;
      var P = oe && M[oe] || M[Oe];
      return typeof P == "function" ? P : null;
    }
    var je = {
      current: null
    }, Y = {
      suspense: null
    }, he = {
      current: null
    }, Ee = /^(.*)[\\\/]/;
    function ie(M, P, V) {
      var G = "";
      if (P) {
        var Se = P.fileName, Ze = Se.replace(Ee, "");
        if (/^index\./.test(Ze)) {
          var Be = Se.match(Ee);
          if (Be) {
            var et = Be[1];
            if (et) {
              var Nt = et.replace(Ee, "");
              Ze = Nt + "/" + Ze;
            }
          }
        }
        G = " (at " + Ze + ":" + P.lineNumber + ")";
      } else
        V && (G = " (created by " + V + ")");
      return `
    in ` + (M || "Unknown") + G;
    }
    var ct = 1;
    function _e(M) {
      return M._status === ct ? M._result : null;
    }
    function ue(M, P, V) {
      var G = P.displayName || P.name || "";
      return M.displayName || (G !== "" ? V + "(" + G + ")" : V);
    }
    function Qe(M) {
      if (M == null)
        return null;
      if (typeof M.tag == "number" && Ye("Received an unexpected object in getComponentName(). This is likely a bug in React. Please file an issue."), typeof M == "function")
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
        case F:
          return "Suspense";
        case $:
          return "SuspenseList";
      }
      if (typeof M == "object")
        switch (M.$$typeof) {
          case A:
            return "Context.Consumer";
          case C:
            return "Context.Provider";
          case z:
            return ue(M, M.render, "ForwardRef");
          case K:
            return Qe(M.type);
          case fe:
            return Qe(M.render);
          case q: {
            var P = M, V = _e(P);
            if (V)
              return Qe(V);
            break;
          }
        }
      return null;
    }
    var be = {}, Ve = null;
    function Re(M) {
      Ve = M;
    }
    be.getCurrentStack = null, be.getStackAddendum = function() {
      var M = "";
      if (Ve) {
        var P = Qe(Ve.type), V = Ve._owner;
        M += ie(P, Ve._source, V && Qe(V.type));
      }
      var G = be.getCurrentStack;
      return G && (M += G() || ""), M;
    };
    var Fe = {
      current: !1
    }, Tt = {
      ReactCurrentDispatcher: je,
      ReactCurrentBatchConfig: Y,
      ReactCurrentOwner: he,
      IsSomeRendererActing: Fe,
      assign: r
    };
    r(Tt, {
      ReactDebugCurrentFrame: be,
      ReactComponentTreeHook: {}
    });
    function Bt(M) {
      {
        for (var P = arguments.length, V = new Array(P > 1 ? P - 1 : 0), G = 1; G < P; G++)
          V[G - 1] = arguments[G];
        re("warn", M, V);
      }
    }
    function Ye(M) {
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
          var Se = Tt.ReactDebugCurrentFrame, Ze = Se.getStackAddendum();
          Ze !== "" && (P += "%s", V = V.concat([Ze]));
        }
        var Be = V.map(function(vn) {
          return "" + vn;
        });
        Be.unshift("Warning: " + P), Function.prototype.apply.call(console[M], console, Be);
        try {
          var et = 0, Nt = "Warning: " + P.replace(/%s/g, function() {
            return V[et++];
          });
          throw new Error(Nt);
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
        Ye("Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.", P, G), D[Se] = !0;
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
    }, xe = {};
    Object.freeze(xe);
    function ge(M, P, V) {
      this.props = M, this.context = P, this.refs = xe, this.updater = V || ee;
    }
    ge.prototype.isReactComponent = {}, ge.prototype.setState = function(M, P) {
      if (!(typeof M == "object" || typeof M == "function" || M == null))
        throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
      this.updater.enqueueSetState(this, M, P, "setState");
    }, ge.prototype.forceUpdate = function(M) {
      this.updater.enqueueForceUpdate(this, M, "forceUpdate");
    };
    {
      var it = {
        isMounted: ["isMounted", "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."],
        replaceState: ["replaceState", "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."]
      }, Ge = function(M, P) {
        Object.defineProperty(ge.prototype, M, {
          get: function() {
            Bt("%s(...) is deprecated in plain JavaScript React classes. %s", P[0], P[1]);
          }
        });
      };
      for (var Le in it)
        it.hasOwnProperty(Le) && Ge(Le, it[Le]);
    }
    function dt() {
    }
    dt.prototype = ge.prototype;
    function gt(M, P, V) {
      this.props = M, this.context = P, this.refs = xe, this.updater = V || ee;
    }
    var Zt = gt.prototype = new dt();
    Zt.constructor = gt, r(Zt, ge.prototype), Zt.isPureReactComponent = !0;
    function Mt() {
      var M = {
        current: null
      };
      return Object.seal(M), M;
    }
    var wn = Object.prototype.hasOwnProperty, Wt = {
      key: !0,
      ref: !0,
      __self: !0,
      __source: !0
    }, Ui, Ci, Jn;
    Jn = {};
    function Ne(M) {
      if (wn.call(M, "ref")) {
        var P = Object.getOwnPropertyDescriptor(M, "ref").get;
        if (P && P.isReactWarning)
          return !1;
      }
      return M.ref !== void 0;
    }
    function st(M) {
      if (wn.call(M, "key")) {
        var P = Object.getOwnPropertyDescriptor(M, "key").get;
        if (P && P.isReactWarning)
          return !1;
      }
      return M.key !== void 0;
    }
    function He(M, P) {
      var V = function() {
        Ui || (Ui = !0, Ye("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://fb.me/react-special-props)", P));
      };
      V.isReactWarning = !0, Object.defineProperty(M, "key", {
        get: V,
        configurable: !0
      });
    }
    function jt(M, P) {
      var V = function() {
        Ci || (Ci = !0, Ye("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://fb.me/react-special-props)", P));
      };
      V.isReactWarning = !0, Object.defineProperty(M, "ref", {
        get: V,
        configurable: !0
      });
    }
    function bn(M) {
      if (typeof M.ref == "string" && he.current && M.__self && he.current.stateNode !== M.__self) {
        var P = Qe(he.current.type);
        Jn[P] || (Ye('Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. This case cannot be automatically converted to an arrow function. We ask you to manually fix this case by using useRef() or createRef() instead. Learn more about using refs safely here: https://fb.me/react-strict-mode-string-ref', Qe(he.current.type), M.ref), Jn[P] = !0);
      }
    }
    var ci = function(M, P, V, G, Se, Ze, Be) {
      var et = {
        $$typeof: h,
        type: M,
        key: P,
        ref: V,
        props: Be,
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
        value: G
      }), Object.defineProperty(et, "_source", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: Se
      }), Object.freeze && (Object.freeze(et.props), Object.freeze(et)), et;
    };
    function Mr(M, P, V) {
      var G, Se = {}, Ze = null, Be = null, et = null, Nt = null;
      if (P != null) {
        Ne(P) && (Be = P.ref, bn(P)), st(P) && (Ze = "" + P.key), et = P.__self === void 0 ? null : P.__self, Nt = P.__source === void 0 ? null : P.__source;
        for (G in P)
          wn.call(P, G) && !Wt.hasOwnProperty(G) && (Se[G] = P[G]);
      }
      var vn = arguments.length - 2;
      if (vn === 1)
        Se.children = V;
      else if (vn > 1) {
        for (var Sn = Array(vn), Tn = 0; Tn < vn; Tn++)
          Sn[Tn] = arguments[Tn + 2];
        Object.freeze && Object.freeze(Sn), Se.children = Sn;
      }
      if (M && M.defaultProps) {
        var ni = M.defaultProps;
        for (G in ni)
          Se[G] === void 0 && (Se[G] = ni[G]);
      }
      if (Ze || Be) {
        var ii = typeof M == "function" ? M.displayName || M.name || "Unknown" : M;
        Ze && He(Se, ii), Be && jt(Se, ii);
      }
      return ci(M, Ze, Be, et, Nt, he.current, Se);
    }
    function Bn(M, P) {
      var V = ci(M.type, P, M.ref, M._self, M._source, M._owner, M.props);
      return V;
    }
    function Gr(M, P, V) {
      if (M == null)
        throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + M + ".");
      var G, Se = r({}, M.props), Ze = M.key, Be = M.ref, et = M._self, Nt = M._source, vn = M._owner;
      if (P != null) {
        Ne(P) && (Be = P.ref, vn = he.current), st(P) && (Ze = "" + P.key);
        var Sn;
        M.type && M.type.defaultProps && (Sn = M.type.defaultProps);
        for (G in P)
          wn.call(P, G) && !Wt.hasOwnProperty(G) && (P[G] === void 0 && Sn !== void 0 ? Se[G] = Sn[G] : Se[G] = P[G]);
      }
      var Tn = arguments.length - 2;
      if (Tn === 1)
        Se.children = V;
      else if (Tn > 1) {
        for (var ni = Array(Tn), ii = 0; ii < Tn; ii++)
          ni[ii] = arguments[ii + 2];
        Se.children = ni;
      }
      return ci(M.type, Ze, Be, et, Nt, vn, Se);
    }
    function Vi(M) {
      return typeof M == "object" && M !== null && M.$$typeof === h;
    }
    var Ta = ".", Ma = ":";
    function di(M) {
      var P = /[=:]/g, V = {
        "=": "=0",
        ":": "=2"
      }, G = ("" + M).replace(P, function(Se) {
        return V[Se];
      });
      return "$" + G;
    }
    var tr = !1, fi = /\/+/g;
    function Ea(M) {
      return ("" + M).replace(fi, "$&/");
    }
    var Ti = 10, Xr = [];
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
    function Er(M) {
      M.result = null, M.keyPrefix = null, M.func = null, M.context = null, M.count = 0, Xr.length < Ti && Xr.push(M);
    }
    function Ir(M, P, V, G) {
      var Se = typeof M;
      (Se === "undefined" || Se === "boolean") && (M = null);
      var Ze = !1;
      if (M === null)
        Ze = !0;
      else
        switch (Se) {
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
        return V(
          G,
          M,
          P === "" ? Ta + qn(M, 0) : P
        ), 1;
      var Be, et, Nt = 0, vn = P === "" ? Ta : P + Ma;
      if (Array.isArray(M))
        for (var Sn = 0; Sn < M.length; Sn++)
          Be = M[Sn], et = vn + qn(Be, Sn), Nt += Ir(Be, et, V, G);
      else {
        var Tn = $e(M);
        if (typeof Tn == "function") {
          Tn === M.entries && (tr || Bt("Using Maps as children is deprecated and will be removed in a future major release. Consider converting children to an array of keyed ReactElements instead."), tr = !0);
          for (var ni = Tn.call(M), ii, So = 0; !(ii = ni.next()).done; )
            Be = ii.value, et = vn + qn(Be, So++), Nt += Ir(Be, et, V, G);
        } else if (Se === "object") {
          var ta = "";
          ta = " If you meant to render a collection of children, use an array instead." + be.getStackAddendum();
          var ir = "" + M;
          throw Error("Objects are not valid as a React child (found: " + (ir === "[object Object]" ? "object with keys {" + Object.keys(M).join(", ") + "}" : ir) + ")." + ta);
        }
      }
      return Nt;
    }
    function mn(M, P, V) {
      return M == null ? 0 : Ir(M, "", P, V);
    }
    function qn(M, P) {
      return typeof M == "object" && M !== null && M.key != null ? di(M.key) : P.toString(36);
    }
    function Ia(M, P, V) {
      var G = M.func, Se = M.context;
      G.call(Se, P, M.count++);
    }
    function kt(M, P, V) {
      if (M == null)
        return M;
      var G = Cs(null, null, P, V);
      mn(M, Ia, G), Er(G);
    }
    function rn(M, P, V) {
      var G = M.result, Se = M.keyPrefix, Ze = M.func, Be = M.context, et = Ze.call(Be, P, M.count++);
      Array.isArray(et) ? Mi(et, G, V, function(Nt) {
        return Nt;
      }) : et != null && (Vi(et) && (et = Bn(
        et,
        Se + (et.key && (!P || P.key !== et.key) ? Ea(et.key) + "/" : "") + V
      )), G.push(et));
    }
    function Mi(M, P, V, G, Se) {
      var Ze = "";
      V != null && (Ze = Ea(V) + "/");
      var Be = Cs(P, Ze, G, Se);
      mn(M, rn, Be), Er(Be);
    }
    function Nn(M, P, V) {
      if (M == null)
        return M;
      var G = [];
      return Mi(M, G, null, P, V), G;
    }
    function Ei(M) {
      return mn(M, function() {
        return null;
      }, null);
    }
    function Kn(M) {
      var P = [];
      return Mi(M, P, null, function(V) {
        return V;
      }), P;
    }
    function Jr(M) {
      if (!Vi(M))
        throw Error("React.Children.only expected to receive a single React element child.");
      return M;
    }
    function Aa(M, P) {
      P === void 0 ? P = null : P !== null && typeof P != "function" && Ye("createContext: Expected the optional second argument to be a function. Instead received: %s", P);
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
        $$typeof: C,
        _context: V
      };
      var G = !1, Se = !1;
      {
        var Ze = {
          $$typeof: A,
          _context: V,
          _calculateChangedBits: V._calculateChangedBits
        };
        Object.defineProperties(Ze, {
          Provider: {
            get: function() {
              return Se || (Se = !0, Ye("Rendering <Context.Consumer.Provider> is not supported and will be removed in a future major release. Did you mean to render <Context.Provider> instead?")), V.Provider;
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
              return G || (G = !0, Ye("Rendering <Context.Consumer.Consumer> is not supported and will be removed in a future major release. Did you mean to render <Context.Consumer> instead?")), V.Consumer;
            }
          }
        }), V.Consumer = Ze;
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
              Ye("React.lazy(...): It is not supported to assign `defaultProps` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it."), V = Se, Object.defineProperty(P, "defaultProps", {
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
              Ye("React.lazy(...): It is not supported to assign `propTypes` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it."), G = Se, Object.defineProperty(P, "propTypes", {
                enumerable: !0
              });
            }
          }
        });
      }
      return P;
    }
    function wo(M) {
      return M != null && M.$$typeof === K ? Ye("forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...)).") : typeof M != "function" ? Ye("forwardRef requires a render function but was given %s.", M === null ? "null" : typeof M) : M.length !== 0 && M.length !== 2 && Ye("forwardRef render functions accept exactly two parameters: props and ref. %s", M.length === 1 ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined."), M != null && (M.defaultProps != null || M.propTypes != null) && Ye("forwardRef render functions do not support propTypes or defaultProps. Did you accidentally pass a React component?"), {
        $$typeof: z,
        render: M
      };
    }
    function Ts(M) {
      return typeof M == "string" || typeof M == "function" || M === y || M === I || M === S || M === g || M === F || M === $ || typeof M == "object" && M !== null && (M.$$typeof === q || M.$$typeof === K || M.$$typeof === C || M.$$typeof === A || M.$$typeof === z || M.$$typeof === se || M.$$typeof === Z || M.$$typeof === ce || M.$$typeof === fe);
    }
    function Ra(M, P) {
      return Ts(M) || Ye("memo: The first argument must be a component. Instead received: %s", M === null ? "null" : typeof M), {
        $$typeof: K,
        type: M,
        compare: P === void 0 ? null : P
      };
    }
    function kn() {
      var M = je.current;
      if (M === null)
        throw Error(`Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
1. You might have mismatching versions of React and the renderer (such as React DOM)
2. You might be breaking the Rules of Hooks
3. You might have more than one copy of React in the same app
See https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem.`);
      return M;
    }
    function Ar(M, P) {
      var V = kn();
      if (P !== void 0 && Ye("useContext() second argument is reserved for future use in React. Passing it is not supported. You passed: %s.%s", P, typeof P == "number" && Array.isArray(arguments[2]) ? `

Did you call array.map(useContext)? Calling Hooks inside a loop is not supported. Learn more at https://fb.me/rules-of-hooks` : ""), M._context !== void 0) {
        var G = M._context;
        G.Consumer === M ? Ye("Calling useContext(Context.Consumer) is not supported, may cause bugs, and will be removed in a future major release. Did you mean to call useContext(Context) instead?") : G.Provider === M && Ye("Calling useContext(Context.Provider) is not supported. Did you mean to call useContext(Context) instead?");
      }
      return V.useContext(M, P);
    }
    function qr(M) {
      var P = kn();
      return P.useState(M);
    }
    function ei(M, P, V) {
      var G = kn();
      return G.useReducer(M, P, V);
    }
    function Rr(M) {
      var P = kn();
      return P.useRef(M);
    }
    function jn(M, P) {
      var V = kn();
      return V.useEffect(M, P);
    }
    function nr(M, P) {
      var V = kn();
      return V.useLayoutEffect(M, P);
    }
    function Ms(M, P) {
      var V = kn();
      return V.useCallback(M, P);
    }
    function Kr(M, P) {
      var V = kn();
      return V.useMemo(M, P);
    }
    function Es(M, P, V) {
      var G = kn();
      return G.useImperativeHandle(M, P, V);
    }
    function ne(M, P) {
      {
        var V = kn();
        return V.useDebugValue(M, P);
      }
    }
    var de;
    de = !1;
    function Xe() {
      if (he.current) {
        var M = Qe(he.current.type);
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
    var Yt = {};
    function fn(M) {
      var P = Xe();
      if (!P) {
        var V = typeof M == "string" ? M : M.displayName || M.name;
        V && (P = `

Check the top-level render call using <` + V + ">.");
      }
      return P;
    }
    function ti(M, P) {
      if (!(!M._store || M._store.validated || M.key != null)) {
        M._store.validated = !0;
        var V = fn(P);
        if (!Yt[V]) {
          Yt[V] = !0;
          var G = "";
          M && M._owner && M._owner !== he.current && (G = " It was passed a child from " + Qe(M._owner.type) + "."), Re(M), Ye('Each child in a list should have a unique "key" prop.%s%s See https://fb.me/react-warning-keys for more information.', V, G), Re(null);
        }
      }
    }
    function qt(M, P) {
      if (typeof M == "object") {
        if (Array.isArray(M))
          for (var V = 0; V < M.length; V++) {
            var G = M[V];
            Vi(G) && ti(G, P);
          }
        else if (Vi(M))
          M._store && (M._store.validated = !0);
        else if (M) {
          var Se = $e(M);
          if (typeof Se == "function" && Se !== M.entries)
            for (var Ze = Se.call(M), Be; !(Be = Ze.next()).done; )
              Vi(Be.value) && ti(Be.value, P);
        }
      }
    }
    function Da(M) {
      {
        var P = M.type;
        if (P == null || typeof P == "string")
          return;
        var V = Qe(P), G;
        if (typeof P == "function")
          G = P.propTypes;
        else if (typeof P == "object" && (P.$$typeof === z || P.$$typeof === K))
          G = P.propTypes;
        else
          return;
        G ? (Re(M), i(G, M.props, "prop", V, be.getStackAddendum), Re(null)) : P.PropTypes !== void 0 && !de && (de = !0, Ye("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", V || "Unknown")), typeof P.getDefaultProps == "function" && !P.getDefaultProps.isReactClassApproved && Ye("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
      }
    }
    function bo(M) {
      {
        Re(M);
        for (var P = Object.keys(M.props), V = 0; V < P.length; V++) {
          var G = P[V];
          if (G !== "children" && G !== "key") {
            Ye("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", G);
            break;
          }
        }
        M.ref !== null && Ye("Invalid attribute `ref` supplied to `React.Fragment`."), Re(null);
      }
    }
    function an(M, P, V) {
      var G = Ts(M);
      if (!G) {
        var Se = "";
        (M === void 0 || typeof M == "object" && M !== null && Object.keys(M).length === 0) && (Se += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");
        var Ze = Jt(P);
        Ze ? Se += Ze : Se += Xe();
        var Be;
        M === null ? Be = "null" : Array.isArray(M) ? Be = "array" : M !== void 0 && M.$$typeof === h ? (Be = "<" + (Qe(M.type) || "Unknown") + " />", Se = " Did you accidentally export a JSX literal instead of a component?") : Be = typeof M, Ye("React.createElement: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", Be, Se);
      }
      var et = Mr.apply(this, arguments);
      if (et == null)
        return et;
      if (G)
        for (var Nt = 2; Nt < arguments.length; Nt++)
          qt(arguments[Nt], M);
      return M === y ? bo(et) : Da(et), et;
    }
    var hn = !1;
    function Is(M) {
      var P = an.bind(null, M);
      return P.type = M, hn || (hn = !0, Bt("React.createFactory() is deprecated and will be removed in a future major release. Consider using JSX or use React.createElement() directly instead.")), Object.defineProperty(P, "type", {
        enumerable: !1,
        get: function() {
          return Bt("Factory.type is deprecated. Access the class directly before passing it to createFactory."), Object.defineProperty(this, "type", {
            value: M
          }), M;
        }
      }), P;
    }
    function fl(M, P, V) {
      for (var G = Gr.apply(this, arguments), Se = 2; Se < arguments.length; Se++)
        qt(arguments[Se], G.type);
      return Da(G), G;
    }
    try {
      var ea = Object.freeze({}), hl = /* @__PURE__ */ new Map([[ea, null]]), Lu = /* @__PURE__ */ new Set([ea]);
      hl.set(0, 0), Lu.add(0);
    } catch {
    }
    var As = an, pl = fl, Bu = Is, ml = {
      map: Nn,
      forEach: kt,
      count: Ei,
      toArray: Kn,
      only: Jr
    };
    Lt.Children = ml, Lt.Component = ge, Lt.Fragment = y, Lt.Profiler = S, Lt.PureComponent = gt, Lt.StrictMode = g, Lt.Suspense = F, Lt.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Tt, Lt.cloneElement = pl, Lt.createContext = Aa, Lt.createElement = As, Lt.createFactory = Bu, Lt.createRef = Mt, Lt.forwardRef = wo, Lt.isValidElement = Vi, Lt.lazy = yo, Lt.memo = Ra, Lt.useCallback = Ms, Lt.useContext = Ar, Lt.useDebugValue = ne, Lt.useEffect = jn, Lt.useImperativeHandle = Es, Lt.useLayoutEffect = nr, Lt.useMemo = Kr, Lt.useReducer = ei, Lt.useRef = Rr, Lt.useState = qr, Lt.version = o;
  }()), Lt;
}
(function(r) {
  process.env.NODE_ENV === "production" ? r.exports = iO() : r.exports = sO();
})(dl);
const wt = /* @__PURE__ */ PE(dl.exports);
var zE = { exports: {} }, Sr = {}, Eb = { exports: {} }, Ib = {};
/** @license React v0.19.1
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var GT;
function oO() {
  return GT || (GT = 1, function(r) {
    var i, o, c, h, m;
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
      }, i = function(re) {
        y !== null ? setTimeout(i, 0, re) : (y = re, setTimeout(S, 0));
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
        var K = I.now();
        r.unstable_now = function() {
          return I.now() - K;
        };
      }
      var q = !1, fe = null, se = -1, Z = 5, ce = 0;
      h = function() {
        return r.unstable_now() >= ce;
      }, m = function() {
      }, r.unstable_forceFrameRate = function(re) {
        0 > re || 125 < re ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing framerates higher than 125 fps is not unsupported") : Z = 0 < re ? Math.floor(1e3 / re) : 5;
      };
      var oe = new MessageChannel(), Oe = oe.port2;
      oe.port1.onmessage = function() {
        if (fe !== null) {
          var re = r.unstable_now();
          ce = re + Z;
          try {
            fe(!0, re) ? Oe.postMessage(null) : (q = !1, fe = null);
          } catch (D) {
            throw Oe.postMessage(null), D;
          }
        } else
          q = !1;
      }, i = function(re) {
        fe = re, q || (q = !0, Oe.postMessage(null));
      }, o = function(re, D) {
        se = z(function() {
          re(r.unstable_now());
        }, D);
      }, c = function() {
        F(se), se = -1;
      };
    }
    function $e(re, D) {
      var B = re.length;
      re.push(D);
      e:
        for (; ; ) {
          var ee = B - 1 >>> 1, xe = re[ee];
          if (xe !== void 0 && 0 < he(xe, D))
            re[ee] = D, re[B] = xe, B = ee;
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
            for (var ee = 0, xe = re.length; ee < xe; ) {
              var ge = 2 * (ee + 1) - 1, it = re[ge], Ge = ge + 1, Le = re[Ge];
              if (it !== void 0 && 0 > he(it, B))
                Le !== void 0 && 0 > he(Le, it) ? (re[ee] = Le, re[Ge] = B, ee = Ge) : (re[ee] = it, re[ge] = B, ee = ge);
              else if (Le !== void 0 && 0 > he(Le, B))
                re[ee] = Le, re[Ge] = B, ee = Ge;
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
    var Ee = [], ie = [], ct = 1, _e = null, ue = 3, Qe = !1, be = !1, Ve = !1;
    function Re(re) {
      for (var D = je(ie); D !== null; ) {
        if (D.callback === null)
          Y(ie);
        else if (D.startTime <= re)
          Y(ie), D.sortIndex = D.expirationTime, $e(Ee, D);
        else
          break;
        D = je(ie);
      }
    }
    function Fe(re) {
      if (Ve = !1, Re(re), !be)
        if (je(Ee) !== null)
          be = !0, i(Tt);
        else {
          var D = je(ie);
          D !== null && o(Fe, D.startTime - re);
        }
    }
    function Tt(re, D) {
      be = !1, Ve && (Ve = !1, c()), Qe = !0;
      var B = ue;
      try {
        for (Re(D), _e = je(Ee); _e !== null && (!(_e.expirationTime > D) || re && !h()); ) {
          var ee = _e.callback;
          if (ee !== null) {
            _e.callback = null, ue = _e.priorityLevel;
            var xe = ee(_e.expirationTime <= D);
            D = r.unstable_now(), typeof xe == "function" ? _e.callback = xe : _e === je(Ee) && Y(Ee), Re(D);
          } else
            Y(Ee);
          _e = je(Ee);
        }
        if (_e !== null)
          var ge = !0;
        else {
          var it = je(ie);
          it !== null && o(Fe, it.startTime - D), ge = !1;
        }
        return ge;
      } finally {
        _e = null, ue = B, Qe = !1;
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
    var Ye = m;
    r.unstable_IdlePriority = 5, r.unstable_ImmediatePriority = 1, r.unstable_LowPriority = 4, r.unstable_NormalPriority = 3, r.unstable_Profiling = null, r.unstable_UserBlockingPriority = 2, r.unstable_cancelCallback = function(re) {
      re.callback = null;
    }, r.unstable_continueExecution = function() {
      be || Qe || (be = !0, i(Tt));
    }, r.unstable_getCurrentPriorityLevel = function() {
      return ue;
    }, r.unstable_getFirstCallbackNode = function() {
      return je(Ee);
    }, r.unstable_next = function(re) {
      switch (ue) {
        case 1:
        case 2:
        case 3:
          var D = 3;
          break;
        default:
          D = ue;
      }
      var B = ue;
      ue = D;
      try {
        return re();
      } finally {
        ue = B;
      }
    }, r.unstable_pauseExecution = function() {
    }, r.unstable_requestPaint = Ye, r.unstable_runWithPriority = function(re, D) {
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
      var B = ue;
      ue = re;
      try {
        return D();
      } finally {
        ue = B;
      }
    }, r.unstable_scheduleCallback = function(re, D, B) {
      var ee = r.unstable_now();
      if (typeof B == "object" && B !== null) {
        var xe = B.delay;
        xe = typeof xe == "number" && 0 < xe ? ee + xe : ee, B = typeof B.timeout == "number" ? B.timeout : Bt(re);
      } else
        B = Bt(re), xe = ee;
      return B = xe + B, re = { id: ct++, callback: D, priorityLevel: re, startTime: xe, expirationTime: B, sortIndex: -1 }, xe > ee ? (re.sortIndex = xe, $e(ie, re), je(Ee) === null && re === je(ie) && (Ve ? c() : Ve = !0, o(Fe, xe - ee))) : (re.sortIndex = B, $e(Ee, re), be || Qe || (be = !0, i(Tt))), re;
    }, r.unstable_shouldYield = function() {
      var re = r.unstable_now();
      Re(re);
      var D = je(Ee);
      return D !== _e && _e !== null && D !== null && D.callback !== null && D.startTime <= re && D.expirationTime < _e.expirationTime || h();
    }, r.unstable_wrapCallback = function(re) {
      var D = ue;
      return function() {
        var B = ue;
        ue = D;
        try {
          return re.apply(this, arguments);
        } finally {
          ue = B;
        }
      };
    };
  }(Ib)), Ib;
}
var Ab = {};
/** @license React v0.19.1
 * scheduler.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var XT;
function lO() {
  return XT || (XT = 1, function(r) {
    process.env.NODE_ENV !== "production" && function() {
      var i = !1, o = !0, c, h, m, y, g;
      if (typeof window > "u" || typeof MessageChannel != "function") {
        var S = null, C = null, A = function() {
          if (S !== null)
            try {
              var ne = r.unstable_now(), de = !0;
              S(de, ne), S = null;
            } catch (Xe) {
              throw setTimeout(A, 0), Xe;
            }
        }, I = Date.now();
        r.unstable_now = function() {
          return Date.now() - I;
        }, c = function(ne) {
          S !== null ? setTimeout(c, 0, ne) : (S = ne, setTimeout(A, 0));
        }, h = function(ne, de) {
          C = setTimeout(ne, de);
        }, m = function() {
          clearTimeout(C);
        }, y = function() {
          return !1;
        }, g = r.unstable_forceFrameRate = function() {
        };
      } else {
        var z = window.performance, F = window.Date, $ = window.setTimeout, K = window.clearTimeout;
        if (typeof console < "u") {
          var q = window.requestAnimationFrame, fe = window.cancelAnimationFrame;
          typeof q != "function" && console.error("This browser doesn't support requestAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"), typeof fe != "function" && console.error("This browser doesn't support cancelAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills");
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
        var Z = !1, ce = null, oe = -1, Oe = 5, $e = 0;
        y = function() {
          return r.unstable_now() >= $e;
        }, g = function() {
        }, r.unstable_forceFrameRate = function(ne) {
          if (ne < 0 || ne > 125) {
            console.error("forceFrameRate takes a positive int between 0 and 125, forcing framerates higher than 125 fps is not unsupported");
            return;
          }
          ne > 0 ? Oe = Math.floor(1e3 / ne) : Oe = 5;
        };
        var je = function() {
          if (ce !== null) {
            var ne = r.unstable_now();
            $e = ne + Oe;
            var de = !0;
            try {
              var Xe = ce(de, ne);
              Xe ? he.postMessage(null) : (Z = !1, ce = null);
            } catch (pt) {
              throw he.postMessage(null), pt;
            }
          } else
            Z = !1;
        }, Y = new MessageChannel(), he = Y.port2;
        Y.port1.onmessage = je, c = function(ne) {
          ce = ne, Z || (Z = !0, he.postMessage(null));
        }, h = function(ne, de) {
          oe = $(function() {
            ne(r.unstable_now());
          }, de);
        }, m = function() {
          K(oe), oe = -1;
        };
      }
      function Ee(ne, de) {
        var Xe = ne.length;
        ne.push(de), _e(ne, de, Xe);
      }
      function ie(ne) {
        var de = ne[0];
        return de === void 0 ? null : de;
      }
      function ct(ne) {
        var de = ne[0];
        if (de !== void 0) {
          var Xe = ne.pop();
          return Xe !== de && (ne[0] = Xe, ue(ne, Xe, 0)), de;
        } else
          return null;
      }
      function _e(ne, de, Xe) {
        for (var pt = Xe; ; ) {
          var Jt = pt - 1 >>> 1, Yt = ne[Jt];
          if (Yt !== void 0 && Qe(Yt, de) > 0)
            ne[Jt] = de, ne[pt] = Yt, pt = Jt;
          else
            return;
        }
      }
      function ue(ne, de, Xe) {
        for (var pt = Xe, Jt = ne.length; pt < Jt; ) {
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
        var Xe = ne.sortIndex - de.sortIndex;
        return Xe !== 0 ? Xe : ne.id - de.id;
      }
      var be = 0, Ve = 1, Re = 2, Fe = 3, Tt = 4, Bt = 5, Ye = 0, re = 0, D = 4, B = typeof SharedArrayBuffer == "function" ? new SharedArrayBuffer(D * Int32Array.BYTES_PER_ELEMENT) : typeof ArrayBuffer == "function" ? new ArrayBuffer(D * Int32Array.BYTES_PER_ELEMENT) : null, ee = B !== null ? new Int32Array(B) : [], xe = 0, ge = 1, it = 2, Ge = 3;
      ee[xe] = be, ee[Ge] = 0, ee[ge] = 0;
      var Le = 131072, dt = 524288, gt = 0, Zt = null, Mt = null, wn = 0, Wt = 1, Ui = 2, Ci = 3, Jn = 4, Ne = 5, st = 6, He = 7, jt = 8;
      function bn(ne) {
        if (Mt !== null) {
          var de = wn;
          if (wn += ne.length, wn + 1 > gt) {
            if (gt *= 2, gt > dt) {
              console.error("Scheduler Profiling: Event log exceeded maximum size. Don't forget to call `stopLoggingProfilingEvents()`."), Mr();
              return;
            }
            var Xe = new Int32Array(gt * 4);
            Xe.set(Mt), Zt = Xe.buffer, Mt = Xe;
          }
          Mt.set(ne, de);
        }
      }
      function ci() {
        gt = Le, Zt = new ArrayBuffer(gt * 4), Mt = new Int32Array(Zt), wn = 0;
      }
      function Mr() {
        var ne = Zt;
        return gt = 0, Zt = null, Mt = null, wn = 0, ne;
      }
      function Bn(ne, de) {
        ee[Ge]++, Mt !== null && bn([Wt, de * 1e3, ne.id, ne.priorityLevel]);
      }
      function Gr(ne, de) {
        ee[xe] = be, ee[ge] = 0, ee[Ge]--, Mt !== null && bn([Ui, de * 1e3, ne.id]);
      }
      function Vi(ne, de) {
        ee[Ge]--, Mt !== null && bn([Jn, de * 1e3, ne.id]);
      }
      function Ta(ne, de) {
        ee[xe] = be, ee[ge] = 0, ee[Ge]--, Mt !== null && bn([Ci, de * 1e3, ne.id]);
      }
      function Ma(ne, de) {
        Ye++, ee[xe] = ne.priorityLevel, ee[ge] = ne.id, ee[it] = Ye, Mt !== null && bn([Ne, de * 1e3, ne.id, Ye]);
      }
      function di(ne, de) {
        ee[xe] = be, ee[ge] = 0, ee[it] = 0, Mt !== null && bn([st, de * 1e3, ne.id, Ye]);
      }
      function tr(ne) {
        re++, Mt !== null && bn([He, ne * 1e3, re]);
      }
      function fi(ne) {
        Mt !== null && bn([jt, ne * 1e3, re]);
      }
      var Ea = 1073741823, Ti = -1, Xr = 250, Cs = 5e3, Er = 1e4, Ir = Ea, mn = [], qn = [], Ia = 1, kt = null, rn = Fe, Mi = !1, Nn = !1, Ei = !1;
      function Kn(ne) {
        for (var de = ie(qn); de !== null; ) {
          if (de.callback === null)
            ct(qn);
          else if (de.startTime <= ne)
            ct(qn), de.sortIndex = de.expirationTime, Ee(mn, de), Bn(de, ne), de.isQueued = !0;
          else
            return;
          de = ie(qn);
        }
      }
      function Jr(ne) {
        if (Ei = !1, Kn(ne), !Nn)
          if (ie(mn) !== null)
            Nn = !0, c(Aa);
          else {
            var de = ie(qn);
            de !== null && h(Jr, de.startTime - ne);
          }
      }
      function Aa(ne, de) {
        fi(de), Nn = !1, Ei && (Ei = !1, m()), Mi = !0;
        var Xe = rn;
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
          kt = null, rn = Xe, Mi = !1;
          {
            var Jt = r.unstable_now();
            tr(Jt);
          }
        }
      }
      function yo(ne, de) {
        var Xe = de;
        for (Kn(Xe), kt = ie(mn); kt !== null && !i && !(kt.expirationTime > Xe && (!ne || y())); ) {
          var pt = kt.callback;
          if (pt !== null) {
            kt.callback = null, rn = kt.priorityLevel;
            var Jt = kt.expirationTime <= Xe;
            Ma(kt, Xe);
            var Yt = pt(Jt);
            Xe = r.unstable_now(), typeof Yt == "function" ? (kt.callback = Yt, di(kt, Xe)) : (Gr(kt, Xe), kt.isQueued = !1, kt === ie(mn) && ct(mn)), Kn(Xe);
          } else
            ct(mn);
          kt = ie(mn);
        }
        if (kt !== null)
          return !0;
        var fn = ie(qn);
        return fn !== null && h(Jr, fn.startTime - Xe), !1;
      }
      function wo(ne, de) {
        switch (ne) {
          case Ve:
          case Re:
          case Fe:
          case Tt:
          case Bt:
            break;
          default:
            ne = Fe;
        }
        var Xe = rn;
        rn = ne;
        try {
          return de();
        } finally {
          rn = Xe;
        }
      }
      function Ts(ne) {
        var de;
        switch (rn) {
          case Ve:
          case Re:
          case Fe:
            de = Fe;
            break;
          default:
            de = rn;
            break;
        }
        var Xe = rn;
        rn = de;
        try {
          return ne();
        } finally {
          rn = Xe;
        }
      }
      function Ra(ne) {
        var de = rn;
        return function() {
          var Xe = rn;
          rn = de;
          try {
            return ne.apply(this, arguments);
          } finally {
            rn = Xe;
          }
        };
      }
      function kn(ne) {
        switch (ne) {
          case Ve:
            return Ti;
          case Re:
            return Xr;
          case Bt:
            return Ir;
          case Tt:
            return Er;
          case Fe:
          default:
            return Cs;
        }
      }
      function Ar(ne, de, Xe) {
        var pt = r.unstable_now(), Jt, Yt;
        if (typeof Xe == "object" && Xe !== null) {
          var fn = Xe.delay;
          typeof fn == "number" && fn > 0 ? Jt = pt + fn : Jt = pt, Yt = typeof Xe.timeout == "number" ? Xe.timeout : kn(ne);
        } else
          Yt = kn(ne), Jt = pt;
        var ti = Jt + Yt, qt = {
          id: Ia++,
          callback: de,
          priorityLevel: ne,
          startTime: Jt,
          expirationTime: ti,
          sortIndex: -1
        };
        return qt.isQueued = !1, Jt > pt ? (qt.sortIndex = Jt, Ee(qn, qt), ie(mn) === null && qt === ie(qn) && (Ei ? m() : Ei = !0, h(Jr, Jt - pt))) : (qt.sortIndex = ti, Ee(mn, qt), Bn(qt, pt), qt.isQueued = !0, !Nn && !Mi && (Nn = !0, c(Aa))), qt;
      }
      function qr() {
      }
      function ei() {
        !Nn && !Mi && (Nn = !0, c(Aa));
      }
      function Rr() {
        return ie(mn);
      }
      function jn(ne) {
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
        var de = ie(mn);
        return de !== kt && kt !== null && de !== null && de.callback !== null && de.startTime <= ne && de.expirationTime < kt.expirationTime || y();
      }
      var Kr = g, Es = {
        startLoggingProfilingEvents: ci,
        stopLoggingProfilingEvents: Mr,
        sharedProfilingBuffer: B
      };
      r.unstable_IdlePriority = Bt, r.unstable_ImmediatePriority = Ve, r.unstable_LowPriority = Tt, r.unstable_NormalPriority = Fe, r.unstable_Profiling = Es, r.unstable_UserBlockingPriority = Re, r.unstable_cancelCallback = jn, r.unstable_continueExecution = ei, r.unstable_getCurrentPriorityLevel = nr, r.unstable_getFirstCallbackNode = Rr, r.unstable_next = Ts, r.unstable_pauseExecution = qr, r.unstable_requestPaint = Kr, r.unstable_runWithPriority = wo, r.unstable_scheduleCallback = Ar, r.unstable_shouldYield = Ms, r.unstable_wrapCallback = Ra;
    }();
  }(Ab)), Ab;
}
var JT;
function OE() {
  return JT || (JT = 1, function(r) {
    process.env.NODE_ENV === "production" ? r.exports = oO() : r.exports = lO();
  }(Eb)), Eb.exports;
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
function uO() {
  if (qT)
    return Sr;
  qT = 1;
  var r = dl.exports, i = yg(), o = OE();
  function c(n) {
    for (var a = "https://reactjs.org/docs/error-decoder.html?invariant=" + n, u = 1; u < arguments.length; u++)
      a += "&args[]=" + encodeURIComponent(arguments[u]);
    return "Minified React error #" + n + "; visit " + a + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  if (!r)
    throw Error(c(227));
  function h(n, a, u, f, v, x, T, R, H) {
    var U = Array.prototype.slice.call(arguments, 3);
    try {
      a.apply(u, U);
    } catch (Te) {
      this.onError(Te);
    }
  }
  var m = !1, y = null, g = !1, S = null, C = { onError: function(n) {
    m = !0, y = n;
  } };
  function A(n, a, u, f, v, x, T, R, H) {
    m = !1, y = null, h.apply(C, arguments);
  }
  function I(n, a, u, f, v, x, T, R, H) {
    if (A.apply(this, arguments), m) {
      if (m) {
        var U = y;
        m = !1, y = null;
      } else
        throw Error(c(198));
      g || (g = !0, S = U);
    }
  }
  var z = null, F = null, $ = null;
  function K(n, a, u) {
    var f = n.type || "unknown-event";
    n.currentTarget = $(u), I(f, a, void 0, n), n.currentTarget = null;
  }
  var q = null, fe = {};
  function se() {
    if (q)
      for (var n in fe) {
        var a = fe[n], u = q.indexOf(n);
        if (!(-1 < u))
          throw Error(c(96, n));
        if (!ce[u]) {
          if (!a.extractEvents)
            throw Error(c(97, n));
          ce[u] = a, u = a.eventTypes;
          for (var f in u) {
            var v = void 0, x = u[f], T = a, R = f;
            if (oe.hasOwnProperty(R))
              throw Error(c(99, R));
            oe[R] = x;
            var H = x.phasedRegistrationNames;
            if (H) {
              for (v in H)
                H.hasOwnProperty(v) && Z(H[v], T, R);
              v = !0;
            } else
              x.registrationName ? (Z(x.registrationName, T, R), v = !0) : v = !1;
            if (!v)
              throw Error(c(98, f, n));
          }
        }
      }
  }
  function Z(n, a, u) {
    if (Oe[n])
      throw Error(c(100, n));
    Oe[n] = a, $e[n] = a.eventTypes[u].dependencies;
  }
  var ce = [], oe = {}, Oe = {}, $e = {};
  function je(n) {
    var a = !1, u;
    for (u in n)
      if (n.hasOwnProperty(u)) {
        var f = n[u];
        if (!fe.hasOwnProperty(u) || fe[u] !== f) {
          if (fe[u])
            throw Error(c(102, u));
          fe[u] = f, a = !0;
        }
      }
    a && se();
  }
  var Y = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), he = null, Ee = null, ie = null;
  function ct(n) {
    if (n = F(n)) {
      if (typeof he != "function")
        throw Error(c(280));
      var a = n.stateNode;
      a && (a = z(a), he(n.stateNode, n.type, a));
    }
  }
  function _e(n) {
    Ee ? ie ? ie.push(n) : ie = [n] : Ee = n;
  }
  function ue() {
    if (Ee) {
      var n = Ee, a = ie;
      if (ie = Ee = null, ct(n), a)
        for (n = 0; n < a.length; n++)
          ct(a[n]);
    }
  }
  function Qe(n, a) {
    return n(a);
  }
  function be(n, a, u, f, v) {
    return n(a, u, f, v);
  }
  function Ve() {
  }
  var Re = Qe, Fe = !1, Tt = !1;
  function Bt() {
    (Ee !== null || ie !== null) && (Ve(), ue());
  }
  function Ye(n, a, u) {
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
  function xe(n) {
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
  function Ge(n, a, u, f, v, x) {
    this.acceptsBooleans = a === 2 || a === 3 || a === 4, this.attributeName = f, this.attributeNamespace = v, this.mustUseProperty = u, this.propertyName = n, this.type = a, this.sanitizeURL = x;
  }
  var Le = {};
  "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(n) {
    Le[n] = new Ge(n, 0, !1, n, null, !1);
  }), [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(n) {
    var a = n[0];
    Le[a] = new Ge(a, 1, !1, n[1], null, !1);
  }), ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(n) {
    Le[n] = new Ge(n, 2, !1, n.toLowerCase(), null, !1);
  }), ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(n) {
    Le[n] = new Ge(n, 2, !1, n, null, !1);
  }), "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(n) {
    Le[n] = new Ge(n, 3, !1, n.toLowerCase(), null, !1);
  }), ["checked", "multiple", "muted", "selected"].forEach(function(n) {
    Le[n] = new Ge(n, 3, !0, n, null, !1);
  }), ["capture", "download"].forEach(function(n) {
    Le[n] = new Ge(n, 4, !1, n, null, !1);
  }), ["cols", "rows", "size", "span"].forEach(function(n) {
    Le[n] = new Ge(n, 6, !1, n, null, !1);
  }), ["rowSpan", "start"].forEach(function(n) {
    Le[n] = new Ge(n, 5, !1, n.toLowerCase(), null, !1);
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
    Le[a] = new Ge(a, 1, !1, n, null, !1);
  }), "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(n) {
    var a = n.replace(dt, gt);
    Le[a] = new Ge(a, 1, !1, n, "http://www.w3.org/1999/xlink", !1);
  }), ["xml:base", "xml:lang", "xml:space"].forEach(function(n) {
    var a = n.replace(dt, gt);
    Le[a] = new Ge(a, 1, !1, n, "http://www.w3.org/XML/1998/namespace", !1);
  }), ["tabIndex", "crossOrigin"].forEach(function(n) {
    Le[n] = new Ge(n, 1, !1, n.toLowerCase(), null, !1);
  }), Le.xlinkHref = new Ge("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0), ["src", "href", "action", "formAction"].forEach(function(n) {
    Le[n] = new Ge(n, 1, !1, n.toLowerCase(), null, !0);
  });
  var Zt = r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  Zt.hasOwnProperty("ReactCurrentDispatcher") || (Zt.ReactCurrentDispatcher = { current: null }), Zt.hasOwnProperty("ReactCurrentBatchConfig") || (Zt.ReactCurrentBatchConfig = { suspense: null });
  function Mt(n, a, u, f) {
    var v = Le.hasOwnProperty(a) ? Le[a] : null, x = v !== null ? v.type === 0 : f ? !1 : !(!(2 < a.length) || a[0] !== "o" && a[0] !== "O" || a[1] !== "n" && a[1] !== "N");
    x || (it(a, u, v, f) && (u = null), f || v === null ? xe(a) && (u === null ? n.removeAttribute(a) : n.setAttribute(a, "" + u)) : v.mustUseProperty ? n[v.propertyName] = u === null ? v.type === 3 ? !1 : "" : u : (a = v.attributeName, f = v.attributeNamespace, u === null ? n.removeAttribute(a) : (v = v.type, u = v === 3 || v === 4 && u === !0 ? "" : "" + u, f ? n.setAttributeNS(f, a, u) : n.setAttribute(a, u))));
  }
  var wn = /^(.*)[\\\/]/, Wt = typeof Symbol == "function" && Symbol.for, Ui = Wt ? Symbol.for("react.element") : 60103, Ci = Wt ? Symbol.for("react.portal") : 60106, Jn = Wt ? Symbol.for("react.fragment") : 60107, Ne = Wt ? Symbol.for("react.strict_mode") : 60108, st = Wt ? Symbol.for("react.profiler") : 60114, He = Wt ? Symbol.for("react.provider") : 60109, jt = Wt ? Symbol.for("react.context") : 60110, bn = Wt ? Symbol.for("react.concurrent_mode") : 60111, ci = Wt ? Symbol.for("react.forward_ref") : 60112, Mr = Wt ? Symbol.for("react.suspense") : 60113, Bn = Wt ? Symbol.for("react.suspense_list") : 60120, Gr = Wt ? Symbol.for("react.memo") : 60115, Vi = Wt ? Symbol.for("react.lazy") : 60116, Ta = Wt ? Symbol.for("react.block") : 60121, Ma = typeof Symbol == "function" && Symbol.iterator;
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
      case Ne:
        return "StrictMode";
      case Mr:
        return "Suspense";
      case Bn:
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
            var f = n._debugOwner, v = n._debugSource, x = fi(n.type);
            u = null, f && (u = fi(f.type)), f = x, x = "", v ? x = " (at " + v.fileName.replace(wn, "") + ":" + v.lineNumber + ")" : u && (x = " (created by " + u + ")"), u = `
    in ` + (f || "Unknown") + x;
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
      var v = u.get, x = u.set;
      return Object.defineProperty(n, a, { configurable: !0, get: function() {
        return v.call(this);
      }, set: function(T) {
        f = "" + T, x.call(this, T);
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
  function mn(n, a) {
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
  function Nn(n) {
    var a = "";
    return r.Children.forEach(n, function(u) {
      u != null && (a += u);
    }), a;
  }
  function Ei(n, a) {
    return n = i({ children: void 0 }, a), (a = Nn(a.children)) && (n.children = a), n;
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
  function kn(n, a) {
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
  var jn = { animationend: Rr("Animation", "AnimationEnd"), animationiteration: Rr("Animation", "AnimationIteration"), animationstart: Rr("Animation", "AnimationStart"), transitionend: Rr("Transition", "TransitionEnd") }, nr = {}, Ms = {};
  Y && (Ms = document.createElement("div").style, "AnimationEvent" in window || (delete jn.animationend.animation, delete jn.animationiteration.animation, delete jn.animationstart.animation), "TransitionEvent" in window || delete jn.transitionend.transition);
  function Kr(n) {
    if (nr[n])
      return nr[n];
    if (!jn[n])
      return n;
    var a = jn[n], u;
    for (u in a)
      if (a.hasOwnProperty(u) && u in Ms)
        return nr[n] = a[u];
    return n;
  }
  var Es = Kr("animationend"), ne = Kr("animationiteration"), de = Kr("animationstart"), Xe = Kr("transitionend"), pt = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), Jt = new (typeof WeakMap == "function" ? WeakMap : Map)();
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
      var x = v.alternate;
      if (x === null) {
        if (f = v.return, f !== null) {
          u = f;
          continue;
        }
        break;
      }
      if (v.child === x.child) {
        for (x = v.child; x; ) {
          if (x === u)
            return qt(v), n;
          if (x === f)
            return qt(v), a;
          x = x.sibling;
        }
        throw Error(c(188));
      }
      if (u.return !== f.return)
        u = v, f = x;
      else {
        for (var T = !1, R = v.child; R; ) {
          if (R === u) {
            T = !0, u = v, f = x;
            break;
          }
          if (R === f) {
            T = !0, f = v, u = x;
            break;
          }
          R = R.sibling;
        }
        if (!T) {
          for (R = x.child; R; ) {
            if (R === u) {
              T = !0, u = x, f = v;
              break;
            }
            if (R === f) {
              T = !0, f = x, u = v;
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
  function fl(n) {
    if (n) {
      var a = n._dispatchListeners, u = n._dispatchInstances;
      if (Array.isArray(a))
        for (var f = 0; f < a.length && !n.isPropagationStopped(); f++)
          K(n, a[f], u[f]);
      else
        a && K(n, a, u);
      n._dispatchListeners = null, n._dispatchInstances = null, n.isPersistent() || n.constructor.release(n);
    }
  }
  function ea(n) {
    if (n !== null && (Is = an(Is, n)), n = Is, Is = null, n) {
      if (hn(n, fl), Is)
        throw Error(c(95));
      if (g)
        throw n = S, g = !1, S = null, n;
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
      var x = n.nativeEvent, T = n.eventSystemFlags;
      u === 0 && (T |= 64);
      for (var R = null, H = 0; H < ce.length; H++) {
        var U = ce[H];
        U && (U = U.extractEvents(f, a, x, v, T)) && (R = an(R, U));
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
  var P, V, G, Se = !1, Ze = [], Be = null, et = null, Nt = null, vn = /* @__PURE__ */ new Map(), Sn = /* @__PURE__ */ new Map(), Tn = [], ni = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput close cancel copy cut paste click change contextmenu reset submit".split(" "), ii = "focus blur dragenter dragleave mouseover mouseout pointerover pointerout gotpointercapture lostpointercapture".split(" ");
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
        Be = null;
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
        vn.delete(a.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        Sn.delete(a.pointerId);
    }
  }
  function xo(n, a, u, f, v, x) {
    return n === null || n.nativeEvent !== x ? (n = ta(a, u, f, v, x), a !== null && (a = wl(a), a !== null && V(a)), n) : (n.eventSystemFlags |= f, n);
  }
  function pp(n, a, u, f, v) {
    switch (a) {
      case "focus":
        return Be = xo(Be, n, a, u, f, v), !0;
      case "dragenter":
        return et = xo(et, n, a, u, f, v), !0;
      case "mouseover":
        return Nt = xo(Nt, n, a, u, f, v), !0;
      case "pointerover":
        var x = v.pointerId;
        return vn.set(x, xo(vn.get(x) || null, n, a, u, f, v)), !0;
      case "gotpointercapture":
        return x = v.pointerId, Sn.set(x, xo(Sn.get(x) || null, n, a, u, f, v)), !0;
    }
    return !1;
  }
  function wg(n) {
    var a = Ao(n.target);
    if (a !== null) {
      var u = fn(a);
      if (u !== null) {
        if (a = u.tag, a === 13) {
          if (a = ti(u), a !== null) {
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
  function Dr(n) {
    if (n.blockedOn !== null)
      return !1;
    var a = kr(n.topLevelType, n.eventSystemFlags, n.container, n.nativeEvent);
    if (a !== null) {
      var u = wl(a);
      return u !== null && V(u), n.blockedOn = a, !1;
    }
    return !0;
  }
  function mp(n, a, u) {
    Dr(n) && u.delete(a);
  }
  function _d() {
    for (Se = !1; 0 < Ze.length; ) {
      var n = Ze[0];
      if (n.blockedOn !== null) {
        n = wl(n.blockedOn), n !== null && P(n);
        break;
      }
      var a = kr(n.topLevelType, n.eventSystemFlags, n.container, n.nativeEvent);
      a !== null ? n.blockedOn = a : Ze.shift();
    }
    Be !== null && Dr(Be) && (Be = null), et !== null && Dr(et) && (et = null), Nt !== null && Dr(Nt) && (Nt = null), vn.forEach(mp), Sn.forEach(mp);
  }
  function Rs(n, a) {
    n.blockedOn === a && (n.blockedOn = null, Se || (Se = !0, o.unstable_scheduleCallback(o.unstable_NormalPriority, _d)));
  }
  function vp(n) {
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
    for (Be !== null && Rs(Be, n), et !== null && Rs(et, n), Nt !== null && Rs(Nt, n), vn.forEach(a), Sn.forEach(a), u = 0; u < Tn.length; u++)
      f = Tn[u], f.blockedOn === n && (f.blockedOn = null);
    for (; 0 < Tn.length && (u = Tn[0], u.blockedOn === null); )
      wg(u), u.blockedOn === null && Tn.shift();
  }
  var zd = {}, gp = /* @__PURE__ */ new Map(), Od = /* @__PURE__ */ new Map(), Ce = [
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
    Xe,
    "transitionEnd",
    "waiting",
    "waiting"
  ];
  function ju(n, a) {
    for (var u = 0; u < n.length; u += 2) {
      var f = n[u], v = n[u + 1], x = "on" + (v[0].toUpperCase() + v.slice(1));
      x = { phasedRegistrationNames: { bubbled: x, captured: x + "Capture" }, dependencies: [f], eventPriority: a }, Od.set(f, a), gp.set(f, x), zd[v] = x;
    }
  }
  ju("blur blur cancel cancel click click close close contextmenu contextMenu copy copy cut cut auxclick auxClick dblclick doubleClick dragend dragEnd dragstart dragStart drop drop focus focus input input invalid invalid keydown keyDown keypress keyPress keyup keyUp mousedown mouseDown mouseup mouseUp paste paste pause pause play play pointercancel pointerCancel pointerdown pointerDown pointerup pointerUp ratechange rateChange reset reset seeked seeked submit submit touchcancel touchCancel touchend touchEnd touchstart touchStart volumechange volumeChange".split(" "), 0), ju("drag drag dragenter dragEnter dragexit dragExit dragleave dragLeave dragover dragOver mousemove mouseMove mouseout mouseOut mouseover mouseOver pointermove pointerMove pointerout pointerOut pointerover pointerOver scroll scroll toggle toggle touchmove touchMove wheel wheel".split(" "), 1), ju(Ce, 2);
  for (var yp = "change selectionchange textInput compositionstart compositionend compositionupdate".split(" "), Fn = 0; Fn < yp.length; Fn++)
    Od.set(yp[Fn], 0);
  var na = o.unstable_UserBlockingPriority, vl = o.unstable_runWithPriority, Na = !0;
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
    Fe || Ve();
    var v = ri, x = Fe;
    Fe = !0;
    try {
      be(v, n, a, u, f);
    } finally {
      (Fe = x) || Bt();
    }
  }
  function Nr(n, a, u, f) {
    vl(na, ri.bind(null, n, a, u, f));
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
        else if (!pp(v, n, a, u, f)) {
          ir(n, f), n = Bu(n, f, null, a);
          try {
            Ye(ml, n);
          } finally {
            pl(n);
          }
        }
      }
  }
  function kr(n, a, u, f) {
    if (u = hl(f), u = Ao(u), u !== null) {
      var v = fn(u);
      if (v === null)
        u = null;
      else {
        var x = v.tag;
        if (x === 13) {
          if (u = ti(v), u !== null)
            return u;
          u = null;
        } else if (x === 3) {
          if (v.stateNode.hydrate)
            return v.tag === 3 ? v.stateNode.containerInfo : null;
          u = null;
        } else
          v !== u && (u = null);
      }
    }
    n = Bu(n, f, u, a);
    try {
      Ye(ml, n);
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
    var u = Yt(n);
    a = $e[a];
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
  var $d = Math.random().toString(36).slice(2), Pr = "__reactInternalInstance$" + $d, Eo = "__reactEventHandlers$" + $d, Io = "__reactContainere$" + $d;
  function Ao(n) {
    var a = n[Pr];
    if (a)
      return a;
    for (var u = n.parentNode; u; ) {
      if (a = u[Io] || u[Pr]) {
        if (u = a.alternate, a.child !== null || u !== null && u.child !== null)
          for (n = Fd(n); n !== null; ) {
            if (u = n[Pr])
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
    return n = n[Pr] || n[Io], !n || n.tag !== 5 && n.tag !== 6 && n.tag !== 13 && n.tag !== 3 ? null : n;
  }
  function Hi(n) {
    if (n.tag === 5 || n.tag === 6)
      return n.stateNode;
    throw Error(c(33));
  }
  function bl(n) {
    return n[Eo] || null;
  }
  function _r(n) {
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
    (a = Mp(n, u.dispatchConfig.phasedRegistrationNames[a])) && (u._dispatchListeners = an(u._dispatchListeners, a), u._dispatchInstances = an(u._dispatchInstances, n));
  }
  function bg(n) {
    if (n && n.dispatchConfig.phasedRegistrationNames) {
      for (var a = n._targetInst, u = []; a; )
        u.push(a), a = _r(a);
      for (a = u.length; 0 < a--; )
        Ep(u[a], "captured", n);
      for (a = 0; a < u.length; a++)
        Ep(u[a], "bubbled", n);
    }
  }
  function Yu(n, a, u) {
    n && u && u.dispatchConfig.registrationName && (a = Mp(n, u.dispatchConfig.registrationName)) && (u._dispatchListeners = an(u._dispatchListeners, a), u._dispatchInstances = an(u._dispatchInstances, n));
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
    var n, a = Gu, u = a.length, f, v = "value" in ra ? ra.value : ra.textContent, x = v.length;
    for (n = 0; n < u && a[n] === v[n]; n++)
      ;
    var T = u - n;
    for (f = 1; f <= T && a[u - f] === v[x - f]; f++)
      ;
    return Xu = v.slice(n, 1 < f ? 1 - f : void 0);
  }
  function xl() {
    return !0;
  }
  function Ro() {
    return !1;
  }
  function hi(n, a, u, f) {
    this.dispatchConfig = n, this._targetInst = a, this.nativeEvent = u, n = this.constructor.Interface;
    for (var v in n)
      n.hasOwnProperty(v) && ((a = n[v]) ? this[v] = a(u) : v === "target" ? this.target = f : this[v] = u[v]);
    return this.isDefaultPrevented = (u.defaultPrevented != null ? u.defaultPrevented : u.returnValue === !1) ? xl : Ro, this.isPropagationStopped = Ro, this;
  }
  i(hi.prototype, { preventDefault: function() {
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
    return i(v, u.prototype), u.prototype = v, u.prototype.constructor = u, u.Interface = i({}, f.Interface, n), u.extend = f.extend, Ip(u), u;
  }, Ip(hi);
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
  var Ju = hi.extend({ data: null }), Ap = hi.extend({ data: null }), ar = [9, 13, 27, 32], sr = Y && "CompositionEvent" in window, ai = null;
  Y && "documentMode" in document && (ai = document.documentMode);
  var ka = Y && "TextEvent" in window && !ai, qu = Y && (!sr || ai && 8 < ai && 11 >= ai), Cl = String.fromCharCode(32), Pa = { beforeInput: { phasedRegistrationNames: { bubbled: "onBeforeInput", captured: "onBeforeInputCapture" }, dependencies: ["compositionend", "keypress", "textInput", "paste"] }, compositionEnd: { phasedRegistrationNames: { bubbled: "onCompositionEnd", captured: "onCompositionEndCapture" }, dependencies: "blur compositionend keydown keypress keyup mousedown".split(" ") }, compositionStart: { phasedRegistrationNames: {
    bubbled: "onCompositionStart",
    captured: "onCompositionStartCapture"
  }, dependencies: "blur compositionstart keydown keypress keyup mousedown".split(" ") }, compositionUpdate: { phasedRegistrationNames: { bubbled: "onCompositionUpdate", captured: "onCompositionUpdateCapture" }, dependencies: "blur compositionupdate keydown keypress keyup mousedown".split(" ") } }, Sg = !1;
  function Tl(n, a) {
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
  var _a = !1;
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
    if (_a)
      return n === "compositionend" || !sr && Tl(n, a) ? (n = Sl(), Xu = Gu = ra = null, _a = !1, n) : null;
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
  var Gd = { eventTypes: Pa, extractEvents: function(n, a, u, f) {
    var v;
    if (sr)
      e: {
        switch (n) {
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
      _a ? Tl(n, u) && (x = Pa.compositionEnd) : n === "keydown" && u.keyCode === 229 && (x = Pa.compositionStart);
    return x ? (qu && u.locale !== "ko" && (_a || x !== Pa.compositionStart ? x === Pa.compositionEnd && _a && (v = Sl()) : (ra = f, Gu = "value" in ra ? ra.value : ra.textContent, _a = !0)), x = Ju.getPooled(
      x,
      a,
      u,
      f
    ), v ? x.data = v : (v = ks(u), v !== null && (x.data = v)), Ns(x), v = x) : v = null, (n = ka ? Rp(n, u) : Ku(n, u)) ? (a = Ap.getPooled(Pa.beforeInput, a, u, f), a.data = n, Ns(a)) : a = null, v === null ? a : a === null ? v : [v, a];
  } }, Dp = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
  function Xd(n) {
    var a = n && n.nodeName && n.nodeName.toLowerCase();
    return a === "input" ? !!Dp[n.type] : a === "textarea";
  }
  var Jd = { change: { phasedRegistrationNames: { bubbled: "onChange", captured: "onChangeCapture" }, dependencies: "blur change click focus input keydown keyup selectionchange".split(" ") } };
  function Un(n, a, u) {
    return n = hi.getPooled(Jd.change, n, a, u), n.type = "change", _e(u), Ns(n), n;
  }
  var Ps = null, _s = null;
  function ec(n) {
    ea(n);
  }
  function za(n) {
    var a = Hi(n);
    if (Ir(a))
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
    if (n.propertyName === "value" && za(_s))
      if (n = Un(_s, n, hl(n)), Fe)
        ea(n);
      else {
        Fe = !0;
        try {
          Qe(ec, n);
        } finally {
          Fe = !1, Bt();
        }
      }
  }
  function qd(n, a, u) {
    n === "focus" ? (aa(), Ps = a, _s = u, Ps.attachEvent("onpropertychange", El)) : n === "blur" && aa();
  }
  function Il(n) {
    if (n === "selectionchange" || n === "keyup" || n === "keydown")
      return za(_s);
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
    var v = a ? Hi(a) : window, x = v.nodeName && v.nodeName.toLowerCase();
    if (x === "select" || x === "input" && v.type === "file")
      var T = Ml;
    else if (Xd(v))
      if (Do)
        T = ef;
      else {
        T = Il;
        var R = qd;
      }
    else
      (x = v.nodeName) && x.toLowerCase() === "input" && (v.type === "checkbox" || v.type === "radio") && (T = Kd);
    if (T && (T = T(n, a)))
      return Un(T, u, f);
    R && R(n, v, a), n === "blur" && (n = v._wrapperState) && n.controlled && v.type === "number" && Mi(v, "number", v.value);
  } }, zs = hi.extend({ view: null, detail: null }), Np = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
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
    var x = n === "mouseover" || n === "pointerover", T = n === "mouseout" || n === "pointerout";
    if (x && (v & 32) === 0 && (u.relatedTarget || u.fromElement) || !T && !x)
      return null;
    if (x = f.window === f ? f : (x = f.ownerDocument) ? x.defaultView || x.parentWindow : window, T) {
      if (T = a, a = (a = u.relatedTarget || u.toElement) ? Ao(a) : null, a !== null) {
        var R = fn(a);
        (a !== R || a.tag !== 5 && a.tag !== 6) && (a = null);
      }
    } else
      T = null;
    if (T === a)
      return null;
    if (n === "mouseout" || n === "mouseover")
      var H = Ls, U = Bs.mouseLeave, Te = Bs.mouseEnter, De = "mouse";
    else
      (n === "pointerout" || n === "pointerover") && (H = nc, U = Bs.pointerLeave, Te = Bs.pointerEnter, De = "pointer");
    if (n = T == null ? x : Hi(T), x = a == null ? x : Hi(a), U = H.getPooled(U, T, u, f), U.type = De + "leave", U.target = n, U.relatedTarget = x, u = H.getPooled(Te, a, u, f), u.type = De + "enter", u.target = x, u.relatedTarget = n, f = T, De = a, f && De)
      e: {
        for (H = f, Te = De, T = 0, n = H; n; n = _r(n))
          T++;
        for (n = 0, a = Te; a; a = _r(a))
          n++;
        for (; 0 < T - n; )
          H = _r(H), T--;
        for (; 0 < n - T; )
          Te = _r(Te), n--;
        for (; T--; ) {
          if (H === Te || H === Te.alternate)
            break e;
          H = _r(H), Te = _r(Te);
        }
        H = null;
      }
    else
      H = null;
    for (Te = H, H = []; f && f !== Te && (T = f.alternate, !(T !== null && T === Te)); )
      H.push(f), f = _r(f);
    for (f = []; De && De !== Te && (T = De.alternate, !(T !== null && T === Te)); )
      f.push(De), De = _r(De);
    for (De = 0; De < H.length; De++)
      Yu(H[De], "bubbled", U);
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
  var Dl = Y && "documentMode" in document && 11 >= document.documentMode, zr = { select: { phasedRegistrationNames: { bubbled: "onSelect", captured: "onSelectCapture" }, dependencies: "blur contextmenu dragend focus keydown keyup mousedown mouseup selectionchange".split(" ") } }, Vn = null, Fi = null, si = null, Oa = !1;
  function ic(n, a) {
    var u = a.window === a ? a.document : a.nodeType === 9 ? a : a.ownerDocument;
    return Oa || Vn == null || Vn !== Hu(u) ? null : (u = Vn, "selectionStart" in u && Wu(u) ? u = { start: u.selectionStart, end: u.selectionEnd } : (u = (u.ownerDocument && u.ownerDocument.defaultView || window).getSelection(), u = { anchorNode: u.anchorNode, anchorOffset: u.anchorOffset, focusNode: u.focusNode, focusOffset: u.focusOffset }), si && sa(si, u) ? null : (si = u, n = hi.getPooled(zr.select, Fi, n, a), n.type = "select", n.target = Vn, Ns(n), n));
  }
  var of = { eventTypes: zr, extractEvents: function(n, a, u, f, v, x) {
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
    switch (v = a ? Hi(a) : window, n) {
      case "focus":
        (Xd(v) || v.contentEditable === "true") && (Vn = v, Fi = a, si = null);
        break;
      case "blur":
        si = Fi = Vn = null;
        break;
      case "mousedown":
        Oa = !0;
        break;
      case "contextmenu":
      case "mouseup":
      case "dragend":
        return Oa = !1, ic(u, f);
      case "selectionchange":
        if (Dl)
          break;
      case "keydown":
      case "keyup":
        return ic(u, f);
    }
    return null;
  } }, lf = hi.extend({ animationName: null, elapsedTime: null, pseudoElement: null }), rc = hi.extend({ clipboardData: function(n) {
    return "clipboardData" in n ? n.clipboardData : window.clipboardData;
  } }), oa = zs.extend({ relatedTarget: null });
  function Nl(n) {
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
  }, kl = zs.extend({ key: function(n) {
    if (n.key) {
      var a = La[n.key] || n.key;
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
  } }), Pl = Ls.extend({ dataTransfer: null }), uf = zs.extend({ touches: null, targetTouches: null, changedTouches: null, altKey: null, metaKey: null, ctrlKey: null, shiftKey: null, getModifierState: Os }), cf = hi.extend({ propertyName: null, elapsedTime: null, pseudoElement: null }), df = Ls.extend({ deltaX: function(n) {
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
      case de:
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
        n = hi;
    }
    return a = n.getPooled(v, a, u, f), Ns(a), a;
  } };
  if (q)
    throw Error(c(101));
  q = Array.prototype.slice.call("ResponderEventPlugin SimpleEventPlugin EnterLeaveEventPlugin ChangeEventPlugin SelectEventPlugin BeforeInputEventPlugin".split(" ")), se();
  var hf = wl;
  z = bl, F = hf, $ = Hi, je({ SimpleEventPlugin: ff, EnterLeaveEventPlugin: af, ChangeEventPlugin: tf, SelectEventPlugin: of, BeforeInputEventPlugin: Gd });
  var ac = [], Ai = -1;
  function St(n) {
    0 > Ai || (n.current = ac[Ai], ac[Ai] = null, Ai--);
  }
  function sn(n, a) {
    Ai++, ac[Ai] = n.current, n.current = a;
  }
  var Or = {}, Pn = { current: Or }, Mn = { current: !1 }, Lr = Or;
  function Ba(n, a) {
    var u = n.type.contextTypes;
    if (!u)
      return Or;
    var f = n.stateNode;
    if (f && f.__reactInternalMemoizedUnmaskedChildContext === a)
      return f.__reactInternalMemoizedMaskedChildContext;
    var v = {}, x;
    for (x in u)
      v[x] = a[x];
    return f && (n = n.stateNode, n.__reactInternalMemoizedUnmaskedChildContext = a, n.__reactInternalMemoizedMaskedChildContext = v), v;
  }
  function $n(n) {
    return n = n.childContextTypes, n != null;
  }
  function ja() {
    St(Mn), St(Pn);
  }
  function sc(n, a, u) {
    if (Pn.current !== Or)
      throw Error(c(168));
    sn(Pn, a), sn(Mn, u);
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
    return n = (n = n.stateNode) && n.__reactInternalMemoizedMergedChildContext || Or, Lr = Pn.current, sn(Pn, n), sn(Mn, Mn.current), !0;
  }
  function _l(n, a, u) {
    var f = n.stateNode;
    if (!f)
      throw Error(c(169));
    u ? (n = js(n, a, Lr), f.__reactInternalMemoizedMergedChildContext = n, St(Mn), St(Pn), sn(Pn, n)) : St(Mn), sn(Mn, u);
  }
  var pf = o.unstable_runWithPriority, ko = o.unstable_scheduleCallback, oc = o.unstable_cancelCallback, lc = o.unstable_requestPaint, uc = o.unstable_now, mf = o.unstable_getCurrentPriorityLevel, zl = o.unstable_ImmediatePriority, cc = o.unstable_UserBlockingPriority, dc = o.unstable_NormalPriority, vf = o.unstable_LowPriority, Po = o.unstable_IdlePriority, gf = {}, xg = o.unstable_shouldYield, kp = lc !== void 0 ? lc : function() {
  }, or = null, ua = null, yf = !1, Pp = uc(), Pt = 1e4 > Pp ? uc : function() {
    return uc() - Pp;
  };
  function lr() {
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
  function xn(n) {
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
  function xt(n, a) {
    return n = xn(n), pf(n, a);
  }
  function _p(n, a, u) {
    return n = xn(n), ko(n, a, u);
  }
  function Us(n) {
    return or === null ? (or = [n], ua = ko(zl, wf)) : or.push(n), gf;
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
        throw or !== null && (or = or.slice(n + 1)), ko(zl, Ri), u;
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
    var x = v.baseQueue, T = v.shared.pending;
    if (T !== null) {
      if (x !== null) {
        var R = x.next;
        x.next = T.next, T.next = R;
      }
      x = T, v.shared.pending = null, R = n.alternate, R !== null && (R = R.updateQueue, R !== null && (R.baseQueue = T));
    }
    if (x !== null) {
      R = x.next;
      var H = v.baseState, U = 0, Te = null, De = null, mt = null;
      if (R !== null) {
        var Et = R;
        do {
          if (T = Et.expirationTime, T < f) {
            var _i = { expirationTime: Et.expirationTime, suspenseConfig: Et.suspenseConfig, tag: Et.tag, payload: Et.payload, callback: Et.callback, next: null };
            mt === null ? (De = mt = _i, Te = H) : mt = mt.next = _i, T > U && (U = T);
          } else {
            mt !== null && (mt = mt.next = { expirationTime: 1073741823, suspenseConfig: Et.suspenseConfig, tag: Et.tag, payload: Et.payload, callback: Et.callback, next: null }), Ff(T, Et.suspenseConfig);
            e: {
              var Wn = n, O = Et;
              switch (T = a, _i = u, O.tag) {
                case 1:
                  if (Wn = O.payload, typeof Wn == "function") {
                    H = Wn.call(_i, H, T);
                    break e;
                  }
                  H = Wn;
                  break e;
                case 3:
                  Wn.effectTag = Wn.effectTag & -4097 | 64;
                case 0:
                  if (Wn = O.payload, T = typeof Wn == "function" ? Wn.call(_i, H, T) : Wn, T == null)
                    break e;
                  H = i({}, H, T);
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
            Et = x.next = T.next, T.next = R, v.baseQueue = x = T, v.shared.pending = null;
          }
        } while (1);
      }
      mt === null ? Te = H : mt.next = De, v.baseState = Te, v.baseQueue = mt, Xl(U), n.expirationTime = U, n.memoizedState = H;
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
  var Ol = Zt.ReactCurrentBatchConfig, Vs = new r.Component().refs;
  function Oo(n, a, u, f) {
    a = n.memoizedState, u = u(f, a), u = u == null ? a : i({}, a, u), n.memoizedState = u, n.expirationTime === 0 && (n.updateQueue.baseState = u);
  }
  var Fa = { isMounted: function(n) {
    return (n = n._reactInternalFiber) ? fn(n) === n : !1;
  }, enqueueSetState: function(n, a, u) {
    n = n._reactInternalFiber;
    var f = On(), v = Ol.suspense;
    f = Ja(f, n, v), v = Ha(f, v), v.payload = a, u != null && (v.callback = u), Wa(n, v), qa(n, f);
  }, enqueueReplaceState: function(n, a, u) {
    n = n._reactInternalFiber;
    var f = On(), v = Ol.suspense;
    f = Ja(f, n, v), v = Ha(f, v), v.tag = 1, v.payload = a, u != null && (v.callback = u), Wa(n, v), qa(n, f);
  }, enqueueForceUpdate: function(n, a) {
    n = n._reactInternalFiber;
    var u = On(), f = Ol.suspense;
    u = Ja(u, n, f), f = Ha(u, f), f.tag = 2, a != null && (f.callback = a), Wa(n, f), qa(n, u);
  } };
  function zp(n, a, u, f, v, x, T) {
    return n = n.stateNode, typeof n.shouldComponentUpdate == "function" ? n.shouldComponentUpdate(f, x, T) : a.prototype && a.prototype.isPureReactComponent ? !sa(u, f) || !sa(v, x) : !0;
  }
  function Op(n, a, u) {
    var f = !1, v = Or, x = a.contextType;
    return typeof x == "object" && x !== null ? x = Qi(x) : (v = $n(a) ? Lr : Pn.current, f = a.contextTypes, x = (f = f != null) ? Ba(n, v) : Or), a = new a(u, x), n.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = Fa, n.stateNode = a, a._reactInternalFiber = n, f && (n = n.stateNode, n.__reactInternalMemoizedUnmaskedChildContext = v, n.__reactInternalMemoizedMaskedChildContext = x), a;
  }
  function mc(n, a, u, f) {
    n = a.state, typeof a.componentWillReceiveProps == "function" && a.componentWillReceiveProps(u, f), typeof a.UNSAFE_componentWillReceiveProps == "function" && a.UNSAFE_componentWillReceiveProps(u, f), a.state !== n && Fa.enqueueReplaceState(a, a.state, null);
  }
  function Ll(n, a, u, f) {
    var v = n.stateNode;
    v.props = u, v.state = n.memoizedState, v.refs = Vs, hc(n);
    var x = a.contextType;
    typeof x == "object" && x !== null ? v.context = Qi(x) : (x = $n(a) ? Lr : Pn.current, v.context = Ba(n, x)), zo(n, u, v, f), v.state = n.memoizedState, x = a.getDerivedStateFromProps, typeof x == "function" && (Oo(n, a, x, u), v.state = n.memoizedState), typeof a.getDerivedStateFromProps == "function" || typeof v.getSnapshotBeforeUpdate == "function" || typeof v.UNSAFE_componentWillMount != "function" && typeof v.componentWillMount != "function" || (a = v.state, typeof v.componentWillMount == "function" && v.componentWillMount(), typeof v.UNSAFE_componentWillMount == "function" && v.UNSAFE_componentWillMount(), a !== v.state && Fa.enqueueReplaceState(v, v.state, null), zo(n, u, v, f), v.state = n.memoizedState), typeof v.componentDidMount == "function" && (n.effectTag |= 4);
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
        return a !== null && a.ref !== null && typeof a.ref == "function" && a.ref._stringRef === v ? a.ref : (a = function(x) {
          var T = f.refs;
          T === Vs && (T = f.refs = {}), x === null ? delete T[v] : T[v] = x;
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
      return O = hr(O, _), O.index = 0, O.sibling = null, O;
    }
    function x(O, _, Q) {
      return O.index = Q, n ? (Q = O.alternate, Q !== null ? (Q = Q.index, Q < _ ? (O.effectTag = 2, _) : Q) : (O.effectTag = 2, _)) : _;
    }
    function T(O) {
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
    function Te(O, _, Q, le, ye) {
      return _ === null || _.tag !== 7 ? (_ = fa(Q, O.mode, le, ye), _.return = O, _) : (_ = v(_, Q), _.return = O, _);
    }
    function De(O, _, Q) {
      if (typeof _ == "string" || typeof _ == "number")
        return _ = Zf("" + _, O.mode, Q), _.return = O, _;
      if (typeof _ == "object" && _ !== null) {
        switch (_.$$typeof) {
          case Ui:
            return Q = Hc(_.type, _.key, _.props, null, O.mode, Q), Q.ref = jl(O, null, _), Q.return = O, Q;
          case Ci:
            return _ = Yf(_, O.mode, Q), _.return = O, _;
        }
        if (Bl(_) || di(_))
          return _ = fa(_, O.mode, Q, null), _.return = O, _;
        Hs(O, _);
      }
      return null;
    }
    function mt(O, _, Q, le) {
      var ye = _ !== null ? _.key : null;
      if (typeof Q == "string" || typeof Q == "number")
        return ye !== null ? null : R(O, _, "" + Q, le);
      if (typeof Q == "object" && Q !== null) {
        switch (Q.$$typeof) {
          case Ui:
            return Q.key === ye ? Q.type === Jn ? Te(O, _, Q.props.children, le, ye) : H(O, _, Q, le) : null;
          case Ci:
            return Q.key === ye ? U(O, _, Q, le) : null;
        }
        if (Bl(Q) || di(Q))
          return ye !== null ? null : Te(O, _, Q, le, null);
        Hs(O, Q);
      }
      return null;
    }
    function Et(O, _, Q, le, ye) {
      if (typeof le == "string" || typeof le == "number")
        return O = O.get(Q) || null, R(_, O, "" + le, ye);
      if (typeof le == "object" && le !== null) {
        switch (le.$$typeof) {
          case Ui:
            return O = O.get(le.key === null ? Q : le.key) || null, le.type === Jn ? Te(_, O, le.props.children, ye, le.key) : H(_, O, le, ye);
          case Ci:
            return O = O.get(le.key === null ? Q : le.key) || null, U(_, O, le, ye);
        }
        if (Bl(le) || di(le))
          return O = O.get(Q) || null, Te(_, O, le, ye, null);
        Hs(_, le);
      }
      return null;
    }
    function _i(O, _, Q, le) {
      for (var ye = null, ke = null, Je = _, bt = _ = 0, un = null; Je !== null && bt < Q.length; bt++) {
        Je.index > bt ? (un = Je, Je = null) : un = Je.sibling;
        var lt = mt(O, Je, Q[bt], le);
        if (lt === null) {
          Je === null && (Je = un);
          break;
        }
        n && Je && lt.alternate === null && a(O, Je), _ = x(lt, _, bt), ke === null ? ye = lt : ke.sibling = lt, ke = lt, Je = un;
      }
      if (bt === Q.length)
        return u(O, Je), ye;
      if (Je === null) {
        for (; bt < Q.length; bt++)
          Je = De(O, Q[bt], le), Je !== null && (_ = x(Je, _, bt), ke === null ? ye = Je : ke.sibling = Je, ke = Je);
        return ye;
      }
      for (Je = f(O, Je); bt < Q.length; bt++)
        un = Et(Je, O, bt, Q[bt], le), un !== null && (n && un.alternate !== null && Je.delete(un.key === null ? bt : un.key), _ = x(un, _, bt), ke === null ? ye = un : ke.sibling = un, ke = un);
      return n && Je.forEach(function(ns) {
        return a(O, ns);
      }), ye;
    }
    function Wn(O, _, Q, le) {
      var ye = di(Q);
      if (typeof ye != "function")
        throw Error(c(150));
      if (Q = ye.call(Q), Q == null)
        throw Error(c(151));
      for (var ke = ye = null, Je = _, bt = _ = 0, un = null, lt = Q.next(); Je !== null && !lt.done; bt++, lt = Q.next()) {
        Je.index > bt ? (un = Je, Je = null) : un = Je.sibling;
        var ns = mt(O, Je, lt.value, le);
        if (ns === null) {
          Je === null && (Je = un);
          break;
        }
        n && Je && ns.alternate === null && a(O, Je), _ = x(ns, _, bt), ke === null ? ye = ns : ke.sibling = ns, ke = ns, Je = un;
      }
      if (lt.done)
        return u(O, Je), ye;
      if (Je === null) {
        for (; !lt.done; bt++, lt = Q.next())
          lt = De(O, lt.value, le), lt !== null && (_ = x(lt, _, bt), ke === null ? ye = lt : ke.sibling = lt, ke = lt);
        return ye;
      }
      for (Je = f(O, Je); !lt.done; bt++, lt = Q.next())
        lt = Et(Je, O, bt, lt.value, le), lt !== null && (n && lt.alternate !== null && Je.delete(lt.key === null ? bt : lt.key), _ = x(lt, _, bt), ke === null ? ye = lt : ke.sibling = lt, ke = lt);
      return n && Je.forEach(function(jg) {
        return a(O, jg);
      }), ye;
    }
    return function(O, _, Q, le) {
      var ye = typeof Q == "object" && Q !== null && Q.type === Jn && Q.key === null;
      ye && (Q = Q.props.children);
      var ke = typeof Q == "object" && Q !== null;
      if (ke)
        switch (Q.$$typeof) {
          case Ui:
            e: {
              for (ke = Q.key, ye = _; ye !== null; ) {
                if (ye.key === ke) {
                  switch (ye.tag) {
                    case 7:
                      if (Q.type === Jn) {
                        u(O, ye.sibling), _ = v(ye, Q.props.children), _.return = O, O = _;
                        break e;
                      }
                      break;
                    default:
                      if (ye.elementType === Q.type) {
                        u(
                          O,
                          ye.sibling
                        ), _ = v(ye, Q.props), _.ref = jl(O, ye, Q), _.return = O, O = _;
                        break e;
                      }
                  }
                  u(O, ye);
                  break;
                } else
                  a(O, ye);
                ye = ye.sibling;
              }
              Q.type === Jn ? (_ = fa(Q.props.children, O.mode, le, Q.key), _.return = O, O = _) : (le = Hc(Q.type, Q.key, Q.props, null, O.mode, le), le.ref = jl(O, _, Q), le.return = O, O = le);
            }
            return T(O);
          case Ci:
            e: {
              for (ye = Q.key; _ !== null; ) {
                if (_.key === ye)
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
            return T(O);
        }
      if (typeof Q == "string" || typeof Q == "number")
        return Q = "" + Q, _ !== null && _.tag === 6 ? (u(O, _.sibling), _ = v(_, Q), _.return = O, O = _) : (u(O, _), _ = Zf(Q, O.mode, le), _.return = O, O = _), T(O);
      if (Bl(Q))
        return _i(O, _, Q, le);
      if (di(Q))
        return Wn(O, _, Q, le);
      if (ke && Hs(O, Q), typeof Q > "u" && !ye)
        switch (O.tag) {
          case 1:
          case 0:
            throw O = O.type, Error(c(152, O.displayName || O.name || "Component"));
        }
      return u(O, _);
    };
  }
  var Lo = Lp(!0), Tf = Lp(!1), Ul = {}, Br = { current: Ul }, Vl = { current: Ul }, Bo = { current: Ul };
  function Ws(n) {
    if (n === Ul)
      throw Error(c(174));
    return n;
  }
  function vc(n, a) {
    switch (sn(Bo, a), sn(Vl, n), sn(Br, Ul), n = a.nodeType, n) {
      case 9:
      case 11:
        a = (a = a.documentElement) ? a.namespaceURI : kn(null, "");
        break;
      default:
        n = n === 8 ? a.parentNode : a, a = n.namespaceURI || null, n = n.tagName, a = kn(a, n);
    }
    St(Br), sn(Br, a);
  }
  function jo() {
    St(Br), St(Vl), St(Bo);
  }
  function Mf(n) {
    Ws(Bo.current);
    var a = Ws(Br.current), u = kn(a, n.type);
    a !== u && (sn(Vl, n), sn(Br, u));
  }
  function Ef(n) {
    Vl.current === n && (St(Br), St(Vl));
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
  var wc = Zt.ReactCurrentDispatcher, gi = Zt.ReactCurrentBatchConfig, Qn = 0, Ft = null, on = null, ln = null, $a = !1;
  function Hn() {
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
  function If(n, a, u, f, v, x) {
    if (Qn = x, Ft = a, a.memoizedState = null, a.updateQueue = null, a.expirationTime = 0, wc.current = n === null || n.memoizedState === null ? Cg : Tg, n = u(f, v), a.expirationTime === Qn) {
      x = 0;
      do {
        if (a.expirationTime = 0, !(25 > x))
          throw Error(c(301));
        x += 1, ln = on = null, a.updateQueue = null, wc.current = Mg, n = u(f, v);
      } while (a.expirationTime === Qn);
    }
    if (wc.current = Ic, a = on !== null && on.next !== null, Qn = 0, ln = on = Ft = null, $a = !1, a)
      throw Error(c(300));
    return n;
  }
  function $s() {
    var n = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
    return ln === null ? Ft.memoizedState = ln = n : ln = ln.next = n, ln;
  }
  function Uo() {
    if (on === null) {
      var n = Ft.alternate;
      n = n !== null ? n.memoizedState : null;
    } else
      n = on.next;
    var a = ln === null ? Ft.memoizedState : ln.next;
    if (a !== null)
      ln = a, on = n;
    else {
      if (n === null)
        throw Error(c(310));
      on = n, n = { memoizedState: on.memoizedState, baseState: on.baseState, baseQueue: on.baseQueue, queue: on.queue, next: null }, ln === null ? Ft.memoizedState = ln = n : ln = ln.next = n;
    }
    return ln;
  }
  function Qa(n, a) {
    return typeof a == "function" ? a(n) : a;
  }
  function Hl(n) {
    var a = Uo(), u = a.queue;
    if (u === null)
      throw Error(c(311));
    u.lastRenderedReducer = n;
    var f = on, v = f.baseQueue, x = u.pending;
    if (x !== null) {
      if (v !== null) {
        var T = v.next;
        v.next = x.next, x.next = T;
      }
      f.baseQueue = v = x, u.pending = null;
    }
    if (v !== null) {
      v = v.next, f = f.baseState;
      var R = T = x = null, H = v;
      do {
        var U = H.expirationTime;
        if (U < Qn) {
          var Te = { expirationTime: H.expirationTime, suspenseConfig: H.suspenseConfig, action: H.action, eagerReducer: H.eagerReducer, eagerState: H.eagerState, next: null };
          R === null ? (T = R = Te, x = f) : R = R.next = Te, U > Ft.expirationTime && (Ft.expirationTime = U, Xl(U));
        } else
          R !== null && (R = R.next = { expirationTime: 1073741823, suspenseConfig: H.suspenseConfig, action: H.action, eagerReducer: H.eagerReducer, eagerState: H.eagerState, next: null }), Ff(U, H.suspenseConfig), f = H.eagerReducer === n ? H.eagerState : n(f, H.action);
        H = H.next;
      } while (H !== null && H !== v);
      R === null ? x = f : R.next = T, Ii(f, a.memoizedState) || (cr = !0), a.memoizedState = f, a.baseState = x, a.baseQueue = R, u.lastRenderedState = f;
    }
    return [a.memoizedState, u.dispatch];
  }
  function bc(n) {
    var a = Uo(), u = a.queue;
    if (u === null)
      throw Error(c(311));
    u.lastRenderedReducer = n;
    var f = u.dispatch, v = u.pending, x = a.memoizedState;
    if (v !== null) {
      u.pending = null;
      var T = v = v.next;
      do
        x = n(x, T.action), T = T.next;
      while (T !== v);
      Ii(x, a.memoizedState) || (cr = !0), a.memoizedState = x, a.baseQueue === null && (a.baseState = x), u.lastRenderedState = x;
    }
    return [x, f];
  }
  function Sc(n) {
    var a = $s();
    return typeof n == "function" && (n = n()), a.memoizedState = a.baseState = n, n = a.queue = { pending: null, dispatch: null, lastRenderedReducer: Qa, lastRenderedState: n }, n = n.dispatch = Ec.bind(null, Ft, n), [a.memoizedState, n];
  }
  function xc(n, a, u, f) {
    return n = { tag: n, create: a, destroy: u, deps: f, next: null }, a = Ft.updateQueue, a === null ? (a = { lastEffect: null }, Ft.updateQueue = a, a.lastEffect = n.next = n) : (u = a.lastEffect, u === null ? a.lastEffect = n.next = n : (f = u.next, u.next = n, n.next = f, a.lastEffect = n)), n;
  }
  function Af() {
    return Uo().memoizedState;
  }
  function Qs(n, a, u, f) {
    var v = $s();
    Ft.effectTag |= n, v.memoizedState = xc(1 | a, u, void 0, f === void 0 ? null : f);
  }
  function Rf(n, a, u, f) {
    var v = Uo();
    f = f === void 0 ? null : f;
    var x = void 0;
    if (on !== null) {
      var T = on.memoizedState;
      if (x = T.destroy, f !== null && Fs(f, T.deps)) {
        xc(a, u, x, f);
        return;
      }
    }
    Ft.effectTag |= n, v.memoizedState = xc(1 | a, u, x, f);
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
    var f = On(), v = Ol.suspense;
    f = Ja(f, n, v), v = { expirationTime: f, suspenseConfig: v, action: u, eagerReducer: null, eagerState: null, next: null };
    var x = a.pending;
    if (x === null ? v.next = v : (v.next = x.next, x.next = v), a.pending = v, x = n.alternate, n === Ft || x !== null && x === Ft)
      $a = !0, v.expirationTime = Qn, Ft.expirationTime = Qn;
    else {
      if (n.expirationTime === 0 && (x === null || x.expirationTime === 0) && (x = a.lastRenderedReducer, x !== null))
        try {
          var T = a.lastRenderedState, R = x(T, u);
          if (v.eagerReducer = x, v.eagerState = R, Ii(R, T))
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
  var Ic = { readContext: Qi, useCallback: Hn, useContext: Hn, useEffect: Hn, useImperativeHandle: Hn, useLayoutEffect: Hn, useMemo: Hn, useReducer: Hn, useRef: Hn, useState: Hn, useDebugValue: Hn, useResponder: Hn, useDeferredValue: Hn, useTransition: Hn }, Cg = { readContext: Qi, useCallback: Up, useContext: Qi, useEffect: Bp, useImperativeHandle: function(n, a, u) {
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
    return a = u !== void 0 ? u(a) : a, f.memoizedState = f.baseState = a, n = f.queue = { pending: null, dispatch: null, lastRenderedReducer: n, lastRenderedState: a }, n = n.dispatch = Ec.bind(null, Ft, n), [f.memoizedState, n];
  }, useRef: function(n) {
    var a = $s();
    return n = { current: n }, a.memoizedState = n;
  }, useState: Sc, useDebugValue: Cc, useResponder: yc, useDeferredValue: function(n, a) {
    var u = Sc(n), f = u[0], v = u[1];
    return Bp(function() {
      var x = gi.suspense;
      gi.suspense = a === void 0 ? null : a;
      try {
        v(n);
      } finally {
        gi.suspense = x;
      }
    }, [n, a]), f;
  }, useTransition: function(n) {
    var a = Sc(!1), u = a[0];
    return a = a[1], [Up(Mc.bind(null, a, n), [a, n]), u];
  } }, Tg = { readContext: Qi, useCallback: Tc, useContext: Qi, useEffect: Zs, useImperativeHandle: Vo, useLayoutEffect: Df, useMemo: Nf, useReducer: Hl, useRef: Af, useState: function() {
    return Hl(Qa);
  }, useDebugValue: Cc, useResponder: yc, useDeferredValue: function(n, a) {
    var u = Hl(Qa), f = u[0], v = u[1];
    return Zs(function() {
      var x = gi.suspense;
      gi.suspense = a === void 0 ? null : a;
      try {
        v(n);
      } finally {
        gi.suspense = x;
      }
    }, [n, a]), f;
  }, useTransition: function(n) {
    var a = Hl(Qa), u = a[0];
    return a = a[1], [Tc(Mc.bind(null, a, n), [a, n]), u];
  } }, Mg = { readContext: Qi, useCallback: Tc, useContext: Qi, useEffect: Zs, useImperativeHandle: Vo, useLayoutEffect: Df, useMemo: Nf, useReducer: bc, useRef: Af, useState: function() {
    return bc(Qa);
  }, useDebugValue: Cc, useResponder: yc, useDeferredValue: function(n, a) {
    var u = bc(Qa), f = u[0], v = u[1];
    return Zs(function() {
      var x = gi.suspense;
      gi.suspense = a === void 0 ? null : a;
      try {
        v(n);
      } finally {
        gi.suspense = x;
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
  function Vp(n, a) {
    var u = Vr(5, null, null, 0);
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
      var a = Za;
      if (a) {
        var u = a;
        if (!Hp(n, a)) {
          if (a = Mo(u.nextSibling), !a || !Hp(n, a)) {
            n.effectTag = n.effectTag & -1025 | 2, Ys = !1, ur = n;
            return;
          }
          Vp(ur, u);
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
    if (n.tag !== 5 || a !== "head" && a !== "body" && !yl(a, n.memoizedProps))
      for (a = Za; a; )
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
                Za = Mo(n.nextSibling);
                break e;
              }
              a--;
            } else
              u !== Fu && u !== gl && u !== $u || a++;
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
  function Wp(n, a, u, f, v) {
    u = u.render;
    var x = a.ref;
    return mi(a, v), f = If(n, a, u, f, x, v), n !== null && !cr ? (a.updateQueue = n.updateQueue, a.effectTag &= -517, n.expirationTime <= v && (n.expirationTime = 0), ca(n, a, v)) : (a.effectTag |= 1, Di(n, a, f, v), a.child);
  }
  function Fl(n, a, u, f, v, x) {
    if (n === null) {
      var T = u.type;
      return typeof T == "function" && !Qf(T) && T.defaultProps === void 0 && u.compare === null && u.defaultProps === void 0 ? (a.tag = 15, a.type = T, Dc(n, a, T, f, v, x)) : (n = Hc(u.type, null, f, null, a.mode, x), n.ref = a.ref, n.return = a, a.child = n);
    }
    return T = n.child, v < x && (v = T.memoizedProps, u = u.compare, u = u !== null ? u : sa, u(v, f) && n.ref === a.ref) ? ca(n, a, x) : (a.effectTag |= 1, n = hr(T, f), n.ref = a.ref, n.return = a, a.child = n);
  }
  function Dc(n, a, u, f, v, x) {
    return n !== null && sa(n.memoizedProps, f) && n.ref === a.ref && (cr = !1, v < x) ? (a.expirationTime = n.expirationTime, ca(n, a, x)) : Gs(n, a, u, f, x);
  }
  function Fp(n, a) {
    var u = a.ref;
    (n === null && u !== null || n !== null && n.ref !== u) && (a.effectTag |= 128);
  }
  function Gs(n, a, u, f, v) {
    var x = $n(u) ? Lr : Pn.current;
    return x = Ba(a, x), mi(a, v), u = If(n, a, u, f, x, v), n !== null && !cr ? (a.updateQueue = n.updateQueue, a.effectTag &= -517, n.expirationTime <= v && (n.expirationTime = 0), ca(n, a, v)) : (a.effectTag |= 1, Di(n, a, u, v), a.child);
  }
  function $p(n, a, u, f, v) {
    if ($n(u)) {
      var x = !0;
      No(a);
    } else
      x = !1;
    if (mi(a, v), a.stateNode === null)
      n !== null && (n.alternate = null, a.alternate = null, a.effectTag |= 2), Op(a, u, f), Ll(a, u, f, v), f = !0;
    else if (n === null) {
      var T = a.stateNode, R = a.memoizedProps;
      T.props = R;
      var H = T.context, U = u.contextType;
      typeof U == "object" && U !== null ? U = Qi(U) : (U = $n(u) ? Lr : Pn.current, U = Ba(a, U));
      var Te = u.getDerivedStateFromProps, De = typeof Te == "function" || typeof T.getSnapshotBeforeUpdate == "function";
      De || typeof T.UNSAFE_componentWillReceiveProps != "function" && typeof T.componentWillReceiveProps != "function" || (R !== f || H !== U) && mc(a, T, f, U), vi = !1;
      var mt = a.memoizedState;
      T.state = mt, zo(a, f, T, v), H = a.memoizedState, R !== f || mt !== H || Mn.current || vi ? (typeof Te == "function" && (Oo(a, u, Te, f), H = a.memoizedState), (R = vi || zp(a, u, R, f, mt, H, U)) ? (De || typeof T.UNSAFE_componentWillMount != "function" && typeof T.componentWillMount != "function" || (typeof T.componentWillMount == "function" && T.componentWillMount(), typeof T.UNSAFE_componentWillMount == "function" && T.UNSAFE_componentWillMount()), typeof T.componentDidMount == "function" && (a.effectTag |= 4)) : (typeof T.componentDidMount == "function" && (a.effectTag |= 4), a.memoizedProps = f, a.memoizedState = H), T.props = f, T.state = H, T.context = U, f = R) : (typeof T.componentDidMount == "function" && (a.effectTag |= 4), f = !1);
    } else
      T = a.stateNode, pc(n, a), R = a.memoizedProps, T.props = a.type === a.elementType ? R : pi(a.type, R), H = T.context, U = u.contextType, typeof U == "object" && U !== null ? U = Qi(U) : (U = $n(u) ? Lr : Pn.current, U = Ba(a, U)), Te = u.getDerivedStateFromProps, (De = typeof Te == "function" || typeof T.getSnapshotBeforeUpdate == "function") || typeof T.UNSAFE_componentWillReceiveProps != "function" && typeof T.componentWillReceiveProps != "function" || (R !== f || H !== U) && mc(a, T, f, U), vi = !1, H = a.memoizedState, T.state = H, zo(a, f, T, v), mt = a.memoizedState, R !== f || H !== mt || Mn.current || vi ? (typeof Te == "function" && (Oo(a, u, Te, f), mt = a.memoizedState), (Te = vi || zp(a, u, R, f, H, mt, U)) ? (De || typeof T.UNSAFE_componentWillUpdate != "function" && typeof T.componentWillUpdate != "function" || (typeof T.componentWillUpdate == "function" && T.componentWillUpdate(
        f,
        mt,
        U
      ), typeof T.UNSAFE_componentWillUpdate == "function" && T.UNSAFE_componentWillUpdate(f, mt, U)), typeof T.componentDidUpdate == "function" && (a.effectTag |= 4), typeof T.getSnapshotBeforeUpdate == "function" && (a.effectTag |= 256)) : (typeof T.componentDidUpdate != "function" || R === n.memoizedProps && H === n.memoizedState || (a.effectTag |= 4), typeof T.getSnapshotBeforeUpdate != "function" || R === n.memoizedProps && H === n.memoizedState || (a.effectTag |= 256), a.memoizedProps = f, a.memoizedState = mt), T.props = f, T.state = mt, T.context = U, f = Te) : (typeof T.componentDidUpdate != "function" || R === n.memoizedProps && H === n.memoizedState || (a.effectTag |= 4), typeof T.getSnapshotBeforeUpdate != "function" || R === n.memoizedProps && H === n.memoizedState || (a.effectTag |= 256), f = !1);
    return Pf(n, a, u, f, x, v);
  }
  function Pf(n, a, u, f, v, x) {
    Fp(n, a);
    var T = (a.effectTag & 64) !== 0;
    if (!f && !T)
      return v && _l(a, u, !1), ca(n, a, x);
    f = a.stateNode, Rc.current = a;
    var R = T && typeof u.getDerivedStateFromError != "function" ? null : f.render();
    return a.effectTag |= 1, n !== null && T ? (a.child = Lo(a, n.child, null, x), a.child = Lo(a, null, R, x)) : Di(n, a, R, x), a.memoizedState = f.state, v && _l(a, u, !0), a.child;
  }
  function Nc(n) {
    var a = n.stateNode;
    a.pendingContext ? sc(n, a.pendingContext, a.pendingContext !== a.context) : a.context && sc(n, a.context, !1), vc(n, a.containerInfo);
  }
  var _f = { dehydrated: null, retryTime: 0 };
  function Qp(n, a, u) {
    var f = a.mode, v = a.pendingProps, x = Kt.current, T = !1, R;
    if ((R = (a.effectTag & 64) !== 0) || (R = (x & 2) !== 0 && (n === null || n.memoizedState !== null)), R ? (T = !0, a.effectTag &= -65) : n !== null && n.memoizedState === null || v.fallback === void 0 || v.unstable_avoidThisFallback === !0 || (x |= 1), sn(Kt, x & 1), n === null) {
      if (v.fallback !== void 0 && Wl(a), T) {
        if (T = v.fallback, v = fa(null, f, 0, null), v.return = a, (a.mode & 2) === 0)
          for (n = a.memoizedState !== null ? a.child.child : a.child, v.child = n; n !== null; )
            n.return = v, n = n.sibling;
        return u = fa(T, f, u, null), u.return = a, v.sibling = u, a.memoizedState = _f, a.child = v, u;
      }
      return f = v.children, a.memoizedState = null, a.child = Tf(a, null, f, u);
    }
    if (n.memoizedState !== null) {
      if (n = n.child, f = n.sibling, T) {
        if (v = v.fallback, u = hr(n, n.pendingProps), u.return = a, (a.mode & 2) === 0 && (T = a.memoizedState !== null ? a.child.child : a.child, T !== n.child))
          for (u.child = T; T !== null; )
            T.return = u, T = T.sibling;
        return f = hr(f, v), f.return = a, u.sibling = f, u.childExpirationTime = 0, a.memoizedState = _f, a.child = u, f;
      }
      return u = Lo(a, n.child, v.children, u), a.memoizedState = null, a.child = u;
    }
    if (n = n.child, T) {
      if (T = v.fallback, v = fa(null, f, 0, null), v.return = a, v.child = n, n !== null && (n.return = v), (a.mode & 2) === 0)
        for (n = a.memoizedState !== null ? a.child.child : a.child, v.child = n; n !== null; )
          n.return = v, n = n.sibling;
      return u = fa(T, f, u, null), u.return = a, v.sibling = u, u.effectTag |= 2, v.childExpirationTime = 0, a.memoizedState = _f, a.child = v, u;
    }
    return a.memoizedState = null, a.child = Lo(a, n, v.children, u);
  }
  function Zp(n, a) {
    n.expirationTime < a && (n.expirationTime = a);
    var u = n.alternate;
    u !== null && u.expirationTime < a && (u.expirationTime = a), _o(n.return, a);
  }
  function kc(n, a, u, f, v, x) {
    var T = n.memoizedState;
    T === null ? n.memoizedState = { isBackwards: a, rendering: null, renderingStartTime: 0, last: f, tail: u, tailExpiration: 0, tailMode: v, lastEffect: x } : (T.isBackwards = a, T.rendering = null, T.renderingStartTime = 0, T.last = f, T.tail = u, T.tailExpiration = 0, T.tailMode = v, T.lastEffect = x);
  }
  function Yp(n, a, u) {
    var f = a.pendingProps, v = f.revealOrder, x = f.tail;
    if (Di(n, a, f.children, u), f = Kt.current, (f & 2) !== 0)
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
    if (sn(Kt, f), (a.mode & 2) === 0)
      a.memoizedState = null;
    else
      switch (v) {
        case "forwards":
          for (u = a.child, v = null; u !== null; )
            n = u.alternate, n !== null && gc(n) === null && (v = u), u = u.sibling;
          u = v, u === null ? (v = a.child, a.child = null) : (v = u.sibling, u.sibling = null), kc(a, !1, v, u, x, a.lastEffect);
          break;
        case "backwards":
          for (u = null, v = a.child, a.child = null; v !== null; ) {
            if (n = v.alternate, n !== null && gc(n) === null) {
              a.child = v;
              break;
            }
            n = v.sibling, v.sibling = u, u = v, v = n;
          }
          kc(a, !0, u, null, x, a.lastEffect);
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
      for (n = a.child, u = hr(n, n.pendingProps), a.child = u, u.return = a; n.sibling !== null; )
        n = n.sibling, u = u.sibling = hr(n, n.pendingProps), u.return = a;
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
    var x = n.memoizedProps;
    if (x !== f) {
      var T = a.stateNode;
      switch (Ws(Br.current), n = null, u) {
        case "input":
          x = mn(T, x), f = mn(T, f), n = [];
          break;
        case "option":
          x = Ei(T, x), f = Ei(T, f), n = [];
          break;
        case "select":
          x = i({}, x, { value: void 0 }), f = i({}, f, { value: void 0 }), n = [];
          break;
        case "textarea":
          x = Jr(T, x), f = Jr(T, f), n = [];
          break;
        default:
          typeof x.onClick != "function" && typeof f.onClick == "function" && (T.onclick = Ds);
      }
      Vu(u, f);
      var R, H;
      u = null;
      for (R in x)
        if (!f.hasOwnProperty(R) && x.hasOwnProperty(R) && x[R] != null)
          if (R === "style")
            for (H in T = x[R], T)
              T.hasOwnProperty(H) && (u || (u = {}), u[H] = "");
          else
            R !== "dangerouslySetInnerHTML" && R !== "children" && R !== "suppressContentEditableWarning" && R !== "suppressHydrationWarning" && R !== "autoFocus" && (Oe.hasOwnProperty(R) ? n || (n = []) : (n = n || []).push(R, null));
      for (R in f) {
        var U = f[R];
        if (T = x != null ? x[R] : void 0, f.hasOwnProperty(R) && U !== T && (U != null || T != null))
          if (R === "style")
            if (T) {
              for (H in T)
                !T.hasOwnProperty(H) || U && U.hasOwnProperty(H) || (u || (u = {}), u[H] = "");
              for (H in U)
                U.hasOwnProperty(H) && T[H] !== U[H] && (u || (u = {}), u[H] = U[H]);
            } else
              u || (n || (n = []), n.push(R, u)), u = U;
          else
            R === "dangerouslySetInnerHTML" ? (U = U ? U.__html : void 0, T = T ? T.__html : void 0, U != null && T !== U && (n = n || []).push(R, U)) : R === "children" ? T === U || typeof U != "string" && typeof U != "number" || (n = n || []).push(R, "" + U) : R !== "suppressContentEditableWarning" && R !== "suppressHydrationWarning" && (Oe.hasOwnProperty(R) ? (U != null && ia(v, R), n || T === U || (n = [])) : (n = n || []).push(R, U));
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
        return $n(a.type) && ja(), null;
      case 3:
        return jo(), St(Mn), St(Pn), u = a.stateNode, u.pendingContext && (u.context = u.pendingContext, u.pendingContext = null), n !== null && n.child !== null || !Ac(a) || (a.effectTag |= 4), Pc(a), null;
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
            var x = a.memoizedProps;
            switch (f[Pr] = a, f[Eo] = x, v) {
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
                qn(f, x), ft("invalid", f), ia(u, "onChange");
                break;
              case "select":
                f._wrapperState = { wasMultiple: !!x.multiple }, ft("invalid", f), ia(u, "onChange");
                break;
              case "textarea":
                Aa(f, x), ft("invalid", f), ia(u, "onChange");
            }
            Vu(v, x), n = null;
            for (var T in x)
              if (x.hasOwnProperty(T)) {
                var R = x[T];
                T === "children" ? typeof R == "string" ? f.textContent !== R && (n = ["children", R]) : typeof R == "number" && f.textContent !== "" + R && (n = ["children", "" + R]) : Oe.hasOwnProperty(T) && R != null && ia(u, T);
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
            u = n, a.updateQueue = u, u !== null && (a.effectTag |= 4);
          } else {
            switch (T = u.nodeType === 9 ? u : u.ownerDocument, n === xp && (n = Ra(v)), n === xp ? v === "script" ? (n = T.createElement("div"), n.innerHTML = "<script><\/script>", n = n.removeChild(n.firstChild)) : typeof f.is == "string" ? n = T.createElement(v, { is: f.is }) : (n = T.createElement(v), v === "select" && (T = n, f.multiple ? T.multiple = !0 : f.size && (T.size = f.size))) : n = T.createElementNS(n, v), n[Pr] = a, n[Eo] = f, Gp(n, a, !1, !1), a.stateNode = n, T = Ld(v, f), v) {
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
                qn(n, f), R = mn(n, f), ft("invalid", n), ia(u, "onChange");
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
            var H = R;
            for (x in H)
              if (H.hasOwnProperty(x)) {
                var U = H[x];
                x === "style" ? bp(n, U) : x === "dangerouslySetInnerHTML" ? (U = U ? U.__html : void 0, U != null && qr(n, U)) : x === "children" ? typeof U == "string" ? (v !== "textarea" || U !== "") && ei(n, U) : typeof U == "number" && ei(n, "" + U) : x !== "suppressContentEditableWarning" && x !== "suppressHydrationWarning" && x !== "autoFocus" && (Oe.hasOwnProperty(x) ? U != null && ia(u, x) : U != null && Mt(n, x, U, T));
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
          u = Ws(Bo.current), Ws(Br.current), Ac(a) ? (u = a.stateNode, f = a.memoizedProps, u[Pr] = a, u.nodeValue !== f && (a.effectTag |= 4)) : (u = (u.nodeType === 9 ? u : u.ownerDocument).createTextNode(f), u[Pr] = a, a.stateNode = u);
        }
        return null;
      case 13:
        return St(Kt), f = a.memoizedState, (a.effectTag & 64) !== 0 ? (a.expirationTime = u, a) : (u = f !== null, f = !1, n === null ? a.memoizedProps.fallback !== void 0 && Ac(a) : (v = n.memoizedState, f = v !== null, u || v === null || (v = n.child.sibling, v !== null && (x = a.firstEffect, x !== null ? (a.firstEffect = v, v.nextEffect = x) : (a.firstEffect = a.lastEffect = v, v.nextEffect = null), v.effectTag = 8))), u && !f && (a.mode & 2) !== 0 && (n === null && a.memoizedProps.unstable_avoidThisFallback !== !0 || (Kt.current & 1) !== 0 ? pn === Ya && (pn = Yl) : ((pn === Ya || pn === Yl) && (pn = Lc), dr !== 0 && Ni !== null && (io(Ni, Vt), Gf(Ni, dr)))), (u || f) && (a.effectTag |= 4), null);
      case 4:
        return jo(), Pc(a), null;
      case 10:
        return Sf(a), null;
      case 17:
        return $n(a.type) && ja(), null;
      case 19:
        if (St(Kt), f = a.memoizedState, f === null)
          return null;
        if (v = (a.effectTag & 64) !== 0, x = f.rendering, x === null) {
          if (v)
            $l(f, !1);
          else if (pn !== Ya || n !== null && (n.effectTag & 64) !== 0)
            for (x = a.child; x !== null; ) {
              if (n = gc(x), n !== null) {
                for (a.effectTag |= 64, $l(f, !1), v = n.updateQueue, v !== null && (a.updateQueue = v, a.effectTag |= 4), f.lastEffect === null && (a.firstEffect = null), a.lastEffect = f.lastEffect, f = a.child; f !== null; )
                  v = f, x = u, v.effectTag &= 2, v.nextEffect = null, v.firstEffect = null, v.lastEffect = null, n = v.alternate, n === null ? (v.childExpirationTime = 0, v.expirationTime = x, v.child = null, v.memoizedProps = null, v.memoizedState = null, v.updateQueue = null, v.dependencies = null) : (v.childExpirationTime = n.childExpirationTime, v.expirationTime = n.expirationTime, v.child = n.child, v.memoizedProps = n.memoizedProps, v.memoizedState = n.memoizedState, v.updateQueue = n.updateQueue, x = n.dependencies, v.dependencies = x === null ? null : { expirationTime: x.expirationTime, firstContext: x.firstContext, responders: x.responders }), f = f.sibling;
                return sn(Kt, Kt.current & 1 | 2), a.child;
              }
              x = x.sibling;
            }
        } else {
          if (!v)
            if (n = gc(x), n !== null) {
              if (a.effectTag |= 64, v = !0, u = n.updateQueue, u !== null && (a.updateQueue = u, a.effectTag |= 4), $l(f, !0), f.tail === null && f.tailMode === "hidden" && !x.alternate)
                return a = a.lastEffect = f.lastEffect, a !== null && (a.nextEffect = null), null;
            } else
              2 * Pt() - f.renderingStartTime > f.tailExpiration && 1 < u && (a.effectTag |= 64, v = !0, $l(f, !1), a.expirationTime = a.childExpirationTime = u - 1);
          f.isBackwards ? (x.sibling = a.child, a.child = x) : (u = f.last, u !== null ? u.sibling = x : a.child = x, f.last = x);
        }
        return f.tail !== null ? (f.tailExpiration === 0 && (f.tailExpiration = Pt() + 500), u = f.tail, f.rendering = u, f.tail = u.sibling, f.lastEffect = a.lastEffect, f.renderingStartTime = Pt(), u.sibling = null, a = Kt.current, sn(Kt, v ? a & 1 | 2 : a & 1), u) : null;
    }
    throw Error(c(
      156,
      a.tag
    ));
  }
  function Eg(n) {
    switch (n.tag) {
      case 1:
        $n(n.type) && ja();
        var a = n.effectTag;
        return a & 4096 ? (n.effectTag = a & -4097 | 64, n) : null;
      case 3:
        if (jo(), St(Mn), St(Pn), a = n.effectTag, (a & 64) !== 0)
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
  var Ig = typeof WeakSet == "function" ? WeakSet : Set;
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
  function Ag(n, a) {
    try {
      a.props = n.memoizedProps, a.state = n.memoizedState, a.componentWillUnmount();
    } catch (u) {
      es(n, u);
    }
  }
  function Jp(n) {
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
          xt(97 < u ? 97 : u, function() {
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
    u.effectTag & 16 && (ei(a, ""), u.effectTag &= -17);
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
    for (var f = a, v = !1, x, T; ; ) {
      if (!v) {
        v = f.return;
        e:
          for (; ; ) {
            if (v === null)
              throw Error(c(160));
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
          for (var R = n, H = f, U = u, Te = H; ; )
            if (Bf(R, Te, U), Te.child !== null && Te.tag !== 4)
              Te.child.return = Te, Te = Te.child;
            else {
              if (Te === H)
                break e;
              for (; Te.sibling === null; ) {
                if (Te.return === null || Te.return === H)
                  break e;
                Te = Te.return;
              }
              Te.sibling.return = Te.return, Te = Te.sibling;
            }
        T ? (R = x, H = f.stateNode, R.nodeType === 8 ? R.parentNode.removeChild(H) : R.removeChild(H)) : x.removeChild(f.stateNode);
      } else if (f.tag === 4) {
        if (f.child !== null) {
          x = f.stateNode.containerInfo, T = !0, f.child.return = f, f = f.child;
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
          var x = a.updateQueue;
          if (a.updateQueue = null, x !== null) {
            for (u[Eo] = f, n === "input" && f.type === "radio" && f.name != null && Ia(u, f), Ld(n, v), a = Ld(n, f), v = 0; v < x.length; v += 2) {
              var T = x[v], R = x[v + 1];
              T === "style" ? bp(u, R) : T === "dangerouslySetInnerHTML" ? qr(u, R) : T === "children" ? ei(u, R) : Mt(u, T, R, a);
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
        a = a.stateNode, a.hydrate && (a.hydrate = !1, vp(a.containerInfo));
        return;
      case 12:
        return;
      case 13:
        if (u = a, a.memoizedState === null ? f = !1 : (f = !0, u = a.child, Ga = Pt()), u !== null)
          e:
            for (n = u; ; ) {
              if (n.tag === 5)
                x = n.stateNode, f ? (x = x.style, typeof x.setProperty == "function" ? x.setProperty("display", "none", "important") : x.display = "none") : (x = n.stateNode, v = n.memoizedProps.style, v = v != null && v.hasOwnProperty("display") ? v.display : null, x.style.display = wp("display", v));
              else if (n.tag === 6)
                n.stateNode.nodeValue = f ? "" : n.memoizedProps;
              else if (n.tag === 13 && n.memoizedState !== null && n.memoizedState.dehydrated === null) {
                x = n.child.sibling, x.return = n, n = x;
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
    u = Ha(u, null), u.tag = 3, u.payload = { element: null };
    var f = a.value;
    return u.callback = function() {
      eo || (eo = !0, Wo = f), Of(n, a);
    }, u;
  }
  function im(n, a, u) {
    u = Ha(u, null), u.tag = 3;
    var f = n.type.getDerivedStateFromError;
    if (typeof f == "function") {
      var v = a.value;
      u.payload = function() {
        return Of(n, a), f(v);
      };
    }
    var x = n.stateNode;
    return x !== null && typeof x.componentDidCatch == "function" && (u.callback = function() {
      typeof f != "function" && (Yi === null ? Yi = /* @__PURE__ */ new Set([this]) : Yi.add(this), Of(n, a));
      var T = a.stack;
      this.componentDidCatch(a.value, { componentStack: T !== null ? T : "" });
    }), u;
  }
  var Ng = Math.ceil, Oc = Zt.ReactCurrentDispatcher, rm = Zt.ReactCurrentOwner, _n = 0, Uf = 8, Zi = 16, jr = 32, Ya = 0, zn = 1, am = 2, Yl = 3, Lc = 4, Vf = 5, at = _n, Ni = null, ot = null, Vt = 0, pn = Ya, qs = null, ki = 1073741823, Ho = 1073741823, Ur = null, dr = 0, Ks = !1, Ga = 0, Bc = 500, ze = null, eo = !1, Wo = null, Yi = null, Gl = !1, Xa = null, Fo = 90, fr = null, $o = 0, Hf = null, jc = 0;
  function On() {
    return (at & (Zi | jr)) !== _n ? 1073741821 - (Pt() / 10 | 0) : jc !== 0 ? jc : jc = 1073741821 - (Pt() / 10 | 0);
  }
  function Ja(n, a, u) {
    if (a = a.mode, (a & 2) === 0)
      return 1073741823;
    var f = lr();
    if ((a & 4) === 0)
      return f === 99 ? 1073741823 : 1073741822;
    if ((at & Zi) !== _n)
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
      a === 1073741823 ? (at & Uf) !== _n && (at & (Zi | jr)) === _n ? Wf(n) : (Pi(n), at === _n && Ri()) : Pi(n), (at & 4) === _n || u !== 98 && u !== 99 || (fr === null ? fr = /* @__PURE__ */ new Map([[n, a]]) : (u = fr.get(n), (u === void 0 || u > a) && fr.set(n, a)));
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
    return v !== null && (Ni === v && (Xl(a), pn === Lc && io(v, Vt)), Gf(v, a)), v;
  }
  function Uc(n) {
    var a = n.lastExpiredTime;
    if (a !== 0 || (a = n.firstPendingTime, !wm(n, a)))
      return a;
    var u = n.lastPingedTime;
    return n = n.nextKnownPendingLevel, n = u > n ? u : n, 2 >= n && a !== n ? 0 : n;
  }
  function Pi(n) {
    if (n.lastExpiredTime !== 0)
      n.callbackExpirationTime = 1073741823, n.callbackPriority = 99, n.callbackNode = Us(Wf.bind(null, n));
    else {
      var a = Uc(n), u = n.callbackNode;
      if (a === 0)
        u !== null && (n.callbackNode = null, n.callbackExpirationTime = 0, n.callbackPriority = 90);
      else {
        var f = On();
        if (a === 1073741823 ? f = 99 : a === 1 || a === 2 ? f = 95 : (f = 10 * (1073741821 - a) - 10 * (1073741821 - f), f = 0 >= f ? 99 : 250 >= f ? 98 : 5250 >= f ? 97 : 95), u !== null) {
          var v = n.callbackPriority;
          if (n.callbackExpirationTime === a && v >= f)
            return;
          u !== gf && oc(u);
        }
        n.callbackExpirationTime = a, n.callbackPriority = f, a = a === 1073741823 ? Us(Wf.bind(null, n)) : _p(f, sm.bind(null, n), { timeout: 10 * (1073741821 - a) - Pt() }), n.callbackNode = a;
      }
    }
  }
  function sm(n, a) {
    if (jc = 0, a)
      return a = On(), ts(n, a), Pi(n), null;
    var u = Uc(n);
    if (u !== 0) {
      if (a = n.callbackNode, (at & (Zi | jr)) !== _n)
        throw Error(c(327));
      if (Qo(), n === Ni && u === Vt || no(n, u), ot !== null) {
        var f = at;
        at |= Zi;
        var v = cm();
        do
          try {
            fm();
            break;
          } catch (R) {
            um(n, R);
          }
        while (1);
        if (bf(), at = f, Oc.current = v, pn === zn)
          throw a = qs, no(n, u), io(n, u), Pi(n), a;
        if (ot === null)
          switch (v = n.finishedWork = n.current.alternate, n.finishedExpirationTime = u, f = pn, Ni = null, f) {
            case Ya:
            case zn:
              throw Error(c(345));
            case am:
              ts(n, 2 < u ? 2 : u);
              break;
            case Yl:
              if (io(n, u), f = n.lastSuspendedTime, u === f && (n.nextKnownPendingLevel = Jl(v)), ki === 1073741823 && (v = Ga + Bc - Pt(), 10 < v)) {
                if (Ks) {
                  var x = n.lastPingedTime;
                  if (x === 0 || x >= u) {
                    n.lastPingedTime = u, no(n, u);
                    break;
                  }
                }
                if (x = Uc(n), x !== 0 && x !== u)
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
              if (Ho !== 1073741823 ? f = 10 * (1073741821 - Ho) - Pt() : ki === 1073741823 ? f = 0 : (f = 10 * (1073741821 - ki) - 5e3, v = Pt(), u = 10 * (1073741821 - u) - v, f = v - f, 0 > f && (f = 0), f = (120 > f ? 120 : 480 > f ? 480 : 1080 > f ? 1080 : 1920 > f ? 1920 : 3e3 > f ? 3e3 : 4320 > f ? 4320 : 1960 * Ng(f / 1960)) - f, u < f && (f = u)), 10 < f) {
                n.timeoutHandle = Zu(Ka.bind(null, n), f);
                break;
              }
              Ka(n);
              break;
            case Vf:
              if (ki !== 1073741823 && Ur !== null) {
                x = ki;
                var T = Ur;
                if (f = T.busyMinDurationMs | 0, 0 >= f ? f = 0 : (v = T.busyDelayMs | 0, x = Pt() - (10 * (1073741821 - x) - (T.timeoutMs | 0 || 5e3)), f = x <= v ? 0 : v + f - x), 10 < f) {
                  io(n, u), n.timeoutHandle = Zu(Ka.bind(null, n), f);
                  break;
                }
              }
              Ka(n);
              break;
            default:
              throw Error(c(329));
          }
        if (Pi(n), n.callbackNode === a)
          return sm.bind(null, n);
      }
    }
    return null;
  }
  function Wf(n) {
    var a = n.lastExpiredTime;
    if (a = a !== 0 ? a : 1073741823, (at & (Zi | jr)) !== _n)
      throw Error(c(327));
    if (Qo(), n === Ni && a === Vt || no(n, a), ot !== null) {
      var u = at;
      at |= Zi;
      var f = cm();
      do
        try {
          dm();
          break;
        } catch (v) {
          um(n, v);
        }
      while (1);
      if (bf(), at = u, Oc.current = f, pn === zn)
        throw u = qs, no(n, a), io(n, a), Pi(n), u;
      if (ot !== null)
        throw Error(c(261));
      n.finishedWork = n.current.alternate, n.finishedExpirationTime = a, Ni = null, Ka(n), Pi(n);
    }
    return null;
  }
  function kg() {
    if (fr !== null) {
      var n = fr;
      fr = null, n.forEach(function(a, u) {
        ts(u, a), Pi(u);
      }), Ri();
    }
  }
  function om(n, a) {
    var u = at;
    at |= 1;
    try {
      return n(a);
    } finally {
      at = u, at === _n && Ri();
    }
  }
  function lm(n, a) {
    var u = at;
    at &= -2, at |= Uf;
    try {
      return n(a);
    } finally {
      at = u, at === _n && Ri();
    }
  }
  function no(n, a) {
    n.finishedWork = null, n.finishedExpirationTime = 0;
    var u = n.timeoutHandle;
    if (u !== -1 && (n.timeoutHandle = -1, Tp(u)), ot !== null)
      for (u = ot.return; u !== null; ) {
        var f = u;
        switch (f.tag) {
          case 1:
            f = f.type.childContextTypes, f != null && ja();
            break;
          case 3:
            jo(), St(Mn), St(Pn);
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
  function um(n, a) {
    do {
      try {
        if (bf(), wc.current = Ic, $a)
          for (var u = Ft.memoizedState; u !== null; ) {
            var f = u.queue;
            f !== null && (f.pending = null), u = u.next;
          }
        if (Qn = 0, ln = on = Ft = null, $a = !1, ot === null || ot.return === null)
          return pn = zn, qs = a, ot = null;
        e: {
          var v = n, x = ot.return, T = ot, R = a;
          if (a = Vt, T.effectTag |= 2048, T.firstEffect = T.lastEffect = null, R !== null && typeof R == "object" && typeof R.then == "function") {
            var H = R;
            if ((T.mode & 2) === 0) {
              var U = T.alternate;
              U ? (T.updateQueue = U.updateQueue, T.memoizedState = U.memoizedState, T.expirationTime = U.expirationTime) : (T.updateQueue = null, T.memoizedState = null);
            }
            var Te = (Kt.current & 1) !== 0, De = x;
            do {
              var mt;
              if (mt = De.tag === 13) {
                var Et = De.memoizedState;
                if (Et !== null)
                  mt = Et.dehydrated !== null;
                else {
                  var _i = De.memoizedProps;
                  mt = _i.fallback === void 0 ? !1 : _i.unstable_avoidThisFallback !== !0 ? !0 : !Te;
                }
              }
              if (mt) {
                var Wn = De.updateQueue;
                if (Wn === null) {
                  var O = /* @__PURE__ */ new Set();
                  O.add(H), De.updateQueue = O;
                } else
                  Wn.add(H);
                if ((De.mode & 2) === 0) {
                  if (De.effectTag |= 64, T.effectTag &= -2981, T.tag === 1)
                    if (T.alternate === null)
                      T.tag = 17;
                    else {
                      var _ = Ha(1073741823, null);
                      _.tag = 2, Wa(T, _);
                    }
                  T.expirationTime = 1073741823;
                  break e;
                }
                R = void 0, T = a;
                var Q = v.pingCache;
                if (Q === null ? (Q = v.pingCache = new nm(), R = /* @__PURE__ */ new Set(), Q.set(H, R)) : (R = Q.get(H), R === void 0 && (R = /* @__PURE__ */ new Set(), Q.set(H, R))), !R.has(T)) {
                  R.add(T);
                  var le = vm.bind(null, v, H, T);
                  H.then(le, le);
                }
                De.effectTag |= 4096, De.expirationTime = a;
                break e;
              }
              De = De.return;
            } while (De !== null);
            R = Error((fi(T.type) || "A React component") + ` suspended while rendering, but no fallback UI was specified.

Add a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display.` + Ea(T));
          }
          pn !== Vf && (pn = am), R = zf(R, T), De = x;
          do {
            switch (De.tag) {
              case 3:
                H = R, De.effectTag |= 4096, De.expirationTime = a;
                var ye = Js(De, H, a);
                xf(De, ye);
                break e;
              case 1:
                H = R;
                var ke = De.type, Je = De.stateNode;
                if ((De.effectTag & 64) === 0 && (typeof ke.getDerivedStateFromError == "function" || Je !== null && typeof Je.componentDidCatch == "function" && (Yi === null || !Yi.has(Je)))) {
                  De.effectTag |= 4096, De.expirationTime = a;
                  var bt = im(De, H, a);
                  xf(De, bt);
                  break e;
                }
            }
            De = De.return;
          } while (De !== null);
        }
        ot = hm(ot);
      } catch (un) {
        a = un;
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
    n < ki && 2 < n && (ki = n), a !== null && n < Ho && 2 < n && (Ho = n, Ur = a);
  }
  function Xl(n) {
    n > dr && (dr = n);
  }
  function dm() {
    for (; ot !== null; )
      ot = $f(ot);
  }
  function fm() {
    for (; ot !== null && !xg(); )
      ot = $f(ot);
  }
  function $f(n) {
    var a = gm(n.alternate, n, Vt);
    return n.memoizedProps = n.pendingProps, a === null && (a = hm(n)), rm.current = null, a;
  }
  function hm(n) {
    ot = n;
    do {
      var a = ot.alternate;
      if (n = ot.return, (ot.effectTag & 2048) === 0) {
        if (a = Xp(a, ot, Vt), Vt === 1 || ot.childExpirationTime !== 1) {
          for (var u = 0, f = ot.child; f !== null; ) {
            var v = f.expirationTime, x = f.childExpirationTime;
            v > u && (u = v), x > u && (u = x), f = f.sibling;
          }
          ot.childExpirationTime = u;
        }
        if (a !== null)
          return a;
        n !== null && (n.effectTag & 2048) === 0 && (n.firstEffect === null && (n.firstEffect = ot.firstEffect), ot.lastEffect !== null && (n.lastEffect !== null && (n.lastEffect.nextEffect = ot.firstEffect), n.lastEffect = ot.lastEffect), 1 < ot.effectTag && (n.lastEffect !== null ? n.lastEffect.nextEffect = ot : n.firstEffect = ot, n.lastEffect = ot));
      } else {
        if (a = Eg(ot), a !== null)
          return a.effectTag &= 2047, a;
        n !== null && (n.firstEffect = n.lastEffect = null, n.effectTag |= 2048);
      }
      if (a = ot.sibling, a !== null)
        return a;
      ot = n;
    } while (ot !== null);
    return pn === Ya && (pn = Vf), null;
  }
  function Jl(n) {
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
    if ((at & (Zi | jr)) !== _n)
      throw Error(c(327));
    var u = n.finishedWork, f = n.finishedExpirationTime;
    if (u === null)
      return null;
    if (n.finishedWork = null, n.finishedExpirationTime = 0, u === n.current)
      throw Error(c(177));
    n.callbackNode = null, n.callbackExpirationTime = 0, n.callbackPriority = 90, n.nextKnownPendingLevel = 0;
    var v = Jl(u);
    if (n.firstPendingTime = v, f <= n.lastSuspendedTime ? n.firstSuspendedTime = n.lastSuspendedTime = n.nextKnownPendingLevel = 0 : f <= n.firstSuspendedTime && (n.firstSuspendedTime = f - 1), f <= n.lastPingedTime && (n.lastPingedTime = 0), f <= n.lastExpiredTime && (n.lastExpiredTime = 0), n === Ni && (ot = Ni = null, Vt = 0), 1 < u.effectTag ? u.lastEffect !== null ? (u.lastEffect.nextEffect = u, v = u.firstEffect) : v = u : v = u.firstEffect, v !== null) {
      var x = at;
      at |= jr, rm.current = null, Qu = Na;
      var T = Vd();
      if (Wu(T)) {
        if ("selectionStart" in T)
          var R = { start: T.selectionStart, end: T.selectionEnd };
        else
          e: {
            R = (R = T.ownerDocument) && R.defaultView || window;
            var H = R.getSelection && R.getSelection();
            if (H && H.rangeCount !== 0) {
              R = H.anchorNode;
              var U = H.anchorOffset, Te = H.focusNode;
              H = H.focusOffset;
              try {
                R.nodeType, Te.nodeType;
              } catch {
                R = null;
                break e;
              }
              var De = 0, mt = -1, Et = -1, _i = 0, Wn = 0, O = T, _ = null;
              t:
                for (; ; ) {
                  for (var Q; O !== R || U !== 0 && O.nodeType !== 3 || (mt = De + U), O !== Te || H !== 0 && O.nodeType !== 3 || (Et = De + H), O.nodeType === 3 && (De += O.nodeValue.length), (Q = O.firstChild) !== null; )
                    _ = O, O = Q;
                  for (; ; ) {
                    if (O === T)
                      break t;
                    if (_ === R && ++_i === U && (mt = De), _ === Te && ++Wn === H && (Et = De), (Q = O.nextSibling) !== null)
                      break;
                    O = _, _ = O.parentNode;
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
      Wd = { activeElementDetached: null, focusedElem: T, selectionRange: R }, Na = !1, ze = v;
      do
        try {
          pm();
        } catch (lt) {
          if (ze === null)
            throw Error(c(330));
          es(ze, lt), ze = ze.nextEffect;
        }
      while (ze !== null);
      ze = v;
      do
        try {
          for (T = n, R = a; ze !== null; ) {
            var le = ze.effectTag;
            if (le & 16 && ei(ze.stateNode, ""), le & 128) {
              var ye = ze.alternate;
              if (ye !== null) {
                var ke = ye.ref;
                ke !== null && (typeof ke == "function" ? ke(null) : ke.current = null);
              }
            }
            switch (le & 1038) {
              case 2:
                tm(ze), ze.effectTag &= -3;
                break;
              case 6:
                tm(ze), ze.effectTag &= -3, da(ze.alternate, ze);
                break;
              case 1024:
                ze.effectTag &= -1025;
                break;
              case 1028:
                ze.effectTag &= -1025, da(ze.alternate, ze);
                break;
              case 4:
                da(ze.alternate, ze);
                break;
              case 8:
                U = ze, zc(T, U, R), Kp(U);
            }
            ze = ze.nextEffect;
          }
        } catch (lt) {
          if (ze === null)
            throw Error(c(330));
          es(ze, lt), ze = ze.nextEffect;
        }
      while (ze !== null);
      if (ke = Wd, ye = Vd(), le = ke.focusedElem, R = ke.selectionRange, ye !== le && le && le.ownerDocument && Ud(le.ownerDocument.documentElement, le)) {
        for (R !== null && Wu(le) && (ye = R.start, ke = R.end, ke === void 0 && (ke = ye), "selectionStart" in le ? (le.selectionStart = ye, le.selectionEnd = Math.min(ke, le.value.length)) : (ke = (ye = le.ownerDocument || document) && ye.defaultView || window, ke.getSelection && (ke = ke.getSelection(), U = le.textContent.length, T = Math.min(R.start, U), R = R.end === void 0 ? T : Math.min(R.end, U), !ke.extend && T > R && (U = R, R = T, T = U), U = jd(le, T), Te = jd(le, R), U && Te && (ke.rangeCount !== 1 || ke.anchorNode !== U.node || ke.anchorOffset !== U.offset || ke.focusNode !== Te.node || ke.focusOffset !== Te.offset) && (ye = ye.createRange(), ye.setStart(U.node, U.offset), ke.removeAllRanges(), T > R ? (ke.addRange(ye), ke.extend(Te.node, Te.offset)) : (ye.setEnd(Te.node, Te.offset), ke.addRange(ye)))))), ye = [], ke = le; ke = ke.parentNode; )
          ke.nodeType === 1 && ye.push({
            element: ke,
            left: ke.scrollLeft,
            top: ke.scrollTop
          });
        for (typeof le.focus == "function" && le.focus(), le = 0; le < ye.length; le++)
          ke = ye[le], ke.element.scrollLeft = ke.left, ke.element.scrollTop = ke.top;
      }
      Na = !!Qu, Wd = Qu = null, n.current = u, ze = v;
      do
        try {
          for (le = n; ze !== null; ) {
            var Je = ze.effectTag;
            if (Je & 36 && Dg(le, ze.alternate, ze), Je & 128) {
              ye = void 0;
              var bt = ze.ref;
              if (bt !== null) {
                var un = ze.stateNode;
                switch (ze.tag) {
                  case 5:
                    ye = un;
                    break;
                  default:
                    ye = un;
                }
                typeof bt == "function" ? bt(ye) : bt.current = ye;
              }
            }
            ze = ze.nextEffect;
          }
        } catch (lt) {
          if (ze === null)
            throw Error(c(330));
          es(ze, lt), ze = ze.nextEffect;
        }
      while (ze !== null);
      ze = null, kp(), at = x;
    } else
      n.current = u;
    if (Gl)
      Gl = !1, Xa = n, Fo = a;
    else
      for (ze = v; ze !== null; )
        a = ze.nextEffect, ze.nextEffect = null, ze = a;
    if (a = n.firstPendingTime, a === 0 && (Yi = null), a === 1073741823 ? n === Hf ? $o++ : ($o = 0, Hf = n) : $o = 0, typeof Vc == "function" && Vc(u.stateNode, f), Pi(n), eo)
      throw eo = !1, n = Wo, Wo = null, n;
    return (at & Uf) !== _n || Ri(), null;
  }
  function pm() {
    for (; ze !== null; ) {
      var n = ze.effectTag;
      (n & 256) !== 0 && Rg(ze.alternate, ze), (n & 512) === 0 || Gl || (Gl = !0, _p(97, function() {
        return Qo(), null;
      })), ze = ze.nextEffect;
    }
  }
  function Qo() {
    if (Fo !== 90) {
      var n = 97 < Fo ? 97 : Fo;
      return Fo = 90, xt(n, _g);
    }
  }
  function _g() {
    if (Xa === null)
      return !1;
    var n = Xa;
    if (Xa = null, (at & (Zi | jr)) !== _n)
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
              qp(5, u), Lf(5, u);
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
  function mm(n, a, u) {
    a = zf(u, a), a = Js(n, a, 1073741823), Wa(n, a), n = to(n, 1073741823), n !== null && Pi(n);
  }
  function es(n, a) {
    if (n.tag === 3)
      mm(n, n, a);
    else
      for (var u = n.return; u !== null; ) {
        if (u.tag === 3) {
          mm(u, n, a);
          break;
        } else if (u.tag === 1) {
          var f = u.stateNode;
          if (typeof u.type.getDerivedStateFromError == "function" || typeof f.componentDidCatch == "function" && (Yi === null || !Yi.has(f))) {
            n = zf(a, n), n = im(u, n, 1073741823), Wa(u, n), u = to(u, 1073741823), u !== null && Pi(u);
            break;
          }
        }
        u = u.return;
      }
  }
  function vm(n, a, u) {
    var f = n.pingCache;
    f !== null && f.delete(a), Ni === n && Vt === u ? pn === Lc || pn === Yl && ki === 1073741823 && Pt() - Ga < Bc ? no(n, Vt) : Ks = !0 : wm(n, u) && (a = n.lastPingedTime, a !== 0 && a < u || (n.lastPingedTime = u, Pi(n)));
  }
  function zg(n, a) {
    var u = n.stateNode;
    u !== null && u.delete(a), a = 0, a === 0 && (a = On(), a = Ja(a, n, null)), n = to(n, a), n !== null && Pi(n);
  }
  var gm;
  gm = function(n, a, u) {
    var f = a.expirationTime;
    if (n !== null) {
      var v = a.pendingProps;
      if (n.memoizedProps !== v || Mn.current)
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
              $n(a.type) && No(a);
              break;
            case 4:
              vc(a, a.stateNode.containerInfo);
              break;
            case 10:
              f = a.memoizedProps.value, v = a.type._context, sn(Ua, v._currentValue), v._currentValue = f;
              break;
            case 13:
              if (a.memoizedState !== null)
                return f = a.child.childExpirationTime, f !== 0 && f >= u ? Qp(n, a, u) : (sn(Kt, Kt.current & 1), a = ca(n, a, u), a !== null ? a.sibling : null);
              sn(Kt, Kt.current & 1);
              break;
            case 19:
              if (f = a.childExpirationTime >= u, (n.effectTag & 64) !== 0) {
                if (f)
                  return Yp(n, a, u);
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
          if (a.tag = 1, a.memoizedState = null, a.updateQueue = null, $n(f)) {
            var x = !0;
            No(a);
          } else
            x = !1;
          a.memoizedState = v.state !== null && v.state !== void 0 ? v.state : null, hc(a);
          var T = f.getDerivedStateFromProps;
          typeof T == "function" && Oo(a, f, T, n), v.updater = Fa, a.stateNode = v, v._reactInternalFiber = a, Ll(a, f, n, u), a = Pf(null, a, f, !0, x, u);
        } else
          a.tag = 0, Di(null, a, v, u), a = a.child;
        return a;
      case 16:
        e: {
          if (v = a.elementType, n !== null && (n.alternate = null, a.alternate = null, a.effectTag |= 2), n = a.pendingProps, tr(v), v._status !== 1)
            throw v._result;
          switch (v = v._result, a.type = v, x = a.tag = Kl(v), n = pi(v, n), x) {
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
              a = Fl(null, a, v, pi(v.type, n), f, u);
              break e;
          }
          throw Error(c(306, v, ""));
        }
        return a;
      case 0:
        return f = a.type, v = a.pendingProps, v = a.elementType === f ? v : pi(f, v), Gs(n, a, f, v, u);
      case 1:
        return f = a.type, v = a.pendingProps, v = a.elementType === f ? v : pi(f, v), $p(n, a, f, v, u);
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
        return Mf(a), n === null && Wl(a), f = a.type, v = a.pendingProps, x = n !== null ? n.memoizedProps : null, T = v.children, yl(f, v) ? T = null : x !== null && yl(f, x) && (a.effectTag |= 16), Fp(n, a), a.mode & 4 && u !== 1 && v.hidden ? (a.expirationTime = a.childExpirationTime = 1, a = null) : (Di(n, a, T, u), a = a.child), a;
      case 6:
        return n === null && Wl(a), null;
      case 13:
        return Qp(n, a, u);
      case 4:
        return vc(a, a.stateNode.containerInfo), f = a.pendingProps, n === null ? a.child = Lo(a, null, f, u) : Di(n, a, f, u), a.child;
      case 11:
        return f = a.type, v = a.pendingProps, v = a.elementType === f ? v : pi(f, v), Wp(n, a, f, v, u);
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
          f = a.type._context, v = a.pendingProps, T = a.memoizedProps, x = v.value;
          var R = a.type._context;
          if (sn(Ua, R._currentValue), R._currentValue = x, T !== null)
            if (R = T.value, x = Ii(R, x) ? 0 : (typeof f._calculateChangedBits == "function" ? f._calculateChangedBits(R, x) : 1073741823) | 0, x === 0) {
              if (T.children === v.children && !Mn.current) {
                a = ca(n, a, u);
                break e;
              }
            } else
              for (R = a.child, R !== null && (R.return = a); R !== null; ) {
                var H = R.dependencies;
                if (H !== null) {
                  T = R.child;
                  for (var U = H.firstContext; U !== null; ) {
                    if (U.context === f && (U.observedBits & x) !== 0) {
                      R.tag === 1 && (U = Ha(u, null), U.tag = 2, Wa(R, U)), R.expirationTime < u && (R.expirationTime = u), U = R.alternate, U !== null && U.expirationTime < u && (U.expirationTime = u), _o(R.return, u), H.expirationTime < u && (H.expirationTime = u);
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
        return v = a.type, x = a.pendingProps, f = x.children, mi(a, u), v = Qi(v, x.unstable_observedBits), f = f(v), a.effectTag |= 1, Di(n, a, f, u), a.child;
      case 14:
        return v = a.type, x = pi(v, a.pendingProps), x = pi(v.type, x), Fl(n, a, v, x, f, u);
      case 15:
        return Dc(n, a, a.type, a.pendingProps, f, u);
      case 17:
        return f = a.type, v = a.pendingProps, v = a.elementType === f ? v : pi(f, v), n !== null && (n.alternate = null, a.alternate = null, a.effectTag |= 2), a.tag = 1, $n(f) ? (n = !0, No(a)) : n = !1, mi(a, u), Op(a, f, v), Ll(a, f, v, u), Pf(
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
  function Vr(n, a, u, f) {
    return new Lg(n, a, u, f);
  }
  function Qf(n) {
    return n = n.prototype, !(!n || !n.isReactComponent);
  }
  function Kl(n) {
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
  function Hc(n, a, u, f, v, x) {
    var T = 2;
    if (f = n, typeof n == "function")
      Qf(n) && (T = 1);
    else if (typeof n == "string")
      T = 5;
    else
      e:
        switch (n) {
          case Jn:
            return fa(u.children, v, x, a);
          case bn:
            T = 8, v |= 7;
            break;
          case Ne:
            T = 8, v |= 1;
            break;
          case st:
            return n = Vr(12, u, a, v | 8), n.elementType = st, n.type = st, n.expirationTime = x, n;
          case Mr:
            return n = Vr(13, u, a, v), n.type = Mr, n.elementType = Mr, n.expirationTime = x, n;
          case Bn:
            return n = Vr(19, u, a, v), n.elementType = Bn, n.expirationTime = x, n;
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
    return a = Vr(T, u, a, v), a.elementType = n, a.type = f, a.expirationTime = x, a;
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
  function ts(n, a) {
    var u = n.lastExpiredTime;
    (u === 0 || u > a) && (n.lastExpiredTime = a);
  }
  function eu(n, a, u, f) {
    var v = a.current, x = On(), T = Ol.suspense;
    x = Ja(x, v, T);
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
        u = Or;
    return a.context === null ? a.context = u : a.pendingContext = u, a = Ha(x, T), a.payload = { element: n }, f = f === void 0 ? null : f, f !== null && (a.callback = f), Wa(v, a), qa(v, x), x;
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
    var f = new ym(n, a, u), v = Vr(3, null, null, a === 2 ? 7 : a === 1 ? 3 : 0);
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
    var x = u._reactRootContainer;
    if (x) {
      var T = x._internalRoot;
      if (typeof v == "function") {
        var R = v;
        v = function() {
          var U = Wc(T);
          R.call(U);
        };
      }
      eu(a, T, n, v);
    } else {
      if (x = u._reactRootContainer = Jf(u, f), T = x._internalRoot, typeof v == "function") {
        var H = v;
        v = function() {
          var U = Wc(T);
          H.call(U);
        };
      }
      lm(function() {
        eu(a, T, n, v);
      });
    }
    return Wc(T);
  }
  function Bg(n, a, u) {
    var f = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return { $$typeof: Ci, key: f == null ? null : "" + f, children: n, containerInfo: a, implementation: u };
  }
  P = function(n) {
    if (n.tag === 13) {
      var a = Ut(On(), 150, 100);
      qa(n, a), tu(n, a);
    }
  }, V = function(n) {
    n.tag === 13 && (qa(n, 3), tu(n, 3));
  }, G = function(n) {
    if (n.tag === 13) {
      var a = On();
      a = Ja(a, n, null), qa(n, a), tu(n, a);
    }
  }, he = function(n, a, u) {
    switch (a) {
      case "input":
        if (kt(n, u), a = u.name, u.type === "radio" && a != null) {
          for (u = n; u.parentNode; )
            u = u.parentNode;
          for (u = u.querySelectorAll("input[name=" + JSON.stringify("" + a) + '][type="radio"]'), a = 0; a < u.length; a++) {
            var f = u[a];
            if (f !== n && f.form === n.form) {
              var v = bl(f);
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
  }, Qe = om, be = function(n, a, u, f, v) {
    var x = at;
    at |= 4;
    try {
      return xt(98, n.bind(null, a, u, f, v));
    } finally {
      at = x, at === _n && Ri();
    }
  }, Ve = function() {
    (at & (1 | Zi | jr)) === _n && (kg(), Qo());
  }, Re = function(n, a) {
    var u = at;
    at |= 2;
    try {
      return n(a);
    } finally {
      at = u, at === _n && Ri();
    }
  };
  function bm(n, a) {
    var u = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!ro(a))
      throw Error(c(200));
    return Bg(n, a, null, u);
  }
  var NS = { Events: [wl, Hi, bl, je, oe, Ns, function(n) {
    hn(n, Qd);
  }, _e, ue, ri, ea, Qo, { current: !1 }] };
  return function(n) {
    var a = n.findFiberByHostInstance;
    return Og(i({}, n, { overrideHookState: null, overrideProps: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: Zt.ReactCurrentDispatcher, findHostInstanceByFiber: function(u) {
      return u = bo(u), u === null ? null : u.stateNode;
    }, findFiberByHostInstance: function(u) {
      return a ? a(u) : null;
    }, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null }));
  }({
    findFiberByHostInstance: Ao,
    bundleType: 0,
    version: "16.14.0",
    rendererPackageName: "react-dom"
  }), Sr.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = NS, Sr.createPortal = bm, Sr.findDOMNode = function(n) {
    if (n == null)
      return null;
    if (n.nodeType === 1)
      return n;
    var a = n._reactInternalFiber;
    if (a === void 0)
      throw typeof n.render == "function" ? Error(c(188)) : Error(c(268, Object.keys(n)));
    return n = bo(a), n = n === null ? null : n.stateNode, n;
  }, Sr.flushSync = function(n, a) {
    if ((at & (Zi | jr)) !== _n)
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
    return nu(null, n, a, !0, u);
  }, Sr.render = function(n, a, u) {
    if (!ro(a))
      throw Error(c(200));
    return nu(null, n, a, !1, u);
  }, Sr.unmountComponentAtNode = function(n) {
    if (!ro(n))
      throw Error(c(40));
    return n._reactRootContainer ? (lm(function() {
      nu(null, null, n, !1, function() {
        n._reactRootContainer = null, n[Io] = null;
      });
    }), !0) : !1;
  }, Sr.unstable_batchedUpdates = om, Sr.unstable_createPortal = function(n, a) {
    return bm(n, a, 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null);
  }, Sr.unstable_renderSubtreeIntoContainer = function(n, a, u, f) {
    if (!ro(u))
      throw Error(c(200));
    if (n == null || n._reactInternalFiber === void 0)
      throw Error(c(38));
    return nu(n, a, u, !1, f);
  }, Sr.version = "16.14.0", Sr;
}
var xr = {}, Rb = { exports: {} }, Sa = {};
/** @license React v0.19.1
 * scheduler-tracing.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var KT;
function cO() {
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
var Db = {};
/** @license React v0.19.1
 * scheduler-tracing.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var eM;
function dO() {
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
      function y() {
        return ++c;
      }
      function g(se, Z, ce) {
        var oe = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : i, Oe = {
          __count: 1,
          id: o++,
          name: se,
          timestamp: Z
        }, $e = r.__interactionsRef.current, je = new Set($e);
        je.add(Oe), r.__interactionsRef.current = je;
        var Y = r.__subscriberRef.current, he;
        try {
          Y !== null && Y.onInteractionTraced(Oe);
        } finally {
          try {
            Y !== null && Y.onWorkStarted(je, oe);
          } finally {
            try {
              he = ce();
            } finally {
              r.__interactionsRef.current = $e;
              try {
                Y !== null && Y.onWorkStopped(je, oe);
              } finally {
                Oe.__count--, Y !== null && Oe.__count === 0 && Y.onInteractionScheduledWorkCompleted(Oe);
              }
            }
          }
        }
        return he;
      }
      function S(se) {
        var Z = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : i, ce = r.__interactionsRef.current, oe = r.__subscriberRef.current;
        oe !== null && oe.onWorkScheduled(ce, Z), ce.forEach(function(je) {
          je.__count++;
        });
        var Oe = !1;
        function $e() {
          var je = r.__interactionsRef.current;
          r.__interactionsRef.current = ce, oe = r.__subscriberRef.current;
          try {
            var Y;
            try {
              oe !== null && oe.onWorkStarted(ce, Z);
            } finally {
              try {
                Y = se.apply(void 0, arguments);
              } finally {
                r.__interactionsRef.current = je, oe !== null && oe.onWorkStopped(ce, Z);
              }
            }
            return Y;
          } finally {
            Oe || (Oe = !0, ce.forEach(function(he) {
              he.__count--, oe !== null && he.__count === 0 && oe.onInteractionScheduledWorkCompleted(he);
            }));
          }
        }
        return $e.cancel = function() {
          oe = r.__subscriberRef.current;
          try {
            oe !== null && oe.onWorkCanceled(ce, Z);
          } finally {
            ce.forEach(function(Y) {
              Y.__count--, oe && Y.__count === 0 && oe.onInteractionScheduledWorkCompleted(Y);
            });
          }
        }, $e;
      }
      var C = null;
      C = /* @__PURE__ */ new Set();
      function A(se) {
        C.add(se), C.size === 1 && (r.__subscriberRef.current = {
          onInteractionScheduledWorkCompleted: F,
          onInteractionTraced: z,
          onWorkCanceled: fe,
          onWorkScheduled: $,
          onWorkStarted: K,
          onWorkStopped: q
        });
      }
      function I(se) {
        C.delete(se), C.size === 0 && (r.__subscriberRef.current = null);
      }
      function z(se) {
        var Z = !1, ce = null;
        if (C.forEach(function(oe) {
          try {
            oe.onInteractionTraced(se);
          } catch (Oe) {
            Z || (Z = !0, ce = Oe);
          }
        }), Z)
          throw ce;
      }
      function F(se) {
        var Z = !1, ce = null;
        if (C.forEach(function(oe) {
          try {
            oe.onInteractionScheduledWorkCompleted(se);
          } catch (Oe) {
            Z || (Z = !0, ce = Oe);
          }
        }), Z)
          throw ce;
      }
      function $(se, Z) {
        var ce = !1, oe = null;
        if (C.forEach(function(Oe) {
          try {
            Oe.onWorkScheduled(se, Z);
          } catch ($e) {
            ce || (ce = !0, oe = $e);
          }
        }), ce)
          throw oe;
      }
      function K(se, Z) {
        var ce = !1, oe = null;
        if (C.forEach(function(Oe) {
          try {
            Oe.onWorkStarted(se, Z);
          } catch ($e) {
            ce || (ce = !0, oe = $e);
          }
        }), ce)
          throw oe;
      }
      function q(se, Z) {
        var ce = !1, oe = null;
        if (C.forEach(function(Oe) {
          try {
            Oe.onWorkStopped(se, Z);
          } catch ($e) {
            ce || (ce = !0, oe = $e);
          }
        }), ce)
          throw oe;
      }
      function fe(se, Z) {
        var ce = !1, oe = null;
        if (C.forEach(function(Oe) {
          try {
            Oe.onWorkCanceled(se, Z);
          } catch ($e) {
            ce || (ce = !0, oe = $e);
          }
        }), ce)
          throw oe;
      }
      r.unstable_clear = h, r.unstable_getCurrent = m, r.unstable_getThreadID = y, r.unstable_subscribe = A, r.unstable_trace = g, r.unstable_unsubscribe = I, r.unstable_wrap = S;
    }();
  }(Db)), Db;
}
var tM;
function fO() {
  return tM || (tM = 1, function(r) {
    process.env.NODE_ENV === "production" ? r.exports = cO() : r.exports = dO();
  }(Rb)), Rb.exports;
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
function hO() {
  return nM || (nM = 1, process.env.NODE_ENV !== "production" && function() {
    var r = dl.exports, i = yg(), o = OE(), c = _E(), h = fO(), m = r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    m.hasOwnProperty("ReactCurrentDispatcher") || (m.ReactCurrentDispatcher = {
      current: null
    }), m.hasOwnProperty("ReactCurrentBatchConfig") || (m.ReactCurrentBatchConfig = {
      suspense: null
    });
    function y(e) {
      {
        for (var t = arguments.length, s = new Array(t > 1 ? t - 1 : 0), l = 1; l < t; l++)
          s[l - 1] = arguments[l];
        S("warn", e, s);
      }
    }
    function g(e) {
      {
        for (var t = arguments.length, s = new Array(t > 1 ? t - 1 : 0), l = 1; l < t; l++)
          s[l - 1] = arguments[l];
        S("error", e, s);
      }
    }
    function S(e, t, s) {
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
      var A = document.createElement("react"), I = function(e, t, s, l, d, p, w, b, E) {
        if (!(typeof document < "u"))
          throw Error("The `document` global was defined when React was initialized, but is not defined anymore. This can happen in a test environment if a component schedules an update from an asynchronous callback, but the test has already finished running. To solve this, you can either unmount the component at the end of your test (and ensure that any asynchronous operations get canceled in `componentWillUnmount`), or you can change the test itself to be asynchronous.");
        var N = document.createEvent("Event"), k = !0, X = window.event, L = Object.getOwnPropertyDescriptor(window, "event"), J = Array.prototype.slice.call(arguments, 3);
        function me() {
          A.removeEventListener(vt, me, !1), typeof window.event < "u" && window.hasOwnProperty("event") && (window.event = X), t.apply(s, J), k = !1;
        }
        var we, qe = !1, nt = !1;
        function _t($t) {
          if (we = $t.error, qe = !0, we === null && $t.colno === 0 && $t.lineno === 0 && (nt = !0), $t.defaultPrevented && we != null && typeof we == "object")
            try {
              we._suppressLogging = !0;
            } catch {
            }
        }
        var vt = "react-" + (e || "invokeguardedcallback");
        window.addEventListener("error", _t), A.addEventListener(vt, me, !1), N.initEvent(vt, !1, !1), A.dispatchEvent(N), L && Object.defineProperty(window, "event", L), k && (qe ? nt && (we = new Error("A cross-origin error was thrown. React doesn't have access to the actual error object in development. See https://fb.me/react-crossorigin-error for more information.")) : we = new Error(`An error was thrown inside one of your components, but React doesn't know what it was. This is likely due to browser flakiness. React does its best to preserve the "Pause on exceptions" behavior of the DevTools, which requires some DEV-mode only tricks. It's possible that these don't work in your browser. Try triggering the error in production mode, or switching to a modern browser. If you suspect that this is actually an issue with React, please file an issue.`), this.onError(we)), window.removeEventListener("error", _t);
      };
      C = I;
    }
    var z = C, F = !1, $ = null, K = !1, q = null, fe = {
      onError: function(e) {
        F = !0, $ = e;
      }
    };
    function se(e, t, s, l, d, p, w, b, E) {
      F = !1, $ = null, z.apply(fe, arguments);
    }
    function Z(e, t, s, l, d, p, w, b, E) {
      if (se.apply(this, arguments), F) {
        var N = Oe();
        K || (K = !0, q = N);
      }
    }
    function ce() {
      if (K) {
        var e = q;
        throw K = !1, q = null, e;
      }
    }
    function oe() {
      return F;
    }
    function Oe() {
      if (F) {
        var e = $;
        return F = !1, $ = null, e;
      } else
        throw Error("clearCaughtError was called but no error was captured. This error is likely caused by a bug in React. Please file an issue.");
    }
    var $e = null, je = null, Y = null;
    function he(e, t, s) {
      $e = e, je = t, Y = s, (!Y || !je) && g("EventPluginUtils.setComponentTree(...): Injected module is missing getNodeFromInstance or getInstanceFromNode.");
    }
    var Ee;
    Ee = function(e) {
      var t = e._dispatchListeners, s = e._dispatchInstances, l = Array.isArray(t), d = l ? t.length : t ? 1 : 0, p = Array.isArray(s), w = p ? s.length : s ? 1 : 0;
      (p !== l || w !== d) && g("EventPluginUtils: Invalid `event`.");
    };
    function ie(e, t, s) {
      var l = e.type || "unknown-event";
      e.currentTarget = Y(s), Z(l, t, void 0, e), e.currentTarget = null;
    }
    function ct(e) {
      var t = e._dispatchListeners, s = e._dispatchInstances;
      if (Ee(e), Array.isArray(t))
        for (var l = 0; l < t.length && !e.isPropagationStopped(); l++)
          ie(e, t[l], s[l]);
      else
        t && ie(e, t, s);
      e._dispatchListeners = null, e._dispatchInstances = null;
    }
    var _e = 0, ue = 1, Qe = 2, be = 3, Ve = 4, Re = 5, Fe = 6, Tt = 7, Bt = 8, Ye = 9, re = 10, D = 11, B = 12, ee = 13, xe = 14, ge = 15, it = 16, Ge = 17, Le = 18, dt = 19, gt = 20, Zt = 21, Mt = 22, wn = null, Wt = {};
    function Ui() {
      if (!!wn)
        for (var e in Wt) {
          var t = Wt[e], s = wn.indexOf(e);
          if (!(s > -1))
            throw Error("EventPluginRegistry: Cannot inject event plugins that do not exist in the plugin ordering, `" + e + "`.");
          if (!Ne[s]) {
            if (!t.extractEvents)
              throw Error("EventPluginRegistry: Event plugins must implement an `extractEvents` method, but `" + e + "` does not.");
            Ne[s] = t;
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
        bn[l] = e, e === "onDoubleClick" && (bn.ondblclick = e);
      }
    }
    var Ne = [], st = {}, He = {}, jt = {}, bn = {};
    function ci(e) {
      if (wn)
        throw Error("EventPluginRegistry: Cannot inject event plugin ordering more than once. You are likely trying to load more than one copy of React.");
      wn = Array.prototype.slice.call(e), Ui();
    }
    function Mr(e) {
      var t = !1;
      for (var s in e)
        if (!!e.hasOwnProperty(s)) {
          var l = e[s];
          if (!Wt.hasOwnProperty(s) || Wt[s] !== l) {
            if (Wt[s])
              throw Error("EventPluginRegistry: Cannot inject two different event plugins using the same name, `" + s + "`.");
            Wt[s] = l, t = !0;
          }
        }
      t && Ui();
    }
    var Bn = typeof window < "u" && typeof window.document < "u" && typeof window.document.createElement < "u", Gr = 1, Vi = 1 << 5, Ta = 1 << 6, Ma = null, di = null, tr = null;
    function fi(e) {
      var t = je(e);
      if (!!t) {
        if (typeof Ma != "function")
          throw Error("setRestoreImplementation() needs to be called to handle a target for controlled events. This error is likely caused by a bug in React. Please file an issue.");
        var s = t.stateNode;
        if (s) {
          var l = $e(s);
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
    var Er = !0, Ir = !1, mn = !1, qn = !1, Ia = function(e, t) {
      return e(t);
    }, kt = function(e, t, s, l, d) {
      return e(t, s, l, d);
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
    function yo(e, t, s, l, d) {
      var p = Nn;
      Nn = !0;
      try {
        return kt(e, t, s, l, d);
      } finally {
        Nn = p, Nn || Kn();
      }
    }
    function wo(e) {
      !Nn && !Ir && rn();
    }
    function Ts(e, t, s, l) {
      Ia = e, kt = t, rn = s, Mi = l;
    }
    var Ra = 0, kn = 1, Ar = 2, qr = 0, ei = 1, Rr = 2, jn = 3, nr = 4, Ms = 5, Kr = 6, Es = ":A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD", ne = Es + "\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040", de = "data-reactroot", Xe = new RegExp("^[" + Es + "][" + ne + "]*$"), pt = Object.prototype.hasOwnProperty, Jt = {}, Yt = {};
    function fn(e) {
      return pt.call(Yt, e) ? !0 : pt.call(Jt, e) ? !1 : Xe.test(e) ? (Yt[e] = !0, !0) : (Jt[e] = !0, g("Invalid attribute name: `%s`", e), !1);
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
          case jn:
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
      this.acceptsBooleans = t === Rr || t === jn || t === nr, this.attributeName = l, this.attributeNamespace = d, this.mustUseProperty = s, this.propertyName = e, this.type = t, this.sanitizeURL = p;
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
      hn[e] = new an(
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
      var t = e.replace(fl, ea);
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
      var t = e.replace(fl, ea);
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
    var hl = "xlinkHref";
    hn[hl] = new an(
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
    function pl(e) {
      !As && Lu.test(e) && (As = !0, g("A future version of React will block javascript: URLs as a security precaution. Use event handlers instead if you can. If you need to generate unsafe HTML try using dangerouslySetInnerHTML instead. React was passed %s.", JSON.stringify(e)));
    }
    function Bu(e, t, s, l) {
      if (l.mustUseProperty) {
        var d = l.propertyName;
        return e[d];
      } else {
        l.sanitizeURL && pl("" + s);
        var p = l.attributeName, w = null;
        if (l.type === nr) {
          if (e.hasAttribute(p)) {
            var b = e.getAttribute(p);
            return b === "" ? !0 : Da(t, s, l, !1) ? b : b === "" + s ? s : b;
          }
        } else if (e.hasAttribute(p)) {
          if (Da(t, s, l, !1))
            return e.getAttribute(p);
          if (l.type === jn)
            return s;
          w = e.getAttribute(p);
        }
        return Da(t, s, l, !1) ? w === null ? s : w : w === "" + s ? s : w;
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
          X === jn || X === nr && s === !0 ? L = "" : (L = "" + s, d.sanitizeURL && pl(L.toString())), k ? e.setAttributeNS(k, N, L) : e.setAttribute(N, L);
        }
      }
    }
    var P = /^(.*)[\\\/]/;
    function V(e, t, s) {
      var l = "";
      if (t) {
        var d = t.fileName, p = d.replace(P, "");
        if (/^index\./.test(p)) {
          var w = d.match(P);
          if (w) {
            var b = w[1];
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
    var G = typeof Symbol == "function" && Symbol.for, Se = G ? Symbol.for("react.element") : 60103, Ze = G ? Symbol.for("react.portal") : 60106, Be = G ? Symbol.for("react.fragment") : 60107, et = G ? Symbol.for("react.strict_mode") : 60108, Nt = G ? Symbol.for("react.profiler") : 60114, vn = G ? Symbol.for("react.provider") : 60109, Sn = G ? Symbol.for("react.context") : 60110, Tn = G ? Symbol.for("react.concurrent_mode") : 60111, ni = G ? Symbol.for("react.forward_ref") : 60112, ii = G ? Symbol.for("react.suspense") : 60113, So = G ? Symbol.for("react.suspense_list") : 60120, ta = G ? Symbol.for("react.memo") : 60115, ir = G ? Symbol.for("react.lazy") : 60116, xo = G ? Symbol.for("react.block") : 60121, pp = typeof Symbol == "function" && Symbol.iterator, wg = "@@iterator";
    function Dr(e) {
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
    function Ce(e) {
      if (e == null)
        return null;
      if (typeof e.tag == "number" && g("Received an unexpected object in getComponentName(). This is likely a bug in React. Please file an issue."), typeof e == "function")
        return e.displayName || e.name || null;
      if (typeof e == "string")
        return e;
      switch (e) {
        case Be:
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
          case Sn:
            return "Context.Consumer";
          case vn:
            return "Context.Provider";
          case ni:
            return Od(e, e.render, "ForwardRef");
          case ta:
            return Ce(e.type);
          case xo:
            return Ce(e.render);
          case ir: {
            var t = e, s = zd(t);
            if (s)
              return Ce(s);
            break;
          }
        }
      return null;
    }
    var ju = m.ReactDebugCurrentFrame;
    function yp(e) {
      switch (e.tag) {
        case be:
        case Ve:
        case Fe:
        case Tt:
        case re:
        case Ye:
          return "";
        default:
          var t = e._debugOwner, s = e._debugSource, l = Ce(e.type), d = null;
          return t && (d = Ce(t.type)), V(l, s, d);
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
    function Na() {
      {
        if (na === null)
          return null;
        var e = na._debugOwner;
        if (e !== null && typeof e < "u")
          return Ce(e.type);
      }
      return null;
    }
    function ft() {
      return na === null ? "" : Fn(na);
    }
    function rr() {
      ju.getCurrentStack = null, na = null, vl = !1;
    }
    function Co(e) {
      ju.getCurrentStack = ft, na = e, vl = !1;
    }
    function Nr(e) {
      vl = e;
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
          return wp[e.type] || e.onChange || e.readOnly || e.disabled || e[t] == null || Ir ? null : new Error("You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`.");
        },
        checked: function(e, t, s) {
          return e.onChange || e.readOnly || e.disabled || e[t] == null || Ir ? null : new Error("You provided a `checked` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultChecked`. Otherwise, set either `onChange` or `readOnly`.");
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
    function gl(e, t) {
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
      t.hasOwnProperty("value") ? yl(s, t.type, d) : t.hasOwnProperty("defaultValue") && yl(s, t.type, kr(t.defaultValue)), t.checked == null && t.defaultChecked != null && (s.defaultChecked = !!t.defaultChecked);
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
      gl(s, t), Cp(s, t);
    }
    function Cp(e, t) {
      var s = t.name;
      if (t.type === "radio" && s != null) {
        for (var l = e; l.parentNode; )
          l = l.parentNode;
        for (var d = l.querySelectorAll("input[name=" + JSON.stringify("" + s) + '][type="radio"]'), p = 0; p < d.length; p++) {
          var w = d[p];
          if (!(w === e || w.form !== e.form)) {
            var b = Hg(w);
            if (!b)
              throw Error("ReactDOMInput: Mixing React and non-React radio inputs with the same `name` is not supported.");
            Hu(w), gl(w, b);
          }
        }
      }
    }
    function yl(e, t, s) {
      (t !== "number" || e.ownerDocument.activeElement !== e) && (s == null ? e.defaultValue = ri(e._wrapperState.initialValue) : e.defaultValue !== ri(s) && (e.defaultValue = ri(s)));
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
      t.value != null && e.setAttribute("value", ri(kr(t.value)));
    }
    function Pr(e, t) {
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
        for (var k = ri(kr(s)), X = null, L = 0; L < d.length; L++) {
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
    function _r(e, t) {
      var s = e;
      wl(t), s._wrapperState = {
        wasMultiple: !!t.multiple
      }, t.value !== void 0 && t.defaultValue !== void 0 && !Eo && (g("Select elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled select element and remove one of these props. More info: https://fb.me/react-controlled-components"), Eo = !0);
    }
    function Mp(e, t) {
      var s = e;
      s.multiple = !!t.multiple;
      var l = t.value;
      l != null ? Hi(s, !!t.multiple, l, !1) : t.defaultValue != null && Hi(s, !!t.multiple, t.defaultValue, !0);
    }
    function Ep(e, t) {
      var s = e, l = s._wrapperState.wasMultiple;
      s._wrapperState.wasMultiple = !!t.multiple;
      var d = t.value;
      d != null ? Hi(s, !!t.multiple, d, !1) : l !== !!t.multiple && (t.defaultValue != null ? Hi(s, !!t.multiple, t.defaultValue, !0) : Hi(s, !!t.multiple, t.multiple ? [] : "", !1));
    }
    function bg(e, t) {
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
    var Sl = "http://www.w3.org/1999/xhtml", xl = "http://www.w3.org/1998/Math/MathML", Ro = "http://www.w3.org/2000/svg", hi = {
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
      if (e.namespaceURI === hi.svg && !("innerHTML" in e)) {
        Ju = Ju || document.createElement("div"), Ju.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>";
        for (var s = Ju.firstChild; e.firstChild; )
          e.removeChild(e.firstChild);
        for (; s.firstChild; )
          e.appendChild(s.firstChild);
        return;
      }
      e.innerHTML = t;
    }), ar = 1, sr = 3, ai = 8, ka = 9, qu = 11, Cl = function(e, t) {
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
    }, _a = {}, Rp = {};
    Bn && (Rp = document.createElement("div").style, "AnimationEvent" in window || (delete ks.animationend.animation, delete ks.animationiteration.animation, delete ks.animationstart.animation), "TransitionEvent" in window || delete ks.transitionend.transition);
    function Ku(e) {
      if (_a[e])
        return _a[e];
      if (!ks[e])
        return e;
      var t = ks[e];
      for (var s in t)
        if (t.hasOwnProperty(s) && s in Rp)
          return _a[e] = t[s];
      return e;
    }
    var Gd = "abort", Dp = Ku("animationend"), Xd = Ku("animationiteration"), Jd = Ku("animationstart"), Un = "blur", Ps = "canplay", _s = "canplaythrough", ec = "cancel", za = "change", Ml = "click", Do = "close", aa = "compositionend", El = "compositionstart", qd = "compositionupdate", Il = "contextmenu", Kd = "copy", ef = "cut", tf = "dblclick", zs = "auxclick", Np = "drag", Al = "dragend", Os = "dragenter", nf = "dragexit", Rl = "dragleave", rf = "dragover", tc = "dragstart", Ls = "drop", nc = "durationchange", Bs = "emptied", af = "encrypted", sf = "ended", Ii = "error", Wi = "focus", sa = "gotpointercapture", Dl = "input", zr = "invalid", Vn = "keydown", Fi = "keypress", si = "keyup", Oa = "load", ic = "loadstart", of = "loadeddata", lf = "loadedmetadata", rc = "lostpointercapture", oa = "mousedown", Nl = "mousemove", La = "mouseout", la = "mouseover", kl = "mouseup", Pl = "paste", uf = "pause", cf = "play", df = "playing", ff = "pointercancel", hf = "pointerdown", ac = "pointermove", Ai = "pointerout", St = "pointerover", sn = "pointerup", Or = "progress", Pn = "ratechange", Mn = "reset", Lr = "scroll", Ba = "seeked", $n = "seeking", ja = "selectionchange", sc = "stalled", js = "submit", No = "suspend", _l = "textInput", pf = "timeupdate", ko = "toggle", oc = "touchcancel", lc = "touchend", uc = "touchmove", mf = "touchstart", zl = Ku("transitionend"), cc = "volumechange", dc = "waiting", vf = "wheel", Po = [Gd, Ps, _s, nc, Bs, af, sf, Ii, of, lf, ic, uf, cf, df, Or, Pn, Ba, $n, sc, No, pf, cc, dc];
    function gf(e) {
      return e;
    }
    var xg = typeof WeakMap == "function" ? WeakMap : Map, kp = new xg();
    function or(e) {
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
    var Pt = 0, lr = 1, xn = 2, xt = 4, _p = 6, Us = 8, Ri = 16, wf = 32, Ut = 64, pi = 128, Ua = 256, Va = 512, $i = 1024, fc = 1028, bf = 932, Sf = 2047, _o = 2048, mi = 4096, Qi = m.ReactCurrentOwner;
    function vi(e) {
      var t = e, s = e;
      if (e.alternate)
        for (; t.return; )
          t = t.return;
      else {
        var l = t;
        do
          t = l, (t.effectTag & (xn | $i)) !== Pt && (s = t.return), l = t.return;
        while (l);
      }
      return t.tag === be ? s : null;
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
      return e.tag === be ? e.stateNode.containerInfo : null;
    }
    function Ha(e) {
      return vi(e) === e;
    }
    function Wa(e) {
      {
        var t = Qi.current;
        if (t !== null && t.tag === ue) {
          var s = t, l = s.stateNode;
          l._warnedAboutRefsInRender || g("%s is accessing isMounted inside its render() function. render() should be a pure function of props and state. It should never access something that requires stale data from the previous render, such as refs. Move this logic to componentDidMount and componentDidUpdate instead.", Ce(s.type) || "A component"), l._warnedAboutRefsInRender = !0;
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
      if (l.tag !== be)
        throw Error("Unable to find node on an unmounted component.");
      return l.stateNode.current === l ? e : t;
    }
    function Cf(e) {
      var t = zo(e);
      if (!t)
        return null;
      for (var s = t; ; ) {
        if (s.tag === Re || s.tag === Fe)
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
        if (s.tag === Re || s.tag === Fe || mn)
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
    var Fa = null, zp = function(e) {
      e && (ct(e), e.isPersistent() || e.constructor.release(e));
    }, Op = function(e) {
      return zp(e);
    };
    function mc(e) {
      e !== null && (Fa = Vs(Fa, e));
      var t = Fa;
      if (Fa = null, !!t) {
        if (Oo(t, Op), Fa)
          throw Error("processEventQueue(): Additional events were enqueued while processing an event queue. Support for this has not yet been implemented.");
        ce();
      }
    }
    function Ll(e) {
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
      if (e.tag === be)
        return e.stateNode.containerInfo;
      for (; e.return; )
        e = e.return;
      return e.tag !== be ? null : e.stateNode.containerInfo;
    }
    function Ul(e, t, s, l, d) {
      for (var p = null, w = 0; w < Ne.length; w++) {
        var b = Ne[w];
        if (b) {
          var E = b.extractEvents(e, t, s, l, d);
          E && (p = Vs(p, E));
        }
      }
      return p;
    }
    function Br(e, t, s, l, d) {
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
        (p === Re || p === Fe) && e.ancestors.push(s), s = eh(d);
      } while (s);
      for (var w = 0; w < e.ancestors.length; w++) {
        t = e.ancestors[w];
        var b = Ll(e.nativeEvent), E = e.topLevelType, N = e.nativeEvent, k = e.eventSystemFlags;
        w === 0 && (k |= Ta), Br(E, t, N, b, k);
      }
    }
    function Bo(e, t, s, l) {
      var d = Lo(e, s, l, t);
      try {
        Aa(Vl, d);
      } finally {
        Lp(d);
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
          case Un:
            Rc(Wi, t), Rc(Un, t), s.set(Un, null), s.set(Wi, null);
            break;
          case ec:
          case Do:
            Bl(gf(e)) && Rc(e, t);
            break;
          case zr:
          case js:
          case Mn:
            break;
          default:
            var l = Po.indexOf(e) !== -1;
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
    var gi = !1, Qn = [], Ft = null, on = null, ln = null, $a = /* @__PURE__ */ new Map(), Hn = /* @__PURE__ */ new Map(), Fs = [];
    function If() {
      return Qn.length > 0;
    }
    var $s = [oa, kl, oc, lc, mf, zs, tf, ff, hf, sn, Al, tc, Ls, aa, El, Vn, Fi, si, Dl, _l, Do, ec, Kd, ef, Pl, Ml, za, Il, Mn, js], Uo = [Wi, Un, Os, Rl, la, La, St, Ai, sa, rc];
    function Qa(e) {
      return $s.indexOf(e) > -1;
    }
    function Hl(e, t, s) {
      vc(e, t, s);
    }
    function bc(e, t) {
      var s = or(t);
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
        eventSystemFlags: s | Vi,
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
        case Wi:
        case Un:
          Ft = null;
          break;
        case Os:
        case Rl:
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
          Hn.delete(l);
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
          return Ft = Qs(Ft, e, t, s, l, p), !0;
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
          var k = d, X = k.pointerId;
          return Hn.set(X, Qs(Hn.get(X) || null, e, t, s, l, k)), !0;
        }
      }
      return !1;
    }
    function Bp(e) {
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
          } else if (l === be) {
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
      for (gi = !1; Qn.length > 0; ) {
        var e = Qn[0];
        if (e.blockedOn !== null) {
          var t = Zo(e.blockedOn);
          t !== null && Mf(t);
          break;
        }
        var s = Dc(e.topLevelType, e.eventSystemFlags, e.container, e.nativeEvent);
        s !== null ? e.blockedOn = s : Qn.shift();
      }
      Ft !== null && Zs(Ft) && (Ft = null), on !== null && Zs(on) && (on = null), ln !== null && Zs(ln) && (ln = null), $a.forEach(Df), Hn.forEach(Df);
    }
    function Vo(e, t) {
      e.blockedOn === t && (e.blockedOn = null, gi || (gi = !0, o.unstable_scheduleCallback(o.unstable_NormalPriority, jp)));
    }
    function Cc(e) {
      if (Qn.length > 0) {
        Vo(Qn[0], e);
        for (var t = 1; t < Qn.length; t++) {
          var s = Qn[t];
          s.blockedOn === e && (s.blockedOn = null);
        }
      }
      Ft !== null && Vo(Ft, e), on !== null && Vo(on, e), ln !== null && Vo(ln, e);
      var l = function(b) {
        return Vo(b, e);
      };
      $a.forEach(l), Hn.forEach(l);
      for (var d = 0; d < Fs.length; d++) {
        var p = Fs[d];
        p.blockedOn === e && (p.blockedOn = null);
      }
      for (; Fs.length > 0; ) {
        var w = Fs[0];
        if (w.blockedOn !== null)
          break;
        Bp(w), w.blockedOn === null && Fs.shift();
      }
    }
    function Up(e, t, s) {
      e.addEventListener(t, s, !1);
    }
    function Tc(e, t, s) {
      e.addEventListener(t, s, !0);
    }
    var Nf = {}, Mc = /* @__PURE__ */ new Map(), Ec = /* @__PURE__ */ new Map(), Ic = [Un, "blur", ec, "cancel", Ml, "click", Do, "close", Il, "contextMenu", Kd, "copy", ef, "cut", zs, "auxClick", tf, "doubleClick", Al, "dragEnd", tc, "dragStart", Ls, "drop", Wi, "focus", Dl, "input", zr, "invalid", Vn, "keyDown", Fi, "keyPress", si, "keyUp", oa, "mouseDown", kl, "mouseUp", Pl, "paste", uf, "pause", cf, "play", ff, "pointerCancel", hf, "pointerDown", sn, "pointerUp", Pn, "rateChange", Mn, "reset", Ba, "seeked", js, "submit", oc, "touchCancel", lc, "touchEnd", mf, "touchStart", cc, "volumeChange"], Cg = [za, ja, _l, El, aa, qd], Tg = [Np, "drag", Os, "dragEnter", nf, "dragExit", Rl, "dragLeave", rf, "dragOver", Nl, "mouseMove", La, "mouseOut", la, "mouseOver", ac, "pointerMove", Ai, "pointerOut", St, "pointerOver", Lr, "scroll", ko, "toggle", uc, "touchMove", vf, "wheel"], Mg = [Gd, "abort", Dp, "animationEnd", Xd, "animationIteration", Jd, "animationStart", Ps, "canPlay", _s, "canPlayThrough", nc, "durationChange", Bs, "emptied", af, "encrypted", sf, "ended", Ii, "error", sa, "gotPointerCapture", Oa, "load", of, "loadedData", lf, "loadedMetadata", ic, "loadStart", rc, "lostPointerCapture", df, "playing", Or, "progress", $n, "seeking", sc, "stalled", No, "suspend", pf, "timeUpdate", zl, "transitionEnd", dc, "waiting"];
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
    ur(Ic, Ra), ur(Tg, kn), ur(Mg, Ar), Za(Cg, Ra);
    function Ys(e) {
      var t = Ec.get(e);
      return t === void 0 ? Ar : t;
    }
    var Vp = o.unstable_UserBlockingPriority, Hp = o.unstable_runWithPriority, Wl = !0;
    function kf(e) {
      Wl = !!e;
    }
    function Ac() {
      return Wl;
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
        case kn:
          l = Wp.bind(null, t, Gr, e);
          break;
        case Ar:
        default:
          l = Fl.bind(null, t, Gr, e);
          break;
      }
      var d = gf(t);
      s ? Tc(e, d, l) : Up(e, d, l);
    }
    function Di(e, t, s, l) {
      wo(l.timeStamp), yo(Fl, e, t, s, l);
    }
    function Wp(e, t, s, l) {
      Hp(Vp, Fl.bind(null, e, t, s, l));
    }
    function Fl(e, t, s, l) {
      if (!!Wl) {
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
      var d = Ll(l), p = eh(d);
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
          } else if (b === be) {
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
          var w = s[p], b = l[p];
          if (b && w !== b) {
            var E = w + "," + b;
            if (d[E])
              continue;
            d[E] = !0, g("%s a style property during rerender (%s) when a conflicting property is set (%s) can lead to styling bugs. To avoid this, don't mix shorthand and non-shorthand properties for the same value; instead, replace the shorthand with separate values.", Dg(e[w]) ? "Removing" : "Updating", w, b);
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
    function _n(e, t) {
      {
        var s = [];
        for (var l in t) {
          var d = rm(e, l);
          d || s.push(l);
        }
        var p = s.map(function(w) {
          return "`" + w + "`";
        }).join(", ");
        s.length === 1 ? g("Invalid aria prop %s on <%s> tag. For details, see https://fb.me/invalid-aria-prop", p, e) : s.length > 1 && g("Invalid aria props %s on <%s> tag. For details, see https://fb.me/invalid-aria-prop", p, e);
      }
    }
    function Uf(e, t) {
      da(e, t) || _n(e, t);
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
      var zn = {}, am = Object.prototype.hasOwnProperty, Yl = /^on./, Lc = /^on[^A-Z]/, Vf = new RegExp("^(aria)-[" + ne + "]*$"), at = new RegExp("^(aria)[A-Z][" + ne + "]*$");
      Ya = function(e, t, s, l) {
        if (am.call(zn, t) && zn[t])
          return !0;
        var d = t.toLowerCase();
        if (d === "onfocusin" || d === "onfocusout")
          return g("React uses onFocus and onBlur instead of onFocusIn and onFocusOut. All React events are normalized to bubble, so onFocusIn and onFocusOut are not needed/supported by React."), zn[t] = !0, !0;
        if (l) {
          if (He.hasOwnProperty(t))
            return !0;
          var p = bn.hasOwnProperty(d) ? bn[d] : null;
          if (p != null)
            return g("Invalid event handler property `%s`. Did you mean `%s`?", t, p), zn[t] = !0, !0;
          if (Yl.test(t))
            return g("Unknown event handler property `%s`. It will be ignored.", t), zn[t] = !0, !0;
        } else if (Yl.test(t))
          return Lc.test(t) && g("Invalid event handler property `%s`. React events use the camelCase naming convention, for example `onClick`.", t), zn[t] = !0, !0;
        if (Vf.test(t) || at.test(t))
          return !0;
        if (d === "innerhtml")
          return g("Directly setting property `innerHTML` is not permitted. For more information, lookup documentation on `dangerouslySetInnerHTML`."), zn[t] = !0, !0;
        if (d === "aria")
          return g("The `aria` attribute is reserved for future use in React. Pass individual `aria-` attributes instead."), zn[t] = !0, !0;
        if (d === "is" && s !== null && s !== void 0 && typeof s != "string")
          return g("Received a `%s` for a string attribute `is`. If this is expected, cast the value to a string.", typeof s), zn[t] = !0, !0;
        if (typeof s == "number" && isNaN(s))
          return g("Received NaN for the `%s` attribute. If this is expected, cast the value to a string.", t), zn[t] = !0, !0;
        var w = bo(t), b = w !== null && w.type === qr;
        if (Zl.hasOwnProperty(d)) {
          var E = Zl[d];
          if (E !== t)
            return g("Invalid DOM property `%s`. Did you mean `%s`?", t, E), zn[t] = !0, !0;
        } else if (!b && t !== d)
          return g("React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element.", t, d), zn[t] = !0, !0;
        return typeof s == "boolean" && qt(t, s, w, !1) ? (s ? g('Received `%s` for a non-boolean attribute `%s`.\n\nIf you want to write it to the DOM, pass a string instead: %s="%s" or %s={value.toString()}.', s, t, t, s, t) : g('Received `%s` for a non-boolean attribute `%s`.\n\nIf you want to write it to the DOM, pass a string instead: %s="%s" or %s={value.toString()}.\n\nIf you used to conditionally omit it with %s={condition && value}, pass %s={condition ? value : undefined} instead.', s, t, t, s, t, t, t), zn[t] = !0, !0) : b ? !0 : qt(t, s, w, !1) ? (zn[t] = !0, !1) : ((s === "false" || s === "true") && w !== null && w.type === jn && (g("Received the string `%s` for the boolean attribute `%s`. %s Did you mean %s={%s}?", s, t, s === "false" ? "The browser will interpret it as a truthy value." : 'Although this works, it will not work as expected if you pass the string "false".', t, s), zn[t] = !0), !0);
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
    var Vt = !1, pn = "dangerouslySetInnerHTML", qs = "suppressContentEditableWarning", ki = "suppressHydrationWarning", Ho = "autoFocus", Ur = "children", dr = "style", Ks = "__html", Ga = hi.html, Bc, ze, eo, Wo, Yi, Gl, Xa, Fo, fr, $o;
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
      }, Fo = Bn && !document.documentMode;
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
      }, Gl = function(e) {
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
    function On(e, t) {
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
            b != null && Ap(t, b);
          } else if (p === Ur)
            if (typeof w == "string") {
              var E = e !== "textarea" || w !== "";
              E && Cl(t, w);
            } else
              typeof w == "number" && Cl(t, "" + w);
          else
            p === qs || p === ki || p === Ho || (He.hasOwnProperty(p) ? w != null && (typeof w != "function" && Xa(p, w), On(s, p)) : w != null && M(t, p, w, d));
        }
    }
    function Pi(e, t, s, l) {
      for (var d = 0; d < t.length; d += 2) {
        var p = t[d], w = t[d + 1];
        p === dr ? Lf(e, w) : p === pn ? Ap(e, w) : p === Ur ? Cl(e, w) : M(e, p, w, l);
      }
    }
    function sm(e, t, s, l) {
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
    function kg(e, t, s, l) {
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
          for (var w = 0; w < Po.length; w++)
            Gt(Po[w], e);
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
          Gt(Mn, e), Gt(js, e), p = s;
          break;
        case "details":
          Gt(ko, e), p = s;
          break;
        case "input":
          Hd(e, s), p = Fu(e, s), Gt(zr, e), On(l, "onChange");
          break;
        case "option":
          Fd(e, s), p = Pr(e, s);
          break;
        case "select":
          _r(e, s), p = bl(e, s), Gt(zr, e), On(l, "onChange");
          break;
        case "textarea":
          Ns(e, s), p = Qd(e, s), Gt(zr, e), On(l, "onChange");
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
      var p = null, w, b;
      switch (t) {
        case "input":
          w = Fu(e, s), b = Fu(e, l), p = [];
          break;
        case "option":
          w = Pr(e, s), b = Pr(e, l), p = [];
          break;
        case "select":
          w = bl(e, s), b = bl(e, l), p = [];
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
            var X = w[E];
            for (N in X)
              X.hasOwnProperty(N) && (k || (k = {}), k[N] = "");
          } else
            E === pn || E === Ur || E === qs || E === ki || E === Ho || (He.hasOwnProperty(E) ? p || (p = []) : (p = p || []).push(E, null));
      for (E in b) {
        var L = b[E], J = w != null ? w[E] : void 0;
        if (!(!b.hasOwnProperty(E) || L === J || L == null && J == null))
          if (E === dr)
            if (L && Object.freeze(L), J) {
              for (N in J)
                J.hasOwnProperty(N) && (!L || !L.hasOwnProperty(N)) && (k || (k = {}), k[N] = "");
              for (N in L)
                L.hasOwnProperty(N) && J[N] !== L[N] && (k || (k = {}), k[N] = L[N]);
            } else
              k || (p || (p = []), p.push(E, k)), k = L;
          else if (E === pn) {
            var me = L ? L[Ks] : void 0, we = J ? J[Ks] : void 0;
            me != null && we !== me && (p = p || []).push(E, me);
          } else
            E === Ur ? J !== L && (typeof L == "string" || typeof L == "number") && (p = p || []).push(E, "" + L) : E === qs || E === ki || (He.hasOwnProperty(E) ? (L != null && (typeof L != "function" && Xa(E, L), On(d, E)), !p && J !== L && (p = [])) : (p = p || []).push(E, L));
      }
      return k && (Kp(k, b[dr]), (p = p || []).push(dr, k)), p;
    }
    function lm(e, t, s, l, d) {
      s === "input" && d.type === "radio" && d.name != null && $u(e, d);
      var p = da(s, l), w = da(s, d);
      switch (Pi(e, t, p, w), s) {
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
      var p, w;
      switch (ze = s[ki] === !0, p = da(t, s), eo(t, s), t) {
        case "iframe":
        case "object":
        case "embed":
          Gt(Oa, e);
          break;
        case "video":
        case "audio":
          for (var b = 0; b < Po.length; b++)
            Gt(Po[b], e);
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
          Gt(Mn, e), Gt(js, e);
          break;
        case "details":
          Gt(ko, e);
          break;
        case "input":
          Hd(e, s), Gt(zr, e), On(d, "onChange");
          break;
        case "option":
          Fd(e, s);
          break;
        case "select":
          _r(e, s), Gt(zr, e), On(d, "onChange");
          break;
        case "textarea":
          Ns(e, s), Gt(zr, e), On(d, "onChange");
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
      var X = null;
      for (var L in s)
        if (!!s.hasOwnProperty(L)) {
          var J = s[L];
          if (L === Ur)
            typeof J == "string" ? e.textContent !== J && (ze || Wo(e.textContent, J), X = [Ur, J]) : typeof J == "number" && e.textContent !== "" + J && (ze || Wo(e.textContent, J), X = [Ur, "" + J]);
          else if (He.hasOwnProperty(L))
            J != null && (typeof J != "function" && Xa(L, J), On(d, L));
          else if (typeof p == "boolean") {
            var me = void 0, we = bo(L);
            if (!ze) {
              if (!(L === qs || L === ki || L === "value" || L === "checked" || L === "selected")) {
                if (L === pn) {
                  var qe = e.innerHTML, nt = J ? J[Ks] : void 0, _t = $o(e, nt != null ? nt : "");
                  _t !== qe && Yi(L, qe, _t);
                } else if (L === dr) {
                  if (w.delete(L), Fo) {
                    var vt = qp(J);
                    me = e.getAttribute("style"), vt !== me && Yi(L, me, vt);
                  }
                } else if (p)
                  w.delete(L.toLowerCase()), me = ml(e, L, J), J !== me && Yi(L, me, J);
                else if (!ti(L, we, p) && !Da(L, J, we, p)) {
                  var $t = !1;
                  if (we !== null)
                    w.delete(we.attributeName), me = Bu(e, L, J, we);
                  else {
                    var W = l;
                    if (W === Ga && (W = Zd(t)), W === Ga)
                      w.delete(L.toLowerCase());
                    else {
                      var te = no(L);
                      te !== null && te !== L && ($t = !0, w.delete(te)), w.delete(L);
                    }
                    me = ml(e, L, J);
                  }
                  J !== me && !$t && Yi(L, me, J);
                }
              }
            }
          }
        }
      switch (w.size > 0 && !ze && Gl(w), t) {
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
        if (Vt)
          return;
        Vt = !0, g("Did not expect server HTML to contain a <%s> in <%s>.", t.nodeName.toLowerCase(), e.nodeName.toLowerCase());
      }
    }
    function dm(e, t) {
      {
        if (Vt)
          return;
        Vt = !0, g('Did not expect server HTML to contain the text node "%s" in <%s>.', t.nodeValue, e.nodeName.toLowerCase());
      }
    }
    function fm(e, t, s) {
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
    function pm(e, t) {
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
      return _g(e, d, p, w, b);
    }
    function _g(e, t, s, l, d) {
      var p = 0, w = -1, b = -1, E = 0, N = 0, k = e, X = null;
      e:
        for (; ; ) {
          for (var L = null; k === t && (s === 0 || k.nodeType === sr) && (w = p + s), k === l && (d === 0 || k.nodeType === sr) && (b = p + d), k.nodeType === sr && (p += k.nodeValue.length), (L = k.firstChild) !== null; )
            X = k, k = L;
          for (; ; ) {
            if (k === e)
              break e;
            if (X === t && ++E === s && (w = p), X === l && ++N === d && (b = p), (L = k.nextSibling) !== null)
              break;
            k = X, X = k.parentNode;
          }
          k = L;
        }
      return w === -1 || b === -1 ? null : {
        start: w,
        end: b
      };
    }
    function mm(e, t) {
      var s = e.ownerDocument || document, l = s && s.defaultView || window;
      if (!!l.getSelection) {
        var d = l.getSelection(), p = e.textContent.length, w = Math.min(t.start, p), b = t.end === void 0 ? w : Math.min(t.end, p);
        if (!d.extend && w > b) {
          var E = b;
          b = w, w = E;
        }
        var N = pm(e, w), k = pm(e, b);
        if (N && k) {
          if (d.rangeCount === 1 && d.anchorNode === N.node && d.anchorOffset === N.offset && d.focusNode === k.node && d.focusOffset === k.offset)
            return;
          var X = s.createRange();
          X.setStart(N.node, N.offset), d.removeAllRanges(), w > b ? (d.addRange(X), d.extend(k.node, k.offset)) : (X.setEnd(k.node, k.offset), d.addRange(X));
        }
      }
    }
    function es(e) {
      return e && e.nodeType === sr;
    }
    function vm(e, t) {
      return !e || !t ? !1 : e === t ? !0 : es(e) ? !1 : es(t) ? vm(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1;
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
        selectionRange: ql(e) ? Vr(e) : null
      };
    }
    function Lg(e) {
      var t = Vc(), s = e.focusedElem, l = e.selectionRange;
      if (t !== s && zg(s)) {
        l !== null && ql(s) && Qf(s, l);
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
      l === void 0 && (l = s), "selectionStart" in e ? (e.selectionStart = s, e.selectionEnd = Math.min(l, e.value.length)) : mm(e, t);
    }
    var Kl = function() {
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
      hr = function(e, t) {
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
        var p = wm(e, d) ? null : l, w = p ? null : io(e, s), b = p || w;
        if (!!b) {
          var E = b.tag, N = ft(), k = !!p + "|" + e + "|" + E + "|" + N;
          if (!Gf[k]) {
            Gf[k] = !0;
            var X = e, L = "";
            if (e === "#text" ? /\S/.test(t) ? X = "Text nodes" : (X = "Whitespace text nodes", L = " Make sure you don't have any extra whitespace between tags on each line of your source code.") : X = "<" + e + ">", p) {
              var J = "";
              E === "table" && e === "tr" && (J += " Add a <tbody>, <thead> or <tfoot> to your code to match the DOM tree generated by the browser."), g("validateDOMNesting(...): %s cannot appear as a child of <%s>.%s%s", X, E, L, J);
            } else
              g("validateDOMNesting(...): %s cannot appear as a descendant of <%s>.", X, E);
          }
        }
      };
    }
    var ts;
    ts = "suppressHydrationWarning";
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
    function bm(e, t, s) {
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
      ro = Ac(), Jf = Og(), kf(!1);
    }
    function a(e) {
      Lg(Jf), kf(ro), ro = null, Jf = null;
    }
    function u(e, t, s, l, d) {
      var p;
      {
        var w = l;
        if (Kl(e, null, w.ancestorInfo), typeof t.children == "string" || typeof t.children == "number") {
          var b = "" + t.children, E = hr(w.ancestorInfo, e);
          Kl(null, b, E);
        }
        p = w.namespace;
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
    function x(e, t, s, l, d, p) {
      {
        var w = p;
        if (typeof l.children != typeof s.children && (typeof l.children == "string" || typeof l.children == "number")) {
          var b = "" + l.children, E = hr(w.ancestorInfo, t);
          Kl(null, b, E);
        }
      }
      return om(e, t, s, l, d);
    }
    function T(e, t) {
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
    var U = typeof setTimeout == "function" ? setTimeout : void 0, Te = typeof clearTimeout == "function" ? clearTimeout : void 0, De = -1;
    function mt(e, t, s, l) {
      nu(t, s) && e.focus();
    }
    function Et(e, t, s, l, d, p) {
      Wg(e, d), lm(e, t, s, l, d);
    }
    function _i(e) {
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
    function ke(e, t) {
      e.nodeType === ai ? e.parentNode.removeChild(t) : e.removeChild(t);
    }
    function Je(e) {
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
    function jg(e, t) {
      return t === "" || e.nodeType !== sr ? null : e;
    }
    function HE(e) {
      return e.data === Fc;
    }
    function WE(e) {
      return e.data === tu;
    }
    function kS(e) {
      for (; e != null; e = e.nextSibling) {
        var t = e.nodeType;
        if (t === ar || t === sr)
          break;
      }
      return e;
    }
    function Sm(e) {
      return kS(e.nextSibling);
    }
    function PS(e) {
      return kS(e.firstChild);
    }
    function FE(e, t, s, l, d, p) {
      xm(p, e), Wg(e, s);
      var w;
      {
        var b = d;
        w = b.namespace;
      }
      return um(e, t, s, w, l);
    }
    function $E(e, t, s) {
      return xm(s, e), cm(e, t);
    }
    function QE(e) {
      for (var t = e.nextSibling, s = 0; t; ) {
        if (t.nodeType === ai) {
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
    function _S(e) {
      for (var t = e.previousSibling, s = 0; t; ) {
        if (t.nodeType === ai) {
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
    function ZE(e) {
      Cc(e);
    }
    function YE(e) {
      Cc(e);
    }
    function GE(e, t, s) {
      Ff(t, s);
    }
    function XE(e, t, s, l, d) {
      t[ts] !== !0 && Ff(l, d);
    }
    function JE(e, t) {
      t.nodeType === ar ? Xl(e, t) : t.nodeType === ai || dm(e, t);
    }
    function qE(e, t, s, l) {
      t[ts] !== !0 && (l.nodeType === ar ? Xl(s, l) : l.nodeType === ai || dm(s, l));
    }
    function KE(e, t, s) {
      fm(e, t);
    }
    function eI(e, t) {
      $f(e, t);
    }
    function tI(e, t, s, l, d) {
      t[ts] !== !0 && fm(s, l);
    }
    function nI(e, t, s, l) {
      t[ts] !== !0 && $f(s, l);
    }
    function iI(e, t, s) {
      t[ts];
    }
    var Ug = Math.random().toString(36).slice(2), qf = "__reactInternalInstance$" + Ug, zS = "__reactEventHandlers$" + Ug, Kf = "__reactContainere$" + Ug;
    function xm(e, t) {
      t[qf] = e;
    }
    function rI(e, t) {
      t[Kf] = e;
    }
    function OS(e) {
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
            for (var d = _S(e); d !== null; ) {
              var p = d[qf];
              if (p)
                return p;
              d = _S(d);
            }
          return t;
        }
        e = s, s = e.parentNode;
      }
      return null;
    }
    function Zo(e) {
      var t = e[qf] || e[Kf];
      return t && (t.tag === Re || t.tag === Fe || t.tag === ee || t.tag === be) ? t : null;
    }
    function iu(e) {
      if (e.tag === Re || e.tag === Fe)
        return e.stateNode;
      throw Error("getNodeFromInstance: Invalid argument.");
    }
    function Hg(e) {
      return e[zS] || null;
    }
    function Wg(e, t) {
      e[zS] = t;
    }
    function ao(e) {
      do
        e = e.return;
      while (e && e.tag !== Re);
      return e || null;
    }
    function aI(e, t) {
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
    function sI(e, t, s) {
      for (var l = []; e; )
        l.push(e), e = ao(e);
      var d;
      for (d = l.length; d-- > 0; )
        t(l[d], "captured", s);
      for (d = 0; d < l.length; d++)
        t(l[d], "bubbled", s);
    }
    function oI(e, t, s, l, d) {
      for (var p = e && t ? aI(e, t) : null, w = []; !(!e || e === p); ) {
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
      for (var X = E.length; X-- > 0; )
        s(E[X], "captured", d);
    }
    function lI(e) {
      return e === "button" || e === "input" || e === "select" || e === "textarea";
    }
    function uI(e, t, s) {
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
          return !!(s.disabled && lI(t));
        default:
          return !1;
      }
    }
    function LS(e, t) {
      var s, l = e.stateNode;
      if (!l)
        return null;
      var d = $e(l);
      if (!d || (s = d[t], uI(t, e.type, d)))
        return null;
      if (!(!s || typeof s == "function"))
        throw Error("Expected `" + t + "` listener to be a function, instead got a value of `" + typeof s + "` type.");
      return s;
    }
    function cI(e, t, s) {
      var l = t.dispatchConfig.phasedRegistrationNames[s];
      return LS(e, l);
    }
    function dI(e, t, s) {
      e || g("Dispatching inst must not be null");
      var l = cI(e, s, t);
      l && (s._dispatchListeners = Vs(s._dispatchListeners, l), s._dispatchInstances = Vs(s._dispatchInstances, e));
    }
    function fI(e) {
      e && e.dispatchConfig.phasedRegistrationNames && sI(e._targetInst, dI, e);
    }
    function BS(e, t, s) {
      if (e && s && s.dispatchConfig.registrationName) {
        var l = s.dispatchConfig.registrationName, d = LS(e, l);
        d && (s._dispatchListeners = Vs(s._dispatchListeners, d), s._dispatchInstances = Vs(s._dispatchInstances, e));
      }
    }
    function hI(e) {
      e && e.dispatchConfig.registrationName && BS(e._targetInst, null, e);
    }
    function $c(e) {
      Oo(e, fI);
    }
    function pI(e, t, s, l) {
      oI(s, l, BS, e, t);
    }
    function mI(e) {
      Oo(e, hI);
    }
    var th = null, Fg = null, nh = null;
    function vI(e) {
      return th = e, Fg = US(), !0;
    }
    function gI() {
      th = null, Fg = null, nh = null;
    }
    function jS() {
      if (nh)
        return nh;
      var e, t = Fg, s = t.length, l, d = US(), p = d.length;
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
    var yI = 10, wI = {
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
      return b ? this.isDefaultPrevented = Cm : this.isDefaultPrevented = ru, this.isPropagationStopped = ru, this;
    }
    i(pr.prototype, {
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
    }), pr.Interface = wI, pr.extend = function(e) {
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
    function bI(e, t, s, l) {
      var d = this;
      if (d.eventPool.length) {
        var p = d.eventPool.pop();
        return d.call(p, e, t, s, l), p;
      }
      return new d(e, t, s, l);
    }
    function SI(e) {
      var t = this;
      if (!(e instanceof t))
        throw Error("Trying to release an event instance into a pool of a different type.");
      e.destructor(), t.eventPool.length < yI && t.eventPool.push(e);
    }
    function VS(e) {
      e.eventPool = [], e.getPooled = bI, e.release = SI;
    }
    var xI = pr.extend({
      data: null
    }), CI = pr.extend({
      data: null
    }), TI = [9, 13, 27, 32], HS = 229, $g = Bn && "CompositionEvent" in window, ih = null;
    Bn && "documentMode" in document && (ih = document.documentMode);
    var MI = Bn && "TextEvent" in window && !ih, WS = Bn && (!$g || ih && ih > 8 && ih <= 11), FS = 32, $S = String.fromCharCode(FS), so = {
      beforeInput: {
        phasedRegistrationNames: {
          bubbled: "onBeforeInput",
          captured: "onBeforeInputCapture"
        },
        dependencies: [aa, Fi, _l, Pl]
      },
      compositionEnd: {
        phasedRegistrationNames: {
          bubbled: "onCompositionEnd",
          captured: "onCompositionEndCapture"
        },
        dependencies: [Un, aa, Vn, Fi, si, oa]
      },
      compositionStart: {
        phasedRegistrationNames: {
          bubbled: "onCompositionStart",
          captured: "onCompositionStartCapture"
        },
        dependencies: [Un, El, Vn, Fi, si, oa]
      },
      compositionUpdate: {
        phasedRegistrationNames: {
          bubbled: "onCompositionUpdate",
          captured: "onCompositionUpdateCapture"
        },
        dependencies: [Un, qd, Vn, Fi, si, oa]
      }
    }, QS = !1;
    function EI(e) {
      return (e.ctrlKey || e.altKey || e.metaKey) && !(e.ctrlKey && e.altKey);
    }
    function II(e) {
      switch (e) {
        case El:
          return so.compositionStart;
        case aa:
          return so.compositionEnd;
        case qd:
          return so.compositionUpdate;
      }
    }
    function AI(e, t) {
      return e === Vn && t.keyCode === HS;
    }
    function ZS(e, t) {
      switch (e) {
        case si:
          return TI.indexOf(t.keyCode) !== -1;
        case Vn:
          return t.keyCode !== HS;
        case Fi:
        case oa:
        case Un:
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
    function RI(e, t, s, l) {
      var d, p;
      if ($g ? d = II(e) : Zc ? ZS(e, s) && (d = so.compositionEnd) : AI(e, s) && (d = so.compositionStart), !d)
        return null;
      WS && !GS(s) && (!Zc && d === so.compositionStart ? Zc = vI(l) : d === so.compositionEnd && Zc && (p = jS()));
      var w = xI.getPooled(d, t, s, l);
      if (p)
        w.data = p;
      else {
        var b = YS(s);
        b !== null && (w.data = b);
      }
      return $c(w), w;
    }
    function DI(e, t) {
      switch (e) {
        case aa:
          return YS(t);
        case Fi:
          var s = t.which;
          return s !== FS ? null : (QS = !0, $S);
        case _l:
          var l = t.data;
          return l === $S && QS ? null : l;
        default:
          return null;
      }
    }
    function NI(e, t) {
      if (Zc) {
        if (e === aa || !$g && ZS(e, t)) {
          var s = jS();
          return gI(), Zc = !1, s;
        }
        return null;
      }
      switch (e) {
        case Pl:
          return null;
        case Fi:
          if (!EI(t)) {
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
    function kI(e, t, s, l) {
      var d;
      if (MI ? d = DI(e, s) : d = NI(e, s), !d)
        return null;
      var p = CI.getPooled(so.beforeInput, t, s, l);
      return p.data = d, $c(p), p;
    }
    var PI = {
      eventTypes: so,
      extractEvents: function(e, t, s, l, d) {
        var p = RI(e, t, s, l), w = kI(e, t, s, l);
        return p === null ? w : w === null ? p : [p, w];
      }
    }, _I = {
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
      return t === "input" ? !!_I[e.type] : t === "textarea";
    }
    var JS = {
      change: {
        phasedRegistrationNames: {
          bubbled: "onChange",
          captured: "onChangeCapture"
        },
        dependencies: [Un, za, Ml, Wi, Dl, Vn, si, ja]
      }
    };
    function qS(e, t, s) {
      var l = pr.getPooled(JS.change, e, t, s);
      return l.type = "change", Ti(s), $c(l), l;
    }
    var rh = null, ah = null;
    function zI(e) {
      var t = e.nodeName && e.nodeName.toLowerCase();
      return t === "select" || t === "input" && e.type === "file";
    }
    function OI(e) {
      var t = qS(ah, e, Ll(e));
      Jr(LI, t);
    }
    function LI(e) {
      mc(e);
    }
    function Tm(e) {
      var t = iu(e);
      if (Hu(t))
        return e;
    }
    function BI(e, t) {
      if (e === za)
        return t;
    }
    var Qg = !1;
    Bn && (Qg = Bl("input") && (!document.documentMode || document.documentMode > 9));
    function jI(e, t) {
      rh = e, ah = t, rh.attachEvent("onpropertychange", ex);
    }
    function KS() {
      !rh || (rh.detachEvent("onpropertychange", ex), rh = null, ah = null);
    }
    function ex(e) {
      e.propertyName === "value" && Tm(ah) && OI(e);
    }
    function UI(e, t, s) {
      e === Wi ? (KS(), jI(t, s)) : e === Un && KS();
    }
    function VI(e, t) {
      if (e === ja || e === si || e === Vn)
        return Tm(ah);
    }
    function HI(e) {
      var t = e.nodeName;
      return t && t.toLowerCase() === "input" && (e.type === "checkbox" || e.type === "radio");
    }
    function WI(e, t) {
      if (e === Ml)
        return Tm(t);
    }
    function FI(e, t) {
      if (e === Dl || e === za)
        return Tm(t);
    }
    function $I(e) {
      var t = e._wrapperState;
      !t || !t.controlled || e.type !== "number" || yl(e, "number", e.value);
    }
    var QI = {
      eventTypes: JS,
      _isInputEventSupported: Qg,
      extractEvents: function(e, t, s, l, d) {
        var p = t ? iu(t) : window, w, b;
        if (zI(p) ? w = BI : XS(p) ? Qg ? w = FI : (w = VI, b = UI) : HI(p) && (w = WI), w) {
          var E = w(e, t);
          if (E) {
            var N = qS(E, s, l);
            return N;
          }
        }
        b && b(e, p, t), e === Un && $I(p);
      }
    }, sh = pr.extend({
      view: null,
      detail: null
    }), ZI = {
      Alt: "altKey",
      Control: "ctrlKey",
      Meta: "metaKey",
      Shift: "shiftKey"
    };
    function YI(e) {
      var t = this, s = t.nativeEvent;
      if (s.getModifierState)
        return s.getModifierState(e);
      var l = ZI[e];
      return l ? !!s[l] : !1;
    }
    function Zg(e) {
      return YI;
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
      getModifierState: Zg,
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
    }, GI = {
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
          var X = s.relatedTarget || s.toElement;
          if (k = X ? eh(X) : null, k !== null) {
            var L = vi(k);
            (k !== L || k.tag !== Re && k.tag !== Fe) && (k = null);
          }
        } else
          N = null, k = t;
        if (N === k)
          return null;
        var J, me, we, qe;
        e === La || e === la ? (J = oh, me = lh.mouseLeave, we = lh.mouseEnter, qe = "mouse") : (e === Ai || e === St) && (J = ax, me = lh.pointerLeave, we = lh.pointerEnter, qe = "pointer");
        var nt = N == null ? b : iu(N), _t = k == null ? b : iu(k), vt = J.getPooled(me, N, s, l);
        vt.type = qe + "leave", vt.target = nt, vt.relatedTarget = _t;
        var $t = J.getPooled(we, k, s, l);
        return $t.type = qe + "enter", $t.target = _t, $t.relatedTarget = nt, pI(vt, $t, N, k), (d & Ta) === 0 ? [vt] : [vt, $t];
      }
    };
    function XI(e, t) {
      return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
    }
    var au = typeof Object.is == "function" ? Object.is : XI, JI = Object.prototype.hasOwnProperty;
    function uh(e, t) {
      if (au(e, t))
        return !0;
      if (typeof e != "object" || e === null || typeof t != "object" || t === null)
        return !1;
      var s = Object.keys(e), l = Object.keys(t);
      if (s.length !== l.length)
        return !1;
      for (var d = 0; d < s.length; d++)
        if (!JI.call(t, s[d]) || !au(e[s[d]], t[s[d]]))
          return !1;
      return !0;
    }
    var qI = Bn && "documentMode" in document && document.documentMode <= 11, sx = {
      select: {
        phasedRegistrationNames: {
          bubbled: "onSelect",
          captured: "onSelectCapture"
        },
        dependencies: [Un, Il, Al, Wi, Vn, si, oa, kl, ja]
      }
    }, Yc = null, Yg = null, ch = null, Gg = !1;
    function KI(e) {
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
    function ox(e) {
      return e.window === e ? e.document : e.nodeType === ka ? e : e.ownerDocument;
    }
    function lx(e, t) {
      var s = ox(t);
      if (Gg || Yc == null || Yc !== Jl(s))
        return null;
      var l = KI(Yc);
      if (!ch || !uh(ch, l)) {
        ch = l;
        var d = pr.getPooled(sx.select, Yg, e, t);
        return d.type = "select", d.target = Yc, $c(d), d;
      }
      return null;
    }
    var eA = {
      eventTypes: sx,
      extractEvents: function(e, t, s, l, d, p) {
        var w = p || ox(l);
        if (!w || !jo("onSelect", w))
          return null;
        var b = t ? iu(t) : window;
        switch (e) {
          case Wi:
            (XS(b) || b.contentEditable === "true") && (Yc = b, Yg = t, ch = null);
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
            return Gg = !1, lx(s, l);
          case ja:
            if (qI)
              break;
          case Vn:
          case si:
            return lx(s, l);
        }
        return null;
      }
    }, tA = pr.extend({
      animationName: null,
      elapsedTime: null,
      pseudoElement: null
    }), nA = pr.extend({
      clipboardData: function(e) {
        return "clipboardData" in e ? e.clipboardData : window.clipboardData;
      }
    }), iA = sh.extend({
      relatedTarget: null
    });
    function Mm(e) {
      var t, s = e.keyCode;
      return "charCode" in e ? (t = e.charCode, t === 0 && s === 13 && (t = 13)) : t = s, t === 10 && (t = 13), t >= 32 || t === 13 ? t : 0;
    }
    var rA = {
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
    }, aA = {
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
    function sA(e) {
      if (e.key) {
        var t = rA[e.key] || e.key;
        if (t !== "Unidentified")
          return t;
      }
      if (e.type === "keypress") {
        var s = Mm(e);
        return s === 13 ? "Enter" : String.fromCharCode(s);
      }
      return e.type === "keydown" || e.type === "keyup" ? aA[e.keyCode] || "Unidentified" : "";
    }
    var oA = sh.extend({
      key: sA,
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
    }), lA = oh.extend({
      dataTransfer: null
    }), uA = sh.extend({
      touches: null,
      targetTouches: null,
      changedTouches: null,
      altKey: null,
      metaKey: null,
      ctrlKey: null,
      shiftKey: null,
      getModifierState: Zg
    }), cA = pr.extend({
      propertyName: null,
      elapsedTime: null,
      pseudoElement: null
    }), dA = oh.extend({
      deltaX: function(e) {
        return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
      },
      deltaY: function(e) {
        return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
      },
      deltaZ: null,
      deltaMode: null
    }), fA = [Gd, ec, Ps, _s, Do, nc, Bs, af, sf, Ii, Dl, zr, Oa, of, lf, ic, uf, cf, df, Or, Pn, Mn, Ba, $n, sc, js, No, pf, ko, cc, dc], hA = {
      eventTypes: Nf,
      extractEvents: function(e, t, s, l, d) {
        var p = Mc.get(e);
        if (!p)
          return null;
        var w;
        switch (e) {
          case Fi:
            if (Mm(s) === 0)
              return null;
          case Vn:
          case si:
            w = oA;
            break;
          case Un:
          case Wi:
            w = iA;
            break;
          case Ml:
            if (s.button === 2)
              return null;
          case zs:
          case tf:
          case oa:
          case Nl:
          case kl:
          case La:
          case la:
          case Il:
            w = oh;
            break;
          case Np:
          case Al:
          case Os:
          case nf:
          case Rl:
          case rf:
          case tc:
          case Ls:
            w = lA;
            break;
          case oc:
          case lc:
          case uc:
          case mf:
            w = uA;
            break;
          case Dp:
          case Xd:
          case Jd:
            w = tA;
            break;
          case zl:
            w = cA;
            break;
          case Lr:
            w = sh;
            break;
          case vf:
            w = dA;
            break;
          case Kd:
          case ef:
          case Pl:
            w = nA;
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
            fA.indexOf(e) === -1 && g("SimpleEventPlugin: Unhandled event type, `%s`. This warning is likely caused by a bug in React. Please file an issue.", e), w = pr;
            break;
        }
        var b = w.getPooled(p, t, s, l);
        return $c(b), b;
      }
    }, pA = ["ResponderEventPlugin", "SimpleEventPlugin", "EnterLeaveEventPlugin", "ChangeEventPlugin", "SelectEventPlugin", "BeforeInputEventPlugin"];
    ci(pA), he(Hg, Zo, iu), Mr({
      SimpleEventPlugin: hA,
      EnterLeaveEventPlugin: GI,
      ChangeEventPlugin: QI,
      SelectEventPlugin: eA,
      BeforeInputEventPlugin: PI
    });
    var ux = "\u269B", mA = "\u26D4", yi = typeof performance < "u" && typeof performance.mark == "function" && typeof performance.clearMarks == "function" && typeof performance.measure == "function" && typeof performance.clearMeasures == "function", su = null, is = null, ou = null, Em = !1, Im = !1, Xg = !1, dh = 0, rs = 0, Am = /* @__PURE__ */ new Set(), Jg = function(e) {
      return ux + " " + e;
    }, vA = function(e, t) {
      var s = t ? mA + " " : ux + " ", l = t ? " Warning: " + t : "";
      return "" + s + e + l;
    }, Gc = function(e) {
      performance.mark(Jg(e));
    }, gA = function(e) {
      performance.clearMarks(Jg(e));
    }, Xc = function(e, t, s) {
      var l = Jg(t), d = vA(e, s);
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
      var s = Ce(e.type) || "Unknown", l = e._debugID, d = e.alternate !== null, p = Kg(s, d, t);
      if (Em && Am.has(p))
        return !1;
      Am.add(p);
      var w = qg(p, l);
      return Gc(w), !0;
    }, cx = function(e, t) {
      var s = Ce(e.type) || "Unknown", l = e._debugID, d = e.alternate !== null, p = Kg(s, d, t), w = qg(p, l);
      gA(w);
    }, Rm = function(e, t, s) {
      var l = Ce(e.type) || "Unknown", d = e._debugID, p = e.alternate !== null, w = Kg(l, p, t), b = qg(w, d);
      Xc(w, b, s);
    }, Dm = function(e) {
      switch (e.tag) {
        case be:
        case Re:
        case Fe:
        case Ve:
        case Tt:
        case re:
        case Ye:
        case Bt:
          return !0;
        default:
          return !1;
      }
    }, yA = function() {
      is !== null && ou !== null && cx(ou, is), ou = null, is = null, Xg = !1;
    }, wA = function() {
      for (var e = su; e; )
        e._debugIsCurrentlyTiming && Rm(e, null, null), e = e.return;
    }, dx = function(e) {
      e.return !== null && dx(e.return), e._debugIsCurrentlyTiming && ey(e, null);
    }, bA = function() {
      su !== null && dx(su);
    };
    function Nm() {
      rs++;
    }
    function SA() {
      Em && (Im = !0), is !== null && is !== "componentWillMount" && is !== "componentWillReceiveProps" && (Xg = !0);
    }
    function fx(e) {
      {
        if (!yi || Dm(e) || (su = e, !ey(e, null)))
          return;
        e._debugIsCurrentlyTiming = !0;
      }
    }
    function hx(e) {
      {
        if (!yi || Dm(e))
          return;
        e._debugIsCurrentlyTiming = !1, cx(e, null);
      }
    }
    function px(e) {
      {
        if (!yi || Dm(e) || (su = e.return, !e._debugIsCurrentlyTiming))
          return;
        e._debugIsCurrentlyTiming = !1, Rm(e, null, null);
      }
    }
    function xA(e) {
      {
        if (!yi || Dm(e) || (su = e.return, !e._debugIsCurrentlyTiming))
          return;
        e._debugIsCurrentlyTiming = !1;
        var t = e.tag === ee ? "Rendering was suspended" : "An error was thrown inside this error boundary";
        Rm(e, null, t);
      }
    }
    function as(e, t) {
      {
        if (!yi || (yA(), !ey(e, t)))
          return;
        ou = e, is = t;
      }
    }
    function ss() {
      {
        if (!yi)
          return;
        if (is !== null && ou !== null) {
          var e = Xg ? "Scheduled a cascading update" : null;
          Rm(ou, is, e);
        }
        is = null, ou = null;
      }
    }
    function mx(e) {
      {
        if (su = e, !yi)
          return;
        dh = 0, Gc("(React Tree Reconciliation)"), bA();
      }
    }
    function vx(e, t) {
      {
        if (!yi)
          return;
        var s = null;
        if (e !== null)
          if (e.tag === be)
            s = "A top-level update interrupted the previous render";
          else {
            var l = Ce(e.type) || "Unknown";
            s = "An update to " + l + " interrupted the previous render";
          }
        else
          dh > 1 && (s = "There were cascading updates");
        dh = 0;
        var d = t ? "(React Tree Reconciliation: Completed Root)" : "(React Tree Reconciliation: Yielded)";
        wA(), Xc(d, "(React Tree Reconciliation)", s);
      }
    }
    function CA() {
      {
        if (!yi)
          return;
        Em = !0, Im = !1, Am.clear(), Gc("(Committing Changes)");
      }
    }
    function TA() {
      {
        if (!yi)
          return;
        var e = null;
        Im ? e = "Lifecycle hook scheduled a cascading update" : dh > 0 && (e = "Caused by a cascading update in earlier commit"), Im = !1, dh++, Em = !1, Am.clear(), Xc("(Committing Changes)", "(Committing Changes)", e);
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
    var ty = [], km;
    km = [];
    var oo = -1;
    function lu(e) {
      return {
        current: e
      };
    }
    function zi(e, t) {
      if (oo < 0) {
        g("Unexpected pop.");
        return;
      }
      t !== km[oo] && g("Unexpected Fiber popped."), e.current = ty[oo], ty[oo] = null, km[oo] = null, oo--;
    }
    function Oi(e, t, s) {
      oo++, ty[oo] = e.current, km[oo] = s, e.current = t;
    }
    var ny;
    ny = {};
    var mr = {};
    Object.freeze(mr);
    var lo = lu(mr), os = lu(!1), iy = mr;
    function Jc(e, t, s) {
      return s && ls(t) ? iy : lo.current;
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
          var b = Ce(s) || "Unknown";
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
    function _m(e) {
      zi(os, e), zi(lo, e);
    }
    function ry(e) {
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
            var p = Ce(t) || "Unknown";
            ny[p] || (ny[p] = !0, g("%s.childContextTypes is specified but there is no getChildContext() method on the instance. You can either define getChildContext() on %s or remove childContextTypes from it.", p, p));
          }
          return s;
        }
        var w;
        as(e, "getChildContext"), w = l.getChildContext(), ss();
        for (var b in w)
          if (!(b in d))
            throw Error((Ce(t) || "Unknown") + '.getChildContext(): key "' + b + '" is not defined in childContextTypes.');
        {
          var E = Ce(t) || "Unknown";
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
    function zm(e) {
      {
        var t = e.stateNode, s = t && t.__reactInternalMemoizedMergedChildContext || mr;
        return iy = lo.current, Oi(lo, s, e), Oi(os, os.current, e), !0;
      }
    }
    function Ex(e, t, s) {
      {
        var l = e.stateNode;
        if (!l)
          throw Error("Expected to have an instance by this point. This error is likely caused by a bug in React. Please file an issue.");
        if (s) {
          var d = Mx(e, t, iy);
          l.__reactInternalMemoizedMergedChildContext = d, zi(os, e), zi(lo, e), Oi(lo, d, e), Oi(os, s, e);
        } else
          zi(os, e), Oi(os, s, e);
      }
    }
    function MA(e) {
      {
        if (!(Ha(e) && e.tag === ue))
          throw Error("Expected subtree parent to be a mounted class component. This error is likely caused by a bug in React. Please file an issue.");
        var t = e;
        do {
          switch (t.tag) {
            case be:
              return t.stateNode.context;
            case ue: {
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
    var Ix = 0, EA = 1, IA = 2, AA = o.unstable_runWithPriority, ay = o.unstable_scheduleCallback, Ax = o.unstable_cancelCallback, RA = o.unstable_shouldYield, Rx = o.unstable_requestPaint, sy = o.unstable_now, DA = o.unstable_getCurrentPriorityLevel, Om = o.unstable_ImmediatePriority, Dx = o.unstable_UserBlockingPriority, Nx = o.unstable_NormalPriority, kx = o.unstable_LowPriority, Px = o.unstable_IdlePriority;
    if (!(h.__interactionsRef != null && h.__interactionsRef.current != null))
      throw Error("It is not supported to run the profiling version of a renderer (for example, `react-dom/profiling`) without also replacing the `scheduler/tracing` module with `scheduler/tracing-profiling`. Your bundler might have a setting for aliasing both modules. Learn more at http://fb.me/react-profiling");
    var _x = {}, Li = 99, Yo = 98, ha = 97, oy = 96, fh = 95, Kc = 90, NA = RA, kA = Rx !== void 0 ? Rx : function() {
    }, uo = null, Lm = null, ly = !1, zx = sy(), vr = zx < 1e4 ? sy : function() {
      return sy() - zx;
    };
    function ed() {
      switch (DA()) {
        case Om:
          return Li;
        case Dx:
          return Yo;
        case Nx:
          return ha;
        case kx:
          return oy;
        case Px:
          return fh;
        default:
          throw Error("Unknown priority level.");
      }
    }
    function Ox(e) {
      switch (e) {
        case Li:
          return Om;
        case Yo:
          return Dx;
        case ha:
          return Nx;
        case oy:
          return kx;
        case fh:
          return Px;
        default:
          throw Error("Unknown priority level.");
      }
    }
    function co(e, t) {
      var s = Ox(e);
      return AA(s, t);
    }
    function hh(e, t, s) {
      var l = Ox(e);
      return ay(l, t, s);
    }
    function Lx(e) {
      return uo === null ? (uo = [e], Lm = ay(Om, Bx)) : uo.push(e), _x;
    }
    function PA(e) {
      e !== _x && Ax(e);
    }
    function us() {
      if (Lm !== null) {
        var e = Lm;
        Lm = null, Ax(e);
      }
      Bx();
    }
    function Bx() {
      if (!ly && uo !== null) {
        ly = !0;
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
          throw uo !== null && (uo = uo.slice(e + 1)), ay(Om, us), l;
        } finally {
          ly = !1;
        }
      }
    }
    var oi = 0, gn = 1, Hr = 2, td = 4, cs = 8, ph = 1073741823, Ae = 0, ds = 1, uu = 2, jx = 3, Ct = ph, Ux = Ct - 1, Bm = 10, jm = Ux - 1;
    function uy(e) {
      return jm - (e / Bm | 0);
    }
    function cu(e) {
      return (jm - e) * Bm;
    }
    function _A(e, t) {
      return ((e / t | 0) + 1) * t;
    }
    function cy(e, t, s) {
      return jm - _A(jm - e + t / Bm, s / Bm);
    }
    var mh = 5e3, dy = 250;
    function zA(e) {
      return cy(e, mh, dy);
    }
    function OA(e, t) {
      return cy(e, t, dy);
    }
    var Vx = 500, Hx = 100;
    function Wx(e) {
      return cy(e, Vx, Hx);
    }
    function Fx(e, t) {
      if (t === Ct)
        return Li;
      if (t === ds || t === uu)
        return fh;
      var s = cu(t) - cu(e);
      return s <= 0 ? Li : s <= Vx + Hx ? Yo : s <= mh + dy ? ha : fh;
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
      var LA = function(e) {
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
          e.add(Ce(L.type) || "Component"), fu.add(L.type);
        }), vh = []);
        var t = /* @__PURE__ */ new Set();
        gh.length > 0 && (gh.forEach(function(L) {
          t.add(Ce(L.type) || "Component"), fu.add(L.type);
        }), gh = []);
        var s = /* @__PURE__ */ new Set();
        yh.length > 0 && (yh.forEach(function(L) {
          s.add(Ce(L.type) || "Component"), fu.add(L.type);
        }), yh = []);
        var l = /* @__PURE__ */ new Set();
        wh.length > 0 && (wh.forEach(function(L) {
          l.add(Ce(L.type) || "Component"), fu.add(L.type);
        }), wh = []);
        var d = /* @__PURE__ */ new Set();
        bh.length > 0 && (bh.forEach(function(L) {
          d.add(Ce(L.type) || "Component"), fu.add(L.type);
        }), bh = []);
        var p = /* @__PURE__ */ new Set();
        if (Sh.length > 0 && (Sh.forEach(function(L) {
          p.add(Ce(L.type) || "Component"), fu.add(L.type);
        }), Sh = []), t.size > 0) {
          var w = du(t);
          g(`Using UNSAFE_componentWillMount in strict mode is not recommended and may indicate bugs in your code. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move code with side effects to componentDidMount, and set initial state in the constructor.

Please update the following components: %s`, w);
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
          y(`componentWillMount has been renamed, and is not recommended for use. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move code with side effects to componentDidMount, and set initial state in the constructor.
* Rename componentWillMount to UNSAFE_componentWillMount to suppress this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: %s`, N);
        }
        if (s.size > 0) {
          var k = du(s);
          y(`componentWillReceiveProps has been renamed, and is not recommended for use. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move data fetching code or side effects to componentDidUpdate.
* If you're updating state whenever props change, refactor your code to use memoization techniques or move it to static getDerivedStateFromProps. Learn more at: https://fb.me/react-derived-state
* Rename componentWillReceiveProps to UNSAFE_componentWillReceiveProps to suppress this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: %s`, k);
        }
        if (d.size > 0) {
          var X = du(d);
          y(`componentWillUpdate has been renamed, and is not recommended for use. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move data fetching code or side effects to componentDidUpdate.
* Rename componentWillUpdate to UNSAFE_componentWillUpdate to suppress this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: %s`, X);
        }
      };
      var Um = /* @__PURE__ */ new Map(), $x = /* @__PURE__ */ new Set();
      pa.recordLegacyContextWarning = function(e, t) {
        var s = LA(e);
        if (s === null) {
          g("Expected to find a StrictMode component in a strict mode tree. This error is likely caused by a bug in React. Please file an issue.");
          return;
        }
        if (!$x.has(e.type)) {
          var l = Um.get(s);
          (e.type.contextTypes != null || e.type.childContextTypes != null || t !== null && typeof t.getChildContext == "function") && (l === void 0 && (l = [], Um.set(s, l)), l.push(e));
        }
      }, pa.flushLegacyContextWarning = function() {
        Um.forEach(function(e, t) {
          if (e.length !== 0) {
            var s = e[0], l = /* @__PURE__ */ new Set();
            e.forEach(function(w) {
              l.add(Ce(w.type) || "Component"), $x.add(w.type);
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
    var Wr = null, nd = null, BA = function(e) {
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
    function fy(e) {
      return id(e);
    }
    function hy(e) {
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
          case ue: {
            typeof l == "function" && (d = !0);
            break;
          }
          case _e: {
            (typeof l == "function" || p === ir) && (d = !0);
            break;
          }
          case D: {
            (p === ni || p === ir) && (d = !0);
            break;
          }
          case xe:
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
    var jA = function(e, t) {
      {
        if (Wr === null)
          return;
        var s = t.staleFamilies, l = t.updatedFamilies;
        tl(), gC(function() {
          py(e.current, l, s);
        });
      }
    }, UA = function(e, t) {
      {
        if (e.context !== mr)
          return;
        tl(), fR(function() {
          Uh(t, e, null, null);
        });
      }
    };
    function py(e, t, s) {
      {
        var l = e.alternate, d = e.child, p = e.sibling, w = e.tag, b = e.type, E = null;
        switch (w) {
          case _e:
          case ge:
          case ue:
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
          var X = Wr(E);
          X !== void 0 && (s.has(X) ? k = !0 : t.has(X) && (w === ue ? k = !0 : N = !0));
        }
        nd !== null && (nd.has(e) || l !== null && nd.has(l)) && (k = !0), k && (e._debugNeedsRemount = !0), (k || N) && Zr(e, Ct), d !== null && !k && py(d, t, s), p !== null && py(p, t, s);
      }
    }
    var VA = function(e, t) {
      {
        var s = /* @__PURE__ */ new Set(), l = new Set(t.map(function(d) {
          return d.current;
        }));
        return my(e.current, l, s), s;
      }
    };
    function my(e, t, s) {
      {
        var l = e.child, d = e.sibling, p = e.tag, w = e.type, b = null;
        switch (p) {
          case _e:
          case ge:
          case ue:
            b = w;
            break;
          case D:
            b = w.render;
            break;
        }
        var E = !1;
        b !== null && t.has(b) && (E = !0), E ? HA(e, s) : l !== null && my(l, t, s), d !== null && my(d, t, s);
      }
    }
    function HA(e, t) {
      {
        var s = WA(e, t);
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
            case be:
              t.add(l.stateNode.containerInfo);
              return;
          }
          if (l.return === null)
            throw new Error("Expected to reach root first.");
          l = l.return;
        }
      }
    }
    function WA(e, t) {
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
    function FA(e) {
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
    function Yx() {
      Wm = !0;
    }
    function Gx() {
      Wm = !1;
    }
    function Xx(e, t) {
      var s = e.type._context;
      Oi(vy, s._currentValue, e), s._currentValue = t, s._currentRenderer !== void 0 && s._currentRenderer !== null && s._currentRenderer !== gy && g("Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported."), s._currentRenderer = gy;
    }
    function yy(e) {
      var t = vy.current;
      zi(vy, e);
      var s = e.type._context;
      s._currentValue = t;
    }
    function $A(e, t, s) {
      if (au(s, t))
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
    function QA(e, t, s, l) {
      var d = e.child;
      for (d !== null && (d.return = e); d !== null; ) {
        var p = void 0, w = d.dependencies;
        if (w !== null) {
          p = d.child;
          for (var b = w.firstContext; b !== null; ) {
            if (b.context === t && (b.observedBits & s) !== 0) {
              if (d.tag === ue) {
                var E = Go(l, null);
                E.tag = $m, Xo(d, E);
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
      Vm = e, rd = null, Hm = null;
      var s = e.dependencies;
      if (s !== null) {
        var l = s.firstContext;
        l !== null && (s.expirationTime >= t && Cw(), s.firstContext = null);
      }
    }
    function Ln(e, t) {
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
    var qx = 0, Kx = 1, $m = 2, wy = 3, Qm = !1, by, Zm;
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
        d === null ? t.next = t : (t.next = d.next, d.next = t), l.pending = t, Zm === l && !by && (g("An update (setState, replaceState, or forceUpdate) was scheduled from inside an update function. Update functions should be pure, with zero side-effects. Consider using componentDidUpdate or a callback."), by = !0);
      }
    }
    function e0(e, t) {
      var s = e.alternate;
      s !== null && xy(s, e);
      var l = e.updateQueue, d = l.baseQueue;
      d === null ? (l.baseQueue = t.next = t, t.next = t) : (t.next = d.next, d.next = t);
    }
    function ZA(e, t, s, l, d, p) {
      switch (s.tag) {
        case Kx: {
          var w = s.payload;
          if (typeof w == "function") {
            Yx(), e.mode & gn && w.call(p, l, d);
            var b = w.call(p, l, d);
            return Gx(), b;
          }
          return w;
        }
        case wy:
          e.effectTag = e.effectTag & ~mi | Ut;
        case qx: {
          var E = s.payload, N;
          return typeof E == "function" ? (Yx(), e.mode & gn && E.call(p, l, d), N = E.call(p, l, d), Gx()) : N = E, N == null ? l : i({}, l, N);
        }
        case $m:
          return Qm = !0, l;
      }
      return l;
    }
    function xh(e, t, s, l) {
      var d = e.updateQueue;
      Qm = !1, Zm = d.shared;
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
        var X = p.next, L = d.baseState, J = Ae, me = null, we = null, qe = null;
        if (X !== null) {
          var nt = X;
          do {
            var _t = nt.expirationTime;
            if (_t < l) {
              var vt = {
                expirationTime: nt.expirationTime,
                suspenseConfig: nt.suspenseConfig,
                tag: nt.tag,
                payload: nt.payload,
                callback: nt.callback,
                next: null
              };
              qe === null ? (we = qe = vt, me = L) : qe = qe.next = vt, _t > J && (J = _t);
            } else {
              if (qe !== null) {
                var $t = {
                  expirationTime: Ct,
                  suspenseConfig: nt.suspenseConfig,
                  tag: nt.tag,
                  payload: nt.payload,
                  callback: nt.callback,
                  next: null
                };
                qe = qe.next = $t;
              }
              SC(_t, nt.suspenseConfig), L = ZA(e, d, nt, L, t, s);
              var W = nt.callback;
              if (W !== null) {
                e.effectTag |= wf;
                var te = d.effects;
                te === null ? d.effects = [nt] : te.push(nt);
              }
            }
            if (nt = nt.next, nt === null || nt === X) {
              if (w = d.shared.pending, w === null)
                break;
              nt = p.next = w.next, w.next = X, d.baseQueue = p = w, d.shared.pending = null;
            }
          } while (!0);
        }
        qe === null ? me = L : qe.next = we, d.baseState = me, d.baseQueue = qe, zv(J), e.expirationTime = J, e.memoizedState = L;
      }
      Zm = null;
    }
    function YA(e, t) {
      if (typeof e != "function")
        throw Error("Invalid argument passed as callback. Expected a function. Instead received: " + e);
      e.call(t);
    }
    function t0() {
      Qm = !1;
    }
    function Ym() {
      return Qm;
    }
    function n0(e, t, s) {
      var l = t.effects;
      if (t.effects = null, l !== null)
        for (var d = 0; d < l.length; d++) {
          var p = l[d], w = p.callback;
          w !== null && (p.callback = null, YA(w, s));
        }
    }
    var GA = m.ReactCurrentBatchConfig;
    function Ch() {
      return GA.suspense;
    }
    var Cy = {}, XA = Array.isArray, i0 = new r.Component().refs, Ty, My, Ey, Iy, Ay, r0, Gm, Ry, Dy, Ny;
    {
      Ty = /* @__PURE__ */ new Set(), My = /* @__PURE__ */ new Set(), Ey = /* @__PURE__ */ new Set(), Iy = /* @__PURE__ */ new Set(), Ry = /* @__PURE__ */ new Set(), Ay = /* @__PURE__ */ new Set(), Dy = /* @__PURE__ */ new Set(), Ny = /* @__PURE__ */ new Set();
      var a0 = /* @__PURE__ */ new Set();
      Gm = function(e, t) {
        if (!(e === null || typeof e == "function")) {
          var s = t + "_" + e;
          a0.has(s) || (a0.add(s), g("%s(...): Expected the last optional `callback` argument to be a function. Instead received: %s.", t, e));
        }
      }, r0 = function(e, t) {
        if (t === void 0) {
          var s = Ce(e) || "Component";
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
      r0(t, p);
      var w = p == null ? d : i({}, d, p);
      if (e.memoizedState = w, e.expirationTime === Ae) {
        var b = e.updateQueue;
        b.baseState = w;
      }
    }
    var ky = {
      isMounted: Wa,
      enqueueSetState: function(e, t, s) {
        var l = ua(e), d = ps(), p = Ch(), w = Su(d, l, p), b = Go(w, p);
        b.payload = t, s != null && (Gm(s, "setState"), b.callback = s), Xo(l, b), Zr(l, w);
      },
      enqueueReplaceState: function(e, t, s) {
        var l = ua(e), d = ps(), p = Ch(), w = Su(d, l, p), b = Go(w, p);
        b.tag = Kx, b.payload = t, s != null && (Gm(s, "replaceState"), b.callback = s), Xo(l, b), Zr(l, w);
      },
      enqueueForceUpdate: function(e, t) {
        var s = ua(e), l = ps(), d = Ch(), p = Su(l, s, d), w = Go(p, d);
        w.tag = $m, t != null && (Gm(t, "forceUpdate"), w.callback = t), Xo(s, w), Zr(s, p);
      }
    };
    function s0(e, t, s, l, d, p, w) {
      var b = e.stateNode;
      if (typeof b.shouldComponentUpdate == "function") {
        e.mode & gn && b.shouldComponentUpdate(l, p, w), as(e, "shouldComponentUpdate");
        var E = b.shouldComponentUpdate(l, p, w);
        return ss(), E === void 0 && g("%s.shouldComponentUpdate(): Returned undefined instead of a boolean value. Make sure to return true or false.", Ce(t) || "Component"), E;
      }
      return t.prototype && t.prototype.isPureReactComponent ? !uh(s, l) || !uh(d, p) : !0;
    }
    function JA(e, t, s) {
      var l = e.stateNode;
      {
        var d = Ce(t) || "Component", p = l.render;
        p || (t.prototype && typeof t.prototype.render == "function" ? g("%s(...): No `render` method found on the returned component instance: did you accidentally return an object from the constructor?", d) : g("%s(...): No `render` method found on the returned component instance: you may have forgotten to define `render`.", d)), l.getInitialState && !l.getInitialState.isReactClassApproved && !l.state && g("getInitialState was defined on %s, a plain JavaScript class. This is only supported for classes created using React.createClass. Did you mean to define a state property instead?", d), l.getDefaultProps && !l.getDefaultProps.isReactClassApproved && g("getDefaultProps was defined on %s, a plain JavaScript class. This is only supported for classes created using React.createClass. Use a static property to define defaultProps instead.", d), l.propTypes && g("propTypes was defined as an instance property on %s. Use a static property to define propTypes instead.", d), l.contextType && g("contextType was defined as an instance property on %s. Use a static property to define contextType instead.", d), l.contextTypes && g("contextTypes was defined as an instance property on %s. Use a static property to define contextTypes instead.", d), t.contextType && t.contextTypes && !Dy.has(t) && (Dy.add(t), g("%s declares both contextTypes and contextType static properties. The legacy contextTypes property will be ignored.", d)), typeof l.componentShouldUpdate == "function" && g("%s has a method called componentShouldUpdate(). Did you mean shouldComponentUpdate()? The name is phrased as a question because the function is expected to return a value.", d), t.prototype && t.prototype.isPureReactComponent && typeof l.shouldComponentUpdate < "u" && g("%s has a method called shouldComponentUpdate(). shouldComponentUpdate should not be used when extending React.PureComponent. Please extend React.Component if shouldComponentUpdate is used.", Ce(t) || "A pure component"), typeof l.componentDidUnmount == "function" && g("%s has a method called componentDidUnmount(). But there is no such lifecycle method. Did you mean componentWillUnmount()?", d), typeof l.componentDidReceiveProps == "function" && g("%s has a method called componentDidReceiveProps(). But there is no such lifecycle method. If you meant to update the state in response to changing props, use componentWillReceiveProps(). If you meant to fetch data or run side-effects or mutations after React has updated the UI, use componentDidUpdate().", d), typeof l.componentWillRecieveProps == "function" && g("%s has a method called componentWillRecieveProps(). Did you mean componentWillReceiveProps()?", d), typeof l.UNSAFE_componentWillRecieveProps == "function" && g("%s has a method called UNSAFE_componentWillRecieveProps(). Did you mean UNSAFE_componentWillReceiveProps()?", d);
        var w = l.props !== s;
        l.props !== void 0 && w && g("%s(...): When calling super() in `%s`, make sure to pass up the same props that your component's constructor was passed.", d, d), l.defaultProps && g("Setting defaultProps as an instance property on %s is not supported and will be ignored. Instead, define defaultProps as a static property on %s.", d, d), typeof l.getSnapshotBeforeUpdate == "function" && typeof l.componentDidUpdate != "function" && !Ey.has(t) && (Ey.add(t), g("%s: getSnapshotBeforeUpdate() should be used with componentDidUpdate(). This component defines getSnapshotBeforeUpdate() only.", Ce(t))), typeof l.getDerivedStateFromProps == "function" && g("%s: getDerivedStateFromProps() is defined as an instance method and will be ignored. Instead, declare it as a static method.", d), typeof l.getDerivedStateFromError == "function" && g("%s: getDerivedStateFromError() is defined as an instance method and will be ignored. Instead, declare it as a static method.", d), typeof t.getSnapshotBeforeUpdate == "function" && g("%s: getSnapshotBeforeUpdate() is defined as a static method and will be ignored. Instead, declare it as an instance method.", d);
        var b = l.state;
        b && (typeof b != "object" || XA(b)) && g("%s.state: must be set to an object or null", d), typeof l.getChildContext == "function" && typeof t.childContextTypes != "object" && g("%s.getChildContext(): childContextTypes must be defined in order to use getChildContext().", d);
      }
    }
    function o0(e, t) {
      t.updater = ky, e.stateNode = t, Pp(t, e), t._reactInternalInstance = Cy;
    }
    function l0(e, t, s) {
      var l = !1, d = mr, p = mr, w = t.contextType;
      if ("contextType" in t) {
        var b = w === null || w !== void 0 && w.$$typeof === Sn && w._context === void 0;
        if (!b && !Ny.has(t)) {
          Ny.add(t);
          var E = "";
          w === void 0 ? E = " However, it is set to undefined. This can be caused by a typo or by mixing up named and default imports. This can also happen due to a circular dependency, so try moving the createContext() call to a separate file." : typeof w != "object" ? E = " However, it is set to a " + typeof w + "." : w.$$typeof === vn ? E = " Did you accidentally pass the Context.Provider instead?" : w._context !== void 0 ? E = " Did you accidentally pass the Context.Consumer instead?" : E = " However, it is set to an object with keys {" + Object.keys(w).join(", ") + "}.", g("%s defines an invalid contextType. contextType should point to the Context object returned by React.createContext().%s", Ce(t) || "Component", E);
        }
      }
      if (typeof w == "object" && w !== null)
        p = Ln(w);
      else {
        d = Jc(e, t, !0);
        var N = t.contextTypes;
        l = N != null, p = l ? qc(e, d) : mr;
      }
      e.mode & gn && new t(s, p);
      var k = new t(s, p), X = e.memoizedState = k.state !== null && k.state !== void 0 ? k.state : null;
      o0(e, k);
      {
        if (typeof t.getDerivedStateFromProps == "function" && X === null) {
          var L = Ce(t) || "Component";
          My.has(L) || (My.add(L), g("`%s` uses `getDerivedStateFromProps` but its initial state is %s. This is not recommended. Instead, define the initial state by assigning an object to `this.state` in the constructor of `%s`. This ensures that `getDerivedStateFromProps` arguments have a consistent shape.", L, k.state === null ? "null" : "undefined", L));
        }
        if (typeof t.getDerivedStateFromProps == "function" || typeof k.getSnapshotBeforeUpdate == "function") {
          var J = null, me = null, we = null;
          if (typeof k.componentWillMount == "function" && k.componentWillMount.__suppressDeprecationWarning !== !0 ? J = "componentWillMount" : typeof k.UNSAFE_componentWillMount == "function" && (J = "UNSAFE_componentWillMount"), typeof k.componentWillReceiveProps == "function" && k.componentWillReceiveProps.__suppressDeprecationWarning !== !0 ? me = "componentWillReceiveProps" : typeof k.UNSAFE_componentWillReceiveProps == "function" && (me = "UNSAFE_componentWillReceiveProps"), typeof k.componentWillUpdate == "function" && k.componentWillUpdate.__suppressDeprecationWarning !== !0 ? we = "componentWillUpdate" : typeof k.UNSAFE_componentWillUpdate == "function" && (we = "UNSAFE_componentWillUpdate"), J !== null || me !== null || we !== null) {
            var qe = Ce(t) || "Component", nt = typeof t.getDerivedStateFromProps == "function" ? "getDerivedStateFromProps()" : "getSnapshotBeforeUpdate()";
            Iy.has(qe) || (Iy.add(qe), g(`Unsafe legacy lifecycles will not be called for components using new component APIs.

%s uses %s but also contains the following legacy lifecycles:%s%s%s

The above lifecycles should be removed. Learn more about this warning here:
https://fb.me/react-unsafe-component-lifecycles`, qe, nt, J !== null ? `
  ` + J : "", me !== null ? `
  ` + me : "", we !== null ? `
  ` + we : ""));
          }
        }
      }
      return l && Cx(e, d, p), k;
    }
    function qA(e, t) {
      as(e, "componentWillMount");
      var s = t.state;
      typeof t.componentWillMount == "function" && t.componentWillMount(), typeof t.UNSAFE_componentWillMount == "function" && t.UNSAFE_componentWillMount(), ss(), s !== t.state && (g("%s.componentWillMount(): Assigning directly to this.state is deprecated (except inside a component's constructor). Use setState instead.", Ce(e.type) || "Component"), ky.enqueueReplaceState(t, t.state, null));
    }
    function u0(e, t, s, l) {
      var d = t.state;
      if (as(e, "componentWillReceiveProps"), typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(s, l), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(s, l), ss(), t.state !== d) {
        {
          var p = Ce(e.type) || "Component";
          Ty.has(p) || (Ty.add(p), g("%s.componentWillReceiveProps(): Assigning directly to this.state is deprecated (except inside a component's constructor). Use setState instead.", p));
        }
        ky.enqueueReplaceState(t, t.state, null);
      }
    }
    function Py(e, t, s, l) {
      JA(e, t, s);
      var d = e.stateNode;
      d.props = s, d.state = e.memoizedState, d.refs = i0, Sy(e);
      var p = t.contextType;
      if (typeof p == "object" && p !== null)
        d.context = Ln(p);
      else {
        var w = Jc(e, t, !0);
        d.context = qc(e, w);
      }
      {
        if (d.state === s) {
          var b = Ce(t) || "Component";
          Ry.has(b) || (Ry.add(b), g("%s: It is not recommended to assign props directly to state because updates to props won't be reflected in state. In most cases, it is better to use props directly.", b));
        }
        e.mode & gn && pa.recordLegacyContextWarning(e, d), pa.recordUnsafeLifecycleWarnings(e, d);
      }
      xh(e, s, d, l), d.state = e.memoizedState;
      var E = t.getDerivedStateFromProps;
      typeof E == "function" && (Xm(e, t, E, s), d.state = e.memoizedState), typeof t.getDerivedStateFromProps != "function" && typeof d.getSnapshotBeforeUpdate != "function" && (typeof d.UNSAFE_componentWillMount == "function" || typeof d.componentWillMount == "function") && (qA(e, d), xh(e, s, d, l), d.state = e.memoizedState), typeof d.componentDidMount == "function" && (e.effectTag |= xt);
    }
    function KA(e, t, s, l) {
      var d = e.stateNode, p = e.memoizedProps;
      d.props = p;
      var w = d.context, b = t.contextType, E = mr;
      if (typeof b == "object" && b !== null)
        E = Ln(b);
      else {
        var N = Jc(e, t, !0);
        E = qc(e, N);
      }
      var k = t.getDerivedStateFromProps, X = typeof k == "function" || typeof d.getSnapshotBeforeUpdate == "function";
      !X && (typeof d.UNSAFE_componentWillReceiveProps == "function" || typeof d.componentWillReceiveProps == "function") && (p !== s || w !== E) && u0(e, d, s, E), t0();
      var L = e.memoizedState, J = d.state = L;
      if (xh(e, s, d, l), J = e.memoizedState, p === s && L === J && !Pm() && !Ym())
        return typeof d.componentDidMount == "function" && (e.effectTag |= xt), !1;
      typeof k == "function" && (Xm(e, t, k, s), J = e.memoizedState);
      var me = Ym() || s0(e, t, p, s, L, J, E);
      return me ? (!X && (typeof d.UNSAFE_componentWillMount == "function" || typeof d.componentWillMount == "function") && (as(e, "componentWillMount"), typeof d.componentWillMount == "function" && d.componentWillMount(), typeof d.UNSAFE_componentWillMount == "function" && d.UNSAFE_componentWillMount(), ss()), typeof d.componentDidMount == "function" && (e.effectTag |= xt)) : (typeof d.componentDidMount == "function" && (e.effectTag |= xt), e.memoizedProps = s, e.memoizedState = J), d.props = s, d.state = J, d.context = E, me;
    }
    function e1(e, t, s, l, d) {
      var p = t.stateNode;
      xy(e, t);
      var w = t.memoizedProps;
      p.props = t.type === t.elementType ? w : ma(t.type, w);
      var b = p.context, E = s.contextType, N = mr;
      if (typeof E == "object" && E !== null)
        N = Ln(E);
      else {
        var k = Jc(t, s, !0);
        N = qc(t, k);
      }
      var X = s.getDerivedStateFromProps, L = typeof X == "function" || typeof p.getSnapshotBeforeUpdate == "function";
      !L && (typeof p.UNSAFE_componentWillReceiveProps == "function" || typeof p.componentWillReceiveProps == "function") && (w !== l || b !== N) && u0(t, p, l, N), t0();
      var J = t.memoizedState, me = p.state = J;
      if (xh(t, l, p, d), me = t.memoizedState, w === l && J === me && !Pm() && !Ym())
        return typeof p.componentDidUpdate == "function" && (w !== e.memoizedProps || J !== e.memoizedState) && (t.effectTag |= xt), typeof p.getSnapshotBeforeUpdate == "function" && (w !== e.memoizedProps || J !== e.memoizedState) && (t.effectTag |= Ua), !1;
      typeof X == "function" && (Xm(t, s, X, l), me = t.memoizedState);
      var we = Ym() || s0(t, s, w, l, J, me, N);
      return we ? (!L && (typeof p.UNSAFE_componentWillUpdate == "function" || typeof p.componentWillUpdate == "function") && (as(t, "componentWillUpdate"), typeof p.componentWillUpdate == "function" && p.componentWillUpdate(l, me, N), typeof p.UNSAFE_componentWillUpdate == "function" && p.UNSAFE_componentWillUpdate(l, me, N), ss()), typeof p.componentDidUpdate == "function" && (t.effectTag |= xt), typeof p.getSnapshotBeforeUpdate == "function" && (t.effectTag |= Ua)) : (typeof p.componentDidUpdate == "function" && (w !== e.memoizedProps || J !== e.memoizedState) && (t.effectTag |= xt), typeof p.getSnapshotBeforeUpdate == "function" && (w !== e.memoizedProps || J !== e.memoizedState) && (t.effectTag |= Ua), t.memoizedProps = l, t.memoizedState = me), p.props = l, p.state = me, p.context = N, we;
    }
    var _y, zy, Oy, Ly, By, c0 = function(e) {
    };
    _y = !1, zy = !1, Oy = {}, Ly = {}, By = {}, c0 = function(e) {
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
        if ((e.mode & gn || qn) && !(s._owner && s._self && s._owner.stateNode !== s._self)) {
          var d = Ce(e.type) || "Component";
          Oy[d] || (g('A string ref, "%s", has been found within a strict mode tree. String refs are a source of potential bugs and should be avoided. We recommend using useRef() or createRef() instead. Learn more about using refs safely here: https://fb.me/react-strict-mode-string-ref%s', l, Fn(e)), Oy[d] = !0);
        }
        if (s._owner) {
          var p = s._owner, w;
          if (p) {
            var b = p;
            if (b.tag !== ue)
              throw Error("Function components cannot have string refs. We recommend using useRef() instead. Learn more about using refs safely here: https://fb.me/react-strict-mode-string-ref");
            w = b.stateNode;
          }
          if (!w)
            throw Error("Missing owner for string ref " + l + ". This error is likely caused by a bug in React. Please file an issue.");
          var E = "" + l;
          if (t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === E)
            return t.ref;
          var N = function(k) {
            var X = w.refs;
            X === i0 && (X = w.refs = {}), k === null ? delete X[E] : X[E] = k;
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
    function d0(e) {
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
        for (var j = /* @__PURE__ */ new Map(), ve = te; ve !== null; )
          ve.key !== null ? j.set(ve.key, ve) : j.set(ve.index, ve), ve = ve.sibling;
        return j;
      }
      function d(W, te) {
        var j = Eu(W, te);
        return j.index = 0, j.sibling = null, j;
      }
      function p(W, te, j) {
        if (W.index = j, !e)
          return te;
        var ve = W.alternate;
        if (ve !== null) {
          var pe = ve.index;
          return pe < te ? (W.effectTag = xn, te) : pe;
        } else
          return W.effectTag = xn, te;
      }
      function w(W) {
        return e && W.alternate === null && (W.effectTag = xn), W;
      }
      function b(W, te, j, ve) {
        if (te === null || te.tag !== Fe) {
          var pe = qw(j, W.mode, ve);
          return pe.return = W, pe;
        } else {
          var Me = d(te, j);
          return Me.return = W, Me;
        }
      }
      function E(W, te, j, ve) {
        if (te !== null && (te.elementType === j.type || Qx(te, j))) {
          var pe = d(te, j.props);
          return pe.ref = Th(W, te, j), pe.return = W, pe._debugSource = j._source, pe._debugOwner = j._owner, pe;
        }
        var Me = Jw(j, W.mode, ve);
        return Me.ref = Th(W, te, j), Me.return = W, Me;
      }
      function N(W, te, j, ve) {
        if (te === null || te.tag !== Ve || te.stateNode.containerInfo !== j.containerInfo || te.stateNode.implementation !== j.implementation) {
          var pe = Kw(j, W.mode, ve);
          return pe.return = W, pe;
        } else {
          var Me = d(te, j.children || []);
          return Me.return = W, Me;
        }
      }
      function k(W, te, j, ve, pe) {
        if (te === null || te.tag !== Tt) {
          var Me = il(j, W.mode, ve, pe);
          return Me.return = W, Me;
        } else {
          var yt = d(te, j);
          return yt.return = W, yt;
        }
      }
      function X(W, te, j) {
        if (typeof te == "string" || typeof te == "number") {
          var ve = qw("" + te, W.mode, j);
          return ve.return = W, ve;
        }
        if (typeof te == "object" && te !== null) {
          switch (te.$$typeof) {
            case Se: {
              var pe = Jw(te, W.mode, j);
              return pe.ref = Th(W, null, te), pe.return = W, pe;
            }
            case Ze: {
              var Me = Kw(te, W.mode, j);
              return Me.return = W, Me;
            }
          }
          if (Jm(te) || Dr(te)) {
            var yt = il(te, W.mode, j, null);
            return yt.return = W, yt;
          }
          qm(W, te);
        }
        return typeof te == "function" && Km(), null;
      }
      function L(W, te, j, ve) {
        var pe = te !== null ? te.key : null;
        if (typeof j == "string" || typeof j == "number")
          return pe !== null ? null : b(W, te, "" + j, ve);
        if (typeof j == "object" && j !== null) {
          switch (j.$$typeof) {
            case Se:
              return j.key === pe ? j.type === Be ? k(W, te, j.props.children, ve, pe) : E(W, te, j, ve) : null;
            case Ze:
              return j.key === pe ? N(W, te, j, ve) : null;
          }
          if (Jm(j) || Dr(j))
            return pe !== null ? null : k(W, te, j, ve, null);
          qm(W, j);
        }
        return typeof j == "function" && Km(), null;
      }
      function J(W, te, j, ve, pe) {
        if (typeof ve == "string" || typeof ve == "number") {
          var Me = W.get(j) || null;
          return b(te, Me, "" + ve, pe);
        }
        if (typeof ve == "object" && ve !== null) {
          switch (ve.$$typeof) {
            case Se: {
              var yt = W.get(ve.key === null ? j : ve.key) || null;
              return ve.type === Be ? k(te, yt, ve.props.children, pe, ve.key) : E(te, yt, ve, pe);
            }
            case Ze: {
              var It = W.get(ve.key === null ? j : ve.key) || null;
              return N(te, It, ve, pe);
            }
          }
          if (Jm(ve) || Dr(ve)) {
            var Ht = W.get(j) || null;
            return k(te, Ht, ve, pe, null);
          }
          qm(te, ve);
        }
        return typeof ve == "function" && Km(), null;
      }
      function me(W, te) {
        {
          if (typeof W != "object" || W === null)
            return te;
          switch (W.$$typeof) {
            case Se:
            case Ze:
              c0(W);
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
      function we(W, te, j, ve) {
        for (var pe = null, Me = 0; Me < j.length; Me++) {
          var yt = j[Me];
          pe = me(yt, pe);
        }
        for (var It = null, Ht = null, At = te, zt = 0, Rt = 0, cn = null; At !== null && Rt < j.length; Rt++) {
          At.index > Rt ? (cn = At, At = null) : cn = At.sibling;
          var In = L(W, At, j[Rt], ve);
          if (In === null) {
            At === null && (At = cn);
            break;
          }
          e && At && In.alternate === null && t(W, At), zt = p(In, zt, Rt), Ht === null ? It = In : Ht.sibling = In, Ht = In, At = cn;
        }
        if (Rt === j.length)
          return s(W, At), It;
        if (At === null) {
          for (; Rt < j.length; Rt++) {
            var An = X(W, j[Rt], ve);
            An !== null && (zt = p(An, zt, Rt), Ht === null ? It = An : Ht.sibling = An, Ht = An);
          }
          return It;
        }
        for (var bi = l(W, At); Rt < j.length; Rt++) {
          var tn = J(bi, W, Rt, j[Rt], ve);
          tn !== null && (e && tn.alternate !== null && bi.delete(tn.key === null ? Rt : tn.key), zt = p(tn, zt, Rt), Ht === null ? It = tn : Ht.sibling = tn, Ht = tn);
        }
        return e && bi.forEach(function(Bi) {
          return t(W, Bi);
        }), It;
      }
      function qe(W, te, j, ve) {
        var pe = Dr(j);
        if (typeof pe != "function")
          throw Error("An object is not an iterable. This error is likely caused by a bug in React. Please file an issue.");
        {
          typeof Symbol == "function" && j[Symbol.toStringTag] === "Generator" && (zy || g("Using Generators as children is unsupported and will likely yield unexpected results because enumerating a generator mutates it. You may convert it to an array with `Array.from()` or the `[...spread]` operator before rendering. Keep in mind you might need to polyfill these features for older browsers."), zy = !0), j.entries === pe && (_y || g("Using Maps as children is unsupported and will likely yield unexpected results. Convert it to a sequence/iterable of keyed ReactElements instead."), _y = !0);
          var Me = pe.call(j);
          if (Me)
            for (var yt = null, It = Me.next(); !It.done; It = Me.next()) {
              var Ht = It.value;
              yt = me(Ht, yt);
            }
        }
        var At = pe.call(j);
        if (At == null)
          throw Error("An iterable object provided no iterator.");
        for (var zt = null, Rt = null, cn = te, In = 0, An = 0, bi = null, tn = At.next(); cn !== null && !tn.done; An++, tn = At.next()) {
          cn.index > An ? (bi = cn, cn = null) : bi = cn.sibling;
          var Bi = L(W, cn, tn.value, ve);
          if (Bi === null) {
            cn === null && (cn = bi);
            break;
          }
          e && cn && Bi.alternate === null && t(W, cn), In = p(Bi, In, An), Rt === null ? zt = Bi : Rt.sibling = Bi, Rt = Bi, cn = bi;
        }
        if (tn.done)
          return s(W, cn), zt;
        if (cn === null) {
          for (; !tn.done; An++, tn = At.next()) {
            var wa = X(W, tn.value, ve);
            wa !== null && (In = p(wa, In, An), Rt === null ? zt = wa : Rt.sibling = wa, Rt = wa);
          }
          return zt;
        }
        for (var sb = l(W, cn); !tn.done; An++, tn = At.next()) {
          var rl = J(sb, W, An, tn.value, ve);
          rl !== null && (e && rl.alternate !== null && sb.delete(rl.key === null ? An : rl.key), In = p(rl, In, An), Rt === null ? zt = rl : Rt.sibling = rl, Rt = rl);
        }
        return e && sb.forEach(function(BD) {
          return t(W, BD);
        }), zt;
      }
      function nt(W, te, j, ve) {
        if (te !== null && te.tag === Fe) {
          s(W, te.sibling);
          var pe = d(te, j);
          return pe.return = W, pe;
        }
        s(W, te);
        var Me = qw(j, W.mode, ve);
        return Me.return = W, Me;
      }
      function _t(W, te, j, ve) {
        for (var pe = j.key, Me = te; Me !== null; ) {
          if (Me.key === pe) {
            switch (Me.tag) {
              case Tt: {
                if (j.type === Be) {
                  s(W, Me.sibling);
                  var yt = d(Me, j.props.children);
                  return yt.return = W, yt._debugSource = j._source, yt._debugOwner = j._owner, yt;
                }
                break;
              }
              case Mt:
              default: {
                if (Me.elementType === j.type || Qx(Me, j)) {
                  s(W, Me.sibling);
                  var It = d(Me, j.props);
                  return It.ref = Th(W, Me, j), It.return = W, It._debugSource = j._source, It._debugOwner = j._owner, It;
                }
                break;
              }
            }
            s(W, Me);
            break;
          } else
            t(W, Me);
          Me = Me.sibling;
        }
        if (j.type === Be) {
          var Ht = il(j.props.children, W.mode, ve, j.key);
          return Ht.return = W, Ht;
        } else {
          var At = Jw(j, W.mode, ve);
          return At.ref = Th(W, te, j), At.return = W, At;
        }
      }
      function vt(W, te, j, ve) {
        for (var pe = j.key, Me = te; Me !== null; ) {
          if (Me.key === pe)
            if (Me.tag === Ve && Me.stateNode.containerInfo === j.containerInfo && Me.stateNode.implementation === j.implementation) {
              s(W, Me.sibling);
              var yt = d(Me, j.children || []);
              return yt.return = W, yt;
            } else {
              s(W, Me);
              break;
            }
          else
            t(W, Me);
          Me = Me.sibling;
        }
        var It = Kw(j, W.mode, ve);
        return It.return = W, It;
      }
      function $t(W, te, j, ve) {
        var pe = typeof j == "object" && j !== null && j.type === Be && j.key === null;
        pe && (j = j.props.children);
        var Me = typeof j == "object" && j !== null;
        if (Me)
          switch (j.$$typeof) {
            case Se:
              return w(_t(W, te, j, ve));
            case Ze:
              return w(vt(W, te, j, ve));
          }
        if (typeof j == "string" || typeof j == "number")
          return w(nt(W, te, "" + j, ve));
        if (Jm(j))
          return we(W, te, j, ve);
        if (Dr(j))
          return qe(W, te, j, ve);
        if (Me && qm(W, j), typeof j == "function" && Km(), typeof j > "u" && !pe)
          switch (W.tag) {
            case ue: {
              var yt = W.stateNode;
              if (yt.render._isMockFunction)
                break;
            }
            case _e: {
              var It = W.type;
              throw Error((It.displayName || It.name || "Component") + "(...): Nothing was returned from render. This usually means a return statement is missing. Or, to render nothing, return null.");
            }
          }
        return s(W, te);
      }
      return $t;
    }
    var sd = d0(!0), jy = d0(!1);
    function t1(e, t) {
      if (!(e === null || t.child === e.child))
        throw Error("Resuming work not yet implemented.");
      if (t.child !== null) {
        var s = t.child, l = Eu(s, s.pendingProps);
        for (t.child = l, l.return = t; s.sibling !== null; )
          s = s.sibling, l = l.sibling = Eu(s, s.pendingProps), l.return = t;
        l.sibling = null;
      }
    }
    function n1(e, t) {
      for (var s = e.child; s !== null; )
        aD(s, t), s = s.sibling;
    }
    var Mh = {}, Jo = lu(Mh), Eh = lu(Mh), ev = lu(Mh);
    function tv(e) {
      if (e === Mh)
        throw Error("Expected host context to exist. This error is likely caused by a bug in React. Please file an issue.");
      return e;
    }
    function f0() {
      var e = tv(ev.current);
      return e;
    }
    function Uy(e, t) {
      Oi(ev, t, e), Oi(Eh, e, e), Oi(Jo, Mh, e);
      var s = Bg(t);
      zi(Jo, e), Oi(Jo, s, e);
    }
    function od(e) {
      zi(Jo, e), zi(Eh, e), zi(ev, e);
    }
    function Vy() {
      var e = tv(Jo.current);
      return e;
    }
    function h0(e) {
      tv(ev.current);
      var t = tv(Jo.current), s = bm(t, e.type);
      t !== s && (Oi(Eh, e, e), Oi(Jo, s, e));
    }
    function Hy(e) {
      Eh.current === e && (zi(Jo, e), zi(Eh, e));
    }
    var i1 = 0, p0 = 1, Wy = 1, Ih = 2, va = lu(i1);
    function nv(e, t) {
      return (e & t) !== 0;
    }
    function Ah(e) {
      return e & p0;
    }
    function Fy(e, t) {
      return e & p0 | t;
    }
    function r1(e, t) {
      return e | t;
    }
    function hu(e, t) {
      Oi(va, t, e);
    }
    function ld(e) {
      zi(va, e);
    }
    function a1(e, t) {
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
            if (l === null || HE(l) || WE(l))
              return t;
          }
        } else if (t.tag === dt && t.memoizedProps.revealOrder !== void 0) {
          var d = (t.effectTag & Ut) !== Pt;
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
    var ud = 1, cd = 2, rv = 4, Ie = m.ReactCurrentDispatcher, Fr = m.ReactCurrentBatchConfig, $y;
    $y = /* @__PURE__ */ new Set();
    var qo = Ae, Cn = null, wi = null, li = null, av = !1, s1 = 25, ae = null, $r = null, Ko = -1, Qy = !1;
    function en() {
      {
        var e = ae;
        $r === null ? $r = [e] : $r.push(e);
      }
    }
    function Pe() {
      {
        var e = ae;
        $r !== null && (Ko++, $r[Ko] !== e && o1(e));
      }
    }
    function Rh(e) {
      e != null && !Array.isArray(e) && g("%s received a final argument that is not an array (instead, received `%s`). When specified, the final argument must be an array.", ae, typeof e);
    }
    function o1(e) {
      {
        var t = Ce(Cn.type);
        if (!$y.has(t) && ($y.add(t), $r !== null)) {
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
      qo = p, Cn = t, $r = e !== null ? e._debugHookTypes : null, Ko = -1, Qy = e !== null && e.type !== t.type, t.memoizedState = null, t.updateQueue = null, t.expirationTime = Ae, e !== null && e.memoizedState !== null ? Ie.current = M0 : $r !== null ? Ie.current = T0 : Ie.current = C0;
      var w = s(l, d);
      if (t.expirationTime === qo) {
        var b = 0;
        do {
          if (t.expirationTime = Ae, !(b < s1))
            throw Error("Too many re-renders. React limits the number of renders to prevent an infinite loop.");
          b += 1, Qy = !1, wi = null, li = null, t.updateQueue = null, Ko = -1, Ie.current = E0, w = s(l, d);
        } while (t.expirationTime === qo);
      }
      Ie.current = mv, t._debugHookTypes = $r;
      var E = wi !== null && wi.next !== null;
      if (qo = Ae, Cn = null, wi = null, li = null, ae = null, $r = null, Ko = -1, av = !1, E)
        throw Error("Rendered fewer hooks than expected. This may be caused by an accidental early return statement.");
      return w;
    }
    function m0(e, t, s) {
      t.updateQueue = e.updateQueue, t.effectTag &= ~(Va | xt), e.expirationTime <= s && (e.expirationTime = Ae);
    }
    function v0() {
      if (Ie.current = mv, av)
        for (var e = Cn.memoizedState; e !== null; ) {
          var t = e.queue;
          t !== null && (t.pending = null), e = e.next;
        }
      qo = Ae, Cn = null, wi = null, li = null, $r = null, Ko = -1, ae = null, av = !1;
    }
    function fd() {
      var e = {
        memoizedState: null,
        baseState: null,
        baseQueue: null,
        queue: null,
        next: null
      };
      return li === null ? Cn.memoizedState = li = e : li = li.next = e, li;
    }
    function hd() {
      var e;
      if (wi === null) {
        var t = Cn.alternate;
        t !== null ? e = t.memoizedState : e = null;
      } else
        e = wi.next;
      var s;
      if (li === null ? s = Cn.memoizedState : s = li.next, s !== null)
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
        li === null ? Cn.memoizedState = li = l : li = li.next = l;
      }
      return li;
    }
    function l1() {
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
      }, w = p.dispatch = x0.bind(null, Cn, p);
      return [l.memoizedState, w];
    }
    function Xy(e, t, s) {
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
        var k = w.next, X = p.baseState, L = null, J = null, me = null, we = k;
        do {
          var qe = we.expirationTime;
          if (qe < qo) {
            var nt = {
              expirationTime: we.expirationTime,
              suspenseConfig: we.suspenseConfig,
              action: we.action,
              eagerReducer: we.eagerReducer,
              eagerState: we.eagerState,
              next: null
            };
            me === null ? (J = me = nt, L = X) : me = me.next = nt, qe > Cn.expirationTime && (Cn.expirationTime = qe, zv(qe));
          } else {
            if (me !== null) {
              var _t = {
                expirationTime: Ct,
                suspenseConfig: we.suspenseConfig,
                action: we.action,
                eagerReducer: we.eagerReducer,
                eagerState: we.eagerState,
                next: null
              };
              me = me.next = _t;
            }
            if (SC(qe, we.suspenseConfig), we.eagerReducer === e)
              X = we.eagerState;
            else {
              var vt = we.action;
              X = e(X, vt);
            }
          }
          we = we.next;
        } while (we !== null && we !== k);
        me === null ? L = X : me.next = J, au(X, l.memoizedState) || Cw(), l.memoizedState = X, l.baseState = L, l.baseQueue = me, d.lastRenderedState = X;
      }
      var $t = d.dispatch;
      return [l.memoizedState, $t];
    }
    function Jy(e, t, s) {
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
      }, l = s.dispatch = x0.bind(null, Cn, s);
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
      }, p = Cn.updateQueue;
      if (p === null)
        p = l1(), Cn.updateQueue = p, p.lastEffect = d.next = d;
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
      Cn.effectTag |= e, d.memoizedState = qy(ud | t, s, void 0, p);
    }
    function tw(e, t, s, l) {
      var d = hd(), p = l === void 0 ? null : l, w = void 0;
      if (wi !== null) {
        var b = wi.memoizedState;
        if (w = b.destroy, p !== null) {
          var E = b.deps;
          if (Zy(p, E)) {
            qy(t, s, w, p);
            return;
          }
        }
      }
      Cn.effectTag |= e, d.memoizedState = qy(ud | t, s, w, p);
    }
    function uv(e, t) {
      return typeof jest < "u" && RC(Cn), ew(xt | Va, rv, e, t);
    }
    function pd(e, t) {
      return typeof jest < "u" && RC(Cn), tw(xt | Va, rv, e, t);
    }
    function nw(e, t) {
      return ew(xt, cd, e, t);
    }
    function cv(e, t) {
      return tw(xt, cd, e, t);
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
    function iw(e, t, s) {
      typeof t != "function" && g("Expected useImperativeHandle() second argument to be a function that creates a handle. Instead received: %s.", t !== null ? typeof t : "null");
      var l = s != null ? s.concat([e]) : null;
      return ew(xt, cd, g0.bind(null, t, e), l);
    }
    function dv(e, t, s) {
      typeof t != "function" && g("Expected useImperativeHandle() second argument to be a function that creates a handle. Instead received: %s.", t !== null ? typeof t : "null");
      var l = s != null ? s.concat([e]) : null;
      return tw(xt, cd, g0.bind(null, t, e), l);
    }
    function u1(e, t) {
    }
    var fv = u1;
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
      var w = e();
      return s.memoizedState = [w, l], w;
    }
    function aw(e, t) {
      var s = Dh(e), l = s[0], d = s[1];
      return uv(function() {
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
      var s = sv(), l = s[0], d = s[1];
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
    function sw(e, t, s) {
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
    function ow(e) {
      var t = Dh(!1), s = t[0], l = t[1], d = hv(sw.bind(null, l, e), [l, e]);
      return [d, s];
    }
    function b0(e) {
      var t = sv(), s = t[0], l = t[1], d = md(sw.bind(null, l, e), [l, e]);
      return [d, s];
    }
    function S0(e) {
      var t = ov(), s = t[0], l = t[1], d = md(sw.bind(null, l, e), [l, e]);
      return [d, s];
    }
    function x0(e, t, s) {
      typeof arguments[3] == "function" && g("State updates from the useState() and useReducer() Hooks don't support the second callback argument. To execute a side effect after rendering, declare it in the component body with useEffect().");
      var l = ps(), d = Ch(), p = Su(l, e, d), w = {
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
      if (e === Cn || E !== null && E === Cn)
        av = !0, w.expirationTime = qo, Cn.expirationTime = qo;
      else {
        if (e.expirationTime === Ae && (E === null || E.expirationTime === Ae)) {
          var N = t.lastRenderedReducer;
          if (N !== null) {
            var k;
            k = Ie.current, Ie.current = ga;
            try {
              var X = t.lastRenderedState, L = N(X, s);
              if (w.eagerReducer = N, w.eagerState = L, au(L, X))
                return;
            } catch {
            } finally {
              Ie.current = k;
            }
          }
        }
        typeof jest < "u" && (AC(e), QR(e)), Zr(e, p);
      }
    }
    var mv = {
      readContext: Ln,
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
    }, C0 = null, T0 = null, M0 = null, E0 = null, fs = null, ga = null, vv = null;
    {
      var lw = function() {
        g("Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo().");
      }, ht = function() {
        g("Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. You can only call Hooks at the top level of your React function. For more information, see https://fb.me/rules-of-hooks");
      };
      C0 = {
        readContext: function(e, t) {
          return Ln(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", en(), Rh(t), hv(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", en(), Ln(e, t);
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
          var s = Ie.current;
          Ie.current = fs;
          try {
            return rw(e, t);
          } finally {
            Ie.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", en();
          var l = Ie.current;
          Ie.current = fs;
          try {
            return Gy(e, t, s);
          } finally {
            Ie.current = l;
          }
        },
        useRef: function(e) {
          return ae = "useRef", en(), Ky(e);
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
          return ae = "useResponder", en(), pu(e, t);
        },
        useDeferredValue: function(e, t) {
          return ae = "useDeferredValue", en(), aw(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", en(), ow(e);
        }
      }, T0 = {
        readContext: function(e, t) {
          return Ln(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", Pe(), hv(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", Pe(), Ln(e, t);
        },
        useEffect: function(e, t) {
          return ae = "useEffect", Pe(), uv(e, t);
        },
        useImperativeHandle: function(e, t, s) {
          return ae = "useImperativeHandle", Pe(), iw(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", Pe(), nw(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", Pe();
          var s = Ie.current;
          Ie.current = fs;
          try {
            return rw(e, t);
          } finally {
            Ie.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", Pe();
          var l = Ie.current;
          Ie.current = fs;
          try {
            return Gy(e, t, s);
          } finally {
            Ie.current = l;
          }
        },
        useRef: function(e) {
          return ae = "useRef", Pe(), Ky(e);
        },
        useState: function(e) {
          ae = "useState", Pe();
          var t = Ie.current;
          Ie.current = fs;
          try {
            return Dh(e);
          } finally {
            Ie.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return ae = "useDebugValue", Pe(), void 0;
        },
        useResponder: function(e, t) {
          return ae = "useResponder", Pe(), pu(e, t);
        },
        useDeferredValue: function(e, t) {
          return ae = "useDeferredValue", Pe(), aw(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", Pe(), ow(e);
        }
      }, M0 = {
        readContext: function(e, t) {
          return Ln(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", Pe(), md(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", Pe(), Ln(e, t);
        },
        useEffect: function(e, t) {
          return ae = "useEffect", Pe(), pd(e, t);
        },
        useImperativeHandle: function(e, t, s) {
          return ae = "useImperativeHandle", Pe(), dv(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", Pe(), cv(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", Pe();
          var s = Ie.current;
          Ie.current = ga;
          try {
            return pv(e, t);
          } finally {
            Ie.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", Pe();
          var l = Ie.current;
          Ie.current = ga;
          try {
            return Xy(e, t, s);
          } finally {
            Ie.current = l;
          }
        },
        useRef: function(e) {
          return ae = "useRef", Pe(), lv();
        },
        useState: function(e) {
          ae = "useState", Pe();
          var t = Ie.current;
          Ie.current = ga;
          try {
            return sv(e);
          } finally {
            Ie.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return ae = "useDebugValue", Pe(), fv();
        },
        useResponder: function(e, t) {
          return ae = "useResponder", Pe(), pu(e, t);
        },
        useDeferredValue: function(e, t) {
          return ae = "useDeferredValue", Pe(), y0(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", Pe(), b0(e);
        }
      }, E0 = {
        readContext: function(e, t) {
          return Ln(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", Pe(), md(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", Pe(), Ln(e, t);
        },
        useEffect: function(e, t) {
          return ae = "useEffect", Pe(), pd(e, t);
        },
        useImperativeHandle: function(e, t, s) {
          return ae = "useImperativeHandle", Pe(), dv(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", Pe(), cv(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", Pe();
          var s = Ie.current;
          Ie.current = vv;
          try {
            return pv(e, t);
          } finally {
            Ie.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", Pe();
          var l = Ie.current;
          Ie.current = vv;
          try {
            return Jy(e, t, s);
          } finally {
            Ie.current = l;
          }
        },
        useRef: function(e) {
          return ae = "useRef", Pe(), lv();
        },
        useState: function(e) {
          ae = "useState", Pe();
          var t = Ie.current;
          Ie.current = vv;
          try {
            return ov(e);
          } finally {
            Ie.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return ae = "useDebugValue", Pe(), fv();
        },
        useResponder: function(e, t) {
          return ae = "useResponder", Pe(), pu(e, t);
        },
        useDeferredValue: function(e, t) {
          return ae = "useDeferredValue", Pe(), w0(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", Pe(), S0(e);
        }
      }, fs = {
        readContext: function(e, t) {
          return lw(), Ln(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", ht(), en(), hv(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", ht(), en(), Ln(e, t);
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
          var s = Ie.current;
          Ie.current = fs;
          try {
            return rw(e, t);
          } finally {
            Ie.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", ht(), en();
          var l = Ie.current;
          Ie.current = fs;
          try {
            return Gy(e, t, s);
          } finally {
            Ie.current = l;
          }
        },
        useRef: function(e) {
          return ae = "useRef", ht(), en(), Ky(e);
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
          return lw(), Ln(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", ht(), Pe(), md(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", ht(), Pe(), Ln(e, t);
        },
        useEffect: function(e, t) {
          return ae = "useEffect", ht(), Pe(), pd(e, t);
        },
        useImperativeHandle: function(e, t, s) {
          return ae = "useImperativeHandle", ht(), Pe(), dv(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", ht(), Pe(), cv(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", ht(), Pe();
          var s = Ie.current;
          Ie.current = ga;
          try {
            return pv(e, t);
          } finally {
            Ie.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", ht(), Pe();
          var l = Ie.current;
          Ie.current = ga;
          try {
            return Xy(e, t, s);
          } finally {
            Ie.current = l;
          }
        },
        useRef: function(e) {
          return ae = "useRef", ht(), Pe(), lv();
        },
        useState: function(e) {
          ae = "useState", ht(), Pe();
          var t = Ie.current;
          Ie.current = ga;
          try {
            return sv(e);
          } finally {
            Ie.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return ae = "useDebugValue", ht(), Pe(), fv();
        },
        useResponder: function(e, t) {
          return ae = "useResponder", ht(), Pe(), pu(e, t);
        },
        useDeferredValue: function(e, t) {
          return ae = "useDeferredValue", ht(), Pe(), y0(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", ht(), Pe(), b0(e);
        }
      }, vv = {
        readContext: function(e, t) {
          return lw(), Ln(e, t);
        },
        useCallback: function(e, t) {
          return ae = "useCallback", ht(), Pe(), md(e, t);
        },
        useContext: function(e, t) {
          return ae = "useContext", ht(), Pe(), Ln(e, t);
        },
        useEffect: function(e, t) {
          return ae = "useEffect", ht(), Pe(), pd(e, t);
        },
        useImperativeHandle: function(e, t, s) {
          return ae = "useImperativeHandle", ht(), Pe(), dv(e, t, s);
        },
        useLayoutEffect: function(e, t) {
          return ae = "useLayoutEffect", ht(), Pe(), cv(e, t);
        },
        useMemo: function(e, t) {
          ae = "useMemo", ht(), Pe();
          var s = Ie.current;
          Ie.current = ga;
          try {
            return pv(e, t);
          } finally {
            Ie.current = s;
          }
        },
        useReducer: function(e, t, s) {
          ae = "useReducer", ht(), Pe();
          var l = Ie.current;
          Ie.current = ga;
          try {
            return Jy(e, t, s);
          } finally {
            Ie.current = l;
          }
        },
        useRef: function(e) {
          return ae = "useRef", ht(), Pe(), lv();
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
          return ae = "useDebugValue", ht(), Pe(), fv();
        },
        useResponder: function(e, t) {
          return ae = "useResponder", ht(), Pe(), pu(e, t);
        },
        useDeferredValue: function(e, t) {
          return ae = "useDeferredValue", ht(), Pe(), w0(e, t);
        },
        useTransition: function(e) {
          return ae = "useTransition", ht(), Pe(), S0(e);
        }
      };
    }
    var gv = o.unstable_now, I0 = 0, Nh = -1;
    function c1() {
      return I0;
    }
    function A0() {
      I0 = gv();
    }
    function uw(e) {
      Nh = gv(), e.actualStartTime < 0 && (e.actualStartTime = gv());
    }
    function R0(e) {
      Nh = -1;
    }
    function yv(e, t) {
      if (Nh >= 0) {
        var s = gv() - Nh;
        e.actualDuration += s, t && (e.selfBaseDuration = s), Nh = -1;
      }
    }
    var Qr = null, mu = null, vu = !1;
    function d1(e) {
      var t = e.stateNode.containerInfo;
      return mu = PS(t), Qr = e, vu = !0, !0;
    }
    function D0(e, t) {
      switch (e.tag) {
        case be:
          JE(e.stateNode.containerInfo, t);
          break;
        case Re:
          qE(e.type, e.memoizedProps, e.stateNode, t);
          break;
      }
      var s = cD();
      s.stateNode = t, s.return = e, s.effectTag = Us, e.lastEffect !== null ? (e.lastEffect.nextEffect = s, e.lastEffect = s) : e.firstEffect = e.lastEffect = s;
    }
    function N0(e, t) {
      switch (t.effectTag = t.effectTag & ~$i | xn, e.tag) {
        case be: {
          var s = e.stateNode.containerInfo;
          switch (t.tag) {
            case Re:
              var l = t.type;
              t.pendingProps, KE(s, l);
              break;
            case Fe:
              var d = t.pendingProps;
              eI(s, d);
              break;
          }
          break;
        }
        case Re: {
          var p = e.type, w = e.memoizedProps, b = e.stateNode;
          switch (t.tag) {
            case Re:
              var E = t.type;
              t.pendingProps, tI(p, w, b, E);
              break;
            case Fe:
              var N = t.pendingProps;
              nI(p, w, b, N);
              break;
            case ee:
              iI(p, w);
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
        case Fe: {
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
          N0(Qr, e), vu = !1, Qr = e;
          return;
        }
        var s = t;
        if (!k0(e, t)) {
          if (t = Sm(s), !t || !k0(e, t)) {
            N0(Qr, e), vu = !1, Qr = e;
            return;
          }
          D0(Qr, s);
        }
        Qr = e, mu = PS(t);
      }
    }
    function f1(e, t, s) {
      var l = e.stateNode, d = FE(l, e.type, e.memoizedProps, t, s, e);
      return e.updateQueue = d, d !== null;
    }
    function h1(e) {
      var t = e.stateNode, s = e.memoizedProps, l = $E(t, s, e);
      if (l) {
        var d = Qr;
        if (d !== null)
          switch (d.tag) {
            case be: {
              var p = d.stateNode.containerInfo;
              GE(p, t, s);
              break;
            }
            case Re: {
              var w = d.type, b = d.memoizedProps, E = d.stateNode;
              XE(w, b, E, t, s);
              break;
            }
          }
      }
      return l;
    }
    function p1(e) {
      var t = e.memoizedState, s = t !== null ? t.dehydrated : null;
      if (!s)
        throw Error("Expected to have a hydrated suspense instance. This error is likely caused by a bug in React. Please file an issue.");
      return QE(s);
    }
    function P0(e) {
      for (var t = e.return; t !== null && t.tag !== Re && t.tag !== be && t.tag !== ee; )
        t = t.return;
      Qr = t;
    }
    function wv(e) {
      if (e !== Qr)
        return !1;
      if (!vu)
        return P0(e), vu = !0, !1;
      var t = e.type;
      if (e.tag !== Re || t !== "head" && t !== "body" && !T(t, e.memoizedProps))
        for (var s = mu; s; )
          D0(e, s), s = Sm(s);
      return P0(e), e.tag === ee ? mu = p1(e) : mu = Qr ? Sm(e.stateNode) : null, !0;
    }
    function dw() {
      Qr = null, mu = null, vu = !1;
    }
    var kh = m.ReactCurrentOwner, el = !1, fw, hw, pw, mw, vw, gu, gw, bv;
    fw = {}, hw = {}, pw = {}, mw = {}, vw = {}, gu = !1, gw = {}, bv = {};
    function yr(e, t, s, l) {
      e === null ? t.child = jy(t, null, s, l) : t.child = sd(t, e.child, s, l);
    }
    function m1(e, t, s, l) {
      t.child = sd(t, e.child, null, l), t.child = sd(t, null, s, l);
    }
    function _0(e, t, s, l, d) {
      if (t.type !== t.elementType) {
        var p = s.propTypes;
        p && c(
          p,
          l,
          "prop",
          Ce(s),
          ft
        );
      }
      var w = s.render, b = t.ref, E;
      return ad(t, d), kh.current = t, Nr(!0), E = dd(e, t, w, l, b, d), t.mode & gn && t.memoizedState !== null && (E = dd(e, t, w, l, b, d)), Nr(!1), e !== null && !el ? (m0(e, t, d), fo(e, t, d)) : (t.effectTag |= lr, yr(e, t, E, d), t.child);
    }
    function z0(e, t, s, l, d, p) {
      if (e === null) {
        var w = s.type;
        if (iD(w) && s.compare === null && s.defaultProps === void 0) {
          var b = w;
          return b = id(w), t.tag = ge, t.type = b, bw(t, w), O0(e, t, b, l, d, p);
        }
        {
          var E = w.propTypes;
          E && c(
            E,
            l,
            "prop",
            Ce(w),
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
          Ce(k),
          ft
        );
      }
      var L = e.child;
      if (d < p) {
        var J = L.memoizedProps, me = s.compare;
        if (me = me !== null ? me : uh, me(J, l) && e.ref === t.ref)
          return fo(e, t, p);
      }
      t.effectTag |= lr;
      var we = Eu(L, l);
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
          Ce(w),
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
    function v1(e, t, s) {
      var l = t.pendingProps;
      return yr(e, t, l, s), t.child;
    }
    function g1(e, t, s) {
      var l = t.pendingProps.children;
      return yr(e, t, l, s), t.child;
    }
    function y1(e, t, s) {
      t.effectTag |= xt;
      var l = t.pendingProps, d = l.children;
      return yr(e, t, d, s), t.child;
    }
    function L0(e, t) {
      var s = t.ref;
      (e === null && s !== null || e !== null && e.ref !== s) && (t.effectTag |= pi);
    }
    function yw(e, t, s, l, d) {
      if (t.type !== t.elementType) {
        var p = s.propTypes;
        p && c(
          p,
          l,
          "prop",
          Ce(s),
          ft
        );
      }
      var w;
      {
        var b = Jc(t, s, !0);
        w = qc(t, b);
      }
      var E;
      return ad(t, d), kh.current = t, Nr(!0), E = dd(e, t, s, l, w, d), t.mode & gn && t.memoizedState !== null && (E = dd(e, t, s, l, w, d)), Nr(!1), e !== null && !el ? (m0(e, t, d), fo(e, t, d)) : (t.effectTag |= lr, yr(e, t, E, d), t.child);
    }
    function B0(e, t, s, l, d) {
      if (t.type !== t.elementType) {
        var p = s.propTypes;
        p && c(
          p,
          l,
          "prop",
          Ce(s),
          ft
        );
      }
      var w;
      ls(s) ? (w = !0, zm(t)) : w = !1, ad(t, d);
      var b = t.stateNode, E;
      b === null ? (e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= xn), l0(t, s, l), Py(t, s, l, d), E = !0) : e === null ? E = KA(t, s, l, d) : E = e1(e, t, s, l, d);
      var N = ww(e, t, s, E, w, d);
      {
        var k = t.stateNode;
        k.props !== l && (gu || g("It looks like %s is reassigning its own `this.props` while rendering. This is not supported and can lead to confusing bugs.", Ce(t.type) || "a component"), gu = !0);
      }
      return N;
    }
    function ww(e, t, s, l, d, p) {
      L0(e, t);
      var w = (t.effectTag & Ut) !== Pt;
      if (!l && !w)
        return d && Ex(t, s, !1), fo(e, t, p);
      var b = t.stateNode;
      kh.current = t;
      var E;
      return w && typeof s.getDerivedStateFromError != "function" ? (E = null, R0()) : (Nr(!0), E = b.render(), t.mode & gn && b.render(), Nr(!1)), t.effectTag |= lr, e !== null && w ? m1(e, t, E, p) : yr(e, t, E, p), t.memoizedState = b.state, d && Ex(t, s, !0), t.child;
    }
    function j0(e) {
      var t = e.stateNode;
      t.pendingContext ? Tx(e, t.pendingContext, t.pendingContext !== t.context) : t.context && Tx(e, t.context, !1), Uy(e, t.containerInfo);
    }
    function w1(e, t, s) {
      j0(t);
      var l = t.updateQueue;
      if (!(e !== null && l !== null))
        throw Error("If the root does not have an updateQueue, we should have already bailed out. This error is likely caused by a bug in React. Please file an issue.");
      var d = t.pendingProps, p = t.memoizedState, w = p !== null ? p.element : null;
      xy(e, t), xh(t, d, null, s);
      var b = t.memoizedState, E = b.element;
      if (E === w)
        return dw(), fo(e, t, s);
      var N = t.stateNode;
      if (N.hydrate && d1(t)) {
        var k = jy(t, null, E, s);
        t.child = k;
        for (var X = k; X; )
          X.effectTag = X.effectTag & ~xn | $i, X = X.sibling;
      } else
        yr(e, t, E, s), dw();
      return t.child;
    }
    function b1(e, t, s) {
      h0(t), e === null && cw(t);
      var l = t.type, d = t.pendingProps, p = e !== null ? e.memoizedProps : null, w = d.children, b = T(l, d);
      return b ? w = null : p !== null && T(l, p) && (t.effectTag |= Ri), L0(e, t), t.mode & td && s !== ds && R(l, d) ? (Fw(ds), t.expirationTime = t.childExpirationTime = ds, null) : (yr(e, t, w, s), t.child);
    }
    function S1(e, t) {
      return e === null && cw(t), null;
    }
    function x1(e, t, s, l, d) {
      e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= xn);
      var p = t.pendingProps;
      hx(t);
      var w = FA(s);
      t.type = w;
      var b = t.tag = rD(w);
      fx(t);
      var E = ma(w, p), N;
      switch (b) {
        case _e:
          return bw(t, w), t.type = w = id(w), N = yw(null, t, w, E, d), N;
        case ue:
          return t.type = w = fy(w), N = B0(null, t, w, E, d), N;
        case D:
          return t.type = w = hy(w), N = _0(null, t, w, E, d), N;
        case xe: {
          if (t.type !== t.elementType) {
            var k = w.propTypes;
            k && c(
              k,
              E,
              "prop",
              Ce(w),
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
      var X = "";
      throw w !== null && typeof w == "object" && w.$$typeof === ir && (X = " Did you wrap a component in React.lazy() more than once?"), Error("Element type is invalid. Received a promise that resolves to: " + w + ". Lazy element type must resolve to a class or function." + X);
    }
    function C1(e, t, s, l, d) {
      e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= xn), t.tag = ue;
      var p;
      return ls(s) ? (p = !0, zm(t)) : p = !1, ad(t, d), l0(t, s, l), Py(t, s, l, d), ww(null, t, s, !0, p, d);
    }
    function T1(e, t, s, l) {
      e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= xn);
      var d = t.pendingProps, p;
      {
        var w = Jc(t, s, !1);
        p = qc(t, w);
      }
      ad(t, l);
      var b;
      {
        if (s.prototype && typeof s.prototype.render == "function") {
          var E = Ce(s) || "Unknown";
          fw[E] || (g("The <%s /> component appears to have a render method, but doesn't extend React.Component. This is likely to cause errors. Change %s to extend React.Component instead.", E, E), fw[E] = !0);
        }
        t.mode & gn && pa.recordLegacyContextWarning(t, null), Nr(!0), kh.current = t, b = dd(null, t, s, d, p, l), Nr(!1);
      }
      if (t.effectTag |= lr, typeof b == "object" && b !== null && typeof b.render == "function" && b.$$typeof === void 0) {
        {
          var N = Ce(s) || "Unknown";
          hw[N] || (g("The <%s /> component appears to be a function component that returns a class instance. Change %s to a class that extends React.Component instead. If you can't use a class try assigning the prototype on the function as a workaround. `%s.prototype = React.Component.prototype`. Don't use an arrow function since it cannot be called with `new` by React.", N, N, N), hw[N] = !0);
        }
        t.tag = ue, t.memoizedState = null, t.updateQueue = null;
        var k = !1;
        ls(s) ? (k = !0, zm(t)) : k = !1, t.memoizedState = b.state !== null && b.state !== void 0 ? b.state : null, Sy(t);
        var X = s.getDerivedStateFromProps;
        return typeof X == "function" && Xm(t, s, X, d), o0(t, b), Py(t, s, d, l), ww(null, t, s, !0, k, l);
      } else
        return t.tag = _e, t.mode & gn && t.memoizedState !== null && (b = dd(null, t, s, d, p, l)), yr(null, t, b, l), bw(t, s), t.child;
    }
    function bw(e, t) {
      {
        if (t && t.childContextTypes && g("%s(...): childContextTypes cannot be defined on a function component.", t.displayName || t.name || "Component"), e.ref !== null) {
          var s = "", l = Na();
          l && (s += `

Check the render method of \`` + l + "`.");
          var d = l || e._debugID || "", p = e._debugSource;
          p && (d = p.fileName + ":" + p.lineNumber), vw[d] || (vw[d] = !0, g("Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?%s", s));
        }
        if (typeof t.getDerivedStateFromProps == "function") {
          var w = Ce(t) || "Unknown";
          mw[w] || (g("%s: Function components do not support getDerivedStateFromProps.", w), mw[w] = !0);
        }
        if (typeof t.contextType == "object" && t.contextType !== null) {
          var b = Ce(t) || "Unknown";
          pw[b] || (g("%s: Function components do not support contextType.", b), pw[b] = !0);
        }
      }
    }
    var Sw = {
      dehydrated: null,
      retryTime: Ae
    };
    function M1(e, t, s) {
      return nv(e, Ih) && (t === null || t.memoizedState !== null);
    }
    function U0(e, t, s) {
      var l = t.mode, d = t.pendingProps;
      bD(t) && (t.effectTag |= Ut);
      var p = va.current, w = !1, b = (t.effectTag & Ut) !== Pt;
      if (b || M1(p, e) ? (w = !0, t.effectTag &= ~Ut) : (e === null || e.memoizedState !== null) && d.fallback !== void 0 && d.unstable_avoidThisFallback !== !0 && (p = r1(p, Wy)), p = Ah(p), hu(t, p), e === null)
        if (d.fallback !== void 0 && cw(t), w) {
          var E = d.fallback, N = il(null, l, Ae, null);
          if (N.return = t, (t.mode & Hr) === oi) {
            var k = t.memoizedState, X = k !== null ? t.child.child : t.child;
            N.child = X;
            for (var L = X; L !== null; )
              L.return = N, L = L.sibling;
          }
          var J = il(E, l, s, null);
          return J.return = t, N.sibling = J, t.memoizedState = Sw, t.child = N, J;
        } else {
          var me = d.children;
          return t.memoizedState = null, t.child = jy(t, null, me, s);
        }
      else {
        var we = e.memoizedState;
        if (we !== null) {
          var qe = e.child, nt = qe.sibling;
          if (w) {
            var _t = d.fallback, vt = Eu(qe, qe.pendingProps);
            if (vt.return = t, (t.mode & Hr) === oi) {
              var $t = t.memoizedState, W = $t !== null ? t.child.child : t.child;
              if (W !== qe.child) {
                vt.child = W;
                for (var te = W; te !== null; )
                  te.return = vt, te = te.sibling;
              }
            }
            if (t.mode & cs) {
              for (var j = 0, ve = vt.child; ve !== null; )
                j += ve.treeBaseDuration, ve = ve.sibling;
              vt.treeBaseDuration = j;
            }
            var pe = Eu(nt, _t);
            return pe.return = t, vt.sibling = pe, vt.childExpirationTime = Ae, t.memoizedState = Sw, t.child = vt, pe;
          } else {
            var Me = d.children, yt = qe.child, It = sd(t, yt, Me, s);
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
              for (var In = cn; In !== null; )
                In.return = zt, In = In.sibling;
            }
            if (t.mode & cs) {
              for (var An = 0, bi = zt.child; bi !== null; )
                An += bi.treeBaseDuration, bi = bi.sibling;
              zt.treeBaseDuration = An;
            }
            var tn = il(At, l, s, null);
            return tn.return = t, zt.sibling = tn, tn.effectTag |= xn, zt.childExpirationTime = Ae, t.memoizedState = Sw, t.child = zt, tn;
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
    function E1(e, t, s) {
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
    function I1(e) {
      for (var t = e, s = null; t !== null; ) {
        var l = t.alternate;
        l !== null && iv(l) === null && (s = t), t = t.sibling;
      }
      return s;
    }
    function A1(e) {
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
    function R1(e, t) {
      e !== void 0 && !bv[e] && (e !== "collapsed" && e !== "hidden" ? (bv[e] = !0, g('"%s" is not a supported value for tail on <SuspenseList />. Did you mean "collapsed" or "hidden"?', e)) : t !== "forwards" && t !== "backwards" && (bv[e] = !0, g('<SuspenseList tail="%s" /> is only valid if revealOrder is "forwards" or "backwards". Did you mean to specify revealOrder="forwards"?', e)));
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
    function D1(e, t) {
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
    function xw(e, t, s, l, d, p) {
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
      A1(d), R1(p, d), D1(w, d), yr(e, t, w, s);
      var b = va.current, E = nv(b, Ih);
      if (E)
        b = Fy(b, Ih), t.effectTag |= Ut;
      else {
        var N = e !== null && (e.effectTag & Ut) !== Pt;
        N && E1(t, t.child, s), b = Ah(b);
      }
      if (hu(t, b), (t.mode & Hr) === oi)
        t.memoizedState = null;
      else
        switch (d) {
          case "forwards": {
            var k = I1(t.child), X;
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
            var L = null, J = t.child;
            for (t.child = null; J !== null; ) {
              var me = J.alternate;
              if (me !== null && iv(me) === null) {
                t.child = J;
                break;
              }
              var we = J.sibling;
              J.sibling = L, L = J, J = we;
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
    function N1(e, t, s) {
      Uy(t, t.stateNode.containerInfo);
      var l = t.pendingProps;
      return e === null ? t.child = sd(t, null, l, s) : yr(e, t, l, s), t.child;
    }
    function k1(e, t, s) {
      var l = t.type, d = l._context, p = t.pendingProps, w = t.memoizedProps, b = p.value;
      {
        var E = t.type.propTypes;
        E && c(E, p, "prop", "Context.Provider", ft);
      }
      if (Xx(t, b), w !== null) {
        var N = w.value, k = $A(d, b, N);
        if (k === 0) {
          if (w.children === p.children && !Pm())
            return fo(e, t, s);
        } else
          QA(t, d, k, s);
      }
      var X = p.children;
      return yr(e, t, X, s), t.child;
    }
    var F0 = !1;
    function P1(e, t, s) {
      var l = t.type;
      l._context === void 0 ? l !== l.Consumer && (F0 || (F0 = !0, g("Rendering <Context> directly is not supported and will be removed in a future major release. Did you mean to render <Context.Consumer> instead?"))) : l = l._context;
      var d = t.pendingProps, p = d.children;
      typeof p != "function" && g("A context consumer was rendered with multiple children, or a child that isn't a function. A context consumer expects a single child that is a function. If you did pass a function, make sure there is no trailing or leading whitespace around it."), ad(t, s);
      var w = Ln(l, d.unstable_observedBits), b;
      return kh.current = t, Nr(!0), b = p(w), Nr(!1), t.effectTag |= lr, yr(e, t, b, s), t.child;
    }
    function Cw() {
      el = !0;
    }
    function fo(e, t, s) {
      hx(t), e !== null && (t.dependencies = e.dependencies), R0();
      var l = t.expirationTime;
      l !== Ae && zv(l);
      var d = t.childExpirationTime;
      return d < s ? null : (t1(e, t), t.child);
    }
    function _1(e, t, s) {
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
        return p !== null ? (p.nextEffect = e, l.lastEffect = e) : l.firstEffect = l.lastEffect = e, e.nextEffect = null, e.effectTag = Us, s.effectTag |= xn, s;
      }
    }
    function $0(e, t, s) {
      var l = t.expirationTime;
      if (t._debugNeedsRemount && e !== null)
        return _1(e, t, Xw(t.type, t.key, t.pendingProps, t._debugOwner || null, t.mode, t.expirationTime));
      if (e !== null) {
        var d = e.memoizedProps, p = t.pendingProps;
        if (d !== p || Pm() || t.type !== e.type)
          el = !0;
        else if (l < s) {
          switch (el = !1, t.tag) {
            case be:
              j0(t), dw();
              break;
            case Re:
              if (h0(t), t.mode & td && s !== ds && R(t.type, p))
                return Fw(ds), t.expirationTime = t.childExpirationTime = ds, null;
              break;
            case ue: {
              var w = t.type;
              ls(w) && zm(t);
              break;
            }
            case Ve:
              Uy(t, t.stateNode.containerInfo);
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
                var k = t.child, X = k.childExpirationTime;
                if (X !== Ae && X >= s)
                  return U0(e, t, s);
                hu(t, Ah(va.current));
                var L = fo(e, t, s);
                return L !== null ? L.sibling : null;
              } else
                hu(t, Ah(va.current));
              break;
            }
            case dt: {
              var J = (e.effectTag & Ut) !== Pt, me = t.childExpirationTime >= s;
              if (J) {
                if (me)
                  return W0(e, t, s);
                t.effectTag |= Ut;
              }
              var we = t.memoizedState;
              if (we !== null && (we.rendering = null, we.tail = null), hu(t, va.current), me)
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
          return T1(e, t, t.type, s);
        case it: {
          var qe = t.elementType;
          return x1(e, t, qe, l, s);
        }
        case _e: {
          var nt = t.type, _t = t.pendingProps, vt = t.elementType === nt ? _t : ma(nt, _t);
          return yw(e, t, nt, vt, s);
        }
        case ue: {
          var $t = t.type, W = t.pendingProps, te = t.elementType === $t ? W : ma($t, W);
          return B0(e, t, $t, te, s);
        }
        case be:
          return w1(e, t, s);
        case Re:
          return b1(e, t, s);
        case Fe:
          return S1(e, t);
        case ee:
          return U0(e, t, s);
        case Ve:
          return N1(e, t, s);
        case D: {
          var j = t.type, ve = t.pendingProps, pe = t.elementType === j ? ve : ma(j, ve);
          return _0(e, t, j, pe, s);
        }
        case Tt:
          return v1(e, t, s);
        case Bt:
          return g1(e, t, s);
        case B:
          return y1(e, t, s);
        case re:
          return k1(e, t, s);
        case Ye:
          return P1(e, t, s);
        case xe: {
          var Me = t.type, yt = t.pendingProps, It = ma(Me, yt);
          if (t.type !== t.elementType) {
            var Ht = Me.propTypes;
            Ht && c(
              Ht,
              It,
              "prop",
              Ce(Me),
              ft
            );
          }
          return It = ma(Me.type, It), z0(e, t, Me, It, l, s);
        }
        case ge:
          return O0(e, t, t.type, t.pendingProps, l, s);
        case Ge: {
          var At = t.type, zt = t.pendingProps, Rt = t.elementType === At ? zt : ma(At, zt);
          return C1(e, t, At, Rt, s);
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
    var Z0, Tw, Y0, G0;
    Z0 = function(e, t, s, l) {
      for (var d = t.child; d !== null; ) {
        if (d.tag === Re || d.tag === Fe)
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
    }, Y0 = function(e, t, s, l, d) {
      var p = e.memoizedProps;
      if (p !== l) {
        var w = t.stateNode, b = Vy(), E = x(w, s, p, l, d, b);
        t.updateQueue = E, E && vd(t);
      }
    }, G0 = function(e, t, s, l) {
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
    function X0(e, t, s) {
      var l = t.pendingProps;
      switch (t.tag) {
        case Qe:
        case it:
        case ge:
        case _e:
        case D:
        case Tt:
        case Bt:
        case B:
        case Ye:
        case xe:
          return null;
        case ue: {
          var d = t.type;
          return ls(d) && _m(t), null;
        }
        case be: {
          od(t), ry(t);
          var p = t.stateNode;
          if (p.pendingContext && (p.context = p.pendingContext, p.pendingContext = null), e === null || e.child === null) {
            var w = wv(t);
            w && vd(t);
          }
          return Tw(t), null;
        }
        case Re: {
          Hy(t);
          var b = f0(), E = t.type;
          if (e !== null && t.stateNode != null)
            Y0(e, t, E, l, b), e.ref !== t.ref && Q0(t);
          else {
            if (!l) {
              if (t.stateNode === null)
                throw Error("We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue.");
              return null;
            }
            var N = Vy(), k = wv(t);
            if (k)
              f1(t, b, N) && vd(t);
            else {
              var X = u(E, l, b, N, t);
              Z0(X, t, !1, !1), t.stateNode = X, v(X, E, l, b) && vd(t);
            }
            t.ref !== null && Q0(t);
          }
          return null;
        }
        case Fe: {
          var L = l;
          if (e && t.stateNode != null) {
            var J = e.memoizedProps;
            G0(e, t, J, L);
          } else {
            if (typeof L != "string" && t.stateNode === null)
              throw Error("We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue.");
            var me = f0(), we = Vy(), qe = wv(t);
            qe ? h1(t) && vd(t) : t.stateNode = H(L, me, we, t);
          }
          return null;
        }
        case ee: {
          ld(t);
          var nt = t.memoizedState;
          if ((t.effectTag & Ut) !== Pt)
            return t.expirationTime = s, t;
          var _t = nt !== null, vt = !1;
          if (e === null)
            t.memoizedProps.fallback !== void 0 && wv(t);
          else {
            var $t = e.memoizedState;
            if (vt = $t !== null, !_t && $t !== null) {
              var W = e.child.sibling;
              if (W !== null) {
                var te = t.firstEffect;
                te !== null ? (t.firstEffect = W, W.nextEffect = te) : (t.firstEffect = t.lastEffect = W, W.nextEffect = null), W.effectTag = Us;
              }
            }
          }
          if (_t && !vt && (t.mode & Hr) !== oi) {
            var j = e === null && t.memoizedProps.unstable_avoidThisFallback !== !0;
            j || nv(va.current, Wy) ? gR() : yR();
          }
          return (_t || vt) && (t.effectTag |= xt), null;
        }
        case Ve:
          return od(t), Tw(t), null;
        case re:
          return yy(t), null;
        case Ge: {
          var ve = t.type;
          return ls(ve) && _m(t), null;
        }
        case dt: {
          ld(t);
          var pe = t.memoizedState;
          if (pe === null)
            return null;
          var Me = (t.effectTag & Ut) !== Pt, yt = pe.rendering;
          if (yt === null)
            if (Me)
              Sv(pe, !1);
            else {
              var It = bR() && (e === null || (e.effectTag & Ut) === Pt);
              if (!It)
                for (var Ht = t.child; Ht !== null; ) {
                  var At = iv(Ht);
                  if (At !== null) {
                    Me = !0, t.effectTag |= Ut, Sv(pe, !1);
                    var zt = At.updateQueue;
                    return zt !== null && (t.updateQueue = zt, t.effectTag |= xt), pe.lastEffect === null && (t.firstEffect = null), t.lastEffect = pe.lastEffect, n1(t, s), hu(t, Fy(va.current, Ih)), t.child;
                  }
                  Ht = Ht.sibling;
                }
            }
          else {
            if (!Me) {
              var Rt = iv(yt);
              if (Rt !== null) {
                t.effectTag |= Ut, Me = !0;
                var cn = Rt.updateQueue;
                if (cn !== null && (t.updateQueue = cn, t.effectTag |= xt), Sv(pe, !0), pe.tail === null && pe.tailMode === "hidden" && !yt.alternate) {
                  var In = t.lastEffect = pe.lastEffect;
                  return In !== null && (In.nextEffect = null), null;
                }
              } else if (vr() * 2 - pe.renderingStartTime > pe.tailExpiration && s > ds) {
                t.effectTag |= Ut, Me = !0, Sv(pe, !1);
                var An = s - 1;
                t.expirationTime = t.childExpirationTime = An, Fw(An);
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
            return Me ? wa = Fy(wa, Ih) : wa = Ah(wa), hu(t, wa), Bi;
          }
          return null;
        }
      }
      throw Error("Unknown unit of work tag (" + t.tag + "). This error is likely caused by a bug in React. Please file an issue.");
    }
    function z1(e, t) {
      switch (e.tag) {
        case ue: {
          var s = e.type;
          ls(s) && _m(e);
          var l = e.effectTag;
          return l & mi ? (e.effectTag = l & ~mi | Ut, e) : null;
        }
        case be: {
          od(e), ry(e);
          var d = e.effectTag;
          if ((d & Ut) !== Pt)
            throw Error("The root failed to unmount after an error. This is likely a bug in React. Please file an issue.");
          return e.effectTag = d & ~mi | Ut, e;
        }
        case Re:
          return Hy(e), null;
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
          return yy(e), null;
        default:
          return null;
      }
    }
    function J0(e) {
      switch (e.tag) {
        case ue: {
          var t = e.type.childContextTypes;
          t != null && _m(e);
          break;
        }
        case be: {
          od(e), ry(e);
          break;
        }
        case Re: {
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
    function O1(e) {
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
    var L1 = typeof WeakSet == "function" ? WeakSet : Set;
    function Ew(e, t) {
      var s = t.source, l = t.stack;
      l === null && s !== null && (l = Fn(s));
      var d = {
        componentName: s !== null ? Ce(s.type) : null,
        componentStack: l !== null ? l : "",
        error: t.value,
        errorBoundary: null,
        errorBoundaryName: null,
        errorBoundaryFound: !1,
        willRetry: !1
      };
      e !== null && e.tag === ue && (d.errorBoundary = e.stateNode, d.errorBoundaryName = Ce(e.type), d.errorBoundaryFound = !0, d.willRetry = !0);
      try {
        O1(d);
      } catch (p) {
        setTimeout(function() {
          throw p;
        });
      }
    }
    var B1 = function(e, t) {
      as(e, "componentWillUnmount"), t.props = e.memoizedProps, t.state = e.memoizedState, t.componentWillUnmount(), ss();
    };
    function j1(e, t) {
      if (se(null, B1, null, e, t), oe()) {
        var s = Oe();
        Tu(e, s);
      }
    }
    function K0(e) {
      var t = e.ref;
      if (t !== null)
        if (typeof t == "function") {
          if (se(null, t, null, null), oe()) {
            var s = Oe();
            Tu(e, s);
          }
        } else
          t.current = null;
    }
    function U1(e, t) {
      if (se(null, t, null), oe()) {
        var s = Oe();
        Tu(e, s);
      }
    }
    function V1(e, t) {
      switch (t.tag) {
        case _e:
        case D:
        case ge:
        case Mt:
          return;
        case ue: {
          if (t.effectTag & Ua && e !== null) {
            var s = e.memoizedProps, l = e.memoizedState;
            as(t, "getSnapshotBeforeUpdate");
            var d = t.stateNode;
            t.type === t.elementType && !gu && (d.props !== t.memoizedProps && g("Expected %s props to match memoized props before getSnapshotBeforeUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Ce(t.type) || "instance"), d.state !== t.memoizedState && g("Expected %s state to match memoized state before getSnapshotBeforeUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Ce(t.type) || "instance"));
            var p = d.getSnapshotBeforeUpdate(t.elementType === t.type ? s : ma(t.type, s), l);
            {
              var w = q0;
              p === void 0 && !w.has(t.type) && (w.add(t.type), g("%s.getSnapshotBeforeUpdate(): A snapshot value (or null) must be returned. You have returned undefined.", Ce(t.type)));
            }
            d.__reactInternalSnapshotBeforeUpdate = p, ss();
          }
          return;
        }
        case be:
        case Re:
        case Fe:
        case Ve:
        case Ge:
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

Learn more about data fetching with Hooks: https://fb.me/react-hooks-data-fetching` : E = " You returned: " + b, g("An effect function must not return anything besides a function, which is used for clean-up.%s%s", E, Fn(t));
              }
            }
          }
          p = p.next;
        } while (p !== d);
      }
    }
    function H1(e) {
      if ((e.effectTag & Va) !== Pt)
        switch (e.tag) {
          case _e:
          case D:
          case ge:
          case Mt: {
            eC(rv | ud, e), tC(rv | ud, e);
            break;
          }
        }
    }
    function W1(e, t, s, l) {
      switch (s.tag) {
        case _e:
        case D:
        case ge:
        case Mt: {
          tC(cd | ud, s);
          return;
        }
        case ue: {
          var d = s.stateNode;
          if (s.effectTag & xt)
            if (t === null)
              as(s, "componentDidMount"), s.type === s.elementType && !gu && (d.props !== s.memoizedProps && g("Expected %s props to match memoized props before componentDidMount. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Ce(s.type) || "instance"), d.state !== s.memoizedState && g("Expected %s state to match memoized state before componentDidMount. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Ce(s.type) || "instance")), d.componentDidMount(), ss();
            else {
              var p = s.elementType === s.type ? t.memoizedProps : ma(s.type, t.memoizedProps), w = t.memoizedState;
              as(s, "componentDidUpdate"), s.type === s.elementType && !gu && (d.props !== s.memoizedProps && g("Expected %s props to match memoized props before componentDidUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Ce(s.type) || "instance"), d.state !== s.memoizedState && g("Expected %s state to match memoized state before componentDidUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Ce(s.type) || "instance")), d.componentDidUpdate(p, w, d.__reactInternalSnapshotBeforeUpdate), ss();
            }
          var b = s.updateQueue;
          b !== null && (s.type === s.elementType && !gu && (d.props !== s.memoizedProps && g("Expected %s props to match memoized props before processing the update queue. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Ce(s.type) || "instance"), d.state !== s.memoizedState && g("Expected %s state to match memoized state before processing the update queue. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", Ce(s.type) || "instance")), n0(s, b, d));
          return;
        }
        case be: {
          var E = s.updateQueue;
          if (E !== null) {
            var N = null;
            if (s.child !== null)
              switch (s.child.tag) {
                case Re:
                  N = s.child.stateNode;
                  break;
                case ue:
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
            var X = s.type, L = s.memoizedProps;
            mt(k, X, L);
          }
          return;
        }
        case Fe:
          return;
        case Ve:
          return;
        case B: {
          {
            var J = s.memoizedProps.onRender;
            typeof J == "function" && J(s.memoizedProps.id, t === null ? "mount" : "update", s.actualDuration, s.treeBaseDuration, s.actualStartTime, c1(), e.memoizedInteractions);
          }
          return;
        }
        case ee: {
          q1(e, s);
          return;
        }
        case dt:
        case Ge:
        case gt:
        case Zt:
          return;
      }
      throw Error("This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue.");
    }
    function F1(e, t) {
      for (var s = e; ; ) {
        if (s.tag === Re) {
          var l = s.stateNode;
          t ? Je(l) : un(s.stateNode, s.memoizedProps);
        } else if (s.tag === Fe) {
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
    function $1(e) {
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
        typeof t == "function" ? t(l) : (t.hasOwnProperty("current") || g("Unexpected ref object provided for %s. Use either a ref-setter function or React.createRef().%s", Ce(e.type), Fn(e)), t.current = l);
      }
    }
    function Q1(e) {
      var t = e.ref;
      t !== null && (typeof t == "function" ? t(null) : t.current = null);
    }
    function nC(e, t, s) {
      switch (qR(t), t.tag) {
        case _e:
        case D:
        case xe:
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
                    N !== void 0 && U1(t, N), E = E.next;
                  } while (E !== p);
                });
              }
            }
          }
          return;
        }
        case ue: {
          K0(t);
          var b = t.stateNode;
          typeof b.componentWillUnmount == "function" && j1(t, b);
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
        case Le:
          return;
        case Zt:
          return;
      }
    }
    function Z1(e, t, s) {
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
    function Y1(e) {
      for (var t = e.return; t !== null; ) {
        if (rC(t))
          return t;
        t = t.return;
      }
      throw Error("Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue.");
    }
    function rC(e) {
      return e.tag === Re || e.tag === be || e.tag === Ve;
    }
    function G1(e) {
      var t = e;
      e:
        for (; ; ) {
          for (; t.sibling === null; ) {
            if (t.return === null || rC(t.return))
              return null;
            t = t.return;
          }
          for (t.sibling.return = t.return, t = t.sibling; t.tag !== Re && t.tag !== Fe && t.tag !== Le; ) {
            if (t.effectTag & xn || t.child === null || t.tag === Ve)
              continue e;
            t.child.return = t, t = t.child;
          }
          if (!(t.effectTag & xn))
            return t.stateNode;
        }
    }
    function aC(e) {
      var t = Y1(e), s, l, d = t.stateNode;
      switch (t.tag) {
        case Re:
          s = d, l = !1;
          break;
        case be:
          s = d.containerInfo, l = !0;
          break;
        case Ve:
          s = d.containerInfo, l = !0;
          break;
        case gt:
        default:
          throw Error("Invalid host parent fiber. This error is likely caused by a bug in React. Please file an issue.");
      }
      t.effectTag & Ri && (_i(s), t.effectTag &= ~Ri);
      var p = G1(e);
      l ? Iw(e, p, s) : Aw(e, p, s);
    }
    function Iw(e, t, s) {
      var l = e.tag, d = l === Re || l === Fe;
      if (d || mn) {
        var p = d ? e.stateNode : e.stateNode.instance;
        t ? le(s, p, t) : _(s, p);
      } else if (l !== Ve) {
        var w = e.child;
        if (w !== null) {
          Iw(w, t, s);
          for (var b = w.sibling; b !== null; )
            Iw(b, t, s), b = b.sibling;
        }
      }
    }
    function Aw(e, t, s) {
      var l = e.tag, d = l === Re || l === Fe;
      if (d || mn) {
        var p = d ? e.stateNode : e.stateNode.instance;
        t ? Q(s, p, t) : O(s, p);
      } else if (l !== Ve) {
        var w = e.child;
        if (w !== null) {
          Aw(w, t, s);
          for (var b = w.sibling; b !== null; )
            Aw(b, t, s), b = b.sibling;
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
                case be:
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
        if (l.tag === Re || l.tag === Fe)
          Z1(e, l, s), w ? ke(p, l.stateNode) : ye(p, l.stateNode);
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
    function X1(e, t, s) {
      sC(e, t, s), iC(t);
    }
    function Rw(e, t) {
      switch (t.tag) {
        case _e:
        case D:
        case xe:
        case ge:
        case Mt: {
          eC(cd | ud, t);
          return;
        }
        case ue:
          return;
        case Re: {
          var s = t.stateNode;
          if (s != null) {
            var l = t.memoizedProps, d = e !== null ? e.memoizedProps : l, p = t.type, w = t.updateQueue;
            t.updateQueue = null, w !== null && Et(s, w, p, d, l);
          }
          return;
        }
        case Fe: {
          if (t.stateNode === null)
            throw Error("This should have a text node initialized. This error is likely caused by a bug in React. Please file an issue.");
          var b = t.stateNode, E = t.memoizedProps, N = e !== null ? e.memoizedProps : E;
          Wn(b, N, E);
          return;
        }
        case be: {
          {
            var k = t.stateNode;
            k.hydrate && (k.hydrate = !1, ZE(k.containerInfo));
          }
          return;
        }
        case B:
          return;
        case ee: {
          J1(t), oC(t);
          return;
        }
        case dt: {
          oC(t);
          return;
        }
        case Ge:
          return;
      }
      throw Error("This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue.");
    }
    function J1(e) {
      var t = e.memoizedState, s, l = e;
      t === null ? s = !1 : (s = !0, l = e.child, vR()), l !== null && F1(l, s);
    }
    function q1(e, t) {
      var s = t.memoizedState;
      if (s === null) {
        var l = t.alternate;
        if (l !== null) {
          var d = l.memoizedState;
          if (d !== null) {
            var p = d.dehydrated;
            p !== null && YE(p);
          }
        }
      }
    }
    function oC(e) {
      var t = e.updateQueue;
      if (t !== null) {
        e.updateQueue = null;
        var s = e.stateNode;
        s === null && (s = e.stateNode = new L1()), t.forEach(function(l) {
          var d = OR.bind(null, e, l);
          s.has(l) || (l.__reactDoNotTraceInteractions !== !0 && (d = h.unstable_wrap(d)), s.add(l), l.then(d, d));
        });
      }
    }
    function K1(e) {
      _i(e.stateNode);
    }
    var eR = typeof WeakMap == "function" ? WeakMap : Map;
    function lC(e, t, s) {
      var l = Go(s, null);
      l.tag = wy, l.payload = {
        element: null
      };
      var d = t.value;
      return l.callback = function() {
        PR(d), Ew(e, t);
      }, l;
    }
    function uC(e, t, s) {
      var l = Go(s, null);
      l.tag = wy;
      var d = e.type.getDerivedStateFromError;
      if (typeof d == "function") {
        var p = t.value;
        l.payload = function() {
          return Ew(e, t), d(p);
        };
      }
      var w = e.stateNode;
      return w !== null && typeof w.componentDidCatch == "function" ? l.callback = function() {
        Zx(e), typeof d != "function" && (NR(this), Ew(e, t));
        var E = t.value, N = t.stack;
        this.componentDidCatch(E, {
          componentStack: N !== null ? N : ""
        }), typeof d != "function" && e.expirationTime !== Ct && g("%s: Error boundaries should implement getDerivedStateFromError(). In that method, return a state update to display an error message or fallback UI.", Ce(e.type) || "Unknown");
      } : l.callback = function() {
        Zx(e);
      }, l;
    }
    function tR(e, t, s) {
      var l = e.pingCache, d;
      if (l === null ? (l = e.pingCache = new eR(), d = /* @__PURE__ */ new Set(), l.set(s, d)) : (d = l.get(s), d === void 0 && (d = /* @__PURE__ */ new Set(), l.set(s, d))), !d.has(t)) {
        d.add(t);
        var p = _R.bind(null, e, s, t);
        s.then(p, p);
      }
    }
    function nR(e, t, s, l, d) {
      if (s.effectTag |= _o, s.firstEffect = s.lastEffect = null, l !== null && typeof l == "object" && typeof l.then == "function") {
        var p = l;
        if ((s.mode & Hr) === oi) {
          var w = s.alternate;
          w ? (s.updateQueue = w.updateQueue, s.memoizedState = w.memoizedState, s.expirationTime = w.expirationTime) : (s.updateQueue = null, s.memoizedState = null);
        }
        var b = nv(va.current, Wy), E = t;
        do {
          if (E.tag === ee && a1(E, b)) {
            var N = E.updateQueue;
            if (N === null) {
              var k = /* @__PURE__ */ new Set();
              k.add(p), E.updateQueue = k;
            } else
              N.add(p);
            if ((E.mode & Hr) === oi) {
              if (E.effectTag |= Ut, s.effectTag &= ~(bf | _o), s.tag === ue) {
                var X = s.alternate;
                if (X === null)
                  s.tag = Ge;
                else {
                  var L = Go(Ct, null);
                  L.tag = $m, Xo(s, L);
                }
              }
              s.expirationTime = Ct;
              return;
            }
            tR(e, d, p), E.effectTag |= mi, E.expirationTime = d;
            return;
          }
          E = E.return;
        } while (E !== null);
        l = new Error((Ce(s.type) || "A React component") + ` suspended while rendering, but no fallback UI was specified.

Add a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display.` + Fn(s));
      }
      wR(), l = Mw(l, s);
      var J = t;
      do {
        switch (J.tag) {
          case be: {
            var me = l;
            J.effectTag |= mi, J.expirationTime = d;
            var we = lC(J, me, d);
            e0(J, we);
            return;
          }
          case ue:
            var qe = l, nt = J.type, _t = J.stateNode;
            if ((J.effectTag & Ut) === Pt && (typeof nt.getDerivedStateFromError == "function" || _t !== null && typeof _t.componentDidCatch == "function" && !TC(_t))) {
              J.effectTag |= mi, J.expirationTime = d;
              var vt = uC(J, qe, d);
              e0(J, vt);
              return;
            }
            break;
        }
        J = J.return;
      } while (J !== null);
    }
    var iR = Math.ceil, Dw = m.ReactCurrentDispatcher, cC = m.ReactCurrentOwner, Nw = m.IsSomeRendererActing, En = 0, xv = 1, rR = 2, dC = 4, kw = 8, wr = 16, hs = 32, yu = 0, Cv = 1, fC = 2, Tv = 3, Mv = 4, Pw = 5, rt = En, Gi = null, We = null, ui = Ae, Zn = yu, Ev = null, ho = Ct, Ph = Ct, Iv = null, _h = Ae, Av = !1, _w = 0, hC = 500, Ue = null, Rv = !1, zw = null, gd = null, zh = !1, yd = null, Oh = Kc, Ow = Ae, wu = null, aR = 50, Lh = 0, Lw = null, sR = 50, Dv = 0, Bh = null, bu = null, jh = Ae;
    function ps() {
      return (rt & (wr | hs)) !== En ? uy(vr()) : (jh !== Ae || (jh = uy(vr())), jh);
    }
    function oR() {
      return uy(vr());
    }
    function Su(e, t, s) {
      var l = t.mode;
      if ((l & Hr) === oi)
        return Ct;
      var d = ed();
      if ((l & td) === oi)
        return d === Li ? Ct : Ux;
      if ((rt & wr) !== En)
        return ui;
      var p;
      if (s !== null)
        p = OA(e, s.timeoutMs | 0 || mh);
      else
        switch (d) {
          case Li:
            p = Ct;
            break;
          case Yo:
            p = Wx(e);
            break;
          case ha:
          case oy:
            p = zA(e);
            break;
          case fh:
            p = uu;
            break;
          default:
            throw Error("Expected a valid priority level");
        }
      return Gi !== null && p === ui && (p -= 1), p;
    }
    function lR(e, t) {
      jR(), FR(e);
      var s = Nv(e, t);
      if (s === null) {
        HR(e);
        return;
      }
      VR(e, t), SA();
      var l = ed();
      if (t === Ct ? (rt & kw) !== En && (rt & (wr | hs)) === En ? (nl(s, t), Bw(s)) : (br(s), nl(s, t), rt === En && us()) : (br(s), nl(s, t)), (rt & dC) !== En && (l === Yo || l === Li))
        if (wu === null)
          wu = /* @__PURE__ */ new Map([[s, t]]);
        else {
          var d = wu.get(s);
          (d === void 0 || d > t) && wu.set(s, t);
        }
    }
    var Zr = lR;
    function Nv(e, t) {
      e.expirationTime < t && (e.expirationTime = t);
      var s = e.alternate;
      s !== null && s.expirationTime < t && (s.expirationTime = t);
      var l = e.return, d = null;
      if (l === null && e.tag === be)
        d = e.stateNode;
      else
        for (; l !== null; ) {
          if (s = l.alternate, l.childExpirationTime < t && (l.childExpirationTime = t), s !== null && s.childExpirationTime < t && (s.childExpirationTime = t), l.return === null && l.tag === be) {
            d = l.stateNode;
            break;
          }
          l = l.return;
        }
      return d !== null && (Gi === d && (zv(t), Zn === Mv && Iu(d, ui)), LC(d, t)), d;
    }
    function kv(e) {
      var t = e.lastExpiredTime;
      if (t !== Ae)
        return t;
      var s = e.firstPendingTime;
      if (!OC(e, s))
        return s;
      var l = e.lastPingedTime, d = e.nextKnownPendingLevel, p = l > d ? l : d;
      return p <= uu && s !== p ? Ae : p;
    }
    function br(e) {
      var t = e.lastExpiredTime;
      if (t !== Ae) {
        e.callbackExpirationTime = Ct, e.callbackPriority = Li, e.callbackNode = Lx(Bw.bind(null, e));
        return;
      }
      var s = kv(e), l = e.callbackNode;
      if (s === Ae) {
        l !== null && (e.callbackNode = null, e.callbackExpirationTime = Ae, e.callbackPriority = Kc);
        return;
      }
      var d = ps(), p = Fx(d, s);
      if (l !== null) {
        var w = e.callbackPriority, b = e.callbackExpirationTime;
        if (b === s && w >= p)
          return;
        PA(l);
      }
      e.callbackExpirationTime = s, e.callbackPriority = p;
      var E;
      s === Ct ? E = Lx(Bw.bind(null, e)) : E = hh(
        p,
        pC.bind(null, e),
        {
          timeout: cu(s) - vr()
        }
      ), e.callbackNode = E;
    }
    function pC(e, t) {
      if (jh = Ae, t) {
        var s = ps();
        return eb(e, s), br(e), null;
      }
      var l = kv(e);
      if (l !== Ae) {
        var d = e.callbackNode;
        if ((rt & (wr | hs)) !== En)
          throw Error("Should not already be working.");
        if (tl(), (e !== Gi || l !== ui) && (xu(e, l), kC(e, l)), We !== null) {
          var p = rt;
          rt |= wr;
          var w = wC(), b = Pv(e);
          mx(We);
          do
            try {
              TR();
              break;
            } catch (k) {
              yC(e, k);
            }
          while (!0);
          if (Fm(), rt = p, bC(w), _v(b), Zn === Cv) {
            var E = Ev;
            throw Uw(), xu(e, l), Iu(e, l), br(e), E;
          }
          if (We !== null)
            Uw();
          else {
            EC();
            var N = e.finishedWork = e.current.alternate;
            e.finishedExpirationTime = l, uR(e, N, Zn, l);
          }
          if (br(e), e.callbackNode === d)
            return pC.bind(null, e);
        }
      }
      return null;
    }
    function uR(e, t, s, l) {
      switch (Gi = null, s) {
        case yu:
        case Cv:
          throw Error("Root did not complete. This is a bug in React.");
        case fC: {
          eb(e, l > uu ? uu : l);
          break;
        }
        case Tv: {
          Iu(e, l);
          var d = e.lastSuspendedTime;
          l === d && (e.nextKnownPendingLevel = jw(t));
          var p = ho === Ct;
          if (p && !Mu.current) {
            var w = _w + hC - vr();
            if (w > 10) {
              if (Av) {
                var b = e.lastPingedTime;
                if (b === Ae || b >= l) {
                  e.lastPingedTime = l, xu(e, l);
                  break;
                }
              }
              var E = kv(e);
              if (E !== Ae && E !== l)
                break;
              if (d !== Ae && d !== l) {
                e.lastPingedTime = d;
                break;
              }
              e.timeoutHandle = U(Cu.bind(null, e), w);
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
              if (k === Ae || k >= l) {
                e.lastPingedTime = l, xu(e, l);
                break;
              }
            }
            var X = kv(e);
            if (X !== Ae && X !== l)
              break;
            if (N !== Ae && N !== l) {
              e.lastPingedTime = N;
              break;
            }
            var L;
            if (Ph !== Ct)
              L = cu(Ph) - vr();
            else if (ho === Ct)
              L = 0;
            else {
              var J = SR(ho), me = vr(), we = cu(l) - me, qe = me - J;
              qe < 0 && (qe = 0), L = LR(qe) - qe, we < L && (L = we);
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
          if (!Mu.current && ho !== Ct && Iv !== null) {
            var nt = BR(ho, l, Iv);
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
      var t = e.lastExpiredTime, s = t !== Ae ? t : Ct;
      if ((rt & (wr | hs)) !== En)
        throw Error("Should not already be working.");
      if (tl(), (e !== Gi || s !== ui) && (xu(e, s), kC(e, s)), We !== null) {
        var l = rt;
        rt |= wr;
        var d = wC(), p = Pv(e);
        mx(We);
        do
          try {
            CR();
            break;
          } catch (b) {
            yC(e, b);
          }
        while (!0);
        if (Fm(), rt = l, bC(d), _v(p), Zn === Cv) {
          var w = Ev;
          throw Uw(), xu(e, s), Iu(e, s), br(e), w;
        }
        if (We !== null)
          throw Error("Cannot commit an incomplete root. This error is likely caused by a bug in React. Please file an issue.");
        EC(), e.finishedWork = e.current.alternate, e.finishedExpirationTime = s, cR(e), br(e);
      }
      return null;
    }
    function cR(e) {
      Gi = null, Cu(e);
    }
    function dR() {
      if ((rt & (xv | wr | hs)) !== En) {
        (rt & wr) !== En && g("unstable_flushDiscreteUpdates: Cannot flush updates when React is already rendering.");
        return;
      }
      hR(), tl();
    }
    function fR(e, t, s, l) {
      return co(Li, e.bind(null, t, s, l));
    }
    function hR() {
      if (wu !== null) {
        var e = wu;
        wu = null, e.forEach(function(t, s) {
          eb(s, t), br(s);
        }), us();
      }
    }
    function mC(e, t) {
      var s = rt;
      rt |= xv;
      try {
        return e(t);
      } finally {
        rt = s, rt === En && us();
      }
    }
    function pR(e, t) {
      var s = rt;
      rt |= rR;
      try {
        return e(t);
      } finally {
        rt = s, rt === En && us();
      }
    }
    function mR(e, t, s, l, d) {
      var p = rt;
      rt |= dC;
      try {
        return co(Yo, e.bind(null, t, s, l, d));
      } finally {
        rt = p, rt === En && us();
      }
    }
    function vC(e, t) {
      var s = rt;
      rt &= ~xv, rt |= kw;
      try {
        return e(t);
      } finally {
        rt = s, rt === En && us();
      }
    }
    function gC(e, t) {
      if ((rt & (wr | hs)) !== En)
        throw Error("flushSync was called from inside a lifecycle method. It cannot be called when React is already rendering.");
      var s = rt;
      rt |= xv;
      try {
        return co(Li, e.bind(null, t));
      } finally {
        rt = s, us();
      }
    }
    function xu(e, t) {
      e.finishedWork = null, e.finishedExpirationTime = Ae;
      var s = e.timeoutHandle;
      if (s !== De && (e.timeoutHandle = De, Te(s)), We !== null)
        for (var l = We.return; l !== null; )
          J0(l), l = l.return;
      Gi = e, We = Eu(e.current, null), ui = t, Zn = yu, Ev = null, ho = Ct, Ph = Ct, Iv = null, _h = Ae, Av = !1, bu = null, pa.discardPendingWarnings();
    }
    function yC(e, t) {
      do {
        try {
          if (Fm(), v0(), rr(), We === null || We.return === null)
            return Zn = Cv, Ev = t, We = null, null;
          Er && We.mode & cs && yv(We, !0), nR(e, We.return, We, t, ui), We = CC(We);
        } catch (s) {
          t = s;
          continue;
        }
        return;
      } while (!0);
    }
    function wC(e) {
      var t = Dw.current;
      return Dw.current = mv, t === null ? mv : t;
    }
    function bC(e) {
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
    function vR() {
      _w = vr();
    }
    function SC(e, t) {
      e < ho && e > uu && (ho = e), t !== null && e < Ph && e > uu && (Ph = e, Iv = t);
    }
    function zv(e) {
      e > _h && (_h = e);
    }
    function gR() {
      Zn === yu && (Zn = Tv);
    }
    function yR() {
      (Zn === yu || Zn === Tv) && (Zn = Mv), _h !== Ae && Gi !== null && (Iu(Gi, ui), LC(Gi, _h));
    }
    function wR() {
      Zn !== Pw && (Zn = fC);
    }
    function bR() {
      return Zn === yu;
    }
    function SR(e) {
      var t = cu(e);
      return t - mh;
    }
    function xR(e, t) {
      var s = cu(e);
      return s - (t.timeoutMs | 0 || mh);
    }
    function CR() {
      for (; We !== null; )
        We = xC(We);
    }
    function TR() {
      for (; We !== null && !NA(); )
        We = xC(We);
    }
    function xC(e) {
      var t = e.alternate;
      fx(e), Co(e);
      var s;
      return (e.mode & cs) !== oi ? (uw(e), s = Vw(t, e, ui), yv(e, !0)) : s = Vw(t, e, ui), rr(), e.memoizedProps = e.pendingProps, s === null && (s = CC(e)), cC.current = null, s;
    }
    function CC(e) {
      We = e;
      do {
        var t = We.alternate, s = We.return;
        if ((We.effectTag & _o) === Pt) {
          Co(We);
          var l = void 0;
          if ((We.mode & cs) === oi ? l = X0(t, We, ui) : (uw(We), l = X0(t, We, ui), yv(We, !1)), px(We), rr(), MR(We), l !== null)
            return l;
          if (s !== null && (s.effectTag & _o) === Pt) {
            s.firstEffect === null && (s.firstEffect = We.firstEffect), We.lastEffect !== null && (s.lastEffect !== null && (s.lastEffect.nextEffect = We.firstEffect), s.lastEffect = We.lastEffect);
            var d = We.effectTag;
            d > lr && (s.lastEffect !== null ? s.lastEffect.nextEffect = We : s.firstEffect = We, s.lastEffect = We);
          }
        } else {
          var p = z1(We);
          if ((We.mode & cs) !== oi) {
            yv(We, !1);
            for (var w = We.actualDuration, b = We.child; b !== null; )
              w += b.actualDuration, b = b.sibling;
            We.actualDuration = w;
          }
          if (p !== null)
            return xA(We), p.effectTag &= Sf, p;
          px(We), s !== null && (s.firstEffect = s.lastEffect = null, s.effectTag |= _o);
        }
        var E = We.sibling;
        if (E !== null)
          return E;
        We = s;
      } while (We !== null);
      return Zn === yu && (Zn = Pw), null;
    }
    function jw(e) {
      var t = e.expirationTime, s = e.childExpirationTime;
      return t > s ? t : s;
    }
    function MR(e) {
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
    function Cu(e) {
      var t = ed();
      return co(Li, ER.bind(null, e, t)), null;
    }
    function ER(e, t) {
      do
        tl();
      while (yd !== null);
      if (UR(), (rt & (wr | hs)) !== En)
        throw Error("Should not already be working.");
      var s = e.finishedWork, l = e.finishedExpirationTime;
      if (s === null)
        return null;
      if (e.finishedWork = null, e.finishedExpirationTime = Ae, s === e.current)
        throw Error("Cannot commit the same tree as before. This error is likely caused by a bug in React. Please file an issue.");
      e.callbackNode = null, e.callbackExpirationTime = Ae, e.callbackPriority = Kc, e.nextKnownPendingLevel = Ae, CA();
      var d = jw(s);
      hD(e, l, d), e === Gi && (Gi = null, We = null, ui = Ae);
      var p;
      if (s.effectTag > lr ? s.lastEffect !== null ? (s.lastEffect.nextEffect = s, p = s.firstEffect) : p = s : p = s.firstEffect, p !== null) {
        var w = rt;
        rt |= hs;
        var b = Pv(e);
        cC.current = null, gx(), n(e.containerInfo), Ue = p;
        do
          if (se(null, IR, null), oe()) {
            if (Ue === null)
              throw Error("Should be working on an effect.");
            var E = Oe();
            Tu(Ue, E), Ue = Ue.nextEffect;
          }
        while (Ue !== null);
        yx(), A0(), wx(), Ue = p;
        do
          if (se(null, AR, null, e, t), oe()) {
            if (Ue === null)
              throw Error("Should be working on an effect.");
            var N = Oe();
            Tu(Ue, N), Ue = Ue.nextEffect;
          }
        while (Ue !== null);
        bx(), a(e.containerInfo), e.current = s, Sx(), Ue = p;
        do
          if (se(null, RR, null, e, l), oe()) {
            if (Ue === null)
              throw Error("Should be working on an effect.");
            var k = Oe();
            Tu(Ue, k), Ue = Ue.nextEffect;
          }
        while (Ue !== null);
        xx(), Ue = null, kA(), _v(b), rt = w;
      } else
        e.current = s, gx(), yx(), A0(), wx(), bx(), Sx(), xx();
      TA();
      var X = zh;
      if (zh)
        zh = !1, yd = e, Ow = l, Oh = t;
      else
        for (Ue = p; Ue !== null; ) {
          var L = Ue.nextEffect;
          Ue.nextEffect = null, Ue = L;
        }
      var J = e.firstPendingTime;
      if (J !== Ae) {
        if (bu !== null) {
          var me = bu;
          bu = null;
          for (var we = 0; we < me.length; we++)
            NC(e, me[we], e.memoizedInteractions);
        }
        nl(e, J);
      } else
        gd = null;
      if (X || PC(e, l), J === Ct ? e === Lw ? Lh++ : (Lh = 0, Lw = e) : Lh = 0, JR(s.stateNode, l), br(e), Rv) {
        Rv = !1;
        var qe = zw;
        throw zw = null, qe;
      }
      return (rt & kw) !== En || us(), null;
    }
    function IR() {
      for (; Ue !== null; ) {
        var e = Ue.effectTag;
        if ((e & Ua) !== Pt) {
          Co(Ue), Nm();
          var t = Ue.alternate;
          V1(t, Ue), rr();
        }
        (e & Va) !== Pt && (zh || (zh = !0, hh(ha, function() {
          return tl(), null;
        }))), Ue = Ue.nextEffect;
      }
    }
    function AR(e, t) {
      for (; Ue !== null; ) {
        Co(Ue);
        var s = Ue.effectTag;
        if (s & Ri && K1(Ue), s & pi) {
          var l = Ue.alternate;
          l !== null && Q1(l);
        }
        var d = s & (xn | xt | Us | $i);
        switch (d) {
          case xn: {
            aC(Ue), Ue.effectTag &= ~xn;
            break;
          }
          case _p: {
            aC(Ue), Ue.effectTag &= ~xn;
            var p = Ue.alternate;
            Rw(p, Ue);
            break;
          }
          case $i: {
            Ue.effectTag &= ~$i;
            break;
          }
          case fc: {
            Ue.effectTag &= ~$i;
            var w = Ue.alternate;
            Rw(w, Ue);
            break;
          }
          case xt: {
            var b = Ue.alternate;
            Rw(b, Ue);
            break;
          }
          case Us: {
            X1(e, Ue, t);
            break;
          }
        }
        Nm(), rr(), Ue = Ue.nextEffect;
      }
    }
    function RR(e, t) {
      for (; Ue !== null; ) {
        Co(Ue);
        var s = Ue.effectTag;
        if (s & (xt | wf)) {
          Nm();
          var l = Ue.alternate;
          W1(e, l, Ue);
        }
        s & pi && (Nm(), $1(Ue)), rr(), Ue = Ue.nextEffect;
      }
    }
    function tl() {
      if (Oh !== Kc) {
        var e = Oh > ha ? ha : Oh;
        return Oh = Kc, co(e, DR);
      }
    }
    function DR() {
      if (yd === null)
        return !1;
      var e = yd, t = Ow;
      if (yd = null, Ow = Ae, (rt & (wr | hs)) !== En)
        throw Error("Cannot flush passive effects while already rendering.");
      var s = rt;
      rt |= hs;
      for (var l = Pv(e), d = e.current.firstEffect; d !== null; ) {
        {
          if (Co(d), se(null, H1, null, d), oe()) {
            if (d === null)
              throw Error("Should be working on an effect.");
            var p = Oe();
            Tu(d, p);
          }
          rr();
        }
        var w = d.nextEffect;
        d.nextEffect = null, d = w;
      }
      return _v(l), PC(e, t), rt = s, us(), Dv = yd === null ? 0 : Dv + 1, !0;
    }
    function TC(e) {
      return gd !== null && gd.has(e);
    }
    function NR(e) {
      gd === null ? gd = /* @__PURE__ */ new Set([e]) : gd.add(e);
    }
    function kR(e) {
      Rv || (Rv = !0, zw = e);
    }
    var PR = kR;
    function MC(e, t, s) {
      var l = Mw(s, t), d = lC(e, l, Ct);
      Xo(e, d);
      var p = Nv(e, Ct);
      p !== null && (br(p), nl(p, Ct));
    }
    function Tu(e, t) {
      if (e.tag === be) {
        MC(e, e, t);
        return;
      }
      for (var s = e.return; s !== null; ) {
        if (s.tag === be) {
          MC(s, e, t);
          return;
        } else if (s.tag === ue) {
          var l = s.type, d = s.stateNode;
          if (typeof l.getDerivedStateFromError == "function" || typeof d.componentDidCatch == "function" && !TC(d)) {
            var p = Mw(t, e), w = uC(
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
    function _R(e, t, s) {
      var l = e.pingCache;
      if (l !== null && l.delete(t), Gi === e && ui === s) {
        Zn === Mv || Zn === Tv && ho === Ct && vr() - _w < hC ? xu(e, ui) : Av = !0;
        return;
      }
      if (!!OC(e, s)) {
        var d = e.lastPingedTime;
        d !== Ae && d < s || (e.lastPingedTime = s, br(e), nl(e, s));
      }
    }
    function zR(e, t) {
      if (t === Ae) {
        var s = null, l = ps();
        t = Su(l, e, s);
      }
      var d = Nv(e, t);
      d !== null && (br(d), nl(d, t));
    }
    function OR(e, t) {
      var s = Ae, l;
      l = e.stateNode, l !== null && l.delete(t), zR(e, s);
    }
    function LR(e) {
      return e < 120 ? 120 : e < 480 ? 480 : e < 1080 ? 1080 : e < 1920 ? 1920 : e < 3e3 ? 3e3 : e < 4320 ? 4320 : iR(e / 1960) * 1960;
    }
    function BR(e, t, s) {
      var l = s.busyMinDurationMs | 0;
      if (l <= 0)
        return 0;
      var d = s.busyDelayMs | 0, p = vr(), w = xR(e, s), b = p - w;
      if (b <= d)
        return 0;
      var E = d + l - b;
      return E;
    }
    function jR() {
      if (Lh > aR)
        throw Lh = 0, Lw = null, Error("Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.");
      Dv > sR && (Dv = 0, g("Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render."));
    }
    function UR() {
      pa.flushLegacyContextWarning(), pa.flushPendingUnsafeLifecycleWarnings();
    }
    function EC() {
      var e = !0;
      vx(Bh, e), Bh = null;
    }
    function Uw() {
      var e = !1;
      vx(Bh, e), Bh = null;
    }
    function VR(e, t) {
      Gi !== null && t > ui && (Bh = e);
    }
    var Ov = null;
    function HR(e) {
      {
        var t = e.tag;
        if (t !== be && t !== ue && t !== _e && t !== D && t !== xe && t !== ge && t !== Mt)
          return;
        var s = Ce(e.type) || "ReactComponent";
        if (Ov !== null) {
          if (Ov.has(s))
            return;
          Ov.add(s);
        } else
          Ov = /* @__PURE__ */ new Set([s]);
        g("Can't perform a React state update on an unmounted component. This is a no-op, but it indicates a memory leak in your application. To fix, cancel all subscriptions and asynchronous tasks in %s.%s", t === ue ? "the componentWillUnmount method" : "a useEffect cleanup function", Fn(e));
      }
    }
    var Vw;
    {
      var WR = null;
      Vw = function(e, t, s) {
        var l = zC(WR, t);
        try {
          return $0(e, t, s);
        } catch (p) {
          if (p !== null && typeof p == "object" && typeof p.then == "function")
            throw p;
          if (Fm(), v0(), J0(t), zC(t, l), t.mode & cs && uw(t), se(null, $0, null, e, t, s), oe()) {
            var d = Oe();
            throw d;
          } else
            throw p;
        }
      };
    }
    var IC = !1, Hw;
    Hw = /* @__PURE__ */ new Set();
    function FR(e) {
      if (vl && (rt & wr) !== En)
        switch (e.tag) {
          case _e:
          case D:
          case ge: {
            var t = We && Ce(We.type) || "Unknown", s = t;
            if (!Hw.has(s)) {
              Hw.add(s);
              var l = Ce(e.type) || "Unknown";
              g("Cannot update a component (`%s`) while rendering a different component (`%s`). To locate the bad setState() call inside `%s`, follow the stack trace as described in https://fb.me/setstate-in-render", l, t, t);
            }
            break;
          }
          case ue: {
            IC || (g("Cannot update during an existing state transition (such as within `render`). Render methods should be a pure function of props and state."), IC = !0);
            break;
          }
        }
    }
    var Mu = {
      current: !1
    };
    function AC(e) {
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
    function RC(e) {
      (e.mode & gn) !== oi && Nw.current === !1 && Mu.current === !1 && g(`An update to %s ran an effect, but was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://fb.me/react-wrap-tests-with-act%s`, Ce(e.type), Fn(e));
    }
    function $R(e) {
      rt === En && Nw.current === !1 && Mu.current === !1 && g(`An update to %s inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://fb.me/react-wrap-tests-with-act%s`, Ce(e.type), Fn(e));
    }
    var QR = $R, DC = !1;
    function ZR(e) {
      DC === !1 && o.unstable_flushAllWithoutAsserting === void 0 && (e.mode & Hr || e.mode & td) && (DC = !0, g(`In Concurrent or Sync modes, the "scheduler" module needs to be mocked to guarantee consistent behaviour across tests and browsers. For example, with jest: 
jest.mock('scheduler', () => require('scheduler/unstable_mock'));

For more info, visit https://fb.me/react-mock-scheduler`));
    }
    function Ww(e, t) {
      return t * 1e3 + e.interactionThreadID;
    }
    function Fw(e) {
      bu === null ? bu = [e] : bu.push(e);
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
          var w = Ww(e, t);
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
          var d = Ww(e, t);
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
    function PC(e, t) {
      var s = e.firstPendingTime, l;
      try {
        if (l = h.__subscriberRef.current, l !== null && e.memoizedInteractions.size > 0) {
          var d = Ww(e, t);
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
    var $w = null, Qw = null, Zw = null, wd = !1, YR = typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u";
    function GR(e) {
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
            var p = (l.current.effectTag & Ut) === Ut;
            if (Er) {
              var w = oR(), b = Fx(w, d);
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
    function XR(e, t) {
      typeof $w == "function" && $w(e, t);
    }
    function JR(e, t) {
      typeof Qw == "function" && Qw(e, t);
    }
    function qR(e) {
      typeof Zw == "function" && Zw(e);
    }
    var Yw;
    {
      Yw = !1;
      try {
        var _C = Object.preventExtensions({}), KR = /* @__PURE__ */ new Map([[_C, null]]), eD = /* @__PURE__ */ new Set([_C]);
        KR.set(0, 0), eD.add(0);
      } catch {
        Yw = !0;
      }
    }
    var tD = 1;
    function nD(e, t, s, l) {
      this.tag = e, this.key = s, this.elementType = null, this.type = null, this.stateNode = null, this.return = null, this.child = null, this.sibling = null, this.index = 0, this.ref = null, this.pendingProps = t, this.memoizedProps = null, this.updateQueue = null, this.memoizedState = null, this.dependencies = null, this.mode = l, this.effectTag = Pt, this.nextEffect = null, this.firstEffect = null, this.lastEffect = null, this.expirationTime = Ae, this.childExpirationTime = Ae, this.alternate = null, this.actualDuration = Number.NaN, this.actualStartTime = Number.NaN, this.selfBaseDuration = Number.NaN, this.treeBaseDuration = Number.NaN, this.actualDuration = 0, this.actualStartTime = -1, this.selfBaseDuration = 0, this.treeBaseDuration = 0, this._debugID = tD++, this._debugIsCurrentlyTiming = !1, this._debugSource = null, this._debugOwner = null, this._debugNeedsRemount = !1, this._debugHookTypes = null, !Yw && typeof Object.preventExtensions == "function" && Object.preventExtensions(this);
    }
    var ya = function(e, t, s, l) {
      return new nD(e, t, s, l);
    };
    function Gw(e) {
      var t = e.prototype;
      return !!(t && t.isReactComponent);
    }
    function iD(e) {
      return typeof e == "function" && !Gw(e) && e.defaultProps === void 0;
    }
    function rD(e) {
      if (typeof e == "function")
        return Gw(e) ? ue : _e;
      if (e != null) {
        var t = e.$$typeof;
        if (t === ni)
          return D;
        if (t === ta)
          return xe;
      }
      return Qe;
    }
    function Eu(e, t) {
      var s = e.alternate;
      s === null ? (s = ya(e.tag, t, e.key, e.mode), s.elementType = e.elementType, s.type = e.type, s.stateNode = e.stateNode, s._debugID = e._debugID, s._debugSource = e._debugSource, s._debugOwner = e._debugOwner, s._debugHookTypes = e._debugHookTypes, s.alternate = e, e.alternate = s) : (s.pendingProps = t, s.effectTag = Pt, s.nextEffect = null, s.firstEffect = null, s.lastEffect = null, s.actualDuration = 0, s.actualStartTime = -1), s.childExpirationTime = e.childExpirationTime, s.expirationTime = e.expirationTime, s.child = e.child, s.memoizedProps = e.memoizedProps, s.memoizedState = e.memoizedState, s.updateQueue = e.updateQueue;
      var l = e.dependencies;
      switch (s.dependencies = l === null ? null : {
        expirationTime: l.expirationTime,
        firstContext: l.firstContext,
        responders: l.responders
      }, s.sibling = e.sibling, s.index = e.index, s.ref = e.ref, s.selfBaseDuration = e.selfBaseDuration, s.treeBaseDuration = e.treeBaseDuration, s._debugNeedsRemount = e._debugNeedsRemount, s.tag) {
        case Qe:
        case _e:
        case ge:
          s.type = id(e.type);
          break;
        case ue:
          s.type = fy(e.type);
          break;
        case D:
          s.type = hy(e.type);
          break;
      }
      return s;
    }
    function aD(e, t) {
      e.effectTag &= xn, e.nextEffect = null, e.firstEffect = null, e.lastEffect = null;
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
    function sD(e) {
      var t;
      return e === IA ? t = td | Hr | gn : e === EA ? t = Hr | gn : t = oi, YR && (t |= cs), ya(be, null, null, t);
    }
    function Xw(e, t, s, l, d, p) {
      var w, b = Qe, E = e;
      if (typeof e == "function")
        Gw(e) ? (b = ue, E = fy(E)) : E = id(E);
      else if (typeof e == "string")
        b = Re;
      else {
        e:
          switch (e) {
            case Be:
              return il(s.children, d, p, t);
            case Tn:
              b = Bt, d |= td | Hr | gn;
              break;
            case et:
              b = Bt, d |= gn;
              break;
            case Nt:
              return oD(s, d, p, t);
            case ii:
              return lD(s, d, p, t);
            case So:
              return uD(s, d, p, t);
            default: {
              if (typeof e == "object" && e !== null)
                switch (e.$$typeof) {
                  case vn:
                    b = re;
                    break e;
                  case Sn:
                    b = Ye;
                    break e;
                  case ni:
                    b = D, E = hy(E);
                    break e;
                  case ta:
                    b = xe;
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
                var k = l ? Ce(l.type) : null;
                k && (N += `

Check the render method of \`` + k + "`.");
              }
              throw Error("Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: " + (e == null ? e : typeof e) + "." + N);
            }
          }
      }
      return w = ya(b, s, t, d), w.elementType = e, w.type = E, w.expirationTime = p, w;
    }
    function Jw(e, t, s) {
      var l = null;
      l = e._owner;
      var d = e.type, p = e.key, w = e.props, b = Xw(d, p, w, l, t, s);
      return b._debugSource = e._source, b._debugOwner = e._owner, b;
    }
    function il(e, t, s, l) {
      var d = ya(Tt, e, l, t);
      return d.expirationTime = s, d;
    }
    function oD(e, t, s, l) {
      (typeof e.id != "string" || typeof e.onRender != "function") && g('Profiler must specify an "id" string and "onRender" function as props');
      var d = ya(B, e, l, t | cs);
      return d.elementType = Nt, d.type = Nt, d.expirationTime = s, d;
    }
    function lD(e, t, s, l) {
      var d = ya(ee, e, l, t);
      return d.type = ii, d.elementType = ii, d.expirationTime = s, d;
    }
    function uD(e, t, s, l) {
      var d = ya(dt, e, l, t);
      return d.type = So, d.elementType = So, d.expirationTime = s, d;
    }
    function qw(e, t, s) {
      var l = ya(Fe, e, null, t);
      return l.expirationTime = s, l;
    }
    function cD() {
      var e = ya(Re, null, null, oi);
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
    function zC(e, t) {
      return e === null && (e = ya(Qe, null, null, oi)), e.tag = t.tag, e.key = t.key, e.elementType = t.elementType, e.type = t.type, e.stateNode = t.stateNode, e.return = t.return, e.child = t.child, e.sibling = t.sibling, e.index = t.index, e.ref = t.ref, e.pendingProps = t.pendingProps, e.memoizedProps = t.memoizedProps, e.updateQueue = t.updateQueue, e.memoizedState = t.memoizedState, e.dependencies = t.dependencies, e.mode = t.mode, e.effectTag = t.effectTag, e.nextEffect = t.nextEffect, e.firstEffect = t.firstEffect, e.lastEffect = t.lastEffect, e.expirationTime = t.expirationTime, e.childExpirationTime = t.childExpirationTime, e.alternate = t.alternate, e.actualDuration = t.actualDuration, e.actualStartTime = t.actualStartTime, e.selfBaseDuration = t.selfBaseDuration, e.treeBaseDuration = t.treeBaseDuration, e._debugID = t._debugID, e._debugSource = t._debugSource, e._debugOwner = t._debugOwner, e._debugIsCurrentlyTiming = t._debugIsCurrentlyTiming, e._debugNeedsRemount = t._debugNeedsRemount, e._debugHookTypes = t._debugHookTypes, e;
    }
    function dD(e, t, s) {
      this.tag = t, this.current = null, this.containerInfo = e, this.pendingChildren = null, this.pingCache = null, this.finishedExpirationTime = Ae, this.finishedWork = null, this.timeoutHandle = De, this.context = null, this.pendingContext = null, this.hydrate = s, this.callbackNode = null, this.callbackPriority = Kc, this.firstPendingTime = Ae, this.firstSuspendedTime = Ae, this.lastSuspendedTime = Ae, this.nextKnownPendingLevel = Ae, this.lastPingedTime = Ae, this.lastExpiredTime = Ae, this.interactionThreadID = h.unstable_getThreadID(), this.memoizedInteractions = /* @__PURE__ */ new Set(), this.pendingInteractionMap = /* @__PURE__ */ new Map();
    }
    function fD(e, t, s, l) {
      var d = new dD(e, t, s), p = sD(t);
      return d.current = p, p.stateNode = d, Sy(p), d;
    }
    function OC(e, t) {
      var s = e.firstSuspendedTime, l = e.lastSuspendedTime;
      return s !== Ae && s >= t && l <= t;
    }
    function Iu(e, t) {
      var s = e.firstSuspendedTime, l = e.lastSuspendedTime;
      s < t && (e.firstSuspendedTime = t), (l > t || s === Ae) && (e.lastSuspendedTime = t), t <= e.lastPingedTime && (e.lastPingedTime = Ae), t <= e.lastExpiredTime && (e.lastExpiredTime = Ae);
    }
    function LC(e, t) {
      var s = e.firstPendingTime;
      t > s && (e.firstPendingTime = t);
      var l = e.firstSuspendedTime;
      l !== Ae && (t >= l ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = Ae : t >= e.lastSuspendedTime && (e.lastSuspendedTime = t + 1), t > e.nextKnownPendingLevel && (e.nextKnownPendingLevel = t));
    }
    function hD(e, t, s) {
      e.firstPendingTime = s, t <= e.lastSuspendedTime ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = Ae : t <= e.firstSuspendedTime && (e.firstSuspendedTime = t - 1), t <= e.lastPingedTime && (e.lastPingedTime = Ae), t <= e.lastExpiredTime && (e.lastExpiredTime = Ae);
    }
    function eb(e, t) {
      var s = e.lastExpiredTime;
      (s === Ae || s > t) && (e.lastExpiredTime = t);
    }
    var tb, nb;
    tb = !1, nb = {};
    function pD(e) {
      if (!e)
        return mr;
      var t = ua(e), s = MA(t);
      if (t.tag === ue) {
        var l = t.type;
        if (ls(l))
          return Mx(t, l, s);
      }
      return s;
    }
    function mD(e, t) {
      {
        var s = ua(e);
        if (s === void 0)
          throw typeof e.render == "function" ? Error("Unable to find node on an unmounted component.") : Error("Argument appears to not be a ReactComponent. Keys: " + Object.keys(e));
        var l = Cf(s);
        if (l === null)
          return null;
        if (l.mode & gn) {
          var d = Ce(s.type) || "Component";
          nb[d] || (nb[d] = !0, s.mode & gn ? g("%s is deprecated in StrictMode. %s was passed an instance of %s which is inside StrictMode. Instead, add a ref directly to the element you want to reference. Learn more about using refs safely here: https://fb.me/react-strict-mode-find-node%s", t, t, d, Fn(l)) : g("%s is deprecated in StrictMode. %s was passed an instance of %s which renders StrictMode children. Instead, add a ref directly to the element you want to reference. Learn more about using refs safely here: https://fb.me/react-strict-mode-find-node%s", t, t, d, Fn(l)));
        }
        return l.stateNode;
      }
    }
    function vD(e, t, s, l) {
      return fD(e, t, s);
    }
    function Uh(e, t, s, l) {
      XR(t, e);
      var d = t.current, p = ps();
      typeof jest < "u" && (ZR(d), AC(d));
      var w = Ch(), b = Su(p, d, w), E = pD(s);
      t.context === null ? t.context = E : t.pendingContext = E, vl && na !== null && !tb && (tb = !0, g(`Render methods should be a pure function of props and state; triggering nested component updates from render is not allowed. If necessary, trigger nested updates in componentDidUpdate.

Check the render method of %s.`, Ce(na.type) || "Unknown"));
      var N = Go(b, w);
      return N.payload = {
        element: e
      }, l = l === void 0 ? null : l, l !== null && (typeof l != "function" && g("render(...): Expected the last optional `callback` argument to be a function. Instead received: %s.", l), N.callback = l), Xo(d, N), Zr(d, b), b;
    }
    function ib(e) {
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
    function rb(e, t) {
      BC(e, t);
      var s = e.alternate;
      s && BC(s, t);
    }
    function gD(e) {
      if (e.tag === ee) {
        var t = Wx(ps());
        Zr(e, t), rb(e, t);
      }
    }
    function yD(e) {
      e.tag === ee && (Zr(e, jx), rb(e, jx));
    }
    function wD(e) {
      if (e.tag === ee) {
        var t = ps(), s = Su(t, e, null);
        Zr(e, s), rb(e, s);
      }
    }
    function jC(e) {
      var t = Ol(e);
      return t === null ? null : t.tag === gt ? t.stateNode.instance : t.stateNode;
    }
    var UC = function(e) {
      return !1;
    };
    function bD(e) {
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
    function SD(e) {
      var t = e.findFiberByHostInstance, s = m.ReactCurrentDispatcher;
      return GR(i({}, e, {
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
        findHostInstancesForRefresh: VA,
        scheduleRefresh: jA,
        scheduleRoot: UA,
        setRefreshHandler: BA,
        getCurrentFiber: function() {
          return na;
        }
      }));
    }
    m.IsSomeRendererActing;
    function ab(e, t, s) {
      this._internalRoot = xD(e, t, s);
    }
    ab.prototype.render = function(e) {
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
    }, ab.prototype.unmount = function() {
      typeof arguments[0] == "function" && g("unmount(...): does not support a callback argument. To execute a side effect after rendering, declare it in a component body with useEffect().");
      var e = this._internalRoot, t = e.containerInfo;
      Uh(null, e, null, function() {
        OS(t);
      });
    };
    function xD(e, t, s) {
      var l = s != null && s.hydrate === !0;
      s != null && s.hydrationOptions;
      var d = vD(e, t, l);
      if (rI(d.current, e), l && t !== Ix) {
        var p = e.nodeType === ka ? e : e.ownerDocument;
        bc(e, p);
      }
      return d;
    }
    function CD(e, t) {
      return new ab(e, Ix, t);
    }
    function bd(e) {
      return !!(e && (e.nodeType === ar || e.nodeType === ka || e.nodeType === qu || e.nodeType === ai && e.nodeValue === " react-mount-point-unstable "));
    }
    var TD = m.ReactCurrentOwner, ZC, YC = !1;
    ZC = function(e) {
      if (e._reactRootContainer && e.nodeType !== ai) {
        var t = jC(e._reactRootContainer._internalRoot.current);
        t && t.parentNode !== e && g("render(...): It looks like the React-rendered content of this container was removed without using React. This is not supported and will cause errors. Instead, call ReactDOM.unmountComponentAtNode to empty a container.");
      }
      var s = !!e._reactRootContainer, l = Lv(e), d = !!(l && Zo(l));
      d && !s && g("render(...): Replacing React-rendered children with a new root component. If you intended to update the children of this node, you should instead have the existing children update their state and render the new components instead of calling ReactDOM.render."), e.nodeType === ar && e.tagName && e.tagName.toUpperCase() === "BODY" && g("render(): Rendering components directly into document.body is discouraged, since its children are often manipulated by third-party scripts and browser extensions. This may lead to subtle reconciliation issues. Try rendering into a container element created for your app.");
    };
    function Lv(e) {
      return e ? e.nodeType === ka ? e.documentElement : e.firstChild : null;
    }
    function MD(e) {
      var t = Lv(e);
      return !!(t && t.nodeType === ar && t.hasAttribute(de));
    }
    function ED(e, t) {
      var s = t || MD(e);
      if (!s)
        for (var l = !1, d; d = e.lastChild; )
          !l && d.nodeType === ar && d.hasAttribute(de) && (l = !0, g("render(): Target node has markup rendered by React, but there are unrelated nodes as well. This is most commonly caused by white-space inserted around server-rendered markup.")), e.removeChild(d);
      return s && !t && !YC && (YC = !0, y("render(): Calling ReactDOM.render() to hydrate server-rendered markup will stop working in React v17. Replace the ReactDOM.render() call with ReactDOM.hydrate() if you want React to attach to the server HTML.")), CD(e, s ? {
        hydrate: !0
      } : void 0);
    }
    function ID(e, t) {
      e !== null && typeof e != "function" && g("%s(...): Expected the last optional `callback` argument to be a function. Instead received: %s.", t, e);
    }
    function Bv(e, t, s, l, d) {
      ZC(s), ID(d === void 0 ? null : d, "render");
      var p = s._reactRootContainer, w;
      if (p) {
        if (w = p._internalRoot, typeof d == "function") {
          var E = d;
          d = function() {
            var N = ib(w);
            E.call(N);
          };
        }
        Uh(t, w, e, d);
      } else {
        if (p = s._reactRootContainer = ED(s, l), w = p._internalRoot, typeof d == "function") {
          var b = d;
          d = function() {
            var N = ib(w);
            b.call(N);
          };
        }
        vC(function() {
          Uh(t, w, e, d);
        });
      }
      return ib(w);
    }
    function AD(e) {
      {
        var t = TD.current;
        if (t !== null && t.stateNode !== null) {
          var s = t.stateNode._warnedAboutRefsInRender;
          s || g("%s is accessing findDOMNode inside its render(). render() should be a pure function of props and state. It should never access something that requires stale data from the previous render, such as refs. Move this logic to componentDidMount and componentDidUpdate instead.", Ce(t.type) || "A component"), t.stateNode._warnedAboutRefsInRender = !0;
        }
      }
      return e == null ? null : e.nodeType === ar ? e : mD(e, "findDOMNode");
    }
    function RD(e, t, s) {
      if (!bd(t))
        throw Error("Target container is not a DOM element.");
      {
        var l = Vg(t) && t._reactRootContainer === void 0;
        l && g("You are calling ReactDOM.hydrate() on a container that was previously passed to ReactDOM.createRoot(). This is not supported. Did you mean to call createRoot(container, {hydrate: true}).render(element)?");
      }
      return Bv(null, e, t, !0, s);
    }
    function DD(e, t, s) {
      if (!bd(t))
        throw Error("Target container is not a DOM element.");
      {
        var l = Vg(t) && t._reactRootContainer === void 0;
        l && g("You are calling ReactDOM.render() on a container that was previously passed to ReactDOM.createRoot(). This is not supported. Did you mean to call root.render(element)?");
      }
      return Bv(null, e, t, !1, s);
    }
    function ND(e, t, s, l) {
      if (!bd(s))
        throw Error("Target container is not a DOM element.");
      if (!(e != null && yf(e)))
        throw Error("parentComponent must be a valid React Component");
      return Bv(e, t, s, !1, l);
    }
    function kD(e) {
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
        return vC(function() {
          Bv(null, null, e, !1, function() {
            e._reactRootContainer = null, OS(e);
          });
        }), !0;
      } else {
        {
          var d = Lv(e), p = !!(d && Zo(d)), w = e.nodeType === ar && bd(e.parentNode) && !!e.parentNode._reactRootContainer;
          p && g("unmountComponentAtNode(): The node you're attempting to unmount was rendered by React and is not a top-level container. %s", w ? "You may have accidentally passed in a React root node instead of its container." : "Instead, have the parent component update its state and rerender in order to remove this component.");
        }
        return !1;
      }
    }
    function PD(e, t, s) {
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
    Ef(gD), gc(yD), wc(wD);
    var XC = !1;
    (typeof Map != "function" || Map.prototype == null || typeof Map.prototype.forEach != "function" || typeof Set != "function" || Set.prototype == null || typeof Set.prototype.clear != "function" || typeof Set.prototype.forEach != "function") && g("React depends on Map and Set built-in types. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"), Ea(hm), Ts(mC, mR, dR, pR);
    function JC(e, t) {
      var s = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
      if (!bd(t))
        throw Error("Target container is not a DOM element.");
      return PD(e, t, null, s);
    }
    function _D(e, t, s, l) {
      return ND(e, t, s, l);
    }
    function zD(e, t) {
      var s = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
      return XC || (XC = !0, y('The ReactDOM.unstable_createPortal() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactDOM.createPortal() instead. It has the exact same API, but without the "unstable_" prefix.')), JC(e, t, s);
    }
    var OD = {
      Events: [Zo, iu, Hg, Mr, st, $c, mI, Ti, Cs, Fl, mc, tl, Mu]
    }, LD = SD({
      findFiberByHostInstance: eh,
      bundleType: 1,
      version: GC,
      rendererPackageName: "react-dom"
    });
    if (!LD && Bn && window.top === window.self && (navigator.userAgent.indexOf("Chrome") > -1 && navigator.userAgent.indexOf("Edge") === -1 || navigator.userAgent.indexOf("Firefox") > -1)) {
      var qC = window.location.protocol;
      /^(https?|file):$/.test(qC) && console.info("%cDownload the React DevTools for a better development experience: https://fb.me/react-devtools" + (qC === "file:" ? `
You might need to use a local HTTP server (instead of file://): https://fb.me/react-devtools-faq` : ""), "font-weight:bold");
    }
    xr.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = OD, xr.createPortal = JC, xr.findDOMNode = AD, xr.flushSync = gC, xr.hydrate = RD, xr.render = DD, xr.unmountComponentAtNode = kD, xr.unstable_batchedUpdates = mC, xr.unstable_createPortal = zD, xr.unstable_renderSubtreeIntoContainer = _D, xr.version = GC;
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
  process.env.NODE_ENV === "production" ? (i(), r.exports = uO()) : r.exports = hO();
})(zE);
const iM = /* @__PURE__ */ PE(zE.exports);
var pO = Object.defineProperty, mO = Object.defineProperties, vO = Object.getOwnPropertyDescriptors, rM = Object.getOwnPropertySymbols, gO = Object.prototype.hasOwnProperty, yO = Object.prototype.propertyIsEnumerable, aM = (r, i, o) => i in r ? pO(r, i, { enumerable: !0, configurable: !0, writable: !0, value: o }) : r[i] = o, Tr = (r, i) => {
  for (var o in i || (i = {}))
    gO.call(i, o) && aM(r, o, i[o]);
  if (rM)
    for (var o of rM(i))
      yO.call(i, o) && aM(r, o, i[o]);
  return r;
};
const LE = { src: "", currentTime: 0, hostTime: 0, muted: !1, paused: !0, volume: 1 }, BE = { currentTimeMaxError: 1, syncInterval: 1e3, retryInterval: 15e3, verbose: !1, log: console.log.bind(console) };
let mo = BE;
function jE(r) {
  mo = Tr(Tr({}, BE), r);
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
const wO = navigator.userAgent.includes("Safari"), bO = [".aac", ".mid", ".midi", ".mp3", ".ogg", ".oga", ".wav", ".weba"];
var SO = typeof global == "object" && global && global.Object === Object && global, xO = typeof self == "object" && self && self.Object === Object && self, UE = SO || xO || Function("return this")(), og = UE.Symbol, VE = Object.prototype, CO = VE.hasOwnProperty, TO = VE.toString, $h = og ? og.toStringTag : void 0, MO = Object.prototype.toString, sM = og ? og.toStringTag : void 0;
function EO(r) {
  return r == null ? r === void 0 ? "[object Undefined]" : "[object Null]" : sM && sM in Object(r) ? function(i) {
    var o = CO.call(i, $h), c = i[$h];
    try {
      i[$h] = void 0;
      var h = !0;
    } catch {
    }
    var m = TO.call(i);
    return h && (o ? i[$h] = c : delete i[$h]), m;
  }(r) : function(i) {
    return MO.call(i);
  }(r);
}
var IO = /\s/, AO = /^\s+/;
function RO(r) {
  return r && r.slice(0, function(i) {
    for (var o = i.length; o-- && IO.test(i.charAt(o)); )
      ;
    return o;
  }(r) + 1).replace(AO, "");
}
function Kb(r) {
  var i = typeof r;
  return r != null && (i == "object" || i == "function");
}
var DO = /^[-+]0x[0-9a-f]+$/i, NO = /^0b[01]+$/i, kO = /^0o[0-7]+$/i, PO = parseInt;
function oM(r) {
  if (typeof r == "number")
    return r;
  if (function(c) {
    return typeof c == "symbol" || function(h) {
      return h != null && typeof h == "object";
    }(c) && EO(c) == "[object Symbol]";
  }(r))
    return NaN;
  if (Kb(r)) {
    var i = typeof r.valueOf == "function" ? r.valueOf() : r;
    r = Kb(i) ? i + "" : i;
  }
  if (typeof r != "string")
    return r === 0 ? r : +r;
  r = RO(r);
  var o = NO.test(r);
  return o || kO.test(r) ? PO(r.slice(2), o ? 2 : 8) : DO.test(r) ? NaN : +r;
}
var Nb = function() {
  return UE.Date.now();
}, _O = Math.max, zO = Math.min;
function Yv(r, i, o) {
  var c, h, m, y, g, S, C = 0, A = !1, I = !1, z = !0;
  if (typeof r != "function")
    throw new TypeError("Expected a function");
  function F(Z) {
    var ce = c, oe = h;
    return c = h = void 0, C = Z, y = r.apply(oe, ce);
  }
  function $(Z) {
    return C = Z, g = setTimeout(q, i), A ? F(Z) : y;
  }
  function K(Z) {
    var ce = Z - S;
    return S === void 0 || ce >= i || ce < 0 || I && Z - C >= m;
  }
  function q() {
    var Z = Nb();
    if (K(Z))
      return fe(Z);
    g = setTimeout(q, function(ce) {
      var oe = i - (ce - S);
      return I ? zO(oe, m - (ce - C)) : oe;
    }(Z));
  }
  function fe(Z) {
    return g = void 0, z && c ? F(Z) : (c = h = void 0, y);
  }
  function se() {
    var Z = Nb(), ce = K(Z);
    if (c = arguments, h = this, S = Z, ce) {
      if (g === void 0)
        return $(S);
      if (I)
        return clearTimeout(g), g = setTimeout(q, i), F(S);
    }
    return g === void 0 && (g = setTimeout(q, i)), y;
  }
  return i = oM(i) || 0, Kb(o) && (A = !!o.leading, m = (I = "maxWait" in o) ? _O(oM(o.maxWait) || 0, i) : m, z = "trailing" in o ? !!o.trailing : z), se.cancel = function() {
    g !== void 0 && clearTimeout(g), C = 0, c = S = h = g = void 0;
  }, se.flush = function() {
    return g === void 0 ? y : fe(Nb());
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
class OO extends dl.exports.Component {
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
    return wt.createElement("div", { className: "player-controller", style: { opacity: this.props.visible ? "1" : "0" } }, wt.createElement("div", { className: "player-controller-progress" }, wt.createElement(lM, { total: i, current: this.state.currentTime, onChange: this.onChange, buffered: this.props.buffered, bufferColor: "rgba(255,255,255,0.3)", hideHoverTime: !0, limitTimeTooltipBySides: !0, onSeekStart: this.onProgressSeekStart, onSeekEnd: this.onProgressSeekEnd, play: this.props.play, pause: this.props.pause, paused: this.props.paused, scale: this.props.scale })), wt.createElement("div", { className: "player-controller-actions" }, wt.createElement("div", { className: "player-controller-actions-left" }, wt.createElement("div", { onClick: this.onClickOperationButton, className: "player-controller-play" }, this.operationButton()), wt.createElement("div", { className: "player-volume-box", onMouseEnter: () => this.setState({ isVolumeHover: !0 }), onMouseLeave: () => this.setState({ isVolumeHover: !1 }) }, wt.createElement("div", { onClick: this.handleClickVolume, className: "player-volume" }, this.operationVolumeButton()), wt.createElement("div", { className: "player-volume-slider" }, wt.createElement(lM, { total: 100, current: 100 * this.state.seekVolume, onChange: this.onVolumeChange, onSeekStart: this.onVolumeSeekStart, onSeekEnd: this.onVolumeSeekEnd, scale: this.props.scale, limitTimeTooltipBySides: !0, hideHoverTime: !0 })))), wt.createElement("div", { className: "player-mid-box-time" }, uM(Math.floor(o / 1e3)), " /", " ", uM(Math.floor(i / 1e3)))));
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
let LO = 99999;
var eS, Sd;
(Sd = eS || (eS = {}))[Sd.Idle = 0] = "Idle", Sd[Sd.Playing = 1] = "Playing", Sd[Sd.Paused = 2] = "Paused";
let ji = {};
function Yn(r, ...i) {
  mo.verbose && console.log(`[RTCEffect] ${r}`, ...i);
}
function BO(r, i, o) {
  function c(m) {
    ji[m].playState === 0 ? (r.playEffect(m, o, 0, 1, 0, 100, !1, 0).then(() => {
      Yn(">>> Play Success", { playingId: m });
    }), ji[m].playState = 1) : Yn(">>> Skip Play", { playingId: m, state: ji[m].playState });
  }
  function h(m) {
    ji[m].playState = 0, ji[m].previousVideoJSAdvance = 0, ji[m].previousSeekTargetTime = 0, ji[m].previousBeginSeekTime = 0;
  }
  i.one("ready", () => {
    var m;
    const y = ((m = i == null ? void 0 : i.tagAttributes) == null ? void 0 : m.src) || "";
    y.endsWith("mp3") || y.endsWith("wav") || y.endsWith("m4a") || (Yn(">>> Mute js player", { src: y }), i.muted(!0), i.muted = (S) => !1);
    const g = function() {
      const S = LO--, C = { playState: eS.Idle, previousVideoJSAdvance: 0, previousSeekTargetTime: 0, previousBeginSeekTime: 0 };
      return ji[S] = C, S;
    }();
    Yn(">>> Setup", { playingId: g, src: y }), r.addListener("error", (S) => {
      Yn(">>> Error", { soundId: S }), h(S);
    }), r.addListener("effectFinished", (S) => {
      Yn(">>> Finished", { soundId: S }), h(S);
    }), i.on("play", () => {
      switch (ji[g].playState) {
        case 0:
          Yn(">>> Start play", { playingId: g }), c(g);
          break;
        case 2:
          Yn(">>> Resume play", { playingId: g }), r.resumeEffect(g), ji[g].playState = 1;
      }
    }), i.on("pause", () => {
      const S = ji[g].playState;
      switch (S) {
        case 1:
          Yn(">>> Pause play", { playingId: g }), r.pauseEffect(g), ji[g].playState = 2;
          break;
        default:
          Yn(">>> Skip Pause", { playingId: g, currenState: S });
      }
    }), i.on("timeupdate", () => {
      r.getEffectCurrentPosition(g).then((S) => {
        const C = ji[g], A = S / 1e3, I = i.currentTime(), z = C.previousSeekTargetTime !== 0 && C.previousBeginSeekTime !== 0;
        if (Yn(`>>> EffectSecond rtc: ${A} js: ${I} seeking: ${z}`, { playingId: g }), C.playState == 0)
          return void (i.paused() || (Yn(">>> Play effect due to time update.", { playingId: g }), c(g)));
        if (z && A < C.previousSeekTargetTime)
          return;
        if (C.playState !== 1)
          return void Yn(">>> Skip timupdate", { playingId: g, state: C.playState, jsTime: i.currentTime(), rtcEffectTime: A });
        function F(K, q) {
          r.setEffectPosition(q, 1e3 * K), C.previousBeginSeekTime = Date.now() / 1e3, C.previousSeekTargetTime = K;
        }
        const $ = C.previousBeginSeekTime;
        if (S > 0) {
          const K = I - A, q = Math.abs(K), fe = 0.5;
          if (q > fe)
            if (z) {
              const se = C.previousSeekTargetTime - A, Z = Date.now() / 1e3 - $, ce = Z + (K > 0 ? K : 0), oe = I + ce;
              F(oe, g), Yn(">>> Start seeking after seeking lag", { jsPlayerTime: I, rtcEffectTime: A, jsPlayerTimerAdvance: K, lastSeekingCost: Z, estimatedRTCLag: ce, targetRTCSeekTime: oe, previousBeginSeekTime: $, timeElapse: se });
            } else if (q > 10)
              F(I, g), Yn(">>> DirectSeek", { time: I, rtcEffectTime: A, jsPlayerTimerAdvance: K });
            else {
              const se = C.previousVideoJSAdvance, Z = 0, ce = I + Z;
              C.previousVideoJSAdvance = Z, F(ce, g), Yn(">>> Start seeking with lag", { jsPlayerTime: I, rtcEffectTime: A, jsPlayerTimerAdvance: K, previousAdvance: se, estimatedRTCLag: Z, targetRTCSeekTime: ce });
            }
          else
            z && (Yn(">>> SeekingFinish no lag", { jsPlayerTime: I, rtcEffectTime: A, jsPlayerTimerAdvance: K, previousBeginSeekTime: $, rtcLagTolerance: fe }), C.previousBeginSeekTime = 0, C.previousSeekTargetTime = 0);
        }
      });
    }), i.on("dispose", () => {
      ji[g].playState && (r.stopEffect(g), delete ji[g], Yn(">>> Dispose", { playingId: g }));
    });
  });
}
class jO extends dl.exports.Component {
  constructor() {
    super(...arguments), this.putAttributes = (i) => {
      const { context: o } = this.props, c = o.getAttributes() || {};
      for (const h in i)
        c[h] !== i[h] && o.updateAttributes([h], i[h]);
    };
  }
  render() {
    const { context: i } = this.props, o = i.getRoom(), c = o ? void 0 : i.getDisplayer(), h = this.putAttributes;
    return wt.createElement(UO, { room: o, player: c, context: i, plugin: { putAttributes: h } });
  }
}
class UO extends dl.exports.Component {
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
      if (wO && m.includes("NotAllowedError") || m.includes("interact"))
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
      const S = document.createElement("source");
      new URL(h).pathname.endsWith(".m3u8") ? S.type = "application/x-mpegURL" : g.src = h, S.src = h, c && (S.type = c), g.appendChild(S), y.appendChild(g), this.container.current.appendChild(y), await new Promise((I) => (window.requestAnimationFrame || window.setTimeout)(I)), this.debug("initializing videojs() ...");
      const C = eT(g);
      this.player = C, window.player = C, C.one("loadedmetadata", this.gracefullyUpdate);
      const A = window.__mediaPlayerAudioEffectClient;
      A !== void 0 && BO(A, C, h), C.on("ready", () => {
        var I;
        (I = mo.onPlayer) == null || I.call(mo, C), C.on("timeupdate", this.gracefullyUpdate), C.on("volumechange", this.gracefullyUpdate), C.on("seeked", this.gracefullyUpdate), C.on("play", this.gracefullyUpdate), C.on("pause", this.gracefullyUpdate), C.on("ended", this.resetPlayer);
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
      if (o = Tr(Tr({}, LE), o), this.player) {
        let h = Zv(o, this.props), m = this.player.duration();
        !o.paused && h > m && (c = Tr({}, o), o = mO(c, vO({ currentTime: 0, paused: !0 })), this.resetPlayer());
      }
      var c;
      return o;
    }
  }
  isShowingPoster() {
    const i = this.getAttributes();
    return !(i != null && i.src) || bO.some((o) => i.src.endsWith(o));
  }
  render() {
    var i, o;
    if (!this.props.room && !this.props.player)
      return null;
    const c = this.getAttributes();
    if (!c)
      return null;
    const h = 1e3 * (((i = this.player) == null ? void 0 : i.duration()) || 1e3), m = ((o = this.player) == null ? void 0 : o.bufferedPercent()) || 0;
    return wt.createElement("div", { className: this.isEnabled() ? "vjs-p" : "vjs-p disabled", onMouseEnter: this.showController, onMouseMove: this.showController }, wt.createElement("div", { className: "video-js-plugin-player", ref: this.container }), this.isShowingPoster() && wt.createElement("div", { className: "video-js-plugin-poster" }, c.poster && wt.createElement("img", { src: c.poster, alt: "", draggable: !1 })), wt.createElement(OO, { duration: h, volume: c.volume, setVolume: this.setVolume, paused: c.paused, play: this.play, pause: this.pause, currentTime: 1e3 * Zv(c, this.props), setCurrentTime: this.setCurrentTime, buffered: h * m, visible: !0 }), this.state.NoSound && wt.createElement("div", { ref: this.setupAlert, className: "videojs-plugin-muted-alert" }), this.state.MediaError && wt.createElement("div", { className: "videojs-plugin-recovery-mode" }, wt.createElement("button", { ref: this.setupReload }, "Reload Player")));
  }
  debug(i, ...o) {
    mo.verbose && mo.log(`[MediaPlayer] ${i}`, ...o);
  }
  componentDidMount() {
    this.debug("app version =", "0.1.0-alpha.5"), this.debug("video.js version =", eT.VERSION), this.initPlayer(), this.props.context.emitter.on("attributesUpdate", this.syncPlayerWithAttributes), this.syncPlayerTimer = setInterval(this.syncPlayerWithAttributes, mo.syncInterval), this.decreaseRetryTimer = setInterval(this.decreaseRetryCount, mo.retryInterval);
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
  i = Tr(Tr({}, LE), i);
  const o = r.getBox();
  o.mountStyles(`.vjs-p{display:flex;flex-grow:1}.vjs-p *{pointer-events:auto}.vjs-p.disabled *{pointer-events:none}.vjs-p .video-js-plugin-poster{position:absolute;top:0;left:0;right:0;bottom:0;background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgQAAACACAYAAAB0vHFxAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAACBKADAAQAAAABAAAAgAAAAACE3oPTAAAKXUlEQVR4Ae3dYW4ktxEG0LW9FwkC2McycokAOUGAXMLwtQwYvomdP4akHUnNnm6SVUU+/xqpe8ji+yiDWz3a/e7L5v/98se//3pL8K9//O+7t19Hv85eX7RP9vnllz2h4/rkd+wz+ir/0cLfjv/9t1/6igABAgQIENhRwIFgx9StmQABAgQIPAg4EDyA+JIAAQIECOwo8HXHRVvzPIHRzwBHjz9PKudMo31Hj59TdZ2qsueXvb5sO0GHIFsi6iFAgAABAgECOgQB6KbsJ5Dtt0L6rWyPkeRXO+fs+WWvL1v6OgTZElEPAQIECBAIENAhCEA3ZT8Bzwj7WUaMJL8I9X5zZs8ve339kugzkg5BH0ejECBAgACB0gIOBKXjUzwBAgQIEOgj4EDQx9EoBAgQIECgtIADQen4FE+AAAECBPoIOBD0cTQKAQIECBAoLeC3DErHp/iWgE8Zt4RyX5df7nxa1Y3Ob/T4rfWtdl2HYLVErYcAAQIECFwQWL5DsPoJcvX1XdjTpd4iv1JxvStWfu9IfCORwLP7U4cgUXhKIUCAAAECUQIOBFHy5iVAgAABAokEHAgShaEUAgQIECAQJXD7MwTPPqOIWujVeUevb/T4V9ftfecE5HfOKetd8suajLoiBHQIItTNSYAAAQIEkgnc7hAkW0/3ckb/e9qjx+8OYsBvBOT3DUe5L+RXLjIFDxTQIRiIa2gCBAgQIFBFoNkh2P0Z2+j1jx4/+0asvv7q9d/dH9XXX73+3fO7u/7W+3fbHzoErR3hOgECBAgQ2ECg2SHwjG2DXRC4xOj9tdufAHpHLb/eonPHk9+xd7TPcXX9r+oQ9Dc1IgECBAgQKCfgQFAuMgUTIECAAIH+Ag4E/U2NSIAAAQIEygk0P0MQvaLsz3hb9bWu840WOJ5ffsc+2a/KL3tC6jsSmL1/dQiO0nCNAAECBAhsItDsEMw+oTzrHl1f61OorevPrvfZ+6N9WvVmr09+xwnKr7ZP9vyOdcdfze7Tuz4dgvF7ygwECBAgQCC9QLNDkH0F0X+C45NdoHZ99rf8aguofqRA7/8/6BCMTMvYBAgQIECgiED5DkHvZyhFcjtdJp/TVClvlF/KWE4XJb/TVG68INB7f+kQXAjBWwgQIECAwGoCDgSrJWo9BAgQIEDggoADwQU0byFAgAABAqsJfO39DGI1IOuJFbA/Y/3vzi6/u4Kx7189v7vru/v+2HTfz65D8N7EdwgQIECAwHYCw3/LYLUT1HY7pLFg+TaAkl+WX/KAGuXJrwEUfLlaPjoEwRvG9AQIECBAIIPA8A5B779JKQOaGl4F5PtqUfGV/Cqm9lqz/F4tMr6qlo8OQcZdpCYCBAgQIDBZYHiHoNozlMn+5aeTb+0I5Se/2gK5q6/286VDkHs/qY4AAQIECEwRcCCYwmwSAgQIECCQW8CBIHc+qiNAgAABAlMEhn+GYMoqTEKAAAEC7wSqPcN+twDfmCqgQzCV22QECBAgQCCnQHiHoPoJtlV/63rObfFaVfX6X1dy7VX19Vev/1pqr++qvv7q9b8m4dVHAtny1SH4KCXfI0CAAAECmwmEdwiq/U1Om+2PL/Kpnbj85FdbYO3qs/186hCsvd+sjgABAgQInBJwIDjF5CYCBAgQILC2gAPB2vlaHQECBAgQOCUQ/hmCbJ+yPKW20U3yqR22/ORXW2Dt6qN/Ph/n1yFYe79ZHQECBAgQOCXgQHCKyU0ECBAgQGBtAQeCtfO1OgIECBAgcErAgeAUk5sIECBAgMDaAg4Ea+drdQQIECBA4JTA1+///OGnoztd52N/fC7g58PPx+e748sX+8P+qLQ/dAiO0nKNAAECBAhsIuBAsEnQlkmAAAECBI4EHAiOdFwjQIAAAQKbCDgQbBK0ZRIgQIAAgSMBB4IjHdcIECBAgMAmAuH/lsHP//zvb5tYl1ymfErG9lK0/F4oSr6QX8nYThcdne/j/DoEp6NzIwECBAgQWFfAgWDdbK2MAAECBAicFnAgOE3lRgIECBAgsK5A+GcIfv39Pz++5X18pvH2mtfzBeQz37znjPLrqTl/LPnNN585Y7Z8dQhmpm8uAgQIECCQVCC8Q1C9I9Cqv3U96b54Kat6/S8Lufii+vqr138xtpe3VV9/9fpfgvDiQ4Fs+eoQfBiTbxIgQIAAgb0EwjsEe3FbLQECBOYJZPsT6LyVm+mKgA7BFTXvIUCAAAECiwk4ECwWqOUQIECAAIErAg4EV9S8hwABAgQILCYw/DMEnmEttmMeliPfB5BiX8qvWGAP5crvASTZl9Xy0SFItoGUQ4AAAQIEIgSGdwiy/U1MEcgrzynf2unKT361BXJXX+3nS4cg935SHQECBAgQmCIwvENQ7RnKFPWFJpFv7TDlJ7/aArmrr/bzpUOQez+pjgABAgQITBH4Wu0EM0XFJGkE7M80UVwqRH6X2NK8afX87q7v7vvTBP13IToE2RJRDwECBAgQCBBwIAhANyUBAgQIEMgm4ECQLRH1ECBAgACBAIHhv2Uwek2rPcPp7cWnt+jc8eQ317v3bPLrLWq8twK995cOwVtdrwkQIECAwKYC5TsE1f4mqNn7jM9s8b7zya+v5+zR5DdbfK/5eu8vHYK99o/VEiBAgACBDwWaHYLezyg+rOLGN6Pra53QWtdvLP3UW6N9WkVmr09+xwnKr7ZP9vyOdcdfze7Tuz4dgvF7ygwECBAgQCC9QLNDEL2C3ieg3utp1de63rueZ8fLXt+z6+l9f3af7PX1zuPZ8bL7ZK/vWW/39xWYvT90CPrmZzQCBAgQIFBSwIGgZGyKJkCAAAECfQUcCPp6Go0AAQIECJQUaH6GIPpT1iVVFX1aIHp/zX5GdxqmyI3yKxLUJ2XK7xOYv78d7XNcXf+rOgT9TY1IgAABAgTKCTQ7BLv/CWr0+kePn31HVl9/9frv7o/q669e/+753V1/6/277Q8dgtaOcJ0AAQIECGwg0OwQbGBwuMTRz5BGj3+4OBdvC8jvNmHoAPIL5Td5MgEdgmSBKIcAAQIECEQI3O4QrP6MZfT6Ro8fsal2mlN+tdOWX+38VN9XQIegr6fRCBAgQIBASQEHgpKxKZoAAQIECPQVcCDo62k0AgQIECBQUuD2Zwiyr3r1Z4Srry/7/rpbn/zuCsa+X36x/mY/Fnh2f+oQHHu6SoAAAQIEthBYvkOwRYoW+anAsyfkTwdyIURAfiHs3SYdnd/o8btBFBlIh6BIUMokQIAAAQIjBRwIRuoamwABAgQIFBFwICgSlDIJECBAgMBIAQeCkbrGJkCAAAECRQQcCIoEpUwCBAgQIDBSwG8ZjNQ19nABnzIeTjx0AvkN5R0+ePb8stc3PKAnJ9AheBLM7QQIECBAYEUBHYIVU91oTf49+9phy09+IwXsr+d0dQie83I3AQIECBBYUkCHYMlY8yxq9DO80ePnkYypZLTv6PFj1PaZNXt+2evLtlN0CLIloh4CBAgQIBAg4EAQgG5KAgQIECCQTcCBIFsi6iFAgAABAgEC/wdVfx9UuC8B6AAAAABJRU5ErkJggg==);background-repeat:repeat-x;background-position:0 50%;display:flex;align-items:center;justify-content:center}.vjs-p .video-js-plugin-poster img{box-shadow:0 0 5px 10px #0006}.vjs-p .player-controller,.vjs-p .videojs-plugin-muted-alert{pointer-events:auto}.vjs-p.disabled .videojs-plugin-close-icon,.vjs-p.disabled .player-controller{pointer-events:none}.vjs-p .video-js-plugin-player{position:absolute;top:0;left:0;right:0;bottom:0}.video-js,[data-vjs-player]{width:100%;height:100%}.vjs-p .videojs-plugin-muted-alert{pointer-events:auto;cursor:pointer;position:absolute;top:0;left:0;right:0;bottom:0;z-index:43}.vjs-p .videojs-plugin-muted-alert:before{pointer-events:auto;cursor:pointer;position:absolute;top:0;left:0;right:0;bottom:0;z-index:43;content:"\\f104";background:rgba(0,0,0,.3);font-family:VideoJS;font-size:2em;display:flex;align-items:center;justify-content:center;color:#fff}.vjs-p .videojs-plugin-recovery-mode{pointer-events:auto;cursor:pointer;position:absolute;top:0;left:0;right:0;bottom:0;z-index:44}.vjs-p .videojs-plugin-recovery-mode button{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}.vjs-p .seek-slider{position:relative;width:100%}.vjs-p .seek-slider:focus{outline:none}.vjs-p .seek-slider .track{padding:10px 0;cursor:pointer;outline:none}.vjs-p .seek-slider .track:focus{border:0;outline:none}.vjs-p .seek-slider .track .main{width:100%;height:3px;background-color:#ffffff4d;border-radius:30px;position:absolute;left:0;top:8.5px;transition:transform .4s;outline:none}.vjs-p .seek-slider .track .main:focus{border:0;outline:none}.vjs-p .seek-slider .track .main .buffered{position:absolute;background-color:#ffffff4d;width:100%;height:100%;transform:scaleX(.8);z-index:2;transform-origin:0 0}.vjs-p .seek-slider .track .main .seek-hover{position:absolute;background-color:#ffffff80;width:100%;height:100%;z-index:1;transform:scaleX(.6);transform-origin:0 0;opacity:0;transition:opacity .4s}.vjs-p .seek-slider .track .main .connect{position:absolute;background-color:#fff;width:100%;height:100%;z-index:3;left:0;transform:scaleX(.13);transform-origin:0 0}.vjs-p .seek-slider .track.active .main{transform:scaleY(2)}.vjs-p .seek-slider .thumb{pointer-events:none;position:absolute;width:12px;height:12px;left:-6px;top:4px;z-index:4;transform:translate(100px)}.vjs-p .seek-slider .thumb .handler{border-radius:100%;width:100%;height:100%;background-color:#fff;opacity:0;transform:scale(.4);cursor:pointer;transition:transform .2s;pointer-events:none}.vjs-p .seek-slider .thumb.active .handler{opacity:1;transform:scale(1)}.vjs-p .seek-slider .hover-time{position:absolute;background-color:#0000004d;line-height:18px;font-size:16px;color:#ddd;top:-25px;left:0;padding:5px 10px;border-radius:5px;box-shadow:0 0 5px #0000004d;opacity:0;transform:translate(150px);pointer-events:none}.vjs-p .seek-slider .hover-time.active{opacity:1}.vjs-p .seek-slider:hover .track .main .seek-hover{opacity:1}.vjs-p .player-controller{position:absolute;z-index:100;bottom:0px;left:0;width:100%;display:flex;flex-direction:column;justify-content:center;align-items:stretch;height:64px;background-image:linear-gradient(0deg,#000,transparent);transition:opacity .2s;color:#fff}.vjs-p .player-menu-box{display:flex;align-items:center;justify-content:center;flex-direction:column;margin-bottom:40px}.vjs-p .player-menu-cell{width:100%;text-align:center;font-size:12px;color:#7a7b7c}.vjs-p .player-multiple-play{width:64px;height:120px}.vjs-p .player-controller-actions-left{display:flex;justify-content:center;align-items:center;flex-shrink:0}.vjs-p .player-right-box{font-size:14px;color:#7a7b7c;cursor:pointer;margin-right:12px}.vjs-p .player-controller-actions{display:flex;flex-direction:row;justify-content:space-between;align-items:center;padding-left:8px;padding-right:8px;margin-top:2px}.vjs-p .player-mid-box-time{font-size:9px;display:flex;justify-content:center;align-items:center;color:#fff;flex-shrink:0;margin-right:8px;font-family:monospace}.vjs-p .player-controller-play{display:flex;align-items:center;justify-content:center;cursor:pointer;padding-right:4px}.vjs-p .player-controller-progress{width:calc(100% - 28px);margin-left:14px;display:flex;align-items:center;justify-content:center;margin-top:8px}.vjs-p .player-volume{display:flex;align-items:center;justify-content:center;cursor:pointer;margin-right:16px;margin-left:8px}.vjs-p .player-volume-slider{width:60px;margin-right:12px;display:flex;align-items:center}.vjs-p .player-volume-box{display:flex;flex-direction:row}.netless-app-media-player-container{display:flex;position:relative;height:100%}
`);
  const c = document.createElement("div");
  c.classList.add("netless-app-media-player-container"), iM.render(wt.createElement(jO, { context: r }), c), o.mountContent(c), r.emitter.on("destroy", () => {
    console.log("[MediaPlayer]: destroy"), iM.unmountComponentAtNode(c);
  });
} }, VO = () => {
  Qt.debug && jE({ verbose: !0 }), Qt.register({
    kind: qb.kind,
    src: qb
  }), Qt.register({
    kind: tS.kind,
    src: tS
  });
}, eL = {
  DocsViewer: qb.kind,
  MediaPlayer: tS.kind
};
var HO = /* @__PURE__ */ ((r) => (r.Init = "Init", r.AttributesUpdate = "AttributesUpdate", r.SetAttributes = "SetAttributes", r.RegisterMagixEvent = "RegisterMagixEvent", r.RemoveMagixEvent = "RemoveMagixEvent", r.RemoveAllMagixEvent = "RemoveAllMagixEvent", r.RoomStateChanged = "RoomStateChanged", r.DispatchMagixEvent = "DispatchMagixEvent", r.ReciveMagixEvent = "ReciveMagixEvent", r.NextPage = "NextPage", r.PrevPage = "PrevPage", r.SDKCreate = "SDKCreate", r.OnCreate = "OnCreate", r.SetPage = "SetPage", r.GetAttributes = "GetAttributes", r.Ready = "Ready", r.Destory = "Destory", r.StartCreate = "StartCreate", r.WrapperDidUpdate = "WrapperDidUpdate", r.DispayIframe = "DispayIframe", r.HideIframe = "HideIframe", r.GetRootRect = "GetRootRect", r.ReplayRootRect = "ReplayRootRect", r.PageTo = "PageTo", r))(HO || {}), WO = /* @__PURE__ */ ((r) => (r.WrapperDidMount = "WrapperDidMount", r.IframeLoad = "IframeLoad", r))(WO || {});
const al = {
  Ready: "Ready",
  RootRect: "ReplayRootRect",
  Message: "message",
  ComputeStyle: "computeStyle",
  Load: "load",
  DisplayerState: "displayerState",
  Show: "show",
  Hide: "hide"
}, FO = (r, i) => new Array(r).fill(0).map((o, c) => i(c)), dn = class {
  constructor(r, i) {
    this.manager = r, this.appManager = i, this.magixEventMap = /* @__PURE__ */ new Map(), this.cssList = [], this.allowAppliances = ["clicker"], this.bridgeDisposer = dM, this.rootRect = null, this.sideEffectManager = new lp(), this.execListenIframe = xs((o) => {
      this.listenIframe(o);
    }, 50), this.onPhaseChangedListener = (o) => {
      o === KC.Playing && this.computedStyleAndIframeDisplay();
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
  scaleIframeToFit(r = _b.Immediately) {
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
      const h = FO(i, (m) => ({
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
    this.isReplay && (this.displayer._phase === KC.Playing && this.computedStyleAndIframeDisplay(), this.sideEffectManager.add(() => (this.displayer.callbacks.on("onPhaseChanged", this.onPhaseChangedListener), () => this.displayer.callbacks.off("onPhaseChanged", this.onPhaseChangedListener)), al.DisplayerState)), this.computedStyleAndIframeDisplay();
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
      const { width: h, height: m, scale: y, centerX: g, centerY: S } = i, C = this.rootRect || { x: 0, y: 0 }, A = `${h / 2 + C.x}px`, I = `${m / 2 + C.y}px`, z = `transform-origin: ${A} ${I};`, F = (h - o) / 2 * y, $ = (m - c) / 2 * y, K = -(g * y) + F, q = -(S * y) + $, fe = `transform: translate(${K}px,${q}px) scale(${y}, ${y});`, Oe = ["position: absolute;", "border: 0.1px solid rgba(0,0,0,0);", "top: 0px;", "left: 0px;", z, fe];
      this.cssList = Oe, this.computedZindex(), this.updateStyle();
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
let Pd = dn;
Pd.kind = "IframeBridge";
Pd.hiddenClass = "netless-iframe-brdige-hidden";
Pd.emitter = new Nd();
Pd.displayer = null;
Pd.alreadyCreate = !1;
const $O = new VP({ emitter: Ke }), tt = class extends GD {
  constructor(r) {
    super(r), this.version = "1.0.5", this.dependencies = { dependencies: { "@juggle/resize-observer": "^3.3.1", "@netless/telebox-insider": "github:veytu/telebox-insider", emittery: "^0.9.2", lodash: "^4.17.21", "p-retry": "^4.6.1", uuid: "^7.0.3", "video.js": ">=7" }, peerDependencies: { jspdf: "2.5.1", "white-web-sdk": "^2.16.52" }, devDependencies: { "@hyrious/dts": "^0.2.2", "@netless/app-media-player": "0.1.0-beta.9", "@netless/app-docs-viewer": "github:veytu/app-docs-viewer", "@rollup/plugin-commonjs": "^20.0.0", "@rollup/plugin-node-resolve": "^13.0.4", "@rollup/plugin-url": "^6.1.0", "@sveltejs/vite-plugin-svelte": "^1.4.0", "@tsconfig/svelte": "^2.0.1", "@types/debug": "^4.1.7", "@types/lodash": "^4.14.182", "@types/lodash-es": "^4.17.4", "@types/uuid": "^8.3.1", "@typescript-eslint/eslint-plugin": "^4.30.0", "@typescript-eslint/parser": "^4.30.0", "@vitest/ui": "^0.14.1", cypress: "^8.7.0", dotenv: "^10.0.0", eslint: "^7.32.0", "eslint-config-prettier": "^8.3.0", "eslint-plugin-svelte3": "^3.2.0", jsdom: "^19.0.0", jspdf: "^2.5.1", less: "^4.1.1", prettier: "^2.3.2", "prettier-plugin-svelte": "^2.4.0", "rollup-plugin-analyzer": "^4.0.0", "rollup-plugin-styles": "^3.14.1", "side-effect-manager": "0.1.5", svelte: "^3.42.4", typescript: "^4.5.5", vite: "^3.0.0", vitest: "^0.14.1", "white-web-sdk": "2.16.52" } }, this.emitter = Dt, this.viewMode = sl.Broadcaster, this.isReplay = rS(this.displayer), this._cursorUIDs = [], this.containerSizeRatio = tt.containerSizeRatio, tt.displayer = r.displayer, window.NETLESS_DEPS = { dependencies: { "@juggle/resize-observer": "^3.3.1", "@netless/telebox-insider": "github:veytu/telebox-insider", emittery: "^0.9.2", lodash: "^4.17.21", "p-retry": "^4.6.1", uuid: "^7.0.3", "video.js": ">=7" }, peerDependencies: { jspdf: "2.5.1", "white-web-sdk": "^2.16.52" }, devDependencies: { "@hyrious/dts": "^0.2.2", "@netless/app-media-player": "0.1.0-beta.9", "@netless/app-docs-viewer": "github:veytu/app-docs-viewer", "@rollup/plugin-commonjs": "^20.0.0", "@rollup/plugin-node-resolve": "^13.0.4", "@rollup/plugin-url": "^6.1.0", "@sveltejs/vite-plugin-svelte": "^1.4.0", "@tsconfig/svelte": "^2.0.1", "@types/debug": "^4.1.7", "@types/lodash": "^4.14.182", "@types/lodash-es": "^4.17.4", "@types/uuid": "^8.3.1", "@typescript-eslint/eslint-plugin": "^4.30.0", "@typescript-eslint/parser": "^4.30.0", "@vitest/ui": "^0.14.1", cypress: "^8.7.0", dotenv: "^10.0.0", eslint: "^7.32.0", "eslint-config-prettier": "^8.3.0", "eslint-plugin-svelte3": "^3.2.0", jsdom: "^19.0.0", jspdf: "^2.5.1", less: "^4.1.1", prettier: "^2.3.2", "prettier-plugin-svelte": "^2.4.0", "rollup-plugin-analyzer": "^4.0.0", "rollup-plugin-styles": "^3.14.1", "side-effect-manager": "0.1.5", svelte: "^3.42.4", typescript: "^4.5.5", vite: "^3.0.0", vitest: "^0.14.1", "white-web-sdk": "2.16.52" } };
  }
  static onCreate(r) {
    tt._resolve(r);
  }
  static async mount(r) {
    var y, g;
    const i = r.room;
    tt.container = r.container, tt.supportAppliancePlugin = r.supportAppliancePlugin;
    const o = r.containerSizeRatio, c = r.debug, h = r.cursor;
    tt.params = r, tt.displayer = r.room, $N();
    let m;
    if (Du(i)) {
      if (i.phase !== Nu.Connected)
        throw new Error("[WindowManager]: Room only Connected can be mount");
      i.phase === Nu.Connected && i.isWritable && (i.disableSerialization = !1), m = await this.initManager(i);
    }
    if (tt.isCreated)
      throw new Error("[WindowManager]: Already created cannot be created again");
    if (this.debug = Boolean(c), this.debug && jE({ verbose: !0 }), Ca("Already insert room", m), Du(this.displayer)) {
      if (!m)
        throw new Error("[WindowManager]: init InvisiblePlugin failed");
    } else
      await cM(
        async (S) => {
          if (m = i.getInvisiblePlugin(tt.kind), !m)
            throw Ca(`manager is empty. retrying ${S}`), new Error();
        },
        { retries: 10, maxTimeout: 5e3 }
      );
    if (!m)
      throw new Error("[WindowManager]: create manager failed");
    o && (tt.containerSizeRatio = o), await m.ensureAttributes(), m._fullscreen = r.fullscreen, m.appManager = new WN(m), m.appManager.polling = r.polling || !1, m._pageState = new UP(m.appManager), m.cursorManager = new jP(
      m.appManager,
      Boolean(h),
      r.cursorOptions,
      r.applianceIcons
    ), o && (m.containerSizeRatio = o), r.container && m.bindContainer(r.container), HP(i, m), Ke.emit("onCreated"), tt.isCreated = !0;
    try {
      await iN();
    } catch (S) {
      console.warn("[WindowManager]: indexedDB open failed"), console.log(S);
    }
    return (y = m == null ? void 0 : m.room) == null || y.addMagixEventListener("onScaleChange", (S) => {
      m == null || m._setScale(S.payload);
    }), (g = m == null ? void 0 : m.room) == null || g.addMagixEventListener("onMainViewBackgroundImgChange", (S) => {
      m == null || m._setBackgroundImg(S.payload);
    }), Ke.on("onScaleChange", (S) => {
      m == null || m._setScale(S, !0);
    }), Ke.on("onBackgroundImgChange", (S) => {
      m == null || m._setBackgroundImg(S || "");
    }), m;
  }
  static initManager(r) {
    return QN(r);
  }
  static initContainer(r, i, o) {
    const { chessboard: c, overwriteStyles: h, fullscreen: m } = o;
    tt.container || (tt.container = i);
    const { playground: y, wrapper: g, sizer: S, mainViewElement: C, mainViewWrapper: A } = FN(i);
    if (tt.playground = y, c && S.classList.add("netless-window-manager-chess-sizer"), m && S.classList.add("netless-window-manager-fullscreen"), h) {
      const I = document.createElement("style");
      I.textContent = h, y.appendChild(I);
    }
    return r.containerResizeObserver = sS.create(
      y,
      S,
      g,
      Ke
    ), tt.wrapper = g, tt.sizer = S, tt.mainViewWrapper = A, C;
  }
  static get registered() {
    return qi.registered;
  }
  bindContainer(r) {
    var i, o, c, h, m, y;
    if (Du(this.displayer) && this.room.phase !== Nu.Connected)
      throw new DN();
    if (tt.isCreated && tt.container)
      tt.container.firstChild && r.appendChild(tt.container.firstChild);
    else if (tt.params) {
      const g = tt.params, S = tt.initContainer(this, r, g);
      this.boxManager && this.boxManager.destroy();
      const C = sP(this, Dt, Ke, po, {
        collectorContainer: g.collectorContainer,
        collectorStyles: g.collectorStyles,
        prefersColorScheme: g.prefersColorScheme
      });
      this.boxManager = C, (i = this.appManager) == null || i.setBoxManager(C), this.bindMainView(S, g.disableCameraTransform), tt.wrapper && ((o = this.cursorManager) == null || o.setupWrapper(tt.wrapper));
    }
    Ke.emit("updateManagerRect"), (c = this.appManager) == null || c.refresh(), (h = this.appManager) == null || h.resetMaximized(), (m = this.appManager) == null || m.resetMinimized(), (y = this.appManager) == null || y.displayerWritableListener(!this.room.isWritable), tt.container = r;
  }
  bindCollectorContainer(r) {
    tt.isCreated && this.boxManager ? this.boxManager.setCollectorContainer(r) : tt.params && (tt.params.collectorContainer = r);
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
        Ke.once("rootDirRemoved").then(async () => {
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
        throw new EN();
      r.src && typeof r.src == "string" && qi.register({ kind: r.kind, src: r.src });
      const h = await ((i = qi.appClasses.get(r.kind)) == null ? void 0 : i());
      if (h && ((o = h.config) == null ? void 0 : o.singleton) && this.appManager.appProxies.has(r.kind))
        throw new TN();
      const m = this.setupScenePath(r, this.appManager);
      return m === void 0 ? void 0 : ((c = r == null ? void 0 : r.options) != null && c.scenePath && (r.options.scenePath = SN(r.options.scenePath)), await this.appManager.addApp(r, Boolean(m)));
    } else
      throw new ms();
  }
  setupScenePath(r, i) {
    let o = !1;
    if (r.options) {
      const { scenePath: c, scenes: h } = r.options;
      if (c) {
        if (!bN(c))
          throw new AN();
        const m = Object.keys(this.apps || {});
        for (const y of m) {
          const g = i.store.getAppScenePath(y);
          if (g && g === c) {
            if (console.warn(`[WindowManager]: ScenePath "${c}" already opened`), this.boxManager) {
              const S = this.boxManager.getTopBox();
              S && (this.boxManager.setZIndex(y, S.zIndex + 1, !1), this.boxManager.focusBox({ appId: y }, !1));
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
    this.readonly = r, (i = this.boxManager) == null || i.setReadonly(r), Ke.emit("setReadonly", r);
  }
  switchMainViewToWriter() {
    var r;
    return (r = this.appManager) == null ? void 0 : r.mainViewProxy.mainViewClickHandler();
  }
  onAppDestroy(r, i) {
    yN(`destroy-${r}`, i);
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
    this._fullscreen !== r && (this._fullscreen = r, (i = tt.sizer) == null || i.classList.toggle("netless-window-manager-fullscreen", r), Dt.emit("fullscreenChange", r));
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
          var m, y, g, S, C, A, I, z;
          return Number((S = (g = (y = (m = this.appManager) == null ? void 0 : m.boxManager) == null ? void 0 : y.getBox(c)) == null ? void 0 : g._zIndex$) == null ? void 0 : S.value) > Number((z = (I = (A = (C = this.appManager) == null ? void 0 : C.boxManager) == null ? void 0 : A.getBox(h)) == null ? void 0 : I._zIndex$) == null ? void 0 : z.value) ? c : h;
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
    (r = this.containerResizeObserver) == null || r.disconnect(), (i = this.appManager) == null || i.destroy(), (o = this.cursorManager) == null || o.destroy(), tt.container = void 0, tt.wrapper = void 0, tt.sizer = void 0, tt.isCreated = !1, tt.playground && ((c = tt.playground.parentNode) == null || c.removeChild(tt.playground)), tt.params = void 0, (h = this._iframeBridge) == null || h.destroy(), this._iframeBridge = void 0, Ca("Destroyed");
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
    (r = this.appManager) == null || r.mainViewProxy.rebind(), tt.container && this.bindContainer(tt.container), (i = this.appManager) == null || i.refresher.refresh();
  }
  setContainerSizeRatio(r) {
    if (!Pb(r) || !(r > 0))
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
    if (!Pb(r))
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
    FD(this.attributes) && await vM(50), xa(this.attributes) && (this.attributes[xi.Apps] || this.safeSetAttributes({ [xi.Apps]: {} }), this.attributes[xi.Cursors] || this.safeSetAttributes({ [xi.Cursors]: {} }), this.attributes._mainScenePath || this.safeSetAttributes({ _mainScenePath: pM }), this.attributes._mainSceneIndex || this.safeSetAttributes({ _mainSceneIndex: 0 }), this.attributes[xi.Registered] || this.safeSetAttributes({ [xi.Registered]: {} }), this.attributes[xi.IframeBridge] || this.safeSetAttributes({ [xi.IframeBridge]: {} }));
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
let Qt = tt;
Qt.kind = "WindowManager";
Qt.debug = !1;
Qt.containerSizeRatio = eN;
Qt.isCreated = !1;
Qt._resolve = (r) => {
};
VO();
export {
  TN as AppCreateError,
  ms as AppManagerNotInitError,
  KO as AppNotRegisterError,
  DN as BindContainerRoomPhaseInvalidError,
  RN as BoxManagerNotFoundError,
  IN as BoxNotCreatedError,
  eL as BuiltinApps,
  WO as DomEvents,
  Pd as IframeBridge,
  HO as IframeEvents,
  AN as InvalidScenePath,
  EN as ParamsInvalidError,
  MN as WhiteWebSDKInvalidError,
  Qt as WindowManager,
  bM as calculateNextIndex,
  $O as reconnectRefresher
};
//# sourceMappingURL=index.mjs.map
