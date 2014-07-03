(function (angular, navigator) {
    'use strict';

    angular.module('switch-button', [])
    .directive('switch', function () {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            scope: false,
            template: 
                '<div class="onoffswitch">'
                +'    <input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="myonoffswitch" checked>'
                +'    <label class="onoffswitch-label" for="myonoffswitch">'
                +'        <div class="onoffswitch-inner"></div>'
                +'        <div class="onoffswitch-switch"></div>'
                +'    </label>'
                +'</div>',
        controller: function ($scope, $rootScope) {

        }
    };
});
})(angular, navigator);