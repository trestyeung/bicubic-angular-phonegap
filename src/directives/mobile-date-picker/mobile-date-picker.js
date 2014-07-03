angular.module('bicubic.mobileDatePicker', [])
    .directive('bcMobileDatePicker', ['$timeout', function ($timeout) {
        return {
            restrict: 'EA',
            replace: false,
            scope: {
                value: '=',
                type: '@', //Values: "date" / "time" / "datetime"
                readonly: '=',
                isSaving: '='
            },
            link: function ($scope, $element) {
                var mode = $scope.type || 'date';

                var onTouchend = function (event) {
                    if ($scope.readonly || $scope.isSaving)
                        return;

                    event.stopImmediatePropagation();
                    var options = {
                        date: new Date($scope.value) || new Date(),
                        mode: mode
                    };

                    if (typeof(datePicker) !== 'undefined') {
                        if (options.mode === 'date' || options.mode === 'time') {
                            datePicker.show(options, function (date) {
                                $timeout(function () {
                                    $scope.value = new Date(date);
                                }, 50, true);
                            });
                        } else if (options.mode === 'datetime') {

                            options.mode = 'date';
                            var parsedDate;

                            datePicker.show(options, function (date) {
                                $timeout(function () {
                                    parsedDate = new Date(date);
                                    $scope.value = parsedDate;
                                    options.mode = 'time';
                                    options.date = $scope.value;
                                    datePicker.show(options, function (date) {
                                        $timeout(function () {
                                            var time = _.getTime(date);
                                            $scope.value.setHours(time.hh);
                                            $scope.value.setMinutes(time.mm);
                                            $scope.value.setSeconds(time.ss);
                                        }, 50, true);
                                    });
                                }, 50, true);
                            });
                        }
                    } else {
                        var date = prompt("Date fallback");
                        if (date != null) {
                            $scope.$apply(function () {
                                $scope.value = new Date(date);
                            });
                        }
                    }
                };

                $element.on('touchend', '*', onTouchend);

                $scope.$on('$destroy', function () {
                    $element.off('touchend', '*', onTouchend);
                });
            }
        };
    }]);