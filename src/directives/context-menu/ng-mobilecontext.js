(function (angular) {
    'use strict';
    angular.module('mobile-context-menu',[])
    .directive('menu', function ($compile) {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            scope: {
                imenus: '=menus'
            },
            link: function (scope, element, attrs) {
              
                var template = '<div><div class="before-animation pushToGpu sc-transition blackout" id="' + attrs.menuid + '-blackout">' +
                    '</div><div class="mobileMenu before-animation pushToGpu sc-transition" id="' + attrs.menuid + '-menu"><ul>' +
                    '<li class="clickable-background-black" bindonce ng-repeat="m in imenus" ng-show="m.callback !== undefined && m.callback !== null" ng-click="m.callback()">' +
                    '<a bo-text="m.text"></a></li><li class="clickable-background-black" bindonce ng-repeat="m in menus" ng-show="m.link !== undefined && m.link !== null" bo-href="{{m.link}}">' +
                    '<a></a></li></ul><ul><li class="clickable-background-black" id="' + attrs.menuid + '-close" ><a>Annuler</a></li></ul></div></div>';
                var e = $compile(template)(scope);
                element.replaceWith(e);
              
            },
            controller: function ($scope, $rootScope) {
              //$rootScope.$on('$locationChangeSuccess', function () {
                //    Wdo.animateTranslate($('#menu'), '-100px', true, false);
                //    Wdo.animateFade($('#blackout'));
                //});
            }
        };
    });
})(angular);