angular.module('bicubic.localeService', [])
    .factory('getLocaleName', [
        '$q',
        '$timeout',
        function ($q, $timeout) {
            return function () {
                var deferred = $q.defer();

                if (navigator.globalization) {
                    navigator.globalization.getLocaleName(
                        function (locale) {
                            deferred.resolve(locale.value);
                        },
                        function () {
                            deferred.reject('Error getting locale.');
                        });
                }
                else {
                    $timeout(function () {
                        deferred.resolve('en-US');
                    }, 1);
                }
                return deferred.promise;
            };
        }
    ])
    .factory('getTimeZone', [
        '$q',
        '$timeout',
        function ($q, $timeout) {
            return function () {
                var deferred = $q.defer();

                if (navigator.globalization) {
                    navigator.globalization.getLocaleName(
                        function (locale) {
                            deferred.resolve(locale.value);
                        },
                        function () {
                            deferred.reject('Error getting locale.');
                        });
                }
                else {
                    $timeout(function () {
                        deferred.resolve('en-US');
                    }, 1);
                }
                return deferred.promise;
            };
        }
    ]);