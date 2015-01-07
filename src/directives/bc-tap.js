//(function (angular) {
//    'use strict';
//    angular.module('bc-touch', [])
//        .directive('bcClick', function ($timeout) {
//            return {
//                restrict: 'A',
//                link: function (scope, element, attr) {
//
//                    $(element).on('touchend', function () {
//                        scope.$eval(attrs.bcClick);
//                    })
//
//                }
//            }
//        })
//})(angular);


/**
 * @ngdoc page
 * @name tap
 * @module ionic
 * @description
 * On touch devices such as a phone or tablet, some browsers implement a 300ms delay between
 * the time the user stops touching the display and the moment the browser executes the
 * click. This delay was initially introduced so the browser can know whether the user wants to
 * double-tap to zoom in on the webpage.  Basically, the browser waits roughly 300ms to see if
 * the user is double-tapping, or just tapping on the display once.
 *
 * Out of the box, Ionic automatically removes the 300ms delay in order to make Ionic apps
 * feel more "native" like. Resultingly, other solutions such as
 * [fastclick](https://github.com/ftlabs/fastclick) and Angular's
 * [ngTouch](https://docs.angularjs.org/api/ngTouch) should not be included, to avoid conflicts.
 *
 * Some browsers already remove the delay with certain settings, such as the CSS property
 * `touch-events: none` or with specific meta tag viewport values. However, each of these
 * browsers still handle clicks differently, such as when to fire off or cancel the event
 * (like scrolling when the target is a button, or holding a button down).
 * For browsers that already remove the 300ms delay, consider Ionic's tap system as a way to
 * normalize how clicks are handled across the various devices so there's an expected response
 * no matter what the device, platform or version. Additionally, Ionic will prevent
 * ghostclicks which even browsers that remove the delay still experience.
 *
 * In some cases, third-party libraries may also be working with touch events which can interfere
 * with the tap system. For example, mapping libraries like Google or Leaflet Maps often implement
 * a touch detection system which conflicts with Ionic's tap system.
 *
 * ### Disabling the tap system
 *
 * To disable the tap for an element and all of its children elements,
 * add the attribute `data-tap-disabled="true"`.
 *
 * ```html
 * <div data-tap-disabled="true">
 *     <div id="google-map"></div>
 * </div>
 * ```
 *
 * ### Additional Notes:
 *
 * - Ionic tap  works with Ionic's JavaScript scrolling
 * - Elements can come and go from the DOM and Ionic tap doesn't keep adding and removing
 *   listeners
 * - No "tap delay" after the first "tap" (you can tap as fast as you want, they all click)
 * - Minimal events listeners, only being added to document
 * - Correct focus in/out on each input type (select, textearea, range) on each platform/device
 * - Shows and hides virtual keyboard correctly for each platform/device
 * - Works with labels surrounding inputs
 * - Does not fire off a click if the user moves the pointer too far
 * - Adds and removes an 'activated' css class
 * - Multiple [unit tests](https://github.com/driftyco/ionic/blob/master/test/unit/utils/tap.unit.js) for each scenario
 *
 */
/*

 IONIC TAP
 ---------------
 - Both touch and mouse events are added to the document.body on DOM ready
 - If a touch event happens, it does not use mouse event listeners
 - On touchend, if the distance between start and end was small, trigger a click
 - In the triggered click event, add a 'isIonicTap' property
 - The triggered click receives the same x,y coordinates as as the end event
 - On document.body click listener (with useCapture=true), only allow clicks with 'isIonicTap'
 - Triggering clicks with mouse events work the same as touch, except with mousedown/mouseup
 - Tapping inputs is disabled during scrolling
 */
var ionic = {};
ionic.scroll = {};
var tapDoc; // the element which the listeners are on (document.body)
var tapActiveEle; // the element which is active (probably has focus)
var tapEnabledTouchEvents;
var tapMouseResetTimer;
var tapPointerMoved;
var tapPointerStart;
var tapTouchFocusedInput;
var tapLastTouchTarget;
var tapTouchMoveListener = 'touchmove';

// how much the coordinates can be off between start/end, but still a click
var TAP_RELEASE_TOLERANCE = 6; // default tolerance
var TAP_RELEASE_BUTTON_TOLERANCE = 50; // button elements should have a larger tolerance

var tapEventListeners = {
    'click': tapClickGateKeeper,

    'mousedown': tapMouseDown,
    'mouseup': tapMouseUp,
    'mousemove': tapMouseMove,

    'touchstart': tapTouchStart,
    'touchend': tapTouchEnd,
    'touchcancel': tapTouchCancel,
    'touchmove': tapTouchMove,

    'pointerdown': tapTouchStart,
    'pointerup': tapTouchEnd,
    'pointercancel': tapTouchCancel,
    'pointermove': tapTouchMove,

    'MSPointerDown': tapTouchStart,
    'MSPointerUp': tapTouchEnd,
    'MSPointerCancel': tapTouchCancel,
    'MSPointerMove': tapTouchMove,

    'focusin': tapFocusIn,
    'focusout': tapFocusOut
};

ionic.tap = {

    register: function (ele) {
        tapDoc = ele;

        tapEventListener('click', true, true);
        tapEventListener('mouseup');
        tapEventListener('mousedown');

        if (window.navigator.pointerEnabled) {
            tapEventListener('pointerdown');
            tapEventListener('pointerup');
            tapEventListener('pointcancel');
            tapTouchMoveListener = 'pointermove';

        } else if (window.navigator.msPointerEnabled) {
            tapEventListener('MSPointerDown');
            tapEventListener('MSPointerUp');
            tapEventListener('MSPointerCancel');
            tapTouchMoveListener = 'MSPointerMove';

        } else {
            tapEventListener('touchstart');
            tapEventListener('touchend');
            tapEventListener('touchcancel');
        }

        tapEventListener('focusin');
        tapEventListener('focusout');

        return function () {
            for (var type in tapEventListeners) {
                tapEventListener(type, false);
            }
            tapDoc = null;
            tapActiveEle = null;
            tapEnabledTouchEvents = false;
            tapPointerMoved = false;
            tapPointerStart = null;
        };
    },

    ignoreScrollStart: function (e) {
        return (e.defaultPrevented) ||  // defaultPrevented has been assigned by another component handling the event
            (e.target.isContentEditable) ||
            (/^(file|range)$/i).test(e.target.type) ||
            (e.target.dataset ? e.target.dataset.preventScroll : e.target.getAttribute('data-prevent-default')) == 'true' || // manually set within an elements attributes
            (!!(/^(object|embed)$/i).test(e.target.tagName)) ||  // flash/movie/object touches should not try to scroll
            ionic.tap.isElementTapDisabled(e.target); // check if this element, or an ancestor, has `data-tap-disabled` attribute
    },

    isTextInput: function (ele) {
        return !!ele &&
            (ele.tagName == 'TEXTAREA' ||
                ele.contentEditable === 'true' ||
                (ele.tagName == 'INPUT' && !(/^(radio|checkbox|range|file|submit|reset)$/i).test(ele.type)) );
    },

    isDateInput: function (ele) {
        return !!ele &&
            (ele.tagName == 'INPUT' && (/^(date|time|datetime-local|month|week)$/i).test(ele.type));
    },

    isLabelWithTextInput: function (ele) {
        var container = tapContainingElement(ele, false);

        return !!container &&
            ionic.tap.isTextInput(tapTargetElement(container));
    },

    containsOrIsTextInput: function (ele) {
        return ionic.tap.isTextInput(ele) || ionic.tap.isLabelWithTextInput(ele);
    },

    cloneFocusedInput: function (container, scrollIntance) {
        if (ionic.tap.hasCheckedClone) return;
        ionic.tap.hasCheckedClone = true;

        ionic.requestAnimationFrame(function () {
            var focusInput = container.querySelector(':focus');
            if (ionic.tap.isTextInput(focusInput)) {
                var clonedInput = focusInput.parentElement.querySelector('.cloned-text-input');
                if (!clonedInput) {
                    clonedInput = document.createElement(focusInput.tagName);
                    clonedInput.placeholder = focusInput.placeholder;
                    clonedInput.type = focusInput.type;
                    clonedInput.value = focusInput.value;
                    clonedInput.className = 'cloned-text-input';
                    clonedInput.readOnly = true;
                    focusInput.parentElement.insertBefore(clonedInput, focusInput);
                    focusInput.style.top = focusInput.offsetTop;
                    focusInput.classList.add('previous-input-focus');
                }
            }
        });
    },

    hasCheckedClone: false,

    removeClonedInputs: function (container, scrollIntance) {
        ionic.tap.hasCheckedClone = false;

        ionic.requestAnimationFrame(function () {
            var clonedInputs = container.querySelectorAll('.cloned-text-input');
            var previousInputFocus = container.querySelectorAll('.previous-input-focus');
            var x;

            for (x = 0; x < clonedInputs.length; x++) {
                clonedInputs[x].parentElement.removeChild(clonedInputs[x]);
            }

            for (x = 0; x < previousInputFocus.length; x++) {
                previousInputFocus[x].classList.remove('previous-input-focus');
                previousInputFocus[x].style.top = '';
                previousInputFocus[x].focus();
            }
        });
    },

    requiresNativeClick: function (ele) {
        if (!ele || ele.disabled || (/^(file|range)$/i).test(ele.type) || (/^(object|video)$/i).test(ele.tagName)) {
            return true;
        }
        return ionic.tap.isElementTapDisabled(ele);
    },

    isElementTapDisabled: function (ele) {
        if (ele && ele.nodeType === 1) {
            var element = ele;
            while (element) {
                if ((element.dataset ? element.dataset.tapDisabled : element.getAttribute('data-tap-disabled')) == 'true') {
                    return true;
                }
                element = element.parentElement;
            }
        }
        return false;
    },

    setTolerance: function (releaseTolerance, releaseButtonTolerance) {
        TAP_RELEASE_TOLERANCE = releaseTolerance;
        TAP_RELEASE_BUTTON_TOLERANCE = releaseButtonTolerance;
    },

    cancelClick: function () {
        // used to cancel any simulated clicks which may happen on a touchend/mouseup
        // gestures uses this method within its tap and hold events
        tapPointerMoved = true;
    }

};

function tapEventListener(type, enable, useCapture) {
    if (enable !== false) {
        tapDoc.addEventListener(type, tapEventListeners[type], useCapture);
    } else {
        tapDoc.removeEventListener(type, tapEventListeners[type]);
    }
}

function tapClick(e) {
    // simulate a normal click by running the element's click method then focus on it
    var container = tapContainingElement(e.target);
    var ele = tapTargetElement(container);

    if (ionic.tap.requiresNativeClick(ele) || tapPointerMoved) return false;

    var c = getPointerCoordinates(e);

    console.log('tapClick', e.type, ele.tagName, '(' + c.x + ',' + c.y + ')');
    triggerMouseEvent('click', ele, c.x, c.y);

    // if it's an input, focus in on the target, otherwise blur
    tapHandleFocus(ele);
}

function triggerMouseEvent(type, ele, x, y) {
    // using initMouseEvent instead of MouseEvent for our Android friends
    var clickEvent = document.createEvent("MouseEvents");
    clickEvent.initMouseEvent(type, true, true, window, 1, 0, 0, x, y, false, false, false, false, 0, null);
    clickEvent.isIonicTap = true;
    ele.dispatchEvent(clickEvent);
}

function tapClickGateKeeper(e) {
    if (e.target.type == 'submit' && e.detail === 0) {
        // do not prevent click if it came from an "Enter" or "Go" keypress submit
        return;
    }

    // do not allow through any click events that were not created by ionic.tap
    if ((ionic.scroll.isScrolling && ionic.tap.containsOrIsTextInput(e.target) ) ||
        (!e.isIonicTap && !ionic.tap.requiresNativeClick(e.target))) {
        console.log('clickPrevent', e.target.tagName);
        e.stopPropagation();

        if (!ionic.tap.isLabelWithTextInput(e.target)) {
            // labels clicks from native should not preventDefault othersize keyboard will not show on input focus
            e.preventDefault();
        }
        return false;
    }
}

// MOUSE
function tapMouseDown(e) {
    if (e.isIonicTap || tapIgnoreEvent(e)) return;

    if (tapEnabledTouchEvents) {
        console.log('mousedown', 'stop event');
        e.stopPropagation();

        if ((!ionic.tap.isTextInput(e.target) || tapLastTouchTarget !== e.target) && !(/^(select|option)$/i).test(e.target.tagName)) {
            // If you preventDefault on a text input then you cannot move its text caret/cursor.
            // Allow through only the text input default. However, without preventDefault on an
            // input the 300ms delay can change focus on inputs after the keyboard shows up.
            // The focusin event handles the chance of focus changing after the keyboard shows.
            e.preventDefault();
        }

        return false;
    }

    tapPointerMoved = false;
    tapPointerStart = getPointerCoordinates(e);

    tapEventListener('mousemove');
    ionic.activator.start(e);
}

function tapMouseUp(e) {
    if (tapEnabledTouchEvents) {
        e.stopPropagation();
        e.preventDefault();
        return false;
    }

    if (tapIgnoreEvent(e) || (/^(select|option)$/i).test(e.target.tagName)) return false;

    if (!tapHasPointerMoved(e)) {
        tapClick(e);
    }
    tapEventListener('mousemove', false);
    ionic.activator.end();
    tapPointerMoved = false;
}

function tapMouseMove(e) {
    if (tapHasPointerMoved(e)) {
        tapEventListener('mousemove', false);
        ionic.activator.end();
        tapPointerMoved = true;
        return false;
    }
}


// TOUCH
function tapTouchStart(e) {
    if (tapIgnoreEvent(e)) return;

    tapPointerMoved = false;

    tapEnableTouchEvents();
    tapPointerStart = getPointerCoordinates(e);

    tapEventListener(tapTouchMoveListener);
    ionic.activator.start(e);

    if (ionic.Platform.isIOS() && ionic.tap.isLabelWithTextInput(e.target)) {
        // if the tapped element is a label, which has a child input
        // then preventDefault so iOS doesn't ugly auto scroll to the input
        // but do not prevent default on Android or else you cannot move the text caret
        // and do not prevent default on Android or else no virtual keyboard shows up

        var textInput = tapTargetElement(tapContainingElement(e.target));
        if (textInput !== tapActiveEle) {
            // don't preventDefault on an already focused input or else iOS's text caret isn't usable
            e.preventDefault();
        }
    }
}

function tapTouchEnd(e) {
    if (tapIgnoreEvent(e)) return;

    tapEnableTouchEvents();
    if (!tapHasPointerMoved(e)) {
        tapClick(e);

        if ((/^(select|option)$/i).test(e.target.tagName)) {
            e.preventDefault();
        }
    }

    tapLastTouchTarget = e.target;
    tapTouchCancel();
}

function tapTouchMove(e) {
    if (tapHasPointerMoved(e)) {
        tapPointerMoved = true;
        tapEventListener(tapTouchMoveListener, false);
        ionic.activator.end();
        return false;
    }
}

function tapTouchCancel(e) {
    tapEventListener(tapTouchMoveListener, false);
    ionic.activator.end();
    tapPointerMoved = false;
}

function tapEnableTouchEvents() {
    tapEnabledTouchEvents = true;
    clearTimeout(tapMouseResetTimer);
    tapMouseResetTimer = setTimeout(function () {
        tapEnabledTouchEvents = false;
    }, 2000);
}

function tapIgnoreEvent(e) {
    if (e.isTapHandled) return true;
    e.isTapHandled = true;

    if (ionic.scroll.isScrolling && ionic.tap.containsOrIsTextInput(e.target)) {
        e.preventDefault();
        return true;
    }
}

function tapHandleFocus(ele) {
    tapTouchFocusedInput = null;

    var triggerFocusIn = false;

    if (ele.tagName == 'SELECT') {
        // trick to force Android options to show up
        triggerMouseEvent('mousedown', ele, 0, 0);
        ele.focus && ele.focus();
        triggerFocusIn = true;

    } else if (tapActiveElement() === ele) {
        // already is the active element and has focus
        triggerFocusIn = true;

    } else if ((/^(input|textarea)$/i).test(ele.tagName)) {
        triggerFocusIn = true;
        ele.focus && ele.focus();
        ele.value = ele.value;
        if (tapEnabledTouchEvents) {
            tapTouchFocusedInput = ele;
        }

    } else {
        tapFocusOutActive();
    }

    if (triggerFocusIn) {
        tapActiveElement(ele);
        ionic.trigger('ionic.focusin', {
            target: ele
        }, true);
    }
}

function tapFocusOutActive() {
    var ele = tapActiveElement();
    if (ele && (/^(input|textarea|select)$/i).test(ele.tagName)) {
        console.log('tapFocusOutActive', ele.tagName);
        ele.blur();
    }
    tapActiveElement(null);
}

function tapFocusIn(e) {
    // Because a text input doesn't preventDefault (so the caret still works) there's a chance
    // that it's mousedown event 300ms later will change the focus to another element after
    // the keyboard shows up.

    if (tapEnabledTouchEvents &&
        ionic.tap.isTextInput(tapActiveElement()) &&
        ionic.tap.isTextInput(tapTouchFocusedInput) &&
        tapTouchFocusedInput !== e.target) {

        // 1) The pointer is from touch events
        // 2) There is an active element which is a text input
        // 3) A text input was just set to be focused on by a touch event
        // 4) A new focus has been set, however the target isn't the one the touch event wanted
        console.log('focusin', 'tapTouchFocusedInput');
        tapTouchFocusedInput.focus();
        tapTouchFocusedInput = null;
    }
    ionic.scroll.isScrolling = false;
}

function tapFocusOut() {
    tapActiveElement(null);
}

function tapActiveElement(ele) {
    if (arguments.length) {
        tapActiveEle = ele;
    }
    return tapActiveEle || document.activeElement;
}

function tapHasPointerMoved(endEvent) {
    if (!endEvent || endEvent.target.nodeType !== 1 || !tapPointerStart || ( tapPointerStart.x === 0 && tapPointerStart.y === 0 )) {
        return false;
    }
    var endCoordinates = getPointerCoordinates(endEvent);

    var releaseTolerance = (endEvent.target.classList.contains('button') ? TAP_RELEASE_BUTTON_TOLERANCE : TAP_RELEASE_TOLERANCE);

    return Math.abs(tapPointerStart.x - endCoordinates.x) > releaseTolerance ||
        Math.abs(tapPointerStart.y - endCoordinates.y) > releaseTolerance;
}

function getPointerCoordinates(event) {
    // This method can get coordinates for both a mouse click
    // or a touch depending on the given event
    var c = { x: 0, y: 0 };
    if (event) {
        var touches = event.touches && event.touches.length ? event.touches : [event];
        var e = (event.changedTouches && event.changedTouches[0]) || touches[0];
        if (e) {
            c.x = e.clientX || e.pageX || 0;
            c.y = e.clientY || e.pageY || 0;
        }
    }
    return c;
}

function tapContainingElement(ele, allowSelf) {
    var climbEle = ele;
    for (var x = 0; x < 6; x++) {
        if (!climbEle) break;
        if (climbEle.tagName === 'LABEL') return climbEle;
        climbEle = climbEle.parentElement;
    }
    if (allowSelf !== false) return ele;
}

function tapTargetElement(ele) {
    if (ele && ele.tagName === 'LABEL') {
        if (ele.control) return ele.control;

        // older devices do not support the "control" property
        if (ele.querySelector) {
            var control = ele.querySelector('input,textarea,select');
            if (control) return control;
        }
    }
    return ele;
}


(function (document, ionic) {
    'use strict';

    var queueElements = {};   // elements that should get an active state in XX milliseconds
    var activeElements = {};  // elements that are currently active
    var keyId = 0;            // a counter for unique keys for the above ojects
    var ACTIVATED_CLASS = 'activated';

    ionic.activator = {

        start: function (e) {
            var self = this;

            // when an element is touched/clicked, it climbs up a few
            // parents to see if it is an .item or .button element
            ionic.requestAnimationFrame(function () {
                if (ionic.tap.requiresNativeClick(e.target)) return;
                var ele = e.target;
                var eleToActivate;

                for (var x = 0; x < 4; x++) {
                    if (!ele || ele.nodeType !== 1) break;
                    if (eleToActivate && ele.classList.contains('item')) {
                        eleToActivate = ele;
                        break;
                    }
                    if (ele.tagName == 'A' || ele.tagName == 'BUTTON' || ele.hasAttribute('ng-click')) {
                        eleToActivate = ele;
                        break;
                    }
                    if (ele.classList.contains('button')) {
                        eleToActivate = ele;
                        break;
                    }
                    ele = ele.parentElement;
                }

                if (eleToActivate) {
                    // queue that this element should be set to active
                    queueElements[keyId] = eleToActivate;

                    // in XX milliseconds, set the queued elements to active
                    if (e.type === 'touchstart') {
                        self._activateTimeout = setTimeout(activateElements, 80);
                    } else {
                        ionic.requestAnimationFrame(activateElements);
                    }

                    keyId = (keyId > 19 ? 0 : keyId + 1);
                }

            });
        },

        end: function () {
            // clear out any active/queued elements after XX milliseconds
            clearTimeout(this._activateTimeout);
            setTimeout(clear, 200);
        }

    };

    function clear() {
        // clear out any elements that are queued to be set to active
        queueElements = {};

        // in the next frame, remove the active class from all active elements
        ionic.requestAnimationFrame(deactivateElements);
    }

    function activateElements() {
        // activate all elements in the queue
        for (var key in queueElements) {
            if (queueElements[key]) {
                queueElements[key].classList.add(ACTIVATED_CLASS);
                activeElements[key] = queueElements[key];
            }
        }
        queueElements = {};
    }

    function deactivateElements() {
        for (var key in activeElements) {
            if (activeElements[key]) {
                activeElements[key].classList.remove(ACTIVATED_CLASS);
                delete activeElements[key];
            }
        }
    }

})(document, ionic);


(function (window, document, ionic) {

    var readyCallbacks = [];
    var isDomReady = false;

    function domReady() {
        isDomReady = true;
        for (var x = 0; x < readyCallbacks.length; x++) {
            ionic.requestAnimationFrame(readyCallbacks[x]);
        }
        readyCallbacks = [];
        document.removeEventListener('DOMContentLoaded', domReady);
    }

    document.addEventListener('DOMContentLoaded', domReady);

    // From the man himself, Mr. Paul Irish.
    // The requestAnimationFrame polyfill
    // Put it on window just to preserve its context
    // without having to use .call
    window._rAF = (function () {
        return  window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            function (callback) {
                window.setTimeout(callback, 16);
            };
    })();

    var cancelAnimationFrame = window.cancelAnimationFrame ||
        window.webkitCancelAnimationFrame ||
        window.mozCancelAnimationFrame ||
        window.webkitCancelRequestAnimationFrame;

    /**
     * @ngdoc utility
     * @name ionic.DomUtil
     * @module ionic
     */
    ionic.DomUtil = {
        //Call with proper context
        /**
         * @ngdoc method
         * @name ionic.DomUtil#requestAnimationFrame
         * @alias ionic.requestAnimationFrame
         * @description Calls [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window.requestAnimationFrame), or a polyfill if not available.
         * @param {function} callback The function to call when the next frame
         * happens.
         */
        requestAnimationFrame: function (cb) {
            return window._rAF(cb);
        },

        cancelAnimationFrame: function (requestId) {
            cancelAnimationFrame(requestId);
        },

        /**
         * @ngdoc method
         * @name ionic.DomUtil#animationFrameThrottle
         * @alias ionic.animationFrameThrottle
         * @description
         * When given a callback, if that callback is called 100 times between
         * animation frames, adding Throttle will make it only run the last of
         * the 100 calls.
         *
         * @param {function} callback a function which will be throttled to
         * requestAnimationFrame
         * @returns {function} A function which will then call the passed in callback.
         * The passed in callback will receive the context the returned function is
         * called with.
         */
        animationFrameThrottle: function (cb) {
            var args, isQueued, context;
            return function () {
                args = arguments;
                context = this;
                if (!isQueued) {
                    isQueued = true;
                    ionic.requestAnimationFrame(function () {
                        cb.apply(context, args);
                        isQueued = false;
                    });
                }
            };
        },

        /**
         * @ngdoc method
         * @name ionic.DomUtil#getPositionInParent
         * @description
         * Find an element's scroll offset within its container.
         * @param {DOMElement} element The element to find the offset of.
         * @returns {object} A position object with the following properties:
         *   - `{number}` `left` The left offset of the element.
         *   - `{number}` `top` The top offset of the element.
         */
        getPositionInParent: function (el) {
            return {
                left: el.offsetLeft,
                top: el.offsetTop
            };
        },

        /**
         * @ngdoc method
         * @name ionic.DomUtil#ready
         * @description
         * Call a function when the DOM is ready, or if it is already ready
         * call the function immediately.
         * @param {function} callback The function to be called.
         */
        ready: function (cb) {
            if (isDomReady || document.readyState === "complete") {
                ionic.requestAnimationFrame(cb);
            } else {
                readyCallbacks.push(cb);
            }
        },

        /**
         * @ngdoc method
         * @name ionic.DomUtil#getTextBounds
         * @description
         * Get a rect representing the bounds of the given textNode.
         * @param {DOMElement} textNode The textNode to find the bounds of.
         * @returns {object} An object representing the bounds of the node. Properties:
         *   - `{number}` `left` The left positton of the textNode.
         *   - `{number}` `right` The right positton of the textNode.
         *   - `{number}` `top` The top positton of the textNode.
         *   - `{number}` `bottom` The bottom position of the textNode.
         *   - `{number}` `width` The width of the textNode.
         *   - `{number}` `height` The height of the textNode.
         */
        getTextBounds: function (textNode) {
            if (document.createRange) {
                var range = document.createRange();
                range.selectNodeContents(textNode);
                if (range.getBoundingClientRect) {
                    var rect = range.getBoundingClientRect();
                    if (rect) {
                        var sx = window.scrollX;
                        var sy = window.scrollY;

                        return {
                            top: rect.top + sy,
                            left: rect.left + sx,
                            right: rect.left + sx + rect.width,
                            bottom: rect.top + sy + rect.height,
                            width: rect.width,
                            height: rect.height
                        };
                    }
                }
            }
            return null;
        },

        /**
         * @ngdoc method
         * @name ionic.DomUtil#getChildIndex
         * @description
         * Get the first index of a child node within the given element of the
         * specified type.
         * @param {DOMElement} element The element to find the index of.
         * @param {string} type The nodeName to match children of element against.
         * @returns {number} The index, or -1, of a child with nodeName matching type.
         */
        getChildIndex: function (element, type) {
            if (type) {
                var ch = element.parentNode.children;
                var c;
                for (var i = 0, k = 0, j = ch.length; i < j; i++) {
                    c = ch[i];
                    if (c.nodeName && c.nodeName.toLowerCase() == type) {
                        if (c == element) {
                            return k;
                        }
                        k++;
                    }
                }
            }
            return Array.prototype.slice.call(element.parentNode.children).indexOf(element);
        },

        /**
         * @private
         */
        swapNodes: function (src, dest) {
            dest.parentNode.insertBefore(src, dest);
        },

        /**
         * @private
         */
        centerElementByMargin: function (el) {
            el.style.marginLeft = (-el.offsetWidth) / 2 + 'px';
            el.style.marginTop = (-el.offsetHeight) / 2 + 'px';
        },
        //Center twice, after raf, to fix a bug with ios and showing elements
        //that have just been attached to the DOM.
        centerElementByMarginTwice: function (el) {
            ionic.requestAnimationFrame(function () {
                ionic.DomUtil.centerElementByMargin(el);
                setTimeout(function () {
                    ionic.DomUtil.centerElementByMargin(el);
                    setTimeout(function () {
                        ionic.DomUtil.centerElementByMargin(el);
                    });
                });
            });
        },

        /**
         * @ngdoc method
         * @name ionic.DomUtil#getParentWithClass
         * @param {DOMElement} element
         * @param {string} className
         * @returns {DOMElement} The closest parent of element matching the
         * className, or null.
         */
        getParentWithClass: function (e, className, depth) {
            depth = depth || 10;
            while (e.parentNode && depth--) {
                if (e.parentNode.classList && e.parentNode.classList.contains(className)) {
                    return e.parentNode;
                }
                e = e.parentNode;
            }
            return null;
        },
        /**
         * @ngdoc method
         * @name ionic.DomUtil#getParentOrSelfWithClass
         * @param {DOMElement} element
         * @param {string} className
         * @returns {DOMElement} The closest parent or self matching the
         * className, or null.
         */
        getParentOrSelfWithClass: function (e, className, depth) {
            depth = depth || 10;
            while (e && depth--) {
                if (e.classList && e.classList.contains(className)) {
                    return e;
                }
                e = e.parentNode;
            }
            return null;
        },

        /**
         * @ngdoc method
         * @name ionic.DomUtil#rectContains
         * @param {number} x
         * @param {number} y
         * @param {number} x1
         * @param {number} y1
         * @param {number} x2
         * @param {number} y2
         * @returns {boolean} Whether {x,y} fits within the rectangle defined by
         * {x1,y1,x2,y2}.
         */
        rectContains: function (x, y, x1, y1, x2, y2) {
            if (x < x1 || x > x2) return false;
            if (y < y1 || y > y2) return false;
            return true;
        }
    };

    //Shortcuts
    ionic.requestAnimationFrame = ionic.DomUtil.requestAnimationFrame;
    ionic.cancelAnimationFrame = ionic.DomUtil.cancelAnimationFrame;
    ionic.animationFrameThrottle = ionic.DomUtil.animationFrameThrottle;
})(window, document, ionic);


(function (window, document, ionic) {

    var IOS = 'ios';
    var ANDROID = 'android';
    var WINDOWS_PHONE = 'windowsphone';

    /**
     * @ngdoc utility
     * @name ionic.Platform
     * @module ionic
     */
    ionic.Platform = {

        /**
         * @ngdoc property
         * @name ionic.Platform#isReady
         * @returns {boolean} Whether the device is ready.
         */
        isReady: false,
        /**
         * @ngdoc property
         * @name ionic.Platform#isFullScreen
         * @returns {boolean} Whether the device is fullscreen.
         */
        isFullScreen: false,
        /**
         * @ngdoc property
         * @name ionic.Platform#platforms
         * @returns {Array(string)} An array of all platforms found.
         */
        platforms: null,
        /**
         * @ngdoc property
         * @name ionic.Platform#grade
         * @returns {string} What grade the current platform is.
         */
        grade: null,
        ua: navigator.userAgent,

        /**
         * @ngdoc method
         * @name ionic.Platform#ready
         * @description
         * Trigger a callback once the device is ready, or immediately
         * if the device is already ready. This method can be run from
         * anywhere and does not need to be wrapped by any additonal methods.
         * When the app is within a WebView (Cordova), it'll fire
         * the callback once the device is ready. If the app is within
         * a web browser, it'll fire the callback after `window.load`.
         * @param {function} callback The function to call.
         */
        ready: function (cb) {
            // run through tasks to complete now that the device is ready
            if (this.isReady) {
                cb();
            } else {
                // the platform isn't ready yet, add it to this array
                // which will be called once the platform is ready
                readyCallbacks.push(cb);
            }
        },

        /**
         * @private
         */
        detect: function () {
            ionic.Platform._checkPlatforms();

            ionic.requestAnimationFrame(function () {
                // only add to the body class if we got platform info
                for (var i = 0; i < ionic.Platform.platforms.length; i++) {
                    document.body.classList.add('platform-' + ionic.Platform.platforms[i]);
                }
            });
        },

        /**
         * @ngdoc method
         * @name ionic.Platform#setGrade
         * @description Set the grade of the device: 'a', 'b', or 'c'. 'a' is the best
         * (most css features enabled), 'c' is the worst.  By default, sets the grade
         * depending on the current device.
         * @param {string} grade The new grade to set.
         */
        setGrade: function (grade) {
            var oldGrade = this.grade;
            this.grade = grade;
            ionic.requestAnimationFrame(function () {
                if (oldGrade) {
                    document.body.classList.remove('grade-' + oldGrade);
                }
                document.body.classList.add('grade-' + grade);
            });
        },

        /**
         * @ngdoc method
         * @name ionic.Platform#device
         * @description Return the current device (given by cordova).
         * @returns {object} The device object.
         */
        device: function () {
            if (window.device) return window.device;
            if (this.isWebView()) console.error('device plugin required');
            return {};
        },

        _checkPlatforms: function (platforms) {
            this.platforms = [];
            var grade = 'a';

            if (this.isWebView()) {
                this.platforms.push('webview');
                this.platforms.push('cordova');
            } else {
                this.platforms.push('browser');
            }
            if (this.isIPad()) this.platforms.push('ipad');

            var platform = this.platform();
            if (platform) {
                this.platforms.push(platform);

                var version = this.version();
                if (version) {
                    var v = version.toString();
                    if (v.indexOf('.') > 0) {
                        v = v.replace('.', '_');
                    } else {
                        v += '_0';
                    }
                    this.platforms.push(platform + v.split('_')[0]);
                    this.platforms.push(platform + v);

                    if (this.isAndroid() && version < 4.4) {
                        grade = (version < 4 ? 'c' : 'b');
                    } else if (this.isWindowsPhone()) {
                        grade = 'b';
                    }
                }
            }

            this.setGrade(grade);
        },

        /**
         * @ngdoc method
         * @name ionic.Platform#isWebView
         * @returns {boolean} Check if we are running within a WebView (such as Cordova).
         */
        isWebView: function () {
            return !(!window.cordova && !window.PhoneGap && !window.phonegap);
        },
        /**
         * @ngdoc method
         * @name ionic.Platform#isIPad
         * @returns {boolean} Whether we are running on iPad.
         */
        isIPad: function () {
            if (/iPad/i.test(window.navigator.platform)) {
                return true;
            }
            return /iPad/i.test(this.ua);
        },
        /**
         * @ngdoc method
         * @name ionic.Platform#isIOS
         * @returns {boolean} Whether we are running on iOS.
         */
        isIOS: function () {
            return this.is(IOS);
        },
        /**
         * @ngdoc method
         * @name ionic.Platform#isAndroid
         * @returns {boolean} Whether we are running on Android.
         */
        isAndroid: function () {
            return this.is(ANDROID);
        },
        /**
         * @ngdoc method
         * @name ionic.Platform#isWindowsPhone
         * @returns {boolean} Whether we are running on Windows Phone.
         */
        isWindowsPhone: function () {
            return this.is(WINDOWS_PHONE);
        },

        /**
         * @ngdoc method
         * @name ionic.Platform#platform
         * @returns {string} The name of the current platform.
         */
        platform: function () {
            // singleton to get the platform name
            if (platformName === null) this.setPlatform(this.device().platform);
            return platformName;
        },

        /**
         * @private
         */
        setPlatform: function (n) {
            if (typeof n != 'undefined' && n !== null && n.length) {
                platformName = n.toLowerCase();
            } else if (this.ua.indexOf('Android') > 0) {
                platformName = ANDROID;
            } else if (this.ua.indexOf('iPhone') > -1 || this.ua.indexOf('iPad') > -1 || this.ua.indexOf('iPod') > -1) {
                platformName = IOS;
            } else if (this.ua.indexOf('Windows Phone') > -1) {
                platformName = WINDOWS_PHONE;
            } else {
                platformName = window.navigator.platform && navigator.platform.toLowerCase().split(' ')[0] || '';
            }
        },

        /**
         * @ngdoc method
         * @name ionic.Platform#version
         * @returns {string} The version of the current device platform.
         */
        version: function () {
            // singleton to get the platform version
            if (platformVersion === null) this.setVersion(this.device().version);
            return platformVersion;
        },

        /**
         * @private
         */
        setVersion: function (v) {
            if (typeof v != 'undefined' && v !== null) {
                v = v.split('.');
                v = parseFloat(v[0] + '.' + (v.length > 1 ? v[1] : 0));
                if (!isNaN(v)) {
                    platformVersion = v;
                    return;
                }
            }

            platformVersion = 0;

            // fallback to user-agent checking
            var pName = this.platform();
            var versionMatch = {
                'android': /Android (\d+).(\d+)?/,
                'ios': /OS (\d+)_(\d+)?/,
                'windowsphone': /Windows Phone (\d+).(\d+)?/
            };
            if (versionMatch[pName]) {
                v = this.ua.match(versionMatch[pName]);
                if (v.length > 2) {
                    platformVersion = parseFloat(v[1] + '.' + v[2]);
                }
            }
        },

        // Check if the platform is the one detected by cordova
        is: function (type) {
            type = type.toLowerCase();
            // check if it has an array of platforms
            if (this.platforms) {
                for (var x = 0; x < this.platforms.length; x++) {
                    if (this.platforms[x] === type) return true;
                }
            }
            // exact match
            var pName = this.platform();
            if (pName) {
                return pName === type.toLowerCase();
            }

            // A quick hack for to check userAgent
            return this.ua.toLowerCase().indexOf(type) >= 0;
        },

        /**
         * @ngdoc method
         * @name ionic.Platform#exitApp
         * @description Exit the app.
         */
        exitApp: function () {
            this.ready(function () {
                navigator.app && navigator.app.exitApp && navigator.app.exitApp();
            });
        },

        /**
         * @ngdoc method
         * @name ionic.Platform#showStatusBar
         * @description Shows or hides the device status bar (in Cordova).
         * @param {boolean} shouldShow Whether or not to show the status bar.
         */
        showStatusBar: function (val) {
            // Only useful when run within cordova
            this._showStatusBar = val;
            this.ready(function () {
                // run this only when or if the platform (cordova) is ready
                ionic.requestAnimationFrame(function () {
                    if (ionic.Platform._showStatusBar) {
                        // they do not want it to be full screen
                        window.StatusBar && window.StatusBar.show();
                        document.body.classList.remove('status-bar-hide');
                    } else {
                        // it should be full screen
                        window.StatusBar && window.StatusBar.hide();
                        document.body.classList.add('status-bar-hide');
                    }
                });
            });
        },

        /**
         * @ngdoc method
         * @name ionic.Platform#fullScreen
         * @description
         * Sets whether the app is fullscreen or not (in Cordova).
         * @param {boolean=} showFullScreen Whether or not to set the app to fullscreen. Defaults to true.
         * @param {boolean=} showStatusBar Whether or not to show the device's status bar. Defaults to false.
         */
        fullScreen: function (showFullScreen, showStatusBar) {
            // showFullScreen: default is true if no param provided
            this.isFullScreen = (showFullScreen !== false);

            // add/remove the fullscreen classname to the body
            ionic.DomUtil.ready(function () {
                // run this only when or if the DOM is ready
                ionic.requestAnimationFrame(function () {
                    if (ionic.Platform.isFullScreen) {
                        document.body.classList.add('fullscreen');
                    } else {
                        document.body.classList.remove('fullscreen');
                    }
                });
                // showStatusBar: default is false if no param provided
                ionic.Platform.showStatusBar((showStatusBar === true));
            });
        }

    };

    var platformName = null, // just the name, like iOS or Android
        platformVersion = null, // a float of the major and minor, like 7.1
        readyCallbacks = [];

    // setup listeners to know when the device is ready to go
    function onWindowLoad() {
        if (ionic.Platform.isWebView()) {
            // the window and scripts are fully loaded, and a cordova/phonegap
            // object exists then let's listen for the deviceready
            document.addEventListener("deviceready", onPlatformReady, false);
        } else {
            // the window and scripts are fully loaded, but the window object doesn't have the
            // cordova/phonegap object, so its just a browser, not a webview wrapped w/ cordova
            onPlatformReady();
        }
        window.removeEventListener("load", onWindowLoad, false);
    }

    window.addEventListener("load", onWindowLoad, false);

    function onPlatformReady() {
        // the device is all set to go, init our own stuff then fire off our event
        ionic.Platform.isReady = true;
        ionic.Platform.detect();
        for (var x = 0; x < readyCallbacks.length; x++) {
            // fire off all the callbacks that were added before the platform was ready
            readyCallbacks[x]();
        }
        readyCallbacks = [];

        if (ionic.trigger)
            ionic.trigger('platformready', { target: document });

        if (ionic.requestAnimationFrame)
            ionic.requestAnimationFrame(function () {
                document.body.classList.add('platform-ready');
            });
    }

})(this, document, ionic);
