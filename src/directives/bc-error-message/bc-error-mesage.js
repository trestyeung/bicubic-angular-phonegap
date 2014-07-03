angular.module('bicubic.errorMessage', [])
.directive('bcErrorMessage', function () {
    return {
        require: 'ngModel',
        link: function (scope, elem, attr, ngModel) {

            scope.$evalAsync(function () {
                ngModel.$messages = [];

                var requiredMessage = attr.requiredMessage;

                if(requiredMessage){
                    ngModel.$messages.push(requiredMessage)
                }
            });
        }
    };
});
