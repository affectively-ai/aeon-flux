// @bun
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
var __require = import.meta.require;

// ../../../../node_modules/.bun/react@19.2.3/node_modules/react/cjs/react.development.js
var require_react_development = __commonJS((exports, module) => {
  (function() {
    function defineDeprecationWarning(methodName, info) {
      Object.defineProperty(Component.prototype, methodName, {
        get: function() {
          console.warn("%s(...) is deprecated in plain JavaScript React classes. %s", info[0], info[1]);
        }
      });
    }
    function getIteratorFn(maybeIterable) {
      if (maybeIterable === null || typeof maybeIterable !== "object")
        return null;
      maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
      return typeof maybeIterable === "function" ? maybeIterable : null;
    }
    function warnNoop(publicInstance, callerName) {
      publicInstance = (publicInstance = publicInstance.constructor) && (publicInstance.displayName || publicInstance.name) || "ReactClass";
      var warningKey = publicInstance + "." + callerName;
      didWarnStateUpdateForUnmountedComponent[warningKey] || (console.error("Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.", callerName, publicInstance), didWarnStateUpdateForUnmountedComponent[warningKey] = true);
    }
    function Component(props, context, updater) {
      this.props = props;
      this.context = context;
      this.refs = emptyObject;
      this.updater = updater || ReactNoopUpdateQueue;
    }
    function ComponentDummy() {}
    function PureComponent(props, context, updater) {
      this.props = props;
      this.context = context;
      this.refs = emptyObject;
      this.updater = updater || ReactNoopUpdateQueue;
    }
    function noop() {}
    function testStringCoercion(value) {
      return "" + value;
    }
    function checkKeyStringCoercion(value) {
      try {
        testStringCoercion(value);
        var JSCompiler_inline_result = false;
      } catch (e) {
        JSCompiler_inline_result = true;
      }
      if (JSCompiler_inline_result) {
        JSCompiler_inline_result = console;
        var JSCompiler_temp_const = JSCompiler_inline_result.error;
        var JSCompiler_inline_result$jscomp$0 = typeof Symbol === "function" && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
        JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
        return testStringCoercion(value);
      }
    }
    function getComponentNameFromType(type) {
      if (type == null)
        return null;
      if (typeof type === "function")
        return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
      if (typeof type === "string")
        return type;
      switch (type) {
        case REACT_FRAGMENT_TYPE:
          return "Fragment";
        case REACT_PROFILER_TYPE:
          return "Profiler";
        case REACT_STRICT_MODE_TYPE:
          return "StrictMode";
        case REACT_SUSPENSE_TYPE:
          return "Suspense";
        case REACT_SUSPENSE_LIST_TYPE:
          return "SuspenseList";
        case REACT_ACTIVITY_TYPE:
          return "Activity";
      }
      if (typeof type === "object")
        switch (typeof type.tag === "number" && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof) {
          case REACT_PORTAL_TYPE:
            return "Portal";
          case REACT_CONTEXT_TYPE:
            return type.displayName || "Context";
          case REACT_CONSUMER_TYPE:
            return (type._context.displayName || "Context") + ".Consumer";
          case REACT_FORWARD_REF_TYPE:
            var innerType = type.render;
            type = type.displayName;
            type || (type = innerType.displayName || innerType.name || "", type = type !== "" ? "ForwardRef(" + type + ")" : "ForwardRef");
            return type;
          case REACT_MEMO_TYPE:
            return innerType = type.displayName || null, innerType !== null ? innerType : getComponentNameFromType(type.type) || "Memo";
          case REACT_LAZY_TYPE:
            innerType = type._payload;
            type = type._init;
            try {
              return getComponentNameFromType(type(innerType));
            } catch (x) {}
        }
      return null;
    }
    function getTaskName(type) {
      if (type === REACT_FRAGMENT_TYPE)
        return "<>";
      if (typeof type === "object" && type !== null && type.$$typeof === REACT_LAZY_TYPE)
        return "<...>";
      try {
        var name = getComponentNameFromType(type);
        return name ? "<" + name + ">" : "<...>";
      } catch (x) {
        return "<...>";
      }
    }
    function getOwner() {
      var dispatcher = ReactSharedInternals.A;
      return dispatcher === null ? null : dispatcher.getOwner();
    }
    function UnknownOwner() {
      return Error("react-stack-top-frame");
    }
    function hasValidKey(config) {
      if (hasOwnProperty.call(config, "key")) {
        var getter = Object.getOwnPropertyDescriptor(config, "key").get;
        if (getter && getter.isReactWarning)
          return false;
      }
      return config.key !== undefined;
    }
    function defineKeyPropWarningGetter(props, displayName) {
      function warnAboutAccessingKey() {
        specialPropKeyWarningShown || (specialPropKeyWarningShown = true, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
      }
      warnAboutAccessingKey.isReactWarning = true;
      Object.defineProperty(props, "key", {
        get: warnAboutAccessingKey,
        configurable: true
      });
    }
    function elementRefGetterWithDeprecationWarning() {
      var componentName = getComponentNameFromType(this.type);
      didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = true, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
      componentName = this.props.ref;
      return componentName !== undefined ? componentName : null;
    }
    function ReactElement(type, key, props, owner, debugStack, debugTask) {
      var refProp = props.ref;
      type = {
        $$typeof: REACT_ELEMENT_TYPE,
        type,
        key,
        props,
        _owner: owner
      };
      (refProp !== undefined ? refProp : null) !== null ? Object.defineProperty(type, "ref", {
        enumerable: false,
        get: elementRefGetterWithDeprecationWarning
      }) : Object.defineProperty(type, "ref", { enumerable: false, value: null });
      type._store = {};
      Object.defineProperty(type._store, "validated", {
        configurable: false,
        enumerable: false,
        writable: true,
        value: 0
      });
      Object.defineProperty(type, "_debugInfo", {
        configurable: false,
        enumerable: false,
        writable: true,
        value: null
      });
      Object.defineProperty(type, "_debugStack", {
        configurable: false,
        enumerable: false,
        writable: true,
        value: debugStack
      });
      Object.defineProperty(type, "_debugTask", {
        configurable: false,
        enumerable: false,
        writable: true,
        value: debugTask
      });
      Object.freeze && (Object.freeze(type.props), Object.freeze(type));
      return type;
    }
    function cloneAndReplaceKey(oldElement, newKey) {
      newKey = ReactElement(oldElement.type, newKey, oldElement.props, oldElement._owner, oldElement._debugStack, oldElement._debugTask);
      oldElement._store && (newKey._store.validated = oldElement._store.validated);
      return newKey;
    }
    function validateChildKeys(node) {
      isValidElement(node) ? node._store && (node._store.validated = 1) : typeof node === "object" && node !== null && node.$$typeof === REACT_LAZY_TYPE && (node._payload.status === "fulfilled" ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
    }
    function isValidElement(object) {
      return typeof object === "object" && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    function escape(key) {
      var escaperLookup = { "=": "=0", ":": "=2" };
      return "$" + key.replace(/[=:]/g, function(match) {
        return escaperLookup[match];
      });
    }
    function getElementKey(element, index) {
      return typeof element === "object" && element !== null && element.key != null ? (checkKeyStringCoercion(element.key), escape("" + element.key)) : index.toString(36);
    }
    function resolveThenable(thenable) {
      switch (thenable.status) {
        case "fulfilled":
          return thenable.value;
        case "rejected":
          throw thenable.reason;
        default:
          switch (typeof thenable.status === "string" ? thenable.then(noop, noop) : (thenable.status = "pending", thenable.then(function(fulfilledValue) {
            thenable.status === "pending" && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
          }, function(error) {
            thenable.status === "pending" && (thenable.status = "rejected", thenable.reason = error);
          })), thenable.status) {
            case "fulfilled":
              return thenable.value;
            case "rejected":
              throw thenable.reason;
          }
      }
      throw thenable;
    }
    function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
      var type = typeof children;
      if (type === "undefined" || type === "boolean")
        children = null;
      var invokeCallback = false;
      if (children === null)
        invokeCallback = true;
      else
        switch (type) {
          case "bigint":
          case "string":
          case "number":
            invokeCallback = true;
            break;
          case "object":
            switch (children.$$typeof) {
              case REACT_ELEMENT_TYPE:
              case REACT_PORTAL_TYPE:
                invokeCallback = true;
                break;
              case REACT_LAZY_TYPE:
                return invokeCallback = children._init, mapIntoArray(invokeCallback(children._payload), array, escapedPrefix, nameSoFar, callback);
            }
        }
      if (invokeCallback) {
        invokeCallback = children;
        callback = callback(invokeCallback);
        var childKey = nameSoFar === "" ? "." + getElementKey(invokeCallback, 0) : nameSoFar;
        isArrayImpl(callback) ? (escapedPrefix = "", childKey != null && (escapedPrefix = childKey.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
          return c;
        })) : callback != null && (isValidElement(callback) && (callback.key != null && (invokeCallback && invokeCallback.key === callback.key || checkKeyStringCoercion(callback.key)), escapedPrefix = cloneAndReplaceKey(callback, escapedPrefix + (callback.key == null || invokeCallback && invokeCallback.key === callback.key ? "" : ("" + callback.key).replace(userProvidedKeyEscapeRegex, "$&/") + "/") + childKey), nameSoFar !== "" && invokeCallback != null && isValidElement(invokeCallback) && invokeCallback.key == null && invokeCallback._store && !invokeCallback._store.validated && (escapedPrefix._store.validated = 2), callback = escapedPrefix), array.push(callback));
        return 1;
      }
      invokeCallback = 0;
      childKey = nameSoFar === "" ? "." : nameSoFar + ":";
      if (isArrayImpl(children))
        for (var i = 0;i < children.length; i++)
          nameSoFar = children[i], type = childKey + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(nameSoFar, array, escapedPrefix, type, callback);
      else if (i = getIteratorFn(children), typeof i === "function")
        for (i === children.entries && (didWarnAboutMaps || console.warn("Using Maps as children is not supported. Use an array of keyed ReactElements instead."), didWarnAboutMaps = true), children = i.call(children), i = 0;!(nameSoFar = children.next()).done; )
          nameSoFar = nameSoFar.value, type = childKey + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(nameSoFar, array, escapedPrefix, type, callback);
      else if (type === "object") {
        if (typeof children.then === "function")
          return mapIntoArray(resolveThenable(children), array, escapedPrefix, nameSoFar, callback);
        array = String(children);
        throw Error("Objects are not valid as a React child (found: " + (array === "[object Object]" ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead.");
      }
      return invokeCallback;
    }
    function mapChildren(children, func, context) {
      if (children == null)
        return children;
      var result = [], count = 0;
      mapIntoArray(children, result, "", "", function(child) {
        return func.call(context, child, count++);
      });
      return result;
    }
    function lazyInitializer(payload) {
      if (payload._status === -1) {
        var ioInfo = payload._ioInfo;
        ioInfo != null && (ioInfo.start = ioInfo.end = performance.now());
        ioInfo = payload._result;
        var thenable = ioInfo();
        thenable.then(function(moduleObject) {
          if (payload._status === 0 || payload._status === -1) {
            payload._status = 1;
            payload._result = moduleObject;
            var _ioInfo = payload._ioInfo;
            _ioInfo != null && (_ioInfo.end = performance.now());
            thenable.status === undefined && (thenable.status = "fulfilled", thenable.value = moduleObject);
          }
        }, function(error) {
          if (payload._status === 0 || payload._status === -1) {
            payload._status = 2;
            payload._result = error;
            var _ioInfo2 = payload._ioInfo;
            _ioInfo2 != null && (_ioInfo2.end = performance.now());
            thenable.status === undefined && (thenable.status = "rejected", thenable.reason = error);
          }
        });
        ioInfo = payload._ioInfo;
        if (ioInfo != null) {
          ioInfo.value = thenable;
          var displayName = thenable.displayName;
          typeof displayName === "string" && (ioInfo.name = displayName);
        }
        payload._status === -1 && (payload._status = 0, payload._result = thenable);
      }
      if (payload._status === 1)
        return ioInfo = payload._result, ioInfo === undefined && console.error(`lazy: Expected the result of a dynamic import() call. Instead received: %s

Your code should look like: 
  const MyComponent = lazy(() => import('./MyComponent'))

Did you accidentally put curly braces around the import?`, ioInfo), "default" in ioInfo || console.error(`lazy: Expected the result of a dynamic import() call. Instead received: %s

Your code should look like: 
  const MyComponent = lazy(() => import('./MyComponent'))`, ioInfo), ioInfo.default;
      throw payload._result;
    }
    function resolveDispatcher() {
      var dispatcher = ReactSharedInternals.H;
      dispatcher === null && console.error(`Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
1. You might have mismatching versions of React and the renderer (such as React DOM)
2. You might be breaking the Rules of Hooks
3. You might have more than one copy of React in the same app
See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.`);
      return dispatcher;
    }
    function releaseAsyncTransition() {
      ReactSharedInternals.asyncTransitions--;
    }
    function enqueueTask(task) {
      if (enqueueTaskImpl === null)
        try {
          var requireString = ("require" + Math.random()).slice(0, 7);
          enqueueTaskImpl = (module && module[requireString]).call(module, "timers").setImmediate;
        } catch (_err) {
          enqueueTaskImpl = function(callback) {
            didWarnAboutMessageChannel === false && (didWarnAboutMessageChannel = true, typeof MessageChannel === "undefined" && console.error("This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning."));
            var channel = new MessageChannel;
            channel.port1.onmessage = callback;
            channel.port2.postMessage(undefined);
          };
        }
      return enqueueTaskImpl(task);
    }
    function aggregateErrors(errors) {
      return 1 < errors.length && typeof AggregateError === "function" ? new AggregateError(errors) : errors[0];
    }
    function popActScope(prevActQueue, prevActScopeDepth) {
      prevActScopeDepth !== actScopeDepth - 1 && console.error("You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. ");
      actScopeDepth = prevActScopeDepth;
    }
    function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
      var queue = ReactSharedInternals.actQueue;
      if (queue !== null)
        if (queue.length !== 0)
          try {
            flushActQueue(queue);
            enqueueTask(function() {
              return recursivelyFlushAsyncActWork(returnValue, resolve, reject);
            });
            return;
          } catch (error) {
            ReactSharedInternals.thrownErrors.push(error);
          }
        else
          ReactSharedInternals.actQueue = null;
      0 < ReactSharedInternals.thrownErrors.length ? (queue = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, reject(queue)) : resolve(returnValue);
    }
    function flushActQueue(queue) {
      if (!isFlushing) {
        isFlushing = true;
        var i = 0;
        try {
          for (;i < queue.length; i++) {
            var callback = queue[i];
            do {
              ReactSharedInternals.didUsePromise = false;
              var continuation = callback(false);
              if (continuation !== null) {
                if (ReactSharedInternals.didUsePromise) {
                  queue[i] = callback;
                  queue.splice(0, i);
                  return;
                }
                callback = continuation;
              } else
                break;
            } while (1);
          }
          queue.length = 0;
        } catch (error) {
          queue.splice(0, i + 1), ReactSharedInternals.thrownErrors.push(error);
        } finally {
          isFlushing = false;
        }
      }
    }
    typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart === "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
    var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), MAYBE_ITERATOR_SYMBOL = Symbol.iterator, didWarnStateUpdateForUnmountedComponent = {}, ReactNoopUpdateQueue = {
      isMounted: function() {
        return false;
      },
      enqueueForceUpdate: function(publicInstance) {
        warnNoop(publicInstance, "forceUpdate");
      },
      enqueueReplaceState: function(publicInstance) {
        warnNoop(publicInstance, "replaceState");
      },
      enqueueSetState: function(publicInstance) {
        warnNoop(publicInstance, "setState");
      }
    }, assign = Object.assign, emptyObject = {};
    Object.freeze(emptyObject);
    Component.prototype.isReactComponent = {};
    Component.prototype.setState = function(partialState, callback) {
      if (typeof partialState !== "object" && typeof partialState !== "function" && partialState != null)
        throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
      this.updater.enqueueSetState(this, partialState, callback, "setState");
    };
    Component.prototype.forceUpdate = function(callback) {
      this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
    };
    var deprecatedAPIs = {
      isMounted: [
        "isMounted",
        "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."
      ],
      replaceState: [
        "replaceState",
        "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."
      ]
    };
    for (fnName in deprecatedAPIs)
      deprecatedAPIs.hasOwnProperty(fnName) && defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
    ComponentDummy.prototype = Component.prototype;
    deprecatedAPIs = PureComponent.prototype = new ComponentDummy;
    deprecatedAPIs.constructor = PureComponent;
    assign(deprecatedAPIs, Component.prototype);
    deprecatedAPIs.isPureReactComponent = true;
    var isArrayImpl = Array.isArray, REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = {
      H: null,
      A: null,
      T: null,
      S: null,
      actQueue: null,
      asyncTransitions: 0,
      isBatchingLegacy: false,
      didScheduleLegacyUpdate: false,
      didUsePromise: false,
      thrownErrors: [],
      getCurrentStack: null,
      recentlyCreatedOwnerStacks: 0
    }, hasOwnProperty = Object.prototype.hasOwnProperty, createTask = console.createTask ? console.createTask : function() {
      return null;
    };
    deprecatedAPIs = {
      react_stack_bottom_frame: function(callStackForError) {
        return callStackForError();
      }
    };
    var specialPropKeyWarningShown, didWarnAboutOldJSXRuntime;
    var didWarnAboutElementRef = {};
    var unknownOwnerDebugStack = deprecatedAPIs.react_stack_bottom_frame.bind(deprecatedAPIs, UnknownOwner)();
    var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
    var didWarnAboutMaps = false, userProvidedKeyEscapeRegex = /\/+/g, reportGlobalError = typeof reportError === "function" ? reportError : function(error) {
      if (typeof window === "object" && typeof window.ErrorEvent === "function") {
        var event = new window.ErrorEvent("error", {
          bubbles: true,
          cancelable: true,
          message: typeof error === "object" && error !== null && typeof error.message === "string" ? String(error.message) : String(error),
          error
        });
        if (!window.dispatchEvent(event))
          return;
      } else if (typeof process === "object" && typeof process.emit === "function") {
        process.emit("uncaughtException", error);
        return;
      }
      console.error(error);
    }, didWarnAboutMessageChannel = false, enqueueTaskImpl = null, actScopeDepth = 0, didWarnNoAwaitAct = false, isFlushing = false, queueSeveralMicrotasks = typeof queueMicrotask === "function" ? function(callback) {
      queueMicrotask(function() {
        return queueMicrotask(callback);
      });
    } : enqueueTask;
    deprecatedAPIs = Object.freeze({
      __proto__: null,
      c: function(size) {
        return resolveDispatcher().useMemoCache(size);
      }
    });
    var fnName = {
      map: mapChildren,
      forEach: function(children, forEachFunc, forEachContext) {
        mapChildren(children, function() {
          forEachFunc.apply(this, arguments);
        }, forEachContext);
      },
      count: function(children) {
        var n = 0;
        mapChildren(children, function() {
          n++;
        });
        return n;
      },
      toArray: function(children) {
        return mapChildren(children, function(child) {
          return child;
        }) || [];
      },
      only: function(children) {
        if (!isValidElement(children))
          throw Error("React.Children.only expected to receive a single React element child.");
        return children;
      }
    };
    exports.Activity = REACT_ACTIVITY_TYPE;
    exports.Children = fnName;
    exports.Component = Component;
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.Profiler = REACT_PROFILER_TYPE;
    exports.PureComponent = PureComponent;
    exports.StrictMode = REACT_STRICT_MODE_TYPE;
    exports.Suspense = REACT_SUSPENSE_TYPE;
    exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
    exports.__COMPILER_RUNTIME = deprecatedAPIs;
    exports.act = function(callback) {
      var prevActQueue = ReactSharedInternals.actQueue, prevActScopeDepth = actScopeDepth;
      actScopeDepth++;
      var queue = ReactSharedInternals.actQueue = prevActQueue !== null ? prevActQueue : [], didAwaitActCall = false;
      try {
        var result = callback();
      } catch (error) {
        ReactSharedInternals.thrownErrors.push(error);
      }
      if (0 < ReactSharedInternals.thrownErrors.length)
        throw popActScope(prevActQueue, prevActScopeDepth), callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
      if (result !== null && typeof result === "object" && typeof result.then === "function") {
        var thenable = result;
        queueSeveralMicrotasks(function() {
          didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error("You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);"));
        });
        return {
          then: function(resolve, reject) {
            didAwaitActCall = true;
            thenable.then(function(returnValue) {
              popActScope(prevActQueue, prevActScopeDepth);
              if (prevActScopeDepth === 0) {
                try {
                  flushActQueue(queue), enqueueTask(function() {
                    return recursivelyFlushAsyncActWork(returnValue, resolve, reject);
                  });
                } catch (error$0) {
                  ReactSharedInternals.thrownErrors.push(error$0);
                }
                if (0 < ReactSharedInternals.thrownErrors.length) {
                  var _thrownError = aggregateErrors(ReactSharedInternals.thrownErrors);
                  ReactSharedInternals.thrownErrors.length = 0;
                  reject(_thrownError);
                }
              } else
                resolve(returnValue);
            }, function(error) {
              popActScope(prevActQueue, prevActScopeDepth);
              0 < ReactSharedInternals.thrownErrors.length ? (error = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, reject(error)) : reject(error);
            });
          }
        };
      }
      var returnValue$jscomp$0 = result;
      popActScope(prevActQueue, prevActScopeDepth);
      prevActScopeDepth === 0 && (flushActQueue(queue), queue.length !== 0 && queueSeveralMicrotasks(function() {
        didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error("A component suspended inside an `act` scope, but the `act` call was not awaited. When testing React components that depend on asynchronous data, you must await the result:\n\nawait act(() => ...)"));
      }), ReactSharedInternals.actQueue = null);
      if (0 < ReactSharedInternals.thrownErrors.length)
        throw callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
      return {
        then: function(resolve, reject) {
          didAwaitActCall = true;
          prevActScopeDepth === 0 ? (ReactSharedInternals.actQueue = queue, enqueueTask(function() {
            return recursivelyFlushAsyncActWork(returnValue$jscomp$0, resolve, reject);
          })) : resolve(returnValue$jscomp$0);
        }
      };
    };
    exports.cache = function(fn) {
      return function() {
        return fn.apply(null, arguments);
      };
    };
    exports.cacheSignal = function() {
      return null;
    };
    exports.captureOwnerStack = function() {
      var getCurrentStack = ReactSharedInternals.getCurrentStack;
      return getCurrentStack === null ? null : getCurrentStack();
    };
    exports.cloneElement = function(element, config, children) {
      if (element === null || element === undefined)
        throw Error("The argument must be a React element, but you passed " + element + ".");
      var props = assign({}, element.props), key = element.key, owner = element._owner;
      if (config != null) {
        var JSCompiler_inline_result;
        a: {
          if (hasOwnProperty.call(config, "ref") && (JSCompiler_inline_result = Object.getOwnPropertyDescriptor(config, "ref").get) && JSCompiler_inline_result.isReactWarning) {
            JSCompiler_inline_result = false;
            break a;
          }
          JSCompiler_inline_result = config.ref !== undefined;
        }
        JSCompiler_inline_result && (owner = getOwner());
        hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key);
        for (propName in config)
          !hasOwnProperty.call(config, propName) || propName === "key" || propName === "__self" || propName === "__source" || propName === "ref" && config.ref === undefined || (props[propName] = config[propName]);
      }
      var propName = arguments.length - 2;
      if (propName === 1)
        props.children = children;
      else if (1 < propName) {
        JSCompiler_inline_result = Array(propName);
        for (var i = 0;i < propName; i++)
          JSCompiler_inline_result[i] = arguments[i + 2];
        props.children = JSCompiler_inline_result;
      }
      props = ReactElement(element.type, key, props, owner, element._debugStack, element._debugTask);
      for (key = 2;key < arguments.length; key++)
        validateChildKeys(arguments[key]);
      return props;
    };
    exports.createContext = function(defaultValue) {
      defaultValue = {
        $$typeof: REACT_CONTEXT_TYPE,
        _currentValue: defaultValue,
        _currentValue2: defaultValue,
        _threadCount: 0,
        Provider: null,
        Consumer: null
      };
      defaultValue.Provider = defaultValue;
      defaultValue.Consumer = {
        $$typeof: REACT_CONSUMER_TYPE,
        _context: defaultValue
      };
      defaultValue._currentRenderer = null;
      defaultValue._currentRenderer2 = null;
      return defaultValue;
    };
    exports.createElement = function(type, config, children) {
      for (var i = 2;i < arguments.length; i++)
        validateChildKeys(arguments[i]);
      i = {};
      var key = null;
      if (config != null)
        for (propName in didWarnAboutOldJSXRuntime || !("__self" in config) || "key" in config || (didWarnAboutOldJSXRuntime = true, console.warn("Your app (or one of its dependencies) is using an outdated JSX transform. Update to the modern JSX transform for faster performance: https://react.dev/link/new-jsx-transform")), hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key), config)
          hasOwnProperty.call(config, propName) && propName !== "key" && propName !== "__self" && propName !== "__source" && (i[propName] = config[propName]);
      var childrenLength = arguments.length - 2;
      if (childrenLength === 1)
        i.children = children;
      else if (1 < childrenLength) {
        for (var childArray = Array(childrenLength), _i = 0;_i < childrenLength; _i++)
          childArray[_i] = arguments[_i + 2];
        Object.freeze && Object.freeze(childArray);
        i.children = childArray;
      }
      if (type && type.defaultProps)
        for (propName in childrenLength = type.defaultProps, childrenLength)
          i[propName] === undefined && (i[propName] = childrenLength[propName]);
      key && defineKeyPropWarningGetter(i, typeof type === "function" ? type.displayName || type.name || "Unknown" : type);
      var propName = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
      return ReactElement(type, key, i, getOwner(), propName ? Error("react-stack-top-frame") : unknownOwnerDebugStack, propName ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
    };
    exports.createRef = function() {
      var refObject = { current: null };
      Object.seal(refObject);
      return refObject;
    };
    exports.forwardRef = function(render) {
      render != null && render.$$typeof === REACT_MEMO_TYPE ? console.error("forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...)).") : typeof render !== "function" ? console.error("forwardRef requires a render function but was given %s.", render === null ? "null" : typeof render) : render.length !== 0 && render.length !== 2 && console.error("forwardRef render functions accept exactly two parameters: props and ref. %s", render.length === 1 ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined.");
      render != null && render.defaultProps != null && console.error("forwardRef render functions do not support defaultProps. Did you accidentally pass a React component?");
      var elementType = { $$typeof: REACT_FORWARD_REF_TYPE, render }, ownName;
      Object.defineProperty(elementType, "displayName", {
        enumerable: false,
        configurable: true,
        get: function() {
          return ownName;
        },
        set: function(name) {
          ownName = name;
          render.name || render.displayName || (Object.defineProperty(render, "name", { value: name }), render.displayName = name);
        }
      });
      return elementType;
    };
    exports.isValidElement = isValidElement;
    exports.lazy = function(ctor) {
      ctor = { _status: -1, _result: ctor };
      var lazyType = {
        $$typeof: REACT_LAZY_TYPE,
        _payload: ctor,
        _init: lazyInitializer
      }, ioInfo = {
        name: "lazy",
        start: -1,
        end: -1,
        value: null,
        owner: null,
        debugStack: Error("react-stack-top-frame"),
        debugTask: console.createTask ? console.createTask("lazy()") : null
      };
      ctor._ioInfo = ioInfo;
      lazyType._debugInfo = [{ awaited: ioInfo }];
      return lazyType;
    };
    exports.memo = function(type, compare) {
      type == null && console.error("memo: The first argument must be a component. Instead received: %s", type === null ? "null" : typeof type);
      compare = {
        $$typeof: REACT_MEMO_TYPE,
        type,
        compare: compare === undefined ? null : compare
      };
      var ownName;
      Object.defineProperty(compare, "displayName", {
        enumerable: false,
        configurable: true,
        get: function() {
          return ownName;
        },
        set: function(name) {
          ownName = name;
          type.name || type.displayName || (Object.defineProperty(type, "name", { value: name }), type.displayName = name);
        }
      });
      return compare;
    };
    exports.startTransition = function(scope) {
      var prevTransition = ReactSharedInternals.T, currentTransition = {};
      currentTransition._updatedFibers = new Set;
      ReactSharedInternals.T = currentTransition;
      try {
        var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
        onStartTransitionFinish !== null && onStartTransitionFinish(currentTransition, returnValue);
        typeof returnValue === "object" && returnValue !== null && typeof returnValue.then === "function" && (ReactSharedInternals.asyncTransitions++, returnValue.then(releaseAsyncTransition, releaseAsyncTransition), returnValue.then(noop, reportGlobalError));
      } catch (error) {
        reportGlobalError(error);
      } finally {
        prevTransition === null && currentTransition._updatedFibers && (scope = currentTransition._updatedFibers.size, currentTransition._updatedFibers.clear(), 10 < scope && console.warn("Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table.")), prevTransition !== null && currentTransition.types !== null && (prevTransition.types !== null && prevTransition.types !== currentTransition.types && console.error("We expected inner Transitions to have transferred the outer types set and that you cannot add to the outer Transition while inside the inner.This is a bug in React."), prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
      }
    };
    exports.unstable_useCacheRefresh = function() {
      return resolveDispatcher().useCacheRefresh();
    };
    exports.use = function(usable) {
      return resolveDispatcher().use(usable);
    };
    exports.useActionState = function(action, initialState, permalink) {
      return resolveDispatcher().useActionState(action, initialState, permalink);
    };
    exports.useCallback = function(callback, deps) {
      return resolveDispatcher().useCallback(callback, deps);
    };
    exports.useContext = function(Context) {
      var dispatcher = resolveDispatcher();
      Context.$$typeof === REACT_CONSUMER_TYPE && console.error("Calling useContext(Context.Consumer) is not supported and will cause bugs. Did you mean to call useContext(Context) instead?");
      return dispatcher.useContext(Context);
    };
    exports.useDebugValue = function(value, formatterFn) {
      return resolveDispatcher().useDebugValue(value, formatterFn);
    };
    exports.useDeferredValue = function(value, initialValue) {
      return resolveDispatcher().useDeferredValue(value, initialValue);
    };
    exports.useEffect = function(create, deps) {
      create == null && console.warn("React Hook useEffect requires an effect callback. Did you forget to pass a callback to the hook?");
      return resolveDispatcher().useEffect(create, deps);
    };
    exports.useEffectEvent = function(callback) {
      return resolveDispatcher().useEffectEvent(callback);
    };
    exports.useId = function() {
      return resolveDispatcher().useId();
    };
    exports.useImperativeHandle = function(ref, create, deps) {
      return resolveDispatcher().useImperativeHandle(ref, create, deps);
    };
    exports.useInsertionEffect = function(create, deps) {
      create == null && console.warn("React Hook useInsertionEffect requires an effect callback. Did you forget to pass a callback to the hook?");
      return resolveDispatcher().useInsertionEffect(create, deps);
    };
    exports.useLayoutEffect = function(create, deps) {
      create == null && console.warn("React Hook useLayoutEffect requires an effect callback. Did you forget to pass a callback to the hook?");
      return resolveDispatcher().useLayoutEffect(create, deps);
    };
    exports.useMemo = function(create, deps) {
      return resolveDispatcher().useMemo(create, deps);
    };
    exports.useOptimistic = function(passthrough, reducer) {
      return resolveDispatcher().useOptimistic(passthrough, reducer);
    };
    exports.useReducer = function(reducer, initialArg, init) {
      return resolveDispatcher().useReducer(reducer, initialArg, init);
    };
    exports.useRef = function(initialValue) {
      return resolveDispatcher().useRef(initialValue);
    };
    exports.useState = function(initialState) {
      return resolveDispatcher().useState(initialState);
    };
    exports.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
      return resolveDispatcher().useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    };
    exports.useTransition = function() {
      return resolveDispatcher().useTransition();
    };
    exports.version = "19.2.3";
    typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop === "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
  })();
});

// ../../../../node_modules/.bun/react@19.2.3/node_modules/react/index.js
var require_react = __commonJS((exports, module) => {
  var react_development = __toESM(require_react_development());
  if (false) {} else {
    module.exports = react_development;
  }
});

// ../../../../node_modules/.bun/react@19.2.3/node_modules/react/cjs/react-jsx-dev-runtime.development.js
var require_react_jsx_dev_runtime_development = __commonJS((exports) => {
  var React = __toESM(require_react());
  (function() {
    function getComponentNameFromType(type) {
      if (type == null)
        return null;
      if (typeof type === "function")
        return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
      if (typeof type === "string")
        return type;
      switch (type) {
        case REACT_FRAGMENT_TYPE:
          return "Fragment";
        case REACT_PROFILER_TYPE:
          return "Profiler";
        case REACT_STRICT_MODE_TYPE:
          return "StrictMode";
        case REACT_SUSPENSE_TYPE:
          return "Suspense";
        case REACT_SUSPENSE_LIST_TYPE:
          return "SuspenseList";
        case REACT_ACTIVITY_TYPE:
          return "Activity";
      }
      if (typeof type === "object")
        switch (typeof type.tag === "number" && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof) {
          case REACT_PORTAL_TYPE:
            return "Portal";
          case REACT_CONTEXT_TYPE:
            return type.displayName || "Context";
          case REACT_CONSUMER_TYPE:
            return (type._context.displayName || "Context") + ".Consumer";
          case REACT_FORWARD_REF_TYPE:
            var innerType = type.render;
            type = type.displayName;
            type || (type = innerType.displayName || innerType.name || "", type = type !== "" ? "ForwardRef(" + type + ")" : "ForwardRef");
            return type;
          case REACT_MEMO_TYPE:
            return innerType = type.displayName || null, innerType !== null ? innerType : getComponentNameFromType(type.type) || "Memo";
          case REACT_LAZY_TYPE:
            innerType = type._payload;
            type = type._init;
            try {
              return getComponentNameFromType(type(innerType));
            } catch (x) {}
        }
      return null;
    }
    function testStringCoercion(value) {
      return "" + value;
    }
    function checkKeyStringCoercion(value) {
      try {
        testStringCoercion(value);
        var JSCompiler_inline_result = false;
      } catch (e) {
        JSCompiler_inline_result = true;
      }
      if (JSCompiler_inline_result) {
        JSCompiler_inline_result = console;
        var JSCompiler_temp_const = JSCompiler_inline_result.error;
        var JSCompiler_inline_result$jscomp$0 = typeof Symbol === "function" && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
        JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
        return testStringCoercion(value);
      }
    }
    function getTaskName(type) {
      if (type === REACT_FRAGMENT_TYPE)
        return "<>";
      if (typeof type === "object" && type !== null && type.$$typeof === REACT_LAZY_TYPE)
        return "<...>";
      try {
        var name = getComponentNameFromType(type);
        return name ? "<" + name + ">" : "<...>";
      } catch (x) {
        return "<...>";
      }
    }
    function getOwner() {
      var dispatcher = ReactSharedInternals.A;
      return dispatcher === null ? null : dispatcher.getOwner();
    }
    function UnknownOwner() {
      return Error("react-stack-top-frame");
    }
    function hasValidKey(config) {
      if (hasOwnProperty.call(config, "key")) {
        var getter = Object.getOwnPropertyDescriptor(config, "key").get;
        if (getter && getter.isReactWarning)
          return false;
      }
      return config.key !== undefined;
    }
    function defineKeyPropWarningGetter(props, displayName) {
      function warnAboutAccessingKey() {
        specialPropKeyWarningShown || (specialPropKeyWarningShown = true, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
      }
      warnAboutAccessingKey.isReactWarning = true;
      Object.defineProperty(props, "key", {
        get: warnAboutAccessingKey,
        configurable: true
      });
    }
    function elementRefGetterWithDeprecationWarning() {
      var componentName = getComponentNameFromType(this.type);
      didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = true, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
      componentName = this.props.ref;
      return componentName !== undefined ? componentName : null;
    }
    function ReactElement(type, key, props, owner, debugStack, debugTask) {
      var refProp = props.ref;
      type = {
        $$typeof: REACT_ELEMENT_TYPE,
        type,
        key,
        props,
        _owner: owner
      };
      (refProp !== undefined ? refProp : null) !== null ? Object.defineProperty(type, "ref", {
        enumerable: false,
        get: elementRefGetterWithDeprecationWarning
      }) : Object.defineProperty(type, "ref", { enumerable: false, value: null });
      type._store = {};
      Object.defineProperty(type._store, "validated", {
        configurable: false,
        enumerable: false,
        writable: true,
        value: 0
      });
      Object.defineProperty(type, "_debugInfo", {
        configurable: false,
        enumerable: false,
        writable: true,
        value: null
      });
      Object.defineProperty(type, "_debugStack", {
        configurable: false,
        enumerable: false,
        writable: true,
        value: debugStack
      });
      Object.defineProperty(type, "_debugTask", {
        configurable: false,
        enumerable: false,
        writable: true,
        value: debugTask
      });
      Object.freeze && (Object.freeze(type.props), Object.freeze(type));
      return type;
    }
    function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
      var children = config.children;
      if (children !== undefined)
        if (isStaticChildren)
          if (isArrayImpl(children)) {
            for (isStaticChildren = 0;isStaticChildren < children.length; isStaticChildren++)
              validateChildKeys(children[isStaticChildren]);
            Object.freeze && Object.freeze(children);
          } else
            console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
        else
          validateChildKeys(children);
      if (hasOwnProperty.call(config, "key")) {
        children = getComponentNameFromType(type);
        var keys = Object.keys(config).filter(function(k) {
          return k !== "key";
        });
        isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
        didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error(`A props object containing a "key" prop is being spread into JSX:
  let props = %s;
  <%s {...props} />
React keys must be passed directly to JSX without using spread:
  let props = %s;
  <%s key={someKey} {...props} />`, isStaticChildren, children, keys, children), didWarnAboutKeySpread[children + isStaticChildren] = true);
      }
      children = null;
      maybeKey !== undefined && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
      hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
      if ("key" in config) {
        maybeKey = {};
        for (var propName in config)
          propName !== "key" && (maybeKey[propName] = config[propName]);
      } else
        maybeKey = config;
      children && defineKeyPropWarningGetter(maybeKey, typeof type === "function" ? type.displayName || type.name || "Unknown" : type);
      return ReactElement(type, children, maybeKey, getOwner(), debugStack, debugTask);
    }
    function validateChildKeys(node) {
      isValidElement(node) ? node._store && (node._store.validated = 1) : typeof node === "object" && node !== null && node.$$typeof === REACT_LAZY_TYPE && (node._payload.status === "fulfilled" ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
    }
    function isValidElement(object) {
      return typeof object === "object" && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
      return null;
    };
    React = {
      react_stack_bottom_frame: function(callStackForError) {
        return callStackForError();
      }
    };
    var specialPropKeyWarningShown;
    var didWarnAboutElementRef = {};
    var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(React, UnknownOwner)();
    var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
    var didWarnAboutKeySpread = {};
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsxDEV = function(type, config, maybeKey, isStaticChildren) {
      var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
      return jsxDEVImpl(type, config, maybeKey, isStaticChildren, trackActualOwner ? Error("react-stack-top-frame") : unknownOwnerDebugStack, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
    };
  })();
});

// ../../../../node_modules/.bun/react@19.2.3/node_modules/react/jsx-dev-runtime.js
var require_jsx_dev_runtime = __commonJS((exports, module) => {
  var react_jsx_dev_runtime_development = __toESM(require_react_jsx_dev_runtime_development());
  if (false) {} else {
    module.exports = react_jsx_dev_runtime_development;
  }
});

// src/router/types.ts
var DEFAULT_ROUTER_CONFIG = {
  adapter: "heuristic",
  speculation: {
    enabled: true,
    depth: 2,
    prerenderTop: 1,
    maxPrefetch: 5
  },
  personalization: {
    featureGating: true,
    emotionTheming: true,
    componentOrdering: true,
    densityAdaptation: true
  }
};
var DEFAULT_ESI_CONFIG = {
  enabled: false,
  endpoint: process.env.ESI_ENDPOINT || "",
  timeout: 5000,
  defaultCacheTtl: 300,
  maxConcurrent: 5,
  warmupModels: ["llm"],
  tierLimits: {
    free: {
      maxInferencesPerRequest: 2,
      allowedModels: ["llm", "embed"],
      maxTokens: 500
    },
    starter: {
      maxInferencesPerRequest: 5,
      allowedModels: ["llm", "embed", "classify"],
      maxTokens: 1000
    },
    pro: {
      maxInferencesPerRequest: 20,
      allowedModels: ["llm", "embed", "classify", "vision", "tts"],
      maxTokens: 4000
    },
    enterprise: {
      maxInferencesPerRequest: 100,
      allowedModels: ["llm", "embed", "classify", "vision", "tts", "stt", "custom"],
      maxTokens: 32000
    }
  }
};
// src/router/esi-cyrano.ts
function esiContext(context, options = {}) {
  const { emitExhaust = true, id } = options;
  return {
    id: id || `esi-context-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    params: {
      model: "custom",
      custom: {
        type: "context-drop",
        emitExhaust
      }
    },
    content: {
      type: "json",
      value: JSON.stringify(context)
    },
    contextAware: true,
    signals: ["emotion", "preferences", "history", "time", "device"]
  };
}
function esiCyrano(config, options = {}) {
  const {
    intent,
    tone = "warm",
    trigger = "always",
    fallback,
    suggestTool,
    suggestRoute,
    autoAcceptNavigation = false,
    priority = 1,
    maxTriggersPerSession,
    cooldownSeconds,
    speak = false,
    showCaption = true,
    requiredTier
  } = config;
  const systemPrompt = buildCyranoSystemPrompt(intent, tone);
  return {
    id: `esi-cyrano-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    params: {
      model: "llm",
      system: systemPrompt,
      temperature: 0.7,
      maxTokens: 150,
      fallback,
      custom: {
        type: "cyrano-whisper",
        intent,
        tone,
        trigger,
        suggestTool,
        suggestRoute,
        autoAcceptNavigation,
        priority,
        maxTriggersPerSession,
        cooldownSeconds,
        speak,
        showCaption
      },
      ...options
    },
    content: {
      type: "template",
      value: buildCyranoPrompt(intent, trigger),
      variables: {
        intent,
        tone,
        trigger
      }
    },
    contextAware: true,
    signals: ["emotion", "preferences", "history", "time"],
    requiredTier
  };
}
function buildCyranoSystemPrompt(intent, tone) {
  const toneGuide = {
    warm: "Be warm, caring, and approachable. Use gentle language.",
    calm: "Be calm, measured, and reassuring. Use a steady pace.",
    encouraging: "Be supportive and uplifting. Celebrate small wins.",
    playful: "Be light-hearted and fun. Use appropriate humor.",
    professional: "Be clear and direct. Maintain professionalism.",
    empathetic: "Show deep understanding. Validate feelings.",
    neutral: "Be balanced and objective. Provide information."
  };
  const intentGuide = {
    greeting: "Welcome the user. Make them feel at home.",
    "proactive-check-in": "Check in gently. Ask how they are doing.",
    "supportive-presence": "Simply acknowledge. Let them know you are here.",
    "gentle-nudge": "Suggest an action softly. No pressure.",
    "tool-suggestion": "Recommend a tool that might help.",
    "navigation-hint": "Suggest exploring another area.",
    intervention: "Step in supportively. Offer help.",
    celebration: "Celebrate their progress. Be genuinely happy for them.",
    reflection: "Invite them to reflect. Ask thoughtful questions.",
    guidance: "Offer helpful guidance. Be a trusted advisor.",
    farewell: "Wish them well. Leave the door open.",
    custom: "Respond appropriately to the context."
  };
  return `You are Cyrano, an ambient AI companion. ${toneGuide[tone]} ${intentGuide[intent]}

Keep responses brief (1-2 sentences). Be natural and conversational.
Never start with "I" - use "You" or the situation as the subject.
Never say "As an AI" or similar phrases.
Respond to the emotional context provided.`;
}
function buildCyranoPrompt(intent, trigger) {
  const prompts = {
    greeting: "Generate a warm greeting based on the time of day and user context.",
    "proactive-check-in": "Check in with the user based on their emotional state and behavior.",
    "supportive-presence": "Acknowledge the user's presence and current activity.",
    "gentle-nudge": "Gently suggest the user might benefit from a particular action.",
    "tool-suggestion": "Suggest a specific tool that could help with the user's current state.",
    "navigation-hint": "Suggest the user might want to explore a different area.",
    intervention: "Offer supportive intervention based on detected stress or difficulty.",
    celebration: "Celebrate the user's progress or achievement.",
    reflection: "Invite the user to reflect on their current experience.",
    guidance: "Offer helpful guidance for the user's current situation.",
    farewell: "Say goodbye warmly, acknowledging the session.",
    custom: "Respond appropriately to the context provided."
  };
  let prompt = prompts[intent] || prompts.custom;
  if (trigger !== "always" && trigger !== "never") {
    prompt += ` The trigger condition is: ${trigger}.`;
  }
  return prompt;
}
function esiHalo(config, options = {}) {
  const {
    observe,
    window: window2 = "session",
    action = "whisper-to-cyrano",
    sensitivity = 0.5,
    crisisLevel = false,
    parameters = {}
  } = config;
  return {
    id: `esi-halo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    params: {
      model: "custom",
      custom: {
        type: "halo-insight",
        observe,
        window: window2,
        action,
        sensitivity,
        crisisLevel,
        parameters
      },
      ...options
    },
    content: {
      type: "json",
      value: JSON.stringify({
        observation: observe,
        window: window2,
        action,
        sensitivity,
        crisisLevel
      })
    },
    contextAware: true,
    signals: ["emotion", "history", "time"]
  };
}
function evaluateTrigger(trigger, context, sessionContext) {
  if (trigger === "always")
    return true;
  if (trigger === "never")
    return false;
  const [type, condition] = trigger.split(":");
  switch (type) {
    case "dwell": {
      const match = condition?.match(/>(\d+)s/);
      if (!match)
        return false;
      const threshold = parseInt(match[1], 10) * 1000;
      const dwellTime = sessionContext?.behavior?.dwellTime || 0;
      return dwellTime > threshold;
    }
    case "scroll": {
      const match = condition?.match(/>(\d+\.?\d*)/);
      if (!match)
        return false;
      const threshold = parseFloat(match[1]);
      const scrollDepth = sessionContext?.behavior?.scrollDepth || 0;
      return scrollDepth > threshold;
    }
    case "emotion": {
      const targetEmotion = condition;
      return sessionContext?.emotion?.primary === targetEmotion || context.emotionState?.primary === targetEmotion;
    }
    case "behavior": {
      if (condition === "aimless") {
        return sessionContext?.behavior?.isAimlessClicking === true;
      }
      if (condition === "hesitation") {
        return sessionContext?.behavior?.hesitationDetected === true;
      }
      return false;
    }
    case "hrv": {
      const match = condition?.match(/<(\d+)/);
      if (!match)
        return false;
      const threshold = parseInt(match[1], 10);
      const hrv = sessionContext?.biometric?.hrv || 100;
      return hrv < threshold;
    }
    case "stress": {
      const match = condition?.match(/>(\d+)/);
      if (!match)
        return false;
      const threshold = parseInt(match[1], 10);
      const stress = sessionContext?.biometric?.stressScore || 0;
      return stress > threshold;
    }
    case "session": {
      if (condition === "start") {
        return context.isNewSession;
      }
      const idleMatch = condition?.match(/idle:(\d+)m/);
      if (idleMatch) {
        return false;
      }
      return false;
    }
    case "navigation": {
      const targetRoute = condition?.replace("to:", "");
      return sessionContext?.currentRoute === targetRoute;
    }
    case "time": {
      const hour = context.localHour;
      if (condition === "morning")
        return hour >= 6 && hour < 12;
      if (condition === "afternoon")
        return hour >= 12 && hour < 18;
      if (condition === "evening")
        return hour >= 18 && hour < 22;
      if (condition === "night")
        return hour >= 22 || hour < 6;
      return false;
    }
    default:
      return false;
  }
}
function createExhaustEntry(directive, result, type) {
  return {
    type,
    timestamp: Date.now(),
    content: {
      directiveId: directive.id,
      output: result.output,
      model: result.model,
      success: result.success,
      latencyMs: result.latencyMs
    },
    visible: type === "cyrano" || type === "user",
    source: directive.params.model
  };
}
var CYRANO_TOOL_SUGGESTIONS = {
  breathing: {
    triggers: ["stress:>70", "hrv:<40", "emotion:anxious"],
    tool: "breathing/4-7-8",
    reason: "You seem stressed - a breathing exercise might help"
  },
  grounding: {
    triggers: ["emotion:overwhelmed", "behavior:aimless"],
    tool: "grounding/5-4-3-2-1",
    reason: "A grounding exercise can help center you"
  },
  journaling: {
    triggers: ["dwell:>120s", "emotion:reflective"],
    tool: "journaling/freeform",
    reason: "Would you like to write about what's on your mind?"
  },
  insights: {
    triggers: ["navigation:to:/insights", "dwell:>60s"],
    tool: "insights/dashboard",
    reason: "Your recent patterns are ready to explore"
  }
};
function getToolSuggestions(context, sessionContext) {
  const suggestions = [];
  for (const [, config] of Object.entries(CYRANO_TOOL_SUGGESTIONS)) {
    for (const trigger of config.triggers) {
      if (evaluateTrigger(trigger, context, sessionContext)) {
        suggestions.push({
          tool: config.tool,
          reason: config.reason,
          priority: trigger.startsWith("stress") || trigger.startsWith("hrv") ? 2 : 1
        });
        break;
      }
    }
  }
  return suggestions.sort((a, b) => b.priority - a.priority);
}

// src/router/esi.ts
var esiCache = new Map;
function getCacheKey(directive, context) {
  const contextParts = directive.contextAware ? [
    context.tier,
    context.emotionState?.primary,
    context.localHour
  ].join(":") : "";
  return directive.cacheKey || `esi:${directive.params.model}:${directive.content.value}:${contextParts}`;
}
function getCached(key) {
  const entry = esiCache.get(key);
  if (!entry)
    return null;
  if (Date.now() > entry.expiresAt) {
    esiCache.delete(key);
    return null;
  }
  return { ...entry.result, cached: true };
}
function setCache(key, result, ttl) {
  if (ttl <= 0)
    return;
  esiCache.set(key, {
    result,
    expiresAt: Date.now() + ttl * 1000
  });
}
function interpolatePrompt(content, context, signals = []) {
  let prompt = content.value;
  if (content.type === "template" && content.variables) {
    for (const [key, value] of Object.entries(content.variables)) {
      prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(value));
    }
  }
  if (signals.length > 0) {
    const contextParts = [];
    if (signals.includes("emotion") && context.emotionState) {
      contextParts.push(`User emotion: ${context.emotionState.primary} ` + `(valence: ${context.emotionState.valence.toFixed(2)}, ` + `arousal: ${context.emotionState.arousal.toFixed(2)})`);
    }
    if (signals.includes("preferences") && Object.keys(context.preferences).length > 0) {
      contextParts.push(`User preferences: ${JSON.stringify(context.preferences)}`);
    }
    if (signals.includes("history") && context.recentPages.length > 0) {
      contextParts.push(`Recent pages: ${context.recentPages.slice(-5).join(", ")}`);
    }
    if (signals.includes("time")) {
      contextParts.push(`Local time: ${context.localHour}:00, Timezone: ${context.timezone}`);
    }
    if (signals.includes("device")) {
      contextParts.push(`Device: ${context.viewport.width}x${context.viewport.height}, ` + `Connection: ${context.connection}`);
    }
    if (contextParts.length > 0) {
      prompt = `[Context]
${contextParts.join(`
`)}

[Task]
${prompt}`;
    }
  }
  return prompt;
}
function checkTierAccess(directive, context, config) {
  const tierLimits = config.tierLimits?.[context.tier];
  if (!tierLimits) {
    return { allowed: true };
  }
  if (!tierLimits.allowedModels.includes(directive.params.model)) {
    return {
      allowed: false,
      reason: `Model '${directive.params.model}' not available for ${context.tier} tier`
    };
  }
  if (directive.params.maxTokens && directive.params.maxTokens > tierLimits.maxTokens) {
    return {
      allowed: false,
      reason: `Token limit ${directive.params.maxTokens} exceeds ${context.tier} tier max of ${tierLimits.maxTokens}`
    };
  }
  return { allowed: true };
}

class EdgeWorkersESIProcessor {
  name = "edge-workers";
  config;
  warmupPromise;
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled ?? false,
      endpoint: config.endpoint || process.env.ESI_ENDPOINT || "",
      timeout: config.timeout ?? 5000,
      defaultCacheTtl: config.defaultCacheTtl ?? 300,
      maxConcurrent: config.maxConcurrent ?? 5,
      warmupModels: config.warmupModels,
      tierLimits: config.tierLimits
    };
  }
  async warmup() {
    if (this.warmupPromise)
      return this.warmupPromise;
    this.warmupPromise = (async () => {
      if (!this.config.warmupModels?.length)
        return;
      await Promise.all(this.config.warmupModels.map((model) => fetch(`${this.config.endpoint}/api/warmup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model })
      }).catch(() => {})));
    })();
    return this.warmupPromise;
  }
  isModelAvailable(model) {
    return ["llm", "embed", "vision", "tts", "stt", "emotion", "classify", "custom"].includes(model);
  }
  async process(directive, context) {
    const startTime = Date.now();
    const cacheKey = getCacheKey(directive, context);
    const cached = getCached(cacheKey);
    if (cached) {
      return cached;
    }
    const access = checkTierAccess(directive, context, this.config);
    if (!access.allowed) {
      return {
        id: directive.id,
        success: false,
        error: access.reason,
        latencyMs: Date.now() - startTime,
        cached: false,
        model: directive.params.model
      };
    }
    const prompt = directive.contextAware ? interpolatePrompt(directive.content, context, directive.signals) : directive.content.value;
    try {
      const result = await this.callEdgeWorkers(directive, prompt);
      const cacheTtl = directive.params.cacheTtl ?? this.config.defaultCacheTtl;
      setCache(cacheKey, result, cacheTtl);
      return {
        ...result,
        latencyMs: Date.now() - startTime
      };
    } catch (error) {
      if (directive.params.fallback) {
        return {
          id: directive.id,
          success: true,
          output: directive.params.fallback,
          latencyMs: Date.now() - startTime,
          cached: false,
          model: directive.params.model
        };
      }
      return {
        id: directive.id,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        latencyMs: Date.now() - startTime,
        cached: false,
        model: directive.params.model
      };
    }
  }
  async processBatch(directives, context) {
    const semaphore = new Semaphore(this.config.maxConcurrent);
    return Promise.all(directives.map(async (directive) => {
      await semaphore.acquire();
      try {
        return await this.process(directive, context);
      } finally {
        semaphore.release();
      }
    }));
  }
  async stream(directive, context, onChunk) {
    const startTime = Date.now();
    const access = checkTierAccess(directive, context, this.config);
    if (!access.allowed) {
      return {
        id: directive.id,
        success: false,
        error: access.reason,
        latencyMs: Date.now() - startTime,
        cached: false,
        model: directive.params.model
      };
    }
    const prompt = directive.contextAware ? interpolatePrompt(directive.content, context, directive.signals) : directive.content.value;
    try {
      const response = await fetch(`${this.config.endpoint}/api/llm/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: prompt,
          model: directive.params.variant,
          options: {
            temperature: directive.params.temperature,
            max_tokens: directive.params.maxTokens,
            stop: directive.params.stop,
            top_p: directive.params.topP,
            system: directive.params.system
          }
        }),
        signal: AbortSignal.timeout(directive.params.timeout ?? this.config.timeout)
      });
      if (!response.ok) {
        throw new Error(`Stream failed: ${response.status}`);
      }
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }
      const decoder = new TextDecoder;
      let fullOutput = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done)
          break;
        const chunk = decoder.decode(value);
        fullOutput += chunk;
        onChunk(chunk);
      }
      return {
        id: directive.id,
        success: true,
        output: fullOutput,
        latencyMs: Date.now() - startTime,
        cached: false,
        model: directive.params.variant || directive.params.model
      };
    } catch (error) {
      if (directive.params.fallback) {
        onChunk(directive.params.fallback);
        return {
          id: directive.id,
          success: true,
          output: directive.params.fallback,
          latencyMs: Date.now() - startTime,
          cached: false,
          model: directive.params.model
        };
      }
      return {
        id: directive.id,
        success: false,
        error: error instanceof Error ? error.message : "Stream failed",
        latencyMs: Date.now() - startTime,
        cached: false,
        model: directive.params.model
      };
    }
  }
  async callEdgeWorkers(directive, prompt) {
    const endpoint = this.getEndpointForModel(directive.params.model);
    const response = await fetch(`${this.config.endpoint}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(this.buildRequestBody(directive, prompt)),
      signal: AbortSignal.timeout(directive.params.timeout ?? this.config.timeout)
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ESI inference failed: ${response.status} - ${error}`);
    }
    const data = await response.json();
    return this.parseResponse(directive, data);
  }
  getEndpointForModel(model) {
    switch (model) {
      case "llm":
        return "/api/llm/infer";
      case "embed":
        return "/api/embed";
      case "vision":
        return "/api/vision";
      case "tts":
        return "/api/tts";
      case "stt":
        return "/api/stt";
      case "emotion":
        return "/api/emotion";
      case "classify":
        return "/api/classify";
      case "custom":
        return "/api/custom";
      default:
        return "/api/llm/infer";
    }
  }
  buildRequestBody(directive, prompt) {
    const { params, content } = directive;
    const body = {
      input: content.type === "base64" ? content.value : prompt,
      model: params.variant
    };
    if (params.model === "llm") {
      body.options = {
        temperature: params.temperature,
        max_tokens: params.maxTokens,
        stop: params.stop,
        top_p: params.topP,
        frequency_penalty: params.frequencyPenalty,
        presence_penalty: params.presencePenalty,
        system: params.system
      };
    }
    if (params.custom) {
      body.custom = params.custom;
    }
    return body;
  }
  parseResponse(directive, data) {
    const base = {
      id: directive.id,
      success: true,
      latencyMs: 0,
      cached: false,
      model: String(data.model || directive.params.model)
    };
    switch (directive.params.model) {
      case "embed":
        return { ...base, embedding: data.embedding };
      case "tts":
        return { ...base, audio: data.audio };
      default:
        return {
          ...base,
          output: String(data.output || data.text || data.result || ""),
          tokens: data.tokens
        };
    }
  }
}

class Semaphore {
  permits;
  queue = [];
  constructor(permits) {
    this.permits = permits;
  }
  async acquire() {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }
  release() {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.permits++;
    }
  }
}
function esiInfer(prompt, options = {}) {
  return {
    id: `esi-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    params: {
      model: "llm",
      ...options
    },
    content: {
      type: "text",
      value: prompt
    },
    contextAware: options.system?.includes("{context}")
  };
}
function esiEmbed(text) {
  return {
    id: `esi-embed-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    params: { model: "embed" },
    content: { type: "text", value: text }
  };
}
function esiEmotion(text, contextAware = true) {
  return {
    id: `esi-emotion-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    params: { model: "emotion" },
    content: { type: "text", value: text },
    contextAware,
    signals: contextAware ? ["emotion", "history"] : undefined
  };
}
function esiVision(base64Image, prompt, options = {}) {
  return {
    id: `esi-vision-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    params: {
      model: "vision",
      system: prompt,
      ...options
    },
    content: { type: "base64", value: base64Image }
  };
}
function esiWithContext(prompt, signals = ["emotion", "preferences", "time"], options = {}) {
  return {
    id: `esi-ctx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    params: {
      model: "llm",
      ...options
    },
    content: { type: "text", value: prompt },
    contextAware: true,
    signals
  };
}
// src/router/esi-react.tsx
var import_react = __toESM(require_react(), 1);
var jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
var ESIContext = import_react.createContext(null);
var ESIProvider = ({
  children,
  config,
  userContext,
  processor: customProcessor
}) => {
  const [processor] = import_react.useState(() => customProcessor || new EdgeWorkersESIProcessor(config));
  import_react.useEffect(() => {
    processor.warmup?.();
  }, [processor]);
  const process2 = import_react.useCallback(async (directive) => {
    if (!userContext) {
      return {
        id: directive.id,
        success: false,
        error: "No user context available",
        latencyMs: 0,
        cached: false,
        model: directive.params.model
      };
    }
    return processor.process(directive, userContext);
  }, [processor, userContext]);
  const processWithStream = import_react.useCallback(async (directive, onChunk) => {
    if (!userContext) {
      return {
        id: directive.id,
        success: false,
        error: "No user context available",
        latencyMs: 0,
        cached: false,
        model: directive.params.model
      };
    }
    if (!processor.stream) {
      return processor.process(directive, userContext);
    }
    return processor.stream(directive, userContext, onChunk);
  }, [processor, userContext]);
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ESIContext.Provider, {
    value: {
      processor,
      userContext: userContext || null,
      enabled: config?.enabled ?? true,
      process: process2,
      processWithStream
    },
    children
  }, undefined, false, undefined, this);
};
function useESI() {
  const ctx = import_react.useContext(ESIContext);
  if (!ctx) {
    throw new Error("useESI must be used within an ESIProvider");
  }
  return ctx;
}
var ESIInfer = ({
  children,
  prompt,
  model = "llm",
  variant,
  temperature,
  maxTokens,
  system,
  stream = false,
  fallback,
  loading = "...",
  contextAware = false,
  signals,
  cacheTtl,
  render,
  className,
  onComplete,
  onError
}) => {
  const { process: process2, processWithStream, enabled } = useESI();
  const [output, setOutput] = import_react.useState("");
  const [isLoading, setIsLoading] = import_react.useState(true);
  const [error, setError] = import_react.useState(null);
  const promptText = prompt || (typeof children === "string" ? children : String(children || ""));
  import_react.useEffect(() => {
    if (!enabled) {
      setOutput(typeof fallback === "string" ? fallback : "");
      setIsLoading(false);
      return;
    }
    const directive = contextAware ? esiWithContext(promptText, signals, {
      model,
      variant,
      temperature,
      maxTokens,
      system,
      cacheTtl,
      fallback: typeof fallback === "string" ? fallback : undefined
    }) : esiInfer(promptText, {
      model,
      variant,
      temperature,
      maxTokens,
      system,
      cacheTtl,
      fallback: typeof fallback === "string" ? fallback : undefined
    });
    if (stream) {
      setOutput("");
      processWithStream(directive, (chunk) => {
        setOutput((prev) => prev + chunk);
      }).then((result) => {
        setIsLoading(false);
        if (!result.success) {
          setError(result.error || "Inference failed");
          onError?.(result.error || "Inference failed");
        }
        onComplete?.(result);
      });
    } else {
      process2(directive).then((result) => {
        setIsLoading(false);
        if (result.success && result.output) {
          setOutput(result.output);
        } else {
          setError(result.error || "Inference failed");
          onError?.(result.error || "Inference failed");
        }
        onComplete?.(result);
      });
    }
  }, [promptText, model, variant, temperature, maxTokens, system, contextAware, stream, enabled]);
  if (isLoading && !stream) {
    return /* @__PURE__ */ jsx_dev_runtime.jsxDEV("span", {
      className,
      children: loading
    }, undefined, false, undefined, this);
  }
  if (error && fallback) {
    return /* @__PURE__ */ jsx_dev_runtime.jsxDEV("span", {
      className,
      children: fallback
    }, undefined, false, undefined, this);
  }
  if (render) {
    return /* @__PURE__ */ jsx_dev_runtime.jsxDEV("span", {
      className,
      children: render({
        id: "",
        success: !error,
        output,
        error: error || undefined,
        latencyMs: 0,
        cached: false,
        model
      })
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV("span", {
    className,
    children: output || (isLoading ? loading : "")
  }, undefined, false, undefined, this);
};
var ESIEmbed = ({ children, onComplete, onError }) => {
  const { process: process2, enabled } = useESI();
  const text = typeof children === "string" ? children : String(children || "");
  import_react.useEffect(() => {
    if (!enabled)
      return;
    const directive = esiEmbed(text);
    process2(directive).then((result) => {
      if (result.success && result.embedding) {
        onComplete?.(result.embedding);
      } else {
        onError?.(result.error || "Embedding failed");
      }
    });
  }, [text, enabled]);
  return null;
};
var ESIEmotion = ({
  children,
  contextAware = true,
  onComplete,
  onError
}) => {
  const { process: process2, enabled } = useESI();
  const text = typeof children === "string" ? children : String(children || "");
  import_react.useEffect(() => {
    if (!enabled)
      return;
    const directive = esiEmotion(text, contextAware);
    process2(directive).then((result) => {
      if (result.success && result.output) {
        try {
          const parsed = JSON.parse(result.output);
          onComplete?.(parsed);
        } catch {
          onComplete?.({ emotion: result.output, confidence: 1 });
        }
      } else {
        onError?.(result.error || "Emotion detection failed");
      }
    });
  }, [text, contextAware, enabled]);
  return null;
};
var ESIVision = ({
  src,
  prompt,
  fallback,
  loading = "...",
  className,
  onComplete,
  onError
}) => {
  const { process: process2, enabled } = useESI();
  const [output, setOutput] = import_react.useState("");
  const [isLoading, setIsLoading] = import_react.useState(true);
  const [error, setError] = import_react.useState(null);
  import_react.useEffect(() => {
    if (!enabled) {
      setOutput(typeof fallback === "string" ? fallback : "");
      setIsLoading(false);
      return;
    }
    const directive = esiVision(src, prompt);
    process2(directive).then((result) => {
      setIsLoading(false);
      if (result.success && result.output) {
        setOutput(result.output);
      } else {
        setError(result.error || "Vision analysis failed");
        onError?.(result.error || "Vision analysis failed");
      }
      onComplete?.(result);
    });
  }, [src, prompt, enabled]);
  if (isLoading) {
    return /* @__PURE__ */ jsx_dev_runtime.jsxDEV("span", {
      className,
      children: loading
    }, undefined, false, undefined, this);
  }
  if (error && fallback) {
    return /* @__PURE__ */ jsx_dev_runtime.jsxDEV("span", {
      className,
      children: fallback
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV("span", {
    className,
    children: output
  }, undefined, false, undefined, this);
};
function useESIInfer(options = {}) {
  const { process: process2, processWithStream, enabled } = useESI();
  const [result, setResult] = import_react.useState(null);
  const [isLoading, setIsLoading] = import_react.useState(false);
  const [error, setError] = import_react.useState(null);
  const run = import_react.useCallback(async (prompt) => {
    if (!enabled) {
      setError("ESI is disabled");
      return null;
    }
    setIsLoading(true);
    setError(null);
    const directive = options.contextAware ? esiWithContext(prompt, options.signals, {
      model: options.model,
      variant: options.variant,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      system: options.system,
      cacheTtl: options.cacheTtl
    }) : esiInfer(prompt, {
      model: options.model,
      variant: options.variant,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      system: options.system,
      cacheTtl: options.cacheTtl
    });
    try {
      let inferenceResult;
      if (options.stream) {
        let output = "";
        inferenceResult = await processWithStream(directive, (chunk) => {
          output += chunk;
          setResult((prev) => ({
            ...prev,
            output
          }));
        });
      } else {
        inferenceResult = await process2(directive);
      }
      setResult(inferenceResult);
      setIsLoading(false);
      if (!inferenceResult.success) {
        setError(inferenceResult.error || "Inference failed");
      }
      options.onComplete?.(inferenceResult);
      return inferenceResult;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      setIsLoading(false);
      options.onError?.(errorMsg);
      return null;
    }
  }, [process2, processWithStream, enabled, options]);
  const reset = import_react.useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);
  return { run, result, isLoading, error, reset };
}
var DEFAULT_ESI_STATE = {
  userTier: "free",
  emotionState: null,
  preferences: {
    theme: "auto",
    reducedMotion: false
  },
  localHour: new Date().getHours(),
  timezone: "UTC",
  features: {
    aiInference: true,
    emotionTracking: true,
    collaboration: false,
    advancedInsights: false,
    customThemes: false,
    voiceSynthesis: false,
    imageAnalysis: false
  },
  isNewSession: true,
  recentPages: [],
  viewport: { width: 1920, height: 1080 },
  connection: "4g"
};
function useGlobalESIState() {
  const [state, setState] = import_react.useState(() => {
    if (typeof window !== "undefined" && window.__AEON_ESI_STATE__) {
      return window.__AEON_ESI_STATE__;
    }
    return DEFAULT_ESI_STATE;
  });
  import_react.useEffect(() => {
    if (typeof window !== "undefined" && window.__AEON_ESI_STATE__?.subscribe) {
      const unsubscribe = window.__AEON_ESI_STATE__.subscribe((newState) => {
        setState(newState);
      });
      return unsubscribe;
    }
  }, []);
  return state;
}
function useESIFeature(feature) {
  const { features } = useGlobalESIState();
  return features[feature] ?? false;
}
function useESITier() {
  const { userTier } = useGlobalESIState();
  return userTier;
}
function useESIEmotionState() {
  const { emotionState } = useGlobalESIState();
  return emotionState;
}
function useESIPreferences() {
  const { preferences } = useGlobalESIState();
  return preferences;
}
function updateGlobalESIState(partial) {
  if (typeof window !== "undefined" && window.__AEON_ESI_STATE__?.update) {
    window.__AEON_ESI_STATE__.update(partial);
  } else if (typeof window !== "undefined" && window.__AEON_ESI_STATE__) {
    Object.assign(window.__AEON_ESI_STATE__, partial);
  }
}
var ESI = {
  Provider: ESIProvider,
  Infer: ESIInfer,
  Embed: ESIEmbed,
  Emotion: ESIEmotion,
  Vision: ESIVision
};
// src/router/heuristic-adapter.ts
var DEFAULT_CONFIG = {
  tierFeatures: {
    free: {},
    starter: {},
    pro: {},
    enterprise: {}
  },
  defaultAccent: "#336699",
  signals: {},
  defaultPaths: ["/"],
  maxSpeculationPaths: 5
};
function defaultDeriveTheme(context) {
  if (context.preferences.theme) {
    return context.preferences.theme;
  }
  const hour = context.localHour;
  const isNight = hour >= 20 || hour < 6;
  const isEvening = hour >= 18 && hour < 20;
  if (isNight) {
    return "dark";
  }
  if (isEvening) {
    return "auto";
  }
  return "light";
}
function determineDensity(context) {
  if (context.preferences.density) {
    return context.preferences.density;
  }
  const { width, height } = context.viewport;
  if (width < 768) {
    return "compact";
  }
  if (width >= 1440 && height >= 900) {
    return "comfortable";
  }
  return "normal";
}
function buildTransitionMatrix(history) {
  const matrix = {};
  for (let i = 0;i < history.length - 1; i++) {
    const from = history[i];
    const to = history[i + 1];
    if (!matrix[from]) {
      matrix[from] = {};
    }
    matrix[from][to] = (matrix[from][to] || 0) + 1;
  }
  for (const from of Object.keys(matrix)) {
    const total = Object.values(matrix[from]).reduce((a, b) => a + b, 0);
    for (const to of Object.keys(matrix[from])) {
      matrix[from][to] /= total;
    }
  }
  return matrix;
}
function defaultPredictNavigation(currentPath, context, defaultPaths, topN) {
  const history = context.recentPages;
  if (history.length >= 3) {
    const matrix = buildTransitionMatrix(history);
    const transitions = matrix[currentPath];
    if (transitions) {
      const sorted = Object.entries(transitions).sort(([, a], [, b]) => b - a).slice(0, topN).map(([path]) => path);
      if (sorted.length > 0) {
        return sorted;
      }
    }
  }
  return defaultPaths.filter((p) => p !== currentPath).slice(0, topN);
}
function defaultScoreRelevance(node, context) {
  let score = 50;
  if (node.requiredTier) {
    const tierOrder = ["free", "starter", "pro", "enterprise"];
    const requiredIndex = tierOrder.indexOf(node.requiredTier);
    const userIndex = tierOrder.indexOf(context.tier);
    if (userIndex < requiredIndex) {
      return 0;
    }
    score += 10;
  }
  if (node.relevanceSignals) {
    for (const signal of node.relevanceSignals) {
      if (signal.startsWith("recentPage:")) {
        const page = signal.slice("recentPage:".length);
        if (context.recentPages.includes(page)) {
          score += 20;
        }
      }
      if (signal.startsWith("timeOfDay:")) {
        const timeRange = signal.slice("timeOfDay:".length);
        const hour = context.localHour;
        if (timeRange === "morning" && hour >= 5 && hour < 12)
          score += 15;
        if (timeRange === "afternoon" && hour >= 12 && hour < 17)
          score += 15;
        if (timeRange === "evening" && hour >= 17 && hour < 21)
          score += 15;
        if (timeRange === "night" && (hour >= 21 || hour < 5))
          score += 15;
      }
      if (signal.startsWith("preference:")) {
        const pref = signal.slice("preference:".length);
        if (context.preferences[pref]) {
          score += 20;
        }
      }
      if (signal.startsWith("tier:")) {
        const requiredTier = signal.slice("tier:".length);
        const tierOrder = ["free", "starter", "pro", "enterprise"];
        if (tierOrder.indexOf(context.tier) >= tierOrder.indexOf(requiredTier)) {
          score += 15;
        }
      }
    }
  }
  if (node.defaultHidden) {
    score -= 30;
  }
  return Math.max(0, Math.min(100, score));
}
function orderComponentsByRelevance(tree, context, scoreRelevance) {
  const scored = [];
  tree.nodes.forEach((node, id) => {
    scored.push({
      id,
      score: scoreRelevance(node, context)
    });
  });
  return scored.sort((a, b) => b.score - a.score).map((s) => s.id);
}
function findHiddenComponents(tree, context, scoreRelevance) {
  const hidden = [];
  tree.nodes.forEach((node, id) => {
    const score = scoreRelevance(node, context);
    if (score === 0) {
      hidden.push(id);
    }
  });
  return hidden;
}
function computeSkeletonHints(route, context, tree) {
  let layout = "custom";
  if (route === "/" || route.includes("dashboard")) {
    layout = "dashboard";
  } else if (route.includes("chat") || route.includes("message")) {
    layout = "chat";
  } else if (route.includes("setting") || route.includes("config")) {
    layout = "settings";
  } else if (route.includes("tool")) {
    layout = "tools";
  }
  const baseHeight = context.viewport.height;
  const contentMultiplier = tree.nodes.size > 10 ? 1.5 : 1;
  const estimatedHeight = Math.round(baseHeight * contentMultiplier);
  const sections = tree.getChildren(tree.rootId).map((child, i) => ({
    id: child.id,
    height: Math.round(estimatedHeight / (tree.nodes.size || 1)),
    priority: i + 1
  }));
  return {
    layout,
    estimatedHeight,
    sections
  };
}
function getPrefetchDepth(context) {
  switch (context.connection) {
    case "fast":
    case "4g":
      return { prefetch: 5, prerender: 1 };
    case "3g":
      return { prefetch: 3, prerender: 0 };
    case "2g":
      return { prefetch: 1, prerender: 0 };
    case "slow-2g":
      return { prefetch: 0, prerender: 0 };
    default:
      return { prefetch: 3, prerender: 0 };
  }
}

class HeuristicAdapter {
  name = "heuristic";
  config;
  constructor(config = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      tierFeatures: config.tierFeatures ?? DEFAULT_CONFIG.tierFeatures,
      signals: config.signals ?? DEFAULT_CONFIG.signals
    };
  }
  async route(path, context, tree) {
    const startTime = Date.now();
    const sessionId = this.generateSessionId(path, context);
    const featureFlags = { ...this.config.tierFeatures[context.tier] };
    const theme = this.config.signals.deriveTheme ? this.config.signals.deriveTheme(context) : defaultDeriveTheme(context);
    const accent = this.config.signals.deriveAccent ? this.config.signals.deriveAccent(context) : this.config.defaultAccent;
    const density = determineDensity(context);
    const scoreRelevance = this.config.signals.scoreRelevance ?? defaultScoreRelevance;
    const componentOrder = orderComponentsByRelevance(tree, context, scoreRelevance);
    const hiddenComponents = findHiddenComponents(tree, context, scoreRelevance);
    const predictions = this.config.signals.predictNavigation ? this.config.signals.predictNavigation(path, context) : defaultPredictNavigation(path, context, this.config.defaultPaths, this.config.maxSpeculationPaths);
    const { prefetch: prefetchDepth, prerender: prerenderCount } = getPrefetchDepth(context);
    const prefetch = predictions.slice(0, prefetchDepth);
    const prerender = predictions.slice(0, prerenderCount);
    const skeleton = computeSkeletonHints(path, context, tree);
    return {
      route: path,
      sessionId,
      componentOrder,
      hiddenComponents,
      featureFlags,
      theme,
      accent,
      density,
      prefetch,
      prerender,
      skeleton,
      routedAt: startTime,
      routerName: this.name,
      confidence: 0.85
    };
  }
  async speculate(currentPath, context) {
    return this.config.signals.predictNavigation ? this.config.signals.predictNavigation(currentPath, context) : defaultPredictNavigation(currentPath, context, this.config.defaultPaths, this.config.maxSpeculationPaths);
  }
  personalizeTree(tree, decision) {
    const cloned = tree.clone();
    if (decision.hiddenComponents) {
      for (const id of decision.hiddenComponents) {
        const node = cloned.getNode(id);
        if (node) {
          node.defaultHidden = true;
        }
      }
    }
    return cloned;
  }
  emotionToAccent(emotionState) {
    if (this.config.signals.deriveAccent) {
      return this.config.signals.deriveAccent({
        emotionState,
        tier: "free",
        recentPages: [],
        dwellTimes: new Map,
        clickPatterns: [],
        preferences: {},
        viewport: { width: 0, height: 0 },
        connection: "fast",
        reducedMotion: false,
        localHour: 12,
        timezone: "UTC",
        isNewSession: true
      });
    }
    return this.config.defaultAccent;
  }
  generateSessionId(path, context) {
    const base = path.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "index";
    const userId = context.userId || "anon";
    const sessionPrefix = context.sessionId || Date.now().toString(36);
    return `${base}-${userId.slice(0, 8)}-${sessionPrefix.slice(0, 8)}`;
  }
}
// src/router/context-extractor.ts
function parseCookies(cookieHeader) {
  if (!cookieHeader)
    return {};
  return cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    if (key && value) {
      acc[key] = decodeURIComponent(value);
    }
    return acc;
  }, {});
}
function parseJSON(value, fallback) {
  if (!value)
    return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
function extractViewport(request) {
  const headers = request.headers;
  const viewportWidth = headers.get("sec-ch-viewport-width");
  const viewportHeight = headers.get("sec-ch-viewport-height");
  const dpr = headers.get("sec-ch-dpr");
  if (viewportWidth && viewportHeight) {
    return {
      width: parseInt(viewportWidth, 10),
      height: parseInt(viewportHeight, 10),
      devicePixelRatio: dpr ? parseFloat(dpr) : undefined
    };
  }
  const xViewport = headers.get("x-viewport");
  if (xViewport) {
    const [width, height, devicePixelRatio] = xViewport.split(",").map(Number);
    return { width: width || 1920, height: height || 1080, devicePixelRatio };
  }
  return { width: 1920, height: 1080 };
}
function extractConnection(request) {
  const headers = request.headers;
  const downlink = headers.get("downlink");
  const rtt = headers.get("rtt");
  const ect = headers.get("ect");
  if (ect) {
    switch (ect) {
      case "4g":
        return "fast";
      case "3g":
        return "3g";
      case "2g":
        return "2g";
      case "slow-2g":
        return "slow-2g";
    }
  }
  if (downlink) {
    const mbps = parseFloat(downlink);
    if (mbps >= 10)
      return "fast";
    if (mbps >= 2)
      return "4g";
    if (mbps >= 0.5)
      return "3g";
    if (mbps >= 0.1)
      return "2g";
    return "slow-2g";
  }
  if (rtt) {
    const ms = parseInt(rtt, 10);
    if (ms < 50)
      return "fast";
    if (ms < 100)
      return "4g";
    if (ms < 300)
      return "3g";
    if (ms < 700)
      return "2g";
    return "slow-2g";
  }
  return "4g";
}
function extractReducedMotion(request) {
  const prefersReducedMotion = request.headers.get("sec-ch-prefers-reduced-motion");
  return prefersReducedMotion === "reduce";
}
function extractTimeContext(request) {
  const headers = request.headers;
  const xTimezone = headers.get("x-timezone");
  const xLocalHour = headers.get("x-local-hour");
  const cfTimezone = request.cf?.timezone;
  const timezone = xTimezone || cfTimezone || "UTC";
  const localHour = xLocalHour ? parseInt(xLocalHour, 10) : new Date().getUTCHours();
  return { timezone, localHour };
}
function extractIdentity(cookies, request) {
  const userId = cookies["user_id"] || request.headers.get("x-user-id") || undefined;
  const tierCookie = cookies["user_tier"];
  const tierHeader = request.headers.get("x-user-tier");
  const tier = tierCookie || tierHeader || "free";
  return { userId, tier };
}
function extractNavigationHistory(cookies) {
  const recentPages = parseJSON(cookies["recent_pages"], []);
  const dwellTimesObj = parseJSON(cookies["dwell_times"], {});
  const clickPatterns = parseJSON(cookies["click_patterns"], []);
  return {
    recentPages,
    dwellTimes: new Map(Object.entries(dwellTimesObj)),
    clickPatterns
  };
}
function extractEmotionState(cookies, request) {
  const xEmotion = request.headers.get("x-emotion-state");
  if (xEmotion) {
    return parseJSON(xEmotion, undefined);
  }
  const emotionCookie = cookies["emotion_state"];
  if (emotionCookie) {
    return parseJSON(emotionCookie, undefined);
  }
  return;
}
function extractPreferences(cookies) {
  return parseJSON(cookies["user_preferences"], {});
}
function extractSessionInfo(cookies) {
  const sessionId = cookies["session_id"];
  const sessionStarted = cookies["session_started"];
  return {
    sessionId,
    isNewSession: !sessionId,
    sessionStartedAt: sessionStarted ? new Date(sessionStarted) : undefined
  };
}
async function extractUserContext(request, options = {}) {
  const cookies = parseCookies(request.headers.get("cookie"));
  const viewport = extractViewport(request);
  const connection = extractConnection(request);
  const reducedMotion = extractReducedMotion(request);
  const { timezone, localHour } = extractTimeContext(request);
  const { userId, tier: initialTier } = extractIdentity(cookies, request);
  const { recentPages, dwellTimes, clickPatterns } = extractNavigationHistory(cookies);
  const preferences = extractPreferences(cookies);
  const { sessionId, isNewSession, sessionStartedAt } = extractSessionInfo(cookies);
  let tier = initialTier;
  if (options.resolveUserTier && userId) {
    try {
      tier = await options.resolveUserTier(userId);
    } catch {}
  }
  let emotionState = extractEmotionState(cookies, request);
  if (!emotionState && options.detectEmotion) {
    try {
      emotionState = await options.detectEmotion(request);
    } catch {}
  }
  let context = {
    userId,
    tier,
    recentPages,
    dwellTimes,
    clickPatterns,
    emotionState,
    preferences,
    viewport,
    connection,
    reducedMotion,
    localHour,
    timezone,
    sessionId,
    isNewSession,
    sessionStartedAt
  };
  if (options.enrich) {
    context = await options.enrich(context, request);
  }
  return context;
}
function createContextMiddleware(options = {}) {
  return async (request) => {
    return extractUserContext(request, options);
  };
}
function setContextCookies(response, context, currentPath) {
  const headers = new Headers(response.headers);
  const recentPages = [...context.recentPages.slice(-9), currentPath];
  headers.append("Set-Cookie", `recent_pages=${encodeURIComponent(JSON.stringify(recentPages))}; Path=/; Max-Age=604800; SameSite=Lax`);
  if (context.isNewSession) {
    const sessionId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    headers.append("Set-Cookie", `session_id=${sessionId}; Path=/; Max-Age=86400; SameSite=Lax`);
    headers.append("Set-Cookie", `session_started=${new Date().toISOString()}; Path=/; Max-Age=86400; SameSite=Lax`);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
function addSpeculationHeaders(response, prefetch, prerender) {
  const headers = new Headers(response.headers);
  if (prefetch.length > 0) {
    const linkHeader = prefetch.map((path) => `<${path}>; rel=prefetch`).join(", ");
    headers.append("Link", linkHeader);
  }
  if (prerender.length > 0) {
    headers.set("X-Prerender-Hints", prerender.join(","));
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
function serializeToESIState(context) {
  const tierFeatures = {
    free: {
      aiInference: true,
      emotionTracking: true,
      collaboration: false,
      advancedInsights: false,
      customThemes: false,
      voiceSynthesis: false,
      imageAnalysis: false
    },
    starter: {
      aiInference: true,
      emotionTracking: true,
      collaboration: false,
      advancedInsights: true,
      customThemes: true,
      voiceSynthesis: false,
      imageAnalysis: false
    },
    pro: {
      aiInference: true,
      emotionTracking: true,
      collaboration: true,
      advancedInsights: true,
      customThemes: true,
      voiceSynthesis: true,
      imageAnalysis: true
    },
    enterprise: {
      aiInference: true,
      emotionTracking: true,
      collaboration: true,
      advancedInsights: true,
      customThemes: true,
      voiceSynthesis: true,
      imageAnalysis: true
    }
  };
  return {
    userTier: context.tier,
    emotionState: context.emotionState ? {
      primary: context.emotionState.primary,
      valence: context.emotionState.valence,
      arousal: context.emotionState.arousal,
      confidence: context.emotionState.confidence
    } : undefined,
    preferences: {
      theme: context.preferences.theme,
      reducedMotion: context.reducedMotion,
      language: context.preferences.language
    },
    sessionId: context.sessionId,
    localHour: context.localHour,
    timezone: context.timezone,
    features: tierFeatures[context.tier],
    userId: context.userId,
    isNewSession: context.isNewSession,
    recentPages: context.recentPages.slice(-10),
    viewport: {
      width: context.viewport.width,
      height: context.viewport.height
    },
    connection: context.connection
  };
}
function generateESIStateScript(esiState) {
  const stateJson = JSON.stringify(esiState);
  return `<script>window.__AEON_ESI_STATE__=${stateJson};</script>`;
}
function generateESIStateScriptFromContext(context) {
  const esiState = serializeToESIState(context);
  return generateESIStateScript(esiState);
}
// src/router/speculation.ts
function supportsSpeculationRules() {
  if (typeof document === "undefined")
    return false;
  return "supports" in HTMLScriptElement && HTMLScriptElement.supports?.("speculationrules");
}
function supportsLinkPrefetch() {
  if (typeof document === "undefined")
    return false;
  const link = document.createElement("link");
  return link.relList?.supports?.("prefetch") ?? false;
}
function addSpeculationRules(prefetch, prerender) {
  if (!supportsSpeculationRules())
    return null;
  const rules = {};
  if (prefetch.length > 0) {
    rules.prefetch = [{ urls: prefetch }];
  }
  if (prerender.length > 0) {
    rules.prerender = [{ urls: prerender }];
  }
  if (Object.keys(rules).length === 0)
    return null;
  const script = document.createElement("script");
  script.type = "speculationrules";
  script.textContent = JSON.stringify(rules);
  document.head.appendChild(script);
  return script;
}
function removeSpeculationRules(script) {
  script.remove();
}
function linkPrefetch(path) {
  if (!supportsLinkPrefetch())
    return null;
  const existing = document.querySelector(`link[rel="prefetch"][href="${path}"]`);
  if (existing)
    return existing;
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = path;
  document.head.appendChild(link);
  return link;
}
function removePrefetch(link) {
  link.remove();
}

class SpeculationManager {
  options;
  state;
  observers = new Map;
  hoverTimers = new Map;
  speculationScript = null;
  prefetchLinks = new Map;
  constructor(options = {}) {
    this.options = {
      maxPrefetch: options.maxPrefetch ?? 5,
      maxPrerender: options.maxPrerender ?? 1,
      hoverDelay: options.hoverDelay ?? 100,
      prefetchOnVisible: options.prefetchOnVisible ?? true,
      visibilityThreshold: options.visibilityThreshold ?? 0.1,
      cacheDuration: options.cacheDuration ?? 5 * 60 * 1000,
      onSpeculate: options.onSpeculate ?? (() => {})
    };
    this.state = {
      prefetched: new Set,
      prerendered: new Set,
      pending: new Set
    };
  }
  initFromHints(prefetch = [], prerender = []) {
    const newPrefetch = prefetch.filter((p) => !this.state.prefetched.has(p) && !this.state.prerendered.has(p)).slice(0, this.options.maxPrefetch);
    const newPrerender = prerender.filter((p) => !this.state.prerendered.has(p)).slice(0, this.options.maxPrerender);
    if (supportsSpeculationRules()) {
      this.speculationScript = addSpeculationRules(newPrefetch, newPrerender);
      newPrefetch.forEach((p) => {
        this.state.prefetched.add(p);
        this.options.onSpeculate(p, "prefetch");
      });
      newPrerender.forEach((p) => {
        this.state.prerendered.add(p);
        this.options.onSpeculate(p, "prerender");
      });
    } else {
      newPrefetch.forEach((path) => {
        const link = linkPrefetch(path);
        if (link) {
          this.prefetchLinks.set(path, link);
          this.state.prefetched.add(path);
          this.options.onSpeculate(path, "prefetch");
        }
      });
    }
  }
  prefetch(path) {
    if (this.state.prefetched.has(path) || this.state.prerendered.has(path)) {
      return false;
    }
    if (this.state.prefetched.size >= this.options.maxPrefetch) {
      return false;
    }
    if (supportsSpeculationRules()) {
      const allPrefetch = [...this.state.prefetched, path];
      const allPrerender = [...this.state.prerendered];
      if (this.speculationScript) {
        removeSpeculationRules(this.speculationScript);
      }
      this.speculationScript = addSpeculationRules(allPrefetch, allPrerender);
    } else {
      const link = linkPrefetch(path);
      if (link) {
        this.prefetchLinks.set(path, link);
      }
    }
    this.state.prefetched.add(path);
    this.options.onSpeculate(path, "prefetch");
    return true;
  }
  watchHover(element) {
    const path = new URL(element.href, window.location.href).pathname;
    const handleMouseEnter = () => {
      if (this.state.prefetched.has(path) || this.state.pending.has(path)) {
        return;
      }
      this.state.pending.add(path);
      const timer = setTimeout(() => {
        this.prefetch(path);
        this.state.pending.delete(path);
      }, this.options.hoverDelay);
      this.hoverTimers.set(element, timer);
    };
    const handleMouseLeave = () => {
      const timer = this.hoverTimers.get(element);
      if (timer) {
        clearTimeout(timer);
        this.hoverTimers.delete(element);
      }
      this.state.pending.delete(path);
    };
    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
      handleMouseLeave();
    };
  }
  watchVisible(element) {
    if (!this.options.prefetchOnVisible) {
      return () => {};
    }
    const path = new URL(element.href, window.location.href).pathname;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.prefetch(path);
          observer.disconnect();
          this.observers.delete(element);
        }
      });
    }, { threshold: this.options.visibilityThreshold });
    observer.observe(element);
    this.observers.set(element, observer);
    return () => {
      observer.disconnect();
      this.observers.delete(element);
    };
  }
  watchAllLinks() {
    const links = document.querySelectorAll('a[href^="/"]');
    const cleanups = [];
    links.forEach((link) => {
      if (link instanceof HTMLAnchorElement) {
        cleanups.push(this.watchHover(link));
        cleanups.push(this.watchVisible(link));
      }
    });
    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }
  clear() {
    if (this.speculationScript) {
      removeSpeculationRules(this.speculationScript);
      this.speculationScript = null;
    }
    this.prefetchLinks.forEach((link) => removePrefetch(link));
    this.prefetchLinks.clear();
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
    this.hoverTimers.forEach((timer) => clearTimeout(timer));
    this.hoverTimers.clear();
    this.state.prefetched.clear();
    this.state.prerendered.clear();
    this.state.pending.clear();
  }
  getState() {
    return {
      prefetched: new Set(this.state.prefetched),
      prerendered: new Set(this.state.prerendered),
      pending: new Set(this.state.pending)
    };
  }
}
function createSpeculationHook(useState2, useEffect2, useRef) {
  return function useSpeculation(options = {}) {
    const managerRef = useRef(null);
    const [state, setState] = useState2({
      prefetched: new Set,
      prerendered: new Set,
      pending: new Set
    });
    useEffect2(() => {
      managerRef.current = new SpeculationManager({
        ...options,
        onSpeculate: (path, type) => {
          options.onSpeculate?.(path, type);
          setState(managerRef.current.getState());
        }
      });
      const cleanup = managerRef.current.watchAllLinks();
      return () => {
        cleanup();
        managerRef.current?.clear();
      };
    }, []);
    return {
      state,
      prefetch: (path) => managerRef.current?.prefetch(path),
      initFromHints: (prefetch, prerender) => managerRef.current?.initFromHints(prefetch, prerender),
      clear: () => managerRef.current?.clear()
    };
  };
}
function autoInitSpeculation() {
  if (typeof window === "undefined")
    return null;
  const hints = window.__AEON_SPECULATION__;
  const manager = new SpeculationManager;
  if (hints) {
    manager.initFromHints(hints.prefetch || [], hints.prerender || []);
  }
  manager.watchAllLinks();
  return manager;
}
// src/router/esi-control.ts
function generateSchemaPrompt(schema) {
  const schemaDescription = describeZodSchema(schema);
  return `

Respond with valid JSON matching this schema:
${schemaDescription}

Output ONLY the JSON, no markdown, no explanation.`;
}
function describeZodSchema(schema) {
  const def = schema._def;
  if (def.typeName === "ZodObject") {
    const shape = def.shape;
    const fields = Object.entries(shape).map(([key, fieldSchema]) => {
      const fieldDef = fieldSchema._def;
      return `  "${key}": ${describeZodType(fieldDef)}`;
    });
    return `{
${fields.join(`,
`)}
}`;
  }
  return describeZodType(def);
}
function describeZodType(def) {
  const typeName = def.typeName;
  switch (typeName) {
    case "ZodString":
      return "string";
    case "ZodNumber":
      return "number";
    case "ZodBoolean":
      return "boolean";
    case "ZodArray":
      const innerType = def.type;
      return `array of ${describeZodType(innerType._def)}`;
    case "ZodEnum":
      const values = def.values;
      return `one of: ${values.map((v) => `"${v}"`).join(" | ")}`;
    case "ZodLiteral":
      return JSON.stringify(def.value);
    case "ZodOptional":
      const optionalType = def.innerType;
      return `${describeZodType(optionalType._def)} (optional)`;
    case "ZodNullable":
      const nullableType = def.innerType;
      return `${describeZodType(nullableType._def)} or null`;
    case "ZodObject":
      return "object";
    default:
      return "any";
  }
}
function parseWithSchema(output, schema) {
  let jsonStr = output.trim();
  if (jsonStr.startsWith("```")) {
    const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      jsonStr = match[1].trim();
    }
  }
  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        return {
          success: false,
          errors: [`Failed to parse JSON: ${e instanceof Error ? e.message : "Unknown error"}`]
        };
      }
    } else {
      return {
        success: false,
        errors: [`No valid JSON found in output`]
      };
    }
  }
  const result = schema.safeParse(parsed);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`)
  };
}
function createControlProcessor(processESI) {
  return {
    async processWithSchema(prompt, schema, params, context) {
      const fullPrompt = prompt + generateSchemaPrompt(schema);
      const directive = {
        id: `esi-schema-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        params: {
          model: "llm",
          ...params
        },
        content: {
          type: "text",
          value: fullPrompt
        }
      };
      const result = await processESI(directive, context);
      if (!result.success || !result.output) {
        return {
          ...result,
          validationErrors: result.error ? [result.error] : ["No output"]
        };
      }
      const parseResult = parseWithSchema(result.output, schema);
      if (parseResult.success) {
        return {
          ...result,
          data: parseResult.data,
          rawOutput: result.output
        };
      }
      return {
        ...result,
        rawOutput: result.output,
        validationErrors: parseResult.errors
      };
    },
    async processIf(directive, context) {
      const schemaResult = await this.processWithSchema(directive.prompt, directive.schema, directive.params || {}, context);
      let conditionMet = false;
      if (schemaResult.data !== undefined) {
        try {
          conditionMet = directive.when(schemaResult.data, context);
        } catch (e) {
          conditionMet = false;
        }
      }
      return {
        id: directive.id,
        conditionMet,
        data: schemaResult.data,
        inferenceResult: schemaResult
      };
    },
    async processMatch(directive, context) {
      const schemaResult = await this.processWithSchema(directive.prompt, directive.schema, directive.params || {}, context);
      let matchedCase;
      if (schemaResult.data !== undefined) {
        for (const caseItem of directive.cases) {
          try {
            if (caseItem.match(schemaResult.data, context)) {
              matchedCase = caseItem.id;
              break;
            }
          } catch {}
        }
        if (!matchedCase && directive.defaultCase) {
          matchedCase = directive.defaultCase;
        }
      }
      return {
        id: directive.id,
        matchedCase,
        data: schemaResult.data,
        inferenceResult: schemaResult
      };
    }
  };
}
function esiIf(prompt, schema, when, options = {}) {
  return {
    id: `esi-if-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    prompt,
    schema,
    when,
    params: options
  };
}
function esiMatch(prompt, schema, cases, defaultCase, options = {}) {
  return {
    id: `esi-match-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    prompt,
    schema,
    cases,
    defaultCase,
    params: options
  };
}
// src/router/esi-control-react.tsx
var import_react2 = __toESM(require_react(), 1);
var jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime(), 1);
var PresenceContext = import_react2.createContext(null);
function usePresenceForESI() {
  const ctx = import_react2.useContext(PresenceContext);
  return ctx || { users: [], localUser: null };
}
function ESIStructured({
  children,
  prompt,
  schema,
  render,
  fallback,
  loading = "...",
  retryOnFail = false,
  maxRetries = 2,
  temperature,
  maxTokens,
  cacheTtl,
  onSuccess,
  onValidationError,
  onError,
  className
}) {
  const { process: process2, enabled } = useESI();
  const [result, setResult] = import_react2.useState(null);
  const [isLoading, setIsLoading] = import_react2.useState(true);
  const [retryCount, setRetryCount] = import_react2.useState(0);
  const promptText = prompt || (typeof children === "string" ? children : String(children || ""));
  const fullPrompt = promptText + generateSchemaPrompt(schema);
  import_react2.useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    async function runInference() {
      setIsLoading(true);
      const directive = {
        id: `esi-structured-${Date.now()}`,
        params: {
          model: "llm",
          temperature,
          maxTokens,
          cacheTtl
        },
        content: {
          type: "text",
          value: fullPrompt
        }
      };
      const inferenceResult = await process2(directive);
      if (!inferenceResult.success || !inferenceResult.output) {
        setResult({
          ...inferenceResult,
          validationErrors: [inferenceResult.error || "No output"]
        });
        onError?.(inferenceResult.error || "Inference failed");
        setIsLoading(false);
        return;
      }
      const parseResult = parseWithSchema(inferenceResult.output, schema);
      if (parseResult.success) {
        const schemaResult = {
          ...inferenceResult,
          data: parseResult.data,
          rawOutput: inferenceResult.output
        };
        setResult(schemaResult);
        onSuccess?.(parseResult.data);
      } else {
        if (retryOnFail && retryCount < maxRetries) {
          setRetryCount((c) => c + 1);
        } else {
          const schemaResult = {
            ...inferenceResult,
            rawOutput: inferenceResult.output,
            validationErrors: parseResult.errors
          };
          setResult(schemaResult);
          onValidationError?.(parseResult.errors, inferenceResult.output);
        }
      }
      setIsLoading(false);
    }
    runInference();
  }, [fullPrompt, enabled, retryCount]);
  if (isLoading) {
    return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
      className,
      children: loading
    }, undefined, false, undefined, this);
  }
  if (!result?.data) {
    return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
      className,
      children: fallback
    }, undefined, false, undefined, this);
  }
  if (render) {
    return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
      className,
      children: render(result.data, {
        cached: result.cached,
        latencyMs: result.latencyMs
      })
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
    className,
    children: JSON.stringify(result.data)
  }, undefined, false, undefined, this);
}
function ESIIf({
  children,
  prompt,
  schema,
  when,
  then: thenContent,
  else: elseContent,
  loading = null,
  temperature,
  cacheTtl,
  onEvaluate,
  className
}) {
  const [conditionMet, setConditionMet] = import_react2.useState(null);
  const [data, setData] = import_react2.useState(null);
  const handleSuccess = import_react2.useCallback((result) => {
    setData(result);
    try {
      const met = when(result, {});
      setConditionMet(met);
      onEvaluate?.(result, met);
    } catch {
      setConditionMet(false);
    }
  }, [when, onEvaluate]);
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
    className,
    children: [
      /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ESIStructured, {
        prompt,
        schema,
        temperature,
        cacheTtl,
        loading,
        onSuccess: handleSuccess,
        render: () => null,
        children
      }, undefined, false, undefined, this),
      conditionMet === true && thenContent,
      conditionMet === false && elseContent
    ]
  }, undefined, true, undefined, this);
}
function ESICase({ children }) {
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(jsx_dev_runtime2.Fragment, {
    children
  }, undefined, false, undefined, this);
}
function ESIDefault({ children }) {
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(jsx_dev_runtime2.Fragment, {
    children
  }, undefined, false, undefined, this);
}
function ESIMatch({
  children,
  prompt,
  schema,
  loading = null,
  temperature,
  cacheTtl,
  onMatch,
  className
}) {
  const [matchedIndex, setMatchedIndex] = import_react2.useState(null);
  const [data, setData] = import_react2.useState(null);
  const { cases, defaultCase, promptFromChildren } = import_react2.useMemo(() => {
    const cases2 = [];
    let defaultCase2 = null;
    let promptFromChildren2 = "";
    import_react2.Children.forEach(children, (child) => {
      if (!import_react2.isValidElement(child)) {
        if (typeof child === "string") {
          promptFromChildren2 += child;
        }
        return;
      }
      if (child.type === ESICase) {
        const props = child.props;
        cases2.push({
          match: props.match,
          content: props.children
        });
      } else if (child.type === ESIDefault) {
        defaultCase2 = child.props.children;
      }
    });
    return { cases: cases2, defaultCase: defaultCase2, promptFromChildren: promptFromChildren2 };
  }, [children]);
  const handleSuccess = import_react2.useCallback((result) => {
    setData(result);
    for (let i = 0;i < cases.length; i++) {
      try {
        if (cases[i].match(result, {})) {
          setMatchedIndex(i);
          onMatch?.(result, i);
          return;
        }
      } catch {}
    }
    setMatchedIndex(-1);
    onMatch?.(result, -1);
  }, [cases, onMatch]);
  const finalPrompt = prompt || promptFromChildren;
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
    className,
    children: [
      /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ESIStructured, {
        prompt: finalPrompt,
        schema,
        temperature,
        cacheTtl,
        loading,
        onSuccess: handleSuccess,
        render: () => null
      }, undefined, false, undefined, this),
      matchedIndex !== null && matchedIndex >= 0 && cases[matchedIndex]?.content,
      matchedIndex === -1 && defaultCase
    ]
  }, undefined, true, undefined, this);
}
function defaultDescribeUsers(users) {
  if (users.length === 0)
    return "No other users are viewing this content.";
  if (users.length === 1)
    return `1 user is viewing: ${describeUser(users[0])}`;
  const roles = [...new Set(users.map((u) => u.role).filter(Boolean))];
  const roleStr = roles.length > 0 ? ` with roles: ${roles.join(", ")}` : "";
  return `${users.length} users are viewing${roleStr}:
${users.map(describeUser).join(`
`)}`;
}
function describeUser(user) {
  const parts = [user.name || user.userId];
  if (user.role)
    parts.push(`(${user.role})`);
  if (user.status)
    parts.push(`[${user.status}]`);
  return `- ${parts.join(" ")}`;
}
function ESICollaborative({
  children,
  prompt,
  schema,
  render,
  fallback,
  loading = "...",
  describeUsers = defaultDescribeUsers,
  reactToPresenceChange = true,
  presenceDebounce = 2000,
  temperature,
  maxTokens,
  cacheTtl,
  onSuccess,
  className
}) {
  const presence = usePresenceForESI();
  const [debouncedUsers, setDebouncedUsers] = import_react2.useState(presence.users);
  const [result, setResult] = import_react2.useState(null);
  import_react2.useEffect(() => {
    if (!reactToPresenceChange)
      return;
    const timer = setTimeout(() => {
      setDebouncedUsers(presence.users);
    }, presenceDebounce);
    return () => clearTimeout(timer);
  }, [presence.users, reactToPresenceChange, presenceDebounce]);
  const basePrompt = prompt || (typeof children === "string" ? children : String(children || ""));
  const presenceDescription = describeUsers(debouncedUsers);
  const collaborativePrompt = `[Audience Context]
${presenceDescription}

[Task]
${basePrompt}

Consider ALL viewers when generating your response. The content should be relevant and appropriate for everyone currently viewing.`;
  const handleSuccess = import_react2.useCallback((data) => {
    setResult(data);
    onSuccess?.(data, debouncedUsers);
  }, [debouncedUsers, onSuccess]);
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ESIStructured, {
    prompt: collaborativePrompt,
    schema,
    temperature,
    maxTokens,
    cacheTtl,
    loading,
    fallback,
    onSuccess: handleSuccess,
    className,
    render: (data, meta) => {
      if (render) {
        return render(data, debouncedUsers);
      }
      return JSON.stringify(data);
    }
  }, undefined, false, undefined, this);
}
function ESIReflect({
  children,
  prompt,
  schema,
  until,
  maxIterations = 3,
  render,
  showProgress = false,
  fallback,
  loading = "...",
  onIteration,
  onComplete,
  className
}) {
  const { process: process2, enabled } = useESI();
  const [currentResult, setCurrentResult] = import_react2.useState(null);
  const [iteration, setIteration] = import_react2.useState(0);
  const [isComplete, setIsComplete] = import_react2.useState(false);
  const [isLoading, setIsLoading] = import_react2.useState(true);
  const basePrompt = prompt || (typeof children === "string" ? children : String(children || ""));
  import_react2.useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    async function runReflection() {
      setIsLoading(true);
      let currentIteration = 0;
      let lastResult = null;
      let previousAttempts = [];
      while (currentIteration < maxIterations) {
        let reflectionPrompt = basePrompt;
        if (currentIteration > 0 && lastResult) {
          reflectionPrompt = `[Previous Attempt ${currentIteration}]
${JSON.stringify(lastResult)}

[Reflection]
The previous attempt did not meet the quality threshold. Please improve upon it.

[Original Task]
${basePrompt}`;
        }
        const fullPrompt = reflectionPrompt + generateSchemaPrompt(schema);
        const directive = {
          id: `esi-reflect-${Date.now()}-${currentIteration}`,
          params: { model: "llm" },
          content: { type: "text", value: fullPrompt }
        };
        const result = await process2(directive);
        if (!result.success || !result.output) {
          break;
        }
        const parseResult = parseWithSchema(result.output, schema);
        if (!parseResult.success) {
          currentIteration++;
          continue;
        }
        lastResult = parseResult.data;
        setCurrentResult(parseResult.data);
        setIteration(currentIteration + 1);
        onIteration?.(parseResult.data, currentIteration + 1);
        if (until(parseResult.data, currentIteration + 1)) {
          setIsComplete(true);
          onComplete?.(parseResult.data, currentIteration + 1);
          break;
        }
        previousAttempts.push(result.output);
        currentIteration++;
      }
      if (!isComplete && lastResult) {
        setIsComplete(true);
        onComplete?.(lastResult, currentIteration);
      }
      setIsLoading(false);
    }
    runReflection();
  }, [basePrompt, enabled, maxIterations]);
  if (isLoading) {
    if (showProgress && currentResult) {
      return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
        className,
        children: [
          render ? render(currentResult, iteration) : JSON.stringify(currentResult),
          /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
            children: [
              " (refining... iteration ",
              iteration,
              ")"
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this);
    }
    return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
      className,
      children: loading
    }, undefined, false, undefined, this);
  }
  if (!currentResult) {
    return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
      className,
      children: fallback
    }, undefined, false, undefined, this);
  }
  if (render) {
    return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
      className,
      children: render(currentResult, iteration)
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
    className,
    children: JSON.stringify(currentResult)
  }, undefined, false, undefined, this);
}
function ESIOptimize({
  children,
  prompt,
  schema,
  criteria = ["clarity", "relevance", "completeness", "conciseness"],
  targetQuality = 0.85,
  maxRounds = 3,
  onlyWhenAlone = true,
  render,
  fallback,
  loading = "...",
  onImprove,
  onOptimized,
  className
}) {
  const { process: process2, enabled } = useESI();
  const presence = usePresenceForESI();
  const [result, setResult] = import_react2.useState(null);
  const [meta, setMeta] = import_react2.useState({
    rounds: 0,
    quality: 0,
    improvements: [],
    wasOptimized: false
  });
  const [isLoading, setIsLoading] = import_react2.useState(true);
  const basePrompt = prompt || (typeof children === "string" ? children : String(children || ""));
  const shouldOptimize = !onlyWhenAlone || presence.users.length <= 1;
  import_react2.useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    async function runOptimization() {
      setIsLoading(true);
      const criteriaList = criteria.join(", ");
      const firstPassPrompt = `${basePrompt}

After generating your response, assess its quality on these criteria: ${criteriaList}

${generateSchemaPrompt(schema)}

Additionally, include a self-assessment in this format:
{
  "result": <your response matching the schema above>,
  "selfAssessment": {
    "quality": <0-1 score>,
    "strengths": [<list of strengths>],
    "weaknesses": [<list of weaknesses>],
    "improvementSuggestions": [<specific improvements>]
  }
}`;
      let currentResult = null;
      let currentQuality = 0;
      let round = 0;
      let improvements = [];
      let lastWeaknesses = [];
      const firstResult = await process2({
        id: `esi-optimize-${Date.now()}-0`,
        params: { model: "llm" },
        content: { type: "text", value: firstPassPrompt }
      });
      if (!firstResult.success || !firstResult.output) {
        setIsLoading(false);
        return;
      }
      try {
        const parsed = JSON.parse(extractJson(firstResult.output));
        const validated = schema.safeParse(parsed.result);
        if (validated.success) {
          currentResult = validated.data;
          currentQuality = parsed.selfAssessment?.quality || 0.5;
          lastWeaknesses = parsed.selfAssessment?.weaknesses || [];
          round = 1;
          setResult(currentResult);
          setMeta({
            rounds: 1,
            quality: currentQuality,
            improvements: [],
            wasOptimized: false
          });
          onImprove?.(currentResult, 1, currentQuality);
        }
      } catch {
        const parseResult = parseWithSchema(firstResult.output, schema);
        if (parseResult.success) {
          currentResult = parseResult.data;
          currentQuality = 0.6;
          round = 1;
          setResult(currentResult);
        } else {
          setIsLoading(false);
          return;
        }
      }
      if (shouldOptimize && currentQuality < targetQuality) {
        while (round < maxRounds && currentQuality < targetQuality) {
          const optimizePrompt = `You previously generated this response:
${JSON.stringify(currentResult)}

Quality score: ${currentQuality.toFixed(2)}
Weaknesses identified: ${lastWeaknesses.join(", ") || "none specified"}

Please improve the response, focusing on: ${criteriaList}
Address the weaknesses and aim for a quality score above ${targetQuality}.

${generateSchemaPrompt(schema)}

Include your improved self-assessment:
{
  "result": <improved response>,
  "selfAssessment": {
    "quality": <0-1 score>,
    "strengths": [...],
    "weaknesses": [...],
    "improvementSuggestions": [...]
  },
  "improvementsMade": [<what you improved>]
}`;
          const improvedResult = await process2({
            id: `esi-optimize-${Date.now()}-${round}`,
            params: { model: "llm" },
            content: { type: "text", value: optimizePrompt }
          });
          if (!improvedResult.success || !improvedResult.output) {
            break;
          }
          try {
            const parsed = JSON.parse(extractJson(improvedResult.output));
            const validated = schema.safeParse(parsed.result);
            if (validated.success) {
              const newQuality = parsed.selfAssessment?.quality || currentQuality;
              if (newQuality > currentQuality) {
                currentResult = validated.data;
                currentQuality = newQuality;
                lastWeaknesses = parsed.selfAssessment?.weaknesses || [];
                if (parsed.improvementsMade) {
                  improvements.push(...parsed.improvementsMade);
                }
                setResult(currentResult);
                setMeta({
                  rounds: round + 1,
                  quality: currentQuality,
                  improvements,
                  wasOptimized: true
                });
                onImprove?.(currentResult, round + 1, currentQuality);
              }
            }
          } catch {}
          round++;
        }
      }
      if (currentResult) {
        setMeta((prev) => ({
          ...prev,
          rounds: round,
          quality: currentQuality,
          wasOptimized: round > 1
        }));
        onOptimized?.(currentResult, round, currentQuality);
      }
      setIsLoading(false);
    }
    runOptimization();
  }, [basePrompt, enabled, shouldOptimize, targetQuality, maxRounds]);
  if (isLoading) {
    return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
      className,
      children: loading
    }, undefined, false, undefined, this);
  }
  if (!result) {
    return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
      className,
      children: fallback
    }, undefined, false, undefined, this);
  }
  if (render) {
    return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
      className,
      children: render(result, meta)
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
    className,
    children: JSON.stringify(result)
  }, undefined, false, undefined, this);
}
function extractJson(str) {
  let cleaned = str.trim();
  if (cleaned.startsWith("```")) {
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match)
      cleaned = match[1].trim();
  }
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch)
    return jsonMatch[0];
  return cleaned;
}
function ESIAuto({
  children,
  prompt,
  schema,
  render,
  collaborativeThreshold = 2,
  optimizeSettings,
  fallback,
  loading,
  className
}) {
  const presence = usePresenceForESI();
  const userCount = presence.users.length;
  const mode = userCount >= collaborativeThreshold ? "collaborative" : userCount === 1 ? "optimized" : "basic";
  if (mode === "collaborative") {
    return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ESICollaborative, {
      prompt,
      schema,
      fallback,
      loading,
      className,
      render: render ? (data) => render(data, "collaborative") : undefined,
      children
    }, undefined, false, undefined, this);
  }
  if (mode === "optimized") {
    return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ESIOptimize, {
      prompt,
      schema,
      criteria: optimizeSettings?.criteria,
      targetQuality: optimizeSettings?.targetQuality,
      maxRounds: optimizeSettings?.maxRounds,
      fallback,
      loading,
      className,
      render: render ? (data) => render(data, "optimized") : undefined,
      children
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ESIStructured, {
    prompt,
    schema,
    fallback,
    loading,
    className,
    render: render ? (data) => render(data, "basic") : undefined,
    children
  }, undefined, false, undefined, this);
}
function ESIShow({
  condition,
  children,
  fallback = null,
  loading = null,
  cacheTtl,
  onEvaluate,
  className
}) {
  const [show, setShow] = import_react2.useState(null);
  const boolSchema = {
    safeParse: (val) => {
      if (typeof val === "boolean")
        return { success: true, data: val };
      if (typeof val === "string") {
        const lower = val.toLowerCase().trim();
        if (lower === "true" || lower === "yes" || lower === "1")
          return { success: true, data: true };
        if (lower === "false" || lower === "no" || lower === "0")
          return { success: true, data: false };
      }
      if (typeof val === "object" && val !== null && "result" in val) {
        return { success: true, data: Boolean(val.result) };
      }
      return { success: false, error: "Not a boolean" };
    }
  };
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
    className,
    children: [
      /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ESIStructured, {
        prompt: `Evaluate this condition and respond with only "true" or "false": ${condition}`,
        schema: boolSchema,
        cacheTtl,
        loading,
        onSuccess: (result) => {
          setShow(result);
          onEvaluate?.(result);
        },
        render: () => null
      }, undefined, false, undefined, this),
      show === true && children,
      show === false && fallback
    ]
  }, undefined, true, undefined, this);
}
function ESIHide({
  condition,
  children,
  loading = null,
  cacheTtl,
  className
}) {
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ESIShow, {
    condition,
    fallback: children,
    loading,
    cacheTtl,
    className,
    children: null
  }, undefined, false, undefined, this);
}
function ESIWhen({ condition, children, loading, cacheTtl, className }) {
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ESIShow, {
    condition,
    loading,
    cacheTtl,
    className,
    children
  }, undefined, false, undefined, this);
}
function ESIUnless({ condition, children, loading, cacheTtl, className }) {
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ESIHide, {
    condition,
    loading,
    cacheTtl,
    className,
    children
  }, undefined, false, undefined, this);
}
var TIER_LEVELS = { free: 0, starter: 1, pro: 2, enterprise: 3 };
function ESITierGate({ minTier, children, fallback = null, className }) {
  const [hasAccess, setHasAccess] = import_react2.useState(null);
  import_react2.useEffect(() => {
    const state = typeof window !== "undefined" && window.__AEON_ESI_STATE__ || {};
    const userTier = state.userTier || "free";
    const userLevel = TIER_LEVELS[userTier] ?? 0;
    const requiredLevel = TIER_LEVELS[minTier] ?? 0;
    setHasAccess(userLevel >= requiredLevel);
  }, [minTier]);
  if (hasAccess === null)
    return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
      className
    }, undefined, false, undefined, this);
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
    className,
    children: hasAccess ? children : fallback
  }, undefined, false, undefined, this);
}
function ESIEmotionGate({
  allow,
  block,
  valenceRange,
  arousalRange,
  children,
  fallback = null,
  className
}) {
  const [hasAccess, setHasAccess] = import_react2.useState(null);
  import_react2.useEffect(() => {
    const state = typeof window !== "undefined" && window.__AEON_ESI_STATE__ || {};
    const emotion = state.emotionState || {};
    let access = true;
    if (allow && allow.length > 0 && emotion.primary) {
      access = access && allow.includes(emotion.primary);
    }
    if (block && block.length > 0 && emotion.primary) {
      access = access && !block.includes(emotion.primary);
    }
    if (valenceRange && emotion.valence !== undefined) {
      access = access && emotion.valence >= valenceRange[0] && emotion.valence <= valenceRange[1];
    }
    if (arousalRange && emotion.arousal !== undefined) {
      access = access && emotion.arousal >= arousalRange[0] && emotion.arousal <= arousalRange[1];
    }
    setHasAccess(access);
  }, [allow, block, valenceRange, arousalRange]);
  if (hasAccess === null)
    return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
      className
    }, undefined, false, undefined, this);
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
    className,
    children: hasAccess ? children : fallback
  }, undefined, false, undefined, this);
}
function ESITimeGate({
  after,
  before,
  days,
  children,
  fallback = null,
  className
}) {
  const [inRange, setInRange] = import_react2.useState(null);
  import_react2.useEffect(() => {
    const now = new Date;
    const hour = now.getHours();
    const day = now.getDay();
    let access = true;
    if (after !== undefined)
      access = access && hour >= after;
    if (before !== undefined)
      access = access && hour < before;
    if (days && days.length > 0)
      access = access && days.includes(day);
    setInRange(access);
  }, [after, before, days]);
  if (inRange === null)
    return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
      className
    }, undefined, false, undefined, this);
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
    className,
    children: inRange ? children : fallback
  }, undefined, false, undefined, this);
}
function ESIABTest({
  name,
  variants,
  selectionPrompt,
  random = false,
  onSelect,
  loading = null,
  className
}) {
  const [selectedVariant, setSelectedVariant] = import_react2.useState(null);
  const variantKeys = Object.keys(variants);
  import_react2.useEffect(() => {
    if (random || !selectionPrompt) {
      const selected = variantKeys[Math.floor(Math.random() * variantKeys.length)];
      setSelectedVariant(selected);
      onSelect?.(selected);
    }
  }, [random, selectionPrompt]);
  if (random || !selectionPrompt) {
    if (!selectedVariant)
      return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
        className,
        children: loading
      }, undefined, false, undefined, this);
    return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
      className,
      children: variants[selectedVariant]
    }, undefined, false, undefined, this);
  }
  const variantSchema = {
    safeParse: (val) => {
      const str = String(val).trim();
      if (variantKeys.includes(str))
        return { success: true, data: str };
      for (const key of variantKeys) {
        if (str.toLowerCase().includes(key.toLowerCase())) {
          return { success: true, data: key };
        }
      }
      return { success: false, error: "Invalid variant" };
    }
  };
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
    className,
    children: [
      /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ESIStructured, {
        prompt: `${selectionPrompt}

Available variants: ${variantKeys.join(", ")}

Respond with only the variant name.`,
        schema: variantSchema,
        loading,
        onSuccess: (selected) => {
          setSelectedVariant(selected);
          onSelect?.(selected);
        },
        render: () => null
      }, undefined, false, undefined, this),
      selectedVariant && variants[selectedVariant]
    ]
  }, undefined, true, undefined, this);
}
function ESIForEach({
  prompt,
  itemSchema,
  render,
  maxItems = 10,
  empty = null,
  loading = "...",
  as: Wrapper = "div",
  className
}) {
  const [items, setItems] = import_react2.useState([]);
  const [isLoading, setIsLoading] = import_react2.useState(true);
  const arraySchema = {
    safeParse: (val) => {
      try {
        let arr;
        if (Array.isArray(val)) {
          arr = val;
        } else if (typeof val === "string") {
          arr = JSON.parse(val);
        } else if (typeof val === "object" && val !== null && "items" in val) {
          arr = val.items;
        } else {
          return { success: false, error: "Not an array" };
        }
        const validItems = [];
        for (const item of arr.slice(0, maxItems)) {
          const result = itemSchema.safeParse(item);
          if (result.success) {
            validItems.push(result.data);
          }
        }
        return { success: true, data: validItems };
      } catch {
        return { success: false, error: "Parse error" };
      }
    }
  };
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ESIStructured, {
    prompt: `${prompt}

Respond with a JSON array of items (max ${maxItems}).`,
    schema: arraySchema,
    loading,
    fallback: empty,
    className,
    onSuccess: (result) => {
      setItems(result);
      setIsLoading(false);
    },
    render: (data) => {
      if (data.length === 0)
        return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(jsx_dev_runtime2.Fragment, {
          children: empty
        }, undefined, false, undefined, this);
      return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(Wrapper, {
        className,
        children: data.map((item, i) => render(item, i))
      }, undefined, false, undefined, this);
    }
  }, undefined, false, undefined, this);
}
function ESIFirst({
  context,
  children,
  fallback = null,
  loading = null,
  className
}) {
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("span", {
    className,
    children
  }, undefined, false, undefined, this);
}
function ESIClamp({
  prompt,
  min,
  max,
  render,
  defaultValue,
  loading = "...",
  className
}) {
  const numSchema = {
    safeParse: (val) => {
      let num;
      if (typeof val === "number") {
        num = val;
      } else if (typeof val === "string") {
        num = parseFloat(val);
      } else if (typeof val === "object" && val !== null && "value" in val) {
        num = Number(val.value);
      } else {
        return { success: false, error: "Not a number" };
      }
      if (isNaN(num))
        return { success: false, error: "NaN" };
      return { success: true, data: Math.max(min, Math.min(max, num)) };
    }
  };
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ESIStructured, {
    prompt: `${prompt}

Respond with a number between ${min} and ${max}.`,
    schema: numSchema,
    loading,
    fallback: defaultValue !== undefined ? render(defaultValue) : null,
    className,
    render: (value) => render(value)
  }, undefined, false, undefined, this);
}
function ESISelect({
  prompt,
  options,
  render,
  defaultOption,
  loading = "...",
  onSelect,
  className
}) {
  const optionSchema = {
    safeParse: (val) => {
      const str = String(val).trim().toLowerCase();
      const match = options.find((o) => o.toLowerCase() === str);
      if (match)
        return { success: true, data: match };
      const partial = options.find((o) => str.includes(o.toLowerCase()) || o.toLowerCase().includes(str));
      if (partial)
        return { success: true, data: partial };
      return { success: false, error: "No match" };
    }
  };
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ESIStructured, {
    prompt: `${prompt}

Options: ${options.join(", ")}

Respond with only one of the options.`,
    schema: optionSchema,
    loading,
    fallback: defaultOption ? render(defaultOption) : null,
    className,
    onSuccess: onSelect,
    render: (selected) => render(selected)
  }, undefined, false, undefined, this);
}
var DEFAULT_THRESHOLDS = [
  { value: 0.2, label: "very low" },
  { value: 0.4, label: "low" },
  { value: 0.6, label: "moderate" },
  { value: 0.8, label: "high" },
  { value: 1, label: "very high" }
];
function ESIScore({
  prompt,
  render,
  thresholds = DEFAULT_THRESHOLDS,
  loading = "...",
  className
}) {
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ESIClamp, {
    prompt,
    min: 0,
    max: 1,
    loading,
    className,
    render: (score) => {
      const label = thresholds.find((t) => score <= t.value)?.label || "unknown";
      return render(score, label);
    }
  }, undefined, false, undefined, this);
}
var ESIControl = {
  Structured: ESIStructured,
  If: ESIIf,
  Show: ESIShow,
  Hide: ESIHide,
  When: ESIWhen,
  Unless: ESIUnless,
  Match: ESIMatch,
  Case: ESICase,
  Default: ESIDefault,
  First: ESIFirst,
  TierGate: ESITierGate,
  EmotionGate: ESIEmotionGate,
  TimeGate: ESITimeGate,
  ForEach: ESIForEach,
  Select: ESISelect,
  ABTest: ESIABTest,
  Clamp: ESIClamp,
  Score: ESIScore,
  Collaborative: ESICollaborative,
  Reflect: ESIReflect,
  Optimize: ESIOptimize,
  Auto: ESIAuto
};
export {
  useGlobalESIState,
  useESITier,
  useESIPreferences,
  useESIInfer,
  useESIFeature,
  useESIEmotionState,
  useESI,
  updateGlobalESIState,
  supportsSpeculationRules,
  supportsLinkPrefetch,
  setContextCookies,
  serializeToESIState,
  parseWithSchema,
  getToolSuggestions,
  generateSchemaPrompt,
  generateESIStateScriptFromContext,
  generateESIStateScript,
  extractUserContext,
  evaluateTrigger,
  esiWithContext,
  esiVision,
  esiMatch,
  esiInfer,
  esiIf,
  esiHalo,
  esiEmotion,
  esiEmbed,
  esiCyrano,
  esiContext,
  createSpeculationHook,
  createExhaustEntry,
  createControlProcessor,
  createContextMiddleware,
  autoInitSpeculation,
  addSpeculationHeaders,
  SpeculationManager,
  HeuristicAdapter,
  EdgeWorkersESIProcessor,
  ESIWhen,
  ESIVision,
  ESIUnless,
  ESITimeGate,
  ESITierGate,
  ESIStructured,
  ESIShow,
  ESISelect,
  ESIScore,
  ESIReflect,
  ESIProvider,
  ESIOptimize,
  ESIMatch,
  ESIInfer,
  ESIIf,
  ESIHide,
  ESIForEach,
  ESIFirst,
  ESIEmotionGate,
  ESIEmotion,
  ESIEmbed,
  ESIDefault,
  ESIControl,
  ESICollaborative,
  ESIClamp,
  ESICase,
  ESIAuto,
  ESIABTest,
  ESI,
  DEFAULT_ROUTER_CONFIG,
  DEFAULT_ESI_CONFIG,
  CYRANO_TOOL_SUGGESTIONS
};
