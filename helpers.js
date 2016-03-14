window.EMBER_REMOTE_APP = null;

function __seleniumApplicationInitializer(container, application) {
	Ember.setupForTesting();
	Ember.Test.adapter = Ember.Test.Adapter.create()
	application.constructor.proto().injectTestHelpers.call(application);
	window.EMBER_REMOTE_APP = application;
	window.dispatchEvent(new Event("EMBER-REMOTE-ENABLED", {
		detail: application
	}));
}

function emberRemote() {
	return new Ember.RSVP.Promise(function(resolve) {
		if (window.EMBER_REMOTE_APP) {
			resolve(window.EMBER_REMOTE_APP);
		}
		else {
			window.addEventListener('EMBER-REMOTE-ENABLED', function(event) {
				resolve(event.detail);
			});
		}
	}).then(function() {
		return wait();
	});
}


function __seleniumLog() {
  typeof console !== 'undefined' && console.log.apply(console, arguments);
}

function __seleniumToEmberTestHelper() {
  var args = new Array(arguments.length);
  var helperName = arguments[0];
  var callback = arguments[arguments.length - 1];
  for (var i = 1; i < arguments.length - 1; i++) {
	  args[i - 1] = arguments[i];
  }

  if (typeof helperName !== 'string') {
    throw new TypeError('first argument to a seleniumTestHelper should be a string');
  }

  if (typeof callback !== 'function') {
	  throw new TypeError('last argument to a seleniumTestHelper should be the selenium execAsyncScript completion callback');
  }

  __seleniumLog('waiting to issue command:' , helperName);
  return emberRemote().then(function() {
	  var helperFn = self[helperName];

	  if (typeof helperFn !== 'function') {
		  throw new TypeError('`' + helperName + '` was not found on global');
	  }

	  var selector = args[0];
	  var element;

	  if (typeof selector === 'string') {
		element = jQuery(selector);
	  } else {
		element = selector;
	  }

	  if (!(element instanceof HTMLElement)) {
		throw new TypeError('no element for: `' + selector + '` found');
	  }

	  return new Ember.RSVP.Promise(function(resolve) {
		  __seleniumLog(helperName, args);
		  resolve(helperFn.apply(self, args));
	  }).then(function(value) {
		  __seleniumLog('succes', helperName, args);
		  callback({
			  status: 'success',
			  payload: value
		  });
	  }).catch(function(reason) {
		  __seleniumLog('failure', helperName, args, reason);
		  callback({
			  status: 'failure',
			  payload: reason
		  });
	  });
  });
}

function __registerSeleniumHelper(helperName, _processArgs) {
	var processArgs = typeof _processArgs === 'function' ? _processArgs : function() { return arguments; };

	self['__selenium' + Ember.String.capitalize(helperName)] = function() {
		var args = new Array(arguments.length + 1);
		args[0] = helperName;
		for (var i = 0; i < arguments.length; i++) {
			args[i + 1] = arguments[i];
		}
		return __seleniumToEmberTestHelper.apply(null, processArgs.apply(null, args));
	};
}

  /**
    Loads a route, sets up any controllers, and renders any templates associated
    with the route as though a real user had triggered the route change while
    using your app.

  Example:

  ```javascript
  __seleniumVisit('posts/index', function(response) {
    // click operation has completed (success or failure)
    // success: response === { status: 'success', payload: theResult };
    // failure: response === { status: 'failure', payload: reason };
  });
  ```

  @method __seleniumVisit
  @param {String} url the name of the route
  @param {Function} callback the selenium executeSyncScript completion callback
  */
__registerSeleniumHelper('visit');

  /**
    Clicks an element and triggers any actions triggered by the element's `click`
    event.

Example:

```javascript
  __seleniumClick('.some-jQuery-selector', function(response) {
    //  clickoperation has completed (success or failure)
    // success: response === { status: 'success', payload: theResult };
    // failure: response === { status: 'failure', payload: reason };
  });
  ```

  @method __seleniumClick
  @param {String|HTMLElement|XPath} selector for an element in the dom
  @param {Function} callback the selenium executeSyncScript completion callback
  */
__registerSeleniumHelper('click', function(helperName, selector, callback) {
  return [
	  helperName,
	  __seleniumIsXPath(selector) ? __seleniumXPath(selector) : selector,
	  callback
  ];
});

  /**
  Simulates a key event, e.g. `keypress`, `keydown`, `keyup` with the desired keyCode

  Example:

  ```javascript
  __seleniumKeyEvent('.some-jQuery-selector', 'keypress', 13, function(response) {
    // keyEvent operation has completed (success or failure)
    // success: response === { status: 'success', payload: theResult };
    // failure: response === { status: 'failure', payload: reason };
  });
  ```

  @method __seleniumKeyEvent
  @param {String|HTMLElement|XPath} selector for an element in the dom
  @param {String} type the type of key event, e.g. `keypress`, `keydown`, `keyup`
  @param {Number} keyCode the keyCode of the simulated key event
  @param {Function} callback the selenium executeSyncScript completion callback
  */
__registerSeleniumHelper('keyEvent', function(helperName, selector, type, keyCode, callback) {
  return [
	  helperName,
	  __seleniumIsXPath(selector) ? __seleniumXPath(selector) : selector,
	  type,
	  keyCode,
	  callback
  ];
});

  /**
  Fills in an input element with some text.

  Example:

  ```javascript
  __seleniumFillIn('#email', 'you@example.com', function(response) {
    // fillIn operation has completed (success or failure)
    // success: response === { status: 'success', payload: theResult };
    // failure: response === { status: 'failure', payload: reason };
  });
  ```

  @method __seleniumFillIn
  @param {String|HTMLElement|XPath} selector for an element in the dom
  @param {String} text text to place inside the input element
  @param {Function} callback the selenium executeSyncScript completion callback
  */
__registerSeleniumHelper('fillIn', function(helperName, selector, text, callback) {
  return [
	  helperName,
	  __seleniumIsXPath(selector) ? __seleniumXPath(selector) : selector,
	  text,
	  callback
  ];
});

  /**
  Causes the run loop to process any pending events. This is used to ensure that
  any async operations from other helpers (or your assertions) have been processed.

  This is most often used as the return value for the helper functions (see 'click',
  'fillIn','visit',etc).

  Example:

  ```javascript
  __seleniumWait(function(response) {
    // wait operation has completed (success or failure)
    // success: response === { status: 'success', payload: undefined };
    // failure: response === { status: 'failure', payload: reason };
  });
  ```

  @method wait
  @param {Object} value The value to be returned.
  @param {Function} callback the selenium executeSyncScript completion callback
   */
__registerSeleniumHelper('wait');

  /**
  Triggers the given DOM event on the element identified by the provided selector.

  Example:

  ```javascript
  __seleniumTriggerEvent('#some-elem-id', 'blur', function(response) {
    // triggerEvent operation has completed (success or failure)
    // success: response === { status: 'success', payload: undefined };
    // failure: response === { status: 'failure', payload: reason };
  });
  ```

  This is actually used internally by the `keyEvent` helper like so:

  ```javascript
  triggerEvent('#some-elem-id', 'keypress', { keyCode: 13 }, function(response) {
    // triggerEvent operation has completed (success or failure)
    // success: response === { status: 'success', payload: undefined };
    // failure: response === { status: 'failure', payload: reason };
  });
  ```

  @method triggerEvent
  @param {String|HTMLElement|XPath} selector jQuery selector for finding element on the DOM
  @param {String} [context] jQuery selector that will limit the selector
                             argument to find only within the context's children
  @param {String} type The event type to be triggered.
  @param {Object} [options] The options to be passed to jQuery.Event.
  @param {Function} callback the selenium executeSyncScript completion callback
  */
__registerSeleniumHelper('triggerEvent', function(helperName, selector, context, type, options, callback) {
	return [
		helperName,
		selector,
		context,
		type,
		options,
		callback
	].filter(Boolean);
});

function __seleniumIsXPath(selector) {
	return typeof selector === 'string' && selector.indexOf('/') !== -1
}

function __seleniumXPath(STR_XPATH) {
    var xresult = document.evaluate(STR_XPATH, document, null, XPathResult.ANY_TYPE, null);
    var xnodes = [];
    var xres;
    while (xres = xresult.iterateNext()) {
        xnodes.push(xres);
    }

    return xnodes;
}
