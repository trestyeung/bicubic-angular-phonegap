angular.module('twoHouses.services', [])
    .service('uiService', ['$timeout', '$filter', function ($timeout, $filter) {
        return {
            //Creates the camera menu + functions needed to take a picture from the camera or pictures library
            attachOnOffSwitch: function ($scope, $element, changedCallBack) {
                $element.on('touchend', function (e) {
                    if ($scope.readonly)
                        return;

                    var $e = $(e.currentTarget);

                    $e.find('.onoffswitch-label .onoffswitch-inner').toggleClass('checked');
                    $e.find('.onoffswitch-label .onoffswitch-switch').toggleClass('checked');

                    changedCallBack();
                });
            },
            //Provides a native device alert popup
            alert: function (message, title, closeButtonTitle, callback) {
                navigator.notification.alert(message, callback, title, closeButtonTitle);
            }
        };
    }]);