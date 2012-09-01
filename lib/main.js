const {Cc, Ci, Cu, Cm, components} = require("chrome");

const CATEGORY_NAME = "content-policy";
const POLICY_ID = components.ID("{4e7c131e-f463-11e1-9b71-9229128e45a1}");
const POLICY_NAME = "@mozilla.org/block-it-policy;1";
const POLICY_DESCRIPTION = "block.it content policy";

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyServiceGetter(this, "categoryManager",
 "@mozilla.org/categorymanager;1", "nsICategoryManager");

XPCOMUtils.defineLazyGetter(this, "componentRegistrar", function () {
  return Cm.nsIComponentRegistrar;
});

let Policy = {
  createInstance: function Policy_createInstance(aOuter, aIID) {
    return this.QueryInterface(aIID);
  },

  shouldLoad: function (aContentType, aContentLocation, aRequestOrigin, aContext, aMimeTypeGuess, aExtra) {
    if (aContentLocation.spec.indexOf("reddit") > -1) {
      return Ci.nsIContentPolicy.REJECT_REQUEST;
    }

    return Ci.nsIContentPolicy.ACCEPT;
  },

  shouldProcess: function Policy_shouldProcess(aContentType, aContentLocation, aRequestOrigin, aContext, aMimeTypeGuess, aExtra) {
    return Ci.nsIContentPolicy.ACCEPT;
  },

  QueryInterface: XPCOMUtils.generateQI([Ci.nsIFactory, Ci.nsIContentPolicy])
};

exports.main = function main() {
  componentRegistrar.registerFactory(POLICY_ID, POLICY_DESCRIPTION, POLICY_NAME, Policy);
  categoryManager.addCategoryEntry(CATEGORY_NAME, POLICY_NAME, POLICY_NAME, false, true);
};

exports.onUnload = function unload() {
  categoryManager.deleteCategoryEntry(CATEGORY_NAME, POLICY_NAME, false);
  componentRegistrar.unregisterFactory(POLICY_ID, Policy);
}
