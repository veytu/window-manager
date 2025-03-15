const _ua = window.navigator?.userAgent;

const math = _ua?.match(/(Edge?)\/(\d+)/);

export const isOldEdge = () => {
  return math && math[1] == "Edge" && parseInt(math[2]) < 19 ? true : false;
};
// 是否为 IE
export const isIE = () => {
  return "ActiveXObject" in window;
};
// 是否为 webkit
export const isWebkit = () => {
  return /webkit/i.test(_ua);
};
export const isApple = () => {
  return /apple/i.test(_ua.toLocaleLowerCase());
};
export const isElectron = () => {
  return /electron/i.test(_ua.toLocaleLowerCase()) && window.self === window.top;
};
export const isMacOS = () => {
  return /mac/i.test(_ua.toLocaleLowerCase());
};
export const isWin = () => {
  return /win/i.test(_ua.toLocaleLowerCase());
};
export const isIOS = () => {
  return (
    typeof navigator !== "undefined" &&
    typeof window !== "undefined" &&
    /iPad|iPhone|iPod/.test(_ua)
  );
};
export const isAndroid = () => {
  return typeof navigator !== "undefined" && /Android/.test(_ua);
};
export const isFirefox = () => {
  return typeof navigator !== "undefined" && /^(?!.*Seamonkey)(?=.*Firefox).*/i.test(_ua);
};
export const isSafari = () => {
  return typeof navigator !== "undefined" && /Version\/[\d/.]+.*Safari/.test(_ua);
};

// "modern" Edge was released at 79.x
export const isEdgeLegacy = () => {
  return typeof navigator !== "undefined" && /Edge?\/(?:[0-6][0-9]|[0-7][0-8])/i.test(_ua);
};
export const isChrome = () => {
  return typeof navigator !== "undefined" && /Chrome/i.test(_ua);
};
// Native events don't work well with react on Chrome 75
// and older, Chrome 76+ is ok.
export const isChromeLegacy = () => {
  return typeof navigator !== "undefined" && /Chrome?\/(?:[0-7][0-5]|[0-6][0-9])/i.test(_ua);
};
export const isFirefoxLegacy = () => {
  return (
    typeof navigator !== "undefined" &&
    /^(?!.*Seamonkey)(?=.*Firefox\/(?:[0-7][0-9]|[0-8][0-6])).*/i.test(_ua)
  );
};
// qq browser
export const is_QQBrowser = () => {
  return typeof navigator !== "undefined" && /.*QQBrowser/.test(_ua);
};
