angular.module('bicubic.loadedContent', [])
    .directive('loadedContent', ['$timeout', function ($timeout) {
        return {
            restrict: 'EA',
            replace: false,
            scope: false,
            link: function ($scope, $element, $attrs) {

                var $spinnerContainer = $('<div id="loading-bar-spinner" class="loading-bar-spinner" ></div>');
                var $spinner = $('<div class="spinner-main" style="display: block;"></div>');

                $spinnerContainer.append($spinner);

                var hideLoader = $scope.$watch('hideLoader', function (n, o) {
                    if (n !== undefined) {
                        if (n === true) {
                            if ($element.hasClass('hidden-opacity-quick')) {
                                $element.removeClass('hidden-opacity-quick').addClass('show-opacity-quick');
                            } else {
                                $element.removeClass('hidden-opacity').addClass('show-opacity');
                            }
                            $spinnerContainer.hide();
                        } else {
                            $element.removeClass('show-opacity').addClass('hidden-opacity');
                            $spinnerContainer.show();
                        }
                    }
                });

                $element.addClass('hidden-opacity');

                $element.before($spinnerContainer);

                $scope.$on('$destroy', function () {
                    $spinner = null;
                    $spinnerContainer = null;
                    hideLoader();
                });


            }
        };
    }]);