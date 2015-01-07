(function (angular) {
    'use strict';
    angular.module('repeater-rendered', [])
        .directive('onRepeaterRendered', function () {
            return {
                restrict: 'A',
                link: function (scope) {

                    if (scope.$last === true) {
                        //scope.$evalAsync(function () {
                            scope.$emit('ngRepeatFinished');
                        //});
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