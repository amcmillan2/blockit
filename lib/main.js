const prefs = require("simple-prefs");
const {Cc, Ci, Cu, Cm, CC, components} = require("chrome");
const Timer = CC('@mozilla.org/timer;1', 'nsITimer');

const CATEGORY_NAME = "content-policy";
const POLICY_ID = components.ID("{4e7c131e-f463-11e1-9b71-9229128e45a1}");
const POLICY_NAME = "@mozilla.org/block-it-policy;1";
const POLICY_DESCRIPTION = "block.it content policy";

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyServiceGetter(this, "gCategoryManager",
 "@mozilla.org/categorymanager;1", "nsICategoryManager");

XPCOMUtils.defineLazyGetter(this, "gComponentRegistrar", function () {
  return Cm.nsIComponentRegistrar;
});

let timer;

let Policy = {
  createInstance: function Policy_createInstance(aOuter, aIID) {
    return this.QueryInterface(aIID);
  },

  shouldLoad: function (aContentType, aContentLocation, aRequestOrigin, aContext, aMimeTypeGuess, aExtra) {
    if (Blocklist.isBlocked(aContentLocation)) {
      return Ci.nsIContentPolicy.REJECT_REQUEST;
    }

    return Ci.nsIContentPolicy.ACCEPT;
  },

  shouldProcess: function Policy_shouldProcess(aContentType, aContentLocation, aRequestOrigin, aContext, aMimeTypeGuess, aExtra) {
    return Ci.nsIContentPolicy.ACCEPT;
  },

  QueryInterface: XPCOMUtils.generateQI([Ci.nsIFactory, Ci.nsIContentPolicy])
};

let Blocklist = {
  _domains: null,

  _noHostSchemes: {
    chrome: true,
    file: true,
    resource: true,
    data: true,
    about: true
  },

  get domains() {
    if (!this._domains) {
      this._domains = new Set(prefs.prefs.domains.split(/[\s\.]*\|[\s\.]*/));
    }

    return this._domains;
  },

  isBlocked: function Blocklist_isBlocked(aURI) {
    if (aURI.scheme in this._noHostSchemes) {
      return false;
    }

    let host;

    try {
      host = aURI.host;
    } catch (e) {
      return false;
    }

    let parts = host.split(".");
    for (let i = parts.length - 1; i >= 0; i--) {
      let domain = parts.slice(i).join(".");
      if (this.domains.has(domain)) {
        return true;
      }
    }

    return false;
  },

  clear: function Blocklist_clear() {
    this._domains = null;
  }
};

prefs.on("domains", function () {
  Blocklist.clear();
});

exports.main = function main() {
  gComponentRegistrar.registerFactory(POLICY_ID, POLICY_DESCRIPTION, POLICY_NAME, Policy);
  gCategoryManager.addCategoryEntry(CATEGORY_NAME, POLICY_NAME, POLICY_NAME, false, true);
};

exports.onUnload = function unload() {
  gCategoryManager.deleteCategoryEntry(CATEGORY_NAME, POLICY_NAME, false);

  if (timer) {
    timer.cancel();
  }

  timer = Timer();
  timer.initWithCallback(function () {
    gComponentRegistrar.unregisterFactory(POLICY_ID, Policy);
    timer = null;
  }, 0, Ci.nsITimer.TYPE_ONE_SHOT);
};
