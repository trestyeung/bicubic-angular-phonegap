(function () {
    'use strict';
    angular.module('bicubic.mobilePopup', [])
        .factory('createPopup', function ($document, $compile, $rootScope, $controller, $timeout, $templateCache) {

            var defaults = {
                id: null,
                template: null,
                templateUrl: null,
                title: '',
                backdrop: false,
                success: { label: 'OK', fn: null },
                cancel: { label: 'Close', fn: null },
                controller: null,
                backdropClass: "modal-backdrop",
                modalClass: "viewport modal",
                animationClass: "",
                animationDuration: 650,
                removeAnimations: false
            };

            //check if this popup is already called within n ms
            if (!window.popups)
                window.popups = [];

            return function Dialog(templateUrl, options, passedInLocals) {

                var body = $document.find('body');

                var screenHeight = window.deviceHeight + 'px';

                if (window.popups.indexOf(templateUrl) > -1) {
                    return;
                }
                else {
                    window.popups.push(templateUrl);
                }

                options.templateUrl = templateUrl;

                options = angular.extend({}, defaults, options);

                var idAttr = options.id ? ' id="' + options.id + '" ' : '';

                var template = $templateCache.get(options.templateUrl);

                if (!template) console.error('Template not in cache!');

                var modalBody = '<!--' + options.templateUrl + '--><div class="modal-body">' + template[1] + '</div>';

                var modalEl = angular.element(
                        '<div class=" pushToGpu ' + options.modalClass + ' ' + options.animationClass + ' ng-leave ng-enter"' + idAttr + '>' +
                        modalBody +
                        '</div>');

                modalEl.css("height", screenHeight);

                var ctrl, locals, scope = options.scope || $rootScope.$new();

                scope.title = options.title;

                var closeFn = function () {
                    _.deleteItem(window.popups, templateUrl);

                    modalEl.addClass('ng-leave');
                };

                scope.$modalClose = closeFn;

                //used by back button
                window.closeCurrentPopup = closeFn;
                window.lastKeyboardCall = new Date().getTime();

                var hideKeyboard = function () {
                    $timeout(function () {
                        $(".modal").css("height", '');
                        scope.$evalAsync(function () {
                            $(".modal").css("height", screenHeight);
                        });
                    }, 200, false);
                };

                // Fix Android soft keyboard bug resizing page
                scope.$on("hidekeyboard", function (event, args) {
                    if (_.elapsedTime(window.lastKbEvent, args).milliseconds > 1000) {
                        hideKeyboard();
                    }

                    window.lastKbEvent = args;
                });

                if (options.controller) {
                    locals = angular.extend({ $scope: scope }, passedInLocals);
                    ctrl = $controller(options.controller, locals);
                    modalEl.contents().data('$ngControllerController', ctrl);
                }

                $compile(modalEl)(scope);

                var modalBlocker = $("<div style='position: fixed; left: 0; top: 0; width: 100%; height: 100%; background-color: #ff0000; opacity: 0; z-index: 10000000'></div>");

                var modalBlockerTouchCallback = function (event) {
                    return false;
                };

                var webkitTransitionEndCallback = function (e) {

                    if (modalBlocker) {
                        modalBlocker.remove();
                        modalBlocker = null;
                    }

                    if ($(e.currentTarget).hasClass('ng-leave')) {
                        scope.$destroy();
                    }
                };

                modalEl.bind('webkitTransitionEnd', webkitTransitionEndCallback);
                modalBlocker.bind('touchstart touchmove', modalBlockerTouchCallback);

                body.append(modalEl);
                body.append(modalBlocker);

                var time = 0;
                var keyboardOpen = window.deviceHeight !== window.innerHeight;

                if (keyboardOpen) time = 1000;

                scope.showContent = function (callback) {
                    $timeout(function () {
                        modalEl.removeClass('ng-leave');

                        if (modalBlocker) {
                            modalBlocker.remove();
                            modalBlocker = null;
                        }

                        //wait 650ms (animation time) before executing popup controller's callback
                        $timeout(function () {
                            scope.$modalClose = closeFn;
                            //$rootScope.$broadcast('popupRendered', true); Used by picture viewer
                            if (callback)
                                callback.call();
                        }, 650, true);
                    }, time, false);
                };

                scope.$on('$destroy', function () {

                    modalEl.unbind('webkitTransitionEnd', webkitTransitionEndCallback);

                    if (modalBlocker) {
                        modalBlocker.unbind('touchstart touchmove', modalBlockerTouchCallback);
                        modalBlocker = null;
                    }

                    modalEl.remove();
                    window.closeCurrentPopup = null;
                    modalEl = null;
                    body = null;
                });
            };
        })
        .directive('bcMobilePopup', function (createPopup) {
            return {
                restrict: 'A',
                link: function ($scope, $el, $attrs) {

                    var templateUrl = '';
                    var controller = '';
                    var animationType = '' || 'transition-down';
                    var locals = '';

                    var openDialog = function () {
                        createPopup(templateUrl, {
                            controller: controller,
                            animationClass: animationType
                        }, locals);
                    };

                }
            };

        });
})();

