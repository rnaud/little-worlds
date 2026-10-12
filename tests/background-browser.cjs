// Browser checks must never take over the developer's display. Test the
// full-viewport fallback by declining native fullscreen inside test contexts.
// Production code and the user's existing browser tabs are unaffected.
const engines = require("playwright");
function stayWindowed() {
  Object.defineProperty(Element.prototype, "requestFullscreen", {
    configurable: true,
    value: () =>
      Promise.reject(
        new DOMException("Background test session", "NotAllowedError"),
      ),
  });
}
for (const name of ["chromium", "firefox", "webkit"]) {
  const type = engines[name];
  const launch = type.launch.bind(type);
  type.launch = async (...args) => {
    const browser = await launch(...args);
    const newContext = browser.newContext.bind(browser);
    browser.newContext = async (...options) => {
      const context = await newContext(...options);
      await context.addInitScript(stayWindowed);
      return context;
    };
    const newPage = browser.newPage.bind(browser);
    browser.newPage = async (...options) => {
      const page = await newPage(...options);
      await page.addInitScript(stayWindowed);
      return page;
    };
    return browser;
  };
}
