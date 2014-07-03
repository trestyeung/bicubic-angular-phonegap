/**
 * Adjustable text area
 * Expands text area as content growing
 */
angular.module('bicubic.adjustableTextArea', [])
    .directive('bcAdjustableTextArea', function () {
        return {
            restrict: 'A',
            replace: true,
            link: function ($scope, $element) {

                var onChange = function () {
                    textAreaAdjust($element)
                };

                $element.bind('change keyup input', onChange);

                function textAreaAdjust(o) {
                    o.height("1px");
                    o.height((5 + o.prop("scrollHeight")) + "px");
                }

                $scope.$on('$destroy', function () {
                    $element.unbind('change keyup input', onChange);
                    $element = null;
                });
            }
        };
    });