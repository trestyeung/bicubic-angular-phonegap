﻿//Attributes: menuid, imenus
(function (angular) {
    'use strict';
    angular.module('bicubic.mobileMenu', [])
        .directive('bcContextMenu', function ($compile) {
            return {
                restrict: 'A',
                replace: false,
                scope: {
                    imenus: '=menus'
                },
                link: function (scope, element, attrs) {

                    var menuid = menuid || 'menu'; //UID here
                    //create menu
                    var template =
                        '<div><div class="before-animation pushToGpu sc-transition blackout" id="' + menuid + '-blackout">' +
                        '</div><div class="mobileMenu before-animation pushToGpu sc-transition" id="' + menuid + '-menu">' +
                        '<ul>' +
                        '<li class="clickable-background-black" bindonce ng-repeat="m in imenus" ng-show="m.callback !== undefined && m.callback !== null" ng-click="m.callback()">' +
                        '<a bo-text="m.text"></a>' +
                        '</li>' +
                        '<li class="clickable-background-black" bindonce ng-repeat="m in menus" ng-show="m.link !== undefined && m.link !== null" bo-href="{{m.link}}">' +
                        '<a></a>' +
                        '</li>' +
                        '</ul>' +
                        '<ul>' +
                        '<li class="clickable-background-black" id="' + menuid + '-close" >' +
                        '<a>Annuler</a>' +
                        '</li>' +
                        '</ul>' +
                        '</div></div>';

                    var e = $compile(template)(scope);
                    $('body').append(e);

                    //Attach events
                    var menuOverlayElement = $('#' + menuid + '-blackout');
                    var menuElement = $('#' + menuid + '-menu');

                    var trEndCallback = function () {
                        window.isAnimating = false;

                        //menu is removed, ok to open popup or change view
                        $(window).trigger( "menuTransitionEnd", { menuId : menuid, direction : 'close' } );
                    };

                    var toggleMenu = function () {
                        Wdo.animateTranslate(menuElement, '-100px', true, true, trEndCallback);
                        Wdo.animateFade(menuOverlayElement);
                    };

                    menuElement.off().on('click', 'li', toggleMenu);
                    $(element).off().on('click', toggleMenu);

                    //Destroy
                    scope.$on('$destroy', function () {
                        $('#' + menuid + '-menu').off('click', 'li', toggleMenu);
                        $(element).off('click', toggleMenu);
                    });
                }
            };
        });
})(angular);