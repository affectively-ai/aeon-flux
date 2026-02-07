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

// ../../../../node_modules/react/cjs/react.development.js
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

// ../../../../node_modules/react/index.js
var require_react = __commonJS((exports, module) => {
  var react_development = __toESM(require_react_development());
  if (false) {} else {
    module.exports = react_development;
  }
});

// ../../../../node_modules/react/cjs/react-jsx-dev-runtime.development.js
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

// ../../../../node_modules/react/jsx-dev-runtime.js
var require_jsx_dev_runtime = __commonJS((exports, module) => {
  var react_jsx_dev_runtime_development = __toESM(require_react_jsx_dev_runtime_development());
  if (false) {} else {
    module.exports = react_jsx_dev_runtime_development;
  }
});

// ../../../../node_modules/@affectively/aeon/node_modules/eventemitter3/index.js
var require_eventemitter3 = __commonJS((exports, module) => {
  var has = Object.prototype.hasOwnProperty;
  var prefix = "~";
  function Events() {}
  if (Object.create) {
    Events.prototype = Object.create(null);
    if (!new Events().__proto__)
      prefix = false;
  }
  function EE(fn, context, once) {
    this.fn = fn;
    this.context = context;
    this.once = once || false;
  }
  function addListener(emitter, event, fn, context, once) {
    if (typeof fn !== "function") {
      throw new TypeError("The listener must be a function");
    }
    var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
    if (!emitter._events[evt])
      emitter._events[evt] = listener, emitter._eventsCount++;
    else if (!emitter._events[evt].fn)
      emitter._events[evt].push(listener);
    else
      emitter._events[evt] = [emitter._events[evt], listener];
    return emitter;
  }
  function clearEvent(emitter, evt) {
    if (--emitter._eventsCount === 0)
      emitter._events = new Events;
    else
      delete emitter._events[evt];
  }
  function EventEmitter() {
    this._events = new Events;
    this._eventsCount = 0;
  }
  EventEmitter.prototype.eventNames = function eventNames() {
    var names = [], events, name;
    if (this._eventsCount === 0)
      return names;
    for (name in events = this._events) {
      if (has.call(events, name))
        names.push(prefix ? name.slice(1) : name);
    }
    if (Object.getOwnPropertySymbols) {
      return names.concat(Object.getOwnPropertySymbols(events));
    }
    return names;
  };
  EventEmitter.prototype.listeners = function listeners(event) {
    var evt = prefix ? prefix + event : event, handlers = this._events[evt];
    if (!handlers)
      return [];
    if (handlers.fn)
      return [handlers.fn];
    for (var i = 0, l = handlers.length, ee = new Array(l);i < l; i++) {
      ee[i] = handlers[i].fn;
    }
    return ee;
  };
  EventEmitter.prototype.listenerCount = function listenerCount(event) {
    var evt = prefix ? prefix + event : event, listeners = this._events[evt];
    if (!listeners)
      return 0;
    if (listeners.fn)
      return 1;
    return listeners.length;
  };
  EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
    var evt = prefix ? prefix + event : event;
    if (!this._events[evt])
      return false;
    var listeners = this._events[evt], len = arguments.length, args, i;
    if (listeners.fn) {
      if (listeners.once)
        this.removeListener(event, listeners.fn, undefined, true);
      switch (len) {
        case 1:
          return listeners.fn.call(listeners.context), true;
        case 2:
          return listeners.fn.call(listeners.context, a1), true;
        case 3:
          return listeners.fn.call(listeners.context, a1, a2), true;
        case 4:
          return listeners.fn.call(listeners.context, a1, a2, a3), true;
        case 5:
          return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
        case 6:
          return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
      }
      for (i = 1, args = new Array(len - 1);i < len; i++) {
        args[i - 1] = arguments[i];
      }
      listeners.fn.apply(listeners.context, args);
    } else {
      var length = listeners.length, j;
      for (i = 0;i < length; i++) {
        if (listeners[i].once)
          this.removeListener(event, listeners[i].fn, undefined, true);
        switch (len) {
          case 1:
            listeners[i].fn.call(listeners[i].context);
            break;
          case 2:
            listeners[i].fn.call(listeners[i].context, a1);
            break;
          case 3:
            listeners[i].fn.call(listeners[i].context, a1, a2);
            break;
          case 4:
            listeners[i].fn.call(listeners[i].context, a1, a2, a3);
            break;
          default:
            if (!args)
              for (j = 1, args = new Array(len - 1);j < len; j++) {
                args[j - 1] = arguments[j];
              }
            listeners[i].fn.apply(listeners[i].context, args);
        }
      }
    }
    return true;
  };
  EventEmitter.prototype.on = function on(event, fn, context) {
    return addListener(this, event, fn, context, false);
  };
  EventEmitter.prototype.once = function once(event, fn, context) {
    return addListener(this, event, fn, context, true);
  };
  EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
    var evt = prefix ? prefix + event : event;
    if (!this._events[evt])
      return this;
    if (!fn) {
      clearEvent(this, evt);
      return this;
    }
    var listeners = this._events[evt];
    if (listeners.fn) {
      if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
        clearEvent(this, evt);
      }
    } else {
      for (var i = 0, events = [], length = listeners.length;i < length; i++) {
        if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) {
          events.push(listeners[i]);
        }
      }
      if (events.length)
        this._events[evt] = events.length === 1 ? events[0] : events;
      else
        clearEvent(this, evt);
    }
    return this;
  };
  EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
    var evt;
    if (event) {
      evt = prefix ? prefix + event : event;
      if (this._events[evt])
        clearEvent(this, evt);
    } else {
      this._events = new Events;
      this._eventsCount = 0;
    }
    return this;
  };
  EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
  EventEmitter.prototype.addListener = EventEmitter.prototype.on;
  EventEmitter.prefixed = prefix;
  EventEmitter.EventEmitter = EventEmitter;
  if (typeof module !== "undefined") {
    module.exports = EventEmitter;
  }
});

// ../../../../node_modules/@affectively/aeon/node_modules/eventemitter3/index.mjs
var import__;
var init_eventemitter3 = __esm(() => {
  import__ = __toESM(require_eventemitter3(), 1);
});

// ../../../../node_modules/@affectively/aeon/dist/index.js
var exports_dist = {};
__export(exports_dist, {
  setLogger: () => setLogger,
  resetPrefetchingEngine: () => resetPrefetchingEngine,
  resetOfflineOperationQueue: () => resetOfflineOperationQueue,
  resetLogger: () => resetLogger,
  resetDeltaSyncOptimizer: () => resetDeltaSyncOptimizer,
  resetCompressionEngine: () => resetCompressionEngine,
  resetBatchTimingOptimizer: () => resetBatchTimingOptimizer,
  resetAdaptiveCompressionOptimizer: () => resetAdaptiveCompressionOptimizer,
  logger: () => logger,
  getPrefetchingEngine: () => getPrefetchingEngine,
  getOfflineOperationQueue: () => getOfflineOperationQueue,
  getLogger: () => getLogger,
  getDeltaSyncOptimizer: () => getDeltaSyncOptimizer,
  getCompressionEngine: () => getCompressionEngine,
  getBatchTimingOptimizer: () => getBatchTimingOptimizer,
  getAgentPresenceManager: () => getAgentPresenceManager,
  getAdaptiveCompressionOptimizer: () => getAdaptiveCompressionOptimizer,
  disableLogging: () => disableLogging,
  createNamespacedLogger: () => createNamespacedLogger,
  clearAgentPresenceManager: () => clearAgentPresenceManager,
  SyncProtocol: () => SyncProtocol,
  SyncCoordinator: () => SyncCoordinator,
  StateReconciler: () => StateReconciler,
  SchemaVersionManager: () => SchemaVersionManager,
  ReplicationManager: () => ReplicationManager,
  PrefetchingEngine: () => PrefetchingEngine,
  OfflineOperationQueue: () => OfflineOperationQueue,
  NullCryptoProvider: () => NullCryptoProvider,
  MigrationTracker: () => MigrationTracker,
  MigrationEngine: () => MigrationEngine,
  DeltaSyncOptimizer: () => DeltaSyncOptimizer,
  DataTransformer: () => DataTransformer,
  DEFAULT_CRYPTO_CONFIG: () => DEFAULT_CRYPTO_CONFIG,
  CompressionEngine: () => CompressionEngine,
  BatchTimingOptimizer: () => BatchTimingOptimizer,
  AgentPresenceManager: () => AgentPresenceManager,
  AdaptiveCompressionOptimizer: () => AdaptiveCompressionOptimizer,
  AEON_CAPABILITIES: () => AEON_CAPABILITIES
});
function getLogger() {
  return currentLogger;
}
function setLogger(logger9) {
  currentLogger = logger9;
}
function resetLogger() {
  currentLogger = consoleLogger;
}
function disableLogging() {
  currentLogger = noopLogger;
}
function createNamespacedLogger(namespace) {
  const logger9 = getLogger();
  return {
    debug: (...args) => logger9.debug(`[${namespace}]`, ...args),
    info: (...args) => logger9.info(`[${namespace}]`, ...args),
    warn: (...args) => logger9.warn(`[${namespace}]`, ...args),
    error: (...args) => logger9.error(`[${namespace}]`, ...args)
  };
}
function getOfflineOperationQueue() {
  if (!offlineQueueInstance) {
    offlineQueueInstance = new OfflineOperationQueue;
  }
  return offlineQueueInstance;
}
function resetOfflineOperationQueue() {
  offlineQueueInstance = null;
}
function getCompressionEngine() {
  if (!compressionEngineInstance) {
    compressionEngineInstance = new CompressionEngine;
  }
  return compressionEngineInstance;
}
function resetCompressionEngine() {
  compressionEngineInstance = null;
}
function getDeltaSyncOptimizer(threshold) {
  if (!deltaSyncInstance) {
    deltaSyncInstance = new DeltaSyncOptimizer(threshold);
  }
  return deltaSyncInstance;
}
function resetDeltaSyncOptimizer() {
  deltaSyncInstance = null;
}
function getPrefetchingEngine() {
  if (!prefetchingEngineInstance) {
    prefetchingEngineInstance = new PrefetchingEngine;
  }
  return prefetchingEngineInstance;
}
function resetPrefetchingEngine() {
  prefetchingEngineInstance = null;
}
function getBatchTimingOptimizer() {
  if (!batchTimingOptimizerInstance) {
    batchTimingOptimizerInstance = new BatchTimingOptimizer;
  }
  return batchTimingOptimizerInstance;
}
function resetBatchTimingOptimizer() {
  batchTimingOptimizerInstance = null;
}
function getAdaptiveCompressionOptimizer() {
  if (!adaptiveOptimizerInstance) {
    adaptiveOptimizerInstance = new AdaptiveCompressionOptimizer;
  }
  return adaptiveOptimizerInstance;
}
function resetAdaptiveCompressionOptimizer() {
  adaptiveOptimizerInstance = null;
}
function getAgentPresenceManager(sessionId) {
  if (!instances.has(sessionId)) {
    instances.set(sessionId, new AgentPresenceManager(sessionId));
  }
  return instances.get(sessionId);
}
function clearAgentPresenceManager(sessionId) {
  const instance = instances.get(sessionId);
  if (instance) {
    instance.destroy();
    instances.delete(sessionId);
  }
}
var consoleLogger, noopLogger, currentLogger, logger, SchemaVersionManager = class {
  versions = /* @__PURE__ */ new Map;
  versionHistory = [];
  compatibilityMatrix = /* @__PURE__ */ new Map;
  currentVersion = null;
  constructor() {
    this.initializeDefaultVersions();
  }
  initializeDefaultVersions() {
    const v1_0_0 = {
      major: 1,
      minor: 0,
      patch: 0,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      description: "Initial schema version",
      breaking: false
    };
    this.registerVersion(v1_0_0);
    this.currentVersion = v1_0_0;
  }
  registerVersion(version) {
    const versionString = this.versionToString(version);
    this.versions.set(versionString, version);
    this.versionHistory.push(version);
    logger.debug("[SchemaVersionManager] Version registered", {
      version: versionString,
      breaking: version.breaking,
      description: version.description
    });
  }
  getCurrentVersion() {
    if (!this.currentVersion) {
      throw new Error("No current version set");
    }
    return this.currentVersion;
  }
  setCurrentVersion(version) {
    if (!this.versions.has(this.versionToString(version))) {
      throw new Error(`Version ${this.versionToString(version)} not registered`);
    }
    this.currentVersion = version;
    logger.debug("[SchemaVersionManager] Current version set", {
      version: this.versionToString(version)
    });
  }
  getVersionHistory() {
    return [...this.versionHistory];
  }
  hasVersion(version) {
    return this.versions.has(this.versionToString(version));
  }
  getVersion(versionString) {
    return this.versions.get(versionString);
  }
  registerCompatibility(rule) {
    if (!this.compatibilityMatrix.has(rule.from)) {
      this.compatibilityMatrix.set(rule.from, []);
    }
    const rules = this.compatibilityMatrix.get(rule.from);
    if (rules) {
      rules.push(rule);
    }
    logger.debug("[SchemaVersionManager] Compatibility rule registered", {
      from: rule.from,
      to: rule.to,
      compatible: rule.compatible,
      requiresMigration: rule.requiresMigration
    });
  }
  canMigrate(fromVersion, toVersion) {
    const fromStr = typeof fromVersion === "string" ? fromVersion : this.versionToString(fromVersion);
    const toStr = typeof toVersion === "string" ? toVersion : this.versionToString(toVersion);
    const rules = this.compatibilityMatrix.get(fromStr) || [];
    return rules.some((r) => r.to === toStr && r.requiresMigration);
  }
  getMigrationPath(fromVersion, toVersion) {
    const path = [];
    let current = fromVersion;
    const maxSteps = 100;
    let steps = 0;
    while (this.compareVersions(current, toVersion) !== 0 && steps < maxSteps) {
      const fromStr = this.versionToString(current);
      const rules = this.compatibilityMatrix.get(fromStr) || [];
      let found = false;
      for (const rule of rules) {
        const nextVersion = this.getVersion(rule.to);
        if (nextVersion) {
          if (this.compareVersions(nextVersion, toVersion) <= 0 || this.compareVersions(current, nextVersion) < this.compareVersions(current, toVersion)) {
            current = nextVersion;
            path.push(current);
            found = true;
            break;
          }
        }
      }
      if (!found) {
        break;
      }
      steps++;
    }
    return path;
  }
  compareVersions(v1, v2) {
    const ver1 = typeof v1 === "string" ? this.parseVersion(v1) : v1;
    const ver2 = typeof v2 === "string" ? this.parseVersion(v2) : v2;
    if (ver1.major !== ver2.major) {
      return ver1.major < ver2.major ? -1 : 1;
    }
    if (ver1.minor !== ver2.minor) {
      return ver1.minor < ver2.minor ? -1 : 1;
    }
    if (ver1.patch !== ver2.patch) {
      return ver1.patch < ver2.patch ? -1 : 1;
    }
    return 0;
  }
  parseVersion(versionString) {
    const parts = versionString.split(".").map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      description: "",
      breaking: false
    };
  }
  createVersion(major, minor, patch, description, breaking = false) {
    return {
      major,
      minor,
      patch,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      description,
      breaking
    };
  }
  versionToString(version) {
    return `${version.major}.${version.minor}.${version.patch}`;
  }
  getVersionMetadata(version) {
    const history = this.versionHistory;
    const currentIndex = history.findIndex((v) => this.versionToString(v) === this.versionToString(version));
    return {
      version,
      previousVersion: currentIndex > 0 ? history[currentIndex - 1] : undefined,
      changes: [version.description],
      migrationsRequired: this.canMigrate(this.currentVersion || version, version) ? [this.versionToString(version)] : [],
      rollbackPossible: currentIndex > 0
    };
  }
  getAllVersions() {
    return Array.from(this.versions.values()).sort((a, b) => this.compareVersions(a, b));
  }
  clear() {
    this.versions.clear();
    this.versionHistory = [];
    this.compatibilityMatrix.clear();
    this.currentVersion = null;
  }
}, MigrationEngine = class {
  migrations = /* @__PURE__ */ new Map;
  executedMigrations = [];
  state = {
    currentVersion: "1.0.0",
    appliedMigrations: [],
    failedMigrations: [],
    lastMigrationTime: (/* @__PURE__ */ new Date()).toISOString(),
    totalMigrationsRun: 0
  };
  registerMigration(migration) {
    this.migrations.set(migration.id, migration);
    logger.debug("[MigrationEngine] Migration registered", {
      id: migration.id,
      version: migration.version,
      name: migration.name
    });
  }
  async executeMigration(migrationId, data) {
    const migration = this.migrations.get(migrationId);
    if (!migration) {
      throw new Error(`Migration ${migrationId} not found`);
    }
    const startTime = Date.now();
    const result = {
      migrationId,
      success: false,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      duration: 0,
      itemsAffected: 0,
      errors: []
    };
    try {
      logger.debug("[MigrationEngine] Executing migration", {
        id: migrationId,
        version: migration.version
      });
      migration.up(data);
      result.success = true;
      result.itemsAffected = Array.isArray(data) ? data.length : 1;
      result.duration = Date.now() - startTime;
      this.state.appliedMigrations.push(migrationId);
      this.state.currentVersion = migration.version;
      this.state.totalMigrationsRun++;
      this.state.lastMigrationTime = result.timestamp;
      this.executedMigrations.push(result);
      logger.debug("[MigrationEngine] Migration executed successfully", {
        id: migrationId,
        duration: result.duration,
        itemsAffected: result.itemsAffected
      });
      return result;
    } catch (error) {
      result.errors = [error instanceof Error ? error.message : String(error)];
      this.state.failedMigrations.push(migrationId);
      this.executedMigrations.push(result);
      logger.error("[MigrationEngine] Migration failed", {
        id: migrationId,
        error: result.errors[0]
      });
      throw new Error(`Migration ${migrationId} failed: ${result.errors[0]}`);
    }
  }
  async rollbackMigration(migrationId, data) {
    const migration = this.migrations.get(migrationId);
    if (!migration) {
      throw new Error(`Migration ${migrationId} not found`);
    }
    if (!migration.down) {
      throw new Error(`Migration ${migrationId} does not support rollback`);
    }
    const startTime = Date.now();
    const result = {
      migrationId,
      success: false,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      duration: 0,
      itemsAffected: 0,
      errors: []
    };
    try {
      logger.debug("[MigrationEngine] Rolling back migration", {
        id: migrationId,
        version: migration.version
      });
      migration.down(data);
      result.success = true;
      result.itemsAffected = Array.isArray(data) ? data.length : 1;
      result.duration = Date.now() - startTime;
      this.state.appliedMigrations = this.state.appliedMigrations.filter((id) => id !== migrationId);
      this.executedMigrations.push(result);
      logger.debug("[MigrationEngine] Migration rolled back", {
        id: migrationId,
        duration: result.duration
      });
      return result;
    } catch (error) {
      result.errors = [error instanceof Error ? error.message : String(error)];
      this.executedMigrations.push(result);
      logger.error("[MigrationEngine] Rollback failed", {
        id: migrationId,
        error: result.errors[0]
      });
      throw new Error(`Rollback for ${migrationId} failed: ${result.errors[0]}`);
    }
  }
  getState() {
    return { ...this.state };
  }
  getExecutionHistory() {
    return [...this.executedMigrations];
  }
  getMigration(migrationId) {
    return this.migrations.get(migrationId);
  }
  getAllMigrations() {
    return Array.from(this.migrations.values());
  }
  getAppliedMigrations() {
    return [...this.state.appliedMigrations];
  }
  getFailedMigrations() {
    return [...this.state.failedMigrations];
  }
  getPendingMigrations() {
    return this.getAllMigrations().filter((m) => !this.state.appliedMigrations.includes(m.id));
  }
  getStatistics() {
    const successful = this.executedMigrations.filter((m) => m.success).length;
    const failed = this.executedMigrations.filter((m) => !m.success).length;
    const totalDuration = this.executedMigrations.reduce((sum, m) => sum + m.duration, 0);
    const totalAffected = this.executedMigrations.reduce((sum, m) => sum + m.itemsAffected, 0);
    return {
      totalExecuted: this.executedMigrations.length,
      successful,
      failed,
      successRate: this.executedMigrations.length > 0 ? successful / this.executedMigrations.length * 100 : 0,
      totalDurationMs: totalDuration,
      averageDurationMs: this.executedMigrations.length > 0 ? totalDuration / this.executedMigrations.length : 0,
      totalAffected
    };
  }
  clear() {
    this.migrations.clear();
    this.executedMigrations = [];
    this.state = {
      currentVersion: "1.0.0",
      appliedMigrations: [],
      failedMigrations: [],
      lastMigrationTime: (/* @__PURE__ */ new Date()).toISOString(),
      totalMigrationsRun: 0
    };
  }
}, DataTransformer = class {
  rules = /* @__PURE__ */ new Map;
  transformationHistory = [];
  registerRule(rule) {
    this.rules.set(rule.field, rule);
    logger.debug("[DataTransformer] Rule registered", {
      field: rule.field,
      required: rule.required,
      hasDefault: rule.defaultValue !== undefined
    });
  }
  transformField(field, value) {
    const rule = this.rules.get(field);
    if (!rule) {
      return value;
    }
    try {
      return rule.transformer(value);
    } catch (error) {
      if (rule.required) {
        throw new Error(`Failed to transform required field ${field}: ${error instanceof Error ? error.message : String(error)}`);
      }
      return rule.defaultValue !== undefined ? rule.defaultValue : value;
    }
  }
  transformObject(data) {
    const transformed = {};
    for (const [key, value] of Object.entries(data)) {
      try {
        transformed[key] = this.transformField(key, value);
      } catch (error) {
        logger.warn("[DataTransformer] Field transformation failed", {
          field: key,
          error: error instanceof Error ? error.message : String(error)
        });
        const rule = this.rules.get(key);
        if (!rule || !rule.required) {
          transformed[key] = value;
        }
      }
    }
    return transformed;
  }
  transformCollection(items) {
    const startTime = Date.now();
    const result = {
      success: true,
      itemsTransformed: 0,
      itemsFailed: 0,
      errors: [],
      warnings: [],
      duration: 0
    };
    for (let i = 0;i < items.length; i++) {
      const item = items[i];
      try {
        if (typeof item === "object" && item !== null && !Array.isArray(item)) {
          this.transformObject(item);
          result.itemsTransformed++;
        } else {
          result.warnings.push(`Item ${i} is not a transformable object`);
        }
      } catch (error) {
        result.errors.push({
          item,
          error: error instanceof Error ? error.message : String(error)
        });
        result.itemsFailed++;
      }
    }
    result.duration = Date.now() - startTime;
    result.success = result.itemsFailed === 0;
    this.transformationHistory.push(result);
    logger.debug("[DataTransformer] Collection transformed", {
      total: items.length,
      transformed: result.itemsTransformed,
      failed: result.itemsFailed,
      duration: result.duration
    });
    return result;
  }
  validateTransformation(original, transformed) {
    const issues = [];
    if (original.length !== transformed.length) {
      issues.push(`Item count mismatch: ${original.length} -> ${transformed.length}`);
    }
    for (let i = 0;i < Math.min(original.length, transformed.length); i++) {
      const orig = original[i];
      const trans = transformed[i];
      if (!this.validateItem(orig, trans)) {
        issues.push(`Item ${i} validation failed`);
      }
    }
    return {
      valid: issues.length === 0,
      issues
    };
  }
  validateItem(original, transformed) {
    if (original === null || original === undefined) {
      return true;
    }
    if (typeof original === "object" && typeof transformed !== "object") {
      return false;
    }
    return true;
  }
  getTransformationHistory() {
    return [...this.transformationHistory];
  }
  getStatistics() {
    const totalTransformed = this.transformationHistory.reduce((sum, r) => sum + r.itemsTransformed, 0);
    const totalFailed = this.transformationHistory.reduce((sum, r) => sum + r.itemsFailed, 0);
    const totalDuration = this.transformationHistory.reduce((sum, r) => sum + r.duration, 0);
    return {
      totalBatches: this.transformationHistory.length,
      totalTransformed,
      totalFailed,
      successRate: totalTransformed + totalFailed > 0 ? totalTransformed / (totalTransformed + totalFailed) * 100 : 0,
      totalDurationMs: totalDuration,
      averageBatchDurationMs: this.transformationHistory.length > 0 ? totalDuration / this.transformationHistory.length : 0
    };
  }
  getRules() {
    return Array.from(this.rules.values());
  }
  getRule(field) {
    return this.rules.get(field);
  }
  clearRules() {
    this.rules.clear();
  }
  clearHistory() {
    this.transformationHistory = [];
  }
  clear() {
    this.clearRules();
    this.clearHistory();
  }
}, MigrationTracker = class {
  migrations = [];
  snapshots = /* @__PURE__ */ new Map;
  recordMigration(record) {
    this.migrations.push({ ...record });
    logger.debug("[MigrationTracker] Migration recorded", {
      id: record.id,
      migrationId: record.migrationId,
      version: record.version,
      status: record.status
    });
  }
  trackMigration(migrationId, version, beforeHash, afterHash, itemCount, duration, itemsAffected, appliedBy = "system") {
    const record = {
      id: `${migrationId}-${Date.now()}`,
      migrationId,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version,
      direction: "up",
      status: "applied",
      duration,
      itemsAffected,
      dataSnapshot: {
        beforeHash,
        afterHash,
        itemCount
      },
      appliedBy
    };
    this.recordMigration(record);
    this.snapshots.set(record.id, {
      beforeHash,
      afterHash,
      itemCount
    });
  }
  getMigrations() {
    return this.migrations.map((m) => ({ ...m }));
  }
  getMigrationsForVersion(version) {
    return this.migrations.filter((m) => m.version === version);
  }
  getMigration(id) {
    return this.migrations.find((m) => m.id === id);
  }
  canRollback(fromVersion, toVersion) {
    const fromIndex = this.migrations.findIndex((m) => m.version === fromVersion);
    const toIndex = this.migrations.findIndex((m) => m.version === toVersion);
    if (fromIndex === -1 || toIndex === -1) {
      return false;
    }
    if (toIndex >= fromIndex) {
      return false;
    }
    for (let i = fromIndex;i > toIndex; i--) {
      if (!this.migrations[i]?.dataSnapshot) {
        return false;
      }
    }
    return true;
  }
  getRollbackPath(fromVersion, toVersion) {
    const canRollback = this.canRollback(fromVersion, toVersion);
    const path = [];
    const affectedVersions = [];
    let estimatedDuration = 0;
    if (canRollback) {
      const fromIndex = this.migrations.findIndex((m) => m.version === fromVersion);
      const toIndex = this.migrations.findIndex((m) => m.version === toVersion);
      for (let i = fromIndex;i > toIndex; i--) {
        const migration = this.migrations[i];
        if (migration) {
          path.push(migration.migrationId);
          affectedVersions.push(migration.version);
          estimatedDuration += migration.duration;
        }
      }
    }
    return {
      path,
      canRollback,
      affectedVersions,
      estimatedDuration
    };
  }
  getAppliedMigrations() {
    return this.migrations.filter((m) => m.status === "applied");
  }
  getFailedMigrations() {
    return this.migrations.filter((m) => m.status === "failed");
  }
  getPendingMigrations() {
    return this.migrations.filter((m) => m.status === "pending");
  }
  getLatestMigration() {
    return this.migrations[this.migrations.length - 1];
  }
  getTimeline() {
    return this.migrations.map((m) => ({
      timestamp: m.timestamp,
      version: m.version,
      status: m.status
    }));
  }
  getStatistics() {
    const applied = this.migrations.filter((m) => m.status === "applied").length;
    const failed = this.migrations.filter((m) => m.status === "failed").length;
    const pending = this.migrations.filter((m) => m.status === "pending").length;
    const rolledBack = this.migrations.filter((m) => m.status === "rolled-back").length;
    const totalDuration = this.migrations.reduce((sum, m) => sum + m.duration, 0);
    const totalAffected = this.migrations.reduce((sum, m) => sum + m.itemsAffected, 0);
    return {
      total: this.migrations.length,
      applied,
      failed,
      pending,
      rolledBack,
      successRate: this.migrations.length > 0 ? applied / this.migrations.length * 100 : 0,
      totalDurationMs: totalDuration,
      averageDurationMs: this.migrations.length > 0 ? totalDuration / this.migrations.length : 0,
      totalItemsAffected: totalAffected
    };
  }
  getAuditTrail(migrationId) {
    const filtered = migrationId ? this.migrations.filter((m) => m.migrationId === migrationId) : this.migrations;
    return filtered.map((m) => ({
      id: m.id,
      timestamp: m.timestamp,
      migrationId: m.migrationId,
      version: m.version,
      status: m.status,
      appliedBy: m.appliedBy,
      duration: m.duration,
      itemsAffected: m.itemsAffected,
      error: m.errorMessage
    }));
  }
  getSnapshot(recordId) {
    return this.snapshots.get(recordId);
  }
  updateMigrationStatus(recordId, status, error) {
    const migration = this.migrations.find((m) => m.id === recordId);
    if (migration) {
      migration.status = status;
      if (error) {
        migration.errorMessage = error;
      }
      logger.debug("[MigrationTracker] Migration status updated", {
        recordId,
        status,
        hasError: !!error
      });
    }
  }
  clear() {
    this.migrations = [];
    this.snapshots.clear();
  }
  getTotalMigrations() {
    return this.migrations.length;
  }
  getMigrationsByTimeRange(startTime, endTime) {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    return this.migrations.filter((m) => {
      const time = new Date(m.timestamp).getTime();
      return time >= start && time <= end;
    });
  }
}, SyncCoordinator, ReplicationManager = class {
  replicas = /* @__PURE__ */ new Map;
  policies = /* @__PURE__ */ new Map;
  replicationEvents = [];
  syncStatus = /* @__PURE__ */ new Map;
  cryptoProvider = null;
  replicasByDID = /* @__PURE__ */ new Map;
  configureCrypto(provider) {
    this.cryptoProvider = provider;
    logger.debug("[ReplicationManager] Crypto configured", {
      initialized: provider.isInitialized()
    });
  }
  isCryptoEnabled() {
    return this.cryptoProvider !== null && this.cryptoProvider.isInitialized();
  }
  async registerAuthenticatedReplica(replica, encrypted = false) {
    const authenticatedReplica = {
      ...replica,
      encrypted
    };
    this.replicas.set(replica.id, authenticatedReplica);
    this.replicasByDID.set(replica.did, replica.id);
    if (!this.syncStatus.has(replica.nodeId)) {
      this.syncStatus.set(replica.nodeId, { synced: 0, failed: 0 });
    }
    if (this.cryptoProvider && replica.publicSigningKey) {
      await this.cryptoProvider.registerRemoteNode({
        id: replica.nodeId,
        did: replica.did,
        publicSigningKey: replica.publicSigningKey,
        publicEncryptionKey: replica.publicEncryptionKey
      });
    }
    const event = {
      type: "replica-added",
      replicaId: replica.id,
      nodeId: replica.nodeId,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      details: { did: replica.did, encrypted, authenticated: true }
    };
    this.replicationEvents.push(event);
    logger.debug("[ReplicationManager] Authenticated replica registered", {
      replicaId: replica.id,
      did: replica.did,
      encrypted
    });
    return authenticatedReplica;
  }
  getReplicaByDID(did) {
    const replicaId = this.replicasByDID.get(did);
    if (!replicaId)
      return;
    return this.replicas.get(replicaId);
  }
  getEncryptedReplicas() {
    return Array.from(this.replicas.values()).filter((r) => r.encrypted);
  }
  async encryptForReplica(data, targetReplicaDID) {
    if (!this.cryptoProvider || !this.cryptoProvider.isInitialized()) {
      throw new Error("Crypto provider not initialized");
    }
    const dataBytes = new TextEncoder().encode(JSON.stringify(data));
    const encrypted = await this.cryptoProvider.encrypt(dataBytes, targetReplicaDID);
    const localDID = this.cryptoProvider.getLocalDID();
    return {
      ct: encrypted.ct,
      iv: encrypted.iv,
      tag: encrypted.tag,
      epk: encrypted.epk,
      senderDID: localDID || undefined,
      targetDID: targetReplicaDID,
      encryptedAt: encrypted.encryptedAt
    };
  }
  async decryptReplicationData(encrypted) {
    if (!this.cryptoProvider || !this.cryptoProvider.isInitialized()) {
      throw new Error("Crypto provider not initialized");
    }
    const decrypted = await this.cryptoProvider.decrypt({
      alg: "ECIES-P256",
      ct: encrypted.ct,
      iv: encrypted.iv,
      tag: encrypted.tag,
      epk: encrypted.epk
    }, encrypted.senderDID);
    return JSON.parse(new TextDecoder().decode(decrypted));
  }
  createEncryptedPolicy(name, replicationFactor, consistencyLevel, encryptionMode, options) {
    const policy = {
      id: `policy-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      replicationFactor,
      consistencyLevel,
      syncInterval: options?.syncInterval || 1000,
      maxReplicationLag: options?.maxReplicationLag || 1e4,
      encryptionMode,
      requiredCapabilities: options?.requiredCapabilities
    };
    this.policies.set(policy.id, policy);
    logger.debug("[ReplicationManager] Encrypted policy created", {
      policyId: policy.id,
      name,
      replicationFactor,
      encryptionMode
    });
    return policy;
  }
  async verifyReplicaCapabilities(replicaDID, token, policyId) {
    if (!this.cryptoProvider) {
      return { authorized: true };
    }
    const policy = policyId ? this.policies.get(policyId) : undefined;
    const result = await this.cryptoProvider.verifyUCAN(token, {
      requiredCapabilities: policy?.requiredCapabilities?.map((cap) => ({
        can: cap,
        with: "*"
      }))
    });
    if (!result.authorized) {
      logger.warn("[ReplicationManager] Replica capability verification failed", {
        replicaDID,
        error: result.error
      });
    }
    return result;
  }
  registerReplica(replica) {
    this.replicas.set(replica.id, replica);
    if (!this.syncStatus.has(replica.nodeId)) {
      this.syncStatus.set(replica.nodeId, { synced: 0, failed: 0 });
    }
    const event = {
      type: "replica-added",
      replicaId: replica.id,
      nodeId: replica.nodeId,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.replicationEvents.push(event);
    logger.debug("[ReplicationManager] Replica registered", {
      replicaId: replica.id,
      nodeId: replica.nodeId,
      status: replica.status
    });
  }
  removeReplica(replicaId) {
    const replica = this.replicas.get(replicaId);
    if (!replica) {
      throw new Error(`Replica ${replicaId} not found`);
    }
    this.replicas.delete(replicaId);
    const event = {
      type: "replica-removed",
      replicaId,
      nodeId: replica.nodeId,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.replicationEvents.push(event);
    logger.debug("[ReplicationManager] Replica removed", { replicaId });
  }
  createPolicy(name, replicationFactor, consistencyLevel, syncInterval = 1000, maxReplicationLag = 1e4) {
    const policy = {
      id: `policy-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      replicationFactor,
      consistencyLevel,
      syncInterval,
      maxReplicationLag
    };
    this.policies.set(policy.id, policy);
    logger.debug("[ReplicationManager] Policy created", {
      policyId: policy.id,
      name,
      replicationFactor,
      consistencyLevel
    });
    return policy;
  }
  updateReplicaStatus(replicaId, status, lagBytes = 0, lagMillis = 0) {
    const replica = this.replicas.get(replicaId);
    if (!replica) {
      throw new Error(`Replica ${replicaId} not found`);
    }
    replica.status = status;
    replica.lagBytes = lagBytes;
    replica.lagMillis = lagMillis;
    replica.lastSyncTime = (/* @__PURE__ */ new Date()).toISOString();
    const event = {
      type: status === "syncing" ? "replica-synced" : "sync-failed",
      replicaId,
      nodeId: replica.nodeId,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      details: { status, lagBytes, lagMillis }
    };
    this.replicationEvents.push(event);
    const syncStatus = this.syncStatus.get(replica.nodeId);
    if (syncStatus) {
      if (status === "syncing" || status === "secondary") {
        syncStatus.synced++;
      } else if (status === "failed") {
        syncStatus.failed++;
      }
    }
    logger.debug("[ReplicationManager] Replica status updated", {
      replicaId,
      status,
      lagBytes,
      lagMillis
    });
  }
  getReplicasForNode(nodeId) {
    return Array.from(this.replicas.values()).filter((r) => r.nodeId === nodeId);
  }
  getHealthyReplicas() {
    return Array.from(this.replicas.values()).filter((r) => r.status === "secondary" || r.status === "primary");
  }
  getSyncingReplicas() {
    return Array.from(this.replicas.values()).filter((r) => r.status === "syncing");
  }
  getFailedReplicas() {
    return Array.from(this.replicas.values()).filter((r) => r.status === "failed");
  }
  checkReplicationHealth(policyId) {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Policy ${policyId} not found`);
    }
    const healthy = this.getHealthyReplicas();
    const maxLag = Math.max(0, ...healthy.map((r) => r.lagMillis));
    return {
      healthy: healthy.length >= policy.replicationFactor && maxLag <= policy.maxReplicationLag,
      replicasInPolicy: policy.replicationFactor,
      healthyReplicas: healthy.length,
      replicationLag: maxLag
    };
  }
  getConsistencyLevel(policyId) {
    const policy = this.policies.get(policyId);
    if (!policy) {
      return "eventual";
    }
    return policy.consistencyLevel;
  }
  getReplica(replicaId) {
    return this.replicas.get(replicaId);
  }
  getAllReplicas() {
    return Array.from(this.replicas.values());
  }
  getPolicy(policyId) {
    return this.policies.get(policyId);
  }
  getAllPolicies() {
    return Array.from(this.policies.values());
  }
  getStatistics() {
    const healthy = this.getHealthyReplicas().length;
    const syncing = this.getSyncingReplicas().length;
    const failed = this.getFailedReplicas().length;
    const total = this.replicas.size;
    const replicationLags = Array.from(this.replicas.values()).map((r) => r.lagMillis);
    const avgLag = replicationLags.length > 0 ? replicationLags.reduce((a, b) => a + b) / replicationLags.length : 0;
    const maxLag = replicationLags.length > 0 ? Math.max(...replicationLags) : 0;
    return {
      totalReplicas: total,
      healthyReplicas: healthy,
      syncingReplicas: syncing,
      failedReplicas: failed,
      healthiness: total > 0 ? healthy / total * 100 : 0,
      averageReplicationLagMs: avgLag,
      maxReplicationLagMs: maxLag,
      totalPolicies: this.policies.size
    };
  }
  getReplicationEvents(limit) {
    const events = [...this.replicationEvents];
    if (limit) {
      return events.slice(-limit);
    }
    return events;
  }
  getSyncStatus(nodeId) {
    return this.syncStatus.get(nodeId) || { synced: 0, failed: 0 };
  }
  getReplicationLagDistribution() {
    const distribution = {
      "0-100ms": 0,
      "100-500ms": 0,
      "500-1000ms": 0,
      "1000+ms": 0
    };
    for (const replica of this.replicas.values()) {
      if (replica.lagMillis <= 100) {
        distribution["0-100ms"]++;
      } else if (replica.lagMillis <= 500) {
        distribution["100-500ms"]++;
      } else if (replica.lagMillis <= 1000) {
        distribution["500-1000ms"]++;
      } else {
        distribution["1000+ms"]++;
      }
    }
    return distribution;
  }
  canSatisfyConsistency(policyId, _requiredAcks) {
    const policy = this.policies.get(policyId);
    if (!policy) {
      return false;
    }
    const healthyCount = this.getHealthyReplicas().length;
    switch (policy.consistencyLevel) {
      case "eventual":
        return true;
      case "read-after-write":
        return healthyCount >= 1;
      case "strong":
        return healthyCount >= policy.replicationFactor;
      default:
        return false;
    }
  }
  clear() {
    this.replicas.clear();
    this.policies.clear();
    this.replicationEvents = [];
    this.syncStatus.clear();
    this.replicasByDID.clear();
    this.cryptoProvider = null;
  }
  getCryptoProvider() {
    return this.cryptoProvider;
  }
}, SyncProtocol = class {
  version = "1.0.0";
  messageQueue = [];
  messageMap = /* @__PURE__ */ new Map;
  handshakes = /* @__PURE__ */ new Map;
  protocolErrors = [];
  messageCounter = 0;
  cryptoProvider = null;
  cryptoConfig = null;
  configureCrypto(provider, config) {
    this.cryptoProvider = provider;
    this.cryptoConfig = {
      encryptionMode: config?.encryptionMode ?? "none",
      requireSignatures: config?.requireSignatures ?? false,
      requireCapabilities: config?.requireCapabilities ?? false,
      requiredCapabilities: config?.requiredCapabilities
    };
    logger.debug("[SyncProtocol] Crypto configured", {
      encryptionMode: this.cryptoConfig.encryptionMode,
      requireSignatures: this.cryptoConfig.requireSignatures,
      requireCapabilities: this.cryptoConfig.requireCapabilities
    });
  }
  isCryptoEnabled() {
    return this.cryptoProvider !== null && this.cryptoProvider.isInitialized();
  }
  getCryptoConfig() {
    return this.cryptoConfig ? { ...this.cryptoConfig } : null;
  }
  getVersion() {
    return this.version;
  }
  async createAuthenticatedHandshake(capabilities, targetDID) {
    if (!this.cryptoProvider || !this.cryptoProvider.isInitialized()) {
      throw new Error("Crypto provider not initialized");
    }
    const localDID = this.cryptoProvider.getLocalDID();
    if (!localDID) {
      throw new Error("Local DID not available");
    }
    const publicInfo = await this.cryptoProvider.exportPublicIdentity();
    if (!publicInfo) {
      throw new Error("Cannot export public identity");
    }
    let ucan;
    if (targetDID && this.cryptoConfig?.requireCapabilities) {
      const caps = this.cryptoConfig.requiredCapabilities || [
        { can: "aeon:sync:read", with: "*" },
        { can: "aeon:sync:write", with: "*" }
      ];
      ucan = await this.cryptoProvider.createUCAN(targetDID, caps);
    }
    const handshakePayload = {
      protocolVersion: this.version,
      nodeId: localDID,
      capabilities,
      state: "initiating",
      did: localDID,
      publicSigningKey: publicInfo.publicSigningKey,
      publicEncryptionKey: publicInfo.publicEncryptionKey,
      ucan
    };
    const message = {
      type: "handshake",
      version: this.version,
      sender: localDID,
      receiver: targetDID || "",
      messageId: this.generateMessageId(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      payload: handshakePayload
    };
    if (this.cryptoConfig?.requireSignatures) {
      const signed = await this.cryptoProvider.signData(handshakePayload);
      message.auth = {
        senderDID: localDID,
        receiverDID: targetDID,
        signature: signed.signature
      };
    }
    this.messageMap.set(message.messageId, message);
    this.messageQueue.push(message);
    logger.debug("[SyncProtocol] Authenticated handshake created", {
      messageId: message.messageId,
      did: localDID,
      capabilities: capabilities.length,
      hasUCAN: !!ucan
    });
    return message;
  }
  async verifyAuthenticatedHandshake(message) {
    if (message.type !== "handshake") {
      return { valid: false, error: "Message is not a handshake" };
    }
    const handshake = message.payload;
    if (!this.cryptoProvider || !this.cryptoConfig) {
      this.handshakes.set(message.sender, handshake);
      return { valid: true, handshake };
    }
    if (handshake.did && handshake.publicSigningKey) {
      await this.cryptoProvider.registerRemoteNode({
        id: handshake.nodeId,
        did: handshake.did,
        publicSigningKey: handshake.publicSigningKey,
        publicEncryptionKey: handshake.publicEncryptionKey
      });
    }
    if (this.cryptoConfig.requireSignatures && message.auth?.signature) {
      const signed = {
        payload: handshake,
        signature: message.auth.signature,
        signer: message.auth.senderDID || message.sender,
        algorithm: "ES256",
        signedAt: Date.now()
      };
      const isValid = await this.cryptoProvider.verifySignedData(signed);
      if (!isValid) {
        logger.warn("[SyncProtocol] Handshake signature verification failed", {
          messageId: message.messageId,
          sender: message.sender
        });
        return { valid: false, error: "Invalid signature" };
      }
    }
    if (this.cryptoConfig.requireCapabilities && handshake.ucan) {
      const localDID = this.cryptoProvider.getLocalDID();
      const result = await this.cryptoProvider.verifyUCAN(handshake.ucan, {
        expectedAudience: localDID || undefined,
        requiredCapabilities: this.cryptoConfig.requiredCapabilities
      });
      if (!result.authorized) {
        logger.warn("[SyncProtocol] Handshake UCAN verification failed", {
          messageId: message.messageId,
          error: result.error
        });
        return { valid: false, error: result.error || "Unauthorized" };
      }
    }
    this.handshakes.set(message.sender, handshake);
    logger.debug("[SyncProtocol] Authenticated handshake verified", {
      messageId: message.messageId,
      did: handshake.did
    });
    return { valid: true, handshake };
  }
  async signMessage(message, payload, encrypt = false) {
    if (!this.cryptoProvider || !this.cryptoProvider.isInitialized()) {
      throw new Error("Crypto provider not initialized");
    }
    const localDID = this.cryptoProvider.getLocalDID();
    const signed = await this.cryptoProvider.signData(payload);
    message.auth = {
      senderDID: localDID || undefined,
      receiverDID: message.receiver || undefined,
      signature: signed.signature,
      encrypted: false
    };
    if (encrypt && message.receiver && this.cryptoConfig?.encryptionMode !== "none") {
      const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
      const encrypted = await this.cryptoProvider.encrypt(payloadBytes, message.receiver);
      message.payload = encrypted;
      message.auth.encrypted = true;
      logger.debug("[SyncProtocol] Message encrypted", {
        messageId: message.messageId,
        recipient: message.receiver
      });
    } else {
      message.payload = payload;
    }
    return message;
  }
  async verifyMessage(message) {
    if (!this.cryptoProvider || !message.auth) {
      return { valid: true, payload: message.payload };
    }
    let payload = message.payload;
    if (message.auth.encrypted && message.payload) {
      try {
        const encrypted = message.payload;
        const decrypted = await this.cryptoProvider.decrypt(encrypted, message.auth.senderDID);
        payload = JSON.parse(new TextDecoder().decode(decrypted));
        logger.debug("[SyncProtocol] Message decrypted", {
          messageId: message.messageId
        });
      } catch (error) {
        return {
          valid: false,
          error: `Decryption failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
    if (message.auth.signature && message.auth.senderDID) {
      const signed = {
        payload,
        signature: message.auth.signature,
        signer: message.auth.senderDID,
        algorithm: "ES256",
        signedAt: Date.now()
      };
      const isValid = await this.cryptoProvider.verifySignedData(signed);
      if (!isValid) {
        return { valid: false, error: "Invalid signature" };
      }
    }
    return { valid: true, payload };
  }
  createHandshakeMessage(nodeId, capabilities) {
    const message = {
      type: "handshake",
      version: this.version,
      sender: nodeId,
      receiver: "",
      messageId: this.generateMessageId(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      payload: {
        protocolVersion: this.version,
        nodeId,
        capabilities,
        state: "initiating"
      }
    };
    this.messageMap.set(message.messageId, message);
    this.messageQueue.push(message);
    logger.debug("[SyncProtocol] Handshake message created", {
      messageId: message.messageId,
      nodeId,
      capabilities: capabilities.length
    });
    return message;
  }
  createSyncRequestMessage(sender, receiver, sessionId, fromVersion, toVersion, filter) {
    const message = {
      type: "sync-request",
      version: this.version,
      sender,
      receiver,
      messageId: this.generateMessageId(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      payload: {
        sessionId,
        fromVersion,
        toVersion,
        filter
      }
    };
    this.messageMap.set(message.messageId, message);
    this.messageQueue.push(message);
    logger.debug("[SyncProtocol] Sync request created", {
      messageId: message.messageId,
      sessionId,
      fromVersion,
      toVersion
    });
    return message;
  }
  createSyncResponseMessage(sender, receiver, sessionId, fromVersion, toVersion, data, hasMore = false, offset = 0) {
    const message = {
      type: "sync-response",
      version: this.version,
      sender,
      receiver,
      messageId: this.generateMessageId(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      payload: {
        sessionId,
        fromVersion,
        toVersion,
        data,
        hasMore,
        offset
      }
    };
    this.messageMap.set(message.messageId, message);
    this.messageQueue.push(message);
    logger.debug("[SyncProtocol] Sync response created", {
      messageId: message.messageId,
      sessionId,
      itemCount: data.length,
      hasMore
    });
    return message;
  }
  createAckMessage(sender, receiver, messageId) {
    const message = {
      type: "ack",
      version: this.version,
      sender,
      receiver,
      messageId: this.generateMessageId(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      payload: { acknowledgedMessageId: messageId }
    };
    this.messageMap.set(message.messageId, message);
    this.messageQueue.push(message);
    return message;
  }
  createErrorMessage(sender, receiver, error, relatedMessageId) {
    const message = {
      type: "error",
      version: this.version,
      sender,
      receiver,
      messageId: this.generateMessageId(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      payload: {
        error,
        relatedMessageId
      }
    };
    this.messageMap.set(message.messageId, message);
    this.messageQueue.push(message);
    this.protocolErrors.push({
      error,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    logger.error("[SyncProtocol] Error message created", {
      messageId: message.messageId,
      errorCode: error.code,
      recoverable: error.recoverable
    });
    return message;
  }
  validateMessage(message) {
    const errors = [];
    if (!message.type) {
      errors.push("Message type is required");
    }
    if (!message.sender) {
      errors.push("Sender is required");
    }
    if (!message.messageId) {
      errors.push("Message ID is required");
    }
    if (!message.timestamp) {
      errors.push("Timestamp is required");
    }
    try {
      new Date(message.timestamp);
    } catch {
      errors.push("Invalid timestamp format");
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
  serializeMessage(message) {
    try {
      return JSON.stringify(message);
    } catch (error) {
      logger.error("[SyncProtocol] Message serialization failed", {
        messageId: message.messageId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Failed to serialize message: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  deserializeMessage(data) {
    try {
      const message = JSON.parse(data);
      const validation = this.validateMessage(message);
      if (!validation.valid) {
        throw new Error(`Invalid message: ${validation.errors.join(", ")}`);
      }
      return message;
    } catch (error) {
      logger.error("[SyncProtocol] Message deserialization failed", {
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Failed to deserialize message: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  processHandshake(message) {
    if (message.type !== "handshake") {
      throw new Error("Message is not a handshake");
    }
    const handshake = message.payload;
    const nodeId = message.sender;
    this.handshakes.set(nodeId, handshake);
    logger.debug("[SyncProtocol] Handshake processed", {
      nodeId,
      protocolVersion: handshake.protocolVersion,
      capabilities: handshake.capabilities.length
    });
    return handshake;
  }
  getMessage(messageId) {
    return this.messageMap.get(messageId);
  }
  getAllMessages() {
    return [...this.messageQueue];
  }
  getMessagesByType(type) {
    return this.messageQueue.filter((m) => m.type === type);
  }
  getMessagesFromSender(sender) {
    return this.messageQueue.filter((m) => m.sender === sender);
  }
  getPendingMessages(receiver) {
    return this.messageQueue.filter((m) => m.receiver === receiver);
  }
  getHandshakes() {
    return new Map(this.handshakes);
  }
  getStatistics() {
    const messagesByType = {};
    for (const message of this.messageQueue) {
      messagesByType[message.type] = (messagesByType[message.type] || 0) + 1;
    }
    const errorCount = this.protocolErrors.length;
    const recoverableErrors = this.protocolErrors.filter((e) => e.error.recoverable).length;
    return {
      totalMessages: this.messageQueue.length,
      messagesByType,
      totalHandshakes: this.handshakes.size,
      totalErrors: errorCount,
      recoverableErrors,
      unrecoverableErrors: errorCount - recoverableErrors
    };
  }
  getErrors() {
    return [...this.protocolErrors];
  }
  generateMessageId() {
    this.messageCounter++;
    return `msg-${Date.now()}-${this.messageCounter}`;
  }
  clear() {
    this.messageQueue = [];
    this.messageMap.clear();
    this.handshakes.clear();
    this.protocolErrors = [];
    this.messageCounter = 0;
    this.cryptoProvider = null;
    this.cryptoConfig = null;
  }
  getCryptoProvider() {
    return this.cryptoProvider;
  }
}, StateReconciler = class {
  stateVersions = /* @__PURE__ */ new Map;
  reconciliationHistory = [];
  cryptoProvider = null;
  requireSignedVersions = false;
  configureCrypto(provider, requireSigned = false) {
    this.cryptoProvider = provider;
    this.requireSignedVersions = requireSigned;
    logger.debug("[StateReconciler] Crypto configured", {
      initialized: provider.isInitialized(),
      requireSigned
    });
  }
  isCryptoEnabled() {
    return this.cryptoProvider !== null && this.cryptoProvider.isInitialized();
  }
  async recordSignedStateVersion(key, version, data) {
    if (!this.cryptoProvider || !this.cryptoProvider.isInitialized()) {
      throw new Error("Crypto provider not initialized");
    }
    const localDID = this.cryptoProvider.getLocalDID();
    if (!localDID) {
      throw new Error("Local DID not available");
    }
    const dataBytes = new TextEncoder().encode(JSON.stringify(data));
    const hashBytes = await this.cryptoProvider.hash(dataBytes);
    const hash = Array.from(hashBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const versionData = { version, data, hash };
    const signed = await this.cryptoProvider.signData(versionData);
    const stateVersion = {
      version,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      nodeId: localDID,
      hash,
      data,
      signerDID: localDID,
      signature: signed.signature,
      signedAt: signed.signedAt
    };
    if (!this.stateVersions.has(key)) {
      this.stateVersions.set(key, []);
    }
    this.stateVersions.get(key).push(stateVersion);
    logger.debug("[StateReconciler] Signed state version recorded", {
      key,
      version,
      signerDID: localDID,
      hash: hash.slice(0, 16) + "..."
    });
    return stateVersion;
  }
  async verifyStateVersion(version) {
    if (!version.signature || !version.signerDID) {
      if (this.requireSignedVersions) {
        return { valid: false, error: "Signature required but not present" };
      }
      const dataBytes = new TextEncoder().encode(JSON.stringify(version.data));
      if (this.cryptoProvider) {
        const hashBytes = await this.cryptoProvider.hash(dataBytes);
        const computedHash = Array.from(hashBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
        if (computedHash !== version.hash) {
          return { valid: false, error: "Hash mismatch" };
        }
      }
      return { valid: true };
    }
    if (!this.cryptoProvider) {
      return { valid: false, error: "Crypto provider not configured" };
    }
    const versionData = {
      version: version.version,
      data: version.data,
      hash: version.hash
    };
    const signed = {
      payload: versionData,
      signature: version.signature,
      signer: version.signerDID,
      algorithm: "ES256",
      signedAt: version.signedAt || Date.now()
    };
    const isValid = await this.cryptoProvider.verifySignedData(signed);
    if (!isValid) {
      return { valid: false, error: "Invalid signature" };
    }
    return { valid: true };
  }
  async reconcileWithVerification(key, strategy = "last-write-wins") {
    const versions = this.stateVersions.get(key) || [];
    const verifiedVersions = [];
    const verificationErrors = [];
    for (const version of versions) {
      const result2 = await this.verifyStateVersion(version);
      if (result2.valid) {
        verifiedVersions.push(version);
      } else {
        verificationErrors.push(`Version ${version.version} from ${version.nodeId}: ${result2.error}`);
        logger.warn("[StateReconciler] Version verification failed", {
          version: version.version,
          nodeId: version.nodeId,
          error: result2.error
        });
      }
    }
    if (verifiedVersions.length === 0) {
      return {
        success: false,
        mergedState: null,
        conflictsResolved: 0,
        strategy,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        verificationErrors
      };
    }
    let result;
    switch (strategy) {
      case "last-write-wins":
        result = this.reconcileLastWriteWins(verifiedVersions);
        break;
      case "vector-clock":
        result = this.reconcileVectorClock(verifiedVersions);
        break;
      case "majority-vote":
        result = this.reconcileMajorityVote(verifiedVersions);
        break;
      default:
        result = this.reconcileLastWriteWins(verifiedVersions);
    }
    return { ...result, verificationErrors };
  }
  recordStateVersion(key, version, timestamp, nodeId, hash, data) {
    if (!this.stateVersions.has(key)) {
      this.stateVersions.set(key, []);
    }
    const versions = this.stateVersions.get(key);
    versions.push({
      version,
      timestamp,
      nodeId,
      hash,
      data
    });
    logger.debug("[StateReconciler] State version recorded", {
      key,
      version,
      nodeId,
      hash
    });
  }
  detectConflicts(key) {
    const versions = this.stateVersions.get(key);
    if (!versions || versions.length <= 1) {
      return false;
    }
    const hashes = new Set(versions.map((v) => v.hash));
    return hashes.size > 1;
  }
  compareStates(state1, state2) {
    const diff = {
      added: {},
      modified: {},
      removed: [],
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    for (const [key, value] of Object.entries(state2)) {
      if (!(key in state1)) {
        diff.added[key] = value;
      } else if (JSON.stringify(state1[key]) !== JSON.stringify(value)) {
        diff.modified[key] = { old: state1[key], new: value };
      }
    }
    for (const key of Object.keys(state1)) {
      if (!(key in state2)) {
        diff.removed.push(key);
      }
    }
    return diff;
  }
  reconcileLastWriteWins(versions) {
    if (versions.length === 0) {
      throw new Error("No versions to reconcile");
    }
    const sorted = [...versions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const latest = sorted[0];
    const conflictsResolved = versions.length - 1;
    const result = {
      success: true,
      mergedState: latest.data,
      conflictsResolved,
      strategy: "last-write-wins",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.reconciliationHistory.push(result);
    logger.debug("[StateReconciler] State reconciled (last-write-wins)", {
      winnerNode: latest.nodeId,
      conflictsResolved
    });
    return result;
  }
  reconcileVectorClock(versions) {
    if (versions.length === 0) {
      throw new Error("No versions to reconcile");
    }
    const sorted = [...versions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const latest = sorted[0];
    let conflictsResolved = 0;
    for (const v of versions) {
      const timeDiff = Math.abs(new Date(v.timestamp).getTime() - new Date(latest.timestamp).getTime());
      if (timeDiff > 100) {
        conflictsResolved++;
      }
    }
    const result = {
      success: true,
      mergedState: latest.data,
      conflictsResolved,
      strategy: "vector-clock",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.reconciliationHistory.push(result);
    logger.debug("[StateReconciler] State reconciled (vector-clock)", {
      winnerVersion: latest.version,
      conflictsResolved
    });
    return result;
  }
  reconcileMajorityVote(versions) {
    if (versions.length === 0) {
      throw new Error("No versions to reconcile");
    }
    const hashGroups = /* @__PURE__ */ new Map;
    for (const version of versions) {
      if (!hashGroups.has(version.hash)) {
        hashGroups.set(version.hash, []);
      }
      hashGroups.get(version.hash).push(version);
    }
    let majorityVersion = null;
    let maxCount = 0;
    for (const [, versionGroup] of hashGroups) {
      if (versionGroup.length > maxCount) {
        maxCount = versionGroup.length;
        majorityVersion = versionGroup[0];
      }
    }
    if (!majorityVersion) {
      majorityVersion = versions[0];
    }
    const conflictsResolved = versions.length - maxCount;
    const result = {
      success: true,
      mergedState: majorityVersion.data,
      conflictsResolved,
      strategy: "majority-vote",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.reconciliationHistory.push(result);
    logger.debug("[StateReconciler] State reconciled (majority-vote)", {
      majorityCount: maxCount,
      conflictsResolved
    });
    return result;
  }
  mergeStates(states) {
    if (states.length === 0) {
      return {};
    }
    if (states.length === 1) {
      return states[0];
    }
    const merged = {};
    for (const state of states) {
      if (typeof state === "object" && state !== null) {
        Object.assign(merged, state);
      }
    }
    return merged;
  }
  validateState(state) {
    const errors = [];
    if (state === null) {
      errors.push("State is null");
    } else if (state === undefined) {
      errors.push("State is undefined");
    } else if (typeof state !== "object") {
      errors.push("State is not an object");
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
  getStateVersions(key) {
    return this.stateVersions.get(key) || [];
  }
  getAllStateVersions() {
    const result = {};
    for (const [key, versions] of this.stateVersions) {
      result[key] = [...versions];
    }
    return result;
  }
  getReconciliationHistory() {
    return [...this.reconciliationHistory];
  }
  getStatistics() {
    const resolvedConflicts = this.reconciliationHistory.reduce((sum, r) => sum + r.conflictsResolved, 0);
    const strategyUsage = {};
    for (const result of this.reconciliationHistory) {
      strategyUsage[result.strategy] = (strategyUsage[result.strategy] || 0) + 1;
    }
    return {
      totalReconciliations: this.reconciliationHistory.length,
      successfulReconciliations: this.reconciliationHistory.filter((r) => r.success).length,
      totalConflictsResolved: resolvedConflicts,
      averageConflictsPerReconciliation: this.reconciliationHistory.length > 0 ? resolvedConflicts / this.reconciliationHistory.length : 0,
      strategyUsage,
      trackedKeys: this.stateVersions.size
    };
  }
  clear() {
    this.stateVersions.clear();
    this.reconciliationHistory = [];
    this.cryptoProvider = null;
    this.requireSignedVersions = false;
  }
  getCryptoProvider() {
    return this.cryptoProvider;
  }
}, logger2, OfflineOperationQueue, offlineQueueInstance = null, logger3, CompressionEngine = class {
  stats = {
    totalCompressed: 0,
    totalDecompressed: 0,
    totalOriginalBytes: 0,
    totalCompressedBytes: 0,
    averageCompressionRatio: 0,
    compressionTimeMs: 0,
    decompressionTimeMs: 0
  };
  preferredAlgorithm = "gzip";
  constructor(preferredAlgorithm = "gzip") {
    this.preferredAlgorithm = preferredAlgorithm;
    logger3.debug("[CompressionEngine] Initialized", {
      algorithm: preferredAlgorithm,
      supportsNative: this.supportsNativeCompression()
    });
  }
  supportsNativeCompression() {
    return typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";
  }
  async compress(data) {
    const startTime = performance.now();
    const inputData = typeof data === "string" ? new TextEncoder().encode(data) : data;
    const originalSize = inputData.byteLength;
    let compressed;
    let algorithm = this.preferredAlgorithm;
    if (this.supportsNativeCompression()) {
      try {
        compressed = await this.compressNative(inputData, this.preferredAlgorithm);
      } catch (error) {
        logger3.warn("[CompressionEngine] Native compression failed, using fallback", error);
        compressed = inputData;
        algorithm = "none";
      }
    } else {
      compressed = inputData;
      algorithm = "none";
    }
    const compressionRatio = originalSize > 0 ? 1 - compressed.byteLength / originalSize : 0;
    const batch = {
      id: `batch-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      compressed,
      originalSize,
      compressedSize: compressed.byteLength,
      compressionRatio,
      algorithm,
      timestamp: Date.now()
    };
    const elapsed = performance.now() - startTime;
    this.stats.totalCompressed++;
    this.stats.totalOriginalBytes += originalSize;
    this.stats.totalCompressedBytes += compressed.byteLength;
    this.stats.compressionTimeMs += elapsed;
    this.updateAverageRatio();
    logger3.debug("[CompressionEngine] Compressed", {
      original: originalSize,
      compressed: compressed.byteLength,
      ratio: (compressionRatio * 100).toFixed(1) + "%",
      algorithm,
      timeMs: elapsed.toFixed(2)
    });
    return batch;
  }
  async decompress(batch) {
    const startTime = performance.now();
    let decompressed;
    if (batch.algorithm === "none") {
      decompressed = batch.compressed;
    } else if (this.supportsNativeCompression()) {
      try {
        decompressed = await this.decompressNative(batch.compressed, batch.algorithm);
      } catch (error) {
        logger3.warn("[CompressionEngine] Native decompression failed", error);
        throw error;
      }
    } else {
      throw new Error("Native decompression not available");
    }
    const elapsed = performance.now() - startTime;
    this.stats.totalDecompressed++;
    this.stats.decompressionTimeMs += elapsed;
    logger3.debug("[CompressionEngine] Decompressed", {
      compressed: batch.compressedSize,
      decompressed: decompressed.byteLength,
      algorithm: batch.algorithm,
      timeMs: elapsed.toFixed(2)
    });
    return decompressed;
  }
  async compressNative(data, algorithm) {
    const stream = new CompressionStream(algorithm);
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();
    writer.write(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
    writer.close();
    const chunks = [];
    let done = false;
    while (!done) {
      const result = await reader.read();
      done = result.done;
      if (result.value) {
        chunks.push(result.value);
      }
    }
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    return combined;
  }
  async decompressNative(data, algorithm) {
    const stream = new DecompressionStream(algorithm);
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();
    writer.write(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
    writer.close();
    const chunks = [];
    let done = false;
    while (!done) {
      const result = await reader.read();
      done = result.done;
      if (result.value) {
        chunks.push(result.value);
      }
    }
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    return combined;
  }
  splitIntoChunks(batch, chunkSize = 64 * 1024) {
    const chunks = [];
    const data = batch.compressed;
    const total = Math.ceil(data.byteLength / chunkSize);
    for (let i = 0;i < total; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, data.byteLength);
      const chunkData = data.slice(start, end);
      chunks.push({
        chunkId: `${batch.id}-chunk-${i}`,
        batchId: batch.id,
        data: chunkData,
        index: i,
        total,
        checksum: this.simpleChecksum(chunkData)
      });
    }
    return chunks;
  }
  reassembleChunks(chunks) {
    const sorted = [...chunks].sort((a, b) => a.index - b.index);
    const total = sorted[0]?.total ?? 0;
    if (sorted.length !== total) {
      throw new Error(`Missing chunks: got ${sorted.length}, expected ${total}`);
    }
    const totalLength = sorted.reduce((sum, chunk) => sum + chunk.data.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of sorted) {
      combined.set(chunk.data, offset);
      offset += chunk.data.length;
    }
    return combined;
  }
  simpleChecksum(data) {
    let hash = 0;
    for (let i = 0;i < data.length; i++) {
      hash = (hash << 5) - hash + data[i] | 0;
    }
    return hash.toString(16);
  }
  updateAverageRatio() {
    if (this.stats.totalOriginalBytes > 0) {
      this.stats.averageCompressionRatio = 1 - this.stats.totalCompressedBytes / this.stats.totalOriginalBytes;
    }
  }
  getStats() {
    return { ...this.stats };
  }
  resetStats() {
    this.stats = {
      totalCompressed: 0,
      totalDecompressed: 0,
      totalOriginalBytes: 0,
      totalCompressedBytes: 0,
      averageCompressionRatio: 0,
      compressionTimeMs: 0,
      decompressionTimeMs: 0
    };
  }
}, compressionEngineInstance = null, logger4, DeltaSyncOptimizer = class {
  operationHistory = /* @__PURE__ */ new Map;
  stats = {
    totalOperations: 0,
    totalFull: 0,
    totalDelta: 0,
    totalOriginalSize: 0,
    totalDeltaSize: 0,
    averageReductionPercent: 0,
    lastSyncTime: 0,
    fullOperationThreshold: 1000
  };
  constructor(fullOperationThreshold = 1000) {
    this.stats.fullOperationThreshold = fullOperationThreshold;
    logger4.debug("[DeltaSyncOptimizer] Initialized", {
      threshold: fullOperationThreshold
    });
  }
  computeDelta(operation) {
    const operationJson = JSON.stringify(operation);
    const originalSize = new TextEncoder().encode(operationJson).byteLength;
    const previous = this.operationHistory.get(operation.id);
    if (!previous) {
      const delta = {
        id: `delta-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: "full",
        operationId: operation.id,
        operationType: operation.type,
        sessionId: operation.sessionId,
        timestamp: Date.now(),
        fullData: operation.data,
        priority: operation.priority
      };
      this.stats.totalOperations++;
      this.stats.totalFull++;
      this.stats.totalOriginalSize += originalSize;
      const deltaSize2 = new TextEncoder().encode(JSON.stringify(delta)).byteLength;
      this.stats.totalDeltaSize += deltaSize2;
      this.operationHistory.set(operation.id, operation);
      return delta;
    }
    const changes = {};
    const changeMask = [];
    let hasMeaningfulChanges = false;
    for (const [key, value] of Object.entries(operation.data)) {
      const oldValue = previous.data[key];
      if (!this.deepEqual(value, oldValue)) {
        changes[key] = value;
        changeMask.push(key);
        hasMeaningfulChanges = true;
      }
    }
    for (const key of Object.keys(previous.data)) {
      if (!(key in operation.data)) {
        changes[key] = null;
        changeMask.push(`${key}:deleted`);
        hasMeaningfulChanges = true;
      }
    }
    const deltaData = {
      id: `delta-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: "delta",
      operationId: operation.id,
      operationType: operation.type,
      sessionId: operation.sessionId,
      timestamp: Date.now(),
      changes: hasMeaningfulChanges ? changes : undefined,
      changeMask: hasMeaningfulChanges ? changeMask : undefined,
      priority: operation.priority
    };
    const deltaSize = new TextEncoder().encode(JSON.stringify(deltaData)).byteLength;
    const finalDelta = deltaSize > this.stats.fullOperationThreshold ? {
      ...deltaData,
      type: "full",
      fullData: operation.data,
      changes: undefined,
      changeMask: undefined
    } : deltaData;
    this.stats.totalOperations++;
    if (finalDelta.type === "full") {
      this.stats.totalFull++;
    } else {
      this.stats.totalDelta++;
    }
    this.stats.totalOriginalSize += originalSize;
    this.stats.totalDeltaSize += deltaSize;
    this.operationHistory.set(operation.id, operation);
    return finalDelta;
  }
  computeBatchDeltas(operations) {
    const deltas = operations.map((op) => this.computeDelta(op));
    const totalOriginalSize = operations.reduce((sum, op) => sum + new TextEncoder().encode(JSON.stringify(op)).byteLength, 0);
    const totalDeltaSize = deltas.reduce((sum, delta) => sum + new TextEncoder().encode(JSON.stringify(delta)).byteLength, 0);
    const reductionPercent = totalOriginalSize > 0 ? Math.round((totalOriginalSize - totalDeltaSize) / totalOriginalSize * 100) : 0;
    const batch = {
      batchId: `batch-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      operations: deltas,
      timestamp: Date.now(),
      totalOriginalSize,
      totalDeltaSize,
      reductionPercent
    };
    logger4.debug("[DeltaSyncOptimizer] Batch computed", {
      operations: operations.length,
      reduction: reductionPercent,
      size: totalDeltaSize
    });
    return batch;
  }
  decompressDelta(delta) {
    if (delta.type === "full") {
      return {
        id: delta.operationId,
        type: delta.operationType,
        sessionId: delta.sessionId,
        data: delta.fullData || {},
        status: "pending",
        createdAt: delta.timestamp
      };
    }
    const previous = this.operationHistory.get(delta.operationId);
    if (!previous) {
      logger4.warn("[DeltaSyncOptimizer] Cannot decompress - no history", {
        operationId: delta.operationId
      });
      return {
        id: delta.operationId,
        type: delta.operationType,
        sessionId: delta.sessionId,
        data: delta.changes || {},
        status: "pending",
        createdAt: delta.timestamp
      };
    }
    const reconstructed = {
      ...previous,
      data: {
        ...previous.data,
        ...delta.changes || {}
      }
    };
    if (delta.changes) {
      for (const [key, value] of Object.entries(delta.changes)) {
        if (value === null) {
          delete reconstructed.data[key];
        }
      }
    }
    return reconstructed;
  }
  updateHistory(operations) {
    for (const op of operations) {
      this.operationHistory.set(op.id, op);
    }
    logger4.debug("[DeltaSyncOptimizer] History updated", {
      count: operations.length,
      totalHistorySize: this.operationHistory.size
    });
  }
  clearHistory(operationIds) {
    for (const id of operationIds) {
      this.operationHistory.delete(id);
    }
    logger4.debug("[DeltaSyncOptimizer] History cleared", {
      cleared: operationIds.length,
      remaining: this.operationHistory.size
    });
  }
  getStats() {
    if (this.stats.totalOperations > 0) {
      this.stats.averageReductionPercent = Math.round((this.stats.totalOriginalSize - this.stats.totalDeltaSize) / this.stats.totalOriginalSize * 100);
    }
    return { ...this.stats };
  }
  resetStats() {
    this.stats = {
      totalOperations: 0,
      totalFull: 0,
      totalDelta: 0,
      totalOriginalSize: 0,
      totalDeltaSize: 0,
      averageReductionPercent: 0,
      lastSyncTime: 0,
      fullOperationThreshold: this.stats.fullOperationThreshold
    };
    logger4.debug("[DeltaSyncOptimizer] Stats reset");
  }
  setFullOperationThreshold(bytes) {
    this.stats.fullOperationThreshold = bytes;
    logger4.debug("[DeltaSyncOptimizer] Threshold updated", { bytes });
  }
  getHistorySize() {
    return this.operationHistory.size;
  }
  getMemoryEstimate() {
    let totalBytes = 0;
    for (const op of this.operationHistory.values()) {
      totalBytes += new TextEncoder().encode(JSON.stringify(op)).byteLength;
    }
    return totalBytes;
  }
  deepEqual(a, b) {
    if (a === b)
      return true;
    if (a == null || b == null)
      return false;
    if (typeof a !== "object" || typeof b !== "object")
      return false;
    const aObj = a;
    const bObj = b;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);
    if (aKeys.length !== bKeys.length)
      return false;
    for (const key of aKeys) {
      if (!this.deepEqual(aObj[key], bObj[key])) {
        return false;
      }
    }
    return true;
  }
}, deltaSyncInstance = null, logger5, PrefetchingEngine = class {
  operationHistory = [];
  patterns = /* @__PURE__ */ new Map;
  prefetchCache = /* @__PURE__ */ new Map;
  maxHistoryEntries = 1000;
  maxCachePerType = 5;
  prefetchTTL = 5 * 60 * 1000;
  predictionThreshold = 0.3;
  stats = {
    totalPrefetched: 0,
    totalHits: 0,
    totalMisses: 0,
    totalOverwrites: 0,
    hitRatio: 0,
    bandwidthSaved: 0,
    patternsDetected: 0,
    predictionAccuracy: 0
  };
  lastPredictionTime = 0;
  predictionInterval = 30 * 1000;
  constructor() {
    logger5.debug("[PrefetchingEngine] Initialized", {
      ttl: this.prefetchTTL,
      threshold: this.predictionThreshold
    });
  }
  recordOperation(operationType, size) {
    const now = Date.now();
    this.operationHistory.push({
      type: operationType,
      timestamp: now,
      size
    });
    if (this.operationHistory.length > this.maxHistoryEntries) {
      this.operationHistory.shift();
    }
    if (Math.random() < 0.1) {
      this.cleanExpiredPrefetches();
    }
    logger5.debug("[PrefetchingEngine] Operation recorded", {
      type: operationType,
      size,
      historySize: this.operationHistory.length
    });
  }
  analyzePatterns() {
    if (this.operationHistory.length < 5) {
      return;
    }
    const patterns = /* @__PURE__ */ new Map;
    for (let length = 2;length <= 3; length++) {
      for (let i = 0;i < this.operationHistory.length - length; i++) {
        const sequence = this.operationHistory.slice(i, i + length).map((op) => op.type);
        const key = sequence.join(" \u2192 ");
        if (!patterns.has(key)) {
          patterns.set(key, {
            sequence,
            frequency: 0,
            probability: 0,
            lastOccurred: 0,
            avgIntervalMs: 0
          });
        }
        const pattern = patterns.get(key);
        pattern.frequency++;
        pattern.lastOccurred = Date.now();
      }
    }
    const totalSequences = this.operationHistory.length;
    for (const [key, pattern] of patterns.entries()) {
      pattern.probability = Math.min(1, pattern.frequency / totalSequences);
    }
    this.patterns = patterns;
    this.stats.patternsDetected = patterns.size;
    logger5.debug("[PrefetchingEngine] Patterns analyzed", {
      patternsFound: patterns.size
    });
  }
  predictNextOperations(recentOperations) {
    const now = Date.now();
    if (now - this.lastPredictionTime > this.predictionInterval) {
      this.analyzePatterns();
      this.lastPredictionTime = now;
    }
    if (this.patterns.size === 0) {
      return [];
    }
    const predictions = [];
    const recentTypeSequence = recentOperations.slice(-3).map((op) => op.type).join(" \u2192 ");
    for (const [key, pattern] of this.patterns.entries()) {
      if (key.includes(recentTypeSequence)) {
        const nextType = pattern.sequence[pattern.sequence.length - 1];
        const prediction = {
          operationType: nextType,
          probability: pattern.probability,
          reason: `Detected pattern: ${key}`,
          shouldPrefetch: pattern.probability > this.predictionThreshold,
          estimatedTimeMs: pattern.avgIntervalMs
        };
        predictions.push(prediction);
      }
    }
    const deduped = Array.from(new Map(predictions.map((p) => [p.operationType, p])).values()).sort((a, b) => b.probability - a.probability);
    logger5.debug("[PrefetchingEngine] Predictions", {
      predictions: deduped.slice(0, 3).map((p) => ({
        type: p.operationType,
        probability: (p.probability * 100).toFixed(1) + "%"
      }))
    });
    return deduped;
  }
  addPrefetchedBatch(operationType, compressed, originalSize) {
    if (!this.prefetchCache.has(operationType)) {
      this.prefetchCache.set(operationType, []);
    }
    const cache = this.prefetchCache.get(operationType);
    if (cache.length >= this.maxCachePerType) {
      const oldest = cache.shift();
      if (oldest.hitCount === 0) {
        this.stats.totalMisses++;
      } else {
        this.stats.totalOverwrites++;
      }
    }
    const batch = {
      id: `prefetch-${operationType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      operationType,
      compressed,
      compressedSize: compressed.length,
      originalSize,
      compressionRatio: 1 - compressed.length / originalSize,
      compressed_at: Date.now(),
      created_at: Date.now(),
      ttl: this.prefetchTTL,
      expiresAt: Date.now() + this.prefetchTTL,
      hitCount: 0,
      missCount: 0
    };
    cache.push(batch);
    this.stats.totalPrefetched++;
    this.stats.bandwidthSaved += originalSize - compressed.length;
    logger5.debug("[PrefetchingEngine] Prefetched batch added", {
      type: operationType,
      id: batch.id,
      ratio: (batch.compressionRatio * 100).toFixed(1) + "%"
    });
    return batch;
  }
  getPrefetchedBatch(operationType) {
    const cache = this.prefetchCache.get(operationType);
    if (!cache || cache.length === 0) {
      return null;
    }
    const now = Date.now();
    for (let i = 0;i < cache.length; i++) {
      const batch = cache[i];
      if (batch.expiresAt > now) {
        batch.hitCount++;
        this.stats.totalHits++;
        this.updatePredictionAccuracy(true);
        logger5.debug("[PrefetchingEngine] Prefetch hit", {
          type: operationType,
          id: batch.id
        });
        return batch;
      } else {
        cache.splice(i, 1);
        i--;
        batch.missCount++;
        this.stats.totalMisses++;
        this.updatePredictionAccuracy(false);
      }
    }
    return null;
  }
  updatePredictionAccuracy(hit) {
    const total = this.stats.totalHits + this.stats.totalMisses;
    if (total === 0)
      return;
    this.stats.predictionAccuracy = this.stats.totalHits / total;
  }
  cleanExpiredPrefetches() {
    const now = Date.now();
    let cleanedCount = 0;
    for (const [type, cache] of this.prefetchCache.entries()) {
      for (let i = cache.length - 1;i >= 0; i--) {
        if (cache[i].expiresAt < now) {
          const batch = cache.splice(i, 1)[0];
          if (batch.hitCount === 0) {
            this.stats.totalMisses++;
          }
          cleanedCount++;
        }
      }
      if (cache.length === 0) {
        this.prefetchCache.delete(type);
      }
    }
    if (cleanedCount > 0) {
      logger5.debug("[PrefetchingEngine] Cleaned expired prefetches", {
        count: cleanedCount
      });
    }
  }
  getStats() {
    const total = this.stats.totalHits + this.stats.totalMisses;
    this.stats.hitRatio = total > 0 ? this.stats.totalHits / total : 0;
    return { ...this.stats };
  }
  clear() {
    this.operationHistory = [];
    this.patterns.clear();
    this.prefetchCache.clear();
    this.stats = {
      totalPrefetched: 0,
      totalHits: 0,
      totalMisses: 0,
      totalOverwrites: 0,
      hitRatio: 0,
      bandwidthSaved: 0,
      patternsDetected: 0,
      predictionAccuracy: 0
    };
    logger5.debug("[PrefetchingEngine] Cleared all caches");
  }
}, prefetchingEngineInstance = null, logger6, BatchTimingOptimizer = class {
  networkHistory = [];
  activityHistory = [];
  stats = {
    totalBatches: 0,
    immediateDeliveries: 0,
    deferredBatches: 0,
    averageWaitTimeMs: 0,
    averageDeliveryTimeMs: 0,
    networkWindowsUsed: 0,
    congestionAvoided: 0,
    userFocusedOptimizations: 0
  };
  lastActivityTime = Date.now();
  isUserActive = true;
  congestionDetectionWindow = 60 * 1000;
  optimalBatchSize = 50 * 1024;
  constructor() {
    logger6.debug("[BatchTimingOptimizer] Initialized", {
      congestionWindow: this.congestionDetectionWindow,
      optimalBatchSize: this.optimalBatchSize
    });
  }
  recordNetworkMeasurement(latencyMs, bandwidthMbps) {
    const quality = this.assessNetworkQuality(latencyMs, bandwidthMbps);
    this.networkHistory.push({
      latencyMs,
      bandwidthMbps,
      timestamp: Date.now(),
      quality
    });
    if (this.networkHistory.length > 100) {
      this.networkHistory.shift();
    }
    this.stats.networkWindowsUsed++;
    logger6.debug("[BatchTimingOptimizer] Network measured", {
      latency: latencyMs + "ms",
      bandwidth: bandwidthMbps.toFixed(1) + " Mbps",
      quality
    });
  }
  assessNetworkQuality(latencyMs, bandwidthMbps) {
    if (latencyMs < 20 && bandwidthMbps > 10)
      return "excellent";
    if (latencyMs < 50 && bandwidthMbps > 5)
      return "good";
    if (latencyMs < 100 && bandwidthMbps > 2)
      return "fair";
    return "poor";
  }
  detectCongestion() {
    const recentMeasurements = this.networkHistory.filter((m) => Date.now() - m.timestamp < this.congestionDetectionWindow);
    if (recentMeasurements.length < 3) {
      return 0;
    }
    const poorCount = recentMeasurements.filter((m) => m.quality === "poor").length;
    return poorCount / recentMeasurements.length;
  }
  findOptimalWindow() {
    const now = Date.now();
    const recentMeasurements = this.networkHistory.slice(-20);
    if (recentMeasurements.length === 0) {
      return {
        startTime: now,
        endTime: now + 1000,
        expectedDurationMs: 1000,
        latencyMs: 50,
        bandwidthMbps: 5,
        quality: "good",
        isStable: true,
        congestionLevel: 0,
        recommendedBatchSize: this.optimalBatchSize
      };
    }
    const avgLatency = recentMeasurements.reduce((sum, m) => sum + m.latencyMs, 0) / recentMeasurements.length;
    const avgBandwidth = recentMeasurements.reduce((sum, m) => sum + m.bandwidthMbps, 0) / recentMeasurements.length;
    const latencyVariance = Math.sqrt(recentMeasurements.reduce((sum, m) => sum + Math.pow(m.latencyMs - avgLatency, 2), 0) / recentMeasurements.length) / avgLatency;
    const isStable = latencyVariance < 0.2;
    const congestionLevel = this.detectCongestion();
    const quality = this.assessNetworkQuality(avgLatency, avgBandwidth);
    const recommendedBatchSize = Math.max(10 * 1024, Math.min(500 * 1024, avgBandwidth * 1024 * 100 / 8));
    return {
      startTime: now,
      endTime: now + (isStable ? 30 * 1000 : 10 * 1000),
      expectedDurationMs: isStable ? 30 * 1000 : 10 * 1000,
      latencyMs: avgLatency,
      bandwidthMbps: avgBandwidth,
      quality,
      isStable,
      congestionLevel,
      recommendedBatchSize
    };
  }
  getSchedulingDecision(batchSize, batchPriority = "normal", isUserTriggered = false) {
    const now = Date.now();
    const currentWindow = this.findOptimalWindow();
    const congestionLevel = this.detectCongestion();
    let shouldSendNow = false;
    let recommendedDelay = 0;
    let reason = "";
    let priority = batchPriority;
    if (priority === "critical") {
      shouldSendNow = true;
      reason = "Critical operation (bypass optimization)";
    } else if (isUserTriggered && this.isUserActive) {
      shouldSendNow = true;
      reason = "User-triggered operation";
      priority = "high";
    } else if (currentWindow.quality === "excellent" || currentWindow.quality === "good") {
      if (congestionLevel < 0.3) {
        shouldSendNow = true;
        reason = "Good network conditions";
      } else {
        shouldSendNow = true;
        reason = "Good network despite some congestion";
        recommendedDelay = 1000 + Math.random() * 2000;
      }
    } else if (currentWindow.quality === "fair") {
      if (priority === "high") {
        shouldSendNow = true;
        reason = "High priority despite fair network";
      } else {
        shouldSendNow = false;
        reason = "Fair network: waiting for better window";
        recommendedDelay = 30 * 1000 + Math.random() * 30 * 1000;
      }
    } else {
      shouldSendNow = false;
      reason = "Poor network conditions: deferring";
      if (priority === "high") {
        recommendedDelay = 60 * 1000 + Math.random() * 30 * 1000;
      } else {
        recommendedDelay = 120 * 1000 + Math.random() * 60 * 1000;
      }
    }
    const estimatedDeliveryMs = batchSize / (currentWindow.bandwidthMbps * 1024 * 1024 / 8) * 1000 + currentWindow.latencyMs + recommendedDelay;
    const decision = {
      shouldSendNow,
      nextOptimalWindowMs: now + recommendedDelay,
      recommendedDelay,
      reason,
      priority,
      estimatedDeliveryMs
    };
    logger6.debug("[BatchTimingOptimizer] Scheduling decision", {
      size: (batchSize / 1024).toFixed(1) + " KB",
      shouldSendNow,
      delay: recommendedDelay + "ms",
      reason
    });
    return decision;
  }
  applyScheduling(batchSize, sendNow, actualDelay) {
    this.stats.totalBatches++;
    if (sendNow) {
      this.stats.immediateDeliveries++;
    } else {
      this.stats.deferredBatches++;
    }
    const totalWait = this.stats.averageWaitTimeMs * (this.stats.totalBatches - 1) + actualDelay;
    this.stats.averageWaitTimeMs = totalWait / this.stats.totalBatches;
    if (this.detectCongestion() > 0.3 && !sendNow) {
      this.stats.congestionAvoided++;
    }
    if (this.isUserActive) {
      this.stats.userFocusedOptimizations++;
    }
    this.stats.networkWindowsUsed++;
  }
  getOptimalBatchSize() {
    const window2 = this.findOptimalWindow();
    return window2.recommendedBatchSize;
  }
  getCurrentNetworkWindow() {
    return this.findOptimalWindow();
  }
  setUserActive(active) {
    this.isUserActive = active;
    if (active) {
      this.lastActivityTime = Date.now();
    }
  }
  getStats() {
    return { ...this.stats };
  }
  clear() {
    this.networkHistory = [];
    this.activityHistory = [];
    this.stats = {
      totalBatches: 0,
      immediateDeliveries: 0,
      deferredBatches: 0,
      averageWaitTimeMs: 0,
      averageDeliveryTimeMs: 0,
      networkWindowsUsed: 0,
      congestionAvoided: 0,
      userFocusedOptimizations: 0
    };
  }
}, batchTimingOptimizerInstance = null, logger7, AdaptiveCompressionOptimizer = class {
  currentLevel = 6;
  networkProfile = {
    estimatedSpeedKbps: 5000,
    latencyMs: 50,
    isOnline: true,
    isWifi: false,
    isFast: true,
    isSlow: false,
    isEmpty: false
  };
  deviceProfile = {
    cpuCores: 4,
    cpuUtilization: 0.3,
    memoryAvailableMB: 512,
    memoryTotalMB: 1024,
    isConstrained: false,
    isPremium: false,
    supportsWebWorkers: true,
    supportsWebAssembly: true
  };
  compressionHistory = [];
  stats = {
    currentLevel: 6,
    averageCompressionMs: 10,
    averageRatio: 0.85,
    levelsUsed: /* @__PURE__ */ new Set([6]),
    adjustmentCount: 0,
    totalBatches: 0,
    networkCondition: "normal"
  };
  constructor() {
    logger7.debug("[AdaptiveCompressionOptimizer] Initialized", {
      level: this.currentLevel
    });
  }
  updateNetworkConditions(speedKbps, latencyMs, isOnline) {
    this.networkProfile.estimatedSpeedKbps = speedKbps;
    if (latencyMs !== undefined) {
      this.networkProfile.latencyMs = latencyMs;
    }
    if (isOnline !== undefined) {
      this.networkProfile.isOnline = isOnline;
    }
    this.networkProfile.isFast = speedKbps > 5000;
    this.networkProfile.isSlow = speedKbps < 1000;
    this.networkProfile.isEmpty = speedKbps < 100;
    if (isOnline === false) {
      this.stats.networkCondition = "offline";
    } else if (this.networkProfile.isSlow) {
      this.stats.networkCondition = "slow";
    } else if (this.networkProfile.isFast) {
      this.stats.networkCondition = "fast";
    } else {
      this.stats.networkCondition = "normal";
    }
    logger7.debug("[AdaptiveCompressionOptimizer] Network updated", {
      speedKbps,
      condition: this.stats.networkCondition
    });
  }
  updateDeviceResources(cpuUtilization, memoryAvailableMB) {
    this.deviceProfile.cpuUtilization = Math.max(0, Math.min(1, cpuUtilization));
    this.deviceProfile.memoryAvailableMB = memoryAvailableMB;
    this.deviceProfile.isConstrained = memoryAvailableMB < 512;
    this.deviceProfile.isPremium = memoryAvailableMB > 2048;
    logger7.debug("[AdaptiveCompressionOptimizer] Device resources updated", {
      cpuUtilization: (cpuUtilization * 100).toFixed(1) + "%",
      memoryAvailableMB
    });
  }
  recordCompressionPerformance(level, compressionMs, ratio) {
    this.compressionHistory.push({
      level,
      ratio,
      timeMs: compressionMs,
      timestamp: Date.now()
    });
    if (this.compressionHistory.length > 100) {
      this.compressionHistory.shift();
    }
    this.stats.totalBatches++;
    this.stats.averageCompressionMs = this.compressionHistory.reduce((sum, h) => sum + h.timeMs, 0) / this.compressionHistory.length;
    this.stats.averageRatio = this.compressionHistory.reduce((sum, h) => sum + h.ratio, 0) / this.compressionHistory.length;
  }
  getRecommendedLevel() {
    const networkFactor = this.calculateNetworkFactor();
    const deviceFactor = this.calculateDeviceFactor();
    const combinedFactor = (networkFactor + deviceFactor) / 2;
    const recommendedLevel = Math.max(1, Math.min(9, Math.round(combinedFactor * 9)));
    const estimatedCompressionMs = this.estimateCompressionTime(recommendedLevel);
    const estimatedRatio = this.estimateCompressionRatio(recommendedLevel);
    let reason = "";
    if (networkFactor < 0.3 && deviceFactor < 0.3) {
      reason = "Slow network + constrained device: using level 1-2 (fast)";
    } else if (networkFactor > 0.7 && deviceFactor > 0.7) {
      reason = "Fast network + premium device: using level 8-9 (best compression)";
    } else if (networkFactor > 0.7) {
      reason = "Fast network: prioritizing compression ratio";
    } else if (deviceFactor < 0.3) {
      reason = "Constrained device: prioritizing speed";
    } else {
      reason = "Normal conditions: balanced compression level";
    }
    const recommendation = {
      recommendedLevel,
      reason,
      confidence: this.compressionHistory.length > 10 ? 0.9 : 0.5,
      estimatedCompressionMs,
      estimatedRatio,
      networkFactor,
      deviceFactor
    };
    logger7.debug("[AdaptiveCompressionOptimizer] Recommendation", recommendation);
    return recommendation;
  }
  calculateNetworkFactor() {
    if (!this.networkProfile.isOnline)
      return 0;
    const speedMbps = this.networkProfile.estimatedSpeedKbps / 1000;
    if (speedMbps < 0.1)
      return 0;
    if (speedMbps < 1)
      return 0.1 + speedMbps / 1 * 0.2;
    if (speedMbps < 5)
      return 0.3 + (speedMbps - 1) / 4 * 0.3;
    if (speedMbps < 20)
      return 0.6 + (speedMbps - 5) / 15 * 0.3;
    return Math.min(1, 0.9 + (speedMbps - 20) / 200);
  }
  calculateDeviceFactor() {
    let factor = 0.5;
    if (this.deviceProfile.isPremium) {
      factor = 0.8;
    } else if (this.deviceProfile.isConstrained) {
      factor = 0.2;
    }
    if (this.deviceProfile.cpuUtilization > 0.8) {
      factor *= 0.7;
    } else if (this.deviceProfile.cpuUtilization < 0.2) {
      factor *= 1.1;
    }
    if (this.deviceProfile.supportsWebAssembly) {
      factor = Math.min(1, factor + 0.1);
    }
    return Math.max(0, Math.min(1, factor));
  }
  estimateCompressionTime(level) {
    return Math.max(1, level * 2.5);
  }
  estimateCompressionRatio(level) {
    return 0.6 + level / 9 * 0.3;
  }
  applyRecommendation() {
    const recommendation = this.getRecommendedLevel();
    const oldLevel = this.currentLevel;
    const shouldChange = recommendation.confidence > 0.7 || Math.abs(recommendation.recommendedLevel - oldLevel) > 2;
    if (shouldChange) {
      this.currentLevel = recommendation.recommendedLevel;
      this.stats.levelsUsed.add(this.currentLevel);
      if (oldLevel !== this.currentLevel) {
        this.stats.adjustmentCount++;
        logger7.debug("[AdaptiveCompressionOptimizer] Level adjusted", {
          from: oldLevel,
          to: this.currentLevel,
          reason: recommendation.reason
        });
      }
    }
    this.stats.currentLevel = this.currentLevel;
    return this.currentLevel;
  }
  getCurrentLevel() {
    return this.currentLevel;
  }
  getStats() {
    return { ...this.stats };
  }
  getDetailedAnalysis() {
    return {
      stats: this.stats,
      network: this.networkProfile,
      device: this.deviceProfile,
      recommendation: this.getRecommendedLevel(),
      history: this.compressionHistory.slice(-20)
    };
  }
}, adaptiveOptimizerInstance = null, logger8, AgentPresenceManager, instances, AEON_CAPABILITIES, DEFAULT_CRYPTO_CONFIG, NullCryptoProvider = class {
  notConfiguredError() {
    return new Error("Crypto provider not configured");
  }
  async generateIdentity() {
    throw this.notConfiguredError();
  }
  getLocalDID() {
    return null;
  }
  async exportPublicIdentity() {
    return null;
  }
  async registerRemoteNode() {}
  async getRemotePublicKey() {
    return null;
  }
  async sign() {
    throw this.notConfiguredError();
  }
  async signData(_data) {
    throw this.notConfiguredError();
  }
  async verify() {
    return true;
  }
  async verifySignedData() {
    return true;
  }
  async encrypt() {
    throw this.notConfiguredError();
  }
  async decrypt() {
    throw this.notConfiguredError();
  }
  async getSessionKey() {
    throw this.notConfiguredError();
  }
  async encryptWithSessionKey() {
    throw this.notConfiguredError();
  }
  async decryptWithSessionKey() {
    throw this.notConfiguredError();
  }
  async createUCAN() {
    throw this.notConfiguredError();
  }
  async verifyUCAN() {
    return { authorized: true };
  }
  async delegateCapabilities() {
    throw this.notConfiguredError();
  }
  async hash() {
    throw this.notConfiguredError();
  }
  randomBytes(length) {
    return crypto.getRandomValues(new Uint8Array(length));
  }
  isInitialized() {
    return false;
  }
};
var init_dist = __esm(() => {
  init_eventemitter3();
  consoleLogger = {
    debug: (...args) => {
      console.debug("[AEON:DEBUG]", ...args);
    },
    info: (...args) => {
      console.info("[AEON:INFO]", ...args);
    },
    warn: (...args) => {
      console.warn("[AEON:WARN]", ...args);
    },
    error: (...args) => {
      console.error("[AEON:ERROR]", ...args);
    }
  };
  noopLogger = {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {}
  };
  currentLogger = consoleLogger;
  logger = {
    debug: (...args) => getLogger().debug(...args),
    info: (...args) => getLogger().info(...args),
    warn: (...args) => getLogger().warn(...args),
    error: (...args) => getLogger().error(...args)
  };
  SyncCoordinator = class extends import__.default {
    nodes = /* @__PURE__ */ new Map;
    sessions = /* @__PURE__ */ new Map;
    syncEvents = [];
    nodeHeartbeats = /* @__PURE__ */ new Map;
    heartbeatInterval = null;
    cryptoProvider = null;
    nodesByDID = /* @__PURE__ */ new Map;
    constructor() {
      super();
    }
    configureCrypto(provider) {
      this.cryptoProvider = provider;
      logger.debug("[SyncCoordinator] Crypto configured", {
        initialized: provider.isInitialized()
      });
    }
    isCryptoEnabled() {
      return this.cryptoProvider !== null && this.cryptoProvider.isInitialized();
    }
    async registerAuthenticatedNode(nodeInfo) {
      const node = {
        ...nodeInfo
      };
      this.nodes.set(node.id, node);
      this.nodeHeartbeats.set(node.id, Date.now());
      this.nodesByDID.set(nodeInfo.did, node.id);
      if (this.cryptoProvider) {
        await this.cryptoProvider.registerRemoteNode({
          id: node.id,
          did: nodeInfo.did,
          publicSigningKey: nodeInfo.publicSigningKey,
          publicEncryptionKey: nodeInfo.publicEncryptionKey
        });
      }
      const event = {
        type: "node-joined",
        nodeId: node.id,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        data: { did: nodeInfo.did, authenticated: true }
      };
      this.syncEvents.push(event);
      this.emit("node-joined", node);
      logger.debug("[SyncCoordinator] Authenticated node registered", {
        nodeId: node.id,
        did: nodeInfo.did,
        version: node.version
      });
      return node;
    }
    getNodeByDID(did) {
      const nodeId = this.nodesByDID.get(did);
      if (!nodeId)
        return;
      return this.nodes.get(nodeId);
    }
    getAuthenticatedNodes() {
      return Array.from(this.nodes.values()).filter((n) => n.did);
    }
    async createAuthenticatedSyncSession(initiatorDID, participantDIDs, options) {
      const initiatorNodeId = this.nodesByDID.get(initiatorDID);
      if (!initiatorNodeId) {
        throw new Error(`Initiator node with DID ${initiatorDID} not found`);
      }
      const participantIds = [];
      for (const did of participantDIDs) {
        const nodeId = this.nodesByDID.get(did);
        if (nodeId) {
          participantIds.push(nodeId);
        }
      }
      let sessionToken;
      if (this.cryptoProvider && this.cryptoProvider.isInitialized()) {
        const capabilities = (options?.requiredCapabilities || ["aeon:sync:read", "aeon:sync:write"]).map((cap) => ({ can: cap, with: "*" }));
        if (participantDIDs.length > 0) {
          sessionToken = await this.cryptoProvider.createUCAN(participantDIDs[0], capabilities, { expirationSeconds: 3600 });
        }
      }
      const session = {
        id: `sync-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        initiatorId: initiatorNodeId,
        participantIds,
        status: "pending",
        startTime: (/* @__PURE__ */ new Date()).toISOString(),
        itemsSynced: 0,
        itemsFailed: 0,
        conflictsDetected: 0,
        initiatorDID,
        participantDIDs,
        encryptionMode: options?.encryptionMode || "none",
        requiredCapabilities: options?.requiredCapabilities,
        sessionToken
      };
      this.sessions.set(session.id, session);
      const event = {
        type: "sync-started",
        sessionId: session.id,
        nodeId: initiatorNodeId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        data: {
          authenticated: true,
          initiatorDID,
          participantCount: participantDIDs.length,
          encryptionMode: session.encryptionMode
        }
      };
      this.syncEvents.push(event);
      this.emit("sync-started", session);
      logger.debug("[SyncCoordinator] Authenticated sync session created", {
        sessionId: session.id,
        initiatorDID,
        participants: participantDIDs.length,
        encryptionMode: session.encryptionMode
      });
      return session;
    }
    async verifyNodeCapabilities(sessionId, nodeDID, token) {
      if (!this.cryptoProvider) {
        return { authorized: true };
      }
      const session = this.sessions.get(sessionId);
      if (!session) {
        return { authorized: false, error: `Session ${sessionId} not found` };
      }
      const result = await this.cryptoProvider.verifyUCAN(token, {
        requiredCapabilities: session.requiredCapabilities?.map((cap) => ({
          can: cap,
          with: "*"
        }))
      });
      if (!result.authorized) {
        logger.warn("[SyncCoordinator] Node capability verification failed", {
          sessionId,
          nodeDID,
          error: result.error
        });
      }
      return result;
    }
    registerNode(node) {
      this.nodes.set(node.id, node);
      this.nodeHeartbeats.set(node.id, Date.now());
      const event = {
        type: "node-joined",
        nodeId: node.id,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.syncEvents.push(event);
      this.emit("node-joined", node);
      logger.debug("[SyncCoordinator] Node registered", {
        nodeId: node.id,
        address: node.address,
        version: node.version
      });
    }
    deregisterNode(nodeId) {
      const node = this.nodes.get(nodeId);
      if (!node) {
        throw new Error(`Node ${nodeId} not found`);
      }
      this.nodes.delete(nodeId);
      this.nodeHeartbeats.delete(nodeId);
      const event = {
        type: "node-left",
        nodeId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.syncEvents.push(event);
      this.emit("node-left", node);
      logger.debug("[SyncCoordinator] Node deregistered", { nodeId });
    }
    createSyncSession(initiatorId, participantIds) {
      const node = this.nodes.get(initiatorId);
      if (!node) {
        throw new Error(`Initiator node ${initiatorId} not found`);
      }
      const session = {
        id: `sync-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        initiatorId,
        participantIds,
        status: "pending",
        startTime: (/* @__PURE__ */ new Date()).toISOString(),
        itemsSynced: 0,
        itemsFailed: 0,
        conflictsDetected: 0
      };
      this.sessions.set(session.id, session);
      const event = {
        type: "sync-started",
        sessionId: session.id,
        nodeId: initiatorId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.syncEvents.push(event);
      this.emit("sync-started", session);
      logger.debug("[SyncCoordinator] Sync session created", {
        sessionId: session.id,
        initiator: initiatorId,
        participants: participantIds.length
      });
      return session;
    }
    updateSyncSession(sessionId, updates) {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }
      Object.assign(session, updates);
      if (updates.status === "completed" || updates.status === "failed") {
        session.endTime = (/* @__PURE__ */ new Date()).toISOString();
        const event = {
          type: "sync-completed",
          sessionId,
          nodeId: session.initiatorId,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          data: { status: updates.status, itemsSynced: session.itemsSynced }
        };
        this.syncEvents.push(event);
        this.emit("sync-completed", session);
      }
      logger.debug("[SyncCoordinator] Sync session updated", {
        sessionId,
        status: session.status,
        itemsSynced: session.itemsSynced
      });
    }
    recordConflict(sessionId, nodeId, conflictData) {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.conflictsDetected++;
        const event = {
          type: "conflict-detected",
          sessionId,
          nodeId,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          data: conflictData
        };
        this.syncEvents.push(event);
        this.emit("conflict-detected", { session, nodeId, conflictData });
        logger.debug("[SyncCoordinator] Conflict recorded", {
          sessionId,
          nodeId,
          totalConflicts: session.conflictsDetected
        });
      }
    }
    updateNodeStatus(nodeId, status) {
      const node = this.nodes.get(nodeId);
      if (!node) {
        throw new Error(`Node ${nodeId} not found`);
      }
      node.status = status;
      this.nodeHeartbeats.set(nodeId, Date.now());
      logger.debug("[SyncCoordinator] Node status updated", {
        nodeId,
        status
      });
    }
    recordHeartbeat(nodeId) {
      const node = this.nodes.get(nodeId);
      if (!node) {
        return;
      }
      node.lastHeartbeat = (/* @__PURE__ */ new Date()).toISOString();
      this.nodeHeartbeats.set(nodeId, Date.now());
    }
    getNodes() {
      return Array.from(this.nodes.values());
    }
    getNode(nodeId) {
      return this.nodes.get(nodeId);
    }
    getOnlineNodes() {
      return Array.from(this.nodes.values()).filter((n) => n.status === "online");
    }
    getNodesByCapability(capability) {
      return Array.from(this.nodes.values()).filter((n) => n.capabilities.includes(capability));
    }
    getSyncSession(sessionId) {
      return this.sessions.get(sessionId);
    }
    getAllSyncSessions() {
      return Array.from(this.sessions.values());
    }
    getActiveSyncSessions() {
      return Array.from(this.sessions.values()).filter((s) => s.status === "active");
    }
    getSessionsForNode(nodeId) {
      return Array.from(this.sessions.values()).filter((s) => s.initiatorId === nodeId || s.participantIds.includes(nodeId));
    }
    getStatistics() {
      const sessions = Array.from(this.sessions.values());
      const completed = sessions.filter((s) => s.status === "completed").length;
      const failed = sessions.filter((s) => s.status === "failed").length;
      const active = sessions.filter((s) => s.status === "active").length;
      const totalItemsSynced = sessions.reduce((sum, s) => sum + s.itemsSynced, 0);
      const totalConflicts = sessions.reduce((sum, s) => sum + s.conflictsDetected, 0);
      return {
        totalNodes: this.nodes.size,
        onlineNodes: this.getOnlineNodes().length,
        offlineNodes: this.nodes.size - this.getOnlineNodes().length,
        totalSessions: sessions.length,
        activeSessions: active,
        completedSessions: completed,
        failedSessions: failed,
        successRate: sessions.length > 0 ? completed / sessions.length * 100 : 0,
        totalItemsSynced,
        totalConflicts,
        averageConflictsPerSession: sessions.length > 0 ? totalConflicts / sessions.length : 0
      };
    }
    getSyncEvents(limit) {
      const events = [...this.syncEvents];
      if (limit) {
        return events.slice(-limit);
      }
      return events;
    }
    getSessionEvents(sessionId) {
      return this.syncEvents.filter((e) => e.sessionId === sessionId);
    }
    getNodeHealth() {
      const health = {};
      for (const [nodeId, lastHeartbeat] of this.nodeHeartbeats) {
        const now = Date.now();
        const downtime = now - lastHeartbeat;
        const isHealthy = downtime < 30000;
        health[nodeId] = {
          isHealthy,
          downtime
        };
      }
      return health;
    }
    startHeartbeatMonitoring(interval = 5000) {
      if (this.heartbeatInterval) {
        return;
      }
      this.heartbeatInterval = setInterval(() => {
        const health = this.getNodeHealth();
        for (const [nodeId, { isHealthy }] of Object.entries(health)) {
          const node = this.nodes.get(nodeId);
          if (!node) {
            continue;
          }
          const newStatus = isHealthy ? "online" : "offline";
          if (node.status !== newStatus) {
            this.updateNodeStatus(nodeId, newStatus);
          }
        }
      }, interval);
      logger.debug("[SyncCoordinator] Heartbeat monitoring started", { interval });
    }
    stopHeartbeatMonitoring() {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
        logger.debug("[SyncCoordinator] Heartbeat monitoring stopped");
      }
    }
    clear() {
      this.nodes.clear();
      this.sessions.clear();
      this.syncEvents = [];
      this.nodeHeartbeats.clear();
      this.nodesByDID.clear();
      this.cryptoProvider = null;
      this.stopHeartbeatMonitoring();
    }
    getCryptoProvider() {
      return this.cryptoProvider;
    }
  };
  logger2 = getLogger();
  OfflineOperationQueue = class extends import__.default {
    queue = /* @__PURE__ */ new Map;
    syncingIds = /* @__PURE__ */ new Set;
    maxQueueSize = 1000;
    defaultMaxRetries = 3;
    constructor(maxQueueSize = 1000, defaultMaxRetries = 3) {
      super();
      this.maxQueueSize = maxQueueSize;
      this.defaultMaxRetries = defaultMaxRetries;
      logger2.debug("[OfflineOperationQueue] Initialized", {
        maxQueueSize,
        defaultMaxRetries
      });
    }
    enqueue(type, data, sessionId, priority = "normal", maxRetries) {
      if (this.queue.size >= this.maxQueueSize) {
        const oldest = this.findOldestLowPriority();
        if (oldest) {
          this.queue.delete(oldest.id);
          logger2.warn("[OfflineOperationQueue] Queue full, removed oldest", {
            removedId: oldest.id
          });
        }
      }
      const operation = {
        id: `op-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type,
        data,
        sessionId,
        priority,
        createdAt: Date.now(),
        retryCount: 0,
        maxRetries: maxRetries ?? this.defaultMaxRetries,
        status: "pending"
      };
      this.queue.set(operation.id, operation);
      this.emit("operation-added", operation);
      logger2.debug("[OfflineOperationQueue] Operation enqueued", {
        id: operation.id,
        type,
        priority,
        queueSize: this.queue.size
      });
      return operation;
    }
    getNextBatch(batchSize = 10) {
      const pending = Array.from(this.queue.values()).filter((op) => op.status === "pending" && !this.syncingIds.has(op.id)).sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0)
          return priorityDiff;
        return a.createdAt - b.createdAt;
      });
      return pending.slice(0, batchSize);
    }
    markSyncing(operationIds) {
      for (const id of operationIds) {
        const op = this.queue.get(id);
        if (op) {
          op.status = "syncing";
          this.syncingIds.add(id);
        }
      }
    }
    markSynced(operationId) {
      const op = this.queue.get(operationId);
      if (op) {
        op.status = "synced";
        this.syncingIds.delete(operationId);
        this.emit("operation-synced", op);
        setTimeout(() => {
          this.queue.delete(operationId);
          if (this.getPendingCount() === 0) {
            this.emit("queue-empty");
          }
        }, 1000);
      }
    }
    markFailed(operationId, error) {
      const op = this.queue.get(operationId);
      if (op) {
        op.retryCount++;
        op.lastError = error.message;
        this.syncingIds.delete(operationId);
        if (op.retryCount >= op.maxRetries) {
          op.status = "failed";
          this.emit("operation-failed", op, error);
          logger2.error("[OfflineOperationQueue] Operation permanently failed", {
            id: operationId,
            retries: op.retryCount,
            error: error.message
          });
        } else {
          op.status = "pending";
          logger2.warn("[OfflineOperationQueue] Operation failed, will retry", {
            id: operationId,
            retryCount: op.retryCount,
            maxRetries: op.maxRetries
          });
        }
      }
    }
    getOperation(operationId) {
      return this.queue.get(operationId);
    }
    getPendingOperations() {
      return Array.from(this.queue.values()).filter((op) => op.status === "pending");
    }
    getPendingCount() {
      return Array.from(this.queue.values()).filter((op) => op.status === "pending").length;
    }
    getStats() {
      const operations = Array.from(this.queue.values());
      const pending = operations.filter((op) => op.status === "pending").length;
      const syncing = operations.filter((op) => op.status === "syncing").length;
      const failed = operations.filter((op) => op.status === "failed").length;
      const synced = operations.filter((op) => op.status === "synced").length;
      const pendingOps = operations.filter((op) => op.status === "pending");
      const oldestPendingMs = pendingOps.length > 0 ? Date.now() - Math.min(...pendingOps.map((op) => op.createdAt)) : 0;
      const averageRetries = operations.length > 0 ? operations.reduce((sum, op) => sum + op.retryCount, 0) / operations.length : 0;
      return {
        pending,
        syncing,
        failed,
        synced,
        totalOperations: operations.length,
        oldestPendingMs,
        averageRetries
      };
    }
    clear() {
      this.queue.clear();
      this.syncingIds.clear();
      logger2.debug("[OfflineOperationQueue] Queue cleared");
    }
    clearFailed() {
      for (const [id, op] of this.queue.entries()) {
        if (op.status === "failed") {
          this.queue.delete(id);
        }
      }
    }
    retryFailed() {
      for (const op of this.queue.values()) {
        if (op.status === "failed") {
          op.status = "pending";
          op.retryCount = 0;
        }
      }
    }
    findOldestLowPriority() {
      const lowPriority = Array.from(this.queue.values()).filter((op) => op.priority === "low" && op.status === "pending").sort((a, b) => a.createdAt - b.createdAt);
      return lowPriority[0] ?? null;
    }
    export() {
      return Array.from(this.queue.values());
    }
    import(operations) {
      for (const op of operations) {
        this.queue.set(op.id, op);
      }
      logger2.debug("[OfflineOperationQueue] Imported operations", {
        count: operations.length
      });
    }
  };
  logger3 = getLogger();
  logger4 = getLogger();
  logger5 = getLogger();
  logger6 = getLogger();
  logger7 = getLogger();
  logger8 = getLogger();
  AgentPresenceManager = class extends import__.default {
    presences = /* @__PURE__ */ new Map;
    sessionId;
    heartbeatInterval = null;
    heartbeatTimeout = 30000;
    inactivityThreshold = 60000;
    constructor(sessionId) {
      super();
      this.sessionId = sessionId;
      this.startHeartbeatCheck();
      logger8.debug("[AgentPresenceManager] Initialized", { sessionId });
    }
    updatePresence(agentId, presence) {
      const existing = this.presences.get(agentId);
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const updated = {
        ...existing,
        ...presence,
        agentId,
        joinedAt: existing?.joinedAt ?? now,
        lastSeen: now
      };
      this.presences.set(agentId, updated);
      this.emit("presence_updated", {
        agentId,
        presence: updated
      });
    }
    agentJoined(agentId, name, role = "user", metadata) {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const presence = {
        agentId,
        name,
        role,
        status: "online",
        joinedAt: now,
        lastSeen: now,
        metadata
      };
      this.presences.set(agentId, presence);
      this.emit("agent_joined", { agentId, presence });
      logger8.debug("[AgentPresenceManager] Agent joined", { agentId, name, role });
    }
    agentLeft(agentId) {
      const presence = this.presences.get(agentId);
      if (presence) {
        presence.status = "offline";
        presence.lastSeen = (/* @__PURE__ */ new Date()).toISOString();
        this.presences.set(agentId, presence);
        this.emit("agent_left", { agentId, presence });
        logger8.debug("[AgentPresenceManager] Agent left", { agentId });
      }
    }
    updateCursor(agentId, x, y, path) {
      const presence = this.presences.get(agentId);
      if (presence) {
        presence.cursorPosition = { x, y, path };
        presence.lastSeen = (/* @__PURE__ */ new Date()).toISOString();
        this.presences.set(agentId, presence);
        this.emit("cursor_updated", {
          agentId,
          cursorPosition: presence.cursorPosition
        });
      }
    }
    updateActiveSection(agentId, section) {
      const presence = this.presences.get(agentId);
      if (presence) {
        presence.activeSection = section;
        presence.lastSeen = (/* @__PURE__ */ new Date()).toISOString();
        this.presences.set(agentId, presence);
        this.emit("section_updated", {
          agentId,
          activeSection: section
        });
      }
    }
    updateStatus(agentId, status) {
      const presence = this.presences.get(agentId);
      if (presence) {
        presence.status = status;
        presence.lastSeen = (/* @__PURE__ */ new Date()).toISOString();
        this.presences.set(agentId, presence);
        this.emit("status_updated", { agentId, status });
      }
    }
    heartbeat(agentId) {
      const presence = this.presences.get(agentId);
      if (presence) {
        if (presence.status === "reconnecting") {
          presence.status = "online";
          this.emit("status_updated", { agentId, status: "online" });
        }
        presence.lastSeen = (/* @__PURE__ */ new Date()).toISOString();
        this.presences.set(agentId, presence);
      }
    }
    getPresence(agentId) {
      return this.presences.get(agentId);
    }
    getOnlineAgents() {
      return Array.from(this.presences.values()).filter((p) => p.status === "online");
    }
    getAllAgents() {
      return Array.from(this.presences.values());
    }
    getAllPresences() {
      return Array.from(this.presences.values());
    }
    getAgentCount() {
      const counts = {
        online: 0,
        away: 0,
        offline: 0,
        reconnecting: 0
      };
      this.presences.forEach((p) => {
        counts[p.status]++;
      });
      return counts;
    }
    getStats() {
      return {
        totalAgents: this.presences.size,
        onlineAgents: Array.from(this.presences.values()).filter((p) => p.status === "online").length,
        offlineAgents: Array.from(this.presences.values()).filter((p) => p.status === "offline").length,
        awayAgents: Array.from(this.presences.values()).filter((p) => p.status === "away").length,
        reconnectingAgents: Array.from(this.presences.values()).filter((p) => p.status === "reconnecting").length
      };
    }
    clearExpiredPresences(maxAgeMs) {
      const now = Date.now();
      const toRemove = [];
      this.presences.forEach((presence, agentId) => {
        const lastSeenTime = new Date(presence.lastSeen).getTime();
        const ageMs = now - lastSeenTime;
        if (ageMs > maxAgeMs && presence.status === "offline") {
          toRemove.push(agentId);
        }
      });
      toRemove.forEach((agentId) => {
        this.presences.delete(agentId);
      });
      if (toRemove.length > 0) {
        logger8.debug("[AgentPresenceManager] Cleared expired presences", {
          count: toRemove.length
        });
      }
    }
    getByRole(role) {
      return Array.from(this.presences.values()).filter((p) => p.role === role);
    }
    getInSection(section) {
      return Array.from(this.presences.values()).filter((p) => p.activeSection === section && p.status === "online");
    }
    getPresenceStats() {
      const stats = {
        total: this.presences.size,
        online: 0,
        away: 0,
        offline: 0,
        reconnecting: 0,
        byRole: {}
      };
      this.presences.forEach((p) => {
        stats[p.status]++;
        stats.byRole[p.role] = (stats.byRole[p.role] ?? 0) + 1;
      });
      return stats;
    }
    startHeartbeatCheck() {
      this.heartbeatInterval = setInterval(() => {
        const now = Date.now();
        this.presences.forEach((presence) => {
          const lastSeenTime = new Date(presence.lastSeen).getTime();
          const timeSinceLastSeen = now - lastSeenTime;
          if (timeSinceLastSeen > this.inactivityThreshold && presence.status === "online") {
            presence.status = "away";
            this.emit("status_updated", {
              agentId: presence.agentId,
              status: "away"
            });
          }
          if (timeSinceLastSeen > this.heartbeatTimeout && presence.status !== "offline") {
            presence.status = "reconnecting";
            this.emit("status_updated", {
              agentId: presence.agentId,
              status: "reconnecting"
            });
          }
        });
      }, 1e4);
    }
    stopHeartbeatMonitoring() {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
    }
    clear() {
      this.presences.clear();
    }
    destroy() {
      this.stopHeartbeatMonitoring();
      this.presences.clear();
      this.removeAllListeners();
      logger8.debug("[AgentPresenceManager] Destroyed", { sessionId: this.sessionId });
    }
  };
  instances = /* @__PURE__ */ new Map;
  AEON_CAPABILITIES = {
    SYNC_READ: "aeon:sync:read",
    SYNC_WRITE: "aeon:sync:write",
    SYNC_ADMIN: "aeon:sync:admin",
    NODE_REGISTER: "aeon:node:register",
    NODE_HEARTBEAT: "aeon:node:heartbeat",
    REPLICATE_READ: "aeon:replicate:read",
    REPLICATE_WRITE: "aeon:replicate:write",
    STATE_READ: "aeon:state:read",
    STATE_WRITE: "aeon:state:write",
    STATE_RECONCILE: "aeon:state:reconcile"
  };
  DEFAULT_CRYPTO_CONFIG = {
    defaultEncryptionMode: "none",
    requireSignatures: false,
    requireCapabilities: false,
    allowedSignatureAlgorithms: ["ES256", "Ed25519"],
    allowedEncryptionAlgorithms: ["ECIES-P256", "AES-256-GCM"],
    sessionKeyExpiration: 24 * 60 * 60 * 1000
  };
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
  defaultAccent: "#6366f1",
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
var ESIControl = {
  Structured: ESIStructured,
  If: ESIIf,
  Match: ESIMatch,
  Case: ESICase,
  Default: ESIDefault,
  Collaborative: ESICollaborative,
  Reflect: ESIReflect,
  Optimize: ESIOptimize,
  Auto: ESIAuto
};
// src/router.ts
import { readdir } from "fs/promises";
import { join, relative } from "path";

class AeonRouter {
  routes = [];
  routesDir;
  componentsDir;
  constructor(options) {
    this.routesDir = options.routesDir;
    this.componentsDir = options.componentsDir;
  }
  async scan() {
    this.routes = [];
    await this.scanDirectory(this.routesDir, "");
    this.sortRoutes();
  }
  async reload() {
    await this.scan();
  }
  match(path) {
    const pathSegments = path.replace(/^\/|\/$/g, "").split("/").filter(Boolean);
    for (const parsed of this.routes) {
      const params = this.matchSegments(parsed.segments, pathSegments);
      if (params !== null) {
        const sessionId = this.resolveSessionId(parsed.definition.sessionId, params);
        return {
          route: parsed.definition,
          params,
          sessionId,
          componentId: parsed.definition.componentId,
          isAeon: parsed.definition.isAeon
        };
      }
    }
    return null;
  }
  hasRoute(path) {
    return this.match(path) !== null;
  }
  getRoutes() {
    return this.routes.map((r) => r.definition);
  }
  addRoute(definition) {
    const segments = this.parsePattern(definition.pattern);
    this.routes.push({ pattern: definition.pattern, segments, definition });
    this.sortRoutes();
  }
  async scanDirectory(dir, prefix) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          const isRouteGroup = entry.name.startsWith("(") && entry.name.endsWith(")");
          const newPrefix = isRouteGroup ? prefix : `${prefix}/${entry.name}`;
          await this.scanDirectory(fullPath, newPrefix);
        } else if (entry.name === "page.tsx" || entry.name === "page.ts") {
          const route = await this.createRouteFromFile(fullPath, prefix);
          if (route) {
            this.routes.push(route);
          }
        }
      }
    } catch (error) {
      console.error(`[aeon] Error scanning directory ${dir}:`, error);
    }
  }
  async createRouteFromFile(filePath, prefix) {
    try {
      const file = Bun.file(filePath);
      const content = await file.text();
      const isAeon = content.includes("'use aeon'") || content.includes('"use aeon"');
      const pattern = prefix || "/";
      const segments = this.parsePattern(pattern);
      const sessionId = this.generateSessionId(pattern);
      const componentId = relative(this.routesDir, filePath).replace(/\.(tsx?|jsx?)$/, "").replace(/\//g, "-").replace(/page$/, "").replace(/-$/, "") || "index";
      const definition = {
        pattern,
        sessionId,
        componentId,
        isAeon
      };
      return { pattern, segments, definition };
    } catch (error) {
      console.error(`[aeon] Error reading file ${filePath}:`, error);
      return null;
    }
  }
  parsePattern(pattern) {
    return pattern.replace(/^\/|\/$/g, "").split("/").filter(Boolean).filter((s) => !(s.startsWith("(") && s.endsWith(")"))).map((s) => {
      if (s.startsWith("[[...") && s.endsWith("]]")) {
        return { type: "optionalCatchAll", name: s.slice(5, -2) };
      }
      if (s.startsWith("[...") && s.endsWith("]")) {
        return { type: "catchAll", name: s.slice(4, -1) };
      }
      if (s.startsWith("[") && s.endsWith("]")) {
        return { type: "dynamic", name: s.slice(1, -1) };
      }
      return { type: "static", value: s };
    });
  }
  matchSegments(routeSegments, pathSegments) {
    const params = {};
    let pathIdx = 0;
    for (const segment of routeSegments) {
      switch (segment.type) {
        case "static":
          if (pathIdx >= pathSegments.length || pathSegments[pathIdx] !== segment.value) {
            return null;
          }
          pathIdx++;
          break;
        case "dynamic":
          if (pathIdx >= pathSegments.length) {
            return null;
          }
          params[segment.name] = pathSegments[pathIdx];
          pathIdx++;
          break;
        case "catchAll":
          if (pathIdx >= pathSegments.length) {
            return null;
          }
          params[segment.name] = pathSegments.slice(pathIdx).join("/");
          pathIdx = pathSegments.length;
          break;
        case "optionalCatchAll":
          if (pathIdx < pathSegments.length) {
            params[segment.name] = pathSegments.slice(pathIdx).join("/");
            pathIdx = pathSegments.length;
          }
          break;
      }
    }
    return pathIdx === pathSegments.length ? params : null;
  }
  generateSessionId(pattern) {
    return pattern.replace(/^\/|\/$/g, "").replace(/\[\.\.\.(\w+)\]/g, "$$$1").replace(/\[\[\.\.\.(\w+)\]\]/g, "$$$1").replace(/\[(\w+)\]/g, "$$$1").replace(/\//g, "-") || "index";
  }
  resolveSessionId(template, params) {
    let result = template;
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(`$${key}`, value);
    }
    return result;
  }
  sortRoutes() {
    this.routes.sort((a, b) => {
      const scoreA = this.routeSpecificity(a.segments);
      const scoreB = this.routeSpecificity(b.segments);
      return scoreB - scoreA;
    });
  }
  routeSpecificity(segments) {
    let score = 0;
    for (let i = 0;i < segments.length; i++) {
      const positionWeight = 1000 - i;
      const segment = segments[i];
      switch (segment.type) {
        case "static":
          score += positionWeight * 10;
          break;
        case "dynamic":
          score += positionWeight * 5;
          break;
        case "catchAll":
          score += 1;
          break;
        case "optionalCatchAll":
          score += 0;
          break;
      }
    }
    return score;
  }
}

// src/registry.ts
class AeonRouteRegistry {
  routes = new Map;
  coordinator = null;
  reconciler = null;
  versions = null;
  syncMode;
  versioningEnabled;
  mutationCallbacks = [];
  connectedSockets = new Set;
  constructor(options) {
    this.syncMode = options.syncMode;
    this.versioningEnabled = options.versioningEnabled;
    this.initializeAeonModules();
  }
  async initializeAeonModules() {
    try {
      const aeon = await Promise.resolve().then(() => (init_dist(), exports_dist));
      if (this.syncMode === "distributed") {
        this.coordinator = new aeon.SyncCoordinator;
        this.reconciler = new aeon.StateReconciler;
        this.coordinator.on("sync-completed", (session) => {
          this.handleSyncCompleted(session);
        });
      }
      if (this.versioningEnabled) {
        this.versions = new aeon.SchemaVersionManager;
        this.versions.registerVersion("1.0.0", {
          description: "Initial route schema"
        });
      }
    } catch (error) {
      console.warn("[aeon-registry] Aeon modules not available, running in standalone mode");
    }
  }
  async addRoute(path, component, metadata) {
    const operation = {
      type: "route-add",
      path,
      component,
      metadata,
      timestamp: new Date().toISOString(),
      nodeId: this.coordinator?.getLocalNodeId() ?? "local"
    };
    if (this.syncMode === "distributed" && this.coordinator) {
      const participants = this.coordinator.getOnlineNodes().map((n) => n.id);
      if (participants.length > 0) {
        await this.coordinator.createSyncSession(this.coordinator.getLocalNodeId(), participants);
      }
    }
    const version = this.versioningEnabled && this.versions ? await this.versions.getCurrentVersion() : "1.0.0";
    this.routes.set(path, {
      path,
      component,
      metadata,
      version
    });
    this.notifyMutation(operation);
    await this.persistRoute(path, component);
  }
  async updateRoute(path, updates) {
    const existing = this.routes.get(path);
    if (!existing) {
      throw new Error(`Route not found: ${path}`);
    }
    const operation = {
      type: "route-update",
      path,
      component: updates.component,
      metadata: {
        ...existing.metadata,
        updatedAt: new Date().toISOString(),
        updatedBy: this.coordinator?.getLocalNodeId() ?? "local"
      },
      timestamp: new Date().toISOString(),
      nodeId: this.coordinator?.getLocalNodeId() ?? "local"
    };
    this.routes.set(path, {
      ...existing,
      ...updates,
      metadata: operation.metadata
    });
    this.notifyMutation(operation);
  }
  async removeRoute(path) {
    const operation = {
      type: "route-remove",
      path,
      timestamp: new Date().toISOString(),
      nodeId: this.coordinator?.getLocalNodeId() ?? "local"
    };
    this.routes.delete(path);
    this.notifyMutation(operation);
  }
  getRoute(path) {
    return this.routes.get(path);
  }
  getSessionId(path) {
    return path.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "index";
  }
  getAllRoutes() {
    return Array.from(this.routes.values());
  }
  subscribeToMutations(callback) {
    this.mutationCallbacks.push(callback);
    return () => {
      const idx = this.mutationCallbacks.indexOf(callback);
      if (idx >= 0) {
        this.mutationCallbacks.splice(idx, 1);
      }
    };
  }
  handleConnect(ws) {
    this.connectedSockets.add(ws);
  }
  handleDisconnect(ws) {
    this.connectedSockets.delete(ws);
  }
  handleSyncMessage(ws, message) {
    try {
      const data = typeof message === "string" ? JSON.parse(message) : message;
      if (data.type === "route-operation") {
        this.applyRemoteOperation(data.operation);
      }
    } catch (error) {
      console.error("[aeon-registry] Error handling sync message:", error);
    }
  }
  notifyMutation(operation) {
    for (const callback of this.mutationCallbacks) {
      try {
        callback(operation);
      } catch (error) {
        console.error("[aeon-registry] Error in mutation callback:", error);
      }
    }
    const message = JSON.stringify({ type: "route-operation", operation });
    for (const ws of this.connectedSockets) {
      try {
        ws.send?.(message);
      } catch {}
    }
  }
  handleSyncCompleted(session) {
    if (this.reconciler) {
      const result = this.reconciler.reconcile();
      if (result?.state) {
        const routes = result.state;
        for (const [path, route] of routes) {
          this.routes.set(path, route);
        }
      }
    }
  }
  applyRemoteOperation(operation) {
    switch (operation.type) {
      case "route-add":
        if (operation.component && operation.metadata) {
          this.routes.set(operation.path, {
            path: operation.path,
            component: operation.component,
            metadata: operation.metadata,
            version: "1.0.0"
          });
        }
        break;
      case "route-update":
        const existing = this.routes.get(operation.path);
        if (existing && operation.component) {
          this.routes.set(operation.path, {
            ...existing,
            component: operation.component,
            metadata: operation.metadata ?? existing.metadata
          });
        }
        break;
      case "route-remove":
        this.routes.delete(operation.path);
        break;
    }
    for (const callback of this.mutationCallbacks) {
      try {
        callback(operation);
      } catch (error) {
        console.error("[aeon-registry] Error in mutation callback:", error);
      }
    }
  }
  async persistRoute(path, component) {
    const filePath = path === "/" ? "page.tsx" : `${path.slice(1)}/page.tsx`;
    const content = `'use aeon';

export default function Page() {
  return <${component} />;
}
`;
    try {
      console.log(`[aeon-registry] Would persist route to: ${filePath}`);
    } catch (error) {
      console.error(`[aeon-registry] Error persisting route:`, error);
    }
  }
}

// src/server.ts
function createMinimalTree(match) {
  const nodes = new Map;
  const rootId = match?.componentId || "root";
  nodes.set(rootId, {
    id: rootId,
    type: "page",
    props: {},
    children: []
  });
  return {
    rootId,
    nodes,
    getNode: (id) => nodes.get(id),
    getChildren: () => [],
    getSchema: () => ({
      rootId,
      nodeCount: nodes.size,
      nodeTypes: ["page"],
      depth: 1
    }),
    clone: () => createMinimalTree(match)
  };
}
function createRouterAdapter(routerConfig) {
  if (!routerConfig) {
    return new HeuristicAdapter;
  }
  if (typeof routerConfig.adapter === "object") {
    return routerConfig.adapter;
  }
  switch (routerConfig.adapter) {
    case "heuristic":
    default:
      return new HeuristicAdapter;
  }
}
async function createAeonServer(options) {
  const { config, router: routerConfig, onRouteChange, onRouteDecision } = options;
  const router = new AeonRouter({
    routesDir: config.pagesDir,
    componentsDir: config.componentsDir
  });
  const registry = new AeonRouteRegistry({
    syncMode: config.aeon?.sync?.mode ?? "distributed",
    versioningEnabled: config.aeon?.versioning?.enabled ?? true
  });
  const personalizedRouter = createRouterAdapter(routerConfig);
  if (config.runtime === "bun" && true) {
    await watchFiles(config.pagesDir, async (path, type) => {
      console.log(`[aeon] File ${type}: ${path}`);
      await router.reload();
      onRouteChange?.(path, type === "create" ? "add" : type === "delete" ? "remove" : "update");
    });
  }
  registry.subscribeToMutations((operation) => {
    console.log(`[aeon] Collaborative route mutation:`, operation);
    router.reload();
    onRouteChange?.(operation.path, operation.type);
  });
  await router.scan();
  return Bun.serve({
    port: config.port ?? 3000,
    async fetch(req) {
      const url = new URL(req.url);
      const path = url.pathname;
      if (path.startsWith("/_aeon/")) {
        return handleStaticAsset(path, config);
      }
      if (path === "/_aeon/ws" && req.headers.get("upgrade") === "websocket") {
        return handleWebSocketUpgrade(req, registry);
      }
      const match = router.match(path);
      if (!match) {
        if (config.aeon?.dynamicRoutes !== false) {
          return handleDynamicCreation(path, req, registry);
        }
        return new Response("Not Found", { status: 404 });
      }
      const userContext = await extractUserContext(req);
      const tree = createMinimalTree(match);
      const decision = await personalizedRouter.route(path, userContext, tree);
      onRouteDecision?.(decision, userContext);
      let response = await renderRoute(match, req, config, decision);
      response = setContextCookies(response, userContext, path);
      response = addSpeculationHeaders(response, decision.prefetch || [], decision.prerender || []);
      return response;
    },
    websocket: {
      message(ws, message) {
        registry.handleSyncMessage(ws, message);
      },
      open(ws) {
        registry.handleConnect(ws);
      },
      close(ws) {
        registry.handleDisconnect(ws);
      }
    }
  });
}
async function watchFiles(dir, callback) {
  const { watch } = await import("fs");
  const { join: join2 } = await import("path");
  watch(dir, { recursive: true }, (eventType, filename) => {
    if (!filename)
      return;
    if (!filename.endsWith(".tsx") && !filename.endsWith(".ts"))
      return;
    const fullPath = join2(dir, filename);
    const type = eventType === "rename" ? "create" : "update";
    callback(fullPath, type);
  });
}
function handleStaticAsset(path, config) {
  const assetPath = path.replace("/_aeon/", "");
  const fullPath = `${config.output?.dir ?? ".aeon"}/${assetPath}`;
  try {
    const file = Bun.file(fullPath);
    return new Response(file);
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
function handleWebSocketUpgrade(req, _registry) {
  const server = Bun.serve.prototype;
  if ("upgrade" in server) {
    const success = server.upgrade(req);
    if (success) {
      return new Response(null, { status: 101 });
    }
  }
  return new Response("WebSocket upgrade failed", { status: 500 });
}
async function handleDynamicCreation(path, req, registry) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Not Found", { status: 404 });
  }
  await registry.addRoute(path, "DynamicPage", {
    createdAt: new Date().toISOString(),
    createdBy: "dynamic"
  });
  return new Response(JSON.stringify({
    message: "Route created",
    path,
    session: registry.getSessionId(path)
  }), {
    status: 201,
    headers: { "Content-Type": "application/json" }
  });
}
async function renderRoute(match, _req, config, decision) {
  if (!match) {
    return new Response("Not Found", { status: 404 });
  }
  if (match.isAeon) {
    const html2 = generateAeonPageHtml(match, config, decision);
    return new Response(html2, {
      headers: { "Content-Type": "text/html" }
    });
  }
  const html = generateStaticPageHtml(match, config, decision);
  return new Response(html, {
    headers: { "Content-Type": "text/html" }
  });
}
function generateSpeculationScript(decision) {
  if (!decision?.prefetch?.length && !decision?.prerender?.length) {
    return "";
  }
  const rules = {};
  if (decision.prerender?.length) {
    rules.prerender = [{ urls: decision.prerender }];
  }
  if (decision.prefetch?.length) {
    rules.prefetch = [{ urls: decision.prefetch }];
  }
  return `<script type="speculationrules">${JSON.stringify(rules)}</script>`;
}
function generatePersonalizationStyles(decision) {
  if (!decision)
    return "";
  const vars = [];
  if (decision.accent) {
    vars.push(`--aeon-accent: ${decision.accent}`);
  }
  if (decision.theme) {
    vars.push(`--aeon-theme: ${decision.theme}`);
  }
  if (decision.density) {
    const spacingMap = { compact: "0.5rem", normal: "1rem", comfortable: "1.5rem" };
    vars.push(`--aeon-spacing: ${spacingMap[decision.density]}`);
  }
  if (vars.length === 0)
    return "";
  return `<style>:root { ${vars.join("; ")} }</style>`;
}
function generateAeonPageHtml(match, config, decision) {
  const { sessionId, params, componentId } = match;
  const colorScheme = decision?.theme === "dark" ? "dark" : decision?.theme === "light" ? "light" : "";
  const colorSchemeAttr = colorScheme ? ` data-theme="${colorScheme}"` : "";
  return `<!DOCTYPE html>
<html lang="en"${colorSchemeAttr}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aeon Page</title>
  ${generatePersonalizationStyles(decision)}
  ${generateSpeculationScript(decision)}
  <script type="module">
    // Aeon hydration script
    import { hydrate, initAeonSync } from '/_aeon/runtime.js';

    const sessionId = '${sessionId}';
    const params = ${JSON.stringify(params)};
    const componentId = '${componentId}';
    const routeDecision = ${JSON.stringify(decision || {})};

    // Initialize Aeon sync
    const sync = await initAeonSync({
      sessionId,
      wsUrl: 'ws://' + window.location.host + '/_aeon/ws',
      presence: ${config.aeon?.presence?.enabled ?? true},
    });

    // Hydrate the page from session state
    const session = await sync.getSession(sessionId);
    hydrate(session.tree, document.getElementById('root'), {
      componentOrder: routeDecision.componentOrder,
      hiddenComponents: routeDecision.hiddenComponents,
      featureFlags: routeDecision.featureFlags,
    });

    // Subscribe to real-time updates
    sync.subscribe((update) => {
      hydrate(update.tree, document.getElementById('root'), {
        componentOrder: routeDecision.componentOrder,
        hiddenComponents: routeDecision.hiddenComponents,
        featureFlags: routeDecision.featureFlags,
      });
    });
  </script>
</head>
<body>
  <div id="root">
    <!-- Server-rendered content would go here -->
    <noscript>This page requires JavaScript for collaborative features.</noscript>
  </div>
</body>
</html>`;
}
function generateStaticPageHtml(match, _config, decision) {
  const colorScheme = decision?.theme === "dark" ? "dark" : decision?.theme === "light" ? "light" : "";
  const colorSchemeAttr = colorScheme ? ` data-theme="${colorScheme}"` : "";
  return `<!DOCTYPE html>
<html lang="en"${colorSchemeAttr}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Static Page</title>
  ${generatePersonalizationStyles(decision)}
  ${generateSpeculationScript(decision)}
</head>
<body>
  <div id="root">
    <!-- Render ${match.componentId} here -->
  </div>
</body>
</html>`;
}
// src/cache.ts
class NavigationCache {
  cache = new Map;
  accessOrder = [];
  hits = 0;
  misses = 0;
  maxSize;
  defaultTtl;
  onEvict;
  constructor(options = {}) {
    this.maxSize = options.maxSize ?? 1000;
    this.defaultTtl = options.defaultTtl ?? 5 * 60 * 1000;
    this.onEvict = options.onEvict;
  }
  get(sessionId) {
    const session = this.cache.get(sessionId);
    if (!session) {
      this.misses++;
      return null;
    }
    if (session.expiresAt && Date.now() > session.expiresAt) {
      this.cache.delete(sessionId);
      this.removeFromAccessOrder(sessionId);
      this.misses++;
      return null;
    }
    this.hits++;
    this.updateAccessOrder(sessionId);
    return session;
  }
  set(session, ttl) {
    const sessionId = session.sessionId;
    if (!this.cache.has(sessionId) && this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    const cached = {
      ...session,
      cachedAt: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : Date.now() + this.defaultTtl
    };
    this.cache.set(sessionId, cached);
    this.updateAccessOrder(sessionId);
  }
  has(sessionId) {
    const session = this.cache.get(sessionId);
    if (!session)
      return false;
    if (session.expiresAt && Date.now() > session.expiresAt) {
      this.cache.delete(sessionId);
      this.removeFromAccessOrder(sessionId);
      return false;
    }
    return true;
  }
  async prefetch(sessionId, fetcher) {
    const cached = this.get(sessionId);
    if (cached)
      return cached;
    const session = await fetcher();
    this.set(session);
    return session;
  }
  async prefetchMany(sessionIds, fetcher) {
    const promises = sessionIds.map(async (sessionId) => {
      const cached = this.get(sessionId);
      if (cached)
        return cached;
      const session = await fetcher(sessionId);
      this.set(session);
      return session;
    });
    return Promise.all(promises);
  }
  async preloadAll(manifest, fetcher, options = {}) {
    const total = manifest.length;
    let loaded = 0;
    const batchSize = 10;
    for (let i = 0;i < manifest.length; i += batchSize) {
      const batch = manifest.slice(i, i + batchSize);
      await Promise.all(batch.map(async ({ sessionId }) => {
        if (!this.has(sessionId)) {
          try {
            const session = await fetcher(sessionId);
            this.set(session, Infinity);
          } catch {}
        }
        loaded++;
        options.onProgress?.(loaded, total);
      }));
      await new Promise((r) => setTimeout(r, 10));
    }
  }
  invalidate(sessionId) {
    const session = this.cache.get(sessionId);
    if (session && this.onEvict) {
      this.onEvict(session);
    }
    this.cache.delete(sessionId);
    this.removeFromAccessOrder(sessionId);
  }
  clear() {
    if (this.onEvict) {
      for (const session of this.cache.values()) {
        this.onEvict(session);
      }
    }
    this.cache.clear();
    this.accessOrder = [];
    this.hits = 0;
    this.misses = 0;
  }
  getStats() {
    let totalBytes = 0;
    for (const session of this.cache.values()) {
      totalBytes += JSON.stringify(session).length;
    }
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      totalBytes,
      hitRate: total > 0 ? this.hits / total : 0,
      preloadedRoutes: this.cache.size
    };
  }
  keys() {
    return Array.from(this.cache.keys());
  }
  export() {
    return Array.from(this.cache.values());
  }
  import(sessions) {
    for (const session of sessions) {
      this.set(session);
    }
  }
  evictLRU() {
    if (this.accessOrder.length === 0)
      return;
    const lruId = this.accessOrder.shift();
    const session = this.cache.get(lruId);
    if (session && this.onEvict) {
      this.onEvict(session);
    }
    this.cache.delete(lruId);
  }
  updateAccessOrder(sessionId) {
    this.removeFromAccessOrder(sessionId);
    this.accessOrder.push(sessionId);
  }
  removeFromAccessOrder(sessionId) {
    const index = this.accessOrder.indexOf(sessionId);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
  }
}
var globalCache = null;
function getNavigationCache() {
  if (!globalCache) {
    globalCache = new NavigationCache;
  }
  return globalCache;
}
function setNavigationCache(cache) {
  globalCache = cache;
}

// src/navigation.ts
class AeonNavigationEngine {
  router;
  cache;
  state;
  navigationListeners = new Set;
  presenceListeners = new Set;
  presenceCache = new Map;
  navigationHistory = new Map;
  pendingPrefetches = new Map;
  observer = null;
  sessionFetcher;
  presenceFetcher;
  constructor(options = {}) {
    this.router = options.router ?? new AeonRouter({ routesDir: "./pages" });
    this.cache = options.cache ?? getNavigationCache();
    this.sessionFetcher = options.sessionFetcher;
    this.presenceFetcher = options.presenceFetcher;
    this.state = {
      current: options.initialRoute ?? "/",
      previous: null,
      history: [options.initialRoute ?? "/"],
      isNavigating: false
    };
  }
  async navigate(href, options = {}) {
    const { transition = "fade", replace = false } = options;
    const match = this.router.match(href);
    if (!match) {
      throw new Error(`Route not found: ${href}`);
    }
    const previousRoute = this.state.current;
    this.state.isNavigating = true;
    this.notifyListeners();
    try {
      const session = await this.getSession(match.sessionId);
      if (transition !== "none" && typeof document !== "undefined" && "startViewTransition" in document) {
        await document.startViewTransition(() => {
          this.updateDOM(session, match);
        }).finished;
      } else {
        this.updateDOM(session, match);
      }
      this.state.previous = previousRoute;
      this.state.current = href;
      if (!replace) {
        this.state.history.push(href);
      } else {
        this.state.history[this.state.history.length - 1] = href;
      }
      if (typeof window !== "undefined") {
        if (replace) {
          window.history.replaceState({ route: href }, "", href);
        } else {
          window.history.pushState({ route: href }, "", href);
        }
      }
      this.recordNavigation(previousRoute, href);
      const predictions = this.predict(href);
      for (const prediction of predictions.slice(0, 3)) {
        if (prediction.probability > 0.3) {
          this.prefetch(prediction.route);
        }
      }
    } finally {
      this.state.isNavigating = false;
      this.notifyListeners();
    }
  }
  async prefetch(href, options = {}) {
    const { data = true, presence = false, priority = "normal" } = options;
    const match = this.router.match(href);
    if (!match)
      return;
    const cacheKey = `${match.sessionId}:${data}:${presence}`;
    if (this.pendingPrefetches.has(cacheKey)) {
      return;
    }
    const prefetchPromise = (async () => {
      const promises = [];
      if (data && this.sessionFetcher) {
        promises.push(this.cache.prefetch(match.sessionId, () => this.sessionFetcher(match.sessionId)));
      }
      if (presence && this.presenceFetcher) {
        promises.push(this.prefetchPresence(href));
      }
      await Promise.all(promises);
      return this.cache.get(match.sessionId);
    })();
    this.pendingPrefetches.set(cacheKey, prefetchPromise);
    try {
      await prefetchPromise;
    } finally {
      this.pendingPrefetches.delete(cacheKey);
    }
  }
  async prefetchPresence(route) {
    if (!this.presenceFetcher)
      return null;
    try {
      const presence = await this.presenceFetcher(route);
      this.presenceCache.set(route, presence);
      this.notifyPresenceListeners(route, presence);
      return presence;
    } catch {
      return null;
    }
  }
  isPreloaded(href) {
    const match = this.router.match(href);
    if (!match)
      return false;
    return this.cache.has(match.sessionId);
  }
  getPresence(route) {
    return this.presenceCache.get(route) ?? null;
  }
  observeLinks(container) {
    if (typeof IntersectionObserver === "undefined") {
      return () => {};
    }
    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const link = entry.target;
          const href = link.getAttribute("href");
          if (href && href.startsWith("/")) {
            this.prefetch(href);
          }
        }
      }
    }, { rootMargin: "100px" });
    const links = container.querySelectorAll('a[href^="/"]');
    links.forEach((link) => this.observer.observe(link));
    return () => {
      this.observer?.disconnect();
      this.observer = null;
    };
  }
  predict(currentRoute) {
    const predictions = [];
    const fromHistory = this.navigationHistory.get(currentRoute);
    if (fromHistory) {
      const total = Array.from(fromHistory.values()).reduce((a, b) => a + b, 0);
      for (const [route, count] of fromHistory) {
        predictions.push({
          route,
          probability: count / total,
          reason: "history"
        });
      }
    }
    predictions.sort((a, b) => b.probability - a.probability);
    return predictions;
  }
  async back() {
    if (this.state.history.length <= 1)
      return;
    this.state.history.pop();
    const previousRoute = this.state.history[this.state.history.length - 1];
    await this.navigate(previousRoute, { replace: true });
  }
  getState() {
    return { ...this.state };
  }
  subscribe(listener) {
    this.navigationListeners.add(listener);
    return () => this.navigationListeners.delete(listener);
  }
  subscribePresence(listener) {
    this.presenceListeners.add(listener);
    return () => this.presenceListeners.delete(listener);
  }
  async preloadAll(onProgress) {
    if (!this.sessionFetcher) {
      throw new Error("sessionFetcher required for preloadAll");
    }
    const routes = this.router.getRoutes();
    const manifest = routes.map((r) => ({
      sessionId: this.router.match(r.pattern)?.sessionId ?? r.pattern,
      route: r.pattern
    }));
    await this.cache.preloadAll(manifest, this.sessionFetcher, { onProgress });
  }
  getCacheStats() {
    return this.cache.getStats();
  }
  async getSession(sessionId) {
    const cached = this.cache.get(sessionId);
    if (cached)
      return cached;
    if (!this.sessionFetcher) {
      throw new Error("Session not cached and no fetcher provided");
    }
    const session = await this.sessionFetcher(sessionId);
    this.cache.set(session);
    return session;
  }
  updateDOM(session, match) {
    if (typeof document !== "undefined") {
      const event = new CustomEvent("aeon:navigate", {
        detail: { session, match }
      });
      document.dispatchEvent(event);
    }
  }
  recordNavigation(from, to) {
    if (!this.navigationHistory.has(from)) {
      this.navigationHistory.set(from, new Map);
    }
    const fromMap = this.navigationHistory.get(from);
    fromMap.set(to, (fromMap.get(to) ?? 0) + 1);
  }
  notifyListeners() {
    for (const listener of this.navigationListeners) {
      listener(this.getState());
    }
  }
  notifyPresenceListeners(route, presence) {
    for (const listener of this.presenceListeners) {
      listener(route, presence);
    }
  }
}
var globalNavigator = null;
function getNavigator() {
  if (!globalNavigator) {
    globalNavigator = new AeonNavigationEngine;
  }
  return globalNavigator;
}
function setNavigator(navigator) {
  globalNavigator = navigator;
}
if (typeof window !== "undefined") {
  window.addEventListener("popstate", (event) => {
    const navigator = getNavigator();
    const route = event.state?.route ?? window.location.pathname;
    navigator.navigate(route, { replace: true });
  });
}
// src/predictor.ts
var DEFAULT_CONFIG2 = {
  historyWeight: 0.5,
  communityWeight: 0.3,
  timeWeight: 0.2,
  decayFactor: 0.95,
  minProbability: 0.1,
  maxPredictions: 5
};

class NavigationPredictor {
  config;
  history = [];
  transitionMatrix = new Map;
  communityPatterns = new Map;
  timePatterns = new Map;
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG2, ...config };
  }
  record(record) {
    this.history.push(record);
    if (!this.transitionMatrix.has(record.from)) {
      this.transitionMatrix.set(record.from, new Map);
    }
    const fromMap = this.transitionMatrix.get(record.from);
    fromMap.set(record.to, (fromMap.get(record.to) ?? 0) + 1);
    const hour = new Date(record.timestamp).getHours();
    if (!this.timePatterns.has(record.to)) {
      this.timePatterns.set(record.to, new Map);
    }
    const hourMap = this.timePatterns.get(record.to);
    hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1);
    this.applyDecay();
  }
  predict(currentRoute) {
    const predictions = new Map;
    const historyPredictions = this.predictFromHistory(currentRoute);
    for (const pred of historyPredictions) {
      this.mergePrediction(predictions, pred, this.config.historyWeight);
    }
    const communityPredictions = this.predictFromCommunity(currentRoute);
    for (const pred of communityPredictions) {
      this.mergePrediction(predictions, pred, this.config.communityWeight);
    }
    const timePredictions = this.predictFromTime();
    for (const pred of timePredictions) {
      this.mergePrediction(predictions, pred, this.config.timeWeight);
    }
    return Array.from(predictions.values()).filter((p) => p.probability >= this.config.minProbability).sort((a, b) => b.probability - a.probability).slice(0, this.config.maxPredictions);
  }
  predictFromHistory(currentRoute) {
    const fromMap = this.transitionMatrix.get(currentRoute);
    if (!fromMap)
      return [];
    const total = Array.from(fromMap.values()).reduce((a, b) => a + b, 0);
    if (total === 0)
      return [];
    return Array.from(fromMap.entries()).map(([route, count]) => ({
      route,
      probability: count / total,
      reason: "history",
      confidence: Math.min(1, total / 10)
    }));
  }
  predictFromCommunity(currentRoute) {
    const pattern = this.communityPatterns.get(currentRoute);
    if (!pattern || pattern.nextRoutes.length === 0)
      return [];
    const total = pattern.nextRoutes.reduce((a, b) => a + b.count, 0);
    if (total === 0)
      return [];
    return pattern.nextRoutes.map(({ route, count }) => ({
      route,
      probability: count / total,
      reason: "community",
      confidence: Math.min(1, pattern.popularity / 100)
    }));
  }
  predictFromTime() {
    const currentHour = new Date().getHours();
    const predictions = [];
    let maxCount = 0;
    for (const [route, hourMap] of this.timePatterns) {
      const count = hourMap.get(currentHour) ?? 0;
      if (count > maxCount)
        maxCount = count;
    }
    if (maxCount === 0)
      return [];
    for (const [route, hourMap] of this.timePatterns) {
      const count = hourMap.get(currentHour) ?? 0;
      if (count > 0) {
        predictions.push({
          route,
          probability: count / maxCount,
          reason: "time",
          confidence: Math.min(1, count / 5)
        });
      }
    }
    return predictions;
  }
  mergePrediction(predictions, prediction, weight) {
    const existing = predictions.get(prediction.route);
    if (existing) {
      const totalWeight = (existing.confidence ?? 1) + (prediction.confidence ?? 1) * weight;
      existing.probability = (existing.probability * (existing.confidence ?? 1) + prediction.probability * (prediction.confidence ?? 1) * weight) / totalWeight;
      existing.confidence = Math.max(existing.confidence, prediction.confidence);
      if (prediction.confidence > (existing.confidence ?? 0)) {
        existing.reason = prediction.reason;
      }
    } else {
      predictions.set(prediction.route, {
        ...prediction,
        probability: prediction.probability * weight
      });
    }
  }
  applyDecay() {
    for (const [from, toMap] of this.transitionMatrix) {
      for (const [to, count] of toMap) {
        const decayed = count * this.config.decayFactor;
        if (decayed < 0.1) {
          toMap.delete(to);
        } else {
          toMap.set(to, decayed);
        }
      }
      if (toMap.size === 0) {
        this.transitionMatrix.delete(from);
      }
    }
    const maxHistory = 1000;
    if (this.history.length > maxHistory) {
      this.history = this.history.slice(-maxHistory);
    }
  }
  updateCommunityPatterns(patterns) {
    this.communityPatterns = patterns;
  }
  getTransitionMatrix() {
    return this.transitionMatrix;
  }
  importTransitionMatrix(matrix) {
    for (const [from, toMap] of matrix) {
      if (!this.transitionMatrix.has(from)) {
        this.transitionMatrix.set(from, new Map);
      }
      const existingMap = this.transitionMatrix.get(from);
      for (const [to, count] of toMap) {
        existingMap.set(to, (existingMap.get(to) ?? 0) + count);
      }
    }
  }
  getStats() {
    let transitionPairs = 0;
    for (const toMap of this.transitionMatrix.values()) {
      transitionPairs += toMap.size;
    }
    return {
      totalRecords: this.history.length,
      uniqueRoutes: this.transitionMatrix.size,
      transitionPairs,
      communityPatterns: this.communityPatterns.size
    };
  }
  clear() {
    this.history = [];
    this.transitionMatrix.clear();
    this.communityPatterns.clear();
    this.timePatterns.clear();
  }
  export() {
    return {
      history: this.history,
      transitionMatrix: Array.from(this.transitionMatrix.entries()).map(([from, toMap]) => [from, Array.from(toMap.entries())]),
      timePatterns: Array.from(this.timePatterns.entries()).map(([route, hourMap]) => [route, Array.from(hourMap.entries())])
    };
  }
  import(data) {
    if (data.history) {
      this.history = data.history;
    }
    if (data.transitionMatrix) {
      this.transitionMatrix = new Map(data.transitionMatrix.map(([from, toEntries]) => [
        from,
        new Map(toEntries)
      ]));
    }
    if (data.timePatterns) {
      this.timePatterns = new Map(data.timePatterns.map(([route, hourEntries]) => [
        route,
        new Map(hourEntries)
      ]));
    }
  }
}
var globalPredictor = null;
function getPredictor() {
  if (!globalPredictor) {
    globalPredictor = new NavigationPredictor;
  }
  return globalPredictor;
}
function setPredictor(predictor) {
  globalPredictor = predictor;
}
// src/storage.ts
class FileStorageAdapter {
  name = "file";
  pagesDir;
  dataDir;
  constructor(options) {
    this.pagesDir = options.pagesDir;
    this.dataDir = options.dataDir ?? ".aeon/data";
  }
  async init() {
    const fs = await import("fs/promises");
    await fs.mkdir(this.dataDir, { recursive: true });
  }
  async getRoute(path) {
    try {
      const fs = await import("fs/promises");
      const filePath = `${this.dataDir}/routes/${this.pathToKey(path)}.json`;
      const content = await fs.readFile(filePath, "utf-8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
  async getAllRoutes() {
    try {
      const fs = await import("fs/promises");
      const routesDir = `${this.dataDir}/routes`;
      const files = await fs.readdir(routesDir);
      const routes = [];
      for (const file of files) {
        if (file.endsWith(".json")) {
          const content = await fs.readFile(`${routesDir}/${file}`, "utf-8");
          routes.push(JSON.parse(content));
        }
      }
      return routes;
    } catch {
      return [];
    }
  }
  async saveRoute(route) {
    const fs = await import("fs/promises");
    const routesDir = `${this.dataDir}/routes`;
    await fs.mkdir(routesDir, { recursive: true });
    const filePath = `${routesDir}/${this.pathToKey(route.pattern)}.json`;
    await fs.writeFile(filePath, JSON.stringify(route, null, 2));
  }
  async deleteRoute(path) {
    const fs = await import("fs/promises");
    const filePath = `${this.dataDir}/routes/${this.pathToKey(path)}.json`;
    await fs.unlink(filePath).catch(() => {});
  }
  async getSession(sessionId) {
    try {
      const fs = await import("fs/promises");
      const filePath = `${this.dataDir}/sessions/${sessionId}.json`;
      const content = await fs.readFile(filePath, "utf-8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
  async saveSession(session) {
    const fs = await import("fs/promises");
    const sessionsDir = `${this.dataDir}/sessions`;
    await fs.mkdir(sessionsDir, { recursive: true });
    const filePath = `${sessionsDir}/${this.pathToKey(session.route)}.json`;
    await fs.writeFile(filePath, JSON.stringify(session, null, 2));
  }
  async getTree(sessionId) {
    const session = await this.getSession(sessionId);
    return session?.tree ?? null;
  }
  async saveTree(sessionId, tree) {
    const session = await this.getSession(sessionId);
    if (session) {
      session.tree = tree;
      await this.saveSession(session);
    }
  }
  pathToKey(path) {
    return path.replace(/\//g, "_").replace(/^_/, "") || "index";
  }
}

class D1StorageAdapter {
  name = "d1";
  db;
  constructor(db) {
    this.db = db;
  }
  async init() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS routes (
        path TEXT PRIMARY KEY,
        pattern TEXT NOT NULL,
        session_id TEXT NOT NULL,
        component_id TEXT NOT NULL,
        layout TEXT,
        is_aeon INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        route TEXT NOT NULL,
        tree TEXT NOT NULL,
        data TEXT DEFAULT '{}',
        schema_version TEXT DEFAULT '1.0.0',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS presence (
        session_id TEXT,
        user_id TEXT,
        role TEXT DEFAULT 'user',
        cursor_x INTEGER,
        cursor_y INTEGER,
        editing TEXT,
        status TEXT DEFAULT 'online',
        last_activity TEXT DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (session_id, user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_routes_pattern ON routes(pattern);
      CREATE INDEX IF NOT EXISTS idx_sessions_route ON sessions(route);
    `);
  }
  async getRoute(path) {
    const result = await this.db.prepare("SELECT * FROM routes WHERE path = ?").bind(path).first();
    if (!result)
      return null;
    return {
      pattern: result.pattern,
      sessionId: result.session_id,
      componentId: result.component_id,
      layout: result.layout,
      isAeon: Boolean(result.is_aeon)
    };
  }
  async getAllRoutes() {
    const results = await this.db.prepare("SELECT * FROM routes ORDER BY pattern").all();
    return results.results.map((row) => ({
      pattern: row.pattern,
      sessionId: row.session_id,
      componentId: row.component_id,
      layout: row.layout,
      isAeon: Boolean(row.is_aeon)
    }));
  }
  async saveRoute(route) {
    await this.db.prepare(`
        INSERT OR REPLACE INTO routes (path, pattern, session_id, component_id, layout, is_aeon, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(route.pattern, route.pattern, route.sessionId, route.componentId, route.layout ?? null, route.isAeon ? 1 : 0).run();
  }
  async deleteRoute(path) {
    await this.db.prepare("DELETE FROM routes WHERE path = ?").bind(path).run();
  }
  async getSession(sessionId) {
    const result = await this.db.prepare("SELECT * FROM sessions WHERE session_id = ?").bind(sessionId).first();
    if (!result)
      return null;
    const presenceResults = await this.db.prepare("SELECT * FROM presence WHERE session_id = ?").bind(sessionId).all();
    return {
      route: result.route,
      tree: JSON.parse(result.tree),
      data: JSON.parse(result.data),
      schema: { version: result.schema_version },
      presence: presenceResults.results.map((p) => ({
        userId: p.user_id,
        role: p.role,
        cursor: p.cursor_x !== null ? { x: p.cursor_x, y: p.cursor_y } : undefined,
        editing: p.editing,
        status: p.status,
        lastActivity: p.last_activity
      }))
    };
  }
  async saveSession(session) {
    await this.db.prepare(`
        INSERT OR REPLACE INTO sessions (session_id, route, tree, data, schema_version, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(this.routeToSessionId(session.route), session.route, JSON.stringify(session.tree), JSON.stringify(session.data), session.schema.version).run();
  }
  async getTree(sessionId) {
    const result = await this.db.prepare("SELECT tree FROM sessions WHERE session_id = ?").bind(sessionId).first();
    if (!result)
      return null;
    return JSON.parse(result.tree);
  }
  async saveTree(sessionId, tree) {
    await this.db.prepare(`
        UPDATE sessions SET tree = ?, updated_at = CURRENT_TIMESTAMP
        WHERE session_id = ?
      `).bind(JSON.stringify(tree), sessionId).run();
  }
  routeToSessionId(route) {
    return route.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "index";
  }
}

class DurableObjectStorageAdapter {
  name = "durable-object";
  namespace;
  routeCache = new Map;
  constructor(namespace) {
    this.namespace = namespace;
  }
  async init() {}
  async getRoute(path) {
    if (this.routeCache.has(path)) {
      return this.routeCache.get(path);
    }
    const routesId = this.namespace.idFromName("__routes__");
    const routesStub = this.namespace.get(routesId);
    const response = await routesStub.fetch(new Request("http://internal/route", {
      method: "POST",
      body: JSON.stringify({ action: "get", path }),
      headers: { "Content-Type": "application/json" }
    }));
    if (!response.ok)
      return null;
    const route = await response.json();
    if (route) {
      this.routeCache.set(path, route);
    }
    return route;
  }
  async getAllRoutes() {
    const routesId = this.namespace.idFromName("__routes__");
    const routesStub = this.namespace.get(routesId);
    const response = await routesStub.fetch(new Request("http://internal/routes", {
      method: "GET"
    }));
    if (!response.ok)
      return [];
    return response.json();
  }
  async saveRoute(route) {
    const routesId = this.namespace.idFromName("__routes__");
    const routesStub = this.namespace.get(routesId);
    await routesStub.fetch(new Request("http://internal/route", {
      method: "PUT",
      body: JSON.stringify(route),
      headers: { "Content-Type": "application/json" }
    }));
    this.routeCache.set(route.pattern, route);
  }
  async deleteRoute(path) {
    const routesId = this.namespace.idFromName("__routes__");
    const routesStub = this.namespace.get(routesId);
    await routesStub.fetch(new Request("http://internal/route", {
      method: "DELETE",
      body: JSON.stringify({ path }),
      headers: { "Content-Type": "application/json" }
    }));
    this.routeCache.delete(path);
  }
  async getSession(sessionId) {
    const doId = this.namespace.idFromName(sessionId);
    const stub = this.namespace.get(doId);
    const response = await stub.fetch(new Request("http://internal/session", {
      method: "GET"
    }));
    if (!response.ok)
      return null;
    return response.json();
  }
  async saveSession(session) {
    const sessionId = this.routeToSessionId(session.route);
    const doId = this.namespace.idFromName(sessionId);
    const stub = this.namespace.get(doId);
    await stub.fetch(new Request("http://internal/session", {
      method: "PUT",
      body: JSON.stringify(session),
      headers: { "Content-Type": "application/json" }
    }));
  }
  async getTree(sessionId) {
    const doId = this.namespace.idFromName(sessionId);
    const stub = this.namespace.get(doId);
    const response = await stub.fetch(new Request("http://internal/tree", {
      method: "GET"
    }));
    if (!response.ok)
      return null;
    return response.json();
  }
  async saveTree(sessionId, tree) {
    const doId = this.namespace.idFromName(sessionId);
    const stub = this.namespace.get(doId);
    await stub.fetch(new Request("http://internal/tree", {
      method: "PUT",
      body: JSON.stringify(tree),
      headers: { "Content-Type": "application/json" }
    }));
  }
  getSessionStub(sessionId) {
    const doId = this.namespace.idFromName(sessionId);
    return this.namespace.get(doId);
  }
  routeToSessionId(route) {
    return route.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "index";
  }
}
var propagate = (promise) => {
  promise.catch(() => {});
};

class HybridStorageAdapter {
  name = "hybrid";
  do;
  d1;
  constructor(options) {
    this.do = new DurableObjectStorageAdapter(options.namespace);
    this.d1 = new D1StorageAdapter(options.db);
  }
  async init() {
    await Promise.all([this.do.init(), this.d1.init()]);
  }
  async getRoute(path) {
    const route = await this.do.getRoute(path);
    if (route)
      return route;
    return this.d1.getRoute(path);
  }
  async getAllRoutes() {
    return this.d1.getAllRoutes();
  }
  async saveRoute(route) {
    await this.do.saveRoute(route);
    propagate(this.d1.saveRoute(route));
  }
  async deleteRoute(path) {
    await this.do.deleteRoute(path);
    propagate(this.d1.deleteRoute(path));
  }
  async getSession(sessionId) {
    return this.do.getSession(sessionId);
  }
  async saveSession(session) {
    await this.do.saveSession(session);
    propagate(this.d1.saveSession(session));
  }
  async getTree(sessionId) {
    return this.do.getTree(sessionId);
  }
  async saveTree(sessionId, tree) {
    await this.do.saveTree(sessionId, tree);
    propagate(this.d1.saveTree(sessionId, tree));
  }
  async getHistoricalSession(sessionId) {
    return this.d1.getSession(sessionId);
  }
  getSessionStub(sessionId) {
    return this.do.getSessionStub(sessionId);
  }
}

class DashStorageAdapter {
  name = "dash";
  client;
  collections;
  subscriptions = [];
  constructor(client, options) {
    this.client = client;
    this.collections = {
      routes: options?.routesCollection ?? "aeon-routes",
      sessions: options?.sessionsCollection ?? "aeon-sessions",
      presence: options?.presenceCollection ?? "aeon-presence"
    };
  }
  async init() {
    if (!this.client.isConnected()) {
      await this.client.connect();
    }
  }
  async getRoute(path) {
    const route = await this.client.get(this.collections.routes, this.pathToId(path));
    return route;
  }
  async getAllRoutes() {
    const routes = await this.client.query(this.collections.routes, { orderBy: { field: "pattern", direction: "asc" } });
    return routes;
  }
  async saveRoute(route) {
    await this.client.set(this.collections.routes, this.pathToId(route.pattern), route);
  }
  async deleteRoute(path) {
    await this.client.delete(this.collections.routes, this.pathToId(path));
  }
  async getSession(sessionId) {
    const session = await this.client.get(this.collections.sessions, sessionId);
    if (!session)
      return null;
    const presence = await this.client.query(this.collections.presence, {
      where: [{ field: "sessionId", op: "==", value: sessionId }]
    });
    return {
      ...session,
      presence: presence.map((p) => ({
        userId: p.userId,
        role: p.role,
        cursor: p.cursor,
        editing: p.editing,
        status: p.status,
        lastActivity: p.lastActivity
      }))
    };
  }
  async saveSession(session) {
    const sessionId = this.routeToSessionId(session.route);
    const { presence: _, ...sessionData } = session;
    await this.client.set(this.collections.sessions, sessionId, sessionData);
  }
  async getTree(sessionId) {
    const session = await this.getSession(sessionId);
    return session?.tree ?? null;
  }
  async saveTree(sessionId, tree) {
    const session = await this.getSession(sessionId);
    if (session) {
      await this.client.set(this.collections.sessions, sessionId, {
        ...session,
        tree
      });
    }
  }
  subscribeToRoutes(callback) {
    const sub = this.client.subscribe(this.collections.routes, undefined, callback);
    this.subscriptions.push(sub);
    return sub;
  }
  subscribeToSession(sessionId, callback) {
    const sub = this.client.subscribe(this.collections.sessions, { where: [{ field: "id", op: "==", value: sessionId }] }, callback);
    this.subscriptions.push(sub);
    return sub;
  }
  subscribeToPresence(sessionId, callback) {
    const sub = this.client.subscribe(this.collections.presence, { where: [{ field: "sessionId", op: "==", value: sessionId }] }, callback);
    this.subscriptions.push(sub);
    return sub;
  }
  async updatePresence(sessionId, userId, presence) {
    await this.client.set(this.collections.presence, `${sessionId}:${userId}`, {
      sessionId,
      userId,
      ...presence,
      lastActivity: new Date().toISOString()
    });
  }
  destroy() {
    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
    this.subscriptions = [];
  }
  pathToId(path) {
    return path.replace(/\//g, "_").replace(/^_/, "") || "index";
  }
  routeToSessionId(route) {
    return route.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "index";
  }
}
function createStorageAdapter(config) {
  switch (config.type) {
    case "d1":
      if (!config.d1) {
        throw new Error("D1 database required for d1 storage adapter");
      }
      return new D1StorageAdapter(config.d1);
    case "durable-object":
      if (!config.durableObjectNamespace) {
        throw new Error("Durable Object namespace required for durable-object storage adapter");
      }
      return new DurableObjectStorageAdapter(config.durableObjectNamespace);
    case "hybrid":
      if (!config.durableObjectNamespace || !config.d1) {
        throw new Error("Both Durable Object namespace and D1 database required for hybrid storage adapter");
      }
      return new HybridStorageAdapter({
        namespace: config.durableObjectNamespace,
        db: config.d1
      });
    case "dash":
      if (!config.dash) {
        throw new Error("Dash client required for dash storage adapter");
      }
      return new DashStorageAdapter(config.dash, {
        routesCollection: config.dashCollections?.routes,
        sessionsCollection: config.dashCollections?.sessions,
        presenceCollection: config.dashCollections?.presence
      });
    case "custom":
      if (!config.custom) {
        throw new Error("Custom adapter required for custom storage");
      }
      return config.custom;
    case "file":
    default:
      return new FileStorageAdapter({
        pagesDir: config.pagesDir ?? "./pages",
        dataDir: config.dataDir ?? ".aeon/data"
      });
  }
}
// src/tree-compiler.ts
function compileTreeToTSX(tree, options) {
  const { route, useAeon = true, imports = {}, format = true } = options;
  const usedComponents = new Set;
  collectComponents(tree, usedComponents);
  const importLines = [];
  importLines.push("import type { FC } from 'react';");
  for (const component of usedComponents) {
    if (imports[component]) {
      importLines.push(`import { ${component} } from '${imports[component]}';`);
    } else if (!isHTMLElement(component)) {
      importLines.push(`import { ${component} } from '@/components/${component}';`);
    }
  }
  const componentName = routeToComponentName(route);
  const jsx = nodeToJSX(tree, 2);
  const lines = [];
  if (useAeon) {
    lines.push("'use aeon';");
    lines.push("");
  }
  lines.push("/**");
  lines.push(` * ${componentName}`);
  lines.push(` * Route: ${route}`);
  lines.push(" * ");
  lines.push(" * @generated by aeon-flux visual editor");
  lines.push(" */");
  lines.push("");
  lines.push(...importLines);
  lines.push("");
  lines.push(`const ${componentName}: FC = () => {`);
  lines.push("  return (");
  lines.push(jsx);
  lines.push("  );");
  lines.push("};");
  lines.push("");
  lines.push(`export default ${componentName};`);
  lines.push("");
  return lines.join(`
`);
}
function collectComponents(node, set) {
  if (Array.isArray(node)) {
    node.forEach((n) => collectComponents(n, set));
    return;
  }
  if (node.type && !isHTMLElement(node.type)) {
    set.add(node.type);
  }
  if (node.children) {
    if (Array.isArray(node.children)) {
      node.children.forEach((child) => {
        if (typeof child === "object") {
          collectComponents(child, set);
        }
      });
    }
  }
}
function nodeToJSX(node, indent = 0) {
  const spaces = "  ".repeat(indent);
  if (Array.isArray(node)) {
    if (node.length === 0)
      return `${spaces}{null}`;
    if (node.length === 1)
      return nodeToJSX(node[0], indent);
    return `${spaces}<>
${node.map((n) => nodeToJSX(n, indent + 1)).join(`
`)}
${spaces}</>`;
  }
  const { type, props = {}, children, text } = node;
  if (type === "text" || text) {
    const content = text || props.content || props.text || "";
    return `${spaces}${escapeJSX(String(content))}`;
  }
  const tagName = isHTMLElement(type) ? type.toLowerCase() : type;
  const propsStr = propsToString(props);
  if (!children || Array.isArray(children) && children.length === 0) {
    return `${spaces}<${tagName}${propsStr} />`;
  }
  const childrenJSX = Array.isArray(children) ? children.map((child) => {
    if (typeof child === "string") {
      return `${spaces}  ${escapeJSX(child)}`;
    }
    return nodeToJSX(child, indent + 1);
  }).join(`
`) : `${spaces}  ${escapeJSX(String(children))}`;
  return `${spaces}<${tagName}${propsStr}>
${childrenJSX}
${spaces}</${tagName}>`;
}
function propsToString(props) {
  const entries = Object.entries(props).filter(([key]) => !["children", "id", "text", "content"].includes(key));
  if (entries.length === 0)
    return "";
  const propsArr = entries.map(([key, value]) => {
    if (typeof value === "string") {
      return `${key}="${escapeAttr(value)}"`;
    }
    if (typeof value === "boolean") {
      return value ? key : `${key}={false}`;
    }
    if (typeof value === "number") {
      return `${key}={${value}}`;
    }
    if (value === null || value === undefined) {
      return null;
    }
    return `${key}={${JSON.stringify(value)}}`;
  }).filter(Boolean);
  return propsArr.length > 0 ? " " + propsArr.join(" ") : "";
}
function routeToComponentName(route) {
  if (route === "/" || route === "")
    return "IndexPage";
  const parts = route.replace(/^\/|\/$/g, "").split("/").map((part) => {
    if (part.startsWith("[") && part.endsWith("]")) {
      return "Dynamic" + capitalize(part.slice(1, -1));
    }
    return capitalize(part);
  });
  return parts.join("") + "Page";
}
function isHTMLElement(type) {
  const htmlElements = [
    "div",
    "span",
    "p",
    "a",
    "button",
    "input",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "nav",
    "header",
    "footer",
    "main",
    "section",
    "article",
    "aside",
    "img",
    "video",
    "audio",
    "canvas",
    "svg",
    "table",
    "thead",
    "tbody",
    "tr",
    "td",
    "th",
    "label",
    "select",
    "option",
    "textarea",
    "strong",
    "em",
    "code",
    "pre",
    "blockquote"
  ];
  return htmlElements.includes(type.toLowerCase());
}
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function escapeJSX(str) {
  return str.replace(/\{/g, "&#123;").replace(/\}/g, "&#125;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(str) {
  return str.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// src/durable-object.ts
class AeonPageSession {
  state;
  env;
  sessions = new Map;
  session = null;
  webhooks = [];
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.state.blockConcurrencyWhile(async () => {
      this.webhooks = await this.state.storage.get("webhooks") || [];
    });
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocket(request);
    }
    switch (url.pathname) {
      case "/session":
        return this.handleSessionRequest(request);
      case "/tree":
        return this.handleTreeRequest(request);
      case "/presence":
        return this.handlePresenceRequest(request);
      case "/webhook":
        return this.handleWebhookEndpoint(request);
      case "/webhooks":
        return this.handleWebhooksConfig(request);
      case "/version":
        return this.handleVersionRequest(request);
      default:
        return new Response("Not found", { status: 404 });
    }
  }
  async handleWebSocket(request) {
    const pair = new WebSocketPair;
    const [client, server] = Object.values(pair);
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId") || crypto.randomUUID();
    const role = url.searchParams.get("role") || "user";
    server.accept();
    const presence = {
      userId,
      role,
      status: "online",
      lastActivity: new Date().toISOString()
    };
    this.sessions.set(server, presence);
    const session = await this.getSession();
    if (session) {
      server.send(JSON.stringify({
        type: "init",
        payload: {
          session,
          presence: Array.from(this.sessions.values())
        }
      }));
    }
    this.broadcast({
      type: "presence",
      payload: {
        action: "join",
        user: presence
      }
    }, server);
    server.addEventListener("message", async (event) => {
      try {
        const message = JSON.parse(event.data);
        await this.handleMessage(server, message);
      } catch (err) {
        console.error("Failed to handle message:", err);
      }
    });
    server.addEventListener("close", () => {
      const user = this.sessions.get(server);
      this.sessions.delete(server);
      if (user) {
        this.broadcast({
          type: "presence",
          payload: {
            action: "leave",
            userId: user.userId
          }
        });
      }
    });
    return new Response(null, { status: 101, webSocket: client });
  }
  async handleMessage(ws, message) {
    const user = this.sessions.get(ws);
    if (!user)
      return;
    user.lastActivity = new Date().toISOString();
    switch (message.type) {
      case "cursor": {
        const payload = message.payload;
        user.cursor = { x: payload.x, y: payload.y };
        this.broadcast({
          type: "cursor",
          payload: {
            userId: user.userId,
            cursor: user.cursor
          }
        }, ws);
        break;
      }
      case "edit": {
        const payload = message.payload;
        await this.applyEdit(payload, user.userId);
        this.broadcast({
          type: "edit",
          payload: {
            ...payload,
            userId: user.userId
          }
        }, ws);
        break;
      }
      case "presence": {
        const payload = message.payload;
        user.status = payload.status;
        user.editing = payload.editing;
        this.broadcast({
          type: "presence",
          payload: {
            action: "update",
            user
          }
        }, ws);
        break;
      }
      case "ping": {
        ws.send(JSON.stringify({ type: "pong", payload: { timestamp: Date.now() } }));
        break;
      }
      case "publish": {
        const session = await this.getSession();
        if (session) {
          const prNumber = await this.createTreePR(session);
          const autoMerged = this.env.GITHUB_AUTO_MERGE === "true";
          ws.send(JSON.stringify({ type: "publish", payload: { status: "created", route: session.route, prNumber, autoMerged } }));
          this.broadcast({ type: "publish", payload: { status: "created", userId: user.userId, route: session.route, prNumber, autoMerged } }, ws);
          await this.fireWebhook("session.published", session, prNumber, user.userId);
        }
        break;
      }
      case "merge": {
        const payload = message.payload;
        if (payload.prNumber) {
          const merged = await this.mergePR(payload.prNumber);
          ws.send(JSON.stringify({ type: "merge", payload: { status: merged ? "merged" : "failed", prNumber: payload.prNumber } }));
          if (merged) {
            this.broadcast({ type: "merge", payload: { status: "merged", userId: user.userId, prNumber: payload.prNumber } }, ws);
            const session = await this.getSession();
            if (session) {
              await this.fireWebhook("session.merged", session, payload.prNumber, user.userId);
            }
          }
        }
        break;
      }
    }
  }
  broadcast(message, exclude) {
    const data = JSON.stringify(message);
    for (const [ws] of this.sessions) {
      if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  }
  async applyEdit(edit, userId) {
    const session = await this.getSession();
    if (!session)
      return;
    const parts = edit.path.split(".");
    let current = session.tree;
    for (let i = 0;i < parts.length - 1; i++) {
      const part = parts[i];
      if (typeof current === "object" && current !== null) {
        current = current[part];
      }
    }
    if (typeof current === "object" && current !== null) {
      const lastPart = parts[parts.length - 1];
      current[lastPart] = edit.value;
    }
    await this.saveSession(session, userId);
    if (this.env.DB) {
      this.state.waitUntil(this.propagateToD1(session));
    }
  }
  async propagateToD1(session) {
    if (!this.env.DB)
      return;
    try {
      await this.env.DB.prepare(`
          INSERT OR REPLACE INTO sessions (session_id, route, tree, data, schema_version, updated_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(this.state.id.toString(), session.route, JSON.stringify(session.tree), JSON.stringify(session.data), session.schema.version).run();
    } catch (err) {
      console.error("Failed to propagate to D1:", err);
    }
  }
  async createTreePR(session) {
    if (!this.env.GITHUB_TOKEN || !this.env.GITHUB_REPO)
      return;
    const [owner, repo] = this.env.GITHUB_REPO.split("/");
    const branch = `tree/${session.route.replace(/\//g, "-") || "index"}-${Date.now()}`;
    const basePath = this.env.GITHUB_TREE_PATH || "pages";
    const routePath = session.route === "/" ? "/index" : session.route;
    const path = `${basePath}${routePath}/page.tsx`;
    const tsx = compileTreeToTSX(session.tree, {
      route: session.route,
      useAeon: true
    });
    const content = btoa(tsx);
    try {
      const headers = { Authorization: `token ${this.env.GITHUB_TOKEN}`, "User-Agent": "aeon-flux" };
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      const repoData = await repoRes.json();
      const baseBranch = this.env.GITHUB_BASE_BRANCH || repoData.default_branch;
      const devBranch = this.env.GITHUB_DEV_BRANCH || baseBranch;
      const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${devBranch}`, { headers });
      const refData = await refRes.json();
      await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: refData.object.sha })
      });
      await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Update tree: ${session.route}`, content, branch })
      });
      const prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `\uD83C\uDF33 Tree update: ${session.route}`,
          head: branch,
          base: baseBranch,
          body: `Automated PR from aeon-flux collaborative editing.

**Route:** \`${session.route}\`
**Session:** \`${this.state.id.toString()}\`
**From:** \`${devBranch}\` \u2192 \`${baseBranch}\``
        })
      });
      const prData = await prRes.json();
      if (this.env.GITHUB_AUTO_MERGE === "true" && prData.number) {
        await this.mergePR(prData.number);
      }
      return prData.number;
    } catch (err) {
      console.error("Failed to create PR:", err);
      return;
    }
  }
  async mergePR(prNumber) {
    if (!this.env.GITHUB_TOKEN || !this.env.GITHUB_REPO)
      return false;
    const [owner, repo] = this.env.GITHUB_REPO.split("/");
    const headers = { Authorization: `token ${this.env.GITHUB_TOKEN}`, "User-Agent": "aeon-flux" };
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/merge`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          commit_title: `\uD83C\uDF33 Merge tree update #${prNumber}`,
          merge_method: "squash"
        })
      });
      return res.ok;
    } catch (err) {
      console.error("Failed to merge PR:", err);
      return false;
    }
  }
  async handleWebhookEndpoint(request) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }
    if (this.env.GITHUB_WEBHOOK_SECRET) {
      const signature = request.headers.get("X-Hub-Signature-256");
      if (!signature) {
        return new Response("Missing signature", { status: 401 });
      }
      const body = await request.text();
      const isValid = await this.verifyGitHubSignature(body, signature);
      if (!isValid) {
        return new Response("Invalid signature", { status: 401 });
      }
      const payload2 = JSON.parse(body);
      return this.processGitHubWebhook(payload2, request.headers.get("X-GitHub-Event") || "push");
    }
    const payload = await request.json();
    return this.processGitHubWebhook(payload, request.headers.get("X-GitHub-Event") || "push");
  }
  async verifyGitHubSignature(body, signature) {
    if (!this.env.GITHUB_WEBHOOK_SECRET)
      return false;
    const encoder = new TextEncoder;
    const key = await crypto.subtle.importKey("raw", encoder.encode(this.env.GITHUB_WEBHOOK_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const computed = "sha256=" + Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
    return signature === computed;
  }
  async processGitHubWebhook(payload, event) {
    if (event !== "push") {
      return Response.json({ status: "ignored", event });
    }
    const treePath = this.env.GITHUB_TREE_PATH || "pages";
    const affectedFiles = [
      ...payload.commits?.flatMap((c) => c.modified || []) || [],
      ...payload.commits?.flatMap((c) => c.added || []) || []
    ];
    const relevantFiles = affectedFiles.filter((f) => f.startsWith(treePath));
    if (relevantFiles.length === 0) {
      return Response.json({ status: "ignored", reason: "no relevant files" });
    }
    const session = await this.getSession();
    if (session) {
      await this.fireWebhook("github.push", session, undefined, "github");
    }
    this.broadcast({
      type: "sync",
      payload: {
        action: "github-push",
        files: relevantFiles,
        timestamp: new Date().toISOString()
      }
    });
    return Response.json({ status: "processed", files: relevantFiles });
  }
  async handleWebhooksConfig(request) {
    switch (request.method) {
      case "GET": {
        const safeWebhooks = this.webhooks.map((w) => ({
          url: w.url,
          events: w.events,
          hasSecret: !!w.secret
        }));
        return Response.json(safeWebhooks);
      }
      case "POST": {
        const config = await request.json();
        if (!config.url || !config.events || config.events.length === 0) {
          return new Response("Invalid webhook config", { status: 400 });
        }
        this.webhooks.push(config);
        await this.state.storage.put("webhooks", this.webhooks);
        return Response.json({ status: "registered", url: config.url });
      }
      case "DELETE": {
        const { url } = await request.json();
        this.webhooks = this.webhooks.filter((w) => w.url !== url);
        await this.state.storage.put("webhooks", this.webhooks);
        return Response.json({ status: "removed", url });
      }
      default:
        return new Response("Method not allowed", { status: 405 });
    }
  }
  async handleVersionRequest(request) {
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }
    const session = await this.getSession();
    if (!session) {
      return new Response("Not found", { status: 404 });
    }
    return Response.json({
      version: session.version || 0,
      updatedAt: session.updatedAt,
      updatedBy: session.updatedBy,
      schemaVersion: session.schema.version
    });
  }
  async fireWebhook(event, session, prNumber, triggeredBy) {
    const payload = {
      event,
      sessionId: this.state.id.toString(),
      route: session.route,
      version: session.version || 0,
      timestamp: new Date().toISOString(),
      prNumber,
      triggeredBy
    };
    const eventType = event.split(".")[1];
    const relevantWebhooks = this.webhooks.filter((w) => w.events.includes("all") || w.events.includes(eventType));
    const webhookPromises = relevantWebhooks.map(async (webhook) => {
      try {
        const headers = {
          "Content-Type": "application/json",
          "X-Aeon-Event": event,
          "X-Aeon-Session": this.state.id.toString()
        };
        if (webhook.secret) {
          const body = JSON.stringify(payload);
          const encoder = new TextEncoder;
          const key = await crypto.subtle.importKey("raw", encoder.encode(webhook.secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
          const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
          headers["X-Aeon-Signature"] = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
        }
        await fetch(webhook.url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error(`Failed to fire webhook to ${webhook.url}:`, err);
      }
    });
    if (this.env.SYNC_WEBHOOK_URL) {
      webhookPromises.push(fetch(this.env.SYNC_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Aeon-Event": event,
          "X-Aeon-Session": this.state.id.toString()
        },
        body: JSON.stringify(payload)
      }).then(() => {}).catch((err) => console.error("Failed to fire sync webhook:", err)));
    }
    this.state.waitUntil(Promise.all(webhookPromises));
  }
  async handleSessionRequest(request) {
    switch (request.method) {
      case "GET": {
        const session = await this.getSession();
        if (!session) {
          return new Response("Not found", { status: 404 });
        }
        return Response.json(session);
      }
      case "PUT": {
        const session = await request.json();
        await this.saveSession(session);
        return new Response("OK", { status: 200 });
      }
      default:
        return new Response("Method not allowed", { status: 405 });
    }
  }
  async handleTreeRequest(request) {
    switch (request.method) {
      case "GET": {
        const tree = await this.state.storage.get("tree");
        if (!tree) {
          return new Response("Not found", { status: 404 });
        }
        return Response.json(tree);
      }
      case "PUT": {
        const tree = await request.json();
        await this.state.storage.put("tree", tree);
        return new Response("OK", { status: 200 });
      }
      default:
        return new Response("Method not allowed", { status: 405 });
    }
  }
  async handlePresenceRequest(_request) {
    return Response.json(Array.from(this.sessions.values()));
  }
  async getSession() {
    if (this.session)
      return this.session;
    const stored = await this.state.storage.get("session");
    if (stored) {
      this.session = stored;
    }
    return this.session;
  }
  async saveSession(session, triggeredBy, fireWebhooks = true) {
    session.version = (session.version || 0) + 1;
    session.updatedAt = new Date().toISOString();
    if (triggeredBy) {
      session.updatedBy = triggeredBy;
    }
    this.session = session;
    await this.state.storage.put("session", session);
    if (fireWebhooks) {
      await this.fireWebhook("session.updated", session, undefined, triggeredBy);
    }
  }
}

class AeonRoutesRegistry {
  state;
  env;
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  async fetch(request) {
    const url = new URL(request.url);
    switch (url.pathname) {
      case "/route":
        return this.handleRouteRequest(request);
      case "/routes":
        return this.handleRoutesRequest(request);
      default:
        return new Response("Not found", { status: 404 });
    }
  }
  async handleRouteRequest(request) {
    switch (request.method) {
      case "POST": {
        const { path } = await request.json();
        const route = await this.state.storage.get(`route:${path}`);
        if (!route) {
          return new Response("Not found", { status: 404 });
        }
        return Response.json(route);
      }
      case "PUT": {
        const route = await request.json();
        await this.state.storage.put(`route:${route.pattern}`, route);
        return new Response("OK", { status: 200 });
      }
      case "DELETE": {
        const { path } = await request.json();
        await this.state.storage.delete(`route:${path}`);
        return new Response("OK", { status: 200 });
      }
      default:
        return new Response("Method not allowed", { status: 405 });
    }
  }
  async handleRoutesRequest(request) {
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }
    const routes = await this.state.storage.list({ prefix: "route:" });
    return Response.json(Array.from(routes.values()));
  }
}

// src/index.ts
var VERSION = "0.1.0";
export {
  setPredictor,
  setNavigator,
  setNavigationCache,
  setContextCookies,
  getPredictor,
  getNavigator,
  getNavigationCache,
  extractUserContext,
  esiWithContext,
  esiVision,
  esiInfer,
  esiEmotion,
  esiEmbed,
  createStorageAdapter,
  createContextMiddleware,
  createAeonServer,
  addSpeculationHeaders,
  VERSION,
  NavigationPredictor,
  NavigationCache,
  HybridStorageAdapter,
  HeuristicAdapter,
  FileStorageAdapter,
  EdgeWorkersESIProcessor,
  DurableObjectStorageAdapter,
  DashStorageAdapter,
  DEFAULT_ROUTER_CONFIG,
  DEFAULT_ESI_CONFIG,
  D1StorageAdapter,
  AeonRoutesRegistry,
  AeonRouter,
  AeonRouteRegistry,
  AeonPageSession,
  AeonNavigationEngine
};
