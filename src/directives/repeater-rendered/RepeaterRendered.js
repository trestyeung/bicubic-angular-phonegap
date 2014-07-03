(function (angular) {
    'use strict';
    angular.module('repeater-rendered', [])
        .directive('onFinishRenderFilters', function ($timeout) {
            return {
                restrict: 'A',
                link: function (scope, element, attr) {
                    if (scope.$last === true) {
                        $timeout(function () {
                            scope.$emit('ngRepeatFinished');
                        });
                    }
                }
            }
        })
        .directive('onViewRendered', function () {
            return {
                restrict: 'E',
                link: function (scope, element, attr) {

                    var viewName = attr.viewName || '';

                    scope.$evalAsync(function () {
                        scope.$emit('viewRendered', {viewName: viewName});
                    });
                }
            }
        });
})(angular);