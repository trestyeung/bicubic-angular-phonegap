(function () {
    'use strict';
    angular.module('fundoo.services', []).factory('createDialog', ["$document", "$compile", "$rootScope", "$controller", "$timeout",
        function ($document, $compile, $rootScope, $controller, $timeout) {

            var defaults = {
                id: null,
                template: null,
                templateUrl: null,
                title: '',
                backdrop: false,
                success: { label: 'OK', fn: null },
                cancel: { label: 'Close', fn: null },
                controller: null,
                scope: null,
                backdropClass: "modal-backdrop",
                modalClass: "viewport modal fullHeight",
                animationClass: "",
                animationDuration: 650
            };

            var body = $document.find('body');

            return function Dialog(templateUrl, options, passedInLocals) {

                //check if this popup is already called within n ms
                if (!window.popups) window.popups = [];

                if (window.popups.indexOf(templateUrl) > -1) return
                window.popups.push(templateUrl);

                options.templateUrl = templateUrl;
                options = angular.extend({}, defaults, options);

                var idAttr = options.id ? ' id="' + options.id + '" ' : '';
                var modalBody = '<div class="modal-body" ng-include="\'' + options.templateUrl + '\'"></div>';
                var modalEl = angular.element(
                    '<div class=" pushToGpu ' + options.modalClass + ' ' + options.animationClass + ' "' + idAttr + '>' +
                        modalBody +
                        '</div>');


                //animation is finished => kill the popup:close or clear the animation:open
                modalEl.bind('webkitAnimationEnd', function (e) {
                    if (this.style.webkitAnimationName == options.animationClass + '-close')
                        modalEl.remove();
                    else {
                        this.style.webkitAnimationDuration = '';
                        this.style.webkitAnimationFillMode = '';

                    }
                });

                var screenHeight = screen.height
                modalEl.css("height",screenHeight);


                var ctrl, locals,
                    scope = options.scope || $rootScope.$new();

                scope.title = options.title;


                //Close popup
                var closeFn = function () {

                    modalEl.css('webkitAnimationDuration', '.45s');
                    modalEl.css('webkitAnimationFillMode', 'forwards');
                    modalEl.css('webkitAnimationName', options.animationClass + '-close');

                    var popupIndex = window.popups.indexOf(templateUrl);
                    delete window.popups[popupIndex];

                    scope.$$listeners.hidekeyboard = [];
                };

                scope.$modalClose = closeFn;

                // Fix Android soft keyboard bug resizing page
                scope.$on("hidekeyboard", function () {
                    setTimeout(function () {
                        $(".modal").css("height", '');
                        setTimeout(function () {
                            $(".modal").css("height", screenHeight);
                        }, 50);
                    }, 200);
                })

                if (options.controller) {
                    locals = angular.extend({ $scope: scope }, passedInLocals);
                    ctrl = $controller(options.controller, locals);
                    modalEl.contents().data('$ngControllerController', ctrl);
                }

                $compile(modalEl)(scope);

                body.append(modalEl);

                $timeout(function () {

                    modalEl.css('webkitAnimationDuration', '.45s');
                    modalEl.css('webkitAnimationFillMode', 'forwards');
                    modalEl.css('webkitAnimationName', options.animationClass + '-open');

                    $timeout(function () {
                        scope.$modalClose = closeFn;
                        $rootScope.$broadcast('popupRendered', true);
                    }, 500, false);

                }, 50);
            };
        }]);
})();

